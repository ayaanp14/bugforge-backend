/**
 * Dynamic programming classics — wave 7, batch 01.
 * Real problems only: LeetCode numbered problems and the GeeksforGeeks DP
 * canon interviewers keep asking (0/1 knapsack, rod cutting, matrix chain
 * multiplication, boolean parenthesization, word wrap …). Worked examples are
 * phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Every answer fits a signed 32-bit int. Where the GeeksforGeeks original
 * leaves that to luck (matrix chain multiplication with dimensions up to 500)
 * the stated constraints are tightened so it provably does; where the original
 * counts modulo something (perfect sum and tiling modulo 1e9+7, boolean
 * parenthesization modulo 1003, k inverse pairs) the modulus is kept. Typed
 * languages still carry 64-bit intermediates wherever a sum of two residues or
 * a product could pass 2^31.
 *
 * The hidden suites are generated small (arrays of a few dozen, strings of a
 * couple of dozen characters, Can I Win capped at ten numbers) so that 5,000
 * cases run inside the judge's time budget in Python, Ruby and PHP too; the
 * constraints in each statement are the real problem's.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, pick, randLower, ri,
  type CatalogProblem, type Rng,
} from "./types.js";

export const DP8_PROBLEMS: CatalogProblem[] = [

  // ── Lexicographical Numbers (LC 386) ─────────────────────────────
  (() => {
    const ref = (n: number) => {
      const a: number[] = [];
      for (let i = 1; i <= n; i++) a.push(i);
      return a.sort((x, y) => (String(x) < String(y) ? -1 : String(x) > String(y) ? 1 : 0));
    };
    return {
      slug: "lexicographical-numbers",
      title: "Lexicographical Numbers",
      difficulty: "MEDIUM" as const,
      tags: ["Depth-First Search", "Trie", "Bloomberg", "Amazon", "Google"],
      signature: { funcName: "lexicalOrder", params: [{ name: "n", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer `n`, return every integer from `1` to `n` (inclusive) arranged in **lexicographical order** — the order a dictionary would list them if each number were written out as a string of digits.\n\nSo `10` comes before `2` (the string \"10\" starts with \"1\"), and `1` comes before `10` (a prefix sorts first).\n\nYour algorithm should run in `O(n)` time and use `O(1)` extra space beyond the output.",
        [
          { in: "n = 13", out: "[1,10,11,12,13,2,3,4,5,6,7,8,9]", note: "Every number that starts with the digit 1 comes before 2." },
          { in: "n = 2", out: "[1,2]" },
          { in: "n = 1", out: "[1]" },
        ],
        ["1 <= n <= 5 * 10^4"]),
      hints: [
        "Picture the numbers as a tree: the children of `x` are `10x, 10x + 1, …, 10x + 9`. Lexicographic order is a pre-order walk of that tree.",
        "You don't need recursion or a stack — from the current number you can compute the next one directly.",
        "Go down (`x * 10`) when that is still `<= n`. Otherwise step to the next sibling `x + 1`, but first climb up (`x / 10`) while `x` ends in `9` or `x + 1 > n`.",
      ],
      editorial: explain({
        idea: "Lexicographic order on decimal strings is exactly a pre-order traversal of the 10-ary tree whose root's children are `1…9` and where `x` has children `10x … 10x + 9`. The successor of any node in that walk can be computed in amortised constant time, so the whole list is produced without sorting.",
        steps: [
          "Start with `cur = 1` and repeat `n` times: append `cur` to the answer.",
          "If `cur * 10 <= n`, the next number is its first child `cur * 10`.",
          "Otherwise, while `cur` ends in `9` or `cur + 1 > n`, climb to the parent `cur / 10` (integer division).",
          "Then move to the next sibling: `cur += 1`.",
        ],
        why: "In a pre-order walk the node after `x` is its first child if it has one; if not, it is the next sibling of the nearest ancestor (including `x` itself) that still has a next sibling inside `1…n`. A node ending in `9` is a last child, and `x + 1 > n` means the sibling is out of range — in both cases we climb. Each climb undoes an earlier descent, so the total work is `O(n)`.",
        time: "O(n)",
        space: "O(1) besides the output",
        pitfalls: [
          "Sorting the numbers as strings works but costs `O(n log n)` and allocates a string per number.",
          "Climbing must also happen when `cur + 1 > n`, not only when `cur` ends in `9` — e.g. after `13` with `n = 13` the next number is `2`.",
          "`cur * 10` stays far below 2^31 because `cur <= n <= 5 * 10^4`.",
        ],
      }),
      examples: [
        { input: "13", expectedOutput: "[1,10,11,12,13,2,3,4,5,6,7,8,9]" },
        { input: "2", expectedOutput: "[1,2]" },
        { input: "1", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 9, 12, 30, 120, 300, 1000]));
        return { input: String(n), expectedOutput: fmtIntArr(ref(n)) };
      },
      solutions: {
        python: code`
          from typing import List

          def lexicalOrder(n: int) -> List[int]:
              out = []
              cur = 1
              for _ in range(n):
                  out.append(cur)
                  if cur * 10 <= n:
                      cur *= 10
                  else:
                      while cur % 10 == 9 or cur + 1 > n:
                          cur //= 10
                      cur += 1
              return out
        `,
        javascript: code`
          var lexicalOrder = function(n) {
              var out = [];
              var cur = 1;
              for (var i = 0; i < n; i++) {
                  out.push(cur);
                  if (cur * 10 <= n) {
                      cur *= 10;
                  } else {
                      while (cur % 10 === 9 || cur + 1 > n) cur = Math.floor(cur / 10);
                      cur += 1;
                  }
              }
              return out;
          };
        `,
        typescript: code`
          function lexicalOrder(n: number): number[] {
              var out: number[] = [];
              var cur = 1;
              for (var i = 0; i < n; i++) {
                  out.push(cur);
                  if (cur * 10 <= n) {
                      cur *= 10;
                  } else {
                      while (cur % 10 === 9 || cur + 1 > n) cur = Math.floor(cur / 10);
                      cur += 1;
                  }
              }
              return out;
          }
        `,
        java: code`
          public static int[] lexicalOrder(int n) {
              int[] out = new int[n];
              int cur = 1;
              for (int i = 0; i < n; i++) {
                  out[i] = cur;
                  if (cur * 10 <= n) {
                      cur *= 10;
                  } else {
                      while (cur % 10 == 9 || cur + 1 > n) cur /= 10;
                      cur += 1;
                  }
              }
              return out;
          }
        `,
        cpp: code`
          vector<int> lexicalOrder(int n) {
              vector<int> out;
              out.reserve(n);
              int cur = 1;
              for (int i = 0; i < n; i++) {
                  out.push_back(cur);
                  if (cur * 10 <= n) {
                      cur *= 10;
                  } else {
                      while (cur % 10 == 9 || cur + 1 > n) cur /= 10;
                      cur += 1;
                  }
              }
              return out;
          }
        `,
        c: code`
          int* lexicalOrder(int n, int* returnSize) {
              int* out = (int*) malloc((size_t) n * sizeof(int));
              int cur = 1;
              for (int i = 0; i < n; i++) {
                  out[i] = cur;
                  if (cur * 10 <= n) {
                      cur *= 10;
                  } else {
                      while (cur % 10 == 9 || cur + 1 > n) cur /= 10;
                      cur += 1;
                  }
              }
              *returnSize = n;
              return out;
          }
        `,
        csharp: code`
          public static int[] LexicalOrder(int n)
          {
              int[] order = new int[n];
              int cur = 1;
              for (int i = 0; i < n; i++)
              {
                  order[i] = cur;
                  if (cur * 10 <= n)
                  {
                      cur *= 10;
                  }
                  else
                  {
                      while (cur % 10 == 9 || cur + 1 > n) cur /= 10;
                      cur += 1;
                  }
              }
              return order;
          }
        `,
        go: code`
          func lexicalOrder(n int) []int {
              out := make([]int, 0, n)
              cur := 1
              for i := 0; i < n; i++ {
                  out = append(out, cur)
                  if cur*10 <= n {
                      cur *= 10
                  } else {
                      for cur%10 == 9 || cur+1 > n {
                          cur /= 10
                      }
                      cur++
                  }
              }
              return out
          }
        `,
        kotlin: code`
          fun lexicalOrder(n: Int): IntArray {
              val out = IntArray(n)
              var cur = 1
              for (i in 0 until n) {
                  out[i] = cur
                  if (cur * 10 <= n) {
                      cur *= 10
                  } else {
                      while (cur % 10 == 9 || cur + 1 > n) cur /= 10
                      cur += 1
                  }
              }
              return out
          }
        `,
        swift: code`
          func lexicalOrder(_ n: Int) -> [Int] {
              var out = [Int]()
              out.reserveCapacity(n)
              var cur = 1
              for _ in 0..<n {
                  out.append(cur)
                  if cur * 10 <= n {
                      cur *= 10
                  } else {
                      while cur % 10 == 9 || cur + 1 > n { cur /= 10 }
                      cur += 1
                  }
              }
              return out
          }
        `,
        rust: code`
          fn lexicalOrder(n: i32) -> Vec<i32> {
              let mut out = Vec::with_capacity(n as usize);
              let mut cur = 1;
              for _ in 0..n {
                  out.push(cur);
                  if cur * 10 <= n {
                      cur *= 10;
                  } else {
                      while cur % 10 == 9 || cur + 1 > n {
                          cur /= 10;
                      }
                      cur += 1;
                  }
              }
              out
          }
        `,
        php: code`
          function lexicalOrder($n) {
              $out = [];
              $cur = 1;
              for ($i = 0; $i < $n; $i++) {
                  $out[] = $cur;
                  if ($cur * 10 <= $n) {
                      $cur *= 10;
                  } else {
                      while ($cur % 10 == 9 || $cur + 1 > $n) $cur = intdiv($cur, 10);
                      $cur += 1;
                  }
              }
              return $out;
          }
        `,
        ruby: code`
          def lexicalOrder(n)
            out = []
            cur = 1
            n.times do
              out << cur
              if cur * 10 <= n
                cur *= 10
              else
                cur /= 10 while cur % 10 == 9 || cur + 1 > n
                cur += 1
              end
            end
            out
          end
        `,
      },
    };
  })(),

  // ── 0/1 Knapsack (GFG) ───────────────────────────────────────────
  (() => {
    const ref = (capacity: number, values: number[], weights: number[]) => {
      const n = values.length;
      const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));
      for (let i = 1; i <= n; i++) {
        for (let c = 0; c <= capacity; c++) {
          dp[i][c] = dp[i - 1][c];
          if (weights[i - 1] <= c) dp[i][c] = Math.max(dp[i][c], dp[i - 1][c - weights[i - 1]] + values[i - 1]);
        }
      }
      return dp[n][capacity];
    };
    return {
      slug: "zero-one-knapsack",
      title: "0/1 Knapsack",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Microsoft", "Flipkart", "Morgan Stanley"],
      signature: {
        funcName: "knapsack",
        params: [{ name: "capacity", type: "int" as const }, { name: "values", type: "int[]" as const }, { name: "weights", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You have a knapsack that can carry a total weight of at most `capacity`, and `n` items. Item `i` is worth `values[i]` and weighs `weights[i]`.\n\nEach item is either taken whole or left behind — you cannot take a fraction of an item, and you cannot take the same item twice (hence *0/1*).\n\nReturn the **maximum total value** of a selection of items whose total weight does not exceed `capacity`. If no item fits, the answer is `0`.",
        [
          { in: "capacity = 4, values = [1,2,3], weights = [4,5,1]", out: "3", note: "Item 1 (weight 5) never fits, and items 0 and 2 together weigh 5. The best single choice is item 2, worth 3." },
          { in: "capacity = 50, values = [60,100,120], weights = [10,20,30]", out: "220", note: "Take the items weighing 20 and 30: total weight 50, total value 100 + 120." },
          { in: "capacity = 3, values = [1,2,3], weights = [4,5,6]", out: "0", note: "Every item is heavier than the knapsack." },
        ],
        ["1 <= n <= 1000", "values.length == weights.length == n", "1 <= capacity <= 1000", "1 <= values[i], weights[i] <= 1000"]),
      hints: [
        "Greedy by value, by weight or by value-per-weight all fail on small examples — this needs dynamic programming.",
        "Let `best[c]` be the most value achievable with total weight at most `c` using the items considered so far. How does adding one more item change it?",
        "With one 1-D array, process capacities from `capacity` down to the item's weight: `best[c] = max(best[c], best[c - w] + v)`. Going downwards keeps each item from being used twice.",
      ],
      editorial: explain({
        idea: "Decide the items one at a time. After the first `i` items, `best[c]` is the largest value packable into weight `c`; item `i` either stays out (value unchanged) or goes in on top of the best packing of the remaining `c - w` capacity.",
        steps: [
          "Create `best[0..capacity]` filled with `0`.",
          "For each item `(v, w)`, loop `c` from `capacity` down to `w` and set `best[c] = max(best[c], best[c - w] + v)`.",
          "Return `best[capacity]`.",
        ],
        why: "Any optimal packing for capacity `c` among the first `i` items either excludes item `i` — then it is an optimal packing of the first `i - 1` items — or includes it, and then the rest is an optimal packing of the first `i - 1` items into `c - w`. Iterating `c` downward means `best[c - w]` still holds the value from *before* item `i` was considered, which is exactly that sub-problem, so no item is counted twice.",
        time: "O(n * capacity)",
        space: "O(capacity)",
        pitfalls: [
          "Looping `c` upward turns this into the unbounded knapsack (an item could be reused).",
          "Value-per-weight greedy is only correct for the *fractional* knapsack.",
          "The array must start at `0` for every capacity, not at `-infinity` — the knapsack need not be full.",
        ],
      }),
      examples: [
        { input: "4\n[1,2,3]\n[4,5,1]", expectedOutput: "3" },
        { input: "50\n[60,100,120]\n[10,20,30]", expectedOutput: "220" },
        { input: "3\n[1,2,3]\n[4,5,6]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 8, 15, 25]));
        const capacity = ri(rng, 1, pick(rng, [5, 30, 120, 300]));
        const wTop = pick(rng, [5, 30, 100, 1000]);
        const vTop = pick(rng, [1, 10, 1000]);
        const values = Array.from({ length: n }, () => ri(rng, 1, vTop));
        const weights = Array.from({ length: n }, () => ri(rng, 1, wTop));
        return { input: `${capacity}\n${fmtIntArr(values)}\n${fmtIntArr(weights)}`, expectedOutput: String(ref(capacity, values, weights)) };
      },
      solutions: {
        python: code`
          from typing import List

          def knapsack(capacity: int, values: List[int], weights: List[int]) -> int:
              best = [0] * (capacity + 1)
              for v, w in zip(values, weights):
                  for c in range(capacity, w - 1, -1):
                      cand = best[c - w] + v
                      if cand > best[c]:
                          best[c] = cand
              return best[capacity]
        `,
        javascript: code`
          var knapsack = function(capacity, values, weights) {
              var best = new Array(capacity + 1).fill(0);
              for (var i = 0; i < values.length; i++) {
                  var v = values[i], w = weights[i];
                  for (var c = capacity; c >= w; c--) {
                      if (best[c - w] + v > best[c]) best[c] = best[c - w] + v;
                  }
              }
              return best[capacity];
          };
        `,
        typescript: code`
          function knapsack(capacity: number, values: number[], weights: number[]): number {
              var best: number[] = [];
              for (var c0 = 0; c0 <= capacity; c0++) best.push(0);
              for (var i = 0; i < values.length; i++) {
                  var v = values[i], w = weights[i];
                  for (var c = capacity; c >= w; c--) {
                      if (best[c - w] + v > best[c]) best[c] = best[c - w] + v;
                  }
              }
              return best[capacity];
          }
        `,
        java: code`
          public static int knapsack(int capacity, int[] values, int[] weights) {
              int[] best = new int[capacity + 1];
              for (int i = 0; i < values.length; i++) {
                  int v = values[i], w = weights[i];
                  for (int c = capacity; c >= w; c--) {
                      best[c] = Math.max(best[c], best[c - w] + v);
                  }
              }
              return best[capacity];
          }
        `,
        cpp: code`
          int knapsack(int capacity, vector<int>& values, vector<int>& weights) {
              vector<int> best(capacity + 1, 0);
              for (size_t i = 0; i < values.size(); i++) {
                  int v = values[i], w = weights[i];
                  for (int c = capacity; c >= w; c--) best[c] = max(best[c], best[c - w] + v);
              }
              return best[capacity];
          }
        `,
        c: code`
          int knapsack(int capacity, int* values, int valuesSize, int* weights, int weightsSize) {
              int* best = (int*) calloc((size_t) (capacity + 1), sizeof(int));
              for (int i = 0; i < valuesSize; i++) {
                  int v = values[i], w = weights[i];
                  for (int c = capacity; c >= w; c--) {
                      if (best[c - w] + v > best[c]) best[c] = best[c - w] + v;
                  }
              }
              int ans = best[capacity];
              free(best);
              return ans;
          }
        `,
        csharp: code`
          public static int Knapsack(int capacity, int[] values, int[] weights)
          {
              int[] best = new int[capacity + 1];
              for (int i = 0; i < values.Length; i++)
              {
                  int v = values[i], w = weights[i];
                  for (int c = capacity; c >= w; c--) best[c] = Math.Max(best[c], best[c - w] + v);
              }
              return best[capacity];
          }
        `,
        go: code`
          func knapsack(capacity int, values []int, weights []int) int {
              best := make([]int, capacity+1)
              for i := range values {
                  v, w := values[i], weights[i]
                  for c := capacity; c >= w; c-- {
                      if best[c-w]+v > best[c] {
                          best[c] = best[c-w] + v
                      }
                  }
              }
              return best[capacity]
          }
        `,
        kotlin: code`
          fun knapsack(capacity: Int, values: IntArray, weights: IntArray): Int {
              val best = IntArray(capacity + 1)
              for (i in values.indices) {
                  val v = values[i]
                  val w = weights[i]
                  for (c in capacity downTo w) best[c] = maxOf(best[c], best[c - w] + v)
              }
              return best[capacity]
          }
        `,
        swift: code`
          func knapsack(_ capacity: Int, _ values: [Int], _ weights: [Int]) -> Int {
              var best = [Int](repeating: 0, count: capacity + 1)
              for i in 0..<values.count {
                  let v = values[i], w = weights[i]
                  var c = capacity
                  while c >= w {
                      best[c] = max(best[c], best[c - w] + v)
                      c -= 1
                  }
              }
              return best[capacity]
          }
        `,
        rust: code`
          fn knapsack(capacity: i32, values: Vec<i32>, weights: Vec<i32>) -> i32 {
              let cap = capacity as usize;
              let mut best = vec![0i32; cap + 1];
              for i in 0..values.len() {
                  let v = values[i];
                  let w = weights[i] as usize;
                  if w > cap {
                      continue;
                  }
                  for c in (w..=cap).rev() {
                      best[c] = best[c].max(best[c - w] + v);
                  }
              }
              best[cap]
          }
        `,
        php: code`
          function knapsack($capacity, $values, $weights) {
              $best = array_fill(0, $capacity + 1, 0);
              $n = count($values);
              for ($i = 0; $i < $n; $i++) {
                  $v = $values[$i];
                  $w = $weights[$i];
                  for ($c = $capacity; $c >= $w; $c--) {
                      if ($best[$c - $w] + $v > $best[$c]) $best[$c] = $best[$c - $w] + $v;
                  }
              }
              return $best[$capacity];
          }
        `,
        ruby: code`
          def knapsack(capacity, values, weights)
            best = Array.new(capacity + 1, 0)
            values.each_with_index do |v, i|
              w = weights[i]
              c = capacity
              while c >= w
                cand = best[c - w] + v
                best[c] = cand if cand > best[c]
                c -= 1
              end
            end
            best[capacity]
          end
        `,
      },
    };
  })(),

  // ── Rod Cutting (GFG) ────────────────────────────────────────────
  (() => {
    const ref = (price: number[]) => {
      const n = price.length;
      const memo = new Map<number, number>();
      const go = (len: number): number => {
        if (len === 0) return 0;
        if (memo.has(len)) return memo.get(len)!;
        let b = 0;
        for (let i = 1; i <= len; i++) b = Math.max(b, price[i - 1] + go(len - i));
        memo.set(len, b);
        return b;
      };
      return go(n);
    };
    return {
      slug: "rod-cutting",
      title: "Rod Cutting",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Microsoft", "Google"],
      signature: { funcName: "cutRod", params: [{ name: "price", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You have a rod of length `n`, where `n` is the length of the array `price`. A piece of length `i` (for `1 <= i <= n`) sells for `price[i - 1]`.\n\nYou may cut the rod into any number of pieces of whole-number lengths (or not cut it at all) and sell every piece. Pieces of the same length may be sold as many times as you produce them.\n\nReturn the **maximum** total amount you can earn.",
        [
          { in: "price = [1,5,8,9,10,17,17,20]", out: "22", note: "Cut the rod of length 8 into pieces of length 2 and 6: 5 + 17 = 22." },
          { in: "price = [3,5,8,9,10,17,17,20]", out: "24", note: "Eight pieces of length 1 earn 8 * 3 = 24." },
          { in: "price = [7]", out: "7", note: "A rod of length 1 can only be sold whole." },
        ],
        ["1 <= n == price.length <= 1000", "1 <= price[i] <= 10^5"]),
      hints: [
        "Think about the length of the *first* piece you cut off. Whatever is left is a smaller rod with the same price list.",
        "Let `best[len]` be the most a rod of length `len` can earn. Then `best[len] = max over i of price[i - 1] + best[len - i]`.",
        "Fill `best` for `len = 1, 2, …, n` in order; `best[0] = 0`. This is the unbounded knapsack with lengths as weights.",
      ],
      editorial: explain({
        idea: "Every way of cutting a rod starts with some first piece of length `i`; the rest is an independent rod of length `len - i` that should itself be cut optimally. That gives a one-dimensional recurrence over the rod length.",
        steps: [
          "Set `best[0] = 0`.",
          "For `len` from 1 to `n`: `best[len] = max(price[i - 1] + best[len - i])` over `i = 1 … len`.",
          "Return `best[n]`.",
        ],
        why: "Fix an optimal cutting of length `len` and let its first piece have length `i`. The remaining pieces form a cutting of length `len - i`; if a better cutting of that remainder existed, swapping it in would beat the optimum. So the optimum equals `price[i - 1] + best[len - i]` for some `i`, and taking the maximum over all `i` finds it.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "`price[i - 1]` is the price of length `i` — the array is 0-indexed, lengths are 1-indexed.",
          "Selling the rod uncut is the case `i = len`, with `best[0] = 0`.",
          "The answer is at most `n * max(price) = 10^8`, so 32-bit integers suffice.",
        ],
      }),
      examples: [
        { input: "[1,5,8,9,10,17,17,20]", expectedOutput: "22" },
        { input: "[3,5,8,9,10,17,17,20]", expectedOutput: "24" },
        { input: "[7]", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 25, 40]));
        const mode = ri(rng, 0, 2);
        const top = pick(rng, [10, 100000]);
        const price: number[] = [];
        for (let i = 1; i <= n; i++) {
          if (mode === 0) price.push(ri(rng, 1, top));
          else if (mode === 1) price.push(Math.min(100000, i * ri(rng, 1, 5) + ri(rng, 0, 6)));
          else price.push(ri(rng, 1, 3 * i));
        }
        return { input: fmtIntArr(price), expectedOutput: String(ref(price)) };
      },
      solutions: {
        python: code`
          from typing import List

          def cutRod(price: List[int]) -> int:
              n = len(price)
              best = [0] * (n + 1)
              for length in range(1, n + 1):
                  top = 0
                  for i in range(1, length + 1):
                      cand = price[i - 1] + best[length - i]
                      if cand > top:
                          top = cand
                  best[length] = top
              return best[n]
        `,
        javascript: code`
          var cutRod = function(price) {
              var n = price.length;
              var best = new Array(n + 1).fill(0);
              for (var len = 1; len <= n; len++) {
                  var top = 0;
                  for (var i = 1; i <= len; i++) {
                      if (price[i - 1] + best[len - i] > top) top = price[i - 1] + best[len - i];
                  }
                  best[len] = top;
              }
              return best[n];
          };
        `,
        typescript: code`
          function cutRod(price: number[]): number {
              var n = price.length;
              var best: number[] = [0];
              for (var len = 1; len <= n; len++) {
                  var top = 0;
                  for (var i = 1; i <= len; i++) {
                      if (price[i - 1] + best[len - i] > top) top = price[i - 1] + best[len - i];
                  }
                  best.push(top);
              }
              return best[n];
          }
        `,
        java: code`
          public static int cutRod(int[] price) {
              int n = price.length;
              int[] best = new int[n + 1];
              for (int len = 1; len <= n; len++) {
                  int top = 0;
                  for (int i = 1; i <= len; i++) top = Math.max(top, price[i - 1] + best[len - i]);
                  best[len] = top;
              }
              return best[n];
          }
        `,
        cpp: code`
          int cutRod(vector<int>& price) {
              int n = price.size();
              vector<int> best(n + 1, 0);
              for (int len = 1; len <= n; len++) {
                  int top = 0;
                  for (int i = 1; i <= len; i++) top = max(top, price[i - 1] + best[len - i]);
                  best[len] = top;
              }
              return best[n];
          }
        `,
        c: code`
          int cutRod(int* price, int priceSize) {
              int n = priceSize;
              int* best = (int*) calloc((size_t) (n + 1), sizeof(int));
              for (int len = 1; len <= n; len++) {
                  int top = 0;
                  for (int i = 1; i <= len; i++) {
                      int cand = price[i - 1] + best[len - i];
                      if (cand > top) top = cand;
                  }
                  best[len] = top;
              }
              int ans = best[n];
              free(best);
              return ans;
          }
        `,
        csharp: code`
          public static int CutRod(int[] price)
          {
              int n = price.Length;
              int[] best = new int[n + 1];
              for (int len = 1; len <= n; len++)
              {
                  int top = 0;
                  for (int i = 1; i <= len; i++) top = Math.Max(top, price[i - 1] + best[len - i]);
                  best[len] = top;
              }
              return best[n];
          }
        `,
        go: code`
          func cutRod(price []int) int {
              n := len(price)
              best := make([]int, n+1)
              for length := 1; length <= n; length++ {
                  top := 0
                  for i := 1; i <= length; i++ {
                      if price[i-1]+best[length-i] > top {
                          top = price[i-1] + best[length-i]
                      }
                  }
                  best[length] = top
              }
              return best[n]
          }
        `,
        kotlin: code`
          fun cutRod(price: IntArray): Int {
              val n = price.size
              val best = IntArray(n + 1)
              for (len in 1..n) {
                  var top = 0
                  for (i in 1..len) top = maxOf(top, price[i - 1] + best[len - i])
                  best[len] = top
              }
              return best[n]
          }
        `,
        swift: code`
          func cutRod(_ price: [Int]) -> Int {
              let n = price.count
              var best = [Int](repeating: 0, count: n + 1)
              for len in stride(from: 1, through: n, by: 1) {
                  var top = 0
                  for i in 1...len { top = max(top, price[i - 1] + best[len - i]) }
                  best[len] = top
              }
              return best[n]
          }
        `,
        rust: code`
          fn cutRod(price: Vec<i32>) -> i32 {
              let n = price.len();
              let mut best = vec![0i32; n + 1];
              for len in 1..=n {
                  let mut top = 0;
                  for i in 1..=len {
                      top = top.max(price[i - 1] + best[len - i]);
                  }
                  best[len] = top;
              }
              best[n]
          }
        `,
        php: code`
          function cutRod($price) {
              $n = count($price);
              $best = array_fill(0, $n + 1, 0);
              for ($len = 1; $len <= $n; $len++) {
                  $top = 0;
                  for ($i = 1; $i <= $len; $i++) {
                      $cand = $price[$i - 1] + $best[$len - $i];
                      if ($cand > $top) $top = $cand;
                  }
                  $best[$len] = $top;
              }
              return $best[$n];
          }
        `,
        ruby: code`
          def cutRod(price)
            n = price.length
            best = Array.new(n + 1, 0)
            (1..n).each do |len|
              top = 0
              (1..len).each do |i|
                cand = price[i - 1] + best[len - i]
                top = cand if cand > top
              end
              best[len] = top
            end
            best[n]
          end
        `,
      },
    };
  })(),

  // ── Matrix Chain Multiplication (GFG) ────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const m = arr.length - 1;
      const memo = new Map<number, number>();
      const go = (i: number, j: number): number => {
        if (i === j) return 0;
        const key = i * 1000 + j;
        if (memo.has(key)) return memo.get(key)!;
        let b = Infinity;
        for (let k = i; k < j; k++) b = Math.min(b, go(i, k) + go(k + 1, j) + arr[i] * arr[k + 1] * arr[j + 1]);
        memo.set(key, b);
        return b;
      };
      return go(0, m - 1);
    };
    return {
      slug: "matrix-chain-multiplication",
      title: "Matrix Chain Multiplication",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Microsoft", "Flipkart", "Google"],
      signature: { funcName: "matrixMultiplication", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `arr` of length `n` describing a chain of `n - 1` matrices: matrix `i` (0-indexed) has `arr[i]` rows and `arr[i + 1]` columns, so neighbouring matrices can always be multiplied.\n\nMultiplying a `p x q` matrix by a `q x r` matrix costs `p * q * r` scalar multiplications. Matrix multiplication is associative, so the product of the whole chain is the same however it is parenthesised — but the **cost** is not.\n\nReturn the **minimum** number of scalar multiplications needed to compute the product of the whole chain. A chain of a single matrix costs `0`.",
        [
          { in: "arr = [40,20,30,10,30]", out: "26000", note: "Four matrices A (40x20), B (20x30), C (30x10), D (10x30). The order (A(BC))D costs 20*30*10 + 40*20*10 + 40*10*30 = 6000 + 8000 + 12000 = 26000, the cheapest." },
          { in: "arr = [10,20,30]", out: "6000", note: "Two matrices, one way to multiply them: 10 * 20 * 30." },
          { in: "arr = [5,7]", out: "0", note: "A single matrix needs no multiplication." },
        ],
        ["2 <= arr.length <= 100", "1 <= arr[i] <= 100 (so the answer fits in a 32-bit integer)"]),
      hints: [
        "The last multiplication performed splits the chain into a left part and a right part, each computed on its own first.",
        "Let `cost[i][j]` be the cheapest way to multiply matrices `i..j`. Try every split point `k` between them.",
        "`cost[i][j] = min over k of cost[i][k] + cost[k+1][j] + arr[i] * arr[k+1] * arr[j+1]`. Fill it by increasing chain length so both halves are ready.",
      ],
      editorial: explain({
        idea: "Whatever the parenthesisation, there is one final multiplication that joins the product of matrices `i..k` with the product of `k+1..j`. Its cost depends only on the outer dimensions `arr[i] * arr[k+1] * arr[j+1]`, and the two halves are independent sub-problems — classic interval DP.",
        steps: [
          "Let `m = n - 1` be the number of matrices and `cost[i][i] = 0`.",
          "For chain lengths `len = 2 … m`, for every start `i` with `j = i + len - 1`, set `cost[i][j]` to the minimum over `k = i … j - 1` of `cost[i][k] + cost[k + 1][j] + arr[i] * arr[k + 1] * arr[j + 1]`.",
          "Return `cost[0][m - 1]`.",
        ],
        why: "An optimal order for `i..j` has some last split `k`, and the orders it uses inside each half must themselves be optimal (otherwise replacing one would lower the total). The product of matrices `i..k` is an `arr[i] x arr[k+1]` matrix and that of `k+1..j` is `arr[k+1] x arr[j+1]`, so the final step costs `arr[i] * arr[k+1] * arr[j+1]`. Every shorter interval is filled before a longer one needs it.",
        time: "O(n^3)",
        space: "O(n^2)",
        pitfalls: [
          "`arr` has one more entry than there are matrices — matrix `i` is `arr[i] x arr[i+1]`.",
          "Filling the table row by row from the top uses intervals that are not ready yet; iterate by length (or `i` downward).",
          "With dimensions up to 100 the cost stays below `98 * 100^3`, well inside 32 bits; the original problem's limit of 500 could overflow.",
        ],
      }),
      examples: [
        { input: "[40,20,30,10,30]", expectedOutput: "26000" },
        { input: "[10,20,30]", expectedOutput: "6000" },
        { input: "[5,7]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 4, 8, 14, 20]));
        const top = pick(rng, [1, 5, 30, 100]);
        const arr = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def matrixMultiplication(arr: List[int]) -> int:
              m = len(arr) - 1
              cost = [[0] * m for _ in range(m)]
              for length in range(2, m + 1):
                  for i in range(0, m - length + 1):
                      j = i + length - 1
                      best = None
                      for k in range(i, j):
                          cand = cost[i][k] + cost[k + 1][j] + arr[i] * arr[k + 1] * arr[j + 1]
                          if best is None or cand < best:
                              best = cand
                      cost[i][j] = best
              return cost[0][m - 1]
        `,
        javascript: code`
          var matrixMultiplication = function(arr) {
              var m = arr.length - 1;
              var cost = [];
              for (var r = 0; r < m; r++) cost.push(new Array(m).fill(0));
              for (var len = 2; len <= m; len++) {
                  for (var i = 0; i + len - 1 < m; i++) {
                      var j = i + len - 1;
                      var best = Infinity;
                      for (var k = i; k < j; k++) {
                          var cand = cost[i][k] + cost[k + 1][j] + arr[i] * arr[k + 1] * arr[j + 1];
                          if (cand < best) best = cand;
                      }
                      cost[i][j] = best;
                  }
              }
              return cost[0][m - 1];
          };
        `,
        typescript: code`
          function matrixMultiplication(arr: number[]): number {
              var m = arr.length - 1;
              var cost: number[][] = [];
              for (var r = 0; r < m; r++) {
                  var row: number[] = [];
                  for (var c = 0; c < m; c++) row.push(0);
                  cost.push(row);
              }
              for (var len = 2; len <= m; len++) {
                  for (var i = 0; i + len - 1 < m; i++) {
                      var j = i + len - 1;
                      var best = Infinity;
                      for (var k = i; k < j; k++) {
                          var cand = cost[i][k] + cost[k + 1][j] + arr[i] * arr[k + 1] * arr[j + 1];
                          if (cand < best) best = cand;
                      }
                      cost[i][j] = best;
                  }
              }
              return cost[0][m - 1];
          }
        `,
        java: code`
          public static int matrixMultiplication(int[] arr) {
              int m = arr.length - 1;
              int[][] cost = new int[m][m];
              for (int len = 2; len <= m; len++) {
                  for (int i = 0; i + len - 1 < m; i++) {
                      int j = i + len - 1;
                      int best = Integer.MAX_VALUE;
                      for (int k = i; k < j; k++) {
                          int cand = cost[i][k] + cost[k + 1][j] + arr[i] * arr[k + 1] * arr[j + 1];
                          if (cand < best) best = cand;
                      }
                      cost[i][j] = best;
                  }
              }
              return cost[0][m - 1];
          }
        `,
        cpp: code`
          int matrixMultiplication(vector<int>& arr) {
              int m = arr.size() - 1;
              vector<vector<int>> cost(m, vector<int>(m, 0));
              for (int len = 2; len <= m; len++) {
                  for (int i = 0; i + len - 1 < m; i++) {
                      int j = i + len - 1;
                      int best = INT_MAX;
                      for (int k = i; k < j; k++) {
                          best = min(best, cost[i][k] + cost[k + 1][j] + arr[i] * arr[k + 1] * arr[j + 1]);
                      }
                      cost[i][j] = best;
                  }
              }
              return cost[0][m - 1];
          }
        `,
        c: code`
          int matrixMultiplication(int* arr, int arrSize) {
              int m = arrSize - 1;
              int* cost = (int*) calloc((size_t) m * m, sizeof(int));
              for (int len = 2; len <= m; len++) {
                  for (int i = 0; i + len - 1 < m; i++) {
                      int j = i + len - 1;
                      int best = 2147483647;
                      for (int k = i; k < j; k++) {
                          int cand = cost[i * m + k] + cost[(k + 1) * m + j] + arr[i] * arr[k + 1] * arr[j + 1];
                          if (cand < best) best = cand;
                      }
                      cost[i * m + j] = best;
                  }
              }
              int ans = cost[m - 1];
              free(cost);
              return ans;
          }
        `,
        csharp: code`
          public static int MatrixMultiplication(int[] arr)
          {
              int m = arr.Length - 1;
              int[,] cost = new int[m, m];
              for (int len = 2; len <= m; len++)
              {
                  for (int i = 0; i + len - 1 < m; i++)
                  {
                      int j = i + len - 1;
                      int best = int.MaxValue;
                      for (int k = i; k < j; k++)
                      {
                          int cand = cost[i, k] + cost[k + 1, j] + arr[i] * arr[k + 1] * arr[j + 1];
                          if (cand < best) best = cand;
                      }
                      cost[i, j] = best;
                  }
              }
              return cost[0, m - 1];
          }
        `,
        go: code`
          func matrixMultiplication(arr []int) int {
              m := len(arr) - 1
              cost := make([][]int, m)
              for i := range cost {
                  cost[i] = make([]int, m)
              }
              for length := 2; length <= m; length++ {
                  for i := 0; i+length-1 < m; i++ {
                      j := i + length - 1
                      best := -1
                      for k := i; k < j; k++ {
                          cand := cost[i][k] + cost[k+1][j] + arr[i]*arr[k+1]*arr[j+1]
                          if best < 0 || cand < best {
                              best = cand
                          }
                      }
                      cost[i][j] = best
                  }
              }
              return cost[0][m-1]
          }
        `,
        kotlin: code`
          fun matrixMultiplication(arr: IntArray): Int {
              val m = arr.size - 1
              val cost = Array(m) { IntArray(m) }
              for (len in 2..m) {
                  for (i in 0..(m - len)) {
                      val j = i + len - 1
                      var best = Int.MAX_VALUE
                      for (k in i until j) {
                          best = minOf(best, cost[i][k] + cost[k + 1][j] + arr[i] * arr[k + 1] * arr[j + 1])
                      }
                      cost[i][j] = best
                  }
              }
              return cost[0][m - 1]
          }
        `,
        swift: code`
          func matrixMultiplication(_ arr: [Int]) -> Int {
              let m = arr.count - 1
              var cost = [[Int]](repeating: [Int](repeating: 0, count: m), count: m)
              if m >= 2 {
                  for len in 2...m {
                      for i in 0...(m - len) {
                          let j = i + len - 1
                          var best = Int.max
                          for k in i..<j {
                              best = min(best, cost[i][k] + cost[k + 1][j] + arr[i] * arr[k + 1] * arr[j + 1])
                          }
                          cost[i][j] = best
                      }
                  }
              }
              return cost[0][m - 1]
          }
        `,
        rust: code`
          fn matrixMultiplication(arr: Vec<i32>) -> i32 {
              let m = arr.len() - 1;
              let mut cost = vec![vec![0i32; m]; m];
              for len in 2..=m {
                  for i in 0..=(m - len) {
                      let j = i + len - 1;
                      let mut best = std::i32::MAX;
                      for k in i..j {
                          let cand = cost[i][k] + cost[k + 1][j] + arr[i] * arr[k + 1] * arr[j + 1];
                          if cand < best {
                              best = cand;
                          }
                      }
                      cost[i][j] = best;
                  }
              }
              cost[0][m - 1]
          }
        `,
        php: code`
          function matrixMultiplication($arr) {
              $m = count($arr) - 1;
              $cost = array_fill(0, $m, array_fill(0, $m, 0));
              for ($len = 2; $len <= $m; $len++) {
                  for ($i = 0; $i + $len - 1 < $m; $i++) {
                      $j = $i + $len - 1;
                      $best = PHP_INT_MAX;
                      for ($k = $i; $k < $j; $k++) {
                          $cand = $cost[$i][$k] + $cost[$k + 1][$j] + $arr[$i] * $arr[$k + 1] * $arr[$j + 1];
                          if ($cand < $best) $best = $cand;
                      }
                      $cost[$i][$j] = $best;
                  }
              }
              return $cost[0][$m - 1];
          }
        `,
        ruby: code`
          def matrixMultiplication(arr)
            m = arr.length - 1
            cost = Array.new(m) { Array.new(m, 0) }
            (2..m).each do |len|
              (0..(m - len)).each do |i|
                j = i + len - 1
                best = nil
                (i...j).each do |k|
                  cand = cost[i][k] + cost[k + 1][j] + arr[i] * arr[k + 1] * arr[j + 1]
                  best = cand if best.nil? || cand < best
                end
                cost[i][j] = best
              end
            end
            cost[0][m - 1]
          end
        `,
      },
    };
  })(),

  // ── Longest Common Substring (GFG) ───────────────────────────────
  (() => {
    const ref = (s1: string, s2: string) => {
      let best = 0;
      for (let i = 0; i < s1.length; i++) {
        for (let j = 0; j < s2.length; j++) {
          let k = 0;
          while (i + k < s1.length && j + k < s2.length && s1[i + k] === s2[j + k]) k++;
          if (k > best) best = k;
        }
      }
      return best;
    };
    return {
      slug: "longest-common-substring",
      title: "Longest Common Substring",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Microsoft", "Morgan Stanley"],
      signature: {
        funcName: "longestCommonSubstr",
        params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given two strings `s1` and `s2`, return the length of the **longest common substring** — the longest string that appears in both as a block of *consecutive* characters.\n\nThis is different from the longest common *subsequence*: the characters of a substring must sit next to each other in both strings. The comparison is case-sensitive. If the strings share no character at all, the answer is `0`.",
        [
          { in: "s1 = \"ABCDGH\", s2 = \"ACDGHR\"", out: "4", note: "\"CDGH\" appears in both strings." },
          { in: "s1 = \"abc\", s2 = \"acb\"", out: "1", note: "No two-character block is shared, but single letters are." },
          { in: "s1 = \"YZ\", s2 = \"yz\"", out: "0", note: "Upper- and lowercase letters are different characters." },
        ],
        ["1 <= s1.length, s2.length <= 1000", "s1 and s2 consist of English letters"]),
      hints: [
        "A common substring ends at some position `i` of `s1` and some position `j` of `s2`. How long can it be if it ends exactly there?",
        "Let `len[i][j]` be the length of the longest common block ending at `s1[i - 1]` and `s2[j - 1]`. If those characters differ it is `0`; otherwise it extends the block ending one step earlier in both.",
        "The answer is the largest `len[i][j]` anywhere — not the bottom-right cell. Only the previous row is needed, so two 1-D arrays suffice.",
      ],
      editorial: explain({
        idea: "Fix where the common block ends: at index `i` in `s1` and `j` in `s2`. If the characters there match, the block is one longer than the block ending at `i - 1, j - 1`; if they don't, no common block ends there at all. The best end pair gives the answer.",
        steps: [
          "Keep `prev` and `cur`, both of length `m + 1` (`m = s2.length`), zero-filled.",
          "For each `i` from 1 to `n`, for each `j` from 1 to `m`: `cur[j] = prev[j - 1] + 1` if `s1[i - 1] == s2[j - 1]`, else `0`. Track the maximum.",
          "Swap `prev` and `cur` after each row (resetting `cur[0] = 0`). Return the maximum seen.",
        ],
        why: "A block of length `L` ending at `(i, j)` means the last `L` characters before and including those positions agree pairwise; that holds exactly when the characters at `(i, j)` agree and a block of length `L - 1` ends at `(i - 1, j - 1)`. So `len[i][j]` is computed correctly from the previous row, and every common substring is counted at its own end pair.",
        time: "O(n * m)",
        space: "O(m)",
        pitfalls: [
          "Unlike the subsequence DP there is no `max(left, up)` carry-over — a mismatch resets the run to `0`.",
          "The answer is the maximum over the whole table, not the last cell.",
          "With a single rolling array, iterate `j` downward or you read the current row's value instead of the previous one.",
        ],
      }),
      examples: [
        { input: "\"ABCDGH\"\n\"ACDGHR\"", expectedOutput: "4" },
        { input: "\"abc\"\n\"acb\"", expectedOutput: "1" },
        { input: "\"YZ\"\n\"yz\"", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcd", "abcdefghijklmnopqrstuvwxyz", "aAbB"]);
        const s1 = randLower(rng, 1, pick(rng, [1, 5, 15, 30]), alpha);
        let s2 = randLower(rng, 1, pick(rng, [1, 5, 15, 30]), alpha);
        if (rng() < 0.3 && s1.length > 1) {
          const a = ri(rng, 0, s1.length - 1);
          const b = ri(rng, a + 1, s1.length);
          const cut = ri(rng, 0, s2.length);
          s2 = (s2.slice(0, cut) + s1.slice(a, b) + s2.slice(cut)).slice(0, 40);
        }
        return { input: `${JSON.stringify(s1)}\n${JSON.stringify(s2)}`, expectedOutput: String(ref(s1, s2)) };
      },
      solutions: {
        python: code`
          def longestCommonSubstr(s1: str, s2: str) -> int:
              m = len(s2)
              prev = [0] * (m + 1)
              best = 0
              for ch in s1:
                  cur = [0] * (m + 1)
                  for j in range(1, m + 1):
                      if ch == s2[j - 1]:
                          v = prev[j - 1] + 1
                          cur[j] = v
                          if v > best:
                              best = v
                  prev = cur
              return best
        `,
        javascript: code`
          var longestCommonSubstr = function(s1, s2) {
              var n = s1.length, m = s2.length;
              var prev = new Array(m + 1).fill(0);
              var cur = new Array(m + 1).fill(0);
              var best = 0;
              for (var i = 1; i <= n; i++) {
                  for (var j = 1; j <= m; j++) {
                      cur[j] = s1.charCodeAt(i - 1) === s2.charCodeAt(j - 1) ? prev[j - 1] + 1 : 0;
                      if (cur[j] > best) best = cur[j];
                  }
                  var t = prev; prev = cur; cur = t;
              }
              return best;
          };
        `,
        typescript: code`
          function longestCommonSubstr(s1: string, s2: string): number {
              var n = s1.length, m = s2.length;
              var prev: number[] = [], cur: number[] = [];
              for (var k = 0; k <= m; k++) { prev.push(0); cur.push(0); }
              var best = 0;
              for (var i = 1; i <= n; i++) {
                  for (var j = 1; j <= m; j++) {
                      cur[j] = s1.charCodeAt(i - 1) === s2.charCodeAt(j - 1) ? prev[j - 1] + 1 : 0;
                      if (cur[j] > best) best = cur[j];
                  }
                  var t = prev; prev = cur; cur = t;
              }
              return best;
          }
        `,
        java: code`
          public static int longestCommonSubstr(String s1, String s2) {
              int n = s1.length(), m = s2.length();
              int[] prev = new int[m + 1], cur = new int[m + 1];
              int best = 0;
              for (int i = 1; i <= n; i++) {
                  for (int j = 1; j <= m; j++) {
                      cur[j] = s1.charAt(i - 1) == s2.charAt(j - 1) ? prev[j - 1] + 1 : 0;
                      if (cur[j] > best) best = cur[j];
                  }
                  int[] t = prev; prev = cur; cur = t;
              }
              return best;
          }
        `,
        cpp: code`
          int longestCommonSubstr(string s1, string s2) {
              int n = s1.size(), m = s2.size();
              vector<int> prev(m + 1, 0), cur(m + 1, 0);
              int best = 0;
              for (int i = 1; i <= n; i++) {
                  for (int j = 1; j <= m; j++) {
                      cur[j] = s1[i - 1] == s2[j - 1] ? prev[j - 1] + 1 : 0;
                      best = max(best, cur[j]);
                  }
                  swap(prev, cur);
              }
              return best;
          }
        `,
        c: code`
          int longestCommonSubstr(const char* s1, const char* s2) {
              int n = (int) strlen(s1), m = (int) strlen(s2);
              int* prev = (int*) calloc((size_t) (m + 1), sizeof(int));
              int* cur = (int*) calloc((size_t) (m + 1), sizeof(int));
              int best = 0;
              for (int i = 1; i <= n; i++) {
                  for (int j = 1; j <= m; j++) {
                      cur[j] = s1[i - 1] == s2[j - 1] ? prev[j - 1] + 1 : 0;
                      if (cur[j] > best) best = cur[j];
                  }
                  int* t = prev; prev = cur; cur = t;
              }
              free(prev);
              free(cur);
              return best;
          }
        `,
        csharp: code`
          public static int LongestCommonSubstr(string s1, string s2)
          {
              int n = s1.Length, m = s2.Length;
              int[] prev = new int[m + 1], cur = new int[m + 1];
              int best = 0;
              for (int i = 1; i <= n; i++)
              {
                  for (int j = 1; j <= m; j++)
                  {
                      cur[j] = s1[i - 1] == s2[j - 1] ? prev[j - 1] + 1 : 0;
                      if (cur[j] > best) best = cur[j];
                  }
                  int[] t = prev; prev = cur; cur = t;
              }
              return best;
          }
        `,
        go: code`
          func longestCommonSubstr(s1 string, s2 string) int {
              n, m := len(s1), len(s2)
              prev := make([]int, m+1)
              cur := make([]int, m+1)
              best := 0
              for i := 1; i <= n; i++ {
                  for j := 1; j <= m; j++ {
                      if s1[i-1] == s2[j-1] {
                          cur[j] = prev[j-1] + 1
                          if cur[j] > best {
                              best = cur[j]
                          }
                      } else {
                          cur[j] = 0
                      }
                  }
                  prev, cur = cur, prev
              }
              return best
          }
        `,
        kotlin: code`
          fun longestCommonSubstr(s1: String, s2: String): Int {
              val n = s1.length
              val m = s2.length
              var prev = IntArray(m + 1)
              var cur = IntArray(m + 1)
              var best = 0
              for (i in 1..n) {
                  for (j in 1..m) {
                      cur[j] = if (s1[i - 1] == s2[j - 1]) prev[j - 1] + 1 else 0
                      if (cur[j] > best) best = cur[j]
                  }
                  val t = prev; prev = cur; cur = t
              }
              return best
          }
        `,
        swift: code`
          func longestCommonSubstr(_ s1: String, _ s2: String) -> Int {
              let a = Array(s1.utf8), b = Array(s2.utf8)
              let n = a.count, m = b.count
              var prev = [Int](repeating: 0, count: m + 1)
              var cur = [Int](repeating: 0, count: m + 1)
              var best = 0
              for i in 0..<n {
                  for j in 0..<m {
                      cur[j + 1] = a[i] == b[j] ? prev[j] + 1 : 0
                      if cur[j + 1] > best { best = cur[j + 1] }
                  }
                  swap(&prev, &cur)
              }
              return best
          }
        `,
        rust: code`
          fn longestCommonSubstr(s1: String, s2: String) -> i32 {
              let a = s1.as_bytes();
              let b = s2.as_bytes();
              let m = b.len();
              let mut prev = vec![0i32; m + 1];
              let mut cur = vec![0i32; m + 1];
              let mut best = 0;
              for i in 0..a.len() {
                  for j in 0..m {
                      cur[j + 1] = if a[i] == b[j] { prev[j] + 1 } else { 0 };
                      if cur[j + 1] > best {
                          best = cur[j + 1];
                      }
                  }
                  std::mem::swap(&mut prev, &mut cur);
              }
              best
          }
        `,
        php: code`
          function longestCommonSubstr($s1, $s2) {
              $n = strlen($s1);
              $m = strlen($s2);
              $prev = array_fill(0, $m + 1, 0);
              $best = 0;
              for ($i = 1; $i <= $n; $i++) {
                  $cur = array_fill(0, $m + 1, 0);
                  for ($j = 1; $j <= $m; $j++) {
                      if ($s1[$i - 1] === $s2[$j - 1]) {
                          $cur[$j] = $prev[$j - 1] + 1;
                          if ($cur[$j] > $best) $best = $cur[$j];
                      }
                  }
                  $prev = $cur;
              }
              return $best;
          }
        `,
        ruby: code`
          def longestCommonSubstr(s1, s2)
            a = s1.bytes
            b = s2.bytes
            m = b.length
            prev = Array.new(m + 1, 0)
            best = 0
            a.each do |ch|
              cur = Array.new(m + 1, 0)
              (1..m).each do |j|
                if ch == b[j - 1]
                  cur[j] = prev[j - 1] + 1
                  best = cur[j] if cur[j] > best
                end
              end
              prev = cur
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Subset Sum Problem (GFG) ─────────────────────────────────────
  (() => {
    const ref = (arr: number[], target: number) => {
      let sums = new Set<number>([0]);
      for (const a of arr) {
        const next = new Set(sums);
        for (const s of sums) if (s + a <= target) next.add(s + a);
        sums = next;
      }
      return sums.has(target);
    };
    return {
      slug: "subset-sum-problem",
      title: "Subset Sum Problem",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Microsoft", "Adobe"],
      signature: {
        funcName: "isSubsetSum",
        params: [{ name: "arr", type: "int[]" as const }, { name: "target", type: "int" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "Given an array of positive integers `arr` and an integer `target`, decide whether some **subset** of `arr` adds up to exactly `target`.\n\nA subset may use any selection of the elements (each element at most once, in any order). Return `true` if such a subset exists, and `false` otherwise.",
        [
          { in: "arr = [3,34,4,12,5,2], target = 9", out: "true", note: "4 + 5 = 9." },
          { in: "arr = [3,34,4,12,5,2], target = 30", out: "false", note: "No selection of these numbers sums to 30." },
          { in: "arr = [1,2,3], target = 6", out: "true", note: "The whole array is a subset too." },
        ],
        ["1 <= arr.length <= 200", "1 <= arr[i] <= 200", "1 <= target <= 4 * 10^4"]),
      hints: [
        "Trying all `2^n` subsets is hopeless for 200 elements — but the *sums* involved are small.",
        "Track which totals are reachable. Start with only `0` reachable; each element `a` makes `s + a` reachable for every `s` already reachable.",
        "Use a boolean array `can[0..target]` and update it from high to low (`can[s] |= can[s - a]`) so each element is used at most once.",
      ],
      editorial: explain({
        idea: "Instead of enumerating subsets, enumerate the sums they can make. After processing a prefix of the array, `can[s]` says whether some subset of that prefix sums to `s`; adding an element shifts every reachable sum by its value.",
        steps: [
          "Create `can[0..target]` with only `can[0] = true` (the empty subset).",
          "For each element `a`, for `s` from `target` down to `a`: if `can[s - a]` is true, set `can[s] = true`.",
          "Return `can[target]`.",
        ],
        why: "A subset of the first `i` elements summing to `s` either avoids element `i` (so `s` was reachable before) or uses it (so `s - a` was reachable before). Scanning `s` downward guarantees `can[s - a]` still reflects the state before element `i`, so no element is counted twice. Sums above `target` can never come back down, so they are never needed.",
        time: "O(n * target)",
        space: "O(target)",
        pitfalls: [
          "Iterating `s` upward lets one element be added repeatedly (that is the unbounded version).",
          "Elements larger than `target` can simply be skipped.",
          "A quick exit: if the whole array sums to less than `target`, the answer is `false`.",
        ],
      }),
      examples: [
        { input: "[3,34,4,12,5,2]\n9", expectedOutput: "true" },
        { input: "[3,34,4,12,5,2]\n30", expectedOutput: "false" },
        { input: "[1,2,3]\n6", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 20]));
        const top = pick(rng, [5, 30, 200]);
        const arr = Array.from({ length: n }, () => ri(rng, 1, top));
        const total = arr.reduce((s, v) => s + v, 0);
        let target: number;
        if (rng() < 0.45) {
          target = arr.filter(() => rng() < 0.5).reduce((s, v) => s + v, 0);
          if (target === 0) target = arr[0];
        } else {
          target = ri(rng, 1, Math.min(total + 10, 1000));
        }
        return { input: `${fmtIntArr(arr)}\n${target}`, expectedOutput: bool(ref(arr, target)) };
      },
      solutions: {
        python: code`
          from typing import List

          def isSubsetSum(arr: List[int], target: int) -> bool:
              # Bit s of reach is set when some subset sums to s.
              reach = 1
              mask = (1 << (target + 1)) - 1
              for a in arr:
                  reach = (reach | (reach << a)) & mask
              return (reach >> target) & 1 == 1
        `,
        javascript: code`
          var isSubsetSum = function(arr, target) {
              var can = new Array(target + 1).fill(false);
              can[0] = true;
              for (var i = 0; i < arr.length; i++) {
                  var a = arr[i];
                  for (var s = target; s >= a; s--) {
                      if (can[s - a]) can[s] = true;
                  }
              }
              return can[target];
          };
        `,
        typescript: code`
          function isSubsetSum(arr: number[], target: number): boolean {
              var can: boolean[] = [];
              for (var k = 0; k <= target; k++) can.push(false);
              can[0] = true;
              for (var i = 0; i < arr.length; i++) {
                  var a = arr[i];
                  for (var s = target; s >= a; s--) {
                      if (can[s - a]) can[s] = true;
                  }
              }
              return can[target];
          }
        `,
        java: code`
          public static boolean isSubsetSum(int[] arr, int target) {
              boolean[] can = new boolean[target + 1];
              can[0] = true;
              for (int a : arr) {
                  for (int s = target; s >= a; s--) {
                      if (can[s - a]) can[s] = true;
                  }
              }
              return can[target];
          }
        `,
        cpp: code`
          bool isSubsetSum(vector<int>& arr, int target) {
              vector<char> can(target + 1, 0);
              can[0] = 1;
              for (int a : arr) {
                  for (int s = target; s >= a; s--) {
                      if (can[s - a]) can[s] = 1;
                  }
              }
              return can[target] != 0;
          }
        `,
        c: code`
          bool isSubsetSum(int* arr, int arrSize, int target) {
              char* can = (char*) calloc((size_t) (target + 1), 1);
              can[0] = 1;
              for (int i = 0; i < arrSize; i++) {
                  int a = arr[i];
                  for (int s = target; s >= a; s--) {
                      if (can[s - a]) can[s] = 1;
                  }
              }
              bool ans = can[target] != 0;
              free(can);
              return ans;
          }
        `,
        csharp: code`
          public static bool IsSubsetSum(int[] arr, int target)
          {
              bool[] can = new bool[target + 1];
              can[0] = true;
              foreach (int a in arr)
              {
                  for (int s = target; s >= a; s--)
                  {
                      if (can[s - a]) can[s] = true;
                  }
              }
              return can[target];
          }
        `,
        go: code`
          func isSubsetSum(arr []int, target int) bool {
              can := make([]bool, target+1)
              can[0] = true
              for _, a := range arr {
                  for s := target; s >= a; s-- {
                      if can[s-a] {
                          can[s] = true
                      }
                  }
              }
              return can[target]
          }
        `,
        kotlin: code`
          fun isSubsetSum(arr: IntArray, target: Int): Boolean {
              val can = BooleanArray(target + 1)
              can[0] = true
              for (a in arr) {
                  for (s in target downTo a) {
                      if (can[s - a]) can[s] = true
                  }
              }
              return can[target]
          }
        `,
        swift: code`
          func isSubsetSum(_ arr: [Int], _ target: Int) -> Bool {
              var can = [Bool](repeating: false, count: target + 1)
              can[0] = true
              for a in arr {
                  var s = target
                  while s >= a {
                      if can[s - a] { can[s] = true }
                      s -= 1
                  }
              }
              return can[target]
          }
        `,
        rust: code`
          fn isSubsetSum(arr: Vec<i32>, target: i32) -> bool {
              let t = target as usize;
              let mut can = vec![false; t + 1];
              can[0] = true;
              for &a in arr.iter() {
                  let a = a as usize;
                  if a > t {
                      continue;
                  }
                  for s in (a..=t).rev() {
                      if can[s - a] {
                          can[s] = true;
                      }
                  }
              }
              can[t]
          }
        `,
        php: code`
          function isSubsetSum($arr, $target) {
              $can = array_fill(0, $target + 1, false);
              $can[0] = true;
              foreach ($arr as $a) {
                  for ($s = $target; $s >= $a; $s--) {
                      if ($can[$s - $a]) $can[$s] = true;
                  }
              }
              return $can[$target];
          }
        `,
        ruby: code`
          def isSubsetSum(arr, target)
            # Bit s of reach is set when some subset sums to s.
            reach = 1
            mask = (1 << (target + 1)) - 1
            arr.each { |a| reach = (reach | (reach << a)) & mask }
            reach[target] == 1
          end
        `,
      },
    };
  })(),

  // ── Perfect Sum Problem (GFG) ────────────────────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (arr: number[], target: number) => {
      const ways = new Array(target + 1).fill(0);
      ways[0] = 1;
      for (const a of arr) {
        for (let s = target; s >= a; s--) ways[s] = (ways[s] + ways[s - a]) % MOD;
      }
      return ways[target];
    };
    return {
      slug: "perfect-sum-problem",
      title: "Perfect Sum Problem",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Microsoft"],
      signature: {
        funcName: "perfectSum",
        params: [{ name: "arr", type: "int[]" as const }, { name: "target", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given an array of non-negative integers `arr` and an integer `target`, count the **subsets** of `arr` whose elements add up to exactly `target`.\n\nSubsets are told apart by the *positions* they take, not by their values: in `[1,1]` the two single-element subsets `{arr[0]}` and `{arr[1]}` are different. Elements equal to `0` matter too — adding or leaving out a zero gives a different subset with the same sum.\n\nThe count can be very large, so return it **modulo** `10^9 + 7`.",
        [
          { in: "arr = [5,2,3,10,6,8], target = 10", out: "3", note: "The subsets are {5,2,3}, {2,8} and {10}." },
          { in: "arr = [2,5,1,4,3], target = 10", out: "3", note: "{2,5,3}, {5,1,4} and {2,1,4,3}." },
          { in: "arr = [0,0,1], target = 1", out: "4", note: "{1} together with any choice of the two zeros: none, the first, the second, or both." },
        ],
        ["1 <= arr.length <= 1000", "0 <= arr[i] <= 1000", "1 <= target <= 1000"]),
      hints: [
        "This is the subset-sum decision problem turned into counting: instead of *whether* a sum is reachable, record *how many* subsets reach it.",
        "Let `ways[s]` be the number of subsets (of the elements seen so far) with sum `s`. Initially only the empty subset exists: `ways[0] = 1`.",
        "For each element `a`, update `ways[s] += ways[s - a]` for `s` from `target` down to `a`, modulo `10^9 + 7`. Zeros need no special case — with `a = 0` the update doubles every count, which is exactly right.",
      ],
      editorial: explain({
        idea: "Every subset of the first `i` elements either leaves out element `i` or includes it. So the number of subsets with sum `s` after element `i` is the old count for `s` plus the old count for `s - a`. One array of counts, updated in place from high sums to low, carries this forward.",
        steps: [
          "Create `ways[0..target]`, all `0` except `ways[0] = 1`.",
          "For each element `a`, loop `s` from `target` down to `a`: `ways[s] = (ways[s] + ways[s - a]) mod (10^9 + 7)`.",
          "Return `ways[target]`.",
        ],
        why: "The subsets of the first `i` elements with sum `s` split into those without element `i` (counted by the old `ways[s]`) and those with it (each formed by adding element `i` to a subset of the first `i - 1` elements summing to `s - a`, counted by the old `ways[s - a]`). The two groups are disjoint and cover everything. Going downward keeps `ways[s - a]` at its old value. For `a = 0` the loop visits every `s` and doubles it, matching \"take or skip the zero\".",
        time: "O(n * target)",
        space: "O(target)",
        pitfalls: [
          "Treating zeros as \"don't care\" undercounts: each zero doubles the number of subsets.",
          "Take the modulus after every addition; in typed languages the sum of two residues can pass 2^31, so use 64-bit or subtract the modulus.",
          "Subsets are distinguished by index, so equal values must not be deduplicated.",
        ],
      }),
      examples: [
        { input: "[5,2,3,10,6,8]\n10", expectedOutput: "3" },
        { input: "[2,5,1,4,3]\n10", expectedOutput: "3" },
        { input: "[0,0,1]\n1", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const big = rng() < 0.2;
        const n = big ? ri(rng, 30, 70) : ri(rng, 1, pick(rng, [1, 4, 10, 20]));
        const top = big ? pick(rng, [1, 3]) : pick(rng, [3, 10, 50, 1000]);
        const zeroRate = pick(rng, [0, 0.1, 0.3]);
        const arr = Array.from({ length: n }, () => (rng() < zeroRate ? 0 : ri(rng, 1, top)));
        const total = arr.reduce((s, v) => s + v, 0);
        const target = big ? ri(rng, 1, Math.max(1, Math.min(60, total))) : ri(rng, 1, Math.max(1, Math.min(1000, total + 5)));
        return { input: `${fmtIntArr(arr)}\n${target}`, expectedOutput: String(ref(arr, target)) };
      },
      solutions: {
        python: code`
          from typing import List

          def perfectSum(arr: List[int], target: int) -> int:
              MOD = 10**9 + 7
              ways = [0] * (target + 1)
              ways[0] = 1
              for a in arr:
                  for s in range(target, a - 1, -1):
                      ways[s] = (ways[s] + ways[s - a]) % MOD
              return ways[target]
        `,
        javascript: code`
          var perfectSum = function(arr, target) {
              var MOD = 1000000007;
              var ways = new Array(target + 1).fill(0);
              ways[0] = 1;
              for (var i = 0; i < arr.length; i++) {
                  var a = arr[i];
                  for (var s = target; s >= a; s--) ways[s] = (ways[s] + ways[s - a]) % MOD;
              }
              return ways[target];
          };
        `,
        typescript: code`
          function perfectSum(arr: number[], target: number): number {
              var MOD = 1000000007;
              var ways: number[] = [];
              for (var k = 0; k <= target; k++) ways.push(0);
              ways[0] = 1;
              for (var i = 0; i < arr.length; i++) {
                  var a = arr[i];
                  for (var s = target; s >= a; s--) ways[s] = (ways[s] + ways[s - a]) % MOD;
              }
              return ways[target];
          }
        `,
        java: code`
          public static int perfectSum(int[] arr, int target) {
              final long MOD = 1000000007L;
              long[] ways = new long[target + 1];
              ways[0] = 1;
              for (int a : arr) {
                  for (int s = target; s >= a; s--) ways[s] = (ways[s] + ways[s - a]) % MOD;
              }
              return (int) ways[target];
          }
        `,
        cpp: code`
          int perfectSum(vector<int>& arr, int target) {
              const long long MOD = 1000000007LL;
              vector<long long> ways(target + 1, 0);
              ways[0] = 1;
              for (int a : arr) {
                  for (int s = target; s >= a; s--) ways[s] = (ways[s] + ways[s - a]) % MOD;
              }
              return (int) ways[target];
          }
        `,
        c: code`
          int perfectSum(int* arr, int arrSize, int target) {
              const long long MOD = 1000000007LL;
              long long* ways = (long long*) calloc((size_t) (target + 1), sizeof(long long));
              ways[0] = 1;
              for (int i = 0; i < arrSize; i++) {
                  int a = arr[i];
                  for (int s = target; s >= a; s--) ways[s] = (ways[s] + ways[s - a]) % MOD;
              }
              int ans = (int) ways[target];
              free(ways);
              return ans;
          }
        `,
        csharp: code`
          public static int PerfectSum(int[] arr, int target)
          {
              const long MOD = 1000000007L;
              long[] ways = new long[target + 1];
              ways[0] = 1;
              foreach (int a in arr)
              {
                  for (int s = target; s >= a; s--) ways[s] = (ways[s] + ways[s - a]) % MOD;
              }
              return (int) ways[target];
          }
        `,
        go: code`
          func perfectSum(arr []int, target int) int {
              const mod = 1000000007
              ways := make([]int, target+1)
              ways[0] = 1
              for _, a := range arr {
                  for s := target; s >= a; s-- {
                      ways[s] = (ways[s] + ways[s-a]) % mod
                  }
              }
              return ways[target]
          }
        `,
        kotlin: code`
          fun perfectSum(arr: IntArray, target: Int): Int {
              val modulus = 1000000007L
              val ways = LongArray(target + 1)
              ways[0] = 1L
              for (a in arr) {
                  for (s in target downTo a) ways[s] = (ways[s] + ways[s - a]) % modulus
              }
              return ways[target].toInt()
          }
        `,
        swift: code`
          func perfectSum(_ arr: [Int], _ target: Int) -> Int {
              let modulus = 1000000007
              var ways = [Int](repeating: 0, count: target + 1)
              ways[0] = 1
              for a in arr {
                  var s = target
                  while s >= a {
                      ways[s] = (ways[s] + ways[s - a]) % modulus
                      s -= 1
                  }
              }
              return ways[target]
          }
        `,
        rust: code`
          fn perfectSum(arr: Vec<i32>, target: i32) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let t = target as usize;
              let mut ways = vec![0i64; t + 1];
              ways[0] = 1;
              for &a in arr.iter() {
                  let a = a as usize;
                  if a > t {
                      continue;
                  }
                  for s in (a..=t).rev() {
                      ways[s] = (ways[s] + ways[s - a]) % modulus;
                  }
              }
              ways[t] as i32
          }
        `,
        php: code`
          function perfectSum($arr, $target) {
              $MOD = 1000000007;
              $ways = array_fill(0, $target + 1, 0);
              $ways[0] = 1;
              foreach ($arr as $a) {
                  for ($s = $target; $s >= $a; $s--) $ways[$s] = ($ways[$s] + $ways[$s - $a]) % $MOD;
              }
              return $ways[$target];
          }
        `,
        ruby: code`
          def perfectSum(arr, target)
            mod = 1_000_000_007
            ways = Array.new(target + 1, 0)
            ways[0] = 1
            arr.each do |a|
              s = target
              while s >= a
                ways[s] = (ways[s] + ways[s - a]) % mod
                s -= 1
              end
            end
            ways[target]
          end
        `,
      },
    };
  })(),

  // ── Boolean Parenthesization (GFG) ───────────────────────────────
  (() => {
    const ref = (s: string) => {
      const m = (s.length + 1) >> 1;
      const memo = new Map<number, [number, number]>();
      const go = (i: number, j: number): [number, number] => {
        if (i === j) return s[2 * i] === "T" ? [1, 0] : [0, 1];
        const key = i * 1000 + j;
        if (memo.has(key)) return memo.get(key)!;
        let t = 0, f = 0;
        for (let k = i; k < j; k++) {
          const [lt, lf] = go(i, k);
          const [rt, rf] = go(k + 1, j);
          const op = s[2 * k + 1];
          const both = (lt + lf) * (rt + rf);
          const tt = op === "&" ? lt * rt : op === "|" ? both - lf * rf : lt * rf + lf * rt;
          t += tt;
          f += both - tt;
        }
        memo.set(key, [t, f]);
        return [t, f];
      };
      return go(0, m - 1)[0] % 1003;
    };
    return {
      slug: "boolean-parenthesization",
      title: "Boolean Parenthesization",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Microsoft", "Flipkart", "Samsung"],
      signature: { funcName: "countWays", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a boolean expression `s` with no parentheses. Its characters at even positions are operands — `'T'` (true) or `'F'` (false) — and the characters between them are operators:\n\n- `'&'` — boolean AND\n- `'|'` — boolean OR\n- `'^'` — boolean XOR\n\nCount the number of ways to **fully parenthesise** the expression so that it evaluates to **true**. Two ways differ if they group the operands differently (equivalently, if the binary trees of operations differ). A single operand needs no parentheses and is counted as one way.\n\nThe count grows quickly, so return it **modulo** `1003`.",
        [
          { in: "s = \"T|T&F^T\"", out: "4", note: "((T|T)&(F^T)), (T|(T&(F^T))), (((T|T)&F)^T) and (T|((T&F)^T)) are true; the fifth grouping, ((T|(T&F))^T), is false." },
          { in: "s = \"T^F|F\"", out: "2", note: "Both ((T^F)|F) and (T^(F|F)) evaluate to true." },
          { in: "s = \"F\"", out: "0", note: "The only way to read a lone F is false." },
        ],
        ["1 <= s.length <= 199", "s.length is odd", "s[i] is 'T' or 'F' at even i and one of '&', '|', '^' at odd i"]),
      hints: [
        "Whatever the parenthesisation, one operator is applied *last*. It splits the expression into a left part and a right part.",
        "To know how many ways the whole is true you need, for each part, how many ways it is true **and** how many ways it is false.",
        "Let `T[i][j]` and `F[i][j]` count the true/false groupings of operands `i..j`. For a last operator between `k` and `k+1`, combine the four counts by its truth table, and fill the tables by increasing length.",
      ],
      editorial: explain({
        idea: "Choose the operator evaluated last. The groupings of the left operands and of the right operands are independent, so the number of ways the whole is true is a product of left and right counts — but which products depends on the operator, and an AND/XOR/OR result can come from false parts too. So track true and false counts for every interval of operands.",
        steps: [
          "Let `m` be the number of operands (operand `i` is `s[2i]`, the operator after it is `s[2i + 1]`). Set `T[i][i] = 1, F[i][i] = 0` for `'T'` and the reverse for `'F'`.",
          "For lengths 2..m and every interval `i..j`, for every split `k` in `i..j-1` with operator `op = s[2k + 1]` and counts `lt, lf` for `i..k`, `rt, rf` for `k+1..j`:",
          "`&`: true += `lt*rt`, false += `lt*rf + lf*rt + lf*rf`. `|`: true += `lt*rt + lt*rf + lf*rt`, false += `lf*rf`. `^`: true += `lt*rf + lf*rt`, false += `lt*rt + lf*rf`. Reduce modulo 1003 as you go.",
          "Return `T[0][m - 1]`.",
        ],
        why: "Each full parenthesisation of `i..j` has exactly one last operator, so splitting on it counts every grouping exactly once. Given that split, a grouping of the whole is a pair (left grouping, right grouping), and its value is the operator applied to their values — hence the products of the matching true/false counts.",
        time: "O(m^3)",
        space: "O(m^2)",
        pitfalls: [
          "Counting only true groupings is not enough: `F | T`, `F ^ T` and `T ^ F` need the false counts of a part.",
          "Operands and operators interleave — operand `i` is at index `2i`, not `i`.",
          "Products of two residues below 1003 are at most about 10^6, and a split adds three of them, so 32-bit arithmetic is safe if you reduce after each split.",
        ],
      }),
      examples: [
        { input: "\"T|T&F^T\"", expectedOutput: "4" },
        { input: "\"T^F|F\"", expectedOutput: "2" },
        { input: "\"F\"", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 3, 6, 10, 15, 18]));
        const ops = pick(rng, ["&|^", "&|^", "&", "|^", "^"]);
        const tRate = pick(rng, [0.2, 0.5, 0.8]);
        let s = "";
        for (let i = 0; i < m; i++) {
          if (i > 0) s += ops[ri(rng, 0, ops.length - 1)];
          s += rng() < tRate ? "T" : "F";
        }
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def countWays(s: str) -> int:
              MOD = 1003
              m = (len(s) + 1) // 2
              T = [[0] * m for _ in range(m)]
              F = [[0] * m for _ in range(m)]
              for i in range(m):
                  if s[2 * i] == 'T':
                      T[i][i] = 1
                  else:
                      F[i][i] = 1
              for length in range(2, m + 1):
                  for i in range(0, m - length + 1):
                      j = i + length - 1
                      t = f = 0
                      for k in range(i, j):
                          lt, lf, rt, rf = T[i][k], F[i][k], T[k + 1][j], F[k + 1][j]
                          op = s[2 * k + 1]
                          if op == '&':
                              t += lt * rt
                              f += lt * rf + lf * rt + lf * rf
                          elif op == '|':
                              t += lt * rt + lt * rf + lf * rt
                              f += lf * rf
                          else:
                              t += lt * rf + lf * rt
                              f += lt * rt + lf * rf
                      T[i][j] = t % MOD
                      F[i][j] = f % MOD
              return T[0][m - 1]
        `,
        javascript: code`
          var countWays = function(s) {
              var MOD = 1003;
              var m = (s.length + 1) >> 1;
              var T = [], F = [];
              for (var r = 0; r < m; r++) {
                  T.push(new Array(m).fill(0));
                  F.push(new Array(m).fill(0));
              }
              for (var i = 0; i < m; i++) {
                  if (s.charAt(2 * i) === "T") T[i][i] = 1; else F[i][i] = 1;
              }
              for (var len = 2; len <= m; len++) {
                  for (var a = 0; a + len - 1 < m; a++) {
                      var b = a + len - 1;
                      var t = 0, f = 0;
                      for (var k = a; k < b; k++) {
                          var lt = T[a][k], lf = F[a][k], rt = T[k + 1][b], rf = F[k + 1][b];
                          var op = s.charAt(2 * k + 1);
                          if (op === "&") {
                              t += lt * rt;
                              f += lt * rf + lf * rt + lf * rf;
                          } else if (op === "|") {
                              t += lt * rt + lt * rf + lf * rt;
                              f += lf * rf;
                          } else {
                              t += lt * rf + lf * rt;
                              f += lt * rt + lf * rf;
                          }
                          t %= MOD;
                          f %= MOD;
                      }
                      T[a][b] = t;
                      F[a][b] = f;
                  }
              }
              return T[0][m - 1];
          };
        `,
        typescript: code`
          function countWays(s: string): number {
              var MOD = 1003;
              var m = (s.length + 1) >> 1;
              var T: number[][] = [], F: number[][] = [];
              for (var r = 0; r < m; r++) {
                  var tr: number[] = [], fr: number[] = [];
                  for (var c = 0; c < m; c++) { tr.push(0); fr.push(0); }
                  T.push(tr);
                  F.push(fr);
              }
              for (var i = 0; i < m; i++) {
                  if (s.charAt(2 * i) === "T") T[i][i] = 1; else F[i][i] = 1;
              }
              for (var len = 2; len <= m; len++) {
                  for (var a = 0; a + len - 1 < m; a++) {
                      var b = a + len - 1;
                      var t = 0, f = 0;
                      for (var k = a; k < b; k++) {
                          var lt = T[a][k], lf = F[a][k], rt = T[k + 1][b], rf = F[k + 1][b];
                          var op = s.charAt(2 * k + 1);
                          if (op === "&") {
                              t += lt * rt;
                              f += lt * rf + lf * rt + lf * rf;
                          } else if (op === "|") {
                              t += lt * rt + lt * rf + lf * rt;
                              f += lf * rf;
                          } else {
                              t += lt * rf + lf * rt;
                              f += lt * rt + lf * rf;
                          }
                          t %= MOD;
                          f %= MOD;
                      }
                      T[a][b] = t;
                      F[a][b] = f;
                  }
              }
              return T[0][m - 1];
          }
        `,
        java: code`
          public static int countWays(String s) {
              final int MOD = 1003;
              int m = (s.length() + 1) / 2;
              int[][] T = new int[m][m], F = new int[m][m];
              for (int i = 0; i < m; i++) {
                  if (s.charAt(2 * i) == 'T') T[i][i] = 1; else F[i][i] = 1;
              }
              for (int len = 2; len <= m; len++) {
                  for (int a = 0; a + len - 1 < m; a++) {
                      int b = a + len - 1;
                      int t = 0, f = 0;
                      for (int k = a; k < b; k++) {
                          int lt = T[a][k], lf = F[a][k], rt = T[k + 1][b], rf = F[k + 1][b];
                          char op = s.charAt(2 * k + 1);
                          if (op == '&') {
                              t += lt * rt;
                              f += lt * rf + lf * rt + lf * rf;
                          } else if (op == '|') {
                              t += lt * rt + lt * rf + lf * rt;
                              f += lf * rf;
                          } else {
                              t += lt * rf + lf * rt;
                              f += lt * rt + lf * rf;
                          }
                          t %= MOD;
                          f %= MOD;
                      }
                      T[a][b] = t;
                      F[a][b] = f;
                  }
              }
              return T[0][m - 1];
          }
        `,
        cpp: code`
          int countWays(string s) {
              const int MOD = 1003;
              int m = (s.size() + 1) / 2;
              vector<vector<int>> T(m, vector<int>(m, 0)), F(m, vector<int>(m, 0));
              for (int i = 0; i < m; i++) {
                  if (s[2 * i] == 'T') T[i][i] = 1; else F[i][i] = 1;
              }
              for (int len = 2; len <= m; len++) {
                  for (int a = 0; a + len - 1 < m; a++) {
                      int b = a + len - 1;
                      int t = 0, f = 0;
                      for (int k = a; k < b; k++) {
                          int lt = T[a][k], lf = F[a][k], rt = T[k + 1][b], rf = F[k + 1][b];
                          char op = s[2 * k + 1];
                          if (op == '&') {
                              t += lt * rt;
                              f += lt * rf + lf * rt + lf * rf;
                          } else if (op == '|') {
                              t += lt * rt + lt * rf + lf * rt;
                              f += lf * rf;
                          } else {
                              t += lt * rf + lf * rt;
                              f += lt * rt + lf * rf;
                          }
                          t %= MOD;
                          f %= MOD;
                      }
                      T[a][b] = t;
                      F[a][b] = f;
                  }
              }
              return T[0][m - 1];
          }
        `,
        c: code`
          int countWays(const char* s) {
              const int MOD = 1003;
              int m = ((int) strlen(s) + 1) / 2;
              int* T = (int*) calloc((size_t) m * m, sizeof(int));
              int* F = (int*) calloc((size_t) m * m, sizeof(int));
              for (int i = 0; i < m; i++) {
                  if (s[2 * i] == 'T') T[i * m + i] = 1; else F[i * m + i] = 1;
              }
              for (int len = 2; len <= m; len++) {
                  for (int a = 0; a + len - 1 < m; a++) {
                      int b = a + len - 1;
                      int t = 0, f = 0;
                      for (int k = a; k < b; k++) {
                          int lt = T[a * m + k], lf = F[a * m + k], rt = T[(k + 1) * m + b], rf = F[(k + 1) * m + b];
                          char op = s[2 * k + 1];
                          if (op == '&') {
                              t += lt * rt;
                              f += lt * rf + lf * rt + lf * rf;
                          } else if (op == '|') {
                              t += lt * rt + lt * rf + lf * rt;
                              f += lf * rf;
                          } else {
                              t += lt * rf + lf * rt;
                              f += lt * rt + lf * rf;
                          }
                          t %= MOD;
                          f %= MOD;
                      }
                      T[a * m + b] = t;
                      F[a * m + b] = f;
                  }
              }
              int ans = T[m - 1];
              free(T);
              free(F);
              return ans;
          }
        `,
        csharp: code`
          public static int CountWays(string s)
          {
              const int MOD = 1003;
              int m = (s.Length + 1) / 2;
              int[,] T = new int[m, m], F = new int[m, m];
              for (int i = 0; i < m; i++)
              {
                  if (s[2 * i] == 'T') T[i, i] = 1; else F[i, i] = 1;
              }
              for (int len = 2; len <= m; len++)
              {
                  for (int a = 0; a + len - 1 < m; a++)
                  {
                      int b = a + len - 1;
                      int t = 0, f = 0;
                      for (int k = a; k < b; k++)
                      {
                          int lt = T[a, k], lf = F[a, k], rt = T[k + 1, b], rf = F[k + 1, b];
                          char op = s[2 * k + 1];
                          if (op == '&')
                          {
                              t += lt * rt;
                              f += lt * rf + lf * rt + lf * rf;
                          }
                          else if (op == '|')
                          {
                              t += lt * rt + lt * rf + lf * rt;
                              f += lf * rf;
                          }
                          else
                          {
                              t += lt * rf + lf * rt;
                              f += lt * rt + lf * rf;
                          }
                          t %= MOD;
                          f %= MOD;
                      }
                      T[a, b] = t;
                      F[a, b] = f;
                  }
              }
              return T[0, m - 1];
          }
        `,
        go: code`
          func countWays(s string) int {
              const mod = 1003
              m := (len(s) + 1) / 2
              T := make([][]int, m)
              F := make([][]int, m)
              for i := 0; i < m; i++ {
                  T[i] = make([]int, m)
                  F[i] = make([]int, m)
                  if s[2*i] == 'T' {
                      T[i][i] = 1
                  } else {
                      F[i][i] = 1
                  }
              }
              for length := 2; length <= m; length++ {
                  for a := 0; a+length-1 < m; a++ {
                      b := a + length - 1
                      t, f := 0, 0
                      for k := a; k < b; k++ {
                          lt, lf, rt, rf := T[a][k], F[a][k], T[k+1][b], F[k+1][b]
                          switch s[2*k+1] {
                          case '&':
                              t += lt * rt
                              f += lt*rf + lf*rt + lf*rf
                          case '|':
                              t += lt*rt + lt*rf + lf*rt
                              f += lf * rf
                          default:
                              t += lt*rf + lf*rt
                              f += lt*rt + lf*rf
                          }
                          t %= mod
                          f %= mod
                      }
                      T[a][b] = t
                      F[a][b] = f
                  }
              }
              return T[0][m-1]
          }
        `,
        kotlin: code`
          fun countWays(s: String): Int {
              val modulus = 1003
              val m = (s.length + 1) / 2
              val T = Array(m) { IntArray(m) }
              val F = Array(m) { IntArray(m) }
              for (i in 0 until m) {
                  if (s[2 * i] == 'T') T[i][i] = 1 else F[i][i] = 1
              }
              for (len in 2..m) {
                  for (a in 0..(m - len)) {
                      val b = a + len - 1
                      var t = 0
                      var f = 0
                      for (k in a until b) {
                          val lt = T[a][k]
                          val lf = F[a][k]
                          val rt = T[k + 1][b]
                          val rf = F[k + 1][b]
                          when (s[2 * k + 1]) {
                              '&' -> { t += lt * rt; f += lt * rf + lf * rt + lf * rf }
                              '|' -> { t += lt * rt + lt * rf + lf * rt; f += lf * rf }
                              else -> { t += lt * rf + lf * rt; f += lt * rt + lf * rf }
                          }
                          t %= modulus
                          f %= modulus
                      }
                      T[a][b] = t
                      F[a][b] = f
                  }
              }
              return T[0][m - 1]
          }
        `,
        swift: code`
          func countWays(_ s: String) -> Int {
              let modulus = 1003
              let c = Array(s.utf8)
              let m = (c.count + 1) / 2
              var T = [[Int]](repeating: [Int](repeating: 0, count: m), count: m)
              var F = [[Int]](repeating: [Int](repeating: 0, count: m), count: m)
              let tByte = UInt8(ascii: "T"), andByte = UInt8(ascii: "&"), orByte = UInt8(ascii: "|")
              for i in 0..<m {
                  if c[2 * i] == tByte { T[i][i] = 1 } else { F[i][i] = 1 }
              }
              if m >= 2 {
                  for len in 2...m {
                      for a in 0...(m - len) {
                          let b = a + len - 1
                          var t = 0, f = 0
                          for k in a..<b {
                              let lt = T[a][k], lf = F[a][k], rt = T[k + 1][b], rf = F[k + 1][b]
                              let op = c[2 * k + 1]
                              if op == andByte {
                                  t += lt * rt
                                  f += lt * rf + lf * rt + lf * rf
                              } else if op == orByte {
                                  t += lt * rt + lt * rf + lf * rt
                                  f += lf * rf
                              } else {
                                  t += lt * rf + lf * rt
                                  f += lt * rt + lf * rf
                              }
                              t %= modulus
                              f %= modulus
                          }
                          T[a][b] = t
                          F[a][b] = f
                      }
                  }
              }
              return T[0][m - 1]
          }
        `,
        rust: code`
          fn countWays(s: String) -> i32 {
              let modulus = 1003i64;
              let c = s.as_bytes();
              let m = (c.len() + 1) / 2;
              let mut t_cnt = vec![vec![0i64; m]; m];
              let mut f_cnt = vec![vec![0i64; m]; m];
              for i in 0..m {
                  if c[2 * i] == b'T' {
                      t_cnt[i][i] = 1;
                  } else {
                      f_cnt[i][i] = 1;
                  }
              }
              for len in 2..=m {
                  for a in 0..=(m - len) {
                      let b = a + len - 1;
                      let mut t = 0i64;
                      let mut f = 0i64;
                      for k in a..b {
                          let (lt, lf, rt, rf) = (t_cnt[a][k], f_cnt[a][k], t_cnt[k + 1][b], f_cnt[k + 1][b]);
                          match c[2 * k + 1] {
                              b'&' => {
                                  t += lt * rt;
                                  f += lt * rf + lf * rt + lf * rf;
                              }
                              b'|' => {
                                  t += lt * rt + lt * rf + lf * rt;
                                  f += lf * rf;
                              }
                              _ => {
                                  t += lt * rf + lf * rt;
                                  f += lt * rt + lf * rf;
                              }
                          }
                          t %= modulus;
                          f %= modulus;
                      }
                      t_cnt[a][b] = t;
                      f_cnt[a][b] = f;
                  }
              }
              t_cnt[0][m - 1] as i32
          }
        `,
        php: code`
          function countWays($s) {
              $MOD = 1003;
              $m = intdiv(strlen($s) + 1, 2);
              $T = array_fill(0, $m, array_fill(0, $m, 0));
              $F = array_fill(0, $m, array_fill(0, $m, 0));
              for ($i = 0; $i < $m; $i++) {
                  if ($s[2 * $i] === 'T') $T[$i][$i] = 1; else $F[$i][$i] = 1;
              }
              for ($len = 2; $len <= $m; $len++) {
                  for ($a = 0; $a + $len - 1 < $m; $a++) {
                      $b = $a + $len - 1;
                      $t = 0;
                      $f = 0;
                      for ($k = $a; $k < $b; $k++) {
                          $lt = $T[$a][$k]; $lf = $F[$a][$k]; $rt = $T[$k + 1][$b]; $rf = $F[$k + 1][$b];
                          $op = $s[2 * $k + 1];
                          if ($op === '&') {
                              $t += $lt * $rt;
                              $f += $lt * $rf + $lf * $rt + $lf * $rf;
                          } elseif ($op === '|') {
                              $t += $lt * $rt + $lt * $rf + $lf * $rt;
                              $f += $lf * $rf;
                          } else {
                              $t += $lt * $rf + $lf * $rt;
                              $f += $lt * $rt + $lf * $rf;
                          }
                          $t %= $MOD;
                          $f %= $MOD;
                      }
                      $T[$a][$b] = $t;
                      $F[$a][$b] = $f;
                  }
              }
              return $T[0][$m - 1];
          }
        `,
        ruby: code`
          def countWays(s)
            mod = 1003
            m = (s.length + 1) / 2
            t_cnt = Array.new(m) { Array.new(m, 0) }
            f_cnt = Array.new(m) { Array.new(m, 0) }
            m.times do |i|
              if s[2 * i] == 'T'
                t_cnt[i][i] = 1
              else
                f_cnt[i][i] = 1
              end
            end
            (2..m).each do |len|
              (0..(m - len)).each do |a|
                b = a + len - 1
                t = 0
                f = 0
                (a...b).each do |k|
                  lt = t_cnt[a][k]
                  lf = f_cnt[a][k]
                  rt = t_cnt[k + 1][b]
                  rf = f_cnt[k + 1][b]
                  case s[2 * k + 1]
                  when '&'
                    t += lt * rt
                    f += lt * rf + lf * rt + lf * rf
                  when '|'
                    t += lt * rt + lt * rf + lf * rt
                    f += lf * rf
                  else
                    t += lt * rf + lf * rt
                    f += lt * rt + lf * rf
                  end
                  t %= mod
                  f %= mod
                end
                t_cnt[a][b] = t
                f_cnt[a][b] = f
              end
            end
            t_cnt[0][m - 1]
          end
        `,
      },
    };
  })(),

  // ── Optimal Strategy For A Game (GFG) ────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const memo = new Map<number, number>();
      const go = (i: number, j: number): number => {
        if (i > j) return 0;
        const key = i * 1000 + j;
        if (memo.has(key)) return memo.get(key)!;
        // I pick, then the opponent picks to leave me the worse remainder.
        const takeLeft = arr[i] + Math.min(go(i + 2, j), go(i + 1, j - 1));
        const takeRight = arr[j] + Math.min(go(i + 1, j - 1), go(i, j - 2));
        const b = Math.max(takeLeft, takeRight);
        memo.set(key, b);
        return b;
      };
      return go(0, arr.length - 1);
    };
    return {
      slug: "optimal-strategy-for-a-game",
      title: "Optimal Strategy For A Game",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Game Theory", "Amazon", "Microsoft", "Morgan Stanley"],
      signature: { funcName: "maximumAmount", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Coins of values `arr[0], arr[1], …, arr[n - 1]` lie in a row, where `n` is **even**. You and an opponent take turns, and you move first. On each turn a player removes **either the leftmost or the rightmost** remaining coin and keeps its value.\n\nThe opponent is just as clever as you: every choice they make is the one that is best for them.\n\nReturn the **maximum** total value you can guarantee to collect.",
        [
          { in: "arr = [5,3,7,10]", out: "15", note: "Take 10; whichever end the opponent takes (5 or 7), you then take 5 — 10 + 5 = 15. Starting with 5 would let the opponent take 10." },
          { in: "arr = [8,15,3,7]", out: "22", note: "Take 7; the opponent takes 8 or 3, and you then take 15 — 7 + 15 = 22." },
          { in: "arr = [2,2]", out: "2" },
        ],
        ["2 <= n <= 1000", "n is even", "1 <= arr[i] <= 10^6"]),
      hints: [
        "Greedily taking the larger end coin fails: in `[8,15,3,7]`, grabbing the 8 hands the 15 to the opponent.",
        "After any sequence of moves, the coins left always form a contiguous block `arr[i..j]`. Define the best you can do on such a block when it is your turn.",
        "Both players play optimally, so on a block the player to move collects `sum(i..j) - (what the opponent collects on the block left after the move)`. That gives `best[i][j] = sum(i..j) - min(best[i+1][j], best[i][j-1])`.",
      ],
      editorial: explain({
        idea: "The game state is just the remaining block `i..j` and whose turn it is — and since both players reason identically, one function `best[i][j]` (the most the player to move can collect from `i..j`) describes both. The mover gets the whole block minus whatever the opponent manages to collect afterwards.",
        steps: [
          "Build prefix sums so `sum(i..j)` is `O(1)`.",
          "For a single coin, `best[i][i] = arr[i]`.",
          "For longer blocks (by increasing length): `best[i][j] = sum(i..j) - min(best[i + 1][j], best[i][j - 1])` — take the end that leaves the opponent the smaller optimum.",
          "Return `best[0][n - 1]`.",
        ],
        why: "The two players' totals on a block always add up to the block's sum. If the mover takes `arr[i]`, the opponent becomes the mover on `i+1..j` and collects `best[i+1][j]`, so the first player ends with `sum(i..j) - best[i+1][j]`; symmetrically for `arr[j]`. Maximising the mover's share is minimising what the opponent gets, which is exactly the recurrence. Induction on block length proves each `best[i][j]` optimal.",
        time: "O(n^2)",
        space: "O(n^2) (or O(n) with a rolling row)",
        pitfalls: [
          "Assuming the opponent plays greedily — they play optimally, which is what makes the `min` correct.",
          "The classic formulation `arr[i] + min(best[i+2][j], best[i+1][j-1])` is equivalent but easier to get wrong at the borders.",
          "The total of all coins is at most `1000 * 10^6 = 10^9`, which still fits in 32 bits.",
        ],
      }),
      examples: [
        { input: "[5,3,7,10]", expectedOutput: "15" },
        { input: "[8,15,3,7]", expectedOutput: "22" },
        { input: "[2,2]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = 2 * ri(rng, 1, pick(rng, [1, 3, 6, 12, 20]));
        const top = pick(rng, [3, 20, 1000, 1000000]);
        const arr = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumAmount(arr: List[int]) -> int:
              n = len(arr)
              pre = [0] * (n + 1)
              for i, v in enumerate(arr):
                  pre[i + 1] = pre[i] + v
              best = arr[:]  # best[i] for the current length, block i..i+len-1
              for length in range(2, n + 1):
                  nxt = [0] * (n - length + 1)
                  for i in range(n - length + 1):
                      j = i + length - 1
                      nxt[i] = pre[j + 1] - pre[i] - min(best[i + 1], best[i])
                  best = nxt
              return best[0]
        `,
        javascript: code`
          var maximumAmount = function(arr) {
              var n = arr.length;
              var pre = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + arr[i]);
              var best = arr.slice();
              for (var len = 2; len <= n; len++) {
                  var next = [];
                  for (var a = 0; a + len - 1 < n; a++) {
                      var b = a + len - 1;
                      next.push(pre[b + 1] - pre[a] - Math.min(best[a + 1], best[a]));
                  }
                  best = next;
              }
              return best[0];
          };
        `,
        typescript: code`
          function maximumAmount(arr: number[]): number {
              var n = arr.length;
              var pre: number[] = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + arr[i]);
              var best: number[] = arr.slice();
              for (var len = 2; len <= n; len++) {
                  var next: number[] = [];
                  for (var a = 0; a + len - 1 < n; a++) {
                      var b = a + len - 1;
                      next.push(pre[b + 1] - pre[a] - Math.min(best[a + 1], best[a]));
                  }
                  best = next;
              }
              return best[0];
          }
        `,
        java: code`
          public static int maximumAmount(int[] arr) {
              int n = arr.length;
              long[] pre = new long[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + arr[i];
              long[] best = new long[n];
              for (int i = 0; i < n; i++) best[i] = arr[i];
              for (int len = 2; len <= n; len++) {
                  for (int a = 0; a + len - 1 < n; a++) {
                      int b = a + len - 1;
                      best[a] = pre[b + 1] - pre[a] - Math.min(best[a + 1], best[a]);
                  }
              }
              return (int) best[0];
          }
        `,
        cpp: code`
          int maximumAmount(vector<int>& arr) {
              int n = arr.size();
              vector<long long> pre(n + 1, 0), best(arr.begin(), arr.end());
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + arr[i];
              for (int len = 2; len <= n; len++) {
                  for (int a = 0; a + len - 1 < n; a++) {
                      int b = a + len - 1;
                      best[a] = pre[b + 1] - pre[a] - min(best[a + 1], best[a]);
                  }
              }
              return (int) best[0];
          }
        `,
        c: code`
          int maximumAmount(int* arr, int arrSize) {
              int n = arrSize;
              long long* pre = (long long*) calloc((size_t) (n + 1), sizeof(long long));
              long long* best = (long long*) malloc((size_t) n * sizeof(long long));
              for (int i = 0; i < n; i++) {
                  pre[i + 1] = pre[i] + arr[i];
                  best[i] = arr[i];
              }
              for (int len = 2; len <= n; len++) {
                  for (int a = 0; a + len - 1 < n; a++) {
                      int b = a + len - 1;
                      long long m = best[a + 1] < best[a] ? best[a + 1] : best[a];
                      best[a] = pre[b + 1] - pre[a] - m;
                  }
              }
              int ans = (int) best[0];
              free(pre);
              free(best);
              return ans;
          }
        `,
        csharp: code`
          public static int MaximumAmount(int[] arr)
          {
              int n = arr.Length;
              long[] pre = new long[n + 1];
              long[] best = new long[n];
              for (int i = 0; i < n; i++)
              {
                  pre[i + 1] = pre[i] + arr[i];
                  best[i] = arr[i];
              }
              for (int len = 2; len <= n; len++)
              {
                  for (int a = 0; a + len - 1 < n; a++)
                  {
                      int b = a + len - 1;
                      best[a] = pre[b + 1] - pre[a] - Math.Min(best[a + 1], best[a]);
                  }
              }
              return (int) best[0];
          }
        `,
        go: code`
          func maximumAmount(arr []int) int {
              n := len(arr)
              pre := make([]int, n+1)
              best := make([]int, n)
              for i := 0; i < n; i++ {
                  pre[i+1] = pre[i] + arr[i]
                  best[i] = arr[i]
              }
              for length := 2; length <= n; length++ {
                  for a := 0; a+length-1 < n; a++ {
                      b := a + length - 1
                      m := best[a]
                      if best[a+1] < m {
                          m = best[a+1]
                      }
                      best[a] = pre[b+1] - pre[a] - m
                  }
              }
              return best[0]
          }
        `,
        kotlin: code`
          fun maximumAmount(arr: IntArray): Int {
              val n = arr.size
              val pre = LongArray(n + 1)
              val best = LongArray(n)
              for (i in 0 until n) {
                  pre[i + 1] = pre[i] + arr[i]
                  best[i] = arr[i].toLong()
              }
              for (len in 2..n) {
                  for (a in 0..(n - len)) {
                      val b = a + len - 1
                      best[a] = pre[b + 1] - pre[a] - minOf(best[a + 1], best[a])
                  }
              }
              return best[0].toInt()
          }
        `,
        swift: code`
          func maximumAmount(_ arr: [Int]) -> Int {
              let n = arr.count
              var pre = [Int](repeating: 0, count: n + 1)
              for i in 0..<n { pre[i + 1] = pre[i] + arr[i] }
              var best = arr
              if n >= 2 {
                  for len in 2...n {
                      for a in 0...(n - len) {
                          let b = a + len - 1
                          best[a] = pre[b + 1] - pre[a] - min(best[a + 1], best[a])
                      }
                  }
              }
              return best[0]
          }
        `,
        rust: code`
          fn maximumAmount(arr: Vec<i32>) -> i32 {
              let n = arr.len();
              let mut pre = vec![0i64; n + 1];
              let mut best: Vec<i64> = arr.iter().map(|&v| v as i64).collect();
              for i in 0..n {
                  pre[i + 1] = pre[i] + arr[i] as i64;
              }
              for len in 2..=n {
                  for a in 0..=(n - len) {
                      let b = a + len - 1;
                      best[a] = pre[b + 1] - pre[a] - best[a + 1].min(best[a]);
                  }
              }
              best[0] as i32
          }
        `,
        php: code`
          function maximumAmount($arr) {
              $n = count($arr);
              $pre = [0];
              for ($i = 0; $i < $n; $i++) $pre[] = $pre[$i] + $arr[$i];
              $best = $arr;
              for ($len = 2; $len <= $n; $len++) {
                  for ($a = 0; $a + $len - 1 < $n; $a++) {
                      $b = $a + $len - 1;
                      $best[$a] = $pre[$b + 1] - $pre[$a] - min($best[$a + 1], $best[$a]);
                  }
              }
              return $best[0];
          }
        `,
        ruby: code`
          def maximumAmount(arr)
            n = arr.length
            pre = [0]
            arr.each { |v| pre << pre[-1] + v }
            best = arr.dup
            (2..n).each do |len|
              (0..(n - len)).each do |a|
                b = a + len - 1
                m = best[a + 1] < best[a] ? best[a + 1] : best[a]
                best[a] = pre[b + 1] - pre[a] - m
              end
            end
            best[0]
          end
        `,
      },
    };
  })(),

  // ── Word Wrap (GFG) ──────────────────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      const memo = new Map<number, number>();
      const go = (i: number): number => {
        if (i === n) return 0;
        if (memo.has(i)) return memo.get(i)!;
        let b = Infinity;
        let len = -1;
        for (let j = i; j < n; j++) {
          len += nums[j] + 1;
          if (len > k) break;
          const cost = j === n - 1 ? 0 : (k - len) * (k - len) + go(j + 1);
          b = Math.min(b, cost);
        }
        memo.set(i, b);
        return b;
      };
      return go(0);
    };
    return {
      slug: "word-wrap",
      title: "Word Wrap",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Microsoft", "Amazon", "Flipkart"],
      signature: {
        funcName: "solveWordWrap",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A paragraph of `n` words is to be printed on lines of width `k`. Word `i` is `nums[i]` characters long, the words must stay in their given order, and two words on the same line are separated by exactly **one** space. Every word fits on a line by itself (`nums[i] <= k`).\n\nIf a line holds words `i..j`, it uses `nums[i] + … + nums[j] + (j - i)` characters, and the remaining `k` minus that are its **extra spaces**. The cost of a line is the *square* of its extra spaces — except the **last line**, which costs nothing.\n\nChoose where to break lines so the total cost is as small as possible, and return that minimum.",
        [
          { in: "nums = [3,2,2,5], k = 6", out: "10", note: "Lines [3], [2,2], [5]: the first has 3 extra spaces (cost 9), the second uses 2 + 1 + 2 = 5 characters (cost 1), and the last line is free. Total 10." },
          { in: "nums = [3,2,2], k = 4", out: "5", note: "[3] costs 1; [2,2] would need 5 characters, so [2] costs 4; the last [2] is free." },
          { in: "nums = [5], k = 5", out: "0", note: "A single line is the last line." },
        ],
        ["1 <= n <= 500", "1 <= nums[i] <= 1000", "max(nums) <= k <= 2000"]),
      hints: [
        "Filling each line as much as possible (greedy) is not optimal when the cost is squared — spreading the slack evenly is cheaper.",
        "Decide the first line: it holds words `0..j` for some `j`. The rest of the paragraph is the same problem starting at word `j + 1`.",
        "Let `best[i]` be the minimum cost to print words `i..n-1`. Try every `j` while the line still fits; a line that reaches the last word costs `0`, otherwise `(k - len)^2 + best[j + 1]`.",
      ],
      editorial: explain({
        idea: "A layout is a sequence of lines, and once the first line is fixed, the rest is an independent smaller paragraph. So define the cost of laying out a suffix of the words, and fill it from the end.",
        steps: [
          "Set `best[n] = 0`.",
          "For `i` from `n - 1` down to `0`: extend a line from word `i` one word at a time, keeping its length `len`; stop once `len > k`.",
          "For each end `j` that fits: if `j` is the last word the line is free, otherwise it costs `(k - len)^2 + best[j + 1]`. Keep the minimum as `best[i]`.",
          "Return `best[0]`.",
        ],
        why: "Every valid layout of words `i..n-1` starts with a line `i..j` that fits, followed by a valid layout of `j+1..n-1`; its cost is the first line's cost plus that layout's cost, which is at least `best[j + 1]`. Trying every feasible `j` therefore finds the optimum, and the last line is recognised as the one that contains word `n - 1`.",
        time: "O(n^2) (a line holds at most `k / 2` words, so `O(n * k)` too)",
        space: "O(n)",
        pitfalls: [
          "The last line is free even if it is almost empty — don't charge it.",
          "Separating spaces count towards the line length: `len` grows by `nums[j] + 1` per word after the first.",
          "The total stays below `500 * 1999^2 < 2^31`, but a careless sentinel like `INT_MAX` plus a cost overflows — compare before adding.",
        ],
      }),
      examples: [
        { input: "[3,2,2,5]\n6", expectedOutput: "10" },
        { input: "[3,2,2]\n4", expectedOutput: "5" },
        { input: "[5]\n5", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 20, 35]));
        const top = pick(rng, [3, 8, 30, 1000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const mx = Math.max(...nums);
        const k = Math.min(2000, mx + ri(rng, 0, pick(rng, [0, 3, 10, 40, 1000])));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def solveWordWrap(nums: List[int], k: int) -> int:
              n = len(nums)
              best = [0] * (n + 1)
              for i in range(n - 1, -1, -1):
                  top = None
                  length = -1
                  for j in range(i, n):
                      length += nums[j] + 1
                      if length > k:
                          break
                      cost = 0 if j == n - 1 else (k - length) ** 2 + best[j + 1]
                      if top is None or cost < top:
                          top = cost
                  best[i] = top
              return best[0]
        `,
        javascript: code`
          var solveWordWrap = function(nums, k) {
              var n = nums.length;
              var best = new Array(n + 1).fill(0);
              for (var i = n - 1; i >= 0; i--) {
                  var top = Infinity;
                  var len = -1;
                  for (var j = i; j < n; j++) {
                      len += nums[j] + 1;
                      if (len > k) break;
                      var cost = j === n - 1 ? 0 : (k - len) * (k - len) + best[j + 1];
                      if (cost < top) top = cost;
                  }
                  best[i] = top;
              }
              return best[0];
          };
        `,
        typescript: code`
          function solveWordWrap(nums: number[], k: number): number {
              var n = nums.length;
              var best: number[] = [];
              for (var t = 0; t <= n; t++) best.push(0);
              for (var i = n - 1; i >= 0; i--) {
                  var top = Infinity;
                  var len = -1;
                  for (var j = i; j < n; j++) {
                      len += nums[j] + 1;
                      if (len > k) break;
                      var cost = j === n - 1 ? 0 : (k - len) * (k - len) + best[j + 1];
                      if (cost < top) top = cost;
                  }
                  best[i] = top;
              }
              return best[0];
          }
        `,
        java: code`
          public static int solveWordWrap(int[] nums, int k) {
              int n = nums.length;
              long[] best = new long[n + 1];
              for (int i = n - 1; i >= 0; i--) {
                  long top = Long.MAX_VALUE;
                  int len = -1;
                  for (int j = i; j < n; j++) {
                      len += nums[j] + 1;
                      if (len > k) break;
                      long cost = j == n - 1 ? 0 : (long) (k - len) * (k - len) + best[j + 1];
                      if (cost < top) top = cost;
                  }
                  best[i] = top;
              }
              return (int) best[0];
          }
        `,
        cpp: code`
          int solveWordWrap(vector<int>& nums, int k) {
              int n = nums.size();
              vector<long long> best(n + 1, 0);
              for (int i = n - 1; i >= 0; i--) {
                  long long top = LLONG_MAX;
                  int len = -1;
                  for (int j = i; j < n; j++) {
                      len += nums[j] + 1;
                      if (len > k) break;
                      long long cost = j == n - 1 ? 0 : (long long) (k - len) * (k - len) + best[j + 1];
                      top = min(top, cost);
                  }
                  best[i] = top;
              }
              return (int) best[0];
          }
        `,
        c: code`
          int solveWordWrap(int* nums, int numsSize, int k) {
              int n = numsSize;
              long long* best = (long long*) calloc((size_t) (n + 1), sizeof(long long));
              for (int i = n - 1; i >= 0; i--) {
                  long long top = -1;
                  int len = -1;
                  for (int j = i; j < n; j++) {
                      len += nums[j] + 1;
                      if (len > k) break;
                      long long cost = j == n - 1 ? 0 : (long long) (k - len) * (k - len) + best[j + 1];
                      if (top < 0 || cost < top) top = cost;
                  }
                  best[i] = top;
              }
              int ans = (int) best[0];
              free(best);
              return ans;
          }
        `,
        csharp: code`
          public static int SolveWordWrap(int[] nums, int k)
          {
              int n = nums.Length;
              long[] best = new long[n + 1];
              for (int i = n - 1; i >= 0; i--)
              {
                  long top = long.MaxValue;
                  int len = -1;
                  for (int j = i; j < n; j++)
                  {
                      len += nums[j] + 1;
                      if (len > k) break;
                      long cost = j == n - 1 ? 0 : (long) (k - len) * (k - len) + best[j + 1];
                      if (cost < top) top = cost;
                  }
                  best[i] = top;
              }
              return (int) best[0];
          }
        `,
        go: code`
          func solveWordWrap(nums []int, k int) int {
              n := len(nums)
              best := make([]int, n+1)
              for i := n - 1; i >= 0; i-- {
                  top := -1
                  length := -1
                  for j := i; j < n; j++ {
                      length += nums[j] + 1
                      if length > k {
                          break
                      }
                      cost := 0
                      if j != n-1 {
                          cost = (k-length)*(k-length) + best[j+1]
                      }
                      if top < 0 || cost < top {
                          top = cost
                      }
                  }
                  best[i] = top
              }
              return best[0]
          }
        `,
        kotlin: code`
          fun solveWordWrap(nums: IntArray, k: Int): Int {
              val n = nums.size
              val best = LongArray(n + 1)
              for (i in n - 1 downTo 0) {
                  var top = Long.MAX_VALUE
                  var len = -1
                  for (j in i until n) {
                      len += nums[j] + 1
                      if (len > k) break
                      val cost = if (j == n - 1) 0L else (k - len).toLong() * (k - len) + best[j + 1]
                      if (cost < top) top = cost
                  }
                  best[i] = top
              }
              return best[0].toInt()
          }
        `,
        swift: code`
          func solveWordWrap(_ nums: [Int], _ k: Int) -> Int {
              let n = nums.count
              var best = [Int](repeating: 0, count: n + 1)
              for i in stride(from: n - 1, through: 0, by: -1) {
                  var top = Int.max
                  var len = -1
                  for j in i..<n {
                      len += nums[j] + 1
                      if len > k { break }
                      let cost = j == n - 1 ? 0 : (k - len) * (k - len) + best[j + 1]
                      if cost < top { top = cost }
                  }
                  best[i] = top
              }
              return best[0]
          }
        `,
        rust: code`
          fn solveWordWrap(nums: Vec<i32>, k: i32) -> i32 {
              let n = nums.len();
              let mut best = vec![0i64; n + 1];
              for i in (0..n).rev() {
                  let mut top = std::i64::MAX;
                  let mut len: i64 = -1;
                  for j in i..n {
                      len += nums[j] as i64 + 1;
                      if len > k as i64 {
                          break;
                      }
                      let slack = k as i64 - len;
                      let cost = if j == n - 1 { 0 } else { slack * slack + best[j + 1] };
                      if cost < top {
                          top = cost;
                      }
                  }
                  best[i] = top;
              }
              best[0] as i32
          }
        `,
        php: code`
          function solveWordWrap($nums, $k) {
              $n = count($nums);
              $best = array_fill(0, $n + 1, 0);
              for ($i = $n - 1; $i >= 0; $i--) {
                  $top = PHP_INT_MAX;
                  $len = -1;
                  for ($j = $i; $j < $n; $j++) {
                      $len += $nums[$j] + 1;
                      if ($len > $k) break;
                      $cost = $j == $n - 1 ? 0 : ($k - $len) * ($k - $len) + $best[$j + 1];
                      if ($cost < $top) $top = $cost;
                  }
                  $best[$i] = $top;
              }
              return $best[0];
          }
        `,
        ruby: code`
          def solveWordWrap(nums, k)
            n = nums.length
            best = Array.new(n + 1, 0)
            (n - 1).downto(0) do |i|
              top = nil
              len = -1
              (i...n).each do |j|
                len += nums[j] + 1
                break if len > k
                cost = j == n - 1 ? 0 : (k - len) * (k - len) + best[j + 1]
                top = cost if top.nil? || cost < top
              end
              best[i] = top
            end
            best[0]
          end
        `,
      },
    };
  })(),

  // ── Longest Repeating Subsequence (GFG) ──────────────────────────
  (() => {
    const ref = (s: string) => {
      const n = s.length;
      const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= n; j++) {
          dp[i][j] = s[i - 1] === s[j - 1] && i !== j ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
      return dp[n][n];
    };
    return {
      slug: "longest-repeating-subsequence",
      title: "Longest Repeating Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Microsoft", "Paytm"],
      signature: { funcName: "longestRepeatingSubsequence", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s`, find the length of the longest subsequence that occurs **twice** in `s` such that the two occurrences never use the same position for the same character.\n\nFormally, you need two increasing index sequences `i1 < i2 < … < iL` and `j1 < j2 < … < jL` with `s[ia] == s[ja]` and `ia != ja` for every `a`. The two sequences may otherwise share positions. Return the largest possible `L`; if no character repeats, the answer is `0`.",
        [
          { in: "s = \"axxzxy\"", out: "2", note: "\"xx\" occurs at indices (1, 2) and (2, 4): at each step the two occurrences use different positions." },
          { in: "s = \"aabb\"", out: "2", note: "\"ab\" occurs at (0, 2) and (1, 3)." },
          { in: "s = \"abc\"", out: "0", note: "No character appears twice." },
        ],
        ["1 <= s.length <= 1000", "s consists of lowercase English letters"]),
      hints: [
        "Think of matching `s` against a copy of itself, like the longest common subsequence of two strings.",
        "The one extra rule: a character may not be matched with *itself* — position `i` in the first copy may not pair with position `i` in the second.",
        "Run the LCS table on `(s, s)` and only take the diagonal step `dp[i-1][j-1] + 1` when `s[i-1] == s[j-1]` **and** `i != j`.",
      ],
      editorial: explain({
        idea: "Two occurrences of a subsequence in `s` are a common subsequence of `s` and `s` whose matched positions differ pairwise. So it is the longest common subsequence of the string with itself, forbidding a match of a position with itself.",
        steps: [
          "Create `dp[0..n][0..n]` of zeros.",
          "For `i, j` from 1 to `n`: if `s[i-1] == s[j-1]` and `i != j`, `dp[i][j] = dp[i-1][j-1] + 1`; otherwise `dp[i][j] = max(dp[i-1][j], dp[i][j-1])`.",
          "Return `dp[n][n]`.",
        ],
        why: "`dp[i][j]` is the longest pair of occurrences drawn from prefix `s[0..i)` for the first and `s[0..j)` for the second, with no position paired to itself. The usual LCS argument applies — the last characters either pair together or one of them is unused — and the `i != j` test excludes exactly the forbidden self-pairing.",
        time: "O(n^2)",
        space: "O(n^2) (O(n) with two rows)",
        pitfalls: [
          "Without the `i != j` test, every string's answer would be `n` (the string matches itself).",
          "The two occurrences *may* share positions as long as they never share the same position at the same step: in \"axxxy\" the answer is 2 (\"xx\" at (1,2) and (2,3)).",
          "This is a subsequence problem, not a substring one — characters need not be adjacent.",
        ],
      }),
      examples: [
        { input: "\"axxzxy\"", expectedOutput: "2" },
        { input: "\"aabb\"", expectedOutput: "2" },
        { input: "\"abc\"", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcdef", "abcdefghijklmnopqrstuvwxyz"]);
        const s = randLower(rng, 1, pick(rng, [1, 4, 12, 30]), alpha);
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def longestRepeatingSubsequence(s: str) -> int:
              n = len(s)
              prev = [0] * (n + 1)
              for i in range(1, n + 1):
                  cur = [0] * (n + 1)
                  ci = s[i - 1]
                  for j in range(1, n + 1):
                      if ci == s[j - 1] and i != j:
                          cur[j] = prev[j - 1] + 1
                      else:
                          cur[j] = prev[j] if prev[j] > cur[j - 1] else cur[j - 1]
                  prev = cur
              return prev[n]
        `,
        javascript: code`
          var longestRepeatingSubsequence = function(s) {
              var n = s.length;
              var prev = new Array(n + 1).fill(0);
              var cur = new Array(n + 1).fill(0);
              for (var i = 1; i <= n; i++) {
                  for (var j = 1; j <= n; j++) {
                      if (i !== j && s.charCodeAt(i - 1) === s.charCodeAt(j - 1)) cur[j] = prev[j - 1] + 1;
                      else cur[j] = Math.max(prev[j], cur[j - 1]);
                  }
                  var t = prev; prev = cur; cur = t;
              }
              return prev[n];
          };
        `,
        typescript: code`
          function longestRepeatingSubsequence(s: string): number {
              var n = s.length;
              var prev: number[] = [], cur: number[] = [];
              for (var k = 0; k <= n; k++) { prev.push(0); cur.push(0); }
              for (var i = 1; i <= n; i++) {
                  for (var j = 1; j <= n; j++) {
                      if (i !== j && s.charCodeAt(i - 1) === s.charCodeAt(j - 1)) cur[j] = prev[j - 1] + 1;
                      else cur[j] = Math.max(prev[j], cur[j - 1]);
                  }
                  var t = prev; prev = cur; cur = t;
              }
              return prev[n];
          }
        `,
        java: code`
          public static int longestRepeatingSubsequence(String s) {
              int n = s.length();
              int[] prev = new int[n + 1], cur = new int[n + 1];
              for (int i = 1; i <= n; i++) {
                  for (int j = 1; j <= n; j++) {
                      if (i != j && s.charAt(i - 1) == s.charAt(j - 1)) cur[j] = prev[j - 1] + 1;
                      else cur[j] = Math.max(prev[j], cur[j - 1]);
                  }
                  int[] t = prev; prev = cur; cur = t;
              }
              return prev[n];
          }
        `,
        cpp: code`
          int longestRepeatingSubsequence(string s) {
              int n = s.size();
              vector<int> prev(n + 1, 0), cur(n + 1, 0);
              for (int i = 1; i <= n; i++) {
                  for (int j = 1; j <= n; j++) {
                      if (i != j && s[i - 1] == s[j - 1]) cur[j] = prev[j - 1] + 1;
                      else cur[j] = max(prev[j], cur[j - 1]);
                  }
                  swap(prev, cur);
              }
              return prev[n];
          }
        `,
        c: code`
          int longestRepeatingSubsequence(const char* s) {
              int n = (int) strlen(s);
              int* prev = (int*) calloc((size_t) (n + 1), sizeof(int));
              int* cur = (int*) calloc((size_t) (n + 1), sizeof(int));
              for (int i = 1; i <= n; i++) {
                  for (int j = 1; j <= n; j++) {
                      if (i != j && s[i - 1] == s[j - 1]) cur[j] = prev[j - 1] + 1;
                      else cur[j] = prev[j] > cur[j - 1] ? prev[j] : cur[j - 1];
                  }
                  int* t = prev; prev = cur; cur = t;
              }
              int ans = prev[n];
              free(prev);
              free(cur);
              return ans;
          }
        `,
        csharp: code`
          public static int LongestRepeatingSubsequence(string s)
          {
              int n = s.Length;
              int[] prev = new int[n + 1], cur = new int[n + 1];
              for (int i = 1; i <= n; i++)
              {
                  for (int j = 1; j <= n; j++)
                  {
                      if (i != j && s[i - 1] == s[j - 1]) cur[j] = prev[j - 1] + 1;
                      else cur[j] = Math.Max(prev[j], cur[j - 1]);
                  }
                  int[] t = prev; prev = cur; cur = t;
              }
              return prev[n];
          }
        `,
        go: code`
          func longestRepeatingSubsequence(s string) int {
              n := len(s)
              prev := make([]int, n+1)
              cur := make([]int, n+1)
              for i := 1; i <= n; i++ {
                  for j := 1; j <= n; j++ {
                      if i != j && s[i-1] == s[j-1] {
                          cur[j] = prev[j-1] + 1
                      } else if prev[j] > cur[j-1] {
                          cur[j] = prev[j]
                      } else {
                          cur[j] = cur[j-1]
                      }
                  }
                  prev, cur = cur, prev
              }
              return prev[n]
          }
        `,
        kotlin: code`
          fun longestRepeatingSubsequence(s: String): Int {
              val n = s.length
              var prev = IntArray(n + 1)
              var cur = IntArray(n + 1)
              for (i in 1..n) {
                  for (j in 1..n) {
                      cur[j] = if (i != j && s[i - 1] == s[j - 1]) prev[j - 1] + 1 else maxOf(prev[j], cur[j - 1])
                  }
                  val t = prev; prev = cur; cur = t
              }
              return prev[n]
          }
        `,
        swift: code`
          func longestRepeatingSubsequence(_ s: String) -> Int {
              let c = Array(s.utf8)
              let n = c.count
              var prev = [Int](repeating: 0, count: n + 1)
              var cur = [Int](repeating: 0, count: n + 1)
              for i in stride(from: 1, through: n, by: 1) {
                  for j in 1...n {
                      if i != j && c[i - 1] == c[j - 1] { cur[j] = prev[j - 1] + 1 }
                      else { cur[j] = max(prev[j], cur[j - 1]) }
                  }
                  swap(&prev, &cur)
              }
              return prev[n]
          }
        `,
        rust: code`
          fn longestRepeatingSubsequence(s: String) -> i32 {
              let c = s.as_bytes();
              let n = c.len();
              let mut prev = vec![0i32; n + 1];
              let mut cur = vec![0i32; n + 1];
              for i in 1..=n {
                  for j in 1..=n {
                      cur[j] = if i != j && c[i - 1] == c[j - 1] { prev[j - 1] + 1 } else { prev[j].max(cur[j - 1]) };
                  }
                  std::mem::swap(&mut prev, &mut cur);
              }
              prev[n]
          }
        `,
        php: code`
          function longestRepeatingSubsequence($s) {
              $n = strlen($s);
              $prev = array_fill(0, $n + 1, 0);
              for ($i = 1; $i <= $n; $i++) {
                  $cur = array_fill(0, $n + 1, 0);
                  $ci = $s[$i - 1];
                  for ($j = 1; $j <= $n; $j++) {
                      if ($i != $j && $ci === $s[$j - 1]) $cur[$j] = $prev[$j - 1] + 1;
                      else $cur[$j] = max($prev[$j], $cur[$j - 1]);
                  }
                  $prev = $cur;
              }
              return $prev[$n];
          }
        `,
        ruby: code`
          def longestRepeatingSubsequence(s)
            c = s.bytes
            n = c.length
            prev = Array.new(n + 1, 0)
            (1..n).each do |i|
              cur = Array.new(n + 1, 0)
              ci = c[i - 1]
              (1..n).each do |j|
                if i != j && ci == c[j - 1]
                  cur[j] = prev[j - 1] + 1
                else
                  cur[j] = prev[j] > cur[j - 1] ? prev[j] : cur[j - 1]
                end
              end
              prev = cur
            end
            prev[n]
          end
        `,
      },
    };
  })(),

  // ── Shortest Common Supersequence Length (GFG) ───────────────────
  (() => {
    const ref = (s1: string, s2: string) => {
      const n = s1.length, m = s2.length;
      const dp: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          dp[i][j] = s1[i - 1] === s2[j - 1] ? dp[i - 1][j - 1] + 1 : Math.min(dp[i - 1][j], dp[i][j - 1]) + 1;
        }
      }
      return dp[n][m];
    };
    return {
      slug: "shortest-common-supersequence-length",
      title: "Shortest Common Supersequence Length",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Microsoft"],
      signature: {
        funcName: "shortestCommonSupersequence",
        params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given two strings `s1` and `s2`, return the length of the **shortest string that has both `s1` and `s2` as subsequences** (a *common supersequence*).\n\nA subsequence keeps characters in their original order but may skip any of them, so a supersequence of both strings must contain all of `s1`'s characters in order and all of `s2`'s characters in order, sharing characters where it can.",
        [
          { in: "s1 = \"abcd\", s2 = \"xycd\"", out: "6", note: "\"abxycd\" (or \"xyabcd\") contains both; \"cd\" is shared." },
          { in: "s1 = \"efgh\", s2 = \"jghi\"", out: "6", note: "\"ejfghi\" works: \"gh\" is shared." },
          { in: "s1 = \"geek\", s2 = \"eke\"", out: "5", note: "\"geeke\" contains \"geek\" and \"eke\"." },
        ],
        ["1 <= s1.length, s2.length <= 500", "s1 and s2 consist of lowercase English letters"]),
      hints: [
        "Writing `s1` followed by `s2` always works and has length `n + m`. How much can be saved?",
        "A character can be written once for both strings only if it is part of a sequence the two strings have in common, in order.",
        "The saving is exactly the length of the longest common subsequence: the answer is `n + m - LCS(s1, s2)`.",
      ],
      editorial: explain({
        idea: "In a common supersequence, every position is used by `s1`, by `s2`, or by both. The positions used by both spell out a common subsequence of the two strings, so at most `LCS` characters can be shared — and an LCS can always be shared, by merging the two strings around it.",
        steps: [
          "Compute the LCS length with the standard table: `lcs[i][j] = lcs[i-1][j-1] + 1` when `s1[i-1] == s2[j-1]`, else `max(lcs[i-1][j], lcs[i][j-1])`.",
          "Return `n + m - lcs[n][m]`.",
        ],
        why: "Lower bound: the shared positions of any common supersequence form a common subsequence, so its length is at least `n + m - LCS`. Upper bound: walk both strings along an LCS, emitting the characters of each string between consecutive LCS characters and each LCS character once — that string has length exactly `n + m - LCS` and contains both inputs.",
        time: "O(n * m)",
        space: "O(m) with two rows",
        pitfalls: [
          "Using the longest common *substring* instead of subsequence undercounts the sharing.",
          "Only the length is asked; building the actual string needs the full table to backtrack.",
          "Empty-prefix rows of the direct supersequence table are `i` and `j`, not `0`.",
        ],
      }),
      examples: [
        { input: "\"abcd\"\n\"xycd\"", expectedOutput: "6" },
        { input: "\"efgh\"\n\"jghi\"", expectedOutput: "6" },
        { input: "\"geek\"\n\"eke\"", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcde", "abcdefghijklmnopqrstuvwxyz"]);
        const s1 = randLower(rng, 1, pick(rng, [1, 5, 15, 30]), alpha);
        const s2 = rng() < 0.15 ? s1 : randLower(rng, 1, pick(rng, [1, 5, 15, 30]), alpha);
        return { input: `${JSON.stringify(s1)}\n${JSON.stringify(s2)}`, expectedOutput: String(ref(s1, s2)) };
      },
      solutions: {
        python: code`
          def shortestCommonSupersequence(s1: str, s2: str) -> int:
              n, m = len(s1), len(s2)
              prev = [0] * (m + 1)
              for i in range(1, n + 1):
                  cur = [0] * (m + 1)
                  ci = s1[i - 1]
                  for j in range(1, m + 1):
                      if ci == s2[j - 1]:
                          cur[j] = prev[j - 1] + 1
                      else:
                          cur[j] = prev[j] if prev[j] > cur[j - 1] else cur[j - 1]
                  prev = cur
              return n + m - prev[m]
        `,
        javascript: code`
          var shortestCommonSupersequence = function(s1, s2) {
              var n = s1.length, m = s2.length;
              var prev = new Array(m + 1).fill(0);
              var cur = new Array(m + 1).fill(0);
              for (var i = 1; i <= n; i++) {
                  for (var j = 1; j <= m; j++) {
                      if (s1.charCodeAt(i - 1) === s2.charCodeAt(j - 1)) cur[j] = prev[j - 1] + 1;
                      else cur[j] = Math.max(prev[j], cur[j - 1]);
                  }
                  var t = prev; prev = cur; cur = t;
              }
              return n + m - prev[m];
          };
        `,
        typescript: code`
          function shortestCommonSupersequence(s1: string, s2: string): number {
              var n = s1.length, m = s2.length;
              var prev: number[] = [], cur: number[] = [];
              for (var k = 0; k <= m; k++) { prev.push(0); cur.push(0); }
              for (var i = 1; i <= n; i++) {
                  for (var j = 1; j <= m; j++) {
                      if (s1.charCodeAt(i - 1) === s2.charCodeAt(j - 1)) cur[j] = prev[j - 1] + 1;
                      else cur[j] = Math.max(prev[j], cur[j - 1]);
                  }
                  var t = prev; prev = cur; cur = t;
              }
              return n + m - prev[m];
          }
        `,
        java: code`
          public static int shortestCommonSupersequence(String s1, String s2) {
              int n = s1.length(), m = s2.length();
              int[] prev = new int[m + 1], cur = new int[m + 1];
              for (int i = 1; i <= n; i++) {
                  for (int j = 1; j <= m; j++) {
                      if (s1.charAt(i - 1) == s2.charAt(j - 1)) cur[j] = prev[j - 1] + 1;
                      else cur[j] = Math.max(prev[j], cur[j - 1]);
                  }
                  int[] t = prev; prev = cur; cur = t;
              }
              return n + m - prev[m];
          }
        `,
        cpp: code`
          int shortestCommonSupersequence(string s1, string s2) {
              int n = s1.size(), m = s2.size();
              vector<int> prev(m + 1, 0), cur(m + 1, 0);
              for (int i = 1; i <= n; i++) {
                  for (int j = 1; j <= m; j++) {
                      if (s1[i - 1] == s2[j - 1]) cur[j] = prev[j - 1] + 1;
                      else cur[j] = max(prev[j], cur[j - 1]);
                  }
                  swap(prev, cur);
              }
              return n + m - prev[m];
          }
        `,
        c: code`
          int shortestCommonSupersequence(const char* s1, const char* s2) {
              int n = (int) strlen(s1), m = (int) strlen(s2);
              int* prev = (int*) calloc((size_t) (m + 1), sizeof(int));
              int* cur = (int*) calloc((size_t) (m + 1), sizeof(int));
              for (int i = 1; i <= n; i++) {
                  for (int j = 1; j <= m; j++) {
                      if (s1[i - 1] == s2[j - 1]) cur[j] = prev[j - 1] + 1;
                      else cur[j] = prev[j] > cur[j - 1] ? prev[j] : cur[j - 1];
                  }
                  int* t = prev; prev = cur; cur = t;
              }
              int ans = n + m - prev[m];
              free(prev);
              free(cur);
              return ans;
          }
        `,
        csharp: code`
          public static int ShortestCommonSupersequence(string s1, string s2)
          {
              int n = s1.Length, m = s2.Length;
              int[] prev = new int[m + 1], cur = new int[m + 1];
              for (int i = 1; i <= n; i++)
              {
                  for (int j = 1; j <= m; j++)
                  {
                      if (s1[i - 1] == s2[j - 1]) cur[j] = prev[j - 1] + 1;
                      else cur[j] = Math.Max(prev[j], cur[j - 1]);
                  }
                  int[] t = prev; prev = cur; cur = t;
              }
              return n + m - prev[m];
          }
        `,
        go: code`
          func shortestCommonSupersequence(s1 string, s2 string) int {
              n, m := len(s1), len(s2)
              prev := make([]int, m+1)
              cur := make([]int, m+1)
              for i := 1; i <= n; i++ {
                  for j := 1; j <= m; j++ {
                      if s1[i-1] == s2[j-1] {
                          cur[j] = prev[j-1] + 1
                      } else if prev[j] > cur[j-1] {
                          cur[j] = prev[j]
                      } else {
                          cur[j] = cur[j-1]
                      }
                  }
                  prev, cur = cur, prev
              }
              return n + m - prev[m]
          }
        `,
        kotlin: code`
          fun shortestCommonSupersequence(s1: String, s2: String): Int {
              val n = s1.length
              val m = s2.length
              var prev = IntArray(m + 1)
              var cur = IntArray(m + 1)
              for (i in 1..n) {
                  for (j in 1..m) {
                      cur[j] = if (s1[i - 1] == s2[j - 1]) prev[j - 1] + 1 else maxOf(prev[j], cur[j - 1])
                  }
                  val t = prev; prev = cur; cur = t
              }
              return n + m - prev[m]
          }
        `,
        swift: code`
          func shortestCommonSupersequence(_ s1: String, _ s2: String) -> Int {
              let a = Array(s1.utf8), b = Array(s2.utf8)
              let n = a.count, m = b.count
              var prev = [Int](repeating: 0, count: m + 1)
              var cur = [Int](repeating: 0, count: m + 1)
              for i in 0..<n {
                  for j in 0..<m {
                      if a[i] == b[j] { cur[j + 1] = prev[j] + 1 }
                      else { cur[j + 1] = max(prev[j + 1], cur[j]) }
                  }
                  swap(&prev, &cur)
              }
              return n + m - prev[m]
          }
        `,
        rust: code`
          fn shortestCommonSupersequence(s1: String, s2: String) -> i32 {
              let a = s1.as_bytes();
              let b = s2.as_bytes();
              let (n, m) = (a.len(), b.len());
              let mut prev = vec![0i32; m + 1];
              let mut cur = vec![0i32; m + 1];
              for i in 0..n {
                  for j in 0..m {
                      cur[j + 1] = if a[i] == b[j] { prev[j] + 1 } else { prev[j + 1].max(cur[j]) };
                  }
                  std::mem::swap(&mut prev, &mut cur);
              }
              (n + m) as i32 - prev[m]
          }
        `,
        php: code`
          function shortestCommonSupersequence($s1, $s2) {
              $n = strlen($s1);
              $m = strlen($s2);
              $prev = array_fill(0, $m + 1, 0);
              for ($i = 1; $i <= $n; $i++) {
                  $cur = array_fill(0, $m + 1, 0);
                  $ci = $s1[$i - 1];
                  for ($j = 1; $j <= $m; $j++) {
                      if ($ci === $s2[$j - 1]) $cur[$j] = $prev[$j - 1] + 1;
                      else $cur[$j] = max($prev[$j], $cur[$j - 1]);
                  }
                  $prev = $cur;
              }
              return $n + $m - $prev[$m];
          }
        `,
        ruby: code`
          def shortestCommonSupersequence(s1, s2)
            a = s1.bytes
            b = s2.bytes
            n = a.length
            m = b.length
            prev = Array.new(m + 1, 0)
            a.each do |ch|
              cur = Array.new(m + 1, 0)
              (1..m).each do |j|
                if ch == b[j - 1]
                  cur[j] = prev[j - 1] + 1
                else
                  cur[j] = prev[j] > cur[j - 1] ? prev[j] : cur[j - 1]
                end
              end
              prev = cur
            end
            n + m - prev[m]
          end
        `,
      },
    };
  })(),

  // ── Longest Bitonic Subsequence (GFG) ────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      // Brute force over (peak, left part, right part) via LIS/LDS tables.
      const n = nums.length;
      const up = new Array(n).fill(1), down = new Array(n).fill(1);
      for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) if (nums[j] < nums[i]) up[i] = Math.max(up[i], up[j] + 1);
      for (let i = n - 1; i >= 0; i--) for (let j = n - 1; j > i; j--) if (nums[j] < nums[i]) down[i] = Math.max(down[i], down[j] + 1);
      let best = 0;
      for (let i = 0; i < n; i++) if (up[i] > 1 && down[i] > 1) best = Math.max(best, up[i] + down[i] - 1);
      return best;
    };
    return {
      slug: "longest-bitonic-subsequence",
      title: "Longest Bitonic Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Microsoft", "Google"],
      signature: { funcName: "longestBitonicSequence", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A sequence is **bitonic** if it first strictly increases and then strictly decreases, and *both* parts are non-empty — that is, it rises to a single peak and then falls, like `1, 4, 6, 3, 2`. A sequence that only increases, or only decreases, is **not** bitonic.\n\nGiven an array `nums`, return the length of its longest bitonic **subsequence** (elements kept in their original order, not necessarily adjacent). If no bitonic subsequence exists, return `0`.",
        [
          { in: "nums = [1,2,5,3,2]", out: "5", note: "The whole array rises 1, 2, 5 and falls 5, 3, 2." },
          { in: "nums = [1,11,2,10,4,5,2,1]", out: "6", note: "One longest choice is 1, 2, 10, 4, 2, 1." },
          { in: "nums = [10,20,30]", out: "0", note: "The array only increases, so no subsequence can fall after its peak." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 10^4"]),
      hints: [
        "Every bitonic subsequence has a peak element. To its left is a strictly increasing subsequence ending at the peak, to its right a strictly decreasing one starting at it.",
        "Compute, for each index `i`, the longest strictly increasing subsequence *ending* at `i` (`up[i]`) and the longest strictly decreasing subsequence *starting* at `i` (`down[i]`).",
        "The best bitonic subsequence with peak `i` has length `up[i] + down[i] - 1` — but only count peaks where `up[i] > 1` and `down[i] > 1`, so both sides are non-empty.",
      ],
      editorial: explain({
        idea: "Split a bitonic subsequence at its peak. The rising half is any increasing subsequence ending at the peak and the falling half any decreasing subsequence starting there; the two halves only share the peak, so they can be optimised independently — two LIS computations, one from each side.",
        steps: [
          "`up[i]` = 1 + max `up[j]` over `j < i` with `nums[j] < nums[i]` (1 if none).",
          "`down[i]` = 1 + max `down[j]` over `j > i` with `nums[j] < nums[i]` (1 if none), filled from the right.",
          "Answer = max of `up[i] + down[i] - 1` over all `i` with `up[i] >= 2` and `down[i] >= 2`; `0` if there is no such `i`.",
        ],
        why: "For a fixed peak `i`, any increasing subsequence ending at `i` and any decreasing subsequence starting at `i` concatenate (sharing `i`) into a valid bitonic subsequence, because every element on the left is before `i` and smaller than `nums[i]`, and every element on the right is after `i` and smaller too. Maximising each half separately therefore maximises the total for that peak, and the best peak gives the answer.",
        time: "O(n^2) (O(n log n) with patience sorting for both halves)",
        space: "O(n)",
        pitfalls: [
          "Both halves must be non-empty: a purely increasing or decreasing array answers `0`, not its length.",
          "Strictly: equal neighbours cannot both be in one half — use `<`, not `<=`.",
          "The peak is counted in both `up` and `down`, hence the `- 1`.",
        ],
      }),
      examples: [
        { input: "[1,2,5,3,2]", expectedOutput: "5" },
        { input: "[1,11,2,10,4,5,2,1]", expectedOutput: "6" },
        { input: "[10,20,30]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 8, 20, 40]));
        const top = pick(rng, [2, 5, 50, 10000]);
        let nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const mode = ri(rng, 0, 5);
        if (mode === 0) nums.sort((a, b) => a - b);
        else if (mode === 1) nums.sort((a, b) => b - a);
        else if (mode === 2) {
          const p = ri(rng, 0, n - 1);
          nums = nums.slice(0, p).sort((a, b) => a - b).concat(nums.slice(p).sort((a, b) => b - a));
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def longestBitonicSequence(nums: List[int]) -> int:
              n = len(nums)
              up = [1] * n
              down = [1] * n
              for i in range(n):
                  for j in range(i):
                      if nums[j] < nums[i] and up[j] + 1 > up[i]:
                          up[i] = up[j] + 1
              for i in range(n - 1, -1, -1):
                  for j in range(i + 1, n):
                      if nums[j] < nums[i] and down[j] + 1 > down[i]:
                          down[i] = down[j] + 1
              best = 0
              for i in range(n):
                  if up[i] > 1 and down[i] > 1:
                      best = max(best, up[i] + down[i] - 1)
              return best
        `,
        javascript: code`
          var longestBitonicSequence = function(nums) {
              var n = nums.length;
              var up = new Array(n).fill(1), down = new Array(n).fill(1);
              for (var i = 0; i < n; i++) {
                  for (var j = 0; j < i; j++) if (nums[j] < nums[i] && up[j] + 1 > up[i]) up[i] = up[j] + 1;
              }
              for (var a = n - 1; a >= 0; a--) {
                  for (var b = a + 1; b < n; b++) if (nums[b] < nums[a] && down[b] + 1 > down[a]) down[a] = down[b] + 1;
              }
              var best = 0;
              for (var k = 0; k < n; k++) {
                  if (up[k] > 1 && down[k] > 1 && up[k] + down[k] - 1 > best) best = up[k] + down[k] - 1;
              }
              return best;
          };
        `,
        typescript: code`
          function longestBitonicSequence(nums: number[]): number {
              var n = nums.length;
              var up: number[] = [], down: number[] = [];
              for (var t = 0; t < n; t++) { up.push(1); down.push(1); }
              for (var i = 0; i < n; i++) {
                  for (var j = 0; j < i; j++) if (nums[j] < nums[i] && up[j] + 1 > up[i]) up[i] = up[j] + 1;
              }
              for (var a = n - 1; a >= 0; a--) {
                  for (var b = a + 1; b < n; b++) if (nums[b] < nums[a] && down[b] + 1 > down[a]) down[a] = down[b] + 1;
              }
              var best = 0;
              for (var k = 0; k < n; k++) {
                  if (up[k] > 1 && down[k] > 1 && up[k] + down[k] - 1 > best) best = up[k] + down[k] - 1;
              }
              return best;
          }
        `,
        java: code`
          public static int longestBitonicSequence(int[] nums) {
              int n = nums.length;
              int[] up = new int[n], down = new int[n];
              for (int i = 0; i < n; i++) {
                  up[i] = 1;
                  for (int j = 0; j < i; j++) if (nums[j] < nums[i]) up[i] = Math.max(up[i], up[j] + 1);
              }
              for (int i = n - 1; i >= 0; i--) {
                  down[i] = 1;
                  for (int j = i + 1; j < n; j++) if (nums[j] < nums[i]) down[i] = Math.max(down[i], down[j] + 1);
              }
              int best = 0;
              for (int i = 0; i < n; i++) {
                  if (up[i] > 1 && down[i] > 1) best = Math.max(best, up[i] + down[i] - 1);
              }
              return best;
          }
        `,
        cpp: code`
          int longestBitonicSequence(vector<int>& nums) {
              int n = nums.size();
              vector<int> up(n, 1), down(n, 1);
              for (int i = 0; i < n; i++)
                  for (int j = 0; j < i; j++)
                      if (nums[j] < nums[i]) up[i] = max(up[i], up[j] + 1);
              for (int i = n - 1; i >= 0; i--)
                  for (int j = i + 1; j < n; j++)
                      if (nums[j] < nums[i]) down[i] = max(down[i], down[j] + 1);
              int best = 0;
              for (int i = 0; i < n; i++)
                  if (up[i] > 1 && down[i] > 1) best = max(best, up[i] + down[i] - 1);
              return best;
          }
        `,
        c: code`
          int longestBitonicSequence(int* nums, int numsSize) {
              int n = numsSize;
              int* up = (int*) malloc((size_t) n * sizeof(int));
              int* down = (int*) malloc((size_t) n * sizeof(int));
              for (int i = 0; i < n; i++) {
                  up[i] = 1;
                  for (int j = 0; j < i; j++) if (nums[j] < nums[i] && up[j] + 1 > up[i]) up[i] = up[j] + 1;
              }
              for (int i = n - 1; i >= 0; i--) {
                  down[i] = 1;
                  for (int j = i + 1; j < n; j++) if (nums[j] < nums[i] && down[j] + 1 > down[i]) down[i] = down[j] + 1;
              }
              int best = 0;
              for (int i = 0; i < n; i++) {
                  if (up[i] > 1 && down[i] > 1 && up[i] + down[i] - 1 > best) best = up[i] + down[i] - 1;
              }
              free(up);
              free(down);
              return best;
          }
        `,
        csharp: code`
          public static int LongestBitonicSequence(int[] nums)
          {
              int n = nums.Length;
              int[] up = new int[n], down = new int[n];
              for (int i = 0; i < n; i++)
              {
                  up[i] = 1;
                  for (int j = 0; j < i; j++) if (nums[j] < nums[i]) up[i] = Math.Max(up[i], up[j] + 1);
              }
              for (int i = n - 1; i >= 0; i--)
              {
                  down[i] = 1;
                  for (int j = i + 1; j < n; j++) if (nums[j] < nums[i]) down[i] = Math.Max(down[i], down[j] + 1);
              }
              int best = 0;
              for (int i = 0; i < n; i++)
              {
                  if (up[i] > 1 && down[i] > 1) best = Math.Max(best, up[i] + down[i] - 1);
              }
              return best;
          }
        `,
        go: code`
          func longestBitonicSequence(nums []int) int {
              n := len(nums)
              up := make([]int, n)
              down := make([]int, n)
              for i := 0; i < n; i++ {
                  up[i] = 1
                  for j := 0; j < i; j++ {
                      if nums[j] < nums[i] && up[j]+1 > up[i] {
                          up[i] = up[j] + 1
                      }
                  }
              }
              for i := n - 1; i >= 0; i-- {
                  down[i] = 1
                  for j := i + 1; j < n; j++ {
                      if nums[j] < nums[i] && down[j]+1 > down[i] {
                          down[i] = down[j] + 1
                      }
                  }
              }
              best := 0
              for i := 0; i < n; i++ {
                  if up[i] > 1 && down[i] > 1 && up[i]+down[i]-1 > best {
                      best = up[i] + down[i] - 1
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun longestBitonicSequence(nums: IntArray): Int {
              val n = nums.size
              val up = IntArray(n) { 1 }
              val down = IntArray(n) { 1 }
              for (i in 0 until n) for (j in 0 until i) if (nums[j] < nums[i]) up[i] = maxOf(up[i], up[j] + 1)
              for (i in n - 1 downTo 0) for (j in i + 1 until n) if (nums[j] < nums[i]) down[i] = maxOf(down[i], down[j] + 1)
              var best = 0
              for (i in 0 until n) if (up[i] > 1 && down[i] > 1) best = maxOf(best, up[i] + down[i] - 1)
              return best
          }
        `,
        swift: code`
          func longestBitonicSequence(_ nums: [Int]) -> Int {
              let n = nums.count
              var up = [Int](repeating: 1, count: n)
              var down = [Int](repeating: 1, count: n)
              for i in 0..<n {
                  for j in 0..<i where nums[j] < nums[i] { up[i] = max(up[i], up[j] + 1) }
              }
              for i in stride(from: n - 1, through: 0, by: -1) {
                  for j in (i + 1)..<n where nums[j] < nums[i] { down[i] = max(down[i], down[j] + 1) }
              }
              var best = 0
              for i in 0..<n where up[i] > 1 && down[i] > 1 { best = max(best, up[i] + down[i] - 1) }
              return best
          }
        `,
        rust: code`
          fn longestBitonicSequence(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut up = vec![1i32; n];
              let mut down = vec![1i32; n];
              for i in 0..n {
                  for j in 0..i {
                      if nums[j] < nums[i] {
                          up[i] = up[i].max(up[j] + 1);
                      }
                  }
              }
              for i in (0..n).rev() {
                  for j in (i + 1)..n {
                      if nums[j] < nums[i] {
                          down[i] = down[i].max(down[j] + 1);
                      }
                  }
              }
              let mut best = 0;
              for i in 0..n {
                  if up[i] > 1 && down[i] > 1 {
                      best = best.max(up[i] + down[i] - 1);
                  }
              }
              best
          }
        `,
        php: code`
          function longestBitonicSequence($nums) {
              $n = count($nums);
              $up = array_fill(0, $n, 1);
              $down = array_fill(0, $n, 1);
              for ($i = 0; $i < $n; $i++) {
                  for ($j = 0; $j < $i; $j++) if ($nums[$j] < $nums[$i] && $up[$j] + 1 > $up[$i]) $up[$i] = $up[$j] + 1;
              }
              for ($i = $n - 1; $i >= 0; $i--) {
                  for ($j = $i + 1; $j < $n; $j++) if ($nums[$j] < $nums[$i] && $down[$j] + 1 > $down[$i]) $down[$i] = $down[$j] + 1;
              }
              $best = 0;
              for ($i = 0; $i < $n; $i++) {
                  if ($up[$i] > 1 && $down[$i] > 1) $best = max($best, $up[$i] + $down[$i] - 1);
              }
              return $best;
          }
        `,
        ruby: code`
          def longestBitonicSequence(nums)
            n = nums.length
            up = Array.new(n, 1)
            down = Array.new(n, 1)
            (0...n).each do |i|
              (0...i).each { |j| up[i] = up[j] + 1 if nums[j] < nums[i] && up[j] + 1 > up[i] }
            end
            (n - 1).downto(0) do |i|
              ((i + 1)...n).each { |j| down[i] = down[j] + 1 if nums[j] < nums[i] && down[j] + 1 > down[i] }
            end
            best = 0
            (0...n).each do |i|
              best = up[i] + down[i] - 1 if up[i] > 1 && down[i] > 1 && up[i] + down[i] - 1 > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Maximum Sum Increasing Subsequence (GFG) ─────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const n = arr.length;
      let best = 0;
      if (n <= 14) {
        for (let mask = 1; mask < 1 << n; mask++) {
          let prev = -1, sum = 0, ok = true;
          for (let i = 0; i < n && ok; i++) {
            if (mask & (1 << i)) {
              if (arr[i] <= prev) ok = false;
              prev = arr[i];
              sum += arr[i];
            }
          }
          if (ok && sum > best) best = sum;
        }
        return best;
      }
      const s = arr.slice();
      for (let i = 0; i < n; i++) for (let j = 0; j < i; j++) if (arr[j] < arr[i]) s[i] = Math.max(s[i], s[j] + arr[i]);
      return Math.max(...s);
    };
    return {
      slug: "maximum-sum-increasing-subsequence",
      title: "Maximum Sum Increasing Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Microsoft", "Morgan Stanley"],
      signature: { funcName: "maxSumIS", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of positive integers `arr`, return the **maximum sum** of a **strictly increasing subsequence** of `arr`.\n\nA subsequence keeps the elements in their original order but may skip any of them. It is strictly increasing if every element is larger than the one before it. A single element on its own is an increasing subsequence.",
        [
          { in: "arr = [1,101,2,3,100]", out: "106", note: "1, 2, 3, 100 sums to 106 — more than the longer-looking 1, 101." },
          { in: "arr = [4,1,2,3]", out: "6", note: "1, 2, 3 sums to 6, beating the single 4." },
          { in: "arr = [5,5,5]", out: "5", note: "Equal values cannot follow each other in a strictly increasing subsequence." },
        ],
        ["1 <= arr.length <= 1000", "1 <= arr[i] <= 10^5"]),
      hints: [
        "This is the longest increasing subsequence problem with *sums* in place of lengths — the longest one need not have the largest sum.",
        "Let `best[i]` be the largest sum of an increasing subsequence that **ends** at index `i`.",
        "`best[i] = arr[i] + max(best[j])` over `j < i` with `arr[j] < arr[i]` (or just `arr[i]` if there is none). The answer is the largest `best[i]`.",
      ],
      editorial: explain({
        idea: "Fix the last element of the subsequence. Whatever comes before it is itself an increasing subsequence ending at some smaller earlier element, and it should be the heaviest such one. That is the LIS recurrence with sums instead of counts.",
        steps: [
          "Initialise `best[i] = arr[i]` for every `i`.",
          "For each `i` and each `j < i` with `arr[j] < arr[i]`: `best[i] = max(best[i], best[j] + arr[i])`.",
          "Return the maximum value in `best`.",
        ],
        why: "An increasing subsequence ending at `i` is either `arr[i]` alone or an increasing subsequence ending at some `j < i` with `arr[j] < arr[i]`, extended by `arr[i]`. Its sum is maximised by taking the heaviest such prefix, `best[j]`, so the recurrence is exact; every subsequence ends somewhere, so the maximum over all `i` is the answer.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "Returning `best[n - 1]` instead of the maximum over all indices — the best subsequence need not end at the last element.",
          "Using `<=` lets equal values chain, but the subsequence must be strictly increasing.",
          "The answer is at most `1000 * 10^5 = 10^8`, comfortably inside 32 bits.",
        ],
      }),
      examples: [
        { input: "[1,101,2,3,100]", expectedOutput: "106" },
        { input: "[4,1,2,3]", expectedOutput: "6" },
        { input: "[5,5,5]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 14, 30, 45]));
        const top = pick(rng, [3, 20, 1000, 100000]);
        const arr = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxSumIS(arr: List[int]) -> int:
              best = arr[:]
              for i in range(len(arr)):
                  ai = arr[i]
                  for j in range(i):
                      if arr[j] < ai and best[j] + ai > best[i]:
                          best[i] = best[j] + ai
              return max(best)
        `,
        javascript: code`
          var maxSumIS = function(arr) {
              var best = arr.slice();
              var ans = 0;
              for (var i = 0; i < arr.length; i++) {
                  for (var j = 0; j < i; j++) {
                      if (arr[j] < arr[i] && best[j] + arr[i] > best[i]) best[i] = best[j] + arr[i];
                  }
                  if (best[i] > ans) ans = best[i];
              }
              return ans;
          };
        `,
        typescript: code`
          function maxSumIS(arr: number[]): number {
              var best: number[] = arr.slice();
              var ans = 0;
              for (var i = 0; i < arr.length; i++) {
                  for (var j = 0; j < i; j++) {
                      if (arr[j] < arr[i] && best[j] + arr[i] > best[i]) best[i] = best[j] + arr[i];
                  }
                  if (best[i] > ans) ans = best[i];
              }
              return ans;
          }
        `,
        java: code`
          public static int maxSumIS(int[] arr) {
              int n = arr.length;
              int[] best = arr.clone();
              int ans = 0;
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < i; j++) {
                      if (arr[j] < arr[i]) best[i] = Math.max(best[i], best[j] + arr[i]);
                  }
                  ans = Math.max(ans, best[i]);
              }
              return ans;
          }
        `,
        cpp: code`
          int maxSumIS(vector<int>& arr) {
              int n = arr.size();
              vector<int> best(arr);
              int ans = 0;
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < i; j++) {
                      if (arr[j] < arr[i]) best[i] = max(best[i], best[j] + arr[i]);
                  }
                  ans = max(ans, best[i]);
              }
              return ans;
          }
        `,
        c: code`
          int maxSumIS(int* arr, int arrSize) {
              int* best = (int*) malloc((size_t) arrSize * sizeof(int));
              int ans = 0;
              for (int i = 0; i < arrSize; i++) {
                  best[i] = arr[i];
                  for (int j = 0; j < i; j++) {
                      if (arr[j] < arr[i] && best[j] + arr[i] > best[i]) best[i] = best[j] + arr[i];
                  }
                  if (best[i] > ans) ans = best[i];
              }
              free(best);
              return ans;
          }
        `,
        csharp: code`
          public static int MaxSumIS(int[] arr)
          {
              int n = arr.Length;
              int[] best = (int[]) arr.Clone();
              int ans = 0;
              for (int i = 0; i < n; i++)
              {
                  for (int j = 0; j < i; j++)
                  {
                      if (arr[j] < arr[i]) best[i] = Math.Max(best[i], best[j] + arr[i]);
                  }
                  ans = Math.Max(ans, best[i]);
              }
              return ans;
          }
        `,
        go: code`
          func maxSumIS(arr []int) int {
              n := len(arr)
              best := make([]int, n)
              copy(best, arr)
              ans := 0
              for i := 0; i < n; i++ {
                  for j := 0; j < i; j++ {
                      if arr[j] < arr[i] && best[j]+arr[i] > best[i] {
                          best[i] = best[j] + arr[i]
                      }
                  }
                  if best[i] > ans {
                      ans = best[i]
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun maxSumIS(arr: IntArray): Int {
              val best = arr.copyOf()
              var ans = 0
              for (i in arr.indices) {
                  for (j in 0 until i) if (arr[j] < arr[i]) best[i] = maxOf(best[i], best[j] + arr[i])
                  ans = maxOf(ans, best[i])
              }
              return ans
          }
        `,
        swift: code`
          func maxSumIS(_ arr: [Int]) -> Int {
              var best = arr
              var ans = 0
              for i in 0..<arr.count {
                  for j in 0..<i where arr[j] < arr[i] { best[i] = max(best[i], best[j] + arr[i]) }
                  ans = max(ans, best[i])
              }
              return ans
          }
        `,
        rust: code`
          fn maxSumIS(arr: Vec<i32>) -> i32 {
              let n = arr.len();
              let mut best = arr.clone();
              let mut ans = 0;
              for i in 0..n {
                  for j in 0..i {
                      if arr[j] < arr[i] {
                          best[i] = best[i].max(best[j] + arr[i]);
                      }
                  }
                  ans = ans.max(best[i]);
              }
              ans
          }
        `,
        php: code`
          function maxSumIS($arr) {
              $n = count($arr);
              $best = $arr;
              $ans = 0;
              for ($i = 0; $i < $n; $i++) {
                  for ($j = 0; $j < $i; $j++) {
                      if ($arr[$j] < $arr[$i] && $best[$j] + $arr[$i] > $best[$i]) $best[$i] = $best[$j] + $arr[$i];
                  }
                  if ($best[$i] > $ans) $ans = $best[$i];
              }
              return $ans;
          }
        `,
        ruby: code`
          def maxSumIS(arr)
            best = arr.dup
            ans = 0
            arr.each_index do |i|
              ai = arr[i]
              (0...i).each do |j|
                best[i] = best[j] + ai if arr[j] < ai && best[j] + ai > best[i]
              end
              ans = best[i] if best[i] > ans
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Gold Mine Problem (GFG) ──────────────────────────────────────
  (() => {
    const ref = (mat: number[][]) => {
      const n = mat.length, m = mat[0].length;
      const memo = new Map<number, number>();
      const go = (r: number, c: number): number => {
        if (r < 0 || r >= n) return -Infinity;
        if (c === m - 1) return mat[r][c];
        const key = r * 100 + c;
        if (memo.has(key)) return memo.get(key)!;
        const v = mat[r][c] + Math.max(go(r - 1, c + 1), go(r, c + 1), go(r + 1, c + 1));
        memo.set(key, v);
        return v;
      };
      let best = 0;
      for (let r = 0; r < n; r++) best = Math.max(best, go(r, 0));
      return best;
    };
    return {
      slug: "gold-mine-problem",
      title: "Gold Mine Problem",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Amazon", "Flipkart"],
      signature: { funcName: "maxGold", params: [{ name: "mat", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A gold mine is an `n x m` grid `mat`, where `mat[i][j]` is the number of tons of gold in that cell.\n\nA miner starts in **any row of the first column**. From cell `(r, c)` they may move to `(r - 1, c + 1)` (diagonally up-right), `(r, c + 1)` (right) or `(r + 1, c + 1)` (diagonally down-right), as long as the new cell is inside the grid. They collect the gold of every cell they stand on, and the walk ends in the last column.\n\nReturn the **maximum** amount of gold the miner can collect.",
        [
          { in: "mat = [[1,3,3],[2,1,4],[0,6,4]]", out: "12", note: "(1,0) → (2,1) → (2,2) or (1,2) collects 2 + 6 + 4 = 12." },
          { in: "mat = [[1,3,1,5],[2,2,4,1],[5,0,2,3],[0,6,1,2]]", out: "16", note: "(2,0) → (3,1) → (2,2) → (2,3) collects 5 + 6 + 2 + 3; the route 5 → 6 → 1? no — but (2,0) → (1,1) → (1,2) → (0,3) collects 5 + 2 + 4 + 5 = 16." },
          { in: "mat = [[4],[9],[2]]", out: "9", note: "With one column the miner simply picks the richest row." },
        ],
        ["1 <= n, m <= 50", "0 <= mat[i][j] <= 100"]),
      hints: [
        "Every walk visits exactly one cell per column, moving to a neighbouring row each step.",
        "Let `best[r][c]` be the most gold collectable starting from cell `(r, c)` and walking to the last column.",
        "Fill `best` from the last column leftwards: `best[r][c] = mat[r][c] + max` of the up to three `best` values in column `c + 1` at rows `r - 1, r, r + 1`. The answer is the best entry of the first column.",
      ],
      editorial: explain({
        idea: "The walk moves one column right per step, so columns give a natural order: the best haul from a cell depends only on the best hauls from its (at most three) successors in the next column.",
        steps: [
          "Copy the last column: `best[r][m - 1] = mat[r][m - 1]`.",
          "For `c` from `m - 2` down to `0` and every row `r`: `best[r][c] = mat[r][c] + max(best[r'][c + 1])` over `r' in {r - 1, r, r + 1}` inside the grid.",
          "Return `max(best[r][0])` over all rows.",
        ],
        why: "From `(r, c)` the miner must step to one of those three cells and then continue optimally from it, so the best total from `(r, c)` is its own gold plus the best of the three successors. Columns to the right are always finished first, and the free choice of starting row is the final maximum over the first column.",
        time: "O(n * m)",
        space: "O(n) with one column kept at a time",
        pitfalls: [
          "Forgetting the border rows: the top row has no up-right move and the bottom row no down-right move.",
          "Starting only from row `0` — the miner may start in any row of the first column.",
          "Cells may hold `0` gold; the answer can be `0` only if the whole grid is empty.",
        ],
      }),
      examples: [
        { input: "[[1,3,3],[2,1,4],[0,6,4]]", expectedOutput: "12" },
        { input: "[[1,3,1,5],[2,2,4,1],[5,0,2,3],[0,6,1,2]]", expectedOutput: "16" },
        { input: "[[4],[9],[2]]", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 6, 10]));
        const m = ri(rng, 1, pick(rng, [1, 3, 6, 10]));
        const top = pick(rng, [0, 1, 9, 100]);
        const mat = Array.from({ length: n }, () => Array.from({ length: m }, () => ri(rng, 0, top)));
        return { input: fmtIntMat(mat), expectedOutput: String(ref(mat)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxGold(mat: List[List[int]]) -> int:
              n, m = len(mat), len(mat[0])
              best = [mat[r][m - 1] for r in range(n)]
              for c in range(m - 2, -1, -1):
                  nxt = [0] * n
                  for r in range(n):
                      top = best[r]
                      if r > 0 and best[r - 1] > top:
                          top = best[r - 1]
                      if r + 1 < n and best[r + 1] > top:
                          top = best[r + 1]
                      nxt[r] = mat[r][c] + top
                  best = nxt
              return max(best)
        `,
        javascript: code`
          var maxGold = function(mat) {
              var n = mat.length, m = mat[0].length;
              var best = [];
              for (var r = 0; r < n; r++) best.push(mat[r][m - 1]);
              for (var c = m - 2; c >= 0; c--) {
                  var next = [];
                  for (var i = 0; i < n; i++) {
                      var top = best[i];
                      if (i > 0 && best[i - 1] > top) top = best[i - 1];
                      if (i + 1 < n && best[i + 1] > top) top = best[i + 1];
                      next.push(mat[i][c] + top);
                  }
                  best = next;
              }
              return Math.max.apply(null, best);
          };
        `,
        typescript: code`
          function maxGold(mat: number[][]): number {
              var n = mat.length, m = mat[0].length;
              var best: number[] = [];
              for (var r = 0; r < n; r++) best.push(mat[r][m - 1]);
              for (var c = m - 2; c >= 0; c--) {
                  var next: number[] = [];
                  for (var i = 0; i < n; i++) {
                      var top = best[i];
                      if (i > 0 && best[i - 1] > top) top = best[i - 1];
                      if (i + 1 < n && best[i + 1] > top) top = best[i + 1];
                      next.push(mat[i][c] + top);
                  }
                  best = next;
              }
              var ans = 0;
              for (var k = 0; k < n; k++) if (best[k] > ans) ans = best[k];
              return ans;
          }
        `,
        java: code`
          public static int maxGold(int[][] mat) {
              int n = mat.length, m = mat[0].length;
              int[] best = new int[n];
              for (int r = 0; r < n; r++) best[r] = mat[r][m - 1];
              for (int c = m - 2; c >= 0; c--) {
                  int[] next = new int[n];
                  for (int r = 0; r < n; r++) {
                      int top = best[r];
                      if (r > 0) top = Math.max(top, best[r - 1]);
                      if (r + 1 < n) top = Math.max(top, best[r + 1]);
                      next[r] = mat[r][c] + top;
                  }
                  best = next;
              }
              int ans = 0;
              for (int v : best) ans = Math.max(ans, v);
              return ans;
          }
        `,
        cpp: code`
          int maxGold(vector<vector<int>>& mat) {
              int n = mat.size(), m = mat[0].size();
              vector<int> best(n);
              for (int r = 0; r < n; r++) best[r] = mat[r][m - 1];
              for (int c = m - 2; c >= 0; c--) {
                  vector<int> next(n);
                  for (int r = 0; r < n; r++) {
                      int top = best[r];
                      if (r > 0) top = max(top, best[r - 1]);
                      if (r + 1 < n) top = max(top, best[r + 1]);
                      next[r] = mat[r][c] + top;
                  }
                  best = next;
              }
              return *max_element(best.begin(), best.end());
          }
        `,
        c: code`
          int maxGold(int** mat, int matSize, int* matColSize) {
              int n = matSize, m = matColSize[0];
              int* best = (int*) malloc((size_t) n * sizeof(int));
              int* next = (int*) malloc((size_t) n * sizeof(int));
              for (int r = 0; r < n; r++) best[r] = mat[r][m - 1];
              for (int c = m - 2; c >= 0; c--) {
                  for (int r = 0; r < n; r++) {
                      int top = best[r];
                      if (r > 0 && best[r - 1] > top) top = best[r - 1];
                      if (r + 1 < n && best[r + 1] > top) top = best[r + 1];
                      next[r] = mat[r][c] + top;
                  }
                  int* t = best; best = next; next = t;
              }
              int ans = 0;
              for (int r = 0; r < n; r++) if (best[r] > ans) ans = best[r];
              free(best);
              free(next);
              return ans;
          }
        `,
        csharp: code`
          public static int MaxGold(int[][] mat)
          {
              int n = mat.Length, m = mat[0].Length;
              int[] best = new int[n];
              for (int r = 0; r < n; r++) best[r] = mat[r][m - 1];
              for (int c = m - 2; c >= 0; c--)
              {
                  int[] next = new int[n];
                  for (int r = 0; r < n; r++)
                  {
                      int top = best[r];
                      if (r > 0) top = Math.Max(top, best[r - 1]);
                      if (r + 1 < n) top = Math.Max(top, best[r + 1]);
                      next[r] = mat[r][c] + top;
                  }
                  best = next;
              }
              int ans = 0;
              foreach (int v in best) ans = Math.Max(ans, v);
              return ans;
          }
        `,
        go: code`
          func maxGold(mat [][]int) int {
              n, m := len(mat), len(mat[0])
              best := make([]int, n)
              for r := 0; r < n; r++ {
                  best[r] = mat[r][m-1]
              }
              for c := m - 2; c >= 0; c-- {
                  next := make([]int, n)
                  for r := 0; r < n; r++ {
                      top := best[r]
                      if r > 0 && best[r-1] > top {
                          top = best[r-1]
                      }
                      if r+1 < n && best[r+1] > top {
                          top = best[r+1]
                      }
                      next[r] = mat[r][c] + top
                  }
                  best = next
              }
              ans := 0
              for _, v := range best {
                  if v > ans {
                      ans = v
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun maxGold(mat: Array<IntArray>): Int {
              val n = mat.size
              val m = mat[0].size
              var best = IntArray(n) { mat[it][m - 1] }
              for (c in m - 2 downTo 0) {
                  val next = IntArray(n)
                  for (r in 0 until n) {
                      var top = best[r]
                      if (r > 0) top = maxOf(top, best[r - 1])
                      if (r + 1 < n) top = maxOf(top, best[r + 1])
                      next[r] = mat[r][c] + top
                  }
                  best = next
              }
              return best.maxOrNull() ?: 0
          }
        `,
        swift: code`
          func maxGold(_ mat: [[Int]]) -> Int {
              let n = mat.count, m = mat[0].count
              var best = (0..<n).map { mat[$0][m - 1] }
              var c = m - 2
              while c >= 0 {
                  var next = [Int](repeating: 0, count: n)
                  for r in 0..<n {
                      var top = best[r]
                      if r > 0 { top = max(top, best[r - 1]) }
                      if r + 1 < n { top = max(top, best[r + 1]) }
                      next[r] = mat[r][c] + top
                  }
                  best = next
                  c -= 1
              }
              return best.max() ?? 0
          }
        `,
        rust: code`
          fn maxGold(mat: Vec<Vec<i32>>) -> i32 {
              let n = mat.len();
              let m = mat[0].len();
              let mut best: Vec<i32> = (0..n).map(|r| mat[r][m - 1]).collect();
              for c in (0..m.saturating_sub(1)).rev() {
                  let mut next = vec![0i32; n];
                  for r in 0..n {
                      let mut top = best[r];
                      if r > 0 {
                          top = top.max(best[r - 1]);
                      }
                      if r + 1 < n {
                          top = top.max(best[r + 1]);
                      }
                      next[r] = mat[r][c] + top;
                  }
                  best = next;
              }
              *best.iter().max().unwrap()
          }
        `,
        php: code`
          function maxGold($mat) {
              $n = count($mat);
              $m = count($mat[0]);
              $best = [];
              for ($r = 0; $r < $n; $r++) $best[] = $mat[$r][$m - 1];
              for ($c = $m - 2; $c >= 0; $c--) {
                  $next = [];
                  for ($r = 0; $r < $n; $r++) {
                      $top = $best[$r];
                      if ($r > 0 && $best[$r - 1] > $top) $top = $best[$r - 1];
                      if ($r + 1 < $n && $best[$r + 1] > $top) $top = $best[$r + 1];
                      $next[] = $mat[$r][$c] + $top;
                  }
                  $best = $next;
              }
              return max($best);
          }
        `,
        ruby: code`
          def maxGold(mat)
            n = mat.length
            m = mat[0].length
            best = (0...n).map { |r| mat[r][m - 1] }
            (m - 2).downto(0) do |c|
              best = (0...n).map do |r|
                top = best[r]
                top = best[r - 1] if r > 0 && best[r - 1] > top
                top = best[r + 1] if r + 1 < n && best[r + 1] > top
                mat[r][c] + top
              end
            end
            best.max
          end
        `,
      },
    };
  })(),

  // ── Count Ways to Tile a 2 x N Floor (GFG) ───────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (n: number) => {
      let a = 1, b = 1; // ways for widths 0 and 1
      for (let i = 2; i <= n; i++) {
        const c = (a + b) % MOD;
        a = b;
        b = c;
      }
      return b;
    };
    return {
      slug: "count-ways-to-tile-a-floor",
      title: "Count Ways to Tile a 2 x N Floor",
      difficulty: "EASY" as const,
      tags: ["Math", "Dynamic Programming", "Amazon", "Microsoft", "Paytm"],
      signature: { funcName: "numberOfWays", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A floor is `2` units tall and `n` units wide. You have an unlimited supply of `2 x 1` tiles, and each tile may be placed either **vertically** (covering a `2 x 1` area) or **horizontally** (covering a `1 x 2` area).\n\nCount the number of different ways to cover the whole floor with tiles, with no overlaps and nothing sticking out. Two tilings are different if some tile is placed differently.\n\nThe count grows exponentially, so return it **modulo** `10^9 + 7`.",
        [
          { in: "n = 3", out: "3", note: "Three vertical tiles; or one vertical tile at the left and two stacked horizontal tiles; or two stacked horizontal tiles and then one vertical tile." },
          { in: "n = 4", out: "5" },
          { in: "n = 1", out: "1", note: "A single vertical tile." },
        ],
        ["1 <= n <= 10^5"]),
      hints: [
        "Look at the left edge of the floor. How can the leftmost column be covered?",
        "Either one vertical tile covers it (leaving a `2 x (n - 1)` floor), or two horizontal tiles stacked on top of each other cover the first two columns (leaving `2 x (n - 2)`).",
        "So `ways(n) = ways(n - 1) + ways(n - 2)` with `ways(0) = ways(1) = 1` — Fibonacci numbers. Iterate with two variables and reduce modulo `10^9 + 7`.",
      ],
      editorial: explain({
        idea: "Classify tilings by what covers the leftmost column. A vertical tile there leaves a `2 x (n-1)` floor; otherwise the top-left cell is covered by a horizontal tile, which forces another horizontal tile directly beneath it, leaving a `2 x (n-2)` floor. The counts therefore follow the Fibonacci recurrence.",
        steps: [
          "Let `a = ways(0) = 1` and `b = ways(1) = 1`.",
          "For `i` from 2 to `n`: `c = (a + b) mod (10^9 + 7)`, then `a = b`, `b = c`.",
          "Return `b`.",
        ],
        why: "The two cases are disjoint (the leftmost column holds either a vertical tile or two halves of horizontal tiles) and exhaustive. In the second case the bottom-left cell can only be covered by a horizontal tile too — a vertical one would overlap — so the first two columns are fully determined. Hence `ways(n) = ways(n-1) + ways(n-2)`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Without the modulus the count overflows 32 bits already at `n = 46`.",
          "Recursion without memoisation is exponential, and with it the depth reaches `10^5` frames.",
          "In typed languages, add two residues in 64 bits or subtract the modulus — their sum can pass `2^31 - 1`.",
        ],
      }),
      examples: [
        { input: "3", expectedOutput: "3" },
        { input: "4", expectedOutput: "5" },
        { input: "1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.01 ? ri(rng, 90000, 100000) : ri(rng, 1, pick(rng, [2, 10, 45, 50, 100, 1000, 3000]));
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def numberOfWays(n: int) -> int:
              MOD = 10**9 + 7
              a, b = 1, 1
              for _ in range(2, n + 1):
                  a, b = b, (a + b) % MOD
              return b
        `,
        javascript: code`
          var numberOfWays = function(n) {
              var MOD = 1000000007;
              var a = 1, b = 1;
              for (var i = 2; i <= n; i++) {
                  var c = (a + b) % MOD;
                  a = b;
                  b = c;
              }
              return b;
          };
        `,
        typescript: code`
          function numberOfWays(n: number): number {
              var MOD = 1000000007;
              var a = 1, b = 1;
              for (var i = 2; i <= n; i++) {
                  var c = (a + b) % MOD;
                  a = b;
                  b = c;
              }
              return b;
          }
        `,
        java: code`
          public static int numberOfWays(int n) {
              final long MOD = 1000000007L;
              long a = 1, b = 1;
              for (int i = 2; i <= n; i++) {
                  long c = (a + b) % MOD;
                  a = b;
                  b = c;
              }
              return (int) b;
          }
        `,
        cpp: code`
          int numberOfWays(int n) {
              const long long MOD = 1000000007LL;
              long long a = 1, b = 1;
              for (int i = 2; i <= n; i++) {
                  long long c = (a + b) % MOD;
                  a = b;
                  b = c;
              }
              return (int) b;
          }
        `,
        c: code`
          int numberOfWays(int n) {
              const long long MOD = 1000000007LL;
              long long a = 1, b = 1;
              for (int i = 2; i <= n; i++) {
                  long long c = (a + b) % MOD;
                  a = b;
                  b = c;
              }
              return (int) b;
          }
        `,
        csharp: code`
          public static int NumberOfWays(int n)
          {
              const long MOD = 1000000007L;
              long a = 1, b = 1;
              for (int i = 2; i <= n; i++)
              {
                  long c = (a + b) % MOD;
                  a = b;
                  b = c;
              }
              return (int) b;
          }
        `,
        go: code`
          func numberOfWays(n int) int {
              const mod = 1000000007
              a, b := 1, 1
              for i := 2; i <= n; i++ {
                  a, b = b, (a+b)%mod
              }
              return b
          }
        `,
        kotlin: code`
          fun numberOfWays(n: Int): Int {
              val modulus = 1000000007L
              var a = 1L
              var b = 1L
              for (i in 2..n) {
                  val c = (a + b) % modulus
                  a = b
                  b = c
              }
              return b.toInt()
          }
        `,
        swift: code`
          func numberOfWays(_ n: Int) -> Int {
              let modulus = 1000000007
              var a = 1, b = 1
              var i = 2
              while i <= n {
                  let c = (a + b) % modulus
                  a = b
                  b = c
                  i += 1
              }
              return b
          }
        `,
        rust: code`
          fn numberOfWays(n: i32) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let (mut a, mut b) = (1i64, 1i64);
              for _ in 2..=n {
                  let c = (a + b) % modulus;
                  a = b;
                  b = c;
              }
              b as i32
          }
        `,
        php: code`
          function numberOfWays($n) {
              $MOD = 1000000007;
              $a = 1;
              $b = 1;
              for ($i = 2; $i <= $n; $i++) {
                  $c = ($a + $b) % $MOD;
                  $a = $b;
                  $b = $c;
              }
              return $b;
          }
        `,
        ruby: code`
          def numberOfWays(n)
            mod = 1_000_000_007
            a = 1
            b = 1
            (2..n).each do
              a, b = b, (a + b) % mod
            end
            b
          end
        `,
      },
    };
  })(),

  // ── Can I Win (LC 464) ───────────────────────────────────────────
  (() => {
    const ref = (maxChoosableInteger: number, desiredTotal: number) => {
      if (desiredTotal <= 0) return true;
      if ((maxChoosableInteger * (maxChoosableInteger + 1)) / 2 < desiredTotal) return false;
      const memo = new Map<number, boolean>();
      const win = (used: number, left: number): boolean => {
        if (memo.has(used)) return memo.get(used)!;
        let res = false;
        for (let i = 1; i <= maxChoosableInteger && !res; i++) {
          if (used & (1 << i)) continue;
          if (i >= left || !win(used | (1 << i), left - i)) res = true;
        }
        memo.set(used, res);
        return res;
      };
      return win(0, desiredTotal);
    };
    return {
      slug: "can-i-win",
      title: "Can I Win",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Dynamic Programming", "Bit Manipulation", "Memoization", "Game Theory", "Bitmask", "LinkedIn", "Amazon", "Google"],
      signature: {
        funcName: "canIWin",
        params: [{ name: "maxChoosableInteger", type: "int" as const }, { name: "desiredTotal", type: "int" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "Two players share a running total that starts at `0`. They take turns, and on each turn a player picks one of the integers `1, 2, …, maxChoosableInteger` and adds it to the total. **Each integer can be picked only once** in the whole game, by either player.\n\nThe player whose pick makes the running total reach **or exceed** `desiredTotal` wins.\n\nThe first player moves first. Assuming both players always play optimally, return `true` if the first player can force a win, and `false` otherwise. (If the numbers run out before the total is reached, nobody reaches it, and the first player has not won.)",
        [
          { in: "maxChoosableInteger = 10, desiredTotal = 11", out: "false", note: "Whatever x the first player picks, the second player picks 11 - x (always available and different from x) and reaches 11." },
          { in: "maxChoosableInteger = 10, desiredTotal = 0", out: "true", note: "The target is already met before anyone moves." },
          { in: "maxChoosableInteger = 10, desiredTotal = 1", out: "true", note: "Any pick reaches 1." },
        ],
        ["1 <= maxChoosableInteger <= 20", "0 <= desiredTotal <= 300"]),
      hints: [
        "Two quick answers first: a target `<= 0` is already won, and if `1 + 2 + … + maxChoosableInteger < desiredTotal` nobody can ever reach it.",
        "The remaining total is determined by which numbers have been used, so the whole game state is the *set* of used numbers — at most `2^20` states. Encode it as a bitmask.",
        "The player to move wins from a state if some unused `i` either reaches the target immediately (`i >= remaining`) or leads to a state from which the opponent loses. Memoise win/lose per mask.",
      ],
      editorial: explain({
        idea: "This is a finite two-player game without chance, so every position is a forced win or a forced loss for the player to move. The position is fully described by the set of numbers already used (the remaining target follows from it), so memoising over a bitmask of used numbers makes the game tree a DAG of at most `2^m` nodes.",
        steps: [
          "If `desiredTotal <= 0` return `true`; if `m(m+1)/2 < desiredTotal` return `false` (`m = maxChoosableInteger`).",
          "Define `win(used, remaining)`: for each `i` in `1..m` not in `used`, if `i >= remaining` or `!win(used | bit(i), remaining - i)`, return `true`. Otherwise return `false`.",
          "Cache the result by `used` (an array of size `2^(m+1)` with unknown / win / lose).",
          "Return `win(0, desiredTotal)`.",
        ],
        why: "A move that reaches the target wins on the spot; any other move hands the opponent the position `used | bit(i)` with them to move. The mover can force a win exactly when some move leaves the opponent in a losing position — the standard win/lose recursion. Since `remaining = desiredTotal - sum(used)`, two calls with the same mask always have the same remaining total, so caching by mask alone is sound.",
        time: "O(2^m * m)",
        space: "O(2^m)",
        pitfalls: [
          "Without the `sum < desiredTotal` check, a game where nobody can win would be reported as a loss for the first player only by accident of the recursion — the check makes it explicit and fast.",
          "`desiredTotal = 0` is a win for the first player even though no move is made.",
          "Memoising on `(used, remaining)` as a string key is correct but slow; the mask alone is enough.",
        ],
      }),
      examples: [
        { input: "10\n11", expectedOutput: "false" },
        { input: "10\n0", expectedOutput: "true" },
        { input: "10\n1", expectedOutput: "true" },
      ],
      hiddenCount: 800,
      gen: (rng: Rng) => {
        const m = rng() < 0.08 ? ri(rng, 11, 12) : ri(rng, 1, pick(rng, [3, 6, 8, 10]));
        const sum = (m * (m + 1)) / 2;
        const r = rng();
        const total = r < 0.05 ? 0 : r < 0.15 ? ri(rng, sum + 1, Math.min(300, sum + 20)) : ri(rng, 1, Math.min(300, sum));
        return { input: `${m}\n${total}`, expectedOutput: bool(ref(m, total)) };
      },
      solutions: {
        python: code`
          def canIWin(maxChoosableInteger: int, desiredTotal: int) -> bool:
              m = maxChoosableInteger
              if desiredTotal <= 0:
                  return True
              if m * (m + 1) // 2 < desiredTotal:
                  return False
              memo = {}

              def win(used, remaining):
                  if used in memo:
                      return memo[used]
                  res = False
                  for i in range(1, m + 1):
                      bit = 1 << i
                      if used & bit:
                          continue
                      if i >= remaining or not win(used | bit, remaining - i):
                          res = True
                          break
                  memo[used] = res
                  return res

              return win(0, desiredTotal)
        `,
        javascript: code`
          var canIWin = function(maxChoosableInteger, desiredTotal) {
              var m = maxChoosableInteger;
              if (desiredTotal <= 0) return true;
              if (m * (m + 1) / 2 < desiredTotal) return false;
              var memo = new Int8Array(1 << (m + 1)); // 0 unknown, 1 win, 2 lose
              var win = function(used, remaining) {
                  if (memo[used] !== 0) return memo[used] === 1;
                  var res = false;
                  for (var i = 1; i <= m; i++) {
                      var bit = 1 << i;
                      if (used & bit) continue;
                      if (i >= remaining || !win(used | bit, remaining - i)) { res = true; break; }
                  }
                  memo[used] = res ? 1 : 2;
                  return res;
              };
              return win(0, desiredTotal);
          };
        `,
        typescript: code`
          function canIWin(maxChoosableInteger: number, desiredTotal: number): boolean {
              var m = maxChoosableInteger;
              if (desiredTotal <= 0) return true;
              if (m * (m + 1) / 2 < desiredTotal) return false;
              var memo: number[] = [];
              for (var t = 0; t < (1 << (m + 1)); t++) memo.push(0); // 0 unknown, 1 win, 2 lose
              var win = function(used: number, remaining: number): boolean {
                  if (memo[used] !== 0) return memo[used] === 1;
                  var res = false;
                  for (var i = 1; i <= m; i++) {
                      var bit = 1 << i;
                      if (used & bit) continue;
                      if (i >= remaining || !win(used | bit, remaining - i)) { res = true; break; }
                  }
                  memo[used] = res ? 1 : 2;
                  return res;
              };
              return win(0, desiredTotal);
          }
        `,
        java: code`
          static byte[] canWinMemo;
          static int canWinMax;

          static boolean canWin(int used, int remaining) {
              if (canWinMemo[used] != 0) return canWinMemo[used] == 1;
              boolean res = false;
              for (int i = 1; i <= canWinMax; i++) {
                  int bit = 1 << i;
                  if ((used & bit) != 0) continue;
                  if (i >= remaining || !canWin(used | bit, remaining - i)) { res = true; break; }
              }
              canWinMemo[used] = (byte) (res ? 1 : 2);
              return res;
          }

          public static boolean canIWin(int maxChoosableInteger, int desiredTotal) {
              int m = maxChoosableInteger;
              if (desiredTotal <= 0) return true;
              if (m * (m + 1) / 2 < desiredTotal) return false;
              canWinMax = m;
              canWinMemo = new byte[1 << (m + 1)];
              return canWin(0, desiredTotal);
          }
        `,
        cpp: code`
          bool canWinFrom(int used, int remaining, int m, vector<signed char>& memo) {
              if (memo[used] != 0) return memo[used] == 1;
              bool res = false;
              for (int i = 1; i <= m; i++) {
                  int bit = 1 << i;
                  if (used & bit) continue;
                  if (i >= remaining || !canWinFrom(used | bit, remaining - i, m, memo)) { res = true; break; }
              }
              memo[used] = res ? 1 : 2;
              return res;
          }

          bool canIWin(int maxChoosableInteger, int desiredTotal) {
              int m = maxChoosableInteger;
              if (desiredTotal <= 0) return true;
              if (m * (m + 1) / 2 < desiredTotal) return false;
              vector<signed char> memo(1 << (m + 1), 0);
              return canWinFrom(0, desiredTotal, m, memo);
          }
        `,
        c: code`
          static bool canWinFrom(int used, int remaining, int m, signed char* memo) {
              if (memo[used] != 0) return memo[used] == 1;
              bool res = false;
              for (int i = 1; i <= m; i++) {
                  int bit = 1 << i;
                  if (used & bit) continue;
                  if (i >= remaining || !canWinFrom(used | bit, remaining - i, m, memo)) { res = true; break; }
              }
              memo[used] = res ? 1 : 2;
              return res;
          }

          bool canIWin(int maxChoosableInteger, int desiredTotal) {
              int m = maxChoosableInteger;
              if (desiredTotal <= 0) return true;
              if (m * (m + 1) / 2 < desiredTotal) return false;
              signed char* memo = (signed char*) calloc((size_t) 1 << (m + 1), 1);
              bool ans = canWinFrom(0, desiredTotal, m, memo);
              free(memo);
              return ans;
          }
        `,
        csharp: code`
          static bool CanWinFrom(int used, int remaining, int m, sbyte[] memo)
          {
              if (memo[used] != 0) return memo[used] == 1;
              bool res = false;
              for (int i = 1; i <= m; i++)
              {
                  int bit = 1 << i;
                  if ((used & bit) != 0) continue;
                  if (i >= remaining || !CanWinFrom(used | bit, remaining - i, m, memo)) { res = true; break; }
              }
              memo[used] = (sbyte) (res ? 1 : 2);
              return res;
          }

          public static bool CanIWin(int maxChoosableInteger, int desiredTotal)
          {
              int m = maxChoosableInteger;
              if (desiredTotal <= 0) return true;
              if (m * (m + 1) / 2 < desiredTotal) return false;
              return CanWinFrom(0, desiredTotal, m, new sbyte[1 << (m + 1)]);
          }
        `,
        go: code`
          func canWinFrom(used int, remaining int, m int, memo []int8) bool {
              if memo[used] != 0 {
                  return memo[used] == 1
              }
              res := false
              for i := 1; i <= m; i++ {
                  bit := 1 << uint(i)
                  if used&bit != 0 {
                      continue
                  }
                  if i >= remaining || !canWinFrom(used|bit, remaining-i, m, memo) {
                      res = true
                      break
                  }
              }
              if res {
                  memo[used] = 1
              } else {
                  memo[used] = 2
              }
              return res
          }

          func canIWin(maxChoosableInteger int, desiredTotal int) bool {
              m := maxChoosableInteger
              if desiredTotal <= 0 {
                  return true
              }
              if m*(m+1)/2 < desiredTotal {
                  return false
              }
              memo := make([]int8, 1<<uint(m+1))
              return canWinFrom(0, desiredTotal, m, memo)
          }
        `,
        kotlin: code`
          fun canIWin(maxChoosableInteger: Int, desiredTotal: Int): Boolean {
              val m = maxChoosableInteger
              if (desiredTotal <= 0) return true
              if (m * (m + 1) / 2 < desiredTotal) return false
              val memo = ByteArray(1 shl (m + 1))
              fun win(used: Int, remaining: Int): Boolean {
                  if (memo[used].toInt() != 0) return memo[used].toInt() == 1
                  var res = false
                  for (i in 1..m) {
                      val bit = 1 shl i
                      if (used and bit != 0) continue
                      if (i >= remaining || !win(used or bit, remaining - i)) { res = true; break }
                  }
                  memo[used] = if (res) 1 else 2
                  return res
              }
              return win(0, desiredTotal)
          }
        `,
        swift: code`
          func canIWin(_ maxChoosableInteger: Int, _ desiredTotal: Int) -> Bool {
              let m = maxChoosableInteger
              if desiredTotal <= 0 { return true }
              if m * (m + 1) / 2 < desiredTotal { return false }
              var memo = [Int8](repeating: 0, count: 1 << (m + 1))
              func win(_ used: Int, _ remaining: Int) -> Bool {
                  if memo[used] != 0 { return memo[used] == 1 }
                  var res = false
                  for i in 1...m {
                      let bit = 1 << i
                      if used & bit != 0 { continue }
                      if i >= remaining || !win(used | bit, remaining - i) { res = true; break }
                  }
                  memo[used] = res ? 1 : 2
                  return res
              }
              return win(0, desiredTotal)
          }
        `,
        rust: code`
          fn can_win_from(used: usize, remaining: i32, m: i32, memo: &mut Vec<u8>) -> bool {
              if memo[used] != 0 {
                  return memo[used] == 1;
              }
              let mut res = false;
              for i in 1..=m {
                  let bit = 1usize << i;
                  if used & bit != 0 {
                      continue;
                  }
                  if i >= remaining || !can_win_from(used | bit, remaining - i, m, memo) {
                      res = true;
                      break;
                  }
              }
              memo[used] = if res { 1 } else { 2 };
              res
          }

          fn canIWin(maxChoosableInteger: i32, desiredTotal: i32) -> bool {
              let m = maxChoosableInteger;
              if desiredTotal <= 0 {
                  return true;
              }
              if m * (m + 1) / 2 < desiredTotal {
                  return false;
              }
              let mut memo = vec![0u8; 1usize << (m + 1)];
              can_win_from(0, desiredTotal, m, &mut memo)
          }
        `,
        php: code`
          function canIWin($maxChoosableInteger, $desiredTotal) {
              $m = $maxChoosableInteger;
              if ($desiredTotal <= 0) return true;
              if (intdiv($m * ($m + 1), 2) < $desiredTotal) return false;
              $memo = [];
              $win = function ($used, $remaining) use (&$win, &$memo, $m) {
                  if (isset($memo[$used])) return $memo[$used];
                  $res = false;
                  for ($i = 1; $i <= $m; $i++) {
                      $bit = 1 << $i;
                      if ($used & $bit) continue;
                      if ($i >= $remaining || !$win($used | $bit, $remaining - $i)) { $res = true; break; }
                  }
                  $memo[$used] = $res;
                  return $res;
              };
              return $win(0, $desiredTotal);
          }
        `,
        ruby: code`
          def can_win_from(used, remaining, m, memo)
            cached = memo[used]
            return cached == 1 unless cached == 0
            res = false
            (1..m).each do |i|
              bit = 1 << i
              next if used & bit != 0
              if i >= remaining || !can_win_from(used | bit, remaining - i, m, memo)
                res = true
                break
              end
            end
            memo[used] = res ? 1 : 2
            res
          end

          def canIWin(maxChoosableInteger, desiredTotal)
            m = maxChoosableInteger
            return true if desiredTotal <= 0
            return false if m * (m + 1) / 2 < desiredTotal
            can_win_from(0, desiredTotal, m, Array.new(1 << (m + 1), 0))
          end
        `,
      },
    };
  })(),

  // ── Freedom Trail (LC 514) ───────────────────────────────────────
  (() => {
    const ref = (ring: string, key: string) => {
      const n = ring.length;
      const memo = new Map<number, number>();
      const go = (i: number, pos: number): number => {
        if (i === key.length) return 0;
        const k = i * 1000 + pos;
        if (memo.has(k)) return memo.get(k)!;
        let b = Infinity;
        for (let j = 0; j < n; j++) {
          if (ring[j] !== key[i]) continue;
          const d = Math.abs(j - pos);
          b = Math.min(b, Math.min(d, n - d) + 1 + go(i + 1, j));
        }
        memo.set(k, b);
        return b;
      };
      return go(0, 0);
    };
    return {
      slug: "freedom-trail",
      title: "Freedom Trail",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Depth-First Search", "Breadth-First Search", "Google", "Amazon"],
      signature: {
        funcName: "findRotateSteps",
        params: [{ name: "ring", type: "string" as const }, { name: "key", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A circular dial has the characters of `ring` engraved around its edge, in order. One position, the **12:00 mark**, is special; at the start, `ring[0]` is aligned with it.\n\nTo spell a word `key`, you enter its characters one by one. For each character you:\n\n1. rotate the ring clockwise or anticlockwise, one position per **step**, until some occurrence of that character sits at 12:00, and then\n2. press the centre button, which also counts as **one step**.\n\nReturn the **minimum** total number of steps to spell all of `key`. It is guaranteed that every character of `key` appears somewhere in `ring`.",
        [
          { in: "ring = \"godding\", key = \"gd\"", out: "4", note: "'g' is already at 12:00: press (1 step). Rotate anticlockwise two positions to the 'd' at index 5 (2 steps) and press (1 step)." },
          { in: "ring = \"godding\", key = \"godding\"", out: "13" },
          { in: "ring = \"a\", key = \"aaa\"", out: "3", note: "Only the three button presses." },
        ],
        ["1 <= ring.length, key.length <= 100", "ring and key consist of lowercase English letters", "every character of key occurs in ring"]),
      hints: [
        "Greedily rotating to the *nearest* copy of each character can be wrong — the copy you stop at affects the cost of every later character.",
        "After spelling `key[0..i]`, all that matters for the future is *which index* of `ring` is at 12:00. That suggests a DP over (characters spelled, ring position).",
        "Let `cost[p]` be the cheapest way to have just pressed at ring position `p`. For the next character, every position `q` holding it gets `min over p of cost[p] + dist(p, q)` with `dist = min(|p - q|, n - |p - q|)`. Add one press per character.",
      ],
      editorial: explain({
        idea: "The state of the dial between characters is just the index aligned with 12:00. For each character of `key`, the dial must end at one of that character's positions, and the cheapest way to get there depends only on where it was after the previous character — a layered shortest-path / DP over positions.",
        steps: [
          "Group the indices of `ring` by character.",
          "Start with `cost = {0: 0}` (index 0 at 12:00, nothing spent).",
          "For each character `c` of `key`: for every index `q` with `ring[q] == c`, `next[q] = min over previous p of cost[p] + min(|p - q|, n - |p - q|)`. Replace `cost` by `next`.",
          "Return `min(cost) + key.length` — each character also costs one press.",
        ],
        why: "Rotating between two alignments costs exactly their circular distance, and the shortest way to spell `key[0..i]` ending at `q` must spell `key[0..i-1]` optimally ending at *some* `p` and then rotate from `p` to `q`. Taking the minimum over all `p` covers every possibility, so each layer is exact, and the last layer's minimum is the answer.",
        time: "O(k * n^2) in the worst case (O(k * a * b) for the sizes of consecutive character groups)",
        space: "O(n)",
        pitfalls: [
          "Choosing the nearest occurrence greedily: in \"godding\" the two 'd's and two 'g's make that sub-optimal on some keys.",
          "The rotation is circular — the distance is `min(d, n - d)`, not `d`.",
          "Don't forget the button press for every character, including repeated ones that need no rotation.",
        ],
      }),
      examples: [
        { input: "\"godding\"\n\"gd\"", expectedOutput: "4" },
        { input: "\"godding\"\n\"godding\"", expectedOutput: "13" },
        { input: "\"a\"\n\"aaa\"", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcde", "abcdefghij"]);
        const ring = randLower(rng, 1, pick(rng, [1, 6, 15, 30]), alpha);
        const klen = ri(rng, 1, pick(rng, [1, 5, 15, 30]));
        let key = "";
        for (let i = 0; i < klen; i++) key += ring[ri(rng, 0, ring.length - 1)];
        return { input: `${JSON.stringify(ring)}\n${JSON.stringify(key)}`, expectedOutput: String(ref(ring, key)) };
      },
      solutions: {
        python: code`
          def findRotateSteps(ring: str, key: str) -> int:
              n = len(ring)
              where = {}
              for i, ch in enumerate(ring):
                  where.setdefault(ch, []).append(i)
              cost = {0: 0}
              for ch in key:
                  nxt = {}
                  for q in where[ch]:
                      best = None
                      for p, c in cost.items():
                          d = abs(p - q)
                          cand = c + min(d, n - d)
                          if best is None or cand < best:
                              best = cand
                      nxt[q] = best
                  cost = nxt
              return min(cost.values()) + len(key)
        `,
        javascript: code`
          var findRotateSteps = function(ring, key) {
              var n = ring.length;
              var INF = 1e9;
              var cost = new Array(n).fill(INF);
              cost[0] = 0;
              for (var i = 0; i < key.length; i++) {
                  var next = new Array(n).fill(INF);
                  for (var q = 0; q < n; q++) {
                      if (ring.charAt(q) !== key.charAt(i)) continue;
                      for (var p = 0; p < n; p++) {
                          if (cost[p] === INF) continue;
                          var d = Math.abs(p - q);
                          var cand = cost[p] + Math.min(d, n - d);
                          if (cand < next[q]) next[q] = cand;
                      }
                  }
                  cost = next;
              }
              var best = INF;
              for (var k = 0; k < n; k++) if (cost[k] < best) best = cost[k];
              return best + key.length;
          };
        `,
        typescript: code`
          function findRotateSteps(ring: string, key: string): number {
              var n = ring.length;
              var INF = 1e9;
              var cost: number[] = [];
              for (var t = 0; t < n; t++) cost.push(INF);
              cost[0] = 0;
              for (var i = 0; i < key.length; i++) {
                  var next: number[] = [];
                  for (var t2 = 0; t2 < n; t2++) next.push(INF);
                  for (var q = 0; q < n; q++) {
                      if (ring.charAt(q) !== key.charAt(i)) continue;
                      for (var p = 0; p < n; p++) {
                          if (cost[p] === INF) continue;
                          var d = Math.abs(p - q);
                          var cand = cost[p] + Math.min(d, n - d);
                          if (cand < next[q]) next[q] = cand;
                      }
                  }
                  cost = next;
              }
              var best = INF;
              for (var k = 0; k < n; k++) if (cost[k] < best) best = cost[k];
              return best + key.length;
          }
        `,
        java: code`
          public static int findRotateSteps(String ring, String key) {
              int n = ring.length();
              final int INF = 1000000000;
              int[] cost = new int[n];
              Arrays.fill(cost, INF);
              cost[0] = 0;
              for (int i = 0; i < key.length(); i++) {
                  int[] next = new int[n];
                  Arrays.fill(next, INF);
                  char c = key.charAt(i);
                  for (int q = 0; q < n; q++) {
                      if (ring.charAt(q) != c) continue;
                      for (int p = 0; p < n; p++) {
                          if (cost[p] == INF) continue;
                          int d = Math.abs(p - q);
                          next[q] = Math.min(next[q], cost[p] + Math.min(d, n - d));
                      }
                  }
                  cost = next;
              }
              int best = INF;
              for (int v : cost) best = Math.min(best, v);
              return best + key.length();
          }
        `,
        cpp: code`
          int findRotateSteps(string ring, string key) {
              int n = ring.size();
              const int INF = 1000000000;
              vector<int> cost(n, INF);
              cost[0] = 0;
              for (char c : key) {
                  vector<int> next(n, INF);
                  for (int q = 0; q < n; q++) {
                      if (ring[q] != c) continue;
                      for (int p = 0; p < n; p++) {
                          if (cost[p] == INF) continue;
                          int d = abs(p - q);
                          next[q] = min(next[q], cost[p] + min(d, n - d));
                      }
                  }
                  cost = next;
              }
              return *min_element(cost.begin(), cost.end()) + (int) key.size();
          }
        `,
        c: code`
          int findRotateSteps(const char* ring, const char* key) {
              int n = (int) strlen(ring), k = (int) strlen(key);
              const int INF = 1000000000;
              int* cost = (int*) malloc((size_t) n * sizeof(int));
              int* next = (int*) malloc((size_t) n * sizeof(int));
              for (int p = 0; p < n; p++) cost[p] = INF;
              cost[0] = 0;
              for (int i = 0; i < k; i++) {
                  for (int q = 0; q < n; q++) {
                      next[q] = INF;
                      if (ring[q] != key[i]) continue;
                      for (int p = 0; p < n; p++) {
                          if (cost[p] == INF) continue;
                          int d = p > q ? p - q : q - p;
                          int step = d < n - d ? d : n - d;
                          if (cost[p] + step < next[q]) next[q] = cost[p] + step;
                      }
                  }
                  int* t = cost; cost = next; next = t;
              }
              int best = INF;
              for (int p = 0; p < n; p++) if (cost[p] < best) best = cost[p];
              free(cost);
              free(next);
              return best + k;
          }
        `,
        csharp: code`
          public static int FindRotateSteps(string ring, string key)
          {
              int n = ring.Length;
              const int INF = 1000000000;
              int[] cost = new int[n];
              for (int p = 0; p < n; p++) cost[p] = INF;
              cost[0] = 0;
              foreach (char c in key)
              {
                  int[] next = new int[n];
                  for (int q = 0; q < n; q++)
                  {
                      next[q] = INF;
                      if (ring[q] != c) continue;
                      for (int p = 0; p < n; p++)
                      {
                          if (cost[p] == INF) continue;
                          int d = Math.Abs(p - q);
                          next[q] = Math.Min(next[q], cost[p] + Math.Min(d, n - d));
                      }
                  }
                  cost = next;
              }
              int best = INF;
              foreach (int v in cost) best = Math.Min(best, v);
              return best + key.Length;
          }
        `,
        go: code`
          func findRotateSteps(ring string, key string) int {
              n := len(ring)
              const inf = 1000000000
              cost := make([]int, n)
              for p := range cost {
                  cost[p] = inf
              }
              cost[0] = 0
              for i := 0; i < len(key); i++ {
                  next := make([]int, n)
                  for q := 0; q < n; q++ {
                      next[q] = inf
                      if ring[q] != key[i] {
                          continue
                      }
                      for p := 0; p < n; p++ {
                          if cost[p] == inf {
                              continue
                          }
                          d := p - q
                          if d < 0 {
                              d = -d
                          }
                          if n-d < d {
                              d = n - d
                          }
                          if cost[p]+d < next[q] {
                              next[q] = cost[p] + d
                          }
                      }
                  }
                  cost = next
              }
              best := inf
              for _, v := range cost {
                  if v < best {
                      best = v
                  }
              }
              return best + len(key)
          }
        `,
        kotlin: code`
          fun findRotateSteps(ring: String, key: String): Int {
              val n = ring.length
              val inf = 1000000000
              var cost = IntArray(n) { inf }
              cost[0] = 0
              for (c in key) {
                  val next = IntArray(n) { inf }
                  for (q in 0 until n) {
                      if (ring[q] != c) continue
                      for (p in 0 until n) {
                          if (cost[p] == inf) continue
                          val d = Math.abs(p - q)
                          next[q] = minOf(next[q], cost[p] + minOf(d, n - d))
                      }
                  }
                  cost = next
              }
              return cost.minOrNull()!! + key.length
          }
        `,
        swift: code`
          func findRotateSteps(_ ring: String, _ key: String) -> Int {
              let r = Array(ring.utf8), k = Array(key.utf8)
              let n = r.count
              let inf = 1000000000
              var cost = [Int](repeating: inf, count: n)
              cost[0] = 0
              for c in k {
                  var next = [Int](repeating: inf, count: n)
                  for q in 0..<n where r[q] == c {
                      for p in 0..<n where cost[p] != inf {
                          let d = abs(p - q)
                          next[q] = min(next[q], cost[p] + min(d, n - d))
                      }
                  }
                  cost = next
              }
              return cost.min()! + k.count
          }
        `,
        rust: code`
          fn findRotateSteps(ring: String, key: String) -> i32 {
              let r = ring.as_bytes();
              let k = key.as_bytes();
              let n = r.len() as i32;
              let inf = 1_000_000_000i32;
              let mut cost = vec![inf; n as usize];
              cost[0] = 0;
              for &c in k.iter() {
                  let mut next = vec![inf; n as usize];
                  for q in 0..n {
                      if r[q as usize] != c {
                          continue;
                      }
                      for p in 0..n {
                          if cost[p as usize] == inf {
                              continue;
                          }
                          let d = (p - q).abs();
                          let step = d.min(n - d);
                          if cost[p as usize] + step < next[q as usize] {
                              next[q as usize] = cost[p as usize] + step;
                          }
                      }
                  }
                  cost = next;
              }
              *cost.iter().min().unwrap() + k.len() as i32
          }
        `,
        php: code`
          function findRotateSteps($ring, $key) {
              $n = strlen($ring);
              $k = strlen($key);
              $INF = 1000000000;
              $cost = array_fill(0, $n, $INF);
              $cost[0] = 0;
              for ($i = 0; $i < $k; $i++) {
                  $next = array_fill(0, $n, $INF);
                  $c = $key[$i];
                  for ($q = 0; $q < $n; $q++) {
                      if ($ring[$q] !== $c) continue;
                      for ($p = 0; $p < $n; $p++) {
                          if ($cost[$p] == $INF) continue;
                          $d = abs($p - $q);
                          $cand = $cost[$p] + min($d, $n - $d);
                          if ($cand < $next[$q]) $next[$q] = $cand;
                      }
                  }
                  $cost = $next;
              }
              return min($cost) + $k;
          }
        `,
        ruby: code`
          def findRotateSteps(ring, key)
            r = ring.bytes
            n = r.length
            inf = 1_000_000_000
            cost = Array.new(n, inf)
            cost[0] = 0
            key.each_byte do |c|
              nxt = Array.new(n, inf)
              (0...n).each do |q|
                next unless r[q] == c
                (0...n).each do |p|
                  next if cost[p] == inf
                  d = (p - q).abs
                  d = n - d if n - d < d
                  nxt[q] = cost[p] + d if cost[p] + d < nxt[q]
                end
              end
              cost = nxt
            end
            cost.min + key.length
          end
        `,
      },
    };
  })(),

  // ── Non-negative Integers without Consecutive Ones (LC 600) ──────
  (() => {
    const ref = (n: number) => {
      if (n <= 4000) {
        let c = 0;
        for (let x = 0; x <= n; x++) if ((x & (x >> 1)) === 0) c++;
        return c;
      }
      // Digit DP over the bits of n: (position, previous bit, still tight).
      const bits = n.toString(2);
      const memo = new Map<string, number>();
      const go = (i: number, prev: number, tight: boolean): number => {
        if (i === bits.length) return 1;
        const key = `${i},${prev},${tight}`;
        if (memo.has(key)) return memo.get(key)!;
        const lim = tight ? Number(bits[i]) : 1;
        let total = 0;
        for (let b = 0; b <= lim; b++) {
          if (b === 1 && prev === 1) continue;
          total += go(i + 1, b, tight && b === lim);
        }
        memo.set(key, total);
        return total;
      };
      return go(0, 0, true);
    };
    return {
      slug: "non-negative-integers-without-consecutive-ones",
      title: "Non-negative Integers without Consecutive Ones",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Digit DP", "Bit Manipulation", "Google", "Amazon"],
      signature: { funcName: "findIntegers", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a positive integer `n`, count the integers `x` with `0 <= x <= n` whose binary representation does **not** contain two adjacent `1` bits.",
        [
          { in: "n = 5", out: "5", note: "0, 1, 2 (10), 4 (100) and 5 (101) qualify; 3 (11) does not." },
          { in: "n = 1", out: "2", note: "Both 0 and 1 qualify." },
          { in: "n = 2", out: "3" },
        ],
        ["1 <= n <= 10^9"]),
      hints: [
        "Count first for a full range: how many bit strings of length `k` have no two adjacent ones? Condition on the first bit.",
        "That count is Fibonacci-like: `f(k) = f(k - 1) + f(k - 2)` with `f(0) = 1`, `f(1) = 2`, and it equals the number of valid integers in `[0, 2^k)`.",
        "Walk the bits of `n` from the top. At each `1` bit at position `k`, every number that has a `0` there and matches `n` above it is below `n`: add `f(k)`. Stop as soon as `n` itself has two adjacent ones; if you never stop, `n` is valid — add 1.",
      ],
      editorial: explain({
        idea: "Valid numbers below a power of two are counted by a Fibonacci recurrence. Every number `x <= n` either equals `n` or first differs from `n` at some bit where `n` has a `1` and `x` has a `0`; below that bit `x` is free, so each such branch contributes a Fibonacci count — provided the prefix shared with `n` is itself valid.",
        steps: [
          "Precompute `f[0] = 1, f[1] = 2, f[k] = f[k-1] + f[k-2]` for `k` up to 31.",
          "Scan bit positions `k` from 30 down to 0, remembering whether the previous (higher) bit of `n` was `1`.",
          "When bit `k` of `n` is `1`: add `f[k]` (numbers with a `0` here and anything valid below). If the previous bit was also `1`, return the total now — every remaining number with this prefix contains `11`.",
          "If the scan finishes, `n` itself is valid: return total + 1.",
        ],
        why: "`f(k)` counts length-`k` strings with no adjacent ones: a leading `0` leaves `f(k-1)` options, a leading `1` forces a `0` next and leaves `f(k-2)`. Grouping all `x < n` by the highest bit where they differ from `n` gives disjoint groups, each a fixed valid prefix followed by `0` and `k` free bits; placing a `0` after the prefix can never create `11`, so the group has exactly `f(k)` valid members. Once `n`'s own prefix contains `11`, no later group is valid.",
        time: "O(log n)",
        space: "O(log n) (O(1) with a fixed 32-entry table)",
        pitfalls: [
          "Forgetting to count `n` itself (and `0`): the final `+ 1` only applies when `n` has no adjacent ones.",
          "Brute force up to `10^9` is far too slow.",
          "Stopping at the *second* of two adjacent ones — after adding its `f[k]` — not before.",
        ],
      }),
      examples: [
        { input: "5", expectedOutput: "5" },
        { input: "1", expectedOutput: "2" },
        { input: "2", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const r = rng();
        let n: number;
        if (r < 0.3) n = ri(rng, 1, 64);
        else if (r < 0.5) n = ri(rng, 65, 4000);
        else if (r < 0.65) {
          const k = ri(rng, 1, 29);
          n = Math.min(1000000000, pick(rng, [2 ** k, 2 ** k - 1, 2 ** k + 1]));
        } else if (r < 0.75) {
          // Alternating patterns like 101010… and their neighbours.
          let x = 0;
          const len = ri(rng, 1, 29);
          for (let i = 0; i < len; i++) x = x * 2 + (i % 2 === 0 ? 1 : 0);
          n = Math.max(1, Math.min(1000000000, x + ri(rng, -1, 1)));
        } else n = ri(rng, 1, 1000000000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def findIntegers(n: int) -> int:
              f = [1, 2]
              for _ in range(30):
                  f.append(f[-1] + f[-2])
              total = 0
              prev = 0
              for k in range(30, -1, -1):
                  if (n >> k) & 1:
                      total += f[k]
                      if prev:
                          return total
                      prev = 1
                  else:
                      prev = 0
              return total + 1
        `,
        javascript: code`
          var findIntegers = function(n) {
              var f = [1, 2];
              for (var i = 2; i <= 31; i++) f.push(f[i - 1] + f[i - 2]);
              var total = 0, prev = 0;
              for (var k = 30; k >= 0; k--) {
                  if ((n >> k) & 1) {
                      total += f[k];
                      if (prev) return total;
                      prev = 1;
                  } else {
                      prev = 0;
                  }
              }
              return total + 1;
          };
        `,
        typescript: code`
          function findIntegers(n: number): number {
              var f: number[] = [1, 2];
              for (var i = 2; i <= 31; i++) f.push(f[i - 1] + f[i - 2]);
              var total = 0, prev = 0;
              for (var k = 30; k >= 0; k--) {
                  if ((n >> k) & 1) {
                      total += f[k];
                      if (prev) return total;
                      prev = 1;
                  } else {
                      prev = 0;
                  }
              }
              return total + 1;
          }
        `,
        java: code`
          public static int findIntegers(int n) {
              int[] f = new int[32];
              f[0] = 1;
              f[1] = 2;
              for (int i = 2; i < 32; i++) f[i] = f[i - 1] + f[i - 2];
              int total = 0;
              boolean prev = false;
              for (int k = 30; k >= 0; k--) {
                  if (((n >> k) & 1) == 1) {
                      total += f[k];
                      if (prev) return total;
                      prev = true;
                  } else {
                      prev = false;
                  }
              }
              return total + 1;
          }
        `,
        cpp: code`
          int findIntegers(int n) {
              int f[32];
              f[0] = 1;
              f[1] = 2;
              for (int i = 2; i < 32; i++) f[i] = f[i - 1] + f[i - 2];
              int total = 0;
              bool prev = false;
              for (int k = 30; k >= 0; k--) {
                  if ((n >> k) & 1) {
                      total += f[k];
                      if (prev) return total;
                      prev = true;
                  } else {
                      prev = false;
                  }
              }
              return total + 1;
          }
        `,
        c: code`
          int findIntegers(int n) {
              int f[32];
              f[0] = 1;
              f[1] = 2;
              for (int i = 2; i < 32; i++) f[i] = f[i - 1] + f[i - 2];
              int total = 0;
              int prev = 0;
              for (int k = 30; k >= 0; k--) {
                  if ((n >> k) & 1) {
                      total += f[k];
                      if (prev) return total;
                      prev = 1;
                  } else {
                      prev = 0;
                  }
              }
              return total + 1;
          }
        `,
        csharp: code`
          public static int FindIntegers(int n)
          {
              int[] f = new int[32];
              f[0] = 1;
              f[1] = 2;
              for (int i = 2; i < 32; i++) f[i] = f[i - 1] + f[i - 2];
              int total = 0;
              bool prev = false;
              for (int k = 30; k >= 0; k--)
              {
                  if (((n >> k) & 1) == 1)
                  {
                      total += f[k];
                      if (prev) return total;
                      prev = true;
                  }
                  else
                  {
                      prev = false;
                  }
              }
              return total + 1;
          }
        `,
        go: code`
          func findIntegers(n int) int {
              f := make([]int, 32)
              f[0], f[1] = 1, 2
              for i := 2; i < 32; i++ {
                  f[i] = f[i-1] + f[i-2]
              }
              total := 0
              prev := false
              for k := 30; k >= 0; k-- {
                  if (n>>uint(k))&1 == 1 {
                      total += f[k]
                      if prev {
                          return total
                      }
                      prev = true
                  } else {
                      prev = false
                  }
              }
              return total + 1
          }
        `,
        kotlin: code`
          fun findIntegers(n: Int): Int {
              val f = IntArray(32)
              f[0] = 1
              f[1] = 2
              for (i in 2 until 32) f[i] = f[i - 1] + f[i - 2]
              var total = 0
              var prev = false
              for (k in 30 downTo 0) {
                  if ((n shr k) and 1 == 1) {
                      total += f[k]
                      if (prev) return total
                      prev = true
                  } else {
                      prev = false
                  }
              }
              return total + 1
          }
        `,
        swift: code`
          func findIntegers(_ n: Int) -> Int {
              var f = [1, 2]
              for i in 2..<32 { f.append(f[i - 1] + f[i - 2]) }
              var total = 0
              var prev = false
              for k in stride(from: 30, through: 0, by: -1) {
                  if (n >> k) & 1 == 1 {
                      total += f[k]
                      if prev { return total }
                      prev = true
                  } else {
                      prev = false
                  }
              }
              return total + 1
          }
        `,
        rust: code`
          fn findIntegers(n: i32) -> i32 {
              let mut f = [0i32; 32];
              f[0] = 1;
              f[1] = 2;
              for i in 2..32 {
                  f[i] = f[i - 1] + f[i - 2];
              }
              let mut total = 0;
              let mut prev = false;
              for k in (0..=30).rev() {
                  if (n >> k) & 1 == 1 {
                      total += f[k as usize];
                      if prev {
                          return total;
                      }
                      prev = true;
                  } else {
                      prev = false;
                  }
              }
              total + 1
          }
        `,
        php: code`
          function findIntegers($n) {
              $f = [1, 2];
              for ($i = 2; $i < 32; $i++) $f[] = $f[$i - 1] + $f[$i - 2];
              $total = 0;
              $prev = false;
              for ($k = 30; $k >= 0; $k--) {
                  if (($n >> $k) & 1) {
                      $total += $f[$k];
                      if ($prev) return $total;
                      $prev = true;
                  } else {
                      $prev = false;
                  }
              }
              return $total + 1;
          }
        `,
        ruby: code`
          def findIntegers(n)
            f = [1, 2]
            30.times { f << f[-1] + f[-2] }
            total = 0
            prev = false
            30.downto(0) do |k|
              if (n >> k) & 1 == 1
                total += f[k]
                return total if prev
                prev = true
              else
                prev = false
              end
            end
            total + 1
          end
        `,
      },
    };
  })(),

  // ── K Inverse Pairs Array (LC 629) ───────────────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (n: number, k: number) => {
      // Insert the largest number i into each of its i slots: it creates 0..i-1 new pairs.
      let dp = new Array(k + 1).fill(0);
      dp[0] = 1;
      for (let i = 1; i <= n; i++) {
        const nd = new Array(k + 1).fill(0);
        if (i * k <= 4000) {
          for (let j = 0; j <= k; j++) for (let t = 0; t <= Math.min(j, i - 1); t++) nd[j] = (nd[j] + dp[j - t]) % MOD;
        } else {
          let window = 0;
          for (let j = 0; j <= k; j++) {
            window = (window + dp[j]) % MOD;
            if (j - i >= 0) window = (window - dp[j - i] + MOD) % MOD;
            nd[j] = window;
          }
        }
        dp = nd;
      }
      return dp[k];
    };
    return {
      slug: "k-inverse-pairs-array",
      title: "K Inverse Pairs Array",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Prefix Sum", "Google", "Amazon"],
      signature: {
        funcName: "kInversePairs",
        params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "An **inverse pair** of an array `nums` is a pair of indices `(i, j)` with `0 <= i < j < nums.length` and `nums[i] > nums[j]`.\n\nGiven `n` and `k`, count the arrangements (permutations) of the numbers `1` to `n` that contain **exactly** `k` inverse pairs. The count can be huge, so return it **modulo** `10^9 + 7`.",
        [
          { in: "n = 3, k = 0", out: "1", note: "Only [1,2,3] has no inverse pair." },
          { in: "n = 3, k = 1", out: "2", note: "[1,3,2] and [2,1,3]." },
          { in: "n = 4, k = 2", out: "5", note: "[1,3,4,2], [1,4,2,3], [2,1,4,3], [2,3,1,4] and [3,1,2,4]." },
        ],
        ["1 <= n <= 1000", "0 <= k <= 1000"]),
      hints: [
        "Build the permutation by inserting the numbers in increasing order. Where can `n` go, and how many new inverse pairs does each spot create?",
        "Placing `n` with `t` numbers after it creates exactly `t` new pairs, for `t = 0 … n - 1`, and it never changes the pairs among the smaller numbers. So `dp[n][k] = dp[n-1][k] + dp[n-1][k-1] + … + dp[n-1][k-n+1]`.",
        "That sum is a sliding window over the previous row: keep a running total, add `dp[n-1][k]` and subtract `dp[n-1][k-n]`, so each entry costs `O(1)`. Mind the modulus when subtracting.",
      ],
      editorial: explain({
        idea: "Removing the largest value from a permutation of `1..n` leaves a permutation of `1..n-1`, and the largest value contributes exactly as many inverse pairs as there are elements after it (0 to `n - 1`). So the counts for `n` are window sums of the counts for `n - 1`.",
        steps: [
          "Start from `dp = [1, 0, 0, …]` (one arrangement of zero numbers, with zero pairs).",
          "For `i = 1 … n`, build `next[j] = dp[j] + dp[j-1] + … + dp[j-i+1]` (indices below 0 ignored) as a running window sum: add `dp[j]`, and once `j >= i` subtract `dp[j - i]`.",
          "Reduce every value modulo `10^9 + 7`, adding the modulus back after a subtraction.",
          "Return `dp[k]` after the last row.",
        ],
        why: "The map \"permutation of `1..i` ↦ (permutation of `1..i-1` with `i` removed, number of elements after `i`)\" is a bijection onto pairs (permutation, `t`) with `0 <= t <= i - 1`, and the inverse-pair count of the original is the smaller permutation's count plus `t`. Summing over `t` gives the window recurrence, and the running sum computes each window in constant time.",
        time: "O(n * k)",
        space: "O(k)",
        pitfalls: [
          "The plain recurrence with an inner loop over `t` is `O(n * k * n)` — too slow at `n = k = 1000`.",
          "After `(window - dp[j - i])` the value can go negative: add `10^9 + 7` before taking the remainder.",
          "Values of `k` above `n(n-1)/2` are impossible and correctly come out as `0`.",
        ],
      }),
      examples: [
        { input: "3\n0", expectedOutput: "1" },
        { input: "3\n1", expectedOutput: "2" },
        { input: "4\n2", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        if (rng() < 0.002) {
          const n = ri(rng, 500, 1000), k = ri(rng, 0, 1000);
          return { input: `${n}\n${k}`, expectedOutput: String(ref(n, k)) };
        }
        const n = ri(rng, 1, pick(rng, [3, 6, 12, 25, 40]));
        const maxPairs = (n * (n - 1)) / 2;
        const k = ri(rng, 0, Math.min(1000, pick(rng, [2, 10, maxPairs + 2, 80])));
        return { input: `${n}\n${k}`, expectedOutput: String(ref(n, k)) };
      },
      solutions: {
        python: code`
          def kInversePairs(n: int, k: int) -> int:
              MOD = 10**9 + 7
              dp = [0] * (k + 1)
              dp[0] = 1
              for i in range(1, n + 1):
                  nxt = [0] * (k + 1)
                  window = 0
                  for j in range(k + 1):
                      window += dp[j]
                      if j >= i:
                          window -= dp[j - i]
                      window %= MOD
                      nxt[j] = window
                  dp = nxt
              return dp[k]
        `,
        javascript: code`
          var kInversePairs = function(n, k) {
              var MOD = 1000000007;
              var dp = new Array(k + 1).fill(0);
              dp[0] = 1;
              for (var i = 1; i <= n; i++) {
                  var next = new Array(k + 1).fill(0);
                  var window = 0;
                  for (var j = 0; j <= k; j++) {
                      window = (window + dp[j]) % MOD;
                      if (j >= i) window = (window - dp[j - i] + MOD) % MOD;
                      next[j] = window;
                  }
                  dp = next;
              }
              return dp[k];
          };
        `,
        typescript: code`
          function kInversePairs(n: number, k: number): number {
              var MOD = 1000000007;
              var dp: number[] = [];
              for (var t = 0; t <= k; t++) dp.push(0);
              dp[0] = 1;
              for (var i = 1; i <= n; i++) {
                  var next: number[] = [];
                  var window = 0;
                  for (var j = 0; j <= k; j++) {
                      window = (window + dp[j]) % MOD;
                      if (j >= i) window = (window - dp[j - i] + MOD) % MOD;
                      next.push(window);
                  }
                  dp = next;
              }
              return dp[k];
          }
        `,
        java: code`
          public static int kInversePairs(int n, int k) {
              final long MOD = 1000000007L;
              long[] dp = new long[k + 1];
              dp[0] = 1;
              for (int i = 1; i <= n; i++) {
                  long[] next = new long[k + 1];
                  long window = 0;
                  for (int j = 0; j <= k; j++) {
                      window = (window + dp[j]) % MOD;
                      if (j >= i) window = (window - dp[j - i] + MOD) % MOD;
                      next[j] = window;
                  }
                  dp = next;
              }
              return (int) dp[k];
          }
        `,
        cpp: code`
          int kInversePairs(int n, int k) {
              const long long MOD = 1000000007LL;
              vector<long long> dp(k + 1, 0);
              dp[0] = 1;
              for (int i = 1; i <= n; i++) {
                  vector<long long> next(k + 1, 0);
                  long long window = 0;
                  for (int j = 0; j <= k; j++) {
                      window = (window + dp[j]) % MOD;
                      if (j >= i) window = (window - dp[j - i] + MOD) % MOD;
                      next[j] = window;
                  }
                  dp = next;
              }
              return (int) dp[k];
          }
        `,
        c: code`
          int kInversePairs(int n, int k) {
              const long long MOD = 1000000007LL;
              long long* dp = (long long*) calloc((size_t) (k + 1), sizeof(long long));
              long long* next = (long long*) calloc((size_t) (k + 1), sizeof(long long));
              dp[0] = 1;
              for (int i = 1; i <= n; i++) {
                  long long window = 0;
                  for (int j = 0; j <= k; j++) {
                      window = (window + dp[j]) % MOD;
                      if (j >= i) window = (window - dp[j - i] + MOD) % MOD;
                      next[j] = window;
                  }
                  long long* t = dp; dp = next; next = t;
              }
              int ans = (int) dp[k];
              free(dp);
              free(next);
              return ans;
          }
        `,
        csharp: code`
          public static int KInversePairs(int n, int k)
          {
              const long MOD = 1000000007L;
              long[] dp = new long[k + 1];
              dp[0] = 1;
              for (int i = 1; i <= n; i++)
              {
                  long[] next = new long[k + 1];
                  long window = 0;
                  for (int j = 0; j <= k; j++)
                  {
                      window = (window + dp[j]) % MOD;
                      if (j >= i) window = (window - dp[j - i] + MOD) % MOD;
                      next[j] = window;
                  }
                  dp = next;
              }
              return (int) dp[k];
          }
        `,
        go: code`
          func kInversePairs(n int, k int) int {
              const mod = 1000000007
              dp := make([]int, k+1)
              dp[0] = 1
              for i := 1; i <= n; i++ {
                  next := make([]int, k+1)
                  window := 0
                  for j := 0; j <= k; j++ {
                      window = (window + dp[j]) % mod
                      if j >= i {
                          window = (window - dp[j-i] + mod) % mod
                      }
                      next[j] = window
                  }
                  dp = next
              }
              return dp[k]
          }
        `,
        kotlin: code`
          fun kInversePairs(n: Int, k: Int): Int {
              val modulus = 1000000007L
              var dp = LongArray(k + 1)
              dp[0] = 1L
              for (i in 1..n) {
                  val next = LongArray(k + 1)
                  var window = 0L
                  for (j in 0..k) {
                      window = (window + dp[j]) % modulus
                      if (j >= i) window = (window - dp[j - i] + modulus) % modulus
                      next[j] = window
                  }
                  dp = next
              }
              return dp[k].toInt()
          }
        `,
        swift: code`
          func kInversePairs(_ n: Int, _ k: Int) -> Int {
              let modulus = 1000000007
              var dp = [Int](repeating: 0, count: k + 1)
              dp[0] = 1
              for i in 1...n {
                  var next = [Int](repeating: 0, count: k + 1)
                  var window = 0
                  for j in 0...k {
                      window = (window + dp[j]) % modulus
                      if j >= i { window = (window - dp[j - i] + modulus) % modulus }
                      next[j] = window
                  }
                  dp = next
              }
              return dp[k]
          }
        `,
        rust: code`
          fn kInversePairs(n: i32, k: i32) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let k = k as usize;
              let mut dp = vec![0i64; k + 1];
              dp[0] = 1;
              for i in 1..=(n as usize) {
                  let mut next = vec![0i64; k + 1];
                  let mut window = 0i64;
                  for j in 0..=k {
                      window = (window + dp[j]) % modulus;
                      if j >= i {
                          window = (window - dp[j - i] + modulus) % modulus;
                      }
                      next[j] = window;
                  }
                  dp = next;
              }
              dp[k] as i32
          }
        `,
        php: code`
          function kInversePairs($n, $k) {
              $MOD = 1000000007;
              $dp = array_fill(0, $k + 1, 0);
              $dp[0] = 1;
              for ($i = 1; $i <= $n; $i++) {
                  $next = array_fill(0, $k + 1, 0);
                  $window = 0;
                  for ($j = 0; $j <= $k; $j++) {
                      $window = ($window + $dp[$j]) % $MOD;
                      if ($j >= $i) $window = ($window - $dp[$j - $i] + $MOD) % $MOD;
                      $next[$j] = $window;
                  }
                  $dp = $next;
              }
              return $dp[$k];
          }
        `,
        ruby: code`
          def kInversePairs(n, k)
            mod = 1_000_000_007
            dp = Array.new(k + 1, 0)
            dp[0] = 1
            (1..n).each do |i|
              nxt = Array.new(k + 1, 0)
              window = 0
              (0..k).each do |j|
                window = (window + dp[j]) % mod
                window = (window - dp[j - i]) % mod if j >= i
                nxt[j] = window
              end
              dp = nxt
            end
            dp[k]
          end
        `,
      },
    };
  })(),

];
