/**
 * Numbers, digits and elementary maths — wave 3.
 *
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks /
 * PrepInsta arithmetic set that TCS NQT, Infosys and Wipro rounds draw from.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, explain, fmtIntArr, fmtIntMat, ri, randLower, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const MATH3_PROBLEMS: CatalogProblem[] = [

  // ── Add to Array-Form of Integer (LC 989) ───────────────────────
  (() => {
    const ref = (num: number[], k: number) => {
      const out: number[] = [];
      let carry = k;
      for (let i = num.length - 1; i >= 0; i--) {
        carry += num[i];
        out.push(carry % 10);
        carry = Math.floor(carry / 10);
      }
      while (carry > 0) { out.push(carry % 10); carry = Math.floor(carry / 10); }
      out.reverse();
      return out;
    };
    return {
      slug: "add-to-array-form-of-integer",
      title: "Add to Array-Form of Integer",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "LeetCode 989", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "addToArrayForm",
        params: [{ name: "num", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "The **array form** of an integer is its digits listed most significant first — so `1321` is `[1,3,2,1]`.\n\nGiven the array form of a non-negative integer `num` and an integer `k`, return the array form of `num + k`.",
        [
          { in: "num = [1,2,0,0], k = 34", out: "[1,2,3,4]", note: "1200 + 34 = 1234." },
          { in: "num = [2,7,4], k = 181", out: "[4,5,5]" },
          { in: "num = [9,9,9,9], k = 1", out: "[1,0,0,0,0]", note: "The carry adds a new leading digit." },
        ],
        ["1 <= num.length <= 10000", "0 <= num[i] <= 9", "num does not contain leading zeros except when it is [0].", "1 <= k <= 10000"]),
      hints: [
        "The array can be 10,000 digits long, so you cannot convert it to a machine integer.",
        "Do schoolbook addition from the least significant digit, carrying as you go.",
        "Seed the carry with `k` itself — then the whole of `k` is absorbed naturally digit by digit.",
      ],
      editorial: explain({
        idea: "Treat `k` as the initial carry. Sweeping right to left, each step folds one digit of `num` into the carry and emits one output digit — so `k` is consumed without a separate loop.",
        steps: [
          "Set `carry = k` and walk `num` from its last index to its first.",
          "Add `num[i]` to `carry`, push `carry % 10` to the output, and set `carry = carry / 10`.",
          "After the array is exhausted, keep emitting digits while `carry > 0`.",
          "Reverse the collected digits, since they were produced least significant first.",
        ],
        why: "At every step the invariant is that the digits emitted so far plus `carry · 10^emitted` equals the sum of the processed suffix and `k`. Draining the remaining carry restores the full value.",
        time: "O(n + log k)",
        space: "O(n + log k) for the output",
        pitfalls: [
          "Parsing the array into an integer overflows every fixed-width type at 10,000 digits.",
          "Stopping as soon as the array ends drops the leading carry — `[9,9,9,9] + 1` needs a fifth digit.",
          "Forgetting the final reverse returns the digits backwards.",
        ],
      }),
      examples: [
        { input: "[1,2,0,0]\n34", expectedOutput: "[1,2,3,4]" },
        { input: "[2,7,4]\n181", expectedOutput: "[4,5,5]" },
        { input: "[9,9,9,9]\n1", expectedOutput: "[1,0,0,0,0]" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, 1, 12);
        const num = [ri(rng, 1, 9)];
        for (let i = 1; i < len; i++) num.push(ri(rng, 0, 9));
        if (rng() < 0.15) { num.length = 1; num[0] = 0; }
        const k = ri(rng, 1, 10000);
        return { input: `${fmtIntArr(num)}\n${k}`, expectedOutput: fmtIntArr(ref(num, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef addToArrayForm(num: List[int], k: int) -> List[int]:\n    out = []\n    carry = k\n    for i in range(len(num) - 1, -1, -1):\n        carry += num[i]\n        out.append(carry % 10)\n        carry //= 10\n    while carry > 0:\n        out.append(carry % 10)\n        carry //= 10\n    out.reverse()\n    return out`,
        javascript: `var addToArrayForm = function(num, k) {\n    const out = [];\n    let carry = k;\n    for (let i = num.length - 1; i >= 0; i--) {\n        carry += num[i];\n        out.push(carry % 10);\n        carry = Math.floor(carry / 10);\n    }\n    while (carry > 0) {\n        out.push(carry % 10);\n        carry = Math.floor(carry / 10);\n    }\n    out.reverse();\n    return out;\n};`,
        typescript: `function addToArrayForm(num: number[], k: number): number[] {\n    var out: number[] = [];\n    var carry = k;\n    for (var i = num.length - 1; i >= 0; i--) {\n        carry += num[i];\n        out.push(carry % 10);\n        carry = Math.floor(carry / 10);\n    }\n    while (carry > 0) {\n        out.push(carry % 10);\n        carry = Math.floor(carry / 10);\n    }\n    out.reverse();\n    return out;\n}`,
        java: `public static int[] addToArrayForm(int[] num, int k) {\n    ArrayList<Integer> out = new ArrayList<>();\n    long carry = k;\n    for (int i = num.length - 1; i >= 0; i--) {\n        carry += num[i];\n        out.add((int) (carry % 10));\n        carry /= 10;\n    }\n    while (carry > 0) {\n        out.add((int) (carry % 10));\n        carry /= 10;\n    }\n    int m = out.size();\n    int[] res = new int[m];\n    for (int i = 0; i < m; i++) res[i] = out.get(m - 1 - i);\n    return res;\n}`,
        cpp: `vector<int> addToArrayForm(vector<int>& num, int k) {\n    vector<int> out;\n    long long carry = k;\n    for (int i = (int) num.size() - 1; i >= 0; i--) {\n        carry += num[i];\n        out.push_back((int) (carry % 10));\n        carry /= 10;\n    }\n    while (carry > 0) {\n        out.push_back((int) (carry % 10));\n        carry /= 10;\n    }\n    reverse(out.begin(), out.end());\n    return out;\n}`,
        c: `int* addToArrayForm(int* num, int numSize, int k, int* returnSize) {\n    int cap = numSize + 8;\n    int* tmp = (int*) malloc(cap * sizeof(int));\n    int m = 0;\n    long long carry = k;\n    for (int i = numSize - 1; i >= 0; i--) {\n        carry += num[i];\n        tmp[m++] = (int) (carry % 10);\n        carry /= 10;\n    }\n    while (carry > 0) {\n        tmp[m++] = (int) (carry % 10);\n        carry /= 10;\n    }\n    int* out = (int*) malloc((m > 0 ? m : 1) * sizeof(int));\n    for (int i = 0; i < m; i++) out[i] = tmp[m - 1 - i];\n    free(tmp);\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[] AddToArrayForm(int[] num, int k)\n{\n    var out_ = new List<int>();\n    long carry = k;\n    for (int i = num.Length - 1; i >= 0; i--)\n    {\n        carry += num[i];\n        out_.Add((int) (carry % 10));\n        carry /= 10;\n    }\n    while (carry > 0)\n    {\n        out_.Add((int) (carry % 10));\n        carry /= 10;\n    }\n    out_.Reverse();\n    return out_.ToArray();\n}`,
        go: `func addToArrayForm(num []int, k int) []int {\n\tout := []int{}\n\tcarry := k\n\tfor i := len(num) - 1; i >= 0; i-- {\n\t\tcarry += num[i]\n\t\tout = append(out, carry%10)\n\t\tcarry /= 10\n\t}\n\tfor carry > 0 {\n\t\tout = append(out, carry%10)\n\t\tcarry /= 10\n\t}\n\tfor i, j := 0, len(out)-1; i < j; i, j = i+1, j-1 {\n\t\tout[i], out[j] = out[j], out[i]\n\t}\n\treturn out\n}`,
        kotlin: `fun addToArrayForm(num: IntArray, k: Int): IntArray {\n    val out = ArrayList<Int>()\n    var carry = k.toLong()\n    for (i in num.indices.reversed()) {\n        carry += num[i]\n        out.add((carry % 10).toInt())\n        carry /= 10\n    }\n    while (carry > 0) {\n        out.add((carry % 10).toInt())\n        carry /= 10\n    }\n    out.reverse()\n    return out.toIntArray()\n}`,
        swift: `func addToArrayForm(_ num: [Int], _ k: Int) -> [Int] {\n    var out: [Int] = []\n    var carry = k\n    var i = num.count - 1\n    while i >= 0 {\n        carry += num[i]\n        out.append(carry % 10)\n        carry /= 10\n        i -= 1\n    }\n    while carry > 0 {\n        out.append(carry % 10)\n        carry /= 10\n    }\n    out.reverse()\n    return out\n}`,
        rust: `fn addToArrayForm(num: Vec<i32>, k: i32) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    let mut carry: i64 = k as i64;\n    for i in (0..num.len()).rev() {\n        carry += num[i] as i64;\n        out.push((carry % 10) as i32);\n        carry /= 10;\n    }\n    while carry > 0 {\n        out.push((carry % 10) as i32);\n        carry /= 10;\n    }\n    out.reverse();\n    out\n}`,
        php: `function addToArrayForm($num, $k) {\n    $out = array();\n    $carry = $k;\n    for ($i = count($num) - 1; $i >= 0; $i--) {\n        $carry += $num[$i];\n        $out[] = $carry % 10;\n        $carry = intdiv($carry, 10);\n    }\n    while ($carry > 0) {\n        $out[] = $carry % 10;\n        $carry = intdiv($carry, 10);\n    }\n    return array_reverse($out);\n}`,
        ruby: `def addToArrayForm(num, k)\n  out = []\n  carry = k\n  (num.length - 1).downto(0) do |i|\n    carry += num[i]\n    out << carry % 10\n    carry /= 10\n  end\n  while carry > 0\n    out << carry % 10\n    carry /= 10\n  end\n  out.reverse\nend`,
      },
    };
  })(),

  // ── Count of Matches in Tournament (LC 1688) ────────────────────
  (() => {
    const ref = (n: number) => n - 1;
    return {
      slug: "count-of-matches-in-tournament",
      title: "Count of Matches in Tournament",
      difficulty: "EASY" as const,
      tags: ["Math", "Simulation", "LeetCode 1688", "Amazon", "TCS"],
      signature: { funcName: "numberOfMatches", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A tournament starts with `n` teams and runs in rounds:\n\n- If the current number of teams is **even**, they pair up: `n/2` matches are played and `n/2` teams advance.\n- If it is **odd**, one team gets a bye: `(n-1)/2` matches are played and `(n-1)/2 + 1` teams advance.\n\nReturn the total number of matches played until one winner remains.",
        [
          { in: "n = 7", out: "6", note: "3 + 2 + 1 = 6 matches across the rounds." },
          { in: "n = 14", out: "13" },
          { in: "n = 1", out: "0", note: "One team is already the winner." },
        ],
        ["1 <= n <= 200"]),
      hints: [
        "Simulating the rounds works, but try tracking what each match accomplishes.",
        "Every match eliminates exactly one team, and byes eliminate nobody.",
        "To go from `n` teams to 1 winner, exactly `n - 1` teams must be eliminated.",
      ],
      editorial: explain({
        idea: "Count eliminations rather than rounds. Each match removes exactly one team and a bye removes none, so reaching a single winner takes precisely `n - 1` matches.",
        steps: [
          "Observe that a match always eliminates one team.",
          "The tournament ends with 1 team standing, so `n - 1` teams are eliminated in total.",
          "Return `n - 1`.",
        ],
        why: "The elimination count is invariant to how the byes fall — whether `n` is odd or even only affects how the matches are grouped into rounds, never the total. Simulation confirms it: 7 → 3 + 2 + 1 = 6 = 7 - 1.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Simulating is also correct and O(log n); the closed form is just simpler.",
          "`n = 1` must answer 0, which `n - 1` handles.",
        ],
      }),
      examples: [
        { input: "7", expectedOutput: "6" },
        { input: "14", expectedOutput: "13" },
        { input: "1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 200);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def numberOfMatches(n: int) -> int:\n    return n - 1`,
        javascript: `var numberOfMatches = function(n) {\n    return n - 1;\n};`,
        typescript: `function numberOfMatches(n: number): number {\n    return n - 1;\n}`,
        java: `public static int numberOfMatches(int n) {\n    return n - 1;\n}`,
        cpp: `int numberOfMatches(int n) {\n    return n - 1;\n}`,
        c: `int numberOfMatches(int n) {\n    return n - 1;\n}`,
        csharp: `public static int NumberOfMatches(int n)\n{\n    return n - 1;\n}`,
        go: `func numberOfMatches(n int) int {\n\treturn n - 1\n}`,
        kotlin: `fun numberOfMatches(n: Int): Int {\n    return n - 1\n}`,
        swift: `func numberOfMatches(_ n: Int) -> Int {\n    return n - 1\n}`,
        rust: `fn numberOfMatches(n: i32) -> i32 {\n    n - 1\n}`,
        php: `function numberOfMatches($n) {\n    return $n - 1;\n}`,
        ruby: `def numberOfMatches(n)\n  n - 1\nend`,
      },
    };
  })(),

  // ── Number of Steps to Reduce a Number in Binary to One (LC 1404)
  (() => {
    const ref = (s: string) => {
      let steps = 0, carry = 0;
      for (let i = s.length - 1; i >= 1; i--) {
        const bit = Number(s[i]) + carry;
        if (bit === 1) { steps += 2; carry = 1; }
        else { steps += 1; carry = bit === 2 ? 1 : 0; }
      }
      return steps + carry;
    };
    return {
      slug: "number-of-steps-to-reduce-a-number-in-binary-representation-to-one",
      title: "Number of Steps to Reduce a Number in Binary Representation to One",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Bit Manipulation", "Simulation", "LeetCode 1404", "Amazon", "Google"],
      signature: { funcName: "numSteps", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given the binary representation of an integer as a string `s`.\n\nReduce it to `1` using these steps:\n\n- If the number is **even**, divide it by 2.\n- If it is **odd**, add 1 to it.\n\nReturn the number of steps required. The input is guaranteed to have no leading zeros other than the number `\"1\"` itself.",
        [
          { in: 's = "1101"', out: "6", note: "13 → 14 → 7 → 8 → 4 → 2 → 1." },
          { in: 's = "10"', out: "1", note: "2 → 1." },
          { in: 's = "1"', out: "0" },
        ],
        ["1 <= s.length <= 500", "s consists of characters '0' and '1'.", "s[0] is '1'."]),
      hints: [
        "The number can be 500 bits long, so it will not fit in any built-in integer type.",
        "Work on the bit string from the least significant end, carrying as in binary addition.",
        "A 0 bit costs one step (a division); a 1 bit costs two (an addition then a division) and sets a carry.",
      ],
      editorial: explain({
        idea: "Process the bits right to left with a carry. Each bit's cost is determined locally: dividing shifts the string right by one, and adding 1 to an odd number propagates a carry leftward.",
        steps: [
          "Start with `steps = 0` and `carry = 0`, and walk `i` from the last index down to index 1.",
          "Let `bit = s[i] + carry`. If `bit == 1` the number is odd: add 1 (one step) then divide (another step), so add 2 to `steps` and set `carry = 1`.",
          "Otherwise the number is even: add 1 step for the division, and set `carry = 1` only if `bit == 2` (a 1 plus an incoming carry).",
          "After the loop, add `carry` — a final carry means the leading 1 became `10`, which needs one more division.",
        ],
        why: "Dividing by two is exactly dropping the last bit, so sweeping right to left visits the bits in the order the algorithm consumes them. The carry encodes the pending `+1` from the most recent odd step, which is precisely how binary addition propagates.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Parsing the string into an integer overflows for anything past 64 bits.",
          "Forgetting the trailing `+ carry` undercounts whenever the final carry reaches the leading bit.",
          "The loop must stop at index 1, not 0 — the leading bit is handled by the carry term.",
        ],
      }),
      examples: [
        { input: '"1101"', expectedOutput: "6" },
        { input: '"10"', expectedOutput: "1" },
        { input: '"1"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, 1, 30);
        let s = "1";
        for (let i = 1; i < len; i++) s += String(ri(rng, 0, 1));
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def numSteps(s: str) -> int:\n    steps = 0\n    carry = 0\n    for i in range(len(s) - 1, 0, -1):\n        bit = int(s[i]) + carry\n        if bit == 1:\n            steps += 2\n            carry = 1\n        else:\n            steps += 1\n            carry = 1 if bit == 2 else 0\n    return steps + carry`,
        javascript: `var numSteps = function(s) {\n    let steps = 0, carry = 0;\n    for (let i = s.length - 1; i >= 1; i--) {\n        const bit = Number(s.charAt(i)) + carry;\n        if (bit === 1) {\n            steps += 2;\n            carry = 1;\n        } else {\n            steps += 1;\n            carry = bit === 2 ? 1 : 0;\n        }\n    }\n    return steps + carry;\n};`,
        typescript: `function numSteps(s: string): number {\n    var steps = 0, carry = 0;\n    for (var i = s.length - 1; i >= 1; i--) {\n        var bit = Number(s.charAt(i)) + carry;\n        if (bit === 1) {\n            steps += 2;\n            carry = 1;\n        } else {\n            steps += 1;\n            carry = bit === 2 ? 1 : 0;\n        }\n    }\n    return steps + carry;\n}`,
        java: `public static int numSteps(String s) {\n    int steps = 0, carry = 0;\n    for (int i = s.length() - 1; i >= 1; i--) {\n        int bit = (s.charAt(i) - '0') + carry;\n        if (bit == 1) {\n            steps += 2;\n            carry = 1;\n        } else {\n            steps += 1;\n            carry = bit == 2 ? 1 : 0;\n        }\n    }\n    return steps + carry;\n}`,
        cpp: `int numSteps(string s) {\n    int steps = 0, carry = 0;\n    for (int i = (int) s.size() - 1; i >= 1; i--) {\n        int bit = (s[i] - '0') + carry;\n        if (bit == 1) {\n            steps += 2;\n            carry = 1;\n        } else {\n            steps += 1;\n            carry = bit == 2 ? 1 : 0;\n        }\n    }\n    return steps + carry;\n}`,
        c: `int numSteps(const char* s) {\n    int n = (int) strlen(s);\n    int steps = 0, carry = 0;\n    for (int i = n - 1; i >= 1; i--) {\n        int bit = (s[i] - '0') + carry;\n        if (bit == 1) {\n            steps += 2;\n            carry = 1;\n        } else {\n            steps += 1;\n            carry = bit == 2 ? 1 : 0;\n        }\n    }\n    return steps + carry;\n}`,
        csharp: `public static int NumSteps(string s)\n{\n    int steps = 0, carry = 0;\n    for (int i = s.Length - 1; i >= 1; i--)\n    {\n        int bit = (s[i] - '0') + carry;\n        if (bit == 1)\n        {\n            steps += 2;\n            carry = 1;\n        }\n        else\n        {\n            steps += 1;\n            carry = bit == 2 ? 1 : 0;\n        }\n    }\n    return steps + carry;\n}`,
        go: `func numSteps(s string) int {\n\tsteps, carry := 0, 0\n\tfor i := len(s) - 1; i >= 1; i-- {\n\t\tbit := int(s[i]-'0') + carry\n\t\tif bit == 1 {\n\t\t\tsteps += 2\n\t\t\tcarry = 1\n\t\t} else {\n\t\t\tsteps++\n\t\t\tif bit == 2 {\n\t\t\t\tcarry = 1\n\t\t\t} else {\n\t\t\t\tcarry = 0\n\t\t\t}\n\t\t}\n\t}\n\treturn steps + carry\n}`,
        kotlin: `fun numSteps(s: String): Int {\n    var steps = 0\n    var carry = 0\n    for (i in s.length - 1 downTo 1) {\n        val bit = (s[i] - '0') + carry\n        if (bit == 1) {\n            steps += 2\n            carry = 1\n        } else {\n            steps += 1\n            carry = if (bit == 2) 1 else 0\n        }\n    }\n    return steps + carry\n}`,
        swift: `func numSteps(_ s: String) -> Int {\n    let a = Array(s.unicodeScalars).map { Int($0.value) - 48 }\n    var steps = 0\n    var carry = 0\n    var i = a.count - 1\n    while i >= 1 {\n        let bit = a[i] + carry\n        if bit == 1 {\n            steps += 2\n            carry = 1\n        } else {\n            steps += 1\n            carry = bit == 2 ? 1 : 0\n        }\n        i -= 1\n    }\n    return steps + carry\n}`,
        rust: `fn numSteps(s: String) -> i32 {\n    let a = s.as_bytes();\n    let mut steps = 0;\n    let mut carry = 0;\n    let mut i = a.len();\n    while i > 1 {\n        i -= 1;\n        let bit = (a[i] - b'0') as i32 + carry;\n        if bit == 1 {\n            steps += 2;\n            carry = 1;\n        } else {\n            steps += 1;\n            carry = if bit == 2 { 1 } else { 0 };\n        }\n    }\n    steps + carry\n}`,
        php: `function numSteps($s) {\n    $steps = 0;\n    $carry = 0;\n    for ($i = strlen($s) - 1; $i >= 1; $i--) {\n        $bit = intval($s[$i]) + $carry;\n        if ($bit === 1) {\n            $steps += 2;\n            $carry = 1;\n        } else {\n            $steps += 1;\n            $carry = $bit === 2 ? 1 : 0;\n        }\n    }\n    return $steps + $carry;\n}`,
        ruby: `def numSteps(s)\n  steps = 0\n  carry = 0\n  (s.length - 1).downto(1) do |i|\n    bit = s[i].to_i + carry\n    if bit == 1\n      steps += 2\n      carry = 1\n    else\n      steps += 1\n      carry = bit == 2 ? 1 : 0\n    end\n  end\n  steps + carry\nend`,
      },
    };
  })(),

  // ── Minimum Sum of Four Digit Number After Splitting (LC 2160) ──
  (() => {
    const ref = (num: number) => {
      const d = String(num).split("").map(Number).sort((a, b) => a - b);
      return (d[0] * 10 + d[2]) + (d[1] * 10 + d[3]);
    };
    return {
      slug: "minimum-sum-of-four-digit-number-after-splitting-digits",
      title: "Minimum Sum of Four Digit Number After Splitting Digits",
      difficulty: "EASY" as const,
      tags: ["Math", "Greedy", "Sorting", "LeetCode 2160", "Amazon", "Adobe"],
      signature: { funcName: "minimumSum", params: [{ name: "num", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a four-digit integer `num`. Split its digits into two new integers `new1` and `new2`, using **all four digits** exactly once between them.\n\nLeading zeros are allowed, and a new integer may have one or two digits. Return the minimum possible value of `new1 + new2`.",
        [
          { in: "num = 2932", out: "52", note: "Split into 29 and 23 → 52. (Digits sorted: 2,2,3,9 → 23 + 29.)" },
          { in: "num = 4009", out: "13", note: "Split into 04 and 09 → 4 + 9 = 13." },
          { in: "num = 1111", out: "22" },
        ],
        ["1000 <= num <= 9999"]),
      hints: [
        "Both new numbers should have two digits — putting three digits in one number wastes a hundreds place.",
        "The two smallest digits belong in the tens places; the two largest go in the units places.",
        "Sort the four digits and pair them crosswise.",
      ],
      editorial: explain({
        idea: "The sum is `10·(two tens digits) + (two units digits)`, so the tens places should hold the two smallest digits. Sorting makes the assignment obvious.",
        steps: [
          "Extract the four digits and sort them ascending as `d0 <= d1 <= d2 <= d3`.",
          "Form `new1 = d0·10 + d2` and `new2 = d1·10 + d3`.",
          "Return their sum, which equals `10·(d0 + d1) + (d2 + d3)`.",
        ],
        why: "Whatever the split, the sum is ten times the digits placed in tens positions plus the digits placed in units positions. Minimising it means putting the two smallest digits in the tens positions — and any pairing of the remaining two into the units positions gives the same total.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Splitting as a three-digit and a one-digit number is always worse — the hundreds place multiplies a digit by 100.",
          "Pairing as `d0·10 + d1` and `d2·10 + d3` puts a large digit in a tens place and overshoots.",
          "Leading zeros are explicitly allowed, so `04` is a valid two-digit choice worth 4.",
        ],
      }),
      examples: [
        { input: "2932", expectedOutput: "52" },
        { input: "4009", expectedOutput: "13" },
        { input: "1111", expectedOutput: "22" },
      ],
      gen: (rng: Rng) => {
        const num = ri(rng, 1000, 9999);
        return { input: String(num), expectedOutput: String(ref(num)) };
      },
      solutions: {
        python: `def minimumSum(num: int) -> int:\n    d = sorted(int(c) for c in str(num))\n    return (d[0] * 10 + d[2]) + (d[1] * 10 + d[3])`,
        javascript: `var minimumSum = function(num) {\n    const d = String(num).split("").map(Number).sort(function(a, b) { return a - b; });\n    return (d[0] * 10 + d[2]) + (d[1] * 10 + d[3]);\n};`,
        typescript: `function minimumSum(num: number): number {\n    var d = String(num).split("").map(Number).sort(function(a, b) { return a - b; });\n    return (d[0] * 10 + d[2]) + (d[1] * 10 + d[3]);\n}`,
        java: `public static int minimumSum(int num) {\n    int[] d = new int[4];\n    for (int i = 0; i < 4; i++) { d[i] = num % 10; num /= 10; }\n    Arrays.sort(d);\n    return (d[0] * 10 + d[2]) + (d[1] * 10 + d[3]);\n}`,
        cpp: `int minimumSum(int num) {\n    vector<int> d(4);\n    for (int i = 0; i < 4; i++) { d[i] = num % 10; num /= 10; }\n    sort(d.begin(), d.end());\n    return (d[0] * 10 + d[2]) + (d[1] * 10 + d[3]);\n}`,
        c: `static int cmpAscMinSum(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint minimumSum(int num) {\n    int d[4];\n    for (int i = 0; i < 4; i++) { d[i] = num % 10; num /= 10; }\n    qsort(d, 4, sizeof(int), cmpAscMinSum);\n    return (d[0] * 10 + d[2]) + (d[1] * 10 + d[3]);\n}`,
        csharp: `public static int MinimumSum(int num)\n{\n    int[] d = new int[4];\n    for (int i = 0; i < 4; i++) { d[i] = num % 10; num /= 10; }\n    Array.Sort(d);\n    return (d[0] * 10 + d[2]) + (d[1] * 10 + d[3]);\n}`,
        go: `func minimumSum(num int) int {\n\td := make([]int, 4)\n\tfor i := 0; i < 4; i++ {\n\t\td[i] = num % 10\n\t\tnum /= 10\n\t}\n\tsort.Ints(d)\n\treturn (d[0]*10 + d[2]) + (d[1]*10 + d[3])\n}`,
        kotlin: `fun minimumSum(num: Int): Int {\n    var n = num\n    val d = IntArray(4)\n    for (i in 0 until 4) {\n        d[i] = n % 10\n        n /= 10\n    }\n    d.sort()\n    return (d[0] * 10 + d[2]) + (d[1] * 10 + d[3])\n}`,
        swift: `func minimumSum(_ num: Int) -> Int {\n    var n = num\n    var d: [Int] = []\n    for _ in 0..<4 {\n        d.append(n % 10)\n        n /= 10\n    }\n    d.sort()\n    return (d[0] * 10 + d[2]) + (d[1] * 10 + d[3])\n}`,
        rust: `fn minimumSum(num: i32) -> i32 {\n    let mut n = num;\n    let mut d = vec![0i32; 4];\n    for i in 0..4 {\n        d[i] = n % 10;\n        n /= 10;\n    }\n    d.sort();\n    (d[0] * 10 + d[2]) + (d[1] * 10 + d[3])\n}`,
        php: `function minimumSum($num) {\n    $d = array();\n    for ($i = 0; $i < 4; $i++) {\n        $d[] = $num % 10;\n        $num = intdiv($num, 10);\n    }\n    sort($d);\n    return ($d[0] * 10 + $d[2]) + ($d[1] * 10 + $d[3]);\n}`,
        ruby: `def minimumSum(num)\n  d = num.to_s.chars.map(&:to_i).sort\n  (d[0] * 10 + d[2]) + (d[1] * 10 + d[3])\nend`,
      },
    };
  })(),

  // ── Three Divisors (LC 1952) ────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let count = 0;
      for (let d = 1; d * d <= n; d++) {
        if (n % d === 0) {
          count += d * d === n ? 1 : 2;
          if (count > 3) return false;
        }
      }
      return count === 3;
    };
    return {
      slug: "three-divisors",
      title: "Three Divisors",
      difficulty: "EASY" as const,
      tags: ["Math", "Number Theory", "LeetCode 1952", "Amazon", "TCS"],
      signature: { funcName: "isThree", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given an integer `n`, return `true` if it has **exactly three** positive divisors, and `false` otherwise.",
        [
          { in: "n = 2", out: "false", note: "Its divisors are 1 and 2." },
          { in: "n = 4", out: "true", note: "Its divisors are 1, 2 and 4." },
          { in: "n = 9", out: "true" },
        ],
        ["1 <= n <= 10000"]),
      hints: [
        "Counting divisors up to `sqrt(n)` is enough — divisors come in pairs.",
        "Remember that a perfect square's square root pairs with itself and must be counted once.",
        "Which numbers have exactly three divisors? Look at the answer's shape.",
      ],
      editorial: explain({
        idea: "Divisors pair up as `d` and `n/d`, so counting up to `sqrt(n)` covers them all. The characterisation, if you want it: exactly the squares of primes have three divisors.",
        steps: [
          "Loop `d` from 1 while `d * d <= n`.",
          "When `d` divides `n`, add 2 to the count — or 1 when `d * d == n`, since the pair collapses.",
          "Bail out early once the count exceeds 3.",
          "Return whether the final count is exactly 3.",
        ],
        why: "`n = p²` for prime `p` has divisors `1, p, p²` — exactly three. Any other form has either fewer (1 or a prime) or more (a composite with two distinct prime factors, or a higher prime power).",
        time: "O(sqrt(n))",
        space: "O(1)",
        pitfalls: [
          "Double-counting the square root turns 4 and 9 into four-divisor numbers.",
          "Looping all the way to `n` is 10,000 iterations here — fine, but the sqrt bound is the right habit.",
          "`n = 1` has a single divisor and must return `false`.",
        ],
      }),
      examples: [
        { input: "2", expectedOutput: "false" },
        { input: "4", expectedOutput: "true" },
        { input: "9", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        let n: number;
        if (rng() < 0.35) {
          const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
          const p = primes[ri(rng, 0, primes.length - 1)];
          n = p * p;
        } else {
          n = ri(rng, 1, 10000);
        }
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def isThree(n: int) -> bool:\n    count = 0\n    d = 1\n    while d * d <= n:\n        if n % d == 0:\n            count += 1 if d * d == n else 2\n            if count > 3:\n                return False\n        d += 1\n    return count == 3`,
        javascript: `var isThree = function(n) {\n    let count = 0;\n    for (let d = 1; d * d <= n; d++) {\n        if (n % d === 0) {\n            count += d * d === n ? 1 : 2;\n            if (count > 3) return false;\n        }\n    }\n    return count === 3;\n};`,
        typescript: `function isThree(n: number): boolean {\n    var count = 0;\n    for (var d = 1; d * d <= n; d++) {\n        if (n % d === 0) {\n            count += d * d === n ? 1 : 2;\n            if (count > 3) return false;\n        }\n    }\n    return count === 3;\n}`,
        java: `public static boolean isThree(int n) {\n    int count = 0;\n    for (int d = 1; d * d <= n; d++) {\n        if (n % d == 0) {\n            count += d * d == n ? 1 : 2;\n            if (count > 3) return false;\n        }\n    }\n    return count == 3;\n}`,
        cpp: `bool isThree(int n) {\n    int count = 0;\n    for (int d = 1; d * d <= n; d++) {\n        if (n % d == 0) {\n            count += d * d == n ? 1 : 2;\n            if (count > 3) return false;\n        }\n    }\n    return count == 3;\n}`,
        c: `bool isThree(int n) {\n    int count = 0;\n    for (int d = 1; d * d <= n; d++) {\n        if (n % d == 0) {\n            count += (d * d == n) ? 1 : 2;\n            if (count > 3) return false;\n        }\n    }\n    return count == 3;\n}`,
        csharp: `public static bool IsThree(int n)\n{\n    int count = 0;\n    for (int d = 1; d * d <= n; d++)\n    {\n        if (n % d == 0)\n        {\n            count += d * d == n ? 1 : 2;\n            if (count > 3) return false;\n        }\n    }\n    return count == 3;\n}`,
        go: `func isThree(n int) bool {\n\tcount := 0\n\tfor d := 1; d*d <= n; d++ {\n\t\tif n%d == 0 {\n\t\t\tif d*d == n {\n\t\t\t\tcount++\n\t\t\t} else {\n\t\t\t\tcount += 2\n\t\t\t}\n\t\t\tif count > 3 {\n\t\t\t\treturn false\n\t\t\t}\n\t\t}\n\t}\n\treturn count == 3\n}`,
        kotlin: `fun isThree(n: Int): Boolean {\n    var count = 0\n    var d = 1\n    while (d * d <= n) {\n        if (n % d == 0) {\n            count += if (d * d == n) 1 else 2\n            if (count > 3) return false\n        }\n        d++\n    }\n    return count == 3\n}`,
        swift: `func isThree(_ n: Int) -> Bool {\n    var count = 0\n    var d = 1\n    while d * d <= n {\n        if n % d == 0 {\n            count += (d * d == n) ? 1 : 2\n            if count > 3 { return false }\n        }\n        d += 1\n    }\n    return count == 3\n}`,
        rust: `fn isThree(n: i32) -> bool {\n    let mut count = 0;\n    let mut d = 1;\n    while d * d <= n {\n        if n % d == 0 {\n            count += if d * d == n { 1 } else { 2 };\n            if count > 3 {\n                return false;\n            }\n        }\n        d += 1;\n    }\n    count == 3\n}`,
        php: `function isThree($n) {\n    $count = 0;\n    for ($d = 1; $d * $d <= $n; $d++) {\n        if ($n % $d === 0) {\n            $count += ($d * $d === $n) ? 1 : 2;\n            if ($count > 3) return false;\n        }\n    }\n    return $count === 3;\n}`,
        ruby: `def isThree(n)\n  count = 0\n  d = 1\n  while d * d <= n\n    if n % d == 0\n      count += (d * d == n) ? 1 : 2\n      return false if count > 3\n    end\n    d += 1\n  end\n  count == 3\nend`,
      },
    };
  })(),

  // ── Sum of Digits of String After Convert (LC 1945) ─────────────
  (() => {
    const ref = (s: string, k: number) => {
      let digits = "";
      for (const c of s) digits += String(c.charCodeAt(0) - 96);
      let n = 0;
      for (let step = 0; step < k; step++) {
        n = 0;
        for (const d of digits) n += d.charCodeAt(0) - 48;
        digits = String(n);
      }
      return n;
    };
    return {
      slug: "sum-of-digits-of-string-after-convert",
      title: "Sum of Digits of String After Convert",
      difficulty: "EASY" as const,
      tags: ["String", "Simulation", "LeetCode 1945", "Amazon", "Adobe"],
      signature: {
        funcName: "getLucky",
        params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Convert a string `s` to an integer by replacing each letter with its position in the alphabet (`a` → 1, `b` → 2, …, `z` → 26) and concatenating the results.\n\nThen **transform** the number `k` times, where one transform replaces it with the sum of its digits.\n\nReturn the resulting integer.",
        [
          { in: 's = "iiii", k = 1', out: "36", note: '"iiii" becomes "9999", whose digits sum to 36.' },
          { in: 's = "leetcode", k = 2', out: "6", note: '"leetcode" → 12552031545 → 33 → 6.' },
          { in: 's = "zbax", k = 2', out: "8" },
        ],
        ["1 <= s.length <= 100", "1 <= k <= 10", "s consists of lowercase English letters."]),
      hints: [
        "Build the converted value as a **string**, not a number — it can be 200 digits long.",
        "The first digit sum collapses it to a small integer immediately.",
        "After that, each further transform is a plain digit sum of a small number.",
      ],
      editorial: explain({
        idea: "Only the first transform faces a huge number, and it is applied to a string of digits. Everything after that operates on values below 1000, so ordinary integers suffice.",
        steps: [
          "Map each letter to `c - 'a' + 1` and append its decimal digits to a string.",
          "Repeat `k` times: sum the characters of the current digit string, then replace the string with the sum's decimal form.",
          "Return the final sum.",
        ],
        why: "A 100-letter string converts to at most 200 digits, so the first digit sum is at most 1800 — small enough that every later transform is trivial. Working on the string sidesteps the overflow entirely.",
        time: "O(n + k log n)",
        space: "O(n)",
        pitfalls: [
          "Parsing the converted string into an integer overflows for inputs longer than about 10 letters.",
          "A two-digit letter value such as `z` → 26 contributes **two** digits to the string.",
          "`k` transforms are always applied, even once the value is a single digit.",
        ],
      }),
      examples: [
        { input: '"iiii"\n1', expectedOutput: "36" },
        { input: '"leetcode"\n2', expectedOutput: "6" },
        { input: '"zbax"\n2', expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 30);
        const k = ri(rng, 1, 10);
        return { input: `${JSON.stringify(s)}\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: `def getLucky(s: str, k: int) -> int:\n    digits = ''.join(str(ord(c) - 96) for c in s)\n    n = 0\n    for _ in range(k):\n        n = sum(int(d) for d in digits)\n        digits = str(n)\n    return n`,
        javascript: `var getLucky = function(s, k) {\n    let digits = "";\n    for (let i = 0; i < s.length; i++) digits += String(s.charCodeAt(i) - 96);\n    let n = 0;\n    for (let step = 0; step < k; step++) {\n        n = 0;\n        for (let i = 0; i < digits.length; i++) n += digits.charCodeAt(i) - 48;\n        digits = String(n);\n    }\n    return n;\n};`,
        typescript: `function getLucky(s: string, k: number): number {\n    var digits = "";\n    for (var i = 0; i < s.length; i++) digits += String(s.charCodeAt(i) - 96);\n    var n = 0;\n    for (var step = 0; step < k; step++) {\n        n = 0;\n        for (var j = 0; j < digits.length; j++) n += digits.charCodeAt(j) - 48;\n        digits = String(n);\n    }\n    return n;\n}`,
        java: `public static int getLucky(String s, int k) {\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < s.length(); i++) sb.append(s.charAt(i) - 96);\n    String digits = sb.toString();\n    int n = 0;\n    for (int step = 0; step < k; step++) {\n        n = 0;\n        for (int i = 0; i < digits.length(); i++) n += digits.charAt(i) - '0';\n        digits = Integer.toString(n);\n    }\n    return n;\n}`,
        cpp: `int getLucky(string s, int k) {\n    string digits;\n    for (char c : s) digits += to_string((int) c - 96);\n    int n = 0;\n    for (int step = 0; step < k; step++) {\n        n = 0;\n        for (char d : digits) n += d - '0';\n        digits = to_string(n);\n    }\n    return n;\n}`,
        c: `int getLucky(const char* s, int k) {\n    char digits[256];\n    int pos = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        int v = s[i] - 96;\n        if (v >= 10) digits[pos++] = (char) ('0' + v / 10);\n        digits[pos++] = (char) ('0' + v % 10);\n    }\n    digits[pos] = '\\0';\n    int n = 0;\n    for (int step = 0; step < k; step++) {\n        n = 0;\n        for (int i = 0; digits[i] != '\\0'; i++) n += digits[i] - '0';\n        sprintf(digits, "%d", n);\n    }\n    return n;\n}`,
        csharp: `public static int GetLucky(string s, int k)\n{\n    var sb = new System.Text.StringBuilder();\n    foreach (char c in s) sb.Append(c - 96);\n    string digits = sb.ToString();\n    int n = 0;\n    for (int step = 0; step < k; step++)\n    {\n        n = 0;\n        foreach (char d in digits) n += d - '0';\n        digits = n.ToString();\n    }\n    return n;\n}`,
        go: `func getLucky(s string, k int) int {\n\tdigits := ""\n\tfor i := 0; i < len(s); i++ {\n\t\tdigits += strconv.Itoa(int(s[i]) - 96)\n\t}\n\tn := 0\n\tfor step := 0; step < k; step++ {\n\t\tn = 0\n\t\tfor i := 0; i < len(digits); i++ {\n\t\t\tn += int(digits[i] - '0')\n\t\t}\n\t\tdigits = strconv.Itoa(n)\n\t}\n\treturn n\n}`,
        kotlin: `fun getLucky(s: String, k: Int): Int {\n    val sb = StringBuilder()\n    for (c in s) sb.append(c.toInt() - 96)\n    var digits = sb.toString()\n    var n = 0\n    for (step in 0 until k) {\n        n = 0\n        for (d in digits) n += d - '0'\n        digits = n.toString()\n    }\n    return n\n}`,
        swift: `func getLucky(_ s: String, _ k: Int) -> Int {\n    var digits = ""\n    for u in s.unicodeScalars {\n        digits += String(Int(u.value) - 96)\n    }\n    var n = 0\n    for _ in 0..<k {\n        n = 0\n        for u in digits.unicodeScalars {\n            n += Int(u.value) - 48\n        }\n        digits = String(n)\n    }\n    return n\n}`,
        rust: `fn getLucky(s: String, k: i32) -> i32 {\n    let mut digits = String::new();\n    for b in s.bytes() {\n        digits.push_str(&((b as i32) - 96).to_string());\n    }\n    let mut n = 0;\n    for _ in 0..k {\n        n = 0;\n        for d in digits.bytes() {\n            n += (d - b'0') as i32;\n        }\n        digits = n.to_string();\n    }\n    n\n}`,
        php: `function getLucky($s, $k) {\n    $digits = "";\n    for ($i = 0; $i < strlen($s); $i++) {\n        $digits .= (string) (ord($s[$i]) - 96);\n    }\n    $n = 0;\n    for ($step = 0; $step < $k; $step++) {\n        $n = 0;\n        for ($i = 0; $i < strlen($digits); $i++) $n += ord($digits[$i]) - 48;\n        $digits = (string) $n;\n    }\n    return $n;\n}`,
        ruby: `def getLucky(s, k)\n  digits = s.each_char.map { |c| (c.ord - 96).to_s }.join\n  n = 0\n  k.times do\n    n = digits.each_char.map(&:to_i).sum\n    digits = n.to_s\n  end\n  n\nend`,
      },
    };
  })(),

  // ── Check if Number is a Sum of Powers of Three (LC 1780) ───────
  (() => {
    const ref = (n: number) => {
      while (n > 0) {
        if (n % 3 === 2) return false;
        n = Math.floor(n / 3);
      }
      return true;
    };
    return {
      slug: "check-if-number-is-a-sum-of-powers-of-three",
      title: "Check if Number is a Sum of Powers of Three",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Number Theory", "LeetCode 1780", "Amazon", "Google"],
      signature: { funcName: "checkPowersOfThree", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given an integer `n`, return `true` if it can be written as the sum of **distinct** powers of three.\n\nA power of three is `3^i` for some integer `i >= 0`.",
        [
          { in: "n = 12", out: "true", note: "12 = 3 + 9 = 3^1 + 3^2." },
          { in: "n = 91", out: "true", note: "91 = 1 + 9 + 81 = 3^0 + 3^2 + 3^4." },
          { in: "n = 21", out: "false" },
        ],
        ["1 <= n <= 10000000"]),
      hints: [
        "Write `n` in base 3 and look at its digits.",
        "Using a power at most once means every base-3 digit must be 0 or 1.",
        "So the answer is `false` exactly when some base-3 digit is 2.",
      ],
      editorial: explain({
        idea: "A sum of distinct powers of three is precisely a number whose base-3 representation uses only the digits 0 and 1 — the same way a sum of distinct powers of two is any number in binary.",
        steps: [
          "Repeatedly take `n % 3`.",
          "If the remainder is 2, the representation needs that power twice — return `false`.",
          "Otherwise divide `n` by 3 and continue.",
          "Return `true` once `n` reaches 0.",
        ],
        why: "Base-3 representations are unique, so if any digit is 2 there is no way to rewrite the number using each power at most once. Conversely, a representation of only 0s and 1s *is* a sum of distinct powers.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "A greedy subtraction of the largest power also works, but only because the digits are unique — it is easy to implement incorrectly.",
          "The loop must run until `n` is 0, not stop at the first non-zero remainder.",
        ],
      }),
      examples: [
        { input: "12", expectedOutput: "true" },
        { input: "91", expectedOutput: "true" },
        { input: "21", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        let n: number;
        if (rng() < 0.4) {
          n = 0;
          let p = 1;
          for (let i = 0; i < 12; i++) {
            if (rng() < 0.4) n += p;
            p *= 3;
            if (p > 10000000) break;
          }
          if (n === 0) n = 1;
        } else {
          n = ri(rng, 1, 10000000);
        }
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def checkPowersOfThree(n: int) -> bool:\n    while n > 0:\n        if n % 3 == 2:\n            return False\n        n //= 3\n    return True`,
        javascript: `var checkPowersOfThree = function(n) {\n    while (n > 0) {\n        if (n % 3 === 2) return false;\n        n = Math.floor(n / 3);\n    }\n    return true;\n};`,
        typescript: `function checkPowersOfThree(n: number): boolean {\n    while (n > 0) {\n        if (n % 3 === 2) return false;\n        n = Math.floor(n / 3);\n    }\n    return true;\n}`,
        java: `public static boolean checkPowersOfThree(int n) {\n    while (n > 0) {\n        if (n % 3 == 2) return false;\n        n /= 3;\n    }\n    return true;\n}`,
        cpp: `bool checkPowersOfThree(int n) {\n    while (n > 0) {\n        if (n % 3 == 2) return false;\n        n /= 3;\n    }\n    return true;\n}`,
        c: `bool checkPowersOfThree(int n) {\n    while (n > 0) {\n        if (n % 3 == 2) return false;\n        n /= 3;\n    }\n    return true;\n}`,
        csharp: `public static bool CheckPowersOfThree(int n)\n{\n    while (n > 0)\n    {\n        if (n % 3 == 2) return false;\n        n /= 3;\n    }\n    return true;\n}`,
        go: `func checkPowersOfThree(n int) bool {\n\tfor n > 0 {\n\t\tif n%3 == 2 {\n\t\t\treturn false\n\t\t}\n\t\tn /= 3\n\t}\n\treturn true\n}`,
        kotlin: `fun checkPowersOfThree(n: Int): Boolean {\n    var x = n\n    while (x > 0) {\n        if (x % 3 == 2) return false\n        x /= 3\n    }\n    return true\n}`,
        swift: `func checkPowersOfThree(_ n: Int) -> Bool {\n    var x = n\n    while x > 0 {\n        if x % 3 == 2 { return false }\n        x /= 3\n    }\n    return true\n}`,
        rust: `fn checkPowersOfThree(n: i32) -> bool {\n    let mut x = n;\n    while x > 0 {\n        if x % 3 == 2 {\n            return false;\n        }\n        x /= 3;\n    }\n    true\n}`,
        php: `function checkPowersOfThree($n) {\n    while ($n > 0) {\n        if ($n % 3 === 2) return false;\n        $n = intdiv($n, 3);\n    }\n    return true;\n}`,
        ruby: `def checkPowersOfThree(n)\n  while n > 0\n    return false if n % 3 == 2\n    n /= 3\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Sum of Digits in Base K (LC 1837) ───────────────────────────
  (() => {
    const ref = (n: number, k: number) => {
      let total = 0;
      while (n > 0) { total += n % k; n = Math.floor(n / k); }
      return total;
    };
    return {
      slug: "sum-of-digits-in-base-k",
      title: "Sum of Digits in Base K",
      difficulty: "EASY" as const,
      tags: ["Math", "LeetCode 1837", "Amazon", "Infosys"],
      signature: {
        funcName: "sumBase",
        params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given integers `n` and `k`, convert `n` to base `k` and return the **sum of its digits** after conversion.\n\nThe returned sum is expressed in base 10.",
        [
          { in: "n = 34, k = 6", out: "9", note: "34 in base 6 is 54, and 5 + 4 = 9." },
          { in: "n = 10, k = 10", out: "1", note: "The base is 10, so the digits are 1 and 0." },
          { in: "n = 7, k = 2", out: "3", note: "7 in binary is 111." },
        ],
        ["1 <= n <= 100", "2 <= k <= 10"]),
      hints: [
        "You never need to build the base-`k` string.",
        "Each `n % k` is one base-`k` digit; `n / k` drops it.",
        "Accumulate the remainders directly.",
      ],
      editorial: explain({
        idea: "Repeated division extracts base-`k` digits from the least significant end, so summing the remainders gives the digit sum without ever forming the representation.",
        steps: [
          "While `n > 0`, add `n % k` to a running total.",
          "Set `n = n / k` using integer division.",
          "Return the total.",
        ],
        why: "By definition `n = Σ d_i · k^i` with `0 <= d_i < k`, and `n % k` yields `d_0` while `n / k` shifts the remaining digits down — so the loop visits every digit exactly once.",
        time: "O(log_k n)",
        space: "O(1)",
        pitfalls: [
          "Converting to a string and summing characters works but is more code and needs digit-to-value care for bases above 10 (not an issue here, since `k <= 10`).",
          "Using floating-point division breaks the digit extraction.",
        ],
      }),
      examples: [
        { input: "34\n6", expectedOutput: "9" },
        { input: "10\n10", expectedOutput: "1" },
        { input: "7\n2", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 100);
        const k = ri(rng, 2, 10);
        return { input: `${n}\n${k}`, expectedOutput: String(ref(n, k)) };
      },
      solutions: {
        python: `def sumBase(n: int, k: int) -> int:\n    total = 0\n    while n > 0:\n        total += n % k\n        n //= k\n    return total`,
        javascript: `var sumBase = function(n, k) {\n    let total = 0;\n    while (n > 0) {\n        total += n % k;\n        n = Math.floor(n / k);\n    }\n    return total;\n};`,
        typescript: `function sumBase(n: number, k: number): number {\n    var total = 0;\n    while (n > 0) {\n        total += n % k;\n        n = Math.floor(n / k);\n    }\n    return total;\n}`,
        java: `public static int sumBase(int n, int k) {\n    int total = 0;\n    while (n > 0) {\n        total += n % k;\n        n /= k;\n    }\n    return total;\n}`,
        cpp: `int sumBase(int n, int k) {\n    int total = 0;\n    while (n > 0) {\n        total += n % k;\n        n /= k;\n    }\n    return total;\n}`,
        c: `int sumBase(int n, int k) {\n    int total = 0;\n    while (n > 0) {\n        total += n % k;\n        n /= k;\n    }\n    return total;\n}`,
        csharp: `public static int SumBase(int n, int k)\n{\n    int total = 0;\n    while (n > 0)\n    {\n        total += n % k;\n        n /= k;\n    }\n    return total;\n}`,
        go: `func sumBase(n int, k int) int {\n\ttotal := 0\n\tfor n > 0 {\n\t\ttotal += n % k\n\t\tn /= k\n\t}\n\treturn total\n}`,
        kotlin: `fun sumBase(n: Int, k: Int): Int {\n    var x = n\n    var total = 0\n    while (x > 0) {\n        total += x % k\n        x /= k\n    }\n    return total\n}`,
        swift: `func sumBase(_ n: Int, _ k: Int) -> Int {\n    var x = n\n    var total = 0\n    while x > 0 {\n        total += x % k\n        x /= k\n    }\n    return total\n}`,
        rust: `fn sumBase(n: i32, k: i32) -> i32 {\n    let mut x = n;\n    let mut total = 0;\n    while x > 0 {\n        total += x % k;\n        x /= k;\n    }\n    total\n}`,
        php: `function sumBase($n, $k) {\n    $total = 0;\n    while ($n > 0) {\n        $total += $n % $k;\n        $n = intdiv($n, $k);\n    }\n    return $total;\n}`,
        ruby: `def sumBase(n, k)\n  total = 0\n  while n > 0\n    total += n % k\n    n /= k\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Smallest Value of the Rearranged Number (LC 2165) ───────────
  (() => {
    const ref = (num: number) => {
      if (num === 0) return 0;
      const neg = num < 0;
      const digits = String(Math.abs(num)).split("").map(Number);
      if (neg) {
        digits.sort((a, b) => b - a);
        return -Number(digits.join(""));
      }
      digits.sort((a, b) => a - b);
      let firstNonZero = 0;
      while (firstNonZero < digits.length && digits[firstNonZero] === 0) firstNonZero++;
      if (firstNonZero < digits.length && firstNonZero > 0) {
        const t = digits[0];
        digits[0] = digits[firstNonZero];
        digits[firstNonZero] = t;
      }
      return Number(digits.join(""));
    };
    return {
      slug: "smallest-value-of-the-rearranged-number",
      title: "Smallest Value of the Rearranged Number",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Sorting", "LeetCode 2165", "Amazon", "Adobe"],
      signature: { funcName: "smallestNumber", params: [{ name: "num", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer `num`. Rearrange its digits to produce the **smallest** possible value, keeping the sign of `num`.\n\nThe result must not have leading zeros.",
        [
          { in: "num = 310", out: "103", note: "The rearrangements without a leading zero are 103, 130, 301, 310." },
          { in: "num = -7605", out: "-7650", note: "For a negative number, the largest digit arrangement gives the smallest value." },
          { in: "num = 0", out: "0" },
        ],
        ["-999999999 <= num <= 999999999"]),
      hints: [
        "Handle the sign first, then work with the digits of `|num|`.",
        "For a negative number, the smallest value comes from the **largest** digit arrangement — sort descending.",
        "For a positive number sort ascending, then swap the leading zero with the first non-zero digit.",
      ],
      editorial: explain({
        idea: "The sign flips the objective. For negatives, maximising the magnitude minimises the value; for positives, minimising the magnitude does — subject to the no-leading-zero rule.",
        steps: [
          "Return 0 immediately for `num == 0`.",
          "Take the digits of `|num|`.",
          "If `num < 0`, sort descending and negate the result — a leading zero cannot occur unless every digit is zero.",
          "If `num > 0`, sort ascending; if the first digit is 0, swap it with the first non-zero digit.",
          "Return the assembled number.",
        ],
        why: "Comparing two arrangements of the same multiset digit by digit, the smaller leading digit wins — so ascending order is optimal for positives, except that a leading zero is forbidden, and swapping in the smallest non-zero digit is the least damaging repair.",
        time: "O(d log d) in the digit count",
        space: "O(d)",
        pitfalls: [
          "Sorting ascending for a negative number gives the *largest* value, not the smallest.",
          "Sorting ascending for a positive number with a zero digit produces a leading zero, e.g. `310` → `013`.",
          "The swap must target the first **non-zero** digit, not simply index 1.",
        ],
      }),
      examples: [
        { input: "310", expectedOutput: "103" },
        { input: "-7605", expectedOutput: "-7650" },
        { input: "0", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        let num: number;
        if (roll < 0.08) num = 0;
        else if (roll < 0.5) num = -ri(rng, 1, 999999999);
        else num = ri(rng, 1, 999999999);
        return { input: String(num), expectedOutput: String(ref(num)) };
      },
      solutions: {
        python: `def smallestNumber(num: int) -> int:\n    if num == 0:\n        return 0\n    neg = num < 0\n    digits = sorted(str(abs(num)))\n    if neg:\n        digits.sort(reverse=True)\n        return -int(''.join(digits))\n    i = 0\n    while i < len(digits) and digits[i] == '0':\n        i += 1\n    if i > 0 and i < len(digits):\n        digits[0], digits[i] = digits[i], digits[0]\n    return int(''.join(digits))`,
        javascript: `var smallestNumber = function(num) {\n    if (num === 0) return 0;\n    const neg = num < 0;\n    const digits = String(Math.abs(num)).split("").map(Number);\n    if (neg) {\n        digits.sort(function(a, b) { return b - a; });\n        return -Number(digits.join(""));\n    }\n    digits.sort(function(a, b) { return a - b; });\n    let i = 0;\n    while (i < digits.length && digits[i] === 0) i++;\n    if (i > 0 && i < digits.length) {\n        const t = digits[0];\n        digits[0] = digits[i];\n        digits[i] = t;\n    }\n    return Number(digits.join(""));\n};`,
        typescript: `function smallestNumber(num: number): number {\n    if (num === 0) return 0;\n    var neg = num < 0;\n    var digits = String(Math.abs(num)).split("").map(Number);\n    if (neg) {\n        digits.sort(function(a, b) { return b - a; });\n        return -Number(digits.join(""));\n    }\n    digits.sort(function(a, b) { return a - b; });\n    var i = 0;\n    while (i < digits.length && digits[i] === 0) i++;\n    if (i > 0 && i < digits.length) {\n        var t = digits[0];\n        digits[0] = digits[i];\n        digits[i] = t;\n    }\n    return Number(digits.join(""));\n}`,
        java: `public static int smallestNumber(int num) {\n    if (num == 0) return 0;\n    boolean neg = num < 0;\n    char[] digits = Integer.toString(Math.abs(num)).toCharArray();\n    Arrays.sort(digits);\n    if (neg) {\n        StringBuilder sb = new StringBuilder(new String(digits)).reverse();\n        return -Integer.parseInt(sb.toString());\n    }\n    int i = 0;\n    while (i < digits.length && digits[i] == '0') i++;\n    if (i > 0 && i < digits.length) {\n        char t = digits[0];\n        digits[0] = digits[i];\n        digits[i] = t;\n    }\n    return Integer.parseInt(new String(digits));\n}`,
        cpp: `int smallestNumber(int num) {\n    if (num == 0) return 0;\n    bool neg = num < 0;\n    string digits = to_string(neg ? -(long long) num : (long long) num);\n    sort(digits.begin(), digits.end());\n    if (neg) {\n        reverse(digits.begin(), digits.end());\n        return -stoi(digits);\n    }\n    size_t i = 0;\n    while (i < digits.size() && digits[i] == '0') i++;\n    if (i > 0 && i < digits.size()) swap(digits[0], digits[i]);\n    return stoi(digits);\n}`,
        c: `static int cmpAscDigit(const void* a, const void* b) {\n    char x = *(const char*) a;\n    char y = *(const char*) b;\n    return (x > y) - (x < y);\n}\n\nint smallestNumber(int num) {\n    if (num == 0) return 0;\n    int neg = num < 0;\n    long long v = neg ? -(long long) num : (long long) num;\n    char digits[16];\n    sprintf(digits, "%lld", v);\n    int len = (int) strlen(digits);\n    qsort(digits, len, sizeof(char), cmpAscDigit);\n    if (neg) {\n        for (int i = 0, j = len - 1; i < j; i++, j--) {\n            char t = digits[i];\n            digits[i] = digits[j];\n            digits[j] = t;\n        }\n        return -(int) atoll(digits);\n    }\n    int i = 0;\n    while (i < len && digits[i] == '0') i++;\n    if (i > 0 && i < len) {\n        char t = digits[0];\n        digits[0] = digits[i];\n        digits[i] = t;\n    }\n    return (int) atoll(digits);\n}`,
        csharp: `public static int SmallestNumber(int num)\n{\n    if (num == 0) return 0;\n    bool neg = num < 0;\n    char[] digits = Math.Abs((long) num).ToString().ToCharArray();\n    Array.Sort(digits);\n    if (neg)\n    {\n        Array.Reverse(digits);\n        return -int.Parse(new string(digits));\n    }\n    int i = 0;\n    while (i < digits.Length && digits[i] == '0') i++;\n    if (i > 0 && i < digits.Length)\n    {\n        char t = digits[0];\n        digits[0] = digits[i];\n        digits[i] = t;\n    }\n    return int.Parse(new string(digits));\n}`,
        go: `func smallestNumber(num int) int {\n\tif num == 0 {\n\t\treturn 0\n\t}\n\tneg := num < 0\n\tv := num\n\tif neg {\n\t\tv = -v\n\t}\n\tdigits := []byte(strconv.Itoa(v))\n\tsort.Slice(digits, func(a, b int) bool { return digits[a] < digits[b] })\n\tif neg {\n\t\tfor i, j := 0, len(digits)-1; i < j; i, j = i+1, j-1 {\n\t\t\tdigits[i], digits[j] = digits[j], digits[i]\n\t\t}\n\t\tr, _ := strconv.Atoi(string(digits))\n\t\treturn -r\n\t}\n\ti := 0\n\tfor i < len(digits) && digits[i] == '0' {\n\t\ti++\n\t}\n\tif i > 0 && i < len(digits) {\n\t\tdigits[0], digits[i] = digits[i], digits[0]\n\t}\n\tr, _ := strconv.Atoi(string(digits))\n\treturn r\n}`,
        kotlin: `fun smallestNumber(num: Int): Int {\n    if (num == 0) return 0\n    val neg = num < 0\n    val digits = Math.abs(num.toLong()).toString().toCharArray()\n    digits.sort()\n    if (neg) {\n        digits.reverse()\n        return -String(digits).toInt()\n    }\n    var i = 0\n    while (i < digits.size && digits[i] == '0') i++\n    if (i > 0 && i < digits.size) {\n        val t = digits[0]\n        digits[0] = digits[i]\n        digits[i] = t\n    }\n    return String(digits).toInt()\n}`,
        swift: `func smallestNumber(_ num: Int) -> Int {\n    if num == 0 { return 0 }\n    let neg = num < 0\n    var digits = Array(String(abs(num))).sorted()\n    if neg {\n        digits.reverse()\n        return -(Int(String(digits)) ?? 0)\n    }\n    var i = 0\n    while i < digits.count && digits[i] == "0" { i += 1 }\n    if i > 0 && i < digits.count {\n        digits.swapAt(0, i)\n    }\n    return Int(String(digits)) ?? 0\n}`,
        rust: `fn smallestNumber(num: i32) -> i32 {\n    if num == 0 {\n        return 0;\n    }\n    let neg = num < 0;\n    let mut digits: Vec<u8> = (num as i64).abs().to_string().into_bytes();\n    digits.sort();\n    if neg {\n        digits.reverse();\n        let s = String::from_utf8(digits).unwrap();\n        return -s.parse::<i32>().unwrap();\n    }\n    let mut i = 0;\n    while i < digits.len() && digits[i] == b'0' {\n        i += 1;\n    }\n    if i > 0 && i < digits.len() {\n        digits.swap(0, i);\n    }\n    String::from_utf8(digits).unwrap().parse::<i32>().unwrap()\n}`,
        php: `function smallestNumber($num) {\n    if ($num === 0) return 0;\n    $neg = $num < 0;\n    $digits = str_split((string) abs($num));\n    sort($digits);\n    if ($neg) {\n        $digits = array_reverse($digits);\n        return -intval(implode("", $digits));\n    }\n    $i = 0;\n    while ($i < count($digits) && $digits[$i] === '0') $i++;\n    if ($i > 0 && $i < count($digits)) {\n        $t = $digits[0];\n        $digits[0] = $digits[$i];\n        $digits[$i] = $t;\n    }\n    return intval(implode("", $digits));\n}`,
        ruby: `def smallestNumber(num)\n  return 0 if num == 0\n  neg = num < 0\n  digits = num.abs.to_s.chars.sort\n  if neg\n    return -digits.reverse.join.to_i\n  end\n  i = 0\n  i += 1 while i < digits.length && digits[i] == '0'\n  if i > 0 && i < digits.length\n    digits[0], digits[i] = digits[i], digits[0]\n  end\n  digits.join.to_i\nend`,
      },
    };
  })(),

  // ── Count Integers With Even Digit Sum (LC 2180) ────────────────
  (() => {
    const ref = (num: number) => {
      let count = 0;
      for (let i = 1; i <= num; i++) {
        let s = 0, x = i;
        while (x > 0) { s += x % 10; x = Math.floor(x / 10); }
        if (s % 2 === 0) count++;
      }
      return count;
    };
    return {
      slug: "count-integers-with-even-digit-sum",
      title: "Count Integers With Even Digit Sum",
      difficulty: "EASY" as const,
      tags: ["Math", "Simulation", "LeetCode 2180", "Amazon", "TCS"],
      signature: { funcName: "countEven", params: [{ name: "num", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a positive integer `num`, return the count of integers in the range `[1, num]` whose **digit sum is even**.",
        [
          { in: "num = 4", out: "2", note: "2 and 4 have even digit sums; 1 and 3 do not." },
          { in: "num = 30", out: "14", note: "The qualifying numbers are 2, 4, 6, 8, 11, 13, 15, 17, 19, 20, 22, 24, 26 and 28." },
          { in: "num = 1", out: "0" },
        ],
        ["1 <= num <= 1000"]),
      hints: [
        "At `num <= 1000` a direct loop over the range is plenty fast.",
        "Compute each number's digit sum by repeated `% 10` and `/ 10`.",
        "Count the ones whose sum is even.",
      ],
      editorial: explain({
        idea: "The range is small, so the honest simulation is the right answer: compute each digit sum and count the even ones.",
        steps: [
          "Loop `i` from 1 to `num`.",
          "Extract `i`'s digits with repeated modulo and division, summing as you go.",
          "Increment the counter when the sum is even.",
        ],
        why: "Every integer in the range is examined exactly once and its digit sum computed exactly, so the count is exact by construction.",
        time: "O(num · log num)",
        space: "O(1)",
        pitfalls: [
          "Starting the loop at 0 counts an extra number — 0 has digit sum 0, which is even.",
          "A closed form exists (roughly `num / 2`, adjusted at the boundary), but it is easy to get wrong; the loop is safer at these limits.",
        ],
      }),
      examples: [
        { input: "4", expectedOutput: "2" },
        { input: "30", expectedOutput: "14" },
        { input: "1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const num = ri(rng, 1, 1000);
        return { input: String(num), expectedOutput: String(ref(num)) };
      },
      solutions: {
        python: `def countEven(num: int) -> int:\n    count = 0\n    for i in range(1, num + 1):\n        s = 0\n        x = i\n        while x > 0:\n            s += x % 10\n            x //= 10\n        if s % 2 == 0:\n            count += 1\n    return count`,
        javascript: `var countEven = function(num) {\n    let count = 0;\n    for (let i = 1; i <= num; i++) {\n        let s = 0, x = i;\n        while (x > 0) { s += x % 10; x = Math.floor(x / 10); }\n        if (s % 2 === 0) count++;\n    }\n    return count;\n};`,
        typescript: `function countEven(num: number): number {\n    var count = 0;\n    for (var i = 1; i <= num; i++) {\n        var s = 0, x = i;\n        while (x > 0) { s += x % 10; x = Math.floor(x / 10); }\n        if (s % 2 === 0) count++;\n    }\n    return count;\n}`,
        java: `public static int countEven(int num) {\n    int count = 0;\n    for (int i = 1; i <= num; i++) {\n        int s = 0, x = i;\n        while (x > 0) { s += x % 10; x /= 10; }\n        if (s % 2 == 0) count++;\n    }\n    return count;\n}`,
        cpp: `int countEven(int num) {\n    int count = 0;\n    for (int i = 1; i <= num; i++) {\n        int s = 0, x = i;\n        while (x > 0) { s += x % 10; x /= 10; }\n        if (s % 2 == 0) count++;\n    }\n    return count;\n}`,
        c: `int countEven(int num) {\n    int count = 0;\n    for (int i = 1; i <= num; i++) {\n        int s = 0, x = i;\n        while (x > 0) { s += x % 10; x /= 10; }\n        if (s % 2 == 0) count++;\n    }\n    return count;\n}`,
        csharp: `public static int CountEven(int num)\n{\n    int count = 0;\n    for (int i = 1; i <= num; i++)\n    {\n        int s = 0, x = i;\n        while (x > 0) { s += x % 10; x /= 10; }\n        if (s % 2 == 0) count++;\n    }\n    return count;\n}`,
        go: `func countEven(num int) int {\n\tcount := 0\n\tfor i := 1; i <= num; i++ {\n\t\ts, x := 0, i\n\t\tfor x > 0 {\n\t\t\ts += x % 10\n\t\t\tx /= 10\n\t\t}\n\t\tif s%2 == 0 {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countEven(num: Int): Int {\n    var count = 0\n    for (i in 1..num) {\n        var s = 0\n        var x = i\n        while (x > 0) {\n            s += x % 10\n            x /= 10\n        }\n        if (s % 2 == 0) count++\n    }\n    return count\n}`,
        swift: `func countEven(_ num: Int) -> Int {\n    var count = 0\n    for i in 1...max(num, 1) {\n        var s = 0\n        var x = i\n        while x > 0 {\n            s += x % 10\n            x /= 10\n        }\n        if s % 2 == 0 { count += 1 }\n    }\n    return count\n}`,
        rust: `fn countEven(num: i32) -> i32 {\n    let mut count = 0;\n    for i in 1..=num {\n        let mut s = 0;\n        let mut x = i;\n        while x > 0 {\n            s += x % 10;\n            x /= 10;\n        }\n        if s % 2 == 0 {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function countEven($num) {\n    $count = 0;\n    for ($i = 1; $i <= $num; $i++) {\n        $s = 0; $x = $i;\n        while ($x > 0) { $s += $x % 10; $x = intdiv($x, 10); }\n        if ($s % 2 === 0) $count++;\n    }\n    return $count;\n}`,
        ruby: `def countEven(num)\n  count = 0\n  (1..num).each do |i|\n    s = 0\n    x = i\n    while x > 0\n      s += x % 10\n      x /= 10\n    end\n    count += 1 if s.even?\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Reach a Number (LC 754) ─────────────────────────────────────
  (() => {
    const ref = (target: number) => {
      let t = Math.abs(target);
      let k = 0, sum = 0;
      while (sum < t || (sum - t) % 2 !== 0) { k++; sum += k; }
      return k;
    };
    return {
      slug: "reach-a-number",
      title: "Reach a Number",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Binary Search", "LeetCode 754", "Amazon", "Google"],
      signature: { funcName: "reachNumber", params: [{ name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You start at position `0` on an infinite number line and want to reach `target`.\n\nOn the `i`-th move (1-indexed) you take exactly `i` steps, choosing to go **left or right**. Return the minimum number of moves needed to land exactly on `target`.",
        [
          { in: "target = 2", out: "3", note: "Go right to 1, left to -1, then right 3 to 2." },
          { in: "target = 3", out: "2", note: "Right 1 to 1, then right 2 to 3." },
          { in: "target = -5", out: "5" },
        ],
        ["-1000000000 <= target <= 1000000000", "target is not 0."]),
      hints: [
        "The problem is symmetric about zero — replace `target` with `|target|`.",
        "After `k` moves the reachable positions are exactly those with the same parity as `1+2+…+k` and magnitude at most that sum.",
        "Flipping a move of size `i` from right to left changes the total by `2i` — always an even amount.",
      ],
      editorial: explain({
        idea: "After `k` moves the maximum reach is `S = k(k+1)/2`, and flipping any move changes the total by an even number. So `target` is reachable in `k` moves exactly when `S >= |target|` and `S - |target|` is even.",
        steps: [
          "Replace `target` with its absolute value — left and right are symmetric.",
          "Grow `k` from 0, accumulating `sum = 1 + 2 + … + k`.",
          "Stop at the first `k` where `sum >= target` **and** `(sum - target)` is even.",
          "Return that `k`.",
        ],
        why: "Flipping the move of size `i` reduces the total by `2i`, so from `S` you can reach exactly the values `S, S-2, S-4, …` down to `-S` — every value of the same parity as `S` within range. Hence both conditions are necessary and together sufficient.",
        time: "O(sqrt(target))",
        space: "O(1)",
        pitfalls: [
          "Stopping as soon as `sum >= target` ignores the parity condition and undercounts, e.g. `target = 2` would answer 2.",
          "Forgetting the absolute value makes negative targets loop forever.",
          "The loop runs about `sqrt(2·10^9) ≈ 63,000` times at the limit plus at most two extra steps — comfortably fast.",
        ],
      }),
      examples: [
        { input: "2", expectedOutput: "3" },
        { input: "3", expectedOutput: "2" },
        { input: "-5", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const mag = rng() < 0.5 ? ri(rng, 1, 200) : ri(rng, 1, 2000000);
        const target = rng() < 0.5 ? -mag : mag;
        return { input: String(target), expectedOutput: String(ref(target)) };
      },
      solutions: {
        python: `def reachNumber(target: int) -> int:\n    t = abs(target)\n    k = 0\n    total = 0\n    while total < t or (total - t) % 2 != 0:\n        k += 1\n        total += k\n    return k`,
        javascript: `var reachNumber = function(target) {\n    const t = Math.abs(target);\n    let k = 0, sum = 0;\n    while (sum < t || (sum - t) % 2 !== 0) {\n        k++;\n        sum += k;\n    }\n    return k;\n};`,
        typescript: `function reachNumber(target: number): number {\n    var t = Math.abs(target);\n    var k = 0, sum = 0;\n    while (sum < t || (sum - t) % 2 !== 0) {\n        k++;\n        sum += k;\n    }\n    return k;\n}`,
        java: `public static int reachNumber(int target) {\n    long t = Math.abs((long) target);\n    long k = 0, sum = 0;\n    while (sum < t || (sum - t) % 2 != 0) {\n        k++;\n        sum += k;\n    }\n    return (int) k;\n}`,
        cpp: `int reachNumber(int target) {\n    long long t = target < 0 ? -(long long) target : (long long) target;\n    long long k = 0, sum = 0;\n    while (sum < t || (sum - t) % 2 != 0) {\n        k++;\n        sum += k;\n    }\n    return (int) k;\n}`,
        c: `int reachNumber(int target) {\n    long long t = target < 0 ? -(long long) target : (long long) target;\n    long long k = 0, sum = 0;\n    while (sum < t || (sum - t) % 2 != 0) {\n        k++;\n        sum += k;\n    }\n    return (int) k;\n}`,
        csharp: `public static int ReachNumber(int target)\n{\n    long t = Math.Abs((long) target);\n    long k = 0, sum = 0;\n    while (sum < t || (sum - t) % 2 != 0)\n    {\n        k++;\n        sum += k;\n    }\n    return (int) k;\n}`,
        go: `func reachNumber(target int) int {\n\tt := target\n\tif t < 0 {\n\t\tt = -t\n\t}\n\tk, sum := 0, 0\n\tfor sum < t || (sum-t)%2 != 0 {\n\t\tk++\n\t\tsum += k\n\t}\n\treturn k\n}`,
        kotlin: `fun reachNumber(target: Int): Int {\n    val t = Math.abs(target.toLong())\n    var k = 0L\n    var sum = 0L\n    while (sum < t || (sum - t) % 2 != 0L) {\n        k++\n        sum += k\n    }\n    return k.toInt()\n}`,
        swift: `func reachNumber(_ target: Int) -> Int {\n    let t = abs(target)\n    var k = 0\n    var sum = 0\n    while sum < t || (sum - t) % 2 != 0 {\n        k += 1\n        sum += k\n    }\n    return k\n}`,
        rust: `fn reachNumber(target: i32) -> i32 {\n    let t = (target as i64).abs();\n    let mut k: i64 = 0;\n    let mut sum: i64 = 0;\n    while sum < t || (sum - t) % 2 != 0 {\n        k += 1;\n        sum += k;\n    }\n    k as i32\n}`,
        php: `function reachNumber($target) {\n    $t = abs($target);\n    $k = 0;\n    $sum = 0;\n    while ($sum < $t || ($sum - $t) % 2 !== 0) {\n        $k++;\n        $sum += $k;\n    }\n    return $k;\n}`,
        ruby: `def reachNumber(target)\n  t = target.abs\n  k = 0\n  sum = 0\n  while sum < t || (sum - t) % 2 != 0\n    k += 1\n    sum += k\n  end\n  k\nend`,
      },
    };
  })(),

  // ── Minimum Operations to Make Array Equal (LC 1551) ───────────
  (() => {
    const ref = (n: number) => Math.floor((n * n) / 4);
    return {
      slug: "minimum-operations-to-make-array-equal",
      title: "Minimum Operations to Make Array Equal",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "LeetCode 1551", "Amazon", "Adobe"],
      signature: { funcName: "minOperations", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You have an array `arr` of length `n` where `arr[i] = 2 * i + 1` for every `i`, so `arr` is `[1, 3, 5, …, 2n-1]`.\n\nIn one operation you pick two indices `x` and `y`, subtract 1 from `arr[x]` and add 1 to `arr[y]`. Return the **minimum number of operations** needed to make all elements equal. It is always possible.",
        [
          { in: "n = 3", out: "2", note: "[1,3,5] → [2,3,4] → [3,3,3]." },
          { in: "n = 6", out: "9" },
          { in: "n = 1", out: "0", note: "A single element is already equal to itself." },
        ],
        ["1 <= n <= 10000"]),
      hints: [
        "The array is an arithmetic sequence, so its mean is `n` — that is the value everything must reach.",
        "Each operation moves one unit from an element above the mean to one below it.",
        "The answer is the total surplus: the sum of `arr[i] - n` over the elements above the mean.",
      ],
      editorial: explain({
        idea: "Every operation transfers exactly one unit from a high element to a low one, so the minimum count is the total amount that must be moved — the surplus above the mean.",
        steps: [
          "Note the mean is `n`, since `arr` is `1, 3, …, 2n-1` and its average is `n`.",
          "Sum the surplus `arr[i] - n` over the top half of the array.",
          "That sum works out to `floor(n² / 4)`, so return it directly.",
        ],
        why: "The array is symmetric about `n`: the surplus above equals the deficit below. Summing `(2i+1) - n` for the elements above the mean gives `2 + 4 + … `, telescoping to `n²/4` for even `n` and `(n²-1)/4` for odd `n` — both `floor(n²/4)`. No operation can move more than one unit, so this is also a lower bound.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Summing the whole array's deviation double-counts — the moved units are counted once at each end.",
          "`n * n` reaches 10^8 here, safely inside 32 bits, but the habit of widening first is cheap.",
        ],
      }),
      examples: [
        { input: "3", expectedOutput: "2" },
        { input: "6", expectedOutput: "9" },
        { input: "1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def minOperations(n: int) -> int:\n    return n * n // 4`,
        javascript: `var minOperations = function(n) {\n    return Math.floor((n * n) / 4);\n};`,
        typescript: `function minOperations(n: number): number {\n    return Math.floor((n * n) / 4);\n}`,
        java: `public static int minOperations(int n) {\n    return (int) ((long) n * n / 4);\n}`,
        cpp: `int minOperations(int n) {\n    return (int) ((long long) n * n / 4);\n}`,
        c: `int minOperations(int n) {\n    return (int) ((long long) n * n / 4);\n}`,
        csharp: `public static int MinOperations(int n)\n{\n    return (int) ((long) n * n / 4);\n}`,
        go: `func minOperations(n int) int {\n\treturn n * n / 4\n}`,
        kotlin: `fun minOperations(n: Int): Int {\n    return (n.toLong() * n / 4).toInt()\n}`,
        swift: `func minOperations(_ n: Int) -> Int {\n    return n * n / 4\n}`,
        rust: `fn minOperations(n: i32) -> i32 {\n    ((n as i64) * (n as i64) / 4) as i32\n}`,
        php: `function minOperations($n) {\n    return intdiv($n * $n, 4);\n}`,
        ruby: `def minOperations(n)\n  n * n / 4\nend`,
      },
    };
  })(),

  // ── Count Square Sum Triples (LC 1925) ──────────────────────────
  (() => {
    const ref = (n: number) => {
      let count = 0;
      for (let a = 1; a <= n; a++) {
        for (let b = 1; b <= n; b++) {
          const s = a * a + b * b;
          const c = Math.round(Math.sqrt(s));
          if (c <= n && c * c === s) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-square-sum-triples",
      title: "Count Square Sum Triples",
      difficulty: "EASY" as const,
      tags: ["Math", "Enumeration", "LeetCode 1925", "Amazon", "TCS"],
      signature: { funcName: "countTriples", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A **square triple** is an ordered triple `(a, b, c)` of positive integers with `a² + b² = c²`.\n\nGiven an integer `n`, return the number of square triples with `1 <= a, b, c <= n`. Order matters, so `(3,4,5)` and `(4,3,5)` count separately.",
        [
          { in: "n = 5", out: "2", note: "(3,4,5) and (4,3,5)." },
          { in: "n = 10", out: "4", note: "The Pythagorean triples within range are (3,4,5), (4,3,5), (6,8,10) and (8,6,10)." },
          { in: "n = 2", out: "0" },
        ],
        ["1 <= n <= 250"]),
      hints: [
        "`n` is at most 250, so a double loop over `a` and `b` is only 62,500 iterations.",
        "For each pair, `c` is determined: it is `sqrt(a² + b²)`.",
        "Check that the square root is an exact integer and does not exceed `n`.",
      ],
      editorial: explain({
        idea: "Enumerating `a` and `b` fixes `c`, so the third value never needs its own loop — only an exact-square test.",
        steps: [
          "Loop `a` and `b` each from 1 to `n`.",
          "Compute `s = a² + b²` and `c = round(sqrt(s))`.",
          "Count the triple when `c <= n` and `c * c == s`.",
        ],
        why: "`c` is uniquely determined by `a` and `b`, so each ordered pair contributes at most one triple. Rounding before the squaring check makes the integer test exact despite floating-point square roots.",
        time: "O(n²)",
        space: "O(1)",
        pitfalls: [
          "Truncating the square root instead of rounding can miss exact squares by one because of floating-point error — always verify with `c * c == s`.",
          "A triple loop over `a`, `b` and `c` is O(n³) — 15 million iterations here, still passable but wasteful.",
          "Counting only `a < b` halves the answer; the problem counts ordered pairs.",
        ],
      }),
      examples: [
        { input: "5", expectedOutput: "2" },
        { input: "10", expectedOutput: "4" },
        { input: "2", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 250);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def countTriples(n: int) -> int:\n    count = 0\n    for a in range(1, n + 1):\n        for b in range(1, n + 1):\n            s = a * a + b * b\n            c = int(s ** 0.5 + 0.5)\n            if c <= n and c * c == s:\n                count += 1\n    return count`,
        javascript: `var countTriples = function(n) {\n    let count = 0;\n    for (let a = 1; a <= n; a++) {\n        for (let b = 1; b <= n; b++) {\n            const s = a * a + b * b;\n            const c = Math.round(Math.sqrt(s));\n            if (c <= n && c * c === s) count++;\n        }\n    }\n    return count;\n};`,
        typescript: `function countTriples(n: number): number {\n    var count = 0;\n    for (var a = 1; a <= n; a++) {\n        for (var b = 1; b <= n; b++) {\n            var s = a * a + b * b;\n            var c = Math.round(Math.sqrt(s));\n            if (c <= n && c * c === s) count++;\n        }\n    }\n    return count;\n}`,
        java: `public static int countTriples(int n) {\n    int count = 0;\n    for (int a = 1; a <= n; a++) {\n        for (int b = 1; b <= n; b++) {\n            int s = a * a + b * b;\n            int c = (int) Math.round(Math.sqrt(s));\n            if (c <= n && c * c == s) count++;\n        }\n    }\n    return count;\n}`,
        cpp: `int countTriples(int n) {\n    int count = 0;\n    for (int a = 1; a <= n; a++) {\n        for (int b = 1; b <= n; b++) {\n            int s = a * a + b * b;\n            int c = (int) (sqrt((double) s) + 0.5);\n            if (c <= n && c * c == s) count++;\n        }\n    }\n    return count;\n}`,
        c: `int countTriples(int n) {\n    int count = 0;\n    for (int a = 1; a <= n; a++) {\n        for (int b = 1; b <= n; b++) {\n            int s = a * a + b * b;\n            int c = 0;\n            while ((c + 1) * (c + 1) <= s) c++;\n            if (c <= n && c * c == s) count++;\n        }\n    }\n    return count;\n}`,
        csharp: `public static int CountTriples(int n)\n{\n    int count = 0;\n    for (int a = 1; a <= n; a++)\n    {\n        for (int b = 1; b <= n; b++)\n        {\n            int s = a * a + b * b;\n            int c = (int) Math.Round(Math.Sqrt(s));\n            if (c <= n && c * c == s) count++;\n        }\n    }\n    return count;\n}`,
        go: `func countTriples(n int) int {\n\tcount := 0\n\tfor a := 1; a <= n; a++ {\n\t\tfor b := 1; b <= n; b++ {\n\t\t\ts := a*a + b*b\n\t\t\tc := int(math.Sqrt(float64(s)) + 0.5)\n\t\t\tif c <= n && c*c == s {\n\t\t\t\tcount++\n\t\t\t}\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countTriples(n: Int): Int {\n    var count = 0\n    for (a in 1..n) {\n        for (b in 1..n) {\n            val s = a * a + b * b\n            val c = Math.round(Math.sqrt(s.toDouble())).toInt()\n            if (c <= n && c * c == s) count++\n        }\n    }\n    return count\n}`,
        swift: `func countTriples(_ n: Int) -> Int {\n    var count = 0\n    for a in 1...max(n, 1) {\n        for b in 1...max(n, 1) {\n            let s = a * a + b * b\n            let c = Int((Double(s).squareRoot() + 0.5))\n            if c <= n && c * c == s { count += 1 }\n        }\n    }\n    return count\n}`,
        rust: `fn countTriples(n: i32) -> i32 {\n    let mut count = 0;\n    for a in 1..=n {\n        for b in 1..=n {\n            let s = a * a + b * b;\n            let c = ((s as f64).sqrt() + 0.5) as i32;\n            if c <= n && c * c == s {\n                count += 1;\n            }\n        }\n    }\n    count\n}`,
        php: `function countTriples($n) {\n    $count = 0;\n    for ($a = 1; $a <= $n; $a++) {\n        for ($b = 1; $b <= $n; $b++) {\n            $s = $a * $a + $b * $b;\n            $c = (int) round(sqrt($s));\n            if ($c <= $n && $c * $c === $s) $count++;\n        }\n    }\n    return $count;\n}`,
        ruby: `def countTriples(n)\n  count = 0\n  (1..n).each do |a|\n    (1..n).each do |b|\n      s = a * a + b * b\n      c = Integer.sqrt(s)\n      count += 1 if c <= n && c * c == s\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Maximum Number of Balls in a Box (LC 1742) ──────────────────
  (() => {
    const ref = (lo: number, hi: number) => {
      const boxes: Record<string, number> = {};
      let best = 0;
      for (let i = lo; i <= hi; i++) {
        let s = 0, x = i;
        while (x > 0) { s += x % 10; x = Math.floor(x / 10); }
        const k = String(s);
        boxes[k] = (boxes[k] || 0) + 1;
        if (boxes[k] > best) best = boxes[k];
      }
      return best;
    };
    return {
      slug: "maximum-number-of-balls-in-a-box",
      title: "Maximum Number of Balls in a Box",
      difficulty: "EASY" as const,
      tags: ["Math", "Hash Table", "Counting", "LeetCode 1742", "Amazon", "Infosys"],
      signature: {
        funcName: "countBalls",
        params: [{ name: "lowLimit", type: "int" as const }, { name: "highLimit", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You have balls numbered `lowLimit` through `highLimit` and an unlimited number of boxes numbered from 1. Each ball goes into the box whose number equals the **sum of the ball's digits** — ball 321 goes to box 3 + 2 + 1 = 6.\n\nReturn the number of balls in the fullest box.",
        [
          { in: "lowLimit = 1, highLimit = 10", out: "2", note: "Box 1 holds balls 1 and 10; every other box holds at most one." },
          { in: "lowLimit = 5, highLimit = 15", out: "2" },
          { in: "lowLimit = 19, highLimit = 28", out: "2" },
        ],
        ["1 <= lowLimit <= highLimit <= 100000"]),
      hints: [
        "The range is at most 100,000 balls, so iterating all of them is fine.",
        "Digit sums here never exceed 45, so a small counting array suffices.",
        "Track the maximum bucket as you fill it, avoiding a second pass.",
      ],
      editorial: explain({
        idea: "Bucket the balls by digit sum and report the largest bucket. Because the digit sum of a number below 100,000 is at most 45, the bucket space is tiny.",
        steps: [
          "For each ball number in the range, compute its digit sum with repeated `% 10` and `/ 10`.",
          "Increment that bucket's count.",
          "Track the running maximum count and return it.",
        ],
        why: "Every ball lands in exactly one box, so the bucket counts partition the range and the maximum bucket is the fullest box.",
        time: "O((hi - lo) · log hi)",
        space: "O(1) — the digit-sum range is bounded by 45",
        pitfalls: [
          "Starting the loop at 1 instead of `lowLimit` counts balls that were never placed.",
          "Sizing the bucket array too small overflows: `99999` has digit sum 45, so 46 slots are needed.",
        ],
      }),
      examples: [
        { input: "1\n10", expectedOutput: "2" },
        { input: "5\n15", expectedOutput: "2" },
        { input: "19\n28", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const lo = ri(rng, 1, 5000);
        const hi = lo + ri(rng, 0, rng() < 0.5 ? 200 : 20000);
        return { input: `${lo}\n${hi}`, expectedOutput: String(ref(lo, hi)) };
      },
      solutions: {
        python: `def countBalls(lowLimit: int, highLimit: int) -> int:\n    boxes = [0] * 50\n    best = 0\n    for i in range(lowLimit, highLimit + 1):\n        s = 0\n        x = i\n        while x > 0:\n            s += x % 10\n            x //= 10\n        boxes[s] += 1\n        if boxes[s] > best:\n            best = boxes[s]\n    return best`,
        javascript: `var countBalls = function(lowLimit, highLimit) {\n    const boxes = new Array(50).fill(0);\n    let best = 0;\n    for (let i = lowLimit; i <= highLimit; i++) {\n        let s = 0, x = i;\n        while (x > 0) { s += x % 10; x = Math.floor(x / 10); }\n        boxes[s]++;\n        if (boxes[s] > best) best = boxes[s];\n    }\n    return best;\n};`,
        typescript: `function countBalls(lowLimit: number, highLimit: number): number {\n    var boxes: number[] = [];\n    for (var k = 0; k < 50; k++) boxes.push(0);\n    var best = 0;\n    for (var i = lowLimit; i <= highLimit; i++) {\n        var s = 0, x = i;\n        while (x > 0) { s += x % 10; x = Math.floor(x / 10); }\n        boxes[s]++;\n        if (boxes[s] > best) best = boxes[s];\n    }\n    return best;\n}`,
        java: `public static int countBalls(int lowLimit, int highLimit) {\n    int[] boxes = new int[50];\n    int best = 0;\n    for (int i = lowLimit; i <= highLimit; i++) {\n        int s = 0, x = i;\n        while (x > 0) { s += x % 10; x /= 10; }\n        boxes[s]++;\n        if (boxes[s] > best) best = boxes[s];\n    }\n    return best;\n}`,
        cpp: `int countBalls(int lowLimit, int highLimit) {\n    vector<int> boxes(50, 0);\n    int best = 0;\n    for (int i = lowLimit; i <= highLimit; i++) {\n        int s = 0, x = i;\n        while (x > 0) { s += x % 10; x /= 10; }\n        boxes[s]++;\n        if (boxes[s] > best) best = boxes[s];\n    }\n    return best;\n}`,
        c: `int countBalls(int lowLimit, int highLimit) {\n    int boxes[50];\n    for (int i = 0; i < 50; i++) boxes[i] = 0;\n    int best = 0;\n    for (int i = lowLimit; i <= highLimit; i++) {\n        int s = 0, x = i;\n        while (x > 0) { s += x % 10; x /= 10; }\n        boxes[s]++;\n        if (boxes[s] > best) best = boxes[s];\n    }\n    return best;\n}`,
        csharp: `public static int CountBalls(int lowLimit, int highLimit)\n{\n    int[] boxes = new int[50];\n    int best = 0;\n    for (int i = lowLimit; i <= highLimit; i++)\n    {\n        int s = 0, x = i;\n        while (x > 0) { s += x % 10; x /= 10; }\n        boxes[s]++;\n        if (boxes[s] > best) best = boxes[s];\n    }\n    return best;\n}`,
        go: `func countBalls(lowLimit int, highLimit int) int {\n\tboxes := make([]int, 50)\n\tbest := 0\n\tfor i := lowLimit; i <= highLimit; i++ {\n\t\ts, x := 0, i\n\t\tfor x > 0 {\n\t\t\ts += x % 10\n\t\t\tx /= 10\n\t\t}\n\t\tboxes[s]++\n\t\tif boxes[s] > best {\n\t\t\tbest = boxes[s]\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun countBalls(lowLimit: Int, highLimit: Int): Int {\n    val boxes = IntArray(50)\n    var best = 0\n    for (i in lowLimit..highLimit) {\n        var s = 0\n        var x = i\n        while (x > 0) {\n            s += x % 10\n            x /= 10\n        }\n        boxes[s]++\n        if (boxes[s] > best) best = boxes[s]\n    }\n    return best\n}`,
        swift: `func countBalls(_ lowLimit: Int, _ highLimit: Int) -> Int {\n    var boxes = [Int](repeating: 0, count: 50)\n    var best = 0\n    for i in lowLimit...highLimit {\n        var s = 0\n        var x = i\n        while x > 0 {\n            s += x % 10\n            x /= 10\n        }\n        boxes[s] += 1\n        if boxes[s] > best { best = boxes[s] }\n    }\n    return best\n}`,
        rust: `fn countBalls(lowLimit: i32, highLimit: i32) -> i32 {\n    let mut boxes = vec![0i32; 50];\n    let mut best = 0;\n    for i in lowLimit..=highLimit {\n        let mut s = 0usize;\n        let mut x = i;\n        while x > 0 {\n            s += (x % 10) as usize;\n            x /= 10;\n        }\n        boxes[s] += 1;\n        if boxes[s] > best {\n            best = boxes[s];\n        }\n    }\n    best\n}`,
        php: `function countBalls($lowLimit, $highLimit) {\n    $boxes = array_fill(0, 50, 0);\n    $best = 0;\n    for ($i = $lowLimit; $i <= $highLimit; $i++) {\n        $s = 0; $x = $i;\n        while ($x > 0) { $s += $x % 10; $x = intdiv($x, 10); }\n        $boxes[$s]++;\n        if ($boxes[$s] > $best) $best = $boxes[$s];\n    }\n    return $best;\n}`,
        ruby: `def countBalls(lowLimit, highLimit)\n  boxes = Array.new(50, 0)\n  best = 0\n  (lowLimit..highLimit).each do |i|\n    s = 0\n    x = i\n    while x > 0\n      s += x % 10\n      x /= 10\n    end\n    boxes[s] += 1\n    best = boxes[s] if boxes[s] > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Check If It Is a Straight Line (LC 1232) ────────────────────
  (() => {
    const ref = (coords: number[][]) => {
      const [x0, y0] = coords[0];
      const [x1, y1] = coords[1];
      const dx = x1 - x0, dy = y1 - y0;
      for (let i = 2; i < coords.length; i++) {
        const [x, y] = coords[i];
        if (dx * (y - y0) !== dy * (x - x0)) return false;
      }
      return true;
    };
    return {
      slug: "check-if-it-is-a-straight-line",
      title: "Check If It Is a Straight Line",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Geometry", "LeetCode 1232", "Amazon", "Google", "Facebook"],
      signature: { funcName: "checkStraightLine", params: [{ name: "coordinates", type: "int[][]" as const }], returns: "bool" as const },
      description: describe(
        "You are given an array `coordinates` where `coordinates[i] = [x, y]` is a point in the plane.\n\nReturn `true` if all the points lie on a single straight line.",
        [
          { in: "coordinates = [[1,2],[2,3],[3,4],[4,5]]", out: "true" },
          { in: "coordinates = [[1,1],[2,2],[3,4]]", out: "false" },
          { in: "coordinates = [[0,0],[0,1],[0,5]]", out: "true", note: "A vertical line is still a line." },
        ],
        ["2 <= coordinates.length <= 1000", "coordinates[i].length == 2", "-10000 <= x, y <= 10000", "No two points are identical."]),
      hints: [
        "Comparing slopes as `dy / dx` breaks on a vertical line and invites floating-point error.",
        "Cross-multiply instead: the points are collinear when `dx1 · dy2 == dy1 · dx2`.",
        "Fix the direction vector from the first two points and test every remaining point against it.",
      ],
      editorial: explain({
        idea: "Collinearity is a cross-product test. Using multiplication rather than division keeps everything in exact integer arithmetic and handles vertical lines with no special case.",
        steps: [
          "Take `(dx, dy)` as the vector from point 0 to point 1.",
          "For each later point `(x, y)`, compare `dx · (y - y0)` with `dy · (x - x0)`.",
          "Return `false` on the first mismatch, `true` otherwise.",
        ],
        why: "The two expressions are the components of the cross product of `(dx, dy)` with `(x - x0, y - y0)`. It is zero exactly when the vectors are parallel — that is, when the point lies on the line through the first two.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Using `dy / dx` divides by zero on a vertical line and loses precision elsewhere.",
          "With coordinates up to 10,000 the products reach 4·10^8 — inside 32 bits, but widening to 64 costs nothing.",
          "The reference direction must come from two distinct points, which the constraints guarantee.",
        ],
      }),
      examples: [
        { input: "[[1,2],[2,3],[3,4],[4,5]]", expectedOutput: "true" },
        { input: "[[1,1],[2,2],[3,4]]", expectedOutput: "false" },
        { input: "[[0,0],[0,1],[0,5]]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 10);
        const coords: number[][] = [];
        if (rng() < 0.5) {
          const x0 = ri(rng, -50, 50), y0 = ri(rng, -50, 50);
          let dx = ri(rng, -5, 5), dy = ri(rng, -5, 5);
          if (dx === 0 && dy === 0) dx = 1;
          const used = new Set<number>();
          for (let i = 0; i < n; i++) {
            let t = ri(rng, -20, 20);
            let guard = 0;
            while (used.has(t) && guard++ < 60) t = ri(rng, -20, 20);
            used.add(t);
            coords.push([x0 + dx * t, y0 + dy * t]);
          }
          if (rng() < 0.35 && n > 2) {
            const j = ri(rng, 2, n - 1);
            coords[j] = [coords[j][0] + ri(rng, 1, 3), coords[j][1]];
          }
        } else {
          const seen = new Set<string>();
          while (coords.length < n) {
            const p = [ri(rng, -20, 20), ri(rng, -20, 20)];
            const key = p.join(",");
            if (seen.has(key)) continue;
            seen.add(key);
            coords.push(p);
          }
        }
        return { input: fmtIntMat(coords), expectedOutput: bool(ref(coords)) };
      },
      solutions: {
        python: `from typing import List\n\ndef checkStraightLine(coordinates: List[List[int]]) -> bool:\n    x0, y0 = coordinates[0]\n    x1, y1 = coordinates[1]\n    dx, dy = x1 - x0, y1 - y0\n    for x, y in coordinates[2:]:\n        if dx * (y - y0) != dy * (x - x0):\n            return False\n    return True`,
        javascript: `var checkStraightLine = function(coordinates) {\n    const x0 = coordinates[0][0], y0 = coordinates[0][1];\n    const dx = coordinates[1][0] - x0, dy = coordinates[1][1] - y0;\n    for (let i = 2; i < coordinates.length; i++) {\n        const x = coordinates[i][0], y = coordinates[i][1];\n        if (dx * (y - y0) !== dy * (x - x0)) return false;\n    }\n    return true;\n};`,
        typescript: `function checkStraightLine(coordinates: number[][]): boolean {\n    var x0 = coordinates[0][0], y0 = coordinates[0][1];\n    var dx = coordinates[1][0] - x0, dy = coordinates[1][1] - y0;\n    for (var i = 2; i < coordinates.length; i++) {\n        var x = coordinates[i][0], y = coordinates[i][1];\n        if (dx * (y - y0) !== dy * (x - x0)) return false;\n    }\n    return true;\n}`,
        java: `public static boolean checkStraightLine(int[][] coordinates) {\n    long x0 = coordinates[0][0], y0 = coordinates[0][1];\n    long dx = coordinates[1][0] - x0, dy = coordinates[1][1] - y0;\n    for (int i = 2; i < coordinates.length; i++) {\n        long x = coordinates[i][0], y = coordinates[i][1];\n        if (dx * (y - y0) != dy * (x - x0)) return false;\n    }\n    return true;\n}`,
        cpp: `bool checkStraightLine(vector<vector<int>>& coordinates) {\n    long long x0 = coordinates[0][0], y0 = coordinates[0][1];\n    long long dx = coordinates[1][0] - x0, dy = coordinates[1][1] - y0;\n    for (int i = 2; i < (int) coordinates.size(); i++) {\n        long long x = coordinates[i][0], y = coordinates[i][1];\n        if (dx * (y - y0) != dy * (x - x0)) return false;\n    }\n    return true;\n}`,
        c: `bool checkStraightLine(int** coordinates, int coordinatesSize, int* coordinatesColSize) {\n    long long x0 = coordinates[0][0], y0 = coordinates[0][1];\n    long long dx = coordinates[1][0] - x0, dy = coordinates[1][1] - y0;\n    for (int i = 2; i < coordinatesSize; i++) {\n        long long x = coordinates[i][0], y = coordinates[i][1];\n        if (dx * (y - y0) != dy * (x - x0)) return false;\n    }\n    return true;\n}`,
        csharp: `public static bool CheckStraightLine(int[][] coordinates)\n{\n    long x0 = coordinates[0][0], y0 = coordinates[0][1];\n    long dx = coordinates[1][0] - x0, dy = coordinates[1][1] - y0;\n    for (int i = 2; i < coordinates.Length; i++)\n    {\n        long x = coordinates[i][0], y = coordinates[i][1];\n        if (dx * (y - y0) != dy * (x - x0)) return false;\n    }\n    return true;\n}`,
        go: `func checkStraightLine(coordinates [][]int) bool {\n\tx0, y0 := coordinates[0][0], coordinates[0][1]\n\tdx, dy := coordinates[1][0]-x0, coordinates[1][1]-y0\n\tfor i := 2; i < len(coordinates); i++ {\n\t\tx, y := coordinates[i][0], coordinates[i][1]\n\t\tif dx*(y-y0) != dy*(x-x0) {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun checkStraightLine(coordinates: Array<IntArray>): Boolean {\n    val x0 = coordinates[0][0].toLong()\n    val y0 = coordinates[0][1].toLong()\n    val dx = coordinates[1][0] - x0\n    val dy = coordinates[1][1] - y0\n    for (i in 2 until coordinates.size) {\n        val x = coordinates[i][0].toLong()\n        val y = coordinates[i][1].toLong()\n        if (dx * (y - y0) != dy * (x - x0)) return false\n    }\n    return true\n}`,
        swift: `func checkStraightLine(_ coordinates: [[Int]]) -> Bool {\n    let x0 = coordinates[0][0]\n    let y0 = coordinates[0][1]\n    let dx = coordinates[1][0] - x0\n    let dy = coordinates[1][1] - y0\n    var i = 2\n    while i < coordinates.count {\n        let x = coordinates[i][0]\n        let y = coordinates[i][1]\n        if dx * (y - y0) != dy * (x - x0) { return false }\n        i += 1\n    }\n    return true\n}`,
        rust: `fn checkStraightLine(coordinates: Vec<Vec<i32>>) -> bool {\n    let x0 = coordinates[0][0] as i64;\n    let y0 = coordinates[0][1] as i64;\n    let dx = coordinates[1][0] as i64 - x0;\n    let dy = coordinates[1][1] as i64 - y0;\n    for i in 2..coordinates.len() {\n        let x = coordinates[i][0] as i64;\n        let y = coordinates[i][1] as i64;\n        if dx * (y - y0) != dy * (x - x0) {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function checkStraightLine($coordinates) {\n    $x0 = $coordinates[0][0];\n    $y0 = $coordinates[0][1];\n    $dx = $coordinates[1][0] - $x0;\n    $dy = $coordinates[1][1] - $y0;\n    for ($i = 2; $i < count($coordinates); $i++) {\n        $x = $coordinates[$i][0];\n        $y = $coordinates[$i][1];\n        if ($dx * ($y - $y0) !== $dy * ($x - $x0)) return false;\n    }\n    return true;\n}`,
        ruby: `def checkStraightLine(coordinates)\n  x0, y0 = coordinates[0]\n  x1, y1 = coordinates[1]\n  dx = x1 - x0\n  dy = y1 - y0\n  coordinates[2..-1].each do |x, y|\n    return false if dx * (y - y0) != dy * (x - x0)\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Largest Odd Number in String (LC 1903) ──────────────────────
  (() => {
    const ref = (num: string) => {
      for (let i = num.length - 1; i >= 0; i--) {
        const d = num.charCodeAt(i) - 48;
        if (d % 2 === 1) return num.slice(0, i + 1);
      }
      return "";
    };
    return {
      slug: "largest-odd-number-in-string",
      title: "Largest Odd Number in String",
      difficulty: "EASY" as const,
      tags: ["String", "Math", "Greedy", "LeetCode 1903", "Amazon", "Adobe"],
      signature: { funcName: "largestOddNumber", params: [{ name: "num", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `num` of digits. Return the **largest-valued odd** integer that is a non-empty **substring** of `num`, as a string.\n\nIf no odd substring exists, return the empty string.",
        [
          { in: 'num = "52"', out: "5", note: 'The only odd substring is "5".' },
          { in: 'num = "4206"', out: "", note: "Every digit is even." },
          { in: 'num = "35427"', out: "35427", note: "The whole string is already odd." },
        ],
        ["1 <= num.length <= 100000", "num consists of digits only and has no leading zeros."]),
      hints: [
        "A number is odd exactly when its **last digit** is odd.",
        "To make the value as large as possible, keep the prefix as long as possible.",
        "So scan from the right for the last odd digit and return everything up to and including it.",
      ],
      editorial: explain({
        idea: "Any odd substring must end at an odd digit. Among substrings ending at a fixed position, the longest — the whole prefix — is the largest, and a longer prefix always beats a shorter one for a digit string with no leading zeros.",
        steps: [
          "Scan `num` from the last index backwards.",
          "At the first odd digit found at index `i`, return `num[0..i]`.",
          "Return the empty string if no odd digit exists.",
        ],
        why: "Extending a substring leftward can only increase its value (it adds more significant digits), so the best choice ends at the **rightmost** odd digit and starts at index 0.",
        time: "O(n)",
        space: "O(n) for the returned prefix",
        pitfalls: [
          "Searching for the largest odd *digit* rather than the rightmost one gives a shorter, smaller answer.",
          "Enumerating substrings is O(n²) and hopeless at 100,000 characters.",
          "The answer keeps any interior zeros — only leading zeros would be a problem, and the input has none.",
        ],
      }),
      examples: [
        { input: '"52"', expectedOutput: "5" },
        { input: '"4206"', expectedOutput: "" },
        { input: '"35427"', expectedOutput: "35427" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, 1, 30);
        let num = String(ri(rng, 1, 9));
        for (let i = 1; i < len; i++) num += String(rng() < 0.5 ? ri(rng, 0, 4) * 2 : ri(rng, 0, 9));
        return { input: JSON.stringify(num), expectedOutput: ref(num) };
      },
      solutions: {
        python: `def largestOddNumber(num: str) -> str:\n    for i in range(len(num) - 1, -1, -1):\n        if int(num[i]) % 2 == 1:\n            return num[:i + 1]\n    return ""`,
        javascript: `var largestOddNumber = function(num) {\n    for (let i = num.length - 1; i >= 0; i--) {\n        if ((num.charCodeAt(i) - 48) % 2 === 1) return num.slice(0, i + 1);\n    }\n    return "";\n};`,
        typescript: `function largestOddNumber(num: string): string {\n    for (var i = num.length - 1; i >= 0; i--) {\n        if ((num.charCodeAt(i) - 48) % 2 === 1) return num.slice(0, i + 1);\n    }\n    return "";\n}`,
        java: `public static String largestOddNumber(String num) {\n    for (int i = num.length() - 1; i >= 0; i--) {\n        if ((num.charAt(i) - '0') % 2 == 1) return num.substring(0, i + 1);\n    }\n    return "";\n}`,
        cpp: `string largestOddNumber(string num) {\n    for (int i = (int) num.size() - 1; i >= 0; i--) {\n        if ((num[i] - '0') % 2 == 1) return num.substr(0, i + 1);\n    }\n    return "";\n}`,
        c: `char* largestOddNumber(const char* num) {\n    int n = (int) strlen(num);\n    for (int i = n - 1; i >= 0; i--) {\n        if ((num[i] - '0') % 2 == 1) {\n            char* out = (char*) malloc(i + 2);\n            memcpy(out, num, i + 1);\n            out[i + 1] = '\\0';\n            return out;\n        }\n    }\n    char* empty = (char*) malloc(1);\n    empty[0] = '\\0';\n    return empty;\n}`,
        csharp: `public static string LargestOddNumber(string num)\n{\n    for (int i = num.Length - 1; i >= 0; i--)\n    {\n        if ((num[i] - '0') % 2 == 1) return num.Substring(0, i + 1);\n    }\n    return "";\n}`,
        go: `func largestOddNumber(num string) string {\n\tfor i := len(num) - 1; i >= 0; i-- {\n\t\tif (num[i]-'0')%2 == 1 {\n\t\t\treturn num[:i+1]\n\t\t}\n\t}\n\treturn ""\n}`,
        kotlin: `fun largestOddNumber(num: String): String {\n    for (i in num.length - 1 downTo 0) {\n        if ((num[i] - '0') % 2 == 1) return num.substring(0, i + 1)\n    }\n    return ""\n}`,
        swift: `func largestOddNumber(_ num: String) -> String {\n    let a = Array(num)\n    var i = a.count - 1\n    while i >= 0 {\n        let d = Int(String(a[i])) ?? 0\n        if d % 2 == 1 { return String(a[0...i]) }\n        i -= 1\n    }\n    return ""\n}`,
        rust: `fn largestOddNumber(num: String) -> String {\n    let a = num.as_bytes();\n    let mut i = a.len();\n    while i > 0 {\n        i -= 1;\n        if (a[i] - b'0') % 2 == 1 {\n            return num[..i + 1].to_string();\n        }\n    }\n    String::new()\n}`,
        php: `function largestOddNumber($num) {\n    for ($i = strlen($num) - 1; $i >= 0; $i--) {\n        if ((ord($num[$i]) - 48) % 2 === 1) return substr($num, 0, $i + 1);\n    }\n    return "";\n}`,
        ruby: `def largestOddNumber(num)\n  (num.length - 1).downto(0) do |i|\n    return num[0, i + 1] if num[i].to_i.odd?\n  end\n  ""\nend`,
      },
    };
  })(),

  // ── Number of Employees Who Met the Target (LC 2798) ────────────
  (() => {
    const ref = (hours: number[], target: number) => {
      let c = 0;
      for (const h of hours) if (h >= target) c++;
      return c;
    };
    return {
      slug: "number-of-employees-who-met-the-target",
      title: "Number of Employees Who Met the Target",
      difficulty: "EASY" as const,
      tags: ["Array", "LeetCode 2798", "Amazon", "TCS", "Capgemini"],
      signature: {
        funcName: "numberOfEmployeesWhoMetTarget",
        params: [{ name: "hours", type: "int[]" as const }, { name: "target", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A company has `n` employees. `hours[i]` is the number of hours the `i`-th employee worked, and every employee is expected to work at least `target` hours.\n\nReturn how many employees met or exceeded the target.",
        [
          { in: "hours = [0,1,2,3,4], target = 2", out: "3", note: "Employees 2, 3 and 4 worked at least 2 hours." },
          { in: "hours = [5,1,4,2,2], target = 6", out: "0" },
          { in: "hours = [10], target = 0", out: "1" },
        ],
        ["1 <= hours.length <= 50", "0 <= hours[i], target <= 100000"]),
      hints: [
        "One pass with a counter is all this needs.",
        "The condition is \"at least\", so use `>=` and not `>`.",
        "A target of 0 is met by everyone.",
      ],
      editorial: explain({
        idea: "A direct count over an independent per-element predicate.",
        steps: [
          "Walk `hours`.",
          "Increment a counter whenever `hours[i] >= target`.",
          "Return the counter.",
        ],
        why: "Each employee's status depends only on their own hours, so the total is a plain sum of independent tests.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Using a strict `>` excludes employees who worked exactly the target.",
          "`target = 0` must count every employee, including those with 0 hours.",
        ],
      }),
      examples: [
        { input: "[0,1,2,3,4]\n2", expectedOutput: "3" },
        { input: "[5,1,4,2,2]\n6", expectedOutput: "0" },
        { input: "[10]\n0", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const hours = Array.from({ length: n }, () => ri(rng, 0, 20));
        const target = ri(rng, 0, 20);
        return { input: `${fmtIntArr(hours)}\n${target}`, expectedOutput: String(ref(hours, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numberOfEmployeesWhoMetTarget(hours: List[int], target: int) -> int:\n    return sum(1 for h in hours if h >= target)`,
        javascript: `var numberOfEmployeesWhoMetTarget = function(hours, target) {\n    let count = 0;\n    for (let i = 0; i < hours.length; i++) {\n        if (hours[i] >= target) count++;\n    }\n    return count;\n};`,
        typescript: `function numberOfEmployeesWhoMetTarget(hours: number[], target: number): number {\n    var count = 0;\n    for (var i = 0; i < hours.length; i++) {\n        if (hours[i] >= target) count++;\n    }\n    return count;\n}`,
        java: `public static int numberOfEmployeesWhoMetTarget(int[] hours, int target) {\n    int count = 0;\n    for (int h : hours) {\n        if (h >= target) count++;\n    }\n    return count;\n}`,
        cpp: `int numberOfEmployeesWhoMetTarget(vector<int>& hours, int target) {\n    int count = 0;\n    for (int h : hours) {\n        if (h >= target) count++;\n    }\n    return count;\n}`,
        c: `int numberOfEmployeesWhoMetTarget(int* hours, int hoursSize, int target) {\n    int count = 0;\n    for (int i = 0; i < hoursSize; i++) {\n        if (hours[i] >= target) count++;\n    }\n    return count;\n}`,
        csharp: `public static int NumberOfEmployeesWhoMetTarget(int[] hours, int target)\n{\n    int count = 0;\n    foreach (int h in hours)\n    {\n        if (h >= target) count++;\n    }\n    return count;\n}`,
        go: `func numberOfEmployeesWhoMetTarget(hours []int, target int) int {\n\tcount := 0\n\tfor _, h := range hours {\n\t\tif h >= target {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun numberOfEmployeesWhoMetTarget(hours: IntArray, target: Int): Int {\n    var count = 0\n    for (h in hours) {\n        if (h >= target) count++\n    }\n    return count\n}`,
        swift: `func numberOfEmployeesWhoMetTarget(_ hours: [Int], _ target: Int) -> Int {\n    var count = 0\n    for h in hours {\n        if h >= target { count += 1 }\n    }\n    return count\n}`,
        rust: `fn numberOfEmployeesWhoMetTarget(hours: Vec<i32>, target: i32) -> i32 {\n    let mut count = 0;\n    for &h in hours.iter() {\n        if h >= target {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function numberOfEmployeesWhoMetTarget($hours, $target) {\n    $count = 0;\n    foreach ($hours as $h) {\n        if ($h >= $target) $count++;\n    }\n    return $count;\n}`,
        ruby: `def numberOfEmployeesWhoMetTarget(hours, target)\n  hours.count { |h| h >= target }\nend`,
      },
    };
  })(),

  // ── Divisible and Non-divisible Sums Difference (LC 2894) ───────
  (() => {
    const ref = (n: number, m: number) => {
      let num1 = 0, num2 = 0;
      for (let i = 1; i <= n; i++) {
        if (i % m === 0) num2 += i;
        else num1 += i;
      }
      return num1 - num2;
    };
    return {
      slug: "divisible-and-non-divisible-sums-difference",
      title: "Divisible and Non-Divisible Sums Difference",
      difficulty: "EASY" as const,
      tags: ["Math", "LeetCode 2894", "Amazon", "TCS"],
      signature: {
        funcName: "differenceOfSums",
        params: [{ name: "n", type: "int" as const }, { name: "m", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given positive integers `n` and `m`.\n\nLet `num1` be the sum of the integers in `[1, n]` that are **not** divisible by `m`, and `num2` the sum of those that **are**.\n\nReturn `num1 - num2`.",
        [
          { in: "n = 10, m = 3", out: "19", note: "num1 = 1+2+4+5+7+8+10 = 37 and num2 = 3+6+9 = 18." },
          { in: "n = 5, m = 6", out: "15", note: "Nothing in range is divisible by 6, so num2 is 0." },
          { in: "n = 5, m = 1", out: "-15", note: "Everything is divisible by 1, so num1 is 0." },
        ],
        ["1 <= n, m <= 1000"]),
      hints: [
        "A direct loop over `1..n` is fast enough at these limits.",
        "Add each value to one accumulator or the other based on `i % m`.",
        "A closed form also exists: `total - 2 · (sum of multiples of m)`.",
      ],
      editorial: explain({
        idea: "Partition `[1, n]` by divisibility and difference the two sums. The range is small, so the honest loop is clearest.",
        steps: [
          "Loop `i` from 1 to `n`.",
          "Add `i` to `num2` when `i % m == 0`, otherwise to `num1`.",
          "Return `num1 - num2`.",
        ],
        why: "The two sets partition the range, so `num1 + num2` is the full triangular sum and the difference is well defined. The closed form follows: `num1 - num2 = total - 2·num2`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The answer can be negative — `m = 1` puts everything in `num2`.",
          "Starting the loop at 0 adds a harmless zero but muddies the divisibility count.",
        ],
      }),
      examples: [
        { input: "10\n3", expectedOutput: "19" },
        { input: "5\n6", expectedOutput: "15" },
        { input: "5\n1", expectedOutput: "-15" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 1000);
        const m = ri(rng, 1, 1000);
        return { input: `${n}\n${m}`, expectedOutput: String(ref(n, m)) };
      },
      solutions: {
        python: `def differenceOfSums(n: int, m: int) -> int:\n    num1 = 0\n    num2 = 0\n    for i in range(1, n + 1):\n        if i % m == 0:\n            num2 += i\n        else:\n            num1 += i\n    return num1 - num2`,
        javascript: `var differenceOfSums = function(n, m) {\n    let num1 = 0, num2 = 0;\n    for (let i = 1; i <= n; i++) {\n        if (i % m === 0) num2 += i;\n        else num1 += i;\n    }\n    return num1 - num2;\n};`,
        typescript: `function differenceOfSums(n: number, m: number): number {\n    var num1 = 0, num2 = 0;\n    for (var i = 1; i <= n; i++) {\n        if (i % m === 0) num2 += i;\n        else num1 += i;\n    }\n    return num1 - num2;\n}`,
        java: `public static int differenceOfSums(int n, int m) {\n    int num1 = 0, num2 = 0;\n    for (int i = 1; i <= n; i++) {\n        if (i % m == 0) num2 += i;\n        else num1 += i;\n    }\n    return num1 - num2;\n}`,
        cpp: `int differenceOfSums(int n, int m) {\n    int num1 = 0, num2 = 0;\n    for (int i = 1; i <= n; i++) {\n        if (i % m == 0) num2 += i;\n        else num1 += i;\n    }\n    return num1 - num2;\n}`,
        c: `int differenceOfSums(int n, int m) {\n    int num1 = 0, num2 = 0;\n    for (int i = 1; i <= n; i++) {\n        if (i % m == 0) num2 += i;\n        else num1 += i;\n    }\n    return num1 - num2;\n}`,
        csharp: `public static int DifferenceOfSums(int n, int m)\n{\n    int num1 = 0, num2 = 0;\n    for (int i = 1; i <= n; i++)\n    {\n        if (i % m == 0) num2 += i;\n        else num1 += i;\n    }\n    return num1 - num2;\n}`,
        go: `func differenceOfSums(n int, m int) int {\n\tnum1, num2 := 0, 0\n\tfor i := 1; i <= n; i++ {\n\t\tif i%m == 0 {\n\t\t\tnum2 += i\n\t\t} else {\n\t\t\tnum1 += i\n\t\t}\n\t}\n\treturn num1 - num2\n}`,
        kotlin: `fun differenceOfSums(n: Int, m: Int): Int {\n    var num1 = 0\n    var num2 = 0\n    for (i in 1..n) {\n        if (i % m == 0) num2 += i else num1 += i\n    }\n    return num1 - num2\n}`,
        swift: `func differenceOfSums(_ n: Int, _ m: Int) -> Int {\n    var num1 = 0\n    var num2 = 0\n    for i in 1...max(n, 1) {\n        if i % m == 0 { num2 += i } else { num1 += i }\n    }\n    return num1 - num2\n}`,
        rust: `fn differenceOfSums(n: i32, m: i32) -> i32 {\n    let mut num1 = 0;\n    let mut num2 = 0;\n    for i in 1..=n {\n        if i % m == 0 {\n            num2 += i;\n        } else {\n            num1 += i;\n        }\n    }\n    num1 - num2\n}`,
        php: `function differenceOfSums($n, $m) {\n    $num1 = 0;\n    $num2 = 0;\n    for ($i = 1; $i <= $n; $i++) {\n        if ($i % $m === 0) $num2 += $i;\n        else $num1 += $i;\n    }\n    return $num1 - $num2;\n}`,
        ruby: `def differenceOfSums(n, m)\n  num1 = 0\n  num2 = 0\n  (1..n).each do |i|\n    if i % m == 0\n      num2 += i\n    else\n      num1 += i\n    end\n  end\n  num1 - num2\nend`,
      },
    };
  })(),

  // ── Account Balance After Rounded Purchase (LC 2806) ────────────
  (() => {
    const ref = (amount: number) => {
      const rem = amount % 10;
      const rounded = rem >= 5 ? amount - rem + 10 : amount - rem;
      return 100 - rounded;
    };
    return {
      slug: "account-balance-after-rounded-purchase",
      title: "Account Balance After Rounded Purchase",
      difficulty: "EASY" as const,
      tags: ["Math", "LeetCode 2806", "Amazon", "Infosys"],
      signature: { funcName: "accountBalanceAfterPurchase", params: [{ name: "purchaseAmount", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You start with a balance of `100`. A purchase of `purchaseAmount` is charged after being **rounded to the nearest multiple of 10**; a tie rounds **up** (so 15 becomes 20).\n\nReturn the balance after the purchase.",
        [
          { in: "purchaseAmount = 9", out: "90", note: "9 rounds to 10, leaving 100 - 10 = 90." },
          { in: "purchaseAmount = 15", out: "80", note: "A tie rounds up to 20." },
          { in: "purchaseAmount = 100", out: "0" },
        ],
        ["0 <= purchaseAmount <= 100"]),
      hints: [
        "Look at `purchaseAmount % 10` to decide the direction.",
        "A remainder of 5 or more rounds up; anything less rounds down.",
        "Subtract the rounded amount from 100.",
      ],
      editorial: explain({
        idea: "Rounding to the nearest ten is decided entirely by the units digit, with the tie rule fixed to round up.",
        steps: [
          "Compute `rem = purchaseAmount % 10`.",
          "If `rem >= 5`, the rounded amount is `purchaseAmount - rem + 10`; otherwise it is `purchaseAmount - rem`.",
          "Return `100 - rounded`.",
        ],
        why: "`purchaseAmount - rem` is the multiple of ten immediately below (or equal), and adding 10 moves to the one above. The `>= 5` test implements \"nearest, ties up\" exactly.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Language rounding helpers often use banker's rounding, which sends 15 to 10 rather than 20.",
          "`purchaseAmount = 0` rounds to 0 and leaves the balance at 100.",
          "The maximum charge is 100, so the balance never goes negative.",
        ],
      }),
      examples: [
        { input: "9", expectedOutput: "90" },
        { input: "15", expectedOutput: "80" },
        { input: "100", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const amount = ri(rng, 0, 100);
        return { input: String(amount), expectedOutput: String(ref(amount)) };
      },
      solutions: {
        python: `def accountBalanceAfterPurchase(purchaseAmount: int) -> int:\n    rem = purchaseAmount % 10\n    rounded = purchaseAmount - rem + (10 if rem >= 5 else 0)\n    return 100 - rounded`,
        javascript: `var accountBalanceAfterPurchase = function(purchaseAmount) {\n    const rem = purchaseAmount % 10;\n    const rounded = rem >= 5 ? purchaseAmount - rem + 10 : purchaseAmount - rem;\n    return 100 - rounded;\n};`,
        typescript: `function accountBalanceAfterPurchase(purchaseAmount: number): number {\n    var rem = purchaseAmount % 10;\n    var rounded = rem >= 5 ? purchaseAmount - rem + 10 : purchaseAmount - rem;\n    return 100 - rounded;\n}`,
        java: `public static int accountBalanceAfterPurchase(int purchaseAmount) {\n    int rem = purchaseAmount % 10;\n    int rounded = rem >= 5 ? purchaseAmount - rem + 10 : purchaseAmount - rem;\n    return 100 - rounded;\n}`,
        cpp: `int accountBalanceAfterPurchase(int purchaseAmount) {\n    int rem = purchaseAmount % 10;\n    int rounded = rem >= 5 ? purchaseAmount - rem + 10 : purchaseAmount - rem;\n    return 100 - rounded;\n}`,
        c: `int accountBalanceAfterPurchase(int purchaseAmount) {\n    int rem = purchaseAmount % 10;\n    int rounded = rem >= 5 ? purchaseAmount - rem + 10 : purchaseAmount - rem;\n    return 100 - rounded;\n}`,
        csharp: `public static int AccountBalanceAfterPurchase(int purchaseAmount)\n{\n    int rem = purchaseAmount % 10;\n    int rounded = rem >= 5 ? purchaseAmount - rem + 10 : purchaseAmount - rem;\n    return 100 - rounded;\n}`,
        go: `func accountBalanceAfterPurchase(purchaseAmount int) int {\n\trem := purchaseAmount % 10\n\trounded := purchaseAmount - rem\n\tif rem >= 5 {\n\t\trounded += 10\n\t}\n\treturn 100 - rounded\n}`,
        kotlin: `fun accountBalanceAfterPurchase(purchaseAmount: Int): Int {\n    val rem = purchaseAmount % 10\n    val rounded = if (rem >= 5) purchaseAmount - rem + 10 else purchaseAmount - rem\n    return 100 - rounded\n}`,
        swift: `func accountBalanceAfterPurchase(_ purchaseAmount: Int) -> Int {\n    let rem = purchaseAmount % 10\n    let rounded = rem >= 5 ? purchaseAmount - rem + 10 : purchaseAmount - rem\n    return 100 - rounded\n}`,
        rust: `fn accountBalanceAfterPurchase(purchaseAmount: i32) -> i32 {\n    let rem = purchaseAmount % 10;\n    let rounded = if rem >= 5 {\n        purchaseAmount - rem + 10\n    } else {\n        purchaseAmount - rem\n    };\n    100 - rounded\n}`,
        php: `function accountBalanceAfterPurchase($purchaseAmount) {\n    $rem = $purchaseAmount % 10;\n    $rounded = $rem >= 5 ? $purchaseAmount - $rem + 10 : $purchaseAmount - $rem;\n    return 100 - $rounded;\n}`,
        ruby: `def accountBalanceAfterPurchase(purchaseAmount)\n  rem = purchaseAmount % 10\n  rounded = rem >= 5 ? purchaseAmount - rem + 10 : purchaseAmount - rem\n  100 - rounded\nend`,
      },
    };
  })(),

  // ── Furthest Point From Origin (LC 2833) ────────────────────────
  (() => {
    const ref = (moves: string) => {
      let l = 0, r = 0, u = 0;
      for (const c of moves) {
        if (c === "L") l++;
        else if (c === "R") r++;
        else u++;
      }
      return Math.abs(l - r) + u;
    };
    return {
      slug: "furthest-point-from-origin",
      title: "Furthest Point From Origin",
      difficulty: "EASY" as const,
      tags: ["String", "Greedy", "LeetCode 2833", "Amazon", "Adobe"],
      signature: { funcName: "furthestDistanceFromOrigin", params: [{ name: "moves", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You start at position 0 on a number line and are given a string `moves` of characters `'L'`, `'R'` and `'_'`.\n\nEach `'L'` moves one step left, each `'R'` one step right, and each `'_'` may be taken as **either** direction.\n\nReturn the furthest distance from the origin that can be reached after making all the moves.",
        [
          { in: 'moves = "L_RL__R"', out: "3", note: "Taking every blank as L reaches -3." },
          { in: 'moves = "_R__LL_"', out: "5" },
          { in: 'moves = "_______"', out: "7", note: "All blanks in one direction." },
        ],
        ["1 <= moves.length <= 50", "moves consists only of 'L', 'R' and '_'."]),
      hints: [
        "The fixed moves partially cancel: only `|L - R|` of them survives.",
        "Every blank should push in the same direction as that surplus.",
        "So the answer is `|L - R| + (number of blanks)`.",
      ],
      editorial: explain({
        idea: "Fixed moves cancel down to a net displacement of `|L - R|`, and every free move should be spent pushing further out in that same direction.",
        steps: [
          "Count the `'L'`, `'R'` and `'_'` characters.",
          "Return `|L - R| + blanks`.",
        ],
        why: "The net position is `(R - L) ± blanks`. Its magnitude is maximised by aligning all blanks with the sign of `R - L`, giving `|R - L| + blanks`. When `R == L` either direction works and the answer is just the blank count.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting the absolute value gives a negative answer whenever the string leans left.",
          "Splitting the blanks between directions is never better — each one contributes a full step outward.",
        ],
      }),
      examples: [
        { input: '"L_RL__R"', expectedOutput: "3" },
        { input: '"_R__LL_"', expectedOutput: "5" },
        { input: '"_______"', expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const moves = Array.from({ length: n }, () => ["L", "R", "_"][ri(rng, 0, 2)]).join("");
        return { input: JSON.stringify(moves), expectedOutput: String(ref(moves)) };
      },
      solutions: {
        python: `def furthestDistanceFromOrigin(moves: str) -> int:\n    l = moves.count('L')\n    r = moves.count('R')\n    u = moves.count('_')\n    return abs(l - r) + u`,
        javascript: `var furthestDistanceFromOrigin = function(moves) {\n    let l = 0, r = 0, u = 0;\n    for (let i = 0; i < moves.length; i++) {\n        const c = moves.charAt(i);\n        if (c === "L") l++;\n        else if (c === "R") r++;\n        else u++;\n    }\n    return Math.abs(l - r) + u;\n};`,
        typescript: `function furthestDistanceFromOrigin(moves: string): number {\n    var l = 0, r = 0, u = 0;\n    for (var i = 0; i < moves.length; i++) {\n        var c = moves.charAt(i);\n        if (c === "L") l++;\n        else if (c === "R") r++;\n        else u++;\n    }\n    return Math.abs(l - r) + u;\n}`,
        java: `public static int furthestDistanceFromOrigin(String moves) {\n    int l = 0, r = 0, u = 0;\n    for (int i = 0; i < moves.length(); i++) {\n        char c = moves.charAt(i);\n        if (c == 'L') l++;\n        else if (c == 'R') r++;\n        else u++;\n    }\n    return Math.abs(l - r) + u;\n}`,
        cpp: `int furthestDistanceFromOrigin(string moves) {\n    int l = 0, r = 0, u = 0;\n    for (char c : moves) {\n        if (c == 'L') l++;\n        else if (c == 'R') r++;\n        else u++;\n    }\n    return abs(l - r) + u;\n}`,
        c: `int furthestDistanceFromOrigin(const char* moves) {\n    int l = 0, r = 0, u = 0;\n    for (int i = 0; moves[i] != '\\0'; i++) {\n        if (moves[i] == 'L') l++;\n        else if (moves[i] == 'R') r++;\n        else u++;\n    }\n    int d = l - r;\n    if (d < 0) d = -d;\n    return d + u;\n}`,
        csharp: `public static int FurthestDistanceFromOrigin(string moves)\n{\n    int l = 0, r = 0, u = 0;\n    foreach (char c in moves)\n    {\n        if (c == 'L') l++;\n        else if (c == 'R') r++;\n        else u++;\n    }\n    return Math.Abs(l - r) + u;\n}`,
        go: `func furthestDistanceFromOrigin(moves string) int {\n\tl, r, u := 0, 0, 0\n\tfor i := 0; i < len(moves); i++ {\n\t\tswitch moves[i] {\n\t\tcase 'L':\n\t\t\tl++\n\t\tcase 'R':\n\t\t\tr++\n\t\tdefault:\n\t\t\tu++\n\t\t}\n\t}\n\td := l - r\n\tif d < 0 {\n\t\td = -d\n\t}\n\treturn d + u\n}`,
        kotlin: `fun furthestDistanceFromOrigin(moves: String): Int {\n    var l = 0\n    var r = 0\n    var u = 0\n    for (c in moves) {\n        when (c) {\n            'L' -> l++\n            'R' -> r++\n            else -> u++\n        }\n    }\n    return Math.abs(l - r) + u\n}`,
        swift: `func furthestDistanceFromOrigin(_ moves: String) -> Int {\n    var l = 0\n    var r = 0\n    var u = 0\n    for c in moves {\n        if c == "L" { l += 1 }\n        else if c == "R" { r += 1 }\n        else { u += 1 }\n    }\n    return abs(l - r) + u\n}`,
        rust: `fn furthestDistanceFromOrigin(moves: String) -> i32 {\n    let mut l = 0;\n    let mut r = 0;\n    let mut u = 0;\n    for c in moves.chars() {\n        if c == 'L' {\n            l += 1;\n        } else if c == 'R' {\n            r += 1;\n        } else {\n            u += 1;\n        }\n    }\n    (l - r as i32).abs() + u\n}`,
        php: `function furthestDistanceFromOrigin($moves) {\n    $l = 0; $r = 0; $u = 0;\n    for ($i = 0; $i < strlen($moves); $i++) {\n        if ($moves[$i] === 'L') $l++;\n        else if ($moves[$i] === 'R') $r++;\n        else $u++;\n    }\n    return abs($l - $r) + $u;\n}`,
        ruby: `def furthestDistanceFromOrigin(moves)\n  l = moves.count("L")\n  r = moves.count("R")\n  u = moves.count("_")\n  (l - r).abs + u\nend`,
      },
    };
  })(),

  // ── Find the Winning Player in Coin Game (LC 3222) ──────────────
  (() => {
    const ref = (x: number, y: number) => {
      const turns = Math.min(x, Math.floor(y / 4));
      return turns % 2 === 1 ? "Alice" : "Bob";
    };
    return {
      slug: "find-the-winning-player-in-coin-game",
      title: "Find the Winning Player in Coin Game",
      difficulty: "EASY" as const,
      tags: ["Math", "Game Theory", "LeetCode 3222", "Amazon", "Google"],
      signature: {
        funcName: "losingPlayer",
        params: [{ name: "x", type: "int" as const }, { name: "y", type: "int" as const }],
        returns: "string" as const,
      },
      description: describe(
        "There are `x` coins worth 75 each and `y` coins worth 10 each. Alice and Bob take turns, Alice going first.\n\nOn a turn a player must remove coins with a total value of exactly **115** — one 75-coin and four 10-coins. A player who cannot do this loses.\n\nReturn the name of the player who **wins**, assuming optimal play.",
        [
          { in: "x = 2, y = 7", out: "Alice", note: "One full turn is possible: Alice takes it, then Bob cannot move." },
          { in: "x = 4, y = 11", out: "Bob", note: "Two turns are possible, so Alice runs out first." },
          { in: "x = 1, y = 2", out: "Bob", note: "Alice cannot even make the first move." },
        ],
        ["1 <= x, y <= 100"]),
      hints: [
        "Every turn is identical: exactly one 75-coin and exactly four 10-coins.",
        "So the total number of turns is fixed at `min(x, y / 4)` — there are no real choices.",
        "Alice moves on the odd-numbered turns, so she wins exactly when that count is odd.",
      ],
      editorial: explain({
        idea: "There is only one way to make 115 from coins of 75 and 10 — one and four — so the game has no branching. The winner follows from the parity of the fixed turn count.",
        steps: [
          "Compute `turns = min(x, y / 4)` using integer division.",
          "Return `\"Alice\"` when `turns` is odd, `\"Bob\"` when it is even.",
        ],
        why: "`75a + 10b = 115` with non-negative integers forces `a = 1, b = 4`: `a = 0` needs `b = 11.5`, and `a >= 2` already overshoots. So each turn consumes exactly one 75-coin and four 10-coins, and play stops after `min(x, y/4)` turns. The player to move when no turn remains loses, which is Bob exactly when the count is odd.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Assuming a player could take two 75-coins (150) or eleven 10-coins overcomplicates a game with a single legal move.",
          "`turns = 0` means Alice cannot move at all, so Bob wins — which the even branch already covers.",
        ],
      }),
      examples: [
        { input: "2\n7", expectedOutput: "Alice" },
        { input: "4\n11", expectedOutput: "Bob" },
        { input: "1\n2", expectedOutput: "Bob" },
      ],
      gen: (rng: Rng) => {
        const x = ri(rng, 1, 100);
        const y = ri(rng, 1, 100);
        return { input: `${x}\n${y}`, expectedOutput: ref(x, y) };
      },
      solutions: {
        python: `def losingPlayer(x: int, y: int) -> str:\n    turns = min(x, y // 4)\n    return "Alice" if turns % 2 == 1 else "Bob"`,
        javascript: `var losingPlayer = function(x, y) {\n    const turns = Math.min(x, Math.floor(y / 4));\n    return turns % 2 === 1 ? "Alice" : "Bob";\n};`,
        typescript: `function losingPlayer(x: number, y: number): string {\n    var turns = Math.min(x, Math.floor(y / 4));\n    return turns % 2 === 1 ? "Alice" : "Bob";\n}`,
        java: `public static String losingPlayer(int x, int y) {\n    int turns = Math.min(x, y / 4);\n    return turns % 2 == 1 ? "Alice" : "Bob";\n}`,
        cpp: `string losingPlayer(int x, int y) {\n    int turns = min(x, y / 4);\n    return turns % 2 == 1 ? "Alice" : "Bob";\n}`,
        c: `char* losingPlayer(int x, int y) {\n    int t = y / 4;\n    int turns = x < t ? x : t;\n    char* out = (char*) malloc(8);\n    strcpy(out, turns % 2 == 1 ? "Alice" : "Bob");\n    return out;\n}`,
        csharp: `public static string LosingPlayer(int x, int y)\n{\n    int turns = Math.Min(x, y / 4);\n    return turns % 2 == 1 ? "Alice" : "Bob";\n}`,
        go: `func losingPlayer(x int, y int) string {\n\tturns := y / 4\n\tif x < turns {\n\t\tturns = x\n\t}\n\tif turns%2 == 1 {\n\t\treturn "Alice"\n\t}\n\treturn "Bob"\n}`,
        kotlin: `fun losingPlayer(x: Int, y: Int): String {\n    val turns = minOf(x, y / 4)\n    return if (turns % 2 == 1) "Alice" else "Bob"\n}`,
        swift: `func losingPlayer(_ x: Int, _ y: Int) -> String {\n    let turns = min(x, y / 4)\n    return turns % 2 == 1 ? "Alice" : "Bob"\n}`,
        rust: `fn losingPlayer(x: i32, y: i32) -> String {\n    let turns = std::cmp::min(x, y / 4);\n    if turns % 2 == 1 {\n        "Alice".to_string()\n    } else {\n        "Bob".to_string()\n    }\n}`,
        php: `function losingPlayer($x, $y) {\n    $turns = min($x, intdiv($y, 4));\n    return $turns % 2 === 1 ? "Alice" : "Bob";\n}`,
        ruby: `def losingPlayer(x, y)\n  turns = [x, y / 4].min\n  turns.odd? ? "Alice" : "Bob"\nend`,
      },
    };
  })(),

  // ── Find the Maximum Achievable Number (LC 2769) ────────────────
  (() => {
    const ref = (num: number, t: number) => num + 2 * t;
    return {
      slug: "find-the-maximum-achievable-number",
      title: "Find the Maximum Achievable Number",
      difficulty: "EASY" as const,
      tags: ["Math", "LeetCode 2769", "Amazon", "TCS"],
      signature: {
        funcName: "theMaximumAchievableX",
        params: [{ name: "num", type: "int" as const }, { name: "t", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "An integer `x` is **achievable** if, after at most `t` operations, it can be made equal to `num`. One operation increases or decreases `x` by 1 **and simultaneously** increases or decreases `num` by 1.\n\nReturn the maximum achievable `x`.",
        [
          { in: "num = 4, t = 1", out: "6", note: "Decrease x from 6 to 5 while increasing num from 4 to 5." },
          { in: "num = 3, t = 2", out: "7" },
          { in: "num = 1, t = 1", out: "3" },
        ],
        ["1 <= num, t <= 50"]),
      hints: [
        "Each operation can close the gap between `x` and `num` by 2 — one step from each side.",
        "So after `t` operations, a gap of at most `2t` can be eliminated.",
        "The maximum `x` is therefore `num + 2t`.",
      ],
      editorial: explain({
        idea: "Every operation moves `x` and `num` by one each, so the gap between them changes by at most 2 per step. Maximising `x` means starting `2t` above `num`.",
        steps: [
          "Note that one operation can reduce `|x - num|` by 2 at best.",
          "After `t` operations, at most `2t` of gap can be closed.",
          "Return `num + 2 * t`.",
        ],
        why: "Starting from `x = num + 2t`, decreasing `x` while increasing `num` each step meets in the middle after exactly `t` operations. Any larger `x` leaves a gap that `t` operations cannot close, since 2 per step is the maximum rate.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Answering `num + t` forgets that `num` moves too.",
          "The operations must move both values — moving only `x` would halve the reach.",
        ],
      }),
      examples: [
        { input: "4\n1", expectedOutput: "6" },
        { input: "3\n2", expectedOutput: "7" },
        { input: "1\n1", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const num = ri(rng, 1, 50);
        const t = ri(rng, 1, 50);
        return { input: `${num}\n${t}`, expectedOutput: String(ref(num, t)) };
      },
      solutions: {
        python: `def theMaximumAchievableX(num: int, t: int) -> int:\n    return num + 2 * t`,
        javascript: `var theMaximumAchievableX = function(num, t) {\n    return num + 2 * t;\n};`,
        typescript: `function theMaximumAchievableX(num: number, t: number): number {\n    return num + 2 * t;\n}`,
        java: `public static int theMaximumAchievableX(int num, int t) {\n    return num + 2 * t;\n}`,
        cpp: `int theMaximumAchievableX(int num, int t) {\n    return num + 2 * t;\n}`,
        c: `int theMaximumAchievableX(int num, int t) {\n    return num + 2 * t;\n}`,
        csharp: `public static int TheMaximumAchievableX(int num, int t)\n{\n    return num + 2 * t;\n}`,
        go: `func theMaximumAchievableX(num int, t int) int {\n\treturn num + 2*t\n}`,
        kotlin: `fun theMaximumAchievableX(num: Int, t: Int): Int {\n    return num + 2 * t\n}`,
        swift: `func theMaximumAchievableX(_ num: Int, _ t: Int) -> Int {\n    return num + 2 * t\n}`,
        rust: `fn theMaximumAchievableX(num: i32, t: i32) -> i32 {\n    num + 2 * t\n}`,
        php: `function theMaximumAchievableX($num, $t) {\n    return $num + 2 * $t;\n}`,
        ruby: `def theMaximumAchievableX(num, t)\n  num + 2 * t\nend`,
      },
    };
  })(),

  // ── Ant on the Boundary (LC 3028) ───────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let pos = 0, count = 0;
      for (const x of nums) { pos += x; if (pos === 0) count++; }
      return count;
    };
    return {
      slug: "ant-on-the-boundary",
      title: "Ant on the Boundary",
      difficulty: "EASY" as const,
      tags: ["Array", "Prefix Sum", "Simulation", "LeetCode 3028", "Amazon", "TCS"],
      signature: { funcName: "returnToBoundary", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An ant starts on a boundary and reads `nums` left to right. A negative value moves it that many units **left**; a positive value moves it that many units **right**.\n\nThe ant only checks whether it is back on the boundary **after** fully completing each move. Return how many times it lands on the boundary.",
        [
          { in: "nums = [2,3,-5]", out: "1", note: "Positions after each move: 2, 5, 0 — the boundary is reached once." },
          { in: "nums = [3,2,-3,-4]", out: "0", note: "Positions 3, 5, 2, -2 — never zero." },
          { in: "nums = [1,-1,1,-1]", out: "2" },
        ],
        ["1 <= nums.length <= 100", "-10 <= nums[i] <= 10", "nums[i] is never 0."]),
      hints: [
        "Track a running position — that is just the prefix sum.",
        "Check for zero only after the whole move has been applied.",
        "Crossing the boundary mid-move does not count.",
      ],
      editorial: explain({
        idea: "The ant's position after `k` moves is the prefix sum of the first `k` values, so the answer counts the zero prefix sums.",
        steps: [
          "Keep a running total starting at 0.",
          "Add each element in turn.",
          "Increment the counter whenever the running total equals 0 after an addition.",
        ],
        why: "The problem explicitly says the ant checks only after completing a move, which is exactly the prefix-sum-after-each-element reading.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Counting a zero starting position inflates the answer — the check happens only after a move.",
          "Trying to detect boundary *crossings* during a move counts positions the ant never checks.",
        ],
      }),
      examples: [
        { input: "[2,3,-5]", expectedOutput: "1" },
        { input: "[3,2,-3,-4]", expectedOutput: "0" },
        { input: "[1,-1,1,-1]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const nums = Array.from({ length: n }, () => {
          let v = ri(rng, -10, 10);
          if (v === 0) v = 1;
          return v;
        });
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef returnToBoundary(nums: List[int]) -> int:\n    pos = 0\n    count = 0\n    for x in nums:\n        pos += x\n        if pos == 0:\n            count += 1\n    return count`,
        javascript: `var returnToBoundary = function(nums) {\n    let pos = 0, count = 0;\n    for (let i = 0; i < nums.length; i++) {\n        pos += nums[i];\n        if (pos === 0) count++;\n    }\n    return count;\n};`,
        typescript: `function returnToBoundary(nums: number[]): number {\n    var pos = 0, count = 0;\n    for (var i = 0; i < nums.length; i++) {\n        pos += nums[i];\n        if (pos === 0) count++;\n    }\n    return count;\n}`,
        java: `public static int returnToBoundary(int[] nums) {\n    int pos = 0, count = 0;\n    for (int x : nums) {\n        pos += x;\n        if (pos == 0) count++;\n    }\n    return count;\n}`,
        cpp: `int returnToBoundary(vector<int>& nums) {\n    int pos = 0, count = 0;\n    for (int x : nums) {\n        pos += x;\n        if (pos == 0) count++;\n    }\n    return count;\n}`,
        c: `int returnToBoundary(int* nums, int numsSize) {\n    int pos = 0, count = 0;\n    for (int i = 0; i < numsSize; i++) {\n        pos += nums[i];\n        if (pos == 0) count++;\n    }\n    return count;\n}`,
        csharp: `public static int ReturnToBoundary(int[] nums)\n{\n    int pos = 0, count = 0;\n    foreach (int x in nums)\n    {\n        pos += x;\n        if (pos == 0) count++;\n    }\n    return count;\n}`,
        go: `func returnToBoundary(nums []int) int {\n\tpos, count := 0, 0\n\tfor _, x := range nums {\n\t\tpos += x\n\t\tif pos == 0 {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun returnToBoundary(nums: IntArray): Int {\n    var pos = 0\n    var count = 0\n    for (x in nums) {\n        pos += x\n        if (pos == 0) count++\n    }\n    return count\n}`,
        swift: `func returnToBoundary(_ nums: [Int]) -> Int {\n    var pos = 0\n    var count = 0\n    for x in nums {\n        pos += x\n        if pos == 0 { count += 1 }\n    }\n    return count\n}`,
        rust: `fn returnToBoundary(nums: Vec<i32>) -> i32 {\n    let mut pos = 0;\n    let mut count = 0;\n    for &x in nums.iter() {\n        pos += x;\n        if pos == 0 {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function returnToBoundary($nums) {\n    $pos = 0;\n    $count = 0;\n    foreach ($nums as $x) {\n        $pos += $x;\n        if ($pos === 0) $count++;\n    }\n    return $count;\n}`,
        ruby: `def returnToBoundary(nums)\n  pos = 0\n  count = 0\n  nums.each do |x|\n    pos += x\n    count += 1 if pos == 0\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Count Tested Devices After Test Operations (LC 2960) ────────
  (() => {
    const ref = (batteryPercentages: number[]) => {
      let tested = 0;
      for (const b of batteryPercentages) if (b - tested > 0) tested++;
      return tested;
    };
    return {
      slug: "count-tested-devices-after-test-operations",
      title: "Count Tested Devices After Test Operations",
      difficulty: "EASY" as const,
      tags: ["Array", "Simulation", "Counting", "LeetCode 2960", "Amazon", "Adobe"],
      signature: { funcName: "countTestedDevices", params: [{ name: "batteryPercentages", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You test `n` devices in order, `0` to `n - 1`. At device `i`:\n\n- If `batteryPercentages[i] > 0`, count it as tested and **decrease by 1** the battery of every device after it, never going below 0.\n- Otherwise skip it.\n\nReturn the number of devices tested.",
        [
          { in: "batteryPercentages = [1,1,2,1,3]", out: "3", note: "Devices 0, 2 and 4 are tested." },
          { in: "batteryPercentages = [0,1,2]", out: "2" },
          { in: "batteryPercentages = [0,0,0]", out: "0" },
        ],
        ["1 <= batteryPercentages.length <= 100", "0 <= batteryPercentages[i] <= 100"]),
      hints: [
        "Simulating every decrement is O(n²) — fine here, but there is a one-pass version.",
        "The total decrement applied to device `i` is exactly the number of devices tested before it.",
        "So device `i` is testable when `batteryPercentages[i] - tested > 0`.",
      ],
      editorial: explain({
        idea: "Rather than writing the decrements, carry their count. Device `i` has already lost one point for each earlier tested device, so its effective battery is `battery[i] - tested`.",
        steps: [
          "Keep `tested`, the number of devices tested so far.",
          "At each device, test it when `battery[i] - tested > 0`, and increment `tested`.",
          "Return `tested`.",
        ],
        why: "Every tested device decrements *all* later devices by exactly 1, so the accumulated decrement at position `i` equals the count of tested devices before `i`. The floor at 0 never matters: once the effective value hits 0 the device is skipped anyway.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Actually mutating the array works but must clamp at 0 and is quadratic.",
          "Using `>= 0` instead of `> 0` tests devices whose battery is flat.",
        ],
      }),
      examples: [
        { input: "[1,1,2,1,3]", expectedOutput: "3" },
        { input: "[0,1,2]", expectedOutput: "2" },
        { input: "[0,0,0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const arr = Array.from({ length: n }, () => ri(rng, 0, 12));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countTestedDevices(batteryPercentages: List[int]) -> int:\n    tested = 0\n    for b in batteryPercentages:\n        if b - tested > 0:\n            tested += 1\n    return tested`,
        javascript: `var countTestedDevices = function(batteryPercentages) {\n    let tested = 0;\n    for (let i = 0; i < batteryPercentages.length; i++) {\n        if (batteryPercentages[i] - tested > 0) tested++;\n    }\n    return tested;\n};`,
        typescript: `function countTestedDevices(batteryPercentages: number[]): number {\n    var tested = 0;\n    for (var i = 0; i < batteryPercentages.length; i++) {\n        if (batteryPercentages[i] - tested > 0) tested++;\n    }\n    return tested;\n}`,
        java: `public static int countTestedDevices(int[] batteryPercentages) {\n    int tested = 0;\n    for (int b : batteryPercentages) {\n        if (b - tested > 0) tested++;\n    }\n    return tested;\n}`,
        cpp: `int countTestedDevices(vector<int>& batteryPercentages) {\n    int tested = 0;\n    for (int b : batteryPercentages) {\n        if (b - tested > 0) tested++;\n    }\n    return tested;\n}`,
        c: `int countTestedDevices(int* batteryPercentages, int batteryPercentagesSize) {\n    int tested = 0;\n    for (int i = 0; i < batteryPercentagesSize; i++) {\n        if (batteryPercentages[i] - tested > 0) tested++;\n    }\n    return tested;\n}`,
        csharp: `public static int CountTestedDevices(int[] batteryPercentages)\n{\n    int tested = 0;\n    foreach (int b in batteryPercentages)\n    {\n        if (b - tested > 0) tested++;\n    }\n    return tested;\n}`,
        go: `func countTestedDevices(batteryPercentages []int) int {\n\ttested := 0\n\tfor _, b := range batteryPercentages {\n\t\tif b-tested > 0 {\n\t\t\ttested++\n\t\t}\n\t}\n\treturn tested\n}`,
        kotlin: `fun countTestedDevices(batteryPercentages: IntArray): Int {\n    var tested = 0\n    for (b in batteryPercentages) {\n        if (b - tested > 0) tested++\n    }\n    return tested\n}`,
        swift: `func countTestedDevices(_ batteryPercentages: [Int]) -> Int {\n    var tested = 0\n    for b in batteryPercentages {\n        if b - tested > 0 { tested += 1 }\n    }\n    return tested\n}`,
        rust: `fn countTestedDevices(batteryPercentages: Vec<i32>) -> i32 {\n    let mut tested = 0;\n    for &b in batteryPercentages.iter() {\n        if b - tested > 0 {\n            tested += 1;\n        }\n    }\n    tested\n}`,
        php: `function countTestedDevices($batteryPercentages) {\n    $tested = 0;\n    foreach ($batteryPercentages as $b) {\n        if ($b - $tested > 0) $tested++;\n    }\n    return $tested;\n}`,
        ruby: `def countTestedDevices(batteryPercentages)\n  tested = 0\n  batteryPercentages.each do |b|\n    tested += 1 if b - tested > 0\n  end\n  tested\nend`,
      },
    };
  })(),

  // ── Distribute Money to Maximum Children (LC 2591) ──────────────
  (() => {
    const ref = (money: number, children: number) => {
      if (money < children) return -1;
      let rem = money - children;
      let eights = Math.floor(rem / 7);
      if (eights > children) eights = children;
      rem -= eights * 7;
      if (eights === children && rem > 0) eights--;
      else if (eights === children - 1 && rem === 3) eights--;
      return eights;
    };
    return {
      slug: "distribute-money-to-maximum-children",
      title: "Distribute Money to Maximum Children",
      difficulty: "EASY" as const,
      tags: ["Math", "Greedy", "LeetCode 2591", "Amazon", "Google"],
      signature: {
        funcName: "distMoney",
        params: [{ name: "money", type: "int" as const }, { name: "children", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You have `money` dollars to distribute among `children` children under these rules:\n\n- Every child must receive **at least 1** dollar.\n- No child may receive exactly **4** dollars.\n- All the money must be handed out.\n\nReturn the maximum number of children who can receive exactly **8** dollars, or `-1` if the distribution is impossible.",
        [
          { in: "money = 20, children = 3", out: "1", note: "8 + 9 + 3, or 8 + 3 + 9 — only one child can get exactly 8." },
          { in: "money = 16, children = 2", out: "2", note: "8 + 8." },
          { in: "money = 2, children = 3", out: "-1", note: "There is not even one dollar per child." },
        ],
        ["1 <= money <= 200", "2 <= children <= 30"]),
      hints: [
        "Give every child 1 dollar first; that leaves `money - children` to top up with.",
        "Each 8-dollar child needs 7 more dollars, so at most `(money - children) / 7` of them.",
        "Two edge cases spoil the count: leftover money with every child already at 8, and a final child stuck on exactly 4.",
      ],
      editorial: explain({
        idea: "Hand out the mandatory 1 dollar each, then upgrade children to 8 by spending 7 more on each. Only two corner cases prevent the naive count from being achievable.",
        steps: [
          "Return `-1` when `money < children` — the minimum cannot be met.",
          "Set `rem = money - children` and `eights = min(rem / 7, children)`, then subtract `eights * 7` from `rem`.",
          "If every child got 8 but money remains, one child must take the excess — decrement `eights`.",
          "If exactly one child is left over and they would hold `1 + 3 = 4` dollars, that is forbidden — decrement `eights`.",
          "Return `eights`.",
        ],
        why: "Greedy is optimal because upgrading a child to 8 costs a fixed 7 regardless of who it is. The two adjustments are the only ways a full-looking count is unachievable: leftover cash has nowhere legal to go, and the forbidden value 4 arises only from a single remaining child holding `1 + 3`.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Forgetting the `rem == 3` with one child remaining case gives an off-by-one on inputs like `money = 17, children = 2`.",
          "Forgetting that leftover money must go somewhere over-reports when `money` far exceeds `8 * children`.",
          "`money == children` is valid — everyone gets 1 dollar and the answer is 0.",
        ],
      }),
      examples: [
        { input: "20\n3", expectedOutput: "1" },
        { input: "16\n2", expectedOutput: "2" },
        { input: "2\n3", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const children = ri(rng, 2, 30);
        const money = ri(rng, 1, 200);
        return { input: `${money}\n${children}`, expectedOutput: String(ref(money, children)) };
      },
      solutions: {
        python: `def distMoney(money: int, children: int) -> int:\n    if money < children:\n        return -1\n    rem = money - children\n    eights = min(rem // 7, children)\n    rem -= eights * 7\n    if eights == children and rem > 0:\n        eights -= 1\n    elif eights == children - 1 and rem == 3:\n        eights -= 1\n    return eights`,
        javascript: `var distMoney = function(money, children) {\n    if (money < children) return -1;\n    let rem = money - children;\n    let eights = Math.floor(rem / 7);\n    if (eights > children) eights = children;\n    rem -= eights * 7;\n    if (eights === children && rem > 0) eights--;\n    else if (eights === children - 1 && rem === 3) eights--;\n    return eights;\n};`,
        typescript: `function distMoney(money: number, children: number): number {\n    if (money < children) return -1;\n    var rem = money - children;\n    var eights = Math.floor(rem / 7);\n    if (eights > children) eights = children;\n    rem -= eights * 7;\n    if (eights === children && rem > 0) eights--;\n    else if (eights === children - 1 && rem === 3) eights--;\n    return eights;\n}`,
        java: `public static int distMoney(int money, int children) {\n    if (money < children) return -1;\n    int rem = money - children;\n    int eights = Math.min(rem / 7, children);\n    rem -= eights * 7;\n    if (eights == children && rem > 0) eights--;\n    else if (eights == children - 1 && rem == 3) eights--;\n    return eights;\n}`,
        cpp: `int distMoney(int money, int children) {\n    if (money < children) return -1;\n    int rem = money - children;\n    int eights = min(rem / 7, children);\n    rem -= eights * 7;\n    if (eights == children && rem > 0) eights--;\n    else if (eights == children - 1 && rem == 3) eights--;\n    return eights;\n}`,
        c: `int distMoney(int money, int children) {\n    if (money < children) return -1;\n    int rem = money - children;\n    int eights = rem / 7;\n    if (eights > children) eights = children;\n    rem -= eights * 7;\n    if (eights == children && rem > 0) eights--;\n    else if (eights == children - 1 && rem == 3) eights--;\n    return eights;\n}`,
        csharp: `public static int DistMoney(int money, int children)\n{\n    if (money < children) return -1;\n    int rem = money - children;\n    int eights = Math.Min(rem / 7, children);\n    rem -= eights * 7;\n    if (eights == children && rem > 0) eights--;\n    else if (eights == children - 1 && rem == 3) eights--;\n    return eights;\n}`,
        go: `func distMoney(money int, children int) int {\n\tif money < children {\n\t\treturn -1\n\t}\n\trem := money - children\n\teights := rem / 7\n\tif eights > children {\n\t\teights = children\n\t}\n\trem -= eights * 7\n\tif eights == children && rem > 0 {\n\t\teights--\n\t} else if eights == children-1 && rem == 3 {\n\t\teights--\n\t}\n\treturn eights\n}`,
        kotlin: `fun distMoney(money: Int, children: Int): Int {\n    if (money < children) return -1\n    var rem = money - children\n    var eights = minOf(rem / 7, children)\n    rem -= eights * 7\n    if (eights == children && rem > 0) eights--\n    else if (eights == children - 1 && rem == 3) eights--\n    return eights\n}`,
        swift: `func distMoney(_ money: Int, _ children: Int) -> Int {\n    if money < children { return -1 }\n    var rem = money - children\n    var eights = min(rem / 7, children)\n    rem -= eights * 7\n    if eights == children && rem > 0 { eights -= 1 }\n    else if eights == children - 1 && rem == 3 { eights -= 1 }\n    return eights\n}`,
        rust: `fn distMoney(money: i32, children: i32) -> i32 {\n    if money < children {\n        return -1;\n    }\n    let mut rem = money - children;\n    let mut eights = std::cmp::min(rem / 7, children);\n    rem -= eights * 7;\n    if eights == children && rem > 0 {\n        eights -= 1;\n    } else if eights == children - 1 && rem == 3 {\n        eights -= 1;\n    }\n    eights\n}`,
        php: `function distMoney($money, $children) {\n    if ($money < $children) return -1;\n    $rem = $money - $children;\n    $eights = intdiv($rem, 7);\n    if ($eights > $children) $eights = $children;\n    $rem -= $eights * 7;\n    if ($eights === $children && $rem > 0) $eights--;\n    else if ($eights === $children - 1 && $rem === 3) $eights--;\n    return $eights;\n}`,
        ruby: `def distMoney(money, children)\n  return -1 if money < children\n  rem = money - children\n  eights = [rem / 7, children].min\n  rem -= eights * 7\n  if eights == children && rem > 0\n    eights -= 1\n  elsif eights == children - 1 && rem == 3\n    eights -= 1\n  end\n  eights\nend`,
      },
    };
  })(),

  // ── Minimum Right Shifts to Sort the Array (LC 2855) ────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let drops = 0, at = -1;
      for (let i = 0; i < n; i++) {
        if (nums[i] > nums[(i + 1) % n]) { drops++; at = i; }
      }
      if (drops === 0) return 0;
      if (drops > 1) return -1;
      return n - 1 - at;
    };
    return {
      slug: "minimum-right-shifts-to-sort-the-array",
      title: "Minimum Right Shifts to Sort the Array",
      difficulty: "EASY" as const,
      tags: ["Array", "LeetCode 2855", "Amazon", "Adobe"],
      signature: { funcName: "minimumRightShifts", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A **right shift** moves every element one position to the right, with the last element wrapping around to the front.\n\nGiven an array `nums` of **distinct** positive integers, return the minimum number of right shifts that sorts it in increasing order, or `-1` if no number of shifts can.",
        [
          { in: "nums = [3,4,5,1,2]", out: "2", note: "Two right shifts give [1,2,3,4,5]." },
          { in: "nums = [1,3,5]", out: "0", note: "Already sorted." },
          { in: "nums = [2,1,4]", out: "-1" },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i] <= 100", "All values are distinct."]),
      hints: [
        "A sorted array that has been rotated has exactly one place where a value is followed by a smaller one — counting the wrap-around.",
        "Zero such drops means the array is already sorted.",
        "More than one means no rotation can fix it.",
      ],
      editorial: explain({
        idea: "A rotation of a sorted array is characterised by having at most one \"drop\" in its cyclic order. The drop's position tells you exactly how far it was rotated.",
        steps: [
          "Walk `i` from 0 to `n-1`, comparing `nums[i]` with `nums[(i+1) % n]` — the modulo covers the wrap.",
          "Count the drops and remember the index of the last one.",
          "Zero drops means already sorted, so return 0.",
          "More than one drop means no rotation works, so return `-1`.",
          "Otherwise return `n - 1 - at`, the number of right shifts that moves the drop to the wrap position.",
        ],
        why: "Right-shifting by `k` maps index `i` to `(i + k) % n`. Sorting requires the smallest element to land at index 0, which happens when the drop sits exactly at the boundary — giving `k = n - 1 - at`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Skipping the wrap comparison misses the drop for arrays like `[2,3,1]`.",
          "Confusing right shifts with left shifts inverts the count.",
          "A single-element array has zero drops and answers 0.",
        ],
      }),
      examples: [
        { input: "[3,4,5,1,2]", expectedOutput: "2" },
        { input: "[1,3,5]", expectedOutput: "0" },
        { input: "[2,1,4]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const vals = new Set<number>();
        while (vals.size < n) vals.add(ri(rng, 1, 100));
        let nums = Array.from(vals).sort((a, b) => a - b);
        if (rng() < 0.6) {
          const k = ri(rng, 0, n - 1);
          nums = nums.slice(n - k).concat(nums.slice(0, n - k));
        } else {
          shuffle(rng, nums);
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumRightShifts(nums: List[int]) -> int:\n    n = len(nums)\n    drops = 0\n    at = -1\n    for i in range(n):\n        if nums[i] > nums[(i + 1) % n]:\n            drops += 1\n            at = i\n    if drops == 0:\n        return 0\n    if drops > 1:\n        return -1\n    return n - 1 - at`,
        javascript: `var minimumRightShifts = function(nums) {\n    const n = nums.length;\n    let drops = 0, at = -1;\n    for (let i = 0; i < n; i++) {\n        if (nums[i] > nums[(i + 1) % n]) { drops++; at = i; }\n    }\n    if (drops === 0) return 0;\n    if (drops > 1) return -1;\n    return n - 1 - at;\n};`,
        typescript: `function minimumRightShifts(nums: number[]): number {\n    var n = nums.length;\n    var drops = 0, at = -1;\n    for (var i = 0; i < n; i++) {\n        if (nums[i] > nums[(i + 1) % n]) { drops++; at = i; }\n    }\n    if (drops === 0) return 0;\n    if (drops > 1) return -1;\n    return n - 1 - at;\n}`,
        java: `public static int minimumRightShifts(int[] nums) {\n    int n = nums.length;\n    int drops = 0, at = -1;\n    for (int i = 0; i < n; i++) {\n        if (nums[i] > nums[(i + 1) % n]) { drops++; at = i; }\n    }\n    if (drops == 0) return 0;\n    if (drops > 1) return -1;\n    return n - 1 - at;\n}`,
        cpp: `int minimumRightShifts(vector<int>& nums) {\n    int n = (int) nums.size();\n    int drops = 0, at = -1;\n    for (int i = 0; i < n; i++) {\n        if (nums[i] > nums[(i + 1) % n]) { drops++; at = i; }\n    }\n    if (drops == 0) return 0;\n    if (drops > 1) return -1;\n    return n - 1 - at;\n}`,
        c: `int minimumRightShifts(int* nums, int numsSize) {\n    int drops = 0, at = -1;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] > nums[(i + 1) % numsSize]) { drops++; at = i; }\n    }\n    if (drops == 0) return 0;\n    if (drops > 1) return -1;\n    return numsSize - 1 - at;\n}`,
        csharp: `public static int MinimumRightShifts(int[] nums)\n{\n    int n = nums.Length;\n    int drops = 0, at = -1;\n    for (int i = 0; i < n; i++)\n    {\n        if (nums[i] > nums[(i + 1) % n]) { drops++; at = i; }\n    }\n    if (drops == 0) return 0;\n    if (drops > 1) return -1;\n    return n - 1 - at;\n}`,
        go: `func minimumRightShifts(nums []int) int {\n\tn := len(nums)\n\tdrops, at := 0, -1\n\tfor i := 0; i < n; i++ {\n\t\tif nums[i] > nums[(i+1)%n] {\n\t\t\tdrops++\n\t\t\tat = i\n\t\t}\n\t}\n\tif drops == 0 {\n\t\treturn 0\n\t}\n\tif drops > 1 {\n\t\treturn -1\n\t}\n\treturn n - 1 - at\n}`,
        kotlin: `fun minimumRightShifts(nums: IntArray): Int {\n    val n = nums.size\n    var drops = 0\n    var at = -1\n    for (i in 0 until n) {\n        if (nums[i] > nums[(i + 1) % n]) {\n            drops++\n            at = i\n        }\n    }\n    if (drops == 0) return 0\n    if (drops > 1) return -1\n    return n - 1 - at\n}`,
        swift: `func minimumRightShifts(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var drops = 0\n    var at = -1\n    for i in 0..<n {\n        if nums[i] > nums[(i + 1) % n] {\n            drops += 1\n            at = i\n        }\n    }\n    if drops == 0 { return 0 }\n    if drops > 1 { return -1 }\n    return n - 1 - at\n}`,
        rust: `fn minimumRightShifts(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let mut drops = 0;\n    let mut at: i32 = -1;\n    for i in 0..n {\n        if nums[i] > nums[(i + 1) % n] {\n            drops += 1;\n            at = i as i32;\n        }\n    }\n    if drops == 0 {\n        return 0;\n    }\n    if drops > 1 {\n        return -1;\n    }\n    n as i32 - 1 - at\n}`,
        php: `function minimumRightShifts($nums) {\n    $n = count($nums);\n    $drops = 0; $at = -1;\n    for ($i = 0; $i < $n; $i++) {\n        if ($nums[$i] > $nums[($i + 1) % $n]) { $drops++; $at = $i; }\n    }\n    if ($drops === 0) return 0;\n    if ($drops > 1) return -1;\n    return $n - 1 - $at;\n}`,
        ruby: `def minimumRightShifts(nums)\n  n = nums.length\n  drops = 0\n  at = -1\n  (0...n).each do |i|\n    if nums[i] > nums[(i + 1) % n]\n      drops += 1\n      at = i\n    end\n  end\n  return 0 if drops == 0\n  return -1 if drops > 1\n  n - 1 - at\nend`,
      },
    };
  })(),

  // ── Points That Intersect With Cars (LC 2848) ───────────────────
  (() => {
    const ref = (nums: number[][]) => {
      const covered: Record<string, boolean> = {};
      for (const [s, e] of nums) for (let p = s; p <= e; p++) covered[String(p)] = true;
      return Object.keys(covered).length;
    };
    return {
      slug: "points-that-intersect-with-cars",
      title: "Points That Intersect With Cars",
      difficulty: "EASY" as const,
      tags: ["Array", "Prefix Sum", "LeetCode 2848", "Amazon", "TCS"],
      signature: { funcName: "numberOfPoints", params: [{ name: "nums", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given a 2D array `nums` where `nums[i] = [start, end]` means the `i`-th car is parked on the integer points from `start` to `end`, **inclusive**.\n\nReturn the number of integer points covered by **any** part of a car.",
        [
          { in: "nums = [[3,6],[1,5],[4,7]]", out: "7", note: "Points 1 through 7 are all covered." },
          { in: "nums = [[1,3],[5,8]]", out: "7", note: "Points 1,2,3 and 5,6,7,8." },
          { in: "nums = [[2,2]]", out: "1" },
        ],
        ["1 <= nums.length <= 100", "nums[i].length == 2", "1 <= start <= end <= 100"]),
      hints: [
        "Coordinates only go up to 100, so a boolean array over the points is plenty.",
        "Mark every point of every car, then count the marks.",
        "A difference array works too and generalises to much larger coordinates.",
      ],
      editorial: explain({
        idea: "The coordinate space is tiny, so marking covered points directly and counting them is both simplest and fastest here.",
        steps: [
          "Create a set (or a 101-slot boolean array) of covered points.",
          "For each car, mark every point from `start` to `end` inclusive.",
          "Return the number of distinct marked points.",
        ],
        why: "Marking is idempotent, so overlapping cars are naturally deduplicated — which is exactly what \"covered by any car\" means.",
        time: "O(n · L) where L is the coordinate range",
        space: "O(L)",
        pitfalls: [
          "Summing the interval lengths double-counts overlaps.",
          "The range is inclusive at both ends, so the loop bound is `<= end`.",
          "For a much larger coordinate range, sort-and-merge or a difference array is the right tool.",
        ],
      }),
      examples: [
        { input: "[[3,6],[1,5],[4,7]]", expectedOutput: "7" },
        { input: "[[1,3],[5,8]]", expectedOutput: "7" },
        { input: "[[2,2]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const nums: number[][] = [];
        for (let i = 0; i < n; i++) {
          const s = ri(rng, 1, 100);
          const e = ri(rng, s, 100);
          nums.push([s, e]);
        }
        return { input: fmtIntMat(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numberOfPoints(nums: List[List[int]]) -> int:\n    covered = set()\n    for s, e in nums:\n        for p in range(s, e + 1):\n            covered.add(p)\n    return len(covered)`,
        javascript: `var numberOfPoints = function(nums) {\n    const covered = new Array(102).fill(false);\n    for (let i = 0; i < nums.length; i++) {\n        for (let p = nums[i][0]; p <= nums[i][1]; p++) covered[p] = true;\n    }\n    let count = 0;\n    for (let p = 0; p < covered.length; p++) if (covered[p]) count++;\n    return count;\n};`,
        typescript: `function numberOfPoints(nums: number[][]): number {\n    var covered: boolean[] = [];\n    for (var k = 0; k < 102; k++) covered.push(false);\n    for (var i = 0; i < nums.length; i++) {\n        for (var p = nums[i][0]; p <= nums[i][1]; p++) covered[p] = true;\n    }\n    var count = 0;\n    for (var q = 0; q < covered.length; q++) if (covered[q]) count++;\n    return count;\n}`,
        java: `public static int numberOfPoints(int[][] nums) {\n    boolean[] covered = new boolean[102];\n    for (int[] car : nums) {\n        for (int p = car[0]; p <= car[1]; p++) covered[p] = true;\n    }\n    int count = 0;\n    for (boolean c : covered) if (c) count++;\n    return count;\n}`,
        cpp: `int numberOfPoints(vector<vector<int>>& nums) {\n    vector<bool> covered(102, false);\n    for (auto& car : nums) {\n        for (int p = car[0]; p <= car[1]; p++) covered[p] = true;\n    }\n    int count = 0;\n    for (int p = 0; p < 102; p++) if (covered[p]) count++;\n    return count;\n}`,
        c: `int numberOfPoints(int** nums, int numsSize, int* numsColSize) {\n    int covered[102];\n    for (int i = 0; i < 102; i++) covered[i] = 0;\n    for (int i = 0; i < numsSize; i++) {\n        for (int p = nums[i][0]; p <= nums[i][1]; p++) covered[p] = 1;\n    }\n    int count = 0;\n    for (int i = 0; i < 102; i++) if (covered[i]) count++;\n    return count;\n}`,
        csharp: `public static int NumberOfPoints(int[][] nums)\n{\n    bool[] covered = new bool[102];\n    foreach (int[] car in nums)\n    {\n        for (int p = car[0]; p <= car[1]; p++) covered[p] = true;\n    }\n    int count = 0;\n    foreach (bool c in covered) if (c) count++;\n    return count;\n}`,
        go: `func numberOfPoints(nums [][]int) int {\n\tcovered := make([]bool, 102)\n\tfor _, car := range nums {\n\t\tfor p := car[0]; p <= car[1]; p++ {\n\t\t\tcovered[p] = true\n\t\t}\n\t}\n\tcount := 0\n\tfor _, c := range covered {\n\t\tif c {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun numberOfPoints(nums: Array<IntArray>): Int {\n    val covered = BooleanArray(102)\n    for (car in nums) {\n        for (p in car[0]..car[1]) covered[p] = true\n    }\n    var count = 0\n    for (c in covered) if (c) count++\n    return count\n}`,
        swift: `func numberOfPoints(_ nums: [[Int]]) -> Int {\n    var covered = [Bool](repeating: false, count: 102)\n    for car in nums {\n        for p in car[0]...car[1] { covered[p] = true }\n    }\n    var count = 0\n    for c in covered where c { count += 1 }\n    return count\n}`,
        rust: `fn numberOfPoints(nums: Vec<Vec<i32>>) -> i32 {\n    let mut covered = vec![false; 102];\n    for car in nums.iter() {\n        for p in car[0]..=car[1] {\n            covered[p as usize] = true;\n        }\n    }\n    let mut count = 0;\n    for &c in covered.iter() {\n        if c {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function numberOfPoints($nums) {\n    $covered = array_fill(0, 102, false);\n    foreach ($nums as $car) {\n        for ($p = $car[0]; $p <= $car[1]; $p++) $covered[$p] = true;\n    }\n    $count = 0;\n    foreach ($covered as $c) if ($c) $count++;\n    return $count;\n}`,
        ruby: `def numberOfPoints(nums)\n  covered = {}\n  nums.each do |s, e|\n    (s..e).each { |p| covered[p] = true }\n  end\n  covered.size\nend`,
      },
    };
  })(),

  // ── Maximum Odd Binary Number (LC 2864) ─────────────────────────
  (() => {
    const ref = (s: string) => {
      let ones = 0;
      for (const c of s) if (c === "1") ones++;
      const zeros = s.length - ones;
      return "1".repeat(ones - 1) + "0".repeat(zeros) + "1";
    };
    return {
      slug: "maximum-odd-binary-number",
      title: "Maximum Odd Binary Number",
      difficulty: "EASY" as const,
      tags: ["String", "Greedy", "LeetCode 2864", "Amazon", "Google"],
      signature: { funcName: "maximumOddBinaryNumber", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a binary string `s` containing **at least one** `'1'`.\n\nRearrange its bits to form the **maximum odd** binary number possible. The result may have leading zeros. Return it as a string.",
        [
          { in: 's = "010"', out: "001", note: "There is only one 1, and it must be the last bit for the number to be odd." },
          { in: 's = "0101"', out: "1001", note: "One 1 goes last; the other goes as far left as possible." },
          { in: 's = "111"', out: "111" },
        ],
        ["1 <= s.length <= 100", "s consists only of '0' and '1'.", "s contains at least one '1'."]),
      hints: [
        "Odd means the **last** bit must be a 1 — that consumes one of them.",
        "To maximise the value, push every remaining 1 as far left as possible.",
        "So the answer is `(ones - 1)` ones, then all the zeros, then a final 1.",
      ],
      editorial: explain({
        idea: "Parity fixes the last bit; maximisation fixes everything else. Reserve one 1 for the units place and put the rest at the front.",
        steps: [
          "Count the ones; the zeros are the rest.",
          "Emit `ones - 1` ones, then every zero, then a single trailing 1.",
        ],
        why: "Any odd arrangement must end in 1. Among those, value is maximised by placing the remaining ones in the most significant positions available — which is exactly a block of ones followed by a block of zeros.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Sorting descending gives the maximum number but usually an even one.",
          "With exactly one 1, `ones - 1` is 0 and the answer is all zeros followed by that 1.",
          "The result keeps the original length, leading zeros included.",
        ],
      }),
      examples: [
        { input: '"010"', expectedOutput: "001" },
        { input: '"0101"', expectedOutput: "1001" },
        { input: '"111"', expectedOutput: "111" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        let s = "";
        for (let i = 0; i < n; i++) s += rng() < 0.5 ? "1" : "0";
        if (s.indexOf("1") === -1) s = "1" + s.slice(1);
        return { input: JSON.stringify(s), expectedOutput: ref(s) };
      },
      solutions: {
        python: `def maximumOddBinaryNumber(s: str) -> str:\n    ones = s.count('1')\n    zeros = len(s) - ones\n    return '1' * (ones - 1) + '0' * zeros + '1'`,
        javascript: `var maximumOddBinaryNumber = function(s) {\n    let ones = 0;\n    for (let i = 0; i < s.length; i++) if (s.charAt(i) === "1") ones++;\n    const zeros = s.length - ones;\n    let out = "";\n    for (let i = 0; i < ones - 1; i++) out += "1";\n    for (let i = 0; i < zeros; i++) out += "0";\n    return out + "1";\n};`,
        typescript: `function maximumOddBinaryNumber(s: string): string {\n    var ones = 0;\n    for (var i = 0; i < s.length; i++) if (s.charAt(i) === "1") ones++;\n    var zeros = s.length - ones;\n    var out = "";\n    for (var a = 0; a < ones - 1; a++) out += "1";\n    for (var b = 0; b < zeros; b++) out += "0";\n    return out + "1";\n}`,
        java: `public static String maximumOddBinaryNumber(String s) {\n    int ones = 0;\n    for (int i = 0; i < s.length(); i++) if (s.charAt(i) == '1') ones++;\n    int zeros = s.length() - ones;\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < ones - 1; i++) sb.append('1');\n    for (int i = 0; i < zeros; i++) sb.append('0');\n    sb.append('1');\n    return sb.toString();\n}`,
        cpp: `string maximumOddBinaryNumber(string s) {\n    int ones = 0;\n    for (char c : s) if (c == '1') ones++;\n    int zeros = (int) s.size() - ones;\n    return string(ones - 1, '1') + string(zeros, '0') + "1";\n}`,
        c: `char* maximumOddBinaryNumber(const char* s) {\n    int n = (int) strlen(s);\n    int ones = 0;\n    for (int i = 0; i < n; i++) if (s[i] == '1') ones++;\n    int zeros = n - ones;\n    char* out = (char*) malloc(n + 1);\n    int pos = 0;\n    for (int i = 0; i < ones - 1; i++) out[pos++] = '1';\n    for (int i = 0; i < zeros; i++) out[pos++] = '0';\n    out[pos++] = '1';\n    out[pos] = '\\0';\n    return out;\n}`,
        csharp: `public static string MaximumOddBinaryNumber(string s)\n{\n    int ones = 0;\n    foreach (char c in s) if (c == '1') ones++;\n    int zeros = s.Length - ones;\n    return new string('1', ones - 1) + new string('0', zeros) + "1";\n}`,
        go: `func maximumOddBinaryNumber(s string) string {\n\tones := 0\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] == '1' {\n\t\t\tones++\n\t\t}\n\t}\n\tzeros := len(s) - ones\n\treturn strings.Repeat("1", ones-1) + strings.Repeat("0", zeros) + "1"\n}`,
        kotlin: `fun maximumOddBinaryNumber(s: String): String {\n    var ones = 0\n    for (c in s) if (c == '1') ones++\n    val zeros = s.length - ones\n    val sb = StringBuilder()\n    for (i in 0 until ones - 1) sb.append('1')\n    for (i in 0 until zeros) sb.append('0')\n    sb.append('1')\n    return sb.toString()\n}`,
        swift: `func maximumOddBinaryNumber(_ s: String) -> String {\n    var ones = 0\n    for c in s where c == "1" { ones += 1 }\n    let zeros = s.count - ones\n    return String(repeating: "1", count: ones - 1) + String(repeating: "0", count: zeros) + "1"\n}`,
        rust: `fn maximumOddBinaryNumber(s: String) -> String {\n    let mut ones = 0;\n    for b in s.bytes() {\n        if b == b'1' {\n            ones += 1;\n        }\n    }\n    let zeros = s.len() - ones;\n    let mut out = String::new();\n    for _ in 0..(ones - 1) {\n        out.push('1');\n    }\n    for _ in 0..zeros {\n        out.push('0');\n    }\n    out.push('1');\n    out\n}`,
        php: `function maximumOddBinaryNumber($s) {\n    $ones = substr_count($s, "1");\n    $zeros = strlen($s) - $ones;\n    return str_repeat("1", $ones - 1) . str_repeat("0", $zeros) . "1";\n}`,
        ruby: `def maximumOddBinaryNumber(s)\n  ones = s.count("1")\n  zeros = s.length - ones\n  "1" * (ones - 1) + "0" * zeros + "1"\nend`,
      },
    };
  })(),

  // ── Remove Trailing Zeros From a String (LC 2710) ───────────────
  (() => {
    const ref = (num: string) => {
      let end = num.length;
      while (end > 0 && num[end - 1] === "0") end--;
      return num.slice(0, end);
    };
    return {
      slug: "remove-trailing-zeros-from-a-string",
      title: "Remove Trailing Zeros From a String",
      difficulty: "EASY" as const,
      tags: ["String", "LeetCode 2710", "Amazon", "TCS"],
      signature: { funcName: "removeTrailingZeros", params: [{ name: "num", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given a positive integer represented as the string `num`, remove its **trailing** zeros and return the result.",
        [
          { in: 'num = "51230100"', out: "512301", note: "Two trailing zeros are removed." },
          { in: 'num = "123"', out: "123", note: "There are no trailing zeros." },
          { in: 'num = "1000"', out: "1" },
        ],
        ["1 <= num.length <= 1000", "num consists of digits.", "num has no leading zeros."]),
      hints: [
        "Walk backwards from the end while the character is `'0'`.",
        "Slice the string at the first non-zero position from the right.",
        "Interior zeros must be preserved — only the trailing run goes.",
      ],
      editorial: explain({
        idea: "Find where the trailing run of zeros begins, then cut there. One backwards scan is enough.",
        steps: [
          "Start `end` at the string length.",
          "While the character at `end - 1` is `'0'`, decrement `end`.",
          "Return the prefix of length `end`.",
        ],
        why: "The loop stops at the first non-zero from the right, so everything before it — including any interior zeros — is preserved exactly.",
        time: "O(n)",
        space: "O(n) for the result",
        pitfalls: [
          "Removing all zeros rather than only the trailing ones destroys `\"51230100\"` → `\"5123 1\"`.",
          "The input has no leading zeros and is positive, so the result is never empty.",
          "A regex like `/0+$/` works, but the manual scan makes the \"trailing only\" intent explicit.",
        ],
      }),
      examples: [
        { input: '"51230100"', expectedOutput: "512301" },
        { input: '"123"', expectedOutput: "123" },
        { input: '"1000"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, 1, 20);
        let num = String(ri(rng, 1, 9));
        for (let i = 1; i < len; i++) num += String(rng() < 0.4 ? 0 : ri(rng, 0, 9));
        return { input: JSON.stringify(num), expectedOutput: ref(num) };
      },
      solutions: {
        python: `def removeTrailingZeros(num: str) -> str:\n    end = len(num)\n    while end > 0 and num[end - 1] == '0':\n        end -= 1\n    return num[:end]`,
        javascript: `var removeTrailingZeros = function(num) {\n    let end = num.length;\n    while (end > 0 && num.charAt(end - 1) === "0") end--;\n    return num.slice(0, end);\n};`,
        typescript: `function removeTrailingZeros(num: string): string {\n    var end = num.length;\n    while (end > 0 && num.charAt(end - 1) === "0") end--;\n    return num.slice(0, end);\n}`,
        java: `public static String removeTrailingZeros(String num) {\n    int end = num.length();\n    while (end > 0 && num.charAt(end - 1) == '0') end--;\n    return num.substring(0, end);\n}`,
        cpp: `string removeTrailingZeros(string num) {\n    int end = (int) num.size();\n    while (end > 0 && num[end - 1] == '0') end--;\n    return num.substr(0, end);\n}`,
        c: `char* removeTrailingZeros(const char* num) {\n    int end = (int) strlen(num);\n    while (end > 0 && num[end - 1] == '0') end--;\n    char* out = (char*) malloc(end + 1);\n    memcpy(out, num, end);\n    out[end] = '\\0';\n    return out;\n}`,
        csharp: `public static string RemoveTrailingZeros(string num)\n{\n    int end = num.Length;\n    while (end > 0 && num[end - 1] == '0') end--;\n    return num.Substring(0, end);\n}`,
        go: `func removeTrailingZeros(num string) string {\n\tend := len(num)\n\tfor end > 0 && num[end-1] == '0' {\n\t\tend--\n\t}\n\treturn num[:end]\n}`,
        kotlin: `fun removeTrailingZeros(num: String): String {\n    var end = num.length\n    while (end > 0 && num[end - 1] == '0') end--\n    return num.substring(0, end)\n}`,
        swift: `func removeTrailingZeros(_ num: String) -> String {\n    let a = Array(num)\n    var end = a.count\n    while end > 0 && a[end - 1] == "0" { end -= 1 }\n    return String(a[0..<end])\n}`,
        rust: `fn removeTrailingZeros(num: String) -> String {\n    let a = num.as_bytes();\n    let mut end = a.len();\n    while end > 0 && a[end - 1] == b'0' {\n        end -= 1;\n    }\n    num[..end].to_string()\n}`,
        php: `function removeTrailingZeros($num) {\n    $end = strlen($num);\n    while ($end > 0 && $num[$end - 1] === '0') $end--;\n    return substr($num, 0, $end);\n}`,
        ruby: `def removeTrailingZeros(num)\n  last = num.length\n  last -= 1 while last > 0 && num[last - 1] == "0"\n  num[0, last]\nend`,
      },
    };
  })(),

  // ── Count Symmetric Integers (LC 2843) ──────────────────────────
  (() => {
    const ref = (low: number, high: number) => {
      let count = 0;
      for (let n = low; n <= high; n++) {
        const s = String(n);
        if (s.length % 2 !== 0) continue;
        const half = s.length / 2;
        let a = 0, b = 0;
        for (let i = 0; i < half; i++) a += s.charCodeAt(i) - 48;
        for (let i = half; i < s.length; i++) b += s.charCodeAt(i) - 48;
        if (a === b) count++;
      }
      return count;
    };
    return {
      slug: "count-symmetric-integers",
      title: "Count Symmetric Integers",
      difficulty: "EASY" as const,
      tags: ["Math", "Enumeration", "LeetCode 2843", "Amazon", "Infosys"],
      signature: {
        funcName: "countSymmetricIntegers",
        params: [{ name: "low", type: "int" as const }, { name: "high", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "An integer `x` is **symmetric** if it has an even number of digits `2 * n` and the sum of its first `n` digits equals the sum of its last `n` digits. Numbers with an odd digit count are never symmetric.\n\nReturn how many integers in the inclusive range `[low, high]` are symmetric.",
        [
          { in: "low = 1, high = 100", out: "9", note: "11, 22, 33, 44, 55, 66, 77, 88 and 99." },
          { in: "low = 1200, high = 1230", out: "4", note: "1203, 1212, 1221 and 1230." },
          { in: "low = 100, high = 999", out: "0", note: "Every value has three digits." },
        ],
        ["1 <= low <= high <= 10000"]),
      hints: [
        "The range is at most 10,000 values, so testing each one is fine.",
        "Reject an odd digit count immediately.",
        "Otherwise split the digit string in half and compare the two sums.",
      ],
      editorial: explain({
        idea: "A direct scan over the range with a cheap per-number test — the digit count filter throws away most candidates instantly.",
        steps: [
          "Loop `n` from `low` to `high`.",
          "Convert `n` to a string; skip it if the length is odd.",
          "Sum the first half's digits and the second half's digits.",
          "Count the number when the two sums match.",
        ],
        why: "The definition is checked literally for every candidate, so the count is exact. The odd-length short-circuit keeps the inner work small.",
        time: "O((high - low) · d)",
        space: "O(1)",
        pitfalls: [
          "Confusing symmetric with palindromic — `1203` is symmetric but not a palindrome.",
          "Forgetting to skip odd-length numbers makes the halves ambiguous.",
          "The range is inclusive at both ends.",
        ],
      }),
      examples: [
        { input: "1\n100", expectedOutput: "9" },
        { input: "1200\n1230", expectedOutput: "4" },
        { input: "100\n999", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const low = ri(rng, 1, 9000);
        const high = ri(rng, low, Math.min(10000, low + ri(rng, 0, 2000)));
        return { input: `${low}\n${high}`, expectedOutput: String(ref(low, high)) };
      },
      solutions: {
        python: `def countSymmetricIntegers(low: int, high: int) -> int:\n    count = 0\n    for n in range(low, high + 1):\n        s = str(n)\n        if len(s) % 2 != 0:\n            continue\n        half = len(s) // 2\n        if sum(int(c) for c in s[:half]) == sum(int(c) for c in s[half:]):\n            count += 1\n    return count`,
        javascript: `var countSymmetricIntegers = function(low, high) {\n    let count = 0;\n    for (let n = low; n <= high; n++) {\n        const s = String(n);\n        if (s.length % 2 !== 0) continue;\n        const half = s.length / 2;\n        let a = 0, b = 0;\n        for (let i = 0; i < half; i++) a += s.charCodeAt(i) - 48;\n        for (let i = half; i < s.length; i++) b += s.charCodeAt(i) - 48;\n        if (a === b) count++;\n    }\n    return count;\n};`,
        typescript: `function countSymmetricIntegers(low: number, high: number): number {\n    var count = 0;\n    for (var n = low; n <= high; n++) {\n        var s = String(n);\n        if (s.length % 2 !== 0) continue;\n        var half = s.length / 2;\n        var a = 0, b = 0;\n        for (var i = 0; i < half; i++) a += s.charCodeAt(i) - 48;\n        for (var j = half; j < s.length; j++) b += s.charCodeAt(j) - 48;\n        if (a === b) count++;\n    }\n    return count;\n}`,
        java: `public static int countSymmetricIntegers(int low, int high) {\n    int count = 0;\n    for (int n = low; n <= high; n++) {\n        String s = Integer.toString(n);\n        if (s.length() % 2 != 0) continue;\n        int half = s.length() / 2;\n        int a = 0, b = 0;\n        for (int i = 0; i < half; i++) a += s.charAt(i) - '0';\n        for (int i = half; i < s.length(); i++) b += s.charAt(i) - '0';\n        if (a == b) count++;\n    }\n    return count;\n}`,
        cpp: `int countSymmetricIntegers(int low, int high) {\n    int count = 0;\n    for (int n = low; n <= high; n++) {\n        string s = to_string(n);\n        if (s.size() % 2 != 0) continue;\n        int half = (int) s.size() / 2;\n        int a = 0, b = 0;\n        for (int i = 0; i < half; i++) a += s[i] - '0';\n        for (int i = half; i < (int) s.size(); i++) b += s[i] - '0';\n        if (a == b) count++;\n    }\n    return count;\n}`,
        c: `int countSymmetricIntegers(int low, int high) {\n    int count = 0;\n    for (int n = low; n <= high; n++) {\n        char s[16];\n        sprintf(s, "%d", n);\n        int len = (int) strlen(s);\n        if (len % 2 != 0) continue;\n        int half = len / 2;\n        int a = 0, b = 0;\n        for (int i = 0; i < half; i++) a += s[i] - '0';\n        for (int i = half; i < len; i++) b += s[i] - '0';\n        if (a == b) count++;\n    }\n    return count;\n}`,
        csharp: `public static int CountSymmetricIntegers(int low, int high)\n{\n    int count = 0;\n    for (int n = low; n <= high; n++)\n    {\n        string s = n.ToString();\n        if (s.Length % 2 != 0) continue;\n        int half = s.Length / 2;\n        int a = 0, b = 0;\n        for (int i = 0; i < half; i++) a += s[i] - '0';\n        for (int i = half; i < s.Length; i++) b += s[i] - '0';\n        if (a == b) count++;\n    }\n    return count;\n}`,
        go: `func countSymmetricIntegers(low int, high int) int {\n\tcount := 0\n\tfor n := low; n <= high; n++ {\n\t\ts := strconv.Itoa(n)\n\t\tif len(s)%2 != 0 {\n\t\t\tcontinue\n\t\t}\n\t\thalf := len(s) / 2\n\t\ta, b := 0, 0\n\t\tfor i := 0; i < half; i++ {\n\t\t\ta += int(s[i] - '0')\n\t\t}\n\t\tfor i := half; i < len(s); i++ {\n\t\t\tb += int(s[i] - '0')\n\t\t}\n\t\tif a == b {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countSymmetricIntegers(low: Int, high: Int): Int {\n    var count = 0\n    for (n in low..high) {\n        val s = n.toString()\n        if (s.length % 2 != 0) continue\n        val half = s.length / 2\n        var a = 0\n        var b = 0\n        for (i in 0 until half) a += s[i] - '0'\n        for (i in half until s.length) b += s[i] - '0'\n        if (a == b) count++\n    }\n    return count\n}`,
        swift: `func countSymmetricIntegers(_ low: Int, _ high: Int) -> Int {\n    var count = 0\n    for n in low...high {\n        let s = Array(String(n).unicodeScalars).map { Int($0.value) - 48 }\n        if s.count % 2 != 0 { continue }\n        let half = s.count / 2\n        var a = 0\n        var b = 0\n        for i in 0..<half { a += s[i] }\n        for i in half..<s.count { b += s[i] }\n        if a == b { count += 1 }\n    }\n    return count\n}`,
        rust: `fn countSymmetricIntegers(low: i32, high: i32) -> i32 {\n    let mut count = 0;\n    for n in low..=high {\n        let s = n.to_string();\n        let a = s.as_bytes();\n        if a.len() % 2 != 0 {\n            continue;\n        }\n        let half = a.len() / 2;\n        let mut x = 0;\n        let mut y = 0;\n        for i in 0..half {\n            x += (a[i] - b'0') as i32;\n        }\n        for i in half..a.len() {\n            y += (a[i] - b'0') as i32;\n        }\n        if x == y {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function countSymmetricIntegers($low, $high) {\n    $count = 0;\n    for ($n = $low; $n <= $high; $n++) {\n        $s = (string) $n;\n        $len = strlen($s);\n        if ($len % 2 !== 0) continue;\n        $half = intdiv($len, 2);\n        $a = 0; $b = 0;\n        for ($i = 0; $i < $half; $i++) $a += ord($s[$i]) - 48;\n        for ($i = $half; $i < $len; $i++) $b += ord($s[$i]) - 48;\n        if ($a === $b) $count++;\n    }\n    return $count;\n}`,
        ruby: `def countSymmetricIntegers(low, high)\n  count = 0\n  (low..high).each do |n|\n    s = n.to_s\n    next if s.length.odd?\n    half = s.length / 2\n    a = s[0, half].chars.map(&:to_i).sum\n    b = s[half..-1].chars.map(&:to_i).sum\n    count += 1 if a == b\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Smallest Even Multiple (LC 2413) ────────────────────────────
  (() => {
    const ref = (n: number) => (n % 2 === 0 ? n : n * 2);
    return {
      slug: "smallest-even-multiple",
      title: "Smallest Even Multiple",
      difficulty: "EASY" as const,
      tags: ["Math", "Number Theory", "LeetCode 2413", "Amazon", "TCS"],
      signature: { funcName: "smallestEvenMultiple", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a positive integer `n`, return the **smallest positive integer** that is a multiple of both `2` and `n`.",
        [
          { in: "n = 5", out: "10", note: "10 is the smallest multiple of both 2 and 5." },
          { in: "n = 6", out: "6", note: "6 is already even." },
          { in: "n = 1", out: "2" },
        ],
        ["1 <= n <= 150"]),
      hints: [
        "This is the least common multiple of 2 and `n`.",
        "If `n` is already even it is its own answer.",
        "Otherwise the answer is `2n`, since 2 and an odd `n` share no factor.",
      ],
      editorial: explain({
        idea: "`lcm(2, n) = 2n / gcd(2, n)`, and `gcd(2, n)` is 2 when `n` is even and 1 when it is odd — which collapses to a single parity test.",
        steps: [
          "If `n` is even, return `n`.",
          "Otherwise return `2 * n`.",
        ],
        why: "An even `n` is already a multiple of 2, so nothing smaller works. An odd `n` shares no factor with 2, so the least common multiple is their product.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Returning `2 * n` unconditionally overshoots for even inputs.",
          "`n = 1` answers 2, which the odd branch handles.",
        ],
      }),
      examples: [
        { input: "5", expectedOutput: "10" },
        { input: "6", expectedOutput: "6" },
        { input: "1", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 150);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def smallestEvenMultiple(n: int) -> int:\n    return n if n % 2 == 0 else n * 2`,
        javascript: `var smallestEvenMultiple = function(n) {\n    return n % 2 === 0 ? n : n * 2;\n};`,
        typescript: `function smallestEvenMultiple(n: number): number {\n    return n % 2 === 0 ? n : n * 2;\n}`,
        java: `public static int smallestEvenMultiple(int n) {\n    return n % 2 == 0 ? n : n * 2;\n}`,
        cpp: `int smallestEvenMultiple(int n) {\n    return n % 2 == 0 ? n : n * 2;\n}`,
        c: `int smallestEvenMultiple(int n) {\n    return n % 2 == 0 ? n : n * 2;\n}`,
        csharp: `public static int SmallestEvenMultiple(int n)\n{\n    return n % 2 == 0 ? n : n * 2;\n}`,
        go: `func smallestEvenMultiple(n int) int {\n\tif n%2 == 0 {\n\t\treturn n\n\t}\n\treturn n * 2\n}`,
        kotlin: `fun smallestEvenMultiple(n: Int): Int {\n    return if (n % 2 == 0) n else n * 2\n}`,
        swift: `func smallestEvenMultiple(_ n: Int) -> Int {\n    return n % 2 == 0 ? n : n * 2\n}`,
        rust: `fn smallestEvenMultiple(n: i32) -> i32 {\n    if n % 2 == 0 {\n        n\n    } else {\n        n * 2\n    }\n}`,
        php: `function smallestEvenMultiple($n) {\n    return $n % 2 === 0 ? $n : $n * 2;\n}`,
        ruby: `def smallestEvenMultiple(n)\n  n.even? ? n : n * 2\nend`,
      },
    };
  })(),

  // ── Number of Common Factors (LC 2427) ──────────────────────────
  (() => {
    const ref = (a: number, b: number) => {
      const m = Math.min(a, b);
      let count = 0;
      for (let d = 1; d <= m; d++) if (a % d === 0 && b % d === 0) count++;
      return count;
    };
    return {
      slug: "number-of-common-factors",
      title: "Number of Common Factors",
      difficulty: "EASY" as const,
      tags: ["Math", "Number Theory", "Enumeration", "LeetCode 2427", "Amazon", "Infosys"],
      signature: {
        funcName: "commonFactors",
        params: [{ name: "a", type: "int" as const }, { name: "b", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given two positive integers `a` and `b`, return the number of **common factors** they share.\n\nAn integer `x` is a common factor if it divides both `a` and `b` exactly.",
        [
          { in: "a = 12, b = 6", out: "4", note: "The common factors are 1, 2, 3 and 6." },
          { in: "a = 25, b = 30", out: "2", note: "The common factors are 1 and 5." },
          { in: "a = 7, b = 13", out: "1" },
        ],
        ["1 <= a, b <= 1000"]),
      hints: [
        "A common factor cannot exceed the smaller of the two numbers.",
        "Test every candidate from 1 up to `min(a, b)`.",
        "Equivalently, the answer is the number of divisors of `gcd(a, b)`.",
      ],
      editorial: explain({
        idea: "The common factors of `a` and `b` are exactly the divisors of `gcd(a, b)`, but with both values bounded by 1000 a direct scan is simplest.",
        steps: [
          "Loop `d` from 1 to `min(a, b)`.",
          "Count `d` when it divides both `a` and `b`.",
        ],
        why: "`d | a` and `d | b` together are equivalent to `d | gcd(a, b)`, so the scan counts precisely the divisors of the gcd — the same answer either way.",
        time: "O(min(a, b))",
        space: "O(1)",
        pitfalls: [
          "Looping to `max(a, b)` wastes work and can never find an extra factor.",
          "1 is always a common factor, so the answer is never 0.",
        ],
      }),
      examples: [
        { input: "12\n6", expectedOutput: "4" },
        { input: "25\n30", expectedOutput: "2" },
        { input: "7\n13", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const a = ri(rng, 1, 1000);
        const b = ri(rng, 1, 1000);
        return { input: `${a}\n${b}`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: `def commonFactors(a: int, b: int) -> int:\n    return sum(1 for d in range(1, min(a, b) + 1) if a % d == 0 and b % d == 0)`,
        javascript: `var commonFactors = function(a, b) {\n    const m = Math.min(a, b);\n    let count = 0;\n    for (let d = 1; d <= m; d++) {\n        if (a % d === 0 && b % d === 0) count++;\n    }\n    return count;\n};`,
        typescript: `function commonFactors(a: number, b: number): number {\n    var m = Math.min(a, b);\n    var count = 0;\n    for (var d = 1; d <= m; d++) {\n        if (a % d === 0 && b % d === 0) count++;\n    }\n    return count;\n}`,
        java: `public static int commonFactors(int a, int b) {\n    int m = Math.min(a, b);\n    int count = 0;\n    for (int d = 1; d <= m; d++) {\n        if (a % d == 0 && b % d == 0) count++;\n    }\n    return count;\n}`,
        cpp: `int commonFactors(int a, int b) {\n    int m = min(a, b);\n    int count = 0;\n    for (int d = 1; d <= m; d++) {\n        if (a % d == 0 && b % d == 0) count++;\n    }\n    return count;\n}`,
        c: `int commonFactors(int a, int b) {\n    int m = a < b ? a : b;\n    int count = 0;\n    for (int d = 1; d <= m; d++) {\n        if (a % d == 0 && b % d == 0) count++;\n    }\n    return count;\n}`,
        csharp: `public static int CommonFactors(int a, int b)\n{\n    int m = Math.Min(a, b);\n    int count = 0;\n    for (int d = 1; d <= m; d++)\n    {\n        if (a % d == 0 && b % d == 0) count++;\n    }\n    return count;\n}`,
        go: `func commonFactors(a int, b int) int {\n\tm := a\n\tif b < m {\n\t\tm = b\n\t}\n\tcount := 0\n\tfor d := 1; d <= m; d++ {\n\t\tif a%d == 0 && b%d == 0 {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun commonFactors(a: Int, b: Int): Int {\n    val m = minOf(a, b)\n    var count = 0\n    for (d in 1..m) {\n        if (a % d == 0 && b % d == 0) count++\n    }\n    return count\n}`,
        swift: `func commonFactors(_ a: Int, _ b: Int) -> Int {\n    let m = min(a, b)\n    var count = 0\n    for d in 1...m {\n        if a % d == 0 && b % d == 0 { count += 1 }\n    }\n    return count\n}`,
        rust: `fn commonFactors(a: i32, b: i32) -> i32 {\n    let m = std::cmp::min(a, b);\n    let mut count = 0;\n    for d in 1..=m {\n        if a % d == 0 && b % d == 0 {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function commonFactors($a, $b) {\n    $m = min($a, $b);\n    $count = 0;\n    for ($d = 1; $d <= $m; $d++) {\n        if ($a % $d === 0 && $b % $d === 0) $count++;\n    }\n    return $count;\n}`,
        ruby: `def commonFactors(a, b)\n  (1..[a, b].min).count { |d| a % d == 0 && b % d == 0 }\nend`,
      },
    };
  })(),

  // ── Count the Digits That Divide a Number (LC 2520) ─────────────
  (() => {
    const ref = (num: number) => {
      let count = 0, x = num;
      while (x > 0) {
        const d = x % 10;
        if (d !== 0 && num % d === 0) count++;
        x = Math.floor(x / 10);
      }
      return count;
    };
    return {
      slug: "count-the-digits-that-divide-a-number",
      title: "Count the Digits That Divide a Number",
      difficulty: "EASY" as const,
      tags: ["Math", "LeetCode 2520", "Amazon", "TCS", "Capgemini"],
      signature: { funcName: "countDigits", params: [{ name: "num", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer `num`, return the number of its digits that **divide** `num` exactly.\n\nA digit `d` divides `num` if `num % d == 0`. Digits equal to `0` never divide anything and are simply skipped.",
        [
          { in: "num = 7", out: "1", note: "7 divides 7." },
          { in: "num = 121", out: "2", note: "Both 1s divide 121; the 2 does not." },
          { in: "num = 1248", out: "4", note: "1, 2, 4 and 8 all divide 1248." },
        ],
        ["1 <= num <= 1000000000", "num does not contain the digit 0 in the given tests unless noted."]),
      hints: [
        "Peel digits off with `% 10` and `/ 10` — do not build a string unless you want to.",
        "Keep the **original** value around; you divide by each digit, not by the shrinking remainder.",
        "Skip a zero digit rather than dividing by it.",
      ],
      editorial: explain({
        idea: "Extract each digit and test it against the original number. The only trap is remembering to compare against `num`, not the value being shifted.",
        steps: [
          "Copy `num` into a working variable `x`.",
          "While `x > 0`, take `d = x % 10`.",
          "Count `d` when it is non-zero and `num % d == 0`.",
          "Divide `x` by 10 and continue.",
        ],
        why: "Each digit is visited exactly once, and the divisibility test uses the unchanged original — which is what the definition asks.",
        time: "O(log num)",
        space: "O(1)",
        pitfalls: [
          "Testing `x % d` instead of `num % d` compares against the truncated remainder.",
          "Dividing by a zero digit crashes or yields NaN — skip it.",
          "Repeated digits each count separately, as `121` shows.",
        ],
      }),
      examples: [
        { input: "7", expectedOutput: "1" },
        { input: "121", expectedOutput: "2" },
        { input: "1248", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, 1, 9);
        let num = 0;
        for (let i = 0; i < len; i++) num = num * 10 + ri(rng, i === 0 ? 1 : 0, 9);
        return { input: String(num), expectedOutput: String(ref(num)) };
      },
      solutions: {
        python: `def countDigits(num: int) -> int:\n    count = 0\n    x = num\n    while x > 0:\n        d = x % 10\n        if d != 0 and num % d == 0:\n            count += 1\n        x //= 10\n    return count`,
        javascript: `var countDigits = function(num) {\n    let count = 0, x = num;\n    while (x > 0) {\n        const d = x % 10;\n        if (d !== 0 && num % d === 0) count++;\n        x = Math.floor(x / 10);\n    }\n    return count;\n};`,
        typescript: `function countDigits(num: number): number {\n    var count = 0, x = num;\n    while (x > 0) {\n        var d = x % 10;\n        if (d !== 0 && num % d === 0) count++;\n        x = Math.floor(x / 10);\n    }\n    return count;\n}`,
        java: `public static int countDigits(int num) {\n    int count = 0, x = num;\n    while (x > 0) {\n        int d = x % 10;\n        if (d != 0 && num % d == 0) count++;\n        x /= 10;\n    }\n    return count;\n}`,
        cpp: `int countDigits(int num) {\n    int count = 0, x = num;\n    while (x > 0) {\n        int d = x % 10;\n        if (d != 0 && num % d == 0) count++;\n        x /= 10;\n    }\n    return count;\n}`,
        c: `int countDigits(int num) {\n    int count = 0, x = num;\n    while (x > 0) {\n        int d = x % 10;\n        if (d != 0 && num % d == 0) count++;\n        x /= 10;\n    }\n    return count;\n}`,
        csharp: `public static int CountDigits(int num)\n{\n    int count = 0, x = num;\n    while (x > 0)\n    {\n        int d = x % 10;\n        if (d != 0 && num % d == 0) count++;\n        x /= 10;\n    }\n    return count;\n}`,
        go: `func countDigits(num int) int {\n\tcount, x := 0, num\n\tfor x > 0 {\n\t\td := x % 10\n\t\tif d != 0 && num%d == 0 {\n\t\t\tcount++\n\t\t}\n\t\tx /= 10\n\t}\n\treturn count\n}`,
        kotlin: `fun countDigits(num: Int): Int {\n    var count = 0\n    var x = num\n    while (x > 0) {\n        val d = x % 10\n        if (d != 0 && num % d == 0) count++\n        x /= 10\n    }\n    return count\n}`,
        swift: `func countDigits(_ num: Int) -> Int {\n    var count = 0\n    var x = num\n    while x > 0 {\n        let d = x % 10\n        if d != 0 && num % d == 0 { count += 1 }\n        x /= 10\n    }\n    return count\n}`,
        rust: `fn countDigits(num: i32) -> i32 {\n    let mut count = 0;\n    let mut x = num;\n    while x > 0 {\n        let d = x % 10;\n        if d != 0 && num % d == 0 {\n            count += 1;\n        }\n        x /= 10;\n    }\n    count\n}`,
        php: `function countDigits($num) {\n    $count = 0;\n    $x = $num;\n    while ($x > 0) {\n        $d = $x % 10;\n        if ($d !== 0 && $num % $d === 0) $count++;\n        $x = intdiv($x, 10);\n    }\n    return $count;\n}`,
        ruby: `def countDigits(num)\n  count = 0\n  x = num\n  while x > 0\n    d = x % 10\n    count += 1 if d != 0 && num % d == 0\n    x /= 10\n  end\n  count\nend`,
      },
    };
  })(),

  // ── END MATH3 ──
];
