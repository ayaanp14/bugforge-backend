/**
 * Maths and number-theory problems — wave 4.
 *
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks
 * "must-do" number set. Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs in
 * src/lib/judge0.ts reads `<ident>=` as a named argument).
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 * Watch the 32-bit ceiling — several of these constrain their inputs so the
 * answer stays inside `int` in Java, C, C# and Go.
 */

import { bool, describe, explain, fmtIntArr, pick, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const MATH4_PROBLEMS: CatalogProblem[] = [

  // ── Find the Pivot Integer (LC 2485) ────────────────────────────
  (() => {
    const ref = (n: number) => {
      const total = (n * (n + 1)) / 2;
      let prefix = 0;
      for (let x = 1; x <= n; x++) {
        prefix += x;
        if (prefix === total - prefix + x) return x;
      }
      return -1;
    };
    return {
      slug: "find-the-pivot-integer",
      title: "Find the Pivot Integer",
      difficulty: "EASY" as const,
      tags: ["Math", "Prefix Sum", "TCS", "Infosys", "Capgemini"],
      signature: { funcName: "pivotInteger", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Find the integer `x` such that the sum of `1` through `x` equals the sum of `x` through `n`. Note that `x` itself is counted on **both** sides.\n\nReturn that `x`, or `-1` if it does not exist. It is unique when it exists.",
        [
          { in: "n = 8", out: "6", note: "1 + … + 6 = 21 and 6 + 7 + 8 = 21." },
          { in: "n = 1", out: "1", note: "Both sides are just the number 1." },
          { in: "n = 4", out: "-1" },
        ],
        ["1 <= n <= 1000"]),
      hints: [
        "The total `1 + … + n` is `n(n+1)/2`, which is cheap to compute.",
        "If the prefix up to `x` is `p`, the suffix from `x` is `total - p + x`.",
        "Setting them equal gives `2p - x = total`; sweep `x` and test, or solve `x² = total` directly.",
      ],
      editorial: explain({
        idea: "Both sides are described by the same running prefix, so one sweep with a closed-form total settles it. Algebraically the condition reduces to `x² = n(n+1)/2`, so the answer exists exactly when that total is a perfect square.",
        steps: [
          "Compute `total = n(n+1)/2`.",
          "Sweep `x` from `1` to `n`, maintaining `prefix = 1 + … + x`.",
          "Return `x` the moment `prefix == total - prefix + x`.",
          "Return `-1` if the sweep finishes.",
        ],
        why: "Writing the prefix as `x(x+1)/2` and the suffix as `total - x(x-1)/2`, the equality collapses to `x² = total`. So the pivot is the integer square root of the total when one exists — which is also why it is unique.",
        time: "O(n), or O(1) with the square-root form",
        space: "O(1)",
        pitfalls: [
          "Forgetting that `x` belongs to both sides shifts the equation by one term and finds nothing.",
          "`n(n+1)/2` is exact in integers because one of `n` and `n+1` is even — no floating point needed.",
        ],
      }),
      examples: [
        { input: "8", expectedOutput: "6" },
        { input: "1", expectedOutput: "1" },
        { input: "4", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.25 ? pick(rng, [1, 8, 49, 288]) : ri(rng, 1, 1000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def pivotInteger(n: int) -> int:\n    total = n * (n + 1) // 2\n    prefix = 0\n    for x in range(1, n + 1):\n        prefix += x\n        if prefix == total - prefix + x:\n            return x\n    return -1`,
        javascript: `var pivotInteger = function(n) {\n    var total = (n * (n + 1)) / 2;\n    var prefix = 0;\n    for (var x = 1; x <= n; x++) {\n        prefix += x;\n        if (prefix === total - prefix + x) return x;\n    }\n    return -1;\n};`,
        typescript: `function pivotInteger(n: number): number {\n    var total = (n * (n + 1)) / 2;\n    var prefix = 0;\n    for (var x = 1; x <= n; x++) {\n        prefix += x;\n        if (prefix === total - prefix + x) return x;\n    }\n    return -1;\n}`,
        java: `public static int pivotInteger(int n) {\n    int total = n * (n + 1) / 2;\n    int prefix = 0;\n    for (int x = 1; x <= n; x++) {\n        prefix += x;\n        if (prefix == total - prefix + x) return x;\n    }\n    return -1;\n}`,
        cpp: `int pivotInteger(int n) {\n    int total = n * (n + 1) / 2;\n    int prefix = 0;\n    for (int x = 1; x <= n; x++) {\n        prefix += x;\n        if (prefix == total - prefix + x) return x;\n    }\n    return -1;\n}`,
        c: `int pivotInteger(int n) {\n    int total = n * (n + 1) / 2;\n    int prefix = 0;\n    for (int x = 1; x <= n; x++) {\n        prefix += x;\n        if (prefix == total - prefix + x) return x;\n    }\n    return -1;\n}`,
        csharp: `public static int PivotInteger(int n)\n{\n    int total = n * (n + 1) / 2;\n    int prefix = 0;\n    for (int x = 1; x <= n; x++)\n    {\n        prefix += x;\n        if (prefix == total - prefix + x) return x;\n    }\n    return -1;\n}`,
        go: `func pivotInteger(n int) int {\n\ttotal := n * (n + 1) / 2\n\tprefix := 0\n\tfor x := 1; x <= n; x++ {\n\t\tprefix += x\n\t\tif prefix == total-prefix+x {\n\t\t\treturn x\n\t\t}\n\t}\n\treturn -1\n}`,
        kotlin: `fun pivotInteger(n: Int): Int {\n    val total = n * (n + 1) / 2\n    var prefix = 0\n    for (x in 1..n) {\n        prefix += x\n        if (prefix == total - prefix + x) return x\n    }\n    return -1\n}`,
        swift: `func pivotInteger(_ n: Int) -> Int {\n    let total = n * (n + 1) / 2\n    var prefix = 0\n    for x in 1...max(n, 1) where x <= n {\n        prefix += x\n        if prefix == total - prefix + x { return x }\n    }\n    return -1\n}`,
        rust: `fn pivotInteger(n: i32) -> i32 {\n    let total = n * (n + 1) / 2;\n    let mut prefix = 0;\n    for x in 1..=n {\n        prefix += x;\n        if prefix == total - prefix + x {\n            return x;\n        }\n    }\n    -1\n}`,
        php: `function pivotInteger($n) {\n    $total = intdiv($n * ($n + 1), 2);\n    $prefix = 0;\n    for ($x = 1; $x <= $n; $x++) {\n        $prefix += $x;\n        if ($prefix === $total - $prefix + $x) return $x;\n    }\n    return -1;\n}`,
        ruby: `def pivotInteger(n)\n  total = n * (n + 1) / 2\n  prefix = 0\n  (1..n).each do |x|\n    prefix += x\n    return x if prefix == total - prefix + x\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Number of Even and Odd Bits (LC 2595) ───────────────────────
  (() => {
    const ref = (n: number) => {
      let even = 0, odd = 0, i = 0, v = n;
      while (v > 0) {
        if ((v & 1) === 1) { if (i % 2 === 0) even++; else odd++; }
        v >>= 1;
        i++;
      }
      return [even, odd];
    };
    return {
      slug: "number-of-even-and-odd-bits",
      title: "Number of Even and Odd Bits",
      difficulty: "EASY" as const,
      tags: ["Bit Manipulation", "Math", "TCS", "Wipro", "Cognizant"],
      signature: { funcName: "evenOddBit", params: [{ name: "n", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Let `even` be the number of set bits at **even** indices of `n`'s binary representation, and `odd` the number at **odd** indices. Index `0` is the least significant bit.\n\nReturn `[even, odd]`.",
        [
          { in: "n = 50", out: "[1,2]", note: "50 is 110010 in binary: bit 1 and bit 4 and bit 5 are set, so one even index (4) and two odd ones (1 and 5)." },
          { in: "n = 2", out: "[0,1]", note: "2 is 10 — only bit 1 is set." },
          { in: "n = 1", out: "[1,0]" },
        ],
        ["1 <= n <= 1000"]),
      hints: [
        "Walk the bits from the least significant end, keeping the index.",
        "`v & 1` tests the current bit and `v >>= 1` moves to the next.",
        "The index's parity decides which counter goes up.",
      ],
      editorial: explain({
        idea: "Shift the number right one bit at a time and keep a position counter; the parity of the position selects the bucket.",
        steps: [
          "Start `i = 0`, `even = 0`, `odd = 0`.",
          "While `n > 0`: if the low bit is set, increment `even` when `i` is even and `odd` otherwise.",
          "Shift `n` right and increment `i`.",
        ],
        why: "Right-shifting by one moves bit `i+1` into the low position, so the counter `i` always names the bit currently being tested.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Counting from the most significant end reverses the index parity and swaps the two answers.",
          "Index `0` is even, so the least significant bit belongs to `even`.",
        ],
      }),
      examples: [
        { input: "50", expectedOutput: "[1,2]" },
        { input: "2", expectedOutput: "[0,1]" },
        { input: "1", expectedOutput: "[1,0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 1000);
        return { input: String(n), expectedOutput: fmtIntArr(ref(n)) };
      },
      solutions: {
        python: `from typing import List\n\ndef evenOddBit(n: int) -> List[int]:\n    even = odd = 0\n    i = 0\n    while n > 0:\n        if n & 1:\n            if i % 2 == 0:\n                even += 1\n            else:\n                odd += 1\n        n >>= 1\n        i += 1\n    return [even, odd]`,
        javascript: `var evenOddBit = function(n) {\n    var even = 0, odd = 0, i = 0;\n    while (n > 0) {\n        if ((n & 1) === 1) {\n            if (i % 2 === 0) even++;\n            else odd++;\n        }\n        n >>= 1;\n        i++;\n    }\n    return [even, odd];\n};`,
        typescript: `function evenOddBit(n: number): number[] {\n    var even = 0, odd = 0, i = 0;\n    while (n > 0) {\n        if ((n & 1) === 1) {\n            if (i % 2 === 0) even++;\n            else odd++;\n        }\n        n >>= 1;\n        i++;\n    }\n    return [even, odd];\n}`,
        java: `public static int[] evenOddBit(int n) {\n    int even = 0, odd = 0, i = 0;\n    while (n > 0) {\n        if ((n & 1) == 1) {\n            if (i % 2 == 0) even++;\n            else odd++;\n        }\n        n >>= 1;\n        i++;\n    }\n    return new int[] { even, odd };\n}`,
        cpp: `vector<int> evenOddBit(int n) {\n    int even = 0, odd = 0, i = 0;\n    while (n > 0) {\n        if (n & 1) {\n            if (i % 2 == 0) even++;\n            else odd++;\n        }\n        n >>= 1;\n        i++;\n    }\n    return { even, odd };\n}`,
        c: `int* evenOddBit(int n, int* returnSize) {\n    int even = 0, odd = 0, i = 0;\n    while (n > 0) {\n        if (n & 1) {\n            if (i % 2 == 0) even++;\n            else odd++;\n        }\n        n >>= 1;\n        i++;\n    }\n    int* out = (int*) malloc(2 * sizeof(int));\n    out[0] = even;\n    out[1] = odd;\n    *returnSize = 2;\n    return out;\n}`,
        csharp: `public static int[] EvenOddBit(int n)\n{\n    int even = 0, odd = 0, i = 0;\n    while (n > 0)\n    {\n        if ((n & 1) == 1)\n        {\n            if (i % 2 == 0) even++;\n            else odd++;\n        }\n        n >>= 1;\n        i++;\n    }\n    return new int[] { even, odd };\n}`,
        go: `func evenOddBit(n int) []int {\n\teven, odd, i := 0, 0, 0\n\tfor n > 0 {\n\t\tif n&1 == 1 {\n\t\t\tif i%2 == 0 {\n\t\t\t\teven++\n\t\t\t} else {\n\t\t\t\todd++\n\t\t\t}\n\t\t}\n\t\tn >>= 1\n\t\ti++\n\t}\n\treturn []int{even, odd}\n}`,
        kotlin: `fun evenOddBit(n: Int): IntArray {\n    var v = n\n    var even = 0\n    var odd = 0\n    var i = 0\n    while (v > 0) {\n        if (v and 1 == 1) {\n            if (i % 2 == 0) even++ else odd++\n        }\n        v = v shr 1\n        i++\n    }\n    return intArrayOf(even, odd)\n}`,
        swift: `func evenOddBit(_ n: Int) -> [Int] {\n    var v = n\n    var even = 0\n    var odd = 0\n    var i = 0\n    while v > 0 {\n        if v & 1 == 1 {\n            if i % 2 == 0 { even += 1 } else { odd += 1 }\n        }\n        v >>= 1\n        i += 1\n    }\n    return [even, odd]\n}`,
        rust: `fn evenOddBit(n: i32) -> Vec<i32> {\n    let mut v = n;\n    let mut even = 0;\n    let mut odd = 0;\n    let mut i = 0;\n    while v > 0 {\n        if v & 1 == 1 {\n            if i % 2 == 0 {\n                even += 1;\n            } else {\n                odd += 1;\n            }\n        }\n        v >>= 1;\n        i += 1;\n    }\n    vec![even, odd]\n}`,
        php: `function evenOddBit($n) {\n    $even = 0;\n    $odd = 0;\n    $i = 0;\n    while ($n > 0) {\n        if ($n & 1) {\n            if ($i % 2 === 0) $even++;\n            else $odd++;\n        }\n        $n >>= 1;\n        $i++;\n    }\n    return array($even, $odd);\n}`,
        ruby: `def evenOddBit(n)\n  even = 0\n  odd = 0\n  i = 0\n  while n > 0\n    if n & 1 == 1\n      i.even? ? even += 1 : odd += 1\n    end\n    n >>= 1\n    i += 1\n  end\n  [even, odd]\nend`,
      },
    };
  })(),

  // ── Split With Minimum Sum (LC 2578) ────────────────────────────
  (() => {
    const ref = (num: number) => {
      const digits = String(num).split("").map(Number).sort((a, b) => a - b);
      let a = 0, b = 0;
      for (let i = 0; i < digits.length; i++) {
        if (i % 2 === 0) a = a * 10 + digits[i];
        else b = b * 10 + digits[i];
      }
      return a + b;
    };
    return {
      slug: "split-with-minimum-sum",
      title: "Split With Minimum Sum",
      difficulty: "EASY" as const,
      tags: ["Math", "Greedy", "Sorting", "TCS", "Amazon", "Mindtree"],
      signature: { funcName: "splitNum", params: [{ name: "num", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Split the digits of `num` into two positive integers `num1` and `num2` such that together they use **every** digit of `num` exactly once. Neither part needs to keep the original digit order, and leading zeros are allowed.\n\nReturn the minimum possible value of `num1 + num2`.",
        [
          { in: "num = 4325", out: "59", note: "Splitting into 24 and 35 gives 59, the smallest possible." },
          { in: "num = 687", out: "75", note: "68 and 7 give 75." },
          { in: "num = 9", out: "9" },
        ],
        ["1 <= num <= 1000000000"]),
      hints: [
        "The smallest digits should carry the largest place values, so sort the digits ascending.",
        "Split the sorted digits by alternating: one to the first number, one to the second.",
        "That keeps both numbers as short as possible and puts the small digits in the high places.",
      ],
      editorial: explain({
        idea: "Two forces decide the answer: the two numbers should be as close as possible in length, and the smallest digits should sit in the highest places. Sorting ascending and dealing alternately achieves both at once.",
        steps: [
          "Extract the digits of `num` and sort them ascending.",
          "Deal them alternately: index 0 to `num1`, index 1 to `num2`, index 2 to `num1`, and so on, each time appending as the new least significant digit.",
          "Return `num1 + num2`.",
        ],
        why: "A digit placed at position `p` contributes `digit × 10^p`. Alternating the deal makes the two numbers differ in length by at most one, which minimises the largest place value used; and dealing in ascending order pairs the smallest digits with the largest remaining places. Any exchange of two digits between positions of different weight increases the sum.",
        time: "O(d log d) for `d` digits",
        space: "O(d)",
        pitfalls: [
          "Giving one number all the small digits and the other all the large ones is worse — the lengths become unbalanced.",
          "Leading zeros are explicitly allowed, so `\"05\"` is a legal part worth 5.",
        ],
      }),
      examples: [
        { input: "4325", expectedOutput: "59" },
        { input: "687", expectedOutput: "75" },
        { input: "9", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const num = rng() < 0.5 ? ri(rng, 1, 999) : ri(rng, 1, 1000000000);
        return { input: String(num), expectedOutput: String(ref(num)) };
      },
      solutions: {
        python: `def splitNum(num: int) -> int:\n    digits = sorted(str(num))\n    a = b = 0\n    for i, d in enumerate(digits):\n        if i % 2 == 0:\n            a = a * 10 + int(d)\n        else:\n            b = b * 10 + int(d)\n    return a + b`,
        javascript: `var splitNum = function(num) {\n    var digits = String(num).split("").sort();\n    var a = 0, b = 0;\n    for (var i = 0; i < digits.length; i++) {\n        var d = Number(digits[i]);\n        if (i % 2 === 0) a = a * 10 + d;\n        else b = b * 10 + d;\n    }\n    return a + b;\n};`,
        typescript: `function splitNum(num: number): number {\n    var digits = String(num).split("").sort();\n    var a = 0, b = 0;\n    for (var i = 0; i < digits.length; i++) {\n        var d = Number(digits[i]);\n        if (i % 2 === 0) a = a * 10 + d;\n        else b = b * 10 + d;\n    }\n    return a + b;\n}`,
        java: `public static int splitNum(int num) {\n    char[] digits = String.valueOf(num).toCharArray();\n    Arrays.sort(digits);\n    int a = 0, b = 0;\n    for (int i = 0; i < digits.length; i++) {\n        int d = digits[i] - '0';\n        if (i % 2 == 0) a = a * 10 + d;\n        else b = b * 10 + d;\n    }\n    return a + b;\n}`,
        cpp: `int splitNum(int num) {\n    string digits = to_string(num);\n    sort(digits.begin(), digits.end());\n    int a = 0, b = 0;\n    for (size_t i = 0; i < digits.size(); i++) {\n        int d = digits[i] - '0';\n        if (i % 2 == 0) a = a * 10 + d;\n        else b = b * 10 + d;\n    }\n    return a + b;\n}`,
        c: `static int cmpDigitChar(const void* a, const void* b) {\n    return (*(const char*) a) - (*(const char*) b);\n}\n\nint splitNum(int num) {\n    char digits[16];\n    sprintf(digits, "%d", num);\n    int len = (int) strlen(digits);\n    qsort(digits, (size_t) len, 1, cmpDigitChar);\n    int a = 0, b = 0;\n    for (int i = 0; i < len; i++) {\n        int d = digits[i] - '0';\n        if (i % 2 == 0) a = a * 10 + d;\n        else b = b * 10 + d;\n    }\n    return a + b;\n}`,
        csharp: `public static int SplitNum(int num)\n{\n    char[] digits = num.ToString().ToCharArray();\n    Array.Sort(digits);\n    int a = 0, b = 0;\n    for (int i = 0; i < digits.Length; i++)\n    {\n        int d = digits[i] - '0';\n        if (i % 2 == 0) a = a * 10 + d;\n        else b = b * 10 + d;\n    }\n    return a + b;\n}`,
        go: `func splitNum(num int) int {\n\tdigits := []byte(strconv.Itoa(num))\n\tsort.Slice(digits, func(i, j int) bool { return digits[i] < digits[j] })\n\ta, b := 0, 0\n\tfor i, c := range digits {\n\t\td := int(c - \'0\')\n\t\tif i%2 == 0 {\n\t\t\ta = a*10 + d\n\t\t} else {\n\t\t\tb = b*10 + d\n\t\t}\n\t}\n\treturn a + b\n}`,
        kotlin: `fun splitNum(num: Int): Int {\n    val digits = num.toString().toCharArray()\n    digits.sort()\n    var a = 0\n    var b = 0\n    for (i in digits.indices) {\n        val d = digits[i] - \'0\'\n        if (i % 2 == 0) a = a * 10 + d else b = b * 10 + d\n    }\n    return a + b\n}`,
        swift: `func splitNum(_ num: Int) -> Int {\n    let digits = Array(String(num)).sorted()\n    var a = 0\n    var b = 0\n    for i in 0..<digits.count {\n        let d = Int(String(digits[i]))!\n        if i % 2 == 0 { a = a * 10 + d } else { b = b * 10 + d }\n    }\n    return a + b\n}`,
        rust: `fn splitNum(num: i32) -> i32 {\n    let mut digits: Vec<u8> = num.to_string().into_bytes();\n    digits.sort();\n    let mut a = 0i32;\n    let mut b = 0i32;\n    for i in 0..digits.len() {\n        let d = (digits[i] - b\'0\') as i32;\n        if i % 2 == 0 {\n            a = a * 10 + d;\n        } else {\n            b = b * 10 + d;\n        }\n    }\n    a + b\n}`,
        php: `function splitNum($num) {\n    $digits = str_split(strval($num));\n    sort($digits);\n    $a = 0;\n    $b = 0;\n    for ($i = 0; $i < count($digits); $i++) {\n        $d = intval($digits[$i]);\n        if ($i % 2 === 0) $a = $a * 10 + $d;\n        else $b = $b * 10 + $d;\n    }\n    return $a + $b;\n}`,
        ruby: `def splitNum(num)\n  digits = num.to_s.chars.sort\n  a = 0\n  b = 0\n  digits.each_with_index do |c, i|\n    d = c.to_i\n    if i.even?\n      a = a * 10 + d\n    else\n      b = b * 10 + d\n    end\n  end\n  a + b\nend`,
      },
    };
  })(),

  // ── Sum Multiples (LC 2652) ─────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let total = 0;
      for (let x = 1; x <= n; x++) {
        if (x % 3 === 0 || x % 5 === 0 || x % 7 === 0) total += x;
      }
      return total;
    };
    return {
      slug: "sum-multiples",
      title: "Sum Multiples",
      difficulty: "EASY" as const,
      tags: ["Math", "Number Theory", "TCS", "Infosys", "Accenture"],
      signature: { funcName: "sumOfMultiples", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a positive integer `n`, return the sum of all integers in `[1, n]` that are divisible by `3`, `5` or `7`.",
        [
          { in: "n = 7", out: "21", note: "3 + 5 + 6 + 7 = 21." },
          { in: "n = 10", out: "40", note: "3 + 5 + 6 + 7 + 9 + 10 = 40." },
          { in: "n = 9", out: "30" },
        ],
        ["1 <= n <= 1000"]),
      hints: [
        "A direct loop over `1..n` is plenty at this size.",
        "Use `or`, not `and` — a number qualifies if **any** of the three divides it.",
        "The closed form uses inclusion–exclusion over the three divisors and their products.",
      ],
      editorial: explain({
        idea: "Test each candidate against the three divisors and add it when any one divides it. The arithmetic shortcut is inclusion–exclusion, which computes the same total in constant time.",
        steps: [
          "Loop `x` from `1` to `n`.",
          "If `x % 3 == 0` or `x % 5 == 0` or `x % 7 == 0`, add `x` to the total.",
        ],
        why: "The closed form is `S(3) + S(5) + S(7) - S(15) - S(21) - S(35) + S(105)`, where `S(d)` sums the multiples of `d` up to `n`. That is inclusion–exclusion on the three divisibility events, and it agrees with the loop.",
        time: "O(n), or O(1) with inclusion–exclusion",
        space: "O(1)",
        pitfalls: [
          "Adding a number once per matching divisor double counts multiples of 15, 21, 35 and 105.",
          "Summing `S(3) + S(5) + S(7)` without subtracting the overlaps makes exactly that mistake.",
        ],
      }),
      examples: [
        { input: "7", expectedOutput: "21" },
        { input: "10", expectedOutput: "40" },
        { input: "9", expectedOutput: "30" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 1000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def sumOfMultiples(n: int) -> int:\n    return sum(x for x in range(1, n + 1) if x % 3 == 0 or x % 5 == 0 or x % 7 == 0)`,
        javascript: `var sumOfMultiples = function(n) {\n    var total = 0;\n    for (var x = 1; x <= n; x++) {\n        if (x % 3 === 0 || x % 5 === 0 || x % 7 === 0) total += x;\n    }\n    return total;\n};`,
        typescript: `function sumOfMultiples(n: number): number {\n    var total = 0;\n    for (var x = 1; x <= n; x++) {\n        if (x % 3 === 0 || x % 5 === 0 || x % 7 === 0) total += x;\n    }\n    return total;\n}`,
        java: `public static int sumOfMultiples(int n) {\n    int total = 0;\n    for (int x = 1; x <= n; x++) {\n        if (x % 3 == 0 || x % 5 == 0 || x % 7 == 0) total += x;\n    }\n    return total;\n}`,
        cpp: `int sumOfMultiples(int n) {\n    int total = 0;\n    for (int x = 1; x <= n; x++) {\n        if (x % 3 == 0 || x % 5 == 0 || x % 7 == 0) total += x;\n    }\n    return total;\n}`,
        c: `int sumOfMultiples(int n) {\n    int total = 0;\n    for (int x = 1; x <= n; x++) {\n        if (x % 3 == 0 || x % 5 == 0 || x % 7 == 0) total += x;\n    }\n    return total;\n}`,
        csharp: `public static int SumOfMultiples(int n)\n{\n    int total = 0;\n    for (int x = 1; x <= n; x++)\n    {\n        if (x % 3 == 0 || x % 5 == 0 || x % 7 == 0) total += x;\n    }\n    return total;\n}`,
        go: `func sumOfMultiples(n int) int {\n\ttotal := 0\n\tfor x := 1; x <= n; x++ {\n\t\tif x%3 == 0 || x%5 == 0 || x%7 == 0 {\n\t\t\ttotal += x\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun sumOfMultiples(n: Int): Int {\n    var total = 0\n    for (x in 1..n) {\n        if (x % 3 == 0 || x % 5 == 0 || x % 7 == 0) total += x\n    }\n    return total\n}`,
        swift: `func sumOfMultiples(_ n: Int) -> Int {\n    var total = 0\n    for x in 1...max(n, 1) where x <= n {\n        if x % 3 == 0 || x % 5 == 0 || x % 7 == 0 { total += x }\n    }\n    return total\n}`,
        rust: `fn sumOfMultiples(n: i32) -> i32 {\n    let mut total = 0;\n    for x in 1..=n {\n        if x % 3 == 0 || x % 5 == 0 || x % 7 == 0 {\n            total += x;\n        }\n    }\n    total\n}`,
        php: `function sumOfMultiples($n) {\n    $total = 0;\n    for ($x = 1; $x <= $n; $x++) {\n        if ($x % 3 === 0 || $x % 5 === 0 || $x % 7 === 0) $total += $x;\n    }\n    return $total;\n}`,
        ruby: `def sumOfMultiples(n)\n  (1..n).select { |x| x % 3 == 0 || x % 5 == 0 || x % 7 == 0 }.sum\nend`,
      },
    };
  })(),

  // ── Count Distinct Numbers on Board (LC 2549) ───────────────────
  (() => {
    const ref = (n: number) => (n === 1 ? 1 : n - 1);
    return {
      slug: "count-distinct-numbers-on-board",
      title: "Count Distinct Numbers on Board",
      difficulty: "EASY" as const,
      tags: ["Math", "Simulation", "Number Theory", "TCS", "Amazon", "Zoho"],
      signature: { funcName: "distinctIntegers", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You write `n` on a board. Every day, for each number `x` already on the board, you add every `y` in `[1, n]` such that `x % y == 1`. Numbers never repeat on the board.\n\nReturn how many distinct numbers the board holds after `10^9` days.",
        [
          { in: "n = 5", out: "4", note: "5 % 4 = 1 adds 4; then 4 % 3 = 1 adds 3; then 3 % 2 = 1 adds 2. The board ends as {2,3,4,5}." },
          { in: "n = 3", out: "2", note: "3 % 2 = 1 adds 2, and 2 adds nothing new." },
          { in: "n = 1", out: "1", note: "1 % y == 1 has no solution in range, so only 1 stays." },
        ],
        ["1 <= n <= 100"]),
      hints: [
        "Simulate the first few days by hand for `n = 5` or `n = 6` and watch what lands on the board.",
        "`x % (x - 1) == 1` whenever `x > 2`, so every number pulls in its predecessor.",
        "That cascade stops at 2, and 1 can never be added — the answer has a one-line form.",
      ],
      editorial: explain({
        idea: "For any `x > 2`, `x % (x - 1) == 1`, so writing `x` immediately makes `x - 1` appear. Starting from `n`, the cascade sweeps all the way down to 2, and `1` is unreachable because `y` would have to exceed `x`.",
        steps: [
          "Handle `n == 1` separately: the board is just `{1}`, so the answer is `1`.",
          "Otherwise the board becomes `{2, 3, …, n}`, which has `n - 1` numbers.",
        ],
        why: "By induction every `x` in `[3, n]` adds `x - 1`, so all of `2 … n` appear. And `1` never does: `x % y == 1` requires `y > 1` and `x > y`, so the value added is always at least 2. Nothing outside `[1, n]` is ever considered.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Actually simulating `10^9` days is a trap — the board stabilises within `n` steps.",
          "`n = 1` is the only case where the answer is not `n - 1`.",
        ],
      }),
      examples: [
        { input: "5", expectedOutput: "4" },
        { input: "3", expectedOutput: "2" },
        { input: "1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 100);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def distinctIntegers(n: int) -> int:\n    return 1 if n == 1 else n - 1`,
        javascript: `var distinctIntegers = function(n) {\n    return n === 1 ? 1 : n - 1;\n};`,
        typescript: `function distinctIntegers(n: number): number {\n    return n === 1 ? 1 : n - 1;\n}`,
        java: `public static int distinctIntegers(int n) {\n    return n == 1 ? 1 : n - 1;\n}`,
        cpp: `int distinctIntegers(int n) {\n    return n == 1 ? 1 : n - 1;\n}`,
        c: `int distinctIntegers(int n) {\n    return n == 1 ? 1 : n - 1;\n}`,
        csharp: `public static int DistinctIntegers(int n)\n{\n    return n == 1 ? 1 : n - 1;\n}`,
        go: `func distinctIntegers(n int) int {\n\tif n == 1 {\n\t\treturn 1\n\t}\n\treturn n - 1\n}`,
        kotlin: `fun distinctIntegers(n: Int): Int {\n    return if (n == 1) 1 else n - 1\n}`,
        swift: `func distinctIntegers(_ n: Int) -> Int {\n    return n == 1 ? 1 : n - 1\n}`,
        rust: `fn distinctIntegers(n: i32) -> i32 {\n    if n == 1 { 1 } else { n - 1 }\n}`,
        php: `function distinctIntegers($n) {\n    return $n === 1 ? 1 : $n - 1;\n}`,
        ruby: `def distinctIntegers(n)\n  n == 1 ? 1 : n - 1\nend`,
      },
    };
  })(),

  // ── Sum of Squares of Special Elements (LC 2778) ────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let total = 0;
      for (let i = 1; i <= n; i++) {
        if (n % i === 0) total += nums[i - 1] * nums[i - 1];
      }
      return total;
    };
    return {
      slug: "sum-of-squares-of-special-elements",
      title: "Sum of Squares of Special Elements",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Number Theory", "TCS", "Wipro", "Capgemini"],
      signature: { funcName: "sumOfSquares", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An element `nums[i - 1]` is **special** when `i` divides `n`, the length of `nums`. Note the 1-based index `i`.\n\nReturn the sum of the squares of all special elements.",
        [
          { in: "nums = [1,2,3,4]", out: "21", note: "n is 4, and 1, 2 and 4 divide it, giving 1² + 2² + 4² = 21." },
          { in: "nums = [2,7,1,19,18,3]", out: "63", note: "n is 6, and 1, 2, 3 and 6 divide it, giving 4 + 49 + 1 + 9 = 63." },
          { in: "nums = [5]", out: "25" },
        ],
        ["1 <= nums.length <= 50", "1 <= nums[i] <= 50"]),
      hints: [
        "The divisibility test is on the **position**, not the value.",
        "The statement is 1-based, so position `i` corresponds to `nums[i - 1]`.",
        "`i = 1` and `i = n` always divide `n`.",
      ],
      editorial: explain({
        idea: "The condition is purely positional, so loop over 1-based positions, test divisibility against the length and square the value at that position.",
        steps: [
          "Let `n` be the length of `nums`.",
          "For `i` from `1` to `n`, check `n % i == 0`.",
          "When it holds, add `nums[i - 1] * nums[i - 1]` to the total.",
        ],
        why: "Each position is tested exactly once against the exact predicate the statement names, so the sum ranges over precisely the special elements.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Using the 0-based index in the divisibility test shifts every position by one and makes `i = 0` a division by zero.",
          "Squaring values up to 50 across 50 positions stays well inside 32 bits, but squaring is easy to forget.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4]", expectedOutput: "21" },
        { input: "[2,7,1,19,18,3]", expectedOutput: "63" },
        { input: "[5]", expectedOutput: "25" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 50) }, () => ri(rng, 1, 50));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef sumOfSquares(nums: List[int]) -> int:\n    n = len(nums)\n    return sum(nums[i - 1] ** 2 for i in range(1, n + 1) if n % i == 0)`,
        javascript: `var sumOfSquares = function(nums) {\n    var n = nums.length, total = 0;\n    for (var i = 1; i <= n; i++) {\n        if (n % i === 0) total += nums[i - 1] * nums[i - 1];\n    }\n    return total;\n};`,
        typescript: `function sumOfSquares(nums: number[]): number {\n    var n = nums.length, total = 0;\n    for (var i = 1; i <= n; i++) {\n        if (n % i === 0) total += nums[i - 1] * nums[i - 1];\n    }\n    return total;\n}`,
        java: `public static int sumOfSquares(int[] nums) {\n    int n = nums.length, total = 0;\n    for (int i = 1; i <= n; i++) {\n        if (n % i == 0) total += nums[i - 1] * nums[i - 1];\n    }\n    return total;\n}`,
        cpp: `int sumOfSquares(vector<int>& nums) {\n    int n = (int) nums.size(), total = 0;\n    for (int i = 1; i <= n; i++) {\n        if (n % i == 0) total += nums[i - 1] * nums[i - 1];\n    }\n    return total;\n}`,
        c: `int sumOfSquares(int* nums, int numsSize) {\n    int total = 0;\n    for (int i = 1; i <= numsSize; i++) {\n        if (numsSize % i == 0) total += nums[i - 1] * nums[i - 1];\n    }\n    return total;\n}`,
        csharp: `public static int SumOfSquares(int[] nums)\n{\n    int n = nums.Length, total = 0;\n    for (int i = 1; i <= n; i++)\n    {\n        if (n % i == 0) total += nums[i - 1] * nums[i - 1];\n    }\n    return total;\n}`,
        go: `func sumOfSquares(nums []int) int {\n\tn := len(nums)\n\ttotal := 0\n\tfor i := 1; i <= n; i++ {\n\t\tif n%i == 0 {\n\t\t\ttotal += nums[i-1] * nums[i-1]\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun sumOfSquares(nums: IntArray): Int {\n    val n = nums.size\n    var total = 0\n    for (i in 1..n) {\n        if (n % i == 0) total += nums[i - 1] * nums[i - 1]\n    }\n    return total\n}`,
        swift: `func sumOfSquares(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var total = 0\n    for i in 1...n where n % i == 0 {\n        total += nums[i - 1] * nums[i - 1]\n    }\n    return total\n}`,
        rust: `fn sumOfSquares(nums: Vec<i32>) -> i32 {\n    let n = nums.len() as i32;\n    let mut total = 0;\n    for i in 1..=n {\n        if n % i == 0 {\n            let v = nums[(i - 1) as usize];\n            total += v * v;\n        }\n    }\n    total\n}`,
        php: `function sumOfSquares($nums) {\n    $n = count($nums);\n    $total = 0;\n    for ($i = 1; $i <= $n; $i++) {\n        if ($n % $i === 0) $total += $nums[$i - 1] * $nums[$i - 1];\n    }\n    return $total;\n}`,
        ruby: `def sumOfSquares(nums)\n  n = nums.length\n  (1..n).select { |i| n % i == 0 }.sum { |i| nums[i - 1] ** 2 }\nend`,
      },
    };
  })(),

  // ── Construct the Rectangle (LC 492) ────────────────────────────
  (() => {
    const ref = (area: number) => {
      let w = Math.floor(Math.sqrt(area));
      while (area % w !== 0) w--;
      return [area / w, w];
    };
    return {
      slug: "construct-the-rectangle",
      title: "Construct the Rectangle",
      difficulty: "EASY" as const,
      tags: ["Math", "Number Theory", "TCS", "Infosys", "Amazon"],
      signature: { funcName: "constructRectangle", params: [{ name: "area", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Design a rectangular page with a given `area` subject to three rules: the length `L` times the width `W` must equal `area`, `L` must be at least `W`, and the difference `L - W` must be as small as possible.\n\nReturn `[L, W]`.",
        [
          { in: "area = 4", out: "[2,2]", note: "A square is the most balanced option." },
          { in: "area = 37", out: "[37,1]", note: "37 is prime, so the only factorisation is 37 by 1." },
          { in: "area = 122122", out: "[427,286]" },
        ],
        ["1 <= area <= 10000000"]),
      hints: [
        "The most balanced factor pair straddles the square root.",
        "Start `W` at `floor(sqrt(area))` and walk it down until it divides `area`.",
        "Then `L = area / W`, and this is automatically the pair with the smallest gap.",
      ],
      editorial: explain({
        idea: "Factor pairs of `area` are symmetric about its square root: as `W` decreases below `sqrt(area)`, the matching `L` grows. So the first divisor found walking down from `floor(sqrt(area))` gives the smallest possible gap.",
        steps: [
          "Set `W = floor(sqrt(area))`.",
          "While `area % W != 0`, decrement `W`.",
          "Return `[area / W, W]`.",
        ],
        why: "For any divisor `d <= sqrt(area)`, the gap is `area/d - d`, which strictly decreases as `d` grows. The largest divisor at or below the square root therefore minimises the gap, and that is exactly what the downward walk finds first.",
        time: "O(sqrt(area))",
        space: "O(1)",
        pitfalls: [
          "Walking **up** from 1 finds the widest gap, not the narrowest.",
          "Floating-point `sqrt` can land one off on a perfect square — a single guarded decrement or an explicit `while (w * w > area) w--` fixes it.",
          "The answer is `[L, W]` with `L >= W`, not the other way round.",
        ],
      }),
      examples: [
        { input: "4", expectedOutput: "[2,2]" },
        { input: "37", expectedOutput: "[37,1]" },
        { input: "122122", expectedOutput: "[427,286]" },
      ],
      gen: (rng: Rng) => {
        const area = rng() < 0.5 ? ri(rng, 1, 1000) : ri(rng, 1, 10000000);
        return { input: String(area), expectedOutput: fmtIntArr(ref(area)) };
      },
      solutions: {
        python: `from typing import List\n\ndef constructRectangle(area: int) -> List[int]:\n    w = int(area ** 0.5)\n    while w * w > area:\n        w -= 1\n    while area % w != 0:\n        w -= 1\n    return [area // w, w]`,
        javascript: `var constructRectangle = function(area) {\n    var w = Math.floor(Math.sqrt(area));\n    while (w * w > area) w--;\n    while (area % w !== 0) w--;\n    return [area / w, w];\n};`,
        typescript: `function constructRectangle(area: number): number[] {\n    var w = Math.floor(Math.sqrt(area));\n    while (w * w > area) w--;\n    while (area % w !== 0) w--;\n    return [area / w, w];\n}`,
        java: `public static int[] constructRectangle(int area) {\n    int w = (int) Math.sqrt(area);\n    while ((long) w * w > area) w--;\n    while (area % w != 0) w--;\n    return new int[] { area / w, w };\n}`,
        cpp: `vector<int> constructRectangle(int area) {\n    int w = (int) sqrt((double) area);\n    while ((long long) w * w > area) w--;\n    while (area % w != 0) w--;\n    return { area / w, w };\n}`,
        c: `int* constructRectangle(int area, int* returnSize) {\n    /* No math.h in the judge harness, so walk up to the integer square root. */\n    int w = 1;\n    while ((long long) (w + 1) * (w + 1) <= (long long) area) w++;\n    while (area % w != 0) w--;\n    int* out = (int*) malloc(2 * sizeof(int));\n    out[0] = area / w;\n    out[1] = w;\n    *returnSize = 2;\n    return out;\n}`,
        csharp: `public static int[] ConstructRectangle(int area)\n{\n    int w = (int) Math.Sqrt(area);\n    while ((long) w * w > area) w--;\n    while (area % w != 0) w--;\n    return new int[] { area / w, w };\n}`,
        go: `func constructRectangle(area int) []int {\n\tw := int(math.Sqrt(float64(area)))\n\tfor w*w > area {\n\t\tw--\n\t}\n\tfor area%w != 0 {\n\t\tw--\n\t}\n\treturn []int{area / w, w}\n}`,
        kotlin: `fun constructRectangle(area: Int): IntArray {\n    var w = Math.sqrt(area.toDouble()).toInt()\n    while (w.toLong() * w > area) w--\n    while (area % w != 0) w--\n    return intArrayOf(area / w, w)\n}`,
        swift: `func constructRectangle(_ area: Int) -> [Int] {\n    var w = Int(Double(area).squareRoot())\n    while w * w > area { w -= 1 }\n    while area % w != 0 { w -= 1 }\n    return [area / w, w]\n}`,
        rust: `fn constructRectangle(area: i32) -> Vec<i32> {\n    let mut w = (area as f64).sqrt() as i32;\n    while (w as i64) * (w as i64) > area as i64 {\n        w -= 1;\n    }\n    while area % w != 0 {\n        w -= 1;\n    }\n    vec![area / w, w]\n}`,
        php: `function constructRectangle($area) {\n    $w = (int) sqrt($area);\n    while ($w * $w > $area) $w--;\n    while ($area % $w !== 0) $w--;\n    return array(intdiv($area, $w), $w);\n}`,
        ruby: `def constructRectangle(area)\n  w = Integer.sqrt(area)\n  w -= 1 while area % w != 0\n  [area / w, w]\nend`,
      },
    };
  })(),

  // ── Check if Number Has Equal Digit Count and Digit Value (LC 2283) ──
  (() => {
    const ref = (num: string) => {
      const count = new Array(10).fill(0);
      for (let i = 0; i < num.length; i++) count[num.charCodeAt(i) - 48]++;
      for (let i = 0; i < num.length; i++) {
        if (count[i] !== num.charCodeAt(i) - 48) return false;
      }
      return true;
    };
    return {
      slug: "check-if-number-has-equal-digit-count-and-digit-value",
      title: "Check if Number Has Equal Digit Count and Digit Value",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Counting", "TCS", "Cognizant", "Zoho"],
      signature: { funcName: "digitCount", params: [{ name: "num", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "You are given a 0-indexed string `num` of digits.\n\nReturn `true` if, for **every** index `i`, the digit `i` occurs exactly `num[i]` times in `num`.",
        [
          { in: 'num = "1210"', out: "true", note: "Digit 0 occurs once, digit 1 twice, digit 2 once and digit 3 never — matching 1, 2, 1, 0." },
          { in: 'num = "030"', out: "false", note: "num[0] says digit 0 appears 0 times, but it appears twice." },
          { in: 'num = "1"', out: "false", note: "num[0] claims digit 0 appears once, and it never does." },
        ],
        ["1 <= num.length <= 10", "num consists of digits.", "The digits of num are between 0 and 9."]),
      hints: [
        "Tally how often each digit `0..9` appears.",
        "Then check position by position: `count[i]` must equal the digit written at `num[i]`.",
        "Only positions `0` through `n - 1` are constrained — digits beyond the string's length are irrelevant.",
      ],
      editorial: explain({
        idea: "The string is a self-describing claim: position `i` asserts how many times the digit `i` occurs. Tally first, then verify each claim.",
        steps: [
          "Build `count[0..9]` over the characters of `num`.",
          "For each index `i` from `0` to `n - 1`, compare `count[i]` with the numeric value of `num[i]`.",
          "Return `false` on the first mismatch, `true` otherwise.",
        ],
        why: "The claim at index `i` is exactly 'digit `i` occurs `num[i]` times', so a full tally followed by a positional comparison is a direct translation of the definition.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Comparing `count[i]` with `i` instead of with the digit at position `i` checks the wrong thing.",
          "Forgetting to convert the character to its numeric value compares a character code against a count.",
        ],
      }),
      examples: [
        { input: '"1210"', expectedOutput: "true" },
        { input: '"030"', expectedOutput: "false" },
        { input: '"1"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        if (rng() < 0.2) {
          const known = pick(rng, ["1210", "030", "1", "21200", "22", "1020", "2020"]);
          return { input: `"${known}"`, expectedOutput: bool(ref(known)) };
        }
        const n = ri(rng, 1, 8);
        const num = Array.from({ length: n }, () => String(ri(rng, 0, 3))).join("");
        return { input: `"${num}"`, expectedOutput: bool(ref(num)) };
      },
      solutions: {
        python: `def digitCount(num: str) -> bool:\n    count = [0] * 10\n    for ch in num:\n        count[int(ch)] += 1\n    return all(count[i] == int(num[i]) for i in range(len(num)))`,
        javascript: `var digitCount = function(num) {\n    var count = [];\n    for (var t = 0; t < 10; t++) count.push(0);\n    for (var i = 0; i < num.length; i++) count[num.charCodeAt(i) - 48]++;\n    for (var j = 0; j < num.length; j++) {\n        if (count[j] !== num.charCodeAt(j) - 48) return false;\n    }\n    return true;\n};`,
        typescript: `function digitCount(num: string): boolean {\n    var count: number[] = [];\n    for (var t = 0; t < 10; t++) count.push(0);\n    for (var i = 0; i < num.length; i++) count[num.charCodeAt(i) - 48]++;\n    for (var j = 0; j < num.length; j++) {\n        if (count[j] !== num.charCodeAt(j) - 48) return false;\n    }\n    return true;\n}`,
        java: `public static boolean digitCount(String num) {\n    int[] count = new int[10];\n    for (int i = 0; i < num.length(); i++) count[num.charAt(i) - '0']++;\n    for (int i = 0; i < num.length(); i++) {\n        if (count[i] != num.charAt(i) - '0') return false;\n    }\n    return true;\n}`,
        cpp: `bool digitCount(string num) {\n    vector<int> count(10, 0);\n    for (char c : num) count[c - '0']++;\n    for (int i = 0; i < (int) num.size(); i++) {\n        if (count[i] != num[i] - '0') return false;\n    }\n    return true;\n}`,
        c: `bool digitCount(char* num) {\n    int count[10];\n    memset(count, 0, sizeof(count));\n    int n = (int) strlen(num);\n    for (int i = 0; i < n; i++) count[num[i] - '0']++;\n    for (int i = 0; i < n; i++) {\n        if (count[i] != num[i] - '0') return false;\n    }\n    return true;\n}`,
        csharp: `public static bool DigitCount(string num)\n{\n    int[] count = new int[10];\n    foreach (char c in num) count[c - '0']++;\n    for (int i = 0; i < num.Length; i++)\n    {\n        if (count[i] != num[i] - '0') return false;\n    }\n    return true;\n}`,
        go: `func digitCount(num string) bool {\n\tcount := make([]int, 10)\n\tfor i := 0; i < len(num); i++ {\n\t\tcount[num[i]-\'0\']++\n\t}\n\tfor i := 0; i < len(num); i++ {\n\t\tif count[i] != int(num[i]-\'0\') {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun digitCount(num: String): Boolean {\n    val count = IntArray(10)\n    for (c in num) count[c - \'0\']++\n    for (i in num.indices) {\n        if (count[i] != num[i] - \'0\') return false\n    }\n    return true\n}`,
        swift: `func digitCount(_ num: String) -> Bool {\n    let a = Array(num.utf8).map { Int($0) - 48 }\n    var count = [Int](repeating: 0, count: 10)\n    for d in a { count[d] += 1 }\n    for i in 0..<a.count {\n        if count[i] != a[i] { return false }\n    }\n    return true\n}`,
        rust: `fn digitCount(num: String) -> bool {\n    let b = num.as_bytes();\n    let mut count = [0i32; 10];\n    for &c in b {\n        count[(c - b\'0\') as usize] += 1;\n    }\n    for i in 0..b.len() {\n        if count[i] != (b[i] - b\'0\') as i32 {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function digitCount($num) {\n    $count = array_fill(0, 10, 0);\n    $n = strlen($num);\n    for ($i = 0; $i < $n; $i++) $count[intval($num[$i])]++;\n    for ($i = 0; $i < $n; $i++) {\n        if ($count[$i] !== intval($num[$i])) return false;\n    }\n    return true;\n}`,
        ruby: `def digitCount(num)\n  count = Array.new(10, 0)\n  num.each_char { |c| count[c.to_i] += 1 }\n  (0...num.length).all? { |i| count[i] == num[i].to_i }\nend`,
      },
    };
  })(),

  // ── Find the Maximum Divisibility Score (LC 2644) ───────────────
  (() => {
    const ref = (nums: number[], divisors: number[]) => {
      let bestDiv = 0, bestScore = -1;
      for (const d of divisors) {
        let score = 0;
        for (const x of nums) { if (x % d === 0) score++; }
        if (score > bestScore || (score === bestScore && d < bestDiv)) { bestScore = score; bestDiv = d; }
      }
      return bestDiv;
    };
    return {
      slug: "find-the-maximum-divisibility-score",
      title: "Find the Maximum Divisibility Score",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Counting", "TCS", "Infosys", "Adobe"],
      signature: { funcName: "maxDivScore", params: [{ name: "nums", type: "int[]" as const }, { name: "divisors", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The **divisibility score** of a candidate `d` is the number of entries in `nums` that `d` divides exactly.\n\nReturn the divisor with the highest score. If several tie, return the **smallest** of them.",
        [
          { in: "nums = [4,7,9,3,9], divisors = [5,2,3]", out: "3", note: "3 divides 9, 3 and 9 for a score of 3, beating 2 (one hit) and 5 (none)." },
          { in: "nums = [20,14,21,10], divisors = [5,7,5]", out: "5", note: "5 and 7 both score 2, so the smaller wins." },
          { in: "nums = [12], divisors = [10,16]", out: "10", note: "Neither divides 12, so both score 0 and the smaller wins." },
        ],
        ["1 <= nums.length, divisors.length <= 1000", "1 <= nums[i], divisors[i] <= 1000000000"]),
      hints: [
        "Score every divisor by a full pass over `nums`.",
        "Keep the running best, and on a tie prefer the smaller divisor.",
        "A score of zero is legitimate — the answer is then the smallest divisor overall.",
      ],
      editorial: explain({
        idea: "There is nothing clever to do: score each divisor directly and keep the best under the stated tie-break.",
        steps: [
          "For each divisor `d`, count how many entries of `nums` satisfy `x % d == 0`.",
          "Adopt `d` when its score beats the best so far, or ties it while being smaller.",
        ],
        why: "The comparison 'higher score, then smaller value' is a strict total order on the candidates, so a single sweep keeping the maximum under that order finds the unique answer.",
        time: "O(n · m)",
        space: "O(1)",
        pitfalls: [
          "Initialising the best score to `0` rather than `-1` makes an all-zero input return whichever divisor came first rather than the smallest.",
          "Duplicated divisors are harmless — they tie with themselves.",
        ],
      }),
      examples: [
        { input: "[4,7,9,3,9]\n[5,2,3]", expectedOutput: "3" },
        { input: "[20,14,21,10]\n[5,7,5]", expectedOutput: "5" },
        { input: "[12]\n[10,16]", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 20 : 1000000000;
        const nums = Array.from({ length: ri(rng, 1, 20) }, () => ri(rng, 1, hi));
        const divisors = Array.from({ length: ri(rng, 1, 8) }, () => ri(rng, 1, rng() < 0.7 ? 12 : hi));
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(divisors)}`, expectedOutput: String(ref(nums, divisors)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxDivScore(nums: List[int], divisors: List[int]) -> int:\n    best_div = 0\n    best_score = -1\n    for d in divisors:\n        score = sum(1 for x in nums if x % d == 0)\n        if score > best_score or (score == best_score and d < best_div):\n            best_score = score\n            best_div = d\n    return best_div`,
        javascript: `var maxDivScore = function(nums, divisors) {\n    var bestDiv = 0, bestScore = -1;\n    for (var i = 0; i < divisors.length; i++) {\n        var d = divisors[i], score = 0;\n        for (var j = 0; j < nums.length; j++) {\n            if (nums[j] % d === 0) score++;\n        }\n        if (score > bestScore || (score === bestScore && d < bestDiv)) { bestScore = score; bestDiv = d; }\n    }\n    return bestDiv;\n};`,
        typescript: `function maxDivScore(nums: number[], divisors: number[]): number {\n    var bestDiv = 0, bestScore = -1;\n    for (var i = 0; i < divisors.length; i++) {\n        var d = divisors[i], score = 0;\n        for (var j = 0; j < nums.length; j++) {\n            if (nums[j] % d === 0) score++;\n        }\n        if (score > bestScore || (score === bestScore && d < bestDiv)) { bestScore = score; bestDiv = d; }\n    }\n    return bestDiv;\n}`,
        java: `public static int maxDivScore(int[] nums, int[] divisors) {\n    int bestDiv = 0, bestScore = -1;\n    for (int d : divisors) {\n        int score = 0;\n        for (int x : nums) {\n            if (x % d == 0) score++;\n        }\n        if (score > bestScore || (score == bestScore && d < bestDiv)) { bestScore = score; bestDiv = d; }\n    }\n    return bestDiv;\n}`,
        cpp: `int maxDivScore(vector<int>& nums, vector<int>& divisors) {\n    int bestDiv = 0, bestScore = -1;\n    for (int d : divisors) {\n        int score = 0;\n        for (int x : nums) {\n            if (x % d == 0) score++;\n        }\n        if (score > bestScore || (score == bestScore && d < bestDiv)) { bestScore = score; bestDiv = d; }\n    }\n    return bestDiv;\n}`,
        c: `int maxDivScore(int* nums, int numsSize, int* divisors, int divisorsSize) {\n    int bestDiv = 0, bestScore = -1;\n    for (int i = 0; i < divisorsSize; i++) {\n        int d = divisors[i], score = 0;\n        for (int j = 0; j < numsSize; j++) {\n            if (nums[j] % d == 0) score++;\n        }\n        if (score > bestScore || (score == bestScore && d < bestDiv)) { bestScore = score; bestDiv = d; }\n    }\n    return bestDiv;\n}`,
        csharp: `public static int MaxDivScore(int[] nums, int[] divisors)\n{\n    int bestDiv = 0, bestScore = -1;\n    foreach (int d in divisors)\n    {\n        int score = 0;\n        foreach (int x in nums)\n        {\n            if (x % d == 0) score++;\n        }\n        if (score > bestScore || (score == bestScore && d < bestDiv)) { bestScore = score; bestDiv = d; }\n    }\n    return bestDiv;\n}`,
        go: `func maxDivScore(nums []int, divisors []int) int {\n\tbestDiv, bestScore := 0, -1\n\tfor _, d := range divisors {\n\t\tscore := 0\n\t\tfor _, x := range nums {\n\t\t\tif x%d == 0 {\n\t\t\t\tscore++\n\t\t\t}\n\t\t}\n\t\tif score > bestScore || (score == bestScore && d < bestDiv) {\n\t\t\tbestScore = score\n\t\t\tbestDiv = d\n\t\t}\n\t}\n\treturn bestDiv\n}`,
        kotlin: `fun maxDivScore(nums: IntArray, divisors: IntArray): Int {\n    var bestDiv = 0\n    var bestScore = -1\n    for (d in divisors) {\n        var score = 0\n        for (x in nums) if (x % d == 0) score++\n        if (score > bestScore || (score == bestScore && d < bestDiv)) {\n            bestScore = score\n            bestDiv = d\n        }\n    }\n    return bestDiv\n}`,
        swift: `func maxDivScore(_ nums: [Int], _ divisors: [Int]) -> Int {\n    var bestDiv = 0\n    var bestScore = -1\n    for d in divisors {\n        var score = 0\n        for x in nums where x % d == 0 { score += 1 }\n        if score > bestScore || (score == bestScore && d < bestDiv) {\n            bestScore = score\n            bestDiv = d\n        }\n    }\n    return bestDiv\n}`,
        rust: `fn maxDivScore(nums: Vec<i32>, divisors: Vec<i32>) -> i32 {\n    let mut best_div = 0i32;\n    let mut best_score = -1i32;\n    for &d in divisors.iter() {\n        let mut score = 0i32;\n        for &x in nums.iter() {\n            if x % d == 0 {\n                score += 1;\n            }\n        }\n        if score > best_score || (score == best_score && d < best_div) {\n            best_score = score;\n            best_div = d;\n        }\n    }\n    best_div\n}`,
        php: `function maxDivScore($nums, $divisors) {\n    $bestDiv = 0;\n    $bestScore = -1;\n    foreach ($divisors as $d) {\n        $score = 0;\n        foreach ($nums as $x) {\n            if ($x % $d === 0) $score++;\n        }\n        if ($score > $bestScore || ($score === $bestScore && $d < $bestDiv)) {\n            $bestScore = $score;\n            $bestDiv = $d;\n        }\n    }\n    return $bestDiv;\n}`,
        ruby: `def maxDivScore(nums, divisors)\n  best_div = 0\n  best_score = -1\n  divisors.each do |d|\n    score = nums.count { |x| x % d == 0 }\n    if score > best_score || (score == best_score && d < best_div)\n      best_score = score\n      best_div = d\n    end\n  end\n  best_div\nend`,
      },
    };
  })(),

  // ── Number of Zero-Filled Subarrays (LC 2348) ───────────────────
  (() => {
    const ref = (nums: number[]) => {
      let total = 0, run = 0;
      for (const x of nums) {
        run = x === 0 ? run + 1 : 0;
        total += run;
      }
      return total;
    };
    return {
      slug: "number-of-zero-filled-subarrays",
      title: "Number of Zero-Filled Subarrays",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Counting", "Amazon", "Google", "Paytm"],
      signature: { funcName: "zeroFilledSubarray", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Return the number of contiguous subarrays of `nums` in which **every** element is `0`.",
        [
          { in: "nums = [1,3,0,0,2,0,0,4]", out: "6", note: "Two runs of two zeros each contribute 3 subarrays." },
          { in: "nums = [0,0,0,2,0,0]", out: "9", note: "A run of three gives 6 and a run of two gives 3." },
          { in: "nums = [2,10,2019]", out: "0" },
        ],
        ["1 <= nums.length <= 1000", "-1000000000 <= nums[i] <= 1000000000"]),
      hints: [
        "A run of `L` consecutive zeros contains `L * (L + 1) / 2` all-zero subarrays.",
        "You can accumulate that total without ever computing `L`: at each zero, add the current run length.",
        "A non-zero element resets the run to 0.",
      ],
      editorial: explain({
        idea: "Count by right endpoint. At each position that holds a zero, the number of all-zero subarrays ending there equals the length of the zero run ending there — so a single running counter gives the total.",
        steps: [
          "Keep `run`, the length of the zero run ending at the current index.",
          "On a zero, increment `run`; on anything else, reset it to `0`.",
          "Add `run` to the answer at every step.",
        ],
        why: "Summing the run length over the positions of a run of length `L` gives `1 + 2 + … + L = L(L+1)/2`, which is exactly the number of subarrays inside it — and runs are disjoint, so the totals add.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Adding `L * (L + 1) / 2` only when a run ends misses the run that reaches the end of the array unless you flush after the loop.",
          "At the real LeetCode limits the answer exceeds 32 bits; this version caps the length at 1000 so it fits.",
        ],
      }),
      examples: [
        { input: "[1,3,0,0,2,0,0,4]", expectedOutput: "6" },
        { input: "[0,0,0,2,0,0]", expectedOutput: "9" },
        { input: "[2,10,2019]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const p = pick(rng, [0.3, 0.5, 0.8]);
        const nums = Array.from({ length: n }, () => (rng() < p ? 0 : ri(rng, -1000000000, 1000000000)));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef zeroFilledSubarray(nums: List[int]) -> int:\n    total = run = 0\n    for x in nums:\n        run = run + 1 if x == 0 else 0\n        total += run\n    return total`,
        javascript: `var zeroFilledSubarray = function(nums) {\n    var total = 0, run = 0;\n    for (var i = 0; i < nums.length; i++) {\n        run = nums[i] === 0 ? run + 1 : 0;\n        total += run;\n    }\n    return total;\n};`,
        typescript: `function zeroFilledSubarray(nums: number[]): number {\n    var total = 0, run = 0;\n    for (var i = 0; i < nums.length; i++) {\n        run = nums[i] === 0 ? run + 1 : 0;\n        total += run;\n    }\n    return total;\n}`,
        java: `public static int zeroFilledSubarray(int[] nums) {\n    int total = 0, run = 0;\n    for (int x : nums) {\n        run = x == 0 ? run + 1 : 0;\n        total += run;\n    }\n    return total;\n}`,
        cpp: `int zeroFilledSubarray(vector<int>& nums) {\n    int total = 0, run = 0;\n    for (int x : nums) {\n        run = x == 0 ? run + 1 : 0;\n        total += run;\n    }\n    return total;\n}`,
        c: `int zeroFilledSubarray(int* nums, int numsSize) {\n    int total = 0, run = 0;\n    for (int i = 0; i < numsSize; i++) {\n        run = nums[i] == 0 ? run + 1 : 0;\n        total += run;\n    }\n    return total;\n}`,
        csharp: `public static int ZeroFilledSubarray(int[] nums)\n{\n    int total = 0, run = 0;\n    foreach (int x in nums)\n    {\n        run = x == 0 ? run + 1 : 0;\n        total += run;\n    }\n    return total;\n}`,
        go: `func zeroFilledSubarray(nums []int) int {\n\ttotal, run := 0, 0\n\tfor _, x := range nums {\n\t\tif x == 0 {\n\t\t\trun++\n\t\t} else {\n\t\t\trun = 0\n\t\t}\n\t\ttotal += run\n\t}\n\treturn total\n}`,
        kotlin: `fun zeroFilledSubarray(nums: IntArray): Int {\n    var total = 0\n    var run = 0\n    for (x in nums) {\n        run = if (x == 0) run + 1 else 0\n        total += run\n    }\n    return total\n}`,
        swift: `func zeroFilledSubarray(_ nums: [Int]) -> Int {\n    var total = 0\n    var run = 0\n    for x in nums {\n        run = x == 0 ? run + 1 : 0\n        total += run\n    }\n    return total\n}`,
        rust: `fn zeroFilledSubarray(nums: Vec<i32>) -> i32 {\n    let mut total = 0i32;\n    let mut run = 0i32;\n    for &x in nums.iter() {\n        run = if x == 0 { run + 1 } else { 0 };\n        total += run;\n    }\n    total\n}`,
        php: `function zeroFilledSubarray($nums) {\n    $total = 0;\n    $run = 0;\n    foreach ($nums as $x) {\n        $run = $x === 0 ? $run + 1 : 0;\n        $total += $run;\n    }\n    return $total;\n}`,
        ruby: `def zeroFilledSubarray(nums)\n  total = 0\n  run = 0\n  nums.each do |x|\n    run = x == 0 ? run + 1 : 0\n    total += run\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Smallest Value After Replacing With Sum of Prime Factors (LC 2507) ──
  (() => {
    const primeSum = (v: number) => {
      let total = 0, x = v;
      for (let p = 2; p * p <= x; p++) {
        while (x % p === 0) { total += p; x /= p; }
      }
      if (x > 1) total += x;
      return total;
    };
    const ref = (n: number) => {
      let cur = n;
      for (;;) {
        const next = primeSum(cur);
        if (next === cur) return cur;
        cur = next;
      }
    };
    return {
      slug: "smallest-value-after-replacing-with-sum-of-prime-factors",
      title: "Smallest Value After Replacing With Sum of Prime Factors",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Number Theory", "Simulation", "Amazon", "Adobe", "Samsung"],
      signature: { funcName: "smallestValue", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Repeatedly replace `n` with the sum of its prime factors **counted with multiplicity** — so `12 = 2 × 2 × 3` becomes `7`.\n\nReturn the value `n` settles on, which is the smallest value it ever reaches.",
        [
          { in: "n = 15", out: "5", note: "15 becomes 3 + 5 = 8, then 2 + 2 + 2 = 6, then 2 + 3 = 5, and 5 is prime." },
          { in: "n = 3", out: "3", note: "A prime is its own sum of prime factors." },
          { in: "n = 12", out: "7", note: "12 becomes 2 + 2 + 3 = 7." },
        ],
        ["2 <= n <= 100000"]),
      hints: [
        "Factorise by trial division up to the square root; whatever is left over is itself prime.",
        "Count each factor as many times as it divides — `4` contributes `2 + 2`, not just `2`.",
        "The process stops exactly when `n` is prime, because a prime's factor sum is itself.",
      ],
      editorial: explain({
        idea: "Each round is a trial-division factorisation whose factors are summed with multiplicity. The sequence strictly decreases until it hits a prime, which is a fixed point.",
        steps: [
          "Write a helper that factorises `x` by trial division from `2` up to `sqrt(x)`, adding each prime as many times as it divides, and adding the leftover if it exceeds 1.",
          "Loop: compute the helper's value; if it equals the current value, return it; otherwise continue from it.",
        ],
        why: "For composite `x = a · b` with `a, b >= 2`, the sum of prime factors is at most `a + b <= a · b`, with equality only at `4` — and `4` maps to `4`, so the loop terminates there too. For a prime `p` the sum is `p` itself, so primes are the fixed points and the sequence never increases.",
        time: "O(log n · sqrt(n)) overall — the value shrinks fast",
        space: "O(1)",
        pitfalls: [
          "Summing **distinct** primes rather than counting multiplicity gives `5` for `12` instead of `7`.",
          "Forgetting the leftover factor after the loop loses the largest prime whenever it exceeds `sqrt(x)`.",
          "`4` is a fixed point and would loop forever without the 'stop when unchanged' test.",
        ],
      }),
      examples: [
        { input: "15", expectedOutput: "5" },
        { input: "3", expectedOutput: "3" },
        { input: "12", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 100000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def smallestValue(n: int) -> int:\n    def prime_sum(v: int) -> int:\n        total = 0\n        x = v\n        p = 2\n        while p * p <= x:\n            while x % p == 0:\n                total += p\n                x //= p\n            p += 1\n        if x > 1:\n            total += x\n        return total\n\n    cur = n\n    while True:\n        nxt = prime_sum(cur)\n        if nxt == cur:\n            return cur\n        cur = nxt`,
        javascript: `var smallestValue = function(n) {\n    var primeSum = function(v) {\n        var total = 0, x = v;\n        for (var p = 2; p * p <= x; p++) {\n            while (x % p === 0) { total += p; x = x / p; }\n        }\n        if (x > 1) total += x;\n        return total;\n    };\n    var cur = n;\n    for (;;) {\n        var next = primeSum(cur);\n        if (next === cur) return cur;\n        cur = next;\n    }\n};`,
        typescript: `function smallestValue(n: number): number {\n    var primeSum = function(v: number): number {\n        var total = 0, x = v;\n        for (var p = 2; p * p <= x; p++) {\n            while (x % p === 0) { total += p; x = x / p; }\n        }\n        if (x > 1) total += x;\n        return total;\n    };\n    var cur = n;\n    for (;;) {\n        var next = primeSum(cur);\n        if (next === cur) return cur;\n        cur = next;\n    }\n}`,
        java: `public static int smallestValue(int n) {\n    int cur = n;\n    while (true) {\n        int next = primeSumOf(cur);\n        if (next == cur) return cur;\n        cur = next;\n    }\n}\n\nstatic int primeSumOf(int v) {\n    int total = 0, x = v;\n    for (int p = 2; (long) p * p <= x; p++) {\n        while (x % p == 0) { total += p; x /= p; }\n    }\n    if (x > 1) total += x;\n    return total;\n}`,
        cpp: `static int primeSumOf(int v) {\n    int total = 0, x = v;\n    for (int p = 2; (long long) p * p <= x; p++) {\n        while (x % p == 0) { total += p; x /= p; }\n    }\n    if (x > 1) total += x;\n    return total;\n}\n\nint smallestValue(int n) {\n    int cur = n;\n    while (true) {\n        int next = primeSumOf(cur);\n        if (next == cur) return cur;\n        cur = next;\n    }\n}`,
        c: `static int primeSumOfC(int v) {\n    int total = 0, x = v;\n    for (int p = 2; (long long) p * p <= x; p++) {\n        while (x % p == 0) { total += p; x /= p; }\n    }\n    if (x > 1) total += x;\n    return total;\n}\n\nint smallestValue(int n) {\n    int cur = n;\n    for (;;) {\n        int next = primeSumOfC(cur);\n        if (next == cur) return cur;\n        cur = next;\n    }\n}`,
        csharp: `public static int SmallestValue(int n)\n{\n    int cur = n;\n    while (true)\n    {\n        int next = PrimeSumOf(cur);\n        if (next == cur) return cur;\n        cur = next;\n    }\n}\n\nstatic int PrimeSumOf(int v)\n{\n    int total = 0, x = v;\n    for (int p = 2; (long) p * p <= x; p++)\n    {\n        while (x % p == 0) { total += p; x /= p; }\n    }\n    if (x > 1) total += x;\n    return total;\n}`,
        go: `func smallestValue(n int) int {\n\tprimeSum := func(v int) int {\n\t\ttotal, x := 0, v\n\t\tfor p := 2; p*p <= x; p++ {\n\t\t\tfor x%p == 0 {\n\t\t\t\ttotal += p\n\t\t\t\tx /= p\n\t\t\t}\n\t\t}\n\t\tif x > 1 {\n\t\t\ttotal += x\n\t\t}\n\t\treturn total\n\t}\n\tcur := n\n\tfor {\n\t\tnext := primeSum(cur)\n\t\tif next == cur {\n\t\t\treturn cur\n\t\t}\n\t\tcur = next\n\t}\n}`,
        kotlin: `fun smallestValue(n: Int): Int {\n    fun primeSum(v: Int): Int {\n        var total = 0\n        var x = v\n        var p = 2\n        while (p * p <= x) {\n            while (x % p == 0) {\n                total += p\n                x /= p\n            }\n            p++\n        }\n        if (x > 1) total += x\n        return total\n    }\n    var cur = n\n    while (true) {\n        val next = primeSum(cur)\n        if (next == cur) return cur\n        cur = next\n    }\n}`,
        swift: `func smallestValue(_ n: Int) -> Int {\n    func primeSum(_ v: Int) -> Int {\n        var total = 0\n        var x = v\n        var p = 2\n        while p * p <= x {\n            while x % p == 0 {\n                total += p\n                x /= p\n            }\n            p += 1\n        }\n        if x > 1 { total += x }\n        return total\n    }\n    var cur = n\n    while true {\n        let next = primeSum(cur)\n        if next == cur { return cur }\n        cur = next\n    }\n}`,
        rust: `fn smallestValue(n: i32) -> i32 {\n    fn prime_sum(v: i32) -> i32 {\n        let mut total = 0;\n        let mut x = v;\n        let mut p = 2;\n        while p * p <= x {\n            while x % p == 0 {\n                total += p;\n                x /= p;\n            }\n            p += 1;\n        }\n        if x > 1 {\n            total += x;\n        }\n        total\n    }\n    let mut cur = n;\n    loop {\n        let next = prime_sum(cur);\n        if next == cur {\n            return cur;\n        }\n        cur = next;\n    }\n}`,
        php: `function smallestValue($n) {\n    $primeSum = function($v) {\n        $total = 0;\n        $x = $v;\n        for ($p = 2; $p * $p <= $x; $p++) {\n            while ($x % $p === 0) { $total += $p; $x = intdiv($x, $p); }\n        }\n        if ($x > 1) $total += $x;\n        return $total;\n    };\n    $cur = $n;\n    while (true) {\n        $next = $primeSum($cur);\n        if ($next === $cur) return $cur;\n        $cur = $next;\n    }\n}`,
        ruby: `def smallestValue(n)\n  prime_sum = lambda do |v|\n    total = 0\n    x = v\n    p = 2\n    while p * p <= x\n      while x % p == 0\n        total += p\n        x /= p\n      end\n      p += 1\n    end\n    total += x if x > 1\n    total\n  end\n  cur = n\n  loop do\n    nxt = prime_sum.call(cur)\n    return cur if nxt == cur\n    cur = nxt\n  end\nend`,
      },
    };
  })(),

  // ── Minimum Number of Operations to Make Array Empty (LC 2870) ──
  (() => {
    const ref = (nums: number[]) => {
      const count: Record<string, number> = {};
      for (const x of nums) count[String(x)] = (count[String(x)] === undefined ? 0 : count[String(x)]) + 1;
      let ops = 0;
      for (const k of Object.keys(count)) {
        const f = count[k];
        if (f === 1) return -1;
        ops += Math.floor((f + 2) / 3);
      }
      return ops;
    };
    return {
      slug: "minimum-number-of-operations-to-make-array-empty",
      title: "Minimum Number of Operations to Make Array Empty",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Greedy", "Counting", "Amazon", "Google", "Swiggy"],
      signature: { funcName: "minOperationsEmpty", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You may repeatedly remove **two** elements with equal value, or **three** elements with equal value.\n\nReturn the minimum number of operations that empties the array, or `-1` if it cannot be emptied.",
        [
          { in: "nums = [2,3,3,2,2,4,2,3,4]", out: "4", note: "Four 2s, three 3s and two 4s take 2 + 1 + 1 operations." },
          { in: "nums = [2,1,2,2,3,3]", out: "-1", note: "The single 1 can never be removed." },
          { in: "nums = [14,12,14,14,12,14,14,12,12,12,12,14,14,12,14,14,14,12,12]", out: "7" },
        ],
        ["2 <= nums.length <= 100000", "1 <= nums[i] <= 1000000"]),
      hints: [
        "Values never mix, so each distinct value is an independent subproblem: empty a pile of `f` identical items using twos and threes.",
        "A pile of size 1 is impossible; every other size is achievable.",
        "Using as many threes as possible is optimal, and the count works out to `ceil(f / 3)`.",
      ],
      editorial: explain({
        idea: "Group by value and solve each pile independently. Emptying a pile of `f` items with moves of 2 and 3 takes `ceil(f / 3)` operations, and only `f = 1` is impossible.",
        steps: [
          "Tally the frequency of each distinct value.",
          "If any frequency is exactly `1`, return `-1`.",
          "Otherwise add `ceil(f / 3)` for every frequency and return the sum.",
        ],
        why: "Each operation removes at most 3 items, so at least `ceil(f / 3)` are needed. That many suffice: write `f = 3q + r`. For `r = 0` use `q` threes; for `r = 1` (and `f >= 4`) use `q - 1` threes and two twos, which is `q + 1 = ceil(f/3)`; for `r = 2` use `q` threes and one two, again `q + 1`. Only `f = 1` has no decomposition.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "`ceil(f / 3)` in integer arithmetic is `(f + 2) / 3`, not `f / 3 + 1`.",
          "Returning `-1` only at the end after summing wastes work but is also fine; returning `0` for an impossible input is not.",
          "Greedily using twos first is not optimal — threes remove more per operation.",
        ],
      }),
      examples: [
        { input: "[2,3,3,2,2,4,2,3,4]", expectedOutput: "4" },
        { input: "[2,1,2,2,3,3]", expectedOutput: "-1" },
        { input: "[14,12,14,14,12,14,14,12,12,12,12,14,14,12,14,14,14,12,12]", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const nums: number[] = [];
        const values = ri(rng, 1, 6);
        for (let v = 1; v <= values; v++) {
          const f = rng() < 0.2 ? 1 : ri(rng, 2, 12);
          for (let t = 0; t < f; t++) nums.push(v * 3);
        }
        return { input: fmtIntArr(shuffle(rng, nums)), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minOperationsEmpty(nums: List[int]) -> int:\n    count = {}\n    for x in nums:\n        count[x] = count.get(x, 0) + 1\n    ops = 0\n    for f in count.values():\n        if f == 1:\n            return -1\n        ops += (f + 2) // 3\n    return ops`,
        javascript: `var minOperationsEmpty = function(nums) {\n    var count = {};\n    for (var i = 0; i < nums.length; i++) {\n        var k = String(nums[i]);\n        count[k] = (count[k] === undefined ? 0 : count[k]) + 1;\n    }\n    var ops = 0;\n    var keys = Object.keys(count);\n    for (var j = 0; j < keys.length; j++) {\n        var f = count[keys[j]];\n        if (f === 1) return -1;\n        ops += Math.floor((f + 2) / 3);\n    }\n    return ops;\n};`,
        typescript: `function minOperationsEmpty(nums: number[]): number {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var k = String(nums[i]);\n        count[k] = (count[k] === undefined ? 0 : count[k]) + 1;\n    }\n    var ops = 0;\n    var keys = Object.keys(count);\n    for (var j = 0; j < keys.length; j++) {\n        var f = count[keys[j]];\n        if (f === 1) return -1;\n        ops += Math.floor((f + 2) / 3);\n    }\n    return ops;\n}`,
        java: `public static int minOperationsEmpty(int[] nums) {\n    Map<Integer, Integer> count = new HashMap<>();\n    for (int x : nums) count.put(x, count.getOrDefault(x, 0) + 1);\n    int ops = 0;\n    for (int f : count.values()) {\n        if (f == 1) return -1;\n        ops += (f + 2) / 3;\n    }\n    return ops;\n}`,
        cpp: `int minOperationsEmpty(vector<int>& nums) {\n    unordered_map<int, int> count;\n    for (int x : nums) count[x]++;\n    int ops = 0;\n    for (auto& e : count) {\n        if (e.second == 1) return -1;\n        ops += (e.second + 2) / 3;\n    }\n    return ops;\n}`,
        c: `static int cmpEmptyAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint minOperationsEmpty(int* nums, int numsSize) {\n    int* s = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, (size_t) numsSize, sizeof(int), cmpEmptyAsc);\n    int ops = 0;\n    int i = 0;\n    while (i < numsSize) {\n        int j = i;\n        while (j < numsSize && s[j] == s[i]) j++;\n        int f = j - i;\n        if (f == 1) { free(s); return -1; }\n        ops += (f + 2) / 3;\n        i = j;\n    }\n    free(s);\n    return ops;\n}`,
        csharp: `public static int MinOperationsEmpty(int[] nums)\n{\n    var count = new Dictionary<int, int>();\n    foreach (int x in nums)\n    {\n        int c;\n        count[x] = (count.TryGetValue(x, out c) ? c : 0) + 1;\n    }\n    int ops = 0;\n    foreach (int f in count.Values)\n    {\n        if (f == 1) return -1;\n        ops += (f + 2) / 3;\n    }\n    return ops;\n}`,
        go: `func minOperationsEmpty(nums []int) int {\n\tcount := map[int]int{}\n\tfor _, x := range nums {\n\t\tcount[x]++\n\t}\n\tops := 0\n\tfor _, f := range count {\n\t\tif f == 1 {\n\t\t\treturn -1\n\t\t}\n\t\tops += (f + 2) / 3\n\t}\n\treturn ops\n}`,
        kotlin: `fun minOperationsEmpty(nums: IntArray): Int {\n    val count = HashMap<Int, Int>()\n    for (x in nums) count[x] = (count[x] ?: 0) + 1\n    var ops = 0\n    for (f in count.values) {\n        if (f == 1) return -1\n        ops += (f + 2) / 3\n    }\n    return ops\n}`,
        swift: `func minOperationsEmpty(_ nums: [Int]) -> Int {\n    var count: [Int: Int] = [:]\n    for x in nums { count[x] = (count[x] ?? 0) + 1 }\n    var ops = 0\n    for f in count.values {\n        if f == 1 { return -1 }\n        ops += (f + 2) / 3\n    }\n    return ops\n}`,
        rust: `fn minOperationsEmpty(nums: Vec<i32>) -> i32 {\n    let mut count: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();\n    for &x in nums.iter() {\n        *count.entry(x).or_insert(0) += 1;\n    }\n    let mut ops = 0i32;\n    for (_, &f) in count.iter() {\n        if f == 1 {\n            return -1;\n        }\n        ops += (f + 2) / 3;\n    }\n    ops\n}`,
        php: `function minOperationsEmpty($nums) {\n    $count = array();\n    foreach ($nums as $x) $count[$x] = isset($count[$x]) ? $count[$x] + 1 : 1;\n    $ops = 0;\n    foreach ($count as $f) {\n        if ($f === 1) return -1;\n        $ops += intdiv($f + 2, 3);\n    }\n    return $ops;\n}`,
        ruby: `def minOperationsEmpty(nums)\n  count = Hash.new(0)\n  nums.each { |x| count[x] += 1 }\n  ops = 0\n  count.each_value do |f|\n    return -1 if f == 1\n    ops += (f + 2) / 3\n  end\n  ops\nend`,
      },
    };
  })(),

  // ── Prime Subtraction Operation (LC 2601) ───────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const LIMIT = 1001;
      const isComposite = new Array(LIMIT).fill(false);
      const primes: number[] = [];
      for (let p = 2; p < LIMIT; p++) {
        if (!isComposite[p]) {
          primes.push(p);
          for (let m = p * p; m < LIMIT; m += p) isComposite[m] = true;
        }
      }
      let prev = 0;
      for (let i = 0; i < nums.length; i++) {
        let best = 0;
        for (const p of primes) {
          if (p >= nums[i]) break;
          if (nums[i] - p > prev) best = p;
        }
        const value = nums[i] - best;
        if (value <= prev) return false;
        prev = value;
      }
      return true;
    };
    return {
      slug: "prime-subtraction-operation",
      title: "Prime Subtraction Operation",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Greedy", "Number Theory", "Amazon", "Google", "Adobe"],
      signature: { funcName: "primeSubOperation", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "You may pick any index `i` **at most once** and subtract from `nums[i]` any prime strictly smaller than `nums[i]`.\n\nReturn `true` if these operations can make `nums` **strictly increasing**.",
        [
          { in: "nums = [4,9,6,10]", out: "true", note: "Subtract 3 from 4 to get 1, subtract 7 from 9 to get 2, and leave 6 and 10." },
          { in: "nums = [6,8,11,12]", out: "true", note: "The array is already strictly increasing." },
          { in: "nums = [5,8,3]", out: "false", note: "3 can only shrink, and it is already below 8." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 1000"]),
      hints: [
        "Sweep left to right making each element as **small** as possible while staying above its predecessor.",
        "That means subtracting the **largest** prime `p < nums[i]` for which `nums[i] - p` still exceeds the previous value.",
        "A sieve up to 1000 gives you the primes once, up front.",
      ],
      editorial: explain({
        idea: "Greedy left to right: minimising each element leaves the most room for everything after it. For the current element, that means subtracting the largest legal prime that keeps it above its predecessor.",
        steps: [
          "Sieve the primes below 1000 once.",
          "Track `prev`, the value settled on for the previous index, starting at `0`.",
          "For each element, scan the primes in increasing order and remember the largest `p < nums[i]` with `nums[i] - p > prev`.",
          "Apply it; if the result is still not greater than `prev`, return `false`. Otherwise set `prev` to it.",
        ],
        why: "Exchange argument: suppose a valid assignment leaves some element larger than the greedy choice. Replacing it with the greedy (smaller) value keeps it above its predecessor by construction and can only relax the constraint on the next element, so the greedy prefix extends to a full solution whenever one exists.",
        time: "O(n · π(1000))",
        space: "O(1000)",
        pitfalls: [
          "Subtracting the largest prime below `nums[i]` unconditionally can push the value **below** `prev` and wrongly report failure.",
          "The prime must be **strictly** smaller than `nums[i]`, so the result is always at least 1.",
          "Each index may be operated on at most once, which is why the greedy considers a single subtraction per element.",
        ],
      }),
      examples: [
        { input: "[4,9,6,10]", expectedOutput: "true" },
        { input: "[6,8,11,12]", expectedOutput: "true" },
        { input: "[5,8,3]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const hi = rng() < 0.5 ? 20 : 1000;
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef primeSubOperation(nums: List[int]) -> bool:\n    LIMIT = 1001\n    composite = [False] * LIMIT\n    primes = []\n    for p in range(2, LIMIT):\n        if not composite[p]:\n            primes.append(p)\n            for m in range(p * p, LIMIT, p):\n                composite[m] = True\n    prev = 0\n    for x in nums:\n        best = 0\n        for p in primes:\n            if p >= x:\n                break\n            if x - p > prev:\n                best = p\n        value = x - best\n        if value <= prev:\n            return False\n        prev = value\n    return True`,
        javascript: `var primeSubOperation = function(nums) {\n    var LIMIT = 1001;\n    var composite = [];\n    for (var t = 0; t < LIMIT; t++) composite.push(false);\n    var primes = [];\n    for (var p = 2; p < LIMIT; p++) {\n        if (!composite[p]) {\n            primes.push(p);\n            for (var m = p * p; m < LIMIT; m += p) composite[m] = true;\n        }\n    }\n    var prev = 0;\n    for (var i = 0; i < nums.length; i++) {\n        var best = 0;\n        for (var j = 0; j < primes.length; j++) {\n            if (primes[j] >= nums[i]) break;\n            if (nums[i] - primes[j] > prev) best = primes[j];\n        }\n        var value = nums[i] - best;\n        if (value <= prev) return false;\n        prev = value;\n    }\n    return true;\n};`,
        typescript: `function primeSubOperation(nums: number[]): boolean {\n    var LIMIT = 1001;\n    var composite: boolean[] = [];\n    for (var t = 0; t < LIMIT; t++) composite.push(false);\n    var primes: number[] = [];\n    for (var p = 2; p < LIMIT; p++) {\n        if (!composite[p]) {\n            primes.push(p);\n            for (var m = p * p; m < LIMIT; m += p) composite[m] = true;\n        }\n    }\n    var prev = 0;\n    for (var i = 0; i < nums.length; i++) {\n        var best = 0;\n        for (var j = 0; j < primes.length; j++) {\n            if (primes[j] >= nums[i]) break;\n            if (nums[i] - primes[j] > prev) best = primes[j];\n        }\n        var value = nums[i] - best;\n        if (value <= prev) return false;\n        prev = value;\n    }\n    return true;\n}`,
        java: `public static boolean primeSubOperation(int[] nums) {\n    final int LIMIT = 1001;\n    boolean[] composite = new boolean[LIMIT];\n    List<Integer> primes = new ArrayList<>();\n    for (int p = 2; p < LIMIT; p++) {\n        if (!composite[p]) {\n            primes.add(p);\n            for (int m = p * p; m < LIMIT; m += p) composite[m] = true;\n        }\n    }\n    int prev = 0;\n    for (int x : nums) {\n        int best = 0;\n        for (int p : primes) {\n            if (p >= x) break;\n            if (x - p > prev) best = p;\n        }\n        int value = x - best;\n        if (value <= prev) return false;\n        prev = value;\n    }\n    return true;\n}`,
        cpp: `bool primeSubOperation(vector<int>& nums) {\n    const int LIMIT = 1001;\n    vector<bool> composite(LIMIT, false);\n    vector<int> primes;\n    for (int p = 2; p < LIMIT; p++) {\n        if (!composite[p]) {\n            primes.push_back(p);\n            for (int m = p * p; m < LIMIT; m += p) composite[m] = true;\n        }\n    }\n    int prev = 0;\n    for (int x : nums) {\n        int best = 0;\n        for (int p : primes) {\n            if (p >= x) break;\n            if (x - p > prev) best = p;\n        }\n        int value = x - best;\n        if (value <= prev) return false;\n        prev = value;\n    }\n    return true;\n}`,
        c: `bool primeSubOperation(int* nums, int numsSize) {\n    const int LIMIT = 1001;\n    int* composite = (int*) calloc((size_t) LIMIT, sizeof(int));\n    int* primes = (int*) malloc((size_t) LIMIT * sizeof(int));\n    int pc = 0;\n    for (int p = 2; p < LIMIT; p++) {\n        if (!composite[p]) {\n            primes[pc++] = p;\n            for (int m = p * p; m < LIMIT; m += p) composite[m] = 1;\n        }\n    }\n    int prev = 0;\n    bool ok = true;\n    for (int i = 0; i < numsSize && ok; i++) {\n        int best = 0;\n        for (int j = 0; j < pc; j++) {\n            if (primes[j] >= nums[i]) break;\n            if (nums[i] - primes[j] > prev) best = primes[j];\n        }\n        int value = nums[i] - best;\n        if (value <= prev) ok = false;\n        else prev = value;\n    }\n    free(composite);\n    free(primes);\n    return ok;\n}`,
        csharp: `public static bool PrimeSubOperation(int[] nums)\n{\n    const int LIMIT = 1001;\n    bool[] composite = new bool[LIMIT];\n    var primes = new List<int>();\n    for (int p = 2; p < LIMIT; p++)\n    {\n        if (!composite[p])\n        {\n            primes.Add(p);\n            for (int m = p * p; m < LIMIT; m += p) composite[m] = true;\n        }\n    }\n    int prev = 0;\n    foreach (int x in nums)\n    {\n        int best = 0;\n        foreach (int p in primes)\n        {\n            if (p >= x) break;\n            if (x - p > prev) best = p;\n        }\n        int value = x - best;\n        if (value <= prev) return false;\n        prev = value;\n    }\n    return true;\n}`,
        go: `func primeSubOperation(nums []int) bool {\n\tconst limit = 1001\n\tcomposite := make([]bool, limit)\n\tprimes := []int{}\n\tfor p := 2; p < limit; p++ {\n\t\tif !composite[p] {\n\t\t\tprimes = append(primes, p)\n\t\t\tfor m := p * p; m < limit; m += p {\n\t\t\t\tcomposite[m] = true\n\t\t\t}\n\t\t}\n\t}\n\tprev := 0\n\tfor _, x := range nums {\n\t\tbest := 0\n\t\tfor _, p := range primes {\n\t\t\tif p >= x {\n\t\t\t\tbreak\n\t\t\t}\n\t\t\tif x-p > prev {\n\t\t\t\tbest = p\n\t\t\t}\n\t\t}\n\t\tvalue := x - best\n\t\tif value <= prev {\n\t\t\treturn false\n\t\t}\n\t\tprev = value\n\t}\n\treturn true\n}`,
        kotlin: `fun primeSubOperation(nums: IntArray): Boolean {\n    val limit = 1001\n    val composite = BooleanArray(limit)\n    val primes = ArrayList<Int>()\n    for (p in 2 until limit) {\n        if (!composite[p]) {\n            primes.add(p)\n            var m = p * p\n            while (m < limit) {\n                composite[m] = true\n                m += p\n            }\n        }\n    }\n    var prev = 0\n    for (x in nums) {\n        var best = 0\n        for (p in primes) {\n            if (p >= x) break\n            if (x - p > prev) best = p\n        }\n        val value = x - best\n        if (value <= prev) return false\n        prev = value\n    }\n    return true\n}`,
        swift: `func primeSubOperation(_ nums: [Int]) -> Bool {\n    let limit = 1001\n    var composite = [Bool](repeating: false, count: limit)\n    var primes: [Int] = []\n    for p in 2..<limit {\n        if !composite[p] {\n            primes.append(p)\n            var m = p * p\n            while m < limit {\n                composite[m] = true\n                m += p\n            }\n        }\n    }\n    var prev = 0\n    for x in nums {\n        var best = 0\n        for p in primes {\n            if p >= x { break }\n            if x - p > prev { best = p }\n        }\n        let value = x - best\n        if value <= prev { return false }\n        prev = value\n    }\n    return true\n}`,
        rust: `fn primeSubOperation(nums: Vec<i32>) -> bool {\n    let limit = 1001usize;\n    let mut composite = vec![false; limit];\n    let mut primes: Vec<i32> = Vec::new();\n    for p in 2..limit {\n        if !composite[p] {\n            primes.push(p as i32);\n            let mut m = p * p;\n            while m < limit {\n                composite[m] = true;\n                m += p;\n            }\n        }\n    }\n    let mut prev = 0i32;\n    for &x in nums.iter() {\n        let mut best = 0i32;\n        for &p in primes.iter() {\n            if p >= x {\n                break;\n            }\n            if x - p > prev {\n                best = p;\n            }\n        }\n        let value = x - best;\n        if value <= prev {\n            return false;\n        }\n        prev = value;\n    }\n    true\n}`,
        php: `function primeSubOperation($nums) {\n    $limit = 1001;\n    $composite = array_fill(0, $limit, false);\n    $primes = array();\n    for ($p = 2; $p < $limit; $p++) {\n        if (!$composite[$p]) {\n            $primes[] = $p;\n            for ($m = $p * $p; $m < $limit; $m += $p) $composite[$m] = true;\n        }\n    }\n    $prev = 0;\n    foreach ($nums as $x) {\n        $best = 0;\n        foreach ($primes as $p) {\n            if ($p >= $x) break;\n            if ($x - $p > $prev) $best = $p;\n        }\n        $value = $x - $best;\n        if ($value <= $prev) return false;\n        $prev = $value;\n    }\n    return true;\n}`,
        ruby: `def primeSubOperation(nums)\n  limit = 1001\n  composite = Array.new(limit, false)\n  primes = []\n  (2...limit).each do |p|\n    next if composite[p]\n    primes << p\n    m = p * p\n    while m < limit\n      composite[m] = true\n      m += p\n    end\n  end\n  prev = 0\n  nums.each do |x|\n    best = 0\n    primes.each do |p|\n      break if p >= x\n      best = p if x - p > prev\n    end\n    value = x - best\n    return false if value <= prev\n    prev = value\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Maximum Product After K Increments (LC 2233) ────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (nums: number[], k: number) => {
      const a = nums.slice();
      for (let t = 0; t < k; t++) {
        let lo = 0;
        for (let i = 1; i < a.length; i++) { if (a[i] < a[lo]) lo = i; }
        a[lo]++;
      }
      let product = 1;
      for (const x of a) product = (product * x) % MOD;
      return product;
    };
    return {
      slug: "maximum-product-after-k-increments",
      title: "Maximum Product After K Increments",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Heap", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "maximumProduct", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You may perform `k` operations; each adds `1` to any single element of `nums`.\n\nReturn the maximum possible product of all elements after the `k` operations, modulo `10^9 + 7`.",
        [
          { in: "nums = [0,4], k = 5", out: "20", note: "Spending all five on the 0 gives [5,4], a product of 20." },
          { in: "nums = [6,3,3,2], k = 2", out: "216", note: "Raising the 2 and then one 3 gives [6,4,3,3]." },
          { in: "nums = [1], k = 3", out: "4" },
        ],
        ["1 <= nums.length <= 1000", "0 <= nums[i] <= 1000", "0 <= k <= 1000"]),
      hints: [
        "Always spend the next increment on the **smallest** element.",
        "Raising the smallest multiplies the product by the largest relative factor, so it beats raising anything else.",
        "At these limits a plain scan for the minimum each round is fast enough; a min-heap is the answer at the real limits.",
      ],
      editorial: explain({
        idea: "Levelling up the smallest element is always optimal. Adding 1 to a value `v` scales the product by `(v + 1) / v`, which is largest when `v` is smallest — so a greedy that always feeds the minimum maximises the product.",
        steps: [
          "Repeat `k` times: find the current minimum and increment it.",
          "Multiply the final values together, reducing modulo `10^9 + 7` as you go.",
        ],
        why: "Exchange argument: if an optimal plan gives an increment to `b` while some `a < b` could take it instead, moving that increment to `a` changes the product by the factor `((a+1)·b) / (a·(b+1))`, which exceeds 1 exactly when `a < b`. So no optimal plan ever prefers the larger element.",
        time: "O(k · n) here; O((n + k) log n) with a heap",
        space: "O(n)",
        pitfalls: [
          "Reducing modulo before comparing values would break the greedy — the modulo belongs only to the final product.",
          "A zero in the array makes the product zero unless it is raised, which the greedy does first anyway.",
          "Spreading increments evenly is not optimal when the values start far apart.",
        ],
      }),
      examples: [
        { input: "[0,4]\n5", expectedOutput: "20" },
        { input: "[6,3,3,2]\n2", expectedOutput: "216" },
        { input: "[1]\n3", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 12) }, () => ri(rng, 0, rng() < 0.5 ? 6 : 1000));
        const k = ri(rng, 0, 60);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumProduct(nums: List[int], k: int) -> int:\n    MOD = 1000000007\n    a = list(nums)\n    for _ in range(k):\n        lo = 0\n        for i in range(1, len(a)):\n            if a[i] < a[lo]:\n                lo = i\n        a[lo] += 1\n    product = 1\n    for x in a:\n        product = product * x % MOD\n    return product`,
        javascript: `var maximumProduct = function(nums, k) {\n    var MOD = 1000000007;\n    var a = nums.slice();\n    for (var t = 0; t < k; t++) {\n        var lo = 0;\n        for (var i = 1; i < a.length; i++) {\n            if (a[i] < a[lo]) lo = i;\n        }\n        a[lo]++;\n    }\n    var product = 1;\n    for (var j = 0; j < a.length; j++) product = (product * a[j]) % MOD;\n    return product;\n};`,
        typescript: `function maximumProduct(nums: number[], k: number): number {\n    var MOD = 1000000007;\n    var a = nums.slice();\n    for (var t = 0; t < k; t++) {\n        var lo = 0;\n        for (var i = 1; i < a.length; i++) {\n            if (a[i] < a[lo]) lo = i;\n        }\n        a[lo]++;\n    }\n    var product = 1;\n    for (var j = 0; j < a.length; j++) product = (product * a[j]) % MOD;\n    return product;\n}`,
        java: `public static int maximumProduct(int[] nums, int k) {\n    final long MOD = 1000000007L;\n    int[] a = nums.clone();\n    for (int t = 0; t < k; t++) {\n        int lo = 0;\n        for (int i = 1; i < a.length; i++) {\n            if (a[i] < a[lo]) lo = i;\n        }\n        a[lo]++;\n    }\n    long product = 1;\n    for (int x : a) product = product * x % MOD;\n    return (int) product;\n}`,
        cpp: `int maximumProduct(vector<int>& nums, int k) {\n    const long long MOD = 1000000007LL;\n    vector<int> a = nums;\n    for (int t = 0; t < k; t++) {\n        int lo = 0;\n        for (int i = 1; i < (int) a.size(); i++) {\n            if (a[i] < a[lo]) lo = i;\n        }\n        a[lo]++;\n    }\n    long long product = 1;\n    for (int x : a) product = product * x % MOD;\n    return (int) product;\n}`,
        c: `int maximumProduct(int* nums, int numsSize, int k) {\n    const long long MOD = 1000000007LL;\n    int* a = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    for (int t = 0; t < k; t++) {\n        int lo = 0;\n        for (int i = 1; i < numsSize; i++) {\n            if (a[i] < a[lo]) lo = i;\n        }\n        a[lo]++;\n    }\n    long long product = 1;\n    for (int i = 0; i < numsSize; i++) product = product * a[i] % MOD;\n    free(a);\n    return (int) product;\n}`,
        csharp: `public static int MaximumProduct(int[] nums, int k)\n{\n    const long MOD = 1000000007L;\n    int[] a = (int[]) nums.Clone();\n    for (int t = 0; t < k; t++)\n    {\n        int lo = 0;\n        for (int i = 1; i < a.Length; i++)\n        {\n            if (a[i] < a[lo]) lo = i;\n        }\n        a[lo]++;\n    }\n    long product = 1;\n    foreach (int x in a) product = product * x % MOD;\n    return (int) product;\n}`,
        go: `func maximumProduct(nums []int, k int) int {\n\tconst mod = 1000000007\n\ta := append([]int{}, nums...)\n\tfor t := 0; t < k; t++ {\n\t\tlo := 0\n\t\tfor i := 1; i < len(a); i++ {\n\t\t\tif a[i] < a[lo] {\n\t\t\t\tlo = i\n\t\t\t}\n\t\t}\n\t\ta[lo]++\n\t}\n\tproduct := 1\n\tfor _, x := range a {\n\t\tproduct = product * x % mod\n\t}\n\treturn product\n}`,
        kotlin: `fun maximumProduct(nums: IntArray, k: Int): Int {\n    val mod = 1000000007L\n    val a = nums.copyOf()\n    for (t in 0 until k) {\n        var lo = 0\n        for (i in 1 until a.size) {\n            if (a[i] < a[lo]) lo = i\n        }\n        a[lo]++\n    }\n    var product = 1L\n    for (x in a) product = product * x % mod\n    return product.toInt()\n}`,
        swift: `func maximumProduct(_ nums: [Int], _ k: Int) -> Int {\n    let mod = 1000000007\n    var a = nums\n    for _ in 0..<max(k, 0) {\n        var lo = 0\n        for i in 1..<max(a.count, 1) where i < a.count {\n            if a[i] < a[lo] { lo = i }\n        }\n        a[lo] += 1\n    }\n    var product = 1\n    for x in a { product = product * x % mod }\n    return product\n}`,
        rust: `fn maximumProduct(nums: Vec<i32>, k: i32) -> i32 {\n    let md: i64 = 1000000007;\n    let mut a = nums.clone();\n    for _ in 0..k {\n        let mut lo = 0usize;\n        for i in 1..a.len() {\n            if a[i] < a[lo] {\n                lo = i;\n            }\n        }\n        a[lo] += 1;\n    }\n    let mut product: i64 = 1;\n    for &x in a.iter() {\n        product = product * x as i64 % md;\n    }\n    product as i32\n}`,
        php: `function maximumProduct($nums, $k) {\n    $mod = 1000000007;\n    $a = $nums;\n    for ($t = 0; $t < $k; $t++) {\n        $lo = 0;\n        for ($i = 1; $i < count($a); $i++) {\n            if ($a[$i] < $a[$lo]) $lo = $i;\n        }\n        $a[$lo]++;\n    }\n    $product = 1;\n    foreach ($a as $x) $product = $product * $x % $mod;\n    return $product;\n}`,
        ruby: `def maximumProduct(nums, k)\n  mod = 1000000007\n  a = nums.dup\n  k.times do\n    lo = 0\n    (1...a.length).each { |i| lo = i if a[i] < a[lo] }\n    a[lo] += 1\n  end\n  product = 1\n  a.each { |x| product = product * x % mod }\n  product\nend`,
      },
    };
  })(),

  // ── Closest Divisors (LC 1362) ──────────────────────────────────
  (() => {
    const ref = (num: number) => {
      let best: number[] = [];
      let bestGap = Infinity;
      for (const target of [num + 1, num + 2]) {
        for (let w = Math.floor(Math.sqrt(target)) + 2; w >= 1; w--) {
          if (w * w > target) continue;
          if (target % w !== 0) continue;
          const other = target / w;
          if (other - w < bestGap) { bestGap = other - w; best = [w, other]; }
          break;
        }
      }
      return best;
    };
    return {
      slug: "closest-divisors",
      title: "Closest Divisors",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Number Theory", "Amazon", "Adobe", "Oracle"],
      signature: { funcName: "closestDivisors", params: [{ name: "num", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Find two integers whose product is either `num + 1` or `num + 2` and whose difference is as small as possible.\n\nReturn them in **ascending** order.",
        [
          { in: "num = 8", out: "[3,3]", note: "9 = 3 × 3 is a perfect square, so the gap is 0." },
          { in: "num = 123", out: "[5,25]", note: "125 = 5 × 25 has gap 20, beating 124 = 4 × 31 with gap 27." },
          { in: "num = 999", out: "[25,40]", note: "1000 = 25 × 40 has gap 15; the best factorisation of 1001 is 13 × 77." },
        ],
        ["1 <= num <= 10000000"]),
      hints: [
        "Solve the sub-problem 'closest factor pair of `t`' and run it for `t = num + 1` and `t = num + 2`.",
        "The closest pair straddles `sqrt(t)`, so walk down from `floor(sqrt(t))` to the first divisor.",
        "Then take whichever of the two targets gives the smaller gap.",
      ],
      editorial: explain({
        idea: "There are only two candidate products. For each, the most balanced factor pair is found by walking down from the square root to the first divisor; then compare the two gaps.",
        steps: [
          "For `t` in `{num + 1, num + 2}`: set `w = floor(sqrt(t))` and decrement until `t % w == 0`.",
          "The pair is `[w, t / w]`, with gap `t / w - w`.",
          "Return whichever pair has the smaller gap.",
        ],
        why: "For a fixed product, the gap `t/d - d` shrinks as `d` rises towards `sqrt(t)`, so the largest divisor at or below the square root is the balanced one. Checking both targets is exhaustive because the statement allows exactly those two.",
        time: "O(sqrt(num))",
        space: "O(1)",
        pitfalls: [
          "Floating-point `sqrt` can overshoot by one on a perfect square — guard with `while (w * w > t) w--`.",
          "Returning the pair for `num + 1` without comparing against `num + 2` misses the better answer roughly half the time.",
          "`w = 1` always divides, so the loop always terminates.",
        ],
      }),
      examples: [
        { input: "8", expectedOutput: "[3,3]" },
        { input: "123", expectedOutput: "[5,25]" },
        { input: "999", expectedOutput: "[25,40]" },
      ],
      gen: (rng: Rng) => {
        const num = rng() < 0.5 ? ri(rng, 1, 2000) : ri(rng, 1, 10000000);
        return { input: String(num), expectedOutput: fmtIntArr(ref(num)) };
      },
      solutions: {
        python: `from typing import List\n\ndef closestDivisors(num: int) -> List[int]:\n    def best_pair(t: int) -> List[int]:\n        w = int(t ** 0.5)\n        while w * w > t:\n            w -= 1\n        while t % w != 0:\n            w -= 1\n        return [w, t // w]\n\n    a = best_pair(num + 1)\n    b = best_pair(num + 2)\n    return a if a[1] - a[0] <= b[1] - b[0] else b`,
        javascript: `var closestDivisors = function(num) {\n    var bestPair = function(t) {\n        var w = Math.floor(Math.sqrt(t));\n        while (w * w > t) w--;\n        while (t % w !== 0) w--;\n        return [w, t / w];\n    };\n    var a = bestPair(num + 1);\n    var b = bestPair(num + 2);\n    return (a[1] - a[0] <= b[1] - b[0]) ? a : b;\n};`,
        typescript: `function closestDivisors(num: number): number[] {\n    var bestPair = function(t: number): number[] {\n        var w = Math.floor(Math.sqrt(t));\n        while (w * w > t) w--;\n        while (t % w !== 0) w--;\n        return [w, t / w];\n    };\n    var a = bestPair(num + 1);\n    var b = bestPair(num + 2);\n    return (a[1] - a[0] <= b[1] - b[0]) ? a : b;\n}`,
        java: `public static int[] closestDivisors(int num) {\n    int[] a = bestPairDiv(num + 1);\n    int[] b = bestPairDiv(num + 2);\n    return (a[1] - a[0] <= b[1] - b[0]) ? a : b;\n}\n\nstatic int[] bestPairDiv(int t) {\n    int w = (int) Math.sqrt(t);\n    while ((long) w * w > t) w--;\n    while (t % w != 0) w--;\n    return new int[] { w, t / w };\n}`,
        cpp: `static vector<int> bestPairDiv(int t) {\n    int w = (int) sqrt((double) t);\n    while ((long long) w * w > t) w--;\n    while (t % w != 0) w--;\n    return { w, t / w };\n}\n\nvector<int> closestDivisors(int num) {\n    vector<int> a = bestPairDiv(num + 1);\n    vector<int> b = bestPairDiv(num + 2);\n    return (a[1] - a[0] <= b[1] - b[0]) ? a : b;\n}`,
        c: `static void bestPairDivC(int t, int* out) {\n    int w = 1;\n    while ((long long) (w + 1) * (w + 1) <= (long long) t) w++;\n    while (t % w != 0) w--;\n    out[0] = w;\n    out[1] = t / w;\n}\n\nint* closestDivisors(int num, int* returnSize) {\n    int a[2], b[2];\n    bestPairDivC(num + 1, a);\n    bestPairDivC(num + 2, b);\n    int* out = (int*) malloc(2 * sizeof(int));\n    if (a[1] - a[0] <= b[1] - b[0]) { out[0] = a[0]; out[1] = a[1]; }\n    else { out[0] = b[0]; out[1] = b[1]; }\n    *returnSize = 2;\n    return out;\n}`,
        csharp: `public static int[] ClosestDivisors(int num)\n{\n    int[] a = BestPairDiv(num + 1);\n    int[] b = BestPairDiv(num + 2);\n    return (a[1] - a[0] <= b[1] - b[0]) ? a : b;\n}\n\nstatic int[] BestPairDiv(int t)\n{\n    int w = (int) Math.Sqrt(t);\n    while ((long) w * w > t) w--;\n    while (t % w != 0) w--;\n    return new int[] { w, t / w };\n}`,
        go: `func closestDivisors(num int) []int {\n\tbestPair := func(t int) []int {\n\t\tw := int(math.Sqrt(float64(t)))\n\t\tfor w*w > t {\n\t\t\tw--\n\t\t}\n\t\tfor t%w != 0 {\n\t\t\tw--\n\t\t}\n\t\treturn []int{w, t / w}\n\t}\n\ta := bestPair(num + 1)\n\tb := bestPair(num + 2)\n\tif a[1]-a[0] <= b[1]-b[0] {\n\t\treturn a\n\t}\n\treturn b\n}`,
        kotlin: `fun closestDivisors(num: Int): IntArray {\n    fun bestPair(t: Int): IntArray {\n        var w = Math.sqrt(t.toDouble()).toInt()\n        while (w.toLong() * w > t) w--\n        while (t % w != 0) w--\n        return intArrayOf(w, t / w)\n    }\n    val a = bestPair(num + 1)\n    val b = bestPair(num + 2)\n    return if (a[1] - a[0] <= b[1] - b[0]) a else b\n}`,
        swift: `func closestDivisors(_ num: Int) -> [Int] {\n    func bestPair(_ t: Int) -> [Int] {\n        var w = Int(Double(t).squareRoot())\n        while w * w > t { w -= 1 }\n        while t % w != 0 { w -= 1 }\n        return [w, t / w]\n    }\n    let a = bestPair(num + 1)\n    let b = bestPair(num + 2)\n    return (a[1] - a[0] <= b[1] - b[0]) ? a : b\n}`,
        rust: `fn closestDivisors(num: i32) -> Vec<i32> {\n    fn best_pair(t: i32) -> Vec<i32> {\n        let mut w = (t as f64).sqrt() as i32;\n        while (w as i64) * (w as i64) > t as i64 {\n            w -= 1;\n        }\n        while t % w != 0 {\n            w -= 1;\n        }\n        vec![w, t / w]\n    }\n    let a = best_pair(num + 1);\n    let b = best_pair(num + 2);\n    if a[1] - a[0] <= b[1] - b[0] { a } else { b }\n}`,
        php: `function closestDivisors($num) {\n    $bestPair = function($t) {\n        $w = (int) sqrt($t);\n        while ($w * $w > $t) $w--;\n        while ($t % $w !== 0) $w--;\n        return array($w, intdiv($t, $w));\n    };\n    $a = $bestPair($num + 1);\n    $b = $bestPair($num + 2);\n    return ($a[1] - $a[0] <= $b[1] - $b[0]) ? $a : $b;\n}`,
        ruby: `def closestDivisors(num)\n  best_pair = lambda do |t|\n    w = Integer.sqrt(t)\n    w -= 1 while t % w != 0\n    [w, t / w]\n  end\n  a = best_pair.call(num + 1)\n  b = best_pair.call(num + 2)\n  (a[1] - a[0] <= b[1] - b[0]) ? a : b\nend`,
      },
    };
  })(),

  // ── Minimum Operations to Reduce an Integer to 0 (LC 2571) ──────
  (() => {
    const ref = (n: number) => {
      let ops = 0, v = n;
      while (v > 0) {
        if (v % 4 === 3) { v += 1; ops++; }
        else if (v % 2 === 1) { v -= 1; ops++; }
        else v = v / 2;
      }
      return ops;
    };
    return {
      slug: "minimum-operations-to-reduce-an-integer-to-0",
      title: "Minimum Operations to Reduce an Integer to 0",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Greedy", "Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "minOperationsToZero", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "In one operation you may add **or** subtract any power of `2` to `n`.\n\nReturn the minimum number of operations that turns `n` into `0`.",
        [
          { in: "n = 39", out: "3", note: "39 + 1 = 40, 40 - 8 = 32, 32 - 32 = 0." },
          { in: "n = 54", out: "3", note: "54 + 2 = 56, 56 + 8 = 64, 64 - 64 = 0." },
          { in: "n = 4", out: "1", note: "4 is already a power of two." },
        ],
        ["1 <= n <= 100000000"]),
      hints: [
        "Each operation clears or creates one bit, so think about the binary form of `n`.",
        "A lone set bit costs one operation. A **run** of set bits is cheaper to clear by adding 1 to the run and then removing the carried bit.",
        "Walking the bits from the bottom: if the low two bits are `11`, add 1; if the low bit is `1`, subtract 1; otherwise shift right.",
      ],
      editorial: explain({
        idea: "Process the bits from least significant upward. A single trailing 1 is best removed by subtracting; two or more consecutive trailing 1s are best cleared by adding 1, which carries them away and leaves one higher bit to deal with.",
        steps: [
          "While `n > 0`: if `n % 4 == 3`, add 1 and count an operation — this collapses a run of ones.",
          "Else if `n` is odd, subtract 1 and count an operation.",
          "Else divide by 2, moving to the next bit at no cost.",
        ],
        why: "`n % 4 == 3` means the two lowest bits are both 1, so the run has length at least 2 and adding 1 clears them all at the cost of one carry — strictly better than subtracting 1 for each. A lone trailing 1 (`n % 4 == 1`) has no run to collapse, so subtracting is optimal. Shifting an even number costs nothing because the low bit is already 0.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Counting the set bits of `n` gives the wrong answer for runs: `7` costs 2 operations, not 3.",
          "Always adding on an odd number loops forever on `n = 1`, which must be handled by subtracting.",
          "Adding 1 can push `n` above the original magnitude — that is expected and is why the carry chain terminates.",
        ],
      }),
      examples: [
        { input: "39", expectedOutput: "3" },
        { input: "54", expectedOutput: "3" },
        { input: "4", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.5 ? ri(rng, 1, 200) : ri(rng, 1, 100000000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def minOperationsToZero(n: int) -> int:\n    ops = 0\n    while n > 0:\n        if n % 4 == 3:\n            n += 1\n            ops += 1\n        elif n % 2 == 1:\n            n -= 1\n            ops += 1\n        else:\n            n //= 2\n    return ops`,
        javascript: `var minOperationsToZero = function(n) {\n    var ops = 0;\n    while (n > 0) {\n        if (n % 4 === 3) { n += 1; ops++; }\n        else if (n % 2 === 1) { n -= 1; ops++; }\n        else n = n / 2;\n    }\n    return ops;\n};`,
        typescript: `function minOperationsToZero(n: number): number {\n    var ops = 0;\n    while (n > 0) {\n        if (n % 4 === 3) { n += 1; ops++; }\n        else if (n % 2 === 1) { n -= 1; ops++; }\n        else n = n / 2;\n    }\n    return ops;\n}`,
        java: `public static int minOperationsToZero(int n) {\n    int ops = 0;\n    long v = n;\n    while (v > 0) {\n        if (v % 4 == 3) { v += 1; ops++; }\n        else if (v % 2 == 1) { v -= 1; ops++; }\n        else v /= 2;\n    }\n    return ops;\n}`,
        cpp: `int minOperationsToZero(int n) {\n    int ops = 0;\n    long long v = n;\n    while (v > 0) {\n        if (v % 4 == 3) { v += 1; ops++; }\n        else if (v % 2 == 1) { v -= 1; ops++; }\n        else v /= 2;\n    }\n    return ops;\n}`,
        c: `int minOperationsToZero(int n) {\n    int ops = 0;\n    long long v = n;\n    while (v > 0) {\n        if (v % 4 == 3) { v += 1; ops++; }\n        else if (v % 2 == 1) { v -= 1; ops++; }\n        else v /= 2;\n    }\n    return ops;\n}`,
        csharp: `public static int MinOperationsToZero(int n)\n{\n    int ops = 0;\n    long v = n;\n    while (v > 0)\n    {\n        if (v % 4 == 3) { v += 1; ops++; }\n        else if (v % 2 == 1) { v -= 1; ops++; }\n        else v /= 2;\n    }\n    return ops;\n}`,
        go: `func minOperationsToZero(n int) int {\n\tops := 0\n\tv := n\n\tfor v > 0 {\n\t\tif v%4 == 3 {\n\t\t\tv++\n\t\t\tops++\n\t\t} else if v%2 == 1 {\n\t\t\tv--\n\t\t\tops++\n\t\t} else {\n\t\t\tv /= 2\n\t\t}\n\t}\n\treturn ops\n}`,
        kotlin: `fun minOperationsToZero(n: Int): Int {\n    var ops = 0\n    var v = n.toLong()\n    while (v > 0) {\n        when {\n            v % 4 == 3L -> {\n                v += 1\n                ops++\n            }\n            v % 2 == 1L -> {\n                v -= 1\n                ops++\n            }\n            else -> v /= 2\n        }\n    }\n    return ops\n}`,
        swift: `func minOperationsToZero(_ n: Int) -> Int {\n    var ops = 0\n    var v = n\n    while v > 0 {\n        if v % 4 == 3 {\n            v += 1\n            ops += 1\n        } else if v % 2 == 1 {\n            v -= 1\n            ops += 1\n        } else {\n            v /= 2\n        }\n    }\n    return ops\n}`,
        rust: `fn minOperationsToZero(n: i32) -> i32 {\n    let mut ops = 0i32;\n    let mut v = n as i64;\n    while v > 0 {\n        if v % 4 == 3 {\n            v += 1;\n            ops += 1;\n        } else if v % 2 == 1 {\n            v -= 1;\n            ops += 1;\n        } else {\n            v /= 2;\n        }\n    }\n    ops\n}`,
        php: `function minOperationsToZero($n) {\n    $ops = 0;\n    $v = $n;\n    while ($v > 0) {\n        if ($v % 4 === 3) { $v += 1; $ops++; }\n        else if ($v % 2 === 1) { $v -= 1; $ops++; }\n        else $v = intdiv($v, 2);\n    }\n    return $ops;\n}`,
        ruby: `def minOperationsToZero(n)\n  ops = 0\n  v = n\n  while v > 0\n    if v % 4 == 3\n      v += 1\n      ops += 1\n    elsif v % 2 == 1\n      v -= 1\n      ops += 1\n    else\n      v /= 2\n    end\n  end\n  ops\nend`,
      },
    };
  })(),

  // ── Reordered Power of 2 (LC 869) ───────────────────────────────
  (() => {
    const signature = (v: number) => {
      const count = new Array(10).fill(0);
      let x = v;
      while (x > 0) { count[x % 10]++; x = Math.floor(x / 10); }
      return count.join(",");
    };
    const ref = (n: number) => {
      const want = signature(n);
      for (let p = 1; p <= 1000000000; p *= 2) {
        if (signature(p) === want) return true;
      }
      return false;
    };
    return {
      slug: "reordered-power-of-2",
      title: "Reordered Power of 2",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Counting", "Enumeration", "Google", "Amazon", "Adobe"],
      signature: { funcName: "reorderedPowerOf2", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "You may reorder the digits of `n` in any way, as long as the result has **no leading zero**.\n\nReturn `true` if some reordering is a power of two.",
        [
          { in: "n = 16", out: "true", note: "16 is already 2⁴." },
          { in: "n = 46", out: "true", note: "Reordering to 64 gives 2⁶." },
          { in: "n = 10", out: "false", note: "The only reorderings are 10 and 01, and neither is a power of two." },
        ],
        ["1 <= n <= 1000000000"]),
      hints: [
        "Enumerating every permutation is wasteful — there are only about 30 powers of two in range.",
        "Two numbers are reorderings of each other exactly when they have the same **digit multiset**.",
        "So compare a digit-count signature of `n` against the signature of each power of two.",
      ],
      editorial: explain({
        idea: "Flip the search around. Instead of generating permutations of `n`, generate the handful of powers of two in range and test whether any shares `n`'s digit multiset.",
        steps: [
          "Write a helper that turns a number into a 10-slot digit-count signature.",
          "Compute the signature of `n`.",
          "Walk `p = 1, 2, 4, …` while `p` stays within the input bound, comparing signatures.",
          "Return `true` on the first match.",
        ],
        why: "Two numbers are permutations of one another precisely when their digit counts agree — and the leading-zero rule is automatic, because a power of two never starts with 0 and the signature comparison already forces equal digit counts.",
        time: "O(30 · log n)",
        space: "O(1)",
        pitfalls: [
          "Generating all permutations is up to 10! and needlessly slow.",
          "Sorting the digit strings also works, but the counts version avoids a string sort per candidate.",
          "The loop bound must cover `2^30`, which exceeds the input ceiling — stop once the power passes it.",
        ],
      }),
      examples: [
        { input: "16", expectedOutput: "true" },
        { input: "46", expectedOutput: "true" },
        { input: "10", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        if (rng() < 0.35) {
          const p = Math.pow(2, ri(rng, 0, 29));
          const digits = shuffle(rng, String(p).split(""));
          if (digits[0] === "0") {
            for (let i = 1; i < digits.length; i++) {
              if (digits[i] !== "0") { const t = digits[0]; digits[0] = digits[i]; digits[i] = t; break; }
            }
          }
          const n = Number(digits.join(""));
          return { input: String(n), expectedOutput: bool(ref(n)) };
        }
        const n = ri(rng, 1, 1000000000);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def reorderedPowerOf2(n: int) -> bool:\n    def sig(v: int):\n        count = [0] * 10\n        while v > 0:\n            count[v % 10] += 1\n            v //= 10\n        return tuple(count)\n\n    want = sig(n)\n    p = 1\n    while p <= 1000000000:\n        if sig(p) == want:\n            return True\n        p *= 2\n    return False`,
        javascript: `var reorderedPowerOf2 = function(n) {\n    var sig = function(v) {\n        var count = [];\n        for (var t = 0; t < 10; t++) count.push(0);\n        while (v > 0) {\n            count[v % 10]++;\n            v = Math.floor(v / 10);\n        }\n        return count.join(",");\n    };\n    var want = sig(n);\n    for (var p = 1; p <= 1000000000; p *= 2) {\n        if (sig(p) === want) return true;\n    }\n    return false;\n};`,
        typescript: `function reorderedPowerOf2(n: number): boolean {\n    var sig = function(v: number): string {\n        var count: number[] = [];\n        for (var t = 0; t < 10; t++) count.push(0);\n        while (v > 0) {\n            count[v % 10]++;\n            v = Math.floor(v / 10);\n        }\n        return count.join(",");\n    };\n    var want = sig(n);\n    for (var p = 1; p <= 1000000000; p *= 2) {\n        if (sig(p) === want) return true;\n    }\n    return false;\n}`,
        java: `public static boolean reorderedPowerOf2(int n) {\n    String want = digitSig(n);\n    for (long p = 1; p <= 1000000000L; p *= 2) {\n        if (digitSig((int) p).equals(want)) return true;\n    }\n    return false;\n}\n\nstatic String digitSig(int v) {\n    int[] count = new int[10];\n    while (v > 0) {\n        count[v % 10]++;\n        v /= 10;\n    }\n    return Arrays.toString(count);\n}`,
        cpp: `static string digitSig(int v) {\n    vector<int> count(10, 0);\n    while (v > 0) {\n        count[v % 10]++;\n        v /= 10;\n    }\n    string s;\n    for (int c : count) s += to_string(c) + ",";\n    return s;\n}\n\nbool reorderedPowerOf2(int n) {\n    string want = digitSig(n);\n    for (long long p = 1; p <= 1000000000LL; p *= 2) {\n        if (digitSig((int) p) == want) return true;\n    }\n    return false;\n}`,
        c: `static void digitSigC(int v, int* count) {\n    for (int i = 0; i < 10; i++) count[i] = 0;\n    while (v > 0) {\n        count[v % 10]++;\n        v /= 10;\n    }\n}\n\nbool reorderedPowerOf2(int n) {\n    int want[10], have[10];\n    digitSigC(n, want);\n    for (long long p = 1; p <= 1000000000LL; p *= 2) {\n        digitSigC((int) p, have);\n        int same = 1;\n        for (int i = 0; i < 10; i++) {\n            if (have[i] != want[i]) { same = 0; break; }\n        }\n        if (same) return true;\n    }\n    return false;\n}`,
        csharp: `public static bool ReorderedPowerOf2(int n)\n{\n    string want = DigitSig(n);\n    for (long p = 1; p <= 1000000000L; p *= 2)\n    {\n        if (DigitSig((int) p) == want) return true;\n    }\n    return false;\n}\n\nstatic string DigitSig(int v)\n{\n    int[] count = new int[10];\n    while (v > 0)\n    {\n        count[v % 10]++;\n        v /= 10;\n    }\n    return string.Join(",", count);\n}`,
        go: `func reorderedPowerOf2(n int) bool {\n\tsig := func(v int) [10]int {\n\t\tvar count [10]int\n\t\tfor v > 0 {\n\t\t\tcount[v%10]++\n\t\t\tv /= 10\n\t\t}\n\t\treturn count\n\t}\n\twant := sig(n)\n\tfor p := 1; p <= 1000000000; p *= 2 {\n\t\tif sig(p) == want {\n\t\t\treturn true\n\t\t}\n\t}\n\treturn false\n}`,
        kotlin: `fun reorderedPowerOf2(n: Int): Boolean {\n    fun sig(start: Int): String {\n        val count = IntArray(10)\n        var v = start\n        while (v > 0) {\n            count[v % 10]++\n            v /= 10\n        }\n        return count.joinToString(",")\n    }\n    val want = sig(n)\n    var p = 1L\n    while (p <= 1000000000L) {\n        if (sig(p.toInt()) == want) return true\n        p *= 2\n    }\n    return false\n}`,
        swift: `func reorderedPowerOf2(_ n: Int) -> Bool {\n    func sig(_ start: Int) -> [Int] {\n        var count = [Int](repeating: 0, count: 10)\n        var v = start\n        while v > 0 {\n            count[v % 10] += 1\n            v /= 10\n        }\n        return count\n    }\n    let want = sig(n)\n    var p = 1\n    while p <= 1000000000 {\n        if sig(p) == want { return true }\n        p *= 2\n    }\n    return false\n}`,
        rust: `fn reorderedPowerOf2(n: i32) -> bool {\n    fn sig(start: i64) -> [i32; 10] {\n        let mut count = [0i32; 10];\n        let mut v = start;\n        while v > 0 {\n            count[(v % 10) as usize] += 1;\n            v /= 10;\n        }\n        count\n    }\n    let want = sig(n as i64);\n    let mut p: i64 = 1;\n    while p <= 1000000000 {\n        if sig(p) == want {\n            return true;\n        }\n        p *= 2;\n    }\n    false\n}`,
        php: `function reorderedPowerOf2($n) {\n    $sig = function($v) {\n        $count = array_fill(0, 10, 0);\n        while ($v > 0) {\n            $count[$v % 10]++;\n            $v = intdiv($v, 10);\n        }\n        return implode(",", $count);\n    };\n    $want = $sig($n);\n    for ($p = 1; $p <= 1000000000; $p *= 2) {\n        if ($sig($p) === $want) return true;\n    }\n    return false;\n}`,
        ruby: `def reorderedPowerOf2(n)\n  sig = lambda do |v|\n    count = Array.new(10, 0)\n    while v > 0\n      count[v % 10] += 1\n      v /= 10\n    end\n    count\n  end\n  want = sig.call(n)\n  p = 1\n  while p <= 1000000000\n    return true if sig.call(p) == want\n    p *= 2\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Clumsy Factorial (LC 1006) ──────────────────────────────────
  (() => {
    const trunc = (a: number, b: number) => {
      const q = Math.floor(Math.abs(a) / Math.abs(b));
      return (a < 0) !== (b < 0) ? -q : q;
    };
    const ref = (n: number) => {
      const stack: number[] = [n];
      let op = 0;
      for (let x = n - 1; x >= 1; x--) {
        if (op === 0) stack[stack.length - 1] = stack[stack.length - 1] * x;
        else if (op === 1) stack[stack.length - 1] = trunc(stack[stack.length - 1], x);
        else if (op === 2) stack.push(x);
        else stack.push(-x);
        op = (op + 1) % 4;
      }
      let total = 0;
      for (const v of stack) total += v;
      return total;
    };
    return {
      slug: "clumsy-factorial",
      title: "Clumsy Factorial",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Stack", "Simulation", "Amazon", "Adobe", "Oracle"],
      signature: { funcName: "clumsy", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The **clumsy factorial** of `n` replaces the multiplications of `n!` with a rotating sequence of operators — multiply, floor-divide, add, subtract — applied to the descending run `n, n-1, …, 1`.\n\nFor example `clumsy(10) = 10 * 9 / 8 + 7 - 6 * 5 / 4 + 3 - 2 * 1`. Multiplication and division bind tighter than addition and subtraction, and division truncates towards zero.\n\nReturn the value.",
        [
          { in: "n = 4", out: "7", note: "4 * 3 / 2 + 1 = 6 + 1 = 7." },
          { in: "n = 10", out: "12", note: "11 + 7 - 7 + 3 - 2 = 12, where 90 / 8 is 11 and 30 / 4 is 7." },
          { in: "n = 1", out: "1" },
        ],
        ["1 <= n <= 10000"]),
      hints: [
        "Evaluate with a stack: push terms, and fold `*` and `/` into the top of the stack immediately.",
        "A `+` pushes the value, a `-` pushes its negation — then the final answer is the sum of the stack.",
        "That reproduces operator precedence without parsing anything.",
      ],
      editorial: explain({
        idea: "Treat the expression as a sum of signed terms. Multiplication and division modify the term currently on top of the stack; addition and subtraction start a new term, negated for subtraction. Summing the stack at the end applies precedence correctly.",
        steps: [
          "Push `n` and set the operator index to 0 (multiply).",
          "For `x` from `n - 1` down to `1`, apply the current operator: multiply or divide the stack top, or push `x` (for `+`) or `-x` (for `-`).",
          "Advance the operator cyclically through `* / + -`.",
          "Return the sum of the stack.",
        ],
        why: "Higher-precedence operators must be resolved before the sum, which is exactly what folding them into the top of the stack does. Encoding subtraction as a negative term means the final combination is a plain sum, which is associative and needs no further ordering.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Division must truncate **towards zero**, which is what C, Java, Go and Rust do natively but Python's `//` and Ruby's `/` do not — a negative term needs an explicit sign-aware division there.",
          "Evaluating strictly left to right ignores precedence and gives the wrong answer from `n = 5` upward.",
          "The operator cycle starts at multiply, not add.",
        ],
      }),
      examples: [
        { input: "4", expectedOutput: "7" },
        { input: "10", expectedOutput: "12" },
        { input: "1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.5 ? ri(rng, 1, 20) : ri(rng, 1, 10000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def clumsy(n: int) -> int:\n    def trunc(a: int, b: int) -> int:\n        q = abs(a) // abs(b)\n        return -q if (a < 0) != (b < 0) else q\n\n    stack = [n]\n    op = 0\n    for x in range(n - 1, 0, -1):\n        if op == 0:\n            stack[-1] *= x\n        elif op == 1:\n            stack[-1] = trunc(stack[-1], x)\n        elif op == 2:\n            stack.append(x)\n        else:\n            stack.append(-x)\n        op = (op + 1) % 4\n    return sum(stack)`,
        javascript: `var clumsy = function(n) {\n    var trunc = function(a, b) {\n        var q = Math.floor(Math.abs(a) / Math.abs(b));\n        return ((a < 0) !== (b < 0)) ? -q : q;\n    };\n    var stack = [n];\n    var op = 0;\n    for (var x = n - 1; x >= 1; x--) {\n        if (op === 0) stack[stack.length - 1] = stack[stack.length - 1] * x;\n        else if (op === 1) stack[stack.length - 1] = trunc(stack[stack.length - 1], x);\n        else if (op === 2) stack.push(x);\n        else stack.push(-x);\n        op = (op + 1) % 4;\n    }\n    var total = 0;\n    for (var i = 0; i < stack.length; i++) total += stack[i];\n    return total;\n};`,
        typescript: `function clumsy(n: number): number {\n    var trunc = function(a: number, b: number): number {\n        var q = Math.floor(Math.abs(a) / Math.abs(b));\n        return ((a < 0) !== (b < 0)) ? -q : q;\n    };\n    var stack: number[] = [n];\n    var op = 0;\n    for (var x = n - 1; x >= 1; x--) {\n        if (op === 0) stack[stack.length - 1] = stack[stack.length - 1] * x;\n        else if (op === 1) stack[stack.length - 1] = trunc(stack[stack.length - 1], x);\n        else if (op === 2) stack.push(x);\n        else stack.push(-x);\n        op = (op + 1) % 4;\n    }\n    var total = 0;\n    for (var i = 0; i < stack.length; i++) total += stack[i];\n    return total;\n}`,
        java: `public static int clumsy(int n) {\n    List<Long> stack = new ArrayList<>();\n    stack.add((long) n);\n    int op = 0;\n    for (int x = n - 1; x >= 1; x--) {\n        int last = stack.size() - 1;\n        if (op == 0) stack.set(last, stack.get(last) * x);\n        else if (op == 1) stack.set(last, stack.get(last) / x);\n        else if (op == 2) stack.add((long) x);\n        else stack.add((long) -x);\n        op = (op + 1) % 4;\n    }\n    long total = 0;\n    for (long v : stack) total += v;\n    return (int) total;\n}`,
        cpp: `int clumsy(int n) {\n    vector<long long> stack;\n    stack.push_back(n);\n    int op = 0;\n    for (int x = n - 1; x >= 1; x--) {\n        if (op == 0) stack.back() *= x;\n        else if (op == 1) stack.back() /= x;\n        else if (op == 2) stack.push_back(x);\n        else stack.push_back(-x);\n        op = (op + 1) % 4;\n    }\n    long long total = 0;\n    for (long long v : stack) total += v;\n    return (int) total;\n}`,
        c: `int clumsy(int n) {\n    long long* stack = (long long*) malloc((size_t) (n + 2) * sizeof(long long));\n    int top = 0;\n    stack[0] = n;\n    int op = 0;\n    for (int x = n - 1; x >= 1; x--) {\n        if (op == 0) stack[top] *= x;\n        else if (op == 1) stack[top] /= x;\n        else if (op == 2) stack[++top] = x;\n        else stack[++top] = -x;\n        op = (op + 1) % 4;\n    }\n    long long total = 0;\n    for (int i = 0; i <= top; i++) total += stack[i];\n    free(stack);\n    return (int) total;\n}`,
        csharp: `public static int Clumsy(int n)\n{\n    var stack = new List<long>();\n    stack.Add(n);\n    int op = 0;\n    for (int x = n - 1; x >= 1; x--)\n    {\n        int last = stack.Count - 1;\n        if (op == 0) stack[last] = stack[last] * x;\n        else if (op == 1) stack[last] = stack[last] / x;\n        else if (op == 2) stack.Add(x);\n        else stack.Add(-x);\n        op = (op + 1) % 4;\n    }\n    long total = 0;\n    foreach (long v in stack) total += v;\n    return (int) total;\n}`,
        go: `func clumsy(n int) int {\n\tstack := []int{n}\n\top := 0\n\tfor x := n - 1; x >= 1; x-- {\n\t\tlast := len(stack) - 1\n\t\tswitch op {\n\t\tcase 0:\n\t\t\tstack[last] *= x\n\t\tcase 1:\n\t\t\tstack[last] /= x\n\t\tcase 2:\n\t\t\tstack = append(stack, x)\n\t\tdefault:\n\t\t\tstack = append(stack, -x)\n\t\t}\n\t\top = (op + 1) % 4\n\t}\n\ttotal := 0\n\tfor _, v := range stack {\n\t\ttotal += v\n\t}\n\treturn total\n}`,
        kotlin: `fun clumsy(n: Int): Int {\n    val stack = ArrayList<Long>()\n    stack.add(n.toLong())\n    var op = 0\n    var x = n - 1\n    while (x >= 1) {\n        val last = stack.size - 1\n        when (op) {\n            0 -> stack[last] = stack[last] * x\n            1 -> stack[last] = stack[last] / x\n            2 -> stack.add(x.toLong())\n            else -> stack.add((-x).toLong())\n        }\n        op = (op + 1) % 4\n        x--\n    }\n    var total = 0L\n    for (v in stack) total += v\n    return total.toInt()\n}`,
        swift: `func clumsy(_ n: Int) -> Int {\n    var stack: [Int] = [n]\n    var op = 0\n    var x = n - 1\n    while x >= 1 {\n        let last = stack.count - 1\n        if op == 0 { stack[last] = stack[last] * x }\n        else if op == 1 { stack[last] = stack[last] / x }\n        else if op == 2 { stack.append(x) }\n        else { stack.append(-x) }\n        op = (op + 1) % 4\n        x -= 1\n    }\n    return stack.reduce(0, +)\n}`,
        rust: `fn clumsy(n: i32) -> i32 {\n    let mut stack: Vec<i64> = vec![n as i64];\n    let mut op = 0;\n    let mut x = n - 1;\n    while x >= 1 {\n        let last = stack.len() - 1;\n        match op {\n            0 => stack[last] *= x as i64,\n            1 => stack[last] /= x as i64,\n            2 => stack.push(x as i64),\n            _ => stack.push(-(x as i64)),\n        }\n        op = (op + 1) % 4;\n        x -= 1;\n    }\n    let mut total: i64 = 0;\n    for v in stack.iter() {\n        total += v;\n    }\n    total as i32\n}`,
        php: `function clumsy($n) {\n    $stack = array($n);\n    $op = 0;\n    for ($x = $n - 1; $x >= 1; $x--) {\n        $last = count($stack) - 1;\n        if ($op === 0) $stack[$last] = $stack[$last] * $x;\n        else if ($op === 1) $stack[$last] = intdiv($stack[$last], $x);\n        else if ($op === 2) $stack[] = $x;\n        else $stack[] = -$x;\n        $op = ($op + 1) % 4;\n    }\n    return array_sum($stack);\n}`,
        ruby: `def clumsy(n)\n  trunc = lambda do |a, b|\n    q = a.abs / b.abs\n    (a < 0) != (b < 0) ? -q : q\n  end\n  stack = [n]\n  op = 0\n  x = n - 1\n  while x >= 1\n    case op\n    when 0 then stack[-1] = stack[-1] * x\n    when 1 then stack[-1] = trunc.call(stack[-1], x)\n    when 2 then stack << x\n    else stack << -x\n    end\n    op = (op + 1) % 4\n    x -= 1\n  end\n  stack.sum\nend`,
      },
    };
  })(),

  // ── Integer Replacement (LC 397) ────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let v = n, steps = 0;
      while (v > 1) {
        if (v % 2 === 0) v = v / 2;
        else if (v === 3 || v % 4 === 1) v -= 1;
        else v += 1;
        steps++;
      }
      return steps;
    };
    return {
      slug: "integer-replacement",
      title: "Integer Replacement",
      difficulty: "MEDIUM" as const,
      tags: ["Bit Manipulation", "Greedy", "Dynamic Programming", "Google", "Amazon", "Meta"],
      signature: { funcName: "integerReplacement", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Starting from `n`, each step must either halve the value (only when it is even) or add or subtract `1` (only when it is odd).\n\nReturn the minimum number of steps needed to reach `1`.",
        [
          { in: "n = 8", out: "3", note: "8 → 4 → 2 → 1." },
          { in: "n = 7", out: "4", note: "7 → 8 → 4 → 2 → 1 (or 7 → 6 → 3 → 2 → 1)." },
          { in: "n = 4", out: "2" },
        ],
        ["1 <= n <= 1000000000"]),
      hints: [
        "Even numbers have no choice — halve them.",
        "For an odd `n`, the choice is `n - 1` or `n + 1`; whichever has more trailing zeros wins, because those are free halvings.",
        "That reduces to a two-bit test: `n % 4 == 1` means subtract, `n % 4 == 3` means add — except for `n = 3`, where subtracting is better.",
      ],
      editorial: explain({
        idea: "Halving is forced on even values. On an odd value, picking the neighbour with more trailing zeros buys more free halvings, and the two lowest bits decide which neighbour that is.",
        steps: [
          "While `n > 1`: if `n` is even, halve it.",
          "If `n` is odd and `n == 3` or `n % 4 == 1`, subtract 1.",
          "Otherwise add 1.",
          "Count every step.",
        ],
        why: "For odd `n`, exactly one of `n - 1` and `n + 1` is divisible by 4. Moving to that one gains at least two halvings for the price of one step, which dominates the alternative — except at `n = 3`, where `n + 1 = 4` and `n - 1 = 2` both reach 1 in two more steps and subtracting is never worse.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "At the 32-bit ceiling `n + 1` overflows — carry the value in a 64-bit variable.",
          "Always subtracting on an odd value is wrong for `n = 7` and many larger values.",
          "Without the special case for `3`, the greedy goes `3 → 4 → 2 → 1`, which is the same length here but sets up worse choices in a memoised formulation.",
        ],
      }),
      examples: [
        { input: "8", expectedOutput: "3" },
        { input: "7", expectedOutput: "4" },
        { input: "4", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.5 ? ri(rng, 1, 200) : ri(rng, 1, 1000000000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def integerReplacement(n: int) -> int:\n    steps = 0\n    while n > 1:\n        if n % 2 == 0:\n            n //= 2\n        elif n == 3 or n % 4 == 1:\n            n -= 1\n        else:\n            n += 1\n        steps += 1\n    return steps`,
        javascript: `var integerReplacement = function(n) {\n    var v = n, steps = 0;\n    while (v > 1) {\n        if (v % 2 === 0) v = v / 2;\n        else if (v === 3 || v % 4 === 1) v -= 1;\n        else v += 1;\n        steps++;\n    }\n    return steps;\n};`,
        typescript: `function integerReplacement(n: number): number {\n    var v = n, steps = 0;\n    while (v > 1) {\n        if (v % 2 === 0) v = v / 2;\n        else if (v === 3 || v % 4 === 1) v -= 1;\n        else v += 1;\n        steps++;\n    }\n    return steps;\n}`,
        java: `public static int integerReplacement(int n) {\n    long v = n;\n    int steps = 0;\n    while (v > 1) {\n        if (v % 2 == 0) v /= 2;\n        else if (v == 3 || v % 4 == 1) v -= 1;\n        else v += 1;\n        steps++;\n    }\n    return steps;\n}`,
        cpp: `int integerReplacement(int n) {\n    long long v = n;\n    int steps = 0;\n    while (v > 1) {\n        if (v % 2 == 0) v /= 2;\n        else if (v == 3 || v % 4 == 1) v -= 1;\n        else v += 1;\n        steps++;\n    }\n    return steps;\n}`,
        c: `int integerReplacement(int n) {\n    long long v = n;\n    int steps = 0;\n    while (v > 1) {\n        if (v % 2 == 0) v /= 2;\n        else if (v == 3 || v % 4 == 1) v -= 1;\n        else v += 1;\n        steps++;\n    }\n    return steps;\n}`,
        csharp: `public static int IntegerReplacement(int n)\n{\n    long v = n;\n    int steps = 0;\n    while (v > 1)\n    {\n        if (v % 2 == 0) v /= 2;\n        else if (v == 3 || v % 4 == 1) v -= 1;\n        else v += 1;\n        steps++;\n    }\n    return steps;\n}`,
        go: `func integerReplacement(n int) int {\n\tv := n\n\tsteps := 0\n\tfor v > 1 {\n\t\tif v%2 == 0 {\n\t\t\tv /= 2\n\t\t} else if v == 3 || v%4 == 1 {\n\t\t\tv--\n\t\t} else {\n\t\t\tv++\n\t\t}\n\t\tsteps++\n\t}\n\treturn steps\n}`,
        kotlin: `fun integerReplacement(n: Int): Int {\n    var v = n.toLong()\n    var steps = 0\n    while (v > 1) {\n        if (v % 2 == 0L) v /= 2\n        else if (v == 3L || v % 4 == 1L) v -= 1\n        else v += 1\n        steps++\n    }\n    return steps\n}`,
        swift: `func integerReplacement(_ n: Int) -> Int {\n    var v = n\n    var steps = 0\n    while v > 1 {\n        if v % 2 == 0 { v /= 2 }\n        else if v == 3 || v % 4 == 1 { v -= 1 }\n        else { v += 1 }\n        steps += 1\n    }\n    return steps\n}`,
        rust: `fn integerReplacement(n: i32) -> i32 {\n    let mut v = n as i64;\n    let mut steps = 0i32;\n    while v > 1 {\n        if v % 2 == 0 {\n            v /= 2;\n        } else if v == 3 || v % 4 == 1 {\n            v -= 1;\n        } else {\n            v += 1;\n        }\n        steps += 1;\n    }\n    steps\n}`,
        php: `function integerReplacement($n) {\n    $v = $n;\n    $steps = 0;\n    while ($v > 1) {\n        if ($v % 2 === 0) $v = intdiv($v, 2);\n        else if ($v === 3 || $v % 4 === 1) $v -= 1;\n        else $v += 1;\n        $steps++;\n    }\n    return $steps;\n}`,
        ruby: `def integerReplacement(n)\n  v = n\n  steps = 0\n  while v > 1\n    if v.even?\n      v /= 2\n    elsif v == 3 || v % 4 == 1\n      v -= 1\n    else\n      v += 1\n    end\n    steps += 1\n  end\n  steps\nend`,
      },
    };
  })(),

  // ── The kth Factor of n (LC 1492) ───────────────────────────────
  (() => {
    const ref = (n: number, k: number) => {
      let seen = 0;
      for (let d = 1; d <= n; d++) {
        if (n % d === 0) {
          seen++;
          if (seen === k) return d;
        }
      }
      return -1;
    };
    return {
      slug: "the-kth-factor-of-n",
      title: "The kth Factor of n",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Number Theory", "TCS", "Amazon", "Adobe"],
      signature: { funcName: "kthFactor", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "List the positive divisors of `n` in increasing order.\n\nReturn the `k`-th of them, or `-1` if `n` has fewer than `k` divisors.",
        [
          { in: "n = 12, k = 3", out: "3", note: "The divisors are 1, 2, 3, 4, 6, 12." },
          { in: "n = 7, k = 2", out: "7", note: "A prime has exactly two divisors." },
          { in: "n = 4, k = 4", out: "-1", note: "4 has only three divisors." },
        ],
        ["1 <= n <= 1000", "1 <= k <= n"]),
      hints: [
        "A direct loop from `1` to `n` counting divisors is fine at this size.",
        "The `O(sqrt(n))` version collects the small divisors going up and the large ones coming back down.",
        "Stop as soon as the running count reaches `k`.",
      ],
      editorial: explain({
        idea: "Divisors are naturally enumerated in increasing order by a loop from 1 upward, so count as you go and stop at the `k`-th.",
        steps: [
          "Loop `d` from `1` to `n`.",
          "When `n % d == 0`, increment the count.",
          "Return `d` when the count reaches `k`; return `-1` if the loop ends first.",
        ],
        why: "The loop visits candidates in increasing order, so the `k`-th divisor it finds is exactly the `k`-th smallest. The `O(sqrt(n))` refinement uses the pairing `d ↔ n/d`: collect the `d <= sqrt(n)` ascending, then walk the partners descending.",
        time: "O(n), or O(sqrt(n)) with the pairing trick",
        space: "O(1)",
        pitfalls: [
          "In the `sqrt` version, a perfect square's middle divisor must not be counted twice.",
          "`k` can exceed the divisor count, and `-1` is the required answer then — not `0`.",
        ],
      }),
      examples: [
        { input: "12\n3", expectedOutput: "3" },
        { input: "7\n2", expectedOutput: "7" },
        { input: "4\n4", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 1000);
        const k = ri(rng, 1, n);
        return { input: `${n}\n${k}`, expectedOutput: String(ref(n, k)) };
      },
      solutions: {
        python: `def kthFactor(n: int, k: int) -> int:\n    seen = 0\n    for d in range(1, n + 1):\n        if n % d == 0:\n            seen += 1\n            if seen == k:\n                return d\n    return -1`,
        javascript: `var kthFactor = function(n, k) {\n    var seen = 0;\n    for (var d = 1; d <= n; d++) {\n        if (n % d === 0) {\n            seen++;\n            if (seen === k) return d;\n        }\n    }\n    return -1;\n};`,
        typescript: `function kthFactor(n: number, k: number): number {\n    var seen = 0;\n    for (var d = 1; d <= n; d++) {\n        if (n % d === 0) {\n            seen++;\n            if (seen === k) return d;\n        }\n    }\n    return -1;\n}`,
        java: `public static int kthFactor(int n, int k) {\n    int seen = 0;\n    for (int d = 1; d <= n; d++) {\n        if (n % d == 0) {\n            seen++;\n            if (seen == k) return d;\n        }\n    }\n    return -1;\n}`,
        cpp: `int kthFactor(int n, int k) {\n    int seen = 0;\n    for (int d = 1; d <= n; d++) {\n        if (n % d == 0) {\n            seen++;\n            if (seen == k) return d;\n        }\n    }\n    return -1;\n}`,
        c: `int kthFactor(int n, int k) {\n    int seen = 0;\n    for (int d = 1; d <= n; d++) {\n        if (n % d == 0) {\n            seen++;\n            if (seen == k) return d;\n        }\n    }\n    return -1;\n}`,
        csharp: `public static int KthFactor(int n, int k)\n{\n    int seen = 0;\n    for (int d = 1; d <= n; d++)\n    {\n        if (n % d == 0)\n        {\n            seen++;\n            if (seen == k) return d;\n        }\n    }\n    return -1;\n}`,
        go: `func kthFactor(n int, k int) int {\n\tseen := 0\n\tfor d := 1; d <= n; d++ {\n\t\tif n%d == 0 {\n\t\t\tseen++\n\t\t\tif seen == k {\n\t\t\t\treturn d\n\t\t\t}\n\t\t}\n\t}\n\treturn -1\n}`,
        kotlin: `fun kthFactor(n: Int, k: Int): Int {\n    var seen = 0\n    for (d in 1..n) {\n        if (n % d == 0) {\n            seen++\n            if (seen == k) return d\n        }\n    }\n    return -1\n}`,
        swift: `func kthFactor(_ n: Int, _ k: Int) -> Int {\n    var seen = 0\n    for d in 1...n where n % d == 0 {\n        seen += 1\n        if seen == k { return d }\n    }\n    return -1\n}`,
        rust: `fn kthFactor(n: i32, k: i32) -> i32 {\n    let mut seen = 0;\n    for d in 1..=n {\n        if n % d == 0 {\n            seen += 1;\n            if seen == k {\n                return d;\n            }\n        }\n    }\n    -1\n}`,
        php: `function kthFactor($n, $k) {\n    $seen = 0;\n    for ($d = 1; $d <= $n; $d++) {\n        if ($n % $d === 0) {\n            $seen++;\n            if ($seen === $k) return $d;\n        }\n    }\n    return -1;\n}`,
        ruby: `def kthFactor(n, k)\n  seen = 0\n  (1..n).each do |d|\n    next unless n % d == 0\n    seen += 1\n    return d if seen == k\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Minimum Moves to Reach Target Score (LC 2139) ───────────────
  (() => {
    const ref = (target: number, maxDoubles: number) => {
      let moves = 0, v = target, doubles = maxDoubles;
      while (v > 1) {
        if (doubles === 0) { moves += v - 1; return moves; }
        if (v % 2 === 1) { v -= 1; moves++; }
        else { v = v / 2; doubles--; moves++; }
      }
      return moves;
    };
    return {
      slug: "minimum-moves-to-reach-target-score",
      title: "Minimum Moves to Reach Target Score",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Greedy", "Amazon", "Google", "Walmart"],
      signature: { funcName: "minMoves", params: [{ name: "target", type: "int" as const }, { name: "maxDoubles", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You start at `1` and want to reach `target`. Each move either increments the value by `1`, or doubles it — and doubling may be used at most `maxDoubles` times in total.\n\nReturn the minimum number of moves.",
        [
          { in: "target = 5, maxDoubles = 0", out: "4", note: "With no doubling available, only increments work: 1 → 2 → 3 → 4 → 5." },
          { in: "target = 19, maxDoubles = 2", out: "7", note: "1 → 2 → 3 → 4 → 8 → 9 → 18 → 19 uses both doublings." },
          { in: "target = 10, maxDoubles = 4", out: "4", note: "1 → 2 → 4 → 5 → 10." },
        ],
        ["1 <= target <= 1000000000", "0 <= maxDoubles <= 100"]),
      hints: [
        "Work **backwards** from `target` down to 1 — then each step is forced rather than chosen.",
        "An odd value can only have come from an increment, so subtract 1.",
        "An even value should be halved while doublings remain; once they run out, everything left is increments.",
      ],
      editorial: explain({
        idea: "Reversing the process removes the choice. Going down from `target`, an odd value must have been reached by an increment, and an even value is best reached by a doubling — halving shrinks the number far faster than decrementing.",
        steps: [
          "While the value exceeds 1: if no doublings remain, add `value - 1` moves and stop.",
          "If the value is odd, subtract 1 and count a move.",
          "Otherwise halve it, spend a doubling and count a move.",
        ],
        why: "Halving an even `v` costs one move and removes `v/2` units of distance, whereas decrementing costs one move and removes 1 — so while doublings remain, halving dominates. Odd values leave no choice at all. Once the budget is gone the remaining distance can only be covered one increment at a time.",
        time: "O(log target)",
        space: "O(1)",
        pitfalls: [
          "Working forwards means guessing where to spend the doublings; backwards the moves are forced.",
          "Forgetting to stop once `maxDoubles` hits zero makes the loop halve for free.",
          "`target = 1` needs zero moves — the loop condition must be `> 1`.",
        ],
      }),
      examples: [
        { input: "5\n0", expectedOutput: "4" },
        { input: "19\n2", expectedOutput: "7" },
        { input: "10\n4", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const target = rng() < 0.5 ? ri(rng, 1, 200) : ri(rng, 1, 1000000000);
        const maxDoubles = ri(rng, 0, 100);
        return { input: `${target}\n${maxDoubles}`, expectedOutput: String(ref(target, maxDoubles)) };
      },
      solutions: {
        python: `def minMoves(target: int, maxDoubles: int) -> int:\n    moves = 0\n    while target > 1:\n        if maxDoubles == 0:\n            return moves + target - 1\n        if target % 2 == 1:\n            target -= 1\n        else:\n            target //= 2\n            maxDoubles -= 1\n        moves += 1\n    return moves`,
        javascript: `var minMoves = function(target, maxDoubles) {\n    var moves = 0, v = target, doubles = maxDoubles;\n    while (v > 1) {\n        if (doubles === 0) return moves + v - 1;\n        if (v % 2 === 1) v -= 1;\n        else { v = v / 2; doubles--; }\n        moves++;\n    }\n    return moves;\n};`,
        typescript: `function minMoves(target: number, maxDoubles: number): number {\n    var moves = 0, v = target, doubles = maxDoubles;\n    while (v > 1) {\n        if (doubles === 0) return moves + v - 1;\n        if (v % 2 === 1) v -= 1;\n        else { v = v / 2; doubles--; }\n        moves++;\n    }\n    return moves;\n}`,
        java: `public static int minMoves(int target, int maxDoubles) {\n    int moves = 0;\n    long v = target;\n    int doubles = maxDoubles;\n    while (v > 1) {\n        if (doubles == 0) return (int) (moves + v - 1);\n        if (v % 2 == 1) v -= 1;\n        else { v /= 2; doubles--; }\n        moves++;\n    }\n    return moves;\n}`,
        cpp: `int minMoves(int target, int maxDoubles) {\n    int moves = 0;\n    long long v = target;\n    int doubles = maxDoubles;\n    while (v > 1) {\n        if (doubles == 0) return (int) (moves + v - 1);\n        if (v % 2 == 1) v -= 1;\n        else { v /= 2; doubles--; }\n        moves++;\n    }\n    return moves;\n}`,
        c: `int minMoves(int target, int maxDoubles) {\n    int moves = 0;\n    long long v = target;\n    int doubles = maxDoubles;\n    while (v > 1) {\n        if (doubles == 0) return (int) (moves + v - 1);\n        if (v % 2 == 1) v -= 1;\n        else { v /= 2; doubles--; }\n        moves++;\n    }\n    return moves;\n}`,
        csharp: `public static int MinMoves(int target, int maxDoubles)\n{\n    int moves = 0;\n    long v = target;\n    int doubles = maxDoubles;\n    while (v > 1)\n    {\n        if (doubles == 0) return (int) (moves + v - 1);\n        if (v % 2 == 1) v -= 1;\n        else { v /= 2; doubles--; }\n        moves++;\n    }\n    return moves;\n}`,
        go: `func minMoves(target int, maxDoubles int) int {\n\tmoves := 0\n\tv := target\n\tdoubles := maxDoubles\n\tfor v > 1 {\n\t\tif doubles == 0 {\n\t\t\treturn moves + v - 1\n\t\t}\n\t\tif v%2 == 1 {\n\t\t\tv--\n\t\t} else {\n\t\t\tv /= 2\n\t\t\tdoubles--\n\t\t}\n\t\tmoves++\n\t}\n\treturn moves\n}`,
        kotlin: `fun minMoves(target: Int, maxDoubles: Int): Int {\n    var moves = 0\n    var v = target.toLong()\n    var doubles = maxDoubles\n    while (v > 1) {\n        if (doubles == 0) return (moves + v - 1).toInt()\n        if (v % 2 == 1L) v -= 1\n        else {\n            v /= 2\n            doubles--\n        }\n        moves++\n    }\n    return moves\n}`,
        swift: `func minMoves(_ target: Int, _ maxDoubles: Int) -> Int {\n    var moves = 0\n    var v = target\n    var doubles = maxDoubles\n    while v > 1 {\n        if doubles == 0 { return moves + v - 1 }\n        if v % 2 == 1 { v -= 1 }\n        else {\n            v /= 2\n            doubles -= 1\n        }\n        moves += 1\n    }\n    return moves\n}`,
        rust: `fn minMoves(target: i32, maxDoubles: i32) -> i32 {\n    let mut moves = 0i64;\n    let mut v = target as i64;\n    let mut doubles = maxDoubles;\n    while v > 1 {\n        if doubles == 0 {\n            return (moves + v - 1) as i32;\n        }\n        if v % 2 == 1 {\n            v -= 1;\n        } else {\n            v /= 2;\n            doubles -= 1;\n        }\n        moves += 1;\n    }\n    moves as i32\n}`,
        php: `function minMoves($target, $maxDoubles) {\n    $moves = 0;\n    $v = $target;\n    $doubles = $maxDoubles;\n    while ($v > 1) {\n        if ($doubles === 0) return $moves + $v - 1;\n        if ($v % 2 === 1) $v -= 1;\n        else { $v = intdiv($v, 2); $doubles--; }\n        $moves++;\n    }\n    return $moves;\n}`,
        ruby: `def minMoves(target, maxDoubles)\n  moves = 0\n  v = target\n  doubles = maxDoubles\n  while v > 1\n    return moves + v - 1 if doubles == 0\n    if v.odd?\n      v -= 1\n    else\n      v /= 2\n      doubles -= 1\n    end\n    moves += 1\n  end\n  moves\nend`,
      },
    };
  })(),

  // ── Super Ugly Number (LC 313) ──────────────────────────────────
  (() => {
    const ref = (n: number, primes: number[]) => {
      const ugly = [1];
      const idx = new Array(primes.length).fill(0);
      while (ugly.length < n) {
        let next = Infinity;
        for (let j = 0; j < primes.length; j++) {
          const cand = primes[j] * ugly[idx[j]];
          if (cand < next) next = cand;
        }
        for (let j = 0; j < primes.length; j++) {
          if (primes[j] * ugly[idx[j]] === next) idx[j]++;
        }
        ugly.push(next);
      }
      return ugly[n - 1];
    };
    return {
      slug: "super-ugly-number",
      title: "Super Ugly Number",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Math", "Heap", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "nthSuperUglyNumber", params: [{ name: "n", type: "int" as const }, { name: "primes", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A **super ugly number** is a positive integer whose prime factors all appear in the given list `primes`. By convention `1` is the first super ugly number.\n\nReturn the `n`-th super ugly number.",
        [
          { in: "n = 12, primes = [2,7,13,19]", out: "32", note: "The sequence starts 1, 2, 4, 7, 8, 13, 14, 16, 19, 26, 28, 32." },
          { in: "n = 1, primes = [2,3,5]", out: "1", note: "1 is always first." },
          { in: "n = 5, primes = [3]", out: "81", note: "Powers of 3: 1, 3, 9, 27, 81." },
        ],
        ["1 <= n <= 2000", "1 <= primes.length <= 10", "2 <= primes[i] <= 1000", "All values in primes are distinct primes.", "The answer fits in a 32-bit signed integer."]),
      hints: [
        "Every super ugly number after the first is some earlier one multiplied by a prime from the list.",
        "Keep one pointer per prime into the sequence built so far; the next value is the smallest of `primes[j] * ugly[idx[j]]`.",
        "Advance **every** pointer that produced the minimum, or duplicates creep in.",
      ],
      editorial: explain({
        idea: "Build the sequence in order. Each prime maintains a pointer to the earliest sequence element it has not yet multiplied; the next term is the smallest of those products.",
        steps: [
          "Start the sequence at `[1]` with every pointer at index 0.",
          "Compute `primes[j] * ugly[idx[j]]` for each `j` and take the minimum as the next term.",
          "Advance every pointer whose product equals that minimum — this deduplicates values reachable in more than one way.",
          "Append the term and repeat until the sequence has `n` entries.",
        ],
        why: "Every super ugly number greater than 1 factors as `prime × (smaller super ugly number)`, so the candidate set above covers all of them. Because the sequence is built in increasing order and each pointer only moves forward, each candidate is offered exactly once, and advancing all tied pointers prevents the same value from being emitted twice.",
        time: "O(n · k) for `k` primes",
        space: "O(n + k)",
        pitfalls: [
          "Advancing only the first tied pointer emits duplicates — `2 * 3` and `3 * 2` would both appear.",
          "A heap gives `O(n k log k)` and is the usual alternative; the pointer version is simpler and faster here.",
          "Intermediate products can exceed the answer, so guard the multiplication or use 64-bit arithmetic.",
        ],
      }),
      examples: [
        { input: "12\n[2,7,13,19]", expectedOutput: "32" },
        { input: "1\n[2,3,5]", expectedOutput: "1" },
        { input: "5\n[3]", expectedOutput: "81" },
      ],
      gen: (rng: Rng) => {
        const pool = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29];
        const primes = shuffle(rng, pool.slice()).slice(0, ri(rng, 1, 4)).sort((a, b) => a - b);
        // The statement promises the answer fits in a signed 32-bit integer, so
        // cap n at the last term that actually does — [17] alone runs out fast.
        let safe = 1;
        while (safe < 300 && ref(safe + 1, primes) <= 2147483647) safe++;
        const n = ri(rng, 1, safe);
        return { input: `${n}\n${fmtIntArr(primes)}`, expectedOutput: String(ref(n, primes)) };
      },
      solutions: {
        python: `from typing import List\n\ndef nthSuperUglyNumber(n: int, primes: List[int]) -> int:\n    ugly = [1]\n    idx = [0] * len(primes)\n    while len(ugly) < n:\n        nxt = min(primes[j] * ugly[idx[j]] for j in range(len(primes)))\n        for j in range(len(primes)):\n            if primes[j] * ugly[idx[j]] == nxt:\n                idx[j] += 1\n        ugly.append(nxt)\n    return ugly[n - 1]`,
        javascript: `var nthSuperUglyNumber = function(n, primes) {\n    var ugly = [1];\n    var idx = [];\n    for (var t = 0; t < primes.length; t++) idx.push(0);\n    while (ugly.length < n) {\n        var next = Infinity;\n        for (var j = 0; j < primes.length; j++) {\n            var cand = primes[j] * ugly[idx[j]];\n            if (cand < next) next = cand;\n        }\n        for (var k = 0; k < primes.length; k++) {\n            if (primes[k] * ugly[idx[k]] === next) idx[k]++;\n        }\n        ugly.push(next);\n    }\n    return ugly[n - 1];\n};`,
        typescript: `function nthSuperUglyNumber(n: number, primes: number[]): number {\n    var ugly: number[] = [1];\n    var idx: number[] = [];\n    for (var t = 0; t < primes.length; t++) idx.push(0);\n    while (ugly.length < n) {\n        var next = Infinity;\n        for (var j = 0; j < primes.length; j++) {\n            var cand = primes[j] * ugly[idx[j]];\n            if (cand < next) next = cand;\n        }\n        for (var k = 0; k < primes.length; k++) {\n            if (primes[k] * ugly[idx[k]] === next) idx[k]++;\n        }\n        ugly.push(next);\n    }\n    return ugly[n - 1];\n}`,
        java: `public static int nthSuperUglyNumber(int n, int[] primes) {\n    long[] ugly = new long[n];\n    ugly[0] = 1;\n    int[] idx = new int[primes.length];\n    for (int i = 1; i < n; i++) {\n        long next = Long.MAX_VALUE;\n        for (int j = 0; j < primes.length; j++) {\n            long cand = (long) primes[j] * ugly[idx[j]];\n            if (cand < next) next = cand;\n        }\n        for (int j = 0; j < primes.length; j++) {\n            if ((long) primes[j] * ugly[idx[j]] == next) idx[j]++;\n        }\n        ugly[i] = next;\n    }\n    return (int) ugly[n - 1];\n}`,
        cpp: `int nthSuperUglyNumber(int n, vector<int>& primes) {\n    vector<long long> ugly(n);\n    ugly[0] = 1;\n    vector<int> idx(primes.size(), 0);\n    for (int i = 1; i < n; i++) {\n        long long next = LLONG_MAX;\n        for (size_t j = 0; j < primes.size(); j++) {\n            long long cand = (long long) primes[j] * ugly[idx[j]];\n            if (cand < next) next = cand;\n        }\n        for (size_t j = 0; j < primes.size(); j++) {\n            if ((long long) primes[j] * ugly[idx[j]] == next) idx[j]++;\n        }\n        ugly[i] = next;\n    }\n    return (int) ugly[n - 1];\n}`,
        c: `int nthSuperUglyNumber(int n, int* primes, int primesSize) {\n    long long* ugly = (long long*) malloc((size_t) n * sizeof(long long));\n    ugly[0] = 1;\n    int* idx = (int*) calloc((size_t) primesSize, sizeof(int));\n    for (int i = 1; i < n; i++) {\n        long long next = 9223372036854775807LL;\n        for (int j = 0; j < primesSize; j++) {\n            long long cand = (long long) primes[j] * ugly[idx[j]];\n            if (cand < next) next = cand;\n        }\n        for (int j = 0; j < primesSize; j++) {\n            if ((long long) primes[j] * ugly[idx[j]] == next) idx[j]++;\n        }\n        ugly[i] = next;\n    }\n    int ans = (int) ugly[n - 1];\n    free(ugly);\n    free(idx);\n    return ans;\n}`,
        csharp: `public static int NthSuperUglyNumber(int n, int[] primes)\n{\n    long[] ugly = new long[n];\n    ugly[0] = 1;\n    int[] idx = new int[primes.Length];\n    for (int i = 1; i < n; i++)\n    {\n        long next = long.MaxValue;\n        for (int j = 0; j < primes.Length; j++)\n        {\n            long cand = (long) primes[j] * ugly[idx[j]];\n            if (cand < next) next = cand;\n        }\n        for (int j = 0; j < primes.Length; j++)\n        {\n            if ((long) primes[j] * ugly[idx[j]] == next) idx[j]++;\n        }\n        ugly[i] = next;\n    }\n    return (int) ugly[n - 1];\n}`,
        go: `func nthSuperUglyNumber(n int, primes []int) int {\n\tugly := make([]int, n)\n\tugly[0] = 1\n\tidx := make([]int, len(primes))\n\tfor i := 1; i < n; i++ {\n\t\tnext := math.MaxInt64\n\t\tfor j := range primes {\n\t\t\tcand := primes[j] * ugly[idx[j]]\n\t\t\tif cand < next {\n\t\t\t\tnext = cand\n\t\t\t}\n\t\t}\n\t\tfor j := range primes {\n\t\t\tif primes[j]*ugly[idx[j]] == next {\n\t\t\t\tidx[j]++\n\t\t\t}\n\t\t}\n\t\tugly[i] = next\n\t}\n\treturn ugly[n-1]\n}`,
        kotlin: `fun nthSuperUglyNumber(n: Int, primes: IntArray): Int {\n    val ugly = LongArray(n)\n    ugly[0] = 1\n    val idx = IntArray(primes.size)\n    for (i in 1 until n) {\n        var next = Long.MAX_VALUE\n        for (j in primes.indices) {\n            val cand = primes[j].toLong() * ugly[idx[j]]\n            if (cand < next) next = cand\n        }\n        for (j in primes.indices) {\n            if (primes[j].toLong() * ugly[idx[j]] == next) idx[j]++\n        }\n        ugly[i] = next\n    }\n    return ugly[n - 1].toInt()\n}`,
        swift: `func nthSuperUglyNumber(_ n: Int, _ primes: [Int]) -> Int {\n    var ugly = [Int](repeating: 0, count: n)\n    ugly[0] = 1\n    var idx = [Int](repeating: 0, count: primes.count)\n    for i in 1..<max(n, 1) where i < n {\n        var next = Int.max\n        for j in 0..<primes.count {\n            let cand = primes[j] * ugly[idx[j]]\n            if cand < next { next = cand }\n        }\n        for j in 0..<primes.count {\n            if primes[j] * ugly[idx[j]] == next { idx[j] += 1 }\n        }\n        ugly[i] = next\n    }\n    return ugly[n - 1]\n}`,
        rust: `fn nthSuperUglyNumber(n: i32, primes: Vec<i32>) -> i32 {\n    let n = n as usize;\n    let mut ugly = vec![0i64; n];\n    ugly[0] = 1;\n    let mut idx = vec![0usize; primes.len()];\n    for i in 1..n {\n        let mut next = i64::MAX;\n        for j in 0..primes.len() {\n            let cand = primes[j] as i64 * ugly[idx[j]];\n            if cand < next {\n                next = cand;\n            }\n        }\n        for j in 0..primes.len() {\n            if primes[j] as i64 * ugly[idx[j]] == next {\n                idx[j] += 1;\n            }\n        }\n        ugly[i] = next;\n    }\n    ugly[n - 1] as i32\n}`,
        php: `function nthSuperUglyNumber($n, $primes) {\n    $ugly = array(1);\n    $idx = array_fill(0, count($primes), 0);\n    while (count($ugly) < $n) {\n        $next = PHP_INT_MAX;\n        foreach ($primes as $j => $p) {\n            $cand = $p * $ugly[$idx[$j]];\n            if ($cand < $next) $next = $cand;\n        }\n        foreach ($primes as $j => $p) {\n            if ($p * $ugly[$idx[$j]] === $next) $idx[$j]++;\n        }\n        $ugly[] = $next;\n    }\n    return $ugly[$n - 1];\n}`,
        ruby: `def nthSuperUglyNumber(n, primes)\n  ugly = [1]\n  idx = Array.new(primes.length, 0)\n  while ugly.length < n\n    nxt = (0...primes.length).map { |j| primes[j] * ugly[idx[j]] }.min\n    (0...primes.length).each { |j| idx[j] += 1 if primes[j] * ugly[idx[j]] == nxt }\n    ugly << nxt\n  end\n  ugly[n - 1]\nend`,
      },
    };
  })(),

  // ── Count Total Number of Colored Cells (LC 2579) ───────────────
  (() => {
    const ref = (n: number) => 2 * n * n - 2 * n + 1;
    return {
      slug: "count-total-number-of-colored-cells",
      title: "Count Total Number of Colored Cells",
      difficulty: "EASY" as const,
      tags: ["Math", "Simulation", "TCS", "Infosys", "Amazon"],
      signature: { funcName: "coloredCells", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "On an infinite grid you colour one cell in minute 1. In every later minute you colour **every** uncoloured cell that shares an edge with an already-coloured cell.\n\nReturn how many cells are coloured at the end of minute `n`.",
        [
          { in: "n = 1", out: "1", note: "One cell." },
          { in: "n = 2", out: "5", note: "The centre plus its four edge neighbours." },
          { in: "n = 3", out: "13", note: "The diamond grows by 8 cells." },
        ],
        ["1 <= n <= 20000"]),
      hints: [
        "Draw the first three minutes: the shape is a diamond, not a square.",
        "Minute `k` adds a ring of `4(k - 1)` cells.",
        "Summing those rings gives a closed form in `n`.",
      ],
      editorial: explain({
        idea: "The coloured region is the diamond of cells within Manhattan distance `n - 1` of the start. Its size follows from summing the ring sizes.",
        steps: [
          "Minute 1 colours 1 cell; minute `k > 1` adds a ring of `4(k - 1)` cells.",
          "Total `= 1 + 4(1 + 2 + … + (n-1)) = 1 + 4 · n(n-1)/2 = 2n² - 2n + 1`.",
          "Return that value.",
        ],
        why: "The set reachable in `k` minutes is exactly the cells at Manhattan distance at most `k - 1`, and the number at distance exactly `d > 0` is `4d` — one for each of the four diagonal edges of the diamond.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "`(2n - 1)²` counts a square, not a diamond, and overcounts badly.",
          "At `n = 20000` the answer is about `8 × 10^8`, which fits in a 32-bit integer — but the intermediate `2n²` must not be computed in a narrower type.",
        ],
      }),
      examples: [
        { input: "1", expectedOutput: "1" },
        { input: "2", expectedOutput: "5" },
        { input: "3", expectedOutput: "13" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def coloredCells(n: int) -> int:\n    return 2 * n * n - 2 * n + 1`,
        javascript: `var coloredCells = function(n) {\n    return 2 * n * n - 2 * n + 1;\n};`,
        typescript: `function coloredCells(n: number): number {\n    return 2 * n * n - 2 * n + 1;\n}`,
        java: `public static int coloredCells(int n) {\n    long v = n;\n    return (int) (2 * v * v - 2 * v + 1);\n}`,
        cpp: `int coloredCells(int n) {\n    long long v = n;\n    return (int) (2 * v * v - 2 * v + 1);\n}`,
        c: `int coloredCells(int n) {\n    long long v = n;\n    return (int) (2 * v * v - 2 * v + 1);\n}`,
        csharp: `public static int ColoredCells(int n)\n{\n    long v = n;\n    return (int) (2 * v * v - 2 * v + 1);\n}`,
        go: `func coloredCells(n int) int {\n\treturn 2*n*n - 2*n + 1\n}`,
        kotlin: `fun coloredCells(n: Int): Int {\n    val v = n.toLong()\n    return (2 * v * v - 2 * v + 1).toInt()\n}`,
        swift: `func coloredCells(_ n: Int) -> Int {\n    return 2 * n * n - 2 * n + 1\n}`,
        rust: `fn coloredCells(n: i32) -> i32 {\n    let v = n as i64;\n    (2 * v * v - 2 * v + 1) as i32\n}`,
        php: `function coloredCells($n) {\n    return 2 * $n * $n - 2 * $n + 1;\n}`,
        ruby: `def coloredCells(n)\n  2 * n * n - 2 * n + 1\nend`,
      },
    };
  })(),

  // ── Maximum Value of an Ordered Triplet I (LC 2874) ─────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = 0, bestDiff = 0, bestI = 0;
      for (let k = 0; k < nums.length; k++) {
        if (bestDiff * nums[k] > best) best = bestDiff * nums[k];
        if (bestI - nums[k] > bestDiff) bestDiff = bestI - nums[k];
        if (nums[k] > bestI) bestI = nums[k];
      }
      return best;
    };
    return {
      slug: "maximum-value-of-an-ordered-triplet-i",
      title: "Maximum Value of an Ordered Triplet I",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Prefix Sum", "Amazon", "Google", "Uber"],
      signature: { funcName: "maximumTripletValue", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The value of an ordered triplet `(i, j, k)` with `i < j < k` is `(nums[i] - nums[j]) * nums[k]`.\n\nReturn the maximum value over all such triplets, or `0` if every triplet has a negative value.",
        [
          { in: "nums = [12,6,1,2,7]", out: "77", note: "(12 - 1) * 7 = 77." },
          { in: "nums = [1,10,3,4,19]", out: "133", note: "(1 - 10) is negative; (10 - 3) * 19 = 133." },
          { in: "nums = [1,2,3]", out: "0", note: "The only triplet gives (1 - 2) * 3 = -3, so the answer floors at 0." },
        ],
        ["3 <= nums.length <= 1000", "1 <= nums[i] <= 1000000"]),
      hints: [
        "The brute force is O(n³). Think about what each index needs to know about the ones before it.",
        "For a fixed `k`, you want the largest `nums[i] - nums[j]` with `i < j < k`.",
        "Sweep once, carrying the best `nums[i]` so far and the best difference so far.",
      ],
      editorial: explain({
        idea: "Sweep `k` from left to right while maintaining two running maxima: the largest element seen so far, and the largest difference `nums[i] - nums[j]` over pairs entirely before `k`. Then each `k` is answered in constant time.",
        steps: [
          "Keep `bestI` (the maximum element seen), `bestDiff` (the maximum `nums[i] - nums[j]` with `i < j`), and `best` (the answer, starting at 0).",
          "At index `k`, first update `best` with `bestDiff * nums[k]`.",
          "Then update `bestDiff` with `bestI - nums[k]`, and finally `bestI` with `nums[k]`.",
        ],
        why: "The update order is what enforces `i < j < k`: `bestDiff` is read before it is allowed to include index `k` as a `j`, and `bestI` is updated last so it never contributes an `i` at or after the `j` that uses it.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Updating `bestI` before `bestDiff` lets `i` and `j` be the same index.",
          "Updating `bestDiff` before reading it lets `j` equal `k`.",
          "The answer floors at 0, so it must start at 0 rather than at negative infinity.",
        ],
      }),
      examples: [
        { input: "[12,6,1,2,7]", expectedOutput: "77" },
        { input: "[1,10,3,4,19]", expectedOutput: "133" },
        { input: "[1,2,3]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 40);
        const hi = rng() < 0.5 ? 20 : 1000000;
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumTripletValue(nums: List[int]) -> int:\n    best = best_diff = best_i = 0\n    for x in nums:\n        best = max(best, best_diff * x)\n        best_diff = max(best_diff, best_i - x)\n        best_i = max(best_i, x)\n    return best`,
        javascript: `var maximumTripletValue = function(nums) {\n    var best = 0, bestDiff = 0, bestI = 0;\n    for (var k = 0; k < nums.length; k++) {\n        if (bestDiff * nums[k] > best) best = bestDiff * nums[k];\n        if (bestI - nums[k] > bestDiff) bestDiff = bestI - nums[k];\n        if (nums[k] > bestI) bestI = nums[k];\n    }\n    return best;\n};`,
        typescript: `function maximumTripletValue(nums: number[]): number {\n    var best = 0, bestDiff = 0, bestI = 0;\n    for (var k = 0; k < nums.length; k++) {\n        if (bestDiff * nums[k] > best) best = bestDiff * nums[k];\n        if (bestI - nums[k] > bestDiff) bestDiff = bestI - nums[k];\n        if (nums[k] > bestI) bestI = nums[k];\n    }\n    return best;\n}`,
        java: `public static int maximumTripletValue(int[] nums) {\n    long best = 0, bestDiff = 0, bestI = 0;\n    for (int x : nums) {\n        best = Math.max(best, bestDiff * x);\n        bestDiff = Math.max(bestDiff, bestI - x);\n        bestI = Math.max(bestI, x);\n    }\n    return (int) best;\n}`,
        cpp: `int maximumTripletValue(vector<int>& nums) {\n    long long best = 0, bestDiff = 0, bestI = 0;\n    for (int x : nums) {\n        best = max(best, bestDiff * x);\n        bestDiff = max(bestDiff, bestI - x);\n        bestI = max(bestI, (long long) x);\n    }\n    return (int) best;\n}`,
        c: `int maximumTripletValue(int* nums, int numsSize) {\n    long long best = 0, bestDiff = 0, bestI = 0;\n    for (int k = 0; k < numsSize; k++) {\n        long long x = nums[k];\n        if (bestDiff * x > best) best = bestDiff * x;\n        if (bestI - x > bestDiff) bestDiff = bestI - x;\n        if (x > bestI) bestI = x;\n    }\n    return (int) best;\n}`,
        csharp: `public static int MaximumTripletValue(int[] nums)\n{\n    long best = 0, bestDiff = 0, bestI = 0;\n    foreach (int x in nums)\n    {\n        best = Math.Max(best, bestDiff * x);\n        bestDiff = Math.Max(bestDiff, bestI - x);\n        bestI = Math.Max(bestI, x);\n    }\n    return (int) best;\n}`,
        go: `func maximumTripletValue(nums []int) int {\n\tbest, bestDiff, bestI := 0, 0, 0\n\tfor _, x := range nums {\n\t\tif bestDiff*x > best {\n\t\t\tbest = bestDiff * x\n\t\t}\n\t\tif bestI-x > bestDiff {\n\t\t\tbestDiff = bestI - x\n\t\t}\n\t\tif x > bestI {\n\t\t\tbestI = x\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maximumTripletValue(nums: IntArray): Int {\n    var best = 0L\n    var bestDiff = 0L\n    var bestI = 0L\n    for (x in nums) {\n        best = maxOf(best, bestDiff * x)\n        bestDiff = maxOf(bestDiff, bestI - x)\n        bestI = maxOf(bestI, x.toLong())\n    }\n    return best.toInt()\n}`,
        swift: `func maximumTripletValue(_ nums: [Int]) -> Int {\n    var best = 0\n    var bestDiff = 0\n    var bestI = 0\n    for x in nums {\n        best = max(best, bestDiff * x)\n        bestDiff = max(bestDiff, bestI - x)\n        bestI = max(bestI, x)\n    }\n    return best\n}`,
        rust: `fn maximumTripletValue(nums: Vec<i32>) -> i32 {\n    let mut best: i64 = 0;\n    let mut best_diff: i64 = 0;\n    let mut best_i: i64 = 0;\n    for &x in nums.iter() {\n        let v = x as i64;\n        if best_diff * v > best {\n            best = best_diff * v;\n        }\n        if best_i - v > best_diff {\n            best_diff = best_i - v;\n        }\n        if v > best_i {\n            best_i = v;\n        }\n    }\n    best as i32\n}`,
        php: `function maximumTripletValue($nums) {\n    $best = 0;\n    $bestDiff = 0;\n    $bestI = 0;\n    foreach ($nums as $x) {\n        if ($bestDiff * $x > $best) $best = $bestDiff * $x;\n        if ($bestI - $x > $bestDiff) $bestDiff = $bestI - $x;\n        if ($x > $bestI) $bestI = $x;\n    }\n    return $best;\n}`,
        ruby: `def maximumTripletValue(nums)\n  best = 0\n  best_diff = 0\n  best_i = 0\n  nums.each do |x|\n    best = [best, best_diff * x].max\n    best_diff = [best_diff, best_i - x].max\n    best_i = [best_i, x].max\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Minimum Time to Repair Cars (LC 2594) ───────────────────────
  (() => {
    const isqrt = (v: number) => {
      let lo = 0, hi = 100000;
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        if (mid * mid <= v) lo = mid; else hi = mid - 1;
      }
      return lo;
    };
    const ref = (ranks: number[], cars: number) => {
      let lo = 1, hi = 0;
      for (const r of ranks) { const t = r * cars * cars; if (t > hi) hi = t; }
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        let done = 0;
        for (const r of ranks) { done += isqrt(Math.floor(mid / r)); if (done >= cars) break; }
        if (done >= cars) hi = mid; else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "minimum-time-to-repair-cars",
      title: "Minimum Time to Repair Cars",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Greedy", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "repairCars", params: [{ name: "ranks", type: "int[]" as const }, { name: "cars", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A mechanic with rank `r` needs `r * k²` minutes to repair `k` cars. All mechanics work **simultaneously**.\n\nGiven the ranks and the number of `cars` to repair, return the minimum number of minutes until every car is done.",
        [
          { in: "ranks = [4,2,3,1], cars = 10", out: "16", note: "In 16 minutes the ranks repair 2, 2, 2 and 4 cars — ten in total." },
          { in: "ranks = [5,1,8], cars = 6", out: "16", note: "1 + 4 + 1 = 6 cars in 16 minutes." },
          { in: "ranks = [1], cars = 3", out: "9" },
        ],
        ["1 <= ranks.length <= 100", "1 <= ranks[i] <= 100", "1 <= cars <= 1000"]),
      hints: [
        "If `t` minutes are enough, so is any larger time — the feasibility test is monotone, which is the signal for binary search.",
        "In `t` minutes a mechanic of rank `r` finishes `floor(sqrt(t / r))` cars.",
        "Binary search the smallest `t` whose total reaches `cars`.",
      ],
      editorial: explain({
        idea: "Binary search on the answer. Checking a candidate time is a single pass: each mechanic's throughput at time `t` is `floor(sqrt(t / r))`, and the question is whether the throughputs sum to at least `cars`.",
        steps: [
          "Set the search range from `1` to `max(ranks) * cars²`, which is certainly enough time.",
          "For a candidate `t`, sum `floor(sqrt(t / r))` over the ranks, stopping early once the total reaches `cars`.",
          "Shrink the range towards the smallest feasible `t`.",
        ],
        why: "The throughput of each mechanic is non-decreasing in `t`, so feasibility is monotone and the boundary is exactly the answer. The upper bound works because a single mechanic of the worst rank could do all the cars in that time.",
        time: "O(n log(max rank · cars²))",
        space: "O(1)",
        pitfalls: [
          "Floating-point `sqrt` can land one off near a perfect square; an integer square root by binary search avoids the question entirely — and the judge's C harness has no `math.h`.",
          "The upper bound `max(ranks) * cars²` reaches 10⁸ here; at LeetCode's real limits it needs 64 bits.",
          "Dividing before the square root (`sqrt(t / r)`) is correct because the floor of the quotient never overshoots.",
        ],
      }),
      examples: [
        { input: "[4,2,3,1]\n10", expectedOutput: "16" },
        { input: "[5,1,8]\n6", expectedOutput: "16" },
        { input: "[1]\n3", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const ranks = Array.from({ length: ri(rng, 1, 20) }, () => ri(rng, 1, 100));
        const cars = ri(rng, 1, 200);
        return { input: `${fmtIntArr(ranks)}\n${cars}`, expectedOutput: String(ref(ranks, cars)) };
      },
      solutions: {
        python: `from typing import List\n\ndef repairCars(ranks: List[int], cars: int) -> int:\n    def isqrt(v: int) -> int:\n        lo, hi = 0, 100000\n        while lo < hi:\n            mid = (lo + hi + 1) // 2\n            if mid * mid <= v:\n                lo = mid\n            else:\n                hi = mid - 1\n        return lo\n\n    lo, hi = 1, max(ranks) * cars * cars\n    while lo < hi:\n        mid = (lo + hi) // 2\n        done = 0\n        for r in ranks:\n            done += isqrt(mid // r)\n            if done >= cars:\n                break\n        if done >= cars:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var repairCars = function(ranks, cars) {\n    var isqrt = function(v) {\n        var lo = 0, hi = 100000;\n        while (lo < hi) {\n            var mid = Math.floor((lo + hi + 1) / 2);\n            if (mid * mid <= v) lo = mid;\n            else hi = mid - 1;\n        }\n        return lo;\n    };\n    var lo = 1, hi = 0;\n    for (var i = 0; i < ranks.length; i++) {\n        var t = ranks[i] * cars * cars;\n        if (t > hi) hi = t;\n    }\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        var done = 0;\n        for (var j = 0; j < ranks.length; j++) {\n            done += isqrt(Math.floor(mid / ranks[j]));\n            if (done >= cars) break;\n        }\n        if (done >= cars) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n};`,
        typescript: `function repairCars(ranks: number[], cars: number): number {\n    var isqrt = function(v: number): number {\n        var lo = 0, hi = 100000;\n        while (lo < hi) {\n            var mid = Math.floor((lo + hi + 1) / 2);\n            if (mid * mid <= v) lo = mid;\n            else hi = mid - 1;\n        }\n        return lo;\n    };\n    var lo = 1, hi = 0;\n    for (var i = 0; i < ranks.length; i++) {\n        var t = ranks[i] * cars * cars;\n        if (t > hi) hi = t;\n    }\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        var done = 0;\n        for (var j = 0; j < ranks.length; j++) {\n            done += isqrt(Math.floor(mid / ranks[j]));\n            if (done >= cars) break;\n        }\n        if (done >= cars) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`,
        java: `public static int repairCars(int[] ranks, int cars) {\n    long lo = 1, hi = 0;\n    for (int r : ranks) hi = Math.max(hi, (long) r * cars * cars);\n    while (lo < hi) {\n        long mid = (lo + hi) / 2;\n        long done = 0;\n        for (int r : ranks) {\n            done += isqrtRepair(mid / r);\n            if (done >= cars) break;\n        }\n        if (done >= cars) hi = mid;\n        else lo = mid + 1;\n    }\n    return (int) lo;\n}\n\nstatic long isqrtRepair(long v) {\n    long lo = 0, hi = 100000;\n    while (lo < hi) {\n        long mid = (lo + hi + 1) / 2;\n        if (mid * mid <= v) lo = mid;\n        else hi = mid - 1;\n    }\n    return lo;\n}`,
        cpp: `static long long isqrtRepair(long long v) {\n    long long lo = 0, hi = 100000;\n    while (lo < hi) {\n        long long mid = (lo + hi + 1) / 2;\n        if (mid * mid <= v) lo = mid;\n        else hi = mid - 1;\n    }\n    return lo;\n}\n\nint repairCars(vector<int>& ranks, int cars) {\n    long long lo = 1, hi = 0;\n    for (int r : ranks) hi = max(hi, (long long) r * cars * cars);\n    while (lo < hi) {\n        long long mid = (lo + hi) / 2;\n        long long done = 0;\n        for (int r : ranks) {\n            done += isqrtRepair(mid / r);\n            if (done >= cars) break;\n        }\n        if (done >= cars) hi = mid;\n        else lo = mid + 1;\n    }\n    return (int) lo;\n}`,
        c: `static long long isqrtRepairC(long long v) {\n    long long lo = 0, hi = 100000;\n    while (lo < hi) {\n        long long mid = (lo + hi + 1) / 2;\n        if (mid * mid <= v) lo = mid;\n        else hi = mid - 1;\n    }\n    return lo;\n}\n\nint repairCars(int* ranks, int ranksSize, int cars) {\n    long long lo = 1, hi = 0;\n    for (int i = 0; i < ranksSize; i++) {\n        long long t = (long long) ranks[i] * cars * cars;\n        if (t > hi) hi = t;\n    }\n    while (lo < hi) {\n        long long mid = (lo + hi) / 2;\n        long long done = 0;\n        for (int i = 0; i < ranksSize; i++) {\n            done += isqrtRepairC(mid / ranks[i]);\n            if (done >= cars) break;\n        }\n        if (done >= cars) hi = mid;\n        else lo = mid + 1;\n    }\n    return (int) lo;\n}`,
        csharp: `public static int RepairCars(int[] ranks, int cars)\n{\n    long lo = 1, hi = 0;\n    foreach (int r in ranks) hi = Math.Max(hi, (long) r * cars * cars);\n    while (lo < hi)\n    {\n        long mid = (lo + hi) / 2;\n        long done = 0;\n        foreach (int r in ranks)\n        {\n            done += IsqrtRepair(mid / r);\n            if (done >= cars) break;\n        }\n        if (done >= cars) hi = mid;\n        else lo = mid + 1;\n    }\n    return (int) lo;\n}\n\nstatic long IsqrtRepair(long v)\n{\n    long lo = 0, hi = 100000;\n    while (lo < hi)\n    {\n        long mid = (lo + hi + 1) / 2;\n        if (mid * mid <= v) lo = mid;\n        else hi = mid - 1;\n    }\n    return lo;\n}`,
        go: `func repairCars(ranks []int, cars int) int {\n\tisqrt := func(v int) int {\n\t\tlo, hi := 0, 100000\n\t\tfor lo < hi {\n\t\t\tmid := (lo + hi + 1) / 2\n\t\t\tif mid*mid <= v {\n\t\t\t\tlo = mid\n\t\t\t} else {\n\t\t\t\thi = mid - 1\n\t\t\t}\n\t\t}\n\t\treturn lo\n\t}\n\tlo, hi := 1, 0\n\tfor _, r := range ranks {\n\t\tif t := r * cars * cars; t > hi {\n\t\t\thi = t\n\t\t}\n\t}\n\tfor lo < hi {\n\t\tmid := (lo + hi) / 2\n\t\tdone := 0\n\t\tfor _, r := range ranks {\n\t\t\tdone += isqrt(mid / r)\n\t\t\tif done >= cars {\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tif done >= cars {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `fun repairCars(ranks: IntArray, cars: Int): Int {\n    fun isqrt(v: Long): Long {\n        var lo = 0L\n        var hi = 100000L\n        while (lo < hi) {\n            val mid = (lo + hi + 1) / 2\n            if (mid * mid <= v) lo = mid else hi = mid - 1\n        }\n        return lo\n    }\n    var lo = 1L\n    var hi = 0L\n    for (r in ranks) hi = maxOf(hi, r.toLong() * cars * cars)\n    while (lo < hi) {\n        val mid = (lo + hi) / 2\n        var done = 0L\n        for (r in ranks) {\n            done += isqrt(mid / r)\n            if (done >= cars) break\n        }\n        if (done >= cars) hi = mid else lo = mid + 1\n    }\n    return lo.toInt()\n}`,
        swift: `func repairCars(_ ranks: [Int], _ cars: Int) -> Int {\n    func isqrt(_ v: Int) -> Int {\n        var lo = 0\n        var hi = 100000\n        while lo < hi {\n            let mid = (lo + hi + 1) / 2\n            if mid * mid <= v { lo = mid } else { hi = mid - 1 }\n        }\n        return lo\n    }\n    var lo = 1\n    var hi = 0\n    for r in ranks { hi = max(hi, r * cars * cars) }\n    while lo < hi {\n        let mid = (lo + hi) / 2\n        var done = 0\n        for r in ranks {\n            done += isqrt(mid / r)\n            if done >= cars { break }\n        }\n        if done >= cars { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
        rust: `fn repairCars(ranks: Vec<i32>, cars: i32) -> i32 {\n    fn isqrt(v: i64) -> i64 {\n        let mut lo = 0i64;\n        let mut hi = 100000i64;\n        while lo < hi {\n            let mid = (lo + hi + 1) / 2;\n            if mid * mid <= v { lo = mid; } else { hi = mid - 1; }\n        }\n        lo\n    }\n    let cars64 = cars as i64;\n    let mut lo: i64 = 1;\n    let mut hi: i64 = 0;\n    for &r in ranks.iter() {\n        let t = r as i64 * cars64 * cars64;\n        if t > hi {\n            hi = t;\n        }\n    }\n    while lo < hi {\n        let mid = (lo + hi) / 2;\n        let mut done: i64 = 0;\n        for &r in ranks.iter() {\n            done += isqrt(mid / r as i64);\n            if done >= cars64 {\n                break;\n            }\n        }\n        if done >= cars64 { hi = mid; } else { lo = mid + 1; }\n    }\n    lo as i32\n}`,
        php: `function repairCars($ranks, $cars) {\n    $isqrt = function($v) {\n        $lo = 0;\n        $hi = 100000;\n        while ($lo < $hi) {\n            $mid = intdiv($lo + $hi + 1, 2);\n            if ($mid * $mid <= $v) $lo = $mid;\n            else $hi = $mid - 1;\n        }\n        return $lo;\n    };\n    $lo = 1;\n    $hi = 0;\n    foreach ($ranks as $r) {\n        $t = $r * $cars * $cars;\n        if ($t > $hi) $hi = $t;\n    }\n    while ($lo < $hi) {\n        $mid = intdiv($lo + $hi, 2);\n        $done = 0;\n        foreach ($ranks as $r) {\n            $done += $isqrt(intdiv($mid, $r));\n            if ($done >= $cars) break;\n        }\n        if ($done >= $cars) $hi = $mid;\n        else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
        ruby: `def repairCars(ranks, cars)\n  lo = 1\n  hi = ranks.map { |r| r * cars * cars }.max\n  while lo < hi\n    mid = (lo + hi) / 2\n    done = 0\n    ranks.each do |r|\n      done += Integer.sqrt(mid / r)\n      break if done >= cars\n    end\n    if done >= cars\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Largest Multiple of Three (LC 1363) ─────────────────────────
  (() => {
    const ref = (digits: number[]) => {
      const count = new Array(10).fill(0);
      let sum = 0;
      for (const d of digits) { count[d]++; sum += d; }
      const r = sum % 3;
      if (r !== 0) {
        let removed = false;
        for (let d = r; d <= 9; d += 3) {
          if (count[d] > 0) { count[d]--; removed = true; break; }
        }
        if (!removed) {
          let need = 2;
          for (let d = (3 - r) % 3; d <= 9 && need > 0; d += 3) {
            while (count[d] > 0 && need > 0) { count[d]--; need--; }
          }
          if (need > 0) return "";
        }
      }
      let out = "";
      for (let d = 9; d >= 0; d--) {
        for (let t = 0; t < count[d]; t++) out += String(d);
      }
      if (out.length === 0) return "";
      if (out.charAt(0) === "0") return "0";
      return out;
    };
    return {
      slug: "largest-multiple-of-three",
      title: "Largest Multiple of Three",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Dynamic Programming", "Math", "Google", "Amazon", "Meta"],
      signature: { funcName: "largestMultipleOfThree", params: [{ name: "digits", type: "int[]" as const }], returns: "string" as const },
      description: describe(
        "Given an array of `digits`, concatenate some of them (in any order, using each at most as many times as it appears) to form the **largest** possible number that is divisible by three.\n\nReturn it as a string without leading zeros, or `\"0\"` if the best answer is zero, or the empty string if no multiple of three can be formed.",
        [
          { in: "digits = [8,1,9]", out: "981", note: "8 + 1 + 9 = 18 is already divisible by 3, so use every digit in descending order." },
          { in: "digits = [8,6,7,1,0]", out: "8760", note: "The total is 22; dropping the 1 makes it 21 and leaves the largest arrangement." },
          { in: "digits = [1]", out: "", note: "Nothing can be formed." },
        ],
        ["1 <= digits.length <= 10000", "0 <= digits[i] <= 9"]),
      hints: [
        "A number is divisible by three exactly when its **digit sum** is — and the order of the digits does not affect the sum.",
        "So keep as many digits as possible, then fix the remainder by deleting the fewest, smallest digits.",
        "If the remainder is `r`, either delete one digit congruent to `r`, or two digits congruent to `3 - r`. Prefer deleting one.",
      ],
      editorial: explain({
        idea: "Divisibility depends only on the multiset of digits, while size depends first on how many digits survive and then on their descending order. So delete as few digits as possible — and among those, the smallest ones.",
        steps: [
          "Tally the digits and compute the total `sum`; let `r = sum % 3`.",
          "If `r != 0`, try deleting **one** digit congruent to `r` modulo 3, scanning `r, r+3, r+6` so the smallest goes first.",
          "If there is none, delete **two** digits congruent to `3 - r`, again smallest first. If two cannot be found, return `\"\"`.",
          "Emit the remaining digits from `9` down to `0`; if the result is empty return `\"\"`, and if it starts with `0` the answer is `\"0\"`.",
        ],
        why: "Deleting one digit beats deleting two, and within a fixed deletion count the surviving number is largest when the deleted digits are smallest and the survivors are sorted descending. One deletion congruent to `r` or two congruent to `3 - r` are the only ways to shift the remainder to zero while removing at most two digits, and removing three or more is never necessary when either option exists.",
        time: "O(n + 10)",
        space: "O(10)",
        pitfalls: [
          "Deleting the largest matching digit shrinks the answer unnecessarily.",
          "A leading zero means every surviving digit is zero, which must collapse to `\"0\"` rather than `\"000\"`.",
          "Sorting the whole array is fine but a 10-slot tally is both simpler and faster.",
        ],
      }),
      examples: [
        { input: "[8,1,9]", expectedOutput: "981" },
        { input: "[8,6,7,1,0]", expectedOutput: "8760" },
        { input: "[1]", expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const alphabet = rng() < 0.3 ? [0, 1, 2] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const digits = Array.from({ length: n }, () => pick(rng, alphabet));
        return { input: fmtIntArr(digits), expectedOutput: ref(digits) };
      },
      solutions: {
        python: `from typing import List\n\ndef largestMultipleOfThree(digits: List[int]) -> str:\n    count = [0] * 10\n    total = 0\n    for d in digits:\n        count[d] += 1\n        total += d\n    r = total % 3\n    if r != 0:\n        removed = False\n        for d in range(r, 10, 3):\n            if count[d] > 0:\n                count[d] -= 1\n                removed = True\n                break\n        if not removed:\n            need = 2\n            for d in range((3 - r) % 3, 10, 3):\n                while count[d] > 0 and need > 0:\n                    count[d] -= 1\n                    need -= 1\n            if need > 0:\n                return ""\n    out = "".join(str(d) * count[d] for d in range(9, -1, -1))\n    if not out:\n        return ""\n    if out[0] == "0":\n        return "0"\n    return out`,
        javascript: `var largestMultipleOfThree = function(digits) {\n    var count = [];\n    for (var t = 0; t < 10; t++) count.push(0);\n    var sum = 0;\n    for (var i = 0; i < digits.length; i++) { count[digits[i]]++; sum += digits[i]; }\n    var r = sum % 3;\n    if (r !== 0) {\n        var removed = false;\n        for (var d = r; d <= 9; d += 3) {\n            if (count[d] > 0) { count[d]--; removed = true; break; }\n        }\n        if (!removed) {\n            var need = 2;\n            for (var e = (3 - r) % 3; e <= 9 && need > 0; e += 3) {\n                while (count[e] > 0 && need > 0) { count[e]--; need--; }\n            }\n            if (need > 0) return "";\n        }\n    }\n    var out = "";\n    for (var g = 9; g >= 0; g--) {\n        for (var k = 0; k < count[g]; k++) out += String(g);\n    }\n    if (out.length === 0) return "";\n    if (out.charAt(0) === "0") return "0";\n    return out;\n};`,
        typescript: `function largestMultipleOfThree(digits: number[]): string {\n    var count: number[] = [];\n    for (var t = 0; t < 10; t++) count.push(0);\n    var sum = 0;\n    for (var i = 0; i < digits.length; i++) { count[digits[i]]++; sum += digits[i]; }\n    var r = sum % 3;\n    if (r !== 0) {\n        var removed = false;\n        for (var d = r; d <= 9; d += 3) {\n            if (count[d] > 0) { count[d]--; removed = true; break; }\n        }\n        if (!removed) {\n            var need = 2;\n            for (var e = (3 - r) % 3; e <= 9 && need > 0; e += 3) {\n                while (count[e] > 0 && need > 0) { count[e]--; need--; }\n            }\n            if (need > 0) return "";\n        }\n    }\n    var out = "";\n    for (var g = 9; g >= 0; g--) {\n        for (var k = 0; k < count[g]; k++) out += String(g);\n    }\n    if (out.length === 0) return "";\n    if (out.charAt(0) === "0") return "0";\n    return out;\n}`,
        java: `public static String largestMultipleOfThree(int[] digits) {\n    int[] count = new int[10];\n    int sum = 0;\n    for (int d : digits) { count[d]++; sum += d; }\n    int r = sum % 3;\n    if (r != 0) {\n        boolean removed = false;\n        for (int d = r; d <= 9; d += 3) {\n            if (count[d] > 0) { count[d]--; removed = true; break; }\n        }\n        if (!removed) {\n            int need = 2;\n            for (int d = (3 - r) % 3; d <= 9 && need > 0; d += 3) {\n                while (count[d] > 0 && need > 0) { count[d]--; need--; }\n            }\n            if (need > 0) return "";\n        }\n    }\n    StringBuilder sb = new StringBuilder();\n    for (int d = 9; d >= 0; d--) {\n        for (int k = 0; k < count[d]; k++) sb.append((char) ('0' + d));\n    }\n    String out = sb.toString();\n    if (out.isEmpty()) return "";\n    if (out.charAt(0) == '0') return "0";\n    return out;\n}`,
        cpp: `string largestMultipleOfThree(vector<int>& digits) {\n    vector<int> count(10, 0);\n    int sum = 0;\n    for (int d : digits) { count[d]++; sum += d; }\n    int r = sum % 3;\n    if (r != 0) {\n        bool removed = false;\n        for (int d = r; d <= 9; d += 3) {\n            if (count[d] > 0) { count[d]--; removed = true; break; }\n        }\n        if (!removed) {\n            int need = 2;\n            for (int d = (3 - r) % 3; d <= 9 && need > 0; d += 3) {\n                while (count[d] > 0 && need > 0) { count[d]--; need--; }\n            }\n            if (need > 0) return "";\n        }\n    }\n    string out;\n    for (int d = 9; d >= 0; d--) {\n        for (int k = 0; k < count[d]; k++) out += (char) ('0' + d);\n    }\n    if (out.empty()) return "";\n    if (out[0] == '0') return "0";\n    return out;\n}`,
        c: `char* largestMultipleOfThree(int* digits, int digitsSize) {\n    int count[10];\n    memset(count, 0, sizeof(count));\n    int sum = 0;\n    for (int i = 0; i < digitsSize; i++) { count[digits[i]]++; sum += digits[i]; }\n    int r = sum % 3;\n    if (r != 0) {\n        int removed = 0;\n        for (int d = r; d <= 9; d += 3) {\n            if (count[d] > 0) { count[d]--; removed = 1; break; }\n        }\n        if (!removed) {\n            int need = 2;\n            for (int d = (3 - r) % 3; d <= 9 && need > 0; d += 3) {\n                while (count[d] > 0 && need > 0) { count[d]--; need--; }\n            }\n            if (need > 0) {\n                char* empty = (char*) malloc(1);\n                empty[0] = 0;\n                return empty;\n            }\n        }\n    }\n    char* out = (char*) malloc((size_t) digitsSize + 2);\n    int m = 0;\n    for (int d = 9; d >= 0; d--) {\n        for (int k = 0; k < count[d]; k++) out[m++] = (char) ('0' + d);\n    }\n    out[m] = 0;\n    if (m > 0 && out[0] == '0') { out[0] = '0'; out[1] = 0; }\n    return out;\n}`,
        csharp: `public static string LargestMultipleOfThree(int[] digits)\n{\n    int[] count = new int[10];\n    int sum = 0;\n    foreach (int d in digits) { count[d]++; sum += d; }\n    int r = sum % 3;\n    if (r != 0)\n    {\n        bool removed = false;\n        for (int d = r; d <= 9; d += 3)\n        {\n            if (count[d] > 0) { count[d]--; removed = true; break; }\n        }\n        if (!removed)\n        {\n            int need = 2;\n            for (int d = (3 - r) % 3; d <= 9 && need > 0; d += 3)\n            {\n                while (count[d] > 0 && need > 0) { count[d]--; need--; }\n            }\n            if (need > 0) return "";\n        }\n    }\n    var sb = new System.Text.StringBuilder();\n    for (int d = 9; d >= 0; d--)\n    {\n        for (int k = 0; k < count[d]; k++) sb.Append((char) ('0' + d));\n    }\n    string out_ = sb.ToString();\n    if (out_.Length == 0) return "";\n    if (out_[0] == '0') return "0";\n    return out_;\n}`,
        go: `func largestMultipleOfThree(digits []int) string {\n\tcount := make([]int, 10)\n\tsum := 0\n\tfor _, d := range digits {\n\t\tcount[d]++\n\t\tsum += d\n\t}\n\tr := sum % 3\n\tif r != 0 {\n\t\tremoved := false\n\t\tfor d := r; d <= 9; d += 3 {\n\t\t\tif count[d] > 0 {\n\t\t\t\tcount[d]--\n\t\t\t\tremoved = true\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tif !removed {\n\t\t\tneed := 2\n\t\t\tfor d := (3 - r) % 3; d <= 9 && need > 0; d += 3 {\n\t\t\t\tfor count[d] > 0 && need > 0 {\n\t\t\t\t\tcount[d]--\n\t\t\t\t\tneed--\n\t\t\t\t}\n\t\t\t}\n\t\t\tif need > 0 {\n\t\t\t\treturn ""\n\t\t\t}\n\t\t}\n\t}\n\tbuf := []byte{}\n\tfor d := 9; d >= 0; d-- {\n\t\tfor k := 0; k < count[d]; k++ {\n\t\t\tbuf = append(buf, byte(\'0\'+d))\n\t\t}\n\t}\n\tif len(buf) == 0 {\n\t\treturn ""\n\t}\n\tif buf[0] == \'0\' {\n\t\treturn "0"\n\t}\n\treturn string(buf)\n}`,
        kotlin: `fun largestMultipleOfThree(digits: IntArray): String {\n    val count = IntArray(10)\n    var sum = 0\n    for (d in digits) {\n        count[d]++\n        sum += d\n    }\n    val r = sum % 3\n    if (r != 0) {\n        var removed = false\n        var d = r\n        while (d <= 9) {\n            if (count[d] > 0) {\n                count[d]--\n                removed = true\n                break\n            }\n            d += 3\n        }\n        if (!removed) {\n            var need = 2\n            var e = (3 - r) % 3\n            while (e <= 9 && need > 0) {\n                while (count[e] > 0 && need > 0) {\n                    count[e]--\n                    need--\n                }\n                e += 3\n            }\n            if (need > 0) return ""\n        }\n    }\n    val sb = StringBuilder()\n    for (d in 9 downTo 0) {\n        repeat(count[d]) { sb.append(\'0\' + d) }\n    }\n    val out = sb.toString()\n    if (out.isEmpty()) return ""\n    if (out[0] == \'0\') return "0"\n    return out\n}`,
        swift: `func largestMultipleOfThree(_ digits: [Int]) -> String {\n    var count = [Int](repeating: 0, count: 10)\n    var sum = 0\n    for d in digits {\n        count[d] += 1\n        sum += d\n    }\n    let r = sum % 3\n    if r != 0 {\n        var removed = false\n        var d = r\n        while d <= 9 {\n            if count[d] > 0 {\n                count[d] -= 1\n                removed = true\n                break\n            }\n            d += 3\n        }\n        if !removed {\n            var need = 2\n            var e = (3 - r) % 3\n            while e <= 9 && need > 0 {\n                while count[e] > 0 && need > 0 {\n                    count[e] -= 1\n                    need -= 1\n                }\n                e += 3\n            }\n            if need > 0 { return "" }\n        }\n    }\n    var out = ""\n    for d in stride(from: 9, through: 0, by: -1) {\n        for _ in 0..<count[d] { out += String(d) }\n    }\n    if out.isEmpty { return "" }\n    if out.first == "0" { return "0" }\n    return out\n}`,
        rust: `fn largestMultipleOfThree(digits: Vec<i32>) -> String {\n    let mut count = [0i32; 10];\n    let mut sum = 0i32;\n    for &d in digits.iter() {\n        count[d as usize] += 1;\n        sum += d;\n    }\n    let r = sum % 3;\n    if r != 0 {\n        let mut removed = false;\n        let mut d = r as usize;\n        while d <= 9 {\n            if count[d] > 0 {\n                count[d] -= 1;\n                removed = true;\n                break;\n            }\n            d += 3;\n        }\n        if !removed {\n            let mut need = 2;\n            let mut e = ((3 - r) % 3) as usize;\n            while e <= 9 && need > 0 {\n                while count[e] > 0 && need > 0 {\n                    count[e] -= 1;\n                    need -= 1;\n                }\n                e += 3;\n            }\n            if need > 0 {\n                return String::new();\n            }\n        }\n    }\n    let mut out = String::new();\n    for d in (0..=9).rev() {\n        for _ in 0..count[d] {\n            out.push((b\'0\' + d as u8) as char);\n        }\n    }\n    if out.is_empty() {\n        return String::new();\n    }\n    if out.as_bytes()[0] == b\'0\' {\n        return "0".to_string();\n    }\n    out\n}`,
        php: `function largestMultipleOfThree($digits) {\n    $count = array_fill(0, 10, 0);\n    $sum = 0;\n    foreach ($digits as $d) { $count[$d]++; $sum += $d; }\n    $r = $sum % 3;\n    if ($r !== 0) {\n        $removed = false;\n        for ($d = $r; $d <= 9; $d += 3) {\n            if ($count[$d] > 0) { $count[$d]--; $removed = true; break; }\n        }\n        if (!$removed) {\n            $need = 2;\n            for ($e = (3 - $r) % 3; $e <= 9 && $need > 0; $e += 3) {\n                while ($count[$e] > 0 && $need > 0) { $count[$e]--; $need--; }\n            }\n            if ($need > 0) return "";\n        }\n    }\n    $out = "";\n    for ($d = 9; $d >= 0; $d--) {\n        $out .= str_repeat(strval($d), $count[$d]);\n    }\n    if ($out === "") return "";\n    if ($out[0] === "0") return "0";\n    return $out;\n}`,
        ruby: `def largestMultipleOfThree(digits)\n  count = Array.new(10, 0)\n  sum = 0\n  digits.each do |d|\n    count[d] += 1\n    sum += d\n  end\n  r = sum % 3\n  if r != 0\n    removed = false\n    d = r\n    while d <= 9\n      if count[d] > 0\n        count[d] -= 1\n        removed = true\n        break\n      end\n      d += 3\n    end\n    unless removed\n      need = 2\n      e = (3 - r) % 3\n      while e <= 9 && need > 0\n        while count[e] > 0 && need > 0\n          count[e] -= 1\n          need -= 1\n        end\n        e += 3\n      end\n      return "" if need > 0\n    end\n  end\n  out = (0..9).to_a.reverse.map { |d| d.to_s * count[d] }.join\n  return "" if out.empty?\n  return "0" if out[0] == "0"\n  out\nend`,
      },
    };
  })(),

  // ── Nth Magical Number (LC 878) ─────────────────────────────────
  (() => {
    const gcd = (x: number, y: number): number => (y === 0 ? x : gcd(y, x % y));
    const ref = (n: number, a: number, b: number) => {
      const MOD = 1000000007;
      const l = (a / gcd(a, b)) * b;
      let lo = 1, hi = Math.min(a, b) * n;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        const count = Math.floor(mid / a) + Math.floor(mid / b) - Math.floor(mid / l);
        if (count >= n) hi = mid; else lo = mid + 1;
      }
      return lo % MOD;
    };
    return {
      slug: "nth-magical-number",
      title: "Nth Magical Number",
      difficulty: "HARD" as const,
      tags: ["Math", "Binary Search", "Number Theory", "Google", "Amazon", "Apple"],
      signature: { funcName: "nthMagicalNumber", params: [{ name: "n", type: "int" as const }, { name: "a", type: "int" as const }, { name: "b", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A positive integer is **magical** if it is divisible by `a` or by `b`.\n\nReturn the `n`-th magical number, modulo `10^9 + 7`.",
        [
          { in: "n = 1, a = 2, b = 3", out: "2", note: "The magical numbers start 2, 3, 4, 6, 8, 9, …" },
          { in: "n = 4, a = 2, b = 3", out: "6" },
          { in: "n = 5, a = 2, b = 4", out: "10", note: "Every multiple of 4 is also a multiple of 2, so the sequence is just the even numbers." },
        ],
        ["1 <= n <= 1000000000", "2 <= a, b <= 40000"]),
      hints: [
        "Counting magical numbers up to `x` is easy: `x/a + x/b - x/lcm(a,b)` by inclusion–exclusion.",
        "That count is non-decreasing in `x`, so binary search for the smallest `x` whose count reaches `n`.",
        "Apply the modulo only to the final answer — never inside the counting, or the search breaks.",
      ],
      editorial: explain({
        idea: "Binary search on the answer with an inclusion–exclusion counting function. Counting multiples is exact and monotone, so the boundary of 'count reaches `n`' is the `n`-th magical number.",
        steps: [
          "Compute `l = lcm(a, b) = a / gcd(a, b) * b`.",
          "Define `count(x) = x/a + x/b - x/l`.",
          "Binary search the smallest `x >= 1` with `count(x) >= n`, using `min(a, b) * n` as a safe upper bound.",
          "Return `x % (10^9 + 7)`.",
        ],
        why: "Inclusion–exclusion is exact because the numbers divisible by both `a` and `b` are precisely the multiples of their lcm. The count only rises with `x` and rises by at least one at each magical number, so the smallest `x` reaching `n` is that `n`-th number itself.",
        time: "O(log(min(a,b) · n))",
        space: "O(1)",
        pitfalls: [
          "Reducing modulo inside `count` destroys monotonicity and the search returns nonsense.",
          "`a * b` can overflow before dividing; compute the lcm as `a / gcd * b`.",
          "The upper bound `min(a,b) * n` reaches `4 × 10^13`, so the search variables need 64 bits.",
        ],
      }),
      examples: [
        { input: "1\n2\n3", expectedOutput: "2" },
        { input: "4\n2\n3", expectedOutput: "6" },
        { input: "5\n2\n4", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const a = ri(rng, 2, rng() < 0.5 ? 20 : 40000);
        const b = ri(rng, 2, rng() < 0.5 ? 20 : 40000);
        const n = rng() < 0.5 ? ri(rng, 1, 500) : ri(rng, 1, 1000000000);
        return { input: `${n}\n${a}\n${b}`, expectedOutput: String(ref(n, a, b)) };
      },
      solutions: {
        python: `from math import gcd\n\ndef nthMagicalNumber(n: int, a: int, b: int) -> int:\n    MOD = 1000000007\n    l = a // gcd(a, b) * b\n    lo, hi = 1, min(a, b) * n\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if mid // a + mid // b - mid // l >= n:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo % MOD`,
        javascript: `var nthMagicalNumber = function(n, a, b) {\n    var MOD = 1000000007;\n    var gcd = function(x, y) {\n        while (y !== 0) {\n            var t = x % y;\n            x = y;\n            y = t;\n        }\n        return x;\n    };\n    var l = (a / gcd(a, b)) * b;\n    var lo = 1, hi = Math.min(a, b) * n;\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        var count = Math.floor(mid / a) + Math.floor(mid / b) - Math.floor(mid / l);\n        if (count >= n) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo % MOD;\n};`,
        typescript: `function nthMagicalNumber(n: number, a: number, b: number): number {\n    var MOD = 1000000007;\n    var gcd = function(x: number, y: number): number {\n        while (y !== 0) {\n            var t = x % y;\n            x = y;\n            y = t;\n        }\n        return x;\n    };\n    var l = (a / gcd(a, b)) * b;\n    var lo = 1, hi = Math.min(a, b) * n;\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        var count = Math.floor(mid / a) + Math.floor(mid / b) - Math.floor(mid / l);\n        if (count >= n) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo % MOD;\n}`,
        java: `public static int nthMagicalNumber(int n, int a, int b) {\n    final long MOD = 1000000007L;\n    long g = gcdMagic(a, b);\n    long l = (long) a / g * b;\n    long lo = 1, hi = (long) Math.min(a, b) * n;\n    while (lo < hi) {\n        long mid = (lo + hi) / 2;\n        long count = mid / a + mid / b - mid / l;\n        if (count >= n) hi = mid;\n        else lo = mid + 1;\n    }\n    return (int) (lo % MOD);\n}\n\nstatic long gcdMagic(long x, long y) {\n    while (y != 0) { long t = x % y; x = y; y = t; }\n    return x;\n}`,
        cpp: `static long long gcdMagic(long long x, long long y) {\n    while (y != 0) { long long t = x % y; x = y; y = t; }\n    return x;\n}\n\nint nthMagicalNumber(int n, int a, int b) {\n    const long long MOD = 1000000007LL;\n    long long l = (long long) a / gcdMagic(a, b) * b;\n    long long lo = 1, hi = (long long) min(a, b) * n;\n    while (lo < hi) {\n        long long mid = (lo + hi) / 2;\n        long long count = mid / a + mid / b - mid / l;\n        if (count >= n) hi = mid;\n        else lo = mid + 1;\n    }\n    return (int) (lo % MOD);\n}`,
        c: `static long long gcdMagicC(long long x, long long y) {\n    while (y != 0) { long long t = x % y; x = y; y = t; }\n    return x;\n}\n\nint nthMagicalNumber(int n, int a, int b) {\n    const long long MOD = 1000000007LL;\n    long long l = (long long) a / gcdMagicC(a, b) * b;\n    long long small = a < b ? a : b;\n    long long lo = 1, hi = small * n;\n    while (lo < hi) {\n        long long mid = (lo + hi) / 2;\n        long long count = mid / a + mid / b - mid / l;\n        if (count >= n) hi = mid;\n        else lo = mid + 1;\n    }\n    return (int) (lo % MOD);\n}`,
        csharp: `public static int NthMagicalNumber(int n, int a, int b)\n{\n    const long MOD = 1000000007L;\n    long g = GcdMagic(a, b);\n    long l = (long) a / g * b;\n    long lo = 1, hi = (long) Math.Min(a, b) * n;\n    while (lo < hi)\n    {\n        long mid = (lo + hi) / 2;\n        long count = mid / a + mid / b - mid / l;\n        if (count >= n) hi = mid;\n        else lo = mid + 1;\n    }\n    return (int) (lo % MOD);\n}\n\nstatic long GcdMagic(long x, long y)\n{\n    while (y != 0) { long t = x % y; x = y; y = t; }\n    return x;\n}`,
        go: `func nthMagicalNumber(n int, a int, b int) int {\n\tconst mod = 1000000007\n\tgcd := func(x, y int) int {\n\t\tfor y != 0 {\n\t\t\tx, y = y, x%y\n\t\t}\n\t\treturn x\n\t}\n\tl := a / gcd(a, b) * b\n\tsmall := a\n\tif b < a {\n\t\tsmall = b\n\t}\n\tlo, hi := 1, small*n\n\tfor lo < hi {\n\t\tmid := (lo + hi) / 2\n\t\tcount := mid/a + mid/b - mid/l\n\t\tif count >= n {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn lo % mod\n}`,
        kotlin: `fun nthMagicalNumber(n: Int, a: Int, b: Int): Int {\n    val mod = 1000000007L\n    fun gcd(x: Long, y: Long): Long {\n        var p = x\n        var q = y\n        while (q != 0L) {\n            val t = p % q\n            p = q\n            q = t\n        }\n        return p\n    }\n    val l = a.toLong() / gcd(a.toLong(), b.toLong()) * b\n    var lo = 1L\n    var hi = minOf(a, b).toLong() * n\n    while (lo < hi) {\n        val mid = (lo + hi) / 2\n        val count = mid / a + mid / b - mid / l\n        if (count >= n) hi = mid else lo = mid + 1\n    }\n    return (lo % mod).toInt()\n}`,
        swift: `func nthMagicalNumber(_ n: Int, _ a: Int, _ b: Int) -> Int {\n    let mod = 1000000007\n    func gcd(_ x: Int, _ y: Int) -> Int {\n        var p = x\n        var q = y\n        while q != 0 {\n            let t = p % q\n            p = q\n            q = t\n        }\n        return p\n    }\n    let l = a / gcd(a, b) * b\n    var lo = 1\n    var hi = min(a, b) * n\n    while lo < hi {\n        let mid = (lo + hi) / 2\n        let count = mid / a + mid / b - mid / l\n        if count >= n { hi = mid } else { lo = mid + 1 }\n    }\n    return lo % mod\n}`,
        rust: `fn nthMagicalNumber(n: i32, a: i32, b: i32) -> i32 {\n    let md: i64 = 1000000007;\n    fn gcd(mut x: i64, mut y: i64) -> i64 {\n        while y != 0 {\n            let t = x % y;\n            x = y;\n            y = t;\n        }\n        x\n    }\n    let a64 = a as i64;\n    let b64 = b as i64;\n    let l = a64 / gcd(a64, b64) * b64;\n    let mut lo: i64 = 1;\n    let mut hi: i64 = a64.min(b64) * n as i64;\n    while lo < hi {\n        let mid = (lo + hi) / 2;\n        let count = mid / a64 + mid / b64 - mid / l;\n        if count >= n as i64 { hi = mid; } else { lo = mid + 1; }\n    }\n    (lo % md) as i32\n}`,
        php: `function nthMagicalNumber($n, $a, $b) {\n    $mod = 1000000007;\n    $gcd = function($x, $y) {\n        while ($y != 0) { $t = $x % $y; $x = $y; $y = $t; }\n        return $x;\n    };\n    $l = intdiv($a, $gcd($a, $b)) * $b;\n    $lo = 1;\n    $hi = min($a, $b) * $n;\n    while ($lo < $hi) {\n        $mid = intdiv($lo + $hi, 2);\n        $count = intdiv($mid, $a) + intdiv($mid, $b) - intdiv($mid, $l);\n        if ($count >= $n) $hi = $mid;\n        else $lo = $mid + 1;\n    }\n    return $lo % $mod;\n}`,
        ruby: `def nthMagicalNumber(n, a, b)\n  mod = 1000000007\n  l = a / a.gcd(b) * b\n  lo = 1\n  hi = [a, b].min * n\n  while lo < hi\n    mid = (lo + hi) / 2\n    count = mid / a + mid / b - mid / l\n    if count >= n\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo % mod\nend`,
      },
    };
  })(),

  // ── Preimage Size of Factorial Zeroes Function (LC 793) ─────────
  (() => {
    const zeros = (x: number) => {
      let total = 0, p = 5;
      while (p <= x) { total += Math.floor(x / p); p *= 5; }
      return total;
    };
    const ref = (k: number) => {
      let lo = 0, hi = 5 * (k + 1);
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (zeros(mid) >= k) hi = mid; else lo = mid + 1;
      }
      return zeros(lo) === k ? 5 : 0;
    };
    return {
      slug: "preimage-size-of-factorial-zeroes-function",
      title: "Preimage Size of Factorial Zeroes Function",
      difficulty: "HARD" as const,
      tags: ["Math", "Binary Search", "Number Theory", "Google", "Amazon", "Meta"],
      signature: { funcName: "preimageSizeFZF", params: [{ name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Let `f(x)` be the number of trailing zeros in `x!`. For instance `f(3) = 0` because `3! = 6`, and `f(11) = 2` because `11! = 39916800`.\n\nGiven `k`, return how many non-negative integers `x` satisfy `f(x) == k`.",
        [
          { in: "k = 0", out: "5", note: "f(x) = 0 for x in {0, 1, 2, 3, 4}." },
          { in: "k = 5", out: "0", note: "f jumps from 4 (at x = 20…24) to 6 (at x = 25), skipping 5 entirely." },
          { in: "k = 3", out: "5", note: "f(x) = 3 for x in {15, …, 19}." },
        ],
        ["0 <= k <= 1000000000"]),
      hints: [
        "`f(x) = x/5 + x/25 + x/125 + …` — count the factors of five, since twos are always plentiful.",
        "`f` is non-decreasing and rises only at multiples of 5, always by at least one and sometimes by more.",
        "So the answer is only ever `5` or `0`: binary search for the smallest `x` with `f(x) >= k` and check whether it lands exactly on `k`.",
      ],
      editorial: explain({
        idea: "`f` is a step function that is constant on each block of five consecutive integers and jumps at every multiple of 5. So each value it attains is attained exactly five times, and values it skips are attained zero times.",
        steps: [
          "Implement `f(x)` as the Legendre sum `x/5 + x/25 + x/125 + …`.",
          "Binary search the smallest `x >= 0` with `f(x) >= k`, using `5(k + 1)` as a safe upper bound.",
          "Return `5` if `f(x) == k`, otherwise `0`.",
        ],
        why: "Between consecutive multiples of 5 no new factor of five appears, so `f` is constant across each block of five. At a multiple of 5 it jumps by at least 1 — by more at multiples of 25 — which is exactly why some values of `k` are skipped. The upper bound works because `f(5(k+1)) >= k + 1 > k`.",
        time: "O(log k · log k)",
        space: "O(1)",
        pitfalls: [
          "The search space reaches about `5 × 10^9`, which overflows a 32-bit integer — use 64-bit bounds.",
          "`p *= 5` also overflows if the loop is not stopped once `p > x`.",
          "Answering `1` for a value that is attained ignores the five-wide plateau.",
        ],
      }),
      examples: [
        { input: "0", expectedOutput: "5" },
        { input: "5", expectedOutput: "0" },
        { input: "3", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const k = rng() < 0.5 ? ri(rng, 0, 60) : ri(rng, 0, 1000000000);
        return { input: String(k), expectedOutput: String(ref(k)) };
      },
      solutions: {
        python: `def preimageSizeFZF(k: int) -> int:\n    def zeros(x: int) -> int:\n        total = 0\n        p = 5\n        while p <= x:\n            total += x // p\n            p *= 5\n        return total\n\n    lo, hi = 0, 5 * (k + 1)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if zeros(mid) >= k:\n            hi = mid\n        else:\n            lo = mid + 1\n    return 5 if zeros(lo) == k else 0`,
        javascript: `var preimageSizeFZF = function(k) {\n    var zeros = function(x) {\n        var total = 0, p = 5;\n        while (p <= x) {\n            total += Math.floor(x / p);\n            p *= 5;\n        }\n        return total;\n    };\n    var lo = 0, hi = 5 * (k + 1);\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (zeros(mid) >= k) hi = mid;\n        else lo = mid + 1;\n    }\n    return zeros(lo) === k ? 5 : 0;\n};`,
        typescript: `function preimageSizeFZF(k: number): number {\n    var zeros = function(x: number): number {\n        var total = 0, p = 5;\n        while (p <= x) {\n            total += Math.floor(x / p);\n            p *= 5;\n        }\n        return total;\n    };\n    var lo = 0, hi = 5 * (k + 1);\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (zeros(mid) >= k) hi = mid;\n        else lo = mid + 1;\n    }\n    return zeros(lo) === k ? 5 : 0;\n}`,
        java: `public static int preimageSizeFZF(int k) {\n    long lo = 0, hi = 5L * (k + 1);\n    while (lo < hi) {\n        long mid = (lo + hi) / 2;\n        if (trailingZeros(mid) >= k) hi = mid;\n        else lo = mid + 1;\n    }\n    return trailingZeros(lo) == k ? 5 : 0;\n}\n\nstatic long trailingZeros(long x) {\n    long total = 0, p = 5;\n    while (p <= x) {\n        total += x / p;\n        p *= 5;\n    }\n    return total;\n}`,
        cpp: `static long long trailingZerosFZF(long long x) {\n    long long total = 0, p = 5;\n    while (p <= x) {\n        total += x / p;\n        p *= 5;\n    }\n    return total;\n}\n\nint preimageSizeFZF(int k) {\n    long long lo = 0, hi = 5LL * (k + 1);\n    while (lo < hi) {\n        long long mid = (lo + hi) / 2;\n        if (trailingZerosFZF(mid) >= k) hi = mid;\n        else lo = mid + 1;\n    }\n    return trailingZerosFZF(lo) == k ? 5 : 0;\n}`,
        c: `static long long trailingZerosFZFC(long long x) {\n    long long total = 0, p = 5;\n    while (p <= x) {\n        total += x / p;\n        p *= 5;\n    }\n    return total;\n}\n\nint preimageSizeFZF(int k) {\n    long long lo = 0, hi = 5LL * ((long long) k + 1);\n    while (lo < hi) {\n        long long mid = (lo + hi) / 2;\n        if (trailingZerosFZFC(mid) >= k) hi = mid;\n        else lo = mid + 1;\n    }\n    return trailingZerosFZFC(lo) == k ? 5 : 0;\n}`,
        csharp: `public static int PreimageSizeFZF(int k)\n{\n    long lo = 0, hi = 5L * (k + 1);\n    while (lo < hi)\n    {\n        long mid = (lo + hi) / 2;\n        if (TrailingZerosFZF(mid) >= k) hi = mid;\n        else lo = mid + 1;\n    }\n    return TrailingZerosFZF(lo) == k ? 5 : 0;\n}\n\nstatic long TrailingZerosFZF(long x)\n{\n    long total = 0, p = 5;\n    while (p <= x)\n    {\n        total += x / p;\n        p *= 5;\n    }\n    return total;\n}`,
        go: `func preimageSizeFZF(k int) int {\n\tzeros := func(x int) int {\n\t\ttotal, p := 0, 5\n\t\tfor p <= x {\n\t\t\ttotal += x / p\n\t\t\tp *= 5\n\t\t}\n\t\treturn total\n\t}\n\tlo, hi := 0, 5*(k+1)\n\tfor lo < hi {\n\t\tmid := (lo + hi) / 2\n\t\tif zeros(mid) >= k {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\tif zeros(lo) == k {\n\t\treturn 5\n\t}\n\treturn 0\n}`,
        kotlin: `fun preimageSizeFZF(k: Int): Int {\n    fun zeros(x: Long): Long {\n        var total = 0L\n        var p = 5L\n        while (p <= x) {\n            total += x / p\n            p *= 5\n        }\n        return total\n    }\n    var lo = 0L\n    var hi = 5L * (k + 1)\n    while (lo < hi) {\n        val mid = (lo + hi) / 2\n        if (zeros(mid) >= k) hi = mid else lo = mid + 1\n    }\n    return if (zeros(lo) == k.toLong()) 5 else 0\n}`,
        swift: `func preimageSizeFZF(_ k: Int) -> Int {\n    func zeros(_ x: Int) -> Int {\n        var total = 0\n        var p = 5\n        while p <= x {\n            total += x / p\n            p *= 5\n        }\n        return total\n    }\n    var lo = 0\n    var hi = 5 * (k + 1)\n    while lo < hi {\n        let mid = (lo + hi) / 2\n        if zeros(mid) >= k { hi = mid } else { lo = mid + 1 }\n    }\n    return zeros(lo) == k ? 5 : 0\n}`,
        rust: `fn preimageSizeFZF(k: i32) -> i32 {\n    fn zeros(x: i64) -> i64 {\n        let mut total = 0i64;\n        let mut p = 5i64;\n        while p <= x {\n            total += x / p;\n            p *= 5;\n        }\n        total\n    }\n    let k64 = k as i64;\n    let mut lo: i64 = 0;\n    let mut hi: i64 = 5 * (k64 + 1);\n    while lo < hi {\n        let mid = (lo + hi) / 2;\n        if zeros(mid) >= k64 { hi = mid; } else { lo = mid + 1; }\n    }\n    if zeros(lo) == k64 { 5 } else { 0 }\n}`,
        php: `function preimageSizeFZF($k) {\n    $zeros = function($x) {\n        $total = 0;\n        $p = 5;\n        while ($p <= $x) {\n            $total += intdiv($x, $p);\n            $p *= 5;\n        }\n        return $total;\n    };\n    $lo = 0;\n    $hi = 5 * ($k + 1);\n    while ($lo < $hi) {\n        $mid = intdiv($lo + $hi, 2);\n        if ($zeros($mid) >= $k) $hi = $mid;\n        else $lo = $mid + 1;\n    }\n    return $zeros($lo) === $k ? 5 : 0;\n}`,
        ruby: `def preimageSizeFZF(k)\n  zeros = lambda do |x|\n    total = 0\n    p = 5\n    while p <= x\n      total += x / p\n      p *= 5\n    end\n    total\n  end\n  lo = 0\n  hi = 5 * (k + 1)\n  while lo < hi\n    mid = (lo + hi) / 2\n    if zeros.call(mid) >= k\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  zeros.call(lo) == k ? 5 : 0\nend`,
      },
    };
  })(),

  // ── Number of Digit One (LC 233) ────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let total = 0;
      for (let p = 1; p <= n; p *= 10) {
        const higher = Math.floor(n / (p * 10));
        const rest = n % (p * 10);
        total += higher * p + Math.min(Math.max(rest - p + 1, 0), p);
      }
      return total;
    };
    return {
      slug: "number-of-digit-one",
      title: "Number of Digit One",
      difficulty: "HARD" as const,
      tags: ["Math", "Digit DP", "Recursion", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "countDigitOne", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Count the total number of digit `1` characters that appear across all the integers from `1` to `n` inclusive.",
        [
          { in: "n = 13", out: "6", note: "The ones appear in 1, 10, 11 (twice), 12 and 13." },
          { in: "n = 0", out: "0" },
          { in: "n = 100", out: "21" },
        ],
        ["0 <= n <= 1000000000"]),
      hints: [
        "Count the ones position by position: how many numbers in `[1, n]` have a `1` in the units place, the tens place, and so on.",
        "Split `n` at the position `p` into `higher = n / (10p)`, the digit at `p`, and `rest = n mod 10p`.",
        "The full higher blocks contribute `higher * p`, and the partial block contributes `min(max(rest - p + 1, 0), p)`.",
      ],
      editorial: explain({
        idea: "Fix a digit position `p` (1, 10, 100, …) and count how many integers in `[1, n]` carry a `1` there. Summing over positions gives the total, with no enumeration at all.",
        steps: [
          "For each power of ten `p` up to `n`, let `higher = n / (10p)` and `rest = n % (10p)`.",
          "Every complete higher block contributes exactly `p` numbers with a `1` at position `p` — that is `higher * p`.",
          "The partial block contributes `rest - p + 1`, clamped to the range `[0, p]`.",
          "Add both parts and move to the next position.",
        ],
        why: "Within each span of `10p` consecutive integers, exactly `p` of them have a `1` at position `p` — the ones whose value at that position equals 1. The clamp handles the final, possibly incomplete span: `rest` below `p` contributes nothing, `rest` at or above `2p - 1` contributes a full `p`, and in between it contributes the partial count.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "`p * 10` overflows 32 bits once `p` reaches `10^9`; carry the powers in 64 bits or stop the loop at `p > n / 10`.",
          "Enumerating `1..n` and counting characters is `O(n log n)` and far too slow at the stated limit.",
          "Forgetting the clamp double counts the partial block on inputs like `n = 12`.",
        ],
      }),
      examples: [
        { input: "13", expectedOutput: "6" },
        { input: "0", expectedOutput: "0" },
        { input: "100", expectedOutput: "21" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.5 ? ri(rng, 0, 500) : ri(rng, 0, 1000000000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def countDigitOne(n: int) -> int:\n    total = 0\n    p = 1\n    while p <= n:\n        higher = n // (p * 10)\n        rest = n % (p * 10)\n        total += higher * p + min(max(rest - p + 1, 0), p)\n        p *= 10\n    return total`,
        javascript: `var countDigitOne = function(n) {\n    var total = 0;\n    for (var p = 1; p <= n; p *= 10) {\n        var higher = Math.floor(n / (p * 10));\n        var rest = n % (p * 10);\n        total += higher * p + Math.min(Math.max(rest - p + 1, 0), p);\n    }\n    return total;\n};`,
        typescript: `function countDigitOne(n: number): number {\n    var total = 0;\n    for (var p = 1; p <= n; p *= 10) {\n        var higher = Math.floor(n / (p * 10));\n        var rest = n % (p * 10);\n        total += higher * p + Math.min(Math.max(rest - p + 1, 0), p);\n    }\n    return total;\n}`,
        java: `public static int countDigitOne(int n) {\n    long total = 0;\n    for (long p = 1; p <= n; p *= 10) {\n        long higher = n / (p * 10);\n        long rest = n % (p * 10);\n        total += higher * p + Math.min(Math.max(rest - p + 1, 0), p);\n    }\n    return (int) total;\n}`,
        cpp: `int countDigitOne(int n) {\n    long long total = 0;\n    for (long long p = 1; p <= n; p *= 10) {\n        long long higher = n / (p * 10);\n        long long rest = n % (p * 10);\n        long long partial = rest - p + 1;\n        if (partial < 0) partial = 0;\n        if (partial > p) partial = p;\n        total += higher * p + partial;\n    }\n    return (int) total;\n}`,
        c: `int countDigitOne(int n) {\n    long long total = 0;\n    for (long long p = 1; p <= n; p *= 10) {\n        long long higher = n / (p * 10);\n        long long rest = n % (p * 10);\n        long long partial = rest - p + 1;\n        if (partial < 0) partial = 0;\n        if (partial > p) partial = p;\n        total += higher * p + partial;\n    }\n    return (int) total;\n}`,
        csharp: `public static int CountDigitOne(int n)\n{\n    long total = 0;\n    for (long p = 1; p <= n; p *= 10)\n    {\n        long higher = n / (p * 10);\n        long rest = n % (p * 10);\n        long partial = rest - p + 1;\n        if (partial < 0) partial = 0;\n        if (partial > p) partial = p;\n        total += higher * p + partial;\n    }\n    return (int) total;\n}`,
        go: `func countDigitOne(n int) int {\n\ttotal := 0\n\tfor p := 1; p <= n; p *= 10 {\n\t\thigher := n / (p * 10)\n\t\trest := n % (p * 10)\n\t\tpartial := rest - p + 1\n\t\tif partial < 0 {\n\t\t\tpartial = 0\n\t\t}\n\t\tif partial > p {\n\t\t\tpartial = p\n\t\t}\n\t\ttotal += higher*p + partial\n\t}\n\treturn total\n}`,
        kotlin: `fun countDigitOne(n: Int): Int {\n    var total = 0L\n    var p = 1L\n    while (p <= n) {\n        val higher = n / (p * 10)\n        val rest = n % (p * 10)\n        var partial = rest - p + 1\n        if (partial < 0) partial = 0\n        if (partial > p) partial = p\n        total += higher * p + partial\n        p *= 10\n    }\n    return total.toInt()\n}`,
        swift: `func countDigitOne(_ n: Int) -> Int {\n    var total = 0\n    var p = 1\n    while p <= n {\n        let higher = n / (p * 10)\n        let rest = n % (p * 10)\n        var partial = rest - p + 1\n        if partial < 0 { partial = 0 }\n        if partial > p { partial = p }\n        total += higher * p + partial\n        p *= 10\n    }\n    return total\n}`,
        rust: `fn countDigitOne(n: i32) -> i32 {\n    let n64 = n as i64;\n    let mut total: i64 = 0;\n    let mut p: i64 = 1;\n    while p <= n64 {\n        let higher = n64 / (p * 10);\n        let rest = n64 % (p * 10);\n        let mut partial = rest - p + 1;\n        if partial < 0 {\n            partial = 0;\n        }\n        if partial > p {\n            partial = p;\n        }\n        total += higher * p + partial;\n        p *= 10;\n    }\n    total as i32\n}`,
        php: `function countDigitOne($n) {\n    $total = 0;\n    for ($p = 1; $p <= $n; $p *= 10) {\n        $higher = intdiv($n, $p * 10);\n        $rest = $n % ($p * 10);\n        $partial = $rest - $p + 1;\n        if ($partial < 0) $partial = 0;\n        if ($partial > $p) $partial = $p;\n        $total += $higher * $p + $partial;\n    }\n    return $total;\n}`,
        ruby: `def countDigitOne(n)\n  total = 0\n  p = 1\n  while p <= n\n    higher = n / (p * 10)\n    rest = n % (p * 10)\n    partial = [[rest - p + 1, 0].max, p].min\n    total += higher * p + partial\n    p *= 10\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Smallest Good Base (LC 483) ─────────────────────────────────
  (() => {
    const sumPow = (k: number, m: number, limit: number) => {
      let sum = 1, term = 1;
      for (let i = 1; i <= m; i++) {
        if (term > Math.floor(limit / k)) return limit + 1;
        term *= k;
        if (sum > limit - term) return limit + 1;
        sum += term;
      }
      return sum;
    };
    const ref = (n: string) => {
      const v = Number(n);
      for (let m = 30; m >= 1; m--) {
        let hi = 2;
        while (sumPow(hi, m, v) < v) hi *= 2;
        let lo = 2;
        while (lo <= hi) {
          const mid = Math.floor((lo + hi) / 2);
          const s = sumPow(mid, m, v);
          if (s === v) return String(mid);
          if (s < v) lo = mid + 1; else hi = mid - 1;
        }
      }
      return String(v - 1);
    };
    return {
      slug: "smallest-good-base",
      title: "Smallest Good Base",
      difficulty: "HARD" as const,
      tags: ["Math", "Binary Search", "Number Theory", "Google", "Amazon", "Apple"],
      signature: { funcName: "smallestGoodBase", params: [{ name: "n", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A base `k >= 2` is **good** for `n` if every digit of `n` written in base `k` is `1`.\n\nGiven `n` as a decimal string, return the smallest good base, also as a string.",
        [
          { in: 'n = "13"', out: "3", note: "13 in base 3 is 111." },
          { in: 'n = "4681"', out: "8", note: "4681 in base 8 is 11111." },
          { in: 'n = "3"', out: "2", note: "3 in base 2 is 11 — every n has base n - 1 as a fallback." },
        ],
        ["3 <= n <= 1000000000", "n is given without leading zeros."]),
      hints: [
        "If `n` is all ones in base `k` with `m + 1` digits, then `n = 1 + k + k² + … + k^m`.",
        "More digits means a smaller base, so search `m` from large to small and take the first base that works.",
        "For a fixed `m` the sum is increasing in `k`, so binary search `k` — and cap the range by doubling rather than taking a real-valued root.",
      ],
      editorial: explain({
        idea: "An all-ones representation with `m + 1` digits means `n` is the geometric sum `1 + k + … + k^m`. That sum grows with `k` for fixed `m`, so each `m` admits at most one base, findable by binary search. Larger `m` forces smaller `k`, so scanning `m` downward returns the smallest base first.",
        steps: [
          "For `m` from `30` down to `1` (since `2^31` already exceeds the input bound):",
          "Find an upper bound for `k` by starting at 2 and doubling until the geometric sum reaches `n`.",
          "Binary search `k` in that range, comparing the sum against `n`; return `k` on an exact hit.",
          "If no `m` works, the answer is `n - 1`, which always represents `n` as `11`.",
        ],
        why: "Every `n >= 3` is `11` in base `n - 1`, so a good base always exists. For a fixed digit count the sum is strictly increasing in `k`, which makes the binary search valid; and the sum is strictly increasing in `m` for fixed `k`, so more digits force a smaller base — hence the downward scan finds the minimum first.",
        time: "O(log²n)",
        space: "O(1)",
        pitfalls: [
          "Computing `k^m` directly overflows long before the sum reaches `n` — cap the running total against `n` at every step.",
          "Using a floating-point `m`-th root to bound `k` can land one off, and the judge's C harness has no `math.h`; doubling avoids both problems.",
          "`m = 1` yields `n - 1`, which is why the search always terminates with an answer.",
        ],
      }),
      examples: [
        { input: '"13"', expectedOutput: "3" },
        { input: '"4681"', expectedOutput: "8" },
        { input: '"3"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        if (rng() < 0.4) {
          // Build an all-ones number in some base so the interesting branch fires.
          const k = ri(rng, 2, 40);
          const m = ri(rng, 2, 8);
          let v = 1, term = 1, ok = true;
          for (let i = 1; i <= m; i++) {
            term *= k;
            v += term;
            if (v > 1000000000) { ok = false; break; }
          }
          if (ok && v >= 3) return { input: `"${v}"`, expectedOutput: ref(String(v)) };
        }
        const v = ri(rng, 3, 1000000000);
        return { input: `"${v}"`, expectedOutput: ref(String(v)) };
      },
      solutions: {
        python: `def smallestGoodBase(n: str) -> str:\n    v = int(n)\n\n    def sum_pow(k: int, m: int, limit: int) -> int:\n        total = 1\n        term = 1\n        for _ in range(m):\n            if term > limit // k:\n                return limit + 1\n            term *= k\n            if total > limit - term:\n                return limit + 1\n            total += term\n        return total\n\n    for m in range(30, 0, -1):\n        hi = 2\n        while sum_pow(hi, m, v) < v:\n            hi *= 2\n        lo = 2\n        while lo <= hi:\n            mid = (lo + hi) // 2\n            s = sum_pow(mid, m, v)\n            if s == v:\n                return str(mid)\n            if s < v:\n                lo = mid + 1\n            else:\n                hi = mid - 1\n    return str(v - 1)`,
        javascript: `var smallestGoodBase = function(n) {\n    var v = Number(n);\n    var sumPow = function(k, m, limit) {\n        var sum = 1, term = 1;\n        for (var i = 1; i <= m; i++) {\n            if (term > Math.floor(limit / k)) return limit + 1;\n            term *= k;\n            if (sum > limit - term) return limit + 1;\n            sum += term;\n        }\n        return sum;\n    };\n    for (var m = 30; m >= 1; m--) {\n        var hi = 2;\n        while (sumPow(hi, m, v) < v) hi *= 2;\n        var lo = 2;\n        while (lo <= hi) {\n            var mid = Math.floor((lo + hi) / 2);\n            var s = sumPow(mid, m, v);\n            if (s === v) return String(mid);\n            if (s < v) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    return String(v - 1);\n};`,
        typescript: `function smallestGoodBase(n: string): string {\n    var v = Number(n);\n    var sumPow = function(k: number, m: number, limit: number): number {\n        var sum = 1, term = 1;\n        for (var i = 1; i <= m; i++) {\n            if (term > Math.floor(limit / k)) return limit + 1;\n            term *= k;\n            if (sum > limit - term) return limit + 1;\n            sum += term;\n        }\n        return sum;\n    };\n    for (var m = 30; m >= 1; m--) {\n        var hi = 2;\n        while (sumPow(hi, m, v) < v) hi *= 2;\n        var lo = 2;\n        while (lo <= hi) {\n            var mid = Math.floor((lo + hi) / 2);\n            var s = sumPow(mid, m, v);\n            if (s === v) return String(mid);\n            if (s < v) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    return String(v - 1);\n}`,
        java: `public static String smallestGoodBase(String n) {\n    long v = Long.parseLong(n);\n    for (int m = 30; m >= 1; m--) {\n        long hi = 2;\n        while (geoSum(hi, m, v) < v) hi *= 2;\n        long lo = 2;\n        while (lo <= hi) {\n            long mid = (lo + hi) / 2;\n            long s = geoSum(mid, m, v);\n            if (s == v) return Long.toString(mid);\n            if (s < v) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    return Long.toString(v - 1);\n}\n\nstatic long geoSum(long k, int m, long limit) {\n    long sum = 1, term = 1;\n    for (int i = 1; i <= m; i++) {\n        if (term > limit / k) return limit + 1;\n        term *= k;\n        if (sum > limit - term) return limit + 1;\n        sum += term;\n    }\n    return sum;\n}`,
        cpp: `static long long geoSum(long long k, int m, long long limit) {\n    long long sum = 1, term = 1;\n    for (int i = 1; i <= m; i++) {\n        if (term > limit / k) return limit + 1;\n        term *= k;\n        if (sum > limit - term) return limit + 1;\n        sum += term;\n    }\n    return sum;\n}\n\nstring smallestGoodBase(string n) {\n    long long v = stoll(n);\n    for (int m = 30; m >= 1; m--) {\n        long long hi = 2;\n        while (geoSum(hi, m, v) < v) hi *= 2;\n        long long lo = 2;\n        while (lo <= hi) {\n            long long mid = (lo + hi) / 2;\n            long long s = geoSum(mid, m, v);\n            if (s == v) return to_string(mid);\n            if (s < v) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    return to_string(v - 1);\n}`,
        c: `static long long geoSumC(long long k, int m, long long limit) {\n    long long sum = 1, term = 1;\n    for (int i = 1; i <= m; i++) {\n        if (term > limit / k) return limit + 1;\n        term *= k;\n        if (sum > limit - term) return limit + 1;\n        sum += term;\n    }\n    return sum;\n}\n\nchar* smallestGoodBase(char* n) {\n    long long v = strtoll(n, NULL, 10);\n    char* out = (char*) malloc(32);\n    for (int m = 30; m >= 1; m--) {\n        long long hi = 2;\n        while (geoSumC(hi, m, v) < v) hi *= 2;\n        long long lo = 2;\n        while (lo <= hi) {\n            long long mid = (lo + hi) / 2;\n            long long s = geoSumC(mid, m, v);\n            if (s == v) {\n                sprintf(out, "%lld", mid);\n                return out;\n            }\n            if (s < v) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    sprintf(out, "%lld", v - 1);\n    return out;\n}`,
        csharp: `public static string SmallestGoodBase(string n)\n{\n    long v = long.Parse(n);\n    for (int m = 30; m >= 1; m--)\n    {\n        long hi = 2;\n        while (GeoSum(hi, m, v) < v) hi *= 2;\n        long lo = 2;\n        while (lo <= hi)\n        {\n            long mid = (lo + hi) / 2;\n            long s = GeoSum(mid, m, v);\n            if (s == v) return mid.ToString();\n            if (s < v) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    return (v - 1).ToString();\n}\n\nstatic long GeoSum(long k, int m, long limit)\n{\n    long sum = 1, term = 1;\n    for (int i = 1; i <= m; i++)\n    {\n        if (term > limit / k) return limit + 1;\n        term *= k;\n        if (sum > limit - term) return limit + 1;\n        sum += term;\n    }\n    return sum;\n}`,
        go: `func smallestGoodBase(n string) string {\n\tv, _ := strconv.ParseInt(n, 10, 64)\n\tgeoSum := func(k int64, m int, limit int64) int64 {\n\t\tsum, term := int64(1), int64(1)\n\t\tfor i := 1; i <= m; i++ {\n\t\t\tif term > limit/k {\n\t\t\t\treturn limit + 1\n\t\t\t}\n\t\t\tterm *= k\n\t\t\tif sum > limit-term {\n\t\t\t\treturn limit + 1\n\t\t\t}\n\t\t\tsum += term\n\t\t}\n\t\treturn sum\n\t}\n\tfor m := 30; m >= 1; m-- {\n\t\thi := int64(2)\n\t\tfor geoSum(hi, m, v) < v {\n\t\t\thi *= 2\n\t\t}\n\t\tlo := int64(2)\n\t\tfor lo <= hi {\n\t\t\tmid := (lo + hi) / 2\n\t\t\ts := geoSum(mid, m, v)\n\t\t\tif s == v {\n\t\t\t\treturn strconv.FormatInt(mid, 10)\n\t\t\t}\n\t\t\tif s < v {\n\t\t\t\tlo = mid + 1\n\t\t\t} else {\n\t\t\t\thi = mid - 1\n\t\t\t}\n\t\t}\n\t}\n\treturn strconv.FormatInt(v-1, 10)\n}`,
        kotlin: `fun smallestGoodBase(n: String): String {\n    val v = n.toLong()\n    fun geoSum(k: Long, m: Int, limit: Long): Long {\n        var sum = 1L\n        var term = 1L\n        for (i in 1..m) {\n            if (term > limit / k) return limit + 1\n            term *= k\n            if (sum > limit - term) return limit + 1\n            sum += term\n        }\n        return sum\n    }\n    for (m in 30 downTo 1) {\n        var hi = 2L\n        while (geoSum(hi, m, v) < v) hi *= 2\n        var lo = 2L\n        while (lo <= hi) {\n            val mid = (lo + hi) / 2\n            val s = geoSum(mid, m, v)\n            if (s == v) return mid.toString()\n            if (s < v) lo = mid + 1 else hi = mid - 1\n        }\n    }\n    return (v - 1).toString()\n}`,
        swift: `func smallestGoodBase(_ n: String) -> String {\n    let v = Int(n)!\n    func geoSum(_ k: Int, _ m: Int, _ limit: Int) -> Int {\n        var sum = 1\n        var term = 1\n        for _ in 1...max(m, 1) where m >= 1 {\n            if term > limit / k { return limit + 1 }\n            term *= k\n            if sum > limit - term { return limit + 1 }\n            sum += term\n        }\n        return sum\n    }\n    var m = 30\n    while m >= 1 {\n        var hi = 2\n        while geoSum(hi, m, v) < v { hi *= 2 }\n        var lo = 2\n        while lo <= hi {\n            let mid = (lo + hi) / 2\n            let s = geoSum(mid, m, v)\n            if s == v { return String(mid) }\n            if s < v { lo = mid + 1 } else { hi = mid - 1 }\n        }\n        m -= 1\n    }\n    return String(v - 1)\n}`,
        rust: `fn smallestGoodBase(n: String) -> String {\n    let v: i64 = n.parse().unwrap();\n    fn geo_sum(k: i64, m: i32, limit: i64) -> i64 {\n        let mut sum: i64 = 1;\n        let mut term: i64 = 1;\n        for _ in 0..m {\n            if term > limit / k {\n                return limit + 1;\n            }\n            term *= k;\n            if sum > limit - term {\n                return limit + 1;\n            }\n            sum += term;\n        }\n        sum\n    }\n    for m in (1..=30).rev() {\n        let mut hi: i64 = 2;\n        while geo_sum(hi, m, v) < v {\n            hi *= 2;\n        }\n        let mut lo: i64 = 2;\n        while lo <= hi {\n            let mid = (lo + hi) / 2;\n            let s = geo_sum(mid, m, v);\n            if s == v {\n                return mid.to_string();\n            }\n            if s < v { lo = mid + 1; } else { hi = mid - 1; }\n        }\n    }\n    (v - 1).to_string()\n}`,
        php: `function smallestGoodBase($n) {\n    $v = intval($n);\n    $geoSum = function($k, $m, $limit) {\n        $sum = 1;\n        $term = 1;\n        for ($i = 1; $i <= $m; $i++) {\n            if ($term > intdiv($limit, $k)) return $limit + 1;\n            $term *= $k;\n            if ($sum > $limit - $term) return $limit + 1;\n            $sum += $term;\n        }\n        return $sum;\n    };\n    for ($m = 30; $m >= 1; $m--) {\n        $hi = 2;\n        while ($geoSum($hi, $m, $v) < $v) $hi *= 2;\n        $lo = 2;\n        while ($lo <= $hi) {\n            $mid = intdiv($lo + $hi, 2);\n            $s = $geoSum($mid, $m, $v);\n            if ($s === $v) return strval($mid);\n            if ($s < $v) $lo = $mid + 1;\n            else $hi = $mid - 1;\n        }\n    }\n    return strval($v - 1);\n}`,
        ruby: `def smallestGoodBase(n)\n  v = n.to_i\n  geo_sum = lambda do |k, m, limit|\n    sum = 1\n    term = 1\n    m.times do\n      return limit + 1 if term > limit / k\n      term *= k\n      return limit + 1 if sum > limit - term\n      sum += term\n    end\n    sum\n  end\n  30.downto(1) do |m|\n    hi = 2\n    hi *= 2 while geo_sum.call(hi, m, v) < v\n    lo = 2\n    while lo <= hi\n      mid = (lo + hi) / 2\n      s = geo_sum.call(mid, m, v)\n      return mid.to_s if s == v\n      if s < v\n        lo = mid + 1\n      else\n        hi = mid - 1\n      end\n    end\n  end\n  (v - 1).to_s\nend`,
      },
    };
  })(),
];
