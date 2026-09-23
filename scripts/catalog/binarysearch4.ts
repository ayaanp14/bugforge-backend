/**
 * Binary-search problems — wave 4.
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks
 * "must-do" search set. Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h, so integer
 * square roots and powers are walked or binary-searched, never sqrt/pow.
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

export const BINARYSEARCH4_PROBLEMS: CatalogProblem[] = [

  // ── Find Smallest Letter Greater Than Target (LC 744) ───────────
  (() => {
    const ref = (letters: string[], target: string) => {
      let lo = 0, hi = letters.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (letters[mid] > target) hi = mid; else lo = mid + 1;
      }
      return lo === letters.length ? letters[0] : letters[lo];
    };
    return {
      slug: "find-smallest-letter-greater-than-target",
      title: "Find Smallest Letter Greater Than Target",
      difficulty: "EASY" as const,
      tags: ["Array", "Binary Search", "Amazon", "Microsoft", "TCS"],
      signature: { funcName: "nextGreatestLetter", params: [{ name: "letters", type: "string[]" as const }, { name: "target", type: "string" as const }], returns: "string" as const },
      description: describe(
        "`letters` is sorted in non-decreasing order and contains at least two **different** characters.\n\nReturn the smallest character in `letters` that is strictly greater than `target`. If no such character exists, wrap around and return the first character of `letters`.",
        [
          { in: 'letters = ["c","d","e","k"], target = "e"', out: "k", note: "The next letter after e in the list is k." },
          { in: 'letters = ["c","f","j"], target = "j"', out: "c", note: "Nothing is greater than j, so it wraps to the front." },
          { in: 'letters = ["x","x","y","y"], target = "z"', out: "x" },
        ],
        ["2 <= letters.length <= 10000", "letters[i] is a lowercase English letter.", "letters is sorted in non-decreasing order.", "letters contains at least two different characters.", "target is a lowercase English letter."]),
      hints: [
        "The array is sorted, so the answer is the first position whose letter exceeds `target`.",
        "That is an upper-bound binary search.",
        "If the search falls off the end, the answer wraps to index 0.",
      ],
      editorial: explain({
        idea: "This is an upper bound: find the leftmost index whose letter is strictly greater than `target`. Binary search locates it, and running past the end means every letter is at most `target`, so the wrap takes over.",
        steps: [
          "Search over `[0, n]` for the first index with `letters[mid] > target`.",
          "Move `hi` to `mid` when the letter is greater, otherwise `lo` past `mid`.",
          "Return `letters[lo]`, or `letters[0]` when `lo == n`.",
        ],
        why: "Because the array is sorted, the predicate `letters[i] > target` is false for a prefix and true for the rest, so the boundary is unique and binary search converges on it. The guarantee that two different characters exist means the wrap never returns something equal to `target` in a way that breaks the 'strictly greater' promise — the wrapped answer is deliberately smaller.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Using `>=` finds an equal letter, which the problem excludes.",
          "Forgetting the wrap-around returns out of bounds for a `target` at or above every letter.",
          "A linear scan works at this size but misses the point of the exercise.",
        ],
      }),
      examples: [
        { input: '["c","d","e","k"]\n"e"', expectedOutput: "k" },
        { input: '["c","f","j"]\n"j"', expectedOutput: "c" },
        { input: '["x","x","y","y"]\n"z"', expectedOutput: "x" },
      ],
      gen: (rng: Rng) => {
        const pool = ["a", "b", "c", "d", "e", "f", "g", "h"];
        let letters: string[] = [];
        // The statement promises at least two distinct characters.
        while (new Set(letters).size < 2) {
          letters = Array.from({ length: ri(rng, 2, 20) }, () => pick(rng, pool)).sort();
        }
        const target = pick(rng, pool);
        return { input: `${fmtStrArr(letters)}\n"${target}"`, expectedOutput: ref(letters, target) };
      },
      solutions: {
        python: `from typing import List\n\ndef nextGreatestLetter(letters: List[str], target: str) -> str:\n    lo, hi = 0, len(letters)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if letters[mid] > target:\n            hi = mid\n        else:\n            lo = mid + 1\n    return letters[0] if lo == len(letters) else letters[lo]`,
        javascript: `var nextGreatestLetter = function(letters, target) {\n    var lo = 0, hi = letters.length;\n    while (lo < hi) {\n        var mid = (lo + hi) >> 1;\n        if (letters[mid] > target) hi = mid; else lo = mid + 1;\n    }\n    return lo === letters.length ? letters[0] : letters[lo];\n};`,
        typescript: `function nextGreatestLetter(letters: string[], target: string): string {\n    var lo = 0, hi = letters.length;\n    while (lo < hi) {\n        var mid = (lo + hi) >> 1;\n        if (letters[mid] > target) hi = mid; else lo = mid + 1;\n    }\n    return lo === letters.length ? letters[0] : letters[lo];\n}`,
        java: `public static String nextGreatestLetter(String[] letters, String target) {\n    int lo = 0, hi = letters.length;\n    while (lo < hi) {\n        int mid = (lo + hi) >>> 1;\n        if (letters[mid].compareTo(target) > 0) hi = mid; else lo = mid + 1;\n    }\n    return lo == letters.length ? letters[0] : letters[lo];\n}`,
        cpp: `string nextGreatestLetter(vector<string>& letters, string target) {\n    int lo = 0, hi = (int) letters.size();\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (letters[mid] > target) hi = mid; else lo = mid + 1;\n    }\n    return lo == (int) letters.size() ? letters[0] : letters[lo];\n}`,
        c: `char* nextGreatestLetter(char** letters, int lettersSize, char* target) {\n    int lo = 0, hi = lettersSize;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (strcmp(letters[mid], target) > 0) hi = mid; else lo = mid + 1;\n    }\n    return lo == lettersSize ? letters[0] : letters[lo];\n}`,
        csharp: `public static string NextGreatestLetter(string[] letters, string target)\n{\n    int lo = 0, hi = letters.Length;\n    while (lo < hi)\n    {\n        int mid = (lo + hi) / 2;\n        if (string.CompareOrdinal(letters[mid], target) > 0) hi = mid; else lo = mid + 1;\n    }\n    return lo == letters.Length ? letters[0] : letters[lo];\n}`,
        go: `func nextGreatestLetter(letters []string, target string) string {\n\tlo, hi := 0, len(letters)\n\tfor lo < hi {\n\t\tmid := (lo + hi) / 2\n\t\tif letters[mid] > target {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\tif lo == len(letters) {\n\t\treturn letters[0]\n\t}\n\treturn letters[lo]\n}`,
        kotlin: `fun nextGreatestLetter(letters: Array<String>, target: String): String {\n    var lo = 0\n    var hi = letters.size\n    while (lo < hi) {\n        val mid = (lo + hi) / 2\n        if (letters[mid] > target) hi = mid else lo = mid + 1\n    }\n    return if (lo == letters.size) letters[0] else letters[lo]\n}`,
        swift: `func nextGreatestLetter(_ letters: [String], _ target: String) -> String {\n    var lo = 0\n    var hi = letters.count\n    while lo < hi {\n        let mid = (lo + hi) / 2\n        if letters[mid] > target { hi = mid } else { lo = mid + 1 }\n    }\n    return lo == letters.count ? letters[0] : letters[lo]\n}`,
        rust: `fn nextGreatestLetter(letters: Vec<String>, target: String) -> String {\n    let mut lo = 0usize;\n    let mut hi = letters.len();\n    while lo < hi {\n        let mid = (lo + hi) / 2;\n        if letters[mid] > target {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    if lo == letters.len() {\n        letters[0].clone()\n    } else {\n        letters[lo].clone()\n    }\n}`,
        php: `function nextGreatestLetter($letters, $target) {\n    $lo = 0;\n    $hi = count($letters);\n    while ($lo < $hi) {\n        $mid = intdiv($lo + $hi, 2);\n        if (strcmp($letters[$mid], $target) > 0) $hi = $mid; else $lo = $mid + 1;\n    }\n    return $lo === count($letters) ? $letters[0] : $letters[$lo];\n}`,
        ruby: `def nextGreatestLetter(letters, target)\n  lo = 0\n  hi = letters.length\n  while lo < hi\n    mid = (lo + hi) / 2\n    if letters[mid] > target\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo == letters.length ? letters[0] : letters[lo]\nend`,
      },
    };
  })(),

  // ── Kth Missing Positive Number (LC 1539) ───────────────────────
  (() => {
    const ref = (arr: number[], k: number) => {
      let lo = 0, hi = arr.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        // arr[mid] - (mid + 1) is how many positives are missing before arr[mid].
        if (arr[mid] - (mid + 1) < k) lo = mid + 1; else hi = mid;
      }
      return lo + k;
    };
    return {
      slug: "kth-missing-positive-number",
      title: "Kth Missing Positive Number",
      difficulty: "EASY" as const,
      tags: ["Array", "Binary Search", "Amazon", "Google", "Accenture"],
      signature: { funcName: "findKthPositive", params: [{ name: "arr", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`arr` is a strictly increasing array of positive integers.\n\nReturn the `k`-th positive integer that is **missing** from `arr`.",
        [
          { in: "arr = [2,3,4,7,11], k = 5", out: "9", note: "The missing numbers are 1, 5, 6, 8, 9, 10, …" },
          { in: "arr = [1,2,3,4], k = 2", out: "6", note: "Nothing is missing below 5, so the missing run starts at 5." },
          { in: "arr = [5], k = 3", out: "3" },
        ],
        ["1 <= arr.length <= 1000", "1 <= arr[i] <= 1000", "1 <= k <= 1000", "arr is strictly increasing."]),
      hints: [
        "At index `i`, exactly `arr[i] - (i + 1)` positive integers are missing before `arr[i]`.",
        "That quantity is non-decreasing in `i`, so binary search applies.",
        "Find the first index where the missing count reaches `k`; the answer is that index plus `k`.",
      ],
      editorial: explain({
        idea: "Define `missing(i) = arr[i] - (i + 1)`, the number of absent positives strictly below `arr[i]`. It is non-decreasing, so binary search finds the boundary where it first reaches `k`, and simple arithmetic recovers the answer.",
        steps: [
          "Binary search over `[0, n]` for the first index with `missing(mid) >= k`.",
          "Let `lo` be that boundary — every index before it has fewer than `k` missing numbers.",
          "Return `lo + k`.",
        ],
        why: "Below index `lo`, the array covers `lo` of the positives and hides `missing(lo-1) < k` of them, so the `k`-th missing number lies in the gap starting at `arr[lo-1] + 1` — equivalently at `lo + k`, since the first `lo` array entries occupy `lo` slots. When the whole array has fewer than `k` missing numbers, `lo = n` and `n + k` is right for the same reason.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "The linear scan is fine at `n = 1000` but the formula is what generalises.",
          "`missing(i)` uses `i + 1`, not `i` — the array is 0-indexed but counts from 1.",
          "The `k`-th missing number can exceed every element of `arr`.",
        ],
      }),
      examples: [
        { input: "[2,3,4,7,11]\n5", expectedOutput: "9" },
        { input: "[1,2,3,4]\n2", expectedOutput: "6" },
        { input: "[5]\n3", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const pool: number[] = [];
        let cur = ri(rng, 1, 5);
        for (let i = 0; i < n; i++) { pool.push(cur); cur += ri(rng, 1, 4); if (cur > 1000) break; }
        const k = ri(rng, 1, 40);
        return { input: `${fmtIntArr(pool)}\n${k}`, expectedOutput: String(ref(pool, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findKthPositive(arr: List[int], k: int) -> int:\n    lo, hi = 0, len(arr)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if arr[mid] - (mid + 1) < k:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo + k`,
        javascript: `var findKthPositive = function(arr, k) {\n    var lo = 0, hi = arr.length;\n    while (lo < hi) {\n        var mid = (lo + hi) >> 1;\n        if (arr[mid] - (mid + 1) < k) lo = mid + 1; else hi = mid;\n    }\n    return lo + k;\n};`,
        typescript: `function findKthPositive(arr: number[], k: number): number {\n    var lo = 0, hi = arr.length;\n    while (lo < hi) {\n        var mid = (lo + hi) >> 1;\n        if (arr[mid] - (mid + 1) < k) lo = mid + 1; else hi = mid;\n    }\n    return lo + k;\n}`,
        java: `public static int findKthPositive(int[] arr, int k) {\n    int lo = 0, hi = arr.length;\n    while (lo < hi) {\n        int mid = (lo + hi) >>> 1;\n        if (arr[mid] - (mid + 1) < k) lo = mid + 1; else hi = mid;\n    }\n    return lo + k;\n}`,
        cpp: `int findKthPositive(vector<int>& arr, int k) {\n    int lo = 0, hi = (int) arr.size();\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (arr[mid] - (mid + 1) < k) lo = mid + 1; else hi = mid;\n    }\n    return lo + k;\n}`,
        c: `int findKthPositive(int* arr, int arrSize, int k) {\n    int lo = 0, hi = arrSize;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (arr[mid] - (mid + 1) < k) lo = mid + 1; else hi = mid;\n    }\n    return lo + k;\n}`,
        csharp: `public static int FindKthPositive(int[] arr, int k)\n{\n    int lo = 0, hi = arr.Length;\n    while (lo < hi)\n    {\n        int mid = (lo + hi) / 2;\n        if (arr[mid] - (mid + 1) < k) lo = mid + 1; else hi = mid;\n    }\n    return lo + k;\n}`,
        go: `func findKthPositive(arr []int, k int) int {\n\tlo, hi := 0, len(arr)\n\tfor lo < hi {\n\t\tmid := (lo + hi) / 2\n\t\tif arr[mid]-(mid+1) < k {\n\t\t\tlo = mid + 1\n\t\t} else {\n\t\t\thi = mid\n\t\t}\n\t}\n\treturn lo + k\n}`,
        kotlin: `fun findKthPositive(arr: IntArray, k: Int): Int {\n    var lo = 0\n    var hi = arr.size\n    while (lo < hi) {\n        val mid = (lo + hi) / 2\n        if (arr[mid] - (mid + 1) < k) lo = mid + 1 else hi = mid\n    }\n    return lo + k\n}`,
        swift: `func findKthPositive(_ arr: [Int], _ k: Int) -> Int {\n    var lo = 0\n    var hi = arr.count\n    while lo < hi {\n        let mid = (lo + hi) / 2\n        if arr[mid] - (mid + 1) < k { lo = mid + 1 } else { hi = mid }\n    }\n    return lo + k\n}`,
        rust: `fn findKthPositive(arr: Vec<i32>, k: i32) -> i32 {\n    let mut lo = 0usize;\n    let mut hi = arr.len();\n    while lo < hi {\n        let mid = (lo + hi) / 2;\n        if arr[mid] - (mid as i32 + 1) < k {\n            lo = mid + 1;\n        } else {\n            hi = mid;\n        }\n    }\n    lo as i32 + k\n}`,
        php: `function findKthPositive($arr, $k) {\n    $lo = 0;\n    $hi = count($arr);\n    while ($lo < $hi) {\n        $mid = intdiv($lo + $hi, 2);\n        if ($arr[$mid] - ($mid + 1) < $k) $lo = $mid + 1; else $hi = $mid;\n    }\n    return $lo + $k;\n}`,
        ruby: `def findKthPositive(arr, k)\n  lo = 0\n  hi = arr.length\n  while lo < hi\n    mid = (lo + hi) / 2\n    if arr[mid] - (mid + 1) < k\n      lo = mid + 1\n    else\n      hi = mid\n    end\n  end\n  lo + k\nend`,
      },
    };
  })(),

  // ── Sqrt(x) (LC 69) ─────────────────────────────────────────────
  (() => {
    const ref = (x: number) => {
      if (x < 2) return x;
      let lo = 1, hi = 46341;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (mid * mid <= x) lo = mid; else hi = mid - 1;
      }
      return lo;
    };
    return {
      slug: "sqrtx",
      title: "Sqrt(x)",
      difficulty: "EASY" as const,
      tags: ["Math", "Binary Search", "Amazon", "Microsoft", "Infosys"],
      signature: { funcName: "mySqrt", params: [{ name: "x", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Return the square root of the non-negative integer `x`, **rounded down** to the nearest integer.\n\nYou may not use any built-in exponent or square-root function.",
        [
          { in: "x = 4", out: "2" },
          { in: "x = 8", out: "2", note: "The true root is about 2.828, which floors to 2." },
          { in: "x = 2147395600", out: "46340", note: "The largest perfect square inside a 32-bit int." },
        ],
        ["0 <= x <= 2147483647"]),
      hints: [
        "You are looking for the largest `r` with `r · r <= x` — a monotone predicate.",
        "Binary search `r` over `[1, 46341]`; anything larger squares past a 32-bit integer.",
        "Compare with `mid · mid <= x` in a type wide enough not to overflow, or bound the range instead.",
      ],
      editorial: explain({
        idea: "The predicate `r · r <= x` is true for a prefix of the candidate roots and false after, so binary search finds the boundary. Capping the range at 46341 keeps `mid · mid` inside a 32-bit integer.",
        steps: [
          "Return `x` directly for `x < 2`.",
          "Search `[1, 46341]` for the largest `mid` with `mid · mid <= x`, using the upper-biased midpoint `(lo + hi + 1) / 2`.",
          "Return `lo`.",
        ],
        why: "`46340² = 2147395600` fits a signed 32-bit integer while `46341² = 2147488281` does not, so the search never evaluates an overflowing product. The upper-biased midpoint is what makes the 'largest satisfying value' loop terminate — with the usual `(lo + hi) / 2` it would spin when `hi == lo + 1`.",
        time: "O(log x)",
        space: "O(1)",
        pitfalls: [
          "`mid · mid` overflows a 32-bit `int` for `mid` above 46340 — either widen the type or cap the range as here.",
          "Using the plain midpoint with `lo = mid` loops forever.",
          "Floating-point `sqrt` can round the wrong way near a perfect square, and the problem forbids it anyway.",
        ],
      }),
      examples: [
        { input: "4", expectedOutput: "2" },
        { input: "8", expectedOutput: "2" },
        { input: "2147395600", expectedOutput: "46340" },
      ],
      gen: (rng: Rng) => {
        const x = rng() < 0.5 ? ri(rng, 0, 10000) : ri(rng, 0, 2147483647);
        return { input: String(x), expectedOutput: String(ref(x)) };
      },
      solutions: {
        python: `def mySqrt(x: int) -> int:\n    if x < 2:\n        return x\n    lo, hi = 1, 46341\n    while lo < hi:\n        mid = (lo + hi + 1) // 2\n        if mid * mid <= x:\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo`,
        javascript: `var mySqrt = function(x) {\n    if (x < 2) return x;\n    var lo = 1, hi = 46341;\n    while (lo < hi) {\n        var mid = (lo + hi + 1) >> 1;\n        if (mid * mid <= x) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n};`,
        typescript: `function mySqrt(x: number): number {\n    if (x < 2) return x;\n    var lo = 1, hi = 46341;\n    while (lo < hi) {\n        var mid = (lo + hi + 1) >> 1;\n        if (mid * mid <= x) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        java: `public static int mySqrt(int x) {\n    if (x < 2) return x;\n    int lo = 1, hi = 46341;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if ((long) mid * mid <= x) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        cpp: `int mySqrt(int x) {\n    if (x < 2) return x;\n    int lo = 1, hi = 46341;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if ((long long) mid * mid <= x) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        c: `int mySqrt(int x) {\n    if (x < 2) return x;\n    int lo = 1, hi = 46341;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if ((long long) mid * mid <= (long long) x) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        csharp: `public static int MySqrt(int x)\n{\n    if (x < 2) return x;\n    int lo = 1, hi = 46341;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo + 1) / 2;\n        if ((long) mid * mid <= x) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        go: `func mySqrt(x int) int {\n\tif x < 2 {\n\t\treturn x\n\t}\n\tlo, hi := 1, 46341\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo+1)/2\n\t\tif mid*mid <= x {\n\t\t\tlo = mid\n\t\t} else {\n\t\t\thi = mid - 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `fun mySqrt(x: Int): Int {\n    if (x < 2) return x\n    var lo = 1\n    var hi = 46341\n    while (lo < hi) {\n        val mid = lo + (hi - lo + 1) / 2\n        if (mid.toLong() * mid <= x) lo = mid else hi = mid - 1\n    }\n    return lo\n}`,
        swift: `func mySqrt(_ x: Int) -> Int {\n    if x < 2 { return x }\n    var lo = 1\n    var hi = 46341\n    while lo < hi {\n        let mid = lo + (hi - lo + 1) / 2\n        if mid * mid <= x { lo = mid } else { hi = mid - 1 }\n    }\n    return lo\n}`,
        rust: `fn mySqrt(x: i32) -> i32 {\n    if x < 2 {\n        return x;\n    }\n    let mut lo = 1i64;\n    let mut hi = 46341i64;\n    while lo < hi {\n        let mid = lo + (hi - lo + 1) / 2;\n        if mid * mid <= x as i64 {\n            lo = mid;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    lo as i32\n}`,
        php: `function mySqrt($x) {\n    if ($x < 2) return $x;\n    $lo = 1;\n    $hi = 46341;\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo + 1, 2);\n        if ($mid * $mid <= $x) $lo = $mid; else $hi = $mid - 1;\n    }\n    return $lo;\n}`,
        ruby: `def mySqrt(x)\n  return x if x < 2\n  lo = 1\n  hi = 46341\n  while lo < hi\n    mid = lo + (hi - lo + 1) / 2\n    if mid * mid <= x\n      lo = mid\n    else\n      hi = mid - 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Search in Rotated Sorted Array II (LC 81) ───────────────────
  (() => {
    const ref = (nums: number[], target: number) => {
      let lo = 0, hi = nums.length - 1;
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] === target) return true;
        if (nums[lo] === nums[mid] && nums[mid] === nums[hi]) { lo++; hi--; continue; }
        if (nums[lo] <= nums[mid]) {
          if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;
        } else {
          if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;
        }
      }
      return false;
    };
    return {
      slug: "search-in-rotated-sorted-array-ii",
      title: "Search in Rotated Sorted Array II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "search", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "`nums` was sorted in non-decreasing order, then rotated at some pivot. **Duplicates are allowed.**\n\nReturn whether `target` is present.",
        [
          { in: "nums = [2,5,6,0,0,1,2], target = 0", out: "true" },
          { in: "nums = [2,5,6,0,0,1,2], target = 3", out: "false" },
          { in: "nums = [1,0,1,1,1], target = 0", out: "true", note: "The duplicated 1s hide which half is sorted." },
        ],
        ["1 <= nums.length <= 5000", "-10000 <= nums[i], target <= 10000", "nums is a rotation of a non-decreasing array."]),
      hints: [
        "In a rotated array, at least one of the two halves around the midpoint is properly sorted.",
        "Decide which half is sorted, then check whether `target` falls inside its range.",
        "Duplicates can make `nums[lo] == nums[mid] == nums[hi]`, which tells you nothing — shrink both ends by one.",
      ],
      editorial: explain({
        idea: "The rotation leaves at least one half sorted, which is enough to decide where `target` can be. Duplicates break the test for *which* half is sorted, and the only safe recovery is to narrow both ends by one — which is why the worst case is linear.",
        steps: [
          "If `nums[mid]` is the target, answer true.",
          "If `nums[lo]`, `nums[mid]` and `nums[hi]` are all equal, advance `lo` and retreat `hi` and continue.",
          "If `nums[lo] <= nums[mid]`, the left half is sorted: search it when `nums[lo] <= target < nums[mid]`, else go right.",
          "Otherwise the right half is sorted: search it when `nums[mid] < target <= nums[hi]`, else go left.",
        ],
        why: "With `nums[lo] <= nums[mid]` the left half contains no pivot, so it is genuinely sorted and a range test settles whether `target` can be there. When all three sampled values are equal, neither half can be ruled out — an adversarial input like `[1,1,1,0,1]` forces the degenerate step — so the algorithm gives up one element from each side, which is correct but makes the worst case `O(n)`.",
        time: "O(log n) average, O(n) worst case with many duplicates",
        space: "O(1)",
        pitfalls: [
          "Omitting the all-equal check makes the 'which half is sorted' test wrong and loses valid targets.",
          "Using `<` instead of `<=` in `nums[lo] <= nums[mid]` mishandles a two-element window.",
          "The range tests must be half-open on the side that holds `nums[mid]`, or the midpoint is re-examined.",
        ],
      }),
      examples: [
        { input: "[2,5,6,0,0,1,2]\n0", expectedOutput: "true" },
        { input: "[2,5,6,0,0,1,2]\n3", expectedOutput: "false" },
        { input: "[1,0,1,1,1]\n0", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 6 : 10000;
        const n = ri(rng, 1, 30);
        const base = Array.from({ length: n }, () => ri(rng, -hi, hi)).sort((a, b) => a - b);
        const pivot = ri(rng, 0, n - 1);
        const nums = base.slice(pivot).concat(base.slice(0, pivot));
        const target = rng() < 0.6 ? pick(rng, nums) : ri(rng, -hi, hi);
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: bool(ref(nums, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef search(nums: List[int], target: int) -> bool:\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return True\n        if nums[lo] == nums[mid] == nums[hi]:\n            lo += 1\n            hi -= 1\n            continue\n        if nums[lo] <= nums[mid]:\n            if nums[lo] <= target < nums[mid]:\n                hi = mid - 1\n            else:\n                lo = mid + 1\n        else:\n            if nums[mid] < target <= nums[hi]:\n                lo = mid + 1\n            else:\n                hi = mid - 1\n    return False`,
        javascript: `var search = function(nums, target) {\n    var lo = 0, hi = nums.length - 1;\n    while (lo <= hi) {\n        var mid = (lo + hi) >> 1;\n        if (nums[mid] === target) return true;\n        if (nums[lo] === nums[mid] && nums[mid] === nums[hi]) { lo++; hi--; continue; }\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;\n        }\n    }\n    return false;\n};`,
        typescript: `function search(nums: number[], target: number): boolean {\n    var lo = 0, hi = nums.length - 1;\n    while (lo <= hi) {\n        var mid = (lo + hi) >> 1;\n        if (nums[mid] === target) return true;\n        if (nums[lo] === nums[mid] && nums[mid] === nums[hi]) { lo++; hi--; continue; }\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;\n        }\n    }\n    return false;\n}`,
        java: `public static boolean search(int[] nums, int target) {\n    int lo = 0, hi = nums.length - 1;\n    while (lo <= hi) {\n        int mid = (lo + hi) >>> 1;\n        if (nums[mid] == target) return true;\n        if (nums[lo] == nums[mid] && nums[mid] == nums[hi]) {\n            lo++;\n            hi--;\n            continue;\n        }\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;\n        }\n    }\n    return false;\n}`,
        cpp: `bool search(vector<int>& nums, int target) {\n    int lo = 0, hi = (int) nums.size() - 1;\n    while (lo <= hi) {\n        int mid = (lo + hi) / 2;\n        if (nums[mid] == target) return true;\n        if (nums[lo] == nums[mid] && nums[mid] == nums[hi]) {\n            lo++;\n            hi--;\n            continue;\n        }\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;\n        }\n    }\n    return false;\n}`,
        c: `bool search(int* nums, int numsSize, int target) {\n    int lo = 0, hi = numsSize - 1;\n    while (lo <= hi) {\n        int mid = (lo + hi) / 2;\n        if (nums[mid] == target) return true;\n        if (nums[lo] == nums[mid] && nums[mid] == nums[hi]) {\n            lo++;\n            hi--;\n            continue;\n        }\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;\n        }\n    }\n    return false;\n}`,
        csharp: `public static bool Search(int[] nums, int target)\n{\n    int lo = 0, hi = nums.Length - 1;\n    while (lo <= hi)\n    {\n        int mid = (lo + hi) / 2;\n        if (nums[mid] == target) return true;\n        if (nums[lo] == nums[mid] && nums[mid] == nums[hi])\n        {\n            lo++;\n            hi--;\n            continue;\n        }\n        if (nums[lo] <= nums[mid])\n        {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1; else lo = mid + 1;\n        }\n        else\n        {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1; else hi = mid - 1;\n        }\n    }\n    return false;\n}`,
        go: `func search(nums []int, target int) bool {\n\tlo, hi := 0, len(nums)-1\n\tfor lo <= hi {\n\t\tmid := (lo + hi) / 2\n\t\tif nums[mid] == target {\n\t\t\treturn true\n\t\t}\n\t\tif nums[lo] == nums[mid] && nums[mid] == nums[hi] {\n\t\t\tlo++\n\t\t\thi--\n\t\t\tcontinue\n\t\t}\n\t\tif nums[lo] <= nums[mid] {\n\t\t\tif nums[lo] <= target && target < nums[mid] {\n\t\t\t\thi = mid - 1\n\t\t\t} else {\n\t\t\t\tlo = mid + 1\n\t\t\t}\n\t\t} else {\n\t\t\tif nums[mid] < target && target <= nums[hi] {\n\t\t\t\tlo = mid + 1\n\t\t\t} else {\n\t\t\t\thi = mid - 1\n\t\t\t}\n\t\t}\n\t}\n\treturn false\n}`,
        kotlin: `fun search(nums: IntArray, target: Int): Boolean {\n    var lo = 0\n    var hi = nums.size - 1\n    while (lo <= hi) {\n        val mid = (lo + hi) / 2\n        if (nums[mid] == target) return true\n        if (nums[lo] == nums[mid] && nums[mid] == nums[hi]) {\n            lo++\n            hi--\n            continue\n        }\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1 else lo = mid + 1\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1 else hi = mid - 1\n        }\n    }\n    return false\n}`,
        swift: `func search(_ nums: [Int], _ target: Int) -> Bool {\n    var lo = 0\n    var hi = nums.count - 1\n    while lo <= hi {\n        let mid = (lo + hi) / 2\n        if nums[mid] == target { return true }\n        if nums[lo] == nums[mid] && nums[mid] == nums[hi] {\n            lo += 1\n            hi -= 1\n            continue\n        }\n        if nums[lo] <= nums[mid] {\n            if nums[lo] <= target && target < nums[mid] { hi = mid - 1 } else { lo = mid + 1 }\n        } else {\n            if nums[mid] < target && target <= nums[hi] { lo = mid + 1 } else { hi = mid - 1 }\n        }\n    }\n    return false\n}`,
        rust: `fn search(nums: Vec<i32>, target: i32) -> bool {\n    let mut lo: i32 = 0;\n    let mut hi: i32 = nums.len() as i32 - 1;\n    while lo <= hi {\n        let mid = (lo + hi) / 2;\n        let m = nums[mid as usize];\n        if m == target {\n            return true;\n        }\n        let a = nums[lo as usize];\n        let b = nums[hi as usize];\n        if a == m && m == b {\n            lo += 1;\n            hi -= 1;\n            continue;\n        }\n        if a <= m {\n            if a <= target && target < m {\n                hi = mid - 1;\n            } else {\n                lo = mid + 1;\n            }\n        } else {\n            if m < target && target <= b {\n                lo = mid + 1;\n            } else {\n                hi = mid - 1;\n            }\n        }\n    }\n    false\n}`,
        php: `function search($nums, $target) {\n    $lo = 0;\n    $hi = count($nums) - 1;\n    while ($lo <= $hi) {\n        $mid = intdiv($lo + $hi, 2);\n        if ($nums[$mid] === $target) return true;\n        if ($nums[$lo] === $nums[$mid] && $nums[$mid] === $nums[$hi]) {\n            $lo++;\n            $hi--;\n            continue;\n        }\n        if ($nums[$lo] <= $nums[$mid]) {\n            if ($nums[$lo] <= $target && $target < $nums[$mid]) $hi = $mid - 1; else $lo = $mid + 1;\n        } else {\n            if ($nums[$mid] < $target && $target <= $nums[$hi]) $lo = $mid + 1; else $hi = $mid - 1;\n        }\n    }\n    return false;\n}`,
        ruby: `def search(nums, target)\n  lo = 0\n  hi = nums.length - 1\n  while lo <= hi\n    mid = (lo + hi) / 2\n    return true if nums[mid] == target\n    if nums[lo] == nums[mid] && nums[mid] == nums[hi]\n      lo += 1\n      hi -= 1\n      next\n    end\n    if nums[lo] <= nums[mid]\n      if nums[lo] <= target && target < nums[mid]\n        hi = mid - 1\n      else\n        lo = mid + 1\n      end\n    else\n      if nums[mid] < target && target <= nums[hi]\n        lo = mid + 1\n      else\n        hi = mid - 1\n      end\n    end\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Find Minimum in Rotated Sorted Array II (LC 154) ────────────
  (() => {
    const ref = (nums: number[]) => {
      let lo = 0, hi = nums.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] > nums[hi]) lo = mid + 1;
        else if (nums[mid] < nums[hi]) hi = mid;
        else hi--;
      }
      return nums[lo];
    };
    return {
      slug: "find-minimum-in-rotated-sorted-array-ii",
      title: "Find Minimum in Rotated Sorted Array II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Amazon", "Google", "Goldman Sachs"],
      signature: { funcName: "findMin", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`nums` was sorted in non-decreasing order and then rotated at some pivot. **Duplicates are allowed.**\n\nReturn its minimum element.",
        [
          { in: "nums = [1,3,5]", out: "1", note: "Rotated zero times." },
          { in: "nums = [2,2,2,0,1]", out: "0" },
          { in: "nums = [3,3,1,3]", out: "1", note: "The duplicated 3s hide the pivot from a naive comparison." },
        ],
        ["1 <= nums.length <= 5000", "-5000 <= nums[i] <= 5000", "nums is a rotation of a non-decreasing array."]),
      hints: [
        "Compare the midpoint with the **right** end, not the left — that tells you which side holds the pivot.",
        "`nums[mid] > nums[hi]` means the minimum is strictly right of `mid`.",
        "When they are equal, neither side can be ruled out — drop one element from the right and retry.",
      ],
      editorial: explain({
        idea: "Anchor the comparison at the right end. A midpoint greater than the right end must sit in the left, higher run, so the minimum lies after it; a smaller midpoint could itself be the minimum. Equality gives no information, and the only safe move is to discard one candidate.",
        steps: [
          "While `lo < hi`, take `mid`.",
          "`nums[mid] > nums[hi]` → `lo = mid + 1`.",
          "`nums[mid] < nums[hi]` → `hi = mid`.",
          "Otherwise `hi--`.",
        ],
        why: "Comparing against `nums[hi]` is what makes the rule total: in a rotated non-decreasing array, everything strictly greater than the last element belongs to the pre-pivot run. Shrinking `hi` on equality is safe because `nums[hi]` is duplicated at `mid`, so discarding it cannot remove the only copy of the minimum. That step is what pushes the worst case to `O(n)` for inputs like `[1,1,1,1]`.",
        time: "O(log n) average, O(n) worst case",
        space: "O(1)",
        pitfalls: [
          "Comparing with `nums[lo]` instead needs extra cases and gets `[3,3,1,3]` wrong.",
          "Setting `hi = mid - 1` in the second branch can skip over the minimum.",
          "`hi--` rather than `lo++` on equality — dropping from the left can discard the pivot itself.",
        ],
      }),
      examples: [
        { input: "[1,3,5]", expectedOutput: "1" },
        { input: "[2,2,2,0,1]", expectedOutput: "0" },
        { input: "[3,3,1,3]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 5 : 5000;
        const n = ri(rng, 1, 30);
        const base = Array.from({ length: n }, () => ri(rng, -hi, hi)).sort((a, b) => a - b);
        const pivot = ri(rng, 0, n - 1);
        const nums = base.slice(pivot).concat(base.slice(0, pivot));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findMin(nums: List[int]) -> int:\n    lo, hi = 0, len(nums) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if nums[mid] > nums[hi]:\n            lo = mid + 1\n        elif nums[mid] < nums[hi]:\n            hi = mid\n        else:\n            hi -= 1\n    return nums[lo]`,
        javascript: `var findMin = function(nums) {\n    var lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        var mid = (lo + hi) >> 1;\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else if (nums[mid] < nums[hi]) hi = mid;\n        else hi--;\n    }\n    return nums[lo];\n};`,
        typescript: `function findMin(nums: number[]): number {\n    var lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        var mid = (lo + hi) >> 1;\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else if (nums[mid] < nums[hi]) hi = mid;\n        else hi--;\n    }\n    return nums[lo];\n}`,
        java: `public static int findMin(int[] nums) {\n    int lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        int mid = (lo + hi) >>> 1;\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else if (nums[mid] < nums[hi]) hi = mid;\n        else hi--;\n    }\n    return nums[lo];\n}`,
        cpp: `int findMin(vector<int>& nums) {\n    int lo = 0, hi = (int) nums.size() - 1;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else if (nums[mid] < nums[hi]) hi = mid;\n        else hi--;\n    }\n    return nums[lo];\n}`,
        c: `int findMin(int* nums, int numsSize) {\n    int lo = 0, hi = numsSize - 1;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else if (nums[mid] < nums[hi]) hi = mid;\n        else hi--;\n    }\n    return nums[lo];\n}`,
        csharp: `public static int FindMin(int[] nums)\n{\n    int lo = 0, hi = nums.Length - 1;\n    while (lo < hi)\n    {\n        int mid = (lo + hi) / 2;\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else if (nums[mid] < nums[hi]) hi = mid;\n        else hi--;\n    }\n    return nums[lo];\n}`,
        go: `func findMin(nums []int) int {\n\tlo, hi := 0, len(nums)-1\n\tfor lo < hi {\n\t\tmid := (lo + hi) / 2\n\t\tif nums[mid] > nums[hi] {\n\t\t\tlo = mid + 1\n\t\t} else if nums[mid] < nums[hi] {\n\t\t\thi = mid\n\t\t} else {\n\t\t\thi--\n\t\t}\n\t}\n\treturn nums[lo]\n}`,
        kotlin: `fun findMin(nums: IntArray): Int {\n    var lo = 0\n    var hi = nums.size - 1\n    while (lo < hi) {\n        val mid = (lo + hi) / 2\n        when {\n            nums[mid] > nums[hi] -> lo = mid + 1\n            nums[mid] < nums[hi] -> hi = mid\n            else -> hi--\n        }\n    }\n    return nums[lo]\n}`,
        swift: `func findMin(_ nums: [Int]) -> Int {\n    var lo = 0\n    var hi = nums.count - 1\n    while lo < hi {\n        let mid = (lo + hi) / 2\n        if nums[mid] > nums[hi] {\n            lo = mid + 1\n        } else if nums[mid] < nums[hi] {\n            hi = mid\n        } else {\n            hi -= 1\n        }\n    }\n    return nums[lo]\n}`,
        rust: `fn findMin(nums: Vec<i32>) -> i32 {\n    let mut lo = 0usize;\n    let mut hi = nums.len() - 1;\n    while lo < hi {\n        let mid = (lo + hi) / 2;\n        if nums[mid] > nums[hi] {\n            lo = mid + 1;\n        } else if nums[mid] < nums[hi] {\n            hi = mid;\n        } else {\n            hi -= 1;\n        }\n    }\n    nums[lo]\n}`,
        php: `function findMin($nums) {\n    $lo = 0;\n    $hi = count($nums) - 1;\n    while ($lo < $hi) {\n        $mid = intdiv($lo + $hi, 2);\n        if ($nums[$mid] > $nums[$hi]) $lo = $mid + 1;\n        elseif ($nums[$mid] < $nums[$hi]) $hi = $mid;\n        else $hi--;\n    }\n    return $nums[$lo];\n}`,
        ruby: `def findMin(nums)\n  lo = 0\n  hi = nums.length - 1\n  while lo < hi\n    mid = (lo + hi) / 2\n    if nums[mid] > nums[hi]\n      lo = mid + 1\n    elsif nums[mid] < nums[hi]\n      hi = mid\n    else\n      hi -= 1\n    end\n  end\n  nums[lo]\nend`,
      },
    };
  })(),

  // ── Find First and Last Position of Element in Sorted Array (LC 34) ──
  (() => {
    const ref = (nums: number[], target: number) => {
      const lower = (t: number) => {
        let lo = 0, hi = nums.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (nums[mid] < t) lo = mid + 1; else hi = mid;
        }
        return lo;
      };
      const a = lower(target);
      if (a === nums.length || nums[a] !== target) return [-1, -1];
      return [a, lower(target + 1) - 1];
    };
    return {
      slug: "find-first-and-last-position-of-element-in-sorted-array",
      title: "Find First and Last Position of Element in Sorted Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Amazon", "Meta", "Microsoft"],
      signature: { funcName: "searchRange", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given a `nums` sorted in non-decreasing order, return the first and last index of `target` as `[first, last]`.\n\nIf `target` is absent, return `[-1,-1]`. The algorithm must run in `O(log n)` time.",
        [
          { in: "nums = [5,7,7,8,8,10], target = 8", out: "[3,4]" },
          { in: "nums = [5,7,7,8,8,10], target = 6", out: "[-1,-1]" },
          { in: "nums = [1], target = 1", out: "[0,0]" },
        ],
        ["1 <= nums.length <= 100000", "-1000000000 <= nums[i], target <= 1000000000", "nums is sorted in non-decreasing order."]),
      hints: [
        "Write one helper: the leftmost index where a value could be inserted (the lower bound).",
        "The first occurrence is `lowerBound(target)`.",
        "The last occurrence is `lowerBound(target + 1) - 1`.",
      ],
      editorial: explain({
        idea: "Both ends come from the same primitive. `lowerBound(t)` is the first index whose value is at least `t`; calling it twice pins the whole run of equal values without a second, mirror-image search.",
        steps: [
          "Implement `lowerBound(t)`: binary search over `[0, n]`, moving `lo` past `mid` while `nums[mid] < t`.",
          "Let `a = lowerBound(target)`. If `a == n` or `nums[a] != target`, the value is absent.",
          "Otherwise the answer is `[a, lowerBound(target + 1) - 1]`.",
        ],
        why: "`nums[i] < t` is false for a suffix of a sorted array, so the boundary is unique. `lowerBound(target + 1)` is the first index past every copy of `target`, so one less is the last copy. Using `target + 1` rather than a separate upper-bound search halves the code, at the cost of assuming integer values — which the problem gives.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "`target + 1` can overflow when `target` is the maximum representable value; widen the type or write a true upper bound.",
          "Checking `nums[a] != target` before the `a == n` guard reads out of bounds.",
          "A linear scan after finding one occurrence is `O(n)` and fails the required complexity.",
        ],
      }),
      examples: [
        { input: "[5,7,7,8,8,10]\n8", expectedOutput: "[3,4]" },
        { input: "[5,7,7,8,8,10]\n6", expectedOutput: "[-1,-1]" },
        { input: "[1]\n1", expectedOutput: "[0,0]" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 8 : 1000000000;
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, -hi, hi)).sort((a, b) => a - b);
        const target = rng() < 0.6 ? pick(rng, nums) : ri(rng, -hi, hi);
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: fmtIntArr(ref(nums, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef searchRange(nums: List[int], target: int) -> List[int]:\n    def lower(t: int) -> int:\n        lo, hi = 0, len(nums)\n        while lo < hi:\n            mid = (lo + hi) // 2\n            if nums[mid] < t:\n                lo = mid + 1\n            else:\n                hi = mid\n        return lo\n\n    a = lower(target)\n    if a == len(nums) or nums[a] != target:\n        return [-1, -1]\n    return [a, lower(target + 1) - 1]`,
        javascript: `var searchRange = function(nums, target) {\n    var lower = function(t) {\n        var lo = 0, hi = nums.length;\n        while (lo < hi) {\n            var mid = (lo + hi) >> 1;\n            if (nums[mid] < t) lo = mid + 1; else hi = mid;\n        }\n        return lo;\n    };\n    var a = lower(target);\n    if (a === nums.length || nums[a] !== target) return [-1, -1];\n    return [a, lower(target + 1) - 1];\n};`,
        typescript: `function searchRange(nums: number[], target: number): number[] {\n    var lower = function(t: number): number {\n        var lo = 0, hi = nums.length;\n        while (lo < hi) {\n            var mid = (lo + hi) >> 1;\n            if (nums[mid] < t) lo = mid + 1; else hi = mid;\n        }\n        return lo;\n    };\n    var a = lower(target);\n    if (a === nums.length || nums[a] !== target) return [-1, -1];\n    return [a, lower(target + 1) - 1];\n}`,
        java: `private static int lowerBoundRange(int[] nums, long t) {\n    int lo = 0, hi = nums.length;\n    while (lo < hi) {\n        int mid = (lo + hi) >>> 1;\n        if (nums[mid] < t) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}\n\npublic static int[] searchRange(int[] nums, int target) {\n    int a = lowerBoundRange(nums, target);\n    if (a == nums.length || nums[a] != target) return new int[] { -1, -1 };\n    return new int[] { a, lowerBoundRange(nums, (long) target + 1) - 1 };\n}`,
        cpp: `static int lowerBoundRange(vector<int>& nums, long long t) {\n    int lo = 0, hi = (int) nums.size();\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (nums[mid] < t) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}\n\nvector<int> searchRange(vector<int>& nums, int target) {\n    int a = lowerBoundRange(nums, target);\n    if (a == (int) nums.size() || nums[a] != target) return vector<int>{ -1, -1 };\n    return vector<int>{ a, lowerBoundRange(nums, (long long) target + 1) - 1 };\n}`,
        c: `static int lowerBoundRange(int* nums, int numsSize, long long t) {\n    int lo = 0, hi = numsSize;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if ((long long) nums[mid] < t) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}\n\nint* searchRange(int* nums, int numsSize, int target, int* returnSize) {\n    int* out = (int*) malloc(2 * sizeof(int));\n    *returnSize = 2;\n    int a = lowerBoundRange(nums, numsSize, (long long) target);\n    if (a == numsSize || nums[a] != target) {\n        out[0] = -1;\n        out[1] = -1;\n        return out;\n    }\n    out[0] = a;\n    out[1] = lowerBoundRange(nums, numsSize, (long long) target + 1) - 1;\n    return out;\n}`,
        csharp: `private static int LowerBoundRange(int[] nums, long t)\n{\n    int lo = 0, hi = nums.Length;\n    while (lo < hi)\n    {\n        int mid = (lo + hi) / 2;\n        if (nums[mid] < t) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}\n\npublic static int[] SearchRange(int[] nums, int target)\n{\n    int a = LowerBoundRange(nums, target);\n    if (a == nums.Length || nums[a] != target) return new int[] { -1, -1 };\n    return new int[] { a, LowerBoundRange(nums, (long) target + 1) - 1 };\n}`,
        go: `func lowerBoundRange(nums []int, t int) int {\n\tlo, hi := 0, len(nums)\n\tfor lo < hi {\n\t\tmid := (lo + hi) / 2\n\t\tif nums[mid] < t {\n\t\t\tlo = mid + 1\n\t\t} else {\n\t\t\thi = mid\n\t\t}\n\t}\n\treturn lo\n}\n\nfunc searchRange(nums []int, target int) []int {\n\ta := lowerBoundRange(nums, target)\n\tif a == len(nums) || nums[a] != target {\n\t\treturn []int{-1, -1}\n\t}\n\treturn []int{a, lowerBoundRange(nums, target+1) - 1}\n}`,
        kotlin: `private fun lowerBoundRange(nums: IntArray, t: Long): Int {\n    var lo = 0\n    var hi = nums.size\n    while (lo < hi) {\n        val mid = (lo + hi) / 2\n        if (nums[mid] < t) lo = mid + 1 else hi = mid\n    }\n    return lo\n}\n\nfun searchRange(nums: IntArray, target: Int): IntArray {\n    val a = lowerBoundRange(nums, target.toLong())\n    if (a == nums.size || nums[a] != target) return intArrayOf(-1, -1)\n    return intArrayOf(a, lowerBoundRange(nums, target.toLong() + 1) - 1)\n}`,
        swift: `func searchRange(_ nums: [Int], _ target: Int) -> [Int] {\n    func lower(_ t: Int) -> Int {\n        var lo = 0\n        var hi = nums.count\n        while lo < hi {\n            let mid = (lo + hi) / 2\n            if nums[mid] < t { lo = mid + 1 } else { hi = mid }\n        }\n        return lo\n    }\n    let a = lower(target)\n    if a == nums.count || nums[a] != target { return [-1, -1] }\n    return [a, lower(target + 1) - 1]\n}`,
        rust: `fn searchRange(nums: Vec<i32>, target: i32) -> Vec<i32> {\n    let lower = |t: i64| -> usize {\n        let mut lo = 0usize;\n        let mut hi = nums.len();\n        while lo < hi {\n            let mid = (lo + hi) / 2;\n            if (nums[mid] as i64) < t {\n                lo = mid + 1;\n            } else {\n                hi = mid;\n            }\n        }\n        lo\n    };\n    let a = lower(target as i64);\n    if a == nums.len() || nums[a] != target {\n        return vec![-1, -1];\n    }\n    vec![a as i32, lower(target as i64 + 1) as i32 - 1]\n}`,
        php: `function searchRange($nums, $target) {\n    $lower = function($t) use ($nums) {\n        $lo = 0;\n        $hi = count($nums);\n        while ($lo < $hi) {\n            $mid = intdiv($lo + $hi, 2);\n            if ($nums[$mid] < $t) $lo = $mid + 1; else $hi = $mid;\n        }\n        return $lo;\n    };\n    $a = $lower($target);\n    if ($a === count($nums) || $nums[$a] !== $target) return [-1, -1];\n    return [$a, $lower($target + 1) - 1];\n}`,
        ruby: `def searchRange(nums, target)\n  lower = lambda do |t|\n    lo = 0\n    hi = nums.length\n    while lo < hi\n      mid = (lo + hi) / 2\n      if nums[mid] < t\n        lo = mid + 1\n      else\n        hi = mid\n      end\n    end\n    lo\n  end\n  a = lower.call(target)\n  return [-1, -1] if a == nums.length || nums[a] != target\n  [a, lower.call(target + 1) - 1]\nend`,
      },
    };
  })(),

  // ── Capacity to Ship Packages Within D Days (LC 1011) ───────────
  (() => {
    const ref = (weights: number[], days: number) => {
      let lo = 0, hi = 0;
      for (let i = 0; i < weights.length; i++) {
        if (weights[i] > lo) lo = weights[i];
        hi += weights[i];
      }
      const need = (cap: number) => {
        let d = 1, cur = 0;
        for (let i = 0; i < weights.length; i++) {
          if (cur + weights[i] > cap) { d++; cur = 0; }
          cur += weights[i];
        }
        return d;
      };
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (need(mid) <= days) hi = mid; else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "capacity-to-ship-packages-within-d-days",
      title: "Capacity to Ship Packages Within D Days",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "shipWithinDays", params: [{ name: "weights", type: "int[]" as const }, { name: "days", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Packages must be shipped **in the given order** within `days` days. Each day you load the ship with consecutive packages without exceeding its weight capacity.\n\nReturn the minimum capacity that gets every package shipped in time.",
        [
          { in: "weights = [1,2,3,4,5,6,7,8,9,10], days = 5", out: "15", note: "Days of 1+2+3+4+5, 6+7, 8, 9, 10." },
          { in: "weights = [3,2,2,4,1,4], days = 3", out: "6" },
          { in: "weights = [1,2,3,1,1], days = 4", out: "3" },
        ],
        ["1 <= days <= weights.length <= 50000", "1 <= weights[i] <= 500"]),
      hints: [
        "If a capacity works, every larger capacity works too — the feasibility is monotone.",
        "So binary search the capacity, and for each candidate greedily count the days needed.",
        "The search range runs from the heaviest single package to the total weight.",
      ],
      editorial: explain({
        idea: "Binary search on the answer. For a fixed capacity, the minimum number of days is obtained greedily — keep loading while it fits — and that count is non-increasing in the capacity, so the feasible capacities form a suffix.",
        steps: [
          "Set `lo` to the maximum weight (anything smaller cannot carry that package) and `hi` to the total weight (one day suffices).",
          "`need(cap)`: sweep the weights, starting a new day whenever the next package would overflow.",
          "Binary search the smallest `cap` with `need(cap) <= days`.",
        ],
        why: "The greedy day count is optimal for a fixed capacity: deferring a package that fits can only push work later and never reduces the number of days. Raising the capacity can only let more packages fit per day, so `need` is non-increasing — exactly the monotonicity binary search needs.",
        time: "O(n log W) where W is the total weight",
        space: "O(1)",
        pitfalls: [
          "Starting `lo` at 1 lets the search consider capacities that can never carry the heaviest package; `need` must then be written not to loop forever.",
          "`d` starts at 1, not 0 — the first day is already in use.",
          "Splitting packages or reordering them is not allowed.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5,6,7,8,9,10]\n5", expectedOutput: "15" },
        { input: "[3,2,2,4,1,4]\n3", expectedOutput: "6" },
        { input: "[1,2,3,1,1]\n4", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const weights = Array.from({ length: n }, () => ri(rng, 1, 500));
        const days = ri(rng, 1, n);
        return { input: `${fmtIntArr(weights)}\n${days}`, expectedOutput: String(ref(weights, days)) };
      },
      solutions: {
        python: `from typing import List\n\ndef shipWithinDays(weights: List[int], days: int) -> int:\n    lo, hi = max(weights), sum(weights)\n\n    def need(cap: int) -> int:\n        d, cur = 1, 0\n        for w in weights:\n            if cur + w > cap:\n                d += 1\n                cur = 0\n            cur += w\n        return d\n\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if need(mid) <= days:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var shipWithinDays = function(weights, days) {\n    var lo = 0, hi = 0, i;\n    for (i = 0; i < weights.length; i++) {\n        if (weights[i] > lo) lo = weights[i];\n        hi += weights[i];\n    }\n    var need = function(cap) {\n        var d = 1, cur = 0;\n        for (var j = 0; j < weights.length; j++) {\n            if (cur + weights[j] > cap) { d++; cur = 0; }\n            cur += weights[j];\n        }\n        return d;\n    };\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (need(mid) <= days) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n};`,
        typescript: `function shipWithinDays(weights: number[], days: number): number {\n    var lo = 0, hi = 0, i: number;\n    for (i = 0; i < weights.length; i++) {\n        if (weights[i] > lo) lo = weights[i];\n        hi += weights[i];\n    }\n    var need = function(cap: number): number {\n        var d = 1, cur = 0;\n        for (var j = 0; j < weights.length; j++) {\n            if (cur + weights[j] > cap) { d++; cur = 0; }\n            cur += weights[j];\n        }\n        return d;\n    };\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (need(mid) <= days) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        java: `private static int daysNeeded(int[] weights, int cap) {\n    int d = 1, cur = 0;\n    for (int w : weights) {\n        if (cur + w > cap) {\n            d++;\n            cur = 0;\n        }\n        cur += w;\n    }\n    return d;\n}\n\npublic static int shipWithinDays(int[] weights, int days) {\n    int lo = 0, hi = 0;\n    for (int w : weights) {\n        lo = Math.max(lo, w);\n        hi += w;\n    }\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (daysNeeded(weights, mid) <= days) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        cpp: `static int daysNeeded(vector<int>& weights, int cap) {\n    int d = 1, cur = 0;\n    for (int w : weights) {\n        if (cur + w > cap) {\n            d++;\n            cur = 0;\n        }\n        cur += w;\n    }\n    return d;\n}\n\nint shipWithinDays(vector<int>& weights, int days) {\n    int lo = 0, hi = 0;\n    for (int w : weights) {\n        lo = max(lo, w);\n        hi += w;\n    }\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (daysNeeded(weights, mid) <= days) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        c: `static int daysNeeded(int* weights, int n, int cap) {\n    int d = 1, cur = 0;\n    for (int i = 0; i < n; i++) {\n        if (cur + weights[i] > cap) {\n            d++;\n            cur = 0;\n        }\n        cur += weights[i];\n    }\n    return d;\n}\n\nint shipWithinDays(int* weights, int weightsSize, int days) {\n    int lo = 0, hi = 0;\n    for (int i = 0; i < weightsSize; i++) {\n        if (weights[i] > lo) lo = weights[i];\n        hi += weights[i];\n    }\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (daysNeeded(weights, weightsSize, mid) <= days) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        csharp: `private static int DaysNeeded(int[] weights, int cap)\n{\n    int d = 1, cur = 0;\n    foreach (int w in weights)\n    {\n        if (cur + w > cap)\n        {\n            d++;\n            cur = 0;\n        }\n        cur += w;\n    }\n    return d;\n}\n\npublic static int ShipWithinDays(int[] weights, int days)\n{\n    int lo = 0, hi = 0;\n    foreach (int w in weights)\n    {\n        if (w > lo) lo = w;\n        hi += w;\n    }\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (DaysNeeded(weights, mid) <= days) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        go: `func daysNeeded(weights []int, cap int) int {\n\td, cur := 1, 0\n\tfor _, w := range weights {\n\t\tif cur+w > cap {\n\t\t\td++\n\t\t\tcur = 0\n\t\t}\n\t\tcur += w\n\t}\n\treturn d\n}\n\nfunc shipWithinDays(weights []int, days int) int {\n\tlo, hi := 0, 0\n\tfor _, w := range weights {\n\t\tif w > lo {\n\t\t\tlo = w\n\t\t}\n\t\thi += w\n\t}\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif daysNeeded(weights, mid) <= days {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `private fun daysNeeded(weights: IntArray, cap: Int): Int {\n    var d = 1\n    var cur = 0\n    for (w in weights) {\n        if (cur + w > cap) {\n            d++\n            cur = 0\n        }\n        cur += w\n    }\n    return d\n}\n\nfun shipWithinDays(weights: IntArray, days: Int): Int {\n    var lo = 0\n    var hi = 0\n    for (w in weights) {\n        if (w > lo) lo = w\n        hi += w\n    }\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (daysNeeded(weights, mid) <= days) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
        swift: `func shipWithinDays(_ weights: [Int], _ days: Int) -> Int {\n    var lo = 0\n    var hi = 0\n    for w in weights {\n        if w > lo { lo = w }\n        hi += w\n    }\n    func need(_ cap: Int) -> Int {\n        var d = 1\n        var cur = 0\n        for w in weights {\n            if cur + w > cap {\n                d += 1\n                cur = 0\n            }\n            cur += w\n        }\n        return d\n    }\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if need(mid) <= days { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
        rust: `fn shipWithinDays(weights: Vec<i32>, days: i32) -> i32 {\n    let mut lo = 0i32;\n    let mut hi = 0i32;\n    for &w in weights.iter() {\n        if w > lo {\n            lo = w;\n        }\n        hi += w;\n    }\n    let need = |cap: i32| -> i32 {\n        let mut d = 1i32;\n        let mut cur = 0i32;\n        for &w in weights.iter() {\n            if cur + w > cap {\n                d += 1;\n                cur = 0;\n            }\n            cur += w;\n        }\n        d\n    };\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if need(mid) <= days {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo\n}`,
        php: `function shipWithinDays($weights, $days) {\n    $lo = 0;\n    $hi = 0;\n    foreach ($weights as $w) {\n        if ($w > $lo) $lo = $w;\n        $hi += $w;\n    }\n    $need = function($cap) use ($weights) {\n        $d = 1;\n        $cur = 0;\n        foreach ($weights as $w) {\n            if ($cur + $w > $cap) { $d++; $cur = 0; }\n            $cur += $w;\n        }\n        return $d;\n    };\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($need($mid) <= $days) $hi = $mid; else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
        ruby: `def shipWithinDays(weights, days)\n  lo = weights.max\n  hi = weights.sum\n  need = lambda do |cap|\n    d = 1\n    cur = 0\n    weights.each do |w|\n      if cur + w > cap\n        d += 1\n        cur = 0\n      end\n      cur += w\n    end\n    d\n  end\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if need.call(mid) <= days\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Minimum Number of Days to Make m Bouquets (LC 1482) ─────────
  (() => {
    const ref = (bloomDay: number[], m: number, k: number) => {
      const n = bloomDay.length;
      if (m * k > n) return -1;
      let lo = bloomDay[0], hi = bloomDay[0];
      for (let i = 1; i < n; i++) {
        if (bloomDay[i] < lo) lo = bloomDay[i];
        if (bloomDay[i] > hi) hi = bloomDay[i];
      }
      const can = (day: number) => {
        let made = 0, run = 0;
        for (let i = 0; i < n; i++) {
          if (bloomDay[i] <= day) {
            run++;
            if (run === k) { made++; run = 0; }
          } else run = 0;
        }
        return made >= m;
      };
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (can(mid)) hi = mid; else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "minimum-number-of-days-to-make-m-bouquets",
      title: "Minimum Number of Days to Make m Bouquets",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Amazon", "Google", "Swiggy"],
      signature: { funcName: "minDays", params: [{ name: "bloomDay", type: "int[]" as const }, { name: "m", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Flower `i` blooms on day `bloomDay[i]` and stays bloomed. One bouquet uses `k` **adjacent** bloomed flowers, and each flower can be used in at most one bouquet.\n\nReturn the earliest day on which `m` bouquets can be made, or `-1` if it is impossible.",
        [
          { in: "bloomDay = [1,10,3,10,2], m = 3, k = 1", out: "3", note: "By day 3 the flowers at 0, 2 and 4 have bloomed." },
          { in: "bloomDay = [1,10,3,10,2], m = 3, k = 2", out: "-1", note: "Only 5 flowers exist but 6 are needed." },
          { in: "bloomDay = [7,7,7,7,12,7,7], m = 2, k = 3", out: "12" },
        ],
        ["1 <= bloomDay.length <= 100000", "1 <= bloomDay[i] <= 1000000000", "1 <= m <= 1000000", "1 <= k <= bloomDay.length"]),
      hints: [
        "Waiting longer never destroys a bouquet, so feasibility is monotone in the day.",
        "Binary search the day; for a candidate, greedily cut bouquets from every run of bloomed flowers.",
        "If `m · k` exceeds the number of flowers, no day can work.",
      ],
      editorial: explain({
        idea: "Binary search the answer. For a fixed day, the maximum number of bouquets is obtained greedily: walk the array and close a bouquet every time `k` consecutive bloomed flowers accumulate. That count only grows as the day advances.",
        steps: [
          "Reject outright when `m · k > n`.",
          "Set the search range to the minimum and maximum bloom days.",
          "`can(day)`: count runs of flowers with `bloomDay[i] <= day`, taking `floor(runLength / k)` bouquets from each — the reset-on-`k` loop does exactly that.",
          "Binary search the smallest feasible day.",
        ],
        why: "Greedy cutting is optimal within a run of length `L`: any arrangement of adjacent groups of `k` inside it yields at most `floor(L / k)` bouquets, and cutting from the left achieves that. Since a later day only turns more flowers bloomed, runs can only lengthen and merge, so the bouquet count is non-decreasing — the predicate is monotone.",
        time: "O(n log D) where D is the bloom-day range",
        space: "O(1)",
        pitfalls: [
          "`m · k` reaches `10^6 · 10^5 = 10^11` — the impossibility check needs 64-bit arithmetic.",
          "A run must reset on an unbloomed flower, otherwise non-adjacent flowers get combined.",
          "Searching from day 1 rather than the minimum bloom day still works but wastes iterations.",
        ],
      }),
      examples: [
        { input: "[1,10,3,10,2]\n3\n1", expectedOutput: "3" },
        { input: "[1,10,3,10,2]\n3\n2", expectedOutput: "-1" },
        { input: "[7,7,7,7,12,7,7]\n2\n3", expectedOutput: "12" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const hi = rng() < 0.6 ? 12 : 1000000000;
        const bloomDay = Array.from({ length: n }, () => ri(rng, 1, hi));
        const k = ri(rng, 1, n);
        const m = rng() < 0.7 ? ri(rng, 1, Math.max(1, Math.floor(n / k))) : ri(rng, 1, n);
        return { input: `${fmtIntArr(bloomDay)}\n${m}\n${k}`, expectedOutput: String(ref(bloomDay, m, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minDays(bloomDay: List[int], m: int, k: int) -> int:\n    n = len(bloomDay)\n    if m * k > n:\n        return -1\n    lo, hi = min(bloomDay), max(bloomDay)\n\n    def can(day: int) -> bool:\n        made = run = 0\n        for b in bloomDay:\n            if b <= day:\n                run += 1\n                if run == k:\n                    made += 1\n                    run = 0\n            else:\n                run = 0\n        return made >= m\n\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if can(mid):\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var minDays = function(bloomDay, m, k) {\n    var n = bloomDay.length;\n    if (m * k > n) return -1;\n    var lo = bloomDay[0], hi = bloomDay[0], i;\n    for (i = 1; i < n; i++) {\n        if (bloomDay[i] < lo) lo = bloomDay[i];\n        if (bloomDay[i] > hi) hi = bloomDay[i];\n    }\n    var can = function(day) {\n        var made = 0, run = 0;\n        for (var j = 0; j < n; j++) {\n            if (bloomDay[j] <= day) {\n                run++;\n                if (run === k) { made++; run = 0; }\n            } else run = 0;\n        }\n        return made >= m;\n    };\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (can(mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n};`,
        typescript: `function minDays(bloomDay: number[], m: number, k: number): number {\n    var n = bloomDay.length;\n    if (m * k > n) return -1;\n    var lo = bloomDay[0], hi = bloomDay[0], i: number;\n    for (i = 1; i < n; i++) {\n        if (bloomDay[i] < lo) lo = bloomDay[i];\n        if (bloomDay[i] > hi) hi = bloomDay[i];\n    }\n    var can = function(day: number): boolean {\n        var made = 0, run = 0;\n        for (var j = 0; j < n; j++) {\n            if (bloomDay[j] <= day) {\n                run++;\n                if (run === k) { made++; run = 0; }\n            } else run = 0;\n        }\n        return made >= m;\n    };\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (can(mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        java: `private static boolean canBouquet(int[] bloomDay, int m, int k, int day) {\n    int made = 0, run = 0;\n    for (int b : bloomDay) {\n        if (b <= day) {\n            run++;\n            if (run == k) {\n                made++;\n                run = 0;\n            }\n        } else {\n            run = 0;\n        }\n    }\n    return made >= m;\n}\n\npublic static int minDays(int[] bloomDay, int m, int k) {\n    int n = bloomDay.length;\n    if ((long) m * k > n) return -1;\n    int lo = bloomDay[0], hi = bloomDay[0];\n    for (int b : bloomDay) {\n        lo = Math.min(lo, b);\n        hi = Math.max(hi, b);\n    }\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canBouquet(bloomDay, m, k, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        cpp: `static bool canBouquet(vector<int>& bloomDay, int m, int k, int day) {\n    int made = 0, run = 0;\n    for (int b : bloomDay) {\n        if (b <= day) {\n            run++;\n            if (run == k) {\n                made++;\n                run = 0;\n            }\n        } else {\n            run = 0;\n        }\n    }\n    return made >= m;\n}\n\nint minDays(vector<int>& bloomDay, int m, int k) {\n    int n = (int) bloomDay.size();\n    if ((long long) m * k > n) return -1;\n    int lo = bloomDay[0], hi = bloomDay[0];\n    for (int b : bloomDay) {\n        lo = min(lo, b);\n        hi = max(hi, b);\n    }\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canBouquet(bloomDay, m, k, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        c: `static int canBouquet(int* bloomDay, int n, int m, int k, int day) {\n    int made = 0, run = 0;\n    for (int i = 0; i < n; i++) {\n        if (bloomDay[i] <= day) {\n            run++;\n            if (run == k) {\n                made++;\n                run = 0;\n            }\n        } else {\n            run = 0;\n        }\n    }\n    return made >= m;\n}\n\nint minDays(int* bloomDay, int bloomDaySize, int m, int k) {\n    int n = bloomDaySize;\n    if ((long long) m * k > (long long) n) return -1;\n    int lo = bloomDay[0], hi = bloomDay[0];\n    for (int i = 1; i < n; i++) {\n        if (bloomDay[i] < lo) lo = bloomDay[i];\n        if (bloomDay[i] > hi) hi = bloomDay[i];\n    }\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canBouquet(bloomDay, n, m, k, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        csharp: `private static bool CanBouquet(int[] bloomDay, int m, int k, int day)\n{\n    int made = 0, run = 0;\n    foreach (int b in bloomDay)\n    {\n        if (b <= day)\n        {\n            run++;\n            if (run == k)\n            {\n                made++;\n                run = 0;\n            }\n        }\n        else\n        {\n            run = 0;\n        }\n    }\n    return made >= m;\n}\n\npublic static int MinDays(int[] bloomDay, int m, int k)\n{\n    int n = bloomDay.Length;\n    if ((long) m * k > n) return -1;\n    int lo = bloomDay[0], hi = bloomDay[0];\n    foreach (int b in bloomDay)\n    {\n        if (b < lo) lo = b;\n        if (b > hi) hi = b;\n    }\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (CanBouquet(bloomDay, m, k, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        go: `func canBouquet(bloomDay []int, m int, k int, day int) bool {\n\tmade, run := 0, 0\n\tfor _, b := range bloomDay {\n\t\tif b <= day {\n\t\t\trun++\n\t\t\tif run == k {\n\t\t\t\tmade++\n\t\t\t\trun = 0\n\t\t\t}\n\t\t} else {\n\t\t\trun = 0\n\t\t}\n\t}\n\treturn made >= m\n}\n\nfunc minDays(bloomDay []int, m int, k int) int {\n\tn := len(bloomDay)\n\tif m*k > n {\n\t\treturn -1\n\t}\n\tlo, hi := bloomDay[0], bloomDay[0]\n\tfor _, b := range bloomDay {\n\t\tif b < lo {\n\t\t\tlo = b\n\t\t}\n\t\tif b > hi {\n\t\t\thi = b\n\t\t}\n\t}\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif canBouquet(bloomDay, m, k, mid) {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `private fun canBouquet(bloomDay: IntArray, m: Int, k: Int, day: Int): Boolean {\n    var made = 0\n    var run = 0\n    for (b in bloomDay) {\n        if (b <= day) {\n            run++\n            if (run == k) {\n                made++\n                run = 0\n            }\n        } else {\n            run = 0\n        }\n    }\n    return made >= m\n}\n\nfun minDays(bloomDay: IntArray, m: Int, k: Int): Int {\n    val n = bloomDay.size\n    if (m.toLong() * k > n) return -1\n    var lo = bloomDay[0]\n    var hi = bloomDay[0]\n    for (b in bloomDay) {\n        if (b < lo) lo = b\n        if (b > hi) hi = b\n    }\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (canBouquet(bloomDay, m, k, mid)) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
        swift: `func minDays(_ bloomDay: [Int], _ m: Int, _ k: Int) -> Int {\n    let n = bloomDay.count\n    if m * k > n { return -1 }\n    var lo = bloomDay[0]\n    var hi = bloomDay[0]\n    for b in bloomDay {\n        if b < lo { lo = b }\n        if b > hi { hi = b }\n    }\n    func can(_ day: Int) -> Bool {\n        var made = 0\n        var run = 0\n        for b in bloomDay {\n            if b <= day {\n                run += 1\n                if run == k {\n                    made += 1\n                    run = 0\n                }\n            } else {\n                run = 0\n            }\n        }\n        return made >= m\n    }\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if can(mid) { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
        rust: `fn minDays(bloomDay: Vec<i32>, m: i32, k: i32) -> i32 {\n    let n = bloomDay.len() as i64;\n    if m as i64 * k as i64 > n {\n        return -1;\n    }\n    let mut lo = bloomDay[0];\n    let mut hi = bloomDay[0];\n    for &b in bloomDay.iter() {\n        if b < lo {\n            lo = b;\n        }\n        if b > hi {\n            hi = b;\n        }\n    }\n    let can = |day: i32| -> bool {\n        let mut made = 0i32;\n        let mut run = 0i32;\n        for &b in bloomDay.iter() {\n            if b <= day {\n                run += 1;\n                if run == k {\n                    made += 1;\n                    run = 0;\n                }\n            } else {\n                run = 0;\n            }\n        }\n        made >= m\n    };\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if can(mid) {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo\n}`,
        php: `function minDays($bloomDay, $m, $k) {\n    $n = count($bloomDay);\n    if ($m * $k > $n) return -1;\n    $lo = min($bloomDay);\n    $hi = max($bloomDay);\n    $can = function($day) use ($bloomDay, $m, $k) {\n        $made = 0;\n        $run = 0;\n        foreach ($bloomDay as $b) {\n            if ($b <= $day) {\n                $run++;\n                if ($run === $k) { $made++; $run = 0; }\n            } else {\n                $run = 0;\n            }\n        }\n        return $made >= $m;\n    };\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($can($mid)) $hi = $mid; else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
        ruby: `def minDays(bloomDay, m, k)\n  n = bloomDay.length\n  return -1 if m * k > n\n  lo = bloomDay.min\n  hi = bloomDay.max\n  can = lambda do |day|\n    made = 0\n    run = 0\n    bloomDay.each do |b|\n      if b <= day\n        run += 1\n        if run == k\n          made += 1\n          run = 0\n        end\n      else\n        run = 0\n      end\n    end\n    made >= m\n  end\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if can.call(mid)\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Magnetic Force Between Two Balls (LC 1552) ──────────────────
  (() => {
    const ref = (position: number[], m: number) => {
      const p = position.slice().sort((a, b) => a - b);
      const can = (d: number) => {
        let cnt = 1, last = p[0];
        for (let i = 1; i < p.length; i++) {
          if (p[i] - last >= d) { cnt++; last = p[i]; }
        }
        return cnt >= m;
      };
      let lo = 1, hi = p[p.length - 1] - p[0];
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (can(mid)) lo = mid; else hi = mid - 1;
      }
      return lo;
    };
    return {
      slug: "magnetic-force-between-two-balls",
      title: "Magnetic Force Between Two Balls",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Sorting", "Greedy", "Amazon", "Google", "Uber"],
      signature: { funcName: "maxDistance", params: [{ name: "position", type: "int[]" as const }, { name: "m", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Baskets sit at the distinct coordinates in `position`. You place `m` balls into distinct baskets. The **magnetic force** between two balls is the distance between their baskets.\n\nMaximise the **minimum** magnetic force between any two balls, and return that value.",
        [
          { in: "position = [1,2,3,4,7], m = 3", out: "3", note: "Balls at 1, 4 and 7 are 3 apart at the closest." },
          { in: "position = [5,4,3,2,1,1000000000], m = 2", out: "999999999", note: "Put them at the extremes." },
          { in: "position = [1,2,3,4,5], m = 5", out: "1" },
        ],
        ["2 <= position.length <= 100000", "1 <= position[i] <= 1000000000", "All positions are distinct.", "2 <= m <= position.length"]),
      hints: [
        "If a minimum gap `d` is achievable, so is every smaller gap — the feasibility is monotone.",
        "Binary search `d`; for a candidate, greedily place a ball at the first basket and then at every basket at least `d` beyond the last one used.",
        "Sort the positions first so 'the next basket far enough away' is well defined.",
      ],
      editorial: explain({
        idea: "Binary search the answer. For a fixed minimum gap `d`, the greedy leftmost placement fits the maximum possible number of balls, so it decides feasibility exactly.",
        steps: [
          "Sort the positions.",
          "`can(d)`: start at the leftmost basket, then walk right and take a basket whenever it is at least `d` beyond the last taken one; feasible when at least `m` balls fit.",
          "Binary search the largest feasible `d`, with the upper-biased midpoint so the loop terminates.",
        ],
        why: "The greedy is optimal because placing a ball as early as possible leaves the most room for the rest — an exchange argument moves any optimal solution's first ball to the leftmost basket without loss. Raising `d` can only reduce how many balls fit, so `can` is monotone decreasing and the boundary is what binary search finds.",
        time: "O(n log n + n log P) where P is the coordinate range",
        space: "O(n)",
        pitfalls: [
          "The upper-biased midpoint `ceil((lo + hi) / 2)` is required for a 'largest satisfying value' search; the plain midpoint loops forever.",
          "Comparing with `>` instead of `>=` inside `can` rejects placements exactly `d` apart.",
          "The positions arrive unsorted.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,7]\n3", expectedOutput: "3" },
        { input: "[5,4,3,2,1,1000000000]\n2", expectedOutput: "999999999" },
        { input: "[1,2,3,4,5]\n5", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const span = rng() < 0.6 ? 40 : 1000000000;
        const n = ri(rng, 2, 25);
        const seen: Record<number, boolean> = {};
        const position: number[] = [];
        let guard = 0;
        while (position.length < n && guard < 400) {
          guard++;
          const v = ri(rng, 1, span);
          if (!seen[v]) { seen[v] = true; position.push(v); }
        }
        const m = ri(rng, 2, position.length);
        return { input: `${fmtIntArr(position)}\n${m}`, expectedOutput: String(ref(position, m)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxDistance(position: List[int], m: int) -> int:\n    p = sorted(position)\n\n    def can(d: int) -> bool:\n        cnt, last = 1, p[0]\n        for x in p[1:]:\n            if x - last >= d:\n                cnt += 1\n                last = x\n        return cnt >= m\n\n    lo, hi = 1, p[-1] - p[0]\n    while lo < hi:\n        mid = (lo + hi + 1) // 2\n        if can(mid):\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo`,
        javascript: `var maxDistance = function(position, m) {\n    var p = position.slice().sort(function(a, b) { return a - b; });\n    var can = function(d) {\n        var cnt = 1, last = p[0];\n        for (var i = 1; i < p.length; i++) {\n            if (p[i] - last >= d) { cnt++; last = p[i]; }\n        }\n        return cnt >= m;\n    };\n    var lo = 1, hi = p[p.length - 1] - p[0];\n    while (lo < hi) {\n        var mid = Math.ceil((lo + hi) / 2);\n        if (can(mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n};`,
        typescript: `function maxDistance(position: number[], m: number): number {\n    var p = position.slice().sort(function(a, b) { return a - b; });\n    var can = function(d: number): boolean {\n        var cnt = 1, last = p[0];\n        for (var i = 1; i < p.length; i++) {\n            if (p[i] - last >= d) { cnt++; last = p[i]; }\n        }\n        return cnt >= m;\n    };\n    var lo = 1, hi = p[p.length - 1] - p[0];\n    while (lo < hi) {\n        var mid = Math.ceil((lo + hi) / 2);\n        if (can(mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        java: `private static boolean canPlaceBalls(int[] p, int m, int d) {\n    int cnt = 1, last = p[0];\n    for (int i = 1; i < p.length; i++) {\n        if (p[i] - last >= d) {\n            cnt++;\n            last = p[i];\n        }\n    }\n    return cnt >= m;\n}\n\npublic static int maxDistance(int[] position, int m) {\n    int[] p = position.clone();\n    Arrays.sort(p);\n    int lo = 1, hi = p[p.length - 1] - p[0];\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (canPlaceBalls(p, m, mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        cpp: `static bool canPlaceBalls(vector<int>& p, int m, int d) {\n    int cnt = 1, last = p[0];\n    for (int i = 1; i < (int) p.size(); i++) {\n        if (p[i] - last >= d) {\n            cnt++;\n            last = p[i];\n        }\n    }\n    return cnt >= m;\n}\n\nint maxDistance(vector<int>& position, int m) {\n    vector<int> p = position;\n    sort(p.begin(), p.end());\n    int lo = 1, hi = p.back() - p.front();\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (canPlaceBalls(p, m, mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        c: `static int cmpForceAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nstatic int canPlaceBalls(int* p, int n, int m, int d) {\n    int cnt = 1, last = p[0];\n    for (int i = 1; i < n; i++) {\n        if (p[i] - last >= d) {\n            cnt++;\n            last = p[i];\n        }\n    }\n    return cnt >= m;\n}\n\nint maxDistance(int* position, int positionSize, int m) {\n    int* p = (int*) malloc((size_t) positionSize * sizeof(int));\n    for (int i = 0; i < positionSize; i++) p[i] = position[i];\n    qsort(p, (size_t) positionSize, sizeof(int), cmpForceAsc);\n    int lo = 1, hi = p[positionSize - 1] - p[0];\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (canPlaceBalls(p, positionSize, m, mid)) lo = mid; else hi = mid - 1;\n    }\n    free(p);\n    return lo;\n}`,
        csharp: `private static bool CanPlaceBalls(int[] p, int m, int d)\n{\n    int cnt = 1, last = p[0];\n    for (int i = 1; i < p.Length; i++)\n    {\n        if (p[i] - last >= d)\n        {\n            cnt++;\n            last = p[i];\n        }\n    }\n    return cnt >= m;\n}\n\npublic static int MaxDistance(int[] position, int m)\n{\n    int[] p = (int[]) position.Clone();\n    Array.Sort(p);\n    int lo = 1, hi = p[p.Length - 1] - p[0];\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (CanPlaceBalls(p, m, mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        go: `func canPlaceBalls(p []int, m int, d int) bool {\n\tcnt, last := 1, p[0]\n\tfor i := 1; i < len(p); i++ {\n\t\tif p[i]-last >= d {\n\t\t\tcnt++\n\t\t\tlast = p[i]\n\t\t}\n\t}\n\treturn cnt >= m\n}\n\nfunc maxDistance(position []int, m int) int {\n\tp := append([]int{}, position...)\n\tsort.Ints(p)\n\tlo, hi := 1, p[len(p)-1]-p[0]\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo+1)/2\n\t\tif canPlaceBalls(p, m, mid) {\n\t\t\tlo = mid\n\t\t} else {\n\t\t\thi = mid - 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `private fun canPlaceBalls(p: IntArray, m: Int, d: Int): Boolean {\n    var cnt = 1\n    var last = p[0]\n    for (i in 1 until p.size) {\n        if (p[i] - last >= d) {\n            cnt++\n            last = p[i]\n        }\n    }\n    return cnt >= m\n}\n\nfun maxDistance(position: IntArray, m: Int): Int {\n    val p = position.sortedArray()\n    var lo = 1\n    var hi = p[p.size - 1] - p[0]\n    while (lo < hi) {\n        val mid = lo + (hi - lo + 1) / 2\n        if (canPlaceBalls(p, m, mid)) lo = mid else hi = mid - 1\n    }\n    return lo\n}`,
        swift: `func maxDistance(_ position: [Int], _ m: Int) -> Int {\n    let p = position.sorted()\n    func can(_ d: Int) -> Bool {\n        var cnt = 1\n        var last = p[0]\n        for i in 1..<p.count {\n            if p[i] - last >= d {\n                cnt += 1\n                last = p[i]\n            }\n        }\n        return cnt >= m\n    }\n    var lo = 1\n    var hi = p[p.count - 1] - p[0]\n    while lo < hi {\n        let mid = lo + (hi - lo + 1) / 2\n        if can(mid) { lo = mid } else { hi = mid - 1 }\n    }\n    return lo\n}`,
        rust: `fn maxDistance(position: Vec<i32>, m: i32) -> i32 {\n    let mut p = position.clone();\n    p.sort();\n    let can = |d: i32| -> bool {\n        let mut cnt = 1i32;\n        let mut last = p[0];\n        for i in 1..p.len() {\n            if p[i] - last >= d {\n                cnt += 1;\n                last = p[i];\n            }\n        }\n        cnt >= m\n    };\n    let mut lo = 1i32;\n    let mut hi = p[p.len() - 1] - p[0];\n    while lo < hi {\n        let mid = lo + (hi - lo + 1) / 2;\n        if can(mid) {\n            lo = mid;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    lo\n}`,
        php: `function maxDistance($position, $m) {\n    $p = $position;\n    sort($p);\n    $can = function($d) use ($p, $m) {\n        $cnt = 1;\n        $last = $p[0];\n        for ($i = 1; $i < count($p); $i++) {\n            if ($p[$i] - $last >= $d) { $cnt++; $last = $p[$i]; }\n        }\n        return $cnt >= $m;\n    };\n    $lo = 1;\n    $hi = $p[count($p) - 1] - $p[0];\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo + 1, 2);\n        if ($can($mid)) $lo = $mid; else $hi = $mid - 1;\n    }\n    return $lo;\n}`,
        ruby: `def maxDistance(position, m)\n  p = position.sort\n  can = lambda do |d|\n    cnt = 1\n    last = p[0]\n    (1...p.length).each do |i|\n      if p[i] - last >= d\n        cnt += 1\n        last = p[i]\n      end\n    end\n    cnt >= m\n  end\n  lo = 1\n  hi = p[-1] - p[0]\n  while lo < hi\n    mid = lo + (hi - lo + 1) / 2\n    if can.call(mid)\n      lo = mid\n    else\n      hi = mid - 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Minimum Limit of Balls in a Bag (LC 1760) ───────────────────
  (() => {
    const ref = (nums: number[], maxOperations: number) => {
      let lo = 1, hi = nums[0];
      for (let i = 1; i < nums.length; i++) if (nums[i] > hi) hi = nums[i];
      const can = (limit: number) => {
        let ops = 0;
        for (let i = 0; i < nums.length; i++) ops += Math.floor((nums[i] - 1) / limit);
        return ops <= maxOperations;
      };
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (can(mid)) hi = mid; else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "minimum-limit-of-balls-in-a-bag",
      title: "Minimum Limit of Balls in a Bag",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Amazon", "Google", "Atlassian"],
      signature: { funcName: "minimumSize", params: [{ name: "nums", type: "int[]" as const }, { name: "maxOperations", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Bag `i` holds `nums[i]` balls. One operation takes a bag and splits it into two bags with a positive number of balls each.\n\nThe **penalty** is the largest number of balls in any bag. Return the minimum possible penalty after at most `maxOperations` operations.",
        [
          { in: "nums = [9], maxOperations = 2", out: "3", note: "9 → 6 and 3 → 3, 3 and 3." },
          { in: "nums = [2,4,8,2], maxOperations = 4", out: "2" },
          { in: "nums = [7,17], maxOperations = 2", out: "7" },
        ],
        ["1 <= nums.length <= 100000", "1 <= maxOperations, nums[i] <= 1000000000"]),
      hints: [
        "If a penalty `L` is achievable, so is every larger penalty — the feasibility is monotone.",
        "Splitting a bag of `x` balls down to pieces of at most `L` each takes `ceil(x / L) - 1` operations.",
        "Binary search the smallest `L` whose total cost fits the budget.",
      ],
      editorial: explain({
        idea: "Binary search the penalty. For a target `L`, each bag's cost is independent: a bag of `x` balls needs `ceil(x / L)` pieces, and every split adds one piece, so it costs `ceil(x / L) - 1` operations.",
        steps: [
          "Search `L` over `[1, max(nums)]`.",
          "`can(L)`: sum `floor((x - 1) / L)` over the bags, which equals `ceil(x / L) - 1` for positive `x`.",
          "Return the smallest `L` whose total is at most `maxOperations`.",
        ],
        why: "Splitting is unconstrained in how it divides a bag, so `ceil(x / L)` equal-ish pieces is always reachable and is the fewest pieces with every piece at most `L`. A tree with `p` leaves takes `p - 1` splits, giving the cost formula. Raising `L` weakly lowers every bag's cost, so the total is non-increasing — the monotonicity the search needs.",
        time: "O(n log M) where M is the largest bag",
        space: "O(1)",
        pitfalls: [
          "`ceil(x / L)` computed in floating point rounds wrongly for large values — use `floor((x - 1) / L)` instead.",
          "`L` starts at 1, not 0 — a bag must keep a positive count.",
          "The total operation count reaches `10^5 · 10^9`, so accumulate in 64-bit or short-circuit once the budget is exceeded.",
        ],
      }),
      examples: [
        { input: "[9]\n2", expectedOutput: "3" },
        { input: "[2,4,8,2]\n4", expectedOutput: "2" },
        { input: "[7,17]\n2", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 40 : 1000000000;
        const nums = Array.from({ length: ri(rng, 1, 25) }, () => ri(rng, 1, hi));
        const maxOperations = rng() < 0.7 ? ri(rng, 1, 30) : ri(rng, 1, 1000000000);
        return { input: `${fmtIntArr(nums)}\n${maxOperations}`, expectedOutput: String(ref(nums, maxOperations)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumSize(nums: List[int], maxOperations: int) -> int:\n    lo, hi = 1, max(nums)\n\n    def can(limit: int) -> bool:\n        ops = 0\n        for x in nums:\n            ops += (x - 1) // limit\n            if ops > maxOperations:\n                return False\n        return True\n\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if can(mid):\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var minimumSize = function(nums, maxOperations) {\n    var lo = 1, hi = nums[0], i;\n    for (i = 1; i < nums.length; i++) if (nums[i] > hi) hi = nums[i];\n    var can = function(limit) {\n        var ops = 0;\n        for (var j = 0; j < nums.length; j++) {\n            ops += Math.floor((nums[j] - 1) / limit);\n            if (ops > maxOperations) return false;\n        }\n        return true;\n    };\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (can(mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n};`,
        typescript: `function minimumSize(nums: number[], maxOperations: number): number {\n    var lo = 1, hi = nums[0], i: number;\n    for (i = 1; i < nums.length; i++) if (nums[i] > hi) hi = nums[i];\n    var can = function(limit: number): boolean {\n        var ops = 0;\n        for (var j = 0; j < nums.length; j++) {\n            ops += Math.floor((nums[j] - 1) / limit);\n            if (ops > maxOperations) return false;\n        }\n        return true;\n    };\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (can(mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        java: `private static boolean canSplit(int[] nums, int maxOperations, int limit) {\n    long ops = 0;\n    for (int x : nums) {\n        ops += (x - 1) / limit;\n        if (ops > maxOperations) return false;\n    }\n    return true;\n}\n\npublic static int minimumSize(int[] nums, int maxOperations) {\n    int lo = 1, hi = 1;\n    for (int x : nums) hi = Math.max(hi, x);\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canSplit(nums, maxOperations, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        cpp: `static bool canSplit(vector<int>& nums, int maxOperations, int limit) {\n    long long ops = 0;\n    for (int x : nums) {\n        ops += (x - 1) / limit;\n        if (ops > maxOperations) return false;\n    }\n    return true;\n}\n\nint minimumSize(vector<int>& nums, int maxOperations) {\n    int lo = 1, hi = 1;\n    for (int x : nums) hi = max(hi, x);\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canSplit(nums, maxOperations, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        c: `static int canSplit(int* nums, int n, int maxOperations, int limit) {\n    long long ops = 0;\n    for (int i = 0; i < n; i++) {\n        ops += (nums[i] - 1) / limit;\n        if (ops > (long long) maxOperations) return 0;\n    }\n    return 1;\n}\n\nint minimumSize(int* nums, int numsSize, int maxOperations) {\n    int lo = 1, hi = 1;\n    for (int i = 0; i < numsSize; i++) if (nums[i] > hi) hi = nums[i];\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canSplit(nums, numsSize, maxOperations, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        csharp: `private static bool CanSplit(int[] nums, int maxOperations, int limit)\n{\n    long ops = 0;\n    foreach (int x in nums)\n    {\n        ops += (x - 1) / limit;\n        if (ops > maxOperations) return false;\n    }\n    return true;\n}\n\npublic static int MinimumSize(int[] nums, int maxOperations)\n{\n    int lo = 1, hi = 1;\n    foreach (int x in nums) if (x > hi) hi = x;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (CanSplit(nums, maxOperations, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        go: `func canSplit(nums []int, maxOperations int, limit int) bool {\n\tops := 0\n\tfor _, x := range nums {\n\t\tops += (x - 1) / limit\n\t\tif ops > maxOperations {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}\n\nfunc minimumSize(nums []int, maxOperations int) int {\n\tlo, hi := 1, 1\n\tfor _, x := range nums {\n\t\tif x > hi {\n\t\t\thi = x\n\t\t}\n\t}\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif canSplit(nums, maxOperations, mid) {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `private fun canSplit(nums: IntArray, maxOperations: Int, limit: Int): Boolean {\n    var ops = 0L\n    for (x in nums) {\n        ops += ((x - 1) / limit).toLong()\n        if (ops > maxOperations) return false\n    }\n    return true\n}\n\nfun minimumSize(nums: IntArray, maxOperations: Int): Int {\n    var lo = 1\n    var hi = 1\n    for (x in nums) if (x > hi) hi = x\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (canSplit(nums, maxOperations, mid)) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
        swift: `func minimumSize(_ nums: [Int], _ maxOperations: Int) -> Int {\n    var lo = 1\n    var hi = 1\n    for x in nums where x > hi { hi = x }\n    func can(_ limit: Int) -> Bool {\n        var ops = 0\n        for x in nums {\n            ops += (x - 1) / limit\n            if ops > maxOperations { return false }\n        }\n        return true\n    }\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if can(mid) { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
        rust: `fn minimumSize(nums: Vec<i32>, maxOperations: i32) -> i32 {\n    let mut lo = 1i32;\n    let mut hi = 1i32;\n    for &x in nums.iter() {\n        if x > hi {\n            hi = x;\n        }\n    }\n    let can = |limit: i32| -> bool {\n        let mut ops: i64 = 0;\n        for &x in nums.iter() {\n            ops += ((x - 1) / limit) as i64;\n            if ops > maxOperations as i64 {\n                return false;\n            }\n        }\n        true\n    };\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if can(mid) {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo\n}`,
        php: `function minimumSize($nums, $maxOperations) {\n    $lo = 1;\n    $hi = max($nums);\n    $can = function($limit) use ($nums, $maxOperations) {\n        $ops = 0;\n        foreach ($nums as $x) {\n            $ops += intdiv($x - 1, $limit);\n            if ($ops > $maxOperations) return false;\n        }\n        return true;\n    };\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($can($mid)) $hi = $mid; else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
        ruby: `def minimumSize(nums, maxOperations)\n  lo = 1\n  hi = nums.max\n  can = lambda do |limit|\n    ops = 0\n    nums.each do |x|\n      ops += (x - 1) / limit\n      return false if ops > maxOperations\n    end\n    true\n  end\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if can.call(mid)\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Find the Student That Will Replace the Chalk (LC 1894) ──────
  (() => {
    const ref = (chalk: number[], k: number) => {
      const n = chalk.length;
      const pre = new Array(n).fill(0);
      let total = 0;
      for (let i = 0; i < n; i++) { total += chalk[i]; pre[i] = total; }
      const rem = k % total;
      let lo = 0, hi = n - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (pre[mid] > rem) hi = mid; else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "find-the-student-that-will-replace-the-chalk",
      title: "Find the Student That Will Replace the Chalk",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Prefix Sum", "Simulation", "Amazon", "Google", "Paytm"],
      signature: { funcName: "chalkReplacer", params: [{ name: "chalk", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Students sit in a row and are asked questions in order `0, 1, …, n-1, 0, 1, …` forever. Student `i` uses `chalk[i]` pieces of chalk per question.\n\nThe class starts with `k` pieces. Return the index of the student who is asked a question when there is not enough chalk left for them.",
        [
          { in: "chalk = [5,1,5], k = 22", out: "0", note: "Two full rounds use 22, so student 0 is short on the next question." },
          { in: "chalk = [3,4,1,2], k = 25", out: "1", note: "Two full rounds use 20, leaving 5 — student 0 takes 3, then student 1 needs 4." },
          { in: "chalk = [1], k = 1000000000", out: "0" },
        ],
        ["1 <= chalk.length <= 100000", "1 <= chalk[i] <= 100000", "1 <= k <= 1000000000"]),
      hints: [
        "Full rounds are wasted simulation — reduce `k` modulo the round total first.",
        "After that reduction, the answer is the first student whose prefix sum exceeds the remainder.",
        "Binary search the prefix sums, or scan them linearly.",
      ],
      editorial: explain({
        idea: "The chalk use is periodic, so all but the last partial round can be removed with one modulo. What remains is a prefix-sum boundary: the first student whose cumulative use exceeds the leftover chalk is the one who runs out.",
        steps: [
          "Sum the array to get the round total and build prefix sums.",
          "Reduce `k` to `k % total` — the leftover at the start of the final partial round.",
          "Binary search the first index `i` with `pre[i] > rem`.",
        ],
        why: "After the modulo, `rem < total`, so some prefix must exceed it and the boundary exists. Student `i` can answer exactly when `pre[i] <= rem` — the chalk consumed up to and including them still fits — so the first index failing that test is the one who must replace the chalk.",
        time: "O(n) to build the prefix sums, O(log n) to locate the student",
        space: "O(n), or O(1) by scanning instead",
        pitfalls: [
          "The round total reaches `10^5 · 10^5 = 10^10`, so it needs 64-bit even though `k` fits `int`.",
          "Simulating question by question is `O(k)` and times out at `k = 10^9`.",
          "The comparison is `pre[i] > rem`, strictly — a student who uses exactly the remaining chalk does answer.",
        ],
      }),
      examples: [
        { input: "[5,1,5]\n22", expectedOutput: "0" },
        { input: "[3,4,1,2]\n25", expectedOutput: "1" },
        { input: "[1]\n1000000000", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const chalk = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, 100000));
        const k = rng() < 0.5 ? ri(rng, 1, 5000) : ri(rng, 1, 1000000000);
        return { input: `${fmtIntArr(chalk)}\n${k}`, expectedOutput: String(ref(chalk, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef chalkReplacer(chalk: List[int], k: int) -> int:\n    n = len(chalk)\n    pre = []\n    total = 0\n    for c in chalk:\n        total += c\n        pre.append(total)\n    rem = k % total\n    lo, hi = 0, n - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if pre[mid] > rem:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var chalkReplacer = function(chalk, k) {\n    var n = chalk.length;\n    var pre = [], total = 0, i;\n    for (i = 0; i < n; i++) { total += chalk[i]; pre.push(total); }\n    var rem = k % total;\n    var lo = 0, hi = n - 1;\n    while (lo < hi) {\n        var mid = (lo + hi) >> 1;\n        if (pre[mid] > rem) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n};`,
        typescript: `function chalkReplacer(chalk: number[], k: number): number {\n    var n = chalk.length;\n    var pre: number[] = [], total = 0, i: number;\n    for (i = 0; i < n; i++) { total += chalk[i]; pre.push(total); }\n    var rem = k % total;\n    var lo = 0, hi = n - 1;\n    while (lo < hi) {\n        var mid = (lo + hi) >> 1;\n        if (pre[mid] > rem) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        java: `public static int chalkReplacer(int[] chalk, int k) {\n    int n = chalk.length;\n    long[] pre = new long[n];\n    long total = 0;\n    for (int i = 0; i < n; i++) {\n        total += chalk[i];\n        pre[i] = total;\n    }\n    long rem = k % total;\n    int lo = 0, hi = n - 1;\n    while (lo < hi) {\n        int mid = (lo + hi) >>> 1;\n        if (pre[mid] > rem) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        cpp: `int chalkReplacer(vector<int>& chalk, int k) {\n    int n = (int) chalk.size();\n    vector<long long> pre(n);\n    long long total = 0;\n    for (int i = 0; i < n; i++) {\n        total += chalk[i];\n        pre[i] = total;\n    }\n    long long rem = k % total;\n    int lo = 0, hi = n - 1;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (pre[mid] > rem) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        c: `int chalkReplacer(int* chalk, int chalkSize, int k) {\n    int n = chalkSize;\n    long long* pre = (long long*) malloc((size_t) n * sizeof(long long));\n    long long total = 0;\n    for (int i = 0; i < n; i++) {\n        total += chalk[i];\n        pre[i] = total;\n    }\n    long long rem = (long long) k % total;\n    int lo = 0, hi = n - 1;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (pre[mid] > rem) hi = mid; else lo = mid + 1;\n    }\n    free(pre);\n    return lo;\n}`,
        csharp: `public static int ChalkReplacer(int[] chalk, int k)\n{\n    int n = chalk.Length;\n    long[] pre = new long[n];\n    long total = 0;\n    for (int i = 0; i < n; i++)\n    {\n        total += chalk[i];\n        pre[i] = total;\n    }\n    long rem = k % total;\n    int lo = 0, hi = n - 1;\n    while (lo < hi)\n    {\n        int mid = (lo + hi) / 2;\n        if (pre[mid] > rem) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        go: `func chalkReplacer(chalk []int, k int) int {\n\tn := len(chalk)\n\tpre := make([]int64, n)\n\tvar total int64 = 0\n\tfor i := 0; i < n; i++ {\n\t\ttotal += int64(chalk[i])\n\t\tpre[i] = total\n\t}\n\trem := int64(k) % total\n\tlo, hi := 0, n-1\n\tfor lo < hi {\n\t\tmid := (lo + hi) / 2\n\t\tif pre[mid] > rem {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `fun chalkReplacer(chalk: IntArray, k: Int): Int {\n    val n = chalk.size\n    val pre = LongArray(n)\n    var total = 0L\n    for (i in 0 until n) {\n        total += chalk[i]\n        pre[i] = total\n    }\n    val rem = k % total\n    var lo = 0\n    var hi = n - 1\n    while (lo < hi) {\n        val mid = (lo + hi) / 2\n        if (pre[mid] > rem) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
        swift: `func chalkReplacer(_ chalk: [Int], _ k: Int) -> Int {\n    let n = chalk.count\n    var pre = [Int](repeating: 0, count: n)\n    var total = 0\n    for i in 0..<n {\n        total += chalk[i]\n        pre[i] = total\n    }\n    let rem = k % total\n    var lo = 0\n    var hi = n - 1\n    while lo < hi {\n        let mid = (lo + hi) / 2\n        if pre[mid] > rem { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
        rust: `fn chalkReplacer(chalk: Vec<i32>, k: i32) -> i32 {\n    let n = chalk.len();\n    let mut pre = vec![0i64; n];\n    let mut total: i64 = 0;\n    for i in 0..n {\n        total += chalk[i] as i64;\n        pre[i] = total;\n    }\n    let rem = k as i64 % total;\n    let mut lo = 0usize;\n    let mut hi = n - 1;\n    while lo < hi {\n        let mid = (lo + hi) / 2;\n        if pre[mid] > rem {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo as i32\n}`,
        php: `function chalkReplacer($chalk, $k) {\n    $n = count($chalk);\n    $pre = [];\n    $total = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $total += $chalk[$i];\n        $pre[] = $total;\n    }\n    $rem = $k % $total;\n    $lo = 0;\n    $hi = $n - 1;\n    while ($lo < $hi) {\n        $mid = intdiv($lo + $hi, 2);\n        if ($pre[$mid] > $rem) $hi = $mid; else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
        ruby: `def chalkReplacer(chalk, k)\n  n = chalk.length\n  pre = []\n  total = 0\n  chalk.each do |c|\n    total += c\n    pre << total\n  end\n  rem = k % total\n  lo = 0\n  hi = n - 1\n  while lo < hi\n    mid = (lo + hi) / 2\n    if pre[mid] > rem\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Maximum Value at a Given Index in a Bounded Array (LC 1802) ──
  (() => {
    const ref = (n: number, index: number, maxSum: number) => {
      const side = (peak: number, len: number) => {
        if (len <= 0) return 0;
        if (peak - 1 >= len) return ((peak - 1) + (peak - len)) * len / 2;
        const dec = peak - 1;
        return (dec * (dec + 1)) / 2 + (len - dec);
      };
      const can = (peak: number) => peak + side(peak, index) + side(peak, n - 1 - index) <= maxSum;
      let lo = 1, hi = maxSum;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (can(mid)) lo = mid; else hi = mid - 1;
      }
      return lo;
    };
    return {
      slug: "maximum-value-at-a-given-index-in-a-bounded-array",
      title: "Maximum Value at a Given Index in a Bounded Array",
      difficulty: "MEDIUM" as const,
      tags: ["Binary Search", "Greedy", "Math", "Amazon", "Google", "Rubrik"],
      signature: { funcName: "maxValue", params: [{ name: "n", type: "int" as const }, { name: "index", type: "int" as const }, { name: "maxSum", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Build an array `nums` of length `n` where every element is a **positive** integer, adjacent elements differ by at most 1 (`|nums[i] - nums[i+1]| <= 1`), the total is at most `maxSum`, and `nums[index]` is as large as possible.\n\nReturn that maximum value of `nums[index]`.",
        [
          { in: "n = 4, index = 2, maxSum = 6", out: "2", note: "[1,1,2,1] totals 5 and [1,2,2,1] totals 6." },
          { in: "n = 6, index = 1, maxSum = 10", out: "3", note: "[2,3,2,1,1,1] totals 10." },
          { in: "n = 1, index = 0, maxSum = 24", out: "24" },
        ],
        ["1 <= n <= 100000", "0 <= index < n", "n <= maxSum <= 1000000000"]),
      hints: [
        "If a peak value is achievable, so is every smaller one — the feasibility is monotone.",
        "For a fixed peak, the cheapest array steps down by 1 on each side and then flattens at 1.",
        "The cost of each side is an arithmetic series, possibly with a tail of 1s.",
      ],
      editorial: explain({
        idea: "Binary search the peak. For a fixed peak, the cheapest legal array descends by exactly 1 per step away from `index` until it reaches 1, then stays at 1 — any slower descent costs more, and a faster one breaks the adjacency rule.",
        steps: [
          "`side(peak, len)`: the sum of `len` positions descending from `peak - 1`. If `peak - 1 >= len` it is the arithmetic series `(peak-1) + … + (peak-len)`; otherwise it is `1 + … + (peak-1)` plus `len - (peak-1)` ones.",
          "`can(peak)`: `peak + side(peak, index) + side(peak, n-1-index) <= maxSum`.",
          "Binary search the largest feasible peak with the upper-biased midpoint.",
        ],
        why: "Every element must be at least 1 and adjacent elements differ by at most 1, so an element `d` steps from the peak is at least `max(1, peak - d)`. The stepped-then-flat array attains that lower bound everywhere, so it is the minimum-cost array with that peak — making `can` exact. Raising the peak raises every term weakly, so feasibility is monotone.",
        time: "O(log maxSum)",
        space: "O(1)",
        pitfalls: [
          "The side sums reach about `10^9 · 10^5 = 10^14`, so they need 64-bit arithmetic.",
          "The plateau of 1s is easy to forget, which overcharges short arrays with tall peaks.",
          "`index` counts elements strictly to its left, and `n - 1 - index` those to its right — the peak itself is counted once.",
        ],
      }),
      examples: [
        { input: "4\n2\n6", expectedOutput: "2" },
        { input: "6\n1\n10", expectedOutput: "3" },
        { input: "1\n0\n24", expectedOutput: "24" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.6 ? ri(rng, 1, 40) : ri(rng, 1, 100000);
        const index = ri(rng, 0, n - 1);
        const maxSum = rng() < 0.6 ? ri(rng, n, n + 200) : ri(rng, n, 1000000000);
        return { input: `${n}\n${index}\n${maxSum}`, expectedOutput: String(ref(n, index, maxSum)) };
      },
      solutions: {
        python: `def maxValue(n: int, index: int, maxSum: int) -> int:\n    def side(peak: int, length: int) -> int:\n        if length <= 0:\n            return 0\n        if peak - 1 >= length:\n            return ((peak - 1) + (peak - length)) * length // 2\n        dec = peak - 1\n        return dec * (dec + 1) // 2 + (length - dec)\n\n    def can(peak: int) -> bool:\n        return peak + side(peak, index) + side(peak, n - 1 - index) <= maxSum\n\n    lo, hi = 1, maxSum\n    while lo < hi:\n        mid = (lo + hi + 1) // 2\n        if can(mid):\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo`,
        javascript: `var maxValue = function(n, index, maxSum) {\n    var side = function(peak, len) {\n        if (len <= 0) return 0;\n        if (peak - 1 >= len) return ((peak - 1) + (peak - len)) * len / 2;\n        var dec = peak - 1;\n        return dec * (dec + 1) / 2 + (len - dec);\n    };\n    var can = function(peak) {\n        return peak + side(peak, index) + side(peak, n - 1 - index) <= maxSum;\n    };\n    var lo = 1, hi = maxSum;\n    while (lo < hi) {\n        var mid = Math.ceil((lo + hi) / 2);\n        if (can(mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n};`,
        typescript: `function maxValue(n: number, index: number, maxSum: number): number {\n    var side = function(peak: number, len: number): number {\n        if (len <= 0) return 0;\n        if (peak - 1 >= len) return ((peak - 1) + (peak - len)) * len / 2;\n        var dec = peak - 1;\n        return dec * (dec + 1) / 2 + (len - dec);\n    };\n    var can = function(peak: number): boolean {\n        return peak + side(peak, index) + side(peak, n - 1 - index) <= maxSum;\n    };\n    var lo = 1, hi = maxSum;\n    while (lo < hi) {\n        var mid = Math.ceil((lo + hi) / 2);\n        if (can(mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        java: `private static long boundedSide(long peak, long len) {\n    if (len <= 0) return 0;\n    if (peak - 1 >= len) return ((peak - 1) + (peak - len)) * len / 2;\n    long dec = peak - 1;\n    return dec * (dec + 1) / 2 + (len - dec);\n}\n\npublic static int maxValue(int n, int index, int maxSum) {\n    int lo = 1, hi = maxSum;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        long total = mid + boundedSide(mid, index) + boundedSide(mid, (long) n - 1 - index);\n        if (total <= maxSum) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        cpp: `static long long boundedSide(long long peak, long long len) {\n    if (len <= 0) return 0;\n    if (peak - 1 >= len) return ((peak - 1) + (peak - len)) * len / 2;\n    long long dec = peak - 1;\n    return dec * (dec + 1) / 2 + (len - dec);\n}\n\nint maxValue(int n, int index, int maxSum) {\n    int lo = 1, hi = maxSum;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        long long total = mid + boundedSide(mid, index) + boundedSide(mid, (long long) n - 1 - index);\n        if (total <= maxSum) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        c: `static long long boundedSide(long long peak, long long len) {\n    if (len <= 0) return 0;\n    if (peak - 1 >= len) return ((peak - 1) + (peak - len)) * len / 2;\n    long long dec = peak - 1;\n    return dec * (dec + 1) / 2 + (len - dec);\n}\n\nint maxValue(int n, int index, int maxSum) {\n    int lo = 1, hi = maxSum;\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        long long total = (long long) mid + boundedSide(mid, index) + boundedSide(mid, (long long) n - 1 - index);\n        if (total <= (long long) maxSum) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        csharp: `private static long BoundedSide(long peak, long len)\n{\n    if (len <= 0) return 0;\n    if (peak - 1 >= len) return ((peak - 1) + (peak - len)) * len / 2;\n    long dec = peak - 1;\n    return dec * (dec + 1) / 2 + (len - dec);\n}\n\npublic static int MaxValue(int n, int index, int maxSum)\n{\n    int lo = 1, hi = maxSum;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo + 1) / 2;\n        long total = mid + BoundedSide(mid, index) + BoundedSide(mid, (long) n - 1 - index);\n        if (total <= maxSum) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        go: `func boundedSide(peak int64, length int64) int64 {\n\tif length <= 0 {\n\t\treturn 0\n\t}\n\tif peak-1 >= length {\n\t\treturn ((peak - 1) + (peak - length)) * length / 2\n\t}\n\tdec := peak - 1\n\treturn dec*(dec+1)/2 + (length - dec)\n}\n\nfunc maxValue(n int, index int, maxSum int) int {\n\tlo, hi := 1, maxSum\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo+1)/2\n\t\ttotal := int64(mid) + boundedSide(int64(mid), int64(index)) + boundedSide(int64(mid), int64(n-1-index))\n\t\tif total <= int64(maxSum) {\n\t\t\tlo = mid\n\t\t} else {\n\t\t\thi = mid - 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `private fun boundedSide(peak: Long, len: Long): Long {\n    if (len <= 0) return 0\n    if (peak - 1 >= len) return ((peak - 1) + (peak - len)) * len / 2\n    val dec = peak - 1\n    return dec * (dec + 1) / 2 + (len - dec)\n}\n\nfun maxValue(n: Int, index: Int, maxSum: Int): Int {\n    var lo = 1\n    var hi = maxSum\n    while (lo < hi) {\n        val mid = lo + (hi - lo + 1) / 2\n        val total = mid.toLong() + boundedSide(mid.toLong(), index.toLong()) +\n            boundedSide(mid.toLong(), (n - 1 - index).toLong())\n        if (total <= maxSum) lo = mid else hi = mid - 1\n    }\n    return lo\n}`,
        swift: `func maxValue(_ n: Int, _ index: Int, _ maxSum: Int) -> Int {\n    func side(_ peak: Int, _ len: Int) -> Int {\n        if len <= 0 { return 0 }\n        if peak - 1 >= len { return ((peak - 1) + (peak - len)) * len / 2 }\n        let dec = peak - 1\n        return dec * (dec + 1) / 2 + (len - dec)\n    }\n    var lo = 1\n    var hi = maxSum\n    while lo < hi {\n        let mid = lo + (hi - lo + 1) / 2\n        let total = mid + side(mid, index) + side(mid, n - 1 - index)\n        if total <= maxSum { lo = mid } else { hi = mid - 1 }\n    }\n    return lo\n}`,
        rust: `fn maxValue(n: i32, index: i32, maxSum: i32) -> i32 {\n    fn side(peak: i64, len: i64) -> i64 {\n        if len <= 0 {\n            return 0;\n        }\n        if peak - 1 >= len {\n            return ((peak - 1) + (peak - len)) * len / 2;\n        }\n        let dec = peak - 1;\n        dec * (dec + 1) / 2 + (len - dec)\n    }\n    let mut lo = 1i32;\n    let mut hi = maxSum;\n    while lo < hi {\n        let mid = lo + (hi - lo + 1) / 2;\n        let total = mid as i64\n            + side(mid as i64, index as i64)\n            + side(mid as i64, (n - 1 - index) as i64);\n        if total <= maxSum as i64 {\n            lo = mid;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    lo\n}`,
        php: `function maxValue($n, $index, $maxSum) {\n    $side = function($peak, $len) {\n        if ($len <= 0) return 0;\n        if ($peak - 1 >= $len) return intdiv((($peak - 1) + ($peak - $len)) * $len, 2);\n        $dec = $peak - 1;\n        return intdiv($dec * ($dec + 1), 2) + ($len - $dec);\n    };\n    $lo = 1;\n    $hi = $maxSum;\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo + 1, 2);\n        $total = $mid + $side($mid, $index) + $side($mid, $n - 1 - $index);\n        if ($total <= $maxSum) $lo = $mid; else $hi = $mid - 1;\n    }\n    return $lo;\n}`,
        ruby: `def maxValue(n, index, maxSum)\n  side = lambda do |peak, len|\n    next 0 if len <= 0\n    next ((peak - 1) + (peak - len)) * len / 2 if peak - 1 >= len\n    dec = peak - 1\n    dec * (dec + 1) / 2 + (len - dec)\n  end\n  lo = 1\n  hi = maxSum\n  while lo < hi\n    mid = lo + (hi - lo + 1) / 2\n    total = mid + side.call(mid, index) + side.call(mid, n - 1 - index)\n    if total <= maxSum\n      lo = mid\n    else\n      hi = mid - 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Find the Smallest Divisor Given a Threshold (LC 1283) ───────
  (() => {
    const ref = (nums: number[], threshold: number) => {
      let lo = 1, hi = nums[0];
      for (let i = 1; i < nums.length; i++) if (nums[i] > hi) hi = nums[i];
      const total = (d: number) => {
        let s = 0;
        for (let i = 0; i < nums.length; i++) s += Math.floor((nums[i] + d - 1) / d);
        return s;
      };
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (total(mid) <= threshold) hi = mid; else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "find-the-smallest-divisor-given-a-threshold",
      title: "Find the Smallest Divisor Given a Threshold",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Amazon", "Google", "Oracle"],
      signature: { funcName: "smallestDivisor", params: [{ name: "nums", type: "int[]" as const }, { name: "threshold", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Pick a positive integer divisor, divide every element of `nums` by it, round each result **up**, and sum them.\n\nReturn the smallest divisor whose sum is at most `threshold`.",
        [
          { in: "nums = [1,2,5,9], threshold = 6", out: "5", note: "Dividing by 5 gives 1 + 1 + 1 + 2 = 5; dividing by 4 gives 7, which is too big." },
          { in: "nums = [44,22,33,11,1], threshold = 5", out: "44" },
          { in: "nums = [21212,10101,12121], threshold = 1000000", out: "1" },
        ],
        ["1 <= nums.length <= 50000", "1 <= nums[i] <= 1000000", "nums.length <= threshold <= 1000000"]),
      hints: [
        "A larger divisor gives a smaller sum, so the feasible divisors form a suffix.",
        "Binary search the divisor between 1 and the largest element.",
        "Compute the ceiling with integer arithmetic: `(x + d - 1) / d`.",
      ],
      editorial: explain({
        idea: "The sum of the rounded-up quotients is non-increasing in the divisor, so binary search the smallest divisor whose sum fits under the threshold.",
        steps: [
          "Search `d` over `[1, max(nums)]` — anything larger makes every term 1, the same as `max(nums)`.",
          "`total(d)`: sum `ceil(nums[i] / d)`, written as `(nums[i] + d - 1) / d` in integers.",
          "Return the smallest `d` with `total(d) <= threshold`.",
        ],
        why: "`ceil(x / d)` is non-increasing in `d` for fixed positive `x`, so the sum is too — the predicate flips exactly once. The guarantee `threshold >= nums.length` means the answer always exists, since `d = max(nums)` makes every term 1 and the sum equal to the array's length.",
        time: "O(n log M) where M is the largest element",
        space: "O(1)",
        pitfalls: [
          "Floating-point `Math.ceil(x / d)` loses precision for large values; use the integer form.",
          "The search starts at 1 — a divisor of 0 is undefined.",
          "The sum reaches about `5 · 10^4 · 10^6` for `d = 1`, so it needs 64-bit or an early exit.",
        ],
      }),
      examples: [
        { input: "[1,2,5,9]\n6", expectedOutput: "5" },
        { input: "[44,22,33,11,1]\n5", expectedOutput: "44" },
        { input: "[21212,10101,12121]\n1000000", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 60 : 1000000;
        const n = ri(rng, 1, 25);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        const threshold = ri(rng, n, 1000000);
        return { input: `${fmtIntArr(nums)}\n${threshold}`, expectedOutput: String(ref(nums, threshold)) };
      },
      solutions: {
        python: `from typing import List\n\ndef smallestDivisor(nums: List[int], threshold: int) -> int:\n    lo, hi = 1, max(nums)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        total = sum((x + mid - 1) // mid for x in nums)\n        if total <= threshold:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var smallestDivisor = function(nums, threshold) {\n    var lo = 1, hi = nums[0], i;\n    for (i = 1; i < nums.length; i++) if (nums[i] > hi) hi = nums[i];\n    var total = function(d) {\n        var s = 0;\n        for (var j = 0; j < nums.length; j++) s += Math.floor((nums[j] + d - 1) / d);\n        return s;\n    };\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (total(mid) <= threshold) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n};`,
        typescript: `function smallestDivisor(nums: number[], threshold: number): number {\n    var lo = 1, hi = nums[0], i: number;\n    for (i = 1; i < nums.length; i++) if (nums[i] > hi) hi = nums[i];\n    var total = function(d: number): number {\n        var s = 0;\n        for (var j = 0; j < nums.length; j++) s += Math.floor((nums[j] + d - 1) / d);\n        return s;\n    };\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (total(mid) <= threshold) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        java: `private static long divisorTotal(int[] nums, int d) {\n    long s = 0;\n    for (int x : nums) s += (x + d - 1) / d;\n    return s;\n}\n\npublic static int smallestDivisor(int[] nums, int threshold) {\n    int lo = 1, hi = 1;\n    for (int x : nums) hi = Math.max(hi, x);\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (divisorTotal(nums, mid) <= threshold) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        cpp: `static long long divisorTotal(vector<int>& nums, int d) {\n    long long s = 0;\n    for (int x : nums) s += (x + d - 1) / d;\n    return s;\n}\n\nint smallestDivisor(vector<int>& nums, int threshold) {\n    int lo = 1, hi = 1;\n    for (int x : nums) hi = max(hi, x);\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (divisorTotal(nums, mid) <= threshold) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        c: `static long long divisorTotal(int* nums, int n, int d) {\n    long long s = 0;\n    for (int i = 0; i < n; i++) s += (nums[i] + d - 1) / d;\n    return s;\n}\n\nint smallestDivisor(int* nums, int numsSize, int threshold) {\n    int lo = 1, hi = 1;\n    for (int i = 0; i < numsSize; i++) if (nums[i] > hi) hi = nums[i];\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (divisorTotal(nums, numsSize, mid) <= (long long) threshold) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        csharp: `private static long DivisorTotal(int[] nums, int d)\n{\n    long s = 0;\n    foreach (int x in nums) s += (x + d - 1) / d;\n    return s;\n}\n\npublic static int SmallestDivisor(int[] nums, int threshold)\n{\n    int lo = 1, hi = 1;\n    foreach (int x in nums) if (x > hi) hi = x;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (DivisorTotal(nums, mid) <= threshold) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        go: `func divisorTotal(nums []int, d int) int {\n\ts := 0\n\tfor _, x := range nums {\n\t\ts += (x + d - 1) / d\n\t}\n\treturn s\n}\n\nfunc smallestDivisor(nums []int, threshold int) int {\n\tlo, hi := 1, 1\n\tfor _, x := range nums {\n\t\tif x > hi {\n\t\t\thi = x\n\t\t}\n\t}\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif divisorTotal(nums, mid) <= threshold {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `private fun divisorTotal(nums: IntArray, d: Int): Long {\n    var s = 0L\n    for (x in nums) s += ((x + d - 1) / d).toLong()\n    return s\n}\n\nfun smallestDivisor(nums: IntArray, threshold: Int): Int {\n    var lo = 1\n    var hi = 1\n    for (x in nums) if (x > hi) hi = x\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (divisorTotal(nums, mid) <= threshold) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
        swift: `func smallestDivisor(_ nums: [Int], _ threshold: Int) -> Int {\n    var lo = 1\n    var hi = 1\n    for x in nums where x > hi { hi = x }\n    func total(_ d: Int) -> Int {\n        var s = 0\n        for x in nums { s += (x + d - 1) / d }\n        return s\n    }\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if total(mid) <= threshold { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
        rust: `fn smallestDivisor(nums: Vec<i32>, threshold: i32) -> i32 {\n    let mut lo = 1i32;\n    let mut hi = 1i32;\n    for &x in nums.iter() {\n        if x > hi {\n            hi = x;\n        }\n    }\n    let total = |d: i32| -> i64 {\n        let mut s: i64 = 0;\n        for &x in nums.iter() {\n            s += ((x + d - 1) / d) as i64;\n        }\n        s\n    };\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if total(mid) <= threshold as i64 {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo\n}`,
        php: `function smallestDivisor($nums, $threshold) {\n    $lo = 1;\n    $hi = max($nums);\n    $total = function($d) use ($nums) {\n        $s = 0;\n        foreach ($nums as $x) $s += intdiv($x + $d - 1, $d);\n        return $s;\n    };\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($total($mid) <= $threshold) $hi = $mid; else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
        ruby: `def smallestDivisor(nums, threshold)\n  lo = 1\n  hi = nums.max\n  total = lambda do |d|\n    nums.sum { |x| (x + d - 1) / d }\n  end\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if total.call(mid) <= threshold\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── H-Index II (LC 275) ─────────────────────────────────────────
  (() => {
    const ref = (citations: number[]) => {
      const n = citations.length;
      let lo = 0, hi = n;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (citations[n - 1 - mid] >= mid + 1) lo = mid + 1; else hi = mid;
      }
      return lo;
    };
    return {
      slug: "h-index-ii",
      title: "H-Index II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Amazon", "Google", "Adobe"],
      signature: { funcName: "hIndex", params: [{ name: "citations", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`citations[i]` is the number of citations the researcher's `i`-th paper received, sorted in **ascending** order.\n\nThe **h-index** is the largest `h` such that at least `h` papers have at least `h` citations each. Return it in `O(log n)` time.",
        [
          { in: "citations = [0,1,3,5,6]", out: "3", note: "Three papers have at least 3 citations." },
          { in: "citations = [1,2,100]", out: "2" },
          { in: "citations = [0]", out: "0" },
        ],
        ["1 <= citations.length <= 100000", "0 <= citations[i] <= 1000", "citations is sorted in ascending order."]),
      hints: [
        "Counting from the top: the `h` most-cited papers are the last `h` of the sorted array.",
        "So `h` works exactly when `citations[n - h] >= h`.",
        "That predicate is monotone in `h`, so binary search it.",
      ],
      editorial: explain({
        idea: "With the array sorted ascending, the `h` most-cited papers are its last `h` entries, and the weakest of them sits at index `n - h`. So the test is a single array lookup, and it is monotone in `h`.",
        steps: [
          "Binary search `h` over `[0, n]`.",
          "For a candidate count `mid` (meaning `h = mid + 1`), check `citations[n - 1 - mid] >= mid + 1`.",
          "Move `lo` past `mid` when it holds; the final `lo` is the h-index.",
        ],
        why: "If `h` papers each have at least `h` citations, then `h - 1` papers each have at least `h - 1` — so feasibility is downward closed and the boundary is unique. Sorting means the weakest of the top `h` is `citations[n - h]`, which makes the check `O(1)` and the whole search logarithmic.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Off-by-one between `h` and the array index is the classic trap — `h` papers means indices `n - h … n - 1`.",
          "Sorting or counting would be `O(n log n)` or `O(n)`, both failing the stated requirement.",
          "An h-index of 0 is legitimate when the best paper has no citations.",
        ],
      }),
      examples: [
        { input: "[0,1,3,5,6]", expectedOutput: "3" },
        { input: "[1,2,100]", expectedOutput: "2" },
        { input: "[0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 12 : 1000;
        const citations = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 0, hi)).sort((a, b) => a - b);
        return { input: fmtIntArr(citations), expectedOutput: String(ref(citations)) };
      },
      solutions: {
        python: `from typing import List\n\ndef hIndex(citations: List[int]) -> int:\n    n = len(citations)\n    lo, hi = 0, n\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if citations[n - 1 - mid] >= mid + 1:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo`,
        javascript: `var hIndex = function(citations) {\n    var n = citations.length;\n    var lo = 0, hi = n;\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (citations[n - 1 - mid] >= mid + 1) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n};`,
        typescript: `function hIndex(citations: number[]): number {\n    var n = citations.length;\n    var lo = 0, hi = n;\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (citations[n - 1 - mid] >= mid + 1) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}`,
        java: `public static int hIndex(int[] citations) {\n    int n = citations.length;\n    int lo = 0, hi = n;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (citations[n - 1 - mid] >= mid + 1) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}`,
        cpp: `int hIndex(vector<int>& citations) {\n    int n = (int) citations.size();\n    int lo = 0, hi = n;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (citations[n - 1 - mid] >= mid + 1) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}`,
        c: `int hIndex(int* citations, int citationsSize) {\n    int n = citationsSize;\n    int lo = 0, hi = n;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (citations[n - 1 - mid] >= mid + 1) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}`,
        csharp: `public static int HIndex(int[] citations)\n{\n    int n = citations.Length;\n    int lo = 0, hi = n;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (citations[n - 1 - mid] >= mid + 1) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}`,
        go: `func hIndex(citations []int) int {\n\tn := len(citations)\n\tlo, hi := 0, n\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif citations[n-1-mid] >= mid+1 {\n\t\t\tlo = mid + 1\n\t\t} else {\n\t\t\thi = mid\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `fun hIndex(citations: IntArray): Int {\n    val n = citations.size\n    var lo = 0\n    var hi = n\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (citations[n - 1 - mid] >= mid + 1) lo = mid + 1 else hi = mid\n    }\n    return lo\n}`,
        swift: `func hIndex(_ citations: [Int]) -> Int {\n    let n = citations.count\n    var lo = 0\n    var hi = n\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if citations[n - 1 - mid] >= mid + 1 { lo = mid + 1 } else { hi = mid }\n    }\n    return lo\n}`,
        rust: `fn hIndex(citations: Vec<i32>) -> i32 {\n    let n = citations.len();\n    let mut lo = 0usize;\n    let mut hi = n;\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if citations[n - 1 - mid] >= (mid + 1) as i32 {\n            lo = mid + 1;\n        } else {\n            hi = mid;\n        }\n    }\n    lo as i32\n}`,
        php: `function hIndex($citations) {\n    $n = count($citations);\n    $lo = 0;\n    $hi = $n;\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($citations[$n - 1 - $mid] >= $mid + 1) $lo = $mid + 1; else $hi = $mid;\n    }\n    return $lo;\n}`,
        ruby: `def hIndex(citations)\n  n = citations.length\n  lo = 0\n  hi = n\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if citations[n - 1 - mid] >= mid + 1\n      lo = mid + 1\n    else\n      hi = mid\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Peak Index in a Mountain Array (LC 852) ─────────────────────
  (() => {
    const ref = (arr: number[]) => {
      let lo = 0, hi = arr.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (arr[mid] < arr[mid + 1]) lo = mid + 1; else hi = mid;
      }
      return lo;
    };
    return {
      slug: "peak-index-in-a-mountain-array",
      title: "Peak Index in a Mountain Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Amazon", "Meta", "Infosys"],
      signature: { funcName: "peakIndexInMountainArray", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`arr` is a **mountain array**: it strictly increases to a single peak and then strictly decreases, with the peak neither first nor last.\n\nReturn the index of the peak in `O(log n)` time.",
        [
          { in: "arr = [0,1,0]", out: "1" },
          { in: "arr = [0,2,1,0]", out: "1" },
          { in: "arr = [0,10,5,2]", out: "1" },
        ],
        ["3 <= arr.length <= 100000", "0 <= arr[i] <= 1000000", "arr is a mountain array."]),
      hints: [
        "Compare each midpoint with its right neighbour rather than with a target.",
        "`arr[mid] < arr[mid + 1]` means you are still climbing — the peak is strictly to the right.",
        "Otherwise `mid` could itself be the peak, so keep it in the range.",
      ],
      editorial: explain({
        idea: "The array has no target to search for, but it does have a monotone predicate: 'still ascending at index `i`'. That is true for every index before the peak and false from the peak onwards, so binary search finds the boundary.",
        steps: [
          "Maintain `lo` and `hi` over the candidate indices.",
          "If `arr[mid] < arr[mid + 1]`, the peak lies after `mid`, so `lo = mid + 1`.",
          "Otherwise the peak is at `mid` or before it, so `hi = mid`.",
        ],
        why: "Because the array strictly increases then strictly decreases, `arr[i] < arr[i+1]` holds exactly for `i` below the peak. Binary searching that boolean converges on the first index where it fails, which is the peak. The mountain guarantee is what makes `mid + 1` always a valid index inside the loop.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "Setting `hi = mid - 1` can skip past the peak, since `mid` is still a candidate.",
          "Comparing with the *left* neighbour needs a different boundary and is easier to get wrong.",
          "A linear scan is `O(n)` and misses the stated requirement.",
        ],
      }),
      examples: [
        { input: "[0,1,0]", expectedOutput: "1" },
        { input: "[0,2,1,0]", expectedOutput: "1" },
        { input: "[0,10,5,2]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const up = ri(rng, 1, 15);
        const down = ri(rng, 1, 15);
        const arr: number[] = [];
        let v = ri(rng, 0, 50);
        for (let i = 0; i < up; i++) { arr.push(v); v += ri(rng, 1, 40); }
        arr.push(v); // the peak
        for (let i = 0; i < down; i++) { v -= ri(rng, 1, 40); if (v < 0) v = 0; arr.push(v); }
        // A flat tail would break strictness, so rebuild the descent strictly.
        let peakAt = up;
        for (let i = peakAt + 1; i < arr.length; i++) arr[i] = arr[i - 1] - 1;
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef peakIndexInMountainArray(arr: List[int]) -> int:\n    lo, hi = 0, len(arr) - 1\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if arr[mid] < arr[mid + 1]:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo`,
        javascript: `var peakIndexInMountainArray = function(arr) {\n    var lo = 0, hi = arr.length - 1;\n    while (lo < hi) {\n        var mid = (lo + hi) >> 1;\n        if (arr[mid] < arr[mid + 1]) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n};`,
        typescript: `function peakIndexInMountainArray(arr: number[]): number {\n    var lo = 0, hi = arr.length - 1;\n    while (lo < hi) {\n        var mid = (lo + hi) >> 1;\n        if (arr[mid] < arr[mid + 1]) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}`,
        java: `public static int peakIndexInMountainArray(int[] arr) {\n    int lo = 0, hi = arr.length - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (arr[mid] < arr[mid + 1]) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}`,
        cpp: `int peakIndexInMountainArray(vector<int>& arr) {\n    int lo = 0, hi = (int) arr.size() - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (arr[mid] < arr[mid + 1]) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}`,
        c: `int peakIndexInMountainArray(int* arr, int arrSize) {\n    int lo = 0, hi = arrSize - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (arr[mid] < arr[mid + 1]) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}`,
        csharp: `public static int PeakIndexInMountainArray(int[] arr)\n{\n    int lo = 0, hi = arr.Length - 1;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (arr[mid] < arr[mid + 1]) lo = mid + 1; else hi = mid;\n    }\n    return lo;\n}`,
        go: `func peakIndexInMountainArray(arr []int) int {\n\tlo, hi := 0, len(arr)-1\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif arr[mid] < arr[mid+1] {\n\t\t\tlo = mid + 1\n\t\t} else {\n\t\t\thi = mid\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `fun peakIndexInMountainArray(arr: IntArray): Int {\n    var lo = 0\n    var hi = arr.size - 1\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (arr[mid] < arr[mid + 1]) lo = mid + 1 else hi = mid\n    }\n    return lo\n}`,
        swift: `func peakIndexInMountainArray(_ arr: [Int]) -> Int {\n    var lo = 0\n    var hi = arr.count - 1\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if arr[mid] < arr[mid + 1] { lo = mid + 1 } else { hi = mid }\n    }\n    return lo\n}`,
        rust: `fn peakIndexInMountainArray(arr: Vec<i32>) -> i32 {\n    let mut lo = 0usize;\n    let mut hi = arr.len() - 1;\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if arr[mid] < arr[mid + 1] {\n            lo = mid + 1;\n        } else {\n            hi = mid;\n        }\n    }\n    lo as i32\n}`,
        php: `function peakIndexInMountainArray($arr) {\n    $lo = 0;\n    $hi = count($arr) - 1;\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($arr[$mid] < $arr[$mid + 1]) $lo = $mid + 1; else $hi = $mid;\n    }\n    return $lo;\n}`,
        ruby: `def peakIndexInMountainArray(arr)\n  lo = 0\n  hi = arr.length - 1\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if arr[mid] < arr[mid + 1]\n      lo = mid + 1\n    else\n      hi = mid\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Maximum Candies Allocated to K Children (LC 2226) ───────────
  (() => {
    const ref = (candies: number[], k: number) => {
      let hi = 0;
      for (let i = 0; i < candies.length; i++) if (candies[i] > hi) hi = candies[i];
      const can = (size: number) => {
        let cnt = 0;
        for (let i = 0; i < candies.length; i++) {
          cnt += Math.floor(candies[i] / size);
          if (cnt >= k) return true;
        }
        return cnt >= k;
      };
      let lo = 1, ans = 0;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (can(mid)) { ans = mid; lo = mid + 1; } else hi = mid - 1;
      }
      return ans;
    };
    return {
      slug: "maximum-candies-allocated-to-k-children",
      title: "Maximum Candies Allocated to K Children",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Amazon", "Google", "Cred"],
      signature: { funcName: "maximumCandies", params: [{ name: "candies", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Pile `i` holds `candies[i]` candies. You may split a pile into any number of **sub-piles**, but you may not merge piles.\n\nEvery one of the `k` children must get the **same** number of candies, all from a single pile (leftovers may be discarded). Return the maximum number each child can get, or `0` if it is impossible.",
        [
          { in: "candies = [5,8,6], k = 3", out: "5", note: "Two children take 5 from the 8-pile and the 6-pile; one takes the whole 5-pile." },
          { in: "candies = [2,5], k = 11", out: "0", note: "There are not enough candies for 11 children to get even one each." },
          { in: "candies = [4,7,5], k = 4", out: "3" },
        ],
        ["1 <= candies.length <= 100000", "1 <= candies[i] <= 10000000", "1 <= k <= 1000000000"]),
      hints: [
        "If each child can get `c` candies, they can also get any smaller amount — the feasibility is monotone.",
        "For a candidate `c`, pile `i` yields `floor(candies[i] / c)` children's worth.",
        "Binary search the largest `c` whose total reaches `k`.",
      ],
      editorial: explain({
        idea: "Binary search the per-child amount. For a candidate `c`, each pile independently supplies `floor(candies[i] / c)` shares, and the shares cannot be combined across piles — which is exactly what the floor captures.",
        steps: [
          "Search `c` over `[1, max(candies)]`.",
          "`can(c)`: sum `floor(candies[i] / c)` and stop early once it reaches `k`.",
          "Keep the largest feasible `c`; if none is, the answer is 0.",
        ],
        why: "Raising `c` weakly lowers every pile's share count, so the total is non-increasing and the feasible amounts form a prefix. The floor is correct because a child's candies must come from one pile — a remainder smaller than `c` is simply wasted, it cannot be topped up from elsewhere.",
        time: "O(n log M) where M is the largest pile",
        space: "O(1)",
        pitfalls: [
          "The share count reaches `10^5 · 10^7 = 10^12`, so it needs 64-bit or an early exit once `k` is reached.",
          "Answering 0 is legitimate and must be reachable — starting the search at 1 with a separate `ans` variable handles it.",
          "Piles cannot be merged, so summing all candies and dividing by `k` is wrong.",
        ],
      }),
      examples: [
        { input: "[5,8,6]\n3", expectedOutput: "5" },
        { input: "[2,5]\n11", expectedOutput: "0" },
        { input: "[4,7,5]\n4", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 30 : 10000000;
        const candies = Array.from({ length: ri(rng, 1, 25) }, () => ri(rng, 1, hi));
        const k = rng() < 0.7 ? ri(rng, 1, 40) : ri(rng, 1, 1000000000);
        return { input: `${fmtIntArr(candies)}\n${k}`, expectedOutput: String(ref(candies, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumCandies(candies: List[int], k: int) -> int:\n    def can(size: int) -> bool:\n        cnt = 0\n        for c in candies:\n            cnt += c // size\n            if cnt >= k:\n                return True\n        return cnt >= k\n\n    lo, hi, ans = 1, max(candies), 0\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if can(mid):\n            ans = mid\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return ans`,
        javascript: `var maximumCandies = function(candies, k) {\n    var hi = 0, i;\n    for (i = 0; i < candies.length; i++) if (candies[i] > hi) hi = candies[i];\n    var can = function(size) {\n        var cnt = 0;\n        for (var j = 0; j < candies.length; j++) {\n            cnt += Math.floor(candies[j] / size);\n            if (cnt >= k) return true;\n        }\n        return cnt >= k;\n    };\n    var lo = 1, ans = 0;\n    while (lo <= hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (can(mid)) { ans = mid; lo = mid + 1; } else hi = mid - 1;\n    }\n    return ans;\n};`,
        typescript: `function maximumCandies(candies: number[], k: number): number {\n    var hi = 0, i: number;\n    for (i = 0; i < candies.length; i++) if (candies[i] > hi) hi = candies[i];\n    var can = function(size: number): boolean {\n        var cnt = 0;\n        for (var j = 0; j < candies.length; j++) {\n            cnt += Math.floor(candies[j] / size);\n            if (cnt >= k) return true;\n        }\n        return cnt >= k;\n    };\n    var lo = 1, ans = 0;\n    while (lo <= hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (can(mid)) { ans = mid; lo = mid + 1; } else hi = mid - 1;\n    }\n    return ans;\n}`,
        java: `private static boolean canAllocate(int[] candies, int k, int size) {\n    long cnt = 0;\n    for (int c : candies) {\n        cnt += c / size;\n        if (cnt >= k) return true;\n    }\n    return cnt >= k;\n}\n\npublic static int maximumCandies(int[] candies, int k) {\n    int hi = 0;\n    for (int c : candies) hi = Math.max(hi, c);\n    int lo = 1, ans = 0;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canAllocate(candies, k, mid)) {\n            ans = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return ans;\n}`,
        cpp: `static bool canAllocate(vector<int>& candies, int k, int size) {\n    long long cnt = 0;\n    for (int c : candies) {\n        cnt += c / size;\n        if (cnt >= k) return true;\n    }\n    return cnt >= k;\n}\n\nint maximumCandies(vector<int>& candies, int k) {\n    int hi = 0;\n    for (int c : candies) hi = max(hi, c);\n    int lo = 1, ans = 0;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canAllocate(candies, k, mid)) {\n            ans = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return ans;\n}`,
        c: `static int canAllocate(int* candies, int n, int k, int size) {\n    long long cnt = 0;\n    for (int i = 0; i < n; i++) {\n        cnt += candies[i] / size;\n        if (cnt >= (long long) k) return 1;\n    }\n    return cnt >= (long long) k;\n}\n\nint maximumCandies(int* candies, int candiesSize, int k) {\n    int hi = 0;\n    for (int i = 0; i < candiesSize; i++) if (candies[i] > hi) hi = candies[i];\n    int lo = 1, ans = 0;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canAllocate(candies, candiesSize, k, mid)) {\n            ans = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return ans;\n}`,
        csharp: `private static bool CanAllocate(int[] candies, int k, int size)\n{\n    long cnt = 0;\n    foreach (int c in candies)\n    {\n        cnt += c / size;\n        if (cnt >= k) return true;\n    }\n    return cnt >= k;\n}\n\npublic static int MaximumCandies(int[] candies, int k)\n{\n    int hi = 0;\n    foreach (int c in candies) if (c > hi) hi = c;\n    int lo = 1, ans = 0;\n    while (lo <= hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (CanAllocate(candies, k, mid))\n        {\n            ans = mid;\n            lo = mid + 1;\n        }\n        else\n        {\n            hi = mid - 1;\n        }\n    }\n    return ans;\n}`,
        go: `func canAllocate(candies []int, k int, size int) bool {\n\tcnt := 0\n\tfor _, c := range candies {\n\t\tcnt += c / size\n\t\tif cnt >= k {\n\t\t\treturn true\n\t\t}\n\t}\n\treturn cnt >= k\n}\n\nfunc maximumCandies(candies []int, k int) int {\n\thi := 0\n\tfor _, c := range candies {\n\t\tif c > hi {\n\t\t\thi = c\n\t\t}\n\t}\n\tlo, ans := 1, 0\n\tfor lo <= hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif canAllocate(candies, k, mid) {\n\t\t\tans = mid\n\t\t\tlo = mid + 1\n\t\t} else {\n\t\t\thi = mid - 1\n\t\t}\n\t}\n\treturn ans\n}`,
        kotlin: `private fun canAllocate(candies: IntArray, k: Int, size: Int): Boolean {\n    var cnt = 0L\n    for (c in candies) {\n        cnt += (c / size).toLong()\n        if (cnt >= k) return true\n    }\n    return cnt >= k\n}\n\nfun maximumCandies(candies: IntArray, k: Int): Int {\n    var hi = 0\n    for (c in candies) if (c > hi) hi = c\n    var lo = 1\n    var ans = 0\n    while (lo <= hi) {\n        val mid = lo + (hi - lo) / 2\n        if (canAllocate(candies, k, mid)) {\n            ans = mid\n            lo = mid + 1\n        } else {\n            hi = mid - 1\n        }\n    }\n    return ans\n}`,
        swift: `func maximumCandies(_ candies: [Int], _ k: Int) -> Int {\n    var hi = 0\n    for c in candies where c > hi { hi = c }\n    func can(_ size: Int) -> Bool {\n        var cnt = 0\n        for c in candies {\n            cnt += c / size\n            if cnt >= k { return true }\n        }\n        return cnt >= k\n    }\n    var lo = 1\n    var ans = 0\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2\n        if can(mid) {\n            ans = mid\n            lo = mid + 1\n        } else {\n            hi = mid - 1\n        }\n    }\n    return ans\n}`,
        rust: `fn maximumCandies(candies: Vec<i32>, k: i32) -> i32 {\n    let mut hi = 0i32;\n    for &c in candies.iter() {\n        if c > hi {\n            hi = c;\n        }\n    }\n    let can = |size: i32| -> bool {\n        let mut cnt: i64 = 0;\n        for &c in candies.iter() {\n            cnt += (c / size) as i64;\n            if cnt >= k as i64 {\n                return true;\n            }\n        }\n        cnt >= k as i64\n    };\n    let mut lo = 1i32;\n    let mut ans = 0i32;\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2;\n        if can(mid) {\n            ans = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    ans\n}`,
        php: `function maximumCandies($candies, $k) {\n    $hi = max($candies);\n    $can = function($size) use ($candies, $k) {\n        $cnt = 0;\n        foreach ($candies as $c) {\n            $cnt += intdiv($c, $size);\n            if ($cnt >= $k) return true;\n        }\n        return $cnt >= $k;\n    };\n    $lo = 1;\n    $ans = 0;\n    while ($lo <= $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($can($mid)) {\n            $ans = $mid;\n            $lo = $mid + 1;\n        } else {\n            $hi = $mid - 1;\n        }\n    }\n    return $ans;\n}`,
        ruby: `def maximumCandies(candies, k)\n  hi = candies.max\n  can = lambda do |size|\n    cnt = 0\n    candies.each do |c|\n      cnt += c / size\n      return true if cnt >= k\n    end\n    cnt >= k\n  end\n  lo = 1\n  ans = 0\n  while lo <= hi\n    mid = lo + (hi - lo) / 2\n    if can.call(mid)\n      ans = mid\n      lo = mid + 1\n    else\n      hi = mid - 1\n    end\n  end\n  ans\nend`,
      },
    };
  })(),

  // ── Minimize the Maximum Difference of Pairs (LC 2616) ──────────
  (() => {
    const ref = (nums: number[], p: number) => {
      if (p === 0) return 0;
      const a = nums.slice().sort((x, y) => x - y);
      const can = (d: number) => {
        let cnt = 0, i = 0;
        while (i + 1 < a.length) {
          if (a[i + 1] - a[i] <= d) { cnt++; i += 2; } else i++;
        }
        return cnt >= p;
      };
      let lo = 0, hi = a[a.length - 1] - a[0];
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (can(mid)) hi = mid; else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "minimize-the-maximum-difference-of-pairs",
      title: "Minimize the Maximum Difference of Pairs",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Greedy", "Sorting", "Amazon", "Google", "Arcesium"],
      signature: { funcName: "minimizeMax", params: [{ name: "nums", type: "int[]" as const }, { name: "p", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Form exactly `p` pairs of indices from `nums`; no index may appear in more than one pair. The cost of a pair is the absolute difference of its values.\n\nReturn the minimum possible value of the **largest** pair cost. If `p` is 0, the answer is 0.",
        [
          { in: "nums = [10,1,2,7,1,3], p = 2", out: "1", note: "Pair the two 1s and the 2 with the 3." },
          { in: "nums = [4,2,1,2], p = 1", out: "0", note: "The two 2s cost nothing." },
          { in: "nums = [3,4,2,3,2,1,2], p = 3", out: "1" },
        ],
        ["1 <= nums.length <= 100000", "0 <= nums[i] <= 1000000000", "0 <= p <= nums.length / 2"]),
      hints: [
        "If a maximum cost `d` is achievable, so is any larger one — the feasibility is monotone.",
        "Sort first: in an optimal pairing, every pair is two adjacent elements of the sorted array.",
        "For a candidate `d`, greedily pair adjacent elements whose gap fits, skipping one when it does not.",
      ],
      editorial: explain({
        idea: "Binary search the maximum cost. Once the array is sorted, an optimal pairing only ever joins adjacent elements, so a left-to-right greedy that takes every affordable adjacent pair maximises the number of pairs formed within a budget `d`.",
        steps: [
          "Handle `p = 0` up front.",
          "Sort `nums`.",
          "`can(d)`: scan with `i`; if `a[i+1] - a[i] <= d`, pair them and jump two, otherwise advance one. Feasible when at least `p` pairs form.",
          "Binary search the smallest feasible `d` over `[0, max - min]`.",
        ],
        why: "Pairing non-adjacent sorted elements can always be rewritten to adjacent pairs without raising the maximum cost — an exchange argument on any crossing or nesting pair. Given adjacency, the greedy is optimal because taking an affordable pair as early as possible never blocks a later one that a different choice would have allowed. Raising `d` only admits more pairs, so `can` is monotone.",
        time: "O(n log n + n log V)",
        space: "O(n)",
        pitfalls: [
          "`p = 0` must return 0 without entering the search.",
          "The greedy must skip one element when a pair is unaffordable, not two.",
          "The search starts at 0 — equal neighbours give a zero-cost pair.",
        ],
      }),
      examples: [
        { input: "[10,1,2,7,1,3]\n2", expectedOutput: "1" },
        { input: "[4,2,1,2]\n1", expectedOutput: "0" },
        { input: "[3,4,2,3,2,1,2]\n3", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 12 : 1000000000;
        const n = ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => ri(rng, 0, hi));
        const p = ri(rng, 0, Math.floor(n / 2));
        return { input: `${fmtIntArr(nums)}\n${p}`, expectedOutput: String(ref(nums, p)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimizeMax(nums: List[int], p: int) -> int:\n    if p == 0:\n        return 0\n    a = sorted(nums)\n\n    def can(d: int) -> bool:\n        cnt, i = 0, 0\n        while i + 1 < len(a):\n            if a[i + 1] - a[i] <= d:\n                cnt += 1\n                i += 2\n            else:\n                i += 1\n        return cnt >= p\n\n    lo, hi = 0, a[-1] - a[0]\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if can(mid):\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var minimizeMax = function(nums, p) {\n    if (p === 0) return 0;\n    var a = nums.slice().sort(function(x, y) { return x - y; });\n    var can = function(d) {\n        var cnt = 0, i = 0;\n        while (i + 1 < a.length) {\n            if (a[i + 1] - a[i] <= d) { cnt++; i += 2; } else i++;\n        }\n        return cnt >= p;\n    };\n    var lo = 0, hi = a[a.length - 1] - a[0];\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (can(mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n};`,
        typescript: `function minimizeMax(nums: number[], p: number): number {\n    if (p === 0) return 0;\n    var a = nums.slice().sort(function(x, y) { return x - y; });\n    var can = function(d: number): boolean {\n        var cnt = 0, i = 0;\n        while (i + 1 < a.length) {\n            if (a[i + 1] - a[i] <= d) { cnt++; i += 2; } else i++;\n        }\n        return cnt >= p;\n    };\n    var lo = 0, hi = a[a.length - 1] - a[0];\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (can(mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        java: `private static boolean canPair(int[] a, int p, int d) {\n    int cnt = 0, i = 0;\n    while (i + 1 < a.length) {\n        if (a[i + 1] - a[i] <= d) {\n            cnt++;\n            i += 2;\n        } else {\n            i++;\n        }\n    }\n    return cnt >= p;\n}\n\npublic static int minimizeMax(int[] nums, int p) {\n    if (p == 0) return 0;\n    int[] a = nums.clone();\n    Arrays.sort(a);\n    int lo = 0, hi = a[a.length - 1] - a[0];\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canPair(a, p, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        cpp: `static bool canPair(vector<int>& a, int p, int d) {\n    int cnt = 0, i = 0;\n    while (i + 1 < (int) a.size()) {\n        if (a[i + 1] - a[i] <= d) {\n            cnt++;\n            i += 2;\n        } else {\n            i++;\n        }\n    }\n    return cnt >= p;\n}\n\nint minimizeMax(vector<int>& nums, int p) {\n    if (p == 0) return 0;\n    vector<int> a = nums;\n    sort(a.begin(), a.end());\n    int lo = 0, hi = a.back() - a.front();\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canPair(a, p, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        c: `static int cmpPairAsc(const void* x, const void* y) {\n    int u = *(const int*) x;\n    int v = *(const int*) y;\n    return (u > v) - (u < v);\n}\n\nstatic int canPair(int* a, int n, int p, int d) {\n    int cnt = 0, i = 0;\n    while (i + 1 < n) {\n        if (a[i + 1] - a[i] <= d) {\n            cnt++;\n            i += 2;\n        } else {\n            i++;\n        }\n    }\n    return cnt >= p;\n}\n\nint minimizeMax(int* nums, int numsSize, int p) {\n    if (p == 0) return 0;\n    int* a = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    qsort(a, (size_t) numsSize, sizeof(int), cmpPairAsc);\n    int lo = 0, hi = a[numsSize - 1] - a[0];\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canPair(a, numsSize, p, mid)) hi = mid; else lo = mid + 1;\n    }\n    free(a);\n    return lo;\n}`,
        csharp: `private static bool CanPair(int[] a, int p, int d)\n{\n    int cnt = 0, i = 0;\n    while (i + 1 < a.Length)\n    {\n        if (a[i + 1] - a[i] <= d)\n        {\n            cnt++;\n            i += 2;\n        }\n        else\n        {\n            i++;\n        }\n    }\n    return cnt >= p;\n}\n\npublic static int MinimizeMax(int[] nums, int p)\n{\n    if (p == 0) return 0;\n    int[] a = (int[]) nums.Clone();\n    Array.Sort(a);\n    int lo = 0, hi = a[a.Length - 1] - a[0];\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (CanPair(a, p, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        go: `func canPair(a []int, p int, d int) bool {\n\tcnt, i := 0, 0\n\tfor i+1 < len(a) {\n\t\tif a[i+1]-a[i] <= d {\n\t\t\tcnt++\n\t\t\ti += 2\n\t\t} else {\n\t\t\ti++\n\t\t}\n\t}\n\treturn cnt >= p\n}\n\nfunc minimizeMax(nums []int, p int) int {\n\tif p == 0 {\n\t\treturn 0\n\t}\n\ta := append([]int{}, nums...)\n\tsort.Ints(a)\n\tlo, hi := 0, a[len(a)-1]-a[0]\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif canPair(a, p, mid) {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `private fun canPair(a: IntArray, p: Int, d: Int): Boolean {\n    var cnt = 0\n    var i = 0\n    while (i + 1 < a.size) {\n        if (a[i + 1] - a[i] <= d) {\n            cnt++\n            i += 2\n        } else {\n            i++\n        }\n    }\n    return cnt >= p\n}\n\nfun minimizeMax(nums: IntArray, p: Int): Int {\n    if (p == 0) return 0\n    val a = nums.sortedArray()\n    var lo = 0\n    var hi = a[a.size - 1] - a[0]\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (canPair(a, p, mid)) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
        swift: `func minimizeMax(_ nums: [Int], _ p: Int) -> Int {\n    if p == 0 { return 0 }\n    let a = nums.sorted()\n    func can(_ d: Int) -> Bool {\n        var cnt = 0\n        var i = 0\n        while i + 1 < a.count {\n            if a[i + 1] - a[i] <= d {\n                cnt += 1\n                i += 2\n            } else {\n                i += 1\n            }\n        }\n        return cnt >= p\n    }\n    var lo = 0\n    var hi = a[a.count - 1] - a[0]\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if can(mid) { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
        rust: `fn minimizeMax(nums: Vec<i32>, p: i32) -> i32 {\n    if p == 0 {\n        return 0;\n    }\n    let mut a = nums.clone();\n    a.sort();\n    let can = |d: i32| -> bool {\n        let mut cnt = 0i32;\n        let mut i = 0usize;\n        while i + 1 < a.len() {\n            if a[i + 1] - a[i] <= d {\n                cnt += 1;\n                i += 2;\n            } else {\n                i += 1;\n            }\n        }\n        cnt >= p\n    };\n    let mut lo = 0i32;\n    let mut hi = a[a.len() - 1] - a[0];\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if can(mid) {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo\n}`,
        php: `function minimizeMax($nums, $p) {\n    if ($p === 0) return 0;\n    $a = $nums;\n    sort($a);\n    $can = function($d) use ($a, $p) {\n        $cnt = 0;\n        $i = 0;\n        while ($i + 1 < count($a)) {\n            if ($a[$i + 1] - $a[$i] <= $d) { $cnt++; $i += 2; } else $i++;\n        }\n        return $cnt >= $p;\n    };\n    $lo = 0;\n    $hi = $a[count($a) - 1] - $a[0];\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($can($mid)) $hi = $mid; else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
        ruby: `def minimizeMax(nums, p)\n  return 0 if p == 0\n  a = nums.sort\n  can = lambda do |d|\n    cnt = 0\n    i = 0\n    while i + 1 < a.length\n      if a[i + 1] - a[i] <= d\n        cnt += 1\n        i += 2\n      else\n        i += 1\n      end\n    end\n    cnt >= p\n  end\n  lo = 0\n  hi = a[-1] - a[0]\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if can.call(mid)\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── House Robber IV (LC 2560) ───────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let lo = nums[0], hi = nums[0];
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] < lo) lo = nums[i];
        if (nums[i] > hi) hi = nums[i];
      }
      const can = (cap: number) => {
        let cnt = 0, i = 0;
        while (i < nums.length) {
          if (nums[i] <= cap) { cnt++; i += 2; } else i++;
        }
        return cnt >= k;
      };
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (can(mid)) hi = mid; else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "house-robber-iv",
      title: "House Robber IV",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Greedy", "Amazon", "Google", "Sprinklr"],
      signature: { funcName: "minCapability", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A robber will not rob two **adjacent** houses. The **capability** of a robbery is the largest amount taken from any single house.\n\nGiven that the robber steals from at least `k` houses, return the minimum possible capability.",
        [
          { in: "nums = [2,3,5,9], k = 2", out: "5", note: "Robbing houses 0 and 2 caps at 5." },
          { in: "nums = [2,7,9,3,1], k = 2", out: "2", note: "Houses 0 and 4 both hold at most 2." },
          { in: "nums = [1,2,3,4,5,6], k = 3", out: "5" },
        ],
        ["1 <= nums.length <= 100000", "1 <= nums[i] <= 1000000000", "1 <= k <= (nums.length + 1) / 2"]),
      hints: [
        "If a capability `c` allows `k` houses, so does any larger `c` — the feasibility is monotone.",
        "Binary search `c`; for a candidate, count how many non-adjacent houses hold at most `c`.",
        "The greedy left-to-right count is optimal: take a house whenever you can.",
      ],
      editorial: explain({
        idea: "Binary search the capability. For a fixed `c`, the houses holding at most `c` are known, and the question becomes how many non-adjacent ones can be chosen — a greedy left-to-right sweep answers it exactly.",
        steps: [
          "Search `c` over `[min(nums), max(nums)]`.",
          "`can(c)`: walk the array; when `nums[i] <= c`, take it and jump two, otherwise advance one. Feasible when at least `k` houses are taken.",
          "Return the smallest feasible `c`.",
        ],
        why: "Taking an eligible house as early as possible is optimal: any selection can be shifted left house by house without reducing its size, since skipping an eligible house only frees a slot that the next choice could have used anyway. Raising `c` makes more houses eligible, which can only raise the count — the monotonicity the search needs.",
        time: "O(n log V)",
        space: "O(1)",
        pitfalls: [
          "Jumping by 2 is what enforces non-adjacency; jumping by 1 after taking a house allows neighbours.",
          "The search range must start at the minimum, not at 0 — any capability below it admits nothing.",
          "This is not the classic maximum-sum House Robber; the objective is a minimax.",
        ],
      }),
      examples: [
        { input: "[2,3,5,9]\n2", expectedOutput: "5" },
        { input: "[2,7,9,3,1]\n2", expectedOutput: "2" },
        { input: "[1,2,3,4,5,6]\n3", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 20 : 1000000000;
        const n = ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        const k = ri(rng, 1, Math.floor((n + 1) / 2));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minCapability(nums: List[int], k: int) -> int:\n    lo, hi = min(nums), max(nums)\n\n    def can(cap: int) -> bool:\n        cnt, i = 0, 0\n        while i < len(nums):\n            if nums[i] <= cap:\n                cnt += 1\n                i += 2\n            else:\n                i += 1\n        return cnt >= k\n\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if can(mid):\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var minCapability = function(nums, k) {\n    var lo = nums[0], hi = nums[0], i;\n    for (i = 1; i < nums.length; i++) {\n        if (nums[i] < lo) lo = nums[i];\n        if (nums[i] > hi) hi = nums[i];\n    }\n    var can = function(cap) {\n        var cnt = 0, j = 0;\n        while (j < nums.length) {\n            if (nums[j] <= cap) { cnt++; j += 2; } else j++;\n        }\n        return cnt >= k;\n    };\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (can(mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n};`,
        typescript: `function minCapability(nums: number[], k: number): number {\n    var lo = nums[0], hi = nums[0], i: number;\n    for (i = 1; i < nums.length; i++) {\n        if (nums[i] < lo) lo = nums[i];\n        if (nums[i] > hi) hi = nums[i];\n    }\n    var can = function(cap: number): boolean {\n        var cnt = 0, j = 0;\n        while (j < nums.length) {\n            if (nums[j] <= cap) { cnt++; j += 2; } else j++;\n        }\n        return cnt >= k;\n    };\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (can(mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        java: `private static boolean canRob(int[] nums, int k, int cap) {\n    int cnt = 0, i = 0;\n    while (i < nums.length) {\n        if (nums[i] <= cap) {\n            cnt++;\n            i += 2;\n        } else {\n            i++;\n        }\n    }\n    return cnt >= k;\n}\n\npublic static int minCapability(int[] nums, int k) {\n    int lo = nums[0], hi = nums[0];\n    for (int x : nums) {\n        lo = Math.min(lo, x);\n        hi = Math.max(hi, x);\n    }\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canRob(nums, k, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        cpp: `static bool canRob(vector<int>& nums, int k, int cap) {\n    int cnt = 0, i = 0;\n    while (i < (int) nums.size()) {\n        if (nums[i] <= cap) {\n            cnt++;\n            i += 2;\n        } else {\n            i++;\n        }\n    }\n    return cnt >= k;\n}\n\nint minCapability(vector<int>& nums, int k) {\n    int lo = nums[0], hi = nums[0];\n    for (int x : nums) {\n        lo = min(lo, x);\n        hi = max(hi, x);\n    }\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canRob(nums, k, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        c: `static int canRob(int* nums, int n, int k, int cap) {\n    int cnt = 0, i = 0;\n    while (i < n) {\n        if (nums[i] <= cap) {\n            cnt++;\n            i += 2;\n        } else {\n            i++;\n        }\n    }\n    return cnt >= k;\n}\n\nint minCapability(int* nums, int numsSize, int k) {\n    int lo = nums[0], hi = nums[0];\n    for (int i = 1; i < numsSize; i++) {\n        if (nums[i] < lo) lo = nums[i];\n        if (nums[i] > hi) hi = nums[i];\n    }\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (canRob(nums, numsSize, k, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        csharp: `private static bool CanRob(int[] nums, int k, int cap)\n{\n    int cnt = 0, i = 0;\n    while (i < nums.Length)\n    {\n        if (nums[i] <= cap)\n        {\n            cnt++;\n            i += 2;\n        }\n        else\n        {\n            i++;\n        }\n    }\n    return cnt >= k;\n}\n\npublic static int MinCapability(int[] nums, int k)\n{\n    int lo = nums[0], hi = nums[0];\n    foreach (int x in nums)\n    {\n        if (x < lo) lo = x;\n        if (x > hi) hi = x;\n    }\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (CanRob(nums, k, mid)) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        go: `func canRob(nums []int, k int, cap int) bool {\n\tcnt, i := 0, 0\n\tfor i < len(nums) {\n\t\tif nums[i] <= cap {\n\t\t\tcnt++\n\t\t\ti += 2\n\t\t} else {\n\t\t\ti++\n\t\t}\n\t}\n\treturn cnt >= k\n}\n\nfunc minCapability(nums []int, k int) int {\n\tlo, hi := nums[0], nums[0]\n\tfor _, x := range nums {\n\t\tif x < lo {\n\t\t\tlo = x\n\t\t}\n\t\tif x > hi {\n\t\t\thi = x\n\t\t}\n\t}\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif canRob(nums, k, mid) {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `private fun canRob(nums: IntArray, k: Int, cap: Int): Boolean {\n    var cnt = 0\n    var i = 0\n    while (i < nums.size) {\n        if (nums[i] <= cap) {\n            cnt++\n            i += 2\n        } else {\n            i++\n        }\n    }\n    return cnt >= k\n}\n\nfun minCapability(nums: IntArray, k: Int): Int {\n    var lo = nums[0]\n    var hi = nums[0]\n    for (x in nums) {\n        if (x < lo) lo = x\n        if (x > hi) hi = x\n    }\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (canRob(nums, k, mid)) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
        swift: `func minCapability(_ nums: [Int], _ k: Int) -> Int {\n    var lo = nums[0]\n    var hi = nums[0]\n    for x in nums {\n        if x < lo { lo = x }\n        if x > hi { hi = x }\n    }\n    func can(_ cap: Int) -> Bool {\n        var cnt = 0\n        var i = 0\n        while i < nums.count {\n            if nums[i] <= cap {\n                cnt += 1\n                i += 2\n            } else {\n                i += 1\n            }\n        }\n        return cnt >= k\n    }\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if can(mid) { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
        rust: `fn minCapability(nums: Vec<i32>, k: i32) -> i32 {\n    let mut lo = nums[0];\n    let mut hi = nums[0];\n    for &x in nums.iter() {\n        if x < lo {\n            lo = x;\n        }\n        if x > hi {\n            hi = x;\n        }\n    }\n    let can = |cap: i32| -> bool {\n        let mut cnt = 0i32;\n        let mut i = 0usize;\n        while i < nums.len() {\n            if nums[i] <= cap {\n                cnt += 1;\n                i += 2;\n            } else {\n                i += 1;\n            }\n        }\n        cnt >= k\n    };\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if can(mid) {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo\n}`,
        php: `function minCapability($nums, $k) {\n    $lo = min($nums);\n    $hi = max($nums);\n    $can = function($cap) use ($nums, $k) {\n        $cnt = 0;\n        $i = 0;\n        while ($i < count($nums)) {\n            if ($nums[$i] <= $cap) { $cnt++; $i += 2; } else $i++;\n        }\n        return $cnt >= $k;\n    };\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($can($mid)) $hi = $mid; else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
        ruby: `def minCapability(nums, k)\n  lo = nums.min\n  hi = nums.max\n  can = lambda do |cap|\n    cnt = 0\n    i = 0\n    while i < nums.length\n      if nums[i] <= cap\n        cnt += 1\n        i += 2\n      else\n        i += 1\n      end\n    end\n    cnt >= k\n  end\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if can.call(mid)\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Find Right Interval (LC 436) ────────────────────────────────
  (() => {
    const ref = (intervals: number[][]) => {
      const n = intervals.length;
      const starts = intervals.map((iv, i) => [iv[0], i]).sort((a, b) => a[0] - b[0]);
      const out = new Array(n).fill(-1);
      for (let i = 0; i < n; i++) {
        const end = intervals[i][1];
        let lo = 0, hi = n;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (starts[mid][0] >= end) hi = mid; else lo = mid + 1;
        }
        out[i] = lo === n ? -1 : starts[lo][1];
      }
      return out;
    };
    return {
      slug: "find-right-interval",
      title: "Find Right Interval",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Sorting", "Amazon", "Google", "Nutanix"],
      signature: { funcName: "findRightInterval", params: [{ name: "intervals", type: "int[][]" as const }], returns: "int[]" as const },
      description: describe(
        "`intervals[i] = [start_i, end_i]` and all starts are **distinct**.\n\nThe **right interval** of `i` is the interval `j` whose start is the smallest value at least `end_i` (possibly `i` itself). Return an array whose `i`-th entry is that index, or `-1` if no such interval exists.",
        [
          { in: "intervals = [[1,2]]", out: "[-1]", note: "No interval starts at or after 2." },
          { in: "intervals = [[3,4],[2,3],[1,2]]", out: "[-1,0,1]", note: "For [2,3] the smallest start at least 3 is 3, at index 0." },
          { in: "intervals = [[1,4],[2,3],[3,4]]", out: "[-1,2,-1]" },
        ],
        ["1 <= intervals.length <= 20000", "intervals[i].length == 2", "-1000000 <= start_i <= end_i <= 1000000", "All starts are distinct."]),
      hints: [
        "Collect the starts together with their original indices and sort them.",
        "For each interval, the answer is a lower-bound query on that sorted list.",
        "The original index has to travel with the start, or the answer refers to the wrong interval.",
      ],
      editorial: explain({
        idea: "Sort the starts once, keeping each one paired with the index it came from. Then each query is a lower bound: the first start at least `end_i`.",
        steps: [
          "Build pairs `(start_i, i)` and sort them by start.",
          "For each `i`, binary search the first pair whose start is at least `intervals[i][1]`.",
          "Write that pair's original index, or `-1` when the search runs past the end.",
        ],
        why: "Starts are distinct, so the sorted list has a unique first element at or above any threshold, and the lower bound finds it. Carrying the original index through the sort is what lets the answer be reported in terms of the input's ordering — the sorted position is not the answer.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Returning the sorted position instead of the original index.",
          "Using a strict `>` misses the case where an interval's own start equals its end.",
          "An interval can be its own right interval when `start_i == end_i`.",
        ],
      }),
      examples: [
        { input: "[[1,2]]", expectedOutput: "[-1]" },
        { input: "[[3,4],[2,3],[1,2]]", expectedOutput: "[-1,0,1]" },
        { input: "[[1,4],[2,3],[3,4]]", expectedOutput: "[-1,2,-1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20);
        const span = rng() < 0.6 ? 30 : 1000000;
        const used: Record<number, boolean> = {};
        const intervals: number[][] = [];
        let guard = 0;
        while (intervals.length < n && guard < 400) {
          guard++;
          const s = ri(rng, -span, span);
          if (used[s]) continue;
          used[s] = true;
          intervals.push([s, s + ri(rng, 0, 20)]);
        }
        return { input: fmtIntMat(intervals), expectedOutput: fmtIntArr(ref(intervals)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findRightInterval(intervals: List[List[int]]) -> List[int]:\n    n = len(intervals)\n    starts = sorted((iv[0], i) for i, iv in enumerate(intervals))\n    out = [-1] * n\n    for i, iv in enumerate(intervals):\n        end = iv[1]\n        lo, hi = 0, n\n        while lo < hi:\n            mid = (lo + hi) // 2\n            if starts[mid][0] >= end:\n                hi = mid\n            else:\n                lo = mid + 1\n        out[i] = -1 if lo == n else starts[lo][1]\n    return out`,
        javascript: `var findRightInterval = function(intervals) {\n    var n = intervals.length;\n    var starts = [];\n    for (var t = 0; t < n; t++) starts.push([intervals[t][0], t]);\n    starts.sort(function(a, b) { return a[0] - b[0]; });\n    var out = [];\n    for (var i = 0; i < n; i++) {\n        var end = intervals[i][1];\n        var lo = 0, hi = n;\n        while (lo < hi) {\n            var mid = (lo + hi) >> 1;\n            if (starts[mid][0] >= end) hi = mid; else lo = mid + 1;\n        }\n        out.push(lo === n ? -1 : starts[lo][1]);\n    }\n    return out;\n};`,
        typescript: `function findRightInterval(intervals: number[][]): number[] {\n    var n = intervals.length;\n    var starts: number[][] = [];\n    for (var t = 0; t < n; t++) starts.push([intervals[t][0], t]);\n    starts.sort(function(a, b) { return a[0] - b[0]; });\n    var out: number[] = [];\n    for (var i = 0; i < n; i++) {\n        var end = intervals[i][1];\n        var lo = 0, hi = n;\n        while (lo < hi) {\n            var mid = (lo + hi) >> 1;\n            if (starts[mid][0] >= end) hi = mid; else lo = mid + 1;\n        }\n        out.push(lo === n ? -1 : starts[lo][1]);\n    }\n    return out;\n}`,
        java: `public static int[] findRightInterval(int[][] intervals) {\n    int n = intervals.length;\n    int[][] starts = new int[n][2];\n    for (int i = 0; i < n; i++) {\n        starts[i][0] = intervals[i][0];\n        starts[i][1] = i;\n    }\n    Arrays.sort(starts, (a, b) -> Integer.compare(a[0], b[0]));\n    int[] out = new int[n];\n    for (int i = 0; i < n; i++) {\n        int end = intervals[i][1];\n        int lo = 0, hi = n;\n        while (lo < hi) {\n            int mid = (lo + hi) >>> 1;\n            if (starts[mid][0] >= end) hi = mid; else lo = mid + 1;\n        }\n        out[i] = lo == n ? -1 : starts[lo][1];\n    }\n    return out;\n}`,
        cpp: `vector<int> findRightInterval(vector<vector<int>>& intervals) {\n    int n = (int) intervals.size();\n    vector<pair<int, int>> starts(n);\n    for (int i = 0; i < n; i++) starts[i] = make_pair(intervals[i][0], i);\n    sort(starts.begin(), starts.end());\n    vector<int> out(n, -1);\n    for (int i = 0; i < n; i++) {\n        int end = intervals[i][1];\n        int lo = 0, hi = n;\n        while (lo < hi) {\n            int mid = (lo + hi) / 2;\n            if (starts[mid].first >= end) hi = mid; else lo = mid + 1;\n        }\n        out[i] = lo == n ? -1 : starts[lo].second;\n    }\n    return out;\n}`,
        c: `static int cmpStartPair(const void* a, const void* b) {\n    const int* x = (const int*) a;\n    const int* y = (const int*) b;\n    return (x[0] > y[0]) - (x[0] < y[0]);\n}\n\nint* findRightInterval(int** intervals, int intervalsSize, int* intervalsColSize, int* returnSize) {\n    (void) intervalsColSize;\n    int n = intervalsSize;\n    int (*starts)[2] = malloc((size_t) n * sizeof(*starts));\n    for (int i = 0; i < n; i++) {\n        starts[i][0] = intervals[i][0];\n        starts[i][1] = i;\n    }\n    qsort(starts, (size_t) n, sizeof(*starts), cmpStartPair);\n    int* out = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        int end = intervals[i][1];\n        int lo = 0, hi = n;\n        while (lo < hi) {\n            int mid = (lo + hi) / 2;\n            if (starts[mid][0] >= end) hi = mid; else lo = mid + 1;\n        }\n        out[i] = lo == n ? -1 : starts[lo][1];\n    }\n    free(starts);\n    *returnSize = n;\n    return out;\n}`,
        csharp: `public static int[] FindRightInterval(int[][] intervals)\n{\n    int n = intervals.Length;\n    var starts = new int[n][];\n    for (int i = 0; i < n; i++) starts[i] = new int[] { intervals[i][0], i };\n    Array.Sort(starts, (a, b) => a[0].CompareTo(b[0]));\n    int[] out_ = new int[n];\n    for (int i = 0; i < n; i++)\n    {\n        int end = intervals[i][1];\n        int lo = 0, hi = n;\n        while (lo < hi)\n        {\n            int mid = (lo + hi) / 2;\n            if (starts[mid][0] >= end) hi = mid; else lo = mid + 1;\n        }\n        out_[i] = lo == n ? -1 : starts[lo][1];\n    }\n    return out_;\n}`,
        go: `func findRightInterval(intervals [][]int) []int {\n\tn := len(intervals)\n\tstarts := make([][2]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tstarts[i] = [2]int{intervals[i][0], i}\n\t}\n\tsort.Slice(starts, func(a, b int) bool { return starts[a][0] < starts[b][0] })\n\tout := make([]int, n)\n\tfor i := 0; i < n; i++ {\n\t\tend := intervals[i][1]\n\t\tlo, hi := 0, n\n\t\tfor lo < hi {\n\t\t\tmid := (lo + hi) / 2\n\t\t\tif starts[mid][0] >= end {\n\t\t\t\thi = mid\n\t\t\t} else {\n\t\t\t\tlo = mid + 1\n\t\t\t}\n\t\t}\n\t\tif lo == n {\n\t\t\tout[i] = -1\n\t\t} else {\n\t\t\tout[i] = starts[lo][1]\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun findRightInterval(intervals: Array<IntArray>): IntArray {\n    val n = intervals.size\n    val starts = Array(n) { intArrayOf(intervals[it][0], it) }\n    starts.sortBy { it[0] }\n    val out = IntArray(n)\n    for (i in 0 until n) {\n        val end = intervals[i][1]\n        var lo = 0\n        var hi = n\n        while (lo < hi) {\n            val mid = (lo + hi) / 2\n            if (starts[mid][0] >= end) hi = mid else lo = mid + 1\n        }\n        out[i] = if (lo == n) -1 else starts[lo][1]\n    }\n    return out\n}`,
        swift: `func findRightInterval(_ intervals: [[Int]]) -> [Int] {\n    let n = intervals.count\n    var starts = (0..<n).map { (intervals[$0][0], $0) }\n    starts.sort { $0.0 < $1.0 }\n    var out = [Int](repeating: -1, count: n)\n    for i in 0..<n {\n        let end = intervals[i][1]\n        var lo = 0\n        var hi = n\n        while lo < hi {\n            let mid = (lo + hi) / 2\n            if starts[mid].0 >= end { hi = mid } else { lo = mid + 1 }\n        }\n        out[i] = lo == n ? -1 : starts[lo].1\n    }\n    return out\n}`,
        rust: `fn findRightInterval(intervals: Vec<Vec<i32>>) -> Vec<i32> {\n    let n = intervals.len();\n    let mut starts: Vec<(i32, usize)> = (0..n).map(|i| (intervals[i][0], i)).collect();\n    starts.sort();\n    let mut out = vec![-1i32; n];\n    for i in 0..n {\n        let end = intervals[i][1];\n        let mut lo = 0usize;\n        let mut hi = n;\n        while lo < hi {\n            let mid = (lo + hi) / 2;\n            if starts[mid].0 >= end {\n                hi = mid;\n            } else {\n                lo = mid + 1;\n            }\n        }\n        out[i] = if lo == n { -1 } else { starts[lo].1 as i32 };\n    }\n    out\n}`,
        php: `function findRightInterval($intervals) {\n    $n = count($intervals);\n    $starts = [];\n    for ($i = 0; $i < $n; $i++) $starts[] = [$intervals[$i][0], $i];\n    usort($starts, function($a, $b) { return $a[0] - $b[0]; });\n    $out = [];\n    for ($i = 0; $i < $n; $i++) {\n        $end = $intervals[$i][1];\n        $lo = 0;\n        $hi = $n;\n        while ($lo < $hi) {\n            $mid = intdiv($lo + $hi, 2);\n            if ($starts[$mid][0] >= $end) $hi = $mid; else $lo = $mid + 1;\n        }\n        $out[] = $lo === $n ? -1 : $starts[$lo][1];\n    }\n    return $out;\n}`,
        ruby: `def findRightInterval(intervals)\n  n = intervals.length\n  starts = intervals.each_with_index.map { |iv, i| [iv[0], i] }.sort_by { |p| p[0] }\n  out = []\n  intervals.each do |iv|\n    fin = iv[1]\n    lo = 0\n    hi = n\n    while lo < hi\n      mid = (lo + hi) / 2\n      if starts[mid][0] >= fin\n        hi = mid\n      else\n        lo = mid + 1\n      end\n    end\n    out << (lo == n ? -1 : starts[lo][1])\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Search a 2D Matrix II (LC 240) ──────────────────────────────
  (() => {
    const ref = (matrix: number[][], target: number) => {
      let r = 0, c = matrix[0].length - 1;
      while (r < matrix.length && c >= 0) {
        if (matrix[r][c] === target) return true;
        if (matrix[r][c] > target) c--; else r++;
      }
      return false;
    };
    return {
      slug: "search-a-2d-matrix-ii",
      title: "Search a 2D Matrix II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Matrix", "Binary Search", "Divide and Conquer", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "searchMatrix", params: [{ name: "matrix", type: "int[][]" as const }, { name: "target", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Each row of `matrix` is sorted in ascending order left to right, and each column is sorted in ascending order top to bottom. Unlike the simpler version, rows do **not** continue from one another.\n\nReturn whether `target` is present.",
        [
          { in: "matrix = [[1,4,7,11],[2,5,8,12],[3,6,9,16],[10,13,14,17]], target = 5", out: "true" },
          { in: "matrix = [[1,4,7,11],[2,5,8,12],[3,6,9,16],[10,13,14,17]], target = 20", out: "false" },
          { in: "matrix = [[5]], target = 5", out: "true" },
        ],
        ["1 <= rows, cols <= 300", "-1000000000 <= matrix[i][j], target <= 1000000000", "Each row is sorted ascending; each column is sorted ascending."]),
      hints: [
        "Flattening the matrix does not give a sorted array here, so a single binary search will not work.",
        "Start at the **top-right** corner: it is the largest in its row and the smallest in its column.",
        "Each comparison eliminates a whole row or a whole column.",
      ],
      editorial: explain({
        idea: "The top-right corner is a decision point: it is the maximum of its row and the minimum of its column, so comparing it with the target rules out one entire line each step. That is the staircase search.",
        steps: [
          "Start at row 0, last column.",
          "If the value equals the target, answer true.",
          "If it is greater, no value in that column can be the target, so move left.",
          "If it is smaller, no value in that row can be the target, so move down.",
        ],
        why: "At the top-right, everything below in the column is larger and everything left in the row is smaller. So a value greater than the target eliminates its column (all larger still), and a value smaller eliminates its row (all smaller to the left). Each step removes a row or a column, giving `O(m + n)` — better than the `O(m log n)` of binary-searching each row.",
        time: "O(m + n)",
        space: "O(1)",
        pitfalls: [
          "Starting at the top-left or bottom-right gives no usable decision — both directions increase or both decrease.",
          "Treating the matrix as one sorted array is the previous problem's structure, not this one's.",
          "The bounds check must cover both the row and the column.",
        ],
      }),
      examples: [
        { input: "[[1,4,7,11],[2,5,8,12],[3,6,9,16],[10,13,14,17]]\n5", expectedOutput: "true" },
        { input: "[[1,4,7,11],[2,5,8,12],[3,6,9,16],[10,13,14,17]]\n20", expectedOutput: "false" },
        { input: "[[5]]\n5", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        // matrix[i][j] = rowBase[i] + colBase[j] is sorted along both axes.
        const m = ri(rng, 1, 8);
        const n = ri(rng, 1, 8);
        const rowBase: number[] = [];
        let v = ri(rng, -50, 50);
        for (let i = 0; i < m; i++) { rowBase.push(v); v += ri(rng, 1, 9); }
        const colBase: number[] = [];
        let w = ri(rng, -50, 50);
        for (let j = 0; j < n; j++) { colBase.push(w); w += ri(rng, 1, 9); }
        const matrix = rowBase.map((rb) => colBase.map((cb) => rb + cb));
        const target = rng() < 0.55 ? matrix[ri(rng, 0, m - 1)][ri(rng, 0, n - 1)] : ri(rng, -120, 120);
        return { input: `${fmtIntMat(matrix)}\n${target}`, expectedOutput: bool(ref(matrix, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef searchMatrix(matrix: List[List[int]], target: int) -> bool:\n    r, c = 0, len(matrix[0]) - 1\n    while r < len(matrix) and c >= 0:\n        if matrix[r][c] == target:\n            return True\n        if matrix[r][c] > target:\n            c -= 1\n        else:\n            r += 1\n    return False`,
        javascript: `var searchMatrix = function(matrix, target) {\n    var r = 0, c = matrix[0].length - 1;\n    while (r < matrix.length && c >= 0) {\n        if (matrix[r][c] === target) return true;\n        if (matrix[r][c] > target) c--; else r++;\n    }\n    return false;\n};`,
        typescript: `function searchMatrix(matrix: number[][], target: number): boolean {\n    var r = 0, c = matrix[0].length - 1;\n    while (r < matrix.length && c >= 0) {\n        if (matrix[r][c] === target) return true;\n        if (matrix[r][c] > target) c--; else r++;\n    }\n    return false;\n}`,
        java: `public static boolean searchMatrix(int[][] matrix, int target) {\n    int r = 0, c = matrix[0].length - 1;\n    while (r < matrix.length && c >= 0) {\n        if (matrix[r][c] == target) return true;\n        if (matrix[r][c] > target) c--; else r++;\n    }\n    return false;\n}`,
        cpp: `bool searchMatrix(vector<vector<int>>& matrix, int target) {\n    int r = 0, c = (int) matrix[0].size() - 1;\n    while (r < (int) matrix.size() && c >= 0) {\n        if (matrix[r][c] == target) return true;\n        if (matrix[r][c] > target) c--; else r++;\n    }\n    return false;\n}`,
        c: `bool searchMatrix(int** matrix, int matrixSize, int* matrixColSize, int target) {\n    int r = 0, c = matrixColSize[0] - 1;\n    while (r < matrixSize && c >= 0) {\n        if (matrix[r][c] == target) return true;\n        if (matrix[r][c] > target) c--; else r++;\n    }\n    return false;\n}`,
        csharp: `public static bool SearchMatrix(int[][] matrix, int target)\n{\n    int r = 0, c = matrix[0].Length - 1;\n    while (r < matrix.Length && c >= 0)\n    {\n        if (matrix[r][c] == target) return true;\n        if (matrix[r][c] > target) c--; else r++;\n    }\n    return false;\n}`,
        go: `func searchMatrix(matrix [][]int, target int) bool {\n\tr, c := 0, len(matrix[0])-1\n\tfor r < len(matrix) && c >= 0 {\n\t\tif matrix[r][c] == target {\n\t\t\treturn true\n\t\t}\n\t\tif matrix[r][c] > target {\n\t\t\tc--\n\t\t} else {\n\t\t\tr++\n\t\t}\n\t}\n\treturn false\n}`,
        kotlin: `fun searchMatrix(matrix: Array<IntArray>, target: Int): Boolean {\n    var r = 0\n    var c = matrix[0].size - 1\n    while (r < matrix.size && c >= 0) {\n        if (matrix[r][c] == target) return true\n        if (matrix[r][c] > target) c-- else r++\n    }\n    return false\n}`,
        swift: `func searchMatrix(_ matrix: [[Int]], _ target: Int) -> Bool {\n    var r = 0\n    var c = matrix[0].count - 1\n    while r < matrix.count && c >= 0 {\n        if matrix[r][c] == target { return true }\n        if matrix[r][c] > target { c -= 1 } else { r += 1 }\n    }\n    return false\n}`,
        rust: `fn searchMatrix(matrix: Vec<Vec<i32>>, target: i32) -> bool {\n    let mut r: i32 = 0;\n    let mut c: i32 = matrix[0].len() as i32 - 1;\n    while r < matrix.len() as i32 && c >= 0 {\n        let v = matrix[r as usize][c as usize];\n        if v == target {\n            return true;\n        }\n        if v > target {\n            c -= 1;\n        } else {\n            r += 1;\n        }\n    }\n    false\n}`,
        php: `function searchMatrix($matrix, $target) {\n    $r = 0;\n    $c = count($matrix[0]) - 1;\n    while ($r < count($matrix) && $c >= 0) {\n        if ($matrix[$r][$c] === $target) return true;\n        if ($matrix[$r][$c] > $target) $c--; else $r++;\n    }\n    return false;\n}`,
        ruby: `def searchMatrix(matrix, target)\n  r = 0\n  c = matrix[0].length - 1\n  while r < matrix.length && c >= 0\n    return true if matrix[r][c] == target\n    if matrix[r][c] > target\n      c -= 1\n    else\n      r += 1\n    end\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Successful Pairs of Spells and Potions (LC 2300) ────────────
  (() => {
    const ref = (spells: number[], potions: number[], success: number) => {
      const sorted = potions.slice().sort((a, b) => a - b);
      const n = sorted.length;
      return spells.map((sp) => {
        let lo = 0, hi = n;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (sp * sorted[mid] >= success) hi = mid; else lo = mid + 1;
        }
        return n - lo;
      });
    };
    return {
      slug: "successful-pairs-of-spells-and-potions",
      title: "Successful Pairs of Spells and Potions",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Sorting", "Two Pointers", "Amazon", "Google", "Razorpay"],
      signature: { funcName: "successfulPairs", params: [{ name: "spells", type: "int[]" as const }, { name: "potions", type: "int[]" as const }, { name: "success", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "A pair of a spell and a potion is **successful** when the product of their strengths is at least `success`.\n\nReturn an array whose `i`-th entry is the number of potions that form a successful pair with spell `i`.",
        [
          { in: "spells = [5,1,3], potions = [1,2,3,4,5], success = 7", out: "[4,0,3]", note: "Spell 5 succeeds with potions 2, 3, 4 and 5." },
          { in: "spells = [3,1,2], potions = [8,5,8], success = 16", out: "[2,0,2]" },
          { in: "spells = [1], potions = [1], success = 1", out: "[1]" },
        ],
        ["1 <= spells.length, potions.length <= 100000", "1 <= spells[i], potions[j] <= 100000", "1 <= success <= 1000000000"]),
      hints: [
        "Sort the potions once, then answer each spell with a binary search.",
        "For spell `s`, the successful potions are those with strength at least `success / s` — a suffix of the sorted list.",
        "Compare with a multiplication rather than a division, so no rounding is involved.",
      ],
      editorial: explain({
        idea: "Sorting the potions turns each spell's question into a lower-bound search: find the first potion whose product with this spell reaches `success`; everything after it works too.",
        steps: [
          "Sort `potions` ascending.",
          "For each spell `sp`, binary search the first index where `sp · potions[mid] >= success`.",
          "The count is `potions.length - that index`.",
        ],
        why: "For a fixed positive `sp`, the product is increasing in the potion's strength, so the successful potions form a suffix of the sorted array and the boundary is unique. Testing with a multiplication avoids the rounding trap of `ceil(success / sp)`, which is easy to get wrong when the division is not exact.",
        time: "O((n + m) log m)",
        space: "O(m)",
        pitfalls: [
          "`spells[i] · potions[j]` reaches `10^5 · 10^5 = 10^10` — the comparison needs 64-bit.",
          "Dividing instead of multiplying needs a ceiling and rounds wrongly at exact multiples.",
          "The answer counts potions, so it is `m - index`, not the index itself.",
        ],
      }),
      examples: [
        { input: "[5,1,3]\n[1,2,3,4,5]\n7", expectedOutput: "[4,0,3]" },
        { input: "[3,1,2]\n[8,5,8]\n16", expectedOutput: "[2,0,2]" },
        { input: "[1]\n[1]\n1", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 25 : 100000;
        const spells = Array.from({ length: ri(rng, 1, 20) }, () => ri(rng, 1, hi));
        const potions = Array.from({ length: ri(rng, 1, 20) }, () => ri(rng, 1, hi));
        const success = rng() < 0.6 ? ri(rng, 1, hi * 2) : ri(rng, 1, 1000000000);
        return { input: `${fmtIntArr(spells)}\n${fmtIntArr(potions)}\n${success}`, expectedOutput: fmtIntArr(ref(spells, potions, success)) };
      },
      solutions: {
        python: `from typing import List\n\ndef successfulPairs(spells: List[int], potions: List[int], success: int) -> List[int]:\n    sorted_potions = sorted(potions)\n    n = len(sorted_potions)\n    out = []\n    for sp in spells:\n        lo, hi = 0, n\n        while lo < hi:\n            mid = (lo + hi) // 2\n            if sp * sorted_potions[mid] >= success:\n                hi = mid\n            else:\n                lo = mid + 1\n        out.append(n - lo)\n    return out`,
        javascript: `var successfulPairs = function(spells, potions, success) {\n    var sorted = potions.slice().sort(function(a, b) { return a - b; });\n    var n = sorted.length;\n    var out = [];\n    for (var i = 0; i < spells.length; i++) {\n        var sp = spells[i];\n        var lo = 0, hi = n;\n        while (lo < hi) {\n            var mid = (lo + hi) >> 1;\n            if (sp * sorted[mid] >= success) hi = mid; else lo = mid + 1;\n        }\n        out.push(n - lo);\n    }\n    return out;\n};`,
        typescript: `function successfulPairs(spells: number[], potions: number[], success: number): number[] {\n    var sorted = potions.slice().sort(function(a, b) { return a - b; });\n    var n = sorted.length;\n    var out: number[] = [];\n    for (var i = 0; i < spells.length; i++) {\n        var sp = spells[i];\n        var lo = 0, hi = n;\n        while (lo < hi) {\n            var mid = (lo + hi) >> 1;\n            if (sp * sorted[mid] >= success) hi = mid; else lo = mid + 1;\n        }\n        out.push(n - lo);\n    }\n    return out;\n}`,
        java: `public static int[] successfulPairs(int[] spells, int[] potions, int success) {\n    int[] sorted = potions.clone();\n    Arrays.sort(sorted);\n    int n = sorted.length;\n    int[] out = new int[spells.length];\n    for (int i = 0; i < spells.length; i++) {\n        long sp = spells[i];\n        int lo = 0, hi = n;\n        while (lo < hi) {\n            int mid = (lo + hi) >>> 1;\n            if (sp * sorted[mid] >= success) hi = mid; else lo = mid + 1;\n        }\n        out[i] = n - lo;\n    }\n    return out;\n}`,
        cpp: `vector<int> successfulPairs(vector<int>& spells, vector<int>& potions, int success) {\n    vector<int> sorted = potions;\n    sort(sorted.begin(), sorted.end());\n    int n = (int) sorted.size();\n    vector<int> out;\n    for (int sp : spells) {\n        int lo = 0, hi = n;\n        while (lo < hi) {\n            int mid = (lo + hi) / 2;\n            if ((long long) sp * sorted[mid] >= success) hi = mid; else lo = mid + 1;\n        }\n        out.push_back(n - lo);\n    }\n    return out;\n}`,
        c: `static int cmpPotionAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint* successfulPairs(int* spells, int spellsSize, int* potions, int potionsSize, int success, int* returnSize) {\n    int* sorted = (int*) malloc((size_t) potionsSize * sizeof(int));\n    for (int i = 0; i < potionsSize; i++) sorted[i] = potions[i];\n    qsort(sorted, (size_t) potionsSize, sizeof(int), cmpPotionAsc);\n    int* out = (int*) malloc((size_t) spellsSize * sizeof(int));\n    for (int i = 0; i < spellsSize; i++) {\n        long long sp = spells[i];\n        int lo = 0, hi = potionsSize;\n        while (lo < hi) {\n            int mid = (lo + hi) / 2;\n            if (sp * sorted[mid] >= (long long) success) hi = mid; else lo = mid + 1;\n        }\n        out[i] = potionsSize - lo;\n    }\n    free(sorted);\n    *returnSize = spellsSize;\n    return out;\n}`,
        csharp: `public static int[] SuccessfulPairs(int[] spells, int[] potions, int success)\n{\n    int[] sorted = (int[]) potions.Clone();\n    Array.Sort(sorted);\n    int n = sorted.Length;\n    int[] out_ = new int[spells.Length];\n    for (int i = 0; i < spells.Length; i++)\n    {\n        long sp = spells[i];\n        int lo = 0, hi = n;\n        while (lo < hi)\n        {\n            int mid = (lo + hi) / 2;\n            if (sp * sorted[mid] >= success) hi = mid; else lo = mid + 1;\n        }\n        out_[i] = n - lo;\n    }\n    return out_;\n}`,
        go: `func successfulPairs(spells []int, potions []int, success int) []int {\n\tsorted := append([]int{}, potions...)\n\tsort.Ints(sorted)\n\tn := len(sorted)\n\tout := make([]int, len(spells))\n\tfor i, sp := range spells {\n\t\tlo, hi := 0, n\n\t\tfor lo < hi {\n\t\t\tmid := (lo + hi) / 2\n\t\t\tif sp*sorted[mid] >= success {\n\t\t\t\thi = mid\n\t\t\t} else {\n\t\t\t\tlo = mid + 1\n\t\t\t}\n\t\t}\n\t\tout[i] = n - lo\n\t}\n\treturn out\n}`,
        kotlin: `fun successfulPairs(spells: IntArray, potions: IntArray, success: Int): IntArray {\n    val sorted = potions.sortedArray()\n    val n = sorted.size\n    val out = IntArray(spells.size)\n    for (i in spells.indices) {\n        val sp = spells[i].toLong()\n        var lo = 0\n        var hi = n\n        while (lo < hi) {\n            val mid = (lo + hi) / 2\n            if (sp * sorted[mid] >= success) hi = mid else lo = mid + 1\n        }\n        out[i] = n - lo\n    }\n    return out\n}`,
        swift: `func successfulPairs(_ spells: [Int], _ potions: [Int], _ success: Int) -> [Int] {\n    let sorted = potions.sorted()\n    let n = sorted.count\n    var out = [Int]()\n    for sp in spells {\n        var lo = 0\n        var hi = n\n        while lo < hi {\n            let mid = (lo + hi) / 2\n            if sp * sorted[mid] >= success { hi = mid } else { lo = mid + 1 }\n        }\n        out.append(n - lo)\n    }\n    return out\n}`,
        rust: `fn successfulPairs(spells: Vec<i32>, potions: Vec<i32>, success: i32) -> Vec<i32> {\n    let mut sorted = potions.clone();\n    sorted.sort();\n    let n = sorted.len();\n    let mut out = Vec::with_capacity(spells.len());\n    for &sp in spells.iter() {\n        let mut lo = 0usize;\n        let mut hi = n;\n        while lo < hi {\n            let mid = (lo + hi) / 2;\n            if sp as i64 * sorted[mid] as i64 >= success as i64 {\n                hi = mid;\n            } else {\n                lo = mid + 1;\n            }\n        }\n        out.push((n - lo) as i32);\n    }\n    out\n}`,
        php: `function successfulPairs($spells, $potions, $success) {\n    $sorted = $potions;\n    sort($sorted);\n    $n = count($sorted);\n    $out = [];\n    foreach ($spells as $sp) {\n        $lo = 0;\n        $hi = $n;\n        while ($lo < $hi) {\n            $mid = intdiv($lo + $hi, 2);\n            if ($sp * $sorted[$mid] >= $success) $hi = $mid; else $lo = $mid + 1;\n        }\n        $out[] = $n - $lo;\n    }\n    return $out;\n}`,
        ruby: `def successfulPairs(spells, potions, success)\n  sorted = potions.sort\n  n = sorted.length\n  spells.map do |sp|\n    lo = 0\n    hi = n\n    while lo < hi\n      mid = (lo + hi) / 2\n      if sp * sorted[mid] >= success\n        hi = mid\n      else\n        lo = mid + 1\n      end\n    end\n    n - lo\n  end\nend`,
      },
    };
  })(),

  // ── Divide Chocolate (LC 1231) ──────────────────────────────────
  (() => {
    const ref = (sweetness: number[], k: number) => {
      let lo = sweetness[0], total = 0;
      for (let i = 0; i < sweetness.length; i++) {
        if (sweetness[i] < lo) lo = sweetness[i];
        total += sweetness[i];
      }
      let hi = Math.floor(total / (k + 1));
      const can = (minSweet: number) => {
        let pieces = 0, cur = 0;
        for (let i = 0; i < sweetness.length; i++) {
          cur += sweetness[i];
          if (cur >= minSweet) { pieces++; cur = 0; }
        }
        return pieces >= k + 1;
      };
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (can(mid)) lo = mid; else hi = mid - 1;
      }
      return lo;
    };
    return {
      slug: "divide-chocolate",
      title: "Divide Chocolate",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Greedy", "Amazon", "Google", "Zoho"],
      signature: { funcName: "maximizeSweetness", params: [{ name: "sweetness", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A chocolate bar is a row of chunks with the given sweetness values. You make `k` cuts between chunks, producing `k + 1` **consecutive** pieces, and give one piece to each of your `k` friends — keeping the least sweet piece for yourself.\n\nReturn the maximum total sweetness your piece can have.",
        [
          { in: "sweetness = [1,2,3,4,5,6,7,8,9], k = 5", out: "6", note: "Cut into [1,2,3], [4,5], [6], [7], [8] and [9]." },
          { in: "sweetness = [5,6,7,8,9,1,2,3,4], k = 8", out: "1", note: "Every chunk becomes its own piece." },
          { in: "sweetness = [1,2,2,1,2,2,1,2,2], k = 2", out: "5" },
        ],
        ["0 <= k < sweetness.length <= 10000", "1 <= sweetness[i] <= 100000"]),
      hints: [
        "You keep the *minimum* piece, so this is a maximise-the-minimum problem — binary search the answer.",
        "For a candidate minimum `m`, greedily cut as soon as the running sum reaches `m`.",
        "Feasible when that produces at least `k + 1` pieces.",
      ],
      editorial: explain({
        idea: "Binary search the value of your piece. For a candidate minimum `m`, the greedy that closes a piece the moment its sum reaches `m` produces the most pieces of sweetness at least `m`, so it decides feasibility exactly.",
        steps: [
          "Search `m` over `[min(sweetness), total / (k + 1)]`.",
          "`can(m)`: accumulate chunks, closing a piece each time the running sum reaches `m`; feasible when at least `k + 1` pieces close.",
          "Take the largest feasible `m`, using the upper-biased midpoint.",
        ],
        why: "Closing a piece as soon as it qualifies is optimal: carrying extra sweetness forward can only make later pieces harder to fill, never easier. Raising `m` makes each piece need more chunks, so the piece count is non-increasing — the monotonicity binary search needs. The upper bound `total / (k + 1)` holds because the pieces partition the bar.",
        time: "O(n log S) where S is the total sweetness",
        space: "O(1)",
        pitfalls: [
          "`k` cuts make `k + 1` pieces — the off-by-one here is the usual mistake.",
          "The upper-biased midpoint is required for a maximise search, or the loop never terminates.",
          "Leftover chunks after the last closed piece simply join it, which is why only the piece count is checked.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5,6,7,8,9]\n5", expectedOutput: "6" },
        { input: "[5,6,7,8,9,1,2,3,4]\n8", expectedOutput: "1" },
        { input: "[1,2,2,1,2,2,1,2,2]\n2", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const hi = rng() < 0.6 ? 20 : 100000;
        const sweetness = Array.from({ length: n }, () => ri(rng, 1, hi));
        const k = ri(rng, 0, n - 1);
        return { input: `${fmtIntArr(sweetness)}\n${k}`, expectedOutput: String(ref(sweetness, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximizeSweetness(sweetness: List[int], k: int) -> int:\n    lo, hi = min(sweetness), sum(sweetness) // (k + 1)\n\n    def can(m: int) -> bool:\n        pieces, cur = 0, 0\n        for s in sweetness:\n            cur += s\n            if cur >= m:\n                pieces += 1\n                cur = 0\n        return pieces >= k + 1\n\n    while lo < hi:\n        mid = (lo + hi + 1) // 2\n        if can(mid):\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo`,
        javascript: `var maximizeSweetness = function(sweetness, k) {\n    var lo = sweetness[0], total = 0, i;\n    for (i = 0; i < sweetness.length; i++) {\n        if (sweetness[i] < lo) lo = sweetness[i];\n        total += sweetness[i];\n    }\n    var hi = Math.floor(total / (k + 1));\n    var can = function(m) {\n        var pieces = 0, cur = 0;\n        for (var j = 0; j < sweetness.length; j++) {\n            cur += sweetness[j];\n            if (cur >= m) { pieces++; cur = 0; }\n        }\n        return pieces >= k + 1;\n    };\n    while (lo < hi) {\n        var mid = Math.ceil((lo + hi) / 2);\n        if (can(mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n};`,
        typescript: `function maximizeSweetness(sweetness: number[], k: number): number {\n    var lo = sweetness[0], total = 0, i: number;\n    for (i = 0; i < sweetness.length; i++) {\n        if (sweetness[i] < lo) lo = sweetness[i];\n        total += sweetness[i];\n    }\n    var hi = Math.floor(total / (k + 1));\n    var can = function(m: number): boolean {\n        var pieces = 0, cur = 0;\n        for (var j = 0; j < sweetness.length; j++) {\n            cur += sweetness[j];\n            if (cur >= m) { pieces++; cur = 0; }\n        }\n        return pieces >= k + 1;\n    };\n    while (lo < hi) {\n        var mid = Math.ceil((lo + hi) / 2);\n        if (can(mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        java: `private static boolean canSweeten(int[] sweetness, int k, int m) {\n    int pieces = 0, cur = 0;\n    for (int s : sweetness) {\n        cur += s;\n        if (cur >= m) {\n            pieces++;\n            cur = 0;\n        }\n    }\n    return pieces >= k + 1;\n}\n\npublic static int maximizeSweetness(int[] sweetness, int k) {\n    int lo = sweetness[0];\n    long total = 0;\n    for (int s : sweetness) {\n        lo = Math.min(lo, s);\n        total += s;\n    }\n    int hi = (int) (total / (k + 1));\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (canSweeten(sweetness, k, mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        cpp: `static bool canSweeten(vector<int>& sweetness, int k, int m) {\n    int pieces = 0, cur = 0;\n    for (int s : sweetness) {\n        cur += s;\n        if (cur >= m) {\n            pieces++;\n            cur = 0;\n        }\n    }\n    return pieces >= k + 1;\n}\n\nint maximizeSweetness(vector<int>& sweetness, int k) {\n    int lo = sweetness[0];\n    long long total = 0;\n    for (int s : sweetness) {\n        lo = min(lo, s);\n        total += s;\n    }\n    int hi = (int) (total / (k + 1));\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (canSweeten(sweetness, k, mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        c: `static int canSweeten(int* sweetness, int n, int k, int m) {\n    int pieces = 0, cur = 0;\n    for (int i = 0; i < n; i++) {\n        cur += sweetness[i];\n        if (cur >= m) {\n            pieces++;\n            cur = 0;\n        }\n    }\n    return pieces >= k + 1;\n}\n\nint maximizeSweetness(int* sweetness, int sweetnessSize, int k) {\n    int lo = sweetness[0];\n    long long total = 0;\n    for (int i = 0; i < sweetnessSize; i++) {\n        if (sweetness[i] < lo) lo = sweetness[i];\n        total += sweetness[i];\n    }\n    int hi = (int) (total / (long long) (k + 1));\n    while (lo < hi) {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (canSweeten(sweetness, sweetnessSize, k, mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        csharp: `private static bool CanSweeten(int[] sweetness, int k, int m)\n{\n    int pieces = 0, cur = 0;\n    foreach (int s in sweetness)\n    {\n        cur += s;\n        if (cur >= m)\n        {\n            pieces++;\n            cur = 0;\n        }\n    }\n    return pieces >= k + 1;\n}\n\npublic static int MaximizeSweetness(int[] sweetness, int k)\n{\n    int lo = sweetness[0];\n    long total = 0;\n    foreach (int s in sweetness)\n    {\n        if (s < lo) lo = s;\n        total += s;\n    }\n    int hi = (int) (total / (k + 1));\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo + 1) / 2;\n        if (CanSweeten(sweetness, k, mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        go: `func canSweeten(sweetness []int, k int, m int) bool {\n\tpieces, cur := 0, 0\n\tfor _, s := range sweetness {\n\t\tcur += s\n\t\tif cur >= m {\n\t\t\tpieces++\n\t\t\tcur = 0\n\t\t}\n\t}\n\treturn pieces >= k+1\n}\n\nfunc maximizeSweetness(sweetness []int, k int) int {\n\tlo := sweetness[0]\n\ttotal := 0\n\tfor _, s := range sweetness {\n\t\tif s < lo {\n\t\t\tlo = s\n\t\t}\n\t\ttotal += s\n\t}\n\thi := total / (k + 1)\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo+1)/2\n\t\tif canSweeten(sweetness, k, mid) {\n\t\t\tlo = mid\n\t\t} else {\n\t\t\thi = mid - 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `private fun canSweeten(sweetness: IntArray, k: Int, m: Int): Boolean {\n    var pieces = 0\n    var cur = 0\n    for (s in sweetness) {\n        cur += s\n        if (cur >= m) {\n            pieces++\n            cur = 0\n        }\n    }\n    return pieces >= k + 1\n}\n\nfun maximizeSweetness(sweetness: IntArray, k: Int): Int {\n    var lo = sweetness[0]\n    var total = 0L\n    for (s in sweetness) {\n        if (s < lo) lo = s\n        total += s\n    }\n    var hi = (total / (k + 1)).toInt()\n    while (lo < hi) {\n        val mid = lo + (hi - lo + 1) / 2\n        if (canSweeten(sweetness, k, mid)) lo = mid else hi = mid - 1\n    }\n    return lo\n}`,
        swift: `func maximizeSweetness(_ sweetness: [Int], _ k: Int) -> Int {\n    var lo = sweetness[0]\n    var total = 0\n    for s in sweetness {\n        if s < lo { lo = s }\n        total += s\n    }\n    var hi = total / (k + 1)\n    func can(_ m: Int) -> Bool {\n        var pieces = 0\n        var cur = 0\n        for s in sweetness {\n            cur += s\n            if cur >= m {\n                pieces += 1\n                cur = 0\n            }\n        }\n        return pieces >= k + 1\n    }\n    while lo < hi {\n        let mid = lo + (hi - lo + 1) / 2\n        if can(mid) { lo = mid } else { hi = mid - 1 }\n    }\n    return lo\n}`,
        rust: `fn maximizeSweetness(sweetness: Vec<i32>, k: i32) -> i32 {\n    let mut lo = sweetness[0];\n    let mut total: i64 = 0;\n    for &s in sweetness.iter() {\n        if s < lo {\n            lo = s;\n        }\n        total += s as i64;\n    }\n    let mut hi = (total / (k as i64 + 1)) as i32;\n    let can = |m: i32| -> bool {\n        let mut pieces = 0i32;\n        let mut cur = 0i32;\n        for &s in sweetness.iter() {\n            cur += s;\n            if cur >= m {\n                pieces += 1;\n                cur = 0;\n            }\n        }\n        pieces >= k + 1\n    };\n    while lo < hi {\n        let mid = lo + (hi - lo + 1) / 2;\n        if can(mid) {\n            lo = mid;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    lo\n}`,
        php: `function maximizeSweetness($sweetness, $k) {\n    $lo = min($sweetness);\n    $hi = intdiv(array_sum($sweetness), $k + 1);\n    $can = function($m) use ($sweetness, $k) {\n        $pieces = 0;\n        $cur = 0;\n        foreach ($sweetness as $s) {\n            $cur += $s;\n            if ($cur >= $m) { $pieces++; $cur = 0; }\n        }\n        return $pieces >= $k + 1;\n    };\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo + 1, 2);\n        if ($can($mid)) $lo = $mid; else $hi = $mid - 1;\n    }\n    return $lo;\n}`,
        ruby: `def maximizeSweetness(sweetness, k)\n  lo = sweetness.min\n  hi = sweetness.sum / (k + 1)\n  can = lambda do |m|\n    pieces = 0\n    cur = 0\n    sweetness.each do |s|\n      cur += s\n      if cur >= m\n        pieces += 1\n        cur = 0\n      end\n    end\n    pieces >= k + 1\n  end\n  while lo < hi\n    mid = lo + (hi - lo + 1) / 2\n    if can.call(mid)\n      lo = mid\n    else\n      hi = mid - 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Maximum Number of Removable Characters (LC 1898) ────────────
  (() => {
    const ref = (s: string, p: string, removable: number[]) => {
      const stillSub = (count: number) => {
        const gone = new Array(s.length).fill(false);
        for (let i = 0; i < count; i++) gone[removable[i]] = true;
        let j = 0;
        for (let i = 0; i < s.length && j < p.length; i++) {
          if (!gone[i] && s[i] === p[j]) j++;
        }
        return j === p.length;
      };
      let lo = 0, hi = removable.length, ans = 0;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (stillSub(mid)) { ans = mid; lo = mid + 1; } else hi = mid - 1;
      }
      return ans;
    };
    return {
      slug: "maximum-number-of-removable-characters",
      title: "Maximum Number of Removable Characters",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Binary Search", "Two Pointers", "Amazon", "Google", "Salesforce"],
      signature: { funcName: "maximumRemovals", params: [{ name: "s", type: "string" as const }, { name: "p", type: "string" as const }, { name: "removable", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`removable` holds distinct indices into `s`. For a chosen `k`, you remove the characters at `removable[0 … k-1]` — the remaining characters keep their order.\n\nReturn the largest `k` for which `p` is still a **subsequence** of what remains.",
        [
          { in: 's = "abcacb", p = "ab", removable = [3,1,0]', out: "2", note: 'Removing indices 3 and 1 leaves "acb", which still contains "ab".' },
          { in: 's = "abcbddddd", p = "abcd", removable = [3,2,1,4,5,6]', out: "1" },
          { in: 's = "abcab", p = "abc", removable = [0,1,2,3,4]', out: "0" },
        ],
        ["1 <= p.length <= s.length <= 100000", "0 <= removable.length < s.length", "removable holds distinct indices into s.", "p is a subsequence of s.", "s and p consist of lowercase English letters."]),
      hints: [
        "If `k` removals still leave `p` a subsequence, so does any smaller `k` — the property is monotone.",
        "So binary search `k` and check each candidate directly.",
        "The check is a linear subsequence scan that skips removed positions.",
      ],
      editorial: explain({
        idea: "The removals are nested: the first `k` indices are a prefix of the first `k + 1`. So more removals can only hurt, which makes the property monotone and binary-searchable, with a linear subsequence test per candidate.",
        steps: [
          "Binary search `k` over `[0, removable.length]`.",
          "`stillSub(k)`: mark `removable[0 … k-1]` as gone, then two-pointer through `s` matching `p`, skipping marked positions.",
          "Keep the largest `k` that passes.",
        ],
        why: "Removing a superset of characters can only destroy subsequence matches, never create one, so feasibility is downward closed and the boundary is unique. The greedy subsequence match is correct because matching each character of `p` at its earliest possible position never blocks a later match.",
        time: "O(n log r) where r is the number of removable indices",
        space: "O(n)",
        pitfalls: [
          "Trying removals one at a time is `O(n · r)` and times out.",
          "The marks must be rebuilt per candidate, not accumulated across the search.",
          "The answer can be 0, so the search has to include it.",
        ],
      }),
      examples: [
        { input: '"abcacb"\n"ab"\n[3,1,0]', expectedOutput: "2" },
        { input: '"abcbddddd"\n"abcd"\n[3,2,1,4,5,6]', expectedOutput: "1" },
        { input: '"abcab"\n"abc"\n[0,1,2,3,4]', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alpha = ["a", "b", "c", "d"];
        const n = ri(rng, 2, 30);
        const s = Array.from({ length: n }, () => pick(rng, alpha)).join("");
        // p must be a subsequence of s, so build it from a rising index set.
        const picks: number[] = [];
        for (let i = 0; i < n; i++) if (rng() < 0.35) picks.push(i);
        if (picks.length === 0) picks.push(ri(rng, 0, n - 1));
        const p = picks.map((i) => s[i]).join("");
        const idx = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        const removable = idx.slice(0, ri(rng, 0, n - 1));
        return { input: `"${s}"\n"${p}"\n${fmtIntArr(removable)}`, expectedOutput: String(ref(s, p, removable)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumRemovals(s: str, p: str, removable: List[int]) -> int:\n    def still_sub(count: int) -> bool:\n        gone = [False] * len(s)\n        for i in range(count):\n            gone[removable[i]] = True\n        j = 0\n        for i, ch in enumerate(s):\n            if j == len(p):\n                break\n            if not gone[i] and ch == p[j]:\n                j += 1\n        return j == len(p)\n\n    lo, hi, ans = 0, len(removable), 0\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if still_sub(mid):\n            ans = mid\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return ans`,
        javascript: `var maximumRemovals = function(s, p, removable) {\n    var stillSub = function(count) {\n        var gone = [];\n        for (var t = 0; t < s.length; t++) gone.push(false);\n        for (var i = 0; i < count; i++) gone[removable[i]] = true;\n        var j = 0;\n        for (var x = 0; x < s.length && j < p.length; x++) {\n            if (!gone[x] && s.charAt(x) === p.charAt(j)) j++;\n        }\n        return j === p.length;\n    };\n    var lo = 0, hi = removable.length, ans = 0;\n    while (lo <= hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (stillSub(mid)) { ans = mid; lo = mid + 1; } else hi = mid - 1;\n    }\n    return ans;\n};`,
        typescript: `function maximumRemovals(s: string, p: string, removable: number[]): number {\n    var stillSub = function(count: number): boolean {\n        var gone: boolean[] = [];\n        for (var t = 0; t < s.length; t++) gone.push(false);\n        for (var i = 0; i < count; i++) gone[removable[i]] = true;\n        var j = 0;\n        for (var x = 0; x < s.length && j < p.length; x++) {\n            if (!gone[x] && s.charAt(x) === p.charAt(j)) j++;\n        }\n        return j === p.length;\n    };\n    var lo = 0, hi = removable.length, ans = 0;\n    while (lo <= hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (stillSub(mid)) { ans = mid; lo = mid + 1; } else hi = mid - 1;\n    }\n    return ans;\n}`,
        java: `private static boolean stillSubsequence(String s, String p, int[] removable, int count) {\n    boolean[] gone = new boolean[s.length()];\n    for (int i = 0; i < count; i++) gone[removable[i]] = true;\n    int j = 0;\n    for (int i = 0; i < s.length() && j < p.length(); i++) {\n        if (!gone[i] && s.charAt(i) == p.charAt(j)) j++;\n    }\n    return j == p.length();\n}\n\npublic static int maximumRemovals(String s, String p, int[] removable) {\n    int lo = 0, hi = removable.length, ans = 0;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (stillSubsequence(s, p, removable, mid)) {\n            ans = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return ans;\n}`,
        cpp: `static bool stillSubsequence(string& s, string& p, vector<int>& removable, int count) {\n    vector<bool> gone(s.size(), false);\n    for (int i = 0; i < count; i++) gone[removable[i]] = true;\n    int j = 0;\n    for (int i = 0; i < (int) s.size() && j < (int) p.size(); i++) {\n        if (!gone[i] && s[i] == p[j]) j++;\n    }\n    return j == (int) p.size();\n}\n\nint maximumRemovals(string s, string p, vector<int>& removable) {\n    int lo = 0, hi = (int) removable.size(), ans = 0;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (stillSubsequence(s, p, removable, mid)) {\n            ans = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return ans;\n}`,
        c: `static int stillSubsequence(char* s, int n, char* p, int m, int* removable, int count) {\n    char* gone = (char*) calloc((size_t) n, 1);\n    for (int i = 0; i < count; i++) gone[removable[i]] = 1;\n    int j = 0;\n    for (int i = 0; i < n && j < m; i++) {\n        if (!gone[i] && s[i] == p[j]) j++;\n    }\n    free(gone);\n    return j == m;\n}\n\nint maximumRemovals(char* s, char* p, int* removable, int removableSize) {\n    int n = (int) strlen(s);\n    int m = (int) strlen(p);\n    int lo = 0, hi = removableSize, ans = 0;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (stillSubsequence(s, n, p, m, removable, mid)) {\n            ans = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return ans;\n}`,
        csharp: `private static bool StillSubsequence(string s, string p, int[] removable, int count)\n{\n    bool[] gone = new bool[s.Length];\n    for (int i = 0; i < count; i++) gone[removable[i]] = true;\n    int j = 0;\n    for (int i = 0; i < s.Length && j < p.Length; i++)\n    {\n        if (!gone[i] && s[i] == p[j]) j++;\n    }\n    return j == p.Length;\n}\n\npublic static int MaximumRemovals(string s, string p, int[] removable)\n{\n    int lo = 0, hi = removable.Length, ans = 0;\n    while (lo <= hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (StillSubsequence(s, p, removable, mid))\n        {\n            ans = mid;\n            lo = mid + 1;\n        }\n        else\n        {\n            hi = mid - 1;\n        }\n    }\n    return ans;\n}`,
        go: `func stillSubsequence(s string, p string, removable []int, count int) bool {\n\tgone := make([]bool, len(s))\n\tfor i := 0; i < count; i++ {\n\t\tgone[removable[i]] = true\n\t}\n\tj := 0\n\tfor i := 0; i < len(s) && j < len(p); i++ {\n\t\tif !gone[i] && s[i] == p[j] {\n\t\t\tj++\n\t\t}\n\t}\n\treturn j == len(p)\n}\n\nfunc maximumRemovals(s string, p string, removable []int) int {\n\tlo, hi, ans := 0, len(removable), 0\n\tfor lo <= hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif stillSubsequence(s, p, removable, mid) {\n\t\t\tans = mid\n\t\t\tlo = mid + 1\n\t\t} else {\n\t\t\thi = mid - 1\n\t\t}\n\t}\n\treturn ans\n}`,
        kotlin: `private fun stillSubsequence(s: String, p: String, removable: IntArray, count: Int): Boolean {\n    val gone = BooleanArray(s.length)\n    for (i in 0 until count) gone[removable[i]] = true\n    var j = 0\n    var i = 0\n    while (i < s.length && j < p.length) {\n        if (!gone[i] && s[i] == p[j]) j++\n        i++\n    }\n    return j == p.length\n}\n\nfun maximumRemovals(s: String, p: String, removable: IntArray): Int {\n    var lo = 0\n    var hi = removable.size\n    var ans = 0\n    while (lo <= hi) {\n        val mid = lo + (hi - lo) / 2\n        if (stillSubsequence(s, p, removable, mid)) {\n            ans = mid\n            lo = mid + 1\n        } else {\n            hi = mid - 1\n        }\n    }\n    return ans\n}`,
        swift: `func maximumRemovals(_ s: String, _ p: String, _ removable: [Int]) -> Int {\n    let sa = Array(s)\n    let pa = Array(p)\n    func stillSub(_ count: Int) -> Bool {\n        var gone = [Bool](repeating: false, count: sa.count)\n        for i in 0..<count { gone[removable[i]] = true }\n        var j = 0\n        var i = 0\n        while i < sa.count && j < pa.count {\n            if !gone[i] && sa[i] == pa[j] { j += 1 }\n            i += 1\n        }\n        return j == pa.count\n    }\n    var lo = 0\n    var hi = removable.count\n    var ans = 0\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2\n        if stillSub(mid) {\n            ans = mid\n            lo = mid + 1\n        } else {\n            hi = mid - 1\n        }\n    }\n    return ans\n}`,
        rust: `fn maximumRemovals(s: String, p: String, removable: Vec<i32>) -> i32 {\n    let sb = s.as_bytes();\n    let pb = p.as_bytes();\n    let still_sub = |count: usize| -> bool {\n        let mut gone = vec![false; sb.len()];\n        for i in 0..count {\n            gone[removable[i] as usize] = true;\n        }\n        let mut j = 0usize;\n        for i in 0..sb.len() {\n            if j == pb.len() {\n                break;\n            }\n            if !gone[i] && sb[i] == pb[j] {\n                j += 1;\n            }\n        }\n        j == pb.len()\n    };\n    let mut lo: i32 = 0;\n    let mut hi: i32 = removable.len() as i32;\n    let mut ans: i32 = 0;\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2;\n        if still_sub(mid as usize) {\n            ans = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    ans\n}`,
        php: `function maximumRemovals($s, $p, $removable) {\n    $n = strlen($s);\n    $m = strlen($p);\n    $stillSub = function($count) use ($s, $p, $removable, $n, $m) {\n        $gone = array_fill(0, $n, false);\n        for ($i = 0; $i < $count; $i++) $gone[$removable[$i]] = true;\n        $j = 0;\n        for ($i = 0; $i < $n && $j < $m; $i++) {\n            if (!$gone[$i] && $s[$i] === $p[$j]) $j++;\n        }\n        return $j === $m;\n    };\n    $lo = 0;\n    $hi = count($removable);\n    $ans = 0;\n    while ($lo <= $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($stillSub($mid)) {\n            $ans = $mid;\n            $lo = $mid + 1;\n        } else {\n            $hi = $mid - 1;\n        }\n    }\n    return $ans;\n}`,
        ruby: `def maximumRemovals(s, p, removable)\n  still_sub = lambda do |count|\n    gone = Array.new(s.length, false)\n    (0...count).each { |i| gone[removable[i]] = true }\n    j = 0\n    (0...s.length).each do |i|\n      break if j == p.length\n      j += 1 if !gone[i] && s[i] == p[j]\n    end\n    j == p.length\n  end\n  lo = 0\n  hi = removable.length\n  ans = 0\n  while lo <= hi\n    mid = lo + (hi - lo) / 2\n    if still_sub.call(mid)\n      ans = mid\n      lo = mid + 1\n    else\n      hi = mid - 1\n    end\n  end\n  ans\nend`,
      },
    };
  })(),

  // ── Split Array Largest Sum (LC 410) ────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      let lo = 0, hi = 0;
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] > lo) lo = nums[i];
        hi += nums[i];
      }
      const need = (cap: number) => {
        let cnt = 1, cur = 0;
        for (let i = 0; i < nums.length; i++) {
          if (cur + nums[i] > cap) { cnt++; cur = 0; }
          cur += nums[i];
        }
        return cnt;
      };
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (need(mid) <= k) hi = mid; else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "split-array-largest-sum",
      title: "Split Array Largest Sum",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Greedy", "Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "splitArray", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Split `nums` into `k` **non-empty contiguous** subarrays so that the largest subarray sum is as small as possible.\n\nReturn that minimised largest sum.",
        [
          { in: "nums = [7,2,5,10,8], k = 2", out: "18", note: "[7,2,5] and [10,8] give sums 14 and 18." },
          { in: "nums = [1,2,3,4,5], k = 2", out: "9", note: "[1,2,3] and [4,5]." },
          { in: "nums = [1,4,4], k = 3", out: "4" },
        ],
        ["1 <= nums.length <= 1000", "0 <= nums[i] <= 1000000", "1 <= k <= nums.length"]),
      hints: [
        "If a cap on the largest sum is achievable with `k` parts, any larger cap is too — the feasibility is monotone.",
        "For a candidate cap, greedily extend each part until the next element would overflow it.",
        "The search range runs from the largest element to the total sum.",
      ],
      editorial: explain({
        idea: "Binary search the answer. For a candidate cap, the greedy that keeps extending a part until it would overflow produces the fewest parts possible, so comparing that count with `k` decides feasibility exactly.",
        steps: [
          "Set `lo` to `max(nums)` — no part can be smaller than its largest element — and `hi` to the total.",
          "`need(cap)`: sweep once, starting a new part whenever the next element would push the running sum past `cap`.",
          "Binary search the smallest `cap` with `need(cap) <= k`.",
        ],
        why: "The greedy is optimal for a fixed cap: closing a part before it must can never reduce the number of parts, since the deferred element still has to go somewhere later. Raising the cap lets each part hold more, so `need` is non-increasing. And using fewer than `k` parts is fine — a part can always be split further without raising the maximum.",
        time: "O(n log S) where S is the total sum",
        space: "O(1)",
        pitfalls: [
          "The classic `O(n² k)` dynamic program also solves it but is far slower here.",
          "`lo` must start at `max(nums)`, or the greedy can loop on an element that fits in no part.",
          "`need(cap) <= k`, not `== k` — extra splits are always available.",
        ],
      }),
      examples: [
        { input: "[7,2,5,10,8]\n2", expectedOutput: "18" },
        { input: "[1,2,3,4,5]\n2", expectedOutput: "9" },
        { input: "[1,4,4]\n3", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const hi = rng() < 0.6 ? 50 : 1000000;
        const nums = Array.from({ length: n }, () => ri(rng, 0, hi));
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef splitArray(nums: List[int], k: int) -> int:\n    lo, hi = max(nums), sum(nums)\n\n    def need(cap: int) -> int:\n        cnt, cur = 1, 0\n        for x in nums:\n            if cur + x > cap:\n                cnt += 1\n                cur = 0\n            cur += x\n        return cnt\n\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if need(mid) <= k:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var splitArray = function(nums, k) {\n    var lo = 0, hi = 0, i;\n    for (i = 0; i < nums.length; i++) {\n        if (nums[i] > lo) lo = nums[i];\n        hi += nums[i];\n    }\n    var need = function(cap) {\n        var cnt = 1, cur = 0;\n        for (var j = 0; j < nums.length; j++) {\n            if (cur + nums[j] > cap) { cnt++; cur = 0; }\n            cur += nums[j];\n        }\n        return cnt;\n    };\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (need(mid) <= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n};`,
        typescript: `function splitArray(nums: number[], k: number): number {\n    var lo = 0, hi = 0, i: number;\n    for (i = 0; i < nums.length; i++) {\n        if (nums[i] > lo) lo = nums[i];\n        hi += nums[i];\n    }\n    var need = function(cap: number): number {\n        var cnt = 1, cur = 0;\n        for (var j = 0; j < nums.length; j++) {\n            if (cur + nums[j] > cap) { cnt++; cur = 0; }\n            cur += nums[j];\n        }\n        return cnt;\n    };\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (need(mid) <= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        java: `private static int partsNeeded(int[] nums, int cap) {\n    int cnt = 1, cur = 0;\n    for (int x : nums) {\n        if (cur + x > cap) {\n            cnt++;\n            cur = 0;\n        }\n        cur += x;\n    }\n    return cnt;\n}\n\npublic static int splitArray(int[] nums, int k) {\n    int lo = 0;\n    long hi = 0;\n    for (int x : nums) {\n        lo = Math.max(lo, x);\n        hi += x;\n    }\n    int right = (int) hi;\n    while (lo < right) {\n        int mid = lo + (right - lo) / 2;\n        if (partsNeeded(nums, mid) <= k) right = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        cpp: `static int partsNeeded(vector<int>& nums, int cap) {\n    int cnt = 1, cur = 0;\n    for (int x : nums) {\n        if (cur + x > cap) {\n            cnt++;\n            cur = 0;\n        }\n        cur += x;\n    }\n    return cnt;\n}\n\nint splitArray(vector<int>& nums, int k) {\n    int lo = 0;\n    long long total = 0;\n    for (int x : nums) {\n        lo = max(lo, x);\n        total += x;\n    }\n    int hi = (int) total;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (partsNeeded(nums, mid) <= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        c: `static int partsNeeded(int* nums, int n, int cap) {\n    int cnt = 1, cur = 0;\n    for (int i = 0; i < n; i++) {\n        if (cur + nums[i] > cap) {\n            cnt++;\n            cur = 0;\n        }\n        cur += nums[i];\n    }\n    return cnt;\n}\n\nint splitArray(int* nums, int numsSize, int k) {\n    int lo = 0;\n    long long total = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] > lo) lo = nums[i];\n        total += nums[i];\n    }\n    int hi = (int) total;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (partsNeeded(nums, numsSize, mid) <= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        csharp: `private static int PartsNeeded(int[] nums, int cap)\n{\n    int cnt = 1, cur = 0;\n    foreach (int x in nums)\n    {\n        if (cur + x > cap)\n        {\n            cnt++;\n            cur = 0;\n        }\n        cur += x;\n    }\n    return cnt;\n}\n\npublic static int SplitArray(int[] nums, int k)\n{\n    int lo = 0;\n    long total = 0;\n    foreach (int x in nums)\n    {\n        if (x > lo) lo = x;\n        total += x;\n    }\n    int hi = (int) total;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (PartsNeeded(nums, mid) <= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        go: `func partsNeeded(nums []int, cap int) int {\n\tcnt, cur := 1, 0\n\tfor _, x := range nums {\n\t\tif cur+x > cap {\n\t\t\tcnt++\n\t\t\tcur = 0\n\t\t}\n\t\tcur += x\n\t}\n\treturn cnt\n}\n\nfunc splitArray(nums []int, k int) int {\n\tlo, hi := 0, 0\n\tfor _, x := range nums {\n\t\tif x > lo {\n\t\t\tlo = x\n\t\t}\n\t\thi += x\n\t}\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif partsNeeded(nums, mid) <= k {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `private fun partsNeeded(nums: IntArray, cap: Int): Int {\n    var cnt = 1\n    var cur = 0\n    for (x in nums) {\n        if (cur + x > cap) {\n            cnt++\n            cur = 0\n        }\n        cur += x\n    }\n    return cnt\n}\n\nfun splitArray(nums: IntArray, k: Int): Int {\n    var lo = 0\n    var total = 0L\n    for (x in nums) {\n        if (x > lo) lo = x\n        total += x\n    }\n    var hi = total.toInt()\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (partsNeeded(nums, mid) <= k) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
        swift: `func splitArray(_ nums: [Int], _ k: Int) -> Int {\n    var lo = 0\n    var hi = 0\n    for x in nums {\n        if x > lo { lo = x }\n        hi += x\n    }\n    func need(_ cap: Int) -> Int {\n        var cnt = 1\n        var cur = 0\n        for x in nums {\n            if cur + x > cap {\n                cnt += 1\n                cur = 0\n            }\n            cur += x\n        }\n        return cnt\n    }\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if need(mid) <= k { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
        rust: `fn splitArray(nums: Vec<i32>, k: i32) -> i32 {\n    let mut lo = 0i32;\n    let mut hi: i64 = 0;\n    for &x in nums.iter() {\n        if x > lo {\n            lo = x;\n        }\n        hi += x as i64;\n    }\n    let mut right = hi as i32;\n    let need = |cap: i32| -> i32 {\n        let mut cnt = 1i32;\n        let mut cur = 0i32;\n        for &x in nums.iter() {\n            if cur + x > cap {\n                cnt += 1;\n                cur = 0;\n            }\n            cur += x;\n        }\n        cnt\n    };\n    while lo < right {\n        let mid = lo + (right - lo) / 2;\n        if need(mid) <= k {\n            right = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo\n}`,
        php: `function splitArray($nums, $k) {\n    $lo = max($nums);\n    $hi = array_sum($nums);\n    $need = function($cap) use ($nums) {\n        $cnt = 1;\n        $cur = 0;\n        foreach ($nums as $x) {\n            if ($cur + $x > $cap) { $cnt++; $cur = 0; }\n            $cur += $x;\n        }\n        return $cnt;\n    };\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($need($mid) <= $k) $hi = $mid; else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
        ruby: `def splitArray(nums, k)\n  lo = nums.max\n  hi = nums.sum\n  need = lambda do |cap|\n    cnt = 1\n    cur = 0\n    nums.each do |x|\n      if cur + x > cap\n        cnt += 1\n        cur = 0\n      end\n      cur += x\n    end\n    cnt\n  end\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if need.call(mid) <= k\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Kth Smallest Number in Multiplication Table (LC 668) ────────
  (() => {
    const ref = (m: number, n: number, k: number) => {
      const countLE = (x: number) => {
        let c = 0;
        for (let i = 1; i <= m; i++) c += Math.min(n, Math.floor(x / i));
        return c;
      };
      let lo = 1, hi = m * n;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (countLE(mid) >= k) hi = mid; else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "kth-smallest-number-in-multiplication-table",
      title: "Kth Smallest Number in Multiplication Table",
      difficulty: "HARD" as const,
      tags: ["Math", "Binary Search", "Amazon", "Google", "Apple"],
      signature: { funcName: "findKthNumber", params: [{ name: "m", type: "int" as const }, { name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "An `m × n` multiplication table has `table[i][j] = i · j` for `1 <= i <= m` and `1 <= j <= n`.\n\nReturn the `k`-th smallest entry, counting duplicates.",
        [
          { in: "m = 3, n = 3, k = 5", out: "3", note: "Sorted, the table reads 1, 2, 2, 3, 3, 4, 6, 6, 9." },
          { in: "m = 2, n = 3, k = 6", out: "6", note: "The table reads 1, 2, 2, 3, 4, 6." },
          { in: "m = 1, n = 1, k = 1", out: "1" },
        ],
        ["1 <= m, n <= 30000", "1 <= k <= m · n"]),
      hints: [
        "Materialising `m · n` entries is up to `9 · 10^8` numbers — far too many to sort.",
        "Binary search the *value*: how many entries are at most `x`?",
        "Row `i` contributes `min(n, floor(x / i))` entries at most `x`.",
      ],
      editorial: explain({
        idea: "Binary search over the value rather than the table. Counting entries at most `x` is a one-pass formula over the rows, and the count is non-decreasing in `x`, so the boundary where it first reaches `k` is the answer.",
        steps: [
          "`countLE(x)`: sum `min(n, floor(x / i))` for `i` from 1 to `m` — row `i` holds the multiples of `i`, capped at `n` columns.",
          "Binary search the smallest `x` in `[1, m · n]` with `countLE(x) >= k`.",
        ],
        why: "Row `i` contains `i, 2i, …, ni`, of which exactly `floor(x / i)` are at most `x` before the column cap applies. The count is monotone in `x`, and the boundary value is genuinely present in the table: the count strictly increases only at values that appear, so the first `x` reaching `k` is one of them.",
        time: "O(m log(m · n))",
        space: "O(1)",
        pitfalls: [
          "`m · n` reaches `9 · 10^8`, which fits `int` but leaves no room for a careless `lo + hi`.",
          "Forgetting the `min(n, …)` cap counts entries past the end of the row.",
          "The answer is a table value, not a count — returning `k` or the count is a common slip.",
        ],
      }),
      examples: [
        { input: "3\n3\n5", expectedOutput: "3" },
        { input: "2\n3\n6", expectedOutput: "6" },
        { input: "1\n1\n1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = rng() < 0.6 ? ri(rng, 1, 30) : ri(rng, 1, 600);
        const n = rng() < 0.6 ? ri(rng, 1, 30) : ri(rng, 1, 600);
        const k = ri(rng, 1, m * n);
        return { input: `${m}\n${n}\n${k}`, expectedOutput: String(ref(m, n, k)) };
      },
      solutions: {
        python: `def findKthNumber(m: int, n: int, k: int) -> int:\n    def count_le(x: int) -> int:\n        return sum(min(n, x // i) for i in range(1, m + 1))\n\n    lo, hi = 1, m * n\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if count_le(mid) >= k:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var findKthNumber = function(m, n, k) {\n    var countLE = function(x) {\n        var c = 0;\n        for (var i = 1; i <= m; i++) c += Math.min(n, Math.floor(x / i));\n        return c;\n    };\n    var lo = 1, hi = m * n;\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (countLE(mid) >= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n};`,
        typescript: `function findKthNumber(m: number, n: number, k: number): number {\n    var countLE = function(x: number): number {\n        var c = 0;\n        for (var i = 1; i <= m; i++) c += Math.min(n, Math.floor(x / i));\n        return c;\n    };\n    var lo = 1, hi = m * n;\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (countLE(mid) >= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        java: `private static long countTableLE(int m, int n, int x) {\n    long c = 0;\n    for (int i = 1; i <= m; i++) c += Math.min(n, x / i);\n    return c;\n}\n\npublic static int findKthNumber(int m, int n, int k) {\n    int lo = 1, hi = m * n;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (countTableLE(m, n, mid) >= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        cpp: `static long long countTableLE(int m, int n, int x) {\n    long long c = 0;\n    for (int i = 1; i <= m; i++) c += min(n, x / i);\n    return c;\n}\n\nint findKthNumber(int m, int n, int k) {\n    int lo = 1, hi = m * n;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (countTableLE(m, n, mid) >= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        c: `static long long countTableLE(int m, int n, int x) {\n    long long c = 0;\n    for (int i = 1; i <= m; i++) {\n        int q = x / i;\n        c += q < n ? q : n;\n    }\n    return c;\n}\n\nint findKthNumber(int m, int n, int k) {\n    int lo = 1, hi = m * n;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (countTableLE(m, n, mid) >= (long long) k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        csharp: `private static long CountTableLE(int m, int n, int x)\n{\n    long c = 0;\n    for (int i = 1; i <= m; i++) c += Math.Min(n, x / i);\n    return c;\n}\n\npublic static int FindKthNumber(int m, int n, int k)\n{\n    int lo = 1, hi = m * n;\n    while (lo < hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (CountTableLE(m, n, mid) >= k) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        go: `func countTableLE(m int, n int, x int) int {\n\tc := 0\n\tfor i := 1; i <= m; i++ {\n\t\tq := x / i\n\t\tif q > n {\n\t\t\tq = n\n\t\t}\n\t\tc += q\n\t}\n\treturn c\n}\n\nfunc findKthNumber(m int, n int, k int) int {\n\tlo, hi := 1, m*n\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif countTableLE(m, n, mid) >= k {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `private fun countTableLE(m: Int, n: Int, x: Int): Long {\n    var c = 0L\n    for (i in 1..m) c += minOf(n, x / i).toLong()\n    return c\n}\n\nfun findKthNumber(m: Int, n: Int, k: Int): Int {\n    var lo = 1\n    var hi = m * n\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (countTableLE(m, n, mid) >= k) hi = mid else lo = mid + 1\n    }\n    return lo\n}`,
        swift: `func findKthNumber(_ m: Int, _ n: Int, _ k: Int) -> Int {\n    func countLE(_ x: Int) -> Int {\n        var c = 0\n        for i in 1...m { c += min(n, x / i) }\n        return c\n    }\n    var lo = 1\n    var hi = m * n\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if countLE(mid) >= k { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
        rust: `fn findKthNumber(m: i32, n: i32, k: i32) -> i32 {\n    let count_le = |x: i32| -> i64 {\n        let mut c: i64 = 0;\n        for i in 1..=m {\n            c += (x / i).min(n) as i64;\n        }\n        c\n    };\n    let mut lo = 1i32;\n    let mut hi = m * n;\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if count_le(mid) >= k as i64 {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo\n}`,
        php: `function findKthNumber($m, $n, $k) {\n    $countLE = function($x) use ($m, $n) {\n        $c = 0;\n        for ($i = 1; $i <= $m; $i++) $c += min($n, intdiv($x, $i));\n        return $c;\n    };\n    $lo = 1;\n    $hi = $m * $n;\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($countLE($mid) >= $k) $hi = $mid; else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
        ruby: `def findKthNumber(m, n, k)\n  count_le = lambda do |x|\n    (1..m).sum { |i| [n, x / i].min }\n  end\n  lo = 1\n  hi = m * n\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if count_le.call(mid) >= k\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Minimum Time to Complete Trips (LC 2187) ────────────────────
  (() => {
    const ref = (time: number[], totalTrips: number) => {
      let fastest = time[0];
      for (let i = 1; i < time.length; i++) if (time[i] < fastest) fastest = time[i];
      const trips = (t: number) => {
        let c = 0;
        for (let i = 0; i < time.length; i++) {
          c += Math.floor(t / time[i]);
          if (c >= totalTrips) return c;
        }
        return c;
      };
      let lo = 1, hi = fastest * totalTrips;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (trips(mid) >= totalTrips) hi = mid; else lo = mid + 1;
      }
      return lo;
    };
    return {
      slug: "minimum-time-to-complete-trips",
      title: "Minimum Time to Complete Trips",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Amazon", "Google", "Ola"],
      signature: { funcName: "minimumTime", params: [{ name: "time", type: "int[]" as const }, { name: "totalTrips", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Bus `i` takes `time[i]` units per trip and starts its next trip immediately. Buses run independently.\n\nReturn the minimum time for the fleet to complete at least `totalTrips` trips in total.",
        [
          { in: "time = [1,2,3], totalTrips = 5", out: "3", note: "By t = 3 the buses have done 3, 1 and 1 trips." },
          { in: "time = [2], totalTrips = 1", out: "2" },
          { in: "time = [5,10,10], totalTrips = 9", out: "25" },
        ],
        ["1 <= time.length <= 100000", "1 <= time[i] <= 1000000", "1 <= totalTrips <= 1000"]),
      hints: [
        "By time `t`, bus `i` has completed `floor(t / time[i])` trips — a non-decreasing function of `t`.",
        "So the total is non-decreasing too, and binary search applies.",
        "An upper bound is the fastest bus doing every trip alone.",
      ],
      editorial: explain({
        idea: "Binary search the elapsed time. The fleet's trip count at time `t` is a simple sum of floors, and it only grows with `t`, so the first `t` reaching `totalTrips` is the answer.",
        steps: [
          "Bound the search by `[1, min(time) · totalTrips]` — the fastest bus alone always suffices by then.",
          "`trips(t)`: sum `floor(t / time[i])`, stopping early once the target is reached.",
          "Binary search the smallest `t` with `trips(t) >= totalTrips`.",
        ],
        why: "Each bus's trip count is a step function of `t`, non-decreasing, so their sum is too — the predicate flips exactly once. The upper bound holds because by `min(time) · totalTrips` the fastest bus has done `totalTrips` trips on its own, so the fleet has done at least that many.",
        time: "O(n log(min(time) · totalTrips))",
        space: "O(1)",
        pitfalls: [
          "The partial sums reach `10^5 · 10^9` before the early exit — accumulate in 64-bit or stop as soon as the target is met.",
          "Searching up to the *slowest* bus times `totalTrips` still works but wastes iterations.",
          "Buses are independent; there is no scheduling to do.",
        ],
      }),
      examples: [
        { input: "[1,2,3]\n5", expectedOutput: "3" },
        { input: "[2]\n1", expectedOutput: "2" },
        { input: "[5,10,10]\n9", expectedOutput: "25" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 40 : 1000000;
        const time = Array.from({ length: ri(rng, 1, 25) }, () => ri(rng, 1, hi));
        const totalTrips = ri(rng, 1, 1000);
        return { input: `${fmtIntArr(time)}\n${totalTrips}`, expectedOutput: String(ref(time, totalTrips)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumTime(time: List[int], totalTrips: int) -> int:\n    lo, hi = 1, min(time) * totalTrips\n\n    def trips(t: int) -> int:\n        c = 0\n        for x in time:\n            c += t // x\n            if c >= totalTrips:\n                return c\n        return c\n\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if trips(mid) >= totalTrips:\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo`,
        javascript: `var minimumTime = function(time, totalTrips) {\n    var fastest = time[0], i;\n    for (i = 1; i < time.length; i++) if (time[i] < fastest) fastest = time[i];\n    var trips = function(t) {\n        var c = 0;\n        for (var j = 0; j < time.length; j++) {\n            c += Math.floor(t / time[j]);\n            if (c >= totalTrips) return c;\n        }\n        return c;\n    };\n    var lo = 1, hi = fastest * totalTrips;\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (trips(mid) >= totalTrips) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n};`,
        typescript: `function minimumTime(time: number[], totalTrips: number): number {\n    var fastest = time[0], i: number;\n    for (i = 1; i < time.length; i++) if (time[i] < fastest) fastest = time[i];\n    var trips = function(t: number): number {\n        var c = 0;\n        for (var j = 0; j < time.length; j++) {\n            c += Math.floor(t / time[j]);\n            if (c >= totalTrips) return c;\n        }\n        return c;\n    };\n    var lo = 1, hi = fastest * totalTrips;\n    while (lo < hi) {\n        var mid = Math.floor((lo + hi) / 2);\n        if (trips(mid) >= totalTrips) hi = mid; else lo = mid + 1;\n    }\n    return lo;\n}`,
        java: `private static long tripsBy(int[] time, int totalTrips, long t) {\n    long c = 0;\n    for (int x : time) {\n        c += t / x;\n        if (c >= totalTrips) return c;\n    }\n    return c;\n}\n\npublic static int minimumTime(int[] time, int totalTrips) {\n    int fastest = time[0];\n    for (int x : time) fastest = Math.min(fastest, x);\n    long lo = 1, hi = (long) fastest * totalTrips;\n    while (lo < hi) {\n        long mid = lo + (hi - lo) / 2;\n        if (tripsBy(time, totalTrips, mid) >= totalTrips) hi = mid; else lo = mid + 1;\n    }\n    return (int) lo;\n}`,
        cpp: `static long long tripsBy(vector<int>& time, int totalTrips, long long t) {\n    long long c = 0;\n    for (int x : time) {\n        c += t / x;\n        if (c >= totalTrips) return c;\n    }\n    return c;\n}\n\nint minimumTime(vector<int>& time, int totalTrips) {\n    int fastest = time[0];\n    for (int x : time) fastest = min(fastest, x);\n    long long lo = 1, hi = (long long) fastest * totalTrips;\n    while (lo < hi) {\n        long long mid = lo + (hi - lo) / 2;\n        if (tripsBy(time, totalTrips, mid) >= totalTrips) hi = mid; else lo = mid + 1;\n    }\n    return (int) lo;\n}`,
        c: `static long long tripsBy(int* time, int n, int totalTrips, long long t) {\n    long long c = 0;\n    for (int i = 0; i < n; i++) {\n        c += t / (long long) time[i];\n        if (c >= (long long) totalTrips) return c;\n    }\n    return c;\n}\n\nint minimumTime(int* time, int timeSize, int totalTrips) {\n    int fastest = time[0];\n    for (int i = 1; i < timeSize; i++) if (time[i] < fastest) fastest = time[i];\n    long long lo = 1, hi = (long long) fastest * (long long) totalTrips;\n    while (lo < hi) {\n        long long mid = lo + (hi - lo) / 2;\n        if (tripsBy(time, timeSize, totalTrips, mid) >= (long long) totalTrips) hi = mid; else lo = mid + 1;\n    }\n    return (int) lo;\n}`,
        csharp: `private static long TripsBy(int[] time, int totalTrips, long t)\n{\n    long c = 0;\n    foreach (int x in time)\n    {\n        c += t / x;\n        if (c >= totalTrips) return c;\n    }\n    return c;\n}\n\npublic static int MinimumTime(int[] time, int totalTrips)\n{\n    int fastest = time[0];\n    foreach (int x in time) if (x < fastest) fastest = x;\n    long lo = 1, hi = (long) fastest * totalTrips;\n    while (lo < hi)\n    {\n        long mid = lo + (hi - lo) / 2;\n        if (TripsBy(time, totalTrips, mid) >= totalTrips) hi = mid; else lo = mid + 1;\n    }\n    return (int) lo;\n}`,
        go: `func tripsBy(time []int, totalTrips int, t int) int {\n\tc := 0\n\tfor _, x := range time {\n\t\tc += t / x\n\t\tif c >= totalTrips {\n\t\t\treturn c\n\t\t}\n\t}\n\treturn c\n}\n\nfunc minimumTime(time []int, totalTrips int) int {\n\tfastest := time[0]\n\tfor _, x := range time {\n\t\tif x < fastest {\n\t\t\tfastest = x\n\t\t}\n\t}\n\tlo, hi := 1, fastest*totalTrips\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif tripsBy(time, totalTrips, mid) >= totalTrips {\n\t\t\thi = mid\n\t\t} else {\n\t\t\tlo = mid + 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `private fun tripsBy(time: IntArray, totalTrips: Int, t: Long): Long {\n    var c = 0L\n    for (x in time) {\n        c += t / x\n        if (c >= totalTrips) return c\n    }\n    return c\n}\n\nfun minimumTime(time: IntArray, totalTrips: Int): Int {\n    var fastest = time[0]\n    for (x in time) if (x < fastest) fastest = x\n    var lo = 1L\n    var hi = fastest.toLong() * totalTrips\n    while (lo < hi) {\n        val mid = lo + (hi - lo) / 2\n        if (tripsBy(time, totalTrips, mid) >= totalTrips) hi = mid else lo = mid + 1\n    }\n    return lo.toInt()\n}`,
        swift: `func minimumTime(_ time: [Int], _ totalTrips: Int) -> Int {\n    var fastest = time[0]\n    for x in time where x < fastest { fastest = x }\n    func trips(_ t: Int) -> Int {\n        var c = 0\n        for x in time {\n            c += t / x\n            if c >= totalTrips { return c }\n        }\n        return c\n    }\n    var lo = 1\n    var hi = fastest * totalTrips\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2\n        if trips(mid) >= totalTrips { hi = mid } else { lo = mid + 1 }\n    }\n    return lo\n}`,
        rust: `fn minimumTime(time: Vec<i32>, totalTrips: i32) -> i32 {\n    let mut fastest = time[0];\n    for &x in time.iter() {\n        if x < fastest {\n            fastest = x;\n        }\n    }\n    let trips = |t: i64| -> i64 {\n        let mut c: i64 = 0;\n        for &x in time.iter() {\n            c += t / x as i64;\n            if c >= totalTrips as i64 {\n                return c;\n            }\n        }\n        c\n    };\n    let mut lo: i64 = 1;\n    let mut hi: i64 = fastest as i64 * totalTrips as i64;\n    while lo < hi {\n        let mid = lo + (hi - lo) / 2;\n        if trips(mid) >= totalTrips as i64 {\n            hi = mid;\n        } else {\n            lo = mid + 1;\n        }\n    }\n    lo as i32\n}`,
        php: `function minimumTime($time, $totalTrips) {\n    $fastest = min($time);\n    $trips = function($t) use ($time, $totalTrips) {\n        $c = 0;\n        foreach ($time as $x) {\n            $c += intdiv($t, $x);\n            if ($c >= $totalTrips) return $c;\n        }\n        return $c;\n    };\n    $lo = 1;\n    $hi = $fastest * $totalTrips;\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($trips($mid) >= $totalTrips) $hi = $mid; else $lo = $mid + 1;\n    }\n    return $lo;\n}`,
        ruby: `def minimumTime(time, totalTrips)\n  fastest = time.min\n  trips = lambda do |t|\n    c = 0\n    time.each do |x|\n      c += t / x\n      return c if c >= totalTrips\n    end\n    c\n  end\n  lo = 1\n  hi = fastest * totalTrips\n  while lo < hi\n    mid = lo + (hi - lo) / 2\n    if trips.call(mid) >= totalTrips\n      hi = mid\n    else\n      lo = mid + 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Maximum Running Time of N Computers (LC 2141) ───────────────
  (() => {
    const ref = (n: number, batteries: number[]) => {
      let total = 0;
      for (let i = 0; i < batteries.length; i++) total += batteries[i];
      const can = (t: number) => {
        if (t === 0) return true;
        let sum = 0;
        const need = t * n;
        for (let i = 0; i < batteries.length; i++) {
          sum += Math.min(batteries[i], t);
          if (sum >= need) return true;
        }
        return sum >= need;
      };
      let lo = 0, hi = Math.floor(total / n);
      while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (can(mid)) lo = mid; else hi = mid - 1;
      }
      return lo;
    };
    return {
      slug: "maximum-running-time-of-n-computers",
      title: "Maximum Running Time of N Computers",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Greedy", "Sorting", "Amazon", "Google", "Intuit"],
      signature: { funcName: "maxRunTime", params: [{ name: "n", type: "int" as const }, { name: "batteries", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You want to run `n` computers **simultaneously**. Battery `i` can power one computer for `batteries[i]` minutes.\n\nAt any integer minute you may swap batteries between computers, as often as you like, but a battery powers at most one computer at a time. Return the maximum number of minutes all `n` computers can run together.",
        [
          { in: "n = 2, batteries = [3,3,3]", out: "4", note: "Run two batteries for 2 minutes, then rotate the third in." },
          { in: "n = 2, batteries = [1,1,1,1]", out: "2" },
          { in: "n = 3, batteries = [10,10,3,5]", out: "8", note: "Three computers for 8 minutes need 24 battery-minutes, and capping each battery at 8 supplies exactly 8+8+3+5." },
        ],
        ["1 <= n <= batteries.length <= 1000", "1 <= batteries[i] <= 1000000"]),
      hints: [
        "If running for `t` minutes is possible, so is any shorter time — the feasibility is monotone.",
        "A battery can contribute at most `t` minutes towards a target of `t`, however it is swapped.",
        "So `t` works exactly when `sum(min(batteries[i], t)) >= t · n`.",
      ],
      editorial: explain({
        idea: "Binary search the running time. For a target `t`, each battery's usable contribution is capped at `t` — no single computer can use more than `t` minutes from one battery — and any allocation meeting the total demand `t · n` can actually be scheduled.",
        steps: [
          "Search `t` over `[0, total / n]`.",
          "`can(t)`: check `sum(min(batteries[i], t)) >= t · n`.",
          "Take the largest feasible `t` with the upper-biased midpoint.",
        ],
        why: "The cap is necessary because a battery powers one computer at a time, so it can supply at most `t` of the `t` minutes. It is also sufficient: with every battery capped at `t`, the capped amounts can be laid out across the `n` computers' timelines greedily without any battery overlapping itself — exactly the classic scheduling argument for splittable jobs with a per-job cap. Raising `t` raises the demand faster than the capped supply, so feasibility is monotone.",
        time: "O(m log(total / n))",
        space: "O(1)",
        pitfalls: [
          "`t · n` reaches about `10^9 · 10^3 = 10^12` — the comparison needs 64-bit.",
          "Without the `min(·, t)` cap, one huge battery would appear to power everything.",
          "The upper-biased midpoint is needed for a maximise search.",
        ],
      }),
      examples: [
        { input: "2\n[3,3,3]", expectedOutput: "4" },
        { input: "2\n[1,1,1,1]", expectedOutput: "2" },
        { input: "3\n[10,10,3,5]", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 25);
        const hi = rng() < 0.6 ? 30 : 1000000;
        const batteries = Array.from({ length: m }, () => ri(rng, 1, hi));
        const n = ri(rng, 1, m);
        return { input: `${n}\n${fmtIntArr(batteries)}`, expectedOutput: String(ref(n, batteries)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxRunTime(n: int, batteries: List[int]) -> int:\n    lo, hi = 0, sum(batteries) // n\n\n    def can(t: int) -> bool:\n        if t == 0:\n            return True\n        need = t * n\n        total = 0\n        for b in batteries:\n            total += min(b, t)\n            if total >= need:\n                return True\n        return total >= need\n\n    while lo < hi:\n        mid = (lo + hi + 1) // 2\n        if can(mid):\n            lo = mid\n        else:\n            hi = mid - 1\n    return lo`,
        javascript: `var maxRunTime = function(n, batteries) {\n    var total = 0, i;\n    for (i = 0; i < batteries.length; i++) total += batteries[i];\n    var can = function(t) {\n        if (t === 0) return true;\n        var sum = 0, need = t * n;\n        for (var j = 0; j < batteries.length; j++) {\n            sum += Math.min(batteries[j], t);\n            if (sum >= need) return true;\n        }\n        return sum >= need;\n    };\n    var lo = 0, hi = Math.floor(total / n);\n    while (lo < hi) {\n        var mid = Math.ceil((lo + hi) / 2);\n        if (can(mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n};`,
        typescript: `function maxRunTime(n: number, batteries: number[]): number {\n    var total = 0, i: number;\n    for (i = 0; i < batteries.length; i++) total += batteries[i];\n    var can = function(t: number): boolean {\n        if (t === 0) return true;\n        var sum = 0, need = t * n;\n        for (var j = 0; j < batteries.length; j++) {\n            sum += Math.min(batteries[j], t);\n            if (sum >= need) return true;\n        }\n        return sum >= need;\n    };\n    var lo = 0, hi = Math.floor(total / n);\n    while (lo < hi) {\n        var mid = Math.ceil((lo + hi) / 2);\n        if (can(mid)) lo = mid; else hi = mid - 1;\n    }\n    return lo;\n}`,
        java: `private static boolean canRun(int n, int[] batteries, long t) {\n    if (t == 0) return true;\n    long need = t * n;\n    long total = 0;\n    for (int b : batteries) {\n        total += Math.min((long) b, t);\n        if (total >= need) return true;\n    }\n    return total >= need;\n}\n\npublic static int maxRunTime(int n, int[] batteries) {\n    long sum = 0;\n    for (int b : batteries) sum += b;\n    long lo = 0, hi = sum / n;\n    while (lo < hi) {\n        long mid = lo + (hi - lo + 1) / 2;\n        if (canRun(n, batteries, mid)) lo = mid; else hi = mid - 1;\n    }\n    return (int) lo;\n}`,
        cpp: `static bool canRun(int n, vector<int>& batteries, long long t) {\n    if (t == 0) return true;\n    long long need = t * n;\n    long long total = 0;\n    for (int b : batteries) {\n        total += min((long long) b, t);\n        if (total >= need) return true;\n    }\n    return total >= need;\n}\n\nint maxRunTime(int n, vector<int>& batteries) {\n    long long sum = 0;\n    for (int b : batteries) sum += b;\n    long long lo = 0, hi = sum / n;\n    while (lo < hi) {\n        long long mid = lo + (hi - lo + 1) / 2;\n        if (canRun(n, batteries, mid)) lo = mid; else hi = mid - 1;\n    }\n    return (int) lo;\n}`,
        c: `static int canRun(int n, int* batteries, int m, long long t) {\n    if (t == 0) return 1;\n    long long need = t * (long long) n;\n    long long total = 0;\n    for (int i = 0; i < m; i++) {\n        long long b = (long long) batteries[i];\n        total += b < t ? b : t;\n        if (total >= need) return 1;\n    }\n    return total >= need;\n}\n\nint maxRunTime(int n, int* batteries, int batteriesSize) {\n    long long sum = 0;\n    for (int i = 0; i < batteriesSize; i++) sum += batteries[i];\n    long long lo = 0, hi = sum / (long long) n;\n    while (lo < hi) {\n        long long mid = lo + (hi - lo + 1) / 2;\n        if (canRun(n, batteries, batteriesSize, mid)) lo = mid; else hi = mid - 1;\n    }\n    return (int) lo;\n}`,
        csharp: `private static bool CanRun(int n, int[] batteries, long t)\n{\n    if (t == 0) return true;\n    long need = t * n;\n    long total = 0;\n    foreach (int b in batteries)\n    {\n        total += Math.Min((long) b, t);\n        if (total >= need) return true;\n    }\n    return total >= need;\n}\n\npublic static int MaxRunTime(int n, int[] batteries)\n{\n    long sum = 0;\n    foreach (int b in batteries) sum += b;\n    long lo = 0, hi = sum / n;\n    while (lo < hi)\n    {\n        long mid = lo + (hi - lo + 1) / 2;\n        if (CanRun(n, batteries, mid)) lo = mid; else hi = mid - 1;\n    }\n    return (int) lo;\n}`,
        go: `func canRun(n int, batteries []int, t int) bool {\n\tif t == 0 {\n\t\treturn true\n\t}\n\tneed := t * n\n\ttotal := 0\n\tfor _, b := range batteries {\n\t\tif b < t {\n\t\t\ttotal += b\n\t\t} else {\n\t\t\ttotal += t\n\t\t}\n\t\tif total >= need {\n\t\t\treturn true\n\t\t}\n\t}\n\treturn total >= need\n}\n\nfunc maxRunTime(n int, batteries []int) int {\n\tsum := 0\n\tfor _, b := range batteries {\n\t\tsum += b\n\t}\n\tlo, hi := 0, sum/n\n\tfor lo < hi {\n\t\tmid := lo + (hi-lo+1)/2\n\t\tif canRun(n, batteries, mid) {\n\t\t\tlo = mid\n\t\t} else {\n\t\t\thi = mid - 1\n\t\t}\n\t}\n\treturn lo\n}`,
        kotlin: `private fun canRun(n: Int, batteries: IntArray, t: Long): Boolean {\n    if (t == 0L) return true\n    val need = t * n\n    var total = 0L\n    for (b in batteries) {\n        total += minOf(b.toLong(), t)\n        if (total >= need) return true\n    }\n    return total >= need\n}\n\nfun maxRunTime(n: Int, batteries: IntArray): Int {\n    var sum = 0L\n    for (b in batteries) sum += b\n    var lo = 0L\n    var hi = sum / n\n    while (lo < hi) {\n        val mid = lo + (hi - lo + 1) / 2\n        if (canRun(n, batteries, mid)) lo = mid else hi = mid - 1\n    }\n    return lo.toInt()\n}`,
        swift: `func maxRunTime(_ n: Int, _ batteries: [Int]) -> Int {\n    let sum = batteries.reduce(0, +)\n    func can(_ t: Int) -> Bool {\n        if t == 0 { return true }\n        let need = t * n\n        var total = 0\n        for b in batteries {\n            total += min(b, t)\n            if total >= need { return true }\n        }\n        return total >= need\n    }\n    var lo = 0\n    var hi = sum / n\n    while lo < hi {\n        let mid = lo + (hi - lo + 1) / 2\n        if can(mid) { lo = mid } else { hi = mid - 1 }\n    }\n    return lo\n}`,
        rust: `fn maxRunTime(n: i32, batteries: Vec<i32>) -> i32 {\n    let sum: i64 = batteries.iter().map(|&b| b as i64).sum();\n    let can = |t: i64| -> bool {\n        if t == 0 {\n            return true;\n        }\n        let need = t * n as i64;\n        let mut total: i64 = 0;\n        for &b in batteries.iter() {\n            total += (b as i64).min(t);\n            if total >= need {\n                return true;\n            }\n        }\n        total >= need\n    };\n    let mut lo: i64 = 0;\n    let mut hi: i64 = sum / n as i64;\n    while lo < hi {\n        let mid = lo + (hi - lo + 1) / 2;\n        if can(mid) {\n            lo = mid;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    lo as i32\n}`,
        php: `function maxRunTime($n, $batteries) {\n    $sum = array_sum($batteries);\n    $can = function($t) use ($n, $batteries) {\n        if ($t === 0) return true;\n        $need = $t * $n;\n        $total = 0;\n        foreach ($batteries as $b) {\n            $total += min($b, $t);\n            if ($total >= $need) return true;\n        }\n        return $total >= $need;\n    };\n    $lo = 0;\n    $hi = intdiv($sum, $n);\n    while ($lo < $hi) {\n        $mid = $lo + intdiv($hi - $lo + 1, 2);\n        if ($can($mid)) $lo = $mid; else $hi = $mid - 1;\n    }\n    return $lo;\n}`,
        ruby: `def maxRunTime(n, batteries)\n  sum = batteries.sum\n  can = lambda do |t|\n    next true if t == 0\n    need = t * n\n    total = 0\n    batteries.each do |b|\n      total += [b, t].min\n      return true if total >= need\n    end\n    total >= need\n  end\n  lo = 0\n  hi = sum / n\n  while lo < hi\n    mid = lo + (hi - lo + 1) / 2\n    if can.call(mid)\n      lo = mid\n    else\n      hi = mid - 1\n    end\n  end\n  lo\nend`,
      },
    };
  })(),

  // ── Russian Doll Envelopes (LC 354) ─────────────────────────────
  (() => {
    const ref = (envelopes: number[][]) => {
      const e = envelopes.slice().sort((a, b) => (a[0] !== b[0] ? a[0] - b[0] : b[1] - a[1]));
      const tails: number[] = [];
      for (let i = 0; i < e.length; i++) {
        const h = e[i][1];
        let lo = 0, hi = tails.length;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (tails[mid] < h) lo = mid + 1; else hi = mid;
        }
        if (lo === tails.length) tails.push(h); else tails[lo] = h;
      }
      return tails.length;
    };
    return {
      slug: "russian-doll-envelopes",
      title: "Russian Doll Envelopes",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Dynamic Programming", "Sorting", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "maxEnvelopes", params: [{ name: "envelopes", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "`envelopes[i] = [w_i, h_i]`. One envelope fits inside another when **both** its width and its height are strictly smaller.\n\nReturn the maximum number of envelopes you can nest, like Russian dolls.",
        [
          { in: "envelopes = [[5,4],[6,4],[6,7],[2,3]]", out: "3", note: "[2,3] → [5,4] → [6,7]." },
          { in: "envelopes = [[1,1],[1,1],[1,1]]", out: "1", note: "Equal dimensions do not nest." },
          { in: "envelopes = [[4,5],[4,6],[6,7],[2,3],[1,1]]", out: "4" },
        ],
        ["1 <= envelopes.length <= 100000", "1 <= w_i, h_i <= 100000"]),
      hints: [
        "Sort by width so only the height still needs deciding.",
        "For equal widths, sort the heights **descending** — that stops two same-width envelopes being chained.",
        "The answer is then the longest strictly increasing subsequence of the heights, which binary search finds in `n log n`.",
      ],
      editorial: explain({
        idea: "Sorting reduces the two-dimensional nesting to a one-dimensional longest increasing subsequence on the heights. The descending tie-break on height is the whole trick: it makes two envelopes of equal width unable to both appear in an increasing run.",
        steps: [
          "Sort by width ascending; within equal widths, sort height descending.",
          "Run the patience-sorting LIS on the heights: keep `tails`, where `tails[i]` is the smallest possible tail of an increasing subsequence of length `i + 1`.",
          "For each height, binary search its lower bound in `tails` and either extend or overwrite.",
          "The answer is `tails.length`.",
        ],
        why: "After the sort, a valid nesting chain is exactly a strictly increasing subsequence of the heights: widths are non-decreasing by construction, and the descending tie-break means any two entries with the same width have non-increasing heights, so they can never both be picked. `tails` stays sorted, which is what makes the binary search valid, and its length is the LIS length by the standard patience-sorting argument.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Sorting heights ascending within equal widths lets two same-width envelopes nest, over-counting.",
          "The lower bound must use `<` (strictly increasing), not `<=`, or equal heights get chained.",
          "The `O(n²)` dynamic program is the obvious first approach and times out at `n = 10^5`.",
        ],
      }),
      examples: [
        { input: "[[5,4],[6,4],[6,7],[2,3]]", expectedOutput: "3" },
        { input: "[[1,1],[1,1],[1,1]]", expectedOutput: "1" },
        { input: "[[4,5],[4,6],[6,7],[2,3],[1,1]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const span = rng() < 0.6 ? 10 : 100000;
        const envelopes = Array.from({ length: ri(rng, 1, 25) }, () => [ri(rng, 1, span), ri(rng, 1, span)]);
        return { input: fmtIntMat(envelopes), expectedOutput: String(ref(envelopes)) };
      },
      solutions: {
        python: `from bisect import bisect_left\nfrom typing import List\n\ndef maxEnvelopes(envelopes: List[List[int]]) -> int:\n    e = sorted(envelopes, key=lambda x: (x[0], -x[1]))\n    tails = []\n    for _, h in e:\n        i = bisect_left(tails, h)\n        if i == len(tails):\n            tails.append(h)\n        else:\n            tails[i] = h\n    return len(tails)`,
        javascript: `var maxEnvelopes = function(envelopes) {\n    var e = envelopes.slice().sort(function(a, b) {\n        return a[0] !== b[0] ? a[0] - b[0] : b[1] - a[1];\n    });\n    var tails = [];\n    for (var i = 0; i < e.length; i++) {\n        var h = e[i][1];\n        var lo = 0, hi = tails.length;\n        while (lo < hi) {\n            var mid = (lo + hi) >> 1;\n            if (tails[mid] < h) lo = mid + 1; else hi = mid;\n        }\n        if (lo === tails.length) tails.push(h); else tails[lo] = h;\n    }\n    return tails.length;\n};`,
        typescript: `function maxEnvelopes(envelopes: number[][]): number {\n    var e = envelopes.slice().sort(function(a, b) {\n        return a[0] !== b[0] ? a[0] - b[0] : b[1] - a[1];\n    });\n    var tails: number[] = [];\n    for (var i = 0; i < e.length; i++) {\n        var h = e[i][1];\n        var lo = 0, hi = tails.length;\n        while (lo < hi) {\n            var mid = (lo + hi) >> 1;\n            if (tails[mid] < h) lo = mid + 1; else hi = mid;\n        }\n        if (lo === tails.length) tails.push(h); else tails[lo] = h;\n    }\n    return tails.length;\n}`,
        java: `public static int maxEnvelopes(int[][] envelopes) {\n    int[][] e = envelopes.clone();\n    Arrays.sort(e, (a, b) -> a[0] != b[0] ? Integer.compare(a[0], b[0]) : Integer.compare(b[1], a[1]));\n    int[] tails = new int[e.length];\n    int size = 0;\n    for (int[] env : e) {\n        int h = env[1];\n        int lo = 0, hi = size;\n        while (lo < hi) {\n            int mid = (lo + hi) >>> 1;\n            if (tails[mid] < h) lo = mid + 1; else hi = mid;\n        }\n        tails[lo] = h;\n        if (lo == size) size++;\n    }\n    return size;\n}`,
        cpp: `int maxEnvelopes(vector<vector<int>>& envelopes) {\n    vector<vector<int>> e = envelopes;\n    sort(e.begin(), e.end(), [](const vector<int>& a, const vector<int>& b) {\n        return a[0] != b[0] ? a[0] < b[0] : a[1] > b[1];\n    });\n    vector<int> tails;\n    for (auto& env : e) {\n        int h = env[1];\n        int lo = 0, hi = (int) tails.size();\n        while (lo < hi) {\n            int mid = (lo + hi) / 2;\n            if (tails[mid] < h) lo = mid + 1; else hi = mid;\n        }\n        if (lo == (int) tails.size()) tails.push_back(h); else tails[lo] = h;\n    }\n    return (int) tails.size();\n}`,
        c: `static int cmpEnvelope(const void* a, const void* b) {\n    const int* x = *(const int**) a;\n    const int* y = *(const int**) b;\n    if (x[0] != y[0]) return (x[0] > y[0]) - (x[0] < y[0]);\n    return (y[1] > x[1]) - (y[1] < x[1]);\n}\n\nint maxEnvelopes(int** envelopes, int envelopesSize, int* envelopesColSize) {\n    (void) envelopesColSize;\n    int** e = (int**) malloc((size_t) envelopesSize * sizeof(int*));\n    for (int i = 0; i < envelopesSize; i++) e[i] = envelopes[i];\n    qsort(e, (size_t) envelopesSize, sizeof(int*), cmpEnvelope);\n    int* tails = (int*) malloc((size_t) envelopesSize * sizeof(int));\n    int size = 0;\n    for (int i = 0; i < envelopesSize; i++) {\n        int h = e[i][1];\n        int lo = 0, hi = size;\n        while (lo < hi) {\n            int mid = (lo + hi) / 2;\n            if (tails[mid] < h) lo = mid + 1; else hi = mid;\n        }\n        tails[lo] = h;\n        if (lo == size) size++;\n    }\n    free(e);\n    free(tails);\n    return size;\n}`,
        csharp: `public static int MaxEnvelopes(int[][] envelopes)\n{\n    var e = (int[][]) envelopes.Clone();\n    Array.Sort(e, (a, b) => a[0] != b[0] ? a[0].CompareTo(b[0]) : b[1].CompareTo(a[1]));\n    int[] tails = new int[e.Length];\n    int size = 0;\n    foreach (var env in e)\n    {\n        int h = env[1];\n        int lo = 0, hi = size;\n        while (lo < hi)\n        {\n            int mid = (lo + hi) / 2;\n            if (tails[mid] < h) lo = mid + 1; else hi = mid;\n        }\n        tails[lo] = h;\n        if (lo == size) size++;\n    }\n    return size;\n}`,
        go: `func maxEnvelopes(envelopes [][]int) int {\n\te := make([][]int, len(envelopes))\n\tcopy(e, envelopes)\n\tsort.Slice(e, func(a, b int) bool {\n\t\tif e[a][0] != e[b][0] {\n\t\t\treturn e[a][0] < e[b][0]\n\t\t}\n\t\treturn e[a][1] > e[b][1]\n\t})\n\ttails := []int{}\n\tfor _, env := range e {\n\t\th := env[1]\n\t\tlo, hi := 0, len(tails)\n\t\tfor lo < hi {\n\t\t\tmid := (lo + hi) / 2\n\t\t\tif tails[mid] < h {\n\t\t\t\tlo = mid + 1\n\t\t\t} else {\n\t\t\t\thi = mid\n\t\t\t}\n\t\t}\n\t\tif lo == len(tails) {\n\t\t\ttails = append(tails, h)\n\t\t} else {\n\t\t\ttails[lo] = h\n\t\t}\n\t}\n\treturn len(tails)\n}`,
        kotlin: `fun maxEnvelopes(envelopes: Array<IntArray>): Int {\n    val e = envelopes.copyOf()\n    e.sortWith(Comparator { a, b ->\n        if (a[0] != b[0]) a[0].compareTo(b[0]) else b[1].compareTo(a[1])\n    })\n    val tails = IntArray(e.size)\n    var size = 0\n    for (env in e) {\n        val h = env[1]\n        var lo = 0\n        var hi = size\n        while (lo < hi) {\n            val mid = (lo + hi) / 2\n            if (tails[mid] < h) lo = mid + 1 else hi = mid\n        }\n        tails[lo] = h\n        if (lo == size) size++\n    }\n    return size\n}`,
        swift: `func maxEnvelopes(_ envelopes: [[Int]]) -> Int {\n    let e = envelopes.sorted { a, b in\n        a[0] != b[0] ? a[0] < b[0] : a[1] > b[1]\n    }\n    var tails = [Int]()\n    for env in e {\n        let h = env[1]\n        var lo = 0\n        var hi = tails.count\n        while lo < hi {\n            let mid = (lo + hi) / 2\n            if tails[mid] < h { lo = mid + 1 } else { hi = mid }\n        }\n        if lo == tails.count { tails.append(h) } else { tails[lo] = h }\n    }\n    return tails.count\n}`,
        rust: `fn maxEnvelopes(envelopes: Vec<Vec<i32>>) -> i32 {\n    let mut e = envelopes.clone();\n    e.sort_by(|a, b| {\n        if a[0] != b[0] {\n            a[0].cmp(&b[0])\n        } else {\n            b[1].cmp(&a[1])\n        }\n    });\n    let mut tails: Vec<i32> = Vec::new();\n    for env in e.iter() {\n        let h = env[1];\n        let mut lo = 0usize;\n        let mut hi = tails.len();\n        while lo < hi {\n            let mid = (lo + hi) / 2;\n            if tails[mid] < h {\n                lo = mid + 1;\n            } else {\n                hi = mid;\n            }\n        }\n        if lo == tails.len() {\n            tails.push(h);\n        } else {\n            tails[lo] = h;\n        }\n    }\n    tails.len() as i32\n}`,
        php: `function maxEnvelopes($envelopes) {\n    $e = $envelopes;\n    usort($e, function($a, $b) {\n        if ($a[0] !== $b[0]) return $a[0] - $b[0];\n        return $b[1] - $a[1];\n    });\n    $tails = [];\n    foreach ($e as $env) {\n        $h = $env[1];\n        $lo = 0;\n        $hi = count($tails);\n        while ($lo < $hi) {\n            $mid = intdiv($lo + $hi, 2);\n            if ($tails[$mid] < $h) $lo = $mid + 1; else $hi = $mid;\n        }\n        if ($lo === count($tails)) $tails[] = $h; else $tails[$lo] = $h;\n    }\n    return count($tails);\n}`,
        ruby: `def maxEnvelopes(envelopes)\n  e = envelopes.sort { |a, b| a[0] != b[0] ? a[0] <=> b[0] : b[1] <=> a[1] }\n  tails = []\n  e.each do |env|\n    h = env[1]\n    lo = 0\n    hi = tails.length\n    while lo < hi\n      mid = (lo + hi) / 2\n      if tails[mid] < h\n        lo = mid + 1\n      else\n        hi = mid\n      end\n    end\n    if lo == tails.length\n      tails << h\n    else\n      tails[lo] = h\n    end\n  end\n  tails.length\nend`,
      },
    };
  })(),

  // ── Find the Kth Smallest Sum of a Matrix With Sorted Rows (LC 1439) ──
  (() => {
    const ref = (mat: number[][], k: number) => {
      let cur = [0];
      for (let r = 0; r < mat.length; r++) {
        const next: number[] = [];
        for (let i = 0; i < cur.length; i++) {
          for (let j = 0; j < mat[r].length; j++) next.push(cur[i] + mat[r][j]);
        }
        next.sort((a, b) => a - b);
        cur = next.slice(0, k);
      }
      return cur[k - 1];
    };
    return {
      slug: "find-the-kth-smallest-sum-of-a-matrix-with-sorted-rows",
      title: "Find the Kth Smallest Sum of a Matrix With Sorted Rows",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Binary Search", "Heap", "Amazon", "Google", "Uber"],
      signature: { funcName: "kthSmallest", params: [{ name: "mat", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`mat` has `m` rows, each sorted in non-decreasing order. An **array sum** picks exactly one element from every row and adds them up.\n\nReturn the `k`-th smallest array sum among all `n^m` possibilities.",
        [
          { in: "mat = [[1,3,11],[2,4,6]], k = 5", out: "7", note: "The smallest sums are 3, 5, 7, 7, 9 — the fifth is 7 (1+6 and 3+4 both give 7)." },
          { in: "mat = [[1,3,11],[2,4,6]], k = 9", out: "17" },
          { in: "mat = [[1,10,10],[1,4,5],[2,3,6]], k = 7", out: "9" },
        ],
        ["m == mat.length", "n == mat[i].length", "1 <= m, n <= 40", "1 <= mat[i][j] <= 5000", "1 <= k <= min(200, n^m)", "Each row of mat is sorted in non-decreasing order."]),
      hints: [
        "`n^m` can be astronomically large, so the sums cannot be enumerated.",
        "Merge the rows one at a time, and after each merge keep only the `k` smallest partial sums.",
        "Anything beyond the `k`-th smallest partial sum can never contribute to the `k`-th smallest total.",
      ],
      editorial: explain({
        idea: "Fold the rows in one by one. After absorbing a row, keep only the `k` smallest partial sums — the rest can never grow into one of the `k` smallest totals, because every remaining row only adds non-negative amounts.",
        steps: [
          "Start with the single partial sum `0`.",
          "For each row, form every `partial + element`, sort, and truncate to `k` entries.",
          "After the last row, the answer is the `k`-th entry.",
        ],
        why: "If a partial sum is not among the `k` smallest at some stage, then at least `k` partial sums are no larger, and each of them extends to a total no larger than this one's best extension (the remaining rows add the same minimum to all of them). So at least `k` totals beat it, and it cannot be the `k`-th smallest. Each fold handles at most `k · n` candidates, bounding the whole computation.",
        time: "O(m · k · n · log(k · n))",
        space: "O(k · n)",
        pitfalls: [
          "Trying to enumerate all `n^m` combinations overflows any counter, let alone memory.",
          "Truncating before sorting keeps the wrong `k` candidates.",
          "A min-heap over `(sum, indices)` also works but needs a visited set to avoid re-expanding states.",
        ],
      }),
      examples: [
        { input: "[[1,3,11],[2,4,6]]\n5", expectedOutput: "7" },
        { input: "[[1,3,11],[2,4,6]]\n9", expectedOutput: "17" },
        { input: "[[1,10,10],[1,4,5],[2,3,6]]\n7", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 5);
        const n = ri(rng, 1, 6);
        const mat = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 1, 5000)).sort((a, b) => a - b));
        let prod = 1;
        for (let i = 0; i < m; i++) prod = Math.min(prod * n, 500);
        const k = ri(rng, 1, Math.min(200, prod));
        return { input: `${fmtIntMat(mat)}\n${k}`, expectedOutput: String(ref(mat, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef kthSmallest(mat: List[List[int]], k: int) -> int:\n    cur = [0]\n    for row in mat:\n        nxt = []\n        for c in cur:\n            for v in row:\n                nxt.append(c + v)\n        nxt.sort()\n        cur = nxt[:k]\n    return cur[k - 1]`,
        javascript: `var kthSmallest = function(mat, k) {\n    var cur = [0];\n    for (var r = 0; r < mat.length; r++) {\n        var next = [];\n        for (var i = 0; i < cur.length; i++) {\n            for (var j = 0; j < mat[r].length; j++) next.push(cur[i] + mat[r][j]);\n        }\n        next.sort(function(a, b) { return a - b; });\n        cur = next.slice(0, k);\n    }\n    return cur[k - 1];\n};`,
        typescript: `function kthSmallest(mat: number[][], k: number): number {\n    var cur: number[] = [0];\n    for (var r = 0; r < mat.length; r++) {\n        var next: number[] = [];\n        for (var i = 0; i < cur.length; i++) {\n            for (var j = 0; j < mat[r].length; j++) next.push(cur[i] + mat[r][j]);\n        }\n        next.sort(function(a, b) { return a - b; });\n        cur = next.slice(0, k);\n    }\n    return cur[k - 1];\n}`,
        java: `public static int kthSmallest(int[][] mat, int k) {\n    int[] cur = new int[] { 0 };\n    for (int[] row : mat) {\n        int[] next = new int[cur.length * row.length];\n        int p = 0;\n        for (int c : cur) {\n            for (int v : row) next[p++] = c + v;\n        }\n        Arrays.sort(next);\n        int keep = Math.min(k, next.length);\n        cur = Arrays.copyOf(next, keep);\n    }\n    return cur[k - 1];\n}`,
        cpp: `int kthSmallest(vector<vector<int>>& mat, int k) {\n    vector<int> cur;\n    cur.push_back(0);\n    for (auto& row : mat) {\n        vector<int> next;\n        for (int c : cur) {\n            for (int v : row) next.push_back(c + v);\n        }\n        sort(next.begin(), next.end());\n        if ((int) next.size() > k) next.resize(k);\n        cur = next;\n    }\n    return cur[k - 1];\n}`,
        c: `static int cmpSumAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint kthSmallest(int** mat, int matSize, int* matColSize, int k) {\n    int* cur = (int*) malloc(sizeof(int));\n    cur[0] = 0;\n    int curLen = 1;\n    for (int r = 0; r < matSize; r++) {\n        int n = matColSize[r];\n        int* next = (int*) malloc((size_t) curLen * (size_t) n * sizeof(int));\n        int p = 0;\n        for (int i = 0; i < curLen; i++) {\n            for (int j = 0; j < n; j++) next[p++] = cur[i] + mat[r][j];\n        }\n        qsort(next, (size_t) p, sizeof(int), cmpSumAsc);\n        int keep = p < k ? p : k;\n        free(cur);\n        cur = (int*) malloc((size_t) keep * sizeof(int));\n        for (int i = 0; i < keep; i++) cur[i] = next[i];\n        curLen = keep;\n        free(next);\n    }\n    int ans = cur[k - 1];\n    free(cur);\n    return ans;\n}`,
        csharp: `public static int KthSmallest(int[][] mat, int k)\n{\n    int[] cur = new int[] { 0 };\n    foreach (var row in mat)\n    {\n        int[] next = new int[cur.Length * row.Length];\n        int p = 0;\n        foreach (int c in cur)\n        {\n            foreach (int v in row) next[p++] = c + v;\n        }\n        Array.Sort(next);\n        int keep = Math.Min(k, next.Length);\n        var kept = new int[keep];\n        Array.Copy(next, kept, keep);\n        cur = kept;\n    }\n    return cur[k - 1];\n}`,
        go: `func kthSmallest(mat [][]int, k int) int {\n\tcur := []int{0}\n\tfor _, row := range mat {\n\t\tnext := make([]int, 0, len(cur)*len(row))\n\t\tfor _, c := range cur {\n\t\t\tfor _, v := range row {\n\t\t\t\tnext = append(next, c+v)\n\t\t\t}\n\t\t}\n\t\tsort.Ints(next)\n\t\tif len(next) > k {\n\t\t\tnext = next[:k]\n\t\t}\n\t\tcur = next\n\t}\n\treturn cur[k-1]\n}`,
        kotlin: `fun kthSmallest(mat: Array<IntArray>, k: Int): Int {\n    var cur = intArrayOf(0)\n    for (row in mat) {\n        val next = IntArray(cur.size * row.size)\n        var p = 0\n        for (c in cur) {\n            for (v in row) {\n                next[p++] = c + v\n            }\n        }\n        next.sort()\n        val keep = minOf(k, next.size)\n        cur = next.copyOf(keep)\n    }\n    return cur[k - 1]\n}`,
        swift: `func kthSmallest(_ mat: [[Int]], _ k: Int) -> Int {\n    var cur = [0]\n    for row in mat {\n        var next = [Int]()\n        for c in cur {\n            for v in row { next.append(c + v) }\n        }\n        next.sort()\n        if next.count > k { next = Array(next.prefix(k)) }\n        cur = next\n    }\n    return cur[k - 1]\n}`,
        rust: `fn kthSmallest(mat: Vec<Vec<i32>>, k: i32) -> i32 {\n    let k = k as usize;\n    let mut cur: Vec<i32> = vec![0];\n    for row in mat.iter() {\n        let mut next: Vec<i32> = Vec::with_capacity(cur.len() * row.len());\n        for &c in cur.iter() {\n            for &v in row.iter() {\n                next.push(c + v);\n            }\n        }\n        next.sort();\n        if next.len() > k {\n            next.truncate(k);\n        }\n        cur = next;\n    }\n    cur[k - 1]\n}`,
        php: `function kthSmallest($mat, $k) {\n    $cur = [0];\n    foreach ($mat as $row) {\n        $next = [];\n        foreach ($cur as $c) {\n            foreach ($row as $v) $next[] = $c + $v;\n        }\n        sort($next);\n        $cur = array_slice($next, 0, $k);\n    }\n    return $cur[$k - 1];\n}`,
        ruby: `def kthSmallest(mat, k)\n  cur = [0]\n  mat.each do |row|\n    nxt = []\n    cur.each do |c|\n      row.each { |v| nxt << c + v }\n    end\n    nxt.sort!\n    cur = nxt[0, k]\n  end\n  cur[k - 1]\nend`,
      },
    };
  })(),

  // ── Maximum Number of Tasks You Can Assign (LC 2071) ────────────
  (() => {
    const ref = (tasks: number[], workers: number[], pills: number, strength: number) => {
      const t = tasks.slice().sort((a, b) => a - b);
      const w = workers.slice().sort((a, b) => a - b);
      const check = (k: number) => {
        let left = pills;
        const avail = w.slice(w.length - k);
        for (let i = k - 1; i >= 0; i--) {
          const need = t[i];
          if (avail.length > 0 && avail[avail.length - 1] >= need) { avail.pop(); continue; }
          if (left === 0) return false;
          let lo = 0, hi = avail.length;
          while (lo < hi) {
            const mid = (lo + hi) >> 1;
            if (avail[mid] + strength >= need) hi = mid; else lo = mid + 1;
          }
          if (lo === avail.length) return false;
          avail.splice(lo, 1);
          left--;
        }
        return true;
      };
      let lo = 0, hi = Math.min(t.length, w.length), ans = 0;
      while (lo <= hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (mid === 0 || check(mid)) { ans = mid; lo = mid + 1; } else hi = mid - 1;
      }
      return ans;
    };
    return {
      slug: "maximum-number-of-tasks-you-can-assign",
      title: "Maximum Number of Tasks You Can Assign",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Greedy", "Sorting", "Queue", "Amazon", "Google", "Databricks"],
      signature: { funcName: "maxTaskAssign", params: [{ name: "tasks", type: "int[]" as const }, { name: "workers", type: "int[]" as const }, { name: "pills", type: "int" as const }, { name: "strength", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Task `i` needs strength `tasks[i]`; worker `j` has strength `workers[j]`. Each worker takes at most one task, and can take task `i` only if their strength is at least `tasks[i]`.\n\nYou also have `pills` magical pills; giving one to a worker raises their strength by `strength` permanently. Each worker takes at most one pill. Return the maximum number of tasks that can be assigned.",
        [
          { in: "tasks = [3,2,1], workers = [0,3,3], pills = 1, strength = 1", out: "3", note: "Pill the strength-0 worker to handle task 1." },
          { in: "tasks = [5,4], workers = [0,0,0], pills = 1, strength = 5", out: "1" },
          { in: "tasks = [10,15,30], workers = [0,10,10,10,10], pills = 3, strength = 10", out: "2" },
        ],
        ["1 <= tasks.length, workers.length <= 1000", "0 <= pills <= workers.length", "0 <= tasks[i], workers[j], strength <= 1000000000"]),
      hints: [
        "If `k` tasks can be assigned, so can `k - 1` — binary search `k`.",
        "For a given `k`, always use the `k` **easiest** tasks and the `k` **strongest** workers.",
        "Assign the hardest of those tasks first; use a pill only when the strongest free worker cannot manage it, and then pick the *weakest* worker who can with a pill.",
      ],
      editorial: explain({
        idea: "Binary search the number of tasks. For a fixed `k`, the choice of which tasks and workers to use is forced — the easiest tasks and the strongest workers — and then a greedy from the hardest task downwards, spending pills as late and as cheaply as possible, decides feasibility.",
        steps: [
          "Sort both arrays. For a candidate `k`, take `tasks[0 … k-1]` and the top `k` workers.",
          "Walk the chosen tasks from hardest to easiest. If the strongest free worker already qualifies, use them.",
          "Otherwise spend a pill on the **weakest** free worker who qualifies with it — found by binary search — so stronger workers stay for harder tasks.",
          "If no worker qualifies even with a pill, or pills run out, `k` is infeasible.",
        ],
        why: "Using the easiest tasks and strongest workers is an exchange argument: swapping in an easier task or a stronger worker never breaks a valid assignment. Within that, handling the hardest task first is forced because only the strongest workers can do it, and when a pill is needed the weakest qualifying worker is the right choice — spending the pill on anyone stronger wastes capacity that a harder task might have needed.",
        time: "O(n log n + n² log n) at these limits",
        space: "O(n)",
        pitfalls: [
          "Assigning the easiest task first, or pilling the strongest worker, both give wrong answers.",
          "The strongest free worker must be checked *before* reaching for a pill, or pills get wasted.",
          "`workers[j] + strength` reaches `2 · 10^9` — the comparison needs 64-bit in languages where `int` is 32-bit.",
        ],
      }),
      examples: [
        { input: "[3,2,1]\n[0,3,3]\n1\n1", expectedOutput: "3" },
        { input: "[5,4]\n[0,0,0]\n1\n5", expectedOutput: "1" },
        { input: "[10,15,30]\n[0,10,10,10,10]\n3\n10", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 20 : 1000000000;
        const tasks = Array.from({ length: ri(rng, 1, 14) }, () => ri(rng, 0, hi));
        const workers = Array.from({ length: ri(rng, 1, 14) }, () => ri(rng, 0, hi));
        const pills = ri(rng, 0, workers.length);
        const strength = rng() < 0.6 ? ri(rng, 0, 20) : ri(rng, 0, hi);
        return {
          input: `${fmtIntArr(tasks)}\n${fmtIntArr(workers)}\n${pills}\n${strength}`,
          expectedOutput: String(ref(tasks, workers, pills, strength)),
        };
      },
      solutions: {
        python: `from typing import List\n\ndef maxTaskAssign(tasks: List[int], workers: List[int], pills: int, strength: int) -> int:\n    t = sorted(tasks)\n    w = sorted(workers)\n\n    def check(k: int) -> bool:\n        left = pills\n        avail = w[len(w) - k:]\n        for i in range(k - 1, -1, -1):\n            need = t[i]\n            if avail and avail[-1] >= need:\n                avail.pop()\n                continue\n            if left == 0:\n                return False\n            lo, hi = 0, len(avail)\n            while lo < hi:\n                mid = (lo + hi) // 2\n                if avail[mid] + strength >= need:\n                    hi = mid\n                else:\n                    lo = mid + 1\n            if lo == len(avail):\n                return False\n            avail.pop(lo)\n            left -= 1\n        return True\n\n    lo, hi, ans = 0, min(len(t), len(w)), 0\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if mid == 0 or check(mid):\n            ans = mid\n            lo = mid + 1\n        else:\n            hi = mid - 1\n    return ans`,
        javascript: `var maxTaskAssign = function(tasks, workers, pills, strength) {\n    var t = tasks.slice().sort(function(a, b) { return a - b; });\n    var w = workers.slice().sort(function(a, b) { return a - b; });\n    var check = function(k) {\n        var left = pills;\n        var avail = w.slice(w.length - k);\n        for (var i = k - 1; i >= 0; i--) {\n            var need = t[i];\n            if (avail.length > 0 && avail[avail.length - 1] >= need) { avail.pop(); continue; }\n            if (left === 0) return false;\n            var lo = 0, hi = avail.length;\n            while (lo < hi) {\n                var mid = (lo + hi) >> 1;\n                if (avail[mid] + strength >= need) hi = mid; else lo = mid + 1;\n            }\n            if (lo === avail.length) return false;\n            avail.splice(lo, 1);\n            left--;\n        }\n        return true;\n    };\n    var low = 0, high = Math.min(t.length, w.length), ans = 0;\n    while (low <= high) {\n        var m = Math.floor((low + high) / 2);\n        if (m === 0 || check(m)) { ans = m; low = m + 1; } else high = m - 1;\n    }\n    return ans;\n};`,
        typescript: `function maxTaskAssign(tasks: number[], workers: number[], pills: number, strength: number): number {\n    var t = tasks.slice().sort(function(a, b) { return a - b; });\n    var w = workers.slice().sort(function(a, b) { return a - b; });\n    var check = function(k: number): boolean {\n        var left = pills;\n        var avail = w.slice(w.length - k);\n        for (var i = k - 1; i >= 0; i--) {\n            var need = t[i];\n            if (avail.length > 0 && avail[avail.length - 1] >= need) { avail.pop(); continue; }\n            if (left === 0) return false;\n            var lo = 0, hi = avail.length;\n            while (lo < hi) {\n                var mid = (lo + hi) >> 1;\n                if (avail[mid] + strength >= need) hi = mid; else lo = mid + 1;\n            }\n            if (lo === avail.length) return false;\n            avail.splice(lo, 1);\n            left--;\n        }\n        return true;\n    };\n    var low = 0, high = Math.min(t.length, w.length), ans = 0;\n    while (low <= high) {\n        var m = Math.floor((low + high) / 2);\n        if (m === 0 || check(m)) { ans = m; low = m + 1; } else high = m - 1;\n    }\n    return ans;\n}`,
        java: `private static boolean canAssign(int[] t, int[] w, int pills, int strength, int k) {\n    int left = pills;\n    List<Integer> avail = new ArrayList<>();\n    for (int i = w.length - k; i < w.length; i++) avail.add(w[i]);\n    for (int i = k - 1; i >= 0; i--) {\n        int need = t[i];\n        if (!avail.isEmpty() && avail.get(avail.size() - 1) >= need) {\n            avail.remove(avail.size() - 1);\n            continue;\n        }\n        if (left == 0) return false;\n        int lo = 0, hi = avail.size();\n        while (lo < hi) {\n            int mid = (lo + hi) >>> 1;\n            if ((long) avail.get(mid) + strength >= need) hi = mid; else lo = mid + 1;\n        }\n        if (lo == avail.size()) return false;\n        avail.remove(lo);\n        left--;\n    }\n    return true;\n}\n\npublic static int maxTaskAssign(int[] tasks, int[] workers, int pills, int strength) {\n    int[] t = tasks.clone();\n    int[] w = workers.clone();\n    Arrays.sort(t);\n    Arrays.sort(w);\n    int lo = 0, hi = Math.min(t.length, w.length), ans = 0;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (mid == 0 || canAssign(t, w, pills, strength, mid)) {\n            ans = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return ans;\n}`,
        cpp: `static bool canAssign(vector<int>& t, vector<int>& w, int pills, int strength, int k) {\n    int left = pills;\n    vector<int> avail(w.end() - k, w.end());\n    for (int i = k - 1; i >= 0; i--) {\n        int need = t[i];\n        if (!avail.empty() && avail.back() >= need) {\n            avail.pop_back();\n            continue;\n        }\n        if (left == 0) return false;\n        int lo = 0, hi = (int) avail.size();\n        while (lo < hi) {\n            int mid = (lo + hi) / 2;\n            if ((long long) avail[mid] + strength >= need) hi = mid; else lo = mid + 1;\n        }\n        if (lo == (int) avail.size()) return false;\n        avail.erase(avail.begin() + lo);\n        left--;\n    }\n    return true;\n}\n\nint maxTaskAssign(vector<int>& tasks, vector<int>& workers, int pills, int strength) {\n    vector<int> t = tasks, w = workers;\n    sort(t.begin(), t.end());\n    sort(w.begin(), w.end());\n    int lo = 0, hi = min((int) t.size(), (int) w.size()), ans = 0;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (mid == 0 || canAssign(t, w, pills, strength, mid)) {\n            ans = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    return ans;\n}`,
        c: `static int cmpAssignAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nstatic int canAssign(int* t, int* w, int wn, int pills, int strength, int k) {\n    int left = pills;\n    int* avail = (int*) malloc((size_t) k * sizeof(int));\n    int an = 0;\n    for (int i = wn - k; i < wn; i++) avail[an++] = w[i];\n    for (int i = k - 1; i >= 0; i--) {\n        int need = t[i];\n        if (an > 0 && avail[an - 1] >= need) {\n            an--;\n            continue;\n        }\n        if (left == 0) {\n            free(avail);\n            return 0;\n        }\n        int lo = 0, hi = an;\n        while (lo < hi) {\n            int mid = (lo + hi) / 2;\n            if ((long long) avail[mid] + (long long) strength >= (long long) need) hi = mid; else lo = mid + 1;\n        }\n        if (lo == an) {\n            free(avail);\n            return 0;\n        }\n        for (int j = lo; j + 1 < an; j++) avail[j] = avail[j + 1];\n        an--;\n        left--;\n    }\n    free(avail);\n    return 1;\n}\n\nint maxTaskAssign(int* tasks, int tasksSize, int* workers, int workersSize, int pills, int strength) {\n    int* t = (int*) malloc((size_t) tasksSize * sizeof(int));\n    int* w = (int*) malloc((size_t) workersSize * sizeof(int));\n    for (int i = 0; i < tasksSize; i++) t[i] = tasks[i];\n    for (int i = 0; i < workersSize; i++) w[i] = workers[i];\n    qsort(t, (size_t) tasksSize, sizeof(int), cmpAssignAsc);\n    qsort(w, (size_t) workersSize, sizeof(int), cmpAssignAsc);\n    int lo = 0;\n    int hi = tasksSize < workersSize ? tasksSize : workersSize;\n    int ans = 0;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (mid == 0 || canAssign(t, w, workersSize, pills, strength, mid)) {\n            ans = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    free(t);\n    free(w);\n    return ans;\n}`,
        csharp: `private static bool CanAssign(int[] t, int[] w, int pills, int strength, int k)\n{\n    int left = pills;\n    var avail = new List<int>();\n    for (int i = w.Length - k; i < w.Length; i++) avail.Add(w[i]);\n    for (int i = k - 1; i >= 0; i--)\n    {\n        int need = t[i];\n        if (avail.Count > 0 && avail[avail.Count - 1] >= need)\n        {\n            avail.RemoveAt(avail.Count - 1);\n            continue;\n        }\n        if (left == 0) return false;\n        int lo = 0, hi = avail.Count;\n        while (lo < hi)\n        {\n            int mid = (lo + hi) / 2;\n            if ((long) avail[mid] + strength >= need) hi = mid; else lo = mid + 1;\n        }\n        if (lo == avail.Count) return false;\n        avail.RemoveAt(lo);\n        left--;\n    }\n    return true;\n}\n\npublic static int MaxTaskAssign(int[] tasks, int[] workers, int pills, int strength)\n{\n    int[] t = (int[]) tasks.Clone();\n    int[] w = (int[]) workers.Clone();\n    Array.Sort(t);\n    Array.Sort(w);\n    int lo = 0, hi = Math.Min(t.Length, w.Length), ans = 0;\n    while (lo <= hi)\n    {\n        int mid = lo + (hi - lo) / 2;\n        if (mid == 0 || CanAssign(t, w, pills, strength, mid))\n        {\n            ans = mid;\n            lo = mid + 1;\n        }\n        else\n        {\n            hi = mid - 1;\n        }\n    }\n    return ans;\n}`,
        go: `func canAssign(t []int, w []int, pills int, strength int, k int) bool {\n\tleft := pills\n\tavail := append([]int{}, w[len(w)-k:]...)\n\tfor i := k - 1; i >= 0; i-- {\n\t\tneed := t[i]\n\t\tif len(avail) > 0 && avail[len(avail)-1] >= need {\n\t\t\tavail = avail[:len(avail)-1]\n\t\t\tcontinue\n\t\t}\n\t\tif left == 0 {\n\t\t\treturn false\n\t\t}\n\t\tlo, hi := 0, len(avail)\n\t\tfor lo < hi {\n\t\t\tmid := (lo + hi) / 2\n\t\t\tif avail[mid]+strength >= need {\n\t\t\t\thi = mid\n\t\t\t} else {\n\t\t\t\tlo = mid + 1\n\t\t\t}\n\t\t}\n\t\tif lo == len(avail) {\n\t\t\treturn false\n\t\t}\n\t\tavail = append(avail[:lo], avail[lo+1:]...)\n\t\tleft--\n\t}\n\treturn true\n}\n\nfunc maxTaskAssign(tasks []int, workers []int, pills int, strength int) int {\n\tt := append([]int{}, tasks...)\n\tw := append([]int{}, workers...)\n\tsort.Ints(t)\n\tsort.Ints(w)\n\thiBound := len(t)\n\tif len(w) < hiBound {\n\t\thiBound = len(w)\n\t}\n\tlo, hi, ans := 0, hiBound, 0\n\tfor lo <= hi {\n\t\tmid := lo + (hi-lo)/2\n\t\tif mid == 0 || canAssign(t, w, pills, strength, mid) {\n\t\t\tans = mid\n\t\t\tlo = mid + 1\n\t\t} else {\n\t\t\thi = mid - 1\n\t\t}\n\t}\n\treturn ans\n}`,
        kotlin: `private fun canAssign(t: IntArray, w: IntArray, pills: Int, strength: Int, k: Int): Boolean {\n    var left = pills\n    val avail = ArrayList<Int>()\n    for (i in w.size - k until w.size) avail.add(w[i])\n    for (i in k - 1 downTo 0) {\n        val need = t[i]\n        if (avail.isNotEmpty() && avail[avail.size - 1] >= need) {\n            avail.removeAt(avail.size - 1)\n            continue\n        }\n        if (left == 0) return false\n        var lo = 0\n        var hi = avail.size\n        while (lo < hi) {\n            val mid = (lo + hi) / 2\n            if (avail[mid].toLong() + strength >= need) hi = mid else lo = mid + 1\n        }\n        if (lo == avail.size) return false\n        avail.removeAt(lo)\n        left--\n    }\n    return true\n}\n\nfun maxTaskAssign(tasks: IntArray, workers: IntArray, pills: Int, strength: Int): Int {\n    val t = tasks.sortedArray()\n    val w = workers.sortedArray()\n    var lo = 0\n    var hi = minOf(t.size, w.size)\n    var ans = 0\n    while (lo <= hi) {\n        val mid = lo + (hi - lo) / 2\n        if (mid == 0 || canAssign(t, w, pills, strength, mid)) {\n            ans = mid\n            lo = mid + 1\n        } else {\n            hi = mid - 1\n        }\n    }\n    return ans\n}`,
        swift: `func maxTaskAssign(_ tasks: [Int], _ workers: [Int], _ pills: Int, _ strength: Int) -> Int {\n    let t = tasks.sorted()\n    let w = workers.sorted()\n    func check(_ k: Int) -> Bool {\n        var left = pills\n        var avail = Array(w[(w.count - k)...])\n        var i = k - 1\n        while i >= 0 {\n            let need = t[i]\n            if !avail.isEmpty && avail[avail.count - 1] >= need {\n                avail.removeLast()\n                i -= 1\n                continue\n            }\n            if left == 0 { return false }\n            var lo = 0\n            var hi = avail.count\n            while lo < hi {\n                let mid = (lo + hi) / 2\n                if avail[mid] + strength >= need { hi = mid } else { lo = mid + 1 }\n            }\n            if lo == avail.count { return false }\n            avail.remove(at: lo)\n            left -= 1\n            i -= 1\n        }\n        return true\n    }\n    var lo = 0\n    var hi = min(t.count, w.count)\n    var ans = 0\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2\n        if mid == 0 || check(mid) {\n            ans = mid\n            lo = mid + 1\n        } else {\n            hi = mid - 1\n        }\n    }\n    return ans\n}`,
        rust: `fn maxTaskAssign(tasks: Vec<i32>, workers: Vec<i32>, pills: i32, strength: i32) -> i32 {\n    let mut t = tasks.clone();\n    let mut w = workers.clone();\n    t.sort();\n    w.sort();\n    let check = |k: usize| -> bool {\n        let mut left = pills;\n        let mut avail: Vec<i32> = w[(w.len() - k)..].to_vec();\n        let mut i = k as i32 - 1;\n        while i >= 0 {\n            let need = t[i as usize];\n            if !avail.is_empty() && avail[avail.len() - 1] >= need {\n                avail.pop();\n                i -= 1;\n                continue;\n            }\n            if left == 0 {\n                return false;\n            }\n            let mut lo = 0usize;\n            let mut hi = avail.len();\n            while lo < hi {\n                let mid = (lo + hi) / 2;\n                if avail[mid] as i64 + strength as i64 >= need as i64 {\n                    hi = mid;\n                } else {\n                    lo = mid + 1;\n                }\n            }\n            if lo == avail.len() {\n                return false;\n            }\n            avail.remove(lo);\n            left -= 1;\n            i -= 1;\n        }\n        true\n    };\n    let mut lo: i32 = 0;\n    let mut hi: i32 = t.len().min(w.len()) as i32;\n    let mut ans: i32 = 0;\n    while lo <= hi {\n        let mid = lo + (hi - lo) / 2;\n        if mid == 0 || check(mid as usize) {\n            ans = mid;\n            lo = mid + 1;\n        } else {\n            hi = mid - 1;\n        }\n    }\n    ans\n}`,
        php: `function maxTaskAssign($tasks, $workers, $pills, $strength) {\n    $t = $tasks;\n    $w = $workers;\n    sort($t);\n    sort($w);\n    $check = function($k) use ($t, $w, $pills, $strength) {\n        $left = $pills;\n        $avail = array_slice($w, count($w) - $k);\n        for ($i = $k - 1; $i >= 0; $i--) {\n            $need = $t[$i];\n            if (count($avail) > 0 && $avail[count($avail) - 1] >= $need) {\n                array_pop($avail);\n                continue;\n            }\n            if ($left === 0) return false;\n            $lo = 0;\n            $hi = count($avail);\n            while ($lo < $hi) {\n                $mid = intdiv($lo + $hi, 2);\n                if ($avail[$mid] + $strength >= $need) $hi = $mid; else $lo = $mid + 1;\n            }\n            if ($lo === count($avail)) return false;\n            array_splice($avail, $lo, 1);\n            $left--;\n        }\n        return true;\n    };\n    $lo = 0;\n    $hi = min(count($t), count($w));\n    $ans = 0;\n    while ($lo <= $hi) {\n        $mid = $lo + intdiv($hi - $lo, 2);\n        if ($mid === 0 || $check($mid)) {\n            $ans = $mid;\n            $lo = $mid + 1;\n        } else {\n            $hi = $mid - 1;\n        }\n    }\n    return $ans;\n}`,
        ruby: `def maxTaskAssign(tasks, workers, pills, strength)\n  t = tasks.sort\n  w = workers.sort\n  check = lambda do |k|\n    left = pills\n    avail = w[w.length - k, k]\n    (k - 1).downto(0) do |i|\n      need = t[i]\n      if !avail.empty? && avail[-1] >= need\n        avail.pop\n        next\n      end\n      return false if left == 0\n      lo = 0\n      hi = avail.length\n      while lo < hi\n        mid = (lo + hi) / 2\n        if avail[mid] + strength >= need\n          hi = mid\n        else\n          lo = mid + 1\n        end\n      end\n      return false if lo == avail.length\n      avail.delete_at(lo)\n      left -= 1\n    end\n    true\n  end\n  lo = 0\n  hi = [t.length, w.length].min\n  ans = 0\n  while lo <= hi\n    mid = lo + (hi - lo) / 2\n    if mid == 0 || check.call(mid)\n      ans = mid\n      lo = mid + 1\n    else\n      hi = mid - 1\n    end\n  end\n  ans\nend`,
      },
    };
  })(),
];
