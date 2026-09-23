/**
 * Dynamic programming — wave 5.
 *
 * Real problems only: LeetCode numbered classics, weighted toward the 1400+
 * range the earlier waves did not reach. Worked examples are phrased for
 * CodeKairo.
 *
 * Judge contract: a string test input must never contain `=`, because the
 * JS/Python driver's parseArgs reads `<ident>=` as a named argument
 * (src/lib/judge0.ts), and no input or output may hold a `__CODEXA_` sentinel.
 * Every return value is kept inside a 32-bit int - counting problems answer
 * modulo 10^9 + 7, and the constraints of the others are tightened where the
 * upstream bound would overflow.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at(), .flat() or
 * .flatMap(). The C harness has string.h but no math.h, so roots and powers
 * are written as integer loops.
 */

import {
  bool, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr,
  pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

/**
 * Exact modular multiply for the reference implementations. A plain
 * `a * b % MOD` loses precision in JavaScript once both sides approach 10^9,
 * and a generator's output is what the hidden test cases are judged against,
 * so every product below 2^53 is kept by splitting the left operand.
 */
const MOD5 = 1000000007;
const mulMod = (a: number, b: number) => {
  const hi = Math.floor(a / 65536), lo = a % 65536;
  return ((hi * b % MOD5) * 65536 + lo * b) % MOD5;
};

export const DP5_PROBLEMS: CatalogProblem[] = [

  // ── Number of Ways to Reach a Position After Exactly k Steps ────
  (() => {
    const MOD = 1000000007;
    const ref = (startPos: number, endPos: number, k: number) => {
      const d = Math.abs(endPos - startPos);
      if (d > k || (k - d) % 2 !== 0) return 0;
      // Pascal's triangle avoids modular inverses entirely at k <= 1000.
      const row = new Array(k + 1).fill(0);
      row[0] = 1;
      for (let i = 1; i <= k; i++) {
        for (let j = i; j >= 1; j--) row[j] = (row[j] + row[j - 1]) % MOD;
      }
      return row[(k + d) / 2];
    };
    return {
      slug: "number-of-ways-to-reach-a-position-after-exactly-k-steps",
      title: "Number of Ways to Reach a Position After Exactly k Steps",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Dynamic Programming", "Combinatorics", "Amazon", "Google", "Adobe"],
      signature: { funcName: "numberOfWays", params: [{ name: "startPos", type: "int" as const }, { name: "endPos", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You stand on an infinite number line at `startPos`. In one step you move **one** unit left or right.\n\nReturn the number of different step sequences of length **exactly** `k` that end at `endPos`, **modulo 10⁹ + 7**. Two sequences differ if any single step differs.",
        [
          { in: "startPos = 1, endPos = 2, k = 3", out: "3", note: "`R,R,L`, `R,L,R` and `L,R,R`." },
          { in: "startPos = 2, endPos = 5, k = 10", out: "0", note: "The distance is 3 and 10 − 3 is odd, so the parity never works out." },
          { in: "startPos = 0, endPos = 0, k = 2", out: "2", note: "`L,R` and `R,L`." },
        ],
        ["1 <= startPos, endPos, k <= 1000"]),
      hints: [
        "Only the **distance** `d = |endPos - startPos|` matters, not the direction or the absolute positions.",
        "With `r` rights and `l` lefts, `r + l = k` and `r - l = ±d`, so `r = (k + d) / 2` — which must be a whole number.",
        "The answer is then the binomial coefficient `C(k, r)`.",
      ],
      editorial: explain({
        idea: "Reduce to a counting identity. If `r` steps go right and `l` go left, then `r + l = k` and `r - l = d`, so `r = (k + d) / 2`. Any arrangement of those `r` rights among the `k` steps works, giving `C(k, r)`.",
        steps: [
          "Compute `d = |endPos - startPos|`.",
          "Return 0 if `d > k` or if `k - d` is odd — those are unreachable by parity.",
          "Otherwise return `C(k, (k + d) / 2)` modulo 10⁹ + 7, built with Pascal's triangle.",
        ],
        why: "The parity check is the part that is easy to miss: each step changes the position by exactly one, so the position's parity flips every step, and after `k` steps you can only be at a point whose distance from the start has the same parity as `k`. Building the binomial with Pascal's triangle rather than factorials and inverses keeps the whole solution to additions — at `k <= 1000` that is 500 000 operations and needs no modular inverse at all.",
        time: "O(k²) with Pascal's triangle, or O(k) with factorials and an inverse",
        space: "O(k)",
        pitfalls: [
          "Forgetting the parity check returns a nonsense binomial with a fractional index.",
          "Direction does not matter — the answer is symmetric in `startPos` and `endPos`.",
          "`k` steps must be used exactly; stopping early is not allowed.",
        ],
      }),
      examples: [
        { input: "1\n2\n3", expectedOutput: "3" },
        { input: "2\n5\n10", expectedOutput: "0" },
        { input: "0\n0\n2", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const startPos = ri(rng, 1, 40);
        const endPos = ri(rng, 1, 40);
        const k = ri(rng, 1, 40);
        return { input: `${startPos}\n${endPos}\n${k}`, expectedOutput: String(ref(startPos, endPos, k)) };
      },
      solutions: {
        python: `def numberOfWays(startPos: int, endPos: int, k: int) -> int:\n    MOD = 10**9 + 7\n    d = abs(endPos - startPos)\n    if d > k or (k - d) % 2 != 0:\n        return 0\n    row = [0] * (k + 1)\n    row[0] = 1\n    for i in range(1, k + 1):\n        for j in range(i, 0, -1):\n            row[j] = (row[j] + row[j - 1]) % MOD\n    return row[(k + d) // 2]`,
        javascript: `var numberOfWays = function(startPos, endPos, k) {\n    var MOD = 1000000007;\n    var d = Math.abs(endPos - startPos);\n    if (d > k || (k - d) % 2 !== 0) return 0;\n    var row = [], i, j;\n    for (i = 0; i <= k; i++) row.push(0);\n    row[0] = 1;\n    for (i = 1; i <= k; i++) {\n        for (j = i; j >= 1; j--) row[j] = (row[j] + row[j - 1]) % MOD;\n    }\n    return row[(k + d) / 2];\n};`,
        typescript: `function numberOfWays(startPos: number, endPos: number, k: number): number {\n    var MOD = 1000000007;\n    var d = Math.abs(endPos - startPos);\n    if (d > k || (k - d) % 2 !== 0) return 0;\n    var row: number[] = [], i: number, j: number;\n    for (i = 0; i <= k; i++) row.push(0);\n    row[0] = 1;\n    for (i = 1; i <= k; i++) {\n        for (j = i; j >= 1; j--) row[j] = (row[j] + row[j - 1]) % MOD;\n    }\n    return row[(k + d) / 2];\n}`,
        java: `public static int numberOfWays(int startPos, int endPos, int k) {\n    final int MOD = 1000000007;\n    int d = Math.abs(endPos - startPos);\n    if (d > k || (k - d) % 2 != 0) return 0;\n    int[] row = new int[k + 1];\n    row[0] = 1;\n    for (int i = 1; i <= k; i++) {\n        for (int j = i; j >= 1; j--) row[j] = (row[j] + row[j - 1]) % MOD;\n    }\n    return row[(k + d) / 2];\n}`,
        cpp: `int numberOfWays(int startPos, int endPos, int k) {\n    const int MOD = 1000000007;\n    int d = abs(endPos - startPos);\n    if (d > k || (k - d) % 2 != 0) return 0;\n    vector<int> row(k + 1, 0);\n    row[0] = 1;\n    for (int i = 1; i <= k; i++) {\n        for (int j = i; j >= 1; j--) row[j] = (row[j] + row[j - 1]) % MOD;\n    }\n    return row[(k + d) / 2];\n}`,
        c: `int numberOfWays(int startPos, int endPos, int k) {\n    const int MOD = 1000000007;\n    int d = endPos - startPos;\n    if (d < 0) d = -d;\n    if (d > k || (k - d) % 2 != 0) return 0;\n    int* row = (int*) calloc((size_t) (k + 1), sizeof(int));\n    row[0] = 1;\n    for (int i = 1; i <= k; i++) {\n        for (int j = i; j >= 1; j--) row[j] = (row[j] + row[j - 1]) % MOD;\n    }\n    int answer = row[(k + d) / 2];\n    free(row);\n    return answer;\n}`,
        csharp: `public static int NumberOfWays(int startPos, int endPos, int k)\n{\n    const int MOD = 1000000007;\n    int d = Math.Abs(endPos - startPos);\n    if (d > k || (k - d) % 2 != 0) return 0;\n    var row = new int[k + 1];\n    row[0] = 1;\n    for (int i = 1; i <= k; i++)\n    {\n        for (int j = i; j >= 1; j--) row[j] = (row[j] + row[j - 1]) % MOD;\n    }\n    return row[(k + d) / 2];\n}`,
        go: `func numberOfWays(startPos int, endPos int, k int) int {\n\tconst MOD = 1000000007\n\td := endPos - startPos\n\tif d < 0 {\n\t\td = -d\n\t}\n\tif d > k || (k-d)%2 != 0 {\n\t\treturn 0\n\t}\n\trow := make([]int, k+1)\n\trow[0] = 1\n\tfor i := 1; i <= k; i++ {\n\t\tfor j := i; j >= 1; j-- {\n\t\t\trow[j] = (row[j] + row[j-1]) % MOD\n\t\t}\n\t}\n\treturn row[(k+d)/2]\n}`,
        kotlin: `fun numberOfWays(startPos: Int, endPos: Int, k: Int): Int {\n    val mod = 1000000007\n    val d = kotlin.math.abs(endPos - startPos)\n    if (d > k || (k - d) % 2 != 0) return 0\n    val row = IntArray(k + 1)\n    row[0] = 1\n    for (i in 1..k) {\n        for (j in i downTo 1) row[j] = (row[j] + row[j - 1]) % mod\n    }\n    return row[(k + d) / 2]\n}`,
        swift: `func numberOfWays(_ startPos: Int, _ endPos: Int, _ k: Int) -> Int {\n    let mod = 1000000007\n    let d = abs(endPos - startPos)\n    if d > k || (k - d) % 2 != 0 { return 0 }\n    var row = [Int](repeating: 0, count: k + 1)\n    row[0] = 1\n    for i in 1...max(k, 1) where i <= k {\n        var j = i\n        while j >= 1 {\n            row[j] = (row[j] + row[j - 1]) % mod\n            j -= 1\n        }\n    }\n    return row[(k + d) / 2]\n}`,
        rust: `fn numberOfWays(startPos: i32, endPos: i32, k: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let d = (endPos - startPos).abs();\n    if d > k || (k - d) % 2 != 0 {\n        return 0;\n    }\n    let k = k as usize;\n    let mut row = vec![0i64; k + 1];\n    row[0] = 1;\n    for i in 1..=k {\n        for j in (1..=i).rev() {\n            row[j] = (row[j] + row[j - 1]) % MOD;\n        }\n    }\n    row[(k + d as usize) / 2] as i32\n}`,
        php: `function numberOfWays($startPos, $endPos, $k) {\n    $MOD = 1000000007;\n    $d = abs($endPos - $startPos);\n    if ($d > $k || ($k - $d) % 2 !== 0) return 0;\n    $row = array_fill(0, $k + 1, 0);\n    $row[0] = 1;\n    for ($i = 1; $i <= $k; $i++) {\n        for ($j = $i; $j >= 1; $j--) $row[$j] = ($row[$j] + $row[$j - 1]) % $MOD;\n    }\n    return $row[intdiv($k + $d, 2)];\n}`,
        ruby: `def numberOfWays(startPos, endPos, k)\n  mod = 1000000007\n  d = (endPos - startPos).abs\n  return 0 if d > k || (k - d).odd?\n  row = Array.new(k + 1, 0)\n  row[0] = 1\n  (1..k).each do |i|\n    i.downto(1) { |j| row[j] = (row[j] + row[j - 1]) % mod }\n  end\n  row[(k + d) / 2]\nend`,
      },
    };
  })(),

  // ── Count Number of Texts (LC 2266) ─────────────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (pressedKeys: string) => {
      const n = pressedKeys.length;
      // tri[i] / tet[i] = ways to split a run of i identical presses.
      const tri = new Array(n + 1).fill(0);
      const tet = new Array(n + 1).fill(0);
      tri[0] = 1; tet[0] = 1;
      for (let i = 1; i <= n; i++) {
        tri[i] = tri[i - 1];
        if (i >= 2) tri[i] = (tri[i] + tri[i - 2]) % MOD;
        if (i >= 3) tri[i] = (tri[i] + tri[i - 3]) % MOD;
        tet[i] = tet[i - 1];
        if (i >= 2) tet[i] = (tet[i] + tet[i - 2]) % MOD;
        if (i >= 3) tet[i] = (tet[i] + tet[i - 3]) % MOD;
        if (i >= 4) tet[i] = (tet[i] + tet[i - 4]) % MOD;
      }
      let answer = 1, i = 0;
      while (i < n) {
        let j = i;
        while (j < n && pressedKeys.charAt(j) === pressedKeys.charAt(i)) j++;
        const len = j - i;
        const c = pressedKeys.charAt(i);
        answer = mulMod(answer, c === "7" || c === "9" ? tet[len] : tri[len]);
        i = j;
      }
      return answer;
    };
    return {
      slug: "count-number-of-texts",
      title: "Count Number of Texts",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Math", "String", "Dynamic Programming", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "countTexts", params: [{ name: "pressedKeys", type: "string" as const }], returns: "int" as const },
      description: describe(
        "On an old phone keypad, a letter is typed by pressing its key repeatedly: key `2` gives `a`, `b`, `c` for one, two or three presses; `7` gives `p`, `q`, `r`, `s` for one to four; and so on. Keys `7` and `9` carry **four** letters, every other key carries **three**.\n\nGiven the sequence of key presses `pressedKeys`, return how many different messages could have produced it, **modulo 10⁹ + 7**.",
        [
          { in: 'pressedKeys = "22233"', out: "8", note: "The run `222` splits 4 ways and `33` splits 2 ways." },
          { in: 'pressedKeys = "2"', out: "1", note: "Only `a`." },
          { in: 'pressedKeys = "7777"', out: "8", note: "Key 7 has four letters, so the run of four splits 8 ways." },
        ],
        ["1 <= pressedKeys.length <= 10^5", "pressedKeys only consists of digits from '2' - '9'."]),
      hints: [
        "Runs of different digits are independent — multiply their counts.",
        "For a run of length `L` on a three-letter key, the count obeys `f(L) = f(L-1) + f(L-2) + f(L-3)` — a tribonacci.",
        "Keys 7 and 9 add a fourth term, giving a tetranacci.",
      ],
      editorial: explain({
        idea: "Split the string into maximal runs of one digit. A run is decoded by cutting it into pieces of 1, 2, 3 (or up to 4 for keys 7 and 9) presses, so the number of ways is the tribonacci — or tetranacci — value at the run's length. Multiply across runs.",
        steps: [
          "Precompute `tri[i] = tri[i-1] + tri[i-2] + tri[i-3]` and `tet[i]` with a fourth term, both with `f(0) = 1` and negative indices treated as 0.",
          "Walk the string, measuring each maximal run of one digit.",
          "Multiply the running answer by `tet[len]` for `7` and `9`, and by `tri[len]` otherwise.",
        ],
        why: "Runs cannot interact: a cut is forced at every digit change, because two different keys can never form one letter. Within a run, the recurrence follows from choosing how many presses the **last** letter consumes — 1, 2, 3 (or 4) — which is exactly the tribonacci/tetranacci structure.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Keys 7 and 9 have four letters; treating every key as three under-counts.",
          "`f(0) = 1` — an empty remainder has exactly one decoding.",
          "The product must be taken modulo 10⁹ + 7 at every step.",
        ],
      }),
      examples: [
        { input: '"22233"', expectedOutput: "8" },
        { input: '"2"', expectedOutput: "1" },
        { input: '"7777"', expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const digits = "23456789";
        const n = ri(rng, 1, 18);
        let s = "";
        let c = digits.charAt(ri(rng, 0, 7));
        for (let i = 0; i < n; i++) {
          if (rng() < 0.3) c = digits.charAt(ri(rng, 0, 7));
          s += c;
        }
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def countTexts(pressedKeys: str) -> int:\n    MOD = 10**9 + 7\n    n = len(pressedKeys)\n    tri = [0] * (n + 1)\n    tet = [0] * (n + 1)\n    tri[0] = tet[0] = 1\n    for i in range(1, n + 1):\n        tri[i] = tri[i - 1]\n        tet[i] = tet[i - 1]\n        if i >= 2:\n            tri[i] = (tri[i] + tri[i - 2]) % MOD\n            tet[i] = (tet[i] + tet[i - 2]) % MOD\n        if i >= 3:\n            tri[i] = (tri[i] + tri[i - 3]) % MOD\n            tet[i] = (tet[i] + tet[i - 3]) % MOD\n        if i >= 4:\n            tet[i] = (tet[i] + tet[i - 4]) % MOD\n    answer = 1\n    i = 0\n    while i < n:\n        j = i\n        while j < n and pressedKeys[j] == pressedKeys[i]:\n            j += 1\n        length = j - i\n        answer = answer * (tet[length] if pressedKeys[i] in "79" else tri[length]) % MOD\n        i = j\n    return answer`,
        javascript: `var countTexts = function(pressedKeys) {\n    var MOD = 1000000007;\n    var n = pressedKeys.length, i;\n    var tri = [], tet = [];\n    for (i = 0; i <= n; i++) { tri.push(0); tet.push(0); }\n    tri[0] = 1; tet[0] = 1;\n    for (i = 1; i <= n; i++) {\n        tri[i] = tri[i - 1];\n        tet[i] = tet[i - 1];\n        if (i >= 2) { tri[i] = (tri[i] + tri[i - 2]) % MOD; tet[i] = (tet[i] + tet[i - 2]) % MOD; }\n        if (i >= 3) { tri[i] = (tri[i] + tri[i - 3]) % MOD; tet[i] = (tet[i] + tet[i - 3]) % MOD; }\n        if (i >= 4) tet[i] = (tet[i] + tet[i - 4]) % MOD;\n    }\n    var answer = 1;\n    i = 0;\n    while (i < n) {\n        var j = i;\n        while (j < n && pressedKeys.charAt(j) === pressedKeys.charAt(i)) j++;\n        var len = j - i;\n        var c = pressedKeys.charAt(i);\n        var ways = c === "7" || c === "9" ? tet[len] : tri[len];\n        var mhi = Math.floor(answer / 65536), mlo = answer % 65536;\n        answer = ((mhi * ways % MOD) * 65536 + mlo * ways) % MOD;\n        i = j;\n    }\n    return answer;\n};`,
        typescript: `function countTexts(pressedKeys: string): number {\n    var MOD = 1000000007;\n    var n = pressedKeys.length, i: number;\n    var tri: number[] = [], tet: number[] = [];\n    for (i = 0; i <= n; i++) { tri.push(0); tet.push(0); }\n    tri[0] = 1; tet[0] = 1;\n    for (i = 1; i <= n; i++) {\n        tri[i] = tri[i - 1];\n        tet[i] = tet[i - 1];\n        if (i >= 2) { tri[i] = (tri[i] + tri[i - 2]) % MOD; tet[i] = (tet[i] + tet[i - 2]) % MOD; }\n        if (i >= 3) { tri[i] = (tri[i] + tri[i - 3]) % MOD; tet[i] = (tet[i] + tet[i - 3]) % MOD; }\n        if (i >= 4) tet[i] = (tet[i] + tet[i - 4]) % MOD;\n    }\n    var answer = 1;\n    i = 0;\n    while (i < n) {\n        var j = i;\n        while (j < n && pressedKeys.charAt(j) === pressedKeys.charAt(i)) j++;\n        var len = j - i;\n        var c = pressedKeys.charAt(i);\n        var ways = c === "7" || c === "9" ? tet[len] : tri[len];\n        var mhi = Math.floor(answer / 65536), mlo = answer % 65536;\n        answer = ((mhi * ways % MOD) * 65536 + mlo * ways) % MOD;\n        i = j;\n    }\n    return answer;\n}`,
        java: `public static int countTexts(String pressedKeys) {\n    final long MOD = 1000000007L;\n    int n = pressedKeys.length();\n    long[] tri = new long[n + 1];\n    long[] tet = new long[n + 1];\n    tri[0] = 1;\n    tet[0] = 1;\n    for (int i = 1; i <= n; i++) {\n        tri[i] = tri[i - 1];\n        tet[i] = tet[i - 1];\n        if (i >= 2) {\n            tri[i] = (tri[i] + tri[i - 2]) % MOD;\n            tet[i] = (tet[i] + tet[i - 2]) % MOD;\n        }\n        if (i >= 3) {\n            tri[i] = (tri[i] + tri[i - 3]) % MOD;\n            tet[i] = (tet[i] + tet[i - 3]) % MOD;\n        }\n        if (i >= 4) tet[i] = (tet[i] + tet[i - 4]) % MOD;\n    }\n    long answer = 1;\n    int i = 0;\n    while (i < n) {\n        int j = i;\n        while (j < n && pressedKeys.charAt(j) == pressedKeys.charAt(i)) j++;\n        int len = j - i;\n        char c = pressedKeys.charAt(i);\n        answer = answer * (c == '7' || c == '9' ? tet[len] : tri[len]) % MOD;\n        i = j;\n    }\n    return (int) answer;\n}`,
        cpp: `int countTexts(string pressedKeys) {\n    const long long MOD = 1000000007LL;\n    int n = (int) pressedKeys.size();\n    vector<long long> tri(n + 1, 0), tet(n + 1, 0);\n    tri[0] = 1;\n    tet[0] = 1;\n    for (int i = 1; i <= n; i++) {\n        tri[i] = tri[i - 1];\n        tet[i] = tet[i - 1];\n        if (i >= 2) {\n            tri[i] = (tri[i] + tri[i - 2]) % MOD;\n            tet[i] = (tet[i] + tet[i - 2]) % MOD;\n        }\n        if (i >= 3) {\n            tri[i] = (tri[i] + tri[i - 3]) % MOD;\n            tet[i] = (tet[i] + tet[i - 3]) % MOD;\n        }\n        if (i >= 4) tet[i] = (tet[i] + tet[i - 4]) % MOD;\n    }\n    long long answer = 1;\n    int i = 0;\n    while (i < n) {\n        int j = i;\n        while (j < n && pressedKeys[j] == pressedKeys[i]) j++;\n        int len = j - i;\n        char c = pressedKeys[i];\n        answer = answer * ((c == '7' || c == '9') ? tet[len] : tri[len]) % MOD;\n        i = j;\n    }\n    return (int) answer;\n}`,
        c: `int countTexts(char* pressedKeys) {\n    const long long MOD = 1000000007LL;\n    int n = (int) strlen(pressedKeys);\n    long long* tri = (long long*) calloc((size_t) (n + 1), sizeof(long long));\n    long long* tet = (long long*) calloc((size_t) (n + 1), sizeof(long long));\n    tri[0] = 1;\n    tet[0] = 1;\n    for (int i = 1; i <= n; i++) {\n        tri[i] = tri[i - 1];\n        tet[i] = tet[i - 1];\n        if (i >= 2) {\n            tri[i] = (tri[i] + tri[i - 2]) % MOD;\n            tet[i] = (tet[i] + tet[i - 2]) % MOD;\n        }\n        if (i >= 3) {\n            tri[i] = (tri[i] + tri[i - 3]) % MOD;\n            tet[i] = (tet[i] + tet[i - 3]) % MOD;\n        }\n        if (i >= 4) tet[i] = (tet[i] + tet[i - 4]) % MOD;\n    }\n    long long answer = 1;\n    int i = 0;\n    while (i < n) {\n        int j = i;\n        while (j < n && pressedKeys[j] == pressedKeys[i]) j++;\n        int len = j - i;\n        char c = pressedKeys[i];\n        answer = answer * ((c == '7' || c == '9') ? tet[len] : tri[len]) % MOD;\n        i = j;\n    }\n    free(tri);\n    free(tet);\n    return (int) answer;\n}`,
        csharp: `public static int CountTexts(string pressedKeys)\n{\n    const long MOD = 1000000007L;\n    int n = pressedKeys.Length;\n    var tri = new long[n + 1];\n    var tet = new long[n + 1];\n    tri[0] = 1;\n    tet[0] = 1;\n    for (int i = 1; i <= n; i++)\n    {\n        tri[i] = tri[i - 1];\n        tet[i] = tet[i - 1];\n        if (i >= 2)\n        {\n            tri[i] = (tri[i] + tri[i - 2]) % MOD;\n            tet[i] = (tet[i] + tet[i - 2]) % MOD;\n        }\n        if (i >= 3)\n        {\n            tri[i] = (tri[i] + tri[i - 3]) % MOD;\n            tet[i] = (tet[i] + tet[i - 3]) % MOD;\n        }\n        if (i >= 4) tet[i] = (tet[i] + tet[i - 4]) % MOD;\n    }\n    long answer = 1;\n    int idx = 0;\n    while (idx < n)\n    {\n        int j = idx;\n        while (j < n && pressedKeys[j] == pressedKeys[idx]) j++;\n        int len = j - idx;\n        char c = pressedKeys[idx];\n        answer = answer * ((c == '7' || c == '9') ? tet[len] : tri[len]) % MOD;\n        idx = j;\n    }\n    return (int) answer;\n}`,
        go: `func countTexts(pressedKeys string) int {\n\tconst MOD = 1000000007\n\tn := len(pressedKeys)\n\ttri := make([]int, n+1)\n\ttet := make([]int, n+1)\n\ttri[0] = 1\n\ttet[0] = 1\n\tfor i := 1; i <= n; i++ {\n\t\ttri[i] = tri[i-1]\n\t\ttet[i] = tet[i-1]\n\t\tif i >= 2 {\n\t\t\ttri[i] = (tri[i] + tri[i-2]) % MOD\n\t\t\ttet[i] = (tet[i] + tet[i-2]) % MOD\n\t\t}\n\t\tif i >= 3 {\n\t\t\ttri[i] = (tri[i] + tri[i-3]) % MOD\n\t\t\ttet[i] = (tet[i] + tet[i-3]) % MOD\n\t\t}\n\t\tif i >= 4 {\n\t\t\ttet[i] = (tet[i] + tet[i-4]) % MOD\n\t\t}\n\t}\n\tanswer := 1\n\ti := 0\n\tfor i < n {\n\t\tj := i\n\t\tfor j < n && pressedKeys[j] == pressedKeys[i] {\n\t\t\tj++\n\t\t}\n\t\tlength := j - i\n\t\tways := tri[length]\n\t\tif pressedKeys[i] == '7' || pressedKeys[i] == '9' {\n\t\t\tways = tet[length]\n\t\t}\n\t\tanswer = answer * ways % MOD\n\t\ti = j\n\t}\n\treturn answer\n}`,
        kotlin: `fun countTexts(pressedKeys: String): Int {\n    val mod = 1000000007L\n    val n = pressedKeys.length\n    val tri = LongArray(n + 1)\n    val tet = LongArray(n + 1)\n    tri[0] = 1\n    tet[0] = 1\n    for (i in 1..n) {\n        tri[i] = tri[i - 1]\n        tet[i] = tet[i - 1]\n        if (i >= 2) {\n            tri[i] = (tri[i] + tri[i - 2]) % mod\n            tet[i] = (tet[i] + tet[i - 2]) % mod\n        }\n        if (i >= 3) {\n            tri[i] = (tri[i] + tri[i - 3]) % mod\n            tet[i] = (tet[i] + tet[i - 3]) % mod\n        }\n        if (i >= 4) tet[i] = (tet[i] + tet[i - 4]) % mod\n    }\n    var answer = 1L\n    var i = 0\n    while (i < n) {\n        var j = i\n        while (j < n && pressedKeys[j] == pressedKeys[i]) j++\n        val len = j - i\n        val c = pressedKeys[i]\n        answer = answer * (if (c == '7' || c == '9') tet[len] else tri[len]) % mod\n        i = j\n    }\n    return answer.toInt()\n}`,
        swift: `func countTexts(_ pressedKeys: String) -> Int {\n    let mod = 1000000007\n    let chars = Array(pressedKeys)\n    let n = chars.count\n    var tri = [Int](repeating: 0, count: n + 1)\n    var tet = [Int](repeating: 0, count: n + 1)\n    tri[0] = 1\n    tet[0] = 1\n    for i in 1...max(n, 1) where i <= n {\n        tri[i] = tri[i - 1]\n        tet[i] = tet[i - 1]\n        if i >= 2 {\n            tri[i] = (tri[i] + tri[i - 2]) % mod\n            tet[i] = (tet[i] + tet[i - 2]) % mod\n        }\n        if i >= 3 {\n            tri[i] = (tri[i] + tri[i - 3]) % mod\n            tet[i] = (tet[i] + tet[i - 3]) % mod\n        }\n        if i >= 4 { tet[i] = (tet[i] + tet[i - 4]) % mod }\n    }\n    var answer = 1\n    var i = 0\n    while i < n {\n        var j = i\n        while j < n && chars[j] == chars[i] { j += 1 }\n        let len = j - i\n        let c = chars[i]\n        answer = answer * ((c == "7" || c == "9") ? tet[len] : tri[len]) % mod\n        i = j\n    }\n    return answer\n}`,
        rust: `fn countTexts(pressedKeys: String) -> i32 {\n    const MOD: i64 = 1000000007;\n    let chars: Vec<char> = pressedKeys.chars().collect();\n    let n = chars.len();\n    let mut tri = vec![0i64; n + 1];\n    let mut tet = vec![0i64; n + 1];\n    tri[0] = 1;\n    tet[0] = 1;\n    for i in 1..=n {\n        tri[i] = tri[i - 1];\n        tet[i] = tet[i - 1];\n        if i >= 2 {\n            tri[i] = (tri[i] + tri[i - 2]) % MOD;\n            tet[i] = (tet[i] + tet[i - 2]) % MOD;\n        }\n        if i >= 3 {\n            tri[i] = (tri[i] + tri[i - 3]) % MOD;\n            tet[i] = (tet[i] + tet[i - 3]) % MOD;\n        }\n        if i >= 4 {\n            tet[i] = (tet[i] + tet[i - 4]) % MOD;\n        }\n    }\n    let mut answer: i64 = 1;\n    let mut i = 0usize;\n    while i < n {\n        let mut j = i;\n        while j < n && chars[j] == chars[i] {\n            j += 1;\n        }\n        let len = j - i;\n        let ways = if chars[i] == '7' || chars[i] == '9' { tet[len] } else { tri[len] };\n        answer = answer * ways % MOD;\n        i = j;\n    }\n    answer as i32\n}`,
        php: `function countTexts($pressedKeys) {\n    $MOD = 1000000007;\n    $n = strlen($pressedKeys);\n    $tri = array_fill(0, $n + 1, 0);\n    $tet = array_fill(0, $n + 1, 0);\n    $tri[0] = 1;\n    $tet[0] = 1;\n    for ($i = 1; $i <= $n; $i++) {\n        $tri[$i] = $tri[$i - 1];\n        $tet[$i] = $tet[$i - 1];\n        if ($i >= 2) {\n            $tri[$i] = ($tri[$i] + $tri[$i - 2]) % $MOD;\n            $tet[$i] = ($tet[$i] + $tet[$i - 2]) % $MOD;\n        }\n        if ($i >= 3) {\n            $tri[$i] = ($tri[$i] + $tri[$i - 3]) % $MOD;\n            $tet[$i] = ($tet[$i] + $tet[$i - 3]) % $MOD;\n        }\n        if ($i >= 4) $tet[$i] = ($tet[$i] + $tet[$i - 4]) % $MOD;\n    }\n    $answer = 1;\n    $i = 0;\n    while ($i < $n) {\n        $j = $i;\n        while ($j < $n && $pressedKeys[$j] === $pressedKeys[$i]) $j++;\n        $len = $j - $i;\n        $c = $pressedKeys[$i];\n        $ways = ($c === "7" || $c === "9") ? $tet[$len] : $tri[$len];\n        $answer = $answer * $ways % $MOD;\n        $i = $j;\n    }\n    return $answer;\n}`,
        ruby: `def countTexts(pressedKeys)\n  mod = 1000000007\n  n = pressedKeys.length\n  tri = Array.new(n + 1, 0)\n  tet = Array.new(n + 1, 0)\n  tri[0] = 1\n  tet[0] = 1\n  (1..n).each do |i|\n    tri[i] = tri[i - 1]\n    tet[i] = tet[i - 1]\n    if i >= 2\n      tri[i] = (tri[i] + tri[i - 2]) % mod\n      tet[i] = (tet[i] + tet[i - 2]) % mod\n    end\n    if i >= 3\n      tri[i] = (tri[i] + tri[i - 3]) % mod\n      tet[i] = (tet[i] + tet[i - 3]) % mod\n    end\n    tet[i] = (tet[i] + tet[i - 4]) % mod if i >= 4\n  end\n  answer = 1\n  i = 0\n  while i < n\n    j = i\n    j += 1 while j < n && pressedKeys[j] == pressedKeys[i]\n    len = j - i\n    ways = (pressedKeys[i] == "7" || pressedKeys[i] == "9") ? tet[len] : tri[len]\n    answer = answer * ways % mod\n    i = j\n  end\n  answer\nend`,
      },
    };
  })(),

  // ── Count Number of Ways to Place Houses (LC 2320) ──────────────
  (() => {
    const MOD = 1000000007;
    const ref = (n: number) => {
      // f[i] = arrangements on one side of the street for i plots.
      let prev = 1, cur = 2;
      for (let i = 2; i <= n; i++) {
        const next = (prev + cur) % MOD;
        prev = cur;
        cur = next;
      }
      return mulMod(cur, cur);
    };
    return {
      slug: "count-number-of-ways-to-place-houses",
      title: "Count Number of Ways to Place Houses",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Dynamic Programming", "Amazon", "Google", "Oracle"],
      signature: { funcName: "countHousePlacements", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A street has `n` plots on each of its two sides, numbered 1 to `n`. A house may be built on any plot, but **no two houses on the same side may be adjacent**. The two sides are independent.\n\nReturn the number of ways to place houses, **modulo 10⁹ + 7**.",
        [
          { in: "n = 1", out: "4", note: "Each side is free to have a house or not: 2 × 2." },
          { in: "n = 2", out: "9", note: "Three arrangements per side — empty, first only, second only — squared." },
          { in: "n = 3", out: "25", note: "Five arrangements per side." },
        ],
        ["1 <= n <= 10^4"]),
      hints: [
        "The two sides never constrain each other, so count one side and square the result.",
        "On one side, `f(i)` = arrangements for `i` plots: the last plot is either empty (`f(i-1)`) or built on (`f(i-2)`).",
        "That is the Fibonacci recurrence with `f(0) = 1` and `f(1) = 2`.",
      ],
      editorial: explain({
        idea: "The sides are independent, so the answer is `f(n)²` where `f(n)` counts the ways to place non-adjacent houses along one row of `n` plots. `f` satisfies the Fibonacci recurrence: leave the last plot empty and the rest is `f(n-1)`, or build on it and the plot before must be empty, leaving `f(n-2)`.",
        steps: [
          "Iterate `f` with `f(0) = 1`, `f(1) = 2`, `f(i) = f(i-1) + f(i-2)`, all modulo 10⁹ + 7.",
          "Return `f(n) · f(n) mod 10⁹ + 7`.",
        ],
        why: "Squaring is valid precisely because the constraint is per-side — a house across the street is never adjacent. And the recurrence needs the square taken **after** the modulo: `f(n)` can be close to 10⁹, so the product must be reduced, which in 64-bit languages is fine and in JavaScript needs a split multiplication or care that the product stays under 2⁵³.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Squaring two residues near 10⁹ overflows a 32-bit integer — compute in 64 bits.",
          "`f(1) = 2`, not 1: a single plot may be empty or built on.",
          "The two sides are counted independently, not jointly.",
        ],
      }),
      examples: [
        { input: "1", expectedOutput: "4" },
        { input: "2", expectedOutput: "9" },
        { input: "3", expectedOutput: "25" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def countHousePlacements(n: int) -> int:\n    MOD = 10**9 + 7\n    prev, cur = 1, 2\n    for _ in range(2, n + 1):\n        prev, cur = cur, (prev + cur) % MOD\n    return cur * cur % MOD`,
        javascript: `var countHousePlacements = function(n) {\n    var MOD = 1000000007;\n    var prev = 1, cur = 2;\n    for (var i = 2; i <= n; i++) {\n        var next = (prev + cur) % MOD;\n        prev = cur;\n        cur = next;\n    }\n    // cur can approach 1e9, so split the square to stay inside 2^53.\n    var hi = Math.floor(cur / 65536), lo = cur % 65536;\n    return ((hi * cur % MOD) * 65536 + lo * cur) % MOD;\n};`,
        typescript: `function countHousePlacements(n: number): number {\n    var MOD = 1000000007;\n    var prev = 1, cur = 2;\n    for (var i = 2; i <= n; i++) {\n        var next = (prev + cur) % MOD;\n        prev = cur;\n        cur = next;\n    }\n    var hi = Math.floor(cur / 65536), lo = cur % 65536;\n    return ((hi * cur % MOD) * 65536 + lo * cur) % MOD;\n}`,
        java: `public static int countHousePlacements(int n) {\n    final long MOD = 1000000007L;\n    long prev = 1, cur = 2;\n    for (int i = 2; i <= n; i++) {\n        long next = (prev + cur) % MOD;\n        prev = cur;\n        cur = next;\n    }\n    return (int) (cur * cur % MOD);\n}`,
        cpp: `int countHousePlacements(int n) {\n    const long long MOD = 1000000007LL;\n    long long prev = 1, cur = 2;\n    for (int i = 2; i <= n; i++) {\n        long long next = (prev + cur) % MOD;\n        prev = cur;\n        cur = next;\n    }\n    return (int) (cur * cur % MOD);\n}`,
        c: `int countHousePlacements(int n) {\n    const long long MOD = 1000000007LL;\n    long long prev = 1, cur = 2;\n    for (int i = 2; i <= n; i++) {\n        long long next = (prev + cur) % MOD;\n        prev = cur;\n        cur = next;\n    }\n    return (int) (cur * cur % MOD);\n}`,
        csharp: `public static int CountHousePlacements(int n)\n{\n    const long MOD = 1000000007L;\n    long prev = 1, cur = 2;\n    for (int i = 2; i <= n; i++)\n    {\n        long next = (prev + cur) % MOD;\n        prev = cur;\n        cur = next;\n    }\n    return (int) (cur * cur % MOD);\n}`,
        go: `func countHousePlacements(n int) int {\n\tconst MOD = 1000000007\n\tprev, cur := 1, 2\n\tfor i := 2; i <= n; i++ {\n\t\tprev, cur = cur, (prev+cur)%MOD\n\t}\n\treturn cur * cur % MOD\n}`,
        kotlin: `fun countHousePlacements(n: Int): Int {\n    val mod = 1000000007L\n    var prev = 1L\n    var cur = 2L\n    for (i in 2..n) {\n        val next = (prev + cur) % mod\n        prev = cur\n        cur = next\n    }\n    return (cur * cur % mod).toInt()\n}`,
        swift: `func countHousePlacements(_ n: Int) -> Int {\n    let mod = 1000000007\n    var prev = 1\n    var cur = 2\n    if n >= 2 {\n        for _ in 2...n {\n            let next = (prev + cur) % mod\n            prev = cur\n            cur = next\n        }\n    }\n    return cur * cur % mod\n}`,
        rust: `fn countHousePlacements(n: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let mut prev: i64 = 1;\n    let mut cur: i64 = 2;\n    for _ in 2..=n {\n        let next = (prev + cur) % MOD;\n        prev = cur;\n        cur = next;\n    }\n    (cur * cur % MOD) as i32\n}`,
        php: `function countHousePlacements($n) {\n    $MOD = 1000000007;\n    $prev = 1;\n    $cur = 2;\n    for ($i = 2; $i <= $n; $i++) {\n        $next = ($prev + $cur) % $MOD;\n        $prev = $cur;\n        $cur = $next;\n    }\n    return $cur * $cur % $MOD;\n}`,
        ruby: `def countHousePlacements(n)\n  mod = 1000000007\n  prev = 1\n  cur = 2\n  (2..n).each do\n    prev, cur = cur, (prev + cur) % mod\n  end\n  cur * cur % mod\nend`,
      },
    };
  })(),

  // ── Count Ways to Group Overlapping Ranges (LC 2580) ────────────
  (() => {
    const MOD = 1000000007;
    const ref = (ranges: number[][]) => {
      const sorted = ranges.slice().sort((a, b) => a[0] - b[0]);
      let groups = 0, reach = -1;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i][0] > reach) groups++;
        if (sorted[i][1] > reach) reach = sorted[i][1];
      }
      let answer = 1;
      for (let i = 0; i < groups; i++) answer = (answer * 2) % MOD;
      return answer;
    };
    return {
      slug: "count-ways-to-group-overlapping-ranges",
      title: "Count Ways to Group Overlapping Ranges",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Math", "Amazon", "Google", "Salesforce"],
      signature: { funcName: "countWays", params: [{ name: "ranges", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`ranges[i] = [start, end]` is an inclusive range of integers. Split **all** the ranges into two groups so that any two ranges sharing at least one integer end up in the **same** group. Either group may be empty.\n\nReturn the number of ways to do this, **modulo 10⁹ + 7**. Two ways differ if some range lands in a different group.",
        [
          { in: "ranges = [[6,10],[5,15]]", out: "2", note: "They overlap, so both go together — into group 1 or group 2." },
          { in: "ranges = [[1,3],[10,20],[2,5],[4,8]]", out: "4", note: "`[1,3]`, `[2,5]` and `[4,8]` merge into one block; `[10,20]` is its own. 2² = 4." },
          { in: "ranges = [[1,2]]", out: "2" },
        ],
        ["1 <= ranges.length <= 10^5", "ranges[i].length == 2", "0 <= starti <= endi <= 10^9"]),
      hints: [
        "Ranges that overlap — even transitively through a chain — are forced into the same group.",
        "So merge the overlapping ranges first and count how many independent blocks remain.",
        "Each block chooses one of two groups freely: the answer is `2^blocks`.",
      ],
      editorial: explain({
        idea: "Sort by start and sweep, merging ranges into maximal blocks: a range starts a new block only when its start is beyond the furthest end reached so far. Each block is then independent, so the answer is `2^blocks`.",
        steps: [
          "Sort the ranges by start.",
          "Track `reach`, the furthest end covered. A range with `start > reach` opens a new block.",
          "Extend `reach` to the range's end when it goes further.",
          "Return `2^blocks` modulo 10⁹ + 7.",
        ],
        why: "\"Share an integer\" is transitive once the ranges are merged — a chain of pairwise overlaps forms a single connected block, which is why a union-find solution and this sweep give the same count. Sorting by start is what lets one `reach` variable stand in for the whole block: any later range that starts at or before `reach` must touch something already inside it.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Touching endpoints count as overlapping: `[1,3]` and `[3,5]` share the integer 3.",
          "`reach` must be the **maximum** end so far, not the previous range's end — a nested range would otherwise close the block early.",
          "The exponent is the number of blocks, not the number of ranges.",
        ],
      }),
      examples: [
        { input: "[[6,10],[5,15]]", expectedOutput: "2" },
        { input: "[[1,3],[10,20],[2,5],[4,8]]", expectedOutput: "4" },
        { input: "[[1,2]]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const count = ri(rng, 1, 10);
        const ranges = Array.from({ length: count }, () => {
          const s = ri(rng, 0, 30);
          return [s, ri(rng, s, Math.min(30, s + ri(rng, 0, 8)))];
        });
        return { input: fmtIntMat(ranges), expectedOutput: String(ref(ranges)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countWays(ranges: List[List[int]]) -> int:\n    MOD = 10**9 + 7\n    groups = 0\n    reach = -1\n    for start, end in sorted(ranges):\n        if start > reach:\n            groups += 1\n        reach = max(reach, end)\n    return pow(2, groups, MOD)`,
        javascript: `var countWays = function(ranges) {\n    var MOD = 1000000007;\n    var sorted = ranges.slice();\n    sorted.sort(function(a, b) { return a[0] - b[0]; });\n    var groups = 0, reach = -1;\n    for (var i = 0; i < sorted.length; i++) {\n        if (sorted[i][0] > reach) groups++;\n        if (sorted[i][1] > reach) reach = sorted[i][1];\n    }\n    var answer = 1;\n    for (var g = 0; g < groups; g++) answer = (answer * 2) % MOD;\n    return answer;\n};`,
        typescript: `function countWays(ranges: number[][]): number {\n    var MOD = 1000000007;\n    var sorted = ranges.slice();\n    sorted.sort(function(a: number[], b: number[]) { return a[0] - b[0]; });\n    var groups = 0, reach = -1;\n    for (var i = 0; i < sorted.length; i++) {\n        if (sorted[i][0] > reach) groups++;\n        if (sorted[i][1] > reach) reach = sorted[i][1];\n    }\n    var answer = 1;\n    for (var g = 0; g < groups; g++) answer = (answer * 2) % MOD;\n    return answer;\n}`,
        java: `public static int countWays(int[][] ranges) {\n    final long MOD = 1000000007L;\n    int[][] sorted = ranges.clone();\n    Arrays.sort(sorted, (a, b) -> Integer.compare(a[0], b[0]));\n    int groups = 0;\n    int reach = -1;\n    for (int[] r : sorted) {\n        if (r[0] > reach) groups++;\n        reach = Math.max(reach, r[1]);\n    }\n    long answer = 1;\n    for (int i = 0; i < groups; i++) answer = answer * 2 % MOD;\n    return (int) answer;\n}`,
        cpp: `int countWays(vector<vector<int>>& ranges) {\n    const long long MOD = 1000000007LL;\n    vector<vector<int>> sorted = ranges;\n    sort(sorted.begin(), sorted.end());\n    int groups = 0, reach = -1;\n    for (auto& r : sorted) {\n        if (r[0] > reach) groups++;\n        reach = max(reach, r[1]);\n    }\n    long long answer = 1;\n    for (int i = 0; i < groups; i++) answer = answer * 2 % MOD;\n    return (int) answer;\n}`,
        c: `static int cwCmp(const void* a, const void* b) {\n    const int* x = (const int*) a;\n    const int* y = (const int*) b;\n    return x[0] < y[0] ? -1 : (x[0] > y[0] ? 1 : 0);\n}\n\nint countWays(int** ranges, int rangesSize, int* rangesColSize) {\n    (void) rangesColSize;\n    const long long MOD = 1000000007LL;\n    int* flat = (int*) malloc((size_t) rangesSize * 2 * sizeof(int));\n    for (int i = 0; i < rangesSize; i++) {\n        flat[i * 2] = ranges[i][0];\n        flat[i * 2 + 1] = ranges[i][1];\n    }\n    qsort(flat, (size_t) rangesSize, 2 * sizeof(int), cwCmp);\n    int groups = 0, reach = -1;\n    for (int i = 0; i < rangesSize; i++) {\n        if (flat[i * 2] > reach) groups++;\n        if (flat[i * 2 + 1] > reach) reach = flat[i * 2 + 1];\n    }\n    free(flat);\n    long long answer = 1;\n    for (int i = 0; i < groups; i++) answer = answer * 2 % MOD;\n    return (int) answer;\n}`,
        csharp: `public static int CountWays(int[][] ranges)\n{\n    const long MOD = 1000000007L;\n    var sorted = (int[][]) ranges.Clone();\n    Array.Sort(sorted, (a, b) => a[0].CompareTo(b[0]));\n    int groups = 0, reach = -1;\n    foreach (var r in sorted)\n    {\n        if (r[0] > reach) groups++;\n        reach = Math.Max(reach, r[1]);\n    }\n    long answer = 1;\n    for (int i = 0; i < groups; i++) answer = answer * 2 % MOD;\n    return (int) answer;\n}`,
        go: `func countWays(ranges [][]int) int {\n\tconst MOD = 1000000007\n\tsorted := make([][]int, len(ranges))\n\tcopy(sorted, ranges)\n\tsort.Slice(sorted, func(i, j int) bool { return sorted[i][0] < sorted[j][0] })\n\tgroups, reach := 0, -1\n\tfor _, r := range sorted {\n\t\tif r[0] > reach {\n\t\t\tgroups++\n\t\t}\n\t\tif r[1] > reach {\n\t\t\treach = r[1]\n\t\t}\n\t}\n\tanswer := 1\n\tfor i := 0; i < groups; i++ {\n\t\tanswer = answer * 2 % MOD\n\t}\n\treturn answer\n}`,
        kotlin: `fun countWays(ranges: Array<IntArray>): Int {\n    val mod = 1000000007L\n    val sorted = ranges.sortedBy { it[0] }\n    var groups = 0\n    var reach = -1\n    for (r in sorted) {\n        if (r[0] > reach) groups++\n        if (r[1] > reach) reach = r[1]\n    }\n    var answer = 1L\n    repeat(groups) { answer = answer * 2 % mod }\n    return answer.toInt()\n}`,
        swift: `func countWays(_ ranges: [[Int]]) -> Int {\n    let mod = 1000000007\n    let sorted = ranges.sorted { $0[0] < $1[0] }\n    var groups = 0\n    var reach = -1\n    for r in sorted {\n        if r[0] > reach { groups += 1 }\n        if r[1] > reach { reach = r[1] }\n    }\n    var answer = 1\n    for _ in 0..<groups { answer = answer * 2 % mod }\n    return answer\n}`,
        rust: `fn countWays(ranges: Vec<Vec<i32>>) -> i32 {\n    const MOD: i64 = 1000000007;\n    let mut sorted = ranges.clone();\n    sorted.sort_by_key(|r| r[0]);\n    let mut groups = 0;\n    let mut reach = -1i32;\n    for r in sorted.iter() {\n        if r[0] > reach {\n            groups += 1;\n        }\n        if r[1] > reach {\n            reach = r[1];\n        }\n    }\n    let mut answer: i64 = 1;\n    for _ in 0..groups {\n        answer = answer * 2 % MOD;\n    }\n    answer as i32\n}`,
        php: `function countWays($ranges) {\n    $MOD = 1000000007;\n    $sorted = $ranges;\n    usort($sorted, function($a, $b) { return $a[0] - $b[0]; });\n    $groups = 0;\n    $reach = -1;\n    foreach ($sorted as $r) {\n        if ($r[0] > $reach) $groups++;\n        if ($r[1] > $reach) $reach = $r[1];\n    }\n    $answer = 1;\n    for ($i = 0; $i < $groups; $i++) $answer = $answer * 2 % $MOD;\n    return $answer;\n}`,
        ruby: `def countWays(ranges)\n  mod = 1000000007\n  groups = 0\n  reach = -1\n  ranges.sort_by { |r| r[0] }.each do |start, finish|\n    groups += 1 if start > reach\n    reach = finish if finish > reach\n  end\n  2.pow(groups, mod)\nend`,
      },
    };
  })(),

  // ── Max Non-overlapping Palindrome Substrings (LC 2472) ─────────
  (() => {
    const ref = (s: string, k: number) => {
      const n = s.length;
      const isPal: boolean[][] = [];
      for (let i = 0; i < n; i++) isPal.push(new Array(n).fill(false));
      for (let i = 0; i < n; i++) isPal[i][i] = true;
      for (let len = 2; len <= n; len++) {
        for (let i = 0; i + len - 1 < n; i++) {
          const j = i + len - 1;
          isPal[i][j] = s.charAt(i) === s.charAt(j) && (len === 2 || isPal[i + 1][j - 1]);
        }
      }
      const dp = new Array(n + 1).fill(0);
      for (let i = 1; i <= n; i++) {
        dp[i] = dp[i - 1];
        for (let len = k; len <= k + 1; len++) {
          if (i - len >= 0 && isPal[i - len][i - 1] && dp[i - len] + 1 > dp[i]) dp[i] = dp[i - len] + 1;
        }
      }
      return dp[n];
    };
    return {
      slug: "maximum-number-of-non-overlapping-palindrome-substrings",
      title: "Maximum Number of Non-overlapping Palindrome Substrings",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Greedy", "Amazon", "Google", "Adobe"],
      signature: { funcName: "maxPalindromes", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Choose a set of **non-overlapping** substrings of `s` such that every chosen substring is a **palindrome** of length **at least `k`**.\n\nReturn the maximum number of substrings you can choose.",
        [
          { in: 's = "abaccdbbd", k = 3', out: "2", note: "`aba` and `dbbd`." },
          { in: 's = "aabbaa", k = 2', out: "3", note: "`aa`, `bb` and `aa`." },
          { in: 's = "adbcda", k = 2', out: "0", note: "No palindrome of length 2 or more exists." },
        ],
        ["1 <= k <= s.length <= 2000", "s consists of lowercase English letters."]),
      hints: [
        "Only lengths `k` and `k + 1` ever need to be considered.",
        "Any longer palindrome contains a centred palindrome of length exactly `k` or `k + 1` — and a shorter piece leaves more room for the rest.",
        "So `dp[i]` = the best answer for the prefix of length `i`: skip the character, or close a palindrome of length `k` or `k + 1` here.",
      ],
      editorial: explain({
        idea: "Precompute a palindrome table, then run a prefix DP. `dp[i]` is the best count for `s[0..i-1]`: either `dp[i-1]` (this character joins nothing), or `dp[i-len] + 1` when `s[i-len..i-1]` is a palindrome of length `len`, for `len` in `{k, k+1}`.",
        steps: [
          "Fill `isPal[i][j]` with the usual interval recurrence.",
          "For each prefix length `i`, start from `dp[i-1]`.",
          "For `len = k` and `len = k + 1`, if the window ending at `i-1` is a palindrome, take `dp[i-len] + 1` when it is better.",
          "Return `dp[n]`.",
        ],
        why: "Restricting to two lengths is the whole insight, and it is what turns an O(n³) enumeration into O(n²). A palindrome of length `L > k + 1` has a palindromic core of length `L - 2` at its centre; peeling pairs off until the length is `k` or `k + 1` keeps it a palindrome, keeps it long enough, and frees characters at both ends for other choices — so no optimal answer is ever lost by only looking at the two shortest admissible lengths.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "Checking every palindrome length is unnecessary and too slow at n = 2000.",
          "The substrings must not overlap, which is why the transition jumps back by the full length.",
          "`k = 1` is allowed, and then every single character qualifies.",
        ],
      }),
      examples: [
        { input: '"abaccdbbd"\n3', expectedOutput: "2" },
        { input: '"aabbaa"\n2', expectedOutput: "3" },
        { input: '"adbcda"\n2', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abc";
        const n = ri(rng, 1, 14);
        let s = "";
        for (let i = 0; i < n; i++) s += alphabet.charAt(ri(rng, 0, 2));
        const k = ri(rng, 1, n);
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: `def maxPalindromes(s: str, k: int) -> int:\n    n = len(s)\n    is_pal = [[False] * n for _ in range(n)]\n    for i in range(n):\n        is_pal[i][i] = True\n    for length in range(2, n + 1):\n        for i in range(n - length + 1):\n            j = i + length - 1\n            is_pal[i][j] = s[i] == s[j] and (length == 2 or is_pal[i + 1][j - 1])\n    dp = [0] * (n + 1)\n    for i in range(1, n + 1):\n        dp[i] = dp[i - 1]\n        for length in (k, k + 1):\n            if i - length >= 0 and is_pal[i - length][i - 1]:\n                dp[i] = max(dp[i], dp[i - length] + 1)\n    return dp[n]`,
        javascript: `var maxPalindromes = function(s, k) {\n    var n = s.length, i, j;\n    var isPal = [];\n    for (i = 0; i < n; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(false);\n        isPal.push(row);\n    }\n    for (i = 0; i < n; i++) isPal[i][i] = true;\n    for (var len = 2; len <= n; len++) {\n        for (i = 0; i + len - 1 < n; i++) {\n            j = i + len - 1;\n            isPal[i][j] = s.charAt(i) === s.charAt(j) && (len === 2 || isPal[i + 1][j - 1]);\n        }\n    }\n    var dp = [];\n    for (i = 0; i <= n; i++) dp.push(0);\n    for (i = 1; i <= n; i++) {\n        dp[i] = dp[i - 1];\n        for (var L = k; L <= k + 1; L++) {\n            if (i - L >= 0 && isPal[i - L][i - 1] && dp[i - L] + 1 > dp[i]) dp[i] = dp[i - L] + 1;\n        }\n    }\n    return dp[n];\n};`,
        typescript: `function maxPalindromes(s: string, k: number): number {\n    var n = s.length, i: number, j: number;\n    var isPal: boolean[][] = [];\n    for (i = 0; i < n; i++) {\n        var row: boolean[] = [];\n        for (j = 0; j < n; j++) row.push(false);\n        isPal.push(row);\n    }\n    for (i = 0; i < n; i++) isPal[i][i] = true;\n    for (var len = 2; len <= n; len++) {\n        for (i = 0; i + len - 1 < n; i++) {\n            j = i + len - 1;\n            isPal[i][j] = s.charAt(i) === s.charAt(j) && (len === 2 || isPal[i + 1][j - 1]);\n        }\n    }\n    var dp: number[] = [];\n    for (i = 0; i <= n; i++) dp.push(0);\n    for (i = 1; i <= n; i++) {\n        dp[i] = dp[i - 1];\n        for (var L = k; L <= k + 1; L++) {\n            if (i - L >= 0 && isPal[i - L][i - 1] && dp[i - L] + 1 > dp[i]) dp[i] = dp[i - L] + 1;\n        }\n    }\n    return dp[n];\n}`,
        java: `public static int maxPalindromes(String s, int k) {\n    int n = s.length();\n    boolean[][] isPal = new boolean[n][n];\n    for (int i = 0; i < n; i++) isPal[i][i] = true;\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            isPal[i][j] = s.charAt(i) == s.charAt(j) && (len == 2 || isPal[i + 1][j - 1]);\n        }\n    }\n    int[] dp = new int[n + 1];\n    for (int i = 1; i <= n; i++) {\n        dp[i] = dp[i - 1];\n        for (int len = k; len <= k + 1; len++) {\n            if (i - len >= 0 && isPal[i - len][i - 1]) dp[i] = Math.max(dp[i], dp[i - len] + 1);\n        }\n    }\n    return dp[n];\n}`,
        cpp: `int maxPalindromes(string s, int k) {\n    int n = (int) s.size();\n    vector<vector<bool>> isPal(n, vector<bool>(n, false));\n    for (int i = 0; i < n; i++) isPal[i][i] = true;\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            isPal[i][j] = s[i] == s[j] && (len == 2 || isPal[i + 1][j - 1]);\n        }\n    }\n    vector<int> dp(n + 1, 0);\n    for (int i = 1; i <= n; i++) {\n        dp[i] = dp[i - 1];\n        for (int len = k; len <= k + 1; len++) {\n            if (i - len >= 0 && isPal[i - len][i - 1]) dp[i] = max(dp[i], dp[i - len] + 1);\n        }\n    }\n    return dp[n];\n}`,
        c: `int maxPalindromes(char* s, int k) {\n    int n = (int) strlen(s);\n    char* isPal = (char*) calloc((size_t) n * (size_t) n, sizeof(char));\n    for (int i = 0; i < n; i++) isPal[i * n + i] = 1;\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            isPal[i * n + j] = (s[i] == s[j] && (len == 2 || isPal[(i + 1) * n + (j - 1)])) ? 1 : 0;\n        }\n    }\n    int* dp = (int*) calloc((size_t) (n + 1), sizeof(int));\n    for (int i = 1; i <= n; i++) {\n        dp[i] = dp[i - 1];\n        for (int len = k; len <= k + 1; len++) {\n            if (i - len >= 0 && isPal[(i - len) * n + (i - 1)] && dp[i - len] + 1 > dp[i]) dp[i] = dp[i - len] + 1;\n        }\n    }\n    int answer = dp[n];\n    free(isPal);\n    free(dp);\n    return answer;\n}`,
        csharp: `public static int MaxPalindromes(string s, int k)\n{\n    int n = s.Length;\n    var isPal = new bool[n, n];\n    for (int i = 0; i < n; i++) isPal[i, i] = true;\n    for (int len = 2; len <= n; len++)\n    {\n        for (int i = 0; i + len - 1 < n; i++)\n        {\n            int j = i + len - 1;\n            isPal[i, j] = s[i] == s[j] && (len == 2 || isPal[i + 1, j - 1]);\n        }\n    }\n    var dp = new int[n + 1];\n    for (int i = 1; i <= n; i++)\n    {\n        dp[i] = dp[i - 1];\n        for (int len = k; len <= k + 1; len++)\n        {\n            if (i - len >= 0 && isPal[i - len, i - 1]) dp[i] = Math.Max(dp[i], dp[i - len] + 1);\n        }\n    }\n    return dp[n];\n}`,
        go: `func maxPalindromes(s string, k int) int {\n\tn := len(s)\n\tisPal := make([][]bool, n)\n\tfor i := range isPal {\n\t\tisPal[i] = make([]bool, n)\n\t\tisPal[i][i] = true\n\t}\n\tfor length := 2; length <= n; length++ {\n\t\tfor i := 0; i+length-1 < n; i++ {\n\t\t\tj := i + length - 1\n\t\t\tisPal[i][j] = s[i] == s[j] && (length == 2 || isPal[i+1][j-1])\n\t\t}\n\t}\n\tdp := make([]int, n+1)\n\tfor i := 1; i <= n; i++ {\n\t\tdp[i] = dp[i-1]\n\t\tfor length := k; length <= k+1; length++ {\n\t\t\tif i-length >= 0 && isPal[i-length][i-1] && dp[i-length]+1 > dp[i] {\n\t\t\t\tdp[i] = dp[i-length] + 1\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[n]\n}`,
        kotlin: `fun maxPalindromes(s: String, k: Int): Int {\n    val n = s.length\n    val isPal = Array(n) { BooleanArray(n) }\n    for (i in 0 until n) isPal[i][i] = true\n    for (len in 2..n) {\n        for (i in 0..n - len) {\n            val j = i + len - 1\n            isPal[i][j] = s[i] == s[j] && (len == 2 || isPal[i + 1][j - 1])\n        }\n    }\n    val dp = IntArray(n + 1)\n    for (i in 1..n) {\n        dp[i] = dp[i - 1]\n        for (len in k..k + 1) {\n            if (i - len >= 0 && isPal[i - len][i - 1]) dp[i] = maxOf(dp[i], dp[i - len] + 1)\n        }\n    }\n    return dp[n]\n}`,
        swift: `func maxPalindromes(_ s: String, _ k: Int) -> Int {\n    let chars = Array(s)\n    let n = chars.count\n    var isPal = [[Bool]](repeating: [Bool](repeating: false, count: n), count: n)\n    for i in 0..<n { isPal[i][i] = true }\n    if n >= 2 {\n        for len in 2...n {\n            for i in 0...(n - len) {\n                let j = i + len - 1\n                isPal[i][j] = chars[i] == chars[j] && (len == 2 || isPal[i + 1][j - 1])\n            }\n        }\n    }\n    var dp = [Int](repeating: 0, count: n + 1)\n    for i in 1...n {\n        dp[i] = dp[i - 1]\n        for len in k...(k + 1) {\n            if i - len >= 0 && isPal[i - len][i - 1] {\n                dp[i] = max(dp[i], dp[i - len] + 1)\n            }\n        }\n    }\n    return dp[n]\n}`,
        rust: `fn maxPalindromes(s: String, k: i32) -> i32 {\n    let chars: Vec<char> = s.chars().collect();\n    let n = chars.len();\n    let k = k as usize;\n    let mut is_pal = vec![vec![false; n]; n];\n    for i in 0..n {\n        is_pal[i][i] = true;\n    }\n    for len in 2..=n {\n        for i in 0..=(n - len) {\n            let j = i + len - 1;\n            is_pal[i][j] = chars[i] == chars[j] && (len == 2 || is_pal[i + 1][j - 1]);\n        }\n    }\n    let mut dp = vec![0i32; n + 1];\n    for i in 1..=n {\n        dp[i] = dp[i - 1];\n        for len in k..=(k + 1) {\n            if i >= len && is_pal[i - len][i - 1] {\n                dp[i] = dp[i].max(dp[i - len] + 1);\n            }\n        }\n    }\n    dp[n]\n}`,
        php: `function maxPalindromes($s, $k) {\n    $n = strlen($s);\n    $isPal = [];\n    for ($i = 0; $i < $n; $i++) $isPal[$i] = array_fill(0, $n, false);\n    for ($i = 0; $i < $n; $i++) $isPal[$i][$i] = true;\n    for ($len = 2; $len <= $n; $len++) {\n        for ($i = 0; $i + $len - 1 < $n; $i++) {\n            $j = $i + $len - 1;\n            $isPal[$i][$j] = $s[$i] === $s[$j] && ($len === 2 || $isPal[$i + 1][$j - 1]);\n        }\n    }\n    $dp = array_fill(0, $n + 1, 0);\n    for ($i = 1; $i <= $n; $i++) {\n        $dp[$i] = $dp[$i - 1];\n        for ($len = $k; $len <= $k + 1; $len++) {\n            if ($i - $len >= 0 && $isPal[$i - $len][$i - 1] && $dp[$i - $len] + 1 > $dp[$i]) $dp[$i] = $dp[$i - $len] + 1;\n        }\n    }\n    return $dp[$n];\n}`,
        ruby: `def maxPalindromes(s, k)\n  n = s.length\n  is_pal = Array.new(n) { Array.new(n, false) }\n  (0...n).each { |i| is_pal[i][i] = true }\n  (2..n).each do |len|\n    (0..(n - len)).each do |i|\n      j = i + len - 1\n      is_pal[i][j] = s[i] == s[j] && (len == 2 || is_pal[i + 1][j - 1])\n    end\n  end\n  dp = Array.new(n + 1, 0)\n  (1..n).each do |i|\n    dp[i] = dp[i - 1]\n    (k..(k + 1)).each do |len|\n      next if i - len < 0\n      dp[i] = [dp[i], dp[i - len] + 1].max if is_pal[i - len][i - 1]\n    end\n  end\n  dp[n]\nend`,
      },
    };
  })(),

  // ── Number of Ways to Divide a Long Corridor (LC 2147) ──────────
  (() => {
    const ref = (corridor: string) => {
      const seats: number[] = [];
      for (let i = 0; i < corridor.length; i++) if (corridor.charAt(i) === "S") seats.push(i);
      if (seats.length === 0 || seats.length % 2 !== 0) return 0;
      let answer = 1;
      for (let p = 2; p < seats.length; p += 2) {
        answer = mulMod(answer, seats[p] - seats[p - 1]);
      }
      return answer;
    };
    return {
      slug: "number-of-ways-to-divide-a-long-corridor",
      title: "Number of Ways to Divide a Long Corridor",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "String", "Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "numberOfWays", params: [{ name: "corridor", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A corridor is described by a string where `'S'` marks a seat and `'P'` marks a plant. Walls already stand at both ends.\n\nInstall **additional walls** between positions so that every resulting section contains **exactly two seats**. Return the number of ways to do this, **modulo 10⁹ + 7**. Return 0 if it cannot be done.",
        [
          { in: 'corridor = "SSPPSPS"', out: "3", note: "The divider between the 2nd and 3rd seat may go in any of 3 gaps." },
          { in: 'corridor = "PPSPSP"', out: "1", note: "Two seats total — one section, no wall to place." },
          { in: 'corridor = "S"', out: "0", note: "An odd number of seats can never be paired up." },
        ],
        ["n == corridor.length", "1 <= n <= 10^5", "corridor[i] is either 'S' or 'P'."]),
      hints: [
        "If the number of seats is zero or odd, the answer is 0.",
        "The seats pair up in order: 1st with 2nd, 3rd with 4th, and so on — there is no choice about **which** seats share a section.",
        "The only freedom is *where* each divider sits, between the end of one pair and the start of the next.",
      ],
      editorial: explain({
        idea: "Collect the seat positions. The pairing is forced — seats 1&2, 3&4, … — so the only decisions are the divider positions. Between the 2nd seat of one pair and the 1st seat of the next there are `gap` legal slots, where `gap` is the difference of their indices. Multiply the gaps.",
        steps: [
          "Record the index of every `'S'`.",
          "Return 0 if the count is 0 or odd.",
          "For each boundary — between `seats[2i-1]` and `seats[2i]` — multiply the answer by `seats[2i] - seats[2i-1]`.",
          "Return the product modulo 10⁹ + 7.",
        ],
        why: "The pairing being forced is what collapses this from a DP into a product: a section with exactly two seats and sections read left to right leave no alternative grouping. The gap count is the index difference rather than the number of plants plus one, because a wall may also sit immediately after the second seat — counting slots instead of plants gets that boundary right.",
        time: "O(n)",
        space: "O(n) for the seat list, or O(1) computing the product on the fly",
        pitfalls: [
          "Zero seats is not one way — the answer is 0, since a section must hold exactly two seats.",
          "The gap is `seats[2i] - seats[2i-1]`, which counts the plants between them **plus one**.",
          "Take the product modulo 10⁹ + 7; it grows far past 64 bits otherwise.",
        ],
      }),
      examples: [
        { input: '"SSPPSPS"', expectedOutput: "3" },
        { input: '"PPSPSP"', expectedOutput: "1" },
        { input: '"S"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20);
        let corridor = "";
        for (let i = 0; i < n; i++) corridor += rng() < 0.45 ? "S" : "P";
        return { input: `"${corridor}"`, expectedOutput: String(ref(corridor)) };
      },
      solutions: {
        python: `def numberOfWays(corridor: str) -> int:\n    MOD = 10**9 + 7\n    seats = [i for i, c in enumerate(corridor) if c == "S"]\n    if not seats or len(seats) % 2 != 0:\n        return 0\n    answer = 1\n    for p in range(2, len(seats), 2):\n        answer = answer * (seats[p] - seats[p - 1]) % MOD\n    return answer`,
        javascript: `var numberOfWays = function(corridor) {\n    var MOD = 1000000007;\n    var seats = [];\n    for (var i = 0; i < corridor.length; i++) {\n        if (corridor.charAt(i) === "S") seats.push(i);\n    }\n    if (seats.length === 0 || seats.length % 2 !== 0) return 0;\n    var answer = 1;\n    for (var p = 2; p < seats.length; p += 2) {\n        answer = (answer * (seats[p] - seats[p - 1])) % MOD;\n    }\n    return answer;\n};`,
        typescript: `function numberOfWays(corridor: string): number {\n    var MOD = 1000000007;\n    var seats: number[] = [];\n    for (var i = 0; i < corridor.length; i++) {\n        if (corridor.charAt(i) === "S") seats.push(i);\n    }\n    if (seats.length === 0 || seats.length % 2 !== 0) return 0;\n    var answer = 1;\n    for (var p = 2; p < seats.length; p += 2) {\n        answer = (answer * (seats[p] - seats[p - 1])) % MOD;\n    }\n    return answer;\n}`,
        java: `public static int numberOfWays(String corridor) {\n    final long MOD = 1000000007L;\n    List<Integer> seats = new ArrayList<>();\n    for (int i = 0; i < corridor.length(); i++) {\n        if (corridor.charAt(i) == 'S') seats.add(i);\n    }\n    if (seats.isEmpty() || seats.size() % 2 != 0) return 0;\n    long answer = 1;\n    for (int p = 2; p < seats.size(); p += 2) {\n        answer = answer * (seats.get(p) - seats.get(p - 1)) % MOD;\n    }\n    return (int) answer;\n}`,
        cpp: `int numberOfWays(string corridor) {\n    const long long MOD = 1000000007LL;\n    vector<int> seats;\n    for (int i = 0; i < (int) corridor.size(); i++) {\n        if (corridor[i] == 'S') seats.push_back(i);\n    }\n    if (seats.empty() || seats.size() % 2 != 0) return 0;\n    long long answer = 1;\n    for (size_t p = 2; p < seats.size(); p += 2) {\n        answer = answer * (seats[p] - seats[p - 1]) % MOD;\n    }\n    return (int) answer;\n}`,
        c: `int numberOfWays(char* corridor) {\n    const long long MOD = 1000000007LL;\n    int n = (int) strlen(corridor);\n    int* seats = (int*) malloc((size_t) (n > 0 ? n : 1) * sizeof(int));\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        if (corridor[i] == 'S') seats[count++] = i;\n    }\n    if (count == 0 || count % 2 != 0) {\n        free(seats);\n        return 0;\n    }\n    long long answer = 1;\n    for (int p = 2; p < count; p += 2) {\n        answer = answer * (seats[p] - seats[p - 1]) % MOD;\n    }\n    free(seats);\n    return (int) answer;\n}`,
        csharp: `public static int NumberOfWays(string corridor)\n{\n    const long MOD = 1000000007L;\n    var seats = new List<int>();\n    for (int i = 0; i < corridor.Length; i++)\n    {\n        if (corridor[i] == 'S') seats.Add(i);\n    }\n    if (seats.Count == 0 || seats.Count % 2 != 0) return 0;\n    long answer = 1;\n    for (int p = 2; p < seats.Count; p += 2)\n    {\n        answer = answer * (seats[p] - seats[p - 1]) % MOD;\n    }\n    return (int) answer;\n}`,
        go: `func numberOfWays(corridor string) int {\n\tconst MOD = 1000000007\n\tseats := []int{}\n\tfor i := 0; i < len(corridor); i++ {\n\t\tif corridor[i] == 'S' {\n\t\t\tseats = append(seats, i)\n\t\t}\n\t}\n\tif len(seats) == 0 || len(seats)%2 != 0 {\n\t\treturn 0\n\t}\n\tanswer := 1\n\tfor p := 2; p < len(seats); p += 2 {\n\t\tanswer = answer * (seats[p] - seats[p-1]) % MOD\n\t}\n\treturn answer\n}`,
        kotlin: `fun numberOfWays(corridor: String): Int {\n    val mod = 1000000007L\n    val seats = mutableListOf<Int>()\n    for (i in corridor.indices) {\n        if (corridor[i] == 'S') seats.add(i)\n    }\n    if (seats.isEmpty() || seats.size % 2 != 0) return 0\n    var answer = 1L\n    var p = 2\n    while (p < seats.size) {\n        answer = answer * (seats[p] - seats[p - 1]) % mod\n        p += 2\n    }\n    return answer.toInt()\n}`,
        swift: `func numberOfWays(_ corridor: String) -> Int {\n    let mod = 1000000007\n    var seats = [Int]()\n    for (i, c) in corridor.enumerated() where c == "S" { seats.append(i) }\n    if seats.isEmpty || seats.count % 2 != 0 { return 0 }\n    var answer = 1\n    var p = 2\n    while p < seats.count {\n        answer = answer * (seats[p] - seats[p - 1]) % mod\n        p += 2\n    }\n    return answer\n}`,
        rust: `fn numberOfWays(corridor: String) -> i32 {\n    const MOD: i64 = 1000000007;\n    let seats: Vec<usize> = corridor\n        .char_indices()\n        .filter(|(_, c)| *c == 'S')\n        .map(|(i, _)| i)\n        .collect();\n    if seats.is_empty() || seats.len() % 2 != 0 {\n        return 0;\n    }\n    let mut answer: i64 = 1;\n    let mut p = 2usize;\n    while p < seats.len() {\n        answer = answer * ((seats[p] - seats[p - 1]) as i64) % MOD;\n        p += 2;\n    }\n    answer as i32\n}`,
        php: `function numberOfWays($corridor) {\n    $MOD = 1000000007;\n    $seats = [];\n    for ($i = 0; $i < strlen($corridor); $i++) {\n        if ($corridor[$i] === "S") $seats[] = $i;\n    }\n    $count = count($seats);\n    if ($count === 0 || $count % 2 !== 0) return 0;\n    $answer = 1;\n    for ($p = 2; $p < $count; $p += 2) {\n        $answer = $answer * ($seats[$p] - $seats[$p - 1]) % $MOD;\n    }\n    return $answer;\n}`,
        ruby: `def numberOfWays(corridor)\n  mod = 1000000007\n  seats = []\n  corridor.each_char.with_index { |c, i| seats << i if c == "S" }\n  return 0 if seats.empty? || seats.length.odd?\n  answer = 1\n  p = 2\n  while p < seats.length\n    answer = answer * (seats[p] - seats[p - 1]) % mod\n    p += 2\n  end\n  answer\nend`,
      },
    };
  })(),

  // ── Count Fertile Pyramids in a Land (LC 2088) ──────────────────
  (() => {
    const countOneWay = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const dp: number[][] = [];
      for (let i = 0; i < m; i++) dp.push(new Array(n).fill(0));
      let total = 0;
      for (let i = m - 1; i >= 0; i--) {
        for (let j = 0; j < n; j++) {
          if (grid[i][j] === 0) { dp[i][j] = 0; continue; }
          if (i === m - 1 || j === 0 || j === n - 1) dp[i][j] = 1;
          else dp[i][j] = Math.min(dp[i + 1][j - 1], Math.min(dp[i + 1][j], dp[i + 1][j + 1])) + 1;
          total += dp[i][j] - 1;
        }
      }
      return total;
    };
    const ref = (grid: number[][]) => countOneWay(grid) + countOneWay(grid.slice().reverse());
    return {
      slug: "count-fertile-pyramids-in-a-land",
      title: "Count Fertile Pyramids in a Land",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "countPyramids", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A cell of `grid` is fertile (`1`) or barren (`0`). A **pyramidal plot** of height `h > 1` has an apex at `(r, c)` and covers, for each `i` from 0 to `h-1`, every cell in row `r + i` from column `c - i` to `c + i` — and **every** covered cell must be fertile.\n\nAn **inverse pyramidal plot** is the same shape upside down: rows `r - i` for `i` from 0 to `h-1`.\n\nReturn the total number of pyramidal and inverse pyramidal plots.",
        [
          { in: "grid = [[0,1,1,0],[1,1,1,1]]", out: "2", note: "Two pyramids of height 2, with apexes at (0,1) and (0,2)." },
          { in: "grid = [[1,1,1],[1,1,1]]", out: "2", note: "One pyramid and one inverse pyramid." },
          { in: "grid = [[1,0,1],[0,0,0],[1,0,1]]", out: "0", note: "No plot of height 2 fits." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 1000", "1 <= m * n <= 10^5", "grid[i][j] is either 0 or 1."]),
      hints: [
        "Count the two orientations separately — the second is the first run on the vertically flipped grid.",
        "Let `dp[i][j]` be the height of the tallest pyramid with apex at `(i, j)`.",
        "A pyramid of height `h` at `(i, j)` needs pyramids of height `h-1` at the three cells below-left, below and below-right.",
      ],
      editorial: explain({
        idea: "For one orientation, let `dp[i][j]` be the tallest pyramid whose apex is `(i, j)`. A barren cell gives 0; a cell on the bottom row or on either edge gives 1; otherwise it is one more than the smallest of the three cells directly below. Each cell then contributes `dp[i][j] - 1` plots, since heights 2 through `dp[i][j]` all fit. Run the same pass on the vertically reversed grid for the inverse plots.",
        steps: [
          "Sweep rows bottom-up. Set `dp[i][j] = 0` for barren cells.",
          "Set `dp[i][j] = 1` on the last row and on the first and last columns.",
          "Otherwise `dp[i][j] = min(dp[i+1][j-1], dp[i+1][j], dp[i+1][j+1]) + 1`.",
          "Accumulate `dp[i][j] - 1` over every cell.",
          "Repeat on the row-reversed grid and add the two totals.",
        ],
        why: "Taking the minimum of the three cells below is what enforces the widening triangle without checking every cell of it: a pyramid of height `h` at `(i, j)` is exactly three overlapping pyramids of height `h-1` one row down, and the smallest of them caps how far it can grow. Counting `dp - 1` per apex rather than only the tallest is the other half — a tall pyramid contains every shorter one with the same apex, and each is a distinct plot.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Height 1 — a single cell — does not count as a plot.",
          "Edge columns can only ever host height 1, since the base would run off the grid.",
          "The inverse plots are a second full pass; they are not double the first.",
        ],
      }),
      examples: [
        { input: "[[0,1,1,0],[1,1,1,1]]", expectedOutput: "2" },
        { input: "[[1,1,1],[1,1,1]]", expectedOutput: "2" },
        { input: "[[1,0,1],[0,0,0],[1,0,1]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 7), n = ri(rng, 1, 7);
        const grid = Array.from({ length: m }, () =>
          Array.from({ length: n }, () => (rng() < 0.75 ? 1 : 0)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countPyramids(grid: List[List[int]]) -> int:\n    def one_way(g: List[List[int]]) -> int:\n        m, n = len(g), len(g[0])\n        dp = [[0] * n for _ in range(m)]\n        total = 0\n        for i in range(m - 1, -1, -1):\n            for j in range(n):\n                if g[i][j] == 0:\n                    dp[i][j] = 0\n                    continue\n                if i == m - 1 or j == 0 or j == n - 1:\n                    dp[i][j] = 1\n                else:\n                    dp[i][j] = min(dp[i + 1][j - 1], dp[i + 1][j], dp[i + 1][j + 1]) + 1\n                total += dp[i][j] - 1\n        return total\n\n    return one_way(grid) + one_way(grid[::-1])`,
        javascript: `var countPyramids = function(grid) {\n    var oneWay = function(g) {\n        var m = g.length, n = g[0].length, i, j;\n        var dp = [];\n        for (i = 0; i < m; i++) {\n            var row = [];\n            for (j = 0; j < n; j++) row.push(0);\n            dp.push(row);\n        }\n        var total = 0;\n        for (i = m - 1; i >= 0; i--) {\n            for (j = 0; j < n; j++) {\n                if (g[i][j] === 0) { dp[i][j] = 0; continue; }\n                if (i === m - 1 || j === 0 || j === n - 1) dp[i][j] = 1;\n                else dp[i][j] = Math.min(dp[i + 1][j - 1], Math.min(dp[i + 1][j], dp[i + 1][j + 1])) + 1;\n                total += dp[i][j] - 1;\n            }\n        }\n        return total;\n    };\n    var flipped = grid.slice();\n    flipped.reverse();\n    return oneWay(grid) + oneWay(flipped);\n};`,
        typescript: `function countPyramids(grid: number[][]): number {\n    var oneWay = function(g: number[][]): number {\n        var m = g.length, n = g[0].length, i: number, j: number;\n        var dp: number[][] = [];\n        for (i = 0; i < m; i++) {\n            var row: number[] = [];\n            for (j = 0; j < n; j++) row.push(0);\n            dp.push(row);\n        }\n        var total = 0;\n        for (i = m - 1; i >= 0; i--) {\n            for (j = 0; j < n; j++) {\n                if (g[i][j] === 0) { dp[i][j] = 0; continue; }\n                if (i === m - 1 || j === 0 || j === n - 1) dp[i][j] = 1;\n                else dp[i][j] = Math.min(dp[i + 1][j - 1], Math.min(dp[i + 1][j], dp[i + 1][j + 1])) + 1;\n                total += dp[i][j] - 1;\n            }\n        }\n        return total;\n    };\n    var flipped = grid.slice();\n    flipped.reverse();\n    return oneWay(grid) + oneWay(flipped);\n}`,
        java: `public static int countPyramids(int[][] grid) {\n    int m = grid.length;\n    int[][] flipped = new int[m][];\n    for (int i = 0; i < m; i++) flipped[i] = grid[m - 1 - i];\n    return pyramidPass(grid) + pyramidPass(flipped);\n}\n\nprivate static int pyramidPass(int[][] g) {\n    int m = g.length, n = g[0].length;\n    int[][] dp = new int[m][n];\n    int total = 0;\n    for (int i = m - 1; i >= 0; i--) {\n        for (int j = 0; j < n; j++) {\n            if (g[i][j] == 0) {\n                dp[i][j] = 0;\n                continue;\n            }\n            if (i == m - 1 || j == 0 || j == n - 1) dp[i][j] = 1;\n            else dp[i][j] = Math.min(dp[i + 1][j - 1], Math.min(dp[i + 1][j], dp[i + 1][j + 1])) + 1;\n            total += dp[i][j] - 1;\n        }\n    }\n    return total;\n}`,
        cpp: `static int pyramidPass(vector<vector<int>>& g) {\n    int m = (int) g.size(), n = (int) g[0].size();\n    vector<vector<int>> dp(m, vector<int>(n, 0));\n    int total = 0;\n    for (int i = m - 1; i >= 0; i--) {\n        for (int j = 0; j < n; j++) {\n            if (g[i][j] == 0) {\n                dp[i][j] = 0;\n                continue;\n            }\n            if (i == m - 1 || j == 0 || j == n - 1) dp[i][j] = 1;\n            else dp[i][j] = min(dp[i + 1][j - 1], min(dp[i + 1][j], dp[i + 1][j + 1])) + 1;\n            total += dp[i][j] - 1;\n        }\n    }\n    return total;\n}\n\nint countPyramids(vector<vector<int>>& grid) {\n    vector<vector<int>> flipped(grid.rbegin(), grid.rend());\n    return pyramidPass(grid) + pyramidPass(flipped);\n}`,
        c: `static int pyramidPass(int** g, int m, int n) {\n    int* dp = (int*) calloc((size_t) m * (size_t) n, sizeof(int));\n    int total = 0;\n    for (int i = m - 1; i >= 0; i--) {\n        for (int j = 0; j < n; j++) {\n            if (g[i][j] == 0) {\n                dp[i * n + j] = 0;\n                continue;\n            }\n            if (i == m - 1 || j == 0 || j == n - 1) {\n                dp[i * n + j] = 1;\n            } else {\n                int a = dp[(i + 1) * n + (j - 1)];\n                int b = dp[(i + 1) * n + j];\n                int c = dp[(i + 1) * n + (j + 1)];\n                int lo = a < b ? a : b;\n                if (c < lo) lo = c;\n                dp[i * n + j] = lo + 1;\n            }\n            total += dp[i * n + j] - 1;\n        }\n    }\n    free(dp);\n    return total;\n}\n\nint countPyramids(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    int** flipped = (int**) malloc((size_t) m * sizeof(int*));\n    for (int i = 0; i < m; i++) flipped[i] = grid[m - 1 - i];\n    int answer = pyramidPass(grid, m, n) + pyramidPass(flipped, m, n);\n    free(flipped);\n    return answer;\n}`,
        csharp: `public static int CountPyramids(int[][] grid)\n{\n    int m = grid.Length;\n    var flipped = new int[m][];\n    for (int i = 0; i < m; i++) flipped[i] = grid[m - 1 - i];\n    return PyramidPass(grid) + PyramidPass(flipped);\n}\n\nprivate static int PyramidPass(int[][] g)\n{\n    int m = g.Length, n = g[0].Length;\n    var dp = new int[m, n];\n    int total = 0;\n    for (int i = m - 1; i >= 0; i--)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (g[i][j] == 0)\n            {\n                dp[i, j] = 0;\n                continue;\n            }\n            if (i == m - 1 || j == 0 || j == n - 1) dp[i, j] = 1;\n            else dp[i, j] = Math.Min(dp[i + 1, j - 1], Math.Min(dp[i + 1, j], dp[i + 1, j + 1])) + 1;\n            total += dp[i, j] - 1;\n        }\n    }\n    return total;\n}`,
        go: `func pyramidPass(g [][]int) int {\n\tm, n := len(g), len(g[0])\n\tdp := make([][]int, m)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, n)\n\t}\n\ttotal := 0\n\tfor i := m - 1; i >= 0; i-- {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif g[i][j] == 0 {\n\t\t\t\tdp[i][j] = 0\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tif i == m-1 || j == 0 || j == n-1 {\n\t\t\t\tdp[i][j] = 1\n\t\t\t} else {\n\t\t\t\tlo := dp[i+1][j-1]\n\t\t\t\tif dp[i+1][j] < lo {\n\t\t\t\t\tlo = dp[i+1][j]\n\t\t\t\t}\n\t\t\t\tif dp[i+1][j+1] < lo {\n\t\t\t\t\tlo = dp[i+1][j+1]\n\t\t\t\t}\n\t\t\t\tdp[i][j] = lo + 1\n\t\t\t}\n\t\t\ttotal += dp[i][j] - 1\n\t\t}\n\t}\n\treturn total\n}\n\nfunc countPyramids(grid [][]int) int {\n\tm := len(grid)\n\tflipped := make([][]int, m)\n\tfor i := 0; i < m; i++ {\n\t\tflipped[i] = grid[m-1-i]\n\t}\n\treturn pyramidPass(grid) + pyramidPass(flipped)\n}`,
        kotlin: `private fun pyramidPass(g: Array<IntArray>): Int {\n    val m = g.size\n    val n = g[0].size\n    val dp = Array(m) { IntArray(n) }\n    var total = 0\n    for (i in m - 1 downTo 0) {\n        for (j in 0 until n) {\n            if (g[i][j] == 0) {\n                dp[i][j] = 0\n                continue\n            }\n            dp[i][j] = if (i == m - 1 || j == 0 || j == n - 1) 1\n            else minOf(dp[i + 1][j - 1], dp[i + 1][j], dp[i + 1][j + 1]) + 1\n            total += dp[i][j] - 1\n        }\n    }\n    return total\n}\n\nfun countPyramids(grid: Array<IntArray>): Int {\n    val flipped = Array(grid.size) { grid[grid.size - 1 - it] }\n    return pyramidPass(grid) + pyramidPass(flipped)\n}`,
        swift: `func countPyramids(_ grid: [[Int]]) -> Int {\n    func pass(_ g: [[Int]]) -> Int {\n        let m = g.count\n        let n = g[0].count\n        var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: m)\n        var total = 0\n        var i = m - 1\n        while i >= 0 {\n            for j in 0..<n {\n                if g[i][j] == 0 {\n                    dp[i][j] = 0\n                    continue\n                }\n                if i == m - 1 || j == 0 || j == n - 1 {\n                    dp[i][j] = 1\n                } else {\n                    dp[i][j] = min(dp[i + 1][j - 1], min(dp[i + 1][j], dp[i + 1][j + 1])) + 1\n                }\n                total += dp[i][j] - 1\n            }\n            i -= 1\n        }\n        return total\n    }\n    return pass(grid) + pass(grid.reversed())\n}`,
        rust: `fn countPyramids(grid: Vec<Vec<i32>>) -> i32 {\n    fn pass(g: &Vec<Vec<i32>>) -> i32 {\n        let m = g.len();\n        let n = g[0].len();\n        let mut dp = vec![vec![0i32; n]; m];\n        let mut total = 0;\n        for i in (0..m).rev() {\n            for j in 0..n {\n                if g[i][j] == 0 {\n                    dp[i][j] = 0;\n                    continue;\n                }\n                dp[i][j] = if i == m - 1 || j == 0 || j == n - 1 {\n                    1\n                } else {\n                    dp[i + 1][j - 1].min(dp[i + 1][j]).min(dp[i + 1][j + 1]) + 1\n                };\n                total += dp[i][j] - 1;\n            }\n        }\n        total\n    }\n    let flipped: Vec<Vec<i32>> = grid.iter().rev().cloned().collect();\n    pass(&grid) + pass(&flipped)\n}`,
        php: `function pyramidPass($g) {\n    $m = count($g);\n    $n = count($g[0]);\n    $dp = [];\n    for ($i = 0; $i < $m; $i++) $dp[$i] = array_fill(0, $n, 0);\n    $total = 0;\n    for ($i = $m - 1; $i >= 0; $i--) {\n        for ($j = 0; $j < $n; $j++) {\n            if ($g[$i][$j] === 0) { $dp[$i][$j] = 0; continue; }\n            if ($i === $m - 1 || $j === 0 || $j === $n - 1) $dp[$i][$j] = 1;\n            else $dp[$i][$j] = min($dp[$i + 1][$j - 1], $dp[$i + 1][$j], $dp[$i + 1][$j + 1]) + 1;\n            $total += $dp[$i][$j] - 1;\n        }\n    }\n    return $total;\n}\n\nfunction countPyramids($grid) {\n    $flipped = array_reverse($grid);\n    return pyramidPass($grid) + pyramidPass($flipped);\n}`,
        ruby: `def pyramid_pass(g)\n  m = g.length\n  n = g[0].length\n  dp = Array.new(m) { Array.new(n, 0) }\n  total = 0\n  (m - 1).downto(0) do |i|\n    (0...n).each do |j|\n      if g[i][j] == 0\n        dp[i][j] = 0\n        next\n      end\n      dp[i][j] = if i == m - 1 || j == 0 || j == n - 1\n                   1\n                 else\n                   [dp[i + 1][j - 1], dp[i + 1][j], dp[i + 1][j + 1]].min + 1\n                 end\n      total += dp[i][j] - 1\n    end\n  end\n  total\nend\n\ndef countPyramids(grid)\n  pyramid_pass(grid) + pyramid_pass(grid.reverse)\nend`,
      },
    };
  })(),

  // ── Minimum Number of Work Sessions to Finish Tasks (LC 1986) ───
  (() => {
    const ref = (tasks: number[], sessionTime: number) => {
      const n = tasks.length;
      const full = 1 << n;
      const INF = 1000000;
      const sessions = new Array(full).fill(INF);
      const left = new Array(full).fill(0);
      sessions[0] = 1;
      left[0] = sessionTime;
      for (let mask = 0; mask < full; mask++) {
        if (sessions[mask] === INF) continue;
        for (let i = 0; i < n; i++) {
          if (mask & (1 << i)) continue;
          let s: number, l: number;
          if (left[mask] >= tasks[i]) { s = sessions[mask]; l = left[mask] - tasks[i]; }
          else { s = sessions[mask] + 1; l = sessionTime - tasks[i]; }
          const next = mask | (1 << i);
          if (s < sessions[next] || (s === sessions[next] && l > left[next])) {
            sessions[next] = s;
            left[next] = l;
          }
        }
      }
      return sessions[full - 1];
    };
    return {
      slug: "minimum-number-of-work-sessions-to-finish-the-tasks",
      title: "Minimum Number of Work Sessions to Finish the Tasks",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Bit Manipulation", "Bitmask", "Backtracking", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "minSessions", params: [{ name: "tasks", type: "int[]" as const }, { name: "sessionTime", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`tasks[i]` is how many hours task `i` takes. You work in **sessions** of at most `sessionTime` consecutive hours. A task must be finished **within a single session** — it cannot be split — and tasks may be done in any order.\n\nReturn the minimum number of sessions needed to finish every task.",
        [
          { in: "tasks = [1,2,3], sessionTime = 3", out: "2", note: "Session 1 does tasks 0 and 1; session 2 does task 2." },
          { in: "tasks = [3,1,3,1,1], sessionTime = 8", out: "2", note: "3 + 3 + 1 in the first, 1 + 1 in the second." },
          { in: "tasks = [1,2,3,4,5], sessionTime = 15", out: "1", note: "Everything fits in one session." },
        ],
        ["n == tasks.length", "1 <= n <= 14", "1 <= tasks[i] <= 10", "max(tasks[i]) <= sessionTime <= 15"]),
      hints: [
        "`n <= 14`, which is the signature of a bitmask over the set of finished tasks.",
        "A state needs two numbers: how many sessions are used, and how much time is left in the current one.",
        "Prefer fewer sessions; among equal session counts prefer more time remaining.",
      ],
      editorial: explain({
        idea: "Bitmask DP over the set of completed tasks. For each state store the pair `(sessions used, time left in the current session)` and keep the lexicographically best — fewer sessions first, then more time remaining. Adding a task either fits in the current session or opens a new one.",
        steps: [
          "Start at `mask = 0` with one empty session open: `sessions = 1`, `left = sessionTime`.",
          "For each reachable `mask` and each unfinished task `i`: if `left >= tasks[i]` stay in the session and subtract; otherwise start a new session with `sessionTime - tasks[i]` left.",
          "Keep the better pair at `mask | (1 << i)`.",
          "Return the session count at the full mask.",
        ],
        why: "Storing `(sessions, left)` and comparing lexicographically is what makes the greedy inside the DP sound: for a fixed set of completed tasks, fewer sessions is always at least as good, and at equal sessions more remaining time can only widen the options ahead. Without the tie-break the DP would keep an arbitrary representative of a state and miss optimal continuations.",
        time: "O(2ⁿ · n)",
        space: "O(2ⁿ)",
        pitfalls: [
          "A state is not just the session count — two ways to reach the same mask can leave very different amounts of time.",
          "The initial state has **one** session already open, not zero.",
          "Tasks cannot be split across sessions, which is what rules out a simple bin-packing greedy.",
        ],
      }),
      examples: [
        { input: "[1,2,3]\n3", expectedOutput: "2" },
        { input: "[3,1,3,1,1]\n8", expectedOutput: "2" },
        { input: "[1,2,3,4,5]\n15", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 9);
        const tasks = Array.from({ length: n }, () => ri(rng, 1, 10));
        let maxTask = 0;
        for (let i = 0; i < n; i++) if (tasks[i] > maxTask) maxTask = tasks[i];
        const sessionTime = ri(rng, maxTask, 15);
        return { input: `${fmtIntArr(tasks)}\n${sessionTime}`, expectedOutput: String(ref(tasks, sessionTime)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minSessions(tasks: List[int], sessionTime: int) -> int:\n    n = len(tasks)\n    full = 1 << n\n    INF = 10**6\n    sessions = [INF] * full\n    left = [0] * full\n    sessions[0] = 1\n    left[0] = sessionTime\n    for mask in range(full):\n        if sessions[mask] == INF:\n            continue\n        for i in range(n):\n            if mask & (1 << i):\n                continue\n            if left[mask] >= tasks[i]:\n                s, l = sessions[mask], left[mask] - tasks[i]\n            else:\n                s, l = sessions[mask] + 1, sessionTime - tasks[i]\n            nxt = mask | (1 << i)\n            if s < sessions[nxt] or (s == sessions[nxt] and l > left[nxt]):\n                sessions[nxt] = s\n                left[nxt] = l\n    return sessions[full - 1]`,
        javascript: `var minSessions = function(tasks, sessionTime) {\n    var n = tasks.length, full = 1 << n, INF = 1000000, m, i;\n    var sessions = [], left = [];\n    for (m = 0; m < full; m++) { sessions.push(INF); left.push(0); }\n    sessions[0] = 1;\n    left[0] = sessionTime;\n    for (m = 0; m < full; m++) {\n        if (sessions[m] === INF) continue;\n        for (i = 0; i < n; i++) {\n            if (m & (1 << i)) continue;\n            var s, l;\n            if (left[m] >= tasks[i]) { s = sessions[m]; l = left[m] - tasks[i]; }\n            else { s = sessions[m] + 1; l = sessionTime - tasks[i]; }\n            var next = m | (1 << i);\n            if (s < sessions[next] || (s === sessions[next] && l > left[next])) {\n                sessions[next] = s;\n                left[next] = l;\n            }\n        }\n    }\n    return sessions[full - 1];\n};`,
        typescript: `function minSessions(tasks: number[], sessionTime: number): number {\n    var n = tasks.length, full = 1 << n, INF = 1000000, m: number, i: number;\n    var sessions: number[] = [], left: number[] = [];\n    for (m = 0; m < full; m++) { sessions.push(INF); left.push(0); }\n    sessions[0] = 1;\n    left[0] = sessionTime;\n    for (m = 0; m < full; m++) {\n        if (sessions[m] === INF) continue;\n        for (i = 0; i < n; i++) {\n            if (m & (1 << i)) continue;\n            var s: number, l: number;\n            if (left[m] >= tasks[i]) { s = sessions[m]; l = left[m] - tasks[i]; }\n            else { s = sessions[m] + 1; l = sessionTime - tasks[i]; }\n            var next = m | (1 << i);\n            if (s < sessions[next] || (s === sessions[next] && l > left[next])) {\n                sessions[next] = s;\n                left[next] = l;\n            }\n        }\n    }\n    return sessions[full - 1];\n}`,
        java: `public static int minSessions(int[] tasks, int sessionTime) {\n    int n = tasks.length;\n    int full = 1 << n;\n    final int INF = 1000000;\n    int[] sessions = new int[full];\n    int[] left = new int[full];\n    Arrays.fill(sessions, INF);\n    sessions[0] = 1;\n    left[0] = sessionTime;\n    for (int mask = 0; mask < full; mask++) {\n        if (sessions[mask] == INF) continue;\n        for (int i = 0; i < n; i++) {\n            if ((mask & (1 << i)) != 0) continue;\n            int s, l;\n            if (left[mask] >= tasks[i]) {\n                s = sessions[mask];\n                l = left[mask] - tasks[i];\n            } else {\n                s = sessions[mask] + 1;\n                l = sessionTime - tasks[i];\n            }\n            int next = mask | (1 << i);\n            if (s < sessions[next] || (s == sessions[next] && l > left[next])) {\n                sessions[next] = s;\n                left[next] = l;\n            }\n        }\n    }\n    return sessions[full - 1];\n}`,
        cpp: `int minSessions(vector<int>& tasks, int sessionTime) {\n    int n = (int) tasks.size();\n    int full = 1 << n;\n    const int INF = 1000000;\n    vector<int> sessions(full, INF), left(full, 0);\n    sessions[0] = 1;\n    left[0] = sessionTime;\n    for (int mask = 0; mask < full; mask++) {\n        if (sessions[mask] == INF) continue;\n        for (int i = 0; i < n; i++) {\n            if (mask & (1 << i)) continue;\n            int s, l;\n            if (left[mask] >= tasks[i]) {\n                s = sessions[mask];\n                l = left[mask] - tasks[i];\n            } else {\n                s = sessions[mask] + 1;\n                l = sessionTime - tasks[i];\n            }\n            int nxt = mask | (1 << i);\n            if (s < sessions[nxt] || (s == sessions[nxt] && l > left[nxt])) {\n                sessions[nxt] = s;\n                left[nxt] = l;\n            }\n        }\n    }\n    return sessions[full - 1];\n}`,
        c: `int minSessions(int* tasks, int tasksSize, int sessionTime) {\n    int n = tasksSize;\n    int full = 1 << n;\n    const int INF = 1000000;\n    int* sessions = (int*) malloc((size_t) full * sizeof(int));\n    int* left = (int*) calloc((size_t) full, sizeof(int));\n    for (int i = 0; i < full; i++) sessions[i] = INF;\n    sessions[0] = 1;\n    left[0] = sessionTime;\n    for (int mask = 0; mask < full; mask++) {\n        if (sessions[mask] == INF) continue;\n        for (int i = 0; i < n; i++) {\n            if (mask & (1 << i)) continue;\n            int s, l;\n            if (left[mask] >= tasks[i]) {\n                s = sessions[mask];\n                l = left[mask] - tasks[i];\n            } else {\n                s = sessions[mask] + 1;\n                l = sessionTime - tasks[i];\n            }\n            int nxt = mask | (1 << i);\n            if (s < sessions[nxt] || (s == sessions[nxt] && l > left[nxt])) {\n                sessions[nxt] = s;\n                left[nxt] = l;\n            }\n        }\n    }\n    int answer = sessions[full - 1];\n    free(sessions);\n    free(left);\n    return answer;\n}`,
        csharp: `public static int MinSessions(int[] tasks, int sessionTime)\n{\n    int n = tasks.Length;\n    int full = 1 << n;\n    const int INF = 1000000;\n    var sessions = new int[full];\n    var left = new int[full];\n    for (int i = 0; i < full; i++) sessions[i] = INF;\n    sessions[0] = 1;\n    left[0] = sessionTime;\n    for (int mask = 0; mask < full; mask++)\n    {\n        if (sessions[mask] == INF) continue;\n        for (int i = 0; i < n; i++)\n        {\n            if ((mask & (1 << i)) != 0) continue;\n            int s, l;\n            if (left[mask] >= tasks[i])\n            {\n                s = sessions[mask];\n                l = left[mask] - tasks[i];\n            }\n            else\n            {\n                s = sessions[mask] + 1;\n                l = sessionTime - tasks[i];\n            }\n            int next = mask | (1 << i);\n            if (s < sessions[next] || (s == sessions[next] && l > left[next]))\n            {\n                sessions[next] = s;\n                left[next] = l;\n            }\n        }\n    }\n    return sessions[full - 1];\n}`,
        go: `func minSessions(tasks []int, sessionTime int) int {\n\tn := len(tasks)\n\tfull := 1 << n\n\tconst INF = 1000000\n\tsessions := make([]int, full)\n\tleft := make([]int, full)\n\tfor i := range sessions {\n\t\tsessions[i] = INF\n\t}\n\tsessions[0] = 1\n\tleft[0] = sessionTime\n\tfor mask := 0; mask < full; mask++ {\n\t\tif sessions[mask] == INF {\n\t\t\tcontinue\n\t\t}\n\t\tfor i := 0; i < n; i++ {\n\t\t\tif mask&(1<<i) != 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tvar s, l int\n\t\t\tif left[mask] >= tasks[i] {\n\t\t\t\ts, l = sessions[mask], left[mask]-tasks[i]\n\t\t\t} else {\n\t\t\t\ts, l = sessions[mask]+1, sessionTime-tasks[i]\n\t\t\t}\n\t\t\tnext := mask | (1 << i)\n\t\t\tif s < sessions[next] || (s == sessions[next] && l > left[next]) {\n\t\t\t\tsessions[next] = s\n\t\t\t\tleft[next] = l\n\t\t\t}\n\t\t}\n\t}\n\treturn sessions[full-1]\n}`,
        kotlin: `fun minSessions(tasks: IntArray, sessionTime: Int): Int {\n    val n = tasks.size\n    val full = 1 shl n\n    val INF = 1000000\n    val sessions = IntArray(full) { INF }\n    val left = IntArray(full)\n    sessions[0] = 1\n    left[0] = sessionTime\n    for (mask in 0 until full) {\n        if (sessions[mask] == INF) continue\n        for (i in 0 until n) {\n            if (mask and (1 shl i) != 0) continue\n            val s: Int\n            val l: Int\n            if (left[mask] >= tasks[i]) {\n                s = sessions[mask]\n                l = left[mask] - tasks[i]\n            } else {\n                s = sessions[mask] + 1\n                l = sessionTime - tasks[i]\n            }\n            val next = mask or (1 shl i)\n            if (s < sessions[next] || (s == sessions[next] && l > left[next])) {\n                sessions[next] = s\n                left[next] = l\n            }\n        }\n    }\n    return sessions[full - 1]\n}`,
        swift: `func minSessions(_ tasks: [Int], _ sessionTime: Int) -> Int {\n    let n = tasks.count\n    let full = 1 << n\n    let INF = 1000000\n    var sessions = [Int](repeating: INF, count: full)\n    var left = [Int](repeating: 0, count: full)\n    sessions[0] = 1\n    left[0] = sessionTime\n    for mask in 0..<full {\n        if sessions[mask] == INF { continue }\n        for i in 0..<n {\n            if mask & (1 << i) != 0 { continue }\n            var s = 0\n            var l = 0\n            if left[mask] >= tasks[i] {\n                s = sessions[mask]\n                l = left[mask] - tasks[i]\n            } else {\n                s = sessions[mask] + 1\n                l = sessionTime - tasks[i]\n            }\n            let next = mask | (1 << i)\n            if s < sessions[next] || (s == sessions[next] && l > left[next]) {\n                sessions[next] = s\n                left[next] = l\n            }\n        }\n    }\n    return sessions[full - 1]\n}`,
        rust: `fn minSessions(tasks: Vec<i32>, sessionTime: i32) -> i32 {\n    let n = tasks.len();\n    let full = 1usize << n;\n    const INF: i32 = 1000000;\n    let mut sessions = vec![INF; full];\n    let mut left = vec![0i32; full];\n    sessions[0] = 1;\n    left[0] = sessionTime;\n    for mask in 0..full {\n        if sessions[mask] == INF {\n            continue;\n        }\n        for i in 0..n {\n            if mask & (1 << i) != 0 {\n                continue;\n            }\n            let (s, l) = if left[mask] >= tasks[i] {\n                (sessions[mask], left[mask] - tasks[i])\n            } else {\n                (sessions[mask] + 1, sessionTime - tasks[i])\n            };\n            let next = mask | (1 << i);\n            if s < sessions[next] || (s == sessions[next] && l > left[next]) {\n                sessions[next] = s;\n                left[next] = l;\n            }\n        }\n    }\n    sessions[full - 1]\n}`,
        php: `function minSessions($tasks, $sessionTime) {\n    $n = count($tasks);\n    $full = 1 << $n;\n    $INF = 1000000;\n    $sessions = array_fill(0, $full, $INF);\n    $left = array_fill(0, $full, 0);\n    $sessions[0] = 1;\n    $left[0] = $sessionTime;\n    for ($mask = 0; $mask < $full; $mask++) {\n        if ($sessions[$mask] === $INF) continue;\n        for ($i = 0; $i < $n; $i++) {\n            if ($mask & (1 << $i)) continue;\n            if ($left[$mask] >= $tasks[$i]) {\n                $s = $sessions[$mask];\n                $l = $left[$mask] - $tasks[$i];\n            } else {\n                $s = $sessions[$mask] + 1;\n                $l = $sessionTime - $tasks[$i];\n            }\n            $next = $mask | (1 << $i);\n            if ($s < $sessions[$next] || ($s === $sessions[$next] && $l > $left[$next])) {\n                $sessions[$next] = $s;\n                $left[$next] = $l;\n            }\n        }\n    }\n    return $sessions[$full - 1];\n}`,
        ruby: `def minSessions(tasks, sessionTime)\n  n = tasks.length\n  full = 1 << n\n  inf = 1000000\n  sessions = Array.new(full, inf)\n  left = Array.new(full, 0)\n  sessions[0] = 1\n  left[0] = sessionTime\n  (0...full).each do |mask|\n    next if sessions[mask] == inf\n    (0...n).each do |i|\n      next if mask & (1 << i) != 0\n      if left[mask] >= tasks[i]\n        s = sessions[mask]\n        l = left[mask] - tasks[i]\n      else\n        s = sessions[mask] + 1\n        l = sessionTime - tasks[i]\n      end\n      nxt = mask | (1 << i)\n      if s < sessions[nxt] || (s == sessions[nxt] && l > left[nxt])\n        sessions[nxt] = s\n        left[nxt] = l\n      end\n    end\n  end\n  sessions[full - 1]\nend`,
      },
    };
  })(),

  // ── Stone Game VII (LC 1690) ────────────────────────────────────
  (() => {
    const ref = (stones: number[]) => {
      const n = stones.length;
      const pre = new Array(n + 1).fill(0);
      for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + stones[i];
      const dp: number[][] = [];
      for (let i = 0; i < n; i++) dp.push(new Array(n).fill(0));
      for (let len = 2; len <= n; len++) {
        for (let i = 0; i + len - 1 < n; i++) {
          const j = i + len - 1;
          const dropLeft = pre[j + 1] - pre[i + 1] - dp[i + 1][j];
          const dropRight = pre[j] - pre[i] - dp[i][j - 1];
          dp[i][j] = Math.max(dropLeft, dropRight);
        }
      }
      return dp[0][n - 1];
    };
    return {
      slug: "stone-game-vii",
      title: "Stone Game VII",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Game Theory", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "stoneGameVII", params: [{ name: "stones", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Alice and Bob take turns removing a stone from **either end** of the row, Alice first. The player who removes a stone scores the **sum of the remaining stones**.\n\nAlice plays to maximise the difference between her score and Bob's; Bob plays to minimise it. Return that difference with both playing optimally.",
        [
          { in: "stones = [5,3,1,4,2]", out: "6" },
          { in: "stones = [7,90,5,1,100,10,10,2]", out: "122" },
          { in: "stones = [1,2]", out: "2", note: "Alice removes the 1 and scores the remaining 2; Bob then scores 0." },
        ],
        ["n == stones.length", "2 <= n <= 1000", "1 <= stones[i] <= 1000"]),
      hints: [
        "The state is the remaining window `stones[i..j]` — whose turn it is does not need to be stored.",
        "Let `dp[i][j]` be the best difference the **player to move** can force on that window.",
        "Removing the left stone scores `sum(i+1..j)` and hands the opponent `dp[i+1][j]`, so the net is `sum - dp[i+1][j]`.",
      ],
      editorial: explain({
        idea: "Interval DP where `dp[i][j]` is the best score difference the player to move can force on `stones[i..j]`. Each move scores the sum of what remains and then flips the sign of the opponent's best result, so `dp[i][j] = max(sum(i+1..j) - dp[i+1][j], sum(i..j-1) - dp[i][j-1])`.",
        steps: [
          "Build prefix sums so any window's total is O(1).",
          "`dp[i][i] = 0` — one stone left means the mover scores 0.",
          "For increasing window lengths, take the better of dropping the left or the right stone.",
          "Return `dp[0][n-1]`.",
        ],
        why: "Tracking the **difference** rather than the two scores is what removes the player from the state: both play the same maximising rule, and subtracting the opponent's best difference flips the perspective automatically. That halves the state space and is the standard shape for symmetric two-player games.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "The mover scores what **remains**, not the stone removed.",
          "`dp[i][i] = 0`, not `stones[i]` — removing the last stone leaves nothing to score.",
          "Subtract the opponent's result; adding it would model cooperation, not competition.",
        ],
      }),
      examples: [
        { input: "[5,3,1,4,2]", expectedOutput: "6" },
        { input: "[7,90,5,1,100,10,10,2]", expectedOutput: "122" },
        { input: "[1,2]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 12);
        const stones = Array.from({ length: n }, () => ri(rng, 1, 30));
        return { input: fmtIntArr(stones), expectedOutput: String(ref(stones)) };
      },
      solutions: {
        python: `from typing import List\n\ndef stoneGameVII(stones: List[int]) -> int:\n    n = len(stones)\n    pre = [0] * (n + 1)\n    for i in range(n):\n        pre[i + 1] = pre[i] + stones[i]\n    dp = [[0] * n for _ in range(n)]\n    for length in range(2, n + 1):\n        for i in range(n - length + 1):\n            j = i + length - 1\n            dp[i][j] = max(pre[j + 1] - pre[i + 1] - dp[i + 1][j],\n                           pre[j] - pre[i] - dp[i][j - 1])\n    return dp[0][n - 1]`,
        javascript: `var stoneGameVII = function(stones) {\n    var n = stones.length, i, j;\n    var pre = [0];\n    for (i = 0; i < n; i++) pre.push(pre[i] + stones[i]);\n    var dp = [];\n    for (i = 0; i < n; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(0);\n        dp.push(row);\n    }\n    for (var len = 2; len <= n; len++) {\n        for (i = 0; i + len - 1 < n; i++) {\n            j = i + len - 1;\n            var a = pre[j + 1] - pre[i + 1] - dp[i + 1][j];\n            var b = pre[j] - pre[i] - dp[i][j - 1];\n            dp[i][j] = a > b ? a : b;\n        }\n    }\n    return dp[0][n - 1];\n};`,
        typescript: `function stoneGameVII(stones: number[]): number {\n    var n = stones.length, i: number, j: number;\n    var pre: number[] = [0];\n    for (i = 0; i < n; i++) pre.push(pre[i] + stones[i]);\n    var dp: number[][] = [];\n    for (i = 0; i < n; i++) {\n        var row: number[] = [];\n        for (j = 0; j < n; j++) row.push(0);\n        dp.push(row);\n    }\n    for (var len = 2; len <= n; len++) {\n        for (i = 0; i + len - 1 < n; i++) {\n            j = i + len - 1;\n            var a = pre[j + 1] - pre[i + 1] - dp[i + 1][j];\n            var b = pre[j] - pre[i] - dp[i][j - 1];\n            dp[i][j] = a > b ? a : b;\n        }\n    }\n    return dp[0][n - 1];\n}`,
        java: `public static int stoneGameVII(int[] stones) {\n    int n = stones.length;\n    int[] pre = new int[n + 1];\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stones[i];\n    int[][] dp = new int[n][n];\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            dp[i][j] = Math.max(pre[j + 1] - pre[i + 1] - dp[i + 1][j],\n                                pre[j] - pre[i] - dp[i][j - 1]);\n        }\n    }\n    return dp[0][n - 1];\n}`,
        cpp: `int stoneGameVII(vector<int>& stones) {\n    int n = (int) stones.size();\n    vector<int> pre(n + 1, 0);\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stones[i];\n    vector<vector<int>> dp(n, vector<int>(n, 0));\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            dp[i][j] = max(pre[j + 1] - pre[i + 1] - dp[i + 1][j],\n                           pre[j] - pre[i] - dp[i][j - 1]);\n        }\n    }\n    return dp[0][n - 1];\n}`,
        c: `int stoneGameVII(int* stones, int stonesSize) {\n    int n = stonesSize;\n    int* pre = (int*) calloc((size_t) (n + 1), sizeof(int));\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stones[i];\n    int* dp = (int*) calloc((size_t) n * (size_t) n, sizeof(int));\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            int a = pre[j + 1] - pre[i + 1] - dp[(i + 1) * n + j];\n            int b = pre[j] - pre[i] - dp[i * n + (j - 1)];\n            dp[i * n + j] = a > b ? a : b;\n        }\n    }\n    int answer = dp[0 * n + (n - 1)];\n    free(pre);\n    free(dp);\n    return answer;\n}`,
        csharp: `public static int StoneGameVII(int[] stones)\n{\n    int n = stones.Length;\n    var pre = new int[n + 1];\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stones[i];\n    var dp = new int[n, n];\n    for (int len = 2; len <= n; len++)\n    {\n        for (int i = 0; i + len - 1 < n; i++)\n        {\n            int j = i + len - 1;\n            dp[i, j] = Math.Max(pre[j + 1] - pre[i + 1] - dp[i + 1, j],\n                                pre[j] - pre[i] - dp[i, j - 1]);\n        }\n    }\n    return dp[0, n - 1];\n}`,
        go: `func stoneGameVII(stones []int) int {\n\tn := len(stones)\n\tpre := make([]int, n+1)\n\tfor i := 0; i < n; i++ {\n\t\tpre[i+1] = pre[i] + stones[i]\n\t}\n\tdp := make([][]int, n)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, n)\n\t}\n\tfor length := 2; length <= n; length++ {\n\t\tfor i := 0; i+length-1 < n; i++ {\n\t\t\tj := i + length - 1\n\t\t\ta := pre[j+1] - pre[i+1] - dp[i+1][j]\n\t\t\tb := pre[j] - pre[i] - dp[i][j-1]\n\t\t\tif a > b {\n\t\t\t\tdp[i][j] = a\n\t\t\t} else {\n\t\t\t\tdp[i][j] = b\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[0][n-1]\n}`,
        kotlin: `fun stoneGameVII(stones: IntArray): Int {\n    val n = stones.size\n    val pre = IntArray(n + 1)\n    for (i in 0 until n) pre[i + 1] = pre[i] + stones[i]\n    val dp = Array(n) { IntArray(n) }\n    for (len in 2..n) {\n        for (i in 0..n - len) {\n            val j = i + len - 1\n            dp[i][j] = maxOf(pre[j + 1] - pre[i + 1] - dp[i + 1][j],\n                             pre[j] - pre[i] - dp[i][j - 1])\n        }\n    }\n    return dp[0][n - 1]\n}`,
        swift: `func stoneGameVII(_ stones: [Int]) -> Int {\n    let n = stones.count\n    var pre = [Int](repeating: 0, count: n + 1)\n    for i in 0..<n { pre[i + 1] = pre[i] + stones[i] }\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n    for len in 2...n {\n        for i in 0...(n - len) {\n            let j = i + len - 1\n            dp[i][j] = max(pre[j + 1] - pre[i + 1] - dp[i + 1][j],\n                           pre[j] - pre[i] - dp[i][j - 1])\n        }\n    }\n    return dp[0][n - 1]\n}`,
        rust: `fn stoneGameVII(stones: Vec<i32>) -> i32 {\n    let n = stones.len();\n    let mut pre = vec![0i32; n + 1];\n    for i in 0..n {\n        pre[i + 1] = pre[i] + stones[i];\n    }\n    let mut dp = vec![vec![0i32; n]; n];\n    for len in 2..=n {\n        for i in 0..=(n - len) {\n            let j = i + len - 1;\n            let a = pre[j + 1] - pre[i + 1] - dp[i + 1][j];\n            let b = pre[j] - pre[i] - dp[i][j - 1];\n            dp[i][j] = a.max(b);\n        }\n    }\n    dp[0][n - 1]\n}`,
        php: `function stoneGameVII($stones) {\n    $n = count($stones);\n    $pre = array_fill(0, $n + 1, 0);\n    for ($i = 0; $i < $n; $i++) $pre[$i + 1] = $pre[$i] + $stones[$i];\n    $dp = [];\n    for ($i = 0; $i < $n; $i++) $dp[$i] = array_fill(0, $n, 0);\n    for ($len = 2; $len <= $n; $len++) {\n        for ($i = 0; $i + $len - 1 < $n; $i++) {\n            $j = $i + $len - 1;\n            $a = $pre[$j + 1] - $pre[$i + 1] - $dp[$i + 1][$j];\n            $b = $pre[$j] - $pre[$i] - $dp[$i][$j - 1];\n            $dp[$i][$j] = max($a, $b);\n        }\n    }\n    return $dp[0][$n - 1];\n}`,
        ruby: `def stoneGameVII(stones)\n  n = stones.length\n  pre = Array.new(n + 1, 0)\n  (0...n).each { |i| pre[i + 1] = pre[i] + stones[i] }\n  dp = Array.new(n) { Array.new(n, 0) }\n  (2..n).each do |len|\n    (0..(n - len)).each do |i|\n      j = i + len - 1\n      dp[i][j] = [pre[j + 1] - pre[i + 1] - dp[i + 1][j],\n                  pre[j] - pre[i] - dp[i][j - 1]].max\n    end\n  end\n  dp[0][n - 1]\nend`,
      },
    };
  })(),

  // ── Paths in Matrix Whose Sum Is Divisible by K (LC 2435) ───────
  (() => {
    const MOD = 1000000007;
    const ref = (grid: number[][], k: number) => {
      const m = grid.length, n = grid[0].length;
      const dp: number[][][] = [];
      for (let i = 0; i < m; i++) {
        const row: number[][] = [];
        for (let j = 0; j < n; j++) row.push(new Array(k).fill(0));
        dp.push(row);
      }
      dp[0][0][grid[0][0] % k] = 1;
      for (let i = 0; i < m; i++) {
        for (let j = 0; j < n; j++) {
          if (i === 0 && j === 0) continue;
          const v = grid[i][j] % k;
          for (let r = 0; r < k; r++) {
            const prev = ((r - v) % k + k) % k;
            let total = 0;
            if (i > 0) total += dp[i - 1][j][prev];
            if (j > 0) total += dp[i][j - 1][prev];
            dp[i][j][r] = total % MOD;
          }
        }
      }
      return dp[m - 1][n - 1][0];
    };
    return {
      slug: "paths-in-matrix-whose-sum-is-divisible-by-k",
      title: "Paths in Matrix Whose Sum Is Divisible by K",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "numberOfPaths", params: [{ name: "grid", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Starting at the top-left cell and moving only **right** or **down**, reach the bottom-right cell. A path's value is the sum of the cells it visits, start and end included.\n\nReturn the number of paths whose value is **divisible by `k`**, modulo 10⁹ + 7.",
        [
          { in: "grid = [[5,2,4],[3,0,5],[0,7,2]], k = 3", out: "2", note: "Two of the six paths sum to a multiple of 3." },
          { in: "grid = [[0,0]], k = 5", out: "1", note: "The single path sums to 0, which is divisible by anything." },
          { in: "grid = [[7,3,4,9],[2,3,6,2],[2,3,7,0]], k = 1", out: "10", note: "Every sum is divisible by 1, so all ten paths count." },
        ],
        ["m == grid.length", "n == grid[i].length", "1 <= m, n <= 5 * 10^4", "1 <= m * n <= 5 * 10^4", "0 <= grid[i][j] <= 100", "1 <= k <= 50"]),
      hints: [
        "You cannot enumerate paths — there are exponentially many. Count them by the **remainder** they carry.",
        "`dp[i][j][r]` = the number of paths reaching `(i, j)` whose partial sum is `r` modulo `k`.",
        "A path arriving with remainder `r` at `(i, j)` came from a neighbour with remainder `(r - grid[i][j]) mod k`.",
      ],
      editorial: explain({
        idea: "Add the remainder to the DP state. `dp[i][j][r]` counts the paths to `(i, j)` whose sum leaves remainder `r`. Each cell pulls from the cell above and the cell to the left, shifting the remainder back by the cell's own value.",
        steps: [
          "Initialise `dp[0][0][grid[0][0] mod k] = 1`.",
          "Sweep in row-major order. For each cell and each target remainder `r`, the contributing remainder upstream is `((r - grid[i][j]) mod k + k) mod k`.",
          "Sum the contributions from above and from the left, modulo 10⁹ + 7.",
          "Return `dp[m-1][n-1][0]`.",
        ],
        why: "Remainders are the only thing about a partial sum that can still matter, so folding the sum into `k` buckets is lossless and turns an exponential path count into `O(m · n · k)` states. The double modulo on `r - grid[i][j]` is not decoration: in most languages the `%` of a negative number is negative, which would index out of the array.",
        time: "O(m · n · k)",
        space: "O(m · n · k), reducible to O(n · k) with a rolling row",
        pitfalls: [
          "A negative intermediate remainder must be normalised before it indexes the table.",
          "The starting cell's own value counts towards the sum.",
          "`k = 1` makes every path count — a useful sanity check on the indexing.",
        ],
      }),
      examples: [
        { input: "[[5,2,4],[3,0,5],[0,7,2]]\n3", expectedOutput: "2" },
        { input: "[[0,0]]\n5", expectedOutput: "1" },
        { input: "[[7,3,4,9],[2,3,6,2],[2,3,7,0]]\n1", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 5), n = ri(rng, 1, 5);
        const grid = Array.from({ length: m }, () =>
          Array.from({ length: n }, () => ri(rng, 0, 20)));
        const k = ri(rng, 1, 8);
        return { input: `${fmtIntMat(grid)}\n${k}`, expectedOutput: String(ref(grid, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numberOfPaths(grid: List[List[int]], k: int) -> int:\n    MOD = 10**9 + 7\n    m, n = len(grid), len(grid[0])\n    dp = [[[0] * k for _ in range(n)] for _ in range(m)]\n    dp[0][0][grid[0][0] % k] = 1\n    for i in range(m):\n        for j in range(n):\n            if i == 0 and j == 0:\n                continue\n            v = grid[i][j] % k\n            for r in range(k):\n                prev = (r - v) % k\n                total = 0\n                if i > 0:\n                    total += dp[i - 1][j][prev]\n                if j > 0:\n                    total += dp[i][j - 1][prev]\n                dp[i][j][r] = total % MOD\n    return dp[m - 1][n - 1][0]`,
        javascript: `var numberOfPaths = function(grid, k) {\n    var MOD = 1000000007;\n    var m = grid.length, n = grid[0].length, i, j, r;\n    var dp = [];\n    for (i = 0; i < m; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) {\n            var cell = [];\n            for (r = 0; r < k; r++) cell.push(0);\n            row.push(cell);\n        }\n        dp.push(row);\n    }\n    dp[0][0][grid[0][0] % k] = 1;\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (i === 0 && j === 0) continue;\n            var v = grid[i][j] % k;\n            for (r = 0; r < k; r++) {\n                var prev = ((r - v) % k + k) % k;\n                var total = 0;\n                if (i > 0) total += dp[i - 1][j][prev];\n                if (j > 0) total += dp[i][j - 1][prev];\n                dp[i][j][r] = total % MOD;\n            }\n        }\n    }\n    return dp[m - 1][n - 1][0];\n};`,
        typescript: `function numberOfPaths(grid: number[][], k: number): number {\n    var MOD = 1000000007;\n    var m = grid.length, n = grid[0].length, i: number, j: number, r: number;\n    var dp: number[][][] = [];\n    for (i = 0; i < m; i++) {\n        var row: number[][] = [];\n        for (j = 0; j < n; j++) {\n            var cell: number[] = [];\n            for (r = 0; r < k; r++) cell.push(0);\n            row.push(cell);\n        }\n        dp.push(row);\n    }\n    dp[0][0][grid[0][0] % k] = 1;\n    for (i = 0; i < m; i++) {\n        for (j = 0; j < n; j++) {\n            if (i === 0 && j === 0) continue;\n            var v = grid[i][j] % k;\n            for (r = 0; r < k; r++) {\n                var prev = ((r - v) % k + k) % k;\n                var total = 0;\n                if (i > 0) total += dp[i - 1][j][prev];\n                if (j > 0) total += dp[i][j - 1][prev];\n                dp[i][j][r] = total % MOD;\n            }\n        }\n    }\n    return dp[m - 1][n - 1][0];\n}`,
        java: `public static int numberOfPaths(int[][] grid, int k) {\n    final int MOD = 1000000007;\n    int m = grid.length, n = grid[0].length;\n    int[][][] dp = new int[m][n][k];\n    dp[0][0][grid[0][0] % k] = 1;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (i == 0 && j == 0) continue;\n            int v = grid[i][j] % k;\n            for (int r = 0; r < k; r++) {\n                int prev = ((r - v) % k + k) % k;\n                long total = 0;\n                if (i > 0) total += dp[i - 1][j][prev];\n                if (j > 0) total += dp[i][j - 1][prev];\n                dp[i][j][r] = (int) (total % MOD);\n            }\n        }\n    }\n    return dp[m - 1][n - 1][0];\n}`,
        cpp: `int numberOfPaths(vector<vector<int>>& grid, int k) {\n    const int MOD = 1000000007;\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    vector<vector<vector<int>>> dp(m, vector<vector<int>>(n, vector<int>(k, 0)));\n    dp[0][0][grid[0][0] % k] = 1;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (i == 0 && j == 0) continue;\n            int v = grid[i][j] % k;\n            for (int r = 0; r < k; r++) {\n                int prev = ((r - v) % k + k) % k;\n                long long total = 0;\n                if (i > 0) total += dp[i - 1][j][prev];\n                if (j > 0) total += dp[i][j - 1][prev];\n                dp[i][j][r] = (int) (total % MOD);\n            }\n        }\n    }\n    return dp[m - 1][n - 1][0];\n}`,
        c: `int numberOfPaths(int** grid, int gridSize, int* gridColSize, int k) {\n    const int MOD = 1000000007;\n    int m = gridSize, n = gridColSize[0];\n    int* dp = (int*) calloc((size_t) m * (size_t) n * (size_t) k, sizeof(int));\n    dp[(0 * n + 0) * k + (grid[0][0] % k)] = 1;\n    for (int i = 0; i < m; i++) {\n        for (int j = 0; j < n; j++) {\n            if (i == 0 && j == 0) continue;\n            int v = grid[i][j] % k;\n            for (int r = 0; r < k; r++) {\n                int prev = ((r - v) % k + k) % k;\n                long long total = 0;\n                if (i > 0) total += dp[((i - 1) * n + j) * k + prev];\n                if (j > 0) total += dp[(i * n + (j - 1)) * k + prev];\n                dp[(i * n + j) * k + r] = (int) (total % MOD);\n            }\n        }\n    }\n    int answer = dp[((m - 1) * n + (n - 1)) * k + 0];\n    free(dp);\n    return answer;\n}`,
        csharp: `public static int NumberOfPaths(int[][] grid, int k)\n{\n    const int MOD = 1000000007;\n    int m = grid.Length, n = grid[0].Length;\n    var dp = new int[m, n, k];\n    dp[0, 0, grid[0][0] % k] = 1;\n    for (int i = 0; i < m; i++)\n    {\n        for (int j = 0; j < n; j++)\n        {\n            if (i == 0 && j == 0) continue;\n            int v = grid[i][j] % k;\n            for (int r = 0; r < k; r++)\n            {\n                int prev = ((r - v) % k + k) % k;\n                long total = 0;\n                if (i > 0) total += dp[i - 1, j, prev];\n                if (j > 0) total += dp[i, j - 1, prev];\n                dp[i, j, r] = (int) (total % MOD);\n            }\n        }\n    }\n    return dp[m - 1, n - 1, 0];\n}`,
        go: `func numberOfPaths(grid [][]int, k int) int {\n\tconst MOD = 1000000007\n\tm, n := len(grid), len(grid[0])\n\tdp := make([][][]int, m)\n\tfor i := range dp {\n\t\tdp[i] = make([][]int, n)\n\t\tfor j := range dp[i] {\n\t\t\tdp[i][j] = make([]int, k)\n\t\t}\n\t}\n\tdp[0][0][grid[0][0]%k] = 1\n\tfor i := 0; i < m; i++ {\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif i == 0 && j == 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tv := grid[i][j] % k\n\t\t\tfor r := 0; r < k; r++ {\n\t\t\t\tprev := ((r-v)%k + k) % k\n\t\t\t\ttotal := 0\n\t\t\t\tif i > 0 {\n\t\t\t\t\ttotal += dp[i-1][j][prev]\n\t\t\t\t}\n\t\t\t\tif j > 0 {\n\t\t\t\t\ttotal += dp[i][j-1][prev]\n\t\t\t\t}\n\t\t\t\tdp[i][j][r] = total % MOD\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[m-1][n-1][0]\n}`,
        kotlin: `fun numberOfPaths(grid: Array<IntArray>, k: Int): Int {\n    val mod = 1000000007\n    val m = grid.size\n    val n = grid[0].size\n    val dp = Array(m) { Array(n) { IntArray(k) } }\n    dp[0][0][grid[0][0] % k] = 1\n    for (i in 0 until m) {\n        for (j in 0 until n) {\n            if (i == 0 && j == 0) continue\n            val v = grid[i][j] % k\n            for (r in 0 until k) {\n                val prev = ((r - v) % k + k) % k\n                var total = 0L\n                if (i > 0) total += dp[i - 1][j][prev]\n                if (j > 0) total += dp[i][j - 1][prev]\n                dp[i][j][r] = (total % mod).toInt()\n            }\n        }\n    }\n    return dp[m - 1][n - 1][0]\n}`,
        swift: `func numberOfPaths(_ grid: [[Int]], _ k: Int) -> Int {\n    let mod = 1000000007\n    let m = grid.count\n    let n = grid[0].count\n    var dp = [[[Int]]](repeating: [[Int]](repeating: [Int](repeating: 0, count: k), count: n), count: m)\n    dp[0][0][grid[0][0] % k] = 1\n    for i in 0..<m {\n        for j in 0..<n {\n            if i == 0 && j == 0 { continue }\n            let v = grid[i][j] % k\n            for r in 0..<k {\n                let prev = ((r - v) % k + k) % k\n                var total = 0\n                if i > 0 { total += dp[i - 1][j][prev] }\n                if j > 0 { total += dp[i][j - 1][prev] }\n                dp[i][j][r] = total % mod\n            }\n        }\n    }\n    return dp[m - 1][n - 1][0]\n}`,
        rust: `fn numberOfPaths(grid: Vec<Vec<i32>>, k: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let m = grid.len();\n    let n = grid[0].len();\n    let k = k as usize;\n    let mut dp = vec![vec![vec![0i64; k]; n]; m];\n    dp[0][0][(grid[0][0] as usize) % k] = 1;\n    for i in 0..m {\n        for j in 0..n {\n            if i == 0 && j == 0 {\n                continue;\n            }\n            let v = (grid[i][j] as usize) % k;\n            for r in 0..k {\n                let prev = (r + k - v) % k;\n                let mut total: i64 = 0;\n                if i > 0 {\n                    total += dp[i - 1][j][prev];\n                }\n                if j > 0 {\n                    total += dp[i][j - 1][prev];\n                }\n                dp[i][j][r] = total % MOD;\n            }\n        }\n    }\n    dp[m - 1][n - 1][0] as i32\n}`,
        php: `function numberOfPaths($grid, $k) {\n    $MOD = 1000000007;\n    $m = count($grid);\n    $n = count($grid[0]);\n    $dp = [];\n    for ($i = 0; $i < $m; $i++) {\n        $dp[$i] = [];\n        for ($j = 0; $j < $n; $j++) $dp[$i][$j] = array_fill(0, $k, 0);\n    }\n    $dp[0][0][$grid[0][0] % $k] = 1;\n    for ($i = 0; $i < $m; $i++) {\n        for ($j = 0; $j < $n; $j++) {\n            if ($i === 0 && $j === 0) continue;\n            $v = $grid[$i][$j] % $k;\n            for ($r = 0; $r < $k; $r++) {\n                $prev = (($r - $v) % $k + $k) % $k;\n                $total = 0;\n                if ($i > 0) $total += $dp[$i - 1][$j][$prev];\n                if ($j > 0) $total += $dp[$i][$j - 1][$prev];\n                $dp[$i][$j][$r] = $total % $MOD;\n            }\n        }\n    }\n    return $dp[$m - 1][$n - 1][0];\n}`,
        ruby: `def numberOfPaths(grid, k)\n  mod = 1000000007\n  m = grid.length\n  n = grid[0].length\n  dp = Array.new(m) { Array.new(n) { Array.new(k, 0) } }\n  dp[0][0][grid[0][0] % k] = 1\n  (0...m).each do |i|\n    (0...n).each do |j|\n      next if i == 0 && j == 0\n      v = grid[i][j] % k\n      (0...k).each do |r|\n        prev = (r - v) % k\n        total = 0\n        total += dp[i - 1][j][prev] if i > 0\n        total += dp[i][j - 1][prev] if j > 0\n        dp[i][j][r] = total % mod\n      end\n    end\n  end\n  dp[m - 1][n - 1][0]\nend`,
      },
    };
  })(),

  // ── Minimum Cost to Split an Array (LC 2547) ────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      const INF = 1000000000;
      const dp = new Array(n + 1).fill(INF);
      dp[n] = 0;
      for (let i = n - 1; i >= 0; i--) {
        const cnt = new Array(n).fill(0);
        let trimmed = 0;
        for (let j = i; j < n; j++) {
          cnt[nums[j]]++;
          if (cnt[nums[j]] === 2) trimmed += 2;
          else if (cnt[nums[j]] > 2) trimmed += 1;
          const cand = k + trimmed + dp[j + 1];
          if (cand < dp[i]) dp[i] = cand;
        }
      }
      return dp[0];
    };
    return {
      slug: "minimum-cost-to-split-an-array",
      title: "Minimum Cost to Split an Array",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Counting", "Google", "Amazon", "Uber"],
      signature: { funcName: "minCost", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The **trimmed** version of a subarray removes every value that appears in it exactly **once**. The **importance** of a subarray is `k` plus the length of its trimmed version.\n\nSplit `nums` into one or more **contiguous** subarrays and return the minimum total importance.",
        [
          { in: "nums = [1,2,1,2,1,3,3], k = 2", out: "8", note: "Split as `[1,2]` (nothing repeats, cost 2) and `[1,2,1,3,3]` (trims to length 4, cost 6)." },
          { in: "nums = [1,2,1,2,1], k = 2", out: "6", note: "Keep it whole: nothing trims away, so 2 + 4 = 6." },
          { in: "nums = [1,2,1,2,1], k = 5", out: "10", note: "A larger `k` discourages splitting." },
        ],
        ["1 <= nums.length <= 1000", "0 <= nums[i] < nums.length", "1 <= k <= 10^9"]),
      hints: [
        "`dp[i]` = the minimum cost for the suffix starting at `i`.",
        "Extending a subarray to the right lets you maintain its trimmed length incrementally.",
        "A value's second occurrence adds **2** to the trimmed length; each further occurrence adds 1.",
      ],
      editorial: explain({
        idea: "Suffix DP. `dp[i]` is the cheapest way to cover `nums[i..]`. For each start `i`, extend the first subarray to every end `j`, maintaining its trimmed length as you go, and take `k + trimmed + dp[j+1]`.",
        steps: [
          "Set `dp[n] = 0`.",
          "For `i` from `n-1` down to 0, reset a count array and `trimmed = 0`.",
          "Extend `j` from `i`: increment `count[nums[j]]`. If it reaches 2, add 2 to `trimmed`; if it is above 2, add 1.",
          "Take the minimum of `k + trimmed + dp[j+1]` over all `j`.",
        ],
        why: "The `+2 / +1` rule is the crux. While a value appears once it contributes nothing to the trimmed length; the moment a second copy arrives, **both** copies start counting, so the jump is 2 — and every later copy adds only itself. Maintaining that incrementally is what keeps the inner loop O(1) per step and the whole solution O(n²) instead of O(n³).",
        time: "O(n²)",
        space: "O(n)",
        pitfalls: [
          "The second occurrence adds 2, not 1 — forgetting the first copy under-counts every repeated value.",
          "The count array must be reset for each start `i`.",
          "A subarray with no repeats still costs `k`, so splitting is never free.",
        ],
      }),
      examples: [
        { input: "[1,2,1,2,1,3,3]\n2", expectedOutput: "8" },
        { input: "[1,2,1,2,1]\n2", expectedOutput: "6" },
        { input: "[1,2,1,2,1]\n5", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const nums = Array.from({ length: n }, () => ri(rng, 0, n - 1));
        const k = ri(rng, 1, 12);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minCost(nums: List[int], k: int) -> int:\n    n = len(nums)\n    INF = 10**9\n    dp = [INF] * (n + 1)\n    dp[n] = 0\n    for i in range(n - 1, -1, -1):\n        cnt = [0] * n\n        trimmed = 0\n        for j in range(i, n):\n            cnt[nums[j]] += 1\n            if cnt[nums[j]] == 2:\n                trimmed += 2\n            elif cnt[nums[j]] > 2:\n                trimmed += 1\n            dp[i] = min(dp[i], k + trimmed + dp[j + 1])\n    return dp[0]`,
        javascript: `var minCost = function(nums, k) {\n    var n = nums.length, INF = 1000000000, i, j;\n    var dp = [];\n    for (i = 0; i <= n; i++) dp.push(INF);\n    dp[n] = 0;\n    for (i = n - 1; i >= 0; i--) {\n        var cnt = [];\n        for (j = 0; j < n; j++) cnt.push(0);\n        var trimmed = 0;\n        for (j = i; j < n; j++) {\n            cnt[nums[j]]++;\n            if (cnt[nums[j]] === 2) trimmed += 2;\n            else if (cnt[nums[j]] > 2) trimmed += 1;\n            var cand = k + trimmed + dp[j + 1];\n            if (cand < dp[i]) dp[i] = cand;\n        }\n    }\n    return dp[0];\n};`,
        typescript: `function minCost(nums: number[], k: number): number {\n    var n = nums.length, INF = 1000000000, i: number, j: number;\n    var dp: number[] = [];\n    for (i = 0; i <= n; i++) dp.push(INF);\n    dp[n] = 0;\n    for (i = n - 1; i >= 0; i--) {\n        var cnt: number[] = [];\n        for (j = 0; j < n; j++) cnt.push(0);\n        var trimmed = 0;\n        for (j = i; j < n; j++) {\n            cnt[nums[j]]++;\n            if (cnt[nums[j]] === 2) trimmed += 2;\n            else if (cnt[nums[j]] > 2) trimmed += 1;\n            var cand = k + trimmed + dp[j + 1];\n            if (cand < dp[i]) dp[i] = cand;\n        }\n    }\n    return dp[0];\n}`,
        java: `public static int minCost(int[] nums, int k) {\n    int n = nums.length;\n    final int INF = 1000000000;\n    int[] dp = new int[n + 1];\n    Arrays.fill(dp, INF);\n    dp[n] = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        int[] cnt = new int[n];\n        int trimmed = 0;\n        for (int j = i; j < n; j++) {\n            cnt[nums[j]]++;\n            if (cnt[nums[j]] == 2) trimmed += 2;\n            else if (cnt[nums[j]] > 2) trimmed += 1;\n            dp[i] = Math.min(dp[i], k + trimmed + dp[j + 1]);\n        }\n    }\n    return dp[0];\n}`,
        cpp: `int minCost(vector<int>& nums, int k) {\n    int n = (int) nums.size();\n    const int INF = 1000000000;\n    vector<int> dp(n + 1, INF);\n    dp[n] = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        vector<int> cnt(n, 0);\n        int trimmed = 0;\n        for (int j = i; j < n; j++) {\n            cnt[nums[j]]++;\n            if (cnt[nums[j]] == 2) trimmed += 2;\n            else if (cnt[nums[j]] > 2) trimmed += 1;\n            dp[i] = min(dp[i], k + trimmed + dp[j + 1]);\n        }\n    }\n    return dp[0];\n}`,
        c: `int minCost(int* nums, int numsSize, int k) {\n    int n = numsSize;\n    const int INF = 1000000000;\n    int* dp = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    for (int i = 0; i <= n; i++) dp[i] = INF;\n    dp[n] = 0;\n    int* cnt = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = n - 1; i >= 0; i--) {\n        for (int t = 0; t < n; t++) cnt[t] = 0;\n        int trimmed = 0;\n        for (int j = i; j < n; j++) {\n            cnt[nums[j]]++;\n            if (cnt[nums[j]] == 2) trimmed += 2;\n            else if (cnt[nums[j]] > 2) trimmed += 1;\n            int cand = k + trimmed + dp[j + 1];\n            if (cand < dp[i]) dp[i] = cand;\n        }\n    }\n    int answer = dp[0];\n    free(dp);\n    free(cnt);\n    return answer;\n}`,
        csharp: `public static int MinCost(int[] nums, int k)\n{\n    int n = nums.Length;\n    const int INF = 1000000000;\n    var dp = new int[n + 1];\n    for (int i = 0; i <= n; i++) dp[i] = INF;\n    dp[n] = 0;\n    for (int i = n - 1; i >= 0; i--)\n    {\n        var cnt = new int[n];\n        int trimmed = 0;\n        for (int j = i; j < n; j++)\n        {\n            cnt[nums[j]]++;\n            if (cnt[nums[j]] == 2) trimmed += 2;\n            else if (cnt[nums[j]] > 2) trimmed += 1;\n            dp[i] = Math.Min(dp[i], k + trimmed + dp[j + 1]);\n        }\n    }\n    return dp[0];\n}`,
        go: `func minCost(nums []int, k int) int {\n\tn := len(nums)\n\tconst INF = 1000000000\n\tdp := make([]int, n+1)\n\tfor i := range dp {\n\t\tdp[i] = INF\n\t}\n\tdp[n] = 0\n\tfor i := n - 1; i >= 0; i-- {\n\t\tcnt := make([]int, n)\n\t\ttrimmed := 0\n\t\tfor j := i; j < n; j++ {\n\t\t\tcnt[nums[j]]++\n\t\t\tif cnt[nums[j]] == 2 {\n\t\t\t\ttrimmed += 2\n\t\t\t} else if cnt[nums[j]] > 2 {\n\t\t\t\ttrimmed++\n\t\t\t}\n\t\t\tif cand := k + trimmed + dp[j+1]; cand < dp[i] {\n\t\t\t\tdp[i] = cand\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[0]\n}`,
        kotlin: `fun minCost(nums: IntArray, k: Int): Int {\n    val n = nums.size\n    val INF = 1000000000\n    val dp = IntArray(n + 1) { INF }\n    dp[n] = 0\n    for (i in n - 1 downTo 0) {\n        val cnt = IntArray(n)\n        var trimmed = 0\n        for (j in i until n) {\n            cnt[nums[j]]++\n            if (cnt[nums[j]] == 2) trimmed += 2\n            else if (cnt[nums[j]] > 2) trimmed += 1\n            dp[i] = minOf(dp[i], k + trimmed + dp[j + 1])\n        }\n    }\n    return dp[0]\n}`,
        swift: `func minCost(_ nums: [Int], _ k: Int) -> Int {\n    let n = nums.count\n    let INF = 1000000000\n    var dp = [Int](repeating: INF, count: n + 1)\n    dp[n] = 0\n    var i = n - 1\n    while i >= 0 {\n        var cnt = [Int](repeating: 0, count: n)\n        var trimmed = 0\n        for j in i..<n {\n            cnt[nums[j]] += 1\n            if cnt[nums[j]] == 2 { trimmed += 2 }\n            else if cnt[nums[j]] > 2 { trimmed += 1 }\n            dp[i] = min(dp[i], k + trimmed + dp[j + 1])\n        }\n        i -= 1\n    }\n    return dp[0]\n}`,
        rust: `fn minCost(nums: Vec<i32>, k: i32) -> i32 {\n    let n = nums.len();\n    const INF: i32 = 1000000000;\n    let mut dp = vec![INF; n + 1];\n    dp[n] = 0;\n    for i in (0..n).rev() {\n        let mut cnt = vec![0i32; n];\n        let mut trimmed = 0i32;\n        for j in i..n {\n            let v = nums[j] as usize;\n            cnt[v] += 1;\n            if cnt[v] == 2 {\n                trimmed += 2;\n            } else if cnt[v] > 2 {\n                trimmed += 1;\n            }\n            let cand = k + trimmed + dp[j + 1];\n            if cand < dp[i] {\n                dp[i] = cand;\n            }\n        }\n    }\n    dp[0]\n}`,
        php: `function minCost($nums, $k) {\n    $n = count($nums);\n    $INF = 1000000000;\n    $dp = array_fill(0, $n + 1, $INF);\n    $dp[$n] = 0;\n    for ($i = $n - 1; $i >= 0; $i--) {\n        $cnt = array_fill(0, $n, 0);\n        $trimmed = 0;\n        for ($j = $i; $j < $n; $j++) {\n            $cnt[$nums[$j]]++;\n            if ($cnt[$nums[$j]] === 2) $trimmed += 2;\n            elseif ($cnt[$nums[$j]] > 2) $trimmed += 1;\n            $cand = $k + $trimmed + $dp[$j + 1];\n            if ($cand < $dp[$i]) $dp[$i] = $cand;\n        }\n    }\n    return $dp[0];\n}`,
        ruby: `def minCost(nums, k)\n  n = nums.length\n  inf = 1000000000\n  dp = Array.new(n + 1, inf)\n  dp[n] = 0\n  (n - 1).downto(0) do |i|\n    cnt = Array.new(n, 0)\n    trimmed = 0\n    (i...n).each do |j|\n      cnt[nums[j]] += 1\n      if cnt[nums[j]] == 2\n        trimmed += 2\n      elsif cnt[nums[j]] > 2\n        trimmed += 1\n      end\n      cand = k + trimmed + dp[j + 1]\n      dp[i] = cand if cand < dp[i]\n    end\n  end\n  dp[0]\nend`,
      },
    };
  })(),

  // ── Number of Great Partitions (LC 2518) ────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      let sum = 0;
      for (let i = 0; i < n; i++) sum += nums[i];
      if (sum < 2 * k) return 0;
      // dp[j] = subsets summing to exactly j, for j < k.
      const dp = new Array(k).fill(0);
      dp[0] = 1;
      for (let i = 0; i < n; i++) {
        for (let j = k - 1; j >= nums[i]; j--) {
          dp[j] = (dp[j] + dp[j - nums[i]]) % MOD5;
        }
      }
      let small = 0;
      for (let j = 0; j < k; j++) small = (small + dp[j]) % MOD5;
      let total = 1;
      for (let i = 0; i < n; i++) total = (total * 2) % MOD5;
      let answer = (total - 2 * small % MOD5) % MOD5;
      return ((answer % MOD5) + MOD5) % MOD5;
    };
    return {
      slug: "number-of-great-partitions",
      title: "Number of Great Partitions",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "countPartitions", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Split `nums` into two **ordered, possibly empty** groups — every element goes to exactly one group. The partition is **great** if **both** groups have a sum of at least `k`.\n\nReturn the number of great partitions, **modulo 10⁹ + 7**. Two partitions differ if any element is in a different group.",
        [
          { in: "nums = [1,2,3,4], k = 4", out: "6", note: "Six of the sixteen assignments leave both sides at 4 or more." },
          { in: "nums = [3,3,3], k = 4", out: "0", note: "The total is 9, so one side is always under 4." },
          { in: "nums = [6,6], k = 2", out: "2", note: "Each element must go to a different group." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 10^4", "1 <= k <= 10^4"]),
      hints: [
        "Count the **bad** partitions instead: those where at least one group falls short of `k`.",
        "If the total is below `2k` no partition can work, so the answer is 0.",
        "Otherwise the two groups can never both fall short, so the bad count is exactly twice the number of subsets summing to less than `k`.",
      ],
      editorial: explain({
        idea: "Complementary counting. There are `2ⁿ` assignments in total. Subtract the bad ones: those with a group summing below `k`. When `sum >= 2k` the two groups cannot both fall short, so the bad partitions are counted exactly twice by a single subset-sum DP over sums below `k`.",
        steps: [
          "If `sum(nums) < 2k`, return 0.",
          "Run a 0/1-knapsack `dp[j]` = subsets summing to exactly `j`, for `j` from 0 to `k-1`.",
          "Let `small` be the total of `dp[0..k-1]`.",
          "Return `2ⁿ - 2 · small` modulo 10⁹ + 7, normalising the subtraction.",
        ],
        why: "The `sum >= 2k` guard is what makes the doubling exact rather than an over-count: if both a subset and its complement could sum below `k`, that partition would be subtracted twice, and inclusion–exclusion would need a third term. With the guard, each bad partition is bad on exactly one side, so doubling a one-sided count is correct. Iterating the knapsack **downwards** in `j` is the usual 0/1 discipline — upwards would let one element be used repeatedly.",
        time: "O(n · k)",
        space: "O(k)",
        pitfalls: [
          "Without the `sum >= 2k` check the doubling over-subtracts and the answer goes negative.",
          "The modular subtraction can go below zero — add the modulus before the final reduction.",
          "Groups may be empty, and the empty group has sum 0, which is why the `j = 0` bucket starts at 1.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4]\n4", expectedOutput: "6" },
        { input: "[3,3,3]\n4", expectedOutput: "0" },
        { input: "[6,6]\n2", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const nums = Array.from({ length: n }, () => ri(rng, 1, 12));
        const k = ri(rng, 1, 30);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countPartitions(nums: List[int], k: int) -> int:\n    MOD = 10**9 + 7\n    if sum(nums) < 2 * k:\n        return 0\n    dp = [0] * k\n    dp[0] = 1\n    for v in nums:\n        for j in range(k - 1, v - 1, -1):\n            dp[j] = (dp[j] + dp[j - v]) % MOD\n    small = sum(dp) % MOD\n    total = pow(2, len(nums), MOD)\n    return (total - 2 * small) % MOD`,
        javascript: `var countPartitions = function(nums, k) {\n    var MOD = 1000000007;\n    var n = nums.length, i, j;\n    var sum = 0;\n    for (i = 0; i < n; i++) sum += nums[i];\n    if (sum < 2 * k) return 0;\n    var dp = [];\n    for (j = 0; j < k; j++) dp.push(0);\n    dp[0] = 1;\n    for (i = 0; i < n; i++) {\n        for (j = k - 1; j >= nums[i]; j--) {\n            dp[j] = (dp[j] + dp[j - nums[i]]) % MOD;\n        }\n    }\n    var small = 0;\n    for (j = 0; j < k; j++) small = (small + dp[j]) % MOD;\n    var total = 1;\n    for (i = 0; i < n; i++) total = (total * 2) % MOD;\n    var answer = (total - 2 * small % MOD) % MOD;\n    return ((answer % MOD) + MOD) % MOD;\n};`,
        typescript: `function countPartitions(nums: number[], k: number): number {\n    var MOD = 1000000007;\n    var n = nums.length, i: number, j: number;\n    var sum = 0;\n    for (i = 0; i < n; i++) sum += nums[i];\n    if (sum < 2 * k) return 0;\n    var dp: number[] = [];\n    for (j = 0; j < k; j++) dp.push(0);\n    dp[0] = 1;\n    for (i = 0; i < n; i++) {\n        for (j = k - 1; j >= nums[i]; j--) {\n            dp[j] = (dp[j] + dp[j - nums[i]]) % MOD;\n        }\n    }\n    var small = 0;\n    for (j = 0; j < k; j++) small = (small + dp[j]) % MOD;\n    var total = 1;\n    for (i = 0; i < n; i++) total = (total * 2) % MOD;\n    var answer = (total - 2 * small % MOD) % MOD;\n    return ((answer % MOD) + MOD) % MOD;\n}`,
        java: `public static int countPartitions(int[] nums, int k) {\n    final long MOD = 1000000007L;\n    int n = nums.length;\n    long sum = 0;\n    for (int v : nums) sum += v;\n    if (sum < 2L * k) return 0;\n    long[] dp = new long[k];\n    dp[0] = 1;\n    for (int v : nums) {\n        for (int j = k - 1; j >= v; j--) dp[j] = (dp[j] + dp[j - v]) % MOD;\n    }\n    long small = 0;\n    for (int j = 0; j < k; j++) small = (small + dp[j]) % MOD;\n    long total = 1;\n    for (int i = 0; i < n; i++) total = total * 2 % MOD;\n    long answer = ((total - 2 * small % MOD) % MOD + MOD) % MOD;\n    return (int) answer;\n}`,
        cpp: `int countPartitions(vector<int>& nums, int k) {\n    const long long MOD = 1000000007LL;\n    int n = (int) nums.size();\n    long long sum = 0;\n    for (int v : nums) sum += v;\n    if (sum < 2LL * k) return 0;\n    vector<long long> dp(k, 0);\n    dp[0] = 1;\n    for (int v : nums) {\n        for (int j = k - 1; j >= v; j--) dp[j] = (dp[j] + dp[j - v]) % MOD;\n    }\n    long long small = 0;\n    for (int j = 0; j < k; j++) small = (small + dp[j]) % MOD;\n    long long total = 1;\n    for (int i = 0; i < n; i++) total = total * 2 % MOD;\n    long long answer = ((total - 2 * small % MOD) % MOD + MOD) % MOD;\n    return (int) answer;\n}`,
        c: `int countPartitions(int* nums, int numsSize, int k) {\n    const long long MOD = 1000000007LL;\n    int n = numsSize;\n    long long sum = 0;\n    for (int i = 0; i < n; i++) sum += nums[i];\n    if (sum < 2LL * k) return 0;\n    long long* dp = (long long*) calloc((size_t) k, sizeof(long long));\n    dp[0] = 1;\n    for (int i = 0; i < n; i++) {\n        for (int j = k - 1; j >= nums[i]; j--) dp[j] = (dp[j] + dp[j - nums[i]]) % MOD;\n    }\n    long long small = 0;\n    for (int j = 0; j < k; j++) small = (small + dp[j]) % MOD;\n    long long total = 1;\n    for (int i = 0; i < n; i++) total = total * 2 % MOD;\n    long long answer = ((total - 2 * small % MOD) % MOD + MOD) % MOD;\n    free(dp);\n    return (int) answer;\n}`,
        csharp: `public static int CountPartitions(int[] nums, int k)\n{\n    const long MOD = 1000000007L;\n    int n = nums.Length;\n    long sum = 0;\n    foreach (var v in nums) sum += v;\n    if (sum < 2L * k) return 0;\n    var dp = new long[k];\n    dp[0] = 1;\n    foreach (var v in nums)\n    {\n        for (int j = k - 1; j >= v; j--) dp[j] = (dp[j] + dp[j - v]) % MOD;\n    }\n    long small = 0;\n    for (int j = 0; j < k; j++) small = (small + dp[j]) % MOD;\n    long total = 1;\n    for (int i = 0; i < n; i++) total = total * 2 % MOD;\n    long answer = ((total - 2 * small % MOD) % MOD + MOD) % MOD;\n    return (int) answer;\n}`,
        go: `func countPartitions(nums []int, k int) int {\n\tconst MOD = 1000000007\n\tn := len(nums)\n\tsum := 0\n\tfor _, v := range nums {\n\t\tsum += v\n\t}\n\tif sum < 2*k {\n\t\treturn 0\n\t}\n\tdp := make([]int, k)\n\tdp[0] = 1\n\tfor _, v := range nums {\n\t\tfor j := k - 1; j >= v; j-- {\n\t\t\tdp[j] = (dp[j] + dp[j-v]) % MOD\n\t\t}\n\t}\n\tsmall := 0\n\tfor j := 0; j < k; j++ {\n\t\tsmall = (small + dp[j]) % MOD\n\t}\n\ttotal := 1\n\tfor i := 0; i < n; i++ {\n\t\ttotal = total * 2 % MOD\n\t}\n\tanswer := ((total-2*small%MOD)%MOD + MOD) % MOD\n\treturn answer\n}`,
        kotlin: `fun countPartitions(nums: IntArray, k: Int): Int {\n    val mod = 1000000007L\n    val n = nums.size\n    var sum = 0L\n    for (v in nums) sum += v\n    if (sum < 2L * k) return 0\n    val dp = LongArray(k)\n    dp[0] = 1\n    for (v in nums) {\n        for (j in k - 1 downTo v) dp[j] = (dp[j] + dp[j - v]) % mod\n    }\n    var small = 0L\n    for (j in 0 until k) small = (small + dp[j]) % mod\n    var total = 1L\n    repeat(n) { total = total * 2 % mod }\n    val answer = ((total - 2 * small % mod) % mod + mod) % mod\n    return answer.toInt()\n}`,
        swift: `func countPartitions(_ nums: [Int], _ k: Int) -> Int {\n    let mod = 1000000007\n    let n = nums.count\n    let sum = nums.reduce(0, +)\n    if sum < 2 * k { return 0 }\n    var dp = [Int](repeating: 0, count: k)\n    dp[0] = 1\n    for v in nums {\n        var j = k - 1\n        while j >= v {\n            dp[j] = (dp[j] + dp[j - v]) % mod\n            j -= 1\n        }\n    }\n    var small = 0\n    for j in 0..<k { small = (small + dp[j]) % mod }\n    var total = 1\n    for _ in 0..<n { total = total * 2 % mod }\n    return ((total - 2 * small % mod) % mod + mod) % mod\n}`,
        rust: `fn countPartitions(nums: Vec<i32>, k: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let n = nums.len();\n    let sum: i64 = nums.iter().map(|&v| v as i64).sum();\n    if sum < 2 * k as i64 {\n        return 0;\n    }\n    let k = k as usize;\n    let mut dp = vec![0i64; k];\n    dp[0] = 1;\n    for &v in nums.iter() {\n        let v = v as usize;\n        let mut j = k as i64 - 1;\n        while j >= v as i64 {\n            let ju = j as usize;\n            dp[ju] = (dp[ju] + dp[ju - v]) % MOD;\n            j -= 1;\n        }\n    }\n    let mut small: i64 = 0;\n    for j in 0..k {\n        small = (small + dp[j]) % MOD;\n    }\n    let mut total: i64 = 1;\n    for _ in 0..n {\n        total = total * 2 % MOD;\n    }\n    (((total - 2 * small % MOD) % MOD + MOD) % MOD) as i32\n}`,
        php: `function countPartitions($nums, $k) {\n    $MOD = 1000000007;\n    $n = count($nums);\n    $sum = array_sum($nums);\n    if ($sum < 2 * $k) return 0;\n    $dp = array_fill(0, $k, 0);\n    $dp[0] = 1;\n    foreach ($nums as $v) {\n        for ($j = $k - 1; $j >= $v; $j--) $dp[$j] = ($dp[$j] + $dp[$j - $v]) % $MOD;\n    }\n    $small = 0;\n    for ($j = 0; $j < $k; $j++) $small = ($small + $dp[$j]) % $MOD;\n    $total = 1;\n    for ($i = 0; $i < $n; $i++) $total = $total * 2 % $MOD;\n    $answer = (($total - 2 * $small % $MOD) % $MOD + $MOD) % $MOD;\n    return $answer;\n}`,
        ruby: `def countPartitions(nums, k)\n  mod = 1000000007\n  n = nums.length\n  return 0 if nums.sum < 2 * k\n  dp = Array.new(k, 0)\n  dp[0] = 1\n  nums.each do |v|\n    (k - 1).downto(v) { |j| dp[j] = (dp[j] + dp[j - v]) % mod }\n  end\n  small = dp.sum % mod\n  total = 2.pow(n, mod)\n  ((total - 2 * small) % mod + mod) % mod\nend`,
      },
    };
  })(),

  // ── Partition Array for Maximum Sum (LC 1043) ───────────────────
  (() => {
    const ref = (arr: number[], k: number) => {
      const n = arr.length;
      const dp = new Array(n + 1).fill(0);
      for (let i = 1; i <= n; i++) {
        let best = 0, peak = 0;
        for (let len = 1; len <= k && len <= i; len++) {
          if (arr[i - len] > peak) peak = arr[i - len];
          const cand = dp[i - len] + peak * len;
          if (cand > best) best = cand;
        }
        dp[i] = best;
      }
      return dp[n];
    };
    return {
      slug: "partition-array-for-maximum-sum",
      title: "Partition Array for Maximum Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Adobe"],
      signature: { funcName: "maxSumAfterPartitioning", params: [{ name: "arr", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Partition `arr` into **contiguous** subarrays of length **at most `k`**. After partitioning, every value in a subarray becomes that subarray's **maximum**.\n\nReturn the largest possible sum of the resulting array.",
        [
          { in: "arr = [1,15,7,9,2,5,10], k = 3", out: "84", note: "`[15,15,15,9,10,10,10]` sums to 84." },
          { in: "arr = [1,4,1,5,7,3,6,1,9,9,3], k = 4", out: "83" },
          { in: "arr = [1], k = 1", out: "1" },
        ],
        ["1 <= arr.length <= 500", "0 <= arr[i] <= 10^9", "1 <= k <= arr.length"]),
      hints: [
        "`dp[i]` = the best sum for the first `i` elements.",
        "The last subarray ends at `i-1` and has some length from 1 to `k`.",
        "Extend that last subarray leftwards, keeping its running maximum as you go.",
      ],
      editorial: explain({
        idea: "Prefix DP. `dp[i]` is the best total for `arr[0..i-1]`. The final subarray has length `len` between 1 and `k`; extending it leftwards lets you keep its maximum in a running variable, so each candidate is `dp[i-len] + max · len`.",
        steps: [
          "Set `dp[0] = 0`.",
          "For each `i` from 1 to `n`, walk `len` from 1 to `min(k, i)`, updating `peak = max(peak, arr[i-len])`.",
          "Take the best `dp[i-len] + peak · len`.",
        ],
        why: "Growing the last block leftwards is what makes the inner loop O(1) per step: the maximum of a window that only ever extends is a single running comparison, so no separate max query is needed. Trying to be greedy — always cutting at the largest value — fails, because a small value is often worth absorbing into a block so that a nearby large value is multiplied more times.",
        time: "O(n · k)",
        space: "O(n)",
        pitfalls: [
          "Subarrays have length **at most** `k`, not exactly `k`.",
          "The running maximum must reset for each `i`; carrying it across resets inflates earlier blocks.",
          "Values reach 10⁹ and blocks reach length `k`, so the running sum needs 64 bits at the upper bound.",
        ],
      }),
      examples: [
        { input: "[1,15,7,9,2,5,10]\n3", expectedOutput: "84" },
        { input: "[1,4,1,5,7,3,6,1,9,9,3]\n4", expectedOutput: "83" },
        { input: "[1]\n1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const arr = Array.from({ length: n }, () => ri(rng, 0, 40));
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(arr)}\n${k}`, expectedOutput: String(ref(arr, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxSumAfterPartitioning(arr: List[int], k: int) -> int:\n    n = len(arr)\n    dp = [0] * (n + 1)\n    for i in range(1, n + 1):\n        peak = 0\n        best = 0\n        for length in range(1, min(k, i) + 1):\n            peak = max(peak, arr[i - length])\n            best = max(best, dp[i - length] + peak * length)\n        dp[i] = best\n    return dp[n]`,
        javascript: `var maxSumAfterPartitioning = function(arr, k) {\n    var n = arr.length, i;\n    var dp = [];\n    for (i = 0; i <= n; i++) dp.push(0);\n    for (i = 1; i <= n; i++) {\n        var best = 0, peak = 0;\n        for (var len = 1; len <= k && len <= i; len++) {\n            if (arr[i - len] > peak) peak = arr[i - len];\n            var cand = dp[i - len] + peak * len;\n            if (cand > best) best = cand;\n        }\n        dp[i] = best;\n    }\n    return dp[n];\n};`,
        typescript: `function maxSumAfterPartitioning(arr: number[], k: number): number {\n    var n = arr.length, i: number;\n    var dp: number[] = [];\n    for (i = 0; i <= n; i++) dp.push(0);\n    for (i = 1; i <= n; i++) {\n        var best = 0, peak = 0;\n        for (var len = 1; len <= k && len <= i; len++) {\n            if (arr[i - len] > peak) peak = arr[i - len];\n            var cand = dp[i - len] + peak * len;\n            if (cand > best) best = cand;\n        }\n        dp[i] = best;\n    }\n    return dp[n];\n}`,
        java: `public static int maxSumAfterPartitioning(int[] arr, int k) {\n    int n = arr.length;\n    long[] dp = new long[n + 1];\n    for (int i = 1; i <= n; i++) {\n        long best = 0;\n        long peak = 0;\n        for (int len = 1; len <= k && len <= i; len++) {\n            peak = Math.max(peak, arr[i - len]);\n            best = Math.max(best, dp[i - len] + peak * len);\n        }\n        dp[i] = best;\n    }\n    return (int) dp[n];\n}`,
        cpp: `int maxSumAfterPartitioning(vector<int>& arr, int k) {\n    int n = (int) arr.size();\n    vector<long long> dp(n + 1, 0);\n    for (int i = 1; i <= n; i++) {\n        long long best = 0, peak = 0;\n        for (int len = 1; len <= k && len <= i; len++) {\n            peak = max(peak, (long long) arr[i - len]);\n            best = max(best, dp[i - len] + peak * len);\n        }\n        dp[i] = best;\n    }\n    return (int) dp[n];\n}`,
        c: `int maxSumAfterPartitioning(int* arr, int arrSize, int k) {\n    int n = arrSize;\n    long long* dp = (long long*) calloc((size_t) (n + 1), sizeof(long long));\n    for (int i = 1; i <= n; i++) {\n        long long best = 0, peak = 0;\n        for (int len = 1; len <= k && len <= i; len++) {\n            if ((long long) arr[i - len] > peak) peak = arr[i - len];\n            long long cand = dp[i - len] + peak * len;\n            if (cand > best) best = cand;\n        }\n        dp[i] = best;\n    }\n    int answer = (int) dp[n];\n    free(dp);\n    return answer;\n}`,
        csharp: `public static int MaxSumAfterPartitioning(int[] arr, int k)\n{\n    int n = arr.Length;\n    var dp = new long[n + 1];\n    for (int i = 1; i <= n; i++)\n    {\n        long best = 0, peak = 0;\n        for (int len = 1; len <= k && len <= i; len++)\n        {\n            peak = Math.Max(peak, arr[i - len]);\n            best = Math.Max(best, dp[i - len] + peak * len);\n        }\n        dp[i] = best;\n    }\n    return (int) dp[n];\n}`,
        go: `func maxSumAfterPartitioning(arr []int, k int) int {\n\tn := len(arr)\n\tdp := make([]int, n+1)\n\tfor i := 1; i <= n; i++ {\n\t\tbest, peak := 0, 0\n\t\tfor length := 1; length <= k && length <= i; length++ {\n\t\t\tif arr[i-length] > peak {\n\t\t\t\tpeak = arr[i-length]\n\t\t\t}\n\t\t\tif cand := dp[i-length] + peak*length; cand > best {\n\t\t\t\tbest = cand\n\t\t\t}\n\t\t}\n\t\tdp[i] = best\n\t}\n\treturn dp[n]\n}`,
        kotlin: `fun maxSumAfterPartitioning(arr: IntArray, k: Int): Int {\n    val n = arr.size\n    val dp = LongArray(n + 1)\n    for (i in 1..n) {\n        var best = 0L\n        var peak = 0L\n        var len = 1\n        while (len <= k && len <= i) {\n            peak = maxOf(peak, arr[i - len].toLong())\n            best = maxOf(best, dp[i - len] + peak * len)\n            len++\n        }\n        dp[i] = best\n    }\n    return dp[n].toInt()\n}`,
        swift: `func maxSumAfterPartitioning(_ arr: [Int], _ k: Int) -> Int {\n    let n = arr.count\n    var dp = [Int](repeating: 0, count: n + 1)\n    for i in 1...n {\n        var best = 0\n        var peak = 0\n        var len = 1\n        while len <= k && len <= i {\n            peak = max(peak, arr[i - len])\n            best = max(best, dp[i - len] + peak * len)\n            len += 1\n        }\n        dp[i] = best\n    }\n    return dp[n]\n}`,
        rust: `fn maxSumAfterPartitioning(arr: Vec<i32>, k: i32) -> i32 {\n    let n = arr.len();\n    let k = k as usize;\n    let mut dp = vec![0i64; n + 1];\n    for i in 1..=n {\n        let mut best: i64 = 0;\n        let mut peak: i64 = 0;\n        let mut len = 1usize;\n        while len <= k && len <= i {\n            peak = peak.max(arr[i - len] as i64);\n            best = best.max(dp[i - len] + peak * len as i64);\n            len += 1;\n        }\n        dp[i] = best;\n    }\n    dp[n] as i32\n}`,
        php: `function maxSumAfterPartitioning($arr, $k) {\n    $n = count($arr);\n    $dp = array_fill(0, $n + 1, 0);\n    for ($i = 1; $i <= $n; $i++) {\n        $best = 0;\n        $peak = 0;\n        for ($len = 1; $len <= $k && $len <= $i; $len++) {\n            if ($arr[$i - $len] > $peak) $peak = $arr[$i - $len];\n            $cand = $dp[$i - $len] + $peak * $len;\n            if ($cand > $best) $best = $cand;\n        }\n        $dp[$i] = $best;\n    }\n    return $dp[$n];\n}`,
        ruby: `def maxSumAfterPartitioning(arr, k)\n  n = arr.length\n  dp = Array.new(n + 1, 0)\n  (1..n).each do |i|\n    best = 0\n    peak = 0\n    len = 1\n    while len <= k && len <= i\n      peak = arr[i - len] if arr[i - len] > peak\n      cand = dp[i - len] + peak * len\n      best = cand if cand > best\n      len += 1\n    end\n    dp[i] = best\n  end\n  dp[n]\nend`,
      },
    };
  })(),

  // ── Count Special Integers (LC 2376) ────────────────────────────
  (() => {
    const ref = (n: number) => {
      const digits: number[] = [];
      for (let v = n; v > 0; v = Math.floor(v / 10)) digits.push(v % 10);
      digits.reverse();
      const L = digits.length;
      let answer = 0;
      // Every length strictly shorter than n has no upper-bound interaction.
      for (let len = 1; len < L; len++) {
        let cnt = 9;
        for (let i = 0; i < len - 1; i++) cnt *= 9 - i;
        answer += cnt;
      }
      const used = new Array(10).fill(false);
      for (let pos = 0; pos < L; pos++) {
        const start = pos === 0 ? 1 : 0;
        for (let d = start; d < digits[pos]; d++) {
          if (used[d]) continue;
          let cnt = 1, avail = 10 - (pos + 1);
          for (let i = 0; i < L - pos - 1; i++) { cnt *= avail; avail--; }
          answer += cnt;
        }
        if (used[digits[pos]]) return answer;
        used[digits[pos]] = true;
        if (pos === L - 1) answer++;
      }
      return answer;
    };
    return {
      slug: "count-special-integers",
      title: "Count Special Integers",
      difficulty: "HARD" as const,
      tags: ["Math", "Dynamic Programming", "Combinatorics", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "countSpecialNumbers", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A positive integer is **special** when all of its decimal digits are **distinct**.\n\nReturn how many special integers lie in the range `[1, n]`.",
        [
          { in: "n = 20", out: "19", note: "Every number from 1 to 20 except 11." },
          { in: "n = 5", out: "5", note: "All single digits are special." },
          { in: "n = 135", out: "110" },
        ],
        ["1 <= n <= 2 * 10^9"]),
      hints: [
        "Split the count by **number of digits**. Anything shorter than `n` is unconstrained: the first digit has 9 choices and each later digit one fewer than the last.",
        "For numbers with the same digit count as `n`, fix a common prefix and let the next digit be strictly smaller than `n`'s.",
        "Stop the prefix walk the moment `n` itself repeats a digit — no longer prefix is valid.",
      ],
      editorial: explain({
        idea: "Count in two parts. First, all special numbers with fewer digits than `n`: for length `len` that is `9 · 9 · 8 · 7 · …`, one factor per position. Second, walk `n`'s digits left to right keeping the prefix equal to `n`'s; at each position, count the completions where this digit is strictly smaller and unused, filling the rest with any unused digits.",
        steps: [
          "Extract `n`'s digits and let `L` be their count.",
          "For each `len` from 1 to `L-1`, add `9 · P(9, len-1)`.",
          "Walk `pos` from 0 to `L-1`. For each unused digit `d` below `digits[pos]` (and above 0 at `pos = 0`), add the number of ways to fill the remaining `L - pos - 1` positions from the `10 - (pos+1)` still-unused digits.",
          "If `digits[pos]` is already used, stop — no longer prefix of `n` is special.",
          "Otherwise mark it used, and if this was the last position add 1 for `n` itself.",
        ],
        why: "The early stop is what most implementations get wrong. Once `n`'s own prefix repeats a digit, every number sharing that prefix is non-special, so the walk must end — continuing would count completions that can never be valid. The falling-factorial counts come from the same place: after fixing `pos+1` digits, exactly `10 - (pos+1)` remain, and each further position consumes one more.",
        time: "O(L · 10) — at most about a hundred operations",
        space: "O(1)",
        pitfalls: [
          "Leading zeros are not allowed, so the first digit starts at 1.",
          "`n` itself must be added only when the whole walk completes without a repeat.",
          "Breaking out at a repeated digit is mandatory, not an optimisation.",
        ],
      }),
      examples: [
        { input: "20", expectedOutput: "19" },
        { input: "5", expectedOutput: "5" },
        { input: "135", expectedOutput: "110" },
      ],
      gen: (rng: Rng) => {
        // Mix magnitudes so short and long digit strings both show up.
        const scale = ri(rng, 0, 9);
        let hi = 1;
        for (let i = 0; i < scale; i++) hi *= 10;
        const n = ri(rng, 1, Math.min(2000000000, hi * 9 + 9));
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def countSpecialNumbers(n: int) -> int:\n    digits = [int(c) for c in str(n)]\n    L = len(digits)\n    answer = 0\n    for length in range(1, L):\n        cnt = 9\n        for i in range(length - 1):\n            cnt *= 9 - i\n        answer += cnt\n    used = [False] * 10\n    for pos in range(L):\n        start = 1 if pos == 0 else 0\n        for d in range(start, digits[pos]):\n            if used[d]:\n                continue\n            cnt = 1\n            avail = 10 - (pos + 1)\n            for _ in range(L - pos - 1):\n                cnt *= avail\n                avail -= 1\n            answer += cnt\n        if used[digits[pos]]:\n            return answer\n        used[digits[pos]] = True\n        if pos == L - 1:\n            answer += 1\n    return answer`,
        javascript: `var countSpecialNumbers = function(n) {\n    var digits = [], v, i;\n    for (v = n; v > 0; v = Math.floor(v / 10)) digits.push(v % 10);\n    digits.reverse();\n    var L = digits.length, answer = 0;\n    for (var len = 1; len < L; len++) {\n        var cnt = 9;\n        for (i = 0; i < len - 1; i++) cnt *= 9 - i;\n        answer += cnt;\n    }\n    var used = [];\n    for (i = 0; i < 10; i++) used.push(false);\n    for (var pos = 0; pos < L; pos++) {\n        var start = pos === 0 ? 1 : 0;\n        for (var d = start; d < digits[pos]; d++) {\n            if (used[d]) continue;\n            var ways = 1, avail = 10 - (pos + 1);\n            for (i = 0; i < L - pos - 1; i++) { ways *= avail; avail--; }\n            answer += ways;\n        }\n        if (used[digits[pos]]) return answer;\n        used[digits[pos]] = true;\n        if (pos === L - 1) answer++;\n    }\n    return answer;\n};`,
        typescript: `function countSpecialNumbers(n: number): number {\n    var digits: number[] = [], v: number, i: number;\n    for (v = n; v > 0; v = Math.floor(v / 10)) digits.push(v % 10);\n    digits.reverse();\n    var L = digits.length, answer = 0;\n    for (var len = 1; len < L; len++) {\n        var cnt = 9;\n        for (i = 0; i < len - 1; i++) cnt *= 9 - i;\n        answer += cnt;\n    }\n    var used: boolean[] = [];\n    for (i = 0; i < 10; i++) used.push(false);\n    for (var pos = 0; pos < L; pos++) {\n        var start = pos === 0 ? 1 : 0;\n        for (var d = start; d < digits[pos]; d++) {\n            if (used[d]) continue;\n            var ways = 1, avail = 10 - (pos + 1);\n            for (i = 0; i < L - pos - 1; i++) { ways *= avail; avail--; }\n            answer += ways;\n        }\n        if (used[digits[pos]]) return answer;\n        used[digits[pos]] = true;\n        if (pos === L - 1) answer++;\n    }\n    return answer;\n}`,
        java: `public static int countSpecialNumbers(int n) {\n    int[] digits = new int[12];\n    int L = 0;\n    for (int v = n; v > 0; v /= 10) digits[L++] = v % 10;\n    for (int a = 0, b = L - 1; a < b; a++, b--) {\n        int t = digits[a];\n        digits[a] = digits[b];\n        digits[b] = t;\n    }\n    int answer = 0;\n    for (int len = 1; len < L; len++) {\n        int cnt = 9;\n        for (int i = 0; i < len - 1; i++) cnt *= 9 - i;\n        answer += cnt;\n    }\n    boolean[] used = new boolean[10];\n    for (int pos = 0; pos < L; pos++) {\n        int start = pos == 0 ? 1 : 0;\n        for (int d = start; d < digits[pos]; d++) {\n            if (used[d]) continue;\n            int ways = 1;\n            int avail = 10 - (pos + 1);\n            for (int i = 0; i < L - pos - 1; i++) {\n                ways *= avail;\n                avail--;\n            }\n            answer += ways;\n        }\n        if (used[digits[pos]]) return answer;\n        used[digits[pos]] = true;\n        if (pos == L - 1) answer++;\n    }\n    return answer;\n}`,
        cpp: `int countSpecialNumbers(int n) {\n    vector<int> digits;\n    for (int v = n; v > 0; v /= 10) digits.push_back(v % 10);\n    reverse(digits.begin(), digits.end());\n    int L = (int) digits.size();\n    int answer = 0;\n    for (int len = 1; len < L; len++) {\n        int cnt = 9;\n        for (int i = 0; i < len - 1; i++) cnt *= 9 - i;\n        answer += cnt;\n    }\n    vector<bool> used(10, false);\n    for (int pos = 0; pos < L; pos++) {\n        int start = pos == 0 ? 1 : 0;\n        for (int d = start; d < digits[pos]; d++) {\n            if (used[d]) continue;\n            int ways = 1, avail = 10 - (pos + 1);\n            for (int i = 0; i < L - pos - 1; i++) {\n                ways *= avail;\n                avail--;\n            }\n            answer += ways;\n        }\n        if (used[digits[pos]]) return answer;\n        used[digits[pos]] = true;\n        if (pos == L - 1) answer++;\n    }\n    return answer;\n}`,
        c: `int countSpecialNumbers(int n) {\n    int digits[12];\n    int L = 0;\n    for (int v = n; v > 0; v /= 10) digits[L++] = v % 10;\n    for (int a = 0, b = L - 1; a < b; a++, b--) {\n        int t = digits[a];\n        digits[a] = digits[b];\n        digits[b] = t;\n    }\n    int answer = 0;\n    for (int len = 1; len < L; len++) {\n        int cnt = 9;\n        for (int i = 0; i < len - 1; i++) cnt *= 9 - i;\n        answer += cnt;\n    }\n    int used[10];\n    for (int i = 0; i < 10; i++) used[i] = 0;\n    for (int pos = 0; pos < L; pos++) {\n        int start = pos == 0 ? 1 : 0;\n        for (int d = start; d < digits[pos]; d++) {\n            if (used[d]) continue;\n            int ways = 1, avail = 10 - (pos + 1);\n            for (int i = 0; i < L - pos - 1; i++) {\n                ways *= avail;\n                avail--;\n            }\n            answer += ways;\n        }\n        if (used[digits[pos]]) return answer;\n        used[digits[pos]] = 1;\n        if (pos == L - 1) answer++;\n    }\n    return answer;\n}`,
        csharp: `public static int CountSpecialNumbers(int n)\n{\n    var digits = new int[12];\n    int L = 0;\n    for (int v = n; v > 0; v /= 10) digits[L++] = v % 10;\n    Array.Reverse(digits, 0, L);\n    int answer = 0;\n    for (int len = 1; len < L; len++)\n    {\n        int cnt = 9;\n        for (int i = 0; i < len - 1; i++) cnt *= 9 - i;\n        answer += cnt;\n    }\n    var used = new bool[10];\n    for (int pos = 0; pos < L; pos++)\n    {\n        int start = pos == 0 ? 1 : 0;\n        for (int d = start; d < digits[pos]; d++)\n        {\n            if (used[d]) continue;\n            int ways = 1;\n            int avail = 10 - (pos + 1);\n            for (int i = 0; i < L - pos - 1; i++)\n            {\n                ways *= avail;\n                avail--;\n            }\n            answer += ways;\n        }\n        if (used[digits[pos]]) return answer;\n        used[digits[pos]] = true;\n        if (pos == L - 1) answer++;\n    }\n    return answer;\n}`,
        go: `func countSpecialNumbers(n int) int {\n\tdigits := []int{}\n\tfor v := n; v > 0; v /= 10 {\n\t\tdigits = append(digits, v%10)\n\t}\n\tfor a, b := 0, len(digits)-1; a < b; a, b = a+1, b-1 {\n\t\tdigits[a], digits[b] = digits[b], digits[a]\n\t}\n\tL := len(digits)\n\tanswer := 0\n\tfor length := 1; length < L; length++ {\n\t\tcnt := 9\n\t\tfor i := 0; i < length-1; i++ {\n\t\t\tcnt *= 9 - i\n\t\t}\n\t\tanswer += cnt\n\t}\n\tvar used [10]bool\n\tfor pos := 0; pos < L; pos++ {\n\t\tstart := 0\n\t\tif pos == 0 {\n\t\t\tstart = 1\n\t\t}\n\t\tfor d := start; d < digits[pos]; d++ {\n\t\t\tif used[d] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tways, avail := 1, 10-(pos+1)\n\t\t\tfor i := 0; i < L-pos-1; i++ {\n\t\t\t\tways *= avail\n\t\t\t\tavail--\n\t\t\t}\n\t\t\tanswer += ways\n\t\t}\n\t\tif used[digits[pos]] {\n\t\t\treturn answer\n\t\t}\n\t\tused[digits[pos]] = true\n\t\tif pos == L-1 {\n\t\t\tanswer++\n\t\t}\n\t}\n\treturn answer\n}`,
        kotlin: `fun countSpecialNumbers(n: Int): Int {\n    val digits = mutableListOf<Int>()\n    var v = n\n    while (v > 0) {\n        digits.add(v % 10)\n        v /= 10\n    }\n    digits.reverse()\n    val L = digits.size\n    var answer = 0\n    for (len in 1 until L) {\n        var cnt = 9\n        for (i in 0 until len - 1) cnt *= 9 - i\n        answer += cnt\n    }\n    val used = BooleanArray(10)\n    for (pos in 0 until L) {\n        val start = if (pos == 0) 1 else 0\n        for (d in start until digits[pos]) {\n            if (used[d]) continue\n            var ways = 1\n            var avail = 10 - (pos + 1)\n            for (i in 0 until L - pos - 1) {\n                ways *= avail\n                avail--\n            }\n            answer += ways\n        }\n        if (used[digits[pos]]) return answer\n        used[digits[pos]] = true\n        if (pos == L - 1) answer++\n    }\n    return answer\n}`,
        swift: `func countSpecialNumbers(_ n: Int) -> Int {\n    var digits = [Int]()\n    var v = n\n    while v > 0 {\n        digits.append(v % 10)\n        v /= 10\n    }\n    digits.reverse()\n    let L = digits.count\n    var answer = 0\n    for len in 1..<max(L, 1) where len < L {\n        var cnt = 9\n        for i in 0..<(len - 1) { cnt *= 9 - i }\n        answer += cnt\n    }\n    var used = [Bool](repeating: false, count: 10)\n    for pos in 0..<L {\n        let start = pos == 0 ? 1 : 0\n        var d = start\n        while d < digits[pos] {\n            if !used[d] {\n                var ways = 1\n                var avail = 10 - (pos + 1)\n                for _ in 0..<(L - pos - 1) {\n                    ways *= avail\n                    avail -= 1\n                }\n                answer += ways\n            }\n            d += 1\n        }\n        if used[digits[pos]] { return answer }\n        used[digits[pos]] = true\n        if pos == L - 1 { answer += 1 }\n    }\n    return answer\n}`,
        rust: `fn countSpecialNumbers(n: i32) -> i32 {\n    let mut digits: Vec<i32> = Vec::new();\n    let mut v = n;\n    while v > 0 {\n        digits.push(v % 10);\n        v /= 10;\n    }\n    digits.reverse();\n    let l = digits.len();\n    let mut answer = 0i32;\n    for len in 1..l {\n        let mut cnt = 9i32;\n        for i in 0..(len as i32 - 1) {\n            cnt *= 9 - i;\n        }\n        answer += cnt;\n    }\n    let mut used = [false; 10];\n    for pos in 0..l {\n        let start = if pos == 0 { 1 } else { 0 };\n        for d in start..digits[pos] {\n            if used[d as usize] {\n                continue;\n            }\n            let mut ways = 1i32;\n            let mut avail = 10 - (pos as i32 + 1);\n            for _ in 0..(l - pos - 1) {\n                ways *= avail;\n                avail -= 1;\n            }\n            answer += ways;\n        }\n        if used[digits[pos] as usize] {\n            return answer;\n        }\n        used[digits[pos] as usize] = true;\n        if pos == l - 1 {\n            answer += 1;\n        }\n    }\n    answer\n}`,
        php: `function countSpecialNumbers($n) {\n    $digits = [];\n    for ($v = $n; $v > 0; $v = intdiv($v, 10)) $digits[] = $v % 10;\n    $digits = array_reverse($digits);\n    $L = count($digits);\n    $answer = 0;\n    for ($len = 1; $len < $L; $len++) {\n        $cnt = 9;\n        for ($i = 0; $i < $len - 1; $i++) $cnt *= 9 - $i;\n        $answer += $cnt;\n    }\n    $used = array_fill(0, 10, false);\n    for ($pos = 0; $pos < $L; $pos++) {\n        $start = $pos === 0 ? 1 : 0;\n        for ($d = $start; $d < $digits[$pos]; $d++) {\n            if ($used[$d]) continue;\n            $ways = 1;\n            $avail = 10 - ($pos + 1);\n            for ($i = 0; $i < $L - $pos - 1; $i++) {\n                $ways *= $avail;\n                $avail--;\n            }\n            $answer += $ways;\n        }\n        if ($used[$digits[$pos]]) return $answer;\n        $used[$digits[$pos]] = true;\n        if ($pos === $L - 1) $answer++;\n    }\n    return $answer;\n}`,
        ruby: `def countSpecialNumbers(n)\n  digits = n.to_s.chars.map(&:to_i)\n  l = digits.length\n  answer = 0\n  (1...l).each do |len|\n    cnt = 9\n    (0...(len - 1)).each { |i| cnt *= 9 - i }\n    answer += cnt\n  end\n  used = Array.new(10, false)\n  (0...l).each do |pos|\n    start = pos == 0 ? 1 : 0\n    (start...digits[pos]).each do |d|\n      next if used[d]\n      ways = 1\n      avail = 10 - (pos + 1)\n      (0...(l - pos - 1)).each do\n        ways *= avail\n        avail -= 1\n      end\n      answer += ways\n    end\n    return answer if used[digits[pos]]\n    used[digits[pos]] = true\n    answer += 1 if pos == l - 1\n  end\n  answer\nend`,
      },
    };
  })(),

  // ── Maximum Value of K Coins From Piles (LC 2218) ───────────────
  (() => {
    const ref = (piles: number[][], k: number) => {
      const n = piles.length;
      const dp: number[] = new Array(k + 1).fill(0);
      for (let p = 0; p < n; p++) {
        const next = dp.slice();
        let running = 0;
        for (let take = 1; take <= piles[p].length && take <= k; take++) {
          running += piles[p][take - 1];
          for (let j = take; j <= k; j++) {
            const cand = dp[j - take] + running;
            if (cand > next[j]) next[j] = cand;
          }
        }
        for (let j = 0; j <= k; j++) dp[j] = next[j];
      }
      return dp[k];
    };
    return {
      slug: "maximum-value-of-k-coins-from-piles",
      title: "Maximum Value of K Coins From Piles",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Prefix Sum", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "maxValueOfCoins", params: [{ name: "piles", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "There are `n` piles of coins on a table. `piles[i]` lists the coins in the `i`-th pile **from top to bottom**. In one move you take the coin currently on **top** of any pile.\n\nMake exactly `k` moves and return the maximum total value you can collect.",
        [
          { in: "piles = [[1,100,3],[7,8,9]], k = 2", out: "101", note: "Take the top two coins of pile 0: 1 + 100." },
          { in: "piles = [[100],[100],[100],[100],[100],[100],[1,1,1,1,1,1,700]], k = 7", out: "706", note: "Six 100s plus one 1 — digging down to the 700 would cost six cheap coins." },
          { in: "piles = [[1,2,3]], k = 2", out: "3" },
        ],
        ["n == piles.length", "1 <= n <= 1000", "1 <= piles[i][j] <= 10^5", "1 <= k <= sum(piles[i].length) <= 2000"]),
      hints: [
        "Because you can only take from the top, taking `t` coins from a pile means taking its **first `t`** — so each pile offers one choice: how many.",
        "That is a **group knapsack**: `k` is the capacity, each pile is a group, and its options are its prefixes.",
        "Prefix sums make each option's value O(1).",
      ],
      editorial: explain({
        idea: "Group knapsack over the piles. `dp[j]` is the best value using exactly `j` moves among the piles processed so far. Each pile contributes at most one option — take its first `t` coins for some `t` — so the transition tries every `t` against every remaining budget.",
        steps: [
          "Start with `dp[j] = 0` for all `j`.",
          "For each pile, copy `dp` into `next` (the option of taking nothing).",
          "Walk `take` from 1 to the pile's size, accumulating the prefix sum `running`.",
          "For each budget `j >= take`, consider `dp[j - take] + running`.",
          "Replace `dp` with `next` and move to the next pile.",
        ],
        why: "The top-only rule is what collapses the choice space: any set of coins taken from one pile must be a prefix of it, so a pile has `len + 1` options rather than `2^len` subsets. Copying into `next` before the inner loops is what keeps the groups exclusive — updating `dp` in place would let a single pile be used twice within one round.",
        time: "O(k · Σ|pile|)",
        space: "O(k)",
        pitfalls: [
          "Updating `dp` in place lets one pile contribute two prefixes.",
          "Exactly `k` coins must be taken, and the constraints guarantee enough exist.",
          "Coins come off the top, so an expensive coin deep in a pile drags every coin above it along.",
        ],
      }),
      examples: [
        { input: "[[1,100,3],[7,8,9]]\n2", expectedOutput: "101" },
        { input: "[[100],[100],[100],[100],[100],[100],[1,1,1,1,1,1,700]]\n7", expectedOutput: "706" },
        { input: "[[1,2,3]]\n2", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 5);
        const piles = Array.from({ length: n }, () =>
          Array.from({ length: ri(rng, 1, 5) }, () => ri(rng, 1, 100)));
        let total = 0;
        for (let i = 0; i < n; i++) total += piles[i].length;
        const k = ri(rng, 1, total);
        return { input: `${fmtIntMat(piles)}\n${k}`, expectedOutput: String(ref(piles, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxValueOfCoins(piles: List[List[int]], k: int) -> int:\n    dp = [0] * (k + 1)\n    for pile in piles:\n        nxt = dp[:]\n        running = 0\n        for take in range(1, min(len(pile), k) + 1):\n            running += pile[take - 1]\n            for j in range(take, k + 1):\n                nxt[j] = max(nxt[j], dp[j - take] + running)\n        dp = nxt\n    return dp[k]`,
        javascript: `var maxValueOfCoins = function(piles, k) {\n    var n = piles.length, j;\n    var dp = [];\n    for (j = 0; j <= k; j++) dp.push(0);\n    for (var p = 0; p < n; p++) {\n        var next = dp.slice();\n        var running = 0;\n        for (var take = 1; take <= piles[p].length && take <= k; take++) {\n            running += piles[p][take - 1];\n            for (j = take; j <= k; j++) {\n                var cand = dp[j - take] + running;\n                if (cand > next[j]) next[j] = cand;\n            }\n        }\n        dp = next;\n    }\n    return dp[k];\n};`,
        typescript: `function maxValueOfCoins(piles: number[][], k: number): number {\n    var n = piles.length, j: number;\n    var dp: number[] = [];\n    for (j = 0; j <= k; j++) dp.push(0);\n    for (var p = 0; p < n; p++) {\n        var next = dp.slice();\n        var running = 0;\n        for (var take = 1; take <= piles[p].length && take <= k; take++) {\n            running += piles[p][take - 1];\n            for (j = take; j <= k; j++) {\n                var cand = dp[j - take] + running;\n                if (cand > next[j]) next[j] = cand;\n            }\n        }\n        dp = next;\n    }\n    return dp[k];\n}`,
        java: `public static int maxValueOfCoins(int[][] piles, int k) {\n    int[] dp = new int[k + 1];\n    for (int[] pile : piles) {\n        int[] next = dp.clone();\n        int running = 0;\n        for (int take = 1; take <= pile.length && take <= k; take++) {\n            running += pile[take - 1];\n            for (int j = take; j <= k; j++) {\n                next[j] = Math.max(next[j], dp[j - take] + running);\n            }\n        }\n        dp = next;\n    }\n    return dp[k];\n}`,
        cpp: `int maxValueOfCoins(vector<vector<int>>& piles, int k) {\n    vector<int> dp(k + 1, 0);\n    for (auto& pile : piles) {\n        vector<int> next = dp;\n        int running = 0;\n        for (int take = 1; take <= (int) pile.size() && take <= k; take++) {\n            running += pile[take - 1];\n            for (int j = take; j <= k; j++) {\n                next[j] = max(next[j], dp[j - take] + running);\n            }\n        }\n        dp = next;\n    }\n    return dp[k];\n}`,
        c: `int maxValueOfCoins(int** piles, int pilesSize, int* pilesColSize, int k) {\n    int* dp = (int*) calloc((size_t) (k + 1), sizeof(int));\n    int* next = (int*) malloc((size_t) (k + 1) * sizeof(int));\n    for (int p = 0; p < pilesSize; p++) {\n        for (int j = 0; j <= k; j++) next[j] = dp[j];\n        int running = 0;\n        for (int take = 1; take <= pilesColSize[p] && take <= k; take++) {\n            running += piles[p][take - 1];\n            for (int j = take; j <= k; j++) {\n                int cand = dp[j - take] + running;\n                if (cand > next[j]) next[j] = cand;\n            }\n        }\n        for (int j = 0; j <= k; j++) dp[j] = next[j];\n    }\n    int answer = dp[k];\n    free(dp);\n    free(next);\n    return answer;\n}`,
        csharp: `public static int MaxValueOfCoins(int[][] piles, int k)\n{\n    var dp = new int[k + 1];\n    foreach (var pile in piles)\n    {\n        var next = (int[]) dp.Clone();\n        int running = 0;\n        for (int take = 1; take <= pile.Length && take <= k; take++)\n        {\n            running += pile[take - 1];\n            for (int j = take; j <= k; j++)\n            {\n                next[j] = Math.Max(next[j], dp[j - take] + running);\n            }\n        }\n        dp = next;\n    }\n    return dp[k];\n}`,
        go: `func maxValueOfCoins(piles [][]int, k int) int {\n\tdp := make([]int, k+1)\n\tfor _, pile := range piles {\n\t\tnext := make([]int, k+1)\n\t\tcopy(next, dp)\n\t\trunning := 0\n\t\tfor take := 1; take <= len(pile) && take <= k; take++ {\n\t\t\trunning += pile[take-1]\n\t\t\tfor j := take; j <= k; j++ {\n\t\t\t\tif cand := dp[j-take] + running; cand > next[j] {\n\t\t\t\t\tnext[j] = cand\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tdp = next\n\t}\n\treturn dp[k]\n}`,
        kotlin: `fun maxValueOfCoins(piles: Array<IntArray>, k: Int): Int {\n    var dp = IntArray(k + 1)\n    for (pile in piles) {\n        val next = dp.copyOf()\n        var running = 0\n        var take = 1\n        while (take <= pile.size && take <= k) {\n            running += pile[take - 1]\n            for (j in take..k) {\n                next[j] = maxOf(next[j], dp[j - take] + running)\n            }\n            take++\n        }\n        dp = next\n    }\n    return dp[k]\n}`,
        swift: `func maxValueOfCoins(_ piles: [[Int]], _ k: Int) -> Int {\n    var dp = [Int](repeating: 0, count: k + 1)\n    for pile in piles {\n        var next = dp\n        var running = 0\n        var take = 1\n        while take <= pile.count && take <= k {\n            running += pile[take - 1]\n            for j in take...k {\n                next[j] = max(next[j], dp[j - take] + running)\n            }\n            take += 1\n        }\n        dp = next\n    }\n    return dp[k]\n}`,
        rust: `fn maxValueOfCoins(piles: Vec<Vec<i32>>, k: i32) -> i32 {\n    let k = k as usize;\n    let mut dp = vec![0i32; k + 1];\n    for pile in piles.iter() {\n        let mut next = dp.clone();\n        let mut running = 0i32;\n        let mut take = 1usize;\n        while take <= pile.len() && take <= k {\n            running += pile[take - 1];\n            for j in take..=k {\n                let cand = dp[j - take] + running;\n                if cand > next[j] {\n                    next[j] = cand;\n                }\n            }\n            take += 1;\n        }\n        dp = next;\n    }\n    dp[k]\n}`,
        php: `function maxValueOfCoins($piles, $k) {\n    $dp = array_fill(0, $k + 1, 0);\n    foreach ($piles as $pile) {\n        $next = $dp;\n        $running = 0;\n        $size = count($pile);\n        for ($take = 1; $take <= $size && $take <= $k; $take++) {\n            $running += $pile[$take - 1];\n            for ($j = $take; $j <= $k; $j++) {\n                $cand = $dp[$j - $take] + $running;\n                if ($cand > $next[$j]) $next[$j] = $cand;\n            }\n        }\n        $dp = $next;\n    }\n    return $dp[$k];\n}`,
        ruby: `def maxValueOfCoins(piles, k)\n  dp = Array.new(k + 1, 0)\n  piles.each do |pile|\n    nxt = dp.dup\n    running = 0\n    take = 1\n    while take <= pile.length && take <= k\n      running += pile[take - 1]\n      (take..k).each do |j|\n        cand = dp[j - take] + running\n        nxt[j] = cand if cand > nxt[j]\n      end\n      take += 1\n    end\n    dp = nxt\n  end\n  dp[k]\nend`,
      },
    };
  })(),

  // ── Ways to Stay in the Same Place After Some Steps (LC 1269) ───
  (() => {
    const ref = (steps: number, arrLen: number) => {
      const width = Math.min(arrLen, steps + 1);
      let dp = new Array(width).fill(0);
      dp[0] = 1;
      for (let s = 0; s < steps; s++) {
        const next = new Array(width).fill(0);
        for (let p = 0; p < width; p++) {
          if (dp[p] === 0) continue;
          next[p] = (next[p] + dp[p]) % MOD5;
          if (p > 0) next[p - 1] = (next[p - 1] + dp[p]) % MOD5;
          if (p + 1 < width) next[p + 1] = (next[p + 1] + dp[p]) % MOD5;
        }
        dp = next;
      }
      return dp[0];
    };
    return {
      slug: "number-of-ways-to-stay-in-the-same-place-after-some-steps",
      title: "Number of Ways to Stay in the Same Place After Some Steps",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "numWays", params: [{ name: "steps", type: "int" as const }, { name: "arrLen", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A pointer sits at index 0 of an array of length `arrLen`. In one step it may move **one left**, **one right**, or **stay**, never leaving the array.\n\nReturn the number of step sequences of length exactly `steps` that leave the pointer back at index 0, **modulo 10⁹ + 7**.",
        [
          { in: "steps = 3, arrLen = 2", out: "4", note: "`stay,stay,stay`; `stay,right,left`; `right,left,stay`; `right,stay,left`." },
          { in: "steps = 2, arrLen = 4", out: "2", note: "`stay,stay` and `right,left`." },
          { in: "steps = 4, arrLen = 2", out: "8" },
        ],
        ["1 <= steps <= 500", "1 <= arrLen <= 10^6"]),
      hints: [
        "`arrLen` can be a million, but in `steps` moves the pointer can never get past index `steps`.",
        "So cap the usable width at `min(arrLen, steps + 1)`.",
        "`dp[p]` = the number of ways to be at index `p` after the steps taken so far.",
      ],
      editorial: explain({
        idea: "Layered DP over the step count. `dp[p]` counts the sequences that leave the pointer at index `p`. Each step spreads every position's count to itself and to its two neighbours, staying inside the array.",
        steps: [
          "Set the usable width to `min(arrLen, steps + 1)` — anything beyond is unreachable.",
          "Start with `dp[0] = 1`.",
          "Repeat `steps` times: build `next` by adding `dp[p]` into `next[p]`, `next[p-1]` and `next[p+1]` where those exist, modulo 10⁹ + 7.",
          "Return `dp[0]`.",
        ],
        why: "Capping the width is what makes the problem tractable at `arrLen = 10⁶`: to return to index 0 in `steps` moves the pointer can never have gone further than `steps / 2`, and even the generous bound `steps + 1` keeps the table at 501 entries. Without the cap the DP would allocate a million-wide row 500 times over for positions that can never be reached, let alone returned from.",
        time: "O(steps · min(arrLen, steps))",
        space: "O(min(arrLen, steps))",
        pitfalls: [
          "Allocating `arrLen` cells is the trap the constraints are built around.",
          "The pointer must not step outside the array, so the edges have fewer options.",
          "Sequences are counted, not final positions — staying put is a distinct move.",
        ],
      }),
      examples: [
        { input: "3\n2", expectedOutput: "4" },
        { input: "2\n4", expectedOutput: "2" },
        { input: "4\n2", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const steps = ri(rng, 1, 40);
        const arrLen = ri(rng, 1, 1000000);
        return { input: `${steps}\n${arrLen}`, expectedOutput: String(ref(steps, arrLen)) };
      },
      solutions: {
        python: `def numWays(steps: int, arrLen: int) -> int:\n    MOD = 10**9 + 7\n    width = min(arrLen, steps + 1)\n    dp = [0] * width\n    dp[0] = 1\n    for _ in range(steps):\n        nxt = [0] * width\n        for p in range(width):\n            if dp[p] == 0:\n                continue\n            nxt[p] = (nxt[p] + dp[p]) % MOD\n            if p > 0:\n                nxt[p - 1] = (nxt[p - 1] + dp[p]) % MOD\n            if p + 1 < width:\n                nxt[p + 1] = (nxt[p + 1] + dp[p]) % MOD\n        dp = nxt\n    return dp[0]`,
        javascript: `var numWays = function(steps, arrLen) {\n    var MOD = 1000000007;\n    var width = Math.min(arrLen, steps + 1), p;\n    var dp = [];\n    for (p = 0; p < width; p++) dp.push(0);\n    dp[0] = 1;\n    for (var s = 0; s < steps; s++) {\n        var next = [];\n        for (p = 0; p < width; p++) next.push(0);\n        for (p = 0; p < width; p++) {\n            if (dp[p] === 0) continue;\n            next[p] = (next[p] + dp[p]) % MOD;\n            if (p > 0) next[p - 1] = (next[p - 1] + dp[p]) % MOD;\n            if (p + 1 < width) next[p + 1] = (next[p + 1] + dp[p]) % MOD;\n        }\n        dp = next;\n    }\n    return dp[0];\n};`,
        typescript: `function numWays(steps: number, arrLen: number): number {\n    var MOD = 1000000007;\n    var width = Math.min(arrLen, steps + 1), p: number;\n    var dp: number[] = [];\n    for (p = 0; p < width; p++) dp.push(0);\n    dp[0] = 1;\n    for (var s = 0; s < steps; s++) {\n        var next: number[] = [];\n        for (p = 0; p < width; p++) next.push(0);\n        for (p = 0; p < width; p++) {\n            if (dp[p] === 0) continue;\n            next[p] = (next[p] + dp[p]) % MOD;\n            if (p > 0) next[p - 1] = (next[p - 1] + dp[p]) % MOD;\n            if (p + 1 < width) next[p + 1] = (next[p + 1] + dp[p]) % MOD;\n        }\n        dp = next;\n    }\n    return dp[0];\n}`,
        java: `public static int numWays(int steps, int arrLen) {\n    final int MOD = 1000000007;\n    int width = Math.min(arrLen, steps + 1);\n    int[] dp = new int[width];\n    dp[0] = 1;\n    for (int s = 0; s < steps; s++) {\n        int[] next = new int[width];\n        for (int p = 0; p < width; p++) {\n            if (dp[p] == 0) continue;\n            next[p] = (next[p] + dp[p]) % MOD;\n            if (p > 0) next[p - 1] = (next[p - 1] + dp[p]) % MOD;\n            if (p + 1 < width) next[p + 1] = (next[p + 1] + dp[p]) % MOD;\n        }\n        dp = next;\n    }\n    return dp[0];\n}`,
        cpp: `int numWays(int steps, int arrLen) {\n    const int MOD = 1000000007;\n    int width = min(arrLen, steps + 1);\n    vector<int> dp(width, 0);\n    dp[0] = 1;\n    for (int s = 0; s < steps; s++) {\n        vector<int> next(width, 0);\n        for (int p = 0; p < width; p++) {\n            if (dp[p] == 0) continue;\n            next[p] = (next[p] + dp[p]) % MOD;\n            if (p > 0) next[p - 1] = (next[p - 1] + dp[p]) % MOD;\n            if (p + 1 < width) next[p + 1] = (next[p + 1] + dp[p]) % MOD;\n        }\n        dp = next;\n    }\n    return dp[0];\n}`,
        c: `int numWays(int steps, int arrLen) {\n    const int MOD = 1000000007;\n    int width = arrLen < steps + 1 ? arrLen : steps + 1;\n    int* dp = (int*) calloc((size_t) width, sizeof(int));\n    int* next = (int*) calloc((size_t) width, sizeof(int));\n    dp[0] = 1;\n    for (int s = 0; s < steps; s++) {\n        for (int p = 0; p < width; p++) next[p] = 0;\n        for (int p = 0; p < width; p++) {\n            if (dp[p] == 0) continue;\n            next[p] = (next[p] + dp[p]) % MOD;\n            if (p > 0) next[p - 1] = (next[p - 1] + dp[p]) % MOD;\n            if (p + 1 < width) next[p + 1] = (next[p + 1] + dp[p]) % MOD;\n        }\n        for (int p = 0; p < width; p++) dp[p] = next[p];\n    }\n    int answer = dp[0];\n    free(dp);\n    free(next);\n    return answer;\n}`,
        csharp: `public static int NumWays(int steps, int arrLen)\n{\n    const int MOD = 1000000007;\n    int width = Math.Min(arrLen, steps + 1);\n    var dp = new int[width];\n    dp[0] = 1;\n    for (int s = 0; s < steps; s++)\n    {\n        var next = new int[width];\n        for (int p = 0; p < width; p++)\n        {\n            if (dp[p] == 0) continue;\n            next[p] = (next[p] + dp[p]) % MOD;\n            if (p > 0) next[p - 1] = (next[p - 1] + dp[p]) % MOD;\n            if (p + 1 < width) next[p + 1] = (next[p + 1] + dp[p]) % MOD;\n        }\n        dp = next;\n    }\n    return dp[0];\n}`,
        go: `func numWays(steps int, arrLen int) int {\n\tconst MOD = 1000000007\n\twidth := arrLen\n\tif steps+1 < width {\n\t\twidth = steps + 1\n\t}\n\tdp := make([]int, width)\n\tdp[0] = 1\n\tfor s := 0; s < steps; s++ {\n\t\tnext := make([]int, width)\n\t\tfor p := 0; p < width; p++ {\n\t\t\tif dp[p] == 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tnext[p] = (next[p] + dp[p]) % MOD\n\t\t\tif p > 0 {\n\t\t\t\tnext[p-1] = (next[p-1] + dp[p]) % MOD\n\t\t\t}\n\t\t\tif p+1 < width {\n\t\t\t\tnext[p+1] = (next[p+1] + dp[p]) % MOD\n\t\t\t}\n\t\t}\n\t\tdp = next\n\t}\n\treturn dp[0]\n}`,
        kotlin: `fun numWays(steps: Int, arrLen: Int): Int {\n    val mod = 1000000007\n    val width = minOf(arrLen, steps + 1)\n    var dp = IntArray(width)\n    dp[0] = 1\n    for (s in 0 until steps) {\n        val next = IntArray(width)\n        for (p in 0 until width) {\n            if (dp[p] == 0) continue\n            next[p] = (next[p] + dp[p]) % mod\n            if (p > 0) next[p - 1] = (next[p - 1] + dp[p]) % mod\n            if (p + 1 < width) next[p + 1] = (next[p + 1] + dp[p]) % mod\n        }\n        dp = next\n    }\n    return dp[0]\n}`,
        swift: `func numWays(_ steps: Int, _ arrLen: Int) -> Int {\n    let mod = 1000000007\n    let width = min(arrLen, steps + 1)\n    var dp = [Int](repeating: 0, count: width)\n    dp[0] = 1\n    for _ in 0..<steps {\n        var next = [Int](repeating: 0, count: width)\n        for p in 0..<width {\n            if dp[p] == 0 { continue }\n            next[p] = (next[p] + dp[p]) % mod\n            if p > 0 { next[p - 1] = (next[p - 1] + dp[p]) % mod }\n            if p + 1 < width { next[p + 1] = (next[p + 1] + dp[p]) % mod }\n        }\n        dp = next\n    }\n    return dp[0]\n}`,
        rust: `fn numWays(steps: i32, arrLen: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let width = std::cmp::min(arrLen, steps + 1) as usize;\n    let mut dp = vec![0i64; width];\n    dp[0] = 1;\n    for _ in 0..steps {\n        let mut next = vec![0i64; width];\n        for p in 0..width {\n            if dp[p] == 0 {\n                continue;\n            }\n            next[p] = (next[p] + dp[p]) % MOD;\n            if p > 0 {\n                next[p - 1] = (next[p - 1] + dp[p]) % MOD;\n            }\n            if p + 1 < width {\n                next[p + 1] = (next[p + 1] + dp[p]) % MOD;\n            }\n        }\n        dp = next;\n    }\n    dp[0] as i32\n}`,
        php: `function numWays($steps, $arrLen) {\n    $MOD = 1000000007;\n    $width = min($arrLen, $steps + 1);\n    $dp = array_fill(0, $width, 0);\n    $dp[0] = 1;\n    for ($s = 0; $s < $steps; $s++) {\n        $next = array_fill(0, $width, 0);\n        for ($p = 0; $p < $width; $p++) {\n            if ($dp[$p] === 0) continue;\n            $next[$p] = ($next[$p] + $dp[$p]) % $MOD;\n            if ($p > 0) $next[$p - 1] = ($next[$p - 1] + $dp[$p]) % $MOD;\n            if ($p + 1 < $width) $next[$p + 1] = ($next[$p + 1] + $dp[$p]) % $MOD;\n        }\n        $dp = $next;\n    }\n    return $dp[0];\n}`,
        ruby: `def numWays(steps, arrLen)\n  mod = 1000000007\n  width = [arrLen, steps + 1].min\n  dp = Array.new(width, 0)\n  dp[0] = 1\n  steps.times do\n    nxt = Array.new(width, 0)\n    (0...width).each do |p|\n      next if dp[p] == 0\n      nxt[p] = (nxt[p] + dp[p]) % mod\n      nxt[p - 1] = (nxt[p - 1] + dp[p]) % mod if p > 0\n      nxt[p + 1] = (nxt[p + 1] + dp[p]) % mod if p + 1 < width\n    end\n    dp = nxt\n  end\n  dp[0]\nend`,
      },
    };
  })(),

  // ── Strange Printer (LC 664) ────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const n = s.length;
      const dp: number[][] = [];
      for (let i = 0; i < n; i++) dp.push(new Array(n).fill(0));
      for (let i = 0; i < n; i++) dp[i][i] = 1;
      for (let len = 2; len <= n; len++) {
        for (let i = 0; i + len - 1 < n; i++) {
          const j = i + len - 1;
          dp[i][j] = dp[i][j - 1] + 1;
          for (let k = i; k < j; k++) {
            if (s.charAt(k) === s.charAt(j)) {
              const inner = k + 1 <= j - 1 ? dp[k + 1][j - 1] : 0;
              if (dp[i][k] + inner < dp[i][j]) dp[i][j] = dp[i][k] + inner;
            }
          }
        }
      }
      return dp[0][n - 1];
    };
    return {
      slug: "strange-printer",
      title: "Strange Printer",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Google", "Amazon", "Meta"],
      signature: { funcName: "strangePrinter", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A strange printer can only do one thing per turn: print a **sequence of one repeated character**, overwriting whatever was already in the positions it covers.\n\nReturn the minimum number of turns needed to print `s`.",
        [
          { in: 's = "codekairo"', out: "8", note: "The repeated `o` lets one turn cover both ends of the word." },
          { in: 's = "aaabbb"', out: "2", note: "Print `aaa`, then `bbb`." },
          { in: 's = "aba"', out: "2", note: "Print `aaa`, then overwrite the middle with `b`." },
        ],
        ["1 <= s.length <= 100", "s consists of lowercase English letters."]),
      hints: [
        "Think of the last character. Printing it can be merged with an earlier turn that printed the same character.",
        "`dp[i][j]` = the minimum turns for `s[i..j]`.",
        "Start from `dp[i][j-1] + 1`, then try merging with each earlier position `k` where `s[k] == s[j]`.",
      ],
      editorial: explain({
        idea: "Interval DP. `dp[i][j]` is the minimum turns for `s[i..j]`. The baseline is printing `s[j]` in its own turn: `dp[i][j-1] + 1`. But whenever some `k < j` has `s[k] == s[j]`, that earlier turn can be **stretched** to cover position `j` for free, splitting the interval into `s[i..k]` and `s[k+1..j-1]`.",
        steps: [
          "Set `dp[i][i] = 1`.",
          "For increasing lengths, start with `dp[i][j] = dp[i][j-1] + 1`.",
          "For each `k` from `i` to `j-1` with `s[k] == s[j]`, take `dp[i][k] + dp[k+1][j-1]`.",
          "Return `dp[0][n-1]`.",
        ],
        why: "The merge is the whole problem. Overwriting means a single turn's stroke can extend past characters that are printed over later, so two equal characters far apart may cost one turn between them rather than two. Splitting at `k` and *excluding* `j` from the right interval is what encodes \"the stroke that printed `s[k]` also printed `s[j]`\" — an off-by-one there quietly double-counts the merged turn.",
        time: "O(n³)",
        space: "O(n²)",
        pitfalls: [
          "The right sub-interval is `s[k+1..j-1]`, not `s[k+1..j]`.",
          "That sub-interval can be empty when `k = j-1`; treat it as 0 turns.",
          "Collapsing runs of equal characters first is a valid and useful preprocessing step, but the DP must still handle them.",
        ],
      }),
      examples: [
        { input: '"codekairo"', expectedOutput: "8" },
        { input: '"aaabbb"', expectedOutput: "2" },
        { input: '"aba"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abc";
        const n = ri(rng, 1, 14);
        let s = "";
        for (let i = 0; i < n; i++) s += alphabet.charAt(ri(rng, 0, 2));
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def strangePrinter(s: str) -> int:\n    n = len(s)\n    dp = [[0] * n for _ in range(n)]\n    for i in range(n):\n        dp[i][i] = 1\n    for length in range(2, n + 1):\n        for i in range(n - length + 1):\n            j = i + length - 1\n            dp[i][j] = dp[i][j - 1] + 1\n            for k in range(i, j):\n                if s[k] == s[j]:\n                    inner = dp[k + 1][j - 1] if k + 1 <= j - 1 else 0\n                    dp[i][j] = min(dp[i][j], dp[i][k] + inner)\n    return dp[0][n - 1]`,
        javascript: `var strangePrinter = function(s) {\n    var n = s.length, i, j;\n    var dp = [];\n    for (i = 0; i < n; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(0);\n        dp.push(row);\n    }\n    for (i = 0; i < n; i++) dp[i][i] = 1;\n    for (var len = 2; len <= n; len++) {\n        for (i = 0; i + len - 1 < n; i++) {\n            j = i + len - 1;\n            dp[i][j] = dp[i][j - 1] + 1;\n            for (var k = i; k < j; k++) {\n                if (s.charAt(k) === s.charAt(j)) {\n                    var inner = k + 1 <= j - 1 ? dp[k + 1][j - 1] : 0;\n                    if (dp[i][k] + inner < dp[i][j]) dp[i][j] = dp[i][k] + inner;\n                }\n            }\n        }\n    }\n    return dp[0][n - 1];\n};`,
        typescript: `function strangePrinter(s: string): number {\n    var n = s.length, i: number, j: number;\n    var dp: number[][] = [];\n    for (i = 0; i < n; i++) {\n        var row: number[] = [];\n        for (j = 0; j < n; j++) row.push(0);\n        dp.push(row);\n    }\n    for (i = 0; i < n; i++) dp[i][i] = 1;\n    for (var len = 2; len <= n; len++) {\n        for (i = 0; i + len - 1 < n; i++) {\n            j = i + len - 1;\n            dp[i][j] = dp[i][j - 1] + 1;\n            for (var k = i; k < j; k++) {\n                if (s.charAt(k) === s.charAt(j)) {\n                    var inner = k + 1 <= j - 1 ? dp[k + 1][j - 1] : 0;\n                    if (dp[i][k] + inner < dp[i][j]) dp[i][j] = dp[i][k] + inner;\n                }\n            }\n        }\n    }\n    return dp[0][n - 1];\n}`,
        java: `public static int strangePrinter(String s) {\n    int n = s.length();\n    int[][] dp = new int[n][n];\n    for (int i = 0; i < n; i++) dp[i][i] = 1;\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            dp[i][j] = dp[i][j - 1] + 1;\n            for (int k = i; k < j; k++) {\n                if (s.charAt(k) == s.charAt(j)) {\n                    int inner = k + 1 <= j - 1 ? dp[k + 1][j - 1] : 0;\n                    dp[i][j] = Math.min(dp[i][j], dp[i][k] + inner);\n                }\n            }\n        }\n    }\n    return dp[0][n - 1];\n}`,
        cpp: `int strangePrinter(string s) {\n    int n = (int) s.size();\n    vector<vector<int>> dp(n, vector<int>(n, 0));\n    for (int i = 0; i < n; i++) dp[i][i] = 1;\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            dp[i][j] = dp[i][j - 1] + 1;\n            for (int k = i; k < j; k++) {\n                if (s[k] == s[j]) {\n                    int inner = k + 1 <= j - 1 ? dp[k + 1][j - 1] : 0;\n                    dp[i][j] = min(dp[i][j], dp[i][k] + inner);\n                }\n            }\n        }\n    }\n    return dp[0][n - 1];\n}`,
        c: `int strangePrinter(char* s) {\n    int n = (int) strlen(s);\n    int* dp = (int*) calloc((size_t) n * (size_t) n, sizeof(int));\n    for (int i = 0; i < n; i++) dp[i * n + i] = 1;\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            dp[i * n + j] = dp[i * n + (j - 1)] + 1;\n            for (int k = i; k < j; k++) {\n                if (s[k] == s[j]) {\n                    int inner = k + 1 <= j - 1 ? dp[(k + 1) * n + (j - 1)] : 0;\n                    if (dp[i * n + k] + inner < dp[i * n + j]) dp[i * n + j] = dp[i * n + k] + inner;\n                }\n            }\n        }\n    }\n    int answer = dp[0 * n + (n - 1)];\n    free(dp);\n    return answer;\n}`,
        csharp: `public static int StrangePrinter(string s)\n{\n    int n = s.Length;\n    var dp = new int[n, n];\n    for (int i = 0; i < n; i++) dp[i, i] = 1;\n    for (int len = 2; len <= n; len++)\n    {\n        for (int i = 0; i + len - 1 < n; i++)\n        {\n            int j = i + len - 1;\n            dp[i, j] = dp[i, j - 1] + 1;\n            for (int k = i; k < j; k++)\n            {\n                if (s[k] == s[j])\n                {\n                    int inner = k + 1 <= j - 1 ? dp[k + 1, j - 1] : 0;\n                    dp[i, j] = Math.Min(dp[i, j], dp[i, k] + inner);\n                }\n            }\n        }\n    }\n    return dp[0, n - 1];\n}`,
        go: `func strangePrinter(s string) int {\n\tn := len(s)\n\tdp := make([][]int, n)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, n)\n\t\tdp[i][i] = 1\n\t}\n\tfor length := 2; length <= n; length++ {\n\t\tfor i := 0; i+length-1 < n; i++ {\n\t\t\tj := i + length - 1\n\t\t\tdp[i][j] = dp[i][j-1] + 1\n\t\t\tfor k := i; k < j; k++ {\n\t\t\t\tif s[k] == s[j] {\n\t\t\t\t\tinner := 0\n\t\t\t\t\tif k+1 <= j-1 {\n\t\t\t\t\t\tinner = dp[k+1][j-1]\n\t\t\t\t\t}\n\t\t\t\t\tif dp[i][k]+inner < dp[i][j] {\n\t\t\t\t\t\tdp[i][j] = dp[i][k] + inner\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[0][n-1]\n}`,
        kotlin: `fun strangePrinter(s: String): Int {\n    val n = s.length\n    val dp = Array(n) { IntArray(n) }\n    for (i in 0 until n) dp[i][i] = 1\n    for (len in 2..n) {\n        for (i in 0..n - len) {\n            val j = i + len - 1\n            dp[i][j] = dp[i][j - 1] + 1\n            for (k in i until j) {\n                if (s[k] == s[j]) {\n                    val inner = if (k + 1 <= j - 1) dp[k + 1][j - 1] else 0\n                    dp[i][j] = minOf(dp[i][j], dp[i][k] + inner)\n                }\n            }\n        }\n    }\n    return dp[0][n - 1]\n}`,
        swift: `func strangePrinter(_ s: String) -> Int {\n    let chars = Array(s)\n    let n = chars.count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n    for i in 0..<n { dp[i][i] = 1 }\n    if n >= 2 {\n        for len in 2...n {\n            for i in 0...(n - len) {\n                let j = i + len - 1\n                dp[i][j] = dp[i][j - 1] + 1\n                for k in i..<j where chars[k] == chars[j] {\n                    let inner = k + 1 <= j - 1 ? dp[k + 1][j - 1] : 0\n                    dp[i][j] = min(dp[i][j], dp[i][k] + inner)\n                }\n            }\n        }\n    }\n    return dp[0][n - 1]\n}`,
        rust: `fn strangePrinter(s: String) -> i32 {\n    let chars: Vec<char> = s.chars().collect();\n    let n = chars.len();\n    let mut dp = vec![vec![0i32; n]; n];\n    for i in 0..n {\n        dp[i][i] = 1;\n    }\n    for len in 2..=n {\n        for i in 0..=(n - len) {\n            let j = i + len - 1;\n            dp[i][j] = dp[i][j - 1] + 1;\n            for k in i..j {\n                if chars[k] == chars[j] {\n                    let inner = if k + 1 <= j - 1 { dp[k + 1][j - 1] } else { 0 };\n                    if dp[i][k] + inner < dp[i][j] {\n                        dp[i][j] = dp[i][k] + inner;\n                    }\n                }\n            }\n        }\n    }\n    dp[0][n - 1]\n}`,
        php: `function strangePrinter($s) {\n    $n = strlen($s);\n    $dp = [];\n    for ($i = 0; $i < $n; $i++) $dp[$i] = array_fill(0, $n, 0);\n    for ($i = 0; $i < $n; $i++) $dp[$i][$i] = 1;\n    for ($len = 2; $len <= $n; $len++) {\n        for ($i = 0; $i + $len - 1 < $n; $i++) {\n            $j = $i + $len - 1;\n            $dp[$i][$j] = $dp[$i][$j - 1] + 1;\n            for ($k = $i; $k < $j; $k++) {\n                if ($s[$k] === $s[$j]) {\n                    $inner = $k + 1 <= $j - 1 ? $dp[$k + 1][$j - 1] : 0;\n                    if ($dp[$i][$k] + $inner < $dp[$i][$j]) $dp[$i][$j] = $dp[$i][$k] + $inner;\n                }\n            }\n        }\n    }\n    return $dp[0][$n - 1];\n}`,
        ruby: `def strangePrinter(s)\n  n = s.length\n  dp = Array.new(n) { Array.new(n, 0) }\n  (0...n).each { |i| dp[i][i] = 1 }\n  (2..n).each do |len|\n    (0..(n - len)).each do |i|\n      j = i + len - 1\n      dp[i][j] = dp[i][j - 1] + 1\n      (i...j).each do |k|\n        next unless s[k] == s[j]\n        inner = k + 1 <= j - 1 ? dp[k + 1][j - 1] : 0\n        dp[i][j] = [dp[i][j], dp[i][k] + inner].min\n      end\n    end\n  end\n  dp[0][n - 1]\nend`,
      },
    };
  })(),

  // ── Cherry Pickup II (LC 1463) ──────────────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      const NEG = -1;
      let dp: number[][] = [];
      for (let a = 0; a < n; a++) dp.push(new Array(n).fill(NEG));
      dp[0][n - 1] = n === 1 ? grid[0][0] : grid[0][0] + grid[0][n - 1];
      for (let row = 1; row < m; row++) {
        const next: number[][] = [];
        for (let a = 0; a < n; a++) next.push(new Array(n).fill(NEG));
        for (let c1 = 0; c1 < n; c1++) {
          for (let c2 = 0; c2 < n; c2++) {
            if (dp[c1][c2] === NEG) continue;
            for (let d1 = -1; d1 <= 1; d1++) {
              for (let d2 = -1; d2 <= 1; d2++) {
                const n1 = c1 + d1, n2 = c2 + d2;
                if (n1 < 0 || n1 >= n || n2 < 0 || n2 >= n) continue;
                const gain = n1 === n2 ? grid[row][n1] : grid[row][n1] + grid[row][n2];
                const cand = dp[c1][c2] + gain;
                if (cand > next[n1][n2]) next[n1][n2] = cand;
              }
            }
          }
        }
        dp = next;
      }
      let best = 0;
      for (let c1 = 0; c1 < n; c1++) {
        for (let c2 = 0; c2 < n; c2++) if (dp[c1][c2] > best) best = dp[c1][c2];
      }
      return best;
    };
    return {
      slug: "cherry-pickup-ii",
      title: "Cherry Pickup II",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "cherryPickup", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Two robots collect cherries from a grid. Robot 1 starts at `(0, 0)` and robot 2 at `(0, n-1)`. From a cell `(i, j)` a robot moves to `(i+1, j-1)`, `(i+1, j)` or `(i+1, j+1)`, and both move **one row per turn** until they reach the bottom row.\n\nA robot collects the cherries in every cell it visits, and a cell is emptied once visited. If **both** robots land on the same cell, the cherries there are collected only once.\n\nReturn the maximum total cherries.",
        [
          { in: "grid = [[3,1,1],[2,5,1],[1,5,5],[2,1,1]]", out: "24", note: "Robot 1 takes the left path and robot 2 the right; they never share a cell." },
          { in: "grid = [[1,0,0,0,0,0,1],[2,0,0,0,0,3,0],[2,0,9,0,0,0,0],[0,3,0,5,4,0,0],[1,0,2,3,0,0,6]]", out: "28" },
          { in: "grid = [[1,1],[1,1]]", out: "4" },
        ],
        ["rows == grid.length", "cols == grid[i].length", "2 <= rows, cols <= 70", "0 <= grid[i][j] <= 100"]),
      hints: [
        "Both robots move one row per turn, so they are always on the **same row** — the row is a shared clock.",
        "That makes the state `(row, column of robot 1, column of robot 2)`.",
        "Nine column transitions per step: three choices each.",
      ],
      editorial: explain({
        idea: "Because the robots descend in lockstep, the row is common to both and the state is just the pair of columns. `dp[c1][c2]` is the best total with the robots at those columns on the current row; each step tries all nine column moves.",
        steps: [
          "Initialise `dp[0][n-1]` with the first row's two starting cells (once if `n == 1`).",
          "For each subsequent row, build `next` by trying `d1, d2` each in `{-1, 0, 1}`.",
          "The gain is `grid[row][n1] + grid[row][n2]`, or just one of them when `n1 == n2`.",
          "After the last row, return the best value in the table.",
        ],
        why: "Moving both robots simultaneously is what keeps the state to two columns instead of two independent positions in time — the original Cherry Pickup needs a clever reparametrisation to achieve the same thing, but here the problem hands it to you. The `n1 == n2` case is the only place the \"emptied cell\" rule bites, and double-counting there is the classic wrong answer.",
        time: "O(rows · cols² · 9)",
        space: "O(cols²)",
        pitfalls: [
          "A shared cell contributes once, not twice.",
          "Unreachable column pairs must stay excluded, or they seed impossible paths with 0.",
          "The robots may cross over each other; nothing forbids it.",
        ],
      }),
      examples: [
        { input: "[[3,1,1],[2,5,1],[1,5,5],[2,1,1]]", expectedOutput: "24" },
        { input: "[[1,0,0,0,0,0,1],[2,0,0,0,0,3,0],[2,0,9,0,0,0,0],[0,3,0,5,4,0,0],[1,0,2,3,0,0,6]]", expectedOutput: "28" },
        { input: "[[1,1],[1,1]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 2, 6), n = ri(rng, 2, 6);
        const grid = Array.from({ length: m }, () =>
          Array.from({ length: n }, () => ri(rng, 0, 20)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef cherryPickup(grid: List[List[int]]) -> int:\n    m, n = len(grid), len(grid[0])\n    NEG = -1\n    dp = [[NEG] * n for _ in range(n)]\n    dp[0][n - 1] = grid[0][0] if n == 1 else grid[0][0] + grid[0][n - 1]\n    for row in range(1, m):\n        nxt = [[NEG] * n for _ in range(n)]\n        for c1 in range(n):\n            for c2 in range(n):\n                if dp[c1][c2] == NEG:\n                    continue\n                for d1 in (-1, 0, 1):\n                    for d2 in (-1, 0, 1):\n                        n1, n2 = c1 + d1, c2 + d2\n                        if not (0 <= n1 < n and 0 <= n2 < n):\n                            continue\n                        gain = grid[row][n1] if n1 == n2 else grid[row][n1] + grid[row][n2]\n                        nxt[n1][n2] = max(nxt[n1][n2], dp[c1][c2] + gain)\n        dp = nxt\n    return max(0, max(max(r) for r in dp))`,
        javascript: `var cherryPickup = function(grid) {\n    var m = grid.length, n = grid[0].length, NEG = -1, a, c1, c2;\n    var dp = [];\n    for (a = 0; a < n; a++) {\n        var row0 = [];\n        for (c2 = 0; c2 < n; c2++) row0.push(NEG);\n        dp.push(row0);\n    }\n    dp[0][n - 1] = n === 1 ? grid[0][0] : grid[0][0] + grid[0][n - 1];\n    for (var row = 1; row < m; row++) {\n        var next = [];\n        for (a = 0; a < n; a++) {\n            var r2 = [];\n            for (c2 = 0; c2 < n; c2++) r2.push(NEG);\n            next.push(r2);\n        }\n        for (c1 = 0; c1 < n; c1++) {\n            for (c2 = 0; c2 < n; c2++) {\n                if (dp[c1][c2] === NEG) continue;\n                for (var d1 = -1; d1 <= 1; d1++) {\n                    for (var d2 = -1; d2 <= 1; d2++) {\n                        var n1 = c1 + d1, n2 = c2 + d2;\n                        if (n1 < 0 || n1 >= n || n2 < 0 || n2 >= n) continue;\n                        var gain = n1 === n2 ? grid[row][n1] : grid[row][n1] + grid[row][n2];\n                        var cand = dp[c1][c2] + gain;\n                        if (cand > next[n1][n2]) next[n1][n2] = cand;\n                    }\n                }\n            }\n        }\n        dp = next;\n    }\n    var best = 0;\n    for (c1 = 0; c1 < n; c1++) {\n        for (c2 = 0; c2 < n; c2++) if (dp[c1][c2] > best) best = dp[c1][c2];\n    }\n    return best;\n};`,
        typescript: `function cherryPickup(grid: number[][]): number {\n    var m = grid.length, n = grid[0].length, NEG = -1, a: number, c1: number, c2: number;\n    var dp: number[][] = [];\n    for (a = 0; a < n; a++) {\n        var row0: number[] = [];\n        for (c2 = 0; c2 < n; c2++) row0.push(NEG);\n        dp.push(row0);\n    }\n    dp[0][n - 1] = n === 1 ? grid[0][0] : grid[0][0] + grid[0][n - 1];\n    for (var row = 1; row < m; row++) {\n        var next: number[][] = [];\n        for (a = 0; a < n; a++) {\n            var r2: number[] = [];\n            for (c2 = 0; c2 < n; c2++) r2.push(NEG);\n            next.push(r2);\n        }\n        for (c1 = 0; c1 < n; c1++) {\n            for (c2 = 0; c2 < n; c2++) {\n                if (dp[c1][c2] === NEG) continue;\n                for (var d1 = -1; d1 <= 1; d1++) {\n                    for (var d2 = -1; d2 <= 1; d2++) {\n                        var n1 = c1 + d1, n2 = c2 + d2;\n                        if (n1 < 0 || n1 >= n || n2 < 0 || n2 >= n) continue;\n                        var gain = n1 === n2 ? grid[row][n1] : grid[row][n1] + grid[row][n2];\n                        var cand = dp[c1][c2] + gain;\n                        if (cand > next[n1][n2]) next[n1][n2] = cand;\n                    }\n                }\n            }\n        }\n        dp = next;\n    }\n    var best = 0;\n    for (c1 = 0; c1 < n; c1++) {\n        for (c2 = 0; c2 < n; c2++) if (dp[c1][c2] > best) best = dp[c1][c2];\n    }\n    return best;\n}`,
        java: `public static int cherryPickup(int[][] grid) {\n    int m = grid.length, n = grid[0].length;\n    final int NEG = -1;\n    int[][] dp = new int[n][n];\n    for (int[] row : dp) Arrays.fill(row, NEG);\n    dp[0][n - 1] = n == 1 ? grid[0][0] : grid[0][0] + grid[0][n - 1];\n    for (int row = 1; row < m; row++) {\n        int[][] next = new int[n][n];\n        for (int[] r : next) Arrays.fill(r, NEG);\n        for (int c1 = 0; c1 < n; c1++) {\n            for (int c2 = 0; c2 < n; c2++) {\n                if (dp[c1][c2] == NEG) continue;\n                for (int d1 = -1; d1 <= 1; d1++) {\n                    for (int d2 = -1; d2 <= 1; d2++) {\n                        int n1 = c1 + d1, n2 = c2 + d2;\n                        if (n1 < 0 || n1 >= n || n2 < 0 || n2 >= n) continue;\n                        int gain = n1 == n2 ? grid[row][n1] : grid[row][n1] + grid[row][n2];\n                        next[n1][n2] = Math.max(next[n1][n2], dp[c1][c2] + gain);\n                    }\n                }\n            }\n        }\n        dp = next;\n    }\n    int best = 0;\n    for (int c1 = 0; c1 < n; c1++) {\n        for (int c2 = 0; c2 < n; c2++) best = Math.max(best, dp[c1][c2]);\n    }\n    return best;\n}`,
        cpp: `int cherryPickup(vector<vector<int>>& grid) {\n    int m = (int) grid.size(), n = (int) grid[0].size();\n    const int NEG = -1;\n    vector<vector<int>> dp(n, vector<int>(n, NEG));\n    dp[0][n - 1] = n == 1 ? grid[0][0] : grid[0][0] + grid[0][n - 1];\n    for (int row = 1; row < m; row++) {\n        vector<vector<int>> next(n, vector<int>(n, NEG));\n        for (int c1 = 0; c1 < n; c1++) {\n            for (int c2 = 0; c2 < n; c2++) {\n                if (dp[c1][c2] == NEG) continue;\n                for (int d1 = -1; d1 <= 1; d1++) {\n                    for (int d2 = -1; d2 <= 1; d2++) {\n                        int n1 = c1 + d1, n2 = c2 + d2;\n                        if (n1 < 0 || n1 >= n || n2 < 0 || n2 >= n) continue;\n                        int gain = n1 == n2 ? grid[row][n1] : grid[row][n1] + grid[row][n2];\n                        next[n1][n2] = max(next[n1][n2], dp[c1][c2] + gain);\n                    }\n                }\n            }\n        }\n        dp = next;\n    }\n    int best = 0;\n    for (int c1 = 0; c1 < n; c1++) {\n        for (int c2 = 0; c2 < n; c2++) best = max(best, dp[c1][c2]);\n    }\n    return best;\n}`,
        c: `int cherryPickup(int** grid, int gridSize, int* gridColSize) {\n    int m = gridSize, n = gridColSize[0];\n    const int NEG = -1;\n    int* dp = (int*) malloc((size_t) n * (size_t) n * sizeof(int));\n    int* next = (int*) malloc((size_t) n * (size_t) n * sizeof(int));\n    for (int i = 0; i < n * n; i++) dp[i] = NEG;\n    dp[0 * n + (n - 1)] = n == 1 ? grid[0][0] : grid[0][0] + grid[0][n - 1];\n    for (int row = 1; row < m; row++) {\n        for (int i = 0; i < n * n; i++) next[i] = NEG;\n        for (int c1 = 0; c1 < n; c1++) {\n            for (int c2 = 0; c2 < n; c2++) {\n                if (dp[c1 * n + c2] == NEG) continue;\n                for (int d1 = -1; d1 <= 1; d1++) {\n                    for (int d2 = -1; d2 <= 1; d2++) {\n                        int n1 = c1 + d1, n2 = c2 + d2;\n                        if (n1 < 0 || n1 >= n || n2 < 0 || n2 >= n) continue;\n                        int gain = n1 == n2 ? grid[row][n1] : grid[row][n1] + grid[row][n2];\n                        int cand = dp[c1 * n + c2] + gain;\n                        if (cand > next[n1 * n + n2]) next[n1 * n + n2] = cand;\n                    }\n                }\n            }\n        }\n        for (int i = 0; i < n * n; i++) dp[i] = next[i];\n    }\n    int best = 0;\n    for (int i = 0; i < n * n; i++) if (dp[i] > best) best = dp[i];\n    free(dp);\n    free(next);\n    return best;\n}`,
        csharp: `public static int CherryPickup(int[][] grid)\n{\n    int m = grid.Length, n = grid[0].Length;\n    const int NEG = -1;\n    var dp = new int[n, n];\n    for (int a = 0; a < n; a++)\n        for (int b = 0; b < n; b++) dp[a, b] = NEG;\n    dp[0, n - 1] = n == 1 ? grid[0][0] : grid[0][0] + grid[0][n - 1];\n    for (int row = 1; row < m; row++)\n    {\n        var next = new int[n, n];\n        for (int a = 0; a < n; a++)\n            for (int b = 0; b < n; b++) next[a, b] = NEG;\n        for (int c1 = 0; c1 < n; c1++)\n        {\n            for (int c2 = 0; c2 < n; c2++)\n            {\n                if (dp[c1, c2] == NEG) continue;\n                for (int d1 = -1; d1 <= 1; d1++)\n                {\n                    for (int d2 = -1; d2 <= 1; d2++)\n                    {\n                        int n1 = c1 + d1, n2 = c2 + d2;\n                        if (n1 < 0 || n1 >= n || n2 < 0 || n2 >= n) continue;\n                        int gain = n1 == n2 ? grid[row][n1] : grid[row][n1] + grid[row][n2];\n                        next[n1, n2] = Math.Max(next[n1, n2], dp[c1, c2] + gain);\n                    }\n                }\n            }\n        }\n        dp = next;\n    }\n    int best = 0;\n    for (int c1 = 0; c1 < n; c1++)\n        for (int c2 = 0; c2 < n; c2++) best = Math.Max(best, dp[c1, c2]);\n    return best;\n}`,
        go: `func cherryPickup(grid [][]int) int {\n\tm, n := len(grid), len(grid[0])\n\tconst NEG = -1\n\tdp := make([][]int, n)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, n)\n\t\tfor j := range dp[i] {\n\t\t\tdp[i][j] = NEG\n\t\t}\n\t}\n\tif n == 1 {\n\t\tdp[0][0] = grid[0][0]\n\t} else {\n\t\tdp[0][n-1] = grid[0][0] + grid[0][n-1]\n\t}\n\tfor row := 1; row < m; row++ {\n\t\tnext := make([][]int, n)\n\t\tfor i := range next {\n\t\t\tnext[i] = make([]int, n)\n\t\t\tfor j := range next[i] {\n\t\t\t\tnext[i][j] = NEG\n\t\t\t}\n\t\t}\n\t\tfor c1 := 0; c1 < n; c1++ {\n\t\t\tfor c2 := 0; c2 < n; c2++ {\n\t\t\t\tif dp[c1][c2] == NEG {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tfor d1 := -1; d1 <= 1; d1++ {\n\t\t\t\t\tfor d2 := -1; d2 <= 1; d2++ {\n\t\t\t\t\t\tn1, n2 := c1+d1, c2+d2\n\t\t\t\t\t\tif n1 < 0 || n1 >= n || n2 < 0 || n2 >= n {\n\t\t\t\t\t\t\tcontinue\n\t\t\t\t\t\t}\n\t\t\t\t\t\tgain := grid[row][n1]\n\t\t\t\t\t\tif n1 != n2 {\n\t\t\t\t\t\t\tgain += grid[row][n2]\n\t\t\t\t\t\t}\n\t\t\t\t\t\tif cand := dp[c1][c2] + gain; cand > next[n1][n2] {\n\t\t\t\t\t\t\tnext[n1][n2] = cand\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tdp = next\n\t}\n\tbest := 0\n\tfor c1 := 0; c1 < n; c1++ {\n\t\tfor c2 := 0; c2 < n; c2++ {\n\t\t\tif dp[c1][c2] > best {\n\t\t\t\tbest = dp[c1][c2]\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun cherryPickup(grid: Array<IntArray>): Int {\n    val m = grid.size\n    val n = grid[0].size\n    val NEG = -1\n    var dp = Array(n) { IntArray(n) { NEG } }\n    dp[0][n - 1] = if (n == 1) grid[0][0] else grid[0][0] + grid[0][n - 1]\n    for (row in 1 until m) {\n        val next = Array(n) { IntArray(n) { NEG } }\n        for (c1 in 0 until n) {\n            for (c2 in 0 until n) {\n                if (dp[c1][c2] == NEG) continue\n                for (d1 in -1..1) {\n                    for (d2 in -1..1) {\n                        val n1 = c1 + d1\n                        val n2 = c2 + d2\n                        if (n1 < 0 || n1 >= n || n2 < 0 || n2 >= n) continue\n                        val gain = if (n1 == n2) grid[row][n1] else grid[row][n1] + grid[row][n2]\n                        next[n1][n2] = maxOf(next[n1][n2], dp[c1][c2] + gain)\n                    }\n                }\n            }\n        }\n        dp = next\n    }\n    var best = 0\n    for (c1 in 0 until n) {\n        for (c2 in 0 until n) best = maxOf(best, dp[c1][c2])\n    }\n    return best\n}`,
        swift: `func cherryPickup(_ grid: [[Int]]) -> Int {\n    let m = grid.count\n    let n = grid[0].count\n    let NEG = -1\n    var dp = [[Int]](repeating: [Int](repeating: NEG, count: n), count: n)\n    dp[0][n - 1] = n == 1 ? grid[0][0] : grid[0][0] + grid[0][n - 1]\n    for row in 1..<m {\n        var next = [[Int]](repeating: [Int](repeating: NEG, count: n), count: n)\n        for c1 in 0..<n {\n            for c2 in 0..<n {\n                if dp[c1][c2] == NEG { continue }\n                for d1 in -1...1 {\n                    for d2 in -1...1 {\n                        let n1 = c1 + d1\n                        let n2 = c2 + d2\n                        if n1 < 0 || n1 >= n || n2 < 0 || n2 >= n { continue }\n                        let gain = n1 == n2 ? grid[row][n1] : grid[row][n1] + grid[row][n2]\n                        next[n1][n2] = max(next[n1][n2], dp[c1][c2] + gain)\n                    }\n                }\n            }\n        }\n        dp = next\n    }\n    var best = 0\n    for c1 in 0..<n {\n        for c2 in 0..<n { best = max(best, dp[c1][c2]) }\n    }\n    return best\n}`,
        rust: `fn cherryPickup(grid: Vec<Vec<i32>>) -> i32 {\n    let m = grid.len();\n    let n = grid[0].len();\n    const NEG: i32 = -1;\n    let mut dp = vec![vec![NEG; n]; n];\n    dp[0][n - 1] = if n == 1 { grid[0][0] } else { grid[0][0] + grid[0][n - 1] };\n    for row in 1..m {\n        let mut next = vec![vec![NEG; n]; n];\n        for c1 in 0..n {\n            for c2 in 0..n {\n                if dp[c1][c2] == NEG {\n                    continue;\n                }\n                for d1 in -1i32..=1 {\n                    for d2 in -1i32..=1 {\n                        let n1 = c1 as i32 + d1;\n                        let n2 = c2 as i32 + d2;\n                        if n1 < 0 || n1 >= n as i32 || n2 < 0 || n2 >= n as i32 {\n                            continue;\n                        }\n                        let (a, b) = (n1 as usize, n2 as usize);\n                        let gain = if a == b { grid[row][a] } else { grid[row][a] + grid[row][b] };\n                        let cand = dp[c1][c2] + gain;\n                        if cand > next[a][b] {\n                            next[a][b] = cand;\n                        }\n                    }\n                }\n            }\n        }\n        dp = next;\n    }\n    let mut best = 0;\n    for c1 in 0..n {\n        for c2 in 0..n {\n            if dp[c1][c2] > best {\n                best = dp[c1][c2];\n            }\n        }\n    }\n    best\n}`,
        php: `function cherryPickup($grid) {\n    $m = count($grid);\n    $n = count($grid[0]);\n    $NEG = -1;\n    $dp = [];\n    for ($a = 0; $a < $n; $a++) $dp[$a] = array_fill(0, $n, $NEG);\n    $dp[0][$n - 1] = $n === 1 ? $grid[0][0] : $grid[0][0] + $grid[0][$n - 1];\n    for ($row = 1; $row < $m; $row++) {\n        $next = [];\n        for ($a = 0; $a < $n; $a++) $next[$a] = array_fill(0, $n, $NEG);\n        for ($c1 = 0; $c1 < $n; $c1++) {\n            for ($c2 = 0; $c2 < $n; $c2++) {\n                if ($dp[$c1][$c2] === $NEG) continue;\n                for ($d1 = -1; $d1 <= 1; $d1++) {\n                    for ($d2 = -1; $d2 <= 1; $d2++) {\n                        $n1 = $c1 + $d1;\n                        $n2 = $c2 + $d2;\n                        if ($n1 < 0 || $n1 >= $n || $n2 < 0 || $n2 >= $n) continue;\n                        $gain = $n1 === $n2 ? $grid[$row][$n1] : $grid[$row][$n1] + $grid[$row][$n2];\n                        $cand = $dp[$c1][$c2] + $gain;\n                        if ($cand > $next[$n1][$n2]) $next[$n1][$n2] = $cand;\n                    }\n                }\n            }\n        }\n        $dp = $next;\n    }\n    $best = 0;\n    for ($c1 = 0; $c1 < $n; $c1++) {\n        for ($c2 = 0; $c2 < $n; $c2++) if ($dp[$c1][$c2] > $best) $best = $dp[$c1][$c2];\n    }\n    return $best;\n}`,
        ruby: `def cherryPickup(grid)\n  m = grid.length\n  n = grid[0].length\n  neg = -1\n  dp = Array.new(n) { Array.new(n, neg) }\n  dp[0][n - 1] = n == 1 ? grid[0][0] : grid[0][0] + grid[0][n - 1]\n  (1...m).each do |row|\n    nxt = Array.new(n) { Array.new(n, neg) }\n    (0...n).each do |c1|\n      (0...n).each do |c2|\n        next if dp[c1][c2] == neg\n        (-1..1).each do |d1|\n          (-1..1).each do |d2|\n            n1 = c1 + d1\n            n2 = c2 + d2\n            next if n1 < 0 || n1 >= n || n2 < 0 || n2 >= n\n            gain = n1 == n2 ? grid[row][n1] : grid[row][n1] + grid[row][n2]\n            cand = dp[c1][c2] + gain\n            nxt[n1][n2] = cand if cand > nxt[n1][n2]\n          end\n        end\n      end\n    end\n    dp = nxt\n  end\n  dp.flatten.max\nend`,
      },
    };
  })(),

  // ── Maximum Height by Stacking Cuboids (LC 1691) ────────────────
  (() => {
    const ref = (cuboids: number[][]) => {
      const boxes = cuboids.map((c) => c.slice().sort((a, b) => a - b));
      boxes.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2]));
      const n = boxes.length;
      const dp = new Array(n).fill(0);
      let best = 0;
      for (let i = 0; i < n; i++) {
        dp[i] = boxes[i][2];
        for (let j = 0; j < i; j++) {
          if (boxes[j][0] <= boxes[i][0] && boxes[j][1] <= boxes[i][1] && boxes[j][2] <= boxes[i][2]) {
            if (dp[j] + boxes[i][2] > dp[i]) dp[i] = dp[j] + boxes[i][2];
          }
        }
        if (dp[i] > best) best = dp[i];
      }
      return best;
    };
    return {
      slug: "maximum-height-by-stacking-cuboids",
      title: "Maximum Height by Stacking Cuboids",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Sorting", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "maxHeight", params: [{ name: "cuboids", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`cuboids[i] = [width, length, height]`. You may **rotate** any cuboid freely, permuting its three dimensions however you like, and you may use any subset.\n\nCuboid `j` may sit on cuboid `i` only if `width_i <= width_j`, `length_i <= length_j` **and** `height_i <= height_j` after rotation. Return the maximum total height of a stack.",
        [
          { in: "cuboids = [[50,45,20],[95,37,53],[45,23,12]]", out: "190", note: "All three stack once each is rotated to put its longest side vertical." },
          { in: "cuboids = [[38,25,45],[76,35,3]]", out: "76", note: "Neither fits on the other, so take the taller one alone." },
          { in: "cuboids = [[7,11,17],[7,17,11],[11,7,17],[11,17,7],[17,7,11],[17,11,7]]", out: "102", note: "All six are the same box; every one stacks, giving 6 × 17." },
        ],
        ["n == cuboids.length", "1 <= n <= 100", "1 <= width, length, height <= 100"]),
      hints: [
        "Sorting each cuboid's own dimensions ascending is always safe — and then the **largest** dimension should be the height.",
        "After that normalisation, sort the cuboids and the problem becomes a longest-increasing-subsequence variant in three dimensions.",
        "`dp[i]` = the tallest stack whose top cuboid is `i`.",
      ],
      editorial: explain({
        idea: "Two normalisations turn this into a weighted LIS. First sort each cuboid's three dimensions ascending, so the largest becomes the height. Then sort the cuboids lexicographically. Now `dp[i] = height_i + max(dp[j])` over the earlier cuboids `j` whose three sorted dimensions are all no larger.",
        steps: [
          "Sort each cuboid's `[w, l, h]` ascending in place.",
          "Sort the list of cuboids lexicographically.",
          "For each `i`, start `dp[i] = boxes[i][2]` and extend from every compatible earlier `j`.",
          "Return the largest `dp[i]`.",
        ],
        why: "The exchange argument behind the first sort is the crux: if a stack uses a cuboid with its largest side *not* vertical, rotating it so the largest side is vertical keeps the footprint no larger in both remaining dimensions and only increases the height — so the sorted orientation is never worse. That collapses six orientations per cuboid to one and makes the second sort meaningful, since a valid stack must then be non-decreasing in all three coordinates.",
        time: "O(n²)",
        space: "O(n)",
        pitfalls: [
          "Forgetting to sort each cuboid's own dimensions makes the comparison wrong in six ways at once.",
          "The comparison is on all three dimensions, not just the footprint.",
          "Equal dimensions are allowed, so identical cuboids all stack.",
        ],
      }),
      examples: [
        { input: "[[50,45,20],[95,37,53],[45,23,12]]", expectedOutput: "190" },
        { input: "[[38,25,45],[76,35,3]]", expectedOutput: "76" },
        { input: "[[7,11,17],[7,17,11],[11,7,17],[11,17,7],[17,7,11],[17,11,7]]", expectedOutput: "102" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const cuboids = Array.from({ length: n }, () => [ri(rng, 1, 30), ri(rng, 1, 30), ri(rng, 1, 30)]);
        return { input: fmtIntMat(cuboids), expectedOutput: String(ref(cuboids)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxHeight(cuboids: List[List[int]]) -> int:\n    boxes = sorted(sorted(c) for c in cuboids)\n    n = len(boxes)\n    dp = [0] * n\n    best = 0\n    for i in range(n):\n        dp[i] = boxes[i][2]\n        for j in range(i):\n            if all(boxes[j][d] <= boxes[i][d] for d in range(3)):\n                dp[i] = max(dp[i], dp[j] + boxes[i][2])\n        best = max(best, dp[i])\n    return best`,
        javascript: `var maxHeight = function(cuboids) {\n    var boxes = [];\n    for (var t = 0; t < cuboids.length; t++) {\n        var c = cuboids[t].slice();\n        c.sort(function(a, b) { return a - b; });\n        boxes.push(c);\n    }\n    boxes.sort(function(a, b) {\n        if (a[0] !== b[0]) return a[0] - b[0];\n        if (a[1] !== b[1]) return a[1] - b[1];\n        return a[2] - b[2];\n    });\n    var n = boxes.length, dp = [], best = 0;\n    for (var i = 0; i < n; i++) dp.push(0);\n    for (i = 0; i < n; i++) {\n        dp[i] = boxes[i][2];\n        for (var j = 0; j < i; j++) {\n            if (boxes[j][0] <= boxes[i][0] && boxes[j][1] <= boxes[i][1] && boxes[j][2] <= boxes[i][2]) {\n                if (dp[j] + boxes[i][2] > dp[i]) dp[i] = dp[j] + boxes[i][2];\n            }\n        }\n        if (dp[i] > best) best = dp[i];\n    }\n    return best;\n};`,
        typescript: `function maxHeight(cuboids: number[][]): number {\n    var boxes: number[][] = [];\n    for (var t = 0; t < cuboids.length; t++) {\n        var c = cuboids[t].slice();\n        c.sort(function(a: number, b: number) { return a - b; });\n        boxes.push(c);\n    }\n    boxes.sort(function(a: number[], b: number[]) {\n        if (a[0] !== b[0]) return a[0] - b[0];\n        if (a[1] !== b[1]) return a[1] - b[1];\n        return a[2] - b[2];\n    });\n    var n = boxes.length, dp: number[] = [], best = 0;\n    for (var i = 0; i < n; i++) dp.push(0);\n    for (i = 0; i < n; i++) {\n        dp[i] = boxes[i][2];\n        for (var j = 0; j < i; j++) {\n            if (boxes[j][0] <= boxes[i][0] && boxes[j][1] <= boxes[i][1] && boxes[j][2] <= boxes[i][2]) {\n                if (dp[j] + boxes[i][2] > dp[i]) dp[i] = dp[j] + boxes[i][2];\n            }\n        }\n        if (dp[i] > best) best = dp[i];\n    }\n    return best;\n}`,
        java: `public static int maxHeight(int[][] cuboids) {\n    int n = cuboids.length;\n    int[][] boxes = new int[n][3];\n    for (int i = 0; i < n; i++) {\n        boxes[i] = cuboids[i].clone();\n        Arrays.sort(boxes[i]);\n    }\n    Arrays.sort(boxes, (a, b) -> {\n        if (a[0] != b[0]) return a[0] - b[0];\n        if (a[1] != b[1]) return a[1] - b[1];\n        return a[2] - b[2];\n    });\n    int[] dp = new int[n];\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        dp[i] = boxes[i][2];\n        for (int j = 0; j < i; j++) {\n            if (boxes[j][0] <= boxes[i][0] && boxes[j][1] <= boxes[i][1] && boxes[j][2] <= boxes[i][2]) {\n                dp[i] = Math.max(dp[i], dp[j] + boxes[i][2]);\n            }\n        }\n        best = Math.max(best, dp[i]);\n    }\n    return best;\n}`,
        cpp: `int maxHeight(vector<vector<int>>& cuboids) {\n    vector<vector<int>> boxes = cuboids;\n    for (auto& b : boxes) sort(b.begin(), b.end());\n    sort(boxes.begin(), boxes.end());\n    int n = (int) boxes.size();\n    vector<int> dp(n, 0);\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        dp[i] = boxes[i][2];\n        for (int j = 0; j < i; j++) {\n            if (boxes[j][0] <= boxes[i][0] && boxes[j][1] <= boxes[i][1] && boxes[j][2] <= boxes[i][2]) {\n                dp[i] = max(dp[i], dp[j] + boxes[i][2]);\n            }\n        }\n        best = max(best, dp[i]);\n    }\n    return best;\n}`,
        c: `static int mhCmpDim(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return x < y ? -1 : (x > y ? 1 : 0);\n}\n\nstatic int mhCmpBox(const void* a, const void* b) {\n    const int* x = (const int*) a;\n    const int* y = (const int*) b;\n    for (int d = 0; d < 3; d++) {\n        if (x[d] != y[d]) return x[d] < y[d] ? -1 : 1;\n    }\n    return 0;\n}\n\nint maxHeight(int** cuboids, int cuboidsSize, int* cuboidsColSize) {\n    (void) cuboidsColSize;\n    int n = cuboidsSize;\n    int* boxes = (int*) malloc((size_t) n * 3 * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        for (int d = 0; d < 3; d++) boxes[i * 3 + d] = cuboids[i][d];\n        qsort(boxes + i * 3, 3, sizeof(int), mhCmpDim);\n    }\n    qsort(boxes, (size_t) n, 3 * sizeof(int), mhCmpBox);\n    int* dp = (int*) calloc((size_t) n, sizeof(int));\n    int best = 0;\n    for (int i = 0; i < n; i++) {\n        dp[i] = boxes[i * 3 + 2];\n        for (int j = 0; j < i; j++) {\n            if (boxes[j * 3] <= boxes[i * 3] && boxes[j * 3 + 1] <= boxes[i * 3 + 1] && boxes[j * 3 + 2] <= boxes[i * 3 + 2]) {\n                if (dp[j] + boxes[i * 3 + 2] > dp[i]) dp[i] = dp[j] + boxes[i * 3 + 2];\n            }\n        }\n        if (dp[i] > best) best = dp[i];\n    }\n    free(boxes);\n    free(dp);\n    return best;\n}`,
        csharp: `public static int MaxHeight(int[][] cuboids)\n{\n    int n = cuboids.Length;\n    var boxes = new int[n][];\n    for (int i = 0; i < n; i++)\n    {\n        boxes[i] = (int[]) cuboids[i].Clone();\n        Array.Sort(boxes[i]);\n    }\n    Array.Sort(boxes, (a, b) =>\n    {\n        if (a[0] != b[0]) return a[0] - b[0];\n        if (a[1] != b[1]) return a[1] - b[1];\n        return a[2] - b[2];\n    });\n    var dp = new int[n];\n    int best = 0;\n    for (int i = 0; i < n; i++)\n    {\n        dp[i] = boxes[i][2];\n        for (int j = 0; j < i; j++)\n        {\n            if (boxes[j][0] <= boxes[i][0] && boxes[j][1] <= boxes[i][1] && boxes[j][2] <= boxes[i][2])\n            {\n                dp[i] = Math.Max(dp[i], dp[j] + boxes[i][2]);\n            }\n        }\n        best = Math.Max(best, dp[i]);\n    }\n    return best;\n}`,
        go: `func maxHeight(cuboids [][]int) int {\n\tn := len(cuboids)\n\tboxes := make([][]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tb := make([]int, 3)\n\t\tcopy(b, cuboids[i])\n\t\tsort.Ints(b)\n\t\tboxes[i] = b\n\t}\n\tsort.Slice(boxes, func(a, b int) bool {\n\t\tfor d := 0; d < 3; d++ {\n\t\t\tif boxes[a][d] != boxes[b][d] {\n\t\t\t\treturn boxes[a][d] < boxes[b][d]\n\t\t\t}\n\t\t}\n\t\treturn false\n\t})\n\tdp := make([]int, n)\n\tbest := 0\n\tfor i := 0; i < n; i++ {\n\t\tdp[i] = boxes[i][2]\n\t\tfor j := 0; j < i; j++ {\n\t\t\tif boxes[j][0] <= boxes[i][0] && boxes[j][1] <= boxes[i][1] && boxes[j][2] <= boxes[i][2] {\n\t\t\t\tif dp[j]+boxes[i][2] > dp[i] {\n\t\t\t\t\tdp[i] = dp[j] + boxes[i][2]\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tif dp[i] > best {\n\t\t\tbest = dp[i]\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxHeight(cuboids: Array<IntArray>): Int {\n    val boxes = cuboids.map { it.sortedArray() }\n        .sortedWith(compareBy({ it[0] }, { it[1] }, { it[2] }))\n    val n = boxes.size\n    val dp = IntArray(n)\n    var best = 0\n    for (i in 0 until n) {\n        dp[i] = boxes[i][2]\n        for (j in 0 until i) {\n            if (boxes[j][0] <= boxes[i][0] && boxes[j][1] <= boxes[i][1] && boxes[j][2] <= boxes[i][2]) {\n                dp[i] = maxOf(dp[i], dp[j] + boxes[i][2])\n            }\n        }\n        best = maxOf(best, dp[i])\n    }\n    return best\n}`,
        swift: `func maxHeight(_ cuboids: [[Int]]) -> Int {\n    let boxes = cuboids.map { $0.sorted() }.sorted { a, b in\n        if a[0] != b[0] { return a[0] < b[0] }\n        if a[1] != b[1] { return a[1] < b[1] }\n        return a[2] < b[2]\n    }\n    let n = boxes.count\n    var dp = [Int](repeating: 0, count: n)\n    var best = 0\n    for i in 0..<n {\n        dp[i] = boxes[i][2]\n        for j in 0..<i {\n            if boxes[j][0] <= boxes[i][0] && boxes[j][1] <= boxes[i][1] && boxes[j][2] <= boxes[i][2] {\n                dp[i] = max(dp[i], dp[j] + boxes[i][2])\n            }\n        }\n        best = max(best, dp[i])\n    }\n    return best\n}`,
        rust: `fn maxHeight(cuboids: Vec<Vec<i32>>) -> i32 {\n    let mut boxes: Vec<Vec<i32>> = cuboids\n        .iter()\n        .map(|c| {\n            let mut v = c.clone();\n            v.sort();\n            v\n        })\n        .collect();\n    boxes.sort();\n    let n = boxes.len();\n    let mut dp = vec![0i32; n];\n    let mut best = 0;\n    for i in 0..n {\n        dp[i] = boxes[i][2];\n        for j in 0..i {\n            if boxes[j][0] <= boxes[i][0] && boxes[j][1] <= boxes[i][1] && boxes[j][2] <= boxes[i][2] {\n                if dp[j] + boxes[i][2] > dp[i] {\n                    dp[i] = dp[j] + boxes[i][2];\n                }\n            }\n        }\n        if dp[i] > best {\n            best = dp[i];\n        }\n    }\n    best\n}`,
        php: `function maxHeight($cuboids) {\n    $boxes = [];\n    foreach ($cuboids as $c) {\n        $b = $c;\n        sort($b);\n        $boxes[] = $b;\n    }\n    usort($boxes, function($a, $b) {\n        if ($a[0] !== $b[0]) return $a[0] - $b[0];\n        if ($a[1] !== $b[1]) return $a[1] - $b[1];\n        return $a[2] - $b[2];\n    });\n    $n = count($boxes);\n    $dp = array_fill(0, $n, 0);\n    $best = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $dp[$i] = $boxes[$i][2];\n        for ($j = 0; $j < $i; $j++) {\n            if ($boxes[$j][0] <= $boxes[$i][0] && $boxes[$j][1] <= $boxes[$i][1] && $boxes[$j][2] <= $boxes[$i][2]) {\n                if ($dp[$j] + $boxes[$i][2] > $dp[$i]) $dp[$i] = $dp[$j] + $boxes[$i][2];\n            }\n        }\n        if ($dp[$i] > $best) $best = $dp[$i];\n    }\n    return $best;\n}`,
        ruby: `def maxHeight(cuboids)\n  boxes = cuboids.map(&:sort).sort\n  n = boxes.length\n  dp = Array.new(n, 0)\n  best = 0\n  (0...n).each do |i|\n    dp[i] = boxes[i][2]\n    (0...i).each do |j|\n      if boxes[j][0] <= boxes[i][0] && boxes[j][1] <= boxes[i][1] && boxes[j][2] <= boxes[i][2]\n        dp[i] = [dp[i], dp[j] + boxes[i][2]].max\n      end\n    end\n    best = [best, dp[i]].max\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Count All Valid Pickup and Delivery Options (LC 1359) ───────
  (() => {
    const ref = (n: number) => {
      let answer = 1;
      for (let i = 1; i <= n; i++) {
        answer = (answer * (2 * i - 1)) % MOD5;
        answer = (answer * i) % MOD5;
      }
      return answer;
    };
    return {
      slug: "count-all-valid-pickup-and-delivery-options",
      title: "Count All Valid Pickup and Delivery Options",
      difficulty: "HARD" as const,
      tags: ["Math", "Dynamic Programming", "Combinatorics", "Google", "Amazon", "Uber"],
      signature: { funcName: "countOrders", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "There are `n` orders, each with a pickup and a delivery. Count the sequences of all `2n` events in which **every** delivery comes after its own pickup.\n\nReturn the count **modulo 10⁹ + 7**.",
        [
          { in: "n = 1", out: "1", note: "Only `P1, D1`." },
          { in: "n = 2", out: "6", note: "Six of the 24 orderings respect both constraints." },
          { in: "n = 3", out: "90" },
        ],
        ["1 <= n <= 500"]),
      hints: [
        "Build the answer one order at a time: suppose you have a valid sequence for `n - 1` orders, of length `2n - 2`.",
        "Inserting the new pickup has `2n - 1` slots; the delivery must then go **after** it.",
        "Count the delivery slots and you get a clean recurrence.",
      ],
      editorial: explain({
        idea: "Insert one order at a time. A valid arrangement of `n-1` orders has `2n-2` events and `2n-1` gaps. Place the new pickup in any gap; that splits the sequence so the delivery has some number of legal positions after it — summing over the pickup's choices gives exactly `(2n-1) · n` new arrangements per old one.",
        steps: [
          "Start with `f(0) = 1`.",
          "For each `i` from 1 to `n`, set `f(i) = f(i-1) · (2i - 1) · i`, modulo 10⁹ + 7.",
          "Return `f(n)`.",
        ],
        why: "The `(2i-1) · i` factor is the neat part. Naively, the new pair can be placed in `C(2i, 2)` ordered ways among `2i` slots, which is `i(2i-1)` — and exactly half of all placements have the delivery before the pickup, so the valid count is `(2i)! / (2^i)` overall, matching the recurrence. Deriving it as \"insert the pickup, then count legal delivery slots\" is the version that generalises to related problems.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The two factors must each be reduced modulo 10⁹ + 7; their product exceeds 32 bits otherwise.",
          "The answer is not `(2n)!` — half of every pair's orderings are invalid.",
          "`n = 1` gives 1, not 2.",
        ],
      }),
      examples: [
        { input: "1", expectedOutput: "1" },
        { input: "2", expectedOutput: "6" },
        { input: "3", expectedOutput: "90" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 500);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def countOrders(n: int) -> int:\n    MOD = 10**9 + 7\n    answer = 1\n    for i in range(1, n + 1):\n        answer = answer * (2 * i - 1) % MOD\n        answer = answer * i % MOD\n    return answer`,
        javascript: `var countOrders = function(n) {\n    var MOD = 1000000007;\n    var answer = 1;\n    for (var i = 1; i <= n; i++) {\n        answer = (answer * (2 * i - 1)) % MOD;\n        answer = (answer * i) % MOD;\n    }\n    return answer;\n};`,
        typescript: `function countOrders(n: number): number {\n    var MOD = 1000000007;\n    var answer = 1;\n    for (var i = 1; i <= n; i++) {\n        answer = (answer * (2 * i - 1)) % MOD;\n        answer = (answer * i) % MOD;\n    }\n    return answer;\n}`,
        java: `public static int countOrders(int n) {\n    final long MOD = 1000000007L;\n    long answer = 1;\n    for (int i = 1; i <= n; i++) {\n        answer = answer * (2L * i - 1) % MOD;\n        answer = answer * i % MOD;\n    }\n    return (int) answer;\n}`,
        cpp: `int countOrders(int n) {\n    const long long MOD = 1000000007LL;\n    long long answer = 1;\n    for (int i = 1; i <= n; i++) {\n        answer = answer * (2LL * i - 1) % MOD;\n        answer = answer * i % MOD;\n    }\n    return (int) answer;\n}`,
        c: `int countOrders(int n) {\n    const long long MOD = 1000000007LL;\n    long long answer = 1;\n    for (int i = 1; i <= n; i++) {\n        answer = answer * (2LL * i - 1) % MOD;\n        answer = answer * i % MOD;\n    }\n    return (int) answer;\n}`,
        csharp: `public static int CountOrders(int n)\n{\n    const long MOD = 1000000007L;\n    long answer = 1;\n    for (int i = 1; i <= n; i++)\n    {\n        answer = answer * (2L * i - 1) % MOD;\n        answer = answer * i % MOD;\n    }\n    return (int) answer;\n}`,
        go: `func countOrders(n int) int {\n\tconst MOD = 1000000007\n\tanswer := 1\n\tfor i := 1; i <= n; i++ {\n\t\tanswer = answer * (2*i - 1) % MOD\n\t\tanswer = answer * i % MOD\n\t}\n\treturn answer\n}`,
        kotlin: `fun countOrders(n: Int): Int {\n    val mod = 1000000007L\n    var answer = 1L\n    for (i in 1..n) {\n        answer = answer * (2L * i - 1) % mod\n        answer = answer * i % mod\n    }\n    return answer.toInt()\n}`,
        swift: `func countOrders(_ n: Int) -> Int {\n    let mod = 1000000007\n    var answer = 1\n    for i in 1...n {\n        answer = answer * (2 * i - 1) % mod\n        answer = answer * i % mod\n    }\n    return answer\n}`,
        rust: `fn countOrders(n: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let mut answer: i64 = 1;\n    for i in 1..=(n as i64) {\n        answer = answer * (2 * i - 1) % MOD;\n        answer = answer * i % MOD;\n    }\n    answer as i32\n}`,
        php: `function countOrders($n) {\n    $MOD = 1000000007;\n    $answer = 1;\n    for ($i = 1; $i <= $n; $i++) {\n        $answer = $answer * (2 * $i - 1) % $MOD;\n        $answer = $answer * $i % $MOD;\n    }\n    return $answer;\n}`,
        ruby: `def countOrders(n)\n  mod = 1000000007\n  answer = 1\n  (1..n).each do |i|\n    answer = answer * (2 * i - 1) % mod\n    answer = answer * i % mod\n  end\n  answer\nend`,
      },
    };
  })(),

  // ── Restore the Array (LC 1416) ─────────────────────────────────
  (() => {
    const ref = (s: string, k: number) => {
      const n = s.length;
      const dp = new Array(n + 1).fill(0);
      dp[n] = 1;
      for (let i = n - 1; i >= 0; i--) {
        if (s.charAt(i) === "0") { dp[i] = 0; continue; }
        let num = 0, total = 0;
        for (let j = i; j < n; j++) {
          num = num * 10 + (s.charCodeAt(j) - 48);
          if (num > k) break;
          total = (total + dp[j + 1]) % MOD5;
        }
        dp[i] = total;
      }
      return dp[0];
    };
    return {
      slug: "restore-the-array",
      title: "Restore the Array",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "numberOfArrays", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A program printed an array of integers, each between `1` and `k` inclusive, and lost the separators — leaving only the digit string `s`.\n\nReturn how many arrays could have produced `s`, **modulo 10⁹ + 7**. No printed integer had a leading zero.",
        [
          { in: 's = "1000", k = 10000', out: "1", note: "Only `[1000]`; `[1, 000]` is invalid because of the leading zeros." },
          { in: 's = "1000", k = 10', out: "0", note: "No split avoids a number above 10 or a leading zero." },
          { in: 's = "1317", k = 2000', out: "8" },
        ],
        ["1 <= s.length <= 10^5", "s consists of only digits and does not contain leading zeros.", "1 <= k <= 10^9"]),
      hints: [
        "`dp[i]` = the number of ways to split the suffix starting at `i`.",
        "A suffix beginning with `'0'` has no valid split at all.",
        "Otherwise grow a number digit by digit and stop as soon as it exceeds `k`.",
      ],
      editorial: explain({
        idea: "Suffix DP. `dp[i]` counts the splits of `s[i..]`, with `dp[n] = 1`. If `s[i]` is `'0'` the suffix is unsplittable. Otherwise extend a number rightwards from `i`, adding `dp[j+1]` for each prefix that stays within `k`.",
        steps: [
          "Set `dp[n] = 1`.",
          "Work `i` down from `n-1`. Return 0 immediately for `s[i] == '0'`.",
          "Build `num = num * 10 + digit` for `j` from `i` upward, breaking once `num > k`.",
          "Accumulate `dp[j+1]` modulo 10⁹ + 7.",
        ],
        why: "The inner loop is bounded by the digit count of `k` — at most ten steps — because any longer number exceeds `k` and breaks out, which is what keeps the whole thing linear despite looking quadratic. The running `num` must be held in 64 bits: one digit past `k` it can reach about ten billion before the comparison stops it.",
        time: "O(n · log₁₀ k)",
        space: "O(n)",
        pitfalls: [
          "A number may not start with `'0'`, but zeros inside a number are fine.",
          "`num` overflows 32 bits on the digit that trips the `> k` check.",
          "`dp[n] = 1` — the empty suffix has exactly one (trivial) split.",
        ],
      }),
      examples: [
        { input: '"1000"\n10000', expectedOutput: "1" },
        { input: '"1000"\n10', expectedOutput: "0" },
        { input: '"1317"\n2000', expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        let s = String(ri(rng, 1, 9));
        for (let i = 1; i < n; i++) s += String(ri(rng, 0, 9));
        const k = ri(rng, 1, 3000);
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: `def numberOfArrays(s: str, k: int) -> int:\n    MOD = 10**9 + 7\n    n = len(s)\n    dp = [0] * (n + 1)\n    dp[n] = 1\n    for i in range(n - 1, -1, -1):\n        if s[i] == "0":\n            dp[i] = 0\n            continue\n        num = 0\n        total = 0\n        for j in range(i, n):\n            num = num * 10 + int(s[j])\n            if num > k:\n                break\n            total = (total + dp[j + 1]) % MOD\n        dp[i] = total\n    return dp[0]`,
        javascript: `var numberOfArrays = function(s, k) {\n    var MOD = 1000000007;\n    var n = s.length;\n    var dp = [];\n    for (var t = 0; t <= n; t++) dp.push(0);\n    dp[n] = 1;\n    for (var i = n - 1; i >= 0; i--) {\n        if (s.charAt(i) === "0") { dp[i] = 0; continue; }\n        var num = 0, total = 0;\n        for (var j = i; j < n; j++) {\n            num = num * 10 + (s.charCodeAt(j) - 48);\n            if (num > k) break;\n            total = (total + dp[j + 1]) % MOD;\n        }\n        dp[i] = total;\n    }\n    return dp[0];\n};`,
        typescript: `function numberOfArrays(s: string, k: number): number {\n    var MOD = 1000000007;\n    var n = s.length;\n    var dp: number[] = [];\n    for (var t = 0; t <= n; t++) dp.push(0);\n    dp[n] = 1;\n    for (var i = n - 1; i >= 0; i--) {\n        if (s.charAt(i) === "0") { dp[i] = 0; continue; }\n        var num = 0, total = 0;\n        for (var j = i; j < n; j++) {\n            num = num * 10 + (s.charCodeAt(j) - 48);\n            if (num > k) break;\n            total = (total + dp[j + 1]) % MOD;\n        }\n        dp[i] = total;\n    }\n    return dp[0];\n}`,
        java: `public static int numberOfArrays(String s, int k) {\n    final long MOD = 1000000007L;\n    int n = s.length();\n    long[] dp = new long[n + 1];\n    dp[n] = 1;\n    for (int i = n - 1; i >= 0; i--) {\n        if (s.charAt(i) == '0') {\n            dp[i] = 0;\n            continue;\n        }\n        long num = 0, total = 0;\n        for (int j = i; j < n; j++) {\n            num = num * 10 + (s.charAt(j) - '0');\n            if (num > k) break;\n            total = (total + dp[j + 1]) % MOD;\n        }\n        dp[i] = total;\n    }\n    return (int) dp[0];\n}`,
        cpp: `int numberOfArrays(string s, int k) {\n    const long long MOD = 1000000007LL;\n    int n = (int) s.size();\n    vector<long long> dp(n + 1, 0);\n    dp[n] = 1;\n    for (int i = n - 1; i >= 0; i--) {\n        if (s[i] == '0') {\n            dp[i] = 0;\n            continue;\n        }\n        long long num = 0, total = 0;\n        for (int j = i; j < n; j++) {\n            num = num * 10 + (s[j] - '0');\n            if (num > k) break;\n            total = (total + dp[j + 1]) % MOD;\n        }\n        dp[i] = total;\n    }\n    return (int) dp[0];\n}`,
        c: `int numberOfArrays(char* s, int k) {\n    const long long MOD = 1000000007LL;\n    int n = (int) strlen(s);\n    long long* dp = (long long*) calloc((size_t) (n + 1), sizeof(long long));\n    dp[n] = 1;\n    for (int i = n - 1; i >= 0; i--) {\n        if (s[i] == '0') {\n            dp[i] = 0;\n            continue;\n        }\n        long long num = 0, total = 0;\n        for (int j = i; j < n; j++) {\n            num = num * 10 + (s[j] - '0');\n            if (num > k) break;\n            total = (total + dp[j + 1]) % MOD;\n        }\n        dp[i] = total;\n    }\n    int answer = (int) dp[0];\n    free(dp);\n    return answer;\n}`,
        csharp: `public static int NumberOfArrays(string s, int k)\n{\n    const long MOD = 1000000007L;\n    int n = s.Length;\n    var dp = new long[n + 1];\n    dp[n] = 1;\n    for (int i = n - 1; i >= 0; i--)\n    {\n        if (s[i] == '0')\n        {\n            dp[i] = 0;\n            continue;\n        }\n        long num = 0, total = 0;\n        for (int j = i; j < n; j++)\n        {\n            num = num * 10 + (s[j] - '0');\n            if (num > k) break;\n            total = (total + dp[j + 1]) % MOD;\n        }\n        dp[i] = total;\n    }\n    return (int) dp[0];\n}`,
        go: `func numberOfArrays(s string, k int) int {\n\tconst MOD = 1000000007\n\tn := len(s)\n\tdp := make([]int, n+1)\n\tdp[n] = 1\n\tfor i := n - 1; i >= 0; i-- {\n\t\tif s[i] == '0' {\n\t\t\tdp[i] = 0\n\t\t\tcontinue\n\t\t}\n\t\tnum, total := 0, 0\n\t\tfor j := i; j < n; j++ {\n\t\t\tnum = num*10 + int(s[j]-'0')\n\t\t\tif num > k {\n\t\t\t\tbreak\n\t\t\t}\n\t\t\ttotal = (total + dp[j+1]) % MOD\n\t\t}\n\t\tdp[i] = total\n\t}\n\treturn dp[0]\n}`,
        kotlin: `fun numberOfArrays(s: String, k: Int): Int {\n    val mod = 1000000007L\n    val n = s.length\n    val dp = LongArray(n + 1)\n    dp[n] = 1\n    for (i in n - 1 downTo 0) {\n        if (s[i] == '0') {\n            dp[i] = 0\n            continue\n        }\n        var num = 0L\n        var total = 0L\n        for (j in i until n) {\n            num = num * 10 + (s[j] - '0')\n            if (num > k) break\n            total = (total + dp[j + 1]) % mod\n        }\n        dp[i] = total\n    }\n    return dp[0].toInt()\n}`,
        swift: `func numberOfArrays(_ s: String, _ k: Int) -> Int {\n    let mod = 1000000007\n    let chars = Array(s)\n    let n = chars.count\n    var dp = [Int](repeating: 0, count: n + 1)\n    dp[n] = 1\n    var i = n - 1\n    while i >= 0 {\n        if chars[i] == "0" {\n            dp[i] = 0\n            i -= 1\n            continue\n        }\n        var num = 0\n        var total = 0\n        for j in i..<n {\n            num = num * 10 + chars[j].wholeNumberValue!\n            if num > k { break }\n            total = (total + dp[j + 1]) % mod\n        }\n        dp[i] = total\n        i -= 1\n    }\n    return dp[0]\n}`,
        rust: `fn numberOfArrays(s: String, k: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let b = s.as_bytes();\n    let n = b.len();\n    let k = k as i64;\n    let mut dp = vec![0i64; n + 1];\n    dp[n] = 1;\n    for i in (0..n).rev() {\n        if b[i] == b'0' {\n            dp[i] = 0;\n            continue;\n        }\n        let mut num: i64 = 0;\n        let mut total: i64 = 0;\n        for j in i..n {\n            num = num * 10 + (b[j] - b'0') as i64;\n            if num > k {\n                break;\n            }\n            total = (total + dp[j + 1]) % MOD;\n        }\n        dp[i] = total;\n    }\n    dp[0] as i32\n}`,
        php: `function numberOfArrays($s, $k) {\n    $MOD = 1000000007;\n    $n = strlen($s);\n    $dp = array_fill(0, $n + 1, 0);\n    $dp[$n] = 1;\n    for ($i = $n - 1; $i >= 0; $i--) {\n        if ($s[$i] === "0") { $dp[$i] = 0; continue; }\n        $num = 0;\n        $total = 0;\n        for ($j = $i; $j < $n; $j++) {\n            $num = $num * 10 + (ord($s[$j]) - 48);\n            if ($num > $k) break;\n            $total = ($total + $dp[$j + 1]) % $MOD;\n        }\n        $dp[$i] = $total;\n    }\n    return $dp[0];\n}`,
        ruby: `def numberOfArrays(s, k)\n  mod = 1000000007\n  n = s.length\n  dp = Array.new(n + 1, 0)\n  dp[n] = 1\n  (n - 1).downto(0) do |i|\n    if s[i] == "0"\n      dp[i] = 0\n      next\n    end\n    num = 0\n    total = 0\n    (i...n).each do |j|\n      num = num * 10 + s[j].to_i\n      break if num > k\n      total = (total + dp[j + 1]) % mod\n    end\n    dp[i] = total\n  end\n  dp[0]\nend`,
      },
    };
  })(),

  // ── Constrained Subsequence Sum (LC 1425) ───────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      const dp = new Array(n).fill(0);
      const deque: number[] = [];
      let best = -2000000000;
      for (let i = 0; i < n; i++) {
        while (deque.length > 0 && deque[0] < i - k) deque.shift();
        const carry = deque.length > 0 && dp[deque[0]] > 0 ? dp[deque[0]] : 0;
        dp[i] = nums[i] + carry;
        if (dp[i] > best) best = dp[i];
        while (deque.length > 0 && dp[deque[deque.length - 1]] <= dp[i]) deque.pop();
        deque.push(i);
      }
      return best;
    };
    return {
      slug: "constrained-subsequence-sum",
      title: "Constrained Subsequence Sum",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Queue", "Sliding Window", "Monotonic Queue", "Heap (Priority Queue)", "Google", "Amazon", "Meta"],
      signature: { funcName: "constrainedSubsetSum", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Return the maximum sum of a **non-empty** subsequence of `nums` such that for every pair of consecutive chosen elements at indices `i < j`, the gap satisfies `j - i <= k`.",
        [
          { in: "nums = [10,2,-10,5,20], k = 2", out: "37", note: "Take 10, 2, 5 and 20 — every gap is at most 2." },
          { in: "nums = [-1,-2,-3], k = 1", out: "-1", note: "The subsequence must be non-empty, so take the least negative value." },
          { in: "nums = [10,-2,-10,-5,20], k = 2", out: "23", note: "10, then −5 to bridge the gap, then 20." },
        ],
        ["1 <= k <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"]),
      hints: [
        "`dp[i]` = the best sum of a valid subsequence **ending at** `i`.",
        "`dp[i] = nums[i] + max(0, max(dp[i-k..i-1]))` — the 0 covers starting fresh at `i`.",
        "A sliding-window maximum over `dp` is exactly a monotonic deque.",
      ],
      editorial: explain({
        idea: "Define `dp[i]` as the best sum of a valid subsequence ending at `i`. The previous chosen element is within `k` positions, so `dp[i] = nums[i] + max(0, max(dp[i-k..i-1]))`. Maintaining that windowed maximum with a monotonic deque makes each step amortised O(1).",
        steps: [
          "Keep a deque of indices with decreasing `dp` values.",
          "At each `i`, drop front indices that have fallen out of the `k`-window.",
          "Set `dp[i] = nums[i] + max(0, dp[front])`.",
          "Pop back indices whose `dp` is no greater than `dp[i]`, then push `i`.",
          "Track the running best `dp[i]`.",
        ],
        why: "The `max(0, …)` term is what allows a subsequence to *start* at `i` rather than extend a loss-making prefix — without it an all-negative array would be forced to chain. And the answer is the best `dp[i]`, not `dp[n-1]`: the subsequence may end anywhere. A heap works too, but needs lazy deletion of stale indices; the deque avoids that entirely.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The subsequence must be non-empty, so an all-negative array answers with its maximum element, not 0.",
          "The window covers the previous `k` indices, excluding `i` itself.",
          "The answer is the maximum over all `dp[i]`, not the last one.",
        ],
      }),
      examples: [
        { input: "[10,2,-10,5,20]\n2", expectedOutput: "37" },
        { input: "[-1,-2,-3]\n1", expectedOutput: "-1" },
        { input: "[10,-2,-10,-5,20]\n2", expectedOutput: "23" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 14);
        const nums = Array.from({ length: n }, () => ri(rng, -20, 20));
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from collections import deque\nfrom typing import List\n\ndef constrainedSubsetSum(nums: List[int], k: int) -> int:\n    n = len(nums)\n    dp = [0] * n\n    dq = deque()\n    best = -(10**9)\n    for i in range(n):\n        while dq and dq[0] < i - k:\n            dq.popleft()\n        carry = dp[dq[0]] if dq and dp[dq[0]] > 0 else 0\n        dp[i] = nums[i] + carry\n        best = max(best, dp[i])\n        while dq and dp[dq[-1]] <= dp[i]:\n            dq.pop()\n        dq.append(i)\n    return best`,
        javascript: `var constrainedSubsetSum = function(nums, k) {\n    var n = nums.length;\n    var dp = [];\n    for (var t = 0; t < n; t++) dp.push(0);\n    var deque = [], head = 0;\n    var best = -2000000000;\n    for (var i = 0; i < n; i++) {\n        while (head < deque.length && deque[head] < i - k) head++;\n        var carry = head < deque.length && dp[deque[head]] > 0 ? dp[deque[head]] : 0;\n        dp[i] = nums[i] + carry;\n        if (dp[i] > best) best = dp[i];\n        while (deque.length > head && dp[deque[deque.length - 1]] <= dp[i]) deque.pop();\n        deque.push(i);\n    }\n    return best;\n};`,
        typescript: `function constrainedSubsetSum(nums: number[], k: number): number {\n    var n = nums.length;\n    var dp: number[] = [];\n    for (var t = 0; t < n; t++) dp.push(0);\n    var deque: number[] = [], head = 0;\n    var best = -2000000000;\n    for (var i = 0; i < n; i++) {\n        while (head < deque.length && deque[head] < i - k) head++;\n        var carry = head < deque.length && dp[deque[head]] > 0 ? dp[deque[head]] : 0;\n        dp[i] = nums[i] + carry;\n        if (dp[i] > best) best = dp[i];\n        while (deque.length > head && dp[deque[deque.length - 1]] <= dp[i]) deque.pop();\n        deque.push(i);\n    }\n    return best;\n}`,
        java: `public static int constrainedSubsetSum(int[] nums, int k) {\n    int n = nums.length;\n    int[] dp = new int[n];\n    Deque<Integer> dq = new ArrayDeque<>();\n    int best = Integer.MIN_VALUE;\n    for (int i = 0; i < n; i++) {\n        while (!dq.isEmpty() && dq.peekFirst() < i - k) dq.pollFirst();\n        int carry = !dq.isEmpty() && dp[dq.peekFirst()] > 0 ? dp[dq.peekFirst()] : 0;\n        dp[i] = nums[i] + carry;\n        best = Math.max(best, dp[i]);\n        while (!dq.isEmpty() && dp[dq.peekLast()] <= dp[i]) dq.pollLast();\n        dq.addLast(i);\n    }\n    return best;\n}`,
        cpp: `int constrainedSubsetSum(vector<int>& nums, int k) {\n    int n = (int) nums.size();\n    vector<int> dp(n, 0);\n    deque<int> dq;\n    int best = INT_MIN;\n    for (int i = 0; i < n; i++) {\n        while (!dq.empty() && dq.front() < i - k) dq.pop_front();\n        int carry = (!dq.empty() && dp[dq.front()] > 0) ? dp[dq.front()] : 0;\n        dp[i] = nums[i] + carry;\n        best = max(best, dp[i]);\n        while (!dq.empty() && dp[dq.back()] <= dp[i]) dq.pop_back();\n        dq.push_back(i);\n    }\n    return best;\n}`,
        c: `int constrainedSubsetSum(int* nums, int numsSize, int k) {\n    int n = numsSize;\n    int* dp = (int*) calloc((size_t) n, sizeof(int));\n    int* dq = (int*) malloc((size_t) n * sizeof(int));\n    int head = 0, tail = 0;\n    int best = -2000000000;\n    for (int i = 0; i < n; i++) {\n        while (head < tail && dq[head] < i - k) head++;\n        int carry = (head < tail && dp[dq[head]] > 0) ? dp[dq[head]] : 0;\n        dp[i] = nums[i] + carry;\n        if (dp[i] > best) best = dp[i];\n        while (head < tail && dp[dq[tail - 1]] <= dp[i]) tail--;\n        dq[tail++] = i;\n    }\n    free(dp);\n    free(dq);\n    return best;\n}`,
        csharp: `public static int ConstrainedSubsetSum(int[] nums, int k)\n{\n    int n = nums.Length;\n    var dp = new int[n];\n    var dq = new LinkedList<int>();\n    int best = int.MinValue;\n    for (int i = 0; i < n; i++)\n    {\n        while (dq.Count > 0 && dq.First.Value < i - k) dq.RemoveFirst();\n        int carry = dq.Count > 0 && dp[dq.First.Value] > 0 ? dp[dq.First.Value] : 0;\n        dp[i] = nums[i] + carry;\n        best = Math.Max(best, dp[i]);\n        while (dq.Count > 0 && dp[dq.Last.Value] <= dp[i]) dq.RemoveLast();\n        dq.AddLast(i);\n    }\n    return best;\n}`,
        go: `func constrainedSubsetSum(nums []int, k int) int {\n\tn := len(nums)\n\tdp := make([]int, n)\n\tdq := make([]int, 0, n)\n\tbest := -2000000000\n\tfor i := 0; i < n; i++ {\n\t\tfor len(dq) > 0 && dq[0] < i-k {\n\t\t\tdq = dq[1:]\n\t\t}\n\t\tcarry := 0\n\t\tif len(dq) > 0 && dp[dq[0]] > 0 {\n\t\t\tcarry = dp[dq[0]]\n\t\t}\n\t\tdp[i] = nums[i] + carry\n\t\tif dp[i] > best {\n\t\t\tbest = dp[i]\n\t\t}\n\t\tfor len(dq) > 0 && dp[dq[len(dq)-1]] <= dp[i] {\n\t\t\tdq = dq[:len(dq)-1]\n\t\t}\n\t\tdq = append(dq, i)\n\t}\n\treturn best\n}`,
        kotlin: `fun constrainedSubsetSum(nums: IntArray, k: Int): Int {\n    val n = nums.size\n    val dp = IntArray(n)\n    val dq = java.util.ArrayDeque<Int>()\n    var best = Int.MIN_VALUE\n    for (i in 0 until n) {\n        while (dq.isNotEmpty() && dq.peekFirst() < i - k) dq.pollFirst()\n        val carry = if (dq.isNotEmpty() && dp[dq.peekFirst()] > 0) dp[dq.peekFirst()] else 0\n        dp[i] = nums[i] + carry\n        best = maxOf(best, dp[i])\n        while (dq.isNotEmpty() && dp[dq.peekLast()] <= dp[i]) dq.pollLast()\n        dq.addLast(i)\n    }\n    return best\n}`,
        swift: `func constrainedSubsetSum(_ nums: [Int], _ k: Int) -> Int {\n    let n = nums.count\n    var dp = [Int](repeating: 0, count: n)\n    var dq = [Int]()\n    var head = 0\n    var best = Int.min\n    for i in 0..<n {\n        while head < dq.count && dq[head] < i - k { head += 1 }\n        let carry = (head < dq.count && dp[dq[head]] > 0) ? dp[dq[head]] : 0\n        dp[i] = nums[i] + carry\n        best = max(best, dp[i])\n        while dq.count > head && dp[dq[dq.count - 1]] <= dp[i] { dq.removeLast() }\n        dq.append(i)\n    }\n    return best\n}`,
        rust: `fn constrainedSubsetSum(nums: Vec<i32>, k: i32) -> i32 {\n    let n = nums.len();\n    let k = k as usize;\n    let mut dp = vec![0i32; n];\n    let mut dq: std::collections::VecDeque<usize> = std::collections::VecDeque::new();\n    let mut best = std::i32::MIN;\n    for i in 0..n {\n        while let Some(&front) = dq.front() {\n            if front + k < i {\n                dq.pop_front();\n            } else {\n                break;\n            }\n        }\n        let carry = match dq.front() {\n            Some(&f) if dp[f] > 0 => dp[f],\n            _ => 0,\n        };\n        dp[i] = nums[i] + carry;\n        if dp[i] > best {\n            best = dp[i];\n        }\n        while let Some(&back) = dq.back() {\n            if dp[back] <= dp[i] {\n                dq.pop_back();\n            } else {\n                break;\n            }\n        }\n        dq.push_back(i);\n    }\n    best\n}`,
        php: `function constrainedSubsetSum($nums, $k) {\n    $n = count($nums);\n    $dp = array_fill(0, $n, 0);\n    $dq = [];\n    $head = 0;\n    $best = -2000000000;\n    for ($i = 0; $i < $n; $i++) {\n        while ($head < count($dq) && $dq[$head] < $i - $k) $head++;\n        $carry = ($head < count($dq) && $dp[$dq[$head]] > 0) ? $dp[$dq[$head]] : 0;\n        $dp[$i] = $nums[$i] + $carry;\n        if ($dp[$i] > $best) $best = $dp[$i];\n        while (count($dq) > $head && $dp[$dq[count($dq) - 1]] <= $dp[$i]) array_pop($dq);\n        $dq[] = $i;\n    }\n    return $best;\n}`,
        ruby: `def constrainedSubsetSum(nums, k)\n  n = nums.length\n  dp = Array.new(n, 0)\n  dq = []\n  best = -2000000000\n  (0...n).each do |i|\n    dq.shift while !dq.empty? && dq[0] < i - k\n    carry = (!dq.empty? && dp[dq[0]] > 0) ? dp[dq[0]] : 0\n    dp[i] = nums[i] + carry\n    best = dp[i] if dp[i] > best\n    dq.pop while !dq.empty? && dp[dq[-1]] <= dp[i]\n    dq << i\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Allocate Mailboxes (LC 1478) ────────────────────────────────
  (() => {
    const ref = (houses: number[], k: number) => {
      const h = houses.slice().sort((a, b) => a - b);
      const n = h.length;
      const INF = 1000000000;
      // cost[i][j] = total walking distance when one mailbox serves h[i..j].
      const cost: number[][] = [];
      for (let i = 0; i < n; i++) cost.push(new Array(n).fill(0));
      for (let i = 0; i < n; i++) {
        for (let j = i; j < n; j++) {
          let total = 0;
          const mid = h[Math.floor((i + j) / 2)];
          for (let t = i; t <= j; t++) total += h[t] > mid ? h[t] - mid : mid - h[t];
          cost[i][j] = total;
        }
      }
      const dp: number[][] = [];
      for (let g = 0; g <= k; g++) dp.push(new Array(n + 1).fill(INF));
      dp[0][0] = 0;
      for (let g = 1; g <= k; g++) {
        for (let j = 1; j <= n; j++) {
          for (let i = 0; i < j; i++) {
            if (dp[g - 1][i] === INF) continue;
            const cand = dp[g - 1][i] + cost[i][j - 1];
            if (cand < dp[g][j]) dp[g][j] = cand;
          }
        }
      }
      return dp[k][n];
    };
    return {
      slug: "allocate-mailboxes",
      title: "Allocate Mailboxes",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Sorting", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "minDistance", params: [{ name: "houses", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`houses[i]` is the position of the `i`-th house on a street. Place exactly `k` mailboxes anywhere along the street.\n\nReturn the minimum total distance between each house and its **nearest** mailbox.",
        [
          { in: "houses = [1,4,8,10,20], k = 3", out: "5", note: "Mailboxes at 3, 9 and 20 cost 2 + 1 + 1 + 1 + 0." },
          { in: "houses = [2,3,5,12,18], k = 2", out: "9", note: "One mailbox covers 2, 3, 5 and another covers 12 and 18." },
          { in: "houses = [7,4,6,1], k = 1", out: "8" },
        ],
        ["1 <= k <= houses.length <= 100", "1 <= houses[i] <= 10^4", "All the integers of houses are unique."]),
      hints: [
        "Sort the houses. Each mailbox then serves a **contiguous block** of them.",
        "For one block, the optimal mailbox sits at the block's median, and the cost is a fixed number you can precompute.",
        "`dp[g][j]` = the best cost covering the first `j` houses with `g` mailboxes.",
      ],
      editorial: explain({
        idea: "Sort the houses; an optimal solution assigns each mailbox a contiguous run. Precompute `cost[i][j]` — the total distance when a single mailbox serves houses `i..j`, which is minimised by placing it at the median. Then a partition DP over the number of mailboxes finishes it.",
        steps: [
          "Sort `houses`.",
          "For every `i <= j`, compute `cost[i][j]` as the sum of `|h[t] - median|` over the block.",
          "Set `dp[0][0] = 0` and `dp[g][j] = min over i < j of dp[g-1][i] + cost[i][j-1]`.",
          "Return `dp[k][n]`.",
        ],
        why: "Two facts carry the solution. Contiguity: if a mailbox served a non-contiguous set, some house would be closer to another mailbox — so blocks never interleave, and a partition DP is exhaustive. The median: for absolute deviations on a line the median is the minimiser, which is why each block's cost is a single precomputable number rather than another search.",
        time: "O(n³) for the cost table plus O(k · n²) for the DP",
        space: "O(n² + k · n)",
        pitfalls: [
          "The positions arrive unsorted; the contiguity argument only holds after sorting.",
          "The median, not the mean, minimises the sum of absolute distances.",
          "Exactly `k` mailboxes must be placed, though two may coincide when `k` exceeds what is useful.",
        ],
      }),
      examples: [
        { input: "[1,4,8,10,20]\n3", expectedOutput: "5" },
        { input: "[2,3,5,12,18]\n2", expectedOutput: "9" },
        { input: "[7,4,6,1]\n1", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const pool: number[] = [];
        for (let v = 1; v <= 50; v++) pool.push(v);
        const picked = shuffle(rng, pool).slice(0, n);
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(picked)}\n${k}`, expectedOutput: String(ref(picked, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minDistance(houses: List[int], k: int) -> int:\n    h = sorted(houses)\n    n = len(h)\n    INF = 10**9\n    cost = [[0] * n for _ in range(n)]\n    for i in range(n):\n        for j in range(i, n):\n            mid = h[(i + j) // 2]\n            cost[i][j] = sum(abs(h[t] - mid) for t in range(i, j + 1))\n    dp = [[INF] * (n + 1) for _ in range(k + 1)]\n    dp[0][0] = 0\n    for g in range(1, k + 1):\n        for j in range(1, n + 1):\n            for i in range(j):\n                if dp[g - 1][i] == INF:\n                    continue\n                dp[g][j] = min(dp[g][j], dp[g - 1][i] + cost[i][j - 1])\n    return dp[k][n]`,
        javascript: `var minDistance = function(houses, k) {\n    var h = houses.slice();\n    h.sort(function(a, b) { return a - b; });\n    var n = h.length, INF = 1000000000, i, j, t;\n    var cost = [];\n    for (i = 0; i < n; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(0);\n        cost.push(row);\n    }\n    for (i = 0; i < n; i++) {\n        for (j = i; j < n; j++) {\n            var total = 0;\n            var mid = h[Math.floor((i + j) / 2)];\n            for (t = i; t <= j; t++) total += h[t] > mid ? h[t] - mid : mid - h[t];\n            cost[i][j] = total;\n        }\n    }\n    var dp = [];\n    for (var g = 0; g <= k; g++) {\n        var r = [];\n        for (j = 0; j <= n; j++) r.push(INF);\n        dp.push(r);\n    }\n    dp[0][0] = 0;\n    for (g = 1; g <= k; g++) {\n        for (j = 1; j <= n; j++) {\n            for (i = 0; i < j; i++) {\n                if (dp[g - 1][i] === INF) continue;\n                var cand = dp[g - 1][i] + cost[i][j - 1];\n                if (cand < dp[g][j]) dp[g][j] = cand;\n            }\n        }\n    }\n    return dp[k][n];\n};`,
        typescript: `function minDistance(houses: number[], k: number): number {\n    var h = houses.slice();\n    h.sort(function(a: number, b: number) { return a - b; });\n    var n = h.length, INF = 1000000000, i: number, j: number, t: number;\n    var cost: number[][] = [];\n    for (i = 0; i < n; i++) {\n        var row: number[] = [];\n        for (j = 0; j < n; j++) row.push(0);\n        cost.push(row);\n    }\n    for (i = 0; i < n; i++) {\n        for (j = i; j < n; j++) {\n            var total = 0;\n            var mid = h[Math.floor((i + j) / 2)];\n            for (t = i; t <= j; t++) total += h[t] > mid ? h[t] - mid : mid - h[t];\n            cost[i][j] = total;\n        }\n    }\n    var dp: number[][] = [];\n    for (var g = 0; g <= k; g++) {\n        var r: number[] = [];\n        for (j = 0; j <= n; j++) r.push(INF);\n        dp.push(r);\n    }\n    dp[0][0] = 0;\n    for (g = 1; g <= k; g++) {\n        for (j = 1; j <= n; j++) {\n            for (i = 0; i < j; i++) {\n                if (dp[g - 1][i] === INF) continue;\n                var cand = dp[g - 1][i] + cost[i][j - 1];\n                if (cand < dp[g][j]) dp[g][j] = cand;\n            }\n        }\n    }\n    return dp[k][n];\n}`,
        java: `public static int minDistance(int[] houses, int k) {\n    int[] h = houses.clone();\n    Arrays.sort(h);\n    int n = h.length;\n    final int INF = 1000000000;\n    int[][] cost = new int[n][n];\n    for (int i = 0; i < n; i++) {\n        for (int j = i; j < n; j++) {\n            int mid = h[(i + j) / 2];\n            int total = 0;\n            for (int t = i; t <= j; t++) total += Math.abs(h[t] - mid);\n            cost[i][j] = total;\n        }\n    }\n    int[][] dp = new int[k + 1][n + 1];\n    for (int[] row : dp) Arrays.fill(row, INF);\n    dp[0][0] = 0;\n    for (int g = 1; g <= k; g++) {\n        for (int j = 1; j <= n; j++) {\n            for (int i = 0; i < j; i++) {\n                if (dp[g - 1][i] == INF) continue;\n                dp[g][j] = Math.min(dp[g][j], dp[g - 1][i] + cost[i][j - 1]);\n            }\n        }\n    }\n    return dp[k][n];\n}`,
        cpp: `int minDistance(vector<int>& houses, int k) {\n    vector<int> h = houses;\n    sort(h.begin(), h.end());\n    int n = (int) h.size();\n    const int INF = 1000000000;\n    vector<vector<int>> cost(n, vector<int>(n, 0));\n    for (int i = 0; i < n; i++) {\n        for (int j = i; j < n; j++) {\n            int mid = h[(i + j) / 2];\n            int total = 0;\n            for (int t = i; t <= j; t++) total += abs(h[t] - mid);\n            cost[i][j] = total;\n        }\n    }\n    vector<vector<int>> dp(k + 1, vector<int>(n + 1, INF));\n    dp[0][0] = 0;\n    for (int g = 1; g <= k; g++) {\n        for (int j = 1; j <= n; j++) {\n            for (int i = 0; i < j; i++) {\n                if (dp[g - 1][i] == INF) continue;\n                dp[g][j] = min(dp[g][j], dp[g - 1][i] + cost[i][j - 1]);\n            }\n        }\n    }\n    return dp[k][n];\n}`,
        c: `static int amCmp(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return x < y ? -1 : (x > y ? 1 : 0);\n}\n\nint minDistance(int* houses, int housesSize, int k) {\n    int n = housesSize;\n    const int INF = 1000000000;\n    int* h = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) h[i] = houses[i];\n    qsort(h, (size_t) n, sizeof(int), amCmp);\n    int* cost = (int*) calloc((size_t) n * (size_t) n, sizeof(int));\n    for (int i = 0; i < n; i++) {\n        for (int j = i; j < n; j++) {\n            int mid = h[(i + j) / 2];\n            int total = 0;\n            for (int t = i; t <= j; t++) total += h[t] > mid ? h[t] - mid : mid - h[t];\n            cost[i * n + j] = total;\n        }\n    }\n    int width = n + 1;\n    int* dp = (int*) malloc((size_t) (k + 1) * (size_t) width * sizeof(int));\n    for (int i = 0; i < (k + 1) * width; i++) dp[i] = INF;\n    dp[0] = 0;\n    for (int g = 1; g <= k; g++) {\n        for (int j = 1; j <= n; j++) {\n            for (int i = 0; i < j; i++) {\n                if (dp[(g - 1) * width + i] == INF) continue;\n                int cand = dp[(g - 1) * width + i] + cost[i * n + (j - 1)];\n                if (cand < dp[g * width + j]) dp[g * width + j] = cand;\n            }\n        }\n    }\n    int answer = dp[k * width + n];\n    free(h);\n    free(cost);\n    free(dp);\n    return answer;\n}`,
        csharp: `public static int MinDistance(int[] houses, int k)\n{\n    var h = (int[]) houses.Clone();\n    Array.Sort(h);\n    int n = h.Length;\n    const int INF = 1000000000;\n    var cost = new int[n, n];\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = i; j < n; j++)\n        {\n            int mid = h[(i + j) / 2];\n            int total = 0;\n            for (int t = i; t <= j; t++) total += Math.Abs(h[t] - mid);\n            cost[i, j] = total;\n        }\n    }\n    var dp = new int[k + 1, n + 1];\n    for (int g = 0; g <= k; g++)\n        for (int j = 0; j <= n; j++) dp[g, j] = INF;\n    dp[0, 0] = 0;\n    for (int g = 1; g <= k; g++)\n    {\n        for (int j = 1; j <= n; j++)\n        {\n            for (int i = 0; i < j; i++)\n            {\n                if (dp[g - 1, i] == INF) continue;\n                dp[g, j] = Math.Min(dp[g, j], dp[g - 1, i] + cost[i, j - 1]);\n            }\n        }\n    }\n    return dp[k, n];\n}`,
        go: `func minDistance(houses []int, k int) int {\n\tn := len(houses)\n\th := make([]int, n)\n\tcopy(h, houses)\n\tsort.Ints(h)\n\tconst INF = 1000000000\n\tcost := make([][]int, n)\n\tfor i := range cost {\n\t\tcost[i] = make([]int, n)\n\t}\n\tfor i := 0; i < n; i++ {\n\t\tfor j := i; j < n; j++ {\n\t\t\tmid := h[(i+j)/2]\n\t\t\ttotal := 0\n\t\t\tfor t := i; t <= j; t++ {\n\t\t\t\tif h[t] > mid {\n\t\t\t\t\ttotal += h[t] - mid\n\t\t\t\t} else {\n\t\t\t\t\ttotal += mid - h[t]\n\t\t\t\t}\n\t\t\t}\n\t\t\tcost[i][j] = total\n\t\t}\n\t}\n\tdp := make([][]int, k+1)\n\tfor g := range dp {\n\t\tdp[g] = make([]int, n+1)\n\t\tfor j := range dp[g] {\n\t\t\tdp[g][j] = INF\n\t\t}\n\t}\n\tdp[0][0] = 0\n\tfor g := 1; g <= k; g++ {\n\t\tfor j := 1; j <= n; j++ {\n\t\t\tfor i := 0; i < j; i++ {\n\t\t\t\tif dp[g-1][i] == INF {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tif cand := dp[g-1][i] + cost[i][j-1]; cand < dp[g][j] {\n\t\t\t\t\tdp[g][j] = cand\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[k][n]\n}`,
        kotlin: `fun minDistance(houses: IntArray, k: Int): Int {\n    val h = houses.sortedArray()\n    val n = h.size\n    val INF = 1000000000\n    val cost = Array(n) { IntArray(n) }\n    for (i in 0 until n) {\n        for (j in i until n) {\n            val mid = h[(i + j) / 2]\n            var total = 0\n            for (t in i..j) total += kotlin.math.abs(h[t] - mid)\n            cost[i][j] = total\n        }\n    }\n    val dp = Array(k + 1) { IntArray(n + 1) { INF } }\n    dp[0][0] = 0\n    for (g in 1..k) {\n        for (j in 1..n) {\n            for (i in 0 until j) {\n                if (dp[g - 1][i] == INF) continue\n                dp[g][j] = minOf(dp[g][j], dp[g - 1][i] + cost[i][j - 1])\n            }\n        }\n    }\n    return dp[k][n]\n}`,
        swift: `func minDistance(_ houses: [Int], _ k: Int) -> Int {\n    let h = houses.sorted()\n    let n = h.count\n    let INF = 1000000000\n    var cost = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n    for i in 0..<n {\n        for j in i..<n {\n            let mid = h[(i + j) / 2]\n            var total = 0\n            for t in i...j { total += abs(h[t] - mid) }\n            cost[i][j] = total\n        }\n    }\n    var dp = [[Int]](repeating: [Int](repeating: INF, count: n + 1), count: k + 1)\n    dp[0][0] = 0\n    for g in 1...k {\n        for j in 1...n {\n            for i in 0..<j {\n                if dp[g - 1][i] == INF { continue }\n                dp[g][j] = min(dp[g][j], dp[g - 1][i] + cost[i][j - 1])\n            }\n        }\n    }\n    return dp[k][n]\n}`,
        rust: `fn minDistance(houses: Vec<i32>, k: i32) -> i32 {\n    let mut h = houses.clone();\n    h.sort();\n    let n = h.len();\n    let k = k as usize;\n    const INF: i32 = 1000000000;\n    let mut cost = vec![vec![0i32; n]; n];\n    for i in 0..n {\n        for j in i..n {\n            let mid = h[(i + j) / 2];\n            let mut total = 0;\n            for t in i..=j {\n                total += (h[t] - mid).abs();\n            }\n            cost[i][j] = total;\n        }\n    }\n    let mut dp = vec![vec![INF; n + 1]; k + 1];\n    dp[0][0] = 0;\n    for g in 1..=k {\n        for j in 1..=n {\n            for i in 0..j {\n                if dp[g - 1][i] == INF {\n                    continue;\n                }\n                let cand = dp[g - 1][i] + cost[i][j - 1];\n                if cand < dp[g][j] {\n                    dp[g][j] = cand;\n                }\n            }\n        }\n    }\n    dp[k][n]\n}`,
        php: `function minDistance($houses, $k) {\n    $h = $houses;\n    sort($h);\n    $n = count($h);\n    $INF = 1000000000;\n    $cost = [];\n    for ($i = 0; $i < $n; $i++) $cost[$i] = array_fill(0, $n, 0);\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = $i; $j < $n; $j++) {\n            $mid = $h[intdiv($i + $j, 2)];\n            $total = 0;\n            for ($t = $i; $t <= $j; $t++) $total += abs($h[$t] - $mid);\n            $cost[$i][$j] = $total;\n        }\n    }\n    $dp = [];\n    for ($g = 0; $g <= $k; $g++) $dp[$g] = array_fill(0, $n + 1, $INF);\n    $dp[0][0] = 0;\n    for ($g = 1; $g <= $k; $g++) {\n        for ($j = 1; $j <= $n; $j++) {\n            for ($i = 0; $i < $j; $i++) {\n                if ($dp[$g - 1][$i] === $INF) continue;\n                $cand = $dp[$g - 1][$i] + $cost[$i][$j - 1];\n                if ($cand < $dp[$g][$j]) $dp[$g][$j] = $cand;\n            }\n        }\n    }\n    return $dp[$k][$n];\n}`,
        ruby: `def minDistance(houses, k)\n  h = houses.sort\n  n = h.length\n  inf = 1000000000\n  cost = Array.new(n) { Array.new(n, 0) }\n  (0...n).each do |i|\n    (i...n).each do |j|\n      mid = h[(i + j) / 2]\n      cost[i][j] = (i..j).sum { |t| (h[t] - mid).abs }\n    end\n  end\n  dp = Array.new(k + 1) { Array.new(n + 1, inf) }\n  dp[0][0] = 0\n  (1..k).each do |g|\n    (1..n).each do |j|\n      (0...j).each do |i|\n        next if dp[g - 1][i] == inf\n        cand = dp[g - 1][i] + cost[i][j - 1]\n        dp[g][j] = cand if cand < dp[g][j]\n      end\n    end\n  end\n  dp[k][n]\nend`,
      },
    };
  })(),

  // ── Stone Game VIII (LC 1872) ───────────────────────────────────
  (() => {
    const ref = (stones: number[]) => {
      const n = stones.length;
      const pre = new Array(n).fill(0);
      pre[0] = stones[0];
      for (let i = 1; i < n; i++) pre[i] = pre[i - 1] + stones[i];
      let best = pre[n - 1];
      for (let i = n - 2; i >= 1; i--) {
        const take = pre[i] - best;
        if (take > best) best = take;
      }
      return best;
    };
    return {
      slug: "stone-game-viii",
      title: "Stone Game VIII",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Prefix Sum", "Game Theory", "Google", "Amazon", "Meta"],
      signature: { funcName: "stoneGameVIII", params: [{ name: "stones", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Alice and Bob take turns, Alice first. While more than one stone remains, the player to move chooses an integer `x > 1`, removes the **first `x`** stones, scores their sum, and puts a **new stone of that value** at the front of the row.\n\nAlice maximises the difference between her score and Bob's; Bob minimises it. Return that difference with both playing optimally.",
        [
          { in: "stones = [-1,2,-3,4,-5]", out: "5", note: "Alice takes the first four, scoring 2; the row becomes `[2,-5]` and Bob must take both, scoring −3." },
          { in: "stones = [7,-6,5,10,5,-2,-6]", out: "13" },
          { in: "stones = [-10,-12]", out: "-22", note: "Alice has no choice but to take both stones." },
        ],
        ["n == stones.length", "2 <= n <= 10^5", "-10^4 <= stones[i] <= 10^4"]),
      hints: [
        "After any move the row is always \"a merged stone followed by an untouched suffix\", and the merged stone's value is a **prefix sum** of the original array.",
        "So the whole game is: the mover picks a prefix-sum index `i >= 1`, scores `pre[i]`, and the opponent then plays from index `i+1` onwards.",
        "Sweep `i` from the end: the best for the mover is `max(best_from_i+1, pre[i] - best_from_i+1)`.",
      ],
      editorial: explain({
        idea: "Every position is described by a single index: the merged stone is always `pre[i]` for some prefix `i`, and the untouched stones are `i+1..n-1`. A move from state `i` scores `pre[j]` for some `j > i` and hands the opponent state `j`. Sweeping from the right, `best[i] = max(best[i+1], pre[i] - best[i+1])`.",
        steps: [
          "Build prefix sums `pre`.",
          "Initialise `best = pre[n-1]` — the last possible move takes everything.",
          "Sweep `i` from `n-2` down to 1, setting `best = max(best, pre[i] - best)`.",
          "Return `best`, the value of Alice's first move.",
        ],
        why: "The collapse to one index is the entire trick. It looks like a game over arbitrary configurations, but merging means the left part is only ever a single number — its prefix sum — so the state is just \"how far in\". The recurrence then reads as \"either skip this prefix and keep the opponent's best, or take it and subtract what the opponent can force\", and sweeping right-to-left makes it O(n). The sweep starts at `i = 1` because the first move must take at least two stones.",
        time: "O(n)",
        space: "O(n), or O(1) folding the prefix sum into the sweep",
        pitfalls: [
          "`x > 1`, so the first legal prefix is index 1, not 0.",
          "The base case is `pre[n-1]` — taking every remaining stone is always available.",
          "The sweep must go right to left; left to right has no correct reading.",
        ],
      }),
      examples: [
        { input: "[-1,2,-3,4,-5]", expectedOutput: "5" },
        { input: "[7,-6,5,10,5,-2,-6]", expectedOutput: "13" },
        { input: "[-10,-12]", expectedOutput: "-22" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 14);
        const stones = Array.from({ length: n }, () => ri(rng, -20, 20));
        return { input: fmtIntArr(stones), expectedOutput: String(ref(stones)) };
      },
      solutions: {
        python: `from typing import List\n\ndef stoneGameVIII(stones: List[int]) -> int:\n    n = len(stones)\n    pre = [0] * n\n    pre[0] = stones[0]\n    for i in range(1, n):\n        pre[i] = pre[i - 1] + stones[i]\n    best = pre[n - 1]\n    for i in range(n - 2, 0, -1):\n        best = max(best, pre[i] - best)\n    return best`,
        javascript: `var stoneGameVIII = function(stones) {\n    var n = stones.length;\n    var pre = [];\n    for (var t = 0; t < n; t++) pre.push(0);\n    pre[0] = stones[0];\n    for (var i = 1; i < n; i++) pre[i] = pre[i - 1] + stones[i];\n    var best = pre[n - 1];\n    for (i = n - 2; i >= 1; i--) {\n        var take = pre[i] - best;\n        if (take > best) best = take;\n    }\n    return best;\n};`,
        typescript: `function stoneGameVIII(stones: number[]): number {\n    var n = stones.length;\n    var pre: number[] = [];\n    for (var t = 0; t < n; t++) pre.push(0);\n    pre[0] = stones[0];\n    for (var i = 1; i < n; i++) pre[i] = pre[i - 1] + stones[i];\n    var best = pre[n - 1];\n    for (i = n - 2; i >= 1; i--) {\n        var take = pre[i] - best;\n        if (take > best) best = take;\n    }\n    return best;\n}`,
        java: `public static int stoneGameVIII(int[] stones) {\n    int n = stones.length;\n    int[] pre = new int[n];\n    pre[0] = stones[0];\n    for (int i = 1; i < n; i++) pre[i] = pre[i - 1] + stones[i];\n    int best = pre[n - 1];\n    for (int i = n - 2; i >= 1; i--) best = Math.max(best, pre[i] - best);\n    return best;\n}`,
        cpp: `int stoneGameVIII(vector<int>& stones) {\n    int n = (int) stones.size();\n    vector<int> pre(n, 0);\n    pre[0] = stones[0];\n    for (int i = 1; i < n; i++) pre[i] = pre[i - 1] + stones[i];\n    int best = pre[n - 1];\n    for (int i = n - 2; i >= 1; i--) best = max(best, pre[i] - best);\n    return best;\n}`,
        c: `int stoneGameVIII(int* stones, int stonesSize) {\n    int n = stonesSize;\n    int* pre = (int*) malloc((size_t) n * sizeof(int));\n    pre[0] = stones[0];\n    for (int i = 1; i < n; i++) pre[i] = pre[i - 1] + stones[i];\n    int best = pre[n - 1];\n    for (int i = n - 2; i >= 1; i--) {\n        int take = pre[i] - best;\n        if (take > best) best = take;\n    }\n    free(pre);\n    return best;\n}`,
        csharp: `public static int StoneGameVIII(int[] stones)\n{\n    int n = stones.Length;\n    var pre = new int[n];\n    pre[0] = stones[0];\n    for (int i = 1; i < n; i++) pre[i] = pre[i - 1] + stones[i];\n    int best = pre[n - 1];\n    for (int i = n - 2; i >= 1; i--) best = Math.Max(best, pre[i] - best);\n    return best;\n}`,
        go: `func stoneGameVIII(stones []int) int {\n\tn := len(stones)\n\tpre := make([]int, n)\n\tpre[0] = stones[0]\n\tfor i := 1; i < n; i++ {\n\t\tpre[i] = pre[i-1] + stones[i]\n\t}\n\tbest := pre[n-1]\n\tfor i := n - 2; i >= 1; i-- {\n\t\tif take := pre[i] - best; take > best {\n\t\t\tbest = take\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun stoneGameVIII(stones: IntArray): Int {\n    val n = stones.size\n    val pre = IntArray(n)\n    pre[0] = stones[0]\n    for (i in 1 until n) pre[i] = pre[i - 1] + stones[i]\n    var best = pre[n - 1]\n    for (i in n - 2 downTo 1) best = maxOf(best, pre[i] - best)\n    return best\n}`,
        swift: `func stoneGameVIII(_ stones: [Int]) -> Int {\n    let n = stones.count\n    var pre = [Int](repeating: 0, count: n)\n    pre[0] = stones[0]\n    for i in 1..<n { pre[i] = pre[i - 1] + stones[i] }\n    var best = pre[n - 1]\n    var i = n - 2\n    while i >= 1 {\n        best = max(best, pre[i] - best)\n        i -= 1\n    }\n    return best\n}`,
        rust: `fn stoneGameVIII(stones: Vec<i32>) -> i32 {\n    let n = stones.len();\n    let mut pre = vec![0i32; n];\n    pre[0] = stones[0];\n    for i in 1..n {\n        pre[i] = pre[i - 1] + stones[i];\n    }\n    let mut best = pre[n - 1];\n    for i in (1..n - 1).rev() {\n        best = best.max(pre[i] - best);\n    }\n    best\n}`,
        php: `function stoneGameVIII($stones) {\n    $n = count($stones);\n    $pre = array_fill(0, $n, 0);\n    $pre[0] = $stones[0];\n    for ($i = 1; $i < $n; $i++) $pre[$i] = $pre[$i - 1] + $stones[$i];\n    $best = $pre[$n - 1];\n    for ($i = $n - 2; $i >= 1; $i--) {\n        $take = $pre[$i] - $best;\n        if ($take > $best) $best = $take;\n    }\n    return $best;\n}`,
        ruby: `def stoneGameVIII(stones)\n  n = stones.length\n  pre = Array.new(n, 0)\n  pre[0] = stones[0]\n  (1...n).each { |i| pre[i] = pre[i - 1] + stones[i] }\n  best = pre[n - 1]\n  (n - 2).downto(1) do |i|\n    take = pre[i] - best\n    best = take if take > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Build Array With Exactly K Comparisons (LC 1420) ────────────
  (() => {
    const ref = (n: number, m: number, k: number) => {
      if (k === 0) return 0;
      // dp[j][c] = arrays built so far whose maximum is j and whose cost is c.
      const dp: number[][] = [];
      for (let j = 0; j <= m; j++) dp.push(new Array(k + 1).fill(0));
      for (let j = 1; j <= m; j++) dp[j][1] = 1;
      for (let len = 2; len <= n; len++) {
        const next: number[][] = [];
        for (let j = 0; j <= m; j++) next.push(new Array(k + 1).fill(0));
        for (let j = 1; j <= m; j++) {
          for (let c = 1; c <= k; c++) {
            const ways = dp[j][c];
            if (ways === 0) continue;
            // Append anything at or below the running maximum: cost unchanged.
            next[j][c] = (next[j][c] + ways * j) % MOD5;
            // Append a new maximum: cost goes up by one.
            if (c + 1 <= k) {
              for (let v = j + 1; v <= m; v++) next[v][c + 1] = (next[v][c + 1] + ways) % MOD5;
            }
          }
        }
        for (let j = 0; j <= m; j++) for (let c = 0; c <= k; c++) dp[j][c] = next[j][c];
      }
      let answer = 0;
      for (let j = 1; j <= m; j++) answer = (answer + dp[j][k]) % MOD5;
      return answer;
    };
    return {
      slug: "build-array-where-you-can-find-the-maximum-exactly-k-comparisons",
      title: "Build Array Where You Can Find The Maximum Exactly K Comparisons",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Prefix Sum", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "numOfArrays", params: [{ name: "n", type: "int" as const }, { name: "m", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Consider this way of finding a maximum:\n\n```\nmaximum = -1; cost = 0\nfor each value in arr:\n    if value > maximum:\n        maximum = value\n        cost = cost + 1\n```\n\nCount the arrays of length `n` whose values lie in `[1, m]` and for which this procedure ends with `cost` exactly `k`. Return the count **modulo 10⁹ + 7**.",
        [
          { in: "n = 2, m = 3, k = 1", out: "6", note: "The first element must already be the maximum, so the second is any value at most the first." },
          { in: "n = 5, m = 2, k = 3", out: "0", note: "With only two distinct values the cost can never reach 3." },
          { in: "n = 9, m = 1, k = 1", out: "1", note: "Only the all-ones array." },
        ],
        ["1 <= n <= 50", "1 <= m <= 100", "0 <= k <= n"]),
      hints: [
        "The state that matters is the length so far, the running **maximum**, and the cost so far.",
        "Appending a value at or below the maximum costs nothing and has `j` choices, where `j` is the maximum.",
        "Appending a value above the maximum raises the cost by one and sets a new maximum.",
      ],
      editorial: explain({
        idea: "`dp[j][c]` counts the arrays built so far whose running maximum is `j` and whose cost is `c`. Extending by one element either keeps the maximum — `j` choices, cost unchanged — or introduces a new maximum `v > j`, which costs one more.",
        steps: [
          "Answer 0 immediately when `k = 0`: a non-empty array always costs at least 1.",
          "Seed `dp[j][1] = 1` for every `j` from 1 to `m` — the first element is always a new maximum.",
          "For each further length, fold `dp[j][c] · j` into `next[j][c]` and `dp[j][c]` into `next[v][c+1]` for every `v > j`.",
          "Sum `dp[j][k]` over `j`.",
        ],
        why: "Tracking the maximum rather than the elements is what makes the count finite and small: everything below the maximum is interchangeable, so \"any of `j` values\" collapses a whole branch into a multiplication. The inner loop over `v > j` is what a prefix-sum optimisation removes, taking the solution from O(n · m² · k) to O(n · m · k) — at these bounds either is comfortable, but the prefix-sum form is what the problem is really testing.",
        time: "O(n · m² · k), or O(n · m · k) with suffix sums",
        space: "O(m · k)",
        pitfalls: [
          "`k = 0` is impossible for `n >= 1` — the first element always triggers an update.",
          "The multiplier is `j`, the maximum's **value**, not the number of elements so far.",
          "Costs above `k` must be discarded, not clamped.",
        ],
      }),
      examples: [
        { input: "2\n3\n1", expectedOutput: "6" },
        { input: "5\n2\n3", expectedOutput: "0" },
        { input: "9\n1\n1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const m = ri(rng, 1, 12);
        const k = ri(rng, 0, n);
        return { input: `${n}\n${m}\n${k}`, expectedOutput: String(ref(n, m, k)) };
      },
      solutions: {
        python: `def numOfArrays(n: int, m: int, k: int) -> int:\n    MOD = 10**9 + 7\n    if k == 0:\n        return 0\n    dp = [[0] * (k + 1) for _ in range(m + 1)]\n    for j in range(1, m + 1):\n        dp[j][1] = 1\n    for _ in range(2, n + 1):\n        nxt = [[0] * (k + 1) for _ in range(m + 1)]\n        for j in range(1, m + 1):\n            for c in range(1, k + 1):\n                ways = dp[j][c]\n                if ways == 0:\n                    continue\n                nxt[j][c] = (nxt[j][c] + ways * j) % MOD\n                if c + 1 <= k:\n                    for v in range(j + 1, m + 1):\n                        nxt[v][c + 1] = (nxt[v][c + 1] + ways) % MOD\n        dp = nxt\n    return sum(dp[j][k] for j in range(1, m + 1)) % MOD`,
        javascript: `var numOfArrays = function(n, m, k) {\n    var MOD = 1000000007;\n    if (k === 0) return 0;\n    var j, c, v;\n    var make = function() {\n        var t = [];\n        for (var a = 0; a <= m; a++) {\n            var row = [];\n            for (var b = 0; b <= k; b++) row.push(0);\n            t.push(row);\n        }\n        return t;\n    };\n    var dp = make();\n    for (j = 1; j <= m; j++) dp[j][1] = 1;\n    for (var len = 2; len <= n; len++) {\n        var next = make();\n        for (j = 1; j <= m; j++) {\n            for (c = 1; c <= k; c++) {\n                var ways = dp[j][c];\n                if (ways === 0) continue;\n                next[j][c] = (next[j][c] + ways * j) % MOD;\n                if (c + 1 <= k) {\n                    for (v = j + 1; v <= m; v++) next[v][c + 1] = (next[v][c + 1] + ways) % MOD;\n                }\n            }\n        }\n        dp = next;\n    }\n    var answer = 0;\n    for (j = 1; j <= m; j++) answer = (answer + dp[j][k]) % MOD;\n    return answer;\n};`,
        typescript: `function numOfArrays(n: number, m: number, k: number): number {\n    var MOD = 1000000007;\n    if (k === 0) return 0;\n    var j: number, c: number, v: number;\n    var make = function(): number[][] {\n        var t: number[][] = [];\n        for (var a = 0; a <= m; a++) {\n            var row: number[] = [];\n            for (var b = 0; b <= k; b++) row.push(0);\n            t.push(row);\n        }\n        return t;\n    };\n    var dp = make();\n    for (j = 1; j <= m; j++) dp[j][1] = 1;\n    for (var len = 2; len <= n; len++) {\n        var next = make();\n        for (j = 1; j <= m; j++) {\n            for (c = 1; c <= k; c++) {\n                var ways = dp[j][c];\n                if (ways === 0) continue;\n                next[j][c] = (next[j][c] + ways * j) % MOD;\n                if (c + 1 <= k) {\n                    for (v = j + 1; v <= m; v++) next[v][c + 1] = (next[v][c + 1] + ways) % MOD;\n                }\n            }\n        }\n        dp = next;\n    }\n    var answer = 0;\n    for (j = 1; j <= m; j++) answer = (answer + dp[j][k]) % MOD;\n    return answer;\n}`,
        java: `public static int numOfArrays(int n, int m, int k) {\n    final long MOD = 1000000007L;\n    if (k == 0) return 0;\n    long[][] dp = new long[m + 1][k + 1];\n    for (int j = 1; j <= m; j++) dp[j][1] = 1;\n    for (int len = 2; len <= n; len++) {\n        long[][] next = new long[m + 1][k + 1];\n        for (int j = 1; j <= m; j++) {\n            for (int c = 1; c <= k; c++) {\n                long ways = dp[j][c];\n                if (ways == 0) continue;\n                next[j][c] = (next[j][c] + ways * j) % MOD;\n                if (c + 1 <= k) {\n                    for (int v = j + 1; v <= m; v++) next[v][c + 1] = (next[v][c + 1] + ways) % MOD;\n                }\n            }\n        }\n        dp = next;\n    }\n    long answer = 0;\n    for (int j = 1; j <= m; j++) answer = (answer + dp[j][k]) % MOD;\n    return (int) answer;\n}`,
        cpp: `int numOfArrays(int n, int m, int k) {\n    const long long MOD = 1000000007LL;\n    if (k == 0) return 0;\n    vector<vector<long long>> dp(m + 1, vector<long long>(k + 1, 0));\n    for (int j = 1; j <= m; j++) dp[j][1] = 1;\n    for (int len = 2; len <= n; len++) {\n        vector<vector<long long>> next(m + 1, vector<long long>(k + 1, 0));\n        for (int j = 1; j <= m; j++) {\n            for (int c = 1; c <= k; c++) {\n                long long ways = dp[j][c];\n                if (ways == 0) continue;\n                next[j][c] = (next[j][c] + ways * j) % MOD;\n                if (c + 1 <= k) {\n                    for (int v = j + 1; v <= m; v++) next[v][c + 1] = (next[v][c + 1] + ways) % MOD;\n                }\n            }\n        }\n        dp = next;\n    }\n    long long answer = 0;\n    for (int j = 1; j <= m; j++) answer = (answer + dp[j][k]) % MOD;\n    return (int) answer;\n}`,
        c: `int numOfArrays(int n, int m, int k) {\n    const long long MOD = 1000000007LL;\n    if (k == 0) return 0;\n    int width = k + 1;\n    size_t cells = (size_t) (m + 1) * (size_t) width;\n    long long* dp = (long long*) calloc(cells, sizeof(long long));\n    long long* next = (long long*) calloc(cells, sizeof(long long));\n    for (int j = 1; j <= m; j++) dp[j * width + 1] = 1;\n    for (int len = 2; len <= n; len++) {\n        for (size_t i = 0; i < cells; i++) next[i] = 0;\n        for (int j = 1; j <= m; j++) {\n            for (int c = 1; c <= k; c++) {\n                long long ways = dp[j * width + c];\n                if (ways == 0) continue;\n                next[j * width + c] = (next[j * width + c] + ways * j) % MOD;\n                if (c + 1 <= k) {\n                    for (int v = j + 1; v <= m; v++) {\n                        next[v * width + (c + 1)] = (next[v * width + (c + 1)] + ways) % MOD;\n                    }\n                }\n            }\n        }\n        for (size_t i = 0; i < cells; i++) dp[i] = next[i];\n    }\n    long long answer = 0;\n    for (int j = 1; j <= m; j++) answer = (answer + dp[j * width + k]) % MOD;\n    free(dp);\n    free(next);\n    return (int) answer;\n}`,
        csharp: `public static int NumOfArrays(int n, int m, int k)\n{\n    const long MOD = 1000000007L;\n    if (k == 0) return 0;\n    var dp = new long[m + 1, k + 1];\n    for (int j = 1; j <= m; j++) dp[j, 1] = 1;\n    for (int len = 2; len <= n; len++)\n    {\n        var next = new long[m + 1, k + 1];\n        for (int j = 1; j <= m; j++)\n        {\n            for (int c = 1; c <= k; c++)\n            {\n                long ways = dp[j, c];\n                if (ways == 0) continue;\n                next[j, c] = (next[j, c] + ways * j) % MOD;\n                if (c + 1 <= k)\n                {\n                    for (int v = j + 1; v <= m; v++) next[v, c + 1] = (next[v, c + 1] + ways) % MOD;\n                }\n            }\n        }\n        dp = next;\n    }\n    long answer = 0;\n    for (int j = 1; j <= m; j++) answer = (answer + dp[j, k]) % MOD;\n    return (int) answer;\n}`,
        go: `func numOfArrays(n int, m int, k int) int {\n\tconst MOD = 1000000007\n\tif k == 0 {\n\t\treturn 0\n\t}\n\tmake2 := func() [][]int {\n\t\tt := make([][]int, m+1)\n\t\tfor i := range t {\n\t\t\tt[i] = make([]int, k+1)\n\t\t}\n\t\treturn t\n\t}\n\tdp := make2()\n\tfor j := 1; j <= m; j++ {\n\t\tdp[j][1] = 1\n\t}\n\tfor length := 2; length <= n; length++ {\n\t\tnext := make2()\n\t\tfor j := 1; j <= m; j++ {\n\t\t\tfor c := 1; c <= k; c++ {\n\t\t\t\tways := dp[j][c]\n\t\t\t\tif ways == 0 {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tnext[j][c] = (next[j][c] + ways*j) % MOD\n\t\t\t\tif c+1 <= k {\n\t\t\t\t\tfor v := j + 1; v <= m; v++ {\n\t\t\t\t\t\tnext[v][c+1] = (next[v][c+1] + ways) % MOD\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tdp = next\n\t}\n\tanswer := 0\n\tfor j := 1; j <= m; j++ {\n\t\tanswer = (answer + dp[j][k]) % MOD\n\t}\n\treturn answer\n}`,
        kotlin: `fun numOfArrays(n: Int, m: Int, k: Int): Int {\n    val mod = 1000000007L\n    if (k == 0) return 0\n    var dp = Array(m + 1) { LongArray(k + 1) }\n    for (j in 1..m) dp[j][1] = 1\n    for (len in 2..n) {\n        val next = Array(m + 1) { LongArray(k + 1) }\n        for (j in 1..m) {\n            for (c in 1..k) {\n                val ways = dp[j][c]\n                if (ways == 0L) continue\n                next[j][c] = (next[j][c] + ways * j) % mod\n                if (c + 1 <= k) {\n                    for (v in j + 1..m) next[v][c + 1] = (next[v][c + 1] + ways) % mod\n                }\n            }\n        }\n        dp = next\n    }\n    var answer = 0L\n    for (j in 1..m) answer = (answer + dp[j][k]) % mod\n    return answer.toInt()\n}`,
        swift: `func numOfArrays(_ n: Int, _ m: Int, _ k: Int) -> Int {\n    let mod = 1000000007\n    if k == 0 { return 0 }\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: k + 1), count: m + 1)\n    for j in 1...m { dp[j][1] = 1 }\n    if n >= 2 {\n        for _ in 2...n {\n            var next = [[Int]](repeating: [Int](repeating: 0, count: k + 1), count: m + 1)\n            for j in 1...m {\n                for c in 1...k {\n                    let ways = dp[j][c]\n                    if ways == 0 { continue }\n                    next[j][c] = (next[j][c] + ways * j) % mod\n                    if c + 1 <= k && j + 1 <= m {\n                        for v in (j + 1)...m { next[v][c + 1] = (next[v][c + 1] + ways) % mod }\n                    }\n                }\n            }\n            dp = next\n        }\n    }\n    var answer = 0\n    for j in 1...m { answer = (answer + dp[j][k]) % mod }\n    return answer\n}`,
        rust: `fn numOfArrays(n: i32, m: i32, k: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    if k == 0 {\n        return 0;\n    }\n    let m = m as usize;\n    let k = k as usize;\n    let mut dp = vec![vec![0i64; k + 1]; m + 1];\n    for j in 1..=m {\n        dp[j][1] = 1;\n    }\n    for _ in 2..=n {\n        let mut next = vec![vec![0i64; k + 1]; m + 1];\n        for j in 1..=m {\n            for c in 1..=k {\n                let ways = dp[j][c];\n                if ways == 0 {\n                    continue;\n                }\n                next[j][c] = (next[j][c] + ways * j as i64) % MOD;\n                if c + 1 <= k {\n                    for v in (j + 1)..=m {\n                        next[v][c + 1] = (next[v][c + 1] + ways) % MOD;\n                    }\n                }\n            }\n        }\n        dp = next;\n    }\n    let mut answer: i64 = 0;\n    for j in 1..=m {\n        answer = (answer + dp[j][k]) % MOD;\n    }\n    answer as i32\n}`,
        php: `function numOfArrays($n, $m, $k) {\n    $MOD = 1000000007;\n    if ($k === 0) return 0;\n    $dp = [];\n    for ($j = 0; $j <= $m; $j++) $dp[$j] = array_fill(0, $k + 1, 0);\n    for ($j = 1; $j <= $m; $j++) $dp[$j][1] = 1;\n    for ($len = 2; $len <= $n; $len++) {\n        $next = [];\n        for ($j = 0; $j <= $m; $j++) $next[$j] = array_fill(0, $k + 1, 0);\n        for ($j = 1; $j <= $m; $j++) {\n            for ($c = 1; $c <= $k; $c++) {\n                $ways = $dp[$j][$c];\n                if ($ways === 0) continue;\n                $next[$j][$c] = ($next[$j][$c] + $ways * $j) % $MOD;\n                if ($c + 1 <= $k) {\n                    for ($v = $j + 1; $v <= $m; $v++) $next[$v][$c + 1] = ($next[$v][$c + 1] + $ways) % $MOD;\n                }\n            }\n        }\n        $dp = $next;\n    }\n    $answer = 0;\n    for ($j = 1; $j <= $m; $j++) $answer = ($answer + $dp[$j][$k]) % $MOD;\n    return $answer;\n}`,
        ruby: `def numOfArrays(n, m, k)\n  mod = 1000000007\n  return 0 if k == 0\n  dp = Array.new(m + 1) { Array.new(k + 1, 0) }\n  (1..m).each { |j| dp[j][1] = 1 }\n  (2..n).each do\n    nxt = Array.new(m + 1) { Array.new(k + 1, 0) }\n    (1..m).each do |j|\n      (1..k).each do |c|\n        ways = dp[j][c]\n        next if ways == 0\n        nxt[j][c] = (nxt[j][c] + ways * j) % mod\n        next unless c + 1 <= k\n        ((j + 1)..m).each { |v| nxt[v][c + 1] = (nxt[v][c + 1] + ways) % mod }\n      end\n    end\n    dp = nxt\n  end\n  (1..m).sum { |j| dp[j][k] } % mod\nend`,
      },
    };
  })(),

  // ── Form Largest Integer With Digits That Add up to Target ──────
  (() => {
    const ref = (cost: number[], target: number) => {
      const NEG = -1000000;
      const dp = new Array(target + 1).fill(NEG);
      dp[0] = 0;
      for (let t = 1; t <= target; t++) {
        for (let d = 1; d <= 9; d++) {
          const c = cost[d - 1];
          if (t >= c && dp[t - c] >= 0 && dp[t - c] + 1 > dp[t]) dp[t] = dp[t - c] + 1;
        }
      }
      if (dp[target] < 0) return "0";
      let out = "", t = target;
      while (t > 0) {
        for (let d = 9; d >= 1; d--) {
          const c = cost[d - 1];
          if (t >= c && dp[t - c] === dp[t] - 1) {
            out += String(d);
            t -= c;
            break;
          }
        }
      }
      return out;
    };
    return {
      slug: "form-largest-integer-with-digits-that-add-up-to-target",
      title: "Form Largest Integer With Digits That Add up to Target",
      difficulty: "HARD" as const,
      tags: ["Array", "String", "Dynamic Programming", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "largestNumber", params: [{ name: "cost", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "string" as const },
      description: describe(
        "Painting digit `d` (from 1 to 9) costs `cost[d - 1]`. Build the **largest integer** whose digits' total painting cost is **exactly** `target`.\n\nThe result may not contain the digit 0. Return it as a string, or `\"0\"` if no integer can be formed.",
        [
          { in: "cost = [4,3,2,5,6,7,2,5,5], target = 9", out: "7772", note: "Costs 2 + 2 + 2 + 3 = 9; four digits beat any three-digit number." },
          { in: "cost = [7,6,5,5,5,6,8,7,8], target = 12", out: "85", note: "Two digits are the most affordable, and `85` is the largest such pair." },
          { in: "cost = [2,4,6,2,4,6,4,4,4], target = 5", out: "0", note: "Every cost is even, so an odd target is unreachable." },
        ],
        ["cost.length == 9", "1 <= cost[i], target <= 5000"]),
      hints: [
        "More digits always beats fewer, because every digit is at least 1 — so first maximise the **length**.",
        "`dp[t]` = the most digits obtainable for exactly cost `t`; that is an unbounded knapsack.",
        "Then build the answer greedily from digit 9 downwards, spending only where the length stays optimal.",
      ],
      editorial: explain({
        idea: "Two phases. First an unbounded knapsack: `dp[t]` is the maximum number of digits costing exactly `t`, with `dp[0] = 0` and everything else unreachable until proven otherwise. Then reconstruct greedily — at each step take the largest digit `d` for which `dp[t - cost[d-1]] == dp[t] - 1`, which keeps the length maximal while making each position as large as possible.",
        steps: [
          "Fill `dp[t] = max over d of dp[t - cost[d-1]] + 1`, skipping unreachable predecessors.",
          "If `dp[target]` is unreachable, return `\"0\"`.",
          "Set `t = target` and repeatedly append the largest `d` whose predecessor state has exactly one fewer digit, subtracting its cost.",
        ],
        why: "Length dominates value because no leading zeros are possible — a 4-digit number always beats a 3-digit one whatever the digits. Once the length is fixed, the greedy is safe precisely because the `dp[t - c] == dp[t] - 1` test guarantees the remaining budget still admits the full remaining length, so taking the biggest digit now costs nothing later.",
        time: "O(9 · target)",
        space: "O(target)",
        pitfalls: [
          "Maximising the digit **sum** or the value directly both give wrong answers; length comes first.",
          "The cost must be spent exactly, not merely not exceeded.",
          "An unreachable target returns the string `\"0\"`, not an empty string.",
        ],
      }),
      examples: [
        { input: "[4,3,2,5,6,7,2,5,5]\n9", expectedOutput: "7772" },
        { input: "[7,6,5,5,5,6,8,7,8]\n12", expectedOutput: "85" },
        { input: "[2,4,6,2,4,6,4,4,4]\n5", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const cost = Array.from({ length: 9 }, () => ri(rng, 1, 12));
        const target = ri(rng, 1, 45);
        return { input: `${fmtIntArr(cost)}\n${target}`, expectedOutput: ref(cost, target) };
      },
      solutions: {
        python: `from typing import List\n\ndef largestNumber(cost: List[int], target: int) -> str:\n    NEG = -10**6\n    dp = [NEG] * (target + 1)\n    dp[0] = 0\n    for t in range(1, target + 1):\n        for d in range(1, 10):\n            c = cost[d - 1]\n            if t >= c and dp[t - c] >= 0:\n                dp[t] = max(dp[t], dp[t - c] + 1)\n    if dp[target] < 0:\n        return "0"\n    out = []\n    t = target\n    while t > 0:\n        for d in range(9, 0, -1):\n            c = cost[d - 1]\n            if t >= c and dp[t - c] == dp[t] - 1:\n                out.append(str(d))\n                t -= c\n                break\n    return "".join(out)`,
        javascript: `var largestNumber = function(cost, target) {\n    var NEG = -1000000, t, d;\n    var dp = [];\n    for (t = 0; t <= target; t++) dp.push(NEG);\n    dp[0] = 0;\n    for (t = 1; t <= target; t++) {\n        for (d = 1; d <= 9; d++) {\n            var c = cost[d - 1];\n            if (t >= c && dp[t - c] >= 0 && dp[t - c] + 1 > dp[t]) dp[t] = dp[t - c] + 1;\n        }\n    }\n    if (dp[target] < 0) return "0";\n    var out = "";\n    t = target;\n    while (t > 0) {\n        for (d = 9; d >= 1; d--) {\n            var cc = cost[d - 1];\n            if (t >= cc && dp[t - cc] === dp[t] - 1) {\n                out += String(d);\n                t -= cc;\n                break;\n            }\n        }\n    }\n    return out;\n};`,
        typescript: `function largestNumber(cost: number[], target: number): string {\n    var NEG = -1000000, t: number, d: number;\n    var dp: number[] = [];\n    for (t = 0; t <= target; t++) dp.push(NEG);\n    dp[0] = 0;\n    for (t = 1; t <= target; t++) {\n        for (d = 1; d <= 9; d++) {\n            var c = cost[d - 1];\n            if (t >= c && dp[t - c] >= 0 && dp[t - c] + 1 > dp[t]) dp[t] = dp[t - c] + 1;\n        }\n    }\n    if (dp[target] < 0) return "0";\n    var out = "";\n    t = target;\n    while (t > 0) {\n        for (d = 9; d >= 1; d--) {\n            var cc = cost[d - 1];\n            if (t >= cc && dp[t - cc] === dp[t] - 1) {\n                out += String(d);\n                t -= cc;\n                break;\n            }\n        }\n    }\n    return out;\n}`,
        java: `public static String largestNumber(int[] cost, int target) {\n    final int NEG = -1000000;\n    int[] dp = new int[target + 1];\n    Arrays.fill(dp, NEG);\n    dp[0] = 0;\n    for (int t = 1; t <= target; t++) {\n        for (int d = 1; d <= 9; d++) {\n            int c = cost[d - 1];\n            if (t >= c && dp[t - c] >= 0) dp[t] = Math.max(dp[t], dp[t - c] + 1);\n        }\n    }\n    if (dp[target] < 0) return "0";\n    StringBuilder sb = new StringBuilder();\n    int t = target;\n    while (t > 0) {\n        for (int d = 9; d >= 1; d--) {\n            int c = cost[d - 1];\n            if (t >= c && dp[t - c] == dp[t] - 1) {\n                sb.append((char) ('0' + d));\n                t -= c;\n                break;\n            }\n        }\n    }\n    return sb.toString();\n}`,
        cpp: `string largestNumber(vector<int>& cost, int target) {\n    const int NEG = -1000000;\n    vector<int> dp(target + 1, NEG);\n    dp[0] = 0;\n    for (int t = 1; t <= target; t++) {\n        for (int d = 1; d <= 9; d++) {\n            int c = cost[d - 1];\n            if (t >= c && dp[t - c] >= 0) dp[t] = max(dp[t], dp[t - c] + 1);\n        }\n    }\n    if (dp[target] < 0) return "0";\n    string out;\n    int t = target;\n    while (t > 0) {\n        for (int d = 9; d >= 1; d--) {\n            int c = cost[d - 1];\n            if (t >= c && dp[t - c] == dp[t] - 1) {\n                out += (char) ('0' + d);\n                t -= c;\n                break;\n            }\n        }\n    }\n    return out;\n}`,
        c: `char* largestNumber(int* cost, int costSize, int target) {\n    (void) costSize;\n    const int NEG = -1000000;\n    int* dp = (int*) malloc((size_t) (target + 1) * sizeof(int));\n    for (int t = 0; t <= target; t++) dp[t] = NEG;\n    dp[0] = 0;\n    for (int t = 1; t <= target; t++) {\n        for (int d = 1; d <= 9; d++) {\n            int c = cost[d - 1];\n            if (t >= c && dp[t - c] >= 0 && dp[t - c] + 1 > dp[t]) dp[t] = dp[t - c] + 1;\n        }\n    }\n    if (dp[target] < 0) {\n        free(dp);\n        char* zero = (char*) malloc(2);\n        zero[0] = '0';\n        zero[1] = '\\0';\n        return zero;\n    }\n    char* out = (char*) malloc((size_t) dp[target] + 1);\n    int len = 0, t = target;\n    while (t > 0) {\n        for (int d = 9; d >= 1; d--) {\n            int c = cost[d - 1];\n            if (t >= c && dp[t - c] == dp[t] - 1) {\n                out[len++] = (char) ('0' + d);\n                t -= c;\n                break;\n            }\n        }\n    }\n    out[len] = '\\0';\n    free(dp);\n    return out;\n}`,
        csharp: `public static string LargestNumber(int[] cost, int target)\n{\n    const int NEG = -1000000;\n    var dp = new int[target + 1];\n    for (int t = 0; t <= target; t++) dp[t] = NEG;\n    dp[0] = 0;\n    for (int t = 1; t <= target; t++)\n    {\n        for (int d = 1; d <= 9; d++)\n        {\n            int c = cost[d - 1];\n            if (t >= c && dp[t - c] >= 0) dp[t] = Math.Max(dp[t], dp[t - c] + 1);\n        }\n    }\n    if (dp[target] < 0) return "0";\n    var sb = new System.Text.StringBuilder();\n    int rem = target;\n    while (rem > 0)\n    {\n        for (int d = 9; d >= 1; d--)\n        {\n            int c = cost[d - 1];\n            if (rem >= c && dp[rem - c] == dp[rem] - 1)\n            {\n                sb.Append((char) ('0' + d));\n                rem -= c;\n                break;\n            }\n        }\n    }\n    return sb.ToString();\n}`,
        go: `func largestNumber(cost []int, target int) string {\n\tconst NEG = -1000000\n\tdp := make([]int, target+1)\n\tfor t := range dp {\n\t\tdp[t] = NEG\n\t}\n\tdp[0] = 0\n\tfor t := 1; t <= target; t++ {\n\t\tfor d := 1; d <= 9; d++ {\n\t\t\tc := cost[d-1]\n\t\t\tif t >= c && dp[t-c] >= 0 && dp[t-c]+1 > dp[t] {\n\t\t\t\tdp[t] = dp[t-c] + 1\n\t\t\t}\n\t\t}\n\t}\n\tif dp[target] < 0 {\n\t\treturn "0"\n\t}\n\tout := make([]byte, 0, dp[target])\n\tt := target\n\tfor t > 0 {\n\t\tfor d := 9; d >= 1; d-- {\n\t\t\tc := cost[d-1]\n\t\t\tif t >= c && dp[t-c] == dp[t]-1 {\n\t\t\t\tout = append(out, byte('0'+d))\n\t\t\t\tt -= c\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t}\n\treturn string(out)\n}`,
        kotlin: `fun largestNumber(cost: IntArray, target: Int): String {\n    val NEG = -1000000\n    val dp = IntArray(target + 1) { NEG }\n    dp[0] = 0\n    for (t in 1..target) {\n        for (d in 1..9) {\n            val c = cost[d - 1]\n            if (t >= c && dp[t - c] >= 0) dp[t] = maxOf(dp[t], dp[t - c] + 1)\n        }\n    }\n    if (dp[target] < 0) return "0"\n    val sb = StringBuilder()\n    var t = target\n    while (t > 0) {\n        for (d in 9 downTo 1) {\n            val c = cost[d - 1]\n            if (t >= c && dp[t - c] == dp[t] - 1) {\n                sb.append(('0' + d))\n                t -= c\n                break\n            }\n        }\n    }\n    return sb.toString()\n}`,
        swift: `func largestNumber(_ cost: [Int], _ target: Int) -> String {\n    let NEG = -1000000\n    var dp = [Int](repeating: NEG, count: target + 1)\n    dp[0] = 0\n    for t in 1...target {\n        for d in 1...9 {\n            let c = cost[d - 1]\n            if t >= c && dp[t - c] >= 0 { dp[t] = max(dp[t], dp[t - c] + 1) }\n        }\n    }\n    if dp[target] < 0 { return "0" }\n    var out = ""\n    var t = target\n    let digits = Array("0123456789")\n    while t > 0 {\n        var d = 9\n        while d >= 1 {\n            let c = cost[d - 1]\n            if t >= c && dp[t - c] == dp[t] - 1 {\n                out.append(digits[d])\n                t -= c\n                break\n            }\n            d -= 1\n        }\n    }\n    return out\n}`,
        rust: `fn largestNumber(cost: Vec<i32>, target: i32) -> String {\n    const NEG: i32 = -1000000;\n    let target = target as usize;\n    let mut dp = vec![NEG; target + 1];\n    dp[0] = 0;\n    for t in 1..=target {\n        for d in 1..=9usize {\n            let c = cost[d - 1] as usize;\n            if t >= c && dp[t - c] >= 0 && dp[t - c] + 1 > dp[t] {\n                dp[t] = dp[t - c] + 1;\n            }\n        }\n    }\n    if dp[target] < 0 {\n        return "0".to_string();\n    }\n    let mut out = String::new();\n    let mut t = target;\n    while t > 0 {\n        for d in (1..=9usize).rev() {\n            let c = cost[d - 1] as usize;\n            if t >= c && dp[t - c] == dp[t] - 1 {\n                out.push((b'0' + d as u8) as char);\n                t -= c;\n                break;\n            }\n        }\n    }\n    out\n}`,
        php: `function largestNumber($cost, $target) {\n    $NEG = -1000000;\n    $dp = array_fill(0, $target + 1, $NEG);\n    $dp[0] = 0;\n    for ($t = 1; $t <= $target; $t++) {\n        for ($d = 1; $d <= 9; $d++) {\n            $c = $cost[$d - 1];\n            if ($t >= $c && $dp[$t - $c] >= 0 && $dp[$t - $c] + 1 > $dp[$t]) $dp[$t] = $dp[$t - $c] + 1;\n        }\n    }\n    if ($dp[$target] < 0) return "0";\n    $out = "";\n    $t = $target;\n    while ($t > 0) {\n        for ($d = 9; $d >= 1; $d--) {\n            $c = $cost[$d - 1];\n            if ($t >= $c && $dp[$t - $c] === $dp[$t] - 1) {\n                $out .= (string) $d;\n                $t -= $c;\n                break;\n            }\n        }\n    }\n    return $out;\n}`,
        ruby: `def largestNumber(cost, target)\n  neg = -1000000\n  dp = Array.new(target + 1, neg)\n  dp[0] = 0\n  (1..target).each do |t|\n    (1..9).each do |d|\n      c = cost[d - 1]\n      dp[t] = dp[t - c] + 1 if t >= c && dp[t - c] >= 0 && dp[t - c] + 1 > dp[t]\n    end\n  end\n  return "0" if dp[target] < 0\n  out = ""\n  t = target\n  while t > 0\n    9.downto(1) do |d|\n      c = cost[d - 1]\n      next unless t >= c && dp[t - c] == dp[t] - 1\n      out += d.to_s\n      t -= c\n      break\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Number of Distinct Roll Sequences (LC 2318) ─────────────────
  (() => {
    const gcd = (a: number, b: number): number => {
      while (b !== 0) { const t = a % b; a = b; b = t; }
      return a;
    };
    const ref = (n: number) => {
      if (n === 1) return 6;
      // dp[last][second] = sequences ending with `second` then `last`.
      const dp: number[][] = [];
      for (let a = 0; a <= 6; a++) dp.push(new Array(7).fill(0));
      for (let first = 1; first <= 6; first++) {
        for (let second = 1; second <= 6; second++) {
          if (first !== second && gcd(first, second) === 1) dp[second][first] = 1;
        }
      }
      for (let step = 3; step <= n; step++) {
        const next: number[][] = [];
        for (let a = 0; a <= 6; a++) next.push(new Array(7).fill(0));
        for (let last = 1; last <= 6; last++) {
          for (let second = 1; second <= 6; second++) {
            const ways = dp[last][second];
            if (ways === 0) continue;
            for (let cur = 1; cur <= 6; cur++) {
              if (cur === last || cur === second) continue;
              if (gcd(cur, last) !== 1) continue;
              next[cur][last] = (next[cur][last] + ways) % MOD5;
            }
          }
        }
        for (let a = 0; a <= 6; a++) for (let b = 0; b <= 6; b++) dp[a][b] = next[a][b];
      }
      let total = 0;
      for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) total = (total + dp[a][b]) % MOD5;
      return total;
    };
    return {
      slug: "number-of-distinct-roll-sequences",
      title: "Number of Distinct Roll Sequences",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Memoization", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "distinctSequences", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Roll a standard six-sided die `n` times. A sequence of rolls is **valid** when:\n\n- the greatest common divisor of any two **adjacent** rolls is 1, and\n- if a value appears more than once, the equal rolls are **at least 3 apart** in the sequence.\n\nReturn the number of distinct valid sequences, **modulo 10⁹ + 7**.",
        [
          { in: "n = 1", out: "6", note: "Every single roll is valid." },
          { in: "n = 2", out: "22", note: "Of the 36 ordered pairs, 22 are coprime and unequal." },
          { in: "n = 4", out: "184" },
        ],
        ["1 <= n <= 10^4"]),
      hints: [
        "\"At least 3 apart\" means the new roll may not equal either of the previous **two** rolls.",
        "So the state is the last two values — only 36 of them.",
        "Step the state forward `n - 2` times, adding the coprimality check on each transition.",
      ],
      editorial: explain({
        idea: "The constraints reach back exactly two positions, so `dp[last][second]` — the number of valid sequences ending with `second` then `last` — is a complete state. Each step picks a new roll that is coprime with `last` and differs from both `last` and `second`.",
        steps: [
          "Answer 6 for `n = 1`.",
          "Seed `dp[second][first] = 1` for every ordered pair with `first != second` and `gcd == 1`.",
          "Repeat `n - 2` times: for each state and each candidate `cur`, require `cur != last`, `cur != second` and `gcd(cur, last) == 1`, then add into `next[cur][last]`.",
          "Sum the table.",
        ],
        why: "The distance rule translates to \"differs from the previous two\" — a value three apart is allowed, so only the last two matter. That bounds the state at 36 and makes each step constant work, which is what lets `n` reach 10⁴ without difficulty. A memoised recursion on `(index, last, second)` is the same DP and is how most solutions are written.",
        time: "O(n · 6³)",
        space: "O(1) — a 6 × 6 table",
        pitfalls: [
          "Adjacent equal rolls are already excluded by the gcd rule only for values above 1 — `1, 1` is coprime but still invalid by the distance rule.",
          "The distance is over positions, so a value may reappear exactly three rolls later.",
          "`n = 1` and `n = 2` need their own handling before the loop begins.",
        ],
      }),
      examples: [
        { input: "1", expectedOutput: "6" },
        { input: "2", expectedOutput: "22" },
        { input: "4", expectedOutput: "184" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 400);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `from math import gcd\n\ndef distinctSequences(n: int) -> int:\n    MOD = 10**9 + 7\n    if n == 1:\n        return 6\n    dp = [[0] * 7 for _ in range(7)]\n    for first in range(1, 7):\n        for second in range(1, 7):\n            if first != second and gcd(first, second) == 1:\n                dp[second][first] = 1\n    for _ in range(3, n + 1):\n        nxt = [[0] * 7 for _ in range(7)]\n        for last in range(1, 7):\n            for second in range(1, 7):\n                ways = dp[last][second]\n                if ways == 0:\n                    continue\n                for cur in range(1, 7):\n                    if cur == last or cur == second:\n                        continue\n                    if gcd(cur, last) != 1:\n                        continue\n                    nxt[cur][last] = (nxt[cur][last] + ways) % MOD\n        dp = nxt\n    return sum(sum(row) for row in dp) % MOD`,
        javascript: `var distinctSequences = function(n) {\n    var MOD = 1000000007;\n    if (n === 1) return 6;\n    var gcd = function(a, b) {\n        while (b !== 0) { var t = a % b; a = b; b = t; }\n        return a;\n    };\n    var make = function() {\n        var t = [];\n        for (var a = 0; a <= 6; a++) {\n            var row = [];\n            for (var b = 0; b <= 6; b++) row.push(0);\n            t.push(row);\n        }\n        return t;\n    };\n    var dp = make(), first, second, last, cur;\n    for (first = 1; first <= 6; first++) {\n        for (second = 1; second <= 6; second++) {\n            if (first !== second && gcd(first, second) === 1) dp[second][first] = 1;\n        }\n    }\n    for (var step = 3; step <= n; step++) {\n        var next = make();\n        for (last = 1; last <= 6; last++) {\n            for (second = 1; second <= 6; second++) {\n                var ways = dp[last][second];\n                if (ways === 0) continue;\n                for (cur = 1; cur <= 6; cur++) {\n                    if (cur === last || cur === second) continue;\n                    if (gcd(cur, last) !== 1) continue;\n                    next[cur][last] = (next[cur][last] + ways) % MOD;\n                }\n            }\n        }\n        dp = next;\n    }\n    var total = 0;\n    for (var a = 1; a <= 6; a++) {\n        for (var b = 1; b <= 6; b++) total = (total + dp[a][b]) % MOD;\n    }\n    return total;\n};`,
        typescript: `function distinctSequences(n: number): number {\n    var MOD = 1000000007;\n    if (n === 1) return 6;\n    var gcd = function(a: number, b: number): number {\n        while (b !== 0) { var t = a % b; a = b; b = t; }\n        return a;\n    };\n    var make = function(): number[][] {\n        var t: number[][] = [];\n        for (var a = 0; a <= 6; a++) {\n            var row: number[] = [];\n            for (var b = 0; b <= 6; b++) row.push(0);\n            t.push(row);\n        }\n        return t;\n    };\n    var dp = make(), first: number, second: number, last: number, cur: number;\n    for (first = 1; first <= 6; first++) {\n        for (second = 1; second <= 6; second++) {\n            if (first !== second && gcd(first, second) === 1) dp[second][first] = 1;\n        }\n    }\n    for (var step = 3; step <= n; step++) {\n        var next = make();\n        for (last = 1; last <= 6; last++) {\n            for (second = 1; second <= 6; second++) {\n                var ways = dp[last][second];\n                if (ways === 0) continue;\n                for (cur = 1; cur <= 6; cur++) {\n                    if (cur === last || cur === second) continue;\n                    if (gcd(cur, last) !== 1) continue;\n                    next[cur][last] = (next[cur][last] + ways) % MOD;\n                }\n            }\n        }\n        dp = next;\n    }\n    var total = 0;\n    for (var a = 1; a <= 6; a++) {\n        for (var b = 1; b <= 6; b++) total = (total + dp[a][b]) % MOD;\n    }\n    return total;\n}`,
        java: `private static int dsGcd(int a, int b) {\n    while (b != 0) {\n        int t = a % b;\n        a = b;\n        b = t;\n    }\n    return a;\n}\n\npublic static int distinctSequences(int n) {\n    final long MOD = 1000000007L;\n    if (n == 1) return 6;\n    long[][] dp = new long[7][7];\n    for (int first = 1; first <= 6; first++) {\n        for (int second = 1; second <= 6; second++) {\n            if (first != second && dsGcd(first, second) == 1) dp[second][first] = 1;\n        }\n    }\n    for (int step = 3; step <= n; step++) {\n        long[][] next = new long[7][7];\n        for (int last = 1; last <= 6; last++) {\n            for (int second = 1; second <= 6; second++) {\n                long ways = dp[last][second];\n                if (ways == 0) continue;\n                for (int cur = 1; cur <= 6; cur++) {\n                    if (cur == last || cur == second) continue;\n                    if (dsGcd(cur, last) != 1) continue;\n                    next[cur][last] = (next[cur][last] + ways) % MOD;\n                }\n            }\n        }\n        dp = next;\n    }\n    long total = 0;\n    for (int a = 1; a <= 6; a++) {\n        for (int b = 1; b <= 6; b++) total = (total + dp[a][b]) % MOD;\n    }\n    return (int) total;\n}`,
        cpp: `static int dsGcd(int a, int b) {\n    while (b != 0) {\n        int t = a % b;\n        a = b;\n        b = t;\n    }\n    return a;\n}\n\nint distinctSequences(int n) {\n    const long long MOD = 1000000007LL;\n    if (n == 1) return 6;\n    vector<vector<long long>> dp(7, vector<long long>(7, 0));\n    for (int first = 1; first <= 6; first++) {\n        for (int second = 1; second <= 6; second++) {\n            if (first != second && dsGcd(first, second) == 1) dp[second][first] = 1;\n        }\n    }\n    for (int step = 3; step <= n; step++) {\n        vector<vector<long long>> next(7, vector<long long>(7, 0));\n        for (int last = 1; last <= 6; last++) {\n            for (int second = 1; second <= 6; second++) {\n                long long ways = dp[last][second];\n                if (ways == 0) continue;\n                for (int cur = 1; cur <= 6; cur++) {\n                    if (cur == last || cur == second) continue;\n                    if (dsGcd(cur, last) != 1) continue;\n                    next[cur][last] = (next[cur][last] + ways) % MOD;\n                }\n            }\n        }\n        dp = next;\n    }\n    long long total = 0;\n    for (int a = 1; a <= 6; a++) {\n        for (int b = 1; b <= 6; b++) total = (total + dp[a][b]) % MOD;\n    }\n    return (int) total;\n}`,
        c: `static int dsGcd(int a, int b) {\n    while (b != 0) {\n        int t = a % b;\n        a = b;\n        b = t;\n    }\n    return a;\n}\n\nint distinctSequences(int n) {\n    const long long MOD = 1000000007LL;\n    if (n == 1) return 6;\n    long long dp[7][7];\n    long long next[7][7];\n    for (int a = 0; a <= 6; a++) for (int b = 0; b <= 6; b++) dp[a][b] = 0;\n    for (int first = 1; first <= 6; first++) {\n        for (int second = 1; second <= 6; second++) {\n            if (first != second && dsGcd(first, second) == 1) dp[second][first] = 1;\n        }\n    }\n    for (int step = 3; step <= n; step++) {\n        for (int a = 0; a <= 6; a++) for (int b = 0; b <= 6; b++) next[a][b] = 0;\n        for (int last = 1; last <= 6; last++) {\n            for (int second = 1; second <= 6; second++) {\n                long long ways = dp[last][second];\n                if (ways == 0) continue;\n                for (int cur = 1; cur <= 6; cur++) {\n                    if (cur == last || cur == second) continue;\n                    if (dsGcd(cur, last) != 1) continue;\n                    next[cur][last] = (next[cur][last] + ways) % MOD;\n                }\n            }\n        }\n        for (int a = 0; a <= 6; a++) for (int b = 0; b <= 6; b++) dp[a][b] = next[a][b];\n    }\n    long long total = 0;\n    for (int a = 1; a <= 6; a++) {\n        for (int b = 1; b <= 6; b++) total = (total + dp[a][b]) % MOD;\n    }\n    return (int) total;\n}`,
        csharp: `private static int DsGcd(int a, int b)\n{\n    while (b != 0)\n    {\n        int t = a % b;\n        a = b;\n        b = t;\n    }\n    return a;\n}\n\npublic static int DistinctSequences(int n)\n{\n    const long MOD = 1000000007L;\n    if (n == 1) return 6;\n    var dp = new long[7, 7];\n    for (int first = 1; first <= 6; first++)\n    {\n        for (int second = 1; second <= 6; second++)\n        {\n            if (first != second && DsGcd(first, second) == 1) dp[second, first] = 1;\n        }\n    }\n    for (int step = 3; step <= n; step++)\n    {\n        var next = new long[7, 7];\n        for (int last = 1; last <= 6; last++)\n        {\n            for (int second = 1; second <= 6; second++)\n            {\n                long ways = dp[last, second];\n                if (ways == 0) continue;\n                for (int cur = 1; cur <= 6; cur++)\n                {\n                    if (cur == last || cur == second) continue;\n                    if (DsGcd(cur, last) != 1) continue;\n                    next[cur, last] = (next[cur, last] + ways) % MOD;\n                }\n            }\n        }\n        dp = next;\n    }\n    long total = 0;\n    for (int a = 1; a <= 6; a++)\n    {\n        for (int b = 1; b <= 6; b++) total = (total + dp[a, b]) % MOD;\n    }\n    return (int) total;\n}`,
        go: `func dsGcd(a, b int) int {\n\tfor b != 0 {\n\t\ta, b = b, a%b\n\t}\n\treturn a\n}\n\nfunc distinctSequences(n int) int {\n\tconst MOD = 1000000007\n\tif n == 1 {\n\t\treturn 6\n\t}\n\tvar dp, next [7][7]int\n\tfor first := 1; first <= 6; first++ {\n\t\tfor second := 1; second <= 6; second++ {\n\t\t\tif first != second && dsGcd(first, second) == 1 {\n\t\t\t\tdp[second][first] = 1\n\t\t\t}\n\t\t}\n\t}\n\tfor step := 3; step <= n; step++ {\n\t\tfor a := 0; a <= 6; a++ {\n\t\t\tfor b := 0; b <= 6; b++ {\n\t\t\t\tnext[a][b] = 0\n\t\t\t}\n\t\t}\n\t\tfor last := 1; last <= 6; last++ {\n\t\t\tfor second := 1; second <= 6; second++ {\n\t\t\t\tways := dp[last][second]\n\t\t\t\tif ways == 0 {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tfor cur := 1; cur <= 6; cur++ {\n\t\t\t\t\tif cur == last || cur == second {\n\t\t\t\t\t\tcontinue\n\t\t\t\t\t}\n\t\t\t\t\tif dsGcd(cur, last) != 1 {\n\t\t\t\t\t\tcontinue\n\t\t\t\t\t}\n\t\t\t\t\tnext[cur][last] = (next[cur][last] + ways) % MOD\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tdp = next\n\t}\n\ttotal := 0\n\tfor a := 1; a <= 6; a++ {\n\t\tfor b := 1; b <= 6; b++ {\n\t\t\ttotal = (total + dp[a][b]) % MOD\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `private fun dsGcd(a: Int, b: Int): Int {\n    var x = a\n    var y = b\n    while (y != 0) {\n        val t = x % y\n        x = y\n        y = t\n    }\n    return x\n}\n\nfun distinctSequences(n: Int): Int {\n    val mod = 1000000007L\n    if (n == 1) return 6\n    var dp = Array(7) { LongArray(7) }\n    for (first in 1..6) {\n        for (second in 1..6) {\n            if (first != second && dsGcd(first, second) == 1) dp[second][first] = 1\n        }\n    }\n    for (step in 3..n) {\n        val next = Array(7) { LongArray(7) }\n        for (last in 1..6) {\n            for (second in 1..6) {\n                val ways = dp[last][second]\n                if (ways == 0L) continue\n                for (cur in 1..6) {\n                    if (cur == last || cur == second) continue\n                    if (dsGcd(cur, last) != 1) continue\n                    next[cur][last] = (next[cur][last] + ways) % mod\n                }\n            }\n        }\n        dp = next\n    }\n    var total = 0L\n    for (a in 1..6) {\n        for (b in 1..6) total = (total + dp[a][b]) % mod\n    }\n    return total.toInt()\n}`,
        swift: `func distinctSequences(_ n: Int) -> Int {\n    let mod = 1000000007\n    if n == 1 { return 6 }\n    func g(_ a: Int, _ b: Int) -> Int {\n        var x = a\n        var y = b\n        while y != 0 {\n            let t = x % y\n            x = y\n            y = t\n        }\n        return x\n    }\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: 7), count: 7)\n    for first in 1...6 {\n        for second in 1...6 where first != second && g(first, second) == 1 {\n            dp[second][first] = 1\n        }\n    }\n    if n >= 3 {\n        for _ in 3...n {\n            var next = [[Int]](repeating: [Int](repeating: 0, count: 7), count: 7)\n            for last in 1...6 {\n                for second in 1...6 {\n                    let ways = dp[last][second]\n                    if ways == 0 { continue }\n                    for cur in 1...6 {\n                        if cur == last || cur == second { continue }\n                        if g(cur, last) != 1 { continue }\n                        next[cur][last] = (next[cur][last] + ways) % mod\n                    }\n                }\n            }\n            dp = next\n        }\n    }\n    var total = 0\n    for a in 1...6 {\n        for b in 1...6 { total = (total + dp[a][b]) % mod }\n    }\n    return total\n}`,
        rust: `fn distinctSequences(n: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    if n == 1 {\n        return 6;\n    }\n    fn g(a: i32, b: i32) -> i32 {\n        let (mut x, mut y) = (a, b);\n        while y != 0 {\n            let t = x % y;\n            x = y;\n            y = t;\n        }\n        x\n    }\n    let mut dp = [[0i64; 7]; 7];\n    for first in 1..=6 {\n        for second in 1..=6 {\n            if first != second && g(first, second) == 1 {\n                dp[second as usize][first as usize] = 1;\n            }\n        }\n    }\n    for _ in 3..=n {\n        let mut next = [[0i64; 7]; 7];\n        for last in 1..=6usize {\n            for second in 1..=6usize {\n                let ways = dp[last][second];\n                if ways == 0 {\n                    continue;\n                }\n                for cur in 1..=6usize {\n                    if cur == last || cur == second {\n                        continue;\n                    }\n                    if g(cur as i32, last as i32) != 1 {\n                        continue;\n                    }\n                    next[cur][last] = (next[cur][last] + ways) % MOD;\n                }\n            }\n        }\n        dp = next;\n    }\n    let mut total: i64 = 0;\n    for a in 1..=6 {\n        for b in 1..=6 {\n            total = (total + dp[a][b]) % MOD;\n        }\n    }\n    total as i32\n}`,
        php: `function dsGcd($a, $b) {\n    while ($b !== 0) {\n        $t = $a % $b;\n        $a = $b;\n        $b = $t;\n    }\n    return $a;\n}\n\nfunction distinctSequences($n) {\n    $MOD = 1000000007;\n    if ($n === 1) return 6;\n    $dp = [];\n    for ($a = 0; $a <= 6; $a++) $dp[$a] = array_fill(0, 7, 0);\n    for ($first = 1; $first <= 6; $first++) {\n        for ($second = 1; $second <= 6; $second++) {\n            if ($first !== $second && dsGcd($first, $second) === 1) $dp[$second][$first] = 1;\n        }\n    }\n    for ($step = 3; $step <= $n; $step++) {\n        $next = [];\n        for ($a = 0; $a <= 6; $a++) $next[$a] = array_fill(0, 7, 0);\n        for ($last = 1; $last <= 6; $last++) {\n            for ($second = 1; $second <= 6; $second++) {\n                $ways = $dp[$last][$second];\n                if ($ways === 0) continue;\n                for ($cur = 1; $cur <= 6; $cur++) {\n                    if ($cur === $last || $cur === $second) continue;\n                    if (dsGcd($cur, $last) !== 1) continue;\n                    $next[$cur][$last] = ($next[$cur][$last] + $ways) % $MOD;\n                }\n            }\n        }\n        $dp = $next;\n    }\n    $total = 0;\n    for ($a = 1; $a <= 6; $a++) {\n        for ($b = 1; $b <= 6; $b++) $total = ($total + $dp[$a][$b]) % $MOD;\n    }\n    return $total;\n}`,
        ruby: `def ds_gcd(a, b)\n  while b != 0\n    a, b = b, a % b\n  end\n  a\nend\n\ndef distinctSequences(n)\n  mod = 1000000007\n  return 6 if n == 1\n  dp = Array.new(7) { Array.new(7, 0) }\n  (1..6).each do |first|\n    (1..6).each do |second|\n      dp[second][first] = 1 if first != second && ds_gcd(first, second) == 1\n    end\n  end\n  (3..n).each do\n    nxt = Array.new(7) { Array.new(7, 0) }\n    (1..6).each do |last|\n      (1..6).each do |second|\n        ways = dp[last][second]\n        next if ways == 0\n        (1..6).each do |cur|\n          next if cur == last || cur == second\n          next if ds_gcd(cur, last) != 1\n          nxt[cur][last] = (nxt[cur][last] + ways) % mod\n        end\n      end\n    end\n    dp = nxt\n  end\n  total = 0\n  (1..6).each { |a| (1..6).each { |b| total = (total + dp[a][b]) % mod } }\n  total\nend`,
      },
    };
  })(),

  // ── Minimum Incompatibility (LC 1681) ───────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      if (n % k !== 0) return -1;
      const size = n / k;
      const full = 1 << n;
      const INF = 1000000000;
      // cost[mask] = max - min when the chosen indices hold distinct values.
      const cost = new Array(full).fill(-1);
      for (let mask = 0; mask < full; mask++) {
        let count = 0, lo = 1000, hi = -1, ok = true;
        const seen = new Array(n + 1).fill(false);
        for (let i = 0; i < n; i++) {
          if ((mask & (1 << i)) === 0) continue;
          count++;
          const v = nums[i];
          if (seen[v]) { ok = false; break; }
          seen[v] = true;
          if (v < lo) lo = v;
          if (v > hi) hi = v;
        }
        if (ok && count === size) cost[mask] = hi - lo;
      }
      const dp = new Array(full).fill(INF);
      dp[0] = 0;
      for (let mask = 0; mask < full; mask++) {
        if (dp[mask] === INF) continue;
        const rem = (full - 1) ^ mask;
        if (rem === 0) continue;
        const lowBit = rem & -rem;
        for (let sub = rem; sub > 0; sub = (sub - 1) & rem) {
          if ((sub & lowBit) === 0) continue;
          if (cost[sub] < 0) continue;
          const cand = dp[mask] + cost[sub];
          if (cand < dp[mask | sub]) dp[mask | sub] = cand;
        }
      }
      return dp[full - 1] === INF ? -1 : dp[full - 1];
    };
    return {
      slug: "minimum-incompatibility",
      title: "Minimum Incompatibility",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Bit Manipulation", "Bitmask", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "minimumIncompatibility", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Distribute `nums` into **`k` subsets of equal size**, where each subset must contain **distinct** values. A subset's **incompatibility** is its maximum minus its minimum.\n\nReturn the minimum possible sum of the `k` incompatibilities, or `-1` if no such distribution exists.",
        [
          { in: "nums = [1,2,1,4], k = 2", out: "4", note: "`{1,2}` and `{1,4}` give 1 + 3." },
          { in: "nums = [6,3,8,1,3,1,2,2], k = 4", out: "6", note: "`{1,2}`, `{2,3}`, `{6,8}`, `{1,3}` give 1 + 1 + 2 + 2." },
          { in: "nums = [5,3,3,6,3,3], k = 3", out: "-1", note: "Four copies of 3 cannot fit into three subsets of size 2." },
        ],
        ["1 <= k <= nums.length <= 12", "nums.length % k == 0", "1 <= nums[i] <= nums.length"]),
      hints: [
        "`n <= 12` — a bitmask over which elements have been placed.",
        "Precompute, for every mask of exactly `n / k` bits with no repeated value, its `max - min`.",
        "To avoid counting the same partition in every order, always force the next group to contain the **lowest unused index**.",
      ],
      editorial: explain({
        idea: "Bitmask DP over the set of placed elements. Precompute each candidate group's incompatibility, then build the partition one group at a time, always anchoring the next group on the lowest unused index so each partition is constructed exactly once.",
        steps: [
          "For every mask, check that it has `size = n / k` bits and no repeated value; record `max - min`.",
          "Set `dp[0] = 0`; for each reachable mask, take `rem` = the unused bits and `lowBit` = its lowest set bit.",
          "Enumerate the submasks of `rem` that contain `lowBit` and are valid groups, relaxing `dp[mask | sub]`.",
          "Return `dp[full]`, or `-1` if it was never reached.",
        ],
        why: "Anchoring on the lowest unused index is what keeps the complexity at O(3ⁿ) rather than O(3ⁿ · k!): without it, the same partition is reached once per ordering of its groups, which is pure waste and can also break the intuition that `dp` is monotone. The submask enumeration idiom `sub = (sub - 1) & rem` visits every subset of `rem` exactly once, and summed over all masks that is the familiar 3ⁿ.",
        time: "O(3ⁿ)",
        space: "O(2ⁿ)",
        pitfalls: [
          "Duplicate values inside a group are forbidden, which is the only source of `-1`.",
          "Groups must all be exactly `n / k` in size; nothing may be left over.",
          "Enumerating every submask without the lowest-bit anchor multiplies the work by the number of group orderings.",
        ],
      }),
      examples: [
        { input: "[1,2,1,4]\n2", expectedOutput: "4" },
        { input: "[6,3,8,1,3,1,2,2]\n4", expectedOutput: "6" },
        { input: "[5,3,3,6,3,3]\n3", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const size = ri(rng, 1, 3);
        const k = ri(rng, 1, 4);
        const n = Math.min(size * k, 12);
        const kk = Math.max(1, Math.floor(n / size));
        const count = size * kk;
        const nums = Array.from({ length: count }, () => ri(rng, 1, count));
        return { input: `${fmtIntArr(nums)}\n${kk}`, expectedOutput: String(ref(nums, kk)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumIncompatibility(nums: List[int], k: int) -> int:\n    n = len(nums)\n    if n % k != 0:\n        return -1\n    size = n // k\n    full = 1 << n\n    INF = 10**9\n    cost = [-1] * full\n    for mask in range(full):\n        vals = [nums[i] for i in range(n) if mask & (1 << i)]\n        if len(vals) == size and len(set(vals)) == size:\n            cost[mask] = max(vals) - min(vals)\n    dp = [INF] * full\n    dp[0] = 0\n    for mask in range(full):\n        if dp[mask] == INF:\n            continue\n        rem = (full - 1) ^ mask\n        if rem == 0:\n            continue\n        low = rem & -rem\n        sub = rem\n        while sub:\n            if sub & low and cost[sub] >= 0:\n                dp[mask | sub] = min(dp[mask | sub], dp[mask] + cost[sub])\n            sub = (sub - 1) & rem\n    return -1 if dp[full - 1] == INF else dp[full - 1]`,
        javascript: `var minimumIncompatibility = function(nums, k) {\n    var n = nums.length;\n    if (n % k !== 0) return -1;\n    var size = n / k, full = 1 << n, INF = 1000000000, mask, i;\n    var cost = [];\n    for (mask = 0; mask < full; mask++) cost.push(-1);\n    for (mask = 0; mask < full; mask++) {\n        var count = 0, lo = 1000, hi = -1, ok = true;\n        var seen = [];\n        for (i = 0; i <= n; i++) seen.push(false);\n        for (i = 0; i < n; i++) {\n            if ((mask & (1 << i)) === 0) continue;\n            count++;\n            var v = nums[i];\n            if (seen[v]) { ok = false; break; }\n            seen[v] = true;\n            if (v < lo) lo = v;\n            if (v > hi) hi = v;\n        }\n        if (ok && count === size) cost[mask] = hi - lo;\n    }\n    var dp = [];\n    for (mask = 0; mask < full; mask++) dp.push(INF);\n    dp[0] = 0;\n    for (mask = 0; mask < full; mask++) {\n        if (dp[mask] === INF) continue;\n        var rem = (full - 1) ^ mask;\n        if (rem === 0) continue;\n        var lowBit = rem & -rem;\n        for (var sub = rem; sub > 0; sub = (sub - 1) & rem) {\n            if ((sub & lowBit) === 0) continue;\n            if (cost[sub] < 0) continue;\n            var cand = dp[mask] + cost[sub];\n            if (cand < dp[mask | sub]) dp[mask | sub] = cand;\n        }\n    }\n    return dp[full - 1] === INF ? -1 : dp[full - 1];\n};`,
        typescript: `function minimumIncompatibility(nums: number[], k: number): number {\n    var n = nums.length;\n    if (n % k !== 0) return -1;\n    var size = n / k, full = 1 << n, INF = 1000000000, mask: number, i: number;\n    var cost: number[] = [];\n    for (mask = 0; mask < full; mask++) cost.push(-1);\n    for (mask = 0; mask < full; mask++) {\n        var count = 0, lo = 1000, hi = -1, ok = true;\n        var seen: boolean[] = [];\n        for (i = 0; i <= n; i++) seen.push(false);\n        for (i = 0; i < n; i++) {\n            if ((mask & (1 << i)) === 0) continue;\n            count++;\n            var v = nums[i];\n            if (seen[v]) { ok = false; break; }\n            seen[v] = true;\n            if (v < lo) lo = v;\n            if (v > hi) hi = v;\n        }\n        if (ok && count === size) cost[mask] = hi - lo;\n    }\n    var dp: number[] = [];\n    for (mask = 0; mask < full; mask++) dp.push(INF);\n    dp[0] = 0;\n    for (mask = 0; mask < full; mask++) {\n        if (dp[mask] === INF) continue;\n        var rem = (full - 1) ^ mask;\n        if (rem === 0) continue;\n        var lowBit = rem & -rem;\n        for (var sub = rem; sub > 0; sub = (sub - 1) & rem) {\n            if ((sub & lowBit) === 0) continue;\n            if (cost[sub] < 0) continue;\n            var cand = dp[mask] + cost[sub];\n            if (cand < dp[mask | sub]) dp[mask | sub] = cand;\n        }\n    }\n    return dp[full - 1] === INF ? -1 : dp[full - 1];\n}`,
        java: `public static int minimumIncompatibility(int[] nums, int k) {\n    int n = nums.length;\n    if (n % k != 0) return -1;\n    int size = n / k;\n    int full = 1 << n;\n    final int INF = 1000000000;\n    int[] cost = new int[full];\n    Arrays.fill(cost, -1);\n    for (int mask = 0; mask < full; mask++) {\n        int count = 0, lo = 1000, hi = -1;\n        boolean ok = true;\n        boolean[] seen = new boolean[n + 1];\n        for (int i = 0; i < n; i++) {\n            if ((mask & (1 << i)) == 0) continue;\n            count++;\n            int v = nums[i];\n            if (seen[v]) {\n                ok = false;\n                break;\n            }\n            seen[v] = true;\n            lo = Math.min(lo, v);\n            hi = Math.max(hi, v);\n        }\n        if (ok && count == size) cost[mask] = hi - lo;\n    }\n    int[] dp = new int[full];\n    Arrays.fill(dp, INF);\n    dp[0] = 0;\n    for (int mask = 0; mask < full; mask++) {\n        if (dp[mask] == INF) continue;\n        int rem = (full - 1) ^ mask;\n        if (rem == 0) continue;\n        int lowBit = rem & (-rem);\n        for (int sub = rem; sub > 0; sub = (sub - 1) & rem) {\n            if ((sub & lowBit) == 0) continue;\n            if (cost[sub] < 0) continue;\n            dp[mask | sub] = Math.min(dp[mask | sub], dp[mask] + cost[sub]);\n        }\n    }\n    return dp[full - 1] == INF ? -1 : dp[full - 1];\n}`,
        cpp: `int minimumIncompatibility(vector<int>& nums, int k) {\n    int n = (int) nums.size();\n    if (n % k != 0) return -1;\n    int size = n / k;\n    int full = 1 << n;\n    const int INF = 1000000000;\n    vector<int> cost(full, -1);\n    for (int mask = 0; mask < full; mask++) {\n        int count = 0, lo = 1000, hi = -1;\n        bool ok = true;\n        vector<bool> seen(n + 1, false);\n        for (int i = 0; i < n; i++) {\n            if ((mask & (1 << i)) == 0) continue;\n            count++;\n            int v = nums[i];\n            if (seen[v]) {\n                ok = false;\n                break;\n            }\n            seen[v] = true;\n            lo = min(lo, v);\n            hi = max(hi, v);\n        }\n        if (ok && count == size) cost[mask] = hi - lo;\n    }\n    vector<int> dp(full, INF);\n    dp[0] = 0;\n    for (int mask = 0; mask < full; mask++) {\n        if (dp[mask] == INF) continue;\n        int rem = (full - 1) ^ mask;\n        if (rem == 0) continue;\n        int lowBit = rem & (-rem);\n        for (int sub = rem; sub > 0; sub = (sub - 1) & rem) {\n            if ((sub & lowBit) == 0) continue;\n            if (cost[sub] < 0) continue;\n            dp[mask | sub] = min(dp[mask | sub], dp[mask] + cost[sub]);\n        }\n    }\n    return dp[full - 1] == INF ? -1 : dp[full - 1];\n}`,
        c: `int minimumIncompatibility(int* nums, int numsSize, int k) {\n    int n = numsSize;\n    if (n % k != 0) return -1;\n    int size = n / k;\n    int full = 1 << n;\n    const int INF = 1000000000;\n    int* cost = (int*) malloc((size_t) full * sizeof(int));\n    int* seen = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    for (int mask = 0; mask < full; mask++) {\n        cost[mask] = -1;\n        int count = 0, lo = 1000, hi = -1, ok = 1;\n        for (int v = 0; v <= n; v++) seen[v] = 0;\n        for (int i = 0; i < n; i++) {\n            if ((mask & (1 << i)) == 0) continue;\n            count++;\n            int v = nums[i];\n            if (seen[v]) { ok = 0; break; }\n            seen[v] = 1;\n            if (v < lo) lo = v;\n            if (v > hi) hi = v;\n        }\n        if (ok && count == size) cost[mask] = hi - lo;\n    }\n    int* dp = (int*) malloc((size_t) full * sizeof(int));\n    for (int mask = 0; mask < full; mask++) dp[mask] = INF;\n    dp[0] = 0;\n    for (int mask = 0; mask < full; mask++) {\n        if (dp[mask] == INF) continue;\n        int rem = (full - 1) ^ mask;\n        if (rem == 0) continue;\n        int lowBit = rem & (-rem);\n        for (int sub = rem; sub > 0; sub = (sub - 1) & rem) {\n            if ((sub & lowBit) == 0) continue;\n            if (cost[sub] < 0) continue;\n            int cand = dp[mask] + cost[sub];\n            if (cand < dp[mask | sub]) dp[mask | sub] = cand;\n        }\n    }\n    int answer = dp[full - 1] == INF ? -1 : dp[full - 1];\n    free(cost);\n    free(seen);\n    free(dp);\n    return answer;\n}`,
        csharp: `public static int MinimumIncompatibility(int[] nums, int k)\n{\n    int n = nums.Length;\n    if (n % k != 0) return -1;\n    int size = n / k;\n    int full = 1 << n;\n    const int INF = 1000000000;\n    var cost = new int[full];\n    for (int mask = 0; mask < full; mask++)\n    {\n        cost[mask] = -1;\n        int count = 0, lo = 1000, hi = -1;\n        bool ok = true;\n        var seen = new bool[n + 1];\n        for (int i = 0; i < n; i++)\n        {\n            if ((mask & (1 << i)) == 0) continue;\n            count++;\n            int v = nums[i];\n            if (seen[v]) { ok = false; break; }\n            seen[v] = true;\n            lo = Math.Min(lo, v);\n            hi = Math.Max(hi, v);\n        }\n        if (ok && count == size) cost[mask] = hi - lo;\n    }\n    var dp = new int[full];\n    for (int mask = 0; mask < full; mask++) dp[mask] = INF;\n    dp[0] = 0;\n    for (int mask = 0; mask < full; mask++)\n    {\n        if (dp[mask] == INF) continue;\n        int rem = (full - 1) ^ mask;\n        if (rem == 0) continue;\n        int lowBit = rem & (-rem);\n        for (int sub = rem; sub > 0; sub = (sub - 1) & rem)\n        {\n            if ((sub & lowBit) == 0) continue;\n            if (cost[sub] < 0) continue;\n            dp[mask | sub] = Math.Min(dp[mask | sub], dp[mask] + cost[sub]);\n        }\n    }\n    return dp[full - 1] == INF ? -1 : dp[full - 1];\n}`,
        go: `func minimumIncompatibility(nums []int, k int) int {\n\tn := len(nums)\n\tif n%k != 0 {\n\t\treturn -1\n\t}\n\tsize := n / k\n\tfull := 1 << n\n\tconst INF = 1000000000\n\tcost := make([]int, full)\n\tfor mask := 0; mask < full; mask++ {\n\t\tcost[mask] = -1\n\t\tcount, lo, hi, ok := 0, 1000, -1, true\n\t\tseen := make([]bool, n+1)\n\t\tfor i := 0; i < n; i++ {\n\t\t\tif mask&(1<<i) == 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tcount++\n\t\t\tv := nums[i]\n\t\t\tif seen[v] {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t\tseen[v] = true\n\t\t\tif v < lo {\n\t\t\t\tlo = v\n\t\t\t}\n\t\t\tif v > hi {\n\t\t\t\thi = v\n\t\t\t}\n\t\t}\n\t\tif ok && count == size {\n\t\t\tcost[mask] = hi - lo\n\t\t}\n\t}\n\tdp := make([]int, full)\n\tfor mask := range dp {\n\t\tdp[mask] = INF\n\t}\n\tdp[0] = 0\n\tfor mask := 0; mask < full; mask++ {\n\t\tif dp[mask] == INF {\n\t\t\tcontinue\n\t\t}\n\t\trem := (full - 1) ^ mask\n\t\tif rem == 0 {\n\t\t\tcontinue\n\t\t}\n\t\tlowBit := rem & (-rem)\n\t\tfor sub := rem; sub > 0; sub = (sub - 1) & rem {\n\t\t\tif sub&lowBit == 0 || cost[sub] < 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tif cand := dp[mask] + cost[sub]; cand < dp[mask|sub] {\n\t\t\t\tdp[mask|sub] = cand\n\t\t\t}\n\t\t}\n\t}\n\tif dp[full-1] == INF {\n\t\treturn -1\n\t}\n\treturn dp[full-1]\n}`,
        kotlin: `fun minimumIncompatibility(nums: IntArray, k: Int): Int {\n    val n = nums.size\n    if (n % k != 0) return -1\n    val size = n / k\n    val full = 1 shl n\n    val INF = 1000000000\n    val cost = IntArray(full) { -1 }\n    for (mask in 0 until full) {\n        var count = 0\n        var lo = 1000\n        var hi = -1\n        var ok = true\n        val seen = BooleanArray(n + 1)\n        for (i in 0 until n) {\n            if (mask and (1 shl i) == 0) continue\n            count++\n            val v = nums[i]\n            if (seen[v]) {\n                ok = false\n                break\n            }\n            seen[v] = true\n            lo = minOf(lo, v)\n            hi = maxOf(hi, v)\n        }\n        if (ok && count == size) cost[mask] = hi - lo\n    }\n    val dp = IntArray(full) { INF }\n    dp[0] = 0\n    for (mask in 0 until full) {\n        if (dp[mask] == INF) continue\n        val rem = (full - 1) xor mask\n        if (rem == 0) continue\n        val lowBit = rem and (-rem)\n        var sub = rem\n        while (sub > 0) {\n            if (sub and lowBit != 0 && cost[sub] >= 0) {\n                dp[mask or sub] = minOf(dp[mask or sub], dp[mask] + cost[sub])\n            }\n            sub = (sub - 1) and rem\n        }\n    }\n    return if (dp[full - 1] == INF) -1 else dp[full - 1]\n}`,
        swift: `func minimumIncompatibility(_ nums: [Int], _ k: Int) -> Int {\n    let n = nums.count\n    if n % k != 0 { return -1 }\n    let size = n / k\n    let full = 1 << n\n    let INF = 1000000000\n    var cost = [Int](repeating: -1, count: full)\n    for mask in 0..<full {\n        var count = 0\n        var lo = 1000\n        var hi = -1\n        var ok = true\n        var seen = [Bool](repeating: false, count: n + 1)\n        for i in 0..<n {\n            if mask & (1 << i) == 0 { continue }\n            count += 1\n            let v = nums[i]\n            if seen[v] {\n                ok = false\n                break\n            }\n            seen[v] = true\n            lo = min(lo, v)\n            hi = max(hi, v)\n        }\n        if ok && count == size { cost[mask] = hi - lo }\n    }\n    var dp = [Int](repeating: INF, count: full)\n    dp[0] = 0\n    for mask in 0..<full {\n        if dp[mask] == INF { continue }\n        let rem = (full - 1) ^ mask\n        if rem == 0 { continue }\n        let lowBit = rem & (-rem)\n        var sub = rem\n        while sub > 0 {\n            if sub & lowBit != 0 && cost[sub] >= 0 {\n                dp[mask | sub] = min(dp[mask | sub], dp[mask] + cost[sub])\n            }\n            sub = (sub - 1) & rem\n        }\n    }\n    return dp[full - 1] == INF ? -1 : dp[full - 1]\n}`,
        rust: `fn minimumIncompatibility(nums: Vec<i32>, k: i32) -> i32 {\n    let n = nums.len();\n    let k = k as usize;\n    if n % k != 0 {\n        return -1;\n    }\n    let size = n / k;\n    let full = 1usize << n;\n    const INF: i32 = 1000000000;\n    let mut cost = vec![-1i32; full];\n    for mask in 0..full {\n        let mut count = 0usize;\n        let mut lo = 1000i32;\n        let mut hi = -1i32;\n        let mut ok = true;\n        let mut seen = vec![false; n + 1];\n        for i in 0..n {\n            if mask & (1 << i) == 0 {\n                continue;\n            }\n            count += 1;\n            let v = nums[i] as usize;\n            if seen[v] {\n                ok = false;\n                break;\n            }\n            seen[v] = true;\n            lo = lo.min(nums[i]);\n            hi = hi.max(nums[i]);\n        }\n        if ok && count == size {\n            cost[mask] = hi - lo;\n        }\n    }\n    let mut dp = vec![INF; full];\n    dp[0] = 0;\n    for mask in 0..full {\n        if dp[mask] == INF {\n            continue;\n        }\n        let rem = (full - 1) ^ mask;\n        if rem == 0 {\n            continue;\n        }\n        let low_bit = rem & rem.wrapping_neg();\n        let mut sub = rem;\n        while sub > 0 {\n            if sub & low_bit != 0 && cost[sub] >= 0 {\n                let cand = dp[mask] + cost[sub];\n                if cand < dp[mask | sub] {\n                    dp[mask | sub] = cand;\n                }\n            }\n            sub = (sub - 1) & rem;\n        }\n    }\n    if dp[full - 1] == INF {\n        -1\n    } else {\n        dp[full - 1]\n    }\n}`,
        php: `function minimumIncompatibility($nums, $k) {\n    $n = count($nums);\n    if ($n % $k !== 0) return -1;\n    $size = intdiv($n, $k);\n    $full = 1 << $n;\n    $INF = 1000000000;\n    $cost = array_fill(0, $full, -1);\n    for ($mask = 0; $mask < $full; $mask++) {\n        $count = 0; $lo = 1000; $hi = -1; $ok = true;\n        $seen = array_fill(0, $n + 1, false);\n        for ($i = 0; $i < $n; $i++) {\n            if (($mask & (1 << $i)) === 0) continue;\n            $count++;\n            $v = $nums[$i];\n            if ($seen[$v]) { $ok = false; break; }\n            $seen[$v] = true;\n            if ($v < $lo) $lo = $v;\n            if ($v > $hi) $hi = $v;\n        }\n        if ($ok && $count === $size) $cost[$mask] = $hi - $lo;\n    }\n    $dp = array_fill(0, $full, $INF);\n    $dp[0] = 0;\n    for ($mask = 0; $mask < $full; $mask++) {\n        if ($dp[$mask] === $INF) continue;\n        $rem = ($full - 1) ^ $mask;\n        if ($rem === 0) continue;\n        $lowBit = $rem & (-$rem);\n        for ($sub = $rem; $sub > 0; $sub = ($sub - 1) & $rem) {\n            if (($sub & $lowBit) === 0) continue;\n            if ($cost[$sub] < 0) continue;\n            $cand = $dp[$mask] + $cost[$sub];\n            if ($cand < $dp[$mask | $sub]) $dp[$mask | $sub] = $cand;\n        }\n    }\n    return $dp[$full - 1] === $INF ? -1 : $dp[$full - 1];\n}`,
        ruby: `def minimumIncompatibility(nums, k)\n  n = nums.length\n  return -1 if n % k != 0\n  size = n / k\n  full = 1 << n\n  inf = 1000000000\n  cost = Array.new(full, -1)\n  (0...full).each do |mask|\n    vals = (0...n).select { |i| mask[i] == 1 }.map { |i| nums[i] }\n    cost[mask] = vals.max - vals.min if vals.length == size && vals.uniq.length == size\n  end\n  dp = Array.new(full, inf)\n  dp[0] = 0\n  (0...full).each do |mask|\n    next if dp[mask] == inf\n    rem = (full - 1) ^ mask\n    next if rem == 0\n    low = rem & -rem\n    sub = rem\n    while sub > 0\n      if sub & low != 0 && cost[sub] >= 0\n        cand = dp[mask] + cost[sub]\n        dp[mask | sub] = cand if cand < dp[mask | sub]\n      end\n      sub = (sub - 1) & rem\n    end\n  end\n  dp[full - 1] == inf ? -1 : dp[full - 1]\nend`,
      },
    };
  })(),

  // ── Painting a Grid With Three Different Colors (LC 1931) ───────
  (() => {
    const ref = (m: number, n: number) => {
      // Every column is a base-3 string with no two vertically adjacent equal.
      const patterns: number[][] = [];
      const build = (col: number[]) => {
        if (col.length === m) { patterns.push(col.slice()); return; }
        for (let c = 0; c < 3; c++) {
          if (col.length > 0 && col[col.length - 1] === c) continue;
          col.push(c);
          build(col);
          col.pop();
        }
      };
      build([]);
      const p = patterns.length;
      const compatible: number[][] = [];
      for (let a = 0; a < p; a++) {
        const list: number[] = [];
        for (let b = 0; b < p; b++) {
          let ok = true;
          for (let r = 0; r < m; r++) {
            if (patterns[a][r] === patterns[b][r]) { ok = false; break; }
          }
          if (ok) list.push(b);
        }
        compatible.push(list);
      }
      let dp = new Array(p).fill(1);
      for (let col = 2; col <= n; col++) {
        const next = new Array(p).fill(0);
        for (let a = 0; a < p; a++) {
          if (dp[a] === 0) continue;
          for (let t = 0; t < compatible[a].length; t++) {
            const b = compatible[a][t];
            next[b] = (next[b] + dp[a]) % MOD5;
          }
        }
        dp = next;
      }
      let total = 0;
      for (let a = 0; a < p; a++) total = (total + dp[a]) % MOD5;
      return total;
    };
    return {
      slug: "painting-a-grid-with-three-different-colors",
      title: "Painting a Grid With Three Different Colors",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Bitmask", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "colorTheGrid", params: [{ name: "m", type: "int" as const }, { name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Paint every cell of an `m × n` grid red, green or blue so that **no two adjacent cells** — sharing a side — have the same colour.\n\nReturn the number of ways, **modulo 10⁹ + 7**.",
        [
          { in: "m = 1, n = 1", out: "3", note: "One cell, three colours." },
          { in: "m = 1, n = 2", out: "6", note: "Three choices for the first cell and two for the second." },
          { in: "m = 5, n = 5", out: "580986" },
        ],
        ["1 <= m <= 5", "1 <= n <= 1000"]),
      hints: [
        "`m` is at most 5, so a whole **column** has at most 3⁵ colourings — and only `3 · 2^(m-1)` of them are internally valid.",
        "Enumerate those valid columns once, then precompute which pairs of columns can sit side by side.",
        "Step column by column, summing over compatible predecessors.",
      ],
      editorial: explain({
        idea: "Treat each column as a single state. Enumerate the column colourings with no two vertically adjacent cells equal, precompute the compatibility relation between columns (no row matching), and run a linear DP across the `n` columns.",
        steps: [
          "Generate every column colouring of height `m` with no vertical conflict — there are `3 · 2^(m-1)`.",
          "For each ordered pair, mark them compatible when they differ in **every** row.",
          "Start `dp[p] = 1` for every valid column.",
          "For each further column, `next[b] = Σ dp[a]` over compatible `a`, modulo 10⁹ + 7.",
          "Sum the final row.",
        ],
        why: "Columns rather than cells is the right granularity because the only coupling between columns is row-by-row, and `m <= 5` keeps the state count at 48 even in the worst case. Precomputing compatibility matters: recomputing it inside the column loop would add a factor of `m` to a loop that already runs `n · states²` times.",
        time: "O(n · S²) where S = 3 · 2^(m-1)",
        space: "O(S²)",
        pitfalls: [
          "Two constraints, not one: vertical conflicts are handled when generating a column, horizontal ones by the compatibility test.",
          "Compatibility requires **every** row to differ, not merely some.",
          "`m` and `n` are not interchangeable here — the DP runs over `n` with `m` inside the state.",
        ],
      }),
      examples: [
        { input: "1\n1", expectedOutput: "3" },
        { input: "1\n2", expectedOutput: "6" },
        { input: "5\n5", expectedOutput: "580986" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 5);
        const n = ri(rng, 1, 200);
        return { input: `${m}\n${n}`, expectedOutput: String(ref(m, n)) };
      },
      solutions: {
        python: `def colorTheGrid(m: int, n: int) -> int:\n    MOD = 10**9 + 7\n    patterns = []\n\n    def build(col):\n        if len(col) == m:\n            patterns.append(tuple(col))\n            return\n        for c in range(3):\n            if col and col[-1] == c:\n                continue\n            col.append(c)\n            build(col)\n            col.pop()\n\n    build([])\n    p = len(patterns)\n    compatible = [[b for b in range(p) if all(patterns[a][r] != patterns[b][r] for r in range(m))] for a in range(p)]\n    dp = [1] * p\n    for _ in range(2, n + 1):\n        nxt = [0] * p\n        for a in range(p):\n            if dp[a] == 0:\n                continue\n            for b in compatible[a]:\n                nxt[b] = (nxt[b] + dp[a]) % MOD\n        dp = nxt\n    return sum(dp) % MOD`,
        javascript: `var colorTheGrid = function(m, n) {\n    var MOD = 1000000007;\n    var patterns = [];\n    var build = function(col) {\n        if (col.length === m) { patterns.push(col.slice()); return; }\n        for (var c = 0; c < 3; c++) {\n            if (col.length > 0 && col[col.length - 1] === c) continue;\n            col.push(c);\n            build(col);\n            col.pop();\n        }\n    };\n    build([]);\n    var p = patterns.length, a, b, r;\n    var compatible = [];\n    for (a = 0; a < p; a++) {\n        var list = [];\n        for (b = 0; b < p; b++) {\n            var ok = true;\n            for (r = 0; r < m; r++) {\n                if (patterns[a][r] === patterns[b][r]) { ok = false; break; }\n            }\n            if (ok) list.push(b);\n        }\n        compatible.push(list);\n    }\n    var dp = [];\n    for (a = 0; a < p; a++) dp.push(1);\n    for (var col = 2; col <= n; col++) {\n        var next = [];\n        for (a = 0; a < p; a++) next.push(0);\n        for (a = 0; a < p; a++) {\n            if (dp[a] === 0) continue;\n            for (var t = 0; t < compatible[a].length; t++) {\n                b = compatible[a][t];\n                next[b] = (next[b] + dp[a]) % MOD;\n            }\n        }\n        dp = next;\n    }\n    var total = 0;\n    for (a = 0; a < p; a++) total = (total + dp[a]) % MOD;\n    return total;\n};`,
        typescript: `function colorTheGrid(m: number, n: number): number {\n    var MOD = 1000000007;\n    var patterns: number[][] = [];\n    var build = function(col: number[]) {\n        if (col.length === m) { patterns.push(col.slice()); return; }\n        for (var c = 0; c < 3; c++) {\n            if (col.length > 0 && col[col.length - 1] === c) continue;\n            col.push(c);\n            build(col);\n            col.pop();\n        }\n    };\n    build([]);\n    var p = patterns.length, a: number, b: number, r: number;\n    var compatible: number[][] = [];\n    for (a = 0; a < p; a++) {\n        var list: number[] = [];\n        for (b = 0; b < p; b++) {\n            var ok = true;\n            for (r = 0; r < m; r++) {\n                if (patterns[a][r] === patterns[b][r]) { ok = false; break; }\n            }\n            if (ok) list.push(b);\n        }\n        compatible.push(list);\n    }\n    var dp: number[] = [];\n    for (a = 0; a < p; a++) dp.push(1);\n    for (var col = 2; col <= n; col++) {\n        var next: number[] = [];\n        for (a = 0; a < p; a++) next.push(0);\n        for (a = 0; a < p; a++) {\n            if (dp[a] === 0) continue;\n            for (var t = 0; t < compatible[a].length; t++) {\n                b = compatible[a][t];\n                next[b] = (next[b] + dp[a]) % MOD;\n            }\n        }\n        dp = next;\n    }\n    var total = 0;\n    for (a = 0; a < p; a++) total = (total + dp[a]) % MOD;\n    return total;\n}`,
        java: `public static int colorTheGrid(int m, int n) {\n    final long MOD = 1000000007L;\n    List<int[]> patterns = new ArrayList<>();\n    int[] col = new int[m];\n    ctgBuild(patterns, col, 0, m);\n    int p = patterns.size();\n    List<List<Integer>> compatible = new ArrayList<>();\n    for (int a = 0; a < p; a++) {\n        List<Integer> list = new ArrayList<>();\n        for (int b = 0; b < p; b++) {\n            boolean ok = true;\n            for (int r = 0; r < m; r++) {\n                if (patterns.get(a)[r] == patterns.get(b)[r]) {\n                    ok = false;\n                    break;\n                }\n            }\n            if (ok) list.add(b);\n        }\n        compatible.add(list);\n    }\n    long[] dp = new long[p];\n    Arrays.fill(dp, 1);\n    for (int c = 2; c <= n; c++) {\n        long[] next = new long[p];\n        for (int a = 0; a < p; a++) {\n            if (dp[a] == 0) continue;\n            for (int b : compatible.get(a)) next[b] = (next[b] + dp[a]) % MOD;\n        }\n        dp = next;\n    }\n    long total = 0;\n    for (int a = 0; a < p; a++) total = (total + dp[a]) % MOD;\n    return (int) total;\n}\n\nprivate static void ctgBuild(List<int[]> out, int[] col, int depth, int m) {\n    if (depth == m) {\n        out.add(col.clone());\n        return;\n    }\n    for (int c = 0; c < 3; c++) {\n        if (depth > 0 && col[depth - 1] == c) continue;\n        col[depth] = c;\n        ctgBuild(out, col, depth + 1, m);\n    }\n}`,
        cpp: `static void ctgBuild(vector<vector<int>>& out, vector<int>& col, int depth, int m) {\n    if (depth == m) {\n        out.push_back(col);\n        return;\n    }\n    for (int c = 0; c < 3; c++) {\n        if (depth > 0 && col[depth - 1] == c) continue;\n        col[depth] = c;\n        ctgBuild(out, col, depth + 1, m);\n    }\n}\n\nint colorTheGrid(int m, int n) {\n    const long long MOD = 1000000007LL;\n    vector<vector<int>> patterns;\n    vector<int> col(m, 0);\n    ctgBuild(patterns, col, 0, m);\n    int p = (int) patterns.size();\n    vector<vector<int>> compatible(p);\n    for (int a = 0; a < p; a++) {\n        for (int b = 0; b < p; b++) {\n            bool ok = true;\n            for (int r = 0; r < m; r++) {\n                if (patterns[a][r] == patterns[b][r]) {\n                    ok = false;\n                    break;\n                }\n            }\n            if (ok) compatible[a].push_back(b);\n        }\n    }\n    vector<long long> dp(p, 1);\n    for (int c = 2; c <= n; c++) {\n        vector<long long> next(p, 0);\n        for (int a = 0; a < p; a++) {\n            if (dp[a] == 0) continue;\n            for (int b : compatible[a]) next[b] = (next[b] + dp[a]) % MOD;\n        }\n        dp = next;\n    }\n    long long total = 0;\n    for (int a = 0; a < p; a++) total = (total + dp[a]) % MOD;\n    return (int) total;\n}`,
        c: `int colorTheGrid(int m, int n) {\n    const long long MOD = 1000000007LL;\n    int limit = 1;\n    for (int i = 0; i < m; i++) limit *= 3;\n    int* pats = (int*) malloc((size_t) limit * (size_t) m * sizeof(int));\n    int p = 0;\n    for (int code = 0; code < limit; code++) {\n        int digits[6];\n        int v = code, ok = 1;\n        for (int r = 0; r < m; r++) {\n            digits[r] = v % 3;\n            v /= 3;\n            if (r > 0 && digits[r] == digits[r - 1]) { ok = 0; break; }\n        }\n        if (!ok) continue;\n        for (int r = 0; r < m; r++) pats[p * m + r] = digits[r];\n        p++;\n    }\n    char* compat = (char*) calloc((size_t) p * (size_t) p, sizeof(char));\n    for (int a = 0; a < p; a++) {\n        for (int b = 0; b < p; b++) {\n            int ok = 1;\n            for (int r = 0; r < m; r++) {\n                if (pats[a * m + r] == pats[b * m + r]) { ok = 0; break; }\n            }\n            compat[a * p + b] = (char) ok;\n        }\n    }\n    long long* dp = (long long*) malloc((size_t) p * sizeof(long long));\n    long long* next = (long long*) malloc((size_t) p * sizeof(long long));\n    for (int a = 0; a < p; a++) dp[a] = 1;\n    for (int c = 2; c <= n; c++) {\n        for (int a = 0; a < p; a++) next[a] = 0;\n        for (int a = 0; a < p; a++) {\n            if (dp[a] == 0) continue;\n            for (int b = 0; b < p; b++) {\n                if (compat[a * p + b]) next[b] = (next[b] + dp[a]) % MOD;\n            }\n        }\n        for (int a = 0; a < p; a++) dp[a] = next[a];\n    }\n    long long total = 0;\n    for (int a = 0; a < p; a++) total = (total + dp[a]) % MOD;\n    free(pats);\n    free(compat);\n    free(dp);\n    free(next);\n    return (int) total;\n}`,
        csharp: `public static int ColorTheGrid(int m, int n)\n{\n    const long MOD = 1000000007L;\n    var patterns = new List<int[]>();\n    var col = new int[m];\n    CtgBuild(patterns, col, 0, m);\n    int p = patterns.Count;\n    var compatible = new List<List<int>>();\n    for (int a = 0; a < p; a++)\n    {\n        var list = new List<int>();\n        for (int b = 0; b < p; b++)\n        {\n            bool ok = true;\n            for (int r = 0; r < m; r++)\n            {\n                if (patterns[a][r] == patterns[b][r]) { ok = false; break; }\n            }\n            if (ok) list.Add(b);\n        }\n        compatible.Add(list);\n    }\n    var dp = new long[p];\n    for (int a = 0; a < p; a++) dp[a] = 1;\n    for (int c = 2; c <= n; c++)\n    {\n        var next = new long[p];\n        for (int a = 0; a < p; a++)\n        {\n            if (dp[a] == 0) continue;\n            foreach (int b in compatible[a]) next[b] = (next[b] + dp[a]) % MOD;\n        }\n        dp = next;\n    }\n    long total = 0;\n    for (int a = 0; a < p; a++) total = (total + dp[a]) % MOD;\n    return (int) total;\n}\n\nprivate static void CtgBuild(List<int[]> outList, int[] col, int depth, int m)\n{\n    if (depth == m)\n    {\n        outList.Add((int[]) col.Clone());\n        return;\n    }\n    for (int c = 0; c < 3; c++)\n    {\n        if (depth > 0 && col[depth - 1] == c) continue;\n        col[depth] = c;\n        CtgBuild(outList, col, depth + 1, m);\n    }\n}`,
        go: `func colorTheGrid(m int, n int) int {\n\tconst MOD = 1000000007\n\tpatterns := [][]int{}\n\tcol := make([]int, m)\n\tvar build func(depth int)\n\tbuild = func(depth int) {\n\t\tif depth == m {\n\t\t\tcp := make([]int, m)\n\t\t\tcopy(cp, col)\n\t\t\tpatterns = append(patterns, cp)\n\t\t\treturn\n\t\t}\n\t\tfor c := 0; c < 3; c++ {\n\t\t\tif depth > 0 && col[depth-1] == c {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tcol[depth] = c\n\t\t\tbuild(depth + 1)\n\t\t}\n\t}\n\tbuild(0)\n\tp := len(patterns)\n\tcompatible := make([][]int, p)\n\tfor a := 0; a < p; a++ {\n\t\tfor b := 0; b < p; b++ {\n\t\t\tok := true\n\t\t\tfor r := 0; r < m; r++ {\n\t\t\t\tif patterns[a][r] == patterns[b][r] {\n\t\t\t\t\tok = false\n\t\t\t\t\tbreak\n\t\t\t\t}\n\t\t\t}\n\t\t\tif ok {\n\t\t\t\tcompatible[a] = append(compatible[a], b)\n\t\t\t}\n\t\t}\n\t}\n\tdp := make([]int, p)\n\tfor a := range dp {\n\t\tdp[a] = 1\n\t}\n\tfor c := 2; c <= n; c++ {\n\t\tnext := make([]int, p)\n\t\tfor a := 0; a < p; a++ {\n\t\t\tif dp[a] == 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tfor _, b := range compatible[a] {\n\t\t\t\tnext[b] = (next[b] + dp[a]) % MOD\n\t\t\t}\n\t\t}\n\t\tdp = next\n\t}\n\ttotal := 0\n\tfor a := 0; a < p; a++ {\n\t\ttotal = (total + dp[a]) % MOD\n\t}\n\treturn total\n}`,
        kotlin: `fun colorTheGrid(m: Int, n: Int): Int {\n    val mod = 1000000007L\n    val patterns = mutableListOf<IntArray>()\n    val col = IntArray(m)\n    fun build(depth: Int) {\n        if (depth == m) {\n            patterns.add(col.copyOf())\n            return\n        }\n        for (c in 0 until 3) {\n            if (depth > 0 && col[depth - 1] == c) continue\n            col[depth] = c\n            build(depth + 1)\n        }\n    }\n    build(0)\n    val p = patterns.size\n    val compatible = Array(p) { a ->\n        (0 until p).filter { b -> (0 until m).all { patterns[a][it] != patterns[b][it] } }\n    }\n    var dp = LongArray(p) { 1L }\n    for (c in 2..n) {\n        val next = LongArray(p)\n        for (a in 0 until p) {\n            if (dp[a] == 0L) continue\n            for (b in compatible[a]) next[b] = (next[b] + dp[a]) % mod\n        }\n        dp = next\n    }\n    var total = 0L\n    for (a in 0 until p) total = (total + dp[a]) % mod\n    return total.toInt()\n}`,
        swift: `func colorTheGrid(_ m: Int, _ n: Int) -> Int {\n    let mod = 1000000007\n    var patterns = [[Int]]()\n    var col = [Int]()\n    func build() {\n        if col.count == m {\n            patterns.append(col)\n            return\n        }\n        for c in 0..<3 {\n            if let last = col.last, last == c { continue }\n            col.append(c)\n            build()\n            col.removeLast()\n        }\n    }\n    build()\n    let p = patterns.count\n    var compatible = [[Int]](repeating: [], count: p)\n    for a in 0..<p {\n        for b in 0..<p {\n            var ok = true\n            for r in 0..<m where patterns[a][r] == patterns[b][r] {\n                ok = false\n                break\n            }\n            if ok { compatible[a].append(b) }\n        }\n    }\n    var dp = [Int](repeating: 1, count: p)\n    if n >= 2 {\n        for _ in 2...n {\n            var next = [Int](repeating: 0, count: p)\n            for a in 0..<p {\n                if dp[a] == 0 { continue }\n                for b in compatible[a] { next[b] = (next[b] + dp[a]) % mod }\n            }\n            dp = next\n        }\n    }\n    var total = 0\n    for a in 0..<p { total = (total + dp[a]) % mod }\n    return total\n}`,
        rust: `fn colorTheGrid(m: i32, n: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let m = m as usize;\n    let mut patterns: Vec<Vec<usize>> = Vec::new();\n    let mut limit = 1usize;\n    for _ in 0..m {\n        limit *= 3;\n    }\n    for code in 0..limit {\n        let mut digits = Vec::with_capacity(m);\n        let mut v = code;\n        let mut ok = true;\n        for r in 0..m {\n            let d = v % 3;\n            v /= 3;\n            if r > 0 && digits[r - 1] == d {\n                ok = false;\n                break;\n            }\n            digits.push(d);\n        }\n        if ok {\n            patterns.push(digits);\n        }\n    }\n    let p = patterns.len();\n    let mut compatible: Vec<Vec<usize>> = vec![Vec::new(); p];\n    for a in 0..p {\n        for b in 0..p {\n            let mut ok = true;\n            for r in 0..m {\n                if patterns[a][r] == patterns[b][r] {\n                    ok = false;\n                    break;\n                }\n            }\n            if ok {\n                compatible[a].push(b);\n            }\n        }\n    }\n    let mut dp = vec![1i64; p];\n    for _ in 2..=n {\n        let mut next = vec![0i64; p];\n        for a in 0..p {\n            if dp[a] == 0 {\n                continue;\n            }\n            for &b in compatible[a].iter() {\n                next[b] = (next[b] + dp[a]) % MOD;\n            }\n        }\n        dp = next;\n    }\n    let mut total: i64 = 0;\n    for a in 0..p {\n        total = (total + dp[a]) % MOD;\n    }\n    total as i32\n}`,
        php: `function colorTheGrid($m, $n) {\n    $MOD = 1000000007;\n    $limit = 1;\n    for ($i = 0; $i < $m; $i++) $limit *= 3;\n    $patterns = [];\n    for ($code = 0; $code < $limit; $code++) {\n        $digits = [];\n        $v = $code;\n        $ok = true;\n        for ($r = 0; $r < $m; $r++) {\n            $d = $v % 3;\n            $v = intdiv($v, 3);\n            if ($r > 0 && $digits[$r - 1] === $d) { $ok = false; break; }\n            $digits[] = $d;\n        }\n        if ($ok) $patterns[] = $digits;\n    }\n    $p = count($patterns);\n    $compatible = [];\n    for ($a = 0; $a < $p; $a++) {\n        $compatible[$a] = [];\n        for ($b = 0; $b < $p; $b++) {\n            $ok = true;\n            for ($r = 0; $r < $m; $r++) {\n                if ($patterns[$a][$r] === $patterns[$b][$r]) { $ok = false; break; }\n            }\n            if ($ok) $compatible[$a][] = $b;\n        }\n    }\n    $dp = array_fill(0, $p, 1);\n    for ($c = 2; $c <= $n; $c++) {\n        $next = array_fill(0, $p, 0);\n        for ($a = 0; $a < $p; $a++) {\n            if ($dp[$a] === 0) continue;\n            foreach ($compatible[$a] as $b) $next[$b] = ($next[$b] + $dp[$a]) % $MOD;\n        }\n        $dp = $next;\n    }\n    $total = 0;\n    for ($a = 0; $a < $p; $a++) $total = ($total + $dp[$a]) % $MOD;\n    return $total;\n}`,
        ruby: `def colorTheGrid(m, n)\n  mod = 1000000007\n  limit = 3 ** m\n  patterns = []\n  (0...limit).each do |code|\n    digits = []\n    v = code\n    ok = true\n    (0...m).each do |r|\n      d = v % 3\n      v /= 3\n      if r > 0 && digits[r - 1] == d\n        ok = false\n        break\n      end\n      digits << d\n    end\n    patterns << digits if ok\n  end\n  p = patterns.length\n  compatible = (0...p).map do |a|\n    (0...p).select { |b| (0...m).all? { |r| patterns[a][r] != patterns[b][r] } }\n  end\n  dp = Array.new(p, 1)\n  (2..n).each do\n    nxt = Array.new(p, 0)\n    (0...p).each do |a|\n      next if dp[a] == 0\n      compatible[a].each { |b| nxt[b] = (nxt[b] + dp[a]) % mod }\n    end\n    dp = nxt\n  end\n  dp.sum % mod\nend`,
      },
    };
  })(),

  // ── Number of Ways to Separate Numbers (LC 1977) ────────────────
  (() => {
    const ref = (num: string) => {
      const n = num.length;
      if (num.charAt(0) === "0") return 0;
      // lcp[a][b] = length of the longest common prefix of num[a..] and num[b..].
      const lcp: number[][] = [];
      for (let a = 0; a <= n; a++) lcp.push(new Array(n + 1).fill(0));
      for (let a = n - 1; a >= 0; a--) {
        for (let b = n - 1; b >= 0; b--) {
          lcp[a][b] = num.charAt(a) === num.charAt(b) ? lcp[a + 1][b + 1] + 1 : 0;
        }
      }
      // dp[i][j] = splits of num[0..j-1] whose last number is num[i..j-1].
      const dp: number[][] = [];
      for (let a = 0; a <= n; a++) dp.push(new Array(n + 1).fill(0));
      // suf[j][p] = dp[p][j] + dp[p+1][j] + ... + dp[j-1][j].
      const suf: number[][] = [];
      for (let a = 0; a <= n; a++) suf.push(new Array(n + 2).fill(0));
      for (let j = 1; j <= n; j++) {
        for (let i = 0; i < j; i++) {
          if (num.charAt(i) === "0") { dp[i][j] = 0; continue; }
          if (i === 0) { dp[0][j] = 1; continue; }
          const L = j - i;
          const lo = i - L + 1 > 0 ? i - L + 1 : 0;
          let total = suf[i][lo];
          const p = i - L;
          if (p >= 0) {
            const c = lcp[p][i];
            if (c >= L || num.charAt(p + c) < num.charAt(i + c)) {
              total = (total + dp[p][i]) % MOD5;
            }
          }
          dp[i][j] = total;
        }
        for (let p = j - 1; p >= 0; p--) suf[j][p] = (suf[j][p + 1] + dp[p][j]) % MOD5;
      }
      return suf[n][0];
    };
    return {
      slug: "number-of-ways-to-separate-numbers",
      title: "Number of Ways to Separate Numbers",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Suffix Array", "Prefix Sum", "Google", "Amazon", "Meta"],
      signature: { funcName: "numberOfCombinations", params: [{ name: "num", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A list of positive integers was written down with no separators and no leading zeros, leaving the digit string `num`. The list was **non-decreasing**.\n\nReturn how many such lists could have produced `num`, **modulo 10⁹ + 7**.",
        [
          { in: 'num = "327"', out: "2", note: "`[327]` and `[3, 27]`. `[32, 7]` fails because 32 > 7." },
          { in: 'num = "094"', out: "0", note: "A leading zero is impossible." },
          { in: 'num = "9999999999999"', out: "101" },
        ],
        ["1 <= num.length <= 500", "num consists of digits '0' through '9'."]),
      hints: [
        "`dp[i][j]` = the number of valid lists for `num[0..j-1]` whose **last** number is `num[i..j-1]`.",
        "The previous number is shorter (always fine, given no leading zeros) or exactly the same length (compare it).",
        "The \"shorter\" case is a contiguous range of `dp[p][i]`, so keep suffix sums; the equal-length case needs one comparison, which a longest-common-prefix table answers in O(1).",
      ],
      editorial: explain({
        idea: "Let `dp[i][j]` count the splits of `num[0..j-1]` whose last number occupies `num[i..j-1]`. Its predecessor `num[p..i-1]` is valid when it is **shorter** than the current number — automatic, since no number has a leading zero — or the **same length** and lexicographically no larger. The shorter case is a suffix-sum lookup; the equal case is one comparison, decided in O(1) by a longest-common-prefix table.",
        steps: [
          "Return 0 if `num` begins with `'0'`.",
          "Build `lcp[a][b] = (num[a] == num[b]) ? lcp[a+1][b+1] + 1 : 0`.",
          "Process `j` from 1 to `n`. For each `i < j` with `num[i] != '0'`, let `L = j - i`.",
          "Add the suffix sum of `dp[p][i]` over `p >= i - L + 1` — every predecessor strictly shorter than `L`.",
          "If `p = i - L` is in range, compare `num[p..i-1]` with `num[i..j-1]` using `lcp[p][i]` and add `dp[p][i]` when it is no larger.",
          "After finishing column `j`, build its suffix sums. The answer is the full column sum at `j = n`.",
        ],
        why: "Two observations make an O(n²) solution possible where a naive one is O(n³). First, a strictly shorter number is automatically smaller, because leading zeros are banned — so an entire range of predecessors needs no comparison at all, and a suffix sum collapses it to one lookup. Second, the only comparisons left are between equal-length substrings, and `lcp` answers each in constant time by finding the first position where they differ.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "A number may not begin with `'0'`, which is exactly what licenses the \"shorter implies smaller\" shortcut.",
          "The predecessor of equal length needs `<=`, not `<` — repeated values are allowed in a non-decreasing list.",
          "The suffix sums for column `j` must be built only after every `dp[i][j]` is final.",
        ],
      }),
      examples: [
        { input: '"327"', expectedOutput: "2" },
        { input: '"094"', expectedOutput: "0" },
        { input: '"9999999999999"', expectedOutput: "101" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 16);
        // A small digit alphabet makes equal-length ties common.
        const digits = "0123";
        let num = String(ri(rng, 0, 3));
        for (let i = 1; i < n; i++) num += digits.charAt(ri(rng, 0, 3));
        return { input: `"${num}"`, expectedOutput: String(ref(num)) };
      },
      solutions: {
        python: `def numberOfCombinations(num: str) -> int:\n    MOD = 10**9 + 7\n    n = len(num)\n    if num[0] == "0":\n        return 0\n    lcp = [[0] * (n + 1) for _ in range(n + 1)]\n    for a in range(n - 1, -1, -1):\n        for b in range(n - 1, -1, -1):\n            lcp[a][b] = lcp[a + 1][b + 1] + 1 if num[a] == num[b] else 0\n    dp = [[0] * (n + 1) for _ in range(n + 1)]\n    suf = [[0] * (n + 2) for _ in range(n + 1)]\n    for j in range(1, n + 1):\n        for i in range(j):\n            if num[i] == "0":\n                dp[i][j] = 0\n                continue\n            if i == 0:\n                dp[0][j] = 1\n                continue\n            length = j - i\n            lo = max(0, i - length + 1)\n            total = suf[i][lo]\n            p = i - length\n            if p >= 0:\n                c = lcp[p][i]\n                if c >= length or num[p + c] < num[i + c]:\n                    total = (total + dp[p][i]) % MOD\n            dp[i][j] = total\n        for p in range(j - 1, -1, -1):\n            suf[j][p] = (suf[j][p + 1] + dp[p][j]) % MOD\n    return suf[n][0]`,
        javascript: `var numberOfCombinations = function(num) {\n    var MOD = 1000000007;\n    var n = num.length, a, b, i, j, p;\n    if (num.charAt(0) === "0") return 0;\n    var grid = function(w) {\n        var t = [];\n        for (var x = 0; x <= n; x++) {\n            var row = [];\n            for (var y = 0; y < w; y++) row.push(0);\n            t.push(row);\n        }\n        return t;\n    };\n    var lcp = grid(n + 1);\n    for (a = n - 1; a >= 0; a--) {\n        for (b = n - 1; b >= 0; b--) {\n            lcp[a][b] = num.charAt(a) === num.charAt(b) ? lcp[a + 1][b + 1] + 1 : 0;\n        }\n    }\n    var dp = grid(n + 1);\n    var suf = grid(n + 2);\n    for (j = 1; j <= n; j++) {\n        for (i = 0; i < j; i++) {\n            if (num.charAt(i) === "0") { dp[i][j] = 0; continue; }\n            if (i === 0) { dp[0][j] = 1; continue; }\n            var L = j - i;\n            var lo = i - L + 1 > 0 ? i - L + 1 : 0;\n            var total = suf[i][lo];\n            p = i - L;\n            if (p >= 0) {\n                var c = lcp[p][i];\n                if (c >= L || num.charAt(p + c) < num.charAt(i + c)) {\n                    total = (total + dp[p][i]) % MOD;\n                }\n            }\n            dp[i][j] = total;\n        }\n        for (p = j - 1; p >= 0; p--) suf[j][p] = (suf[j][p + 1] + dp[p][j]) % MOD;\n    }\n    return suf[n][0];\n};`,
        typescript: `function numberOfCombinations(num: string): number {\n    var MOD = 1000000007;\n    var n = num.length, a: number, b: number, i: number, j: number, p: number;\n    if (num.charAt(0) === "0") return 0;\n    var grid = function(w: number): number[][] {\n        var t: number[][] = [];\n        for (var x = 0; x <= n; x++) {\n            var row: number[] = [];\n            for (var y = 0; y < w; y++) row.push(0);\n            t.push(row);\n        }\n        return t;\n    };\n    var lcp = grid(n + 1);\n    for (a = n - 1; a >= 0; a--) {\n        for (b = n - 1; b >= 0; b--) {\n            lcp[a][b] = num.charAt(a) === num.charAt(b) ? lcp[a + 1][b + 1] + 1 : 0;\n        }\n    }\n    var dp = grid(n + 1);\n    var suf = grid(n + 2);\n    for (j = 1; j <= n; j++) {\n        for (i = 0; i < j; i++) {\n            if (num.charAt(i) === "0") { dp[i][j] = 0; continue; }\n            if (i === 0) { dp[0][j] = 1; continue; }\n            var L = j - i;\n            var lo = i - L + 1 > 0 ? i - L + 1 : 0;\n            var total = suf[i][lo];\n            p = i - L;\n            if (p >= 0) {\n                var c = lcp[p][i];\n                if (c >= L || num.charAt(p + c) < num.charAt(i + c)) {\n                    total = (total + dp[p][i]) % MOD;\n                }\n            }\n            dp[i][j] = total;\n        }\n        for (p = j - 1; p >= 0; p--) suf[j][p] = (suf[j][p + 1] + dp[p][j]) % MOD;\n    }\n    return suf[n][0];\n}`,
        java: `public static int numberOfCombinations(String num) {\n    final long MOD = 1000000007L;\n    int n = num.length();\n    if (num.charAt(0) == '0') return 0;\n    int[][] lcp = new int[n + 1][n + 1];\n    for (int a = n - 1; a >= 0; a--) {\n        for (int b = n - 1; b >= 0; b--) {\n            lcp[a][b] = num.charAt(a) == num.charAt(b) ? lcp[a + 1][b + 1] + 1 : 0;\n        }\n    }\n    long[][] dp = new long[n + 1][n + 1];\n    long[][] suf = new long[n + 1][n + 2];\n    for (int j = 1; j <= n; j++) {\n        for (int i = 0; i < j; i++) {\n            if (num.charAt(i) == '0') {\n                dp[i][j] = 0;\n                continue;\n            }\n            if (i == 0) {\n                dp[0][j] = 1;\n                continue;\n            }\n            int L = j - i;\n            int lo = Math.max(0, i - L + 1);\n            long total = suf[i][lo];\n            int p = i - L;\n            if (p >= 0) {\n                int c = lcp[p][i];\n                if (c >= L || num.charAt(p + c) < num.charAt(i + c)) {\n                    total = (total + dp[p][i]) % MOD;\n                }\n            }\n            dp[i][j] = total;\n        }\n        for (int p = j - 1; p >= 0; p--) suf[j][p] = (suf[j][p + 1] + dp[p][j]) % MOD;\n    }\n    return (int) suf[n][0];\n}`,
        cpp: `int numberOfCombinations(string num) {\n    const long long MOD = 1000000007LL;\n    int n = (int) num.size();\n    if (num[0] == '0') return 0;\n    vector<vector<int>> lcp(n + 1, vector<int>(n + 1, 0));\n    for (int a = n - 1; a >= 0; a--) {\n        for (int b = n - 1; b >= 0; b--) {\n            lcp[a][b] = num[a] == num[b] ? lcp[a + 1][b + 1] + 1 : 0;\n        }\n    }\n    vector<vector<long long>> dp(n + 1, vector<long long>(n + 1, 0));\n    vector<vector<long long>> suf(n + 1, vector<long long>(n + 2, 0));\n    for (int j = 1; j <= n; j++) {\n        for (int i = 0; i < j; i++) {\n            if (num[i] == '0') {\n                dp[i][j] = 0;\n                continue;\n            }\n            if (i == 0) {\n                dp[0][j] = 1;\n                continue;\n            }\n            int L = j - i;\n            int lo = max(0, i - L + 1);\n            long long total = suf[i][lo];\n            int p = i - L;\n            if (p >= 0) {\n                int c = lcp[p][i];\n                if (c >= L || num[p + c] < num[i + c]) total = (total + dp[p][i]) % MOD;\n            }\n            dp[i][j] = total;\n        }\n        for (int p = j - 1; p >= 0; p--) suf[j][p] = (suf[j][p + 1] + dp[p][j]) % MOD;\n    }\n    return (int) suf[n][0];\n}`,
        c: `int numberOfCombinations(char* num) {\n    const long long MOD = 1000000007LL;\n    int n = (int) strlen(num);\n    if (num[0] == '0') return 0;\n    int w1 = n + 1, w2 = n + 2;\n    int* lcp = (int*) calloc((size_t) (n + 1) * (size_t) w1, sizeof(int));\n    for (int a = n - 1; a >= 0; a--) {\n        for (int b = n - 1; b >= 0; b--) {\n            lcp[a * w1 + b] = num[a] == num[b] ? lcp[(a + 1) * w1 + (b + 1)] + 1 : 0;\n        }\n    }\n    long long* dp = (long long*) calloc((size_t) (n + 1) * (size_t) w1, sizeof(long long));\n    long long* suf = (long long*) calloc((size_t) (n + 1) * (size_t) w2, sizeof(long long));\n    for (int j = 1; j <= n; j++) {\n        for (int i = 0; i < j; i++) {\n            if (num[i] == '0') {\n                dp[i * w1 + j] = 0;\n                continue;\n            }\n            if (i == 0) {\n                dp[0 * w1 + j] = 1;\n                continue;\n            }\n            int L = j - i;\n            int lo = i - L + 1 > 0 ? i - L + 1 : 0;\n            long long total = suf[i * w2 + lo];\n            int p = i - L;\n            if (p >= 0) {\n                int c = lcp[p * w1 + i];\n                if (c >= L || num[p + c] < num[i + c]) total = (total + dp[p * w1 + i]) % MOD;\n            }\n            dp[i * w1 + j] = total;\n        }\n        for (int p = j - 1; p >= 0; p--) {\n            suf[j * w2 + p] = (suf[j * w2 + (p + 1)] + dp[p * w1 + j]) % MOD;\n        }\n    }\n    int answer = (int) suf[n * w2 + 0];\n    free(lcp);\n    free(dp);\n    free(suf);\n    return answer;\n}`,
        csharp: `public static int NumberOfCombinations(string num)\n{\n    const long MOD = 1000000007L;\n    int n = num.Length;\n    if (num[0] == '0') return 0;\n    var lcp = new int[n + 1, n + 1];\n    for (int a = n - 1; a >= 0; a--)\n    {\n        for (int b = n - 1; b >= 0; b--)\n        {\n            lcp[a, b] = num[a] == num[b] ? lcp[a + 1, b + 1] + 1 : 0;\n        }\n    }\n    var dp = new long[n + 1, n + 1];\n    var suf = new long[n + 1, n + 2];\n    for (int j = 1; j <= n; j++)\n    {\n        for (int i = 0; i < j; i++)\n        {\n            if (num[i] == '0') { dp[i, j] = 0; continue; }\n            if (i == 0) { dp[0, j] = 1; continue; }\n            int L = j - i;\n            int lo = Math.Max(0, i - L + 1);\n            long total = suf[i, lo];\n            int p = i - L;\n            if (p >= 0)\n            {\n                int c = lcp[p, i];\n                if (c >= L || num[p + c] < num[i + c]) total = (total + dp[p, i]) % MOD;\n            }\n            dp[i, j] = total;\n        }\n        for (int p = j - 1; p >= 0; p--) suf[j, p] = (suf[j, p + 1] + dp[p, j]) % MOD;\n    }\n    return (int) suf[n, 0];\n}`,
        go: `func numberOfCombinations(num string) int {\n\tconst MOD = 1000000007\n\tn := len(num)\n\tif num[0] == '0' {\n\t\treturn 0\n\t}\n\tgrid := func(w int) [][]int {\n\t\tt := make([][]int, n+1)\n\t\tfor i := range t {\n\t\t\tt[i] = make([]int, w)\n\t\t}\n\t\treturn t\n\t}\n\tlcp := grid(n + 1)\n\tfor a := n - 1; a >= 0; a-- {\n\t\tfor b := n - 1; b >= 0; b-- {\n\t\t\tif num[a] == num[b] {\n\t\t\t\tlcp[a][b] = lcp[a+1][b+1] + 1\n\t\t\t} else {\n\t\t\t\tlcp[a][b] = 0\n\t\t\t}\n\t\t}\n\t}\n\tdp := grid(n + 1)\n\tsuf := grid(n + 2)\n\tfor j := 1; j <= n; j++ {\n\t\tfor i := 0; i < j; i++ {\n\t\t\tif num[i] == '0' {\n\t\t\t\tdp[i][j] = 0\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tif i == 0 {\n\t\t\t\tdp[0][j] = 1\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tL := j - i\n\t\t\tlo := i - L + 1\n\t\t\tif lo < 0 {\n\t\t\t\tlo = 0\n\t\t\t}\n\t\t\ttotal := suf[i][lo]\n\t\t\tp := i - L\n\t\t\tif p >= 0 {\n\t\t\t\tc := lcp[p][i]\n\t\t\t\tif c >= L || num[p+c] < num[i+c] {\n\t\t\t\t\ttotal = (total + dp[p][i]) % MOD\n\t\t\t\t}\n\t\t\t}\n\t\t\tdp[i][j] = total\n\t\t}\n\t\tfor p := j - 1; p >= 0; p-- {\n\t\t\tsuf[j][p] = (suf[j][p+1] + dp[p][j]) % MOD\n\t\t}\n\t}\n\treturn suf[n][0]\n}`,
        kotlin: `fun numberOfCombinations(num: String): Int {\n    val mod = 1000000007L\n    val n = num.length\n    if (num[0] == '0') return 0\n    val lcp = Array(n + 1) { IntArray(n + 1) }\n    for (a in n - 1 downTo 0) {\n        for (b in n - 1 downTo 0) {\n            lcp[a][b] = if (num[a] == num[b]) lcp[a + 1][b + 1] + 1 else 0\n        }\n    }\n    val dp = Array(n + 1) { LongArray(n + 1) }\n    val suf = Array(n + 1) { LongArray(n + 2) }\n    for (j in 1..n) {\n        for (i in 0 until j) {\n            if (num[i] == '0') {\n                dp[i][j] = 0\n                continue\n            }\n            if (i == 0) {\n                dp[0][j] = 1\n                continue\n            }\n            val len = j - i\n            val lo = maxOf(0, i - len + 1)\n            var total = suf[i][lo]\n            val p = i - len\n            if (p >= 0) {\n                val c = lcp[p][i]\n                if (c >= len || num[p + c] < num[i + c]) total = (total + dp[p][i]) % mod\n            }\n            dp[i][j] = total\n        }\n        for (p in j - 1 downTo 0) suf[j][p] = (suf[j][p + 1] + dp[p][j]) % mod\n    }\n    return suf[n][0].toInt()\n}`,
        swift: `func numberOfCombinations(_ num: String) -> Int {\n    let mod = 1000000007\n    let chars = Array(num)\n    let n = chars.count\n    if chars[0] == "0" { return 0 }\n    var lcp = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: n + 1)\n    var a = n - 1\n    while a >= 0 {\n        var b = n - 1\n        while b >= 0 {\n            lcp[a][b] = chars[a] == chars[b] ? lcp[a + 1][b + 1] + 1 : 0\n            b -= 1\n        }\n        a -= 1\n    }\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: n + 1)\n    var suf = [[Int]](repeating: [Int](repeating: 0, count: n + 2), count: n + 1)\n    for j in 1...n {\n        for i in 0..<j {\n            if chars[i] == "0" {\n                dp[i][j] = 0\n                continue\n            }\n            if i == 0 {\n                dp[0][j] = 1\n                continue\n            }\n            let len = j - i\n            let lo = max(0, i - len + 1)\n            var total = suf[i][lo]\n            let p = i - len\n            if p >= 0 {\n                let c = lcp[p][i]\n                if c >= len || chars[p + c] < chars[i + c] {\n                    total = (total + dp[p][i]) % mod\n                }\n            }\n            dp[i][j] = total\n        }\n        var p = j - 1\n        while p >= 0 {\n            suf[j][p] = (suf[j][p + 1] + dp[p][j]) % mod\n            p -= 1\n        }\n    }\n    return suf[n][0]\n}`,
        rust: `fn numberOfCombinations(num: String) -> i32 {\n    const MOD: i64 = 1000000007;\n    let b = num.as_bytes();\n    let n = b.len();\n    if b[0] == b'0' {\n        return 0;\n    }\n    let mut lcp = vec![vec![0usize; n + 1]; n + 1];\n    for x in (0..n).rev() {\n        for y in (0..n).rev() {\n            lcp[x][y] = if b[x] == b[y] { lcp[x + 1][y + 1] + 1 } else { 0 };\n        }\n    }\n    let mut dp = vec![vec![0i64; n + 1]; n + 1];\n    let mut suf = vec![vec![0i64; n + 2]; n + 1];\n    for j in 1..=n {\n        for i in 0..j {\n            if b[i] == b'0' {\n                dp[i][j] = 0;\n                continue;\n            }\n            if i == 0 {\n                dp[0][j] = 1;\n                continue;\n            }\n            let len = j - i;\n            let lo = if i + 1 > len { i - len + 1 } else { 0 };\n            let mut total = suf[i][lo];\n            if i >= len {\n                let p = i - len;\n                let c = lcp[p][i];\n                if c >= len || b[p + c] < b[i + c] {\n                    total = (total + dp[p][i]) % MOD;\n                }\n            }\n            dp[i][j] = total;\n        }\n        for p in (0..j).rev() {\n            suf[j][p] = (suf[j][p + 1] + dp[p][j]) % MOD;\n        }\n    }\n    suf[n][0] as i32\n}`,
        php: `function numberOfCombinations($num) {\n    $MOD = 1000000007;\n    $n = strlen($num);\n    if ($num[0] === "0") return 0;\n    $lcp = [];\n    for ($x = 0; $x <= $n; $x++) $lcp[$x] = array_fill(0, $n + 1, 0);\n    for ($a = $n - 1; $a >= 0; $a--) {\n        for ($b = $n - 1; $b >= 0; $b--) {\n            $lcp[$a][$b] = $num[$a] === $num[$b] ? $lcp[$a + 1][$b + 1] + 1 : 0;\n        }\n    }\n    $dp = [];\n    $suf = [];\n    for ($x = 0; $x <= $n; $x++) {\n        $dp[$x] = array_fill(0, $n + 1, 0);\n        $suf[$x] = array_fill(0, $n + 2, 0);\n    }\n    for ($j = 1; $j <= $n; $j++) {\n        for ($i = 0; $i < $j; $i++) {\n            if ($num[$i] === "0") { $dp[$i][$j] = 0; continue; }\n            if ($i === 0) { $dp[0][$j] = 1; continue; }\n            $L = $j - $i;\n            $lo = max(0, $i - $L + 1);\n            $total = $suf[$i][$lo];\n            $p = $i - $L;\n            if ($p >= 0) {\n                $c = $lcp[$p][$i];\n                if ($c >= $L || $num[$p + $c] < $num[$i + $c]) $total = ($total + $dp[$p][$i]) % $MOD;\n            }\n            $dp[$i][$j] = $total;\n        }\n        for ($p = $j - 1; $p >= 0; $p--) $suf[$j][$p] = ($suf[$j][$p + 1] + $dp[$p][$j]) % $MOD;\n    }\n    return $suf[$n][0];\n}`,
        ruby: `def numberOfCombinations(num)\n  mod = 1000000007\n  n = num.length\n  return 0 if num[0] == "0"\n  lcp = Array.new(n + 1) { Array.new(n + 1, 0) }\n  (n - 1).downto(0) do |a|\n    (n - 1).downto(0) do |b|\n      lcp[a][b] = num[a] == num[b] ? lcp[a + 1][b + 1] + 1 : 0\n    end\n  end\n  dp = Array.new(n + 1) { Array.new(n + 1, 0) }\n  suf = Array.new(n + 1) { Array.new(n + 2, 0) }\n  (1..n).each do |j|\n    (0...j).each do |i|\n      if num[i] == "0"\n        dp[i][j] = 0\n        next\n      end\n      if i == 0\n        dp[0][j] = 1\n        next\n      end\n      len = j - i\n      lo = [0, i - len + 1].max\n      total = suf[i][lo]\n      p = i - len\n      if p >= 0\n        c = lcp[p][i]\n        total = (total + dp[p][i]) % mod if c >= len || num[p + c] < num[i + c]\n      end\n      dp[i][j] = total\n    end\n    (j - 1).downto(0) { |p| suf[j][p] = (suf[j][p + 1] + dp[p][j]) % mod }\n  end\n  suf[n][0]\nend`,
      },
    };
  })(),
];
