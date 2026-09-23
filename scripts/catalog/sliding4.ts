/**
 * Sliding-window problems — wave 4.
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks
 * "must-do" window set. Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap.
 */
import {
  bool,
  describe,
  explain,
  fmtIntArr,
  pick,
  randLower,
  ri,
  shuffle,
  type CatalogProblem,
  type Rng,
} from "./types.js";

export const SLIDING4_PROBLEMS: CatalogProblem[] = [

  // ── Maximum Sum Subarray of Size K (GFG) ────────────────────────
  (() => {
    const ref = (arr: number[], k: number) => {
      let sum = 0;
      for (let i = 0; i < k; i++) sum += arr[i];
      let best = sum;
      for (let i = k; i < arr.length; i++) {
        sum += arr[i] - arr[i - k];
        if (sum > best) best = sum;
      }
      return best;
    };
    return {
      slug: "maximum-sum-subarray-of-size-k",
      title: "Maximum Sum Subarray of Size K",
      difficulty: "EASY" as const,
      tags: ["Array", "Sliding Window", "Amazon", "Microsoft", "TCS"],
      signature: { funcName: "maximumSumSubarray", params: [{ name: "arr", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an array `arr` and a positive integer `k` (with `k <= arr.length`), return the maximum sum of any **contiguous** subarray of exactly `k` elements.",
        [
          { in: "arr = [100,200,300,400], k = 2", out: "700", note: "The last two elements give the best pair." },
          { in: "arr = [1,4,2,10,23,3,1,0,20], k = 4", out: "39", note: "[4,2,10,23] sums to 39." },
          { in: "arr = [-1,-2,-3], k = 2", out: "-3", note: "Even all-negative input has a best window." },
        ],
        ["1 <= k <= arr.length <= 100000", "-10000 <= arr[i] <= 10000"]),
      hints: [
        "Recomputing each window from scratch is `O(n · k)` — most of the work repeats.",
        "Two neighbouring windows differ by one element entering and one leaving.",
        "Seed the sum with the first `k` elements, then roll it forward.",
      ],
      editorial: explain({
        idea: "The canonical fixed-size window. Compute the first window's sum once, then slide: add the element entering on the right and subtract the one leaving on the left.",
        steps: [
          "Sum `arr[0 … k-1]` and record it as the best.",
          "For each `i` from `k` onwards, do `sum += arr[i] - arr[i - k]`.",
          "Keep the maximum seen.",
        ],
        why: "Window `[i-k+1, i]` and window `[i-k, i-1]` share `k-1` elements, so their sums differ by exactly the two boundary elements. Updating in constant time makes the whole scan linear instead of quadratic.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Initialising the best to `0` breaks on all-negative input — seed it with the first window.",
          "The roll must both add and subtract; forgetting the subtraction turns it into a prefix sum.",
          "Sums reach `10^5 · 10^4 = 10^9`, which fits `int` with little room to spare.",
        ],
      }),
      examples: [
        { input: "[100,200,300,400]\n2", expectedOutput: "700" },
        { input: "[1,4,2,10,23,3,1,0,20]\n4", expectedOutput: "39" },
        { input: "[-1,-2,-3]\n2", expectedOutput: "-3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const hi = rng() < 0.6 ? 50 : 10000;
        const arr = Array.from({ length: n }, () => ri(rng, -hi, hi));
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(arr)}\n${k}`, expectedOutput: String(ref(arr, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumSumSubarray(arr: List[int], k: int) -> int:\n    total = sum(arr[:k])\n    best = total\n    for i in range(k, len(arr)):\n        total += arr[i] - arr[i - k]\n        best = max(best, total)\n    return best`,
        javascript: `var maximumSumSubarray = function(arr, k) {\n    var sum = 0;\n    for (var i = 0; i < k; i++) sum += arr[i];\n    var best = sum;\n    for (var j = k; j < arr.length; j++) {\n        sum += arr[j] - arr[j - k];\n        if (sum > best) best = sum;\n    }\n    return best;\n};`,
        typescript: `function maximumSumSubarray(arr: number[], k: number): number {\n    var sum = 0;\n    for (var i = 0; i < k; i++) sum += arr[i];\n    var best = sum;\n    for (var j = k; j < arr.length; j++) {\n        sum += arr[j] - arr[j - k];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,
        java: `public static int maximumSumSubarray(int[] arr, int k) {\n    int sum = 0;\n    for (int i = 0; i < k; i++) sum += arr[i];\n    int best = sum;\n    for (int i = k; i < arr.length; i++) {\n        sum += arr[i] - arr[i - k];\n        best = Math.max(best, sum);\n    }\n    return best;\n}`,
        cpp: `int maximumSumSubarray(vector<int>& arr, int k) {\n    int sum = 0;\n    for (int i = 0; i < k; i++) sum += arr[i];\n    int best = sum;\n    for (int i = k; i < (int) arr.size(); i++) {\n        sum += arr[i] - arr[i - k];\n        best = max(best, sum);\n    }\n    return best;\n}`,
        c: `int maximumSumSubarray(int* arr, int arrSize, int k) {\n    int sum = 0;\n    for (int i = 0; i < k; i++) sum += arr[i];\n    int best = sum;\n    for (int i = k; i < arrSize; i++) {\n        sum += arr[i] - arr[i - k];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,
        csharp: `public static int MaximumSumSubarray(int[] arr, int k)\n{\n    int sum = 0;\n    for (int i = 0; i < k; i++) sum += arr[i];\n    int best = sum;\n    for (int i = k; i < arr.Length; i++)\n    {\n        sum += arr[i] - arr[i - k];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,
        go: `func maximumSumSubarray(arr []int, k int) int {\n\tsum := 0\n\tfor i := 0; i < k; i++ {\n\t\tsum += arr[i]\n\t}\n\tbest := sum\n\tfor i := k; i < len(arr); i++ {\n\t\tsum += arr[i] - arr[i-k]\n\t\tif sum > best {\n\t\t\tbest = sum\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maximumSumSubarray(arr: IntArray, k: Int): Int {\n    var sum = 0\n    for (i in 0 until k) sum += arr[i]\n    var best = sum\n    for (i in k until arr.size) {\n        sum += arr[i] - arr[i - k]\n        if (sum > best) best = sum\n    }\n    return best\n}`,
        swift: `func maximumSumSubarray(_ arr: [Int], _ k: Int) -> Int {\n    var sum = 0\n    for i in 0..<k { sum += arr[i] }\n    var best = sum\n    var i = k\n    while i < arr.count {\n        sum += arr[i] - arr[i - k]\n        if sum > best { best = sum }\n        i += 1\n    }\n    return best\n}`,
        rust: `fn maximumSumSubarray(arr: Vec<i32>, k: i32) -> i32 {\n    let k = k as usize;\n    let mut sum: i32 = 0;\n    for i in 0..k {\n        sum += arr[i];\n    }\n    let mut best = sum;\n    for i in k..arr.len() {\n        sum += arr[i] - arr[i - k];\n        if sum > best {\n            best = sum;\n        }\n    }\n    best\n}`,
        php: `function maximumSumSubarray($arr, $k) {\n    $sum = 0;\n    for ($i = 0; $i < $k; $i++) $sum += $arr[$i];\n    $best = $sum;\n    for ($i = $k; $i < count($arr); $i++) {\n        $sum += $arr[$i] - $arr[$i - $k];\n        if ($sum > $best) $best = $sum;\n    }\n    return $best;\n}`,
        ruby: `def maximumSumSubarray(arr, k)\n  sum = arr[0, k].sum\n  best = sum\n  (k...arr.length).each do |i|\n    sum += arr[i] - arr[i - k]\n    best = sum if sum > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Find the K-Beauty of a Number (LC 2269) ─────────────────────
  (() => {
    const ref = (num: number, k: number) => {
      const s = String(num);
      let count = 0;
      for (let i = 0; i + k <= s.length; i++) {
        const v = parseInt(s.substring(i, i + k), 10);
        if (v !== 0 && num % v === 0) count++;
      }
      return count;
    };
    return {
      slug: "find-the-k-beauty-of-a-number",
      title: "Find the K-Beauty of a Number",
      difficulty: "EASY" as const,
      tags: ["Math", "String", "Sliding Window", "Amazon", "Adobe", "Infosys"],
      signature: { funcName: "divisorSubstrings", params: [{ name: "num", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The **k-beauty** of `num` is the number of substrings of length `k` in its decimal representation that are divisors of `num`. A substring whose value is `0` never counts, and leading zeros are allowed.\n\nReturn the k-beauty of `num`.",
        [
          { in: "num = 240, k = 2", out: "2", note: "\"24\" and \"40\" both divide 240." },
          { in: "num = 430043, k = 2", out: "2", note: "\"43\" appears twice and divides 430043; \"30\", \"00\" and \"04\" do not." },
          { in: "num = 1, k = 1", out: "1" },
        ],
        ["1 <= num <= 1000000000", "1 <= k <= number of digits in num"]),
      hints: [
        "Work on the decimal string — the substrings are windows over its digits.",
        "A window's value can be rolled forward, but at these sizes parsing each window directly is fine.",
        "Guard against a window that parses to zero: division by it is undefined, and it never divides anything.",
      ],
      editorial: explain({
        idea: "Convert the number to a string and slide a window of `k` digits over it, testing each window's value for divisibility.",
        steps: [
          "Render `num` as a decimal string `s`.",
          "For every start `i` with `i + k <= |s|`, parse `s[i … i+k-1]` as an integer.",
          "Count it when it is non-zero and divides `num`.",
        ],
        why: "There are at most `10` digits, so at most `10` windows; each parse is bounded work. The zero guard matters because leading zeros are permitted, so a window such as `\"00\"` really does have value 0.",
        time: "O(d · k) where d is the digit count",
        space: "O(d)",
        pitfalls: [
          "Dividing by a zero-valued window crashes or throws in most languages.",
          "Stripping leading zeros changes the window's length and is not what the problem asks.",
          "`num` fits `int`, but a `k`-digit window of a 10-digit number can too — no widening is needed.",
        ],
      }),
      examples: [
        { input: "240\n2", expectedOutput: "2" },
        { input: "430043\n2", expectedOutput: "2" },
        { input: "1\n1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const num = rng() < 0.5 ? ri(rng, 1, 999) : ri(rng, 1, 1000000000);
        const digits = String(num).length;
        const k = ri(rng, 1, digits);
        return { input: `${num}\n${k}`, expectedOutput: String(ref(num, k)) };
      },
      solutions: {
        python: `def divisorSubstrings(num: int, k: int) -> int:\n    s = str(num)\n    count = 0\n    for i in range(len(s) - k + 1):\n        v = int(s[i:i + k])\n        if v != 0 and num % v == 0:\n            count += 1\n    return count`,
        javascript: `var divisorSubstrings = function(num, k) {\n    var s = String(num);\n    var count = 0;\n    for (var i = 0; i + k <= s.length; i++) {\n        var v = parseInt(s.substring(i, i + k), 10);\n        if (v !== 0 && num % v === 0) count++;\n    }\n    return count;\n};`,
        typescript: `function divisorSubstrings(num: number, k: number): number {\n    var s = String(num);\n    var count = 0;\n    for (var i = 0; i + k <= s.length; i++) {\n        var v = parseInt(s.substring(i, i + k), 10);\n        if (v !== 0 && num % v === 0) count++;\n    }\n    return count;\n}`,
        java: `public static int divisorSubstrings(int num, int k) {\n    String s = Integer.toString(num);\n    int count = 0;\n    for (int i = 0; i + k <= s.length(); i++) {\n        int v = Integer.parseInt(s.substring(i, i + k));\n        if (v != 0 && num % v == 0) count++;\n    }\n    return count;\n}`,
        cpp: `int divisorSubstrings(int num, int k) {\n    string s = to_string(num);\n    int count = 0;\n    for (int i = 0; i + k <= (int) s.size(); i++) {\n        int v = stoi(s.substr(i, k));\n        if (v != 0 && num % v == 0) count++;\n    }\n    return count;\n}`,
        c: `int divisorSubstrings(int num, int k) {\n    char s[16];\n    sprintf(s, "%d", num);\n    int n = (int) strlen(s);\n    int count = 0;\n    for (int i = 0; i + k <= n; i++) {\n        int v = 0;\n        for (int t = 0; t < k; t++) v = v * 10 + (s[i + t] - '0');\n        if (v != 0 && num % v == 0) count++;\n    }\n    return count;\n}`,
        csharp: `public static int DivisorSubstrings(int num, int k)\n{\n    string s = num.ToString();\n    int count = 0;\n    for (int i = 0; i + k <= s.Length; i++)\n    {\n        int v = int.Parse(s.Substring(i, k));\n        if (v != 0 && num % v == 0) count++;\n    }\n    return count;\n}`,
        go: `func divisorSubstrings(num int, k int) int {\n\ts := strconv.Itoa(num)\n\tcount := 0\n\tfor i := 0; i+k <= len(s); i++ {\n\t\tv, _ := strconv.Atoi(s[i : i+k])\n\t\tif v != 0 && num%v == 0 {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun divisorSubstrings(num: Int, k: Int): Int {\n    val s = num.toString()\n    var count = 0\n    for (i in 0..s.length - k) {\n        val v = s.substring(i, i + k).toInt()\n        if (v != 0 && num % v == 0) count++\n    }\n    return count\n}`,
        swift: `func divisorSubstrings(_ num: Int, _ k: Int) -> Int {\n    let s = Array(String(num))\n    var count = 0\n    var i = 0\n    while i + k <= s.count {\n        let v = Int(String(s[i..<(i + k)])) ?? 0\n        if v != 0 && num % v == 0 { count += 1 }\n        i += 1\n    }\n    return count\n}`,
        rust: `fn divisorSubstrings(num: i32, k: i32) -> i32 {\n    let s = num.to_string();\n    let bytes = s.as_bytes();\n    let k = k as usize;\n    let mut count = 0i32;\n    let mut i = 0usize;\n    while i + k <= bytes.len() {\n        let mut v: i32 = 0;\n        for t in 0..k {\n            v = v * 10 + (bytes[i + t] - b'0') as i32;\n        }\n        if v != 0 && num % v == 0 {\n            count += 1;\n        }\n        i += 1;\n    }\n    count\n}`,
        php: `function divisorSubstrings($num, $k) {\n    $s = (string) $num;\n    $count = 0;\n    for ($i = 0; $i + $k <= strlen($s); $i++) {\n        $v = (int) substr($s, $i, $k);\n        if ($v !== 0 && $num % $v === 0) $count++;\n    }\n    return $count;\n}`,
        ruby: `def divisorSubstrings(num, k)\n  s = num.to_s\n  count = 0\n  (0..s.length - k).each do |i|\n    v = s[i, k].to_i\n    count += 1 if v != 0 && num % v == 0\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Substrings of Size Three with Distinct Characters (LC 1876) ──
  (() => {
    const ref = (s: string) => {
      let count = 0;
      for (let i = 0; i + 3 <= s.length; i++) {
        if (s[i] !== s[i + 1] && s[i + 1] !== s[i + 2] && s[i] !== s[i + 2]) count++;
      }
      return count;
    };
    return {
      slug: "substrings-of-size-three-with-distinct-characters",
      title: "Substrings of Size Three with Distinct Characters",
      difficulty: "EASY" as const,
      tags: ["String", "Hash Table", "Sliding Window", "Counting", "Amazon", "Adobe", "Cognizant"],
      signature: { funcName: "countGoodSubstrings", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A string is **good** when it has no repeated characters.\n\nReturn the number of good substrings of length exactly three in `s`. Substrings that occur more than once are counted each time.",
        [
          { in: 's = "codekairo"', out: "7", note: "Every window of three is good: cod, ode, dek, eka, kai, air, iro." },
          { in: 's = "xyzzaz"', out: "1", note: "Only \"xyz\" has three distinct characters." },
          { in: 's = "aababcabc"', out: "4", note: "\"abc\", \"bca\", \"cab\" and \"abc\" again." },
        ],
        ["1 <= s.length <= 100000", "s consists of lowercase English letters."]),
      hints: [
        "The window is fixed at three characters, so there are at most `n - 2` of them.",
        "Three characters are distinct exactly when all three pairwise comparisons differ.",
        "No tally is needed at this size — three comparisons per window is enough.",
      ],
      editorial: explain({
        idea: "With a window this small, the distinctness test is three equality checks, so a direct scan over every window of length three is already linear.",
        steps: [
          "Walk `i` from 0 while `i + 3 <= |s|`.",
          "Check `s[i] != s[i+1]`, `s[i+1] != s[i+2]` and `s[i] != s[i+2]`.",
          "Count the windows that pass.",
        ],
        why: "Three values are pairwise distinct precisely when all three unordered pairs differ; checking only adjacent pairs would accept `\"aba\"`. Each window costs constant time, so the whole scan is `O(n)`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Comparing only neighbouring characters wrongly accepts patterns like `\"aba\"`.",
          "A string shorter than three characters has no windows and the answer is 0.",
          "Repeated occurrences of the same substring each count — this is not a distinct-substring count.",
        ],
      }),
      examples: [
        { input: '"codekairo"', expectedOutput: "7" },
        { input: '"xyzzaz"', expectedOutput: "1" },
        { input: '"aababcabc"', expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const alpha = rng() < 0.6 ? ["a", "b", "c"] : ["a", "b", "c", "d", "e", "f"];
        const s = Array.from({ length: ri(rng, 1, 40) }, () => pick(rng, alpha)).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def countGoodSubstrings(s: str) -> int:\n    count = 0\n    for i in range(len(s) - 2):\n        if s[i] != s[i + 1] and s[i + 1] != s[i + 2] and s[i] != s[i + 2]:\n            count += 1\n    return count`,
        javascript: `var countGoodSubstrings = function(s) {\n    var count = 0;\n    for (var i = 0; i + 3 <= s.length; i++) {\n        var a = s.charAt(i), b = s.charAt(i + 1), c = s.charAt(i + 2);\n        if (a !== b && b !== c && a !== c) count++;\n    }\n    return count;\n};`,
        typescript: `function countGoodSubstrings(s: string): number {\n    var count = 0;\n    for (var i = 0; i + 3 <= s.length; i++) {\n        var a = s.charAt(i), b = s.charAt(i + 1), c = s.charAt(i + 2);\n        if (a !== b && b !== c && a !== c) count++;\n    }\n    return count;\n}`,
        java: `public static int countGoodSubstrings(String s) {\n    int count = 0;\n    for (int i = 0; i + 3 <= s.length(); i++) {\n        char a = s.charAt(i), b = s.charAt(i + 1), c = s.charAt(i + 2);\n        if (a != b && b != c && a != c) count++;\n    }\n    return count;\n}`,
        cpp: `int countGoodSubstrings(string s) {\n    int count = 0;\n    for (int i = 0; i + 3 <= (int) s.size(); i++) {\n        if (s[i] != s[i + 1] && s[i + 1] != s[i + 2] && s[i] != s[i + 2]) count++;\n    }\n    return count;\n}`,
        c: `int countGoodSubstrings(char* s) {\n    int n = (int) strlen(s);\n    int count = 0;\n    for (int i = 0; i + 3 <= n; i++) {\n        if (s[i] != s[i + 1] && s[i + 1] != s[i + 2] && s[i] != s[i + 2]) count++;\n    }\n    return count;\n}`,
        csharp: `public static int CountGoodSubstrings(string s)\n{\n    int count = 0;\n    for (int i = 0; i + 3 <= s.Length; i++)\n    {\n        char a = s[i], b = s[i + 1], c = s[i + 2];\n        if (a != b && b != c && a != c) count++;\n    }\n    return count;\n}`,
        go: `func countGoodSubstrings(s string) int {\n\tcount := 0\n\tfor i := 0; i+3 <= len(s); i++ {\n\t\tif s[i] != s[i+1] && s[i+1] != s[i+2] && s[i] != s[i+2] {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countGoodSubstrings(s: String): Int {\n    var count = 0\n    for (i in 0..s.length - 3) {\n        if (s[i] != s[i + 1] && s[i + 1] != s[i + 2] && s[i] != s[i + 2]) count++\n    }\n    return count\n}`,
        swift: `func countGoodSubstrings(_ s: String) -> Int {\n    let a = Array(s)\n    var count = 0\n    var i = 0\n    while i + 3 <= a.count {\n        if a[i] != a[i + 1] && a[i + 1] != a[i + 2] && a[i] != a[i + 2] { count += 1 }\n        i += 1\n    }\n    return count\n}`,
        rust: `fn countGoodSubstrings(s: String) -> i32 {\n    let b = s.as_bytes();\n    let mut count = 0i32;\n    let mut i = 0usize;\n    while i + 3 <= b.len() {\n        if b[i] != b[i + 1] && b[i + 1] != b[i + 2] && b[i] != b[i + 2] {\n            count += 1;\n        }\n        i += 1;\n    }\n    count\n}`,
        php: `function countGoodSubstrings($s) {\n    $count = 0;\n    $n = strlen($s);\n    for ($i = 0; $i + 3 <= $n; $i++) {\n        if ($s[$i] !== $s[$i + 1] && $s[$i + 1] !== $s[$i + 2] && $s[$i] !== $s[$i + 2]) $count++;\n    }\n    return $count;\n}`,
        ruby: `def countGoodSubstrings(s)\n  count = 0\n  (0..s.length - 3).each do |i|\n    count += 1 if s[i] != s[i + 1] && s[i + 1] != s[i + 2] && s[i] != s[i + 2]\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Defuse the Bomb (LC 1652) ───────────────────────────────────
  (() => {
    const ref = (code: number[], k: number) => {
      const n = code.length;
      const out = new Array(n).fill(0);
      if (k === 0) return out;
      for (let i = 0; i < n; i++) {
        let sum = 0;
        if (k > 0) {
          for (let t = 1; t <= k; t++) sum += code[(i + t) % n];
        } else {
          for (let t = 1; t <= -k; t++) sum += code[((i - t) % n + n) % n];
        }
        out[i] = sum;
      }
      return out;
    };
    return {
      slug: "defuse-the-bomb",
      title: "Defuse the Bomb",
      difficulty: "EASY" as const,
      tags: ["Array", "Sliding Window", "Simulation", "Amazon", "Microsoft", "Wipro"],
      signature: { funcName: "decrypt", params: [{ name: "code", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "The bomb's code is a **circular** array. To defuse it, replace every number simultaneously:\n\n- if `k > 0`, with the sum of the next `k` numbers;\n- if `k < 0`, with the sum of the previous `|k|` numbers;\n- if `k == 0`, with `0`.\n\nReturn the decrypted array.",
        [
          { in: "code = [5,7,1,4], k = 3", out: "[12,10,16,13]", note: "Index 0 takes 7+1+4; the circle wraps for the rest." },
          { in: "code = [1,2,3,4], k = 0", out: "[0,0,0,0]" },
          { in: "code = [2,4,9,3], k = -2", out: "[12,5,6,13]", note: "Index 0 takes the previous two, which wrap to 9 and 3." },
        ],
        ["1 <= code.length <= 100", "1 <= code[i] <= 100", "-code.length < k < code.length"]),
      hints: [
        "The replacements happen **simultaneously**, so read from the original array and write to a new one.",
        "Modular indexing handles the wrap: `(i + t) % n` going forward, `((i - t) % n + n) % n` going back.",
        "A sliding window of size `|k|` also works and is what the problem is named after.",
      ],
      editorial: explain({
        idea: "For each index, sum the `|k|` neighbours on the appropriate side, wrapping with modular arithmetic. At `n <= 100` the direct double loop is already fast enough; a rolling window makes it linear.",
        steps: [
          "Allocate a fresh output array so the reads always see the original values.",
          "`k == 0` returns all zeros.",
          "For `k > 0`, sum `code[(i + t) % n]` for `t` in `1 … k`; for `k < 0`, sum `code[((i - t) % n + n) % n]` for `t` in `1 … |k|`.",
        ],
        why: "The circular index formula maps any offset back into range, and the extra `+ n` before the second modulo fixes languages where `%` on a negative operand yields a negative result. Writing into a separate array is what makes the replacement simultaneous — updating in place would feed already-decrypted values into later sums.",
        time: "O(n · |k|), or O(n) with a rolling window",
        space: "O(n)",
        pitfalls: [
          "Updating `code` in place corrupts the later sums.",
          "In C, Java, Go and JavaScript, `-1 % n` is negative — normalise before indexing.",
          "The current element is never included; the offsets start at 1.",
        ],
      }),
      examples: [
        { input: "[5,7,1,4]\n3", expectedOutput: "[12,10,16,13]" },
        { input: "[1,2,3,4]\n0", expectedOutput: "[0,0,0,0]" },
        { input: "[2,4,9,3]\n-2", expectedOutput: "[12,5,6,13]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const code = Array.from({ length: n }, () => ri(rng, 1, 100));
        const k = ri(rng, -(n - 1), n - 1);
        return { input: `${fmtIntArr(code)}\n${k}`, expectedOutput: fmtIntArr(ref(code, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef decrypt(code: List[int], k: int) -> List[int]:\n    n = len(code)\n    out = [0] * n\n    if k == 0:\n        return out\n    for i in range(n):\n        total = 0\n        if k > 0:\n            for t in range(1, k + 1):\n                total += code[(i + t) % n]\n        else:\n            for t in range(1, -k + 1):\n                total += code[(i - t) % n]\n        out[i] = total\n    return out`,
        javascript: `var decrypt = function(code, k) {\n    var n = code.length;\n    var out = [];\n    for (var t = 0; t < n; t++) out.push(0);\n    if (k === 0) return out;\n    for (var i = 0; i < n; i++) {\n        var sum = 0, j;\n        if (k > 0) {\n            for (j = 1; j <= k; j++) sum += code[(i + j) % n];\n        } else {\n            for (j = 1; j <= -k; j++) sum += code[((i - j) % n + n) % n];\n        }\n        out[i] = sum;\n    }\n    return out;\n};`,
        typescript: `function decrypt(code: number[], k: number): number[] {\n    var n = code.length;\n    var out: number[] = [];\n    for (var t = 0; t < n; t++) out.push(0);\n    if (k === 0) return out;\n    for (var i = 0; i < n; i++) {\n        var sum = 0, j: number;\n        if (k > 0) {\n            for (j = 1; j <= k; j++) sum += code[(i + j) % n];\n        } else {\n            for (j = 1; j <= -k; j++) sum += code[((i - j) % n + n) % n];\n        }\n        out[i] = sum;\n    }\n    return out;\n}`,
        java: `public static int[] decrypt(int[] code, int k) {\n    int n = code.length;\n    int[] out = new int[n];\n    if (k == 0) return out;\n    for (int i = 0; i < n; i++) {\n        int sum = 0;\n        if (k > 0) {\n            for (int t = 1; t <= k; t++) sum += code[(i + t) % n];\n        } else {\n            for (int t = 1; t <= -k; t++) sum += code[((i - t) % n + n) % n];\n        }\n        out[i] = sum;\n    }\n    return out;\n}`,
        cpp: `vector<int> decrypt(vector<int>& code, int k) {\n    int n = (int) code.size();\n    vector<int> out(n, 0);\n    if (k == 0) return out;\n    for (int i = 0; i < n; i++) {\n        int sum = 0;\n        if (k > 0) {\n            for (int t = 1; t <= k; t++) sum += code[(i + t) % n];\n        } else {\n            for (int t = 1; t <= -k; t++) sum += code[((i - t) % n + n) % n];\n        }\n        out[i] = sum;\n    }\n    return out;\n}`,
        c: `int* decrypt(int* code, int codeSize, int k, int* returnSize) {\n    int n = codeSize;\n    int* out = (int*) calloc((size_t) n, sizeof(int));\n    *returnSize = n;\n    if (k == 0) return out;\n    for (int i = 0; i < n; i++) {\n        int sum = 0;\n        if (k > 0) {\n            for (int t = 1; t <= k; t++) sum += code[(i + t) % n];\n        } else {\n            for (int t = 1; t <= -k; t++) sum += code[((i - t) % n + n) % n];\n        }\n        out[i] = sum;\n    }\n    return out;\n}`,
        csharp: `public static int[] Decrypt(int[] code, int k)\n{\n    int n = code.Length;\n    int[] out_ = new int[n];\n    if (k == 0) return out_;\n    for (int i = 0; i < n; i++)\n    {\n        int sum = 0;\n        if (k > 0)\n        {\n            for (int t = 1; t <= k; t++) sum += code[(i + t) % n];\n        }\n        else\n        {\n            for (int t = 1; t <= -k; t++) sum += code[((i - t) % n + n) % n];\n        }\n        out_[i] = sum;\n    }\n    return out_;\n}`,
        go: `func decrypt(code []int, k int) []int {\n\tn := len(code)\n\tout := make([]int, n)\n\tif k == 0 {\n\t\treturn out\n\t}\n\tfor i := 0; i < n; i++ {\n\t\tsum := 0\n\t\tif k > 0 {\n\t\t\tfor t := 1; t <= k; t++ {\n\t\t\t\tsum += code[(i+t)%n]\n\t\t\t}\n\t\t} else {\n\t\t\tfor t := 1; t <= -k; t++ {\n\t\t\t\tsum += code[((i-t)%n+n)%n]\n\t\t\t}\n\t\t}\n\t\tout[i] = sum\n\t}\n\treturn out\n}`,
        kotlin: `fun decrypt(code: IntArray, k: Int): IntArray {\n    val n = code.size\n    val out = IntArray(n)\n    if (k == 0) return out\n    for (i in 0 until n) {\n        var sum = 0\n        if (k > 0) {\n            for (t in 1..k) sum += code[(i + t) % n]\n        } else {\n            for (t in 1..-k) sum += code[((i - t) % n + n) % n]\n        }\n        out[i] = sum\n    }\n    return out\n}`,
        swift: `func decrypt(_ code: [Int], _ k: Int) -> [Int] {\n    let n = code.count\n    var out = [Int](repeating: 0, count: n)\n    if k == 0 { return out }\n    for i in 0..<n {\n        var sum = 0\n        if k > 0 {\n            for t in 1...k { sum += code[(i + t) % n] }\n        } else {\n            for t in 1...(-k) { sum += code[((i - t) % n + n) % n] }\n        }\n        out[i] = sum\n    }\n    return out\n}`,
        rust: `fn decrypt(code: Vec<i32>, k: i32) -> Vec<i32> {\n    let n = code.len() as i32;\n    let mut out = vec![0i32; n as usize];\n    if k == 0 {\n        return out;\n    }\n    for i in 0..n {\n        let mut sum = 0i32;\n        if k > 0 {\n            for t in 1..=k {\n                sum += code[(((i + t) % n + n) % n) as usize];\n            }\n        } else {\n            for t in 1..=(-k) {\n                sum += code[(((i - t) % n + n) % n) as usize];\n            }\n        }\n        out[i as usize] = sum;\n    }\n    out\n}`,
        php: `function decrypt($code, $k) {\n    $n = count($code);\n    $out = array_fill(0, $n, 0);\n    if ($k === 0) return $out;\n    for ($i = 0; $i < $n; $i++) {\n        $sum = 0;\n        if ($k > 0) {\n            for ($t = 1; $t <= $k; $t++) $sum += $code[($i + $t) % $n];\n        } else {\n            for ($t = 1; $t <= -$k; $t++) $sum += $code[(($i - $t) % $n + $n) % $n];\n        }\n        $out[$i] = $sum;\n    }\n    return $out;\n}`,
        ruby: `def decrypt(code, k)\n  n = code.length\n  out = Array.new(n, 0)\n  return out if k == 0\n  (0...n).each do |i|\n    sum = 0\n    if k > 0\n      (1..k).each { |t| sum += code[(i + t) % n] }\n    else\n      (1..-k).each { |t| sum += code[(i - t) % n] }\n    end\n    out[i] = sum\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Minimum Recolors to Get K Consecutive Black Blocks (LC 2379) ──
  (() => {
    const ref = (blocks: string, k: number) => {
      let whites = 0;
      for (let i = 0; i < k; i++) if (blocks[i] === "W") whites++;
      let best = whites;
      for (let i = k; i < blocks.length; i++) {
        if (blocks[i] === "W") whites++;
        if (blocks[i - k] === "W") whites--;
        if (whites < best) best = whites;
      }
      return best;
    };
    return {
      slug: "minimum-recolors-to-get-k-consecutive-black-blocks",
      title: "Minimum Recolors to Get K Consecutive Black Blocks",
      difficulty: "EASY" as const,
      tags: ["String", "Sliding Window", "Amazon", "Google", "Accenture"],
      signature: { funcName: "minimumRecolors", params: [{ name: "blocks", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`blocks` is a string of `'W'` (white) and `'B'` (black) blocks. One operation recolors a single white block black.\n\nReturn the minimum number of operations needed so that somewhere in the string there are `k` consecutive black blocks.",
        [
          { in: 'blocks = "WBBWWBBWBW", k = 7', out: "3", note: "Recoloring the three whites in positions 3, 4 and 7 leaves a run of seven blacks." },
          { in: 'blocks = "WBWBBBW", k = 2', out: "0", note: "\"BB\" is already there." },
          { in: 'blocks = "WWWW", k = 4', out: "4" },
        ],
        ["1 <= k <= blocks.length <= 100", "blocks[i] is either 'W' or 'B'."]),
      hints: [
        "The run of `k` blacks has to sit in some window of length `k`.",
        "The cost of a window is simply how many `'W'` it holds.",
        "Roll that count as the window slides instead of recounting.",
      ],
      editorial: explain({
        idea: "Any answer is realised by one window of length `k`, and that window costs exactly its number of white blocks. So minimise the white count over all fixed-size windows.",
        steps: [
          "Count the whites in `blocks[0 … k-1]`.",
          "Slide: when the window advances, add the entering character if it is `'W'` and subtract the leaving one if it was.",
          "Return the smallest count seen.",
        ],
        why: "Recoloring is only ever useful inside the chosen window, and each white there must be recolored exactly once, so the window's white count is its exact cost. Taking the minimum over all windows is therefore the answer.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Recounting each window is `O(n · k)` — fine at `n = 100` but the wrong habit.",
          "Initialising the best to 0 instead of the first window's count returns 0 always.",
          "Blacks are never recolored, so only `'W'` contributes.",
        ],
      }),
      examples: [
        { input: '"WBBWWBBWBW"\n7', expectedOutput: "3" },
        { input: '"WBWBBBW"\n2', expectedOutput: "0" },
        { input: '"WWWW"\n4', expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const blocks = Array.from({ length: n }, () => (rng() < 0.5 ? "W" : "B")).join("");
        const k = ri(rng, 1, n);
        return { input: `"${blocks}"\n${k}`, expectedOutput: String(ref(blocks, k)) };
      },
      solutions: {
        python: `def minimumRecolors(blocks: str, k: int) -> int:\n    whites = blocks[:k].count("W")\n    best = whites\n    for i in range(k, len(blocks)):\n        if blocks[i] == "W":\n            whites += 1\n        if blocks[i - k] == "W":\n            whites -= 1\n        best = min(best, whites)\n    return best`,
        javascript: `var minimumRecolors = function(blocks, k) {\n    var whites = 0;\n    for (var i = 0; i < k; i++) if (blocks.charAt(i) === "W") whites++;\n    var best = whites;\n    for (var j = k; j < blocks.length; j++) {\n        if (blocks.charAt(j) === "W") whites++;\n        if (blocks.charAt(j - k) === "W") whites--;\n        if (whites < best) best = whites;\n    }\n    return best;\n};`,
        typescript: `function minimumRecolors(blocks: string, k: number): number {\n    var whites = 0;\n    for (var i = 0; i < k; i++) if (blocks.charAt(i) === "W") whites++;\n    var best = whites;\n    for (var j = k; j < blocks.length; j++) {\n        if (blocks.charAt(j) === "W") whites++;\n        if (blocks.charAt(j - k) === "W") whites--;\n        if (whites < best) best = whites;\n    }\n    return best;\n}`,
        java: `public static int minimumRecolors(String blocks, int k) {\n    int whites = 0;\n    for (int i = 0; i < k; i++) if (blocks.charAt(i) == 'W') whites++;\n    int best = whites;\n    for (int i = k; i < blocks.length(); i++) {\n        if (blocks.charAt(i) == 'W') whites++;\n        if (blocks.charAt(i - k) == 'W') whites--;\n        best = Math.min(best, whites);\n    }\n    return best;\n}`,
        cpp: `int minimumRecolors(string blocks, int k) {\n    int whites = 0;\n    for (int i = 0; i < k; i++) if (blocks[i] == 'W') whites++;\n    int best = whites;\n    for (int i = k; i < (int) blocks.size(); i++) {\n        if (blocks[i] == 'W') whites++;\n        if (blocks[i - k] == 'W') whites--;\n        best = min(best, whites);\n    }\n    return best;\n}`,
        c: `int minimumRecolors(char* blocks, int k) {\n    int n = (int) strlen(blocks);\n    int whites = 0;\n    for (int i = 0; i < k; i++) if (blocks[i] == 'W') whites++;\n    int best = whites;\n    for (int i = k; i < n; i++) {\n        if (blocks[i] == 'W') whites++;\n        if (blocks[i - k] == 'W') whites--;\n        if (whites < best) best = whites;\n    }\n    return best;\n}`,
        csharp: `public static int MinimumRecolors(string blocks, int k)\n{\n    int whites = 0;\n    for (int i = 0; i < k; i++) if (blocks[i] == 'W') whites++;\n    int best = whites;\n    for (int i = k; i < blocks.Length; i++)\n    {\n        if (blocks[i] == 'W') whites++;\n        if (blocks[i - k] == 'W') whites--;\n        if (whites < best) best = whites;\n    }\n    return best;\n}`,
        go: `func minimumRecolors(blocks string, k int) int {\n\twhites := 0\n\tfor i := 0; i < k; i++ {\n\t\tif blocks[i] == 'W' {\n\t\t\twhites++\n\t\t}\n\t}\n\tbest := whites\n\tfor i := k; i < len(blocks); i++ {\n\t\tif blocks[i] == 'W' {\n\t\t\twhites++\n\t\t}\n\t\tif blocks[i-k] == 'W' {\n\t\t\twhites--\n\t\t}\n\t\tif whites < best {\n\t\t\tbest = whites\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun minimumRecolors(blocks: String, k: Int): Int {\n    var whites = 0\n    for (i in 0 until k) if (blocks[i] == 'W') whites++\n    var best = whites\n    for (i in k until blocks.length) {\n        if (blocks[i] == 'W') whites++\n        if (blocks[i - k] == 'W') whites--\n        if (whites < best) best = whites\n    }\n    return best\n}`,
        swift: `func minimumRecolors(_ blocks: String, _ k: Int) -> Int {\n    let a = Array(blocks)\n    var whites = 0\n    for i in 0..<k where a[i] == "W" { whites += 1 }\n    var best = whites\n    var i = k\n    while i < a.count {\n        if a[i] == "W" { whites += 1 }\n        if a[i - k] == "W" { whites -= 1 }\n        if whites < best { best = whites }\n        i += 1\n    }\n    return best\n}`,
        rust: `fn minimumRecolors(blocks: String, k: i32) -> i32 {\n    let b = blocks.as_bytes();\n    let k = k as usize;\n    let mut whites = 0i32;\n    for i in 0..k {\n        if b[i] == b'W' {\n            whites += 1;\n        }\n    }\n    let mut best = whites;\n    for i in k..b.len() {\n        if b[i] == b'W' {\n            whites += 1;\n        }\n        if b[i - k] == b'W' {\n            whites -= 1;\n        }\n        if whites < best {\n            best = whites;\n        }\n    }\n    best\n}`,
        php: `function minimumRecolors($blocks, $k) {\n    $whites = 0;\n    for ($i = 0; $i < $k; $i++) if ($blocks[$i] === "W") $whites++;\n    $best = $whites;\n    for ($i = $k; $i < strlen($blocks); $i++) {\n        if ($blocks[$i] === "W") $whites++;\n        if ($blocks[$i - $k] === "W") $whites--;\n        if ($whites < $best) $best = $whites;\n    }\n    return $best;\n}`,
        ruby: `def minimumRecolors(blocks, k)\n  whites = blocks[0, k].count("W")\n  best = whites\n  (k...blocks.length).each do |i|\n    whites += 1 if blocks[i] == "W"\n    whites -= 1 if blocks[i - k] == "W"\n    best = whites if whites < best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Count Subarrays of Length Three With a Condition (LC 3392) ──
  (() => {
    const ref = (nums: number[]) => {
      let count = 0;
      for (let i = 0; i + 3 <= nums.length; i++) {
        if (2 * (nums[i] + nums[i + 2]) === nums[i + 1]) count++;
      }
      return count;
    };
    return {
      slug: "count-subarrays-of-length-three-with-a-condition",
      title: "Count Subarrays of Length Three With a Condition",
      difficulty: "EASY" as const,
      tags: ["Array", "Sliding Window", "Amazon", "Microsoft", "Zoho"],
      signature: { funcName: "countSubarrays", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Count the subarrays of length three where the sum of the first and third elements is exactly **half** of the second element.",
        [
          { in: "nums = [1,2,1,4,1]", out: "1", note: "[1,4,1]: 1 + 1 is half of 4." },
          { in: "nums = [1,1,1]", out: "0", note: "1 + 1 is not half of 1." },
          { in: "nums = [2,8,2,8,2]", out: "2", note: "[2,8,2] appears twice." },
        ],
        ["3 <= nums.length <= 100", "-100 <= nums[i] <= 100"]),
      hints: [
        "The window is fixed at three elements, so scan every consecutive triple.",
        "\"Half of the second\" means the second must be even — avoid the division entirely.",
        "Multiply instead: `2 · (first + third) == second`.",
      ],
      editorial: explain({
        idea: "A fixed window of three with a constant-time test. The only subtlety is expressing 'half' without floating point or truncating division.",
        steps: [
          "Slide `i` over every start with `i + 3 <= n`.",
          "Test `2 · (nums[i] + nums[i+2]) == nums[i+1]`.",
          "Count the triples that pass.",
        ],
        why: "`a + c == b / 2` and `2(a + c) == b` are equivalent over the integers, but the second form is exact: it needs no division, so an odd `b` simply fails rather than being silently rounded. Values stay small, so the doubling cannot overflow.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Writing `nums[i] + nums[i+2] == nums[i+1] / 2` with integer division accepts odd `nums[i+1]` wrongly.",
          "Using floating-point division invites rounding error for no benefit.",
          "Negative values are allowed, so the condition can hold with a negative middle element.",
        ],
      }),
      examples: [
        { input: "[1,2,1,4,1]", expectedOutput: "1" },
        { input: "[1,1,1]", expectedOutput: "0" },
        { input: "[2,8,2,8,2]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 30);
        const nums = Array.from({ length: n }, () => ri(rng, -100, 100));
        // Plant a few satisfying triples so the answer is not almost always 0.
        for (let t = 0; t < 3 && rng() < 0.6; t++) {
          const i = ri(rng, 0, n - 3);
          const a = ri(rng, -25, 25);
          const c = ri(rng, -25, 25);
          nums[i] = a;
          nums[i + 1] = 2 * (a + c);
          nums[i + 2] = c;
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countSubarrays(nums: List[int]) -> int:\n    count = 0\n    for i in range(len(nums) - 2):\n        if 2 * (nums[i] + nums[i + 2]) == nums[i + 1]:\n            count += 1\n    return count`,
        javascript: `var countSubarrays = function(nums) {\n    var count = 0;\n    for (var i = 0; i + 3 <= nums.length; i++) {\n        if (2 * (nums[i] + nums[i + 2]) === nums[i + 1]) count++;\n    }\n    return count;\n};`,
        typescript: `function countSubarrays(nums: number[]): number {\n    var count = 0;\n    for (var i = 0; i + 3 <= nums.length; i++) {\n        if (2 * (nums[i] + nums[i + 2]) === nums[i + 1]) count++;\n    }\n    return count;\n}`,
        java: `public static int countSubarrays(int[] nums) {\n    int count = 0;\n    for (int i = 0; i + 3 <= nums.length; i++) {\n        if (2 * (nums[i] + nums[i + 2]) == nums[i + 1]) count++;\n    }\n    return count;\n}`,
        cpp: `int countSubarrays(vector<int>& nums) {\n    int count = 0;\n    for (int i = 0; i + 3 <= (int) nums.size(); i++) {\n        if (2 * (nums[i] + nums[i + 2]) == nums[i + 1]) count++;\n    }\n    return count;\n}`,
        c: `int countSubarrays(int* nums, int numsSize) {\n    int count = 0;\n    for (int i = 0; i + 3 <= numsSize; i++) {\n        if (2 * (nums[i] + nums[i + 2]) == nums[i + 1]) count++;\n    }\n    return count;\n}`,
        csharp: `public static int CountSubarrays(int[] nums)\n{\n    int count = 0;\n    for (int i = 0; i + 3 <= nums.Length; i++)\n    {\n        if (2 * (nums[i] + nums[i + 2]) == nums[i + 1]) count++;\n    }\n    return count;\n}`,
        go: `func countSubarrays(nums []int) int {\n\tcount := 0\n\tfor i := 0; i+3 <= len(nums); i++ {\n\t\tif 2*(nums[i]+nums[i+2]) == nums[i+1] {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countSubarrays(nums: IntArray): Int {\n    var count = 0\n    for (i in 0..nums.size - 3) {\n        if (2 * (nums[i] + nums[i + 2]) == nums[i + 1]) count++\n    }\n    return count\n}`,
        swift: `func countSubarrays(_ nums: [Int]) -> Int {\n    var count = 0\n    var i = 0\n    while i + 3 <= nums.count {\n        if 2 * (nums[i] + nums[i + 2]) == nums[i + 1] { count += 1 }\n        i += 1\n    }\n    return count\n}`,
        rust: `fn countSubarrays(nums: Vec<i32>) -> i32 {\n    let mut count = 0i32;\n    let mut i = 0usize;\n    while i + 3 <= nums.len() {\n        if 2 * (nums[i] + nums[i + 2]) == nums[i + 1] {\n            count += 1;\n        }\n        i += 1;\n    }\n    count\n}`,
        php: `function countSubarrays($nums) {\n    $count = 0;\n    $n = count($nums);\n    for ($i = 0; $i + 3 <= $n; $i++) {\n        if (2 * ($nums[$i] + $nums[$i + 2]) === $nums[$i + 1]) $count++;\n    }\n    return $count;\n}`,
        ruby: `def countSubarrays(nums)\n  count = 0\n  (0..nums.length - 3).each do |i|\n    count += 1 if 2 * (nums[i] + nums[i + 2]) == nums[i + 1]\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Longest Substring with At Most Two Distinct Characters (LC 159) ──
  (() => {
    const ref = (s: string) => {
      const cnt: Record<string, number> = {};
      let distinct = 0, l = 0, best = 0;
      for (let r = 0; r < s.length; r++) {
        const c = s[r];
        cnt[c] = (cnt[c] || 0) + 1;
        if (cnt[c] === 1) distinct++;
        while (distinct > 2) {
          const u = s[l];
          cnt[u]--;
          if (cnt[u] === 0) distinct--;
          l++;
        }
        if (r - l + 1 > best) best = r - l + 1;
      }
      return best;
    };
    return {
      slug: "longest-substring-with-at-most-two-distinct-characters",
      title: "Longest Substring with At Most Two Distinct Characters",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Hash Table", "Sliding Window", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "lengthOfLongestSubstringTwoDistinct", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Return the length of the longest substring of `s` that contains **at most two** distinct characters.",
        [
          { in: 's = "codekairo"', out: "2", note: "Every character differs from its neighbours, so no window of three works." },
          { in: 's = "eceba"', out: "3", note: '"ece" uses only e and c.' },
          { in: 's = "ccaabbb"', out: "5", note: '"aabbb".' },
        ],
        ["1 <= s.length <= 100000", "s consists of English letters."]),
      hints: [
        "'At most two distinct' is monotone: shrinking a window never raises its distinct count.",
        "Grow the window on the right; while it holds three distinct characters, shrink from the left.",
        "A tally keyed by character tracks the distinct count in constant time.",
      ],
      editorial: explain({
        idea: "The classic variable-size window. Extend the right edge one character at a time and repair the invariant by pulling the left edge in while there are more than two distinct characters.",
        steps: [
          "Keep a tally of characters in the window and a running distinct count.",
          "On adding `s[r]`, bump its tally and raise the distinct count when it was absent.",
          "While the distinct count exceeds 2, drop `s[l]` and advance `l`, lowering the count when a tally reaches zero.",
          "Record the window's length after each repair.",
        ],
        why: "Because the predicate is monotone in the left edge, for every right edge the valid left edges form a suffix, so `l` never needs to move backwards. Each index enters and leaves the window once, giving a linear scan.",
        time: "O(n)",
        space: "O(1) — at most three tallies live at once",
        pitfalls: [
          "Dropping an entry from the tally without checking it reached zero loses track of the distinct count.",
          "Measuring the window before the shrink loop counts an invalid window.",
          "A window of one character is always valid, so the answer is at least 1.",
        ],
      }),
      examples: [
        { input: '"codekairo"', expectedOutput: "2" },
        { input: '"eceba"', expectedOutput: "3" },
        { input: '"ccaabbb"', expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const alpha = rng() < 0.6 ? ["a", "b", "c"] : ["a", "b", "c", "d", "e"];
        const s = Array.from({ length: ri(rng, 1, 45) }, () => pick(rng, alpha)).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def lengthOfLongestSubstringTwoDistinct(s: str) -> int:\n    cnt = {}\n    distinct = 0\n    l = 0\n    best = 0\n    for r, c in enumerate(s):\n        cnt[c] = cnt.get(c, 0) + 1\n        if cnt[c] == 1:\n            distinct += 1\n        while distinct > 2:\n            u = s[l]\n            cnt[u] -= 1\n            if cnt[u] == 0:\n                distinct -= 1\n            l += 1\n        best = max(best, r - l + 1)\n    return best`,
        javascript: `var lengthOfLongestSubstringTwoDistinct = function(s) {\n    var cnt = {};\n    var distinct = 0, l = 0, best = 0;\n    for (var r = 0; r < s.length; r++) {\n        var c = s.charAt(r);\n        cnt[c] = (cnt[c] || 0) + 1;\n        if (cnt[c] === 1) distinct++;\n        while (distinct > 2) {\n            var u = s.charAt(l);\n            cnt[u]--;\n            if (cnt[u] === 0) distinct--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n};`,
        typescript: `function lengthOfLongestSubstringTwoDistinct(s: string): number {\n    var cnt: { [key: string]: number } = {};\n    var distinct = 0, l = 0, best = 0;\n    for (var r = 0; r < s.length; r++) {\n        var c = s.charAt(r);\n        cnt[c] = (cnt[c] || 0) + 1;\n        if (cnt[c] === 1) distinct++;\n        while (distinct > 2) {\n            var u = s.charAt(l);\n            cnt[u]--;\n            if (cnt[u] === 0) distinct--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        java: `public static int lengthOfLongestSubstringTwoDistinct(String s) {\n    int[] cnt = new int[128];\n    int distinct = 0, l = 0, best = 0;\n    for (int r = 0; r < s.length(); r++) {\n        if (cnt[s.charAt(r)]++ == 0) distinct++;\n        while (distinct > 2) {\n            if (--cnt[s.charAt(l)] == 0) distinct--;\n            l++;\n        }\n        best = Math.max(best, r - l + 1);\n    }\n    return best;\n}`,
        cpp: `int lengthOfLongestSubstringTwoDistinct(string s) {\n    vector<int> cnt(128, 0);\n    int distinct = 0, l = 0, best = 0;\n    for (int r = 0; r < (int) s.size(); r++) {\n        if (cnt[(int) s[r]]++ == 0) distinct++;\n        while (distinct > 2) {\n            if (--cnt[(int) s[l]] == 0) distinct--;\n            l++;\n        }\n        best = max(best, r - l + 1);\n    }\n    return best;\n}`,
        c: `int lengthOfLongestSubstringTwoDistinct(char* s) {\n    int cnt[128];\n    for (int i = 0; i < 128; i++) cnt[i] = 0;\n    int n = (int) strlen(s);\n    int distinct = 0, l = 0, best = 0;\n    for (int r = 0; r < n; r++) {\n        if (cnt[(int) s[r]]++ == 0) distinct++;\n        while (distinct > 2) {\n            if (--cnt[(int) s[l]] == 0) distinct--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        csharp: `public static int LengthOfLongestSubstringTwoDistinct(string s)\n{\n    int[] cnt = new int[128];\n    int distinct = 0, l = 0, best = 0;\n    for (int r = 0; r < s.Length; r++)\n    {\n        if (cnt[s[r]]++ == 0) distinct++;\n        while (distinct > 2)\n        {\n            if (--cnt[s[l]] == 0) distinct--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        go: `func lengthOfLongestSubstringTwoDistinct(s string) int {\n\tcnt := make([]int, 128)\n\tdistinct, l, best := 0, 0, 0\n\tfor r := 0; r < len(s); r++ {\n\t\tif cnt[s[r]] == 0 {\n\t\t\tdistinct++\n\t\t}\n\t\tcnt[s[r]]++\n\t\tfor distinct > 2 {\n\t\t\tcnt[s[l]]--\n\t\t\tif cnt[s[l]] == 0 {\n\t\t\t\tdistinct--\n\t\t\t}\n\t\t\tl++\n\t\t}\n\t\tif r-l+1 > best {\n\t\t\tbest = r - l + 1\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun lengthOfLongestSubstringTwoDistinct(s: String): Int {\n    val cnt = IntArray(128)\n    var distinct = 0\n    var l = 0\n    var best = 0\n    for (r in s.indices) {\n        if (cnt[s[r].toInt()] == 0) distinct++\n        cnt[s[r].toInt()]++\n        while (distinct > 2) {\n            cnt[s[l].toInt()]--\n            if (cnt[s[l].toInt()] == 0) distinct--\n            l++\n        }\n        if (r - l + 1 > best) best = r - l + 1\n    }\n    return best\n}`,
        swift: `func lengthOfLongestSubstringTwoDistinct(_ s: String) -> Int {\n    let a = Array(s.unicodeScalars).map { Int($0.value) }\n    var cnt = [Int](repeating: 0, count: 128)\n    var distinct = 0\n    var l = 0\n    var best = 0\n    for r in 0..<a.count {\n        if cnt[a[r]] == 0 { distinct += 1 }\n        cnt[a[r]] += 1\n        while distinct > 2 {\n            cnt[a[l]] -= 1\n            if cnt[a[l]] == 0 { distinct -= 1 }\n            l += 1\n        }\n        if r - l + 1 > best { best = r - l + 1 }\n    }\n    return best\n}`,
        rust: `fn lengthOfLongestSubstringTwoDistinct(s: String) -> i32 {\n    let b = s.as_bytes();\n    let mut cnt = [0i32; 128];\n    let mut distinct = 0i32;\n    let mut l = 0usize;\n    let mut best = 0i32;\n    for r in 0..b.len() {\n        if cnt[b[r] as usize] == 0 {\n            distinct += 1;\n        }\n        cnt[b[r] as usize] += 1;\n        while distinct > 2 {\n            cnt[b[l] as usize] -= 1;\n            if cnt[b[l] as usize] == 0 {\n                distinct -= 1;\n            }\n            l += 1;\n        }\n        let len = (r + 1 - l) as i32;\n        if len > best {\n            best = len;\n        }\n    }\n    best\n}`,
        php: `function lengthOfLongestSubstringTwoDistinct($s) {\n    $cnt = array_fill(0, 128, 0);\n    $distinct = 0;\n    $l = 0;\n    $best = 0;\n    $n = strlen($s);\n    for ($r = 0; $r < $n; $r++) {\n        $c = ord($s[$r]);\n        if ($cnt[$c] === 0) $distinct++;\n        $cnt[$c]++;\n        while ($distinct > 2) {\n            $u = ord($s[$l]);\n            $cnt[$u]--;\n            if ($cnt[$u] === 0) $distinct--;\n            $l++;\n        }\n        if ($r - $l + 1 > $best) $best = $r - $l + 1;\n    }\n    return $best;\n}`,
        ruby: `def lengthOfLongestSubstringTwoDistinct(s)\n  cnt = Hash.new(0)\n  distinct = 0\n  l = 0\n  best = 0\n  s.each_char.with_index do |c, r|\n    cnt[c] += 1\n    distinct += 1 if cnt[c] == 1\n    while distinct > 2\n      u = s[l]\n      cnt[u] -= 1\n      distinct -= 1 if cnt[u] == 0\n      l += 1\n    end\n    best = r - l + 1 if r - l + 1 > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Longest Substring with At Most K Distinct Characters (LC 340) ──
  (() => {
    const ref = (s: string, k: number) => {
      if (k === 0) return 0;
      const cnt: Record<string, number> = {};
      let distinct = 0, l = 0, best = 0;
      for (let r = 0; r < s.length; r++) {
        const c = s[r];
        cnt[c] = (cnt[c] || 0) + 1;
        if (cnt[c] === 1) distinct++;
        while (distinct > k) {
          const u = s[l];
          cnt[u]--;
          if (cnt[u] === 0) distinct--;
          l++;
        }
        if (r - l + 1 > best) best = r - l + 1;
      }
      return best;
    };
    return {
      slug: "longest-substring-with-at-most-k-distinct-characters",
      title: "Longest Substring with At Most K Distinct Characters",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Hash Table", "Sliding Window", "Amazon", "Google", "Paytm"],
      signature: { funcName: "lengthOfLongestSubstringKDistinct", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Return the length of the longest substring of `s` that contains **at most `k`** distinct characters.",
        [
          { in: 's = "codekairo", k = 3', out: "3", note: "No window of four keeps the alphabet down to three here." },
          { in: 's = "eceba", k = 2', out: "3", note: '"ece".' },
          { in: 's = "aa", k = 1', out: "2" },
        ],
        ["1 <= s.length <= 100000", "0 <= k <= 50", "s consists of English letters."]),
      hints: [
        "Same window as the two-distinct version, with the bound taken as a parameter.",
        "`k = 0` admits only the empty substring — answer 0.",
        "Keep a tally and a distinct counter so each step is constant time.",
      ],
      editorial: explain({
        idea: "Generalise the two-distinct window: grow on the right, and while the distinct count exceeds `k`, shrink from the left. The tally makes each update constant time.",
        steps: [
          "Handle `k = 0` up front by returning 0.",
          "Add `s[r]` to the tally, raising the distinct count when it enters.",
          "While the distinct count exceeds `k`, remove `s[l]` and advance `l`.",
          "Track the longest valid window.",
        ],
        why: "Shrinking a window can only lower its distinct count, so for a fixed right edge the valid left edges are a suffix — the hallmark of a two-pointer window. Every index is added and removed once, so the scan is linear regardless of `k`.",
        time: "O(n)",
        space: "O(min(n, alphabet))",
        pitfalls: [
          "`k = 0` must not fall through into the loop, where the shrink would run past the right edge.",
          "Forgetting to decrement the distinct count on a zero tally silently caps the window.",
          "The answer is a length, not a count of substrings.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n3', expectedOutput: "3" },
        { input: '"eceba"\n2', expectedOutput: "3" },
        { input: '"aa"\n1', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const alpha = ["a", "b", "c", "d", "e", "f"];
        const s = Array.from({ length: ri(rng, 1, 45) }, () => pick(rng, alpha)).join("");
        const k = ri(rng, 0, 7);
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: `def lengthOfLongestSubstringKDistinct(s: str, k: int) -> int:\n    if k == 0:\n        return 0\n    cnt = {}\n    distinct = 0\n    l = 0\n    best = 0\n    for r, c in enumerate(s):\n        cnt[c] = cnt.get(c, 0) + 1\n        if cnt[c] == 1:\n            distinct += 1\n        while distinct > k:\n            u = s[l]\n            cnt[u] -= 1\n            if cnt[u] == 0:\n                distinct -= 1\n            l += 1\n        best = max(best, r - l + 1)\n    return best`,
        javascript: `var lengthOfLongestSubstringKDistinct = function(s, k) {\n    if (k === 0) return 0;\n    var cnt = {};\n    var distinct = 0, l = 0, best = 0;\n    for (var r = 0; r < s.length; r++) {\n        var c = s.charAt(r);\n        cnt[c] = (cnt[c] || 0) + 1;\n        if (cnt[c] === 1) distinct++;\n        while (distinct > k) {\n            var u = s.charAt(l);\n            cnt[u]--;\n            if (cnt[u] === 0) distinct--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n};`,
        typescript: `function lengthOfLongestSubstringKDistinct(s: string, k: number): number {\n    if (k === 0) return 0;\n    var cnt: { [key: string]: number } = {};\n    var distinct = 0, l = 0, best = 0;\n    for (var r = 0; r < s.length; r++) {\n        var c = s.charAt(r);\n        cnt[c] = (cnt[c] || 0) + 1;\n        if (cnt[c] === 1) distinct++;\n        while (distinct > k) {\n            var u = s.charAt(l);\n            cnt[u]--;\n            if (cnt[u] === 0) distinct--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        java: `public static int lengthOfLongestSubstringKDistinct(String s, int k) {\n    if (k == 0) return 0;\n    int[] cnt = new int[128];\n    int distinct = 0, l = 0, best = 0;\n    for (int r = 0; r < s.length(); r++) {\n        if (cnt[s.charAt(r)]++ == 0) distinct++;\n        while (distinct > k) {\n            if (--cnt[s.charAt(l)] == 0) distinct--;\n            l++;\n        }\n        best = Math.max(best, r - l + 1);\n    }\n    return best;\n}`,
        cpp: `int lengthOfLongestSubstringKDistinct(string s, int k) {\n    if (k == 0) return 0;\n    vector<int> cnt(128, 0);\n    int distinct = 0, l = 0, best = 0;\n    for (int r = 0; r < (int) s.size(); r++) {\n        if (cnt[(int) s[r]]++ == 0) distinct++;\n        while (distinct > k) {\n            if (--cnt[(int) s[l]] == 0) distinct--;\n            l++;\n        }\n        best = max(best, r - l + 1);\n    }\n    return best;\n}`,
        c: `int lengthOfLongestSubstringKDistinct(char* s, int k) {\n    if (k == 0) return 0;\n    int cnt[128];\n    for (int i = 0; i < 128; i++) cnt[i] = 0;\n    int n = (int) strlen(s);\n    int distinct = 0, l = 0, best = 0;\n    for (int r = 0; r < n; r++) {\n        if (cnt[(int) s[r]]++ == 0) distinct++;\n        while (distinct > k) {\n            if (--cnt[(int) s[l]] == 0) distinct--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        csharp: `public static int LengthOfLongestSubstringKDistinct(string s, int k)\n{\n    if (k == 0) return 0;\n    int[] cnt = new int[128];\n    int distinct = 0, l = 0, best = 0;\n    for (int r = 0; r < s.Length; r++)\n    {\n        if (cnt[s[r]]++ == 0) distinct++;\n        while (distinct > k)\n        {\n            if (--cnt[s[l]] == 0) distinct--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        go: `func lengthOfLongestSubstringKDistinct(s string, k int) int {\n\tif k == 0 {\n\t\treturn 0\n\t}\n\tcnt := make([]int, 128)\n\tdistinct, l, best := 0, 0, 0\n\tfor r := 0; r < len(s); r++ {\n\t\tif cnt[s[r]] == 0 {\n\t\t\tdistinct++\n\t\t}\n\t\tcnt[s[r]]++\n\t\tfor distinct > k {\n\t\t\tcnt[s[l]]--\n\t\t\tif cnt[s[l]] == 0 {\n\t\t\t\tdistinct--\n\t\t\t}\n\t\t\tl++\n\t\t}\n\t\tif r-l+1 > best {\n\t\t\tbest = r - l + 1\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun lengthOfLongestSubstringKDistinct(s: String, k: Int): Int {\n    if (k == 0) return 0\n    val cnt = IntArray(128)\n    var distinct = 0\n    var l = 0\n    var best = 0\n    for (r in s.indices) {\n        if (cnt[s[r].toInt()] == 0) distinct++\n        cnt[s[r].toInt()]++\n        while (distinct > k) {\n            cnt[s[l].toInt()]--\n            if (cnt[s[l].toInt()] == 0) distinct--\n            l++\n        }\n        if (r - l + 1 > best) best = r - l + 1\n    }\n    return best\n}`,
        swift: `func lengthOfLongestSubstringKDistinct(_ s: String, _ k: Int) -> Int {\n    if k == 0 { return 0 }\n    let a = Array(s.unicodeScalars).map { Int($0.value) }\n    var cnt = [Int](repeating: 0, count: 128)\n    var distinct = 0\n    var l = 0\n    var best = 0\n    for r in 0..<a.count {\n        if cnt[a[r]] == 0 { distinct += 1 }\n        cnt[a[r]] += 1\n        while distinct > k {\n            cnt[a[l]] -= 1\n            if cnt[a[l]] == 0 { distinct -= 1 }\n            l += 1\n        }\n        if r - l + 1 > best { best = r - l + 1 }\n    }\n    return best\n}`,
        rust: `fn lengthOfLongestSubstringKDistinct(s: String, k: i32) -> i32 {\n    if k == 0 {\n        return 0;\n    }\n    let b = s.as_bytes();\n    let mut cnt = [0i32; 128];\n    let mut distinct = 0i32;\n    let mut l = 0usize;\n    let mut best = 0i32;\n    for r in 0..b.len() {\n        if cnt[b[r] as usize] == 0 {\n            distinct += 1;\n        }\n        cnt[b[r] as usize] += 1;\n        while distinct > k {\n            cnt[b[l] as usize] -= 1;\n            if cnt[b[l] as usize] == 0 {\n                distinct -= 1;\n            }\n            l += 1;\n        }\n        let len = (r + 1 - l) as i32;\n        if len > best {\n            best = len;\n        }\n    }\n    best\n}`,
        php: `function lengthOfLongestSubstringKDistinct($s, $k) {\n    if ($k === 0) return 0;\n    $cnt = array_fill(0, 128, 0);\n    $distinct = 0;\n    $l = 0;\n    $best = 0;\n    $n = strlen($s);\n    for ($r = 0; $r < $n; $r++) {\n        $c = ord($s[$r]);\n        if ($cnt[$c] === 0) $distinct++;\n        $cnt[$c]++;\n        while ($distinct > $k) {\n            $u = ord($s[$l]);\n            $cnt[$u]--;\n            if ($cnt[$u] === 0) $distinct--;\n            $l++;\n        }\n        if ($r - $l + 1 > $best) $best = $r - $l + 1;\n    }\n    return $best;\n}`,
        ruby: `def lengthOfLongestSubstringKDistinct(s, k)\n  return 0 if k == 0\n  cnt = Hash.new(0)\n  distinct = 0\n  l = 0\n  best = 0\n  s.each_char.with_index do |c, r|\n    cnt[c] += 1\n    distinct += 1 if cnt[c] == 1\n    while distinct > k\n      u = s[l]\n      cnt[u] -= 1\n      distinct -= 1 if cnt[u] == 0\n      l += 1\n    end\n    best = r - l + 1 if r - l + 1 > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Number of Substrings Containing All Three Characters (LC 1358) ──
  (() => {
    const ref = (s: string) => {
      const last = [-1, -1, -1];
      let total = 0;
      for (let i = 0; i < s.length; i++) {
        last[s.charCodeAt(i) - 97] = i;
        total += Math.min(last[0], last[1], last[2]) + 1;
      }
      return total;
    };
    return {
      slug: "number-of-substrings-containing-all-three-characters",
      title: "Number of Substrings Containing All Three Characters",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Hash Table", "Sliding Window", "Amazon", "Google", "Oracle"],
      signature: { funcName: "numberOfSubstrings", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "`s` consists only of the characters `'a'`, `'b'` and `'c'`.\n\nReturn the number of substrings that contain **at least one** of each.",
        [
          { in: 's = "abcabc"', out: "10", note: "Every substring of length 3 or more here qualifies." },
          { in: 's = "aaacb"', out: "3", note: '"aaacb", "aacb" and "acb".' },
          { in: 's = "abc"', out: "1" },
        ],
        ["3 <= s.length <= 50000", "s consists only of 'a', 'b' and 'c'."]),
      hints: [
        "Fix the right end and ask how many left ends make the substring valid.",
        "A substring ending at `i` is valid exactly when it starts at or before the *last* occurrence of each character.",
        "So the count for right end `i` is `min(lastA, lastB, lastC) + 1`.",
      ],
      editorial: explain({
        idea: "For each right end, the valid left ends form a prefix: the substring must reach back far enough to pick up all three characters, and the binding constraint is the most recent occurrence of the rarest one.",
        steps: [
          "Track `last[c]`, the most recent index of each of the three characters, all starting at `-1`.",
          "At index `i`, update `last[s[i]]`.",
          "Add `min(last) + 1` to the total — the number of valid starts.",
        ],
        why: "A substring `[l, i]` holds all three characters precisely when `l <= last[c]` for every `c`, because `last[c]` is the rightmost occurrence at or before `i`. The number of such `l` is `min(last) + 1`, and it is 0 while some character has not appeared, since `min` is then `-1`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The equivalent two-pointer formulation counts `l` rather than `n - r`, which is easy to get off by one.",
          "Initialising `last` to 0 instead of `-1` counts substrings before all three characters exist.",
          "The total reaches about `1.25 · 10^9` at the upper limit, right at the edge of `int`.",
        ],
      }),
      examples: [
        { input: '"abcabc"', expectedOutput: "10" },
        { input: '"aaacb"', expectedOutput: "3" },
        { input: '"abc"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const s = Array.from({ length: ri(rng, 3, 50) }, () => pick(rng, ["a", "b", "c"])).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def numberOfSubstrings(s: str) -> int:\n    last = [-1, -1, -1]\n    total = 0\n    for i, ch in enumerate(s):\n        last[ord(ch) - 97] = i\n        total += min(last) + 1\n    return total`,
        javascript: `var numberOfSubstrings = function(s) {\n    var last = [-1, -1, -1];\n    var total = 0;\n    for (var i = 0; i < s.length; i++) {\n        last[s.charCodeAt(i) - 97] = i;\n        total += Math.min(last[0], last[1], last[2]) + 1;\n    }\n    return total;\n};`,
        typescript: `function numberOfSubstrings(s: string): number {\n    var last = [-1, -1, -1];\n    var total = 0;\n    for (var i = 0; i < s.length; i++) {\n        last[s.charCodeAt(i) - 97] = i;\n        total += Math.min(last[0], last[1], last[2]) + 1;\n    }\n    return total;\n}`,
        java: `public static int numberOfSubstrings(String s) {\n    int[] last = { -1, -1, -1 };\n    int total = 0;\n    for (int i = 0; i < s.length(); i++) {\n        last[s.charAt(i) - 'a'] = i;\n        total += Math.min(last[0], Math.min(last[1], last[2])) + 1;\n    }\n    return total;\n}`,
        cpp: `int numberOfSubstrings(string s) {\n    int last[3] = { -1, -1, -1 };\n    int total = 0;\n    for (int i = 0; i < (int) s.size(); i++) {\n        last[s[i] - 'a'] = i;\n        total += min(last[0], min(last[1], last[2])) + 1;\n    }\n    return total;\n}`,
        c: `int numberOfSubstrings(char* s) {\n    int last[3] = { -1, -1, -1 };\n    int total = 0;\n    int n = (int) strlen(s);\n    for (int i = 0; i < n; i++) {\n        last[s[i] - 'a'] = i;\n        int m = last[0];\n        if (last[1] < m) m = last[1];\n        if (last[2] < m) m = last[2];\n        total += m + 1;\n    }\n    return total;\n}`,
        csharp: `public static int NumberOfSubstrings(string s)\n{\n    int[] last = { -1, -1, -1 };\n    int total = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        last[s[i] - 'a'] = i;\n        total += Math.Min(last[0], Math.Min(last[1], last[2])) + 1;\n    }\n    return total;\n}`,
        go: `func numberOfSubstrings(s string) int {\n\tlast := [3]int{-1, -1, -1}\n\ttotal := 0\n\tfor i := 0; i < len(s); i++ {\n\t\tlast[s[i]-'a'] = i\n\t\tm := last[0]\n\t\tif last[1] < m {\n\t\t\tm = last[1]\n\t\t}\n\t\tif last[2] < m {\n\t\t\tm = last[2]\n\t\t}\n\t\ttotal += m + 1\n\t}\n\treturn total\n}`,
        kotlin: `fun numberOfSubstrings(s: String): Int {\n    val last = intArrayOf(-1, -1, -1)\n    var total = 0\n    for (i in s.indices) {\n        last[s[i] - 'a'] = i\n        total += minOf(last[0], last[1], last[2]) + 1\n    }\n    return total\n}`,
        swift: `func numberOfSubstrings(_ s: String) -> Int {\n    var last = [-1, -1, -1]\n    var total = 0\n    let a = Array(s.unicodeScalars).map { Int($0.value) - 97 }\n    for i in 0..<a.count {\n        last[a[i]] = i\n        total += min(last[0], last[1], last[2]) + 1\n    }\n    return total\n}`,
        rust: `fn numberOfSubstrings(s: String) -> i32 {\n    let b = s.as_bytes();\n    let mut last = [-1i32; 3];\n    let mut total = 0i32;\n    for i in 0..b.len() {\n        last[(b[i] - b'a') as usize] = i as i32;\n        let m = last[0].min(last[1]).min(last[2]);\n        total += m + 1;\n    }\n    total\n}`,
        php: `function numberOfSubstrings($s) {\n    $last = [-1, -1, -1];\n    $total = 0;\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $last[ord($s[$i]) - 97] = $i;\n        $total += min($last) + 1;\n    }\n    return $total;\n}`,
        ruby: `def numberOfSubstrings(s)\n  last = [-1, -1, -1]\n  total = 0\n  s.each_char.with_index do |ch, i|\n    last[ch.ord - 97] = i\n    total += last.min + 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Grumpy Bookstore Owner (LC 1052) ────────────────────────────
  (() => {
    const ref = (customers: number[], grumpy: number[], minutes: number) => {
      const n = customers.length;
      let base = 0;
      for (let i = 0; i < n; i++) if (grumpy[i] === 0) base += customers[i];
      let gain = 0;
      for (let i = 0; i < minutes && i < n; i++) if (grumpy[i] === 1) gain += customers[i];
      let best = gain;
      for (let i = minutes; i < n; i++) {
        if (grumpy[i] === 1) gain += customers[i];
        if (grumpy[i - minutes] === 1) gain -= customers[i - minutes];
        if (gain > best) best = gain;
      }
      return base + best;
    };
    return {
      slug: "grumpy-bookstore-owner",
      title: "Grumpy Bookstore Owner",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Amazon", "Google", "Swiggy"],
      signature: { funcName: "maxSatisfied", params: [{ name: "customers", type: "int[]" as const }, { name: "grumpy", type: "int[]" as const }, { name: "minutes", type: "int" as const }], returns: "int" as const },
      description: describe(
        "In minute `i`, `customers[i]` people visit the store and leave at the end of that minute. If `grumpy[i]` is `1` the owner is grumpy and **all** of them leave unsatisfied; otherwise they all leave satisfied.\n\nThe owner may stay calm for `minutes` **consecutive** minutes, once. Return the maximum number of satisfied customers.",
        [
          { in: "customers = [1,0,1,2,1,1,7,5], grumpy = [0,1,0,1,0,1,0,1], minutes = 3", out: "16", note: "Staying calm over the last three minutes saves the 5." },
          { in: "customers = [1], grumpy = [0], minutes = 1", out: "1" },
          { in: "customers = [4,10,10], grumpy = [1,1,0], minutes = 2", out: "24" },
        ],
        ["1 <= minutes <= customers.length <= 20000", "0 <= customers[i] <= 1000", "grumpy[i] is 0 or 1"]),
      hints: [
        "The customers in non-grumpy minutes are satisfied no matter what — that part is fixed.",
        "The technique only converts customers in minutes where the owner *is* grumpy.",
        "So maximise the grumpy-minute customers inside one window of `minutes` length.",
      ],
      editorial: explain({
        idea: "Split the answer into a fixed part and a window part. The fixed part is everyone arriving in a calm minute; the window part is the best block of `minutes` consecutive grumpy-minute customers that the technique can rescue.",
        steps: [
          "Sum `customers[i]` over every `i` with `grumpy[i] == 0` — that is the baseline.",
          "Build the first window's rescue total: `customers[i]` over `i < minutes` with `grumpy[i] == 1`.",
          "Slide the window, adding the entering minute's customers when grumpy and subtracting the leaving minute's when it was.",
          "Return baseline plus the largest rescue seen.",
        ],
        why: "Applying the technique never *loses* a customer, and it only affects minutes inside the chosen window, so the two parts are independent and the total is the baseline plus the window's grumpy total. Maximising a fixed-size window sum is the standard roll.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Adding calm-minute customers into the window total double-counts them.",
          "`minutes` may equal the whole array, in which case the sliding loop never runs — the initial window is the answer.",
          "The total reaches `2 · 10^7`, comfortably inside `int`.",
        ],
      }),
      examples: [
        { input: "[1,0,1,2,1,1,7,5]\n[0,1,0,1,0,1,0,1]\n3", expectedOutput: "16" },
        { input: "[1]\n[0]\n1", expectedOutput: "1" },
        { input: "[4,10,10]\n[1,1,0]\n2", expectedOutput: "24" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const customers = Array.from({ length: n }, () => ri(rng, 0, 1000));
        const grumpy = Array.from({ length: n }, () => (rng() < 0.5 ? 1 : 0));
        const minutes = ri(rng, 1, n);
        return { input: `${fmtIntArr(customers)}\n${fmtIntArr(grumpy)}\n${minutes}`, expectedOutput: String(ref(customers, grumpy, minutes)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxSatisfied(customers: List[int], grumpy: List[int], minutes: int) -> int:\n    n = len(customers)\n    base = sum(c for c, g in zip(customers, grumpy) if g == 0)\n    gain = sum(customers[i] for i in range(min(minutes, n)) if grumpy[i] == 1)\n    best = gain\n    for i in range(minutes, n):\n        if grumpy[i] == 1:\n            gain += customers[i]\n        if grumpy[i - minutes] == 1:\n            gain -= customers[i - minutes]\n        best = max(best, gain)\n    return base + best`,
        javascript: `var maxSatisfied = function(customers, grumpy, minutes) {\n    var n = customers.length, base = 0, i;\n    for (i = 0; i < n; i++) if (grumpy[i] === 0) base += customers[i];\n    var gain = 0;\n    for (i = 0; i < minutes && i < n; i++) if (grumpy[i] === 1) gain += customers[i];\n    var best = gain;\n    for (i = minutes; i < n; i++) {\n        if (grumpy[i] === 1) gain += customers[i];\n        if (grumpy[i - minutes] === 1) gain -= customers[i - minutes];\n        if (gain > best) best = gain;\n    }\n    return base + best;\n};`,
        typescript: `function maxSatisfied(customers: number[], grumpy: number[], minutes: number): number {\n    var n = customers.length, base = 0, i: number;\n    for (i = 0; i < n; i++) if (grumpy[i] === 0) base += customers[i];\n    var gain = 0;\n    for (i = 0; i < minutes && i < n; i++) if (grumpy[i] === 1) gain += customers[i];\n    var best = gain;\n    for (i = minutes; i < n; i++) {\n        if (grumpy[i] === 1) gain += customers[i];\n        if (grumpy[i - minutes] === 1) gain -= customers[i - minutes];\n        if (gain > best) best = gain;\n    }\n    return base + best;\n}`,
        java: `public static int maxSatisfied(int[] customers, int[] grumpy, int minutes) {\n    int n = customers.length, base = 0;\n    for (int i = 0; i < n; i++) if (grumpy[i] == 0) base += customers[i];\n    int gain = 0;\n    for (int i = 0; i < minutes && i < n; i++) if (grumpy[i] == 1) gain += customers[i];\n    int best = gain;\n    for (int i = minutes; i < n; i++) {\n        if (grumpy[i] == 1) gain += customers[i];\n        if (grumpy[i - minutes] == 1) gain -= customers[i - minutes];\n        best = Math.max(best, gain);\n    }\n    return base + best;\n}`,
        cpp: `int maxSatisfied(vector<int>& customers, vector<int>& grumpy, int minutes) {\n    int n = (int) customers.size(), base = 0;\n    for (int i = 0; i < n; i++) if (grumpy[i] == 0) base += customers[i];\n    int gain = 0;\n    for (int i = 0; i < minutes && i < n; i++) if (grumpy[i] == 1) gain += customers[i];\n    int best = gain;\n    for (int i = minutes; i < n; i++) {\n        if (grumpy[i] == 1) gain += customers[i];\n        if (grumpy[i - minutes] == 1) gain -= customers[i - minutes];\n        best = max(best, gain);\n    }\n    return base + best;\n}`,
        c: `int maxSatisfied(int* customers, int customersSize, int* grumpy, int grumpySize, int minutes) {\n    (void) grumpySize;\n    int n = customersSize, base = 0;\n    for (int i = 0; i < n; i++) if (grumpy[i] == 0) base += customers[i];\n    int gain = 0;\n    for (int i = 0; i < minutes && i < n; i++) if (grumpy[i] == 1) gain += customers[i];\n    int best = gain;\n    for (int i = minutes; i < n; i++) {\n        if (grumpy[i] == 1) gain += customers[i];\n        if (grumpy[i - minutes] == 1) gain -= customers[i - minutes];\n        if (gain > best) best = gain;\n    }\n    return base + best;\n}`,
        csharp: `public static int MaxSatisfied(int[] customers, int[] grumpy, int minutes)\n{\n    int n = customers.Length, base_ = 0;\n    for (int i = 0; i < n; i++) if (grumpy[i] == 0) base_ += customers[i];\n    int gain = 0;\n    for (int i = 0; i < minutes && i < n; i++) if (grumpy[i] == 1) gain += customers[i];\n    int best = gain;\n    for (int i = minutes; i < n; i++)\n    {\n        if (grumpy[i] == 1) gain += customers[i];\n        if (grumpy[i - minutes] == 1) gain -= customers[i - minutes];\n        if (gain > best) best = gain;\n    }\n    return base_ + best;\n}`,
        go: `func maxSatisfied(customers []int, grumpy []int, minutes int) int {\n\tn := len(customers)\n\tbase := 0\n\tfor i := 0; i < n; i++ {\n\t\tif grumpy[i] == 0 {\n\t\t\tbase += customers[i]\n\t\t}\n\t}\n\tgain := 0\n\tfor i := 0; i < minutes && i < n; i++ {\n\t\tif grumpy[i] == 1 {\n\t\t\tgain += customers[i]\n\t\t}\n\t}\n\tbest := gain\n\tfor i := minutes; i < n; i++ {\n\t\tif grumpy[i] == 1 {\n\t\t\tgain += customers[i]\n\t\t}\n\t\tif grumpy[i-minutes] == 1 {\n\t\t\tgain -= customers[i-minutes]\n\t\t}\n\t\tif gain > best {\n\t\t\tbest = gain\n\t\t}\n\t}\n\treturn base + best\n}`,
        kotlin: `fun maxSatisfied(customers: IntArray, grumpy: IntArray, minutes: Int): Int {\n    val n = customers.size\n    var base = 0\n    for (i in 0 until n) if (grumpy[i] == 0) base += customers[i]\n    var gain = 0\n    var i = 0\n    while (i < minutes && i < n) {\n        if (grumpy[i] == 1) gain += customers[i]\n        i++\n    }\n    var best = gain\n    for (j in minutes until n) {\n        if (grumpy[j] == 1) gain += customers[j]\n        if (grumpy[j - minutes] == 1) gain -= customers[j - minutes]\n        if (gain > best) best = gain\n    }\n    return base + best\n}`,
        swift: `func maxSatisfied(_ customers: [Int], _ grumpy: [Int], _ minutes: Int) -> Int {\n    let n = customers.count\n    var base = 0\n    for i in 0..<n where grumpy[i] == 0 { base += customers[i] }\n    var gain = 0\n    var i = 0\n    while i < minutes && i < n {\n        if grumpy[i] == 1 { gain += customers[i] }\n        i += 1\n    }\n    var best = gain\n    var j = minutes\n    while j < n {\n        if grumpy[j] == 1 { gain += customers[j] }\n        if grumpy[j - minutes] == 1 { gain -= customers[j - minutes] }\n        if gain > best { best = gain }\n        j += 1\n    }\n    return base + best\n}`,
        rust: `fn maxSatisfied(customers: Vec<i32>, grumpy: Vec<i32>, minutes: i32) -> i32 {\n    let n = customers.len();\n    let m = minutes as usize;\n    let mut base = 0i32;\n    for i in 0..n {\n        if grumpy[i] == 0 {\n            base += customers[i];\n        }\n    }\n    let mut gain = 0i32;\n    let mut i = 0usize;\n    while i < m && i < n {\n        if grumpy[i] == 1 {\n            gain += customers[i];\n        }\n        i += 1;\n    }\n    let mut best = gain;\n    for j in m..n {\n        if grumpy[j] == 1 {\n            gain += customers[j];\n        }\n        if grumpy[j - m] == 1 {\n            gain -= customers[j - m];\n        }\n        if gain > best {\n            best = gain;\n        }\n    }\n    base + best\n}`,
        php: `function maxSatisfied($customers, $grumpy, $minutes) {\n    $n = count($customers);\n    $base = 0;\n    for ($i = 0; $i < $n; $i++) if ($grumpy[$i] === 0) $base += $customers[$i];\n    $gain = 0;\n    for ($i = 0; $i < $minutes && $i < $n; $i++) if ($grumpy[$i] === 1) $gain += $customers[$i];\n    $best = $gain;\n    for ($i = $minutes; $i < $n; $i++) {\n        if ($grumpy[$i] === 1) $gain += $customers[$i];\n        if ($grumpy[$i - $minutes] === 1) $gain -= $customers[$i - $minutes];\n        if ($gain > $best) $best = $gain;\n    }\n    return $base + $best;\n}`,
        ruby: `def maxSatisfied(customers, grumpy, minutes)\n  n = customers.length\n  base = 0\n  (0...n).each { |i| base += customers[i] if grumpy[i] == 0 }\n  gain = 0\n  (0...[minutes, n].min).each { |i| gain += customers[i] if grumpy[i] == 1 }\n  best = gain\n  (minutes...n).each do |i|\n    gain += customers[i] if grumpy[i] == 1\n    gain -= customers[i - minutes] if grumpy[i - minutes] == 1\n    best = gain if gain > best\n  end\n  base + best\nend`,
      },
    };
  })(),

  // ── Maximum Points You Can Obtain from Cards (LC 1423) ──────────
  (() => {
    const ref = (cardPoints: number[], k: number) => {
      const n = cardPoints.length;
      let sum = 0;
      for (let i = 0; i < k; i++) sum += cardPoints[i];
      let best = sum;
      for (let i = 1; i <= k; i++) {
        sum += cardPoints[n - i] - cardPoints[k - i];
        if (sum > best) best = sum;
      }
      return best;
    };
    return {
      slug: "maximum-points-you-can-obtain-from-cards",
      title: "Maximum Points You Can Obtain from Cards",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Prefix Sum", "Amazon", "Google", "Razorpay"],
      signature: { funcName: "maxScore", params: [{ name: "cardPoints", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Cards are laid out in a row. In one step you take a card from the **beginning or the end** of the row. You take exactly `k` cards.\n\nReturn the maximum total points you can collect.",
        [
          { in: "cardPoints = [1,2,3,4,5,6,1], k = 3", out: "12", note: "Take from the right: 1, 6, 5." },
          { in: "cardPoints = [2,2,2], k = 2", out: "4" },
          { in: "cardPoints = [9,7,7,9,7,7,9], k = 7", out: "55", note: "Taking every card." },
        ],
        ["1 <= cardPoints.length <= 100000", "1 <= cardPoints[i] <= 10000", "1 <= k <= cardPoints.length"]),
      hints: [
        "Whatever you take is a prefix of some length plus a suffix of the rest — the taken cards are never from the middle.",
        "Equivalently, the cards you *leave* form one contiguous block of `n - k` cards.",
        "So maximise the taken total by sliding the split point from all-prefix to all-suffix.",
      ],
      editorial: explain({
        idea: "Every valid choice takes `i` cards from the front and `k - i` from the back. Start from the all-front case and move one card at a time from the front group to the back group, which is a constant-time update.",
        steps: [
          "Sum the first `k` cards — the all-prefix choice.",
          "For `i` from 1 to `k`, swap one card: add `cardPoints[n - i]` and subtract `cardPoints[k - i]`.",
          "Track the maximum.",
        ],
        why: "Taking from either end means the taken cards always form a prefix and a suffix, so the `k + 1` splits enumerate every possibility. The roll keeps each step constant time, and the equivalent 'minimise the untouched middle window' view is the same computation read the other way round.",
        time: "O(k)",
        space: "O(1)",
        pitfalls: [
          "`k` can equal `n`, where the middle window is empty and the answer is the whole sum.",
          "Enumerating all `2^k` sequences of moves is exponential and unnecessary — only the split matters.",
          "The total reaches `10^9`, at the edge of `int`.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5,6,1]\n3", expectedOutput: "12" },
        { input: "[2,2,2]\n2", expectedOutput: "4" },
        { input: "[9,7,7,9,7,7,9]\n7", expectedOutput: "55" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const cardPoints = Array.from({ length: n }, () => ri(rng, 1, 10000));
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(cardPoints)}\n${k}`, expectedOutput: String(ref(cardPoints, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxScore(cardPoints: List[int], k: int) -> int:\n    n = len(cardPoints)\n    total = sum(cardPoints[:k])\n    best = total\n    for i in range(1, k + 1):\n        total += cardPoints[n - i] - cardPoints[k - i]\n        best = max(best, total)\n    return best`,
        javascript: `var maxScore = function(cardPoints, k) {\n    var n = cardPoints.length, sum = 0, i;\n    for (i = 0; i < k; i++) sum += cardPoints[i];\n    var best = sum;\n    for (i = 1; i <= k; i++) {\n        sum += cardPoints[n - i] - cardPoints[k - i];\n        if (sum > best) best = sum;\n    }\n    return best;\n};`,
        typescript: `function maxScore(cardPoints: number[], k: number): number {\n    var n = cardPoints.length, sum = 0, i: number;\n    for (i = 0; i < k; i++) sum += cardPoints[i];\n    var best = sum;\n    for (i = 1; i <= k; i++) {\n        sum += cardPoints[n - i] - cardPoints[k - i];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,
        java: `public static int maxScore(int[] cardPoints, int k) {\n    int n = cardPoints.length, sum = 0;\n    for (int i = 0; i < k; i++) sum += cardPoints[i];\n    int best = sum;\n    for (int i = 1; i <= k; i++) {\n        sum += cardPoints[n - i] - cardPoints[k - i];\n        best = Math.max(best, sum);\n    }\n    return best;\n}`,
        cpp: `int maxScore(vector<int>& cardPoints, int k) {\n    int n = (int) cardPoints.size(), sum = 0;\n    for (int i = 0; i < k; i++) sum += cardPoints[i];\n    int best = sum;\n    for (int i = 1; i <= k; i++) {\n        sum += cardPoints[n - i] - cardPoints[k - i];\n        best = max(best, sum);\n    }\n    return best;\n}`,
        c: `int maxScore(int* cardPoints, int cardPointsSize, int k) {\n    int n = cardPointsSize, sum = 0;\n    for (int i = 0; i < k; i++) sum += cardPoints[i];\n    int best = sum;\n    for (int i = 1; i <= k; i++) {\n        sum += cardPoints[n - i] - cardPoints[k - i];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,
        csharp: `public static int MaxScore(int[] cardPoints, int k)\n{\n    int n = cardPoints.Length, sum = 0;\n    for (int i = 0; i < k; i++) sum += cardPoints[i];\n    int best = sum;\n    for (int i = 1; i <= k; i++)\n    {\n        sum += cardPoints[n - i] - cardPoints[k - i];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,
        go: `func maxScore(cardPoints []int, k int) int {\n\tn := len(cardPoints)\n\tsum := 0\n\tfor i := 0; i < k; i++ {\n\t\tsum += cardPoints[i]\n\t}\n\tbest := sum\n\tfor i := 1; i <= k; i++ {\n\t\tsum += cardPoints[n-i] - cardPoints[k-i]\n\t\tif sum > best {\n\t\t\tbest = sum\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxScore(cardPoints: IntArray, k: Int): Int {\n    val n = cardPoints.size\n    var sum = 0\n    for (i in 0 until k) sum += cardPoints[i]\n    var best = sum\n    for (i in 1..k) {\n        sum += cardPoints[n - i] - cardPoints[k - i]\n        if (sum > best) best = sum\n    }\n    return best\n}`,
        swift: `func maxScore(_ cardPoints: [Int], _ k: Int) -> Int {\n    let n = cardPoints.count\n    var sum = 0\n    for i in 0..<k { sum += cardPoints[i] }\n    var best = sum\n    for i in 1...k {\n        sum += cardPoints[n - i] - cardPoints[k - i]\n        if sum > best { best = sum }\n    }\n    return best\n}`,
        rust: `fn maxScore(cardPoints: Vec<i32>, k: i32) -> i32 {\n    let n = cardPoints.len();\n    let k = k as usize;\n    let mut sum = 0i32;\n    for i in 0..k {\n        sum += cardPoints[i];\n    }\n    let mut best = sum;\n    for i in 1..=k {\n        sum += cardPoints[n - i] - cardPoints[k - i];\n        if sum > best {\n            best = sum;\n        }\n    }\n    best\n}`,
        php: `function maxScore($cardPoints, $k) {\n    $n = count($cardPoints);\n    $sum = 0;\n    for ($i = 0; $i < $k; $i++) $sum += $cardPoints[$i];\n    $best = $sum;\n    for ($i = 1; $i <= $k; $i++) {\n        $sum += $cardPoints[$n - $i] - $cardPoints[$k - $i];\n        if ($sum > $best) $best = $sum;\n    }\n    return $best;\n}`,
        ruby: `def maxScore(cardPoints, k)\n  n = cardPoints.length\n  sum = cardPoints[0, k].sum\n  best = sum\n  (1..k).each do |i|\n    sum += cardPoints[n - i] - cardPoints[k - i]\n    best = sum if sum > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── K Radius Subarray Averages (LC 2090) ────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      const out = new Array(n).fill(-1);
      const w = 2 * k + 1;
      if (w > n) return out;
      let sum = 0;
      for (let i = 0; i < w; i++) sum += nums[i];
      out[k] = Math.floor(sum / w);
      for (let i = w; i < n; i++) {
        sum += nums[i] - nums[i - w];
        out[i - k] = Math.floor(sum / w);
      }
      return out;
    };
    return {
      slug: "k-radius-subarray-averages",
      title: "K Radius Subarray Averages",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Prefix Sum", "Amazon", "Microsoft", "Zoho"],
      signature: { funcName: "getAverages", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "The **k-radius average** of index `i` is the average of `nums[i-k … i+k]`, rounded **down** to an integer. If fewer than `k` elements exist on either side, the average is `-1`.\n\nReturn an array holding the k-radius average of every index.",
        [
          { in: "nums = [7,4,3,9,1,8,5,2,6], k = 3", out: "[-1,-1,-1,5,4,4,-1,-1,-1]", note: "Index 3 averages 7+4+3+9+1+8+5 = 37 over 7, which floors to 5." },
          { in: "nums = [100000], k = 0", out: "[100000]", note: "A radius of 0 is the element itself." },
          { in: "nums = [8], k = 100", out: "[-1]" },
        ],
        ["1 <= nums.length <= 100000", "0 <= nums[i], k <= 100000"]),
      hints: [
        "The window is fixed at `2k + 1` elements, centred on the index being filled.",
        "If `2k + 1` exceeds the array length, every answer is `-1`.",
        "The running sum reaches `10^5 · 10^5 = 10^10` — wider than a 32-bit integer.",
      ],
      editorial: explain({
        idea: "A fixed-size rolling sum. Seed it with the first `2k + 1` elements, write the average at the window's centre, then slide one step at a time.",
        steps: [
          "Fill the output with `-1`.",
          "If `2k + 1 > n`, return it as is.",
          "Sum the first window and write the floor average at index `k`.",
          "For each further right end `i`, roll the sum and write at `i - k`.",
        ],
        why: "Each index's window is determined by its centre, and neighbouring centres share all but two elements, so the sum rolls in constant time. Indices near either edge genuinely have no full window, which is what the `-1` marks.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Accumulating the sum in a 32-bit integer overflows at the stated limits — use 64-bit.",
          "`k = 0` must still produce every element, not all `-1`.",
          "The average floors, so integer division is what is wanted — but only because every value is non-negative.",
        ],
      }),
      examples: [
        { input: "[7,4,3,9,1,8,5,2,6]\n3", expectedOutput: "[-1,-1,-1,5,4,4,-1,-1,-1]" },
        { input: "[100000]\n0", expectedOutput: "[100000]" },
        { input: "[8]\n100", expectedOutput: "[-1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const hi = rng() < 0.6 ? 100 : 100000;
        const nums = Array.from({ length: n }, () => ri(rng, 0, hi));
        const k = rng() < 0.7 ? ri(rng, 0, Math.ceil(n / 2)) : ri(rng, 0, 100000);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: fmtIntArr(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef getAverages(nums: List[int], k: int) -> List[int]:\n    n = len(nums)\n    out = [-1] * n\n    w = 2 * k + 1\n    if w > n:\n        return out\n    total = sum(nums[:w])\n    out[k] = total // w\n    for i in range(w, n):\n        total += nums[i] - nums[i - w]\n        out[i - k] = total // w\n    return out`,
        javascript: `var getAverages = function(nums, k) {\n    var n = nums.length;\n    var out = [];\n    for (var t = 0; t < n; t++) out.push(-1);\n    var w = 2 * k + 1;\n    if (w > n) return out;\n    var sum = 0;\n    for (var i = 0; i < w; i++) sum += nums[i];\n    out[k] = Math.floor(sum / w);\n    for (var j = w; j < n; j++) {\n        sum += nums[j] - nums[j - w];\n        out[j - k] = Math.floor(sum / w);\n    }\n    return out;\n};`,
        typescript: `function getAverages(nums: number[], k: number): number[] {\n    var n = nums.length;\n    var out: number[] = [];\n    for (var t = 0; t < n; t++) out.push(-1);\n    var w = 2 * k + 1;\n    if (w > n) return out;\n    var sum = 0;\n    for (var i = 0; i < w; i++) sum += nums[i];\n    out[k] = Math.floor(sum / w);\n    for (var j = w; j < n; j++) {\n        sum += nums[j] - nums[j - w];\n        out[j - k] = Math.floor(sum / w);\n    }\n    return out;\n}`,
        java: `public static int[] getAverages(int[] nums, int k) {\n    int n = nums.length;\n    int[] out = new int[n];\n    Arrays.fill(out, -1);\n    long w = 2L * k + 1;\n    if (w > n) return out;\n    int width = (int) w;\n    long sum = 0;\n    for (int i = 0; i < width; i++) sum += nums[i];\n    out[k] = (int) (sum / w);\n    for (int i = width; i < n; i++) {\n        sum += nums[i] - nums[i - width];\n        out[i - k] = (int) (sum / w);\n    }\n    return out;\n}`,
        cpp: `vector<int> getAverages(vector<int>& nums, int k) {\n    int n = (int) nums.size();\n    vector<int> out(n, -1);\n    long long w = 2LL * k + 1;\n    if (w > n) return out;\n    int width = (int) w;\n    long long sum = 0;\n    for (int i = 0; i < width; i++) sum += nums[i];\n    out[k] = (int) (sum / w);\n    for (int i = width; i < n; i++) {\n        sum += nums[i] - nums[i - width];\n        out[i - k] = (int) (sum / w);\n    }\n    return out;\n}`,
        c: `int* getAverages(int* nums, int numsSize, int k, int* returnSize) {\n    int n = numsSize;\n    int* out = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) out[i] = -1;\n    *returnSize = n;\n    long long w = 2LL * k + 1;\n    if (w > n) return out;\n    int width = (int) w;\n    long long sum = 0;\n    for (int i = 0; i < width; i++) sum += nums[i];\n    out[k] = (int) (sum / w);\n    for (int i = width; i < n; i++) {\n        sum += nums[i] - nums[i - width];\n        out[i - k] = (int) (sum / w);\n    }\n    return out;\n}`,
        csharp: `public static int[] GetAverages(int[] nums, int k)\n{\n    int n = nums.Length;\n    int[] out_ = new int[n];\n    for (int i = 0; i < n; i++) out_[i] = -1;\n    long w = 2L * k + 1;\n    if (w > n) return out_;\n    int width = (int) w;\n    long sum = 0;\n    for (int i = 0; i < width; i++) sum += nums[i];\n    out_[k] = (int) (sum / w);\n    for (int i = width; i < n; i++)\n    {\n        sum += nums[i] - nums[i - width];\n        out_[i - k] = (int) (sum / w);\n    }\n    return out_;\n}`,
        go: `func getAverages(nums []int, k int) []int {\n\tn := len(nums)\n\tout := make([]int, n)\n\tfor i := range out {\n\t\tout[i] = -1\n\t}\n\tw := 2*k + 1\n\tif w > n {\n\t\treturn out\n\t}\n\tsum := 0\n\tfor i := 0; i < w; i++ {\n\t\tsum += nums[i]\n\t}\n\tout[k] = sum / w\n\tfor i := w; i < n; i++ {\n\t\tsum += nums[i] - nums[i-w]\n\t\tout[i-k] = sum / w\n\t}\n\treturn out\n}`,
        kotlin: `fun getAverages(nums: IntArray, k: Int): IntArray {\n    val n = nums.size\n    val out = IntArray(n) { -1 }\n    val w = 2L * k + 1\n    if (w > n) return out\n    val width = w.toInt()\n    var sum = 0L\n    for (i in 0 until width) sum += nums[i]\n    out[k] = (sum / w).toInt()\n    for (i in width until n) {\n        sum += (nums[i] - nums[i - width]).toLong()\n        out[i - k] = (sum / w).toInt()\n    }\n    return out\n}`,
        swift: `func getAverages(_ nums: [Int], _ k: Int) -> [Int] {\n    let n = nums.count\n    var out = [Int](repeating: -1, count: n)\n    let w = 2 * k + 1\n    if w > n { return out }\n    var sum = 0\n    for i in 0..<w { sum += nums[i] }\n    out[k] = sum / w\n    var i = w\n    while i < n {\n        sum += nums[i] - nums[i - w]\n        out[i - k] = sum / w\n        i += 1\n    }\n    return out\n}`,
        rust: `fn getAverages(nums: Vec<i32>, k: i32) -> Vec<i32> {\n    let n = nums.len();\n    let mut out = vec![-1i32; n];\n    let w: i64 = 2 * k as i64 + 1;\n    if w > n as i64 {\n        return out;\n    }\n    let width = w as usize;\n    let mut sum: i64 = 0;\n    for i in 0..width {\n        sum += nums[i] as i64;\n    }\n    out[k as usize] = (sum / w) as i32;\n    for i in width..n {\n        sum += (nums[i] - nums[i - width]) as i64;\n        out[i - k as usize] = (sum / w) as i32;\n    }\n    out\n}`,
        php: `function getAverages($nums, $k) {\n    $n = count($nums);\n    $out = array_fill(0, $n, -1);\n    $w = 2 * $k + 1;\n    if ($w > $n) return $out;\n    $sum = 0;\n    for ($i = 0; $i < $w; $i++) $sum += $nums[$i];\n    $out[$k] = intdiv($sum, $w);\n    for ($i = $w; $i < $n; $i++) {\n        $sum += $nums[$i] - $nums[$i - $w];\n        $out[$i - $k] = intdiv($sum, $w);\n    }\n    return $out;\n}`,
        ruby: `def getAverages(nums, k)\n  n = nums.length\n  out = Array.new(n, -1)\n  w = 2 * k + 1\n  return out if w > n\n  sum = nums[0, w].sum\n  out[k] = sum / w\n  (w...n).each do |i|\n    sum += nums[i] - nums[i - w]\n    out[i - k] = sum / w\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Frequency of the Most Frequent Element (LC 1838) ────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const a = nums.slice().sort((x, y) => x - y);
      let l = 0, sum = 0, best = 1;
      for (let r = 0; r < a.length; r++) {
        sum += a[r];
        while (a[r] * (r - l + 1) - sum > k) { sum -= a[l]; l++; }
        if (r - l + 1 > best) best = r - l + 1;
      }
      return best;
    };
    return {
      slug: "frequency-of-the-most-frequent-element",
      title: "Frequency of the Most Frequent Element",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Greedy", "Sorting", "Binary Search", "Amazon", "Google", "Salesforce"],
      signature: { funcName: "maxFrequency", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "In one operation you may increment any element of `nums` by 1. You may perform at most `k` operations in total.\n\nReturn the maximum possible frequency of any single value afterwards.",
        [
          { in: "nums = [1,2,4], k = 5", out: "3", note: "Raise 1 to 4 (3 operations) and 2 to 4 (2 more) — every element becomes 4." },
          { in: "nums = [1,4,8,13], k = 5", out: "2", note: "Raising 4 to 8 costs 4." },
          { in: "nums = [3,9,6], k = 2", out: "1" },
        ],
        ["1 <= nums.length <= 100000", "1 <= nums[i] <= 100000", "1 <= k <= 100000000"]),
      hints: [
        "Only increments are allowed, so the final common value must be one of the existing elements — the largest in the group.",
        "Sort, then ask: for a window ending at `r`, what does it cost to raise everything in it to `nums[r]`?",
        "That cost is `nums[r] · windowSize − windowSum`, which grows as the window widens.",
      ],
      editorial: explain({
        idea: "Sorting makes the cheapest group of equal values contiguous, because raising an element to a target costs the gap and you would never skip a nearer element for a further one. The cost of a window is then a closed form, and it is monotone in the window's width.",
        steps: [
          "Sort `nums`.",
          "Slide a window; on adding `a[r]`, the cost to level the window to `a[r]` is `a[r] · (r - l + 1) - windowSum`.",
          "While that exceeds `k`, drop `a[l]` and advance `l`.",
          "Track the widest valid window.",
        ],
        why: "With increments only, the target must be the window's maximum, which after sorting is `a[r]`. Widening the window on the left adds a smaller element, so the levelling cost only ever increases — the predicate is monotone and a single left pointer suffices. Each index enters and leaves once.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "`a[r] · windowSize` reaches `10^5 · 10^5 = 10^10` — the arithmetic needs 64-bit even though the answer is small.",
          "Targeting a value not present in the array is never better, since lowering the target can only reduce the cost.",
          "The answer is at least 1, so seed the best accordingly.",
        ],
      }),
      examples: [
        { input: "[1,2,4]\n5", expectedOutput: "3" },
        { input: "[1,4,8,13]\n5", expectedOutput: "2" },
        { input: "[3,9,6]\n2", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 30 : 100000;
        const nums = Array.from({ length: ri(rng, 1, 40) }, () => ri(rng, 1, hi));
        const k = rng() < 0.6 ? ri(rng, 1, 200) : ri(rng, 1, 100000000);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxFrequency(nums: List[int], k: int) -> int:\n    a = sorted(nums)\n    l = 0\n    total = 0\n    best = 1\n    for r in range(len(a)):\n        total += a[r]\n        while a[r] * (r - l + 1) - total > k:\n            total -= a[l]\n            l += 1\n        best = max(best, r - l + 1)\n    return best`,
        javascript: `var maxFrequency = function(nums, k) {\n    var a = nums.slice().sort(function(x, y) { return x - y; });\n    var l = 0, sum = 0, best = 1;\n    for (var r = 0; r < a.length; r++) {\n        sum += a[r];\n        while (a[r] * (r - l + 1) - sum > k) { sum -= a[l]; l++; }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n};`,
        typescript: `function maxFrequency(nums: number[], k: number): number {\n    var a = nums.slice().sort(function(x, y) { return x - y; });\n    var l = 0, sum = 0, best = 1;\n    for (var r = 0; r < a.length; r++) {\n        sum += a[r];\n        while (a[r] * (r - l + 1) - sum > k) { sum -= a[l]; l++; }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        java: `public static int maxFrequency(int[] nums, int k) {\n    int[] a = nums.clone();\n    Arrays.sort(a);\n    int l = 0, best = 1;\n    long sum = 0;\n    for (int r = 0; r < a.length; r++) {\n        sum += a[r];\n        while ((long) a[r] * (r - l + 1) - sum > k) {\n            sum -= a[l];\n            l++;\n        }\n        best = Math.max(best, r - l + 1);\n    }\n    return best;\n}`,
        cpp: `int maxFrequency(vector<int>& nums, int k) {\n    vector<int> a = nums;\n    sort(a.begin(), a.end());\n    int l = 0, best = 1;\n    long long sum = 0;\n    for (int r = 0; r < (int) a.size(); r++) {\n        sum += a[r];\n        while ((long long) a[r] * (r - l + 1) - sum > k) {\n            sum -= a[l];\n            l++;\n        }\n        best = max(best, r - l + 1);\n    }\n    return best;\n}`,
        c: `static int cmpFreqAsc(const void* x, const void* y) {\n    int p = *(const int*) x;\n    int q = *(const int*) y;\n    return (p > q) - (p < q);\n}\n\nint maxFrequency(int* nums, int numsSize, int k) {\n    int* a = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    qsort(a, (size_t) numsSize, sizeof(int), cmpFreqAsc);\n    int l = 0, best = 1;\n    long long sum = 0;\n    for (int r = 0; r < numsSize; r++) {\n        sum += a[r];\n        while ((long long) a[r] * (r - l + 1) - sum > (long long) k) {\n            sum -= a[l];\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    free(a);\n    return best;\n}`,
        csharp: `public static int MaxFrequency(int[] nums, int k)\n{\n    int[] a = (int[]) nums.Clone();\n    Array.Sort(a);\n    int l = 0, best = 1;\n    long sum = 0;\n    for (int r = 0; r < a.Length; r++)\n    {\n        sum += a[r];\n        while ((long) a[r] * (r - l + 1) - sum > k)\n        {\n            sum -= a[l];\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        go: `func maxFrequency(nums []int, k int) int {\n\ta := append([]int{}, nums...)\n\tsort.Ints(a)\n\tl, best := 0, 1\n\tsum := 0\n\tfor r := 0; r < len(a); r++ {\n\t\tsum += a[r]\n\t\tfor a[r]*(r-l+1)-sum > k {\n\t\t\tsum -= a[l]\n\t\t\tl++\n\t\t}\n\t\tif r-l+1 > best {\n\t\t\tbest = r - l + 1\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxFrequency(nums: IntArray, k: Int): Int {\n    val a = nums.sortedArray()\n    var l = 0\n    var best = 1\n    var sum = 0L\n    for (r in a.indices) {\n        sum += a[r]\n        while (a[r].toLong() * (r - l + 1) - sum > k) {\n            sum -= a[l]\n            l++\n        }\n        if (r - l + 1 > best) best = r - l + 1\n    }\n    return best\n}`,
        swift: `func maxFrequency(_ nums: [Int], _ k: Int) -> Int {\n    let a = nums.sorted()\n    var l = 0\n    var sum = 0\n    var best = 1\n    for r in 0..<a.count {\n        sum += a[r]\n        while a[r] * (r - l + 1) - sum > k {\n            sum -= a[l]\n            l += 1\n        }\n        if r - l + 1 > best { best = r - l + 1 }\n    }\n    return best\n}`,
        rust: `fn maxFrequency(nums: Vec<i32>, k: i32) -> i32 {\n    let mut a = nums.clone();\n    a.sort();\n    let mut l = 0usize;\n    let mut sum: i64 = 0;\n    let mut best = 1i32;\n    for r in 0..a.len() {\n        sum += a[r] as i64;\n        while a[r] as i64 * (r + 1 - l) as i64 - sum > k as i64 {\n            sum -= a[l] as i64;\n            l += 1;\n        }\n        let len = (r + 1 - l) as i32;\n        if len > best {\n            best = len;\n        }\n    }\n    best\n}`,
        php: `function maxFrequency($nums, $k) {\n    $a = $nums;\n    sort($a);\n    $l = 0;\n    $sum = 0;\n    $best = 1;\n    for ($r = 0; $r < count($a); $r++) {\n        $sum += $a[$r];\n        while ($a[$r] * ($r - $l + 1) - $sum > $k) {\n            $sum -= $a[$l];\n            $l++;\n        }\n        if ($r - $l + 1 > $best) $best = $r - $l + 1;\n    }\n    return $best;\n}`,
        ruby: `def maxFrequency(nums, k)\n  a = nums.sort\n  l = 0\n  sum = 0\n  best = 1\n  (0...a.length).each do |r|\n    sum += a[r]\n    while a[r] * (r - l + 1) - sum > k\n      sum -= a[l]\n      l += 1\n    end\n    best = r - l + 1 if r - l + 1 > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Maximize the Confusion of an Exam (LC 2024) ─────────────────
  (() => {
    const ref = (answerKey: string, k: number) => {
      const run = (target: string) => {
        let l = 0, bad = 0, best = 0;
        for (let r = 0; r < answerKey.length; r++) {
          if (answerKey[r] !== target) bad++;
          while (bad > k) { if (answerKey[l] !== target) bad--; l++; }
          if (r - l + 1 > best) best = r - l + 1;
        }
        return best;
      };
      return Math.max(run("T"), run("F"));
    };
    return {
      slug: "maximize-the-confusion-of-an-exam",
      title: "Maximize the Confusion of an Exam",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window", "Prefix Sum", "Binary Search", "Amazon", "Google", "Adobe"],
      signature: { funcName: "maxConsecutiveAnswers", params: [{ name: "answerKey", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`answerKey[i]` is the answer to question `i`, either `'T'` or `'F'`. You may change the answer to any question, at most `k` times.\n\nReturn the maximum number of consecutive `'T'`s or consecutive `'F'`s you can produce.",
        [
          { in: 'answerKey = "TTFF", k = 2', out: "4", note: "Flip both F to T." },
          { in: 'answerKey = "TFFT", k = 1', out: "3", note: 'Flipping the first T gives "FFFT".' },
          { in: 'answerKey = "TTFTTFTT", k = 1', out: "5" },
        ],
        ["1 <= answerKey.length <= 50000", "answerKey[i] is 'T' or 'F'", "1 <= k <= answerKey.length"]),
      hints: [
        "Solve it twice: once aiming for all `'T'`, once for all `'F'`, and take the better.",
        "For a fixed target, a window is valid when it holds at most `k` characters that are not the target.",
        "That predicate is monotone in the window's left edge, so one pass per target suffices.",
      ],
      editorial: explain({
        idea: "Decide the target character first. Then the problem becomes the familiar 'longest window with at most `k` mismatches' — grow on the right, shrink on the left whenever the mismatch count exceeds `k`. Run it for both targets.",
        steps: [
          "For a target `c`, slide a window keeping `bad`, the count of characters that are not `c`.",
          "While `bad > k`, advance the left edge, decrementing `bad` when the character leaving was a mismatch.",
          "Record the longest valid window, then repeat for the other target and take the maximum.",
        ],
        why: "Every final run is entirely `'T'` or entirely `'F'`, so splitting into two independent passes loses nothing. Within a pass, removing a character can only lower the mismatch count, which makes the valid left edges a suffix and keeps the scan linear.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Solving for only one target misses the case where the other letter dominates.",
          "The two passes can share a window only with care — the mismatch counts are different.",
          "`k` can exceed the number of mismatches, in which case the whole string is the answer.",
        ],
      }),
      examples: [
        { input: '"TTFF"\n2', expectedOutput: "4" },
        { input: '"TFFT"\n1', expectedOutput: "3" },
        { input: '"TTFTTFTT"\n1', expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 45);
        const answerKey = Array.from({ length: n }, () => (rng() < 0.5 ? "T" : "F")).join("");
        const k = ri(rng, 1, n);
        return { input: `"${answerKey}"\n${k}`, expectedOutput: String(ref(answerKey, k)) };
      },
      solutions: {
        python: `def maxConsecutiveAnswers(answerKey: str, k: int) -> int:\n    def run(target: str) -> int:\n        l = 0\n        bad = 0\n        best = 0\n        for r, ch in enumerate(answerKey):\n            if ch != target:\n                bad += 1\n            while bad > k:\n                if answerKey[l] != target:\n                    bad -= 1\n                l += 1\n            best = max(best, r - l + 1)\n        return best\n\n    return max(run("T"), run("F"))`,
        javascript: `var maxConsecutiveAnswers = function(answerKey, k) {\n    var run = function(target) {\n        var l = 0, bad = 0, best = 0;\n        for (var r = 0; r < answerKey.length; r++) {\n            if (answerKey.charAt(r) !== target) bad++;\n            while (bad > k) {\n                if (answerKey.charAt(l) !== target) bad--;\n                l++;\n            }\n            if (r - l + 1 > best) best = r - l + 1;\n        }\n        return best;\n    };\n    return Math.max(run("T"), run("F"));\n};`,
        typescript: `function maxConsecutiveAnswers(answerKey: string, k: number): number {\n    var run = function(target: string): number {\n        var l = 0, bad = 0, best = 0;\n        for (var r = 0; r < answerKey.length; r++) {\n            if (answerKey.charAt(r) !== target) bad++;\n            while (bad > k) {\n                if (answerKey.charAt(l) !== target) bad--;\n                l++;\n            }\n            if (r - l + 1 > best) best = r - l + 1;\n        }\n        return best;\n    };\n    return Math.max(run("T"), run("F"));\n}`,
        java: `private static int runConfusion(String answerKey, int k, char target) {\n    int l = 0, bad = 0, best = 0;\n    for (int r = 0; r < answerKey.length(); r++) {\n        if (answerKey.charAt(r) != target) bad++;\n        while (bad > k) {\n            if (answerKey.charAt(l) != target) bad--;\n            l++;\n        }\n        best = Math.max(best, r - l + 1);\n    }\n    return best;\n}\n\npublic static int maxConsecutiveAnswers(String answerKey, int k) {\n    return Math.max(runConfusion(answerKey, k, 'T'), runConfusion(answerKey, k, 'F'));\n}`,
        cpp: `static int runConfusion(const string& answerKey, int k, char target) {\n    int l = 0, bad = 0, best = 0;\n    for (int r = 0; r < (int) answerKey.size(); r++) {\n        if (answerKey[r] != target) bad++;\n        while (bad > k) {\n            if (answerKey[l] != target) bad--;\n            l++;\n        }\n        best = max(best, r - l + 1);\n    }\n    return best;\n}\n\nint maxConsecutiveAnswers(string answerKey, int k) {\n    return max(runConfusion(answerKey, k, 'T'), runConfusion(answerKey, k, 'F'));\n}`,
        c: `static int runConfusion(char* answerKey, int n, int k, char target) {\n    int l = 0, bad = 0, best = 0;\n    for (int r = 0; r < n; r++) {\n        if (answerKey[r] != target) bad++;\n        while (bad > k) {\n            if (answerKey[l] != target) bad--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}\n\nint maxConsecutiveAnswers(char* answerKey, int k) {\n    int n = (int) strlen(answerKey);\n    int a = runConfusion(answerKey, n, k, 'T');\n    int b = runConfusion(answerKey, n, k, 'F');\n    return a > b ? a : b;\n}`,
        csharp: `private static int RunConfusion(string answerKey, int k, char target)\n{\n    int l = 0, bad = 0, best = 0;\n    for (int r = 0; r < answerKey.Length; r++)\n    {\n        if (answerKey[r] != target) bad++;\n        while (bad > k)\n        {\n            if (answerKey[l] != target) bad--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}\n\npublic static int MaxConsecutiveAnswers(string answerKey, int k)\n{\n    return Math.Max(RunConfusion(answerKey, k, 'T'), RunConfusion(answerKey, k, 'F'));\n}`,
        go: `func runConfusion(answerKey string, k int, target byte) int {\n\tl, bad, best := 0, 0, 0\n\tfor r := 0; r < len(answerKey); r++ {\n\t\tif answerKey[r] != target {\n\t\t\tbad++\n\t\t}\n\t\tfor bad > k {\n\t\t\tif answerKey[l] != target {\n\t\t\t\tbad--\n\t\t\t}\n\t\t\tl++\n\t\t}\n\t\tif r-l+1 > best {\n\t\t\tbest = r - l + 1\n\t\t}\n\t}\n\treturn best\n}\n\nfunc maxConsecutiveAnswers(answerKey string, k int) int {\n\ta := runConfusion(answerKey, k, 'T')\n\tb := runConfusion(answerKey, k, 'F')\n\tif a > b {\n\t\treturn a\n\t}\n\treturn b\n}`,
        kotlin: `private fun runConfusion(answerKey: String, k: Int, target: Char): Int {\n    var l = 0\n    var bad = 0\n    var best = 0\n    for (r in answerKey.indices) {\n        if (answerKey[r] != target) bad++\n        while (bad > k) {\n            if (answerKey[l] != target) bad--\n            l++\n        }\n        if (r - l + 1 > best) best = r - l + 1\n    }\n    return best\n}\n\nfun maxConsecutiveAnswers(answerKey: String, k: Int): Int {\n    return maxOf(runConfusion(answerKey, k, 'T'), runConfusion(answerKey, k, 'F'))\n}`,
        swift: `func maxConsecutiveAnswers(_ answerKey: String, _ k: Int) -> Int {\n    let a = Array(answerKey)\n    func run(_ target: Character) -> Int {\n        var l = 0\n        var bad = 0\n        var best = 0\n        for r in 0..<a.count {\n            if a[r] != target { bad += 1 }\n            while bad > k {\n                if a[l] != target { bad -= 1 }\n                l += 1\n            }\n            if r - l + 1 > best { best = r - l + 1 }\n        }\n        return best\n    }\n    return max(run("T"), run("F"))\n}`,
        rust: `fn maxConsecutiveAnswers(answerKey: String, k: i32) -> i32 {\n    let b = answerKey.as_bytes();\n    let run = |target: u8| -> i32 {\n        let mut l = 0usize;\n        let mut bad = 0i32;\n        let mut best = 0i32;\n        for r in 0..b.len() {\n            if b[r] != target {\n                bad += 1;\n            }\n            while bad > k {\n                if b[l] != target {\n                    bad -= 1;\n                }\n                l += 1;\n            }\n            let len = (r + 1 - l) as i32;\n            if len > best {\n                best = len;\n            }\n        }\n        best\n    };\n    run(b'T').max(run(b'F'))\n}`,
        php: `function maxConsecutiveAnswers($answerKey, $k) {\n    $run = function($target) use ($answerKey, $k) {\n        $l = 0;\n        $bad = 0;\n        $best = 0;\n        $n = strlen($answerKey);\n        for ($r = 0; $r < $n; $r++) {\n            if ($answerKey[$r] !== $target) $bad++;\n            while ($bad > $k) {\n                if ($answerKey[$l] !== $target) $bad--;\n                $l++;\n            }\n            if ($r - $l + 1 > $best) $best = $r - $l + 1;\n        }\n        return $best;\n    };\n    return max($run("T"), $run("F"));\n}`,
        ruby: `def maxConsecutiveAnswers(answerKey, k)\n  run = lambda do |target|\n    l = 0\n    bad = 0\n    best = 0\n    answerKey.each_char.with_index do |ch, r|\n      bad += 1 if ch != target\n      while bad > k\n        bad -= 1 if answerKey[l] != target\n        l += 1\n      end\n      best = r - l + 1 if r - l + 1 > best\n    end\n    best\n  end\n  [run.call("T"), run.call("F")].max\nend`,
      },
    };
  })(),

  // ── Get Equal Substrings Within Budget (LC 1208) ────────────────
  (() => {
    const ref = (s: string, t: string, maxCost: number) => {
      let l = 0, cost = 0, best = 0;
      for (let r = 0; r < s.length; r++) {
        cost += Math.abs(s.charCodeAt(r) - t.charCodeAt(r));
        while (cost > maxCost) { cost -= Math.abs(s.charCodeAt(l) - t.charCodeAt(l)); l++; }
        if (r - l + 1 > best) best = r - l + 1;
      }
      return best;
    };
    return {
      slug: "get-equal-substrings-within-budget",
      title: "Get Equal Substrings Within Budget",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window", "Binary Search", "Prefix Sum", "Amazon", "Google", "Infosys"],
      signature: { funcName: "equalSubstring", params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }, { name: "maxCost", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`s` and `t` have the same length. Changing `s[i]` into `t[i]` costs `|s[i] - t[i]|` in ASCII.\n\nWith a total budget of `maxCost`, return the length of the longest substring of `s` you can turn into the matching substring of `t`.",
        [
          { in: 's = "codekairo", t = "codekairp", maxCost = 1', out: "9", note: "Only the last character differs, at a cost of 1." },
          { in: 's = "abcd", t = "bcdf", maxCost = 3', out: "3", note: 'Changing "abc" to "bcd" costs 3.' },
          { in: 's = "abcd", t = "acde", maxCost = 0', out: "1", note: "With no budget, only an already-matching character counts." },
        ],
        ["1 <= s.length == t.length <= 100000", "0 <= maxCost <= 1000000", "s and t consist of lowercase English letters."]),
      hints: [
        "Turn the two strings into one array of per-index costs.",
        "The question becomes: the longest subarray whose sum is at most `maxCost`.",
        "Costs are non-negative, so shrinking a window never raises its sum — a plain two-pointer window works.",
      ],
      editorial: explain({
        idea: "Reduce to a single cost array, then find the longest window whose sum fits the budget. Non-negative costs make the sum monotone in the window's width, which is exactly what a sliding window needs.",
        steps: [
          "For each index, the cost is `|s[i] - t[i]|`.",
          "Extend the right edge, adding that cost to the running sum.",
          "While the sum exceeds `maxCost`, subtract the left cost and advance the left edge.",
          "Track the longest valid window.",
        ],
        why: "Every cost is at least 0, so removing an index can only lower the window's total. For a fixed right edge the valid left edges therefore form a suffix, so the left pointer never moves backwards and the whole scan is linear. With negative costs this would fail and a prefix-sum approach would be needed.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`maxCost` can be 0, where the answer is the longest run of already-equal characters (at least 1 if any index matches, else 1 for a zero-length... in fact 0 when no index matches).",
          "Comparing characters without `abs` gives negative costs and breaks the monotonicity.",
          "The total reaches `10^5 · 25`, well inside `int`.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n"codekairp"\n1', expectedOutput: "9" },
        { input: '"abcd"\n"bcdf"\n3', expectedOutput: "3" },
        { input: '"abcd"\n"acde"\n0', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const s = Array.from({ length: n }, () => randLower(rng)).join("");
        const t = Array.from({ length: n }, (_, i) => (rng() < 0.4 ? s[i] : randLower(rng))).join("");
        const maxCost = rng() < 0.5 ? ri(rng, 0, 20) : ri(rng, 0, 1000000);
        return { input: `"${s}"\n"${t}"\n${maxCost}`, expectedOutput: String(ref(s, t, maxCost)) };
      },
      solutions: {
        python: `def equalSubstring(s: str, t: str, maxCost: int) -> int:\n    l = 0\n    cost = 0\n    best = 0\n    for r in range(len(s)):\n        cost += abs(ord(s[r]) - ord(t[r]))\n        while cost > maxCost:\n            cost -= abs(ord(s[l]) - ord(t[l]))\n            l += 1\n        best = max(best, r - l + 1)\n    return best`,
        javascript: `var equalSubstring = function(s, t, maxCost) {\n    var l = 0, cost = 0, best = 0;\n    for (var r = 0; r < s.length; r++) {\n        cost += Math.abs(s.charCodeAt(r) - t.charCodeAt(r));\n        while (cost > maxCost) {\n            cost -= Math.abs(s.charCodeAt(l) - t.charCodeAt(l));\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n};`,
        typescript: `function equalSubstring(s: string, t: string, maxCost: number): number {\n    var l = 0, cost = 0, best = 0;\n    for (var r = 0; r < s.length; r++) {\n        cost += Math.abs(s.charCodeAt(r) - t.charCodeAt(r));\n        while (cost > maxCost) {\n            cost -= Math.abs(s.charCodeAt(l) - t.charCodeAt(l));\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        java: `public static int equalSubstring(String s, String t, int maxCost) {\n    int l = 0, cost = 0, best = 0;\n    for (int r = 0; r < s.length(); r++) {\n        cost += Math.abs(s.charAt(r) - t.charAt(r));\n        while (cost > maxCost) {\n            cost -= Math.abs(s.charAt(l) - t.charAt(l));\n            l++;\n        }\n        best = Math.max(best, r - l + 1);\n    }\n    return best;\n}`,
        cpp: `int equalSubstring(string s, string t, int maxCost) {\n    int l = 0, cost = 0, best = 0;\n    for (int r = 0; r < (int) s.size(); r++) {\n        cost += abs(s[r] - t[r]);\n        while (cost > maxCost) {\n            cost -= abs(s[l] - t[l]);\n            l++;\n        }\n        best = max(best, r - l + 1);\n    }\n    return best;\n}`,
        c: `int equalSubstring(char* s, char* t, int maxCost) {\n    int n = (int) strlen(s);\n    int l = 0, cost = 0, best = 0;\n    for (int r = 0; r < n; r++) {\n        int d = s[r] - t[r];\n        cost += d < 0 ? -d : d;\n        while (cost > maxCost) {\n            int e = s[l] - t[l];\n            cost -= e < 0 ? -e : e;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        csharp: `public static int EqualSubstring(string s, string t, int maxCost)\n{\n    int l = 0, cost = 0, best = 0;\n    for (int r = 0; r < s.Length; r++)\n    {\n        cost += Math.Abs(s[r] - t[r]);\n        while (cost > maxCost)\n        {\n            cost -= Math.Abs(s[l] - t[l]);\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        go: `func equalSubstring(s string, t string, maxCost int) int {\n\tabsOf := func(x int) int {\n\t\tif x < 0 {\n\t\t\treturn -x\n\t\t}\n\t\treturn x\n\t}\n\tl, cost, best := 0, 0, 0\n\tfor r := 0; r < len(s); r++ {\n\t\tcost += absOf(int(s[r]) - int(t[r]))\n\t\tfor cost > maxCost {\n\t\t\tcost -= absOf(int(s[l]) - int(t[l]))\n\t\t\tl++\n\t\t}\n\t\tif r-l+1 > best {\n\t\t\tbest = r - l + 1\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun equalSubstring(s: String, t: String, maxCost: Int): Int {\n    var l = 0\n    var cost = 0\n    var best = 0\n    for (r in s.indices) {\n        cost += Math.abs(s[r].toInt() - t[r].toInt())\n        while (cost > maxCost) {\n            cost -= Math.abs(s[l].toInt() - t[l].toInt())\n            l++\n        }\n        if (r - l + 1 > best) best = r - l + 1\n    }\n    return best\n}`,
        swift: `func equalSubstring(_ s: String, _ t: String, _ maxCost: Int) -> Int {\n    let a = Array(s.unicodeScalars).map { Int($0.value) }\n    let b = Array(t.unicodeScalars).map { Int($0.value) }\n    var l = 0\n    var cost = 0\n    var best = 0\n    for r in 0..<a.count {\n        cost += abs(a[r] - b[r])\n        while cost > maxCost {\n            cost -= abs(a[l] - b[l])\n            l += 1\n        }\n        if r - l + 1 > best { best = r - l + 1 }\n    }\n    return best\n}`,
        rust: `fn equalSubstring(s: String, t: String, maxCost: i32) -> i32 {\n    let a = s.as_bytes();\n    let b = t.as_bytes();\n    let mut l = 0usize;\n    let mut cost = 0i32;\n    let mut best = 0i32;\n    for r in 0..a.len() {\n        cost += (a[r] as i32 - b[r] as i32).abs();\n        while cost > maxCost {\n            cost -= (a[l] as i32 - b[l] as i32).abs();\n            l += 1;\n        }\n        let len = (r + 1 - l) as i32;\n        if len > best {\n            best = len;\n        }\n    }\n    best\n}`,
        php: `function equalSubstring($s, $t, $maxCost) {\n    $l = 0;\n    $cost = 0;\n    $best = 0;\n    $n = strlen($s);\n    for ($r = 0; $r < $n; $r++) {\n        $cost += abs(ord($s[$r]) - ord($t[$r]));\n        while ($cost > $maxCost) {\n            $cost -= abs(ord($s[$l]) - ord($t[$l]));\n            $l++;\n        }\n        if ($r - $l + 1 > $best) $best = $r - $l + 1;\n    }\n    return $best;\n}`,
        ruby: `def equalSubstring(s, t, maxCost)\n  l = 0\n  cost = 0\n  best = 0\n  (0...s.length).each do |r|\n    cost += (s[r].ord - t[r].ord).abs\n    while cost > maxCost\n      cost -= (s[l].ord - t[l].ord).abs\n      l += 1\n    end\n    best = r - l + 1 if r - l + 1 > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Replace the Substring for Balanced String (LC 1234) ─────────
  (() => {
    const ref = (s: string) => {
      const n = s.length;
      const need = n / 4;
      const cnt: Record<string, number> = { Q: 0, W: 0, E: 0, R: 0 };
      for (let i = 0; i < n; i++) cnt[s[i]]++;
      const ok = () => cnt["Q"] <= need && cnt["W"] <= need && cnt["E"] <= need && cnt["R"] <= need;
      if (ok()) return 0;
      let best = n, l = 0;
      for (let r = 0; r < n; r++) {
        cnt[s[r]]--;
        while (l <= r && ok()) {
          if (r - l + 1 < best) best = r - l + 1;
          cnt[s[l]]++;
          l++;
        }
      }
      return best;
    };
    return {
      slug: "replace-the-substring-for-balanced-string",
      title: "Replace the Substring for Balanced String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window", "Two Pointers", "Amazon", "Google", "Myntra"],
      signature: { funcName: "balancedString", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "`s` has length `n` (a multiple of 4) and contains only `'Q'`, `'W'`, `'E'` and `'R'`. It is **balanced** when each of the four characters occurs exactly `n / 4` times.\n\nYou may replace one contiguous substring with any string of the same length. Return the minimum length of substring that must be replaced to make `s` balanced.",
        [
          { in: 's = "QWER"', out: "0", note: "Already balanced." },
          { in: 's = "QQWE"', out: "1", note: 'Replacing one Q with an R gives "RQWE".' },
          { in: 's = "QQQW"', out: "2", note: 'Replace "QQ" with "ER".' },
        ],
        ["n == s.length", "4 <= n <= 100000", "n is a multiple of 4.", "s contains only 'Q', 'W', 'E' and 'R'."]),
      hints: [
        "Whatever the replaced substring becomes, you get to choose it freely — so only the characters *outside* it matter.",
        "A window is replaceable exactly when every character outside it occurs at most `n / 4` times.",
        "Find the shortest such window.",
      ],
      editorial: explain({
        idea: "Invert the question: instead of asking what the replacement should be, ask when a window *can* be fixed. Since the replacement is arbitrary, a window works precisely when no character outside it already exceeds its quota — and that predicate improves as the window grows, so a shrinking sliding window finds the shortest one.",
        steps: [
          "Tally the whole string. If every count is already at most `n / 4`, return 0.",
          "Extend the right edge, removing `s[r]` from the outside tally.",
          "While the outside tally is within quota, record the window length and pull the left edge in, putting `s[l]` back.",
          "Return the shortest window recorded.",
        ],
        why: "The characters inside the window can be rewritten to exactly fill the remaining quota — the counts always add up because `n` is a multiple of 4 — so feasibility depends only on the outside. Growing the window removes characters from the outside, which never breaks feasibility, so the predicate is monotone and the two-pointer scan is valid.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Checking the counts *inside* the window instead of outside inverts the condition.",
          "The already-balanced case must return 0 before the loop, or the shrink never records anything.",
          "The window can be the whole string, so seed the best at `n`.",
        ],
      }),
      examples: [
        { input: '"QWER"', expectedOutput: "0" },
        { input: '"QQWE"', expectedOutput: "1" },
        { input: '"QQQW"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = 4 * ri(rng, 1, 10);
        const s = Array.from({ length: n }, () => pick(rng, ["Q", "W", "E", "R"])).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def balancedString(s: str) -> int:\n    n = len(s)\n    need = n // 4\n    cnt = {"Q": 0, "W": 0, "E": 0, "R": 0}\n    for ch in s:\n        cnt[ch] += 1\n\n    def ok() -> bool:\n        return all(v <= need for v in cnt.values())\n\n    if ok():\n        return 0\n    best = n\n    l = 0\n    for r in range(n):\n        cnt[s[r]] -= 1\n        while l <= r and ok():\n            best = min(best, r - l + 1)\n            cnt[s[l]] += 1\n            l += 1\n    return best`,
        javascript: `var balancedString = function(s) {\n    var n = s.length;\n    var need = n / 4;\n    var cnt = { Q: 0, W: 0, E: 0, R: 0 };\n    for (var i = 0; i < n; i++) cnt[s.charAt(i)]++;\n    var ok = function() {\n        return cnt.Q <= need && cnt.W <= need && cnt.E <= need && cnt.R <= need;\n    };\n    if (ok()) return 0;\n    var best = n, l = 0;\n    for (var r = 0; r < n; r++) {\n        cnt[s.charAt(r)]--;\n        while (l <= r && ok()) {\n            if (r - l + 1 < best) best = r - l + 1;\n            cnt[s.charAt(l)]++;\n            l++;\n        }\n    }\n    return best;\n};`,
        typescript: `function balancedString(s: string): number {\n    var n = s.length;\n    var need = n / 4;\n    var cnt: { [key: string]: number } = { Q: 0, W: 0, E: 0, R: 0 };\n    for (var i = 0; i < n; i++) cnt[s.charAt(i)]++;\n    var ok = function(): boolean {\n        return cnt["Q"] <= need && cnt["W"] <= need && cnt["E"] <= need && cnt["R"] <= need;\n    };\n    if (ok()) return 0;\n    var best = n, l = 0;\n    for (var r = 0; r < n; r++) {\n        cnt[s.charAt(r)]--;\n        while (l <= r && ok()) {\n            if (r - l + 1 < best) best = r - l + 1;\n            cnt[s.charAt(l)]++;\n            l++;\n        }\n    }\n    return best;\n}`,
        java: `public static int balancedString(String s) {\n    int n = s.length(), need = n / 4;\n    int[] cnt = new int[128];\n    for (int i = 0; i < n; i++) cnt[s.charAt(i)]++;\n    if (cnt['Q'] <= need && cnt['W'] <= need && cnt['E'] <= need && cnt['R'] <= need) return 0;\n    int best = n, l = 0;\n    for (int r = 0; r < n; r++) {\n        cnt[s.charAt(r)]--;\n        while (l <= r && cnt['Q'] <= need && cnt['W'] <= need && cnt['E'] <= need && cnt['R'] <= need) {\n            best = Math.min(best, r - l + 1);\n            cnt[s.charAt(l)]++;\n            l++;\n        }\n    }\n    return best;\n}`,
        cpp: `int balancedString(string s) {\n    int n = (int) s.size(), need = n / 4;\n    vector<int> cnt(128, 0);\n    for (int i = 0; i < n; i++) cnt[(int) s[i]]++;\n    if (cnt['Q'] <= need && cnt['W'] <= need && cnt['E'] <= need && cnt['R'] <= need) return 0;\n    int best = n, l = 0;\n    for (int r = 0; r < n; r++) {\n        cnt[(int) s[r]]--;\n        while (l <= r && cnt['Q'] <= need && cnt['W'] <= need && cnt['E'] <= need && cnt['R'] <= need) {\n            best = min(best, r - l + 1);\n            cnt[(int) s[l]]++;\n            l++;\n        }\n    }\n    return best;\n}`,
        c: `int balancedString(char* s) {\n    int n = (int) strlen(s), need = n / 4;\n    int cnt[128];\n    for (int i = 0; i < 128; i++) cnt[i] = 0;\n    for (int i = 0; i < n; i++) cnt[(int) s[i]]++;\n    if (cnt['Q'] <= need && cnt['W'] <= need && cnt['E'] <= need && cnt['R'] <= need) return 0;\n    int best = n, l = 0;\n    for (int r = 0; r < n; r++) {\n        cnt[(int) s[r]]--;\n        while (l <= r && cnt['Q'] <= need && cnt['W'] <= need && cnt['E'] <= need && cnt['R'] <= need) {\n            if (r - l + 1 < best) best = r - l + 1;\n            cnt[(int) s[l]]++;\n            l++;\n        }\n    }\n    return best;\n}`,
        csharp: `public static int BalancedString(string s)\n{\n    int n = s.Length, need = n / 4;\n    int[] cnt = new int[128];\n    for (int i = 0; i < n; i++) cnt[s[i]]++;\n    if (cnt['Q'] <= need && cnt['W'] <= need && cnt['E'] <= need && cnt['R'] <= need) return 0;\n    int best = n, l = 0;\n    for (int r = 0; r < n; r++)\n    {\n        cnt[s[r]]--;\n        while (l <= r && cnt['Q'] <= need && cnt['W'] <= need && cnt['E'] <= need && cnt['R'] <= need)\n        {\n            if (r - l + 1 < best) best = r - l + 1;\n            cnt[s[l]]++;\n            l++;\n        }\n    }\n    return best;\n}`,
        go: `func balancedString(s string) int {\n\tn := len(s)\n\tneed := n / 4\n\tcnt := make([]int, 128)\n\tfor i := 0; i < n; i++ {\n\t\tcnt[s[i]]++\n\t}\n\tok := func() bool {\n\t\treturn cnt['Q'] <= need && cnt['W'] <= need && cnt['E'] <= need && cnt['R'] <= need\n\t}\n\tif ok() {\n\t\treturn 0\n\t}\n\tbest, l := n, 0\n\tfor r := 0; r < n; r++ {\n\t\tcnt[s[r]]--\n\t\tfor l <= r && ok() {\n\t\t\tif r-l+1 < best {\n\t\t\t\tbest = r - l + 1\n\t\t\t}\n\t\t\tcnt[s[l]]++\n\t\t\tl++\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun balancedString(s: String): Int {\n    val n = s.length\n    val need = n / 4\n    val cnt = IntArray(128)\n    for (i in 0 until n) cnt[s[i].toInt()]++\n    fun ok(): Boolean =\n        cnt['Q'.toInt()] <= need && cnt['W'.toInt()] <= need && cnt['E'.toInt()] <= need && cnt['R'.toInt()] <= need\n    if (ok()) return 0\n    var best = n\n    var l = 0\n    for (r in 0 until n) {\n        cnt[s[r].toInt()]--\n        while (l <= r && ok()) {\n            if (r - l + 1 < best) best = r - l + 1\n            cnt[s[l].toInt()]++\n            l++\n        }\n    }\n    return best\n}`,
        swift: `func balancedString(_ s: String) -> Int {\n    let a = Array(s.unicodeScalars).map { Int($0.value) }\n    let n = a.count\n    let need = n / 4\n    var cnt = [Int](repeating: 0, count: 128)\n    for x in a { cnt[x] += 1 }\n    let q = 81, w = 87, e = 69, r0 = 82\n    func ok() -> Bool {\n        return cnt[q] <= need && cnt[w] <= need && cnt[e] <= need && cnt[r0] <= need\n    }\n    if ok() { return 0 }\n    var best = n\n    var l = 0\n    for r in 0..<n {\n        cnt[a[r]] -= 1\n        while l <= r && ok() {\n            if r - l + 1 < best { best = r - l + 1 }\n            cnt[a[l]] += 1\n            l += 1\n        }\n    }\n    return best\n}`,
        rust: `fn balancedString(s: String) -> i32 {\n    let b = s.as_bytes();\n    let n = b.len();\n    let need = (n / 4) as i32;\n    let mut cnt = [0i32; 128];\n    for i in 0..n {\n        cnt[b[i] as usize] += 1;\n    }\n    let is_ok = |c: &[i32; 128]| -> bool {\n        c[b'Q' as usize] <= need\n            && c[b'W' as usize] <= need\n            && c[b'E' as usize] <= need\n            && c[b'R' as usize] <= need\n    };\n    if is_ok(&cnt) {\n        return 0;\n    }\n    let mut best = n as i32;\n    let mut l = 0usize;\n    for r in 0..n {\n        cnt[b[r] as usize] -= 1;\n        while l <= r && is_ok(&cnt) {\n            let len = (r + 1 - l) as i32;\n            if len < best {\n                best = len;\n            }\n            cnt[b[l] as usize] += 1;\n            l += 1;\n        }\n    }\n    best\n}`,
        php: `function balancedString($s) {\n    $n = strlen($s);\n    $need = intdiv($n, 4);\n    $cnt = array_fill(0, 128, 0);\n    for ($i = 0; $i < $n; $i++) $cnt[ord($s[$i])]++;\n    $ok = function() use (&$cnt, $need) {\n        return $cnt[81] <= $need && $cnt[87] <= $need && $cnt[69] <= $need && $cnt[82] <= $need;\n    };\n    if ($ok()) return 0;\n    $best = $n;\n    $l = 0;\n    for ($r = 0; $r < $n; $r++) {\n        $cnt[ord($s[$r])]--;\n        while ($l <= $r && $ok()) {\n            if ($r - $l + 1 < $best) $best = $r - $l + 1;\n            $cnt[ord($s[$l])]++;\n            $l++;\n        }\n    }\n    return $best;\n}`,
        ruby: `def balancedString(s)\n  n = s.length\n  need = n / 4\n  cnt = { "Q" => 0, "W" => 0, "E" => 0, "R" => 0 }\n  s.each_char { |ch| cnt[ch] += 1 }\n  ok = lambda { cnt.values.all? { |v| v <= need } }\n  return 0 if ok.call\n  best = n\n  l = 0\n  (0...n).each do |r|\n    cnt[s[r]] -= 1\n    while l <= r && ok.call\n      best = r - l + 1 if r - l + 1 < best\n      cnt[s[l]] += 1\n      l += 1\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Swap For Longest Repeated Character Substring (LC 1156) ─────
  (() => {
    const ref = (text: string) => {
      const n = text.length;
      const total: Record<string, number> = {};
      for (let i = 0; i < n; i++) total[text[i]] = (total[text[i]] || 0) + 1;
      const runs: Array<[string, number]> = [];
      let i = 0;
      while (i < n) {
        let j = i;
        while (j < n && text[j] === text[i]) j++;
        runs.push([text[i], j - i]);
        i = j;
      }
      let best = 0;
      for (let r = 0; r < runs.length; r++) {
        const c = runs[r][0], len = runs[r][1];
        best = Math.max(best, Math.min(len + 1, total[c]));
        if (r + 2 < runs.length && runs[r + 1][1] === 1 && runs[r + 2][0] === c) {
          best = Math.max(best, Math.min(len + runs[r + 2][1] + 1, total[c]));
        }
      }
      return best;
    };
    return {
      slug: "swap-for-longest-repeated-character-substring",
      title: "Swap For Longest Repeated Character Substring",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window", "Hash Table", "Binary Search", "Amazon", "Google", "Intuit"],
      signature: { funcName: "maxRepOpt1", params: [{ name: "text", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You may swap **two characters** of `text` at most once (any two positions, not necessarily adjacent).\n\nReturn the length of the longest substring of a single repeated character you can obtain.",
        [
          { in: 'text = "ababa"', out: "3", note: 'Swapping the first b with the last a gives "aaaba".' },
          { in: 'text = "aaabaaa"', out: "6", note: "Swapping the b with an a outside joins the two runs." },
          { in: 'text = "aaaaa"', out: "5", note: "Nothing to gain — the swap can be a no-op." },
        ],
        ["1 <= text.length <= 20000", "text consists of lowercase English letters."]),
      hints: [
        "Break the string into maximal runs of equal characters.",
        "One swap can extend a single run by one — but only if that character occurs somewhere outside it.",
        "Two runs of the same character separated by exactly one other character can be joined, again capped by the total occurrences.",
      ],
      editorial: explain({
        idea: "The answer always comes from one of two shapes: a single run extended by one borrowed character, or two same-character runs bridged across a single gap. Both are capped by how many of that character exist in total, since a swap moves a character rather than creating one.",
        steps: [
          "Tally the total occurrences of each character.",
          "Split the text into runs `(char, length)`.",
          "For each run, consider `min(length + 1, total[char])`.",
          "When the next run is a single character and the one after repeats the same letter, also consider `min(len1 + len2 + 1, total[char])`.",
        ],
        why: "A swap brings in at most one extra copy of the target character, so no answer can exceed `total[char]`, and the `+ 1` is only realisable when a spare copy exists outside the run — which the `min` enforces. Any optimal final run occupies contiguous positions, so it either sits inside one original run plus one borrowed slot, or spans exactly one foreign character between two runs; a gap of two or more cannot be closed by a single swap.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Forgetting the `min` with the total count over-counts when every copy of the character is already inside the run.",
          "Bridging across a gap wider than one character is not achievable with one swap.",
          "The bridge case must check the run *after* the gap has the same character.",
        ],
      }),
      examples: [
        { input: '"ababa"', expectedOutput: "3" },
        { input: '"aaabaaa"', expectedOutput: "6" },
        { input: '"aaaaa"', expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const alpha = rng() < 0.6 ? ["a", "b"] : ["a", "b", "c", "d"];
        const text = Array.from({ length: ri(rng, 1, 40) }, () => pick(rng, alpha)).join("");
        return { input: `"${text}"`, expectedOutput: String(ref(text)) };
      },
      solutions: {
        python: `def maxRepOpt1(text: str) -> int:\n    total = {}\n    for ch in text:\n        total[ch] = total.get(ch, 0) + 1\n    runs = []\n    i = 0\n    n = len(text)\n    while i < n:\n        j = i\n        while j < n and text[j] == text[i]:\n            j += 1\n        runs.append((text[i], j - i))\n        i = j\n    best = 0\n    for r in range(len(runs)):\n        c, length = runs[r]\n        best = max(best, min(length + 1, total[c]))\n        if r + 2 < len(runs) and runs[r + 1][1] == 1 and runs[r + 2][0] == c:\n            best = max(best, min(length + runs[r + 2][1] + 1, total[c]))\n    return best`,
        javascript: `var maxRepOpt1 = function(text) {\n    var n = text.length;\n    var total = {};\n    for (var i = 0; i < n; i++) {\n        var ch = text.charAt(i);\n        total[ch] = (total[ch] || 0) + 1;\n    }\n    var runs = [];\n    var p = 0;\n    while (p < n) {\n        var q = p;\n        while (q < n && text.charAt(q) === text.charAt(p)) q++;\n        runs.push([text.charAt(p), q - p]);\n        p = q;\n    }\n    var best = 0;\n    for (var r = 0; r < runs.length; r++) {\n        var c = runs[r][0], len = runs[r][1];\n        best = Math.max(best, Math.min(len + 1, total[c]));\n        if (r + 2 < runs.length && runs[r + 1][1] === 1 && runs[r + 2][0] === c) {\n            best = Math.max(best, Math.min(len + runs[r + 2][1] + 1, total[c]));\n        }\n    }\n    return best;\n};`,
        typescript: `function maxRepOpt1(text: string): number {\n    var n = text.length;\n    var total: { [key: string]: number } = {};\n    for (var i = 0; i < n; i++) {\n        var ch = text.charAt(i);\n        total[ch] = (total[ch] || 0) + 1;\n    }\n    var runs: Array<[string, number]> = [];\n    var p = 0;\n    while (p < n) {\n        var q = p;\n        while (q < n && text.charAt(q) === text.charAt(p)) q++;\n        runs.push([text.charAt(p), q - p]);\n        p = q;\n    }\n    var best = 0;\n    for (var r = 0; r < runs.length; r++) {\n        var c = runs[r][0], len = runs[r][1];\n        best = Math.max(best, Math.min(len + 1, total[c]));\n        if (r + 2 < runs.length && runs[r + 1][1] === 1 && runs[r + 2][0] === c) {\n            best = Math.max(best, Math.min(len + runs[r + 2][1] + 1, total[c]));\n        }\n    }\n    return best;\n}`,
        java: `public static int maxRepOpt1(String text) {\n    int n = text.length();\n    int[] total = new int[26];\n    for (int i = 0; i < n; i++) total[text.charAt(i) - 'a']++;\n    List<int[]> runs = new ArrayList<>();\n    int p = 0;\n    while (p < n) {\n        int q = p;\n        while (q < n && text.charAt(q) == text.charAt(p)) q++;\n        runs.add(new int[] { text.charAt(p) - 'a', q - p });\n        p = q;\n    }\n    int best = 0;\n    for (int r = 0; r < runs.size(); r++) {\n        int c = runs.get(r)[0], len = runs.get(r)[1];\n        best = Math.max(best, Math.min(len + 1, total[c]));\n        if (r + 2 < runs.size() && runs.get(r + 1)[1] == 1 && runs.get(r + 2)[0] == c) {\n            best = Math.max(best, Math.min(len + runs.get(r + 2)[1] + 1, total[c]));\n        }\n    }\n    return best;\n}`,
        cpp: `int maxRepOpt1(string text) {\n    int n = (int) text.size();\n    vector<int> total(26, 0);\n    for (int i = 0; i < n; i++) total[text[i] - 'a']++;\n    vector<pair<int, int>> runs;\n    int p = 0;\n    while (p < n) {\n        int q = p;\n        while (q < n && text[q] == text[p]) q++;\n        runs.push_back(make_pair(text[p] - 'a', q - p));\n        p = q;\n    }\n    int best = 0;\n    for (int r = 0; r < (int) runs.size(); r++) {\n        int c = runs[r].first, len = runs[r].second;\n        best = max(best, min(len + 1, total[c]));\n        if (r + 2 < (int) runs.size() && runs[r + 1].second == 1 && runs[r + 2].first == c) {\n            best = max(best, min(len + runs[r + 2].second + 1, total[c]));\n        }\n    }\n    return best;\n}`,
        c: `int maxRepOpt1(char* text) {\n    int n = (int) strlen(text);\n    int total[26];\n    for (int i = 0; i < 26; i++) total[i] = 0;\n    for (int i = 0; i < n; i++) total[text[i] - 'a']++;\n    int* runChar = (int*) malloc((size_t) n * sizeof(int));\n    int* runLen = (int*) malloc((size_t) n * sizeof(int));\n    int m = 0, p = 0;\n    while (p < n) {\n        int q = p;\n        while (q < n && text[q] == text[p]) q++;\n        runChar[m] = text[p] - 'a';\n        runLen[m] = q - p;\n        m++;\n        p = q;\n    }\n    int best = 0;\n    for (int r = 0; r < m; r++) {\n        int c = runChar[r], len = runLen[r];\n        int cand = len + 1 < total[c] ? len + 1 : total[c];\n        if (cand > best) best = cand;\n        if (r + 2 < m && runLen[r + 1] == 1 && runChar[r + 2] == c) {\n            int joined = len + runLen[r + 2] + 1;\n            if (joined > total[c]) joined = total[c];\n            if (joined > best) best = joined;\n        }\n    }\n    free(runChar);\n    free(runLen);\n    return best;\n}`,
        csharp: `public static int MaxRepOpt1(string text)\n{\n    int n = text.Length;\n    int[] total = new int[26];\n    for (int i = 0; i < n; i++) total[text[i] - 'a']++;\n    var runs = new List<int[]>();\n    int p = 0;\n    while (p < n)\n    {\n        int q = p;\n        while (q < n && text[q] == text[p]) q++;\n        runs.Add(new int[] { text[p] - 'a', q - p });\n        p = q;\n    }\n    int best = 0;\n    for (int r = 0; r < runs.Count; r++)\n    {\n        int c = runs[r][0], len = runs[r][1];\n        best = Math.Max(best, Math.Min(len + 1, total[c]));\n        if (r + 2 < runs.Count && runs[r + 1][1] == 1 && runs[r + 2][0] == c)\n        {\n            best = Math.Max(best, Math.Min(len + runs[r + 2][1] + 1, total[c]));\n        }\n    }\n    return best;\n}`,
        go: `func maxRepOpt1(text string) int {\n\tn := len(text)\n\ttotal := make([]int, 26)\n\tfor i := 0; i < n; i++ {\n\t\ttotal[text[i]-'a']++\n\t}\n\ttype run struct{ c, length int }\n\truns := []run{}\n\tp := 0\n\tfor p < n {\n\t\tq := p\n\t\tfor q < n && text[q] == text[p] {\n\t\t\tq++\n\t\t}\n\t\truns = append(runs, run{int(text[p] - 'a'), q - p})\n\t\tp = q\n\t}\n\tbest := 0\n\tfor r := 0; r < len(runs); r++ {\n\t\tc, length := runs[r].c, runs[r].length\n\t\tcand := length + 1\n\t\tif total[c] < cand {\n\t\t\tcand = total[c]\n\t\t}\n\t\tif cand > best {\n\t\t\tbest = cand\n\t\t}\n\t\tif r+2 < len(runs) && runs[r+1].length == 1 && runs[r+2].c == c {\n\t\t\tjoined := length + runs[r+2].length + 1\n\t\t\tif total[c] < joined {\n\t\t\t\tjoined = total[c]\n\t\t\t}\n\t\t\tif joined > best {\n\t\t\t\tbest = joined\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxRepOpt1(text: String): Int {\n    val n = text.length\n    val total = IntArray(26)\n    for (i in 0 until n) total[text[i] - 'a']++\n    val runs = ArrayList<IntArray>()\n    var p = 0\n    while (p < n) {\n        var q = p\n        while (q < n && text[q] == text[p]) q++\n        runs.add(intArrayOf(text[p] - 'a', q - p))\n        p = q\n    }\n    var best = 0\n    for (r in runs.indices) {\n        val c = runs[r][0]\n        val len = runs[r][1]\n        best = maxOf(best, minOf(len + 1, total[c]))\n        if (r + 2 < runs.size && runs[r + 1][1] == 1 && runs[r + 2][0] == c) {\n            best = maxOf(best, minOf(len + runs[r + 2][1] + 1, total[c]))\n        }\n    }\n    return best\n}`,
        swift: `func maxRepOpt1(_ text: String) -> Int {\n    let a = Array(text)\n    let n = a.count\n    var total = [Character: Int]()\n    for ch in a { total[ch, default: 0] += 1 }\n    var runs = [(Character, Int)]()\n    var p = 0\n    while p < n {\n        var q = p\n        while q < n && a[q] == a[p] { q += 1 }\n        runs.append((a[p], q - p))\n        p = q\n    }\n    var best = 0\n    for r in 0..<runs.count {\n        let c = runs[r].0\n        let len = runs[r].1\n        let cap = total[c] ?? 0\n        best = max(best, min(len + 1, cap))\n        if r + 2 < runs.count && runs[r + 1].1 == 1 && runs[r + 2].0 == c {\n            best = max(best, min(len + runs[r + 2].1 + 1, cap))\n        }\n    }\n    return best\n}`,
        rust: `fn maxRepOpt1(text: String) -> i32 {\n    let b = text.as_bytes();\n    let n = b.len();\n    let mut total = [0i32; 26];\n    for i in 0..n {\n        total[(b[i] - b'a') as usize] += 1;\n    }\n    let mut runs: Vec<(usize, i32)> = Vec::new();\n    let mut p = 0usize;\n    while p < n {\n        let mut q = p;\n        while q < n && b[q] == b[p] {\n            q += 1;\n        }\n        runs.push(((b[p] - b'a') as usize, (q - p) as i32));\n        p = q;\n    }\n    let mut best = 0i32;\n    for r in 0..runs.len() {\n        let (c, len) = runs[r];\n        best = best.max((len + 1).min(total[c]));\n        if r + 2 < runs.len() && runs[r + 1].1 == 1 && runs[r + 2].0 == c {\n            best = best.max((len + runs[r + 2].1 + 1).min(total[c]));\n        }\n    }\n    best\n}`,
        php: `function maxRepOpt1($text) {\n    $n = strlen($text);\n    $total = array_fill(0, 26, 0);\n    for ($i = 0; $i < $n; $i++) $total[ord($text[$i]) - 97]++;\n    $runs = [];\n    $p = 0;\n    while ($p < $n) {\n        $q = $p;\n        while ($q < $n && $text[$q] === $text[$p]) $q++;\n        $runs[] = [ord($text[$p]) - 97, $q - $p];\n        $p = $q;\n    }\n    $best = 0;\n    for ($r = 0; $r < count($runs); $r++) {\n        $c = $runs[$r][0];\n        $len = $runs[$r][1];\n        $best = max($best, min($len + 1, $total[$c]));\n        if ($r + 2 < count($runs) && $runs[$r + 1][1] === 1 && $runs[$r + 2][0] === $c) {\n            $best = max($best, min($len + $runs[$r + 2][1] + 1, $total[$c]));\n        }\n    }\n    return $best;\n}`,
        ruby: `def maxRepOpt1(text)\n  n = text.length\n  total = Hash.new(0)\n  text.each_char { |ch| total[ch] += 1 }\n  runs = []\n  p = 0\n  while p < n\n    q = p\n    q += 1 while q < n && text[q] == text[p]\n    runs << [text[p], q - p]\n    p = q\n  end\n  best = 0\n  runs.each_with_index do |(c, len), r|\n    best = [best, [len + 1, total[c]].min].max\n    if r + 2 < runs.length && runs[r + 1][1] == 1 && runs[r + 2][0] == c\n      best = [best, [len + runs[r + 2][1] + 1, total[c]].min].max\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Count the Number of Good Subarrays (LC 2537) ────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const cnt: Record<number, number> = {};
      let l = 0, pairs = 0, res = 0;
      for (let r = 0; r < nums.length; r++) {
        const v = nums[r];
        pairs += cnt[v] || 0;
        cnt[v] = (cnt[v] || 0) + 1;
        while (pairs >= k) {
          cnt[nums[l]]--;
          pairs -= cnt[nums[l]];
          l++;
        }
        res += l;
      }
      return res;
    };
    return {
      slug: "count-the-number-of-good-subarrays",
      title: "Count the Number of Good Subarrays",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sliding Window", "Counting", "Amazon", "Google", "PhonePe"],
      signature: { funcName: "countGood", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A subarray is **good** when it contains at least `k` pairs of indices `(i, j)` with `i < j` and `arr[i] == arr[j]`.\n\nReturn the number of good subarrays of `nums`.",
        [
          { in: "nums = [1,1,1,1,1], k = 10", out: "1", note: "Only the whole array reaches ten equal pairs." },
          { in: "nums = [3,1,4,3,2,2,4], k = 2", out: "4", note: "The subarrays [3,1,4,3,2,2], [3,1,4,3,2,2,4], [1,4,3,2,2,4] and [4,3,2,2,4]." },
          { in: "nums = [7,7], k = 1", out: "1" },
        ],
        ["1 <= nums.length <= 50000", "1 <= nums[i] <= 1000000000", "1 <= k <= 1000000000"]),
      hints: [
        "Widening a subarray never removes a pair, so 'good' is monotone in the window's left edge.",
        "When a value joins the window, it forms one new pair with each existing copy — so add its current count.",
        "Once `[l, r]` is good, every start before `l` is good too; count `l` of them for this right end.",
      ],
      editorial: explain({
        idea: "Maintain the pair count of the window incrementally, and shrink from the left as soon as the window is good. The number of good subarrays ending at `r` is then exactly the number of starts strictly left of the current `l`.",
        steps: [
          "For each `r`, add `cnt[nums[r]]` to the pair total *before* incrementing the tally — the new element pairs with each existing copy.",
          "While the pair total reaches `k`, decrement the leftmost element's tally, subtract the new tally from the pair total, and advance `l`.",
          "Add `l` to the answer: every start in `0 … l-1` gives a good subarray ending at `r`.",
        ],
        why: "Removing an element destroys one pair per remaining copy, which is exactly the tally after decrementing — so the running count stays exact. Because adding elements never lowers the pair count, the minimal good window for each `r` has a well-defined left boundary and `l` never moves backwards.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Incrementing the tally before adding to the pair count counts the element paired with itself.",
          "Subtracting the tally *before* decrementing it in the shrink step is off by one.",
          "The answer reaches about `1.25 · 10^9` at the upper limit — an `int`, but only just.",
        ],
      }),
      examples: [
        { input: "[1,1,1,1,1]\n10", expectedOutput: "1" },
        { input: "[3,1,4,3,2,2,4]\n2", expectedOutput: "4" },
        { input: "[7,7]\n1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 45);
        const span = rng() < 0.6 ? ri(rng, 1, 5) : ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => ri(rng, 1, span));
        const k = rng() < 0.7 ? ri(rng, 1, 30) : ri(rng, 1, 1000000000);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countGood(nums: List[int], k: int) -> int:\n    cnt = {}\n    l = 0\n    pairs = 0\n    res = 0\n    for r, v in enumerate(nums):\n        pairs += cnt.get(v, 0)\n        cnt[v] = cnt.get(v, 0) + 1\n        while pairs >= k:\n            cnt[nums[l]] -= 1\n            pairs -= cnt[nums[l]]\n            l += 1\n        res += l\n    return res`,
        javascript: `var countGood = function(nums, k) {\n    var cnt = {};\n    var l = 0, pairs = 0, res = 0;\n    for (var r = 0; r < nums.length; r++) {\n        var v = nums[r];\n        pairs += cnt[v] || 0;\n        cnt[v] = (cnt[v] || 0) + 1;\n        while (pairs >= k) {\n            cnt[nums[l]]--;\n            pairs -= cnt[nums[l]];\n            l++;\n        }\n        res += l;\n    }\n    return res;\n};`,
        typescript: `function countGood(nums: number[], k: number): number {\n    var cnt: { [key: number]: number } = {};\n    var l = 0, pairs = 0, res = 0;\n    for (var r = 0; r < nums.length; r++) {\n        var v = nums[r];\n        pairs += cnt[v] || 0;\n        cnt[v] = (cnt[v] || 0) + 1;\n        while (pairs >= k) {\n            cnt[nums[l]]--;\n            pairs -= cnt[nums[l]];\n            l++;\n        }\n        res += l;\n    }\n    return res;\n}`,
        java: `public static int countGood(int[] nums, int k) {\n    Map<Integer, Integer> cnt = new HashMap<>();\n    int l = 0;\n    long pairs = 0, res = 0;\n    for (int r = 0; r < nums.length; r++) {\n        int v = nums[r];\n        int have = cnt.getOrDefault(v, 0);\n        pairs += have;\n        cnt.put(v, have + 1);\n        while (pairs >= k) {\n            int u = nums[l];\n            int left = cnt.get(u) - 1;\n            cnt.put(u, left);\n            pairs -= left;\n            l++;\n        }\n        res += l;\n    }\n    return (int) res;\n}`,
        cpp: `int countGood(vector<int>& nums, int k) {\n    unordered_map<int, int> cnt;\n    int l = 0;\n    long long pairs = 0, res = 0;\n    for (int r = 0; r < (int) nums.size(); r++) {\n        int v = nums[r];\n        pairs += cnt[v];\n        cnt[v]++;\n        while (pairs >= k) {\n            cnt[nums[l]]--;\n            pairs -= cnt[nums[l]];\n            l++;\n        }\n        res += l;\n    }\n    return (int) res;\n}`,
        c: `typedef struct { int key; int val; int used; } GoodSlot;\n\nstatic int goodSlotFor(GoodSlot* tab, int cap, int key) {\n    unsigned int h = ((unsigned int) key) * 2654435761u;\n    int i = (int) (h % (unsigned int) cap);\n    while (tab[i].used && tab[i].key != key) i = (i + 1) % cap;\n    return i;\n}\n\nint countGood(int* nums, int numsSize, int k) {\n    int cap = 1;\n    while (cap < numsSize * 2 + 4) cap <<= 1;\n    GoodSlot* tab = (GoodSlot*) calloc((size_t) cap, sizeof(GoodSlot));\n    int l = 0;\n    long long pairs = 0, res = 0;\n    for (int r = 0; r < numsSize; r++) {\n        int i = goodSlotFor(tab, cap, nums[r]);\n        if (!tab[i].used) { tab[i].used = 1; tab[i].key = nums[r]; tab[i].val = 0; }\n        pairs += tab[i].val;\n        tab[i].val++;\n        while (pairs >= (long long) k) {\n            int j = goodSlotFor(tab, cap, nums[l]);\n            tab[j].val--;\n            pairs -= tab[j].val;\n            l++;\n        }\n        res += l;\n    }\n    free(tab);\n    return (int) res;\n}`,
        csharp: `public static int CountGood(int[] nums, int k)\n{\n    var cnt = new Dictionary<int, int>();\n    int l = 0;\n    long pairs = 0, res = 0;\n    for (int r = 0; r < nums.Length; r++)\n    {\n        int v = nums[r];\n        int have;\n        cnt.TryGetValue(v, out have);\n        pairs += have;\n        cnt[v] = have + 1;\n        while (pairs >= k)\n        {\n            int u = nums[l];\n            int left = cnt[u] - 1;\n            cnt[u] = left;\n            pairs -= left;\n            l++;\n        }\n        res += l;\n    }\n    return (int) res;\n}`,
        go: `func countGood(nums []int, k int) int {\n\tcnt := map[int]int{}\n\tl := 0\n\tvar pairs, res int64 = 0, 0\n\tfor r := 0; r < len(nums); r++ {\n\t\tv := nums[r]\n\t\tpairs += int64(cnt[v])\n\t\tcnt[v]++\n\t\tfor pairs >= int64(k) {\n\t\t\tcnt[nums[l]]--\n\t\t\tpairs -= int64(cnt[nums[l]])\n\t\t\tl++\n\t\t}\n\t\tres += int64(l)\n\t}\n\treturn int(res)\n}`,
        kotlin: `fun countGood(nums: IntArray, k: Int): Int {\n    val cnt = HashMap<Int, Int>()\n    var l = 0\n    var pairs = 0L\n    var res = 0L\n    for (r in nums.indices) {\n        val v = nums[r]\n        val have = cnt.getOrDefault(v, 0)\n        pairs += have\n        cnt[v] = have + 1\n        while (pairs >= k) {\n            val u = nums[l]\n            val left = cnt[u]!! - 1\n            cnt[u] = left\n            pairs -= left\n            l++\n        }\n        res += l\n    }\n    return res.toInt()\n}`,
        swift: `func countGood(_ nums: [Int], _ k: Int) -> Int {\n    var cnt = [Int: Int]()\n    var l = 0\n    var pairs = 0\n    var res = 0\n    for r in 0..<nums.count {\n        let v = nums[r]\n        let have = cnt[v] ?? 0\n        pairs += have\n        cnt[v] = have + 1\n        while pairs >= k {\n            let u = nums[l]\n            let left = (cnt[u] ?? 0) - 1\n            cnt[u] = left\n            pairs -= left\n            l += 1\n        }\n        res += l\n    }\n    return res\n}`,
        rust: `fn countGood(nums: Vec<i32>, k: i32) -> i32 {\n    let mut cnt: std::collections::HashMap<i32, i64> = std::collections::HashMap::new();\n    let mut l = 0usize;\n    let mut pairs: i64 = 0;\n    let mut res: i64 = 0;\n    for r in 0..nums.len() {\n        let v = nums[r];\n        let have = *cnt.get(&v).unwrap_or(&0);\n        pairs += have;\n        cnt.insert(v, have + 1);\n        while pairs >= k as i64 {\n            let u = nums[l];\n            let left = cnt[&u] - 1;\n            cnt.insert(u, left);\n            pairs -= left;\n            l += 1;\n        }\n        res += l as i64;\n    }\n    res as i32\n}`,
        php: `function countGood($nums, $k) {\n    $cnt = [];\n    $l = 0;\n    $pairs = 0;\n    $res = 0;\n    for ($r = 0; $r < count($nums); $r++) {\n        $v = $nums[$r];\n        $have = isset($cnt[$v]) ? $cnt[$v] : 0;\n        $pairs += $have;\n        $cnt[$v] = $have + 1;\n        while ($pairs >= $k) {\n            $u = $nums[$l];\n            $cnt[$u]--;\n            $pairs -= $cnt[$u];\n            $l++;\n        }\n        $res += $l;\n    }\n    return $res;\n}`,
        ruby: `def countGood(nums, k)\n  cnt = Hash.new(0)\n  l = 0\n  pairs = 0\n  res = 0\n  nums.each_with_index do |v, r|\n    pairs += cnt[v]\n    cnt[v] += 1\n    while pairs >= k\n      u = nums[l]\n      cnt[u] -= 1\n      pairs -= cnt[u]\n      l += 1\n    end\n    res += l\n  end\n  res\nend`,
      },
    };
  })(),

  // ── Number of Subarrays with Bounded Maximum (LC 795) ───────────
  (() => {
    const ref = (nums: number[], left: number, right: number) => {
      const countLE = (bound: number) => {
        let res = 0, cur = 0;
        for (let i = 0; i < nums.length; i++) {
          if (nums[i] <= bound) { cur++; res += cur; } else cur = 0;
        }
        return res;
      };
      return countLE(right) - countLE(left - 1);
    };
    return {
      slug: "number-of-subarrays-with-bounded-maximum",
      title: "Number of Subarrays with Bounded Maximum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Two Pointers", "Amazon", "Google", "Directi"],
      signature: { funcName: "numSubarrayBoundedMax", params: [{ name: "nums", type: "int[]" as const }, { name: "left", type: "int" as const }, { name: "right", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Count the contiguous non-empty subarrays whose maximum element lies in the inclusive range `[left, right]`.",
        [
          { in: "nums = [2,1,4,3], left = 2, right = 3", out: "3", note: "[2], [2,1] and [3]." },
          { in: "nums = [2,9,2,5,6], left = 2, right = 8", out: "7" },
          { in: "nums = [1,1,1], left = 2, right = 3", out: "0", note: "No subarray reaches 2." },
        ],
        ["1 <= nums.length <= 100000", "0 <= nums[i] <= 1000000000", "0 <= left <= right <= 1000000000"]),
      hints: [
        "'Maximum at most `b`' is much easier to count than 'maximum in a range'.",
        "A subarray has maximum at most `b` exactly when every element is at most `b` — so it lies inside a maximal run of small elements.",
        "count(max in [left, right]) = count(max ≤ right) − count(max ≤ left − 1).",
      ],
      editorial: explain({
        idea: "Split the range condition into a difference of two prefix conditions. Counting subarrays whose every element is at most `b` is a one-pass scan over maximal runs.",
        steps: [
          "`countLE(b)`: walk the array keeping `cur`, the length of the current run of elements at most `b`; reset it to 0 at any larger element and add `cur` to the total each step.",
          "Return `countLE(right) - countLE(left - 1)`.",
        ],
        why: "A run of length `L` contributes `L(L+1)/2` subarrays, which is what adding `cur` at each position accumulates. Every subarray with maximum at most `right` either has maximum at most `left - 1` or has it in `[left, right]`, and the two cases are disjoint — so the subtraction isolates the wanted count.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`left` can be 0, making `left - 1` negative; `countLE(-1)` must simply return 0, which it does since every element is non-negative.",
          "Trying to slide a window on 'maximum in range' directly fails — that predicate is not monotone.",
          "The count reaches about `5 · 10^9` at the upper size limit, so accumulate in 64-bit; with `n <= 10^5` the answer itself still exceeds `int` only in theory — here it is bounded by the stated limits.",
        ],
      }),
      examples: [
        { input: "[2,1,4,3]\n2\n3", expectedOutput: "3" },
        { input: "[2,9,2,5,6]\n2\n8", expectedOutput: "7" },
        { input: "[1,1,1]\n2\n3", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 12 : 1000000000;
        const nums = Array.from({ length: ri(rng, 1, 45) }, () => ri(rng, 0, hi));
        const a = ri(rng, 0, hi);
        const b = ri(rng, 0, hi);
        const left = Math.min(a, b);
        const right = Math.max(a, b);
        return { input: `${fmtIntArr(nums)}\n${left}\n${right}`, expectedOutput: String(ref(nums, left, right)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numSubarrayBoundedMax(nums: List[int], left: int, right: int) -> int:\n    def count_le(bound: int) -> int:\n        res = 0\n        cur = 0\n        for x in nums:\n            if x <= bound:\n                cur += 1\n                res += cur\n            else:\n                cur = 0\n        return res\n\n    return count_le(right) - count_le(left - 1)`,
        javascript: `var numSubarrayBoundedMax = function(nums, left, right) {\n    var countLE = function(bound) {\n        var res = 0, cur = 0;\n        for (var i = 0; i < nums.length; i++) {\n            if (nums[i] <= bound) { cur++; res += cur; } else cur = 0;\n        }\n        return res;\n    };\n    return countLE(right) - countLE(left - 1);\n};`,
        typescript: `function numSubarrayBoundedMax(nums: number[], left: number, right: number): number {\n    var countLE = function(bound: number): number {\n        var res = 0, cur = 0;\n        for (var i = 0; i < nums.length; i++) {\n            if (nums[i] <= bound) { cur++; res += cur; } else cur = 0;\n        }\n        return res;\n    };\n    return countLE(right) - countLE(left - 1);\n}`,
        java: `private static long countBoundedLE(int[] nums, long bound) {\n    long res = 0, cur = 0;\n    for (int x : nums) {\n        if (x <= bound) {\n            cur++;\n            res += cur;\n        } else {\n            cur = 0;\n        }\n    }\n    return res;\n}\n\npublic static int numSubarrayBoundedMax(int[] nums, int left, int right) {\n    return (int) (countBoundedLE(nums, right) - countBoundedLE(nums, (long) left - 1));\n}`,
        cpp: `static long long countBoundedLE(vector<int>& nums, long long bound) {\n    long long res = 0, cur = 0;\n    for (int x : nums) {\n        if (x <= bound) {\n            cur++;\n            res += cur;\n        } else {\n            cur = 0;\n        }\n    }\n    return res;\n}\n\nint numSubarrayBoundedMax(vector<int>& nums, int left, int right) {\n    return (int) (countBoundedLE(nums, right) - countBoundedLE(nums, (long long) left - 1));\n}`,
        c: `static long long countBoundedLE(int* nums, int numsSize, long long bound) {\n    long long res = 0, cur = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if ((long long) nums[i] <= bound) {\n            cur++;\n            res += cur;\n        } else {\n            cur = 0;\n        }\n    }\n    return res;\n}\n\nint numSubarrayBoundedMax(int* nums, int numsSize, int left, int right) {\n    long long a = countBoundedLE(nums, numsSize, (long long) right);\n    long long b = countBoundedLE(nums, numsSize, (long long) left - 1);\n    return (int) (a - b);\n}`,
        csharp: `private static long CountBoundedLE(int[] nums, long bound)\n{\n    long res = 0, cur = 0;\n    foreach (int x in nums)\n    {\n        if (x <= bound)\n        {\n            cur++;\n            res += cur;\n        }\n        else\n        {\n            cur = 0;\n        }\n    }\n    return res;\n}\n\npublic static int NumSubarrayBoundedMax(int[] nums, int left, int right)\n{\n    return (int) (CountBoundedLE(nums, right) - CountBoundedLE(nums, (long) left - 1));\n}`,
        go: `func countBoundedLE(nums []int, bound int) int64 {\n\tvar res, cur int64 = 0, 0\n\tfor _, x := range nums {\n\t\tif x <= bound {\n\t\t\tcur++\n\t\t\tres += cur\n\t\t} else {\n\t\t\tcur = 0\n\t\t}\n\t}\n\treturn res\n}\n\nfunc numSubarrayBoundedMax(nums []int, left int, right int) int {\n\treturn int(countBoundedLE(nums, right) - countBoundedLE(nums, left-1))\n}`,
        kotlin: `private fun countBoundedLE(nums: IntArray, bound: Long): Long {\n    var res = 0L\n    var cur = 0L\n    for (x in nums) {\n        if (x <= bound) {\n            cur++\n            res += cur\n        } else {\n            cur = 0\n        }\n    }\n    return res\n}\n\nfun numSubarrayBoundedMax(nums: IntArray, left: Int, right: Int): Int {\n    return (countBoundedLE(nums, right.toLong()) - countBoundedLE(nums, left.toLong() - 1)).toInt()\n}`,
        swift: `func numSubarrayBoundedMax(_ nums: [Int], _ left: Int, _ right: Int) -> Int {\n    func countLE(_ bound: Int) -> Int {\n        var res = 0\n        var cur = 0\n        for x in nums {\n            if x <= bound {\n                cur += 1\n                res += cur\n            } else {\n                cur = 0\n            }\n        }\n        return res\n    }\n    return countLE(right) - countLE(left - 1)\n}`,
        rust: `fn numSubarrayBoundedMax(nums: Vec<i32>, left: i32, right: i32) -> i32 {\n    fn count_le(nums: &Vec<i32>, bound: i64) -> i64 {\n        let mut res: i64 = 0;\n        let mut cur: i64 = 0;\n        for &x in nums.iter() {\n            if x as i64 <= bound {\n                cur += 1;\n                res += cur;\n            } else {\n                cur = 0;\n            }\n        }\n        res\n    }\n    (count_le(&nums, right as i64) - count_le(&nums, left as i64 - 1)) as i32\n}`,
        php: `function numSubarrayBoundedMax($nums, $left, $right) {\n    $countLE = function($bound) use ($nums) {\n        $res = 0;\n        $cur = 0;\n        foreach ($nums as $x) {\n            if ($x <= $bound) {\n                $cur++;\n                $res += $cur;\n            } else {\n                $cur = 0;\n            }\n        }\n        return $res;\n    };\n    return $countLE($right) - $countLE($left - 1);\n}`,
        ruby: `def numSubarrayBoundedMax(nums, left, right)\n  count_le = lambda do |bound|\n    res = 0\n    cur = 0\n    nums.each do |x|\n      if x <= bound\n        cur += 1\n        res += cur\n      else\n        cur = 0\n      end\n    end\n    res\n  end\n  count_le.call(right) - count_le.call(left - 1)\nend`,
      },
    };
  })(),

  // ── Count Complete Subarrays in an Array (LC 2799) ──────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      const seen: Record<number, boolean> = {};
      let all = 0;
      for (let i = 0; i < n; i++) if (!seen[nums[i]]) { seen[nums[i]] = true; all++; }
      const cnt: Record<number, number> = {};
      let l = 0, distinct = 0, res = 0;
      for (let r = 0; r < n; r++) {
        const v = nums[r];
        cnt[v] = (cnt[v] || 0) + 1;
        if (cnt[v] === 1) distinct++;
        while (distinct === all) {
          res += n - r;
          cnt[nums[l]]--;
          if (cnt[nums[l]] === 0) distinct--;
          l++;
        }
      }
      return res;
    };
    return {
      slug: "count-complete-subarrays-in-an-array",
      title: "Count Complete Subarrays in an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sliding Window", "Amazon", "Microsoft", "Freshworks"],
      signature: { funcName: "countCompleteSubarrays", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A subarray is **complete** when the number of distinct values in it equals the number of distinct values in the whole array.\n\nReturn the number of complete subarrays of `nums`.",
        [
          { in: "nums = [1,3,1,2,2]", out: "4", note: "The whole array has 3 distinct values; four subarrays match it." },
          { in: "nums = [5,5,5,5]", out: "10", note: "One distinct value, so every subarray is complete." },
          { in: "nums = [1,2]", out: "1" },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 2000"]),
      hints: [
        "First find how many distinct values the whole array has — that is the target.",
        "Once a window reaches the target, extending it to the right keeps it complete.",
        "So for each minimal complete window starting at `l`, all `n - r` extensions count.",
      ],
      editorial: explain({
        idea: "For each left edge, find the shortest complete window; every longer window with the same left edge is also complete. Sliding both edges collects all of them in one pass.",
        steps: [
          "Count the distinct values of the whole array as `all`.",
          "Grow the window on the right, keeping a tally and a distinct count.",
          "While the window is complete, add `n - r` (every right extension), then drop the left element and advance `l`.",
        ],
        why: "Adding elements can only raise the distinct count, and it can never exceed `all`, so once a window hits `all` every extension does too — hence the `n - r`. Shrinking from the left inside that loop enumerates each left edge exactly once with its minimal complete window.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Adding `n - r` outside the shrink loop counts only one left edge per right edge.",
          "The distinct count of the window is compared with the *whole array's*, not with a fixed `k`.",
          "An array of one repeated value makes every subarray complete — `n(n+1)/2` of them.",
        ],
      }),
      examples: [
        { input: "[1,3,1,2,2]", expectedOutput: "4" },
        { input: "[5,5,5,5]", expectedOutput: "10" },
        { input: "[1,2]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 45);
        const span = rng() < 0.6 ? ri(rng, 1, 5) : ri(rng, 1, 2000);
        const nums = Array.from({ length: n }, () => ri(rng, 1, span));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countCompleteSubarrays(nums: List[int]) -> int:\n    n = len(nums)\n    all_distinct = len(set(nums))\n    cnt = {}\n    l = 0\n    distinct = 0\n    res = 0\n    for r in range(n):\n        v = nums[r]\n        cnt[v] = cnt.get(v, 0) + 1\n        if cnt[v] == 1:\n            distinct += 1\n        while distinct == all_distinct:\n            res += n - r\n            cnt[nums[l]] -= 1\n            if cnt[nums[l]] == 0:\n                distinct -= 1\n            l += 1\n    return res`,
        javascript: `var countCompleteSubarrays = function(nums) {\n    var n = nums.length;\n    var seen = {}, all = 0, i;\n    for (i = 0; i < n; i++) {\n        if (!seen[nums[i]]) { seen[nums[i]] = true; all++; }\n    }\n    var cnt = {};\n    var l = 0, distinct = 0, res = 0;\n    for (var r = 0; r < n; r++) {\n        var v = nums[r];\n        cnt[v] = (cnt[v] || 0) + 1;\n        if (cnt[v] === 1) distinct++;\n        while (distinct === all) {\n            res += n - r;\n            cnt[nums[l]]--;\n            if (cnt[nums[l]] === 0) distinct--;\n            l++;\n        }\n    }\n    return res;\n};`,
        typescript: `function countCompleteSubarrays(nums: number[]): number {\n    var n = nums.length;\n    var seen: { [key: number]: boolean } = {};\n    var all = 0, i: number;\n    for (i = 0; i < n; i++) {\n        if (!seen[nums[i]]) { seen[nums[i]] = true; all++; }\n    }\n    var cnt: { [key: number]: number } = {};\n    var l = 0, distinct = 0, res = 0;\n    for (var r = 0; r < n; r++) {\n        var v = nums[r];\n        cnt[v] = (cnt[v] || 0) + 1;\n        if (cnt[v] === 1) distinct++;\n        while (distinct === all) {\n            res += n - r;\n            cnt[nums[l]]--;\n            if (cnt[nums[l]] === 0) distinct--;\n            l++;\n        }\n    }\n    return res;\n}`,
        java: `public static int countCompleteSubarrays(int[] nums) {\n    int n = nums.length;\n    Set<Integer> distinctAll = new HashSet<>();\n    for (int x : nums) distinctAll.add(x);\n    int all = distinctAll.size();\n    Map<Integer, Integer> cnt = new HashMap<>();\n    int l = 0, distinct = 0, res = 0;\n    for (int r = 0; r < n; r++) {\n        int v = nums[r];\n        int have = cnt.getOrDefault(v, 0) + 1;\n        cnt.put(v, have);\n        if (have == 1) distinct++;\n        while (distinct == all) {\n            res += n - r;\n            int u = nums[l];\n            int left = cnt.get(u) - 1;\n            cnt.put(u, left);\n            if (left == 0) distinct--;\n            l++;\n        }\n    }\n    return res;\n}`,
        cpp: `int countCompleteSubarrays(vector<int>& nums) {\n    int n = (int) nums.size();\n    unordered_set<int> distinctAll(nums.begin(), nums.end());\n    int all = (int) distinctAll.size();\n    unordered_map<int, int> cnt;\n    int l = 0, distinct = 0, res = 0;\n    for (int r = 0; r < n; r++) {\n        if (++cnt[nums[r]] == 1) distinct++;\n        while (distinct == all) {\n            res += n - r;\n            if (--cnt[nums[l]] == 0) distinct--;\n            l++;\n        }\n    }\n    return res;\n}`,
        c: `int countCompleteSubarrays(int* nums, int numsSize) {\n    int cnt[2001];\n    int seen[2001];\n    for (int i = 0; i <= 2000; i++) { cnt[i] = 0; seen[i] = 0; }\n    int all = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (!seen[nums[i]]) { seen[nums[i]] = 1; all++; }\n    }\n    int l = 0, distinct = 0, res = 0;\n    for (int r = 0; r < numsSize; r++) {\n        if (++cnt[nums[r]] == 1) distinct++;\n        while (distinct == all) {\n            res += numsSize - r;\n            if (--cnt[nums[l]] == 0) distinct--;\n            l++;\n        }\n    }\n    return res;\n}`,
        csharp: `public static int CountCompleteSubarrays(int[] nums)\n{\n    int n = nums.Length;\n    var distinctAll = new HashSet<int>(nums);\n    int all = distinctAll.Count;\n    var cnt = new Dictionary<int, int>();\n    int l = 0, distinct = 0, res = 0;\n    for (int r = 0; r < n; r++)\n    {\n        int v = nums[r];\n        int have;\n        cnt.TryGetValue(v, out have);\n        cnt[v] = have + 1;\n        if (have + 1 == 1) distinct++;\n        while (distinct == all)\n        {\n            res += n - r;\n            int u = nums[l];\n            cnt[u] = cnt[u] - 1;\n            if (cnt[u] == 0) distinct--;\n            l++;\n        }\n    }\n    return res;\n}`,
        go: `func countCompleteSubarrays(nums []int) int {\n\tn := len(nums)\n\tseen := map[int]bool{}\n\tfor _, x := range nums {\n\t\tseen[x] = true\n\t}\n\tall := len(seen)\n\tcnt := map[int]int{}\n\tl, distinct, res := 0, 0, 0\n\tfor r := 0; r < n; r++ {\n\t\tcnt[nums[r]]++\n\t\tif cnt[nums[r]] == 1 {\n\t\t\tdistinct++\n\t\t}\n\t\tfor distinct == all {\n\t\t\tres += n - r\n\t\t\tcnt[nums[l]]--\n\t\t\tif cnt[nums[l]] == 0 {\n\t\t\t\tdistinct--\n\t\t\t}\n\t\t\tl++\n\t\t}\n\t}\n\treturn res\n}`,
        kotlin: `fun countCompleteSubarrays(nums: IntArray): Int {\n    val n = nums.size\n    val all = nums.toHashSet().size\n    val cnt = HashMap<Int, Int>()\n    var l = 0\n    var distinct = 0\n    var res = 0\n    for (r in 0 until n) {\n        val v = nums[r]\n        val have = cnt.getOrDefault(v, 0) + 1\n        cnt[v] = have\n        if (have == 1) distinct++\n        while (distinct == all) {\n            res += n - r\n            val u = nums[l]\n            val left = cnt[u]!! - 1\n            cnt[u] = left\n            if (left == 0) distinct--\n            l++\n        }\n    }\n    return res\n}`,
        swift: `func countCompleteSubarrays(_ nums: [Int]) -> Int {\n    let n = nums.count\n    let all = Set(nums).count\n    var cnt = [Int: Int]()\n    var l = 0\n    var distinct = 0\n    var res = 0\n    for r in 0..<n {\n        let v = nums[r]\n        let have = (cnt[v] ?? 0) + 1\n        cnt[v] = have\n        if have == 1 { distinct += 1 }\n        while distinct == all {\n            res += n - r\n            let u = nums[l]\n            let left = (cnt[u] ?? 0) - 1\n            cnt[u] = left\n            if left == 0 { distinct -= 1 }\n            l += 1\n        }\n    }\n    return res\n}`,
        rust: `fn countCompleteSubarrays(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let all = nums.iter().collect::<std::collections::HashSet<_>>().len() as i32;\n    let mut cnt: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();\n    let mut l = 0usize;\n    let mut distinct = 0i32;\n    let mut res = 0i32;\n    for r in 0..n {\n        let e = cnt.entry(nums[r]).or_insert(0);\n        *e += 1;\n        if *e == 1 {\n            distinct += 1;\n        }\n        while distinct == all {\n            res += (n - r) as i32;\n            let u = cnt.entry(nums[l]).or_insert(0);\n            *u -= 1;\n            if *u == 0 {\n                distinct -= 1;\n            }\n            l += 1;\n        }\n    }\n    res\n}`,
        php: `function countCompleteSubarrays($nums) {\n    $n = count($nums);\n    $all = count(array_flip($nums));\n    $cnt = [];\n    $l = 0;\n    $distinct = 0;\n    $res = 0;\n    for ($r = 0; $r < $n; $r++) {\n        $v = $nums[$r];\n        $cnt[$v] = (isset($cnt[$v]) ? $cnt[$v] : 0) + 1;\n        if ($cnt[$v] === 1) $distinct++;\n        while ($distinct === $all) {\n            $res += $n - $r;\n            $u = $nums[$l];\n            $cnt[$u]--;\n            if ($cnt[$u] === 0) $distinct--;\n            $l++;\n        }\n    }\n    return $res;\n}`,
        ruby: `def countCompleteSubarrays(nums)\n  n = nums.length\n  all = nums.uniq.length\n  cnt = Hash.new(0)\n  l = 0\n  distinct = 0\n  res = 0\n  (0...n).each do |r|\n    v = nums[r]\n    cnt[v] += 1\n    distinct += 1 if cnt[v] == 1\n    while distinct == all\n      res += n - r\n      u = nums[l]\n      cnt[u] -= 1\n      distinct -= 1 if cnt[u] == 0\n      l += 1\n    end\n  end\n  res\nend`,
      },
    };
  })(),

  // ── Maximum Beauty of an Array After Applying Operation (LC 2779) ──
  (() => {
    const ref = (nums: number[], k: number) => {
      const a = nums.slice().sort((x, y) => x - y);
      let l = 0, best = 0;
      for (let r = 0; r < a.length; r++) {
        while (a[r] - a[l] > 2 * k) l++;
        if (r - l + 1 > best) best = r - l + 1;
      }
      return best;
    };
    return {
      slug: "maximum-beauty-of-an-array-after-applying-operation",
      title: "Maximum Beauty of an Array After Applying Operation",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Sorting", "Binary Search", "Amazon", "Google", "Atlassian"],
      signature: { funcName: "maximumBeauty", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You may apply this operation to each index **at most once**: choose an index not chosen before and replace `nums[i]` with any integer in `[nums[i] - k, nums[i] + k]`.\n\nThe **beauty** of an array is the length of its longest subsequence of equal elements. Return the maximum beauty achievable.",
        [
          { in: "nums = [4,6,1,2], k = 2", out: "3", note: "Turn 4, 6 and 2 all into 4 — each moves by at most 2." },
          { in: "nums = [1,1,1,1], k = 10", out: "4", note: "They are already equal." },
          { in: "nums = [10,1,20], k = 3", out: "1" },
        ],
        ["1 <= nums.length <= 100000", "0 <= nums[i], k <= 100000"]),
      hints: [
        "A subsequence, not a subarray — so order does not matter and you may sort.",
        "Two elements can be made equal exactly when their values differ by at most `2k`.",
        "Find the largest group of sorted values whose spread is at most `2k`.",
      ],
      editorial: explain({
        idea: "Element `x` can become any value in `[x-k, x+k]`, so two elements can meet exactly when their intervals overlap, i.e. when they differ by at most `2k`. A set of elements can all meet at one value precisely when its spread is within `2k` — and after sorting, the best such set is contiguous.",
        steps: [
          "Sort `nums`.",
          "Slide a window; while `a[r] - a[l] > 2k`, advance `l`.",
          "Track the widest valid window.",
        ],
        why: "Intervals on a line have the Helly property: a family of intervals has a common point exactly when every pair overlaps, which for equal-radius intervals reduces to `max - min <= 2k`. On sorted data that is `a[r] - a[l]`, and since widening the window on the left only increases the spread, the predicate is monotone and one left pointer suffices.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Using `k` rather than `2k` halves every window — both endpoints may move.",
          "Treating it as a subarray problem forbids the sort and gives a smaller answer.",
          "`k = 0` reduces to the largest count of a repeated value.",
        ],
      }),
      examples: [
        { input: "[4,6,1,2]\n2", expectedOutput: "3" },
        { input: "[1,1,1,1]\n10", expectedOutput: "4" },
        { input: "[10,1,20]\n3", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 30 : 100000;
        const nums = Array.from({ length: ri(rng, 1, 45) }, () => ri(rng, 0, hi));
        const k = rng() < 0.6 ? ri(rng, 0, 10) : ri(rng, 0, 100000);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumBeauty(nums: List[int], k: int) -> int:\n    a = sorted(nums)\n    l = 0\n    best = 0\n    for r in range(len(a)):\n        while a[r] - a[l] > 2 * k:\n            l += 1\n        best = max(best, r - l + 1)\n    return best`,
        javascript: `var maximumBeauty = function(nums, k) {\n    var a = nums.slice().sort(function(x, y) { return x - y; });\n    var l = 0, best = 0;\n    for (var r = 0; r < a.length; r++) {\n        while (a[r] - a[l] > 2 * k) l++;\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n};`,
        typescript: `function maximumBeauty(nums: number[], k: number): number {\n    var a = nums.slice().sort(function(x, y) { return x - y; });\n    var l = 0, best = 0;\n    for (var r = 0; r < a.length; r++) {\n        while (a[r] - a[l] > 2 * k) l++;\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        java: `public static int maximumBeauty(int[] nums, int k) {\n    int[] a = nums.clone();\n    Arrays.sort(a);\n    int l = 0, best = 0;\n    for (int r = 0; r < a.length; r++) {\n        while (a[r] - a[l] > 2 * k) l++;\n        best = Math.max(best, r - l + 1);\n    }\n    return best;\n}`,
        cpp: `int maximumBeauty(vector<int>& nums, int k) {\n    vector<int> a = nums;\n    sort(a.begin(), a.end());\n    int l = 0, best = 0;\n    for (int r = 0; r < (int) a.size(); r++) {\n        while (a[r] - a[l] > 2 * k) l++;\n        best = max(best, r - l + 1);\n    }\n    return best;\n}`,
        c: `static int cmpBeautyAsc(const void* x, const void* y) {\n    int p = *(const int*) x;\n    int q = *(const int*) y;\n    return (p > q) - (p < q);\n}\n\nint maximumBeauty(int* nums, int numsSize, int k) {\n    int* a = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    qsort(a, (size_t) numsSize, sizeof(int), cmpBeautyAsc);\n    int l = 0, best = 0;\n    for (int r = 0; r < numsSize; r++) {\n        while (a[r] - a[l] > 2 * k) l++;\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    free(a);\n    return best;\n}`,
        csharp: `public static int MaximumBeauty(int[] nums, int k)\n{\n    int[] a = (int[]) nums.Clone();\n    Array.Sort(a);\n    int l = 0, best = 0;\n    for (int r = 0; r < a.Length; r++)\n    {\n        while (a[r] - a[l] > 2 * k) l++;\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        go: `func maximumBeauty(nums []int, k int) int {\n\ta := append([]int{}, nums...)\n\tsort.Ints(a)\n\tl, best := 0, 0\n\tfor r := 0; r < len(a); r++ {\n\t\tfor a[r]-a[l] > 2*k {\n\t\t\tl++\n\t\t}\n\t\tif r-l+1 > best {\n\t\t\tbest = r - l + 1\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maximumBeauty(nums: IntArray, k: Int): Int {\n    val a = nums.sortedArray()\n    var l = 0\n    var best = 0\n    for (r in a.indices) {\n        while (a[r] - a[l] > 2 * k) l++\n        if (r - l + 1 > best) best = r - l + 1\n    }\n    return best\n}`,
        swift: `func maximumBeauty(_ nums: [Int], _ k: Int) -> Int {\n    let a = nums.sorted()\n    var l = 0\n    var best = 0\n    for r in 0..<a.count {\n        while a[r] - a[l] > 2 * k { l += 1 }\n        if r - l + 1 > best { best = r - l + 1 }\n    }\n    return best\n}`,
        rust: `fn maximumBeauty(nums: Vec<i32>, k: i32) -> i32 {\n    let mut a = nums.clone();\n    a.sort();\n    let mut l = 0usize;\n    let mut best = 0i32;\n    for r in 0..a.len() {\n        while a[r] - a[l] > 2 * k {\n            l += 1;\n        }\n        let len = (r + 1 - l) as i32;\n        if len > best {\n            best = len;\n        }\n    }\n    best\n}`,
        php: `function maximumBeauty($nums, $k) {\n    $a = $nums;\n    sort($a);\n    $l = 0;\n    $best = 0;\n    for ($r = 0; $r < count($a); $r++) {\n        while ($a[$r] - $a[$l] > 2 * $k) $l++;\n        if ($r - $l + 1 > $best) $best = $r - $l + 1;\n    }\n    return $best;\n}`,
        ruby: `def maximumBeauty(nums, k)\n  a = nums.sort\n  l = 0\n  best = 0\n  (0...a.length).each do |r|\n    l += 1 while a[r] - a[l] > 2 * k\n    best = r - l + 1 if r - l + 1 > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Length of Longest Subarray With at Most K Frequency (LC 2958) ──
  (() => {
    const ref = (nums: number[], k: number) => {
      const cnt: Record<number, number> = {};
      let l = 0, best = 0;
      for (let r = 0; r < nums.length; r++) {
        const v = nums[r];
        cnt[v] = (cnt[v] || 0) + 1;
        while (cnt[v] > k) { cnt[nums[l]]--; l++; }
        if (r - l + 1 > best) best = r - l + 1;
      }
      return best;
    };
    return {
      slug: "length-of-longest-subarray-with-at-most-k-frequency",
      title: "Length of Longest Subarray With at Most K Frequency",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sliding Window", "Amazon", "Google", "Zomato"],
      signature: { funcName: "maxSubarrayLength", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A subarray is **good** when every value in it appears at most `k` times.\n\nReturn the length of the longest good subarray of `nums`.",
        [
          { in: "nums = [1,2,3,1,2,3,1,2], k = 2", out: "6", note: "[1,2,3,1,2,3] has each of 1, 2 and 3 twice." },
          { in: "nums = [1,2,1,2,1,2,1,2], k = 1", out: "2" },
          { in: "nums = [5,5,5,5,5,5,5], k = 4", out: "4" },
        ],
        ["1 <= nums.length <= 100000", "1 <= nums[i] <= 1000000000", "1 <= k <= nums.length"]),
      hints: [
        "Removing elements can only lower every frequency, so 'good' is monotone in the left edge.",
        "Only the value just added can break the invariant — no need to scan every frequency.",
        "Shrink until that one value is back within `k`.",
      ],
      editorial: explain({
        idea: "A standard variable window. When a new element pushes its own frequency above `k`, pull the left edge in until it drops back. No other value can have become too frequent, so one check per step is enough.",
        steps: [
          "Add `nums[r]` to the tally.",
          "While its count exceeds `k`, remove `nums[l]` from the tally and advance `l`.",
          "Record the window length.",
        ],
        why: "The only frequency that changes on the right is the incoming value's, so it is the only one that can violate the bound. Shrinking never raises a frequency, so the valid left edges for each right edge form a suffix — hence a single forward-moving left pointer, linear overall.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Re-checking every value's frequency turns each step linear and the whole scan quadratic.",
          "The shrink loop must test the *incoming* value's count, not the outgoing one's.",
          "Values reach `10^9`, so a hash map is needed rather than a direct-indexed array.",
        ],
      }),
      examples: [
        { input: "[1,2,3,1,2,3,1,2]\n2", expectedOutput: "6" },
        { input: "[1,2,1,2,1,2,1,2]\n1", expectedOutput: "2" },
        { input: "[5,5,5,5,5,5,5]\n4", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 45);
        const span = rng() < 0.6 ? ri(rng, 1, 5) : ri(rng, 1, 1000000000);
        const nums = Array.from({ length: n }, () => ri(rng, 1, span));
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxSubarrayLength(nums: List[int], k: int) -> int:\n    cnt = {}\n    l = 0\n    best = 0\n    for r, v in enumerate(nums):\n        cnt[v] = cnt.get(v, 0) + 1\n        while cnt[v] > k:\n            cnt[nums[l]] -= 1\n            l += 1\n        best = max(best, r - l + 1)\n    return best`,
        javascript: `var maxSubarrayLength = function(nums, k) {\n    var cnt = {};\n    var l = 0, best = 0;\n    for (var r = 0; r < nums.length; r++) {\n        var v = nums[r];\n        cnt[v] = (cnt[v] || 0) + 1;\n        while (cnt[v] > k) { cnt[nums[l]]--; l++; }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n};`,
        typescript: `function maxSubarrayLength(nums: number[], k: number): number {\n    var cnt: { [key: number]: number } = {};\n    var l = 0, best = 0;\n    for (var r = 0; r < nums.length; r++) {\n        var v = nums[r];\n        cnt[v] = (cnt[v] || 0) + 1;\n        while (cnt[v] > k) { cnt[nums[l]]--; l++; }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        java: `public static int maxSubarrayLength(int[] nums, int k) {\n    Map<Integer, Integer> cnt = new HashMap<>();\n    int l = 0, best = 0;\n    for (int r = 0; r < nums.length; r++) {\n        int v = nums[r];\n        cnt.merge(v, 1, Integer::sum);\n        while (cnt.get(v) > k) {\n            cnt.merge(nums[l], -1, Integer::sum);\n            l++;\n        }\n        best = Math.max(best, r - l + 1);\n    }\n    return best;\n}`,
        cpp: `int maxSubarrayLength(vector<int>& nums, int k) {\n    unordered_map<int, int> cnt;\n    int l = 0, best = 0;\n    for (int r = 0; r < (int) nums.size(); r++) {\n        int v = nums[r];\n        cnt[v]++;\n        while (cnt[v] > k) {\n            cnt[nums[l]]--;\n            l++;\n        }\n        best = max(best, r - l + 1);\n    }\n    return best;\n}`,
        c: `typedef struct { int key; int val; int used; } FreqSlot;\n\nstatic int freqSlotFor(FreqSlot* tab, int cap, int key) {\n    unsigned int h = ((unsigned int) key) * 2654435761u;\n    int i = (int) (h % (unsigned int) cap);\n    while (tab[i].used && tab[i].key != key) i = (i + 1) % cap;\n    return i;\n}\n\nint maxSubarrayLength(int* nums, int numsSize, int k) {\n    int cap = 1;\n    while (cap < numsSize * 2 + 4) cap <<= 1;\n    FreqSlot* tab = (FreqSlot*) calloc((size_t) cap, sizeof(FreqSlot));\n    int l = 0, best = 0;\n    for (int r = 0; r < numsSize; r++) {\n        int i = freqSlotFor(tab, cap, nums[r]);\n        if (!tab[i].used) { tab[i].used = 1; tab[i].key = nums[r]; tab[i].val = 0; }\n        tab[i].val++;\n        while (tab[i].val > k) {\n            int j = freqSlotFor(tab, cap, nums[l]);\n            tab[j].val--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    free(tab);\n    return best;\n}`,
        csharp: `public static int MaxSubarrayLength(int[] nums, int k)\n{\n    var cnt = new Dictionary<int, int>();\n    int l = 0, best = 0;\n    for (int r = 0; r < nums.Length; r++)\n    {\n        int v = nums[r];\n        int have;\n        cnt.TryGetValue(v, out have);\n        cnt[v] = have + 1;\n        while (cnt[v] > k)\n        {\n            cnt[nums[l]] = cnt[nums[l]] - 1;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        go: `func maxSubarrayLength(nums []int, k int) int {\n\tcnt := map[int]int{}\n\tl, best := 0, 0\n\tfor r := 0; r < len(nums); r++ {\n\t\tv := nums[r]\n\t\tcnt[v]++\n\t\tfor cnt[v] > k {\n\t\t\tcnt[nums[l]]--\n\t\t\tl++\n\t\t}\n\t\tif r-l+1 > best {\n\t\t\tbest = r - l + 1\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxSubarrayLength(nums: IntArray, k: Int): Int {\n    val cnt = HashMap<Int, Int>()\n    var l = 0\n    var best = 0\n    for (r in nums.indices) {\n        val v = nums[r]\n        cnt[v] = cnt.getOrDefault(v, 0) + 1\n        while (cnt[v]!! > k) {\n            cnt[nums[l]] = cnt[nums[l]]!! - 1\n            l++\n        }\n        if (r - l + 1 > best) best = r - l + 1\n    }\n    return best\n}`,
        swift: `func maxSubarrayLength(_ nums: [Int], _ k: Int) -> Int {\n    var cnt = [Int: Int]()\n    var l = 0\n    var best = 0\n    for r in 0..<nums.count {\n        let v = nums[r]\n        cnt[v] = (cnt[v] ?? 0) + 1\n        while (cnt[v] ?? 0) > k {\n            cnt[nums[l]] = (cnt[nums[l]] ?? 0) - 1\n            l += 1\n        }\n        if r - l + 1 > best { best = r - l + 1 }\n    }\n    return best\n}`,
        rust: `fn maxSubarrayLength(nums: Vec<i32>, k: i32) -> i32 {\n    let mut cnt: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();\n    let mut l = 0usize;\n    let mut best = 0i32;\n    for r in 0..nums.len() {\n        let v = nums[r];\n        *cnt.entry(v).or_insert(0) += 1;\n        while cnt[&v] > k {\n            *cnt.entry(nums[l]).or_insert(0) -= 1;\n            l += 1;\n        }\n        let len = (r + 1 - l) as i32;\n        if len > best {\n            best = len;\n        }\n    }\n    best\n}`,
        php: `function maxSubarrayLength($nums, $k) {\n    $cnt = [];\n    $l = 0;\n    $best = 0;\n    for ($r = 0; $r < count($nums); $r++) {\n        $v = $nums[$r];\n        $cnt[$v] = (isset($cnt[$v]) ? $cnt[$v] : 0) + 1;\n        while ($cnt[$v] > $k) {\n            $cnt[$nums[$l]]--;\n            $l++;\n        }\n        if ($r - $l + 1 > $best) $best = $r - $l + 1;\n    }\n    return $best;\n}`,
        ruby: `def maxSubarrayLength(nums, k)\n  cnt = Hash.new(0)\n  l = 0\n  best = 0\n  nums.each_with_index do |v, r|\n    cnt[v] += 1\n    while cnt[v] > k\n      cnt[nums[l]] -= 1\n      l += 1\n    end\n    best = r - l + 1 if r - l + 1 > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Minimum Swaps to Group All 1's Together II (LC 2134) ────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let w = 0;
      for (let i = 0; i < n; i++) w += nums[i];
      if (w === 0 || w === n) return 0;
      let ones = 0;
      for (let i = 0; i < w; i++) ones += nums[i];
      let best = ones;
      for (let i = 1; i < n; i++) {
        ones -= nums[i - 1];
        ones += nums[(i + w - 1) % n];
        if (ones > best) best = ones;
      }
      return w - best;
    };
    return {
      slug: "minimum-swaps-to-group-all-1s-together-ii",
      title: "Minimum Swaps to Group All 1's Together II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Amazon", "Google", "Walmart"],
      signature: { funcName: "minSwaps", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A **swap** exchanges the values at two distinct positions. `nums` is a **circular** binary array — the last element is adjacent to the first.\n\nReturn the minimum number of swaps needed to gather all the `1`s into one contiguous block (wrapping is allowed).",
        [
          { in: "nums = [0,1,0,1,1,0,0]", out: "1", note: "Swapping positions 1 and 5 gathers the three 1s." },
          { in: "nums = [0,1,1,1,0,0,1,1,0]", out: "2", note: "The block may wrap around the end." },
          { in: "nums = [1,1,0,0,1]", out: "0", note: "Already grouped, wrapping from index 4 to 1." },
        ],
        ["1 <= nums.length <= 100000", "nums[i] is 0 or 1"]),
      hints: [
        "The final block has exactly as many slots as there are `1`s — call that `w`.",
        "Each `0` inside the chosen block costs one swap, because a `1` outside must come in to replace it.",
        "So slide a circular window of width `w` and maximise the `1`s inside it.",
      ],
      editorial: explain({
        idea: "Fix the shape of the answer: a circular window of width `w`, the number of `1`s. The cost of a window is its `0` count, so maximise its `1` count instead. A rolling sum over the circle does it in one pass.",
        steps: [
          "Count the `1`s to get `w`; if `w` is 0 or `n`, no swaps are needed.",
          "Sum the first `w` elements as the initial window.",
          "Roll the window forward `n - 1` times using `nums[(i + w - 1) % n]` to enter and `nums[i - 1]` to leave.",
          "Return `w - best`.",
        ],
        why: "Every `0` inside the block must be exchanged with a `1` outside, and one swap fixes exactly one such pair — so the cost is precisely the `0` count. Since the block has width `w`, its `0` count is `w` minus its `1` count, and maximising the latter minimises the former.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting the wrap and only sliding over `[0, n - w]` misses the best block in the circular cases.",
          "Doubling the array works too but costs `O(n)` extra space — the modulo avoids it.",
          "An all-zero or all-one array must short-circuit, or the window width is 0 or `n` and the roll is degenerate.",
        ],
      }),
      examples: [
        { input: "[0,1,0,1,1,0,0]", expectedOutput: "1" },
        { input: "[0,1,1,1,0,0,1,1,0]", expectedOutput: "2" },
        { input: "[1,1,0,0,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 45) }, () => (rng() < 0.5 ? 1 : 0));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minSwaps(nums: List[int]) -> int:\n    n = len(nums)\n    w = sum(nums)\n    if w == 0 or w == n:\n        return 0\n    ones = sum(nums[:w])\n    best = ones\n    for i in range(1, n):\n        ones -= nums[i - 1]\n        ones += nums[(i + w - 1) % n]\n        best = max(best, ones)\n    return w - best`,
        javascript: `var minSwaps = function(nums) {\n    var n = nums.length, w = 0, i;\n    for (i = 0; i < n; i++) w += nums[i];\n    if (w === 0 || w === n) return 0;\n    var ones = 0;\n    for (i = 0; i < w; i++) ones += nums[i];\n    var best = ones;\n    for (i = 1; i < n; i++) {\n        ones -= nums[i - 1];\n        ones += nums[(i + w - 1) % n];\n        if (ones > best) best = ones;\n    }\n    return w - best;\n};`,
        typescript: `function minSwaps(nums: number[]): number {\n    var n = nums.length, w = 0, i: number;\n    for (i = 0; i < n; i++) w += nums[i];\n    if (w === 0 || w === n) return 0;\n    var ones = 0;\n    for (i = 0; i < w; i++) ones += nums[i];\n    var best = ones;\n    for (i = 1; i < n; i++) {\n        ones -= nums[i - 1];\n        ones += nums[(i + w - 1) % n];\n        if (ones > best) best = ones;\n    }\n    return w - best;\n}`,
        java: `public static int minSwaps(int[] nums) {\n    int n = nums.length, w = 0;\n    for (int x : nums) w += x;\n    if (w == 0 || w == n) return 0;\n    int ones = 0;\n    for (int i = 0; i < w; i++) ones += nums[i];\n    int best = ones;\n    for (int i = 1; i < n; i++) {\n        ones -= nums[i - 1];\n        ones += nums[(i + w - 1) % n];\n        best = Math.max(best, ones);\n    }\n    return w - best;\n}`,
        cpp: `int minSwaps(vector<int>& nums) {\n    int n = (int) nums.size(), w = 0;\n    for (int x : nums) w += x;\n    if (w == 0 || w == n) return 0;\n    int ones = 0;\n    for (int i = 0; i < w; i++) ones += nums[i];\n    int best = ones;\n    for (int i = 1; i < n; i++) {\n        ones -= nums[i - 1];\n        ones += nums[(i + w - 1) % n];\n        best = max(best, ones);\n    }\n    return w - best;\n}`,
        c: `int minSwaps(int* nums, int numsSize) {\n    int n = numsSize, w = 0;\n    for (int i = 0; i < n; i++) w += nums[i];\n    if (w == 0 || w == n) return 0;\n    int ones = 0;\n    for (int i = 0; i < w; i++) ones += nums[i];\n    int best = ones;\n    for (int i = 1; i < n; i++) {\n        ones -= nums[i - 1];\n        ones += nums[(i + w - 1) % n];\n        if (ones > best) best = ones;\n    }\n    return w - best;\n}`,
        csharp: `public static int MinSwaps(int[] nums)\n{\n    int n = nums.Length, w = 0;\n    foreach (int x in nums) w += x;\n    if (w == 0 || w == n) return 0;\n    int ones = 0;\n    for (int i = 0; i < w; i++) ones += nums[i];\n    int best = ones;\n    for (int i = 1; i < n; i++)\n    {\n        ones -= nums[i - 1];\n        ones += nums[(i + w - 1) % n];\n        if (ones > best) best = ones;\n    }\n    return w - best;\n}`,
        go: `func minSwaps(nums []int) int {\n\tn := len(nums)\n\tw := 0\n\tfor _, x := range nums {\n\t\tw += x\n\t}\n\tif w == 0 || w == n {\n\t\treturn 0\n\t}\n\tones := 0\n\tfor i := 0; i < w; i++ {\n\t\tones += nums[i]\n\t}\n\tbest := ones\n\tfor i := 1; i < n; i++ {\n\t\tones -= nums[i-1]\n\t\tones += nums[(i+w-1)%n]\n\t\tif ones > best {\n\t\t\tbest = ones\n\t\t}\n\t}\n\treturn w - best\n}`,
        kotlin: `fun minSwaps(nums: IntArray): Int {\n    val n = nums.size\n    var w = 0\n    for (x in nums) w += x\n    if (w == 0 || w == n) return 0\n    var ones = 0\n    for (i in 0 until w) ones += nums[i]\n    var best = ones\n    for (i in 1 until n) {\n        ones -= nums[i - 1]\n        ones += nums[(i + w - 1) % n]\n        if (ones > best) best = ones\n    }\n    return w - best\n}`,
        swift: `func minSwaps(_ nums: [Int]) -> Int {\n    let n = nums.count\n    let w = nums.reduce(0, +)\n    if w == 0 || w == n { return 0 }\n    var ones = 0\n    for i in 0..<w { ones += nums[i] }\n    var best = ones\n    for i in 1..<n {\n        ones -= nums[i - 1]\n        ones += nums[(i + w - 1) % n]\n        if ones > best { best = ones }\n    }\n    return w - best\n}`,
        rust: `fn minSwaps(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let w: usize = nums.iter().map(|&x| x as usize).sum();\n    if w == 0 || w == n {\n        return 0;\n    }\n    let mut ones = 0i32;\n    for i in 0..w {\n        ones += nums[i];\n    }\n    let mut best = ones;\n    for i in 1..n {\n        ones -= nums[i - 1];\n        ones += nums[(i + w - 1) % n];\n        if ones > best {\n            best = ones;\n        }\n    }\n    w as i32 - best\n}`,
        php: `function minSwaps($nums) {\n    $n = count($nums);\n    $w = array_sum($nums);\n    if ($w === 0 || $w === $n) return 0;\n    $ones = 0;\n    for ($i = 0; $i < $w; $i++) $ones += $nums[$i];\n    $best = $ones;\n    for ($i = 1; $i < $n; $i++) {\n        $ones -= $nums[$i - 1];\n        $ones += $nums[($i + $w - 1) % $n];\n        if ($ones > $best) $best = $ones;\n    }\n    return $w - $best;\n}`,
        ruby: `def minSwaps(nums)\n  n = nums.length\n  w = nums.sum\n  return 0 if w == 0 || w == n\n  ones = nums[0, w].sum\n  best = ones\n  (1...n).each do |i|\n    ones -= nums[i - 1]\n    ones += nums[(i + w - 1) % n]\n    best = ones if ones > best\n  end\n  w - best\nend`,
      },
    };
  })(),

  // ── Max Consecutive Ones II (LC 487) ────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let l = 0, zeros = 0, best = 0;
      for (let r = 0; r < nums.length; r++) {
        if (nums[r] === 0) zeros++;
        while (zeros > 1) { if (nums[l] === 0) zeros--; l++; }
        if (r - l + 1 > best) best = r - l + 1;
      }
      return best;
    };
    return {
      slug: "max-consecutive-ones-ii",
      title: "Max Consecutive Ones II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Dynamic Programming", "Amazon", "Meta", "Cognizant"],
      signature: { funcName: "findMaxConsecutiveOnes", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given a binary array `nums`, return the maximum number of consecutive `1`s obtainable if you may flip **at most one** `0`.",
        [
          { in: "nums = [1,0,1,1,0]", out: "4", note: "Flipping either 0 yields a run of four." },
          { in: "nums = [1,0,1,1,0,1]", out: "4" },
          { in: "nums = [0,0,0]", out: "1", note: "One flip gives a single 1." },
        ],
        ["1 <= nums.length <= 100000", "nums[i] is 0 or 1"]),
      hints: [
        "The flipped `0` sits inside the final run, so the run is a window containing at most one `0`.",
        "Grow the window on the right; while it holds two `0`s, shrink it from the left.",
        "The answer is the widest such window.",
      ],
      editorial: explain({
        idea: "A window with at most one `0` is exactly a run of `1`s plus one flip. Grow it on the right and repair from the left whenever a second `0` enters.",
        steps: [
          "Track `zeros`, the number of `0`s in the window.",
          "On adding `nums[r]`, bump `zeros` when it is `0`.",
          "While `zeros > 1`, advance the left edge, lowering `zeros` when the departing element was a `0`.",
          "Record the window's width.",
        ],
        why: "Removing elements never raises the `0` count, so the valid left edges for each right edge form a suffix and the left pointer moves forward only. The flip is free in the sense that any window with one `0` is realisable — flipping that `0` makes the whole window `1`s.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "An all-`1` array needs no flip, and the window naturally covers everything.",
          "An all-`0` array gives 1, not 0 — a flip is always available.",
          "Allowing two `0`s in the window over-counts; the bound is strict.",
        ],
      }),
      examples: [
        { input: "[1,0,1,1,0]", expectedOutput: "4" },
        { input: "[1,0,1,1,0,1]", expectedOutput: "4" },
        { input: "[0,0,0]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const p = rng() < 0.5 ? 0.5 : 0.8;
        const nums = Array.from({ length: ri(rng, 1, 45) }, () => (rng() < p ? 1 : 0));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findMaxConsecutiveOnes(nums: List[int]) -> int:\n    l = 0\n    zeros = 0\n    best = 0\n    for r, v in enumerate(nums):\n        if v == 0:\n            zeros += 1\n        while zeros > 1:\n            if nums[l] == 0:\n                zeros -= 1\n            l += 1\n        best = max(best, r - l + 1)\n    return best`,
        javascript: `var findMaxConsecutiveOnes = function(nums) {\n    var l = 0, zeros = 0, best = 0;\n    for (var r = 0; r < nums.length; r++) {\n        if (nums[r] === 0) zeros++;\n        while (zeros > 1) {\n            if (nums[l] === 0) zeros--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n};`,
        typescript: `function findMaxConsecutiveOnes(nums: number[]): number {\n    var l = 0, zeros = 0, best = 0;\n    for (var r = 0; r < nums.length; r++) {\n        if (nums[r] === 0) zeros++;\n        while (zeros > 1) {\n            if (nums[l] === 0) zeros--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        java: `public static int findMaxConsecutiveOnes(int[] nums) {\n    int l = 0, zeros = 0, best = 0;\n    for (int r = 0; r < nums.length; r++) {\n        if (nums[r] == 0) zeros++;\n        while (zeros > 1) {\n            if (nums[l] == 0) zeros--;\n            l++;\n        }\n        best = Math.max(best, r - l + 1);\n    }\n    return best;\n}`,
        cpp: `int findMaxConsecutiveOnes(vector<int>& nums) {\n    int l = 0, zeros = 0, best = 0;\n    for (int r = 0; r < (int) nums.size(); r++) {\n        if (nums[r] == 0) zeros++;\n        while (zeros > 1) {\n            if (nums[l] == 0) zeros--;\n            l++;\n        }\n        best = max(best, r - l + 1);\n    }\n    return best;\n}`,
        c: `int findMaxConsecutiveOnes(int* nums, int numsSize) {\n    int l = 0, zeros = 0, best = 0;\n    for (int r = 0; r < numsSize; r++) {\n        if (nums[r] == 0) zeros++;\n        while (zeros > 1) {\n            if (nums[l] == 0) zeros--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        csharp: `public static int FindMaxConsecutiveOnes(int[] nums)\n{\n    int l = 0, zeros = 0, best = 0;\n    for (int r = 0; r < nums.Length; r++)\n    {\n        if (nums[r] == 0) zeros++;\n        while (zeros > 1)\n        {\n            if (nums[l] == 0) zeros--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
        go: `func findMaxConsecutiveOnes(nums []int) int {\n\tl, zeros, best := 0, 0, 0\n\tfor r := 0; r < len(nums); r++ {\n\t\tif nums[r] == 0 {\n\t\t\tzeros++\n\t\t}\n\t\tfor zeros > 1 {\n\t\t\tif nums[l] == 0 {\n\t\t\t\tzeros--\n\t\t\t}\n\t\t\tl++\n\t\t}\n\t\tif r-l+1 > best {\n\t\t\tbest = r - l + 1\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun findMaxConsecutiveOnes(nums: IntArray): Int {\n    var l = 0\n    var zeros = 0\n    var best = 0\n    for (r in nums.indices) {\n        if (nums[r] == 0) zeros++\n        while (zeros > 1) {\n            if (nums[l] == 0) zeros--\n            l++\n        }\n        if (r - l + 1 > best) best = r - l + 1\n    }\n    return best\n}`,
        swift: `func findMaxConsecutiveOnes(_ nums: [Int]) -> Int {\n    var l = 0\n    var zeros = 0\n    var best = 0\n    for r in 0..<nums.count {\n        if nums[r] == 0 { zeros += 1 }\n        while zeros > 1 {\n            if nums[l] == 0 { zeros -= 1 }\n            l += 1\n        }\n        if r - l + 1 > best { best = r - l + 1 }\n    }\n    return best\n}`,
        rust: `fn findMaxConsecutiveOnes(nums: Vec<i32>) -> i32 {\n    let mut l = 0usize;\n    let mut zeros = 0i32;\n    let mut best = 0i32;\n    for r in 0..nums.len() {\n        if nums[r] == 0 {\n            zeros += 1;\n        }\n        while zeros > 1 {\n            if nums[l] == 0 {\n                zeros -= 1;\n            }\n            l += 1;\n        }\n        let len = (r + 1 - l) as i32;\n        if len > best {\n            best = len;\n        }\n    }\n    best\n}`,
        php: `function findMaxConsecutiveOnes($nums) {\n    $l = 0;\n    $zeros = 0;\n    $best = 0;\n    for ($r = 0; $r < count($nums); $r++) {\n        if ($nums[$r] === 0) $zeros++;\n        while ($zeros > 1) {\n            if ($nums[$l] === 0) $zeros--;\n            $l++;\n        }\n        if ($r - $l + 1 > $best) $best = $r - $l + 1;\n    }\n    return $best;\n}`,
        ruby: `def findMaxConsecutiveOnes(nums)\n  l = 0\n  zeros = 0\n  best = 0\n  nums.each_with_index do |v, r|\n    zeros += 1 if v == 0\n    while zeros > 1\n      zeros -= 1 if nums[l] == 0\n      l += 1\n    end\n    best = r - l + 1 if r - l + 1 > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Minimum Consecutive Cards to Pick Up (LC 2260) ──────────────
  (() => {
    const ref = (cards: number[]) => {
      const last: Record<number, number> = {};
      let best = -1;
      for (let i = 0; i < cards.length; i++) {
        const v = cards[i];
        if (last[v] !== undefined) {
          const d = i - last[v] + 1;
          if (best < 0 || d < best) best = d;
        }
        last[v] = i;
      }
      return best;
    };
    return {
      slug: "minimum-consecutive-cards-to-pick-up",
      title: "Minimum Consecutive Cards to Pick Up",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sliding Window", "Amazon", "Microsoft", "Infosys"],
      signature: { funcName: "minimumCardPickup", params: [{ name: "cards", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`cards[i]` is the value on the `i`-th card. You must pick up some **consecutive** cards and want a matching pair among them.\n\nReturn the minimum number of consecutive cards you have to pick up to get a pair of equal values, or `-1` if no pair exists.",
        [
          { in: "cards = [3,4,2,3,4,7]", out: "4", note: "Cards 0 through 3 hold two 3s." },
          { in: "cards = [1,0,5,3]", out: "-1", note: "Every value is distinct." },
          { in: "cards = [9,9]", out: "2" },
        ],
        ["1 <= cards.length <= 100000", "0 <= cards[i] <= 1000000"]),
      hints: [
        "The shortest run containing a pair is bounded by two occurrences of the same value.",
        "For each value, only the gap to its *previous* occurrence can be the smallest.",
        "Keep a map from value to its last index and take the minimum gap plus one.",
      ],
      editorial: explain({
        idea: "The answer is the smallest distance between two equal values, plus one for inclusivity. Only consecutive occurrences of a value matter, so one pass with a last-seen map suffices.",
        steps: [
          "Keep `last[v]`, the most recent index of each value.",
          "At index `i`, if `cards[i]` was seen before, the candidate is `i - last[cards[i]] + 1`.",
          "Update `last[cards[i]]` and keep the minimum candidate; return `-1` if none was ever found.",
        ],
        why: "Any run containing a pair contains two occurrences of some value, and shrinking it to just those two occurrences is no longer — so the answer is realised by some adjacent pair of equal values. Non-adjacent occurrences are strictly further apart, so only the previous one needs checking.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Comparing against the *first* occurrence of a value rather than the previous one gives a longer run.",
          "The answer is a count of cards, so the gap needs the `+ 1`.",
          "All-distinct input must return `-1`, not a large sentinel.",
        ],
      }),
      examples: [
        { input: "[3,4,2,3,4,7]", expectedOutput: "4" },
        { input: "[1,0,5,3]", expectedOutput: "-1" },
        { input: "[9,9]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 45);
        const span = rng() < 0.6 ? ri(rng, 1, 12) : ri(rng, 1, 1000000);
        const cards = Array.from({ length: n }, () => ri(rng, 0, span));
        return { input: fmtIntArr(cards), expectedOutput: String(ref(cards)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumCardPickup(cards: List[int]) -> int:\n    last = {}\n    best = -1\n    for i, v in enumerate(cards):\n        if v in last:\n            d = i - last[v] + 1\n            if best < 0 or d < best:\n                best = d\n        last[v] = i\n    return best`,
        javascript: `var minimumCardPickup = function(cards) {\n    var last = {};\n    var best = -1;\n    for (var i = 0; i < cards.length; i++) {\n        var v = cards[i];\n        if (last[v] !== undefined) {\n            var d = i - last[v] + 1;\n            if (best < 0 || d < best) best = d;\n        }\n        last[v] = i;\n    }\n    return best;\n};`,
        typescript: `function minimumCardPickup(cards: number[]): number {\n    var last: { [key: number]: number } = {};\n    var best = -1;\n    for (var i = 0; i < cards.length; i++) {\n        var v = cards[i];\n        if (last[v] !== undefined) {\n            var d = i - last[v] + 1;\n            if (best < 0 || d < best) best = d;\n        }\n        last[v] = i;\n    }\n    return best;\n}`,
        java: `public static int minimumCardPickup(int[] cards) {\n    Map<Integer, Integer> last = new HashMap<>();\n    int best = -1;\n    for (int i = 0; i < cards.length; i++) {\n        Integer prev = last.get(cards[i]);\n        if (prev != null) {\n            int d = i - prev + 1;\n            if (best < 0 || d < best) best = d;\n        }\n        last.put(cards[i], i);\n    }\n    return best;\n}`,
        cpp: `int minimumCardPickup(vector<int>& cards) {\n    unordered_map<int, int> last;\n    int best = -1;\n    for (int i = 0; i < (int) cards.size(); i++) {\n        auto it = last.find(cards[i]);\n        if (it != last.end()) {\n            int d = i - it->second + 1;\n            if (best < 0 || d < best) best = d;\n        }\n        last[cards[i]] = i;\n    }\n    return best;\n}`,
        c: `int minimumCardPickup(int* cards, int cardsSize) {\n    int* last = (int*) malloc(1000001 * sizeof(int));\n    for (int i = 0; i <= 1000000; i++) last[i] = -1;\n    int best = -1;\n    for (int i = 0; i < cardsSize; i++) {\n        int v = cards[i];\n        if (last[v] >= 0) {\n            int d = i - last[v] + 1;\n            if (best < 0 || d < best) best = d;\n        }\n        last[v] = i;\n    }\n    free(last);\n    return best;\n}`,
        csharp: `public static int MinimumCardPickup(int[] cards)\n{\n    var last = new Dictionary<int, int>();\n    int best = -1;\n    for (int i = 0; i < cards.Length; i++)\n    {\n        int prev;\n        if (last.TryGetValue(cards[i], out prev))\n        {\n            int d = i - prev + 1;\n            if (best < 0 || d < best) best = d;\n        }\n        last[cards[i]] = i;\n    }\n    return best;\n}`,
        go: `func minimumCardPickup(cards []int) int {\n\tlast := map[int]int{}\n\tbest := -1\n\tfor i, v := range cards {\n\t\tif prev, ok := last[v]; ok {\n\t\t\td := i - prev + 1\n\t\t\tif best < 0 || d < best {\n\t\t\t\tbest = d\n\t\t\t}\n\t\t}\n\t\tlast[v] = i\n\t}\n\treturn best\n}`,
        kotlin: `fun minimumCardPickup(cards: IntArray): Int {\n    val last = HashMap<Int, Int>()\n    var best = -1\n    for (i in cards.indices) {\n        val prev = last[cards[i]]\n        if (prev != null) {\n            val d = i - prev + 1\n            if (best < 0 || d < best) best = d\n        }\n        last[cards[i]] = i\n    }\n    return best\n}`,
        swift: `func minimumCardPickup(_ cards: [Int]) -> Int {\n    var last = [Int: Int]()\n    var best = -1\n    for i in 0..<cards.count {\n        if let prev = last[cards[i]] {\n            let d = i - prev + 1\n            if best < 0 || d < best { best = d }\n        }\n        last[cards[i]] = i\n    }\n    return best\n}`,
        rust: `fn minimumCardPickup(cards: Vec<i32>) -> i32 {\n    let mut last: std::collections::HashMap<i32, usize> = std::collections::HashMap::new();\n    let mut best: i32 = -1;\n    for i in 0..cards.len() {\n        if let Some(&prev) = last.get(&cards[i]) {\n            let d = (i + 1 - prev) as i32;\n            if best < 0 || d < best {\n                best = d;\n            }\n        }\n        last.insert(cards[i], i);\n    }\n    best\n}`,
        php: `function minimumCardPickup($cards) {\n    $last = [];\n    $best = -1;\n    for ($i = 0; $i < count($cards); $i++) {\n        $v = $cards[$i];\n        if (isset($last[$v])) {\n            $d = $i - $last[$v] + 1;\n            if ($best < 0 || $d < $best) $best = $d;\n        }\n        $last[$v] = $i;\n    }\n    return $best;\n}`,
        ruby: `def minimumCardPickup(cards)\n  last = {}\n  best = -1\n  cards.each_with_index do |v, i|\n    if last.key?(v)\n      d = i - last[v] + 1\n      best = d if best < 0 || d < best\n    end\n    last[v] = i\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Count Subarrays With Fixed Bounds (LC 2444) ─────────────────
  (() => {
    const ref = (nums: number[], minK: number, maxK: number) => {
      let res = 0, lastMin = -1, lastMax = -1, lastBad = -1;
      for (let i = 0; i < nums.length; i++) {
        const x = nums[i];
        if (x < minK || x > maxK) lastBad = i;
        if (x === minK) lastMin = i;
        if (x === maxK) lastMax = i;
        const lo = Math.min(lastMin, lastMax);
        if (lo > lastBad) res += lo - lastBad;
      }
      return res;
    };
    return {
      slug: "count-subarrays-with-fixed-bounds",
      title: "Count Subarrays With Fixed Bounds",
      difficulty: "HARD" as const,
      tags: ["Array", "Sliding Window", "Two Pointers", "Queue", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "countSubarraysFixedBounds", params: [{ name: "nums", type: "int[]" as const }, { name: "minK", type: "int" as const }, { name: "maxK", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A subarray is **fixed-bound** when its minimum is exactly `minK` and its maximum is exactly `maxK`.\n\nReturn the number of fixed-bound subarrays of `nums`.",
        [
          { in: "nums = [1,3,5,2,7,5], minK = 1, maxK = 5", out: "2", note: "[1,3,5] and [1,3,5,2]." },
          { in: "nums = [1,1,1,1], minK = 1, maxK = 1", out: "10", note: "Every subarray qualifies." },
          { in: "nums = [1,3,5,2,7,5], minK = 1, maxK = 9", out: "0", note: "No element equals 9." },
        ],
        ["2 <= nums.length <= 50000", "1 <= nums[i], minK, maxK <= 1000000"]),
      hints: [
        "A valid subarray must contain at least one `minK`, at least one `maxK`, and nothing outside `[minK, maxK]`.",
        "Fix the right end and track three positions: the last `minK`, the last `maxK`, and the last out-of-range element.",
        "The valid left ends sit strictly after the out-of-range element and at or before both of the other two.",
      ],
      editorial: explain({
        idea: "For each right end, the set of valid left ends is an interval determined by three running positions. Counting its size at every step totals every valid subarray in one pass.",
        steps: [
          "Track `lastBad` (the most recent element outside `[minK, maxK]`), `lastMin` and `lastMax`.",
          "At index `i`, update whichever of the three applies.",
          "The valid starts are `lastBad + 1 … min(lastMin, lastMax)`; add `min(lastMin, lastMax) - lastBad` when positive.",
        ],
        why: "A subarray `[l, i]` is fixed-bound exactly when it avoids every out-of-range element (`l > lastBad`) and still reaches back to an occurrence of each bound (`l <= lastMin` and `l <= lastMax`). Those constraints define a contiguous range of `l`, whose size is the expression above — and it is 0 or negative precisely when no valid start exists.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Using `>=` instead of `>` against `lastBad` admits the out-of-range element itself.",
          "`minK` may equal `maxK`, in which case both positions track the same index.",
          "The count reaches about `1.25 · 10^9` at the stated size — accumulate carefully.",
        ],
      }),
      examples: [
        { input: "[1,3,5,2,7,5]\n1\n5", expectedOutput: "2" },
        { input: "[1,1,1,1]\n1\n1", expectedOutput: "10" },
        { input: "[1,3,5,2,7,5]\n1\n9", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.7 ? 8 : 1000000;
        const nums = Array.from({ length: ri(rng, 2, 45) }, () => ri(rng, 1, hi));
        const a = ri(rng, 1, hi);
        const b = ri(rng, 1, hi);
        const minK = Math.min(a, b);
        const maxK = Math.max(a, b);
        return { input: `${fmtIntArr(nums)}\n${minK}\n${maxK}`, expectedOutput: String(ref(nums, minK, maxK)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countSubarraysFixedBounds(nums: List[int], minK: int, maxK: int) -> int:\n    res = 0\n    last_min = last_max = last_bad = -1\n    for i, x in enumerate(nums):\n        if x < minK or x > maxK:\n            last_bad = i\n        if x == minK:\n            last_min = i\n        if x == maxK:\n            last_max = i\n        lo = min(last_min, last_max)\n        if lo > last_bad:\n            res += lo - last_bad\n    return res`,
        javascript: `var countSubarraysFixedBounds = function(nums, minK, maxK) {\n    var res = 0, lastMin = -1, lastMax = -1, lastBad = -1;\n    for (var i = 0; i < nums.length; i++) {\n        var x = nums[i];\n        if (x < minK || x > maxK) lastBad = i;\n        if (x === minK) lastMin = i;\n        if (x === maxK) lastMax = i;\n        var lo = Math.min(lastMin, lastMax);\n        if (lo > lastBad) res += lo - lastBad;\n    }\n    return res;\n};`,
        typescript: `function countSubarraysFixedBounds(nums: number[], minK: number, maxK: number): number {\n    var res = 0, lastMin = -1, lastMax = -1, lastBad = -1;\n    for (var i = 0; i < nums.length; i++) {\n        var x = nums[i];\n        if (x < minK || x > maxK) lastBad = i;\n        if (x === minK) lastMin = i;\n        if (x === maxK) lastMax = i;\n        var lo = Math.min(lastMin, lastMax);\n        if (lo > lastBad) res += lo - lastBad;\n    }\n    return res;\n}`,
        java: `public static int countSubarraysFixedBounds(int[] nums, int minK, int maxK) {\n    long res = 0;\n    int lastMin = -1, lastMax = -1, lastBad = -1;\n    for (int i = 0; i < nums.length; i++) {\n        int x = nums[i];\n        if (x < minK || x > maxK) lastBad = i;\n        if (x == minK) lastMin = i;\n        if (x == maxK) lastMax = i;\n        int lo = Math.min(lastMin, lastMax);\n        if (lo > lastBad) res += lo - lastBad;\n    }\n    return (int) res;\n}`,
        cpp: `int countSubarraysFixedBounds(vector<int>& nums, int minK, int maxK) {\n    long long res = 0;\n    int lastMin = -1, lastMax = -1, lastBad = -1;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        int x = nums[i];\n        if (x < minK || x > maxK) lastBad = i;\n        if (x == minK) lastMin = i;\n        if (x == maxK) lastMax = i;\n        int lo = min(lastMin, lastMax);\n        if (lo > lastBad) res += lo - lastBad;\n    }\n    return (int) res;\n}`,
        c: `int countSubarraysFixedBounds(int* nums, int numsSize, int minK, int maxK) {\n    long long res = 0;\n    int lastMin = -1, lastMax = -1, lastBad = -1;\n    for (int i = 0; i < numsSize; i++) {\n        int x = nums[i];\n        if (x < minK || x > maxK) lastBad = i;\n        if (x == minK) lastMin = i;\n        if (x == maxK) lastMax = i;\n        int lo = lastMin < lastMax ? lastMin : lastMax;\n        if (lo > lastBad) res += lo - lastBad;\n    }\n    return (int) res;\n}`,
        csharp: `public static int CountSubarraysFixedBounds(int[] nums, int minK, int maxK)\n{\n    long res = 0;\n    int lastMin = -1, lastMax = -1, lastBad = -1;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        int x = nums[i];\n        if (x < minK || x > maxK) lastBad = i;\n        if (x == minK) lastMin = i;\n        if (x == maxK) lastMax = i;\n        int lo = Math.Min(lastMin, lastMax);\n        if (lo > lastBad) res += lo - lastBad;\n    }\n    return (int) res;\n}`,
        go: `func countSubarraysFixedBounds(nums []int, minK int, maxK int) int {\n\tvar res int64 = 0\n\tlastMin, lastMax, lastBad := -1, -1, -1\n\tfor i, x := range nums {\n\t\tif x < minK || x > maxK {\n\t\t\tlastBad = i\n\t\t}\n\t\tif x == minK {\n\t\t\tlastMin = i\n\t\t}\n\t\tif x == maxK {\n\t\t\tlastMax = i\n\t\t}\n\t\tlo := lastMin\n\t\tif lastMax < lo {\n\t\t\tlo = lastMax\n\t\t}\n\t\tif lo > lastBad {\n\t\t\tres += int64(lo - lastBad)\n\t\t}\n\t}\n\treturn int(res)\n}`,
        kotlin: `fun countSubarraysFixedBounds(nums: IntArray, minK: Int, maxK: Int): Int {\n    var res = 0L\n    var lastMin = -1\n    var lastMax = -1\n    var lastBad = -1\n    for (i in nums.indices) {\n        val x = nums[i]\n        if (x < minK || x > maxK) lastBad = i\n        if (x == minK) lastMin = i\n        if (x == maxK) lastMax = i\n        val lo = minOf(lastMin, lastMax)\n        if (lo > lastBad) res += (lo - lastBad).toLong()\n    }\n    return res.toInt()\n}`,
        swift: `func countSubarraysFixedBounds(_ nums: [Int], _ minK: Int, _ maxK: Int) -> Int {\n    var res = 0\n    var lastMin = -1\n    var lastMax = -1\n    var lastBad = -1\n    for i in 0..<nums.count {\n        let x = nums[i]\n        if x < minK || x > maxK { lastBad = i }\n        if x == minK { lastMin = i }\n        if x == maxK { lastMax = i }\n        let lo = min(lastMin, lastMax)\n        if lo > lastBad { res += lo - lastBad }\n    }\n    return res\n}`,
        rust: `fn countSubarraysFixedBounds(nums: Vec<i32>, minK: i32, maxK: i32) -> i32 {\n    let mut res: i64 = 0;\n    let mut last_min: i64 = -1;\n    let mut last_max: i64 = -1;\n    let mut last_bad: i64 = -1;\n    for i in 0..nums.len() {\n        let x = nums[i];\n        let idx = i as i64;\n        if x < minK || x > maxK {\n            last_bad = idx;\n        }\n        if x == minK {\n            last_min = idx;\n        }\n        if x == maxK {\n            last_max = idx;\n        }\n        let lo = last_min.min(last_max);\n        if lo > last_bad {\n            res += lo - last_bad;\n        }\n    }\n    res as i32\n}`,
        php: `function countSubarraysFixedBounds($nums, $minK, $maxK) {\n    $res = 0;\n    $lastMin = -1;\n    $lastMax = -1;\n    $lastBad = -1;\n    for ($i = 0; $i < count($nums); $i++) {\n        $x = $nums[$i];\n        if ($x < $minK || $x > $maxK) $lastBad = $i;\n        if ($x === $minK) $lastMin = $i;\n        if ($x === $maxK) $lastMax = $i;\n        $lo = min($lastMin, $lastMax);\n        if ($lo > $lastBad) $res += $lo - $lastBad;\n    }\n    return $res;\n}`,
        ruby: `def countSubarraysFixedBounds(nums, minK, maxK)\n  res = 0\n  last_min = -1\n  last_max = -1\n  last_bad = -1\n  nums.each_with_index do |x, i|\n    last_bad = i if x < minK || x > maxK\n    last_min = i if x == minK\n    last_max = i if x == maxK\n    lo = [last_min, last_max].min\n    res += lo - last_bad if lo > last_bad\n  end\n  res\nend`,
      },
    };
  })(),

  // ── Shortest Subarray with Sum at Least K (LC 862) ──────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      const pre = new Array(n + 1).fill(0);
      for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
      const dq: number[] = [];
      let best = n + 1;
      for (let i = 0; i <= n; i++) {
        while (dq.length > 0 && pre[i] - pre[dq[0]] >= k) {
          const len = i - (dq.shift() as number);
          if (len < best) best = len;
        }
        while (dq.length > 0 && pre[dq[dq.length - 1]] >= pre[i]) dq.pop();
        dq.push(i);
      }
      return best <= n ? best : -1;
    };
    return {
      slug: "shortest-subarray-with-sum-at-least-k",
      title: "Shortest Subarray with Sum at Least K",
      difficulty: "HARD" as const,
      tags: ["Array", "Prefix Sum", "Sliding Window", "Monotonic Queue", "Binary Search", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "shortestSubarray", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Return the length of the **shortest** non-empty subarray of `nums` whose sum is at least `k`, or `0` if there is none.\n\n(Negative values are allowed, which is what makes this harder than the all-positive version.)",
        [
          { in: "nums = [1], k = 1", out: "1" },
          { in: "nums = [1,2], k = 4", out: "0", note: "The whole array only sums to 3." },
          { in: "nums = [2,-1,2], k = 3", out: "3", note: "The -1 forces the window to span everything." },
        ],
        ["1 <= nums.length <= 100000", "-100000 <= nums[i] <= 100000", "1 <= k <= 1000000000"]),
      hints: [
        "With negative values a plain two-pointer window fails — extending a window can *lower* its sum.",
        "Work with prefix sums: you need indices `i < j` with `pre[j] - pre[i] >= k` and `j - i` minimal.",
        "Keep the candidate `i` values in a deque that stays strictly increasing in prefix sum.",
      ],
      editorial: explain({
        idea: "Reduce to prefix sums and keep a monotonic deque of candidate left endpoints. Two rules prune it: a candidate already satisfied can be retired (nothing later will beat it), and a candidate with a prefix sum at least as large as a newer one is useless.",
        steps: [
          "Build `pre[0…n]` with `pre[i+1] = pre[i] + nums[i]`.",
          "For each `i`, while `pre[i] - pre[dq.front()] >= k`, record `i - dq.front()` and pop the front.",
          "While `pre[dq.back()] >= pre[i]`, pop the back — a later index with a smaller prefix sum dominates.",
          "Push `i`. Return the best length, or `0` if none was found.",
        ],
        why: "Popping the front is safe because any later right end paired with that index gives a longer subarray, and it is already satisfied. Popping the back is safe because a smaller prefix sum at a larger index is better on both counts: it yields a bigger difference and a shorter span. The deque therefore stays increasing in prefix sum, and each index is pushed and popped once.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "A sliding window without the deque is wrong here — negative numbers break the monotonicity.",
          "Prefix sums reach `10^5 · 10^5 = 10^10`, so they need 64-bit.",
          "The answer for 'no such subarray' is `0`, not `-1`.",
        ],
      }),
      examples: [
        { input: "[1]\n1", expectedOutput: "1" },
        { input: "[1,2]\n4", expectedOutput: "0" },
        { input: "[2,-1,2]\n3", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 10 : 100000;
        const nums = Array.from({ length: ri(rng, 1, 45) }, () => ri(rng, -hi, hi));
        const k = rng() < 0.6 ? ri(rng, 1, hi * 3) : ri(rng, 1, 1000000000);
        const answer = ref(nums, k);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(answer < 0 ? 0 : answer) };
      },
      solutions: {
        python: `from collections import deque\nfrom typing import List\n\ndef shortestSubarray(nums: List[int], k: int) -> int:\n    n = len(nums)\n    pre = [0] * (n + 1)\n    for i in range(n):\n        pre[i + 1] = pre[i] + nums[i]\n    dq = deque()\n    best = n + 1\n    for i in range(n + 1):\n        while dq and pre[i] - pre[dq[0]] >= k:\n            best = min(best, i - dq.popleft())\n        while dq and pre[dq[-1]] >= pre[i]:\n            dq.pop()\n        dq.append(i)\n    return best if best <= n else 0`,
        javascript: `var shortestSubarray = function(nums, k) {\n    var n = nums.length;\n    var pre = [0];\n    for (var i = 0; i < n; i++) pre.push(pre[i] + nums[i]);\n    var dq = [];\n    var head = 0;\n    var best = n + 1;\n    for (var j = 0; j <= n; j++) {\n        while (dq.length > head && pre[j] - pre[dq[head]] >= k) {\n            var len = j - dq[head];\n            head++;\n            if (len < best) best = len;\n        }\n        while (dq.length > head && pre[dq[dq.length - 1]] >= pre[j]) dq.pop();\n        dq.push(j);\n    }\n    return best <= n ? best : 0;\n};`,
        typescript: `function shortestSubarray(nums: number[], k: number): number {\n    var n = nums.length;\n    var pre: number[] = [0];\n    for (var i = 0; i < n; i++) pre.push(pre[i] + nums[i]);\n    var dq: number[] = [];\n    var head = 0;\n    var best = n + 1;\n    for (var j = 0; j <= n; j++) {\n        while (dq.length > head && pre[j] - pre[dq[head]] >= k) {\n            var len = j - dq[head];\n            head++;\n            if (len < best) best = len;\n        }\n        while (dq.length > head && pre[dq[dq.length - 1]] >= pre[j]) dq.pop();\n        dq.push(j);\n    }\n    return best <= n ? best : 0;\n}`,
        java: `public static int shortestSubarray(int[] nums, int k) {\n    int n = nums.length;\n    long[] pre = new long[n + 1];\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];\n    int[] dq = new int[n + 1];\n    int head = 0, tail = 0, best = n + 1;\n    for (int i = 0; i <= n; i++) {\n        while (tail > head && pre[i] - pre[dq[head]] >= k) {\n            best = Math.min(best, i - dq[head]);\n            head++;\n        }\n        while (tail > head && pre[dq[tail - 1]] >= pre[i]) tail--;\n        dq[tail++] = i;\n    }\n    return best <= n ? best : 0;\n}`,
        cpp: `int shortestSubarray(vector<int>& nums, int k) {\n    int n = (int) nums.size();\n    vector<long long> pre(n + 1, 0);\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];\n    deque<int> dq;\n    int best = n + 1;\n    for (int i = 0; i <= n; i++) {\n        while (!dq.empty() && pre[i] - pre[dq.front()] >= k) {\n            best = min(best, i - dq.front());\n            dq.pop_front();\n        }\n        while (!dq.empty() && pre[dq.back()] >= pre[i]) dq.pop_back();\n        dq.push_back(i);\n    }\n    return best <= n ? best : 0;\n}`,
        c: `int shortestSubarray(int* nums, int numsSize, int k) {\n    int n = numsSize;\n    long long* pre = (long long*) malloc((size_t) (n + 1) * sizeof(long long));\n    pre[0] = 0;\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];\n    int* dq = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    int head = 0, tail = 0, best = n + 1;\n    for (int i = 0; i <= n; i++) {\n        while (tail > head && pre[i] - pre[dq[head]] >= (long long) k) {\n            int len = i - dq[head];\n            head++;\n            if (len < best) best = len;\n        }\n        while (tail > head && pre[dq[tail - 1]] >= pre[i]) tail--;\n        dq[tail++] = i;\n    }\n    free(pre);\n    free(dq);\n    return best <= n ? best : 0;\n}`,
        csharp: `public static int ShortestSubarray(int[] nums, int k)\n{\n    int n = nums.Length;\n    long[] pre = new long[n + 1];\n    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];\n    int[] dq = new int[n + 1];\n    int head = 0, tail = 0, best = n + 1;\n    for (int i = 0; i <= n; i++)\n    {\n        while (tail > head && pre[i] - pre[dq[head]] >= k)\n        {\n            if (i - dq[head] < best) best = i - dq[head];\n            head++;\n        }\n        while (tail > head && pre[dq[tail - 1]] >= pre[i]) tail--;\n        dq[tail++] = i;\n    }\n    return best <= n ? best : 0;\n}`,
        go: `func shortestSubarray(nums []int, k int) int {\n\tn := len(nums)\n\tpre := make([]int64, n+1)\n\tfor i := 0; i < n; i++ {\n\t\tpre[i+1] = pre[i] + int64(nums[i])\n\t}\n\tdq := make([]int, 0, n+1)\n\tbest := n + 1\n\tfor i := 0; i <= n; i++ {\n\t\tfor len(dq) > 0 && pre[i]-pre[dq[0]] >= int64(k) {\n\t\t\tif i-dq[0] < best {\n\t\t\t\tbest = i - dq[0]\n\t\t\t}\n\t\t\tdq = dq[1:]\n\t\t}\n\t\tfor len(dq) > 0 && pre[dq[len(dq)-1]] >= pre[i] {\n\t\t\tdq = dq[:len(dq)-1]\n\t\t}\n\t\tdq = append(dq, i)\n\t}\n\tif best <= n {\n\t\treturn best\n\t}\n\treturn 0\n}`,
        kotlin: `fun shortestSubarray(nums: IntArray, k: Int): Int {\n    val n = nums.size\n    val pre = LongArray(n + 1)\n    for (i in 0 until n) pre[i + 1] = pre[i] + nums[i]\n    val dq = IntArray(n + 1)\n    var head = 0\n    var tail = 0\n    var best = n + 1\n    for (i in 0..n) {\n        while (tail > head && pre[i] - pre[dq[head]] >= k) {\n            if (i - dq[head] < best) best = i - dq[head]\n            head++\n        }\n        while (tail > head && pre[dq[tail - 1]] >= pre[i]) tail--\n        dq[tail++] = i\n    }\n    return if (best <= n) best else 0\n}`,
        swift: `func shortestSubarray(_ nums: [Int], _ k: Int) -> Int {\n    let n = nums.count\n    var pre = [Int](repeating: 0, count: n + 1)\n    for i in 0..<n { pre[i + 1] = pre[i] + nums[i] }\n    var dq = [Int]()\n    var head = 0\n    var best = n + 1\n    for i in 0...n {\n        while dq.count > head && pre[i] - pre[dq[head]] >= k {\n            if i - dq[head] < best { best = i - dq[head] }\n            head += 1\n        }\n        while dq.count > head && pre[dq[dq.count - 1]] >= pre[i] { dq.removeLast() }\n        dq.append(i)\n    }\n    return best <= n ? best : 0\n}`,
        rust: `fn shortestSubarray(nums: Vec<i32>, k: i32) -> i32 {\n    let n = nums.len();\n    let mut pre = vec![0i64; n + 1];\n    for i in 0..n {\n        pre[i + 1] = pre[i] + nums[i] as i64;\n    }\n    let mut dq: std::collections::VecDeque<usize> = std::collections::VecDeque::new();\n    let mut best = n + 1;\n    for i in 0..=n {\n        while let Some(&front) = dq.front() {\n            if pre[i] - pre[front] >= k as i64 {\n                if i - front < best {\n                    best = i - front;\n                }\n                dq.pop_front();\n            } else {\n                break;\n            }\n        }\n        while let Some(&back) = dq.back() {\n            if pre[back] >= pre[i] {\n                dq.pop_back();\n            } else {\n                break;\n            }\n        }\n        dq.push_back(i);\n    }\n    if best <= n {\n        best as i32\n    } else {\n        0\n    }\n}`,
        php: `function shortestSubarray($nums, $k) {\n    $n = count($nums);\n    $pre = [0];\n    for ($i = 0; $i < $n; $i++) $pre[] = $pre[$i] + $nums[$i];\n    $dq = [];\n    $head = 0;\n    $best = $n + 1;\n    for ($i = 0; $i <= $n; $i++) {\n        while (count($dq) > $head && $pre[$i] - $pre[$dq[$head]] >= $k) {\n            $len = $i - $dq[$head];\n            $head++;\n            if ($len < $best) $best = $len;\n        }\n        while (count($dq) > $head && $pre[$dq[count($dq) - 1]] >= $pre[$i]) array_pop($dq);\n        $dq[] = $i;\n    }\n    return $best <= $n ? $best : 0;\n}`,
        ruby: `def shortestSubarray(nums, k)\n  n = nums.length\n  pre = Array.new(n + 1, 0)\n  (0...n).each { |i| pre[i + 1] = pre[i] + nums[i] }\n  dq = []\n  head = 0\n  best = n + 1\n  (0..n).each do |i|\n    while dq.length > head && pre[i] - pre[dq[head]] >= k\n      len = i - dq[head]\n      head += 1\n      best = len if len < best\n    end\n    dq.pop while dq.length > head && pre[dq[-1]] >= pre[i]\n    dq << i\n  end\n  best <= n ? best : 0\nend`,
      },
    };
  })(),

  // ── Minimum Number of K Consecutive Bit Flips (LC 995) ──────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      const diff = new Array(n + 1).fill(0);
      let flips = 0, cur = 0;
      for (let i = 0; i < n; i++) {
        cur += diff[i];
        if ((nums[i] + cur) % 2 === 0) {
          if (i + k > n) return -1;
          flips++;
          cur++;
          diff[i + k]--;
        }
      }
      return flips;
    };
    return {
      slug: "minimum-number-of-k-consecutive-bit-flips",
      title: "Minimum Number of K Consecutive Bit Flips",
      difficulty: "HARD" as const,
      tags: ["Array", "Sliding Window", "Prefix Sum", "Greedy", "Bit Manipulation", "Amazon", "Google", "Uber"],
      signature: { funcName: "minKBitFlips", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "One **k-bit flip** picks a subarray of exactly `k` consecutive elements of the binary array `nums` and flips every bit in it.\n\nReturn the minimum number of k-bit flips needed to make every element `1`, or `-1` if it is impossible.",
        [
          { in: "nums = [0,1,0], k = 1", out: "2", note: "Flip index 0, then index 2." },
          { in: "nums = [1,1,0], k = 2", out: "-1", note: "Any flip covering the 0 would also break a 1." },
          { in: "nums = [0,0,0,1,0,1,1,0], k = 3", out: "3" },
        ],
        ["1 <= nums.length <= 100000", "1 <= k <= nums.length", "nums[i] is 0 or 1"]),
      hints: [
        "Scan left to right: the leftmost `0` can only be fixed by the flip that starts at it.",
        "That makes the greedy forced — no choice is ever available.",
        "Track how many flips still cover the current index with a difference array, so you know its effective value in constant time.",
      ],
      editorial: explain({
        idea: "The decision at each index is forced: if the element is currently `0`, the only flip that can fix it without disturbing anything to its left is the one starting exactly there. Track the parity of active flips with a difference array so the effective value is known in constant time.",
        steps: [
          "Keep `cur`, the number of flips currently covering index `i`, updated by a difference array `diff`.",
          "The effective value at `i` is `(nums[i] + cur) % 2`.",
          "If it is `0`, start a flip at `i`: increment the answer and `cur`, and schedule `diff[i + k]--` so the flip expires.",
          "If a flip would run past the end (`i + k > n`), the task is impossible.",
        ],
        why: "Flips are commutative and each position's final value depends only on the parity of flips covering it, so processing left to right loses nothing. At index `i`, every flip starting before `i` has already been decided, and a flip starting after `i` cannot cover `i` — so the flip at `i` is the only remaining lever, making the greedy choice forced and therefore optimal.",
        time: "O(n)",
        space: "O(n), or O(1) with a queue of expiry positions",
        pitfalls: [
          "Actually flipping the `k` elements each time is `O(n · k)` and times out.",
          "Forgetting to expire a flip at `i + k` leaves `cur` permanently wrong.",
          "The impossibility check must happen before scheduling, or the difference array is indexed out of range.",
        ],
      }),
      examples: [
        { input: "[0,1,0]\n1", expectedOutput: "2" },
        { input: "[1,1,0]\n2", expectedOutput: "-1" },
        { input: "[0,0,0,1,0,1,1,0]\n3", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 45);
        const nums = Array.from({ length: n }, () => (rng() < 0.5 ? 1 : 0));
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minKBitFlips(nums: List[int], k: int) -> int:\n    n = len(nums)\n    diff = [0] * (n + 1)\n    flips = 0\n    cur = 0\n    for i in range(n):\n        cur += diff[i]\n        if (nums[i] + cur) % 2 == 0:\n            if i + k > n:\n                return -1\n            flips += 1\n            cur += 1\n            diff[i + k] -= 1\n    return flips`,
        javascript: `var minKBitFlips = function(nums, k) {\n    var n = nums.length;\n    var diff = [];\n    for (var t = 0; t <= n; t++) diff.push(0);\n    var flips = 0, cur = 0;\n    for (var i = 0; i < n; i++) {\n        cur += diff[i];\n        if ((nums[i] + cur) % 2 === 0) {\n            if (i + k > n) return -1;\n            flips++;\n            cur++;\n            diff[i + k]--;\n        }\n    }\n    return flips;\n};`,
        typescript: `function minKBitFlips(nums: number[], k: number): number {\n    var n = nums.length;\n    var diff: number[] = [];\n    for (var t = 0; t <= n; t++) diff.push(0);\n    var flips = 0, cur = 0;\n    for (var i = 0; i < n; i++) {\n        cur += diff[i];\n        if ((nums[i] + cur) % 2 === 0) {\n            if (i + k > n) return -1;\n            flips++;\n            cur++;\n            diff[i + k]--;\n        }\n    }\n    return flips;\n}`,
        java: `public static int minKBitFlips(int[] nums, int k) {\n    int n = nums.length;\n    int[] diff = new int[n + 1];\n    int flips = 0, cur = 0;\n    for (int i = 0; i < n; i++) {\n        cur += diff[i];\n        if ((nums[i] + cur) % 2 == 0) {\n            if (i + k > n) return -1;\n            flips++;\n            cur++;\n            diff[i + k]--;\n        }\n    }\n    return flips;\n}`,
        cpp: `int minKBitFlips(vector<int>& nums, int k) {\n    int n = (int) nums.size();\n    vector<int> diff(n + 1, 0);\n    int flips = 0, cur = 0;\n    for (int i = 0; i < n; i++) {\n        cur += diff[i];\n        if ((nums[i] + cur) % 2 == 0) {\n            if (i + k > n) return -1;\n            flips++;\n            cur++;\n            diff[i + k]--;\n        }\n    }\n    return flips;\n}`,
        c: `int minKBitFlips(int* nums, int numsSize, int k) {\n    int n = numsSize;\n    int* diff = (int*) calloc((size_t) n + 1, sizeof(int));\n    int flips = 0, cur = 0;\n    for (int i = 0; i < n; i++) {\n        cur += diff[i];\n        if ((nums[i] + cur) % 2 == 0) {\n            if (i + k > n) {\n                free(diff);\n                return -1;\n            }\n            flips++;\n            cur++;\n            diff[i + k]--;\n        }\n    }\n    free(diff);\n    return flips;\n}`,
        csharp: `public static int MinKBitFlips(int[] nums, int k)\n{\n    int n = nums.Length;\n    int[] diff = new int[n + 1];\n    int flips = 0, cur = 0;\n    for (int i = 0; i < n; i++)\n    {\n        cur += diff[i];\n        if ((nums[i] + cur) % 2 == 0)\n        {\n            if (i + k > n) return -1;\n            flips++;\n            cur++;\n            diff[i + k]--;\n        }\n    }\n    return flips;\n}`,
        go: `func minKBitFlips(nums []int, k int) int {\n\tn := len(nums)\n\tdiff := make([]int, n+1)\n\tflips, cur := 0, 0\n\tfor i := 0; i < n; i++ {\n\t\tcur += diff[i]\n\t\tif (nums[i]+cur)%2 == 0 {\n\t\t\tif i+k > n {\n\t\t\t\treturn -1\n\t\t\t}\n\t\t\tflips++\n\t\t\tcur++\n\t\t\tdiff[i+k]--\n\t\t}\n\t}\n\treturn flips\n}`,
        kotlin: `fun minKBitFlips(nums: IntArray, k: Int): Int {\n    val n = nums.size\n    val diff = IntArray(n + 1)\n    var flips = 0\n    var cur = 0\n    for (i in 0 until n) {\n        cur += diff[i]\n        if ((nums[i] + cur) % 2 == 0) {\n            if (i + k > n) return -1\n            flips++\n            cur++\n            diff[i + k]--\n        }\n    }\n    return flips\n}`,
        swift: `func minKBitFlips(_ nums: [Int], _ k: Int) -> Int {\n    let n = nums.count\n    var diff = [Int](repeating: 0, count: n + 1)\n    var flips = 0\n    var cur = 0\n    for i in 0..<n {\n        cur += diff[i]\n        if (nums[i] + cur) % 2 == 0 {\n            if i + k > n { return -1 }\n            flips += 1\n            cur += 1\n            diff[i + k] -= 1\n        }\n    }\n    return flips\n}`,
        rust: `fn minKBitFlips(nums: Vec<i32>, k: i32) -> i32 {\n    let n = nums.len();\n    let k = k as usize;\n    let mut diff = vec![0i32; n + 1];\n    let mut flips = 0i32;\n    let mut cur = 0i32;\n    for i in 0..n {\n        cur += diff[i];\n        if (nums[i] + cur) % 2 == 0 {\n            if i + k > n {\n                return -1;\n            }\n            flips += 1;\n            cur += 1;\n            diff[i + k] -= 1;\n        }\n    }\n    flips\n}`,
        php: `function minKBitFlips($nums, $k) {\n    $n = count($nums);\n    $diff = array_fill(0, $n + 1, 0);\n    $flips = 0;\n    $cur = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $cur += $diff[$i];\n        if (($nums[$i] + $cur) % 2 === 0) {\n            if ($i + $k > $n) return -1;\n            $flips++;\n            $cur++;\n            $diff[$i + $k]--;\n        }\n    }\n    return $flips;\n}`,
        ruby: `def minKBitFlips(nums, k)\n  n = nums.length\n  diff = Array.new(n + 1, 0)\n  flips = 0\n  cur = 0\n  (0...n).each do |i|\n    cur += diff[i]\n    if (nums[i] + cur) % 2 == 0\n      return -1 if i + k > n\n      flips += 1\n      cur += 1\n      diff[i + k] -= 1\n    end\n  end\n  flips\nend`,
      },
    };
  })(),

  // ── Take K of Each Character From Left and Right (LC 2516) ──────
  (() => {
    const ref = (s: string, k: number) => {
      const n = s.length;
      const total: Record<string, number> = { a: 0, b: 0, c: 0 };
      for (let i = 0; i < n; i++) total[s[i]]++;
      if (total["a"] < k || total["b"] < k || total["c"] < k) return -1;
      const cnt: Record<string, number> = { a: 0, b: 0, c: 0 };
      let l = 0, longest = 0;
      for (let r = 0; r < n; r++) {
        cnt[s[r]]++;
        while (total["a"] - cnt["a"] < k || total["b"] - cnt["b"] < k || total["c"] - cnt["c"] < k) {
          cnt[s[l]]--;
          l++;
        }
        if (r - l + 1 > longest) longest = r - l + 1;
      }
      return n - longest;
    };
    return {
      slug: "take-k-of-each-character-from-left-and-right",
      title: "Take K of Each Character From Left and Right",
      difficulty: "HARD" as const,
      tags: ["String", "Hash Table", "Sliding Window", "Prefix Sum", "Amazon", "Google", "Rubrik"],
      signature: { funcName: "takeCharacters", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`s` contains only `'a'`, `'b'` and `'c'`. In one minute you may take **one** character from either the leftmost or the rightmost end of `s` and remove it.\n\nReturn the minimum number of minutes needed to have taken at least `k` of each of the three characters, or `-1` if it is impossible.",
        [
          { in: 's = "aabaaaacaabc", k = 2', out: "8", note: "Take four from the left and four from the right." },
          { in: 's = "a", k = 1', out: "-1", note: "There are no b or c to take." },
          { in: 's = "abc", k = 0', out: "0", note: "Nothing needs taking." },
        ],
        ["1 <= s.length <= 100000", "s consists only of 'a', 'b' and 'c'.", "0 <= k <= s.length"]),
      hints: [
        "What you take is a prefix and a suffix; what you leave behind is one contiguous middle block.",
        "So minimise the taking by *maximising* the middle block you can leave.",
        "A middle block is leavable when, for each character, the total outside it is at least `k`.",
      ],
      editorial: explain({
        idea: "Flip the problem around. The characters taken always form a prefix plus a suffix, so the untouched part is a single window. Maximise that window subject to every character having at least `k` copies outside it; the answer is `n` minus its length.",
        steps: [
          "Tally the whole string; if any character appears fewer than `k` times, return `-1`.",
          "Slide a window, tallying what is inside it.",
          "While some character has fewer than `k` copies outside the window, shrink from the left.",
          "Return `n - longestValidWindow`.",
        ],
        why: "Taking from the ends means the remaining string is contiguous, so the choice is exactly which window to leave. Growing the window removes characters from the outside, which can only violate the constraint, never repair it — the predicate is monotone in the left edge and a single forward-moving pointer suffices.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Trying to greedily take from whichever end is cheapest does not work — the choice interacts across the three characters.",
          "`k = 0` must return 0, which it does since the whole string is a valid window.",
          "The impossibility check has to come first, or the shrink loop empties the window and still fails.",
        ],
      }),
      examples: [
        { input: '"aabaaaacaabc"\n2', expectedOutput: "8" },
        { input: '"a"\n1', expectedOutput: "-1" },
        { input: '"abc"\n0', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const s = Array.from({ length: ri(rng, 1, 45) }, () => pick(rng, ["a", "b", "c"])).join("");
        const k = rng() < 0.7 ? ri(rng, 0, 6) : ri(rng, 0, s.length);
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: `def takeCharacters(s: str, k: int) -> int:\n    n = len(s)\n    total = {"a": 0, "b": 0, "c": 0}\n    for ch in s:\n        total[ch] += 1\n    if any(total[c] < k for c in "abc"):\n        return -1\n    cnt = {"a": 0, "b": 0, "c": 0}\n    l = 0\n    longest = 0\n    for r in range(n):\n        cnt[s[r]] += 1\n        while any(total[c] - cnt[c] < k for c in "abc"):\n            cnt[s[l]] -= 1\n            l += 1\n        longest = max(longest, r - l + 1)\n    return n - longest`,
        javascript: `var takeCharacters = function(s, k) {\n    var n = s.length;\n    var total = { a: 0, b: 0, c: 0 };\n    for (var i = 0; i < n; i++) total[s.charAt(i)]++;\n    if (total.a < k || total.b < k || total.c < k) return -1;\n    var cnt = { a: 0, b: 0, c: 0 };\n    var l = 0, longest = 0;\n    for (var r = 0; r < n; r++) {\n        cnt[s.charAt(r)]++;\n        while (total.a - cnt.a < k || total.b - cnt.b < k || total.c - cnt.c < k) {\n            cnt[s.charAt(l)]--;\n            l++;\n        }\n        if (r - l + 1 > longest) longest = r - l + 1;\n    }\n    return n - longest;\n};`,
        typescript: `function takeCharacters(s: string, k: number): number {\n    var n = s.length;\n    var total: { [key: string]: number } = { a: 0, b: 0, c: 0 };\n    for (var i = 0; i < n; i++) total[s.charAt(i)]++;\n    if (total["a"] < k || total["b"] < k || total["c"] < k) return -1;\n    var cnt: { [key: string]: number } = { a: 0, b: 0, c: 0 };\n    var l = 0, longest = 0;\n    for (var r = 0; r < n; r++) {\n        cnt[s.charAt(r)]++;\n        while (total["a"] - cnt["a"] < k || total["b"] - cnt["b"] < k || total["c"] - cnt["c"] < k) {\n            cnt[s.charAt(l)]--;\n            l++;\n        }\n        if (r - l + 1 > longest) longest = r - l + 1;\n    }\n    return n - longest;\n}`,
        java: `public static int takeCharacters(String s, int k) {\n    int n = s.length();\n    int[] total = new int[3];\n    for (int i = 0; i < n; i++) total[s.charAt(i) - 'a']++;\n    for (int c = 0; c < 3; c++) if (total[c] < k) return -1;\n    int[] cnt = new int[3];\n    int l = 0, longest = 0;\n    for (int r = 0; r < n; r++) {\n        cnt[s.charAt(r) - 'a']++;\n        while (total[0] - cnt[0] < k || total[1] - cnt[1] < k || total[2] - cnt[2] < k) {\n            cnt[s.charAt(l) - 'a']--;\n            l++;\n        }\n        longest = Math.max(longest, r - l + 1);\n    }\n    return n - longest;\n}`,
        cpp: `int takeCharacters(string s, int k) {\n    int n = (int) s.size();\n    int total[3] = { 0, 0, 0 };\n    for (int i = 0; i < n; i++) total[s[i] - 'a']++;\n    for (int c = 0; c < 3; c++) if (total[c] < k) return -1;\n    int cnt[3] = { 0, 0, 0 };\n    int l = 0, longest = 0;\n    for (int r = 0; r < n; r++) {\n        cnt[s[r] - 'a']++;\n        while (total[0] - cnt[0] < k || total[1] - cnt[1] < k || total[2] - cnt[2] < k) {\n            cnt[s[l] - 'a']--;\n            l++;\n        }\n        longest = max(longest, r - l + 1);\n    }\n    return n - longest;\n}`,
        c: `int takeCharacters(char* s, int k) {\n    int n = (int) strlen(s);\n    int total[3] = { 0, 0, 0 };\n    for (int i = 0; i < n; i++) total[s[i] - 'a']++;\n    for (int c = 0; c < 3; c++) if (total[c] < k) return -1;\n    int cnt[3] = { 0, 0, 0 };\n    int l = 0, longest = 0;\n    for (int r = 0; r < n; r++) {\n        cnt[s[r] - 'a']++;\n        while (total[0] - cnt[0] < k || total[1] - cnt[1] < k || total[2] - cnt[2] < k) {\n            cnt[s[l] - 'a']--;\n            l++;\n        }\n        if (r - l + 1 > longest) longest = r - l + 1;\n    }\n    return n - longest;\n}`,
        csharp: `public static int TakeCharacters(string s, int k)\n{\n    int n = s.Length;\n    int[] total = new int[3];\n    for (int i = 0; i < n; i++) total[s[i] - 'a']++;\n    for (int c = 0; c < 3; c++) if (total[c] < k) return -1;\n    int[] cnt = new int[3];\n    int l = 0, longest = 0;\n    for (int r = 0; r < n; r++)\n    {\n        cnt[s[r] - 'a']++;\n        while (total[0] - cnt[0] < k || total[1] - cnt[1] < k || total[2] - cnt[2] < k)\n        {\n            cnt[s[l] - 'a']--;\n            l++;\n        }\n        if (r - l + 1 > longest) longest = r - l + 1;\n    }\n    return n - longest;\n}`,
        go: `func takeCharacters(s string, k int) int {\n\tn := len(s)\n\ttotal := [3]int{}\n\tfor i := 0; i < n; i++ {\n\t\ttotal[s[i]-'a']++\n\t}\n\tfor c := 0; c < 3; c++ {\n\t\tif total[c] < k {\n\t\t\treturn -1\n\t\t}\n\t}\n\tcnt := [3]int{}\n\tl, longest := 0, 0\n\tfor r := 0; r < n; r++ {\n\t\tcnt[s[r]-'a']++\n\t\tfor total[0]-cnt[0] < k || total[1]-cnt[1] < k || total[2]-cnt[2] < k {\n\t\t\tcnt[s[l]-'a']--\n\t\t\tl++\n\t\t}\n\t\tif r-l+1 > longest {\n\t\t\tlongest = r - l + 1\n\t\t}\n\t}\n\treturn n - longest\n}`,
        kotlin: `fun takeCharacters(s: String, k: Int): Int {\n    val n = s.length\n    val total = IntArray(3)\n    for (i in 0 until n) total[s[i] - 'a']++\n    for (c in 0 until 3) if (total[c] < k) return -1\n    val cnt = IntArray(3)\n    var l = 0\n    var longest = 0\n    for (r in 0 until n) {\n        cnt[s[r] - 'a']++\n        while (total[0] - cnt[0] < k || total[1] - cnt[1] < k || total[2] - cnt[2] < k) {\n            cnt[s[l] - 'a']--\n            l++\n        }\n        if (r - l + 1 > longest) longest = r - l + 1\n    }\n    return n - longest\n}`,
        swift: `func takeCharacters(_ s: String, _ k: Int) -> Int {\n    let a = Array(s.unicodeScalars).map { Int($0.value) - 97 }\n    let n = a.count\n    var total = [Int](repeating: 0, count: 3)\n    for x in a { total[x] += 1 }\n    for c in 0..<3 where total[c] < k { return -1 }\n    var cnt = [Int](repeating: 0, count: 3)\n    var l = 0\n    var longest = 0\n    for r in 0..<n {\n        cnt[a[r]] += 1\n        while total[0] - cnt[0] < k || total[1] - cnt[1] < k || total[2] - cnt[2] < k {\n            cnt[a[l]] -= 1\n            l += 1\n        }\n        if r - l + 1 > longest { longest = r - l + 1 }\n    }\n    return n - longest\n}`,
        rust: `fn takeCharacters(s: String, k: i32) -> i32 {\n    let b = s.as_bytes();\n    let n = b.len();\n    let mut total = [0i32; 3];\n    for i in 0..n {\n        total[(b[i] - b'a') as usize] += 1;\n    }\n    for c in 0..3 {\n        if total[c] < k {\n            return -1;\n        }\n    }\n    let mut cnt = [0i32; 3];\n    let mut l = 0usize;\n    let mut longest = 0i32;\n    for r in 0..n {\n        cnt[(b[r] - b'a') as usize] += 1;\n        while total[0] - cnt[0] < k || total[1] - cnt[1] < k || total[2] - cnt[2] < k {\n            cnt[(b[l] - b'a') as usize] -= 1;\n            l += 1;\n        }\n        let len = (r + 1 - l) as i32;\n        if len > longest {\n            longest = len;\n        }\n    }\n    n as i32 - longest\n}`,
        php: `function takeCharacters($s, $k) {\n    $n = strlen($s);\n    $total = [0, 0, 0];\n    for ($i = 0; $i < $n; $i++) $total[ord($s[$i]) - 97]++;\n    for ($c = 0; $c < 3; $c++) if ($total[$c] < $k) return -1;\n    $cnt = [0, 0, 0];\n    $l = 0;\n    $longest = 0;\n    for ($r = 0; $r < $n; $r++) {\n        $cnt[ord($s[$r]) - 97]++;\n        while ($total[0] - $cnt[0] < $k || $total[1] - $cnt[1] < $k || $total[2] - $cnt[2] < $k) {\n            $cnt[ord($s[$l]) - 97]--;\n            $l++;\n        }\n        if ($r - $l + 1 > $longest) $longest = $r - $l + 1;\n    }\n    return $n - $longest;\n}`,
        ruby: `def takeCharacters(s, k)\n  n = s.length\n  total = [0, 0, 0]\n  s.each_char { |ch| total[ch.ord - 97] += 1 }\n  return -1 if total.any? { |v| v < k }\n  cnt = [0, 0, 0]\n  l = 0\n  longest = 0\n  (0...n).each do |r|\n    cnt[s[r].ord - 97] += 1\n    while total[0] - cnt[0] < k || total[1] - cnt[1] < k || total[2] - cnt[2] < k\n      cnt[s[l].ord - 97] -= 1\n      l += 1\n    end\n    longest = r - l + 1 if r - l + 1 > longest\n  end\n  n - longest\nend`,
      },
    };
  })(),

  // ── Minimum Number of Flips to Make the Binary String Alternating (LC 1888) ──
  (() => {
    const ref = (s: string) => {
      const n = s.length;
      const t = s + s;
      let best = n, diff0 = 0, diff1 = 0;
      for (let i = 0; i < t.length; i++) {
        const want0 = i % 2 === 0 ? "0" : "1";
        if (t[i] !== want0) diff0++; else diff1++;
        if (i >= n) {
          const j = i - n;
          const w0 = j % 2 === 0 ? "0" : "1";
          if (t[j] !== w0) diff0--; else diff1--;
        }
        if (i >= n - 1) {
          if (diff0 < best) best = diff0;
          if (diff1 < best) best = diff1;
        }
      }
      return best;
    };
    return {
      slug: "minimum-number-of-flips-to-make-binary-string-alternating",
      title: "Minimum Number of Flips to Make the Binary String Alternating",
      difficulty: "HARD" as const,
      tags: ["String", "Sliding Window", "Dynamic Programming", "Greedy", "Amazon", "Google", "Nutanix"],
      signature: { funcName: "minFlips", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Two operations are available on the binary string `s`:\n\n- **type 1**: remove the first character and append it to the end (a rotation), usable any number of times;\n- **type 2**: flip any single character.\n\nReturn the minimum number of **type-2** operations needed to make `s` alternating (no two adjacent characters equal).",
        [
          { in: 's = "111000"', out: "2", note: 'Rotate to "100011", then flip two characters to reach "101010".' },
          { in: 's = "010"', out: "0", note: "Already alternating." },
          { in: 's = "1110"', out: "1" },
        ],
        ["1 <= s.length <= 100000", "s[i] is '0' or '1'"]),
      hints: [
        "A rotation of `s` is a window of length `n` inside `s + s`.",
        "There are only two alternating targets of length `n`, so each window has two mismatch counts.",
        "Roll both counts as the window slides, and the answer is the smallest of them all.",
      ],
      editorial: explain({
        idea: "Rotations are free, so the real question is: over all rotations, what is the fewest flips to reach an alternating string? Every rotation appears as a length-`n` window of `s + s`, and each window's cost against the two alternating patterns rolls in constant time.",
        steps: [
          "Form `t = s + s`.",
          "Walk `i` over `t`, comparing `t[i]` with the pattern that has `'0'` at even absolute indices. Count mismatches in `diff0`; matches are mismatches for the other pattern, so they go to `diff1`.",
          "Once `i >= n`, remove index `i - n` from whichever counter it belonged to.",
          "From `i = n - 1` onwards, the window is complete; take the minimum of `diff0` and `diff1`.",
        ],
        why: "Using absolute index parity for the pattern means a window starting at an even index is compared with one alternating string and a window starting at an odd index with the other — but since the answer takes `min(diff0, diff1)` at every window, both patterns are covered regardless. The two counters always sum to the window length, which is why a match for one pattern is a mismatch for the other.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "For odd `n`, rotations genuinely matter — the doubled string is what makes them all reachable; for even `n` the answer is the same as without rotations.",
          "Starting to record the answer before `i = n - 1` measures a partial window.",
          "The two patterns are not interchangeable per window; both must be tracked.",
        ],
      }),
      examples: [
        { input: '"111000"', expectedOutput: "2" },
        { input: '"010"', expectedOutput: "0" },
        { input: '"1110"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const s = Array.from({ length: ri(rng, 1, 45) }, () => (rng() < 0.5 ? "1" : "0")).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minFlips(s: str) -> int:\n    n = len(s)\n    t = s + s\n    best = n\n    diff0 = diff1 = 0\n    for i, ch in enumerate(t):\n        want0 = "0" if i % 2 == 0 else "1"\n        if ch != want0:\n            diff0 += 1\n        else:\n            diff1 += 1\n        if i >= n:\n            j = i - n\n            w0 = "0" if j % 2 == 0 else "1"\n            if t[j] != w0:\n                diff0 -= 1\n            else:\n                diff1 -= 1\n        if i >= n - 1:\n            best = min(best, diff0, diff1)\n    return best`,
        javascript: `var minFlips = function(s) {\n    var n = s.length;\n    var t = s + s;\n    var best = n, diff0 = 0, diff1 = 0;\n    for (var i = 0; i < t.length; i++) {\n        var want0 = i % 2 === 0 ? "0" : "1";\n        if (t.charAt(i) !== want0) diff0++; else diff1++;\n        if (i >= n) {\n            var j = i - n;\n            var w0 = j % 2 === 0 ? "0" : "1";\n            if (t.charAt(j) !== w0) diff0--; else diff1--;\n        }\n        if (i >= n - 1) {\n            if (diff0 < best) best = diff0;\n            if (diff1 < best) best = diff1;\n        }\n    }\n    return best;\n};`,
        typescript: `function minFlips(s: string): number {\n    var n = s.length;\n    var t = s + s;\n    var best = n, diff0 = 0, diff1 = 0;\n    for (var i = 0; i < t.length; i++) {\n        var want0 = i % 2 === 0 ? "0" : "1";\n        if (t.charAt(i) !== want0) diff0++; else diff1++;\n        if (i >= n) {\n            var j = i - n;\n            var w0 = j % 2 === 0 ? "0" : "1";\n            if (t.charAt(j) !== w0) diff0--; else diff1--;\n        }\n        if (i >= n - 1) {\n            if (diff0 < best) best = diff0;\n            if (diff1 < best) best = diff1;\n        }\n    }\n    return best;\n}`,
        java: `public static int minFlips(String s) {\n    int n = s.length();\n    String t = s + s;\n    int best = n, diff0 = 0, diff1 = 0;\n    for (int i = 0; i < t.length(); i++) {\n        char want0 = (i % 2 == 0) ? '0' : '1';\n        if (t.charAt(i) != want0) diff0++; else diff1++;\n        if (i >= n) {\n            int j = i - n;\n            char w0 = (j % 2 == 0) ? '0' : '1';\n            if (t.charAt(j) != w0) diff0--; else diff1--;\n        }\n        if (i >= n - 1) {\n            best = Math.min(best, Math.min(diff0, diff1));\n        }\n    }\n    return best;\n}`,
        cpp: `int minFlips(string s) {\n    int n = (int) s.size();\n    string t = s + s;\n    int best = n, diff0 = 0, diff1 = 0;\n    for (int i = 0; i < (int) t.size(); i++) {\n        char want0 = (i % 2 == 0) ? '0' : '1';\n        if (t[i] != want0) diff0++; else diff1++;\n        if (i >= n) {\n            int j = i - n;\n            char w0 = (j % 2 == 0) ? '0' : '1';\n            if (t[j] != w0) diff0--; else diff1--;\n        }\n        if (i >= n - 1) {\n            best = min(best, min(diff0, diff1));\n        }\n    }\n    return best;\n}`,
        c: `int minFlips(char* s) {\n    int n = (int) strlen(s);\n    char* t = (char*) malloc((size_t) (2 * n) + 1);\n    for (int i = 0; i < n; i++) { t[i] = s[i]; t[i + n] = s[i]; }\n    t[2 * n] = 0;\n    int best = n, diff0 = 0, diff1 = 0;\n    for (int i = 0; i < 2 * n; i++) {\n        char want0 = (i % 2 == 0) ? '0' : '1';\n        if (t[i] != want0) diff0++; else diff1++;\n        if (i >= n) {\n            int j = i - n;\n            char w0 = (j % 2 == 0) ? '0' : '1';\n            if (t[j] != w0) diff0--; else diff1--;\n        }\n        if (i >= n - 1) {\n            if (diff0 < best) best = diff0;\n            if (diff1 < best) best = diff1;\n        }\n    }\n    free(t);\n    return best;\n}`,
        csharp: `public static int MinFlips(string s)\n{\n    int n = s.Length;\n    string t = s + s;\n    int best = n, diff0 = 0, diff1 = 0;\n    for (int i = 0; i < t.Length; i++)\n    {\n        char want0 = (i % 2 == 0) ? '0' : '1';\n        if (t[i] != want0) diff0++; else diff1++;\n        if (i >= n)\n        {\n            int j = i - n;\n            char w0 = (j % 2 == 0) ? '0' : '1';\n            if (t[j] != w0) diff0--; else diff1--;\n        }\n        if (i >= n - 1)\n        {\n            if (diff0 < best) best = diff0;\n            if (diff1 < best) best = diff1;\n        }\n    }\n    return best;\n}`,
        go: `func minFlips(s string) int {\n\tn := len(s)\n\tt := s + s\n\tbest, diff0, diff1 := n, 0, 0\n\tfor i := 0; i < len(t); i++ {\n\t\tvar want0 byte = '1'\n\t\tif i%2 == 0 {\n\t\t\twant0 = '0'\n\t\t}\n\t\tif t[i] != want0 {\n\t\t\tdiff0++\n\t\t} else {\n\t\t\tdiff1++\n\t\t}\n\t\tif i >= n {\n\t\t\tj := i - n\n\t\t\tvar w0 byte = '1'\n\t\t\tif j%2 == 0 {\n\t\t\t\tw0 = '0'\n\t\t\t}\n\t\t\tif t[j] != w0 {\n\t\t\t\tdiff0--\n\t\t\t} else {\n\t\t\t\tdiff1--\n\t\t\t}\n\t\t}\n\t\tif i >= n-1 {\n\t\t\tif diff0 < best {\n\t\t\t\tbest = diff0\n\t\t\t}\n\t\t\tif diff1 < best {\n\t\t\t\tbest = diff1\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun minFlips(s: String): Int {\n    val n = s.length\n    val t = s + s\n    var best = n\n    var diff0 = 0\n    var diff1 = 0\n    for (i in t.indices) {\n        val want0 = if (i % 2 == 0) '0' else '1'\n        if (t[i] != want0) diff0++ else diff1++\n        if (i >= n) {\n            val j = i - n\n            val w0 = if (j % 2 == 0) '0' else '1'\n            if (t[j] != w0) diff0-- else diff1--\n        }\n        if (i >= n - 1) {\n            best = minOf(best, diff0, diff1)\n        }\n    }\n    return best\n}`,
        swift: `func minFlips(_ s: String) -> Int {\n    let a = Array(s)\n    let n = a.count\n    let t = a + a\n    var best = n\n    var diff0 = 0\n    var diff1 = 0\n    for i in 0..<t.count {\n        let want0: Character = i % 2 == 0 ? "0" : "1"\n        if t[i] != want0 { diff0 += 1 } else { diff1 += 1 }\n        if i >= n {\n            let j = i - n\n            let w0: Character = j % 2 == 0 ? "0" : "1"\n            if t[j] != w0 { diff0 -= 1 } else { diff1 -= 1 }\n        }\n        if i >= n - 1 {\n            best = min(best, min(diff0, diff1))\n        }\n    }\n    return best\n}`,
        rust: `fn minFlips(s: String) -> i32 {\n    let b = s.as_bytes();\n    let n = b.len();\n    let mut t: Vec<u8> = Vec::with_capacity(2 * n);\n    t.extend_from_slice(b);\n    t.extend_from_slice(b);\n    let mut best = n as i32;\n    let mut diff0 = 0i32;\n    let mut diff1 = 0i32;\n    for i in 0..t.len() {\n        let want0 = if i % 2 == 0 { b'0' } else { b'1' };\n        if t[i] != want0 {\n            diff0 += 1;\n        } else {\n            diff1 += 1;\n        }\n        if i >= n {\n            let j = i - n;\n            let w0 = if j % 2 == 0 { b'0' } else { b'1' };\n            if t[j] != w0 {\n                diff0 -= 1;\n            } else {\n                diff1 -= 1;\n            }\n        }\n        if i + 1 >= n {\n            best = best.min(diff0).min(diff1);\n        }\n    }\n    best\n}`,
        php: `function minFlips($s) {\n    $n = strlen($s);\n    $t = $s . $s;\n    $best = $n;\n    $diff0 = 0;\n    $diff1 = 0;\n    for ($i = 0; $i < strlen($t); $i++) {\n        $want0 = $i % 2 === 0 ? "0" : "1";\n        if ($t[$i] !== $want0) $diff0++; else $diff1++;\n        if ($i >= $n) {\n            $j = $i - $n;\n            $w0 = $j % 2 === 0 ? "0" : "1";\n            if ($t[$j] !== $w0) $diff0--; else $diff1--;\n        }\n        if ($i >= $n - 1) {\n            if ($diff0 < $best) $best = $diff0;\n            if ($diff1 < $best) $best = $diff1;\n        }\n    }\n    return $best;\n}`,
        ruby: `def minFlips(s)\n  n = s.length\n  t = s + s\n  best = n\n  diff0 = 0\n  diff1 = 0\n  (0...t.length).each do |i|\n    want0 = i.even? ? "0" : "1"\n    if t[i] != want0\n      diff0 += 1\n    else\n      diff1 += 1\n    end\n    if i >= n\n      j = i - n\n      w0 = j.even? ? "0" : "1"\n      if t[j] != w0\n        diff0 -= 1\n      else\n        diff1 -= 1\n      end\n    end\n    best = [best, diff0, diff1].min if i >= n - 1\n  end\n  best\nend`,
      },
    };
  })(),
];
