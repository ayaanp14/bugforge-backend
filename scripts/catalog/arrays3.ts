/**
 * Array fundamentals — wave 3.
 *
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks
 * "must-do" array set that TCS NQT / Infosys / Wipro rounds draw from.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, explain, fmtIntArr, fmtIntMat, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const ARRAY3_PROBLEMS: CatalogProblem[] = [

  // ── Second Largest Element (GFG) ────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      let first = -1, second = -1;
      for (const x of arr) {
        if (x > first) { second = first; first = x; }
        else if (x < first && x > second) second = x;
      }
      return second;
    };
    return {
      slug: "second-largest-element",
      title: "Second Largest Element",
      difficulty: "EASY" as const,
      tags: ["Array", "TCS", "Infosys", "Wipro"],
      signature: { funcName: "getSecondLargest", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `arr` of positive integers, return the **second largest distinct value** in it.\n\nIf every element is the same — so no second distinct value exists — return `-1`.",
        [
          { in: "arr = [12,35,1,10,34,1]", out: "34", note: "The largest is 35 and the largest value strictly below it is 34." },
          { in: "arr = [10,10,10]", out: "-1", note: "Only one distinct value exists." },
          { in: "arr = [5,9]", out: "5" },
        ],
        ["2 <= arr.length <= 1000", "1 <= arr[i] <= 100000"]),
      hints: [
        "Sorting works, but a single pass is enough.",
        "Carry two running values — the best and the best-so-far below it.",
        "When a new maximum arrives, the old maximum becomes the runner-up. Ignore values equal to the current maximum entirely.",
      ],
      editorial: explain({
        idea: "One pass suffices: track the largest value seen and the largest value strictly below it. Every new element either beats the leader, slots in between, or is irrelevant.",
        steps: [
          "Initialise `first` and `second` to `-1` — safe because every element is at least `1`.",
          "For each `x`: if `x > first`, the old `first` becomes `second` and `x` becomes `first`.",
          "Otherwise, if `x < first` and `x > second`, then `x` is the new runner-up.",
          "An `x` equal to `first` is skipped, which is what makes the answer *distinct*.",
        ],
        why: "The invariant after each step is that `first` is the maximum of the prefix and `second` is the maximum of the prefix values strictly less than `first`. Both update rules preserve it, so after the last element `second` is exactly the answer.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Sorting and taking `arr[n-2]` is wrong when the maximum repeats — `[10,10,9]` would answer 10.",
          "Skipping the `x < first` guard lets a duplicate maximum overwrite the runner-up.",
        ],
      }),
      examples: [
        { input: "[12,35,1,10,34,1]", expectedOutput: "34" },
        { input: "[10,10,10]", expectedOutput: "-1" },
        { input: "[5,9]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 40);
        let arr: number[];
        if (rng() < 0.15) {
          const v = ri(rng, 1, 1000);
          arr = Array.from({ length: n }, () => v);
        } else {
          const hi = rng() < 0.5 ? 30 : 100000;
          arr = Array.from({ length: n }, () => ri(rng, 1, hi));
        }
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef getSecondLargest(arr: List[int]) -> int:\n    first = -1\n    second = -1\n    for x in arr:\n        if x > first:\n            second = first\n            first = x\n        elif x < first and x > second:\n            second = x\n    return second`,
        javascript: `var getSecondLargest = function(arr) {\n    let first = -1, second = -1;\n    for (let i = 0; i < arr.length; i++) {\n        const x = arr[i];\n        if (x > first) {\n            second = first;\n            first = x;\n        } else if (x < first && x > second) {\n            second = x;\n        }\n    }\n    return second;\n};`,
        typescript: `function getSecondLargest(arr: number[]): number {\n    var first = -1, second = -1;\n    for (var i = 0; i < arr.length; i++) {\n        var x = arr[i];\n        if (x > first) {\n            second = first;\n            first = x;\n        } else if (x < first && x > second) {\n            second = x;\n        }\n    }\n    return second;\n}`,
        java: `public static int getSecondLargest(int[] arr) {\n    int first = -1, second = -1;\n    for (int x : arr) {\n        if (x > first) {\n            second = first;\n            first = x;\n        } else if (x < first && x > second) {\n            second = x;\n        }\n    }\n    return second;\n}`,
        cpp: `int getSecondLargest(vector<int>& arr) {\n    int first = -1, second = -1;\n    for (int x : arr) {\n        if (x > first) {\n            second = first;\n            first = x;\n        } else if (x < first && x > second) {\n            second = x;\n        }\n    }\n    return second;\n}`,
        c: `int getSecondLargest(int* arr, int arrSize) {\n    int first = -1, second = -1;\n    for (int i = 0; i < arrSize; i++) {\n        int x = arr[i];\n        if (x > first) {\n            second = first;\n            first = x;\n        } else if (x < first && x > second) {\n            second = x;\n        }\n    }\n    return second;\n}`,
        csharp: `public static int GetSecondLargest(int[] arr)\n{\n    int first = -1, second = -1;\n    foreach (int x in arr)\n    {\n        if (x > first)\n        {\n            second = first;\n            first = x;\n        }\n        else if (x < first && x > second)\n        {\n            second = x;\n        }\n    }\n    return second;\n}`,
        go: `func getSecondLargest(arr []int) int {\n\tfirst, second := -1, -1\n\tfor _, x := range arr {\n\t\tif x > first {\n\t\t\tsecond = first\n\t\t\tfirst = x\n\t\t} else if x < first && x > second {\n\t\t\tsecond = x\n\t\t}\n\t}\n\treturn second\n}`,
        kotlin: `fun getSecondLargest(arr: IntArray): Int {\n    var first = -1\n    var second = -1\n    for (x in arr) {\n        if (x > first) {\n            second = first\n            first = x\n        } else if (x < first && x > second) {\n            second = x\n        }\n    }\n    return second\n}`,
        swift: `func getSecondLargest(_ arr: [Int]) -> Int {\n    var first = -1\n    var second = -1\n    for x in arr {\n        if x > first {\n            second = first\n            first = x\n        } else if x < first && x > second {\n            second = x\n        }\n    }\n    return second\n}`,
        rust: `fn getSecondLargest(arr: Vec<i32>) -> i32 {\n    let mut first = -1;\n    let mut second = -1;\n    for &x in arr.iter() {\n        if x > first {\n            second = first;\n            first = x;\n        } else if x < first && x > second {\n            second = x;\n        }\n    }\n    second\n}`,
        php: `function getSecondLargest($arr) {\n    $first = -1;\n    $second = -1;\n    foreach ($arr as $x) {\n        if ($x > $first) {\n            $second = $first;\n            $first = $x;\n        } else if ($x < $first && $x > $second) {\n            $second = $x;\n        }\n    }\n    return $second;\n}`,
        ruby: `def getSecondLargest(arr)\n  first = -1\n  second = -1\n  arr.each do |x|\n    if x > first\n      second = first\n      first = x\n    elsif x < first && x > second\n      second = x\n    end\n  end\n  second\nend`,
      },
    };
  })(),

  // ── Leaders in an Array (GFG) ───────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const out: number[] = [];
      let best = -Infinity;
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i] >= best) { out.push(arr[i]); best = arr[i]; }
      }
      out.reverse();
      return out;
    };
    return {
      slug: "leaders-in-an-array",
      title: "Leaders in an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "TCS", "Accenture", "Amazon"],
      signature: { funcName: "leaders", params: [{ name: "arr", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "An element of `arr` is a **leader** if it is greater than or equal to every element to its right. The rightmost element is always a leader.\n\nReturn all leaders in the **order they appear** in the array (left to right).",
        [
          { in: "arr = [16,17,4,3,5,2]", out: "[17,5,2]", note: "17 beats everything to its right, 5 beats {2}, and 2 is last." },
          { in: "arr = [1,2,3,4,0]", out: "[4,0]" },
          { in: "arr = [7,7,7]", out: "[7,7,7]", note: "Ties count — the comparison is >=." },
        ],
        ["1 <= arr.length <= 1000", "0 <= arr[i] <= 100000"]),
      hints: [
        "Comparing every element with all elements to its right is O(n²). What information does a right-to-left scan give you for free?",
        "Walking backwards, the maximum of everything seen so far *is* the maximum of the suffix.",
        "Collect leaders while scanning backwards, then reverse to restore the original order.",
      ],
      editorial: explain({
        idea: "A leader is an element that ties or beats the maximum of its suffix. Scanning right to left makes that suffix maximum a single running variable.",
        steps: [
          "Walk `i` from `n - 1` down to `0`, carrying `best` — the maximum of `arr[i+1..n-1]`.",
          "If `arr[i] >= best`, record `arr[i]` as a leader and update `best = arr[i]`.",
          "Reverse the collected list so it reads left to right.",
        ],
        why: "By induction, when index `i` is examined `best` already equals the suffix maximum, which is precisely the quantity the definition compares against. The last element trivially qualifies because its suffix is empty.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Using `>` instead of `>=` drops duplicate leaders such as `[7,7,7]`.",
          "Forgetting the final reverse yields the leaders in right-to-left order.",
        ],
      }),
      examples: [
        { input: "[16,17,4,3,5,2]", expectedOutput: "[17,5,2]" },
        { input: "[1,2,3,4,0]", expectedOutput: "[4,0]" },
        { input: "[7,7,7]", expectedOutput: "[7,7,7]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const hi = rng() < 0.5 ? 12 : 100000;
        const arr = Array.from({ length: n }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(arr), expectedOutput: fmtIntArr(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef leaders(arr: List[int]) -> List[int]:\n    out = []\n    best = -1\n    for i in range(len(arr) - 1, -1, -1):\n        if arr[i] >= best:\n            out.append(arr[i])\n            best = arr[i]\n    out.reverse()\n    return out`,
        javascript: `var leaders = function(arr) {\n    const out = [];\n    let best = -1;\n    for (let i = arr.length - 1; i >= 0; i--) {\n        if (arr[i] >= best) {\n            out.push(arr[i]);\n            best = arr[i];\n        }\n    }\n    out.reverse();\n    return out;\n};`,
        typescript: `function leaders(arr: number[]): number[] {\n    var out: number[] = [];\n    var best = -1;\n    for (var i = arr.length - 1; i >= 0; i--) {\n        if (arr[i] >= best) {\n            out.push(arr[i]);\n            best = arr[i];\n        }\n    }\n    out.reverse();\n    return out;\n}`,
        java: `public static int[] leaders(int[] arr) {\n    int n = arr.length;\n    int[] tmp = new int[n];\n    int m = 0;\n    int best = -1;\n    for (int i = n - 1; i >= 0; i--) {\n        if (arr[i] >= best) {\n            tmp[m++] = arr[i];\n            best = arr[i];\n        }\n    }\n    int[] out = new int[m];\n    for (int i = 0; i < m; i++) out[i] = tmp[m - 1 - i];\n    return out;\n}`,
        cpp: `vector<int> leaders(vector<int>& arr) {\n    vector<int> out;\n    int best = -1;\n    for (int i = (int) arr.size() - 1; i >= 0; i--) {\n        if (arr[i] >= best) {\n            out.push_back(arr[i]);\n            best = arr[i];\n        }\n    }\n    reverse(out.begin(), out.end());\n    return out;\n}`,
        c: `int* leaders(int* arr, int arrSize, int* returnSize) {\n    int* tmp = (int*) malloc((arrSize > 0 ? arrSize : 1) * sizeof(int));\n    int m = 0;\n    int best = -1;\n    for (int i = arrSize - 1; i >= 0; i--) {\n        if (arr[i] >= best) {\n            tmp[m++] = arr[i];\n            best = arr[i];\n        }\n    }\n    int* out = (int*) malloc((m > 0 ? m : 1) * sizeof(int));\n    for (int i = 0; i < m; i++) out[i] = tmp[m - 1 - i];\n    free(tmp);\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[] Leaders(int[] arr)\n{\n    var out_ = new List<int>();\n    int best = -1;\n    for (int i = arr.Length - 1; i >= 0; i--)\n    {\n        if (arr[i] >= best)\n        {\n            out_.Add(arr[i]);\n            best = arr[i];\n        }\n    }\n    out_.Reverse();\n    return out_.ToArray();\n}`,
        go: `func leaders(arr []int) []int {\n\tout := []int{}\n\tbest := -1\n\tfor i := len(arr) - 1; i >= 0; i-- {\n\t\tif arr[i] >= best {\n\t\t\tout = append(out, arr[i])\n\t\t\tbest = arr[i]\n\t\t}\n\t}\n\tfor i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {\n\t\tout[i], out[j] = out[j], out[i]\n\t}\n\treturn out\n}`,
        kotlin: `fun leaders(arr: IntArray): IntArray {\n    val out = ArrayList<Int>()\n    var best = -1\n    for (i in arr.indices.reversed()) {\n        if (arr[i] >= best) {\n            out.add(arr[i])\n            best = arr[i]\n        }\n    }\n    out.reverse()\n    return out.toIntArray()\n}`,
        swift: `func leaders(_ arr: [Int]) -> [Int] {\n    var out: [Int] = []\n    var best = -1\n    var i = arr.count - 1\n    while i >= 0 {\n        if arr[i] >= best {\n            out.append(arr[i])\n            best = arr[i]\n        }\n        i -= 1\n    }\n    out.reverse()\n    return out\n}`,
        rust: `fn leaders(arr: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    let mut best = -1;\n    for i in (0..arr.len()).rev() {\n        if arr[i] >= best {\n            out.push(arr[i]);\n            best = arr[i];\n        }\n    }\n    out.reverse();\n    out\n}`,
        php: `function leaders($arr) {\n    $out = array();\n    $best = -1;\n    for ($i = count($arr) - 1; $i >= 0; $i--) {\n        if ($arr[$i] >= $best) {\n            $out[] = $arr[$i];\n            $best = $arr[$i];\n        }\n    }\n    return array_reverse($out);\n}`,
        ruby: `def leaders(arr)\n  out = []\n  best = -1\n  (arr.length - 1).downto(0) do |i|\n    if arr[i] >= best\n      out << arr[i]\n      best = arr[i]\n    end\n  end\n  out.reverse\nend`,
      },
    };
  })(),

  // ── Equilibrium Point (GFG) ─────────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      let total = 0;
      for (const x of arr) total += x;
      let left = 0;
      for (let i = 0; i < arr.length; i++) {
        if (left === total - left - arr[i]) return i;
        left += arr[i];
      }
      return -1;
    };
    return {
      slug: "equilibrium-point",
      title: "Equilibrium Point",
      difficulty: "EASY" as const,
      tags: ["Array", "Prefix Sum", "TCS", "Capgemini"],
      signature: { funcName: "equilibriumPoint", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An index `i` is an **equilibrium point** if the sum of `arr[0..i-1]` equals the sum of `arr[i+1..n-1]`. The element at `i` itself belongs to neither side.\n\nReturn the **smallest** such index, or `-1` if there is none. Indices are 0-based; an empty side sums to `0`.",
        [
          { in: "arr = [1,3,5,2,2]", out: "2", note: "1 + 3 = 4 on the left and 2 + 2 = 4 on the right." },
          { in: "arr = [1]", out: "0", note: "Both sides are empty, so both sum to 0." },
          { in: "arr = [1,2,3]", out: "-1" },
        ],
        ["1 <= arr.length <= 100000", "-10000 <= arr[i] <= 10000"]),
      hints: [
        "Recomputing both sides at every index is O(n²). Compute the total once instead.",
        "If `left` is the sum before index `i`, the right side is `total - left - arr[i]`.",
        "Sweep left to right, testing the condition **before** adding `arr[i]` to `left`.",
      ],
      editorial: explain({
        idea: "Only two numbers matter at each index: the running prefix sum and the array total. The suffix sum follows from them by subtraction, so no second pass is needed.",
        steps: [
          "Add up the whole array into `total`.",
          "Sweep `i` from `0`, keeping `left` = sum of `arr[0..i-1]` (starting at `0`).",
          "At each `i`, the right side is `total - left - arr[i]`; if it equals `left`, return `i`.",
          "Otherwise add `arr[i]` to `left` and continue. Return `-1` if the sweep finishes.",
        ],
        why: "Returning on the first match gives the smallest index by construction, and the identity `prefix + arr[i] + suffix = total` makes the derived right-hand sum exact for every `i`, including the endpoints where one side is empty.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Adding `arr[i]` to `left` before the comparison shifts every test by one position.",
          "A single-element array must answer `0`, not `-1` — both empty sides are equal.",
          "Negative values mean you cannot stop early when `left` exceeds half the total.",
        ],
      }),
      examples: [
        { input: "[1,3,5,2,2]", expectedOutput: "2" },
        { input: "[1]", expectedOutput: "0" },
        { input: "[1,2,3]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        let arr: number[];
        if (rng() < 0.4) {
          // Plant an equilibrium point so the answer is not almost always -1.
          const k = ri(rng, 0, n - 1);
          const left = Array.from({ length: k }, () => ri(rng, -20, 20));
          const right = Array.from({ length: n - 1 - k }, () => ri(rng, -20, 20));
          const ls = left.reduce((a, b) => a + b, 0);
          const rs = right.reduce((a, b) => a + b, 0);
          if (right.length > 0) right[right.length - 1] += ls - rs;
          else if (left.length > 0) left[left.length - 1] += rs - ls;
          arr = [...left, ri(rng, -20, 20), ...right];
        } else {
          arr = Array.from({ length: n }, () => ri(rng, -30, 30));
        }
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef equilibriumPoint(arr: List[int]) -> int:\n    total = sum(arr)\n    left = 0\n    for i, x in enumerate(arr):\n        if left == total - left - x:\n            return i\n        left += x\n    return -1`,
        javascript: `var equilibriumPoint = function(arr) {\n    let total = 0;\n    for (let i = 0; i < arr.length; i++) total += arr[i];\n    let left = 0;\n    for (let i = 0; i < arr.length; i++) {\n        if (left === total - left - arr[i]) return i;\n        left += arr[i];\n    }\n    return -1;\n};`,
        typescript: `function equilibriumPoint(arr: number[]): number {\n    var total = 0;\n    for (var i = 0; i < arr.length; i++) total += arr[i];\n    var left = 0;\n    for (var j = 0; j < arr.length; j++) {\n        if (left === total - left - arr[j]) return j;\n        left += arr[j];\n    }\n    return -1;\n}`,
        java: `public static int equilibriumPoint(int[] arr) {\n    long total = 0;\n    for (int x : arr) total += x;\n    long left = 0;\n    for (int i = 0; i < arr.length; i++) {\n        if (left == total - left - arr[i]) return i;\n        left += arr[i];\n    }\n    return -1;\n}`,
        cpp: `int equilibriumPoint(vector<int>& arr) {\n    long long total = 0;\n    for (int x : arr) total += x;\n    long long left = 0;\n    for (int i = 0; i < (int) arr.size(); i++) {\n        if (left == total - left - arr[i]) return i;\n        left += arr[i];\n    }\n    return -1;\n}`,
        c: `int equilibriumPoint(int* arr, int arrSize) {\n    long long total = 0;\n    for (int i = 0; i < arrSize; i++) total += arr[i];\n    long long left = 0;\n    for (int i = 0; i < arrSize; i++) {\n        if (left == total - left - arr[i]) return i;\n        left += arr[i];\n    }\n    return -1;\n}`,
        csharp: `public static int EquilibriumPoint(int[] arr)\n{\n    long total = 0;\n    foreach (int x in arr) total += x;\n    long left = 0;\n    for (int i = 0; i < arr.Length; i++)\n    {\n        if (left == total - left - arr[i]) return i;\n        left += arr[i];\n    }\n    return -1;\n}`,
        go: `func equilibriumPoint(arr []int) int {\n\ttotal := 0\n\tfor _, x := range arr {\n\t\ttotal += x\n\t}\n\tleft := 0\n\tfor i, x := range arr {\n\t\tif left == total-left-x {\n\t\t\treturn i\n\t\t}\n\t\tleft += x\n\t}\n\treturn -1\n}`,
        kotlin: `fun equilibriumPoint(arr: IntArray): Int {\n    var total = 0L\n    for (x in arr) total += x\n    var left = 0L\n    for (i in arr.indices) {\n        if (left == total - left - arr[i]) return i\n        left += arr[i]\n    }\n    return -1\n}`,
        swift: `func equilibriumPoint(_ arr: [Int]) -> Int {\n    var total = 0\n    for x in arr { total += x }\n    var left = 0\n    for i in 0..<arr.count {\n        if left == total - left - arr[i] { return i }\n        left += arr[i]\n    }\n    return -1\n}`,
        rust: `fn equilibriumPoint(arr: Vec<i32>) -> i32 {\n    let mut total: i64 = 0;\n    for &x in arr.iter() {\n        total += x as i64;\n    }\n    let mut left: i64 = 0;\n    for i in 0..arr.len() {\n        if left == total - left - arr[i] as i64 {\n            return i as i32;\n        }\n        left += arr[i] as i64;\n    }\n    -1\n}`,
        php: `function equilibriumPoint($arr) {\n    $total = 0;\n    foreach ($arr as $x) $total += $x;\n    $left = 0;\n    for ($i = 0; $i < count($arr); $i++) {\n        if ($left === $total - $left - $arr[$i]) return $i;\n        $left += $arr[$i];\n    }\n    return -1;\n}`,
        ruby: `def equilibriumPoint(arr)\n  total = arr.sum\n  left = 0\n  arr.each_with_index do |x, i|\n    return i if left == total - left - x\n    left += x\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Minimum Moves to Equal Array Elements (LC 453) ──────────────
  (() => {
    const ref = (nums: number[]) => {
      let min = nums[0], sum = 0;
      for (const x of nums) { if (x < min) min = x; sum += x; }
      return sum - min * nums.length;
    };
    return {
      slug: "minimum-moves-to-equal-array-elements",
      title: "Minimum Moves to Equal Array Elements",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Amazon", "Indeed"],
      signature: { funcName: "minMoves", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` of size `n`, return the **minimum number of moves** required to make all elements equal.\n\nIn one move you may increment `n - 1` elements of the array by `1`.",
        [
          { in: "nums = [1,2,3]", out: "3", note: "[1,2,3] → [2,3,3] → [3,4,3] → [4,4,4]." },
          { in: "nums = [1,1,1]", out: "0" },
          { in: "nums = [1,2,3,4]", out: "6" },
        ],
        ["1 <= nums.length <= 100000", "-1000 <= nums[i] <= 1000", "The answer fits in a 32-bit integer."],
        "Incrementing n-1 elements is the same as doing what to the remaining one?"),
      hints: [
        "Raising `n - 1` elements by 1 leaves every *difference* between a raised element and the untouched one changed by exactly 1.",
        "So the move is equivalent to **decrementing a single element by 1** — the gaps behave identically.",
        "If every element must fall to the minimum, the total number of decrements is `sum - n * min`.",
      ],
      editorial: explain({
        idea: "Adding 1 to all but one element shifts the whole array up by 1 and pulls one element down by 1 relative to the rest. Since only relative values matter, the move is exactly \"decrement one element by 1\".",
        steps: [
          "Reframe the move as a single decrement.",
          "Every element must end at the same value; the cheapest common target is the minimum, because no move can ever raise an element relative to the others.",
          "Answer `sum(nums) - n * min(nums)` — the total number of unit decrements needed.",
        ],
        why: "Each decrement reduces `sum - n * min` by exactly 1 while `min` cannot decrease below the final target, so that quantity is both a lower bound on the number of moves and achievable by decrementing each element down to the minimum.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Trying to simulate the moves is O(range × n) and times out.",
          "The intermediate sum can overflow 32 bits during accumulation even though the answer fits — accumulate in 64 bits.",
        ],
      }),
      examples: [
        { input: "[1,2,3]", expectedOutput: "3" },
        { input: "[1,1,1]", expectedOutput: "0" },
        { input: "[1,2,3,4]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nums = Array.from({ length: n }, () => ri(rng, -1000, 1000));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minMoves(nums: List[int]) -> int:\n    return sum(nums) - min(nums) * len(nums)`,
        javascript: `var minMoves = function(nums) {\n    let min = nums[0], sum = 0;\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] < min) min = nums[i];\n        sum += nums[i];\n    }\n    return sum - min * nums.length;\n};`,
        typescript: `function minMoves(nums: number[]): number {\n    var min = nums[0], sum = 0;\n    for (var i = 0; i < nums.length; i++) {\n        if (nums[i] < min) min = nums[i];\n        sum += nums[i];\n    }\n    return sum - min * nums.length;\n}`,
        java: `public static int minMoves(int[] nums) {\n    long sum = 0;\n    int min = nums[0];\n    for (int x : nums) {\n        if (x < min) min = x;\n        sum += x;\n    }\n    return (int) (sum - (long) min * nums.length);\n}`,
        cpp: `int minMoves(vector<int>& nums) {\n    long long sum = 0;\n    int mn = nums[0];\n    for (int x : nums) {\n        if (x < mn) mn = x;\n        sum += x;\n    }\n    return (int) (sum - (long long) mn * (long long) nums.size());\n}`,
        c: `int minMoves(int* nums, int numsSize) {\n    long long sum = 0;\n    int mn = nums[0];\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] < mn) mn = nums[i];\n        sum += nums[i];\n    }\n    return (int) (sum - (long long) mn * (long long) numsSize);\n}`,
        csharp: `public static int MinMoves(int[] nums)\n{\n    long sum = 0;\n    int min = nums[0];\n    foreach (int x in nums)\n    {\n        if (x < min) min = x;\n        sum += x;\n    }\n    return (int) (sum - (long) min * nums.Length);\n}`,
        go: `func minMoves(nums []int) int {\n\tmn, sum := nums[0], 0\n\tfor _, x := range nums {\n\t\tif x < mn {\n\t\t\tmn = x\n\t\t}\n\t\tsum += x\n\t}\n\treturn sum - mn*len(nums)\n}`,
        kotlin: `fun minMoves(nums: IntArray): Int {\n    var sum = 0L\n    var min = nums[0]\n    for (x in nums) {\n        if (x < min) min = x\n        sum += x\n    }\n    return (sum - min.toLong() * nums.size).toInt()\n}`,
        swift: `func minMoves(_ nums: [Int]) -> Int {\n    var sum = 0\n    var mn = nums[0]\n    for x in nums {\n        if x < mn { mn = x }\n        sum += x\n    }\n    return sum - mn * nums.count\n}`,
        rust: `fn minMoves(nums: Vec<i32>) -> i32 {\n    let mut sum: i64 = 0;\n    let mut mn = nums[0];\n    for &x in nums.iter() {\n        if x < mn {\n            mn = x;\n        }\n        sum += x as i64;\n    }\n    (sum - mn as i64 * nums.len() as i64) as i32\n}`,
        php: `function minMoves($nums) {\n    $min = $nums[0];\n    $sum = 0;\n    foreach ($nums as $x) {\n        if ($x < $min) $min = $x;\n        $sum += $x;\n    }\n    return $sum - $min * count($nums);\n}`,
        ruby: `def minMoves(nums)\n  nums.sum - nums.min * nums.length\nend`,
      },
    };
  })(),

  // ── Minimum Moves to Equal Array Elements II (LC 462) ───────────
  (() => {
    const ref = (nums: number[]) => {
      const s = [...nums].sort((a, b) => a - b);
      const med = s[Math.floor(s.length / 2)];
      let total = 0;
      for (const x of s) total += Math.abs(x - med);
      return total;
    };
    return {
      slug: "minimum-moves-to-equal-array-elements-ii",
      title: "Minimum Moves to Equal Array Elements II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Sorting", "Amazon", "Google"],
      signature: { funcName: "minMoves2", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` of size `n`, return the **minimum number of moves** required to make all elements equal.\n\nIn one move you may increment **or** decrement a single element by `1`.",
        [
          { in: "nums = [1,2,3]", out: "2", note: "Move both 1 and 3 to 2: one move each." },
          { in: "nums = [1,10,2,9]", out: "16" },
          { in: "nums = [1,0,0,8,6]", out: "14" },
        ],
        ["1 <= nums.length <= 100000", "-1000000000 <= nums[i] <= 1000000000", "The answer fits in a 32-bit integer."]),
      hints: [
        "The cost of choosing target `t` is `sum |nums[i] - t|`. Which `t` minimises that?",
        "Pair the smallest with the largest: any `t` between them costs the same, and any `t` outside costs more.",
        "Peeling pairs inward leaves the **median** as the optimal target.",
      ],
      editorial: explain({
        idea: "The cost function `f(t) = Σ|nums[i] - t|` is minimised at the median, not the mean. Sorting exposes it directly.",
        steps: [
          "Sort a copy of `nums`.",
          "Take `med = sorted[n / 2]` (integer division — either middle works when `n` is even).",
          "Return `Σ |nums[i] - med|`.",
        ],
        why: "Match the smallest element with the largest. Any target between them costs exactly their difference; any target outside costs more. Removing that pair leaves the same subproblem, so the optimum is squeezed to the middle element(s) — the median.",
        time: "O(n log n)",
        space: "O(n) for the sorted copy",
        pitfalls: [
          "Using the **mean** is wrong: `[1,0,0,8,6]` has mean 3 (cost 15) but median 1 (cost 14).",
          "With values up to 1e9 the running total overflows 32 bits — accumulate in 64 bits.",
          "Sorting the caller's array in place is fine here, but the two-pointer form `Σ (sorted[n-1-i] - sorted[i])` avoids picking a median at all.",
        ],
      }),
      examples: [
        { input: "[1,2,3]", expectedOutput: "2" },
        { input: "[1,10,2,9]", expectedOutput: "16" },
        { input: "[1,0,0,8,6]", expectedOutput: "14" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const hi = rng() < 0.5 ? 50 : 20000;
        const nums = Array.from({ length: n }, () => ri(rng, -hi, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minMoves2(nums: List[int]) -> int:\n    s = sorted(nums)\n    med = s[len(s) // 2]\n    return sum(abs(x - med) for x in s)`,
        javascript: `var minMoves2 = function(nums) {\n    const s = nums.slice().sort(function(a, b) { return a - b; });\n    const med = s[Math.floor(s.length / 2)];\n    let total = 0;\n    for (let i = 0; i < s.length; i++) total += Math.abs(s[i] - med);\n    return total;\n};`,
        typescript: `function minMoves2(nums: number[]): number {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var med = s[Math.floor(s.length / 2)];\n    var total = 0;\n    for (var i = 0; i < s.length; i++) total += Math.abs(s[i] - med);\n    return total;\n}`,
        java: `public static int minMoves2(int[] nums) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    int med = s[s.length / 2];\n    long total = 0;\n    for (int x : s) total += Math.abs((long) x - med);\n    return (int) total;\n}`,
        cpp: `int minMoves2(vector<int>& nums) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    long long med = s[s.size() / 2];\n    long long total = 0;\n    for (int x : s) total += llabs((long long) x - med);\n    return (int) total;\n}`,
        c: `static int cmpAscMoves2(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint minMoves2(int* nums, int numsSize) {\n    int* s = (int*) malloc(numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, numsSize, sizeof(int), cmpAscMoves2);\n    long long med = s[numsSize / 2];\n    long long total = 0;\n    for (int i = 0; i < numsSize; i++) {\n        long long d = (long long) s[i] - med;\n        total += d < 0 ? -d : d;\n    }\n    free(s);\n    return (int) total;\n}`,
        csharp: `public static int MinMoves2(int[] nums)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    long med = s[s.Length / 2];\n    long total = 0;\n    foreach (int x in s) total += Math.Abs((long) x - med);\n    return (int) total;\n}`,
        go: `func minMoves2(nums []int) int {\n\ts := append([]int{}, nums...)\n\tsort.Ints(s)\n\tmed := s[len(s)/2]\n\ttotal := 0\n\tfor _, x := range s {\n\t\td := x - med\n\t\tif d < 0 {\n\t\t\td = -d\n\t\t}\n\t\ttotal += d\n\t}\n\treturn total\n}`,
        kotlin: `fun minMoves2(nums: IntArray): Int {\n    val s = nums.clone()\n    s.sort()\n    val med = s[s.size / 2].toLong()\n    var total = 0L\n    for (x in s) total += Math.abs(x.toLong() - med)\n    return total.toInt()\n}`,
        swift: `func minMoves2(_ nums: [Int]) -> Int {\n    let s = nums.sorted()\n    let med = s[s.count / 2]\n    var total = 0\n    for x in s { total += abs(x - med) }\n    return total\n}`,
        rust: `fn minMoves2(nums: Vec<i32>) -> i32 {\n    let mut s = nums.clone();\n    s.sort();\n    let med = s[s.len() / 2] as i64;\n    let mut total: i64 = 0;\n    for &x in s.iter() {\n        total += (x as i64 - med).abs();\n    }\n    total as i32\n}`,
        php: `function minMoves2($nums) {\n    $s = $nums;\n    sort($s);\n    $med = $s[intdiv(count($s), 2)];\n    $total = 0;\n    foreach ($s as $x) $total += abs($x - $med);\n    return $total;\n}`,
        ruby: `def minMoves2(nums)\n  s = nums.sort\n  med = s[s.length / 2]\n  s.map { |x| (x - med).abs }.sum\nend`,
      },
    };
  })(),

  // ── Non-decreasing Array (LC 665) ───────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let bad = 0;
      const a = [...nums];
      for (let i = 1; i < a.length; i++) {
        if (a[i - 1] > a[i]) {
          bad++;
          if (bad > 1) return false;
          if (i < 2 || a[i - 2] <= a[i]) a[i - 1] = a[i];
          else a[i] = a[i - 1];
        }
      }
      return true;
    };
    return {
      slug: "non-decreasing-array",
      title: "Non-decreasing Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Amazon", "Google", "Facebook"],
      signature: { funcName: "checkPossibility", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Given an array `nums`, return `true` if it can be made **non-decreasing** by modifying **at most one** element.\n\nAn array is non-decreasing if `nums[i] <= nums[i + 1]` holds for every `i`.",
        [
          { in: "nums = [4,2,3]", out: "true", note: "Change the 4 to a 1 (or to 2) and the array becomes non-decreasing." },
          { in: "nums = [4,2,1]", out: "false", note: "Two separate violations — one change cannot fix both." },
          { in: "nums = [3,4,2,3]", out: "false" },
        ],
        ["1 <= nums.length <= 100000", "-100000 <= nums[i] <= 100000"]),
      hints: [
        "Count the positions where `nums[i-1] > nums[i]`. Two or more of them is an immediate `false`.",
        "One violation is not automatically fixable — `[3,4,2,3]` has exactly one and still fails.",
        "At a violation you must decide *which* of the two elements to change. Look one step further back: `nums[i-2]` decides it.",
      ],
      editorial: explain({
        idea: "Scan for descents. At most one may occur, and when it does you must repair it in the way that leaves the array most repairable — which depends on the element two positions back.",
        steps: [
          "Walk `i` from `1`, looking for `nums[i-1] > nums[i]`.",
          "On the second such descent, return `false`.",
          "On the first: if `i < 2` or `nums[i-2] <= nums[i]`, lower `nums[i-1]` to `nums[i]` — the cheaper repair, since it keeps the tail small.",
          "Otherwise `nums[i-2] > nums[i]`, so lowering `nums[i-1]` would break the earlier pair; raise `nums[i]` to `nums[i-1]` instead.",
          "Return `true` if the scan finishes.",
        ],
        why: "Lowering the left element is always at least as good as raising the right one — it never makes a later comparison harder. It is only unavailable when it would create a new descent with `nums[i-2]`, and in that case raising `nums[i]` is the sole remaining option.",
        time: "O(n)",
        space: "O(1) if you modify in place, O(n) on a copy",
        pitfalls: [
          "Counting descents alone is not enough: `[3,4,2,3]` has one descent and is still impossible.",
          "Always raising `nums[i]` fails on `[4,2,3]`; always lowering `nums[i-1]` fails on `[3,4,2,3]`.",
          "The array must actually be mutated as you go — otherwise later comparisons use stale values.",
        ],
      }),
      examples: [
        { input: "[4,2,3]", expectedOutput: "true" },
        { input: "[4,2,1]", expectedOutput: "false" },
        { input: "[3,4,2,3]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        let nums: number[];
        const roll = rng();
        if (roll < 0.4) {
          nums = Array.from({ length: n }, () => ri(rng, -20, 20)).sort((a, b) => a - b);
          if (n > 1 && rng() < 0.8) nums[ri(rng, 0, n - 1)] = ri(rng, -30, 30);
        } else {
          nums = Array.from({ length: n }, () => ri(rng, -20, 20));
        }
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef checkPossibility(nums: List[int]) -> bool:\n    a = list(nums)\n    bad = 0\n    for i in range(1, len(a)):\n        if a[i - 1] > a[i]:\n            bad += 1\n            if bad > 1:\n                return False\n            if i < 2 or a[i - 2] <= a[i]:\n                a[i - 1] = a[i]\n            else:\n                a[i] = a[i - 1]\n    return True`,
        javascript: `var checkPossibility = function(nums) {\n    const a = nums.slice();\n    let bad = 0;\n    for (let i = 1; i < a.length; i++) {\n        if (a[i - 1] > a[i]) {\n            bad++;\n            if (bad > 1) return false;\n            if (i < 2 || a[i - 2] <= a[i]) a[i - 1] = a[i];\n            else a[i] = a[i - 1];\n        }\n    }\n    return true;\n};`,
        typescript: `function checkPossibility(nums: number[]): boolean {\n    var a = nums.slice();\n    var bad = 0;\n    for (var i = 1; i < a.length; i++) {\n        if (a[i - 1] > a[i]) {\n            bad++;\n            if (bad > 1) return false;\n            if (i < 2 || a[i - 2] <= a[i]) a[i - 1] = a[i];\n            else a[i] = a[i - 1];\n        }\n    }\n    return true;\n}`,
        java: `public static boolean checkPossibility(int[] nums) {\n    int[] a = nums.clone();\n    int bad = 0;\n    for (int i = 1; i < a.length; i++) {\n        if (a[i - 1] > a[i]) {\n            bad++;\n            if (bad > 1) return false;\n            if (i < 2 || a[i - 2] <= a[i]) a[i - 1] = a[i];\n            else a[i] = a[i - 1];\n        }\n    }\n    return true;\n}`,
        cpp: `bool checkPossibility(vector<int>& nums) {\n    vector<int> a = nums;\n    int bad = 0;\n    for (int i = 1; i < (int) a.size(); i++) {\n        if (a[i - 1] > a[i]) {\n            bad++;\n            if (bad > 1) return false;\n            if (i < 2 || a[i - 2] <= a[i]) a[i - 1] = a[i];\n            else a[i] = a[i - 1];\n        }\n    }\n    return true;\n}`,
        c: `bool checkPossibility(int* nums, int numsSize) {\n    int* a = (int*) malloc((numsSize > 0 ? numsSize : 1) * sizeof(int));\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    int bad = 0;\n    for (int i = 1; i < numsSize; i++) {\n        if (a[i - 1] > a[i]) {\n            bad++;\n            if (bad > 1) { free(a); return false; }\n            if (i < 2 || a[i - 2] <= a[i]) a[i - 1] = a[i];\n            else a[i] = a[i - 1];\n        }\n    }\n    free(a);\n    return true;\n}`,
        csharp: `public static bool CheckPossibility(int[] nums)\n{\n    int[] a = (int[]) nums.Clone();\n    int bad = 0;\n    for (int i = 1; i < a.Length; i++)\n    {\n        if (a[i - 1] > a[i])\n        {\n            bad++;\n            if (bad > 1) return false;\n            if (i < 2 || a[i - 2] <= a[i]) a[i - 1] = a[i];\n            else a[i] = a[i - 1];\n        }\n    }\n    return true;\n}`,
        go: `func checkPossibility(nums []int) bool {\n\ta := append([]int{}, nums...)\n\tbad := 0\n\tfor i := 1; i < len(a); i++ {\n\t\tif a[i-1] > a[i] {\n\t\t\tbad++\n\t\t\tif bad > 1 {\n\t\t\t\treturn false\n\t\t\t}\n\t\t\tif i < 2 || a[i-2] <= a[i] {\n\t\t\t\ta[i-1] = a[i]\n\t\t\t} else {\n\t\t\t\ta[i] = a[i-1]\n\t\t\t}\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun checkPossibility(nums: IntArray): Boolean {\n    val a = nums.clone()\n    var bad = 0\n    for (i in 1 until a.size) {\n        if (a[i - 1] > a[i]) {\n            bad++\n            if (bad > 1) return false\n            if (i < 2 || a[i - 2] <= a[i]) a[i - 1] = a[i]\n            else a[i] = a[i - 1]\n        }\n    }\n    return true\n}`,
        swift: `func checkPossibility(_ nums: [Int]) -> Bool {\n    var a = nums\n    var bad = 0\n    for i in 1..<max(a.count, 1) {\n        if a[i - 1] > a[i] {\n            bad += 1\n            if bad > 1 { return false }\n            if i < 2 || a[i - 2] <= a[i] { a[i - 1] = a[i] }\n            else { a[i] = a[i - 1] }\n        }\n    }\n    return true\n}`,
        rust: `fn checkPossibility(nums: Vec<i32>) -> bool {\n    let mut a = nums.clone();\n    let mut bad = 0;\n    for i in 1..a.len() {\n        if a[i - 1] > a[i] {\n            bad += 1;\n            if bad > 1 {\n                return false;\n            }\n            if i < 2 || a[i - 2] <= a[i] {\n                a[i - 1] = a[i];\n            } else {\n                a[i] = a[i - 1];\n            }\n        }\n    }\n    true\n}`,
        php: `function checkPossibility($nums) {\n    $a = $nums;\n    $bad = 0;\n    for ($i = 1; $i < count($a); $i++) {\n        if ($a[$i - 1] > $a[$i]) {\n            $bad++;\n            if ($bad > 1) return false;\n            if ($i < 2 || $a[$i - 2] <= $a[$i]) $a[$i - 1] = $a[$i];\n            else $a[$i] = $a[$i - 1];\n        }\n    }\n    return true;\n}`,
        ruby: `def checkPossibility(nums)\n  a = nums.dup\n  bad = 0\n  (1...a.length).each do |i|\n    if a[i - 1] > a[i]\n      bad += 1\n      return false if bad > 1\n      if i < 2 || a[i - 2] <= a[i]\n        a[i - 1] = a[i]\n      else\n        a[i] = a[i - 1]\n      end\n    end\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Monotonic Array (LC 896) ────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let inc = true, dec = true;
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] < nums[i - 1]) inc = false;
        if (nums[i] > nums[i - 1]) dec = false;
      }
      return inc || dec;
    };
    return {
      slug: "monotonic-array",
      title: "Monotonic Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Facebook", "Amazon"],
      signature: { funcName: "isMonotonic", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "An array is **monotonic** if it is entirely non-increasing or entirely non-decreasing.\n\nGiven an integer array `nums`, return `true` if it is monotonic and `false` otherwise.",
        [
          { in: "nums = [1,2,2,3]", out: "true", note: "Non-decreasing throughout." },
          { in: "nums = [6,5,4,4]", out: "true", note: "Non-increasing throughout." },
          { in: "nums = [1,3,2]", out: "false" },
        ],
        ["1 <= nums.length <= 100000", "-100000 <= nums[i] <= 100000"]),
      hints: [
        "You do not need two passes — track both possibilities at once.",
        "Keep two booleans, `increasing` and `decreasing`, both starting `true`.",
        "A strict drop kills `increasing`; a strict rise kills `decreasing`. Equal neighbours kill neither.",
      ],
      editorial: explain({
        idea: "Monotonic means \"non-decreasing OR non-increasing\". Test both hypotheses in a single pass and see whether either survives.",
        steps: [
          "Start `inc = true` and `dec = true`.",
          "For each adjacent pair, if `nums[i] < nums[i-1]` set `inc = false`; if `nums[i] > nums[i-1]` set `dec = false`.",
          "Return `inc || dec`.",
        ],
        why: "`inc` stays true exactly when no strict descent exists, which is the definition of non-decreasing; `dec` mirrors it. Equal neighbours satisfy both definitions, so they must clear neither flag.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Using `<=` / `>=` in the clearing conditions makes a flat array like `[2,2,2]` report `false`.",
          "Deciding the direction from the first differing pair alone needs care when the array starts with a run of equal values.",
        ],
      }),
      examples: [
        { input: "[1,2,2,3]", expectedOutput: "true" },
        { input: "[6,5,4,4]", expectedOutput: "true" },
        { input: "[1,3,2]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        let nums = Array.from({ length: n }, () => ri(rng, -50, 50));
        const roll = rng();
        if (roll < 0.3) nums.sort((a, b) => a - b);
        else if (roll < 0.55) nums.sort((a, b) => b - a);
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef isMonotonic(nums: List[int]) -> bool:\n    inc = True\n    dec = True\n    for i in range(1, len(nums)):\n        if nums[i] < nums[i - 1]:\n            inc = False\n        if nums[i] > nums[i - 1]:\n            dec = False\n    return inc or dec`,
        javascript: `var isMonotonic = function(nums) {\n    let inc = true, dec = true;\n    for (let i = 1; i < nums.length; i++) {\n        if (nums[i] < nums[i - 1]) inc = false;\n        if (nums[i] > nums[i - 1]) dec = false;\n    }\n    return inc || dec;\n};`,
        typescript: `function isMonotonic(nums: number[]): boolean {\n    var inc = true, dec = true;\n    for (var i = 1; i < nums.length; i++) {\n        if (nums[i] < nums[i - 1]) inc = false;\n        if (nums[i] > nums[i - 1]) dec = false;\n    }\n    return inc || dec;\n}`,
        java: `public static boolean isMonotonic(int[] nums) {\n    boolean inc = true, dec = true;\n    for (int i = 1; i < nums.length; i++) {\n        if (nums[i] < nums[i - 1]) inc = false;\n        if (nums[i] > nums[i - 1]) dec = false;\n    }\n    return inc || dec;\n}`,
        cpp: `bool isMonotonic(vector<int>& nums) {\n    bool inc = true, dec = true;\n    for (int i = 1; i < (int) nums.size(); i++) {\n        if (nums[i] < nums[i - 1]) inc = false;\n        if (nums[i] > nums[i - 1]) dec = false;\n    }\n    return inc || dec;\n}`,
        c: `bool isMonotonic(int* nums, int numsSize) {\n    bool inc = true, dec = true;\n    for (int i = 1; i < numsSize; i++) {\n        if (nums[i] < nums[i - 1]) inc = false;\n        if (nums[i] > nums[i - 1]) dec = false;\n    }\n    return inc || dec;\n}`,
        csharp: `public static bool IsMonotonic(int[] nums)\n{\n    bool inc = true, dec = true;\n    for (int i = 1; i < nums.Length; i++)\n    {\n        if (nums[i] < nums[i - 1]) inc = false;\n        if (nums[i] > nums[i - 1]) dec = false;\n    }\n    return inc || dec;\n}`,
        go: `func isMonotonic(nums []int) bool {\n\tinc, dec := true, true\n\tfor i := 1; i < len(nums); i++ {\n\t\tif nums[i] < nums[i-1] {\n\t\t\tinc = false\n\t\t}\n\t\tif nums[i] > nums[i-1] {\n\t\t\tdec = false\n\t\t}\n\t}\n\treturn inc || dec\n}`,
        kotlin: `fun isMonotonic(nums: IntArray): Boolean {\n    var inc = true\n    var dec = true\n    for (i in 1 until nums.size) {\n        if (nums[i] < nums[i - 1]) inc = false\n        if (nums[i] > nums[i - 1]) dec = false\n    }\n    return inc || dec\n}`,
        swift: `func isMonotonic(_ nums: [Int]) -> Bool {\n    var inc = true\n    var dec = true\n    var i = 1\n    while i < nums.count {\n        if nums[i] < nums[i - 1] { inc = false }\n        if nums[i] > nums[i - 1] { dec = false }\n        i += 1\n    }\n    return inc || dec\n}`,
        rust: `fn isMonotonic(nums: Vec<i32>) -> bool {\n    let mut inc = true;\n    let mut dec = true;\n    for i in 1..nums.len() {\n        if nums[i] < nums[i - 1] {\n            inc = false;\n        }\n        if nums[i] > nums[i - 1] {\n            dec = false;\n        }\n    }\n    inc || dec\n}`,
        php: `function isMonotonic($nums) {\n    $inc = true;\n    $dec = true;\n    for ($i = 1; $i < count($nums); $i++) {\n        if ($nums[$i] < $nums[$i - 1]) $inc = false;\n        if ($nums[$i] > $nums[$i - 1]) $dec = false;\n    }\n    return $inc || $dec;\n}`,
        ruby: `def isMonotonic(nums)\n  inc = true\n  dec = true\n  (1...nums.length).each do |i|\n    inc = false if nums[i] < nums[i - 1]\n    dec = false if nums[i] > nums[i - 1]\n  end\n  inc || dec\nend`,
      },
    };
  })(),

  // ── K-diff Pairs in an Array (LC 532) ───────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      if (k < 0) return 0;
      const count: Record<string, number> = {};
      for (const x of nums) count[String(x)] = (count[String(x)] || 0) + 1;
      let total = 0;
      for (const key of Object.keys(count)) {
        const x = Number(key);
        if (k === 0) { if (count[key] > 1) total++; }
        else if (count[String(x + k)] !== undefined) total++;
      }
      return total;
    };
    return {
      slug: "k-diff-pairs-in-an-array",
      title: "K-diff Pairs in an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Amazon", "Microsoft"],
      signature: { funcName: "findPairs", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` and an integer `k`, return the number of **unique k-diff pairs** in the array.\n\nA k-diff pair is a pair `(nums[i], nums[j])` with `i != j` and `|nums[i] - nums[j]| == k`. Two pairs are the same if they consist of the same two **values**, so `(1,3)` and `(3,1)` count once.",
        [
          { in: "nums = [3,1,4,1,5], k = 2", out: "2", note: "The pairs are (1,3) and (3,5). The duplicate 1 does not create a third pair." },
          { in: "nums = [1,2,3,4,5], k = 1", out: "4", note: "(1,2), (2,3), (3,4) and (4,5)." },
          { in: "nums = [1,3,1,5,4], k = 0", out: "1", note: "Only the value 1 appears more than once." },
        ],
        ["1 <= nums.length <= 10000", "-10000000 <= nums[i] <= 10000000", "0 <= k <= 10000000"]),
      hints: [
        "\"Unique pairs\" means you should be counting **values**, not index pairs.",
        "Build a frequency map, then iterate over its distinct keys.",
        "`k == 0` is a special case: the pair is a value paired with itself, so it needs a frequency of at least 2.",
      ],
      editorial: explain({
        idea: "Because pairs are identified by their values, collapse the array to a frequency map first. Then each distinct value `x` contributes at most one pair — the one with `x + k`.",
        steps: [
          "Count occurrences of every value into a map.",
          "For each distinct key `x`: if `k == 0`, add 1 when `count[x] > 1`.",
          "If `k > 0`, add 1 when `x + k` is also a key.",
          "Return the running total.",
        ],
        why: "Fixing the smaller element of the pair as `x` and looking only *upward* to `x + k` visits every unordered value pair exactly once, which is precisely the uniqueness rule the problem states.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Checking both `x + k` and `x - k` double-counts every pair.",
          "Forgetting `k == 0` makes duplicate values report a pair for every occurrence.",
          "Sorting plus two pointers also works but must skip equal values explicitly.",
        ],
      }),
      examples: [
        { input: "[3,1,4,1,5]\n2", expectedOutput: "2" },
        { input: "[1,2,3,4,5]\n1", expectedOutput: "4" },
        { input: "[1,3,1,5,4]\n0", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const hi = rng() < 0.6 ? 12 : 200;
        const nums = Array.from({ length: n }, () => ri(rng, -hi, hi));
        const k = rng() < 0.25 ? 0 : ri(rng, 1, 8);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findPairs(nums: List[int], k: int) -> int:\n    if k < 0:\n        return 0\n    count = {}\n    for x in nums:\n        count[x] = count.get(x, 0) + 1\n    total = 0\n    for x in count:\n        if k == 0:\n            if count[x] > 1:\n                total += 1\n        elif x + k in count:\n            total += 1\n    return total`,
        javascript: `var findPairs = function(nums, k) {\n    if (k < 0) return 0;\n    const count = {};\n    for (let i = 0; i < nums.length; i++) {\n        const key = String(nums[i]);\n        count[key] = (count[key] || 0) + 1;\n    }\n    let total = 0;\n    const keys = Object.keys(count);\n    for (let i = 0; i < keys.length; i++) {\n        const x = Number(keys[i]);\n        if (k === 0) {\n            if (count[keys[i]] > 1) total++;\n        } else if (count[String(x + k)] !== undefined) {\n            total++;\n        }\n    }\n    return total;\n};`,
        typescript: `function findPairs(nums: number[], k: number): number {\n    if (k < 0) return 0;\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var key = String(nums[i]);\n        count[key] = (count[key] || 0) + 1;\n    }\n    var total = 0;\n    var keys = Object.keys(count);\n    for (var j = 0; j < keys.length; j++) {\n        var x = Number(keys[j]);\n        if (k === 0) {\n            if (count[keys[j]] > 1) total++;\n        } else if (count[String(x + k)] !== undefined) {\n            total++;\n        }\n    }\n    return total;\n}`,
        java: `public static int findPairs(int[] nums, int k) {\n    if (k < 0) return 0;\n    HashMap<Integer, Integer> count = new HashMap<>();\n    for (int x : nums) count.put(x, count.getOrDefault(x, 0) + 1);\n    int total = 0;\n    for (Map.Entry<Integer, Integer> e : count.entrySet()) {\n        if (k == 0) {\n            if (e.getValue() > 1) total++;\n        } else if (count.containsKey(e.getKey() + k)) {\n            total++;\n        }\n    }\n    return total;\n}`,
        cpp: `int findPairs(vector<int>& nums, int k) {\n    if (k < 0) return 0;\n    unordered_map<int, int> count;\n    for (int x : nums) count[x]++;\n    int total = 0;\n    for (auto& e : count) {\n        if (k == 0) {\n            if (e.second > 1) total++;\n        } else if (count.find(e.first + k) != count.end()) {\n            total++;\n        }\n    }\n    return total;\n}`,
        c: `static int cmpAscKDiff(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint findPairs(int* nums, int numsSize, int k) {\n    if (k < 0) return 0;\n    int* s = (int*) malloc(numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, numsSize, sizeof(int), cmpAscKDiff);\n    int total = 0;\n    int i = 0;\n    while (i < numsSize) {\n        int j = i;\n        while (j < numsSize && s[j] == s[i]) j++;\n        int freq = j - i;\n        if (k == 0) {\n            if (freq > 1) total++;\n        } else {\n            long long want = (long long) s[i] + k;\n            int lo = j, hi = numsSize - 1, found = 0;\n            while (lo <= hi) {\n                int mid = lo + (hi - lo) / 2;\n                if ((long long) s[mid] == want) { found = 1; break; }\n                if ((long long) s[mid] < want) lo = mid + 1;\n                else hi = mid - 1;\n            }\n            if (found) total++;\n        }\n        i = j;\n    }\n    free(s);\n    return total;\n}`,
        csharp: `public static int FindPairs(int[] nums, int k)\n{\n    if (k < 0) return 0;\n    var count = new Dictionary<int, int>();\n    foreach (int x in nums)\n    {\n        if (count.ContainsKey(x)) count[x]++;\n        else count[x] = 1;\n    }\n    int total = 0;\n    foreach (var e in count)\n    {\n        if (k == 0)\n        {\n            if (e.Value > 1) total++;\n        }\n        else if (count.ContainsKey(e.Key + k))\n        {\n            total++;\n        }\n    }\n    return total;\n}`,
        go: `func findPairs(nums []int, k int) int {\n\tif k < 0 {\n\t\treturn 0\n\t}\n\tcount := map[int]int{}\n\tfor _, x := range nums {\n\t\tcount[x]++\n\t}\n\ttotal := 0\n\tfor x, c := range count {\n\t\tif k == 0 {\n\t\t\tif c > 1 {\n\t\t\t\ttotal++\n\t\t\t}\n\t\t} else if _, ok := count[x+k]; ok {\n\t\t\ttotal++\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun findPairs(nums: IntArray, k: Int): Int {\n    if (k < 0) return 0\n    val count = HashMap<Int, Int>()\n    for (x in nums) count[x] = (count[x] ?: 0) + 1\n    var total = 0\n    for (e in count.entries) {\n        if (k == 0) {\n            if (e.value > 1) total++\n        } else if (count.containsKey(e.key + k)) {\n            total++\n        }\n    }\n    return total\n}`,
        swift: `func findPairs(_ nums: [Int], _ k: Int) -> Int {\n    if k < 0 { return 0 }\n    var count: [Int: Int] = [:]\n    for x in nums { count[x] = (count[x] ?? 0) + 1 }\n    var total = 0\n    for (x, c) in count {\n        if k == 0 {\n            if c > 1 { total += 1 }\n        } else if count[x + k] != nil {\n            total += 1\n        }\n    }\n    return total\n}`,
        rust: `fn findPairs(nums: Vec<i32>, k: i32) -> i32 {\n    use std::collections::HashMap;\n    if k < 0 {\n        return 0;\n    }\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for &x in nums.iter() {\n        *count.entry(x).or_insert(0) += 1;\n    }\n    let mut total = 0;\n    for (&x, &c) in count.iter() {\n        if k == 0 {\n            if c > 1 {\n                total += 1;\n            }\n        } else if count.contains_key(&(x + k)) {\n            total += 1;\n        }\n    }\n    total\n}`,
        php: `function findPairs($nums, $k) {\n    if ($k < 0) return 0;\n    $count = array();\n    foreach ($nums as $x) {\n        if (isset($count[$x])) $count[$x]++;\n        else $count[$x] = 1;\n    }\n    $total = 0;\n    foreach ($count as $x => $c) {\n        if ($k === 0) {\n            if ($c > 1) $total++;\n        } else if (isset($count[$x + $k])) {\n            $total++;\n        }\n    }\n    return $total;\n}`,
        ruby: `def findPairs(nums, k)\n  return 0 if k < 0\n  count = Hash.new(0)\n  nums.each { |x| count[x] += 1 }\n  total = 0\n  count.each do |x, c|\n    if k == 0\n      total += 1 if c > 1\n    elsif count.key?(x + k)\n      total += 1\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Fair Candy Swap (LC 888) ────────────────────────────────────
  (() => {
    const ref = (alice: number[], bob: number[]) => {
      let sa = 0, sb = 0;
      for (const x of alice) sa += x;
      for (const x of bob) sb += x;
      const delta = (sa - sb) / 2;
      const bset = new Set(bob);
      const cands = [...alice].sort((a, b) => a - b);
      for (const x of cands) {
        if (bset.has(x - delta)) return [x, x - delta];
      }
      return [];
    };
    return {
      slug: "fair-candy-swap",
      title: "Fair Candy Swap",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Amazon", "Google"],
      signature: {
        funcName: "fairCandySwap",
        params: [{ name: "aliceSizes", type: "int[]" as const }, { name: "bobSizes", type: "int[]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "Alice and Bob have candy boxes: `aliceSizes[i]` is the number of candies in Alice's `i`-th box, and `bobSizes[j]` is the number in Bob's `j`-th box.\n\nThey want to swap **exactly one box each** so that afterwards they hold the same total number of candies. Return an array `[x, y]` where `x` is the size of the box Alice gives and `y` is the size of the box Bob gives.\n\nAt least one answer exists. If several do, return the one with the **smallest `x`**.",
        [
          { in: "aliceSizes = [1,1], bobSizes = [2,2]", out: "[1,2]" },
          { in: "aliceSizes = [1,2], bobSizes = [2,3]", out: "[1,2]" },
          { in: "aliceSizes = [2], bobSizes = [1,3]", out: "[2,3]" },
        ],
        ["1 <= aliceSizes.length, bobSizes.length <= 10000", "1 <= aliceSizes[i], bobSizes[j] <= 100000", "A fair swap always exists."]),
      hints: [
        "Write down what the totals become after swapping `x` for `y`: `sumA - x + y` and `sumB - y + x`.",
        "Setting those equal gives `y = x - (sumA - sumB) / 2`. The whole problem collapses to that one equation.",
        "Put Bob's sizes in a set, then try Alice's sizes in increasing order and return the first `x` whose partner exists.",
      ],
      editorial: explain({
        idea: "After the swap Alice holds `sumA - x + y` and Bob holds `sumB - y + x`. Equating them fixes `y` in terms of `x`, so only a membership test remains.",
        steps: [
          "Compute `sumA` and `sumB`, then `delta = (sumA - sumB) / 2`.",
          "Load every one of Bob's sizes into a hash set.",
          "Sort Alice's sizes ascending and scan them; for each `x`, check whether `x - delta` is in Bob's set.",
          "Return `[x, x - delta]` for the first hit — the smallest valid `x`.",
        ],
        why: "`sumA - x + y = sumB - y + x` rearranges to `2(y - x) = sumB - sumA`, i.e. `y = x - (sumA - sumB)/2`. The totals differ by an even amount whenever a solution exists, so `delta` is always an integer.",
        time: "O(n log n + m) — the sort dominates",
        space: "O(m) for Bob's set",
        pitfalls: [
          "Scanning Alice's array in its original order returns *a* valid answer but not the smallest `x`.",
          "Testing every `(i, j)` pair is O(n·m) and times out at the stated limits.",
          "`delta` must be computed as an exact integer — halving before subtracting invites rounding mistakes.",
        ],
      }),
      examples: [
        { input: "[1,1]\n[2,2]", expectedOutput: "[1,2]" },
        { input: "[1,2]\n[2,3]", expectedOutput: "[1,2]" },
        { input: "[2]\n[1,3]", expectedOutput: "[2,3]" },
      ],
      gen: (rng: Rng) => {
        // Build a deck where a fair swap provably exists: pick Alice's gift x
        // and Bob's gift y, then size Bob's remaining boxes so the totals work
        // out. sumA - x + y == sumB - y + x  <=>  sumB = sumA - 2x + 2y.
        for (let attempt = 0; attempt < 80; attempt++) {
          const n = ri(rng, 1, 12), m = ri(rng, 2, 12);
          const alice = Array.from({ length: n }, () => ri(rng, 1, 40));
          const x = alice[ri(rng, 0, n - 1)];
          const y = ri(rng, 1, 40);
          const sa = alice.reduce((a, b) => a + b, 0);
          const wantSb = sa - 2 * x + 2 * y;
          const bob = Array.from({ length: m - 1 }, () => ri(rng, 1, 40));
          bob.push(y);
          const have = bob.reduce((a, b) => a + b, 0);
          const slack = wantSb - have;
          // Absorb the difference into a box that is not the gift box.
          const idx = ri(rng, 0, m - 2);
          if (bob[idx] + slack < 1 || bob[idx] + slack > 100000) continue;
          bob[idx] += slack;
          shuffle(rng, bob);
          const ans = ref(alice, bob);
          if (ans.length !== 2) continue;
          return { input: `${fmtIntArr(alice)}\n${fmtIntArr(bob)}`, expectedOutput: fmtIntArr(ans) };
        }
        return { input: "[1,1]\n[2,2]", expectedOutput: "[1,2]" };
      },
      solutions: {
        python: `from typing import List\n\ndef fairCandySwap(aliceSizes: List[int], bobSizes: List[int]) -> List[int]:\n    delta = (sum(aliceSizes) - sum(bobSizes)) // 2\n    bset = set(bobSizes)\n    for x in sorted(aliceSizes):\n        if x - delta in bset:\n            return [x, x - delta]\n    return []`,
        javascript: `var fairCandySwap = function(aliceSizes, bobSizes) {\n    let sa = 0, sb = 0;\n    for (let i = 0; i < aliceSizes.length; i++) sa += aliceSizes[i];\n    for (let i = 0; i < bobSizes.length; i++) sb += bobSizes[i];\n    const delta = (sa - sb) / 2;\n    const bset = {};\n    for (let i = 0; i < bobSizes.length; i++) bset[String(bobSizes[i])] = true;\n    const cands = aliceSizes.slice().sort(function(a, b) { return a - b; });\n    for (let i = 0; i < cands.length; i++) {\n        const y = cands[i] - delta;\n        if (bset[String(y)] === true) return [cands[i], y];\n    }\n    return [];\n};`,
        typescript: `function fairCandySwap(aliceSizes: number[], bobSizes: number[]): number[] {\n    var sa = 0, sb = 0;\n    for (var i = 0; i < aliceSizes.length; i++) sa += aliceSizes[i];\n    for (var j = 0; j < bobSizes.length; j++) sb += bobSizes[j];\n    var delta = (sa - sb) / 2;\n    var bset: { [key: string]: boolean } = {};\n    for (var b = 0; b < bobSizes.length; b++) bset[String(bobSizes[b])] = true;\n    var cands = aliceSizes.slice().sort(function(a, b) { return a - b; });\n    for (var c = 0; c < cands.length; c++) {\n        var y = cands[c] - delta;\n        if (bset[String(y)] === true) return [cands[c], y];\n    }\n    return [];\n}`,
        java: `public static int[] fairCandySwap(int[] aliceSizes, int[] bobSizes) {\n    long sa = 0, sb = 0;\n    for (int x : aliceSizes) sa += x;\n    for (int x : bobSizes) sb += x;\n    long delta = (sa - sb) / 2;\n    HashSet<Long> bset = new HashSet<>();\n    for (int x : bobSizes) bset.add((long) x);\n    int[] cands = aliceSizes.clone();\n    Arrays.sort(cands);\n    for (int x : cands) {\n        long y = x - delta;\n        if (bset.contains(y)) return new int[] { x, (int) y };\n    }\n    return new int[0];\n}`,
        cpp: `vector<int> fairCandySwap(vector<int>& aliceSizes, vector<int>& bobSizes) {\n    long long sa = 0, sb = 0;\n    for (int x : aliceSizes) sa += x;\n    for (int x : bobSizes) sb += x;\n    long long delta = (sa - sb) / 2;\n    unordered_set<long long> bset;\n    for (int x : bobSizes) bset.insert((long long) x);\n    vector<int> cands = aliceSizes;\n    sort(cands.begin(), cands.end());\n    for (int x : cands) {\n        long long y = (long long) x - delta;\n        if (bset.count(y)) return { x, (int) y };\n    }\n    return {};\n}`,
        c: `static int cmpAscCandy(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint* fairCandySwap(int* aliceSizes, int aliceSizesSize, int* bobSizes, int bobSizesSize, int* returnSize) {\n    long long sa = 0, sb = 0;\n    for (int i = 0; i < aliceSizesSize; i++) sa += aliceSizes[i];\n    for (int i = 0; i < bobSizesSize; i++) sb += bobSizes[i];\n    long long delta = (sa - sb) / 2;\n    int* bs = (int*) malloc(bobSizesSize * sizeof(int));\n    for (int i = 0; i < bobSizesSize; i++) bs[i] = bobSizes[i];\n    qsort(bs, bobSizesSize, sizeof(int), cmpAscCandy);\n    int* cands = (int*) malloc(aliceSizesSize * sizeof(int));\n    for (int i = 0; i < aliceSizesSize; i++) cands[i] = aliceSizes[i];\n    qsort(cands, aliceSizesSize, sizeof(int), cmpAscCandy);\n    int* out = (int*) malloc(2 * sizeof(int));\n    *returnSize = 0;\n    for (int i = 0; i < aliceSizesSize; i++) {\n        long long y = (long long) cands[i] - delta;\n        int lo = 0, hi = bobSizesSize - 1, found = 0;\n        while (lo <= hi) {\n            int mid = lo + (hi - lo) / 2;\n            if ((long long) bs[mid] == y) { found = 1; break; }\n            if ((long long) bs[mid] < y) lo = mid + 1;\n            else hi = mid - 1;\n        }\n        if (found) {\n            out[0] = cands[i];\n            out[1] = (int) y;\n            *returnSize = 2;\n            break;\n        }\n    }\n    free(bs);\n    free(cands);\n    return out;\n}`,
        csharp: `public static int[] FairCandySwap(int[] aliceSizes, int[] bobSizes)\n{\n    long sa = 0, sb = 0;\n    foreach (int x in aliceSizes) sa += x;\n    foreach (int x in bobSizes) sb += x;\n    long delta = (sa - sb) / 2;\n    var bset = new HashSet<long>();\n    foreach (int x in bobSizes) bset.Add((long) x);\n    int[] cands = (int[]) aliceSizes.Clone();\n    Array.Sort(cands);\n    foreach (int x in cands)\n    {\n        long y = x - delta;\n        if (bset.Contains(y)) return new int[] { x, (int) y };\n    }\n    return new int[0];\n}`,
        go: `func fairCandySwap(aliceSizes []int, bobSizes []int) []int {\n\tsa, sb := 0, 0\n\tfor _, x := range aliceSizes {\n\t\tsa += x\n\t}\n\tfor _, x := range bobSizes {\n\t\tsb += x\n\t}\n\tdelta := (sa - sb) / 2\n\tbset := map[int]bool{}\n\tfor _, x := range bobSizes {\n\t\tbset[x] = true\n\t}\n\tcands := append([]int{}, aliceSizes...)\n\tsort.Ints(cands)\n\tfor _, x := range cands {\n\t\tif bset[x-delta] {\n\t\t\treturn []int{x, x - delta}\n\t\t}\n\t}\n\treturn []int{}\n}`,
        kotlin: `fun fairCandySwap(aliceSizes: IntArray, bobSizes: IntArray): IntArray {\n    var sa = 0L\n    var sb = 0L\n    for (x in aliceSizes) sa += x\n    for (x in bobSizes) sb += x\n    val delta = (sa - sb) / 2\n    val bset = HashSet<Long>()\n    for (x in bobSizes) bset.add(x.toLong())\n    val cands = aliceSizes.clone()\n    cands.sort()\n    for (x in cands) {\n        val y = x - delta\n        if (bset.contains(y)) return intArrayOf(x, y.toInt())\n    }\n    return intArrayOf()\n}`,
        swift: `func fairCandySwap(_ aliceSizes: [Int], _ bobSizes: [Int]) -> [Int] {\n    var sa = 0\n    var sb = 0\n    for x in aliceSizes { sa += x }\n    for x in bobSizes { sb += x }\n    let delta = (sa - sb) / 2\n    let bset = Set(bobSizes)\n    for x in aliceSizes.sorted() {\n        if bset.contains(x - delta) { return [x, x - delta] }\n    }\n    return []\n}`,
        rust: `fn fairCandySwap(aliceSizes: Vec<i32>, bobSizes: Vec<i32>) -> Vec<i32> {\n    use std::collections::HashSet;\n    let sa: i64 = aliceSizes.iter().map(|&x| x as i64).sum();\n    let sb: i64 = bobSizes.iter().map(|&x| x as i64).sum();\n    let delta = (sa - sb) / 2;\n    let bset: HashSet<i64> = bobSizes.iter().map(|&x| x as i64).collect();\n    let mut cands = aliceSizes.clone();\n    cands.sort();\n    for &x in cands.iter() {\n        let y = x as i64 - delta;\n        if bset.contains(&y) {\n            return vec![x, y as i32];\n        }\n    }\n    vec![]\n}`,
        php: `function fairCandySwap($aliceSizes, $bobSizes) {\n    $sa = array_sum($aliceSizes);\n    $sb = array_sum($bobSizes);\n    $delta = intdiv($sa - $sb, 2);\n    $bset = array();\n    foreach ($bobSizes as $x) $bset[$x] = true;\n    $cands = $aliceSizes;\n    sort($cands);\n    foreach ($cands as $x) {\n        $y = $x - $delta;\n        if (isset($bset[$y])) return array($x, $y);\n    }\n    return array();\n}`,
        ruby: `def fairCandySwap(aliceSizes, bobSizes)\n  delta = (aliceSizes.sum - bobSizes.sum) / 2\n  bset = {}\n  bobSizes.each { |x| bset[x] = true }\n  aliceSizes.sort.each do |x|\n    y = x - delta\n    return [x, y] if bset.key?(y)\n  end\n  []\nend`,
      },
    };
  })(),

  // ── X of a Kind in a Deck of Cards (LC 914) ─────────────────────
  (() => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const ref = (deck: number[]) => {
      const count: Record<string, number> = {};
      for (const x of deck) count[String(x)] = (count[String(x)] || 0) + 1;
      let g = 0;
      for (const k of Object.keys(count)) g = gcd(g, count[k]);
      return g >= 2;
    };
    return {
      slug: "x-of-a-kind-in-a-deck-of-cards",
      title: "X of a Kind in a Deck of Cards",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Number Theory", "Amazon", "Google"],
      signature: { funcName: "hasGroupsSizeX", params: [{ name: "deck", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "You are given a deck of cards where `deck[i]` is the number written on the `i`-th card.\n\nReturn `true` if the whole deck can be split into groups such that **every group has the same size `x >= 2`** and **all cards in a group carry the same number**.",
        [
          { in: "deck = [1,2,3,4,4,3,2,1]", out: "true", note: "Every number appears twice, so x = 2 works." },
          { in: "deck = [1,1,1,2,2,2,3,3]", out: "false", note: "3 appears twice but 1 and 2 appear three times." },
          { in: "deck = [1,1,2,2,2,2]", out: "true", note: "x = 2 gives [1,1], [2,2] and [2,2]." },
        ],
        ["1 <= deck.length <= 10000", "0 <= deck[i] < 10000"]),
      hints: [
        "Group size `x` must divide the count of *every* distinct number.",
        "A number that divides all the counts is a common divisor of them.",
        "So the question is simply whether the **greatest common divisor** of all counts is at least 2.",
      ],
      editorial: explain({
        idea: "If groups all have size `x` and each group is single-valued, then `x` divides the frequency of every distinct card. Such an `x >= 2` exists exactly when the gcd of all frequencies is at least 2.",
        steps: [
          "Count how many times each distinct number appears.",
          "Fold the counts together with `gcd`, starting from `0` (since `gcd(0, n) = n`).",
          "Return `true` when the final gcd is `>= 2`.",
        ],
        why: "Any valid `x` is a common divisor of the frequencies, so `x <= gcd`. Conversely the gcd itself is a valid group size — each frequency is a multiple of it, so every number splits evenly into groups of that size.",
        time: "O(n log C) where C is the largest frequency",
        space: "O(n)",
        pitfalls: [
          "Checking only `x = 2` misses decks where every count is 3.",
          "A single card (`deck = [1]`) has gcd 1, so the answer is `false` — there is no group size `>= 2`.",
          "Seeding the fold with the first count instead of `0` works too, but seeding with `1` collapses every answer to `false`.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,4,3,2,1]", expectedOutput: "true" },
        { input: "[1,1,1,2,2,2,3,3]", expectedOutput: "false" },
        { input: "[1,1,2,2,2,2]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        let deck: number[];
        if (rng() < 0.45) {
          const x = ri(rng, 2, 4);
          const kinds = ri(rng, 1, 5);
          deck = [];
          for (let v = 0; v < kinds; v++) {
            const reps = x * ri(rng, 1, 3);
            for (let r = 0; r < reps; r++) deck.push(v);
          }
          shuffle(rng, deck);
        } else {
          const n = ri(rng, 1, 24);
          deck = Array.from({ length: n }, () => ri(rng, 0, 5));
        }
        return { input: fmtIntArr(deck), expectedOutput: bool(ref(deck)) };
      },
      solutions: {
        python: `from typing import List\n\ndef hasGroupsSizeX(deck: List[int]) -> bool:\n    from math import gcd\n    count = {}\n    for x in deck:\n        count[x] = count.get(x, 0) + 1\n    g = 0\n    for c in count.values():\n        g = gcd(g, c)\n    return g >= 2`,
        javascript: `var hasGroupsSizeX = function(deck) {\n    function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }\n    const count = {};\n    for (let i = 0; i < deck.length; i++) {\n        const key = String(deck[i]);\n        count[key] = (count[key] || 0) + 1;\n    }\n    let g = 0;\n    const keys = Object.keys(count);\n    for (let i = 0; i < keys.length; i++) g = gcd(g, count[keys[i]]);\n    return g >= 2;\n};`,
        typescript: `function hasGroupsSizeX(deck: number[]): boolean {\n    function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < deck.length; i++) {\n        var key = String(deck[i]);\n        count[key] = (count[key] || 0) + 1;\n    }\n    var g = 0;\n    var keys = Object.keys(count);\n    for (var j = 0; j < keys.length; j++) g = gcd(g, count[keys[j]]);\n    return g >= 2;\n}`,
        java: `public static boolean hasGroupsSizeX(int[] deck) {\n    HashMap<Integer, Integer> count = new HashMap<>();\n    for (int x : deck) count.put(x, count.getOrDefault(x, 0) + 1);\n    int g = 0;\n    for (int c : count.values()) {\n        int a = g, b = c;\n        while (b != 0) { int t = a % b; a = b; b = t; }\n        g = a;\n    }\n    return g >= 2;\n}`,
        cpp: `bool hasGroupsSizeX(vector<int>& deck) {\n    unordered_map<int, int> count;\n    for (int x : deck) count[x]++;\n    int g = 0;\n    for (auto& e : count) {\n        int a = g, b = e.second;\n        while (b != 0) { int t = a % b; a = b; b = t; }\n        g = a;\n    }\n    return g >= 2;\n}`,
        c: `bool hasGroupsSizeX(int* deck, int deckSize) {\n    int counts[10000];\n    for (int i = 0; i < 10000; i++) counts[i] = 0;\n    for (int i = 0; i < deckSize; i++) counts[deck[i]]++;\n    int g = 0;\n    for (int i = 0; i < 10000; i++) {\n        if (counts[i] == 0) continue;\n        int a = g, b = counts[i];\n        while (b != 0) { int t = a % b; a = b; b = t; }\n        g = a;\n    }\n    return g >= 2;\n}`,
        csharp: `public static bool HasGroupsSizeX(int[] deck)\n{\n    var count = new Dictionary<int, int>();\n    foreach (int x in deck)\n    {\n        if (count.ContainsKey(x)) count[x]++;\n        else count[x] = 1;\n    }\n    int g = 0;\n    foreach (int c in count.Values)\n    {\n        int a = g, b = c;\n        while (b != 0) { int t = a % b; a = b; b = t; }\n        g = a;\n    }\n    return g >= 2;\n}`,
        go: `func hasGroupsSizeX(deck []int) bool {\n\tcount := map[int]int{}\n\tfor _, x := range deck {\n\t\tcount[x]++\n\t}\n\tg := 0\n\tfor _, c := range count {\n\t\ta, b := g, c\n\t\tfor b != 0 {\n\t\t\ta, b = b, a%b\n\t\t}\n\t\tg = a\n\t}\n\treturn g >= 2\n}`,
        kotlin: `fun hasGroupsSizeX(deck: IntArray): Boolean {\n    val count = HashMap<Int, Int>()\n    for (x in deck) count[x] = (count[x] ?: 0) + 1\n    var g = 0\n    for (c in count.values) {\n        var a = g\n        var b = c\n        while (b != 0) {\n            val t = a % b\n            a = b\n            b = t\n        }\n        g = a\n    }\n    return g >= 2\n}`,
        swift: `func hasGroupsSizeX(_ deck: [Int]) -> Bool {\n    var count: [Int: Int] = [:]\n    for x in deck { count[x] = (count[x] ?? 0) + 1 }\n    var g = 0\n    for (_, c) in count {\n        var a = g\n        var b = c\n        while b != 0 {\n            let t = a % b\n            a = b\n            b = t\n        }\n        g = a\n    }\n    return g >= 2\n}`,
        rust: `fn hasGroupsSizeX(deck: Vec<i32>) -> bool {\n    use std::collections::HashMap;\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for &x in deck.iter() {\n        *count.entry(x).or_insert(0) += 1;\n    }\n    let mut g = 0;\n    for (_, &c) in count.iter() {\n        let mut a = g;\n        let mut b = c;\n        while b != 0 {\n            let t = a % b;\n            a = b;\n            b = t;\n        }\n        g = a;\n    }\n    g >= 2\n}`,
        php: `function hasGroupsSizeX($deck) {\n    $count = array();\n    foreach ($deck as $x) {\n        if (isset($count[$x])) $count[$x]++;\n        else $count[$x] = 1;\n    }\n    $g = 0;\n    foreach ($count as $c) {\n        $a = $g; $b = $c;\n        while ($b != 0) { $t = $a % $b; $a = $b; $b = $t; }\n        $g = $a;\n    }\n    return $g >= 2;\n}`,
        ruby: `def hasGroupsSizeX(deck)\n  count = Hash.new(0)\n  deck.each { |x| count[x] += 1 }\n  g = 0\n  count.each_value do |c|\n    a = g\n    b = c\n    while b != 0\n      a, b = b, a % b\n    end\n    g = a\n  end\n  g >= 2\nend`,
      },
    };
  })(),

  // ── Partition Array Into Three Parts With Equal Sum (LC 1013) ───
  (() => {
    const ref = (arr: number[]) => {
      let total = 0;
      for (const x of arr) total += x;
      if (total % 3 !== 0) return false;
      const part = total / 3;
      let acc = 0, found = 0;
      for (let i = 0; i < arr.length; i++) {
        acc += arr[i];
        if (acc === part * (found + 1)) {
          found++;
          if (found === 2 && i < arr.length - 1) return true;
        }
      }
      return false;
    };
    return {
      slug: "partition-array-into-three-parts-with-equal-sum",
      title: "Partition Array Into Three Parts With Equal Sum",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Prefix Sum", "Amazon"],
      signature: { funcName: "canThreePartsEqualSum", params: [{ name: "arr", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Given an array of integers `arr`, return `true` if it can be partitioned into **three non-empty contiguous parts** with equal sums.\n\nFormally, you need indices `i < j` with `i + 1 < j` such that `arr[0..i]`, `arr[i+1..j-1]` and `arr[j..n-1]` all have the same sum.",
        [
          { in: "arr = [0,2,1,-6,6,-7,9,1,2,0,1]", out: "true", note: "0+2+1-6 = 6-7+9-1... the three parts each sum to 3." },
          { in: "arr = [0,2,1,-6,6,7,9,-1,2,0,1]", out: "false" },
          { in: "arr = [3,3,6,5,-2,2,5,1,-9,4]", out: "true", note: "Each part sums to 6." },
        ],
        ["3 <= arr.length <= 50000", "-10000 <= arr[i] <= 10000"]),
      hints: [
        "If the total is not divisible by 3 the answer is immediately `false`.",
        "Sweep once, cutting greedily the moment the running sum reaches one third, then two thirds.",
        "The third part must be non-empty — check that the second cut happens before the last index.",
      ],
      editorial: explain({
        idea: "The two cut positions are forced: the first must land where the prefix sum first hits `total/3`, and the second where it first hits `2·total/3`. Cutting later can never help.",
        steps: [
          "Sum the array. If `total % 3 != 0`, return `false`.",
          "Set `part = total / 3` and sweep with a running prefix `acc`, counting cuts made.",
          "When `acc` equals `part * (cuts + 1)`, take the cut.",
          "Return `true` as soon as the second cut is taken at an index strictly before the last, so the third part is non-empty.",
        ],
        why: "Prefix sums are the only quantity that matters, and the earliest index reaching each threshold leaves the most room for the remaining parts. Because the trailing part is fixed by the second cut, taking cuts greedily is optimal.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Zeros make prefix sums plateau, so the running sum can equal `part` many times — count cuts, do not re-trigger on the same threshold.",
          "Allowing the second cut at the final index yields an empty third part.",
          "`total % 3` on negative totals still works in every language here because the check is against `0`, but the divisibility test must precede the division.",
        ],
      }),
      examples: [
        { input: "[0,2,1,-6,6,-7,9,1,2,0,1]", expectedOutput: "true" },
        { input: "[0,2,1,-6,6,7,9,-1,2,0,1]", expectedOutput: "false" },
        { input: "[3,3,6,5,-2,2,5,1,-9,4]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        let arr: number[];
        if (rng() < 0.45) {
          const part = ri(rng, -10, 10);
          const build = () => {
            const k = ri(rng, 1, 5);
            const seg = Array.from({ length: k }, () => ri(rng, -8, 8));
            const s = seg.reduce((a, b) => a + b, 0);
            seg[seg.length - 1] += part - s;
            return seg;
          };
          arr = [...build(), ...build(), ...build()];
        } else {
          const n = ri(rng, 3, 20);
          arr = Array.from({ length: n }, () => ri(rng, -8, 8));
        }
        return { input: fmtIntArr(arr), expectedOutput: bool(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef canThreePartsEqualSum(arr: List[int]) -> bool:\n    total = sum(arr)\n    if total % 3 != 0:\n        return False\n    part = total // 3\n    acc = 0\n    found = 0\n    for i, x in enumerate(arr):\n        acc += x\n        if acc == part * (found + 1):\n            found += 1\n            if found == 2 and i < len(arr) - 1:\n                return True\n    return False`,
        javascript: `var canThreePartsEqualSum = function(arr) {\n    let total = 0;\n    for (let i = 0; i < arr.length; i++) total += arr[i];\n    if (total % 3 !== 0) return false;\n    const part = total / 3;\n    let acc = 0, found = 0;\n    for (let i = 0; i < arr.length; i++) {\n        acc += arr[i];\n        if (acc === part * (found + 1)) {\n            found++;\n            if (found === 2 && i < arr.length - 1) return true;\n        }\n    }\n    return false;\n};`,
        typescript: `function canThreePartsEqualSum(arr: number[]): boolean {\n    var total = 0;\n    for (var i = 0; i < arr.length; i++) total += arr[i];\n    if (total % 3 !== 0) return false;\n    var part = total / 3;\n    var acc = 0, found = 0;\n    for (var j = 0; j < arr.length; j++) {\n        acc += arr[j];\n        if (acc === part * (found + 1)) {\n            found++;\n            if (found === 2 && j < arr.length - 1) return true;\n        }\n    }\n    return false;\n}`,
        java: `public static boolean canThreePartsEqualSum(int[] arr) {\n    long total = 0;\n    for (int x : arr) total += x;\n    if (total % 3 != 0) return false;\n    long part = total / 3;\n    long acc = 0;\n    int found = 0;\n    for (int i = 0; i < arr.length; i++) {\n        acc += arr[i];\n        if (acc == part * (found + 1)) {\n            found++;\n            if (found == 2 && i < arr.length - 1) return true;\n        }\n    }\n    return false;\n}`,
        cpp: `bool canThreePartsEqualSum(vector<int>& arr) {\n    long long total = 0;\n    for (int x : arr) total += x;\n    if (total % 3 != 0) return false;\n    long long part = total / 3;\n    long long acc = 0;\n    int found = 0;\n    for (int i = 0; i < (int) arr.size(); i++) {\n        acc += arr[i];\n        if (acc == part * (found + 1)) {\n            found++;\n            if (found == 2 && i < (int) arr.size() - 1) return true;\n        }\n    }\n    return false;\n}`,
        c: `bool canThreePartsEqualSum(int* arr, int arrSize) {\n    long long total = 0;\n    for (int i = 0; i < arrSize; i++) total += arr[i];\n    if (total % 3 != 0) return false;\n    long long part = total / 3;\n    long long acc = 0;\n    int found = 0;\n    for (int i = 0; i < arrSize; i++) {\n        acc += arr[i];\n        if (acc == part * (found + 1)) {\n            found++;\n            if (found == 2 && i < arrSize - 1) return true;\n        }\n    }\n    return false;\n}`,
        csharp: `public static bool CanThreePartsEqualSum(int[] arr)\n{\n    long total = 0;\n    foreach (int x in arr) total += x;\n    if (total % 3 != 0) return false;\n    long part = total / 3;\n    long acc = 0;\n    int found = 0;\n    for (int i = 0; i < arr.Length; i++)\n    {\n        acc += arr[i];\n        if (acc == part * (found + 1))\n        {\n            found++;\n            if (found == 2 && i < arr.Length - 1) return true;\n        }\n    }\n    return false;\n}`,
        go: `func canThreePartsEqualSum(arr []int) bool {\n\ttotal := 0\n\tfor _, x := range arr {\n\t\ttotal += x\n\t}\n\tif total%3 != 0 {\n\t\treturn false\n\t}\n\tpart := total / 3\n\tacc, found := 0, 0\n\tfor i, x := range arr {\n\t\tacc += x\n\t\tif acc == part*(found+1) {\n\t\t\tfound++\n\t\t\tif found == 2 && i < len(arr)-1 {\n\t\t\t\treturn true\n\t\t\t}\n\t\t}\n\t}\n\treturn false\n}`,
        kotlin: `fun canThreePartsEqualSum(arr: IntArray): Boolean {\n    var total = 0L\n    for (x in arr) total += x\n    if (total % 3 != 0L) return false\n    val part = total / 3\n    var acc = 0L\n    var found = 0\n    for (i in arr.indices) {\n        acc += arr[i]\n        if (acc == part * (found + 1)) {\n            found++\n            if (found == 2 && i < arr.size - 1) return true\n        }\n    }\n    return false\n}`,
        swift: `func canThreePartsEqualSum(_ arr: [Int]) -> Bool {\n    var total = 0\n    for x in arr { total += x }\n    if total % 3 != 0 { return false }\n    let part = total / 3\n    var acc = 0\n    var found = 0\n    for i in 0..<arr.count {\n        acc += arr[i]\n        if acc == part * (found + 1) {\n            found += 1\n            if found == 2 && i < arr.count - 1 { return true }\n        }\n    }\n    return false\n}`,
        rust: `fn canThreePartsEqualSum(arr: Vec<i32>) -> bool {\n    let total: i64 = arr.iter().map(|&x| x as i64).sum();\n    if total % 3 != 0 {\n        return false;\n    }\n    let part = total / 3;\n    let mut acc: i64 = 0;\n    let mut found: i64 = 0;\n    for i in 0..arr.len() {\n        acc += arr[i] as i64;\n        if acc == part * (found + 1) {\n            found += 1;\n            if found == 2 && i < arr.len() - 1 {\n                return true;\n            }\n        }\n    }\n    false\n}`,
        php: `function canThreePartsEqualSum($arr) {\n    $total = array_sum($arr);\n    if ($total % 3 !== 0) return false;\n    $part = intdiv($total, 3);\n    $acc = 0;\n    $found = 0;\n    for ($i = 0; $i < count($arr); $i++) {\n        $acc += $arr[$i];\n        if ($acc === $part * ($found + 1)) {\n            $found++;\n            if ($found === 2 && $i < count($arr) - 1) return true;\n        }\n    }\n    return false;\n}`,
        ruby: `def canThreePartsEqualSum(arr)\n  total = arr.sum\n  return false if total % 3 != 0\n  part = total / 3\n  acc = 0\n  found = 0\n  arr.each_with_index do |x, i|\n    acc += x\n    if acc == part * (found + 1)\n      found += 1\n      return true if found == 2 && i < arr.length - 1\n    end\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Duplicate Zeros (LC 1089) ───────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const n = arr.length;
      const out: number[] = [];
      for (let i = 0; i < n && out.length < n; i++) {
        out.push(arr[i]);
        if (arr[i] === 0 && out.length < n) out.push(0);
      }
      return out;
    };
    return {
      slug: "duplicate-zeros",
      title: "Duplicate Zeros",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Amazon", "Bloomberg"],
      signature: { funcName: "duplicateZeros", params: [{ name: "arr", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given a **fixed-length** array `arr`, duplicate every occurrence of `0`, shifting the remaining elements to the right.\n\nElements pushed past the end of the array are discarded — the length never changes. Return the resulting array.",
        [
          { in: "arr = [1,0,2,3,0,4,5,0]", out: "[1,0,0,2,3,0,0,4]", note: "The trailing 5 and 0 are pushed off the end." },
          { in: "arr = [1,2,3]", out: "[1,2,3]", note: "No zeros, so nothing moves." },
          { in: "arr = [0,0,0]", out: "[0,0,0]" },
        ],
        ["1 <= arr.length <= 10000", "0 <= arr[i] <= 9"]),
      hints: [
        "Writing into the array left-to-right overwrites values you have not read yet.",
        "The simplest correct approach builds the answer in a second buffer and stops once it is full.",
        "For the O(1)-space version, first count how many zeros survive, then copy backwards from the end.",
      ],
      editorial: explain({
        idea: "Every zero costs one extra slot. Build the output left to right and simply stop the moment it reaches the original length — everything after that would have fallen off the end anyway.",
        steps: [
          "Walk the input left to right, appending each element to an output buffer.",
          "After appending a `0`, append a second `0` — but only if there is still room.",
          "Stop as soon as the buffer holds `n` elements and return it.",
        ],
        why: "The output is produced in the same order the problem describes, and truncation at `n` matches \"elements beyond the length are not written\". The room check before the duplicate is what prevents writing an `n+1`-th element.",
        time: "O(n)",
        space: "O(n) for the buffer (O(1) is possible with a backwards two-pointer copy)",
        pitfalls: [
          "Shifting the tail on every zero is O(n²) and times out on long arrays.",
          "Duplicating in place from the left destroys unread input.",
          "A zero in the very last slot must **not** be duplicated — the check has to happen before the second write.",
        ],
      }),
      examples: [
        { input: "[1,0,2,3,0,4,5,0]", expectedOutput: "[1,0,0,2,3,0,0,4]" },
        { input: "[1,2,3]", expectedOutput: "[1,2,3]" },
        { input: "[0,0,0]", expectedOutput: "[0,0,0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const zeroBias = rng();
        const arr = Array.from({ length: n }, () => (rng() < zeroBias * 0.6 ? 0 : ri(rng, 0, 9)));
        return { input: fmtIntArr(arr), expectedOutput: fmtIntArr(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef duplicateZeros(arr: List[int]) -> List[int]:\n    n = len(arr)\n    out = []\n    for x in arr:\n        if len(out) >= n:\n            break\n        out.append(x)\n        if x == 0 and len(out) < n:\n            out.append(0)\n    return out`,
        javascript: `var duplicateZeros = function(arr) {\n    const n = arr.length;\n    const out = [];\n    for (let i = 0; i < n && out.length < n; i++) {\n        out.push(arr[i]);\n        if (arr[i] === 0 && out.length < n) out.push(0);\n    }\n    return out;\n};`,
        typescript: `function duplicateZeros(arr: number[]): number[] {\n    var n = arr.length;\n    var out: number[] = [];\n    for (var i = 0; i < n && out.length < n; i++) {\n        out.push(arr[i]);\n        if (arr[i] === 0 && out.length < n) out.push(0);\n    }\n    return out;\n}`,
        java: `public static int[] duplicateZeros(int[] arr) {\n    int n = arr.length;\n    int[] out = new int[n];\n    int j = 0;\n    for (int i = 0; i < n && j < n; i++) {\n        out[j++] = arr[i];\n        if (arr[i] == 0 && j < n) out[j++] = 0;\n    }\n    return out;\n}`,
        cpp: `vector<int> duplicateZeros(vector<int>& arr) {\n    int n = (int) arr.size();\n    vector<int> out;\n    for (int i = 0; i < n && (int) out.size() < n; i++) {\n        out.push_back(arr[i]);\n        if (arr[i] == 0 && (int) out.size() < n) out.push_back(0);\n    }\n    return out;\n}`,
        c: `int* duplicateZeros(int* arr, int arrSize, int* returnSize) {\n    int* out = (int*) malloc(arrSize * sizeof(int));\n    int j = 0;\n    for (int i = 0; i < arrSize && j < arrSize; i++) {\n        out[j++] = arr[i];\n        if (arr[i] == 0 && j < arrSize) out[j++] = 0;\n    }\n    *returnSize = arrSize;\n    return out;\n}`,
        csharp: `public static int[] DuplicateZeros(int[] arr)\n{\n    int n = arr.Length;\n    int[] out_ = new int[n];\n    int j = 0;\n    for (int i = 0; i < n && j < n; i++)\n    {\n        out_[j++] = arr[i];\n        if (arr[i] == 0 && j < n) out_[j++] = 0;\n    }\n    return out_;\n}`,
        go: `func duplicateZeros(arr []int) []int {\n\tn := len(arr)\n\tout := []int{}\n\tfor i := 0; i < n && len(out) < n; i++ {\n\t\tout = append(out, arr[i])\n\t\tif arr[i] == 0 && len(out) < n {\n\t\t\tout = append(out, 0)\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun duplicateZeros(arr: IntArray): IntArray {\n    val n = arr.size\n    val out = IntArray(n)\n    var j = 0\n    var i = 0\n    while (i < n && j < n) {\n        out[j++] = arr[i]\n        if (arr[i] == 0 && j < n) out[j++] = 0\n        i++\n    }\n    return out\n}`,
        swift: `func duplicateZeros(_ arr: [Int]) -> [Int] {\n    let n = arr.count\n    var out: [Int] = []\n    var i = 0\n    while i < n && out.count < n {\n        out.append(arr[i])\n        if arr[i] == 0 && out.count < n { out.append(0) }\n        i += 1\n    }\n    return out\n}`,
        rust: `fn duplicateZeros(arr: Vec<i32>) -> Vec<i32> {\n    let n = arr.len();\n    let mut out: Vec<i32> = Vec::new();\n    let mut i = 0;\n    while i < n && out.len() < n {\n        out.push(arr[i]);\n        if arr[i] == 0 && out.len() < n {\n            out.push(0);\n        }\n        i += 1;\n    }\n    out\n}`,
        php: `function duplicateZeros($arr) {\n    $n = count($arr);\n    $out = array();\n    for ($i = 0; $i < $n && count($out) < $n; $i++) {\n        $out[] = $arr[$i];\n        if ($arr[$i] === 0 && count($out) < $n) $out[] = 0;\n    }\n    return $out;\n}`,
        ruby: `def duplicateZeros(arr)\n  n = arr.length\n  out = []\n  arr.each do |x|\n    break if out.length >= n\n    out << x\n    out << 0 if x == 0 && out.length < n\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Distribute Candies to People (LC 1103) ──────────────────────
  (() => {
    const ref = (candies: number, numPeople: number) => {
      const out = new Array(numPeople).fill(0);
      let give = 1, i = 0;
      while (candies > 0) {
        const g = Math.min(give, candies);
        out[i % numPeople] += g;
        candies -= g;
        give++;
        i++;
      }
      return out;
    };
    return {
      slug: "distribute-candies-to-people",
      title: "Distribute Candies to People",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Simulation", "Amazon"],
      signature: {
        funcName: "distributeCandies",
        params: [{ name: "candies", type: "int" as const }, { name: "numPeople", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "You have `candies` sweets to hand out to `numPeople` people standing in a row.\n\nGo down the row giving 1 sweet to the first person, 2 to the second, and so on up to `numPeople` sweets to the last. Then start again from the first person, giving `numPeople + 1`, `numPeople + 2`, … and keep looping.\n\nWhen fewer sweets remain than the next person is owed, that person gets **all** the remainder and the process stops. Return the final count each person holds.",
        [
          { in: "candies = 7, numPeople = 4", out: "[1,2,3,1]", note: "1, 2, 3 are given in full; only 1 sweet is left for the fourth person." },
          { in: "candies = 10, numPeople = 3", out: "[5,2,3]", note: "Round one gives 1,2,3; then the first person takes the remaining 4." },
          { in: "candies = 1, numPeople = 1", out: "[1]" },
        ],
        ["1 <= candies <= 1000000000", "1 <= numPeople <= 1000"]),
      hints: [
        "The loop runs until the sweets are gone — how many rounds is that at most?",
        "The `k`-th handout is `k + 1` sweets, so after `m` handouts you have spent `m(m+1)/2`. That caps the loop at about `sqrt(2 · candies)` steps.",
        "Use `min(owed, remaining)` for each handout so the final partial gift is handled by the same line of code.",
      ],
      editorial: explain({
        idea: "Straight simulation is fast enough: the handouts grow linearly, so the total number of them is on the order of `sqrt(2 · candies)` — about 45,000 even at the maximum.",
        steps: [
          "Allocate an array of `numPeople` zeros.",
          "Track `give` (the amount owed on this handout, starting at 1) and `i` (the handout index).",
          "Each step, hand out `min(give, remaining)` to person `i % numPeople`, subtract it from the remainder, then increment both counters.",
          "Stop when nothing remains and return the array.",
        ],
        why: "Handing out `min(give, remaining)` collapses the \"give everything that is left\" rule into the ordinary case, so the loop needs no special final branch. The loop terminates because every iteration removes at least one sweet.",
        time: "O(sqrt(candies) + numPeople)",
        space: "O(numPeople)",
        pitfalls: [
          "Giving `give` unconditionally overshoots and leaves a negative remainder.",
          "Resetting `give` to 1 at the start of each round is wrong — it keeps growing across rounds.",
          "Indexing must wrap with `% numPeople`, not stop at the end of the row.",
        ],
      }),
      examples: [
        { input: "7\n4", expectedOutput: "[1,2,3,1]" },
        { input: "10\n3", expectedOutput: "[5,2,3]" },
        { input: "1\n1", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const numPeople = ri(rng, 1, 12);
        const candies = rng() < 0.5 ? ri(rng, 1, 200) : ri(rng, 1, 200000);
        return { input: `${candies}\n${numPeople}`, expectedOutput: fmtIntArr(ref(candies, numPeople)) };
      },
      solutions: {
        python: `from typing import List\n\ndef distributeCandies(candies: int, numPeople: int) -> List[int]:\n    out = [0] * numPeople\n    give = 1\n    i = 0\n    while candies > 0:\n        g = give if give < candies else candies\n        out[i % numPeople] += g\n        candies -= g\n        give += 1\n        i += 1\n    return out`,
        javascript: `var distributeCandies = function(candies, numPeople) {\n    const out = new Array(numPeople).fill(0);\n    let give = 1, i = 0;\n    while (candies > 0) {\n        const g = Math.min(give, candies);\n        out[i % numPeople] += g;\n        candies -= g;\n        give++;\n        i++;\n    }\n    return out;\n};`,
        typescript: `function distributeCandies(candies: number, numPeople: number): number[] {\n    var out: number[] = [];\n    for (var k = 0; k < numPeople; k++) out.push(0);\n    var give = 1, i = 0;\n    while (candies > 0) {\n        var g = Math.min(give, candies);\n        out[i % numPeople] += g;\n        candies -= g;\n        give++;\n        i++;\n    }\n    return out;\n}`,
        java: `public static int[] distributeCandies(int candies, int numPeople) {\n    int[] out = new int[numPeople];\n    long give = 1;\n    int i = 0;\n    while (candies > 0) {\n        long g = Math.min(give, (long) candies);\n        out[i % numPeople] += (int) g;\n        candies -= (int) g;\n        give++;\n        i++;\n    }\n    return out;\n}`,
        cpp: `vector<int> distributeCandies(int candies, int numPeople) {\n    vector<int> out(numPeople, 0);\n    long long give = 1;\n    int i = 0;\n    while (candies > 0) {\n        long long g = min(give, (long long) candies);\n        out[i % numPeople] += (int) g;\n        candies -= (int) g;\n        give++;\n        i++;\n    }\n    return out;\n}`,
        c: `int* distributeCandies(int candies, int numPeople, int* returnSize) {\n    int* out = (int*) calloc(numPeople, sizeof(int));\n    long long give = 1;\n    int i = 0;\n    while (candies > 0) {\n        long long g = give < candies ? give : candies;\n        out[i % numPeople] += (int) g;\n        candies -= (int) g;\n        give++;\n        i++;\n    }\n    *returnSize = numPeople;\n    return out;\n}`,
        csharp: `public static int[] DistributeCandies(int candies, int numPeople)\n{\n    int[] out_ = new int[numPeople];\n    long give = 1;\n    int i = 0;\n    while (candies > 0)\n    {\n        long g = Math.Min(give, (long) candies);\n        out_[i % numPeople] += (int) g;\n        candies -= (int) g;\n        give++;\n        i++;\n    }\n    return out_;\n}`,
        go: `func distributeCandies(candies int, numPeople int) []int {\n\tout := make([]int, numPeople)\n\tgive, i := 1, 0\n\tfor candies > 0 {\n\t\tg := give\n\t\tif g > candies {\n\t\t\tg = candies\n\t\t}\n\t\tout[i%numPeople] += g\n\t\tcandies -= g\n\t\tgive++\n\t\ti++\n\t}\n\treturn out\n}`,
        kotlin: `fun distributeCandies(candies: Int, numPeople: Int): IntArray {\n    val out = IntArray(numPeople)\n    var left = candies\n    var give = 1\n    var i = 0\n    while (left > 0) {\n        val g = if (give < left) give else left\n        out[i % numPeople] += g\n        left -= g\n        give++\n        i++\n    }\n    return out\n}`,
        swift: `func distributeCandies(_ candies: Int, _ numPeople: Int) -> [Int] {\n    var out = [Int](repeating: 0, count: numPeople)\n    var left = candies\n    var give = 1\n    var i = 0\n    while left > 0 {\n        let g = min(give, left)\n        out[i % numPeople] += g\n        left -= g\n        give += 1\n        i += 1\n    }\n    return out\n}`,
        rust: `fn distributeCandies(candies: i32, numPeople: i32) -> Vec<i32> {\n    let n = numPeople as usize;\n    let mut out: Vec<i32> = vec![0; n];\n    let mut left = candies as i64;\n    let mut give: i64 = 1;\n    let mut i: usize = 0;\n    while left > 0 {\n        let g = if give < left { give } else { left };\n        out[i % n] += g as i32;\n        left -= g;\n        give += 1;\n        i += 1;\n    }\n    out\n}`,
        php: `function distributeCandies($candies, $numPeople) {\n    $out = array_fill(0, $numPeople, 0);\n    $give = 1;\n    $i = 0;\n    while ($candies > 0) {\n        $g = $give < $candies ? $give : $candies;\n        $out[$i % $numPeople] += $g;\n        $candies -= $g;\n        $give++;\n        $i++;\n    }\n    return $out;\n}`,
        ruby: `def distributeCandies(candies, numPeople)\n  out = Array.new(numPeople, 0)\n  give = 1\n  i = 0\n  while candies > 0\n    g = [give, candies].min\n    out[i % numPeople] += g\n    candies -= g\n    give += 1\n    i += 1\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Replace Elements with Greatest Element on Right Side (LC 1299)
  (() => {
    const ref = (arr: number[]) => {
      const out = new Array(arr.length).fill(0);
      let best = -1;
      for (let i = arr.length - 1; i >= 0; i--) {
        out[i] = best;
        if (arr[i] > best) best = arr[i];
      }
      return out;
    };
    return {
      slug: "replace-elements-with-greatest-element-on-right-side",
      title: "Replace Elements with Greatest Element on Right Side",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Google"],
      signature: { funcName: "replaceElements", params: [{ name: "arr", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an array `arr`, replace every element with the **greatest element among the elements to its right**, and replace the last element with `-1`.\n\nReturn the resulting array.",
        [
          { in: "arr = [17,18,5,4,6,1]", out: "[18,6,6,6,1,-1]", note: "The largest value right of 17 is 18; right of 18 it is 6; and so on." },
          { in: "arr = [400]", out: "[-1]" },
          { in: "arr = [1,2,3]", out: "[3,3,-1]" },
        ],
        ["1 <= arr.length <= 10000", "1 <= arr[i] <= 100000"]),
      hints: [
        "A nested loop recomputes the same suffix maximum over and over.",
        "Walk the array from the right instead, carrying the maximum seen so far.",
        "Write the current running maximum **before** folding `arr[i]` into it — the element itself is not part of its own answer.",
      ],
      editorial: explain({
        idea: "The answer at index `i` is the maximum of the suffix starting at `i + 1`. A single right-to-left pass keeps that value in one variable.",
        steps: [
          "Initialise `best = -1`, which is exactly the answer for the final position.",
          "Sweep `i` from `n - 1` down to `0`: write `best` into `out[i]` first.",
          "Then update `best = max(best, arr[i])` so the next (more leftward) index sees the correct suffix maximum.",
        ],
        why: "Writing before updating is what excludes `arr[i]` from its own suffix. The invariant \"`best` = max of `arr[i+1..n-1]`\" holds at every write.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Updating `best` before writing includes the element itself and produces `[18,18,6,6,6,1]` on the first example.",
          "Seeding `best` with `arr[n-1]` instead of `-1` loses the required `-1` in the last slot.",
          "In-place rewriting works only if you keep the old `arr[i]` in a temporary before overwriting it.",
        ],
      }),
      examples: [
        { input: "[17,18,5,4,6,1]", expectedOutput: "[18,6,6,6,1,-1]" },
        { input: "[400]", expectedOutput: "[-1]" },
        { input: "[1,2,3]", expectedOutput: "[3,3,-1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const hi = rng() < 0.5 ? 20 : 100000;
        const arr = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(arr), expectedOutput: fmtIntArr(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef replaceElements(arr: List[int]) -> List[int]:\n    out = [0] * len(arr)\n    best = -1\n    for i in range(len(arr) - 1, -1, -1):\n        out[i] = best\n        if arr[i] > best:\n            best = arr[i]\n    return out`,
        javascript: `var replaceElements = function(arr) {\n    const out = new Array(arr.length).fill(0);\n    let best = -1;\n    for (let i = arr.length - 1; i >= 0; i--) {\n        out[i] = best;\n        if (arr[i] > best) best = arr[i];\n    }\n    return out;\n};`,
        typescript: `function replaceElements(arr: number[]): number[] {\n    var out: number[] = [];\n    for (var k = 0; k < arr.length; k++) out.push(0);\n    var best = -1;\n    for (var i = arr.length - 1; i >= 0; i--) {\n        out[i] = best;\n        if (arr[i] > best) best = arr[i];\n    }\n    return out;\n}`,
        java: `public static int[] replaceElements(int[] arr) {\n    int[] out = new int[arr.length];\n    int best = -1;\n    for (int i = arr.length - 1; i >= 0; i--) {\n        out[i] = best;\n        if (arr[i] > best) best = arr[i];\n    }\n    return out;\n}`,
        cpp: `vector<int> replaceElements(vector<int>& arr) {\n    vector<int> out(arr.size(), 0);\n    int best = -1;\n    for (int i = (int) arr.size() - 1; i >= 0; i--) {\n        out[i] = best;\n        if (arr[i] > best) best = arr[i];\n    }\n    return out;\n}`,
        c: `int* replaceElements(int* arr, int arrSize, int* returnSize) {\n    int* out = (int*) malloc(arrSize * sizeof(int));\n    int best = -1;\n    for (int i = arrSize - 1; i >= 0; i--) {\n        out[i] = best;\n        if (arr[i] > best) best = arr[i];\n    }\n    *returnSize = arrSize;\n    return out;\n}`,
        csharp: `public static int[] ReplaceElements(int[] arr)\n{\n    int[] out_ = new int[arr.Length];\n    int best = -1;\n    for (int i = arr.Length - 1; i >= 0; i--)\n    {\n        out_[i] = best;\n        if (arr[i] > best) best = arr[i];\n    }\n    return out_;\n}`,
        go: `func replaceElements(arr []int) []int {\n\tout := make([]int, len(arr))\n\tbest := -1\n\tfor i := len(arr) - 1; i >= 0; i-- {\n\t\tout[i] = best\n\t\tif arr[i] > best {\n\t\t\tbest = arr[i]\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun replaceElements(arr: IntArray): IntArray {\n    val out = IntArray(arr.size)\n    var best = -1\n    for (i in arr.indices.reversed()) {\n        out[i] = best\n        if (arr[i] > best) best = arr[i]\n    }\n    return out\n}`,
        swift: `func replaceElements(_ arr: [Int]) -> [Int] {\n    var out = [Int](repeating: 0, count: arr.count)\n    var best = -1\n    var i = arr.count - 1\n    while i >= 0 {\n        out[i] = best\n        if arr[i] > best { best = arr[i] }\n        i -= 1\n    }\n    return out\n}`,
        rust: `fn replaceElements(arr: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = vec![0; arr.len()];\n    let mut best = -1;\n    for i in (0..arr.len()).rev() {\n        out[i] = best;\n        if arr[i] > best {\n            best = arr[i];\n        }\n    }\n    out\n}`,
        php: `function replaceElements($arr) {\n    $n = count($arr);\n    $out = array_fill(0, $n, 0);\n    $best = -1;\n    for ($i = $n - 1; $i >= 0; $i--) {\n        $out[$i] = $best;\n        if ($arr[$i] > $best) $best = $arr[$i];\n    }\n    return $out;\n}`,
        ruby: `def replaceElements(arr)\n  out = Array.new(arr.length, 0)\n  best = -1\n  (arr.length - 1).downto(0) do |i|\n    out[i] = best\n    best = arr[i] if arr[i] > best\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Find N Unique Integers Sum up to Zero (LC 1304) ─────────────
  (() => {
    const ref = (n: number) => {
      const out: number[] = [];
      if (n % 2 === 1) {
        for (let i = -(n - 1) / 2; i <= (n - 1) / 2; i++) out.push(i);
      } else {
        for (let i = -n / 2; i <= n / 2; i++) if (i !== 0) out.push(i);
      }
      return out;
    };
    return {
      slug: "find-n-unique-integers-sum-up-to-zero",
      title: "Find N Unique Integers Sum up to Zero",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Amazon", "Adobe"],
      signature: { funcName: "sumZero", params: [{ name: "n", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer `n`, return an array of `n` **unique** integers that sum to `0`.\n\nMany such arrays exist; return the one whose values are packed as tightly around zero as possible, listed in **strictly increasing order**. Concretely: for odd `n` that is `[-(n-1)/2, …, 0, …, (n-1)/2]`, and for even `n` it is the same range with `0` removed.",
        [
          { in: "n = 5", out: "[-2,-1,0,1,2]" },
          { in: "n = 4", out: "[-2,-1,1,2]", note: "Zero is dropped so the count stays even and the values stay unique." },
          { in: "n = 1", out: "[0]" },
        ],
        ["1 <= n <= 1000"]),
      hints: [
        "Pairs of the form `(-k, k)` cancel out, so the sum takes care of itself.",
        "For odd `n` you have one element left over after pairing — make it `0`.",
        "For even `n`, skipping `0` keeps every value distinct while preserving the symmetry.",
      ],
      editorial: explain({
        idea: "Symmetry does all the work: `-k` and `+k` cancel, so any set built from such pairs sums to zero. Only the parity of `n` decides whether a lone `0` is needed.",
        steps: [
          "If `n` is odd, emit every integer from `-(n-1)/2` to `(n-1)/2` — that is `n` values including `0`.",
          "If `n` is even, emit every integer from `-n/2` to `n/2` but skip `0` — again `n` values.",
          "Both ranges are already in increasing order.",
        ],
        why: "Each range is symmetric about zero, so the positives cancel the negatives exactly. The odd case has an odd count only because `0` is included; the even case has an even count only because `0` is excluded.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Emitting `1, -1, 2, -2, …` also sums to zero but is not in increasing order, so the exact judge rejects it.",
          "Forgetting to skip `0` in the even case produces `n + 1` values.",
          "`n = 1` must answer `[0]`, which the odd branch already handles.",
        ],
      }),
      examples: [
        { input: "5", expectedOutput: "[-2,-1,0,1,2]" },
        { input: "4", expectedOutput: "[-2,-1,1,2]" },
        { input: "1", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        return { input: String(n), expectedOutput: fmtIntArr(ref(n)) };
      },
      solutions: {
        python: `from typing import List\n\ndef sumZero(n: int) -> List[int]:\n    out = []\n    if n % 2 == 1:\n        half = (n - 1) // 2\n        for i in range(-half, half + 1):\n            out.append(i)\n    else:\n        half = n // 2\n        for i in range(-half, half + 1):\n            if i != 0:\n                out.append(i)\n    return out`,
        javascript: `var sumZero = function(n) {\n    const out = [];\n    if (n % 2 === 1) {\n        const half = (n - 1) / 2;\n        for (let i = -half; i <= half; i++) out.push(i);\n    } else {\n        const half = n / 2;\n        for (let i = -half; i <= half; i++) if (i !== 0) out.push(i);\n    }\n    return out;\n};`,
        typescript: `function sumZero(n: number): number[] {\n    var out: number[] = [];\n    if (n % 2 === 1) {\n        var half = (n - 1) / 2;\n        for (var i = -half; i <= half; i++) out.push(i);\n    } else {\n        var h = n / 2;\n        for (var j = -h; j <= h; j++) if (j !== 0) out.push(j);\n    }\n    return out;\n}`,
        java: `public static int[] sumZero(int n) {\n    int[] out = new int[n];\n    int idx = 0;\n    if (n % 2 == 1) {\n        int half = (n - 1) / 2;\n        for (int i = -half; i <= half; i++) out[idx++] = i;\n    } else {\n        int half = n / 2;\n        for (int i = -half; i <= half; i++) if (i != 0) out[idx++] = i;\n    }\n    return out;\n}`,
        cpp: `vector<int> sumZero(int n) {\n    vector<int> out;\n    if (n % 2 == 1) {\n        int half = (n - 1) / 2;\n        for (int i = -half; i <= half; i++) out.push_back(i);\n    } else {\n        int half = n / 2;\n        for (int i = -half; i <= half; i++) if (i != 0) out.push_back(i);\n    }\n    return out;\n}`,
        c: `int* sumZero(int n, int* returnSize) {\n    int* out = (int*) malloc(n * sizeof(int));\n    int idx = 0;\n    if (n % 2 == 1) {\n        int half = (n - 1) / 2;\n        for (int i = -half; i <= half; i++) out[idx++] = i;\n    } else {\n        int half = n / 2;\n        for (int i = -half; i <= half; i++) if (i != 0) out[idx++] = i;\n    }\n    *returnSize = n;\n    return out;\n}`,
        csharp: `public static int[] SumZero(int n)\n{\n    int[] out_ = new int[n];\n    int idx = 0;\n    if (n % 2 == 1)\n    {\n        int half = (n - 1) / 2;\n        for (int i = -half; i <= half; i++) out_[idx++] = i;\n    }\n    else\n    {\n        int half = n / 2;\n        for (int i = -half; i <= half; i++) if (i != 0) out_[idx++] = i;\n    }\n    return out_;\n}`,
        go: `func sumZero(n int) []int {\n\tout := []int{}\n\tif n%2 == 1 {\n\t\thalf := (n - 1) / 2\n\t\tfor i := -half; i <= half; i++ {\n\t\t\tout = append(out, i)\n\t\t}\n\t} else {\n\t\thalf := n / 2\n\t\tfor i := -half; i <= half; i++ {\n\t\t\tif i != 0 {\n\t\t\t\tout = append(out, i)\n\t\t\t}\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun sumZero(n: Int): IntArray {\n    val out = IntArray(n)\n    var idx = 0\n    if (n % 2 == 1) {\n        val half = (n - 1) / 2\n        for (i in -half..half) out[idx++] = i\n    } else {\n        val half = n / 2\n        for (i in -half..half) if (i != 0) out[idx++] = i\n    }\n    return out\n}`,
        swift: `func sumZero(_ n: Int) -> [Int] {\n    var out: [Int] = []\n    if n % 2 == 1 {\n        let half = (n - 1) / 2\n        for i in -half...half { out.append(i) }\n    } else {\n        let half = n / 2\n        for i in -half...half where i != 0 { out.append(i) }\n    }\n    return out\n}`,
        rust: `fn sumZero(n: i32) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    if n % 2 == 1 {\n        let half = (n - 1) / 2;\n        for i in -half..=half {\n            out.push(i);\n        }\n    } else {\n        let half = n / 2;\n        for i in -half..=half {\n            if i != 0 {\n                out.push(i);\n            }\n        }\n    }\n    out\n}`,
        php: `function sumZero($n) {\n    $out = array();\n    if ($n % 2 === 1) {\n        $half = intdiv($n - 1, 2);\n        for ($i = -$half; $i <= $half; $i++) $out[] = $i;\n    } else {\n        $half = intdiv($n, 2);\n        for ($i = -$half; $i <= $half; $i++) if ($i !== 0) $out[] = $i;\n    }\n    return $out;\n}`,
        ruby: `def sumZero(n)\n  out = []\n  if n.odd?\n    half = (n - 1) / 2\n    (-half..half).each { |i| out << i }\n  else\n    half = n / 2\n    (-half..half).each { |i| out << i unless i == 0 }\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Minimum Value to Get Positive Step by Step Sum (LC 1413) ────
  (() => {
    const ref = (nums: number[]) => {
      let acc = 0, lowest = 0;
      for (const x of nums) { acc += x; if (acc < lowest) lowest = acc; }
      return 1 - lowest;
    };
    return {
      slug: "minimum-value-to-get-positive-step-by-step-sum",
      title: "Minimum Value to Get Positive Step by Step Sum",
      difficulty: "EASY" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Microsoft"],
      signature: { funcName: "minStartValue", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You start with some positive integer `startValue` and walk left to right through `nums`, adding each element to a running total.\n\nReturn the **minimum positive** `startValue` such that the running total is never less than `1` at any point.",
        [
          { in: "nums = [-3,2,-3,4,2]", out: "5", note: "Starting at 5 the totals are 2, 4, 1, 5, 7 — never below 1. Starting at 4 gives 1, 3, 0 — too low." },
          { in: "nums = [1,2]", out: "1", note: "The running total never dips, so the smallest allowed start works." },
          { in: "nums = [1,-2,-3]", out: "5" },
        ],
        ["1 <= nums.length <= 100", "-100 <= nums[i] <= 100"]),
      hints: [
        "The running total after `k` steps is `startValue + prefix[k]`. Only the prefix sums depend on the array.",
        "The tightest constraint comes from the **smallest** prefix sum.",
        "You need `startValue + minPrefix >= 1`, so `startValue = 1 - minPrefix` — clamped to at least 1.",
      ],
      editorial: explain({
        idea: "Adding a constant start value shifts every running total by the same amount, so the only prefix that matters is the lowest one.",
        steps: [
          "Sweep the array keeping a running sum `acc`.",
          "Track `lowest`, the minimum value `acc` ever reaches — initialised to `0` so an all-positive array is handled.",
          "Return `1 - lowest`.",
        ],
        why: "The constraint `startValue + prefix[k] >= 1` must hold for every `k`; the binding one is the minimum prefix. Seeding `lowest` at `0` encodes the separate rule that `startValue` itself must be at least 1.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Initialising `lowest` to `nums[0]` or to `+infinity` breaks the all-positive case, which must answer `1`.",
          "Binary searching the start value works but is unnecessary — the closed form is exact.",
        ],
      }),
      examples: [
        { input: "[-3,2,-3,4,2]", expectedOutput: "5" },
        { input: "[1,2]", expectedOutput: "1" },
        { input: "[1,-2,-3]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => ri(rng, -100, 100));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minStartValue(nums: List[int]) -> int:\n    acc = 0\n    lowest = 0\n    for x in nums:\n        acc += x\n        if acc < lowest:\n            lowest = acc\n    return 1 - lowest`,
        javascript: `var minStartValue = function(nums) {\n    let acc = 0, lowest = 0;\n    for (let i = 0; i < nums.length; i++) {\n        acc += nums[i];\n        if (acc < lowest) lowest = acc;\n    }\n    return 1 - lowest;\n};`,
        typescript: `function minStartValue(nums: number[]): number {\n    var acc = 0, lowest = 0;\n    for (var i = 0; i < nums.length; i++) {\n        acc += nums[i];\n        if (acc < lowest) lowest = acc;\n    }\n    return 1 - lowest;\n}`,
        java: `public static int minStartValue(int[] nums) {\n    int acc = 0, lowest = 0;\n    for (int x : nums) {\n        acc += x;\n        if (acc < lowest) lowest = acc;\n    }\n    return 1 - lowest;\n}`,
        cpp: `int minStartValue(vector<int>& nums) {\n    int acc = 0, lowest = 0;\n    for (int x : nums) {\n        acc += x;\n        if (acc < lowest) lowest = acc;\n    }\n    return 1 - lowest;\n}`,
        c: `int minStartValue(int* nums, int numsSize) {\n    int acc = 0, lowest = 0;\n    for (int i = 0; i < numsSize; i++) {\n        acc += nums[i];\n        if (acc < lowest) lowest = acc;\n    }\n    return 1 - lowest;\n}`,
        csharp: `public static int MinStartValue(int[] nums)\n{\n    int acc = 0, lowest = 0;\n    foreach (int x in nums)\n    {\n        acc += x;\n        if (acc < lowest) lowest = acc;\n    }\n    return 1 - lowest;\n}`,
        go: `func minStartValue(nums []int) int {\n\tacc, lowest := 0, 0\n\tfor _, x := range nums {\n\t\tacc += x\n\t\tif acc < lowest {\n\t\t\tlowest = acc\n\t\t}\n\t}\n\treturn 1 - lowest\n}`,
        kotlin: `fun minStartValue(nums: IntArray): Int {\n    var acc = 0\n    var lowest = 0\n    for (x in nums) {\n        acc += x\n        if (acc < lowest) lowest = acc\n    }\n    return 1 - lowest\n}`,
        swift: `func minStartValue(_ nums: [Int]) -> Int {\n    var acc = 0\n    var lowest = 0\n    for x in nums {\n        acc += x\n        if acc < lowest { lowest = acc }\n    }\n    return 1 - lowest\n}`,
        rust: `fn minStartValue(nums: Vec<i32>) -> i32 {\n    let mut acc = 0;\n    let mut lowest = 0;\n    for &x in nums.iter() {\n        acc += x;\n        if acc < lowest {\n            lowest = acc;\n        }\n    }\n    1 - lowest\n}`,
        php: `function minStartValue($nums) {\n    $acc = 0;\n    $lowest = 0;\n    foreach ($nums as $x) {\n        $acc += $x;\n        if ($acc < $lowest) $lowest = $acc;\n    }\n    return 1 - $lowest;\n}`,
        ruby: `def minStartValue(nums)\n  acc = 0\n  lowest = 0\n  nums.each do |x|\n    acc += x\n    lowest = acc if acc < lowest\n  end\n  1 - lowest\nend`,
      },
    };
  })(),

  // ── Find Lucky Integer in an Array (LC 1394) ────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const count: Record<string, number> = {};
      for (const x of arr) count[String(x)] = (count[String(x)] || 0) + 1;
      let best = -1;
      for (const k of Object.keys(count)) {
        const v = Number(k);
        if (count[k] === v && v > best) best = v;
      }
      return best;
    };
    return {
      slug: "find-lucky-integer-in-an-array",
      title: "Find Lucky Integer in an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Counting", "Amazon"],
      signature: { funcName: "findLucky", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An integer is **lucky** if its value equals the number of times it appears in the array.\n\nGiven an array of integers `arr`, return the **largest** lucky integer, or `-1` if none exists.",
        [
          { in: "arr = [2,2,3,4]", out: "2", note: "2 appears exactly twice." },
          { in: "arr = [1,2,2,3,3,3]", out: "3", note: "1, 2 and 3 are all lucky; the largest is 3." },
          { in: "arr = [2,2,2,3,3]", out: "-1", note: "2 appears three times and 3 appears twice." },
        ],
        ["1 <= arr.length <= 500", "1 <= arr[i] <= 500"]),
      hints: [
        "Count how many times each value appears.",
        "A value `v` is lucky exactly when `count[v] == v`.",
        "Scan the counts and keep the largest lucky value; `-1` if none matched.",
      ],
      editorial: explain({
        idea: "The definition is a direct test on a frequency table, so one counting pass and one scan finish the job.",
        steps: [
          "Build a frequency map (or, since values are bounded by 500, a fixed-size array).",
          "Walk the distinct values; whenever `count[v] == v`, consider `v` as a candidate.",
          "Return the largest candidate, or `-1` if there were none.",
        ],
        why: "Every lucky number must appear in the frequency table, so scanning the table considers all of them exactly once.",
        time: "O(n + V) where V is the value range",
        space: "O(V)",
        pitfalls: [
          "Returning the first lucky value found gives the smallest, not the largest.",
          "Scanning values downward from the maximum lets you return early — but only if you scan the value range, not the array order.",
        ],
      }),
      examples: [
        { input: "[2,2,3,4]", expectedOutput: "2" },
        { input: "[1,2,2,3,3,3]", expectedOutput: "3" },
        { input: "[2,2,2,3,3]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        let arr: number[];
        if (rng() < 0.5) {
          arr = [];
          const kinds = ri(rng, 1, 4);
          for (let i = 0; i < kinds; i++) {
            const v = ri(rng, 1, 5);
            const reps = rng() < 0.55 ? v : ri(rng, 1, 6);
            for (let r = 0; r < reps; r++) arr.push(v);
          }
          if (arr.length === 0) arr.push(1);
          shuffle(rng, arr);
        } else {
          const n = ri(rng, 1, 25);
          arr = Array.from({ length: n }, () => ri(rng, 1, 8));
        }
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findLucky(arr: List[int]) -> int:\n    count = {}\n    for x in arr:\n        count[x] = count.get(x, 0) + 1\n    best = -1\n    for v, c in count.items():\n        if c == v and v > best:\n            best = v\n    return best`,
        javascript: `var findLucky = function(arr) {\n    const count = {};\n    for (let i = 0; i < arr.length; i++) {\n        const key = String(arr[i]);\n        count[key] = (count[key] || 0) + 1;\n    }\n    let best = -1;\n    const keys = Object.keys(count);\n    for (let i = 0; i < keys.length; i++) {\n        const v = Number(keys[i]);\n        if (count[keys[i]] === v && v > best) best = v;\n    }\n    return best;\n};`,
        typescript: `function findLucky(arr: number[]): number {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < arr.length; i++) {\n        var key = String(arr[i]);\n        count[key] = (count[key] || 0) + 1;\n    }\n    var best = -1;\n    var keys = Object.keys(count);\n    for (var j = 0; j < keys.length; j++) {\n        var v = Number(keys[j]);\n        if (count[keys[j]] === v && v > best) best = v;\n    }\n    return best;\n}`,
        java: `public static int findLucky(int[] arr) {\n    int[] count = new int[501];\n    for (int x : arr) count[x]++;\n    int best = -1;\n    for (int v = 1; v <= 500; v++) {\n        if (count[v] == v && v > best) best = v;\n    }\n    return best;\n}`,
        cpp: `int findLucky(vector<int>& arr) {\n    vector<int> count(501, 0);\n    for (int x : arr) count[x]++;\n    int best = -1;\n    for (int v = 1; v <= 500; v++) {\n        if (count[v] == v && v > best) best = v;\n    }\n    return best;\n}`,
        c: `int findLucky(int* arr, int arrSize) {\n    int count[501];\n    for (int i = 0; i <= 500; i++) count[i] = 0;\n    for (int i = 0; i < arrSize; i++) count[arr[i]]++;\n    int best = -1;\n    for (int v = 1; v <= 500; v++) {\n        if (count[v] == v && v > best) best = v;\n    }\n    return best;\n}`,
        csharp: `public static int FindLucky(int[] arr)\n{\n    int[] count = new int[501];\n    foreach (int x in arr) count[x]++;\n    int best = -1;\n    for (int v = 1; v <= 500; v++)\n    {\n        if (count[v] == v && v > best) best = v;\n    }\n    return best;\n}`,
        go: `func findLucky(arr []int) int {\n\tcount := make([]int, 501)\n\tfor _, x := range arr {\n\t\tcount[x]++\n\t}\n\tbest := -1\n\tfor v := 1; v <= 500; v++ {\n\t\tif count[v] == v && v > best {\n\t\t\tbest = v\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun findLucky(arr: IntArray): Int {\n    val count = IntArray(501)\n    for (x in arr) count[x]++\n    var best = -1\n    for (v in 1..500) {\n        if (count[v] == v && v > best) best = v\n    }\n    return best\n}`,
        swift: `func findLucky(_ arr: [Int]) -> Int {\n    var count = [Int](repeating: 0, count: 501)\n    for x in arr { count[x] += 1 }\n    var best = -1\n    for v in 1...500 {\n        if count[v] == v && v > best { best = v }\n    }\n    return best\n}`,
        rust: `fn findLucky(arr: Vec<i32>) -> i32 {\n    let mut count = vec![0i32; 501];\n    for &x in arr.iter() {\n        count[x as usize] += 1;\n    }\n    let mut best = -1;\n    for v in 1..=500 {\n        if count[v as usize] == v && v > best {\n            best = v;\n        }\n    }\n    best\n}`,
        php: `function findLucky($arr) {\n    $count = array_fill(0, 501, 0);\n    foreach ($arr as $x) $count[$x]++;\n    $best = -1;\n    for ($v = 1; $v <= 500; $v++) {\n        if ($count[$v] === $v && $v > $best) $best = $v;\n    }\n    return $best;\n}`,
        ruby: `def findLucky(arr)\n  count = Hash.new(0)\n  arr.each { |x| count[x] += 1 }\n  best = -1\n  count.each do |v, c|\n    best = v if c == v && v > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Count Largest Group (LC 1399) ───────────────────────────────
  (() => {
    const ref = (n: number) => {
      const buckets: Record<string, number> = {};
      for (let i = 1; i <= n; i++) {
        let s = 0, x = i;
        while (x > 0) { s += x % 10; x = Math.floor(x / 10); }
        buckets[String(s)] = (buckets[String(s)] || 0) + 1;
      }
      let best = 0, groups = 0;
      for (const k of Object.keys(buckets)) {
        if (buckets[k] > best) { best = buckets[k]; groups = 1; }
        else if (buckets[k] === best) groups++;
      }
      return groups;
    };
    return {
      slug: "count-largest-group",
      title: "Count Largest Group",
      difficulty: "EASY" as const,
      tags: ["Math", "Hash Table", "Amazon", "Adobe"],
      signature: { funcName: "countLargestGroup", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Take every integer from `1` to `n` and group them by their **digit sum** — all numbers whose digits add to the same value land in the same group.\n\nReturn how many groups have the **largest** size.",
        [
          { in: "n = 13", out: "4", note: "The groups are [1,10], [2,11], [3,12], [4,13], [5], [6], [7], [8], [9]. Four groups have size 2." },
          { in: "n = 2", out: "2", note: "[1] and [2] both have size 1." },
          { in: "n = 24", out: "5" },
        ],
        ["1 <= n <= 10000"]),
      hints: [
        "The digit sum of a number below 10000 is at most 36, so there are very few groups.",
        "Bucket the counts, then find the maximum bucket size.",
        "Finally count how many buckets tie for that maximum.",
      ],
      editorial: explain({
        idea: "The digit sum is a tiny key — at most 36 for `n <= 10000` — so a plain counting array over digit sums is enough.",
        steps: [
          "For each `i` from `1` to `n`, compute its digit sum by repeatedly taking `i % 10` and dividing by 10.",
          "Increment the bucket for that digit sum.",
          "Find the largest bucket size, then count how many buckets equal it.",
        ],
        why: "Every number belongs to exactly one group, so the buckets partition `1..n` and the largest bucket size is well defined. Counting ties requires a second pass (or tracking both values in one).",
        time: "O(n log n) — digit extraction per number",
        space: "O(1) — the digit-sum range is bounded",
        pitfalls: [
          "Starting the range at `0` adds a phantom member to the digit-sum-0 group.",
          "Resetting the tie counter only on a strict improvement matters — using `>=` would count the maximum twice.",
        ],
      }),
      examples: [
        { input: "13", expectedOutput: "4" },
        { input: "2", expectedOutput: "2" },
        { input: "24", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.5 ? ri(rng, 1, 200) : ri(rng, 1, 10000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def countLargestGroup(n: int) -> int:\n    buckets = {}\n    for i in range(1, n + 1):\n        s = 0\n        x = i\n        while x > 0:\n            s += x % 10\n            x //= 10\n        buckets[s] = buckets.get(s, 0) + 1\n    best = 0\n    groups = 0\n    for c in buckets.values():\n        if c > best:\n            best = c\n            groups = 1\n        elif c == best:\n            groups += 1\n    return groups`,
        javascript: `var countLargestGroup = function(n) {\n    const buckets = new Array(50).fill(0);\n    for (let i = 1; i <= n; i++) {\n        let s = 0, x = i;\n        while (x > 0) { s += x % 10; x = Math.floor(x / 10); }\n        buckets[s]++;\n    }\n    let best = 0, groups = 0;\n    for (let i = 0; i < buckets.length; i++) {\n        if (buckets[i] === 0) continue;\n        if (buckets[i] > best) { best = buckets[i]; groups = 1; }\n        else if (buckets[i] === best) groups++;\n    }\n    return groups;\n};`,
        typescript: `function countLargestGroup(n: number): number {\n    var buckets: number[] = [];\n    for (var k = 0; k < 50; k++) buckets.push(0);\n    for (var i = 1; i <= n; i++) {\n        var s = 0, x = i;\n        while (x > 0) { s += x % 10; x = Math.floor(x / 10); }\n        buckets[s]++;\n    }\n    var best = 0, groups = 0;\n    for (var j = 0; j < buckets.length; j++) {\n        if (buckets[j] === 0) continue;\n        if (buckets[j] > best) { best = buckets[j]; groups = 1; }\n        else if (buckets[j] === best) groups++;\n    }\n    return groups;\n}`,
        java: `public static int countLargestGroup(int n) {\n    int[] buckets = new int[50];\n    for (int i = 1; i <= n; i++) {\n        int s = 0, x = i;\n        while (x > 0) { s += x % 10; x /= 10; }\n        buckets[s]++;\n    }\n    int best = 0, groups = 0;\n    for (int c : buckets) {\n        if (c == 0) continue;\n        if (c > best) { best = c; groups = 1; }\n        else if (c == best) groups++;\n    }\n    return groups;\n}`,
        cpp: `int countLargestGroup(int n) {\n    vector<int> buckets(50, 0);\n    for (int i = 1; i <= n; i++) {\n        int s = 0, x = i;\n        while (x > 0) { s += x % 10; x /= 10; }\n        buckets[s]++;\n    }\n    int best = 0, groups = 0;\n    for (int c : buckets) {\n        if (c == 0) continue;\n        if (c > best) { best = c; groups = 1; }\n        else if (c == best) groups++;\n    }\n    return groups;\n}`,
        c: `int countLargestGroup(int n) {\n    int buckets[50];\n    for (int i = 0; i < 50; i++) buckets[i] = 0;\n    for (int i = 1; i <= n; i++) {\n        int s = 0, x = i;\n        while (x > 0) { s += x % 10; x /= 10; }\n        buckets[s]++;\n    }\n    int best = 0, groups = 0;\n    for (int i = 0; i < 50; i++) {\n        if (buckets[i] == 0) continue;\n        if (buckets[i] > best) { best = buckets[i]; groups = 1; }\n        else if (buckets[i] == best) groups++;\n    }\n    return groups;\n}`,
        csharp: `public static int CountLargestGroup(int n)\n{\n    int[] buckets = new int[50];\n    for (int i = 1; i <= n; i++)\n    {\n        int s = 0, x = i;\n        while (x > 0) { s += x % 10; x /= 10; }\n        buckets[s]++;\n    }\n    int best = 0, groups = 0;\n    foreach (int c in buckets)\n    {\n        if (c == 0) continue;\n        if (c > best) { best = c; groups = 1; }\n        else if (c == best) groups++;\n    }\n    return groups;\n}`,
        go: `func countLargestGroup(n int) int {\n\tbuckets := make([]int, 50)\n\tfor i := 1; i <= n; i++ {\n\t\ts, x := 0, i\n\t\tfor x > 0 {\n\t\t\ts += x % 10\n\t\t\tx /= 10\n\t\t}\n\t\tbuckets[s]++\n\t}\n\tbest, groups := 0, 0\n\tfor _, c := range buckets {\n\t\tif c == 0 {\n\t\t\tcontinue\n\t\t}\n\t\tif c > best {\n\t\t\tbest = c\n\t\t\tgroups = 1\n\t\t} else if c == best {\n\t\t\tgroups++\n\t\t}\n\t}\n\treturn groups\n}`,
        kotlin: `fun countLargestGroup(n: Int): Int {\n    val buckets = IntArray(50)\n    for (i in 1..n) {\n        var s = 0\n        var x = i\n        while (x > 0) {\n            s += x % 10\n            x /= 10\n        }\n        buckets[s]++\n    }\n    var best = 0\n    var groups = 0\n    for (c in buckets) {\n        if (c == 0) continue\n        if (c > best) {\n            best = c\n            groups = 1\n        } else if (c == best) groups++\n    }\n    return groups\n}`,
        swift: `func countLargestGroup(_ n: Int) -> Int {\n    var buckets = [Int](repeating: 0, count: 50)\n    for i in 1...max(n, 1) {\n        var s = 0\n        var x = i\n        while x > 0 {\n            s += x % 10\n            x /= 10\n        }\n        buckets[s] += 1\n    }\n    var best = 0\n    var groups = 0\n    for c in buckets {\n        if c == 0 { continue }\n        if c > best {\n            best = c\n            groups = 1\n        } else if c == best {\n            groups += 1\n        }\n    }\n    return groups\n}`,
        rust: `fn countLargestGroup(n: i32) -> i32 {\n    let mut buckets = vec![0i32; 50];\n    for i in 1..=n {\n        let mut s = 0usize;\n        let mut x = i;\n        while x > 0 {\n            s += (x % 10) as usize;\n            x /= 10;\n        }\n        buckets[s] += 1;\n    }\n    let mut best = 0;\n    let mut groups = 0;\n    for &c in buckets.iter() {\n        if c == 0 {\n            continue;\n        }\n        if c > best {\n            best = c;\n            groups = 1;\n        } else if c == best {\n            groups += 1;\n        }\n    }\n    groups\n}`,
        php: `function countLargestGroup($n) {\n    $buckets = array_fill(0, 50, 0);\n    for ($i = 1; $i <= $n; $i++) {\n        $s = 0; $x = $i;\n        while ($x > 0) { $s += $x % 10; $x = intdiv($x, 10); }\n        $buckets[$s]++;\n    }\n    $best = 0; $groups = 0;\n    foreach ($buckets as $c) {\n        if ($c === 0) continue;\n        if ($c > $best) { $best = $c; $groups = 1; }\n        else if ($c === $best) $groups++;\n    }\n    return $groups;\n}`,
        ruby: `def countLargestGroup(n)\n  buckets = Array.new(50, 0)\n  (1..n).each do |i|\n    s = 0\n    x = i\n    while x > 0\n      s += x % 10\n      x /= 10\n    end\n    buckets[s] += 1\n  end\n  best = 0\n  groups = 0\n  buckets.each do |c|\n    next if c == 0\n    if c > best\n      best = c\n      groups = 1\n    elsif c == best\n      groups += 1\n    end\n  end\n  groups\nend`,
      },
    };
  })(),

  // ── Minimum Subsequence in Non-Increasing Order (LC 1403) ───────
  (() => {
    const ref = (nums: number[]) => {
      const s = [...nums].sort((a, b) => b - a);
      let total = 0;
      for (const x of s) total += x;
      const out: number[] = [];
      let acc = 0;
      for (const x of s) {
        out.push(x);
        acc += x;
        if (acc > total - acc) break;
      }
      return out;
    };
    return {
      slug: "minimum-subsequence-in-non-increasing-order",
      title: "Minimum Subsequence in Non-Increasing Order",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon"],
      signature: { funcName: "minSubsequence", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an array of positive integers `nums`, pick a subsequence whose sum is **strictly greater** than the sum of the elements you leave behind.\n\nAmong all such subsequences choose the one with the **fewest elements**; if several tie, choose the one with the **largest sum**. The answer is unique — return it sorted in **non-increasing** order.",
        [
          { in: "nums = [4,3,10,9,8]", out: "[10,9]", note: "10 + 9 = 19 beats 4 + 3 + 8 = 15, and no single element can." },
          { in: "nums = [4,4,7,6,7]", out: "[7,7,6]", note: "20 > 8. Two elements would give at most 14, which does not beat 14." },
          { in: "nums = [6]", out: "[6]" },
        ],
        ["1 <= nums.length <= 500", "1 <= nums[i] <= 100"]),
      hints: [
        "To use as few elements as possible while making the sum as large as possible, take the biggest values first.",
        "Sort descending, then keep adding until the running sum overtakes the remainder.",
        "The remainder is `total - running`, so the stop condition is `running > total - running`.",
      ],
      editorial: explain({
        idea: "Sorting descending and taking a greedy prefix is optimal on both criteria at once: for any fixed count, the largest-`k` prefix has the maximum possible sum, so it is the first count at which the condition can be met.",
        steps: [
          "Sort a copy of `nums` in non-increasing order and compute `total`.",
          "Walk the sorted values, appending each to the answer and accumulating `acc`.",
          "Stop the moment `acc > total - acc`.",
          "The collected prefix is already non-increasing, so return it as is.",
        ],
        why: "If a subsequence of size `k` satisfies the condition, so does the top-`k` prefix, because its sum is at least as large. Hence the smallest feasible `k` is found by the greedy scan, and at that `k` the top-`k` prefix is the maximum-sum choice — exactly the tie-break the problem asks for.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "The comparison must be strict — equal halves do not qualify, as `[4,4,7,6,7]` shows.",
          "Sorting ascending and taking from the end works but you must reverse the result.",
          "Returning the answer in the array's original order fails the exact judge.",
        ],
      }),
      examples: [
        { input: "[4,3,10,9,8]", expectedOutput: "[10,9]" },
        { input: "[4,4,7,6,7]", expectedOutput: "[7,7,6]" },
        { input: "[6]", expectedOutput: "[6]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const nums = Array.from({ length: n }, () => ri(rng, 1, 100));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minSubsequence(nums: List[int]) -> List[int]:\n    s = sorted(nums, reverse=True)\n    total = sum(s)\n    out = []\n    acc = 0\n    for x in s:\n        out.append(x)\n        acc += x\n        if acc > total - acc:\n            break\n    return out`,
        javascript: `var minSubsequence = function(nums) {\n    const s = nums.slice().sort(function(a, b) { return b - a; });\n    let total = 0;\n    for (let i = 0; i < s.length; i++) total += s[i];\n    const out = [];\n    let acc = 0;\n    for (let i = 0; i < s.length; i++) {\n        out.push(s[i]);\n        acc += s[i];\n        if (acc > total - acc) break;\n    }\n    return out;\n};`,
        typescript: `function minSubsequence(nums: number[]): number[] {\n    var s = nums.slice().sort(function(a, b) { return b - a; });\n    var total = 0;\n    for (var i = 0; i < s.length; i++) total += s[i];\n    var out: number[] = [];\n    var acc = 0;\n    for (var j = 0; j < s.length; j++) {\n        out.push(s[j]);\n        acc += s[j];\n        if (acc > total - acc) break;\n    }\n    return out;\n}`,
        java: `public static int[] minSubsequence(int[] nums) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    int n = s.length;\n    int[] desc = new int[n];\n    for (int i = 0; i < n; i++) desc[i] = s[n - 1 - i];\n    long total = 0;\n    for (int x : desc) total += x;\n    long acc = 0;\n    int take = 0;\n    for (int i = 0; i < n; i++) {\n        acc += desc[i];\n        take++;\n        if (acc > total - acc) break;\n    }\n    int[] out = new int[take];\n    for (int i = 0; i < take; i++) out[i] = desc[i];\n    return out;\n}`,
        cpp: `vector<int> minSubsequence(vector<int>& nums) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end(), greater<int>());\n    long long total = 0;\n    for (int x : s) total += x;\n    vector<int> out;\n    long long acc = 0;\n    for (int x : s) {\n        out.push_back(x);\n        acc += x;\n        if (acc > total - acc) break;\n    }\n    return out;\n}`,
        c: `static int cmpDescMinSub(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (y > x) - (y < x);\n}\n\nint* minSubsequence(int* nums, int numsSize, int* returnSize) {\n    int* s = (int*) malloc(numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, numsSize, sizeof(int), cmpDescMinSub);\n    long long total = 0;\n    for (int i = 0; i < numsSize; i++) total += s[i];\n    long long acc = 0;\n    int take = 0;\n    for (int i = 0; i < numsSize; i++) {\n        acc += s[i];\n        take++;\n        if (acc > total - acc) break;\n    }\n    int* out = (int*) malloc((take > 0 ? take : 1) * sizeof(int));\n    for (int i = 0; i < take; i++) out[i] = s[i];\n    free(s);\n    *returnSize = take;\n    return out;\n}`,
        csharp: `public static int[] MinSubsequence(int[] nums)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    Array.Reverse(s);\n    long total = 0;\n    foreach (int x in s) total += x;\n    var out_ = new List<int>();\n    long acc = 0;\n    foreach (int x in s)\n    {\n        out_.Add(x);\n        acc += x;\n        if (acc > total - acc) break;\n    }\n    return out_.ToArray();\n}`,
        go: `func minSubsequence(nums []int) []int {\n\ts := append([]int{}, nums...)\n\tsort.Sort(sort.Reverse(sort.IntSlice(s)))\n\ttotal := 0\n\tfor _, x := range s {\n\t\ttotal += x\n\t}\n\tout := []int{}\n\tacc := 0\n\tfor _, x := range s {\n\t\tout = append(out, x)\n\t\tacc += x\n\t\tif acc > total-acc {\n\t\t\tbreak\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun minSubsequence(nums: IntArray): IntArray {\n    val s = nums.sortedDescending()\n    var total = 0L\n    for (x in s) total += x\n    val out = ArrayList<Int>()\n    var acc = 0L\n    for (x in s) {\n        out.add(x)\n        acc += x\n        if (acc > total - acc) break\n    }\n    return out.toIntArray()\n}`,
        swift: `func minSubsequence(_ nums: [Int]) -> [Int] {\n    let s = nums.sorted(by: >)\n    var total = 0\n    for x in s { total += x }\n    var out: [Int] = []\n    var acc = 0\n    for x in s {\n        out.append(x)\n        acc += x\n        if acc > total - acc { break }\n    }\n    return out\n}`,
        rust: `fn minSubsequence(nums: Vec<i32>) -> Vec<i32> {\n    let mut s = nums.clone();\n    s.sort();\n    s.reverse();\n    let total: i64 = s.iter().map(|&x| x as i64).sum();\n    let mut out: Vec<i32> = Vec::new();\n    let mut acc: i64 = 0;\n    for &x in s.iter() {\n        out.push(x);\n        acc += x as i64;\n        if acc > total - acc {\n            break;\n        }\n    }\n    out\n}`,
        php: `function minSubsequence($nums) {\n    $s = $nums;\n    rsort($s);\n    $total = array_sum($s);\n    $out = array();\n    $acc = 0;\n    foreach ($s as $x) {\n        $out[] = $x;\n        $acc += $x;\n        if ($acc > $total - $acc) break;\n    }\n    return $out;\n}`,
        ruby: `def minSubsequence(nums)\n  s = nums.sort.reverse\n  total = s.sum\n  out = []\n  acc = 0\n  s.each do |x|\n    out << x\n    acc += x\n    break if acc > total - acc\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Teemo Attacking (LC 495) ────────────────────────────────────
  (() => {
    const ref = (timeSeries: number[], duration: number) => {
      if (timeSeries.length === 0) return 0;
      let total = 0;
      for (let i = 1; i < timeSeries.length; i++) {
        total += Math.min(duration, timeSeries[i] - timeSeries[i - 1]);
      }
      return total + duration;
    };
    return {
      slug: "teemo-attacking",
      title: "Teemo Attacking",
      difficulty: "EASY" as const,
      tags: ["Array", "Simulation", "Amazon", "Riot Games"],
      signature: {
        funcName: "findPoisonedDuration",
        params: [{ name: "timeSeries", type: "int[]" as const }, { name: "duration", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Teemo attacks Ashe at each second listed in the **strictly increasing** array `timeSeries`. Every attack poisons Ashe for exactly `duration` seconds starting at that instant.\n\nIf an attack lands while Ashe is already poisoned, the timer **resets** rather than stacking. Return the total number of seconds Ashe spends poisoned.",
        [
          { in: "timeSeries = [1,4], duration = 2", out: "4", note: "Poisoned during seconds 1-2 and 4-5." },
          { in: "timeSeries = [1,2], duration = 2", out: "3", note: "The second attack resets the timer, so the poison covers seconds 1-3." },
          { in: "timeSeries = [1,2,3,4,5], duration = 5", out: "9" },
        ],
        ["1 <= timeSeries.length <= 100000", "0 <= timeSeries[i], duration <= 100000000", "timeSeries is strictly increasing."]),
      hints: [
        "Think about how much *new* poisoned time each attack contributes.",
        "Between consecutive attacks, the earlier one contributes `min(duration, gap)` seconds.",
        "The very last attack always contributes a full `duration`.",
      ],
      editorial: explain({
        idea: "Rather than merging intervals, charge each attack for the time it uniquely covers. Attack `i` is cut short by attack `i+1` exactly when the gap between them is smaller than `duration`.",
        steps: [
          "For each adjacent pair, add `min(duration, timeSeries[i] - timeSeries[i-1])`.",
          "Add a full `duration` for the final attack, which nothing truncates.",
          "Return the sum.",
        ],
        why: "The poisoned set is the union of intervals `[t_i, t_i + duration)`. Because the times are strictly increasing, interval `i` contributes `min(duration, t_{i+1} - t_i)` before interval `i+1` takes over, and the union telescopes into exactly this sum.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Multiplying `n * duration` ignores overlaps entirely.",
          "Forgetting the trailing `+ duration` undercounts by one full poison window.",
          "With values up to 1e8 and 1e5 attacks the total needs 64-bit accumulation in some languages even though the answer fits in 32 bits.",
        ],
      }),
      examples: [
        { input: "[1,4]\n2", expectedOutput: "4" },
        { input: "[1,2]\n2", expectedOutput: "3" },
        { input: "[1,2,3,4,5]\n5", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const times: number[] = [];
        let t = ri(rng, 0, 5);
        for (let i = 0; i < n; i++) { times.push(t); t += ri(rng, 1, 10); }
        const duration = ri(rng, 0, 12);
        return { input: `${fmtIntArr(times)}\n${duration}`, expectedOutput: String(ref(times, duration)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findPoisonedDuration(timeSeries: List[int], duration: int) -> int:\n    if not timeSeries:\n        return 0\n    total = 0\n    for i in range(1, len(timeSeries)):\n        gap = timeSeries[i] - timeSeries[i - 1]\n        total += gap if gap < duration else duration\n    return total + duration`,
        javascript: `var findPoisonedDuration = function(timeSeries, duration) {\n    if (timeSeries.length === 0) return 0;\n    let total = 0;\n    for (let i = 1; i < timeSeries.length; i++) {\n        total += Math.min(duration, timeSeries[i] - timeSeries[i - 1]);\n    }\n    return total + duration;\n};`,
        typescript: `function findPoisonedDuration(timeSeries: number[], duration: number): number {\n    if (timeSeries.length === 0) return 0;\n    var total = 0;\n    for (var i = 1; i < timeSeries.length; i++) {\n        total += Math.min(duration, timeSeries[i] - timeSeries[i - 1]);\n    }\n    return total + duration;\n}`,
        java: `public static int findPoisonedDuration(int[] timeSeries, int duration) {\n    if (timeSeries.length == 0) return 0;\n    long total = 0;\n    for (int i = 1; i < timeSeries.length; i++) {\n        total += Math.min((long) duration, (long) timeSeries[i] - timeSeries[i - 1]);\n    }\n    return (int) (total + duration);\n}`,
        cpp: `int findPoisonedDuration(vector<int>& timeSeries, int duration) {\n    if (timeSeries.empty()) return 0;\n    long long total = 0;\n    for (int i = 1; i < (int) timeSeries.size(); i++) {\n        long long gap = (long long) timeSeries[i] - timeSeries[i - 1];\n        total += min((long long) duration, gap);\n    }\n    return (int) (total + duration);\n}`,
        c: `int findPoisonedDuration(int* timeSeries, int timeSeriesSize, int duration) {\n    if (timeSeriesSize == 0) return 0;\n    long long total = 0;\n    for (int i = 1; i < timeSeriesSize; i++) {\n        long long gap = (long long) timeSeries[i] - timeSeries[i - 1];\n        total += gap < duration ? gap : duration;\n    }\n    return (int) (total + duration);\n}`,
        csharp: `public static int FindPoisonedDuration(int[] timeSeries, int duration)\n{\n    if (timeSeries.Length == 0) return 0;\n    long total = 0;\n    for (int i = 1; i < timeSeries.Length; i++)\n    {\n        long gap = (long) timeSeries[i] - timeSeries[i - 1];\n        total += Math.Min((long) duration, gap);\n    }\n    return (int) (total + duration);\n}`,
        go: `func findPoisonedDuration(timeSeries []int, duration int) int {\n\tif len(timeSeries) == 0 {\n\t\treturn 0\n\t}\n\ttotal := 0\n\tfor i := 1; i < len(timeSeries); i++ {\n\t\tgap := timeSeries[i] - timeSeries[i-1]\n\t\tif gap > duration {\n\t\t\tgap = duration\n\t\t}\n\t\ttotal += gap\n\t}\n\treturn total + duration\n}`,
        kotlin: `fun findPoisonedDuration(timeSeries: IntArray, duration: Int): Int {\n    if (timeSeries.isEmpty()) return 0\n    var total = 0L\n    for (i in 1 until timeSeries.size) {\n        val gap = (timeSeries[i] - timeSeries[i - 1]).toLong()\n        total += if (gap < duration) gap else duration.toLong()\n    }\n    return (total + duration).toInt()\n}`,
        swift: `func findPoisonedDuration(_ timeSeries: [Int], _ duration: Int) -> Int {\n    if timeSeries.isEmpty { return 0 }\n    var total = 0\n    for i in 1..<max(timeSeries.count, 1) {\n        total += min(duration, timeSeries[i] - timeSeries[i - 1])\n    }\n    return total + duration\n}`,
        rust: `fn findPoisonedDuration(timeSeries: Vec<i32>, duration: i32) -> i32 {\n    if timeSeries.is_empty() {\n        return 0;\n    }\n    let mut total: i64 = 0;\n    for i in 1..timeSeries.len() {\n        let gap = (timeSeries[i] - timeSeries[i - 1]) as i64;\n        total += if gap < duration as i64 { gap } else { duration as i64 };\n    }\n    (total + duration as i64) as i32\n}`,
        php: `function findPoisonedDuration($timeSeries, $duration) {\n    if (count($timeSeries) === 0) return 0;\n    $total = 0;\n    for ($i = 1; $i < count($timeSeries); $i++) {\n        $gap = $timeSeries[$i] - $timeSeries[$i - 1];\n        $total += $gap < $duration ? $gap : $duration;\n    }\n    return $total + $duration;\n}`,
        ruby: `def findPoisonedDuration(timeSeries, duration)\n  return 0 if timeSeries.empty?\n  total = 0\n  (1...timeSeries.length).each do |i|\n    total += [duration, timeSeries[i] - timeSeries[i - 1]].min\n  end\n  total + duration\nend`,
      },
    };
  })(),

  // ── Check If All 1's Are at Least Length K Places Away (LC 1437)
  (() => {
    const ref = (nums: number[], k: number) => {
      let prev = -1;
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] === 1) {
          if (prev !== -1 && i - prev - 1 < k) return false;
          prev = i;
        }
      }
      return true;
    };
    return {
      slug: "check-if-all-1s-are-at-least-length-k-places-away",
      title: "Check If All 1's Are at Least Length K Places Away",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Facebook"],
      signature: {
        funcName: "kLengthApart",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "Given a binary array `nums` and an integer `k`, return `true` if **every pair of adjacent 1's** is separated by at least `k` zeros.",
        [
          { in: "nums = [1,0,0,0,1,0,0,1], k = 2", out: "true", note: "The gaps hold 3 zeros and 2 zeros, both at least 2." },
          { in: "nums = [1,0,0,1,0,1], k = 2", out: "false", note: "The last two 1's have only one zero between them." },
          { in: "nums = [1,1,1,1,1], k = 0", out: "true" },
        ],
        ["1 <= nums.length <= 100000", "0 <= k <= nums.length", "nums[i] is 0 or 1."]),
      hints: [
        "Only consecutive 1's matter — you never need to compare non-adjacent ones.",
        "Remember the index of the previous 1 as you scan.",
        "The number of zeros between index `prev` and index `i` is `i - prev - 1`.",
      ],
      editorial: explain({
        idea: "Track the position of the most recent 1. When the next 1 arrives, the zeros between them are fully determined by the two indices.",
        steps: [
          "Initialise `prev = -1` meaning \"no 1 seen yet\".",
          "For each index `i` where `nums[i] == 1`: if `prev != -1` and `i - prev - 1 < k`, return `false`.",
          "Otherwise set `prev = i` and continue.",
          "Return `true` if the scan completes.",
        ],
        why: "If every adjacent pair is far enough apart then every pair is, since gaps only grow when you skip intervening 1's. So checking adjacent pairs is both necessary and sufficient.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Using `i - prev` instead of `i - prev - 1` counts one of the endpoints as a zero and lets a too-tight pair through.",
          "The first 1 has no predecessor — comparing against `prev = -1` without the guard produces a false negative.",
          "`k = 0` must accept adjacent 1's.",
        ],
      }),
      examples: [
        { input: "[1,0,0,0,1,0,0,1]\n2", expectedOutput: "true" },
        { input: "[1,0,0,1,0,1]\n2", expectedOutput: "false" },
        { input: "[1,1,1,1,1]\n0", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nums = Array.from({ length: n }, () => (rng() < 0.3 ? 1 : 0));
        const k = ri(rng, 0, Math.min(5, n));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: bool(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef kLengthApart(nums: List[int], k: int) -> bool:\n    prev = -1\n    for i, x in enumerate(nums):\n        if x == 1:\n            if prev != -1 and i - prev - 1 < k:\n                return False\n            prev = i\n    return True`,
        javascript: `var kLengthApart = function(nums, k) {\n    let prev = -1;\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] === 1) {\n            if (prev !== -1 && i - prev - 1 < k) return false;\n            prev = i;\n        }\n    }\n    return true;\n};`,
        typescript: `function kLengthApart(nums: number[], k: number): boolean {\n    var prev = -1;\n    for (var i = 0; i < nums.length; i++) {\n        if (nums[i] === 1) {\n            if (prev !== -1 && i - prev - 1 < k) return false;\n            prev = i;\n        }\n    }\n    return true;\n}`,
        java: `public static boolean kLengthApart(int[] nums, int k) {\n    int prev = -1;\n    for (int i = 0; i < nums.length; i++) {\n        if (nums[i] == 1) {\n            if (prev != -1 && i - prev - 1 < k) return false;\n            prev = i;\n        }\n    }\n    return true;\n}`,
        cpp: `bool kLengthApart(vector<int>& nums, int k) {\n    int prev = -1;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        if (nums[i] == 1) {\n            if (prev != -1 && i - prev - 1 < k) return false;\n            prev = i;\n        }\n    }\n    return true;\n}`,
        c: `bool kLengthApart(int* nums, int numsSize, int k) {\n    int prev = -1;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] == 1) {\n            if (prev != -1 && i - prev - 1 < k) return false;\n            prev = i;\n        }\n    }\n    return true;\n}`,
        csharp: `public static bool KLengthApart(int[] nums, int k)\n{\n    int prev = -1;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        if (nums[i] == 1)\n        {\n            if (prev != -1 && i - prev - 1 < k) return false;\n            prev = i;\n        }\n    }\n    return true;\n}`,
        go: `func kLengthApart(nums []int, k int) bool {\n\tprev := -1\n\tfor i, x := range nums {\n\t\tif x == 1 {\n\t\t\tif prev != -1 && i-prev-1 < k {\n\t\t\t\treturn false\n\t\t\t}\n\t\t\tprev = i\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun kLengthApart(nums: IntArray, k: Int): Boolean {\n    var prev = -1\n    for (i in nums.indices) {\n        if (nums[i] == 1) {\n            if (prev != -1 && i - prev - 1 < k) return false\n            prev = i\n        }\n    }\n    return true\n}`,
        swift: `func kLengthApart(_ nums: [Int], _ k: Int) -> Bool {\n    var prev = -1\n    for i in 0..<nums.count {\n        if nums[i] == 1 {\n            if prev != -1 && i - prev - 1 < k { return false }\n            prev = i\n        }\n    }\n    return true\n}`,
        rust: `fn kLengthApart(nums: Vec<i32>, k: i32) -> bool {\n    let mut prev: i32 = -1;\n    for i in 0..nums.len() {\n        if nums[i] == 1 {\n            let idx = i as i32;\n            if prev != -1 && idx - prev - 1 < k {\n                return false;\n            }\n            prev = idx;\n        }\n    }\n    true\n}`,
        php: `function kLengthApart($nums, $k) {\n    $prev = -1;\n    for ($i = 0; $i < count($nums); $i++) {\n        if ($nums[$i] === 1) {\n            if ($prev !== -1 && $i - $prev - 1 < $k) return false;\n            $prev = $i;\n        }\n    }\n    return true;\n}`,
        ruby: `def kLengthApart(nums, k)\n  prev = -1\n  nums.each_with_index do |x, i|\n    if x == 1\n      return false if prev != -1 && i - prev - 1 < k\n      prev = i\n    end\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Number of Students Doing Homework at a Given Time (LC 1450) ─
  (() => {
    const ref = (start: number[], end: number[], q: number) => {
      let c = 0;
      for (let i = 0; i < start.length; i++) if (start[i] <= q && q <= end[i]) c++;
      return c;
    };
    return {
      slug: "number-of-students-doing-homework-at-a-given-time",
      title: "Number of Students Doing Homework at a Given Time",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "TCS"],
      signature: {
        funcName: "busyStudent",
        params: [
          { name: "startTime", type: "int[]" as const },
          { name: "endTime", type: "int[]" as const },
          { name: "queryTime", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "The `i`-th student starts homework at `startTime[i]` and finishes at `endTime[i]` — inclusive at both ends.\n\nReturn how many students are doing homework at time `queryTime`.",
        [
          { in: "startTime = [1,2,3], endTime = [3,2,7], queryTime = 4", out: "1", note: "Only the third student, whose window is [3,7], is busy at time 4." },
          { in: "startTime = [4], endTime = [4], queryTime = 4", out: "1", note: "The window is a single instant and it contains the query." },
          { in: "startTime = [1,1,1,1], endTime = [1,3,2,4], queryTime = 7", out: "0" },
        ],
        ["1 <= startTime.length == endTime.length <= 100", "1 <= startTime[i] <= endTime[i] <= 1000", "1 <= queryTime <= 1000"]),
      hints: [
        "The window is closed on both sides — the endpoints count.",
        "One pass with a counter is enough at these limits.",
        "The test is simply `startTime[i] <= queryTime && queryTime <= endTime[i]`.",
      ],
      editorial: explain({
        idea: "Each student is an independent closed interval; the answer is how many of them contain the query instant.",
        steps: [
          "Walk the two arrays in lockstep.",
          "Increment a counter whenever `startTime[i] <= queryTime <= endTime[i]`.",
          "Return the counter.",
        ],
        why: "The intervals do not interact, so the count is a plain sum of independent membership tests.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Using strict inequalities excludes students who start or finish exactly at `queryTime`.",
          "A difference array is overkill here but is the right tool if many queries were asked instead of one.",
        ],
      }),
      examples: [
        { input: "[1,2,3]\n[3,2,7]\n4", expectedOutput: "1" },
        { input: "[4]\n[4]\n4", expectedOutput: "1" },
        { input: "[1,1,1,1]\n[1,3,2,4]\n7", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const start: number[] = [], end: number[] = [];
        for (let i = 0; i < n; i++) {
          const s = ri(rng, 1, 20);
          start.push(s);
          end.push(s + ri(rng, 0, 8));
        }
        const q = ri(rng, 1, 26);
        return { input: `${fmtIntArr(start)}\n${fmtIntArr(end)}\n${q}`, expectedOutput: String(ref(start, end, q)) };
      },
      solutions: {
        python: `from typing import List\n\ndef busyStudent(startTime: List[int], endTime: List[int], queryTime: int) -> int:\n    count = 0\n    for s, e in zip(startTime, endTime):\n        if s <= queryTime <= e:\n            count += 1\n    return count`,
        javascript: `var busyStudent = function(startTime, endTime, queryTime) {\n    let count = 0;\n    for (let i = 0; i < startTime.length; i++) {\n        if (startTime[i] <= queryTime && queryTime <= endTime[i]) count++;\n    }\n    return count;\n};`,
        typescript: `function busyStudent(startTime: number[], endTime: number[], queryTime: number): number {\n    var count = 0;\n    for (var i = 0; i < startTime.length; i++) {\n        if (startTime[i] <= queryTime && queryTime <= endTime[i]) count++;\n    }\n    return count;\n}`,
        java: `public static int busyStudent(int[] startTime, int[] endTime, int queryTime) {\n    int count = 0;\n    for (int i = 0; i < startTime.length; i++) {\n        if (startTime[i] <= queryTime && queryTime <= endTime[i]) count++;\n    }\n    return count;\n}`,
        cpp: `int busyStudent(vector<int>& startTime, vector<int>& endTime, int queryTime) {\n    int count = 0;\n    for (int i = 0; i < (int) startTime.size(); i++) {\n        if (startTime[i] <= queryTime && queryTime <= endTime[i]) count++;\n    }\n    return count;\n}`,
        c: `int busyStudent(int* startTime, int startTimeSize, int* endTime, int endTimeSize, int queryTime) {\n    int count = 0;\n    for (int i = 0; i < startTimeSize; i++) {\n        if (startTime[i] <= queryTime && queryTime <= endTime[i]) count++;\n    }\n    return count;\n}`,
        csharp: `public static int BusyStudent(int[] startTime, int[] endTime, int queryTime)\n{\n    int count = 0;\n    for (int i = 0; i < startTime.Length; i++)\n    {\n        if (startTime[i] <= queryTime && queryTime <= endTime[i]) count++;\n    }\n    return count;\n}`,
        go: `func busyStudent(startTime []int, endTime []int, queryTime int) int {\n\tcount := 0\n\tfor i := range startTime {\n\t\tif startTime[i] <= queryTime && queryTime <= endTime[i] {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun busyStudent(startTime: IntArray, endTime: IntArray, queryTime: Int): Int {\n    var count = 0\n    for (i in startTime.indices) {\n        if (startTime[i] <= queryTime && queryTime <= endTime[i]) count++\n    }\n    return count\n}`,
        swift: `func busyStudent(_ startTime: [Int], _ endTime: [Int], _ queryTime: Int) -> Int {\n    var count = 0\n    for i in 0..<startTime.count {\n        if startTime[i] <= queryTime && queryTime <= endTime[i] { count += 1 }\n    }\n    return count\n}`,
        rust: `fn busyStudent(startTime: Vec<i32>, endTime: Vec<i32>, queryTime: i32) -> i32 {\n    let mut count = 0;\n    for i in 0..startTime.len() {\n        if startTime[i] <= queryTime && queryTime <= endTime[i] {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function busyStudent($startTime, $endTime, $queryTime) {\n    $count = 0;\n    for ($i = 0; $i < count($startTime); $i++) {\n        if ($startTime[$i] <= $queryTime && $queryTime <= $endTime[$i]) $count++;\n    }\n    return $count;\n}`,
        ruby: `def busyStudent(startTime, endTime, queryTime)\n  count = 0\n  startTime.each_with_index do |s, i|\n    count += 1 if s <= queryTime && queryTime <= endTime[i]\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Sign of the Product of an Array (LC 1822) ───────────────────
  (() => {
    const ref = (nums: number[]) => {
      let sign = 1;
      for (const x of nums) {
        if (x === 0) return 0;
        if (x < 0) sign = -sign;
      }
      return sign;
    };
    return {
      slug: "sign-of-the-product-of-an-array",
      title: "Sign of the Product of an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Amazon", "TCS"],
      signature: { funcName: "arraySign", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Let `product` be the product of every value in `nums`.\n\nReturn `1` if `product` is positive, `-1` if it is negative, and `0` if it is zero.",
        [
          { in: "nums = [-1,-2,-3,-4,3,2,1]", out: "1", note: "Four negatives multiply to a positive." },
          { in: "nums = [1,5,0,2,-3]", out: "0", note: "A single zero zeroes the whole product." },
          { in: "nums = [-1,1,-1,1,-1]", out: "-1" },
        ],
        ["1 <= nums.length <= 1000", "-100 <= nums[i] <= 100"]),
      hints: [
        "Do not compute the product — it overflows long before you need it.",
        "Only two facts matter: whether any element is zero, and how many are negative.",
        "Flip a running sign on every negative and bail out immediately on a zero.",
      ],
      editorial: explain({
        idea: "The sign of a product depends only on the parity of the negative-factor count, and any zero factor short-circuits everything.",
        steps: [
          "Start with `sign = 1`.",
          "Scan the array. On a `0`, return `0` immediately.",
          "On a negative value, flip `sign`.",
          "Return `sign` at the end.",
        ],
        why: "Multiplying by a negative number flips the sign exactly once, so after `k` negatives the sign is `(-1)^k` — which the running flip computes without ever forming the product.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Actually multiplying overflows every fixed-width integer type at these limits.",
          "Counting negatives but forgetting the zero check returns ±1 for an array containing 0.",
        ],
      }),
      examples: [
        { input: "[-1,-2,-3,-4,3,2,1]", expectedOutput: "1" },
        { input: "[1,5,0,2,-3]", expectedOutput: "0" },
        { input: "[-1,1,-1,1,-1]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => (rng() < 0.12 ? 0 : ri(rng, -100, 100)));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef arraySign(nums: List[int]) -> int:\n    sign = 1\n    for x in nums:\n        if x == 0:\n            return 0\n        if x < 0:\n            sign = -sign\n    return sign`,
        javascript: `var arraySign = function(nums) {\n    let sign = 1;\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] === 0) return 0;\n        if (nums[i] < 0) sign = -sign;\n    }\n    return sign;\n};`,
        typescript: `function arraySign(nums: number[]): number {\n    var sign = 1;\n    for (var i = 0; i < nums.length; i++) {\n        if (nums[i] === 0) return 0;\n        if (nums[i] < 0) sign = -sign;\n    }\n    return sign;\n}`,
        java: `public static int arraySign(int[] nums) {\n    int sign = 1;\n    for (int x : nums) {\n        if (x == 0) return 0;\n        if (x < 0) sign = -sign;\n    }\n    return sign;\n}`,
        cpp: `int arraySign(vector<int>& nums) {\n    int sign = 1;\n    for (int x : nums) {\n        if (x == 0) return 0;\n        if (x < 0) sign = -sign;\n    }\n    return sign;\n}`,
        c: `int arraySign(int* nums, int numsSize) {\n    int sign = 1;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] == 0) return 0;\n        if (nums[i] < 0) sign = -sign;\n    }\n    return sign;\n}`,
        csharp: `public static int ArraySign(int[] nums)\n{\n    int sign = 1;\n    foreach (int x in nums)\n    {\n        if (x == 0) return 0;\n        if (x < 0) sign = -sign;\n    }\n    return sign;\n}`,
        go: `func arraySign(nums []int) int {\n\tsign := 1\n\tfor _, x := range nums {\n\t\tif x == 0 {\n\t\t\treturn 0\n\t\t}\n\t\tif x < 0 {\n\t\t\tsign = -sign\n\t\t}\n\t}\n\treturn sign\n}`,
        kotlin: `fun arraySign(nums: IntArray): Int {\n    var sign = 1\n    for (x in nums) {\n        if (x == 0) return 0\n        if (x < 0) sign = -sign\n    }\n    return sign\n}`,
        swift: `func arraySign(_ nums: [Int]) -> Int {\n    var sign = 1\n    for x in nums {\n        if x == 0 { return 0 }\n        if x < 0 { sign = -sign }\n    }\n    return sign\n}`,
        rust: `fn arraySign(nums: Vec<i32>) -> i32 {\n    let mut sign = 1;\n    for &x in nums.iter() {\n        if x == 0 {\n            return 0;\n        }\n        if x < 0 {\n            sign = -sign;\n        }\n    }\n    sign\n}`,
        php: `function arraySign($nums) {\n    $sign = 1;\n    foreach ($nums as $x) {\n        if ($x === 0) return 0;\n        if ($x < 0) $sign = -$sign;\n    }\n    return $sign;\n}`,
        ruby: `def arraySign(nums)\n  sign = 1\n  nums.each do |x|\n    return 0 if x == 0\n    sign = -sign if x < 0\n  end\n  sign\nend`,
      },
    };
  })(),

  // ── Minimum Operations to Make the Array Increasing (LC 1827) ───
  (() => {
    const ref = (nums: number[]) => {
      let ops = 0, prev = nums[0];
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] <= prev) { ops += prev + 1 - nums[i]; prev = prev + 1; }
        else prev = nums[i];
      }
      return ops;
    };
    return {
      slug: "minimum-operations-to-make-the-array-increasing",
      title: "Minimum Operations to Make the Array Increasing",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Amazon", "Microsoft"],
      signature: { funcName: "minOperations", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums`. In one operation you may increment any single element by `1`.\n\nReturn the **minimum number of operations** needed to make `nums` **strictly increasing** — that is, `nums[i] < nums[i+1]` for every `i`.",
        [
          { in: "nums = [1,1,1]", out: "3", note: "Raise the array to [1,2,3]: one operation on the second element and two on the third." },
          { in: "nums = [1,5,2,4,1]", out: "14" },
          { in: "nums = [8]", out: "0", note: "A single element is already strictly increasing." },
        ],
        ["1 <= nums.length <= 5000", "1 <= nums[i] <= 10000"]),
      hints: [
        "You can only increase values, so the first element never changes.",
        "Process left to right: each element must end strictly above the one before it.",
        "Raise an element to exactly `prev + 1` — never higher, since extra height only costs more later.",
      ],
      editorial: explain({
        idea: "Sweep left to right and raise each element to the smallest legal value. Because operations only increase values, leaving an element as low as the rules allow is never worse for the elements that follow.",
        steps: [
          "Keep `prev`, the (possibly raised) value of the previous element, starting at `nums[0]`.",
          "For each later element: if `nums[i] > prev`, it is already fine — set `prev = nums[i]`.",
          "Otherwise add `prev + 1 - nums[i]` operations and set `prev = prev + 1`.",
          "Return the accumulated count.",
        ],
        why: "An exchange argument: if an optimal solution raised some element above `prev + 1`, lowering it to `prev + 1` keeps the array strictly increasing at that position and can only reduce the work required at every later position. So the greedy choice is optimal.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Comparing against the *original* `nums[i-1]` instead of the raised `prev` undercounts on runs like `[1,1,1]`.",
          "Raising to `prev` rather than `prev + 1` yields a non-decreasing array, not a strictly increasing one.",
          "The running total can exceed 32 bits at the upper limits in some languages — accumulate in 64 bits.",
        ],
      }),
      examples: [
        { input: "[1,1,1]", expectedOutput: "3" },
        { input: "[1,5,2,4,1]", expectedOutput: "14" },
        { input: "[8]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => ri(rng, 1, rng() < 0.5 ? 10 : 500));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minOperations(nums: List[int]) -> int:\n    ops = 0\n    prev = nums[0]\n    for i in range(1, len(nums)):\n        if nums[i] <= prev:\n            ops += prev + 1 - nums[i]\n            prev = prev + 1\n        else:\n            prev = nums[i]\n    return ops`,
        javascript: `var minOperations = function(nums) {\n    let ops = 0, prev = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        if (nums[i] <= prev) {\n            ops += prev + 1 - nums[i];\n            prev = prev + 1;\n        } else {\n            prev = nums[i];\n        }\n    }\n    return ops;\n};`,
        typescript: `function minOperations(nums: number[]): number {\n    var ops = 0, prev = nums[0];\n    for (var i = 1; i < nums.length; i++) {\n        if (nums[i] <= prev) {\n            ops += prev + 1 - nums[i];\n            prev = prev + 1;\n        } else {\n            prev = nums[i];\n        }\n    }\n    return ops;\n}`,
        java: `public static int minOperations(int[] nums) {\n    long ops = 0;\n    int prev = nums[0];\n    for (int i = 1; i < nums.length; i++) {\n        if (nums[i] <= prev) {\n            ops += (long) prev + 1 - nums[i];\n            prev = prev + 1;\n        } else {\n            prev = nums[i];\n        }\n    }\n    return (int) ops;\n}`,
        cpp: `int minOperations(vector<int>& nums) {\n    long long ops = 0;\n    int prev = nums[0];\n    for (int i = 1; i < (int) nums.size(); i++) {\n        if (nums[i] <= prev) {\n            ops += (long long) prev + 1 - nums[i];\n            prev = prev + 1;\n        } else {\n            prev = nums[i];\n        }\n    }\n    return (int) ops;\n}`,
        c: `int minOperations(int* nums, int numsSize) {\n    long long ops = 0;\n    int prev = nums[0];\n    for (int i = 1; i < numsSize; i++) {\n        if (nums[i] <= prev) {\n            ops += (long long) prev + 1 - nums[i];\n            prev = prev + 1;\n        } else {\n            prev = nums[i];\n        }\n    }\n    return (int) ops;\n}`,
        csharp: `public static int MinOperations(int[] nums)\n{\n    long ops = 0;\n    int prev = nums[0];\n    for (int i = 1; i < nums.Length; i++)\n    {\n        if (nums[i] <= prev)\n        {\n            ops += (long) prev + 1 - nums[i];\n            prev = prev + 1;\n        }\n        else\n        {\n            prev = nums[i];\n        }\n    }\n    return (int) ops;\n}`,
        go: `func minOperations(nums []int) int {\n\tops := 0\n\tprev := nums[0]\n\tfor i := 1; i < len(nums); i++ {\n\t\tif nums[i] <= prev {\n\t\t\tops += prev + 1 - nums[i]\n\t\t\tprev = prev + 1\n\t\t} else {\n\t\t\tprev = nums[i]\n\t\t}\n\t}\n\treturn ops\n}`,
        kotlin: `fun minOperations(nums: IntArray): Int {\n    var ops = 0L\n    var prev = nums[0]\n    for (i in 1 until nums.size) {\n        if (nums[i] <= prev) {\n            ops += (prev + 1 - nums[i]).toLong()\n            prev += 1\n        } else {\n            prev = nums[i]\n        }\n    }\n    return ops.toInt()\n}`,
        swift: `func minOperations(_ nums: [Int]) -> Int {\n    var ops = 0\n    var prev = nums[0]\n    for i in 1..<max(nums.count, 1) {\n        if nums[i] <= prev {\n            ops += prev + 1 - nums[i]\n            prev += 1\n        } else {\n            prev = nums[i]\n        }\n    }\n    return ops\n}`,
        rust: `fn minOperations(nums: Vec<i32>) -> i32 {\n    let mut ops: i64 = 0;\n    let mut prev = nums[0];\n    for i in 1..nums.len() {\n        if nums[i] <= prev {\n            ops += (prev + 1 - nums[i]) as i64;\n            prev += 1;\n        } else {\n            prev = nums[i];\n        }\n    }\n    ops as i32\n}`,
        php: `function minOperations($nums) {\n    $ops = 0;\n    $prev = $nums[0];\n    for ($i = 1; $i < count($nums); $i++) {\n        if ($nums[$i] <= $prev) {\n            $ops += $prev + 1 - $nums[$i];\n            $prev = $prev + 1;\n        } else {\n            $prev = $nums[$i];\n        }\n    }\n    return $ops;\n}`,
        ruby: `def minOperations(nums)\n  ops = 0\n  prev = nums[0]\n  (1...nums.length).each do |i|\n    if nums[i] <= prev\n      ops += prev + 1 - nums[i]\n      prev += 1\n    else\n      prev = nums[i]\n    end\n  end\n  ops\nend`,
      },
    };
  })(),

  // ── Minimum Distance to the Target Element (LC 1848) ────────────
  (() => {
    const ref = (nums: number[], target: number, start: number) => {
      let best = -1;
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] === target) {
          const d = Math.abs(i - start);
          if (best === -1 || d < best) best = d;
        }
      }
      return best;
    };
    return {
      slug: "minimum-distance-to-the-target-element",
      title: "Minimum Distance to the Target Element",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Infosys"],
      signature: {
        funcName: "getMinDistance",
        params: [
          { name: "nums", type: "int[]" as const },
          { name: "target", type: "int" as const },
          { name: "start", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "Given an integer array `nums`, an integer `target` and an integer `start`, find the index `i` such that `nums[i] == target` and `|i - start|` is as small as possible.\n\nReturn that minimum `|i - start|`. At least one occurrence of `target` is guaranteed.",
        [
          { in: "nums = [1,2,3,4,5], target = 5, start = 3", out: "1", note: "5 sits at index 4, and |4 - 3| = 1." },
          { in: "nums = [1], target = 1, start = 0", out: "0" },
          { in: "nums = [1,1,1,1,1,1,1,1,1,1], target = 1, start = 0", out: "0", note: "Index 0 already holds the target." },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 10000", "0 <= start < nums.length", "target appears at least once in nums."]),
      hints: [
        "The array is not sorted, so binary search does not apply.",
        "A single scan comparing each matching index against `start` is enough at these limits.",
        "Alternatively expand outward from `start` and stop at the first hit.",
      ],
      editorial: explain({
        idea: "Every occurrence of `target` is a candidate; the answer is the smallest absolute index distance among them.",
        steps: [
          "Scan the array once.",
          "Whenever `nums[i] == target`, compute `|i - start|` and keep the minimum seen.",
          "Return that minimum.",
        ],
        why: "The problem guarantees at least one occurrence, so the minimum is well defined, and scanning considers every candidate exactly once.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Returning on the first match found while scanning left to right gives the leftmost occurrence, not the nearest one.",
          "The outward-expansion variant must check both `start - d` and `start + d` at each step and guard both against going out of bounds.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]\n5\n3", expectedOutput: "1" },
        { input: "[1]\n1\n0", expectedOutput: "0" },
        { input: "[1,1,1,1,1,1,1,1,1,1]\n1\n0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => ri(rng, 1, 8));
        const target = nums[ri(rng, 0, n - 1)];
        const start = ri(rng, 0, n - 1);
        return { input: `${fmtIntArr(nums)}\n${target}\n${start}`, expectedOutput: String(ref(nums, target, start)) };
      },
      solutions: {
        python: `from typing import List\n\ndef getMinDistance(nums: List[int], target: int, start: int) -> int:\n    best = -1\n    for i, x in enumerate(nums):\n        if x == target:\n            d = abs(i - start)\n            if best == -1 or d < best:\n                best = d\n    return best`,
        javascript: `var getMinDistance = function(nums, target, start) {\n    let best = -1;\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] === target) {\n            const d = Math.abs(i - start);\n            if (best === -1 || d < best) best = d;\n        }\n    }\n    return best;\n};`,
        typescript: `function getMinDistance(nums: number[], target: number, start: number): number {\n    var best = -1;\n    for (var i = 0; i < nums.length; i++) {\n        if (nums[i] === target) {\n            var d = Math.abs(i - start);\n            if (best === -1 || d < best) best = d;\n        }\n    }\n    return best;\n}`,
        java: `public static int getMinDistance(int[] nums, int target, int start) {\n    int best = -1;\n    for (int i = 0; i < nums.length; i++) {\n        if (nums[i] == target) {\n            int d = Math.abs(i - start);\n            if (best == -1 || d < best) best = d;\n        }\n    }\n    return best;\n}`,
        cpp: `int getMinDistance(vector<int>& nums, int target, int start) {\n    int best = -1;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        if (nums[i] == target) {\n            int d = abs(i - start);\n            if (best == -1 || d < best) best = d;\n        }\n    }\n    return best;\n}`,
        c: `int getMinDistance(int* nums, int numsSize, int target, int start) {\n    int best = -1;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] == target) {\n            int d = i - start;\n            if (d < 0) d = -d;\n            if (best == -1 || d < best) best = d;\n        }\n    }\n    return best;\n}`,
        csharp: `public static int GetMinDistance(int[] nums, int target, int start)\n{\n    int best = -1;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        if (nums[i] == target)\n        {\n            int d = Math.Abs(i - start);\n            if (best == -1 || d < best) best = d;\n        }\n    }\n    return best;\n}`,
        go: `func getMinDistance(nums []int, target int, start int) int {\n\tbest := -1\n\tfor i, x := range nums {\n\t\tif x == target {\n\t\t\td := i - start\n\t\t\tif d < 0 {\n\t\t\t\td = -d\n\t\t\t}\n\t\t\tif best == -1 || d < best {\n\t\t\t\tbest = d\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun getMinDistance(nums: IntArray, target: Int, start: Int): Int {\n    var best = -1\n    for (i in nums.indices) {\n        if (nums[i] == target) {\n            val d = Math.abs(i - start)\n            if (best == -1 || d < best) best = d\n        }\n    }\n    return best\n}`,
        swift: `func getMinDistance(_ nums: [Int], _ target: Int, _ start: Int) -> Int {\n    var best = -1\n    for i in 0..<nums.count {\n        if nums[i] == target {\n            let d = abs(i - start)\n            if best == -1 || d < best { best = d }\n        }\n    }\n    return best\n}`,
        rust: `fn getMinDistance(nums: Vec<i32>, target: i32, start: i32) -> i32 {\n    let mut best = -1;\n    for i in 0..nums.len() {\n        if nums[i] == target {\n            let d = (i as i32 - start).abs();\n            if best == -1 || d < best {\n                best = d;\n            }\n        }\n    }\n    best\n}`,
        php: `function getMinDistance($nums, $target, $start) {\n    $best = -1;\n    for ($i = 0; $i < count($nums); $i++) {\n        if ($nums[$i] === $target) {\n            $d = abs($i - $start);\n            if ($best === -1 || $d < $best) $best = $d;\n        }\n    }\n    return $best;\n}`,
        ruby: `def getMinDistance(nums, target, start)\n  best = -1\n  nums.each_with_index do |x, i|\n    next unless x == target\n    d = (i - start).abs\n    best = d if best == -1 || d < best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Maximum Population Year (LC 1854) ───────────────────────────
  (() => {
    const ref = (logs: number[][]) => {
      const delta = new Array(2101).fill(0);
      for (const [b, d] of logs) { delta[b]++; delta[d]--; }
      let alive = 0, best = 0, year = 1950;
      for (let y = 1950; y <= 2050; y++) {
        alive += delta[y];
        if (alive > best) { best = alive; year = y; }
      }
      return year;
    };
    return {
      slug: "maximum-population-year",
      title: "Maximum Population Year",
      difficulty: "EASY" as const,
      tags: ["Array", "Prefix Sum", "Counting", "Amazon"],
      signature: { funcName: "maximumPopulation", params: [{ name: "logs", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given a 2D array `logs` where `logs[i] = [birth, death]` records one person's birth and death years.\n\nA person is counted as alive during every year `y` with `birth <= y < death` — the birth year counts, the death year does not.\n\nReturn the **earliest** year with the maximum population.",
        [
          { in: "logs = [[1993,1999],[2000,2010]]", out: "1993", note: "Population is 1 in 1993-1998 and again in 2000-2009; 1993 is earliest." },
          { in: "logs = [[1950,1961],[1960,1971],[1970,1981]]", out: "1960", note: "1960 and 1970 both have 2 people alive; 1960 comes first." },
          { in: "logs = [[2008,2026]]", out: "2008" },
        ],
        ["1 <= logs.length <= 100", "1950 <= birth < death <= 2050"]),
      hints: [
        "Counting every year for every person is fine at these limits, but there is a cleaner way.",
        "Record `+1` at the birth year and `-1` at the death year in a difference array.",
        "A running prefix sum over the years then gives the live population in each year.",
      ],
      editorial: explain({
        idea: "A birth/death pair is an interval. A difference array turns \"add 1 across a range\" into two point updates, after which one prefix sweep reveals the population of every year.",
        steps: [
          "Allocate a `delta` array indexed by year.",
          "For each log, do `delta[birth] += 1` and `delta[death] -= 1`.",
          "Sweep years 1950 to 2050 accumulating `alive += delta[y]`.",
          "Track the maximum and, because the sweep runs forward and only a strict improvement updates the answer, the earliest year that attains it.",
        ],
        why: "The prefix sum of the difference array at year `y` counts exactly the intervals covering `y`. The half-open convention `[birth, death)` matches the `-1` being placed at `death` rather than `death + 1`.",
        time: "O(n + Y) where Y is the year range",
        space: "O(Y)",
        pitfalls: [
          "Decrementing at `death + 1` counts people as alive in their death year.",
          "Using `>=` when updating the best year returns the latest tie rather than the earliest.",
          "The array must span up to 2050 inclusive — sizing it to 2050 exactly and writing `delta[2050]` overflows a 2050-length array.",
        ],
      }),
      examples: [
        { input: "[[1993,1999],[2000,2010]]", expectedOutput: "1993" },
        { input: "[[1950,1961],[1960,1971],[1970,1981]]", expectedOutput: "1960" },
        { input: "[[2008,2026]]", expectedOutput: "2008" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const logs: number[][] = [];
        for (let i = 0; i < n; i++) {
          const b = ri(rng, 1950, 2049);
          const d = ri(rng, b + 1, 2050);
          logs.push([b, d]);
        }
        return { input: fmtIntMat(logs), expectedOutput: String(ref(logs)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumPopulation(logs: List[List[int]]) -> int:\n    delta = [0] * 2101\n    for b, d in logs:\n        delta[b] += 1\n        delta[d] -= 1\n    alive = 0\n    best = 0\n    year = 1950\n    for y in range(1950, 2051):\n        alive += delta[y]\n        if alive > best:\n            best = alive\n            year = y\n    return year`,
        javascript: `var maximumPopulation = function(logs) {\n    const delta = new Array(2101).fill(0);\n    for (let i = 0; i < logs.length; i++) {\n        delta[logs[i][0]]++;\n        delta[logs[i][1]]--;\n    }\n    let alive = 0, best = 0, year = 1950;\n    for (let y = 1950; y <= 2050; y++) {\n        alive += delta[y];\n        if (alive > best) { best = alive; year = y; }\n    }\n    return year;\n};`,
        typescript: `function maximumPopulation(logs: number[][]): number {\n    var delta: number[] = [];\n    for (var k = 0; k < 2101; k++) delta.push(0);\n    for (var i = 0; i < logs.length; i++) {\n        delta[logs[i][0]]++;\n        delta[logs[i][1]]--;\n    }\n    var alive = 0, best = 0, year = 1950;\n    for (var y = 1950; y <= 2050; y++) {\n        alive += delta[y];\n        if (alive > best) { best = alive; year = y; }\n    }\n    return year;\n}`,
        java: `public static int maximumPopulation(int[][] logs) {\n    int[] delta = new int[2101];\n    for (int[] l : logs) {\n        delta[l[0]]++;\n        delta[l[1]]--;\n    }\n    int alive = 0, best = 0, year = 1950;\n    for (int y = 1950; y <= 2050; y++) {\n        alive += delta[y];\n        if (alive > best) { best = alive; year = y; }\n    }\n    return year;\n}`,
        cpp: `int maximumPopulation(vector<vector<int>>& logs) {\n    vector<int> delta(2101, 0);\n    for (auto& l : logs) {\n        delta[l[0]]++;\n        delta[l[1]]--;\n    }\n    int alive = 0, best = 0, year = 1950;\n    for (int y = 1950; y <= 2050; y++) {\n        alive += delta[y];\n        if (alive > best) { best = alive; year = y; }\n    }\n    return year;\n}`,
        c: `int maximumPopulation(int** logs, int logsSize, int* logsColSize) {\n    int delta[2101];\n    for (int i = 0; i < 2101; i++) delta[i] = 0;\n    for (int i = 0; i < logsSize; i++) {\n        delta[logs[i][0]]++;\n        delta[logs[i][1]]--;\n    }\n    int alive = 0, best = 0, year = 1950;\n    for (int y = 1950; y <= 2050; y++) {\n        alive += delta[y];\n        if (alive > best) { best = alive; year = y; }\n    }\n    return year;\n}`,
        csharp: `public static int MaximumPopulation(int[][] logs)\n{\n    int[] delta = new int[2101];\n    foreach (int[] l in logs)\n    {\n        delta[l[0]]++;\n        delta[l[1]]--;\n    }\n    int alive = 0, best = 0, year = 1950;\n    for (int y = 1950; y <= 2050; y++)\n    {\n        alive += delta[y];\n        if (alive > best) { best = alive; year = y; }\n    }\n    return year;\n}`,
        go: `func maximumPopulation(logs [][]int) int {\n\tdelta := make([]int, 2101)\n\tfor _, l := range logs {\n\t\tdelta[l[0]]++\n\t\tdelta[l[1]]--\n\t}\n\talive, best, year := 0, 0, 1950\n\tfor y := 1950; y <= 2050; y++ {\n\t\talive += delta[y]\n\t\tif alive > best {\n\t\t\tbest = alive\n\t\t\tyear = y\n\t\t}\n\t}\n\treturn year\n}`,
        kotlin: `fun maximumPopulation(logs: Array<IntArray>): Int {\n    val delta = IntArray(2101)\n    for (l in logs) {\n        delta[l[0]]++\n        delta[l[1]]--\n    }\n    var alive = 0\n    var best = 0\n    var year = 1950\n    for (y in 1950..2050) {\n        alive += delta[y]\n        if (alive > best) {\n            best = alive\n            year = y\n        }\n    }\n    return year\n}`,
        swift: `func maximumPopulation(_ logs: [[Int]]) -> Int {\n    var delta = [Int](repeating: 0, count: 2101)\n    for l in logs {\n        delta[l[0]] += 1\n        delta[l[1]] -= 1\n    }\n    var alive = 0\n    var best = 0\n    var year = 1950\n    for y in 1950...2050 {\n        alive += delta[y]\n        if alive > best {\n            best = alive\n            year = y\n        }\n    }\n    return year\n}`,
        rust: `fn maximumPopulation(logs: Vec<Vec<i32>>) -> i32 {\n    let mut delta = vec![0i32; 2101];\n    for l in logs.iter() {\n        delta[l[0] as usize] += 1;\n        delta[l[1] as usize] -= 1;\n    }\n    let mut alive = 0;\n    let mut best = 0;\n    let mut year = 1950;\n    for y in 1950..=2050 {\n        alive += delta[y as usize];\n        if alive > best {\n            best = alive;\n            year = y;\n        }\n    }\n    year\n}`,
        php: `function maximumPopulation($logs) {\n    $delta = array_fill(0, 2101, 0);\n    foreach ($logs as $l) {\n        $delta[$l[0]]++;\n        $delta[$l[1]]--;\n    }\n    $alive = 0; $best = 0; $year = 1950;\n    for ($y = 1950; $y <= 2050; $y++) {\n        $alive += $delta[$y];\n        if ($alive > $best) { $best = $alive; $year = $y; }\n    }\n    return $year;\n}`,
        ruby: `def maximumPopulation(logs)\n  delta = Array.new(2101, 0)\n  logs.each do |l|\n    delta[l[0]] += 1\n    delta[l[1]] -= 1\n  end\n  alive = 0\n  best = 0\n  year = 1950\n  (1950..2050).each do |y|\n    alive += delta[y]\n    if alive > best\n      best = alive\n      year = y\n    end\n  end\n  year\nend`,
      },
    };
  })(),

  // ── Maximum Difference Between Increasing Elements (LC 2016) ────
  (() => {
    const ref = (nums: number[]) => {
      let best = -1, lo = nums[0];
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] > lo) { const d = nums[i] - lo; if (d > best) best = d; }
        else lo = nums[i];
      }
      return best;
    };
    return {
      slug: "maximum-difference-between-increasing-elements",
      title: "Maximum Difference Between Increasing Elements",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Google"],
      signature: { funcName: "maximumDifference", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given a 0-indexed array `nums`, find indices `i < j` with `nums[i] < nums[j]` that maximise `nums[j] - nums[i]`.\n\nReturn that maximum difference, or `-1` if no such pair exists.",
        [
          { in: "nums = [7,1,5,4]", out: "4", note: "i = 1 and j = 2 give 5 - 1 = 4." },
          { in: "nums = [9,4,3,2]", out: "-1", note: "The array is strictly decreasing, so no valid pair exists." },
          { in: "nums = [1,5,2,10]", out: "9" },
        ],
        ["2 <= nums.length <= 1000", "1 <= nums[i] <= 1000000000"]),
      hints: [
        "For a fixed `j`, the best partner is the smallest value anywhere to its left.",
        "Sweep left to right keeping the running minimum.",
        "Only update the answer when the current value strictly exceeds that minimum.",
      ],
      editorial: explain({
        idea: "This is the \"best time to buy and sell stock\" scan with one extra rule: the profit must be strictly positive, otherwise the answer is `-1`.",
        steps: [
          "Set `lo = nums[0]` and `best = -1`.",
          "For each later element: if it exceeds `lo`, update `best` with `nums[i] - lo`.",
          "Otherwise it is a new minimum, so set `lo = nums[i]`.",
          "Return `best`.",
        ],
        why: "Fixing `j` and minimising `nums[i]` over `i < j` maximises the difference for that `j`, and the running minimum supplies exactly that value in O(1). Sweeping every `j` therefore covers the global optimum.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Initialising `best` to `0` hides the \"no valid pair\" case, which must answer `-1`.",
          "Updating `lo` before testing the current element allows the degenerate pair `i == j`.",
          "The requirement is `nums[i] < nums[j]` strictly — equal values do not count.",
        ],
      }),
      examples: [
        { input: "[7,1,5,4]", expectedOutput: "4" },
        { input: "[9,4,3,2]", expectedOutput: "-1" },
        { input: "[1,5,2,10]", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 30);
        let nums = Array.from({ length: n }, () => ri(rng, 1, rng() < 0.5 ? 20 : 100000));
        if (rng() < 0.2) nums = nums.sort((a, b) => b - a);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumDifference(nums: List[int]) -> int:\n    best = -1\n    lo = nums[0]\n    for i in range(1, len(nums)):\n        if nums[i] > lo:\n            if nums[i] - lo > best:\n                best = nums[i] - lo\n        else:\n            lo = nums[i]\n    return best`,
        javascript: `var maximumDifference = function(nums) {\n    let best = -1, lo = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        if (nums[i] > lo) {\n            const d = nums[i] - lo;\n            if (d > best) best = d;\n        } else {\n            lo = nums[i];\n        }\n    }\n    return best;\n};`,
        typescript: `function maximumDifference(nums: number[]): number {\n    var best = -1, lo = nums[0];\n    for (var i = 1; i < nums.length; i++) {\n        if (nums[i] > lo) {\n            var d = nums[i] - lo;\n            if (d > best) best = d;\n        } else {\n            lo = nums[i];\n        }\n    }\n    return best;\n}`,
        java: `public static int maximumDifference(int[] nums) {\n    int best = -1, lo = nums[0];\n    for (int i = 1; i < nums.length; i++) {\n        if (nums[i] > lo) {\n            int d = nums[i] - lo;\n            if (d > best) best = d;\n        } else {\n            lo = nums[i];\n        }\n    }\n    return best;\n}`,
        cpp: `int maximumDifference(vector<int>& nums) {\n    int best = -1, lo = nums[0];\n    for (int i = 1; i < (int) nums.size(); i++) {\n        if (nums[i] > lo) {\n            int d = nums[i] - lo;\n            if (d > best) best = d;\n        } else {\n            lo = nums[i];\n        }\n    }\n    return best;\n}`,
        c: `int maximumDifference(int* nums, int numsSize) {\n    int best = -1, lo = nums[0];\n    for (int i = 1; i < numsSize; i++) {\n        if (nums[i] > lo) {\n            int d = nums[i] - lo;\n            if (d > best) best = d;\n        } else {\n            lo = nums[i];\n        }\n    }\n    return best;\n}`,
        csharp: `public static int MaximumDifference(int[] nums)\n{\n    int best = -1, lo = nums[0];\n    for (int i = 1; i < nums.Length; i++)\n    {\n        if (nums[i] > lo)\n        {\n            int d = nums[i] - lo;\n            if (d > best) best = d;\n        }\n        else\n        {\n            lo = nums[i];\n        }\n    }\n    return best;\n}`,
        go: `func maximumDifference(nums []int) int {\n\tbest, lo := -1, nums[0]\n\tfor i := 1; i < len(nums); i++ {\n\t\tif nums[i] > lo {\n\t\t\tif d := nums[i] - lo; d > best {\n\t\t\t\tbest = d\n\t\t\t}\n\t\t} else {\n\t\t\tlo = nums[i]\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maximumDifference(nums: IntArray): Int {\n    var best = -1\n    var lo = nums[0]\n    for (i in 1 until nums.size) {\n        if (nums[i] > lo) {\n            val d = nums[i] - lo\n            if (d > best) best = d\n        } else {\n            lo = nums[i]\n        }\n    }\n    return best\n}`,
        swift: `func maximumDifference(_ nums: [Int]) -> Int {\n    var best = -1\n    var lo = nums[0]\n    for i in 1..<nums.count {\n        if nums[i] > lo {\n            let d = nums[i] - lo\n            if d > best { best = d }\n        } else {\n            lo = nums[i]\n        }\n    }\n    return best\n}`,
        rust: `fn maximumDifference(nums: Vec<i32>) -> i32 {\n    let mut best = -1;\n    let mut lo = nums[0];\n    for i in 1..nums.len() {\n        if nums[i] > lo {\n            let d = nums[i] - lo;\n            if d > best {\n                best = d;\n            }\n        } else {\n            lo = nums[i];\n        }\n    }\n    best\n}`,
        php: `function maximumDifference($nums) {\n    $best = -1;\n    $lo = $nums[0];\n    for ($i = 1; $i < count($nums); $i++) {\n        if ($nums[$i] > $lo) {\n            $d = $nums[$i] - $lo;\n            if ($d > $best) $best = $d;\n        } else {\n            $lo = $nums[$i];\n        }\n    }\n    return $best;\n}`,
        ruby: `def maximumDifference(nums)\n  best = -1\n  lo = nums[0]\n  (1...nums.length).each do |i|\n    if nums[i] > lo\n      d = nums[i] - lo\n      best = d if d > best\n    else\n      lo = nums[i]\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Find Original Array From Doubled Array (LC 2007) ────────────
  (() => {
    const ref = (changed: number[]) => {
      if (changed.length % 2 !== 0) return [];
      const s = [...changed].sort((a, b) => a - b);
      const count: Record<string, number> = {};
      for (const x of s) count[String(x)] = (count[String(x)] || 0) + 1;
      const out: number[] = [];
      for (const x of s) {
        const kx = String(x);
        if ((count[kx] || 0) === 0) continue;
        const k2 = String(x * 2);
        if ((count[k2] || 0) === 0 || (x === 0 && count[kx] < 2)) return [];
        count[kx]--;
        count[k2]--;
        out.push(x);
      }
      return out;
    };
    return {
      slug: "find-original-array-from-doubled-array",
      title: "Find Original Array From Doubled Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Sorting", "Hash Table", "Amazon", "Google"],
      signature: { funcName: "findOriginalArray", params: [{ name: "changed", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "An array `changed` is a **doubled array** if it was built from some array `original` by appending twice the value of every element and then shuffling the result.\n\nGiven `changed`, return `original` sorted in **ascending order**. If `changed` is not a doubled array, return an empty array.",
        [
          { in: "changed = [1,3,4,2,6,8]", out: "[1,3,4]", note: "The doubles 2, 6 and 8 pair off with 1, 3 and 4." },
          { in: "changed = [6,3,0,1]", out: "[]", note: "No valid original array produces this multiset." },
          { in: "changed = [1]", out: "[]", note: "An odd length can never be a doubled array." },
        ],
        ["1 <= changed.length <= 100000", "0 <= changed[i] <= 100000"]),
      hints: [
        "An odd length is an immediate rejection.",
        "Process values in increasing order: the smallest remaining value can only ever be an *original*, never a double.",
        "Zero is the awkward case — it is its own double, so it consumes two zeros per original.",
      ],
      editorial: explain({
        idea: "Sort ascending and match greedily. The smallest unmatched value cannot be anyone's double (that would require a smaller positive value still in play), so it must belong to `original` and be paired with its double.",
        steps: [
          "Reject an odd-length input outright.",
          "Sort a copy and build a frequency map.",
          "Walk the sorted values. Skip any already consumed (frequency 0).",
          "Otherwise decrement the value and its double; if the double is unavailable, the input is invalid. Record the value in the answer.",
          "Return the collected values — they come out ascending because the walk is ascending.",
        ],
        why: "In a valid doubled array, the minimum element must be an original: its half would be a smaller element, contradicting minimality (for positive values). Consuming it and its double leaves a strictly smaller valid instance, so induction carries the greedy through.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "`0` doubles to itself, so a run of zeros must be even and each original consumes **two** of them.",
          "Iterating over the map's keys in hash order instead of sorted order breaks the greedy argument.",
          "Decrementing the double before checking it exists can produce negative counts that silently pass later tests.",
        ],
      }),
      examples: [
        { input: "[1,3,4,2,6,8]", expectedOutput: "[1,3,4]" },
        { input: "[6,3,0,1]", expectedOutput: "[]" },
        { input: "[1]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        if (rng() < 0.55) {
          const k = ri(rng, 1, 10);
          const original = Array.from({ length: k }, () => ri(rng, 0, 40));
          const changed = [...original, ...original.map((x) => x * 2)];
          shuffle(rng, changed);
          return { input: fmtIntArr(changed), expectedOutput: fmtIntArr(ref(changed)) };
        }
        const n = ri(rng, 1, 14);
        const changed = Array.from({ length: n }, () => ri(rng, 0, 20));
        return { input: fmtIntArr(changed), expectedOutput: fmtIntArr(ref(changed)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findOriginalArray(changed: List[int]) -> List[int]:\n    if len(changed) % 2 != 0:\n        return []\n    s = sorted(changed)\n    count = {}\n    for x in s:\n        count[x] = count.get(x, 0) + 1\n    out = []\n    for x in s:\n        if count.get(x, 0) == 0:\n            continue\n        if x == 0:\n            if count[x] < 2:\n                return []\n            count[x] -= 2\n            out.append(0)\n            continue\n        if count.get(x * 2, 0) == 0:\n            return []\n        count[x] -= 1\n        count[x * 2] -= 1\n        out.append(x)\n    return out`,
        javascript: `var findOriginalArray = function(changed) {\n    if (changed.length % 2 !== 0) return [];\n    const s = changed.slice().sort(function(a, b) { return a - b; });\n    const count = {};\n    for (let i = 0; i < s.length; i++) {\n        const k = String(s[i]);\n        count[k] = (count[k] || 0) + 1;\n    }\n    const out = [];\n    for (let i = 0; i < s.length; i++) {\n        const x = s[i];\n        const kx = String(x);\n        if ((count[kx] || 0) === 0) continue;\n        if (x === 0) {\n            if (count[kx] < 2) return [];\n            count[kx] -= 2;\n            out.push(0);\n            continue;\n        }\n        const k2 = String(x * 2);\n        if ((count[k2] || 0) === 0) return [];\n        count[kx]--;\n        count[k2]--;\n        out.push(x);\n    }\n    return out;\n};`,
        typescript: `function findOriginalArray(changed: number[]): number[] {\n    if (changed.length % 2 !== 0) return [];\n    var s = changed.slice().sort(function(a, b) { return a - b; });\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < s.length; i++) {\n        var k = String(s[i]);\n        count[k] = (count[k] || 0) + 1;\n    }\n    var out: number[] = [];\n    for (var j = 0; j < s.length; j++) {\n        var x = s[j];\n        var kx = String(x);\n        if ((count[kx] || 0) === 0) continue;\n        if (x === 0) {\n            if (count[kx] < 2) return [];\n            count[kx] -= 2;\n            out.push(0);\n            continue;\n        }\n        var k2 = String(x * 2);\n        if ((count[k2] || 0) === 0) return [];\n        count[kx]--;\n        count[k2]--;\n        out.push(x);\n    }\n    return out;\n}`,
        java: `public static int[] findOriginalArray(int[] changed) {\n    if (changed.length % 2 != 0) return new int[0];\n    int[] s = changed.clone();\n    Arrays.sort(s);\n    HashMap<Integer, Integer> count = new HashMap<>();\n    for (int x : s) count.put(x, count.getOrDefault(x, 0) + 1);\n    int[] tmp = new int[s.length / 2];\n    int m = 0;\n    for (int x : s) {\n        if (count.getOrDefault(x, 0) == 0) continue;\n        if (x == 0) {\n            if (count.get(0) < 2) return new int[0];\n            count.put(0, count.get(0) - 2);\n            tmp[m++] = 0;\n            continue;\n        }\n        if (count.getOrDefault(x * 2, 0) == 0) return new int[0];\n        count.put(x, count.get(x) - 1);\n        count.put(x * 2, count.get(x * 2) - 1);\n        tmp[m++] = x;\n    }\n    int[] out = new int[m];\n    for (int i = 0; i < m; i++) out[i] = tmp[i];\n    return out;\n}`,
        cpp: `vector<int> findOriginalArray(vector<int>& changed) {\n    if (changed.size() % 2 != 0) return {};\n    vector<int> s = changed;\n    sort(s.begin(), s.end());\n    unordered_map<int, int> count;\n    for (int x : s) count[x]++;\n    vector<int> out;\n    for (int x : s) {\n        if (count[x] == 0) continue;\n        if (x == 0) {\n            if (count[0] < 2) return {};\n            count[0] -= 2;\n            out.push_back(0);\n            continue;\n        }\n        if (count[x * 2] == 0) return {};\n        count[x]--;\n        count[x * 2]--;\n        out.push_back(x);\n    }\n    return out;\n}`,
        c: `static int cmpAscDoubled(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint* findOriginalArray(int* changed, int changedSize, int* returnSize) {\n    *returnSize = 0;\n    int* out = (int*) malloc(((changedSize / 2) > 0 ? (changedSize / 2) : 1) * sizeof(int));\n    if (changedSize % 2 != 0) return out;\n    int* s = (int*) malloc(changedSize * sizeof(int));\n    for (int i = 0; i < changedSize; i++) s[i] = changed[i];\n    qsort(s, changedSize, sizeof(int), cmpAscDoubled);\n    int* count = (int*) calloc(200001, sizeof(int));\n    for (int i = 0; i < changedSize; i++) count[s[i]]++;\n    int m = 0;\n    for (int i = 0; i < changedSize; i++) {\n        int x = s[i];\n        if (count[x] == 0) continue;\n        if (x == 0) {\n            if (count[0] < 2) { m = 0; break; }\n            count[0] -= 2;\n            out[m++] = 0;\n            continue;\n        }\n        if (x * 2 > 200000 || count[x * 2] == 0) { m = 0; break; }\n        count[x]--;\n        count[x * 2]--;\n        out[m++] = x;\n    }\n    free(s);\n    free(count);\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[] FindOriginalArray(int[] changed)\n{\n    if (changed.Length % 2 != 0) return new int[0];\n    int[] s = (int[]) changed.Clone();\n    Array.Sort(s);\n    var count = new Dictionary<int, int>();\n    foreach (int x in s)\n    {\n        if (count.ContainsKey(x)) count[x]++;\n        else count[x] = 1;\n    }\n    var out_ = new List<int>();\n    foreach (int x in s)\n    {\n        if (!count.ContainsKey(x) || count[x] == 0) continue;\n        if (x == 0)\n        {\n            if (count[0] < 2) return new int[0];\n            count[0] -= 2;\n            out_.Add(0);\n            continue;\n        }\n        if (!count.ContainsKey(x * 2) || count[x * 2] == 0) return new int[0];\n        count[x]--;\n        count[x * 2]--;\n        out_.Add(x);\n    }\n    return out_.ToArray();\n}`,
        go: `func findOriginalArray(changed []int) []int {\n\tif len(changed)%2 != 0 {\n\t\treturn []int{}\n\t}\n\ts := append([]int{}, changed...)\n\tsort.Ints(s)\n\tcount := map[int]int{}\n\tfor _, x := range s {\n\t\tcount[x]++\n\t}\n\tout := []int{}\n\tfor _, x := range s {\n\t\tif count[x] == 0 {\n\t\t\tcontinue\n\t\t}\n\t\tif x == 0 {\n\t\t\tif count[0] < 2 {\n\t\t\t\treturn []int{}\n\t\t\t}\n\t\t\tcount[0] -= 2\n\t\t\tout = append(out, 0)\n\t\t\tcontinue\n\t\t}\n\t\tif count[x*2] == 0 {\n\t\t\treturn []int{}\n\t\t}\n\t\tcount[x]--\n\t\tcount[x*2]--\n\t\tout = append(out, x)\n\t}\n\treturn out\n}`,
        kotlin: `fun findOriginalArray(changed: IntArray): IntArray {\n    if (changed.size % 2 != 0) return intArrayOf()\n    val s = changed.clone()\n    s.sort()\n    val count = HashMap<Int, Int>()\n    for (x in s) count[x] = (count[x] ?: 0) + 1\n    val out = ArrayList<Int>()\n    for (x in s) {\n        if ((count[x] ?: 0) == 0) continue\n        if (x == 0) {\n            if ((count[0] ?: 0) < 2) return intArrayOf()\n            count[0] = count[0]!! - 2\n            out.add(0)\n            continue\n        }\n        if ((count[x * 2] ?: 0) == 0) return intArrayOf()\n        count[x] = count[x]!! - 1\n        count[x * 2] = count[x * 2]!! - 1\n        out.add(x)\n    }\n    return out.toIntArray()\n}`,
        swift: `func findOriginalArray(_ changed: [Int]) -> [Int] {\n    if changed.count % 2 != 0 { return [] }\n    let s = changed.sorted()\n    var count: [Int: Int] = [:]\n    for x in s { count[x] = (count[x] ?? 0) + 1 }\n    var out: [Int] = []\n    for x in s {\n        if (count[x] ?? 0) == 0 { continue }\n        if x == 0 {\n            if (count[0] ?? 0) < 2 { return [] }\n            count[0] = count[0]! - 2\n            out.append(0)\n            continue\n        }\n        if (count[x * 2] ?? 0) == 0 { return [] }\n        count[x] = count[x]! - 1\n        count[x * 2] = count[x * 2]! - 1\n        out.append(x)\n    }\n    return out\n}`,
        rust: `fn findOriginalArray(changed: Vec<i32>) -> Vec<i32> {\n    use std::collections::HashMap;\n    if changed.len() % 2 != 0 {\n        return vec![];\n    }\n    let mut s = changed.clone();\n    s.sort();\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for &x in s.iter() {\n        *count.entry(x).or_insert(0) += 1;\n    }\n    let mut out: Vec<i32> = Vec::new();\n    for &x in s.iter() {\n        if *count.get(&x).unwrap_or(&0) == 0 {\n            continue;\n        }\n        if x == 0 {\n            if *count.get(&0).unwrap_or(&0) < 2 {\n                return vec![];\n            }\n            *count.get_mut(&0).unwrap() -= 2;\n            out.push(0);\n            continue;\n        }\n        if *count.get(&(x * 2)).unwrap_or(&0) == 0 {\n            return vec![];\n        }\n        *count.get_mut(&x).unwrap() -= 1;\n        *count.get_mut(&(x * 2)).unwrap() -= 1;\n        out.push(x);\n    }\n    out\n}`,
        php: `function findOriginalArray($changed) {\n    if (count($changed) % 2 !== 0) return array();\n    $s = $changed;\n    sort($s);\n    $count = array();\n    foreach ($s as $x) {\n        if (isset($count[$x])) $count[$x]++;\n        else $count[$x] = 1;\n    }\n    $out = array();\n    foreach ($s as $x) {\n        if (!isset($count[$x]) || $count[$x] === 0) continue;\n        if ($x === 0) {\n            if ($count[0] < 2) return array();\n            $count[0] -= 2;\n            $out[] = 0;\n            continue;\n        }\n        $d = $x * 2;\n        if (!isset($count[$d]) || $count[$d] === 0) return array();\n        $count[$x]--;\n        $count[$d]--;\n        $out[] = $x;\n    }\n    return $out;\n}`,
        ruby: `def findOriginalArray(changed)\n  return [] if changed.length.odd?\n  s = changed.sort\n  count = Hash.new(0)\n  s.each { |x| count[x] += 1 }\n  out = []\n  s.each do |x|\n    next if count[x] == 0\n    if x == 0\n      return [] if count[0] < 2\n      count[0] -= 2\n      out << 0\n      next\n    end\n    return [] if count[x * 2] == 0\n    count[x] -= 1\n    count[x * 2] -= 1\n    out << x\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Count Operations to Obtain Zero (LC 2169) ───────────────────
  (() => {
    const ref = (a: number, b: number) => {
      let ops = 0;
      while (a !== 0 && b !== 0) {
        if (a >= b) { ops += Math.floor(a / b); a = a % b; }
        else { ops += Math.floor(b / a); b = b % a; }
      }
      return ops;
    };
    return {
      slug: "count-operations-to-obtain-zero",
      title: "Count Operations to Obtain Zero",
      difficulty: "EASY" as const,
      tags: ["Math", "Simulation", "Amazon", "Adobe"],
      signature: {
        funcName: "countOperations",
        params: [{ name: "num1", type: "int" as const }, { name: "num2", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two non-negative integers `num1` and `num2`.\n\nRepeat this operation until one of them becomes `0`: if `num1 >= num2`, subtract `num2` from `num1`; otherwise subtract `num1` from `num2`.\n\nReturn the number of operations performed.",
        [
          { in: "num1 = 2, num2 = 3", out: "3", note: "(2,3) → (2,1) → (1,1) → (1,0)." },
          { in: "num1 = 10, num2 = 10", out: "1", note: "One subtraction makes both sides zero." },
          { in: "num1 = 0, num2 = 5", out: "0", note: "One is already zero, so no operation runs." },
        ],
        ["0 <= num1, num2 <= 100000"]),
      hints: [
        "Simulating one subtraction at a time is fine for small inputs but is slow when one number dwarfs the other.",
        "Subtracting `b` from `a` repeatedly is exactly integer division.",
        "That makes the whole loop the Euclidean algorithm, counting quotients instead of discarding them.",
      ],
      editorial: explain({
        idea: "Repeatedly subtracting the smaller value from the larger is the subtractive form of Euclid's algorithm. Replacing each run of identical subtractions with one division collapses the operation count into a sum of quotients.",
        steps: [
          "While neither value is zero, let the larger be `a` and the smaller `b`.",
          "Add `a / b` (integer division) to the operation count — that is how many subtractions the naive loop would perform in a row.",
          "Replace `a` with `a % b` and continue.",
          "Return the accumulated count.",
        ],
        why: "Subtracting `b` from `a` exactly `floor(a/b)` times leaves `a % b`, which is by definition smaller than `b`, so the roles swap on the next iteration. The quotient sum therefore equals the number of individual subtractions.",
        time: "O(log(min(num1, num2)))",
        space: "O(1)",
        pitfalls: [
          "The naive one-subtraction-at-a-time loop takes 100,000 steps for `(100000, 1)`.",
          "Equal values must count as one operation, which the `a >= b` branch handles by making `a % b == 0`.",
          "A zero input must return `0`, not loop forever — the guard is on the loop condition.",
        ],
      }),
      examples: [
        { input: "2\n3", expectedOutput: "3" },
        { input: "10\n10", expectedOutput: "1" },
        { input: "0\n5", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const a = rng() < 0.1 ? 0 : ri(rng, 0, rng() < 0.5 ? 100 : 100000);
        const b = rng() < 0.1 ? 0 : ri(rng, 0, rng() < 0.5 ? 100 : 100000);
        return { input: `${a}\n${b}`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: `def countOperations(num1: int, num2: int) -> int:\n    ops = 0\n    while num1 != 0 and num2 != 0:\n        if num1 >= num2:\n            ops += num1 // num2\n            num1 %= num2\n        else:\n            ops += num2 // num1\n            num2 %= num1\n    return ops`,
        javascript: `var countOperations = function(num1, num2) {\n    let ops = 0;\n    while (num1 !== 0 && num2 !== 0) {\n        if (num1 >= num2) {\n            ops += Math.floor(num1 / num2);\n            num1 = num1 % num2;\n        } else {\n            ops += Math.floor(num2 / num1);\n            num2 = num2 % num1;\n        }\n    }\n    return ops;\n};`,
        typescript: `function countOperations(num1: number, num2: number): number {\n    var ops = 0;\n    while (num1 !== 0 && num2 !== 0) {\n        if (num1 >= num2) {\n            ops += Math.floor(num1 / num2);\n            num1 = num1 % num2;\n        } else {\n            ops += Math.floor(num2 / num1);\n            num2 = num2 % num1;\n        }\n    }\n    return ops;\n}`,
        java: `public static int countOperations(int num1, int num2) {\n    int ops = 0;\n    while (num1 != 0 && num2 != 0) {\n        if (num1 >= num2) {\n            ops += num1 / num2;\n            num1 %= num2;\n        } else {\n            ops += num2 / num1;\n            num2 %= num1;\n        }\n    }\n    return ops;\n}`,
        cpp: `int countOperations(int num1, int num2) {\n    int ops = 0;\n    while (num1 != 0 && num2 != 0) {\n        if (num1 >= num2) {\n            ops += num1 / num2;\n            num1 %= num2;\n        } else {\n            ops += num2 / num1;\n            num2 %= num1;\n        }\n    }\n    return ops;\n}`,
        c: `int countOperations(int num1, int num2) {\n    int ops = 0;\n    while (num1 != 0 && num2 != 0) {\n        if (num1 >= num2) {\n            ops += num1 / num2;\n            num1 %= num2;\n        } else {\n            ops += num2 / num1;\n            num2 %= num1;\n        }\n    }\n    return ops;\n}`,
        csharp: `public static int CountOperations(int num1, int num2)\n{\n    int ops = 0;\n    while (num1 != 0 && num2 != 0)\n    {\n        if (num1 >= num2)\n        {\n            ops += num1 / num2;\n            num1 %= num2;\n        }\n        else\n        {\n            ops += num2 / num1;\n            num2 %= num1;\n        }\n    }\n    return ops;\n}`,
        go: `func countOperations(num1 int, num2 int) int {\n\tops := 0\n\tfor num1 != 0 && num2 != 0 {\n\t\tif num1 >= num2 {\n\t\t\tops += num1 / num2\n\t\t\tnum1 %= num2\n\t\t} else {\n\t\t\tops += num2 / num1\n\t\t\tnum2 %= num1\n\t\t}\n\t}\n\treturn ops\n}`,
        kotlin: `fun countOperations(num1: Int, num2: Int): Int {\n    var a = num1\n    var b = num2\n    var ops = 0\n    while (a != 0 && b != 0) {\n        if (a >= b) {\n            ops += a / b\n            a %= b\n        } else {\n            ops += b / a\n            b %= a\n        }\n    }\n    return ops\n}`,
        swift: `func countOperations(_ num1: Int, _ num2: Int) -> Int {\n    var a = num1\n    var b = num2\n    var ops = 0\n    while a != 0 && b != 0 {\n        if a >= b {\n            ops += a / b\n            a %= b\n        } else {\n            ops += b / a\n            b %= a\n        }\n    }\n    return ops\n}`,
        rust: `fn countOperations(num1: i32, num2: i32) -> i32 {\n    let mut a = num1;\n    let mut b = num2;\n    let mut ops = 0;\n    while a != 0 && b != 0 {\n        if a >= b {\n            ops += a / b;\n            a %= b;\n        } else {\n            ops += b / a;\n            b %= a;\n        }\n    }\n    ops\n}`,
        php: `function countOperations($num1, $num2) {\n    $ops = 0;\n    while ($num1 !== 0 && $num2 !== 0) {\n        if ($num1 >= $num2) {\n            $ops += intdiv($num1, $num2);\n            $num1 = $num1 % $num2;\n        } else {\n            $ops += intdiv($num2, $num1);\n            $num2 = $num2 % $num1;\n        }\n    }\n    return $ops;\n}`,
        ruby: `def countOperations(num1, num2)\n  ops = 0\n  while num1 != 0 && num2 != 0\n    if num1 >= num2\n      ops += num1 / num2\n      num1 %= num2\n    else\n      ops += num2 / num1\n      num2 %= num1\n    end\n  end\n  ops\nend`,
      },
    };
  })(),

  // ── Count Equal and Divisible Pairs in an Array (LC 2176) ───────
  (() => {
    const ref = (nums: number[], k: number) => {
      let c = 0;
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) {
          if (nums[i] === nums[j] && (i * j) % k === 0) c++;
        }
      }
      return c;
    };
    return {
      slug: "count-equal-and-divisible-pairs-in-an-array",
      title: "Count Equal and Divisible Pairs in an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Wipro"],
      signature: {
        funcName: "countPairs",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given a 0-indexed integer array `nums` and an integer `k`, return the number of index pairs `(i, j)` with `i < j` such that `nums[i] == nums[j]` **and** `i * j` is divisible by `k`.",
        [
          { in: "nums = [3,1,2,2,2,1,3], k = 2", out: "4", note: "The qualifying pairs are (0,6), (2,3), (2,4) and (3,4)." },
          { in: "nums = [1,2,3,4], k = 1", out: "0", note: "All values are distinct." },
          { in: "nums = [5,5,5], k = 2", out: "3", note: "(0,1) and (0,2) have product 0, and (1,2) has product 2 — all divisible by 2." },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i], k <= 100"]),
      hints: [
        "The array is short, so checking every pair is well within budget.",
        "Both conditions must hold — equal values *and* `i * j % k == 0`.",
        "Only pairs with `i < j` count, so the inner loop should start at `i + 1`.",
      ],
      editorial: explain({
        idea: "With `n <= 100` the total pair count is at most 4950, so the direct double loop is the right tool — no cleverness required.",
        steps: [
          "Loop `i` over all indices and `j` over indices after `i`.",
          "Count the pair when `nums[i] == nums[j]` and `(i * j) % k == 0`.",
          "Return the count.",
        ],
        why: "The double loop enumerates each unordered index pair exactly once, and both conditions are checked directly, so the count is exact by construction.",
        time: "O(n²)",
        space: "O(1)",
        pitfalls: [
          "Starting the inner loop at `0` counts each pair twice and admits `i == j`.",
          "`i * j` uses **indices**, not values — a common misreading.",
          "Index 0 pairs with everything as far as divisibility goes, since `0 * j == 0` is divisible by any `k`.",
        ],
      }),
      examples: [
        { input: "[3,1,2,2,2,1,3]\n2", expectedOutput: "4" },
        { input: "[1,2,3,4]\n1", expectedOutput: "0" },
        { input: "[5,5,5]\n2", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => ri(rng, 1, rng() < 0.6 ? 4 : 20));
        const k = ri(rng, 1, 8);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countPairs(nums: List[int], k: int) -> int:\n    count = 0\n    n = len(nums)\n    for i in range(n):\n        for j in range(i + 1, n):\n            if nums[i] == nums[j] and (i * j) % k == 0:\n                count += 1\n    return count`,
        javascript: `var countPairs = function(nums, k) {\n    let count = 0;\n    for (let i = 0; i < nums.length; i++) {\n        for (let j = i + 1; j < nums.length; j++) {\n            if (nums[i] === nums[j] && (i * j) % k === 0) count++;\n        }\n    }\n    return count;\n};`,
        typescript: `function countPairs(nums: number[], k: number): number {\n    var count = 0;\n    for (var i = 0; i < nums.length; i++) {\n        for (var j = i + 1; j < nums.length; j++) {\n            if (nums[i] === nums[j] && (i * j) % k === 0) count++;\n        }\n    }\n    return count;\n}`,
        java: `public static int countPairs(int[] nums, int k) {\n    int count = 0;\n    for (int i = 0; i < nums.length; i++) {\n        for (int j = i + 1; j < nums.length; j++) {\n            if (nums[i] == nums[j] && (i * j) % k == 0) count++;\n        }\n    }\n    return count;\n}`,
        cpp: `int countPairs(vector<int>& nums, int k) {\n    int count = 0;\n    int n = (int) nums.size();\n    for (int i = 0; i < n; i++) {\n        for (int j = i + 1; j < n; j++) {\n            if (nums[i] == nums[j] && (i * j) % k == 0) count++;\n        }\n    }\n    return count;\n}`,
        c: `int countPairs(int* nums, int numsSize, int k) {\n    int count = 0;\n    for (int i = 0; i < numsSize; i++) {\n        for (int j = i + 1; j < numsSize; j++) {\n            if (nums[i] == nums[j] && (i * j) % k == 0) count++;\n        }\n    }\n    return count;\n}`,
        csharp: `public static int CountPairs(int[] nums, int k)\n{\n    int count = 0;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        for (int j = i + 1; j < nums.Length; j++)\n        {\n            if (nums[i] == nums[j] && (i * j) % k == 0) count++;\n        }\n    }\n    return count;\n}`,
        go: `func countPairs(nums []int, k int) int {\n\tcount := 0\n\tfor i := 0; i < len(nums); i++ {\n\t\tfor j := i + 1; j < len(nums); j++ {\n\t\t\tif nums[i] == nums[j] && (i*j)%k == 0 {\n\t\t\t\tcount++\n\t\t\t}\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countPairs(nums: IntArray, k: Int): Int {\n    var count = 0\n    for (i in nums.indices) {\n        for (j in i + 1 until nums.size) {\n            if (nums[i] == nums[j] && (i * j) % k == 0) count++\n        }\n    }\n    return count\n}`,
        swift: `func countPairs(_ nums: [Int], _ k: Int) -> Int {\n    var count = 0\n    for i in 0..<nums.count {\n        var j = i + 1\n        while j < nums.count {\n            if nums[i] == nums[j] && (i * j) % k == 0 { count += 1 }\n            j += 1\n        }\n    }\n    return count\n}`,
        rust: `fn countPairs(nums: Vec<i32>, k: i32) -> i32 {\n    let mut count = 0;\n    let n = nums.len();\n    for i in 0..n {\n        for j in (i + 1)..n {\n            if nums[i] == nums[j] && ((i * j) as i32) % k == 0 {\n                count += 1;\n            }\n        }\n    }\n    count\n}`,
        php: `function countPairs($nums, $k) {\n    $count = 0;\n    $n = count($nums);\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = $i + 1; $j < $n; $j++) {\n            if ($nums[$i] === $nums[$j] && ($i * $j) % $k === 0) $count++;\n        }\n    }\n    return $count;\n}`,
        ruby: `def countPairs(nums, k)\n  count = 0\n  n = nums.length\n  (0...n).each do |i|\n    ((i + 1)...n).each do |j|\n      count += 1 if nums[i] == nums[j] && (i * j) % k == 0\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Divide Array Into Equal Pairs (LC 2206) ─────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const count: Record<string, number> = {};
      for (const x of nums) count[String(x)] = (count[String(x)] || 0) + 1;
      for (const k of Object.keys(count)) if (count[k] % 2 !== 0) return false;
      return true;
    };
    return {
      slug: "divide-array-into-equal-pairs",
      title: "Divide Array Into Equal Pairs",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Bit Manipulation", "Amazon", "TCS"],
      signature: { funcName: "divideArray", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "You are given an integer array `nums` of length `2 * n`.\n\nReturn `true` if it can be split into `n` pairs such that **both elements of every pair are equal**, and each element is used exactly once.",
        [
          { in: "nums = [3,2,3,2,2,2]", out: "true", note: "The pairs (2,2), (2,2) and (3,3) use every element once." },
          { in: "nums = [1,2,3,4]", out: "false", note: "Every value appears once, so no pair can be formed." },
          { in: "nums = [7,7]", out: "true" },
        ],
        ["nums.length is even", "2 <= nums.length <= 1000", "1 <= nums[i] <= 500"]),
      hints: [
        "Elements can only pair with an equal value, so pairing is decided per distinct value.",
        "A value with an odd count always leaves one element stranded.",
        "So the whole question is whether every frequency is even.",
      ],
      editorial: explain({
        idea: "Pairs must be equal-valued, so the array splits into independent groups by value. A group of size `c` forms `c / 2` pairs and leaves a leftover exactly when `c` is odd.",
        steps: [
          "Count the occurrences of every distinct value.",
          "If any count is odd, return `false`.",
          "Otherwise return `true`.",
        ],
        why: "Necessity is clear — an odd group cannot be fully paired within itself, and cross-value pairing is forbidden. Sufficiency follows because an even group of identical values pairs off trivially.",
        time: "O(n)",
        space: "O(V) for the counts",
        pitfalls: [
          "Sorting and comparing adjacent elements works but must step by 2, not by 1.",
          "The XOR trick (\"everything cancels to zero\") is **not** valid here — `[1,1,2,2]` and `[1,2,3,0]` can XOR alike for different reasons.",
        ],
      }),
      examples: [
        { input: "[3,2,3,2,2,2]", expectedOutput: "true" },
        { input: "[1,2,3,4]", expectedOutput: "false" },
        { input: "[7,7]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const pairs = ri(rng, 1, 12);
        let nums: number[] = [];
        for (let i = 0; i < pairs; i++) {
          const v = ri(rng, 1, 8);
          nums.push(v, v);
        }
        if (rng() < 0.45) {
          // Break one pair so the answer is sometimes false.
          const i = ri(rng, 0, nums.length - 1);
          nums[i] = ri(rng, 1, 8);
        }
        shuffle(rng, nums);
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef divideArray(nums: List[int]) -> bool:\n    count = {}\n    for x in nums:\n        count[x] = count.get(x, 0) + 1\n    for c in count.values():\n        if c % 2 != 0:\n            return False\n    return True`,
        javascript: `var divideArray = function(nums) {\n    const count = {};\n    for (let i = 0; i < nums.length; i++) {\n        const k = String(nums[i]);\n        count[k] = (count[k] || 0) + 1;\n    }\n    const keys = Object.keys(count);\n    for (let i = 0; i < keys.length; i++) {\n        if (count[keys[i]] % 2 !== 0) return false;\n    }\n    return true;\n};`,
        typescript: `function divideArray(nums: number[]): boolean {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var k = String(nums[i]);\n        count[k] = (count[k] || 0) + 1;\n    }\n    var keys = Object.keys(count);\n    for (var j = 0; j < keys.length; j++) {\n        if (count[keys[j]] % 2 !== 0) return false;\n    }\n    return true;\n}`,
        java: `public static boolean divideArray(int[] nums) {\n    int[] count = new int[501];\n    for (int x : nums) count[x]++;\n    for (int c : count) {\n        if (c % 2 != 0) return false;\n    }\n    return true;\n}`,
        cpp: `bool divideArray(vector<int>& nums) {\n    vector<int> count(501, 0);\n    for (int x : nums) count[x]++;\n    for (int c : count) {\n        if (c % 2 != 0) return false;\n    }\n    return true;\n}`,
        c: `bool divideArray(int* nums, int numsSize) {\n    int count[501];\n    for (int i = 0; i <= 500; i++) count[i] = 0;\n    for (int i = 0; i < numsSize; i++) count[nums[i]]++;\n    for (int i = 0; i <= 500; i++) {\n        if (count[i] % 2 != 0) return false;\n    }\n    return true;\n}`,
        csharp: `public static bool DivideArray(int[] nums)\n{\n    int[] count = new int[501];\n    foreach (int x in nums) count[x]++;\n    foreach (int c in count)\n    {\n        if (c % 2 != 0) return false;\n    }\n    return true;\n}`,
        go: `func divideArray(nums []int) bool {\n\tcount := make([]int, 501)\n\tfor _, x := range nums {\n\t\tcount[x]++\n\t}\n\tfor _, c := range count {\n\t\tif c%2 != 0 {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun divideArray(nums: IntArray): Boolean {\n    val count = IntArray(501)\n    for (x in nums) count[x]++\n    for (c in count) {\n        if (c % 2 != 0) return false\n    }\n    return true\n}`,
        swift: `func divideArray(_ nums: [Int]) -> Bool {\n    var count = [Int](repeating: 0, count: 501)\n    for x in nums { count[x] += 1 }\n    for c in count {\n        if c % 2 != 0 { return false }\n    }\n    return true\n}`,
        rust: `fn divideArray(nums: Vec<i32>) -> bool {\n    let mut count = vec![0i32; 501];\n    for &x in nums.iter() {\n        count[x as usize] += 1;\n    }\n    for &c in count.iter() {\n        if c % 2 != 0 {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function divideArray($nums) {\n    $count = array_fill(0, 501, 0);\n    foreach ($nums as $x) $count[$x]++;\n    foreach ($count as $c) {\n        if ($c % 2 !== 0) return false;\n    }\n    return true;\n}`,
        ruby: `def divideArray(nums)\n  count = Hash.new(0)\n  nums.each { |x| count[x] += 1 }\n  count.each_value do |c|\n    return false if c.odd?\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Chocolate Distribution Problem (GFG) ────────────────────────
  (() => {
    const ref = (arr: number[], m: number) => {
      if (m === 0 || arr.length === 0) return 0;
      if (m > arr.length) return -1;
      const s = [...arr].sort((a, b) => a - b);
      let best = Infinity;
      for (let i = 0; i + m - 1 < s.length; i++) {
        const d = s[i + m - 1] - s[i];
        if (d < best) best = d;
      }
      return best;
    };
    return {
      slug: "chocolate-distribution-problem",
      title: "Chocolate Distribution Problem",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Sliding Window", "TCS", "Wipro", "Accenture"],
      signature: {
        funcName: "findMinDiff",
        params: [{ name: "arr", type: "int[]" as const }, { name: "m", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "`arr[i]` is the number of chocolates in the `i`-th packet. You must hand out exactly `m` packets to `m` students — one packet each.\n\nChoose the packets so that the difference between the **largest** and the **smallest** packet given out is as small as possible, and return that difference.\n\nReturn `0` if `m` is `0`, and `-1` if there are fewer than `m` packets.",
        [
          { in: "arr = [3,4,1,9,56,7,9,12], m = 5", out: "6", note: "Choosing 3,4,7,9,9 spans 9 - 3 = 6." },
          { in: "arr = [7,3,2,4,9,12,56], m = 3", out: "2", note: "Choosing 2,3,4 spans 4 - 2 = 2." },
          { in: "arr = [1,2], m = 5", out: "-1" },
        ],
        ["1 <= arr.length <= 100000", "0 <= m <= 100000", "1 <= arr[i] <= 1000000000"]),
      hints: [
        "The chosen packets do not have to be adjacent in the input — but after sorting, the best group always is.",
        "Sort ascending, then look at every window of exactly `m` consecutive packets.",
        "The span of a sorted window is just `last - first`.",
      ],
      editorial: explain({
        idea: "In a sorted array, the tightest set of `m` values is always a contiguous window: pulling in a value from outside a window can only widen the min-to-max span.",
        steps: [
          "Handle the guards: `m == 0` answers `0`, and `m > n` answers `-1`.",
          "Sort a copy of `arr` ascending.",
          "Slide a window of length `m` across it, taking `s[i + m - 1] - s[i]` at each position.",
          "Return the smallest span seen.",
        ],
        why: "Suppose an optimal choice skipped some sorted value lying between its own minimum and maximum. Swapping the skipped value in for an endpoint keeps the count at `m` and cannot increase the span, so a contiguous window is always at least as good.",
        time: "O(n log n)",
        space: "O(n) for the sorted copy",
        pitfalls: [
          "Forgetting the `m > n` guard indexes past the end of the array.",
          "Windows must have exactly `m` elements — the loop bound is `i + m - 1 < n`.",
          "With values up to 1e9 the difference still fits in 32 bits, but only because both endpoints are positive.",
        ],
      }),
      examples: [
        { input: "[3,4,1,9,56,7,9,12]\n5", expectedOutput: "6" },
        { input: "[7,3,2,4,9,12,56]\n3", expectedOutput: "2" },
        { input: "[1,2]\n5", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const arr = Array.from({ length: n }, () => ri(rng, 1, rng() < 0.5 ? 60 : 1000000));
        const m = rng() < 0.12 ? ri(rng, n + 1, n + 5) : ri(rng, 0, n);
        return { input: `${fmtIntArr(arr)}\n${m}`, expectedOutput: String(ref(arr, m)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findMinDiff(arr: List[int], m: int) -> int:\n    if m == 0 or len(arr) == 0:\n        return 0\n    if m > len(arr):\n        return -1\n    s = sorted(arr)\n    best = s[m - 1] - s[0]\n    for i in range(len(s) - m + 1):\n        d = s[i + m - 1] - s[i]\n        if d < best:\n            best = d\n    return best`,
        javascript: `var findMinDiff = function(arr, m) {\n    if (m === 0 || arr.length === 0) return 0;\n    if (m > arr.length) return -1;\n    const s = arr.slice().sort(function(a, b) { return a - b; });\n    let best = s[m - 1] - s[0];\n    for (let i = 0; i + m - 1 < s.length; i++) {\n        const d = s[i + m - 1] - s[i];\n        if (d < best) best = d;\n    }\n    return best;\n};`,
        typescript: `function findMinDiff(arr: number[], m: number): number {\n    if (m === 0 || arr.length === 0) return 0;\n    if (m > arr.length) return -1;\n    var s = arr.slice().sort(function(a, b) { return a - b; });\n    var best = s[m - 1] - s[0];\n    for (var i = 0; i + m - 1 < s.length; i++) {\n        var d = s[i + m - 1] - s[i];\n        if (d < best) best = d;\n    }\n    return best;\n}`,
        java: `public static int findMinDiff(int[] arr, int m) {\n    if (m == 0 || arr.length == 0) return 0;\n    if (m > arr.length) return -1;\n    int[] s = arr.clone();\n    Arrays.sort(s);\n    int best = s[m - 1] - s[0];\n    for (int i = 0; i + m - 1 < s.length; i++) {\n        int d = s[i + m - 1] - s[i];\n        if (d < best) best = d;\n    }\n    return best;\n}`,
        cpp: `int findMinDiff(vector<int>& arr, int m) {\n    if (m == 0 || arr.empty()) return 0;\n    if (m > (int) arr.size()) return -1;\n    vector<int> s = arr;\n    sort(s.begin(), s.end());\n    int best = s[m - 1] - s[0];\n    for (int i = 0; i + m - 1 < (int) s.size(); i++) {\n        int d = s[i + m - 1] - s[i];\n        if (d < best) best = d;\n    }\n    return best;\n}`,
        c: `static int cmpAscChoco(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint findMinDiff(int* arr, int arrSize, int m) {\n    if (m == 0 || arrSize == 0) return 0;\n    if (m > arrSize) return -1;\n    int* s = (int*) malloc(arrSize * sizeof(int));\n    for (int i = 0; i < arrSize; i++) s[i] = arr[i];\n    qsort(s, arrSize, sizeof(int), cmpAscChoco);\n    int best = s[m - 1] - s[0];\n    for (int i = 0; i + m - 1 < arrSize; i++) {\n        int d = s[i + m - 1] - s[i];\n        if (d < best) best = d;\n    }\n    free(s);\n    return best;\n}`,
        csharp: `public static int FindMinDiff(int[] arr, int m)\n{\n    if (m == 0 || arr.Length == 0) return 0;\n    if (m > arr.Length) return -1;\n    int[] s = (int[]) arr.Clone();\n    Array.Sort(s);\n    int best = s[m - 1] - s[0];\n    for (int i = 0; i + m - 1 < s.Length; i++)\n    {\n        int d = s[i + m - 1] - s[i];\n        if (d < best) best = d;\n    }\n    return best;\n}`,
        go: `func findMinDiff(arr []int, m int) int {\n\tif m == 0 || len(arr) == 0 {\n\t\treturn 0\n\t}\n\tif m > len(arr) {\n\t\treturn -1\n\t}\n\ts := append([]int{}, arr...)\n\tsort.Ints(s)\n\tbest := s[m-1] - s[0]\n\tfor i := 0; i+m-1 < len(s); i++ {\n\t\tif d := s[i+m-1] - s[i]; d < best {\n\t\t\tbest = d\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun findMinDiff(arr: IntArray, m: Int): Int {\n    if (m == 0 || arr.isEmpty()) return 0\n    if (m > arr.size) return -1\n    val s = arr.clone()\n    s.sort()\n    var best = s[m - 1] - s[0]\n    var i = 0\n    while (i + m - 1 < s.size) {\n        val d = s[i + m - 1] - s[i]\n        if (d < best) best = d\n        i++\n    }\n    return best\n}`,
        swift: `func findMinDiff(_ arr: [Int], _ m: Int) -> Int {\n    if m == 0 || arr.isEmpty { return 0 }\n    if m > arr.count { return -1 }\n    let s = arr.sorted()\n    var best = s[m - 1] - s[0]\n    var i = 0\n    while i + m - 1 < s.count {\n        let d = s[i + m - 1] - s[i]\n        if d < best { best = d }\n        i += 1\n    }\n    return best\n}`,
        rust: `fn findMinDiff(arr: Vec<i32>, m: i32) -> i32 {\n    if m == 0 || arr.is_empty() {\n        return 0;\n    }\n    if m as usize > arr.len() {\n        return -1;\n    }\n    let mut s = arr.clone();\n    s.sort();\n    let w = m as usize;\n    let mut best = s[w - 1] - s[0];\n    let mut i = 0;\n    while i + w - 1 < s.len() {\n        let d = s[i + w - 1] - s[i];\n        if d < best {\n            best = d;\n        }\n        i += 1;\n    }\n    best\n}`,
        php: `function findMinDiff($arr, $m) {\n    if ($m === 0 || count($arr) === 0) return 0;\n    if ($m > count($arr)) return -1;\n    $s = $arr;\n    sort($s);\n    $best = $s[$m - 1] - $s[0];\n    for ($i = 0; $i + $m - 1 < count($s); $i++) {\n        $d = $s[$i + $m - 1] - $s[$i];\n        if ($d < $best) $best = $d;\n    }\n    return $best;\n}`,
        ruby: `def findMinDiff(arr, m)\n  return 0 if m == 0 || arr.empty?\n  return -1 if m > arr.length\n  s = arr.sort\n  best = s[m - 1] - s[0]\n  i = 0\n  while i + m - 1 < s.length\n    d = s[i + m - 1] - s[i]\n    best = d if d < best\n    i += 1\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Union of Two Sorted Arrays (GFG) ────────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      const out: number[] = [];
      let i = 0, j = 0;
      const push = (v: number) => { if (out.length === 0 || out[out.length - 1] !== v) out.push(v); };
      while (i < a.length && j < b.length) {
        if (a[i] < b[j]) push(a[i++]);
        else if (b[j] < a[i]) push(b[j++]);
        else { push(a[i]); i++; j++; }
      }
      while (i < a.length) push(a[i++]);
      while (j < b.length) push(b[j++]);
      return out;
    };
    return {
      slug: "union-of-two-sorted-arrays",
      title: "Union of Two Sorted Arrays",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "TCS", "Infosys", "Capgemini"],
      signature: {
        funcName: "findUnion",
        params: [{ name: "a", type: "int[]" as const }, { name: "b", type: "int[]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "Given two arrays `a` and `b` sorted in **non-decreasing** order, return their **union**: every distinct value that appears in either array, listed in increasing order.\n\nEach array may contain duplicates; the result must not.",
        [
          { in: "a = [1,2,3,4,5], b = [1,2,3]", out: "[1,2,3,4,5]" },
          { in: "a = [2,2,3,4,5], b = [1,1,2,3,4]", out: "[1,2,3,4,5]" },
          { in: "a = [1,1,1], b = [1]", out: "[1]" },
        ],
        ["1 <= a.length, b.length <= 100000", "-1000000000 <= a[i], b[i] <= 1000000000", "Both arrays are sorted non-decreasing."]),
      hints: [
        "Both inputs are already sorted — a merge does the job without any extra sorting.",
        "Advance the pointer at the smaller value; when they tie, advance both.",
        "Suppress duplicates by comparing against the last value you appended.",
      ],
      editorial: explain({
        idea: "This is one merge step of merge sort with duplicate suppression: because both inputs are sorted, the union comes out in order for free.",
        steps: [
          "Walk two pointers `i` and `j`.",
          "Append the smaller of `a[i]` and `b[j]` and advance that pointer; on a tie, append once and advance both.",
          "Before every append, skip the value if it equals the last one already in the output.",
          "Drain whichever array still has elements, applying the same duplicate check.",
        ],
        why: "Values are emitted in non-decreasing order, so any duplicate must be adjacent in the output — comparing against the last appended value is therefore enough to make the result distinct.",
        time: "O(n + m)",
        space: "O(n + m) for the output",
        pitfalls: [
          "Concatenating and sorting is O((n+m) log(n+m)) and throws away the sortedness you were given.",
          "On a tie you must advance **both** pointers, or the shared value is emitted from the other array on the next step.",
          "The drain loops need the same duplicate guard — the tail of one array can repeat the last merged value.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5]\n[1,2,3]", expectedOutput: "[1,2,3,4,5]" },
        { input: "[2,2,3,4,5]\n[1,1,2,3,4]", expectedOutput: "[1,2,3,4,5]" },
        { input: "[1,1,1]\n[1]", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 12 : 200;
        const mk = () => Array.from({ length: ri(rng, 1, 20) }, () => ri(rng, -hi, hi)).sort((x, y) => x - y);
        const a = mk(), b = mk();
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findUnion(a: List[int], b: List[int]) -> List[int]:\n    out = []\n    i = 0\n    j = 0\n\n    def push(v):\n        if not out or out[-1] != v:\n            out.append(v)\n\n    while i < len(a) and j < len(b):\n        if a[i] < b[j]:\n            push(a[i])\n            i += 1\n        elif b[j] < a[i]:\n            push(b[j])\n            j += 1\n        else:\n            push(a[i])\n            i += 1\n            j += 1\n    while i < len(a):\n        push(a[i])\n        i += 1\n    while j < len(b):\n        push(b[j])\n        j += 1\n    return out`,
        javascript: `var findUnion = function(a, b) {\n    const out = [];\n    function push(v) {\n        if (out.length === 0 || out[out.length - 1] !== v) out.push(v);\n    }\n    let i = 0, j = 0;\n    while (i < a.length && j < b.length) {\n        if (a[i] < b[j]) { push(a[i]); i++; }\n        else if (b[j] < a[i]) { push(b[j]); j++; }\n        else { push(a[i]); i++; j++; }\n    }\n    while (i < a.length) { push(a[i]); i++; }\n    while (j < b.length) { push(b[j]); j++; }\n    return out;\n};`,
        typescript: `function findUnion(a: number[], b: number[]): number[] {\n    var out: number[] = [];\n    function push(v: number): void {\n        if (out.length === 0 || out[out.length - 1] !== v) out.push(v);\n    }\n    var i = 0, j = 0;\n    while (i < a.length && j < b.length) {\n        if (a[i] < b[j]) { push(a[i]); i++; }\n        else if (b[j] < a[i]) { push(b[j]); j++; }\n        else { push(a[i]); i++; j++; }\n    }\n    while (i < a.length) { push(a[i]); i++; }\n    while (j < b.length) { push(b[j]); j++; }\n    return out;\n}`,
        java: `public static int[] findUnion(int[] a, int[] b) {\n    int[] tmp = new int[a.length + b.length];\n    int m = 0, i = 0, j = 0;\n    while (i < a.length && j < b.length) {\n        int v;\n        if (a[i] < b[j]) v = a[i++];\n        else if (b[j] < a[i]) v = b[j++];\n        else { v = a[i]; i++; j++; }\n        if (m == 0 || tmp[m - 1] != v) tmp[m++] = v;\n    }\n    while (i < a.length) {\n        int v = a[i++];\n        if (m == 0 || tmp[m - 1] != v) tmp[m++] = v;\n    }\n    while (j < b.length) {\n        int v = b[j++];\n        if (m == 0 || tmp[m - 1] != v) tmp[m++] = v;\n    }\n    int[] out = new int[m];\n    for (int k = 0; k < m; k++) out[k] = tmp[k];\n    return out;\n}`,
        cpp: `vector<int> findUnion(vector<int>& a, vector<int>& b) {\n    vector<int> out;\n    size_t i = 0, j = 0;\n    auto push = [&](int v) {\n        if (out.empty() || out.back() != v) out.push_back(v);\n    };\n    while (i < a.size() && j < b.size()) {\n        if (a[i] < b[j]) push(a[i++]);\n        else if (b[j] < a[i]) push(b[j++]);\n        else { push(a[i]); i++; j++; }\n    }\n    while (i < a.size()) push(a[i++]);\n    while (j < b.size()) push(b[j++]);\n    return out;\n}`,
        c: `int* findUnion(int* a, int aSize, int* b, int bSize, int* returnSize) {\n    int* out = (int*) malloc((aSize + bSize > 0 ? aSize + bSize : 1) * sizeof(int));\n    int m = 0, i = 0, j = 0;\n    while (i < aSize && j < bSize) {\n        int v;\n        if (a[i] < b[j]) v = a[i++];\n        else if (b[j] < a[i]) v = b[j++];\n        else { v = a[i]; i++; j++; }\n        if (m == 0 || out[m - 1] != v) out[m++] = v;\n    }\n    while (i < aSize) {\n        int v = a[i++];\n        if (m == 0 || out[m - 1] != v) out[m++] = v;\n    }\n    while (j < bSize) {\n        int v = b[j++];\n        if (m == 0 || out[m - 1] != v) out[m++] = v;\n    }\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[] FindUnion(int[] a, int[] b)\n{\n    var out_ = new List<int>();\n    int i = 0, j = 0;\n    Action<int> push = v =>\n    {\n        if (out_.Count == 0 || out_[out_.Count - 1] != v) out_.Add(v);\n    };\n    while (i < a.Length && j < b.Length)\n    {\n        if (a[i] < b[j]) { push(a[i]); i++; }\n        else if (b[j] < a[i]) { push(b[j]); j++; }\n        else { push(a[i]); i++; j++; }\n    }\n    while (i < a.Length) { push(a[i]); i++; }\n    while (j < b.Length) { push(b[j]); j++; }\n    return out_.ToArray();\n}`,
        go: `func findUnion(a []int, b []int) []int {\n\tout := []int{}\n\tpush := func(v int) {\n\t\tif len(out) == 0 || out[len(out)-1] != v {\n\t\t\tout = append(out, v)\n\t\t}\n\t}\n\ti, j := 0, 0\n\tfor i < len(a) && j < len(b) {\n\t\tif a[i] < b[j] {\n\t\t\tpush(a[i])\n\t\t\ti++\n\t\t} else if b[j] < a[i] {\n\t\t\tpush(b[j])\n\t\t\tj++\n\t\t} else {\n\t\t\tpush(a[i])\n\t\t\ti++\n\t\t\tj++\n\t\t}\n\t}\n\tfor i < len(a) {\n\t\tpush(a[i])\n\t\ti++\n\t}\n\tfor j < len(b) {\n\t\tpush(b[j])\n\t\tj++\n\t}\n\treturn out\n}`,
        kotlin: `fun findUnion(a: IntArray, b: IntArray): IntArray {\n    val out = ArrayList<Int>()\n    fun push(v: Int) {\n        if (out.isEmpty() || out[out.size - 1] != v) out.add(v)\n    }\n    var i = 0\n    var j = 0\n    while (i < a.size && j < b.size) {\n        if (a[i] < b[j]) {\n            push(a[i]); i++\n        } else if (b[j] < a[i]) {\n            push(b[j]); j++\n        } else {\n            push(a[i]); i++; j++\n        }\n    }\n    while (i < a.size) { push(a[i]); i++ }\n    while (j < b.size) { push(b[j]); j++ }\n    return out.toIntArray()\n}`,
        swift: `func findUnion(_ a: [Int], _ b: [Int]) -> [Int] {\n    var out: [Int] = []\n    func push(_ v: Int) {\n        if out.isEmpty || out[out.count - 1] != v { out.append(v) }\n    }\n    var i = 0\n    var j = 0\n    while i < a.count && j < b.count {\n        if a[i] < b[j] {\n            push(a[i]); i += 1\n        } else if b[j] < a[i] {\n            push(b[j]); j += 1\n        } else {\n            push(a[i]); i += 1; j += 1\n        }\n    }\n    while i < a.count { push(a[i]); i += 1 }\n    while j < b.count { push(b[j]); j += 1 }\n    return out\n}`,
        rust: `fn findUnion(a: Vec<i32>, b: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    let mut i = 0;\n    let mut j = 0;\n    while i < a.len() && j < b.len() {\n        let v;\n        if a[i] < b[j] {\n            v = a[i];\n            i += 1;\n        } else if b[j] < a[i] {\n            v = b[j];\n            j += 1;\n        } else {\n            v = a[i];\n            i += 1;\n            j += 1;\n        }\n        if out.is_empty() || out[out.len() - 1] != v {\n            out.push(v);\n        }\n    }\n    while i < a.len() {\n        let v = a[i];\n        i += 1;\n        if out.is_empty() || out[out.len() - 1] != v {\n            out.push(v);\n        }\n    }\n    while j < b.len() {\n        let v = b[j];\n        j += 1;\n        if out.is_empty() || out[out.len() - 1] != v {\n            out.push(v);\n        }\n    }\n    out\n}`,
        php: `function findUnion($a, $b) {\n    $out = array();\n    $i = 0; $j = 0;\n    $na = count($a); $nb = count($b);\n    while ($i < $na && $j < $nb) {\n        if ($a[$i] < $b[$j]) { $v = $a[$i]; $i++; }\n        else if ($b[$j] < $a[$i]) { $v = $b[$j]; $j++; }\n        else { $v = $a[$i]; $i++; $j++; }\n        if (count($out) === 0 || $out[count($out) - 1] !== $v) $out[] = $v;\n    }\n    while ($i < $na) {\n        $v = $a[$i]; $i++;\n        if (count($out) === 0 || $out[count($out) - 1] !== $v) $out[] = $v;\n    }\n    while ($j < $nb) {\n        $v = $b[$j]; $j++;\n        if (count($out) === 0 || $out[count($out) - 1] !== $v) $out[] = $v;\n    }\n    return $out;\n}`,
        ruby: `def findUnion(a, b)\n  out = []\n  push = lambda do |v|\n    out << v if out.empty? || out[-1] != v\n  end\n  i = 0\n  j = 0\n  while i < a.length && j < b.length\n    if a[i] < b[j]\n      push.call(a[i]); i += 1\n    elsif b[j] < a[i]\n      push.call(b[j]); j += 1\n    else\n      push.call(a[i]); i += 1; j += 1\n    end\n  end\n  while i < a.length\n    push.call(a[i]); i += 1\n  end\n  while j < b.length\n    push.call(b[j]); j += 1\n  end\n  out\nend`,
      },
    };
  })(),

  // ── END ARRAY3 ──
];
