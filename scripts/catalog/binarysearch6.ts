/**
 * Binary search problems — wave 6.
 * Real problems only: LeetCode numbered classics (plus named GFG staples where
 * noted). Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Several originals return a 64-bit value; their constraints are tightened (and
 * say so in the statement) so every answer fits in a signed 32-bit integer —
 * the judge passes and prints int32 only. Solutions still accumulate in 64-bit
 * wherever an intermediate could overflow.
 */
import {
  code, describe, explain, fmtIntArr, fmtIntMat, pick, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const BINARYSEARCH6_PROBLEMS: CatalogProblem[] = [

  // ── Heaters (LC 475) ────────────────────────────────────────────
  (() => {
    const ref = (houses: number[], heaters: number[]) => {
      let best = 0;
      for (const h of houses) {
        let d = Infinity;
        for (const t of heaters) d = Math.min(d, Math.abs(h - t));
        best = Math.max(best, d);
      }
      return best;
    };
    return {
      slug: "heaters",
      title: "Heaters",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Sorting", "Two Pointers", "Google", "Amazon", "Microsoft"],
      signature: {
        funcName: "findRadius",
        params: [{ name: "houses", type: "int[]" as const }, { name: "heaters", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Houses and heaters stand at integer positions on a straight road: `houses[i]` is the position of a house and `heaters[j]` the position of a heater. Neither array is sorted, and a position may appear more than once.\n\nEvery heater is set to the **same** warming radius `r`: a heater at `p` warms every house whose position lies in `[p - r, p + r]`.\n\nReturn the **smallest** non-negative integer radius that warms every house.",
        [
          { in: "houses = [1,5], heaters = [2]", out: "3", note: "The single heater must reach the house at 5, three steps away." },
          { in: "houses = [3,9,14], heaters = [12,4]", out: "3", note: "House 3 is 1 from heater 4, house 9 is 3 from heater 12 and house 14 is 2 from heater 12; the worst house needs 3." },
          { in: "houses = [7], heaters = [7]", out: "0" },
        ],
        ["1 <= houses.length, heaters.length <= 3 * 10^4", "1 <= houses[i], heaters[j] <= 10^9"]),
      hints: [
        "The radius has to cover the house that is farthest from its nearest heater, so the answer is a maximum over houses of a minimum over heaters.",
        "For one house only two heaters matter: the closest one at or to its right and the closest one to its left.",
        "Sort the heaters and binary-search each house's insertion point; take the smaller of the two neighbouring distances.",
      ],
      editorial: explain({
        idea: "The minimum radius equals the largest distance from any house to its nearest heater. With the heaters sorted, a house's nearest heater is one of the two that bracket its position, which binary search finds in logarithmic time.",
        steps: [
          "Sort a copy of `heaters`.",
          "For each house at `x`, find the first heater index `i` with `heaters[i] >= x` (lower bound).",
          "The house's distance is the smaller of `heaters[i] - x` (if `i` is in range) and `x - heaters[i - 1]` (if `i > 0`).",
          "Return the maximum of these distances over all houses.",
        ],
        why: "A radius `r` warms a house exactly when some heater lies within `r` of it, i.e. when `r` is at least the house's nearest-heater distance. So `r` works for all houses precisely when it is at least the largest of those distances, and that largest distance is the minimum. Among heaters on the right of `x` the first is the closest, and among those on the left the last is the closest, so the two bracketing heaters are the only candidates.",
        time: "O((n + m) log m)",
        space: "O(m) for the sorted copy",
        pitfalls: [
          "A house to the left of every heater (or right of every heater) has only one neighbour — guard both indices.",
          "Houses do not need sorting for the binary-search version; only the heaters do.",
          "The answer is a maximum of minima — taking the minimum over all pairs answers a different question.",
        ],
      }),
      examples: [
        { input: "[1,5]\n[2]", expectedOutput: "3" },
        { input: "[3,9,14]\n[12,4]", expectedOutput: "3" },
        { input: "[7]\n[7]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [5, 50, 1000, 1000000000]);
        const n = ri(rng, 1, pick(rng, [1, 6, 25]));
        const m = ri(rng, 1, pick(rng, [1, 6, 25]));
        const houses = Array.from({ length: n }, () => ri(rng, 1, span));
        const heaters = Array.from({ length: m }, () => ri(rng, 1, span));
        return { input: `${fmtIntArr(houses)}\n${fmtIntArr(heaters)}`, expectedOutput: String(ref(houses, heaters)) };
      },
      solutions: {
        python: code`
          from typing import List
          import bisect

          def findRadius(houses: List[int], heaters: List[int]) -> int:
              hs = sorted(heaters)
              best = 0
              for x in houses:
                  i = bisect.bisect_left(hs, x)
                  d = 1 << 31
                  if i < len(hs):
                      d = hs[i] - x
                  if i > 0:
                      d = min(d, x - hs[i - 1])
                  best = max(best, d)
              return best
        `,
        javascript: code`
          var findRadius = function(houses, heaters) {
              var hs = heaters.slice().sort(function(a, b) { return a - b; });
              var best = 0;
              for (var i = 0; i < houses.length; i++) {
                  var x = houses[i];
                  var lo = 0, hi = hs.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (hs[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  var d = 2147483647;
                  if (lo < hs.length) d = hs[lo] - x;
                  if (lo > 0 && x - hs[lo - 1] < d) d = x - hs[lo - 1];
                  if (d > best) best = d;
              }
              return best;
          };
        `,
        typescript: code`
          function findRadius(houses: number[], heaters: number[]): number {
              var hs: number[] = heaters.slice();
              hs.sort(function(a, b) { return a - b; });
              var best = 0;
              for (var i = 0; i < houses.length; i++) {
                  var x = houses[i];
                  var lo = 0, hi = hs.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (hs[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  var d = 2147483647;
                  if (lo < hs.length) d = hs[lo] - x;
                  if (lo > 0 && x - hs[lo - 1] < d) d = x - hs[lo - 1];
                  if (d > best) best = d;
              }
              return best;
          }
        `,
        java: code`
          public static int findRadius(int[] houses, int[] heaters) {
              int[] hs = heaters.clone();
              Arrays.sort(hs);
              int best = 0;
              for (int x : houses) {
                  int lo = 0, hi = hs.length;
                  while (lo < hi) {
                      int mid = (lo + hi) >>> 1;
                      if (hs[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  int d = Integer.MAX_VALUE;
                  if (lo < hs.length) d = hs[lo] - x;
                  if (lo > 0) d = Math.min(d, x - hs[lo - 1]);
                  best = Math.max(best, d);
              }
              return best;
          }
        `,
        cpp: code`
          int findRadius(vector<int>& houses, vector<int>& heaters) {
              vector<int> hs(heaters);
              sort(hs.begin(), hs.end());
              int best = 0;
              for (int x : houses) {
                  int i = lower_bound(hs.begin(), hs.end(), x) - hs.begin();
                  int d = INT_MAX;
                  if (i < (int)hs.size()) d = hs[i] - x;
                  if (i > 0) d = min(d, x - hs[i - 1]);
                  best = max(best, d);
              }
              return best;
          }
        `,
        c: code`
          static int heaterCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int findRadius(int* houses, int housesSize, int* heaters, int heatersSize) {
              int* hs = (int*)malloc(sizeof(int) * heatersSize);
              for (int i = 0; i < heatersSize; i++) hs[i] = heaters[i];
              qsort(hs, heatersSize, sizeof(int), heaterCmp);
              int best = 0;
              for (int i = 0; i < housesSize; i++) {
                  int x = houses[i];
                  int lo = 0, hi = heatersSize;
                  while (lo < hi) {
                      int mid = lo + (hi - lo) / 2;
                      if (hs[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  int d = 2147483647;
                  if (lo < heatersSize) d = hs[lo] - x;
                  if (lo > 0 && x - hs[lo - 1] < d) d = x - hs[lo - 1];
                  if (d > best) best = d;
              }
              free(hs);
              return best;
          }
        `,
        csharp: code`
          public static int FindRadius(int[] houses, int[] heaters)
          {
              int[] hs = (int[])heaters.Clone();
              Array.Sort(hs);
              int best = 0;
              foreach (int x in houses)
              {
                  int lo = 0, hi = hs.Length;
                  while (lo < hi)
                  {
                      int mid = lo + (hi - lo) / 2;
                      if (hs[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  int d = int.MaxValue;
                  if (lo < hs.Length) d = hs[lo] - x;
                  if (lo > 0) d = Math.Min(d, x - hs[lo - 1]);
                  best = Math.Max(best, d);
              }
              return best;
          }
        `,
        go: code`
          func findRadius(houses []int, heaters []int) int {
              hs := make([]int, len(heaters))
              copy(hs, heaters)
              sort.Ints(hs)
              best := 0
              for _, x := range houses {
                  lo, hi := 0, len(hs)
                  for lo < hi {
                      mid := (lo + hi) / 2
                      if hs[mid] < x {
                          lo = mid + 1
                      } else {
                          hi = mid
                      }
                  }
                  d := 1 << 40
                  if lo < len(hs) {
                      d = hs[lo] - x
                  }
                  if lo > 0 && x-hs[lo-1] < d {
                      d = x - hs[lo-1]
                  }
                  if d > best {
                      best = d
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun findRadius(houses: IntArray, heaters: IntArray): Int {
              val hs = heaters.sortedArray()
              var best = 0
              for (x in houses) {
                  var lo = 0
                  var hi = hs.size
                  while (lo < hi) {
                      val mid = (lo + hi) / 2
                      if (hs[mid] < x) lo = mid + 1 else hi = mid
                  }
                  var d = Int.MAX_VALUE
                  if (lo < hs.size) d = hs[lo] - x
                  if (lo > 0) d = minOf(d, x - hs[lo - 1])
                  best = maxOf(best, d)
              }
              return best
          }
        `,
        swift: code`
          func findRadius(_ houses: [Int], _ heaters: [Int]) -> Int {
              let hs = heaters.sorted()
              var best = 0
              for x in houses {
                  var lo = 0
                  var hi = hs.count
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if hs[mid] < x { lo = mid + 1 } else { hi = mid }
                  }
                  var d = Int.max
                  if lo < hs.count { d = hs[lo] - x }
                  if lo > 0 { d = min(d, x - hs[lo - 1]) }
                  best = max(best, d)
              }
              return best
          }
        `,
        rust: code`
          fn findRadius(houses: Vec<i32>, heaters: Vec<i32>) -> i32 {
              let mut hs = heaters;
              hs.sort();
              let mut best = 0;
              for &x in houses.iter() {
                  let mut lo = 0usize;
                  let mut hi = hs.len();
                  while lo < hi {
                      let mid = (lo + hi) / 2;
                      if hs[mid] < x { lo = mid + 1; } else { hi = mid; }
                  }
                  let mut d = std::i32::MAX;
                  if lo < hs.len() { d = hs[lo] - x; }
                  if lo > 0 && x - hs[lo - 1] < d { d = x - hs[lo - 1]; }
                  if d > best { best = d; }
              }
              best
          }
        `,
        php: code`
          function findRadius($houses, $heaters) {
              $hs = $heaters;
              sort($hs);
              $m = count($hs);
              $best = 0;
              foreach ($houses as $x) {
                  $lo = 0;
                  $hi = $m;
                  while ($lo < $hi) {
                      $mid = intdiv($lo + $hi, 2);
                      if ($hs[$mid] < $x) $lo = $mid + 1; else $hi = $mid;
                  }
                  $d = PHP_INT_MAX;
                  if ($lo < $m) $d = $hs[$lo] - $x;
                  if ($lo > 0 && $x - $hs[$lo - 1] < $d) $d = $x - $hs[$lo - 1];
                  if ($d > $best) $best = $d;
              }
              return $best;
          }
        `,
        ruby: code`
          def findRadius(houses, heaters)
            hs = heaters.sort
            best = 0
            houses.each do |x|
              i = hs.bsearch_index { |v| v >= x } || hs.length
              d = 1 << 40
              d = hs[i] - x if i < hs.length
              d = [d, x - hs[i - 1]].min if i > 0
              best = d if d > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Sum of Mutated Array Closest to Target (LC 1300) ────────────
  (() => {
    const ref = (arr: number[], target: number) => {
      const mx = Math.max(...arr);
      const cnt = new Array(mx + 2).fill(0);
      for (const a of arr) cnt[a]++;
      let ge = arr.length; // values >= v, for v = 1
      let s = 0; // capped sum at v = 0
      let best = 0, bestDiff = Math.abs(target);
      for (let v = 1; v <= mx; v++) {
        s += ge;
        const d = Math.abs(s - target);
        if (d < bestDiff) { bestDiff = d; best = v; }
        ge -= cnt[v];
      }
      return best;
    };
    return {
      slug: "sum-of-mutated-array-closest-to-target",
      title: "Sum of Mutated Array Closest to Target",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Sorting", "Google", "Amazon"],
      signature: {
        funcName: "findBestValue",
        params: [{ name: "arr", type: "int[]" as const }, { name: "target", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Pick a non-negative integer `value`. Every element of `arr` that is **greater** than `value` is lowered to `value`; the others stay as they are. This gives a capped sum for that `value`.\n\nReturn the `value` whose capped sum is **closest** to `target` (smallest absolute difference). If two values tie, return the **smaller** one.\n\n`value` does not have to be an element of `arr` — it may even be `0`.",
        [
          { in: "arr = [6,2,9], target = 12", out: "5", note: "Capping at 5 gives 5 + 2 + 5 = 12 exactly." },
          { in: "arr = [1,1,1], target = 1", out: "0", note: "Capping at 0 gives 0 (off by 1); capping at 1 gives 3 (off by 2)." },
          { in: "arr = [3,8,5], target = 30", out: "8", note: "Even uncapped the sum is 16, and any value of 8 or more gives that sum — 8 is the smallest." },
        ],
        ["1 <= arr.length <= 10^4", "1 <= arr[i], target <= 10^5"]),
      hints: [
        "As `value` grows, the capped sum never decreases — it is a monotone function of `value`.",
        "Values above `max(arr)` change nothing, so the search range is `[0, max(arr)]`.",
        "Binary-search the smallest `value` whose capped sum reaches `target`; the answer is that value or the one just below it.",
      ],
      editorial: explain({
        idea: "The capped sum `S(v) = Σ min(arr[i], v)` is strictly increasing on `[0, max(arr)]`, so the point where it crosses `target` can be binary-searched, and the closest sum sits on one side of the crossing or the other.",
        steps: [
          "Let `hi = max(arr)`. If `S(hi) < target`, no cap reaches the target and `hi` (the smallest value giving the full sum) is the answer.",
          "Otherwise binary-search the smallest `v` in `[1, hi]` with `S(v) >= target`.",
          "Compare `target - S(v - 1)` with `S(v) - target`; return `v - 1` when it is not larger (the tie goes to the smaller value), otherwise `v`.",
        ],
        why: "Raising `v` by one adds one for every element that is at least `v`, so `S` strictly increases until `v` reaches the maximum and is flat afterwards. Every `u < v - 1` has `S(u) < S(v - 1) < target`, so it is farther from the target than `v - 1`; every `u > v` has `S(u) >= S(v) >= target`, so it is no closer than `v` and loses ties as the larger value. Only `v - 1` and `v` remain.",
        time: "O(n log M) with M = max(arr)",
        space: "O(1)",
        pitfalls: [
          "The answer can be 0 when the array is long and the target is tiny — start the range at 0, not at 1 or `min(arr)`.",
          "On a tie the smaller value wins.",
          "If the full sum is below the target, the answer is `max(arr)`, not some larger number.",
        ],
      }),
      examples: [
        { input: "[6,2,9]\n12", expectedOutput: "5" },
        { input: "[1,1,1]\n1", expectedOutput: "0" },
        { input: "[3,8,5]\n30", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 30]));
        const vmax = pick(rng, [3, 20, 300, 3000, 100000]);
        const arr = Array.from({ length: n }, () => ri(rng, 1, vmax));
        const sum = arr.reduce((a, b) => a + b, 0);
        const target = Math.min(100000, ri(rng, 1, pick(rng, [n, sum, sum + vmax])));
        return { input: `${fmtIntArr(arr)}\n${target}`, expectedOutput: String(ref(arr, target)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findBestValue(arr: List[int], target: int) -> int:
              def capped(v):
                  return sum(a if a < v else v for a in arr)
              hi = max(arr)
              if capped(hi) < target:
                  return hi
              lo = 1
              while lo < hi:
                  mid = (lo + hi) // 2
                  if capped(mid) >= target:
                      hi = mid
                  else:
                      lo = mid + 1
              below = target - capped(lo - 1)
              above = capped(lo) - target
              return lo - 1 if below <= above else lo
        `,
        javascript: code`
          var findBestValue = function(arr, target) {
              var capped = function(v) {
                  var s = 0;
                  for (var i = 0; i < arr.length; i++) s += arr[i] < v ? arr[i] : v;
                  return s;
              };
              var hi = 0;
              for (var i = 0; i < arr.length; i++) if (arr[i] > hi) hi = arr[i];
              if (capped(hi) < target) return hi;
              var lo = 1;
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (capped(mid) >= target) hi = mid; else lo = mid + 1;
              }
              var below = target - capped(lo - 1);
              var above = capped(lo) - target;
              return below <= above ? lo - 1 : lo;
          };
        `,
        typescript: code`
          function findBestValue(arr: number[], target: number): number {
              var capped = function(v: number): number {
                  var s = 0;
                  for (var i = 0; i < arr.length; i++) s += arr[i] < v ? arr[i] : v;
                  return s;
              };
              var hi = 0;
              for (var j = 0; j < arr.length; j++) if (arr[j] > hi) hi = arr[j];
              if (capped(hi) < target) return hi;
              var lo = 1;
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (capped(mid) >= target) hi = mid; else lo = mid + 1;
              }
              var below = target - capped(lo - 1);
              var above = capped(lo) - target;
              return below <= above ? lo - 1 : lo;
          }
        `,
        java: code`
          public static int findBestValue(int[] arr, int target) {
              int hi = 0;
              for (int a : arr) hi = Math.max(hi, a);
              if (cappedSum(arr, hi) < target) return hi;
              int lo = 1;
              while (lo < hi) {
                  int mid = (lo + hi) >>> 1;
                  if (cappedSum(arr, mid) >= target) hi = mid; else lo = mid + 1;
              }
              int below = target - cappedSum(arr, lo - 1);
              int above = cappedSum(arr, lo) - target;
              return below <= above ? lo - 1 : lo;
          }

          static int cappedSum(int[] arr, int v) {
              int s = 0;
              for (int a : arr) s += Math.min(a, v);
              return s;
          }
        `,
        cpp: code`
          int cappedSum(const vector<int>& arr, int v) {
              int s = 0;
              for (int a : arr) s += min(a, v);
              return s;
          }

          int findBestValue(vector<int>& arr, int target) {
              int hi = *max_element(arr.begin(), arr.end());
              if (cappedSum(arr, hi) < target) return hi;
              int lo = 1;
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (cappedSum(arr, mid) >= target) hi = mid; else lo = mid + 1;
              }
              int below = target - cappedSum(arr, lo - 1);
              int above = cappedSum(arr, lo) - target;
              return below <= above ? lo - 1 : lo;
          }
        `,
        c: code`
          static int cappedSum(int* arr, int n, int v) {
              int s = 0;
              for (int i = 0; i < n; i++) s += arr[i] < v ? arr[i] : v;
              return s;
          }

          int findBestValue(int* arr, int arrSize, int target) {
              int hi = 0;
              for (int i = 0; i < arrSize; i++) if (arr[i] > hi) hi = arr[i];
              if (cappedSum(arr, arrSize, hi) < target) return hi;
              int lo = 1;
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (cappedSum(arr, arrSize, mid) >= target) hi = mid; else lo = mid + 1;
              }
              int below = target - cappedSum(arr, arrSize, lo - 1);
              int above = cappedSum(arr, arrSize, lo) - target;
              return below <= above ? lo - 1 : lo;
          }
        `,
        csharp: code`
          public static int FindBestValue(int[] arr, int target)
          {
              int hi = 0;
              foreach (int a in arr) if (a > hi) hi = a;
              if (CappedSum(arr, hi) < target) return hi;
              int lo = 1;
              while (lo < hi)
              {
                  int mid = lo + (hi - lo) / 2;
                  if (CappedSum(arr, mid) >= target) hi = mid; else lo = mid + 1;
              }
              int below = target - CappedSum(arr, lo - 1);
              int above = CappedSum(arr, lo) - target;
              return below <= above ? lo - 1 : lo;
          }

          static int CappedSum(int[] arr, int v)
          {
              int s = 0;
              foreach (int a in arr) s += a < v ? a : v;
              return s;
          }
        `,
        go: code`
          func findBestValue(arr []int, target int) int {
              capped := func(v int) int {
                  s := 0
                  for _, a := range arr {
                      if a < v {
                          s += a
                      } else {
                          s += v
                      }
                  }
                  return s
              }
              hi := 0
              for _, a := range arr {
                  if a > hi {
                      hi = a
                  }
              }
              if capped(hi) < target {
                  return hi
              }
              lo := 1
              for lo < hi {
                  mid := (lo + hi) / 2
                  if capped(mid) >= target {
                      hi = mid
                  } else {
                      lo = mid + 1
                  }
              }
              below := target - capped(lo-1)
              above := capped(lo) - target
              if below <= above {
                  return lo - 1
              }
              return lo
          }
        `,
        kotlin: code`
          fun findBestValue(arr: IntArray, target: Int): Int {
              fun capped(v: Int): Int {
                  var s = 0
                  for (a in arr) s += if (a < v) a else v
                  return s
              }
              var hi = 0
              for (a in arr) if (a > hi) hi = a
              if (capped(hi) < target) return hi
              var lo = 1
              while (lo < hi) {
                  val mid = (lo + hi) / 2
                  if (capped(mid) >= target) hi = mid else lo = mid + 1
              }
              val below = target - capped(lo - 1)
              val above = capped(lo) - target
              return if (below <= above) lo - 1 else lo
          }
        `,
        swift: code`
          func findBestValue(_ arr: [Int], _ target: Int) -> Int {
              func capped(_ v: Int) -> Int {
                  var s = 0
                  for a in arr { s += a < v ? a : v }
                  return s
              }
              var hi = 0
              for a in arr { if a > hi { hi = a } }
              if capped(hi) < target { return hi }
              var lo = 1
              while lo < hi {
                  let mid = (lo + hi) / 2
                  if capped(mid) >= target { hi = mid } else { lo = mid + 1 }
              }
              let below = target - capped(lo - 1)
              let above = capped(lo) - target
              return below <= above ? lo - 1 : lo
          }
        `,
        rust: code`
          fn findBestValue(arr: Vec<i32>, target: i32) -> i32 {
              let capped = |v: i32| -> i64 {
                  let mut s: i64 = 0;
                  for &a in arr.iter() {
                      s += if a < v { a as i64 } else { v as i64 };
                  }
                  s
              };
              let t = target as i64;
              let mut hi = 0;
              for &a in arr.iter() {
                  if a > hi { hi = a; }
              }
              if capped(hi) < t { return hi; }
              let mut lo = 1;
              while lo < hi {
                  let mid = lo + (hi - lo) / 2;
                  if capped(mid) >= t { hi = mid; } else { lo = mid + 1; }
              }
              let below = t - capped(lo - 1);
              let above = capped(lo) - t;
              if below <= above { lo - 1 } else { lo }
          }
        `,
        php: code`
          function cappedSumOf($arr, $v) {
              $s = 0;
              foreach ($arr as $a) $s += $a < $v ? $a : $v;
              return $s;
          }

          function findBestValue($arr, $target) {
              $hi = 0;
              foreach ($arr as $a) if ($a > $hi) $hi = $a;
              if (cappedSumOf($arr, $hi) < $target) return $hi;
              $lo = 1;
              while ($lo < $hi) {
                  $mid = intdiv($lo + $hi, 2);
                  if (cappedSumOf($arr, $mid) >= $target) $hi = $mid; else $lo = $mid + 1;
              }
              $below = $target - cappedSumOf($arr, $lo - 1);
              $above = cappedSumOf($arr, $lo) - $target;
              return $below <= $above ? $lo - 1 : $lo;
          }
        `,
        ruby: code`
          def findBestValue(arr, target)
            capped = lambda { |v| arr.sum { |a| a < v ? a : v } }
            hi = arr.max
            return hi if capped.call(hi) < target
            lo = 1
            while lo < hi
              mid = (lo + hi) / 2
              if capped.call(mid) >= target
                hi = mid
              else
                lo = mid + 1
              end
            end
            below = target - capped.call(lo - 1)
            above = capped.call(lo) - target
            below <= above ? lo - 1 : lo
          end
        `,
      },
    };
  })(),

  // ── Maximum Side Length of a Square with Sum ≤ Threshold (LC 1292) ──
  (() => {
    const ref = (mat: number[][], threshold: number) => {
      const m = mat.length, n = mat[0].length;
      for (let k = Math.min(m, n); k >= 1; k--) {
        for (let i = 0; i + k <= m; i++) {
          for (let j = 0; j + k <= n; j++) {
            let s = 0;
            for (let a = i; a < i + k; a++) for (let b = j; b < j + k; b++) s += mat[a][b];
            if (s <= threshold) return k;
          }
        }
      }
      return 0;
    };
    return {
      slug: "maximum-side-length-of-a-square-with-sum-less-than-or-equal-to-threshold",
      title: "Maximum Side Length of a Square with Sum Less than or Equal to Threshold",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Matrix", "Prefix Sum", "Google", "Amazon"],
      signature: {
        funcName: "maxSideLength",
        params: [{ name: "mat", type: "int[][]" as const }, { name: "threshold", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an `m x n` grid `mat` of non-negative integers and an integer `threshold`.\n\nA square is any `k x k` block of adjacent cells (`k >= 1`). Return the largest side length `k` such that at least one `k x k` square has a cell sum of **at most** `threshold`. Return `0` if even a single cell exceeds the threshold everywhere.",
        [
          { in: "mat = [[2,2,5],[2,2,5],[5,5,5]], threshold = 8", out: "2", note: "The top-left 2 x 2 block sums to 8; the whole 3 x 3 grid sums to 33." },
          { in: "mat = [[2,3],[4,5]], threshold = 1", out: "0" },
          { in: "mat = [[1,1,1],[1,1,1],[1,1,1]], threshold = 9", out: "3" },
        ],
        ["1 <= m, n <= 300", "0 <= mat[i][j] <= 10^4", "0 <= threshold <= 10^5"]),
      hints: [
        "With a 2-D prefix-sum table, the sum of any square is four lookups.",
        "If some `k x k` square fits under the threshold, a `(k - 1) x (k - 1)` square inside it does too — values are non-negative.",
        "That monotonicity lets you binary-search `k`, checking every placement of a `k x k` square per step.",
      ],
      editorial: explain({
        idea: "Precompute 2-D prefix sums so any square's sum costs O(1). Feasibility of side `k` is monotone (shrinking a square never raises its sum), so binary-search the largest feasible `k`.",
        steps: [
          "Build `P[i][j]` = sum of `mat[0..i-1][0..j-1]` for `0 <= i <= m`, `0 <= j <= n`.",
          "The square with top-left `(i, j)` and side `k` sums to `P[i+k][j+k] - P[i][j+k] - P[i+k][j] + P[i][j]`.",
          "`fits(k)`: true if any placement of a `k x k` square sums to at most `threshold`.",
          "Binary-search `k` in `[0, min(m, n)]`, moving up when `fits(mid)` holds; `k = 0` always fits.",
        ],
        why: "Every cell is non-negative, so a sub-square of a fitting square also fits: the predicate `fits(k)` is true up to some largest `k` and false after it. Binary search on such a predicate lands exactly on that boundary, and the prefix-sum identity is inclusion–exclusion over four rectangles anchored at the origin.",
        time: "O(m · n · log(min(m, n)))",
        space: "O(m · n)",
        pitfalls: [
          "Use the upper-middle `(lo + hi + 1) / 2` when moving `lo = mid`, or the loop never ends.",
          "Return 0, not 1, when every single cell is above the threshold.",
          "Off-by-one in the prefix table: give it an extra zero row and column.",
        ],
      }),
      examples: [
        { input: "[[2,2,5],[2,2,5],[5,5,5]]\n8", expectedOutput: "2" },
        { input: "[[2,3],[4,5]]\n1", expectedOutput: "0" },
        { input: "[[1,1,1],[1,1,1],[1,1,1]]\n9", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 3, 8]));
        const n = ri(rng, 1, pick(rng, [1, 3, 8]));
        const cell = pick(rng, [1, 5, 50, 10000]);
        const mat = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 0, cell)));
        const threshold = Math.min(100000, ri(rng, 0, cell * pick(rng, [1, 4, 16, 64])));
        return { input: `${fmtIntMat(mat)}\n${threshold}`, expectedOutput: String(ref(mat, threshold)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxSideLength(mat: List[List[int]], threshold: int) -> int:
              m, n = len(mat), len(mat[0])
              P = [[0] * (n + 1) for _ in range(m + 1)]
              for i in range(m):
                  for j in range(n):
                      P[i + 1][j + 1] = P[i][j + 1] + P[i + 1][j] - P[i][j] + mat[i][j]

              def fits(k):
                  for i in range(m - k + 1):
                      for j in range(n - k + 1):
                          if P[i + k][j + k] - P[i][j + k] - P[i + k][j] + P[i][j] <= threshold:
                              return True
                  return False

              lo, hi = 0, min(m, n)
              while lo < hi:
                  mid = (lo + hi + 1) // 2
                  if fits(mid):
                      lo = mid
                  else:
                      hi = mid - 1
              return lo
        `,
        javascript: code`
          var maxSideLength = function(mat, threshold) {
              var m = mat.length, n = mat[0].length;
              var P = [];
              for (var i = 0; i <= m; i++) P.push(new Array(n + 1).fill(0));
              for (var r = 0; r < m; r++)
                  for (var c = 0; c < n; c++)
                      P[r + 1][c + 1] = P[r][c + 1] + P[r + 1][c] - P[r][c] + mat[r][c];
              var fits = function(k) {
                  for (var a = 0; a + k <= m; a++)
                      for (var b = 0; b + k <= n; b++)
                          if (P[a + k][b + k] - P[a][b + k] - P[a + k][b] + P[a][b] <= threshold) return true;
                  return false;
              };
              var lo = 0, hi = Math.min(m, n);
              while (lo < hi) {
                  var mid = (lo + hi + 1) >> 1;
                  if (fits(mid)) lo = mid; else hi = mid - 1;
              }
              return lo;
          };
        `,
        typescript: code`
          function maxSideLength(mat: number[][], threshold: number): number {
              var m = mat.length, n = mat[0].length;
              var P: number[][] = [];
              for (var i = 0; i <= m; i++) {
                  var row: number[] = [];
                  for (var j = 0; j <= n; j++) row.push(0);
                  P.push(row);
              }
              for (var r = 0; r < m; r++)
                  for (var c = 0; c < n; c++)
                      P[r + 1][c + 1] = P[r][c + 1] + P[r + 1][c] - P[r][c] + mat[r][c];
              var fits = function(k: number): boolean {
                  for (var a = 0; a + k <= m; a++)
                      for (var b = 0; b + k <= n; b++)
                          if (P[a + k][b + k] - P[a][b + k] - P[a + k][b] + P[a][b] <= threshold) return true;
                  return false;
              };
              var lo = 0, hi = Math.min(m, n);
              while (lo < hi) {
                  var mid = (lo + hi + 1) >> 1;
                  if (fits(mid)) lo = mid; else hi = mid - 1;
              }
              return lo;
          }
        `,
        java: code`
          public static int maxSideLength(int[][] mat, int threshold) {
              int m = mat.length, n = mat[0].length;
              int[][] P = new int[m + 1][n + 1];
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      P[i + 1][j + 1] = P[i][j + 1] + P[i + 1][j] - P[i][j] + mat[i][j];
              int lo = 0, hi = Math.min(m, n);
              while (lo < hi) {
                  int mid = (lo + hi + 1) / 2;
                  boolean ok = false;
                  for (int i = 0; i + mid <= m && !ok; i++)
                      for (int j = 0; j + mid <= n; j++)
                          if (P[i + mid][j + mid] - P[i][j + mid] - P[i + mid][j] + P[i][j] <= threshold) { ok = true; break; }
                  if (ok) lo = mid; else hi = mid - 1;
              }
              return lo;
          }
        `,
        cpp: code`
          int maxSideLength(vector<vector<int>>& mat, int threshold) {
              int m = mat.size(), n = mat[0].size();
              vector<vector<int>> P(m + 1, vector<int>(n + 1, 0));
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      P[i + 1][j + 1] = P[i][j + 1] + P[i + 1][j] - P[i][j] + mat[i][j];
              int lo = 0, hi = min(m, n);
              while (lo < hi) {
                  int mid = (lo + hi + 1) / 2;
                  bool ok = false;
                  for (int i = 0; i + mid <= m && !ok; i++)
                      for (int j = 0; j + mid <= n; j++)
                          if (P[i + mid][j + mid] - P[i][j + mid] - P[i + mid][j] + P[i][j] <= threshold) { ok = true; break; }
                  if (ok) lo = mid; else hi = mid - 1;
              }
              return lo;
          }
        `,
        c: code`
          int maxSideLength(int** mat, int matSize, int* matColSize, int threshold) {
              int m = matSize, n = matColSize[0];
              int w = n + 1;
              int* P = (int*)calloc((size_t)(m + 1) * w, sizeof(int));
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      P[(i + 1) * w + j + 1] = P[i * w + j + 1] + P[(i + 1) * w + j] - P[i * w + j] + mat[i][j];
              int lo = 0, hi = m < n ? m : n;
              while (lo < hi) {
                  int mid = (lo + hi + 1) / 2;
                  int ok = 0;
                  for (int i = 0; i + mid <= m && !ok; i++)
                      for (int j = 0; j + mid <= n; j++)
                          if (P[(i + mid) * w + j + mid] - P[i * w + j + mid] - P[(i + mid) * w + j] + P[i * w + j] <= threshold) { ok = 1; break; }
                  if (ok) lo = mid; else hi = mid - 1;
              }
              free(P);
              return lo;
          }
        `,
        csharp: code`
          public static int MaxSideLength(int[][] mat, int threshold)
          {
              int m = mat.Length, n = mat[0].Length;
              int[,] P = new int[m + 1, n + 1];
              for (int i = 0; i < m; i++)
                  for (int j = 0; j < n; j++)
                      P[i + 1, j + 1] = P[i, j + 1] + P[i + 1, j] - P[i, j] + mat[i][j];
              int lo = 0, hi = Math.Min(m, n);
              while (lo < hi)
              {
                  int mid = (lo + hi + 1) / 2;
                  bool ok = false;
                  for (int i = 0; i + mid <= m && !ok; i++)
                      for (int j = 0; j + mid <= n; j++)
                          if (P[i + mid, j + mid] - P[i, j + mid] - P[i + mid, j] + P[i, j] <= threshold) { ok = true; break; }
                  if (ok) lo = mid; else hi = mid - 1;
              }
              return lo;
          }
        `,
        go: code`
          func maxSideLength(mat [][]int, threshold int) int {
              m, n := len(mat), len(mat[0])
              P := make([][]int, m+1)
              for i := range P {
                  P[i] = make([]int, n+1)
              }
              for i := 0; i < m; i++ {
                  for j := 0; j < n; j++ {
                      P[i+1][j+1] = P[i][j+1] + P[i+1][j] - P[i][j] + mat[i][j]
                  }
              }
              fits := func(k int) bool {
                  for i := 0; i+k <= m; i++ {
                      for j := 0; j+k <= n; j++ {
                          if P[i+k][j+k]-P[i][j+k]-P[i+k][j]+P[i][j] <= threshold {
                              return true
                          }
                      }
                  }
                  return false
              }
              lo, hi := 0, m
              if n < hi {
                  hi = n
              }
              for lo < hi {
                  mid := (lo + hi + 1) / 2
                  if fits(mid) {
                      lo = mid
                  } else {
                      hi = mid - 1
                  }
              }
              return lo
          }
        `,
        kotlin: code`
          fun maxSideLength(mat: Array<IntArray>, threshold: Int): Int {
              val m = mat.size
              val n = mat[0].size
              val P = Array(m + 1) { IntArray(n + 1) }
              for (i in 0 until m)
                  for (j in 0 until n)
                      P[i + 1][j + 1] = P[i][j + 1] + P[i + 1][j] - P[i][j] + mat[i][j]
              fun fits(k: Int): Boolean {
                  for (i in 0..m - k)
                      for (j in 0..n - k)
                          if (P[i + k][j + k] - P[i][j + k] - P[i + k][j] + P[i][j] <= threshold) return true
                  return false
              }
              var lo = 0
              var hi = minOf(m, n)
              while (lo < hi) {
                  val mid = (lo + hi + 1) / 2
                  if (fits(mid)) lo = mid else hi = mid - 1
              }
              return lo
          }
        `,
        swift: code`
          func maxSideLength(_ mat: [[Int]], _ threshold: Int) -> Int {
              let m = mat.count
              let n = mat[0].count
              var P = Array(repeating: Array(repeating: 0, count: n + 1), count: m + 1)
              for i in 0..<m {
                  for j in 0..<n {
                      P[i + 1][j + 1] = P[i][j + 1] + P[i + 1][j] - P[i][j] + mat[i][j]
                  }
              }
              func fits(_ k: Int) -> Bool {
                  var i = 0
                  while i + k <= m {
                      var j = 0
                      while j + k <= n {
                          if P[i + k][j + k] - P[i][j + k] - P[i + k][j] + P[i][j] <= threshold { return true }
                          j += 1
                      }
                      i += 1
                  }
                  return false
              }
              var lo = 0
              var hi = min(m, n)
              while lo < hi {
                  let mid = (lo + hi + 1) / 2
                  if fits(mid) { lo = mid } else { hi = mid - 1 }
              }
              return lo
          }
        `,
        rust: code`
          fn maxSideLength(mat: Vec<Vec<i32>>, threshold: i32) -> i32 {
              let m = mat.len();
              let n = mat[0].len();
              let mut p = vec![vec![0i32; n + 1]; m + 1];
              for i in 0..m {
                  for j in 0..n {
                      p[i + 1][j + 1] = p[i][j + 1] + p[i + 1][j] - p[i][j] + mat[i][j];
                  }
              }
              let fits = |k: usize| -> bool {
                  for i in 0..(m + 1 - k) {
                      for j in 0..(n + 1 - k) {
                          if p[i + k][j + k] - p[i][j + k] - p[i + k][j] + p[i][j] <= threshold {
                              return true;
                          }
                      }
                  }
                  false
              };
              let mut lo = 0usize;
              let mut hi = if m < n { m } else { n };
              while lo < hi {
                  let mid = (lo + hi + 1) / 2;
                  if fits(mid) { lo = mid; } else { hi = mid - 1; }
              }
              lo as i32
          }
        `,
        php: code`
          function maxSideLength($mat, $threshold) {
              $m = count($mat);
              $n = count($mat[0]);
              $P = array_fill(0, $m + 1, array_fill(0, $n + 1, 0));
              for ($i = 0; $i < $m; $i++)
                  for ($j = 0; $j < $n; $j++)
                      $P[$i + 1][$j + 1] = $P[$i][$j + 1] + $P[$i + 1][$j] - $P[$i][$j] + $mat[$i][$j];
              $lo = 0;
              $hi = min($m, $n);
              while ($lo < $hi) {
                  $mid = intdiv($lo + $hi + 1, 2);
                  $ok = false;
                  for ($i = 0; $i + $mid <= $m && !$ok; $i++)
                      for ($j = 0; $j + $mid <= $n; $j++)
                          if ($P[$i + $mid][$j + $mid] - $P[$i][$j + $mid] - $P[$i + $mid][$j] + $P[$i][$j] <= $threshold) { $ok = true; break; }
                  if ($ok) $lo = $mid; else $hi = $mid - 1;
              }
              return $lo;
          }
        `,
        ruby: code`
          def maxSideLength(mat, threshold)
            m = mat.length
            n = mat[0].length
            p = Array.new(m + 1) { Array.new(n + 1, 0) }
            m.times do |i|
              n.times do |j|
                p[i + 1][j + 1] = p[i][j + 1] + p[i + 1][j] - p[i][j] + mat[i][j]
              end
            end
            fits = lambda do |k|
              (0..m - k).each do |i|
                (0..n - k).each do |j|
                  return true if p[i + k][j + k] - p[i][j + k] - p[i + k][j] + p[i][j] <= threshold
                end
              end
              false
            end
            lo = 0
            hi = [m, n].min
            while lo < hi
              mid = (lo + hi + 1) / 2
              if fits.call(mid)
                lo = mid
              else
                hi = mid - 1
              end
            end
            lo
          end
        `,
      },
    };
  })(),

  // ── Minimum Absolute Difference Queries (LC 1906) ───────────────
  (() => {
    const ref = (nums: number[], queries: number[][]) => queries.map(([l, r]) => {
      const vals = Array.from(new Set(nums.slice(l, r + 1))).sort((a, b) => a - b);
      if (vals.length < 2) return -1;
      let best = Infinity;
      for (let i = 1; i < vals.length; i++) best = Math.min(best, vals[i] - vals[i - 1]);
      return best;
    });
    return {
      slug: "minimum-absolute-difference-queries",
      title: "Minimum Absolute Difference Queries",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Binary Search", "Prefix Sum", "Google", "Amazon"],
      signature: {
        funcName: "minDifference",
        params: [{ name: "nums", type: "int[]" as const }, { name: "queries", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "The **minimum absolute difference** of an array is the smallest `|a[i] - a[j]|` over pairs of indices with `a[i] != a[j]`. If every element is the same, it is `-1`.\n\nYou are given `nums` (every value between 1 and 100) and `queries`, where `queries[i] = [l, r]` names the subarray `nums[l..r]` (inclusive). Return an array whose `i`-th entry is the minimum absolute difference of that subarray.",
        [
          { in: "nums = [5,5,2,9,9], queries = [[0,1],[0,2],[2,4],[3,4]]", out: "[-1,3,7,-1]", note: "`[5,5]` and `[9,9]` hold one distinct value each; `[5,5,2]` gives 3; `[2,9,9]` gives 7." },
          { in: "nums = [4,1,7,3], queries = [[0,3],[1,2]]", out: "[1,6]", note: "The whole array sorted is 1, 3, 4, 7 — the closest pair is 3 and 4." },
        ],
        ["2 <= nums.length <= 10^5", "1 <= nums[i] <= 100", "1 <= queries.length <= 2 * 10^4", "0 <= l < r < nums.length"]),
      hints: [
        "Values live in 1..100, so a query only needs to know *which* of the 100 values occur in its range.",
        "Once you know the present values in increasing order, the answer is the smallest gap between consecutive present values.",
        "Keep, for each value, the sorted list of indices where it appears; a binary search tells whether any of them lies in `[l, r]`.",
      ],
      editorial: explain({
        idea: "With only 100 possible values, answer a query by walking the values in increasing order and asking, for each, whether it occurs inside `[l, r]`. Each value's occurrence positions are sorted, so that question is a single lower-bound search.",
        steps: [
          "For every value `v` in 1..100, record the indices where `nums[i] == v` (already in increasing order).",
          "For a query `[l, r]`, set `prev = -1`, `best = ∞`, and loop `v` from 1 to 100.",
          "Binary-search the first position of `v` that is `>= l`; `v` is present when such a position exists and is `<= r`.",
          "When `v` is present and `prev != -1`, update `best` with `v - prev`; then set `prev = v`.",
          "The query's answer is `best`, or `-1` if it never changed (fewer than two distinct values).",
        ],
        why: "The minimum difference between distinct values in a multiset is always attained by two values that are adjacent in sorted order, so scanning the present values from small to large and taking consecutive gaps is exact. Presence of `v` in `[l, r]` is equivalent to its first position at or after `l` being at most `r`.",
        time: "O(n + q · 100 · log n)",
        space: "O(n)",
        pitfalls: [
          "Equal elements do not count — the difference must be between distinct values.",
          "A per-index prefix count table (n × 100) also works but uses 100× the memory.",
          "Queries are inclusive on both ends.",
        ],
      }),
      examples: [
        { input: "[5,5,2,9,9]\n[[0,1],[0,2],[2,4],[3,4]]", expectedOutput: "[-1,3,7,-1]" },
        { input: "[4,1,7,3]\n[[0,3],[1,2]]", expectedOutput: "[1,6]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 6, 20, 40]));
        const vmax = pick(rng, [2, 5, 20, 100]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, vmax));
        const q = ri(rng, 1, pick(rng, [1, 5, 15]));
        const queries = Array.from({ length: q }, () => {
          const l = ri(rng, 0, n - 2);
          return [l, ri(rng, l + 1, n - 1)];
        });
        return { input: `${fmtIntArr(nums)}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(nums, queries)) };
      },
      solutions: {
        python: code`
          from typing import List
          import bisect

          def minDifference(nums: List[int], queries: List[List[int]]) -> List[int]:
              pos = [[] for _ in range(101)]
              for i, v in enumerate(nums):
                  pos[v].append(i)
              res = []
              for l, r in queries:
                  prev = -1
                  best = 1000
                  for v in range(1, 101):
                      p = pos[v]
                      if not p:
                          continue
                      k = bisect.bisect_left(p, l)
                      if k < len(p) and p[k] <= r:
                          if prev != -1 and v - prev < best:
                              best = v - prev
                          prev = v
                  res.append(-1 if best == 1000 else best)
              return res
        `,
        javascript: code`
          var minDifference = function(nums, queries) {
              var pos = [];
              for (var v = 0; v <= 100; v++) pos.push([]);
              for (var i = 0; i < nums.length; i++) pos[nums[i]].push(i);
              var res = [];
              for (var q = 0; q < queries.length; q++) {
                  var l = queries[q][0], r = queries[q][1];
                  var prev = -1, best = 1000;
                  for (var w = 1; w <= 100; w++) {
                      var p = pos[w];
                      if (p.length === 0) continue;
                      var lo = 0, hi = p.length;
                      while (lo < hi) {
                          var mid = (lo + hi) >> 1;
                          if (p[mid] < l) lo = mid + 1; else hi = mid;
                      }
                      if (lo < p.length && p[lo] <= r) {
                          if (prev !== -1 && w - prev < best) best = w - prev;
                          prev = w;
                      }
                  }
                  res.push(best === 1000 ? -1 : best);
              }
              return res;
          };
        `,
        typescript: code`
          function minDifference(nums: number[], queries: number[][]): number[] {
              var pos: number[][] = [];
              for (var v = 0; v <= 100; v++) pos.push([]);
              for (var i = 0; i < nums.length; i++) pos[nums[i]].push(i);
              var res: number[] = [];
              for (var q = 0; q < queries.length; q++) {
                  var l = queries[q][0], r = queries[q][1];
                  var prev = -1, best = 1000;
                  for (var w = 1; w <= 100; w++) {
                      var p = pos[w];
                      if (p.length === 0) continue;
                      var lo = 0, hi = p.length;
                      while (lo < hi) {
                          var mid = (lo + hi) >> 1;
                          if (p[mid] < l) lo = mid + 1; else hi = mid;
                      }
                      if (lo < p.length && p[lo] <= r) {
                          if (prev !== -1 && w - prev < best) best = w - prev;
                          prev = w;
                      }
                  }
                  res.push(best === 1000 ? -1 : best);
              }
              return res;
          }
        `,
        java: code`
          public static int[] minDifference(int[] nums, int[][] queries) {
              List<List<Integer>> pos = new ArrayList<>();
              for (int v = 0; v <= 100; v++) pos.add(new ArrayList<>());
              for (int i = 0; i < nums.length; i++) pos.get(nums[i]).add(i);
              int[] res = new int[queries.length];
              for (int q = 0; q < queries.length; q++) {
                  int l = queries[q][0], r = queries[q][1];
                  int prev = -1, best = 1000;
                  for (int v = 1; v <= 100; v++) {
                      List<Integer> p = pos.get(v);
                      if (p.isEmpty()) continue;
                      int lo = 0, hi = p.size();
                      while (lo < hi) {
                          int mid = (lo + hi) >>> 1;
                          if (p.get(mid) < l) lo = mid + 1; else hi = mid;
                      }
                      if (lo < p.size() && p.get(lo) <= r) {
                          if (prev != -1 && v - prev < best) best = v - prev;
                          prev = v;
                      }
                  }
                  res[q] = best == 1000 ? -1 : best;
              }
              return res;
          }
        `,
        cpp: code`
          vector<int> minDifference(vector<int>& nums, vector<vector<int>>& queries) {
              vector<vector<int>> pos(101);
              for (int i = 0; i < (int)nums.size(); i++) pos[nums[i]].push_back(i);
              vector<int> res;
              for (auto& qr : queries) {
                  int l = qr[0], r = qr[1];
                  int prev = -1, best = 1000;
                  for (int v = 1; v <= 100; v++) {
                      const vector<int>& p = pos[v];
                      if (p.empty()) continue;
                      auto it = lower_bound(p.begin(), p.end(), l);
                      if (it != p.end() && *it <= r) {
                          if (prev != -1 && v - prev < best) best = v - prev;
                          prev = v;
                      }
                  }
                  res.push_back(best == 1000 ? -1 : best);
              }
              return res;
          }
        `,
        c: code`
          int* minDifference(int* nums, int numsSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int start[102];
              for (int v = 0; v <= 101; v++) start[v] = 0;
              for (int i = 0; i < numsSize; i++) start[nums[i] + 1]++;
              for (int v = 1; v <= 101; v++) start[v] += start[v - 1];
              int* pos = (int*)malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));
              int fill[101];
              for (int v = 0; v <= 100; v++) fill[v] = start[v];
              for (int i = 0; i < numsSize; i++) pos[fill[nums[i]]++] = i;
              int* res = (int*)malloc(sizeof(int) * (queriesSize > 0 ? queriesSize : 1));
              for (int q = 0; q < queriesSize; q++) {
                  int l = queries[q][0], r = queries[q][1];
                  int prev = -1, best = 1000;
                  for (int v = 1; v <= 100; v++) {
                      int lo = start[v], hi = start[v + 1];
                      if (lo == hi) continue;
                      while (lo < hi) {
                          int mid = lo + (hi - lo) / 2;
                          if (pos[mid] < l) lo = mid + 1; else hi = mid;
                      }
                      if (lo < start[v + 1] && pos[lo] <= r) {
                          if (prev != -1 && v - prev < best) best = v - prev;
                          prev = v;
                      }
                  }
                  res[q] = best == 1000 ? -1 : best;
              }
              free(pos);
              *returnSize = queriesSize;
              return res;
          }
        `,
        csharp: code`
          public static int[] MinDifference(int[] nums, int[][] queries)
          {
              var pos = new List<int>[101];
              for (int v = 0; v <= 100; v++) pos[v] = new List<int>();
              for (int i = 0; i < nums.Length; i++) pos[nums[i]].Add(i);
              int[] res = new int[queries.Length];
              for (int q = 0; q < queries.Length; q++)
              {
                  int l = queries[q][0], r = queries[q][1];
                  int prev = -1, best = 1000;
                  for (int v = 1; v <= 100; v++)
                  {
                      var p = pos[v];
                      if (p.Count == 0) continue;
                      int lo = 0, hi = p.Count;
                      while (lo < hi)
                      {
                          int mid = lo + (hi - lo) / 2;
                          if (p[mid] < l) lo = mid + 1; else hi = mid;
                      }
                      if (lo < p.Count && p[lo] <= r)
                      {
                          if (prev != -1 && v - prev < best) best = v - prev;
                          prev = v;
                      }
                  }
                  res[q] = best == 1000 ? -1 : best;
              }
              return res;
          }
        `,
        go: code`
          func minDifference(nums []int, queries [][]int) []int {
              pos := make([][]int, 101)
              for i, v := range nums {
                  pos[v] = append(pos[v], i)
              }
              res := make([]int, len(queries))
              for q, qr := range queries {
                  l, r := qr[0], qr[1]
                  prev, best := -1, 1000
                  for v := 1; v <= 100; v++ {
                      p := pos[v]
                      if len(p) == 0 {
                          continue
                      }
                      lo, hi := 0, len(p)
                      for lo < hi {
                          mid := (lo + hi) / 2
                          if p[mid] < l {
                              lo = mid + 1
                          } else {
                              hi = mid
                          }
                      }
                      if lo < len(p) && p[lo] <= r {
                          if prev != -1 && v-prev < best {
                              best = v - prev
                          }
                          prev = v
                      }
                  }
                  if best == 1000 {
                      res[q] = -1
                  } else {
                      res[q] = best
                  }
              }
              return res
          }
        `,
        kotlin: code`
          fun minDifference(nums: IntArray, queries: Array<IntArray>): IntArray {
              val pos = Array(101) { ArrayList<Int>() }
              for (i in nums.indices) pos[nums[i]].add(i)
              val res = IntArray(queries.size)
              for (q in queries.indices) {
                  val l = queries[q][0]
                  val r = queries[q][1]
                  var prev = -1
                  var best = 1000
                  for (v in 1..100) {
                      val p = pos[v]
                      if (p.isEmpty()) continue
                      var lo = 0
                      var hi = p.size
                      while (lo < hi) {
                          val mid = (lo + hi) / 2
                          if (p[mid] < l) lo = mid + 1 else hi = mid
                      }
                      if (lo < p.size && p[lo] <= r) {
                          if (prev != -1 && v - prev < best) best = v - prev
                          prev = v
                      }
                  }
                  res[q] = if (best == 1000) -1 else best
              }
              return res
          }
        `,
        swift: code`
          func minDifference(_ nums: [Int], _ queries: [[Int]]) -> [Int] {
              var pos = Array(repeating: [Int](), count: 101)
              for i in 0..<nums.count { pos[nums[i]].append(i) }
              var res = [Int]()
              for qr in queries {
                  let l = qr[0]
                  let r = qr[1]
                  var prev = -1
                  var best = 1000
                  for v in 1...100 {
                      let p = pos[v]
                      if p.isEmpty { continue }
                      var lo = 0
                      var hi = p.count
                      while lo < hi {
                          let mid = (lo + hi) / 2
                          if p[mid] < l { lo = mid + 1 } else { hi = mid }
                      }
                      if lo < p.count && p[lo] <= r {
                          if prev != -1 && v - prev < best { best = v - prev }
                          prev = v
                      }
                  }
                  res.append(best == 1000 ? -1 : best)
              }
              return res
          }
        `,
        rust: code`
          fn minDifference(nums: Vec<i32>, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let mut pos: Vec<Vec<i32>> = vec![Vec::new(); 101];
              for (i, &v) in nums.iter().enumerate() {
                  pos[v as usize].push(i as i32);
              }
              let mut res = Vec::with_capacity(queries.len());
              for qr in queries.iter() {
                  let l = qr[0];
                  let r = qr[1];
                  let mut prev: i32 = -1;
                  let mut best: i32 = 1000;
                  for v in 1..=100usize {
                      let p = &pos[v];
                      if p.is_empty() { continue; }
                      let mut lo = 0usize;
                      let mut hi = p.len();
                      while lo < hi {
                          let mid = (lo + hi) / 2;
                          if p[mid] < l { lo = mid + 1; } else { hi = mid; }
                      }
                      if lo < p.len() && p[lo] <= r {
                          let vv = v as i32;
                          if prev != -1 && vv - prev < best { best = vv - prev; }
                          prev = vv;
                      }
                  }
                  res.push(if best == 1000 { -1 } else { best });
              }
              res
          }
        `,
        php: code`
          function minDifference($nums, $queries) {
              $pos = array_fill(0, 101, []);
              foreach ($nums as $i => $v) $pos[$v][] = $i;
              $res = [];
              foreach ($queries as $qr) {
                  $l = $qr[0];
                  $r = $qr[1];
                  $prev = -1;
                  $best = 1000;
                  for ($v = 1; $v <= 100; $v++) {
                      $p = $pos[$v];
                      $len = count($p);
                      if ($len == 0) continue;
                      $lo = 0;
                      $hi = $len;
                      while ($lo < $hi) {
                          $mid = intdiv($lo + $hi, 2);
                          if ($p[$mid] < $l) $lo = $mid + 1; else $hi = $mid;
                      }
                      if ($lo < $len && $p[$lo] <= $r) {
                          if ($prev != -1 && $v - $prev < $best) $best = $v - $prev;
                          $prev = $v;
                      }
                  }
                  $res[] = $best == 1000 ? -1 : $best;
              }
              return $res;
          }
        `,
        ruby: code`
          def minDifference(nums, queries)
            pos = Array.new(101) { [] }
            nums.each_with_index { |v, i| pos[v] << i }
            queries.map do |qr|
              l = qr[0]
              r = qr[1]
              prev = -1
              best = 1000
              (1..100).each do |v|
                p = pos[v]
                next if p.empty?
                k = p.bsearch_index { |x| x >= l }
                if k && p[k] <= r
                  best = v - prev if prev != -1 && v - prev < best
                  prev = v
                end
              end
              best == 1000 ? -1 : best
            end
          end
        `,
      },
    };
  })(),

  // ── Minimized Maximum of Products Distributed to Any Store (LC 2064) ──
  (() => {
    // Independent check: start every type with one store, then keep handing a
    // spare store to whichever type currently has the largest per-store load.
    const ref = (n: number, quantities: number[]) => {
      const stores = quantities.map(() => 1);
      const load = (i: number) => Math.ceil(quantities[i] / stores[i]);
      let spare = n - quantities.length;
      while (spare > 0) {
        let worst = 0;
        for (let i = 1; i < quantities.length; i++) if (load(i) > load(worst)) worst = i;
        if (load(worst) === 1) break;
        stores[worst]++;
        spare--;
      }
      let best = 0;
      for (let i = 0; i < quantities.length; i++) best = Math.max(best, load(i));
      return best;
    };
    return {
      slug: "minimized-maximum-of-products-distributed-to-any-store",
      title: "Minimized Maximum of Products Distributed to Any Store",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Greedy", "Amazon", "Google", "Flipkart"],
      signature: {
        funcName: "minimizedMaximum",
        params: [{ name: "n", type: "int" as const }, { name: "quantities", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A warehouse ships `m` product types to `n` retail stores; `quantities[i]` is the number of units of type `i`.\n\nEvery unit must be shipped. A store may receive units of **at most one** product type, in any amount (a store may also receive nothing). Let `x` be the largest number of units any single store receives.\n\nReturn the smallest possible `x`.",
        [
          { in: "n = 6, quantities = [11,6]", out: "3", note: "Split 11 as 3 + 3 + 3 + 2 over four stores and 6 as 3 + 3 over two." },
          { in: "n = 7, quantities = [15,10,10]", out: "5", note: "Three stores take 5 each of the first type, two take 5 each of the others." },
          { in: "n = 1, quantities = [100000]", out: "100000" },
        ],
        ["m == quantities.length", "1 <= m <= n <= 10^5", "1 <= quantities[i] <= 10^5"]),
      hints: [
        "Fix a cap `x` on what one store may hold. How many stores does product type `i` then need?",
        "It needs `ceil(quantities[i] / x)` stores, and the cap is achievable exactly when those counts add up to at most `n`.",
        "Larger caps never need more stores, so binary-search the smallest feasible `x` between 1 and `max(quantities)`.",
      ],
      editorial: explain({
        idea: "Turn the optimisation into a yes/no question: can every product be shipped if no store holds more than `x` units? The answer flips from no to yes exactly once as `x` grows, so binary search finds the smallest yes.",
        steps: [
          "Search `x` in `[1, max(quantities)]` — the upper end is always feasible because `m <= n`.",
          "For a candidate `x`, sum `ceil(q / x)` over all types (stop early once the sum passes `n`).",
          "If the sum is at most `n`, `x` is feasible: move the upper end down to `x`; otherwise move the lower end to `x + 1`.",
          "Return the point where the bounds meet.",
        ],
        why: "With a cap of `x`, type `i` cannot use fewer than `ceil(q_i / x)` stores and never needs more, and types cannot share stores, so the minimum total is the sum of those ceilings. Increasing `x` can only shrink each ceiling, which makes feasibility monotone and the binary search exact.",
        time: "O(m log Q) with Q = max(quantities)",
        space: "O(1)",
        pitfalls: [
          "The sum of ceilings at `x = 1` can reach 10^10 — stop adding once it exceeds `n` (or use 64-bit).",
          "Compute `ceil(q / x)` as `(q + x - 1) / x` in integer arithmetic.",
          "Stores left empty are allowed; the condition is `<= n`, not `== n`.",
        ],
      }),
      examples: [
        { input: "6\n[11,6]", expectedOutput: "3" },
        { input: "7\n[15,10,10]", expectedOutput: "5" },
        { input: "1\n[100000]", expectedOutput: "100000" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 5, 20]));
        const n = ri(rng, m, m + pick(rng, [0, 5, 40]));
        const qmax = pick(rng, [3, 100, 100000]);
        const quantities = Array.from({ length: m }, () => ri(rng, 1, qmax));
        return { input: `${n}\n${fmtIntArr(quantities)}`, expectedOutput: String(ref(n, quantities)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimizedMaximum(n: int, quantities: List[int]) -> int:
              def feasible(x):
                  need = 0
                  for q in quantities:
                      need += (q + x - 1) // x
                      if need > n:
                          return False
                  return True

              lo, hi = 1, max(quantities)
              while lo < hi:
                  mid = (lo + hi) // 2
                  if feasible(mid):
                      hi = mid
                  else:
                      lo = mid + 1
              return lo
        `,
        javascript: code`
          var minimizedMaximum = function(n, quantities) {
              var feasible = function(x) {
                  var need = 0;
                  for (var i = 0; i < quantities.length; i++) {
                      need += Math.floor((quantities[i] + x - 1) / x);
                      if (need > n) return false;
                  }
                  return true;
              };
              var lo = 1, hi = 0;
              for (var j = 0; j < quantities.length; j++) if (quantities[j] > hi) hi = quantities[j];
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (feasible(mid)) hi = mid; else lo = mid + 1;
              }
              return lo;
          };
        `,
        typescript: code`
          function minimizedMaximum(n: number, quantities: number[]): number {
              var feasible = function(x: number): boolean {
                  var need = 0;
                  for (var i = 0; i < quantities.length; i++) {
                      need += Math.floor((quantities[i] + x - 1) / x);
                      if (need > n) return false;
                  }
                  return true;
              };
              var lo = 1, hi = 0;
              for (var j = 0; j < quantities.length; j++) if (quantities[j] > hi) hi = quantities[j];
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (feasible(mid)) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        java: code`
          public static int minimizedMaximum(int n, int[] quantities) {
              int lo = 1, hi = 0;
              for (int q : quantities) hi = Math.max(hi, q);
              while (lo < hi) {
                  int mid = (lo + hi) >>> 1;
                  int need = 0;
                  for (int q : quantities) {
                      need += (q + mid - 1) / mid;
                      if (need > n) break;
                  }
                  if (need <= n) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        cpp: code`
          int minimizedMaximum(int n, vector<int>& quantities) {
              int lo = 1, hi = *max_element(quantities.begin(), quantities.end());
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  int need = 0;
                  for (int q : quantities) {
                      need += (q + mid - 1) / mid;
                      if (need > n) break;
                  }
                  if (need <= n) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        c: code`
          int minimizedMaximum(int n, int* quantities, int quantitiesSize) {
              int lo = 1, hi = 0;
              for (int i = 0; i < quantitiesSize; i++) if (quantities[i] > hi) hi = quantities[i];
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  int need = 0;
                  for (int i = 0; i < quantitiesSize; i++) {
                      need += (quantities[i] + mid - 1) / mid;
                      if (need > n) break;
                  }
                  if (need <= n) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        csharp: code`
          public static int MinimizedMaximum(int n, int[] quantities)
          {
              int lo = 1, hi = 0;
              foreach (int q in quantities) hi = Math.Max(hi, q);
              while (lo < hi)
              {
                  int mid = lo + (hi - lo) / 2;
                  int need = 0;
                  foreach (int q in quantities)
                  {
                      need += (q + mid - 1) / mid;
                      if (need > n) break;
                  }
                  if (need <= n) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        go: code`
          func minimizedMaximum(n int, quantities []int) int {
              lo, hi := 1, 0
              for _, q := range quantities {
                  if q > hi {
                      hi = q
                  }
              }
              for lo < hi {
                  mid := (lo + hi) / 2
                  need := 0
                  for _, q := range quantities {
                      need += (q + mid - 1) / mid
                      if need > n {
                          break
                      }
                  }
                  if need <= n {
                      hi = mid
                  } else {
                      lo = mid + 1
                  }
              }
              return lo
          }
        `,
        kotlin: code`
          fun minimizedMaximum(n: Int, quantities: IntArray): Int {
              var lo = 1
              var hi = 0
              for (q in quantities) if (q > hi) hi = q
              while (lo < hi) {
                  val mid = (lo + hi) / 2
                  var need = 0
                  for (q in quantities) {
                      need += (q + mid - 1) / mid
                      if (need > n) break
                  }
                  if (need <= n) hi = mid else lo = mid + 1
              }
              return lo
          }
        `,
        swift: code`
          func minimizedMaximum(_ n: Int, _ quantities: [Int]) -> Int {
              var lo = 1
              var hi = 0
              for q in quantities { if q > hi { hi = q } }
              while lo < hi {
                  let mid = (lo + hi) / 2
                  var need = 0
                  for q in quantities {
                      need += (q + mid - 1) / mid
                      if need > n { break }
                  }
                  if need <= n { hi = mid } else { lo = mid + 1 }
              }
              return lo
          }
        `,
        rust: code`
          fn minimizedMaximum(n: i32, quantities: Vec<i32>) -> i32 {
              let mut lo = 1;
              let mut hi = 0;
              for &q in quantities.iter() {
                  if q > hi { hi = q; }
              }
              while lo < hi {
                  let mid = lo + (hi - lo) / 2;
                  let mut need = 0;
                  for &q in quantities.iter() {
                      need += (q + mid - 1) / mid;
                      if need > n { break; }
                  }
                  if need <= n { hi = mid; } else { lo = mid + 1; }
              }
              lo
          }
        `,
        php: code`
          function minimizedMaximum($n, $quantities) {
              $lo = 1;
              $hi = max($quantities);
              while ($lo < $hi) {
                  $mid = intdiv($lo + $hi, 2);
                  $need = 0;
                  foreach ($quantities as $q) {
                      $need += intdiv($q + $mid - 1, $mid);
                      if ($need > $n) break;
                  }
                  if ($need <= $n) $hi = $mid; else $lo = $mid + 1;
              }
              return $lo;
          }
        `,
        ruby: code`
          def minimizedMaximum(n, quantities)
            lo = 1
            hi = quantities.max
            while lo < hi
              mid = (lo + hi) / 2
              need = 0
              quantities.each do |q|
                need += (q + mid - 1) / mid
                break if need > n
              end
              if need <= n
                hi = mid
              else
                lo = mid + 1
              end
            end
            lo
          end
        `,
      },
    };
  })(),

  // ── Maximum Tastiness of Candy Basket (LC 2517) ─────────────────
  (() => {
    const ref = (price: number[], k: number) => {
      const p = price.slice().sort((a, b) => a - b);
      let best = 0;
      const chosen: number[] = [];
      const walk = (i: number) => {
        if (chosen.length === k) {
          let t = Infinity;
          for (let j = 1; j < k; j++) t = Math.min(t, chosen[j] - chosen[j - 1]);
          best = Math.max(best, t);
          return;
        }
        if (i === p.length || p.length - i < k - chosen.length) return;
        chosen.push(p[i]);
        walk(i + 1);
        chosen.pop();
        walk(i + 1);
      };
      walk(0);
      return best;
    };
    return {
      slug: "maximum-tastiness-of-candy-basket",
      title: "Maximum Tastiness of Candy Basket",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Greedy", "Sorting", "Amazon", "Google"],
      signature: {
        funcName: "maximumTastiness",
        params: [{ name: "price", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A candy shop lists `price[i]` for candy `i`. A basket holds exactly `k` **different** candies (different indices; two candies may share a price).\n\nThe **tastiness** of a basket is the smallest absolute difference between the prices of any two candies in it.\n\nReturn the largest tastiness any basket of `k` candies can have.",
        [
          { in: "price = [13,5,1,8,21,2], k = 3", out: "8", note: "Take the candies priced 13, 5 and 21: the closest pair is 13 and 5, eight apart." },
          { in: "price = [1,3,1], k = 2", out: "2" },
          { in: "price = [7,7,7,7], k = 2", out: "0", note: "Every pair costs the same." },
        ],
        ["2 <= k <= price.length <= 10^5", "1 <= price[i] <= 10^9"]),
      hints: [
        "Sorting the prices loses nothing — tastiness only depends on the multiset of chosen prices.",
        "Ask instead: can you pick `k` candies whose sorted neighbours are all at least `d` apart? Larger `d` only makes it harder.",
        "For a fixed `d`, pick greedily from the cheapest candy, taking the next price that is at least `d` above the last pick; binary-search the largest `d` that still yields `k` picks.",
      ],
      editorial: explain({
        idea: "Binary search on the answer `d`. Whether `k` candies can be spaced at least `d` apart is decided by a greedy sweep over the sorted prices, and that test is monotone in `d`.",
        steps: [
          "Sort `price`.",
          "`canSpace(d)`: take the first price, then walk right and take every price that is at least `d` above the last one taken; succeed if at least `k` are taken.",
          "Binary-search the largest `d` in `[0, price[n-1] - price[0]]` with `canSpace(d)` true (using the upper middle so the loop advances).",
          "Return that `d`.",
        ],
        why: "For a fixed `d`, taking the smallest price first is never worse: any valid selection can swap its first pick for the global minimum and stay valid, and the same exchange argument applies to every subsequent pick (the earliest admissible price leaves the most room to the right). So the greedy count is the maximum number of candies spaced by `d`. If `d` works, every smaller `d` works, so the largest feasible `d` is a clean threshold.",
        time: "O(n log n + n log R) with R the price range",
        space: "O(n) for the sorted copy",
        pitfalls: [
          "Compare with `price[i] - last >= d`; writing `last + d` can overflow 32-bit when both are near 10^9.",
          "Duplicate prices are allowed, so the answer can be 0.",
          "Use `lo + (hi - lo + 1) / 2` when the feasible branch sets `lo = mid`.",
        ],
      }),
      examples: [
        { input: "[13,5,1,8,21,2]\n3", expectedOutput: "8" },
        { input: "[1,3,1]\n2", expectedOutput: "2" },
        { input: "[7,7,7,7]\n2", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 5, 9]));
        const k = ri(rng, 2, n);
        const span = pick(rng, [3, 10, 1000, 1000000000]);
        const price = Array.from({ length: n }, () => ri(rng, 1, span));
        return { input: `${fmtIntArr(price)}\n${k}`, expectedOutput: String(ref(price, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumTastiness(price: List[int], k: int) -> int:
              p = sorted(price)

              def can_space(d):
                  taken, last = 1, p[0]
                  for x in p:
                      if x - last >= d:
                          taken += 1
                          last = x
                          if taken >= k:
                              return True
                  return taken >= k

              lo, hi = 0, p[-1] - p[0]
              while lo < hi:
                  mid = (lo + hi + 1) // 2
                  if can_space(mid):
                      lo = mid
                  else:
                      hi = mid - 1
              return lo
        `,
        javascript: code`
          var maximumTastiness = function(price, k) {
              var p = price.slice().sort(function(a, b) { return a - b; });
              var canSpace = function(d) {
                  var taken = 1, last = p[0];
                  for (var i = 1; i < p.length; i++) {
                      if (p[i] - last >= d) {
                          taken++;
                          last = p[i];
                          if (taken >= k) return true;
                      }
                  }
                  return taken >= k;
              };
              var lo = 0, hi = p[p.length - 1] - p[0];
              while (lo < hi) {
                  var mid = lo + Math.floor((hi - lo + 1) / 2);
                  if (canSpace(mid)) lo = mid; else hi = mid - 1;
              }
              return lo;
          };
        `,
        typescript: code`
          function maximumTastiness(price: number[], k: number): number {
              var p: number[] = price.slice();
              p.sort(function(a, b) { return a - b; });
              var canSpace = function(d: number): boolean {
                  var taken = 1, last = p[0];
                  for (var i = 1; i < p.length; i++) {
                      if (p[i] - last >= d) {
                          taken++;
                          last = p[i];
                          if (taken >= k) return true;
                      }
                  }
                  return taken >= k;
              };
              var lo = 0, hi = p[p.length - 1] - p[0];
              while (lo < hi) {
                  var mid = lo + Math.floor((hi - lo + 1) / 2);
                  if (canSpace(mid)) lo = mid; else hi = mid - 1;
              }
              return lo;
          }
        `,
        java: code`
          public static int maximumTastiness(int[] price, int k) {
              int[] p = price.clone();
              Arrays.sort(p);
              int lo = 0, hi = p[p.length - 1] - p[0];
              while (lo < hi) {
                  int mid = lo + (hi - lo + 1) / 2;
                  int taken = 1, last = p[0];
                  for (int i = 1; i < p.length && taken < k; i++) {
                      if (p[i] - last >= mid) { taken++; last = p[i]; }
                  }
                  if (taken >= k) lo = mid; else hi = mid - 1;
              }
              return lo;
          }
        `,
        cpp: code`
          int maximumTastiness(vector<int>& price, int k) {
              vector<int> p(price);
              sort(p.begin(), p.end());
              int lo = 0, hi = p.back() - p[0];
              while (lo < hi) {
                  int mid = lo + (hi - lo + 1) / 2;
                  int taken = 1, last = p[0];
                  for (int i = 1; i < (int)p.size() && taken < k; i++) {
                      if (p[i] - last >= mid) { taken++; last = p[i]; }
                  }
                  if (taken >= k) lo = mid; else hi = mid - 1;
              }
              return lo;
          }
        `,
        c: code`
          static int tasteCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int maximumTastiness(int* price, int priceSize, int k) {
              int* p = (int*)malloc(sizeof(int) * priceSize);
              for (int i = 0; i < priceSize; i++) p[i] = price[i];
              qsort(p, priceSize, sizeof(int), tasteCmp);
              int lo = 0, hi = p[priceSize - 1] - p[0];
              while (lo < hi) {
                  int mid = lo + (hi - lo + 1) / 2;
                  int taken = 1, last = p[0];
                  for (int i = 1; i < priceSize && taken < k; i++) {
                      if (p[i] - last >= mid) { taken++; last = p[i]; }
                  }
                  if (taken >= k) lo = mid; else hi = mid - 1;
              }
              free(p);
              return lo;
          }
        `,
        csharp: code`
          public static int MaximumTastiness(int[] price, int k)
          {
              int[] p = (int[])price.Clone();
              Array.Sort(p);
              int lo = 0, hi = p[p.Length - 1] - p[0];
              while (lo < hi)
              {
                  int mid = lo + (hi - lo + 1) / 2;
                  int taken = 1, last = p[0];
                  for (int i = 1; i < p.Length && taken < k; i++)
                  {
                      if (p[i] - last >= mid) { taken++; last = p[i]; }
                  }
                  if (taken >= k) lo = mid; else hi = mid - 1;
              }
              return lo;
          }
        `,
        go: code`
          func maximumTastiness(price []int, k int) int {
              p := make([]int, len(price))
              copy(p, price)
              sort.Ints(p)
              lo, hi := 0, p[len(p)-1]-p[0]
              for lo < hi {
                  mid := lo + (hi-lo+1)/2
                  taken, last := 1, p[0]
                  for i := 1; i < len(p) && taken < k; i++ {
                      if p[i]-last >= mid {
                          taken++
                          last = p[i]
                      }
                  }
                  if taken >= k {
                      lo = mid
                  } else {
                      hi = mid - 1
                  }
              }
              return lo
          }
        `,
        kotlin: code`
          fun maximumTastiness(price: IntArray, k: Int): Int {
              val p = price.sortedArray()
              var lo = 0
              var hi = p[p.size - 1] - p[0]
              while (lo < hi) {
                  val mid = lo + (hi - lo + 1) / 2
                  var taken = 1
                  var last = p[0]
                  var i = 1
                  while (i < p.size && taken < k) {
                      if (p[i] - last >= mid) { taken++; last = p[i] }
                      i++
                  }
                  if (taken >= k) lo = mid else hi = mid - 1
              }
              return lo
          }
        `,
        swift: code`
          func maximumTastiness(_ price: [Int], _ k: Int) -> Int {
              let p = price.sorted()
              var lo = 0
              var hi = p[p.count - 1] - p[0]
              while lo < hi {
                  let mid = lo + (hi - lo + 1) / 2
                  var taken = 1
                  var last = p[0]
                  var i = 1
                  while i < p.count && taken < k {
                      if p[i] - last >= mid { taken += 1; last = p[i] }
                      i += 1
                  }
                  if taken >= k { lo = mid } else { hi = mid - 1 }
              }
              return lo
          }
        `,
        rust: code`
          fn maximumTastiness(price: Vec<i32>, k: i32) -> i32 {
              let mut p = price;
              p.sort();
              let mut lo = 0i32;
              let mut hi = p[p.len() - 1] - p[0];
              while lo < hi {
                  let mid = lo + (hi - lo + 1) / 2;
                  let mut taken = 1;
                  let mut last = p[0];
                  let mut i = 1;
                  while i < p.len() && taken < k {
                      if p[i] - last >= mid { taken += 1; last = p[i]; }
                      i += 1;
                  }
                  if taken >= k { lo = mid; } else { hi = mid - 1; }
              }
              lo
          }
        `,
        php: code`
          function maximumTastiness($price, $k) {
              $p = $price;
              sort($p);
              $n = count($p);
              $lo = 0;
              $hi = $p[$n - 1] - $p[0];
              while ($lo < $hi) {
                  $mid = $lo + intdiv($hi - $lo + 1, 2);
                  $taken = 1;
                  $last = $p[0];
                  for ($i = 1; $i < $n && $taken < $k; $i++) {
                      if ($p[$i] - $last >= $mid) { $taken++; $last = $p[$i]; }
                  }
                  if ($taken >= $k) $lo = $mid; else $hi = $mid - 1;
              }
              return $lo;
          }
        `,
        ruby: code`
          def maximumTastiness(price, k)
            p = price.sort
            lo = 0
            hi = p[-1] - p[0]
            while lo < hi
              mid = lo + (hi - lo + 1) / 2
              taken = 1
              last = p[0]
              i = 1
              while i < p.length && taken < k
                if p[i] - last >= mid
                  taken += 1
                  last = p[i]
                end
                i += 1
              end
              if taken >= k
                lo = mid
              else
                hi = mid - 1
              end
            end
            lo
          end
        `,
      },
    };
  })(),

  // ── Kth Smallest Product of Two Sorted Arrays (LC 2040) ─────────
  (() => {
    const ref = (a: number[], b: number[], k: number) => {
      const all: number[] = [];
      for (const x of a) for (const y of b) all.push(x * y);
      all.sort((p, q) => p - q);
      return all[k - 1];
    };
    return {
      slug: "kth-smallest-product-of-two-sorted-arrays",
      title: "Kth Smallest Product of Two Sorted Arrays",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Two Pointers", "Google", "Amazon", "Microsoft"],
      signature: {
        funcName: "kthSmallestProduct",
        params: [
          { name: "nums1", type: "int[]" as const },
          { name: "nums2", type: "int[]" as const },
          { name: "k", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "`nums1` and `nums2` are each sorted in non-decreasing order and may contain negative numbers and zeros.\n\nForm every product `nums1[i] * nums2[j]` with `0 <= i < nums1.length` and `0 <= j < nums2.length` — there are `nums1.length * nums2.length` of them, counted with multiplicity. Return the `k`-th smallest (1-based) of these products.\n\n*CodeKairo bounds:* the original problem allows values up to `10^5` and lengths up to `5 * 10^4`, which needs 64-bit products and a 64-bit `k`. Here values are at most `10^4` in absolute value and lengths at most `10^4`, so every product and every rank fits in a 32-bit integer.",
        [
          { in: "nums1 = [-3,1,2], nums2 = [-1,4], k = 2", out: "-2", note: "The six products in order are -12, -2, -1, 3, 4, 8." },
          { in: "nums1 = [2,5], nums2 = [3,4], k = 2", out: "8", note: "The products are 6, 8, 15 and 20." },
          { in: "nums1 = [-2,0,3], nums2 = [-4,-1,2], k = 6", out: "0", note: "In order: -12, -4, -3, 0, 0, 0, 2, 6, 8 — the sixth is one of the three zeros." },
        ],
        ["1 <= nums1.length, nums2.length <= 10^4", "-10^4 <= nums1[i], nums2[j] <= 10^4", "1 <= k <= nums1.length * nums2.length", "nums1 and nums2 are sorted in non-decreasing order"]),
      hints: [
        "Instead of finding the `k`-th product directly, count how many products are at most some value `x`.",
        "For a fixed `nums1[i]`, the products with `nums2` are sorted (ascending if `nums1[i] > 0`, descending if negative, all zero if zero) — so the count for one row is a binary search.",
        "The answer is the smallest `x` whose count reaches `k`; binary-search `x` over the product range.",
      ],
      editorial: explain({
        idea: "Binary search on the value of the answer. The number of products `<= x` is monotone in `x` and can be counted row by row with a binary search, because multiplying a sorted array by a fixed number keeps it sorted (or reverses it).",
        steps: [
          "Search `x` in `[-10^8, 10^8]` for the smallest value with `count(x) >= k`.",
          "`count(x)`: for each `a` in `nums1` — if `a > 0`, count the prefix of `nums2` with `a * b <= x` (first index where it fails); if `a < 0`, `a * b` decreases along `nums2`, so count the suffix starting at the first index where `a * b <= x`; if `a == 0`, all `nums2.length` products are 0 and count when `x >= 0`.",
          "Take the midpoint as `lo + (hi - lo) / 2` so it floors correctly on negative ranges.",
          "Return `lo` when the bounds meet.",
        ],
        why: "`count(x)` is non-decreasing in `x`, so the smallest `x` with `count(x) >= k` is well defined; at that `x`, fewer than `k` products are `<= x - 1`, so some product equals `x` and it is exactly the `k`-th smallest. The per-row searches are valid because `b -> a * b` is monotone for a fixed `a`.",
        time: "O(n1 · log n2 · log R) with R the product range (about 2 · 10^8)",
        space: "O(1)",
        pitfalls: [
          "With negative bounds, `(lo + hi) / 2` rounds toward zero in most languages and can loop forever — use `lo + (hi - lo) / 2`.",
          "Negative multipliers reverse the order: count the suffix, not the prefix.",
          "Zeros in `nums1` contribute all-or-nothing depending on the sign of `x`.",
        ],
      }),
      examples: [
        { input: "[-3,1,2]\n[-1,4]\n2", expectedOutput: "-2" },
        { input: "[2,5]\n[3,4]\n2", expectedOutput: "8" },
        { input: "[-2,0,3]\n[-4,-1,2]\n6", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [3, 10, 100, 10000]);
        const sign = pick(rng, ["mixed", "mixed", "pos", "neg"]);
        const draw = () => {
          const v = ri(rng, -span, span);
          return sign === "pos" ? Math.abs(v) : sign === "neg" ? -Math.abs(v) : v;
        };
        const a = Array.from({ length: ri(rng, 1, pick(rng, [1, 4, 12])) }, draw).sort((x, y) => x - y);
        const b = Array.from({ length: ri(rng, 1, pick(rng, [1, 4, 12])) }, draw).sort((x, y) => x - y);
        const k = ri(rng, 1, a.length * b.length);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}\n${k}`, expectedOutput: String(ref(a, b, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def kthSmallestProduct(nums1: List[int], nums2: List[int], k: int) -> int:
              n2 = len(nums2)

              def count_at_most(x):
                  total = 0
                  for a in nums1:
                      if a > 0:
                          lo, hi = 0, n2
                          while lo < hi:
                              mid = (lo + hi) // 2
                              if a * nums2[mid] <= x:
                                  lo = mid + 1
                              else:
                                  hi = mid
                          total += lo
                      elif a < 0:
                          lo, hi = 0, n2
                          while lo < hi:
                              mid = (lo + hi) // 2
                              if a * nums2[mid] <= x:
                                  hi = mid
                              else:
                                  lo = mid + 1
                          total += n2 - lo
                      elif x >= 0:
                          total += n2
                  return total

              lo, hi = -10 ** 8, 10 ** 8
              while lo < hi:
                  mid = (lo + hi) // 2
                  if count_at_most(mid) >= k:
                      hi = mid
                  else:
                      lo = mid + 1
              return lo
        `,
        javascript: code`
          var kthSmallestProduct = function(nums1, nums2, k) {
              var n2 = nums2.length;
              var countAtMost = function(x) {
                  var total = 0;
                  for (var i = 0; i < nums1.length; i++) {
                      var a = nums1[i];
                      var lo = 0, hi = n2, mid;
                      if (a > 0) {
                          while (lo < hi) {
                              mid = (lo + hi) >> 1;
                              if (a * nums2[mid] <= x) lo = mid + 1; else hi = mid;
                          }
                          total += lo;
                      } else if (a < 0) {
                          while (lo < hi) {
                              mid = (lo + hi) >> 1;
                              if (a * nums2[mid] <= x) hi = mid; else lo = mid + 1;
                          }
                          total += n2 - lo;
                      } else if (x >= 0) {
                          total += n2;
                      }
                  }
                  return total;
              };
              var lo = -100000000, hi = 100000000;
              while (lo < hi) {
                  var mid = lo + Math.floor((hi - lo) / 2);
                  if (countAtMost(mid) >= k) hi = mid; else lo = mid + 1;
              }
              return lo;
          };
        `,
        typescript: code`
          function kthSmallestProduct(nums1: number[], nums2: number[], k: number): number {
              var n2 = nums2.length;
              var countAtMost = function(x: number): number {
                  var total = 0;
                  for (var i = 0; i < nums1.length; i++) {
                      var a = nums1[i];
                      var lo = 0, hi = n2, mid: number;
                      if (a > 0) {
                          while (lo < hi) {
                              mid = (lo + hi) >> 1;
                              if (a * nums2[mid] <= x) lo = mid + 1; else hi = mid;
                          }
                          total += lo;
                      } else if (a < 0) {
                          while (lo < hi) {
                              mid = (lo + hi) >> 1;
                              if (a * nums2[mid] <= x) hi = mid; else lo = mid + 1;
                          }
                          total += n2 - lo;
                      } else if (x >= 0) {
                          total += n2;
                      }
                  }
                  return total;
              };
              var left = -100000000, right = 100000000;
              while (left < right) {
                  var middle = left + Math.floor((right - left) / 2);
                  if (countAtMost(middle) >= k) right = middle; else left = middle + 1;
              }
              return left;
          }
        `,
        java: code`
          public static int kthSmallestProduct(int[] nums1, int[] nums2, int k) {
              int lo = -100000000, hi = 100000000;
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (countProductsAtMost(nums1, nums2, mid) >= k) hi = mid; else lo = mid + 1;
              }
              return lo;
          }

          static long countProductsAtMost(int[] nums1, int[] nums2, long x) {
              int n2 = nums2.length;
              long total = 0;
              for (int a : nums1) {
                  int lo = 0, hi = n2;
                  if (a > 0) {
                      while (lo < hi) {
                          int mid = (lo + hi) >>> 1;
                          if ((long) a * nums2[mid] <= x) lo = mid + 1; else hi = mid;
                      }
                      total += lo;
                  } else if (a < 0) {
                      while (lo < hi) {
                          int mid = (lo + hi) >>> 1;
                          if ((long) a * nums2[mid] <= x) hi = mid; else lo = mid + 1;
                      }
                      total += n2 - lo;
                  } else if (x >= 0) {
                      total += n2;
                  }
              }
              return total;
          }
        `,
        cpp: code`
          long long countProductsAtMost(const vector<int>& nums1, const vector<int>& nums2, long long x) {
              int n2 = nums2.size();
              long long total = 0;
              for (int a : nums1) {
                  int lo = 0, hi = n2;
                  if (a > 0) {
                      while (lo < hi) {
                          int mid = (lo + hi) / 2;
                          if ((long long)a * nums2[mid] <= x) lo = mid + 1; else hi = mid;
                      }
                      total += lo;
                  } else if (a < 0) {
                      while (lo < hi) {
                          int mid = (lo + hi) / 2;
                          if ((long long)a * nums2[mid] <= x) hi = mid; else lo = mid + 1;
                      }
                      total += n2 - lo;
                  } else if (x >= 0) {
                      total += n2;
                  }
              }
              return total;
          }

          int kthSmallestProduct(vector<int>& nums1, vector<int>& nums2, int k) {
              int lo = -100000000, hi = 100000000;
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (countProductsAtMost(nums1, nums2, mid) >= k) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        c: code`
          static long long countProductsAtMost(int* nums1, int n1, int* nums2, int n2, long long x) {
              long long total = 0;
              for (int i = 0; i < n1; i++) {
                  long long a = nums1[i];
                  int lo = 0, hi = n2;
                  if (a > 0) {
                      while (lo < hi) {
                          int mid = lo + (hi - lo) / 2;
                          if (a * nums2[mid] <= x) lo = mid + 1; else hi = mid;
                      }
                      total += lo;
                  } else if (a < 0) {
                      while (lo < hi) {
                          int mid = lo + (hi - lo) / 2;
                          if (a * nums2[mid] <= x) hi = mid; else lo = mid + 1;
                      }
                      total += n2 - lo;
                  } else if (x >= 0) {
                      total += n2;
                  }
              }
              return total;
          }

          int kthSmallestProduct(int* nums1, int nums1Size, int* nums2, int nums2Size, int k) {
              int lo = -100000000, hi = 100000000;
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (countProductsAtMost(nums1, nums1Size, nums2, nums2Size, mid) >= k) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        csharp: code`
          public static int KthSmallestProduct(int[] nums1, int[] nums2, int k)
          {
              int lo = -100000000, hi = 100000000;
              while (lo < hi)
              {
                  int mid = lo + (hi - lo) / 2;
                  if (CountProductsAtMost(nums1, nums2, mid) >= k) hi = mid; else lo = mid + 1;
              }
              return lo;
          }

          static long CountProductsAtMost(int[] nums1, int[] nums2, long x)
          {
              int n2 = nums2.Length;
              long total = 0;
              foreach (int a in nums1)
              {
                  int lo = 0, hi = n2;
                  if (a > 0)
                  {
                      while (lo < hi)
                      {
                          int mid = lo + (hi - lo) / 2;
                          if ((long)a * nums2[mid] <= x) lo = mid + 1; else hi = mid;
                      }
                      total += lo;
                  }
                  else if (a < 0)
                  {
                      while (lo < hi)
                      {
                          int mid = lo + (hi - lo) / 2;
                          if ((long)a * nums2[mid] <= x) hi = mid; else lo = mid + 1;
                      }
                      total += n2 - lo;
                  }
                  else if (x >= 0)
                  {
                      total += n2;
                  }
              }
              return total;
          }
        `,
        go: code`
          func kthSmallestProduct(nums1 []int, nums2 []int, k int) int {
              n2 := len(nums2)
              countAtMost := func(x int) int {
                  total := 0
                  for _, a := range nums1 {
                      lo, hi := 0, n2
                      if a > 0 {
                          for lo < hi {
                              mid := (lo + hi) / 2
                              if a*nums2[mid] <= x {
                                  lo = mid + 1
                              } else {
                                  hi = mid
                              }
                          }
                          total += lo
                      } else if a < 0 {
                          for lo < hi {
                              mid := (lo + hi) / 2
                              if a*nums2[mid] <= x {
                                  hi = mid
                              } else {
                                  lo = mid + 1
                              }
                          }
                          total += n2 - lo
                      } else if x >= 0 {
                          total += n2
                      }
                  }
                  return total
              }
              lo, hi := -100000000, 100000000
              for lo < hi {
                  mid := lo + (hi-lo)/2
                  if countAtMost(mid) >= k {
                      hi = mid
                  } else {
                      lo = mid + 1
                  }
              }
              return lo
          }
        `,
        kotlin: code`
          fun kthSmallestProduct(nums1: IntArray, nums2: IntArray, k: Int): Int {
              val n2 = nums2.size
              fun countAtMost(x: Long): Long {
                  var total = 0L
                  for (a in nums1) {
                      var lo = 0
                      var hi = n2
                      if (a > 0) {
                          while (lo < hi) {
                              val mid = (lo + hi) / 2
                              if (a.toLong() * nums2[mid] <= x) lo = mid + 1 else hi = mid
                          }
                          total += lo
                      } else if (a < 0) {
                          while (lo < hi) {
                              val mid = (lo + hi) / 2
                              if (a.toLong() * nums2[mid] <= x) hi = mid else lo = mid + 1
                          }
                          total += n2 - lo
                      } else if (x >= 0) {
                          total += n2
                      }
                  }
                  return total
              }
              var lo = -100000000
              var hi = 100000000
              while (lo < hi) {
                  val mid = lo + (hi - lo) / 2
                  if (countAtMost(mid.toLong()) >= k) hi = mid else lo = mid + 1
              }
              return lo
          }
        `,
        swift: code`
          func kthSmallestProduct(_ nums1: [Int], _ nums2: [Int], _ k: Int) -> Int {
              let n2 = nums2.count
              func countAtMost(_ x: Int) -> Int {
                  var total = 0
                  for a in nums1 {
                      var lo = 0
                      var hi = n2
                      if a > 0 {
                          while lo < hi {
                              let mid = (lo + hi) / 2
                              if a * nums2[mid] <= x { lo = mid + 1 } else { hi = mid }
                          }
                          total += lo
                      } else if a < 0 {
                          while lo < hi {
                              let mid = (lo + hi) / 2
                              if a * nums2[mid] <= x { hi = mid } else { lo = mid + 1 }
                          }
                          total += n2 - lo
                      } else if x >= 0 {
                          total += n2
                      }
                  }
                  return total
              }
              var lo = -100000000
              var hi = 100000000
              while lo < hi {
                  let mid = lo + (hi - lo) / 2
                  if countAtMost(mid) >= k { hi = mid } else { lo = mid + 1 }
              }
              return lo
          }
        `,
        rust: code`
          fn kthSmallestProduct(nums1: Vec<i32>, nums2: Vec<i32>, k: i32) -> i32 {
              let n2 = nums2.len();
              let count_at_most = |x: i64| -> i64 {
                  let mut total: i64 = 0;
                  for &a in nums1.iter() {
                      let a = a as i64;
                      let mut lo = 0usize;
                      let mut hi = n2;
                      if a > 0 {
                          while lo < hi {
                              let mid = (lo + hi) / 2;
                              if a * (nums2[mid] as i64) <= x { lo = mid + 1; } else { hi = mid; }
                          }
                          total += lo as i64;
                      } else if a < 0 {
                          while lo < hi {
                              let mid = (lo + hi) / 2;
                              if a * (nums2[mid] as i64) <= x { hi = mid; } else { lo = mid + 1; }
                          }
                          total += (n2 - lo) as i64;
                      } else if x >= 0 {
                          total += n2 as i64;
                      }
                  }
                  total
              };
              let mut lo: i64 = -100000000;
              let mut hi: i64 = 100000000;
              while lo < hi {
                  let mid = lo + (hi - lo) / 2;
                  if count_at_most(mid) >= k as i64 { hi = mid; } else { lo = mid + 1; }
              }
              lo as i32
          }
        `,
        php: code`
          function countProductsAtMost($nums1, $nums2, $x) {
              $n2 = count($nums2);
              $total = 0;
              foreach ($nums1 as $a) {
                  $lo = 0;
                  $hi = $n2;
                  if ($a > 0) {
                      while ($lo < $hi) {
                          $mid = intdiv($lo + $hi, 2);
                          if ($a * $nums2[$mid] <= $x) $lo = $mid + 1; else $hi = $mid;
                      }
                      $total += $lo;
                  } elseif ($a < 0) {
                      while ($lo < $hi) {
                          $mid = intdiv($lo + $hi, 2);
                          if ($a * $nums2[$mid] <= $x) $hi = $mid; else $lo = $mid + 1;
                      }
                      $total += $n2 - $lo;
                  } elseif ($x >= 0) {
                      $total += $n2;
                  }
              }
              return $total;
          }

          function kthSmallestProduct($nums1, $nums2, $k) {
              $lo = -100000000;
              $hi = 100000000;
              while ($lo < $hi) {
                  $mid = $lo + intdiv($hi - $lo, 2);
                  if (countProductsAtMost($nums1, $nums2, $mid) >= $k) $hi = $mid; else $lo = $mid + 1;
              }
              return $lo;
          }
        `,
        ruby: code`
          def kthSmallestProduct(nums1, nums2, k)
            n2 = nums2.length
            count_at_most = lambda do |x|
              total = 0
              nums1.each do |a|
                if a > 0
                  j = nums2.bsearch_index { |b| a * b > x } || n2
                  total += j
                elsif a < 0
                  j = nums2.bsearch_index { |b| a * b <= x } || n2
                  total += n2 - j
                elsif x >= 0
                  total += n2
                end
              end
              total
            end
            lo = -100000000
            hi = 100000000
            while lo < hi
              mid = lo + (hi - lo) / 2
              if count_at_most.call(mid) >= k
                hi = mid
              else
                lo = mid + 1
              end
            end
            lo
          end
        `,
      },
    };
  })(),

  // ── Number of Flowers in Full Bloom (LC 2251) ───────────────────
  (() => {
    const ref = (flowers: number[][], people: number[]) =>
      people.map((t) => flowers.filter(([s, e]) => s <= t && t <= e).length);
    return {
      slug: "number-of-flowers-in-full-bloom",
      title: "Number of Flowers in Full Bloom",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Sorting", "Prefix Sum", "Google", "Amazon", "Meta"],
      signature: {
        funcName: "fullBloomFlowers",
        params: [{ name: "flowers", type: "int[][]" as const }, { name: "people", type: "int[]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "A garden has flowers whose blooming windows are given as `flowers[i] = [start_i, end_i]`: flower `i` is in full bloom at every time `t` with `start_i <= t <= end_i` (both ends inclusive).\n\nVisitors arrive at the times in `people`; visitor `j` arrives at `people[j]`.\n\nReturn an array `answer` of the same length as `people`, where `answer[j]` is the number of flowers in full bloom when visitor `j` arrives.",
        [
          { in: "flowers = [[1,6],[3,7],[9,12],[4,13]], people = [2,3,7,11]", out: "[1,2,2,2]", note: "At time 7 the flowers [3,7] and [4,13] bloom; [1,6] has just ended." },
          { in: "flowers = [[1,10],[3,3]], people = [3,3,2]", out: "[2,2,1]" },
        ],
        ["1 <= flowers.length <= 5 * 10^4", "flowers[i].length == 2", "1 <= start_i <= end_i <= 10^9", "1 <= people.length <= 5 * 10^4", "1 <= people[j] <= 10^9"]),
      hints: [
        "A flower blooms at time `t` exactly when it has started by `t` and has not ended before `t`.",
        "So the count at `t` is (number of starts `<= t`) minus (number of ends `< t`) — every flower that ended before `t` had also started.",
        "Sort the start times and the end times separately; each of the two counts is one binary search.",
      ],
      editorial: explain({
        idea: "Split the intervals into two sorted lists — starts and ends. The number of flowers blooming at `t` equals the starts at or before `t` minus the ends strictly before `t`, and both counts are binary searches.",
        steps: [
          "Copy all `start_i` into one array and all `end_i` into another; sort both.",
          "For each arrival `t`, let `started` = number of starts `<= t` (upper bound of `t`).",
          "Let `ended` = number of ends `< t` (lower bound of `t`).",
          "The answer for that visitor is `started - ended`.",
        ],
        why: "Every flower with `end < t` also has `start <= end < t`, so it is counted in `started`. Subtracting those leaves exactly the flowers with `start <= t <= end`. Because the two lists are sorted, the counts are the insertion points found by binary search.",
        time: "O((f + p) log f)",
        space: "O(f)",
        pitfalls: [
          "The bloom window is inclusive at both ends — ends count as `< t`, starts as `<= t`.",
          "Visitors are not sorted; answer them in input order.",
          "A sweep over sorted events also works, but needs the visitors sorted with their indices kept.",
        ],
      }),
      examples: [
        { input: "[[1,6],[3,7],[9,12],[4,13]]\n[2,3,7,11]", expectedOutput: "[1,2,2,2]" },
        { input: "[[1,10],[3,3]]\n[3,3,2]", expectedOutput: "[2,2,1]" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [10, 100, 1000000000]);
        const f = ri(rng, 1, pick(rng, [1, 5, 25]));
        const flowers = Array.from({ length: f }, () => {
          const s = ri(rng, 1, span);
          return [s, Math.min(span, s + ri(rng, 0, pick(rng, [0, 3, span])))];
        });
        const people = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 25])) }, () => ri(rng, 1, span));
        return { input: `${fmtIntMat(flowers)}\n${fmtIntArr(people)}`, expectedOutput: fmtIntArr(ref(flowers, people)) };
      },
      solutions: {
        python: code`
          from typing import List
          import bisect

          def fullBloomFlowers(flowers: List[List[int]], people: List[int]) -> List[int]:
              starts = sorted(f[0] for f in flowers)
              ends = sorted(f[1] for f in flowers)
              return [bisect.bisect_right(starts, t) - bisect.bisect_left(ends, t) for t in people]
        `,
        javascript: code`
          var fullBloomFlowers = function(flowers, people) {
              var starts = [], ends = [];
              for (var i = 0; i < flowers.length; i++) {
                  starts.push(flowers[i][0]);
                  ends.push(flowers[i][1]);
              }
              var asc = function(a, b) { return a - b; };
              starts.sort(asc);
              ends.sort(asc);
              var firstAbove = function(a, t, strict) {
                  var lo = 0, hi = a.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (strict ? a[mid] <= t : a[mid] < t) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              };
              var res = [];
              for (var j = 0; j < people.length; j++) {
                  var t = people[j];
                  res.push(firstAbove(starts, t, true) - firstAbove(ends, t, false));
              }
              return res;
          };
        `,
        typescript: code`
          function fullBloomFlowers(flowers: number[][], people: number[]): number[] {
              var starts: number[] = [], ends: number[] = [];
              for (var i = 0; i < flowers.length; i++) {
                  starts.push(flowers[i][0]);
                  ends.push(flowers[i][1]);
              }
              var asc = function(a: number, b: number): number { return a - b; };
              starts.sort(asc);
              ends.sort(asc);
              var firstAbove = function(a: number[], t: number, strict: boolean): number {
                  var lo = 0, hi = a.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (strict ? a[mid] <= t : a[mid] < t) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              };
              var res: number[] = [];
              for (var j = 0; j < people.length; j++) {
                  var t = people[j];
                  res.push(firstAbove(starts, t, true) - firstAbove(ends, t, false));
              }
              return res;
          }
        `,
        java: code`
          public static int[] fullBloomFlowers(int[][] flowers, int[] people) {
              int f = flowers.length;
              int[] starts = new int[f], ends = new int[f];
              for (int i = 0; i < f; i++) { starts[i] = flowers[i][0]; ends[i] = flowers[i][1]; }
              Arrays.sort(starts);
              Arrays.sort(ends);
              int[] res = new int[people.length];
              for (int j = 0; j < people.length; j++) {
                  res[j] = firstIndexAbove(starts, people[j], true) - firstIndexAbove(ends, people[j], false);
              }
              return res;
          }

          static int firstIndexAbove(int[] a, int t, boolean strict) {
              int lo = 0, hi = a.length;
              while (lo < hi) {
                  int mid = (lo + hi) >>> 1;
                  if (strict ? a[mid] <= t : a[mid] < t) lo = mid + 1; else hi = mid;
              }
              return lo;
          }
        `,
        cpp: code`
          vector<int> fullBloomFlowers(vector<vector<int>>& flowers, vector<int>& people) {
              vector<int> starts, ends;
              for (auto& f : flowers) { starts.push_back(f[0]); ends.push_back(f[1]); }
              sort(starts.begin(), starts.end());
              sort(ends.begin(), ends.end());
              vector<int> res;
              for (int t : people) {
                  int started = upper_bound(starts.begin(), starts.end(), t) - starts.begin();
                  int ended = lower_bound(ends.begin(), ends.end(), t) - ends.begin();
                  res.push_back(started - ended);
              }
              return res;
          }
        `,
        c: code`
          static int bloomCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          static int bloomFirstAbove(int* a, int n, int t, int strict) {
              int lo = 0, hi = n;
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (strict ? a[mid] <= t : a[mid] < t) lo = mid + 1; else hi = mid;
              }
              return lo;
          }

          int* fullBloomFlowers(int** flowers, int flowersSize, int* flowersColSize, int* people, int peopleSize, int* returnSize) {
              int* starts = (int*)malloc(sizeof(int) * flowersSize);
              int* ends = (int*)malloc(sizeof(int) * flowersSize);
              for (int i = 0; i < flowersSize; i++) { starts[i] = flowers[i][0]; ends[i] = flowers[i][1]; }
              qsort(starts, flowersSize, sizeof(int), bloomCmp);
              qsort(ends, flowersSize, sizeof(int), bloomCmp);
              int* res = (int*)malloc(sizeof(int) * (peopleSize > 0 ? peopleSize : 1));
              for (int j = 0; j < peopleSize; j++) {
                  res[j] = bloomFirstAbove(starts, flowersSize, people[j], 1) - bloomFirstAbove(ends, flowersSize, people[j], 0);
              }
              free(starts);
              free(ends);
              *returnSize = peopleSize;
              return res;
          }
        `,
        csharp: code`
          public static int[] FullBloomFlowers(int[][] flowers, int[] people)
          {
              int f = flowers.Length;
              int[] starts = new int[f], ends = new int[f];
              for (int i = 0; i < f; i++) { starts[i] = flowers[i][0]; ends[i] = flowers[i][1]; }
              Array.Sort(starts);
              Array.Sort(ends);
              int[] res = new int[people.Length];
              for (int j = 0; j < people.Length; j++)
                  res[j] = FirstIndexAbove(starts, people[j], true) - FirstIndexAbove(ends, people[j], false);
              return res;
          }

          static int FirstIndexAbove(int[] a, int t, bool strict)
          {
              int lo = 0, hi = a.Length;
              while (lo < hi)
              {
                  int mid = lo + (hi - lo) / 2;
                  if (strict ? a[mid] <= t : a[mid] < t) lo = mid + 1; else hi = mid;
              }
              return lo;
          }
        `,
        go: code`
          func fullBloomFlowers(flowers [][]int, people []int) []int {
              starts := make([]int, len(flowers))
              ends := make([]int, len(flowers))
              for i, f := range flowers {
                  starts[i] = f[0]
                  ends[i] = f[1]
              }
              sort.Ints(starts)
              sort.Ints(ends)
              res := make([]int, len(people))
              for j, t := range people {
                  started := sort.SearchInts(starts, t+1)
                  ended := sort.SearchInts(ends, t)
                  res[j] = started - ended
              }
              return res
          }
        `,
        kotlin: code`
          fun fullBloomFlowers(flowers: Array<IntArray>, people: IntArray): IntArray {
              val starts = IntArray(flowers.size) { flowers[it][0] }
              val ends = IntArray(flowers.size) { flowers[it][1] }
              starts.sort()
              ends.sort()
              fun firstAbove(a: IntArray, t: Int, strict: Boolean): Int {
                  var lo = 0
                  var hi = a.size
                  while (lo < hi) {
                      val mid = (lo + hi) / 2
                      val goRight = if (strict) a[mid] <= t else a[mid] < t
                      if (goRight) lo = mid + 1 else hi = mid
                  }
                  return lo
              }
              return IntArray(people.size) { firstAbove(starts, people[it], true) - firstAbove(ends, people[it], false) }
          }
        `,
        swift: code`
          func fullBloomFlowers(_ flowers: [[Int]], _ people: [Int]) -> [Int] {
              let starts = flowers.map { $0[0] }.sorted()
              let ends = flowers.map { $0[1] }.sorted()
              func firstAbove(_ a: [Int], _ t: Int, _ strict: Bool) -> Int {
                  var lo = 0
                  var hi = a.count
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      let goRight = strict ? a[mid] <= t : a[mid] < t
                      if goRight { lo = mid + 1 } else { hi = mid }
                  }
                  return lo
              }
              return people.map { firstAbove(starts, $0, true) - firstAbove(ends, $0, false) }
          }
        `,
        rust: code`
          fn fullBloomFlowers(flowers: Vec<Vec<i32>>, people: Vec<i32>) -> Vec<i32> {
              let mut starts: Vec<i32> = flowers.iter().map(|f| f[0]).collect();
              let mut ends: Vec<i32> = flowers.iter().map(|f| f[1]).collect();
              starts.sort();
              ends.sort();
              fn first_above(a: &Vec<i32>, t: i32, strict: bool) -> usize {
                  let mut lo = 0usize;
                  let mut hi = a.len();
                  while lo < hi {
                      let mid = (lo + hi) / 2;
                      let go_right = if strict { a[mid] <= t } else { a[mid] < t };
                      if go_right { lo = mid + 1; } else { hi = mid; }
                  }
                  lo
              }
              people.iter().map(|&t| first_above(&starts, t, true) as i32 - first_above(&ends, t, false) as i32).collect()
          }
        `,
        php: code`
          function bloomFirstAbove($a, $t, $strict) {
              $lo = 0;
              $hi = count($a);
              while ($lo < $hi) {
                  $mid = intdiv($lo + $hi, 2);
                  $goRight = $strict ? $a[$mid] <= $t : $a[$mid] < $t;
                  if ($goRight) $lo = $mid + 1; else $hi = $mid;
              }
              return $lo;
          }

          function fullBloomFlowers($flowers, $people) {
              $starts = [];
              $ends = [];
              foreach ($flowers as $f) { $starts[] = $f[0]; $ends[] = $f[1]; }
              sort($starts);
              sort($ends);
              $res = [];
              foreach ($people as $t) $res[] = bloomFirstAbove($starts, $t, true) - bloomFirstAbove($ends, $t, false);
              return $res;
          }
        `,
        ruby: code`
          def fullBloomFlowers(flowers, people)
            starts = flowers.map { |f| f[0] }.sort
            ends = flowers.map { |f| f[1] }.sort
            people.map do |t|
              started = starts.bsearch_index { |x| x > t } || starts.length
              ended = ends.bsearch_index { |x| x >= t } || ends.length
              started - ended
            end
          end
        `,
      },
    };
  })(),

  // ── Count Number of Rectangles Containing Each Point (LC 2250) ──
  (() => {
    const ref = (rectangles: number[][], points: number[][]) =>
      points.map(([x, y]) => rectangles.filter(([l, h]) => x <= l && y <= h).length);
    return {
      slug: "count-number-of-rectangles-containing-each-point",
      title: "Count Number of Rectangles Containing Each Point",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Binary Search", "Sorting", "Google", "Amazon"],
      signature: {
        funcName: "countRectangles",
        params: [{ name: "rectangles", type: "int[][]" as const }, { name: "points", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "Each `rectangles[i] = [l_i, h_i]` is an axis-aligned rectangle with its bottom-left corner at the origin `(0, 0)` and its top-right corner at `(l_i, h_i)`.\n\nEach `points[j] = [x_j, y_j]` is a point. A rectangle **contains** a point when `0 <= x_j <= l_i` and `0 <= y_j <= h_i` — points on the edges count.\n\nReturn an array whose `j`-th entry is the number of rectangles that contain point `j`. Heights are small (at most 100) while lengths can be huge.",
        [
          { in: "rectangles = [[1,2],[2,3],[2,5]], points = [[2,1],[1,4]]", out: "[2,1]", note: "Point (2, 1) lies in [2,3] and [2,5]; point (1, 4) only in [2,5]." },
          { in: "rectangles = [[4,7],[9,2],[6,7]], points = [[5,7],[1,1],[10,1]]", out: "[1,3,0]" },
        ],
        ["1 <= rectangles.length, points.length <= 5 * 10^4", "1 <= l_i, x_j <= 10^9", "1 <= h_i, y_j <= 100", "All rectangles are distinct, and all points are distinct."]),
      hints: [
        "Heights only range over 1..100 — that is small enough to loop over.",
        "Group the rectangles by height and sort each group's lengths.",
        "For a point `(x, y)`, visit every height `h >= y` and binary-search how many lengths in that group are `>= x`.",
      ],
      editorial: explain({
        idea: "Exploit the tiny height range: bucket rectangle lengths by height, sort each bucket, and answer a point by summing, over the heights that are tall enough, how many lengths are long enough — a binary search per bucket.",
        steps: [
          "Create 101 buckets; put `l_i` into bucket `h_i` for every rectangle.",
          "Sort every bucket.",
          "For each point `(x, y)`, loop `h` from `y` to 100 and add `bucket[h].length - lowerBound(bucket[h], x)` (the lengths that are `>= x`).",
          "Return the sums in point order.",
        ],
        why: "A rectangle contains `(x, y)` exactly when its height is at least `y` and its length is at least `x`. Bucketing by height enumerates the first condition directly, and inside a sorted bucket the lengths `>= x` form a suffix whose start is the lower bound of `x`.",
        time: "O(R log R + P · 100 · log R)",
        space: "O(R)",
        pitfalls: [
          "Containment includes the edges: use `>=` for both coordinates.",
          "Do not sort by length and loop over lengths — they go up to 10^9; it is the heights that are small.",
          "Answers must come back in the original point order.",
        ],
      }),
      examples: [
        { input: "[[1,2],[2,3],[2,5]]\n[[2,1],[1,4]]", expectedOutput: "[2,1]" },
        { input: "[[4,7],[9,2],[6,7]]\n[[5,7],[1,1],[10,1]]", expectedOutput: "[1,3,0]" },
      ],
      gen: (rng: Rng) => {
        const lspan = pick(rng, [5, 100, 1000000000]);
        const hspan = pick(rng, [3, 10, 100]);
        const distinct = (count: number) => {
          const seen = new Set<string>();
          const out: number[][] = [];
          for (let tries = 0; out.length < count && tries < count * 20; tries++) {
            const a = ri(rng, 1, lspan), b = ri(rng, 1, hspan);
            const key = `${a},${b}`;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push([a, b]);
          }
          return out;
        };
        const rectangles = distinct(ri(rng, 1, pick(rng, [1, 6, 25])));
        const points = distinct(ri(rng, 1, pick(rng, [1, 6, 25])));
        return { input: `${fmtIntMat(rectangles)}\n${fmtIntMat(points)}`, expectedOutput: fmtIntArr(ref(rectangles, points)) };
      },
      solutions: {
        python: code`
          from typing import List
          import bisect

          def countRectangles(rectangles: List[List[int]], points: List[List[int]]) -> List[int]:
              buckets = [[] for _ in range(101)]
              for l, h in rectangles:
                  buckets[h].append(l)
              for b in buckets:
                  b.sort()
              res = []
              for x, y in points:
                  total = 0
                  for h in range(y, 101):
                      b = buckets[h]
                      if b:
                          total += len(b) - bisect.bisect_left(b, x)
                  res.append(total)
              return res
        `,
        javascript: code`
          var countRectangles = function(rectangles, points) {
              var buckets = [];
              for (var h = 0; h <= 100; h++) buckets.push([]);
              for (var i = 0; i < rectangles.length; i++) buckets[rectangles[i][1]].push(rectangles[i][0]);
              for (var h2 = 0; h2 <= 100; h2++) buckets[h2].sort(function(a, b) { return a - b; });
              var res = [];
              for (var j = 0; j < points.length; j++) {
                  var x = points[j][0], y = points[j][1], total = 0;
                  for (var hh = y; hh <= 100; hh++) {
                      var b = buckets[hh];
                      if (b.length === 0) continue;
                      var lo = 0, hi = b.length;
                      while (lo < hi) {
                          var mid = (lo + hi) >> 1;
                          if (b[mid] < x) lo = mid + 1; else hi = mid;
                      }
                      total += b.length - lo;
                  }
                  res.push(total);
              }
              return res;
          };
        `,
        typescript: code`
          function countRectangles(rectangles: number[][], points: number[][]): number[] {
              var buckets: number[][] = [];
              for (var h = 0; h <= 100; h++) buckets.push([]);
              for (var i = 0; i < rectangles.length; i++) buckets[rectangles[i][1]].push(rectangles[i][0]);
              for (var h2 = 0; h2 <= 100; h2++) buckets[h2].sort(function(a, b) { return a - b; });
              var res: number[] = [];
              for (var j = 0; j < points.length; j++) {
                  var x = points[j][0], y = points[j][1], total = 0;
                  for (var hh = y; hh <= 100; hh++) {
                      var b = buckets[hh];
                      if (b.length === 0) continue;
                      var lo = 0, hi = b.length;
                      while (lo < hi) {
                          var mid = (lo + hi) >> 1;
                          if (b[mid] < x) lo = mid + 1; else hi = mid;
                      }
                      total += b.length - lo;
                  }
                  res.push(total);
              }
              return res;
          }
        `,
        java: code`
          public static int[] countRectangles(int[][] rectangles, int[][] points) {
              List<List<Integer>> tmp = new ArrayList<>();
              for (int h = 0; h <= 100; h++) tmp.add(new ArrayList<>());
              for (int[] r : rectangles) tmp.get(r[1]).add(r[0]);
              int[][] buckets = new int[101][];
              for (int h = 0; h <= 100; h++) {
                  List<Integer> src = tmp.get(h);
                  buckets[h] = new int[src.size()];
                  for (int i = 0; i < src.size(); i++) buckets[h][i] = src.get(i);
                  Arrays.sort(buckets[h]);
              }
              int[] res = new int[points.length];
              for (int j = 0; j < points.length; j++) {
                  int x = points[j][0], y = points[j][1], total = 0;
                  for (int h = y; h <= 100; h++) {
                      int[] b = buckets[h];
                      int lo = 0, hi = b.length;
                      while (lo < hi) {
                          int mid = (lo + hi) >>> 1;
                          if (b[mid] < x) lo = mid + 1; else hi = mid;
                      }
                      total += b.length - lo;
                  }
                  res[j] = total;
              }
              return res;
          }
        `,
        cpp: code`
          vector<int> countRectangles(vector<vector<int>>& rectangles, vector<vector<int>>& points) {
              vector<vector<int>> buckets(101);
              for (auto& r : rectangles) buckets[r[1]].push_back(r[0]);
              for (auto& b : buckets) sort(b.begin(), b.end());
              vector<int> res;
              for (auto& p : points) {
                  int x = p[0], y = p[1], total = 0;
                  for (int h = y; h <= 100; h++) {
                      const vector<int>& b = buckets[h];
                      total += b.end() - lower_bound(b.begin(), b.end(), x);
                  }
                  res.push_back(total);
              }
              return res;
          }
        `,
        c: code`
          static int rectCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int* countRectangles(int** rectangles, int rectanglesSize, int* rectanglesColSize, int** points, int pointsSize, int* pointsColSize, int* returnSize) {
              int start[102];
              for (int h = 0; h <= 101; h++) start[h] = 0;
              for (int i = 0; i < rectanglesSize; i++) start[rectangles[i][1] + 1]++;
              for (int h = 1; h <= 101; h++) start[h] += start[h - 1];
              int* lens = (int*)malloc(sizeof(int) * (rectanglesSize > 0 ? rectanglesSize : 1));
              int fill[101];
              for (int h = 0; h <= 100; h++) fill[h] = start[h];
              for (int i = 0; i < rectanglesSize; i++) lens[fill[rectangles[i][1]]++] = rectangles[i][0];
              for (int h = 0; h <= 100; h++) {
                  int cnt = start[h + 1] - start[h];
                  if (cnt > 1) qsort(lens + start[h], cnt, sizeof(int), rectCmp);
              }
              int* res = (int*)malloc(sizeof(int) * (pointsSize > 0 ? pointsSize : 1));
              for (int j = 0; j < pointsSize; j++) {
                  int x = points[j][0], y = points[j][1], total = 0;
                  for (int h = y; h <= 100; h++) {
                      int lo = start[h], hi = start[h + 1];
                      while (lo < hi) {
                          int mid = lo + (hi - lo) / 2;
                          if (lens[mid] < x) lo = mid + 1; else hi = mid;
                      }
                      total += start[h + 1] - lo;
                  }
                  res[j] = total;
              }
              free(lens);
              *returnSize = pointsSize;
              return res;
          }
        `,
        csharp: code`
          public static int[] CountRectangles(int[][] rectangles, int[][] points)
          {
              var tmp = new List<int>[101];
              for (int h = 0; h <= 100; h++) tmp[h] = new List<int>();
              foreach (var r in rectangles) tmp[r[1]].Add(r[0]);
              var buckets = new int[101][];
              for (int h = 0; h <= 100; h++)
              {
                  buckets[h] = tmp[h].ToArray();
                  Array.Sort(buckets[h]);
              }
              int[] res = new int[points.Length];
              for (int j = 0; j < points.Length; j++)
              {
                  int x = points[j][0], y = points[j][1], total = 0;
                  for (int h = y; h <= 100; h++)
                  {
                      int[] b = buckets[h];
                      int lo = 0, hi = b.Length;
                      while (lo < hi)
                      {
                          int mid = lo + (hi - lo) / 2;
                          if (b[mid] < x) lo = mid + 1; else hi = mid;
                      }
                      total += b.Length - lo;
                  }
                  res[j] = total;
              }
              return res;
          }
        `,
        go: code`
          func countRectangles(rectangles [][]int, points [][]int) []int {
              buckets := make([][]int, 101)
              for _, r := range rectangles {
                  buckets[r[1]] = append(buckets[r[1]], r[0])
              }
              for _, b := range buckets {
                  sort.Ints(b)
              }
              res := make([]int, len(points))
              for j, p := range points {
                  x, y := p[0], p[1]
                  total := 0
                  for h := y; h <= 100; h++ {
                      b := buckets[h]
                      total += len(b) - sort.SearchInts(b, x)
                  }
                  res[j] = total
              }
              return res
          }
        `,
        kotlin: code`
          fun countRectangles(rectangles: Array<IntArray>, points: Array<IntArray>): IntArray {
              val tmp = Array(101) { ArrayList<Int>() }
              for (r in rectangles) tmp[r[1]].add(r[0])
              val buckets = Array(101) { tmp[it].toIntArray() }
              for (b in buckets) b.sort()
              val res = IntArray(points.size)
              for (j in points.indices) {
                  val x = points[j][0]
                  val y = points[j][1]
                  var total = 0
                  for (h in y..100) {
                      val b = buckets[h]
                      var lo = 0
                      var hi = b.size
                      while (lo < hi) {
                          val mid = (lo + hi) / 2
                          if (b[mid] < x) lo = mid + 1 else hi = mid
                      }
                      total += b.size - lo
                  }
                  res[j] = total
              }
              return res
          }
        `,
        swift: code`
          func countRectangles(_ rectangles: [[Int]], _ points: [[Int]]) -> [Int] {
              var buckets = Array(repeating: [Int](), count: 101)
              for r in rectangles { buckets[r[1]].append(r[0]) }
              for h in 0...100 { buckets[h].sort() }
              var res = [Int]()
              for p in points {
                  let x = p[0]
                  let y = p[1]
                  var total = 0
                  for h in y...100 {
                      let b = buckets[h]
                      var lo = 0
                      var hi = b.count
                      while lo < hi {
                          let mid = (lo + hi) / 2
                          if b[mid] < x { lo = mid + 1 } else { hi = mid }
                      }
                      total += b.count - lo
                  }
                  res.append(total)
              }
              return res
          }
        `,
        rust: code`
          fn countRectangles(rectangles: Vec<Vec<i32>>, points: Vec<Vec<i32>>) -> Vec<i32> {
              let mut buckets: Vec<Vec<i32>> = vec![Vec::new(); 101];
              for r in rectangles.iter() {
                  buckets[r[1] as usize].push(r[0]);
              }
              for b in buckets.iter_mut() {
                  b.sort();
              }
              let mut res = Vec::with_capacity(points.len());
              for p in points.iter() {
                  let x = p[0];
                  let y = p[1] as usize;
                  let mut total = 0i32;
                  for h in y..=100 {
                      let b = &buckets[h];
                      let mut lo = 0usize;
                      let mut hi = b.len();
                      while lo < hi {
                          let mid = (lo + hi) / 2;
                          if b[mid] < x { lo = mid + 1; } else { hi = mid; }
                      }
                      total += (b.len() - lo) as i32;
                  }
                  res.push(total);
              }
              res
          }
        `,
        php: code`
          function countRectangles($rectangles, $points) {
              $buckets = array_fill(0, 101, []);
              foreach ($rectangles as $r) $buckets[$r[1]][] = $r[0];
              for ($h = 0; $h <= 100; $h++) sort($buckets[$h]);
              $res = [];
              foreach ($points as $p) {
                  $x = $p[0];
                  $y = $p[1];
                  $total = 0;
                  for ($h = $y; $h <= 100; $h++) {
                      $b = $buckets[$h];
                      $len = count($b);
                      $lo = 0;
                      $hi = $len;
                      while ($lo < $hi) {
                          $mid = intdiv($lo + $hi, 2);
                          if ($b[$mid] < $x) $lo = $mid + 1; else $hi = $mid;
                      }
                      $total += $len - $lo;
                  }
                  $res[] = $total;
              }
              return $res;
          }
        `,
        ruby: code`
          def countRectangles(rectangles, points)
            buckets = Array.new(101) { [] }
            rectangles.each { |r| buckets[r[1]] << r[0] }
            buckets.each(&:sort!)
            points.map do |pt|
              x = pt[0]
              y = pt[1]
              total = 0
              (y..100).each do |h|
                b = buckets[h]
                next if b.empty?
                i = b.bsearch_index { |v| v >= x } || b.length
                total += b.length - i
              end
              total
            end
          end
        `,
      },
    };
  })(),

  // ── Minimum Absolute Sum Difference (LC 1818) ───────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (a: number[], b: number[]) => {
      let total = 0;
      for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
      let gain = 0;
      for (let i = 0; i < a.length; i++) {
        const d = Math.abs(a[i] - b[i]);
        for (let j = 0; j < a.length; j++) gain = Math.max(gain, d - Math.abs(a[j] - b[i]));
      }
      return (total - gain) % MOD;
    };
    return {
      slug: "minimum-absolute-sum-difference",
      title: "Minimum Absolute Sum Difference",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Sorting", "Ordered Set", "Google", "Amazon"],
      signature: {
        funcName: "minAbsoluteSumDiff",
        params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "`nums1` and `nums2` both have length `n`. Their **absolute sum difference** is the sum of `|nums1[i] - nums2[i]|` over all `i`.\n\nYou may perform **at most one** replacement: overwrite one element of `nums1` with a copy of any element of `nums1` (possibly the same one).\n\nReturn the smallest absolute sum difference you can reach. The sum can be large, so return it **modulo** `10^9 + 7` — apply the modulus only to the final minimum.",
        [
          { in: "nums1 = [1,7,5], nums2 = [2,3,5]", out: "3", note: "Replace the 7 with a 1 (or a 5): |1-2| + |1-3| + |5-5| = 3." },
          { in: "nums1 = [2,4,6,8,10], nums2 = [2,4,6,8,10]", out: "0" },
          { in: "nums1 = [1,10,4,4,2,7], nums2 = [9,3,5,1,7,4]", out: "20", note: "Replacing the first element with 10 turns |1-9| = 8 into |10-9| = 1." },
        ],
        ["n == nums1.length == nums2.length", "1 <= n <= 10^5", "1 <= nums1[i], nums2[i] <= 10^5"]),
      hints: [
        "Only one position changes, so the best move is the one that reduces the total the most.",
        "If you overwrite position `i`, the best value to write is the element of `nums1` closest to `nums2[i]`.",
        "Sort a copy of `nums1` and binary-search, for every `i`, the neighbours of `nums2[i]`; track the largest saving `|nums1[i] - nums2[i]| - closest`.",
      ],
      editorial: explain({
        idea: "The total minus the largest possible saving is the answer. The saving at position `i` is its current difference minus the distance from `nums2[i]` to the nearest value in `nums1`, which a sorted copy plus binary search finds.",
        steps: [
          "Sort a copy `s` of `nums1`.",
          "For each `i`, add `d = |nums1[i] - nums2[i]|` to a 64-bit total.",
          "Binary-search the lower bound of `nums2[i]` in `s`; the closest value is `s[j]` or `s[j - 1]`.",
          "Record `best = max(best, d - closest distance)`.",
          "Return `(total - best) mod (10^9 + 7)`.",
        ],
        why: "Changing position `i` only affects the `i`-th term, so the new total is `total - d_i + c_i` where `c_i` is the new term; picking the nearest available value minimises `c_i`. Among the `n` choices of position the largest `d_i - c_i` gives the smallest result, and doing nothing corresponds to a saving of 0.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Take the modulus only at the end — reducing the total first and then subtracting the saving can go negative or pick the wrong minimum.",
          "The total can reach 10^10, so accumulate in 64-bit.",
          "Search the sorted copy of `nums1`, not `nums2`: the replacement must come from `nums1`.",
        ],
      }),
      examples: [
        { input: "[1,7,5]\n[2,3,5]", expectedOutput: "3" },
        { input: "[2,4,6,8,10]\n[2,4,6,8,10]", expectedOutput: "0" },
        { input: "[1,10,4,4,2,7]\n[9,3,5,1,7,4]", expectedOutput: "20" },
      ],
      gen: (rng: Rng) => {
        // A few large cases push the total past 10^9 + 7 so the modulus is exercised.
        if (rng() < 0.001) {
          const n = ri(rng, 10300, 10500);
          const a = Array.from({ length: n }, () => ri(rng, 99000, 100000));
          const b = Array.from({ length: n }, () => ri(rng, 1, 1000));
          return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: String(ref(a, b)) };
        }
        const n = ri(rng, 1, pick(rng, [1, 5, 30]));
        const span = pick(rng, [3, 20, 100000]);
        const a = Array.from({ length: n }, () => ri(rng, 1, span));
        const b = Array.from({ length: n }, () => ri(rng, 1, span));
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import List
          import bisect

          def minAbsoluteSumDiff(nums1: List[int], nums2: List[int]) -> int:
              s = sorted(nums1)
              n = len(s)
              total = 0
              best = 0
              for a, b in zip(nums1, nums2):
                  d = abs(a - b)
                  total += d
                  j = bisect.bisect_left(s, b)
                  c = d
                  if j < n:
                      c = min(c, s[j] - b)
                  if j > 0:
                      c = min(c, b - s[j - 1])
                  best = max(best, d - c)
              return (total - best) % 1000000007
        `,
        javascript: code`
          var minAbsoluteSumDiff = function(nums1, nums2) {
              var n = nums1.length;
              var s = nums1.slice().sort(function(a, b) { return a - b; });
              var total = 0, best = 0;
              for (var i = 0; i < n; i++) {
                  var b = nums2[i];
                  var d = Math.abs(nums1[i] - b);
                  total += d;
                  var lo = 0, hi = n;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (s[mid] < b) lo = mid + 1; else hi = mid;
                  }
                  var c = d;
                  if (lo < n && s[lo] - b < c) c = s[lo] - b;
                  if (lo > 0 && b - s[lo - 1] < c) c = b - s[lo - 1];
                  if (d - c > best) best = d - c;
              }
              return (total - best) % 1000000007;
          };
        `,
        typescript: code`
          function minAbsoluteSumDiff(nums1: number[], nums2: number[]): number {
              var n = nums1.length;
              var s: number[] = nums1.slice();
              s.sort(function(a, b) { return a - b; });
              var total = 0, best = 0;
              for (var i = 0; i < n; i++) {
                  var b = nums2[i];
                  var d = Math.abs(nums1[i] - b);
                  total += d;
                  var lo = 0, hi = n;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (s[mid] < b) lo = mid + 1; else hi = mid;
                  }
                  var c = d;
                  if (lo < n && s[lo] - b < c) c = s[lo] - b;
                  if (lo > 0 && b - s[lo - 1] < c) c = b - s[lo - 1];
                  if (d - c > best) best = d - c;
              }
              return (total - best) % 1000000007;
          }
        `,
        java: code`
          public static int minAbsoluteSumDiff(int[] nums1, int[] nums2) {
              int n = nums1.length;
              int[] s = nums1.clone();
              Arrays.sort(s);
              long total = 0;
              int best = 0;
              for (int i = 0; i < n; i++) {
                  int b = nums2[i];
                  int d = Math.abs(nums1[i] - b);
                  total += d;
                  int lo = 0, hi = n;
                  while (lo < hi) {
                      int mid = (lo + hi) >>> 1;
                      if (s[mid] < b) lo = mid + 1; else hi = mid;
                  }
                  int c = d;
                  if (lo < n) c = Math.min(c, s[lo] - b);
                  if (lo > 0) c = Math.min(c, b - s[lo - 1]);
                  best = Math.max(best, d - c);
              }
              return (int) ((total - best) % 1000000007L);
          }
        `,
        cpp: code`
          int minAbsoluteSumDiff(vector<int>& nums1, vector<int>& nums2) {
              int n = nums1.size();
              vector<int> s(nums1);
              sort(s.begin(), s.end());
              long long total = 0;
              int best = 0;
              for (int i = 0; i < n; i++) {
                  int b = nums2[i];
                  int d = abs(nums1[i] - b);
                  total += d;
                  int j = lower_bound(s.begin(), s.end(), b) - s.begin();
                  int c = d;
                  if (j < n) c = min(c, s[j] - b);
                  if (j > 0) c = min(c, b - s[j - 1]);
                  best = max(best, d - c);
              }
              return (int)((total - best) % 1000000007LL);
          }
        `,
        c: code`
          static int sumDiffCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int minAbsoluteSumDiff(int* nums1, int nums1Size, int* nums2, int nums2Size) {
              int n = nums1Size;
              int* s = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) s[i] = nums1[i];
              qsort(s, n, sizeof(int), sumDiffCmp);
              long long total = 0;
              int best = 0;
              for (int i = 0; i < n; i++) {
                  int b = nums2[i];
                  int d = nums1[i] - b;
                  if (d < 0) d = -d;
                  total += d;
                  int lo = 0, hi = n;
                  while (lo < hi) {
                      int mid = lo + (hi - lo) / 2;
                      if (s[mid] < b) lo = mid + 1; else hi = mid;
                  }
                  int c = d;
                  if (lo < n && s[lo] - b < c) c = s[lo] - b;
                  if (lo > 0 && b - s[lo - 1] < c) c = b - s[lo - 1];
                  if (d - c > best) best = d - c;
              }
              free(s);
              return (int)((total - best) % 1000000007LL);
          }
        `,
        csharp: code`
          public static int MinAbsoluteSumDiff(int[] nums1, int[] nums2)
          {
              int n = nums1.Length;
              int[] s = (int[])nums1.Clone();
              Array.Sort(s);
              long total = 0;
              int best = 0;
              for (int i = 0; i < n; i++)
              {
                  int b = nums2[i];
                  int d = Math.Abs(nums1[i] - b);
                  total += d;
                  int lo = 0, hi = n;
                  while (lo < hi)
                  {
                      int mid = lo + (hi - lo) / 2;
                      if (s[mid] < b) lo = mid + 1; else hi = mid;
                  }
                  int c = d;
                  if (lo < n) c = Math.Min(c, s[lo] - b);
                  if (lo > 0) c = Math.Min(c, b - s[lo - 1]);
                  best = Math.Max(best, d - c);
              }
              return (int)((total - best) % 1000000007L);
          }
        `,
        go: code`
          func minAbsoluteSumDiff(nums1 []int, nums2 []int) int {
              n := len(nums1)
              s := make([]int, n)
              copy(s, nums1)
              sort.Ints(s)
              total, best := 0, 0
              for i := 0; i < n; i++ {
                  b := nums2[i]
                  d := nums1[i] - b
                  if d < 0 {
                      d = -d
                  }
                  total += d
                  j := sort.SearchInts(s, b)
                  c := d
                  if j < n && s[j]-b < c {
                      c = s[j] - b
                  }
                  if j > 0 && b-s[j-1] < c {
                      c = b - s[j-1]
                  }
                  if d-c > best {
                      best = d - c
                  }
              }
              return (total - best) % 1000000007
          }
        `,
        kotlin: code`
          fun minAbsoluteSumDiff(nums1: IntArray, nums2: IntArray): Int {
              val n = nums1.size
              val s = nums1.sortedArray()
              var total = 0L
              var best = 0
              for (i in 0 until n) {
                  val b = nums2[i]
                  val d = Math.abs(nums1[i] - b)
                  total += d
                  var lo = 0
                  var hi = n
                  while (lo < hi) {
                      val mid = (lo + hi) / 2
                      if (s[mid] < b) lo = mid + 1 else hi = mid
                  }
                  var c = d
                  if (lo < n) c = minOf(c, s[lo] - b)
                  if (lo > 0) c = minOf(c, b - s[lo - 1])
                  best = maxOf(best, d - c)
              }
              return ((total - best) % 1000000007L).toInt()
          }
        `,
        swift: code`
          func minAbsoluteSumDiff(_ nums1: [Int], _ nums2: [Int]) -> Int {
              let n = nums1.count
              let s = nums1.sorted()
              var total = 0
              var best = 0
              for i in 0..<n {
                  let b = nums2[i]
                  let d = abs(nums1[i] - b)
                  total += d
                  var lo = 0
                  var hi = n
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if s[mid] < b { lo = mid + 1 } else { hi = mid }
                  }
                  var c = d
                  if lo < n { c = min(c, s[lo] - b) }
                  if lo > 0 { c = min(c, b - s[lo - 1]) }
                  best = max(best, d - c)
              }
              return (total - best) % 1000000007
          }
        `,
        rust: code`
          fn minAbsoluteSumDiff(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {
              let n = nums1.len();
              let mut s = nums1.clone();
              s.sort();
              let mut total: i64 = 0;
              let mut best: i32 = 0;
              for i in 0..n {
                  let b = nums2[i];
                  let d = (nums1[i] - b).abs();
                  total += d as i64;
                  let mut lo = 0usize;
                  let mut hi = n;
                  while lo < hi {
                      let mid = (lo + hi) / 2;
                      if s[mid] < b { lo = mid + 1; } else { hi = mid; }
                  }
                  let mut c = d;
                  if lo < n && s[lo] - b < c { c = s[lo] - b; }
                  if lo > 0 && b - s[lo - 1] < c { c = b - s[lo - 1]; }
                  if d - c > best { best = d - c; }
              }
              ((total - best as i64) % 1000000007) as i32
          }
        `,
        php: code`
          function minAbsoluteSumDiff($nums1, $nums2) {
              $n = count($nums1);
              $s = $nums1;
              sort($s);
              $total = 0;
              $best = 0;
              for ($i = 0; $i < $n; $i++) {
                  $b = $nums2[$i];
                  $d = abs($nums1[$i] - $b);
                  $total += $d;
                  $lo = 0;
                  $hi = $n;
                  while ($lo < $hi) {
                      $mid = intdiv($lo + $hi, 2);
                      if ($s[$mid] < $b) $lo = $mid + 1; else $hi = $mid;
                  }
                  $c = $d;
                  if ($lo < $n && $s[$lo] - $b < $c) $c = $s[$lo] - $b;
                  if ($lo > 0 && $b - $s[$lo - 1] < $c) $c = $b - $s[$lo - 1];
                  if ($d - $c > $best) $best = $d - $c;
              }
              return ($total - $best) % 1000000007;
          }
        `,
        ruby: code`
          def minAbsoluteSumDiff(nums1, nums2)
            s = nums1.sort
            n = s.length
            total = 0
            best = 0
            nums1.each_with_index do |a, i|
              b = nums2[i]
              d = (a - b).abs
              total += d
              j = s.bsearch_index { |v| v >= b } || n
              c = d
              c = [c, s[j] - b].min if j < n
              c = [c, b - s[j - 1]].min if j > 0
              best = d - c if d - c > best
            end
            (total - best) % 1000000007
          end
        `,
      },
    };
  })(),

  // ── Maximize the Minimum Powered City (LC 2528) ─────────────────
  (() => {
    const powers = (stations: number[], r: number) =>
      stations.map((_, i) => {
        let s = 0;
        for (let j = Math.max(0, i - r); j <= Math.min(stations.length - 1, i + r); j++) s += stations[j];
        return s;
      });
    // Exhaustive: try every way to place k stations (small cases only).
    const brute = (stations: number[], r: number, k: number) => {
      const n = stations.length;
      const cur = stations.slice();
      let best = -1;
      const place = (i: number, left: number) => {
        if (i === n - 1) {
          cur[i] += left;
          best = Math.max(best, Math.min(...powers(cur, r)));
          cur[i] -= left;
          return;
        }
        for (let c = 0; c <= left; c++) {
          cur[i] += c;
          place(i + 1, left - c);
          cur[i] -= c;
        }
      };
      place(0, k);
      return best;
    };
    // Greedy check + binary search, for cases too large to enumerate.
    const greedy = (stations: number[], r: number, k: number) => {
      const n = stations.length;
      const base = powers(stations, r);
      const ok = (x: number) => {
        const add = new Array(n).fill(0);
        let used = 0;
        for (let i = 0; i < n; i++) {
          let p = base[i];
          for (let j = Math.max(0, i - r); j <= Math.min(n - 1, i + r); j++) p += add[j];
          if (p < x) {
            used += x - p;
            if (used > k) return false;
            add[Math.min(n - 1, i + r)] += x - p;
          }
        }
        return true;
      };
      let lo = Math.min(...base), hi = lo + k;
      while (lo < hi) {
        const mid = lo + Math.floor((hi - lo + 1) / 2);
        if (ok(mid)) lo = mid; else hi = mid - 1;
      }
      return lo;
    };
    const ref = (stations: number[], r: number, k: number) =>
      stations.length <= 5 && k <= 6 ? brute(stations, r, k) : greedy(stations, r, k);
    return {
      slug: "maximize-the-minimum-powered-city",
      title: "Maximize the Minimum Powered City",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Greedy", "Prefix Sum", "Google", "Amazon"],
      signature: {
        funcName: "maxPower",
        params: [
          { name: "stations", type: "int[]" as const },
          { name: "r", type: "int" as const },
          { name: "k", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "`n` cities stand in a row; `stations[i]` is the number of power stations in city `i`. A station in city `j` supplies every city `i` with `|i - j| <= r`. The **power** of a city is the number of stations that supply it.\n\nThe grid operator may build `k` more stations, each in any city (several may go in the same city). Return the largest possible value of the **minimum** power over all cities after building them optimally.\n\n*CodeKairo bounds:* the original allows `stations[i]` up to `10^5`, which needs a 64-bit answer. Here `stations[i] <= 10^4`, so every city's power plus `k` stays within a 32-bit integer.",
        [
          { in: "stations = [1,2,4,5,0], r = 1, k = 2", out: "5", note: "Powers start as 3, 7, 11, 9, 5; two stations in city 1 lift them to 5, 9, 13, 9, 5." },
          { in: "stations = [4,4,4,4], r = 0, k = 3", out: "4", note: "Each city only powers itself, and three stations cannot raise all four." },
          { in: "stations = [0,0,0], r = 2, k = 7", out: "7" },
        ],
        ["n == stations.length", "1 <= n <= 10^5", "0 <= stations[i] <= 10^4", "0 <= r <= n - 1", "0 <= k <= 10^9"]),
      hints: [
        "Flip it: can every city reach power at least `x` with at most `k` new stations? Bigger `x` only gets harder.",
        "Sweep cities left to right. When city `i` is short, any new station must cover it; placing it as far right as possible (city `min(n - 1, i + r)`) also helps the most future cities.",
        "Track the effect of the stations you add with a difference array (or a sliding window) so the sweep stays linear; binary-search the largest feasible `x`.",
      ],
      editorial: explain({
        idea: "Binary search the answer `x`. Feasibility is a greedy sweep: walk the cities in order and, whenever one falls short of `x`, build exactly the missing stations at the rightmost city that still reaches it.",
        steps: [
          "Compute each city's starting power with prefix sums over the window `[i - r, i + r]`.",
          "`feasible(x)`: sweep `i = 0..n-1`, keeping the extra power contributed by stations already added (a running sum plus a difference array that removes a station's effect after city `p + r`).",
          "If city `i` has power `cur < x`, add `x - cur` stations at `p = min(n - 1, i + r)`; fail once the total added exceeds `k`.",
          "Binary-search `x` between the current minimum power and that minimum plus `k`, keeping the largest feasible value.",
        ],
        why: "When the sweep reaches the first short city, cities to its left are already satisfied, so a new station only needs to help this city and the ones after it. Among the positions that reach city `i`, the rightmost one covers a superset of the future cities any other would cover — so it is never worse, and the minimum number of stations is forced. The predicate is monotone in `x`, so the binary search returns the optimum.",
        time: "O(n log k)",
        space: "O(n)",
        pitfalls: [
          "Use 64-bit counters inside the check: the stations requested can exceed `k` by up to `x` before you bail out.",
          "Get the starting powers from prefix sums (or a sliding window); recomputing every window from scratch costs O(n · r) per check.",
          "With `r = n - 1` every station powers every city, so the answer is simply the total plus `k` — a good sanity check.",
        ],
      }),
      examples: [
        { input: "[1,2,4,5,0]\n1\n2", expectedOutput: "5" },
        { input: "[4,4,4,4]\n0\n3", expectedOutput: "4" },
        { input: "[0,0,0]\n2\n7", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 5, 12, 30]));
        const smax = pick(rng, [0, 3, 100, 10000]);
        const stations = Array.from({ length: n }, () => ri(rng, 0, smax));
        const r = pick(rng, [0, ri(rng, 0, Math.min(2, n - 1)), ri(rng, 0, n - 1)]);
        const k = pick(rng, [ri(rng, 0, 6), ri(rng, 0, 6), ri(rng, 0, 1000), ri(rng, 0, 1000000000)]);
        return { input: `${fmtIntArr(stations)}\n${r}\n${k}`, expectedOutput: String(ref(stations, r, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxPower(stations: List[int], r: int, k: int) -> int:
              n = len(stations)
              pre = [0] * (n + 1)
              for i in range(n):
                  pre[i + 1] = pre[i] + stations[i]
              base = [pre[min(n - 1, i + r) + 1] - pre[max(0, i - r)] for i in range(n)]

              def feasible(x):
                  expire = [0] * (n + 1)
                  running = 0
                  used = 0
                  for i in range(n):
                      running -= expire[i]
                      cur = base[i] + running
                      if cur < x:
                          need = x - cur
                          used += need
                          if used > k:
                              return False
                          running += need
                          stop = min(n - 1, i + r) + r + 1
                          if stop < n:
                              expire[stop] += need
                  return True

              lo = min(base)
              hi = lo + k
              while lo < hi:
                  mid = (lo + hi + 1) // 2
                  if feasible(mid):
                      lo = mid
                  else:
                      hi = mid - 1
              return lo
        `,
        javascript: code`
          var maxPower = function(stations, r, k) {
              var n = stations.length;
              var pre = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + stations[i]);
              var base = [];
              var low = Infinity;
              for (var c = 0; c < n; c++) {
                  var p = pre[Math.min(n - 1, c + r) + 1] - pre[Math.max(0, c - r)];
                  base.push(p);
                  if (p < low) low = p;
              }
              var feasible = function(x) {
                  var expire = new Array(n + 1).fill(0);
                  var running = 0, used = 0;
                  for (var i = 0; i < n; i++) {
                      running -= expire[i];
                      var cur = base[i] + running;
                      if (cur < x) {
                          var need = x - cur;
                          used += need;
                          if (used > k) return false;
                          running += need;
                          var stop = Math.min(n - 1, i + r) + r + 1;
                          if (stop < n) expire[stop] += need;
                      }
                  }
                  return true;
              };
              var lo = low, hi = low + k;
              while (lo < hi) {
                  var mid = lo + Math.floor((hi - lo + 1) / 2);
                  if (feasible(mid)) lo = mid; else hi = mid - 1;
              }
              return lo;
          };
        `,
        typescript: code`
          function maxPower(stations: number[], r: number, k: number): number {
              var n = stations.length;
              var pre: number[] = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + stations[i]);
              var base: number[] = [];
              var low = Infinity;
              for (var c = 0; c < n; c++) {
                  var p = pre[Math.min(n - 1, c + r) + 1] - pre[Math.max(0, c - r)];
                  base.push(p);
                  if (p < low) low = p;
              }
              var feasible = function(x: number): boolean {
                  var expire: number[] = [];
                  for (var e = 0; e <= n; e++) expire.push(0);
                  var running = 0, used = 0;
                  for (var j = 0; j < n; j++) {
                      running -= expire[j];
                      var cur = base[j] + running;
                      if (cur < x) {
                          var need = x - cur;
                          used += need;
                          if (used > k) return false;
                          running += need;
                          var stop = Math.min(n - 1, j + r) + r + 1;
                          if (stop < n) expire[stop] += need;
                      }
                  }
                  return true;
              };
              var lo = low, hi = low + k;
              while (lo < hi) {
                  var mid = lo + Math.floor((hi - lo + 1) / 2);
                  if (feasible(mid)) lo = mid; else hi = mid - 1;
              }
              return lo;
          }
        `,
        java: code`
          public static int maxPower(int[] stations, int r, int k) {
              int n = stations.length;
              long[] pre = new long[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stations[i];
              long[] base = new long[n];
              long low = Long.MAX_VALUE;
              for (int i = 0; i < n; i++) {
                  base[i] = pre[Math.min(n - 1, i + r) + 1] - pre[Math.max(0, i - r)];
                  low = Math.min(low, base[i]);
              }
              long lo = low, hi = low + k;
              while (lo < hi) {
                  long mid = lo + (hi - lo + 1) / 2;
                  if (canReach(base, r, k, mid)) lo = mid; else hi = mid - 1;
              }
              return (int) lo;
          }

          static boolean canReach(long[] base, int r, long k, long x) {
              int n = base.length;
              long[] expire = new long[n + 1];
              long running = 0, used = 0;
              for (int i = 0; i < n; i++) {
                  running -= expire[i];
                  long cur = base[i] + running;
                  if (cur < x) {
                      long need = x - cur;
                      used += need;
                      if (used > k) return false;
                      running += need;
                      long stop = (long) Math.min(n - 1, i + r) + r + 1;
                      if (stop < n) expire[(int) stop] += need;
                  }
              }
              return true;
          }
        `,
        cpp: code`
          bool canReachPower(const vector<long long>& base, int r, long long k, long long x) {
              int n = base.size();
              vector<long long> expire(n + 1, 0);
              long long running = 0, used = 0;
              for (int i = 0; i < n; i++) {
                  running -= expire[i];
                  long long cur = base[i] + running;
                  if (cur < x) {
                      long long need = x - cur;
                      used += need;
                      if (used > k) return false;
                      running += need;
                      long long stop = (long long)min(n - 1, i + r) + r + 1;
                      if (stop < n) expire[stop] += need;
                  }
              }
              return true;
          }

          int maxPower(vector<int>& stations, int r, int k) {
              int n = stations.size();
              vector<long long> pre(n + 1, 0);
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stations[i];
              vector<long long> base(n);
              long long low = LLONG_MAX;
              for (int i = 0; i < n; i++) {
                  base[i] = pre[min(n - 1, i + r) + 1] - pre[max(0, i - r)];
                  low = min(low, base[i]);
              }
              long long lo = low, hi = low + k;
              while (lo < hi) {
                  long long mid = lo + (hi - lo + 1) / 2;
                  if (canReachPower(base, r, k, mid)) lo = mid; else hi = mid - 1;
              }
              return (int)lo;
          }
        `,
        c: code`
          static int canReachPower(long long* base, int n, int r, long long k, long long x, long long* expire) {
              for (int i = 0; i <= n; i++) expire[i] = 0;
              long long running = 0, used = 0;
              for (int i = 0; i < n; i++) {
                  running -= expire[i];
                  long long cur = base[i] + running;
                  if (cur < x) {
                      long long need = x - cur;
                      used += need;
                      if (used > k) return 0;
                      running += need;
                      int p = i + r < n - 1 ? i + r : n - 1;
                      long long stop = (long long)p + r + 1;
                      if (stop < n) expire[stop] += need;
                  }
              }
              return 1;
          }

          int maxPower(int* stations, int stationsSize, int r, int k) {
              int n = stationsSize;
              long long* pre = (long long*)malloc(sizeof(long long) * (n + 1));
              long long* base = (long long*)malloc(sizeof(long long) * n);
              long long* expire = (long long*)malloc(sizeof(long long) * (n + 1));
              pre[0] = 0;
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stations[i];
              long long low = -1;
              for (int i = 0; i < n; i++) {
                  int a = i - r > 0 ? i - r : 0;
                  int b = i + r < n - 1 ? i + r : n - 1;
                  base[i] = pre[b + 1] - pre[a];
                  if (low < 0 || base[i] < low) low = base[i];
              }
              long long lo = low, hi = low + k;
              while (lo < hi) {
                  long long mid = lo + (hi - lo + 1) / 2;
                  if (canReachPower(base, n, r, k, mid, expire)) lo = mid; else hi = mid - 1;
              }
              free(pre);
              free(base);
              free(expire);
              return (int)lo;
          }
        `,
        csharp: code`
          public static int MaxPower(int[] stations, int r, int k)
          {
              int n = stations.Length;
              long[] pre = new long[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stations[i];
              long[] baseP = new long[n];
              long low = long.MaxValue;
              for (int i = 0; i < n; i++)
              {
                  baseP[i] = pre[Math.Min(n - 1, i + r) + 1] - pre[Math.Max(0, i - r)];
                  low = Math.Min(low, baseP[i]);
              }
              long lo = low, hi = low + k;
              while (lo < hi)
              {
                  long mid = lo + (hi - lo + 1) / 2;
                  if (CanReachPower(baseP, r, k, mid)) lo = mid; else hi = mid - 1;
              }
              return (int)lo;
          }

          static bool CanReachPower(long[] baseP, int r, long k, long x)
          {
              int n = baseP.Length;
              long[] expire = new long[n + 1];
              long running = 0, used = 0;
              for (int i = 0; i < n; i++)
              {
                  running -= expire[i];
                  long cur = baseP[i] + running;
                  if (cur < x)
                  {
                      long need = x - cur;
                      used += need;
                      if (used > k) return false;
                      running += need;
                      long stop = (long)Math.Min(n - 1, i + r) + r + 1;
                      if (stop < n) expire[stop] += need;
                  }
              }
              return true;
          }
        `,
        go: code`
          func maxPower(stations []int, r int, k int) int {
              n := len(stations)
              pre := make([]int, n+1)
              for i := 0; i < n; i++ {
                  pre[i+1] = pre[i] + stations[i]
              }
              base := make([]int, n)
              low := -1
              for i := 0; i < n; i++ {
                  a, b := i-r, i+r
                  if a < 0 {
                      a = 0
                  }
                  if b > n-1 {
                      b = n - 1
                  }
                  base[i] = pre[b+1] - pre[a]
                  if low < 0 || base[i] < low {
                      low = base[i]
                  }
              }
              feasible := func(x int) bool {
                  expire := make([]int, n+1)
                  running, used := 0, 0
                  for i := 0; i < n; i++ {
                      running -= expire[i]
                      cur := base[i] + running
                      if cur < x {
                          need := x - cur
                          used += need
                          if used > k {
                              return false
                          }
                          running += need
                          p := i + r
                          if p > n-1 {
                              p = n - 1
                          }
                          if stop := p + r + 1; stop < n {
                              expire[stop] += need
                          }
                      }
                  }
                  return true
              }
              lo, hi := low, low+k
              for lo < hi {
                  mid := lo + (hi-lo+1)/2
                  if feasible(mid) {
                      lo = mid
                  } else {
                      hi = mid - 1
                  }
              }
              return lo
          }
        `,
        kotlin: code`
          fun maxPower(stations: IntArray, r: Int, k: Int): Int {
              val n = stations.size
              val pre = LongArray(n + 1)
              for (i in 0 until n) pre[i + 1] = pre[i] + stations[i]
              val base = LongArray(n) { pre[minOf(n - 1, it + r) + 1] - pre[maxOf(0, it - r)] }
              var low = Long.MAX_VALUE
              for (v in base) if (v < low) low = v
              fun feasible(x: Long): Boolean {
                  val expire = LongArray(n + 1)
                  var running = 0L
                  var used = 0L
                  for (i in 0 until n) {
                      running -= expire[i]
                      val cur = base[i] + running
                      if (cur < x) {
                          val need = x - cur
                          used += need
                          if (used > k) return false
                          running += need
                          val stop = minOf(n - 1, i + r).toLong() + r + 1
                          if (stop < n) expire[stop.toInt()] += need
                      }
                  }
                  return true
              }
              var lo = low
              var hi = low + k
              while (lo < hi) {
                  val mid = lo + (hi - lo + 1) / 2
                  if (feasible(mid)) lo = mid else hi = mid - 1
              }
              return lo.toInt()
          }
        `,
        swift: code`
          func maxPower(_ stations: [Int], _ r: Int, _ k: Int) -> Int {
              let n = stations.count
              var pre = Array(repeating: 0, count: n + 1)
              for i in 0..<n { pre[i + 1] = pre[i] + stations[i] }
              var base = Array(repeating: 0, count: n)
              var low = Int.max
              for i in 0..<n {
                  base[i] = pre[min(n - 1, i + r) + 1] - pre[max(0, i - r)]
                  low = min(low, base[i])
              }
              func feasible(_ x: Int) -> Bool {
                  var expire = Array(repeating: 0, count: n + 1)
                  var running = 0
                  var used = 0
                  for i in 0..<n {
                      running -= expire[i]
                      let cur = base[i] + running
                      if cur < x {
                          let need = x - cur
                          used += need
                          if used > k { return false }
                          running += need
                          let stop = min(n - 1, i + r) + r + 1
                          if stop < n { expire[stop] += need }
                      }
                  }
                  return true
              }
              var lo = low
              var hi = low + k
              while lo < hi {
                  let mid = lo + (hi - lo + 1) / 2
                  if feasible(mid) { lo = mid } else { hi = mid - 1 }
              }
              return lo
          }
        `,
        rust: code`
          fn maxPower(stations: Vec<i32>, r: i32, k: i32) -> i32 {
              let n = stations.len();
              let r = r as usize;
              let k = k as i64;
              let mut pre = vec![0i64; n + 1];
              for i in 0..n {
                  pre[i + 1] = pre[i] + stations[i] as i64;
              }
              let mut base = vec![0i64; n];
              let mut low = std::i64::MAX;
              for i in 0..n {
                  let a = if i >= r { i - r } else { 0 };
                  let b = if i + r < n { i + r } else { n - 1 };
                  base[i] = pre[b + 1] - pre[a];
                  if base[i] < low { low = base[i]; }
              }
              let feasible = |x: i64| -> bool {
                  let mut expire = vec![0i64; n + 1];
                  let mut running = 0i64;
                  let mut used = 0i64;
                  for i in 0..n {
                      running -= expire[i];
                      let cur = base[i] + running;
                      if cur < x {
                          let need = x - cur;
                          used += need;
                          if used > k { return false; }
                          running += need;
                          let p = if i + r < n { i + r } else { n - 1 };
                          let stop = p + r + 1;
                          if stop < n { expire[stop] += need; }
                      }
                  }
                  true
              };
              let mut lo = low;
              let mut hi = low + k;
              while lo < hi {
                  let mid = lo + (hi - lo + 1) / 2;
                  if feasible(mid) { lo = mid; } else { hi = mid - 1; }
              }
              lo as i32
          }
        `,
        php: code`
          function maxPower($stations, $r, $k) {
              $n = count($stations);
              $pre = array_fill(0, $n + 1, 0);
              for ($i = 0; $i < $n; $i++) $pre[$i + 1] = $pre[$i] + $stations[$i];
              $base = [];
              $low = PHP_INT_MAX;
              for ($i = 0; $i < $n; $i++) {
                  $base[] = $pre[min($n - 1, $i + $r) + 1] - $pre[max(0, $i - $r)];
                  if ($base[$i] < $low) $low = $base[$i];
              }
              $lo = $low;
              $hi = $low + $k;
              while ($lo < $hi) {
                  $mid = $lo + intdiv($hi - $lo + 1, 2);
                  $expire = array_fill(0, $n + 1, 0);
                  $running = 0;
                  $used = 0;
                  $ok = true;
                  for ($i = 0; $i < $n; $i++) {
                      $running -= $expire[$i];
                      $cur = $base[$i] + $running;
                      if ($cur < $mid) {
                          $need = $mid - $cur;
                          $used += $need;
                          if ($used > $k) { $ok = false; break; }
                          $running += $need;
                          $stop = min($n - 1, $i + $r) + $r + 1;
                          if ($stop < $n) $expire[$stop] += $need;
                      }
                  }
                  if ($ok) $lo = $mid; else $hi = $mid - 1;
              }
              return $lo;
          }
        `,
        ruby: code`
          def maxPower(stations, r, k)
            n = stations.length
            pre = [0] * (n + 1)
            n.times { |i| pre[i + 1] = pre[i] + stations[i] }
            base = (0...n).map { |i| pre[[n - 1, i + r].min + 1] - pre[[0, i - r].max] }
            feasible = lambda do |x|
              expire = [0] * (n + 1)
              running = 0
              used = 0
              n.times do |i|
                running -= expire[i]
                cur = base[i] + running
                if cur < x
                  need = x - cur
                  used += need
                  return false if used > k
                  running += need
                  stop = [n - 1, i + r].min + r + 1
                  expire[stop] += need if stop < n
                end
              end
              true
            end
            lo = base.min
            hi = lo + k
            while lo < hi
              mid = lo + (hi - lo + 1) / 2
              if feasible.call(mid)
                lo = mid
              else
                hi = mid - 1
              end
            end
            lo
          end
        `,
      },
    };
  })(),

  // ── Minimum Cost to Make Array Equal (LC 2448) ──────────────────
  (() => {
    const total = (nums: number[], cost: number[], x: number) => {
      let s = 0;
      for (let i = 0; i < nums.length; i++) s += Math.abs(nums[i] - x) * cost[i];
      return s;
    };
    // The cost is convex and piecewise linear with breakpoints at the values,
    // so its minimum is attained at one of them.
    const ref = (nums: number[], cost: number[]) => Math.min(...nums.map((x) => total(nums, cost, x)));
    return {
      slug: "minimum-cost-to-make-array-equal",
      title: "Minimum Cost to Make Array Equal",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Greedy", "Sorting", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "minCost",
        params: [{ name: "nums", type: "int[]" as const }, { name: "cost", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two arrays of length `n`: `nums` and `cost`. One operation increases or decreases a single element `nums[i]` by 1 and costs `cost[i]`.\n\nReturn the minimum total cost to make every element of `nums` equal.\n\n*CodeKairo bounds:* the original allows values and costs up to `10^6` with `n` up to `10^5`, which needs a 64-bit answer. Here `n <= 10^4`, `nums[i] <= 10^4` and `cost[i] <= 10`, so the answer fits in a 32-bit integer.",
        [
          { in: "nums = [1,3,5,2], cost = [2,3,1,14]", out: "8", note: "Make every element 2: 1·2 + 1·3 + 3·1 + 0·14 = 8." },
          { in: "nums = [2,2,2,2,2], cost = [4,2,8,1,3]", out: "0" },
          { in: "nums = [10,1], cost = [1,5]", out: "9", note: "Moving the cheap element all the way costs 9; any other meeting point costs more." },
        ],
        ["n == nums.length == cost.length", "1 <= n <= 10^4", "1 <= nums[i] <= 10^4", "1 <= cost[i] <= 10"]),
      hints: [
        "Write the cost of making everything equal to `x` as a function `f(x) = Σ |nums[i] - x| · cost[i]`.",
        "Each term is a V shape, so `f` is convex: it decreases, then (maybe after a flat stretch) increases.",
        "Binary-search `x` between `min(nums)` and `max(nums)` by comparing `f(mid)` with `f(mid + 1)`.",
      ],
      editorial: explain({
        idea: "The total cost as a function of the common target `x` is a sum of weighted absolute values, which is convex. The minimum of a convex function over integers can be binary-searched by looking at the sign of its slope `f(mid + 1) - f(mid)`.",
        steps: [
          "Let `lo = min(nums)`, `hi = max(nums)` — moving outside that range only adds cost.",
          "While `lo < hi`: take `mid = lo + (hi - lo) / 2`; if `f(mid) <= f(mid + 1)` the minimum is at `mid` or to its left (`hi = mid`), otherwise it is to the right (`lo = mid + 1`).",
          "Return `f(lo)`, computing `f` with 64-bit accumulation.",
        ],
        why: "Each `|nums[i] - x| · cost[i]` is convex in `x`, and sums of convex functions are convex, so the slope `f(x + 1) - f(x)` is non-decreasing. Where it is still negative the minimum lies further right; once it is zero or positive, nothing to the right can be lower than `f(mid)`. That is exactly the invariant the search keeps. (Equivalently, the optimum is the cost-weighted median of `nums`.)",
        time: "O(n log V) with V the value range",
        space: "O(1)",
        pitfalls: [
          "Evaluate `f` in 64-bit — at a bad `x` the sum can exceed what the answer needs.",
          "Compare `f(mid)` with `f(mid + 1)`, not with `f(mid - 1)`, to keep `mid + 1` inside the range.",
          "A target outside `[min, max]` is never better, so the search range is safe.",
        ],
      }),
      examples: [
        { input: "[1,3,5,2]\n[2,3,1,14]", expectedOutput: "8" },
        { input: "[2,2,2,2,2]\n[4,2,8,1,3]", expectedOutput: "0" },
        { input: "[10,1]\n[1,5]", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 20]));
        const vmax = pick(rng, [5, 100, 10000]);
        const cmax = pick(rng, [1, 3, 10]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, vmax));
        const cost = Array.from({ length: n }, () => ri(rng, 1, cmax));
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(cost)}`, expectedOutput: String(ref(nums, cost)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minCost(nums: List[int], cost: List[int]) -> int:
              def f(x):
                  return sum(abs(a - x) * c for a, c in zip(nums, cost))
              lo, hi = min(nums), max(nums)
              while lo < hi:
                  mid = (lo + hi) // 2
                  if f(mid) <= f(mid + 1):
                      hi = mid
                  else:
                      lo = mid + 1
              return f(lo)
        `,
        javascript: code`
          var minCost = function(nums, cost) {
              var f = function(x) {
                  var s = 0;
                  for (var i = 0; i < nums.length; i++) s += Math.abs(nums[i] - x) * cost[i];
                  return s;
              };
              var lo = Infinity, hi = -Infinity;
              for (var j = 0; j < nums.length; j++) {
                  if (nums[j] < lo) lo = nums[j];
                  if (nums[j] > hi) hi = nums[j];
              }
              while (lo < hi) {
                  var mid = lo + ((hi - lo) >> 1);
                  if (f(mid) <= f(mid + 1)) hi = mid; else lo = mid + 1;
              }
              return f(lo);
          };
        `,
        typescript: code`
          function minCost(nums: number[], cost: number[]): number {
              var f = function(x: number): number {
                  var s = 0;
                  for (var i = 0; i < nums.length; i++) s += Math.abs(nums[i] - x) * cost[i];
                  return s;
              };
              var lo = nums[0], hi = nums[0];
              for (var j = 1; j < nums.length; j++) {
                  if (nums[j] < lo) lo = nums[j];
                  if (nums[j] > hi) hi = nums[j];
              }
              while (lo < hi) {
                  var mid = lo + ((hi - lo) >> 1);
                  if (f(mid) <= f(mid + 1)) hi = mid; else lo = mid + 1;
              }
              return f(lo);
          }
        `,
        java: code`
          public static int minCost(int[] nums, int[] cost) {
              int lo = Integer.MAX_VALUE, hi = Integer.MIN_VALUE;
              for (int v : nums) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (costAt(nums, cost, mid) <= costAt(nums, cost, mid + 1)) hi = mid; else lo = mid + 1;
              }
              return (int) costAt(nums, cost, lo);
          }

          static long costAt(int[] nums, int[] cost, int x) {
              long s = 0;
              for (int i = 0; i < nums.length; i++) s += (long) Math.abs(nums[i] - x) * cost[i];
              return s;
          }
        `,
        cpp: code`
          long long costAt(const vector<int>& nums, const vector<int>& cost, int x) {
              long long s = 0;
              for (size_t i = 0; i < nums.size(); i++) s += (long long)abs(nums[i] - x) * cost[i];
              return s;
          }

          int minCost(vector<int>& nums, vector<int>& cost) {
              int lo = *min_element(nums.begin(), nums.end());
              int hi = *max_element(nums.begin(), nums.end());
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (costAt(nums, cost, mid) <= costAt(nums, cost, mid + 1)) hi = mid; else lo = mid + 1;
              }
              return (int)costAt(nums, cost, lo);
          }
        `,
        c: code`
          static long long costAt(int* nums, int* cost, int n, int x) {
              long long s = 0;
              for (int i = 0; i < n; i++) {
                  long long d = nums[i] - x;
                  if (d < 0) d = -d;
                  s += d * cost[i];
              }
              return s;
          }

          int minCost(int* nums, int numsSize, int* cost, int costSize) {
              int lo = nums[0], hi = nums[0];
              for (int i = 1; i < numsSize; i++) {
                  if (nums[i] < lo) lo = nums[i];
                  if (nums[i] > hi) hi = nums[i];
              }
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (costAt(nums, cost, numsSize, mid) <= costAt(nums, cost, numsSize, mid + 1)) hi = mid; else lo = mid + 1;
              }
              return (int)costAt(nums, cost, numsSize, lo);
          }
        `,
        csharp: code`
          public static int MinCost(int[] nums, int[] cost)
          {
              int lo = nums.Min(), hi = nums.Max();
              while (lo < hi)
              {
                  int mid = lo + (hi - lo) / 2;
                  if (CostAt(nums, cost, mid) <= CostAt(nums, cost, mid + 1)) hi = mid; else lo = mid + 1;
              }
              return (int)CostAt(nums, cost, lo);
          }

          static long CostAt(int[] nums, int[] cost, int x)
          {
              long s = 0;
              for (int i = 0; i < nums.Length; i++) s += (long)Math.Abs(nums[i] - x) * cost[i];
              return s;
          }
        `,
        go: code`
          func minCost(nums []int, cost []int) int {
              f := func(x int) int {
                  s := 0
                  for i, v := range nums {
                      d := v - x
                      if d < 0 {
                          d = -d
                      }
                      s += d * cost[i]
                  }
                  return s
              }
              lo, hi := nums[0], nums[0]
              for _, v := range nums {
                  if v < lo {
                      lo = v
                  }
                  if v > hi {
                      hi = v
                  }
              }
              for lo < hi {
                  mid := lo + (hi-lo)/2
                  if f(mid) <= f(mid+1) {
                      hi = mid
                  } else {
                      lo = mid + 1
                  }
              }
              return f(lo)
          }
        `,
        kotlin: code`
          fun minCost(nums: IntArray, cost: IntArray): Int {
              fun f(x: Int): Long {
                  var s = 0L
                  for (i in nums.indices) s += Math.abs(nums[i] - x).toLong() * cost[i]
                  return s
              }
              var lo = nums[0]
              var hi = nums[0]
              for (v in nums) {
                  if (v < lo) lo = v
                  if (v > hi) hi = v
              }
              while (lo < hi) {
                  val mid = lo + (hi - lo) / 2
                  if (f(mid) <= f(mid + 1)) hi = mid else lo = mid + 1
              }
              return f(lo).toInt()
          }
        `,
        swift: code`
          func minCost(_ nums: [Int], _ cost: [Int]) -> Int {
              func f(_ x: Int) -> Int {
                  var s = 0
                  for i in 0..<nums.count { s += abs(nums[i] - x) * cost[i] }
                  return s
              }
              var lo = nums.min()!
              var hi = nums.max()!
              while lo < hi {
                  let mid = lo + (hi - lo) / 2
                  if f(mid) <= f(mid + 1) { hi = mid } else { lo = mid + 1 }
              }
              return f(lo)
          }
        `,
        rust: code`
          fn minCost(nums: Vec<i32>, cost: Vec<i32>) -> i32 {
              let f = |x: i32| -> i64 {
                  let mut s: i64 = 0;
                  for i in 0..nums.len() {
                      s += ((nums[i] - x).abs() as i64) * (cost[i] as i64);
                  }
                  s
              };
              let mut lo = *nums.iter().min().unwrap();
              let mut hi = *nums.iter().max().unwrap();
              while lo < hi {
                  let mid = lo + (hi - lo) / 2;
                  if f(mid) <= f(mid + 1) { hi = mid; } else { lo = mid + 1; }
              }
              f(lo) as i32
          }
        `,
        php: code`
          function costAtTarget($nums, $cost, $x) {
              $s = 0;
              foreach ($nums as $i => $v) $s += abs($v - $x) * $cost[$i];
              return $s;
          }

          function minCost($nums, $cost) {
              $lo = min($nums);
              $hi = max($nums);
              while ($lo < $hi) {
                  $mid = $lo + intdiv($hi - $lo, 2);
                  if (costAtTarget($nums, $cost, $mid) <= costAtTarget($nums, $cost, $mid + 1)) $hi = $mid; else $lo = $mid + 1;
              }
              return costAtTarget($nums, $cost, $lo);
          }
        `,
        ruby: code`
          def minCost(nums, cost)
            f = lambda do |x|
              s = 0
              nums.each_with_index { |v, i| s += (v - x).abs * cost[i] }
              s
            end
            lo = nums.min
            hi = nums.max
            while lo < hi
              mid = lo + (hi - lo) / 2
              if f.call(mid) <= f.call(mid + 1)
                hi = mid
              else
                lo = mid + 1
              end
            end
            f.call(lo)
          end
        `,
      },
    };
  })(),

  // ── Minimum Operations to Make All Array Elements Equal (LC 2602) ──
  (() => {
    const ref = (nums: number[], queries: number[]) =>
      queries.map((q) => nums.reduce((s, v) => s + Math.abs(v - q), 0));
    return {
      slug: "minimum-operations-to-make-all-array-elements-equal",
      title: "Minimum Operations to Make All Array Elements Equal",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Sorting", "Prefix Sum", "Amazon", "Google"],
      signature: {
        funcName: "minOperations",
        params: [{ name: "nums", type: "int[]" as const }, { name: "queries", type: "int[]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "You are given an array `nums` and an array `queries`. One operation adds 1 to or subtracts 1 from a single element of `nums`.\n\nFor each `queries[i]`, find the minimum number of operations that makes **every** element of `nums` equal to `queries[i]`. Each query starts again from the original `nums`.\n\nReturn the answers in query order.\n\n*CodeKairo bounds:* the original allows values up to `10^9`, which needs 64-bit answers. Here values are at most `10^4`, so each answer fits in a 32-bit integer.",
        [
          { in: "nums = [4,1,7], queries = [4,1,10]", out: "[6,9,18]", note: "For 4: 0 + 3 + 3. For 1: 3 + 0 + 6. For 10: 6 + 9 + 3." },
          { in: "nums = [2,9,6,3], queries = [10]", out: "[20]" },
        ],
        ["n == nums.length", "m == queries.length", "1 <= n, m <= 10^5", "1 <= nums[i], queries[i] <= 10^4"]),
      hints: [
        "The answer for target `q` is `Σ |nums[i] - q|` — the order of `nums` does not matter, so sort it.",
        "In sorted order the elements below `q` form a prefix and the rest a suffix; their contributions are `q · count - sum` and `sum - q · count`.",
        "Binary-search the split point and read both sums from a prefix-sum array.",
      ],
      editorial: explain({
        idea: "Sort once and build prefix sums; then every query is one binary search plus O(1) arithmetic, because the elements below the target and those at or above it each contribute a closed-form total.",
        steps: [
          "Sort `nums` and build `pre[i]` = sum of the first `i` sorted values.",
          "For a query `q`, let `j` be the number of elements smaller than `q` (lower bound of `q`).",
          "Raising the small ones costs `q · j - pre[j]`; lowering the rest costs `(pre[n] - pre[j]) - q · (n - j)`.",
          "The answer is the sum of the two parts.",
        ],
        why: "`|v - q|` equals `q - v` for `v < q` and `v - q` otherwise, so summing over the two groups separately removes the absolute value. Sorting makes the first group a prefix, whose size is the lower bound of `q` and whose sum is a prefix sum.",
        time: "O((n + m) log n)",
        space: "O(n)",
        pitfalls: [
          "Each query is independent — do not carry changes from one query to the next.",
          "Elements equal to `q` cost nothing on either side; the split can put them in either group.",
          "With the original 10^9 bounds the sums need 64-bit integers; keep the habit of 64-bit prefix sums.",
        ],
      }),
      examples: [
        { input: "[4,1,7]\n[4,1,10]", expectedOutput: "[6,9,18]" },
        { input: "[2,9,6,3]\n[10]", expectedOutput: "[20]" },
      ],
      gen: (rng: Rng) => {
        const vmax = pick(rng, [5, 100, 10000]);
        const nums = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 30])) }, () => ri(rng, 1, vmax));
        const queries = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 20])) }, () => ri(rng, 1, vmax));
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(queries)}`, expectedOutput: fmtIntArr(ref(nums, queries)) };
      },
      solutions: {
        python: code`
          from typing import List
          import bisect

          def minOperations(nums: List[int], queries: List[int]) -> List[int]:
              s = sorted(nums)
              n = len(s)
              pre = [0] * (n + 1)
              for i, v in enumerate(s):
                  pre[i + 1] = pre[i] + v
              res = []
              for q in queries:
                  j = bisect.bisect_left(s, q)
                  res.append(q * j - pre[j] + (pre[n] - pre[j]) - q * (n - j))
              return res
        `,
        javascript: code`
          var minOperations = function(nums, queries) {
              var s = nums.slice().sort(function(a, b) { return a - b; });
              var n = s.length;
              var pre = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + s[i]);
              var res = [];
              for (var t = 0; t < queries.length; t++) {
                  var q = queries[t];
                  var lo = 0, hi = n;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (s[mid] < q) lo = mid + 1; else hi = mid;
                  }
                  res.push(q * lo - pre[lo] + (pre[n] - pre[lo]) - q * (n - lo));
              }
              return res;
          };
        `,
        typescript: code`
          function minOperations(nums: number[], queries: number[]): number[] {
              var s: number[] = nums.slice();
              s.sort(function(a, b) { return a - b; });
              var n = s.length;
              var pre: number[] = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + s[i]);
              var res: number[] = [];
              for (var t = 0; t < queries.length; t++) {
                  var q = queries[t];
                  var lo = 0, hi = n;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (s[mid] < q) lo = mid + 1; else hi = mid;
                  }
                  res.push(q * lo - pre[lo] + (pre[n] - pre[lo]) - q * (n - lo));
              }
              return res;
          }
        `,
        java: code`
          public static int[] minOperations(int[] nums, int[] queries) {
              int[] s = nums.clone();
              Arrays.sort(s);
              int n = s.length;
              long[] pre = new long[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + s[i];
              int[] res = new int[queries.length];
              for (int t = 0; t < queries.length; t++) {
                  long q = queries[t];
                  int lo = 0, hi = n;
                  while (lo < hi) {
                      int mid = (lo + hi) >>> 1;
                      if (s[mid] < q) lo = mid + 1; else hi = mid;
                  }
                  res[t] = (int) (q * lo - pre[lo] + (pre[n] - pre[lo]) - q * (n - lo));
              }
              return res;
          }
        `,
        cpp: code`
          vector<int> minOperations(vector<int>& nums, vector<int>& queries) {
              vector<int> s(nums);
              sort(s.begin(), s.end());
              int n = s.size();
              vector<long long> pre(n + 1, 0);
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + s[i];
              vector<int> res;
              for (int qv : queries) {
                  long long q = qv;
                  int j = lower_bound(s.begin(), s.end(), qv) - s.begin();
                  res.push_back((int)(q * j - pre[j] + (pre[n] - pre[j]) - q * (n - j)));
              }
              return res;
          }
        `,
        c: code`
          static int opsCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          int* minOperations(int* nums, int numsSize, int* queries, int queriesSize, int* returnSize) {
              int n = numsSize;
              int* s = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) s[i] = nums[i];
              qsort(s, n, sizeof(int), opsCmp);
              long long* pre = (long long*)malloc(sizeof(long long) * (n + 1));
              pre[0] = 0;
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + s[i];
              int* res = (int*)malloc(sizeof(int) * (queriesSize > 0 ? queriesSize : 1));
              for (int t = 0; t < queriesSize; t++) {
                  long long q = queries[t];
                  int lo = 0, hi = n;
                  while (lo < hi) {
                      int mid = lo + (hi - lo) / 2;
                      if (s[mid] < q) lo = mid + 1; else hi = mid;
                  }
                  res[t] = (int)(q * lo - pre[lo] + (pre[n] - pre[lo]) - q * (n - lo));
              }
              free(s);
              free(pre);
              *returnSize = queriesSize;
              return res;
          }
        `,
        csharp: code`
          public static int[] MinOperations(int[] nums, int[] queries)
          {
              int[] s = (int[])nums.Clone();
              Array.Sort(s);
              int n = s.Length;
              long[] pre = new long[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + s[i];
              int[] res = new int[queries.Length];
              for (int t = 0; t < queries.Length; t++)
              {
                  long q = queries[t];
                  int lo = 0, hi = n;
                  while (lo < hi)
                  {
                      int mid = lo + (hi - lo) / 2;
                      if (s[mid] < q) lo = mid + 1; else hi = mid;
                  }
                  res[t] = (int)(q * lo - pre[lo] + (pre[n] - pre[lo]) - q * (n - lo));
              }
              return res;
          }
        `,
        go: code`
          func minOperations(nums []int, queries []int) []int {
              s := make([]int, len(nums))
              copy(s, nums)
              sort.Ints(s)
              n := len(s)
              pre := make([]int, n+1)
              for i := 0; i < n; i++ {
                  pre[i+1] = pre[i] + s[i]
              }
              res := make([]int, len(queries))
              for t, q := range queries {
                  j := sort.SearchInts(s, q)
                  res[t] = q*j - pre[j] + (pre[n] - pre[j]) - q*(n-j)
              }
              return res
          }
        `,
        kotlin: code`
          fun minOperations(nums: IntArray, queries: IntArray): IntArray {
              val s = nums.sortedArray()
              val n = s.size
              val pre = LongArray(n + 1)
              for (i in 0 until n) pre[i + 1] = pre[i] + s[i]
              val res = IntArray(queries.size)
              for (t in queries.indices) {
                  val q = queries[t].toLong()
                  var lo = 0
                  var hi = n
                  while (lo < hi) {
                      val mid = (lo + hi) / 2
                      if (s[mid] < q) lo = mid + 1 else hi = mid
                  }
                  res[t] = (q * lo - pre[lo] + (pre[n] - pre[lo]) - q * (n - lo)).toInt()
              }
              return res
          }
        `,
        swift: code`
          func minOperations(_ nums: [Int], _ queries: [Int]) -> [Int] {
              let s = nums.sorted()
              let n = s.count
              var pre = Array(repeating: 0, count: n + 1)
              for i in 0..<n { pre[i + 1] = pre[i] + s[i] }
              var res = [Int]()
              for q in queries {
                  var lo = 0
                  var hi = n
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if s[mid] < q { lo = mid + 1 } else { hi = mid }
                  }
                  res.append(q * lo - pre[lo] + (pre[n] - pre[lo]) - q * (n - lo))
              }
              return res
          }
        `,
        rust: code`
          fn minOperations(nums: Vec<i32>, queries: Vec<i32>) -> Vec<i32> {
              let mut s = nums.clone();
              s.sort();
              let n = s.len();
              let mut pre = vec![0i64; n + 1];
              for i in 0..n {
                  pre[i + 1] = pre[i] + s[i] as i64;
              }
              let mut res = Vec::with_capacity(queries.len());
              for &qv in queries.iter() {
                  let mut lo = 0usize;
                  let mut hi = n;
                  while lo < hi {
                      let mid = (lo + hi) / 2;
                      if s[mid] < qv { lo = mid + 1; } else { hi = mid; }
                  }
                  let q = qv as i64;
                  let j = lo as i64;
                  let total = q * j - pre[lo] + (pre[n] - pre[lo]) - q * (n as i64 - j);
                  res.push(total as i32);
              }
              res
          }
        `,
        php: code`
          function minOperations($nums, $queries) {
              $s = $nums;
              sort($s);
              $n = count($s);
              $pre = [0];
              for ($i = 0; $i < $n; $i++) $pre[] = $pre[$i] + $s[$i];
              $res = [];
              foreach ($queries as $q) {
                  $lo = 0;
                  $hi = $n;
                  while ($lo < $hi) {
                      $mid = intdiv($lo + $hi, 2);
                      if ($s[$mid] < $q) $lo = $mid + 1; else $hi = $mid;
                  }
                  $res[] = $q * $lo - $pre[$lo] + ($pre[$n] - $pre[$lo]) - $q * ($n - $lo);
              }
              return $res;
          }
        `,
        ruby: code`
          def minOperations(nums, queries)
            s = nums.sort
            n = s.length
            pre = [0]
            s.each { |v| pre << pre[-1] + v }
            queries.map do |q|
              j = s.bsearch_index { |v| v >= q } || n
              q * j - pre[j] + (pre[n] - pre[j]) - q * (n - j)
            end
          end
        `,
      },
    };
  })(),

  // ── Maximum Number of Alloys (LC 2861) ──────────────────────────
  (() => {
    const spend = (comp: number[], stock: number[], cost: number[], x: number) => {
      let s = 0;
      for (let j = 0; j < comp.length; j++) s += Math.max(0, x * comp[j] - stock[j]) * cost[j];
      return s;
    };
    const ref = (budget: number, composition: number[][], stock: number[], cost: number[]) => {
      const cap = budget + Math.max(...stock);
      let best = 0;
      for (const comp of composition) {
        if (cap <= 3000) {
          // Small case: walk x upwards until it no longer fits.
          let x = 0;
          while (spend(comp, stock, cost, x + 1) <= budget) x++;
          best = Math.max(best, x);
        } else {
          let lo = 0, hi = cap;
          while (lo < hi) {
            const mid = lo + Math.ceil((hi - lo) / 2);
            if (spend(comp, stock, cost, mid) <= budget) lo = mid; else hi = mid - 1;
          }
          best = Math.max(best, lo);
        }
      }
      return best;
    };
    return {
      slug: "maximum-number-of-alloys",
      title: "Maximum Number of Alloys",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Amazon", "Google"],
      signature: {
        funcName: "maxNumberOfAlloys",
        params: [
          { name: "n", type: "int" as const },
          { name: "k", type: "int" as const },
          { name: "budget", type: "int" as const },
          { name: "composition", type: "int[][]" as const },
          { name: "stock", type: "int[]" as const },
          { name: "cost", type: "int[]" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "A foundry works with `n` kinds of metal and owns `k` machines. Machine `i` makes one unit of alloy from `composition[i][j]` units of metal `j`, for every `j`.\n\nThe foundry already holds `stock[j]` units of metal `j` and can buy more at `cost[j]` coins per unit, spending at most `budget` coins in total.\n\nAll alloy must be produced on **one** machine of your choice. Return the maximum number of alloy units the foundry can make.",
        [
          { in: "n = 3, k = 2, budget = 15, composition = [[1,1,1],[1,1,10]], stock = [0,0,100], cost = [1,2,3]", out: "5", note: "On machine 0, five alloys need 5 of metals 0 and 1 (cost 5 + 10) and the stock of metal 2 covers the rest." },
          { in: "n = 2, k = 2, budget = 20, composition = [[1,2],[3,1]], stock = [2,1], cost = [2,3]", out: "3" },
          { in: "n = 1, k = 1, budget = 0, composition = [[4]], stock = [9], cost = [7]", out: "2" },
        ],
        ["1 <= n, k <= 100", "0 <= budget <= 10^8", "composition.length == k", "composition[i].length == n", "1 <= composition[i][j] <= 100", "stock.length == cost.length == n", "0 <= stock[j] <= 10^8", "1 <= cost[j] <= 100"]),
      hints: [
        "Handle each machine on its own and keep the best result.",
        "For one machine, the coins needed to make `x` alloys grow with `x`: `Σ max(0, x · composition[i][j] - stock[j]) · cost[j]`.",
        "Binary-search the largest `x` whose cost fits in the budget; `budget + max(stock)` is a safe upper bound.",
      ],
      editorial: explain({
        idea: "Since only one machine may be used, solve each machine separately. For a fixed machine, the money required is a non-decreasing function of the number of alloys, so the largest affordable count is found by binary search.",
        steps: [
          "For machine `i`, define `need(x) = Σ_j max(0, x · composition[i][j] - stock[j]) · cost[j]`, computed in 64-bit and abandoned early once it passes `budget`.",
          "Binary-search `x` in `[0, budget + max(stock)]` for the largest value with `need(x) <= budget`.",
          "Return the maximum over all machines.",
        ],
        why: "Every term of `need` is non-decreasing in `x`, so the set of affordable `x` is a prefix `0..X` and binary search finds `X` exactly. No machine can make more than `stock[j] + budget` alloys (each alloy needs at least one unit of metal `j`, and each extra unit costs at least one coin), which justifies the upper bound.",
        time: "O(k · n · log(budget + max stock))",
        space: "O(1)",
        pitfalls: [
          "`x · composition[i][j]` can reach 2 · 10^10 — compute in 64-bit.",
          "Do not mix machines: the whole order must come from a single machine.",
          "A budget of 0 can still allow alloys when the stock suffices.",
        ],
      }),
      examples: [
        { input: "3\n2\n15\n[[1,1,1],[1,1,10]]\n[0,0,100]\n[1,2,3]", expectedOutput: "5" },
        { input: "2\n2\n20\n[[1,2],[3,1]]\n[2,1]\n[2,3]", expectedOutput: "3" },
        { input: "1\n1\n0\n[[4]]\n[9]\n[7]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 8]));
        const k = ri(rng, 1, pick(rng, [1, 3, 6]));
        const big = rng() < 0.25;
        const budget = big ? ri(rng, 0, 100000000) : ri(rng, 0, pick(rng, [0, 30, 1000, 30000]));
        const smax = big ? pick(rng, [0, 1000, 100000000]) : pick(rng, [0, 10, 1000]);
        const cmax = pick(rng, [1, 5, 100]);
        const composition = Array.from({ length: k }, () => Array.from({ length: n }, () => ri(rng, 1, cmax)));
        const stock = Array.from({ length: n }, () => ri(rng, 0, smax));
        const cost = Array.from({ length: n }, () => ri(rng, 1, pick(rng, [1, 10, 100])));
        return {
          input: `${n}\n${k}\n${budget}\n${fmtIntMat(composition)}\n${fmtIntArr(stock)}\n${fmtIntArr(cost)}`,
          expectedOutput: String(ref(budget, composition, stock, cost)),
        };
      },
      solutions: {
        python: code`
          from typing import List

          def maxNumberOfAlloys(n: int, k: int, budget: int, composition: List[List[int]], stock: List[int], cost: List[int]) -> int:
              def affordable(comp, x):
                  spent = 0
                  for j in range(n):
                      lack = x * comp[j] - stock[j]
                      if lack > 0:
                          spent += lack * cost[j]
                          if spent > budget:
                              return False
                  return True

              best = 0
              top = budget + max(stock)
              for comp in composition:
                  lo, hi = 0, top
                  while lo < hi:
                      mid = (lo + hi + 1) // 2
                      if affordable(comp, mid):
                          lo = mid
                      else:
                          hi = mid - 1
                  best = max(best, lo)
              return best
        `,
        javascript: code`
          var maxNumberOfAlloys = function(n, k, budget, composition, stock, cost) {
              var affordable = function(comp, x) {
                  var spent = 0;
                  for (var j = 0; j < n; j++) {
                      var lack = x * comp[j] - stock[j];
                      if (lack > 0) {
                          spent += lack * cost[j];
                          if (spent > budget) return false;
                      }
                  }
                  return true;
              };
              var top = budget;
              var maxStock = 0;
              for (var j = 0; j < n; j++) if (stock[j] > maxStock) maxStock = stock[j];
              top += maxStock;
              var best = 0;
              for (var i = 0; i < k; i++) {
                  var lo = 0, hi = top;
                  while (lo < hi) {
                      var mid = lo + Math.floor((hi - lo + 1) / 2);
                      if (affordable(composition[i], mid)) lo = mid; else hi = mid - 1;
                  }
                  if (lo > best) best = lo;
              }
              return best;
          };
        `,
        typescript: code`
          function maxNumberOfAlloys(n: number, k: number, budget: number, composition: number[][], stock: number[], cost: number[]): number {
              var affordable = function(comp: number[], x: number): boolean {
                  var spent = 0;
                  for (var j = 0; j < n; j++) {
                      var lack = x * comp[j] - stock[j];
                      if (lack > 0) {
                          spent += lack * cost[j];
                          if (spent > budget) return false;
                      }
                  }
                  return true;
              };
              var maxStock = 0;
              for (var t = 0; t < n; t++) if (stock[t] > maxStock) maxStock = stock[t];
              var top = budget + maxStock;
              var best = 0;
              for (var i = 0; i < k; i++) {
                  var lo = 0, hi = top;
                  while (lo < hi) {
                      var mid = lo + Math.floor((hi - lo + 1) / 2);
                      if (affordable(composition[i], mid)) lo = mid; else hi = mid - 1;
                  }
                  if (lo > best) best = lo;
              }
              return best;
          }
        `,
        java: code`
          public static int maxNumberOfAlloys(int n, int k, int budget, int[][] composition, int[] stock, int[] cost) {
              int maxStock = 0;
              for (int s : stock) maxStock = Math.max(maxStock, s);
              int best = 0;
              for (int i = 0; i < k; i++) {
                  int lo = 0, hi = budget + maxStock;
                  while (lo < hi) {
                      int mid = lo + (hi - lo + 1) / 2;
                      if (alloyAffordable(composition[i], stock, cost, budget, mid)) lo = mid; else hi = mid - 1;
                  }
                  best = Math.max(best, lo);
              }
              return best;
          }

          static boolean alloyAffordable(int[] comp, int[] stock, int[] cost, long budget, long x) {
              long spent = 0;
              for (int j = 0; j < comp.length; j++) {
                  long lack = x * comp[j] - stock[j];
                  if (lack > 0) {
                      spent += lack * cost[j];
                      if (spent > budget) return false;
                  }
              }
              return true;
          }
        `,
        cpp: code`
          bool alloyAffordable(const vector<int>& comp, const vector<int>& stock, const vector<int>& cost, long long budget, long long x) {
              long long spent = 0;
              for (size_t j = 0; j < comp.size(); j++) {
                  long long lack = x * comp[j] - stock[j];
                  if (lack > 0) {
                      spent += lack * cost[j];
                      if (spent > budget) return false;
                  }
              }
              return true;
          }

          int maxNumberOfAlloys(int n, int k, int budget, vector<vector<int>>& composition, vector<int>& stock, vector<int>& cost) {
              int maxStock = *max_element(stock.begin(), stock.end());
              int best = 0;
              for (int i = 0; i < k; i++) {
                  int lo = 0, hi = budget + maxStock;
                  while (lo < hi) {
                      int mid = lo + (hi - lo + 1) / 2;
                      if (alloyAffordable(composition[i], stock, cost, budget, mid)) lo = mid; else hi = mid - 1;
                  }
                  best = max(best, lo);
              }
              return best;
          }
        `,
        c: code`
          static int alloyAffordable(int* comp, int* stock, int* cost, int n, long long budget, long long x) {
              long long spent = 0;
              for (int j = 0; j < n; j++) {
                  long long lack = x * comp[j] - stock[j];
                  if (lack > 0) {
                      spent += lack * cost[j];
                      if (spent > budget) return 0;
                  }
              }
              return 1;
          }

          int maxNumberOfAlloys(int n, int k, int budget, int** composition, int compositionSize, int* compositionColSize, int* stock, int stockSize, int* cost, int costSize) {
              int maxStock = 0;
              for (int j = 0; j < n; j++) if (stock[j] > maxStock) maxStock = stock[j];
              int best = 0;
              for (int i = 0; i < k; i++) {
                  int lo = 0, hi = budget + maxStock;
                  while (lo < hi) {
                      int mid = lo + (hi - lo + 1) / 2;
                      if (alloyAffordable(composition[i], stock, cost, n, budget, mid)) lo = mid; else hi = mid - 1;
                  }
                  if (lo > best) best = lo;
              }
              return best;
          }
        `,
        csharp: code`
          public static int MaxNumberOfAlloys(int n, int k, int budget, int[][] composition, int[] stock, int[] cost)
          {
              int maxStock = stock.Max();
              int best = 0;
              for (int i = 0; i < k; i++)
              {
                  int lo = 0, hi = budget + maxStock;
                  while (lo < hi)
                  {
                      int mid = lo + (hi - lo + 1) / 2;
                      if (AlloyAffordable(composition[i], stock, cost, budget, mid)) lo = mid; else hi = mid - 1;
                  }
                  best = Math.Max(best, lo);
              }
              return best;
          }

          static bool AlloyAffordable(int[] comp, int[] stock, int[] cost, long budget, long x)
          {
              long spent = 0;
              for (int j = 0; j < comp.Length; j++)
              {
                  long lack = x * comp[j] - stock[j];
                  if (lack > 0)
                  {
                      spent += lack * cost[j];
                      if (spent > budget) return false;
                  }
              }
              return true;
          }
        `,
        go: code`
          func maxNumberOfAlloys(n int, k int, budget int, composition [][]int, stock []int, cost []int) int {
              affordable := func(comp []int, x int) bool {
                  spent := 0
                  for j := 0; j < n; j++ {
                      lack := x*comp[j] - stock[j]
                      if lack > 0 {
                          spent += lack * cost[j]
                          if spent > budget {
                              return false
                          }
                      }
                  }
                  return true
              }
              maxStock := 0
              for _, s := range stock {
                  if s > maxStock {
                      maxStock = s
                  }
              }
              best := 0
              for i := 0; i < k; i++ {
                  lo, hi := 0, budget+maxStock
                  for lo < hi {
                      mid := lo + (hi-lo+1)/2
                      if affordable(composition[i], mid) {
                          lo = mid
                      } else {
                          hi = mid - 1
                      }
                  }
                  if lo > best {
                      best = lo
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxNumberOfAlloys(n: Int, k: Int, budget: Int, composition: Array<IntArray>, stock: IntArray, cost: IntArray): Int {
              fun affordable(comp: IntArray, x: Long): Boolean {
                  var spent = 0L
                  for (j in 0 until n) {
                      val lack = x * comp[j] - stock[j]
                      if (lack > 0) {
                          spent += lack * cost[j]
                          if (spent > budget) return false
                      }
                  }
                  return true
              }
              var maxStock = 0
              for (s in stock) if (s > maxStock) maxStock = s
              var best = 0
              for (i in 0 until k) {
                  var lo = 0
                  var hi = budget + maxStock
                  while (lo < hi) {
                      val mid = lo + (hi - lo + 1) / 2
                      if (affordable(composition[i], mid.toLong())) lo = mid else hi = mid - 1
                  }
                  if (lo > best) best = lo
              }
              return best
          }
        `,
        swift: code`
          func maxNumberOfAlloys(_ n: Int, _ k: Int, _ budget: Int, _ composition: [[Int]], _ stock: [Int], _ cost: [Int]) -> Int {
              func affordable(_ comp: [Int], _ x: Int) -> Bool {
                  var spent = 0
                  for j in 0..<n {
                      let lack = x * comp[j] - stock[j]
                      if lack > 0 {
                          spent += lack * cost[j]
                          if spent > budget { return false }
                      }
                  }
                  return true
              }
              let maxStock = stock.max()!
              var best = 0
              for i in 0..<k {
                  var lo = 0
                  var hi = budget + maxStock
                  while lo < hi {
                      let mid = lo + (hi - lo + 1) / 2
                      if affordable(composition[i], mid) { lo = mid } else { hi = mid - 1 }
                  }
                  best = max(best, lo)
              }
              return best
          }
        `,
        rust: code`
          fn maxNumberOfAlloys(n: i32, k: i32, budget: i32, composition: Vec<Vec<i32>>, stock: Vec<i32>, cost: Vec<i32>) -> i32 {
              let n = n as usize;
              let budget = budget as i64;
              let affordable = |comp: &Vec<i32>, x: i64| -> bool {
                  let mut spent: i64 = 0;
                  for j in 0..n {
                      let lack = x * comp[j] as i64 - stock[j] as i64;
                      if lack > 0 {
                          spent += lack * cost[j] as i64;
                          if spent > budget { return false; }
                      }
                  }
                  true
              };
              let max_stock = *stock.iter().max().unwrap() as i64;
              let mut best: i64 = 0;
              for i in 0..(k as usize) {
                  let mut lo: i64 = 0;
                  let mut hi: i64 = budget + max_stock;
                  while lo < hi {
                      let mid = lo + (hi - lo + 1) / 2;
                      if affordable(&composition[i], mid) { lo = mid; } else { hi = mid - 1; }
                  }
                  if lo > best { best = lo; }
              }
              best as i32
          }
        `,
        php: code`
          function alloyAffordable($comp, $stock, $cost, $budget, $x) {
              $spent = 0;
              foreach ($comp as $j => $c) {
                  $lack = $x * $c - $stock[$j];
                  if ($lack > 0) {
                      $spent += $lack * $cost[$j];
                      if ($spent > $budget) return false;
                  }
              }
              return true;
          }

          function maxNumberOfAlloys($n, $k, $budget, $composition, $stock, $cost) {
              $top = $budget + max($stock);
              $best = 0;
              foreach ($composition as $comp) {
                  $lo = 0;
                  $hi = $top;
                  while ($lo < $hi) {
                      $mid = $lo + intdiv($hi - $lo + 1, 2);
                      if (alloyAffordable($comp, $stock, $cost, $budget, $mid)) $lo = $mid; else $hi = $mid - 1;
                  }
                  if ($lo > $best) $best = $lo;
              }
              return $best;
          }
        `,
        ruby: code`
          def maxNumberOfAlloys(n, k, budget, composition, stock, cost)
            affordable = lambda do |comp, x|
              spent = 0
              n.times do |j|
                lack = x * comp[j] - stock[j]
                if lack > 0
                  spent += lack * cost[j]
                  return false if spent > budget
                end
              end
              true
            end
            top = budget + stock.max
            best = 0
            composition.each do |comp|
              lo = 0
              hi = top
              while lo < hi
                mid = lo + (hi - lo + 1) / 2
                if affordable.call(comp, mid)
                  lo = mid
                else
                  hi = mid - 1
                end
              end
              best = lo if lo > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Minimum Number of Seconds to Make Mountain Height Zero (LC 3296) ──
  (() => {
    // Independent check: hand out the height one unit at a time to the worker
    // whose finishing time grows the least.
    const ref = (height: number, workers: number[]) => {
      const done = workers.map(() => 0);
      for (let u = 0; u < height; u++) {
        let bi = 0, bt = Infinity;
        for (let i = 0; i < workers.length; i++) {
          const c = done[i] + 1;
          const t = workers[i] * c * (c + 1) / 2;
          if (t < bt) { bt = t; bi = i; }
        }
        done[bi]++;
      }
      let worst = 0;
      for (let i = 0; i < workers.length; i++) worst = Math.max(worst, workers[i] * done[i] * (done[i] + 1) / 2);
      return worst;
    };
    return {
      slug: "minimum-number-of-seconds-to-make-mountain-height-zero",
      title: "Minimum Number of Seconds to Make Mountain Height Zero",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Binary Search", "Heap (Priority Queue)", "Amazon", "Google"],
      signature: {
        funcName: "minNumberOfSeconds",
        params: [{ name: "mountainHeight", type: "int" as const }, { name: "workerTimes", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A mountain is `mountainHeight` units tall. A team of workers digs it down at the same time; worker `i` has speed parameter `workerTimes[i]`.\n\nFor worker `i` to remove `x` units, it needs `workerTimes[i] · (1 + 2 + ... + x) = workerTimes[i] · x · (x + 1) / 2` seconds — each further unit takes longer than the last. Workers act independently and in parallel, and you choose how many units each one removes (some may remove none).\n\nReturn the minimum number of seconds until the mountain's height is 0.\n\n*CodeKairo bounds:* the original allows heights up to `10^5` and times up to `10^6`, which needs a 64-bit answer. Here `mountainHeight <= 1000` and `workerTimes[i] <= 1000`, so the answer fits in a 32-bit integer.",
        [
          { in: "mountainHeight = 6, workerTimes = [1,3]", out: "10", note: "The fast worker removes 4 units (1 + 2 + 3 + 4 = 10 s) while the slow one removes 2 (3 + 6 = 9 s)." },
          { in: "mountainHeight = 5, workerTimes = [1]", out: "15" },
          { in: "mountainHeight = 3, workerTimes = [5,5,5]", out: "5", note: "Each worker removes one unit." },
        ],
        ["1 <= mountainHeight <= 1000", "1 <= workerTimes.length <= 10^4", "1 <= workerTimes[i] <= 1000"]),
      hints: [
        "If you fix a deadline `T`, each worker independently removes as many units as fit in `T` seconds.",
        "Worker `i` can remove the largest `x` with `workerTimes[i] · x · (x + 1) / 2 <= T`; the deadline works when these `x` add up to at least the height.",
        "More time never hurts, so binary-search the smallest working `T`; find each worker's `x` with an inner binary search (or an integer square root).",
      ],
      editorial: explain({
        idea: "Binary search on the finishing time. For a candidate time `T`, every worker removes as much as it can by `T`, and the mountain is cleared exactly when those amounts sum to the height.",
        steps: [
          "Search `T` between 1 and `min(workerTimes) · h · (h + 1) / 2` (the fastest worker alone always finishes by then).",
          "For a candidate `T`, for each worker find the largest `x` in `[0, h]` with `t · x · (x + 1) / 2 <= T` (inner binary search, or `x = floor((sqrt(8 · floor(T / t) + 1) - 1) / 2)`).",
          "Sum the `x` values; stop early once the sum reaches `h`. `T` is feasible if it does.",
          "Keep the smallest feasible `T`.",
        ],
        why: "Workers do not interact, so by time `T` the most the team can remove is the sum of each worker's individual maximum, and any split that removes `h` units by `T` is dominated by it. That maximum grows with `T`, so feasibility is monotone and the binary search is exact.",
        time: "O(w · log h · log(T_max))",
        space: "O(1)",
        pitfalls: [
          "Work with `t · x · (x + 1) / 2` in 64-bit — with the original bounds it reaches about 5 · 10^15.",
          "Cap each worker's `x` at the height so the sum cannot overflow.",
          "A floating-point square root can be off by one; correct it or use integer arithmetic.",
        ],
      }),
      examples: [
        { input: "6\n[1,3]", expectedOutput: "10" },
        { input: "5\n[1]", expectedOutput: "15" },
        { input: "3\n[5,5,5]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const height = ri(rng, 1, pick(rng, [1, 10, 60, 1000]));
        const tmax = pick(rng, [1, 10, 1000]);
        const workers = Array.from({ length: ri(rng, 1, pick(rng, [1, 3, 10])) }, () => ri(rng, 1, tmax));
        return { input: `${height}\n${fmtIntArr(workers)}`, expectedOutput: String(ref(height, workers)) };
      },
      solutions: {
        python: code`
          from typing import List
          import math

          def minNumberOfSeconds(mountainHeight: int, workerTimes: List[int]) -> int:
              h = mountainHeight

              def enough(T):
                  done = 0
                  for t in workerTimes:
                      m = T // t
                      x = (math.isqrt(8 * m + 1) - 1) // 2
                      done += min(x, h)
                      if done >= h:
                          return True
                  return False

              lo, hi = 1, min(workerTimes) * h * (h + 1) // 2
              while lo < hi:
                  mid = (lo + hi) // 2
                  if enough(mid):
                      hi = mid
                  else:
                      lo = mid + 1
              return lo
        `,
        javascript: code`
          var minNumberOfSeconds = function(mountainHeight, workerTimes) {
              var h = mountainHeight;
              var enough = function(T) {
                  var done = 0;
                  for (var i = 0; i < workerTimes.length; i++) {
                      var t = workerTimes[i];
                      var lo = 0, hi = h;
                      while (lo < hi) {
                          var mid = (lo + hi + 1) >> 1;
                          if (t * mid * (mid + 1) / 2 <= T) lo = mid; else hi = mid - 1;
                      }
                      done += lo;
                      if (done >= h) return true;
                  }
                  return false;
              };
              var fastest = workerTimes[0];
              for (var j = 1; j < workerTimes.length; j++) if (workerTimes[j] < fastest) fastest = workerTimes[j];
              var lo = 1, hi = fastest * h * (h + 1) / 2;
              while (lo < hi) {
                  var mid = lo + Math.floor((hi - lo) / 2);
                  if (enough(mid)) hi = mid; else lo = mid + 1;
              }
              return lo;
          };
        `,
        typescript: code`
          function minNumberOfSeconds(mountainHeight: number, workerTimes: number[]): number {
              var h = mountainHeight;
              var enough = function(T: number): boolean {
                  var done = 0;
                  for (var i = 0; i < workerTimes.length; i++) {
                      var t = workerTimes[i];
                      var a = 0, b = h;
                      while (a < b) {
                          var m = (a + b + 1) >> 1;
                          if (t * m * (m + 1) / 2 <= T) a = m; else b = m - 1;
                      }
                      done += a;
                      if (done >= h) return true;
                  }
                  return false;
              };
              var fastest = workerTimes[0];
              for (var j = 1; j < workerTimes.length; j++) if (workerTimes[j] < fastest) fastest = workerTimes[j];
              var lo = 1, hi = fastest * h * (h + 1) / 2;
              while (lo < hi) {
                  var mid = lo + Math.floor((hi - lo) / 2);
                  if (enough(mid)) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        java: code`
          public static int minNumberOfSeconds(int mountainHeight, int[] workerTimes) {
              int h = mountainHeight;
              long fastest = Long.MAX_VALUE;
              for (int t : workerTimes) fastest = Math.min(fastest, t);
              long lo = 1, hi = fastest * h * (h + 1) / 2;
              while (lo < hi) {
                  long mid = lo + (hi - lo) / 2;
                  if (heightCleared(workerTimes, h, mid)) hi = mid; else lo = mid + 1;
              }
              return (int) lo;
          }

          static boolean heightCleared(int[] workerTimes, int h, long T) {
              long done = 0;
              for (int t : workerTimes) {
                  long a = 0, b = h;
                  while (a < b) {
                      long m = (a + b + 1) / 2;
                      if ((long) t * m * (m + 1) / 2 <= T) a = m; else b = m - 1;
                  }
                  done += a;
                  if (done >= h) return true;
              }
              return false;
          }
        `,
        cpp: code`
          bool heightCleared(const vector<int>& workerTimes, int h, long long T) {
              long long done = 0;
              for (int t : workerTimes) {
                  long long a = 0, b = h;
                  while (a < b) {
                      long long m = (a + b + 1) / 2;
                      if ((long long)t * m * (m + 1) / 2 <= T) a = m; else b = m - 1;
                  }
                  done += a;
                  if (done >= h) return true;
              }
              return false;
          }

          int minNumberOfSeconds(int mountainHeight, vector<int>& workerTimes) {
              int h = mountainHeight;
              long long fastest = *min_element(workerTimes.begin(), workerTimes.end());
              long long lo = 1, hi = fastest * h * (h + 1) / 2;
              while (lo < hi) {
                  long long mid = lo + (hi - lo) / 2;
                  if (heightCleared(workerTimes, h, mid)) hi = mid; else lo = mid + 1;
              }
              return (int)lo;
          }
        `,
        c: code`
          static int heightCleared(int* workerTimes, int w, int h, long long T) {
              long long done = 0;
              for (int i = 0; i < w; i++) {
                  long long t = workerTimes[i];
                  long long a = 0, b = h;
                  while (a < b) {
                      long long m = (a + b + 1) / 2;
                      if (t * m * (m + 1) / 2 <= T) a = m; else b = m - 1;
                  }
                  done += a;
                  if (done >= h) return 1;
              }
              return 0;
          }

          int minNumberOfSeconds(int mountainHeight, int* workerTimes, int workerTimesSize) {
              int h = mountainHeight;
              long long fastest = workerTimes[0];
              for (int i = 1; i < workerTimesSize; i++) if (workerTimes[i] < fastest) fastest = workerTimes[i];
              long long lo = 1, hi = fastest * h * (h + 1) / 2;
              while (lo < hi) {
                  long long mid = lo + (hi - lo) / 2;
                  if (heightCleared(workerTimes, workerTimesSize, h, mid)) hi = mid; else lo = mid + 1;
              }
              return (int)lo;
          }
        `,
        csharp: code`
          public static int MinNumberOfSeconds(int mountainHeight, int[] workerTimes)
          {
              int h = mountainHeight;
              long fastest = workerTimes.Min();
              long lo = 1, hi = fastest * h * (h + 1) / 2;
              while (lo < hi)
              {
                  long mid = lo + (hi - lo) / 2;
                  if (HeightCleared(workerTimes, h, mid)) hi = mid; else lo = mid + 1;
              }
              return (int)lo;
          }

          static bool HeightCleared(int[] workerTimes, int h, long T)
          {
              long done = 0;
              foreach (int t in workerTimes)
              {
                  long a = 0, b = h;
                  while (a < b)
                  {
                      long m = (a + b + 1) / 2;
                      if ((long)t * m * (m + 1) / 2 <= T) a = m; else b = m - 1;
                  }
                  done += a;
                  if (done >= h) return true;
              }
              return false;
          }
        `,
        go: code`
          func minNumberOfSeconds(mountainHeight int, workerTimes []int) int {
              h := mountainHeight
              enough := func(T int) bool {
                  done := 0
                  for _, t := range workerTimes {
                      a, b := 0, h
                      for a < b {
                          m := (a + b + 1) / 2
                          if t*m*(m+1)/2 <= T {
                              a = m
                          } else {
                              b = m - 1
                          }
                      }
                      done += a
                      if done >= h {
                          return true
                      }
                  }
                  return false
              }
              fastest := workerTimes[0]
              for _, t := range workerTimes {
                  if t < fastest {
                      fastest = t
                  }
              }
              lo, hi := 1, fastest*h*(h+1)/2
              for lo < hi {
                  mid := lo + (hi-lo)/2
                  if enough(mid) {
                      hi = mid
                  } else {
                      lo = mid + 1
                  }
              }
              return lo
          }
        `,
        kotlin: code`
          fun minNumberOfSeconds(mountainHeight: Int, workerTimes: IntArray): Int {
              val h = mountainHeight
              fun enough(T: Long): Boolean {
                  var done = 0L
                  for (t in workerTimes) {
                      var a = 0L
                      var b = h.toLong()
                      while (a < b) {
                          val m = (a + b + 1) / 2
                          if (t.toLong() * m * (m + 1) / 2 <= T) a = m else b = m - 1
                      }
                      done += a
                      if (done >= h) return true
                  }
                  return false
              }
              var fastest = workerTimes[0]
              for (t in workerTimes) if (t < fastest) fastest = t
              var lo = 1L
              var hi = fastest.toLong() * h * (h + 1) / 2
              while (lo < hi) {
                  val mid = lo + (hi - lo) / 2
                  if (enough(mid)) hi = mid else lo = mid + 1
              }
              return lo.toInt()
          }
        `,
        swift: code`
          func minNumberOfSeconds(_ mountainHeight: Int, _ workerTimes: [Int]) -> Int {
              let h = mountainHeight
              func enough(_ T: Int) -> Bool {
                  var done = 0
                  for t in workerTimes {
                      var a = 0
                      var b = h
                      while a < b {
                          let m = (a + b + 1) / 2
                          if t * m * (m + 1) / 2 <= T { a = m } else { b = m - 1 }
                      }
                      done += a
                      if done >= h { return true }
                  }
                  return false
              }
              let fastest = workerTimes.min()!
              var lo = 1
              var hi = fastest * h * (h + 1) / 2
              while lo < hi {
                  let mid = lo + (hi - lo) / 2
                  if enough(mid) { hi = mid } else { lo = mid + 1 }
              }
              return lo
          }
        `,
        rust: code`
          fn minNumberOfSeconds(mountainHeight: i32, workerTimes: Vec<i32>) -> i32 {
              let h = mountainHeight as i64;
              let enough = |big_t: i64| -> bool {
                  let mut done: i64 = 0;
                  for &t in workerTimes.iter() {
                      let t = t as i64;
                      let mut a: i64 = 0;
                      let mut b: i64 = h;
                      while a < b {
                          let m = (a + b + 1) / 2;
                          if t * m * (m + 1) / 2 <= big_t { a = m; } else { b = m - 1; }
                      }
                      done += a;
                      if done >= h { return true; }
                  }
                  false
              };
              let fastest = *workerTimes.iter().min().unwrap() as i64;
              let mut lo: i64 = 1;
              let mut hi: i64 = fastest * h * (h + 1) / 2;
              while lo < hi {
                  let mid = lo + (hi - lo) / 2;
                  if enough(mid) { hi = mid; } else { lo = mid + 1; }
              }
              lo as i32
          }
        `,
        php: code`
          function minNumberOfSeconds($mountainHeight, $workerTimes) {
              $h = $mountainHeight;
              $lo = 1;
              $hi = intdiv(min($workerTimes) * $h * ($h + 1), 2);
              while ($lo < $hi) {
                  $mid = $lo + intdiv($hi - $lo, 2);
                  $done = 0;
                  foreach ($workerTimes as $t) {
                      $m = intdiv($mid, $t);
                      $x = (int) floor((sqrt(8 * $m + 1) - 1) / 2);
                      while (intdiv(($x + 1) * ($x + 2), 2) <= $m) $x++;
                      while ($x > 0 && intdiv($x * ($x + 1), 2) > $m) $x--;
                      $done += min($x, $h);
                      if ($done >= $h) break;
                  }
                  if ($done >= $h) $hi = $mid; else $lo = $mid + 1;
              }
              return $lo;
          }
        `,
        ruby: code`
          def minNumberOfSeconds(mountainHeight, workerTimes)
            h = mountainHeight
            enough = lambda do |big_t|
              done = 0
              workerTimes.each do |t|
                m = big_t / t
                x = (Integer.sqrt(8 * m + 1) - 1) / 2
                done += [x, h].min
                return true if done >= h
              end
              false
            end
            lo = 1
            hi = workerTimes.min * h * (h + 1) / 2
            while lo < hi
              mid = lo + (hi - lo) / 2
              if enough.call(mid)
                hi = mid
              else
                lo = mid + 1
              end
            end
            lo
          end
        `,
      },
    };
  })(),

  // ── Longest Increasing Subsequence II (LC 2407) ─────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const dp = nums.map(() => 1);
      let best = 0;
      for (let i = 0; i < nums.length; i++) {
        for (let j = 0; j < i; j++) {
          if (nums[j] < nums[i] && nums[i] - nums[j] <= k) dp[i] = Math.max(dp[i], dp[j] + 1);
        }
        best = Math.max(best, dp[i]);
      }
      return best;
    };
    return {
      slug: "longest-increasing-subsequence-ii",
      title: "Longest Increasing Subsequence II",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Segment Tree", "Divide and Conquer", "Google", "Amazon"],
      signature: {
        funcName: "lengthOfLIS",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given an integer array `nums` and an integer `k`, find the longest subsequence of `nums` that is\n\n- **strictly increasing**, and\n- has a difference of **at most `k`** between every pair of adjacent elements in the subsequence.\n\nReturn its length. (A subsequence keeps the original order but may skip elements.)",
        [
          { in: "nums = [3,1,6,2,4,7,10], k = 2", out: "3", note: "`[1,2,4]` climbs by 1 and then 2; nothing longer keeps every step at most 2." },
          { in: "nums = [4,2,1,4,3,4,5,8,15], k = 3", out: "5", note: "`[1,3,4,5,8]` — the jump from 8 to 15 is too big." },
          { in: "nums = [1,5], k = 1", out: "1" },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i], k <= 10^5"]),
      hints: [
        "Let `best[v]` be the length of the longest valid subsequence seen so far that ends with the value `v`.",
        "Processing `nums` left to right, a new element `x` extends the best chain ending at any value in `[x - k, x - 1]`.",
        "You need range-maximum queries and point updates over the value axis — a segment tree indexed by value does both in `O(log V)`.",
      ],
      editorial: explain({
        idea: "Run the classic LIS dynamic programme over *values* instead of indices: the answer for an element `x` is one more than the best chain ending at a value in the window `[x - k, x - 1]`. A max segment tree over values answers that window query and absorbs the update in logarithmic time.",
        steps: [
          "Build a max segment tree over values `0..max(nums)`, all zeros.",
          "For each `x` in order: `len = 1 + max(tree[max(0, x - k) .. x - 1])`.",
          "Update position `x` to `max(tree[x], len)` and track the overall maximum.",
          "Return the overall maximum.",
        ],
        why: "When `x` is processed, the tree holds, for every value, the longest valid chain ending there using only earlier elements — exactly the candidates `x` may extend (strictly smaller, at most `k` below). Taking the maximum over that value window is therefore the correct DP transition, and storing the result at `x` keeps the invariant for later elements.",
        time: "O(n log V) with V = max(nums)",
        space: "O(V)",
        pitfalls: [
          "Strictly increasing: query up to `x - 1`, not `x`, so equal values never chain.",
          "The patience-sorting O(n log n) LIS trick does not carry over — the difference limit breaks its greedy choice.",
          "Size the tree by the largest value present rather than the 10^5 bound when many small inputs are processed.",
        ],
      }),
      examples: [
        { input: "[3,1,6,2,4,7,10]\n2", expectedOutput: "3" },
        { input: "[4,2,1,4,3,4,5,8,15]\n3", expectedOutput: "5" },
        { input: "[1,5]\n1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 6, 20, 40]));
        // The tree is sized by the largest value, so values near 10^5 are kept
        // rare: they cost an allocation of 2 · 10^5 cells per case.
        const vmax = rng() < 0.01 ? 100000 : pick(rng, [5, 30, 300, 2000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, vmax));
        if (rng() < 0.15) nums.sort((a, b) => a - b);
        const k = ri(rng, 1, pick(rng, [1, 3, 20, vmax, 100000]));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def lengthOfLIS(nums: List[int], k: int) -> int:
              size = max(nums) + 1
              tree = [0] * (2 * size)
              best = 0
              for x in nums:
                  l = max(0, x - k) + size
                  r = x + size
                  cur = 0
                  while l < r:
                      if l & 1:
                          if tree[l] > cur:
                              cur = tree[l]
                          l += 1
                      if r & 1:
                          r -= 1
                          if tree[r] > cur:
                              cur = tree[r]
                      l >>= 1
                      r >>= 1
                  cur += 1
                  if cur > best:
                      best = cur
                  p = x + size
                  if cur > tree[p]:
                      tree[p] = cur
                      p >>= 1
                      while p >= 1:
                          tree[p] = max(tree[2 * p], tree[2 * p + 1])
                          p >>= 1
              return best
        `,
        javascript: code`
          var lengthOfLIS = function(nums, k) {
              var size = 1;
              for (var i = 0; i < nums.length; i++) if (nums[i] + 1 > size) size = nums[i] + 1;
              var tree = new Array(2 * size).fill(0);
              var best = 0;
              for (var j = 0; j < nums.length; j++) {
                  var x = nums[j];
                  var l = Math.max(0, x - k) + size, r = x + size, cur = 0;
                  while (l < r) {
                      if (l & 1) { if (tree[l] > cur) cur = tree[l]; l++; }
                      if (r & 1) { r--; if (tree[r] > cur) cur = tree[r]; }
                      l >>= 1;
                      r >>= 1;
                  }
                  cur += 1;
                  if (cur > best) best = cur;
                  var p = x + size;
                  if (cur > tree[p]) {
                      tree[p] = cur;
                      for (p >>= 1; p >= 1; p >>= 1) tree[p] = Math.max(tree[2 * p], tree[2 * p + 1]);
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function lengthOfLIS(nums: number[], k: number): number {
              var size = 1;
              for (var i = 0; i < nums.length; i++) if (nums[i] + 1 > size) size = nums[i] + 1;
              var tree: number[] = [];
              for (var t = 0; t < 2 * size; t++) tree.push(0);
              var best = 0;
              for (var j = 0; j < nums.length; j++) {
                  var x = nums[j];
                  var l = Math.max(0, x - k) + size, r = x + size, cur = 0;
                  while (l < r) {
                      if (l & 1) { if (tree[l] > cur) cur = tree[l]; l++; }
                      if (r & 1) { r--; if (tree[r] > cur) cur = tree[r]; }
                      l >>= 1;
                      r >>= 1;
                  }
                  cur += 1;
                  if (cur > best) best = cur;
                  var p = x + size;
                  if (cur > tree[p]) {
                      tree[p] = cur;
                      for (p >>= 1; p >= 1; p >>= 1) tree[p] = Math.max(tree[2 * p], tree[2 * p + 1]);
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int lengthOfLIS(int[] nums, int k) {
              int size = 1;
              for (int v : nums) size = Math.max(size, v + 1);
              int[] tree = new int[2 * size];
              int best = 0;
              for (int x : nums) {
                  int l = Math.max(0, x - k) + size, r = x + size, cur = 0;
                  while (l < r) {
                      if ((l & 1) == 1) cur = Math.max(cur, tree[l++]);
                      if ((r & 1) == 1) cur = Math.max(cur, tree[--r]);
                      l >>= 1;
                      r >>= 1;
                  }
                  cur += 1;
                  best = Math.max(best, cur);
                  int p = x + size;
                  if (cur > tree[p]) {
                      tree[p] = cur;
                      for (p >>= 1; p >= 1; p >>= 1) tree[p] = Math.max(tree[2 * p], tree[2 * p + 1]);
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int lengthOfLIS(vector<int>& nums, int k) {
              int size = 1;
              for (int v : nums) size = max(size, v + 1);
              vector<int> tree(2 * size, 0);
              int best = 0;
              for (int x : nums) {
                  int l = max(0, x - k) + size, r = x + size, cur = 0;
                  while (l < r) {
                      if (l & 1) cur = max(cur, tree[l++]);
                      if (r & 1) cur = max(cur, tree[--r]);
                      l >>= 1;
                      r >>= 1;
                  }
                  cur += 1;
                  best = max(best, cur);
                  int p = x + size;
                  if (cur > tree[p]) {
                      tree[p] = cur;
                      for (p >>= 1; p >= 1; p >>= 1) tree[p] = max(tree[2 * p], tree[2 * p + 1]);
                  }
              }
              return best;
          }
        `,
        c: code`
          int lengthOfLIS(int* nums, int numsSize, int k) {
              int size = 1;
              for (int i = 0; i < numsSize; i++) if (nums[i] + 1 > size) size = nums[i] + 1;
              int* tree = (int*)calloc(2 * (size_t)size, sizeof(int));
              int best = 0;
              for (int i = 0; i < numsSize; i++) {
                  int x = nums[i];
                  int l = (x - k > 0 ? x - k : 0) + size, r = x + size, cur = 0;
                  while (l < r) {
                      if (l & 1) { if (tree[l] > cur) cur = tree[l]; l++; }
                      if (r & 1) { r--; if (tree[r] > cur) cur = tree[r]; }
                      l >>= 1;
                      r >>= 1;
                  }
                  cur += 1;
                  if (cur > best) best = cur;
                  int p = x + size;
                  if (cur > tree[p]) {
                      tree[p] = cur;
                      for (p >>= 1; p >= 1; p >>= 1) tree[p] = tree[2 * p] > tree[2 * p + 1] ? tree[2 * p] : tree[2 * p + 1];
                  }
              }
              free(tree);
              return best;
          }
        `,
        csharp: code`
          public static int LengthOfLIS(int[] nums, int k)
          {
              int size = 1;
              foreach (int v in nums) size = Math.Max(size, v + 1);
              int[] tree = new int[2 * size];
              int best = 0;
              foreach (int x in nums)
              {
                  int l = Math.Max(0, x - k) + size, r = x + size, cur = 0;
                  while (l < r)
                  {
                      if ((l & 1) == 1) cur = Math.Max(cur, tree[l++]);
                      if ((r & 1) == 1) cur = Math.Max(cur, tree[--r]);
                      l >>= 1;
                      r >>= 1;
                  }
                  cur += 1;
                  best = Math.Max(best, cur);
                  int p = x + size;
                  if (cur > tree[p])
                  {
                      tree[p] = cur;
                      for (p >>= 1; p >= 1; p >>= 1) tree[p] = Math.Max(tree[2 * p], tree[2 * p + 1]);
                  }
              }
              return best;
          }
        `,
        go: code`
          func lengthOfLIS(nums []int, k int) int {
              size := 1
              for _, v := range nums {
                  if v+1 > size {
                      size = v + 1
                  }
              }
              tree := make([]int, 2*size)
              best := 0
              for _, x := range nums {
                  l := x - k
                  if l < 0 {
                      l = 0
                  }
                  l += size
                  r := x + size
                  cur := 0
                  for l < r {
                      if l&1 == 1 {
                          if tree[l] > cur {
                              cur = tree[l]
                          }
                          l++
                      }
                      if r&1 == 1 {
                          r--
                          if tree[r] > cur {
                              cur = tree[r]
                          }
                      }
                      l >>= 1
                      r >>= 1
                  }
                  cur++
                  if cur > best {
                      best = cur
                  }
                  p := x + size
                  if cur > tree[p] {
                      tree[p] = cur
                      for p >>= 1; p >= 1; p >>= 1 {
                          if tree[2*p] > tree[2*p+1] {
                              tree[p] = tree[2*p]
                          } else {
                              tree[p] = tree[2*p+1]
                          }
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun lengthOfLIS(nums: IntArray, k: Int): Int {
              var size = 1
              for (v in nums) if (v + 1 > size) size = v + 1
              val tree = IntArray(2 * size)
              var best = 0
              for (x in nums) {
                  var l = maxOf(0, x - k) + size
                  var r = x + size
                  var cur = 0
                  while (l < r) {
                      if ((l and 1) == 1) { cur = maxOf(cur, tree[l]); l++ }
                      if ((r and 1) == 1) { r--; cur = maxOf(cur, tree[r]) }
                      l = l shr 1
                      r = r shr 1
                  }
                  cur += 1
                  if (cur > best) best = cur
                  var p = x + size
                  if (cur > tree[p]) {
                      tree[p] = cur
                      p = p shr 1
                      while (p >= 1) {
                          tree[p] = maxOf(tree[2 * p], tree[2 * p + 1])
                          p = p shr 1
                      }
                  }
              }
              return best
          }
        `,
        swift: code`
          func lengthOfLIS(_ nums: [Int], _ k: Int) -> Int {
              var size = 1
              for v in nums { if v + 1 > size { size = v + 1 } }
              var tree = Array(repeating: 0, count: 2 * size)
              var best = 0
              for x in nums {
                  var l = max(0, x - k) + size
                  var r = x + size
                  var cur = 0
                  while l < r {
                      if l & 1 == 1 { cur = max(cur, tree[l]); l += 1 }
                      if r & 1 == 1 { r -= 1; cur = max(cur, tree[r]) }
                      l >>= 1
                      r >>= 1
                  }
                  cur += 1
                  if cur > best { best = cur }
                  var p = x + size
                  if cur > tree[p] {
                      tree[p] = cur
                      p >>= 1
                      while p >= 1 {
                          tree[p] = max(tree[2 * p], tree[2 * p + 1])
                          p >>= 1
                      }
                  }
              }
              return best
          }
        `,
        rust: code`
          fn lengthOfLIS(nums: Vec<i32>, k: i32) -> i32 {
              let mut size = 1usize;
              for &v in nums.iter() {
                  if v as usize + 1 > size { size = v as usize + 1; }
              }
              let mut tree = vec![0i32; 2 * size];
              let mut best = 0;
              for &x in nums.iter() {
                  let lo_val = if x - k > 0 { (x - k) as usize } else { 0 };
                  let mut l = lo_val + size;
                  let mut r = x as usize + size;
                  let mut cur = 0;
                  while l < r {
                      if l & 1 == 1 { if tree[l] > cur { cur = tree[l]; } l += 1; }
                      if r & 1 == 1 { r -= 1; if tree[r] > cur { cur = tree[r]; } }
                      l >>= 1;
                      r >>= 1;
                  }
                  cur += 1;
                  if cur > best { best = cur; }
                  let mut p = x as usize + size;
                  if cur > tree[p] {
                      tree[p] = cur;
                      p >>= 1;
                      while p >= 1 {
                          tree[p] = std::cmp::max(tree[2 * p], tree[2 * p + 1]);
                          p >>= 1;
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function lengthOfLIS($nums, $k) {
              $size = max($nums) + 1;
              $tree = array_fill(0, 2 * $size, 0);
              $best = 0;
              foreach ($nums as $x) {
                  $l = max(0, $x - $k) + $size;
                  $r = $x + $size;
                  $cur = 0;
                  while ($l < $r) {
                      if ($l & 1) { if ($tree[$l] > $cur) $cur = $tree[$l]; $l++; }
                      if ($r & 1) { $r--; if ($tree[$r] > $cur) $cur = $tree[$r]; }
                      $l >>= 1;
                      $r >>= 1;
                  }
                  $cur += 1;
                  if ($cur > $best) $best = $cur;
                  $p = $x + $size;
                  if ($cur > $tree[$p]) {
                      $tree[$p] = $cur;
                      for ($p >>= 1; $p >= 1; $p >>= 1) $tree[$p] = max($tree[2 * $p], $tree[2 * $p + 1]);
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def lengthOfLIS(nums, k)
            size = nums.max + 1
            tree = [0] * (2 * size)
            best = 0
            nums.each do |x|
              l = [0, x - k].max + size
              r = x + size
              cur = 0
              while l < r
                if l.odd?
                  cur = tree[l] if tree[l] > cur
                  l += 1
                end
                if r.odd?
                  r -= 1
                  cur = tree[r] if tree[r] > cur
                end
                l >>= 1
                r >>= 1
              end
              cur += 1
              best = cur if cur > best
              p = x + size
              if cur > tree[p]
                tree[p] = cur
                p >>= 1
                while p >= 1
                  tree[p] = tree[2 * p] > tree[2 * p + 1] ? tree[2 * p] : tree[2 * p + 1]
                  p >>= 1
                end
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Median in a Row-Wise Sorted Matrix (GFG) ────────────────────
  (() => {
    const ref = (mat: number[][]) => {
      const all: number[] = [];
      for (const row of mat) for (const v of row) all.push(v);
      all.sort((a, b) => a - b);
      return all[(all.length - 1) / 2];
    };
    return {
      slug: "median-in-a-row-wise-sorted-matrix",
      title: "Median in a Row-Wise Sorted Matrix",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Matrix", "Amazon", "Google", "Flipkart"],
      signature: {
        funcName: "median",
        params: [{ name: "mat", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "`mat` is an `R x C` matrix in which **every row** is sorted in non-decreasing order (columns need not be). Both `R` and `C` are odd, so the matrix holds an odd number of elements.\n\nReturn the **median** of all `R · C` elements: the value that would sit exactly in the middle if every element were written into one sorted list.\n\nTry to do better than collecting and sorting all the elements.",
        [
          { in: "mat = [[1,3,5],[2,6,9],[3,6,9]]", out: "5", note: "All nine values sorted: 1, 2, 3, 3, 5, 6, 6, 9, 9 — the fifth is 5." },
          { in: "mat = [[1],[2],[3]]", out: "2" },
          { in: "mat = [[4,4,8]]", out: "4" },
        ],
        ["1 <= R, C <= 400", "R and C are odd", "1 <= mat[i][j] <= 2000", "Each row of mat is sorted in non-decreasing order"]),
      hints: [
        "The median `m` is the smallest value such that at least `(R · C + 1) / 2` elements are `<= m`.",
        "For a guess `x`, counting the elements `<= x` takes one binary search per row because each row is sorted.",
        "Binary-search `x` between the smallest first-column value and the largest last-column value.",
      ],
      editorial: explain({
        idea: "Binary search on the value, not on positions. For a candidate `x`, the number of elements `<= x` is the sum over rows of an upper-bound search, and that count only grows with `x`; the median is the smallest `x` whose count reaches the middle rank.",
        steps: [
          "Let `lo` be the minimum of the first column and `hi` the maximum of the last column; let `need = (R · C) / 2 + 1`.",
          "While `lo < hi`, take `mid = lo + (hi - lo) / 2` and count the elements `<= mid` with an upper-bound binary search in each row.",
          "If the count is at least `need`, set `hi = mid`; otherwise `lo = mid + 1`.",
          "Return `lo`.",
        ],
        why: "Let `m` be the true median. Exactly `need - 1` elements lie strictly in front of it in sorted order, so `count(m) >= need` while `count(m - 1) < need`. Because `count` is non-decreasing, `m` is the smallest value with `count >= need`, which is precisely what the search converges to — and it is always an actual element of the matrix.",
        time: "O(R · log C · log V) with V the value range",
        space: "O(1)",
        pitfalls: [
          "Count elements `<= mid` (upper bound), not `< mid`, or duplicates around the median break the search.",
          "The middle rank is `(R · C) / 2 + 1` in 1-based terms — off by one here returns a neighbour.",
          "Rows are sorted but columns are not, so the global minimum and maximum come from the first and last columns.",
        ],
      }),
      examples: [
        { input: "[[1,3,5],[2,6,9],[3,6,9]]", expectedOutput: "5" },
        { input: "[[1],[2],[3]]", expectedOutput: "2" },
        { input: "[[4,4,8]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const R = pick(rng, [1, 1, 3, 5, 7, 9]);
        const C = pick(rng, [1, 1, 3, 5, 7, 9]);
        const span = pick(rng, [3, 50, 2000]);
        const mat = Array.from({ length: R }, () => Array.from({ length: C }, () => ri(rng, 1, span)).sort((a, b) => a - b));
        return { input: fmtIntMat(mat), expectedOutput: String(ref(mat)) };
      },
      solutions: {
        python: code`
          from typing import List
          import bisect

          def median(mat: List[List[int]]) -> int:
              rows, cols = len(mat), len(mat[0])
              lo = min(row[0] for row in mat)
              hi = max(row[-1] for row in mat)
              need = rows * cols // 2 + 1
              while lo < hi:
                  mid = (lo + hi) // 2
                  cnt = 0
                  for row in mat:
                      cnt += bisect.bisect_right(row, mid)
                  if cnt >= need:
                      hi = mid
                  else:
                      lo = mid + 1
              return lo
        `,
        javascript: code`
          var median = function(mat) {
              var rows = mat.length, cols = mat[0].length;
              var lo = mat[0][0], hi = mat[0][cols - 1];
              for (var i = 1; i < rows; i++) {
                  if (mat[i][0] < lo) lo = mat[i][0];
                  if (mat[i][cols - 1] > hi) hi = mat[i][cols - 1];
              }
              var need = Math.floor(rows * cols / 2) + 1;
              while (lo < hi) {
                  var mid = lo + ((hi - lo) >> 1);
                  var cnt = 0;
                  for (var r = 0; r < rows; r++) {
                      var a = 0, b = cols;
                      while (a < b) {
                          var m = (a + b) >> 1;
                          if (mat[r][m] <= mid) a = m + 1; else b = m;
                      }
                      cnt += a;
                  }
                  if (cnt >= need) hi = mid; else lo = mid + 1;
              }
              return lo;
          };
        `,
        typescript: code`
          function median(mat: number[][]): number {
              var rows = mat.length, cols = mat[0].length;
              var lo = mat[0][0], hi = mat[0][cols - 1];
              for (var i = 1; i < rows; i++) {
                  if (mat[i][0] < lo) lo = mat[i][0];
                  if (mat[i][cols - 1] > hi) hi = mat[i][cols - 1];
              }
              var need = Math.floor(rows * cols / 2) + 1;
              while (lo < hi) {
                  var mid = lo + ((hi - lo) >> 1);
                  var cnt = 0;
                  for (var r = 0; r < rows; r++) {
                      var a = 0, b = cols;
                      while (a < b) {
                          var m = (a + b) >> 1;
                          if (mat[r][m] <= mid) a = m + 1; else b = m;
                      }
                      cnt += a;
                  }
                  if (cnt >= need) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        java: code`
          public static int median(int[][] mat) {
              int rows = mat.length, cols = mat[0].length;
              int lo = Integer.MAX_VALUE, hi = Integer.MIN_VALUE;
              for (int[] row : mat) {
                  lo = Math.min(lo, row[0]);
                  hi = Math.max(hi, row[cols - 1]);
              }
              int need = rows * cols / 2 + 1;
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  int cnt = 0;
                  for (int[] row : mat) {
                      int a = 0, b = cols;
                      while (a < b) {
                          int m = (a + b) >>> 1;
                          if (row[m] <= mid) a = m + 1; else b = m;
                      }
                      cnt += a;
                  }
                  if (cnt >= need) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        cpp: code`
          int median(vector<vector<int>>& mat) {
              int rows = mat.size(), cols = mat[0].size();
              int lo = INT_MAX, hi = INT_MIN;
              for (auto& row : mat) {
                  lo = min(lo, row[0]);
                  hi = max(hi, row[cols - 1]);
              }
              int need = rows * cols / 2 + 1;
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  int cnt = 0;
                  for (auto& row : mat) cnt += upper_bound(row.begin(), row.end(), mid) - row.begin();
                  if (cnt >= need) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        c: code`
          int median(int** mat, int matSize, int* matColSize) {
              int rows = matSize, cols = matColSize[0];
              int lo = mat[0][0], hi = mat[0][cols - 1];
              for (int i = 1; i < rows; i++) {
                  if (mat[i][0] < lo) lo = mat[i][0];
                  if (mat[i][cols - 1] > hi) hi = mat[i][cols - 1];
              }
              int need = rows * cols / 2 + 1;
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  int cnt = 0;
                  for (int r = 0; r < rows; r++) {
                      int a = 0, b = cols;
                      while (a < b) {
                          int m = a + (b - a) / 2;
                          if (mat[r][m] <= mid) a = m + 1; else b = m;
                      }
                      cnt += a;
                  }
                  if (cnt >= need) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        csharp: code`
          public static int Median(int[][] mat)
          {
              int rows = mat.Length, cols = mat[0].Length;
              int lo = int.MaxValue, hi = int.MinValue;
              foreach (var row in mat)
              {
                  lo = Math.Min(lo, row[0]);
                  hi = Math.Max(hi, row[cols - 1]);
              }
              int need = rows * cols / 2 + 1;
              while (lo < hi)
              {
                  int mid = lo + (hi - lo) / 2;
                  int cnt = 0;
                  foreach (var row in mat)
                  {
                      int a = 0, b = cols;
                      while (a < b)
                      {
                          int m = a + (b - a) / 2;
                          if (row[m] <= mid) a = m + 1; else b = m;
                      }
                      cnt += a;
                  }
                  if (cnt >= need) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        go: code`
          func median(mat [][]int) int {
              rows, cols := len(mat), len(mat[0])
              lo, hi := mat[0][0], mat[0][cols-1]
              for _, row := range mat {
                  if row[0] < lo {
                      lo = row[0]
                  }
                  if row[cols-1] > hi {
                      hi = row[cols-1]
                  }
              }
              need := rows*cols/2 + 1
              for lo < hi {
                  mid := lo + (hi-lo)/2
                  cnt := 0
                  for _, row := range mat {
                      cnt += sort.SearchInts(row, mid+1)
                  }
                  if cnt >= need {
                      hi = mid
                  } else {
                      lo = mid + 1
                  }
              }
              return lo
          }
        `,
        kotlin: code`
          fun median(mat: Array<IntArray>): Int {
              val rows = mat.size
              val cols = mat[0].size
              var lo = Int.MAX_VALUE
              var hi = Int.MIN_VALUE
              for (row in mat) {
                  lo = minOf(lo, row[0])
                  hi = maxOf(hi, row[cols - 1])
              }
              val need = rows * cols / 2 + 1
              while (lo < hi) {
                  val mid = lo + (hi - lo) / 2
                  var cnt = 0
                  for (row in mat) {
                      var a = 0
                      var b = cols
                      while (a < b) {
                          val m = (a + b) / 2
                          if (row[m] <= mid) a = m + 1 else b = m
                      }
                      cnt += a
                  }
                  if (cnt >= need) hi = mid else lo = mid + 1
              }
              return lo
          }
        `,
        swift: code`
          func median(_ mat: [[Int]]) -> Int {
              let rows = mat.count
              let cols = mat[0].count
              var lo = Int.max
              var hi = Int.min
              for row in mat {
                  lo = min(lo, row[0])
                  hi = max(hi, row[cols - 1])
              }
              let need = rows * cols / 2 + 1
              while lo < hi {
                  let mid = lo + (hi - lo) / 2
                  var cnt = 0
                  for row in mat {
                      var a = 0
                      var b = cols
                      while a < b {
                          let m = (a + b) / 2
                          if row[m] <= mid { a = m + 1 } else { b = m }
                      }
                      cnt += a
                  }
                  if cnt >= need { hi = mid } else { lo = mid + 1 }
              }
              return lo
          }
        `,
        rust: code`
          fn median(mat: Vec<Vec<i32>>) -> i32 {
              let rows = mat.len();
              let cols = mat[0].len();
              let mut lo = std::i32::MAX;
              let mut hi = std::i32::MIN;
              for row in mat.iter() {
                  if row[0] < lo { lo = row[0]; }
                  if row[cols - 1] > hi { hi = row[cols - 1]; }
              }
              let need = rows * cols / 2 + 1;
              while lo < hi {
                  let mid = lo + (hi - lo) / 2;
                  let mut cnt = 0usize;
                  for row in mat.iter() {
                      let mut a = 0usize;
                      let mut b = cols;
                      while a < b {
                          let m = (a + b) / 2;
                          if row[m] <= mid { a = m + 1; } else { b = m; }
                      }
                      cnt += a;
                  }
                  if cnt >= need { hi = mid; } else { lo = mid + 1; }
              }
              lo
          }
        `,
        php: code`
          function median($mat) {
              $rows = count($mat);
              $cols = count($mat[0]);
              $lo = PHP_INT_MAX;
              $hi = PHP_INT_MIN;
              foreach ($mat as $row) {
                  if ($row[0] < $lo) $lo = $row[0];
                  if ($row[$cols - 1] > $hi) $hi = $row[$cols - 1];
              }
              $need = intdiv($rows * $cols, 2) + 1;
              while ($lo < $hi) {
                  $mid = $lo + intdiv($hi - $lo, 2);
                  $cnt = 0;
                  foreach ($mat as $row) {
                      $a = 0;
                      $b = $cols;
                      while ($a < $b) {
                          $m = intdiv($a + $b, 2);
                          if ($row[$m] <= $mid) $a = $m + 1; else $b = $m;
                      }
                      $cnt += $a;
                  }
                  if ($cnt >= $need) $hi = $mid; else $lo = $mid + 1;
              }
              return $lo;
          }
        `,
        ruby: code`
          def median(mat)
            rows = mat.length
            cols = mat[0].length
            lo = mat.map { |row| row[0] }.min
            hi = mat.map { |row| row[cols - 1] }.max
            need = rows * cols / 2 + 1
            while lo < hi
              mid = lo + (hi - lo) / 2
              cnt = 0
              mat.each do |row|
                cnt += row.bsearch_index { |v| v > mid } || cols
              end
              if cnt >= need
                hi = mid
              else
                lo = mid + 1
              end
            end
            lo
          end
        `,
      },
    };
  })(),

  // ── Earliest Second to Mark Indices I (LC 3048) ─────────────────
  (() => {
    // Independent check per prefix: earliest-deadline-first. Each index must be
    // marked at its last occurrence, and every earlier mark slot is a second
    // that cannot be spent decrementing.
    const ref = (nums: number[], change: number[]) => {
      const n = nums.length;
      for (let s = 1; s <= change.length; s++) {
        const last = new Array(n).fill(-1);
        for (let t = 0; t < s; t++) last[change[t] - 1] = t;
        if (last.some((v) => v < 0)) continue;
        const order = nums.map((_, i) => i).sort((a, b) => last[a] - last[b]);
        let work = 0, ok = true;
        order.forEach((i, j) => {
          work += nums[i];
          if (work > last[i] - j) ok = false;
        });
        if (ok) return s;
      }
      return -1;
    };
    return {
      slug: "earliest-second-to-mark-indices-i",
      title: "Earliest Second to Mark Indices I",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Greedy", "Google", "Amazon"],
      signature: {
        funcName: "earliestSecondToMarkIndices",
        params: [{ name: "nums", type: "int[]" as const }, { name: "changeIndices", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given a **1-indexed** array `nums` of length `n` and a **1-indexed** array `changeIndices` of length `m`. Every index of `nums` starts unmarked; the goal is to mark all of them.\n\nSeconds run from `1` to `m`. In second `s` you may do **exactly one** of the following:\n\n- pick any index `i` and decrease `nums[i]` by 1;\n- if `nums[changeIndices[s]]` is 0, mark the index `changeIndices[s]`;\n- do nothing.\n\nReturn the earliest second in `[1, m]` by which every index can be marked when the operations are chosen optimally, or `-1` if that is impossible.",
        [
          { in: "nums = [1,0], changeIndices = [2,1,1]", out: "3", note: "Second 1 marks index 2 (already 0), second 2 lowers index 1 to 0, second 3 marks index 1." },
          { in: "nums = [2,2,0], changeIndices = [2,2,2,2,3,2,2,1]", out: "8" },
          { in: "nums = [0,1], changeIndices = [2,2,2]", out: "-1", note: "Index 1 never appears in `changeIndices`, so it can never be marked." },
        ],
        ["1 <= n == nums.length <= 2000", "0 <= nums[i] <= 10^9", "1 <= m == changeIndices.length <= 2000", "1 <= changeIndices[i] <= n"]),
      hints: [
        "If everything can be marked by second `s`, it can also be marked by any later second — so binary-search `s`.",
        "Within the first `s` seconds, it is never worse to mark an index at its **last** appearance: that leaves every earlier second free for decrements.",
        "Sweep seconds `1..s`: a last appearance spends its accumulated free seconds on that index's value (fail if there are not enough); every other second adds one free second.",
      ],
      editorial: explain({
        idea: "Binary search the answer `s`. To test a prefix of `s` seconds, mark each index at its last appearance inside the prefix and check, sweeping left to right, that enough spare seconds have accumulated to bring that index to zero first.",
        steps: [
          "`feasible(s)`: record the last second (within the first `s`) at which each index appears; if some index never appears, fail.",
          "Sweep `t = 1..s` with a counter `free = 0`. If `t` is the last appearance of `i = changeIndices[t]`, require `free >= nums[i]`, then do `free -= nums[i]` (second `t` itself is the mark). Otherwise `free += 1`.",
          "If `feasible(m)` is false return `-1`; otherwise binary-search the smallest feasible `s` in `[1, m]`.",
        ],
        why: "Marking index `i` earlier than its last appearance never helps: moving the mark to the last appearance frees a second earlier on and only shortens no deadline. With marks fixed at last appearances, the sweep is an earliest-deadline-first schedule of unit decrements, which succeeds whenever any schedule does. Extending the prefix only moves deadlines later and adds seconds, so feasibility is monotone.",
        time: "O((n + m) log m)",
        space: "O(n)",
        pitfalls: [
          "Both arrays are 1-indexed — subtract 1 before indexing `nums`.",
          "Values up to 10^9 simply make the prefix infeasible; compare before subtracting, never loop over them.",
          "The marking second cannot also be used for a decrement.",
        ],
      }),
      examples: [
        { input: "[1,0]\n[2,1,1]", expectedOutput: "3" },
        { input: "[2,2,0]\n[2,2,2,2,3,2,2,1]", expectedOutput: "8" },
        { input: "[0,1]\n[2,2,2]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [3, 5, 8]));
        const vmax = rng() < 0.03 ? 1000000000 : pick(rng, [0, 1, 3, 6]);
        const nums = Array.from({ length: n }, () => ri(rng, 0, vmax));
        // Aim m near the seconds the work really needs (sum + one mark each),
        // so the answer sits close to the feasibility boundary.
        const need = Math.min(60, nums.reduce((a, b) => a + b, 0) + n);
        const m = rng() < 0.1 ? ri(rng, 1, 40) : Math.max(1, need + ri(rng, -3, pick(rng, [2, 8, 20])));
        const changeIndices = Array.from({ length: m }, () => ri(rng, 1, n));
        // Most cases name every index at least once, so the answer is decided by
        // the decrement budget rather than by a missing index.
        if (m >= n && rng() < 0.75) {
          const slots = shuffle(rng, Array.from({ length: m }, (_, i) => i)).slice(0, n);
          slots.forEach((s, i) => { changeIndices[s] = i + 1; });
        }
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(changeIndices)}`, expectedOutput: String(ref(nums, changeIndices)) };
      },
      solutions: {
        python: code`
          from typing import List

          def earliestSecondToMarkIndices(nums: List[int], changeIndices: List[int]) -> int:
              n, m = len(nums), len(changeIndices)

              def feasible(s):
                  last = [-1] * n
                  for t in range(s):
                      last[changeIndices[t] - 1] = t
                  if min(last) < 0:
                      return False
                  free = 0
                  for t in range(s):
                      i = changeIndices[t] - 1
                      if last[i] == t:
                          if free < nums[i]:
                              return False
                          free -= nums[i]
                      else:
                          free += 1
                  return True

              if not feasible(m):
                  return -1
              lo, hi = 1, m
              while lo < hi:
                  mid = (lo + hi) // 2
                  if feasible(mid):
                      hi = mid
                  else:
                      lo = mid + 1
              return lo
        `,
        javascript: code`
          var earliestSecondToMarkIndices = function(nums, changeIndices) {
              var n = nums.length, m = changeIndices.length;
              var feasible = function(s) {
                  var last = new Array(n).fill(-1);
                  for (var t = 0; t < s; t++) last[changeIndices[t] - 1] = t;
                  for (var i = 0; i < n; i++) if (last[i] < 0) return false;
                  var free = 0;
                  for (var u = 0; u < s; u++) {
                      var idx = changeIndices[u] - 1;
                      if (last[idx] === u) {
                          if (free < nums[idx]) return false;
                          free -= nums[idx];
                      } else {
                          free++;
                      }
                  }
                  return true;
              };
              if (!feasible(m)) return -1;
              var lo = 1, hi = m;
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (feasible(mid)) hi = mid; else lo = mid + 1;
              }
              return lo;
          };
        `,
        typescript: code`
          function earliestSecondToMarkIndices(nums: number[], changeIndices: number[]): number {
              var n = nums.length, m = changeIndices.length;
              var feasible = function(s: number): boolean {
                  var last: number[] = [];
                  for (var z = 0; z < n; z++) last.push(-1);
                  for (var t = 0; t < s; t++) last[changeIndices[t] - 1] = t;
                  for (var i = 0; i < n; i++) if (last[i] < 0) return false;
                  var free = 0;
                  for (var u = 0; u < s; u++) {
                      var idx = changeIndices[u] - 1;
                      if (last[idx] === u) {
                          if (free < nums[idx]) return false;
                          free -= nums[idx];
                      } else {
                          free++;
                      }
                  }
                  return true;
              };
              if (!feasible(m)) return -1;
              var lo = 1, hi = m;
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (feasible(mid)) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        java: code`
          public static int earliestSecondToMarkIndices(int[] nums, int[] changeIndices) {
              int m = changeIndices.length;
              if (!markable(nums, changeIndices, m)) return -1;
              int lo = 1, hi = m;
              while (lo < hi) {
                  int mid = (lo + hi) >>> 1;
                  if (markable(nums, changeIndices, mid)) hi = mid; else lo = mid + 1;
              }
              return lo;
          }

          static boolean markable(int[] nums, int[] changeIndices, int s) {
              int n = nums.length;
              int[] last = new int[n];
              Arrays.fill(last, -1);
              for (int t = 0; t < s; t++) last[changeIndices[t] - 1] = t;
              for (int v : last) if (v < 0) return false;
              long free = 0;
              for (int t = 0; t < s; t++) {
                  int i = changeIndices[t] - 1;
                  if (last[i] == t) {
                      if (free < nums[i]) return false;
                      free -= nums[i];
                  } else {
                      free++;
                  }
              }
              return true;
          }
        `,
        cpp: code`
          bool markable(const vector<int>& nums, const vector<int>& changeIndices, int s) {
              int n = nums.size();
              vector<int> last(n, -1);
              for (int t = 0; t < s; t++) last[changeIndices[t] - 1] = t;
              for (int v : last) if (v < 0) return false;
              long long freeSec = 0;
              for (int t = 0; t < s; t++) {
                  int i = changeIndices[t] - 1;
                  if (last[i] == t) {
                      if (freeSec < nums[i]) return false;
                      freeSec -= nums[i];
                  } else {
                      freeSec++;
                  }
              }
              return true;
          }

          int earliestSecondToMarkIndices(vector<int>& nums, vector<int>& changeIndices) {
              int m = changeIndices.size();
              if (!markable(nums, changeIndices, m)) return -1;
              int lo = 1, hi = m;
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (markable(nums, changeIndices, mid)) hi = mid; else lo = mid + 1;
              }
              return lo;
          }
        `,
        c: code`
          static int markable(int* nums, int n, int* changeIndices, int s, int* last) {
              for (int i = 0; i < n; i++) last[i] = -1;
              for (int t = 0; t < s; t++) last[changeIndices[t] - 1] = t;
              for (int i = 0; i < n; i++) if (last[i] < 0) return 0;
              long long freeSec = 0;
              for (int t = 0; t < s; t++) {
                  int i = changeIndices[t] - 1;
                  if (last[i] == t) {
                      if (freeSec < nums[i]) return 0;
                      freeSec -= nums[i];
                  } else {
                      freeSec++;
                  }
              }
              return 1;
          }

          int earliestSecondToMarkIndices(int* nums, int numsSize, int* changeIndices, int changeIndicesSize) {
              int m = changeIndicesSize;
              int* last = (int*)malloc(sizeof(int) * numsSize);
              int ans = -1;
              if (markable(nums, numsSize, changeIndices, m, last)) {
                  int lo = 1, hi = m;
                  while (lo < hi) {
                      int mid = lo + (hi - lo) / 2;
                      if (markable(nums, numsSize, changeIndices, mid, last)) hi = mid; else lo = mid + 1;
                  }
                  ans = lo;
              }
              free(last);
              return ans;
          }
        `,
        csharp: code`
          public static int EarliestSecondToMarkIndices(int[] nums, int[] changeIndices)
          {
              int m = changeIndices.Length;
              if (!Markable(nums, changeIndices, m)) return -1;
              int lo = 1, hi = m;
              while (lo < hi)
              {
                  int mid = lo + (hi - lo) / 2;
                  if (Markable(nums, changeIndices, mid)) hi = mid; else lo = mid + 1;
              }
              return lo;
          }

          static bool Markable(int[] nums, int[] changeIndices, int s)
          {
              int n = nums.Length;
              int[] last = new int[n];
              for (int i = 0; i < n; i++) last[i] = -1;
              for (int t = 0; t < s; t++) last[changeIndices[t] - 1] = t;
              for (int i = 0; i < n; i++) if (last[i] < 0) return false;
              long free = 0;
              for (int t = 0; t < s; t++)
              {
                  int i = changeIndices[t] - 1;
                  if (last[i] == t)
                  {
                      if (free < nums[i]) return false;
                      free -= nums[i];
                  }
                  else
                  {
                      free++;
                  }
              }
              return true;
          }
        `,
        go: code`
          func earliestSecondToMarkIndices(nums []int, changeIndices []int) int {
              n, m := len(nums), len(changeIndices)
              feasible := func(s int) bool {
                  last := make([]int, n)
                  for i := range last {
                      last[i] = -1
                  }
                  for t := 0; t < s; t++ {
                      last[changeIndices[t]-1] = t
                  }
                  for _, v := range last {
                      if v < 0 {
                          return false
                      }
                  }
                  free := 0
                  for t := 0; t < s; t++ {
                      i := changeIndices[t] - 1
                      if last[i] == t {
                          if free < nums[i] {
                              return false
                          }
                          free -= nums[i]
                      } else {
                          free++
                      }
                  }
                  return true
              }
              if !feasible(m) {
                  return -1
              }
              lo, hi := 1, m
              for lo < hi {
                  mid := (lo + hi) / 2
                  if feasible(mid) {
                      hi = mid
                  } else {
                      lo = mid + 1
                  }
              }
              return lo
          }
        `,
        kotlin: code`
          fun earliestSecondToMarkIndices(nums: IntArray, changeIndices: IntArray): Int {
              val n = nums.size
              val m = changeIndices.size
              fun feasible(s: Int): Boolean {
                  val last = IntArray(n) { -1 }
                  for (t in 0 until s) last[changeIndices[t] - 1] = t
                  for (v in last) if (v < 0) return false
                  var free = 0L
                  for (t in 0 until s) {
                      val i = changeIndices[t] - 1
                      if (last[i] == t) {
                          if (free < nums[i]) return false
                          free -= nums[i]
                      } else {
                          free++
                      }
                  }
                  return true
              }
              if (!feasible(m)) return -1
              var lo = 1
              var hi = m
              while (lo < hi) {
                  val mid = (lo + hi) / 2
                  if (feasible(mid)) hi = mid else lo = mid + 1
              }
              return lo
          }
        `,
        swift: code`
          func earliestSecondToMarkIndices(_ nums: [Int], _ changeIndices: [Int]) -> Int {
              let n = nums.count
              let m = changeIndices.count
              func feasible(_ s: Int) -> Bool {
                  var last = Array(repeating: -1, count: n)
                  for t in 0..<s { last[changeIndices[t] - 1] = t }
                  for v in last where v < 0 { return false }
                  var free = 0
                  for t in 0..<s {
                      let i = changeIndices[t] - 1
                      if last[i] == t {
                          if free < nums[i] { return false }
                          free -= nums[i]
                      } else {
                          free += 1
                      }
                  }
                  return true
              }
              if !feasible(m) { return -1 }
              var lo = 1
              var hi = m
              while lo < hi {
                  let mid = (lo + hi) / 2
                  if feasible(mid) { hi = mid } else { lo = mid + 1 }
              }
              return lo
          }
        `,
        rust: code`
          fn earliestSecondToMarkIndices(nums: Vec<i32>, changeIndices: Vec<i32>) -> i32 {
              let n = nums.len();
              let m = changeIndices.len();
              let feasible = |s: usize| -> bool {
                  let mut last = vec![-1i64; n];
                  for t in 0..s {
                      last[(changeIndices[t] - 1) as usize] = t as i64;
                  }
                  if last.iter().any(|&v| v < 0) { return false; }
                  let mut free: i64 = 0;
                  for t in 0..s {
                      let i = (changeIndices[t] - 1) as usize;
                      if last[i] == t as i64 {
                          if free < nums[i] as i64 { return false; }
                          free -= nums[i] as i64;
                      } else {
                          free += 1;
                      }
                  }
                  true
              };
              if !feasible(m) { return -1; }
              let mut lo = 1usize;
              let mut hi = m;
              while lo < hi {
                  let mid = (lo + hi) / 2;
                  if feasible(mid) { hi = mid; } else { lo = mid + 1; }
              }
              lo as i32
          }
        `,
        php: code`
          function markableBy($nums, $changeIndices, $s) {
              $n = count($nums);
              $last = array_fill(0, $n, -1);
              for ($t = 0; $t < $s; $t++) $last[$changeIndices[$t] - 1] = $t;
              foreach ($last as $v) if ($v < 0) return false;
              $free = 0;
              for ($t = 0; $t < $s; $t++) {
                  $i = $changeIndices[$t] - 1;
                  if ($last[$i] == $t) {
                      if ($free < $nums[$i]) return false;
                      $free -= $nums[$i];
                  } else {
                      $free++;
                  }
              }
              return true;
          }

          function earliestSecondToMarkIndices($nums, $changeIndices) {
              $m = count($changeIndices);
              if (!markableBy($nums, $changeIndices, $m)) return -1;
              $lo = 1;
              $hi = $m;
              while ($lo < $hi) {
                  $mid = intdiv($lo + $hi, 2);
                  if (markableBy($nums, $changeIndices, $mid)) $hi = $mid; else $lo = $mid + 1;
              }
              return $lo;
          }
        `,
        ruby: code`
          def earliestSecondToMarkIndices(nums, changeIndices)
            n = nums.length
            m = changeIndices.length
            feasible = lambda do |s|
              last = Array.new(n, -1)
              s.times { |t| last[changeIndices[t] - 1] = t }
              return false if last.min < 0
              free = 0
              s.times do |t|
                i = changeIndices[t] - 1
                if last[i] == t
                  return false if free < nums[i]
                  free -= nums[i]
                else
                  free += 1
                end
              end
              true
            end
            return -1 unless feasible.call(m)
            lo = 1
            hi = m
            while lo < hi
              mid = (lo + hi) / 2
              if feasible.call(mid)
                hi = mid
              else
                lo = mid + 1
              end
            end
            lo
          end
        `,
      },
    };
  })(),

  // ── Minimum Sum of Squared Difference (LC 2333) ─────────────────
  (() => {
    // Independent check: bucket the differences and lower the largest bucket
    // one step at a time.
    const ref = (a: number[], b: number[], k1: number, k2: number) => {
      const d = a.map((v, i) => Math.abs(v - b[i]));
      let top = Math.max(...d);
      const cnt = new Array(top + 1).fill(0);
      for (const x of d) cnt[x]++;
      let left = k1 + k2;
      while (left > 0 && top > 0) {
        const take = Math.min(left, cnt[top]);
        cnt[top] -= take;
        cnt[top - 1] += take;
        left -= take;
        if (cnt[top] === 0) top--;
      }
      let s = 0;
      for (let v = 0; v < cnt.length; v++) s += cnt[v] * v * v;
      return s;
    };
    return {
      slug: "minimum-sum-of-squared-difference",
      title: "Minimum Sum of Squared Difference",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Greedy", "Sorting", "Amazon", "Google"],
      signature: {
        funcName: "minSumSquareDiff",
        params: [
          { name: "nums1", type: "int[]" as const },
          { name: "nums2", type: "int[]" as const },
          { name: "k1", type: "int" as const },
          { name: "k2", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "Two arrays `nums1` and `nums2` of length `n` have a **sum of squared difference** equal to the sum of `(nums1[i] - nums2[i])^2` over all `i`.\n\nYou may change elements of `nums1` by `+1` or `-1` at most `k1` times in total, and elements of `nums2` by `+1` or `-1` at most `k2` times in total. Elements may become negative.\n\nReturn the minimum possible sum of squared difference.\n\n*CodeKairo bounds:* the original allows `n` and the values up to `10^5`, which needs a 64-bit answer. Here `n <= 1000` and values are at most `1000`, so the answer fits in a 32-bit integer.",
        [
          { in: "nums1 = [1,4,10,12], nums2 = [5,8,6,9], k1 = 1, k2 = 1", out: "43", note: "The differences are 4, 4, 4, 3; spending both moves on two of the 4s leaves 3, 3, 4, 3 → 9 + 9 + 16 + 9 = 43." },
          { in: "nums1 = [7,2], nums2 = [1,2], k1 = 2, k2 = 1", out: "9", note: "Only the first pair differs (by 6); three moves bring it to 3." },
          { in: "nums1 = [3,3,3], nums2 = [1,5,3], k1 = 10, k2 = 0", out: "0" },
        ],
        ["n == nums1.length == nums2.length", "1 <= n <= 1000", "0 <= nums1[i], nums2[i] <= 1000", "0 <= k1, k2 <= 10^9"]),
      hints: [
        "A move on `nums1[i]` or on `nums2[i]` does the same thing: it shrinks the difference `|nums1[i] - nums2[i]|` by one. So only `k = k1 + k2` matters.",
        "Squares punish large differences most, so each move should go to the currently largest difference.",
        "Instead of simulating `k` moves, binary-search the level `T` that all differences above it get flattened down to, then spread the leftover moves one apiece among the differences sitting at `T`.",
      ],
      editorial: explain({
        idea: "Reduce to differences `d_i` and a combined budget `k = k1 + k2`. Greedily lowering the largest difference is optimal, and its end result is a water level: every difference above some `T` is cut to `T`, with a few of those cut once more to `T - 1`. Binary search finds `T`.",
        steps: [
          "Compute `d_i = |nums1[i] - nums2[i]|` and `k = k1 + k2`. If `Σ d_i <= k`, return 0.",
          "Binary-search the smallest `T >= 0` with `Σ max(0, d_i - T) <= k`. (`T >= 1` here, since cutting to 0 would cost more than `k`.)",
          "Let `rem = k - Σ max(0, d_i - T)` and `c` = number of `d_i >= T`; minimality of `T` guarantees `rem < c`.",
          "Answer = `Σ_{d_i < T} d_i^2 + (c - rem) · T^2 + rem · (T - 1)^2`.",
        ],
        why: "Lowering a difference from `x` to `x - 1` saves `2x - 1`, which is largest for the largest `x`, and the savings available from any one difference only shrink as it is lowered — so the greedy that always lowers a current maximum is optimal (an exchange argument swaps any move on a smaller difference for one on a larger). Running that greedy to completion produces exactly the levelled shape computed above.",
        time: "O(n log D) with D the largest difference",
        space: "O(n)",
        pitfalls: [
          "`k1 + k2` can be 2 · 10^9 — keep it in 64-bit in languages with 32-bit `int`.",
          "Once every difference is 0 extra moves are wasted (moving past 0 makes it worse), so return 0 when the budget covers the total.",
          "Leftover moves after the level cut go to differences equal to `T`, one each — not all to the same one.",
        ],
      }),
      examples: [
        { input: "[1,4,10,12]\n[5,8,6,9]\n1\n1", expectedOutput: "43" },
        { input: "[7,2]\n[1,2]\n2\n1", expectedOutput: "9" },
        { input: "[3,3,3]\n[1,5,3]\n10\n0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 20]));
        const vmax = pick(rng, [3, 50, 1000]);
        const a = Array.from({ length: n }, () => ri(rng, 0, vmax));
        const b = Array.from({ length: n }, () => ri(rng, 0, vmax));
        let total = 0;
        for (let i = 0; i < n; i++) total += Math.abs(a[i] - b[i]);
        const k = rng() < 0.08 ? ri(rng, 0, 2000000000) : ri(rng, 0, total + 3);
        const k1 = Math.min(1000000000, ri(rng, 0, k));
        const k2 = Math.min(1000000000, k - k1);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}\n${k1}\n${k2}`, expectedOutput: String(ref(a, b, k1, k2)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minSumSquareDiff(nums1: List[int], nums2: List[int], k1: int, k2: int) -> int:
              d = [abs(a - b) for a, b in zip(nums1, nums2)]
              k = k1 + k2
              if sum(d) <= k:
                  return 0

              def cut(T):
                  return sum(x - T for x in d if x > T)

              lo, hi = 0, max(d)
              while lo < hi:
                  mid = (lo + hi) // 2
                  if cut(mid) <= k:
                      hi = mid
                  else:
                      lo = mid + 1
              T = lo
              rem = k - cut(T)
              at = sum(1 for x in d if x >= T)
              rest = sum(x * x for x in d if x < T)
              return rest + (at - rem) * T * T + rem * (T - 1) * (T - 1)
        `,
        javascript: code`
          var minSumSquareDiff = function(nums1, nums2, k1, k2) {
              var n = nums1.length;
              var d = [], total = 0, top = 0;
              for (var i = 0; i < n; i++) {
                  var x = Math.abs(nums1[i] - nums2[i]);
                  d.push(x);
                  total += x;
                  if (x > top) top = x;
              }
              var k = k1 + k2;
              if (total <= k) return 0;
              var cut = function(T) {
                  var s = 0;
                  for (var j = 0; j < n; j++) if (d[j] > T) s += d[j] - T;
                  return s;
              };
              var lo = 0, hi = top;
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (cut(mid) <= k) hi = mid; else lo = mid + 1;
              }
              var level = lo;
              var rem = k - cut(level);
              var at = 0, res = 0;
              for (var t = 0; t < n; t++) {
                  if (d[t] >= level) at++;
                  else res += d[t] * d[t];
              }
              return res + (at - rem) * level * level + rem * (level - 1) * (level - 1);
          };
        `,
        typescript: code`
          function minSumSquareDiff(nums1: number[], nums2: number[], k1: number, k2: number): number {
              var n = nums1.length;
              var d: number[] = [], total = 0, top = 0;
              for (var i = 0; i < n; i++) {
                  var x = Math.abs(nums1[i] - nums2[i]);
                  d.push(x);
                  total += x;
                  if (x > top) top = x;
              }
              var k = k1 + k2;
              if (total <= k) return 0;
              var cut = function(T: number): number {
                  var s = 0;
                  for (var j = 0; j < n; j++) if (d[j] > T) s += d[j] - T;
                  return s;
              };
              var lo = 0, hi = top;
              while (lo < hi) {
                  var mid = (lo + hi) >> 1;
                  if (cut(mid) <= k) hi = mid; else lo = mid + 1;
              }
              var level = lo;
              var rem = k - cut(level);
              var at = 0, res = 0;
              for (var t = 0; t < n; t++) {
                  if (d[t] >= level) at++;
                  else res += d[t] * d[t];
              }
              return res + (at - rem) * level * level + rem * (level - 1) * (level - 1);
          }
        `,
        java: code`
          public static int minSumSquareDiff(int[] nums1, int[] nums2, int k1, int k2) {
              int n = nums1.length;
              int[] d = new int[n];
              long total = 0;
              int top = 0;
              for (int i = 0; i < n; i++) {
                  d[i] = Math.abs(nums1[i] - nums2[i]);
                  total += d[i];
                  top = Math.max(top, d[i]);
              }
              long k = (long) k1 + k2;
              if (total <= k) return 0;
              int lo = 0, hi = top;
              while (lo < hi) {
                  int mid = (lo + hi) >>> 1;
                  if (cutCost(d, mid) <= k) hi = mid; else lo = mid + 1;
              }
              long level = lo;
              long rem = k - cutCost(d, lo);
              long at = 0, res = 0;
              for (int x : d) {
                  if (x >= level) at++;
                  else res += (long) x * x;
              }
              return (int) (res + (at - rem) * level * level + rem * (level - 1) * (level - 1));
          }

          static long cutCost(int[] d, int T) {
              long s = 0;
              for (int x : d) if (x > T) s += x - T;
              return s;
          }
        `,
        cpp: code`
          long long cutCost(const vector<int>& d, int T) {
              long long s = 0;
              for (int x : d) if (x > T) s += x - T;
              return s;
          }

          int minSumSquareDiff(vector<int>& nums1, vector<int>& nums2, int k1, int k2) {
              int n = nums1.size();
              vector<int> d(n);
              long long total = 0;
              int top = 0;
              for (int i = 0; i < n; i++) {
                  d[i] = abs(nums1[i] - nums2[i]);
                  total += d[i];
                  top = max(top, d[i]);
              }
              long long k = (long long)k1 + k2;
              if (total <= k) return 0;
              int lo = 0, hi = top;
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (cutCost(d, mid) <= k) hi = mid; else lo = mid + 1;
              }
              long long level = lo;
              long long rem = k - cutCost(d, lo);
              long long at = 0, res = 0;
              for (int x : d) {
                  if (x >= level) at++;
                  else res += (long long)x * x;
              }
              return (int)(res + (at - rem) * level * level + rem * (level - 1) * (level - 1));
          }
        `,
        c: code`
          static long long cutCost(int* d, int n, int T) {
              long long s = 0;
              for (int i = 0; i < n; i++) if (d[i] > T) s += d[i] - T;
              return s;
          }

          int minSumSquareDiff(int* nums1, int nums1Size, int* nums2, int nums2Size, int k1, int k2) {
              int n = nums1Size;
              int* d = (int*)malloc(sizeof(int) * n);
              long long total = 0;
              int top = 0;
              for (int i = 0; i < n; i++) {
                  int x = nums1[i] - nums2[i];
                  if (x < 0) x = -x;
                  d[i] = x;
                  total += x;
                  if (x > top) top = x;
              }
              long long k = (long long)k1 + k2;
              if (total <= k) { free(d); return 0; }
              int lo = 0, hi = top;
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (cutCost(d, n, mid) <= k) hi = mid; else lo = mid + 1;
              }
              long long level = lo;
              long long rem = k - cutCost(d, n, lo);
              long long at = 0, res = 0;
              for (int i = 0; i < n; i++) {
                  if (d[i] >= level) at++;
                  else res += (long long)d[i] * d[i];
              }
              free(d);
              return (int)(res + (at - rem) * level * level + rem * (level - 1) * (level - 1));
          }
        `,
        csharp: code`
          public static int MinSumSquareDiff(int[] nums1, int[] nums2, int k1, int k2)
          {
              int n = nums1.Length;
              int[] d = new int[n];
              long total = 0;
              int top = 0;
              for (int i = 0; i < n; i++)
              {
                  d[i] = Math.Abs(nums1[i] - nums2[i]);
                  total += d[i];
                  top = Math.Max(top, d[i]);
              }
              long k = (long)k1 + k2;
              if (total <= k) return 0;
              int lo = 0, hi = top;
              while (lo < hi)
              {
                  int mid = lo + (hi - lo) / 2;
                  if (CutCost(d, mid) <= k) hi = mid; else lo = mid + 1;
              }
              long level = lo;
              long rem = k - CutCost(d, lo);
              long at = 0, res = 0;
              foreach (int x in d)
              {
                  if (x >= level) at++;
                  else res += (long)x * x;
              }
              return (int)(res + (at - rem) * level * level + rem * (level - 1) * (level - 1));
          }

          static long CutCost(int[] d, int T)
          {
              long s = 0;
              foreach (int x in d) if (x > T) s += x - T;
              return s;
          }
        `,
        go: code`
          func minSumSquareDiff(nums1 []int, nums2 []int, k1 int, k2 int) int {
              n := len(nums1)
              d := make([]int, n)
              total, top := 0, 0
              for i := 0; i < n; i++ {
                  x := nums1[i] - nums2[i]
                  if x < 0 {
                      x = -x
                  }
                  d[i] = x
                  total += x
                  if x > top {
                      top = x
                  }
              }
              k := k1 + k2
              if total <= k {
                  return 0
              }
              cut := func(T int) int {
                  s := 0
                  for _, x := range d {
                      if x > T {
                          s += x - T
                      }
                  }
                  return s
              }
              lo, hi := 0, top
              for lo < hi {
                  mid := (lo + hi) / 2
                  if cut(mid) <= k {
                      hi = mid
                  } else {
                      lo = mid + 1
                  }
              }
              level := lo
              rem := k - cut(level)
              at, res := 0, 0
              for _, x := range d {
                  if x >= level {
                      at++
                  } else {
                      res += x * x
                  }
              }
              return res + (at-rem)*level*level + rem*(level-1)*(level-1)
          }
        `,
        kotlin: code`
          fun minSumSquareDiff(nums1: IntArray, nums2: IntArray, k1: Int, k2: Int): Int {
              val n = nums1.size
              val d = IntArray(n) { Math.abs(nums1[it] - nums2[it]) }
              var total = 0L
              var top = 0
              for (x in d) {
                  total += x
                  if (x > top) top = x
              }
              val k = k1.toLong() + k2
              if (total <= k) return 0
              fun cut(T: Int): Long {
                  var s = 0L
                  for (x in d) if (x > T) s += (x - T).toLong()
                  return s
              }
              var lo = 0
              var hi = top
              while (lo < hi) {
                  val mid = (lo + hi) / 2
                  if (cut(mid) <= k) hi = mid else lo = mid + 1
              }
              val level = lo.toLong()
              val rem = k - cut(lo)
              var at = 0L
              var res = 0L
              for (x in d) {
                  if (x >= level) at++ else res += x.toLong() * x
              }
              return (res + (at - rem) * level * level + rem * (level - 1) * (level - 1)).toInt()
          }
        `,
        swift: code`
          func minSumSquareDiff(_ nums1: [Int], _ nums2: [Int], _ k1: Int, _ k2: Int) -> Int {
              let n = nums1.count
              var d = [Int]()
              var total = 0
              var top = 0
              for i in 0..<n {
                  let x = abs(nums1[i] - nums2[i])
                  d.append(x)
                  total += x
                  if x > top { top = x }
              }
              let k = k1 + k2
              if total <= k { return 0 }
              func cut(_ T: Int) -> Int {
                  var s = 0
                  for x in d where x > T { s += x - T }
                  return s
              }
              var lo = 0
              var hi = top
              while lo < hi {
                  let mid = (lo + hi) / 2
                  if cut(mid) <= k { hi = mid } else { lo = mid + 1 }
              }
              let level = lo
              let rem = k - cut(level)
              var at = 0
              var res = 0
              for x in d {
                  if x >= level { at += 1 } else { res += x * x }
              }
              return res + (at - rem) * level * level + rem * (level - 1) * (level - 1)
          }
        `,
        rust: code`
          fn minSumSquareDiff(nums1: Vec<i32>, nums2: Vec<i32>, k1: i32, k2: i32) -> i32 {
              let d: Vec<i64> = nums1.iter().zip(nums2.iter()).map(|(&a, &b)| ((a - b) as i64).abs()).collect();
              let total: i64 = d.iter().sum();
              let top: i64 = *d.iter().max().unwrap();
              let k = k1 as i64 + k2 as i64;
              if total <= k { return 0; }
              let cut = |t: i64| -> i64 {
                  let mut s = 0i64;
                  for &x in d.iter() {
                      if x > t { s += x - t; }
                  }
                  s
              };
              let mut lo = 0i64;
              let mut hi = top;
              while lo < hi {
                  let mid = (lo + hi) / 2;
                  if cut(mid) <= k { hi = mid; } else { lo = mid + 1; }
              }
              let level = lo;
              let rem = k - cut(level);
              let mut at = 0i64;
              let mut res = 0i64;
              for &x in d.iter() {
                  if x >= level { at += 1; } else { res += x * x; }
              }
              (res + (at - rem) * level * level + rem * (level - 1) * (level - 1)) as i32
          }
        `,
        php: code`
          function squaredCutCost($d, $T) {
              $s = 0;
              foreach ($d as $x) if ($x > $T) $s += $x - $T;
              return $s;
          }

          function minSumSquareDiff($nums1, $nums2, $k1, $k2) {
              $n = count($nums1);
              $d = [];
              for ($i = 0; $i < $n; $i++) $d[] = abs($nums1[$i] - $nums2[$i]);
              $k = $k1 + $k2;
              if (array_sum($d) <= $k) return 0;
              $lo = 0;
              $hi = max($d);
              while ($lo < $hi) {
                  $mid = intdiv($lo + $hi, 2);
                  if (squaredCutCost($d, $mid) <= $k) $hi = $mid; else $lo = $mid + 1;
              }
              $level = $lo;
              $rem = $k - squaredCutCost($d, $level);
              $at = 0;
              $res = 0;
              foreach ($d as $x) {
                  if ($x >= $level) $at++;
                  else $res += $x * $x;
              }
              return $res + ($at - $rem) * $level * $level + $rem * ($level - 1) * ($level - 1);
          }
        `,
        ruby: code`
          def minSumSquareDiff(nums1, nums2, k1, k2)
            d = nums1.each_with_index.map { |a, i| (a - nums2[i]).abs }
            k = k1 + k2
            return 0 if d.sum <= k
            cut = lambda { |t| d.sum { |x| x > t ? x - t : 0 } }
            lo = 0
            hi = d.max
            while lo < hi
              mid = (lo + hi) / 2
              if cut.call(mid) <= k
                hi = mid
              else
                lo = mid + 1
              end
            end
            level = lo
            rem = k - cut.call(level)
            at = d.count { |x| x >= level }
            res = d.sum { |x| x < level ? x * x : 0 }
            res + (at - rem) * level * level + rem * (level - 1) * (level - 1)
          end
        `,
      },
    };
  })(),

  // ── Find Building Where Alice and Bob Can Meet (LC 2940) ────────
  (() => {
    const ref = (heights: number[], queries: number[][]) => queries.map(([x, y]) => {
      const reach = (from: number, to: number) => from === to || (from < to && heights[from] < heights[to]);
      for (let j = 0; j < heights.length; j++) if (reach(x, j) && reach(y, j)) return j;
      return -1;
    });
    return {
      slug: "find-building-where-alice-and-bob-can-meet",
      title: "Find Building Where Alice and Bob Can Meet",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Monotonic Stack", "Heap (Priority Queue)", "Google", "Amazon"],
      signature: {
        funcName: "leftmostBuildingQueries",
        params: [{ name: "heights", type: "int[]" as const }, { name: "queries", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "Buildings stand in a row with heights `heights[0..n-1]`. A person in building `i` can move to building `j` only if `i < j` **and** `heights[i] < heights[j]`; staying put is always allowed.\n\nEach query `queries[t] = [a, b]` places Alice in building `a` and Bob in building `b`. Find the **leftmost** building where both of them can be — each reaching it in at most one move from their start.\n\nReturn an array whose `t`-th entry is that building's index, or `-1` if no building works.",
        [
          { in: "heights = [3,1,4,1,5], queries = [[0,1],[1,2],[3,3],[2,0],[4,2]]", out: "[2,2,3,2,4]", note: "For [0,1] both can move to building 2 (height 4); for [2,0] Alice is already where Bob can climb to." },
          { in: "heights = [6,4,8,5,2,7], queries = [[0,1],[0,3],[2,4],[3,4],[2,2]]", out: "[2,5,-1,5,2]", note: "For [2,4] nothing to the right of building 4 is taller than 8." },
        ],
        ["1 <= heights.length <= 5 * 10^4", "1 <= heights[i] <= 10^9", "1 <= queries.length <= 5 * 10^4", "queries[t] = [a, b]", "0 <= a, b <= heights.length - 1"]),
      hints: [
        "Order each query so that `a <= b`. If `a == b`, or the person on the left is shorter than the building on the right, the answer is simply `b`.",
        "Otherwise both must move to some `j > b` taller than `heights[a]` (which is at least `heights[b]`) — the answer is the leftmost such `j`.",
        "Answer those queries offline from right to left: keep a monotonic stack of indices to the right of `b` whose heights are prefix maxima, and binary-search it for the nearest one taller than `heights[a]`.",
      ],
      editorial: explain({
        idea: "After sorting each pair so `a < b`, the hard case asks for the leftmost index after `b` whose height exceeds `heights[a]`. Sweeping from the right while maintaining a monotonic stack makes those candidates sorted by both index and height, so each query is one binary search.",
        steps: [
          "For each query, let `a = min`, `b = max`. If `a == b` or `heights[a] < heights[b]`, the answer is `b`. Otherwise file the query under index `b` with threshold `v = heights[a]`.",
          "Walk `i` from `n - 1` down to 0. First answer the queries filed under `i`, then push `i` after popping every stack index whose height is `<= heights[i]`.",
          "The stack (bottom to top) holds indices with strictly decreasing heights and decreasing positions; the leftmost index taller than `v` is the topmost entry whose height is `> v`. Binary-search the boundary; if no entry is taller, the answer is `-1`.",
        ],
        why: "When queries at `i` are answered, the stack holds exactly the indices `j > i` that are taller than everything between `i + 1` and `j - 1` — the running maxima seen from `i`. The first index after `i` that exceeds `v` is necessarily one of these running maxima, and because heights fall towards the top of the stack, the entries taller than `v` form a contiguous block at the bottom whose last element is the leftmost such index.",
        time: "O((n + q) log n)",
        space: "O(n + q)",
        pitfalls: [
          "Normalise every query to `a <= b` first — queries may list Bob before Alice.",
          "Equal heights do not allow a move: the target must be strictly taller than both.",
          "When `heights[a] < heights[b]`, building `b` itself is the answer; no search is needed.",
        ],
      }),
      examples: [
        { input: "[3,1,4,1,5]\n[[0,1],[1,2],[3,3],[2,0],[4,2]]", expectedOutput: "[2,2,3,2,4]" },
        { input: "[6,4,8,5,2,7]\n[[0,1],[0,3],[2,4],[3,4],[2,2]]", expectedOutput: "[2,5,-1,5,2]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 6, 25]));
        const span = pick(rng, [3, 20, 1000000000]);
        const heights = Array.from({ length: n }, () => ri(rng, 1, span));
        if (rng() < 0.1) heights.sort((a, b) => b - a);
        const queries = Array.from({ length: ri(rng, 1, pick(rng, [1, 6, 25])) }, () => [ri(rng, 0, n - 1), ri(rng, 0, n - 1)]);
        return { input: `${fmtIntArr(heights)}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(heights, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def leftmostBuildingQueries(heights: List[int], queries: List[List[int]]) -> List[int]:
              n = len(heights)
              res = [-1] * len(queries)
              pending = [[] for _ in range(n)]
              for qi, (x, y) in enumerate(queries):
                  a, b = min(x, y), max(x, y)
                  if a == b or heights[a] < heights[b]:
                      res[qi] = b
                  else:
                      pending[b].append((heights[a], qi))
              st = []
              for i in range(n - 1, -1, -1):
                  for v, qi in pending[i]:
                      lo, hi = 0, len(st)
                      while lo < hi:
                          mid = (lo + hi) // 2
                          if heights[st[mid]] > v:
                              lo = mid + 1
                          else:
                              hi = mid
                      res[qi] = st[lo - 1] if lo > 0 else -1
                  while st and heights[st[-1]] <= heights[i]:
                      st.pop()
                  st.append(i)
              return res
        `,
        javascript: code`
          var leftmostBuildingQueries = function(heights, queries) {
              var n = heights.length;
              var res = new Array(queries.length).fill(-1);
              var pending = [];
              for (var i = 0; i < n; i++) pending.push([]);
              for (var q = 0; q < queries.length; q++) {
                  var a = Math.min(queries[q][0], queries[q][1]);
                  var b = Math.max(queries[q][0], queries[q][1]);
                  if (a === b || heights[a] < heights[b]) res[q] = b;
                  else pending[b].push(q);
              }
              var st = [];
              for (var j = n - 1; j >= 0; j--) {
                  var list = pending[j];
                  for (var t = 0; t < list.length; t++) {
                      var qi = list[t];
                      var v = heights[Math.min(queries[qi][0], queries[qi][1])];
                      var lo = 0, hi = st.length;
                      while (lo < hi) {
                          var mid = (lo + hi) >> 1;
                          if (heights[st[mid]] > v) lo = mid + 1; else hi = mid;
                      }
                      res[qi] = lo > 0 ? st[lo - 1] : -1;
                  }
                  while (st.length > 0 && heights[st[st.length - 1]] <= heights[j]) st.pop();
                  st.push(j);
              }
              return res;
          };
        `,
        typescript: code`
          function leftmostBuildingQueries(heights: number[], queries: number[][]): number[] {
              var n = heights.length;
              var res: number[] = [];
              for (var z = 0; z < queries.length; z++) res.push(-1);
              var pending: number[][] = [];
              for (var i = 0; i < n; i++) pending.push([]);
              for (var q = 0; q < queries.length; q++) {
                  var a = Math.min(queries[q][0], queries[q][1]);
                  var b = Math.max(queries[q][0], queries[q][1]);
                  if (a === b || heights[a] < heights[b]) res[q] = b;
                  else pending[b].push(q);
              }
              var st: number[] = [];
              for (var j = n - 1; j >= 0; j--) {
                  var list = pending[j];
                  for (var t = 0; t < list.length; t++) {
                      var qi = list[t];
                      var v = heights[Math.min(queries[qi][0], queries[qi][1])];
                      var lo = 0, hi = st.length;
                      while (lo < hi) {
                          var mid = (lo + hi) >> 1;
                          if (heights[st[mid]] > v) lo = mid + 1; else hi = mid;
                      }
                      res[qi] = lo > 0 ? st[lo - 1] : -1;
                  }
                  while (st.length > 0 && heights[st[st.length - 1]] <= heights[j]) st.pop();
                  st.push(j);
              }
              return res;
          }
        `,
        java: code`
          public static int[] leftmostBuildingQueries(int[] heights, int[][] queries) {
              int n = heights.length, qn = queries.length;
              int[] res = new int[qn];
              Arrays.fill(res, -1);
              List<List<Integer>> pending = new ArrayList<>();
              for (int i = 0; i < n; i++) pending.add(new ArrayList<>());
              for (int q = 0; q < qn; q++) {
                  int a = Math.min(queries[q][0], queries[q][1]);
                  int b = Math.max(queries[q][0], queries[q][1]);
                  if (a == b || heights[a] < heights[b]) res[q] = b;
                  else pending.get(b).add(q);
              }
              int[] st = new int[n];
              int top = 0;
              for (int j = n - 1; j >= 0; j--) {
                  for (int qi : pending.get(j)) {
                      int v = heights[Math.min(queries[qi][0], queries[qi][1])];
                      int lo = 0, hi = top;
                      while (lo < hi) {
                          int mid = (lo + hi) >>> 1;
                          if (heights[st[mid]] > v) lo = mid + 1; else hi = mid;
                      }
                      res[qi] = lo > 0 ? st[lo - 1] : -1;
                  }
                  while (top > 0 && heights[st[top - 1]] <= heights[j]) top--;
                  st[top++] = j;
              }
              return res;
          }
        `,
        cpp: code`
          vector<int> leftmostBuildingQueries(vector<int>& heights, vector<vector<int>>& queries) {
              int n = heights.size(), qn = queries.size();
              vector<int> res(qn, -1);
              vector<vector<int>> pending(n);
              for (int q = 0; q < qn; q++) {
                  int a = min(queries[q][0], queries[q][1]);
                  int b = max(queries[q][0], queries[q][1]);
                  if (a == b || heights[a] < heights[b]) res[q] = b;
                  else pending[b].push_back(q);
              }
              vector<int> st;
              for (int j = n - 1; j >= 0; j--) {
                  for (int qi : pending[j]) {
                      int v = heights[min(queries[qi][0], queries[qi][1])];
                      int lo = 0, hi = st.size();
                      while (lo < hi) {
                          int mid = (lo + hi) / 2;
                          if (heights[st[mid]] > v) lo = mid + 1; else hi = mid;
                      }
                      res[qi] = lo > 0 ? st[lo - 1] : -1;
                  }
                  while (!st.empty() && heights[st.back()] <= heights[j]) st.pop_back();
                  st.push_back(j);
              }
              return res;
          }
        `,
        c: code`
          int* leftmostBuildingQueries(int* heights, int heightsSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int n = heightsSize, qn = queriesSize;
              int* res = (int*)malloc(sizeof(int) * (qn > 0 ? qn : 1));
              int* head = (int*)malloc(sizeof(int) * n);
              int* nextQ = (int*)malloc(sizeof(int) * (qn > 0 ? qn : 1));
              for (int i = 0; i < n; i++) head[i] = -1;
              for (int q = 0; q < qn; q++) {
                  int x = queries[q][0], y = queries[q][1];
                  int a = x < y ? x : y, b = x < y ? y : x;
                  res[q] = -1;
                  if (a == b || heights[a] < heights[b]) {
                      res[q] = b;
                  } else {
                      nextQ[q] = head[b];
                      head[b] = q;
                  }
              }
              int* st = (int*)malloc(sizeof(int) * n);
              int top = 0;
              for (int j = n - 1; j >= 0; j--) {
                  for (int qi = head[j]; qi != -1; qi = nextQ[qi]) {
                      int x = queries[qi][0], y = queries[qi][1];
                      int v = heights[x < y ? x : y];
                      int lo = 0, hi = top;
                      while (lo < hi) {
                          int mid = lo + (hi - lo) / 2;
                          if (heights[st[mid]] > v) lo = mid + 1; else hi = mid;
                      }
                      res[qi] = lo > 0 ? st[lo - 1] : -1;
                  }
                  while (top > 0 && heights[st[top - 1]] <= heights[j]) top--;
                  st[top++] = j;
              }
              free(head);
              free(nextQ);
              free(st);
              *returnSize = qn;
              return res;
          }
        `,
        csharp: code`
          public static int[] LeftmostBuildingQueries(int[] heights, int[][] queries)
          {
              int n = heights.Length, qn = queries.Length;
              int[] res = new int[qn];
              var pending = new List<int>[n];
              for (int i = 0; i < n; i++) pending[i] = new List<int>();
              for (int q = 0; q < qn; q++)
              {
                  res[q] = -1;
                  int a = Math.Min(queries[q][0], queries[q][1]);
                  int b = Math.Max(queries[q][0], queries[q][1]);
                  if (a == b || heights[a] < heights[b]) res[q] = b;
                  else pending[b].Add(q);
              }
              int[] st = new int[n];
              int top = 0;
              for (int j = n - 1; j >= 0; j--)
              {
                  foreach (int qi in pending[j])
                  {
                      int v = heights[Math.Min(queries[qi][0], queries[qi][1])];
                      int lo = 0, hi = top;
                      while (lo < hi)
                      {
                          int mid = lo + (hi - lo) / 2;
                          if (heights[st[mid]] > v) lo = mid + 1; else hi = mid;
                      }
                      res[qi] = lo > 0 ? st[lo - 1] : -1;
                  }
                  while (top > 0 && heights[st[top - 1]] <= heights[j]) top--;
                  st[top++] = j;
              }
              return res;
          }
        `,
        go: code`
          func leftmostBuildingQueries(heights []int, queries [][]int) []int {
              n := len(heights)
              res := make([]int, len(queries))
              pending := make([][]int, n)
              for q, qr := range queries {
                  a, b := qr[0], qr[1]
                  if a > b {
                      a, b = b, a
                  }
                  res[q] = -1
                  if a == b || heights[a] < heights[b] {
                      res[q] = b
                  } else {
                      pending[b] = append(pending[b], q)
                  }
              }
              st := []int{}
              for j := n - 1; j >= 0; j-- {
                  for _, qi := range pending[j] {
                      a := queries[qi][0]
                      if queries[qi][1] < a {
                          a = queries[qi][1]
                      }
                      v := heights[a]
                      lo, hi := 0, len(st)
                      for lo < hi {
                          mid := (lo + hi) / 2
                          if heights[st[mid]] > v {
                              lo = mid + 1
                          } else {
                              hi = mid
                          }
                      }
                      if lo > 0 {
                          res[qi] = st[lo-1]
                      } else {
                          res[qi] = -1
                      }
                  }
                  for len(st) > 0 && heights[st[len(st)-1]] <= heights[j] {
                      st = st[:len(st)-1]
                  }
                  st = append(st, j)
              }
              return res
          }
        `,
        kotlin: code`
          fun leftmostBuildingQueries(heights: IntArray, queries: Array<IntArray>): IntArray {
              val n = heights.size
              val res = IntArray(queries.size) { -1 }
              val pending = Array(n) { ArrayList<Int>() }
              for (q in queries.indices) {
                  val a = minOf(queries[q][0], queries[q][1])
                  val b = maxOf(queries[q][0], queries[q][1])
                  if (a == b || heights[a] < heights[b]) res[q] = b else pending[b].add(q)
              }
              val st = IntArray(n)
              var top = 0
              for (j in n - 1 downTo 0) {
                  for (qi in pending[j]) {
                      val v = heights[minOf(queries[qi][0], queries[qi][1])]
                      var lo = 0
                      var hi = top
                      while (lo < hi) {
                          val mid = (lo + hi) / 2
                          if (heights[st[mid]] > v) lo = mid + 1 else hi = mid
                      }
                      res[qi] = if (lo > 0) st[lo - 1] else -1
                  }
                  while (top > 0 && heights[st[top - 1]] <= heights[j]) top--
                  st[top++] = j
              }
              return res
          }
        `,
        swift: code`
          func leftmostBuildingQueries(_ heights: [Int], _ queries: [[Int]]) -> [Int] {
              let n = heights.count
              var res = Array(repeating: -1, count: queries.count)
              var pending = Array(repeating: [Int](), count: n)
              for q in 0..<queries.count {
                  let a = min(queries[q][0], queries[q][1])
                  let b = max(queries[q][0], queries[q][1])
                  if a == b || heights[a] < heights[b] { res[q] = b } else { pending[b].append(q) }
              }
              var st = [Int]()
              var j = n - 1
              while j >= 0 {
                  for qi in pending[j] {
                      let v = heights[min(queries[qi][0], queries[qi][1])]
                      var lo = 0
                      var hi = st.count
                      while lo < hi {
                          let mid = (lo + hi) / 2
                          if heights[st[mid]] > v { lo = mid + 1 } else { hi = mid }
                      }
                      res[qi] = lo > 0 ? st[lo - 1] : -1
                  }
                  while let last = st.last, heights[last] <= heights[j] { st.removeLast() }
                  st.append(j)
                  j -= 1
              }
              return res
          }
        `,
        rust: code`
          fn leftmostBuildingQueries(heights: Vec<i32>, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let n = heights.len();
              let mut res = vec![-1i32; queries.len()];
              let mut pending: Vec<Vec<usize>> = vec![Vec::new(); n];
              for (q, qr) in queries.iter().enumerate() {
                  let a = std::cmp::min(qr[0], qr[1]) as usize;
                  let b = std::cmp::max(qr[0], qr[1]) as usize;
                  if a == b || heights[a] < heights[b] {
                      res[q] = b as i32;
                  } else {
                      pending[b].push(q);
                  }
              }
              let mut st: Vec<usize> = Vec::new();
              for j in (0..n).rev() {
                  for &qi in pending[j].iter() {
                      let a = std::cmp::min(queries[qi][0], queries[qi][1]) as usize;
                      let v = heights[a];
                      let mut lo = 0usize;
                      let mut hi = st.len();
                      while lo < hi {
                          let mid = (lo + hi) / 2;
                          if heights[st[mid]] > v { lo = mid + 1; } else { hi = mid; }
                      }
                      res[qi] = if lo > 0 { st[lo - 1] as i32 } else { -1 };
                  }
                  while let Some(&last) = st.last() {
                      if heights[last] <= heights[j] { st.pop(); } else { break; }
                  }
                  st.push(j);
              }
              res
          }
        `,
        php: code`
          function leftmostBuildingQueries($heights, $queries) {
              $n = count($heights);
              $qn = count($queries);
              $res = array_fill(0, $qn, -1);
              $pending = array_fill(0, $n, []);
              for ($q = 0; $q < $qn; $q++) {
                  $a = min($queries[$q][0], $queries[$q][1]);
                  $b = max($queries[$q][0], $queries[$q][1]);
                  if ($a == $b || $heights[$a] < $heights[$b]) $res[$q] = $b;
                  else $pending[$b][] = $q;
              }
              $st = [];
              $top = 0;
              for ($j = $n - 1; $j >= 0; $j--) {
                  foreach ($pending[$j] as $qi) {
                      $v = $heights[min($queries[$qi][0], $queries[$qi][1])];
                      $lo = 0;
                      $hi = $top;
                      while ($lo < $hi) {
                          $mid = intdiv($lo + $hi, 2);
                          if ($heights[$st[$mid]] > $v) $lo = $mid + 1; else $hi = $mid;
                      }
                      $res[$qi] = $lo > 0 ? $st[$lo - 1] : -1;
                  }
                  while ($top > 0 && $heights[$st[$top - 1]] <= $heights[$j]) $top--;
                  $st[$top] = $j;
                  $top++;
              }
              return $res;
          }
        `,
        ruby: code`
          def leftmostBuildingQueries(heights, queries)
            n = heights.length
            res = Array.new(queries.length, -1)
            pending = Array.new(n) { [] }
            queries.each_with_index do |qr, q|
              a, b = qr.minmax
              if a == b || heights[a] < heights[b]
                res[q] = b
              else
                pending[b] << q
              end
            end
            st = []
            (n - 1).downto(0) do |j|
              pending[j].each do |qi|
                v = heights[queries[qi].min]
                lo = 0
                hi = st.length
                while lo < hi
                  mid = (lo + hi) / 2
                  if heights[st[mid]] > v
                    lo = mid + 1
                  else
                    hi = mid
                  end
                end
                res[qi] = lo > 0 ? st[lo - 1] : -1
              end
              st.pop while !st.empty? && heights[st[-1]] <= heights[j]
              st << j
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Minimum Absolute Difference Between Elements With Constraint (LC 2817) ──
  (() => {
    const ref = (nums: number[], x: number) => {
      let best = Infinity;
      for (let i = 0; i < nums.length; i++)
        for (let j = i + x; j < nums.length; j++) best = Math.min(best, Math.abs(nums[i] - nums[j]));
      return best;
    };
    return {
      slug: "minimum-absolute-difference-between-elements-with-constraint",
      title: "Minimum Absolute Difference Between Elements With Constraint",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Ordered Set", "Binary Indexed Tree", "Google", "Amazon"],
      signature: {
        funcName: "minAbsoluteDifference",
        params: [{ name: "nums", type: "int[]" as const }, { name: "x", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given an array `nums` and an integer `x`, consider every pair of indices `i` and `j` that are **at least `x` apart**, i.e. `|i - j| >= x`.\n\nReturn the smallest value of `|nums[i] - nums[j]|` over all such pairs. (When `x` is 0 an index may be paired with itself, so the answer is 0.)",
        [
          { in: "nums = [9,2,6,11], x = 2", out: "2", note: "Indices 0 and 3 hold 9 and 11, three apart; indices 0 and 2 give 3." },
          { in: "nums = [5,3,2,10,15], x = 1", out: "1", note: "Neighbours 3 and 2 differ by 1." },
          { in: "nums = [1,2,3,4], x = 3", out: "3", note: "Only indices 0 and 3 are far enough apart." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^9", "0 <= x < nums.length"]),
      hints: [
        "Fix the right index `j`. Its valid partners on the left are exactly `nums[0..j-x]` — a prefix that grows by one element as `j` moves right.",
        "Among the values in that prefix, only the closest one below `nums[j]` and the closest one above it can give the minimum.",
        "Keep the prefix in a sorted structure (an ordered set, or a Fenwick tree over compressed values) and look up the predecessor and successor of `nums[j]`.",
      ],
      editorial: explain({
        idea: "Sweep `j` from `x` to `n - 1`, adding `nums[j - x]` to a sorted collection just before handling `j`. The collection then holds exactly the elements far enough to the left, and the best partner for `nums[j]` is its predecessor or successor there.",
        steps: [
          "For `j = x, x + 1, …, n - 1`: insert `nums[j - x]` into a sorted multiset.",
          "Find the largest stored value `<= nums[j]` and the smallest stored value `>= nums[j]` (binary search / ordered-set floor and ceiling).",
          "Update the answer with the distances to both; stop early if it reaches 0.",
          "Without a built-in ordered set, compress the values and use a Fenwick tree: count the stored values `<= nums[j]`, then find the `c`-th and `(c + 1)`-th smallest with a Fenwick descent.",
        ],
        why: "Every valid pair has a right end `j` and a left end `i <= j - x`, so considering each `j` against the whole prefix `0..j-x` covers all pairs (pairs are unordered, so the mirrored case adds nothing). For a fixed `nums[j]`, the closest value in a set is always its floor or its ceiling.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Insert `nums[j - x]` before querying `nums[j]` — with `x = 0` that pairs an index with itself and correctly yields 0.",
          "A plain sorted array with insertions is O(n²) in the worst case; use a balanced tree or a Fenwick tree for 10^5 elements.",
          "Look at both neighbours, not just the floor.",
        ],
      }),
      examples: [
        { input: "[9,2,6,11]\n2", expectedOutput: "2" },
        { input: "[5,3,2,10,15]\n1", expectedOutput: "1" },
        { input: "[1,2,3,4]\n3", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.05 ? 1 : ri(rng, 2, pick(rng, [3, 8, 30]));
        const span = pick(rng, [30, 1000, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, span));
        const x = n === 1 || rng() < 0.08 ? 0 : pick(rng, [1, ri(rng, 1, n - 1), ri(rng, 1, n - 1), n - 1]);
        return { input: `${fmtIntArr(nums)}\n${x}`, expectedOutput: String(ref(nums, x)) };
      },
      solutions: {
        python: code`
          from typing import List
          import bisect

          def minAbsoluteDifference(nums: List[int], x: int) -> int:
              seen = []
              best = 1 << 31
              for j in range(x, len(nums)):
                  bisect.insort(seen, nums[j - x])
                  v = nums[j]
                  k = bisect.bisect_left(seen, v)
                  if k < len(seen):
                      best = min(best, seen[k] - v)
                  if k > 0:
                      best = min(best, v - seen[k - 1])
                  if best == 0:
                      break
              return best
        `,
        javascript: code`
          var minAbsoluteDifference = function(nums, x) {
              var n = nums.length;
              var sorted = nums.slice().sort(function(a, b) { return a - b; });
              var vals = [];
              for (var i = 0; i < n; i++) if (i === 0 || sorted[i] !== sorted[i - 1]) vals.push(sorted[i]);
              var m = vals.length;
              var tree = new Array(m + 1).fill(0);
              var step = 1;
              while (step * 2 <= m) step *= 2;
              var rankOf = function(v) {
                  var lo = 0, hi = m;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (vals[mid] < v) lo = mid + 1; else hi = mid;
                  }
                  return lo + 1;
              };
              var kth = function(k) {
                  var pos = 0;
                  for (var s = step; s > 0; s >>= 1) {
                      if (pos + s <= m && tree[pos + s] < k) { pos += s; k -= tree[pos]; }
                  }
                  return pos + 1;
              };
              var best = 2147483647, inserted = 0;
              for (var j = x; j < n && best > 0; j++) {
                  for (var p = rankOf(nums[j - x]); p <= m; p += p & -p) tree[p]++;
                  inserted++;
                  var v = nums[j], c = 0;
                  for (var q = rankOf(v); q > 0; q -= q & -q) c += tree[q];
                  if (c > 0) {
                      var below = vals[kth(c) - 1];
                      if (v - below < best) best = v - below;
                  }
                  if (c < inserted) {
                      var above = vals[kth(c + 1) - 1];
                      if (above - v < best) best = above - v;
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function minAbsoluteDifference(nums: number[], x: number): number {
              var n = nums.length;
              var sorted: number[] = nums.slice();
              sorted.sort(function(a, b) { return a - b; });
              var vals: number[] = [];
              for (var i = 0; i < n; i++) if (i === 0 || sorted[i] !== sorted[i - 1]) vals.push(sorted[i]);
              var m = vals.length;
              var tree: number[] = [];
              for (var z = 0; z <= m; z++) tree.push(0);
              var step = 1;
              while (step * 2 <= m) step *= 2;
              var rankOf = function(v: number): number {
                  var lo = 0, hi = m;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (vals[mid] < v) lo = mid + 1; else hi = mid;
                  }
                  return lo + 1;
              };
              var kth = function(k: number): number {
                  var pos = 0;
                  for (var s = step; s > 0; s >>= 1) {
                      if (pos + s <= m && tree[pos + s] < k) { pos += s; k -= tree[pos]; }
                  }
                  return pos + 1;
              };
              var best = 2147483647, inserted = 0;
              for (var j = x; j < n && best > 0; j++) {
                  for (var p = rankOf(nums[j - x]); p <= m; p += p & -p) tree[p]++;
                  inserted++;
                  var v = nums[j], c = 0;
                  for (var q = rankOf(v); q > 0; q -= q & -q) c += tree[q];
                  if (c > 0) {
                      var below = vals[kth(c) - 1];
                      if (v - below < best) best = v - below;
                  }
                  if (c < inserted) {
                      var above = vals[kth(c + 1) - 1];
                      if (above - v < best) best = above - v;
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int minAbsoluteDifference(int[] nums, int x) {
              TreeSet<Integer> seen = new TreeSet<>();
              int best = Integer.MAX_VALUE;
              for (int j = x; j < nums.length && best > 0; j++) {
                  seen.add(nums[j - x]);
                  int v = nums[j];
                  Integer below = seen.floor(v), above = seen.ceiling(v);
                  if (below != null) best = Math.min(best, v - below);
                  if (above != null) best = Math.min(best, above - v);
              }
              return best;
          }
        `,
        cpp: code`
          int minAbsoluteDifference(vector<int>& nums, int x) {
              set<int> seen;
              int best = INT_MAX;
              for (int j = x; j < (int)nums.size() && best > 0; j++) {
                  seen.insert(nums[j - x]);
                  int v = nums[j];
                  auto it = seen.lower_bound(v);
                  if (it != seen.end()) best = min(best, *it - v);
                  if (it != seen.begin()) best = min(best, v - *prev(it));
              }
              return best;
          }
        `,
        c: code`
          static int madCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          static int madRank(int* vals, int m, int v) {
              int lo = 0, hi = m;
              while (lo < hi) {
                  int mid = lo + (hi - lo) / 2;
                  if (vals[mid] < v) lo = mid + 1; else hi = mid;
              }
              return lo + 1;
          }

          static int madKth(int* tree, int m, int step, int k) {
              int pos = 0;
              for (int s = step; s > 0; s >>= 1) {
                  if (pos + s <= m && tree[pos + s] < k) { pos += s; k -= tree[pos]; }
              }
              return pos + 1;
          }

          int minAbsoluteDifference(int* nums, int numsSize, int x) {
              int n = numsSize;
              int* vals = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) vals[i] = nums[i];
              qsort(vals, n, sizeof(int), madCmp);
              int m = 0;
              for (int i = 0; i < n; i++) if (i == 0 || vals[i] != vals[i - 1]) vals[m++] = vals[i];
              int* tree = (int*)calloc(m + 1, sizeof(int));
              int step = 1;
              while (step * 2 <= m) step *= 2;
              int best = 2147483647, inserted = 0;
              for (int j = x; j < n && best > 0; j++) {
                  for (int p = madRank(vals, m, nums[j - x]); p <= m; p += p & -p) tree[p]++;
                  inserted++;
                  int v = nums[j], c = 0;
                  for (int q = madRank(vals, m, v); q > 0; q -= q & -q) c += tree[q];
                  if (c > 0) {
                      int below = vals[madKth(tree, m, step, c) - 1];
                      if (v - below < best) best = v - below;
                  }
                  if (c < inserted) {
                      int above = vals[madKth(tree, m, step, c + 1) - 1];
                      if (above - v < best) best = above - v;
                  }
              }
              free(vals);
              free(tree);
              return best;
          }
        `,
        csharp: code`
          public static int MinAbsoluteDifference(int[] nums, int x)
          {
              int n = nums.Length;
              int[] vals = nums.Distinct().OrderBy(v => v).ToArray();
              int m = vals.Length;
              int[] tree = new int[m + 1];
              int step = 1;
              while (step * 2 <= m) step *= 2;
              int best = int.MaxValue, inserted = 0;
              for (int j = x; j < n && best > 0; j++)
              {
                  for (int p = Array.BinarySearch(vals, nums[j - x]) + 1; p <= m; p += p & -p) tree[p]++;
                  inserted++;
                  int v = nums[j], c = 0;
                  for (int q = Array.BinarySearch(vals, v) + 1; q > 0; q -= q & -q) c += tree[q];
                  if (c > 0)
                  {
                      int below = vals[FenwickKth(tree, m, step, c) - 1];
                      best = Math.Min(best, v - below);
                  }
                  if (c < inserted)
                  {
                      int above = vals[FenwickKth(tree, m, step, c + 1) - 1];
                      best = Math.Min(best, above - v);
                  }
              }
              return best;
          }

          static int FenwickKth(int[] tree, int m, int step, int k)
          {
              int pos = 0;
              for (int s = step; s > 0; s >>= 1)
              {
                  if (pos + s <= m && tree[pos + s] < k) { pos += s; k -= tree[pos]; }
              }
              return pos + 1;
          }
        `,
        go: code`
          func minAbsoluteDifference(nums []int, x int) int {
              n := len(nums)
              sorted := make([]int, n)
              copy(sorted, nums)
              sort.Ints(sorted)
              vals := []int{}
              for i, v := range sorted {
                  if i == 0 || v != sorted[i-1] {
                      vals = append(vals, v)
                  }
              }
              m := len(vals)
              tree := make([]int, m+1)
              step := 1
              for step*2 <= m {
                  step *= 2
              }
              kth := func(k int) int {
                  pos := 0
                  for s := step; s > 0; s >>= 1 {
                      if pos+s <= m && tree[pos+s] < k {
                          pos += s
                          k -= tree[pos]
                      }
                  }
                  return pos + 1
              }
              best, inserted := 1<<40, 0
              for j := x; j < n && best > 0; j++ {
                  for p := sort.SearchInts(vals, nums[j-x]) + 1; p <= m; p += p & -p {
                      tree[p]++
                  }
                  inserted++
                  v, c := nums[j], 0
                  for q := sort.SearchInts(vals, v) + 1; q > 0; q -= q & -q {
                      c += tree[q]
                  }
                  if c > 0 {
                      if d := v - vals[kth(c)-1]; d < best {
                          best = d
                      }
                  }
                  if c < inserted {
                      if d := vals[kth(c+1)-1] - v; d < best {
                          best = d
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun minAbsoluteDifference(nums: IntArray, x: Int): Int {
              val seen = java.util.TreeSet<Int>()
              var best = Int.MAX_VALUE
              var j = x
              while (j < nums.size && best > 0) {
                  seen.add(nums[j - x])
                  val v = nums[j]
                  val below = seen.floor(v)
                  val above = seen.ceiling(v)
                  if (below != null) best = minOf(best, v - below)
                  if (above != null) best = minOf(best, above - v)
                  j++
              }
              return best
          }
        `,
        swift: code`
          func minAbsoluteDifference(_ nums: [Int], _ x: Int) -> Int {
              let n = nums.count
              let sorted = nums.sorted()
              var vals = [Int]()
              for i in 0..<n where i == 0 || sorted[i] != sorted[i - 1] { vals.append(sorted[i]) }
              let m = vals.count
              var tree = Array(repeating: 0, count: m + 1)
              var step = 1
              while step * 2 <= m { step *= 2 }
              func rankOf(_ v: Int) -> Int {
                  var lo = 0
                  var hi = m
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if vals[mid] < v { lo = mid + 1 } else { hi = mid }
                  }
                  return lo + 1
              }
              func kth(_ target: Int) -> Int {
                  var k = target
                  var pos = 0
                  var s = step
                  while s > 0 {
                      if pos + s <= m && tree[pos + s] < k {
                          pos += s
                          k -= tree[pos]
                      }
                      s >>= 1
                  }
                  return pos + 1
              }
              var best = Int.max
              var inserted = 0
              var j = x
              while j < n && best > 0 {
                  var p = rankOf(nums[j - x])
                  while p <= m {
                      tree[p] += 1
                      p += p & -p
                  }
                  inserted += 1
                  let v = nums[j]
                  var c = 0
                  var q = rankOf(v)
                  while q > 0 {
                      c += tree[q]
                      q -= q & -q
                  }
                  if c > 0 { best = min(best, v - vals[kth(c) - 1]) }
                  if c < inserted { best = min(best, vals[kth(c + 1) - 1] - v) }
                  j += 1
              }
              return best
          }
        `,
        rust: code`
          use std::collections::BTreeSet;

          fn minAbsoluteDifference(nums: Vec<i32>, x: i32) -> i32 {
              let x = x as usize;
              let mut seen: BTreeSet<i32> = BTreeSet::new();
              let mut best = std::i32::MAX;
              for j in x..nums.len() {
                  seen.insert(nums[j - x]);
                  let v = nums[j];
                  if let Some(&below) = seen.range(..=v).next_back() {
                      if v - below < best { best = v - below; }
                  }
                  if let Some(&above) = seen.range(v..).next() {
                      if above - v < best { best = above - v; }
                  }
                  if best == 0 { break; }
              }
              best
          }
        `,
        php: code`
          function madRankOf($vals, $v) {
              $lo = 0;
              $hi = count($vals);
              while ($lo < $hi) {
                  $mid = intdiv($lo + $hi, 2);
                  if ($vals[$mid] < $v) $lo = $mid + 1; else $hi = $mid;
              }
              return $lo + 1;
          }

          function madKthOf($tree, $m, $step, $k) {
              $pos = 0;
              for ($s = $step; $s > 0; $s >>= 1) {
                  if ($pos + $s <= $m && $tree[$pos + $s] < $k) { $pos += $s; $k -= $tree[$pos]; }
              }
              return $pos + 1;
          }

          function minAbsoluteDifference($nums, $x) {
              $n = count($nums);
              $vals = array_values(array_unique($nums));
              sort($vals);
              $m = count($vals);
              $tree = array_fill(0, $m + 1, 0);
              $step = 1;
              while ($step * 2 <= $m) $step *= 2;
              $best = PHP_INT_MAX;
              $inserted = 0;
              for ($j = $x; $j < $n && $best > 0; $j++) {
                  for ($p = madRankOf($vals, $nums[$j - $x]); $p <= $m; $p += $p & -$p) $tree[$p]++;
                  $inserted++;
                  $v = $nums[$j];
                  $c = 0;
                  for ($q = madRankOf($vals, $v); $q > 0; $q -= $q & -$q) $c += $tree[$q];
                  if ($c > 0) $best = min($best, $v - $vals[madKthOf($tree, $m, $step, $c) - 1]);
                  if ($c < $inserted) $best = min($best, $vals[madKthOf($tree, $m, $step, $c + 1) - 1] - $v);
              }
              return $best;
          }
        `,
        ruby: code`
          def minAbsoluteDifference(nums, x)
            seen = []
            best = 1 << 40
            (x...nums.length).each do |j|
              w = nums[j - x]
              pos = seen.bsearch_index { |e| e >= w } || seen.length
              seen.insert(pos, w)
              v = nums[j]
              k = seen.bsearch_index { |e| e >= v } || seen.length
              best = [best, seen[k] - v].min if k < seen.length
              best = [best, v - seen[k - 1]].min if k > 0
              break if best == 0
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Minimum Operations to Make a Subsequence (LC 1713) ──────────
  (() => {
    // Independent check: target - LCS(target, arr) by the quadratic DP.
    const ref = (target: number[], arr: number[]) => {
      const n = target.length, m = arr.length;
      const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
      for (let i = 1; i <= n; i++)
        for (let j = 1; j <= m; j++)
          dp[i][j] = target[i - 1] === arr[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
      return n - dp[n][m];
    };
    return {
      slug: "minimum-operations-to-make-a-subsequence",
      title: "Minimum Operations to Make a Subsequence",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Binary Search", "Greedy", "Google", "Amazon"],
      signature: {
        funcName: "minOperations",
        params: [{ name: "target", type: "int[]" as const }, { name: "arr", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "`target` holds **distinct** integers; `arr` is any integer array (it may repeat values).\n\nIn one operation you insert a single integer anywhere in `arr` (at the front, at the end, or between two elements).\n\nReturn the minimum number of operations needed so that `target` becomes a **subsequence** of `arr` — its elements appear in `arr` in the same order, not necessarily contiguously.",
        [
          { in: "target = [5,1,3], arr = [9,4,2,3,4]", out: "2", note: "Insert 5 and 1 before the 3: `[5,9,4,1,2,3,4]`." },
          { in: "target = [6,4,8,1,3,2], arr = [4,7,6,2,3,8,6,1]", out: "3" },
          { in: "target = [2,7], arr = [2,7,2]", out: "0" },
        ],
        ["1 <= target.length, arr.length <= 10^5", "1 <= target[i], arr[i] <= 10^9", "target contains no duplicates"]),
      hints: [
        "Whatever part of `target` already appears in order inside `arr` can stay; everything else must be inserted. So the answer is `target.length` minus the longest common subsequence.",
        "Because `target` is distinct, replace each element of `arr` by its position in `target` (dropping values not in `target`).",
        "A common subsequence is now a strictly increasing subsequence of those positions — find the longest one in `O(n log n)` with patience sorting and binary search.",
      ],
      editorial: explain({
        idea: "The answer is `|target| - LCS(target, arr)`. With distinct `target` values, the LCS equals the longest strictly increasing subsequence of the target-positions of `arr`'s elements, which the binary-search LIS computes in `O(m log m)`.",
        steps: [
          "Map every value of `target` to its index.",
          "Walk `arr`; skip values not in `target`, and turn the rest into their target indices.",
          "Maintain `tails`, where `tails[len - 1]` is the smallest possible last index of an increasing run of length `len`; for each index `p`, binary-search the first tail `>= p` and replace it (or append `p`).",
          "Return `target.length - tails.length`.",
        ],
        why: "Elements of `target` that are matched in order to elements of `arr` need no insertion, and the rest need exactly one each, so maximising the matched part is the whole problem. Matching in order means the chosen `arr` elements have strictly increasing target positions — the LIS. The `tails` array is sorted, and replacing the first tail `>= p` keeps each length's best ending, so its final length is the LIS length.",
        time: "O(n + m log m)",
        space: "O(n + m)",
        pitfalls: [
          "The quadratic LCS table is far too big for 10^5 × 10^5 — the distinctness of `target` is what makes the LIS reduction possible.",
          "Use strict increase (lower bound): a repeated value in `arr` maps to the same position and cannot be matched twice.",
          "Values of `arr` that are absent from `target` are simply ignored.",
        ],
      }),
      examples: [
        { input: "[5,1,3]\n[9,4,2,3,4]", expectedOutput: "2" },
        { input: "[6,4,8,1,3,2]\n[4,7,6,2,3,8,6,1]", expectedOutput: "3" },
        { input: "[2,7]\n[2,7,2]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.05 ? 1 : ri(rng, 2, pick(rng, [3, 8, 18]));
        const span = Math.max(n, pick(rng, [n, 2 * n, 50, 1000000000]));
        const set = new Set<number>();
        while (set.size < n) set.add(ri(rng, 1, span));
        const target = shuffle(rng, Array.from(set));
        const m = ri(rng, 1, pick(rng, [2, 8, 25]));
        const arr = Array.from({ length: m }, () => (rng() < 0.7 ? pick(rng, target) : ri(rng, 1, span)));
        return { input: `${fmtIntArr(target)}\n${fmtIntArr(arr)}`, expectedOutput: String(ref(target, arr)) };
      },
      solutions: {
        python: code`
          from typing import List
          import bisect

          def minOperations(target: List[int], arr: List[int]) -> int:
              pos = {v: i for i, v in enumerate(target)}
              tails = []
              for v in arr:
                  p = pos.get(v)
                  if p is None:
                      continue
                  k = bisect.bisect_left(tails, p)
                  if k == len(tails):
                      tails.append(p)
                  else:
                      tails[k] = p
              return len(target) - len(tails)
        `,
        javascript: code`
          var minOperations = function(target, arr) {
              var pos = new Map();
              for (var i = 0; i < target.length; i++) pos.set(target[i], i);
              var tails = [];
              for (var j = 0; j < arr.length; j++) {
                  var p = pos.get(arr[j]);
                  if (p === undefined) continue;
                  var lo = 0, hi = tails.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (tails[mid] < p) lo = mid + 1; else hi = mid;
                  }
                  if (lo === tails.length) tails.push(p); else tails[lo] = p;
              }
              return target.length - tails.length;
          };
        `,
        typescript: code`
          function minOperations(target: number[], arr: number[]): number {
              var pos: { [k: string]: number } = {};
              for (var i = 0; i < target.length; i++) pos["v" + target[i]] = i;
              var tails: number[] = [];
              for (var j = 0; j < arr.length; j++) {
                  var p = pos["v" + arr[j]];
                  if (p === undefined) continue;
                  var lo = 0, hi = tails.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (tails[mid] < p) lo = mid + 1; else hi = mid;
                  }
                  if (lo === tails.length) tails.push(p); else tails[lo] = p;
              }
              return target.length - tails.length;
          }
        `,
        java: code`
          public static int minOperations(int[] target, int[] arr) {
              Map<Integer, Integer> pos = new HashMap<>();
              for (int i = 0; i < target.length; i++) pos.put(target[i], i);
              int[] tails = new int[arr.length];
              int len = 0;
              for (int v : arr) {
                  Integer p = pos.get(v);
                  if (p == null) continue;
                  int lo = 0, hi = len;
                  while (lo < hi) {
                      int mid = (lo + hi) >>> 1;
                      if (tails[mid] < p) lo = mid + 1; else hi = mid;
                  }
                  tails[lo] = p;
                  if (lo == len) len++;
              }
              return target.length - len;
          }
        `,
        cpp: code`
          int minOperations(vector<int>& target, vector<int>& arr) {
              unordered_map<int, int> pos;
              for (int i = 0; i < (int)target.size(); i++) pos[target[i]] = i;
              vector<int> tails;
              for (int v : arr) {
                  auto f = pos.find(v);
                  if (f == pos.end()) continue;
                  int p = f->second;
                  auto it = lower_bound(tails.begin(), tails.end(), p);
                  if (it == tails.end()) tails.push_back(p); else *it = p;
              }
              return (int)target.size() - (int)tails.size();
          }
        `,
        c: code`
          static int* mosTarget;

          static int mosCmp(const void* a, const void* b) {
              int x = mosTarget[*(const int*)a], y = mosTarget[*(const int*)b];
              return (x > y) - (x < y);
          }

          int minOperations(int* target, int targetSize, int* arr, int arrSize) {
              int n = targetSize;
              int* order = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) order[i] = i;
              mosTarget = target;
              qsort(order, n, sizeof(int), mosCmp);
              int* tails = (int*)malloc(sizeof(int) * (arrSize > 0 ? arrSize : 1));
              int len = 0;
              for (int j = 0; j < arrSize; j++) {
                  int v = arr[j];
                  int lo = 0, hi = n;
                  while (lo < hi) {
                      int mid = lo + (hi - lo) / 2;
                      if (target[order[mid]] < v) lo = mid + 1; else hi = mid;
                  }
                  if (lo == n || target[order[lo]] != v) continue;
                  int p = order[lo];
                  int a = 0, b = len;
                  while (a < b) {
                      int mid = a + (b - a) / 2;
                      if (tails[mid] < p) a = mid + 1; else b = mid;
                  }
                  tails[a] = p;
                  if (a == len) len++;
              }
              free(order);
              free(tails);
              return n - len;
          }
        `,
        csharp: code`
          public static int MinOperations(int[] target, int[] arr)
          {
              var pos = new Dictionary<int, int>();
              for (int i = 0; i < target.Length; i++) pos[target[i]] = i;
              int[] tails = new int[arr.Length];
              int len = 0;
              foreach (int v in arr)
              {
                  int p;
                  if (!pos.TryGetValue(v, out p)) continue;
                  int lo = 0, hi = len;
                  while (lo < hi)
                  {
                      int mid = lo + (hi - lo) / 2;
                      if (tails[mid] < p) lo = mid + 1; else hi = mid;
                  }
                  tails[lo] = p;
                  if (lo == len) len++;
              }
              return target.Length - len;
          }
        `,
        go: code`
          func minOperations(target []int, arr []int) int {
              pos := make(map[int]int, len(target))
              for i, v := range target {
                  pos[v] = i
              }
              tails := []int{}
              for _, v := range arr {
                  p, ok := pos[v]
                  if !ok {
                      continue
                  }
                  k := sort.SearchInts(tails, p)
                  if k == len(tails) {
                      tails = append(tails, p)
                  } else {
                      tails[k] = p
                  }
              }
              return len(target) - len(tails)
          }
        `,
        kotlin: code`
          fun minOperations(target: IntArray, arr: IntArray): Int {
              val pos = HashMap<Int, Int>()
              for (i in target.indices) pos[target[i]] = i
              val tails = IntArray(arr.size)
              var len = 0
              for (v in arr) {
                  val p = pos[v] ?: continue
                  var lo = 0
                  var hi = len
                  while (lo < hi) {
                      val mid = (lo + hi) / 2
                      if (tails[mid] < p) lo = mid + 1 else hi = mid
                  }
                  tails[lo] = p
                  if (lo == len) len++
              }
              return target.size - len
          }
        `,
        swift: code`
          func minOperations(_ target: [Int], _ arr: [Int]) -> Int {
              var pos = [Int: Int]()
              for i in 0..<target.count { pos[target[i]] = i }
              var tails = [Int]()
              for v in arr {
                  guard let p = pos[v] else { continue }
                  var lo = 0
                  var hi = tails.count
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if tails[mid] < p { lo = mid + 1 } else { hi = mid }
                  }
                  if lo == tails.count { tails.append(p) } else { tails[lo] = p }
              }
              return target.count - tails.count
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn minOperations(target: Vec<i32>, arr: Vec<i32>) -> i32 {
              let mut pos: HashMap<i32, usize> = HashMap::new();
              for (i, &v) in target.iter().enumerate() {
                  pos.insert(v, i);
              }
              let mut tails: Vec<usize> = Vec::new();
              for v in arr.iter() {
                  if let Some(&p) = pos.get(v) {
                      let mut lo = 0usize;
                      let mut hi = tails.len();
                      while lo < hi {
                          let mid = (lo + hi) / 2;
                          if tails[mid] < p { lo = mid + 1; } else { hi = mid; }
                      }
                      if lo == tails.len() { tails.push(p); } else { tails[lo] = p; }
                  }
              }
              (target.len() - tails.len()) as i32
          }
        `,
        php: code`
          function minOperations($target, $arr) {
              $pos = [];
              foreach ($target as $i => $v) $pos[$v] = $i;
              $tails = [];
              $len = 0;
              foreach ($arr as $v) {
                  if (!isset($pos[$v])) continue;
                  $p = $pos[$v];
                  $lo = 0;
                  $hi = $len;
                  while ($lo < $hi) {
                      $mid = intdiv($lo + $hi, 2);
                      if ($tails[$mid] < $p) $lo = $mid + 1; else $hi = $mid;
                  }
                  $tails[$lo] = $p;
                  if ($lo == $len) $len++;
              }
              return count($target) - $len;
          }
        `,
        ruby: code`
          def minOperations(target, arr)
            pos = {}
            target.each_with_index { |v, i| pos[v] = i }
            tails = []
            arr.each do |v|
              p = pos[v]
              next if p.nil?
              k = tails.bsearch_index { |t| t >= p } || tails.length
              tails[k] = p
            end
            target.length - tails.length
          end
        `,
      },
    };
  })(),

  // ── Find Nth Root of M (GFG) ────────────────────────────────────
  (() => {
    const powCap = (x: number, n: number, cap: number) => {
      let p = 1;
      for (let i = 0; i < n; i++) { p *= x; if (p > cap) return cap + 1; }
      return p;
    };
    // Independent check: round the floating-point root and test its neighbours exactly.
    const ref = (n: number, m: number) => {
      const c = Math.round(Math.pow(m, 1 / n));
      for (const r of [c - 1, c, c + 1]) if (r >= 1 && powCap(r, n, m) === m) return r;
      return -1;
    };
    return {
      slug: "find-nth-root-of-m",
      title: "Find Nth Root of M",
      difficulty: "EASY" as const,
      tags: ["Math", "Binary Search", "Amazon", "Google", "TCS"],
      signature: {
        funcName: "nthRoot",
        params: [{ name: "n", type: "int" as const }, { name: "m", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given two positive integers `n` and `m`, return the positive integer `r` with `r^n = m` — the integer `n`-th root of `m`.\n\nIf `m` is not the `n`-th power of any integer, return `-1`.",
        [
          { in: "n = 3, m = 27", out: "3", note: "3 · 3 · 3 = 27." },
          { in: "n = 4, m = 69", out: "-1", note: "2^4 = 16 and 3^4 = 81, so 69 has no integer fourth root." },
          { in: "n = 1, m = 14", out: "14" },
        ],
        ["1 <= n <= 30", "1 <= m <= 10^9"]),
      hints: [
        "`r^n` grows with `r`, so the candidates `1, 2, …, m` are sorted by their `n`-th power.",
        "Binary-search `r` in `[1, m]`, comparing `mid^n` with `m`.",
        "Compute `mid^n` by repeated multiplication and stop as soon as the product passes `m` — that keeps it from overflowing (or from running 30 multiplications of a huge number).",
      ],
      editorial: explain({
        idea: "Binary search over the root. For a candidate `mid`, compare `mid^n` with `m`: equal means found, smaller means the root is larger, larger means it is smaller. The power is built one factor at a time with an early exit once it exceeds `m`.",
        steps: [
          "Set `lo = 1`, `hi = m`.",
          "While `lo <= hi`: take `mid`, and multiply `p = 1` by `mid` up to `n` times, breaking as soon as `p > m`.",
          "If `p == m` return `mid`; if `p < m` set `lo = mid + 1`; otherwise `hi = mid - 1`.",
          "If the loop ends, no integer root exists: return `-1`.",
        ],
        why: "For a fixed `n >= 1`, `r -> r^n` is strictly increasing on positive integers, so at most one `r` has `r^n = m`, and comparing at `mid` tells which half could contain it. The early exit is safe because once the partial product exceeds `m`, further multiplication by `mid >= 1` keeps it above `m`.",
        time: "O(n · log m)",
        space: "O(1)",
        pitfalls: [
          "Floating-point `pow(m, 1/n)` can land just below an exact root (e.g. 0.999…); never trust it without an exact integer check.",
          "Without the early exit, `mid^n` overflows 64-bit integers immediately for large `mid`.",
          "`m = 1` has root 1 for every `n`.",
        ],
      }),
      examples: [
        { input: "3\n27", expectedOutput: "3" },
        { input: "4\n69", expectedOutput: "-1" },
        { input: "1\n14", expectedOutput: "14" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 5, 30]));
        let m: number;
        if (rng() < 0.55) {
          // Largest root whose n-th power stays within 10^9 (10^9 itself when n = 1).
          let top = Math.max(1, Math.floor(Math.pow(1000000000, 1 / n)) - 1);
          while (powCap(top + 1, n, 1000000000) <= 1000000000) top++;
          m = powCap(ri(rng, 1, top), n, 1000000000);
          if (rng() < 0.3) m = Math.min(1000000000, Math.max(1, m + pick(rng, [-1, 1])));
        } else {
          m = ri(rng, 1, pick(rng, [10, 1000, 1000000000]));
        }
        return { input: `${n}\n${m}`, expectedOutput: String(ref(n, m)) };
      },
      solutions: {
        python: code`
          def nthRoot(n: int, m: int) -> int:
              lo, hi = 1, m
              while lo <= hi:
                  mid = (lo + hi) // 2
                  p = 1
                  for _ in range(n):
                      p *= mid
                      if p > m:
                          break
                  if p == m:
                      return mid
                  if p < m:
                      lo = mid + 1
                  else:
                      hi = mid - 1
              return -1
        `,
        javascript: code`
          var nthRoot = function(n, m) {
              var lo = 1, hi = m;
              while (lo <= hi) {
                  var mid = lo + Math.floor((hi - lo) / 2);
                  var p = 1;
                  for (var i = 0; i < n; i++) {
                      p *= mid;
                      if (p > m) break;
                  }
                  if (p === m) return mid;
                  if (p < m) lo = mid + 1; else hi = mid - 1;
              }
              return -1;
          };
        `,
        typescript: code`
          function nthRoot(n: number, m: number): number {
              var lo = 1, hi = m;
              while (lo <= hi) {
                  var mid = lo + Math.floor((hi - lo) / 2);
                  var p = 1;
                  for (var i = 0; i < n; i++) {
                      p *= mid;
                      if (p > m) break;
                  }
                  if (p === m) return mid;
                  if (p < m) lo = mid + 1; else hi = mid - 1;
              }
              return -1;
          }
        `,
        java: code`
          public static int nthRoot(int n, int m) {
              long lo = 1, hi = m;
              while (lo <= hi) {
                  long mid = lo + (hi - lo) / 2;
                  long p = 1;
                  for (int i = 0; i < n; i++) {
                      p *= mid;
                      if (p > m) break;
                  }
                  if (p == m) return (int) mid;
                  if (p < m) lo = mid + 1; else hi = mid - 1;
              }
              return -1;
          }
        `,
        cpp: code`
          int nthRoot(int n, int m) {
              long long lo = 1, hi = m;
              while (lo <= hi) {
                  long long mid = lo + (hi - lo) / 2;
                  long long p = 1;
                  for (int i = 0; i < n; i++) {
                      p *= mid;
                      if (p > m) break;
                  }
                  if (p == m) return (int)mid;
                  if (p < m) lo = mid + 1; else hi = mid - 1;
              }
              return -1;
          }
        `,
        c: code`
          int nthRoot(int n, int m) {
              long long lo = 1, hi = m;
              while (lo <= hi) {
                  long long mid = lo + (hi - lo) / 2;
                  long long p = 1;
                  for (int i = 0; i < n; i++) {
                      p *= mid;
                      if (p > m) break;
                  }
                  if (p == m) return (int)mid;
                  if (p < m) lo = mid + 1; else hi = mid - 1;
              }
              return -1;
          }
        `,
        csharp: code`
          public static int NthRoot(int n, int m)
          {
              long lo = 1, hi = m;
              while (lo <= hi)
              {
                  long mid = lo + (hi - lo) / 2;
                  long p = 1;
                  for (int i = 0; i < n; i++)
                  {
                      p *= mid;
                      if (p > m) break;
                  }
                  if (p == m) return (int)mid;
                  if (p < m) lo = mid + 1; else hi = mid - 1;
              }
              return -1;
          }
        `,
        go: code`
          func nthRoot(n int, m int) int {
              lo, hi := 1, m
              for lo <= hi {
                  mid := lo + (hi-lo)/2
                  p := 1
                  for i := 0; i < n; i++ {
                      p *= mid
                      if p > m {
                          break
                      }
                  }
                  if p == m {
                      return mid
                  }
                  if p < m {
                      lo = mid + 1
                  } else {
                      hi = mid - 1
                  }
              }
              return -1
          }
        `,
        kotlin: code`
          fun nthRoot(n: Int, m: Int): Int {
              var lo = 1L
              var hi = m.toLong()
              while (lo <= hi) {
                  val mid = lo + (hi - lo) / 2
                  var p = 1L
                  for (i in 0 until n) {
                      p *= mid
                      if (p > m) break
                  }
                  if (p == m.toLong()) return mid.toInt()
                  if (p < m) lo = mid + 1 else hi = mid - 1
              }
              return -1
          }
        `,
        swift: code`
          func nthRoot(_ n: Int, _ m: Int) -> Int {
              var lo = 1
              var hi = m
              while lo <= hi {
                  let mid = lo + (hi - lo) / 2
                  var p = 1
                  for _ in 0..<n {
                      p *= mid
                      if p > m { break }
                  }
                  if p == m { return mid }
                  if p < m { lo = mid + 1 } else { hi = mid - 1 }
              }
              return -1
          }
        `,
        rust: code`
          fn nthRoot(n: i32, m: i32) -> i32 {
              let target = m as i64;
              let mut lo: i64 = 1;
              let mut hi: i64 = target;
              while lo <= hi {
                  let mid = lo + (hi - lo) / 2;
                  let mut p: i64 = 1;
                  for _ in 0..n {
                      p *= mid;
                      if p > target { break; }
                  }
                  if p == target { return mid as i32; }
                  if p < target { lo = mid + 1; } else { hi = mid - 1; }
              }
              -1
          }
        `,
        php: code`
          function nthRoot($n, $m) {
              $lo = 1;
              $hi = $m;
              while ($lo <= $hi) {
                  $mid = $lo + intdiv($hi - $lo, 2);
                  $p = 1;
                  for ($i = 0; $i < $n; $i++) {
                      $p *= $mid;
                      if ($p > $m) break;
                  }
                  if ($p == $m) return $mid;
                  if ($p < $m) $lo = $mid + 1; else $hi = $mid - 1;
              }
              return -1;
          }
        `,
        ruby: code`
          def nthRoot(n, m)
            lo = 1
            hi = m
            while lo <= hi
              mid = (lo + hi) / 2
              p = 1
              n.times do
                p *= mid
                break if p > m
              end
              return mid if p == m
              if p < m
                lo = mid + 1
              else
                hi = mid - 1
              end
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── K-th Element of Two Sorted Arrays (GFG) ─────────────────────
  (() => {
    const ref = (a: number[], b: number[], k: number) => a.concat(b).sort((x, y) => x - y)[k - 1];
    return {
      slug: "k-th-element-of-two-sorted-arrays",
      title: "K-th Element of Two Sorted Arrays",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Divide and Conquer", "Amazon", "Google", "Microsoft", "Flipkart"],
      signature: {
        funcName: "kthElement",
        params: [
          { name: "a", type: "int[]" as const },
          { name: "b", type: "int[]" as const },
          { name: "k", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "Arrays `a` and `b` are each sorted in non-decreasing order. Imagine merging them into one sorted array of length `a.length + b.length`.\n\nReturn the element at position `k` (1-based) of that merged array — without building it.",
        [
          { in: "a = [2,3,6,7,9], b = [1,4,8,10], k = 5", out: "6", note: "The merged array is 1, 2, 3, 4, 6, 7, 8, 9, 10." },
          { in: "a = [100,112,256,349,770], b = [72,86,113,119,265,445,892], k = 7", out: "256" },
          { in: "a = [5], b = [5,5], k = 3", out: "5" },
        ],
        ["1 <= a.length, b.length <= 10^6", "0 <= a[i], b[i] < 10^8", "1 <= k <= a.length + b.length", "a and b are sorted in non-decreasing order"]),
      hints: [
        "The first `k` merged elements consist of some prefix of `a` (say `i` elements) and some prefix of `b` (`k - i` elements).",
        "A split `i` is right exactly when `a[i-1] <= b[k-i]` and `b[k-i-1] <= a[i]` (treat missing neighbours as -∞ / +∞).",
        "Binary-search `i` over `[max(0, k - b.length), min(k, a.length)]`; the answer is `max(a[i-1], b[k-i-1])` at the right split.",
      ],
      editorial: explain({
        idea: "Binary-search how many of the first `k` merged elements come from `a`. Each candidate split is checked by comparing the elements on either side of the cut in both arrays.",
        steps: [
          "Search the smaller array for speed: if `a` is longer, swap the arrays.",
          "Let `lo = max(0, k - |b|)`, `hi = min(k, |a|)`. While `lo <= hi`, set `i = (lo + hi) / 2`, `j = k - i`.",
          "Let `L1 = a[i-1]`, `R1 = a[i]`, `L2 = b[j-1]`, `R2 = b[j]`, using -∞/+∞ when an index falls off the end.",
          "If `L1 <= R2` and `L2 <= R1`, return `max(L1, L2)`. If `L1 > R2`, too many come from `a`: `hi = i - 1`. Otherwise `lo = i + 1`.",
        ],
        why: "When `L1 <= R2` and `L2 <= R1`, every element in the two prefixes is `<=` every element after the cuts, so the prefixes are exactly the first `k` merged elements and their maximum is the `k`-th. If `L1 > R2`, an element of `a` inside the prefix is larger than one of `b` outside it, so fewer elements may come from `a`; symmetrically for the other case. Those monotone directions make the search valid.",
        time: "O(log(min(|a|, |b|)))",
        space: "O(1)",
        pitfalls: [
          "Bound `i` by both `k - |b|` and `min(k, |a|)` — otherwise `j` runs out of range.",
          "Use sentinels below and above every value (here -1 and 2^31 - 1) for missing neighbours.",
          "A linear two-pointer merge works too, but costs O(k).",
        ],
      }),
      examples: [
        { input: "[2,3,6,7,9]\n[1,4,8,10]\n5", expectedOutput: "6" },
        { input: "[100,112,256,349,770]\n[72,86,113,119,265,445,892]\n7", expectedOutput: "256" },
        { input: "[5]\n[5,5]\n3", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const span = pick(rng, [5, 100, 99999999]);
        const a = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 20])) }, () => ri(rng, 0, span)).sort((x, y) => x - y);
        const b = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 20])) }, () => ri(rng, 0, span)).sort((x, y) => x - y);
        const k = ri(rng, 1, a.length + b.length);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}\n${k}`, expectedOutput: String(ref(a, b, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def kthElement(a: List[int], b: List[int], k: int) -> int:
              if len(a) > len(b):
                  a, b = b, a
              n, m = len(a), len(b)
              lo, hi = max(0, k - m), min(k, n)
              while lo <= hi:
                  i = (lo + hi) // 2
                  j = k - i
                  l1 = a[i - 1] if i > 0 else -1
                  l2 = b[j - 1] if j > 0 else -1
                  r1 = a[i] if i < n else 2147483647
                  r2 = b[j] if j < m else 2147483647
                  if l1 <= r2 and l2 <= r1:
                      return max(l1, l2)
                  if l1 > r2:
                      hi = i - 1
                  else:
                      lo = i + 1
              return -1
        `,
        javascript: code`
          var kthElement = function(a, b, k) {
              if (a.length > b.length) { var t = a; a = b; b = t; }
              var n = a.length, m = b.length;
              var lo = Math.max(0, k - m), hi = Math.min(k, n);
              while (lo <= hi) {
                  var i = (lo + hi) >> 1, j = k - i;
                  var l1 = i > 0 ? a[i - 1] : -1;
                  var l2 = j > 0 ? b[j - 1] : -1;
                  var r1 = i < n ? a[i] : 2147483647;
                  var r2 = j < m ? b[j] : 2147483647;
                  if (l1 <= r2 && l2 <= r1) return Math.max(l1, l2);
                  if (l1 > r2) hi = i - 1; else lo = i + 1;
              }
              return -1;
          };
        `,
        typescript: code`
          function kthElement(a: number[], b: number[], k: number): number {
              if (a.length > b.length) { var t = a; a = b; b = t; }
              var n = a.length, m = b.length;
              var lo = Math.max(0, k - m), hi = Math.min(k, n);
              while (lo <= hi) {
                  var i = (lo + hi) >> 1, j = k - i;
                  var l1 = i > 0 ? a[i - 1] : -1;
                  var l2 = j > 0 ? b[j - 1] : -1;
                  var r1 = i < n ? a[i] : 2147483647;
                  var r2 = j < m ? b[j] : 2147483647;
                  if (l1 <= r2 && l2 <= r1) return Math.max(l1, l2);
                  if (l1 > r2) hi = i - 1; else lo = i + 1;
              }
              return -1;
          }
        `,
        java: code`
          public static int kthElement(int[] a, int[] b, int k) {
              if (a.length > b.length) return kthElement(b, a, k);
              int n = a.length, m = b.length;
              int lo = Math.max(0, k - m), hi = Math.min(k, n);
              while (lo <= hi) {
                  int i = (lo + hi) >>> 1, j = k - i;
                  int l1 = i > 0 ? a[i - 1] : -1;
                  int l2 = j > 0 ? b[j - 1] : -1;
                  int r1 = i < n ? a[i] : Integer.MAX_VALUE;
                  int r2 = j < m ? b[j] : Integer.MAX_VALUE;
                  if (l1 <= r2 && l2 <= r1) return Math.max(l1, l2);
                  if (l1 > r2) hi = i - 1; else lo = i + 1;
              }
              return -1;
          }
        `,
        cpp: code`
          int kthElement(vector<int>& a, vector<int>& b, int k) {
              if (a.size() > b.size()) return kthElement(b, a, k);
              int n = a.size(), m = b.size();
              int lo = max(0, k - m), hi = min(k, n);
              while (lo <= hi) {
                  int i = (lo + hi) / 2, j = k - i;
                  int l1 = i > 0 ? a[i - 1] : -1;
                  int l2 = j > 0 ? b[j - 1] : -1;
                  int r1 = i < n ? a[i] : INT_MAX;
                  int r2 = j < m ? b[j] : INT_MAX;
                  if (l1 <= r2 && l2 <= r1) return max(l1, l2);
                  if (l1 > r2) hi = i - 1; else lo = i + 1;
              }
              return -1;
          }
        `,
        c: code`
          int kthElement(int* a, int aSize, int* b, int bSize, int k) {
              if (aSize > bSize) return kthElement(b, bSize, a, aSize, k);
              int n = aSize, m = bSize;
              int lo = k - m > 0 ? k - m : 0, hi = k < n ? k : n;
              while (lo <= hi) {
                  int i = lo + (hi - lo) / 2, j = k - i;
                  int l1 = i > 0 ? a[i - 1] : -1;
                  int l2 = j > 0 ? b[j - 1] : -1;
                  int r1 = i < n ? a[i] : 2147483647;
                  int r2 = j < m ? b[j] : 2147483647;
                  if (l1 <= r2 && l2 <= r1) return l1 > l2 ? l1 : l2;
                  if (l1 > r2) hi = i - 1; else lo = i + 1;
              }
              return -1;
          }
        `,
        csharp: code`
          public static int KthElement(int[] a, int[] b, int k)
          {
              if (a.Length > b.Length) return KthElement(b, a, k);
              int n = a.Length, m = b.Length;
              int lo = Math.Max(0, k - m), hi = Math.Min(k, n);
              while (lo <= hi)
              {
                  int i = lo + (hi - lo) / 2, j = k - i;
                  int l1 = i > 0 ? a[i - 1] : -1;
                  int l2 = j > 0 ? b[j - 1] : -1;
                  int r1 = i < n ? a[i] : int.MaxValue;
                  int r2 = j < m ? b[j] : int.MaxValue;
                  if (l1 <= r2 && l2 <= r1) return Math.Max(l1, l2);
                  if (l1 > r2) hi = i - 1; else lo = i + 1;
              }
              return -1;
          }
        `,
        go: code`
          func kthElement(a []int, b []int, k int) int {
              if len(a) > len(b) {
                  a, b = b, a
              }
              n, m := len(a), len(b)
              lo, hi := k-m, k
              if lo < 0 {
                  lo = 0
              }
              if hi > n {
                  hi = n
              }
              for lo <= hi {
                  i := (lo + hi) / 2
                  j := k - i
                  l1, l2, r1, r2 := -1, -1, 1<<31-1, 1<<31-1
                  if i > 0 {
                      l1 = a[i-1]
                  }
                  if j > 0 {
                      l2 = b[j-1]
                  }
                  if i < n {
                      r1 = a[i]
                  }
                  if j < m {
                      r2 = b[j]
                  }
                  if l1 <= r2 && l2 <= r1 {
                      if l1 > l2 {
                          return l1
                      }
                      return l2
                  }
                  if l1 > r2 {
                      hi = i - 1
                  } else {
                      lo = i + 1
                  }
              }
              return -1
          }
        `,
        kotlin: code`
          fun kthElement(a: IntArray, b: IntArray, k: Int): Int {
              if (a.size > b.size) return kthElement(b, a, k)
              val n = a.size
              val m = b.size
              var lo = maxOf(0, k - m)
              var hi = minOf(k, n)
              while (lo <= hi) {
                  val i = (lo + hi) / 2
                  val j = k - i
                  val l1 = if (i > 0) a[i - 1] else -1
                  val l2 = if (j > 0) b[j - 1] else -1
                  val r1 = if (i < n) a[i] else Int.MAX_VALUE
                  val r2 = if (j < m) b[j] else Int.MAX_VALUE
                  if (l1 <= r2 && l2 <= r1) return maxOf(l1, l2)
                  if (l1 > r2) hi = i - 1 else lo = i + 1
              }
              return -1
          }
        `,
        swift: code`
          func kthElement(_ a: [Int], _ b: [Int], _ k: Int) -> Int {
              if a.count > b.count { return kthElement(b, a, k) }
              let n = a.count
              let m = b.count
              var lo = max(0, k - m)
              var hi = min(k, n)
              while lo <= hi {
                  let i = (lo + hi) / 2
                  let j = k - i
                  let l1 = i > 0 ? a[i - 1] : -1
                  let l2 = j > 0 ? b[j - 1] : -1
                  let r1 = i < n ? a[i] : Int.max
                  let r2 = j < m ? b[j] : Int.max
                  if l1 <= r2 && l2 <= r1 { return max(l1, l2) }
                  if l1 > r2 { hi = i - 1 } else { lo = i + 1 }
              }
              return -1
          }
        `,
        rust: code`
          fn kthElement(a: Vec<i32>, b: Vec<i32>, k: i32) -> i32 {
              if a.len() > b.len() { return kthElement(b, a, k); }
              let n = a.len() as i64;
              let m = b.len() as i64;
              let k = k as i64;
              let mut lo = if k - m > 0 { k - m } else { 0 };
              let mut hi = if k < n { k } else { n };
              while lo <= hi {
                  let i = (lo + hi) / 2;
                  let j = k - i;
                  let l1 = if i > 0 { a[(i - 1) as usize] } else { -1 };
                  let l2 = if j > 0 { b[(j - 1) as usize] } else { -1 };
                  let r1 = if i < n { a[i as usize] } else { std::i32::MAX };
                  let r2 = if j < m { b[j as usize] } else { std::i32::MAX };
                  if l1 <= r2 && l2 <= r1 { return std::cmp::max(l1, l2); }
                  if l1 > r2 { hi = i - 1; } else { lo = i + 1; }
              }
              -1
          }
        `,
        php: code`
          function kthElement($a, $b, $k) {
              if (count($a) > count($b)) return kthElement($b, $a, $k);
              $n = count($a);
              $m = count($b);
              $lo = max(0, $k - $m);
              $hi = min($k, $n);
              while ($lo <= $hi) {
                  $i = intdiv($lo + $hi, 2);
                  $j = $k - $i;
                  $l1 = $i > 0 ? $a[$i - 1] : -1;
                  $l2 = $j > 0 ? $b[$j - 1] : -1;
                  $r1 = $i < $n ? $a[$i] : PHP_INT_MAX;
                  $r2 = $j < $m ? $b[$j] : PHP_INT_MAX;
                  if ($l1 <= $r2 && $l2 <= $r1) return max($l1, $l2);
                  if ($l1 > $r2) $hi = $i - 1; else $lo = $i + 1;
              }
              return -1;
          }
        `,
        ruby: code`
          def kthElement(a, b, k)
            return kthElement(b, a, k) if a.length > b.length
            n = a.length
            m = b.length
            lo = [0, k - m].max
            hi = [k, n].min
            while lo <= hi
              i = (lo + hi) / 2
              j = k - i
              l1 = i > 0 ? a[i - 1] : -1
              l2 = j > 0 ? b[j - 1] : -1
              r1 = i < n ? a[i] : 2147483647
              r2 = j < m ? b[j] : 2147483647
              return [l1, l2].max if l1 <= r2 && l2 <= r1
              if l1 > r2
                hi = i - 1
              else
                lo = i + 1
              end
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Maximum Sum Queries (LC 2736) ───────────────────────────────
  (() => {
    const ref = (a: number[], b: number[], queries: number[][]) => queries.map(([x, y]) => {
      let best = -1;
      for (let j = 0; j < a.length; j++) if (a[j] >= x && b[j] >= y) best = Math.max(best, a[j] + b[j]);
      return best;
    });
    return {
      slug: "maximum-sum-queries",
      title: "Maximum Sum Queries",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Sorting", "Monotonic Stack", "Google", "Amazon"],
      signature: {
        funcName: "maximumSumQueries",
        params: [
          { name: "nums1", type: "int[]" as const },
          { name: "nums2", type: "int[]" as const },
          { name: "queries", type: "int[][]" as const },
        ],
        returns: "int[]" as const,
      },
      description: describe(
        "You are given two arrays `nums1` and `nums2` of the same length `n` and a list of queries `queries[i] = [x_i, y_i]`.\n\nFor each query, look at every index `j` with `nums1[j] >= x_i` **and** `nums2[j] >= y_i`, and take the largest `nums1[j] + nums2[j]` among them. If no index qualifies, the answer is `-1`.\n\nReturn the answers in query order.",
        [
          { in: "nums1 = [5,2,7,3], nums2 = [1,8,2,6], queries = [[3,2],[1,7],[6,3],[2,1]]", out: "[9,10,-1,10]", note: "For [3,2] the indices holding (7,2) and (3,6) qualify, both summing to 9; for [6,3] only (7,2) passes the first test and it fails the second." },
          { in: "nums1 = [3,2,5], nums2 = [2,3,4], queries = [[4,4],[3,2],[1,1]]", out: "[9,9,9]" },
        ],
        ["nums1.length == nums2.length", "n == nums1.length", "1 <= n <= 10^5", "1 <= nums1[i], nums2[i] <= 10^9", "1 <= queries.length <= 10^5", "queries[i].length == 2", "1 <= x_i, y_i <= 10^9"]),
      hints: [
        "Answer the queries offline in decreasing order of `x`, so the set of indices passing the first test only ever grows.",
        "Among the indices added so far, one with a smaller `nums2` **and** a smaller sum than another is useless. What remains can be kept so that `nums2` increases while the sum decreases.",
        "For a query, binary-search that list for the first entry with `nums2 >= y` — its sum is the best available.",
      ],
      editorial: explain({
        idea: "Process points by decreasing `nums1` and queries by decreasing `x`. Keep only the Pareto-useful points in a stack ordered by increasing `nums2` and decreasing sum; a query then needs one binary search on `nums2`.",
        steps: [
          "Sort indices by `nums1` descending and query indices by `x` descending.",
          "For each query, first add every point with `nums1 >= x`. A new point `(b, s)` is skipped if the stack top already has `nums2 >= b` (that point has at least as large `nums1` and `nums2`, so it dominates). Otherwise pop entries whose sum is `<= s`, then push `(b, s)`.",
          "The stack has `nums2` strictly increasing and sums strictly decreasing from bottom to top. Binary-search the first entry with `nums2 >= y`; its sum is the answer, or `-1` if there is none.",
        ],
        why: "Every point already in the stack has `nums1` at least the new point's, so if it also has `nums2` at least as large it also has at least the same sum — the new point can never be the unique best. A popped entry has smaller `nums2` and no larger sum than the new point, so any query it could serve is served at least as well by the new point. These rules preserve the two monotone orders, which make the first entry meeting the `nums2` bound the one with the largest sum. Points stay valid for later queries because their `x` only decreases.",
        time: "O((n + q) log(n + q))",
        space: "O(n + q)",
        pitfalls: [
          "Sums reach 2 · 10^9, which still fits a signed 32-bit integer — but only just; be careful with any extra arithmetic.",
          "Points must be added before answering a query, using `>=` on `x`.",
          "Return answers in the original query order, not the sorted order.",
        ],
      }),
      examples: [
        { input: "[5,2,7,3]\n[1,8,2,6]\n[[3,2],[1,7],[6,3],[2,1]]", expectedOutput: "[9,10,-1,10]" },
        { input: "[3,2,5]\n[2,3,4]\n[[4,4],[3,2],[1,1]]", expectedOutput: "[9,9,9]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 6, 18]));
        const span = pick(rng, [5, 100, 1000000000]);
        const a = Array.from({ length: n }, () => ri(rng, 1, span));
        const b = Array.from({ length: n }, () => ri(rng, 1, span));
        const near = (vals: number[]) => (rng() < 0.6 ? Math.min(1000000000, Math.max(1, pick(rng, vals) + ri(rng, -1, 1))) : ri(rng, 1, span));
        const queries = Array.from({ length: ri(rng, 1, pick(rng, [1, 6, 18])) }, () => [near(a), near(b)]);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(a, b, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumSumQueries(nums1: List[int], nums2: List[int], queries: List[List[int]]) -> List[int]:
              n = len(nums1)
              order = sorted(range(n), key=lambda i: -nums1[i])
              qorder = sorted(range(len(queries)), key=lambda i: -queries[i][0])
              res = [-1] * len(queries)
              st_b, st_s = [], []
              j = 0
              for qi in qorder:
                  x, y = queries[qi]
                  while j < n and nums1[order[j]] >= x:
                      b = nums2[order[j]]
                      s = nums1[order[j]] + b
                      if not st_b or st_b[-1] < b:
                          while st_s and st_s[-1] <= s:
                              st_s.pop()
                              st_b.pop()
                          st_b.append(b)
                          st_s.append(s)
                      j += 1
                  lo, hi = 0, len(st_b)
                  while lo < hi:
                      mid = (lo + hi) // 2
                      if st_b[mid] < y:
                          lo = mid + 1
                      else:
                          hi = mid
                  if lo < len(st_b):
                      res[qi] = st_s[lo]
              return res
        `,
        javascript: code`
          var maximumSumQueries = function(nums1, nums2, queries) {
              var n = nums1.length;
              var order = [];
              for (var i = 0; i < n; i++) order.push(i);
              order.sort(function(p, q) { return nums1[q] - nums1[p]; });
              var qorder = [];
              for (var t = 0; t < queries.length; t++) qorder.push(t);
              qorder.sort(function(p, q) { return queries[q][0] - queries[p][0]; });
              var res = new Array(queries.length).fill(-1);
              var stB = [], stS = [];
              var j = 0;
              for (var u = 0; u < qorder.length; u++) {
                  var qi = qorder[u], x = queries[qi][0], y = queries[qi][1];
                  while (j < n && nums1[order[j]] >= x) {
                      var b = nums2[order[j]], s = nums1[order[j]] + b;
                      if (stB.length === 0 || stB[stB.length - 1] < b) {
                          while (stS.length > 0 && stS[stS.length - 1] <= s) { stS.pop(); stB.pop(); }
                          stB.push(b);
                          stS.push(s);
                      }
                      j++;
                  }
                  var lo = 0, hi = stB.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (stB[mid] < y) lo = mid + 1; else hi = mid;
                  }
                  if (lo < stB.length) res[qi] = stS[lo];
              }
              return res;
          };
        `,
        typescript: code`
          function maximumSumQueries(nums1: number[], nums2: number[], queries: number[][]): number[] {
              var n = nums1.length;
              var order: number[] = [];
              for (var i = 0; i < n; i++) order.push(i);
              order.sort(function(p, q) { return nums1[q] - nums1[p]; });
              var qorder: number[] = [];
              var res: number[] = [];
              for (var t = 0; t < queries.length; t++) { qorder.push(t); res.push(-1); }
              qorder.sort(function(p, q) { return queries[q][0] - queries[p][0]; });
              var stB: number[] = [], stS: number[] = [];
              var j = 0;
              for (var u = 0; u < qorder.length; u++) {
                  var qi = qorder[u], x = queries[qi][0], y = queries[qi][1];
                  while (j < n && nums1[order[j]] >= x) {
                      var b = nums2[order[j]], s = nums1[order[j]] + b;
                      if (stB.length === 0 || stB[stB.length - 1] < b) {
                          while (stS.length > 0 && stS[stS.length - 1] <= s) { stS.pop(); stB.pop(); }
                          stB.push(b);
                          stS.push(s);
                      }
                      j++;
                  }
                  var lo = 0, hi = stB.length;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (stB[mid] < y) lo = mid + 1; else hi = mid;
                  }
                  if (lo < stB.length) res[qi] = stS[lo];
              }
              return res;
          }
        `,
        java: code`
          public static int[] maximumSumQueries(int[] nums1, int[] nums2, int[][] queries) {
              int n = nums1.length, qn = queries.length;
              Integer[] order = new Integer[n];
              for (int i = 0; i < n; i++) order[i] = i;
              Arrays.sort(order, (p, q) -> Integer.compare(nums1[q], nums1[p]));
              Integer[] qorder = new Integer[qn];
              for (int i = 0; i < qn; i++) qorder[i] = i;
              Arrays.sort(qorder, (p, q) -> Integer.compare(queries[q][0], queries[p][0]));
              int[] res = new int[qn];
              Arrays.fill(res, -1);
              int[] stB = new int[n];
              long[] stS = new long[n];
              int top = 0, j = 0;
              for (int qi : qorder) {
                  int x = queries[qi][0], y = queries[qi][1];
                  while (j < n && nums1[order[j]] >= x) {
                      int b = nums2[order[j]];
                      long s = (long) nums1[order[j]] + b;
                      if (top == 0 || stB[top - 1] < b) {
                          while (top > 0 && stS[top - 1] <= s) top--;
                          stB[top] = b;
                          stS[top] = s;
                          top++;
                      }
                      j++;
                  }
                  int lo = 0, hi = top;
                  while (lo < hi) {
                      int mid = (lo + hi) >>> 1;
                      if (stB[mid] < y) lo = mid + 1; else hi = mid;
                  }
                  if (lo < top) res[qi] = (int) stS[lo];
              }
              return res;
          }
        `,
        cpp: code`
          vector<int> maximumSumQueries(vector<int>& nums1, vector<int>& nums2, vector<vector<int>>& queries) {
              int n = nums1.size(), qn = queries.size();
              vector<int> order(n), qorder(qn);
              for (int i = 0; i < n; i++) order[i] = i;
              for (int i = 0; i < qn; i++) qorder[i] = i;
              sort(order.begin(), order.end(), [&](int p, int q) { return nums1[p] > nums1[q]; });
              sort(qorder.begin(), qorder.end(), [&](int p, int q) { return queries[p][0] > queries[q][0]; });
              vector<int> res(qn, -1);
              vector<int> stB;
              vector<long long> stS;
              int j = 0;
              for (int qi : qorder) {
                  int x = queries[qi][0], y = queries[qi][1];
                  while (j < n && nums1[order[j]] >= x) {
                      int b = nums2[order[j]];
                      long long s = (long long)nums1[order[j]] + b;
                      if (stB.empty() || stB.back() < b) {
                          while (!stS.empty() && stS.back() <= s) { stS.pop_back(); stB.pop_back(); }
                          stB.push_back(b);
                          stS.push_back(s);
                      }
                      j++;
                  }
                  int lo = lower_bound(stB.begin(), stB.end(), y) - stB.begin();
                  if (lo < (int)stB.size()) res[qi] = (int)stS[lo];
              }
              return res;
          }
        `,
        c: code`
          static int* msqNums1;
          static int** msqQueries;

          static int msqPairCmp(const void* a, const void* b) {
              int x = msqNums1[*(const int*)a], y = msqNums1[*(const int*)b];
              return (y > x) - (y < x);
          }

          static int msqQueryCmp(const void* a, const void* b) {
              int x = msqQueries[*(const int*)a][0], y = msqQueries[*(const int*)b][0];
              return (y > x) - (y < x);
          }

          int* maximumSumQueries(int* nums1, int nums1Size, int* nums2, int nums2Size, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int n = nums1Size, qn = queriesSize;
              int* order = (int*)malloc(sizeof(int) * n);
              int* qorder = (int*)malloc(sizeof(int) * (qn > 0 ? qn : 1));
              for (int i = 0; i < n; i++) order[i] = i;
              for (int i = 0; i < qn; i++) qorder[i] = i;
              msqNums1 = nums1;
              msqQueries = queries;
              qsort(order, n, sizeof(int), msqPairCmp);
              qsort(qorder, qn, sizeof(int), msqQueryCmp);
              int* res = (int*)malloc(sizeof(int) * (qn > 0 ? qn : 1));
              int* stB = (int*)malloc(sizeof(int) * n);
              long long* stS = (long long*)malloc(sizeof(long long) * n);
              int top = 0, j = 0;
              for (int u = 0; u < qn; u++) {
                  int qi = qorder[u];
                  int x = queries[qi][0], y = queries[qi][1];
                  while (j < n && nums1[order[j]] >= x) {
                      int b = nums2[order[j]];
                      long long s = (long long)nums1[order[j]] + b;
                      if (top == 0 || stB[top - 1] < b) {
                          while (top > 0 && stS[top - 1] <= s) top--;
                          stB[top] = b;
                          stS[top] = s;
                          top++;
                      }
                      j++;
                  }
                  int lo = 0, hi = top;
                  while (lo < hi) {
                      int mid = lo + (hi - lo) / 2;
                      if (stB[mid] < y) lo = mid + 1; else hi = mid;
                  }
                  res[qi] = lo < top ? (int)stS[lo] : -1;
              }
              free(order);
              free(qorder);
              free(stB);
              free(stS);
              *returnSize = qn;
              return res;
          }
        `,
        csharp: code`
          public static int[] MaximumSumQueries(int[] nums1, int[] nums2, int[][] queries)
          {
              int n = nums1.Length, qn = queries.Length;
              int[] order = Enumerable.Range(0, n).ToArray();
              Array.Sort(order, (p, q) => nums1[q].CompareTo(nums1[p]));
              int[] qorder = Enumerable.Range(0, qn).ToArray();
              Array.Sort(qorder, (p, q) => queries[q][0].CompareTo(queries[p][0]));
              int[] res = new int[qn];
              int[] stB = new int[n];
              long[] stS = new long[n];
              int top = 0, j = 0;
              foreach (int qi in qorder)
              {
                  int x = queries[qi][0], y = queries[qi][1];
                  while (j < n && nums1[order[j]] >= x)
                  {
                      int b = nums2[order[j]];
                      long s = (long)nums1[order[j]] + b;
                      if (top == 0 || stB[top - 1] < b)
                      {
                          while (top > 0 && stS[top - 1] <= s) top--;
                          stB[top] = b;
                          stS[top] = s;
                          top++;
                      }
                      j++;
                  }
                  int lo = 0, hi = top;
                  while (lo < hi)
                  {
                      int mid = lo + (hi - lo) / 2;
                      if (stB[mid] < y) lo = mid + 1; else hi = mid;
                  }
                  res[qi] = lo < top ? (int)stS[lo] : -1;
              }
              return res;
          }
        `,
        go: code`
          func maximumSumQueries(nums1 []int, nums2 []int, queries [][]int) []int {
              n, qn := len(nums1), len(queries)
              order := make([]int, n)
              for i := range order {
                  order[i] = i
              }
              sort.Slice(order, func(p, q int) bool { return nums1[order[p]] > nums1[order[q]] })
              qorder := make([]int, qn)
              for i := range qorder {
                  qorder[i] = i
              }
              sort.Slice(qorder, func(p, q int) bool { return queries[qorder[p]][0] > queries[qorder[q]][0] })
              res := make([]int, qn)
              stB := []int{}
              stS := []int{}
              j := 0
              for _, qi := range qorder {
                  x, y := queries[qi][0], queries[qi][1]
                  for j < n && nums1[order[j]] >= x {
                      b := nums2[order[j]]
                      s := nums1[order[j]] + b
                      if len(stB) == 0 || stB[len(stB)-1] < b {
                          for len(stS) > 0 && stS[len(stS)-1] <= s {
                              stS = stS[:len(stS)-1]
                              stB = stB[:len(stB)-1]
                          }
                          stB = append(stB, b)
                          stS = append(stS, s)
                      }
                      j++
                  }
                  k := sort.SearchInts(stB, y)
                  if k < len(stB) {
                      res[qi] = stS[k]
                  } else {
                      res[qi] = -1
                  }
              }
              return res
          }
        `,
        kotlin: code`
          fun maximumSumQueries(nums1: IntArray, nums2: IntArray, queries: Array<IntArray>): IntArray {
              val n = nums1.size
              val order = (0 until n).sortedByDescending { nums1[it] }
              val qorder = queries.indices.sortedByDescending { queries[it][0] }
              val res = IntArray(queries.size) { -1 }
              val stB = IntArray(n)
              val stS = LongArray(n)
              var top = 0
              var j = 0
              for (qi in qorder) {
                  val x = queries[qi][0]
                  val y = queries[qi][1]
                  while (j < n && nums1[order[j]] >= x) {
                      val b = nums2[order[j]]
                      val s = nums1[order[j]].toLong() + b
                      if (top == 0 || stB[top - 1] < b) {
                          while (top > 0 && stS[top - 1] <= s) top--
                          stB[top] = b
                          stS[top] = s
                          top++
                      }
                      j++
                  }
                  var lo = 0
                  var hi = top
                  while (lo < hi) {
                      val mid = (lo + hi) / 2
                      if (stB[mid] < y) lo = mid + 1 else hi = mid
                  }
                  if (lo < top) res[qi] = stS[lo].toInt()
              }
              return res
          }
        `,
        swift: code`
          func maximumSumQueries(_ nums1: [Int], _ nums2: [Int], _ queries: [[Int]]) -> [Int] {
              let n = nums1.count
              let order = (0..<n).sorted { nums1[$0] > nums1[$1] }
              let qorder = (0..<queries.count).sorted { queries[$0][0] > queries[$1][0] }
              var res = Array(repeating: -1, count: queries.count)
              var stB = [Int]()
              var stS = [Int]()
              var j = 0
              for qi in qorder {
                  let x = queries[qi][0]
                  let y = queries[qi][1]
                  while j < n && nums1[order[j]] >= x {
                      let b = nums2[order[j]]
                      let s = nums1[order[j]] + b
                      if stB.isEmpty || stB[stB.count - 1] < b {
                          while let last = stS.last, last <= s {
                              stS.removeLast()
                              stB.removeLast()
                          }
                          stB.append(b)
                          stS.append(s)
                      }
                      j += 1
                  }
                  var lo = 0
                  var hi = stB.count
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if stB[mid] < y { lo = mid + 1 } else { hi = mid }
                  }
                  if lo < stB.count { res[qi] = stS[lo] }
              }
              return res
          }
        `,
        rust: code`
          fn maximumSumQueries(nums1: Vec<i32>, nums2: Vec<i32>, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let n = nums1.len();
              let mut order: Vec<usize> = (0..n).collect();
              order.sort_by(|&p, &q| nums1[q].cmp(&nums1[p]));
              let mut qorder: Vec<usize> = (0..queries.len()).collect();
              qorder.sort_by(|&p, &q| queries[q][0].cmp(&queries[p][0]));
              let mut res = vec![-1i32; queries.len()];
              let mut st_b: Vec<i32> = Vec::new();
              let mut st_s: Vec<i64> = Vec::new();
              let mut j = 0usize;
              for &qi in qorder.iter() {
                  let x = queries[qi][0];
                  let y = queries[qi][1];
                  while j < n && nums1[order[j]] >= x {
                      let b = nums2[order[j]];
                      let s = nums1[order[j]] as i64 + b as i64;
                      if st_b.is_empty() || *st_b.last().unwrap() < b {
                          while !st_s.is_empty() && *st_s.last().unwrap() <= s {
                              st_s.pop();
                              st_b.pop();
                          }
                          st_b.push(b);
                          st_s.push(s);
                      }
                      j += 1;
                  }
                  let mut lo = 0usize;
                  let mut hi = st_b.len();
                  while lo < hi {
                      let mid = (lo + hi) / 2;
                      if st_b[mid] < y { lo = mid + 1; } else { hi = mid; }
                  }
                  if lo < st_b.len() { res[qi] = st_s[lo] as i32; }
              }
              res
          }
        `,
        php: code`
          function maximumSumQueries($nums1, $nums2, $queries) {
              $n = count($nums1);
              $qn = count($queries);
              $order = range(0, $n - 1);
              usort($order, function ($p, $q) use ($nums1) { return $nums1[$q] <=> $nums1[$p]; });
              $qorder = range(0, $qn - 1);
              usort($qorder, function ($p, $q) use ($queries) { return $queries[$q][0] <=> $queries[$p][0]; });
              $res = array_fill(0, $qn, -1);
              $stB = [];
              $stS = [];
              $top = 0;
              $j = 0;
              foreach ($qorder as $qi) {
                  $x = $queries[$qi][0];
                  $y = $queries[$qi][1];
                  while ($j < $n && $nums1[$order[$j]] >= $x) {
                      $b = $nums2[$order[$j]];
                      $s = $nums1[$order[$j]] + $b;
                      if ($top == 0 || $stB[$top - 1] < $b) {
                          while ($top > 0 && $stS[$top - 1] <= $s) $top--;
                          $stB[$top] = $b;
                          $stS[$top] = $s;
                          $top++;
                      }
                      $j++;
                  }
                  $lo = 0;
                  $hi = $top;
                  while ($lo < $hi) {
                      $mid = intdiv($lo + $hi, 2);
                      if ($stB[$mid] < $y) $lo = $mid + 1; else $hi = $mid;
                  }
                  if ($lo < $top) $res[$qi] = $stS[$lo];
              }
              return $res;
          }
        `,
        ruby: code`
          def maximumSumQueries(nums1, nums2, queries)
            n = nums1.length
            order = (0...n).sort_by { |i| -nums1[i] }
            qorder = (0...queries.length).sort_by { |i| -queries[i][0] }
            res = Array.new(queries.length, -1)
            st_b = []
            st_s = []
            j = 0
            qorder.each do |qi|
              x, y = queries[qi]
              while j < n && nums1[order[j]] >= x
                b = nums2[order[j]]
                s = nums1[order[j]] + b
                if st_b.empty? || st_b[-1] < b
                  while !st_s.empty? && st_s[-1] <= s
                    st_s.pop
                    st_b.pop
                  end
                  st_b << b
                  st_s << s
                end
                j += 1
              end
              k = st_b.bsearch_index { |v| v >= y }
              res[qi] = st_s[k] if k
            end
            res
          end
        `,
      },
    };
  })(),

];
