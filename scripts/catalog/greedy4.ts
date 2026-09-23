/**
 * Greedy problems — wave 4.
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks
 * "must-do" greedy set. Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h, so integer square
 * roots are binary-searched rather than taken with sqrt.
 */
import {
  bool,
  describe,
  explain,
  fmtIntArr,
  fmtIntMat,
  fmtStrArr,
  pick,
  randLower,
  ri,
  shuffle,
  type CatalogProblem,
  type Rng,
} from "./types.js";

export const GREEDY4_PROBLEMS: CatalogProblem[] = [

  // ── Take Gifts From the Richest Pile (LC 2558) ──────────────────
  (() => {
    const isqrt = (v: number) => {
      let lo = 0, hi = 46341;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (mid * mid <= v) lo = mid; else hi = mid - 1;
      }
      return lo;
    };
    const ref = (gifts: number[], k: number) => {
      const a = gifts.slice();
      for (let t = 0; t < k; t++) {
        let mi = 0;
        for (let i = 1; i < a.length; i++) if (a[i] > a[mi]) mi = i;
        a[mi] = isqrt(a[mi]);
      }
      let sum = 0;
      for (let i = 0; i < a.length; i++) sum += a[i];
      return sum;
    };
    return {
      slug: "take-gifts-from-the-richest-pile",
      title: "Take Gifts From the Richest Pile",
      difficulty: "EASY" as const,
      tags: ["Array", "Heap", "Simulation", "Greedy", "Amazon", "Microsoft", "TCS"],
      signature: { funcName: "pickGifts", params: [{ name: "gifts", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Each second for `k` seconds you pick the pile with the **most** gifts (any one of them if tied), leave behind the number of gifts equal to the **floor of its square root**, and take the rest away.\n\nReturn the total number of gifts left after `k` seconds.",
        [
          { in: "gifts = [25,64,9,4,100], k = 4", out: "29", note: "The richest pile is reduced each second: 100 → 10, then 64 → 8, then 25 → 5, then 10 → 3, leaving 5 + 8 + 9 + 4 + 3." },
          { in: "gifts = [1,1,1,1], k = 4", out: "4", note: "The square root of 1 is 1, so nothing changes." },
          { in: "gifts = [16,9,4], k = 1", out: "17", note: "16 becomes 4, leaving 4 + 9 + 4." },
        ],
        ["1 <= gifts.length <= 1000", "1 <= gifts[i] <= 1000000", "1 <= k <= 1000"]),
      hints: [
        "Simulate: each second you only need the current maximum.",
        "At these sizes a linear scan for the maximum each second is fast enough; a max-heap is the scalable version.",
        "Compute the integer square root without floating point — binary search or a walk.",
      ],
      editorial: explain({
        idea: "A direct simulation. Each second, locate the largest pile and replace it with its integer square root; after `k` seconds sum what is left.",
        steps: [
          "Copy the array so the input is not mutated.",
          "Repeat `k` times: scan for the index of the maximum, and replace it with `isqrt` of its value.",
          "Return the sum.",
        ],
        why: "The rule names exactly which pile to touch, so there is no choice to optimise — the 'greedy' is the problem statement. The only care needed is the square root: a floating-point `sqrt` can round `x²` to just below `x`, producing an off-by-one, so an integer method is safer.",
        time: "O(k · n) with a linear scan, O(k log n) with a heap",
        space: "O(n)",
        pitfalls: [
          "`Math.sqrt` on a perfect square can land a hair below it in floating point; verify or use integer search.",
          "Piles of 1 stay at 1 forever, so the loop must not assume progress.",
          "The total reaches `10^9` at the stated limits.",
        ],
      }),
      examples: [
        { input: "[25,64,9,4,100]\n4", expectedOutput: "29" },
        { input: "[1,1,1,1]\n4", expectedOutput: "4" },
        { input: "[16,9,4]\n1", expectedOutput: "17" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 200 : 1000000;
        const gifts = Array.from({ length: ri(rng, 1, 25) }, () => ri(rng, 1, hi));
        const k = ri(rng, 1, 30);
        return { input: `${fmtIntArr(gifts)}\n${k}`, expectedOutput: String(ref(gifts, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef pickGifts(gifts: List[int], k: int) -> int:\n    def isqrt(v: int) -> int:\n        lo, hi = 0, 46341\n        while lo < hi:\n            mid = (lo + hi + 1) // 2\n            if mid * mid <= v:\n                lo = mid\n            else:\n                hi = mid - 1\n        return lo\n\n    a = list(gifts)\n    for _ in range(k):\n        mi = 0\n        for i in range(1, len(a)):\n            if a[i] > a[mi]:\n                mi = i\n        a[mi] = isqrt(a[mi])\n    return sum(a)`,
        javascript: `var pickGifts = function(gifts, k) {\n    var isqrt = function(v) {\n        var lo = 0, hi = 46341;\n        while (lo < hi) {\n            var mid = Math.ceil((lo + hi) / 2);\n            if (mid * mid <= v) lo = mid; else hi = mid - 1;\n        }\n        return lo;\n    };\n    var a = gifts.slice();\n    for (var t = 0; t < k; t++) {\n        var mi = 0;\n        for (var i = 1; i < a.length; i++) if (a[i] > a[mi]) mi = i;\n        a[mi] = isqrt(a[mi]);\n    }\n    var sum = 0;\n    for (var j = 0; j < a.length; j++) sum += a[j];\n    return sum;\n};`,
        typescript: `function pickGifts(gifts: number[], k: number): number {\n    var isqrt = function(v: number): number {\n        var lo = 0, hi = 46341;\n        while (lo < hi) {\n            var mid = Math.ceil((lo + hi) / 2);\n            if (mid * mid <= v) lo = mid; else hi = mid - 1;\n        }\n        return lo;\n    };\n    var a = gifts.slice();\n    for (var t = 0; t < k; t++) {\n        var mi = 0;\n        for (var i = 1; i < a.length; i++) if (a[i] > a[mi]) mi = i;\n        a[mi] = isqrt(a[mi]);\n    }\n    var sum = 0;\n    for (var j = 0; j < a.length; j++) sum += a[j];\n    return sum;\n}`,
        java: `private static int isqrtGift(int v) {\n    int lo = 0, hi = 46341;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if ((long) mid * mid <= v) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}\n\npublic static int pickGifts(int[] gifts, int k) {\n    int[] a = gifts.clone();\n    for (int t = 0; t < k; t++) {\n        int mi = 0;\n        for (int i = 1; i < a.length; i++) if (a[i] > a[mi]) mi = i;\n        a[mi] = isqrtGift(a[mi]);\n    }\n    int sum = 0;\n    for (int x : a) sum += x;\n    return sum;\n}`,
        cpp: `static int isqrtGift(int v) {\n    int lo = 0, hi = 46341;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if ((long long) mid * mid <= v) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}\n\nint pickGifts(vector<int>& gifts, int k) {\n    vector<int> a = gifts;\n    for (int t = 0; t < k; t++) {\n        int mi = 0;\n        for (int i = 1; i < (int) a.size(); i++) if (a[i] > a[mi]) mi = i;\n        a[mi] = isqrtGift(a[mi]);\n    }\n    int sum = 0;\n    for (int x : a) sum += x;\n    return sum;\n}`,
        c: `static int isqrtGift(int v) {\n    int lo = 0, hi = 46341;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if ((long long) mid * mid <= (long long) v) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}\n\nint pickGifts(int* gifts, int giftsSize, int k) {\n    int* a = (int*) malloc((size_t) giftsSize * sizeof(int));\n    for (int i = 0; i < giftsSize; i++) a[i] = gifts[i];\n    for (int t = 0; t < k; t++) {\n        int mi = 0;\n        for (int i = 1; i < giftsSize; i++) if (a[i] > a[mi]) mi = i;\n        a[mi] = isqrtGift(a[mi]);\n    }\n    int sum = 0;\n    for (int i = 0; i < giftsSize; i++) sum += a[i];\n    free(a);\n    return sum;\n}`,
        csharp: `private static int IsqrtGift(int v)\n{\n    int lo = 0, hi = 46341;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo + 1) / 2;\n        if ((long) mid * mid <= v) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}\n\npublic static int PickGifts(int[] gifts, int k)\n{\n    int[] a = (int[]) gifts.Clone();\n    for (int t = 0; t < k; t++)\n    {\n        int mi = 0;\n        for (int i = 1; i < a.Length; i++) if (a[i] > a[mi]) mi = i;\n        a[mi] = IsqrtGift(a[mi]);\n    }\n    int sum = 0;\n    foreach (int x in a) sum += x;\n    return sum;\n}`,
        go: `func isqrtGift(v int) int {\n\tlo, hi := 0, 46341\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo+1)/2\n\t\tif mid*mid <= v {\n\t\t\tlo = mid\n\t\t} else {\n\t\t\thi = mid - 1\n\t\t}\n\t}\n\treturn lo\n}\n\nfunc pickGifts(gifts []int, k int) int {\n\ta := append([]int{}, gifts...)\n\tfor t := 0; t < k; t++ {\n\t\tmi := 0\n\t\tfor i := 1; i < len(a); i++ {\n\t\t\tif a[i] > a[mi] {\n\t\t\t\tmi = i\n\t\t\t}\n\t\t}\n\t\ta[mi] = isqrtGift(a[mi])\n\t}\n\tsum := 0\n\tfor _, x := range a {\n\t\tsum += x\n\t}\n\treturn sum\n}`,
        kotlin: `private fun isqrtGift(v: Int): Int {\n    var lo = 0\n    var hi = 46341\n    while (lo < hi) {\n        val mid = lo + (hi - lo + 1) / 2\n        if (mid.toLong() * mid <= v) lo = mid else hi = mid - 1\n    }\n    return lo\n}\n\nfun pickGifts(gifts: IntArray, k: Int): Int {\n    val a = gifts.copyOf()\n    for (t in 0 until k) {\n        var mi = 0\n        for (i in 1 until a.size) if (a[i] > a[mi]) mi = i\n        a[mi] = isqrtGift(a[mi])\n    }\n    return a.sum()\n}`,
        swift: `func pickGifts(_ gifts: [Int], _ k: Int) -> Int {\n    func isqrt(_ v: Int) -> Int {\n        var lo = 0\n        var hi = 46341\n        while lo < hi {\n            let mid = lo + (hi - lo + 1) / 2\n            if mid * mid <= v { lo = mid } else { hi = mid - 1 }\n        }\n        return lo\n    }\n    var a = gifts\n    for _ in 0..<k {\n        var mi = 0\n        for i in 1..<a.count where a[i] > a[mi] { mi = i }\n        a[mi] = isqrt(a[mi])\n    }\n    return a.reduce(0, +)\n}`,
        rust: `fn pickGifts(gifts: Vec<i32>, k: i32) -> i32 {\n    fn isqrt(v: i32) -> i32 {\n        let mut lo = 0i64;\n        let mut hi = 46341i64;\n        while lo < hi {\n            let mid = lo + (hi - lo + 1) / 2;\n            if mid * mid <= v as i64 {\n                lo = mid;\n            } else {\n                hi = mid - 1;\n            }\n        }\n        lo as i32\n    }\n    let mut a = gifts.clone();\n    for _ in 0..k {\n        let mut mi = 0usize;\n        for i in 1..a.len() {\n            if a[i] > a[mi] {\n                mi = i;\n            }\n        }\n        a[mi] = isqrt(a[mi]);\n    }\n    a.iter().sum()\n}`,
        php: `function pickGifts($gifts, $k) {\n    $isqrt = function($v) {\n        $lo = 0;\n        $hi = 46341;\n        while ($lo < $hi) {\n            $mid = $lo + intdiv($hi - $lo + 1, 2);\n            if ($mid * $mid <= $v) $lo = $mid; else $hi = $mid - 1;\n        }\n        return $lo;\n    };\n    $a = $gifts;\n    for ($t = 0; $t < $k; $t++) {\n        $mi = 0;\n        for ($i = 1; $i < count($a); $i++) if ($a[$i] > $a[$mi]) $mi = $i;\n        $a[$mi] = $isqrt($a[$mi]);\n    }\n    return array_sum($a);\n}`,
        ruby: `def pickGifts(gifts, k)\n  isqrt = lambda do |v|\n    lo = 0\n    hi = 46341\n    while lo < hi\n      mid = lo + (hi - lo + 1) / 2\n      if mid * mid <= v\n        lo = mid\n      else\n        hi = mid - 1\n      end\n    end\n    lo\n  end\n  a = gifts.dup\n  k.times do\n    mi = 0\n    (1...a.length).each { |i| mi = i if a[i] > a[mi] }\n    a[mi] = isqrt.call(a[mi])\n  end\n  a.sum\nend`,
      },
    };
  })(),

  // ── Minimum Amount of Time to Fill Cups (LC 2335) ───────────────
  (() => {
    const ref = (amount: number[]) => {
      const a = amount.slice().sort((x, y) => y - x);
      const total = a[0] + a[1] + a[2];
      const half = Math.floor((total + 1) / 2);
      return Math.max(a[0], half);
    };
    return {
      slug: "minimum-amount-of-time-to-fill-cups",
      title: "Minimum Amount of Time to Fill Cups",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Math", "Heap", "Amazon", "Google", "Infosys"],
      signature: { funcName: "fillCups", params: [{ name: "amount", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A water dispenser offers cold, warm and hot water. Each second you may fill **either** two cups of *different* types **or** one cup of any type.\n\nGiven `amount = [cold, warm, hot]`, return the minimum number of seconds to fill all the cups.",
        [
          { in: "amount = [1,4,2]", out: "4", note: "Pair the 4 warm cups with the others, then finish alone." },
          { in: "amount = [5,4,4]", out: "7", note: "The total is 13, and ceil(13 / 2) is 7." },
          { in: "amount = [5,0,0]", out: "5", note: "One type only, so no pairing is possible." },
        ],
        ["amount.length == 3", "0 <= amount[i] <= 100"]),
      hints: [
        "Two lower bounds apply: the largest single count, and half the total rounded up.",
        "The answer is the larger of the two.",
        "Pairing the two largest remaining counts each second achieves it.",
      ],
      editorial: explain({
        idea: "Two obvious lower bounds turn out to be jointly sufficient. Each second fills at most two cups, so at least `ceil(total / 2)` seconds are needed; and the largest type needs at least its own count of seconds, since two cups of the same type cannot be filled together.",
        steps: [
          "Sort the three counts descending.",
          "Return `max(largest, ceil(total / 2))`.",
        ],
        why: "If the largest count exceeds the other two combined, every second must include one cup of that type, so its count is the answer. Otherwise the counts can be paired down two at a time — always pairing the two largest remaining keeps them balanced enough that no type is ever left stranded — and `ceil(total / 2)` seconds suffice.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Taking only `ceil(total / 2)` fails on inputs like `[5,0,0]`.",
          "Taking only the maximum fails on `[5,4,4]`.",
          "Integer division must round *up*: `(total + 1) / 2`.",
        ],
      }),
      examples: [
        { input: "[1,4,2]", expectedOutput: "4" },
        { input: "[5,4,4]", expectedOutput: "7" },
        { input: "[5,0,0]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const amount = [ri(rng, 0, 100), ri(rng, 0, 100), ri(rng, 0, 100)];
        return { input: fmtIntArr(amount), expectedOutput: String(ref(amount)) };
      },
      solutions: {
        python: `from typing import List\n\ndef fillCups(amount: List[int]) -> int:\n    a = sorted(amount, reverse=True)\n    total = sum(a)\n    return max(a[0], (total + 1) // 2)`,
        javascript: `var fillCups = function(amount) {\n    var a = amount.slice().sort(function(x, y) { return y - x; });\n    var total = a[0] + a[1] + a[2];\n    return Math.max(a[0], Math.floor((total + 1) / 2));\n};`,
        typescript: `function fillCups(amount: number[]): number {\n    var a = amount.slice().sort(function(x, y) { return y - x; });\n    var total = a[0] + a[1] + a[2];\n    return Math.max(a[0], Math.floor((total + 1) / 2));\n}`,
        java: `public static int fillCups(int[] amount) {\n    int[] a = amount.clone();\n    Arrays.sort(a);\n    int total = a[0] + a[1] + a[2];\n    return Math.max(a[2], (total + 1) / 2);\n}`,
        cpp: `int fillCups(vector<int>& amount) {\n    vector<int> a = amount;\n    sort(a.begin(), a.end());\n    int total = a[0] + a[1] + a[2];\n    return max(a[2], (total + 1) / 2);\n}`,
        c: `int fillCups(int* amount, int amountSize) {\n    (void) amountSize;\n    int mx = amount[0];\n    if (amount[1] > mx) mx = amount[1];\n    if (amount[2] > mx) mx = amount[2];\n    int total = amount[0] + amount[1] + amount[2];\n    int half = (total + 1) / 2;\n    return mx > half ? mx : half;\n}`,
        csharp: `public static int FillCups(int[] amount)\n{\n    int[] a = (int[]) amount.Clone();\n    Array.Sort(a);\n    int total = a[0] + a[1] + a[2];\n    return Math.Max(a[2], (total + 1) / 2);\n}`,
        go: `func fillCups(amount []int) int {\n\ta := append([]int{}, amount...)\n\tsort.Ints(a)\n\ttotal := a[0] + a[1] + a[2]\n\thalf := (total + 1) / 2\n\tif a[2] > half {\n\t\treturn a[2]\n\t}\n\treturn half\n}`,
        kotlin: `fun fillCups(amount: IntArray): Int {\n    val a = amount.sortedArray()\n    val total = a[0] + a[1] + a[2]\n    return maxOf(a[2], (total + 1) / 2)\n}`,
        swift: `func fillCups(_ amount: [Int]) -> Int {\n    let a = amount.sorted()\n    let total = a[0] + a[1] + a[2]\n    return max(a[2], (total + 1) / 2)\n}`,
        rust: `fn fillCups(amount: Vec<i32>) -> i32 {\n    let mut a = amount.clone();\n    a.sort();\n    let total = a[0] + a[1] + a[2];\n    a[2].max((total + 1) / 2)\n}`,
        php: `function fillCups($amount) {\n    $a = $amount;\n    sort($a);\n    $total = $a[0] + $a[1] + $a[2];\n    return max($a[2], intdiv($total + 1, 2));\n}`,
        ruby: `def fillCups(amount)\n  a = amount.sort\n  total = a.sum\n  [a[2], (total + 1) / 2].max\nend`,
      },
    };
  })(),

  // ── Maximum Height of a Triangle ────────────────────────────────
  (() => {
    const ref = (red: number, blue: number) => {
      const run = (first: number, second: number) => {
        let h = 0, a = first, b = second;
        for (let row = 1; ; row++) {
          if (row % 2 === 1) {
            if (a < row) break;
            a -= row;
          } else {
            if (b < row) break;
            b -= row;
          }
          h++;
        }
        return h;
      };
      return Math.max(run(red, blue), run(blue, red));
    };
    return {
      slug: "maximum-height-of-a-triangle",
      title: "Maximum Height of a Triangle",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Enumeration", "Simulation", "Amazon", "Adobe", "Accenture"],
      signature: { funcName: "maxHeightOfTriangle", params: [{ name: "red", type: "int" as const }, { name: "blue", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You have `red` red balls and `blue` blue balls. Arrange some of them into a triangle where row `i` (1-indexed) holds exactly `i` balls, every ball in a row shares a colour, and **adjacent rows have different colours**.\n\nReturn the maximum height of such a triangle.",
        [
          { in: "red = 2, blue = 4", out: "3", note: "Rows of 1 red, 2 blue and 3 — starting blue gives blue, red, blue using 4 blue and 2 red." },
          { in: "red = 2, blue = 1", out: "2", note: "1 blue then 2 red." },
          { in: "red = 10, blue = 1", out: "2", note: "Only one blue ball, so the triangle stops after two rows." },
        ],
        ["1 <= red, blue <= 100"]),
      hints: [
        "The colour of row 1 fixes every other row's colour, so there are only two arrangements to try.",
        "Simulate each one: rows 1, 3, 5, … take the first colour and rows 2, 4, 6, … the other.",
        "Stop as soon as a row cannot be filled, and take the better of the two heights.",
      ],
      editorial: explain({
        idea: "Adjacent rows alternate, so once row 1's colour is chosen the whole triangle's colouring is determined. That leaves exactly two candidates, each of which is a short simulation.",
        steps: [
          "For a starting colour, walk `row = 1, 2, 3, …`, taking `row` balls from whichever colour that row uses.",
          "Stop when the required colour has fewer than `row` balls left; the height is the number of completed rows.",
          "Return the maximum over the two starting colours.",
        ],
        why: "There is nothing to optimise inside a run — each row's size and colour are forced — so the only decision is which colour goes first, and trying both is exhaustive. The simulation terminates quickly because the triangle's total grows quadratically while the supply is bounded by 200.",
        time: "O(sqrt(red + blue))",
        space: "O(1)",
        pitfalls: [
          "Trying only one starting colour misses cases like `red = 2, blue = 4`.",
          "A row must be filled *completely*; a partial row does not count.",
          "The height is the count of completed rows, not the index of the failing one.",
        ],
      }),
      examples: [
        { input: "2\n4", expectedOutput: "3" },
        { input: "2\n1", expectedOutput: "2" },
        { input: "10\n1", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const red = ri(rng, 1, 100);
        const blue = ri(rng, 1, 100);
        return { input: `${red}\n${blue}`, expectedOutput: String(ref(red, blue)) };
      },
      solutions: {
        python: `def maxHeightOfTriangle(red: int, blue: int) -> int:\n    def run(first: int, second: int) -> int:\n        h, a, b = 0, first, second\n        row = 1\n        while True:\n            if row % 2 == 1:\n                if a < row:\n                    break\n                a -= row\n            else:\n                if b < row:\n                    break\n                b -= row\n            h += 1\n            row += 1\n        return h\n\n    return max(run(red, blue), run(blue, red))`,
        javascript: `var maxHeightOfTriangle = function(red, blue) {\n    var run = function(first, second) {\n        var h = 0, a = first, b = second;\n        for (var row = 1; ; row++) {\n            if (row % 2 === 1) {\n                if (a < row) break;\n                a -= row;\n            } else {\n                if (b < row) break;\n                b -= row;\n            }\n            h++;\n        }\n        return h;\n    };\n    return Math.max(run(red, blue), run(blue, red));\n};`,
        typescript: `function maxHeightOfTriangle(red: number, blue: number): number {\n    var run = function(first: number, second: number): number {\n        var h = 0, a = first, b = second;\n        for (var row = 1; ; row++) {\n            if (row % 2 === 1) {\n                if (a < row) break;\n                a -= row;\n            } else {\n                if (b < row) break;\n                b -= row;\n            }\n            h++;\n        }\n        return h;\n    };\n    return Math.max(run(red, blue), run(blue, red));\n}`,
        java: `private static int runTriangle(int first, int second) {\n    int h = 0, a = first, b = second;\n    for (int row = 1; ; row++) {\n        if (row % 2 == 1) {\n            if (a < row) break;\n            a -= row;\n        } else {\n            if (b < row) break;\n            b -= row;\n        }\n        h++;\n    }\n    return h;\n}\n\npublic static int maxHeightOfTriangle(int red, int blue) {\n    return Math.max(runTriangle(red, blue), runTriangle(blue, red));\n}`,
        cpp: `static int runTriangle(int first, int second) {\n    int h = 0, a = first, b = second;\n    for (int row = 1; ; row++) {\n        if (row % 2 == 1) {\n            if (a < row) break;\n            a -= row;\n        } else {\n            if (b < row) break;\n            b -= row;\n        }\n        h++;\n    }\n    return h;\n}\n\nint maxHeightOfTriangle(int red, int blue) {\n    return max(runTriangle(red, blue), runTriangle(blue, red));\n}`,
        c: `static int runTriangle(int first, int second) {\n    int h = 0, a = first, b = second;\n    for (int row = 1; ; row++) {\n        if (row % 2 == 1) {\n            if (a < row) break;\n            a -= row;\n        } else {\n            if (b < row) break;\n            b -= row;\n        }\n        h++;\n    }\n    return h;\n}\n\nint maxHeightOfTriangle(int red, int blue) {\n    int x = runTriangle(red, blue);\n    int y = runTriangle(blue, red);\n    return x > y ? x : y;\n}`,
        csharp: `private static int RunTriangle(int first, int second)\n{\n    int h = 0, a = first, b = second;\n    for (int row = 1; ; row++)\n    {\n        if (row % 2 == 1)\n        {\n            if (a < row) break;\n            a -= row;\n        }\n        else\n        {\n            if (b < row) break;\n            b -= row;\n        }\n        h++;\n    }\n    return h;\n}\n\npublic static int MaxHeightOfTriangle(int red, int blue)\n{\n    return Math.Max(RunTriangle(red, blue), RunTriangle(blue, red));\n}`,
        go: `func runTriangle(first int, second int) int {\n\th, a, b := 0, first, second\n\tfor row := 1; ; row++ {\n\t\tif row%2 == 1 {\n\t\t\tif a < row {\n\t\t\t\tbreak\n\t\t\t}\n\t\t\ta -= row\n\t\t} else {\n\t\t\tif b < row {\n\t\t\t\tbreak\n\t\t\t}\n\t\t\tb -= row\n\t\t}\n\t\th++\n\t}\n\treturn h\n}\n\nfunc maxHeightOfTriangle(red int, blue int) int {\n\tx := runTriangle(red, blue)\n\ty := runTriangle(blue, red)\n\tif x > y {\n\t\treturn x\n\t}\n\treturn y\n}`,
        kotlin: `private fun runTriangle(first: Int, second: Int): Int {\n    var h = 0\n    var a = first\n    var b = second\n    var row = 1\n    while (true) {\n        if (row % 2 == 1) {\n            if (a < row) break\n            a -= row\n        } else {\n            if (b < row) break\n            b -= row\n        }\n        h++\n        row++\n    }\n    return h\n}\n\nfun maxHeightOfTriangle(red: Int, blue: Int): Int {\n    return maxOf(runTriangle(red, blue), runTriangle(blue, red))\n}`,
        swift: `func maxHeightOfTriangle(_ red: Int, _ blue: Int) -> Int {\n    func run(_ first: Int, _ second: Int) -> Int {\n        var h = 0\n        var a = first\n        var b = second\n        var row = 1\n        while true {\n            if row % 2 == 1 {\n                if a < row { break }\n                a -= row\n            } else {\n                if b < row { break }\n                b -= row\n            }\n            h += 1\n            row += 1\n        }\n        return h\n    }\n    return max(run(red, blue), run(blue, red))\n}`,
        rust: `fn maxHeightOfTriangle(red: i32, blue: i32) -> i32 {\n    fn run(first: i32, second: i32) -> i32 {\n        let mut h = 0i32;\n        let mut a = first;\n        let mut b = second;\n        let mut row = 1i32;\n        loop {\n            if row % 2 == 1 {\n                if a < row {\n                    break;\n                }\n                a -= row;\n            } else {\n                if b < row {\n                    break;\n                }\n                b -= row;\n            }\n            h += 1;\n            row += 1;\n        }\n        h\n    }\n    run(red, blue).max(run(blue, red))\n}`,
        php: `function maxHeightOfTriangle($red, $blue) {\n    $run = function($first, $second) {\n        $h = 0;\n        $a = $first;\n        $b = $second;\n        for ($row = 1; ; $row++) {\n            if ($row % 2 === 1) {\n                if ($a < $row) break;\n                $a -= $row;\n            } else {\n                if ($b < $row) break;\n                $b -= $row;\n            }\n            $h++;\n        }\n        return $h;\n    };\n    return max($run($red, $blue), $run($blue, $red));\n}`,
        ruby: `def maxHeightOfTriangle(red, blue)\n  run = lambda do |first, second|\n    h = 0\n    a = first\n    b = second\n    row = 1\n    loop do\n      if row.odd?\n        break if a < row\n        a -= row\n      else\n        break if b < row\n        b -= row\n      end\n      h += 1\n      row += 1\n    end\n    h\n  end\n  [run.call(red, blue), run.call(blue, red)].max\nend`,
      },
    };
  })(),

  // ── Minimum Number of Arrows to Burst Balloons (LC 452) ─────────
  (() => {
    const ref = (points: number[][]) => {
      const p = points.slice().sort((a, b) => a[1] - b[1]);
      let arrows = 1, end = p[0][1];
      for (let i = 1; i < p.length; i++) {
        if (p[i][0] > end) { arrows++; end = p[i][1]; }
      }
      return arrows;
    };
    return {
      slug: "minimum-number-of-arrows-to-burst-balloons",
      title: "Minimum Number of Arrows to Burst Balloons",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Intervals", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "findMinArrowShots", params: [{ name: "points", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Balloon `i` spans the horizontal interval `[x_start, x_end]`. An arrow shot straight up at `x` bursts every balloon whose interval contains `x`, endpoints included, and travels infinitely upwards.\n\nReturn the minimum number of arrows needed to burst all the balloons.",
        [
          { in: "points = [[10,16],[2,8],[1,6],[7,12]]", out: "2", note: "Shoot at x = 6 and x = 12." },
          { in: "points = [[1,2],[3,4],[5,6],[7,8]]", out: "4", note: "Nothing overlaps." },
          { in: "points = [[1,2],[2,3],[3,4],[4,5]]", out: "2", note: "Shoot at x = 2 and x = 4." },
        ],
        ["1 <= points.length <= 100000", "points[i].length == 2", "-1000000000 <= x_start <= x_end <= 1000000000"]),
      hints: [
        "Sort the balloons by their **right** endpoint.",
        "Always shoot at the right endpoint of the earliest-ending balloon still unburst.",
        "Every balloon whose start is at most that position is burst by the same arrow.",
      ],
      editorial: explain({
        idea: "The classic interval-stabbing greedy. Sorting by right endpoint and always shooting at the earliest end bursts as many balloons as any single arrow can, without ever forcing an extra arrow later.",
        steps: [
          "Sort by right endpoint ascending.",
          "Shoot at the first balloon's right endpoint and remember it as `end`.",
          "Scan on: a balloon starting at or before `end` is already burst; otherwise fire a new arrow at its right endpoint and update `end`.",
        ],
        why: "Exchange argument: in any optimal solution, the arrow that bursts the earliest-ending balloon can be moved to that balloon's right endpoint without losing any balloon it already hit — every balloon it hit starts at or before that point and ends at or after it. Repeating the argument turns any optimal solution into the greedy one, so the greedy is optimal.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Sorting by the *left* endpoint needs a different rule and is easy to get wrong.",
          "Endpoints count as hits, so the test is `start > end`, strictly.",
          "Subtracting coordinates in a comparator can overflow a 32-bit `int`; compare rather than subtract.",
        ],
      }),
      examples: [
        { input: "[[10,16],[2,8],[1,6],[7,12]]", expectedOutput: "2" },
        { input: "[[1,2],[3,4],[5,6],[7,8]]", expectedOutput: "4" },
        { input: "[[1,2],[2,3],[3,4],[4,5]]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const span = rng() < 0.6 ? 25 : 1000000000;
        const points = Array.from({ length: ri(rng, 1, 25) }, () => {
          const a = ri(rng, -span, span);
          return [a, a + ri(rng, 0, Math.min(20, span))];
        });
        return { input: fmtIntMat(points), expectedOutput: String(ref(points)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findMinArrowShots(points: List[List[int]]) -> int:\n    p = sorted(points, key=lambda iv: iv[1])\n    arrows, end = 1, p[0][1]\n    for start, finish in p[1:]:\n        if start > end:\n            arrows += 1\n            end = finish\n    return arrows`,
        javascript: `var findMinArrowShots = function(points) {\n    var p = points.slice().sort(function(a, b) {\n        return a[1] < b[1] ? -1 : (a[1] > b[1] ? 1 : 0);\n    });\n    var arrows = 1, end = p[0][1];\n    for (var i = 1; i < p.length; i++) {\n        if (p[i][0] > end) { arrows++; end = p[i][1]; }\n    }\n    return arrows;\n};`,
        typescript: `function findMinArrowShots(points: number[][]): number {\n    var p = points.slice().sort(function(a, b) {\n        return a[1] < b[1] ? -1 : (a[1] > b[1] ? 1 : 0);\n    });\n    var arrows = 1, end = p[0][1];\n    for (var i = 1; i < p.length; i++) {\n        if (p[i][0] > end) { arrows++; end = p[i][1]; }\n    }\n    return arrows;\n}`,
        java: `public static int findMinArrowShots(int[][] points) {\n    int[][] p = points.clone();\n    Arrays.sort(p, (a, b) -> Integer.compare(a[1], b[1]));\n    int arrows = 1, end = p[0][1];\n    for (int i = 1; i < p.length; i++) {\n        if (p[i][0] > end) {\n            arrows++;\n            end = p[i][1];\n        }\n    }\n    return arrows;\n}`,
        cpp: `int findMinArrowShots(vector<vector<int>>& points) {\n    vector<vector<int>> p = points;\n    sort(p.begin(), p.end(), [](const vector<int>& a, const vector<int>& b) {\n        return a[1] < b[1];\n    });\n    int arrows = 1, end = p[0][1];\n    for (int i = 1; i < (int) p.size(); i++) {\n        if (p[i][0] > end) {\n            arrows++;\n            end = p[i][1];\n        }\n    }\n    return arrows;\n}`,
        c: `static int cmpByEnd(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    return (x[1] > y[1]) - (x[1] < y[1]);\n}\n\nint findMinArrowShots(int** points, int pointsSize, int* pointsColSize) {\n    (void) pointsColSize;\n    int** p = (int**) malloc((size_t) pointsSize * sizeof(int*));\n    for (int i = 0; i < pointsSize; i++) p[i] = points[i];\n    qsort(p, (size_t) pointsSize, sizeof(int*), cmpByEnd);\n    int arrows = 1, end = p[0][1];\n    for (int i = 1; i < pointsSize; i++) {\n        if (p[i][0] > end) {\n            arrows++;\n            end = p[i][1];\n        }\n    }\n    free(p);\n    return arrows;\n}`,
        csharp: `public static int FindMinArrowShots(int[][] points)\n{\n    var p = (int[][]) points.Clone();\n    Array.Sort(p, (a, b) => a[1].CompareTo(b[1]));\n    int arrows = 1, end = p[0][1];\n    for (int i = 1; i < p.Length; i++)\n    {\n        if (p[i][0] > end)\n        {\n            arrows++;\n            end = p[i][1];\n        }\n    }\n    return arrows;\n}`,
        go: `func findMinArrowShots(points [][]int) int {\n\tp := make([][]int, len(points))\n\tcopy(p, points)\n\tsort.Slice(p, func(a, b int) bool { return p[a][1] < p[b][1] })\n\tarrows, end := 1, p[0][1]\n\tfor i := 1; i < len(p); i++ {\n\t\tif p[i][0] > end {\n\t\t\tarrows++\n\t\t\tend = p[i][1]\n\t\t}\n\t}\n\treturn arrows\n}`,
        kotlin: `fun findMinArrowShots(points: Array<IntArray>): Int {\n    val p = points.copyOf()\n    p.sortWith(Comparator { a, b -> a[1].compareTo(b[1]) })\n    var arrows = 1\n    var end = p[0][1]\n    for (i in 1 until p.size) {\n        if (p[i][0] > end) {\n            arrows++\n            end = p[i][1]\n        }\n    }\n    return arrows\n}`,
        swift: `func findMinArrowShots(_ points: [[Int]]) -> Int {\n    let p = points.sorted { $0[1] < $1[1] }\n    var arrows = 1\n    var end = p[0][1]\n    for i in 1..<p.count {\n        if p[i][0] > end {\n            arrows += 1\n            end = p[i][1]\n        }\n    }\n    return arrows\n}`,
        rust: `fn findMinArrowShots(points: Vec<Vec<i32>>) -> i32 {\n    let mut p = points.clone();\n    p.sort_by(|a, b| a[1].cmp(&b[1]));\n    let mut arrows = 1i32;\n    let mut end = p[0][1];\n    for i in 1..p.len() {\n        if p[i][0] > end {\n            arrows += 1;\n            end = p[i][1];\n        }\n    }\n    arrows\n}`,
        php: `function findMinArrowShots($points) {\n    $p = $points;\n    usort($p, function($a, $b) {\n        if ($a[1] === $b[1]) return 0;\n        return $a[1] < $b[1] ? -1 : 1;\n    });\n    $arrows = 1;\n    $end = $p[0][1];\n    for ($i = 1; $i < count($p); $i++) {\n        if ($p[$i][0] > $end) {\n            $arrows++;\n            $end = $p[$i][1];\n        }\n    }\n    return $arrows;\n}`,
        ruby: `def findMinArrowShots(points)\n  p = points.sort_by { |iv| iv[1] }\n  arrows = 1\n  fin = p[0][1]\n  (1...p.length).each do |i|\n    if p[i][0] > fin\n      arrows += 1\n      fin = p[i][1]\n    end\n  end\n  arrows\nend`,
      },
    };
  })(),

  // ── Minimum Number of Operations to Move All Balls to Each Box (LC 1769) ──
  (() => {
    const ref = (boxes: string) => {
      const n = boxes.length;
      const out = new Array(n).fill(0);
      let cnt = 0, ops = 0;
      for (let i = 0; i < n; i++) {
        out[i] += ops;
        if (boxes[i] === "1") cnt++;
        ops += cnt;
      }
      cnt = 0; ops = 0;
      for (let i = n - 1; i >= 0; i--) {
        out[i] += ops;
        if (boxes[i] === "1") cnt++;
        ops += cnt;
      }
      return out;
    };
    return {
      slug: "minimum-number-of-operations-to-move-all-balls-to-each-box",
      title: "Minimum Number of Operations to Move All Balls to Each Box",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Prefix Sum", "Greedy", "Amazon", "Google", "Wipro"],
      signature: { funcName: "minOperations", params: [{ name: "boxes", type: "string" as const }], returns: "int[]" as const },
      description: describe(
        "`boxes[i]` is `'1'` if box `i` holds a ball and `'0'` if it is empty. One operation moves a single ball to an **adjacent** box.\n\nReturn an array whose `i`-th entry is the minimum number of operations to bring every ball into box `i`. The answers are computed independently — the boxes start over each time.",
        [
          { in: 'boxes = "110"', out: "[1,1,3]", note: "For box 0 the ball at index 1 moves once; for box 2 both balls move, costing 2 + 1." },
          { in: 'boxes = "001011"', out: "[11,8,5,4,3,4]" },
          { in: 'boxes = "1"', out: "[0]" },
        ],
        ["n == boxes.length", "1 <= n <= 2000", "boxes[i] is '0' or '1'"]),
      hints: [
        "The `O(n²)` double loop is the obvious answer; the trick is to do it in two linear passes.",
        "Moving from box `i` to box `i+1` costs one more operation per ball on the left and one less per ball on the right.",
        "Sweep left to right accumulating the cost of the balls behind you, then right to left for the balls ahead.",
      ],
      editorial: explain({
        idea: "Split each answer into the cost from the left and the cost from the right, and compute each with one running sweep. Stepping one box further from a group of balls adds exactly one operation per ball in that group.",
        steps: [
          "Left pass: keep `cnt`, the balls seen so far, and `ops`, their total distance to the current index. Add `ops` to `out[i]`, then update `cnt` and `ops += cnt`.",
          "Right pass: the same, walking backwards.",
          "The two contributions sum to the answer for each box.",
        ],
        why: "`ops` is maintained as the total cost of bringing every ball at an index below `i` to box `i`. Advancing by one box adds one operation for each such ball, which is exactly `cnt` — so the recurrence `ops += cnt` after updating `cnt` keeps it exact. The right pass covers the balls ahead by symmetry, and the two sets are disjoint.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The order inside the loop matters: record `ops` for the current box *before* folding this box's own ball into `cnt`.",
          "The two passes must be added, not combined into one sweep.",
          "The total reaches about `2000²/4 = 10^6`, comfortably inside `int`.",
        ],
      }),
      examples: [
        { input: '"110"', expectedOutput: "[1,1,3]" },
        { input: '"001011"', expectedOutput: "[11,8,5,4,3,4]" },
        { input: '"1"', expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const boxes = Array.from({ length: ri(rng, 1, 40) }, () => (rng() < 0.4 ? "1" : "0")).join("");
        return { input: `"${boxes}"`, expectedOutput: fmtIntArr(ref(boxes)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minOperations(boxes: str) -> List[int]:\n    n = len(boxes)\n    out = [0] * n\n    cnt = ops = 0\n    for i in range(n):\n        out[i] += ops\n        if boxes[i] == "1":\n            cnt += 1\n        ops += cnt\n    cnt = ops = 0\n    for i in range(n - 1, -1, -1):\n        out[i] += ops\n        if boxes[i] == "1":\n            cnt += 1\n        ops += cnt\n    return out`,
        javascript: `var minOperations = function(boxes) {\n    var n = boxes.length;\n    var out = [];\n    for (var t = 0; t < n; t++) out.push(0);\n    var cnt = 0, ops = 0, i;\n    for (i = 0; i < n; i++) {\n        out[i] += ops;\n        if (boxes.charAt(i) === "1") cnt++;\n        ops += cnt;\n    }\n    cnt = 0; ops = 0;\n    for (i = n - 1; i >= 0; i--) {\n        out[i] += ops;\n        if (boxes.charAt(i) === "1") cnt++;\n        ops += cnt;\n    }\n    return out;\n};`,
        typescript: `function minOperations(boxes: string): number[] {\n    var n = boxes.length;\n    var out: number[] = [];\n    for (var t = 0; t < n; t++) out.push(0);\n    var cnt = 0, ops = 0, i: number;\n    for (i = 0; i < n; i++) {\n        out[i] += ops;\n        if (boxes.charAt(i) === "1") cnt++;\n        ops += cnt;\n    }\n    cnt = 0; ops = 0;\n    for (i = n - 1; i >= 0; i--) {\n        out[i] += ops;\n        if (boxes.charAt(i) === "1") cnt++;\n        ops += cnt;\n    }\n    return out;\n}`,
        java: `public static int[] minOperations(String boxes) {\n    int n = boxes.length();\n    int[] out = new int[n];\n    int cnt = 0, ops = 0;\n    for (int i = 0; i < n; i++) {\n        out[i] += ops;\n        if (boxes.charAt(i) == '1') cnt++;\n        ops += cnt;\n    }\n    cnt = 0;\n    ops = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        out[i] += ops;\n        if (boxes.charAt(i) == '1') cnt++;\n        ops += cnt;\n    }\n    return out;\n}`,
        cpp: `vector<int> minOperations(string boxes) {\n    int n = (int) boxes.size();\n    vector<int> out(n, 0);\n    int cnt = 0, ops = 0;\n    for (int i = 0; i < n; i++) {\n        out[i] += ops;\n        if (boxes[i] == '1') cnt++;\n        ops += cnt;\n    }\n    cnt = 0;\n    ops = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        out[i] += ops;\n        if (boxes[i] == '1') cnt++;\n        ops += cnt;\n    }\n    return out;\n}`,
        c: `int* minOperations(char* boxes, int* returnSize) {\n    int n = (int) strlen(boxes);\n    int* out = (int*) calloc((size_t) n, sizeof(int));\n    int cnt = 0, ops = 0;\n    for (int i = 0; i < n; i++) {\n        out[i] += ops;\n        if (boxes[i] == '1') cnt++;\n        ops += cnt;\n    }\n    cnt = 0;\n    ops = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        out[i] += ops;\n        if (boxes[i] == '1') cnt++;\n        ops += cnt;\n    }\n    *returnSize = n;\n    return out;\n}`,
        csharp: `public static int[] MinOperations(string boxes)\n{\n    int n = boxes.Length;\n    int[] out_ = new int[n];\n    int cnt = 0, ops = 0;\n    for (int i = 0; i < n; i++)\n    {\n        out_[i] += ops;\n        if (boxes[i] == '1') cnt++;\n        ops += cnt;\n    }\n    cnt = 0;\n    ops = 0;\n    for (int i = n - 1; i >= 0; i--)\n    {\n        out_[i] += ops;\n        if (boxes[i] == '1') cnt++;\n        ops += cnt;\n    }\n    return out_;\n}`,
        go: `func minOperations(boxes string) []int {\n\tn := len(boxes)\n\tout := make([]int, n)\n\tcnt, ops := 0, 0\n\tfor i := 0; i < n; i++ {\n\t\tout[i] += ops\n\t\tif boxes[i] == '1' {\n\t\t\tcnt++\n\t\t}\n\t\tops += cnt\n\t}\n\tcnt, ops = 0, 0\n\tfor i := n - 1; i >= 0; i-- {\n\t\tout[i] += ops\n\t\tif boxes[i] == '1' {\n\t\t\tcnt++\n\t\t}\n\t\tops += cnt\n\t}\n\treturn out\n}`,
        kotlin: `fun minOperations(boxes: String): IntArray {\n    val n = boxes.length\n    val out = IntArray(n)\n    var cnt = 0\n    var ops = 0\n    for (i in 0 until n) {\n        out[i] += ops\n        if (boxes[i] == '1') cnt++\n        ops += cnt\n    }\n    cnt = 0\n    ops = 0\n    for (i in n - 1 downTo 0) {\n        out[i] += ops\n        if (boxes[i] == '1') cnt++\n        ops += cnt\n    }\n    return out\n}`,
        swift: `func minOperations(_ boxes: String) -> [Int] {\n    let a = Array(boxes)\n    let n = a.count\n    var out = [Int](repeating: 0, count: n)\n    var cnt = 0\n    var ops = 0\n    for i in 0..<n {\n        out[i] += ops\n        if a[i] == "1" { cnt += 1 }\n        ops += cnt\n    }\n    cnt = 0\n    ops = 0\n    var i = n - 1\n    while i >= 0 {\n        out[i] += ops\n        if a[i] == "1" { cnt += 1 }\n        ops += cnt\n        i -= 1\n    }\n    return out\n}`,
        rust: `fn minOperations(boxes: String) -> Vec<i32> {\n    let b = boxes.as_bytes();\n    let n = b.len();\n    let mut out = vec![0i32; n];\n    let mut cnt = 0i32;\n    let mut ops = 0i32;\n    for i in 0..n {\n        out[i] += ops;\n        if b[i] == b'1' {\n            cnt += 1;\n        }\n        ops += cnt;\n    }\n    cnt = 0;\n    ops = 0;\n    for i in (0..n).rev() {\n        out[i] += ops;\n        if b[i] == b'1' {\n            cnt += 1;\n        }\n        ops += cnt;\n    }\n    out\n}`,
        php: `function minOperations($boxes) {\n    $n = strlen($boxes);\n    $out = array_fill(0, $n, 0);\n    $cnt = 0;\n    $ops = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $out[$i] += $ops;\n        if ($boxes[$i] === "1") $cnt++;\n        $ops += $cnt;\n    }\n    $cnt = 0;\n    $ops = 0;\n    for ($i = $n - 1; $i >= 0; $i--) {\n        $out[$i] += $ops;\n        if ($boxes[$i] === "1") $cnt++;\n        $ops += $cnt;\n    }\n    return $out;\n}`,
        ruby: `def minOperations(boxes)\n  n = boxes.length\n  out = Array.new(n, 0)\n  cnt = 0\n  ops = 0\n  (0...n).each do |i|\n    out[i] += ops\n    cnt += 1 if boxes[i] == "1"\n    ops += cnt\n  end\n  cnt = 0\n  ops = 0\n  (n - 1).downto(0) do |i|\n    out[i] += ops\n    cnt += 1 if boxes[i] == "1"\n    ops += cnt\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Removing Minimum and Maximum From Array (LC 2091) ───────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let mi = 0, ma = 0;
      for (let i = 1; i < n; i++) {
        if (nums[i] < nums[mi]) mi = i;
        if (nums[i] > nums[ma]) ma = i;
      }
      const lo = Math.min(mi, ma), hi = Math.max(mi, ma);
      return Math.min(hi + 1, n - lo, lo + 1 + (n - hi));
    };
    return {
      slug: "removing-minimum-and-maximum-from-array",
      title: "Removing Minimum and Maximum From Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Amazon", "Microsoft", "Zoho"],
      signature: { funcName: "minimumDeletions", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums` holds **distinct** integers. One deletion removes the element at the **front** or the **back** of the array.\n\nReturn the minimum number of deletions needed to remove both the minimum and the maximum element.",
        [
          { in: "nums = [2,10,7,5,4,1,8,6]", out: "5", note: "The max 10 is at index 1 and the min 1 at index 5: take 2 from the front and 3 from the back." },
          { in: "nums = [0,-4,19,1,8,-2,-3,5]", out: "3", note: "The max 19 is at index 2, so three deletions from the front cover both." },
          { in: "nums = [101]", out: "1" },
        ],
        ["1 <= nums.length <= 100000", "-100000 <= nums[i] <= 100000", "All values in nums are distinct."]),
      hints: [
        "Only the two positions matter: where the minimum sits and where the maximum sits.",
        "There are exactly three strategies — both from the front, both from the back, or one from each end.",
        "Take the cheapest of the three.",
      ],
      editorial: explain({
        idea: "Find the two indices, then compare the only three ways to reach them from the ends. Everything else about the array is irrelevant.",
        steps: [
          "Locate the index of the minimum and of the maximum; let `lo` and `hi` be the smaller and larger of the two.",
          "Both from the front costs `hi + 1`; both from the back costs `n - lo`; one from each end costs `(lo + 1) + (n - hi)`.",
          "Return the minimum of the three.",
        ],
        why: "Deletions only ever come from the ends, so removing an element at index `i` from the front costs `i + 1` and from the back costs `n - i`. Both targets must be removed, and each is taken from one end or the other — which is exactly the three cases, since taking the further one from an end automatically removes the nearer one on that side.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting the mixed strategy loses cases like the first example.",
          "In the mixed case the front takes the *earlier* index and the back the *later* one, never the other way round.",
          "A single-element array needs one deletion, since the minimum and maximum coincide.",
        ],
      }),
      examples: [
        { input: "[2,10,7,5,4,1,8,6]", expectedOutput: "5" },
        { input: "[0,-4,19,1,8,-2,-3,5]", expectedOutput: "3" },
        { input: "[101]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const pool = shuffle(rng, Array.from({ length: 200 }, (_, i) => i - 100));
        const nums = pool.slice(0, n);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumDeletions(nums: List[int]) -> int:\n    n = len(nums)\n    mi = nums.index(min(nums))\n    ma = nums.index(max(nums))\n    lo, hi = min(mi, ma), max(mi, ma)\n    return min(hi + 1, n - lo, lo + 1 + (n - hi))`,
        javascript: `var minimumDeletions = function(nums) {\n    var n = nums.length, mi = 0, ma = 0;\n    for (var i = 1; i < n; i++) {\n        if (nums[i] < nums[mi]) mi = i;\n        if (nums[i] > nums[ma]) ma = i;\n    }\n    var lo = Math.min(mi, ma), hi = Math.max(mi, ma);\n    return Math.min(hi + 1, Math.min(n - lo, lo + 1 + (n - hi)));\n};`,
        typescript: `function minimumDeletions(nums: number[]): number {\n    var n = nums.length, mi = 0, ma = 0;\n    for (var i = 1; i < n; i++) {\n        if (nums[i] < nums[mi]) mi = i;\n        if (nums[i] > nums[ma]) ma = i;\n    }\n    var lo = Math.min(mi, ma), hi = Math.max(mi, ma);\n    return Math.min(hi + 1, Math.min(n - lo, lo + 1 + (n - hi)));\n}`,
        java: `public static int minimumDeletions(int[] nums) {\n    int n = nums.length, mi = 0, ma = 0;\n    for (int i = 1; i < n; i++) {\n        if (nums[i] < nums[mi]) mi = i;\n        if (nums[i] > nums[ma]) ma = i;\n    }\n    int lo = Math.min(mi, ma), hi = Math.max(mi, ma);\n    return Math.min(hi + 1, Math.min(n - lo, lo + 1 + (n - hi)));\n}`,
        cpp: `int minimumDeletions(vector<int>& nums) {\n    int n = (int) nums.size(), mi = 0, ma = 0;\n    for (int i = 1; i < n; i++) {\n        if (nums[i] < nums[mi]) mi = i;\n        if (nums[i] > nums[ma]) ma = i;\n    }\n    int lo = min(mi, ma), hi = max(mi, ma);\n    return min(hi + 1, min(n - lo, lo + 1 + (n - hi)));\n}`,
        c: `int minimumDeletions(int* nums, int numsSize) {\n    int n = numsSize, mi = 0, ma = 0;\n    for (int i = 1; i < n; i++) {\n        if (nums[i] < nums[mi]) mi = i;\n        if (nums[i] > nums[ma]) ma = i;\n    }\n    int lo = mi < ma ? mi : ma;\n    int hi = mi > ma ? mi : ma;\n    int a = hi + 1;\n    int b = n - lo;\n    int c = lo + 1 + (n - hi);\n    int best = a;\n    if (b < best) best = b;\n    if (c < best) best = c;\n    return best;\n}`,
        csharp: `public static int MinimumDeletions(int[] nums)\n{\n    int n = nums.Length, mi = 0, ma = 0;\n    for (int i = 1; i < n; i++)\n    {\n        if (nums[i] < nums[mi]) mi = i;\n        if (nums[i] > nums[ma]) ma = i;\n    }\n    int lo = Math.Min(mi, ma), hi = Math.Max(mi, ma);\n    return Math.Min(hi + 1, Math.Min(n - lo, lo + 1 + (n - hi)));\n}`,
        go: `func minimumDeletions(nums []int) int {\n\tn := len(nums)\n\tmi, ma := 0, 0\n\tfor i := 1; i < n; i++ {\n\t\tif nums[i] < nums[mi] {\n\t\t\tmi = i\n\t\t}\n\t\tif nums[i] > nums[ma] {\n\t\t\tma = i\n\t\t}\n\t}\n\tlo, hi := mi, ma\n\tif lo > hi {\n\t\tlo, hi = hi, lo\n\t}\n\tbest := hi + 1\n\tif n-lo < best {\n\t\tbest = n - lo\n\t}\n\tif lo+1+(n-hi) < best {\n\t\tbest = lo + 1 + (n - hi)\n\t}\n\treturn best\n}`,
        kotlin: `fun minimumDeletions(nums: IntArray): Int {\n    val n = nums.size\n    var mi = 0\n    var ma = 0\n    for (i in 1 until n) {\n        if (nums[i] < nums[mi]) mi = i\n        if (nums[i] > nums[ma]) ma = i\n    }\n    val lo = minOf(mi, ma)\n    val hi = maxOf(mi, ma)\n    return minOf(hi + 1, n - lo, lo + 1 + (n - hi))\n}`,
        swift: `func minimumDeletions(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var mi = 0\n    var ma = 0\n    for i in 1..<max(n, 1) where n > 1 {\n        if nums[i] < nums[mi] { mi = i }\n        if nums[i] > nums[ma] { ma = i }\n    }\n    let lo = min(mi, ma)\n    let hi = max(mi, ma)\n    return min(hi + 1, min(n - lo, lo + 1 + (n - hi)))\n}`,
        rust: `fn minimumDeletions(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let mut mi = 0usize;\n    let mut ma = 0usize;\n    for i in 1..n {\n        if nums[i] < nums[mi] {\n            mi = i;\n        }\n        if nums[i] > nums[ma] {\n            ma = i;\n        }\n    }\n    let lo = mi.min(ma) as i32;\n    let hi = mi.max(ma) as i32;\n    let n = n as i32;\n    (hi + 1).min(n - lo).min(lo + 1 + (n - hi))\n}`,
        php: `function minimumDeletions($nums) {\n    $n = count($nums);\n    $mi = 0;\n    $ma = 0;\n    for ($i = 1; $i < $n; $i++) {\n        if ($nums[$i] < $nums[$mi]) $mi = $i;\n        if ($nums[$i] > $nums[$ma]) $ma = $i;\n    }\n    $lo = min($mi, $ma);\n    $hi = max($mi, $ma);\n    return min($hi + 1, $n - $lo, $lo + 1 + ($n - $hi));\n}`,
        ruby: `def minimumDeletions(nums)\n  n = nums.length\n  mi = nums.index(nums.min)\n  ma = nums.index(nums.max)\n  lo = [mi, ma].min\n  hi = [mi, ma].max\n  [hi + 1, n - lo, lo + 1 + (n - hi)].min\nend`,
      },
    };
  })(),

  // ── Eliminate Maximum Number of Monsters (LC 1921) ──────────────
  (() => {
    const ref = (dist: number[], speed: number[]) => {
      const n = dist.length;
      const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => dist[a] * speed[b] - dist[b] * speed[a]);
      for (let i = 0; i < n; i++) {
        const j = idx[i];
        if (dist[j] <= i * speed[j]) return i;
      }
      return n;
    };
    return {
      slug: "eliminate-maximum-number-of-monsters",
      title: "Eliminate Maximum Number of Monsters",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Google", "Paytm"],
      signature: { funcName: "eliminateMaximum", params: [{ name: "dist", type: "int[]" as const }, { name: "speed", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Monster `i` starts `dist[i]` km from your city and closes in at `speed[i]` km per minute. Your weapon fires instantly at minute 0 and then recharges for one minute, so you can eliminate one monster at minute 0, one at minute 1, and so on.\n\nA monster that reaches the city (distance 0) at or before the minute you would fire counts as a loss, and the game stops immediately. Return the maximum number of monsters you can eliminate.",
        [
          { in: "dist = [1,3,4], speed = [1,1,1]", out: "3", note: "They arrive at minutes 1, 3 and 4 — all can be shot in time." },
          { in: "dist = [1,1,2,3], speed = [1,1,1,1]", out: "1", note: "Two monsters arrive at minute 1, so one gets through." },
          { in: "dist = [3,2,4], speed = [5,3,2]", out: "1", note: "The first two arrive before minute 1." },
        ],
        ["n == dist.length == speed.length", "1 <= n <= 100000", "1 <= dist[i], speed[i] <= 100000"]),
      hints: [
        "Monster `i` arrives at time `dist[i] / speed[i]`.",
        "Shoot in order of arrival time — the soonest first.",
        "Compare arrival times without division: `dist[a] · speed[b]` against `dist[b] · speed[a]`.",
      ],
      editorial: explain({
        idea: "Sort by arrival time and shoot in that order. The `i`-th shot happens at minute `i`, so the run ends at the first monster whose arrival time is at or before its own shot minute.",
        steps: [
          "Sort the monster indices by `dist[i] / speed[i]` ascending, comparing via cross-multiplication.",
          "For the `i`-th monster in that order, it is lost if `dist[j] <= i · speed[j]`.",
          "Return the index of the first loss, or `n` if there is none.",
        ],
        why: "Exchange argument: if two monsters are shot out of arrival order, swapping them never makes things worse — the earlier-arriving one gets an earlier shot, and the later one still has slack. So the arrival order is optimal, and the first failure under it is the true answer. Cross-multiplication keeps the comparison exact where floating-point division could tie two distinct arrival times.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "`dist[a] · speed[b]` reaches `10^10` — the comparison needs 64-bit outside JavaScript.",
          "A monster arriving *exactly* at its shot minute is a loss, so the test is `<=`.",
          "Comparing computed floating-point arrival times can mis-order equal fractions like 2/4 and 1/2.",
        ],
      }),
      examples: [
        { input: "[1,3,4]\n[1,1,1]", expectedOutput: "3" },
        { input: "[1,1,2,3]\n[1,1,1,1]", expectedOutput: "1" },
        { input: "[3,2,4]\n[5,3,2]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const hi = rng() < 0.6 ? 20 : 100000;
        const dist = Array.from({ length: n }, () => ri(rng, 1, hi));
        const speed = Array.from({ length: n }, () => ri(rng, 1, Math.min(hi, 50)));
        return { input: `${fmtIntArr(dist)}\n${fmtIntArr(speed)}`, expectedOutput: String(ref(dist, speed)) };
      },
      solutions: {
        python: `from typing import List\n\ndef eliminateMaximum(dist: List[int], speed: List[int]) -> int:\n    n = len(dist)\n    order = sorted(range(n), key=lambda i: dist[i] / speed[i])\n    for i, j in enumerate(order):\n        if dist[j] <= i * speed[j]:\n            return i\n    return n`,
        javascript: `var eliminateMaximum = function(dist, speed) {\n    var n = dist.length;\n    var idx = [];\n    for (var t = 0; t < n; t++) idx.push(t);\n    idx.sort(function(a, b) { return dist[a] * speed[b] - dist[b] * speed[a]; });\n    for (var i = 0; i < n; i++) {\n        var j = idx[i];\n        if (dist[j] <= i * speed[j]) return i;\n    }\n    return n;\n};`,
        typescript: `function eliminateMaximum(dist: number[], speed: number[]): number {\n    var n = dist.length;\n    var idx: number[] = [];\n    for (var t = 0; t < n; t++) idx.push(t);\n    idx.sort(function(a, b) { return dist[a] * speed[b] - dist[b] * speed[a]; });\n    for (var i = 0; i < n; i++) {\n        var j = idx[i];\n        if (dist[j] <= i * speed[j]) return i;\n    }\n    return n;\n}`,
        java: `public static int eliminateMaximum(int[] dist, int[] speed) {\n    int n = dist.length;\n    Integer[] idx = new Integer[n];\n    for (int i = 0; i < n; i++) idx[i] = i;\n    Arrays.sort(idx, (a, b) -> Long.compare((long) dist[a] * speed[b], (long) dist[b] * speed[a]));\n    for (int i = 0; i < n; i++) {\n        int j = idx[i];\n        if ((long) dist[j] <= (long) i * speed[j]) return i;\n    }\n    return n;\n}`,
        cpp: `int eliminateMaximum(vector<int>& dist, vector<int>& speed) {\n    int n = (int) dist.size();\n    vector<int> idx(n);\n    for (int i = 0; i < n; i++) idx[i] = i;\n    sort(idx.begin(), idx.end(), [&](int a, int b) {\n        return (long long) dist[a] * speed[b] < (long long) dist[b] * speed[a];\n    });\n    for (int i = 0; i < n; i++) {\n        int j = idx[i];\n        if ((long long) dist[j] <= (long long) i * speed[j]) return i;\n    }\n    return n;\n}`,
        c: `static int* monsterDist;\nstatic int* monsterSpeed;\n\nstatic int cmpMonster(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    long long l = (long long) monsterDist[x] * monsterSpeed[y];\n    long long r = (long long) monsterDist[y] * monsterSpeed[x];\n    return (l > r) - (l < r);\n}\n\nint eliminateMaximum(int* dist, int distSize, int* speed, int speedSize) {\n    (void) speedSize;\n    int n = distSize;\n    monsterDist = dist;\n    monsterSpeed = speed;\n    int* idx = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) idx[i] = i;\n    qsort(idx, (size_t) n, sizeof(int), cmpMonster);\n    int ans = n;\n    for (int i = 0; i < n; i++) {\n        int j = idx[i];\n        if ((long long) dist[j] <= (long long) i * speed[j]) {\n            ans = i;\n            break;\n        }\n    }\n    free(idx);\n    return ans;\n}`,
        csharp: `public static int EliminateMaximum(int[] dist, int[] speed)\n{\n    int n = dist.Length;\n    int[] idx = new int[n];\n    for (int i = 0; i < n; i++) idx[i] = i;\n    Array.Sort(idx, (a, b) => ((long) dist[a] * speed[b]).CompareTo((long) dist[b] * speed[a]));\n    for (int i = 0; i < n; i++)\n    {\n        int j = idx[i];\n        if ((long) dist[j] <= (long) i * speed[j]) return i;\n    }\n    return n;\n}`,
        go: `func eliminateMaximum(dist []int, speed []int) int {\n\tn := len(dist)\n\tidx := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tidx[i] = i\n\t}\n\tsort.Slice(idx, func(a, b int) bool {\n\t\treturn dist[idx[a]]*speed[idx[b]] < dist[idx[b]]*speed[idx[a]]\n\t})\n\tfor i := 0; i < n; i++ {\n\t\tj := idx[i]\n\t\tif dist[j] <= i*speed[j] {\n\t\t\treturn i\n\t\t}\n\t}\n\treturn n\n}`,
        kotlin: `fun eliminateMaximum(dist: IntArray, speed: IntArray): Int {\n    val n = dist.size\n    val idx = (0 until n).sortedBy { dist[it].toDouble() / speed[it] }\n    for (i in 0 until n) {\n        val j = idx[i]\n        if (dist[j].toLong() <= i.toLong() * speed[j]) return i\n    }\n    return n\n}`,
        swift: `func eliminateMaximum(_ dist: [Int], _ speed: [Int]) -> Int {\n    let n = dist.count\n    let idx = (0..<n).sorted { a, b in\n        dist[a] * speed[b] < dist[b] * speed[a]\n    }\n    for i in 0..<n {\n        let j = idx[i]\n        if dist[j] <= i * speed[j] { return i }\n    }\n    return n\n}`,
        rust: `fn eliminateMaximum(dist: Vec<i32>, speed: Vec<i32>) -> i32 {\n    let n = dist.len();\n    let mut idx: Vec<usize> = (0..n).collect();\n    idx.sort_by(|&a, &b| {\n        let l = dist[a] as i64 * speed[b] as i64;\n        let r = dist[b] as i64 * speed[a] as i64;\n        l.cmp(&r)\n    });\n    for i in 0..n {\n        let j = idx[i];\n        if dist[j] as i64 <= i as i64 * speed[j] as i64 {\n            return i as i32;\n        }\n    }\n    n as i32\n}`,
        php: `function eliminateMaximum($dist, $speed) {\n    $n = count($dist);\n    $idx = range(0, $n - 1);\n    usort($idx, function($a, $b) use ($dist, $speed) {\n        $l = $dist[$a] * $speed[$b];\n        $r = $dist[$b] * $speed[$a];\n        if ($l === $r) return 0;\n        return $l < $r ? -1 : 1;\n    });\n    for ($i = 0; $i < $n; $i++) {\n        $j = $idx[$i];\n        if ($dist[$j] <= $i * $speed[$j]) return $i;\n    }\n    return $n;\n}`,
        ruby: `def eliminateMaximum(dist, speed)\n  n = dist.length\n  idx = (0...n).sort { |a, b| dist[a] * speed[b] <=> dist[b] * speed[a] }\n  idx.each_with_index do |j, i|\n    return i if dist[j] <= i * speed[j]\n  end\n  n\nend`,
      },
    };
  })(),

  // ── Video Stitching (LC 1024) ───────────────────────────────────
  (() => {
    const ref = (clips: number[][], time: number) => {
      const maxReach = new Array(time).fill(0);
      for (let i = 0; i < clips.length; i++) {
        const s = clips[i][0], e = clips[i][1];
        if (s < time && e > maxReach[s]) maxReach[s] = e;
      }
      let res = 0, curEnd = 0, nxt = 0;
      for (let i = 0; i < time; i++) {
        if (maxReach[i] > nxt) nxt = maxReach[i];
        if (i === curEnd) {
          if (nxt <= i) return -1;
          res++;
          curEnd = nxt;
        }
      }
      return res;
    };
    return {
      slug: "video-stitching",
      title: "Video Stitching",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Dynamic Programming", "Intervals", "Amazon", "Google", "Hotstar"],
      signature: { funcName: "videoStitching", params: [{ name: "clips", type: "int[][]" as const }, { name: "time", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`clips[i] = [start_i, end_i]` is a clip of a sporting event that covers that interval of seconds. Clips may be cut to any sub-interval.\n\nReturn the minimum number of clips needed to cover the whole event `[0, time]`, or `-1` if it cannot be covered.",
        [
          { in: "clips = [[0,2],[4,6],[8,10],[1,9],[1,5],[5,9]], time = 10", out: "3", note: "Take [0,2], [1,9] and [8,10]." },
          { in: "clips = [[0,1],[1,2]], time = 5", out: "-1", note: "Nothing covers past second 2." },
          { in: "clips = [[0,4],[2,8]], time = 5", out: "2" },
        ],
        ["1 <= clips.length <= 100", "0 <= start_i <= end_i <= 100", "1 <= time <= 100"]),
      hints: [
        "For each possible start second, only the clip reaching furthest right matters.",
        "This is the jump-game shape: from everything covered so far, jump to the furthest reachable point.",
        "If the furthest reach never gets past the current boundary, the coverage is impossible.",
      ],
      editorial: explain({
        idea: "Reduce the clips to `maxReach[s]`, the furthest end among clips starting at `s`, then run the interval-covering greedy: repeatedly extend to the furthest point reachable from anywhere already covered.",
        steps: [
          "Build `maxReach` over the starts below `time`.",
          "Sweep `i` from 0 to `time - 1`, keeping `nxt`, the furthest end reachable from any start seen so far.",
          "When `i` reaches the current boundary `curEnd`, commit a clip: if `nxt <= i` the event cannot be covered, otherwise increment the count and move the boundary to `nxt`.",
        ],
        why: "Only the furthest-reaching clip per start can ever be optimal — any other clip with the same start is contained in it. Committing to the furthest reach at each boundary is the standard interval-covering greedy: delaying the choice cannot extend coverage further, and taking a shorter clip only forces at least as many clips later.",
        time: "O(n + time)",
        space: "O(time)",
        pitfalls: [
          "A clip starting at or after `time` is useless and must not index past the array.",
          "The failure test is `nxt <= i` at a boundary — a gap means no clip bridges it.",
          "Coverage must reach `time` itself, which is why the sweep runs over `[0, time - 1]` seconds of interval.",
        ],
      }),
      examples: [
        { input: "[[0,2],[4,6],[8,10],[1,9],[1,5],[5,9]]\n10", expectedOutput: "3" },
        { input: "[[0,1],[1,2]]\n5", expectedOutput: "-1" },
        { input: "[[0,4],[2,8]]\n5", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const time = ri(rng, 1, 40);
        const clips = Array.from({ length: ri(rng, 1, 18) }, () => {
          const s = ri(rng, 0, Math.min(100, time + 2));
          return [s, Math.min(100, s + ri(rng, 0, Math.ceil(time / 2) + 2))];
        });
        return { input: `${fmtIntMat(clips)}\n${time}`, expectedOutput: String(ref(clips, time)) };
      },
      solutions: {
        python: `from typing import List\n\ndef videoStitching(clips: List[List[int]], time: int) -> int:\n    max_reach = [0] * time\n    for s, e in clips:\n        if s < time:\n            max_reach[s] = max(max_reach[s], e)\n    res = cur_end = nxt = 0\n    for i in range(time):\n        nxt = max(nxt, max_reach[i])\n        if i == cur_end:\n            if nxt <= i:\n                return -1\n            res += 1\n            cur_end = nxt\n    return res`,
        javascript: `var videoStitching = function(clips, time) {\n    var maxReach = [];\n    for (var t = 0; t < time; t++) maxReach.push(0);\n    for (var i = 0; i < clips.length; i++) {\n        var s = clips[i][0], e = clips[i][1];\n        if (s < time && e > maxReach[s]) maxReach[s] = e;\n    }\n    var res = 0, curEnd = 0, nxt = 0;\n    for (var j = 0; j < time; j++) {\n        if (maxReach[j] > nxt) nxt = maxReach[j];\n        if (j === curEnd) {\n            if (nxt <= j) return -1;\n            res++;\n            curEnd = nxt;\n        }\n    }\n    return res;\n};`,
        typescript: `function videoStitching(clips: number[][], time: number): number {\n    var maxReach: number[] = [];\n    for (var t = 0; t < time; t++) maxReach.push(0);\n    for (var i = 0; i < clips.length; i++) {\n        var s = clips[i][0], e = clips[i][1];\n        if (s < time && e > maxReach[s]) maxReach[s] = e;\n    }\n    var res = 0, curEnd = 0, nxt = 0;\n    for (var j = 0; j < time; j++) {\n        if (maxReach[j] > nxt) nxt = maxReach[j];\n        if (j === curEnd) {\n            if (nxt <= j) return -1;\n            res++;\n            curEnd = nxt;\n        }\n    }\n    return res;\n}`,
        java: `public static int videoStitching(int[][] clips, int time) {\n    int[] maxReach = new int[time];\n    for (int[] c : clips) {\n        if (c[0] < time) maxReach[c[0]] = Math.max(maxReach[c[0]], c[1]);\n    }\n    int res = 0, curEnd = 0, nxt = 0;\n    for (int i = 0; i < time; i++) {\n        nxt = Math.max(nxt, maxReach[i]);\n        if (i == curEnd) {\n            if (nxt <= i) return -1;\n            res++;\n            curEnd = nxt;\n        }\n    }\n    return res;\n}`,
        cpp: `int videoStitching(vector<vector<int>>& clips, int time) {\n    vector<int> maxReach(time, 0);\n    for (auto& c : clips) {\n        if (c[0] < time) maxReach[c[0]] = max(maxReach[c[0]], c[1]);\n    }\n    int res = 0, curEnd = 0, nxt = 0;\n    for (int i = 0; i < time; i++) {\n        nxt = max(nxt, maxReach[i]);\n        if (i == curEnd) {\n            if (nxt <= i) return -1;\n            res++;\n            curEnd = nxt;\n        }\n    }\n    return res;\n}`,
        c: `int videoStitching(int** clips, int clipsSize, int* clipsColSize, int time) {\n    (void) clipsColSize;\n    int* maxReach = (int*) calloc((size_t) time, sizeof(int));\n    for (int i = 0; i < clipsSize; i++) {\n        int s = clips[i][0], e = clips[i][1];\n        if (s < time && e > maxReach[s]) maxReach[s] = e;\n    }\n    int res = 0, curEnd = 0, nxt = 0;\n    for (int i = 0; i < time; i++) {\n        if (maxReach[i] > nxt) nxt = maxReach[i];\n        if (i == curEnd) {\n            if (nxt <= i) {\n                free(maxReach);\n                return -1;\n            }\n            res++;\n            curEnd = nxt;\n        }\n    }\n    free(maxReach);\n    return res;\n}`,
        csharp: `public static int VideoStitching(int[][] clips, int time)\n{\n    int[] maxReach = new int[time];\n    foreach (var c in clips)\n    {\n        if (c[0] < time) maxReach[c[0]] = Math.Max(maxReach[c[0]], c[1]);\n    }\n    int res = 0, curEnd = 0, nxt = 0;\n    for (int i = 0; i < time; i++)\n    {\n        nxt = Math.Max(nxt, maxReach[i]);\n        if (i == curEnd)\n        {\n            if (nxt <= i) return -1;\n            res++;\n            curEnd = nxt;\n        }\n    }\n    return res;\n}`,
        go: `func videoStitching(clips [][]int, time int) int {\n\tmaxReach := make([]int, time)\n\tfor _, c := range clips {\n\t\tif c[0] < time && c[1] > maxReach[c[0]] {\n\t\t\tmaxReach[c[0]] = c[1]\n\t\t}\n\t}\n\tres, curEnd, nxt := 0, 0, 0\n\tfor i := 0; i < time; i++ {\n\t\tif maxReach[i] > nxt {\n\t\t\tnxt = maxReach[i]\n\t\t}\n\t\tif i == curEnd {\n\t\t\tif nxt <= i {\n\t\t\t\treturn -1\n\t\t\t}\n\t\t\tres++\n\t\t\tcurEnd = nxt\n\t\t}\n\t}\n\treturn res\n}`,
        kotlin: `fun videoStitching(clips: Array<IntArray>, time: Int): Int {\n    val maxReach = IntArray(time)\n    for (c in clips) {\n        if (c[0] < time) maxReach[c[0]] = maxOf(maxReach[c[0]], c[1])\n    }\n    var res = 0\n    var curEnd = 0\n    var nxt = 0\n    for (i in 0 until time) {\n        nxt = maxOf(nxt, maxReach[i])\n        if (i == curEnd) {\n            if (nxt <= i) return -1\n            res++\n            curEnd = nxt\n        }\n    }\n    return res\n}`,
        swift: `func videoStitching(_ clips: [[Int]], _ time: Int) -> Int {\n    var maxReach = [Int](repeating: 0, count: time)\n    for c in clips {\n        if c[0] < time { maxReach[c[0]] = max(maxReach[c[0]], c[1]) }\n    }\n    var res = 0\n    var curEnd = 0\n    var nxt = 0\n    for i in 0..<time {\n        nxt = max(nxt, maxReach[i])\n        if i == curEnd {\n            if nxt <= i { return -1 }\n            res += 1\n            curEnd = nxt\n        }\n    }\n    return res\n}`,
        rust: `fn videoStitching(clips: Vec<Vec<i32>>, time: i32) -> i32 {\n    let t = time as usize;\n    let mut max_reach = vec![0i32; t];\n    for c in clips.iter() {\n        if (c[0] as usize) < t && c[1] > max_reach[c[0] as usize] {\n            max_reach[c[0] as usize] = c[1];\n        }\n    }\n    let mut res = 0i32;\n    let mut cur_end = 0i32;\n    let mut nxt = 0i32;\n    for i in 0..time {\n        if max_reach[i as usize] > nxt {\n            nxt = max_reach[i as usize];\n        }\n        if i == cur_end {\n            if nxt <= i {\n                return -1;\n            }\n            res += 1;\n            cur_end = nxt;\n        }\n    }\n    res\n}`,
        php: `function videoStitching($clips, $time) {\n    $maxReach = array_fill(0, $time, 0);\n    foreach ($clips as $c) {\n        if ($c[0] < $time && $c[1] > $maxReach[$c[0]]) $maxReach[$c[0]] = $c[1];\n    }\n    $res = 0;\n    $curEnd = 0;\n    $nxt = 0;\n    for ($i = 0; $i < $time; $i++) {\n        if ($maxReach[$i] > $nxt) $nxt = $maxReach[$i];\n        if ($i === $curEnd) {\n            if ($nxt <= $i) return -1;\n            $res++;\n            $curEnd = $nxt;\n        }\n    }\n    return $res;\n}`,
        ruby: `def videoStitching(clips, time)\n  max_reach = Array.new(time, 0)\n  clips.each do |c|\n    s = c[0]\n    e = c[1]\n    max_reach[s] = e if s < time && e > max_reach[s]\n  end\n  res = 0\n  cur_end = 0\n  nxt = 0\n  (0...time).each do |i|\n    nxt = max_reach[i] if max_reach[i] > nxt\n    if i == cur_end\n      return -1 if nxt <= i\n      res += 1\n      cur_end = nxt\n    end\n  end\n  res\nend`,
      },
    };
  })(),

  // ── Minimum Moves to Convert String (LC 2027) ───────────────────
  (() => {
    const ref = (s: string) => {
      let i = 0, ans = 0;
      while (i < s.length) {
        if (s[i] === "X") { ans++; i += 3; } else i++;
      }
      return ans;
    };
    return {
      slug: "minimum-moves-to-convert-string",
      title: "Minimum Moves to Convert String",
      difficulty: "EASY" as const,
      tags: ["String", "Greedy", "Amazon", "Microsoft", "Cognizant"],
      signature: { funcName: "minimumMoves", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "`s` consists of `'X'` and `'O'`. One move picks any **three consecutive** characters and turns them all into `'O'`.\n\nReturn the minimum number of moves needed so that `s` contains no `'X'`.",
        [
          { in: 's = "XXX"', out: "1", note: "One move covers all three." },
          { in: 's = "XXOX"', out: "2", note: "Cover indices 0–2, then 1–3 (or 3 alone)." },
          { in: 's = "OOOO"', out: "0" },
        ],
        ["3 <= s.length <= 1000", "s[i] is 'X' or 'O'"]),
      hints: [
        "Scan left to right: the leftmost remaining `'X'` has to be covered by some move.",
        "The best move covering it starts exactly at it — starting earlier wastes coverage to the left.",
        "So on seeing an `'X'`, count a move and skip three characters.",
      ],
      editorial: explain({
        idea: "A left-to-right greedy. The first `'X'` must be covered, and the move that covers it while reaching furthest right is the one starting at that `'X'` — so take it and jump past the three characters it blanks.",
        steps: [
          "Walk `i` over the string.",
          "On `'O'`, advance by one.",
          "On `'X'`, count a move and advance by three.",
        ],
        why: "Exchange argument: any move covering the leftmost `'X'` starts at or before it; sliding it right to start exactly there still covers that `'X'` and covers at least as much to the right, so it is never worse. Repeating turns any optimal solution into this greedy.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Moves may overlap and may run past the end conceptually — the jump of three simply exits the loop.",
          "Advancing by three on an `'O'` skips `'X'`s that still need covering.",
          "The string is guaranteed at least three characters, so a single move always exists.",
        ],
      }),
      examples: [
        { input: '"XXX"', expectedOutput: "1" },
        { input: '"XXOX"', expectedOutput: "2" },
        { input: '"OOOO"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const s = Array.from({ length: ri(rng, 3, 40) }, () => (rng() < 0.4 ? "X" : "O")).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minimumMoves(s: str) -> int:\n    i = ans = 0\n    while i < len(s):\n        if s[i] == "X":\n            ans += 1\n            i += 3\n        else:\n            i += 1\n    return ans`,
        javascript: `var minimumMoves = function(s) {\n    var i = 0, ans = 0;\n    while (i < s.length) {\n        if (s.charAt(i) === "X") { ans++; i += 3; } else i++;\n    }\n    return ans;\n};`,
        typescript: `function minimumMoves(s: string): number {\n    var i = 0, ans = 0;\n    while (i < s.length) {\n        if (s.charAt(i) === "X") { ans++; i += 3; } else i++;\n    }\n    return ans;\n}`,
        java: `public static int minimumMoves(String s) {\n    int i = 0, ans = 0;\n    while (i < s.length()) {\n        if (s.charAt(i) == 'X') {\n            ans++;\n            i += 3;\n        } else {\n            i++;\n        }\n    }\n    return ans;\n}`,
        cpp: `int minimumMoves(string s) {\n    int i = 0, ans = 0;\n    while (i < (int) s.size()) {\n        if (s[i] == 'X') {\n            ans++;\n            i += 3;\n        } else {\n            i++;\n        }\n    }\n    return ans;\n}`,
        c: `int minimumMoves(char* s) {\n    int n = (int) strlen(s);\n    int i = 0, ans = 0;\n    while (i < n) {\n        if (s[i] == 'X') {\n            ans++;\n            i += 3;\n        } else {\n            i++;\n        }\n    }\n    return ans;\n}`,
        csharp: `public static int MinimumMoves(string s)\n{\n    int i = 0, ans = 0;\n    while (i < s.Length)\n    {\n        if (s[i] == 'X')\n        {\n            ans++;\n            i += 3;\n        }\n        else\n        {\n            i++;\n        }\n    }\n    return ans;\n}`,
        go: `func minimumMoves(s string) int {\n\ti, ans := 0, 0\n\tfor i < len(s) {\n\t\tif s[i] == 'X' {\n\t\t\tans++\n\t\t\ti += 3\n\t\t} else {\n\t\t\ti++\n\t\t}\n\t}\n\treturn ans\n}`,
        kotlin: `fun minimumMoves(s: String): Int {\n    var i = 0\n    var ans = 0\n    while (i < s.length) {\n        if (s[i] == 'X') {\n            ans++\n            i += 3\n        } else {\n            i++\n        }\n    }\n    return ans\n}`,
        swift: `func minimumMoves(_ s: String) -> Int {\n    let a = Array(s)\n    var i = 0\n    var ans = 0\n    while i < a.count {\n        if a[i] == "X" {\n            ans += 1\n            i += 3\n        } else {\n            i += 1\n        }\n    }\n    return ans\n}`,
        rust: `fn minimumMoves(s: String) -> i32 {\n    let b = s.as_bytes();\n    let mut i = 0usize;\n    let mut ans = 0i32;\n    while i < b.len() {\n        if b[i] == b'X' {\n            ans += 1;\n            i += 3;\n        } else {\n            i += 1;\n        }\n    }\n    ans\n}`,
        php: `function minimumMoves($s) {\n    $i = 0;\n    $ans = 0;\n    $n = strlen($s);\n    while ($i < $n) {\n        if ($s[$i] === "X") { $ans++; $i += 3; } else $i++;\n    }\n    return $ans;\n}`,
        ruby: `def minimumMoves(s)\n  i = 0\n  ans = 0\n  while i < s.length\n    if s[i] == "X"\n      ans += 1\n      i += 3\n    else\n      i += 1\n    end\n  end\n  ans\nend`,
      },
    };
  })(),

  // ── Best Poker Hand (LC 2347) ───────────────────────────────────
  (() => {
    const ref = (ranks: number[], suits: string[]) => {
      let same = true;
      for (let i = 1; i < suits.length; i++) if (suits[i] !== suits[0]) { same = false; break; }
      if (same) return "Flush";
      const cnt: Record<number, number> = {};
      let best = 0;
      for (let i = 0; i < ranks.length; i++) {
        cnt[ranks[i]] = (cnt[ranks[i]] || 0) + 1;
        if (cnt[ranks[i]] > best) best = cnt[ranks[i]];
      }
      if (best >= 3) return "Three of a Kind";
      if (best === 2) return "Pair";
      return "High Card";
    };
    return {
      slug: "best-poker-hand",
      title: "Best Poker Hand",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Counting", "Greedy", "Amazon", "Adobe", "Infosys"],
      signature: { funcName: "bestHand", params: [{ name: "ranks", type: "int[]" as const }, { name: "suits", type: "string[]" as const }], returns: "string" as const },
      description: describe(
        "You hold five cards. `ranks[i]` is the `i`-th card's rank and `suits[i]` its suit.\n\nReturn the best hand you can make, as one of these strings, in decreasing order of strength:\n\n- `\"Flush\"` — all five suits are the same;\n- `\"Three of a Kind\"` — three cards share a rank;\n- `\"Pair\"` — two cards share a rank;\n- `\"High Card\"` — none of the above.",
        [
          { in: 'ranks = [13,2,3,1,9], suits = ["a","a","a","a","a"]', out: "Flush", note: "All five cards share a suit." },
          { in: 'ranks = [4,4,2,4,4], suits = ["d","a","a","b","c"]', out: "Three of a Kind", note: "Four 4s, which still reports as three of a kind." },
          { in: 'ranks = [10,10,2,12,9], suits = ["a","b","c","a","d"]', out: "Pair" },
        ],
        ["ranks.length == suits.length == 5", "1 <= ranks[i] <= 13", "suits[i] is one of 'a', 'b', 'c', 'd'"]),
      hints: [
        "Check the strongest hand first — a flush beats everything else here.",
        "Otherwise the answer depends only on the largest rank multiplicity.",
        "Three *or more* of a rank still reports as `\"Three of a Kind\"`.",
      ],
      editorial: explain({
        idea: "Test the categories in order of strength. A flush depends only on the suits; everything below it depends only on the largest number of cards sharing a rank.",
        steps: [
          "If every suit equals the first, return `\"Flush\"`.",
          "Tally the ranks and take the largest count.",
          "At least 3 → `\"Three of a Kind\"`; exactly 2 → `\"Pair\"`; otherwise `\"High Card\"`.",
        ],
        why: "The categories are strictly ordered, so returning the first that matches gives the best hand. Four of a kind is not a listed category, which is why the test is `>= 3` rather than `== 3` — a hand with four equal ranks is reported as three of a kind.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Testing for a pair before three of a kind reports the weaker hand.",
          "Using `== 3` misclassifies four of a kind as `\"High Card\"`.",
          "A flush takes precedence even when the ranks also form a pair.",
        ],
      }),
      examples: [
        { input: '[13,2,3,1,9]\n["a","a","a","a","a"]', expectedOutput: "Flush" },
        { input: '[4,4,2,4,4]\n["d","a","a","b","c"]', expectedOutput: "Three of a Kind" },
        { input: '[10,10,2,12,9]\n["a","b","c","a","d"]', expectedOutput: "Pair" },
      ],
      gen: (rng: Rng) => {
        const ranks = Array.from({ length: 5 }, () => ri(rng, 1, 13));
        const pool = ["a", "b", "c", "d"];
        // Bias towards flushes now and then so every branch is exercised.
        const suits = rng() < 0.25
          ? Array.from({ length: 5 }, () => pool[0])
          : Array.from({ length: 5 }, () => pick(rng, pool));
        return { input: `${fmtIntArr(ranks)}\n${fmtStrArr(suits)}`, expectedOutput: ref(ranks, suits) };
      },
      solutions: {
        python: `from typing import List\n\ndef bestHand(ranks: List[int], suits: List[str]) -> str:\n    if all(s == suits[0] for s in suits):\n        return "Flush"\n    cnt = {}\n    for r in ranks:\n        cnt[r] = cnt.get(r, 0) + 1\n    best = max(cnt.values())\n    if best >= 3:\n        return "Three of a Kind"\n    if best == 2:\n        return "Pair"\n    return "High Card"`,
        javascript: `var bestHand = function(ranks, suits) {\n    var same = true;\n    for (var i = 1; i < suits.length; i++) {\n        if (suits[i] !== suits[0]) { same = false; break; }\n    }\n    if (same) return "Flush";\n    var cnt = {}, best = 0;\n    for (var j = 0; j < ranks.length; j++) {\n        cnt[ranks[j]] = (cnt[ranks[j]] || 0) + 1;\n        if (cnt[ranks[j]] > best) best = cnt[ranks[j]];\n    }\n    if (best >= 3) return "Three of a Kind";\n    if (best === 2) return "Pair";\n    return "High Card";\n};`,
        typescript: `function bestHand(ranks: number[], suits: string[]): string {\n    var same = true;\n    for (var i = 1; i < suits.length; i++) {\n        if (suits[i] !== suits[0]) { same = false; break; }\n    }\n    if (same) return "Flush";\n    var cnt: { [key: number]: number } = {};\n    var best = 0;\n    for (var j = 0; j < ranks.length; j++) {\n        cnt[ranks[j]] = (cnt[ranks[j]] || 0) + 1;\n        if (cnt[ranks[j]] > best) best = cnt[ranks[j]];\n    }\n    if (best >= 3) return "Three of a Kind";\n    if (best === 2) return "Pair";\n    return "High Card";\n}`,
        java: `public static String bestHand(int[] ranks, String[] suits) {\n    boolean same = true;\n    for (int i = 1; i < suits.length; i++) {\n        if (!suits[i].equals(suits[0])) {\n            same = false;\n            break;\n        }\n    }\n    if (same) return "Flush";\n    int[] cnt = new int[14];\n    int best = 0;\n    for (int r : ranks) {\n        cnt[r]++;\n        best = Math.max(best, cnt[r]);\n    }\n    if (best >= 3) return "Three of a Kind";\n    if (best == 2) return "Pair";\n    return "High Card";\n}`,
        cpp: `string bestHand(vector<int>& ranks, vector<string>& suits) {\n    bool same = true;\n    for (int i = 1; i < (int) suits.size(); i++) {\n        if (suits[i] != suits[0]) {\n            same = false;\n            break;\n        }\n    }\n    if (same) return "Flush";\n    vector<int> cnt(14, 0);\n    int best = 0;\n    for (int r : ranks) {\n        cnt[r]++;\n        best = max(best, cnt[r]);\n    }\n    if (best >= 3) return "Three of a Kind";\n    if (best == 2) return "Pair";\n    return "High Card";\n}`,
        c: `char* bestHand(int* ranks, int ranksSize, char** suits, int suitsSize) {\n    int same = 1;\n    for (int i = 1; i < suitsSize; i++) {\n        if (strcmp(suits[i], suits[0]) != 0) {\n            same = 0;\n            break;\n        }\n    }\n    if (same) return "Flush";\n    int cnt[14];\n    for (int i = 0; i < 14; i++) cnt[i] = 0;\n    int best = 0;\n    for (int i = 0; i < ranksSize; i++) {\n        cnt[ranks[i]]++;\n        if (cnt[ranks[i]] > best) best = cnt[ranks[i]];\n    }\n    if (best >= 3) return "Three of a Kind";\n    if (best == 2) return "Pair";\n    return "High Card";\n}`,
        csharp: `public static string BestHand(int[] ranks, string[] suits)\n{\n    bool same = true;\n    for (int i = 1; i < suits.Length; i++)\n    {\n        if (suits[i] != suits[0])\n        {\n            same = false;\n            break;\n        }\n    }\n    if (same) return "Flush";\n    int[] cnt = new int[14];\n    int best = 0;\n    foreach (int r in ranks)\n    {\n        cnt[r]++;\n        if (cnt[r] > best) best = cnt[r];\n    }\n    if (best >= 3) return "Three of a Kind";\n    if (best == 2) return "Pair";\n    return "High Card";\n}`,
        go: `func bestHand(ranks []int, suits []string) string {\n\tsame := true\n\tfor i := 1; i < len(suits); i++ {\n\t\tif suits[i] != suits[0] {\n\t\t\tsame = false\n\t\t\tbreak\n\t\t}\n\t}\n\tif same {\n\t\treturn "Flush"\n\t}\n\tcnt := make([]int, 14)\n\tbest := 0\n\tfor _, r := range ranks {\n\t\tcnt[r]++\n\t\tif cnt[r] > best {\n\t\t\tbest = cnt[r]\n\t\t}\n\t}\n\tif best >= 3 {\n\t\treturn "Three of a Kind"\n\t}\n\tif best == 2 {\n\t\treturn "Pair"\n\t}\n\treturn "High Card"\n}`,
        kotlin: `fun bestHand(ranks: IntArray, suits: Array<String>): String {\n    var same = true\n    for (i in 1 until suits.size) {\n        if (suits[i] != suits[0]) {\n            same = false\n            break\n        }\n    }\n    if (same) return "Flush"\n    val cnt = IntArray(14)\n    var best = 0\n    for (r in ranks) {\n        cnt[r]++\n        if (cnt[r] > best) best = cnt[r]\n    }\n    if (best >= 3) return "Three of a Kind"\n    if (best == 2) return "Pair"\n    return "High Card"\n}`,
        swift: `func bestHand(_ ranks: [Int], _ suits: [String]) -> String {\n    var same = true\n    for i in 1..<suits.count where suits[i] != suits[0] {\n        same = false\n        break\n    }\n    if same { return "Flush" }\n    var cnt = [Int](repeating: 0, count: 14)\n    var best = 0\n    for r in ranks {\n        cnt[r] += 1\n        if cnt[r] > best { best = cnt[r] }\n    }\n    if best >= 3 { return "Three of a Kind" }\n    if best == 2 { return "Pair" }\n    return "High Card"\n}`,
        rust: `fn bestHand(ranks: Vec<i32>, suits: Vec<String>) -> String {\n    let mut same = true;\n    for i in 1..suits.len() {\n        if suits[i] != suits[0] {\n            same = false;\n            break;\n        }\n    }\n    if same {\n        return String::from("Flush");\n    }\n    let mut cnt = [0i32; 14];\n    let mut best = 0i32;\n    for &r in ranks.iter() {\n        cnt[r as usize] += 1;\n        if cnt[r as usize] > best {\n            best = cnt[r as usize];\n        }\n    }\n    if best >= 3 {\n        return String::from("Three of a Kind");\n    }\n    if best == 2 {\n        return String::from("Pair");\n    }\n    String::from("High Card")\n}`,
        php: `function bestHand($ranks, $suits) {\n    $same = true;\n    for ($i = 1; $i < count($suits); $i++) {\n        if ($suits[$i] !== $suits[0]) { $same = false; break; }\n    }\n    if ($same) return "Flush";\n    $cnt = array_fill(0, 14, 0);\n    $best = 0;\n    foreach ($ranks as $r) {\n        $cnt[$r]++;\n        if ($cnt[$r] > $best) $best = $cnt[$r];\n    }\n    if ($best >= 3) return "Three of a Kind";\n    if ($best === 2) return "Pair";\n    return "High Card";\n}`,
        ruby: `def bestHand(ranks, suits)\n  return "Flush" if suits.all? { |s| s == suits[0] }\n  cnt = Hash.new(0)\n  ranks.each { |r| cnt[r] += 1 }\n  best = cnt.values.max\n  return "Three of a Kind" if best >= 3\n  return "Pair" if best == 2\n  "High Card"\nend`,
      },
    };
  })(),

  // ── Alternating Digit Sum (LC 2544) ─────────────────────────────
  (() => {
    const ref = (n: number) => {
      const s = String(n);
      let sum = 0, sign = 1;
      for (let i = 0; i < s.length; i++) {
        sum += sign * (s.charCodeAt(i) - 48);
        sign = -sign;
      }
      return sum;
    };
    return {
      slug: "alternating-digit-sum",
      title: "Alternating Digit Sum",
      difficulty: "EASY" as const,
      tags: ["Math", "Amazon", "Adobe", "Wipro"],
      signature: { funcName: "alternateDigitSum", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Give the digits of `n` alternating signs, starting with a **plus** on the most significant digit, and return their sum.",
        [
          { in: "n = 521", out: "4", note: "5 − 2 + 1." },
          { in: "n = 111", out: "1", note: "1 − 1 + 1." },
          { in: "n = 886996", out: "0", note: "8 − 8 + 6 − 9 + 9 − 6." },
        ],
        ["1 <= n <= 1000000000"]),
      hints: [
        "Work over the decimal string so the most significant digit comes first.",
        "Keep a running sign and flip it after each digit.",
        "Peeling digits with `% 10` gives them in the wrong order — the leading sign depends on the digit count.",
      ],
      editorial: explain({
        idea: "Render the number as a string so the digits arrive most-significant first, then add them with a flipping sign.",
        steps: [
          "Convert `n` to its decimal string.",
          "Start with `sign = +1`; add `sign · digit` for each character and negate `sign`.",
        ],
        why: "The sign of a digit depends on its position *from the left*, which the string gives directly. Extracting digits arithmetically with `n % 10` yields them right-to-left, so the starting sign would depend on the parity of the digit count — correct but easier to get wrong.",
        time: "O(d) in the number of digits",
        space: "O(d)",
        pitfalls: [
          "Starting the sign at `-1` inverts every answer.",
          "Peeling with `% 10` needs the digit count to decide the first sign.",
          "The result can be negative, and the sum stays well inside `int`.",
        ],
      }),
      examples: [
        { input: "521", expectedOutput: "4" },
        { input: "111", expectedOutput: "1" },
        { input: "886996", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.5 ? ri(rng, 1, 9999) : ri(rng, 1, 1000000000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def alternateDigitSum(n: int) -> int:\n    total, sign = 0, 1\n    for ch in str(n):\n        total += sign * int(ch)\n        sign = -sign\n    return total`,
        javascript: `var alternateDigitSum = function(n) {\n    var s = String(n);\n    var sum = 0, sign = 1;\n    for (var i = 0; i < s.length; i++) {\n        sum += sign * (s.charCodeAt(i) - 48);\n        sign = -sign;\n    }\n    return sum;\n};`,
        typescript: `function alternateDigitSum(n: number): number {\n    var s = String(n);\n    var sum = 0, sign = 1;\n    for (var i = 0; i < s.length; i++) {\n        sum += sign * (s.charCodeAt(i) - 48);\n        sign = -sign;\n    }\n    return sum;\n}`,
        java: `public static int alternateDigitSum(int n) {\n    String s = Integer.toString(n);\n    int sum = 0, sign = 1;\n    for (int i = 0; i < s.length(); i++) {\n        sum += sign * (s.charAt(i) - '0');\n        sign = -sign;\n    }\n    return sum;\n}`,
        cpp: `int alternateDigitSum(int n) {\n    string s = to_string(n);\n    int sum = 0, sign = 1;\n    for (char ch : s) {\n        sum += sign * (ch - '0');\n        sign = -sign;\n    }\n    return sum;\n}`,
        c: `int alternateDigitSum(int n) {\n    char s[16];\n    sprintf(s, "%d", n);\n    int sum = 0, sign = 1;\n    for (int i = 0; s[i]; i++) {\n        sum += sign * (s[i] - '0');\n        sign = -sign;\n    }\n    return sum;\n}`,
        csharp: `public static int AlternateDigitSum(int n)\n{\n    string s = n.ToString();\n    int sum = 0, sign = 1;\n    for (int i = 0; i < s.Length; i++)\n    {\n        sum += sign * (s[i] - '0');\n        sign = -sign;\n    }\n    return sum;\n}`,
        go: `func alternateDigitSum(n int) int {\n\ts := strconv.Itoa(n)\n\tsum, sign := 0, 1\n\tfor i := 0; i < len(s); i++ {\n\t\tsum += sign * int(s[i]-'0')\n\t\tsign = -sign\n\t}\n\treturn sum\n}`,
        kotlin: `fun alternateDigitSum(n: Int): Int {\n    val s = n.toString()\n    var sum = 0\n    var sign = 1\n    for (ch in s) {\n        sum += sign * (ch - '0')\n        sign = -sign\n    }\n    return sum\n}`,
        swift: `func alternateDigitSum(_ n: Int) -> Int {\n    var sum = 0\n    var sign = 1\n    for ch in String(n) {\n        sum += sign * Int(String(ch))!\n        sign = -sign\n    }\n    return sum\n}`,
        rust: `fn alternateDigitSum(n: i32) -> i32 {\n    let s = n.to_string();\n    let mut sum = 0i32;\n    let mut sign = 1i32;\n    for b in s.as_bytes().iter() {\n        sum += sign * ((b - b'0') as i32);\n        sign = -sign;\n    }\n    sum\n}`,
        php: `function alternateDigitSum($n) {\n    $s = (string) $n;\n    $sum = 0;\n    $sign = 1;\n    for ($i = 0; $i < strlen($s); $i++) {\n        $sum += $sign * (ord($s[$i]) - 48);\n        $sign = -$sign;\n    }\n    return $sum;\n}`,
        ruby: `def alternateDigitSum(n)\n  sum = 0\n  sign = 1\n  n.to_s.each_char do |ch|\n    sum += sign * ch.to_i\n    sign = -sign\n  end\n  sum\nend`,
      },
    };
  })(),

  // ── Determine the Winner of a Bowling Game (LC 2660) ────────────
  (() => {
    const ref = (player1: number[], player2: number[]) => {
      const score = (p: number[]) => {
        let s = 0;
        for (let i = 0; i < p.length; i++) {
          const bonus = (i >= 1 && p[i - 1] === 10) || (i >= 2 && p[i - 2] === 10);
          s += bonus ? 2 * p[i] : p[i];
        }
        return s;
      };
      const a = score(player1), b = score(player2);
      if (a > b) return 1;
      if (b > a) return 2;
      return 0;
    };
    return {
      slug: "determine-the-winner-of-a-bowling-game",
      title: "Determine the Winner of a Bowling Game",
      difficulty: "EASY" as const,
      tags: ["Array", "Simulation", "Amazon", "Microsoft", "Accenture"],
      signature: { funcName: "isWinner", params: [{ name: "player1", type: "int[]" as const }, { name: "player2", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Two players bowl. `player1[i]` and `player2[i]` are the pins each knocked down in turn `i`.\n\nA turn's points are **doubled** if the player knocked down all 10 pins in **either** of the two previous turns; otherwise the points equal the pins.\n\nReturn `1` if player 1 wins, `2` if player 2 wins, and `0` on a tie.",
        [
          { in: "player1 = [4,10,7,9], player2 = [6,5,2,3]", out: "1", note: "Player 1 scores 4 + 10 + 14 + 18 = 46 against 16." },
          { in: "player1 = [3,5,7,6], player2 = [8,10,10,2]", out: "2" },
          { in: "player1 = [2,3], player2 = [4,1]", out: "0", note: "Both total 5." },
        ],
        ["n == player1.length == player2.length", "1 <= n <= 1000", "0 <= player1[i], player2[i] <= 10"]),
      hints: [
        "Score each player independently with one pass.",
        "The doubling depends only on whether either of the two previous turns was exactly 10.",
        "Compare the two totals at the end.",
      ],
      editorial: explain({
        idea: "A direct simulation. For each turn, look back at most two turns for a strike; if one is there, the turn's points double.",
        steps: [
          "For each player, sweep the turns keeping a running total.",
          "At turn `i`, double the points when `p[i-1] == 10` or `p[i-2] == 10` (guarding the bounds).",
          "Compare the totals and report 1, 2 or 0.",
        ],
        why: "The rule refers only to the raw pins in the previous turns, not to the doubled points, so no propagation is needed and one left-to-right pass is exact. The two players never interact, so scoring them separately is correct.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The doubling looks at the *pins*, not the already-doubled score of a previous turn.",
          "Both previous turns count, so it is an `or` over two look-backs, not just the immediately preceding one.",
          "The first two turns need bounds guards.",
        ],
      }),
      examples: [
        { input: "[4,10,7,9]\n[6,5,2,3]", expectedOutput: "1" },
        { input: "[3,5,7,6]\n[8,10,10,2]", expectedOutput: "2" },
        { input: "[2,3]\n[4,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const player1 = Array.from({ length: n }, () => ri(rng, 0, 10));
        const player2 = Array.from({ length: n }, () => ri(rng, 0, 10));
        return { input: `${fmtIntArr(player1)}\n${fmtIntArr(player2)}`, expectedOutput: String(ref(player1, player2)) };
      },
      solutions: {
        python: `from typing import List\n\ndef isWinner(player1: List[int], player2: List[int]) -> int:\n    def score(p: List[int]) -> int:\n        s = 0\n        for i, v in enumerate(p):\n            bonus = (i >= 1 and p[i - 1] == 10) or (i >= 2 and p[i - 2] == 10)\n            s += 2 * v if bonus else v\n        return s\n\n    a, b = score(player1), score(player2)\n    if a > b:\n        return 1\n    if b > a:\n        return 2\n    return 0`,
        javascript: `var isWinner = function(player1, player2) {\n    var score = function(p) {\n        var s = 0;\n        for (var i = 0; i < p.length; i++) {\n            var bonus = (i >= 1 && p[i - 1] === 10) || (i >= 2 && p[i - 2] === 10);\n            s += bonus ? 2 * p[i] : p[i];\n        }\n        return s;\n    };\n    var a = score(player1), b = score(player2);\n    if (a > b) return 1;\n    if (b > a) return 2;\n    return 0;\n};`,
        typescript: `function isWinner(player1: number[], player2: number[]): number {\n    var score = function(p: number[]): number {\n        var s = 0;\n        for (var i = 0; i < p.length; i++) {\n            var bonus = (i >= 1 && p[i - 1] === 10) || (i >= 2 && p[i - 2] === 10);\n            s += bonus ? 2 * p[i] : p[i];\n        }\n        return s;\n    };\n    var a = score(player1), b = score(player2);\n    if (a > b) return 1;\n    if (b > a) return 2;\n    return 0;\n}`,
        java: `private static int bowlingScore(int[] p) {\n    int s = 0;\n    for (int i = 0; i < p.length; i++) {\n        boolean bonus = (i >= 1 && p[i - 1] == 10) || (i >= 2 && p[i - 2] == 10);\n        s += bonus ? 2 * p[i] : p[i];\n    }\n    return s;\n}\n\npublic static int isWinner(int[] player1, int[] player2) {\n    int a = bowlingScore(player1);\n    int b = bowlingScore(player2);\n    if (a > b) return 1;\n    if (b > a) return 2;\n    return 0;\n}`,
        cpp: `static int bowlingScore(vector<int>& p) {\n    int s = 0;\n    for (int i = 0; i < (int) p.size(); i++) {\n        bool bonus = (i >= 1 && p[i - 1] == 10) || (i >= 2 && p[i - 2] == 10);\n        s += bonus ? 2 * p[i] : p[i];\n    }\n    return s;\n}\n\nint isWinner(vector<int>& player1, vector<int>& player2) {\n    int a = bowlingScore(player1);\n    int b = bowlingScore(player2);\n    if (a > b) return 1;\n    if (b > a) return 2;\n    return 0;\n}`,
        c: `static int bowlingScore(int* p, int n) {\n    int s = 0;\n    for (int i = 0; i < n; i++) {\n        int bonus = (i >= 1 && p[i - 1] == 10) || (i >= 2 && p[i - 2] == 10);\n        s += bonus ? 2 * p[i] : p[i];\n    }\n    return s;\n}\n\nint isWinner(int* player1, int player1Size, int* player2, int player2Size) {\n    int a = bowlingScore(player1, player1Size);\n    int b = bowlingScore(player2, player2Size);\n    if (a > b) return 1;\n    if (b > a) return 2;\n    return 0;\n}`,
        csharp: `private static int BowlingScore(int[] p)\n{\n    int s = 0;\n    for (int i = 0; i < p.Length; i++)\n    {\n        bool bonus = (i >= 1 && p[i - 1] == 10) || (i >= 2 && p[i - 2] == 10);\n        s += bonus ? 2 * p[i] : p[i];\n    }\n    return s;\n}\n\npublic static int IsWinner(int[] player1, int[] player2)\n{\n    int a = BowlingScore(player1);\n    int b = BowlingScore(player2);\n    if (a > b) return 1;\n    if (b > a) return 2;\n    return 0;\n}`,
        go: `func bowlingScore(p []int) int {\n\ts := 0\n\tfor i := 0; i < len(p); i++ {\n\t\tbonus := (i >= 1 && p[i-1] == 10) || (i >= 2 && p[i-2] == 10)\n\t\tif bonus {\n\t\t\ts += 2 * p[i]\n\t\t} else {\n\t\t\ts += p[i]\n\t\t}\n\t}\n\treturn s\n}\n\nfunc isWinner(player1 []int, player2 []int) int {\n\ta := bowlingScore(player1)\n\tb := bowlingScore(player2)\n\tif a > b {\n\t\treturn 1\n\t}\n\tif b > a {\n\t\treturn 2\n\t}\n\treturn 0\n}`,
        kotlin: `private fun bowlingScore(p: IntArray): Int {\n    var s = 0\n    for (i in p.indices) {\n        val bonus = (i >= 1 && p[i - 1] == 10) || (i >= 2 && p[i - 2] == 10)\n        s += if (bonus) 2 * p[i] else p[i]\n    }\n    return s\n}\n\nfun isWinner(player1: IntArray, player2: IntArray): Int {\n    val a = bowlingScore(player1)\n    val b = bowlingScore(player2)\n    return if (a > b) 1 else if (b > a) 2 else 0\n}`,
        swift: `func isWinner(_ player1: [Int], _ player2: [Int]) -> Int {\n    func score(_ p: [Int]) -> Int {\n        var s = 0\n        for i in 0..<p.count {\n            let bonus = (i >= 1 && p[i - 1] == 10) || (i >= 2 && p[i - 2] == 10)\n            s += bonus ? 2 * p[i] : p[i]\n        }\n        return s\n    }\n    let a = score(player1)\n    let b = score(player2)\n    if a > b { return 1 }\n    if b > a { return 2 }\n    return 0\n}`,
        rust: `fn isWinner(player1: Vec<i32>, player2: Vec<i32>) -> i32 {\n    fn score(p: &Vec<i32>) -> i32 {\n        let mut s = 0i32;\n        for i in 0..p.len() {\n            let bonus = (i >= 1 && p[i - 1] == 10) || (i >= 2 && p[i - 2] == 10);\n            s += if bonus { 2 * p[i] } else { p[i] };\n        }\n        s\n    }\n    let a = score(&player1);\n    let b = score(&player2);\n    if a > b {\n        1\n    } else if b > a {\n        2\n    } else {\n        0\n    }\n}`,
        php: `function isWinner($player1, $player2) {\n    $score = function($p) {\n        $s = 0;\n        for ($i = 0; $i < count($p); $i++) {\n            $bonus = ($i >= 1 && $p[$i - 1] === 10) || ($i >= 2 && $p[$i - 2] === 10);\n            $s += $bonus ? 2 * $p[$i] : $p[$i];\n        }\n        return $s;\n    };\n    $a = $score($player1);\n    $b = $score($player2);\n    if ($a > $b) return 1;\n    if ($b > $a) return 2;\n    return 0;\n}`,
        ruby: `def isWinner(player1, player2)\n  score = lambda do |p|\n    s = 0\n    p.each_with_index do |v, i|\n      bonus = (i >= 1 && p[i - 1] == 10) || (i >= 2 && p[i - 2] == 10)\n      s += bonus ? 2 * v : v\n    end\n    s\n  end\n  a = score.call(player1)\n  b = score.call(player2)\n  return 1 if a > b\n  return 2 if b > a\n  0\nend`,
      },
    };
  })(),

  // ── Maximum Difference by Remapping a Digit (LC 2566) ───────────
  (() => {
    const ref = (num: number) => {
      const s = String(num);
      let maxS = s;
      for (let i = 0; i < s.length; i++) {
        if (s[i] !== "9") { maxS = s.split(s[i]).join("9"); break; }
      }
      const minS = s.split(s[0]).join("0");
      return parseInt(maxS, 10) - parseInt(minS, 10);
    };
    return {
      slug: "maximum-difference-by-remapping-a-digit",
      title: "Maximum Difference by Remapping a Digit",
      difficulty: "EASY" as const,
      tags: ["Math", "Greedy", "Amazon", "Adobe", "Zoho"],
      signature: { funcName: "minMaxDifference", params: [{ name: "num", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Pick one digit `d` and one digit `e` (possibly the same) and replace **every** occurrence of `d` in `num` with `e`. Leading zeros are allowed in the result.\n\nDo this once to get the largest possible value and once to get the smallest, and return the difference.",
        [
          { in: "num = 11891", out: "99009", note: "Mapping 1 → 9 gives 99899; mapping 1 → 0 gives 00890, i.e. 890." },
          { in: "num = 90", out: "99", note: "Mapping 0 → 9 gives 99; mapping 9 → 0 gives 00." },
          { in: "num = 999", out: "999", note: "Already maximal; mapping 9 → 0 gives 0." },
        ],
        ["1 <= num <= 1000000000"]),
      hints: [
        "For the maximum, turn the **leftmost non-9 digit** into 9 — changing an earlier digit is worth more than any later one.",
        "For the minimum, turn the **leading digit** into 0.",
        "Every occurrence of the chosen digit changes, which is what makes the leftmost choice the right one.",
      ],
      editorial: explain({
        idea: "Place value decides everything: raising the most significant digit that can be raised beats any change further right, and lowering the leading digit to 0 is the biggest possible reduction.",
        steps: [
          "Render `num` as a string.",
          "For the maximum, find the first character that is not `'9'` and replace every copy of it with `'9'`; if there is none, the number is already maximal.",
          "For the minimum, replace every copy of the leading character with `'0'`.",
          "Return the difference of the two parsed values.",
        ],
        why: "Changing a digit at position `i` alters the value by at least `10^(len-1-i)`, which dominates any change at a later position — so the leftmost changeable digit is the one to pick. Mapping it to 9 is the largest increase available and mapping the leading digit to 0 the largest decrease; other occurrences of the same digit only help, since they move in the same direction.",
        time: "O(d) in the number of digits",
        space: "O(d)",
        pitfalls: [
          "A number of all 9s has no digit to raise — the maximum is the number itself.",
          "Leading zeros are permitted, so `\"00890\"` parses to 890 rather than being rejected.",
          "The replacement is global: every copy of the chosen digit changes, not just the first.",
        ],
      }),
      examples: [
        { input: "11891", expectedOutput: "99009" },
        { input: "90", expectedOutput: "99" },
        { input: "999", expectedOutput: "999" },
      ],
      gen: (rng: Rng) => {
        const num = rng() < 0.5 ? ri(rng, 1, 9999) : ri(rng, 1, 1000000000);
        return { input: String(num), expectedOutput: String(ref(num)) };
      },
      solutions: {
        python: `def minMaxDifference(num: int) -> int:\n    s = str(num)\n    hi = s\n    for ch in s:\n        if ch != "9":\n            hi = s.replace(ch, "9")\n            break\n    lo = s.replace(s[0], "0")\n    return int(hi) - int(lo)`,
        javascript: `var minMaxDifference = function(num) {\n    var s = String(num);\n    var maxS = s;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) !== "9") {\n            maxS = s.split(s.charAt(i)).join("9");\n            break;\n        }\n    }\n    var minS = s.split(s.charAt(0)).join("0");\n    return parseInt(maxS, 10) - parseInt(minS, 10);\n};`,
        typescript: `function minMaxDifference(num: number): number {\n    var s = String(num);\n    var maxS = s;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) !== "9") {\n            maxS = s.split(s.charAt(i)).join("9");\n            break;\n        }\n    }\n    var minS = s.split(s.charAt(0)).join("0");\n    return parseInt(maxS, 10) - parseInt(minS, 10);\n}`,
        java: `public static int minMaxDifference(int num) {\n    String s = Integer.toString(num);\n    String hi = s;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) != '9') {\n            hi = s.replace(s.charAt(i), '9');\n            break;\n        }\n    }\n    String lo = s.replace(s.charAt(0), '0');\n    return Integer.parseInt(hi) - Integer.parseInt(lo);\n}`,
        cpp: `int minMaxDifference(int num) {\n    string s = to_string(num);\n    string hi = s;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (s[i] != '9') {\n            char d = s[i];\n            hi = s;\n            for (int j = 0; j < (int) hi.size(); j++) if (hi[j] == d) hi[j] = '9';\n            break;\n        }\n    }\n    string lo = s;\n    char first = s[0];\n    for (int j = 0; j < (int) lo.size(); j++) if (lo[j] == first) lo[j] = '0';\n    return stoi(hi) - stoi(lo);\n}`,
        c: `int minMaxDifference(int num) {\n    char s[16], hi[16], lo[16];\n    sprintf(s, "%d", num);\n    int n = (int) strlen(s);\n    for (int i = 0; i < n; i++) hi[i] = s[i];\n    hi[n] = 0;\n    for (int i = 0; i < n; i++) {\n        if (s[i] != '9') {\n            char d = s[i];\n            for (int j = 0; j < n; j++) if (hi[j] == d) hi[j] = '9';\n            break;\n        }\n    }\n    for (int i = 0; i < n; i++) lo[i] = s[i];\n    lo[n] = 0;\n    char first = s[0];\n    for (int j = 0; j < n; j++) if (lo[j] == first) lo[j] = '0';\n    return atoi(hi) - atoi(lo);\n}`,
        csharp: `public static int MinMaxDifference(int num)\n{\n    string s = num.ToString();\n    string hi = s;\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (s[i] != '9')\n        {\n            hi = s.Replace(s[i], '9');\n            break;\n        }\n    }\n    string lo = s.Replace(s[0], '0');\n    return int.Parse(hi) - int.Parse(lo);\n}`,
        go: `func minMaxDifference(num int) int {\n\ts := strconv.Itoa(num)\n\thi := s\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] != '9' {\n\t\t\thi = strings.ReplaceAll(s, string(s[i]), "9")\n\t\t\tbreak\n\t\t}\n\t}\n\tlo := strings.ReplaceAll(s, string(s[0]), "0")\n\ta, _ := strconv.Atoi(hi)\n\tb, _ := strconv.Atoi(lo)\n\treturn a - b\n}`,
        kotlin: `fun minMaxDifference(num: Int): Int {\n    val s = num.toString()\n    var hi = s\n    for (ch in s) {\n        if (ch != '9') {\n            hi = s.replace(ch, '9')\n            break\n        }\n    }\n    val lo = s.replace(s[0], '0')\n    return hi.toInt() - lo.toInt()\n}`,
        swift: `func minMaxDifference(_ num: Int) -> Int {\n    let s = String(num)\n    var hi = s\n    for ch in s {\n        if ch != "9" {\n            hi = s.replacingOccurrences(of: String(ch), with: "9")\n            break\n        }\n    }\n    let first = String(s.first!)\n    let lo = s.replacingOccurrences(of: first, with: "0")\n    return Int(hi)! - Int(lo)!\n}`,
        rust: `fn minMaxDifference(num: i32) -> i32 {\n    let s = num.to_string();\n    let mut hi = s.clone();\n    for ch in s.chars() {\n        if ch != '9' {\n            hi = s.replace(ch, "9");\n            break;\n        }\n    }\n    let first = s.chars().next().unwrap();\n    let lo = s.replace(first, "0");\n    hi.parse::<i32>().unwrap() - lo.parse::<i32>().unwrap()\n}`,
        php: `function minMaxDifference($num) {\n    $s = (string) $num;\n    $hi = $s;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] !== "9") {\n            $hi = str_replace($s[$i], "9", $s);\n            break;\n        }\n    }\n    $lo = str_replace($s[0], "0", $s);\n    return intval($hi) - intval($lo);\n}`,
        ruby: `def minMaxDifference(num)\n  s = num.to_s\n  hi = s\n  s.each_char do |ch|\n    if ch != "9"\n      hi = s.gsub(ch, "9")\n      break\n    end\n  end\n  lo = s.gsub(s[0], "0")\n  hi.to_i - lo.to_i\nend`,
      },
    };
  })(),

  // ── Count Collisions on a Road (LC 2211) ────────────────────────
  (() => {
    const ref = (directions: string) => {
      const n = directions.length;
      let i = 0, j = n - 1;
      while (i < n && directions[i] === "L") i++;
      while (j >= 0 && directions[j] === "R") j--;
      let count = 0;
      for (let k = i; k <= j; k++) if (directions[k] !== "S") count++;
      return count;
    };
    return {
      slug: "count-collisions-on-a-road",
      title: "Count Collisions on a Road",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Simulation", "Greedy", "Amazon", "Google", "Ola"],
      signature: { funcName: "countCollisions", params: [{ name: "directions", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Cars stand on an infinite road. `directions[i]` is `'L'`, `'R'` or `'S'` — moving left, moving right, or staying still.\n\nWhen two moving cars meet head-on, both stop and that counts as **two** collisions. When a moving car hits a stationary one, it stops and that counts as **one** collision. Return the total number of collisions.",
        [
          { in: 'directions = "RLRSLL"', out: "5", note: "Every car except the ones that escape ends up stopped." },
          { in: 'directions = "LLRR"', out: "0", note: "The left-movers drive away leftwards and the right-movers rightwards." },
          { in: 'directions = "SSRSSRLLRSLLRSRSSRLRRRRLLRRLSSRR"', out: "20" },
        ],
        ["1 <= directions.length <= 100000", "directions[i] is 'L', 'R' or 'S'"]),
      hints: [
        "A car on the far left moving left never meets anything, and likewise on the far right moving right.",
        "Strip that leading run of `'L'` and trailing run of `'R'` — those cars escape.",
        "Every *moving* car that remains eventually collides, contributing exactly one.",
      ],
      editorial: explain({
        idea: "Only the cars that can escape avoid a collision: a prefix of left-movers and a suffix of right-movers. Everything else is trapped, and each trapped moving car stops exactly once — contributing one collision apiece.",
        steps: [
          "Advance `i` past the leading `'L'` characters.",
          "Retreat `j` past the trailing `'R'` characters.",
          "Count the characters in `[i, j]` that are not `'S'`.",
        ],
        why: "Inside the trapped region there is a stationary car or an opposing car in both directions, so every moving car there must eventually stop — and the problem's scoring gives one collision per car that stops, whether it stopped against a moving or a stationary car. Cars that already stand still never move and so never collide.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Counting each head-on meeting as one collision halves the answer — it is two, one per car.",
          "Only the *leading* `'L'` run and *trailing* `'R'` run escape; an `'L'` in the middle is trapped.",
          "Stationary cars inside the region contribute nothing.",
        ],
      }),
      examples: [
        { input: '"RLRSLL"', expectedOutput: "5" },
        { input: '"LLRR"', expectedOutput: "0" },
        { input: '"SSRSSRLLRSLLRSRSSRLRRRRLLRRLSSRR"', expectedOutput: "20" },
      ],
      gen: (rng: Rng) => {
        const directions = Array.from({ length: ri(rng, 1, 40) }, () => pick(rng, ["L", "R", "S"])).join("");
        return { input: `"${directions}"`, expectedOutput: String(ref(directions)) };
      },
      solutions: {
        python: `def countCollisions(directions: str) -> int:\n    n = len(directions)\n    i, j = 0, n - 1\n    while i < n and directions[i] == "L":\n        i += 1\n    while j >= 0 and directions[j] == "R":\n        j -= 1\n    return sum(1 for k in range(i, j + 1) if directions[k] != "S")`,
        javascript: `var countCollisions = function(directions) {\n    var n = directions.length;\n    var i = 0, j = n - 1;\n    while (i < n && directions.charAt(i) === "L") i++;\n    while (j >= 0 && directions.charAt(j) === "R") j--;\n    var count = 0;\n    for (var k = i; k <= j; k++) if (directions.charAt(k) !== "S") count++;\n    return count;\n};`,
        typescript: `function countCollisions(directions: string): number {\n    var n = directions.length;\n    var i = 0, j = n - 1;\n    while (i < n && directions.charAt(i) === "L") i++;\n    while (j >= 0 && directions.charAt(j) === "R") j--;\n    var count = 0;\n    for (var k = i; k <= j; k++) if (directions.charAt(k) !== "S") count++;\n    return count;\n}`,
        java: `public static int countCollisions(String directions) {\n    int n = directions.length();\n    int i = 0, j = n - 1;\n    while (i < n && directions.charAt(i) == 'L') i++;\n    while (j >= 0 && directions.charAt(j) == 'R') j--;\n    int count = 0;\n    for (int k = i; k <= j; k++) if (directions.charAt(k) != 'S') count++;\n    return count;\n}`,
        cpp: `int countCollisions(string directions) {\n    int n = (int) directions.size();\n    int i = 0, j = n - 1;\n    while (i < n && directions[i] == 'L') i++;\n    while (j >= 0 && directions[j] == 'R') j--;\n    int count = 0;\n    for (int k = i; k <= j; k++) if (directions[k] != 'S') count++;\n    return count;\n}`,
        c: `int countCollisions(char* directions) {\n    int n = (int) strlen(directions);\n    int i = 0, j = n - 1;\n    while (i < n && directions[i] == 'L') i++;\n    while (j >= 0 && directions[j] == 'R') j--;\n    int count = 0;\n    for (int k = i; k <= j; k++) if (directions[k] != 'S') count++;\n    return count;\n}`,
        csharp: `public static int CountCollisions(string directions)\n{\n    int n = directions.Length;\n    int i = 0, j = n - 1;\n    while (i < n && directions[i] == 'L') i++;\n    while (j >= 0 && directions[j] == 'R') j--;\n    int count = 0;\n    for (int k = i; k <= j; k++) if (directions[k] != 'S') count++;\n    return count;\n}`,
        go: `func countCollisions(directions string) int {\n\tn := len(directions)\n\ti, j := 0, n-1\n\tfor i < n && directions[i] == 'L' {\n\t\ti++\n\t}\n\tfor j >= 0 && directions[j] == 'R' {\n\t\tj--\n\t}\n\tcount := 0\n\tfor k := i; k <= j; k++ {\n\t\tif directions[k] != 'S' {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countCollisions(directions: String): Int {\n    val n = directions.length\n    var i = 0\n    var j = n - 1\n    while (i < n && directions[i] == 'L') i++\n    while (j >= 0 && directions[j] == 'R') j--\n    var count = 0\n    for (k in i..j) if (directions[k] != 'S') count++\n    return count\n}`,
        swift: `func countCollisions(_ directions: String) -> Int {\n    let a = Array(directions)\n    let n = a.count\n    var i = 0\n    var j = n - 1\n    while i < n && a[i] == "L" { i += 1 }\n    while j >= 0 && a[j] == "R" { j -= 1 }\n    var count = 0\n    var k = i\n    while k <= j {\n        if a[k] != "S" { count += 1 }\n        k += 1\n    }\n    return count\n}`,
        rust: `fn countCollisions(directions: String) -> i32 {\n    let b = directions.as_bytes();\n    let n = b.len() as i32;\n    let mut i: i32 = 0;\n    let mut j: i32 = n - 1;\n    while i < n && b[i as usize] == b'L' {\n        i += 1;\n    }\n    while j >= 0 && b[j as usize] == b'R' {\n        j -= 1;\n    }\n    let mut count = 0i32;\n    let mut k = i;\n    while k <= j {\n        if b[k as usize] != b'S' {\n            count += 1;\n        }\n        k += 1;\n    }\n    count\n}`,
        php: `function countCollisions($directions) {\n    $n = strlen($directions);\n    $i = 0;\n    $j = $n - 1;\n    while ($i < $n && $directions[$i] === "L") $i++;\n    while ($j >= 0 && $directions[$j] === "R") $j--;\n    $count = 0;\n    for ($k = $i; $k <= $j; $k++) if ($directions[$k] !== "S") $count++;\n    return $count;\n}`,
        ruby: `def countCollisions(directions)\n  n = directions.length\n  i = 0\n  j = n - 1\n  i += 1 while i < n && directions[i] == "L"\n  j -= 1 while j >= 0 && directions[j] == "R"\n  count = 0\n  (i..j).each { |k| count += 1 if directions[k] != "S" }\n  count\nend`,
      },
    };
  })(),

  // ── Maximum Consecutive Floors Without Special Floors (LC 2274) ──
  (() => {
    const ref = (bottom: number, top: number, special: number[]) => {
      const s = special.slice().sort((a, b) => a - b);
      let best = s[0] - bottom;
      for (let i = 1; i < s.length; i++) {
        const gap = s[i] - s[i - 1] - 1;
        if (gap > best) best = gap;
      }
      const tail = top - s[s.length - 1];
      if (tail > best) best = tail;
      return best;
    };
    return {
      slug: "maximum-consecutive-floors-without-special-floors",
      title: "Maximum Consecutive Floors Without Special Floors",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Greedy", "Amazon", "Microsoft", "Freshworks"],
      signature: { funcName: "maxConsecutive", params: [{ name: "bottom", type: "int" as const }, { name: "top", type: "int" as const }, { name: "special", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You rent every floor from `bottom` to `top` inclusive, but the floors listed in `special` are reserved for others.\n\nReturn the maximum number of **consecutive** floors you have to yourself.",
        [
          { in: "bottom = 2, top = 9, special = [4,6]", out: "3", note: "Floors 7, 8 and 9 are all yours." },
          { in: "bottom = 6, top = 8, special = [7,6,8]", out: "0", note: "Every floor is reserved." },
          { in: "bottom = 1, top = 10, special = [5]", out: "5", note: "Floors 6 through 10." },
        ],
        ["1 <= special.length <= 100000", "1 <= bottom <= special[i] <= top <= 1000000000", "All values in special are distinct."]),
      hints: [
        "Sort the special floors; the free stretches are the gaps between consecutive ones.",
        "Do not forget the stretch before the first special floor and the one after the last.",
        "Between `special[i-1]` and `special[i]` there are `special[i] - special[i-1] - 1` free floors.",
      ],
      editorial: explain({
        idea: "Sorting turns the reserved floors into separators. The candidate free stretches are the interval before the first separator, each gap between consecutive separators, and the interval after the last.",
        steps: [
          "Sort `special`.",
          "Take `special[0] - bottom` as the leading stretch.",
          "For each adjacent pair, take `special[i] - special[i-1] - 1`.",
          "Take `top - special[last]` as the trailing stretch, and return the maximum.",
        ],
        why: "The reserved floors are guaranteed to lie inside `[bottom, top]`, so the free floors are exactly the complement, which is a union of these stretches. The `- 1` in the middle gaps excludes both endpoints, while the leading and trailing expressions exclude only one endpoint each — hence their different shape.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Forgetting the edge stretches loses the answer in cases like `special = [5]`.",
          "The middle gap needs the `- 1`; the edge stretches do not.",
          "The answer can be 0 when every floor is reserved.",
        ],
      }),
      examples: [
        { input: "2\n9\n[4,6]", expectedOutput: "3" },
        { input: "6\n8\n[7,6,8]", expectedOutput: "0" },
        { input: "1\n10\n[5]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const bottom = ri(rng, 1, 1000);
        const top = bottom + ri(rng, 0, 60);
        const seen: Record<number, boolean> = {};
        const special: number[] = [];
        const want = ri(rng, 1, Math.min(12, top - bottom + 1));
        let guard = 0;
        while (special.length < want && guard < 300) {
          guard++;
          const v = ri(rng, bottom, top);
          if (!seen[v]) { seen[v] = true; special.push(v); }
        }
        return { input: `${bottom}\n${top}\n${fmtIntArr(special)}`, expectedOutput: String(ref(bottom, top, special)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxConsecutive(bottom: int, top: int, special: List[int]) -> int:\n    s = sorted(special)\n    best = s[0] - bottom\n    for i in range(1, len(s)):\n        best = max(best, s[i] - s[i - 1] - 1)\n    return max(best, top - s[-1])`,
        javascript: `var maxConsecutive = function(bottom, top, special) {\n    var s = special.slice().sort(function(a, b) { return a - b; });\n    var best = s[0] - bottom;\n    for (var i = 1; i < s.length; i++) {\n        var gap = s[i] - s[i - 1] - 1;\n        if (gap > best) best = gap;\n    }\n    var tail = top - s[s.length - 1];\n    if (tail > best) best = tail;\n    return best;\n};`,
        typescript: `function maxConsecutive(bottom: number, top: number, special: number[]): number {\n    var s = special.slice().sort(function(a, b) { return a - b; });\n    var best = s[0] - bottom;\n    for (var i = 1; i < s.length; i++) {\n        var gap = s[i] - s[i - 1] - 1;\n        if (gap > best) best = gap;\n    }\n    var tail = top - s[s.length - 1];\n    if (tail > best) best = tail;\n    return best;\n}`,
        java: `public static int maxConsecutive(int bottom, int top, int[] special) {\n    int[] s = special.clone();\n    Arrays.sort(s);\n    int best = s[0] - bottom;\n    for (int i = 1; i < s.length; i++) {\n        best = Math.max(best, s[i] - s[i - 1] - 1);\n    }\n    return Math.max(best, top - s[s.length - 1]);\n}`,
        cpp: `int maxConsecutive(int bottom, int top, vector<int>& special) {\n    vector<int> s = special;\n    sort(s.begin(), s.end());\n    int best = s[0] - bottom;\n    for (int i = 1; i < (int) s.size(); i++) {\n        best = max(best, s[i] - s[i - 1] - 1);\n    }\n    return max(best, top - s.back());\n}`,
        c: `static int cmpFloorAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint maxConsecutive(int bottom, int top, int* special, int specialSize) {\n    int* s = (int*) malloc((size_t) specialSize * sizeof(int));\n    for (int i = 0; i < specialSize; i++) s[i] = special[i];\n    qsort(s, (size_t) specialSize, sizeof(int), cmpFloorAsc);\n    int best = s[0] - bottom;\n    for (int i = 1; i < specialSize; i++) {\n        int gap = s[i] - s[i - 1] - 1;\n        if (gap > best) best = gap;\n    }\n    int tail = top - s[specialSize - 1];\n    if (tail > best) best = tail;\n    free(s);\n    return best;\n}`,
        csharp: `public static int MaxConsecutive(int bottom, int top, int[] special)\n{\n    int[] s = (int[]) special.Clone();\n    Array.Sort(s);\n    int best = s[0] - bottom;\n    for (int i = 1; i < s.Length; i++)\n    {\n        int gap = s[i] - s[i - 1] - 1;\n        if (gap > best) best = gap;\n    }\n    int tail = top - s[s.Length - 1];\n    return Math.Max(best, tail);\n}`,
        go: `func maxConsecutive(bottom int, top int, special []int) int {\n\ts := append([]int{}, special...)\n\tsort.Ints(s)\n\tbest := s[0] - bottom\n\tfor i := 1; i < len(s); i++ {\n\t\tgap := s[i] - s[i-1] - 1\n\t\tif gap > best {\n\t\t\tbest = gap\n\t\t}\n\t}\n\ttail := top - s[len(s)-1]\n\tif tail > best {\n\t\tbest = tail\n\t}\n\treturn best\n}`,
        kotlin: `fun maxConsecutive(bottom: Int, top: Int, special: IntArray): Int {\n    val s = special.sortedArray()\n    var best = s[0] - bottom\n    for (i in 1 until s.size) {\n        best = maxOf(best, s[i] - s[i - 1] - 1)\n    }\n    return maxOf(best, top - s[s.size - 1])\n}`,
        swift: `func maxConsecutive(_ bottom: Int, _ top: Int, _ special: [Int]) -> Int {\n    let s = special.sorted()\n    var best = s[0] - bottom\n    for i in 1..<max(s.count, 1) where s.count > 1 {\n        best = max(best, s[i] - s[i - 1] - 1)\n    }\n    return max(best, top - s[s.count - 1])\n}`,
        rust: `fn maxConsecutive(bottom: i32, top: i32, special: Vec<i32>) -> i32 {\n    let mut s = special.clone();\n    s.sort();\n    let mut best = s[0] - bottom;\n    for i in 1..s.len() {\n        let gap = s[i] - s[i - 1] - 1;\n        if gap > best {\n            best = gap;\n        }\n    }\n    let tail = top - s[s.len() - 1];\n    best.max(tail)\n}`,
        php: `function maxConsecutive($bottom, $top, $special) {\n    $s = $special;\n    sort($s);\n    $best = $s[0] - $bottom;\n    for ($i = 1; $i < count($s); $i++) {\n        $gap = $s[$i] - $s[$i - 1] - 1;\n        if ($gap > $best) $best = $gap;\n    }\n    $tail = $top - $s[count($s) - 1];\n    return max($best, $tail);\n}`,
        ruby: `def maxConsecutive(bottom, top, special)\n  s = special.sort\n  best = s[0] - bottom\n  (1...s.length).each do |i|\n    gap = s[i] - s[i - 1] - 1\n    best = gap if gap > best\n  end\n  [best, top - s[-1]].max\nend`,
      },
    };
  })(),

  // ── Find Three Consecutive Integers That Sum to a Given Number (LC 2177) ──
  (() => {
    const ref = (num: number) => {
      if (num % 3 !== 0) return [];
      const m = num / 3;
      return [m - 1, m, m + 1];
    };
    return {
      slug: "find-three-consecutive-integers-that-sum-to-a-given-number",
      title: "Find Three Consecutive Integers That Sum to a Given Number",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Simulation", "Amazon", "Adobe", "Infosys"],
      signature: { funcName: "sumOfThree", params: [{ name: "num", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Return three **consecutive** integers that sum to `num`, in increasing order. If no such triple exists, return an empty array.",
        [
          { in: "num = 33", out: "[10,11,12]", note: "10 + 11 + 12 = 33." },
          { in: "num = 4", out: "[]", note: "4 is not divisible by 3." },
          { in: "num = 0", out: "[-1,0,1]" },
        ],
        ["0 <= num <= 1000000000"]),
      hints: [
        "Write the three numbers as `m - 1`, `m` and `m + 1`.",
        "Their sum is exactly `3m`, so `num` must be divisible by 3.",
        "When it is, `m = num / 3` and the triple follows.",
      ],
      editorial: explain({
        idea: "Centre the triple on its middle value. Three consecutive integers around `m` sum to `3m`, which makes divisibility by 3 both necessary and sufficient.",
        steps: [
          "If `num % 3 != 0`, return an empty array.",
          "Otherwise set `m = num / 3` and return `[m - 1, m, m + 1]`.",
        ],
        why: "`(m-1) + m + (m+1) = 3m` collapses the whole search to one division. Since `m` is determined uniquely, the triple is unique too — there is no choice to make and nothing to search.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Searching for the triple by iteration is unnecessary and slow at `num = 10^9`.",
          "The middle value is `num / 3`, not `num / 3 - 1` or the first element.",
          "`num = 0` is legal and yields `[-1,0,1]`.",
        ],
      }),
      examples: [
        { input: "33", expectedOutput: "[10,11,12]" },
        { input: "4", expectedOutput: "[]" },
        { input: "0", expectedOutput: "[-1,0,1]" },
      ],
      gen: (rng: Rng) => {
        const num = rng() < 0.5 ? 3 * ri(rng, 0, 100000) : ri(rng, 0, 1000000000);
        return { input: String(num), expectedOutput: fmtIntArr(ref(num)) };
      },
      solutions: {
        python: `from typing import List\n\ndef sumOfThree(num: int) -> List[int]:\n    if num % 3 != 0:\n        return []\n    m = num // 3\n    return [m - 1, m, m + 1]`,
        javascript: `var sumOfThree = function(num) {\n    if (num % 3 !== 0) return [];\n    var m = num / 3;\n    return [m - 1, m, m + 1];\n};`,
        typescript: `function sumOfThree(num: number): number[] {\n    if (num % 3 !== 0) return [];\n    var m = num / 3;\n    return [m - 1, m, m + 1];\n}`,
        java: `public static int[] sumOfThree(int num) {\n    if (num % 3 != 0) return new int[0];\n    int m = num / 3;\n    return new int[] { m - 1, m, m + 1 };\n}`,
        cpp: `vector<int> sumOfThree(int num) {\n    if (num % 3 != 0) return vector<int>();\n    int m = num / 3;\n    return vector<int>{ m - 1, m, m + 1 };\n}`,
        c: `int* sumOfThree(int num, int* returnSize) {\n    if (num % 3 != 0) {\n        *returnSize = 0;\n        return (int*) malloc(1);\n    }\n    int m = num / 3;\n    int* out = (int*) malloc(3 * sizeof(int));\n    out[0] = m - 1;\n    out[1] = m;\n    out[2] = m + 1;\n    *returnSize = 3;\n    return out;\n}`,
        csharp: `public static int[] SumOfThree(int num)\n{\n    if (num % 3 != 0) return new int[0];\n    int m = num / 3;\n    return new int[] { m - 1, m, m + 1 };\n}`,
        go: `func sumOfThree(num int) []int {\n\tif num%3 != 0 {\n\t\treturn []int{}\n\t}\n\tm := num / 3\n\treturn []int{m - 1, m, m + 1}\n}`,
        kotlin: `fun sumOfThree(num: Int): IntArray {\n    if (num % 3 != 0) return IntArray(0)\n    val m = num / 3\n    return intArrayOf(m - 1, m, m + 1)\n}`,
        swift: `func sumOfThree(_ num: Int) -> [Int] {\n    if num % 3 != 0 { return [] }\n    let m = num / 3\n    return [m - 1, m, m + 1]\n}`,
        rust: `fn sumOfThree(num: i32) -> Vec<i32> {\n    if num % 3 != 0 {\n        return vec![];\n    }\n    let m = num / 3;\n    vec![m - 1, m, m + 1]\n}`,
        php: `function sumOfThree($num) {\n    if ($num % 3 !== 0) return [];\n    $m = intdiv($num, 3);\n    return [$m - 1, $m, $m + 1];\n}`,
        ruby: `def sumOfThree(num)\n  return [] if num % 3 != 0\n  m = num / 3\n  [m - 1, m, m + 1]\nend`,
      },
    };
  })(),

  // ── Maximum Split of Positive Even Integers (LC 2178) ───────────
  (() => {
    const ref = (finalSum: number) => {
      if (finalSum % 2 !== 0) return [];
      const out: number[] = [];
      let rem = finalSum, i = 2;
      while (i <= rem) { out.push(i); rem -= i; i += 2; }
      out[out.length - 1] += rem;
      return out;
    };
    return {
      slug: "maximum-split-of-positive-even-integers",
      title: "Maximum Split of Positive Even Integers",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Greedy", "Amazon", "Google", "Zoho"],
      signature: { funcName: "maximumEvenSplit", params: [{ name: "finalSum", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Split `finalSum` into the **maximum number of unique positive even** integers that add up to it, and return them in **increasing order**.\n\nIf no such split exists, return an empty array.",
        [
          { in: "finalSum = 12", out: "[2,4,6]", note: "Three distinct even numbers; no split into four exists." },
          { in: "finalSum = 7", out: "[]", note: "An odd total can never be a sum of even numbers." },
          { in: "finalSum = 28", out: "[2,4,6,16]", note: "The greedy takes 2, 4, 6 and 8 and then folds the leftover 8 into the last term." },
        ],
        ["1 <= finalSum <= 1000000000"]),
      hints: [
        "An odd `finalSum` is impossible — any sum of even numbers is even.",
        "To maximise the count, take the smallest unused even numbers: 2, 4, 6, …",
        "When the next number no longer fits, add whatever is left to the largest term already taken.",
      ],
      editorial: explain({
        idea: "Take the smallest even numbers in order for as long as they fit; the leftover is then folded into the last term, which keeps the values distinct and the count maximal.",
        steps: [
          "Return empty for an odd `finalSum`.",
          "Take `2, 4, 6, …` while the next value is at most the remaining total.",
          "Add the remaining total to the last value taken.",
        ],
        why: "Greedily taking the smallest available even numbers maximises how many fit — using any larger value instead would consume budget that could have supported more terms. The leftover after stopping is even and strictly smaller than the next unused value, so adding it to the last term keeps that term the largest and still distinct from all the others.",
        time: "O(sqrt(finalSum))",
        space: "O(sqrt(finalSum))",
        pitfalls: [
          "Appending the leftover as a *new* term can duplicate a value already taken.",
          "The odd case must be handled before the loop.",
          "The greedy takes `2 · k` terms up to roughly `sqrt(finalSum)`, so the output stays small.",
        ],
      }),
      examples: [
        { input: "12", expectedOutput: "[2,4,6]" },
        { input: "7", expectedOutput: "[]" },
        { input: "28", expectedOutput: "[2,4,6,16]" },
      ],
      gen: (rng: Rng) => {
        const finalSum = rng() < 0.6 ? 2 * ri(rng, 1, 5000) : ri(rng, 1, 1000000000);
        return { input: String(finalSum), expectedOutput: fmtIntArr(ref(finalSum)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumEvenSplit(finalSum: int) -> List[int]:\n    if finalSum % 2 != 0:\n        return []\n    out = []\n    rem, i = finalSum, 2\n    while i <= rem:\n        out.append(i)\n        rem -= i\n        i += 2\n    out[-1] += rem\n    return out`,
        javascript: `var maximumEvenSplit = function(finalSum) {\n    if (finalSum % 2 !== 0) return [];\n    var out = [];\n    var rem = finalSum, i = 2;\n    while (i <= rem) { out.push(i); rem -= i; i += 2; }\n    out[out.length - 1] += rem;\n    return out;\n};`,
        typescript: `function maximumEvenSplit(finalSum: number): number[] {\n    if (finalSum % 2 !== 0) return [];\n    var out: number[] = [];\n    var rem = finalSum, i = 2;\n    while (i <= rem) { out.push(i); rem -= i; i += 2; }\n    out[out.length - 1] += rem;\n    return out;\n}`,
        java: `public static int[] maximumEvenSplit(int finalSum) {\n    if (finalSum % 2 != 0) return new int[0];\n    List<Integer> out = new ArrayList<>();\n    int rem = finalSum, i = 2;\n    while (i <= rem) {\n        out.add(i);\n        rem -= i;\n        i += 2;\n    }\n    out.set(out.size() - 1, out.get(out.size() - 1) + rem);\n    int[] res = new int[out.size()];\n    for (int k = 0; k < out.size(); k++) res[k] = out.get(k);\n    return res;\n}`,
        cpp: `vector<int> maximumEvenSplit(int finalSum) {\n    if (finalSum % 2 != 0) return vector<int>();\n    vector<int> out;\n    int rem = finalSum, i = 2;\n    while (i <= rem) {\n        out.push_back(i);\n        rem -= i;\n        i += 2;\n    }\n    out.back() += rem;\n    return out;\n}`,
        c: `int* maximumEvenSplit(int finalSum, int* returnSize) {\n    if (finalSum % 2 != 0) {\n        *returnSize = 0;\n        return (int*) malloc(1);\n    }\n    int cap = 70000;\n    int* out = (int*) malloc((size_t) cap * sizeof(int));\n    int m = 0, rem = finalSum, i = 2;\n    while (i <= rem) {\n        out[m++] = i;\n        rem -= i;\n        i += 2;\n    }\n    out[m - 1] += rem;\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[] MaximumEvenSplit(int finalSum)\n{\n    if (finalSum % 2 != 0) return new int[0];\n    var out_ = new List<int>();\n    int rem = finalSum, i = 2;\n    while (i <= rem)\n    {\n        out_.Add(i);\n        rem -= i;\n        i += 2;\n    }\n    out_[out_.Count - 1] += rem;\n    return out_.ToArray();\n}`,
        go: `func maximumEvenSplit(finalSum int) []int {\n\tif finalSum%2 != 0 {\n\t\treturn []int{}\n\t}\n\tout := []int{}\n\trem, i := finalSum, 2\n\tfor i <= rem {\n\t\tout = append(out, i)\n\t\trem -= i\n\t\ti += 2\n\t}\n\tout[len(out)-1] += rem\n\treturn out\n}`,
        kotlin: `fun maximumEvenSplit(finalSum: Int): IntArray {\n    if (finalSum % 2 != 0) return IntArray(0)\n    val out = ArrayList<Int>()\n    var rem = finalSum\n    var i = 2\n    while (i <= rem) {\n        out.add(i)\n        rem -= i\n        i += 2\n    }\n    out[out.size - 1] = out[out.size - 1] + rem\n    return out.toIntArray()\n}`,
        swift: `func maximumEvenSplit(_ finalSum: Int) -> [Int] {\n    if finalSum % 2 != 0 { return [] }\n    var out = [Int]()\n    var rem = finalSum\n    var i = 2\n    while i <= rem {\n        out.append(i)\n        rem -= i\n        i += 2\n    }\n    out[out.count - 1] += rem\n    return out\n}`,
        rust: `fn maximumEvenSplit(finalSum: i32) -> Vec<i32> {\n    if finalSum % 2 != 0 {\n        return vec![];\n    }\n    let mut out: Vec<i32> = Vec::new();\n    let mut rem = finalSum;\n    let mut i = 2i32;\n    while i <= rem {\n        out.push(i);\n        rem -= i;\n        i += 2;\n    }\n    let last = out.len() - 1;\n    out[last] += rem;\n    out\n}`,
        php: `function maximumEvenSplit($finalSum) {\n    if ($finalSum % 2 !== 0) return [];\n    $out = [];\n    $rem = $finalSum;\n    $i = 2;\n    while ($i <= $rem) {\n        $out[] = $i;\n        $rem -= $i;\n        $i += 2;\n    }\n    $out[count($out) - 1] += $rem;\n    return $out;\n}`,
        ruby: `def maximumEvenSplit(finalSum)\n  return [] if finalSum.odd?\n  out = []\n  rem = finalSum\n  i = 2\n  while i <= rem\n    out << i\n    rem -= i\n    i += 2\n  end\n  out[-1] += rem\n  out\nend`,
      },
    };
  })(),

  // ── Find the Maximum Number of Marked Indices (LC 2576) ─────────
  (() => {
    const ref = (nums: number[]) => {
      const a = nums.slice().sort((x, y) => x - y);
      const n = a.length;
      let i = 0, count = 0;
      for (let j = Math.floor(n / 2); j < n; j++) {
        if (2 * a[i] <= a[j]) { i++; count++; }
      }
      return 2 * count;
    };
    return {
      slug: "find-the-maximum-number-of-marked-indices",
      title: "Find the Maximum Number of Marked Indices",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Greedy", "Sorting", "Amazon", "Google", "Swiggy"],
      signature: { funcName: "maxNumOfMarkedIndices", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Repeatedly pick two **unmarked** indices `i` and `j` with `2 · nums[i] <= nums[j]` and mark both.\n\nReturn the maximum number of indices that can end up marked.",
        [
          { in: "nums = [3,5,2,4]", out: "2", note: "Mark 2 and 4 (2 · 2 <= 4); nothing else pairs up." },
          { in: "nums = [9,2,5,4]", out: "4", note: "Pair 2 with 5 and 4 with 9." },
          { in: "nums = [7,6,8]", out: "0", note: "No pair satisfies the doubling condition." },
        ],
        ["1 <= nums.length <= 100000", "1 <= nums[i] <= 1000000000"]),
      hints: [
        "Sort the array; then the smaller of each pair should come from the small half and the larger from the big half.",
        "Match the smallest unused value from the first half against the first big-half value that is at least twice it.",
        "Sweep the second half with one pointer over the first half.",
      ],
      editorial: explain({
        idea: "After sorting, an optimal pairing always takes the `k` smallest values as the 'small' side and the `k` largest as the 'large' side. Sweeping the upper half while advancing a pointer through the lower half matches as many as possible.",
        steps: [
          "Sort `nums`.",
          "Set `i = 0` and sweep `j` from `n / 2` to `n - 1`.",
          "Whenever `2 · a[i] <= a[j]`, pair them: advance `i` and count the pair.",
          "Return twice the pair count.",
        ],
        why: "If `k` pairs are possible, they can be rearranged so that the small sides are `a[0 … k-1]` and the large sides `a[n-k … n-1]` — swapping any pair back into that shape never breaks the condition, because the small sides only get smaller and the large sides only get larger. Starting `j` at `n / 2` is exactly the earliest index that could belong to a maximum-size large half, and the greedy match from there is optimal by the usual exchange argument.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Matching from index 0 against index 1 upwards pairs values that should have been saved for better partners.",
          "The answer counts *indices*, so it is twice the number of pairs.",
          "Starting `j` at `n / 2` matters — starting at 0 lets a value pair with itself's half of the array.",
        ],
      }),
      examples: [
        { input: "[3,5,2,4]", expectedOutput: "2" },
        { input: "[9,2,5,4]", expectedOutput: "4" },
        { input: "[7,6,8]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 20 : 1000000000;
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxNumOfMarkedIndices(nums: List[int]) -> int:\n    a = sorted(nums)\n    n = len(a)\n    i = count = 0\n    for j in range(n // 2, n):\n        if 2 * a[i] <= a[j]:\n            i += 1\n            count += 1\n    return 2 * count`,
        javascript: `var maxNumOfMarkedIndices = function(nums) {\n    var a = nums.slice().sort(function(x, y) { return x - y; });\n    var n = a.length;\n    var i = 0, count = 0;\n    for (var j = Math.floor(n / 2); j < n; j++) {\n        if (2 * a[i] <= a[j]) { i++; count++; }\n    }\n    return 2 * count;\n};`,
        typescript: `function maxNumOfMarkedIndices(nums: number[]): number {\n    var a = nums.slice().sort(function(x, y) { return x - y; });\n    var n = a.length;\n    var i = 0, count = 0;\n    for (var j = Math.floor(n / 2); j < n; j++) {\n        if (2 * a[i] <= a[j]) { i++; count++; }\n    }\n    return 2 * count;\n}`,
        java: `public static int maxNumOfMarkedIndices(int[] nums) {\n    int[] a = nums.clone();\n    Arrays.sort(a);\n    int n = a.length, i = 0, count = 0;\n    for (int j = n / 2; j < n; j++) {\n        if (2L * a[i] <= a[j]) {\n            i++;\n            count++;\n        }\n    }\n    return 2 * count;\n}`,
        cpp: `int maxNumOfMarkedIndices(vector<int>& nums) {\n    vector<int> a = nums;\n    sort(a.begin(), a.end());\n    int n = (int) a.size(), i = 0, count = 0;\n    for (int j = n / 2; j < n; j++) {\n        if (2LL * a[i] <= a[j]) {\n            i++;\n            count++;\n        }\n    }\n    return 2 * count;\n}`,
        c: `static int cmpMarkAsc(const void* x, const void* y) {\n    int p = *(const int*) x;\n    int q = *(const int*) y;\n    return (p > q) - (p < q);\n}\n\nint maxNumOfMarkedIndices(int* nums, int numsSize) {\n    int* a = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    qsort(a, (size_t) numsSize, sizeof(int), cmpMarkAsc);\n    int i = 0, count = 0;\n    for (int j = numsSize / 2; j < numsSize; j++) {\n        if (2LL * a[i] <= (long long) a[j]) {\n            i++;\n            count++;\n        }\n    }\n    free(a);\n    return 2 * count;\n}`,
        csharp: `public static int MaxNumOfMarkedIndices(int[] nums)\n{\n    int[] a = (int[]) nums.Clone();\n    Array.Sort(a);\n    int n = a.Length, i = 0, count = 0;\n    for (int j = n / 2; j < n; j++)\n    {\n        if (2L * a[i] <= a[j])\n        {\n            i++;\n            count++;\n        }\n    }\n    return 2 * count;\n}`,
        go: `func maxNumOfMarkedIndices(nums []int) int {\n\ta := append([]int{}, nums...)\n\tsort.Ints(a)\n\tn := len(a)\n\ti, count := 0, 0\n\tfor j := n / 2; j < n; j++ {\n\t\tif 2*a[i] <= a[j] {\n\t\t\ti++\n\t\t\tcount++\n\t\t}\n\t}\n\treturn 2 * count\n}`,
        kotlin: `fun maxNumOfMarkedIndices(nums: IntArray): Int {\n    val a = nums.sortedArray()\n    val n = a.size\n    var i = 0\n    var count = 0\n    for (j in n / 2 until n) {\n        if (2L * a[i] <= a[j]) {\n            i++\n            count++\n        }\n    }\n    return 2 * count\n}`,
        swift: `func maxNumOfMarkedIndices(_ nums: [Int]) -> Int {\n    let a = nums.sorted()\n    let n = a.count\n    var i = 0\n    var count = 0\n    for j in (n / 2)..<n {\n        if 2 * a[i] <= a[j] {\n            i += 1\n            count += 1\n        }\n    }\n    return 2 * count\n}`,
        rust: `fn maxNumOfMarkedIndices(nums: Vec<i32>) -> i32 {\n    let mut a = nums.clone();\n    a.sort();\n    let n = a.len();\n    let mut i = 0usize;\n    let mut count = 0i32;\n    for j in (n / 2)..n {\n        if 2i64 * a[i] as i64 <= a[j] as i64 {\n            i += 1;\n            count += 1;\n        }\n    }\n    2 * count\n}`,
        php: `function maxNumOfMarkedIndices($nums) {\n    $a = $nums;\n    sort($a);\n    $n = count($a);\n    $i = 0;\n    $count = 0;\n    for ($j = intdiv($n, 2); $j < $n; $j++) {\n        if (2 * $a[$i] <= $a[$j]) {\n            $i++;\n            $count++;\n        }\n    }\n    return 2 * $count;\n}`,
        ruby: `def maxNumOfMarkedIndices(nums)\n  a = nums.sort\n  n = a.length\n  i = 0\n  count = 0\n  (n / 2...n).each do |j|\n    if 2 * a[i] <= a[j]\n      i += 1\n      count += 1\n    end\n  end\n  2 * count\nend`,
      },
    };
  })(),

  // ── Separate Black and White Balls (LC 2938) ────────────────────
  (() => {
    const ref = (s: string) => {
      let ones = 0, swaps = 0;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "1") ones++; else swaps += ones;
      }
      return swaps;
    };
    return {
      slug: "separate-black-and-white-balls",
      title: "Separate Black and White Balls",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Two Pointers", "Amazon", "Google", "Razorpay"],
      signature: { funcName: "minimumSteps", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Balls stand in a row: `'0'` is white and `'1'` is black. One step swaps two **adjacent** balls.\n\nReturn the minimum number of steps needed to group all the white balls to the left and all the black balls to the right.",
        [
          { in: 's = "101"', out: "1", note: 'Swap the first two to get "011".' },
          { in: 's = "100"', out: "2", note: 'The single black ball has to travel past both whites.' },
          { in: 's = "0111"', out: "0", note: "Already separated." },
        ],
        ["1 <= s.length <= 60000", "s[i] is '0' or '1'"]),
      hints: [
        "Every white ball must end up left of every black ball, and adjacent swaps preserve the relative order within each colour.",
        "So a white ball's cost is the number of black balls currently to its left.",
        "Sweep once, keeping a running count of black balls seen.",
      ],
      editorial: explain({
        idea: "Adjacent swaps can only exchange one white with one black, and each such exchange fixes exactly one out-of-order pair. So the answer is the number of (black, white) pairs that appear in the wrong order.",
        steps: [
          "Sweep left to right keeping `ones`, the number of `'1'`s seen so far.",
          "On each `'0'`, add `ones` to the total.",
          "Return the total.",
        ],
        why: "The final arrangement is forced — all whites then all blacks — and relative order within a colour never matters since the balls of a colour are interchangeable. Each adjacent swap of a black with a white removes exactly one inversion, and no swap removes more, so the inversion count is both a lower bound and achievable.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Counting whites to the right of each black gives the same number but is easier to get off by one.",
          "The total reaches about `n²/4 ≈ 9 · 10^8` at the stated size — close to the `int` ceiling.",
          "Simulating the swaps is `O(n²)` and unnecessary.",
        ],
      }),
      examples: [
        { input: '"101"', expectedOutput: "1" },
        { input: '"100"', expectedOutput: "2" },
        { input: '"0111"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const s = Array.from({ length: ri(rng, 1, 45) }, () => (rng() < 0.5 ? "1" : "0")).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minimumSteps(s: str) -> int:\n    ones = swaps = 0\n    for ch in s:\n        if ch == "1":\n            ones += 1\n        else:\n            swaps += ones\n    return swaps`,
        javascript: `var minimumSteps = function(s) {\n    var ones = 0, swaps = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "1") ones++; else swaps += ones;\n    }\n    return swaps;\n};`,
        typescript: `function minimumSteps(s: string): number {\n    var ones = 0, swaps = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "1") ones++; else swaps += ones;\n    }\n    return swaps;\n}`,
        java: `public static int minimumSteps(String s) {\n    long ones = 0, swaps = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == '1') ones++; else swaps += ones;\n    }\n    return (int) swaps;\n}`,
        cpp: `int minimumSteps(string s) {\n    long long ones = 0, swaps = 0;\n    for (char ch : s) {\n        if (ch == '1') ones++; else swaps += ones;\n    }\n    return (int) swaps;\n}`,
        c: `int minimumSteps(char* s) {\n    long long ones = 0, swaps = 0;\n    for (int i = 0; s[i]; i++) {\n        if (s[i] == '1') ones++; else swaps += ones;\n    }\n    return (int) swaps;\n}`,
        csharp: `public static int MinimumSteps(string s)\n{\n    long ones = 0, swaps = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (s[i] == '1') ones++; else swaps += ones;\n    }\n    return (int) swaps;\n}`,
        go: `func minimumSteps(s string) int {\n\tones, swaps := 0, 0\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] == '1' {\n\t\t\tones++\n\t\t} else {\n\t\t\tswaps += ones\n\t\t}\n\t}\n\treturn swaps\n}`,
        kotlin: `fun minimumSteps(s: String): Int {\n    var ones = 0L\n    var swaps = 0L\n    for (ch in s) {\n        if (ch == '1') ones++ else swaps += ones\n    }\n    return swaps.toInt()\n}`,
        swift: `func minimumSteps(_ s: String) -> Int {\n    var ones = 0\n    var swaps = 0\n    for ch in s {\n        if ch == "1" { ones += 1 } else { swaps += ones }\n    }\n    return swaps\n}`,
        rust: `fn minimumSteps(s: String) -> i32 {\n    let mut ones: i64 = 0;\n    let mut swaps: i64 = 0;\n    for b in s.as_bytes().iter() {\n        if *b == b'1' {\n            ones += 1;\n        } else {\n            swaps += ones;\n        }\n    }\n    swaps as i32\n}`,
        php: `function minimumSteps($s) {\n    $ones = 0;\n    $swaps = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] === "1") $ones++; else $swaps += $ones;\n    }\n    return $swaps;\n}`,
        ruby: `def minimumSteps(s)\n  ones = 0\n  swaps = 0\n  s.each_char do |ch|\n    if ch == "1"\n      ones += 1\n    else\n      swaps += ones\n    end\n  end\n  swaps\nend`,
      },
    };
  })(),

  // ── Smallest Missing Non-negative Integer After Operations (LC 2598) ──
  (() => {
    const ref = (nums: number[], value: number) => {
      const cnt = new Array(value).fill(0);
      for (let i = 0; i < nums.length; i++) cnt[((nums[i] % value) + value) % value]++;
      for (let i = 0; ; i++) {
        const r = i % value;
        if (cnt[r] === 0) return i;
        cnt[r]--;
      }
    };
    return {
      slug: "smallest-missing-non-negative-integer-after-operations",
      title: "Smallest Missing Non-negative Integer After Operations",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Math", "Greedy", "Counting", "Amazon", "Google", "Atlassian"],
      signature: { funcName: "findSmallestInteger", params: [{ name: "nums", type: "int[]" as const }, { name: "value", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You may repeatedly pick any index and add or subtract `value` from `nums[i]`, as many times as you like.\n\nThe **MEX** of an array is the smallest non-negative integer missing from it. Return the maximum MEX achievable.",
        [
          { in: "nums = [1,-10,7,13,6,8], value = 5", out: "4", note: "The residues mod 5 cover 0, 1, 2 and 3, but nothing can become 4." },
          { in: "nums = [1,-10,7,13,6,8], value = 7", out: "2", note: "No element has residue 2 mod 7." },
          { in: "nums = [3,0,3,2,4,2,1,1,0,4], value = 5", out: "10" },
        ],
        ["1 <= nums.length, value <= 100000", "-1000000000 <= nums[i] <= 1000000000"]),
      hints: [
        "Adding or subtracting `value` never changes an element's residue modulo `value`.",
        "So an element can become exactly the non-negative integers sharing its residue: `r, r + value, r + 2·value, …`",
        "Count how many elements sit in each residue class, then walk `0, 1, 2, …` spending one from the matching class each time.",
      ],
      editorial: explain({
        idea: "The operation preserves residues modulo `value`, so each element can cover any non-negative integer in its own residue class. Counting the class sizes reduces the problem to walking upwards and spending one element per integer.",
        steps: [
          "Tally `cnt[r]`, the number of elements with residue `r` (normalised to be non-negative).",
          "Walk `i = 0, 1, 2, …`; the integer `i` needs an element of residue `i % value`.",
          "The first `i` whose class is exhausted is the answer.",
        ],
        why: "Because residues are invariant, an element can be turned into `i` precisely when `i % value` matches its residue, and it can serve only one integer. Filling `0, 1, 2, …` in order is optimal: an element of class `r` should go to the smallest unfilled integer of that class, and any other assignment leaves a smaller gap unfilled.",
        time: "O(n + answer)",
        space: "O(value)",
        pitfalls: [
          "In most languages `-10 % 5` is `0` but `-10 % 7` is `-3` — the residue needs normalising with `((x % v) + v) % v`.",
          "The walk is bounded by `n + 1`, so it always terminates.",
          "Sorting or searching the values is unnecessary; only the residue counts matter.",
        ],
      }),
      examples: [
        { input: "[1,-10,7,13,6,8]\n5", expectedOutput: "4" },
        { input: "[1,-10,7,13,6,8]\n7", expectedOutput: "2" },
        { input: "[3,0,3,2,4,2,1,1,0,4]\n5", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const value = ri(rng, 1, 12);
        const hi = rng() < 0.6 ? 30 : 1000000000;
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, -hi, hi));
        return { input: `${fmtIntArr(nums)}\n${value}`, expectedOutput: String(ref(nums, value)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findSmallestInteger(nums: List[int], value: int) -> int:\n    cnt = [0] * value\n    for x in nums:\n        cnt[x % value] += 1\n    i = 0\n    while True:\n        r = i % value\n        if cnt[r] == 0:\n            return i\n        cnt[r] -= 1\n        i += 1`,
        javascript: `var findSmallestInteger = function(nums, value) {\n    var cnt = [];\n    for (var t = 0; t < value; t++) cnt.push(0);\n    for (var j = 0; j < nums.length; j++) cnt[((nums[j] % value) + value) % value]++;\n    for (var i = 0; ; i++) {\n        var r = i % value;\n        if (cnt[r] === 0) return i;\n        cnt[r]--;\n    }\n};`,
        typescript: `function findSmallestInteger(nums: number[], value: number): number {\n    var cnt: number[] = [];\n    for (var t = 0; t < value; t++) cnt.push(0);\n    for (var j = 0; j < nums.length; j++) cnt[((nums[j] % value) + value) % value]++;\n    for (var i = 0; ; i++) {\n        var r = i % value;\n        if (cnt[r] === 0) return i;\n        cnt[r]--;\n    }\n}`,
        java: `public static int findSmallestInteger(int[] nums, int value) {\n    int[] cnt = new int[value];\n    for (int x : nums) cnt[((x % value) + value) % value]++;\n    for (int i = 0; ; i++) {\n        int r = i % value;\n        if (cnt[r] == 0) return i;\n        cnt[r]--;\n    }\n}`,
        cpp: `int findSmallestInteger(vector<int>& nums, int value) {\n    vector<int> cnt(value, 0);\n    for (int x : nums) cnt[((x % value) + value) % value]++;\n    for (int i = 0; ; i++) {\n        int r = i % value;\n        if (cnt[r] == 0) return i;\n        cnt[r]--;\n    }\n}`,
        c: `int findSmallestInteger(int* nums, int numsSize, int value) {\n    int* cnt = (int*) calloc((size_t) value, sizeof(int));\n    for (int i = 0; i < numsSize; i++) cnt[((nums[i] % value) + value) % value]++;\n    int ans = 0;\n    for (int i = 0; ; i++) {\n        int r = i % value;\n        if (cnt[r] == 0) {\n            ans = i;\n            break;\n        }\n        cnt[r]--;\n    }\n    free(cnt);\n    return ans;\n}`,
        csharp: `public static int FindSmallestInteger(int[] nums, int value)\n{\n    int[] cnt = new int[value];\n    foreach (int x in nums) cnt[((x % value) + value) % value]++;\n    for (int i = 0; ; i++)\n    {\n        int r = i % value;\n        if (cnt[r] == 0) return i;\n        cnt[r]--;\n    }\n}`,
        go: `func findSmallestInteger(nums []int, value int) int {\n\tcnt := make([]int, value)\n\tfor _, x := range nums {\n\t\tcnt[((x%value)+value)%value]++\n\t}\n\tfor i := 0; ; i++ {\n\t\tr := i % value\n\t\tif cnt[r] == 0 {\n\t\t\treturn i\n\t\t}\n\t\tcnt[r]--\n\t}\n}`,
        kotlin: `fun findSmallestInteger(nums: IntArray, value: Int): Int {\n    val cnt = IntArray(value)\n    for (x in nums) cnt[((x % value) + value) % value]++\n    var i = 0\n    while (true) {\n        val r = i % value\n        if (cnt[r] == 0) return i\n        cnt[r]--\n        i++\n    }\n}`,
        swift: `func findSmallestInteger(_ nums: [Int], _ value: Int) -> Int {\n    var cnt = [Int](repeating: 0, count: value)\n    for x in nums { cnt[((x % value) + value) % value] += 1 }\n    var i = 0\n    while true {\n        let r = i % value\n        if cnt[r] == 0 { return i }\n        cnt[r] -= 1\n        i += 1\n    }\n}`,
        rust: `fn findSmallestInteger(nums: Vec<i32>, value: i32) -> i32 {\n    let v = value as usize;\n    let mut cnt = vec![0i32; v];\n    for &x in nums.iter() {\n        cnt[(((x % value) + value) % value) as usize] += 1;\n    }\n    let mut i = 0i32;\n    loop {\n        let r = (i % value) as usize;\n        if cnt[r] == 0 {\n            return i;\n        }\n        cnt[r] -= 1;\n        i += 1;\n    }\n}`,
        php: `function findSmallestInteger($nums, $value) {\n    $cnt = array_fill(0, $value, 0);\n    foreach ($nums as $x) $cnt[(($x % $value) + $value) % $value]++;\n    for ($i = 0; ; $i++) {\n        $r = $i % $value;\n        if ($cnt[$r] === 0) return $i;\n        $cnt[$r]--;\n    }\n}`,
        ruby: `def findSmallestInteger(nums, value)\n  cnt = Array.new(value, 0)\n  nums.each { |x| cnt[x % value] += 1 }\n  i = 0\n  loop do\n    r = i % value\n    return i if cnt[r] == 0\n    cnt[r] -= 1\n    i += 1\n  end\nend`,
      },
    };
  })(),

  // ── Destroy Sequential Targets (LC 2453) ────────────────────────
  (() => {
    const ref = (nums: number[], space: number) => {
      const cnt: Record<number, number> = {};
      for (let i = 0; i < nums.length; i++) {
        const r = nums[i] % space;
        cnt[r] = (cnt[r] || 0) + 1;
      }
      let best = -1, ans = 0;
      for (let i = 0; i < nums.length; i++) {
        const c = cnt[nums[i] % space];
        if (c > best || (c === best && nums[i] < ans)) { best = c; ans = nums[i]; }
      }
      return ans;
    };
    return {
      slug: "destroy-sequential-targets",
      title: "Destroy Sequential Targets",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Counting", "Amazon", "Google", "Dream11"],
      signature: { funcName: "destroyTargets", params: [{ name: "nums", type: "int[]" as const }, { name: "space", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`nums[i]` is the position of a target on a number line. Your machine is seeded with one of those positions `seed` and then destroys every target at `seed`, `seed + space`, `seed + 2·space`, and so on.\n\nReturn the seed that destroys the most targets. If several do, return the **smallest** such seed.",
        [
          { in: "nums = [3,7,8,1,1,5], space = 2", out: "1", note: "Seeding at 1 destroys 1, 1, 3, 5 and 7 — five targets — and 1 is the smallest seed achieving that." },
          { in: "nums = [1,3,5,2,4,6], space = 2", out: "1", note: "Seeds 1, 3 and 5 all destroy three targets; 1 is smallest." },
          { in: "nums = [6,2,5], space = 100", out: "2", note: "Each seed destroys only itself, so the smallest position wins." },
        ],
        ["1 <= nums.length <= 100000", "1 <= nums[i] <= 1000000000", "1 <= space <= 1000000000"]),
      hints: [
        "A target at position `p` is destroyed by seed `s` exactly when `p >= s` and `p ≡ s (mod space)`.",
        "Since the seed must itself be one of the positions, the seed with residue `r` that destroys the most is the smallest position with residue `r`.",
        "So group positions by residue, and the group size is the number destroyed.",
      ],
      editorial: explain({
        idea: "Seeding at the smallest position of a residue class destroys every position in that class, because they are all at or above it and congruent. So the count for a seed is just its residue class's size, and the tie-break picks the smallest position.",
        steps: [
          "Tally how many positions fall in each residue class modulo `space`.",
          "Scan the positions, keeping the one whose class is largest; on a tie keep the smaller position.",
        ],
        why: "Every position congruent to the seed and at least as large is destroyed, and a position smaller than the seed is not — but since the tie-break already drives the answer towards the smallest position in its class, the seed that wins is the class minimum, which reaches all of them. That makes the class size the exact count for the winning seed.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The seed must be one of the given positions, not an arbitrary number.",
          "The tie-break is on the *seed value*, not on the index.",
          "Positions below the seed in the same class are not destroyed, which is why the class minimum is the right representative.",
        ],
      }),
      examples: [
        { input: "[3,7,8,1,1,5]\n2", expectedOutput: "1" },
        { input: "[1,3,5,2,4,6]\n2", expectedOutput: "1" },
        { input: "[6,2,5]\n100", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 40 : 1000000000;
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, hi));
        const space = rng() < 0.6 ? ri(rng, 1, 8) : ri(rng, 1, 1000000000);
        return { input: `${fmtIntArr(nums)}\n${space}`, expectedOutput: String(ref(nums, space)) };
      },
      solutions: {
        python: `from typing import List\n\ndef destroyTargets(nums: List[int], space: int) -> int:\n    cnt = {}\n    for x in nums:\n        r = x % space\n        cnt[r] = cnt.get(r, 0) + 1\n    best, ans = -1, 0\n    for x in nums:\n        c = cnt[x % space]\n        if c > best or (c == best and x < ans):\n            best, ans = c, x\n    return ans`,
        javascript: `var destroyTargets = function(nums, space) {\n    var cnt = {}, i;\n    for (i = 0; i < nums.length; i++) {\n        var r = nums[i] % space;\n        cnt[r] = (cnt[r] || 0) + 1;\n    }\n    var best = -1, ans = 0;\n    for (i = 0; i < nums.length; i++) {\n        var c = cnt[nums[i] % space];\n        if (c > best || (c === best && nums[i] < ans)) { best = c; ans = nums[i]; }\n    }\n    return ans;\n};`,
        typescript: `function destroyTargets(nums: number[], space: number): number {\n    var cnt: { [key: number]: number } = {};\n    var i: number;\n    for (i = 0; i < nums.length; i++) {\n        var r = nums[i] % space;\n        cnt[r] = (cnt[r] || 0) + 1;\n    }\n    var best = -1, ans = 0;\n    for (i = 0; i < nums.length; i++) {\n        var c = cnt[nums[i] % space];\n        if (c > best || (c === best && nums[i] < ans)) { best = c; ans = nums[i]; }\n    }\n    return ans;\n}`,
        java: `public static int destroyTargets(int[] nums, int space) {\n    Map<Integer, Integer> cnt = new HashMap<>();\n    for (int x : nums) cnt.merge(x % space, 1, Integer::sum);\n    int best = -1, ans = 0;\n    for (int x : nums) {\n        int c = cnt.get(x % space);\n        if (c > best || (c == best && x < ans)) {\n            best = c;\n            ans = x;\n        }\n    }\n    return ans;\n}`,
        cpp: `int destroyTargets(vector<int>& nums, int space) {\n    unordered_map<int, int> cnt;\n    for (int x : nums) cnt[x % space]++;\n    int best = -1, ans = 0;\n    for (int x : nums) {\n        int c = cnt[x % space];\n        if (c > best || (c == best && x < ans)) {\n            best = c;\n            ans = x;\n        }\n    }\n    return ans;\n}`,
        c: `typedef struct { int key; int val; int used; } ResSlot;\n\nstatic int resSlotFor(ResSlot* tab, int cap, int key) {\n    unsigned int h = ((unsigned int) key) * 2654435761u;\n    int i = (int) (h % (unsigned int) cap);\n    while (tab[i].used && tab[i].key != key) i = (i + 1) % cap;\n    return i;\n}\n\nint destroyTargets(int* nums, int numsSize, int space) {\n    int cap = 1;\n    while (cap < numsSize * 2 + 4) cap <<= 1;\n    ResSlot* tab = (ResSlot*) calloc((size_t) cap, sizeof(ResSlot));\n    for (int i = 0; i < numsSize; i++) {\n        int r = nums[i] % space;\n        int p = resSlotFor(tab, cap, r);\n        if (!tab[p].used) { tab[p].used = 1; tab[p].key = r; tab[p].val = 0; }\n        tab[p].val++;\n    }\n    int best = -1, ans = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int p = resSlotFor(tab, cap, nums[i] % space);\n        int c = tab[p].val;\n        if (c > best || (c == best && nums[i] < ans)) {\n            best = c;\n            ans = nums[i];\n        }\n    }\n    free(tab);\n    return ans;\n}`,
        csharp: `public static int DestroyTargets(int[] nums, int space)\n{\n    var cnt = new Dictionary<int, int>();\n    foreach (int x in nums)\n    {\n        int r = x % space;\n        int have;\n        cnt.TryGetValue(r, out have);\n        cnt[r] = have + 1;\n    }\n    int best = -1, ans = 0;\n    foreach (int x in nums)\n    {\n        int c = cnt[x % space];\n        if (c > best || (c == best && x < ans))\n        {\n            best = c;\n            ans = x;\n        }\n    }\n    return ans;\n}`,
        go: `func destroyTargets(nums []int, space int) int {\n\tcnt := map[int]int{}\n\tfor _, x := range nums {\n\t\tcnt[x%space]++\n\t}\n\tbest, ans := -1, 0\n\tfor _, x := range nums {\n\t\tc := cnt[x%space]\n\t\tif c > best || (c == best && x < ans) {\n\t\t\tbest = c\n\t\t\tans = x\n\t\t}\n\t}\n\treturn ans\n}`,
        kotlin: `fun destroyTargets(nums: IntArray, space: Int): Int {\n    val cnt = HashMap<Int, Int>()\n    for (x in nums) cnt[x % space] = cnt.getOrDefault(x % space, 0) + 1\n    var best = -1\n    var ans = 0\n    for (x in nums) {\n        val c = cnt[x % space]!!\n        if (c > best || (c == best && x < ans)) {\n            best = c\n            ans = x\n        }\n    }\n    return ans\n}`,
        swift: `func destroyTargets(_ nums: [Int], _ space: Int) -> Int {\n    var cnt = [Int: Int]()\n    for x in nums { cnt[x % space, default: 0] += 1 }\n    var best = -1\n    var ans = 0\n    for x in nums {\n        let c = cnt[x % space] ?? 0\n        if c > best || (c == best && x < ans) {\n            best = c\n            ans = x\n        }\n    }\n    return ans\n}`,
        rust: `fn destroyTargets(nums: Vec<i32>, space: i32) -> i32 {\n    let mut cnt: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();\n    for &x in nums.iter() {\n        *cnt.entry(x % space).or_insert(0) += 1;\n    }\n    let mut best = -1i32;\n    let mut ans = 0i32;\n    for &x in nums.iter() {\n        let c = cnt[&(x % space)];\n        if c > best || (c == best && x < ans) {\n            best = c;\n            ans = x;\n        }\n    }\n    ans\n}`,
        php: `function destroyTargets($nums, $space) {\n    $cnt = [];\n    foreach ($nums as $x) {\n        $r = $x % $space;\n        $cnt[$r] = (isset($cnt[$r]) ? $cnt[$r] : 0) + 1;\n    }\n    $best = -1;\n    $ans = 0;\n    foreach ($nums as $x) {\n        $c = $cnt[$x % $space];\n        if ($c > $best || ($c === $best && $x < $ans)) {\n            $best = $c;\n            $ans = $x;\n        }\n    }\n    return $ans;\n}`,
        ruby: `def destroyTargets(nums, space)\n  cnt = Hash.new(0)\n  nums.each { |x| cnt[x % space] += 1 }\n  best = -1\n  ans = 0\n  nums.each do |x|\n    c = cnt[x % space]\n    if c > best || (c == best && x < ans)\n      best = c\n      ans = x\n    end\n  end\n  ans\nend`,
      },
    };
  })(),

  // ── Minimum Operations to Make Median of Array Equal to K (LC 3107) ──
  (() => {
    const ref = (nums: number[], k: number) => {
      const a = nums.slice().sort((x, y) => x - y);
      const n = a.length;
      const m = Math.floor(n / 2);
      let ops = 0;
      if (a[m] > k) {
        for (let i = m; i >= 0 && a[i] > k; i--) ops += a[i] - k;
      } else {
        for (let i = m; i < n && a[i] < k; i++) ops += k - a[i];
      }
      return ops;
    };
    return {
      slug: "minimum-operations-to-make-median-of-array-equal-to-k",
      title: "Minimum Operations to Make Median of Array Equal to K",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Google", "Cred"],
      signature: { funcName: "minOperationsToMakeMedianK", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "One operation increases or decreases any element by 1. The **median** is the middle element after sorting; with an even length it is the **larger** of the two middles.\n\nReturn the minimum number of operations to make the median of `nums` equal to `k`.",
        [
          { in: "nums = [2,5,6,8,5], k = 4", out: "2", note: "Sorted it is [2,5,5,6,8] with median 5; lowering both 5s to 4 costs 2." },
          { in: "nums = [2,5,6,8,5], k = 7", out: "3", note: "Raise 5 to 7 and 6 to 7." },
          { in: "nums = [1,2,3,4,5,6], k = 4", out: "0", note: "The median is already 4." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 1000000", "1 <= k <= 1000000"]),
      hints: [
        "Sort first; the median sits at index `n / 2` (integer division).",
        "If the median is above `k`, every element from there leftwards that exceeds `k` must come down to `k`.",
        "If it is below `k`, every element from there rightwards that is below `k` must come up.",
      ],
      editorial: explain({
        idea: "Only the elements around the median position need to move, and only far enough to put `k` at that position. Sorting makes the affected run contiguous, and each element's cost is its distance to `k`.",
        steps: [
          "Sort a copy and let `m = n / 2`.",
          "If `a[m] > k`, walk left from `m` while the value exceeds `k`, adding `a[i] - k`.",
          "If `a[m] < k`, walk right from `m` while the value is below `k`, adding `k - a[i]`.",
        ],
        why: "To place `k` at index `m` of the sorted array, at least `m + 1` elements must be at most `k` and at least `n - m` must be at least `k`. When the median is too high, the cheapest way to satisfy the first requirement is to pull down exactly the elements at indices `m, m-1, …` that exceed `k` — they are the closest to `k` among those that must move. The other direction is symmetric, and elements already on the right side of `k` cost nothing.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "With an even length the median is the *upper* middle, so `m = n / 2`, not `n / 2 - 1`.",
          "Elements already past `k` in the right direction must not be moved — the walk stops at the first one.",
          "The total reaches about `10^9` at the stated limits.",
        ],
      }),
      examples: [
        { input: "[2,5,6,8,5]\n4", expectedOutput: "2" },
        { input: "[2,5,6,8,5]\n7", expectedOutput: "3" },
        { input: "[1,2,3,4,5,6]\n4", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 25 : 1000000;
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, hi));
        const k = ri(rng, 1, hi);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minOperationsToMakeMedianK(nums: List[int], k: int) -> int:\n    a = sorted(nums)\n    n = len(a)\n    m = n // 2\n    ops = 0\n    if a[m] > k:\n        i = m\n        while i >= 0 and a[i] > k:\n            ops += a[i] - k\n            i -= 1\n    else:\n        i = m\n        while i < n and a[i] < k:\n            ops += k - a[i]\n            i += 1\n    return ops`,
        javascript: `var minOperationsToMakeMedianK = function(nums, k) {\n    var a = nums.slice().sort(function(x, y) { return x - y; });\n    var n = a.length;\n    var m = Math.floor(n / 2);\n    var ops = 0, i;\n    if (a[m] > k) {\n        for (i = m; i >= 0 && a[i] > k; i--) ops += a[i] - k;\n    } else {\n        for (i = m; i < n && a[i] < k; i++) ops += k - a[i];\n    }\n    return ops;\n};`,
        typescript: `function minOperationsToMakeMedianK(nums: number[], k: number): number {\n    var a = nums.slice().sort(function(x, y) { return x - y; });\n    var n = a.length;\n    var m = Math.floor(n / 2);\n    var ops = 0, i: number;\n    if (a[m] > k) {\n        for (i = m; i >= 0 && a[i] > k; i--) ops += a[i] - k;\n    } else {\n        for (i = m; i < n && a[i] < k; i++) ops += k - a[i];\n    }\n    return ops;\n}`,
        java: `public static int minOperationsToMakeMedianK(int[] nums, int k) {\n    int[] a = nums.clone();\n    Arrays.sort(a);\n    int n = a.length, m = n / 2;\n    long ops = 0;\n    if (a[m] > k) {\n        for (int i = m; i >= 0 && a[i] > k; i--) ops += a[i] - k;\n    } else {\n        for (int i = m; i < n && a[i] < k; i++) ops += k - a[i];\n    }\n    return (int) ops;\n}`,
        cpp: `int minOperationsToMakeMedianK(vector<int>& nums, int k) {\n    vector<int> a = nums;\n    sort(a.begin(), a.end());\n    int n = (int) a.size(), m = n / 2;\n    long long ops = 0;\n    if (a[m] > k) {\n        for (int i = m; i >= 0 && a[i] > k; i--) ops += a[i] - k;\n    } else {\n        for (int i = m; i < n && a[i] < k; i++) ops += k - a[i];\n    }\n    return (int) ops;\n}`,
        c: `static int cmpMedianAsc(const void* x, const void* y) {\n    int p = *(const int*) x;\n    int q = *(const int*) y;\n    return (p > q) - (p < q);\n}\n\nint minOperationsToMakeMedianK(int* nums, int numsSize, int k) {\n    int* a = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    qsort(a, (size_t) numsSize, sizeof(int), cmpMedianAsc);\n    int m = numsSize / 2;\n    long long ops = 0;\n    if (a[m] > k) {\n        for (int i = m; i >= 0 && a[i] > k; i--) ops += a[i] - k;\n    } else {\n        for (int i = m; i < numsSize && a[i] < k; i++) ops += k - a[i];\n    }\n    free(a);\n    return (int) ops;\n}`,
        csharp: `public static int MinOperationsToMakeMedianK(int[] nums, int k)\n{\n    int[] a = (int[]) nums.Clone();\n    Array.Sort(a);\n    int n = a.Length, m = n / 2;\n    long ops = 0;\n    if (a[m] > k)\n    {\n        for (int i = m; i >= 0 && a[i] > k; i--) ops += a[i] - k;\n    }\n    else\n    {\n        for (int i = m; i < n && a[i] < k; i++) ops += k - a[i];\n    }\n    return (int) ops;\n}`,
        go: `func minOperationsToMakeMedianK(nums []int, k int) int {\n\ta := append([]int{}, nums...)\n\tsort.Ints(a)\n\tn := len(a)\n\tm := n / 2\n\tops := 0\n\tif a[m] > k {\n\t\tfor i := m; i >= 0 && a[i] > k; i-- {\n\t\t\tops += a[i] - k\n\t\t}\n\t} else {\n\t\tfor i := m; i < n && a[i] < k; i++ {\n\t\t\tops += k - a[i]\n\t\t}\n\t}\n\treturn ops\n}`,
        kotlin: `fun minOperationsToMakeMedianK(nums: IntArray, k: Int): Int {\n    val a = nums.sortedArray()\n    val n = a.size\n    val m = n / 2\n    var ops = 0L\n    if (a[m] > k) {\n        var i = m\n        while (i >= 0 && a[i] > k) {\n            ops += (a[i] - k).toLong()\n            i--\n        }\n    } else {\n        var i = m\n        while (i < n && a[i] < k) {\n            ops += (k - a[i]).toLong()\n            i++\n        }\n    }\n    return ops.toInt()\n}`,
        swift: `func minOperationsToMakeMedianK(_ nums: [Int], _ k: Int) -> Int {\n    let a = nums.sorted()\n    let n = a.count\n    let m = n / 2\n    var ops = 0\n    if a[m] > k {\n        var i = m\n        while i >= 0 && a[i] > k {\n            ops += a[i] - k\n            i -= 1\n        }\n    } else {\n        var i = m\n        while i < n && a[i] < k {\n            ops += k - a[i]\n            i += 1\n        }\n    }\n    return ops\n}`,
        rust: `fn minOperationsToMakeMedianK(nums: Vec<i32>, k: i32) -> i32 {\n    let mut a = nums.clone();\n    a.sort();\n    let n = a.len() as i32;\n    let m = n / 2;\n    let mut ops: i64 = 0;\n    if a[m as usize] > k {\n        let mut i = m;\n        while i >= 0 && a[i as usize] > k {\n            ops += (a[i as usize] - k) as i64;\n            i -= 1;\n        }\n    } else {\n        let mut i = m;\n        while i < n && a[i as usize] < k {\n            ops += (k - a[i as usize]) as i64;\n            i += 1;\n        }\n    }\n    ops as i32\n}`,
        php: `function minOperationsToMakeMedianK($nums, $k) {\n    $a = $nums;\n    sort($a);\n    $n = count($a);\n    $m = intdiv($n, 2);\n    $ops = 0;\n    if ($a[$m] > $k) {\n        for ($i = $m; $i >= 0 && $a[$i] > $k; $i--) $ops += $a[$i] - $k;\n    } else {\n        for ($i = $m; $i < $n && $a[$i] < $k; $i++) $ops += $k - $a[$i];\n    }\n    return $ops;\n}`,
        ruby: `def minOperationsToMakeMedianK(nums, k)\n  a = nums.sort\n  n = a.length\n  m = n / 2\n  ops = 0\n  if a[m] > k\n    i = m\n    while i >= 0 && a[i] > k\n      ops += a[i] - k\n      i -= 1\n    end\n  else\n    i = m\n    while i < n && a[i] < k\n      ops += k - a[i]\n      i += 1\n    end\n  end\n  ops\nend`,
      },
    };
  })(),

  // ── Stone Game IX (LC 2029) ─────────────────────────────────────
  (() => {
    const ref = (stones: number[]) => {
      const c = [0, 0, 0];
      for (let i = 0; i < stones.length; i++) c[stones[i] % 3]++;
      if (c[0] % 2 === 0) return c[1] >= 1 && c[2] >= 1;
      return Math.abs(c[1] - c[2]) > 2;
    };
    return {
      slug: "stone-game-ix",
      title: "Stone Game IX",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Greedy", "Counting", "Game Theory", "Amazon", "Google", "Directi"],
      signature: { funcName: "stoneGameIX", params: [{ name: "stones", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Alice and Bob take turns removing one stone, Alice first. A player **loses immediately** if, after their removal, the total value of all removed stones is divisible by 3. If every stone is removed without that happening, Bob wins.\n\nAssuming both play optimally, return whether Alice wins.",
        [
          { in: "stones = [2,1]", out: "true", note: "Alice removes 2; Bob must remove 1, making the total 3." },
          { in: "stones = [2]", out: "false", note: "Alice removes the only stone and the game ends with Bob winning." },
          { in: "stones = [5,1,2,4,3]", out: "false" },
        ],
        ["1 <= stones.length <= 100000", "1 <= stones[i] <= 10000"]),
      hints: [
        "Only each stone's value modulo 3 matters — group them into counts `c0`, `c1` and `c2`.",
        "A stone with residue 0 never changes the running total's residue; it just passes the turn.",
        "So the parity of `c0` decides who effectively moves first in the alternating 1/2 sequence.",
      ],
      editorial: explain({
        idea: "Reduce to residues. Stones with residue 0 are pure turn-passers, so only the parity of `c0` matters; the game itself is then a forced alternation between residues 1 and 2 that Alice must sustain.",
        steps: [
          "Count stones by residue mod 3 into `c0`, `c1`, `c2`.",
          "If `c0` is even, Alice wins exactly when both `c1 >= 1` and `c2 >= 1`.",
          "If `c0` is odd, Alice wins exactly when `|c1 - c2| > 2`.",
        ],
        why: "Starting with a residue-1 stone forces the sequence 1, 1, 2, 1, 2, … to avoid a multiple of 3, and starting with a 2 mirrors it — so Alice needs at least one of each to get a viable opening. An even `c0` leaves the parity of the alternation untouched. An odd `c0` hands the effective first move to the opponent, and Alice can only survive by exhausting one residue class far enough ahead of the other, which is exactly the gap of more than 2.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Simulating the game is exponential; only the three counts matter.",
          "The `c0` parity flips which player is under pressure — swapping the two branches inverts every answer.",
          "The threshold in the odd case is strictly greater than 2, not at least 2.",
        ],
      }),
      examples: [
        { input: "[2,1]", expectedOutput: "true" },
        { input: "[2]", expectedOutput: "false" },
        { input: "[5,1,2,4,3]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const stones = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, rng() < 0.6 ? 9 : 10000));
        return { input: fmtIntArr(stones), expectedOutput: bool(ref(stones)) };
      },
      solutions: {
        python: `from typing import List\n\ndef stoneGameIX(stones: List[int]) -> bool:\n    c = [0, 0, 0]\n    for x in stones:\n        c[x % 3] += 1\n    if c[0] % 2 == 0:\n        return c[1] >= 1 and c[2] >= 1\n    return abs(c[1] - c[2]) > 2`,
        javascript: `var stoneGameIX = function(stones) {\n    var c = [0, 0, 0];\n    for (var i = 0; i < stones.length; i++) c[stones[i] % 3]++;\n    if (c[0] % 2 === 0) return c[1] >= 1 && c[2] >= 1;\n    return Math.abs(c[1] - c[2]) > 2;\n};`,
        typescript: `function stoneGameIX(stones: number[]): boolean {\n    var c = [0, 0, 0];\n    for (var i = 0; i < stones.length; i++) c[stones[i] % 3]++;\n    if (c[0] % 2 === 0) return c[1] >= 1 && c[2] >= 1;\n    return Math.abs(c[1] - c[2]) > 2;\n}`,
        java: `public static boolean stoneGameIX(int[] stones) {\n    int[] c = new int[3];\n    for (int x : stones) c[x % 3]++;\n    if (c[0] % 2 == 0) return c[1] >= 1 && c[2] >= 1;\n    return Math.abs(c[1] - c[2]) > 2;\n}`,
        cpp: `bool stoneGameIX(vector<int>& stones) {\n    int c[3] = { 0, 0, 0 };\n    for (int x : stones) c[x % 3]++;\n    if (c[0] % 2 == 0) return c[1] >= 1 && c[2] >= 1;\n    return abs(c[1] - c[2]) > 2;\n}`,
        c: `bool stoneGameIX(int* stones, int stonesSize) {\n    int c[3] = { 0, 0, 0 };\n    for (int i = 0; i < stonesSize; i++) c[stones[i] % 3]++;\n    if (c[0] % 2 == 0) return c[1] >= 1 && c[2] >= 1;\n    int d = c[1] - c[2];\n    if (d < 0) d = -d;\n    return d > 2;\n}`,
        csharp: `public static bool StoneGameIX(int[] stones)\n{\n    int[] c = new int[3];\n    foreach (int x in stones) c[x % 3]++;\n    if (c[0] % 2 == 0) return c[1] >= 1 && c[2] >= 1;\n    return Math.Abs(c[1] - c[2]) > 2;\n}`,
        go: `func stoneGameIX(stones []int) bool {\n\tc := [3]int{}\n\tfor _, x := range stones {\n\t\tc[x%3]++\n\t}\n\tif c[0]%2 == 0 {\n\t\treturn c[1] >= 1 && c[2] >= 1\n\t}\n\td := c[1] - c[2]\n\tif d < 0 {\n\t\td = -d\n\t}\n\treturn d > 2\n}`,
        kotlin: `fun stoneGameIX(stones: IntArray): Boolean {\n    val c = IntArray(3)\n    for (x in stones) c[x % 3]++\n    if (c[0] % 2 == 0) return c[1] >= 1 && c[2] >= 1\n    return Math.abs(c[1] - c[2]) > 2\n}`,
        swift: `func stoneGameIX(_ stones: [Int]) -> Bool {\n    var c = [0, 0, 0]\n    for x in stones { c[x % 3] += 1 }\n    if c[0] % 2 == 0 { return c[1] >= 1 && c[2] >= 1 }\n    return abs(c[1] - c[2]) > 2\n}`,
        rust: `fn stoneGameIX(stones: Vec<i32>) -> bool {\n    let mut c = [0i32; 3];\n    for &x in stones.iter() {\n        c[(x % 3) as usize] += 1;\n    }\n    if c[0] % 2 == 0 {\n        return c[1] >= 1 && c[2] >= 1;\n    }\n    (c[1] - c[2]).abs() > 2\n}`,
        php: `function stoneGameIX($stones) {\n    $c = [0, 0, 0];\n    foreach ($stones as $x) $c[$x % 3]++;\n    if ($c[0] % 2 === 0) return $c[1] >= 1 && $c[2] >= 1;\n    return abs($c[1] - $c[2]) > 2;\n}`,
        ruby: `def stoneGameIX(stones)\n  c = [0, 0, 0]\n  stones.each { |x| c[x % 3] += 1 }\n  return c[1] >= 1 && c[2] >= 1 if c[0].even?\n  (c[1] - c[2]).abs > 2\nend`,
      },
    };
  })(),

  // ── Partition String Into Substrings With Values at Most K (LC 2522) ──
  (() => {
    const ref = (s: string, k: number) => {
      let count = 1, cur = 0;
      for (let i = 0; i < s.length; i++) {
        const d = s.charCodeAt(i) - 48;
        if (d > k) return -1;
        if (cur > Math.floor((k - d) / 10)) { count++; cur = d; }
        else cur = cur * 10 + d;
      }
      return count;
    };
    return {
      slug: "partition-string-into-substrings-with-values-at-most-k",
      title: "Partition String Into Substrings With Values at Most K",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Dynamic Programming", "Amazon", "Google", "Myntra"],
      signature: { funcName: "minimumPartition", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A partition of the digit string `s` is **good** when every part, read as a number, is at most `k`.\n\nReturn the minimum number of parts in a good partition, or `-1` if none exists.",
        [
          { in: 's = "165462", k = 60', out: "4", note: 'The parts "16", "54", "6" and "2" are each at most 60.' },
          { in: 's = "238182", k = 5', out: "-1", note: "The digit 8 alone exceeds 5." },
          { in: 's = "3", k = 3', out: "1" },
        ],
        ["1 <= s.length <= 100000", "s consists of digits.", "1 <= k <= 1000000000"]),
      hints: [
        "If any single digit exceeds `k`, no partition can work.",
        "Otherwise extend the current part as long as appending the next digit keeps it at or below `k`.",
        "Test the overflow with a division rather than by building the number: `cur > (k - d) / 10`.",
      ],
      editorial: explain({
        idea: "A left-to-right greedy that makes each part as long as possible. Since making a part longer never forces more parts later, the greedy is optimal.",
        steps: [
          "Reject immediately if a digit exceeds `k`.",
          "Keep `cur`, the value of the part being built; on each digit, check whether `cur · 10 + d` would exceed `k`.",
          "If it would, close the part, start a new one at this digit, and count it.",
        ],
        why: "Exchange argument: suppose an optimal partition ends a part earlier than the greedy would. Extending that part by one digit keeps it valid (the greedy said so) and only removes a digit from the next part, which stays valid because its value only shrinks. Repeating turns any optimal partition into the greedy one without increasing the count. The division form of the overflow test avoids building `cur · 10 + d`, which would exceed 32-bit range for large `k`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`cur * 10 + d` overflows a 32-bit `int` when `k` is near `10^9` — compare with `(k - d) / 10` instead, or widen the type.",
          "The impossibility check must look at single digits, not at the whole string.",
          "The part count starts at 1, since even an empty scan produces one part.",
        ],
      }),
      examples: [
        { input: '"165462"\n60', expectedOutput: "4" },
        { input: '"238182"\n5', expectedOutput: "-1" },
        { input: '"3"\n3', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const s = Array.from({ length: ri(rng, 1, 30) }, () => String(ri(rng, 0, 9))).join("");
        const k = rng() < 0.6 ? ri(rng, 1, 200) : ri(rng, 1, 1000000000);
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: `def minimumPartition(s: str, k: int) -> int:\n    count, cur = 1, 0\n    for ch in s:\n        d = int(ch)\n        if d > k:\n            return -1\n        if cur > (k - d) // 10:\n            count += 1\n            cur = d\n        else:\n            cur = cur * 10 + d\n    return count`,
        javascript: `var minimumPartition = function(s, k) {\n    var count = 1, cur = 0;\n    for (var i = 0; i < s.length; i++) {\n        var d = s.charCodeAt(i) - 48;\n        if (d > k) return -1;\n        if (cur > Math.floor((k - d) / 10)) { count++; cur = d; }\n        else cur = cur * 10 + d;\n    }\n    return count;\n};`,
        typescript: `function minimumPartition(s: string, k: number): number {\n    var count = 1, cur = 0;\n    for (var i = 0; i < s.length; i++) {\n        var d = s.charCodeAt(i) - 48;\n        if (d > k) return -1;\n        if (cur > Math.floor((k - d) / 10)) { count++; cur = d; }\n        else cur = cur * 10 + d;\n    }\n    return count;\n}`,
        java: `public static int minimumPartition(String s, int k) {\n    int count = 1, cur = 0;\n    for (int i = 0; i < s.length(); i++) {\n        int d = s.charAt(i) - '0';\n        if (d > k) return -1;\n        if (cur > (k - d) / 10) {\n            count++;\n            cur = d;\n        } else {\n            cur = cur * 10 + d;\n        }\n    }\n    return count;\n}`,
        cpp: `int minimumPartition(string s, int k) {\n    int count = 1, cur = 0;\n    for (char ch : s) {\n        int d = ch - '0';\n        if (d > k) return -1;\n        if (cur > (k - d) / 10) {\n            count++;\n            cur = d;\n        } else {\n            cur = cur * 10 + d;\n        }\n    }\n    return count;\n}`,
        c: `int minimumPartition(char* s, int k) {\n    int count = 1, cur = 0;\n    for (int i = 0; s[i]; i++) {\n        int d = s[i] - '0';\n        if (d > k) return -1;\n        if (cur > (k - d) / 10) {\n            count++;\n            cur = d;\n        } else {\n            cur = cur * 10 + d;\n        }\n    }\n    return count;\n}`,
        csharp: `public static int MinimumPartition(string s, int k)\n{\n    int count = 1, cur = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        int d = s[i] - '0';\n        if (d > k) return -1;\n        if (cur > (k - d) / 10)\n        {\n            count++;\n            cur = d;\n        }\n        else\n        {\n            cur = cur * 10 + d;\n        }\n    }\n    return count;\n}`,
        go: `func minimumPartition(s string, k int) int {\n\tcount, cur := 1, 0\n\tfor i := 0; i < len(s); i++ {\n\t\td := int(s[i] - '0')\n\t\tif d > k {\n\t\t\treturn -1\n\t\t}\n\t\tif cur > (k-d)/10 {\n\t\t\tcount++\n\t\t\tcur = d\n\t\t} else {\n\t\t\tcur = cur*10 + d\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun minimumPartition(s: String, k: Int): Int {\n    var count = 1\n    var cur = 0\n    for (ch in s) {\n        val d = ch - '0'\n        if (d > k) return -1\n        if (cur > (k - d) / 10) {\n            count++\n            cur = d\n        } else {\n            cur = cur * 10 + d\n        }\n    }\n    return count\n}`,
        swift: `func minimumPartition(_ s: String, _ k: Int) -> Int {\n    var count = 1\n    var cur = 0\n    for ch in s.unicodeScalars {\n        let d = Int(ch.value) - 48\n        if d > k { return -1 }\n        if cur > (k - d) / 10 {\n            count += 1\n            cur = d\n        } else {\n            cur = cur * 10 + d\n        }\n    }\n    return count\n}`,
        rust: `fn minimumPartition(s: String, k: i32) -> i32 {\n    let mut count = 1i32;\n    let mut cur = 0i32;\n    for b in s.as_bytes().iter() {\n        let d = (b - b'0') as i32;\n        if d > k {\n            return -1;\n        }\n        if cur > (k - d) / 10 {\n            count += 1;\n            cur = d;\n        } else {\n            cur = cur * 10 + d;\n        }\n    }\n    count\n}`,
        php: `function minimumPartition($s, $k) {\n    $count = 1;\n    $cur = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        $d = ord($s[$i]) - 48;\n        if ($d > $k) return -1;\n        if ($cur > intdiv($k - $d, 10)) {\n            $count++;\n            $cur = $d;\n        } else {\n            $cur = $cur * 10 + $d;\n        }\n    }\n    return $count;\n}`,
        ruby: `def minimumPartition(s, k)\n  count = 1\n  cur = 0\n  s.each_char do |ch|\n    d = ch.to_i\n    return -1 if d > k\n    if cur > (k - d) / 10\n      count += 1\n      cur = d\n    else\n      cur = cur * 10 + d\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Minimum Additions to Make Valid String (LC 2645) ────────────
  (() => {
    const ref = (word: string) => {
      let count = 0, need = 0;
      for (let i = 0; i < word.length; i++) {
        const c = word.charCodeAt(i) - 97;
        if (c >= need) count += c - need; else count += 3 - need + c;
        need = (c + 1) % 3;
      }
      count += (3 - need) % 3;
      return count;
    };
    return {
      slug: "minimum-additions-to-make-valid-string",
      title: "Minimum Additions to Make Valid String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Dynamic Programming", "Stack", "Amazon", "Google", "Zoho"],
      signature: { funcName: "addMinimum", params: [{ name: "word", type: "string" as const }], returns: "int" as const },
      description: describe(
        'A string is **valid** when it is a concatenation of one or more copies of `"abc"`.\n\nYou may insert any character at any position of `word`. Return the minimum number of insertions needed to make it valid.',
        [
          { in: 'word = "b"', out: "2", note: 'Insert an a before and a c after to get "abc".' },
          { in: 'word = "aaa"', out: "6", note: 'Each a needs its own "bc".' },
          { in: 'word = "abc"', out: "0" },
        ],
        ["1 <= word.length <= 50", "word consists only of 'a', 'b' and 'c'."]),
      hints: [
        'Think of the target as an endless repetition `abcabcabc…` and walk the word through it.',
        "Each existing character must land on its matching slot; the slots you skip are the insertions.",
        "At the end, pad out whatever remains of the current block.",
      ],
      editorial: explain({
        idea: 'Model the valid string as a cycle a → b → c → a and walk the word through it. The gap between the slot you need and the character you have is exactly the number of characters that must be inserted.',
        steps: [
          "Keep `need`, the position in the cycle that the next character should occupy (starting at `a`).",
          "For each character at cycle position `c`, add the forward distance from `need` to `c` — `c - need` if it is ahead, otherwise wrapping through the end of the block.",
          "Set `need = (c + 1) % 3` and continue.",
          'Finally pad `(3 - need) % 3` characters to close the last block.',
        ],
        why: "Insertions never reorder the existing characters, so the word must appear as a subsequence of the target in order — and the cheapest target is the one that advances through the cycle as little as possible at each step. The forward distance is exactly that minimum, and the final padding closes the block the last character opened.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Counting the backward distance when the character is behind `need` gives a negative or wrong gap — the cycle wraps forwards.",
          "Forgetting the trailing padding leaves an incomplete final block.",
          'A word that is already a repetition of "abc" needs zero insertions, and the formula must produce that.',
        ],
      }),
      examples: [
        { input: '"b"', expectedOutput: "2" },
        { input: '"aaa"', expectedOutput: "6" },
        { input: '"abc"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const word = Array.from({ length: ri(rng, 1, 40) }, () => pick(rng, ["a", "b", "c"])).join("");
        return { input: `"${word}"`, expectedOutput: String(ref(word)) };
      },
      solutions: {
        python: `def addMinimum(word: str) -> int:\n    count = need = 0\n    for ch in word:\n        c = ord(ch) - 97\n        count += (c - need) if c >= need else (3 - need + c)\n        need = (c + 1) % 3\n    count += (3 - need) % 3\n    return count`,
        javascript: `var addMinimum = function(word) {\n    var count = 0, need = 0;\n    for (var i = 0; i < word.length; i++) {\n        var c = word.charCodeAt(i) - 97;\n        if (c >= need) count += c - need; else count += 3 - need + c;\n        need = (c + 1) % 3;\n    }\n    count += (3 - need) % 3;\n    return count;\n};`,
        typescript: `function addMinimum(word: string): number {\n    var count = 0, need = 0;\n    for (var i = 0; i < word.length; i++) {\n        var c = word.charCodeAt(i) - 97;\n        if (c >= need) count += c - need; else count += 3 - need + c;\n        need = (c + 1) % 3;\n    }\n    count += (3 - need) % 3;\n    return count;\n}`,
        java: `public static int addMinimum(String word) {\n    int count = 0, need = 0;\n    for (int i = 0; i < word.length(); i++) {\n        int c = word.charAt(i) - 'a';\n        count += (c >= need) ? (c - need) : (3 - need + c);\n        need = (c + 1) % 3;\n    }\n    count += (3 - need) % 3;\n    return count;\n}`,
        cpp: `int addMinimum(string word) {\n    int count = 0, need = 0;\n    for (char ch : word) {\n        int c = ch - 'a';\n        count += (c >= need) ? (c - need) : (3 - need + c);\n        need = (c + 1) % 3;\n    }\n    count += (3 - need) % 3;\n    return count;\n}`,
        c: `int addMinimum(char* word) {\n    int count = 0, need = 0;\n    for (int i = 0; word[i]; i++) {\n        int c = word[i] - 'a';\n        count += (c >= need) ? (c - need) : (3 - need + c);\n        need = (c + 1) % 3;\n    }\n    count += (3 - need) % 3;\n    return count;\n}`,
        csharp: `public static int AddMinimum(string word)\n{\n    int count = 0, need = 0;\n    for (int i = 0; i < word.Length; i++)\n    {\n        int c = word[i] - 'a';\n        count += (c >= need) ? (c - need) : (3 - need + c);\n        need = (c + 1) % 3;\n    }\n    count += (3 - need) % 3;\n    return count;\n}`,
        go: `func addMinimum(word string) int {\n\tcount, need := 0, 0\n\tfor i := 0; i < len(word); i++ {\n\t\tc := int(word[i] - 'a')\n\t\tif c >= need {\n\t\t\tcount += c - need\n\t\t} else {\n\t\t\tcount += 3 - need + c\n\t\t}\n\t\tneed = (c + 1) % 3\n\t}\n\tcount += (3 - need) % 3\n\treturn count\n}`,
        kotlin: `fun addMinimum(word: String): Int {\n    var count = 0\n    var need = 0\n    for (ch in word) {\n        val c = ch - 'a'\n        count += if (c >= need) c - need else 3 - need + c\n        need = (c + 1) % 3\n    }\n    count += (3 - need) % 3\n    return count\n}`,
        swift: `func addMinimum(_ word: String) -> Int {\n    var count = 0\n    var need = 0\n    for ch in word.unicodeScalars {\n        let c = Int(ch.value) - 97\n        count += c >= need ? (c - need) : (3 - need + c)\n        need = (c + 1) % 3\n    }\n    count += (3 - need) % 3\n    return count\n}`,
        rust: `fn addMinimum(word: String) -> i32 {\n    let mut count = 0i32;\n    let mut need = 0i32;\n    for b in word.as_bytes().iter() {\n        let c = (b - b'a') as i32;\n        count += if c >= need { c - need } else { 3 - need + c };\n        need = (c + 1) % 3;\n    }\n    count += (3 - need) % 3;\n    count\n}`,
        php: `function addMinimum($word) {\n    $count = 0;\n    $need = 0;\n    for ($i = 0; $i < strlen($word); $i++) {\n        $c = ord($word[$i]) - 97;\n        $count += ($c >= $need) ? ($c - $need) : (3 - $need + $c);\n        $need = ($c + 1) % 3;\n    }\n    $count += (3 - $need) % 3;\n    return $count;\n}`,
        ruby: `def addMinimum(word)\n  count = 0\n  need = 0\n  word.each_char do |ch|\n    c = ch.ord - 97\n    count += c >= need ? (c - need) : (3 - need + c)\n    need = (c + 1) % 3\n  end\n  count += (3 - need) % 3\n  count\nend`,
      },
    };
  })(),

  // ── Minimum Impossible OR (LC 2568) ─────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const has: Record<number, boolean> = {};
      for (let i = 0; i < nums.length; i++) has[nums[i]] = true;
      let p = 1;
      while (has[p]) p *= 2;
      return p;
    };
    return {
      slug: "minimum-impossible-or",
      title: "Minimum Impossible OR",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Bit Manipulation", "Brainteaser", "Amazon", "Google", "Arcesium"],
      signature: { funcName: "minImpossibleOR", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An integer `x` is **expressible** from `nums` if some non-empty subsequence of `nums` has bitwise OR exactly `x`.\n\nReturn the smallest positive integer that is **not** expressible.",
        [
          { in: "nums = [2,1]", out: "4", note: "1, 2 and 3 are all reachable; 4 is not." },
          { in: "nums = [5,3,2]", out: "1", note: "No subsequence ORs to 1." },
          { in: "nums = [1,2,4,8]", out: "16" },
        ],
        ["1 <= nums.length <= 100000", "1 <= nums[i] <= 1000000000"]),
      hints: [
        "OR only ever sets bits, so a value with several bits is reachable once each of its bits is available on its own.",
        "That makes the powers of two the only values that matter.",
        "The answer is the smallest power of two missing from `nums`.",
      ],
      editorial: explain({
        idea: "Only the powers of two present in `nums` matter: every non-power is an OR of the powers below it, and conversely a power of two can only come from an element equal to it.",
        steps: [
          "Put the values in a set.",
          "Walk `1, 2, 4, 8, …` and return the first one missing.",
        ],
        why: "If `2^k` is in `nums` for all `k` below some bound, every integer whose bits lie under that bound is the OR of the corresponding singletons — so all of them are expressible. Conversely, `2^k` has one bit, so any subsequence ORing to it must consist entirely of elements that are themselves `2^k` — meaning `2^k` is expressible precisely when it appears. So the first missing power of two is the first inexpressible value.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Trying to enumerate subsequence ORs is exponential and unnecessary.",
          "A non-power like 3 being absent does not matter — it is `1 | 2`.",
          "The walk terminates quickly: at most 31 powers fit the value range.",
        ],
      }),
      examples: [
        { input: "[2,1]", expectedOutput: "4" },
        { input: "[5,3,2]", expectedOutput: "1" },
        { input: "[1,2,4,8]", expectedOutput: "16" },
      ],
      gen: (rng: Rng) => {
        const nums: number[] = [];
        const n = ri(rng, 1, 25);
        for (let i = 0; i < n; i++) {
          // Bias towards powers of two so the answer is not always 1.
          nums.push(rng() < 0.55 ? 1 << ri(rng, 0, 8) : ri(rng, 1, 1000));
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minImpossibleOR(nums: List[int]) -> int:\n    have = set(nums)\n    p = 1\n    while p in have:\n        p *= 2\n    return p`,
        javascript: `var minImpossibleOR = function(nums) {\n    var has = {};\n    for (var i = 0; i < nums.length; i++) has[nums[i]] = true;\n    var p = 1;\n    while (has[p]) p *= 2;\n    return p;\n};`,
        typescript: `function minImpossibleOR(nums: number[]): number {\n    var has: { [key: number]: boolean } = {};\n    for (var i = 0; i < nums.length; i++) has[nums[i]] = true;\n    var p = 1;\n    while (has[p]) p *= 2;\n    return p;\n}`,
        java: `public static int minImpossibleOR(int[] nums) {\n    Set<Integer> have = new HashSet<>();\n    for (int x : nums) have.add(x);\n    int p = 1;\n    while (have.contains(p)) p *= 2;\n    return p;\n}`,
        cpp: `int minImpossibleOR(vector<int>& nums) {\n    unordered_set<int> have(nums.begin(), nums.end());\n    int p = 1;\n    while (have.count(p)) p *= 2;\n    return p;\n}`,
        c: `int minImpossibleOR(int* nums, int numsSize) {\n    int seen[32];\n    for (int i = 0; i < 32; i++) seen[i] = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int x = nums[i];\n        if ((x & (x - 1)) == 0) {\n            int k = 0;\n            while ((1 << k) != x) k++;\n            seen[k] = 1;\n        }\n    }\n    int k = 0;\n    while (k < 31 && seen[k]) k++;\n    return 1 << k;\n}`,
        csharp: `public static int MinImpossibleOR(int[] nums)\n{\n    var have = new HashSet<int>(nums);\n    int p = 1;\n    while (have.Contains(p)) p *= 2;\n    return p;\n}`,
        go: `func minImpossibleOR(nums []int) int {\n\thave := map[int]bool{}\n\tfor _, x := range nums {\n\t\thave[x] = true\n\t}\n\tp := 1\n\tfor have[p] {\n\t\tp *= 2\n\t}\n\treturn p\n}`,
        kotlin: `fun minImpossibleOR(nums: IntArray): Int {\n    val have = nums.toHashSet()\n    var p = 1\n    while (have.contains(p)) p *= 2\n    return p\n}`,
        swift: `func minImpossibleOR(_ nums: [Int]) -> Int {\n    let have = Set(nums)\n    var p = 1\n    while have.contains(p) { p *= 2 }\n    return p\n}`,
        rust: `fn minImpossibleOR(nums: Vec<i32>) -> i32 {\n    let have: std::collections::HashSet<i32> = nums.into_iter().collect();\n    let mut p = 1i32;\n    while have.contains(&p) {\n        p *= 2;\n    }\n    p\n}`,
        php: `function minImpossibleOR($nums) {\n    $have = array_flip($nums);\n    $p = 1;\n    while (isset($have[$p])) $p *= 2;\n    return $p;\n}`,
        ruby: `def minImpossibleOR(nums)
  have = {}
  nums.each { |x| have[x] = true }
  pw = 1
  pw *= 2 while have[pw]
  pw
end`,
      },
    };
  })(),

  // ── Minimum Number of Taps to Open to Water a Garden (LC 1326) ──
  (() => {
    const ref = (n: number, ranges: number[]) => {
      const maxReach = new Array(n + 1).fill(0);
      for (let i = 0; i <= n; i++) {
        const l = Math.max(0, i - ranges[i]);
        const r = Math.min(n, i + ranges[i]);
        if (r > maxReach[l]) maxReach[l] = r;
      }
      let taps = 0, curEnd = 0, nxt = 0;
      for (let i = 0; i < n; i++) {
        if (maxReach[i] > nxt) nxt = maxReach[i];
        if (i === curEnd) {
          if (nxt <= i) return -1;
          taps++;
          curEnd = nxt;
        }
      }
      return taps;
    };
    return {
      slug: "minimum-number-of-taps-to-open-to-water-a-garden",
      title: "Minimum Number of Taps to Open to Water a Garden",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Dynamic Programming", "Intervals", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "minTaps", params: [{ name: "n", type: "int" as const }, { name: "ranges", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A garden stretches along the x-axis from `0` to `n`. Tap `i` sits at position `i` and, when opened, waters the closed interval `[i - ranges[i], i + ranges[i]]`.\n\nReturn the minimum number of taps to open so that the whole garden is watered, or `-1` if it is impossible.",
        [
          { in: "n = 5, ranges = [3,4,1,1,0,0]", out: "1", note: "Tap 1 alone waters [-3, 5], which covers the garden." },
          { in: "n = 3, ranges = [0,0,0,0]", out: "-1", note: "Every tap waters only its own point, leaving the gaps dry." },
          { in: "n = 7, ranges = [1,2,1,0,2,1,0,1]", out: "3" },
        ],
        ["1 <= n <= 10000", "ranges.length == n + 1", "0 <= ranges[i] <= 100"]),
      hints: [
        "Turn each tap into the interval it waters, clamped to `[0, n]`.",
        "For each left endpoint, only the interval reaching furthest right matters.",
        "Then it is the standard interval-covering greedy: jump to the furthest reachable point each time.",
      ],
      editorial: explain({
        idea: "Convert the taps into intervals, keep only the furthest reach per starting point, then cover `[0, n]` greedily — from everything already watered, jump to the furthest point any of those taps reaches.",
        steps: [
          "Build `maxReach[l]`, the largest right endpoint among taps whose clamped interval starts at `l`.",
          "Sweep `i` from 0 to `n - 1`, tracking `nxt`, the furthest reach from any start seen so far.",
          "At each boundary `curEnd`, open a tap: if `nxt <= i` there is a dry gap and the answer is `-1`; otherwise count the tap and move the boundary to `nxt`.",
        ],
        why: "Only the furthest-reaching tap per start can be optimal — any other with the same start is contained in it. Committing at each boundary to the furthest reach is the classic covering greedy: delaying cannot reach further, and choosing a shorter interval forces at least as many taps later.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The intervals must be clamped to `[0, n]` before indexing, or a tap with a large range reads out of bounds.",
          "A tap with range 0 waters a single point and can never bridge a gap.",
          "The failure test is `nxt <= i` at a boundary — equality means no progress.",
        ],
      }),
      examples: [
        { input: "5\n[3,4,1,1,0,0]", expectedOutput: "1" },
        { input: "3\n[0,0,0,0]", expectedOutput: "-1" },
        { input: "7\n[1,2,1,0,2,1,0,1]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const ranges = Array.from({ length: n + 1 }, () => (rng() < 0.3 ? 0 : ri(rng, 0, 4)));
        return { input: `${n}\n${fmtIntArr(ranges)}`, expectedOutput: String(ref(n, ranges)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minTaps(n: int, ranges: List[int]) -> int:\n    max_reach = [0] * (n + 1)\n    for i, r in enumerate(ranges):\n        l = max(0, i - r)\n        right = min(n, i + r)\n        max_reach[l] = max(max_reach[l], right)\n    taps = cur_end = nxt = 0\n    for i in range(n):\n        nxt = max(nxt, max_reach[i])\n        if i == cur_end:\n            if nxt <= i:\n                return -1\n            taps += 1\n            cur_end = nxt\n    return taps`,
        javascript: `var minTaps = function(n, ranges) {\n    var maxReach = [];\n    for (var t = 0; t <= n; t++) maxReach.push(0);\n    for (var i = 0; i <= n; i++) {\n        var l = Math.max(0, i - ranges[i]);\n        var r = Math.min(n, i + ranges[i]);\n        if (r > maxReach[l]) maxReach[l] = r;\n    }\n    var taps = 0, curEnd = 0, nxt = 0;\n    for (var j = 0; j < n; j++) {\n        if (maxReach[j] > nxt) nxt = maxReach[j];\n        if (j === curEnd) {\n            if (nxt <= j) return -1;\n            taps++;\n            curEnd = nxt;\n        }\n    }\n    return taps;\n};`,
        typescript: `function minTaps(n: number, ranges: number[]): number {\n    var maxReach: number[] = [];\n    for (var t = 0; t <= n; t++) maxReach.push(0);\n    for (var i = 0; i <= n; i++) {\n        var l = Math.max(0, i - ranges[i]);\n        var r = Math.min(n, i + ranges[i]);\n        if (r > maxReach[l]) maxReach[l] = r;\n    }\n    var taps = 0, curEnd = 0, nxt = 0;\n    for (var j = 0; j < n; j++) {\n        if (maxReach[j] > nxt) nxt = maxReach[j];\n        if (j === curEnd) {\n            if (nxt <= j) return -1;\n            taps++;\n            curEnd = nxt;\n        }\n    }\n    return taps;\n}`,
        java: `public static int minTaps(int n, int[] ranges) {\n    int[] maxReach = new int[n + 1];\n    for (int i = 0; i <= n; i++) {\n        int l = Math.max(0, i - ranges[i]);\n        int r = Math.min(n, i + ranges[i]);\n        maxReach[l] = Math.max(maxReach[l], r);\n    }\n    int taps = 0, curEnd = 0, nxt = 0;\n    for (int i = 0; i < n; i++) {\n        nxt = Math.max(nxt, maxReach[i]);\n        if (i == curEnd) {\n            if (nxt <= i) return -1;\n            taps++;\n            curEnd = nxt;\n        }\n    }\n    return taps;\n}`,
        cpp: `int minTaps(int n, vector<int>& ranges) {\n    vector<int> maxReach(n + 1, 0);\n    for (int i = 0; i <= n; i++) {\n        int l = max(0, i - ranges[i]);\n        int r = min(n, i + ranges[i]);\n        maxReach[l] = max(maxReach[l], r);\n    }\n    int taps = 0, curEnd = 0, nxt = 0;\n    for (int i = 0; i < n; i++) {\n        nxt = max(nxt, maxReach[i]);\n        if (i == curEnd) {\n            if (nxt <= i) return -1;\n            taps++;\n            curEnd = nxt;\n        }\n    }\n    return taps;\n}`,
        c: `int minTaps(int n, int* ranges, int rangesSize) {\n    (void) rangesSize;\n    int* maxReach = (int*) calloc((size_t) n + 1, sizeof(int));\n    for (int i = 0; i <= n; i++) {\n        int l = i - ranges[i];\n        if (l < 0) l = 0;\n        int r = i + ranges[i];\n        if (r > n) r = n;\n        if (r > maxReach[l]) maxReach[l] = r;\n    }\n    int taps = 0, curEnd = 0, nxt = 0;\n    for (int i = 0; i < n; i++) {\n        if (maxReach[i] > nxt) nxt = maxReach[i];\n        if (i == curEnd) {\n            if (nxt <= i) {\n                free(maxReach);\n                return -1;\n            }\n            taps++;\n            curEnd = nxt;\n        }\n    }\n    free(maxReach);\n    return taps;\n}`,
        csharp: `public static int MinTaps(int n, int[] ranges)\n{\n    int[] maxReach = new int[n + 1];\n    for (int i = 0; i <= n; i++)\n    {\n        int l = Math.Max(0, i - ranges[i]);\n        int r = Math.Min(n, i + ranges[i]);\n        maxReach[l] = Math.Max(maxReach[l], r);\n    }\n    int taps = 0, curEnd = 0, nxt = 0;\n    for (int i = 0; i < n; i++)\n    {\n        nxt = Math.Max(nxt, maxReach[i]);\n        if (i == curEnd)\n        {\n            if (nxt <= i) return -1;\n            taps++;\n            curEnd = nxt;\n        }\n    }\n    return taps;\n}`,
        go: `func minTaps(n int, ranges []int) int {\n\tmaxReach := make([]int, n+1)\n\tfor i := 0; i <= n; i++ {\n\t\tl := i - ranges[i]\n\t\tif l < 0 {\n\t\t\tl = 0\n\t\t}\n\t\tr := i + ranges[i]\n\t\tif r > n {\n\t\t\tr = n\n\t\t}\n\t\tif r > maxReach[l] {\n\t\t\tmaxReach[l] = r\n\t\t}\n\t}\n\ttaps, curEnd, nxt := 0, 0, 0\n\tfor i := 0; i < n; i++ {\n\t\tif maxReach[i] > nxt {\n\t\t\tnxt = maxReach[i]\n\t\t}\n\t\tif i == curEnd {\n\t\t\tif nxt <= i {\n\t\t\t\treturn -1\n\t\t\t}\n\t\t\ttaps++\n\t\t\tcurEnd = nxt\n\t\t}\n\t}\n\treturn taps\n}`,
        kotlin: `fun minTaps(n: Int, ranges: IntArray): Int {\n    val maxReach = IntArray(n + 1)\n    for (i in 0..n) {\n        val l = maxOf(0, i - ranges[i])\n        val r = minOf(n, i + ranges[i])\n        maxReach[l] = maxOf(maxReach[l], r)\n    }\n    var taps = 0\n    var curEnd = 0\n    var nxt = 0\n    for (i in 0 until n) {\n        nxt = maxOf(nxt, maxReach[i])\n        if (i == curEnd) {\n            if (nxt <= i) return -1\n            taps++\n            curEnd = nxt\n        }\n    }\n    return taps\n}`,
        swift: `func minTaps(_ n: Int, _ ranges: [Int]) -> Int {\n    var maxReach = [Int](repeating: 0, count: n + 1)\n    for i in 0...n {\n        let l = max(0, i - ranges[i])\n        let r = min(n, i + ranges[i])\n        maxReach[l] = max(maxReach[l], r)\n    }\n    var taps = 0\n    var curEnd = 0\n    var nxt = 0\n    for i in 0..<n {\n        nxt = max(nxt, maxReach[i])\n        if i == curEnd {\n            if nxt <= i { return -1 }\n            taps += 1\n            curEnd = nxt\n        }\n    }\n    return taps\n}`,
        rust: `fn minTaps(n: i32, ranges: Vec<i32>) -> i32 {\n    let nn = n as usize;\n    let mut max_reach = vec![0i32; nn + 1];\n    for i in 0..=nn {\n        let l = std::cmp::max(0, i as i32 - ranges[i]) as usize;\n        let r = std::cmp::min(n, i as i32 + ranges[i]);\n        if r > max_reach[l] {\n            max_reach[l] = r;\n        }\n    }\n    let mut taps = 0i32;\n    let mut cur_end = 0i32;\n    let mut nxt = 0i32;\n    for i in 0..n {\n        if max_reach[i as usize] > nxt {\n            nxt = max_reach[i as usize];\n        }\n        if i == cur_end {\n            if nxt <= i {\n                return -1;\n            }\n            taps += 1;\n            cur_end = nxt;\n        }\n    }\n    taps\n}`,
        php: `function minTaps($n, $ranges) {\n    $maxReach = array_fill(0, $n + 1, 0);\n    for ($i = 0; $i <= $n; $i++) {\n        $l = max(0, $i - $ranges[$i]);\n        $r = min($n, $i + $ranges[$i]);\n        if ($r > $maxReach[$l]) $maxReach[$l] = $r;\n    }\n    $taps = 0;\n    $curEnd = 0;\n    $nxt = 0;\n    for ($i = 0; $i < $n; $i++) {\n        if ($maxReach[$i] > $nxt) $nxt = $maxReach[$i];\n        if ($i === $curEnd) {\n            if ($nxt <= $i) return -1;\n            $taps++;\n            $curEnd = $nxt;\n        }\n    }\n    return $taps;\n}`,
        ruby: `def minTaps(n, ranges)\n  max_reach = Array.new(n + 1, 0)\n  (0..n).each do |i|\n    l = [0, i - ranges[i]].max\n    r = [n, i + ranges[i]].min\n    max_reach[l] = r if r > max_reach[l]\n  end\n  taps = 0\n  cur_end = 0\n  nxt = 0\n  (0...n).each do |i|\n    nxt = max_reach[i] if max_reach[i] > nxt\n    if i == cur_end\n      return -1 if nxt <= i\n      taps += 1\n      cur_end = nxt\n    end\n  end\n  taps\nend`,
      },
    };
  })(),

  // ── IPO (LC 502) ────────────────────────────────────────────────
  (() => {
    const ref = (k: number, w: number, profits: number[], capital: number[]) => {
      const n = profits.length;
      const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => capital[a] - capital[b]);
      const heap: number[] = [];
      const push = (v: number) => {
        heap.push(v);
        let i = heap.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heap[p] >= heap[i]) break;
          const t = heap[p]; heap[p] = heap[i]; heap[i] = t;
          i = p;
        }
      };
      const pop = () => {
        const top = heap[0];
        const last = heap.pop() as number;
        if (heap.length > 0) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = 2 * i + 2;
            let m = i;
            if (l < heap.length && heap[l] > heap[m]) m = l;
            if (r < heap.length && heap[r] > heap[m]) m = r;
            if (m === i) break;
            const t = heap[m]; heap[m] = heap[i]; heap[i] = t;
            i = m;
          }
        }
        return top;
      };
      let ptr = 0, cur = w;
      for (let t = 0; t < k; t++) {
        while (ptr < n && capital[idx[ptr]] <= cur) { push(profits[idx[ptr]]); ptr++; }
        if (heap.length === 0) break;
        cur += pop();
      }
      return cur;
    };
    return {
      slug: "ipo",
      title: "IPO",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Sorting", "Heap", "Amazon", "Google", "Goldman Sachs"],
      signature: { funcName: "findMaximizedCapital", params: [{ name: "k", type: "int" as const }, { name: "w", type: "int" as const }, { name: "profits", type: "int[]" as const }, { name: "capital", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You can finish at most `k` projects before an IPO. Project `i` needs `capital[i]` to start and adds `profits[i]` to your capital when finished (the capital spent is returned, so it is pure profit).\n\nStarting with `w` capital and able to run only one project at a time, return the maximum capital you can end with.",
        [
          { in: "k = 2, w = 0, profits = [1,2,3], capital = [0,1,1]", out: "4", note: "Finish project 0 for 1, then project 2 for 3." },
          { in: "k = 3, w = 0, profits = [1,2,3], capital = [0,1,2]", out: "6", note: "All three become affordable in turn." },
          { in: "k = 1, w = 2, profits = [1,2,3], capital = [1,1,2]", out: "5" },
        ],
        ["1 <= k <= 1000", "0 <= w <= 1000000000", "n == profits.length == capital.length", "1 <= n <= 1000", "0 <= profits[i] <= 10000", "0 <= capital[i] <= 1000000000"]),
      hints: [
        "At each step, take the most profitable project you can currently **afford**.",
        "Sort the projects by required capital, then unlock them as your capital grows.",
        "A max-heap over the unlocked profits gives the best one in logarithmic time.",
      ],
      editorial: explain({
        idea: "Greedy with a max-heap. Capital only grows, so the set of affordable projects only grows too — sort by capital and push newly affordable projects into a max-heap keyed on profit, then always take the heap's top.",
        steps: [
          "Sort the project indices by required capital.",
          "Repeat up to `k` times: push every project whose capital requirement is now met, then pop the largest profit and add it to the capital.",
          "Stop early if no project is affordable.",
        ],
        why: "Taking the most profitable affordable project first is optimal because profits are non-negative, so finishing it never shrinks the affordable set — every project available under any other choice is still available after this one. An exchange argument then turns any optimal schedule into the greedy one. The pointer never moves backwards, so each project is pushed once.",
        time: "O(n log n + k log n)",
        space: "O(n)",
        pitfalls: [
          "Re-scanning all projects for the best affordable one each round is `O(k · n)` — fine at these limits but the heap is the point.",
          "The loop must break when nothing is affordable, or it spins.",
          "The final capital reaches about `10^9 + 10^7`, which still fits `int`.",
        ],
      }),
      examples: [
        { input: "2\n0\n[1,2,3]\n[0,1,1]", expectedOutput: "4" },
        { input: "3\n0\n[1,2,3]\n[0,1,2]", expectedOutput: "6" },
        { input: "1\n2\n[1,2,3]\n[1,1,2]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20);
        const profits = Array.from({ length: n }, () => ri(rng, 0, 10000));
        const capital = Array.from({ length: n }, () => (rng() < 0.5 ? ri(rng, 0, 30) : ri(rng, 0, 1000000000)));
        const k = ri(rng, 1, 12);
        const w = rng() < 0.6 ? ri(rng, 0, 50) : ri(rng, 0, 1000000000);
        return { input: `${k}\n${w}\n${fmtIntArr(profits)}\n${fmtIntArr(capital)}`, expectedOutput: String(ref(k, w, profits, capital)) };
      },
      solutions: {
        python: `import heapq\nfrom typing import List\n\ndef findMaximizedCapital(k: int, w: int, profits: List[int], capital: List[int]) -> int:\n    n = len(profits)\n    order = sorted(range(n), key=lambda i: capital[i])\n    heap = []\n    ptr, cur = 0, w\n    for _ in range(k):\n        while ptr < n and capital[order[ptr]] <= cur:\n            heapq.heappush(heap, -profits[order[ptr]])\n            ptr += 1\n        if not heap:\n            break\n        cur += -heapq.heappop(heap)\n    return cur`,
        javascript: `var findMaximizedCapital = function(k, w, profits, capital) {\n    var n = profits.length;\n    var idx = [];\n    for (var t = 0; t < n; t++) idx.push(t);\n    idx.sort(function(a, b) { return capital[a] - capital[b]; });\n    var heap = [];\n    var push = function(v) {\n        heap.push(v);\n        var i = heap.length - 1;\n        while (i > 0) {\n            var p = (i - 1) >> 1;\n            if (heap[p] >= heap[i]) break;\n            var tmp = heap[p]; heap[p] = heap[i]; heap[i] = tmp;\n            i = p;\n        }\n    };\n    var pop = function() {\n        var top = heap[0];\n        var last = heap.pop();\n        if (heap.length > 0) {\n            heap[0] = last;\n            var i = 0;\n            while (true) {\n                var l = 2 * i + 1, r = 2 * i + 2, m = i;\n                if (l < heap.length && heap[l] > heap[m]) m = l;\n                if (r < heap.length && heap[r] > heap[m]) m = r;\n                if (m === i) break;\n                var tmp2 = heap[m]; heap[m] = heap[i]; heap[i] = tmp2;\n                i = m;\n            }\n        }\n        return top;\n    };\n    var ptr = 0, cur = w;\n    for (var s = 0; s < k; s++) {\n        while (ptr < n && capital[idx[ptr]] <= cur) { push(profits[idx[ptr]]); ptr++; }\n        if (heap.length === 0) break;\n        cur += pop();\n    }\n    return cur;\n};`,
        typescript: `function findMaximizedCapital(k: number, w: number, profits: number[], capital: number[]): number {\n    var n = profits.length;\n    var idx: number[] = [];\n    for (var t = 0; t < n; t++) idx.push(t);\n    idx.sort(function(a, b) { return capital[a] - capital[b]; });\n    var heap: number[] = [];\n    var push = function(v: number): void {\n        heap.push(v);\n        var i = heap.length - 1;\n        while (i > 0) {\n            var p = (i - 1) >> 1;\n            if (heap[p] >= heap[i]) break;\n            var tmp = heap[p]; heap[p] = heap[i]; heap[i] = tmp;\n            i = p;\n        }\n    };\n    var pop = function(): number {\n        var top = heap[0];\n        var last = heap.pop() as number;\n        if (heap.length > 0) {\n            heap[0] = last;\n            var i = 0;\n            while (true) {\n                var l = 2 * i + 1, r = 2 * i + 2, m = i;\n                if (l < heap.length && heap[l] > heap[m]) m = l;\n                if (r < heap.length && heap[r] > heap[m]) m = r;\n                if (m === i) break;\n                var tmp2 = heap[m]; heap[m] = heap[i]; heap[i] = tmp2;\n                i = m;\n            }\n        }\n        return top;\n    };\n    var ptr = 0, cur = w;\n    for (var s = 0; s < k; s++) {\n        while (ptr < n && capital[idx[ptr]] <= cur) { push(profits[idx[ptr]]); ptr++; }\n        if (heap.length === 0) break;\n        cur += pop();\n    }\n    return cur;\n}`,
        java: `public static int findMaximizedCapital(int k, int w, int[] profits, int[] capital) {\n    int n = profits.length;\n    Integer[] idx = new Integer[n];\n    for (int i = 0; i < n; i++) idx[i] = i;\n    Arrays.sort(idx, (a, b) -> Integer.compare(capital[a], capital[b]));\n    PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());\n    int ptr = 0;\n    long cur = w;\n    for (int t = 0; t < k; t++) {\n        while (ptr < n && capital[idx[ptr]] <= cur) {\n            heap.offer(profits[idx[ptr]]);\n            ptr++;\n        }\n        if (heap.isEmpty()) break;\n        cur += heap.poll();\n    }\n    return (int) cur;\n}`,
        cpp: `int findMaximizedCapital(int k, int w, vector<int>& profits, vector<int>& capital) {\n    int n = (int) profits.size();\n    vector<int> idx(n);\n    for (int i = 0; i < n; i++) idx[i] = i;\n    sort(idx.begin(), idx.end(), [&](int a, int b) { return capital[a] < capital[b]; });\n    priority_queue<int> heap;\n    int ptr = 0;\n    long long cur = w;\n    for (int t = 0; t < k; t++) {\n        while (ptr < n && capital[idx[ptr]] <= cur) {\n            heap.push(profits[idx[ptr]]);\n            ptr++;\n        }\n        if (heap.empty()) break;\n        cur += heap.top();\n        heap.pop();\n    }\n    return (int) cur;\n}`,
        c: `static int* ipoCapital;\n\nstatic int cmpByCapital(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (ipoCapital[x] > ipoCapital[y]) - (ipoCapital[x] < ipoCapital[y]);\n}\n\nint findMaximizedCapital(int k, int w, int* profits, int profitsSize, int* capital, int capitalSize) {\n    (void) capitalSize;\n    int n = profitsSize;\n    ipoCapital = capital;\n    int* idx = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) idx[i] = i;\n    qsort(idx, (size_t) n, sizeof(int), cmpByCapital);\n    int* heap = (int*) malloc((size_t) n * sizeof(int));\n    int hn = 0, ptr = 0;\n    long long cur = w;\n    for (int t = 0; t < k; t++) {\n        while (ptr < n && (long long) capital[idx[ptr]] <= cur) {\n            heap[hn] = profits[idx[ptr]];\n            int i = hn++;\n            while (i > 0) {\n                int p = (i - 1) / 2;\n                if (heap[p] >= heap[i]) break;\n                int tmp = heap[p]; heap[p] = heap[i]; heap[i] = tmp;\n                i = p;\n            }\n            ptr++;\n        }\n        if (hn == 0) break;\n        cur += heap[0];\n        heap[0] = heap[--hn];\n        int i = 0;\n        while (1) {\n            int l = 2 * i + 1, r = 2 * i + 2, m = i;\n            if (l < hn && heap[l] > heap[m]) m = l;\n            if (r < hn && heap[r] > heap[m]) m = r;\n            if (m == i) break;\n            int tmp = heap[m]; heap[m] = heap[i]; heap[i] = tmp;\n            i = m;\n        }\n    }\n    free(idx);\n    free(heap);\n    return (int) cur;\n}`,
        csharp: `public static int FindMaximizedCapital(int k, int w, int[] profits, int[] capital)\n{\n    int n = profits.Length;\n    int[] idx = new int[n];\n    for (int i = 0; i < n; i++) idx[i] = i;\n    Array.Sort(idx, (a, b) => capital[a].CompareTo(capital[b]));\n    // A sorted list stands in for a max-heap: the largest profit is at the end.\n    var avail = new List<int>();\n    int ptr = 0;\n    long cur = w;\n    for (int t = 0; t < k; t++)\n    {\n        while (ptr < n && capital[idx[ptr]] <= cur)\n        {\n            int v = profits[idx[ptr]];\n            int lo = 0, hi = avail.Count;\n            while (lo < hi)\n            {\n                int mid = (lo + hi) / 2;\n                if (avail[mid] < v) lo = mid + 1; else hi = mid;\n            }\n            avail.Insert(lo, v);\n            ptr++;\n        }\n        if (avail.Count == 0) break;\n        cur += avail[avail.Count - 1];\n        avail.RemoveAt(avail.Count - 1);\n    }\n    return (int) cur;\n}`,
        go: `func findMaximizedCapital(k int, w int, profits []int, capital []int) int {\n\tn := len(profits)\n\tidx := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tidx[i] = i\n\t}\n\tsort.Slice(idx, func(a, b int) bool { return capital[idx[a]] < capital[idx[b]] })\n\t// A sorted slice stands in for a max-heap: the largest profit is at the end.\n\tavail := []int{}\n\tptr, cur := 0, w\n\tfor t := 0; t < k; t++ {\n\t\tfor ptr < n && capital[idx[ptr]] <= cur {\n\t\t\tv := profits[idx[ptr]]\n\t\t\tpos := sort.SearchInts(avail, v)\n\t\t\tavail = append(avail, 0)\n\t\t\tcopy(avail[pos+1:], avail[pos:])\n\t\t\tavail[pos] = v\n\t\t\tptr++\n\t\t}\n\t\tif len(avail) == 0 {\n\t\t\tbreak\n\t\t}\n\t\tcur += avail[len(avail)-1]\n\t\tavail = avail[:len(avail)-1]\n\t}\n\treturn cur\n}`,
        kotlin: `fun findMaximizedCapital(k: Int, w: Int, profits: IntArray, capital: IntArray): Int {\n    val n = profits.size\n    val idx = (0 until n).sortedBy { capital[it] }\n    val heap = java.util.PriorityQueue<Int>(compareByDescending { it })\n    var ptr = 0\n    var cur = w.toLong()\n    for (t in 0 until k) {\n        while (ptr < n && capital[idx[ptr]] <= cur) {\n            heap.offer(profits[idx[ptr]])\n            ptr++\n        }\n        if (heap.isEmpty()) break\n        cur += heap.poll()\n    }\n    return cur.toInt()\n}`,
        swift: `func findMaximizedCapital(_ k: Int, _ w: Int, _ profits: [Int], _ capital: [Int]) -> Int {\n    let n = profits.count\n    let idx = (0..<n).sorted { capital[$0] < capital[$1] }\n    // A sorted array stands in for a max-heap: the largest profit is at the end.\n    var avail = [Int]()\n    var ptr = 0\n    var cur = w\n    for _ in 0..<k {\n        while ptr < n && capital[idx[ptr]] <= cur {\n            let v = profits[idx[ptr]]\n            var lo = 0\n            var hi = avail.count\n            while lo < hi {\n                let mid = (lo + hi) / 2\n                if avail[mid] < v { lo = mid + 1 } else { hi = mid }\n            }\n            avail.insert(v, at: lo)\n            ptr += 1\n        }\n        if avail.isEmpty { break }\n        cur += avail.removeLast()\n    }\n    return cur\n}`,
        rust: `fn findMaximizedCapital(k: i32, w: i32, profits: Vec<i32>, capital: Vec<i32>) -> i32 {\n    let n = profits.len();\n    let mut idx: Vec<usize> = (0..n).collect();\n    idx.sort_by_key(|&i| capital[i]);\n    let mut heap: std::collections::BinaryHeap<i32> = std::collections::BinaryHeap::new();\n    let mut ptr = 0usize;\n    let mut cur: i64 = w as i64;\n    for _ in 0..k {\n        while ptr < n && capital[idx[ptr]] as i64 <= cur {\n            heap.push(profits[idx[ptr]]);\n            ptr += 1;\n        }\n        match heap.pop() {\n            Some(v) => cur += v as i64,\n            None => break,\n        }\n    }\n    cur as i32\n}`,
        php: `function findMaximizedCapital($k, $w, $profits, $capital) {\n    $n = count($profits);\n    $idx = range(0, $n - 1);\n    usort($idx, function($a, $b) use ($capital) { return $capital[$a] - $capital[$b]; });\n    $heap = new SplMaxHeap();\n    $ptr = 0;\n    $cur = $w;\n    for ($t = 0; $t < $k; $t++) {\n        while ($ptr < $n && $capital[$idx[$ptr]] <= $cur) {\n            $heap->insert($profits[$idx[$ptr]]);\n            $ptr++;\n        }\n        if ($heap->isEmpty()) break;\n        $cur += $heap->extract();\n    }\n    return $cur;\n}`,
        ruby: `def findMaximizedCapital(k, w, profits, capital)\n  n = profits.length\n  idx = (0...n).sort_by { |i| capital[i] }\n  # A sorted array stands in for a max-heap: the largest profit is at the end.\n  avail = []\n  ptr = 0\n  cur = w\n  k.times do\n    while ptr < n && capital[idx[ptr]] <= cur\n      v = profits[idx[ptr]]\n      lo = 0\n      hi = avail.length\n      while lo < hi\n        mid = (lo + hi) / 2\n        if avail[mid] < v\n          lo = mid + 1\n        else\n          hi = mid\n        end\n      end\n      avail.insert(lo, v)\n      ptr += 1\n    end\n    break if avail.empty?\n    cur += avail.pop\n  end\n  cur\nend`,
      },
    };
  })(),

  // ── Minimum Number of Refueling Stops (LC 871) ──────────────────
  (() => {
    const ref = (target: number, startFuel: number, stations: number[][]) => {
      const heap: number[] = [];
      const push = (v: number) => {
        heap.push(v);
        let i = heap.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heap[p] >= heap[i]) break;
          const t = heap[p]; heap[p] = heap[i]; heap[i] = t;
          i = p;
        }
      };
      const pop = () => {
        const top = heap[0];
        const last = heap.pop() as number;
        if (heap.length > 0) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = 2 * i + 2;
            let m = i;
            if (l < heap.length && heap[l] > heap[m]) m = l;
            if (r < heap.length && heap[r] > heap[m]) m = r;
            if (m === i) break;
            const t = heap[m]; heap[m] = heap[i]; heap[i] = t;
            i = m;
          }
        }
        return top;
      };
      let fuel = startFuel, stops = 0, i = 0;
      while (fuel < target) {
        while (i < stations.length && stations[i][0] <= fuel) { push(stations[i][1]); i++; }
        if (heap.length === 0) return -1;
        fuel += pop();
        stops++;
      }
      return stops;
    };
    return {
      slug: "minimum-number-of-refueling-stops",
      title: "Minimum Number of Refueling Stops",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Dynamic Programming", "Heap", "Amazon", "Google", "Uber"],
      signature: { funcName: "minRefuelStops", params: [{ name: "target", type: "int" as const }, { name: "startFuel", type: "int" as const }, { name: "stations", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A car drives from position 0 to position `target` with infinite tank capacity, starting with `startFuel` litres and using one litre per unit of distance.\n\n`stations[i] = [position_i, fuel_i]` lists the gas stations **in increasing order of position**; stopping at one transfers all its fuel into the tank. Return the minimum number of stops needed to reach the target, or `-1` if it is impossible.",
        [
          { in: "target = 1, startFuel = 1, stations = [[5,100]]", out: "0", note: "The car already has enough fuel." },
          { in: "target = 100, startFuel = 1, stations = [[10,100]]", out: "-1", note: "The car cannot even reach the first station." },
          { in: "target = 100, startFuel = 10, stations = [[10,60],[20,30],[30,30],[60,40]]", out: "2", note: "Refuel at positions 10 and 60." },
        ],
        ["1 <= target, startFuel <= 1000000000", "0 <= stations.length <= 500", "0 < position_i <= position_{i+1} < target", "1 <= fuel_i < 1000000000"]),
      hints: [
        "You do not have to decide to stop when you pass a station — you can decide retroactively.",
        "Drive as far as the fuel allows, collecting the passed stations into a max-heap.",
        "When you run short, 'go back' and take the largest fuel amount you passed.",
      ],
      editorial: explain({
        idea: "Defer the decision. Drive forward, remembering every station passed in a max-heap keyed on fuel. When the tank cannot reach further, retroactively refuel at the biggest station already passed — that is always the best single stop to have made.",
        steps: [
          "Track the furthest reachable position `fuel` (the car starts at 0).",
          "Push every station at or before `fuel` into a max-heap.",
          "While `fuel < target`, pop the largest fuel amount, add it, and count a stop; if the heap is empty the target is unreachable.",
        ],
        why: "Exchange argument: if an optimal solution uses `m` stops, then after any prefix of driving, the greedy's reachable distance is at least the optimal's — because the greedy has always taken the `j` largest fuel amounts among the stations passed, which dominates any other choice of `j`. So the greedy never needs more stops.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Deciding at each station whether to stop, without look-ahead, is wrong — the choice depends on what comes later.",
          "`fuel` tracks the furthest reachable *position*, not the litres left in the tank; they coincide because one litre covers one unit.",
          "An empty station list is legal; the answer is 0 when `startFuel >= target` and `-1` otherwise.",
        ],
      }),
      examples: [
        { input: "1\n1\n[[5,100]]", expectedOutput: "0" },
        { input: "100\n1\n[[10,100]]", expectedOutput: "-1" },
        { input: "100\n10\n[[10,60],[20,30],[30,30],[60,40]]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const target = ri(rng, 2, 400);
        const startFuel = ri(rng, 1, 120);
        const count = ri(rng, 1, 10);
        const positions: number[] = [];
        for (let i = 0; i < count; i++) positions.push(ri(rng, 1, target - 1));
        positions.sort((a, b) => a - b);
        const stations = positions.map((p) => [p, ri(rng, 1, 120)]);
        return { input: `${target}\n${startFuel}\n${fmtIntMat(stations)}`, expectedOutput: String(ref(target, startFuel, stations)) };
      },
      solutions: {
        python: `import heapq\nfrom typing import List\n\ndef minRefuelStops(target: int, startFuel: int, stations: List[List[int]]) -> int:\n    heap = []\n    fuel, stops, i = startFuel, 0, 0\n    while fuel < target:\n        while i < len(stations) and stations[i][0] <= fuel:\n            heapq.heappush(heap, -stations[i][1])\n            i += 1\n        if not heap:\n            return -1\n        fuel += -heapq.heappop(heap)\n        stops += 1\n    return stops`,
        javascript: `var minRefuelStops = function(target, startFuel, stations) {\n    var heap = [];\n    var push = function(v) {\n        heap.push(v);\n        var i = heap.length - 1;\n        while (i > 0) {\n            var p = (i - 1) >> 1;\n            if (heap[p] >= heap[i]) break;\n            var tmp = heap[p]; heap[p] = heap[i]; heap[i] = tmp;\n            i = p;\n        }\n    };\n    var pop = function() {\n        var top = heap[0];\n        var last = heap.pop();\n        if (heap.length > 0) {\n            heap[0] = last;\n            var i = 0;\n            while (true) {\n                var l = 2 * i + 1, r = 2 * i + 2, m = i;\n                if (l < heap.length && heap[l] > heap[m]) m = l;\n                if (r < heap.length && heap[r] > heap[m]) m = r;\n                if (m === i) break;\n                var tmp2 = heap[m]; heap[m] = heap[i]; heap[i] = tmp2;\n                i = m;\n            }\n        }\n        return top;\n    };\n    var fuel = startFuel, stops = 0, j = 0;\n    while (fuel < target) {\n        while (j < stations.length && stations[j][0] <= fuel) { push(stations[j][1]); j++; }\n        if (heap.length === 0) return -1;\n        fuel += pop();\n        stops++;\n    }\n    return stops;\n};`,
        typescript: `function minRefuelStops(target: number, startFuel: number, stations: number[][]): number {\n    var heap: number[] = [];\n    var push = function(v: number): void {\n        heap.push(v);\n        var i = heap.length - 1;\n        while (i > 0) {\n            var p = (i - 1) >> 1;\n            if (heap[p] >= heap[i]) break;\n            var tmp = heap[p]; heap[p] = heap[i]; heap[i] = tmp;\n            i = p;\n        }\n    };\n    var pop = function(): number {\n        var top = heap[0];\n        var last = heap.pop() as number;\n        if (heap.length > 0) {\n            heap[0] = last;\n            var i = 0;\n            while (true) {\n                var l = 2 * i + 1, r = 2 * i + 2, m = i;\n                if (l < heap.length && heap[l] > heap[m]) m = l;\n                if (r < heap.length && heap[r] > heap[m]) m = r;\n                if (m === i) break;\n                var tmp2 = heap[m]; heap[m] = heap[i]; heap[i] = tmp2;\n                i = m;\n            }\n        }\n        return top;\n    };\n    var fuel = startFuel, stops = 0, j = 0;\n    while (fuel < target) {\n        while (j < stations.length && stations[j][0] <= fuel) { push(stations[j][1]); j++; }\n        if (heap.length === 0) return -1;\n        fuel += pop();\n        stops++;\n    }\n    return stops;\n}`,
        java: `public static int minRefuelStops(int target, int startFuel, int[][] stations) {\n    PriorityQueue<Integer> heap = new PriorityQueue<>(Collections.reverseOrder());\n    long fuel = startFuel;\n    int stops = 0, i = 0;\n    while (fuel < target) {\n        while (i < stations.length && stations[i][0] <= fuel) {\n            heap.offer(stations[i][1]);\n            i++;\n        }\n        if (heap.isEmpty()) return -1;\n        fuel += heap.poll();\n        stops++;\n    }\n    return stops;\n}`,
        cpp: `int minRefuelStops(int target, int startFuel, vector<vector<int>>& stations) {\n    priority_queue<int> heap;\n    long long fuel = startFuel;\n    int stops = 0, i = 0;\n    while (fuel < target) {\n        while (i < (int) stations.size() && stations[i][0] <= fuel) {\n            heap.push(stations[i][1]);\n            i++;\n        }\n        if (heap.empty()) return -1;\n        fuel += heap.top();\n        heap.pop();\n        stops++;\n    }\n    return stops;\n}`,
        c: `int minRefuelStops(int target, int startFuel, int** stations, int stationsSize, int* stationsColSize) {\n    (void) stationsColSize;\n    int* heap = (int*) malloc((size_t) (stationsSize + 1) * sizeof(int));\n    int hn = 0;\n    long long fuel = startFuel;\n    int stops = 0, i = 0;\n    while (fuel < (long long) target) {\n        while (i < stationsSize && (long long) stations[i][0] <= fuel) {\n            heap[hn] = stations[i][1];\n            int j = hn++;\n            while (j > 0) {\n                int p = (j - 1) / 2;\n                if (heap[p] >= heap[j]) break;\n                int tmp = heap[p]; heap[p] = heap[j]; heap[j] = tmp;\n                j = p;\n            }\n            i++;\n        }\n        if (hn == 0) {\n            free(heap);\n            return -1;\n        }\n        fuel += heap[0];\n        heap[0] = heap[--hn];\n        int j = 0;\n        while (1) {\n            int l = 2 * j + 1, r = 2 * j + 2, m = j;\n            if (l < hn && heap[l] > heap[m]) m = l;\n            if (r < hn && heap[r] > heap[m]) m = r;\n            if (m == j) break;\n            int tmp = heap[m]; heap[m] = heap[j]; heap[j] = tmp;\n            j = m;\n        }\n        stops++;\n    }\n    free(heap);\n    return stops;\n}`,
        csharp: `public static int MinRefuelStops(int target, int startFuel, int[][] stations)\n{\n    // A sorted list stands in for a max-heap: the largest tank is at the end.\n    var avail = new List<int>();\n    long fuel = startFuel;\n    int stops = 0, i = 0;\n    while (fuel < target)\n    {\n        while (i < stations.Length && stations[i][0] <= fuel)\n        {\n            int v = stations[i][1];\n            int lo = 0, hi = avail.Count;\n            while (lo < hi)\n            {\n                int mid = (lo + hi) / 2;\n                if (avail[mid] < v) lo = mid + 1; else hi = mid;\n            }\n            avail.Insert(lo, v);\n            i++;\n        }\n        if (avail.Count == 0) return -1;\n        fuel += avail[avail.Count - 1];\n        avail.RemoveAt(avail.Count - 1);\n        stops++;\n    }\n    return stops;\n}`,
        go: `func minRefuelStops(target int, startFuel int, stations [][]int) int {\n\t// A sorted slice stands in for a max-heap: the largest tank is at the end.\n\tavail := []int{}\n\tfuel, stops, i := startFuel, 0, 0\n\tfor fuel < target {\n\t\tfor i < len(stations) && stations[i][0] <= fuel {\n\t\t\tv := stations[i][1]\n\t\t\tpos := sort.SearchInts(avail, v)\n\t\t\tavail = append(avail, 0)\n\t\t\tcopy(avail[pos+1:], avail[pos:])\n\t\t\tavail[pos] = v\n\t\t\ti++\n\t\t}\n\t\tif len(avail) == 0 {\n\t\t\treturn -1\n\t\t}\n\t\tfuel += avail[len(avail)-1]\n\t\tavail = avail[:len(avail)-1]\n\t\tstops++\n\t}\n\treturn stops\n}`,
        kotlin: `fun minRefuelStops(target: Int, startFuel: Int, stations: Array<IntArray>): Int {\n    val heap = java.util.PriorityQueue<Int>(compareByDescending { it })\n    var fuel = startFuel.toLong()\n    var stops = 0\n    var i = 0\n    while (fuel < target) {\n        while (i < stations.size && stations[i][0] <= fuel) {\n            heap.offer(stations[i][1])\n            i++\n        }\n        if (heap.isEmpty()) return -1\n        fuel += heap.poll()\n        stops++\n    }\n    return stops\n}`,
        swift: `func minRefuelStops(_ target: Int, _ startFuel: Int, _ stations: [[Int]]) -> Int {\n    // A sorted array stands in for a max-heap: the largest tank is at the end.\n    var avail = [Int]()\n    var fuel = startFuel\n    var stops = 0\n    var i = 0\n    while fuel < target {\n        while i < stations.count && stations[i][0] <= fuel {\n            let v = stations[i][1]\n            var lo = 0\n            var hi = avail.count\n            while lo < hi {\n                let mid = (lo + hi) / 2\n                if avail[mid] < v { lo = mid + 1 } else { hi = mid }\n            }\n            avail.insert(v, at: lo)\n            i += 1\n        }\n        if avail.isEmpty { return -1 }\n        fuel += avail.removeLast()\n        stops += 1\n    }\n    return stops\n}`,
        rust: `fn minRefuelStops(target: i32, startFuel: i32, stations: Vec<Vec<i32>>) -> i32 {\n    let mut heap: std::collections::BinaryHeap<i32> = std::collections::BinaryHeap::new();\n    let mut fuel: i64 = startFuel as i64;\n    let mut stops = 0i32;\n    let mut i = 0usize;\n    while fuel < target as i64 {\n        while i < stations.len() && stations[i][0] as i64 <= fuel {\n            heap.push(stations[i][1]);\n            i += 1;\n        }\n        match heap.pop() {\n            Some(v) => {\n                fuel += v as i64;\n                stops += 1;\n            }\n            None => return -1,\n        }\n    }\n    stops\n}`,
        php: `function minRefuelStops($target, $startFuel, $stations) {\n    $heap = new SplMaxHeap();\n    $fuel = $startFuel;\n    $stops = 0;\n    $i = 0;\n    while ($fuel < $target) {\n        while ($i < count($stations) && $stations[$i][0] <= $fuel) {\n            $heap->insert($stations[$i][1]);\n            $i++;\n        }\n        if ($heap->isEmpty()) return -1;\n        $fuel += $heap->extract();\n        $stops++;\n    }\n    return $stops;\n}`,
        ruby: `def minRefuelStops(target, startFuel, stations)\n  # A sorted array stands in for a max-heap: the largest tank is at the end.\n  avail = []\n  fuel = startFuel\n  stops = 0\n  i = 0\n  while fuel < target\n    while i < stations.length && stations[i][0] <= fuel\n      v = stations[i][1]\n      lo = 0\n      hi = avail.length\n      while lo < hi\n        mid = (lo + hi) / 2\n        if avail[mid] < v\n          lo = mid + 1\n        else\n          hi = mid\n        end\n      end\n      avail.insert(lo, v)\n      i += 1\n    end\n    return -1 if avail.empty?\n    fuel += avail.pop\n    stops += 1\n  end\n  stops\nend`,
      },
    };
  })(),

  // ── Minimum Time to Complete All Tasks (LC 2589) ────────────────
  (() => {
    const ref = (tasks: number[][]) => {
      const t = tasks.slice().sort((a, b) => a[1] - b[1]);
      const on = new Array(2002).fill(false);
      let total = 0;
      for (let idx = 0; idx < t.length; idx++) {
        const s = t[idx][0], e = t[idx][1];
        let d = t[idx][2];
        for (let x = s; x <= e; x++) if (on[x]) d--;
        for (let x = e; d > 0; x--) {
          if (!on[x]) { on[x] = true; total++; d--; }
        }
      }
      return total;
    };
    return {
      slug: "minimum-time-to-complete-all-tasks",
      title: "Minimum Time to Complete All Tasks",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Google", "Rubrik"],
      signature: { funcName: "findMinimumTime", params: [{ name: "tasks", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`tasks[i] = [start_i, end_i, duration_i]` means task `i` must run for `duration_i` **whole seconds**, each of them inside the inclusive range `[start_i, end_i]` (not necessarily consecutive).\n\nThe computer may run any number of tasks at the same time. Return the minimum number of seconds the computer has to be switched on.",
        [
          { in: "tasks = [[2,3,1],[4,5,1],[1,5,2]]", out: "2", note: "Running at seconds 2 and 5 covers everything." },
          { in: "tasks = [[1,3,2],[2,5,3],[5,6,2]]", out: "4" },
          { in: "tasks = [[1,1,1]]", out: "1" },
        ],
        ["1 <= tasks.length <= 2000", "1 <= start_i <= end_i <= 2000", "1 <= duration_i <= end_i - start_i + 1"]),
      hints: [
        "Sort the tasks by their deadline, then satisfy each one using seconds as late as possible.",
        "Seconds already switched on for earlier tasks count towards the current one for free.",
        "Turning on the latest available seconds maximises the chance that later tasks can reuse them.",
      ],
      editorial: explain({
        idea: "Process tasks in order of deadline, and pay for each one as late as possible. Late seconds are the most likely to fall inside the windows of the tasks still to come, so they get reused most often.",
        steps: [
          "Sort the tasks by `end`.",
          "For each task, count how many seconds in `[start, end]` are already on and subtract them from its duration.",
          "For whatever is still needed, switch on the latest free seconds in the window, walking backwards from `end`.",
        ],
        why: "Exchange argument: take an optimal schedule and the earliest task by deadline. Any second it uses can be swapped for a later free second inside its window without breaking it, and a later second is contained in at least as many future windows — because the tasks are processed in deadline order, every later task's window extends at least as far right. Repeating the swap turns the optimal schedule into the greedy one.",
        time: "O(n · T) where T is the time range",
        space: "O(T)",
        pitfalls: [
          "Sorting by start time instead of by deadline breaks the exchange argument.",
          "Seconds already on must be *counted*, not re-paid.",
          "Filling from the start of the window instead of the end wastes reuse and over-counts.",
        ],
      }),
      examples: [
        { input: "[[2,3,1],[4,5,1],[1,5,2]]", expectedOutput: "2" },
        { input: "[[1,3,2],[2,5,3],[5,6,2]]", expectedOutput: "4" },
        { input: "[[1,1,1]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const tasks = Array.from({ length: ri(rng, 1, 14) }, () => {
          const s = ri(rng, 1, 40);
          const e = s + ri(rng, 0, 12);
          const d = ri(rng, 1, e - s + 1);
          return [s, e, d];
        });
        return { input: fmtIntMat(tasks), expectedOutput: String(ref(tasks)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findMinimumTime(tasks: List[List[int]]) -> int:\n    t = sorted(tasks, key=lambda x: x[1])\n    on = [False] * 2002\n    total = 0\n    for s, e, d in t:\n        for x in range(s, e + 1):\n            if on[x]:\n                d -= 1\n        x = e\n        while d > 0:\n            if not on[x]:\n                on[x] = True\n                total += 1\n                d -= 1\n            x -= 1\n    return total`,
        javascript: `var findMinimumTime = function(tasks) {\n    var t = tasks.slice().sort(function(a, b) { return a[1] - b[1]; });\n    var on = [];\n    for (var i = 0; i < 2002; i++) on.push(false);\n    var total = 0;\n    for (var k = 0; k < t.length; k++) {\n        var s = t[k][0], e = t[k][1], d = t[k][2], x;\n        for (x = s; x <= e; x++) if (on[x]) d--;\n        for (x = e; d > 0; x--) {\n            if (!on[x]) { on[x] = true; total++; d--; }\n        }\n    }\n    return total;\n};`,
        typescript: `function findMinimumTime(tasks: number[][]): number {\n    var t = tasks.slice().sort(function(a, b) { return a[1] - b[1]; });\n    var on: boolean[] = [];\n    for (var i = 0; i < 2002; i++) on.push(false);\n    var total = 0;\n    for (var k = 0; k < t.length; k++) {\n        var s = t[k][0], e = t[k][1], d = t[k][2], x: number;\n        for (x = s; x <= e; x++) if (on[x]) d--;\n        for (x = e; d > 0; x--) {\n            if (!on[x]) { on[x] = true; total++; d--; }\n        }\n    }\n    return total;\n}`,
        java: `public static int findMinimumTime(int[][] tasks) {\n    int[][] t = tasks.clone();\n    Arrays.sort(t, (a, b) -> Integer.compare(a[1], b[1]));\n    boolean[] on = new boolean[2002];\n    int total = 0;\n    for (int[] task : t) {\n        int s = task[0], e = task[1], d = task[2];\n        for (int x = s; x <= e; x++) if (on[x]) d--;\n        for (int x = e; d > 0; x--) {\n            if (!on[x]) {\n                on[x] = true;\n                total++;\n                d--;\n            }\n        }\n    }\n    return total;\n}`,
        cpp: `int findMinimumTime(vector<vector<int>>& tasks) {\n    vector<vector<int>> t = tasks;\n    sort(t.begin(), t.end(), [](const vector<int>& a, const vector<int>& b) { return a[1] < b[1]; });\n    vector<bool> on(2002, false);\n    int total = 0;\n    for (auto& task : t) {\n        int s = task[0], e = task[1], d = task[2];\n        for (int x = s; x <= e; x++) if (on[x]) d--;\n        for (int x = e; d > 0; x--) {\n            if (!on[x]) {\n                on[x] = true;\n                total++;\n                d--;\n            }\n        }\n    }\n    return total;\n}`,
        c: `static int cmpTaskEnd(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    return (x[1] > y[1]) - (x[1] < y[1]);\n}\n\nint findMinimumTime(int** tasks, int tasksSize, int* tasksColSize) {\n    (void) tasksColSize;\n    int** t = (int**) malloc((size_t) tasksSize * sizeof(int*));\n    for (int i = 0; i < tasksSize; i++) t[i] = tasks[i];\n    qsort(t, (size_t) tasksSize, sizeof(int*), cmpTaskEnd);\n    char on[2002];\n    for (int i = 0; i < 2002; i++) on[i] = 0;\n    int total = 0;\n    for (int i = 0; i < tasksSize; i++) {\n        int s = t[i][0], e = t[i][1], d = t[i][2];\n        for (int x = s; x <= e; x++) if (on[x]) d--;\n        for (int x = e; d > 0; x--) {\n            if (!on[x]) {\n                on[x] = 1;\n                total++;\n                d--;\n            }\n        }\n    }\n    free(t);\n    return total;\n}`,
        csharp: `public static int FindMinimumTime(int[][] tasks)\n{\n    var t = (int[][]) tasks.Clone();\n    Array.Sort(t, (a, b) => a[1].CompareTo(b[1]));\n    bool[] on = new bool[2002];\n    int total = 0;\n    foreach (var task in t)\n    {\n        int s = task[0], e = task[1], d = task[2];\n        for (int x = s; x <= e; x++) if (on[x]) d--;\n        for (int x = e; d > 0; x--)\n        {\n            if (!on[x])\n            {\n                on[x] = true;\n                total++;\n                d--;\n            }\n        }\n    }\n    return total;\n}`,
        go: `func findMinimumTime(tasks [][]int) int {\n\tt := make([][]int, len(tasks))\n\tcopy(t, tasks)\n\tsort.Slice(t, func(a, b int) bool { return t[a][1] < t[b][1] })\n\ton := make([]bool, 2002)\n\ttotal := 0\n\tfor _, task := range t {\n\t\ts, e, d := task[0], task[1], task[2]\n\t\tfor x := s; x <= e; x++ {\n\t\t\tif on[x] {\n\t\t\t\td--\n\t\t\t}\n\t\t}\n\t\tfor x := e; d > 0; x-- {\n\t\t\tif !on[x] {\n\t\t\t\ton[x] = true\n\t\t\t\ttotal++\n\t\t\t\td--\n\t\t\t}\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun findMinimumTime(tasks: Array<IntArray>): Int {\n    val t = tasks.copyOf()\n    t.sortWith(Comparator { a, b -> a[1].compareTo(b[1]) })\n    val on = BooleanArray(2002)\n    var total = 0\n    for (task in t) {\n        val s = task[0]\n        val e = task[1]\n        var d = task[2]\n        for (x in s..e) if (on[x]) d--\n        var x = e\n        while (d > 0) {\n            if (!on[x]) {\n                on[x] = true\n                total++\n                d--\n            }\n            x--\n        }\n    }\n    return total\n}`,
        swift: `func findMinimumTime(_ tasks: [[Int]]) -> Int {\n    let t = tasks.sorted { $0[1] < $1[1] }\n    var on = [Bool](repeating: false, count: 2002)\n    var total = 0\n    for task in t {\n        let s = task[0]\n        let e = task[1]\n        var d = task[2]\n        for x in s...e where on[x] { d -= 1 }\n        var x = e\n        while d > 0 {\n            if !on[x] {\n                on[x] = true\n                total += 1\n                d -= 1\n            }\n            x -= 1\n        }\n    }\n    return total\n}`,
        rust: `fn findMinimumTime(tasks: Vec<Vec<i32>>) -> i32 {\n    let mut t = tasks.clone();\n    t.sort_by_key(|x| x[1]);\n    let mut on = vec![false; 2002];\n    let mut total = 0i32;\n    for task in t.iter() {\n        let s = task[0] as usize;\n        let e = task[1] as usize;\n        let mut d = task[2];\n        for x in s..=e {\n            if on[x] {\n                d -= 1;\n            }\n        }\n        let mut x = e as i32;\n        while d > 0 {\n            if !on[x as usize] {\n                on[x as usize] = true;\n                total += 1;\n                d -= 1;\n            }\n            x -= 1;\n        }\n    }\n    total\n}`,
        php: `function findMinimumTime($tasks) {\n    $t = $tasks;\n    usort($t, function($a, $b) { return $a[1] - $b[1]; });\n    $on = array_fill(0, 2002, false);\n    $total = 0;\n    foreach ($t as $task) {\n        $s = $task[0];\n        $e = $task[1];\n        $d = $task[2];\n        for ($x = $s; $x <= $e; $x++) if ($on[$x]) $d--;\n        for ($x = $e; $d > 0; $x--) {\n            if (!$on[$x]) {\n                $on[$x] = true;\n                $total++;\n                $d--;\n            }\n        }\n    }\n    return $total;\n}`,
        ruby: `def findMinimumTime(tasks)\n  t = tasks.sort_by { |x| x[1] }\n  on = Array.new(2002, false)\n  total = 0\n  t.each do |task|\n    s, e, d = task[0], task[1], task[2]\n    (s..e).each { |x| d -= 1 if on[x] }\n    x = e\n    while d > 0\n      unless on[x]\n        on[x] = true\n        total += 1\n        d -= 1\n      end\n      x -= 1\n    end\n  end\n  total\nend`,
      },
    };
  })(),
];
