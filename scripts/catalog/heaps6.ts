/**
 * Heaps, intervals & scheduling problems — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Languages without a priority queue on the judge (JavaScript, TypeScript, C,
 * C# on Mono, Go without the container/heap ceremony, Swift, Ruby) carry a
 * small binary min-heap of plain integers. Where an entry needs more than one
 * field (a height and a building, a size and a right end) the fields are
 * packed into one integer — `major * 2^k + minor` with both parts provably
 * below their bound — which keeps every hand-written heap the same twenty lines
 * and stays exact in a JavaScript double (every packed key here is below 2^53).
 * A max-heap is the same min-heap over negated keys.
 */
import {
  code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const HEAPS6_PROBLEMS: CatalogProblem[] = [

  // ── Remove Stones to Minimize the Total (LC 1962) ───────────────
  (() => {
    const ref = (piles: number[], k: number) => {
      const a = piles.slice();
      for (let t = 0; t < k; t++) {
        let bi = 0;
        for (let i = 1; i < a.length; i++) if (a[i] > a[bi]) bi = i;
        a[bi] -= Math.floor(a[bi] / 2);
      }
      return a.reduce((s, v) => s + v, 0);
    };
    return {
      slug: "remove-stones-to-minimize-the-total",
      title: "Remove Stones to Minimize the Total",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Heap (Priority Queue)", "Amazon", "Google"],
      signature: { funcName: "minStoneSum", params: [{ name: "piles", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given `piles`, where `piles[i]` is the number of stones in the `i`-th pile, and an integer `k`.\n\nYou must perform **exactly** `k` operations. In one operation you pick any pile — call its size `x` — and remove `floor(x / 2)` stones from it, leaving `x - floor(x / 2)`. The same pile may be picked any number of times.\n\nReturn the **smallest** total number of stones that can remain across all piles after the `k` operations.",
        [
          { in: "piles = [6,3,10], k = 3", out: "9", note: "Halve 10 to 5, then 6 to 3, then 5 to 3: the piles end as [3,3,3]." },
          { in: "piles = [4,3,6,7], k = 3", out: "12", note: "7 becomes 4, 6 becomes 3, one of the 4s becomes 2: [2,3,3,4]." },
          { in: "piles = [1], k = 5", out: "1", note: "A pile of one stone loses `floor(1 / 2) = 0` stones each time." },
        ],
        ["1 <= piles.length <= 10^5", "1 <= piles[i] <= 10^4", "1 <= k <= 10^5"]),
      hints: [
        "An operation on a pile of size `x` removes `floor(x / 2)` stones — the bigger the pile, the bigger the saving.",
        "Every operation is independent of the order the others happen in, so greedily take the largest saving available right now.",
        "Keep the piles in a max-heap: pop the largest, push back `x - floor(x / 2)`, `k` times, then add up what is left.",
      ],
      editorial: explain({
        idea: "Each operation should hit the currently largest pile, because that pile yields the largest removal and halving a pile never makes it larger than any pile you skipped. A max-heap serves the largest pile in `O(log n)`.",
        steps: [
          "Put every pile size into a max-heap.",
          "Repeat `k` times: pop the largest size `x` and push `x - floor(x / 2)` back.",
          "Return the sum of the sizes left in the heap.",
        ],
        why: "Suppose an optimal plan spends some operation on a pile smaller than the current maximum `M`. Swapping that operation onto `M` removes `floor(M / 2)` instead of something no larger, and every later operation still has a pile at least as large to work on, so the total never gets worse. Repeating the exchange turns any optimal plan into the greedy one.",
        time: "O((n + k) log n)",
        space: "O(n)",
        pitfalls: [
          "The amount removed is `floor(x / 2)`, so a pile keeps the ceiling: 5 becomes 3, not 2.",
          "All `k` operations are mandatory, but once the largest pile is 1 they remove nothing — the loop still terminates correctly.",
          "Sorting once is not enough: a halved pile can still be the largest and must compete again.",
        ],
      }),
      examples: [
        { input: "[6,3,10]\n3", expectedOutput: "9" },
        { input: "[4,3,6,7]\n3", expectedOutput: "12" },
        { input: "[1]\n5", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 8, 20, 40]));
        const top = pick(rng, [1, 2, 20, 1000, 10000]);
        const piles = Array.from({ length: n }, () => ri(rng, 1, top));
        const k = ri(rng, 1, pick(rng, [2, 10, 60, 120]));
        return { input: `${fmtIntArr(piles)}\n${k}`, expectedOutput: String(ref(piles, k)) };
      },
      solutions: {
        python: code`
          from typing import List
          import heapq

          def minStoneSum(piles: List[int], k: int) -> int:
              heap = [-p for p in piles]  # max-heap through negation
              heapq.heapify(heap)
              for _ in range(k):
                  top = -heapq.heappop(heap)
                  heapq.heappush(heap, -(top - top // 2))
              return -sum(heap)
        `,
        javascript: code`
          var minStoneSum = function(piles, k) {
              // A max-heap kept as a min-heap of negated sizes.
              var heap = [];
              for (var i = 0; i < piles.length; i++) heapPush(heap, -piles[i]);
              for (var t = 0; t < k; t++) {
                  var top = -heapPop(heap);
                  heapPush(heap, -(top - Math.floor(top / 2)));
              }
              var total = 0;
              for (var j = 0; j < heap.length; j++) total -= heap[j];
              return total;
          };

          var heapPush = function(h, v) {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          };

          var heapPop = function(h) {
              var top = h[0];
              var last = h.pop();
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          };
        `,
        typescript: code`
          function heapPush(h: number[], v: number): void {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          function heapPop(h: number[]): number {
              var top = h[0];
              var last = h.pop() as number;
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          function minStoneSum(piles: number[], k: number): number {
              // A max-heap kept as a min-heap of negated sizes.
              var heap: number[] = [];
              for (var i = 0; i < piles.length; i++) heapPush(heap, -piles[i]);
              for (var t = 0; t < k; t++) {
                  var top = -heapPop(heap);
                  heapPush(heap, -(top - Math.floor(top / 2)));
              }
              var total = 0;
              for (var j = 0; j < heap.length; j++) total -= heap[j];
              return total;
          }
        `,
        java: code`
          public static int minStoneSum(int[] piles, int k) {
              PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
              for (int p : piles) heap.add(p);
              for (int t = 0; t < k; t++) {
                  int top = heap.poll();
                  heap.add(top - top / 2);
              }
              int total = 0;
              for (int p : heap) total += p;
              return total;
          }
        `,
        cpp: code`
          int minStoneSum(vector<int>& piles, int k) {
              priority_queue<int> heap(piles.begin(), piles.end());
              for (int t = 0; t < k; t++) {
                  int top = heap.top();
                  heap.pop();
                  heap.push(top - top / 2);
              }
              int total = 0;
              while (!heap.empty()) {
                  total += heap.top();
                  heap.pop();
              }
              return total;
          }
        `,
        c: code`
          static void hpPush(long long* h, int* size, long long v) {
              int i = (*size)++;
              h[i] = v;
              while (i > 0) {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long long hpPop(long long* h, int* size) {
              long long top = h[0];
              (*size)--;
              if (*size > 0) {
                  h[0] = h[*size];
                  int j = 0;
                  for (;;) {
                      int l = 2 * j + 1, r = l + 1, s = j;
                      if (l < *size && h[l] < h[s]) s = l;
                      if (r < *size && h[r] < h[s]) s = r;
                      if (s == j) break;
                      long long t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          int minStoneSum(int* piles, int pilesSize, int k) {
              // A max-heap kept as a min-heap of negated sizes.
              long long* heap = (long long*) malloc((size_t) (pilesSize + 1) * sizeof(long long));
              int size = 0;
              for (int i = 0; i < pilesSize; i++) hpPush(heap, &size, -(long long) piles[i]);
              for (int t = 0; t < k; t++) {
                  long long top = -hpPop(heap, &size);
                  hpPush(heap, &size, -(top - top / 2));
              }
              long long total = 0;
              for (int i = 0; i < size; i++) total -= heap[i];
              free(heap);
              return (int) total;
          }
        `,
        csharp: code`
          static void HeapPush(List<long> h, long v)
          {
              h.Add(v);
              int i = h.Count - 1;
              while (i > 0)
              {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long HeapPop(List<long> h)
          {
              long top = h[0];
              int last = h.Count - 1;
              h[0] = h[last];
              h.RemoveAt(last);
              int j = 0;
              while (true)
              {
                  int l = 2 * j + 1, r = l + 1, s = j;
                  if (l < h.Count && h[l] < h[s]) s = l;
                  if (r < h.Count && h[r] < h[s]) s = r;
                  if (s == j) break;
                  long t = h[s]; h[s] = h[j]; h[j] = t;
                  j = s;
              }
              return top;
          }

          public static int MinStoneSum(int[] piles, int k)
          {
              // A max-heap kept as a min-heap of negated sizes.
              var heap = new List<long>();
              foreach (int p in piles) HeapPush(heap, -p);
              for (int t = 0; t < k; t++)
              {
                  long top = -HeapPop(heap);
                  HeapPush(heap, -(top - top / 2));
              }
              long total = 0;
              foreach (long v in heap) total -= v;
              return (int) total;
          }
        `,
        go: code`
          func hpPush(h *[]int, v int) {
              *h = append(*h, v)
              a := *h
              i := len(a) - 1
              for i > 0 {
                  p := (i - 1) / 2
                  if a[p] <= a[i] {
                      break
                  }
                  a[p], a[i] = a[i], a[p]
                  i = p
              }
          }

          func hpPop(h *[]int) int {
              a := *h
              top := a[0]
              last := len(a) - 1
              a[0] = a[last]
              a = a[:last]
              j := 0
              for {
                  l, r, s := 2*j+1, 2*j+2, j
                  if l < len(a) && a[l] < a[s] {
                      s = l
                  }
                  if r < len(a) && a[r] < a[s] {
                      s = r
                  }
                  if s == j {
                      break
                  }
                  a[s], a[j] = a[j], a[s]
                  j = s
              }
              *h = a
              return top
          }

          func minStoneSum(piles []int, k int) int {
              // A max-heap kept as a min-heap of negated sizes.
              pq := []int{}
              for _, p := range piles {
                  hpPush(&pq, -p)
              }
              for t := 0; t < k; t++ {
                  top := -hpPop(&pq)
                  hpPush(&pq, -(top - top/2))
              }
              total := 0
              for _, v := range pq {
                  total -= v
              }
              return total
          }
        `,
        kotlin: code`
          import java.util.PriorityQueue

          fun minStoneSum(piles: IntArray, k: Int): Int {
              val heap = PriorityQueue<Int>(reverseOrder<Int>())
              for (p in piles) heap.add(p)
              repeat(k) {
                  val top = heap.poll()
                  heap.add(top - top / 2)
              }
              var total = 0
              for (v in heap) total += v
              return total
          }
        `,
        swift: code`
          func hpPush(_ h: inout [Int], _ v: Int) {
              h.append(v)
              var i = h.count - 1
              while i > 0 {
                  let p = (i - 1) / 2
                  if h[p] <= h[i] { break }
                  h.swapAt(p, i)
                  i = p
              }
          }

          func hpPop(_ h: inout [Int]) -> Int {
              let top = h[0]
              let last = h.removeLast()
              if !h.isEmpty {
                  h[0] = last
                  var j = 0
                  while true {
                      let l = 2 * j + 1, r = l + 1
                      var s = j
                      if l < h.count && h[l] < h[s] { s = l }
                      if r < h.count && h[r] < h[s] { s = r }
                      if s == j { break }
                      h.swapAt(s, j)
                      j = s
                  }
              }
              return top
          }

          func minStoneSum(_ piles: [Int], _ k: Int) -> Int {
              // A max-heap kept as a min-heap of negated sizes.
              var heap = [Int]()
              for p in piles { hpPush(&heap, -p) }
              for _ in 0..<k {
                  let top = -hpPop(&heap)
                  hpPush(&heap, -(top - top / 2))
              }
              var total = 0
              for v in heap { total -= v }
              return total
          }
        `,
        rust: code`
          use std::collections::BinaryHeap;

          fn minStoneSum(piles: Vec<i32>, k: i32) -> i32 {
              let mut heap: BinaryHeap<i32> = piles.into_iter().collect();
              for _ in 0..k {
                  let top = heap.pop().unwrap();
                  heap.push(top - top / 2);
              }
              heap.iter().sum()
          }
        `,
        php: code`
          function minStoneSum($piles, $k) {
              $heap = new \SplMaxHeap();
              foreach ($piles as $p) $heap->insert($p);
              for ($t = 0; $t < $k; $t++) {
                  $top = $heap->extract();
                  $heap->insert($top - intdiv($top, 2));
              }
              $total = 0;
              while (!$heap->isEmpty()) $total += $heap->extract();
              return $total;
          }
        `,
        ruby: code`
          def hp_push(h, v)
            h << v
            i = h.length - 1
            while i > 0
              par = (i - 1) / 2
              break if h[par] <= h[i]
              h[par], h[i] = h[i], h[par]
              i = par
            end
          end

          def hp_pop(h)
            top = h[0]
            last = h.pop
            unless h.empty?
              h[0] = last
              j = 0
              loop do
                l = 2 * j + 1
                r = l + 1
                s = j
                s = l if l < h.length && h[l] < h[s]
                s = r if r < h.length && h[r] < h[s]
                break if s == j
                h[s], h[j] = h[j], h[s]
                j = s
              end
            end
            top
          end

          def minStoneSum(piles, k)
            heap = [] # a max-heap kept as a min-heap of negated sizes
            piles.each { |p| hp_push(heap, -p) }
            k.times do
              top = -hp_pop(heap)
              hp_push(heap, -(top - top / 2))
            end
            -heap.sum
          end
        `,
      },
    };
  })(),

  // ── The Skyline Problem (LC 218) ─────────────────────────────────
  (() => {
    const ref = (buildings: number[][]) => {
      const xs = Array.from(new Set(buildings.flatMap((b) => [b[0], b[1]]))).sort((a, b) => a - b);
      const out: number[][] = [];
      let prev = 0;
      for (const x of xs) {
        let h = 0;
        for (const b of buildings) if (b[0] <= x && x < b[1] && b[2] > h) h = b[2];
        if (h !== prev) { out.push([x, h]); prev = h; }
      }
      return out;
    };
    const BIG = 2147483647;
    return {
      slug: "the-skyline-problem",
      title: "The Skyline Problem",
      difficulty: "HARD" as const,
      tags: ["Array", "Divide and Conquer", "Heap (Priority Queue)", "Ordered Set", "Google", "Amazon", "Microsoft", "Uber"],
      signature: { funcName: "getSkyline", params: [{ name: "buildings", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "A city is drawn as rectangles standing on flat ground at height `0`. Building `i` is `buildings[i] = [left, right, height]`: it covers every `x` with `left <= x < right` up to `height`.\n\nThe **skyline** is the outline you see from far away — the upper contour of the union of all rectangles. Describe it as a list of **key points** `[x, y]`, sorted by `x`: each key point is where the outline jumps to height `y` and stays there until the next key point. The last key point always has `y = 0`, marking where the rightmost building ends, and ground between separate groups of buildings shows up as a key point with `y = 0` as well.\n\nThe list must be minimal: two consecutive key points never have the same height (`[[2,3],[4,3]]` is wrong — the second point is redundant).\n\nThe buildings are given sorted by `left`.",
        [
          { in: "buildings = [[1,5,3],[2,4,6],[6,8,2]]", out: "[[1,3],[2,6],[4,3],[5,0],[6,2],[8,0]]", note: "The tall building on [2,4) hides the first one there; ground shows on [5,6)." },
          { in: "buildings = [[0,2,3],[2,5,3]]", out: "[[0,3],[5,0]]", note: "The two buildings touch at the same height, so the outline is one flat segment." },
          { in: "buildings = [[1,3,4],[1,3,7]]", out: "[[1,7],[3,0]]" },
        ],
        ["1 <= buildings.length <= 10^4", "0 <= left < right <= 2^31 - 1", "1 <= height <= 2^31 - 1", "buildings is sorted by left in non-decreasing order"]),
      hints: [
        "The outline can only change height at an `x` where some building starts or ends — sweep those points from left to right.",
        "At each such `x` you need the tallest building that has started (`left <= x`) and not yet ended (`right > x`).",
        "Keep started buildings in a max-heap by height and throw away the top while it has already ended (`right <= x`); the top that survives is the height. Emit a key point only when it differs from the previous height.",
      ],
      editorial: explain({
        idea: "Sweep the distinct `x` coordinates where buildings begin or end. Between two consecutive ones the outline is flat, at the height of the tallest building covering that stretch — and a max-heap with **lazy deletion** answers that query without ever searching the middle of the heap.",
        steps: [
          "Collect every `left` and `right`, sort them, and walk the distinct values `x`.",
          "Push every building whose `left <= x` (the input is sorted by `left`, so a pointer suffices) into a max-heap ordered by height.",
          "While the top building has `right <= x`, pop it — it has ended.",
          "The current height is the top's height, or 0 if the heap is empty. If it differs from the last emitted height, append `[x, height]`.",
        ],
        why: "The height on `[x, x')` (with `x'` the next event) is the maximum over buildings with `left <= x < right`. Every such building has been pushed. Buildings that ended may still sit deep inside the heap, but they are harmless until they reach the top, and the moment they do they are popped — so the surviving top is exactly the maximum over live buildings. Emitting only on a change keeps the list minimal.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Process all starts and ends at the same `x` before reading the height, or touching buildings produce a spurious dip (`[2,0]` then `[2,3]`).",
          "A building covers `[left, right)`: at `x = right` it no longer counts, so pop on `right <= x`, not `right < x`.",
          "Heights reach `2^31 - 1`; packing height and index into one key needs 64-bit arithmetic.",
        ],
      }),
      examples: [
        { input: "[[1,5,3],[2,4,6],[6,8,2]]", expectedOutput: "[[1,3],[2,6],[4,3],[5,0],[6,2],[8,0]]" },
        { input: "[[0,2,3],[2,5,3]]", expectedOutput: "[[0,3],[5,0]]" },
        { input: "[[1,3,4],[1,3,7]]", expectedOutput: "[[1,7],[3,0]]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 8, 20]));
        const span = pick(rng, [6, 30, 1000, BIG]);
        const hTop = pick(rng, [1, 3, 10, BIG]);
        const buildings: number[][] = [];
        for (let i = 0; i < n; i++) {
          let l: number, r: number;
          if (span === BIG && rng() < 0.3) {
            l = ri(rng, BIG - 50, BIG - 1);
            r = ri(rng, l + 1, BIG);
          } else {
            l = ri(rng, 0, Math.min(span, BIG) - 1);
            r = ri(rng, l + 1, Math.min(BIG, l + 1 + Math.max(1, Math.floor(span / pick(rng, [1, 3, 10])))));
          }
          buildings.push([l, r, ri(rng, 1, hTop)]);
        }
        buildings.sort((a, b) => a[0] - b[0]);
        return { input: fmtIntMat(buildings), expectedOutput: fmtIntMat(ref(buildings)) };
      },
      solutions: {
        python: code`
          from typing import List
          import heapq

          def getSkyline(buildings: List[List[int]]) -> List[List[int]]:
              xs = sorted(set([b[0] for b in buildings] + [b[1] for b in buildings]))
              heap = []  # (-height, right): tallest started building on top
              res = []
              at, n, prev = 0, len(buildings), 0
              for x in xs:
                  while at < n and buildings[at][0] <= x:
                      heapq.heappush(heap, (-buildings[at][2], buildings[at][1]))
                      at += 1
                  while heap and heap[0][1] <= x:
                      heapq.heappop(heap)
                  cur = -heap[0][0] if heap else 0
                  if cur != prev:
                      res.append([x, cur])
                      prev = cur
              return res
        `,
        javascript: code`
          var getSkyline = function(buildings) {
              var n = buildings.length;
              var xs = [];
              for (var i = 0; i < n; i++) xs.push(buildings[i][0], buildings[i][1]);
              xs.sort(function(a, b) { return a - b; });
              // Tallest started building on top: a min-heap of -(height * 16384 + index).
              var heap = [];
              var res = [];
              var at = 0, prev = 0;
              for (var t = 0; t < xs.length; t++) {
                  var x = xs[t];
                  if (t > 0 && xs[t - 1] === x) continue;
                  while (at < n && buildings[at][0] <= x) {
                      heapPush(heap, -(buildings[at][2] * 16384 + at));
                      at++;
                  }
                  while (heap.length > 0 && buildings[(-heap[0]) % 16384][1] <= x) heapPop(heap);
                  var cur = heap.length > 0 ? buildings[(-heap[0]) % 16384][2] : 0;
                  if (cur !== prev) {
                      res.push([x, cur]);
                      prev = cur;
                  }
              }
              return res;
          };

          var heapPush = function(h, v) {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          };

          var heapPop = function(h) {
              var top = h[0];
              var last = h.pop();
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          };
        `,
        typescript: code`
          function heapPush(h: number[], v: number): void {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          function heapPop(h: number[]): number {
              var top = h[0];
              var last = h.pop() as number;
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          function getSkyline(buildings: number[][]): number[][] {
              var n = buildings.length;
              var xs: number[] = [];
              for (var i = 0; i < n; i++) xs.push(buildings[i][0], buildings[i][1]);
              xs.sort(function(a, b) { return a - b; });
              // Tallest started building on top: a min-heap of -(height * 16384 + index).
              var heap: number[] = [];
              var res: number[][] = [];
              var at = 0, prev = 0;
              for (var t = 0; t < xs.length; t++) {
                  var x = xs[t];
                  if (t > 0 && xs[t - 1] === x) continue;
                  while (at < n && buildings[at][0] <= x) {
                      heapPush(heap, -(buildings[at][2] * 16384 + at));
                      at++;
                  }
                  while (heap.length > 0 && buildings[(-heap[0]) % 16384][1] <= x) heapPop(heap);
                  var cur = heap.length > 0 ? buildings[(-heap[0]) % 16384][2] : 0;
                  if (cur !== prev) {
                      res.push([x, cur]);
                      prev = cur;
                  }
              }
              return res;
          }
        `,
        java: code`
          public static int[][] getSkyline(int[][] buildings) {
              int n = buildings.length;
              int[] xs = new int[2 * n];
              for (int i = 0; i < n; i++) {
                  xs[2 * i] = buildings[i][0];
                  xs[2 * i + 1] = buildings[i][1];
              }
              Arrays.sort(xs);
              // Indices of started buildings, tallest on top; ended ones are dropped lazily.
              PriorityQueue<Integer> heap = new PriorityQueue<>((a, b) -> Integer.compare(buildings[b][2], buildings[a][2]));
              List<int[]> res = new ArrayList<>();
              int at = 0, prev = 0;
              for (int t = 0; t < xs.length; t++) {
                  int x = xs[t];
                  if (t > 0 && xs[t - 1] == x) continue;
                  while (at < n && buildings[at][0] <= x) heap.add(at++);
                  while (!heap.isEmpty() && buildings[heap.peek()][1] <= x) heap.poll();
                  int cur = heap.isEmpty() ? 0 : buildings[heap.peek()][2];
                  if (cur != prev) {
                      res.add(new int[] { x, cur });
                      prev = cur;
                  }
              }
              return res.toArray(new int[0][]);
          }
        `,
        cpp: code`
          vector<vector<int>> getSkyline(vector<vector<int>>& buildings) {
              int n = buildings.size();
              vector<int> xs;
              for (auto& b : buildings) {
                  xs.push_back(b[0]);
                  xs.push_back(b[1]);
              }
              sort(xs.begin(), xs.end());
              xs.erase(unique(xs.begin(), xs.end()), xs.end());
              priority_queue<pair<int, int>> heap; // (height, right), tallest on top
              vector<vector<int>> res;
              int at = 0, prev = 0;
              for (int x : xs) {
                  while (at < n && buildings[at][0] <= x) {
                      heap.push({buildings[at][2], buildings[at][1]});
                      at++;
                  }
                  while (!heap.empty() && heap.top().second <= x) heap.pop();
                  int cur = heap.empty() ? 0 : heap.top().first;
                  if (cur != prev) {
                      res.push_back({x, cur});
                      prev = cur;
                  }
              }
              return res;
          }
        `,
        c: code`
          static void hpPush(long long* h, int* size, long long v) {
              int i = (*size)++;
              h[i] = v;
              while (i > 0) {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long long hpPop(long long* h, int* size) {
              long long top = h[0];
              (*size)--;
              if (*size > 0) {
                  h[0] = h[*size];
                  int j = 0;
                  for (;;) {
                      int l = 2 * j + 1, r = l + 1, s = j;
                      if (l < *size && h[l] < h[s]) s = l;
                      if (r < *size && h[r] < h[s]) s = r;
                      if (s == j) break;
                      long long t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          static int cmpInt(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          int** getSkyline(int** buildings, int buildingsSize, int* buildingsColSize, int* returnSize, int** returnColumnSizes) {
              int n = buildingsSize;
              int* xs = (int*) malloc((size_t) (2 * n) * sizeof(int));
              for (int i = 0; i < n; i++) {
                  xs[2 * i] = buildings[i][0];
                  xs[2 * i + 1] = buildings[i][1];
              }
              qsort(xs, (size_t) (2 * n), sizeof(int), cmpInt);
              // Tallest started building on top: a min-heap of -(height * 16384 + index).
              long long* heap = (long long*) malloc((size_t) (n + 1) * sizeof(long long));
              int size = 0;
              int** res = (int**) malloc((size_t) (2 * n) * sizeof(int*));
              int count = 0, at = 0, prev = 0;
              for (int t = 0; t < 2 * n; t++) {
                  int x = xs[t];
                  if (t > 0 && xs[t - 1] == x) continue;
                  while (at < n && buildings[at][0] <= x) {
                      hpPush(heap, &size, -((long long) buildings[at][2] * 16384 + at));
                      at++;
                  }
                  while (size > 0 && buildings[(int) ((-heap[0]) % 16384)][1] <= x) hpPop(heap, &size);
                  int cur = size > 0 ? buildings[(int) ((-heap[0]) % 16384)][2] : 0;
                  if (cur != prev) {
                      res[count] = (int*) malloc(2 * sizeof(int));
                      res[count][0] = x;
                      res[count][1] = cur;
                      count++;
                      prev = cur;
                  }
              }
              *returnColumnSizes = (int*) malloc((size_t) (count + 1) * sizeof(int));
              for (int i = 0; i < count; i++) (*returnColumnSizes)[i] = 2;
              *returnSize = count;
              free(xs);
              free(heap);
              return res;
          }
        `,
        csharp: code`
          static void HeapPush(List<long> h, long v)
          {
              h.Add(v);
              int i = h.Count - 1;
              while (i > 0)
              {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long HeapPop(List<long> h)
          {
              long top = h[0];
              int last = h.Count - 1;
              h[0] = h[last];
              h.RemoveAt(last);
              int j = 0;
              while (true)
              {
                  int l = 2 * j + 1, r = l + 1, s = j;
                  if (l < h.Count && h[l] < h[s]) s = l;
                  if (r < h.Count && h[r] < h[s]) s = r;
                  if (s == j) break;
                  long t = h[s]; h[s] = h[j]; h[j] = t;
                  j = s;
              }
              return top;
          }

          public static int[][] GetSkyline(int[][] buildings)
          {
              int n = buildings.Length;
              var xs = new int[2 * n];
              for (int i = 0; i < n; i++)
              {
                  xs[2 * i] = buildings[i][0];
                  xs[2 * i + 1] = buildings[i][1];
              }
              Array.Sort(xs);
              // Tallest started building on top: a min-heap of -(height * 16384 + index).
              var heap = new List<long>();
              var res = new List<int[]>();
              int at = 0, prev = 0;
              for (int t = 0; t < xs.Length; t++)
              {
                  int x = xs[t];
                  if (t > 0 && xs[t - 1] == x) continue;
                  while (at < n && buildings[at][0] <= x)
                  {
                      HeapPush(heap, -((long) buildings[at][2] * 16384 + at));
                      at++;
                  }
                  while (heap.Count > 0 && buildings[(int) ((-heap[0]) % 16384)][1] <= x) HeapPop(heap);
                  int cur = heap.Count > 0 ? buildings[(int) ((-heap[0]) % 16384)][2] : 0;
                  if (cur != prev)
                  {
                      res.Add(new int[] { x, cur });
                      prev = cur;
                  }
              }
              return res.ToArray();
          }
        `,
        go: code`
          func hpPush(h *[]int, v int) {
              *h = append(*h, v)
              a := *h
              i := len(a) - 1
              for i > 0 {
                  p := (i - 1) / 2
                  if a[p] <= a[i] {
                      break
                  }
                  a[p], a[i] = a[i], a[p]
                  i = p
              }
          }

          func hpPop(h *[]int) int {
              a := *h
              top := a[0]
              last := len(a) - 1
              a[0] = a[last]
              a = a[:last]
              j := 0
              for {
                  l, r, s := 2*j+1, 2*j+2, j
                  if l < len(a) && a[l] < a[s] {
                      s = l
                  }
                  if r < len(a) && a[r] < a[s] {
                      s = r
                  }
                  if s == j {
                      break
                  }
                  a[s], a[j] = a[j], a[s]
                  j = s
              }
              *h = a
              return top
          }

          func getSkyline(buildings [][]int) [][]int {
              n := len(buildings)
              xs := make([]int, 0, 2*n)
              for _, b := range buildings {
                  xs = append(xs, b[0], b[1])
              }
              sort.Ints(xs)
              // Tallest started building on top: a min-heap of -(height * 16384 + index).
              pq := []int{}
              res := [][]int{}
              at, prev := 0, 0
              for t, x := range xs {
                  if t > 0 && xs[t-1] == x {
                      continue
                  }
                  for at < n && buildings[at][0] <= x {
                      hpPush(&pq, -(buildings[at][2]*16384 + at))
                      at++
                  }
                  for len(pq) > 0 && buildings[(-pq[0])%16384][1] <= x {
                      hpPop(&pq)
                  }
                  cur := 0
                  if len(pq) > 0 {
                      cur = buildings[(-pq[0])%16384][2]
                  }
                  if cur != prev {
                      res = append(res, []int{x, cur})
                      prev = cur
                  }
              }
              return res
          }
        `,
        kotlin: code`
          import java.util.PriorityQueue

          fun getSkyline(buildings: Array<IntArray>): Array<IntArray> {
              val n = buildings.size
              val xs = IntArray(2 * n)
              for (i in 0 until n) {
                  xs[2 * i] = buildings[i][0]
                  xs[2 * i + 1] = buildings[i][1]
              }
              xs.sort()
              // Indices of started buildings, tallest on top; ended ones are dropped lazily.
              val heap = PriorityQueue<Int>(Comparator { a, b -> buildings[b][2].compareTo(buildings[a][2]) })
              val res = ArrayList<IntArray>()
              var at = 0
              var prev = 0
              for (t in xs.indices) {
                  val x = xs[t]
                  if (t > 0 && xs[t - 1] == x) continue
                  while (at < n && buildings[at][0] <= x) {
                      heap.add(at)
                      at++
                  }
                  while (heap.isNotEmpty() && buildings[heap.peek()][1] <= x) heap.poll()
                  val cur = if (heap.isEmpty()) 0 else buildings[heap.peek()][2]
                  if (cur != prev) {
                      res.add(intArrayOf(x, cur))
                      prev = cur
                  }
              }
              return res.toTypedArray()
          }
        `,
        swift: code`
          func hpPush(_ h: inout [Int], _ v: Int) {
              h.append(v)
              var i = h.count - 1
              while i > 0 {
                  let p = (i - 1) / 2
                  if h[p] <= h[i] { break }
                  h.swapAt(p, i)
                  i = p
              }
          }

          func hpPop(_ h: inout [Int]) -> Int {
              let top = h[0]
              let last = h.removeLast()
              if !h.isEmpty {
                  h[0] = last
                  var j = 0
                  while true {
                      let l = 2 * j + 1, r = l + 1
                      var s = j
                      if l < h.count && h[l] < h[s] { s = l }
                      if r < h.count && h[r] < h[s] { s = r }
                      if s == j { break }
                      h.swapAt(s, j)
                      j = s
                  }
              }
              return top
          }

          func getSkyline(_ buildings: [[Int]]) -> [[Int]] {
              let n = buildings.count
              var xs = [Int]()
              for b in buildings {
                  xs.append(b[0])
                  xs.append(b[1])
              }
              xs.sort()
              // Tallest started building on top: a min-heap of -(height * 16384 + index).
              var heap = [Int]()
              var res = [[Int]]()
              var at = 0, prev = 0
              for t in 0..<xs.count {
                  let x = xs[t]
                  if t > 0 && xs[t - 1] == x { continue }
                  while at < n && buildings[at][0] <= x {
                      hpPush(&heap, -(buildings[at][2] * 16384 + at))
                      at += 1
                  }
                  while !heap.isEmpty && buildings[(-heap[0]) % 16384][1] <= x { _ = hpPop(&heap) }
                  let cur = heap.isEmpty ? 0 : buildings[(-heap[0]) % 16384][2]
                  if cur != prev {
                      res.append([x, cur])
                      prev = cur
                  }
              }
              return res
          }
        `,
        rust: code`
          use std::collections::BinaryHeap;

          fn getSkyline(buildings: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
              let n = buildings.len();
              let mut xs: Vec<i32> = Vec::with_capacity(2 * n);
              for b in buildings.iter() {
                  xs.push(b[0]);
                  xs.push(b[1]);
              }
              xs.sort();
              xs.dedup();
              let mut heap: BinaryHeap<(i32, i32)> = BinaryHeap::new(); // (height, right)
              let mut res: Vec<Vec<i32>> = Vec::new();
              let mut at = 0usize;
              let mut prev = 0;
              for &x in xs.iter() {
                  while at < n && buildings[at][0] <= x {
                      heap.push((buildings[at][2], buildings[at][1]));
                      at += 1;
                  }
                  while let Some(&(_, right)) = heap.peek() {
                      if right <= x {
                          heap.pop();
                      } else {
                          break;
                      }
                  }
                  let cur = match heap.peek() {
                      Some(&(h, _)) => h,
                      None => 0,
                  };
                  if cur != prev {
                      res.push(vec![x, cur]);
                      prev = cur;
                  }
              }
              res
          }
        `,
        php: code`
          function getSkyline($buildings) {
              $n = count($buildings);
              $xs = [];
              foreach ($buildings as $b) {
                  $xs[] = $b[0];
                  $xs[] = $b[1];
              }
              sort($xs);
              $heap = new \SplMaxHeap(); // height * 16384 + index: tallest started building on top
              $res = [];
              $at = 0;
              $prev = 0;
              $m = count($xs);
              for ($t = 0; $t < $m; $t++) {
                  $x = $xs[$t];
                  if ($t > 0 && $xs[$t - 1] == $x) continue;
                  while ($at < $n && $buildings[$at][0] <= $x) {
                      $heap->insert($buildings[$at][2] * 16384 + $at);
                      $at++;
                  }
                  while (!$heap->isEmpty() && $buildings[$heap->top() % 16384][1] <= $x) $heap->extract();
                  $cur = $heap->isEmpty() ? 0 : $buildings[$heap->top() % 16384][2];
                  if ($cur != $prev) {
                      $res[] = [$x, $cur];
                      $prev = $cur;
                  }
              }
              return $res;
          }
        `,
        ruby: code`
          def hp_push(h, v)
            h << v
            i = h.length - 1
            while i > 0
              par = (i - 1) / 2
              break if h[par] <= h[i]
              h[par], h[i] = h[i], h[par]
              i = par
            end
          end

          def hp_pop(h)
            top = h[0]
            last = h.pop
            unless h.empty?
              h[0] = last
              j = 0
              loop do
                l = 2 * j + 1
                r = l + 1
                s = j
                s = l if l < h.length && h[l] < h[s]
                s = r if r < h.length && h[r] < h[s]
                break if s == j
                h[s], h[j] = h[j], h[s]
                j = s
              end
            end
            top
          end

          def getSkyline(buildings)
            n = buildings.length
            xs = buildings.map { |b| b[0] } + buildings.map { |b| b[1] }
            xs = xs.sort.uniq
            heap = [] # min-heap of -(height * 16384 + index): tallest started building on top
            res = []
            at = 0
            prev = 0
            xs.each do |x|
              while at < n && buildings[at][0] <= x
                hp_push(heap, -(buildings[at][2] * 16384 + at))
                at += 1
              end
              hp_pop(heap) while !heap.empty? && buildings[(-heap[0]) % 16384][1] <= x
              cur = heap.empty? ? 0 : buildings[(-heap[0]) % 16384][2]
              if cur != prev
                res << [x, cur]
                prev = cur
              end
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Minimum Interval to Include Each Query (LC 1851) ─────────────
  (() => {
    const ref = (intervals: number[][], queries: number[]) =>
      queries.map((q) => {
        let best = -1;
        for (const [l, r] of intervals) if (l <= q && q <= r && (best < 0 || r - l + 1 < best)) best = r - l + 1;
        return best;
      });
    return {
      slug: "minimum-interval-to-include-each-query",
      title: "Minimum Interval to Include Each Query",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Sorting", "Heap (Priority Queue)", "Google", "Amazon"],
      signature: {
        funcName: "minInterval",
        params: [{ name: "intervals", type: "int[][]" as const }, { name: "queries", type: "int[]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "Each `intervals[i] = [left, right]` covers the integers from `left` to `right`, both included; its **size** is `right - left + 1`.\n\nFor every `queries[j]`, find the smallest size of an interval that contains the value `queries[j]` (`left <= queries[j] <= right`). If no interval contains it, the answer is `-1`.\n\nReturn the answers as an array in the order of `queries`.",
        [
          { in: "intervals = [[2,5],[4,4],[6,9],[1,10]], queries = [4,3,8,11]", out: "[1,4,4,-1]", note: "4 lies in [4,4] (size 1); 3 in [2,5] (size 4); 8 in [6,9] (size 4); nothing reaches 11." },
          { in: "intervals = [[1,3],[3,7]], queries = [3,1,9]", out: "[3,3,-1]" },
        ],
        ["1 <= intervals.length <= 10^5", "1 <= queries.length <= 10^5", "intervals[i].length == 2", "1 <= left <= right <= 10^7", "1 <= queries[j] <= 10^7"]),
      hints: [
        "Answering queries in increasing order lets you reuse work: an interval that has started for one query has started for all later ones.",
        "Sort intervals by `left` and add each to a pool once its `left` is at most the current query.",
        "Keep the pool in a min-heap by size; before reading the top, discard tops whose `right` is already below the query — they can never contain a later query either.",
      ],
      editorial: explain({
        idea: "Process the queries offline in increasing order. Intervals enter a min-heap (keyed by size) as soon as they start, and leave it lazily once they end — for sorted queries an ended interval stays ended, so throwing it away is safe.",
        steps: [
          "Sort the intervals by `left`, and sort the query indices by query value.",
          "For each query `q` in that order, push every not-yet-pushed interval with `left <= q` into a min-heap keyed by `(size, right)`.",
          "Pop the top while its `right < q`.",
          "The answer for `q` is the top's size, or `-1` if the heap is empty; store it at the query's original index.",
        ],
        why: "When `q` is answered, the heap holds every interval with `left <= q` except some with `right < q'` for an earlier `q' <= q`, which cannot contain `q`. After popping, the top has `right >= q` and `left <= q`, so it contains `q`, and its size is minimal among all heap members — in particular among all intervals containing `q`, since none of those was discarded.",
        time: "O(n log n + m log m)",
        space: "O(n + m)",
        pitfalls: [
          "Answers must come back in the original query order — sort indices, not the values themselves.",
          "Only the top is checked for expiry; that is enough because a stale entry deeper down is popped the moment it surfaces.",
          "Both ends are inclusive: the size is `right - left + 1` and an interval with `right == q` still counts.",
        ],
      }),
      examples: [
        { input: "[[2,5],[4,4],[6,9],[1,10]]\n[4,3,8,11]", expectedOutput: "[1,4,4,-1]" },
        { input: "[[1,3],[3,7]]\n[3,1,9]", expectedOutput: "[3,3,-1]" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [5, 30, 1000, 10000000]);
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 30]));
        const m = ri(rng, 1, pick(rng, [1, 4, 12, 30]));
        const intervals: number[][] = [];
        for (let i = 0; i < n; i++) {
          const l = ri(rng, 1, top);
          const r = Math.min(top, l + ri(rng, 0, Math.max(0, Math.floor(top / pick(rng, [1, 4, 20])))));
          intervals.push([l, r]);
        }
        const queries = Array.from({ length: m }, () => (rng() < 0.4 ? pick(rng, intervals)[ri(rng, 0, 1)] : ri(rng, 1, top)));
        return { input: `${fmtIntMat(intervals)}\n${fmtIntArr(queries)}`, expectedOutput: fmtIntArr(ref(intervals, queries)) };
      },
      solutions: {
        python: code`
          from typing import List
          import heapq

          def minInterval(intervals: List[List[int]], queries: List[int]) -> List[int]:
              ivs = sorted(intervals)
              order = sorted(range(len(queries)), key=lambda j: queries[j])
              ans = [-1] * len(queries)
              heap = []  # (size, right) of started intervals
              at = 0
              for j in order:
                  q = queries[j]
                  while at < len(ivs) and ivs[at][0] <= q:
                      heapq.heappush(heap, (ivs[at][1] - ivs[at][0] + 1, ivs[at][1]))
                      at += 1
                  while heap and heap[0][1] < q:
                      heapq.heappop(heap)
                  if heap:
                      ans[j] = heap[0][0]
              return ans
        `,
        javascript: code`
          var minInterval = function(intervals, queries) {
              var ivs = intervals.slice().sort(function(a, b) { return a[0] - b[0]; });
              var order = [];
              for (var j = 0; j < queries.length; j++) order.push(j);
              order.sort(function(a, b) { return queries[a] - queries[b]; });
              var SHIFT = 16777216; // 2^24: sizes and right ends both stay below it
              var heap = []; // min-heap of size * SHIFT + right
              var ans = [];
              for (var z = 0; z < queries.length; z++) ans.push(-1);
              var at = 0;
              for (var t = 0; t < order.length; t++) {
                  var q = queries[order[t]];
                  while (at < ivs.length && ivs[at][0] <= q) {
                      heapPush(heap, (ivs[at][1] - ivs[at][0] + 1) * SHIFT + ivs[at][1]);
                      at++;
                  }
                  while (heap.length > 0 && heap[0] % SHIFT < q) heapPop(heap);
                  if (heap.length > 0) ans[order[t]] = Math.floor(heap[0] / SHIFT);
              }
              return ans;
          };

          var heapPush = function(h, v) {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          };

          var heapPop = function(h) {
              var top = h[0];
              var last = h.pop();
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          };
        `,
        typescript: code`
          function heapPush(h: number[], v: number): void {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          function heapPop(h: number[]): number {
              var top = h[0];
              var last = h.pop() as number;
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          function minInterval(intervals: number[][], queries: number[]): number[] {
              var ivs = intervals.slice().sort(function(a, b) { return a[0] - b[0]; });
              var order: number[] = [];
              for (var j = 0; j < queries.length; j++) order.push(j);
              order.sort(function(a, b) { return queries[a] - queries[b]; });
              var SHIFT = 16777216; // 2^24: sizes and right ends both stay below it
              var heap: number[] = []; // min-heap of size * SHIFT + right
              var ans: number[] = [];
              for (var z = 0; z < queries.length; z++) ans.push(-1);
              var at = 0;
              for (var t = 0; t < order.length; t++) {
                  var q = queries[order[t]];
                  while (at < ivs.length && ivs[at][0] <= q) {
                      heapPush(heap, (ivs[at][1] - ivs[at][0] + 1) * SHIFT + ivs[at][1]);
                      at++;
                  }
                  while (heap.length > 0 && heap[0] % SHIFT < q) heapPop(heap);
                  if (heap.length > 0) ans[order[t]] = Math.floor(heap[0] / SHIFT);
              }
              return ans;
          }
        `,
        java: code`
          public static int[] minInterval(int[][] intervals, int[] queries) {
              int[][] ivs = intervals.clone();
              Arrays.sort(ivs, (a, b) -> Integer.compare(a[0], b[0]));
              Integer[] order = new Integer[queries.length];
              for (int j = 0; j < queries.length; j++) order[j] = j;
              Arrays.sort(order, (a, b) -> Integer.compare(queries[a], queries[b]));
              // (size, right) of started intervals, smallest size on top
              PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
              int[] ans = new int[queries.length];
              int at = 0;
              for (int j : order) {
                  int q = queries[j];
                  while (at < ivs.length && ivs[at][0] <= q) {
                      heap.add(new int[] { ivs[at][1] - ivs[at][0] + 1, ivs[at][1] });
                      at++;
                  }
                  while (!heap.isEmpty() && heap.peek()[1] < q) heap.poll();
                  ans[j] = heap.isEmpty() ? -1 : heap.peek()[0];
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> minInterval(vector<vector<int>>& intervals, vector<int>& queries) {
              vector<vector<int>> ivs = intervals;
              sort(ivs.begin(), ivs.end());
              vector<int> order(queries.size());
              for (int j = 0; j < (int) queries.size(); j++) order[j] = j;
              sort(order.begin(), order.end(), [&](int a, int b) { return queries[a] < queries[b]; });
              // (size, right) of started intervals, smallest size on top
              priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> heap;
              vector<int> ans(queries.size(), -1);
              size_t at = 0;
              for (int j : order) {
                  int q = queries[j];
                  while (at < ivs.size() && ivs[at][0] <= q) {
                      heap.push({ivs[at][1] - ivs[at][0] + 1, ivs[at][1]});
                      at++;
                  }
                  while (!heap.empty() && heap.top().second < q) heap.pop();
                  if (!heap.empty()) ans[j] = heap.top().first;
              }
              return ans;
          }
        `,
        c: code`
          static void hpPush(long long* h, int* size, long long v) {
              int i = (*size)++;
              h[i] = v;
              while (i > 0) {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long long hpPop(long long* h, int* size) {
              long long top = h[0];
              (*size)--;
              if (*size > 0) {
                  h[0] = h[*size];
                  int j = 0;
                  for (;;) {
                      int l = 2 * j + 1, r = l + 1, s = j;
                      if (l < *size && h[l] < h[s]) s = l;
                      if (r < *size && h[r] < h[s]) s = r;
                      if (s == j) break;
                      long long t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          static int cmpByLeft(const void* a, const void* b) {
              const int* x = *(const int* const*) a;
              const int* y = *(const int* const*) b;
              return (x[0] > y[0]) - (x[0] < y[0]);
          }

          static int cmpLL(const void* a, const void* b) {
              long long x = *(const long long*) a, y = *(const long long*) b;
              return (x > y) - (x < y);
          }

          int* minInterval(int** intervals, int intervalsSize, int* intervalsColSize, int* queries, int queriesSize, int* returnSize) {
              const long long SHIFT = 16777216LL; // 2^24: sizes and right ends both stay below it
              int** ivs = (int**) malloc((size_t) (intervalsSize + 1) * sizeof(int*));
              for (int i = 0; i < intervalsSize; i++) ivs[i] = intervals[i];
              qsort(ivs, (size_t) intervalsSize, sizeof(int*), cmpByLeft);
              // Queries sorted by value, each carrying its index: value * 2^17 + index.
              long long* order = (long long*) malloc((size_t) (queriesSize + 1) * sizeof(long long));
              for (int j = 0; j < queriesSize; j++) order[j] = (long long) queries[j] * 131072 + j;
              qsort(order, (size_t) queriesSize, sizeof(long long), cmpLL);
              long long* heap = (long long*) malloc((size_t) (intervalsSize + 1) * sizeof(long long));
              int size = 0, at = 0;
              int* ans = (int*) malloc((size_t) (queriesSize + 1) * sizeof(int));
              for (int t = 0; t < queriesSize; t++) {
                  int j = (int) (order[t] % 131072);
                  int q = queries[j];
                  while (at < intervalsSize && ivs[at][0] <= q) {
                      hpPush(heap, &size, (long long) (ivs[at][1] - ivs[at][0] + 1) * SHIFT + ivs[at][1]);
                      at++;
                  }
                  while (size > 0 && heap[0] % SHIFT < q) hpPop(heap, &size);
                  ans[j] = size > 0 ? (int) (heap[0] / SHIFT) : -1;
              }
              free(ivs);
              free(order);
              free(heap);
              *returnSize = queriesSize;
              return ans;
          }
        `,
        csharp: code`
          static void HeapPush(List<long> h, long v)
          {
              h.Add(v);
              int i = h.Count - 1;
              while (i > 0)
              {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long HeapPop(List<long> h)
          {
              long top = h[0];
              int last = h.Count - 1;
              h[0] = h[last];
              h.RemoveAt(last);
              int j = 0;
              while (true)
              {
                  int l = 2 * j + 1, r = l + 1, s = j;
                  if (l < h.Count && h[l] < h[s]) s = l;
                  if (r < h.Count && h[r] < h[s]) s = r;
                  if (s == j) break;
                  long t = h[s]; h[s] = h[j]; h[j] = t;
                  j = s;
              }
              return top;
          }

          public static int[] MinInterval(int[][] intervals, int[] queries)
          {
              const long SHIFT = 16777216; // 2^24: sizes and right ends both stay below it
              var ivs = (int[][]) intervals.Clone();
              Array.Sort(ivs, (a, b) => a[0].CompareTo(b[0]));
              var order = new int[queries.Length];
              for (int j = 0; j < order.Length; j++) order[j] = j;
              Array.Sort(order, (a, b) => queries[a].CompareTo(queries[b]));
              var heap = new List<long>(); // min-heap of size * SHIFT + right
              var ans = new int[queries.Length];
              int at = 0;
              foreach (int j in order)
              {
                  int q = queries[j];
                  while (at < ivs.Length && ivs[at][0] <= q)
                  {
                      HeapPush(heap, (long) (ivs[at][1] - ivs[at][0] + 1) * SHIFT + ivs[at][1]);
                      at++;
                  }
                  while (heap.Count > 0 && heap[0] % SHIFT < q) HeapPop(heap);
                  ans[j] = heap.Count > 0 ? (int) (heap[0] / SHIFT) : -1;
              }
              return ans;
          }
        `,
        go: code`
          func hpPush(h *[]int, v int) {
              *h = append(*h, v)
              a := *h
              i := len(a) - 1
              for i > 0 {
                  p := (i - 1) / 2
                  if a[p] <= a[i] {
                      break
                  }
                  a[p], a[i] = a[i], a[p]
                  i = p
              }
          }

          func hpPop(h *[]int) int {
              a := *h
              top := a[0]
              last := len(a) - 1
              a[0] = a[last]
              a = a[:last]
              j := 0
              for {
                  l, r, s := 2*j+1, 2*j+2, j
                  if l < len(a) && a[l] < a[s] {
                      s = l
                  }
                  if r < len(a) && a[r] < a[s] {
                      s = r
                  }
                  if s == j {
                      break
                  }
                  a[s], a[j] = a[j], a[s]
                  j = s
              }
              *h = a
              return top
          }

          func minInterval(intervals [][]int, queries []int) []int {
              const shift = 16777216 // 2^24: sizes and right ends both stay below it
              ivs := make([][]int, len(intervals))
              copy(ivs, intervals)
              sort.Slice(ivs, func(a, b int) bool { return ivs[a][0] < ivs[b][0] })
              order := make([]int, len(queries))
              for j := range order {
                  order[j] = j
              }
              sort.Slice(order, func(a, b int) bool { return queries[order[a]] < queries[order[b]] })
              pq := []int{} // min-heap of size * shift + right
              ans := make([]int, len(queries))
              at := 0
              for _, j := range order {
                  q := queries[j]
                  for at < len(ivs) && ivs[at][0] <= q {
                      hpPush(&pq, (ivs[at][1]-ivs[at][0]+1)*shift+ivs[at][1])
                      at++
                  }
                  for len(pq) > 0 && pq[0]%shift < q {
                      hpPop(&pq)
                  }
                  if len(pq) > 0 {
                      ans[j] = pq[0] / shift
                  } else {
                      ans[j] = -1
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          import java.util.PriorityQueue

          fun minInterval(intervals: Array<IntArray>, queries: IntArray): IntArray {
              val ivs = intervals.sortedBy { it[0] }
              val order = queries.indices.sortedBy { queries[it] }
              // (size, right) of started intervals, smallest size on top
              val heap = PriorityQueue<IntArray>(Comparator { a, b -> a[0].compareTo(b[0]) })
              val ans = IntArray(queries.size) { -1 }
              var at = 0
              for (j in order) {
                  val q = queries[j]
                  while (at < ivs.size && ivs[at][0] <= q) {
                      heap.add(intArrayOf(ivs[at][1] - ivs[at][0] + 1, ivs[at][1]))
                      at++
                  }
                  while (heap.isNotEmpty() && heap.peek()[1] < q) heap.poll()
                  if (heap.isNotEmpty()) ans[j] = heap.peek()[0]
              }
              return ans
          }
        `,
        swift: code`
          func hpPush(_ h: inout [Int], _ v: Int) {
              h.append(v)
              var i = h.count - 1
              while i > 0 {
                  let p = (i - 1) / 2
                  if h[p] <= h[i] { break }
                  h.swapAt(p, i)
                  i = p
              }
          }

          func hpPop(_ h: inout [Int]) -> Int {
              let top = h[0]
              let last = h.removeLast()
              if !h.isEmpty {
                  h[0] = last
                  var j = 0
                  while true {
                      let l = 2 * j + 1, r = l + 1
                      var s = j
                      if l < h.count && h[l] < h[s] { s = l }
                      if r < h.count && h[r] < h[s] { s = r }
                      if s == j { break }
                      h.swapAt(s, j)
                      j = s
                  }
              }
              return top
          }

          func minInterval(_ intervals: [[Int]], _ queries: [Int]) -> [Int] {
              let shift = 16777216 // 2^24: sizes and right ends both stay below it
              let ivs = intervals.sorted { $0[0] < $1[0] }
              let order = (0..<queries.count).sorted { queries[$0] < queries[$1] }
              var heap = [Int]() // min-heap of size * shift + right
              var ans = [Int](repeating: -1, count: queries.count)
              var at = 0
              for j in order {
                  let q = queries[j]
                  while at < ivs.count && ivs[at][0] <= q {
                      hpPush(&heap, (ivs[at][1] - ivs[at][0] + 1) * shift + ivs[at][1])
                      at += 1
                  }
                  while !heap.isEmpty && heap[0] % shift < q { _ = hpPop(&heap) }
                  if !heap.isEmpty { ans[j] = heap[0] / shift }
              }
              return ans
          }
        `,
        rust: code`
          use std::cmp::Reverse;
          use std::collections::BinaryHeap;

          fn minInterval(intervals: Vec<Vec<i32>>, queries: Vec<i32>) -> Vec<i32> {
              let mut ivs = intervals.clone();
              ivs.sort();
              let mut order: Vec<usize> = (0..queries.len()).collect();
              order.sort_by_key(|&j| queries[j]);
              // (size, right) of started intervals, smallest size on top
              let mut heap: BinaryHeap<Reverse<(i32, i32)>> = BinaryHeap::new();
              let mut ans = vec![-1; queries.len()];
              let mut at = 0usize;
              for &j in order.iter() {
                  let q = queries[j];
                  while at < ivs.len() && ivs[at][0] <= q {
                      heap.push(Reverse((ivs[at][1] - ivs[at][0] + 1, ivs[at][1])));
                      at += 1;
                  }
                  while let Some(&Reverse((_, right))) = heap.peek() {
                      if right < q {
                          heap.pop();
                      } else {
                          break;
                      }
                  }
                  if let Some(&Reverse((size, _))) = heap.peek() {
                      ans[j] = size;
                  }
              }
              ans
          }
        `,
        php: code`
          function minInterval($intervals, $queries) {
              $shift = 16777216; // 2^24: sizes and right ends both stay below it
              $ivs = $intervals;
              usort($ivs, function ($a, $b) { return $a[0] <=> $b[0]; });
              $order = array_keys($queries);
              usort($order, function ($a, $b) use ($queries) { return $queries[$a] <=> $queries[$b]; });
              $heap = new \SplMinHeap(); // size * shift + right
              $ans = array_fill(0, count($queries), -1);
              $at = 0;
              $n = count($ivs);
              foreach ($order as $j) {
                  $q = $queries[$j];
                  while ($at < $n && $ivs[$at][0] <= $q) {
                      $heap->insert(($ivs[$at][1] - $ivs[$at][0] + 1) * $shift + $ivs[$at][1]);
                      $at++;
                  }
                  while (!$heap->isEmpty() && $heap->top() % $shift < $q) $heap->extract();
                  if (!$heap->isEmpty()) $ans[$j] = intdiv($heap->top(), $shift);
              }
              return $ans;
          }
        `,
        ruby: code`
          def hp_push(h, v)
            h << v
            i = h.length - 1
            while i > 0
              par = (i - 1) / 2
              break if h[par] <= h[i]
              h[par], h[i] = h[i], h[par]
              i = par
            end
          end

          def hp_pop(h)
            top = h[0]
            last = h.pop
            unless h.empty?
              h[0] = last
              j = 0
              loop do
                l = 2 * j + 1
                r = l + 1
                s = j
                s = l if l < h.length && h[l] < h[s]
                s = r if r < h.length && h[r] < h[s]
                break if s == j
                h[s], h[j] = h[j], h[s]
                j = s
              end
            end
            top
          end

          def minInterval(intervals, queries)
            shift = 16_777_216 # 2^24: sizes and right ends both stay below it
            ivs = intervals.sort_by { |iv| iv[0] }
            order = (0...queries.length).sort_by { |j| queries[j] }
            heap = [] # min-heap of size * shift + right
            ans = Array.new(queries.length, -1)
            at = 0
            order.each do |j|
              q = queries[j]
              while at < ivs.length && ivs[at][0] <= q
                hp_push(heap, (ivs[at][1] - ivs[at][0] + 1) * shift + ivs[at][1])
                at += 1
              end
              hp_pop(heap) while !heap.empty? && heap[0] % shift < q
              ans[j] = heap[0] / shift unless heap.empty?
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Course Schedule III (LC 630) ─────────────────────────────────
  (() => {
    // Exact DP, independent of the heap: in deadline order, best[c] is the
    // least total time that completes c courses.
    const ref = (courses: number[][]) => {
      const cs = courses.slice().sort((a, b) => a[1] - b[1]);
      const INF = Number.MAX_SAFE_INTEGER;
      const best = new Array(cs.length + 1).fill(INF);
      best[0] = 0;
      for (const [d, last] of cs) {
        for (let c = cs.length - 1; c >= 0; c--) {
          if (best[c] !== INF && best[c] + d <= last && best[c] + d < best[c + 1]) best[c + 1] = best[c] + d;
        }
      }
      let ans = 0;
      for (let c = 0; c <= cs.length; c++) if (best[c] !== INF) ans = c;
      return ans;
    };
    return {
      slug: "course-schedule-iii",
      title: "Course Schedule III",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Sorting", "Heap (Priority Queue)", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "scheduleCourse", params: [{ name: "courses", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "There are `n` online courses. Course `i` is `courses[i] = [duration, lastDay]`: it takes `duration` consecutive days and must be **finished on or before** day `lastDay`.\n\nYou start on day 1 and can study only one course at a time; a course taken from day `s` occupies days `s` through `s + duration - 1`. Courses you skip cost nothing.\n\nReturn the **maximum number of courses** you can complete.",
        [
          { in: "courses = [[3,5],[2,4],[4,9],[5,9]]", out: "3", note: "Take the 2-day course (done day 2), the 3-day one (done day 5) and the 4-day one (done day 9). All four would need 14 days." },
          { in: "courses = [[1,2]]", out: "1" },
          { in: "courses = [[3,2],[4,3]]", out: "0", note: "Neither course fits before its own deadline." },
        ],
        ["1 <= courses.length <= 10^4", "1 <= duration, lastDay <= 10^4"]),
      hints: [
        "Any set of courses that can be completed can be completed in order of their deadlines.",
        "Walk the courses by deadline and tentatively take each one, tracking the total time used.",
        "If the total overshoots the current deadline, drop the longest course taken so far (a max-heap) — that frees the most time for the same count.",
      ],
      editorial: explain({
        idea: "Two facts make a greedy work: a feasible set stays feasible when sorted by deadline, and when a new course pushes the total time past its deadline, removing the **longest** course taken so far keeps the count while leaving the most slack for the future.",
        steps: [
          "Sort the courses by `lastDay`.",
          "Keep `time` (days used) and a max-heap of the durations taken.",
          "For each course: add its duration to `time` and push it. If `time > lastDay`, pop the largest duration and subtract it.",
          "Return the heap size.",
        ],
        why: "By an exchange argument, among all ways to complete `k` courses from the first `i` (in deadline order), the greedy keeps one with the smallest total time — after each step the heap holds the best set of its size. Adding a course either fits (count grows) or does not, in which case dropping the longest duration (possibly the new one) keeps the count and minimises time. Because later deadlines are larger, a smaller total time is never worse for anything that follows.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Sorting by duration instead of deadline fails: a short course with a far deadline should wait.",
          "When the overshoot happens, the course to drop may be the one just added — push first, then pop the maximum.",
          "A course whose `duration` exceeds its own `lastDay` can never be kept; the push-then-pop handles it without a special case.",
        ],
      }),
      examples: [
        { input: "[[3,5],[2,4],[4,9],[5,9]]", expectedOutput: "3" },
        { input: "[[1,2]]", expectedOutput: "1" },
        { input: "[[3,2],[4,3]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 30]));
        const dTop = pick(rng, [3, 20, 10000]);
        const lTop = pick(rng, [dTop, dTop * 3, 10000]);
        const courses = Array.from({ length: n }, () => [ri(rng, 1, dTop), ri(rng, 1, Math.min(10000, lTop))]);
        return { input: fmtIntMat(courses), expectedOutput: String(ref(courses)) };
      },
      solutions: {
        python: code`
          from typing import List
          import heapq

          def scheduleCourse(courses: List[List[int]]) -> int:
              heap = []  # negated durations of the courses kept
              time = 0
              for duration, last in sorted(courses, key=lambda c: c[1]):
                  time += duration
                  heapq.heappush(heap, -duration)
                  if time > last:
                      time += heapq.heappop(heap)  # drop the longest course so far
              return len(heap)
        `,
        javascript: code`
          var scheduleCourse = function(courses) {
              var cs = courses.slice().sort(function(a, b) { return a[1] - b[1]; });
              var heap = []; // negated durations of the courses kept
              var time = 0;
              for (var i = 0; i < cs.length; i++) {
                  time += cs[i][0];
                  heapPush(heap, -cs[i][0]);
                  if (time > cs[i][1]) time += heapPop(heap); // drop the longest course so far
              }
              return heap.length;
          };

          var heapPush = function(h, v) {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          };

          var heapPop = function(h) {
              var top = h[0];
              var last = h.pop();
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          };
        `,
        typescript: code`
          function heapPush(h: number[], v: number): void {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          function heapPop(h: number[]): number {
              var top = h[0];
              var last = h.pop() as number;
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          function scheduleCourse(courses: number[][]): number {
              var cs = courses.slice().sort(function(a, b) { return a[1] - b[1]; });
              var heap: number[] = []; // negated durations of the courses kept
              var time = 0;
              for (var i = 0; i < cs.length; i++) {
                  time += cs[i][0];
                  heapPush(heap, -cs[i][0]);
                  if (time > cs[i][1]) time += heapPop(heap); // drop the longest course so far
              }
              return heap.length;
          }
        `,
        java: code`
          public static int scheduleCourse(int[][] courses) {
              int[][] cs = courses.clone();
              Arrays.sort(cs, (a, b) -> Integer.compare(a[1], b[1]));
              PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());
              int time = 0;
              for (int[] c : cs) {
                  time += c[0];
                  heap.add(c[0]);
                  if (time > c[1]) time -= heap.poll(); // drop the longest course so far
              }
              return heap.size();
          }
        `,
        cpp: code`
          int scheduleCourse(vector<vector<int>>& courses) {
              vector<vector<int>> cs = courses;
              sort(cs.begin(), cs.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });
              priority_queue<int> heap;
              int time = 0;
              for (auto& c : cs) {
                  time += c[0];
                  heap.push(c[0]);
                  if (time > c[1]) {
                      time -= heap.top(); // drop the longest course so far
                      heap.pop();
                  }
              }
              return heap.size();
          }
        `,
        c: code`
          static void hpPush(long long* h, int* size, long long v) {
              int i = (*size)++;
              h[i] = v;
              while (i > 0) {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long long hpPop(long long* h, int* size) {
              long long top = h[0];
              (*size)--;
              if (*size > 0) {
                  h[0] = h[*size];
                  int j = 0;
                  for (;;) {
                      int l = 2 * j + 1, r = l + 1, s = j;
                      if (l < *size && h[l] < h[s]) s = l;
                      if (r < *size && h[r] < h[s]) s = r;
                      if (s == j) break;
                      long long t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          static int cmpByDeadline(const void* a, const void* b) {
              const int* x = *(const int* const*) a;
              const int* y = *(const int* const*) b;
              return (x[1] > y[1]) - (x[1] < y[1]);
          }

          int scheduleCourse(int** courses, int coursesSize, int* coursesColSize) {
              int** cs = (int**) malloc((size_t) (coursesSize + 1) * sizeof(int*));
              for (int i = 0; i < coursesSize; i++) cs[i] = courses[i];
              qsort(cs, (size_t) coursesSize, sizeof(int*), cmpByDeadline);
              // A max-heap of durations kept as a min-heap of negated values.
              long long* heap = (long long*) malloc((size_t) (coursesSize + 1) * sizeof(long long));
              int size = 0;
              long long time = 0;
              for (int i = 0; i < coursesSize; i++) {
                  time += cs[i][0];
                  hpPush(heap, &size, -(long long) cs[i][0]);
                  if (time > cs[i][1]) time += hpPop(heap, &size); // drop the longest course so far
              }
              free(cs);
              free(heap);
              return size;
          }
        `,
        csharp: code`
          static void HeapPush(List<long> h, long v)
          {
              h.Add(v);
              int i = h.Count - 1;
              while (i > 0)
              {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long HeapPop(List<long> h)
          {
              long top = h[0];
              int last = h.Count - 1;
              h[0] = h[last];
              h.RemoveAt(last);
              int j = 0;
              while (true)
              {
                  int l = 2 * j + 1, r = l + 1, s = j;
                  if (l < h.Count && h[l] < h[s]) s = l;
                  if (r < h.Count && h[r] < h[s]) s = r;
                  if (s == j) break;
                  long t = h[s]; h[s] = h[j]; h[j] = t;
                  j = s;
              }
              return top;
          }

          public static int ScheduleCourse(int[][] courses)
          {
              var cs = (int[][]) courses.Clone();
              Array.Sort(cs, (a, b) => a[1].CompareTo(b[1]));
              var heap = new List<long>(); // negated durations of the courses kept
              long time = 0;
              foreach (var c in cs)
              {
                  time += c[0];
                  HeapPush(heap, -c[0]);
                  if (time > c[1]) time += HeapPop(heap); // drop the longest course so far
              }
              return heap.Count;
          }
        `,
        go: code`
          func hpPush(h *[]int, v int) {
              *h = append(*h, v)
              a := *h
              i := len(a) - 1
              for i > 0 {
                  p := (i - 1) / 2
                  if a[p] <= a[i] {
                      break
                  }
                  a[p], a[i] = a[i], a[p]
                  i = p
              }
          }

          func hpPop(h *[]int) int {
              a := *h
              top := a[0]
              last := len(a) - 1
              a[0] = a[last]
              a = a[:last]
              j := 0
              for {
                  l, r, s := 2*j+1, 2*j+2, j
                  if l < len(a) && a[l] < a[s] {
                      s = l
                  }
                  if r < len(a) && a[r] < a[s] {
                      s = r
                  }
                  if s == j {
                      break
                  }
                  a[s], a[j] = a[j], a[s]
                  j = s
              }
              *h = a
              return top
          }

          func scheduleCourse(courses [][]int) int {
              cs := make([][]int, len(courses))
              copy(cs, courses)
              sort.Slice(cs, func(a, b int) bool { return cs[a][1] < cs[b][1] })
              pq := []int{} // negated durations of the courses kept
              used := 0
              for _, c := range cs {
                  used += c[0]
                  hpPush(&pq, -c[0])
                  if used > c[1] {
                      used += hpPop(&pq) // drop the longest course so far
                  }
              }
              return len(pq)
          }
        `,
        kotlin: code`
          import java.util.PriorityQueue

          fun scheduleCourse(courses: Array<IntArray>): Int {
              val cs = courses.sortedBy { it[1] }
              val heap = PriorityQueue<Int>(reverseOrder<Int>())
              var time = 0
              for (c in cs) {
                  time += c[0]
                  heap.add(c[0])
                  if (time > c[1]) time -= heap.poll() // drop the longest course so far
              }
              return heap.size
          }
        `,
        swift: code`
          func hpPush(_ h: inout [Int], _ v: Int) {
              h.append(v)
              var i = h.count - 1
              while i > 0 {
                  let p = (i - 1) / 2
                  if h[p] <= h[i] { break }
                  h.swapAt(p, i)
                  i = p
              }
          }

          func hpPop(_ h: inout [Int]) -> Int {
              let top = h[0]
              let last = h.removeLast()
              if !h.isEmpty {
                  h[0] = last
                  var j = 0
                  while true {
                      let l = 2 * j + 1, r = l + 1
                      var s = j
                      if l < h.count && h[l] < h[s] { s = l }
                      if r < h.count && h[r] < h[s] { s = r }
                      if s == j { break }
                      h.swapAt(s, j)
                      j = s
                  }
              }
              return top
          }

          func scheduleCourse(_ courses: [[Int]]) -> Int {
              let cs = courses.sorted { $0[1] < $1[1] }
              var heap = [Int]() // negated durations of the courses kept
              var time = 0
              for c in cs {
                  time += c[0]
                  hpPush(&heap, -c[0])
                  if time > c[1] { time += hpPop(&heap) } // drop the longest course so far
              }
              return heap.count
          }
        `,
        rust: code`
          use std::collections::BinaryHeap;

          fn scheduleCourse(courses: Vec<Vec<i32>>) -> i32 {
              let mut cs = courses.clone();
              cs.sort_by_key(|c| c[1]);
              let mut heap: BinaryHeap<i32> = BinaryHeap::new();
              let mut time = 0i32;
              for c in cs.iter() {
                  time += c[0];
                  heap.push(c[0]);
                  if time > c[1] {
                      time -= heap.pop().unwrap(); // drop the longest course so far
                  }
              }
              heap.len() as i32
          }
        `,
        php: code`
          function scheduleCourse($courses) {
              $cs = $courses;
              usort($cs, function ($a, $b) { return $a[1] <=> $b[1]; });
              $heap = new \SplMaxHeap();
              $time = 0;
              foreach ($cs as $c) {
                  $time += $c[0];
                  $heap->insert($c[0]);
                  if ($time > $c[1]) $time -= $heap->extract(); // drop the longest course so far
              }
              return $heap->count();
          }
        `,
        ruby: code`
          def hp_push(h, v)
            h << v
            i = h.length - 1
            while i > 0
              par = (i - 1) / 2
              break if h[par] <= h[i]
              h[par], h[i] = h[i], h[par]
              i = par
            end
          end

          def hp_pop(h)
            top = h[0]
            last = h.pop
            unless h.empty?
              h[0] = last
              j = 0
              loop do
                l = 2 * j + 1
                r = l + 1
                s = j
                s = l if l < h.length && h[l] < h[s]
                s = r if r < h.length && h[r] < h[s]
                break if s == j
                h[s], h[j] = h[j], h[s]
                j = s
              end
            end
            top
          end

          def scheduleCourse(courses)
            heap = [] # negated durations of the courses kept
            time = 0
            courses.sort_by { |c| c[1] }.each do |c|
              time += c[0]
              hp_push(heap, -c[0])
              time += hp_pop(heap) if time > c[1] # drop the longest course so far
            end
            heap.length
          end
        `,
      },
    };
  })(),

  // ── Mark Elements on Array by Performing Queries (LC 3080) ──────
  (() => {
    const ref = (nums: number[], queries: number[][]) => {
      const marked = nums.map(() => false);
      let total = nums.reduce((s, v) => s + v, 0);
      const out: number[] = [];
      for (const [index, k] of queries) {
        if (!marked[index]) { marked[index] = true; total -= nums[index]; }
        for (let t = 0; t < k; t++) {
          let bi = -1;
          for (let i = 0; i < nums.length; i++) if (!marked[i] && (bi < 0 || nums[i] < nums[bi])) bi = i;
          if (bi < 0) break;
          marked[bi] = true;
          total -= nums[bi];
        }
        out.push(total);
      }
      return out;
    };
    return {
      slug: "mark-elements-on-array-by-performing-queries",
      title: "Mark Elements on Array by Performing Queries",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sorting", "Heap (Priority Queue)", "Google", "Amazon"],
      signature: {
        funcName: "unmarkedSumArray",
        params: [{ name: "nums", type: "int[]" as const }, { name: "queries", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "You are given an array `nums` of `n` positive integers, all initially **unmarked**, and `m` queries where `queries[i] = [index, k]`. Apply the queries in order. Query `i` does two things:\n\n1. Mark `nums[index]` if it is not marked yet.\n2. Then mark the `k` unmarked elements with the **smallest values**; among equal values, the smaller index goes first. If fewer than `k` elements are unmarked, mark all of them.\n\nReturn an array `answer` of length `m` where `answer[i]` is the sum of the unmarked elements right after query `i`.\n\n*Constraint note:* values are capped at `10^4` (the original allows `10^5`) so every sum fits in a 32-bit integer.",
        [
          { in: "nums = [4,1,3,1,5], queries = [[2,1],[0,2],[4,0]]", out: "[10,0,0]", note: "Query 1 marks index 2 (3) and then the smallest value, the 1 at index 1: unmarked 4+1+5 = 10. Query 2 marks index 0 and then the 1 at index 3 and the 5: nothing is left." },
          { in: "nums = [2,7,2], queries = [[1,1]]", out: "[2]", note: "Index 1 (7) is marked, then the 2 at index 0 (the lower index wins the tie)." },
        ],
        ["n == nums.length", "m == queries.length", "1 <= m <= n <= 10^5", "1 <= nums[i] <= 10^4", "queries[i].length == 2", "0 <= index_i, k_i <= n - 1"]),
      hints: [
        "Keep a running total of the unmarked values and subtract each element the moment it is marked.",
        "Every \"smallest unmarked\" request scans the elements in one fixed order: by value, then by index.",
        "Sort the indices once by `(value, index)` and keep a pointer into that order that only moves forward, skipping anything already marked.",
      ],
      editorial: explain({
        idea: "The order in which step 2 consumes elements never changes — ascending value, ties by index — so precompute it once (sorting, or a min-heap of `(value, index)`) and walk it with a single pointer, skipping elements that query step 1 already marked.",
        steps: [
          "Compute `total`, the sum of all values, and a boolean `marked` array.",
          "Sort the indices by `(nums[i], i)` into `order`; set pointer `p = 0`.",
          "For each query `[index, k]`: if `index` is unmarked, mark it and subtract its value.",
          "While `k > 0` and `p < n`: take `i = order[p++]`; if it is unmarked, mark it, subtract its value and decrement `k`.",
          "Append `total` to the answer.",
        ],
        why: "Step 2 always wants the first unmarked element of `order`. Everything before `p` is marked (either the pointer marked it or it was skipped because it already was), so the first unmarked element is at or after `p` — the pointer never has to move back. Each index is passed by the pointer once, so all queries together cost `O(n)` after the sort.",
        time: "O(n log n + m)",
        space: "O(n)",
        pitfalls: [
          "An element marked by step 1 may still appear later in `order`; skip it without spending one of the `k` marks on it.",
          "Ties must go to the smaller index — sort by the pair, not by value alone.",
          "The answer can drop to 0 and stay there; `k` may be 0, in which case only step 1 happens.",
        ],
      }),
      examples: [
        { input: "[4,1,3,1,5]\n[[2,1],[0,2],[4,0]]", expectedOutput: "[10,0,0]" },
        { input: "[2,7,2]\n[[1,1]]", expectedOutput: "[2]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 30]));
        const top = pick(rng, [1, 3, 20, 10000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const m = ri(rng, 1, n);
        const kTop = pick(rng, [0, 1, 3, n - 1]);
        const queries = Array.from({ length: m }, () => [ri(rng, 0, n - 1), ri(rng, 0, Math.min(n - 1, kTop))]);
        return { input: `${fmtIntArr(nums)}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(nums, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def unmarkedSumArray(nums: List[int], queries: List[List[int]]) -> List[int]:
              n = len(nums)
              order = sorted(range(n), key=lambda i: (nums[i], i))
              marked = [False] * n
              total = sum(nums)
              p = 0
              ans = []
              for index, k in queries:
                  if not marked[index]:
                      marked[index] = True
                      total -= nums[index]
                  while k > 0 and p < n:
                      i = order[p]
                      p += 1
                      if not marked[i]:
                          marked[i] = True
                          total -= nums[i]
                          k -= 1
                  ans.append(total)
              return ans
        `,
        javascript: code`
          var unmarkedSumArray = function(nums, queries) {
              var n = nums.length;
              var order = [];
              var marked = [];
              var total = 0;
              for (var i = 0; i < n; i++) {
                  order.push(i);
                  marked.push(false);
                  total += nums[i];
              }
              order.sort(function(a, b) { return nums[a] - nums[b] || a - b; });
              var p = 0;
              var ans = [];
              for (var q = 0; q < queries.length; q++) {
                  var index = queries[q][0], k = queries[q][1];
                  if (!marked[index]) {
                      marked[index] = true;
                      total -= nums[index];
                  }
                  while (k > 0 && p < n) {
                      var j = order[p++];
                      if (!marked[j]) {
                          marked[j] = true;
                          total -= nums[j];
                          k--;
                      }
                  }
                  ans.push(total);
              }
              return ans;
          };
        `,
        typescript: code`
          function unmarkedSumArray(nums: number[], queries: number[][]): number[] {
              var n = nums.length;
              var order: number[] = [];
              var marked: boolean[] = [];
              var total = 0;
              for (var i = 0; i < n; i++) {
                  order.push(i);
                  marked.push(false);
                  total += nums[i];
              }
              order.sort(function(a, b) { return nums[a] - nums[b] || a - b; });
              var p = 0;
              var ans: number[] = [];
              for (var q = 0; q < queries.length; q++) {
                  var index = queries[q][0], k = queries[q][1];
                  if (!marked[index]) {
                      marked[index] = true;
                      total -= nums[index];
                  }
                  while (k > 0 && p < n) {
                      var j = order[p++];
                      if (!marked[j]) {
                          marked[j] = true;
                          total -= nums[j];
                          k--;
                      }
                  }
                  ans.push(total);
              }
              return ans;
          }
        `,
        java: code`
          public static int[] unmarkedSumArray(int[] nums, int[][] queries) {
              int n = nums.length;
              Integer[] order = new Integer[n];
              int total = 0;
              for (int i = 0; i < n; i++) {
                  order[i] = i;
                  total += nums[i];
              }
              Arrays.sort(order, (a, b) -> nums[a] != nums[b] ? Integer.compare(nums[a], nums[b]) : Integer.compare(a, b));
              boolean[] marked = new boolean[n];
              int p = 0;
              int[] ans = new int[queries.length];
              for (int q = 0; q < queries.length; q++) {
                  int index = queries[q][0], k = queries[q][1];
                  if (!marked[index]) {
                      marked[index] = true;
                      total -= nums[index];
                  }
                  while (k > 0 && p < n) {
                      int j = order[p++];
                      if (!marked[j]) {
                          marked[j] = true;
                          total -= nums[j];
                          k--;
                      }
                  }
                  ans[q] = total;
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> unmarkedSumArray(vector<int>& nums, vector<vector<int>>& queries) {
              int n = nums.size();
              vector<int> order(n);
              long long total = 0;
              for (int i = 0; i < n; i++) {
                  order[i] = i;
                  total += nums[i];
              }
              sort(order.begin(), order.end(), [&](int a, int b) {
                  return nums[a] != nums[b] ? nums[a] < nums[b] : a < b;
              });
              vector<bool> marked(n, false);
              int p = 0;
              vector<int> ans;
              for (auto& qu : queries) {
                  int index = qu[0], k = qu[1];
                  if (!marked[index]) {
                      marked[index] = true;
                      total -= nums[index];
                  }
                  while (k > 0 && p < n) {
                      int j = order[p++];
                      if (!marked[j]) {
                          marked[j] = true;
                          total -= nums[j];
                          k--;
                      }
                  }
                  ans.push_back((int) total);
              }
              return ans;
          }
        `,
        c: code`
          static int cmpLL(const void* a, const void* b) {
              long long x = *(const long long*) a, y = *(const long long*) b;
              return (x > y) - (x < y);
          }

          int* unmarkedSumArray(int* nums, int numsSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int n = numsSize;
              // Indices ordered by (value, index), packed as value * 2^17 + index.
              long long* order = (long long*) malloc((size_t) (n + 1) * sizeof(long long));
              char* marked = (char*) calloc((size_t) (n + 1), 1);
              long long total = 0;
              for (int i = 0; i < n; i++) {
                  order[i] = (long long) nums[i] * 131072 + i;
                  total += nums[i];
              }
              qsort(order, (size_t) n, sizeof(long long), cmpLL);
              int p = 0;
              int* ans = (int*) malloc((size_t) (queriesSize + 1) * sizeof(int));
              for (int q = 0; q < queriesSize; q++) {
                  int index = queries[q][0], k = queries[q][1];
                  if (!marked[index]) {
                      marked[index] = 1;
                      total -= nums[index];
                  }
                  while (k > 0 && p < n) {
                      int j = (int) (order[p++] % 131072);
                      if (!marked[j]) {
                          marked[j] = 1;
                          total -= nums[j];
                          k--;
                      }
                  }
                  ans[q] = (int) total;
              }
              free(order);
              free(marked);
              *returnSize = queriesSize;
              return ans;
          }
        `,
        csharp: code`
          public static int[] UnmarkedSumArray(int[] nums, int[][] queries)
          {
              int n = nums.Length;
              var order = new int[n];
              long total = 0;
              for (int i = 0; i < n; i++)
              {
                  order[i] = i;
                  total += nums[i];
              }
              Array.Sort(order, (a, b) => nums[a] != nums[b] ? nums[a].CompareTo(nums[b]) : a.CompareTo(b));
              var marked = new bool[n];
              int p = 0;
              var ans = new int[queries.Length];
              for (int q = 0; q < queries.Length; q++)
              {
                  int index = queries[q][0], k = queries[q][1];
                  if (!marked[index])
                  {
                      marked[index] = true;
                      total -= nums[index];
                  }
                  while (k > 0 && p < n)
                  {
                      int j = order[p++];
                      if (!marked[j])
                      {
                          marked[j] = true;
                          total -= nums[j];
                          k--;
                      }
                  }
                  ans[q] = (int) total;
              }
              return ans;
          }
        `,
        go: code`
          func unmarkedSumArray(nums []int, queries [][]int) []int {
              n := len(nums)
              order := make([]int, n)
              total := 0
              for i := 0; i < n; i++ {
                  order[i] = i
                  total += nums[i]
              }
              sort.Slice(order, func(a, b int) bool {
                  x, y := order[a], order[b]
                  if nums[x] != nums[y] {
                      return nums[x] < nums[y]
                  }
                  return x < y
              })
              marked := make([]bool, n)
              p := 0
              ans := make([]int, len(queries))
              for q, qu := range queries {
                  index, k := qu[0], qu[1]
                  if !marked[index] {
                      marked[index] = true
                      total -= nums[index]
                  }
                  for k > 0 && p < n {
                      j := order[p]
                      p++
                      if !marked[j] {
                          marked[j] = true
                          total -= nums[j]
                          k--
                      }
                  }
                  ans[q] = total
              }
              return ans
          }
        `,
        kotlin: code`
          fun unmarkedSumArray(nums: IntArray, queries: Array<IntArray>): IntArray {
              val n = nums.size
              val order = (0 until n).sortedWith(compareBy<Int>({ nums[it] }, { it }))
              val marked = BooleanArray(n)
              var total = 0L
              for (v in nums) total += v
              var p = 0
              val ans = IntArray(queries.size)
              for (q in queries.indices) {
                  val index = queries[q][0]
                  var k = queries[q][1]
                  if (!marked[index]) {
                      marked[index] = true
                      total -= nums[index]
                  }
                  while (k > 0 && p < n) {
                      val j = order[p++]
                      if (!marked[j]) {
                          marked[j] = true
                          total -= nums[j]
                          k--
                      }
                  }
                  ans[q] = total.toInt()
              }
              return ans
          }
        `,
        swift: code`
          func unmarkedSumArray(_ nums: [Int], _ queries: [[Int]]) -> [Int] {
              let n = nums.count
              let order = (0..<n).sorted { nums[$0] != nums[$1] ? nums[$0] < nums[$1] : $0 < $1 }
              var marked = [Bool](repeating: false, count: n)
              var total = nums.reduce(0, +)
              var p = 0
              var ans = [Int]()
              for qu in queries {
                  let index = qu[0]
                  var k = qu[1]
                  if !marked[index] {
                      marked[index] = true
                      total -= nums[index]
                  }
                  while k > 0 && p < n {
                      let j = order[p]
                      p += 1
                      if !marked[j] {
                          marked[j] = true
                          total -= nums[j]
                          k -= 1
                      }
                  }
                  ans.append(total)
              }
              return ans
          }
        `,
        rust: code`
          fn unmarkedSumArray(nums: Vec<i32>, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let n = nums.len();
              let mut order: Vec<usize> = (0..n).collect();
              order.sort_by_key(|&i| (nums[i], i));
              let mut marked = vec![false; n];
              let mut total: i64 = nums.iter().map(|&v| v as i64).sum();
              let mut p = 0usize;
              let mut ans: Vec<i32> = Vec::with_capacity(queries.len());
              for qu in queries.iter() {
                  let index = qu[0] as usize;
                  let mut k = qu[1];
                  if !marked[index] {
                      marked[index] = true;
                      total -= nums[index] as i64;
                  }
                  while k > 0 && p < n {
                      let j = order[p];
                      p += 1;
                      if !marked[j] {
                          marked[j] = true;
                          total -= nums[j] as i64;
                          k -= 1;
                      }
                  }
                  ans.push(total as i32);
              }
              ans
          }
        `,
        php: code`
          function unmarkedSumArray($nums, $queries) {
              $n = count($nums);
              $order = range(0, $n - 1);
              usort($order, function ($a, $b) use ($nums) {
                  if ($nums[$a] != $nums[$b]) return $nums[$a] <=> $nums[$b];
                  return $a <=> $b;
              });
              $marked = array_fill(0, $n, false);
              $total = array_sum($nums);
              $p = 0;
              $ans = [];
              foreach ($queries as $qu) {
                  $index = $qu[0];
                  $k = $qu[1];
                  if (!$marked[$index]) {
                      $marked[$index] = true;
                      $total -= $nums[$index];
                  }
                  while ($k > 0 && $p < $n) {
                      $j = $order[$p++];
                      if (!$marked[$j]) {
                          $marked[$j] = true;
                          $total -= $nums[$j];
                          $k--;
                      }
                  }
                  $ans[] = $total;
              }
              return $ans;
          }
        `,
        ruby: code`
          def unmarkedSumArray(nums, queries)
            n = nums.length
            order = (0...n).sort_by { |i| [nums[i], i] }
            marked = Array.new(n, false)
            total = nums.sum
            p = 0
            queries.map do |index, k|
              unless marked[index]
                marked[index] = true
                total -= nums[index]
              end
              while k > 0 && p < n
                j = order[p]
                p += 1
                next if marked[j]
                marked[j] = true
                total -= nums[j]
                k -= 1
              end
              total
            end
          end
        `,
      },
    };
  })(),

  // ── Reward Top K Students (LC 2512) ──────────────────────────────
  (() => {
    const ref = (pos: string[], neg: string[], report: string[], ids: number[], k: number) => {
      const P = new Set(pos), N = new Set(neg);
      const rows = report.map((text, i) => {
        let pts = 0;
        for (const w of text.split(" ")) pts += P.has(w) ? 3 : N.has(w) ? -1 : 0;
        return [pts, ids[i]];
      });
      rows.sort((a, b) => b[0] - a[0] || a[1] - b[1]);
      return rows.slice(0, k).map((r) => r[1]);
    };
    return {
      slug: "reward-top-k-students",
      title: "Reward Top K Students",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Sorting", "Heap (Priority Queue)", "Amazon", "Google"],
      signature: {
        funcName: "topStudents",
        params: [
          { name: "positiveFeedback", type: "string[]" as const },
          { name: "negativeFeedback", type: "string[]" as const },
          { name: "report", type: "string[]" as const },
          { name: "studentId", type: "int[]" as const },
          { name: "k", type: "int" as const },
        ],
        returns: "int[]" as const,
      },
      description: describe(
        "A mentor writes one feedback report per student. Words in `positiveFeedback` signal praise and words in `negativeFeedback` signal criticism; no word is in both lists.\n\nEvery student starts with 0 points. Each occurrence of a positive word in a student's report adds **3** points, and each occurrence of a negative word subtracts **1**. Report `report[i]` belongs to the student with id `studentId[i]`; reports are lowercase words separated by single spaces, and ids are distinct.\n\nRank the students by points, **highest first**; students with equal points are ranked by **smaller id first**. Return the ids of the top `k` students in rank order.",
        [
          { in: "positiveFeedback = [\"sharp\",\"kind\"], negativeFeedback = [\"late\",\"rude\"], report = [\"sharp and kind\",\"late again\",\"kind but late\"], studentId = [7,3,5], k = 2", out: "[7,5]", note: "Student 7 scores 6, student 5 scores 3 - 1 = 2, student 3 scores -1." },
          { in: "positiveFeedback = [\"sharp\",\"kind\"], negativeFeedback = [\"late\",\"rude\"], report = [\"rude\",\"late\"], studentId = [4,2], k = 1", out: "[2]", note: "Both score -1; the smaller id ranks first." },
        ],
        [
          "1 <= positiveFeedback.length, negativeFeedback.length <= 10^4",
          "1 <= positiveFeedback[i].length, negativeFeedback[j].length <= 100",
          "the feedback words are lowercase English letters; no word is in both lists",
          "n == report.length == studentId.length",
          "1 <= n <= 10^4",
          "report[i] is lowercase words separated by single spaces, 1 <= report[i].length <= 100",
          "1 <= studentId[i] <= 10^9, all distinct",
          "1 <= k <= n",
        ]),
      hints: [
        "Put both word lists into hash sets so each word of a report is classified in O(1).",
        "Score every report by splitting it on spaces: +3 for a positive word, -1 for a negative one.",
        "Sort `(points descending, id ascending)` and take the first `k` — or keep a size-`k` heap if `k` is much smaller than `n`.",
      ],
      editorial: explain({
        idea: "Scoring is a hash-set lookup per word; ranking is a sort by a composite key. The only care needed is the tie rule.",
        steps: [
          "Build sets from `positiveFeedback` and `negativeFeedback`.",
          "For each report, split it into words and add 3 or subtract 1 per word found in a set.",
          "Sort the `(points, id)` pairs by points descending, then id ascending.",
          "Return the ids of the first `k` pairs.",
        ],
        why: "Points depend only on each word's membership, and the two sets are disjoint, so the classification is unambiguous. The composite key is a total order (ids are distinct), so the top `k` is unique.",
        time: "O(L + n log n)",
        space: "O(W + n)",
        pitfalls: [
          "Count every occurrence: a report that says `kind` twice earns 6 points.",
          "Points can be negative — do not clamp at zero.",
          "Ties go to the **smaller** id, the opposite direction from the points.",
        ],
      }),
      examples: [
        { input: "[\"sharp\",\"kind\"]\n[\"late\",\"rude\"]\n[\"sharp and kind\",\"late again\",\"kind but late\"]\n[7,3,5]\n2", expectedOutput: "[7,5]" },
        { input: "[\"sharp\",\"kind\"]\n[\"late\",\"rude\"]\n[\"rude\",\"late\"]\n[4,2]\n1", expectedOutput: "[2]" },
      ],
      gen: (rng: Rng) => {
        const poolSize = ri(rng, 4, 14);
        const pool: string[] = [];
        const seen = new Set<string>();
        while (pool.length < poolSize) {
          const w = randLower(rng, 1, 6, "abcdefgh");
          if (!seen.has(w)) { seen.add(w); pool.push(w); }
        }
        shuffle(rng, pool);
        const np = ri(rng, 1, Math.floor(poolSize / 3));
        const nn = ri(rng, 1, Math.floor(poolSize / 3));
        const positive = pool.slice(0, np);
        const negative = pool.slice(np, np + nn);
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 25]));
        const report = Array.from({ length: n }, () => Array.from({ length: ri(rng, 1, 8) }, () => pick(rng, pool)).join(" "));
        const idTop = pick(rng, [n, 3 * n, 1000000000]);
        const used = new Set<number>();
        const ids: number[] = [];
        while (ids.length < n) {
          const id = ri(rng, 1, idTop);
          if (!used.has(id)) { used.add(id); ids.push(id); }
        }
        const k = ri(rng, 1, n);
        return {
          input: `${fmtStrArr(positive)}\n${fmtStrArr(negative)}\n${fmtStrArr(report)}\n${fmtIntArr(ids)}\n${k}`,
          expectedOutput: fmtIntArr(ref(positive, negative, report, ids, k)),
        };
      },
      solutions: {
        python: code`
          from typing import List

          def topStudents(positiveFeedback: List[str], negativeFeedback: List[str], report: List[str], studentId: List[int], k: int) -> List[int]:
              pos, neg = set(positiveFeedback), set(negativeFeedback)
              rows = []
              for text, sid in zip(report, studentId):
                  points = 0
                  for w in text.split():
                      if w in pos:
                          points += 3
                      elif w in neg:
                          points -= 1
                  rows.append((-points, sid))
              rows.sort()
              return [sid for _, sid in rows[:k]]
        `,
        javascript: code`
          var topStudents = function(positiveFeedback, negativeFeedback, report, studentId, k) {
              var pos = new Set(positiveFeedback), neg = new Set(negativeFeedback);
              var rows = [];
              for (var i = 0; i < report.length; i++) {
                  var words = report[i].split(' ');
                  var points = 0;
                  for (var j = 0; j < words.length; j++) {
                      if (pos.has(words[j])) points += 3;
                      else if (neg.has(words[j])) points -= 1;
                  }
                  rows.push([points, studentId[i]]);
              }
              rows.sort(function(a, b) { return b[0] - a[0] || a[1] - b[1]; });
              var res = [];
              for (var t = 0; t < k; t++) res.push(rows[t][1]);
              return res;
          };
        `,
        typescript: code`
          function topStudents(positiveFeedback: string[], negativeFeedback: string[], report: string[], studentId: number[], k: number): number[] {
              // Plain objects as sets; the "#" prefix keeps words clear of Object.prototype names.
              var score: { [w: string]: number } = {};
              for (var a = 0; a < positiveFeedback.length; a++) score["#" + positiveFeedback[a]] = 3;
              for (var b = 0; b < negativeFeedback.length; b++) score["#" + negativeFeedback[b]] = -1;
              var rows: number[][] = [];
              for (var i = 0; i < report.length; i++) {
                  var words = report[i].split(' ');
                  var points = 0;
                  for (var j = 0; j < words.length; j++) {
                      var s = score["#" + words[j]];
                      if (s !== undefined) points += s;
                  }
                  rows.push([points, studentId[i]]);
              }
              rows.sort(function(x, y) { return y[0] - x[0] || x[1] - y[1]; });
              var res: number[] = [];
              for (var t = 0; t < k; t++) res.push(rows[t][1]);
              return res;
          }
        `,
        java: code`
          public static int[] topStudents(String[] positiveFeedback, String[] negativeFeedback, String[] report, int[] studentId, int k) {
              Set<String> pos = new HashSet<>(Arrays.asList(positiveFeedback));
              Set<String> neg = new HashSet<>(Arrays.asList(negativeFeedback));
              int n = report.length;
              int[][] rows = new int[n][2];
              for (int i = 0; i < n; i++) {
                  int points = 0;
                  for (String w : report[i].split(" ")) {
                      if (pos.contains(w)) points += 3;
                      else if (neg.contains(w)) points -= 1;
                  }
                  rows[i][0] = points;
                  rows[i][1] = studentId[i];
              }
              Arrays.sort(rows, (a, b) -> a[0] != b[0] ? Integer.compare(b[0], a[0]) : Integer.compare(a[1], b[1]));
              int[] res = new int[k];
              for (int t = 0; t < k; t++) res[t] = rows[t][1];
              return res;
          }
        `,
        cpp: code`
          vector<int> topStudents(vector<string>& positiveFeedback, vector<string>& negativeFeedback, vector<string>& report, vector<int>& studentId, int k) {
              unordered_set<string> pos(positiveFeedback.begin(), positiveFeedback.end());
              unordered_set<string> neg(negativeFeedback.begin(), negativeFeedback.end());
              vector<pair<int, int>> rows; // (-points, id) sorts into rank order
              for (size_t i = 0; i < report.size(); i++) {
                  istringstream in(report[i]);
                  string w;
                  int points = 0;
                  while (in >> w) {
                      if (pos.count(w)) points += 3;
                      else if (neg.count(w)) points -= 1;
                  }
                  rows.push_back({-points, studentId[i]});
              }
              sort(rows.begin(), rows.end());
              vector<int> res;
              for (int t = 0; t < k; t++) res.push_back(rows[t].second);
              return res;
          }
        `,
        c: code`
          typedef struct { int points; int id; } TsRow;

          static int cmpWord(const void* a, const void* b) {
              return strcmp(*(char* const*) a, *(char* const*) b);
          }

          static int cmpRank(const void* a, const void* b) {
              const TsRow* x = (const TsRow*) a;
              const TsRow* y = (const TsRow*) b;
              if (x->points != y->points) return (y->points > x->points) - (y->points < x->points);
              return (x->id > y->id) - (x->id < y->id);
          }

          static int hasWord(char** sorted, int size, const char* w) {
              return bsearch(&w, sorted, (size_t) size, sizeof(char*), cmpWord) != NULL;
          }

          int* topStudents(char** positiveFeedback, int positiveFeedbackSize, char** negativeFeedback, int negativeFeedbackSize, char** report, int reportSize, int* studentId, int studentIdSize, int k, int* returnSize) {
              // Sorted copies of the word lists, searched with bsearch.
              char** pos = (char**) malloc((size_t) (positiveFeedbackSize + 1) * sizeof(char*));
              char** neg = (char**) malloc((size_t) (negativeFeedbackSize + 1) * sizeof(char*));
              memcpy(pos, positiveFeedback, (size_t) positiveFeedbackSize * sizeof(char*));
              memcpy(neg, negativeFeedback, (size_t) negativeFeedbackSize * sizeof(char*));
              qsort(pos, (size_t) positiveFeedbackSize, sizeof(char*), cmpWord);
              qsort(neg, (size_t) negativeFeedbackSize, sizeof(char*), cmpWord);
              TsRow* rows = (TsRow*) malloc((size_t) (reportSize + 1) * sizeof(TsRow));
              char word[128];
              for (int i = 0; i < reportSize; i++) {
                  const char* s = report[i];
                  int points = 0, at = 0;
                  for (;;) {
                      while (s[at] == ' ') at++;
                      if (s[at] == '\0') break;
                      int len = 0;
                      while (s[at] != ' ' && s[at] != '\0') {
                          if (len < 127) word[len++] = s[at];
                          at++;
                      }
                      word[len] = '\0';
                      if (hasWord(pos, positiveFeedbackSize, word)) points += 3;
                      else if (hasWord(neg, negativeFeedbackSize, word)) points -= 1;
                  }
                  rows[i].points = points;
                  rows[i].id = studentId[i];
              }
              qsort(rows, (size_t) reportSize, sizeof(TsRow), cmpRank);
              int* res = (int*) malloc((size_t) (k + 1) * sizeof(int));
              for (int t = 0; t < k; t++) res[t] = rows[t].id;
              free(pos);
              free(neg);
              free(rows);
              *returnSize = k;
              return res;
          }
        `,
        csharp: code`
          public static int[] TopStudents(string[] positiveFeedback, string[] negativeFeedback, string[] report, int[] studentId, int k)
          {
              var pos = new HashSet<string>(positiveFeedback);
              var neg = new HashSet<string>(negativeFeedback);
              int n = report.Length;
              var points = new int[n];
              for (int i = 0; i < n; i++)
              {
                  foreach (var w in report[i].Split(' '))
                  {
                      if (pos.Contains(w)) points[i] += 3;
                      else if (neg.Contains(w)) points[i] -= 1;
                  }
              }
              var order = new int[n];
              for (int i = 0; i < n; i++) order[i] = i;
              Array.Sort(order, (a, b) => points[a] != points[b] ? points[b].CompareTo(points[a]) : studentId[a].CompareTo(studentId[b]));
              var res = new int[k];
              for (int t = 0; t < k; t++) res[t] = studentId[order[t]];
              return res;
          }
        `,
        go: code`
          func topStudents(positiveFeedback []string, negativeFeedback []string, report []string, studentId []int, k int) []int {
              score := map[string]int{}
              for _, w := range positiveFeedback {
                  score[w] = 3
              }
              for _, w := range negativeFeedback {
                  score[w] = -1
              }
              n := len(report)
              points := make([]int, n)
              order := make([]int, n)
              for i, text := range report {
                  order[i] = i
                  for _, w := range strings.Fields(text) {
                      points[i] += score[w]
                  }
              }
              sort.Slice(order, func(a, b int) bool {
                  x, y := order[a], order[b]
                  if points[x] != points[y] {
                      return points[x] > points[y]
                  }
                  return studentId[x] < studentId[y]
              })
              res := make([]int, k)
              for t := 0; t < k; t++ {
                  res[t] = studentId[order[t]]
              }
              return res
          }
        `,
        kotlin: code`
          fun topStudents(positiveFeedback: Array<String>, negativeFeedback: Array<String>, report: Array<String>, studentId: IntArray, k: Int): IntArray {
              val pos = positiveFeedback.toHashSet()
              val neg = negativeFeedback.toHashSet()
              val points = IntArray(report.size)
              for (i in report.indices) {
                  for (w in report[i].split(" ")) {
                      if (w in pos) points[i] += 3
                      else if (w in neg) points[i] -= 1
                  }
              }
              val order = report.indices.sortedWith(compareBy<Int>({ -points[it] }, { studentId[it] }))
              return IntArray(k) { studentId[order[it]] }
          }
        `,
        swift: code`
          func topStudents(_ positiveFeedback: [String], _ negativeFeedback: [String], _ report: [String], _ studentId: [Int], _ k: Int) -> [Int] {
              let pos = Set(positiveFeedback)
              let neg = Set(negativeFeedback)
              var points = [Int](repeating: 0, count: report.count)
              for i in 0..<report.count {
                  for w in report[i].split(separator: " ") {
                      let word = String(w)
                      if pos.contains(word) {
                          points[i] += 3
                      } else if neg.contains(word) {
                          points[i] -= 1
                      }
                  }
              }
              let order = (0..<report.count).sorted {
                  points[$0] != points[$1] ? points[$0] > points[$1] : studentId[$0] < studentId[$1]
              }
              return (0..<k).map { studentId[order[$0]] }
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn topStudents(positiveFeedback: Vec<String>, negativeFeedback: Vec<String>, report: Vec<String>, studentId: Vec<i32>, k: i32) -> Vec<i32> {
              let pos: HashSet<&str> = positiveFeedback.iter().map(|s| s.as_str()).collect();
              let neg: HashSet<&str> = negativeFeedback.iter().map(|s| s.as_str()).collect();
              // (-points, id) sorts straight into rank order
              let mut rows: Vec<(i32, i32)> = Vec::with_capacity(report.len());
              for (i, text) in report.iter().enumerate() {
                  let mut points = 0;
                  for w in text.split_whitespace() {
                      if pos.contains(w) {
                          points += 3;
                      } else if neg.contains(w) {
                          points -= 1;
                      }
                  }
                  rows.push((-points, studentId[i]));
              }
              rows.sort();
              rows.iter().take(k as usize).map(|r| r.1).collect()
          }
        `,
        php: code`
          function topStudents($positiveFeedback, $negativeFeedback, $report, $studentId, $k) {
              $pos = array_flip($positiveFeedback);
              $neg = array_flip($negativeFeedback);
              $rows = [];
              foreach ($report as $i => $text) {
                  $points = 0;
                  foreach (explode(' ', $text) as $w) {
                      if (isset($pos[$w])) $points += 3;
                      elseif (isset($neg[$w])) $points -= 1;
                  }
                  $rows[] = [$points, $studentId[$i]];
              }
              usort($rows, function ($a, $b) {
                  if ($a[0] != $b[0]) return $b[0] <=> $a[0];
                  return $a[1] <=> $b[1];
              });
              $res = [];
              for ($t = 0; $t < $k; $t++) $res[] = $rows[$t][1];
              return $res;
          }
        `,
        ruby: code`
          def topStudents(positiveFeedback, negativeFeedback, report, studentId, k)
            score = Hash.new(0)
            positiveFeedback.each { |w| score[w] = 3 }
            negativeFeedback.each { |w| score[w] = -1 }
            rows = report.each_with_index.map do |text, i|
              [-text.split(' ').sum { |w| score[w] }, studentId[i]]
            end
            rows.sort.first(k).map { |r| r[1] }
          end
        `,
      },
    };
  })(),

  // ── Maximum Number of Points From Grid Queries (LC 2503) ─────────
  (() => {
    const ref = (grid: number[][], queries: number[]) => {
      const m = grid.length, n = grid[0].length;
      return queries.map((q) => {
        if (grid[0][0] >= q) return 0;
        const seen = grid.map((row) => row.map(() => false));
        const stack = [[0, 0]];
        seen[0][0] = true;
        let count = 0;
        while (stack.length) {
          const [r, c] = stack.pop()!;
          count++;
          for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nr = r + dr, nc = c + dc;
            if (nr >= 0 && nr < m && nc >= 0 && nc < n && !seen[nr][nc] && grid[nr][nc] < q) {
              seen[nr][nc] = true;
              stack.push([nr, nc]);
            }
          }
        }
        return count;
      });
    };
    return {
      slug: "maximum-number-of-points-from-grid-queries",
      title: "Maximum Number of Points From Grid Queries",
      difficulty: "HARD" as const,
      tags: ["Array", "Breadth-First Search", "Matrix", "Heap (Priority Queue)", "Google", "Amazon"],
      signature: {
        funcName: "maxPoints",
        params: [{ name: "grid", type: "int[][]" as const }, { name: "queries", type: "int[]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "You are given an `m x n` matrix `grid` of positive integers and an array `queries`.\n\nEach query `q` is played separately, starting at the **top-left** cell. While standing on a cell: if `q` is **strictly greater** than the cell's value, you score one point if this is your first time on that cell, and you may step to any of its four neighbours. Otherwise you score nothing there and cannot move on from it.\n\nFor every query, return the maximum number of points you can collect — the number of distinct cells you can stand on with a value smaller than `q`, moving only through such cells. If the top-left value is at least `q`, the answer is `0`.",
        [
          { in: "grid = [[2,4,1],[3,5,6],[9,1,2]], queries = [4,6,1,10]", out: "[2,7,0,9]", note: "With q = 4 only the cells 2 and 3 are reachable; with q = 6 every cell except 6 and 9 is; q = 1 cannot even leave the start." },
          { in: "grid = [[5,2,1],[1,1,2]], queries = [3]", out: "[0]", note: "The start holds 5, which is not smaller than 3." },
        ],
        ["m == grid.length", "n == grid[i].length", "2 <= m, n <= 1000", "4 <= m * n <= 10^5", "1 <= queries.length <= 10^4", "1 <= grid[i][j], queries[i] <= 10^6"]),
      hints: [
        "For one query the answer is the size of the region connected to the start through cells smaller than `q` — but a BFS per query is too slow.",
        "A larger query reaches everything a smaller one reaches. Answer the queries in increasing order and keep growing one region.",
        "Grow the region with a min-heap of frontier cells keyed by value: pop cells while the smallest frontier value is below the current query, counting them and pushing their unseen neighbours.",
      ],
      editorial: explain({
        idea: "Sort the queries. The reachable region only grows as `q` grows, and the cell that joins it next is always the **smallest-valued** cell on its border — a best-first flood fill driven by a min-heap, paused at each query threshold.",
        steps: [
          "Sort the query indices by query value.",
          "Push the start cell into a min-heap keyed by cell value and mark it seen; set `count = 0`.",
          "For each query `q` in increasing order: while the heap's smallest value is `< q`, pop that cell, increment `count`, and push every unseen in-bounds neighbour (marking it seen).",
          "Record `count` as the answer for that query's original index.",
        ],
        why: "The heap always holds exactly the border of the counted region. A border cell with value `< q` is reachable for `q` (its counted neighbour is), and once every border value is `>= q` the region cannot be extended for `q`. Popping smallest-first guarantees no cell is counted before it is truly reachable under the current threshold, and later, larger queries simply continue from where the last one stopped.",
        time: "O(mn log(mn) + k log k)",
        space: "O(mn + k)",
        pitfalls: [
          "The comparison is strict: a cell equal to `q` blocks the walk.",
          "Mark cells seen when they are pushed, not when popped, or the same cell enters the heap several times.",
          "Store each answer at the query's original position; the processing order is sorted.",
        ],
      }),
      examples: [
        { input: "[[2,4,1],[3,5,6],[9,1,2]]\n[4,6,1,10]", expectedOutput: "[2,7,0,9]" },
        { input: "[[5,2,1],[1,1,2]]\n[3]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 2, pick(rng, [2, 4, 7]));
        const n = ri(rng, 2, pick(rng, [2, 4, 7]));
        const top = pick(rng, [3, 10, 50, 1000000]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 1, top)));
        const k = ri(rng, 1, pick(rng, [1, 4, 10]));
        const queries = Array.from({ length: k }, () => (rng() < 0.4 ? Math.min(1000000, grid[ri(rng, 0, m - 1)][ri(rng, 0, n - 1)] + ri(rng, 0, 1)) : ri(rng, 1, Math.min(1000000, top + 1))));
        return { input: `${fmtIntMat(grid)}\n${fmtIntArr(queries)}`, expectedOutput: fmtIntArr(ref(grid, queries)) };
      },
      solutions: {
        python: code`
          from typing import List
          import heapq

          def maxPoints(grid: List[List[int]], queries: List[int]) -> List[int]:
              m, n = len(grid), len(grid[0])
              order = sorted(range(len(queries)), key=lambda j: queries[j])
              ans = [0] * len(queries)
              seen = [[False] * n for _ in range(m)]
              seen[0][0] = True
              heap = [(grid[0][0], 0, 0)]  # the region's border, smallest value first
              count = 0
              for j in order:
                  q = queries[j]
                  while heap and heap[0][0] < q:
                      _, r, c = heapq.heappop(heap)
                      count += 1
                      for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                          if 0 <= nr < m and 0 <= nc < n and not seen[nr][nc]:
                              seen[nr][nc] = True
                              heapq.heappush(heap, (grid[nr][nc], nr, nc))
                  ans[j] = count
              return ans
        `,
        javascript: code`
          var maxPoints = function(grid, queries) {
              var m = grid.length, n = grid[0].length;
              var SHIFT = 131072; // 2^17 > m * n: a key is value * SHIFT + cell
              var order = [];
              for (var j = 0; j < queries.length; j++) order.push(j);
              order.sort(function(a, b) { return queries[a] - queries[b]; });
              var seen = [];
              for (var c = 0; c < m * n; c++) seen.push(false);
              seen[0] = true;
              var heap = [grid[0][0] * SHIFT]; // the region's border, smallest value first
              var ans = [];
              for (var z = 0; z < queries.length; z++) ans.push(0);
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              var count = 0;
              for (var t = 0; t < order.length; t++) {
                  var q = queries[order[t]];
                  while (heap.length > 0 && Math.floor(heap[0] / SHIFT) < q) {
                      var cell = heapPop(heap) % SHIFT;
                      count++;
                      var row = Math.floor(cell / n), col = cell % n;
                      for (var d = 0; d < 4; d++) {
                          var nr = row + dr[d], nc = col + dc[d];
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                          var id = nr * n + nc;
                          if (seen[id]) continue;
                          seen[id] = true;
                          heapPush(heap, grid[nr][nc] * SHIFT + id);
                      }
                  }
                  ans[order[t]] = count;
              }
              return ans;
          };

          var heapPush = function(h, v) {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          };

          var heapPop = function(h) {
              var top = h[0];
              var last = h.pop();
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          };
        `,
        typescript: code`
          function heapPush(h: number[], v: number): void {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          function heapPop(h: number[]): number {
              var top = h[0];
              var last = h.pop() as number;
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          function maxPoints(grid: number[][], queries: number[]): number[] {
              var m = grid.length, n = grid[0].length;
              var SHIFT = 131072; // 2^17 > m * n: a key is value * SHIFT + cell
              var order: number[] = [];
              for (var j = 0; j < queries.length; j++) order.push(j);
              order.sort(function(a, b) { return queries[a] - queries[b]; });
              var seen: boolean[] = [];
              for (var c = 0; c < m * n; c++) seen.push(false);
              seen[0] = true;
              var heap: number[] = [grid[0][0] * SHIFT]; // the region's border, smallest value first
              var ans: number[] = [];
              for (var z = 0; z < queries.length; z++) ans.push(0);
              var dr = [1, -1, 0, 0], dc = [0, 0, 1, -1];
              var count = 0;
              for (var t = 0; t < order.length; t++) {
                  var q = queries[order[t]];
                  while (heap.length > 0 && Math.floor(heap[0] / SHIFT) < q) {
                      var cell = heapPop(heap) % SHIFT;
                      count++;
                      var row = Math.floor(cell / n), col = cell % n;
                      for (var d = 0; d < 4; d++) {
                          var nr = row + dr[d], nc = col + dc[d];
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                          var id = nr * n + nc;
                          if (seen[id]) continue;
                          seen[id] = true;
                          heapPush(heap, grid[nr][nc] * SHIFT + id);
                      }
                  }
                  ans[order[t]] = count;
              }
              return ans;
          }
        `,
        java: code`
          public static int[] maxPoints(int[][] grid, int[] queries) {
              int m = grid.length, n = grid[0].length;
              Integer[] order = new Integer[queries.length];
              for (int j = 0; j < queries.length; j++) order[j] = j;
              Arrays.sort(order, (a, b) -> Integer.compare(queries[a], queries[b]));
              boolean[][] seen = new boolean[m][n];
              seen[0][0] = true;
              // the region's border as {value, row, col}, smallest value first
              PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
              heap.add(new int[] { grid[0][0], 0, 0 });
              int[] dr = { 1, -1, 0, 0 }, dc = { 0, 0, 1, -1 };
              int[] ans = new int[queries.length];
              int count = 0;
              for (int j : order) {
                  int q = queries[j];
                  while (!heap.isEmpty() && heap.peek()[0] < q) {
                      int[] cur = heap.poll();
                      count++;
                      for (int d = 0; d < 4; d++) {
                          int nr = cur[1] + dr[d], nc = cur[2] + dc[d];
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]) continue;
                          seen[nr][nc] = true;
                          heap.add(new int[] { grid[nr][nc], nr, nc });
                      }
                  }
                  ans[j] = count;
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> maxPoints(vector<vector<int>>& grid, vector<int>& queries) {
              int m = grid.size(), n = grid[0].size();
              vector<int> order(queries.size());
              for (int j = 0; j < (int) queries.size(); j++) order[j] = j;
              sort(order.begin(), order.end(), [&](int a, int b) { return queries[a] < queries[b]; });
              vector<vector<bool>> seen(m, vector<bool>(n, false));
              seen[0][0] = true;
              // the region's border as (value, cell), smallest value first
              priority_queue<pair<int, int>, vector<pair<int, int>>, greater<pair<int, int>>> heap;
              heap.push({grid[0][0], 0});
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              vector<int> ans(queries.size(), 0);
              int count = 0;
              for (int j : order) {
                  int q = queries[j];
                  while (!heap.empty() && heap.top().first < q) {
                      int cell = heap.top().second;
                      heap.pop();
                      count++;
                      int r = cell / n, c = cell % n;
                      for (int d = 0; d < 4; d++) {
                          int nr = r + dr[d], nc = c + dc[d];
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]) continue;
                          seen[nr][nc] = true;
                          heap.push({grid[nr][nc], nr * n + nc});
                      }
                  }
                  ans[j] = count;
              }
              return ans;
          }
        `,
        c: code`
          static void hpPush(long long* h, int* size, long long v) {
              int i = (*size)++;
              h[i] = v;
              while (i > 0) {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long long hpPop(long long* h, int* size) {
              long long top = h[0];
              (*size)--;
              if (*size > 0) {
                  h[0] = h[*size];
                  int j = 0;
                  for (;;) {
                      int l = 2 * j + 1, r = l + 1, s = j;
                      if (l < *size && h[l] < h[s]) s = l;
                      if (r < *size && h[r] < h[s]) s = r;
                      if (s == j) break;
                      long long t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          static int cmpLL(const void* a, const void* b) {
              long long x = *(const long long*) a, y = *(const long long*) b;
              return (x > y) - (x < y);
          }

          int* maxPoints(int** grid, int gridSize, int* gridColSize, int* queries, int queriesSize, int* returnSize) {
              int m = gridSize, n = gridColSize[0];
              const long long SHIFT = 131072; // 2^17 > m * n: a key is value * SHIFT + cell
              // Queries sorted by value, each carrying its index: value * 2^14 + index.
              long long* order = (long long*) malloc((size_t) (queriesSize + 1) * sizeof(long long));
              for (int j = 0; j < queriesSize; j++) order[j] = (long long) queries[j] * 16384 + j;
              qsort(order, (size_t) queriesSize, sizeof(long long), cmpLL);
              char* seen = (char*) calloc((size_t) (m * n), 1);
              long long* heap = (long long*) malloc((size_t) (m * n + 1) * sizeof(long long));
              int size = 0;
              seen[0] = 1;
              hpPush(heap, &size, (long long) grid[0][0] * SHIFT);
              int dr[4] = {1, -1, 0, 0}, dc[4] = {0, 0, 1, -1};
              int* ans = (int*) malloc((size_t) (queriesSize + 1) * sizeof(int));
              int count = 0;
              for (int t = 0; t < queriesSize; t++) {
                  int j = (int) (order[t] % 16384);
                  int q = queries[j];
                  while (size > 0 && heap[0] / SHIFT < q) {
                      int cell = (int) (hpPop(heap, &size) % SHIFT);
                      count++;
                      int r = cell / n, c = cell % n;
                      for (int d = 0; d < 4; d++) {
                          int nr = r + dr[d], nc = c + dc[d];
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                          int id = nr * n + nc;
                          if (seen[id]) continue;
                          seen[id] = 1;
                          hpPush(heap, &size, (long long) grid[nr][nc] * SHIFT + id);
                      }
                  }
                  ans[j] = count;
              }
              free(order);
              free(seen);
              free(heap);
              *returnSize = queriesSize;
              return ans;
          }
        `,
        csharp: code`
          static void HeapPush(List<long> h, long v)
          {
              h.Add(v);
              int i = h.Count - 1;
              while (i > 0)
              {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long HeapPop(List<long> h)
          {
              long top = h[0];
              int last = h.Count - 1;
              h[0] = h[last];
              h.RemoveAt(last);
              int j = 0;
              while (true)
              {
                  int l = 2 * j + 1, r = l + 1, s = j;
                  if (l < h.Count && h[l] < h[s]) s = l;
                  if (r < h.Count && h[r] < h[s]) s = r;
                  if (s == j) break;
                  long t = h[s]; h[s] = h[j]; h[j] = t;
                  j = s;
              }
              return top;
          }

          public static int[] MaxPoints(int[][] grid, int[] queries)
          {
              int m = grid.Length, n = grid[0].Length;
              const long SHIFT = 131072; // 2^17 > m * n: a key is value * SHIFT + cell
              var order = new int[queries.Length];
              for (int j = 0; j < order.Length; j++) order[j] = j;
              Array.Sort(order, (a, b) => queries[a].CompareTo(queries[b]));
              var seen = new bool[m * n];
              seen[0] = true;
              var heap = new List<long>(); // the region's border, smallest value first
              HeapPush(heap, grid[0][0] * SHIFT);
              int[] dr = { 1, -1, 0, 0 }, dc = { 0, 0, 1, -1 };
              var ans = new int[queries.Length];
              int count = 0;
              foreach (int j in order)
              {
                  int q = queries[j];
                  while (heap.Count > 0 && heap[0] / SHIFT < q)
                  {
                      int cell = (int) (HeapPop(heap) % SHIFT);
                      count++;
                      int r = cell / n, c = cell % n;
                      for (int d = 0; d < 4; d++)
                      {
                          int nr = r + dr[d], nc = c + dc[d];
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n) continue;
                          int id = nr * n + nc;
                          if (seen[id]) continue;
                          seen[id] = true;
                          HeapPush(heap, grid[nr][nc] * SHIFT + id);
                      }
                  }
                  ans[j] = count;
              }
              return ans;
          }
        `,
        go: code`
          func hpPush(h *[]int, v int) {
              *h = append(*h, v)
              a := *h
              i := len(a) - 1
              for i > 0 {
                  p := (i - 1) / 2
                  if a[p] <= a[i] {
                      break
                  }
                  a[p], a[i] = a[i], a[p]
                  i = p
              }
          }

          func hpPop(h *[]int) int {
              a := *h
              top := a[0]
              last := len(a) - 1
              a[0] = a[last]
              a = a[:last]
              j := 0
              for {
                  l, r, s := 2*j+1, 2*j+2, j
                  if l < len(a) && a[l] < a[s] {
                      s = l
                  }
                  if r < len(a) && a[r] < a[s] {
                      s = r
                  }
                  if s == j {
                      break
                  }
                  a[s], a[j] = a[j], a[s]
                  j = s
              }
              *h = a
              return top
          }

          func maxPoints(grid [][]int, queries []int) []int {
              m, n := len(grid), len(grid[0])
              const shift = 131072 // 2^17 > m * n: a key is value * shift + cell
              order := make([]int, len(queries))
              for j := range order {
                  order[j] = j
              }
              sort.Slice(order, func(a, b int) bool { return queries[order[a]] < queries[order[b]] })
              seen := make([]bool, m*n)
              seen[0] = true
              pq := []int{grid[0][0] * shift} // the region's border, smallest value first
              dr := []int{1, -1, 0, 0}
              dc := []int{0, 0, 1, -1}
              ans := make([]int, len(queries))
              count := 0
              for _, j := range order {
                  q := queries[j]
                  for len(pq) > 0 && pq[0]/shift < q {
                      cell := hpPop(&pq) % shift
                      count++
                      r, c := cell/n, cell%n
                      for d := 0; d < 4; d++ {
                          nr, nc := r+dr[d], c+dc[d]
                          if nr < 0 || nr >= m || nc < 0 || nc >= n {
                              continue
                          }
                          id := nr*n + nc
                          if seen[id] {
                              continue
                          }
                          seen[id] = true
                          hpPush(&pq, grid[nr][nc]*shift+id)
                      }
                  }
                  ans[j] = count
              }
              return ans
          }
        `,
        kotlin: code`
          import java.util.PriorityQueue

          fun maxPoints(grid: Array<IntArray>, queries: IntArray): IntArray {
              val m = grid.size
              val n = grid[0].size
              val order = queries.indices.sortedBy { queries[it] }
              val seen = Array(m) { BooleanArray(n) }
              seen[0][0] = true
              // the region's border as {value, row, col}, smallest value first
              val heap = PriorityQueue<IntArray>(Comparator { a, b -> a[0].compareTo(b[0]) })
              heap.add(intArrayOf(grid[0][0], 0, 0))
              val dr = intArrayOf(1, -1, 0, 0)
              val dc = intArrayOf(0, 0, 1, -1)
              val ans = IntArray(queries.size)
              var count = 0
              for (j in order) {
                  val q = queries[j]
                  while (heap.isNotEmpty() && heap.peek()[0] < q) {
                      val cur = heap.poll()
                      count++
                      for (d in 0 until 4) {
                          val nr = cur[1] + dr[d]
                          val nc = cur[2] + dc[d]
                          if (nr < 0 || nr >= m || nc < 0 || nc >= n || seen[nr][nc]) continue
                          seen[nr][nc] = true
                          heap.add(intArrayOf(grid[nr][nc], nr, nc))
                      }
                  }
                  ans[j] = count
              }
              return ans
          }
        `,
        swift: code`
          func hpPush(_ h: inout [Int], _ v: Int) {
              h.append(v)
              var i = h.count - 1
              while i > 0 {
                  let p = (i - 1) / 2
                  if h[p] <= h[i] { break }
                  h.swapAt(p, i)
                  i = p
              }
          }

          func hpPop(_ h: inout [Int]) -> Int {
              let top = h[0]
              let last = h.removeLast()
              if !h.isEmpty {
                  h[0] = last
                  var j = 0
                  while true {
                      let l = 2 * j + 1, r = l + 1
                      var s = j
                      if l < h.count && h[l] < h[s] { s = l }
                      if r < h.count && h[r] < h[s] { s = r }
                      if s == j { break }
                      h.swapAt(s, j)
                      j = s
                  }
              }
              return top
          }

          func maxPoints(_ grid: [[Int]], _ queries: [Int]) -> [Int] {
              let m = grid.count, n = grid[0].count
              let shift = 131072 // 2^17 > m * n: a key is value * shift + cell
              let order = (0..<queries.count).sorted { queries[$0] < queries[$1] }
              var seen = [Bool](repeating: false, count: m * n)
              seen[0] = true
              var heap = [grid[0][0] * shift] // the region's border, smallest value first
              let dr = [1, -1, 0, 0], dc = [0, 0, 1, -1]
              var ans = [Int](repeating: 0, count: queries.count)
              var count = 0
              for j in order {
                  let q = queries[j]
                  while !heap.isEmpty && heap[0] / shift < q {
                      let cell = hpPop(&heap) % shift
                      count += 1
                      let r = cell / n, c = cell % n
                      for d in 0..<4 {
                          let nr = r + dr[d], nc = c + dc[d]
                          if nr < 0 || nr >= m || nc < 0 || nc >= n { continue }
                          let id = nr * n + nc
                          if seen[id] { continue }
                          seen[id] = true
                          hpPush(&heap, grid[nr][nc] * shift + id)
                      }
                  }
                  ans[j] = count
              }
              return ans
          }
        `,
        rust: code`
          use std::cmp::Reverse;
          use std::collections::BinaryHeap;

          fn maxPoints(grid: Vec<Vec<i32>>, queries: Vec<i32>) -> Vec<i32> {
              let m = grid.len();
              let n = grid[0].len();
              let mut order: Vec<usize> = (0..queries.len()).collect();
              order.sort_by_key(|&j| queries[j]);
              let mut seen = vec![vec![false; n]; m];
              seen[0][0] = true;
              // the region's border as (value, row, col), smallest value first
              let mut heap: BinaryHeap<Reverse<(i32, usize, usize)>> = BinaryHeap::new();
              heap.push(Reverse((grid[0][0], 0, 0)));
              let mut ans = vec![0; queries.len()];
              let mut count = 0;
              for &j in order.iter() {
                  let q = queries[j];
                  while let Some(&Reverse((value, r, c))) = heap.peek() {
                      if value >= q {
                          break;
                      }
                      heap.pop();
                      count += 1;
                      let cand = [(r + 1, c), (r.wrapping_sub(1), c), (r, c + 1), (r, c.wrapping_sub(1))];
                      for &(nr, nc) in cand.iter() {
                          if nr < m && nc < n && !seen[nr][nc] {
                              seen[nr][nc] = true;
                              heap.push(Reverse((grid[nr][nc], nr, nc)));
                          }
                      }
                  }
                  ans[j] = count;
              }
              ans
          }
        `,
        php: code`
          function maxPoints($grid, $queries) {
              $m = count($grid);
              $n = count($grid[0]);
              $shift = 131072; // 2^17 > m * n: a key is value * shift + cell
              $order = array_keys($queries);
              usort($order, function ($a, $b) use ($queries) { return $queries[$a] <=> $queries[$b]; });
              $seen = array_fill(0, $m * $n, false);
              $seen[0] = true;
              $heap = new \SplMinHeap(); // the region's border, smallest value first
              $heap->insert($grid[0][0] * $shift);
              $dr = [1, -1, 0, 0];
              $dc = [0, 0, 1, -1];
              $ans = array_fill(0, count($queries), 0);
              $count = 0;
              foreach ($order as $j) {
                  $q = $queries[$j];
                  while (!$heap->isEmpty() && intdiv($heap->top(), $shift) < $q) {
                      $cell = $heap->extract() % $shift;
                      $count++;
                      $r = intdiv($cell, $n);
                      $c = $cell % $n;
                      for ($d = 0; $d < 4; $d++) {
                          $nr = $r + $dr[$d];
                          $nc = $c + $dc[$d];
                          if ($nr < 0 || $nr >= $m || $nc < 0 || $nc >= $n) continue;
                          $id = $nr * $n + $nc;
                          if ($seen[$id]) continue;
                          $seen[$id] = true;
                          $heap->insert($grid[$nr][$nc] * $shift + $id);
                      }
                  }
                  $ans[$j] = $count;
              }
              return $ans;
          }
        `,
        ruby: code`
          def hp_push(h, v)
            h << v
            i = h.length - 1
            while i > 0
              par = (i - 1) / 2
              break if h[par] <= h[i]
              h[par], h[i] = h[i], h[par]
              i = par
            end
          end

          def hp_pop(h)
            top = h[0]
            last = h.pop
            unless h.empty?
              h[0] = last
              j = 0
              loop do
                l = 2 * j + 1
                r = l + 1
                s = j
                s = l if l < h.length && h[l] < h[s]
                s = r if r < h.length && h[r] < h[s]
                break if s == j
                h[s], h[j] = h[j], h[s]
                j = s
              end
            end
            top
          end

          def maxPoints(grid, queries)
            m = grid.length
            n = grid[0].length
            shift = 131_072 # 2^17 > m * n: a key is value * shift + cell
            order = (0...queries.length).sort_by { |j| queries[j] }
            seen = Array.new(m * n, false)
            seen[0] = true
            heap = [grid[0][0] * shift] # the region's border, smallest value first
            ans = Array.new(queries.length, 0)
            count = 0
            order.each do |j|
              q = queries[j]
              while !heap.empty? && heap[0] / shift < q
                cell = hp_pop(heap) % shift
                count += 1
                r = cell / n
                c = cell % n
                [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]].each do |nr, nc|
                  next if nr < 0 || nr >= m || nc < 0 || nc >= n
                  id = nr * n + nc
                  next if seen[id]
                  seen[id] = true
                  hp_push(heap, grid[nr][nc] * shift + id)
                end
              end
              ans[j] = count
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Minimum Difference in Sums After Removal of Elements (LC 2163) ─
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length / 3;
      let best = Infinity;
      for (let k = n; k <= 2 * n; k++) {
        const left = nums.slice(0, k).sort((a, b) => a - b).slice(0, n).reduce((s, v) => s + v, 0);
        const right = nums.slice(k).sort((a, b) => b - a).slice(0, n).reduce((s, v) => s + v, 0);
        best = Math.min(best, left - right);
      }
      return best;
    };
    return {
      slug: "minimum-difference-in-sums-after-removal-of-elements",
      title: "Minimum Difference in Sums After Removal of Elements",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Heap (Priority Queue)", "Google", "Amazon"],
      signature: { funcName: "minimumDifference", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of `3 * n` elements.\n\nRemove any `n` of them (they need not be contiguous). The `2 * n` elements that remain keep their order and are split in two: the first `n` form the first part, with sum `sumfirst`, and the last `n` form the second part, with sum `sumsecond`.\n\nThe **difference** of the split is `sumfirst - sumsecond`. Return the minimum difference you can achieve.\n\n*Constraint note:* values are capped at `10^4` (the original allows `10^5`) so every sum fits in a 32-bit integer.",
        [
          { in: "nums = [4,1,6,2,8,3]", out: "-9", note: "Remove 2 and 3: the remaining [4,1,6,8] splits into [4,1] (sum 5) and [6,8] (sum 14)." },
          { in: "nums = [3,1,2]", out: "-1", note: "Remove 3: the parts are [1] and [2]." },
          { in: "nums = [7,9,5,8,1,3]", out: "1" },
        ],
        ["nums.length == 3 * n", "1 <= n <= 10^5", "1 <= nums[i] <= 10^4"]),
      hints: [
        "After the removal there is a cut position `k` with `n <= k <= 2n`: the first part comes from `nums[0..k)` and the second from `nums[k..3n)`.",
        "For a fixed cut, the first part should be the `n` smallest values of the prefix and the second part the `n` largest of the suffix.",
        "Compute the best prefix sum for every cut with a max-heap of size `n` (evict the largest), and the best suffix sum with a min-heap of size `n` scanning from the right.",
      ],
      editorial: explain({
        idea: "Fix the boundary `k` between the two parts. Then the parts are independent: minimise the first by keeping the `n` smallest of `nums[0..k)`, maximise the second by keeping the `n` largest of `nums[k..3n)`. Both families of answers come from one sweep each with a bounded heap.",
        steps: [
          "Left sweep: start with the first `n` values in a max-heap and their sum as `left[n]`. For `i = n .. 2n-1`, push `nums[i]`, pop the largest and update the sum; record `left[i+1]`.",
          "Right sweep: start with the last `n` values in a min-heap and their sum as `right[2n]`. For `i = 2n-1 down to n`, push `nums[i]`, pop the smallest and update the sum; record `right[i]`.",
          "Return the minimum of `left[k] - right[k]` over `k = n .. 2n`.",
        ],
        why: "Any valid removal leaves a first part entirely before a second part, so some `k` in `[n, 2n]` separates them, and for that `k` the choice inside each side is unconstrained — the extremal `n` values are optimal. The bounded heaps maintain exactly those extremal sets as the boundary moves one step at a time.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "The cut ranges over `n + 1` positions, both ends included.",
          "The left side needs the `n` **smallest** (evict the maximum), the right side the `n` **largest** (evict the minimum) — swapping them maximises the difference instead.",
          "With the original limits the sums exceed 32 bits; accumulate in 64-bit where the language needs it.",
        ],
      }),
      examples: [
        { input: "[4,1,6,2,8,3]", expectedOutput: "-9" },
        { input: "[3,1,2]", expectedOutput: "-1" },
        { input: "[7,9,5,8,1,3]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 8, 12]));
        const top = pick(rng, [1, 5, 100, 10000]);
        const nums = Array.from({ length: 3 * n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List
          import heapq

          def minimumDifference(nums: List[int]) -> int:
              n = len(nums) // 3
              # left[i]: least sum of n values among nums[:n + i]
              heap = [-v for v in nums[:n]]
              heapq.heapify(heap)
              s = sum(nums[:n])
              left = [s]
              for i in range(n, 2 * n):
                  s += nums[i]
                  heapq.heappush(heap, -nums[i])
                  s += heapq.heappop(heap)  # evict the largest
                  left.append(s)
              # sweep the cut from 2n down to n with the n largest values of the suffix
              heap = nums[2 * n:]
              heapq.heapify(heap)
              s = sum(heap)
              best = left[n] - s
              for i in range(2 * n - 1, n - 1, -1):
                  s += nums[i]
                  heapq.heappush(heap, nums[i])
                  s -= heapq.heappop(heap)  # evict the smallest
                  best = min(best, left[i - n] - s)
              return best
        `,
        javascript: code`
          var minimumDifference = function(nums) {
              var n = nums.length / 3;
              // left[i]: least sum of n values among the first n + i (max-heap via negation)
              var low = [];
              var sum = 0;
              for (var i = 0; i < n; i++) {
                  heapPush(low, -nums[i]);
                  sum += nums[i];
              }
              var left = [sum];
              for (var i2 = n; i2 < 2 * n; i2++) {
                  heapPush(low, -nums[i2]);
                  sum += nums[i2] + heapPop(low); // evict the largest
                  left.push(sum);
              }
              // the n largest of the suffix, cut moving from 2 * n down to n
              var high = [];
              sum = 0;
              for (var j = 2 * n; j < 3 * n; j++) {
                  heapPush(high, nums[j]);
                  sum += nums[j];
              }
              var best = left[n] - sum;
              for (var k = 2 * n - 1; k >= n; k--) {
                  heapPush(high, nums[k]);
                  sum += nums[k] - heapPop(high); // evict the smallest
                  best = Math.min(best, left[k - n] - sum);
              }
              return best;
          };

          var heapPush = function(h, v) {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          };

          var heapPop = function(h) {
              var top = h[0];
              var last = h.pop();
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          };
        `,
        typescript: code`
          function heapPush(h: number[], v: number): void {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          function heapPop(h: number[]): number {
              var top = h[0];
              var last = h.pop() as number;
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          function minimumDifference(nums: number[]): number {
              var n = nums.length / 3;
              // left[i]: least sum of n values among the first n + i (max-heap via negation)
              var low: number[] = [];
              var sum = 0;
              for (var i = 0; i < n; i++) {
                  heapPush(low, -nums[i]);
                  sum += nums[i];
              }
              var left: number[] = [sum];
              for (var i2 = n; i2 < 2 * n; i2++) {
                  heapPush(low, -nums[i2]);
                  sum += nums[i2] + heapPop(low); // evict the largest
                  left.push(sum);
              }
              // the n largest of the suffix, cut moving from 2 * n down to n
              var high: number[] = [];
              sum = 0;
              for (var j = 2 * n; j < 3 * n; j++) {
                  heapPush(high, nums[j]);
                  sum += nums[j];
              }
              var best = left[n] - sum;
              for (var k = 2 * n - 1; k >= n; k--) {
                  heapPush(high, nums[k]);
                  sum += nums[k] - heapPop(high); // evict the smallest
                  best = Math.min(best, left[k - n] - sum);
              }
              return best;
          }
        `,
        java: code`
          public static int minimumDifference(int[] nums) {
              int n = nums.length / 3;
              long[] left = new long[n + 1];
              PriorityQueue<Integer> low = new PriorityQueue<>(Collections.reverseOrder());
              long sum = 0;
              for (int i = 0; i < n; i++) {
                  low.add(nums[i]);
                  sum += nums[i];
              }
              left[0] = sum;
              for (int i = n; i < 2 * n; i++) {
                  low.add(nums[i]);
                  sum += nums[i] - low.poll(); // evict the largest
                  left[i - n + 1] = sum;
              }
              PriorityQueue<Integer> high = new PriorityQueue<>();
              sum = 0;
              for (int i = 2 * n; i < 3 * n; i++) {
                  high.add(nums[i]);
                  sum += nums[i];
              }
              long best = left[n] - sum;
              for (int i = 2 * n - 1; i >= n; i--) {
                  high.add(nums[i]);
                  sum += nums[i] - high.poll(); // evict the smallest
                  best = Math.min(best, left[i - n] - sum);
              }
              return (int) best;
          }
        `,
        cpp: code`
          int minimumDifference(vector<int>& nums) {
              int n = nums.size() / 3;
              vector<long long> left(n + 1);
              priority_queue<int> low;
              long long sum = 0;
              for (int i = 0; i < n; i++) {
                  low.push(nums[i]);
                  sum += nums[i];
              }
              left[0] = sum;
              for (int i = n; i < 2 * n; i++) {
                  low.push(nums[i]);
                  sum += nums[i] - low.top(); // evict the largest
                  low.pop();
                  left[i - n + 1] = sum;
              }
              priority_queue<int, vector<int>, greater<int>> high;
              sum = 0;
              for (int i = 2 * n; i < 3 * n; i++) {
                  high.push(nums[i]);
                  sum += nums[i];
              }
              long long best = left[n] - sum;
              for (int i = 2 * n - 1; i >= n; i--) {
                  high.push(nums[i]);
                  sum += nums[i] - high.top(); // evict the smallest
                  high.pop();
                  best = min(best, left[i - n] - sum);
              }
              return (int) best;
          }
        `,
        c: code`
          static void hpPush(long long* h, int* size, long long v) {
              int i = (*size)++;
              h[i] = v;
              while (i > 0) {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long long hpPop(long long* h, int* size) {
              long long top = h[0];
              (*size)--;
              if (*size > 0) {
                  h[0] = h[*size];
                  int j = 0;
                  for (;;) {
                      int l = 2 * j + 1, r = l + 1, s = j;
                      if (l < *size && h[l] < h[s]) s = l;
                      if (r < *size && h[r] < h[s]) s = r;
                      if (s == j) break;
                      long long t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          int minimumDifference(int* nums, int numsSize) {
              int n = numsSize / 3;
              long long* left = (long long*) malloc((size_t) (n + 1) * sizeof(long long));
              long long* heap = (long long*) malloc((size_t) (n + 2) * sizeof(long long));
              int size = 0;
              long long sum = 0;
              // max-heap of the kept prefix values, as negated keys
              for (int i = 0; i < n; i++) {
                  hpPush(heap, &size, -(long long) nums[i]);
                  sum += nums[i];
              }
              left[0] = sum;
              for (int i = n; i < 2 * n; i++) {
                  hpPush(heap, &size, -(long long) nums[i]);
                  sum += nums[i] + hpPop(heap, &size); // evict the largest
                  left[i - n + 1] = sum;
              }
              // min-heap of the kept suffix values
              size = 0;
              sum = 0;
              for (int i = 2 * n; i < 3 * n; i++) {
                  hpPush(heap, &size, nums[i]);
                  sum += nums[i];
              }
              long long best = left[n] - sum;
              for (int i = 2 * n - 1; i >= n; i--) {
                  hpPush(heap, &size, nums[i]);
                  sum += nums[i] - hpPop(heap, &size); // evict the smallest
                  if (left[i - n] - sum < best) best = left[i - n] - sum;
              }
              free(left);
              free(heap);
              return (int) best;
          }
        `,
        csharp: code`
          static void HeapPush(List<long> h, long v)
          {
              h.Add(v);
              int i = h.Count - 1;
              while (i > 0)
              {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long HeapPop(List<long> h)
          {
              long top = h[0];
              int last = h.Count - 1;
              h[0] = h[last];
              h.RemoveAt(last);
              int j = 0;
              while (true)
              {
                  int l = 2 * j + 1, r = l + 1, s = j;
                  if (l < h.Count && h[l] < h[s]) s = l;
                  if (r < h.Count && h[r] < h[s]) s = r;
                  if (s == j) break;
                  long t = h[s]; h[s] = h[j]; h[j] = t;
                  j = s;
              }
              return top;
          }

          public static int MinimumDifference(int[] nums)
          {
              int n = nums.Length / 3;
              var left = new long[n + 1];
              var low = new List<long>(); // max-heap of the kept prefix values, as negated keys
              long sum = 0;
              for (int i = 0; i < n; i++)
              {
                  HeapPush(low, -nums[i]);
                  sum += nums[i];
              }
              left[0] = sum;
              for (int i = n; i < 2 * n; i++)
              {
                  HeapPush(low, -nums[i]);
                  sum += nums[i] + HeapPop(low); // evict the largest
                  left[i - n + 1] = sum;
              }
              var high = new List<long>();
              sum = 0;
              for (int i = 2 * n; i < 3 * n; i++)
              {
                  HeapPush(high, nums[i]);
                  sum += nums[i];
              }
              long best = left[n] - sum;
              for (int i = 2 * n - 1; i >= n; i--)
              {
                  HeapPush(high, nums[i]);
                  sum += nums[i] - HeapPop(high); // evict the smallest
                  best = Math.Min(best, left[i - n] - sum);
              }
              return (int) best;
          }
        `,
        go: code`
          func hpPush(h *[]int, v int) {
              *h = append(*h, v)
              a := *h
              i := len(a) - 1
              for i > 0 {
                  p := (i - 1) / 2
                  if a[p] <= a[i] {
                      break
                  }
                  a[p], a[i] = a[i], a[p]
                  i = p
              }
          }

          func hpPop(h *[]int) int {
              a := *h
              top := a[0]
              last := len(a) - 1
              a[0] = a[last]
              a = a[:last]
              j := 0
              for {
                  l, r, s := 2*j+1, 2*j+2, j
                  if l < len(a) && a[l] < a[s] {
                      s = l
                  }
                  if r < len(a) && a[r] < a[s] {
                      s = r
                  }
                  if s == j {
                      break
                  }
                  a[s], a[j] = a[j], a[s]
                  j = s
              }
              *h = a
              return top
          }

          func minimumDifference(nums []int) int {
              n := len(nums) / 3
              left := make([]int, n+1)
              low := []int{} // max-heap of the kept prefix values, as negated keys
              sum := 0
              for i := 0; i < n; i++ {
                  hpPush(&low, -nums[i])
                  sum += nums[i]
              }
              left[0] = sum
              for i := n; i < 2*n; i++ {
                  hpPush(&low, -nums[i])
                  sum += nums[i] + hpPop(&low) // evict the largest
                  left[i-n+1] = sum
              }
              high := []int{}
              sum = 0
              for i := 2 * n; i < 3*n; i++ {
                  hpPush(&high, nums[i])
                  sum += nums[i]
              }
              best := left[n] - sum
              for i := 2*n - 1; i >= n; i-- {
                  hpPush(&high, nums[i])
                  sum += nums[i] - hpPop(&high) // evict the smallest
                  if left[i-n]-sum < best {
                      best = left[i-n] - sum
                  }
              }
              return best
          }
        `,
        kotlin: code`
          import java.util.PriorityQueue

          fun minimumDifference(nums: IntArray): Int {
              val n = nums.size / 3
              val left = LongArray(n + 1)
              val low = PriorityQueue<Int>(reverseOrder<Int>())
              var sum = 0L
              for (i in 0 until n) {
                  low.add(nums[i])
                  sum += nums[i]
              }
              left[0] = sum
              for (i in n until 2 * n) {
                  low.add(nums[i])
                  sum += nums[i] - low.poll() // evict the largest
                  left[i - n + 1] = sum
              }
              val high = PriorityQueue<Int>()
              sum = 0L
              for (i in 2 * n until 3 * n) {
                  high.add(nums[i])
                  sum += nums[i]
              }
              var best = left[n] - sum
              for (i in 2 * n - 1 downTo n) {
                  high.add(nums[i])
                  sum += nums[i] - high.poll() // evict the smallest
                  best = minOf(best, left[i - n] - sum)
              }
              return best.toInt()
          }
        `,
        swift: code`
          func hpPush(_ h: inout [Int], _ v: Int) {
              h.append(v)
              var i = h.count - 1
              while i > 0 {
                  let p = (i - 1) / 2
                  if h[p] <= h[i] { break }
                  h.swapAt(p, i)
                  i = p
              }
          }

          func hpPop(_ h: inout [Int]) -> Int {
              let top = h[0]
              let last = h.removeLast()
              if !h.isEmpty {
                  h[0] = last
                  var j = 0
                  while true {
                      let l = 2 * j + 1, r = l + 1
                      var s = j
                      if l < h.count && h[l] < h[s] { s = l }
                      if r < h.count && h[r] < h[s] { s = r }
                      if s == j { break }
                      h.swapAt(s, j)
                      j = s
                  }
              }
              return top
          }

          func minimumDifference(_ nums: [Int]) -> Int {
              let n = nums.count / 3
              var left = [Int](repeating: 0, count: n + 1)
              var low = [Int]() // max-heap of the kept prefix values, as negated keys
              var sum = 0
              for i in 0..<n {
                  hpPush(&low, -nums[i])
                  sum += nums[i]
              }
              left[0] = sum
              for i in n..<(2 * n) {
                  hpPush(&low, -nums[i])
                  sum += nums[i] + hpPop(&low) // evict the largest
                  left[i - n + 1] = sum
              }
              var high = [Int]()
              sum = 0
              for i in (2 * n)..<(3 * n) {
                  hpPush(&high, nums[i])
                  sum += nums[i]
              }
              var best = left[n] - sum
              var cut = 2 * n - 1
              while cut >= n {
                  hpPush(&high, nums[cut])
                  sum += nums[cut] - hpPop(&high) // evict the smallest
                  best = min(best, left[cut - n] - sum)
                  cut -= 1
              }
              return best
          }
        `,
        rust: code`
          use std::cmp::Reverse;
          use std::collections::BinaryHeap;

          fn minimumDifference(nums: Vec<i32>) -> i32 {
              let n = nums.len() / 3;
              let mut left = vec![0i64; n + 1];
              let mut low: BinaryHeap<i32> = BinaryHeap::new();
              let mut sum: i64 = 0;
              for i in 0..n {
                  low.push(nums[i]);
                  sum += nums[i] as i64;
              }
              left[0] = sum;
              for i in n..2 * n {
                  low.push(nums[i]);
                  sum += nums[i] as i64 - low.pop().unwrap() as i64; // evict the largest
                  left[i - n + 1] = sum;
              }
              let mut high: BinaryHeap<Reverse<i32>> = BinaryHeap::new();
              sum = 0;
              for i in 2 * n..3 * n {
                  high.push(Reverse(nums[i]));
                  sum += nums[i] as i64;
              }
              let mut best = left[n] - sum;
              for i in (n..2 * n).rev() {
                  high.push(Reverse(nums[i]));
                  let Reverse(small) = high.pop().unwrap(); // evict the smallest
                  sum += nums[i] as i64 - small as i64;
                  best = best.min(left[i - n] - sum);
              }
              best as i32
          }
        `,
        php: code`
          function minimumDifference($nums) {
              $n = intdiv(count($nums), 3);
              $left = [];
              $low = new \SplMaxHeap();
              $sum = 0;
              for ($i = 0; $i < $n; $i++) {
                  $low->insert($nums[$i]);
                  $sum += $nums[$i];
              }
              $left[0] = $sum;
              for ($i = $n; $i < 2 * $n; $i++) {
                  $low->insert($nums[$i]);
                  $sum += $nums[$i] - $low->extract(); // evict the largest
                  $left[$i - $n + 1] = $sum;
              }
              $high = new \SplMinHeap();
              $sum = 0;
              for ($i = 2 * $n; $i < 3 * $n; $i++) {
                  $high->insert($nums[$i]);
                  $sum += $nums[$i];
              }
              $best = $left[$n] - $sum;
              for ($i = 2 * $n - 1; $i >= $n; $i--) {
                  $high->insert($nums[$i]);
                  $sum += $nums[$i] - $high->extract(); // evict the smallest
                  if ($left[$i - $n] - $sum < $best) $best = $left[$i - $n] - $sum;
              }
              return $best;
          }
        `,
        ruby: code`
          def hp_push(h, v)
            h << v
            i = h.length - 1
            while i > 0
              par = (i - 1) / 2
              break if h[par] <= h[i]
              h[par], h[i] = h[i], h[par]
              i = par
            end
          end

          def hp_pop(h)
            top = h[0]
            last = h.pop
            unless h.empty?
              h[0] = last
              j = 0
              loop do
                l = 2 * j + 1
                r = l + 1
                s = j
                s = l if l < h.length && h[l] < h[s]
                s = r if r < h.length && h[r] < h[s]
                break if s == j
                h[s], h[j] = h[j], h[s]
                j = s
              end
            end
            top
          end

          def minimumDifference(nums)
            n = nums.length / 3
            low = [] # max-heap of the kept prefix values, as negated keys
            sum = 0
            (0...n).each do |i|
              hp_push(low, -nums[i])
              sum += nums[i]
            end
            left = [sum]
            (n...2 * n).each do |i|
              hp_push(low, -nums[i])
              sum += nums[i] + hp_pop(low) # evict the largest
              left << sum
            end
            high = []
            sum = 0
            (2 * n...3 * n).each do |i|
              hp_push(high, nums[i])
              sum += nums[i]
            end
            best = left[n] - sum
            (2 * n - 1).downto(n) do |i|
              hp_push(high, nums[i])
              sum += nums[i] - hp_pop(high) # evict the smallest
              best = [best, left[i - n] - sum].min
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Earliest Possible Day of Full Bloom (LC 2136) ────────────────
  (() => {
    // Exact subset DP over planting orders: the seeds in `mask` are planted
    // first (their total planting time is fixed), dp[mask] = best last bloom.
    const ref = (plant: number[], grow: number[]) => {
      const n = plant.length;
      const full = (1 << n) - 1;
      const dp = new Array(1 << n).fill(Infinity);
      const busy = new Array(1 << n).fill(0);
      dp[0] = 0;
      for (let mask = 0; mask <= full; mask++) {
        if (mask) { const low = mask & -mask; busy[mask] = busy[mask ^ low] + plant[31 - Math.clz32(low)]; }
        if (dp[mask] === Infinity) continue;
        for (let j = 0; j < n; j++) {
          if (mask & (1 << j)) continue;
          const cand = Math.max(dp[mask], busy[mask] + plant[j] + grow[j]);
          if (cand < dp[mask | (1 << j)]) dp[mask | (1 << j)] = cand;
        }
      }
      return dp[full];
    };
    return {
      slug: "earliest-possible-day-of-full-bloom",
      title: "Earliest Possible Day of Full Bloom",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Sorting", "Google", "Amazon"],
      signature: {
        funcName: "earliestFullBloom",
        params: [{ name: "plantTime", type: "int[]" as const }, { name: "growTime", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You have `n` flower seeds. Seed `i` needs `plantTime[i]` full days of planting work — the days need not be consecutive, but you can work on only one seed per day. Once its planting is finished, it grows for `growTime[i]` full days and blooms at the end of the last one; a bloomed flower stays in bloom forever.\n\nStarting on day `0`, choose the order of the work. Return the **earliest** day on which every seed is blooming.\n\nIn other words, if seed `i`'s planting finishes after `P` days of work in total, it blooms on day `P + growTime[i]`; the answer is the smallest possible maximum of those days.",
        [
          { in: "plantTime = [2,1,3], growTime = [1,5,2]", out: "7", note: "Plant seed 1 (done after 1 day, blooms day 6), then seed 2 (done after 4, blooms 6), then seed 0 (done after 6, blooms 7)." },
          { in: "plantTime = [1,2,3,2], growTime = [2,1,2,1]", out: "9" },
          { in: "plantTime = [1], growTime = [1]", out: "2" },
        ],
        ["n == plantTime.length == growTime.length", "1 <= n <= 10^5", "1 <= plantTime[i], growTime[i] <= 10^4"]),
      hints: [
        "Splitting a seed's planting across non-consecutive days never helps: finishing one seed before starting the next blooms everything at least as early.",
        "The total planting time is fixed; what matters is which seed's growing overlaps with the rest of the work.",
        "Plant the seeds in decreasing order of `growTime` — the slowest growers should start growing first.",
      ],
      editorial: explain({
        idea: "All planting takes the same total time whatever the order, so the question is only which seeds finish planting late. A seed that grows quickly can afford to be planted last; a slow grower must be planted early. Sorting by `growTime` descending is optimal.",
        steps: [
          "Order the seeds by `growTime`, largest first.",
          "Walk that order keeping `planted`, the days of work done so far: add the seed's `plantTime`, and its bloom day is `planted + growTime`.",
          "Return the maximum bloom day seen.",
        ],
        why: "Take any order with two adjacent seeds `a` then `b` where `growTime[a] < growTime[b]`, and let `P` be the planting work done when the second of them finishes. Before the swap `b` blooms on day `P + growTime[b]`. After it, `b` finishes earlier and blooms by `P - plantTime[a] + growTime[b]`, and `a` blooms on `P + growTime[a]` — both at most `P + growTime[b]`. Every other seed is unaffected, so the swap never makes the answer worse, and repeated swaps reach the descending order.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Sorting by `plantTime` (shortest job first) is the classic wrong guess — it ignores growing entirely.",
          "The bloom day uses the cumulative planting time **including** this seed.",
          "With the full limits the cumulative planting time reaches `10^9`, still within 32 bits, but only just.",
        ],
      }),
      examples: [
        { input: "[2,1,3]\n[1,5,2]", expectedOutput: "7" },
        { input: "[1,2,3,2]\n[2,1,2,1]", expectedOutput: "9" },
        { input: "[1]\n[1]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 6, 8]));
        const pTop = pick(rng, [1, 5, 50, 10000]);
        const gTop = pick(rng, [1, 5, 50, 10000]);
        const plant = Array.from({ length: n }, () => ri(rng, 1, pTop));
        const grow = Array.from({ length: n }, () => ri(rng, 1, gTop));
        return { input: `${fmtIntArr(plant)}\n${fmtIntArr(grow)}`, expectedOutput: String(ref(plant, grow)) };
      },
      solutions: {
        python: code`
          from typing import List

          def earliestFullBloom(plantTime: List[int], growTime: List[int]) -> int:
              order = sorted(range(len(plantTime)), key=lambda i: -growTime[i])
              planted = best = 0
              for i in order:
                  planted += plantTime[i]
                  best = max(best, planted + growTime[i])
              return best
        `,
        javascript: code`
          var earliestFullBloom = function(plantTime, growTime) {
              var order = [];
              for (var i = 0; i < plantTime.length; i++) order.push(i);
              order.sort(function(a, b) { return growTime[b] - growTime[a]; });
              var planted = 0, best = 0;
              for (var t = 0; t < order.length; t++) {
                  planted += plantTime[order[t]];
                  best = Math.max(best, planted + growTime[order[t]]);
              }
              return best;
          };
        `,
        typescript: code`
          function earliestFullBloom(plantTime: number[], growTime: number[]): number {
              var order: number[] = [];
              for (var i = 0; i < plantTime.length; i++) order.push(i);
              order.sort(function(a, b) { return growTime[b] - growTime[a]; });
              var planted = 0, best = 0;
              for (var t = 0; t < order.length; t++) {
                  planted += plantTime[order[t]];
                  best = Math.max(best, planted + growTime[order[t]]);
              }
              return best;
          }
        `,
        java: code`
          public static int earliestFullBloom(int[] plantTime, int[] growTime) {
              int n = plantTime.length;
              Integer[] order = new Integer[n];
              for (int i = 0; i < n; i++) order[i] = i;
              Arrays.sort(order, (a, b) -> Integer.compare(growTime[b], growTime[a]));
              int planted = 0, best = 0;
              for (int i : order) {
                  planted += plantTime[i];
                  best = Math.max(best, planted + growTime[i]);
              }
              return best;
          }
        `,
        cpp: code`
          int earliestFullBloom(vector<int>& plantTime, vector<int>& growTime) {
              int n = plantTime.size();
              vector<int> order(n);
              for (int i = 0; i < n; i++) order[i] = i;
              sort(order.begin(), order.end(), [&](int a, int b) { return growTime[a] > growTime[b]; });
              int planted = 0, best = 0;
              for (int i : order) {
                  planted += plantTime[i];
                  best = max(best, planted + growTime[i]);
              }
              return best;
          }
        `,
        c: code`
          static int cmpDesc(const void* a, const void* b) {
              long long x = *(const long long*) a, y = *(const long long*) b;
              return (y > x) - (y < x);
          }

          int earliestFullBloom(int* plantTime, int plantTimeSize, int* growTime, int growTimeSize) {
              int n = plantTimeSize;
              // Seeds ordered by growTime, largest first, packed as growTime * 2^17 + index.
              long long* order = (long long*) malloc((size_t) (n + 1) * sizeof(long long));
              for (int i = 0; i < n; i++) order[i] = (long long) growTime[i] * 131072 + i;
              qsort(order, (size_t) n, sizeof(long long), cmpDesc);
              int planted = 0, best = 0;
              for (int t = 0; t < n; t++) {
                  int i = (int) (order[t] % 131072);
                  planted += plantTime[i];
                  if (planted + growTime[i] > best) best = planted + growTime[i];
              }
              free(order);
              return best;
          }
        `,
        csharp: code`
          public static int EarliestFullBloom(int[] plantTime, int[] growTime)
          {
              int n = plantTime.Length;
              var order = new int[n];
              for (int i = 0; i < n; i++) order[i] = i;
              Array.Sort(order, (a, b) => growTime[b].CompareTo(growTime[a]));
              int planted = 0, best = 0;
              foreach (int i in order)
              {
                  planted += plantTime[i];
                  best = Math.Max(best, planted + growTime[i]);
              }
              return best;
          }
        `,
        go: code`
          func earliestFullBloom(plantTime []int, growTime []int) int {
              n := len(plantTime)
              order := make([]int, n)
              for i := range order {
                  order[i] = i
              }
              sort.Slice(order, func(a, b int) bool { return growTime[order[a]] > growTime[order[b]] })
              planted, best := 0, 0
              for _, i := range order {
                  planted += plantTime[i]
                  if planted+growTime[i] > best {
                      best = planted + growTime[i]
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun earliestFullBloom(plantTime: IntArray, growTime: IntArray): Int {
              val order = plantTime.indices.sortedByDescending { growTime[it] }
              var planted = 0
              var best = 0
              for (i in order) {
                  planted += plantTime[i]
                  best = maxOf(best, planted + growTime[i])
              }
              return best
          }
        `,
        swift: code`
          func earliestFullBloom(_ plantTime: [Int], _ growTime: [Int]) -> Int {
              let order = (0..<plantTime.count).sorted { growTime[$0] > growTime[$1] }
              var planted = 0, best = 0
              for i in order {
                  planted += plantTime[i]
                  best = max(best, planted + growTime[i])
              }
              return best
          }
        `,
        rust: code`
          fn earliestFullBloom(plantTime: Vec<i32>, growTime: Vec<i32>) -> i32 {
              let mut order: Vec<usize> = (0..plantTime.len()).collect();
              order.sort_by(|&a, &b| growTime[b].cmp(&growTime[a]));
              let mut planted = 0;
              let mut best = 0;
              for &i in order.iter() {
                  planted += plantTime[i];
                  best = best.max(planted + growTime[i]);
              }
              best
          }
        `,
        php: code`
          function earliestFullBloom($plantTime, $growTime) {
              $order = array_keys($plantTime);
              usort($order, function ($a, $b) use ($growTime) { return $growTime[$b] <=> $growTime[$a]; });
              $planted = 0;
              $best = 0;
              foreach ($order as $i) {
                  $planted += $plantTime[$i];
                  if ($planted + $growTime[$i] > $best) $best = $planted + $growTime[$i];
              }
              return $best;
          }
        `,
        ruby: code`
          def earliestFullBloom(plantTime, growTime)
            order = (0...plantTime.length).sort_by { |i| -growTime[i] }
            planted = 0
            best = 0
            order.each do |i|
              planted += plantTime[i]
              best = [best, planted + growTime[i]].max
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Choose K Elements With Maximum Sum (LC 3478) ─────────────────
  (() => {
    const ref = (nums1: number[], nums2: number[], k: number) =>
      nums1.map((v) => {
        const pool: number[] = [];
        for (let j = 0; j < nums1.length; j++) if (nums1[j] < v) pool.push(nums2[j]);
        pool.sort((a, b) => b - a);
        return pool.slice(0, k).reduce((s, x) => s + x, 0);
      });
    return {
      slug: "choose-k-elements-with-maximum-sum",
      title: "Choose K Elements With Maximum Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Heap (Priority Queue)", "Amazon", "Google"],
      signature: {
        funcName: "findMaxSum",
        params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "You are given two arrays `nums1` and `nums2` of length `n` and an integer `k`.\n\nFor every index `i`, look at all indices `j` with `nums1[j] < nums1[i]` (strictly smaller). From the values `nums2[j]` at those indices, pick **at most** `k` so that their sum is as large as possible. That maximum sum is `answer[i]` (it is `0` when no index qualifies).\n\nReturn `answer`.\n\n*Constraint note:* `nums2` values are capped at `10^4` (the original allows `10^6`) so every answer fits in a 32-bit integer.",
        [
          { in: "nums1 = [3,1,3,2], nums2 = [5,9,4,7], k = 1", out: "[9,0,9,9]", note: "For both 3s the candidates are indices 1 and 3, and the single best value is 9; for the 2 only index 1 qualifies." },
          { in: "nums1 = [4,2,1,5,3], nums2 = [10,20,30,40,50], k = 2", out: "[80,30,0,80,50]" },
          { in: "nums1 = [2,2,2], nums2 = [3,1,2], k = 2", out: "[0,0,0]", note: "Equal values do not count — the comparison is strict." },
        ],
        ["n == nums1.length == nums2.length", "1 <= n <= 10^5", "1 <= nums1[i] <= 10^6", "1 <= nums2[i] <= 10^4", "1 <= k <= n"]),
      hints: [
        "Process the indices in increasing order of `nums1`; the candidates for an index are exactly the ones processed before it — minus those with an equal `nums1`.",
        "Maintain the `k` largest `nums2` values seen so far and their sum with a min-heap of size `k`.",
        "Handle a run of equal `nums1` values as a group: answer all of them first, then add their `nums2` values to the heap.",
      ],
      editorial: explain({
        idea: "Sorted by `nums1`, the candidate set of each index is a prefix of the order. So keep a running \"best `k` of the prefix\" — a size-`k` min-heap whose root is the weakest value kept — and its sum.",
        steps: [
          "Sort the indices by `nums1`.",
          "Walk the order in groups of equal `nums1`. For every index of a group, the answer is the current heap sum.",
          "Then push each `nums2` of the group into the min-heap, adding it to the sum; whenever the heap exceeds `k` elements, pop the smallest and subtract it.",
        ],
        why: "When a group is answered, the heap has seen exactly the indices with strictly smaller `nums1`. A size-`k` min-heap that always evicts its minimum holds the `k` largest values seen (or all of them if fewer), and since every `nums2` is positive, taking as many as allowed is optimal.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Answer a group before inserting it, or equal `nums1` values count each other.",
          "The answers must be placed at the original indices.",
          "With the original limits the sums exceed 32 bits; this version caps `nums2` so they do not.",
        ],
      }),
      examples: [
        { input: "[3,1,3,2]\n[5,9,4,7]\n1", expectedOutput: "[9,0,9,9]" },
        { input: "[4,2,1,5,3]\n[10,20,30,40,50]\n2", expectedOutput: "[80,30,0,80,50]" },
        { input: "[2,2,2]\n[3,1,2]\n2", expectedOutput: "[0,0,0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 30]));
        const t1 = pick(rng, [1, 3, 10, 1000000]);
        const t2 = pick(rng, [1, 10, 10000]);
        const nums1 = Array.from({ length: n }, () => ri(rng, 1, t1));
        const nums2 = Array.from({ length: n }, () => ri(rng, 1, t2));
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(nums1)}\n${fmtIntArr(nums2)}\n${k}`, expectedOutput: fmtIntArr(ref(nums1, nums2, k)) };
      },
      solutions: {
        python: code`
          from typing import List
          import heapq

          def findMaxSum(nums1: List[int], nums2: List[int], k: int) -> List[int]:
              n = len(nums1)
              order = sorted(range(n), key=lambda i: nums1[i])
              ans = [0] * n
              heap = []  # the k largest nums2 values among strictly smaller nums1
              total = 0
              i = 0
              while i < n:
                  j = i
                  while j < n and nums1[order[j]] == nums1[order[i]]:
                      ans[order[j]] = total
                      j += 1
                  for t in range(i, j):
                      v = nums2[order[t]]
                      heapq.heappush(heap, v)
                      total += v
                      if len(heap) > k:
                          total -= heapq.heappop(heap)
                  i = j
              return ans
        `,
        javascript: code`
          var findMaxSum = function(nums1, nums2, k) {
              var n = nums1.length;
              var order = [];
              for (var x = 0; x < n; x++) order.push(x);
              order.sort(function(a, b) { return nums1[a] - nums1[b]; });
              var ans = [];
              for (var z = 0; z < n; z++) ans.push(0);
              var heap = []; // the k largest nums2 values among strictly smaller nums1
              var total = 0;
              var i = 0;
              while (i < n) {
                  var j = i;
                  while (j < n && nums1[order[j]] === nums1[order[i]]) {
                      ans[order[j]] = total;
                      j++;
                  }
                  for (var t = i; t < j; t++) {
                      var v = nums2[order[t]];
                      heapPush(heap, v);
                      total += v;
                      if (heap.length > k) total -= heapPop(heap);
                  }
                  i = j;
              }
              return ans;
          };

          var heapPush = function(h, v) {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          };

          var heapPop = function(h) {
              var top = h[0];
              var last = h.pop();
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          };
        `,
        typescript: code`
          function heapPush(h: number[], v: number): void {
              h.push(v);
              var i = h.length - 1;
              while (i > 0) {
                  var p = (i - 1) >> 1;
                  if (h[p] <= h[i]) break;
                  var t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          function heapPop(h: number[]): number {
              var top = h[0];
              var last = h.pop() as number;
              if (h.length > 0) {
                  h[0] = last;
                  var j = 0;
                  for (;;) {
                      var l = 2 * j + 1, r = l + 1, s = j;
                      if (l < h.length && h[l] < h[s]) s = l;
                      if (r < h.length && h[r] < h[s]) s = r;
                      if (s === j) break;
                      var t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          function findMaxSum(nums1: number[], nums2: number[], k: number): number[] {
              var n = nums1.length;
              var order: number[] = [];
              for (var x = 0; x < n; x++) order.push(x);
              order.sort(function(a, b) { return nums1[a] - nums1[b]; });
              var ans: number[] = [];
              for (var z = 0; z < n; z++) ans.push(0);
              var heap: number[] = []; // the k largest nums2 values among strictly smaller nums1
              var total = 0;
              var i = 0;
              while (i < n) {
                  var j = i;
                  while (j < n && nums1[order[j]] === nums1[order[i]]) {
                      ans[order[j]] = total;
                      j++;
                  }
                  for (var t = i; t < j; t++) {
                      var v = nums2[order[t]];
                      heapPush(heap, v);
                      total += v;
                      if (heap.length > k) total -= heapPop(heap);
                  }
                  i = j;
              }
              return ans;
          }
        `,
        java: code`
          public static int[] findMaxSum(int[] nums1, int[] nums2, int k) {
              int n = nums1.length;
              Integer[] order = new Integer[n];
              for (int x = 0; x < n; x++) order[x] = x;
              Arrays.sort(order, (a, b) -> Integer.compare(nums1[a], nums1[b]));
              int[] ans = new int[n];
              PriorityQueue<Integer> heap = new PriorityQueue<>(); // the k largest nums2 values so far
              long total = 0;
              int i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && nums1[order[j]] == nums1[order[i]]) {
                      ans[order[j]] = (int) total;
                      j++;
                  }
                  for (int t = i; t < j; t++) {
                      int v = nums2[order[t]];
                      heap.add(v);
                      total += v;
                      if (heap.size() > k) total -= heap.poll();
                  }
                  i = j;
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> findMaxSum(vector<int>& nums1, vector<int>& nums2, int k) {
              int n = nums1.size();
              vector<int> order(n);
              for (int x = 0; x < n; x++) order[x] = x;
              sort(order.begin(), order.end(), [&](int a, int b) { return nums1[a] < nums1[b]; });
              vector<int> ans(n, 0);
              priority_queue<int, vector<int>, greater<int>> heap; // the k largest nums2 values so far
              long long total = 0;
              int i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && nums1[order[j]] == nums1[order[i]]) {
                      ans[order[j]] = (int) total;
                      j++;
                  }
                  for (int t = i; t < j; t++) {
                      int v = nums2[order[t]];
                      heap.push(v);
                      total += v;
                      if ((int) heap.size() > k) {
                          total -= heap.top();
                          heap.pop();
                      }
                  }
                  i = j;
              }
              return ans;
          }
        `,
        c: code`
          static void hpPush(long long* h, int* size, long long v) {
              int i = (*size)++;
              h[i] = v;
              while (i > 0) {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long long hpPop(long long* h, int* size) {
              long long top = h[0];
              (*size)--;
              if (*size > 0) {
                  h[0] = h[*size];
                  int j = 0;
                  for (;;) {
                      int l = 2 * j + 1, r = l + 1, s = j;
                      if (l < *size && h[l] < h[s]) s = l;
                      if (r < *size && h[r] < h[s]) s = r;
                      if (s == j) break;
                      long long t = h[s]; h[s] = h[j]; h[j] = t;
                      j = s;
                  }
              }
              return top;
          }

          static int cmpLL(const void* a, const void* b) {
              long long x = *(const long long*) a, y = *(const long long*) b;
              return (x > y) - (x < y);
          }

          int* findMaxSum(int* nums1, int nums1Size, int* nums2, int nums2Size, int k, int* returnSize) {
              int n = nums1Size;
              // Indices ordered by nums1, packed as nums1 * 2^17 + index.
              long long* order = (long long*) malloc((size_t) (n + 1) * sizeof(long long));
              for (int x = 0; x < n; x++) order[x] = (long long) nums1[x] * 131072 + x;
              qsort(order, (size_t) n, sizeof(long long), cmpLL);
              int* idx = (int*) malloc((size_t) (n + 1) * sizeof(int));
              for (int x = 0; x < n; x++) idx[x] = (int) (order[x] % 131072);
              int* ans = (int*) malloc((size_t) (n + 1) * sizeof(int));
              long long* heap = (long long*) malloc((size_t) (n + 2) * sizeof(long long));
              int size = 0;
              long long total = 0;
              int i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && nums1[idx[j]] == nums1[idx[i]]) {
                      ans[idx[j]] = (int) total;
                      j++;
                  }
                  for (int t = i; t < j; t++) {
                      int v = nums2[idx[t]];
                      hpPush(heap, &size, v);
                      total += v;
                      if (size > k) total -= hpPop(heap, &size);
                  }
                  i = j;
              }
              free(order);
              free(idx);
              free(heap);
              *returnSize = n;
              return ans;
          }
        `,
        csharp: code`
          static void HeapPush(List<long> h, long v)
          {
              h.Add(v);
              int i = h.Count - 1;
              while (i > 0)
              {
                  int p = (i - 1) / 2;
                  if (h[p] <= h[i]) break;
                  long t = h[p]; h[p] = h[i]; h[i] = t;
                  i = p;
              }
          }

          static long HeapPop(List<long> h)
          {
              long top = h[0];
              int last = h.Count - 1;
              h[0] = h[last];
              h.RemoveAt(last);
              int j = 0;
              while (true)
              {
                  int l = 2 * j + 1, r = l + 1, s = j;
                  if (l < h.Count && h[l] < h[s]) s = l;
                  if (r < h.Count && h[r] < h[s]) s = r;
                  if (s == j) break;
                  long t = h[s]; h[s] = h[j]; h[j] = t;
                  j = s;
              }
              return top;
          }

          public static int[] FindMaxSum(int[] nums1, int[] nums2, int k)
          {
              int n = nums1.Length;
              var order = new int[n];
              for (int x = 0; x < n; x++) order[x] = x;
              Array.Sort(order, (a, b) => nums1[a].CompareTo(nums1[b]));
              var ans = new int[n];
              var heap = new List<long>(); // the k largest nums2 values so far
              long total = 0;
              int i = 0;
              while (i < n)
              {
                  int j = i;
                  while (j < n && nums1[order[j]] == nums1[order[i]])
                  {
                      ans[order[j]] = (int) total;
                      j++;
                  }
                  for (int t = i; t < j; t++)
                  {
                      int v = nums2[order[t]];
                      HeapPush(heap, v);
                      total += v;
                      if (heap.Count > k) total -= HeapPop(heap);
                  }
                  i = j;
              }
              return ans;
          }
        `,
        go: code`
          func hpPush(h *[]int, v int) {
              *h = append(*h, v)
              a := *h
              i := len(a) - 1
              for i > 0 {
                  p := (i - 1) / 2
                  if a[p] <= a[i] {
                      break
                  }
                  a[p], a[i] = a[i], a[p]
                  i = p
              }
          }

          func hpPop(h *[]int) int {
              a := *h
              top := a[0]
              last := len(a) - 1
              a[0] = a[last]
              a = a[:last]
              j := 0
              for {
                  l, r, s := 2*j+1, 2*j+2, j
                  if l < len(a) && a[l] < a[s] {
                      s = l
                  }
                  if r < len(a) && a[r] < a[s] {
                      s = r
                  }
                  if s == j {
                      break
                  }
                  a[s], a[j] = a[j], a[s]
                  j = s
              }
              *h = a
              return top
          }

          func findMaxSum(nums1 []int, nums2 []int, k int) []int {
              n := len(nums1)
              order := make([]int, n)
              for x := range order {
                  order[x] = x
              }
              sort.Slice(order, func(a, b int) bool { return nums1[order[a]] < nums1[order[b]] })
              ans := make([]int, n)
              pq := []int{} // the k largest nums2 values so far
              total := 0
              i := 0
              for i < n {
                  j := i
                  for j < n && nums1[order[j]] == nums1[order[i]] {
                      ans[order[j]] = total
                      j++
                  }
                  for t := i; t < j; t++ {
                      v := nums2[order[t]]
                      hpPush(&pq, v)
                      total += v
                      if len(pq) > k {
                          total -= hpPop(&pq)
                      }
                  }
                  i = j
              }
              return ans
          }
        `,
        kotlin: code`
          import java.util.PriorityQueue

          fun findMaxSum(nums1: IntArray, nums2: IntArray, k: Int): IntArray {
              val n = nums1.size
              val order = nums1.indices.sortedBy { nums1[it] }
              val ans = IntArray(n)
              val heap = PriorityQueue<Int>() // the k largest nums2 values so far
              var total = 0L
              var i = 0
              while (i < n) {
                  var j = i
                  while (j < n && nums1[order[j]] == nums1[order[i]]) {
                      ans[order[j]] = total.toInt()
                      j++
                  }
                  for (t in i until j) {
                      val v = nums2[order[t]]
                      heap.add(v)
                      total += v
                      if (heap.size > k) total -= heap.poll()
                  }
                  i = j
              }
              return ans
          }
        `,
        swift: code`
          func hpPush(_ h: inout [Int], _ v: Int) {
              h.append(v)
              var i = h.count - 1
              while i > 0 {
                  let p = (i - 1) / 2
                  if h[p] <= h[i] { break }
                  h.swapAt(p, i)
                  i = p
              }
          }

          func hpPop(_ h: inout [Int]) -> Int {
              let top = h[0]
              let last = h.removeLast()
              if !h.isEmpty {
                  h[0] = last
                  var j = 0
                  while true {
                      let l = 2 * j + 1, r = l + 1
                      var s = j
                      if l < h.count && h[l] < h[s] { s = l }
                      if r < h.count && h[r] < h[s] { s = r }
                      if s == j { break }
                      h.swapAt(s, j)
                      j = s
                  }
              }
              return top
          }

          func findMaxSum(_ nums1: [Int], _ nums2: [Int], _ k: Int) -> [Int] {
              let n = nums1.count
              let order = (0..<n).sorted { nums1[$0] < nums1[$1] }
              var ans = [Int](repeating: 0, count: n)
              var heap = [Int]() // the k largest nums2 values so far
              var total = 0
              var i = 0
              while i < n {
                  var j = i
                  while j < n && nums1[order[j]] == nums1[order[i]] {
                      ans[order[j]] = total
                      j += 1
                  }
                  for t in i..<j {
                      let v = nums2[order[t]]
                      hpPush(&heap, v)
                      total += v
                      if heap.count > k { total -= hpPop(&heap) }
                  }
                  i = j
              }
              return ans
          }
        `,
        rust: code`
          use std::cmp::Reverse;
          use std::collections::BinaryHeap;

          fn findMaxSum(nums1: Vec<i32>, nums2: Vec<i32>, k: i32) -> Vec<i32> {
              let n = nums1.len();
              let mut order: Vec<usize> = (0..n).collect();
              order.sort_by_key(|&x| nums1[x]);
              let mut ans = vec![0i32; n];
              let mut heap: BinaryHeap<Reverse<i32>> = BinaryHeap::new(); // the k largest nums2 values so far
              let mut total: i64 = 0;
              let mut i = 0;
              while i < n {
                  let mut j = i;
                  while j < n && nums1[order[j]] == nums1[order[i]] {
                      ans[order[j]] = total as i32;
                      j += 1;
                  }
                  for t in i..j {
                      let v = nums2[order[t]];
                      heap.push(Reverse(v));
                      total += v as i64;
                      if heap.len() > k as usize {
                          let Reverse(small) = heap.pop().unwrap();
                          total -= small as i64;
                      }
                  }
                  i = j;
              }
              ans
          }
        `,
        php: code`
          function findMaxSum($nums1, $nums2, $k) {
              $n = count($nums1);
              $order = range(0, $n - 1);
              usort($order, function ($a, $b) use ($nums1) { return $nums1[$a] <=> $nums1[$b]; });
              $ans = array_fill(0, $n, 0);
              $heap = new \SplMinHeap(); // the k largest nums2 values so far
              $total = 0;
              $i = 0;
              while ($i < $n) {
                  $j = $i;
                  while ($j < $n && $nums1[$order[$j]] == $nums1[$order[$i]]) {
                      $ans[$order[$j]] = $total;
                      $j++;
                  }
                  for ($t = $i; $t < $j; $t++) {
                      $v = $nums2[$order[$t]];
                      $heap->insert($v);
                      $total += $v;
                      if ($heap->count() > $k) $total -= $heap->extract();
                  }
                  $i = $j;
              }
              return $ans;
          }
        `,
        ruby: code`
          def hp_push(h, v)
            h << v
            i = h.length - 1
            while i > 0
              par = (i - 1) / 2
              break if h[par] <= h[i]
              h[par], h[i] = h[i], h[par]
              i = par
            end
          end

          def hp_pop(h)
            top = h[0]
            last = h.pop
            unless h.empty?
              h[0] = last
              j = 0
              loop do
                l = 2 * j + 1
                r = l + 1
                s = j
                s = l if l < h.length && h[l] < h[s]
                s = r if r < h.length && h[r] < h[s]
                break if s == j
                h[s], h[j] = h[j], h[s]
                j = s
              end
            end
            top
          end

          def findMaxSum(nums1, nums2, k)
            n = nums1.length
            order = (0...n).sort_by { |x| nums1[x] }
            ans = Array.new(n, 0)
            heap = [] # the k largest nums2 values so far
            total = 0
            i = 0
            while i < n
              j = i
              while j < n && nums1[order[j]] == nums1[order[i]]
                ans[order[j]] = total
                j += 1
              end
              (i...j).each do |t|
                v = nums2[order[t]]
                hp_push(heap, v)
                total += v
                total -= hp_pop(heap) if heap.length > k
              end
              i = j
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Maximum Spending After Buying Items (LC 2931) ────────────────
  (() => {
    // Simulates the shops literally: each day buy the cheapest rightmost item.
    const ref = (values: number[][]) => {
      const ends = values.map((row) => row.length - 1);
      let total = 0;
      for (let day = 1; ; day++) {
        let best = -1;
        for (let i = 0; i < values.length; i++) if (ends[i] >= 0 && (best < 0 || values[i][ends[i]] < values[best][ends[best]])) best = i;
        if (best < 0) break;
        total += values[best][ends[best]] * day;
        ends[best]--;
      }
      return total;
    };
    return {
      slug: "maximum-spending-after-buying-items",
      title: "Maximum Spending After Buying Items",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Sorting", "Heap (Priority Queue)", "Amazon", "Google"],
      signature: { funcName: "maxSpending", params: [{ name: "values", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "There are `m` shops, each selling `n` items. `values[i][j]` is the value of item `j` in shop `i`, and each shop's items are sorted in **non-increasing** order (`values[i][j] >= values[i][j + 1]`).\n\nOn day `d` (starting from day 1) you buy exactly one item: you choose a shop and buy its **rightmost** remaining item, paying `values[i][j] * d`. After `m * n` days every item has been bought.\n\nReturn the **maximum** total amount you can spend.\n\n*Constraint note:* the sizes and values are capped (`n <= 100`, `values[i][j] <= 1000`; the original allows `10^4` and `10^6`) so the total fits in a 32-bit integer.",
        [
          { in: "values = [[5,3],[4,1]]", out: "39", note: "Buy 1, 3, 4, 5 on days 1 to 4: 1 + 6 + 12 + 20 = 39." },
          { in: "values = [[10,8,6,4,2],[9,7,5,3,2]]", out: "386" },
          { in: "values = [[7]]", out: "7" },
        ],
        ["1 <= m == values.length <= 10", "1 <= n == values[i].length <= 100", "1 <= values[i][j] <= 1000", "values[i][j] >= values[i][j + 1]"]),
      hints: [
        "Day multipliers grow, so expensive items should be bought as late as possible.",
        "Because every row is non-increasing, a shop's rightmost item is its cheapest — the globally cheapest remaining item is always available.",
        "Buy the cheapest available item each day (a min-heap over the shops' rightmost items), which is the same as multiplying the sorted list of all values by 1, 2, 3, ...",
      ],
      editorial: explain({
        idea: "By the rearrangement inequality, pairing the smallest values with the smallest day numbers maximises `sum(value * day)`. The shop rule never gets in the way: the cheapest remaining item overall is always some shop's rightmost item.",
        steps: [
          "Collect every value (or keep a min-heap of each shop's rightmost item).",
          "Take values in ascending order; the `d`-th one is bought on day `d`.",
          "Add `value * d` for each and return the total.",
        ],
        why: "Swapping any two purchases that are out of order (a pricier item bought before a cheaper one) increases the total by `(big - small) * (later - earlier) >= 0`, so ascending order is optimal among all orders. And it is achievable: each row is sorted non-increasing, so its rightmost remaining item is its minimum, hence the global minimum is always on offer.",
        time: "O(mn log(mn))",
        space: "O(mn)",
        pitfalls: [
          "Buying the **largest** item first is the intuitive but wrong direction — the multiplier rewards waiting.",
          "Day numbers start at 1, not 0.",
          "With the original limits the total needs 64 bits.",
        ],
      }),
      examples: [
        { input: "[[5,3],[4,1]]", expectedOutput: "39" },
        { input: "[[10,8,6,4,2],[9,7,5,3,2]]", expectedOutput: "386" },
        { input: "[[7]]", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 3, 10]));
        const n = ri(rng, 1, pick(rng, [1, 4, 20, 100]));
        const top = pick(rng, [1, 5, 50, 1000]);
        const values = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 1, top)).sort((a, b) => b - a));
        return { input: fmtIntMat(values), expectedOutput: String(ref(values)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxSpending(values: List[List[int]]) -> int:
              items = sorted(v for row in values for v in row)
              return sum(v * (d + 1) for d, v in enumerate(items))
        `,
        javascript: code`
          var maxSpending = function(values) {
              var items = [];
              for (var i = 0; i < values.length; i++) {
                  for (var j = 0; j < values[i].length; j++) items.push(values[i][j]);
              }
              items.sort(function(a, b) { return a - b; });
              var total = 0;
              for (var d = 0; d < items.length; d++) total += items[d] * (d + 1);
              return total;
          };
        `,
        typescript: code`
          function maxSpending(values: number[][]): number {
              var items: number[] = [];
              for (var i = 0; i < values.length; i++) {
                  for (var j = 0; j < values[i].length; j++) items.push(values[i][j]);
              }
              items.sort(function(a, b) { return a - b; });
              var total = 0;
              for (var d = 0; d < items.length; d++) total += items[d] * (d + 1);
              return total;
          }
        `,
        java: code`
          public static int maxSpending(int[][] values) {
              int m = values.length, n = values[0].length;
              int[] items = new int[m * n];
              int at = 0;
              for (int[] row : values) for (int v : row) items[at++] = v;
              Arrays.sort(items);
              long total = 0;
              for (int d = 0; d < items.length; d++) total += (long) items[d] * (d + 1);
              return (int) total;
          }
        `,
        cpp: code`
          int maxSpending(vector<vector<int>>& values) {
              vector<int> items;
              for (auto& row : values) for (int v : row) items.push_back(v);
              sort(items.begin(), items.end());
              long long total = 0;
              for (size_t d = 0; d < items.size(); d++) total += (long long) items[d] * (long long) (d + 1);
              return (int) total;
          }
        `,
        c: code`
          static int cmpInt(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          int maxSpending(int** values, int valuesSize, int* valuesColSize) {
              int total_items = 0;
              for (int i = 0; i < valuesSize; i++) total_items += valuesColSize[i];
              int* items = (int*) malloc((size_t) (total_items + 1) * sizeof(int));
              int at = 0;
              for (int i = 0; i < valuesSize; i++) {
                  for (int j = 0; j < valuesColSize[i]; j++) items[at++] = values[i][j];
              }
              qsort(items, (size_t) total_items, sizeof(int), cmpInt);
              long long total = 0;
              for (int d = 0; d < total_items; d++) total += (long long) items[d] * (d + 1);
              free(items);
              return (int) total;
          }
        `,
        csharp: code`
          public static int MaxSpending(int[][] values)
          {
              var items = new List<int>();
              foreach (var row in values) items.AddRange(row);
              items.Sort();
              long total = 0;
              for (int d = 0; d < items.Count; d++) total += (long) items[d] * (d + 1);
              return (int) total;
          }
        `,
        go: code`
          func maxSpending(values [][]int) int {
              items := []int{}
              for _, row := range values {
                  items = append(items, row...)
              }
              sort.Ints(items)
              total := 0
              for d, v := range items {
                  total += v * (d + 1)
              }
              return total
          }
        `,
        kotlin: code`
          fun maxSpending(values: Array<IntArray>): Int {
              val items = ArrayList<Int>()
              for (row in values) for (v in row) items.add(v)
              items.sort()
              var total = 0L
              for (d in items.indices) total += items[d].toLong() * (d + 1)
              return total.toInt()
          }
        `,
        swift: code`
          func maxSpending(_ values: [[Int]]) -> Int {
              let items = values.flatMap { $0 }.sorted()
              var total = 0
              for (d, v) in items.enumerated() { total += v * (d + 1) }
              return total
          }
        `,
        rust: code`
          fn maxSpending(values: Vec<Vec<i32>>) -> i32 {
              let mut items: Vec<i64> = Vec::new();
              for row in values.iter() {
                  for &v in row.iter() {
                      items.push(v as i64);
                  }
              }
              items.sort();
              let mut total: i64 = 0;
              for (d, &v) in items.iter().enumerate() {
                  total += v * (d as i64 + 1);
              }
              total as i32
          }
        `,
        php: code`
          function maxSpending($values) {
              $items = [];
              foreach ($values as $row) {
                  foreach ($row as $v) $items[] = $v;
              }
              sort($items);
              $total = 0;
              foreach ($items as $d => $v) $total += $v * ($d + 1);
              return $total;
          }
        `,
        ruby: code`
          def maxSpending(values)
            values.flatten.sort.each_with_index.map { |v, d| v * (d + 1) }.sum
          end
        `,
      },
    };
  })(),

  // ── Minimum Amount of Damage Dealt to Bob (LC 3273) ──────────────
  (() => {
    // Exact subset DP over kill orders for small n; for larger n the
    // exchange-argument order computed with fractions (a different route).
    const ref = (power: number, damage: number[], health: number[]) => {
      const n = damage.length;
      const t = health.map((h) => Math.ceil(h / power));
      if (n <= 9) {
        const dp = new Array(1 << n).fill(Infinity);
        const busy = new Array(1 << n).fill(0);
        dp[0] = 0;
        for (let mask = 0; mask < 1 << n; mask++) {
          if (mask) { const low = mask & -mask; busy[mask] = busy[mask ^ low] + t[31 - Math.clz32(low)]; }
          for (let j = 0; j < n; j++) {
            if (mask & (1 << j)) continue;
            const cand = dp[mask] + damage[j] * (busy[mask] + t[j]);
            if (cand < dp[mask | (1 << j)]) dp[mask | (1 << j)] = cand;
          }
        }
        return dp[(1 << n) - 1];
      }
      const order = damage.map((_, i) => i).sort((a, b) => t[a] / damage[a] - t[b] / damage[b]);
      let clock = 0, total = 0;
      for (const i of order) { clock += t[i]; total += damage[i] * clock; }
      return total;
    };
    return {
      slug: "minimum-amount-of-damage-dealt-to-bob",
      title: "Minimum Amount of Damage Dealt to Bob",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Sorting", "Google", "Amazon"],
      signature: {
        funcName: "minDamage",
        params: [{ name: "power", type: "int" as const }, { name: "damage", type: "int[]" as const }, { name: "health", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Bob faces `n` enemies. Enemy `i` deals `damage[i]` points of damage to Bob every second while its health is above zero, and starts with `health[i]` health.\n\nEvery second, first all living enemies hit Bob, and then Bob strikes one living enemy of his choice, removing `power` health from it. An enemy whose health drops to `0` or below dies and deals no more damage.\n\nReturn the **minimum** total damage Bob takes before all enemies are dead.\n\n*Constraint note:* the sizes are capped (`n <= 300`, `damage[i], health[i] <= 100`; the original allows `10^5` and `10^4`) so the total fits in a 32-bit integer.",
        [
          { in: "power = 3, damage = [2,5], health = [7,3]", out: "13", note: "Kill enemy 1 first (1 second, Bob takes 2 + 5), then enemy 0 needs 3 more seconds at 2 damage each: 7 + 6 = 13." },
          { in: "power = 4, damage = [1,2,3,4], health = [4,5,6,8]", out: "39" },
          { in: "power = 8, damage = [40], health = [59]", out: "320" },
        ],
        ["1 <= power <= 10^4", "1 <= n == damage.length == health.length <= 300", "1 <= damage[i], health[i] <= 100"]),
      hints: [
        "Enemy `i` needs `t_i = ceil(health[i] / power)` strikes, and finishing it before switching is never worse than splitting the strikes.",
        "If enemy `i` dies at second `T_i`, Bob takes `damage[i] * T_i` from it, so the total is `sum(damage[i] * T_i)` — a weighted completion-time problem.",
        "Compare two adjacent enemies `a` and `b`: `a` should go first exactly when `t_a * damage_b < t_b * damage_a`. Sort by that rule.",
      ],
      editorial: explain({
        idea: "Each enemy is a job of length `t_i = ceil(health[i] / power)` seconds with weight `damage[i]`, and the damage Bob takes is the weighted sum of completion times. Smith's rule — order by `t / damage` ascending — minimises it.",
        steps: [
          "Compute `t_i = ceil(health[i] / power)` for every enemy.",
          "Sort the enemies so that `a` precedes `b` when `t_a * damage_b < t_b * damage_a` (cross-multiplied to stay in integers).",
          "Walk the order with a clock: add `t_i` to the clock, then add `damage[i] * clock` to the total.",
        ],
        why: "Swapping adjacent enemies `a` then `b` only changes their two terms: with `a` first the pair costs `d_a * t_a + d_b * (t_a + t_b)` extra over the common prefix, with `b` first `d_b * t_b + d_a * (t_a + t_b)`. The difference is `d_b * t_a - d_a * t_b`, so `a` belongs first exactly when `t_a * d_b <= t_b * d_a`. Any order violating the rule can be improved by such a swap, so the sorted order is optimal. Interleaving strikes only delays some enemy's death without hastening any other's.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Sorting by damage alone or by health alone fails; it is the ratio that matters.",
          "Use the strike count `ceil(health / power)`, not the raw health.",
          "An enemy still deals damage during the second in which it is killed — its completion time counts in full.",
        ],
      }),
      examples: [
        { input: "3\n[2,5]\n[7,3]", expectedOutput: "13" },
        { input: "4\n[1,2,3,4]\n[4,5,6,8]", expectedOutput: "39" },
        { input: "8\n[40]\n[59]", expectedOutput: "320" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 9, 9, 40]));
        const power = pick(rng, [1, ri(rng, 1, 10), ri(rng, 1, 150), ri(rng, 1, 10000)]);
        const dTop = pick(rng, [1, 10, 100]);
        const hTop = pick(rng, [1, 10, 100]);
        const damage = Array.from({ length: n }, () => ri(rng, 1, dTop));
        const health = Array.from({ length: n }, () => ri(rng, 1, hTop));
        return { input: `${power}\n${fmtIntArr(damage)}\n${fmtIntArr(health)}`, expectedOutput: String(ref(power, damage, health)) };
      },
      solutions: {
        python: code`
          from typing import List
          from functools import cmp_to_key

          def minDamage(power: int, damage: List[int], health: List[int]) -> int:
              t = [(h + power - 1) // power for h in health]
              # a goes before b when t[a] / damage[a] < t[b] / damage[b]
              order = sorted(range(len(damage)), key=cmp_to_key(lambda a, b: t[a] * damage[b] - t[b] * damage[a]))
              clock = total = 0
              for i in order:
                  clock += t[i]
                  total += damage[i] * clock
              return total
        `,
        javascript: code`
          var minDamage = function(power, damage, health) {
              var n = damage.length;
              var t = [], order = [];
              for (var i = 0; i < n; i++) {
                  t.push(Math.floor((health[i] + power - 1) / power));
                  order.push(i);
              }
              // a goes before b when t[a] / damage[a] < t[b] / damage[b]
              order.sort(function(a, b) { return t[a] * damage[b] - t[b] * damage[a]; });
              var clock = 0, total = 0;
              for (var k = 0; k < n; k++) {
                  clock += t[order[k]];
                  total += damage[order[k]] * clock;
              }
              return total;
          };
        `,
        typescript: code`
          function minDamage(power: number, damage: number[], health: number[]): number {
              var n = damage.length;
              var t: number[] = [], order: number[] = [];
              for (var i = 0; i < n; i++) {
                  t.push(Math.floor((health[i] + power - 1) / power));
                  order.push(i);
              }
              // a goes before b when t[a] / damage[a] < t[b] / damage[b]
              order.sort(function(a, b) { return t[a] * damage[b] - t[b] * damage[a]; });
              var clock = 0, total = 0;
              for (var k = 0; k < n; k++) {
                  clock += t[order[k]];
                  total += damage[order[k]] * clock;
              }
              return total;
          }
        `,
        java: code`
          public static int minDamage(int power, int[] damage, int[] health) {
              int n = damage.length;
              int[] t = new int[n];
              Integer[] order = new Integer[n];
              for (int i = 0; i < n; i++) {
                  t[i] = (health[i] + power - 1) / power;
                  order[i] = i;
              }
              // a goes before b when t[a] / damage[a] < t[b] / damage[b]
              Arrays.sort(order, (a, b) -> Long.compare((long) t[a] * damage[b], (long) t[b] * damage[a]));
              long clock = 0, total = 0;
              for (int i : order) {
                  clock += t[i];
                  total += damage[i] * clock;
              }
              return (int) total;
          }
        `,
        cpp: code`
          int minDamage(int power, vector<int>& damage, vector<int>& health) {
              int n = damage.size();
              vector<long long> t(n);
              vector<int> order(n);
              for (int i = 0; i < n; i++) {
                  t[i] = (health[i] + power - 1) / power;
                  order[i] = i;
              }
              // a goes before b when t[a] / damage[a] < t[b] / damage[b]
              sort(order.begin(), order.end(), [&](int a, int b) { return t[a] * damage[b] < t[b] * damage[a]; });
              long long clock = 0, total = 0;
              for (int i : order) {
                  clock += t[i];
                  total += damage[i] * clock;
              }
              return (int) total;
          }
        `,
        c: code`
          typedef struct { long long t; long long d; } Foe;

          static int cmpFoe(const void* a, const void* b) {
              const Foe* x = (const Foe*) a;
              const Foe* y = (const Foe*) b;
              long long l = x->t * y->d, r = y->t * x->d;
              return (l > r) - (l < r);
          }

          int minDamage(int power, int* damage, int damageSize, int* health, int healthSize) {
              int n = damageSize;
              Foe* foes = (Foe*) malloc((size_t) (n + 1) * sizeof(Foe));
              for (int i = 0; i < n; i++) {
                  foes[i].t = (health[i] + power - 1) / power;
                  foes[i].d = damage[i];
              }
              // x goes before y when x.t / x.d < y.t / y.d
              qsort(foes, (size_t) n, sizeof(Foe), cmpFoe);
              long long clock = 0, total = 0;
              for (int i = 0; i < n; i++) {
                  clock += foes[i].t;
                  total += foes[i].d * clock;
              }
              free(foes);
              return (int) total;
          }
        `,
        csharp: code`
          public static int MinDamage(int power, int[] damage, int[] health)
          {
              int n = damage.Length;
              var t = new long[n];
              var order = new int[n];
              for (int i = 0; i < n; i++)
              {
                  t[i] = (health[i] + power - 1) / power;
                  order[i] = i;
              }
              // a goes before b when t[a] / damage[a] < t[b] / damage[b]
              Array.Sort(order, (a, b) => (t[a] * damage[b]).CompareTo(t[b] * damage[a]));
              long clock = 0, total = 0;
              foreach (int i in order)
              {
                  clock += t[i];
                  total += damage[i] * clock;
              }
              return (int) total;
          }
        `,
        go: code`
          func minDamage(power int, damage []int, health []int) int {
              n := len(damage)
              t := make([]int, n)
              order := make([]int, n)
              for i := 0; i < n; i++ {
                  t[i] = (health[i] + power - 1) / power
                  order[i] = i
              }
              // a goes before b when t[a] / damage[a] < t[b] / damage[b]
              sort.Slice(order, func(x, y int) bool {
                  a, b := order[x], order[y]
                  return t[a]*damage[b] < t[b]*damage[a]
              })
              clock, total := 0, 0
              for _, i := range order {
                  clock += t[i]
                  total += damage[i] * clock
              }
              return total
          }
        `,
        kotlin: code`
          fun minDamage(power: Int, damage: IntArray, health: IntArray): Int {
              val n = damage.size
              val t = LongArray(n) { ((health[it] + power - 1) / power).toLong() }
              // a goes before b when t[a] / damage[a] < t[b] / damage[b]
              val order = (0 until n).sortedWith(Comparator { a, b -> (t[a] * damage[b]).compareTo(t[b] * damage[a]) })
              var clock = 0L
              var total = 0L
              for (i in order) {
                  clock += t[i]
                  total += damage[i] * clock
              }
              return total.toInt()
          }
        `,
        swift: code`
          func minDamage(_ power: Int, _ damage: [Int], _ health: [Int]) -> Int {
              let n = damage.count
              let t = health.map { ($0 + power - 1) / power }
              // a goes before b when t[a] / damage[a] < t[b] / damage[b]
              let order = (0..<n).sorted { t[$0] * damage[$1] < t[$1] * damage[$0] }
              var clock = 0, total = 0
              for i in order {
                  clock += t[i]
                  total += damage[i] * clock
              }
              return total
          }
        `,
        rust: code`
          fn minDamage(power: i32, damage: Vec<i32>, health: Vec<i32>) -> i32 {
              let n = damage.len();
              let t: Vec<i64> = health.iter().map(|&h| ((h + power - 1) / power) as i64).collect();
              let d: Vec<i64> = damage.iter().map(|&x| x as i64).collect();
              let mut order: Vec<usize> = (0..n).collect();
              // a goes before b when t[a] / d[a] < t[b] / d[b]
              order.sort_by(|&a, &b| (t[a] * d[b]).cmp(&(t[b] * d[a])));
              let mut clock: i64 = 0;
              let mut total: i64 = 0;
              for &i in order.iter() {
                  clock += t[i];
                  total += d[i] * clock;
              }
              total as i32
          }
        `,
        php: code`
          function minDamage($power, $damage, $health) {
              $n = count($damage);
              $t = [];
              foreach ($health as $h) $t[] = intdiv($h + $power - 1, $power);
              $order = range(0, $n - 1);
              // a goes before b when t[a] / damage[a] < t[b] / damage[b]
              usort($order, function ($a, $b) use ($t, $damage) { return $t[$a] * $damage[$b] <=> $t[$b] * $damage[$a]; });
              $clock = 0;
              $total = 0;
              foreach ($order as $i) {
                  $clock += $t[$i];
                  $total += $damage[$i] * $clock;
              }
              return $total;
          }
        `,
        ruby: code`
          def minDamage(power, damage, health)
            t = health.map { |h| (h + power - 1) / power }
            # a goes before b when t[a] / damage[a] < t[b] / damage[b]
            order = (0...damage.length).sort { |a, b| (t[a] * damage[b]) <=> (t[b] * damage[a]) }
            clock = 0
            total = 0
            order.each do |i|
              clock += t[i]
              total += damage[i] * clock
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Maximize Sum Of Array After K Negations (LC 1005) ────────────
  (() => {
    // Literal simulation: k times, negate a smallest element.
    const ref = (nums: number[], k: number) => {
      const a = nums.slice();
      for (let t = 0; t < k; t++) {
        let bi = 0;
        for (let i = 1; i < a.length; i++) if (a[i] < a[bi]) bi = i;
        a[bi] = -a[bi];
      }
      return a.reduce((s, v) => s + v, 0);
    };
    return {
      slug: "maximize-sum-of-array-after-k-negations",
      title: "Maximize Sum Of Array After K Negations",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Google"],
      signature: {
        funcName: "largestSumAfterKNegations",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an integer array `nums` and an integer `k`. Exactly `k` times, choose an index `i` and replace `nums[i]` with `-nums[i]`. The same index may be chosen more than once.\n\nReturn the **largest** possible sum of the array after the `k` negations.",
        [
          { in: "nums = [-5,2,-1], k = 2", out: "8", note: "Negate -5 and -1: [5,2,1]." },
          { in: "nums = [1,3,-2], k = 2", out: "4", note: "Negate -2, then one negation is left over; spend it on the smallest value 1: [-1,3,2]." },
          { in: "nums = [0,-7], k = 5", out: "7", note: "After flipping -7, the remaining four negations can all go to 0." },
        ],
        ["1 <= nums.length <= 10^4", "-100 <= nums[i] <= 100", "1 <= k <= 10^4"]),
      hints: [
        "Negating a negative number gains the most when that number is the most negative.",
        "Flip negatives from the smallest upwards while negations remain.",
        "If negations are left once everything is non-negative, pairs cancel out; an odd leftover must flip the element with the smallest absolute value.",
      ],
      editorial: explain({
        idea: "Each negation should hit the current minimum: that is the flip that raises the sum most (or lowers it least). Sorting once captures every such choice, and leftover negations only matter by their parity.",
        steps: [
          "Sort `nums` ascending.",
          "Walk from the left: while `k > 0` and the value is negative, negate it and decrement `k`.",
          "Sum the array. If `k` is still odd, subtract twice the smallest element (now the smallest absolute value).",
        ],
        why: "Negating `x` changes the sum by `-2x`, which is largest for the smallest `x`. While negatives remain, the most negative ones are the best targets and are disjoint, so flipping them in order is optimal. Once all values are non-negative, two flips on the same element cancel, so only `k mod 2` matters, and the cheapest single flip is the one on the smallest value.",
        time: "O(n log n)",
        space: "O(1) beyond the sort",
        pitfalls: [
          "When negatives run out with an odd `k` left, the smallest absolute value may be a number you just flipped — take the minimum after flipping.",
          "A zero absorbs any number of leftover negations for free.",
          "A min-heap that negates its top `k` times is also correct, at `O(k log n)`.",
        ],
      }),
      examples: [
        { input: "[-5,2,-1]\n2", expectedOutput: "8" },
        { input: "[1,3,-2]\n2", expectedOutput: "4" },
        { input: "[0,-7]\n5", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 10, 40]));
        const span = pick(rng, [1, 5, 100]);
        const nums = Array.from({ length: n }, () => ri(rng, -span, span));
        const k = ri(rng, 1, pick(rng, [1, 3, 10, 60]));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def largestSumAfterKNegations(nums: List[int], k: int) -> int:
              a = sorted(nums)
              for i in range(len(a)):
                  if k > 0 and a[i] < 0:
                      a[i] = -a[i]
                      k -= 1
              total = sum(a)
              if k % 2 == 1:
                  total -= 2 * min(a)
              return total
        `,
        javascript: code`
          var largestSumAfterKNegations = function(nums, k) {
              var a = nums.slice().sort(function(x, y) { return x - y; });
              for (var i = 0; i < a.length && k > 0 && a[i] < 0; i++) {
                  a[i] = -a[i];
                  k--;
              }
              var total = 0, low = a[0];
              for (var j = 0; j < a.length; j++) {
                  total += a[j];
                  if (a[j] < low) low = a[j];
              }
              if (k % 2 === 1) total -= 2 * low;
              return total;
          };
        `,
        typescript: code`
          function largestSumAfterKNegations(nums: number[], k: number): number {
              var a = nums.slice().sort(function(x, y) { return x - y; });
              for (var i = 0; i < a.length && k > 0 && a[i] < 0; i++) {
                  a[i] = -a[i];
                  k--;
              }
              var total = 0, low = a[0];
              for (var j = 0; j < a.length; j++) {
                  total += a[j];
                  if (a[j] < low) low = a[j];
              }
              if (k % 2 === 1) total -= 2 * low;
              return total;
          }
        `,
        java: code`
          public static int largestSumAfterKNegations(int[] nums, int k) {
              int[] a = nums.clone();
              Arrays.sort(a);
              for (int i = 0; i < a.length && k > 0 && a[i] < 0; i++) {
                  a[i] = -a[i];
                  k--;
              }
              int total = 0, low = a[0];
              for (int v : a) {
                  total += v;
                  low = Math.min(low, v);
              }
              if (k % 2 == 1) total -= 2 * low;
              return total;
          }
        `,
        cpp: code`
          int largestSumAfterKNegations(vector<int>& nums, int k) {
              vector<int> a = nums;
              sort(a.begin(), a.end());
              for (size_t i = 0; i < a.size() && k > 0 && a[i] < 0; i++) {
                  a[i] = -a[i];
                  k--;
              }
              int total = 0, low = a[0];
              for (int v : a) {
                  total += v;
                  low = min(low, v);
              }
              if (k % 2 == 1) total -= 2 * low;
              return total;
          }
        `,
        c: code`
          static int cmpInt(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          int largestSumAfterKNegations(int* nums, int numsSize, int k) {
              int* a = (int*) malloc((size_t) numsSize * sizeof(int));
              memcpy(a, nums, (size_t) numsSize * sizeof(int));
              qsort(a, (size_t) numsSize, sizeof(int), cmpInt);
              for (int i = 0; i < numsSize && k > 0 && a[i] < 0; i++) {
                  a[i] = -a[i];
                  k--;
              }
              int total = 0, low = a[0];
              for (int i = 0; i < numsSize; i++) {
                  total += a[i];
                  if (a[i] < low) low = a[i];
              }
              if (k % 2 == 1) total -= 2 * low;
              free(a);
              return total;
          }
        `,
        csharp: code`
          public static int LargestSumAfterKNegations(int[] nums, int k)
          {
              var a = (int[]) nums.Clone();
              Array.Sort(a);
              for (int i = 0; i < a.Length && k > 0 && a[i] < 0; i++)
              {
                  a[i] = -a[i];
                  k--;
              }
              int total = 0, low = a[0];
              foreach (int v in a)
              {
                  total += v;
                  low = Math.Min(low, v);
              }
              if (k % 2 == 1) total -= 2 * low;
              return total;
          }
        `,
        go: code`
          func largestSumAfterKNegations(nums []int, k int) int {
              a := make([]int, len(nums))
              copy(a, nums)
              sort.Ints(a)
              for i := 0; i < len(a) && k > 0 && a[i] < 0; i++ {
                  a[i] = -a[i]
                  k--
              }
              total, low := 0, a[0]
              for _, v := range a {
                  total += v
                  if v < low {
                      low = v
                  }
              }
              if k%2 == 1 {
                  total -= 2 * low
              }
              return total
          }
        `,
        kotlin: code`
          fun largestSumAfterKNegations(nums: IntArray, k: Int): Int {
              val a = nums.sortedArray()
              var left = k
              var i = 0
              while (i < a.size && left > 0 && a[i] < 0) {
                  a[i] = -a[i]
                  left--
                  i++
              }
              var total = 0
              var low = a[0]
              for (v in a) {
                  total += v
                  if (v < low) low = v
              }
              if (left % 2 == 1) total -= 2 * low
              return total
          }
        `,
        swift: code`
          func largestSumAfterKNegations(_ nums: [Int], _ k: Int) -> Int {
              var a = nums.sorted()
              var left = k
              var i = 0
              while i < a.count && left > 0 && a[i] < 0 {
                  a[i] = -a[i]
                  left -= 1
                  i += 1
              }
              let total = a.reduce(0, +)
              let low = a.min()!
              return left % 2 == 1 ? total - 2 * low : total
          }
        `,
        rust: code`
          fn largestSumAfterKNegations(nums: Vec<i32>, k: i32) -> i32 {
              let mut a = nums.clone();
              a.sort();
              let mut left = k;
              let mut i = 0;
              while i < a.len() && left > 0 && a[i] < 0 {
                  a[i] = -a[i];
                  left -= 1;
                  i += 1;
              }
              let total: i32 = a.iter().sum();
              let low = *a.iter().min().unwrap();
              if left % 2 == 1 {
                  total - 2 * low
              } else {
                  total
              }
          }
        `,
        php: code`
          function largestSumAfterKNegations($nums, $k) {
              $a = $nums;
              sort($a);
              $n = count($a);
              for ($i = 0; $i < $n && $k > 0 && $a[$i] < 0; $i++) {
                  $a[$i] = -$a[$i];
                  $k--;
              }
              $total = array_sum($a);
              if ($k % 2 == 1) $total -= 2 * min($a);
              return $total;
          }
        `,
        ruby: code`
          def largestSumAfterKNegations(nums, k)
            a = nums.sort
            i = 0
            while i < a.length && k > 0 && a[i] < 0
              a[i] = -a[i]
              k -= 1
              i += 1
            end
            total = a.sum
            total -= 2 * a.min if k.odd?
            total
          end
        `,
      },
    };
  })(),

  // ── Range Sum of Sorted Subarray Sums (LC 1508) ──────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (nums: number[], left: number, right: number) => {
      const sums: number[] = [];
      for (let i = 0; i < nums.length; i++) {
        let s = 0;
        for (let j = i; j < nums.length; j++) { s += nums[j]; sums.push(s); }
      }
      sums.sort((a, b) => a - b);
      let total = 0;
      for (let i = left - 1; i < right; i++) total += sums[i];
      return total % MOD;
    };
    return {
      slug: "range-sum-of-sorted-subarray-sums",
      title: "Range Sum of Sorted Subarray Sums",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Binary Search", "Sorting", "Amazon", "Google"],
      signature: {
        funcName: "rangeSum",
        params: [
          { name: "nums", type: "int[]" as const },
          { name: "n", type: "int" as const },
          { name: "left", type: "int" as const },
          { name: "right", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "You are given an array `nums` of `n` positive integers. Compute the sum of every non-empty contiguous subarray — there are `n * (n + 1) / 2` of them — and sort those sums in non-decreasing order, giving a new array (1-indexed).\n\nReturn the sum of the elements of that new array from position `left` to position `right`, both included. Since it can be large, return it **modulo** `10^9 + 7`.",
        [
          { in: "nums = [2,1,3], n = 3, left = 2, right = 5", out: "12", note: "The subarray sums are 2, 3, 6, 1, 4, 3; sorted: [1,2,3,3,4,6]. Positions 2 to 5 add up to 2 + 3 + 3 + 4 = 12." },
          { in: "nums = [1,2,3,4], n = 4, left = 3, right = 4", out: "6" },
          { in: "nums = [1,2,3,4], n = 4, left = 1, right = 10", out: "50" },
        ],
        ["n == nums.length", "1 <= nums.length <= 1000", "1 <= nums[i] <= 100", "1 <= left <= right <= n * (n + 1) / 2"]),
      hints: [
        "There are at most about 500,000 subarray sums — few enough to list.",
        "Generate them with a running sum from each start index, sort, and add up the requested slice.",
        "For larger inputs, binary-search the value of the `k`-th smallest sum and count sums below it with two pointers; the answer is `F(right) - F(left - 1)` where `F(k)` is the sum of the `k` smallest.",
      ],
      editorial: explain({
        idea: "With `n <= 1000` the full list of subarray sums has at most `500500` entries, so materialising and sorting it is fast. (A min-heap merging the `n` increasing rows, or a binary search on the value, avoid the full list when memory matters.)",
        steps: [
          "For each start `i`, extend `j` from `i` to `n - 1` keeping a running sum, and record every sum.",
          "Sort the sums ascending.",
          "Add the sums at positions `left - 1` through `right - 1` (0-based) in 64-bit arithmetic and return the result modulo `10^9 + 7`.",
        ],
        why: "The sorted list is exactly the array the statement describes, so the slice sum is the answer by definition; reducing modulo `10^9 + 7` at the end is valid because the true total (at most about `5 * 10^10`) fits comfortably in 64 bits.",
        time: "O(n^2 log n)",
        space: "O(n^2)",
        pitfalls: [
          "`left` and `right` are 1-indexed.",
          "The total can exceed 32 bits before the modulo — accumulate in 64-bit.",
          "Only non-empty subarrays count; there are `n * (n + 1) / 2`, not `n^2`.",
        ],
      }),
      examples: [
        { input: "[2,1,3]\n3\n2\n5", expectedOutput: "12" },
        { input: "[1,2,3,4]\n4\n3\n4", expectedOutput: "6" },
        { input: "[1,2,3,4]\n4\n1\n10", expectedOutput: "50" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 30]));
        const top = pick(rng, [1, 5, 100]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const total = (n * (n + 1)) / 2;
        let left = ri(rng, 1, total), right = ri(rng, 1, total);
        if (left > right) { const t = left; left = right; right = t; }
        if (rng() < 0.15) { left = 1; right = total; }
        return { input: `${fmtIntArr(nums)}\n${n}\n${left}\n${right}`, expectedOutput: String(ref(nums, left, right)) };
      },
      solutions: {
        python: code`
          from typing import List

          def rangeSum(nums: List[int], n: int, left: int, right: int) -> int:
              sums = []
              for i in range(n):
                  s = 0
                  for j in range(i, n):
                      s += nums[j]
                      sums.append(s)
              sums.sort()
              return sum(sums[left - 1:right]) % 1000000007
        `,
        javascript: code`
          var rangeSum = function(nums, n, left, right) {
              var sums = [];
              for (var i = 0; i < n; i++) {
                  var s = 0;
                  for (var j = i; j < n; j++) {
                      s += nums[j];
                      sums.push(s);
                  }
              }
              sums.sort(function(a, b) { return a - b; });
              var total = 0; // at most about 5e10: exact in a double
              for (var k = left - 1; k < right; k++) total += sums[k];
              return total % 1000000007;
          };
        `,
        typescript: code`
          function rangeSum(nums: number[], n: number, left: number, right: number): number {
              var sums: number[] = [];
              for (var i = 0; i < n; i++) {
                  var s = 0;
                  for (var j = i; j < n; j++) {
                      s += nums[j];
                      sums.push(s);
                  }
              }
              sums.sort(function(a, b) { return a - b; });
              var total = 0; // at most about 5e10: exact in a double
              for (var k = left - 1; k < right; k++) total += sums[k];
              return total % 1000000007;
          }
        `,
        java: code`
          public static int rangeSum(int[] nums, int n, int left, int right) {
              int[] sums = new int[n * (n + 1) / 2];
              int at = 0;
              for (int i = 0; i < n; i++) {
                  int s = 0;
                  for (int j = i; j < n; j++) {
                      s += nums[j];
                      sums[at++] = s;
                  }
              }
              Arrays.sort(sums);
              long total = 0;
              for (int k = left - 1; k < right; k++) total += sums[k];
              return (int) (total % 1000000007L);
          }
        `,
        cpp: code`
          int rangeSum(vector<int>& nums, int n, int left, int right) {
              vector<int> sums;
              sums.reserve(n * (n + 1) / 2);
              for (int i = 0; i < n; i++) {
                  int s = 0;
                  for (int j = i; j < n; j++) {
                      s += nums[j];
                      sums.push_back(s);
                  }
              }
              sort(sums.begin(), sums.end());
              long long total = 0;
              for (int k = left - 1; k < right; k++) total += sums[k];
              return (int) (total % 1000000007LL);
          }
        `,
        c: code`
          static int cmpInt(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          int rangeSum(int* nums, int numsSize, int n, int left, int right) {
              int count = n * (n + 1) / 2;
              int* sums = (int*) malloc((size_t) count * sizeof(int));
              int at = 0;
              for (int i = 0; i < n; i++) {
                  int s = 0;
                  for (int j = i; j < n; j++) {
                      s += nums[j];
                      sums[at++] = s;
                  }
              }
              qsort(sums, (size_t) count, sizeof(int), cmpInt);
              long long total = 0;
              for (int k = left - 1; k < right; k++) total += sums[k];
              free(sums);
              return (int) (total % 1000000007LL);
          }
        `,
        csharp: code`
          public static int RangeSum(int[] nums, int n, int left, int right)
          {
              var sums = new int[n * (n + 1) / 2];
              int at = 0;
              for (int i = 0; i < n; i++)
              {
                  int s = 0;
                  for (int j = i; j < n; j++)
                  {
                      s += nums[j];
                      sums[at++] = s;
                  }
              }
              Array.Sort(sums);
              long total = 0;
              for (int k = left - 1; k < right; k++) total += sums[k];
              return (int) (total % 1000000007L);
          }
        `,
        go: code`
          func rangeSum(nums []int, n int, left int, right int) int {
              sums := make([]int, 0, n*(n+1)/2)
              for i := 0; i < n; i++ {
                  s := 0
                  for j := i; j < n; j++ {
                      s += nums[j]
                      sums = append(sums, s)
                  }
              }
              sort.Ints(sums)
              total := 0
              for k := left - 1; k < right; k++ {
                  total += sums[k]
              }
              return total % 1000000007
          }
        `,
        kotlin: code`
          fun rangeSum(nums: IntArray, n: Int, left: Int, right: Int): Int {
              val sums = IntArray(n * (n + 1) / 2)
              var at = 0
              for (i in 0 until n) {
                  var s = 0
                  for (j in i until n) {
                      s += nums[j]
                      sums[at++] = s
                  }
              }
              sums.sort()
              var total = 0L
              for (k in left - 1 until right) total += sums[k]
              return (total % 1000000007L).toInt()
          }
        `,
        swift: code`
          func rangeSum(_ nums: [Int], _ n: Int, _ left: Int, _ right: Int) -> Int {
              var sums = [Int]()
              sums.reserveCapacity(n * (n + 1) / 2)
              for i in 0..<n {
                  var s = 0
                  for j in i..<n {
                      s += nums[j]
                      sums.append(s)
                  }
              }
              sums.sort()
              var total = 0
              for k in (left - 1)..<right { total += sums[k] }
              return total % 1000000007
          }
        `,
        rust: code`
          fn rangeSum(nums: Vec<i32>, n: i32, left: i32, right: i32) -> i32 {
              let n = n as usize;
              let mut sums: Vec<i64> = Vec::with_capacity(n * (n + 1) / 2);
              for i in 0..n {
                  let mut s: i64 = 0;
                  for j in i..n {
                      s += nums[j] as i64;
                      sums.push(s);
                  }
              }
              sums.sort();
              let mut total: i64 = 0;
              for k in (left as usize - 1)..(right as usize) {
                  total += sums[k];
              }
              (total % 1_000_000_007) as i32
          }
        `,
        php: code`
          function rangeSum($nums, $n, $left, $right) {
              $sums = [];
              for ($i = 0; $i < $n; $i++) {
                  $s = 0;
                  for ($j = $i; $j < $n; $j++) {
                      $s += $nums[$j];
                      $sums[] = $s;
                  }
              }
              sort($sums);
              $total = 0;
              for ($k = $left - 1; $k < $right; $k++) $total += $sums[$k];
              return $total % 1000000007;
          }
        `,
        ruby: code`
          def rangeSum(nums, n, left, right)
            sums = []
            (0...n).each do |i|
              s = 0
              (i...n).each do |j|
                s += nums[j]
                sums << s
              end
            end
            sums.sort!
            sums[(left - 1)...right].sum % 1_000_000_007
          end
        `,
      },
    };
  })(),

  // ── Kth Smallest Instructions (LC 1643) ──────────────────────────
  (() => {
    // Enumerates the instruction strings in lexicographic order for small
    // grids; larger ones count with Pascal's triangle (checked against the
    // enumeration on every small case).
    const brute = (row: number, col: number, k: number) => {
      let seen = 0;
      let found = "";
      const walk = (prefix: string, h: number, v: number): boolean => {
        if (h === 0 && v === 0) { seen++; if (seen === k) { found = prefix; return true; } return false; }
        if (h > 0 && walk(prefix + "H", h - 1, v)) return true;
        return v > 0 && walk(prefix + "V", h, v - 1);
      };
      walk("", col, row);
      return found;
    };
    const comb: number[][] = [];
    for (let i = 0; i <= 30; i++) { comb.push([]); for (let j = 0; j <= i; j++) comb[i].push(j === 0 || j === i ? 1 : comb[i - 1][j - 1] + comb[i - 1][j]); }
    const counted = (row: number, col: number, k: number) => {
      let h = col, v = row, out = "";
      while (h + v > 0) {
        const startH = h > 0 ? comb[h - 1 + v][v] : 0;
        if (h > 0 && k <= startH) { out += "H"; h--; } else { out += "V"; k -= startH; v--; }
      }
      return out;
    };
    const ref = (row: number, col: number, k: number) => {
      if (row + col <= 12) {
        const b = brute(row, col, k);
        if (b !== counted(row, col, k)) throw new Error("kth-smallest-instructions ref mismatch");
        return b;
      }
      return counted(row, col, k);
    };
    return {
      slug: "kth-smallest-instructions",
      title: "Kth Smallest Instructions",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Combinatorics", "Google", "Amazon"],
      signature: {
        funcName: "kthSmallestPath",
        params: [{ name: "destination", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "string" as const,
      },
      description: describe(
        "A robot starts at cell `(0, 0)` and must reach `destination = [row, column]`. It can only move **right**, written `'H'`, or **down**, written `'V'`, so every route is a string of `column` letters `'H'` and `row` letters `'V'`.\n\nOrder all such strings lexicographically (`'H'` comes before `'V'`). Given `k`, return the `k`-th string in that order (1-indexed).",
        [
          { in: "destination = [2,2], k = 4", out: "VHHV", note: "The six routes in order are HHVV, HVHV, HVVH, VHHV, VHVH, VVHH." },
          { in: "destination = [1,3], k = 2", out: "HHVH" },
          { in: "destination = [2,3], k = 1", out: "HHHVV" },
        ],
        ["destination.length == 2", "1 <= row, column <= 15", "1 <= k <= nCr(row + column, row)"]),
      hints: [
        "Build the answer one letter at a time, deciding whether it starts with `'H'` or `'V'`.",
        "If `h` moves right and `v` moves down remain, exactly `C(h - 1 + v, v)` of the remaining routes start with `'H'`.",
        "If `k` is at most that count, write `'H'`; otherwise write `'V'` and subtract the count from `k`.",
      ],
      editorial: explain({
        idea: "Lexicographic ranking by counting: every route that starts with `'H'` comes before every route that starts with `'V'`, and the number of routes beginning with `'H'` is a binomial coefficient. So each letter is decided by comparing `k` with one count.",
        steps: [
          "Precompute Pascal's triangle up to 30 (`C(30, 15)` still fits in 32 bits).",
          "Let `h = column`, `v = row`. While letters remain: if `h > 0`, let `c = C(h - 1 + v, v)`, the number of completions after an `'H'`.",
          "If `h > 0` and `k <= c`, append `'H'` and decrement `h`. Otherwise append `'V'`, subtract `c` (0 when `h == 0`) from `k`, and decrement `v`.",
        ],
        why: "At each step the remaining routes split into a block starting with `'H'` followed by a block starting with `'V'`. If the `k`-th route lies in the first block (`k <= c`) its next letter is `'H'` and its rank inside that block is still `k`; otherwise its next letter is `'V'` and its rank inside the second block is `k - c`. The invariant \"the answer is the `k`-th route of the remaining grid\" holds to the end.",
        time: "O(row + column)",
        space: "O(1) beyond the 31-row Pascal table",
        pitfalls: [
          "`'H'` (right) consumes the column count and sorts first; it is easy to swap the roles of `row` and `column`.",
          "When `h` reaches 0 the rest of the answer is all `'V'` — guard the binomial lookup so it does not read `C(v - 1, v)`.",
          "`k` is 1-indexed: the first route is `k = 1`.",
        ],
      }),
      examples: [
        { input: "[2,2]\n4", expectedOutput: "VHHV" },
        { input: "[1,3]\n2", expectedOutput: "HHVH" },
        { input: "[2,3]\n1", expectedOutput: "HHHVV" },
      ],
      gen: (rng: Rng) => {
        const big = rng() < 0.3;
        const row = ri(rng, 1, big ? 15 : 6);
        const col = ri(rng, 1, big ? 15 : 6);
        const total = comb[row + col][row];
        const k = pick(rng, [1, total, ri(rng, 1, total), ri(rng, 1, total)]);
        return { input: `${fmtIntArr([row, col])}\n${k}`, expectedOutput: ref(row, col, k) };
      },
      solutions: {
        python: code`
          from typing import List
          from math import comb

          def kthSmallestPath(destination: List[int], k: int) -> str:
              v, h = destination
              out = []
              while h + v > 0:
                  start_h = comb(h - 1 + v, v) if h > 0 else 0  # routes that begin with 'H'
                  if h > 0 and k <= start_h:
                      out.append('H')
                      h -= 1
                  else:
                      out.append('V')
                      k -= start_h
                      v -= 1
              return ''.join(out)
        `,
        javascript: code`
          var kthSmallestPath = function(destination, k) {
              var comb = [];
              for (var i = 0; i <= 30; i++) {
                  comb.push([]);
                  for (var j = 0; j <= i; j++) comb[i].push(j === 0 || j === i ? 1 : comb[i - 1][j - 1] + comb[i - 1][j]);
              }
              var v = destination[0], h = destination[1];
              var out = "";
              while (h + v > 0) {
                  var startH = h > 0 ? comb[h - 1 + v][v] : 0; // routes that begin with 'H'
                  if (h > 0 && k <= startH) {
                      out += "H";
                      h--;
                  } else {
                      out += "V";
                      k -= startH;
                      v--;
                  }
              }
              return out;
          };
        `,
        typescript: code`
          function kthSmallestPath(destination: number[], k: number): string {
              var comb: number[][] = [];
              for (var i = 0; i <= 30; i++) {
                  comb.push([]);
                  for (var j = 0; j <= i; j++) comb[i].push(j === 0 || j === i ? 1 : comb[i - 1][j - 1] + comb[i - 1][j]);
              }
              var v = destination[0], h = destination[1];
              var out = "";
              while (h + v > 0) {
                  var startH = h > 0 ? comb[h - 1 + v][v] : 0; // routes that begin with 'H'
                  if (h > 0 && k <= startH) {
                      out += "H";
                      h--;
                  } else {
                      out += "V";
                      k -= startH;
                      v--;
                  }
              }
              return out;
          }
        `,
        java: code`
          public static String kthSmallestPath(int[] destination, int k) {
              int[][] comb = new int[31][31];
              for (int i = 0; i <= 30; i++) {
                  comb[i][0] = comb[i][i] = 1;
                  for (int j = 1; j < i; j++) comb[i][j] = comb[i - 1][j - 1] + comb[i - 1][j];
              }
              int v = destination[0], h = destination[1];
              StringBuilder out = new StringBuilder();
              while (h + v > 0) {
                  int startH = h > 0 ? comb[h - 1 + v][v] : 0; // routes that begin with 'H'
                  if (h > 0 && k <= startH) {
                      out.append('H');
                      h--;
                  } else {
                      out.append('V');
                      k -= startH;
                      v--;
                  }
              }
              return out.toString();
          }
        `,
        cpp: code`
          string kthSmallestPath(vector<int>& destination, int k) {
              vector<vector<int>> comb(31, vector<int>(31, 0));
              for (int i = 0; i <= 30; i++) {
                  comb[i][0] = comb[i][i] = 1;
                  for (int j = 1; j < i; j++) comb[i][j] = comb[i - 1][j - 1] + comb[i - 1][j];
              }
              int v = destination[0], h = destination[1];
              string out;
              while (h + v > 0) {
                  int startH = h > 0 ? comb[h - 1 + v][v] : 0; // routes that begin with 'H'
                  if (h > 0 && k <= startH) {
                      out += 'H';
                      h--;
                  } else {
                      out += 'V';
                      k -= startH;
                      v--;
                  }
              }
              return out;
          }
        `,
        c: code`
          char* kthSmallestPath(int* destination, int destinationSize, int k) {
              static int comb[31][31];
              for (int i = 0; i <= 30; i++) {
                  comb[i][0] = comb[i][i] = 1;
                  for (int j = 1; j < i; j++) comb[i][j] = comb[i - 1][j - 1] + comb[i - 1][j];
              }
              int v = destination[0], h = destination[1];
              char* out = (char*) malloc((size_t) (h + v + 1));
              int len = 0;
              while (h + v > 0) {
                  int startH = h > 0 ? comb[h - 1 + v][v] : 0; // routes that begin with 'H'
                  if (h > 0 && k <= startH) {
                      out[len++] = 'H';
                      h--;
                  } else {
                      out[len++] = 'V';
                      k -= startH;
                      v--;
                  }
              }
              out[len] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string KthSmallestPath(int[] destination, int k)
          {
              var comb = new int[31, 31];
              for (int i = 0; i <= 30; i++)
              {
                  comb[i, 0] = 1;
                  comb[i, i] = 1;
                  for (int j = 1; j < i; j++) comb[i, j] = comb[i - 1, j - 1] + comb[i - 1, j];
              }
              int v = destination[0], h = destination[1];
              var out_ = new System.Text.StringBuilder();
              while (h + v > 0)
              {
                  int startH = h > 0 ? comb[h - 1 + v, v] : 0; // routes that begin with 'H'
                  if (h > 0 && k <= startH)
                  {
                      out_.Append('H');
                      h--;
                  }
                  else
                  {
                      out_.Append('V');
                      k -= startH;
                      v--;
                  }
              }
              return out_.ToString();
          }
        `,
        go: code`
          func kthSmallestPath(destination []int, k int) string {
              var comb [31][31]int
              for i := 0; i <= 30; i++ {
                  comb[i][0], comb[i][i] = 1, 1
                  for j := 1; j < i; j++ {
                      comb[i][j] = comb[i-1][j-1] + comb[i-1][j]
                  }
              }
              v, h := destination[0], destination[1]
              out := make([]byte, 0, h+v)
              for h+v > 0 {
                  startH := 0 // routes that begin with 'H'
                  if h > 0 {
                      startH = comb[h-1+v][v]
                  }
                  if h > 0 && k <= startH {
                      out = append(out, 'H')
                      h--
                  } else {
                      out = append(out, 'V')
                      k -= startH
                      v--
                  }
              }
              return string(out)
          }
        `,
        kotlin: code`
          fun kthSmallestPath(destination: IntArray, k: Int): String {
              val comb = Array(31) { IntArray(31) }
              for (i in 0..30) {
                  comb[i][0] = 1
                  comb[i][i] = 1
                  for (j in 1 until i) comb[i][j] = comb[i - 1][j - 1] + comb[i - 1][j]
              }
              var v = destination[0]
              var h = destination[1]
              var rank = k
              val out = StringBuilder()
              while (h + v > 0) {
                  val startH = if (h > 0) comb[h - 1 + v][v] else 0 // routes that begin with 'H'
                  if (h > 0 && rank <= startH) {
                      out.append('H')
                      h--
                  } else {
                      out.append('V')
                      rank -= startH
                      v--
                  }
              }
              return out.toString()
          }
        `,
        swift: code`
          func kthSmallestPath(_ destination: [Int], _ k: Int) -> String {
              var comb = [[Int]](repeating: [Int](repeating: 0, count: 31), count: 31)
              for i in 0...30 {
                  comb[i][0] = 1
                  comb[i][i] = 1
                  if i >= 2 {
                      for j in 1..<i { comb[i][j] = comb[i - 1][j - 1] + comb[i - 1][j] }
                  }
              }
              var v = destination[0], h = destination[1], rank = k
              var out = ""
              while h + v > 0 {
                  let startH = h > 0 ? comb[h - 1 + v][v] : 0 // routes that begin with 'H'
                  if h > 0 && rank <= startH {
                      out += "H"
                      h -= 1
                  } else {
                      out += "V"
                      rank -= startH
                      v -= 1
                  }
              }
              return out
          }
        `,
        rust: code`
          fn kthSmallestPath(destination: Vec<i32>, k: i32) -> String {
              let mut comb = vec![vec![0i32; 31]; 31];
              for i in 0..31 {
                  comb[i][0] = 1;
                  comb[i][i] = 1;
                  for j in 1..i {
                      comb[i][j] = comb[i - 1][j - 1] + comb[i - 1][j];
                  }
              }
              let mut v = destination[0] as usize;
              let mut h = destination[1] as usize;
              let mut rank = k;
              let mut out = String::with_capacity(h + v);
              while h + v > 0 {
                  let start_h = if h > 0 { comb[h - 1 + v][v] } else { 0 }; // routes that begin with 'H'
                  if h > 0 && rank <= start_h {
                      out.push('H');
                      h -= 1;
                  } else {
                      out.push('V');
                      rank -= start_h;
                      v -= 1;
                  }
              }
              out
          }
        `,
        php: code`
          function kthSmallestPath($destination, $k) {
              $comb = [];
              for ($i = 0; $i <= 30; $i++) {
                  $comb[$i] = array_fill(0, 31, 0);
                  $comb[$i][0] = 1;
                  $comb[$i][$i] = 1;
                  for ($j = 1; $j < $i; $j++) $comb[$i][$j] = $comb[$i - 1][$j - 1] + $comb[$i - 1][$j];
              }
              $v = $destination[0];
              $h = $destination[1];
              $out = '';
              while ($h + $v > 0) {
                  $startH = $h > 0 ? $comb[$h - 1 + $v][$v] : 0; // routes that begin with 'H'
                  if ($h > 0 && $k <= $startH) {
                      $out .= 'H';
                      $h--;
                  } else {
                      $out .= 'V';
                      $k -= $startH;
                      $v--;
                  }
              }
              return $out;
          }
        `,
        ruby: code`
          def kthSmallestPath(destination, k)
            comb = Array.new(31) { Array.new(31, 0) }
            (0..30).each do |i|
              comb[i][0] = 1
              comb[i][i] = 1
              (1...i).each { |j| comb[i][j] = comb[i - 1][j - 1] + comb[i - 1][j] }
            end
            v, h = destination
            out = +''
            while h + v > 0
              start_h = h > 0 ? comb[h - 1 + v][v] : 0 # routes that begin with 'H'
              if h > 0 && k <= start_h
                out << 'H'
                h -= 1
              else
                out << 'V'
                k -= start_h
                v -= 1
              end
            end
            out
          end
        `,
      },
    };
  })(),

  // ── My Calendar III (LC 732) ─────────────────────────────────────
  (() => {
    const ref = (bookings: number[][]) => {
      const out: number[] = [];
      for (let i = 0; i < bookings.length; i++) {
        let best = 0;
        for (let a = 0; a <= i; a++) {
          const x = bookings[a][0];
          let c = 0;
          for (let b = 0; b <= i; b++) if (bookings[b][0] <= x && x < bookings[b][1]) c++;
          if (c > best) best = c;
        }
        out.push(best);
      }
      return out;
    };
    return {
      slug: "my-calendar-iii",
      title: "My Calendar III",
      difficulty: "HARD" as const,
      tags: ["Binary Search", "Segment Tree", "Prefix Sum", "Ordered Set", "Google", "Amazon"],
      signature: { funcName: "myCalendarThree", params: [{ name: "bookings", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "A calendar receives events one at a time. Each event `bookings[i] = [startTime, endTime]` occupies the half-open interval `[startTime, endTime)`. Events are always accepted, even when they overlap.\n\nA **k-booking** happens when some moment is covered by `k` events at once. After each event is added, report the largest `k` for which a k-booking exists among all events added so far.\n\nReturn the array of those answers, one per event, in order. (On LeetCode this is the `book` method of a `MyCalendarThree` class called once per event.)",
        [
          { in: "bookings = [[1,5],[3,8],[4,6],[8,9]]", out: "[1,2,3,3]", note: "[3,5) is double-booked after the second event and [4,5) triple-booked after the third; [8,9) only touches [3,8)." },
          { in: "bookings = [[10,20],[50,60],[10,40],[5,15],[5,10],[25,55]]", out: "[1,1,2,3,3,3]" },
        ],
        ["1 <= bookings.length <= 400", "0 <= startTime < endTime <= 10^9"]),
      hints: [
        "The overlap count only changes at an event's start or end, so only those coordinates matter.",
        "Compress all `startTime` and `endTime` values into indices; the gaps between consecutive coordinates are the elementary segments.",
        "Keep a counter per elementary segment. Adding an event increments the segments it covers; the answer is the running maximum of all counters.",
      ],
      editorial: explain({
        idea: "With at most 400 events, coordinate compression turns the timeline into at most 799 elementary segments. An event covers a contiguous range of them, so adding it is a range increment, and the answer is the largest counter ever reached.",
        steps: [
          "Collect every start and end, sort, and deduplicate into `xs`.",
          "Keep `cover[s]` for each segment `[xs[s], xs[s+1])` and `best = 0`.",
          "For each event, find the indices of its start and end in `xs` (binary search), increment `cover` over that index range and update `best` with each new value.",
          "Append `best` after every event.",
        ],
        why: "Between two consecutive coordinates no event begins or ends, so every moment of a segment is covered by the same set of events, and `cover[s]` counts exactly that set. The overlap maximum over all time is therefore the maximum counter, and since counters only grow, keeping a running maximum is enough.",
        time: "O(n^2) after the O(n log n) compression",
        space: "O(n)",
        pitfalls: [
          "Intervals are half-open: an event ending at 8 and one starting at 8 do not overlap.",
          "Compress over **all** events up front (they are all known), or use an ordered map of `+1/-1` deltas if they arrive online.",
          "A segment tree with lazy range add answers each event in `O(log n)` if the number of events is large.",
        ],
      }),
      examples: [
        { input: "[[1,5],[3,8],[4,6],[8,9]]", expectedOutput: "[1,2,3,3]" },
        { input: "[[10,20],[50,60],[10,40],[5,15],[5,10],[25,55]]", expectedOutput: "[1,1,2,3,3,3]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 25]));
        const span = pick(rng, [5, 30, 1000, 1000000000]);
        const bookings: number[][] = [];
        for (let i = 0; i < n; i++) {
          const s = ri(rng, 0, span - 1);
          const e = Math.min(span, s + ri(rng, 1, Math.max(1, Math.floor(span / pick(rng, [1, 3, 10])))));
          bookings.push([s, e]);
        }
        return { input: fmtIntMat(bookings), expectedOutput: fmtIntArr(ref(bookings)) };
      },
      solutions: {
        python: code`
          from typing import List
          from bisect import bisect_left

          def myCalendarThree(bookings: List[List[int]]) -> List[int]:
              xs = sorted(set(x for b in bookings for x in b))
              cover = [0] * len(xs)  # cover[s] counts events over [xs[s], xs[s + 1])
              best = 0
              out = []
              for start, end in bookings:
                  for s in range(bisect_left(xs, start), bisect_left(xs, end)):
                      cover[s] += 1
                      best = max(best, cover[s])
                  out.append(best)
              return out
        `,
        javascript: code`
          var myCalendarThree = function(bookings) {
              var all = [];
              for (var i = 0; i < bookings.length; i++) all.push(bookings[i][0], bookings[i][1]);
              all.sort(function(a, b) { return a - b; });
              var xs = [];
              for (var j = 0; j < all.length; j++) if (j === 0 || all[j] !== all[j - 1]) xs.push(all[j]);
              var find = function(x) {
                  var lo = 0, hi = xs.length - 1;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (xs[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              };
              var cover = []; // cover[s] counts events over [xs[s], xs[s + 1])
              for (var z = 0; z < xs.length; z++) cover.push(0);
              var best = 0, out = [];
              for (var t = 0; t < bookings.length; t++) {
                  var a = find(bookings[t][0]), b = find(bookings[t][1]);
                  for (var s = a; s < b; s++) {
                      cover[s]++;
                      if (cover[s] > best) best = cover[s];
                  }
                  out.push(best);
              }
              return out;
          };
        `,
        typescript: code`
          function myCalendarThree(bookings: number[][]): number[] {
              var all: number[] = [];
              for (var i = 0; i < bookings.length; i++) all.push(bookings[i][0], bookings[i][1]);
              all.sort(function(a, b) { return a - b; });
              var xs: number[] = [];
              for (var j = 0; j < all.length; j++) if (j === 0 || all[j] !== all[j - 1]) xs.push(all[j]);
              var find = function(x: number): number {
                  var lo = 0, hi = xs.length - 1;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (xs[mid] < x) lo = mid + 1; else hi = mid;
                  }
                  return lo;
              };
              var cover: number[] = []; // cover[s] counts events over [xs[s], xs[s + 1])
              for (var z = 0; z < xs.length; z++) cover.push(0);
              var best = 0, out: number[] = [];
              for (var t = 0; t < bookings.length; t++) {
                  var a = find(bookings[t][0]), b = find(bookings[t][1]);
                  for (var s = a; s < b; s++) {
                      cover[s]++;
                      if (cover[s] > best) best = cover[s];
                  }
                  out.push(best);
              }
              return out;
          }
        `,
        java: code`
          public static int[] myCalendarThree(int[][] bookings) {
              int n = bookings.length;
              int[] all = new int[2 * n];
              for (int i = 0; i < n; i++) {
                  all[2 * i] = bookings[i][0];
                  all[2 * i + 1] = bookings[i][1];
              }
              int[] xs = Arrays.stream(all).sorted().distinct().toArray();
              int[] cover = new int[xs.length]; // cover[s] counts events over [xs[s], xs[s + 1])
              int best = 0;
              int[] out = new int[n];
              for (int t = 0; t < n; t++) {
                  int a = Arrays.binarySearch(xs, bookings[t][0]);
                  int b = Arrays.binarySearch(xs, bookings[t][1]);
                  for (int s = a; s < b; s++) best = Math.max(best, ++cover[s]);
                  out[t] = best;
              }
              return out;
          }
        `,
        cpp: code`
          vector<int> myCalendarThree(vector<vector<int>>& bookings) {
              vector<int> xs;
              for (auto& b : bookings) {
                  xs.push_back(b[0]);
                  xs.push_back(b[1]);
              }
              sort(xs.begin(), xs.end());
              xs.erase(unique(xs.begin(), xs.end()), xs.end());
              vector<int> cover(xs.size(), 0); // cover[s] counts events over [xs[s], xs[s + 1])
              int best = 0;
              vector<int> out;
              for (auto& b : bookings) {
                  int a = lower_bound(xs.begin(), xs.end(), b[0]) - xs.begin();
                  int e = lower_bound(xs.begin(), xs.end(), b[1]) - xs.begin();
                  for (int s = a; s < e; s++) best = max(best, ++cover[s]);
                  out.push_back(best);
              }
              return out;
          }
        `,
        c: code`
          static int cmpInt(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          static int lowerIndex(const int* xs, int size, int x) {
              int lo = 0, hi = size - 1;
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (xs[mid] < x) lo = mid + 1; else hi = mid;
              }
              return lo;
          }

          int* myCalendarThree(int** bookings, int bookingsSize, int* bookingsColSize, int* returnSize) {
              int n = bookingsSize;
              int* xs = (int*) malloc((size_t) (2 * n) * sizeof(int));
              for (int i = 0; i < n; i++) {
                  xs[2 * i] = bookings[i][0];
                  xs[2 * i + 1] = bookings[i][1];
              }
              qsort(xs, (size_t) (2 * n), sizeof(int), cmpInt);
              int m = 0;
              for (int i = 0; i < 2 * n; i++) if (i == 0 || xs[i] != xs[i - 1]) xs[m++] = xs[i];
              int* cover = (int*) calloc((size_t) m, sizeof(int)); // cover[s] counts events over [xs[s], xs[s + 1])
              int* out = (int*) malloc((size_t) n * sizeof(int));
              int best = 0;
              for (int t = 0; t < n; t++) {
                  int a = lowerIndex(xs, m, bookings[t][0]), b = lowerIndex(xs, m, bookings[t][1]);
                  for (int s = a; s < b; s++) {
                      cover[s]++;
                      if (cover[s] > best) best = cover[s];
                  }
                  out[t] = best;
              }
              free(xs);
              free(cover);
              *returnSize = n;
              return out;
          }
        `,
        csharp: code`
          public static int[] MyCalendarThree(int[][] bookings)
          {
              int n = bookings.Length;
              var xs = bookings.SelectMany(b => new[] { b[0], b[1] }).Distinct().OrderBy(x => x).ToArray();
              var cover = new int[xs.Length]; // cover[s] counts events over [xs[s], xs[s + 1])
              int best = 0;
              var out_ = new int[n];
              for (int t = 0; t < n; t++)
              {
                  int a = Array.BinarySearch(xs, bookings[t][0]);
                  int b = Array.BinarySearch(xs, bookings[t][1]);
                  for (int s = a; s < b; s++) best = Math.Max(best, ++cover[s]);
                  out_[t] = best;
              }
              return out_;
          }
        `,
        go: code`
          func myCalendarThree(bookings [][]int) []int {
              all := make([]int, 0, 2*len(bookings))
              for _, b := range bookings {
                  all = append(all, b[0], b[1])
              }
              sort.Ints(all)
              xs := []int{}
              for i, x := range all {
                  if i == 0 || x != all[i-1] {
                      xs = append(xs, x)
                  }
              }
              cover := make([]int, len(xs)) // cover[s] counts events over [xs[s], xs[s + 1])
              best := 0
              out := make([]int, len(bookings))
              for t, b := range bookings {
                  a := sort.SearchInts(xs, b[0])
                  e := sort.SearchInts(xs, b[1])
                  for s := a; s < e; s++ {
                      cover[s]++
                      if cover[s] > best {
                          best = cover[s]
                      }
                  }
                  out[t] = best
              }
              return out
          }
        `,
        kotlin: code`
          fun myCalendarThree(bookings: Array<IntArray>): IntArray {
              val xs = bookings.flatMap { listOf(it[0], it[1]) }.distinct().sorted().toIntArray()
              val cover = IntArray(xs.size) // cover[s] counts events over [xs[s], xs[s + 1])
              var best = 0
              val out = IntArray(bookings.size)
              for (t in bookings.indices) {
                  val a = xs.binarySearch(bookings[t][0])
                  val b = xs.binarySearch(bookings[t][1])
                  for (s in a until b) {
                      cover[s]++
                      if (cover[s] > best) best = cover[s]
                  }
                  out[t] = best
              }
              return out
          }
        `,
        swift: code`
          func myCalendarThree(_ bookings: [[Int]]) -> [Int] {
              let xs = Array(Set(bookings.flatMap { [$0[0], $0[1]] })).sorted()
              func find(_ x: Int) -> Int {
                  var lo = 0, hi = xs.count - 1
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if xs[mid] < x { lo = mid + 1 } else { hi = mid }
                  }
                  return lo
              }
              var cover = [Int](repeating: 0, count: xs.count) // cover[s] counts events over [xs[s], xs[s + 1])
              var best = 0
              var out = [Int]()
              for b in bookings {
                  let a = find(b[0]), e = find(b[1])
                  for s in a..<e {
                      cover[s] += 1
                      best = max(best, cover[s])
                  }
                  out.append(best)
              }
              return out
          }
        `,
        rust: code`
          fn myCalendarThree(bookings: Vec<Vec<i32>>) -> Vec<i32> {
              let mut xs: Vec<i32> = Vec::with_capacity(2 * bookings.len());
              for b in bookings.iter() {
                  xs.push(b[0]);
                  xs.push(b[1]);
              }
              xs.sort();
              xs.dedup();
              let mut cover = vec![0i32; xs.len()]; // cover[s] counts events over [xs[s], xs[s + 1])
              let mut best = 0;
              let mut out: Vec<i32> = Vec::with_capacity(bookings.len());
              for b in bookings.iter() {
                  let a = xs.binary_search(&b[0]).unwrap();
                  let e = xs.binary_search(&b[1]).unwrap();
                  for s in a..e {
                      cover[s] += 1;
                      if cover[s] > best {
                          best = cover[s];
                      }
                  }
                  out.push(best);
              }
              out
          }
        `,
        php: code`
          function myCalendarThree($bookings) {
              $all = [];
              foreach ($bookings as $b) {
                  $all[] = $b[0];
                  $all[] = $b[1];
              }
              $xs = array_values(array_unique($all));
              sort($xs);
              $index = array_flip($xs);
              $cover = array_fill(0, count($xs), 0); // cover[s] counts events over [xs[s], xs[s + 1])
              $best = 0;
              $out = [];
              foreach ($bookings as $b) {
                  $a = $index[$b[0]];
                  $e = $index[$b[1]];
                  for ($s = $a; $s < $e; $s++) {
                      $cover[$s]++;
                      if ($cover[$s] > $best) $best = $cover[$s];
                  }
                  $out[] = $best;
              }
              return $out;
          }
        `,
        ruby: code`
          def myCalendarThree(bookings)
            xs = bookings.flatten.uniq.sort
            index = {}
            xs.each_with_index { |x, i| index[x] = i }
            cover = Array.new(xs.length, 0) # cover[s] counts events over [xs[s], xs[s + 1])
            best = 0
            bookings.map do |b|
              (index[b[0]]...index[b[1]]).each do |s|
                cover[s] += 1
                best = cover[s] if cover[s] > best
              end
              best
            end
          end
        `,
      },
    };
  })(),

  // ── Describe the Painting (LC 1943) ──────────────────────────────
  (() => {
    // Unit cells: the colour set of every [x, x + 1), merged while identical.
    const ref = (segments: number[][]) => {
      let lo = Infinity, hi = -Infinity;
      for (const [s, e] of segments) { lo = Math.min(lo, s); hi = Math.max(hi, e); }
      const out: number[][] = [];
      let curKey = "", curStart = 0, curSum = 0;
      for (let x = lo; x <= hi; x++) {
        const cols = x < hi ? segments.filter((g) => g[0] <= x && x < g[1]).map((g) => g[2]).sort((a, b) => a - b) : [];
        const key = cols.join(",");
        if (key !== curKey) {
          if (curKey !== "") out.push([curStart, x, curSum]);
          curKey = key; curStart = x; curSum = cols.reduce((s, v) => s + v, 0);
        }
      }
      return out;
    };
    return {
      slug: "describe-the-painting",
      title: "Describe the Painting",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sorting", "Prefix Sum", "Google", "Amazon"],
      signature: { funcName: "splitPainting", params: [{ name: "segments", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "A long, thin painting lies along a number line. It was painted with overlapping strokes: `segments[i] = [start, end, color]` paints the half-open range `[start, end)` with `color`. All colours are **distinct**.\n\nWhere strokes overlap, their colours mix. A mix is a **set** of colours, and we write it down as the **sum** of its colours (so a mix of 2, 4 and 6 is written 12).\n\nDescribe the painting with the fewest half-open pieces `[left, right, mix]` such that every point of a piece is painted with exactly the same set of colours. Leave out the parts that are not painted at all. Note that two neighbouring pieces must stay separate when their **sets** differ, even if their sums happen to be equal.\n\nReturn the pieces sorted by `left`.\n\n*Constraint note:* colours are capped at `10^5` (the original allows `10^9`) so every mix sum fits in a 32-bit integer.",
        [
          { in: "segments = [[2,6,3],[4,9,5],[11,12,4]]", out: "[[2,4,3],[4,6,8],[6,9,5],[11,12,4]]", note: "[9,11) is unpainted and left out." },
          { in: "segments = [[1,7,9],[6,8,15],[8,10,7]]", out: "[[1,6,9],[6,7,24],[7,8,15],[8,10,7]]" },
          { in: "segments = [[1,4,5],[1,4,7],[4,7,1],[4,7,11]]", out: "[[1,4,12],[4,7,12]]", note: "Both pieces sum to 12, but the sets {5,7} and {1,11} differ, so they are not merged." },
        ],
        ["1 <= segments.length <= 2 * 10^4", "segments[i].length == 3", "1 <= start_i < end_i <= 10^5", "1 <= color_i <= 10^5", "each color_i is distinct"]),
      hints: [
        "The colour set can only change at a stroke's `start` or `end`.",
        "Because colours are distinct, it **does** change at every such point — so every endpoint is a boundary between pieces.",
        "Sweep the endpoints in order keeping the running sum (`+color` at a start, `-color` at an end); between two consecutive endpoints, emit a piece if the sum is positive.",
      ],
      editorial: explain({
        idea: "Treat each stroke as `+color` at `start` and `-color` at `end`. Sorted by position, a running total gives the mix of every gap between consecutive event points, and with distinct colours every event point really is a boundary.",
        steps: [
          "Create events `(start, +color)` and `(end, -color)` for every stroke and sort them by position.",
          "Walk the events grouped by equal position `x`, adding all their deltas to `running`.",
          "If another position `y` follows and `running > 0`, append `[x, y, running]`.",
        ],
        why: "Between consecutive event positions no stroke begins or ends, so the colour set — and its sum `running` — is constant there. At an event position at least one stroke enters or leaves, and since all colours are distinct the set strictly changes, so a piece boundary is mandatory exactly there. Pieces with `running == 0` are unpainted and skipped; positive colours mean a painted set never sums to 0.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Merging neighbours because their sums match is wrong — sets, not sums, decide (third example).",
          "Group all events at the same position before emitting, or zero-length pieces appear.",
          "With the original colour range the sums need 64 bits.",
        ],
      }),
      examples: [
        { input: "[[2,6,3],[4,9,5],[11,12,4]]", expectedOutput: "[[2,4,3],[4,6,8],[6,9,5],[11,12,4]]" },
        { input: "[[1,7,9],[6,8,15],[8,10,7]]", expectedOutput: "[[1,6,9],[6,7,24],[7,8,15],[8,10,7]]" },
        { input: "[[1,4,5],[1,4,7],[4,7,1],[4,7,11]]", expectedOutput: "[[1,4,12],[4,7,12]]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 8, 15]));
        const span = pick(rng, [4, 12, 40]);
        const colorTop = pick(rng, [n + 2, 30, 100000]);
        const used = new Set<number>();
        const segments: number[][] = [];
        for (let i = 0; i < n; i++) {
          const s = ri(rng, 1, span - 1);
          const e = ri(rng, s + 1, Math.min(span, s + ri(rng, 1, span)));
          let c = ri(rng, 1, colorTop);
          while (used.has(c)) c = ri(rng, 1, colorTop);
          used.add(c);
          segments.push([s, e, c]);
        }
        return { input: fmtIntMat(segments), expectedOutput: fmtIntMat(ref(segments)) };
      },
      solutions: {
        python: code`
          from typing import List

          def splitPainting(segments: List[List[int]]) -> List[List[int]]:
              events = []
              for start, end, color in segments:
                  events.append((start, color))
                  events.append((end, -color))
              events.sort()
              out = []
              running = 0
              i, m = 0, len(events)
              while i < m:
                  x = events[i][0]
                  while i < m and events[i][0] == x:
                      running += events[i][1]
                      i += 1
                  if i < m and running > 0:
                      out.append([x, events[i][0], running])
              return out
        `,
        javascript: code`
          var splitPainting = function(segments) {
              var events = [];
              for (var i = 0; i < segments.length; i++) {
                  events.push([segments[i][0], segments[i][2]]);
                  events.push([segments[i][1], -segments[i][2]]);
              }
              events.sort(function(a, b) { return a[0] - b[0]; });
              var out = [];
              var running = 0, at = 0, m = events.length;
              while (at < m) {
                  var x = events[at][0];
                  while (at < m && events[at][0] === x) {
                      running += events[at][1];
                      at++;
                  }
                  if (at < m && running > 0) out.push([x, events[at][0], running]);
              }
              return out;
          };
        `,
        typescript: code`
          function splitPainting(segments: number[][]): number[][] {
              var events: number[][] = [];
              for (var i = 0; i < segments.length; i++) {
                  events.push([segments[i][0], segments[i][2]]);
                  events.push([segments[i][1], -segments[i][2]]);
              }
              events.sort(function(a, b) { return a[0] - b[0]; });
              var out: number[][] = [];
              var running = 0, at = 0, m = events.length;
              while (at < m) {
                  var x = events[at][0];
                  while (at < m && events[at][0] === x) {
                      running += events[at][1];
                      at++;
                  }
                  if (at < m && running > 0) out.push([x, events[at][0], running]);
              }
              return out;
          }
        `,
        java: code`
          public static int[][] splitPainting(int[][] segments) {
              int m = 2 * segments.length;
              int[][] events = new int[m][];
              for (int i = 0; i < segments.length; i++) {
                  events[2 * i] = new int[] { segments[i][0], segments[i][2] };
                  events[2 * i + 1] = new int[] { segments[i][1], -segments[i][2] };
              }
              Arrays.sort(events, (a, b) -> Integer.compare(a[0], b[0]));
              List<int[]> out = new ArrayList<>();
              long running = 0;
              int at = 0;
              while (at < m) {
                  int x = events[at][0];
                  while (at < m && events[at][0] == x) running += events[at++][1];
                  if (at < m && running > 0) out.add(new int[] { x, events[at][0], (int) running });
              }
              return out.toArray(new int[0][]);
          }
        `,
        cpp: code`
          vector<vector<int>> splitPainting(vector<vector<int>>& segments) {
              vector<pair<int, int>> events;
              for (auto& s : segments) {
                  events.push_back({s[0], s[2]});
                  events.push_back({s[1], -s[2]});
              }
              sort(events.begin(), events.end());
              vector<vector<int>> out;
              long long running = 0;
              size_t at = 0, m = events.size();
              while (at < m) {
                  int x = events[at].first;
                  while (at < m && events[at].first == x) running += events[at++].second;
                  if (at < m && running > 0) out.push_back({x, events[at].first, (int) running});
              }
              return out;
          }
        `,
        c: code`
          typedef struct { int x; int d; } PaintEv;

          static int cmpEv(const void* a, const void* b) {
              int x = ((const PaintEv*) a)->x, y = ((const PaintEv*) b)->x;
              return (x > y) - (x < y);
          }

          int** splitPainting(int** segments, int segmentsSize, int* segmentsColSize, int* returnSize, int** returnColumnSizes) {
              int m = 2 * segmentsSize;
              PaintEv* ev = (PaintEv*) malloc((size_t) m * sizeof(PaintEv));
              for (int i = 0; i < segmentsSize; i++) {
                  ev[2 * i].x = segments[i][0];
                  ev[2 * i].d = segments[i][2];
                  ev[2 * i + 1].x = segments[i][1];
                  ev[2 * i + 1].d = -segments[i][2];
              }
              qsort(ev, (size_t) m, sizeof(PaintEv), cmpEv);
              int** out = (int**) malloc((size_t) m * sizeof(int*));
              int count = 0, at = 0;
              long long running = 0;
              while (at < m) {
                  int x = ev[at].x;
                  while (at < m && ev[at].x == x) running += ev[at++].d;
                  if (at < m && running > 0) {
                      out[count] = (int*) malloc(3 * sizeof(int));
                      out[count][0] = x;
                      out[count][1] = ev[at].x;
                      out[count][2] = (int) running;
                      count++;
                  }
              }
              *returnColumnSizes = (int*) malloc((size_t) (count + 1) * sizeof(int));
              for (int i = 0; i < count; i++) (*returnColumnSizes)[i] = 3;
              *returnSize = count;
              free(ev);
              return out;
          }
        `,
        csharp: code`
          public static int[][] SplitPainting(int[][] segments)
          {
              int m = 2 * segments.Length;
              var events = new int[m][];
              for (int i = 0; i < segments.Length; i++)
              {
                  events[2 * i] = new int[] { segments[i][0], segments[i][2] };
                  events[2 * i + 1] = new int[] { segments[i][1], -segments[i][2] };
              }
              Array.Sort(events, (a, b) => a[0].CompareTo(b[0]));
              var out_ = new List<int[]>();
              long running = 0;
              int at = 0;
              while (at < m)
              {
                  int x = events[at][0];
                  while (at < m && events[at][0] == x) running += events[at++][1];
                  if (at < m && running > 0) out_.Add(new int[] { x, events[at][0], (int) running });
              }
              return out_.ToArray();
          }
        `,
        go: code`
          func splitPainting(segments [][]int) [][]int {
              events := make([][2]int, 0, 2*len(segments))
              for _, s := range segments {
                  events = append(events, [2]int{s[0], s[2]}, [2]int{s[1], -s[2]})
              }
              sort.Slice(events, func(a, b int) bool { return events[a][0] < events[b][0] })
              out := [][]int{}
              running, at, m := 0, 0, len(events)
              for at < m {
                  x := events[at][0]
                  for at < m && events[at][0] == x {
                      running += events[at][1]
                      at++
                  }
                  if at < m && running > 0 {
                      out = append(out, []int{x, events[at][0], running})
                  }
              }
              return out
          }
        `,
        kotlin: code`
          fun splitPainting(segments: Array<IntArray>): Array<IntArray> {
              val events = ArrayList<IntArray>()
              for (s in segments) {
                  events.add(intArrayOf(s[0], s[2]))
                  events.add(intArrayOf(s[1], -s[2]))
              }
              events.sortBy { it[0] }
              val out = ArrayList<IntArray>()
              var running = 0L
              var at = 0
              val m = events.size
              while (at < m) {
                  val x = events[at][0]
                  while (at < m && events[at][0] == x) {
                      running += events[at][1]
                      at++
                  }
                  if (at < m && running > 0) out.add(intArrayOf(x, events[at][0], running.toInt()))
              }
              return out.toTypedArray()
          }
        `,
        swift: code`
          func splitPainting(_ segments: [[Int]]) -> [[Int]] {
              var events = [(Int, Int)]()
              for s in segments {
                  events.append((s[0], s[2]))
                  events.append((s[1], -s[2]))
              }
              events.sort { $0.0 < $1.0 }
              var out = [[Int]]()
              var running = 0, at = 0
              let m = events.count
              while at < m {
                  let x = events[at].0
                  while at < m && events[at].0 == x {
                      running += events[at].1
                      at += 1
                  }
                  if at < m && running > 0 { out.append([x, events[at].0, running]) }
              }
              return out
          }
        `,
        rust: code`
          fn splitPainting(segments: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
              let mut events: Vec<(i32, i64)> = Vec::with_capacity(2 * segments.len());
              for s in segments.iter() {
                  events.push((s[0], s[2] as i64));
                  events.push((s[1], -(s[2] as i64)));
              }
              events.sort_by_key(|e| e.0);
              let mut out: Vec<Vec<i32>> = Vec::new();
              let mut running: i64 = 0;
              let mut at = 0;
              let m = events.len();
              while at < m {
                  let x = events[at].0;
                  while at < m && events[at].0 == x {
                      running += events[at].1;
                      at += 1;
                  }
                  if at < m && running > 0 {
                      out.push(vec![x, events[at].0, running as i32]);
                  }
              }
              out
          }
        `,
        php: code`
          function splitPainting($segments) {
              $events = [];
              foreach ($segments as $s) {
                  $events[] = [$s[0], $s[2]];
                  $events[] = [$s[1], -$s[2]];
              }
              usort($events, function ($a, $b) { return $a[0] <=> $b[0]; });
              $out = [];
              $running = 0;
              $at = 0;
              $m = count($events);
              while ($at < $m) {
                  $x = $events[$at][0];
                  while ($at < $m && $events[$at][0] == $x) {
                      $running += $events[$at][1];
                      $at++;
                  }
                  if ($at < $m && $running > 0) $out[] = [$x, $events[$at][0], $running];
              }
              return $out;
          }
        `,
        ruby: code`
          def splitPainting(segments)
            events = []
            segments.each do |s|
              events << [s[0], s[2]]
              events << [s[1], -s[2]]
            end
            events.sort_by! { |e| e[0] }
            out = []
            running = 0
            at = 0
            m = events.length
            while at < m
              x = events[at][0]
              while at < m && events[at][0] == x
                running += events[at][1]
                at += 1
              end
              out << [x, events[at][0], running] if at < m && running > 0
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Set Intersection Size At Least Two (LC 757) ──────────────────
  (() => {
    // Exact DP over positions: the state is the last two chosen points, which
    // decide whether an interval ending here holds two of them.
    const ref = (intervals: number[][]) => {
      let L = 0;
      for (const [, e] of intervals) L = Math.max(L, e);
      const W = L + 2; // positions -1..L, shifted by one
      const INF = 1e9;
      let dp = new Array(W * W).fill(INF);
      dp[0] = 0; // last = -1, second = -1
      const endsAt: number[][] = Array.from({ length: L + 1 }, () => []);
      for (const [s, e] of intervals) endsAt[e].push(s);
      for (let x = 0; x <= L; x++) {
        const nx = new Array(W * W).fill(INF);
        for (let last = -1; last < x; last++) {
          for (let second = -1; second < Math.max(0, last); second++) {
            if (last >= 0 && second >= last) continue;
            const v = dp[(last + 1) * W + (second + 1)];
            if (v >= INF) continue;
            const skip = (last + 1) * W + (second + 1);
            if (v < nx[skip]) nx[skip] = v;
            const take = (x + 1) * W + (last + 1);
            if (v + 1 < nx[take]) nx[take] = v + 1;
          }
        }
        for (let last = -1; last <= x; last++) {
          for (let second = -1; second < Math.max(0, last); second++) {
            const idx = (last + 1) * W + (second + 1);
            if (nx[idx] >= INF) continue;
            for (const s of endsAt[x]) if (second < s) { nx[idx] = INF; break; }
          }
        }
        dp = nx;
      }
      let best = INF;
      for (const v of dp) if (v < best) best = v;
      return best;
    };
    return {
      slug: "set-intersection-size-at-least-two",
      title: "Set Intersection Size At Least Two",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Sorting", "Google", "Amazon"],
      signature: { funcName: "intersectionSizeTwo", params: [{ name: "intervals", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Each `intervals[i] = [start, end]` stands for every integer from `start` to `end`, both included.\n\nA set of integers `nums` is **containing** if every interval holds **at least two** of its integers.\n\nReturn the smallest possible size of a containing set.",
        [
          { in: "intervals = [[1,3],[3,7],[8,9]]", out: "5", note: "For example {2, 3, 4, 8, 9}: [1,3] holds 2 and 3, [3,7] holds 3 and 4, [8,9] holds 8 and 9." },
          { in: "intervals = [[1,3],[1,4],[2,5],[3,5]]", out: "3", note: "{2, 3, 4} works." },
          { in: "intervals = [[1,2],[2,3],[2,4],[4,5]]", out: "5" },
        ],
        ["1 <= intervals.length <= 3000", "intervals[i].length == 2", "0 <= start < end <= 10^8"]),
      hints: [
        "Process intervals by increasing `end`. When an interval still needs points, the best points to add are the largest ones it contains — they reach furthest into later intervals.",
        "You only need to remember the two largest points chosen so far.",
        "Sort by `end` ascending and, for equal ends, by `start` descending. Then each interval needs 0, 1 (add `end`) or 2 (add `end - 1` and `end`) new points depending on how many of the two largest chosen points it already contains.",
      ],
      editorial: explain({
        idea: "A greedy that always picks points as far right as possible. Among intervals sorted by right end, the current one must get its missing points somewhere inside it, and choosing them at its right end keeps the most options open for the intervals that end later.",
        steps: [
          "Sort intervals by `end` ascending; break ties by `start` descending (narrower first).",
          "Keep `a < b`, the two largest points chosen so far (initially below every coordinate), and `count = 0`.",
          "For each `[s, e]`: if `s <= a`, both are inside — nothing to do. Else if `s <= b`, only `b` is inside: add `e`, so `a = b`, `b = e`, `count += 1`. Otherwise add `e - 1` and `e`: `a = e - 1`, `b = e`, `count += 2`.",
          "Return `count`.",
        ],
        why: "Every chosen point is at most the current interval's `end`, because earlier intervals end no later. So the chosen points inside `[s, e]` are exactly those `>= s`, and only the two largest matter: if the second largest `a` is `>= s`, the interval already holds two. When points must be added, any point in `[s, e]` works for this interval, and a larger one is in every later interval that a smaller one is in (later intervals end at or after `e`), so `e` and `e - 1` dominate. The tie order guarantees that when `s <= b < ...` the new point `e` differs from `b`.",
        time: "O(n log n)",
        space: "O(1) beyond the sort",
        pitfalls: [
          "Without the start-descending tie break, two intervals with the same end can make the greedy add `e` twice.",
          "The two tracked points must be the two **largest** chosen, updated as a sliding pair.",
          "Intervals are inclusive, so `[3,7]` contains 3: the shared point can serve both `[1,3]` and `[3,7]`.",
        ],
      }),
      examples: [
        { input: "[[1,3],[3,7],[8,9]]", expectedOutput: "5" },
        { input: "[[1,3],[1,4],[2,5],[3,5]]", expectedOutput: "3" },
        { input: "[[1,2],[2,3],[2,4],[4,5]]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 6, 10]));
        const span = pick(rng, [3, 8, 14]);
        const intervals: number[][] = [];
        for (let i = 0; i < n; i++) {
          const s = ri(rng, 0, span - 1);
          const e = ri(rng, s + 1, Math.min(span, s + pick(rng, [1, 2, 4, span])));
          intervals.push([s, e]);
        }
        if (rng() < 0.2) {
          // the same shapes shifted far right, to exercise large coordinates
          const shift = 100000000 - span;
          for (const iv of intervals) { iv[0] += shift; iv[1] += shift; }
          const back = intervals.map((iv) => [iv[0] - shift, iv[1] - shift]);
          return { input: fmtIntMat(intervals), expectedOutput: String(ref(back)) };
        }
        return { input: fmtIntMat(intervals), expectedOutput: String(ref(intervals)) };
      },
      solutions: {
        python: code`
          from typing import List

          def intersectionSizeTwo(intervals: List[List[int]]) -> int:
              ivs = sorted(intervals, key=lambda iv: (iv[1], -iv[0]))
              a, b = -1, -1  # the two largest chosen points, a < b
              count = 0
              for s, e in ivs:
                  if s <= a:
                      continue
                  if s <= b:
                      count += 1
                      a, b = b, e
                  else:
                      count += 2
                      a, b = e - 1, e
              return count
        `,
        javascript: code`
          var intersectionSizeTwo = function(intervals) {
              var ivs = intervals.slice().sort(function(x, y) { return x[1] - y[1] || y[0] - x[0]; });
              var a = -1, b = -1; // the two largest chosen points, a < b
              var count = 0;
              for (var i = 0; i < ivs.length; i++) {
                  var s = ivs[i][0], e = ivs[i][1];
                  if (s <= a) continue;
                  if (s <= b) {
                      count += 1;
                      a = b;
                      b = e;
                  } else {
                      count += 2;
                      a = e - 1;
                      b = e;
                  }
              }
              return count;
          };
        `,
        typescript: code`
          function intersectionSizeTwo(intervals: number[][]): number {
              var ivs = intervals.slice().sort(function(x, y) { return x[1] - y[1] || y[0] - x[0]; });
              var a = -1, b = -1; // the two largest chosen points, a < b
              var count = 0;
              for (var i = 0; i < ivs.length; i++) {
                  var s = ivs[i][0], e = ivs[i][1];
                  if (s <= a) continue;
                  if (s <= b) {
                      count += 1;
                      a = b;
                      b = e;
                  } else {
                      count += 2;
                      a = e - 1;
                      b = e;
                  }
              }
              return count;
          }
        `,
        java: code`
          public static int intersectionSizeTwo(int[][] intervals) {
              int[][] ivs = intervals.clone();
              Arrays.sort(ivs, (x, y) -> x[1] != y[1] ? Integer.compare(x[1], y[1]) : Integer.compare(y[0], x[0]));
              int a = -1, b = -1; // the two largest chosen points, a < b
              int count = 0;
              for (int[] iv : ivs) {
                  int s = iv[0], e = iv[1];
                  if (s <= a) continue;
                  if (s <= b) {
                      count += 1;
                      a = b;
                      b = e;
                  } else {
                      count += 2;
                      a = e - 1;
                      b = e;
                  }
              }
              return count;
          }
        `,
        cpp: code`
          int intersectionSizeTwo(vector<vector<int>>& intervals) {
              vector<vector<int>> ivs = intervals;
              sort(ivs.begin(), ivs.end(), [](const vector<int>& x, const vector<int>& y) {
                  return x[1] != y[1] ? x[1] < y[1] : x[0] > y[0];
              });
              int a = -1, b = -1; // the two largest chosen points, a < b
              int count = 0;
              for (auto& iv : ivs) {
                  int s = iv[0], e = iv[1];
                  if (s <= a) continue;
                  if (s <= b) {
                      count += 1;
                      a = b;
                      b = e;
                  } else {
                      count += 2;
                      a = e - 1;
                      b = e;
                  }
              }
              return count;
          }
        `,
        c: code`
          static int cmpIv(const void* p, const void* q) {
              const int* x = *(const int* const*) p;
              const int* y = *(const int* const*) q;
              if (x[1] != y[1]) return (x[1] > y[1]) - (x[1] < y[1]);
              return (y[0] > x[0]) - (y[0] < x[0]);
          }

          int intersectionSizeTwo(int** intervals, int intervalsSize, int* intervalsColSize) {
              int** ivs = (int**) malloc((size_t) intervalsSize * sizeof(int*));
              for (int i = 0; i < intervalsSize; i++) ivs[i] = intervals[i];
              qsort(ivs, (size_t) intervalsSize, sizeof(int*), cmpIv);
              int a = -1, b = -1; // the two largest chosen points, a < b
              int count = 0;
              for (int i = 0; i < intervalsSize; i++) {
                  int s = ivs[i][0], e = ivs[i][1];
                  if (s <= a) continue;
                  if (s <= b) {
                      count += 1;
                      a = b;
                      b = e;
                  } else {
                      count += 2;
                      a = e - 1;
                      b = e;
                  }
              }
              free(ivs);
              return count;
          }
        `,
        csharp: code`
          public static int IntersectionSizeTwo(int[][] intervals)
          {
              var ivs = (int[][]) intervals.Clone();
              Array.Sort(ivs, (x, y) => x[1] != y[1] ? x[1].CompareTo(y[1]) : y[0].CompareTo(x[0]));
              int a = -1, b = -1; // the two largest chosen points, a < b
              int count = 0;
              foreach (var iv in ivs)
              {
                  int s = iv[0], e = iv[1];
                  if (s <= a) continue;
                  if (s <= b)
                  {
                      count += 1;
                      a = b;
                      b = e;
                  }
                  else
                  {
                      count += 2;
                      a = e - 1;
                      b = e;
                  }
              }
              return count;
          }
        `,
        go: code`
          func intersectionSizeTwo(intervals [][]int) int {
              ivs := make([][]int, len(intervals))
              copy(ivs, intervals)
              sort.Slice(ivs, func(x, y int) bool {
                  if ivs[x][1] != ivs[y][1] {
                      return ivs[x][1] < ivs[y][1]
                  }
                  return ivs[x][0] > ivs[y][0]
              })
              a, b := -1, -1 // the two largest chosen points, a < b
              count := 0
              for _, iv := range ivs {
                  s, e := iv[0], iv[1]
                  if s <= a {
                      continue
                  }
                  if s <= b {
                      count++
                      a, b = b, e
                  } else {
                      count += 2
                      a, b = e-1, e
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun intersectionSizeTwo(intervals: Array<IntArray>): Int {
              val ivs = intervals.sortedWith(compareBy<IntArray>({ it[1] }, { -it[0] }))
              var a = -1 // the two largest chosen points, a < b
              var b = -1
              var count = 0
              for (iv in ivs) {
                  val s = iv[0]
                  val e = iv[1]
                  if (s <= a) continue
                  if (s <= b) {
                      count += 1
                      a = b
                      b = e
                  } else {
                      count += 2
                      a = e - 1
                      b = e
                  }
              }
              return count
          }
        `,
        swift: code`
          func intersectionSizeTwo(_ intervals: [[Int]]) -> Int {
              let ivs = intervals.sorted { $0[1] != $1[1] ? $0[1] < $1[1] : $0[0] > $1[0] }
              var a = -1, b = -1 // the two largest chosen points, a < b
              var count = 0
              for iv in ivs {
                  let s = iv[0], e = iv[1]
                  if s <= a { continue }
                  if s <= b {
                      count += 1
                      a = b
                      b = e
                  } else {
                      count += 2
                      a = e - 1
                      b = e
                  }
              }
              return count
          }
        `,
        rust: code`
          fn intersectionSizeTwo(intervals: Vec<Vec<i32>>) -> i32 {
              let mut ivs = intervals.clone();
              ivs.sort_by(|x, y| x[1].cmp(&y[1]).then(y[0].cmp(&x[0])));
              let mut a = -1; // the two largest chosen points, a < b
              let mut b = -1;
              let mut count = 0;
              for iv in ivs.iter() {
                  let s = iv[0];
                  let e = iv[1];
                  if s <= a {
                      continue;
                  }
                  if s <= b {
                      count += 1;
                      a = b;
                      b = e;
                  } else {
                      count += 2;
                      a = e - 1;
                      b = e;
                  }
              }
              count
          }
        `,
        php: code`
          function intersectionSizeTwo($intervals) {
              $ivs = $intervals;
              usort($ivs, function ($x, $y) {
                  if ($x[1] != $y[1]) return $x[1] <=> $y[1];
                  return $y[0] <=> $x[0];
              });
              $a = -1; // the two largest chosen points, a < b
              $b = -1;
              $count = 0;
              foreach ($ivs as $iv) {
                  $s = $iv[0];
                  $e = $iv[1];
                  if ($s <= $a) continue;
                  if ($s <= $b) {
                      $count += 1;
                      $a = $b;
                      $b = $e;
                  } else {
                      $count += 2;
                      $a = $e - 1;
                      $b = $e;
                  }
              }
              return $count;
          }
        `,
        ruby: code`
          def intersectionSizeTwo(intervals)
            ivs = intervals.sort_by { |iv| [iv[1], -iv[0]] }
            a = -1 # the two largest chosen points, a < b
            b = -1
            count = 0
            ivs.each do |s, e|
              next if s <= a
              if s <= b
                count += 1
                a = b
                b = e
              else
                count += 2
                a = e - 1
                b = e
              end
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Divide Intervals Into Minimum Number of Groups (LC 2406) ─────
  (() => {
    const ref = (intervals: number[][]) => {
      let best = 0;
      for (const [x] of intervals) {
        let c = 0;
        for (const [l, r] of intervals) if (l <= x && x <= r) c++;
        best = Math.max(best, c);
      }
      return best;
    };
    return {
      slug: "divide-intervals-into-minimum-number-of-groups",
      title: "Divide Intervals Into Minimum Number of Groups",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Heap (Priority Queue)", "Google", "Amazon"],
      signature: { funcName: "minGroups", params: [{ name: "intervals", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given `intervals[i] = [left, right]`, each covering the integers from `left` to `right` **inclusive**.\n\nSplit the intervals into groups so that every interval is in exactly one group and no two intervals in the same group **intersect** — two intervals intersect when they share at least one number, so `[1,5]` and `[5,8]` intersect.\n\nReturn the minimum number of groups needed.",
        [
          { in: "intervals = [[1,4],[4,7],[8,9]]", out: "2", note: "[1,4] and [4,7] share 4, so they need different groups; [8,9] fits with either." },
          { in: "intervals = [[5,10],[6,8],[1,5],[2,3],[1,10]]", out: "3" },
          { in: "intervals = [[1,3],[5,6],[8,10],[11,13]]", out: "1" },
        ],
        ["1 <= intervals.length <= 10^5", "intervals[i].length == 2", "1 <= left <= right <= 10^6"]),
      hints: [
        "If some number lies in `k` intervals, those `k` intervals need `k` different groups — so the answer is at least the maximum overlap.",
        "Assign intervals in order of `left`: reuse a group whose last interval ended strictly before this `left`, otherwise open a new group.",
        "That is the same as sweeping sorted `left` values against sorted `right` values: a start reuses a group when the earliest unused end is `< left`.",
      ],
      editorial: explain({
        idea: "The answer is the largest number of intervals that cover one common point. A sweep over sorted starts and sorted ends counts it directly; equivalently, a min-heap of group end times reuses the group that frees up earliest.",
        steps: [
          "Sort all `left` values and, separately, all `right` values.",
          "Walk the sorted starts with a pointer `j` into the sorted ends and `groups = 0`.",
          "For each start `s`: if `ends[j] < s`, some group has finished — reuse it by advancing `j`; otherwise open a new group (`groups += 1`).",
          "Return `groups`.",
        ],
        why: "Intervals that pairwise share a point need distinct groups, giving the lower bound. The sweep achieves it: a new group is opened only when every group's interval still covers `s` — that is, when `groups` intervals plus this one all contain `s` — so `groups` never exceeds the maximum overlap. Comparing with `<` (not `<=`) encodes inclusivity: an interval ending at `s` still collides with one starting at `s`.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "The intervals are closed: `[1,4]` and `[4,7]` intersect, so the test is `end < start`, not `end <= start`.",
          "Sorting the starts and the ends independently is valid here because only counts matter, not which interval goes where.",
          "A difference array over `[1, 10^6 + 1]` also works but allocates a large array per call.",
        ],
      }),
      examples: [
        { input: "[[1,4],[4,7],[8,9]]", expectedOutput: "2" },
        { input: "[[5,10],[6,8],[1,5],[2,3],[1,10]]", expectedOutput: "3" },
        { input: "[[1,3],[5,6],[8,10],[11,13]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 15, 40]));
        const span = pick(rng, [3, 20, 1000, 1000000]);
        const intervals: number[][] = [];
        for (let i = 0; i < n; i++) {
          const l = ri(rng, 1, span);
          const r = Math.min(span, l + ri(rng, 0, Math.max(0, Math.floor(span / pick(rng, [1, 4, 20])))));
          intervals.push([l, r]);
        }
        return { input: fmtIntMat(intervals), expectedOutput: String(ref(intervals)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minGroups(intervals: List[List[int]]) -> int:
              starts = sorted(iv[0] for iv in intervals)
              ends = sorted(iv[1] for iv in intervals)
              groups = j = 0
              for s in starts:
                  if ends[j] < s:
                      j += 1  # a group has finished: reuse it
                  else:
                      groups += 1
              return groups
        `,
        javascript: code`
          var minGroups = function(intervals) {
              var starts = [], ends = [];
              for (var i = 0; i < intervals.length; i++) {
                  starts.push(intervals[i][0]);
                  ends.push(intervals[i][1]);
              }
              starts.sort(function(a, b) { return a - b; });
              ends.sort(function(a, b) { return a - b; });
              var groups = 0, j = 0;
              for (var t = 0; t < starts.length; t++) {
                  if (ends[j] < starts[t]) j++; // a group has finished: reuse it
                  else groups++;
              }
              return groups;
          };
        `,
        typescript: code`
          function minGroups(intervals: number[][]): number {
              var starts: number[] = [], ends: number[] = [];
              for (var i = 0; i < intervals.length; i++) {
                  starts.push(intervals[i][0]);
                  ends.push(intervals[i][1]);
              }
              starts.sort(function(a, b) { return a - b; });
              ends.sort(function(a, b) { return a - b; });
              var groups = 0, j = 0;
              for (var t = 0; t < starts.length; t++) {
                  if (ends[j] < starts[t]) j++; // a group has finished: reuse it
                  else groups++;
              }
              return groups;
          }
        `,
        java: code`
          public static int minGroups(int[][] intervals) {
              int n = intervals.length;
              int[] starts = new int[n], ends = new int[n];
              for (int i = 0; i < n; i++) {
                  starts[i] = intervals[i][0];
                  ends[i] = intervals[i][1];
              }
              Arrays.sort(starts);
              Arrays.sort(ends);
              int groups = 0, j = 0;
              for (int s : starts) {
                  if (ends[j] < s) j++; // a group has finished: reuse it
                  else groups++;
              }
              return groups;
          }
        `,
        cpp: code`
          int minGroups(vector<vector<int>>& intervals) {
              vector<int> starts, ends;
              for (auto& iv : intervals) {
                  starts.push_back(iv[0]);
                  ends.push_back(iv[1]);
              }
              sort(starts.begin(), starts.end());
              sort(ends.begin(), ends.end());
              int groups = 0, j = 0;
              for (int s : starts) {
                  if (ends[j] < s) j++; // a group has finished: reuse it
                  else groups++;
              }
              return groups;
          }
        `,
        c: code`
          static int cmpInt(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          int minGroups(int** intervals, int intervalsSize, int* intervalsColSize) {
              int n = intervalsSize;
              int* starts = (int*) malloc((size_t) n * sizeof(int));
              int* ends = (int*) malloc((size_t) n * sizeof(int));
              for (int i = 0; i < n; i++) {
                  starts[i] = intervals[i][0];
                  ends[i] = intervals[i][1];
              }
              qsort(starts, (size_t) n, sizeof(int), cmpInt);
              qsort(ends, (size_t) n, sizeof(int), cmpInt);
              int groups = 0, j = 0;
              for (int t = 0; t < n; t++) {
                  if (ends[j] < starts[t]) j++; // a group has finished: reuse it
                  else groups++;
              }
              free(starts);
              free(ends);
              return groups;
          }
        `,
        csharp: code`
          public static int MinGroups(int[][] intervals)
          {
              int n = intervals.Length;
              var starts = new int[n];
              var ends = new int[n];
              for (int i = 0; i < n; i++)
              {
                  starts[i] = intervals[i][0];
                  ends[i] = intervals[i][1];
              }
              Array.Sort(starts);
              Array.Sort(ends);
              int groups = 0, j = 0;
              foreach (int s in starts)
              {
                  if (ends[j] < s) j++; // a group has finished: reuse it
                  else groups++;
              }
              return groups;
          }
        `,
        go: code`
          func minGroups(intervals [][]int) int {
              n := len(intervals)
              starts := make([]int, n)
              ends := make([]int, n)
              for i, iv := range intervals {
                  starts[i] = iv[0]
                  ends[i] = iv[1]
              }
              sort.Ints(starts)
              sort.Ints(ends)
              groups, j := 0, 0
              for _, s := range starts {
                  if ends[j] < s {
                      j++ // a group has finished: reuse it
                  } else {
                      groups++
                  }
              }
              return groups
          }
        `,
        kotlin: code`
          fun minGroups(intervals: Array<IntArray>): Int {
              val starts = IntArray(intervals.size) { intervals[it][0] }
              val ends = IntArray(intervals.size) { intervals[it][1] }
              starts.sort()
              ends.sort()
              var groups = 0
              var j = 0
              for (s in starts) {
                  if (ends[j] < s) {
                      j++ // a group has finished: reuse it
                  } else {
                      groups++
                  }
              }
              return groups
          }
        `,
        swift: code`
          func minGroups(_ intervals: [[Int]]) -> Int {
              let starts = intervals.map { $0[0] }.sorted()
              let ends = intervals.map { $0[1] }.sorted()
              var groups = 0, j = 0
              for s in starts {
                  if ends[j] < s {
                      j += 1 // a group has finished: reuse it
                  } else {
                      groups += 1
                  }
              }
              return groups
          }
        `,
        rust: code`
          fn minGroups(intervals: Vec<Vec<i32>>) -> i32 {
              let mut starts: Vec<i32> = intervals.iter().map(|iv| iv[0]).collect();
              let mut ends: Vec<i32> = intervals.iter().map(|iv| iv[1]).collect();
              starts.sort();
              ends.sort();
              let mut groups = 0;
              let mut j = 0;
              for &s in starts.iter() {
                  if ends[j] < s {
                      j += 1; // a group has finished: reuse it
                  } else {
                      groups += 1;
                  }
              }
              groups
          }
        `,
        php: code`
          function minGroups($intervals) {
              $starts = [];
              $ends = [];
              foreach ($intervals as $iv) {
                  $starts[] = $iv[0];
                  $ends[] = $iv[1];
              }
              sort($starts);
              sort($ends);
              $groups = 0;
              $j = 0;
              foreach ($starts as $s) {
                  if ($ends[$j] < $s) $j++; // a group has finished: reuse it
                  else $groups++;
              }
              return $groups;
          }
        `,
        ruby: code`
          def minGroups(intervals)
            starts = intervals.map { |iv| iv[0] }.sort
            ends = intervals.map { |iv| iv[1] }.sort
            groups = 0
            j = 0
            starts.each do |s|
              if ends[j] < s
                j += 1 # a group has finished: reuse it
              else
                groups += 1
              end
            end
            groups
          end
        `,
      },
    };
  })(),

  // ── Two Best Non-Overlapping Events (LC 2054) ────────────────────
  (() => {
    const ref = (events: number[][]) => {
      let best = 0;
      for (let i = 0; i < events.length; i++) {
        best = Math.max(best, events[i][2]);
        for (let j = 0; j < events.length; j++) if (events[i][1] < events[j][0]) best = Math.max(best, events[i][2] + events[j][2]);
      }
      return best;
    };
    return {
      slug: "two-best-non-overlapping-events",
      title: "Two Best Non-Overlapping Events",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Dynamic Programming", "Sorting", "Amazon", "Google"],
      signature: { funcName: "maxTwoEvents", params: [{ name: "events", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Each `events[i] = [startTime, endTime, value]` is an event you may attend from `startTime` to `endTime`, **both inclusive**, earning `value`.\n\nYou may attend **at most two** events, and they must not overlap: because times are inclusive, the second event has to start strictly after the first one ends (`end1 < start2`).\n\nReturn the maximum total value you can earn.",
        [
          { in: "events = [[2,4,6],[5,9,3],[1,2,4],[4,8,5]]", out: "9", note: "[1,2,4] with [4,8,5], or [2,4,6] with [5,9,3]. [1,2,4] and [2,4,6] overlap at time 2." },
          { in: "events = [[1,3,2],[4,5,2],[1,5,5]]", out: "5", note: "A single event can be the best choice." },
          { in: "events = [[1,5,3],[1,5,1],[6,6,5]]", out: "8" },
        ],
        ["2 <= events.length <= 10^5", "events[i].length == 3", "1 <= startTime <= endTime <= 10^9", "1 <= value <= 10^6"]),
      hints: [
        "Fix the earlier of the two events. The best partner is the most valuable event that starts after it ends.",
        "Sort events by start time and precompute a suffix maximum of values.",
        "For each event, binary-search the first event whose start is greater than this event's end; add the suffix maximum from there (or nothing).",
      ],
      editorial: explain({
        idea: "Pair each event with the best event that starts strictly after it ends. Sorted by start, the candidates form a suffix, so a suffix-maximum array plus binary search answers each event in `O(log n)`.",
        steps: [
          "Sort the events by `startTime`.",
          "Build `suffix[i]`, the maximum value among events `i..n-1`.",
          "For each event, find the first index `j` with `start[j] > end` by binary search.",
          "The candidate is `value + suffix[j]` (just `value` if `j == n`); return the maximum candidate.",
        ],
        why: "In any optimal pair, the earlier event's `end` is below the later event's `start`; the later one lies in the suffix found by the binary search, and the suffix maximum is at least its value. Single events are covered by the `j == n` case or by pairing with nothing, since values are positive and attending one event is allowed.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Times are inclusive: an event ending at 4 and one starting at 4 overlap — search for `start > end`, not `>=`.",
          "Attending a single event is allowed and may be optimal.",
          "Do not pair an event with itself; the strict inequality already rules it out since `start <= end`.",
        ],
      }),
      examples: [
        { input: "[[2,4,6],[5,9,3],[1,2,4],[4,8,5]]", expectedOutput: "9" },
        { input: "[[1,3,2],[4,5,2],[1,5,5]]", expectedOutput: "5" },
        { input: "[[1,5,3],[1,5,1],[6,6,5]]", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 5, 15, 40]));
        const span = pick(rng, [4, 30, 1000, 1000000000]);
        const vTop = pick(rng, [1, 10, 1000000]);
        const events: number[][] = [];
        for (let i = 0; i < n; i++) {
          const s = ri(rng, 1, span);
          const e = Math.min(span, s + ri(rng, 0, Math.max(0, Math.floor(span / pick(rng, [1, 4, 20])))));
          events.push([s, e, ri(rng, 1, vTop)]);
        }
        return { input: fmtIntMat(events), expectedOutput: String(ref(events)) };
      },
      solutions: {
        python: code`
          from typing import List
          from bisect import bisect_right

          def maxTwoEvents(events: List[List[int]]) -> int:
              ev = sorted(events)
              starts = [e[0] for e in ev]
              n = len(ev)
              suffix = [0] * (n + 1)  # suffix[i]: best value among ev[i:]
              for i in range(n - 1, -1, -1):
                  suffix[i] = max(suffix[i + 1], ev[i][2])
              best = 0
              for s, e, v in ev:
                  j = bisect_right(starts, e)  # first event starting after e
                  best = max(best, v + suffix[j])
              return best
        `,
        javascript: code`
          var maxTwoEvents = function(events) {
              var ev = events.slice().sort(function(a, b) { return a[0] - b[0]; });
              var n = ev.length;
              var suffix = []; // suffix[i]: best value among ev[i..]
              for (var z = 0; z <= n; z++) suffix.push(0);
              for (var i = n - 1; i >= 0; i--) suffix[i] = Math.max(suffix[i + 1], ev[i][2]);
              var best = 0;
              for (var t = 0; t < n; t++) {
                  var lo = 0, hi = n; // first event starting after ev[t][1]
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (ev[mid][0] <= ev[t][1]) lo = mid + 1; else hi = mid;
                  }
                  best = Math.max(best, ev[t][2] + suffix[lo]);
              }
              return best;
          };
        `,
        typescript: code`
          function maxTwoEvents(events: number[][]): number {
              var ev = events.slice().sort(function(a, b) { return a[0] - b[0]; });
              var n = ev.length;
              var suffix: number[] = []; // suffix[i]: best value among ev[i..]
              for (var z = 0; z <= n; z++) suffix.push(0);
              for (var i = n - 1; i >= 0; i--) suffix[i] = Math.max(suffix[i + 1], ev[i][2]);
              var best = 0;
              for (var t = 0; t < n; t++) {
                  var lo = 0, hi = n; // first event starting after ev[t][1]
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (ev[mid][0] <= ev[t][1]) lo = mid + 1; else hi = mid;
                  }
                  best = Math.max(best, ev[t][2] + suffix[lo]);
              }
              return best;
          }
        `,
        java: code`
          public static int maxTwoEvents(int[][] events) {
              int[][] ev = events.clone();
              Arrays.sort(ev, (a, b) -> Integer.compare(a[0], b[0]));
              int n = ev.length;
              int[] suffix = new int[n + 1]; // suffix[i]: best value among ev[i..]
              for (int i = n - 1; i >= 0; i--) suffix[i] = Math.max(suffix[i + 1], ev[i][2]);
              int best = 0;
              for (int[] e : ev) {
                  int lo = 0, hi = n; // first event starting after e[1]
                  while (lo < hi) {
                      int mid = (lo + hi) >>> 1;
                      if (ev[mid][0] <= e[1]) lo = mid + 1; else hi = mid;
                  }
                  best = Math.max(best, e[2] + suffix[lo]);
              }
              return best;
          }
        `,
        cpp: code`
          int maxTwoEvents(vector<vector<int>>& events) {
              vector<vector<int>> ev = events;
              sort(ev.begin(), ev.end());
              int n = ev.size();
              vector<int> suffix(n + 1, 0); // suffix[i]: best value among ev[i..]
              for (int i = n - 1; i >= 0; i--) suffix[i] = max(suffix[i + 1], ev[i][2]);
              int best = 0;
              for (auto& e : ev) {
                  int lo = 0, hi = n; // first event starting after e[1]
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (ev[mid][0] <= e[1]) lo = mid + 1; else hi = mid;
                  }
                  best = max(best, e[2] + suffix[lo]);
              }
              return best;
          }
        `,
        c: code`
          static int cmpByStart(const void* a, const void* b) {
              const int* x = *(const int* const*) a;
              const int* y = *(const int* const*) b;
              return (x[0] > y[0]) - (x[0] < y[0]);
          }

          int maxTwoEvents(int** events, int eventsSize, int* eventsColSize) {
              int n = eventsSize;
              int** ev = (int**) malloc((size_t) n * sizeof(int*));
              for (int i = 0; i < n; i++) ev[i] = events[i];
              qsort(ev, (size_t) n, sizeof(int*), cmpByStart);
              int* suffix = (int*) malloc((size_t) (n + 1) * sizeof(int)); // suffix[i]: best value among ev[i..]
              suffix[n] = 0;
              for (int i = n - 1; i >= 0; i--) suffix[i] = suffix[i + 1] > ev[i][2] ? suffix[i + 1] : ev[i][2];
              int best = 0;
              for (int t = 0; t < n; t++) {
                  int lo = 0, hi = n; // first event starting after ev[t][1]
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (ev[mid][0] <= ev[t][1]) lo = mid + 1; else hi = mid;
                  }
                  if (ev[t][2] + suffix[lo] > best) best = ev[t][2] + suffix[lo];
              }
              free(ev);
              free(suffix);
              return best;
          }
        `,
        csharp: code`
          public static int MaxTwoEvents(int[][] events)
          {
              var ev = (int[][]) events.Clone();
              Array.Sort(ev, (a, b) => a[0].CompareTo(b[0]));
              int n = ev.Length;
              var suffix = new int[n + 1]; // suffix[i]: best value among ev[i..]
              for (int i = n - 1; i >= 0; i--) suffix[i] = Math.Max(suffix[i + 1], ev[i][2]);
              int best = 0;
              foreach (var e in ev)
              {
                  int lo = 0, hi = n; // first event starting after e[1]
                  while (lo < hi)
                  {
                      int mid = (lo + hi) / 2;
                      if (ev[mid][0] <= e[1]) lo = mid + 1; else hi = mid;
                  }
                  best = Math.Max(best, e[2] + suffix[lo]);
              }
              return best;
          }
        `,
        go: code`
          func maxTwoEvents(events [][]int) int {
              ev := make([][]int, len(events))
              copy(ev, events)
              sort.Slice(ev, func(a, b int) bool { return ev[a][0] < ev[b][0] })
              n := len(ev)
              suffix := make([]int, n+1) // suffix[i]: best value among ev[i..]
              for i := n - 1; i >= 0; i-- {
                  suffix[i] = suffix[i+1]
                  if ev[i][2] > suffix[i] {
                      suffix[i] = ev[i][2]
                  }
              }
              best := 0
              for _, e := range ev {
                  j := sort.Search(n, func(m int) bool { return ev[m][0] > e[1] }) // first event starting after e[1]
                  if e[2]+suffix[j] > best {
                      best = e[2] + suffix[j]
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxTwoEvents(events: Array<IntArray>): Int {
              val ev = events.sortedBy { it[0] }
              val n = ev.size
              val suffix = IntArray(n + 1) // suffix[i]: best value among ev[i..]
              for (i in n - 1 downTo 0) suffix[i] = maxOf(suffix[i + 1], ev[i][2])
              var best = 0
              for (e in ev) {
                  var lo = 0 // first event starting after e[1]
                  var hi = n
                  while (lo < hi) {
                      val mid = (lo + hi) / 2
                      if (ev[mid][0] <= e[1]) lo = mid + 1 else hi = mid
                  }
                  best = maxOf(best, e[2] + suffix[lo])
              }
              return best
          }
        `,
        swift: code`
          func maxTwoEvents(_ events: [[Int]]) -> Int {
              let ev = events.sorted { $0[0] < $1[0] }
              let n = ev.count
              var suffix = [Int](repeating: 0, count: n + 1) // suffix[i]: best value among ev[i..]
              var i = n - 1
              while i >= 0 {
                  suffix[i] = max(suffix[i + 1], ev[i][2])
                  i -= 1
              }
              var best = 0
              for e in ev {
                  var lo = 0, hi = n // first event starting after e[1]
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if ev[mid][0] <= e[1] { lo = mid + 1 } else { hi = mid }
                  }
                  best = max(best, e[2] + suffix[lo])
              }
              return best
          }
        `,
        rust: code`
          fn maxTwoEvents(events: Vec<Vec<i32>>) -> i32 {
              let mut ev = events.clone();
              ev.sort_by_key(|e| e[0]);
              let n = ev.len();
              let mut suffix = vec![0i32; n + 1]; // suffix[i]: best value among ev[i..]
              for i in (0..n).rev() {
                  suffix[i] = suffix[i + 1].max(ev[i][2]);
              }
              let mut best = 0;
              for e in ev.iter() {
                  let (mut lo, mut hi) = (0usize, n); // first event starting after e[1]
                  while lo < hi {
                      let mid = (lo + hi) / 2;
                      if ev[mid][0] <= e[1] {
                          lo = mid + 1;
                      } else {
                          hi = mid;
                      }
                  }
                  best = best.max(e[2] + suffix[lo]);
              }
              best
          }
        `,
        php: code`
          function maxTwoEvents($events) {
              $ev = $events;
              usort($ev, function ($a, $b) { return $a[0] <=> $b[0]; });
              $n = count($ev);
              $suffix = array_fill(0, $n + 1, 0); // suffix[i]: best value among ev[i..]
              for ($i = $n - 1; $i >= 0; $i--) $suffix[$i] = max($suffix[$i + 1], $ev[$i][2]);
              $best = 0;
              foreach ($ev as $e) {
                  $lo = 0; // first event starting after e[1]
                  $hi = $n;
                  while ($lo < $hi) {
                      $mid = intdiv($lo + $hi, 2);
                      if ($ev[$mid][0] <= $e[1]) $lo = $mid + 1; else $hi = $mid;
                  }
                  $best = max($best, $e[2] + $suffix[$lo]);
              }
              return $best;
          }
        `,
        ruby: code`
          def maxTwoEvents(events)
            ev = events.sort_by { |e| e[0] }
            n = ev.length
            suffix = Array.new(n + 1, 0) # suffix[i]: best value among ev[i..]
            (n - 1).downto(0) { |i| suffix[i] = [suffix[i + 1], ev[i][2]].max }
            best = 0
            ev.each do |e|
              j = (0...n).bsearch { |m| ev[m][0] > e[1] } || n # first event starting after e[1]
              best = [best, e[2] + suffix[j]].max
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Minimum Number of Coins to be Added (LC 2952) ────────────────
  (() => {
    // Subset-sum reachability, adding the smallest unreachable amount until
    // 1..target is covered; large targets fall back to the prefix-reach count.
    const ref = (coins: number[], target: number) => {
      if (target > 300) {
        const a = coins.slice().sort((x, y) => x - y);
        let reach = 0, added = 0, i = 0;
        while (reach < target) {
          if (i < a.length && a[i] <= reach + 1) reach += a[i++];
          else { reach += reach + 1; added++; }
        }
        return added;
      }
      const all = coins.slice();
      let added = 0;
      for (;;) {
        const ok = new Array(target + 1).fill(false);
        ok[0] = true;
        for (const c of all) for (let s = target; s >= c; s--) if (ok[s - c]) ok[s] = true;
        let miss = -1;
        for (let x = 1; x <= target; x++) if (!ok[x]) { miss = x; break; }
        if (miss < 0) return added;
        all.push(miss);
        added++;
      }
    };
    return {
      slug: "minimum-number-of-coins-to-be-added",
      title: "Minimum Number of Coins to be Added",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Google"],
      signature: {
        funcName: "minimumAddedCoins",
        params: [{ name: "coins", type: "int[]" as const }, { name: "target", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an array `coins` of coin values and an integer `target`.\n\nAn integer `x` is **obtainable** if some subset of the coins (each coin used at most once) sums to exactly `x`.\n\nReturn the **minimum** number of coins, of any values you like, that must be added to `coins` so that every integer in `[1, target]` is obtainable.",
        [
          { in: "coins = [2,5], target = 10", out: "2", note: "Add 1 and 4: with [1,2,4,5] every amount from 1 to 12 can be made. One extra coin is not enough — 1 is needed, and [1,2,5] cannot make 4." },
          { in: "coins = [1,4,10], target = 19", out: "2", note: "Add 2 and 8." },
          { in: "coins = [1,1,1], target = 20", out: "3", note: "Add 4, 8 and 16." },
        ],
        ["1 <= target <= 10^5", "1 <= coins.length <= 10^5", "1 <= coins[i] <= target"]),
      hints: [
        "Suppose every amount in `[0, reach]` is obtainable. A coin of value `c <= reach + 1` extends that to `[0, reach + c]`.",
        "Process the coins in increasing order. If the next coin is larger than `reach + 1`, the amount `reach + 1` can never be made without help.",
        "When that happens, add a coin of value `reach + 1` — it doubles the covered range, the most any single coin can do.",
      ],
      editorial: explain({
        idea: "Track the largest `reach` such that every amount `0..reach` is obtainable. Coins are absorbed in increasing order; whenever the next coin leaves a gap at `reach + 1`, the best patch is a coin worth exactly `reach + 1`.",
        steps: [
          "Sort `coins`; set `reach = 0`, `added = 0`, `i = 0`.",
          "While `reach < target`: if `i < n` and `coins[i] <= reach + 1`, set `reach += coins[i]` and advance `i`.",
          "Otherwise add the coin `reach + 1`: `reach = 2 * reach + 1` and `added += 1`.",
          "Return `added`.",
        ],
        why: "If `0..reach` is obtainable and `c <= reach + 1`, then `c..c + reach` is too, and the two ranges touch, so `0..reach + c` is obtainable. If the smallest unused coin exceeds `reach + 1`, no subset can make `reach + 1` — every coin used would be at most `reach` in total or exceed it — so some added coin must be `<= reach + 1`; choosing exactly `reach + 1` extends the range furthest, so no other choice can need fewer additions.",
        time: "O(n log n + log target)",
        space: "O(1) beyond the sort",
        pitfalls: [
          "The gap test is `coin > reach + 1`, not `coin > reach`: a coin equal to `reach + 1` fills the gap itself.",
          "Stop as soon as `reach >= target`; leftover coins do not matter.",
          "The same coin value may appear several times — each copy is used at most once and extends `reach` separately.",
        ],
      }),
      examples: [
        { input: "[2,5]\n10", expectedOutput: "2" },
        { input: "[1,4,10]\n19", expectedOutput: "2" },
        { input: "[1,1,1]\n20", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const target = ri(rng, 1, pick(rng, [5, 40, 300, 300, 100000]));
        const n = ri(rng, 1, pick(rng, [1, 3, 8, 15]));
        const cTop = pick(rng, [Math.min(3, target), Math.min(20, target), target]);
        const coins = Array.from({ length: n }, () => ri(rng, 1, cTop));
        return { input: `${fmtIntArr(coins)}\n${target}`, expectedOutput: String(ref(coins, target)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumAddedCoins(coins: List[int], target: int) -> int:
              reach = 0  # every amount in 0..reach is obtainable
              added = 0
              i = 0
              a = sorted(coins)
              while reach < target:
                  if i < len(a) and a[i] <= reach + 1:
                      reach += a[i]
                      i += 1
                  else:
                      reach += reach + 1  # add a coin worth reach + 1
                      added += 1
              return added
        `,
        javascript: code`
          var minimumAddedCoins = function(coins, target) {
              var a = coins.slice().sort(function(x, y) { return x - y; });
              var reach = 0, added = 0, i = 0; // every amount in 0..reach is obtainable
              while (reach < target) {
                  if (i < a.length && a[i] <= reach + 1) {
                      reach += a[i++];
                  } else {
                      reach += reach + 1; // add a coin worth reach + 1
                      added++;
                  }
              }
              return added;
          };
        `,
        typescript: code`
          function minimumAddedCoins(coins: number[], target: number): number {
              var a = coins.slice().sort(function(x, y) { return x - y; });
              var reach = 0, added = 0, i = 0; // every amount in 0..reach is obtainable
              while (reach < target) {
                  if (i < a.length && a[i] <= reach + 1) {
                      reach += a[i++];
                  } else {
                      reach += reach + 1; // add a coin worth reach + 1
                      added++;
                  }
              }
              return added;
          }
        `,
        java: code`
          public static int minimumAddedCoins(int[] coins, int target) {
              int[] a = coins.clone();
              Arrays.sort(a);
              long reach = 0; // every amount in 0..reach is obtainable
              int added = 0, i = 0;
              while (reach < target) {
                  if (i < a.length && a[i] <= reach + 1) {
                      reach += a[i++];
                  } else {
                      reach += reach + 1; // add a coin worth reach + 1
                      added++;
                  }
              }
              return added;
          }
        `,
        cpp: code`
          int minimumAddedCoins(vector<int>& coins, int target) {
              vector<int> a = coins;
              sort(a.begin(), a.end());
              long long reach = 0; // every amount in 0..reach is obtainable
              int added = 0;
              size_t i = 0;
              while (reach < target) {
                  if (i < a.size() && a[i] <= reach + 1) {
                      reach += a[i++];
                  } else {
                      reach += reach + 1; // add a coin worth reach + 1
                      added++;
                  }
              }
              return added;
          }
        `,
        c: code`
          static int cmpInt(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          int minimumAddedCoins(int* coins, int coinsSize, int target) {
              int* a = (int*) malloc((size_t) coinsSize * sizeof(int));
              memcpy(a, coins, (size_t) coinsSize * sizeof(int));
              qsort(a, (size_t) coinsSize, sizeof(int), cmpInt);
              long long reach = 0; // every amount in 0..reach is obtainable
              int added = 0, i = 0;
              while (reach < target) {
                  if (i < coinsSize && a[i] <= reach + 1) {
                      reach += a[i++];
                  } else {
                      reach += reach + 1; // add a coin worth reach + 1
                      added++;
                  }
              }
              free(a);
              return added;
          }
        `,
        csharp: code`
          public static int MinimumAddedCoins(int[] coins, int target)
          {
              var a = (int[]) coins.Clone();
              Array.Sort(a);
              long reach = 0; // every amount in 0..reach is obtainable
              int added = 0, i = 0;
              while (reach < target)
              {
                  if (i < a.Length && a[i] <= reach + 1)
                  {
                      reach += a[i++];
                  }
                  else
                  {
                      reach += reach + 1; // add a coin worth reach + 1
                      added++;
                  }
              }
              return added;
          }
        `,
        go: code`
          func minimumAddedCoins(coins []int, target int) int {
              a := make([]int, len(coins))
              copy(a, coins)
              sort.Ints(a)
              reach, added, i := 0, 0, 0 // every amount in 0..reach is obtainable
              for reach < target {
                  if i < len(a) && a[i] <= reach+1 {
                      reach += a[i]
                      i++
                  } else {
                      reach += reach + 1 // add a coin worth reach + 1
                      added++
                  }
              }
              return added
          }
        `,
        kotlin: code`
          fun minimumAddedCoins(coins: IntArray, target: Int): Int {
              val a = coins.sortedArray()
              var reach = 0L // every amount in 0..reach is obtainable
              var added = 0
              var i = 0
              while (reach < target) {
                  if (i < a.size && a[i] <= reach + 1) {
                      reach += a[i]
                      i++
                  } else {
                      reach += reach + 1 // add a coin worth reach + 1
                      added++
                  }
              }
              return added
          }
        `,
        swift: code`
          func minimumAddedCoins(_ coins: [Int], _ target: Int) -> Int {
              let a = coins.sorted()
              var reach = 0, added = 0, i = 0 // every amount in 0..reach is obtainable
              while reach < target {
                  if i < a.count && a[i] <= reach + 1 {
                      reach += a[i]
                      i += 1
                  } else {
                      reach += reach + 1 // add a coin worth reach + 1
                      added += 1
                  }
              }
              return added
          }
        `,
        rust: code`
          fn minimumAddedCoins(coins: Vec<i32>, target: i32) -> i32 {
              let mut a = coins.clone();
              a.sort();
              let mut reach: i64 = 0; // every amount in 0..reach is obtainable
              let mut added = 0;
              let mut i = 0;
              while reach < target as i64 {
                  if i < a.len() && (a[i] as i64) <= reach + 1 {
                      reach += a[i] as i64;
                      i += 1;
                  } else {
                      reach += reach + 1; // add a coin worth reach + 1
                      added += 1;
                  }
              }
              added
          }
        `,
        php: code`
          function minimumAddedCoins($coins, $target) {
              $a = $coins;
              sort($a);
              $n = count($a);
              $reach = 0; // every amount in 0..reach is obtainable
              $added = 0;
              $i = 0;
              while ($reach < $target) {
                  if ($i < $n && $a[$i] <= $reach + 1) {
                      $reach += $a[$i];
                      $i++;
                  } else {
                      $reach += $reach + 1; // add a coin worth reach + 1
                      $added++;
                  }
              }
              return $added;
          }
        `,
        ruby: code`
          def minimumAddedCoins(coins, target)
            a = coins.sort
            reach = 0 # every amount in 0..reach is obtainable
            added = 0
            i = 0
            while reach < target
              if i < a.length && a[i] <= reach + 1
                reach += a[i]
                i += 1
              else
                reach += reach + 1 # add a coin worth reach + 1
                added += 1
              end
            end
            added
          end
        `,
      },
    };
  })(),

  // ── Maximum Element After Decreasing and Rearranging (LC 1846) ───
  (() => {
    // Counting version, independent of the sort: values above n act like n.
    const ref = (arr: number[]) => {
      const n = arr.length;
      const count = new Array(n + 1).fill(0);
      for (const v of arr) count[Math.min(v, n)]++;
      let cur = 0;
      for (let k = 1; k <= n; k++) cur = Math.min(cur + count[k], k);
      return cur;
    };
    return {
      slug: "maximum-element-after-decreasing-and-rearranging",
      title: "Maximum Element After Decreasing and Rearranging",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Google"],
      signature: {
        funcName: "maximumElementAfterDecrementingAndRearranging",
        params: [{ name: "arr", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an array `arr` of positive integers. You may apply these operations any number of times:\n\n- **Decrease** any element to a smaller positive integer.\n- **Rearrange** the elements in any order.\n\nAfterwards the array must satisfy: the first element is `1`, and every two adjacent elements differ by at most `1` (`abs(arr[i] - arr[i - 1]) <= 1`).\n\nReturn the **largest** possible value of the maximum element of the resulting array.",
        [
          { in: "arr = [7,3,3,1]", out: "4", note: "Rearrange to [1,3,3,7] and decrease to [1,2,3,4]." },
          { in: "arr = [2,2,1,2,1]", out: "2", note: "[1,2,2,2,1] already works; nothing can exceed 2." },
          { in: "arr = [100,1,1000]", out: "3" },
        ],
        ["1 <= arr.length <= 10^5", "1 <= arr[i] <= 10^9"]),
      hints: [
        "Since elements can only go down, put them in ascending order — a larger value is never wasted early.",
        "In sorted order, each element can be at most one more than the element before it.",
        "Walk the sorted array setting `arr[i] = min(arr[i], arr[i - 1] + 1)` with `arr[0] = 1`; the last value is the answer.",
      ],
      editorial: explain({
        idea: "Sort ascending and greedily make each element as large as the rules allow: `1` for the first, then at most one more than its predecessor and never more than its own value.",
        steps: [
          "Sort `arr` ascending.",
          "Set `prev = 0`. For each value `v` in order, set `prev = min(v, prev + 1)`.",
          "Return `prev`.",
        ],
        why: "In any valid final array the maximum is reached by a non-decreasing staircase from 1, so we may as well arrange the values ascending — swapping a larger value into an earlier slot never increases what later slots can reach. Along the sorted order, each position is capped both by its own value (we can only decrease) and by the previous position plus one; taking the larger of the allowed values at every step keeps every later cap as high as possible.",
        time: "O(n log n)",
        space: "O(1) beyond the sort",
        pitfalls: [
          "The first element must become exactly 1, which `min(v, 0 + 1)` handles since every value is at least 1.",
          "The answer never exceeds `n`, so a counting sort over `min(v, n)` gives an `O(n)` variant.",
          "Duplicates are fine — two equal values may stay equal.",
        ],
      }),
      examples: [
        { input: "[7,3,3,1]", expectedOutput: "4" },
        { input: "[2,2,1,2,1]", expectedOutput: "2" },
        { input: "[100,1,1000]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 15, 50]));
        const top = pick(rng, [1, 3, n, 1000000000]);
        const arr = Array.from({ length: n }, () => ri(rng, 1, Math.max(1, top)));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumElementAfterDecrementingAndRearranging(arr: List[int]) -> int:
              prev = 0
              for v in sorted(arr):
                  prev = min(v, prev + 1)
              return prev
        `,
        javascript: code`
          var maximumElementAfterDecrementingAndRearranging = function(arr) {
              var a = arr.slice().sort(function(x, y) { return x - y; });
              var prev = 0;
              for (var i = 0; i < a.length; i++) prev = Math.min(a[i], prev + 1);
              return prev;
          };
        `,
        typescript: code`
          function maximumElementAfterDecrementingAndRearranging(arr: number[]): number {
              var a = arr.slice().sort(function(x, y) { return x - y; });
              var prev = 0;
              for (var i = 0; i < a.length; i++) prev = Math.min(a[i], prev + 1);
              return prev;
          }
        `,
        java: code`
          public static int maximumElementAfterDecrementingAndRearranging(int[] arr) {
              int[] a = arr.clone();
              Arrays.sort(a);
              int prev = 0;
              for (int v : a) prev = Math.min(v, prev + 1);
              return prev;
          }
        `,
        cpp: code`
          int maximumElementAfterDecrementingAndRearranging(vector<int>& arr) {
              vector<int> a = arr;
              sort(a.begin(), a.end());
              int prev = 0;
              for (int v : a) prev = min(v, prev + 1);
              return prev;
          }
        `,
        c: code`
          static int cmpInt(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          int maximumElementAfterDecrementingAndRearranging(int* arr, int arrSize) {
              int* a = (int*) malloc((size_t) arrSize * sizeof(int));
              memcpy(a, arr, (size_t) arrSize * sizeof(int));
              qsort(a, (size_t) arrSize, sizeof(int), cmpInt);
              int prev = 0;
              for (int i = 0; i < arrSize; i++) prev = a[i] < prev + 1 ? a[i] : prev + 1;
              free(a);
              return prev;
          }
        `,
        csharp: code`
          public static int MaximumElementAfterDecrementingAndRearranging(int[] arr)
          {
              var a = (int[]) arr.Clone();
              Array.Sort(a);
              int prev = 0;
              foreach (int v in a) prev = Math.Min(v, prev + 1);
              return prev;
          }
        `,
        go: code`
          func maximumElementAfterDecrementingAndRearranging(arr []int) int {
              a := make([]int, len(arr))
              copy(a, arr)
              sort.Ints(a)
              prev := 0
              for _, v := range a {
                  if v < prev+1 {
                      prev = v
                  } else {
                      prev++
                  }
              }
              return prev
          }
        `,
        kotlin: code`
          fun maximumElementAfterDecrementingAndRearranging(arr: IntArray): Int {
              var prev = 0
              for (v in arr.sorted()) prev = minOf(v, prev + 1)
              return prev
          }
        `,
        swift: code`
          func maximumElementAfterDecrementingAndRearranging(_ arr: [Int]) -> Int {
              var prev = 0
              for v in arr.sorted() { prev = min(v, prev + 1) }
              return prev
          }
        `,
        rust: code`
          fn maximumElementAfterDecrementingAndRearranging(arr: Vec<i32>) -> i32 {
              let mut a = arr.clone();
              a.sort();
              let mut prev = 0;
              for &v in a.iter() {
                  prev = v.min(prev + 1);
              }
              prev
          }
        `,
        php: code`
          function maximumElementAfterDecrementingAndRearranging($arr) {
              $a = $arr;
              sort($a);
              $prev = 0;
              foreach ($a as $v) $prev = min($v, $prev + 1);
              return $prev;
          }
        `,
        ruby: code`
          def maximumElementAfterDecrementingAndRearranging(arr)
            prev = 0
            arr.sort.each { |v| prev = [v, prev + 1].min }
            prev
          end
        `,
      },
    };
  })(),

  // ── Minimum Time to Finish the Race (LC 2188) ────────────────────
  (() => {
    // Exhaustive DP over the last stint (no lap cap): dp[i] = best time for
    // i laps, the final stint being k laps on a fresh tire of any type.
    const ref = (tires: number[][], changeTime: number, numLaps: number) => {
      const dp = new Array(numLaps + 1).fill(Infinity);
      dp[0] = 0;
      for (let i = 1; i <= numLaps; i++) {
        for (const [f, r] of tires) {
          let sum = 0, lap = f;
          for (let k = 1; k <= i; k++) {
            sum += lap;
            if (sum > 1e15) break;
            const cand = dp[i - k] + sum + (i - k > 0 ? changeTime : 0);
            if (cand < dp[i]) dp[i] = cand;
            lap *= r;
          }
        }
      }
      return dp[numLaps];
    };
    return {
      slug: "minimum-time-to-finish-the-race",
      title: "Minimum Time to Finish the Race",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "minimumFinishTime",
        params: [{ name: "tires", type: "int[][]" as const }, { name: "changeTime", type: "int" as const }, { name: "numLaps", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A race has `numLaps` laps. Tire type `i` is `tires[i] = [f, r]`: on a fresh tire of this type the first lap takes `f` seconds, the second `f * r`, the third `f * r^2`, and so on — the `x`-th successive lap on the same tire takes `f * r^(x - 1)` seconds.\n\nYou start on any tire type you like. After any lap you may switch to a **fresh** tire of any type (including the type you are on), which costs `changeTime` seconds. Every type is available in unlimited supply.\n\nReturn the minimum total time to complete the race.",
        [
          { in: "tires = [[1,2]], changeTime = 2, numLaps = 4", out: "8", note: "Two laps (1 + 2), change (2), two laps (1 + 2): 8. Staying on one tire would cost 1 + 2 + 4 + 8 = 15." },
          { in: "tires = [[2,3],[3,4]], changeTime = 5, numLaps = 4", out: "21" },
          { in: "tires = [[1,10],[2,2],[3,4]], changeTime = 6, numLaps = 5", out: "25" },
        ],
        ["1 <= tires.length <= 10^5", "tires[i].length == 2", "1 <= f, changeTime <= 10^5", "2 <= r <= 10^5", "1 <= numLaps <= 1000"]),
      hints: [
        "Split the race into stints, each driven on one fresh tire. Let `best[k]` be the cheapest way to drive `k` laps on a single fresh tire, over all types.",
        "Lap times at least double, so once a lap would take longer than `changeTime + f`, changing to a fresh tire is better — `best[k]` is only needed for about 20 values of `k`.",
        "Then `dp[i] = min over k of dp[i - k] + changeTime + best[k]`, with `dp[0] = -changeTime` so the first stint pays no change.",
      ],
      editorial: explain({
        idea: "Any strategy is a sequence of stints on fresh tires separated by changes. Precompute the best cost of a `k`-lap stint, which is only worth having for small `k` because lap times grow geometrically, and combine stints with a one-dimensional DP over laps.",
        steps: [
          "For each tire, walk its lap times `f, f*r, f*r^2, ...` while a lap costs at most `changeTime + f`, accumulating the stint cost; keep `best[k] = min` over tires.",
          "Let `K` be the largest `k` with a finite `best[k]`.",
          "Set `dp[0] = -changeTime`. For `i = 1..numLaps`, `dp[i] = min(dp[i - k] + changeTime + best[k])` over `1 <= k <= min(i, K)`.",
          "Return `dp[numLaps]`.",
        ],
        why: "If the `x`-th lap of a stint costs more than `changeTime + f`, replacing it (and everything after it) by a change plus a fresh tire of the same type is strictly cheaper, so optimal stints never contain such a lap, and dropping those `best[k]` values loses nothing. Since `r >= 2`, the lap time passes `changeTime + f <= 2 * 10^5` within about 18 laps. The DP then tries every length for the final stint, which covers every sequence of stints.",
        time: "O(T log C + numLaps * K)",
        space: "O(numLaps)",
        pitfalls: [
          "`f * r^(x - 1)` overflows quickly — stop the walk before multiplying past the cap, and use 64-bit for the lap time.",
          "The first stint has no change before it; the `dp[0] = -changeTime` trick handles that.",
          "Switching to a fresh tire of the **same** type is allowed and is often the best move.",
        ],
      }),
      examples: [
        { input: "[[1,2]]\n2\n4", expectedOutput: "8" },
        { input: "[[2,3],[3,4]]\n5\n4", expectedOutput: "21" },
        { input: "[[1,10],[2,2],[3,4]]\n6\n5", expectedOutput: "25" },
      ],
      gen: (rng: Rng) => {
        const t = ri(rng, 1, pick(rng, [1, 2, 5]));
        const fTop = pick(rng, [3, 100, 100000]);
        const rTop = pick(rng, [2, 4, 20, 100000]);
        const tires = Array.from({ length: t }, () => [ri(rng, 1, fTop), ri(rng, 2, rTop)]);
        const changeTime = ri(rng, 1, pick(rng, [3, 100, 100000]));
        const numLaps = ri(rng, 1, pick(rng, [3, 12, 40, 100, 100, 1000]));
        return { input: `${fmtIntMat(tires)}\n${changeTime}\n${numLaps}`, expectedOutput: String(ref(tires, changeTime, numLaps)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumFinishTime(tires: List[List[int]], changeTime: int, numLaps: int) -> int:
              INF = float('inf')
              best = [INF] * (numLaps + 1)  # best[k]: k laps on one fresh tire
              top = 0
              for f, r in tires:
                  lap, total, k = f, 0, 1
                  while k <= numLaps and lap <= changeTime + f:
                      total += lap
                      best[k] = min(best[k], total)
                      top = max(top, k)
                      lap *= r
                      k += 1
              dp = [0] * (numLaps + 1)
              dp[0] = -changeTime  # the first stint needs no change
              for i in range(1, numLaps + 1):
                  dp[i] = min(dp[i - k] + changeTime + best[k] for k in range(1, min(i, top) + 1))
              return dp[numLaps]
        `,
        javascript: code`
          var minimumFinishTime = function(tires, changeTime, numLaps) {
              var INF = 1e18;
              var best = []; // best[k]: k laps on one fresh tire
              for (var z = 0; z <= numLaps; z++) best.push(INF);
              var top = 0;
              for (var t = 0; t < tires.length; t++) {
                  var f = tires[t][0], r = tires[t][1];
                  var lap = f, total = 0;
                  for (var k = 1; k <= numLaps && lap <= changeTime + f; k++) {
                      total += lap;
                      if (total < best[k]) best[k] = total;
                      if (k > top) top = k;
                      lap *= r;
                  }
              }
              var dp = [-changeTime]; // the first stint needs no change
              for (var i = 1; i <= numLaps; i++) {
                  var cur = INF;
                  for (var j = 1; j <= Math.min(i, top); j++) {
                      var cand = dp[i - j] + changeTime + best[j];
                      if (cand < cur) cur = cand;
                  }
                  dp.push(cur);
              }
              return dp[numLaps];
          };
        `,
        typescript: code`
          function minimumFinishTime(tires: number[][], changeTime: number, numLaps: number): number {
              var INF = 1e18;
              var best: number[] = []; // best[k]: k laps on one fresh tire
              for (var z = 0; z <= numLaps; z++) best.push(INF);
              var top = 0;
              for (var t = 0; t < tires.length; t++) {
                  var f = tires[t][0], r = tires[t][1];
                  var lap = f, total = 0;
                  for (var k = 1; k <= numLaps && lap <= changeTime + f; k++) {
                      total += lap;
                      if (total < best[k]) best[k] = total;
                      if (k > top) top = k;
                      lap *= r;
                  }
              }
              var dp: number[] = [-changeTime]; // the first stint needs no change
              for (var i = 1; i <= numLaps; i++) {
                  var cur = INF;
                  for (var j = 1; j <= Math.min(i, top); j++) {
                      var cand = dp[i - j] + changeTime + best[j];
                      if (cand < cur) cur = cand;
                  }
                  dp.push(cur);
              }
              return dp[numLaps];
          }
        `,
        java: code`
          public static int minimumFinishTime(int[][] tires, int changeTime, int numLaps) {
              long INF = Long.MAX_VALUE / 4;
              long[] best = new long[numLaps + 1]; // best[k]: k laps on one fresh tire
              Arrays.fill(best, INF);
              int top = 0;
              for (int[] tire : tires) {
                  long f = tire[0], r = tire[1];
                  long lap = f, total = 0;
                  for (int k = 1; k <= numLaps && lap <= changeTime + f; k++) {
                      total += lap;
                      best[k] = Math.min(best[k], total);
                      top = Math.max(top, k);
                      lap *= r;
                  }
              }
              long[] dp = new long[numLaps + 1];
              dp[0] = -changeTime; // the first stint needs no change
              for (int i = 1; i <= numLaps; i++) {
                  dp[i] = INF;
                  for (int k = 1; k <= Math.min(i, top); k++) dp[i] = Math.min(dp[i], dp[i - k] + changeTime + best[k]);
              }
              return (int) dp[numLaps];
          }
        `,
        cpp: code`
          int minimumFinishTime(vector<vector<int>>& tires, int changeTime, int numLaps) {
              const long long INF = LLONG_MAX / 4;
              vector<long long> best(numLaps + 1, INF); // best[k]: k laps on one fresh tire
              int top = 0;
              for (auto& tire : tires) {
                  long long f = tire[0], r = tire[1];
                  long long lap = f, total = 0;
                  for (int k = 1; k <= numLaps && lap <= changeTime + f; k++) {
                      total += lap;
                      best[k] = min(best[k], total);
                      top = max(top, k);
                      lap *= r;
                  }
              }
              vector<long long> dp(numLaps + 1, INF);
              dp[0] = -changeTime; // the first stint needs no change
              for (int i = 1; i <= numLaps; i++) {
                  for (int k = 1; k <= min(i, top); k++) dp[i] = min(dp[i], dp[i - k] + changeTime + best[k]);
              }
              return (int) dp[numLaps];
          }
        `,
        c: code`
          int minimumFinishTime(int** tires, int tiresSize, int* tiresColSize, int changeTime, int numLaps) {
              const long long INF = 4000000000000000000LL;
              long long* best = (long long*) malloc((size_t) (numLaps + 1) * sizeof(long long)); // best[k]: k laps on one fresh tire
              for (int k = 0; k <= numLaps; k++) best[k] = INF;
              int top = 0;
              for (int t = 0; t < tiresSize; t++) {
                  long long f = tires[t][0], r = tires[t][1];
                  long long lap = f, total = 0;
                  for (int k = 1; k <= numLaps && lap <= changeTime + f; k++) {
                      total += lap;
                      if (total < best[k]) best[k] = total;
                      if (k > top) top = k;
                      lap *= r;
                  }
              }
              long long* dp = (long long*) malloc((size_t) (numLaps + 1) * sizeof(long long));
              dp[0] = -changeTime; // the first stint needs no change
              for (int i = 1; i <= numLaps; i++) {
                  dp[i] = INF;
                  int lim = i < top ? i : top;
                  for (int k = 1; k <= lim; k++) {
                      long long cand = dp[i - k] + changeTime + best[k];
                      if (cand < dp[i]) dp[i] = cand;
                  }
              }
              int answer = (int) dp[numLaps];
              free(best);
              free(dp);
              return answer;
          }
        `,
        csharp: code`
          public static int MinimumFinishTime(int[][] tires, int changeTime, int numLaps)
          {
              long INF = long.MaxValue / 4;
              var best = new long[numLaps + 1]; // best[k]: k laps on one fresh tire
              for (int k = 0; k <= numLaps; k++) best[k] = INF;
              int top = 0;
              foreach (var tire in tires)
              {
                  long f = tire[0], r = tire[1];
                  long lap = f, total = 0;
                  for (int k = 1; k <= numLaps && lap <= changeTime + f; k++)
                  {
                      total += lap;
                      best[k] = Math.Min(best[k], total);
                      top = Math.Max(top, k);
                      lap *= r;
                  }
              }
              var dp = new long[numLaps + 1];
              dp[0] = -changeTime; // the first stint needs no change
              for (int i = 1; i <= numLaps; i++)
              {
                  dp[i] = INF;
                  for (int k = 1; k <= Math.Min(i, top); k++) dp[i] = Math.Min(dp[i], dp[i - k] + changeTime + best[k]);
              }
              return (int) dp[numLaps];
          }
        `,
        go: code`
          func minimumFinishTime(tires [][]int, changeTime int, numLaps int) int {
              const inf = 1 << 62
              best := make([]int, numLaps+1) // best[k]: k laps on one fresh tire
              for k := range best {
                  best[k] = inf
              }
              top := 0
              for _, tire := range tires {
                  f, r := tire[0], tire[1]
                  lap, total := f, 0
                  for k := 1; k <= numLaps && lap <= changeTime+f; k++ {
                      total += lap
                      if total < best[k] {
                          best[k] = total
                      }
                      if k > top {
                          top = k
                      }
                      lap *= r
                  }
              }
              dp := make([]int, numLaps+1)
              dp[0] = -changeTime // the first stint needs no change
              for i := 1; i <= numLaps; i++ {
                  dp[i] = inf
                  for k := 1; k <= i && k <= top; k++ {
                      if c := dp[i-k] + changeTime + best[k]; c < dp[i] {
                          dp[i] = c
                      }
                  }
              }
              return dp[numLaps]
          }
        `,
        kotlin: code`
          fun minimumFinishTime(tires: Array<IntArray>, changeTime: Int, numLaps: Int): Int {
              val inf = Long.MAX_VALUE / 4
              val best = LongArray(numLaps + 1) { inf } // best[k]: k laps on one fresh tire
              var top = 0
              for (tire in tires) {
                  val f = tire[0].toLong()
                  val r = tire[1].toLong()
                  var lap = f
                  var total = 0L
                  var k = 1
                  while (k <= numLaps && lap <= changeTime + f) {
                      total += lap
                      if (total < best[k]) best[k] = total
                      if (k > top) top = k
                      lap *= r
                      k++
                  }
              }
              val dp = LongArray(numLaps + 1)
              dp[0] = -changeTime.toLong() // the first stint needs no change
              for (i in 1..numLaps) {
                  dp[i] = inf
                  for (j in 1..minOf(i, top)) dp[i] = minOf(dp[i], dp[i - j] + changeTime + best[j])
              }
              return dp[numLaps].toInt()
          }
        `,
        swift: code`
          func minimumFinishTime(_ tires: [[Int]], _ changeTime: Int, _ numLaps: Int) -> Int {
              let inf = Int.max / 4
              var best = [Int](repeating: inf, count: numLaps + 1) // best[k]: k laps on one fresh tire
              var top = 0
              for tire in tires {
                  let f = tire[0], r = tire[1]
                  var lap = f, total = 0, k = 1
                  while k <= numLaps && lap <= changeTime + f {
                      total += lap
                      best[k] = min(best[k], total)
                      top = max(top, k)
                      lap *= r
                      k += 1
                  }
              }
              var dp = [Int](repeating: inf, count: numLaps + 1)
              dp[0] = -changeTime // the first stint needs no change
              for i in 1...numLaps {
                  for j in 1...min(i, top) {
                      dp[i] = min(dp[i], dp[i - j] + changeTime + best[j])
                  }
              }
              return dp[numLaps]
          }
        `,
        rust: code`
          fn minimumFinishTime(tires: Vec<Vec<i32>>, changeTime: i32, numLaps: i32) -> i32 {
              let laps = numLaps as usize;
              let change = changeTime as i64;
              let inf = std::i64::MAX / 4;
              let mut best = vec![inf; laps + 1]; // best[k]: k laps on one fresh tire
              let mut top = 0usize;
              for tire in tires.iter() {
                  let f = tire[0] as i64;
                  let r = tire[1] as i64;
                  let mut lap = f;
                  let mut total: i64 = 0;
                  let mut k = 1usize;
                  while k <= laps && lap <= change + f {
                      total += lap;
                      if total < best[k] {
                          best[k] = total;
                      }
                      if k > top {
                          top = k;
                      }
                      lap *= r;
                      k += 1;
                  }
              }
              let mut dp = vec![inf; laps + 1];
              dp[0] = -change; // the first stint needs no change
              for i in 1..=laps {
                  for j in 1..=i.min(top) {
                      let cand = dp[i - j] + change + best[j];
                      if cand < dp[i] {
                          dp[i] = cand;
                      }
                  }
              }
              dp[laps] as i32
          }
        `,
        php: code`
          function minimumFinishTime($tires, $changeTime, $numLaps) {
              $inf = PHP_INT_MAX >> 2;
              $best = array_fill(0, $numLaps + 1, $inf); // best[k]: k laps on one fresh tire
              $top = 0;
              foreach ($tires as $tire) {
                  $f = $tire[0];
                  $r = $tire[1];
                  $lap = $f;
                  $total = 0;
                  for ($k = 1; $k <= $numLaps && $lap <= $changeTime + $f; $k++) {
                      $total += $lap;
                      if ($total < $best[$k]) $best[$k] = $total;
                      if ($k > $top) $top = $k;
                      $lap *= $r;
                  }
              }
              $dp = [-$changeTime]; // the first stint needs no change
              for ($i = 1; $i <= $numLaps; $i++) {
                  $cur = $inf;
                  $lim = min($i, $top);
                  for ($j = 1; $j <= $lim; $j++) {
                      $cand = $dp[$i - $j] + $changeTime + $best[$j];
                      if ($cand < $cur) $cur = $cand;
                  }
                  $dp[$i] = $cur;
              }
              return $dp[$numLaps];
          }
        `,
        ruby: code`
          def minimumFinishTime(tires, changeTime, numLaps)
            inf = 1 << 62
            best = Array.new(numLaps + 1, inf) # best[k]: k laps on one fresh tire
            top = 0
            tires.each do |f, r|
              lap = f
              total = 0
              k = 1
              while k <= numLaps && lap <= changeTime + f
                total += lap
                best[k] = total if total < best[k]
                top = k if k > top
                lap *= r
                k += 1
              end
            end
            dp = [-changeTime] # the first stint needs no change
            (1..numLaps).each do |i|
              cur = inf
              (1..[i, top].min).each do |j|
                cand = dp[i - j] + changeTime + best[j]
                cur = cand if cand < cur
              end
              dp << cur
            end
            dp[numLaps]
          end
        `,
      },
    };
  })(),

  // ── Minimum Deletions to Make Array Divisible (LC 2344) ──────────
  (() => {
    const ref = (nums: number[], numsDivide: number[]) => {
      const vals = Array.from(new Set(nums)).sort((a, b) => a - b);
      for (const v of vals) {
        if (numsDivide.every((d) => d % v === 0)) return nums.filter((x) => x < v).length;
      }
      return -1;
    };
    return {
      slug: "minimum-deletions-to-make-array-divisible",
      title: "Minimum Deletions to Make Array Divisible",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Sorting", "Number Theory", "Amazon", "Google"],
      signature: {
        funcName: "minOperations",
        params: [{ name: "nums", type: "int[]" as const }, { name: "numsDivide", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two arrays of positive integers, `nums` and `numsDivide`. You may delete any elements of `nums`.\n\nReturn the **minimum** number of deletions needed so that the **smallest** remaining element of `nums` divides every element of `numsDivide`. If that is impossible, return `-1`.",
        [
          { in: "nums = [4,9,6,4,7], numsDivide = [12,18]", out: "2", note: "Delete both 4s; the smallest remaining element, 6, divides 12 and 18." },
          { in: "nums = [2,3,2,4,3], numsDivide = [9,6,9,3,15]", out: "2", note: "Delete both 2s; 3 divides every value." },
          { in: "nums = [4,3,6], numsDivide = [8,2,6,10]", out: "-1" },
        ],
        ["1 <= nums.length, numsDivide.length <= 10^5", "1 <= nums[i], numsDivide[i] <= 10^9"]),
      hints: [
        "A number divides every element of `numsDivide` exactly when it divides their greatest common divisor.",
        "Compute `g = gcd(numsDivide)` once.",
        "Find the smallest `x` in `nums` with `g % x == 0`; the answer is how many elements of `nums` are smaller than `x` (they all have to go), or `-1` if no such `x`.",
      ],
      editorial: explain({
        idea: "Reduce `numsDivide` to its gcd `g`. The surviving minimum must divide `g`, and to delete as little as possible it should be the smallest element of `nums` that does — everything below it must be deleted, nothing else.",
        steps: [
          "Compute `g`, the gcd of all of `numsDivide`, with Euclid's algorithm.",
          "Find the smallest value `x` in `nums` with `g % x == 0`. If none exists, return `-1`.",
          "Return the number of elements of `nums` strictly smaller than `x`.",
        ],
        why: "`x` divides every element of `numsDivide` if and only if it divides their gcd. After deleting exactly the elements smaller than `x`, `x` is the minimum and works. Any valid outcome keeps some minimum `y` that divides `g`, and `y >= x` by the choice of `x`, so it deletes at least every element below `x` — no fewer deletions are possible.",
        time: "O(n + m log V)",
        space: "O(1)",
        pitfalls: [
          "Count deletions as elements **strictly** smaller than `x`; copies of `x` itself stay.",
          "Divisibility goes `g % x == 0` — the element of `nums` is the divisor.",
          "Sorting `nums` is not needed: one pass finds `x`, a second counts.",
        ],
      }),
      examples: [
        { input: "[4,9,6,4,7]\n[12,18]", expectedOutput: "2" },
        { input: "[2,3,2,4,3]\n[9,6,9,3,15]", expectedOutput: "2" },
        { input: "[4,3,6]\n[8,2,6,10]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 30]));
        const m = ri(rng, 1, pick(rng, [1, 3, 8]));
        const base = pick(rng, [1, 2, 6, 12, 30, 210, ri(rng, 1, 1000)]);
        const mulTop = Math.max(1, Math.floor(pick(rng, [20, 1000, 1000000000]) / base));
        const numsDivide = Array.from({ length: m }, () => base * ri(rng, 1, mulTop));
        const top = pick(rng, [10, 40, 1000000000]);
        const nums = Array.from({ length: n }, () => (rng() < 0.3 ? pick(rng, [1, 2, 3, 5, 6, base]) : ri(rng, 1, top)));
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(numsDivide)}`, expectedOutput: String(ref(nums, numsDivide)) };
      },
      solutions: {
        python: code`
          from typing import List
          from math import gcd
          from functools import reduce

          def minOperations(nums: List[int], numsDivide: List[int]) -> int:
              g = reduce(gcd, numsDivide)
              divisors = [x for x in nums if g % x == 0]
              if not divisors:
                  return -1
              smallest = min(divisors)
              return sum(1 for x in nums if x < smallest)
        `,
        javascript: code`
          var minOperations = function(nums, numsDivide) {
              var g = 0;
              for (var i = 0; i < numsDivide.length; i++) {
                  var a = g, b = numsDivide[i];
                  while (b !== 0) {
                      var t = a % b;
                      a = b;
                      b = t;
                  }
                  g = a;
              }
              var smallest = -1;
              for (var j = 0; j < nums.length; j++) {
                  if (g % nums[j] === 0 && (smallest < 0 || nums[j] < smallest)) smallest = nums[j];
              }
              if (smallest < 0) return -1;
              var deletions = 0;
              for (var k = 0; k < nums.length; k++) if (nums[k] < smallest) deletions++;
              return deletions;
          };
        `,
        typescript: code`
          function minOperations(nums: number[], numsDivide: number[]): number {
              var g = 0;
              for (var i = 0; i < numsDivide.length; i++) {
                  var a = g, b = numsDivide[i];
                  while (b !== 0) {
                      var t = a % b;
                      a = b;
                      b = t;
                  }
                  g = a;
              }
              var smallest = -1;
              for (var j = 0; j < nums.length; j++) {
                  if (g % nums[j] === 0 && (smallest < 0 || nums[j] < smallest)) smallest = nums[j];
              }
              if (smallest < 0) return -1;
              var deletions = 0;
              for (var k = 0; k < nums.length; k++) if (nums[k] < smallest) deletions++;
              return deletions;
          }
        `,
        java: code`
          public static int minOperations(int[] nums, int[] numsDivide) {
              int g = 0;
              for (int d : numsDivide) {
                  int a = g, b = d;
                  while (b != 0) {
                      int t = a % b;
                      a = b;
                      b = t;
                  }
                  g = a;
              }
              int smallest = -1;
              for (int x : nums) if (g % x == 0 && (smallest < 0 || x < smallest)) smallest = x;
              if (smallest < 0) return -1;
              int deletions = 0;
              for (int x : nums) if (x < smallest) deletions++;
              return deletions;
          }
        `,
        cpp: code`
          static int mdGcd(int x, int y) { while (y) { int t = x % y; x = y; y = t; } return x; }

          int minOperations(vector<int>& nums, vector<int>& numsDivide) {
              int g = 0;
              for (int d : numsDivide) g = mdGcd(g, d);
              int smallest = -1;
              for (int x : nums) if (g % x == 0 && (smallest < 0 || x < smallest)) smallest = x;
              if (smallest < 0) return -1;
              int deletions = 0;
              for (int x : nums) if (x < smallest) deletions++;
              return deletions;
          }
        `,
        c: code`
          static int gcdOf(int a, int b) {
              while (b != 0) {
                  int t = a % b;
                  a = b;
                  b = t;
              }
              return a;
          }

          int minOperations(int* nums, int numsSize, int* numsDivide, int numsDivideSize) {
              int g = 0;
              for (int i = 0; i < numsDivideSize; i++) g = gcdOf(g, numsDivide[i]);
              int smallest = -1;
              for (int i = 0; i < numsSize; i++) {
                  if (g % nums[i] == 0 && (smallest < 0 || nums[i] < smallest)) smallest = nums[i];
              }
              if (smallest < 0) return -1;
              int deletions = 0;
              for (int i = 0; i < numsSize; i++) if (nums[i] < smallest) deletions++;
              return deletions;
          }
        `,
        csharp: code`
          public static int MinOperations(int[] nums, int[] numsDivide)
          {
              int g = 0;
              foreach (int d in numsDivide)
              {
                  int a = g, b = d;
                  while (b != 0)
                  {
                      int t = a % b;
                      a = b;
                      b = t;
                  }
                  g = a;
              }
              int smallest = -1;
              foreach (int x in nums) if (g % x == 0 && (smallest < 0 || x < smallest)) smallest = x;
              if (smallest < 0) return -1;
              int deletions = 0;
              foreach (int x in nums) if (x < smallest) deletions++;
              return deletions;
          }
        `,
        go: code`
          func minOperations(nums []int, numsDivide []int) int {
              g := 0
              for _, d := range numsDivide {
                  a, b := g, d
                  for b != 0 {
                      a, b = b, a%b
                  }
                  g = a
              }
              smallest := -1
              for _, x := range nums {
                  if g%x == 0 && (smallest < 0 || x < smallest) {
                      smallest = x
                  }
              }
              if smallest < 0 {
                  return -1
              }
              deletions := 0
              for _, x := range nums {
                  if x < smallest {
                      deletions++
                  }
              }
              return deletions
          }
        `,
        kotlin: code`
          fun minOperations(nums: IntArray, numsDivide: IntArray): Int {
              var g = 0
              for (d in numsDivide) {
                  var a = g
                  var b = d
                  while (b != 0) {
                      val t = a % b
                      a = b
                      b = t
                  }
                  g = a
              }
              var smallest = -1
              for (x in nums) if (g % x == 0 && (smallest < 0 || x < smallest)) smallest = x
              if (smallest < 0) return -1
              return nums.count { it < smallest }
          }
        `,
        swift: code`
          func minOperations(_ nums: [Int], _ numsDivide: [Int]) -> Int {
              var g = 0
              for d in numsDivide {
                  var a = g, b = d
                  while b != 0 { (a, b) = (b, a % b) }
                  g = a
              }
              var smallest = -1
              for x in nums where g % x == 0 && (smallest < 0 || x < smallest) { smallest = x }
              if smallest < 0 { return -1 }
              return nums.filter { $0 < smallest }.count
          }
        `,
        rust: code`
          fn minOperations(nums: Vec<i32>, numsDivide: Vec<i32>) -> i32 {
              let mut g = 0;
              for &d in numsDivide.iter() {
                  let (mut a, mut b) = (g, d);
                  while b != 0 {
                      let t = a % b;
                      a = b;
                      b = t;
                  }
                  g = a;
              }
              let mut smallest = -1;
              for &x in nums.iter() {
                  if g % x == 0 && (smallest < 0 || x < smallest) {
                      smallest = x;
                  }
              }
              if smallest < 0 {
                  return -1;
              }
              nums.iter().filter(|&&x| x < smallest).count() as i32
          }
        `,
        php: code`
          function minOperations($nums, $numsDivide) {
              $g = 0;
              foreach ($numsDivide as $d) {
                  $a = $g;
                  $b = $d;
                  while ($b != 0) {
                      $t = $a % $b;
                      $a = $b;
                      $b = $t;
                  }
                  $g = $a;
              }
              $smallest = -1;
              foreach ($nums as $x) {
                  if ($g % $x == 0 && ($smallest < 0 || $x < $smallest)) $smallest = $x;
              }
              if ($smallest < 0) return -1;
              $deletions = 0;
              foreach ($nums as $x) if ($x < $smallest) $deletions++;
              return $deletions;
          }
        `,
        ruby: code`
          def minOperations(nums, numsDivide)
            g = numsDivide.reduce(0) { |acc, d| acc.gcd(d) }
            smallest = nums.select { |x| g % x == 0 }.min
            return -1 if smallest.nil?
            nums.count { |x| x < smallest }
          end
        `,
      },
    };
  })(),

  // ── Maximum Matching of Players With Trainers (LC 2410) ──────────
  (() => {
    // Kuhn's augmenting-path matching on the explicit bipartite graph.
    const ref = (players: number[], trainers: number[]) => {
      const owner = trainers.map(() => -1);
      const tryPlayer = (p: number, seen: boolean[]): boolean => {
        for (let t = 0; t < trainers.length; t++) {
          if (players[p] > trainers[t] || seen[t]) continue;
          seen[t] = true;
          if (owner[t] < 0 || tryPlayer(owner[t], seen)) { owner[t] = p; return true; }
        }
        return false;
      };
      let matched = 0;
      for (let p = 0; p < players.length; p++) if (tryPlayer(p, trainers.map(() => false))) matched++;
      return matched;
    };
    return {
      slug: "maximum-matching-of-players-with-trainers",
      title: "Maximum Matching of Players With Trainers",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Greedy", "Sorting", "Amazon", "Google"],
      signature: {
        funcName: "matchPlayersAndTrainers",
        params: [{ name: "players", type: "int[]" as const }, { name: "trainers", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "`players[i]` is the ability of player `i` and `trainers[j]` the training capacity of trainer `j`.\n\nPlayer `i` can be matched with trainer `j` when `players[i] <= trainers[j]`. Every player can be matched with at most one trainer, and every trainer with at most one player.\n\nReturn the **maximum** number of matchings.",
        [
          { in: "players = [3,1,6], trainers = [2,6,4,1]", out: "3", note: "1 with 1, 3 with 4, 6 with 6." },
          { in: "players = [4,7,9], trainers = [8,2,5,8]", out: "2" },
          { in: "players = [1,1,1], trainers = [10]", out: "1" },
        ],
        ["1 <= players.length, trainers.length <= 10^5", "1 <= players[i], trainers[j] <= 10^9"]),
      hints: [
        "The weakest player is the easiest to place; the weakest trainer is the most constrained.",
        "Sort both arrays.",
        "Walk them with two pointers: if the current trainer can take the current player, match them and advance both; otherwise this trainer is too weak for everyone left — skip it.",
      ],
      editorial: explain({
        idea: "Give each player, from weakest to strongest, the weakest trainer that can still handle them. Two pointers over the sorted arrays implement it in one pass.",
        steps: [
          "Sort `players` and `trainers` ascending.",
          "Set `i = j = matched = 0`.",
          "While both pointers are in range: if `players[i] <= trainers[j]`, match them (`matched++`, `i++`, `j++`); otherwise `j++`.",
          "Return `matched`.",
        ],
        why: "A trainer too weak for the current (weakest unmatched) player is too weak for every later player, so skipping it loses nothing. When the trainer fits, pairing it with the weakest player is safe by exchange: in any optimal matching, swapping partners so that the weakest player takes the weakest usable trainer keeps every pair valid, because the stronger trainer it frees is at least as capable.",
        time: "O(n log n + m log m)",
        space: "O(1) beyond the sorts",
        pitfalls: [
          "The condition is `player <= trainer`; equality counts as a match.",
          "Advance only the trainer pointer when a trainer is too weak — the player still needs one.",
          "Matching the strongest player first with the strongest trainer also works; mixing directions does not.",
        ],
      }),
      examples: [
        { input: "[3,1,6]\n[2,6,4,1]", expectedOutput: "3" },
        { input: "[4,7,9]\n[8,2,5,8]", expectedOutput: "2" },
        { input: "[1,1,1]\n[10]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 25]));
        const m = ri(rng, 1, pick(rng, [1, 4, 10, 25]));
        const top = pick(rng, [3, 20, 1000000000]);
        const players = Array.from({ length: n }, () => ri(rng, 1, top));
        const trainers = Array.from({ length: m }, () => ri(rng, 1, top));
        return { input: `${fmtIntArr(players)}\n${fmtIntArr(trainers)}`, expectedOutput: String(ref(players, trainers)) };
      },
      solutions: {
        python: code`
          from typing import List

          def matchPlayersAndTrainers(players: List[int], trainers: List[int]) -> int:
              p, t = sorted(players), sorted(trainers)
              i = j = matched = 0
              while i < len(p) and j < len(t):
                  if p[i] <= t[j]:
                      matched += 1
                      i += 1
                  j += 1
              return matched
        `,
        javascript: code`
          var matchPlayersAndTrainers = function(players, trainers) {
              var p = players.slice().sort(function(a, b) { return a - b; });
              var t = trainers.slice().sort(function(a, b) { return a - b; });
              var i = 0, j = 0, matched = 0;
              while (i < p.length && j < t.length) {
                  if (p[i] <= t[j]) {
                      matched++;
                      i++;
                  }
                  j++;
              }
              return matched;
          };
        `,
        typescript: code`
          function matchPlayersAndTrainers(players: number[], trainers: number[]): number {
              var p = players.slice().sort(function(a, b) { return a - b; });
              var t = trainers.slice().sort(function(a, b) { return a - b; });
              var i = 0, j = 0, matched = 0;
              while (i < p.length && j < t.length) {
                  if (p[i] <= t[j]) {
                      matched++;
                      i++;
                  }
                  j++;
              }
              return matched;
          }
        `,
        java: code`
          public static int matchPlayersAndTrainers(int[] players, int[] trainers) {
              int[] p = players.clone(), t = trainers.clone();
              Arrays.sort(p);
              Arrays.sort(t);
              int i = 0, j = 0, matched = 0;
              while (i < p.length && j < t.length) {
                  if (p[i] <= t[j]) {
                      matched++;
                      i++;
                  }
                  j++;
              }
              return matched;
          }
        `,
        cpp: code`
          int matchPlayersAndTrainers(vector<int>& players, vector<int>& trainers) {
              vector<int> p = players, t = trainers;
              sort(p.begin(), p.end());
              sort(t.begin(), t.end());
              size_t i = 0, j = 0;
              int matched = 0;
              while (i < p.size() && j < t.size()) {
                  if (p[i] <= t[j]) {
                      matched++;
                      i++;
                  }
                  j++;
              }
              return matched;
          }
        `,
        c: code`
          static int cmpInt(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          int matchPlayersAndTrainers(int* players, int playersSize, int* trainers, int trainersSize) {
              int* p = (int*) malloc((size_t) playersSize * sizeof(int));
              int* t = (int*) malloc((size_t) trainersSize * sizeof(int));
              memcpy(p, players, (size_t) playersSize * sizeof(int));
              memcpy(t, trainers, (size_t) trainersSize * sizeof(int));
              qsort(p, (size_t) playersSize, sizeof(int), cmpInt);
              qsort(t, (size_t) trainersSize, sizeof(int), cmpInt);
              int i = 0, j = 0, matched = 0;
              while (i < playersSize && j < trainersSize) {
                  if (p[i] <= t[j]) {
                      matched++;
                      i++;
                  }
                  j++;
              }
              free(p);
              free(t);
              return matched;
          }
        `,
        csharp: code`
          public static int MatchPlayersAndTrainers(int[] players, int[] trainers)
          {
              var p = (int[]) players.Clone();
              var t = (int[]) trainers.Clone();
              Array.Sort(p);
              Array.Sort(t);
              int i = 0, j = 0, matched = 0;
              while (i < p.Length && j < t.Length)
              {
                  if (p[i] <= t[j])
                  {
                      matched++;
                      i++;
                  }
                  j++;
              }
              return matched;
          }
        `,
        go: code`
          func matchPlayersAndTrainers(players []int, trainers []int) int {
              p := make([]int, len(players))
              t := make([]int, len(trainers))
              copy(p, players)
              copy(t, trainers)
              sort.Ints(p)
              sort.Ints(t)
              i, j, matched := 0, 0, 0
              for i < len(p) && j < len(t) {
                  if p[i] <= t[j] {
                      matched++
                      i++
                  }
                  j++
              }
              return matched
          }
        `,
        kotlin: code`
          fun matchPlayersAndTrainers(players: IntArray, trainers: IntArray): Int {
              val p = players.sortedArray()
              val t = trainers.sortedArray()
              var i = 0
              var j = 0
              var matched = 0
              while (i < p.size && j < t.size) {
                  if (p[i] <= t[j]) {
                      matched++
                      i++
                  }
                  j++
              }
              return matched
          }
        `,
        swift: code`
          func matchPlayersAndTrainers(_ players: [Int], _ trainers: [Int]) -> Int {
              let p = players.sorted(), t = trainers.sorted()
              var i = 0, j = 0, matched = 0
              while i < p.count && j < t.count {
                  if p[i] <= t[j] {
                      matched += 1
                      i += 1
                  }
                  j += 1
              }
              return matched
          }
        `,
        rust: code`
          fn matchPlayersAndTrainers(players: Vec<i32>, trainers: Vec<i32>) -> i32 {
              let mut p = players.clone();
              let mut t = trainers.clone();
              p.sort();
              t.sort();
              let (mut i, mut j, mut matched) = (0usize, 0usize, 0i32);
              while i < p.len() && j < t.len() {
                  if p[i] <= t[j] {
                      matched += 1;
                      i += 1;
                  }
                  j += 1;
              }
              matched
          }
        `,
        php: code`
          function matchPlayersAndTrainers($players, $trainers) {
              $p = $players;
              $t = $trainers;
              sort($p);
              sort($t);
              $i = 0;
              $j = 0;
              $matched = 0;
              $n = count($p);
              $m = count($t);
              while ($i < $n && $j < $m) {
                  if ($p[$i] <= $t[$j]) {
                      $matched++;
                      $i++;
                  }
                  $j++;
              }
              return $matched;
          }
        `,
        ruby: code`
          def matchPlayersAndTrainers(players, trainers)
            p = players.sort
            t = trainers.sort
            i = 0
            j = 0
            matched = 0
            while i < p.length && j < t.length
              if p[i] <= t[j]
                matched += 1
                i += 1
              end
              j += 1
            end
            matched
          end
        `,
      },
    };
  })(),

];
