/**
 * String problems — wave 4.
 *
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks
 * "must-do" string set. Sample strings are CodeKairo's own — a problem that
 * ships with `s = "leetcode"` upstream reads `s = "codekairo"` here.
 *
 * Judge contract: a string test input must never contain `=`, because the
 * JS/Python driver's parseArgs reads `<ident>=` as a named argument
 * (src/lib/judge0.ts). Every generator below stays inside [a-z]/[A-Z]/digits.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, explain, fmtStrArr, pick, randLower, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const STRING4_PROBLEMS: CatalogProblem[] = [

  // ── Largest Substring Between Two Equal Characters (LC 1624) ────
  (() => {
    const ref = (s: string) => {
      const first: Record<string, number> = {};
      let best = -1;
      for (let i = 0; i < s.length; i++) {
        const c = s.charAt(i);
        if (first[c] === undefined) first[c] = i;
        else if (i - first[c] - 1 > best) best = i - first[c] - 1;
      }
      return best;
    };
    return {
      slug: "largest-substring-between-two-equal-characters",
      title: "Largest Substring Between Two Equal Characters",
      difficulty: "EASY" as const,
      tags: ["String", "Hash Table", "TCS", "Infosys", "Amazon"],
      signature: { funcName: "maxLengthBetweenEqualCharacters", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s`, return the length of the longest substring that sits strictly **between** two equal characters, not counting those two characters themselves.\n\nIf no character repeats, return `-1`.",
        [
          { in: 's = "codekairo"', out: "6", note: "The only repeated character is o, at indices 1 and 8, enclosing \"dekair\"." },
          { in: 's = "abca"', out: "2", note: "The two a's enclose \"bc\"." },
          { in: 's = "cbzxy"', out: "-1", note: "Nothing repeats." },
        ],
        ["1 <= s.length <= 300", "s consists of lowercase English letters."]),
      hints: [
        "For a fixed character, the widest gap always uses its **first** and **last** occurrence.",
        "So record the first index of each character and, on every later sighting, measure back to it.",
        "The answer counts the characters strictly inside, which is `last - first - 1`.",
      ],
      editorial: explain({
        idea: "The gap for a character is maximised by its earliest and latest occurrence, so storing each character's first index and measuring from it on every repeat covers every candidate.",
        steps: [
          "Sweep `i` over `s`, keeping a map from character to its first index.",
          "On a character already in the map, the candidate length is `i - first[c] - 1`.",
          "Keep the maximum, starting from `-1` so a string with no repeat answers correctly.",
        ],
        why: "For a character `c` appearing at indices `i1 < i2 < … < ik`, every pair gives `ij - ii - 1`, which is largest when `ii` is the first and `ij` the last. Measuring every occurrence against the stored first index therefore reaches that maximum.",
        time: "O(n)",
        space: "O(1) — at most 26 entries",
        pitfalls: [
          "Overwriting the stored index on each sighting measures against the *previous* occurrence, not the first.",
          "Returning `last - first` counts the two bookend characters, which the statement excludes.",
        ],
      }),
      examples: [
        { input: '"codekairo"', expectedOutput: "6" },
        { input: '"abca"', expectedOutput: "2" },
        { input: '"cbzxy"', expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.5 ? "abc" : "abcdefghijklmnopqrstuvwxyz";
        const s = randLower(rng, 1, 60, alphabet);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def maxLengthBetweenEqualCharacters(s: str) -> int:\n    first = {}\n    best = -1\n    for i, c in enumerate(s):\n        if c not in first:\n            first[c] = i\n        elif i - first[c] - 1 > best:\n            best = i - first[c] - 1\n    return best`,
        javascript: `var maxLengthBetweenEqualCharacters = function(s) {\n    var first = {}, best = -1;\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (first[c] === undefined) first[c] = i;\n        else if (i - first[c] - 1 > best) best = i - first[c] - 1;\n    }\n    return best;\n};`,
        typescript: `function maxLengthBetweenEqualCharacters(s: string): number {\n    var first: { [key: string]: number } = {}, best = -1;\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (first[c] === undefined) first[c] = i;\n        else if (i - first[c] - 1 > best) best = i - first[c] - 1;\n    }\n    return best;\n}`,
        java: `public static int maxLengthBetweenEqualCharacters(String s) {\n    int[] first = new int[26];\n    Arrays.fill(first, -1);\n    int best = -1;\n    for (int i = 0; i < s.length(); i++) {\n        int c = s.charAt(i) - 'a';\n        if (first[c] < 0) first[c] = i;\n        else if (i - first[c] - 1 > best) best = i - first[c] - 1;\n    }\n    return best;\n}`,
        cpp: `int maxLengthBetweenEqualCharacters(string s) {\n    vector<int> first(26, -1);\n    int best = -1;\n    for (int i = 0; i < (int) s.size(); i++) {\n        int c = s[i] - 'a';\n        if (first[c] < 0) first[c] = i;\n        else if (i - first[c] - 1 > best) best = i - first[c] - 1;\n    }\n    return best;\n}`,
        c: `int maxLengthBetweenEqualCharacters(char* s) {\n    int first[26];\n    for (int i = 0; i < 26; i++) first[i] = -1;\n    int best = -1;\n    for (int i = 0; s[i] != 0; i++) {\n        int c = s[i] - 'a';\n        if (first[c] < 0) first[c] = i;\n        else if (i - first[c] - 1 > best) best = i - first[c] - 1;\n    }\n    return best;\n}`,
        csharp: `public static int MaxLengthBetweenEqualCharacters(string s)\n{\n    int[] first = new int[26];\n    for (int i = 0; i < 26; i++) first[i] = -1;\n    int best = -1;\n    for (int i = 0; i < s.Length; i++)\n    {\n        int c = s[i] - 'a';\n        if (first[c] < 0) first[c] = i;\n        else if (i - first[c] - 1 > best) best = i - first[c] - 1;\n    }\n    return best;\n}`,
        go: `func maxLengthBetweenEqualCharacters(s string) int {\n\tfirst := make([]int, 26)\n\tfor i := range first {\n\t\tfirst[i] = -1\n\t}\n\tbest := -1\n\tfor i := 0; i < len(s); i++ {\n\t\tc := int(s[i] - 'a')\n\t\tif first[c] < 0 {\n\t\t\tfirst[c] = i\n\t\t} else if i-first[c]-1 > best {\n\t\t\tbest = i - first[c] - 1\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxLengthBetweenEqualCharacters(s: String): Int {\n    val first = IntArray(26) { -1 }\n    var best = -1\n    for (i in s.indices) {\n        val c = s[i] - 'a'\n        if (first[c] < 0) first[c] = i\n        else if (i - first[c] - 1 > best) best = i - first[c] - 1\n    }\n    return best\n}`,
        swift: `func maxLengthBetweenEqualCharacters(_ s: String) -> Int {\n    var first = [Int](repeating: -1, count: 26)\n    var best = -1\n    let chars = Array(s.utf8).map { Int($0) - 97 }\n    for i in 0..<chars.count {\n        let c = chars[i]\n        if first[c] < 0 { first[c] = i }\n        else if i - first[c] - 1 > best { best = i - first[c] - 1 }\n    }\n    return best\n}`,
        rust: `fn maxLengthBetweenEqualCharacters(s: String) -> i32 {\n    let mut first = vec![-1i32; 26];\n    let mut best = -1i32;\n    let bytes = s.as_bytes();\n    for i in 0..bytes.len() {\n        let c = (bytes[i] - b'a') as usize;\n        if first[c] < 0 {\n            first[c] = i as i32;\n        } else if i as i32 - first[c] - 1 > best {\n            best = i as i32 - first[c] - 1;\n        }\n    }\n    best\n}`,
        php: `function maxLengthBetweenEqualCharacters($s) {\n    $first = array();\n    $best = -1;\n    for ($i = 0; $i < strlen($s); $i++) {\n        $c = $s[$i];\n        if (!isset($first[$c])) $first[$c] = $i;\n        else if ($i - $first[$c] - 1 > $best) $best = $i - $first[$c] - 1;\n    }\n    return $best;\n}`,
        ruby: `def maxLengthBetweenEqualCharacters(s)\n  first = {}\n  best = -1\n  s.each_char.with_index do |c, i|\n    if first.key?(c)\n      best = i - first[c] - 1 if i - first[c] - 1 > best\n    else\n      first[c] = i\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Reverse String II (LC 541) ──────────────────────────────────
  (() => {
    const ref = (s: string, k: number) => {
      const a = s.split("");
      for (let i = 0; i < a.length; i += 2 * k) {
        let lo = i, hi = Math.min(i + k - 1, a.length - 1);
        while (lo < hi) { const t = a[lo]; a[lo] = a[hi]; a[hi] = t; lo++; hi--; }
      }
      return a.join("");
    };
    return {
      slug: "reverse-string-ii",
      title: "Reverse String II",
      difficulty: "EASY" as const,
      tags: ["String", "Two Pointers", "TCS", "Capgemini", "Amazon"],
      signature: { funcName: "reverseStr", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "string" as const },
      description: describe(
        "Given a string `s` and an integer `k`, reverse the first `k` characters of every `2k` characters, counting from the start.\n\nIf fewer than `k` characters remain, reverse all of them. If at least `k` but fewer than `2k` remain, reverse the first `k` and leave the rest alone.",
        [
          { in: 's = "codekairo", k = 2', out: "ocdeakiro", note: 'Taking blocks of four — "code", "kair", "o" — the first two characters of each are reversed: "co" -> "oc" and "ka" -> "ak".' },
          { in: 's = "abcdefg", k = 2', out: "bacdfeg" },
          { in: 's = "abcd", k = 4', out: "dcba" },
        ],
        ["1 <= s.length <= 10000", "1 <= k <= 10000", "s consists of lowercase English letters."]),
      hints: [
        "Step through the string in strides of `2k`, not one character at a time.",
        "Within each stride, reverse from `i` to `min(i + k - 1, n - 1)`.",
        "Clamping the right end is what handles both tail cases in the statement at once.",
      ],
      editorial: explain({
        idea: "The rule is periodic with period `2k`: reverse the first half of each period and skip the second. Clamping the reversal's right end to the last index absorbs both special cases the statement spells out.",
        steps: [
          "Copy the string into a mutable character array.",
          "Loop `i = 0, 2k, 4k, …`.",
          "Reverse the slice from `i` to `min(i + k - 1, n - 1)` with two pointers.",
          "Join the array back into a string.",
        ],
        why: "When at least `k` characters remain the clamp does nothing and exactly `k` are reversed; when fewer remain the clamp stops at the end and the whole tail is reversed — which is precisely what the two tail rules ask for.",
        time: "O(n)",
        space: "O(n) for the character array",
        pitfalls: [
          "Stepping by `k` instead of `2k` reverses the blocks that should be left alone.",
          "Forgetting the clamp reads past the end on the final partial block.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n2', expectedOutput: "ocdeakiro" },
        { input: '"abcdefg"\n2', expectedOutput: "bacdfeg" },
        { input: '"abcd"\n4', expectedOutput: "dcba" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 40);
        const k = ri(rng, 1, 12);
        return { input: `"${s}"\n${k}`, expectedOutput: ref(s, k) };
      },
      solutions: {
        python: `def reverseStr(s: str, k: int) -> str:\n    a = list(s)\n    for i in range(0, len(a), 2 * k):\n        lo, hi = i, min(i + k - 1, len(a) - 1)\n        while lo < hi:\n            a[lo], a[hi] = a[hi], a[lo]\n            lo += 1\n            hi -= 1\n    return "".join(a)`,
        javascript: `var reverseStr = function(s, k) {\n    var a = s.split("");\n    for (var i = 0; i < a.length; i += 2 * k) {\n        var lo = i, hi = Math.min(i + k - 1, a.length - 1);\n        while (lo < hi) {\n            var t = a[lo];\n            a[lo] = a[hi];\n            a[hi] = t;\n            lo++;\n            hi--;\n        }\n    }\n    return a.join("");\n};`,
        typescript: `function reverseStr(s: string, k: number): string {\n    var a = s.split("");\n    for (var i = 0; i < a.length; i += 2 * k) {\n        var lo = i, hi = Math.min(i + k - 1, a.length - 1);\n        while (lo < hi) {\n            var t = a[lo];\n            a[lo] = a[hi];\n            a[hi] = t;\n            lo++;\n            hi--;\n        }\n    }\n    return a.join("");\n}`,
        java: `public static String reverseStr(String s, int k) {\n    char[] a = s.toCharArray();\n    for (int i = 0; i < a.length; i += 2 * k) {\n        int lo = i, hi = Math.min(i + k - 1, a.length - 1);\n        while (lo < hi) {\n            char t = a[lo];\n            a[lo] = a[hi];\n            a[hi] = t;\n            lo++;\n            hi--;\n        }\n    }\n    return new String(a);\n}`,
        cpp: `string reverseStr(string s, int k) {\n    int n = (int) s.size();\n    for (int i = 0; i < n; i += 2 * k) {\n        int lo = i, hi = min(i + k - 1, n - 1);\n        while (lo < hi) {\n            swap(s[lo], s[hi]);\n            lo++;\n            hi--;\n        }\n    }\n    return s;\n}`,
        c: `char* reverseStr(char* s, int k) {\n    int n = (int) strlen(s);\n    char* a = (char*) malloc((size_t) n + 1);\n    strcpy(a, s);\n    for (int i = 0; i < n; i += 2 * k) {\n        int lo = i;\n        int hi = i + k - 1 < n - 1 ? i + k - 1 : n - 1;\n        while (lo < hi) {\n            char t = a[lo];\n            a[lo] = a[hi];\n            a[hi] = t;\n            lo++;\n            hi--;\n        }\n    }\n    return a;\n}`,
        csharp: `public static string ReverseStr(string s, int k)\n{\n    char[] a = s.ToCharArray();\n    for (int i = 0; i < a.Length; i += 2 * k)\n    {\n        int lo = i, hi = Math.Min(i + k - 1, a.Length - 1);\n        while (lo < hi)\n        {\n            char t = a[lo];\n            a[lo] = a[hi];\n            a[hi] = t;\n            lo++;\n            hi--;\n        }\n    }\n    return new string(a);\n}`,
        go: `func reverseStr(s string, k int) string {\n\ta := []byte(s)\n\tn := len(a)\n\tfor i := 0; i < n; i += 2 * k {\n\t\tlo := i\n\t\thi := i + k - 1\n\t\tif hi > n-1 {\n\t\t\thi = n - 1\n\t\t}\n\t\tfor lo < hi {\n\t\t\ta[lo], a[hi] = a[hi], a[lo]\n\t\t\tlo++\n\t\t\thi--\n\t\t}\n\t}\n\treturn string(a)\n}`,
        kotlin: `fun reverseStr(s: String, k: Int): String {\n    val a = s.toCharArray()\n    var i = 0\n    while (i < a.size) {\n        var lo = i\n        var hi = minOf(i + k - 1, a.size - 1)\n        while (lo < hi) {\n            val t = a[lo]\n            a[lo] = a[hi]\n            a[hi] = t\n            lo++\n            hi--\n        }\n        i += 2 * k\n    }\n    return String(a)\n}`,
        swift: `func reverseStr(_ s: String, _ k: Int) -> String {\n    var a = Array(s)\n    let n = a.count\n    var i = 0\n    while i < n {\n        var lo = i\n        var hi = min(i + k - 1, n - 1)\n        while lo < hi {\n            a.swapAt(lo, hi)\n            lo += 1\n            hi -= 1\n        }\n        i += 2 * k\n    }\n    return String(a)\n}`,
        rust: `fn reverseStr(s: String, k: i32) -> String {\n    let mut a: Vec<u8> = s.into_bytes();\n    let n = a.len();\n    let k = k as usize;\n    let mut i = 0usize;\n    while i < n {\n        let mut lo = i;\n        let mut hi = if i + k - 1 < n - 1 { i + k - 1 } else { n - 1 };\n        while lo < hi {\n            a.swap(lo, hi);\n            lo += 1;\n            hi -= 1;\n        }\n        i += 2 * k;\n    }\n    String::from_utf8(a).unwrap()\n}`,
        php: `function reverseStr($s, $k) {\n    $a = str_split($s);\n    $n = count($a);\n    for ($i = 0; $i < $n; $i += 2 * $k) {\n        $lo = $i;\n        $hi = min($i + $k - 1, $n - 1);\n        while ($lo < $hi) {\n            $t = $a[$lo];\n            $a[$lo] = $a[$hi];\n            $a[$hi] = $t;\n            $lo++;\n            $hi--;\n        }\n    }\n    return implode("", $a);\n}`,
        ruby: `def reverseStr(s, k)\n  a = s.chars\n  i = 0\n  while i < a.length\n    lo = i\n    hi = [i + k - 1, a.length - 1].min\n    while lo < hi\n      a[lo], a[hi] = a[hi], a[lo]\n      lo += 1\n      hi -= 1\n    end\n    i += 2 * k\n  end\n  a.join\nend`,
      },
    };
  })(),

  // ── Student Attendance Record I (LC 551) ────────────────────────
  (() => {
    const ref = (s: string) => {
      let absent = 0;
      for (let i = 0; i < s.length; i++) {
        if (s.charAt(i) === "A") absent++;
        if (s.charAt(i) === "L" && i >= 2 && s.charAt(i - 1) === "L" && s.charAt(i - 2) === "L") return false;
      }
      return absent < 2;
    };
    return {
      slug: "student-attendance-record-i",
      title: "Student Attendance Record I",
      difficulty: "EASY" as const,
      tags: ["String", "TCS", "Infosys", "Cognizant"],
      signature: { funcName: "checkRecord", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "An attendance record is a string where each character is `'A'` (absent), `'L'` (late) or `'P'` (present).\n\nA student is eligible for an award when they were absent **fewer than 2** days in total **and** were never late on **3 or more consecutive** days.\n\nReturn `true` if the record earns an award.",
        [
          { in: 's = "PPALLP"', out: "true", note: "One absence and never three L's in a row." },
          { in: 's = "PPALLL"', out: "false", note: "Three consecutive late days." },
          { in: 's = "AA"', out: "false", note: "Two absences." },
        ],
        ["1 <= s.length <= 1000", "s[i] is 'A', 'L' or 'P'."]),
      hints: [
        "Two independent checks: a total count and a run length.",
        "Count `'A'` as you go and bail out as soon as it reaches 2.",
        "For the late rule, either keep a running streak or look back two characters.",
      ],
      editorial: explain({
        idea: "Both rules are decidable in one pass: absences are a running total, and 'three in a row' only ever needs the current character and the two before it.",
        steps: [
          "Sweep the string keeping `absent`, the number of `'A'` seen.",
          "At each `'L'`, check whether the two preceding characters are also `'L'`; if so, return `false` immediately.",
          "After the sweep, return `absent < 2`.",
        ],
        why: "A run of three or more late days necessarily contains a position whose two predecessors are both `'L'`, so the look-back catches every violation. The absence rule is a plain total and needs no context at all.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`absent <= 2` is wrong — two absences already disqualify.",
          "Resetting a late streak on `'A'` but not on `'P'` (or the other way round) — any non-`'L'` breaks the run.",
        ],
      }),
      examples: [
        { input: '"PPALLP"', expectedOutput: "true" },
        { input: '"PPALLL"', expectedOutput: "false" },
        { input: '"AA"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const weights = rng() < 0.5 ? "PPPLLA" : "PLA";
        const s = Array.from({ length: n }, () => weights.charAt(ri(rng, 0, weights.length - 1))).join("");
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: `def checkRecord(s: str) -> bool:\n    absent = 0\n    for i, c in enumerate(s):\n        if c == "A":\n            absent += 1\n        if c == "L" and i >= 2 and s[i - 1] == "L" and s[i - 2] == "L":\n            return False\n    return absent < 2`,
        javascript: `var checkRecord = function(s) {\n    var absent = 0;\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (c === "A") absent++;\n        if (c === "L" && i >= 2 && s.charAt(i - 1) === "L" && s.charAt(i - 2) === "L") return false;\n    }\n    return absent < 2;\n};`,
        typescript: `function checkRecord(s: string): boolean {\n    var absent = 0;\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (c === "A") absent++;\n        if (c === "L" && i >= 2 && s.charAt(i - 1) === "L" && s.charAt(i - 2) === "L") return false;\n    }\n    return absent < 2;\n}`,
        java: `public static boolean checkRecord(String s) {\n    int absent = 0;\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        if (c == 'A') absent++;\n        if (c == 'L' && i >= 2 && s.charAt(i - 1) == 'L' && s.charAt(i - 2) == 'L') return false;\n    }\n    return absent < 2;\n}`,
        cpp: `bool checkRecord(string s) {\n    int absent = 0;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (s[i] == 'A') absent++;\n        if (s[i] == 'L' && i >= 2 && s[i - 1] == 'L' && s[i - 2] == 'L') return false;\n    }\n    return absent < 2;\n}`,
        c: `bool checkRecord(char* s) {\n    int absent = 0;\n    for (int i = 0; s[i] != 0; i++) {\n        if (s[i] == 'A') absent++;\n        if (s[i] == 'L' && i >= 2 && s[i - 1] == 'L' && s[i - 2] == 'L') return false;\n    }\n    return absent < 2;\n}`,
        csharp: `public static bool CheckRecord(string s)\n{\n    int absent = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (s[i] == 'A') absent++;\n        if (s[i] == 'L' && i >= 2 && s[i - 1] == 'L' && s[i - 2] == 'L') return false;\n    }\n    return absent < 2;\n}`,
        go: `func checkRecord(s string) bool {\n\tabsent := 0\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] == 'A' {\n\t\t\tabsent++\n\t\t}\n\t\tif s[i] == 'L' && i >= 2 && s[i-1] == 'L' && s[i-2] == 'L' {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn absent < 2\n}`,
        kotlin: `fun checkRecord(s: String): Boolean {\n    var absent = 0\n    for (i in s.indices) {\n        if (s[i] == 'A') absent++\n        if (s[i] == 'L' && i >= 2 && s[i - 1] == 'L' && s[i - 2] == 'L') return false\n    }\n    return absent < 2\n}`,
        swift: `func checkRecord(_ s: String) -> Bool {\n    let a = Array(s)\n    var absent = 0\n    for i in 0..<a.count {\n        if a[i] == "A" { absent += 1 }\n        if a[i] == "L" && i >= 2 && a[i - 1] == "L" && a[i - 2] == "L" { return false }\n    }\n    return absent < 2\n}`,
        rust: `fn checkRecord(s: String) -> bool {\n    let b = s.as_bytes();\n    let mut absent = 0;\n    for i in 0..b.len() {\n        if b[i] == b'A' {\n            absent += 1;\n        }\n        if b[i] == b'L' && i >= 2 && b[i - 1] == b'L' && b[i - 2] == b'L' {\n            return false;\n        }\n    }\n    absent < 2\n}`,
        php: `function checkRecord($s) {\n    $absent = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] === "A") $absent++;\n        if ($s[$i] === "L" && $i >= 2 && $s[$i - 1] === "L" && $s[$i - 2] === "L") return false;\n    }\n    return $absent < 2;\n}`,
        ruby: `def checkRecord(s)\n  absent = 0\n  s.each_char.with_index do |c, i|\n    absent += 1 if c == "A"\n    return false if c == "L" && i >= 2 && s[i - 1] == "L" && s[i - 2] == "L"\n  end\n  absent < 2\nend`,
      },
    };
  })(),

  // ── Valid Word Abbreviation (LC 408) ────────────────────────────
  (() => {
    const ref = (word: string, abbr: string) => {
      let i = 0, j = 0;
      while (i < word.length && j < abbr.length) {
        const c = abbr.charAt(j);
        if (c >= "0" && c <= "9") {
          if (c === "0") return false;
          let num = 0;
          while (j < abbr.length && abbr.charAt(j) >= "0" && abbr.charAt(j) <= "9") {
            num = num * 10 + (abbr.charCodeAt(j) - 48);
            j++;
          }
          i += num;
        } else {
          if (word.charAt(i) !== c) return false;
          i++; j++;
        }
      }
      return i === word.length && j === abbr.length;
    };
    return {
      slug: "valid-word-abbreviation",
      title: "Valid Word Abbreviation",
      difficulty: "EASY" as const,
      tags: ["String", "Two Pointers", "Google", "Meta", "Amazon"],
      signature: { funcName: "validWordAbbreviation", params: [{ name: "word", type: "string" as const }, { name: "abbr", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "An **abbreviation** replaces any number of non-adjacent, non-empty substrings of a word with their lengths. For example `\"codekairo\"` can be abbreviated as `\"c7o\"` or `\"co5ro\"`, but not `\"c1de5\"` — `1` and the following letters would come from adjacent replacements written separately.\n\nA number in the abbreviation must not have a leading zero.\n\nGiven `word` and `abbr`, return `true` if `abbr` is a valid abbreviation of `word`.",
        [
          { in: 'word = "codekairo", abbr = "c7o"', out: "true", note: "c, then 7 letters skipped, then o." },
          { in: 'word = "codekairo", abbr = "c07o"', out: "false", note: "A leading zero is never allowed." },
          { in: 'word = "apple", abbr = "a2e"', out: "false", note: "a2e covers only 4 characters; apple has 5." },
        ],
        ["1 <= word.length <= 20", "1 <= abbr.length <= 10", "word consists of lowercase letters.", "abbr consists of lowercase letters and digits."]),
      hints: [
        "Two pointers, one walking `word` and one walking `abbr`.",
        "A digit run in `abbr` is a jump for the `word` pointer, so parse the whole number before jumping.",
        "Both pointers must finish exactly at the end — a match that runs out early is not a match.",
      ],
      editorial: explain({
        idea: "Walk both strings with independent pointers. A letter in `abbr` must match the current letter of `word`; a digit run is an instruction to skip that many characters of `word`.",
        steps: [
          "While both pointers are in range: if `abbr[j]` is a digit, reject a leading `'0'`, then parse the full number and advance `i` by it.",
          "Otherwise compare `word[i]` with `abbr[j]` and advance both on a match, rejecting on a mismatch.",
          "Return `true` only when **both** pointers have reached the end.",
        ],
        why: "Parsing the entire digit run at once is what enforces the 'non-adjacent' rule: two adjacent replacements would have to be written as one number, so any well-formed abbreviation has letters between its numbers. Requiring both pointers to land exactly at the end rejects abbreviations that cover too little or skip past the end.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Skipping the leading-zero check accepts `\"c07o\"`.",
          "Returning `true` when only `i` has reached the end leaves unconsumed abbreviation characters.",
          "`i` can overshoot `word.length` after a jump — the final equality check must be exact, not `>=`.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n"c7o"', expectedOutput: "true" },
        { input: '"codekairo"\n"c07o"', expectedOutput: "false" },
        { input: '"apple"\n"a2e"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const word = randLower(rng, 1, 20);
        let abbr: string;
        if (rng() < 0.55) {
          // Build a genuine abbreviation, then sometimes corrupt it.
          const parts: string[] = [];
          let i = 0;
          while (i < word.length) {
            if (rng() < 0.5) {
              const run = ri(rng, 1, Math.max(1, word.length - i));
              parts.push(String(run));
              i += run;
            } else {
              parts.push(word.charAt(i));
              i++;
            }
          }
          abbr = parts.join("");
          if (rng() < 0.35) abbr = abbr.slice(0, Math.max(1, abbr.length - 1)) + pick(rng, ["0", "1", "z"]);
        } else {
          const alphabet = "abcde012";
          abbr = Array.from({ length: ri(rng, 1, 10) }, () => alphabet.charAt(ri(rng, 0, alphabet.length - 1))).join("");
        }
        return { input: `"${word}"\n"${abbr}"`, expectedOutput: bool(ref(word, abbr)) };
      },
      solutions: {
        python: `def validWordAbbreviation(word: str, abbr: str) -> bool:\n    i = j = 0\n    while i < len(word) and j < len(abbr):\n        if abbr[j].isdigit():\n            if abbr[j] == "0":\n                return False\n            num = 0\n            while j < len(abbr) and abbr[j].isdigit():\n                num = num * 10 + int(abbr[j])\n                j += 1\n            i += num\n        else:\n            if word[i] != abbr[j]:\n                return False\n            i += 1\n            j += 1\n    return i == len(word) and j == len(abbr)`,
        javascript: `var validWordAbbreviation = function(word, abbr) {\n    var i = 0, j = 0;\n    while (i < word.length && j < abbr.length) {\n        var c = abbr.charAt(j);\n        if (c >= "0" && c <= "9") {\n            if (c === "0") return false;\n            var num = 0;\n            while (j < abbr.length && abbr.charAt(j) >= "0" && abbr.charAt(j) <= "9") {\n                num = num * 10 + (abbr.charCodeAt(j) - 48);\n                j++;\n            }\n            i += num;\n        } else {\n            if (word.charAt(i) !== c) return false;\n            i++;\n            j++;\n        }\n    }\n    return i === word.length && j === abbr.length;\n};`,
        typescript: `function validWordAbbreviation(word: string, abbr: string): boolean {\n    var i = 0, j = 0;\n    while (i < word.length && j < abbr.length) {\n        var c = abbr.charAt(j);\n        if (c >= "0" && c <= "9") {\n            if (c === "0") return false;\n            var num = 0;\n            while (j < abbr.length && abbr.charAt(j) >= "0" && abbr.charAt(j) <= "9") {\n                num = num * 10 + (abbr.charCodeAt(j) - 48);\n                j++;\n            }\n            i += num;\n        } else {\n            if (word.charAt(i) !== c) return false;\n            i++;\n            j++;\n        }\n    }\n    return i === word.length && j === abbr.length;\n}`,
        java: `public static boolean validWordAbbreviation(String word, String abbr) {\n    int i = 0, j = 0;\n    while (i < word.length() && j < abbr.length()) {\n        char c = abbr.charAt(j);\n        if (c >= '0' && c <= '9') {\n            if (c == '0') return false;\n            int num = 0;\n            while (j < abbr.length() && abbr.charAt(j) >= '0' && abbr.charAt(j) <= '9') {\n                num = num * 10 + (abbr.charAt(j) - '0');\n                j++;\n            }\n            i += num;\n        } else {\n            if (word.charAt(i) != c) return false;\n            i++;\n            j++;\n        }\n    }\n    return i == word.length() && j == abbr.length();\n}`,
        cpp: `bool validWordAbbreviation(string word, string abbr) {\n    int i = 0, j = 0;\n    int n = (int) word.size(), m = (int) abbr.size();\n    while (i < n && j < m) {\n        char c = abbr[j];\n        if (c >= '0' && c <= '9') {\n            if (c == '0') return false;\n            int num = 0;\n            while (j < m && abbr[j] >= '0' && abbr[j] <= '9') {\n                num = num * 10 + (abbr[j] - '0');\n                j++;\n            }\n            i += num;\n        } else {\n            if (word[i] != c) return false;\n            i++;\n            j++;\n        }\n    }\n    return i == n && j == m;\n}`,
        c: `bool validWordAbbreviation(char* word, char* abbr) {\n    int n = (int) strlen(word), m = (int) strlen(abbr);\n    int i = 0, j = 0;\n    while (i < n && j < m) {\n        char c = abbr[j];\n        if (c >= '0' && c <= '9') {\n            if (c == '0') return false;\n            int num = 0;\n            while (j < m && abbr[j] >= '0' && abbr[j] <= '9') {\n                num = num * 10 + (abbr[j] - '0');\n                j++;\n            }\n            i += num;\n        } else {\n            if (word[i] != c) return false;\n            i++;\n            j++;\n        }\n    }\n    return i == n && j == m;\n}`,
        csharp: `public static bool ValidWordAbbreviation(string word, string abbr)\n{\n    int i = 0, j = 0;\n    while (i < word.Length && j < abbr.Length)\n    {\n        char c = abbr[j];\n        if (c >= '0' && c <= '9')\n        {\n            if (c == '0') return false;\n            int num = 0;\n            while (j < abbr.Length && abbr[j] >= '0' && abbr[j] <= '9')\n            {\n                num = num * 10 + (abbr[j] - '0');\n                j++;\n            }\n            i += num;\n        }\n        else\n        {\n            if (word[i] != c) return false;\n            i++;\n            j++;\n        }\n    }\n    return i == word.Length && j == abbr.Length;\n}`,
        go: `func validWordAbbreviation(word string, abbr string) bool {\n\ti, j := 0, 0\n\tfor i < len(word) && j < len(abbr) {\n\t\tc := abbr[j]\n\t\tif c >= '0' && c <= '9' {\n\t\t\tif c == '0' {\n\t\t\t\treturn false\n\t\t\t}\n\t\t\tnum := 0\n\t\t\tfor j < len(abbr) && abbr[j] >= '0' && abbr[j] <= '9' {\n\t\t\t\tnum = num*10 + int(abbr[j]-'0')\n\t\t\t\tj++\n\t\t\t}\n\t\t\ti += num\n\t\t} else {\n\t\t\tif word[i] != c {\n\t\t\t\treturn false\n\t\t\t}\n\t\t\ti++\n\t\t\tj++\n\t\t}\n\t}\n\treturn i == len(word) && j == len(abbr)\n}`,
        kotlin: `fun validWordAbbreviation(word: String, abbr: String): Boolean {\n    var i = 0\n    var j = 0\n    while (i < word.length && j < abbr.length) {\n        val c = abbr[j]\n        if (c in '0'..'9') {\n            if (c == '0') return false\n            var num = 0\n            while (j < abbr.length && abbr[j] in '0'..'9') {\n                num = num * 10 + (abbr[j] - '0')\n                j++\n            }\n            i += num\n        } else {\n            if (word[i] != c) return false\n            i++\n            j++\n        }\n    }\n    return i == word.length && j == abbr.length\n}`,
        swift: `func validWordAbbreviation(_ word: String, _ abbr: String) -> Bool {\n    let w = Array(word)\n    let a = Array(abbr)\n    var i = 0\n    var j = 0\n    while i < w.count && j < a.count {\n        if a[j].isNumber {\n            if a[j] == "0" { return false }\n            var num = 0\n            while j < a.count && a[j].isNumber {\n                num = num * 10 + Int(String(a[j]))!\n                j += 1\n            }\n            i += num\n        } else {\n            if w[i] != a[j] { return false }\n            i += 1\n            j += 1\n        }\n    }\n    return i == w.count && j == a.count\n}`,
        rust: `fn validWordAbbreviation(word: String, abbr: String) -> bool {\n    let w = word.as_bytes();\n    let a = abbr.as_bytes();\n    let mut i = 0usize;\n    let mut j = 0usize;\n    while i < w.len() && j < a.len() {\n        let c = a[j];\n        if c.is_ascii_digit() {\n            if c == b'0' {\n                return false;\n            }\n            let mut num = 0usize;\n            while j < a.len() && a[j].is_ascii_digit() {\n                num = num * 10 + (a[j] - b'0') as usize;\n                j += 1;\n            }\n            i += num;\n        } else {\n            if w[i] != c {\n                return false;\n            }\n            i += 1;\n            j += 1;\n        }\n    }\n    i == w.len() && j == a.len()\n}`,
        php: `function validWordAbbreviation($word, $abbr) {\n    $n = strlen($word);\n    $m = strlen($abbr);\n    $i = 0;\n    $j = 0;\n    while ($i < $n && $j < $m) {\n        $c = $abbr[$j];\n        if ($c >= "0" && $c <= "9") {\n            if ($c === "0") return false;\n            $num = 0;\n            while ($j < $m && $abbr[$j] >= "0" && $abbr[$j] <= "9") {\n                $num = $num * 10 + intval($abbr[$j]);\n                $j++;\n            }\n            $i += $num;\n        } else {\n            if ($word[$i] !== $c) return false;\n            $i++;\n            $j++;\n        }\n    }\n    return $i === $n && $j === $m;\n}`,
        ruby: `def validWordAbbreviation(word, abbr)\n  i = 0\n  j = 0\n  while i < word.length && j < abbr.length\n    c = abbr[j]\n    if c >= "0" && c <= "9"\n      return false if c == "0"\n      num = 0\n      while j < abbr.length && abbr[j] >= "0" && abbr[j] <= "9"\n        num = num * 10 + abbr[j].to_i\n        j += 1\n      end\n      i += num\n    else\n      return false if word[i] != c\n      i += 1\n      j += 1\n    end\n  end\n  i == word.length && j == abbr.length\nend`,
      },
    };
  })(),

  // ── Check If String Is a Prefix of Array (LC 1961) ──────────────
  (() => {
    const ref = (s: string, words: string[]) => {
      let built = "";
      for (const w of words) {
        built += w;
        if (built === s) return true;
        if (built.length >= s.length) return false;
      }
      return false;
    };
    return {
      slug: "check-if-string-is-a-prefix-of-array",
      title: "Check If String Is a Prefix of Array",
      difficulty: "EASY" as const,
      tags: ["String", "Array", "TCS", "Wipro", "Amazon"],
      signature: { funcName: "isPrefixString", params: [{ name: "s", type: "string" as const }, { name: "words", type: "string[]" as const }], returns: "bool" as const },
      description: describe(
        "A string `s` is a **prefix string** of `words` if it equals the concatenation of the first `k` entries of `words` for some `k` with `1 <= k <= words.length`.\n\nReturn `true` if `s` is a prefix string of `words`.",
        [
          { in: 's = "codekairo", words = ["code","kairo","rocks"]', out: "true", note: "The first two words concatenate to exactly s." },
          { in: 's = "codek", words = ["code","kairo"]', out: "false", note: "One word gives \"code\" and two give \"codekairo\" — neither is \"codek\"." },
          { in: 's = "a", words = ["a","b"]', out: "true" },
        ],
        ["1 <= words.length <= 100", "1 <= words[i].length <= 20", "1 <= s.length <= 1000", "All strings consist of lowercase English letters."]),
      hints: [
        "Build the concatenation word by word and compare after each step.",
        "Stop as soon as the built string is at least as long as `s` — going further can only overshoot.",
        "Equality has to be exact; a prefix match is not enough.",
      ],
      editorial: explain({
        idea: "There are only `words.length` candidate concatenations, and they grow monotonically, so build them one word at a time and test for equality after each addition.",
        steps: [
          "Keep a growing buffer, initially empty.",
          "Append each word in order; after each append compare the buffer with `s`.",
          "Return `true` on an exact match; return `false` once the buffer is at least as long as `s` without matching.",
        ],
        why: "Every candidate is a prefix of the next, so lengths increase strictly. Once the buffer reaches `s.length` without matching, no later candidate can match either, which makes the early exit safe.",
        time: "O(n) where n is the total length of the words examined",
        space: "O(n)",
        pitfalls: [
          "Using `s.startsWith(buffer)` tests the wrong direction — the statement asks for equality.",
          "Forgetting to stop makes the buffer grow past `s` and wastes work on a decided answer.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n["code","kairo","rocks"]', expectedOutput: "true" },
        { input: '"codek"\n["code","kairo"]', expectedOutput: "false" },
        { input: '"a"\n["a","b"]', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const words = Array.from({ length: ri(rng, 1, 8) }, () => randLower(rng, 1, 5, "abc"));
        let s: string;
        if (rng() < 0.6) {
          const k = ri(rng, 1, words.length);
          s = words.slice(0, k).join("");
          if (rng() < 0.35) s = s.slice(0, Math.max(1, s.length - 1));
        } else {
          s = randLower(rng, 1, 10, "abc");
        }
        return { input: `"${s}"\n${fmtStrArr(words)}`, expectedOutput: bool(ref(s, words)) };
      },
      solutions: {
        python: `from typing import List\n\ndef isPrefixString(s: str, words: List[str]) -> bool:\n    built = ""\n    for w in words:\n        built += w\n        if built == s:\n            return True\n        if len(built) >= len(s):\n            return False\n    return False`,
        javascript: `var isPrefixString = function(s, words) {\n    var built = "";\n    for (var i = 0; i < words.length; i++) {\n        built += words[i];\n        if (built === s) return true;\n        if (built.length >= s.length) return false;\n    }\n    return false;\n};`,
        typescript: `function isPrefixString(s: string, words: string[]): boolean {\n    var built = "";\n    for (var i = 0; i < words.length; i++) {\n        built += words[i];\n        if (built === s) return true;\n        if (built.length >= s.length) return false;\n    }\n    return false;\n}`,
        java: `public static boolean isPrefixString(String s, String[] words) {\n    StringBuilder built = new StringBuilder();\n    for (String w : words) {\n        built.append(w);\n        if (built.length() == s.length() && built.toString().equals(s)) return true;\n        if (built.length() >= s.length()) return false;\n    }\n    return false;\n}`,
        cpp: `bool isPrefixString(string s, vector<string>& words) {\n    string built;\n    for (const string& w : words) {\n        built += w;\n        if (built == s) return true;\n        if (built.size() >= s.size()) return false;\n    }\n    return false;\n}`,
        c: `bool isPrefixString(char* s, char** words, int wordsSize) {\n    int target = (int) strlen(s);\n    int len = 0;\n    char* built = (char*) malloc((size_t) target + 64);\n    built[0] = 0;\n    for (int i = 0; i < wordsSize; i++) {\n        int wl = (int) strlen(words[i]);\n        if (len + wl > target + 32) { free(built); return false; }\n        memcpy(built + len, words[i], (size_t) wl);\n        len += wl;\n        built[len] = 0;\n        if (len == target && strcmp(built, s) == 0) { free(built); return true; }\n        if (len >= target) { free(built); return false; }\n    }\n    free(built);\n    return false;\n}`,
        csharp: `public static bool IsPrefixString(string s, string[] words)\n{\n    var built = new System.Text.StringBuilder();\n    foreach (string w in words)\n    {\n        built.Append(w);\n        if (built.Length == s.Length && built.ToString() == s) return true;\n        if (built.Length >= s.Length) return false;\n    }\n    return false;\n}`,
        go: `func isPrefixString(s string, words []string) bool {\n\tbuilt := ""\n\tfor _, w := range words {\n\t\tbuilt += w\n\t\tif built == s {\n\t\t\treturn true\n\t\t}\n\t\tif len(built) >= len(s) {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn false\n}`,
        kotlin: `fun isPrefixString(s: String, words: Array<String>): Boolean {\n    val built = StringBuilder()\n    for (w in words) {\n        built.append(w)\n        if (built.length == s.length && built.toString() == s) return true\n        if (built.length >= s.length) return false\n    }\n    return false\n}`,
        swift: `func isPrefixString(_ s: String, _ words: [String]) -> Bool {\n    var built = ""\n    for w in words {\n        built += w\n        if built == s { return true }\n        if built.count >= s.count { return false }\n    }\n    return false\n}`,
        rust: `fn isPrefixString(s: String, words: Vec<String>) -> bool {\n    let mut built = String::new();\n    for w in words.iter() {\n        built.push_str(w);\n        if built == s {\n            return true;\n        }\n        if built.len() >= s.len() {\n            return false;\n        }\n    }\n    false\n}`,
        php: `function isPrefixString($s, $words) {\n    $built = "";\n    foreach ($words as $w) {\n        $built .= $w;\n        if ($built === $s) return true;\n        if (strlen($built) >= strlen($s)) return false;\n    }\n    return false;\n}`,
        ruby: `def isPrefixString(s, words)\n  built = ""\n  words.each do |w|\n    built += w\n    return true if built == s\n    return false if built.length >= s.length\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Most Common Word (LC 819) ───────────────────────────────────
  (() => {
    const ref = (paragraph: string, banned: string[]) => {
      const block: Record<string, boolean> = {};
      for (const b of banned) block[b.toLowerCase()] = true;
      const count: Record<string, number> = {};
      let best = "", bestN = 0;
      let cur = "";
      const flush = () => {
        if (cur.length === 0) return;
        const w = cur.toLowerCase();
        cur = "";
        if (block[w] === true) return;
        count[w] = (count[w] === undefined ? 0 : count[w]) + 1;
        if (count[w] > bestN) { bestN = count[w]; best = w; }
      };
      for (let i = 0; i < paragraph.length; i++) {
        const c = paragraph.charAt(i);
        if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z")) cur += c;
        else flush();
      }
      flush();
      return best;
    };
    return {
      slug: "most-common-word",
      title: "Most Common Word",
      difficulty: "EASY" as const,
      tags: ["String", "Hash Table", "Amazon", "Infosys", "Adobe"],
      signature: { funcName: "mostCommonWord", params: [{ name: "paragraph", type: "string" as const }, { name: "banned", type: "string[]" as const }], returns: "string" as const },
      description: describe(
        "Given a `paragraph` and a list of `banned` words, return the most frequent word that is **not** banned.\n\nWords are case-insensitive and the answer is returned in lowercase. Anything that is not a letter separates words. The answer is unique; when several words tie, the one that reaches the winning count **first** wins.",
        [
          { in: 'paragraph = "CodeKairo drills, codekairo rounds, codekairo wins!", banned = ["rounds"]', out: "codekairo", note: "codekairo appears three times and is not banned." },
          { in: 'paragraph = "Bob hit a ball, the hit BALL flew far after it was hit.", banned = ["hit"]', out: "ball", note: "hit is banned, so ball with two occurrences wins." },
          { in: 'paragraph = "a, a, a, b", banned = ["a"]', out: "b" },
        ],
        ["1 <= paragraph.length <= 1000", "0 <= banned.length <= 100", "paragraph holds English letters, spaces and the punctuation !?',;.", "banned words are lowercase and letters only."]),
      hints: [
        "Normalise first: lowercase everything and treat every non-letter as a separator.",
        "A set of banned words makes the exclusion a single lookup.",
        "Track the running best while counting so no second pass over the map is needed.",
      ],
      editorial: explain({
        idea: "Tokenise by scanning for maximal runs of letters, lowercase each token, skip the banned ones and count the rest — keeping the running maximum as you go.",
        steps: [
          "Put the banned words into a set, lowercased.",
          "Sweep the paragraph accumulating letters into a buffer; any non-letter flushes the buffer as one word.",
          "Lowercase the flushed word, skip it if banned, otherwise increment its count.",
          "Whenever a count strictly exceeds the best so far, adopt that word as the answer.",
          "Flush once more after the loop so a paragraph ending in a letter is not dropped.",
        ],
        why: "Updating the best on a strict `>` means the first word to reach a given count keeps the title, which is the tie-break the statement describes. Scanning character by character avoids having to enumerate every punctuation mark.",
        time: "O(n + b)",
        space: "O(n + b)",
        pitfalls: [
          "Splitting on spaces alone leaves punctuation stuck to words, so `\"ball,\"` and `\"ball\"` count separately.",
          "Forgetting the final flush loses the last word when the paragraph does not end in punctuation.",
          "Comparing against the banned list case-sensitively misses capitalised occurrences.",
        ],
      }),
      examples: [
        { input: '"CodeKairo drills, codekairo rounds, codekairo wins!"\n["rounds"]', expectedOutput: "codekairo" },
        { input: '"Bob hit a ball, the hit BALL flew far after it was hit."\n["hit"]', expectedOutput: "ball" },
        { input: '"a, a, a, b"\n["a"]', expectedOutput: "b" },
      ],
      gen: (rng: Rng) => {
        const vocab = ["codekairo", "drill", "kata", "duel", "round", "streak", "rank", "solve"];
        const n = ri(rng, 1, 30);
        const parts: string[] = [];
        for (let i = 0; i < n; i++) {
          let w = pick(rng, vocab);
          if (rng() < 0.3) w = w.charAt(0).toUpperCase() + w.slice(1);
          parts.push(w + pick(rng, ["", "", "", ",", ".", "!", ";"]));
        }
        const paragraph = parts.join(" ");
        const banned = shuffle(rng, vocab.slice()).slice(0, ri(rng, 0, 3));
        const answer = ref(paragraph, banned);
        // The statement promises a winner, so re-draw the ban list if it silenced
        // every word in the paragraph.
        if (answer === "") return { input: `"${paragraph}"\n[]`, expectedOutput: ref(paragraph, []) };
        return { input: `"${paragraph}"\n${fmtStrArr(banned)}`, expectedOutput: answer };
      },
      solutions: {
        python: `from typing import List\n\ndef mostCommonWord(paragraph: str, banned: List[str]) -> str:\n    block = set(b.lower() for b in banned)\n    count = {}\n    best, best_n = "", 0\n    cur = []\n    def flush():\n        nonlocal best, best_n, cur\n        if not cur:\n            return\n        w = "".join(cur).lower()\n        cur = []\n        if w in block:\n            return\n        count[w] = count.get(w, 0) + 1\n        if count[w] > best_n:\n            best_n = count[w]\n            best = w\n    for c in paragraph:\n        if c.isalpha():\n            cur.append(c)\n        else:\n            flush()\n    flush()\n    return best`,
        javascript: `var mostCommonWord = function(paragraph, banned) {\n    var block = {};\n    for (var b = 0; b < banned.length; b++) block[banned[b].toLowerCase()] = true;\n    var count = {}, best = "", bestN = 0, cur = "";\n    var flush = function() {\n        if (cur.length === 0) return;\n        var w = cur.toLowerCase();\n        cur = "";\n        if (block[w] === true) return;\n        count[w] = (count[w] === undefined ? 0 : count[w]) + 1;\n        if (count[w] > bestN) { bestN = count[w]; best = w; }\n    };\n    for (var i = 0; i < paragraph.length; i++) {\n        var c = paragraph.charAt(i);\n        if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z")) cur += c;\n        else flush();\n    }\n    flush();\n    return best;\n};`,
        typescript: `function mostCommonWord(paragraph: string, banned: string[]): string {\n    var block: { [key: string]: boolean } = {};\n    for (var b = 0; b < banned.length; b++) block[banned[b].toLowerCase()] = true;\n    var count: { [key: string]: number } = {}, best = "", bestN = 0, cur = "";\n    var flush = function() {\n        if (cur.length === 0) return;\n        var w = cur.toLowerCase();\n        cur = "";\n        if (block[w] === true) return;\n        count[w] = (count[w] === undefined ? 0 : count[w]) + 1;\n        if (count[w] > bestN) { bestN = count[w]; best = w; }\n    };\n    for (var i = 0; i < paragraph.length; i++) {\n        var c = paragraph.charAt(i);\n        if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z")) cur += c;\n        else flush();\n    }\n    flush();\n    return best;\n}`,
        java: `public static String mostCommonWord(String paragraph, String[] banned) {\n    Set<String> block = new HashSet<>();\n    for (String b : banned) block.add(b.toLowerCase());\n    Map<String, Integer> count = new HashMap<>();\n    String best = "";\n    int bestN = 0;\n    StringBuilder cur = new StringBuilder();\n    for (int i = 0; i <= paragraph.length(); i++) {\n        char c = i < paragraph.length() ? paragraph.charAt(i) : ' ';\n        if (Character.isLetter(c)) {\n            cur.append(c);\n            continue;\n        }\n        if (cur.length() == 0) continue;\n        String w = cur.toString().toLowerCase();\n        cur.setLength(0);\n        if (block.contains(w)) continue;\n        int c2 = count.getOrDefault(w, 0) + 1;\n        count.put(w, c2);\n        if (c2 > bestN) { bestN = c2; best = w; }\n    }\n    return best;\n}`,
        cpp: `string mostCommonWord(string paragraph, vector<string>& banned) {\n    unordered_set<string> block;\n    for (string b : banned) {\n        for (auto& ch : b) ch = (char) tolower(ch);\n        block.insert(b);\n    }\n    unordered_map<string, int> count;\n    string best = "", cur = "";\n    int bestN = 0;\n    for (size_t i = 0; i <= paragraph.size(); i++) {\n        char c = i < paragraph.size() ? paragraph[i] : ' ';\n        if (isalpha((unsigned char) c)) {\n            cur += (char) tolower(c);\n            continue;\n        }\n        if (cur.empty()) continue;\n        string w = cur;\n        cur.clear();\n        if (block.count(w)) continue;\n        int n = ++count[w];\n        if (n > bestN) { bestN = n; best = w; }\n    }\n    return best;\n}`,
        c: `char* mostCommonWord(char* paragraph, char** banned, int bannedSize) {\n    int plen = (int) strlen(paragraph);\n    char** words = (char**) malloc((size_t) (plen + 1) * sizeof(char*));\n    int wcount = 0;\n    char* cur = (char*) malloc((size_t) plen + 2);\n    int clen = 0;\n    for (int i = 0; i <= plen; i++) {\n        char c = i < plen ? paragraph[i] : ' ';\n        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {\n            cur[clen++] = (char) (c >= 'A' && c <= 'Z' ? c + 32 : c);\n            continue;\n        }\n        if (clen == 0) continue;\n        cur[clen] = 0;\n        int blocked = 0;\n        for (int b = 0; b < bannedSize; b++) {\n            if (strcmp(banned[b], cur) == 0) { blocked = 1; break; }\n        }\n        if (!blocked) {\n            char* copy = (char*) malloc((size_t) clen + 1);\n            strcpy(copy, cur);\n            words[wcount++] = copy;\n        }\n        clen = 0;\n    }\n    free(cur);\n    char* best = (char*) malloc(2);\n    best[0] = 0;\n    int bestN = 0;\n    for (int i = 0; i < wcount; i++) {\n        int n = 0;\n        for (int j = 0; j <= i; j++) {\n            if (strcmp(words[j], words[i]) == 0) n++;\n        }\n        if (n > bestN) {\n            bestN = n;\n            free(best);\n            best = (char*) malloc(strlen(words[i]) + 1);\n            strcpy(best, words[i]);\n        }\n    }\n    for (int i = 0; i < wcount; i++) free(words[i]);\n    free(words);\n    return best;\n}`,
        csharp: `public static string MostCommonWord(string paragraph, string[] banned)\n{\n    var block = new HashSet<string>();\n    foreach (string b in banned) block.Add(b.ToLower());\n    var count = new Dictionary<string, int>();\n    string best = "";\n    int bestN = 0;\n    var cur = new System.Text.StringBuilder();\n    for (int i = 0; i <= paragraph.Length; i++)\n    {\n        char c = i < paragraph.Length ? paragraph[i] : ' ';\n        if (char.IsLetter(c)) { cur.Append(c); continue; }\n        if (cur.Length == 0) continue;\n        string w = cur.ToString().ToLower();\n        cur.Clear();\n        if (block.Contains(w)) continue;\n        int cv;\n        cv = (count.TryGetValue(w, out cv) ? cv : 0) + 1;\n        count[w] = cv;\n        if (cv > bestN) { bestN = cv; best = w; }\n    }\n    return best;\n}`,
        go: `func mostCommonWord(paragraph string, banned []string) string {\n\tblock := map[string]bool{}\n\tfor _, b := range banned {\n\t\tblock[strings.ToLower(b)] = true\n\t}\n\tcount := map[string]int{}\n\tbest := ""\n\tbestN := 0\n\tcur := []byte{}\n\tfor i := 0; i <= len(paragraph); i++ {\n\t\tvar c byte = \' \'\n\t\tif i < len(paragraph) {\n\t\t\tc = paragraph[i]\n\t\t}\n\t\tif (c >= \'a\' && c <= \'z\') || (c >= \'A\' && c <= \'Z\') {\n\t\t\tcur = append(cur, c)\n\t\t\tcontinue\n\t\t}\n\t\tif len(cur) == 0 {\n\t\t\tcontinue\n\t\t}\n\t\tw := strings.ToLower(string(cur))\n\t\tcur = cur[:0]\n\t\tif block[w] {\n\t\t\tcontinue\n\t\t}\n\t\tcount[w]++\n\t\tif count[w] > bestN {\n\t\t\tbestN = count[w]\n\t\t\tbest = w\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun mostCommonWord(paragraph: String, banned: Array<String>): String {\n    val block = banned.map { it.toLowerCase() }.toHashSet()\n    val count = HashMap<String, Int>()\n    var best = ""\n    var bestN = 0\n    val cur = StringBuilder()\n    for (i in 0..paragraph.length) {\n        val c = if (i < paragraph.length) paragraph[i] else \' \'\n        if (c.isLetter()) {\n            cur.append(c)\n            continue\n        }\n        if (cur.isEmpty()) continue\n        val w = cur.toString().toLowerCase()\n        cur.setLength(0)\n        if (block.contains(w)) continue\n        val n = (count[w] ?: 0) + 1\n        count[w] = n\n        if (n > bestN) {\n            bestN = n\n            best = w\n        }\n    }\n    return best\n}`,
        swift: `func mostCommonWord(_ paragraph: String, _ banned: [String]) -> String {\n    let block = Set(banned.map { $0.lowercased() })\n    var count: [String: Int] = [:]\n    var best = ""\n    var bestN = 0\n    var cur = ""\n    let chars = Array(paragraph) + [" "]\n    for c in chars {\n        if c.isLetter {\n            cur.append(c)\n            continue\n        }\n        if cur.isEmpty { continue }\n        let w = cur.lowercased()\n        cur = ""\n        if block.contains(w) { continue }\n        let n = (count[w] ?? 0) + 1\n        count[w] = n\n        if n > bestN {\n            bestN = n\n            best = w\n        }\n    }\n    return best\n}`,
        rust: `fn mostCommonWord(paragraph: String, banned: Vec<String>) -> String {\n    let block: std::collections::HashSet<String> = banned.iter().map(|b| b.to_lowercase()).collect();\n    let mut count: std::collections::HashMap<String, i32> = std::collections::HashMap::new();\n    let mut best = String::new();\n    let mut best_n = 0;\n    let mut cur = String::new();\n    let mut bytes: Vec<u8> = paragraph.into_bytes();\n    bytes.push(b\' \');\n    for &c in bytes.iter() {\n        if c.is_ascii_alphabetic() {\n            cur.push((c as char).to_ascii_lowercase());\n            continue;\n        }\n        if cur.is_empty() {\n            continue;\n        }\n        let w = cur.clone();\n        cur.clear();\n        if block.contains(&w) {\n            continue;\n        }\n        let e = count.entry(w.clone()).or_insert(0);\n        *e += 1;\n        if *e > best_n {\n            best_n = *e;\n            best = w;\n        }\n    }\n    best\n}`,
        php: `function mostCommonWord($paragraph, $banned) {\n    $block = array();\n    foreach ($banned as $b) $block[strtolower($b)] = true;\n    $count = array();\n    $best = "";\n    $bestN = 0;\n    $cur = "";\n    $n = strlen($paragraph);\n    for ($i = 0; $i <= $n; $i++) {\n        $c = $i < $n ? $paragraph[$i] : " ";\n        if (ctype_alpha($c)) { $cur .= $c; continue; }\n        if ($cur === "") continue;\n        $w = strtolower($cur);\n        $cur = "";\n        if (isset($block[$w])) continue;\n        $count[$w] = isset($count[$w]) ? $count[$w] + 1 : 1;\n        if ($count[$w] > $bestN) { $bestN = $count[$w]; $best = $w; }\n    }\n    return $best;\n}`,
        ruby: `def mostCommonWord(paragraph, banned)\n  blocked = {}\n  banned.each { |b| blocked[b.downcase] = true }\n  count = Hash.new(0)\n  best = ""\n  best_n = 0\n  paragraph.scan(/[a-zA-Z]+/).each do |raw|\n    w = raw.downcase\n    next if blocked[w]\n    count[w] += 1\n    if count[w] > best_n\n      best_n = count[w]\n      best = w\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Minimum Changes To Make Alternating Binary String (LC 1758) ─
  (() => {
    const ref = (s: string) => {
      let startZero = 0;
      for (let i = 0; i < s.length; i++) {
        const want = i % 2 === 0 ? "0" : "1";
        if (s.charAt(i) !== want) startZero++;
      }
      return Math.min(startZero, s.length - startZero);
    };
    return {
      slug: "minimum-changes-to-make-alternating-binary-string",
      title: "Minimum Changes to Make Alternating Binary String",
      difficulty: "EASY" as const,
      tags: ["String", "Greedy", "TCS", "Capgemini", "Amazon"],
      signature: { funcName: "minOperationsAlternating", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A binary string is **alternating** when no two adjacent characters are equal — `\"0101\"` and `\"1010\"` are alternating, `\"0100\"` is not.\n\nOne operation flips a single character. Return the minimum number of operations that makes `s` alternating.",
        [
          { in: 's = "0100"', out: "1", note: "Flipping the last character gives \"0101\"." },
          { in: 's = "10"', out: "0", note: "Already alternating." },
          { in: 's = "1111"', out: "2", note: "\"1010\" and \"0101\" each need two flips." },
        ],
        ["1 <= s.length <= 100000", "s[i] is '0' or '1'."]),
      hints: [
        "An alternating string of a given length is fully determined by its first character — there are exactly two targets.",
        "Count the mismatches against the pattern that starts with `'0'`.",
        "The mismatches against the other pattern are whatever is left over.",
      ],
      editorial: explain({
        idea: "There are only two alternating strings of length `n`: the one starting with `'0'` and the one starting with `'1'`. They disagree at *every* position, so mismatches against one are exactly the complement of mismatches against the other.",
        steps: [
          "Sweep the string, counting positions where `s[i]` differs from `i % 2 == 0 ? '0' : '1'`.",
          "Call that count `a`; the other target needs `n - a` flips.",
          "Return `min(a, n - a)`.",
        ],
        why: "The two targets are bitwise complements, so a position matching one necessarily mismatches the other. Counting once therefore gives both answers, and the minimum of the pair is optimal because no third alternating target exists.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Fixing violations greedily left to right can overcount — it commits to whichever target the first character suggests.",
          "Counting both patterns in separate passes is correct but does twice the work for no reason.",
        ],
      }),
      examples: [
        { input: '"0100"', expectedOutput: "1" },
        { input: '"10"', expectedOutput: "0" },
        { input: '"1111"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const s = Array.from({ length: n }, () => (rng() < 0.5 ? "0" : "1")).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minOperationsAlternating(s: str) -> int:\n    a = 0\n    for i, c in enumerate(s):\n        want = "0" if i % 2 == 0 else "1"\n        if c != want:\n            a += 1\n    return min(a, len(s) - a)`,
        javascript: `var minOperationsAlternating = function(s) {\n    var a = 0;\n    for (var i = 0; i < s.length; i++) {\n        var want = i % 2 === 0 ? "0" : "1";\n        if (s.charAt(i) !== want) a++;\n    }\n    return Math.min(a, s.length - a);\n};`,
        typescript: `function minOperationsAlternating(s: string): number {\n    var a = 0;\n    for (var i = 0; i < s.length; i++) {\n        var want = i % 2 === 0 ? "0" : "1";\n        if (s.charAt(i) !== want) a++;\n    }\n    return Math.min(a, s.length - a);\n}`,
        java: `public static int minOperationsAlternating(String s) {\n    int a = 0;\n    for (int i = 0; i < s.length(); i++) {\n        char want = i % 2 == 0 ? '0' : '1';\n        if (s.charAt(i) != want) a++;\n    }\n    return Math.min(a, s.length() - a);\n}`,
        cpp: `int minOperationsAlternating(string s) {\n    int a = 0;\n    for (int i = 0; i < (int) s.size(); i++) {\n        char want = i % 2 == 0 ? '0' : '1';\n        if (s[i] != want) a++;\n    }\n    return min(a, (int) s.size() - a);\n}`,
        c: `int minOperationsAlternating(char* s) {\n    int n = (int) strlen(s);\n    int a = 0;\n    for (int i = 0; i < n; i++) {\n        char want = i % 2 == 0 ? '0' : '1';\n        if (s[i] != want) a++;\n    }\n    return a < n - a ? a : n - a;\n}`,
        csharp: `public static int MinOperationsAlternating(string s)\n{\n    int a = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        char want = i % 2 == 0 ? '0' : '1';\n        if (s[i] != want) a++;\n    }\n    return Math.Min(a, s.Length - a);\n}`,
        go: `func minOperationsAlternating(s string) int {\n\ta := 0\n\tfor i := 0; i < len(s); i++ {\n\t\tvar want byte = \'1\'\n\t\tif i%2 == 0 {\n\t\t\twant = \'0\'\n\t\t}\n\t\tif s[i] != want {\n\t\t\ta++\n\t\t}\n\t}\n\tif a < len(s)-a {\n\t\treturn a\n\t}\n\treturn len(s) - a\n}`,
        kotlin: `fun minOperationsAlternating(s: String): Int {\n    var a = 0\n    for (i in s.indices) {\n        val want = if (i % 2 == 0) \'0\' else \'1\'\n        if (s[i] != want) a++\n    }\n    return minOf(a, s.length - a)\n}`,
        swift: `func minOperationsAlternating(_ s: String) -> Int {\n    let chars = Array(s)\n    var a = 0\n    for i in 0..<chars.count {\n        let want: Character = i % 2 == 0 ? "0" : "1"\n        if chars[i] != want { a += 1 }\n    }\n    return min(a, chars.count - a)\n}`,
        rust: `fn minOperationsAlternating(s: String) -> i32 {\n    let b = s.as_bytes();\n    let mut a = 0i32;\n    for i in 0..b.len() {\n        let want = if i % 2 == 0 { b\'0\' } else { b\'1\' };\n        if b[i] != want {\n            a += 1;\n        }\n    }\n    let n = b.len() as i32;\n    if a < n - a { a } else { n - a }\n}`,
        php: `function minOperationsAlternating($s) {\n    $n = strlen($s);\n    $a = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $want = $i % 2 === 0 ? "0" : "1";\n        if ($s[$i] !== $want) $a++;\n    }\n    return min($a, $n - $a);\n}`,
        ruby: `def minOperationsAlternating(s)\n  a = 0\n  s.each_char.with_index do |c, i|\n    want = i.even? ? "0" : "1"\n    a += 1 if c != want\n  end\n  [a, s.length - a].min\nend`,
      },
    };
  })(),

  // ── Check If Binary String Has at Most One Segment of Ones (LC 1784) ──
  (() => {
    const ref = (s: string) => {
      let segments = 0;
      for (let i = 0; i < s.length; i++) {
        if (s.charAt(i) === "1" && (i === 0 || s.charAt(i - 1) === "0")) segments++;
      }
      return segments <= 1;
    };
    return {
      slug: "check-if-binary-string-has-at-most-one-segment-of-ones",
      title: "Check if Binary String Has at Most One Segment of Ones",
      difficulty: "EASY" as const,
      tags: ["String", "TCS", "Infosys", "Accenture"],
      signature: { funcName: "checkOnesSegment", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A **segment of ones** is a maximal run of consecutive `'1'` characters.\n\nGiven a binary string `s` whose first character is `'1'`, return `true` if it contains at most one such segment.",
        [
          { in: 's = "1001"', out: "false", note: "Two segments: the leading 1 and the trailing 1." },
          { in: 's = "110"', out: "true", note: "One segment." },
          { in: 's = "1"', out: "true" },
        ],
        ["1 <= s.length <= 100", "s[i] is '0' or '1'", "s[0] is '1'."]),
      hints: [
        "A new segment starts exactly where a `'1'` follows a `'0'` (or begins the string).",
        "Count those starts and compare with 1.",
        "Because the string starts with `'1'`, an equivalent check is simply: does `\"01\"` appear anywhere?",
      ],
      editorial: explain({
        idea: "Segments are counted by their starting positions: a `'1'` whose predecessor is a `'0'` (or which is the first character) opens a new run. At most one such start means at most one segment.",
        steps: [
          "Sweep the string counting positions where `s[i] == '1'` and either `i == 0` or `s[i-1] == '0'`.",
          "Return whether that count is at most 1.",
        ],
        why: "Every maximal run of ones has exactly one starting position under that test, and every position passing the test opens a run — so the count is exactly the number of segments.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Counting `'1'` characters rather than run starts answers a different question entirely.",
          "The guarantee that `s[0] == '1'` is what makes the shortcut 'does the string contain 01' valid — without it, `\"0110\"` would fool it.",
        ],
      }),
      examples: [
        { input: '"1001"', expectedOutput: "false" },
        { input: '"110"', expectedOutput: "true" },
        { input: '"1"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const rest = Array.from({ length: n - 1 }, () => (rng() < 0.5 ? "0" : "1")).join("");
        const s = "1" + rest;
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: `def checkOnesSegment(s: str) -> bool:\n    segments = 0\n    for i, c in enumerate(s):\n        if c == "1" and (i == 0 or s[i - 1] == "0"):\n            segments += 1\n    return segments <= 1`,
        javascript: `var checkOnesSegment = function(s) {\n    var segments = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "1" && (i === 0 || s.charAt(i - 1) === "0")) segments++;\n    }\n    return segments <= 1;\n};`,
        typescript: `function checkOnesSegment(s: string): boolean {\n    var segments = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "1" && (i === 0 || s.charAt(i - 1) === "0")) segments++;\n    }\n    return segments <= 1;\n}`,
        java: `public static boolean checkOnesSegment(String s) {\n    int segments = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == '1' && (i == 0 || s.charAt(i - 1) == '0')) segments++;\n    }\n    return segments <= 1;\n}`,
        cpp: `bool checkOnesSegment(string s) {\n    int segments = 0;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (s[i] == '1' && (i == 0 || s[i - 1] == '0')) segments++;\n    }\n    return segments <= 1;\n}`,
        c: `bool checkOnesSegment(char* s) {\n    int segments = 0;\n    for (int i = 0; s[i] != 0; i++) {\n        if (s[i] == '1' && (i == 0 || s[i - 1] == '0')) segments++;\n    }\n    return segments <= 1;\n}`,
        csharp: `public static bool CheckOnesSegment(string s)\n{\n    int segments = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (s[i] == '1' && (i == 0 || s[i - 1] == '0')) segments++;\n    }\n    return segments <= 1;\n}`,
        go: `func checkOnesSegment(s string) bool {\n\tsegments := 0\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] == \'1\' && (i == 0 || s[i-1] == \'0\') {\n\t\t\tsegments++\n\t\t}\n\t}\n\treturn segments <= 1\n}`,
        kotlin: `fun checkOnesSegment(s: String): Boolean {\n    var segments = 0\n    for (i in s.indices) {\n        if (s[i] == \'1\' && (i == 0 || s[i - 1] == \'0\')) segments++\n    }\n    return segments <= 1\n}`,
        swift: `func checkOnesSegment(_ s: String) -> Bool {\n    let a = Array(s)\n    var segments = 0\n    for i in 0..<a.count {\n        if a[i] == "1" && (i == 0 || a[i - 1] == "0") { segments += 1 }\n    }\n    return segments <= 1\n}`,
        rust: `fn checkOnesSegment(s: String) -> bool {\n    let b = s.as_bytes();\n    let mut segments = 0;\n    for i in 0..b.len() {\n        if b[i] == b\'1\' && (i == 0 || b[i - 1] == b\'0\') {\n            segments += 1;\n        }\n    }\n    segments <= 1\n}`,
        php: `function checkOnesSegment($s) {\n    $segments = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] === "1" && ($i === 0 || $s[$i - 1] === "0")) $segments++;\n    }\n    return $segments <= 1;\n}`,
        ruby: `def checkOnesSegment(s)\n  segments = 0\n  s.each_char.with_index do |c, i|\n    segments += 1 if c == "1" && (i == 0 || s[i - 1] == "0")\n  end\n  segments <= 1\nend`,
      },
    };
  })(),

  // ── Count the Number of Vowel Strings in Range (LC 2586) ────────
  (() => {
    const isVowel = (c: string) => "aeiou".indexOf(c) >= 0;
    const ref = (words: string[], left: number, right: number) => {
      let total = 0;
      for (let i = left; i <= right; i++) {
        const w = words[i];
        if (isVowel(w.charAt(0)) && isVowel(w.charAt(w.length - 1))) total++;
      }
      return total;
    };
    return {
      slug: "count-the-number-of-vowel-strings-in-range",
      title: "Count the Number of Vowel Strings in Range",
      difficulty: "EASY" as const,
      tags: ["String", "Array", "TCS", "Wipro", "Cognizant"],
      signature: { funcName: "vowelStrings", params: [{ name: "words", type: "string[]" as const }, { name: "left", type: "int" as const }, { name: "right", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a 0-indexed array of strings `words` and two integers `left` and `right`.\n\nA string is a **vowel string** if it both starts and ends with a vowel (`a`, `e`, `i`, `o` or `u`). Return how many indices `i` with `left <= i <= right` hold a vowel string.",
        [
          { in: 'words = ["are","amy","u"], left = 0, right = 2', out: "2", note: '"are" starts with a and ends with e; "u" is a single vowel, which counts for both ends; "amy" ends in y.' },
          { in: 'words = ["hey","aeo","mu","ooo","artro"], left = 1, right = 4', out: "3", note: '"aeo", "ooo" and "artro" qualify.' },
          { in: 'words = ["kata","echo"], left = 1, right = 1', out: "1" },
        ],
        ["1 <= words.length <= 1000", "1 <= words[i].length <= 10", "0 <= left <= right < words.length", "words[i] consists of lowercase English letters."]),
      hints: [
        "Only the first and last character of each word matter — the middle is irrelevant.",
        "A one-character word is its own first and last character.",
        "Loop the index range directly rather than filtering the whole array.",
      ],
      editorial: explain({
        idea: "The predicate touches two characters per word, so the whole problem is a bounded loop with a two-character test.",
        steps: [
          "Loop `i` from `left` to `right` inclusive.",
          "Take `w = words[i]` and test whether `w[0]` and `w[w.length - 1]` are both vowels.",
          "Count the words that pass.",
        ],
        why: "A word of length 1 has `w[0] == w[w.length - 1]`, so the same test correctly requires that single character to be a vowel — no special case needed.",
        time: "O(right - left)",
        space: "O(1)",
        pitfalls: [
          "`right` is inclusive; `i < right` drops the last word.",
          "Treating `'y'` as a vowel — the statement lists exactly five.",
        ],
      }),
      examples: [
        { input: '["are","amy","u"]\n0\n2', expectedOutput: "2" },
        { input: '["hey","aeo","mu","ooo","artro"]\n1\n4', expectedOutput: "3" },
        { input: '["kata","echo"]\n1\n1', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const words = Array.from({ length: n }, () => randLower(rng, 1, 6, rng() < 0.5 ? "aeiou" : "abcdeiomuy"));
        const left = ri(rng, 0, n - 1);
        const right = ri(rng, left, n - 1);
        return { input: `${fmtStrArr(words)}\n${left}\n${right}`, expectedOutput: String(ref(words, left, right)) };
      },
      solutions: {
        python: `from typing import List\n\ndef vowelStrings(words: List[str], left: int, right: int) -> int:\n    vowels = set("aeiou")\n    total = 0\n    for i in range(left, right + 1):\n        w = words[i]\n        if w[0] in vowels and w[-1] in vowels:\n            total += 1\n    return total`,
        javascript: `var vowelStrings = function(words, left, right) {\n    var total = 0;\n    for (var i = left; i <= right; i++) {\n        var w = words[i];\n        if ("aeiou".indexOf(w.charAt(0)) >= 0 && "aeiou".indexOf(w.charAt(w.length - 1)) >= 0) total++;\n    }\n    return total;\n};`,
        typescript: `function vowelStrings(words: string[], left: number, right: number): number {\n    var total = 0;\n    for (var i = left; i <= right; i++) {\n        var w = words[i];\n        if ("aeiou".indexOf(w.charAt(0)) >= 0 && "aeiou".indexOf(w.charAt(w.length - 1)) >= 0) total++;\n    }\n    return total;\n}`,
        java: `public static int vowelStrings(String[] words, int left, int right) {\n    String v = "aeiou";\n    int total = 0;\n    for (int i = left; i <= right; i++) {\n        String w = words[i];\n        if (v.indexOf(w.charAt(0)) >= 0 && v.indexOf(w.charAt(w.length() - 1)) >= 0) total++;\n    }\n    return total;\n}`,
        cpp: `int vowelStrings(vector<string>& words, int left, int right) {\n    string v = "aeiou";\n    int total = 0;\n    for (int i = left; i <= right; i++) {\n        const string& w = words[i];\n        if (v.find(w.front()) != string::npos && v.find(w.back()) != string::npos) total++;\n    }\n    return total;\n}`,
        c: `static int isVowelChar(char c) {\n    return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';\n}\n\nint vowelStrings(char** words, int wordsSize, int left, int right) {\n    int total = 0;\n    for (int i = left; i <= right; i++) {\n        int len = (int) strlen(words[i]);\n        if (isVowelChar(words[i][0]) && isVowelChar(words[i][len - 1])) total++;\n    }\n    return total;\n}`,
        csharp: `public static int VowelStrings(string[] words, int left, int right)\n{\n    string v = "aeiou";\n    int total = 0;\n    for (int i = left; i <= right; i++)\n    {\n        string w = words[i];\n        if (v.IndexOf(w[0]) >= 0 && v.IndexOf(w[w.Length - 1]) >= 0) total++;\n    }\n    return total;\n}`,
        go: `func vowelStrings(words []string, left int, right int) int {\n\tv := "aeiou"\n\ttotal := 0\n\tfor i := left; i <= right; i++ {\n\t\tw := words[i]\n\t\tif strings.IndexByte(v, w[0]) >= 0 && strings.IndexByte(v, w[len(w)-1]) >= 0 {\n\t\t\ttotal++\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun vowelStrings(words: Array<String>, left: Int, right: Int): Int {\n    val v = "aeiou"\n    var total = 0\n    for (i in left..right) {\n        val w = words[i]\n        if (v.indexOf(w[0]) >= 0 && v.indexOf(w[w.length - 1]) >= 0) total++\n    }\n    return total\n}`,
        swift: `func vowelStrings(_ words: [String], _ left: Int, _ right: Int) -> Int {\n    let v: Set<Character> = ["a", "e", "i", "o", "u"]\n    var total = 0\n    for i in left...right {\n        let w = Array(words[i])\n        if v.contains(w[0]) && v.contains(w[w.count - 1]) { total += 1 }\n    }\n    return total\n}`,
        rust: `fn vowelStrings(words: Vec<String>, left: i32, right: i32) -> i32 {\n    let v = "aeiou";\n    let mut total = 0;\n    for i in (left as usize)..=(right as usize) {\n        let b = words[i].as_bytes();\n        let first = b[0] as char;\n        let last = b[b.len() - 1] as char;\n        if v.contains(first) && v.contains(last) {\n            total += 1;\n        }\n    }\n    total\n}`,
        php: `function vowelStrings($words, $left, $right) {\n    $v = "aeiou";\n    $total = 0;\n    for ($i = $left; $i <= $right; $i++) {\n        $w = $words[$i];\n        if (strpos($v, $w[0]) !== false && strpos($v, $w[strlen($w) - 1]) !== false) $total++;\n    }\n    return $total;\n}`,
        ruby: `def vowelStrings(words, left, right)\n  v = "aeiou"\n  (left..right).count { |i| v.include?(words[i][0]) && v.include?(words[i][-1]) }\nend`,
      },
    };
  })(),

  // ── Find and Replace Pattern (LC 890) ───────────────────────────
  (() => {
    const matches = (w: string, pattern: string) => {
      if (w.length !== pattern.length) return false;
      const fwd: Record<string, string> = {}, back: Record<string, string> = {};
      for (let i = 0; i < w.length; i++) {
        const a = w.charAt(i), b = pattern.charAt(i);
        if (fwd[a] === undefined) fwd[a] = b;
        else if (fwd[a] !== b) return false;
        if (back[b] === undefined) back[b] = a;
        else if (back[b] !== a) return false;
      }
      return true;
    };
    const ref = (words: string[], pattern: string) => words.filter((w) => matches(w, pattern));
    return {
      slug: "find-and-replace-pattern",
      title: "Find and Replace Pattern",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Hash Table", "Amazon", "Google", "Adobe"],
      signature: { funcName: "findAndReplacePattern", params: [{ name: "words", type: "string[]" as const }, { name: "pattern", type: "string" as const }], returns: "string[]" as const },
      description: describe(
        "A word **matches** a pattern when there is a one-to-one letter substitution turning the pattern into the word — every pattern letter always maps to the same word letter, and no two pattern letters map to the same word letter.\n\nReturn every word in `words` that matches `pattern`, keeping the original order.",
        [
          { in: 'words = ["abc","deq","mee","aqq","dkd","ccc"], pattern = "abb"', out: '["mee","aqq"]', note: '"mee" works with a->m and b->e; "dkd" fails because the pattern needs b->k and b->d at once.' },
          { in: 'words = ["kata","duel","rank"], pattern = "abcd"', out: '["duel","rank"]', note: '"kata" repeats a, which "abcd" does not.' },
          { in: 'words = ["aa","bb","ab"], pattern = "cc"', out: '["aa","bb"]' },
        ],
        ["1 <= pattern.length <= 20", "1 <= words.length <= 50", "words[i].length == pattern.length", "All strings consist of lowercase English letters."]),
      hints: [
        "One map is not enough — `\"abc\"` would 'match' `\"aaa\"` if you only check one direction.",
        "Keep two maps: pattern letter to word letter and word letter back to pattern letter.",
        "A contradiction in either direction rejects the word immediately.",
      ],
      editorial: explain({
        idea: "A one-to-one substitution is a bijection, and a bijection is exactly two consistent maps — one in each direction. Checking both is what rules out two pattern letters collapsing onto the same word letter.",
        steps: [
          "For each word, walk the positions with two empty maps.",
          "At position `i`, bind `word[i] -> pattern[i]` and `pattern[i] -> word[i]`, rejecting the word if either binding contradicts an existing one.",
          "Keep the word if the walk finishes without a contradiction.",
        ],
        why: "The forward map enforces that a pattern letter never maps to two different word letters; the backward map enforces injectivity, so two pattern letters can never share a word letter. Together they are precisely the definition of a permutation of the alphabet restricted to the letters used.",
        time: "O(n · m) for n words of length m",
        space: "O(1) — at most 26 entries per map",
        pitfalls: [
          "Checking only one direction accepts `\"aaa\"` for pattern `\"abc\"`.",
          "Reusing the maps between words leaks bindings from the previous word.",
        ],
      }),
      examples: [
        { input: '["abc","deq","mee","aqq","dkd","ccc"]\n"abb"', expectedOutput: '["mee","aqq"]' },
        { input: '["kata","duel","rank"]\n"abcd"', expectedOutput: '["duel","rank"]' },
        { input: '["aa","bb","ab"]\n"cc"', expectedOutput: '["aa","bb"]' },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 6);
        const pattern = randLower(rng, m, m, "abc");
        const words = Array.from({ length: ri(rng, 1, 10) }, () => randLower(rng, m, m, "abcd"));
        return { input: `${fmtStrArr(words)}\n"${pattern}"`, expectedOutput: fmtStrArr(ref(words, pattern)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findAndReplacePattern(words: List[str], pattern: str) -> List[str]:\n    def ok(w: str) -> bool:\n        fwd, back = {}, {}\n        for a, b in zip(w, pattern):\n            if fwd.setdefault(a, b) != b:\n                return False\n            if back.setdefault(b, a) != a:\n                return False\n        return True\n    return [w for w in words if ok(w)]`,
        javascript: `var findAndReplacePattern = function(words, pattern) {\n    var ok = function(w) {\n        if (w.length !== pattern.length) return false;\n        var fwd = {}, back = {};\n        for (var i = 0; i < w.length; i++) {\n            var a = w.charAt(i), b = pattern.charAt(i);\n            if (fwd[a] === undefined) fwd[a] = b;\n            else if (fwd[a] !== b) return false;\n            if (back[b] === undefined) back[b] = a;\n            else if (back[b] !== a) return false;\n        }\n        return true;\n    };\n    var out = [];\n    for (var j = 0; j < words.length; j++) {\n        if (ok(words[j])) out.push(words[j]);\n    }\n    return out;\n};`,
        typescript: `function findAndReplacePattern(words: string[], pattern: string): string[] {\n    var ok = function(w: string): boolean {\n        if (w.length !== pattern.length) return false;\n        var fwd: { [key: string]: string } = {}, back: { [key: string]: string } = {};\n        for (var i = 0; i < w.length; i++) {\n            var a = w.charAt(i), b = pattern.charAt(i);\n            if (fwd[a] === undefined) fwd[a] = b;\n            else if (fwd[a] !== b) return false;\n            if (back[b] === undefined) back[b] = a;\n            else if (back[b] !== a) return false;\n        }\n        return true;\n    };\n    var out: string[] = [];\n    for (var j = 0; j < words.length; j++) {\n        if (ok(words[j])) out.push(words[j]);\n    }\n    return out;\n}`,
        java: `public static String[] findAndReplacePattern(String[] words, String pattern) {\n    List<String> out = new ArrayList<>();\n    for (String w : words) {\n        if (w.length() != pattern.length()) continue;\n        int[] fwd = new int[128];\n        int[] back = new int[128];\n        boolean ok = true;\n        for (int i = 0; i < w.length(); i++) {\n            char a = w.charAt(i), b = pattern.charAt(i);\n            if (fwd[a] == 0) fwd[a] = b;\n            else if (fwd[a] != b) { ok = false; break; }\n            if (back[b] == 0) back[b] = a;\n            else if (back[b] != a) { ok = false; break; }\n        }\n        if (ok) out.add(w);\n    }\n    return out.toArray(new String[0]);\n}`,
        cpp: `vector<string> findAndReplacePattern(vector<string>& words, string pattern) {\n    vector<string> out;\n    for (const string& w : words) {\n        if (w.size() != pattern.size()) continue;\n        vector<char> fwd(128, 0), back(128, 0);\n        bool ok = true;\n        for (size_t i = 0; i < w.size(); i++) {\n            char a = w[i], b = pattern[i];\n            if (!fwd[(int) a]) fwd[(int) a] = b;\n            else if (fwd[(int) a] != b) { ok = false; break; }\n            if (!back[(int) b]) back[(int) b] = a;\n            else if (back[(int) b] != a) { ok = false; break; }\n        }\n        if (ok) out.push_back(w);\n    }\n    return out;\n}`,
        c: `char** findAndReplacePattern(char** words, int wordsSize, char* pattern, int* returnSize) {\n    int plen = (int) strlen(pattern);\n    char** out = (char**) malloc((size_t) wordsSize * sizeof(char*));\n    int m = 0;\n    for (int t = 0; t < wordsSize; t++) {\n        char* w = words[t];\n        if ((int) strlen(w) != plen) continue;\n        char fwd[128], back[128];\n        memset(fwd, 0, sizeof(fwd));\n        memset(back, 0, sizeof(back));\n        int ok = 1;\n        for (int i = 0; i < plen; i++) {\n            unsigned char a = (unsigned char) w[i], b = (unsigned char) pattern[i];\n            if (!fwd[a]) fwd[a] = (char) b;\n            else if (fwd[a] != (char) b) { ok = 0; break; }\n            if (!back[b]) back[b] = (char) a;\n            else if (back[b] != (char) a) { ok = 0; break; }\n        }\n        if (ok) {\n            char* copy = (char*) malloc(strlen(w) + 1);\n            strcpy(copy, w);\n            out[m++] = copy;\n        }\n    }\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static string[] FindAndReplacePattern(string[] words, string pattern)\n{\n    var out_ = new List<string>();\n    foreach (string w in words)\n    {\n        if (w.Length != pattern.Length) continue;\n        var fwd = new char[128];\n        var back = new char[128];\n        bool ok = true;\n        for (int i = 0; i < w.Length; i++)\n        {\n            char a = w[i], b = pattern[i];\n            if (fwd[a] == '\\0') fwd[a] = b;\n            else if (fwd[a] != b) { ok = false; break; }\n            if (back[b] == '\\0') back[b] = a;\n            else if (back[b] != a) { ok = false; break; }\n        }\n        if (ok) out_.Add(w);\n    }\n    return out_.ToArray();\n}`,
        go: `func findAndReplacePattern(words []string, pattern string) []string {\n\tout := []string{}\n\tfor _, w := range words {\n\t\tif len(w) != len(pattern) {\n\t\t\tcontinue\n\t\t}\n\t\tfwd := make([]byte, 128)\n\t\tback := make([]byte, 128)\n\t\tok := true\n\t\tfor i := 0; i < len(w); i++ {\n\t\t\ta, b := w[i], pattern[i]\n\t\t\tif fwd[a] == 0 {\n\t\t\t\tfwd[a] = b\n\t\t\t} else if fwd[a] != b {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t\tif back[b] == 0 {\n\t\t\t\tback[b] = a\n\t\t\t} else if back[b] != a {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tif ok {\n\t\t\tout = append(out, w)\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun findAndReplacePattern(words: Array<String>, pattern: String): Array<String> {\n    val out = ArrayList<String>()\n    for (w in words) {\n        if (w.length != pattern.length) continue\n        val fwd = CharArray(128)\n        val back = CharArray(128)\n        var ok = true\n        for (i in w.indices) {\n            val a = w[i]\n            val b = pattern[i]\n            if (fwd[a.toInt()] == '\\u0000') fwd[a.toInt()] = b\n            else if (fwd[a.toInt()] != b) { ok = false; break }\n            if (back[b.toInt()] == '\\u0000') back[b.toInt()] = a\n            else if (back[b.toInt()] != a) { ok = false; break }\n        }\n        if (ok) out.add(w)\n    }\n    return out.toTypedArray()\n}`,
        swift: `func findAndReplacePattern(_ words: [String], _ pattern: String) -> [String] {\n    let p = Array(pattern)\n    var out: [String] = []\n    for word in words {\n        let w = Array(word)\n        if w.count != p.count { continue }\n        var fwd: [Character: Character] = [:]\n        var back: [Character: Character] = [:]\n        var ok = true\n        for i in 0..<w.count {\n            let a = w[i], b = p[i]\n            if let f = fwd[a] {\n                if f != b { ok = false; break }\n            } else {\n                fwd[a] = b\n            }\n            if let r = back[b] {\n                if r != a { ok = false; break }\n            } else {\n                back[b] = a\n            }\n        }\n        if ok { out.append(word) }\n    }\n    return out\n}`,
        rust: `fn findAndReplacePattern(words: Vec<String>, pattern: String) -> Vec<String> {\n    let p = pattern.as_bytes();\n    let mut out: Vec<String> = Vec::new();\n    for word in words.iter() {\n        let w = word.as_bytes();\n        if w.len() != p.len() {\n            continue;\n        }\n        let mut fwd = [0u8; 128];\n        let mut back = [0u8; 128];\n        let mut ok = true;\n        for i in 0..w.len() {\n            let (a, b) = (w[i] as usize, p[i]);\n            if fwd[a] == 0 {\n                fwd[a] = b;\n            } else if fwd[a] != b {\n                ok = false;\n                break;\n            }\n            let bi = b as usize;\n            if back[bi] == 0 {\n                back[bi] = w[i];\n            } else if back[bi] != w[i] {\n                ok = false;\n                break;\n            }\n        }\n        if ok {\n            out.push(word.clone());\n        }\n    }\n    out\n}`,
        php: `function findAndReplacePattern($words, $pattern) {\n    $out = array();\n    foreach ($words as $w) {\n        if (strlen($w) !== strlen($pattern)) continue;\n        $fwd = array();\n        $back = array();\n        $ok = true;\n        for ($i = 0; $i < strlen($w); $i++) {\n            $a = $w[$i];\n            $b = $pattern[$i];\n            if (!isset($fwd[$a])) $fwd[$a] = $b;\n            else if ($fwd[$a] !== $b) { $ok = false; break; }\n            if (!isset($back[$b])) $back[$b] = $a;\n            else if ($back[$b] !== $a) { $ok = false; break; }\n        }\n        if ($ok) $out[] = $w;\n    }\n    return $out;\n}`,
        ruby: `def findAndReplacePattern(words, pattern)\n  words.select do |w|\n    next false if w.length != pattern.length\n    fwd = {}\n    back = {}\n    ok = true\n    (0...w.length).each do |i|\n      a = w[i]\n      b = pattern[i]\n      if fwd.key?(a)\n        (ok = false; break) if fwd[a] != b\n      else\n        fwd[a] = b\n      end\n      if back.key?(b)\n        (ok = false; break) if back[b] != a\n      else\n        back[b] = a\n      end\n    end\n    ok\n  end\nend`,
      },
    };
  })(),

  // ── Number of Matching Subsequences (LC 792) ────────────────────
  (() => {
    const isSub = (s: string, w: string) => {
      let i = 0;
      for (let j = 0; j < s.length && i < w.length; j++) {
        if (s.charAt(j) === w.charAt(i)) i++;
      }
      return i === w.length;
    };
    const ref = (s: string, words: string[]) => {
      let total = 0;
      for (const w of words) { if (isSub(s, w)) total++; }
      return total;
    };
    return {
      slug: "number-of-matching-subsequences",
      title: "Number of Matching Subsequences",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Two Pointers", "Binary Search", "Google", "Amazon", "Meta"],
      signature: { funcName: "numMatchingSubseq", params: [{ name: "s", type: "string" as const }, { name: "words", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s` and an array of strings `words`, return how many entries of `words` are **subsequences** of `s`.\n\nA subsequence is formed by deleting zero or more characters without reordering the rest. Duplicates in `words` are counted separately.",
        [
          { in: 's = "codekairo", words = ["code","kai","ckr","xyz"]', out: "3", note: '"code", "kai" and "ckr" can all be read left to right inside s; "xyz" cannot.' },
          { in: 's = "abcde", words = ["a","bb","acd","ace"]', out: "3" },
          { in: 's = "dsahjpjauf", words = ["ahjpjau","ja","ahbwzgqnuk","tnmlanowax"]', out: "2" },
        ],
        ["1 <= s.length <= 50000", "1 <= words.length <= 5000", "1 <= words[i].length <= 50", "All strings consist of lowercase English letters."]),
      hints: [
        "Testing one word is a simple two-pointer walk: advance through `s`, ticking off the word's characters in order.",
        "Doing that per word is O(|s| · |words|), which is the straightforward answer and fine at these limits.",
        "The faster route buckets the words by their *next needed* character and sweeps `s` once, moving each waiting word forward as its character arrives.",
      ],
      editorial: explain({
        idea: "A word is a subsequence when a greedy left-to-right match consumes all of it: always take the earliest possible occurrence of the next needed character.",
        steps: [
          "For each word, set a pointer `i` at its start.",
          "Walk `s` once; whenever the current character of `s` equals `word[i]`, advance `i`.",
          "The word matches if `i` reaches the end of the word.",
          "Count the matching words.",
        ],
        why: "The greedy match is optimal: if any embedding exists, taking the earliest occurrence of each character leaves at least as much of `s` available for the rest, so the greedy walk succeeds whenever some embedding does.",
        time: "O(|s| · |words|) for the direct method; O(|s| + total word length) with the bucketing trick",
        space: "O(1) for the direct method",
        pitfalls: [
          "Checking `s.includes(word)` tests for a *substring*, which is a different (stricter) relation.",
          "Restarting the scan of `s` for each character of the word is quadratic per word.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n["code","kai","ckr","xyz"]', expectedOutput: "3" },
        { input: '"abcde"\n["a","bb","acd","ace"]', expectedOutput: "3" },
        { input: '"dsahjpjauf"\n["ahjpjau","ja","ahbwzgqnuk","tnmlanowax"]', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.5 ? "abcd" : "abcdefghij";
        const s = randLower(rng, 1, 40, alphabet);
        const words = Array.from({ length: ri(rng, 1, 10) }, () => {
          if (rng() < 0.5 && s.length > 1) {
            // Draw a genuine subsequence so the answer is not always tiny.
            const keep: string[] = [];
            for (let i = 0; i < s.length; i++) { if (rng() < 0.5) keep.push(s.charAt(i)); }
            return keep.length > 0 ? keep.join("") : s.charAt(0);
          }
          return randLower(rng, 1, 6, alphabet);
        });
        return { input: `"${s}"\n${fmtStrArr(words)}`, expectedOutput: String(ref(s, words)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numMatchingSubseq(s: str, words: List[str]) -> int:\n    def is_sub(w: str) -> bool:\n        i = 0\n        for c in s:\n            if i < len(w) and c == w[i]:\n                i += 1\n        return i == len(w)\n    return sum(1 for w in words if is_sub(w))`,
        javascript: `var numMatchingSubseq = function(s, words) {\n    var isSub = function(w) {\n        var i = 0;\n        for (var j = 0; j < s.length && i < w.length; j++) {\n            if (s.charAt(j) === w.charAt(i)) i++;\n        }\n        return i === w.length;\n    };\n    var total = 0;\n    for (var t = 0; t < words.length; t++) {\n        if (isSub(words[t])) total++;\n    }\n    return total;\n};`,
        typescript: `function numMatchingSubseq(s: string, words: string[]): number {\n    var isSub = function(w: string): boolean {\n        var i = 0;\n        for (var j = 0; j < s.length && i < w.length; j++) {\n            if (s.charAt(j) === w.charAt(i)) i++;\n        }\n        return i === w.length;\n    };\n    var total = 0;\n    for (var t = 0; t < words.length; t++) {\n        if (isSub(words[t])) total++;\n    }\n    return total;\n}`,
        java: `public static int numMatchingSubseq(String s, String[] words) {\n    int total = 0;\n    for (String w : words) {\n        int i = 0;\n        for (int j = 0; j < s.length() && i < w.length(); j++) {\n            if (s.charAt(j) == w.charAt(i)) i++;\n        }\n        if (i == w.length()) total++;\n    }\n    return total;\n}`,
        cpp: `int numMatchingSubseq(string s, vector<string>& words) {\n    int total = 0;\n    for (const string& w : words) {\n        size_t i = 0;\n        for (size_t j = 0; j < s.size() && i < w.size(); j++) {\n            if (s[j] == w[i]) i++;\n        }\n        if (i == w.size()) total++;\n    }\n    return total;\n}`,
        c: `int numMatchingSubseq(char* s, char** words, int wordsSize) {\n    int slen = (int) strlen(s);\n    int total = 0;\n    for (int t = 0; t < wordsSize; t++) {\n        char* w = words[t];\n        int wl = (int) strlen(w);\n        int i = 0;\n        for (int j = 0; j < slen && i < wl; j++) {\n            if (s[j] == w[i]) i++;\n        }\n        if (i == wl) total++;\n    }\n    return total;\n}`,
        csharp: `public static int NumMatchingSubseq(string s, string[] words)\n{\n    int total = 0;\n    foreach (string w in words)\n    {\n        int i = 0;\n        for (int j = 0; j < s.Length && i < w.Length; j++)\n        {\n            if (s[j] == w[i]) i++;\n        }\n        if (i == w.Length) total++;\n    }\n    return total;\n}`,
        go: `func numMatchingSubseq(s string, words []string) int {\n\ttotal := 0\n\tfor _, w := range words {\n\t\ti := 0\n\t\tfor j := 0; j < len(s) && i < len(w); j++ {\n\t\t\tif s[j] == w[i] {\n\t\t\t\ti++\n\t\t\t}\n\t\t}\n\t\tif i == len(w) {\n\t\t\ttotal++\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun numMatchingSubseq(s: String, words: Array<String>): Int {\n    var total = 0\n    for (w in words) {\n        var i = 0\n        var j = 0\n        while (j < s.length && i < w.length) {\n            if (s[j] == w[i]) i++\n            j++\n        }\n        if (i == w.length) total++\n    }\n    return total\n}`,
        swift: `func numMatchingSubseq(_ s: String, _ words: [String]) -> Int {\n    let sa = Array(s)\n    var total = 0\n    for word in words {\n        let w = Array(word)\n        var i = 0\n        var j = 0\n        while j < sa.count && i < w.count {\n            if sa[j] == w[i] { i += 1 }\n            j += 1\n        }\n        if i == w.count { total += 1 }\n    }\n    return total\n}`,
        rust: `fn numMatchingSubseq(s: String, words: Vec<String>) -> i32 {\n    let sb = s.as_bytes();\n    let mut total = 0;\n    for word in words.iter() {\n        let w = word.as_bytes();\n        let mut i = 0usize;\n        let mut j = 0usize;\n        while j < sb.len() && i < w.len() {\n            if sb[j] == w[i] {\n                i += 1;\n            }\n            j += 1;\n        }\n        if i == w.len() {\n            total += 1;\n        }\n    }\n    total\n}`,
        php: `function numMatchingSubseq($s, $words) {\n    $slen = strlen($s);\n    $total = 0;\n    foreach ($words as $w) {\n        $wl = strlen($w);\n        $i = 0;\n        for ($j = 0; $j < $slen && $i < $wl; $j++) {\n            if ($s[$j] === $w[$i]) $i++;\n        }\n        if ($i === $wl) $total++;\n    }\n    return $total;\n}`,
        ruby: `def numMatchingSubseq(s, words)\n  words.count do |w|\n    i = 0\n    s.each_char do |c|\n      i += 1 if i < w.length && c == w[i]\n    end\n    i == w.length\n  end\nend`,
      },
    };
  })(),

  // ── Longest Word in Dictionary Through Deleting (LC 524) ────────
  (() => {
    const isSub = (s: string, w: string) => {
      let i = 0;
      for (let j = 0; j < s.length && i < w.length; j++) {
        if (s.charAt(j) === w.charAt(i)) i++;
      }
      return i === w.length;
    };
    const ref = (s: string, dictionary: string[]) => {
      let best = "";
      for (const w of dictionary) {
        if (!isSub(s, w)) continue;
        if (w.length > best.length || (w.length === best.length && w < best)) best = w;
      }
      return best;
    };
    return {
      slug: "longest-word-in-dictionary-through-deleting",
      title: "Longest Word in Dictionary Through Deleting",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Two Pointers", "Sorting", "Google", "Amazon", "Flipkart"],
      signature: { funcName: "findLongestWord", params: [{ name: "s", type: "string" as const }, { name: "dictionary", type: "string[]" as const }], returns: "string" as const },
      description: describe(
        "Given a string `s` and a `dictionary` of strings, return the **longest** dictionary word that can be formed by deleting some characters of `s` (a subsequence).\n\nIf several words tie on length, return the **lexicographically smallest** one. If none can be formed, return the empty string.",
        [
          { in: 's = "codekairo", dictionary = ["code","cairo","dek","kai"]', out: "cairo", note: '"code" and "cairo" are both subsequences of length 4 and 5; the longest is "cairo".' },
          { in: 's = "abpcplea", dictionary = ["ale","apple","monkey","plea"]', out: "apple" },
          { in: 's = "abc", dictionary = ["xyz"]', out: "", note: "Nothing can be formed." },
        ],
        ["1 <= s.length <= 1000", "1 <= dictionary.length <= 1000", "1 <= dictionary[i].length <= 1000", "All strings consist of lowercase English letters."]),
      hints: [
        "Subsequence testing is the same two-pointer walk as ever.",
        "There is no need to sort: keep a running best and replace it only on a strictly longer word, or an equal-length word that compares smaller.",
        "Comparing strings with `<` is lexicographic in every target language.",
      ],
      editorial: explain({
        idea: "Test each dictionary word for being a subsequence of `s`, and keep a running champion under the ordering the statement defines: longer wins, and on a tie the lexicographically smaller wins.",
        steps: [
          "Start with `best` as the empty string.",
          "For each word, run the greedy two-pointer subsequence test against `s`.",
          "If it passes and is longer than `best`, adopt it; if it passes and ties on length but compares smaller, adopt it too.",
        ],
        why: "The comparison rule is a strict total order on the candidates, so scanning once while keeping the maximum under that order finds the unique answer — no sort required.",
        time: "O(|s| · total dictionary length)",
        space: "O(1) beyond the answer",
        pitfalls: [
          "Adopting on `>=` length without the lexicographic tie-break returns whichever equal-length word came last.",
          "Sorting the dictionary first works but costs an unnecessary `log n` factor.",
          "The empty string is the correct answer when nothing matches — not `-1` or a null.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n["code","cairo","dek","kai"]', expectedOutput: "cairo" },
        { input: '"abpcplea"\n["ale","apple","monkey","plea"]', expectedOutput: "apple" },
        { input: '"abc"\n["xyz"]', expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.5 ? "abc" : "abcdefg";
        const s = randLower(rng, 1, 30, alphabet);
        const dictionary = Array.from({ length: ri(rng, 1, 10) }, () => {
          if (rng() < 0.55 && s.length > 0) {
            const keep: string[] = [];
            for (let i = 0; i < s.length; i++) { if (rng() < 0.6) keep.push(s.charAt(i)); }
            return keep.length > 0 ? keep.join("") : s.charAt(0);
          }
          return randLower(rng, 1, 6, alphabet);
        });
        return { input: `"${s}"\n${fmtStrArr(dictionary)}`, expectedOutput: ref(s, dictionary) };
      },
      solutions: {
        python: `from typing import List\n\ndef findLongestWord(s: str, dictionary: List[str]) -> str:\n    def is_sub(w: str) -> bool:\n        i = 0\n        for c in s:\n            if i < len(w) and c == w[i]:\n                i += 1\n        return i == len(w)\n    best = ""\n    for w in dictionary:\n        if not is_sub(w):\n            continue\n        if len(w) > len(best) or (len(w) == len(best) and w < best):\n            best = w\n    return best`,
        javascript: `var findLongestWord = function(s, dictionary) {\n    var isSub = function(w) {\n        var i = 0;\n        for (var j = 0; j < s.length && i < w.length; j++) {\n            if (s.charAt(j) === w.charAt(i)) i++;\n        }\n        return i === w.length;\n    };\n    var best = "";\n    for (var t = 0; t < dictionary.length; t++) {\n        var w = dictionary[t];\n        if (!isSub(w)) continue;\n        if (w.length > best.length || (w.length === best.length && w < best)) best = w;\n    }\n    return best;\n};`,
        typescript: `function findLongestWord(s: string, dictionary: string[]): string {\n    var isSub = function(w: string): boolean {\n        var i = 0;\n        for (var j = 0; j < s.length && i < w.length; j++) {\n            if (s.charAt(j) === w.charAt(i)) i++;\n        }\n        return i === w.length;\n    };\n    var best = "";\n    for (var t = 0; t < dictionary.length; t++) {\n        var w = dictionary[t];\n        if (!isSub(w)) continue;\n        if (w.length > best.length || (w.length === best.length && w < best)) best = w;\n    }\n    return best;\n}`,
        java: `public static String findLongestWord(String s, String[] dictionary) {\n    String best = "";\n    for (String w : dictionary) {\n        int i = 0;\n        for (int j = 0; j < s.length() && i < w.length(); j++) {\n            if (s.charAt(j) == w.charAt(i)) i++;\n        }\n        if (i != w.length()) continue;\n        if (w.length() > best.length() || (w.length() == best.length() && w.compareTo(best) < 0)) best = w;\n    }\n    return best;\n}`,
        cpp: `string findLongestWord(string s, vector<string>& dictionary) {\n    string best = "";\n    for (const string& w : dictionary) {\n        size_t i = 0;\n        for (size_t j = 0; j < s.size() && i < w.size(); j++) {\n            if (s[j] == w[i]) i++;\n        }\n        if (i != w.size()) continue;\n        if (w.size() > best.size() || (w.size() == best.size() && w < best)) best = w;\n    }\n    return best;\n}`,
        c: `char* findLongestWord(char* s, char** dictionary, int dictionarySize) {\n    int slen = (int) strlen(s);\n    char* best = (char*) malloc(2);\n    best[0] = 0;\n    for (int t = 0; t < dictionarySize; t++) {\n        char* w = dictionary[t];\n        int wl = (int) strlen(w);\n        int i = 0;\n        for (int j = 0; j < slen && i < wl; j++) {\n            if (s[j] == w[i]) i++;\n        }\n        if (i != wl) continue;\n        int bl = (int) strlen(best);\n        if (wl > bl || (wl == bl && strcmp(w, best) < 0)) {\n            free(best);\n            best = (char*) malloc((size_t) wl + 1);\n            strcpy(best, w);\n        }\n    }\n    return best;\n}`,
        csharp: `public static string FindLongestWord(string s, string[] dictionary)\n{\n    string best = "";\n    foreach (string w in dictionary)\n    {\n        int i = 0;\n        for (int j = 0; j < s.Length && i < w.Length; j++)\n        {\n            if (s[j] == w[i]) i++;\n        }\n        if (i != w.Length) continue;\n        if (w.Length > best.Length || (w.Length == best.Length && string.CompareOrdinal(w, best) < 0)) best = w;\n    }\n    return best;\n}`,
        go: `func findLongestWord(s string, dictionary []string) string {\n\tbest := ""\n\tfor _, w := range dictionary {\n\t\ti := 0\n\t\tfor j := 0; j < len(s) && i < len(w); j++ {\n\t\t\tif s[j] == w[i] {\n\t\t\t\ti++\n\t\t\t}\n\t\t}\n\t\tif i != len(w) {\n\t\t\tcontinue\n\t\t}\n\t\tif len(w) > len(best) || (len(w) == len(best) && w < best) {\n\t\t\tbest = w\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun findLongestWord(s: String, dictionary: Array<String>): String {\n    var best = ""\n    for (w in dictionary) {\n        var i = 0\n        var j = 0\n        while (j < s.length && i < w.length) {\n            if (s[j] == w[i]) i++\n            j++\n        }\n        if (i != w.length) continue\n        if (w.length > best.length || (w.length == best.length && w < best)) best = w\n    }\n    return best\n}`,
        swift: `func findLongestWord(_ s: String, _ dictionary: [String]) -> String {\n    let sa = Array(s)\n    var best = ""\n    for word in dictionary {\n        let w = Array(word)\n        var i = 0\n        var j = 0\n        while j < sa.count && i < w.count {\n            if sa[j] == w[i] { i += 1 }\n            j += 1\n        }\n        if i != w.count { continue }\n        if word.count > best.count || (word.count == best.count && word < best) { best = word }\n    }\n    return best\n}`,
        rust: `fn findLongestWord(s: String, dictionary: Vec<String>) -> String {\n    let sb = s.as_bytes();\n    let mut best = String::new();\n    for word in dictionary.iter() {\n        let w = word.as_bytes();\n        let mut i = 0usize;\n        let mut j = 0usize;\n        while j < sb.len() && i < w.len() {\n            if sb[j] == w[i] {\n                i += 1;\n            }\n            j += 1;\n        }\n        if i != w.len() {\n            continue;\n        }\n        if w.len() > best.len() || (w.len() == best.len() && word < &best) {\n            best = word.clone();\n        }\n    }\n    best\n}`,
        php: `function findLongestWord($s, $dictionary) {\n    $slen = strlen($s);\n    $best = "";\n    foreach ($dictionary as $w) {\n        $wl = strlen($w);\n        $i = 0;\n        for ($j = 0; $j < $slen && $i < $wl; $j++) {\n            if ($s[$j] === $w[$i]) $i++;\n        }\n        if ($i !== $wl) continue;\n        if ($wl > strlen($best) || ($wl === strlen($best) && strcmp($w, $best) < 0)) $best = $w;\n    }\n    return $best;\n}`,
        ruby: `def findLongestWord(s, dictionary)\n  best = ""\n  dictionary.each do |w|\n    i = 0\n    s.each_char do |c|\n      i += 1 if i < w.length && c == w[i]\n    end\n    next if i != w.length\n    best = w if w.length > best.length || (w.length == best.length && w < best)\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Count Words Obtained After Adding a Letter (LC 2135) ────────
  (() => {
    const mask = (w: string) => {
      let m = 0;
      for (let i = 0; i < w.length; i++) m |= 1 << (w.charCodeAt(i) - 97);
      return m;
    };
    const ref = (startWords: string[], targetWords: string[]) => {
      const have: Record<string, boolean> = {};
      for (const w of startWords) have[String(mask(w))] = true;
      let total = 0;
      for (const t of targetWords) {
        const m = mask(t);
        for (let b = 0; b < 26; b++) {
          if ((m & (1 << b)) !== 0 && have[String(m ^ (1 << b))] === true) { total++; break; }
        }
      }
      return total;
    };
    return {
      slug: "count-words-obtained-after-adding-a-letter",
      title: "Count Words Obtained After Adding a Letter",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Bit Manipulation", "Hash Table", "Amazon", "Google"],
      signature: { funcName: "wordCount", params: [{ name: "startWords", type: "string[]" as const }, { name: "targetWords", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "Every string in `startWords` and `targetWords` has **all distinct letters**.\n\nA target word is **obtainable** if you can take some start word, append one letter it does not already contain, and then rearrange the result into the target.\n\nReturn how many target words are obtainable. Start words are never consumed — each can be reused.",
        [
          { in: 'startWords = ["ant","act","tack"], targetWords = ["tack","act","acti"]', out: "2", note: '"tack" comes from "act" plus k; "acti" comes from "act" plus i. "act" itself needs a start word of length 2 that does not exist here.' },
          { in: 'startWords = ["ab","a"], targetWords = ["abc","abcd"]', out: "1", note: '"abc" comes from "ab" plus c; "abcd" would need a three-letter start word.' },
          { in: 'startWords = ["kai"], targetWords = ["kair","ikar","xyz"]', out: "2" },
        ],
        ["1 <= startWords.length, targetWords.length <= 5000", "1 <= word length <= 26", "Each word has all distinct lowercase letters."]),
      hints: [
        "Rearranging means order is irrelevant — only the *set* of letters matters.",
        "A set of distinct lowercase letters fits in a 26-bit integer.",
        "For each target, remove one letter at a time and ask whether the remaining set is a start word.",
      ],
      editorial: explain({
        idea: "Since letters are distinct and order does not matter, each word is exactly a 26-bit set. 'Append one letter' becomes 'the target's mask with one bit cleared is a start word's mask'.",
        steps: [
          "Convert every start word to a bitmask and store the masks in a set.",
          "For each target word, compute its mask `m`.",
          "For each bit `b` set in `m`, check whether `m ^ (1 << b)` is in the set; one hit means the target is obtainable.",
        ],
        why: "Clearing bit `b` from the target's mask is precisely the letter-set of the start word that would have had `b` appended. Because all letters are distinct, the mask determines the multiset of letters uniquely, so mask equality is the same as being an anagram.",
        time: "O(26 · (S + T))",
        space: "O(S)",
        pitfalls: [
          "Comparing sorted strings instead of masks also works but is slower and easier to get wrong on lengths.",
          "Iterating over all 26 bits rather than only the bits set in `m` would test removing a letter the target does not have.",
          "Counting a target more than once if several removals hit — break after the first success.",
        ],
      }),
      examples: [
        { input: '["ant","act","tack"]\n["tack","act","acti"]', expectedOutput: "2" },
        { input: '["ab","a"]\n["abc","abcd"]', expectedOutput: "1" },
        { input: '["kai"]\n["kair","ikar","xyz"]', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcdefgh";
        const distinct = () => {
          const letters = shuffle(rng, alphabet.split("")).slice(0, ri(rng, 1, 5));
          return letters.join("");
        };
        const startWords = Array.from({ length: ri(rng, 1, 8) }, distinct);
        const targetWords = Array.from({ length: ri(rng, 1, 8) }, () => {
          if (rng() < 0.55) {
            const base = startWords[ri(rng, 0, startWords.length - 1)];
            const missing = alphabet.split("").filter((c) => base.indexOf(c) < 0);
            if (missing.length === 0) return base;
            return shuffle(rng, (base + pick(rng, missing)).split("")).join("");
          }
          return distinct();
        });
        return { input: `${fmtStrArr(startWords)}\n${fmtStrArr(targetWords)}`, expectedOutput: String(ref(startWords, targetWords)) };
      },
      solutions: {
        python: `from typing import List\n\ndef wordCount(startWords: List[str], targetWords: List[str]) -> int:\n    def mask(w: str) -> int:\n        m = 0\n        for c in w:\n            m |= 1 << (ord(c) - 97)\n        return m\n    have = set(mask(w) for w in startWords)\n    total = 0\n    for t in targetWords:\n        m = mask(t)\n        for b in range(26):\n            if (m >> b) & 1 and (m ^ (1 << b)) in have:\n                total += 1\n                break\n    return total`,
        javascript: `var wordCount = function(startWords, targetWords) {\n    var mask = function(w) {\n        var m = 0;\n        for (var i = 0; i < w.length; i++) m |= 1 << (w.charCodeAt(i) - 97);\n        return m;\n    };\n    var have = {};\n    for (var s = 0; s < startWords.length; s++) have[String(mask(startWords[s]))] = true;\n    var total = 0;\n    for (var t = 0; t < targetWords.length; t++) {\n        var m = mask(targetWords[t]);\n        for (var b = 0; b < 26; b++) {\n            if ((m & (1 << b)) !== 0 && have[String(m ^ (1 << b))] === true) { total++; break; }\n        }\n    }\n    return total;\n};`,
        typescript: `function wordCount(startWords: string[], targetWords: string[]): number {\n    var mask = function(w: string): number {\n        var m = 0;\n        for (var i = 0; i < w.length; i++) m |= 1 << (w.charCodeAt(i) - 97);\n        return m;\n    };\n    var have: { [key: string]: boolean } = {};\n    for (var s = 0; s < startWords.length; s++) have[String(mask(startWords[s]))] = true;\n    var total = 0;\n    for (var t = 0; t < targetWords.length; t++) {\n        var m = mask(targetWords[t]);\n        for (var b = 0; b < 26; b++) {\n            if ((m & (1 << b)) !== 0 && have[String(m ^ (1 << b))] === true) { total++; break; }\n        }\n    }\n    return total;\n}`,
        java: `public static int wordCount(String[] startWords, String[] targetWords) {\n    Set<Integer> have = new HashSet<>();\n    for (String w : startWords) {\n        int m = 0;\n        for (int i = 0; i < w.length(); i++) m |= 1 << (w.charAt(i) - 'a');\n        have.add(m);\n    }\n    int total = 0;\n    for (String t : targetWords) {\n        int m = 0;\n        for (int i = 0; i < t.length(); i++) m |= 1 << (t.charAt(i) - 'a');\n        for (int b = 0; b < 26; b++) {\n            if ((m & (1 << b)) != 0 && have.contains(m ^ (1 << b))) { total++; break; }\n        }\n    }\n    return total;\n}`,
        cpp: `int wordCount(vector<string>& startWords, vector<string>& targetWords) {\n    unordered_set<int> have;\n    for (const string& w : startWords) {\n        int m = 0;\n        for (char c : w) m |= 1 << (c - 'a');\n        have.insert(m);\n    }\n    int total = 0;\n    for (const string& t : targetWords) {\n        int m = 0;\n        for (char c : t) m |= 1 << (c - 'a');\n        for (int b = 0; b < 26; b++) {\n            if ((m & (1 << b)) && have.count(m ^ (1 << b))) { total++; break; }\n        }\n    }\n    return total;\n}`,
        c: `int wordCount(char** startWords, int startWordsSize, char** targetWords, int targetWordsSize) {\n    int* masks = (int*) malloc((size_t) startWordsSize * sizeof(int));\n    for (int i = 0; i < startWordsSize; i++) {\n        int m = 0;\n        for (int j = 0; startWords[i][j]; j++) m |= 1 << (startWords[i][j] - 'a');\n        masks[i] = m;\n    }\n    int total = 0;\n    for (int t = 0; t < targetWordsSize; t++) {\n        int m = 0;\n        for (int j = 0; targetWords[t][j]; j++) m |= 1 << (targetWords[t][j] - 'a');\n        int found = 0;\n        for (int b = 0; b < 26 && !found; b++) {\n            if (!(m & (1 << b))) continue;\n            int want = m ^ (1 << b);\n            for (int i = 0; i < startWordsSize; i++) {\n                if (masks[i] == want) { found = 1; break; }\n            }\n        }\n        if (found) total++;\n    }\n    free(masks);\n    return total;\n}`,
        csharp: `public static int WordCount(string[] startWords, string[] targetWords)\n{\n    var have = new HashSet<int>();\n    foreach (string w in startWords)\n    {\n        int m = 0;\n        foreach (char c in w) m |= 1 << (c - 'a');\n        have.Add(m);\n    }\n    int total = 0;\n    foreach (string t in targetWords)\n    {\n        int m = 0;\n        foreach (char c in t) m |= 1 << (c - 'a');\n        for (int b = 0; b < 26; b++)\n        {\n            if ((m & (1 << b)) != 0 && have.Contains(m ^ (1 << b))) { total++; break; }\n        }\n    }\n    return total;\n}`,
        go: `func wordCount(startWords []string, targetWords []string) int {\n\thave := map[int]bool{}\n\tfor _, w := range startWords {\n\t\tm := 0\n\t\tfor i := 0; i < len(w); i++ {\n\t\t\tm |= 1 << uint(w[i]-\'a\')\n\t\t}\n\t\thave[m] = true\n\t}\n\ttotal := 0\n\tfor _, t := range targetWords {\n\t\tm := 0\n\t\tfor i := 0; i < len(t); i++ {\n\t\t\tm |= 1 << uint(t[i]-\'a\')\n\t\t}\n\t\tfor b := 0; b < 26; b++ {\n\t\t\tif m&(1<<uint(b)) != 0 && have[m^(1<<uint(b))] {\n\t\t\t\ttotal++\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun wordCount(startWords: Array<String>, targetWords: Array<String>): Int {\n    val have = HashSet<Int>()\n    for (w in startWords) {\n        var m = 0\n        for (c in w) m = m or (1 shl (c - \'a\'))\n        have.add(m)\n    }\n    var total = 0\n    for (t in targetWords) {\n        var m = 0\n        for (c in t) m = m or (1 shl (c - \'a\'))\n        for (b in 0 until 26) {\n            if (m and (1 shl b) != 0 && have.contains(m xor (1 shl b))) {\n                total++\n                break\n            }\n        }\n    }\n    return total\n}`,
        swift: `func wordCount(_ startWords: [String], _ targetWords: [String]) -> Int {\n    func mask(_ w: String) -> Int {\n        var m = 0\n        for c in w.utf8 { m |= 1 << (Int(c) - 97) }\n        return m\n    }\n    var have = Set<Int>()\n    for w in startWords { have.insert(mask(w)) }\n    var total = 0\n    for t in targetWords {\n        let m = mask(t)\n        for b in 0..<26 {\n            if m & (1 << b) != 0 && have.contains(m ^ (1 << b)) {\n                total += 1\n                break\n            }\n        }\n    }\n    return total\n}`,
        rust: `fn wordCount(startWords: Vec<String>, targetWords: Vec<String>) -> i32 {\n    fn mask(w: &str) -> i32 {\n        let mut m = 0i32;\n        for &c in w.as_bytes() {\n            m |= 1 << (c - b\'a\');\n        }\n        m\n    }\n    let have: std::collections::HashSet<i32> = startWords.iter().map(|w| mask(w)).collect();\n    let mut total = 0;\n    for t in targetWords.iter() {\n        let m = mask(t);\n        for b in 0..26 {\n            if m & (1 << b) != 0 && have.contains(&(m ^ (1 << b))) {\n                total += 1;\n                break;\n            }\n        }\n    }\n    total\n}`,
        php: `function wordCount($startWords, $targetWords) {\n    $have = array();\n    foreach ($startWords as $w) {\n        $m = 0;\n        for ($i = 0; $i < strlen($w); $i++) $m |= 1 << (ord($w[$i]) - 97);\n        $have[$m] = true;\n    }\n    $total = 0;\n    foreach ($targetWords as $t) {\n        $m = 0;\n        for ($i = 0; $i < strlen($t); $i++) $m |= 1 << (ord($t[$i]) - 97);\n        for ($b = 0; $b < 26; $b++) {\n            if (($m & (1 << $b)) !== 0 && isset($have[$m ^ (1 << $b)])) { $total++; break; }\n        }\n    }\n    return $total;\n}`,
        ruby: `def wordCount(startWords, targetWords)\n  mask = lambda do |w|\n    m = 0\n    w.each_byte { |c| m |= 1 << (c - 97) }\n    m\n  end\n  have = {}\n  startWords.each { |w| have[mask.call(w)] = true }\n  total = 0\n  targetWords.each do |t|\n    m = mask.call(t)\n    (0...26).each do |b|\n      if m & (1 << b) != 0 && have[m ^ (1 << b)]\n        total += 1\n        break\n      end\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Maximum Length of a Concatenated String With Unique Characters (LC 1239) ──
  (() => {
    const ref = (arr: string[]) => {
      const masks: number[] = [];
      for (const w of arr) {
        let m = 0, ok = true;
        for (let i = 0; i < w.length; i++) {
          const b = 1 << (w.charCodeAt(i) - 97);
          if ((m & b) !== 0) { ok = false; break; }
          m |= b;
        }
        if (ok) masks.push(m);
      }
      let best = 0;
      const seen: number[] = [0];
      for (const m of masks) {
        const add: number[] = [];
        for (const cur of seen) {
          if ((cur & m) !== 0) continue;
          const next = cur | m;
          add.push(next);
          let bits = 0, x = next;
          while (x > 0) { bits += x & 1; x >>= 1; }
          if (bits > best) best = bits;
        }
        for (const v of add) seen.push(v);
      }
      return best;
    };
    return {
      slug: "maximum-length-of-a-concatenated-string-with-unique-characters",
      title: "Maximum Length of a Concatenated String With Unique Characters",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Bit Manipulation", "Backtracking", "Google", "Amazon", "Adobe"],
      signature: { funcName: "maxLength", params: [{ name: "arr", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "You may pick any subsequence of `arr` and concatenate the chosen strings. The concatenation is **valid** only if every character in it is unique.\n\nReturn the maximum possible length of a valid concatenation. The empty selection is valid and has length `0`.",
        [
          { in: 'arr = ["code","kai","ro"]', out: "7", note: '"code" + "kai" gives 7 distinct characters; "ro" cannot join them because "code" already uses o.' },
          { in: 'arr = ["un","iq","ue"]', out: "4", note: '"un" + "iq" or "iq" + "ue" reach 4; all three repeat u.' },
          { in: 'arr = ["aa","bb"]', out: "0", note: 'Each word already repeats a character, so nothing can be used.' },
        ],
        ["1 <= arr.length <= 16", "1 <= arr[i].length <= 26", "arr[i] consists of lowercase English letters."]),
      hints: [
        "A word with a repeated letter can never be used — filter those out first.",
        "Represent each surviving word as a 26-bit letter mask; two words are compatible when their masks do not overlap.",
        "Build up the set of reachable masks one word at a time; the answer is the largest popcount among them.",
      ],
      editorial: explain({
        idea: "Each usable word is a set of letters, and a valid concatenation is a union of pairwise disjoint sets. Masks turn 'disjoint' into `a & b == 0` and 'union' into `a | b`, so the whole search is bit arithmetic.",
        steps: [
          "Drop any word that repeats a letter — detect it while building its mask.",
          "Keep a list of reachable masks, starting with just `0`.",
          "For each word mask `m`, extend every reachable mask that does not overlap `m` and record the new mask.",
          "Track the largest popcount seen; that is the answer.",
        ],
        why: "Every subset of compatible words is reachable, because the words are processed in order and each reachable mask records one valid selection from the words seen so far. Popcount equals total length precisely because all letters are distinct.",
        time: "O(2^n) in the worst case, with n at most 16",
        space: "O(2^n)",
        pitfalls: [
          "Forgetting to reject self-repeating words lets `\"aa\"` contribute a mask of one bit and a length of two.",
          "Extending the reachable list while iterating it re-uses a word twice — collect the new masks first, then append.",
        ],
      }),
      examples: [
        { input: '["code","kai","ro"]', expectedOutput: "7" },
        { input: '["un","iq","ue"]', expectedOutput: "4" },
        { input: '["aa","bb"]', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcdefgh";
        const arr = Array.from({ length: ri(rng, 1, 8) }, () => {
          if (rng() < 0.25) {
            const c = pick(rng, alphabet.split(""));
            return c + c;
          }
          return shuffle(rng, alphabet.split("")).slice(0, ri(rng, 1, 3)).join("");
        });
        return { input: fmtStrArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxLength(arr: List[str]) -> int:\n    masks = []\n    for w in arr:\n        m = 0\n        ok = True\n        for c in w:\n            b = 1 << (ord(c) - 97)\n            if m & b:\n                ok = False\n                break\n            m |= b\n        if ok:\n            masks.append(m)\n    seen = [0]\n    best = 0\n    for m in masks:\n        add = []\n        for cur in seen:\n            if cur & m:\n                continue\n            nxt = cur | m\n            add.append(nxt)\n            best = max(best, bin(nxt).count("1"))\n        seen.extend(add)\n    return best`,
        javascript: `var maxLength = function(arr) {\n    var masks = [];\n    for (var t = 0; t < arr.length; t++) {\n        var w = arr[t], m = 0, ok = true;\n        for (var i = 0; i < w.length; i++) {\n            var b = 1 << (w.charCodeAt(i) - 97);\n            if ((m & b) !== 0) { ok = false; break; }\n            m |= b;\n        }\n        if (ok) masks.push(m);\n    }\n    var seen = [0], best = 0;\n    for (var k = 0; k < masks.length; k++) {\n        var add = [];\n        for (var j = 0; j < seen.length; j++) {\n            if ((seen[j] & masks[k]) !== 0) continue;\n            var next = seen[j] | masks[k];\n            add.push(next);\n            var bits = 0, x = next;\n            while (x > 0) { bits += x & 1; x >>= 1; }\n            if (bits > best) best = bits;\n        }\n        for (var a = 0; a < add.length; a++) seen.push(add[a]);\n    }\n    return best;\n};`,
        typescript: `function maxLength(arr: string[]): number {\n    var masks: number[] = [];\n    for (var t = 0; t < arr.length; t++) {\n        var w = arr[t], m = 0, ok = true;\n        for (var i = 0; i < w.length; i++) {\n            var b = 1 << (w.charCodeAt(i) - 97);\n            if ((m & b) !== 0) { ok = false; break; }\n            m |= b;\n        }\n        if (ok) masks.push(m);\n    }\n    var seen: number[] = [0], best = 0;\n    for (var k = 0; k < masks.length; k++) {\n        var add: number[] = [];\n        for (var j = 0; j < seen.length; j++) {\n            if ((seen[j] & masks[k]) !== 0) continue;\n            var next = seen[j] | masks[k];\n            add.push(next);\n            var bits = 0, x = next;\n            while (x > 0) { bits += x & 1; x >>= 1; }\n            if (bits > best) best = bits;\n        }\n        for (var a = 0; a < add.length; a++) seen.push(add[a]);\n    }\n    return best;\n}`,
        java: `public static int maxLength(String[] arr) {\n    List<Integer> masks = new ArrayList<>();\n    for (String w : arr) {\n        int m = 0;\n        boolean ok = true;\n        for (int i = 0; i < w.length(); i++) {\n            int b = 1 << (w.charAt(i) - 'a');\n            if ((m & b) != 0) { ok = false; break; }\n            m |= b;\n        }\n        if (ok) masks.add(m);\n    }\n    List<Integer> seen = new ArrayList<>();\n    seen.add(0);\n    int best = 0;\n    for (int m : masks) {\n        List<Integer> add = new ArrayList<>();\n        for (int cur : seen) {\n            if ((cur & m) != 0) continue;\n            int next = cur | m;\n            add.add(next);\n            best = Math.max(best, Integer.bitCount(next));\n        }\n        seen.addAll(add);\n    }\n    return best;\n}`,
        cpp: `int maxLength(vector<string>& arr) {\n    vector<int> masks;\n    for (const string& w : arr) {\n        int m = 0;\n        bool ok = true;\n        for (char c : w) {\n            int b = 1 << (c - 'a');\n            if (m & b) { ok = false; break; }\n            m |= b;\n        }\n        if (ok) masks.push_back(m);\n    }\n    vector<int> seen = { 0 };\n    int best = 0;\n    for (int m : masks) {\n        vector<int> add;\n        for (int cur : seen) {\n            if (cur & m) continue;\n            int next = cur | m;\n            add.push_back(next);\n            best = max(best, __builtin_popcount((unsigned) next));\n        }\n        for (int v : add) seen.push_back(v);\n    }\n    return best;\n}`,
        c: `int maxLength(char** arr, int arrSize) {\n    int* masks = (int*) malloc((size_t) arrSize * sizeof(int));\n    int mc = 0;\n    for (int t = 0; t < arrSize; t++) {\n        int m = 0, ok = 1;\n        for (int i = 0; arr[t][i]; i++) {\n            int b = 1 << (arr[t][i] - 'a');\n            if (m & b) { ok = 0; break; }\n            m |= b;\n        }\n        if (ok) masks[mc++] = m;\n    }\n    int cap = 1 << (mc + 1);\n    int* seen = (int*) malloc((size_t) (cap > 2 ? cap : 2) * sizeof(int));\n    int sc = 1;\n    seen[0] = 0;\n    int best = 0;\n    for (int k = 0; k < mc; k++) {\n        int start = sc;\n        for (int j = 0; j < start; j++) {\n            if (seen[j] & masks[k]) continue;\n            int next = seen[j] | masks[k];\n            seen[sc++] = next;\n            int bits = 0, x = next;\n            while (x > 0) { bits += x & 1; x >>= 1; }\n            if (bits > best) best = bits;\n        }\n    }\n    free(masks);\n    free(seen);\n    return best;\n}`,
        csharp: `public static int MaxLength(string[] arr)\n{\n    var masks = new List<int>();\n    foreach (string w in arr)\n    {\n        int m = 0;\n        bool ok = true;\n        foreach (char c in w)\n        {\n            int b = 1 << (c - 'a');\n            if ((m & b) != 0) { ok = false; break; }\n            m |= b;\n        }\n        if (ok) masks.Add(m);\n    }\n    var seen = new List<int> { 0 };\n    int best = 0;\n    foreach (int m in masks)\n    {\n        var add = new List<int>();\n        foreach (int cur in seen)\n        {\n            if ((cur & m) != 0) continue;\n            int next = cur | m;\n            add.Add(next);\n            int bits = 0, x = next;\n            while (x > 0) { bits += x & 1; x >>= 1; }\n            if (bits > best) best = bits;\n        }\n        seen.AddRange(add);\n    }\n    return best;\n}`,
        go: `func maxLength(arr []string) int {\n\tmasks := []int{}\n\tfor _, w := range arr {\n\t\tm, ok := 0, true\n\t\tfor i := 0; i < len(w); i++ {\n\t\t\tb := 1 << uint(w[i]-\'a\')\n\t\t\tif m&b != 0 {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t\tm |= b\n\t\t}\n\t\tif ok {\n\t\t\tmasks = append(masks, m)\n\t\t}\n\t}\n\tseen := []int{0}\n\tbest := 0\n\tfor _, m := range masks {\n\t\tadd := []int{}\n\t\tfor _, cur := range seen {\n\t\t\tif cur&m != 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tnext := cur | m\n\t\t\tadd = append(add, next)\n\t\t\tif bits.OnesCount(uint(next)) > best {\n\t\t\t\tbest = bits.OnesCount(uint(next))\n\t\t\t}\n\t\t}\n\t\tseen = append(seen, add...)\n\t}\n\treturn best\n}`,
        kotlin: `fun maxLength(arr: Array<String>): Int {\n    val masks = ArrayList<Int>()\n    for (w in arr) {\n        var m = 0\n        var ok = true\n        for (c in w) {\n            val b = 1 shl (c - \'a\')\n            if (m and b != 0) {\n                ok = false\n                break\n            }\n            m = m or b\n        }\n        if (ok) masks.add(m)\n    }\n    val seen = ArrayList<Int>()\n    seen.add(0)\n    var best = 0\n    for (m in masks) {\n        val add = ArrayList<Int>()\n        for (cur in seen) {\n            if (cur and m != 0) continue\n            val next = cur or m\n            add.add(next)\n            best = maxOf(best, Integer.bitCount(next))\n        }\n        seen.addAll(add)\n    }\n    return best\n}`,
        swift: `func maxLength(_ arr: [String]) -> Int {\n    var masks: [Int] = []\n    for w in arr {\n        var m = 0\n        var ok = true\n        for c in w.utf8 {\n            let b = 1 << (Int(c) - 97)\n            if m & b != 0 {\n                ok = false\n                break\n            }\n            m |= b\n        }\n        if ok { masks.append(m) }\n    }\n    var seen: [Int] = [0]\n    var best = 0\n    for m in masks {\n        var add: [Int] = []\n        for cur in seen {\n            if cur & m != 0 { continue }\n            let next = cur | m\n            add.append(next)\n            best = max(best, next.nonzeroBitCount)\n        }\n        seen.append(contentsOf: add)\n    }\n    return best\n}`,
        rust: `fn maxLength(arr: Vec<String>) -> i32 {\n    let mut masks: Vec<i32> = Vec::new();\n    for w in arr.iter() {\n        let mut m = 0i32;\n        let mut ok = true;\n        for &c in w.as_bytes() {\n            let b = 1i32 << (c - b\'a\');\n            if m & b != 0 {\n                ok = false;\n                break;\n            }\n            m |= b;\n        }\n        if ok {\n            masks.push(m);\n        }\n    }\n    let mut seen: Vec<i32> = vec![0];\n    let mut best = 0i32;\n    for &m in masks.iter() {\n        let mut add: Vec<i32> = Vec::new();\n        for &cur in seen.iter() {\n            if cur & m != 0 {\n                continue;\n            }\n            let next = cur | m;\n            add.push(next);\n            let bits = (next as u32).count_ones() as i32;\n            if bits > best {\n                best = bits;\n            }\n        }\n        seen.extend(add);\n    }\n    best\n}`,
        php: `function maxLength($arr) {\n    $masks = array();\n    foreach ($arr as $w) {\n        $m = 0;\n        $ok = true;\n        for ($i = 0; $i < strlen($w); $i++) {\n            $b = 1 << (ord($w[$i]) - 97);\n            if ($m & $b) { $ok = false; break; }\n            $m |= $b;\n        }\n        if ($ok) $masks[] = $m;\n    }\n    $seen = array(0);\n    $best = 0;\n    foreach ($masks as $m) {\n        $add = array();\n        foreach ($seen as $cur) {\n            if ($cur & $m) continue;\n            $next = $cur | $m;\n            $add[] = $next;\n            $bits = 0;\n            $x = $next;\n            while ($x > 0) { $bits += $x & 1; $x >>= 1; }\n            if ($bits > $best) $best = $bits;\n        }\n        foreach ($add as $v) $seen[] = $v;\n    }\n    return $best;\n}`,
        ruby: `def maxLength(arr)\n  masks = []\n  arr.each do |w|\n    m = 0\n    ok = true\n    w.each_byte do |c|\n      b = 1 << (c - 97)\n      if m & b != 0\n        ok = false\n        break\n      end\n      m |= b\n    end\n    masks << m if ok\n  end\n  seen = [0]\n  best = 0\n  masks.each do |m|\n    add = []\n    seen.each do |cur|\n      next if cur & m != 0\n      nxt = cur | m\n      add << nxt\n      bits = nxt.to_s(2).count("1")\n      best = bits if bits > best\n    end\n    seen.concat(add)\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Count Substrings That Differ by One Character (LC 1638) ─────
  (() => {
    const ref = (s: string, t: string) => {
      let total = 0;
      for (let i = 0; i < s.length; i++) {
        for (let j = 0; j < t.length; j++) {
          let diff = 0;
          for (let k = 0; i + k < s.length && j + k < t.length; k++) {
            if (s.charAt(i + k) !== t.charAt(j + k)) diff++;
            if (diff > 1) break;
            if (diff === 1) total++;
          }
        }
      }
      return total;
    };
    return {
      slug: "count-substrings-that-differ-by-one-character",
      title: "Count Substrings That Differ by One Character",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Google", "Uber"],
      signature: { funcName: "countSubstrings", params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given strings `s` and `t`, count the pairs (substring of `s`, substring of `t`) of equal length that differ in **exactly one** character position.\n\nSubstrings at different positions count separately even when the text is identical.",
        [
          { in: 's = "aba", t = "baba"', out: "6", note: 'The qualifying pairs are ("a","b") twice over, ("ab","ba"), ("ba","ab"), ("aba","bab") and ("b","a").' },
          { in: 's = "ab", t = "bb"', out: "3", note: '("a","b"), ("ab","bb") and ("a","b") from the other alignment.' },
          { in: 's = "a", t = "a"', out: "0", note: "Identical characters differ in zero positions, not one." },
        ],
        ["1 <= s.length, t.length <= 100", "s and t consist of lowercase English letters."]),
      hints: [
        "Fix the alignment: a starting index in `s` and one in `t`.",
        "Walk forward from that pair of starts, counting mismatches as you extend.",
        "Every prefix of the walk with exactly one mismatch is a qualifying pair; stop the walk once the count reaches two.",
      ],
      editorial: explain({
        idea: "A qualifying pair is determined by where the two substrings start and how far they extend. Fixing the two starts turns the question into a single forward scan that counts mismatches.",
        steps: [
          "For every start `i` in `s` and every start `j` in `t`, set `diff = 0`.",
          "Extend `k` while both strings still have characters, incrementing `diff` on a mismatch.",
          "Break out as soon as `diff` exceeds 1 — no longer extension can come back down.",
          "Whenever `diff` is exactly 1, the current extension is a valid pair, so count it.",
        ],
        why: "Mismatches only accumulate as the window grows, so for a fixed pair of starts the valid lengths form one contiguous run — the stretch between the first and second mismatch. Counting inside the walk enumerates exactly that run.",
        time: "O(n · m · min(n, m))",
        space: "O(1)",
        pitfalls: [
          "Breaking out at `diff == 1` stops too early; the run of valid lengths continues until the *second* mismatch.",
          "Counting when `diff == 0` includes identical substrings, which the statement excludes.",
        ],
      }),
      examples: [
        { input: '"aba"\n"baba"', expectedOutput: "6" },
        { input: '"ab"\n"bb"', expectedOutput: "3" },
        { input: '"a"\n"a"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.6 ? "ab" : "abcd";
        const s = randLower(rng, 1, 18, alphabet);
        const t = randLower(rng, 1, 18, alphabet);
        return { input: `"${s}"\n"${t}"`, expectedOutput: String(ref(s, t)) };
      },
      solutions: {
        python: `def countSubstrings(s: str, t: str) -> int:\n    total = 0\n    for i in range(len(s)):\n        for j in range(len(t)):\n            diff = 0\n            k = 0\n            while i + k < len(s) and j + k < len(t):\n                if s[i + k] != t[j + k]:\n                    diff += 1\n                if diff > 1:\n                    break\n                if diff == 1:\n                    total += 1\n                k += 1\n    return total`,
        javascript: `var countSubstrings = function(s, t) {\n    var total = 0;\n    for (var i = 0; i < s.length; i++) {\n        for (var j = 0; j < t.length; j++) {\n            var diff = 0;\n            for (var k = 0; i + k < s.length && j + k < t.length; k++) {\n                if (s.charAt(i + k) !== t.charAt(j + k)) diff++;\n                if (diff > 1) break;\n                if (diff === 1) total++;\n            }\n        }\n    }\n    return total;\n};`,
        typescript: `function countSubstrings(s: string, t: string): number {\n    var total = 0;\n    for (var i = 0; i < s.length; i++) {\n        for (var j = 0; j < t.length; j++) {\n            var diff = 0;\n            for (var k = 0; i + k < s.length && j + k < t.length; k++) {\n                if (s.charAt(i + k) !== t.charAt(j + k)) diff++;\n                if (diff > 1) break;\n                if (diff === 1) total++;\n            }\n        }\n    }\n    return total;\n}`,
        java: `public static int countSubstrings(String s, String t) {\n    int total = 0;\n    for (int i = 0; i < s.length(); i++) {\n        for (int j = 0; j < t.length(); j++) {\n            int diff = 0;\n            for (int k = 0; i + k < s.length() && j + k < t.length(); k++) {\n                if (s.charAt(i + k) != t.charAt(j + k)) diff++;\n                if (diff > 1) break;\n                if (diff == 1) total++;\n            }\n        }\n    }\n    return total;\n}`,
        cpp: `int countSubstrings(string s, string t) {\n    int total = 0;\n    int n = (int) s.size(), m = (int) t.size();\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < m; j++) {\n            int diff = 0;\n            for (int k = 0; i + k < n && j + k < m; k++) {\n                if (s[i + k] != t[j + k]) diff++;\n                if (diff > 1) break;\n                if (diff == 1) total++;\n            }\n        }\n    }\n    return total;\n}`,
        c: `int countSubstrings(char* s, char* t) {\n    int n = (int) strlen(s), m = (int) strlen(t);\n    int total = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < m; j++) {\n            int diff = 0;\n            for (int k = 0; i + k < n && j + k < m; k++) {\n                if (s[i + k] != t[j + k]) diff++;\n                if (diff > 1) break;\n                if (diff == 1) total++;\n            }\n        }\n    }\n    return total;\n}`,
        csharp: `public static int CountSubstrings(string s, string t)\n{\n    int total = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        for (int j = 0; j < t.Length; j++)\n        {\n            int diff = 0;\n            for (int k = 0; i + k < s.Length && j + k < t.Length; k++)\n            {\n                if (s[i + k] != t[j + k]) diff++;\n                if (diff > 1) break;\n                if (diff == 1) total++;\n            }\n        }\n    }\n    return total;\n}`,
        go: `func countSubstrings(s string, t string) int {\n\ttotal := 0\n\tfor i := 0; i < len(s); i++ {\n\t\tfor j := 0; j < len(t); j++ {\n\t\t\tdiff := 0\n\t\t\tfor k := 0; i+k < len(s) && j+k < len(t); k++ {\n\t\t\t\tif s[i+k] != t[j+k] {\n\t\t\t\t\tdiff++\n\t\t\t\t}\n\t\t\t\tif diff > 1 {\n\t\t\t\t\tbreak\n\t\t\t\t}\n\t\t\t\tif diff == 1 {\n\t\t\t\t\ttotal++\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun countSubstrings(s: String, t: String): Int {\n    var total = 0\n    for (i in s.indices) {\n        for (j in t.indices) {\n            var diff = 0\n            var k = 0\n            while (i + k < s.length && j + k < t.length) {\n                if (s[i + k] != t[j + k]) diff++\n                if (diff > 1) break\n                if (diff == 1) total++\n                k++\n            }\n        }\n    }\n    return total\n}`,
        swift: `func countSubstrings(_ s: String, _ t: String) -> Int {\n    let a = Array(s)\n    let b = Array(t)\n    var total = 0\n    for i in 0..<a.count {\n        for j in 0..<b.count {\n            var diff = 0\n            var k = 0\n            while i + k < a.count && j + k < b.count {\n                if a[i + k] != b[j + k] { diff += 1 }\n                if diff > 1 { break }\n                if diff == 1 { total += 1 }\n                k += 1\n            }\n        }\n    }\n    return total\n}`,
        rust: `fn countSubstrings(s: String, t: String) -> i32 {\n    let a = s.as_bytes();\n    let b = t.as_bytes();\n    let mut total = 0;\n    for i in 0..a.len() {\n        for j in 0..b.len() {\n            let mut diff = 0;\n            let mut k = 0usize;\n            while i + k < a.len() && j + k < b.len() {\n                if a[i + k] != b[j + k] {\n                    diff += 1;\n                }\n                if diff > 1 {\n                    break;\n                }\n                if diff == 1 {\n                    total += 1;\n                }\n                k += 1;\n            }\n        }\n    }\n    total\n}`,
        php: `function countSubstrings($s, $t) {\n    $n = strlen($s);\n    $m = strlen($t);\n    $total = 0;\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = 0; $j < $m; $j++) {\n            $diff = 0;\n            for ($k = 0; $i + $k < $n && $j + $k < $m; $k++) {\n                if ($s[$i + $k] !== $t[$j + $k]) $diff++;\n                if ($diff > 1) break;\n                if ($diff === 1) $total++;\n            }\n        }\n    }\n    return $total;\n}`,
        ruby: `def countSubstrings(s, t)\n  total = 0\n  (0...s.length).each do |i|\n    (0...t.length).each do |j|\n      diff = 0\n      k = 0\n      while i + k < s.length && j + k < t.length\n        diff += 1 if s[i + k] != t[j + k]\n        break if diff > 1\n        total += 1 if diff == 1\n        k += 1\n      end\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Check If a String Can Break Another String (LC 1433) ────────
  (() => {
    const ref = (s1: string, s2: string) => {
      const a = s1.split("").sort();
      const b = s2.split("").sort();
      let aWins = true, bWins = true;
      for (let i = 0; i < a.length; i++) {
        if (a[i] < b[i]) aWins = false;
        if (b[i] < a[i]) bWins = false;
      }
      return aWins || bWins;
    };
    return {
      slug: "check-if-a-string-can-break-another-string",
      title: "Check If a String Can Break Another String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Sorting", "Amazon", "Adobe", "Flipkart"],
      signature: { funcName: "checkIfCanBreak", params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A string `x` can **break** a string `y` if some permutation of `x` is at least as large as some permutation of `y` at **every** position.\n\nGiven two strings `s1` and `s2` of equal length, return `true` if either can break the other.",
        [
          { in: 's1 = "abc", s2 = "xya"', out: "true", note: 'The permutation "ayx" of s2 beats "abc" at every position.' },
          { in: 's1 = "abe", s2 = "acd"', out: "false", note: "Neither ordering dominates the other everywhere." },
          { in: 's1 = "leetcodee", s2 = "interview"', out: "true" },
        ],
        ["s1.length == s2.length", "1 <= s1.length <= 100000", "Both strings consist of lowercase English letters."]),
      hints: [
        "Permutations are free, so only the multiset of letters matters.",
        "Sorting both strings pairs the smallest with the smallest, the second smallest with the second smallest, and so on.",
        "If one string dominates at all, it dominates under that sorted pairing.",
      ],
      editorial: explain({
        idea: "Sort both strings and compare position by position. The sorted pairing is the best case for domination: if it fails there, no permutation can succeed.",
        steps: [
          "Sort the characters of both strings ascending.",
          "Sweep once, tracking two flags: `aWins` (no position where `a[i] < b[i]`) and `bWins` (no position where `b[i] < a[i]`).",
          "Return `aWins || bWins`.",
        ],
        why: "Suppose some pairing has `x` dominating `y`. Sorting both and pairing in order can only improve each comparison — by an exchange argument, swapping any out-of-order pair never turns a win into a loss. So the sorted comparison is a complete test.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Testing only one direction — the statement allows either string to be the breaker.",
          "Bailing out of the loop on the first `a[i] < b[i]` loses the chance to discover that `b` breaks `a`; track both flags in one pass instead.",
        ],
      }),
      examples: [
        { input: '"abc"\n"xya"', expectedOutput: "true" },
        { input: '"abe"\n"acd"', expectedOutput: "false" },
        { input: '"leetcodee"\n"interview"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const alphabet = rng() < 0.5 ? "abc" : "abcdefghij";
        const s1 = randLower(rng, n, n, alphabet);
        const s2 = randLower(rng, n, n, alphabet);
        return { input: `"${s1}"\n"${s2}"`, expectedOutput: bool(ref(s1, s2)) };
      },
      solutions: {
        python: `def checkIfCanBreak(s1: str, s2: str) -> bool:\n    a = sorted(s1)\n    b = sorted(s2)\n    a_wins = all(x >= y for x, y in zip(a, b))\n    b_wins = all(y >= x for x, y in zip(a, b))\n    return a_wins or b_wins`,
        javascript: `var checkIfCanBreak = function(s1, s2) {\n    var a = s1.split("").sort();\n    var b = s2.split("").sort();\n    var aWins = true, bWins = true;\n    for (var i = 0; i < a.length; i++) {\n        if (a[i] < b[i]) aWins = false;\n        if (b[i] < a[i]) bWins = false;\n    }\n    return aWins || bWins;\n};`,
        typescript: `function checkIfCanBreak(s1: string, s2: string): boolean {\n    var a = s1.split("").sort();\n    var b = s2.split("").sort();\n    var aWins = true, bWins = true;\n    for (var i = 0; i < a.length; i++) {\n        if (a[i] < b[i]) aWins = false;\n        if (b[i] < a[i]) bWins = false;\n    }\n    return aWins || bWins;\n}`,
        java: `public static boolean checkIfCanBreak(String s1, String s2) {\n    char[] a = s1.toCharArray();\n    char[] b = s2.toCharArray();\n    Arrays.sort(a);\n    Arrays.sort(b);\n    boolean aWins = true, bWins = true;\n    for (int i = 0; i < a.length; i++) {\n        if (a[i] < b[i]) aWins = false;\n        if (b[i] < a[i]) bWins = false;\n    }\n    return aWins || bWins;\n}`,
        cpp: `bool checkIfCanBreak(string s1, string s2) {\n    sort(s1.begin(), s1.end());\n    sort(s2.begin(), s2.end());\n    bool aWins = true, bWins = true;\n    for (size_t i = 0; i < s1.size(); i++) {\n        if (s1[i] < s2[i]) aWins = false;\n        if (s2[i] < s1[i]) bWins = false;\n    }\n    return aWins || bWins;\n}`,
        c: `static int cmpBreakChar(const void* a, const void* b) {\n    return (*(const char*) a) - (*(const char*) b);\n}\n\nbool checkIfCanBreak(char* s1, char* s2) {\n    int n = (int) strlen(s1);\n    char* a = (char*) malloc((size_t) n + 1);\n    char* b = (char*) malloc((size_t) n + 1);\n    strcpy(a, s1);\n    strcpy(b, s2);\n    qsort(a, (size_t) n, 1, cmpBreakChar);\n    qsort(b, (size_t) n, 1, cmpBreakChar);\n    int aWins = 1, bWins = 1;\n    for (int i = 0; i < n; i++) {\n        if (a[i] < b[i]) aWins = 0;\n        if (b[i] < a[i]) bWins = 0;\n    }\n    free(a);\n    free(b);\n    return aWins || bWins;\n}`,
        csharp: `public static bool CheckIfCanBreak(string s1, string s2)\n{\n    char[] a = s1.ToCharArray();\n    char[] b = s2.ToCharArray();\n    Array.Sort(a);\n    Array.Sort(b);\n    bool aWins = true, bWins = true;\n    for (int i = 0; i < a.Length; i++)\n    {\n        if (a[i] < b[i]) aWins = false;\n        if (b[i] < a[i]) bWins = false;\n    }\n    return aWins || bWins;\n}`,
        go: `func checkIfCanBreak(s1 string, s2 string) bool {\n\ta := []byte(s1)\n\tb := []byte(s2)\n\tsort.Slice(a, func(i, j int) bool { return a[i] < a[j] })\n\tsort.Slice(b, func(i, j int) bool { return b[i] < b[j] })\n\taWins, bWins := true, true\n\tfor i := 0; i < len(a); i++ {\n\t\tif a[i] < b[i] {\n\t\t\taWins = false\n\t\t}\n\t\tif b[i] < a[i] {\n\t\t\tbWins = false\n\t\t}\n\t}\n\treturn aWins || bWins\n}`,
        kotlin: `fun checkIfCanBreak(s1: String, s2: String): Boolean {\n    val a = s1.toCharArray()\n    val b = s2.toCharArray()\n    a.sort()\n    b.sort()\n    var aWins = true\n    var bWins = true\n    for (i in a.indices) {\n        if (a[i] < b[i]) aWins = false\n        if (b[i] < a[i]) bWins = false\n    }\n    return aWins || bWins\n}`,
        swift: `func checkIfCanBreak(_ s1: String, _ s2: String) -> Bool {\n    let a = Array(s1).sorted()\n    let b = Array(s2).sorted()\n    var aWins = true\n    var bWins = true\n    for i in 0..<a.count {\n        if a[i] < b[i] { aWins = false }\n        if b[i] < a[i] { bWins = false }\n    }\n    return aWins || bWins\n}`,
        rust: `fn checkIfCanBreak(s1: String, s2: String) -> bool {\n    let mut a: Vec<u8> = s1.into_bytes();\n    let mut b: Vec<u8> = s2.into_bytes();\n    a.sort();\n    b.sort();\n    let mut a_wins = true;\n    let mut b_wins = true;\n    for i in 0..a.len() {\n        if a[i] < b[i] {\n            a_wins = false;\n        }\n        if b[i] < a[i] {\n            b_wins = false;\n        }\n    }\n    a_wins || b_wins\n}`,
        php: `function checkIfCanBreak($s1, $s2) {\n    $a = str_split($s1);\n    $b = str_split($s2);\n    sort($a);\n    sort($b);\n    $aWins = true;\n    $bWins = true;\n    for ($i = 0; $i < count($a); $i++) {\n        if ($a[$i] < $b[$i]) $aWins = false;\n        if ($b[$i] < $a[$i]) $bWins = false;\n    }\n    return $aWins || $bWins;\n}`,
        ruby: `def checkIfCanBreak(s1, s2)\n  a = s1.chars.sort\n  b = s2.chars.sort\n  a_wins = true\n  b_wins = true\n  (0...a.length).each do |i|\n    a_wins = false if a[i] < b[i]\n    b_wins = false if b[i] < a[i]\n  end\n  a_wins || b_wins\nend`,
      },
    };
  })(),

  // ── Minimum Number of Frogs Croaking (LC 1419) ──────────────────
  (() => {
    const ref = (croakOfFrogs: string) => {
      const order = "croak";
      const count = [0, 0, 0, 0, 0];
      let active = 0, best = 0;
      for (let i = 0; i < croakOfFrogs.length; i++) {
        const idx = order.indexOf(croakOfFrogs.charAt(i));
        if (idx < 0) return -1;
        count[idx]++;
        if (idx === 0) { active++; if (active > best) best = active; }
        else {
          if (count[idx] > count[idx - 1]) return -1;
          if (idx === 4) active--;
        }
      }
      for (let i = 1; i < 5; i++) { if (count[i] !== count[0]) return -1; }
      return count[0] === 0 ? 0 : best;
    };
    return {
      slug: "minimum-number-of-frogs-croaking",
      title: "Minimum Number of Frogs Croaking",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Counting", "Amazon", "Google", "Samsung"],
      signature: { funcName: "minNumberOfFrogs", params: [{ name: "croakOfFrogs", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You hear a recording `croakOfFrogs` of several frogs croaking at once. A single croak is the letters `c`, `r`, `o`, `a`, `k` in that order, and a frog must finish one croak before starting another. Frogs may overlap freely.\n\nReturn the **minimum** number of frogs that could have produced the recording, or `-1` if it is not a valid interleaving of complete croaks.",
        [
          { in: 's = "croakcroak"', out: "1", note: "One frog croaking twice in a row." },
          { in: 's = "crcoakroak"', out: "2", note: "Two frogs overlapping." },
          { in: 's = "croakcrook"', out: "-1", note: "The second croak is misspelled." },
        ],
        ["1 <= croakOfFrogs.length <= 100000", "croakOfFrogs consists of the letters c, r, o, a and k."]),
      hints: [
        "Count how many frogs are mid-croak at each moment; the peak is the answer.",
        "A `'c'` starts a croak and a `'k'` finishes one.",
        "Validity is a prefix condition: at every moment the count of each letter must not exceed the count of the letter before it in `\"croak\"`.",
      ],
      editorial: explain({
        idea: "Track the running tally of each of the five letters. A frog is mid-croak between its `'c'` and its `'k'`, so the number of concurrent frogs is the number of `'c'`s not yet matched by a `'k'` — and the peak of that is the minimum fleet size.",
        steps: [
          "Keep `count[0..4]` for `c`, `r`, `o`, `a`, `k`.",
          "On `'c'`, increment the active count and update the peak.",
          "On any other letter at index `i`, reject if its tally would exceed the tally of letter `i - 1`; on `'k'`, decrement the active count.",
          "After the sweep, reject unless all five tallies are equal — otherwise some croak is unfinished.",
        ],
        why: "A letter appearing more often than its predecessor means some frog sang out of order, so the prefix inequality is exactly validity. Frogs can be reused the instant they finish, so the peak of concurrent croaks is both necessary (that many sounded at once) and sufficient (schedule each new `'c'` on any idle frog).",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Checking only the final tallies misses `\"crcoakroak\"`-style reorderings that go wrong mid-string.",
          "Forgetting the end-of-string equality check accepts a recording that stops mid-croak.",
          "Reporting the number of `'c'`s instead of the peak overcounts sequential croaks by the same frog.",
        ],
      }),
      examples: [
        { input: '"croakcroak"', expectedOutput: "1" },
        { input: '"crcoakroak"', expectedOutput: "2" },
        { input: '"croakcrook"', expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        if (rng() < 0.3) {
          const s = randLower(rng, 1, 20, "croak");
          return { input: `"${s}"`, expectedOutput: String(ref(s)) };
        }
        // Interleave a few complete croaks so valid recordings are common too.
        const frogs = ri(rng, 1, 4);
        const streams = Array.from({ length: frogs }, () => "croak".repeat(ri(rng, 1, 3)).split(""));
        const out: string[] = [];
        for (;;) {
          const live = streams.map((_, i) => i).filter((i) => streams[i].length > 0);
          if (live.length === 0) break;
          const pickIdx = live[ri(rng, 0, live.length - 1)];
          out.push(streams[pickIdx].shift() as string);
        }
        const s = out.join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minNumberOfFrogs(croakOfFrogs: str) -> int:\n    order = "croak"\n    count = [0] * 5\n    active = 0\n    best = 0\n    for ch in croakOfFrogs:\n        idx = order.find(ch)\n        if idx < 0:\n            return -1\n        count[idx] += 1\n        if idx == 0:\n            active += 1\n            best = max(best, active)\n        else:\n            if count[idx] > count[idx - 1]:\n                return -1\n            if idx == 4:\n                active -= 1\n    if any(count[i] != count[0] for i in range(1, 5)):\n        return -1\n    return 0 if count[0] == 0 else best`,
        javascript: `var minNumberOfFrogs = function(croakOfFrogs) {\n    var order = "croak";\n    var count = [0, 0, 0, 0, 0];\n    var active = 0, best = 0;\n    for (var i = 0; i < croakOfFrogs.length; i++) {\n        var idx = order.indexOf(croakOfFrogs.charAt(i));\n        if (idx < 0) return -1;\n        count[idx]++;\n        if (idx === 0) {\n            active++;\n            if (active > best) best = active;\n        } else {\n            if (count[idx] > count[idx - 1]) return -1;\n            if (idx === 4) active--;\n        }\n    }\n    for (var j = 1; j < 5; j++) {\n        if (count[j] !== count[0]) return -1;\n    }\n    return count[0] === 0 ? 0 : best;\n};`,
        typescript: `function minNumberOfFrogs(croakOfFrogs: string): number {\n    var order = "croak";\n    var count = [0, 0, 0, 0, 0];\n    var active = 0, best = 0;\n    for (var i = 0; i < croakOfFrogs.length; i++) {\n        var idx = order.indexOf(croakOfFrogs.charAt(i));\n        if (idx < 0) return -1;\n        count[idx]++;\n        if (idx === 0) {\n            active++;\n            if (active > best) best = active;\n        } else {\n            if (count[idx] > count[idx - 1]) return -1;\n            if (idx === 4) active--;\n        }\n    }\n    for (var j = 1; j < 5; j++) {\n        if (count[j] !== count[0]) return -1;\n    }\n    return count[0] === 0 ? 0 : best;\n}`,
        java: `public static int minNumberOfFrogs(String croakOfFrogs) {\n    String order = "croak";\n    int[] count = new int[5];\n    int active = 0, best = 0;\n    for (int i = 0; i < croakOfFrogs.length(); i++) {\n        int idx = order.indexOf(croakOfFrogs.charAt(i));\n        if (idx < 0) return -1;\n        count[idx]++;\n        if (idx == 0) {\n            active++;\n            if (active > best) best = active;\n        } else {\n            if (count[idx] > count[idx - 1]) return -1;\n            if (idx == 4) active--;\n        }\n    }\n    for (int j = 1; j < 5; j++) {\n        if (count[j] != count[0]) return -1;\n    }\n    return count[0] == 0 ? 0 : best;\n}`,
        cpp: `int minNumberOfFrogs(string croakOfFrogs) {\n    string order = "croak";\n    vector<int> count(5, 0);\n    int active = 0, best = 0;\n    for (char ch : croakOfFrogs) {\n        size_t pos = order.find(ch);\n        if (pos == string::npos) return -1;\n        int idx = (int) pos;\n        count[idx]++;\n        if (idx == 0) {\n            active++;\n            if (active > best) best = active;\n        } else {\n            if (count[idx] > count[idx - 1]) return -1;\n            if (idx == 4) active--;\n        }\n    }\n    for (int j = 1; j < 5; j++) {\n        if (count[j] != count[0]) return -1;\n    }\n    return count[0] == 0 ? 0 : best;\n}`,
        c: `int minNumberOfFrogs(char* croakOfFrogs) {\n    const char* order = "croak";\n    int count[5] = { 0, 0, 0, 0, 0 };\n    int active = 0, best = 0;\n    for (int i = 0; croakOfFrogs[i]; i++) {\n        int idx = -1;\n        for (int j = 0; j < 5; j++) {\n            if (order[j] == croakOfFrogs[i]) { idx = j; break; }\n        }\n        if (idx < 0) return -1;\n        count[idx]++;\n        if (idx == 0) {\n            active++;\n            if (active > best) best = active;\n        } else {\n            if (count[idx] > count[idx - 1]) return -1;\n            if (idx == 4) active--;\n        }\n    }\n    for (int j = 1; j < 5; j++) {\n        if (count[j] != count[0]) return -1;\n    }\n    return count[0] == 0 ? 0 : best;\n}`,
        csharp: `public static int MinNumberOfFrogs(string croakOfFrogs)\n{\n    string order = "croak";\n    int[] count = new int[5];\n    int active = 0, best = 0;\n    foreach (char ch in croakOfFrogs)\n    {\n        int idx = order.IndexOf(ch);\n        if (idx < 0) return -1;\n        count[idx]++;\n        if (idx == 0)\n        {\n            active++;\n            if (active > best) best = active;\n        }\n        else\n        {\n            if (count[idx] > count[idx - 1]) return -1;\n            if (idx == 4) active--;\n        }\n    }\n    for (int j = 1; j < 5; j++)\n    {\n        if (count[j] != count[0]) return -1;\n    }\n    return count[0] == 0 ? 0 : best;\n}`,
        go: `func minNumberOfFrogs(croakOfFrogs string) int {\n\torder := "croak"\n\tcount := make([]int, 5)\n\tactive, best := 0, 0\n\tfor i := 0; i < len(croakOfFrogs); i++ {\n\t\tidx := strings.IndexByte(order, croakOfFrogs[i])\n\t\tif idx < 0 {\n\t\t\treturn -1\n\t\t}\n\t\tcount[idx]++\n\t\tif idx == 0 {\n\t\t\tactive++\n\t\t\tif active > best {\n\t\t\t\tbest = active\n\t\t\t}\n\t\t} else {\n\t\t\tif count[idx] > count[idx-1] {\n\t\t\t\treturn -1\n\t\t\t}\n\t\t\tif idx == 4 {\n\t\t\t\tactive--\n\t\t\t}\n\t\t}\n\t}\n\tfor j := 1; j < 5; j++ {\n\t\tif count[j] != count[0] {\n\t\t\treturn -1\n\t\t}\n\t}\n\tif count[0] == 0 {\n\t\treturn 0\n\t}\n\treturn best\n}`,
        kotlin: `fun minNumberOfFrogs(croakOfFrogs: String): Int {\n    val order = "croak"\n    val count = IntArray(5)\n    var active = 0\n    var best = 0\n    for (ch in croakOfFrogs) {\n        val idx = order.indexOf(ch)\n        if (idx < 0) return -1\n        count[idx]++\n        if (idx == 0) {\n            active++\n            if (active > best) best = active\n        } else {\n            if (count[idx] > count[idx - 1]) return -1\n            if (idx == 4) active--\n        }\n    }\n    for (j in 1 until 5) {\n        if (count[j] != count[0]) return -1\n    }\n    return if (count[0] == 0) 0 else best\n}`,
        swift: `func minNumberOfFrogs(_ croakOfFrogs: String) -> Int {\n    let order: [Character] = ["c", "r", "o", "a", "k"]\n    var count = [Int](repeating: 0, count: 5)\n    var active = 0\n    var best = 0\n    for ch in croakOfFrogs {\n        guard let idx = order.firstIndex(of: ch) else { return -1 }\n        count[idx] += 1\n        if idx == 0 {\n            active += 1\n            if active > best { best = active }\n        } else {\n            if count[idx] > count[idx - 1] { return -1 }\n            if idx == 4 { active -= 1 }\n        }\n    }\n    for j in 1..<5 {\n        if count[j] != count[0] { return -1 }\n    }\n    return count[0] == 0 ? 0 : best\n}`,
        rust: `fn minNumberOfFrogs(croakOfFrogs: String) -> i32 {\n    let order = b"croak";\n    let mut count = [0i32; 5];\n    let mut active = 0i32;\n    let mut best = 0i32;\n    for &ch in croakOfFrogs.as_bytes() {\n        let mut idx: i32 = -1;\n        for j in 0..5 {\n            if order[j] == ch {\n                idx = j as i32;\n                break;\n            }\n        }\n        if idx < 0 {\n            return -1;\n        }\n        let i = idx as usize;\n        count[i] += 1;\n        if i == 0 {\n            active += 1;\n            if active > best {\n                best = active;\n            }\n        } else {\n            if count[i] > count[i - 1] {\n                return -1;\n            }\n            if i == 4 {\n                active -= 1;\n            }\n        }\n    }\n    for j in 1..5 {\n        if count[j] != count[0] {\n            return -1;\n        }\n    }\n    if count[0] == 0 { 0 } else { best }\n}`,
        php: `function minNumberOfFrogs($croakOfFrogs) {\n    $order = "croak";\n    $count = array(0, 0, 0, 0, 0);\n    $active = 0;\n    $best = 0;\n    for ($i = 0; $i < strlen($croakOfFrogs); $i++) {\n        $idx = strpos($order, $croakOfFrogs[$i]);\n        if ($idx === false) return -1;\n        $count[$idx]++;\n        if ($idx === 0) {\n            $active++;\n            if ($active > $best) $best = $active;\n        } else {\n            if ($count[$idx] > $count[$idx - 1]) return -1;\n            if ($idx === 4) $active--;\n        }\n    }\n    for ($j = 1; $j < 5; $j++) {\n        if ($count[$j] !== $count[0]) return -1;\n    }\n    return $count[0] === 0 ? 0 : $best;\n}`,
        ruby: `def minNumberOfFrogs(croakOfFrogs)\n  order = "croak"\n  count = Array.new(5, 0)\n  active = 0\n  best = 0\n  croakOfFrogs.each_char do |ch|\n    idx = order.index(ch)\n    return -1 if idx.nil?\n    count[idx] += 1\n    if idx == 0\n      active += 1\n      best = active if active > best\n    else\n      return -1 if count[idx] > count[idx - 1]\n      active -= 1 if idx == 4\n    end\n  end\n  (1...5).each { |j| return -1 if count[j] != count[0] }\n  count[0] == 0 ? 0 : best\nend`,
      },
    };
  })(),

  // ── Number of Ways to Split a String (LC 1573) ──────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (s: string) => {
      let ones = 0;
      for (let i = 0; i < s.length; i++) { if (s.charAt(i) === "1") ones++; }
      const n = s.length;
      if (ones % 3 !== 0) return 0;
      if (ones === 0) return (((n - 1) * (n - 2)) / 2) % MOD;
      const per = ones / 3;
      let gap1 = 0, gap2 = 0, seen = 0;
      for (let i = 0; i < n; i++) {
        if (s.charAt(i) === "1") seen++;
        else {
          if (seen === per) gap1++;
          if (seen === 2 * per) gap2++;
        }
      }
      return ((gap1 + 1) * (gap2 + 1)) % MOD;
    };
    return {
      slug: "number-of-ways-to-split-a-string",
      title: "Number of Ways to Split a String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Math", "Counting", "Amazon", "Google", "Goldman Sachs"],
      signature: { funcName: "numWays", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a binary string `s`, split it into **three non-empty** parts `s1 + s2 + s3` so that each part contains the same number of `'1'` characters.\n\nReturn how many such splits exist, modulo `10^9 + 7`.",
        [
          { in: 's = "10101"', out: "4", note: "Each part must hold exactly one 1; there are four valid cut placements." },
          { in: 's = "1001"', out: "0", note: "Two ones cannot be shared equally among three parts." },
          { in: 's = "0000"', out: "3", note: "With no ones at all, any two of the three cut positions work." },
        ],
        ["3 <= s.length <= 100000", "s[i] is '0' or '1'."]),
      hints: [
        "Count the ones first. If the total is not divisible by 3, the answer is 0.",
        "The all-zero case is different: the answer is the number of ways to choose two cut points, which is `(n-1)(n-2)/2`.",
        "Otherwise the cuts must fall in the run of zeros just after the `k`-th and `2k`-th one. Multiply the two freedoms.",
      ],
      editorial: explain({
        idea: "The positions of the ones fix where the cuts may go. Between the `k`-th and `(k+1)`-th one there is a run of zeros, and the cut may land anywhere inside it — the number of choices is that run's length plus one. The two cuts are independent, so the answers multiply.",
        steps: [
          "Count the total number of ones. If it is not a multiple of 3, return 0.",
          "If there are no ones, every pair of distinct cut positions works: return `(n-1)(n-2)/2 mod 1e9+7`.",
          "Otherwise let `per = ones / 3`. Sweep the string counting ones seen so far; each `'0'` encountered while exactly `per` ones have been seen is one extra placement for the first cut, and each `'0'` at exactly `2 * per` ones is one for the second.",
          "Return `(gap1 + 1) * (gap2 + 1) mod 1e9+7`.",
        ],
        why: "Every valid split assigns the first `per` ones to `s1`, the next `per` to `s2` and the rest to `s3`. The first cut must sit after the `per`-th one and before the `(per+1)`-th, so it has exactly one position per zero in between, plus the position immediately after that one. The same holds for the second cut, and the two ranges are disjoint, so the choices are independent.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting the all-zero case, which the gap formula does not cover.",
          "Overflow: `(gap1 + 1) * (gap2 + 1)` can exceed 32 bits before the modulo, so use a 64-bit intermediate.",
          "`(n-1)(n-2)/2` must be reduced modulo after the division, not before.",
        ],
      }),
      examples: [
        { input: '"10101"', expectedOutput: "4" },
        { input: '"1001"', expectedOutput: "0" },
        { input: '"0000"', expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 60);
        const p = pick(rng, [0.1, 0.3, 0.5, 0.9]);
        const s = Array.from({ length: n }, () => (rng() < p ? "1" : "0")).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def numWays(s: str) -> int:\n    MOD = 1000000007\n    n = len(s)\n    ones = s.count("1")\n    if ones % 3 != 0:\n        return 0\n    if ones == 0:\n        return ((n - 1) * (n - 2) // 2) % MOD\n    per = ones // 3\n    gap1 = gap2 = 0\n    seen = 0\n    for c in s:\n        if c == "1":\n            seen += 1\n        else:\n            if seen == per:\n                gap1 += 1\n            if seen == 2 * per:\n                gap2 += 1\n    return ((gap1 + 1) * (gap2 + 1)) % MOD`,
        javascript: `var numWays = function(s) {\n    var MOD = 1000000007;\n    var n = s.length, ones = 0;\n    for (var i = 0; i < n; i++) {\n        if (s.charAt(i) === "1") ones++;\n    }\n    if (ones % 3 !== 0) return 0;\n    if (ones === 0) return (((n - 1) * (n - 2)) / 2) % MOD;\n    var per = ones / 3;\n    var gap1 = 0, gap2 = 0, seen = 0;\n    for (var j = 0; j < n; j++) {\n        if (s.charAt(j) === "1") seen++;\n        else {\n            if (seen === per) gap1++;\n            if (seen === 2 * per) gap2++;\n        }\n    }\n    return ((gap1 + 1) * (gap2 + 1)) % MOD;\n};`,
        typescript: `function numWays(s: string): number {\n    var MOD = 1000000007;\n    var n = s.length, ones = 0;\n    for (var i = 0; i < n; i++) {\n        if (s.charAt(i) === "1") ones++;\n    }\n    if (ones % 3 !== 0) return 0;\n    if (ones === 0) return (((n - 1) * (n - 2)) / 2) % MOD;\n    var per = ones / 3;\n    var gap1 = 0, gap2 = 0, seen = 0;\n    for (var j = 0; j < n; j++) {\n        if (s.charAt(j) === "1") seen++;\n        else {\n            if (seen === per) gap1++;\n            if (seen === 2 * per) gap2++;\n        }\n    }\n    return ((gap1 + 1) * (gap2 + 1)) % MOD;\n}`,
        java: `public static int numWays(String s) {\n    final long MOD = 1000000007L;\n    int n = s.length();\n    int ones = 0;\n    for (int i = 0; i < n; i++) {\n        if (s.charAt(i) == '1') ones++;\n    }\n    if (ones % 3 != 0) return 0;\n    if (ones == 0) return (int) (((long) (n - 1) * (n - 2) / 2) % MOD);\n    int per = ones / 3;\n    long gap1 = 0, gap2 = 0;\n    int seen = 0;\n    for (int i = 0; i < n; i++) {\n        if (s.charAt(i) == '1') seen++;\n        else {\n            if (seen == per) gap1++;\n            if (seen == 2 * per) gap2++;\n        }\n    }\n    return (int) (((gap1 + 1) * (gap2 + 1)) % MOD);\n}`,
        cpp: `int numWays(string s) {\n    const long long MOD = 1000000007LL;\n    long long n = (long long) s.size();\n    long long ones = 0;\n    for (char c : s) {\n        if (c == '1') ones++;\n    }\n    if (ones % 3 != 0) return 0;\n    if (ones == 0) return (int) (((n - 1) * (n - 2) / 2) % MOD);\n    long long per = ones / 3;\n    long long gap1 = 0, gap2 = 0, seen = 0;\n    for (char c : s) {\n        if (c == '1') seen++;\n        else {\n            if (seen == per) gap1++;\n            if (seen == 2 * per) gap2++;\n        }\n    }\n    return (int) (((gap1 + 1) * (gap2 + 1)) % MOD);\n}`,
        c: `int numWays(char* s) {\n    const long long MOD = 1000000007LL;\n    long long n = (long long) strlen(s);\n    long long ones = 0;\n    for (long long i = 0; i < n; i++) {\n        if (s[i] == '1') ones++;\n    }\n    if (ones % 3 != 0) return 0;\n    if (ones == 0) return (int) (((n - 1) * (n - 2) / 2) % MOD);\n    long long per = ones / 3;\n    long long gap1 = 0, gap2 = 0, seen = 0;\n    for (long long i = 0; i < n; i++) {\n        if (s[i] == '1') seen++;\n        else {\n            if (seen == per) gap1++;\n            if (seen == 2 * per) gap2++;\n        }\n    }\n    return (int) (((gap1 + 1) * (gap2 + 1)) % MOD);\n}`,
        csharp: `public static int NumWays(string s)\n{\n    const long MOD = 1000000007L;\n    long n = s.Length;\n    long ones = 0;\n    foreach (char c in s)\n    {\n        if (c == '1') ones++;\n    }\n    if (ones % 3 != 0) return 0;\n    if (ones == 0) return (int) (((n - 1) * (n - 2) / 2) % MOD);\n    long per = ones / 3;\n    long gap1 = 0, gap2 = 0, seen = 0;\n    foreach (char c in s)\n    {\n        if (c == '1') seen++;\n        else\n        {\n            if (seen == per) gap1++;\n            if (seen == 2 * per) gap2++;\n        }\n    }\n    return (int) (((gap1 + 1) * (gap2 + 1)) % MOD);\n}`,
        go: `func numWays(s string) int {\n\tconst mod = 1000000007\n\tn := len(s)\n\tones := 0\n\tfor i := 0; i < n; i++ {\n\t\tif s[i] == \'1\' {\n\t\t\tones++\n\t\t}\n\t}\n\tif ones%3 != 0 {\n\t\treturn 0\n\t}\n\tif ones == 0 {\n\t\treturn ((n - 1) * (n - 2) / 2) % mod\n\t}\n\tper := ones / 3\n\tgap1, gap2, seen := 0, 0, 0\n\tfor i := 0; i < n; i++ {\n\t\tif s[i] == \'1\' {\n\t\t\tseen++\n\t\t} else {\n\t\t\tif seen == per {\n\t\t\t\tgap1++\n\t\t\t}\n\t\t\tif seen == 2*per {\n\t\t\t\tgap2++\n\t\t\t}\n\t\t}\n\t}\n\treturn ((gap1 + 1) * (gap2 + 1)) % mod\n}`,
        kotlin: `fun numWays(s: String): Int {\n    val mod = 1000000007L\n    val n = s.length.toLong()\n    var ones = 0L\n    for (c in s) if (c == \'1\') ones++\n    if (ones % 3 != 0L) return 0\n    if (ones == 0L) return (((n - 1) * (n - 2) / 2) % mod).toInt()\n    val per = ones / 3\n    var gap1 = 0L\n    var gap2 = 0L\n    var seen = 0L\n    for (c in s) {\n        if (c == \'1\') seen++\n        else {\n            if (seen == per) gap1++\n            if (seen == 2 * per) gap2++\n        }\n    }\n    return (((gap1 + 1) * (gap2 + 1)) % mod).toInt()\n}`,
        swift: `func numWays(_ s: String) -> Int {\n    let mod = 1000000007\n    let chars = Array(s)\n    let n = chars.count\n    var ones = 0\n    for c in chars where c == "1" { ones += 1 }\n    if ones % 3 != 0 { return 0 }\n    if ones == 0 { return ((n - 1) * (n - 2) / 2) % mod }\n    let per = ones / 3\n    var gap1 = 0\n    var gap2 = 0\n    var seen = 0\n    for c in chars {\n        if c == "1" {\n            seen += 1\n        } else {\n            if seen == per { gap1 += 1 }\n            if seen == 2 * per { gap2 += 1 }\n        }\n    }\n    return ((gap1 + 1) * (gap2 + 1)) % mod\n}`,
        rust: `fn numWays(s: String) -> i32 {\n    let md: i64 = 1000000007;\n    let b = s.as_bytes();\n    let n = b.len() as i64;\n    let mut ones: i64 = 0;\n    for &c in b {\n        if c == b\'1\' {\n            ones += 1;\n        }\n    }\n    if ones % 3 != 0 {\n        return 0;\n    }\n    if ones == 0 {\n        return (((n - 1) * (n - 2) / 2) % md) as i32;\n    }\n    let per = ones / 3;\n    let mut gap1: i64 = 0;\n    let mut gap2: i64 = 0;\n    let mut seen: i64 = 0;\n    for &c in b {\n        if c == b\'1\' {\n            seen += 1;\n        } else {\n            if seen == per {\n                gap1 += 1;\n            }\n            if seen == 2 * per {\n                gap2 += 1;\n            }\n        }\n    }\n    (((gap1 + 1) * (gap2 + 1)) % md) as i32\n}`,
        php: `function numWays($s) {\n    $mod = 1000000007;\n    $n = strlen($s);\n    $ones = substr_count($s, "1");\n    if ($ones % 3 !== 0) return 0;\n    if ($ones === 0) return intdiv(($n - 1) * ($n - 2), 2) % $mod;\n    $per = intdiv($ones, 3);\n    $gap1 = 0;\n    $gap2 = 0;\n    $seen = 0;\n    for ($i = 0; $i < $n; $i++) {\n        if ($s[$i] === "1") $seen++;\n        else {\n            if ($seen === $per) $gap1++;\n            if ($seen === 2 * $per) $gap2++;\n        }\n    }\n    return (($gap1 + 1) * ($gap2 + 1)) % $mod;\n}`,
        ruby: `def numWays(s)\n  mod = 1000000007\n  n = s.length\n  ones = s.count("1")\n  return 0 if ones % 3 != 0\n  return ((n - 1) * (n - 2) / 2) % mod if ones == 0\n  per = ones / 3\n  gap1 = 0\n  gap2 = 0\n  seen = 0\n  s.each_char do |c|\n    if c == "1"\n      seen += 1\n    else\n      gap1 += 1 if seen == per\n      gap2 += 1 if seen == 2 * per\n    end\n  end\n  ((gap1 + 1) * (gap2 + 1)) % mod\nend`,
      },
    };
  })(),

  // ── Maximum Number of Occurrences of a Substring (LC 1297) ──────
  (() => {
    const ref = (s: string, maxLetters: number, minSize: number, maxSize: number) => {
      const count: Record<string, number> = {};
      let best = 0;
      for (let i = 0; i + minSize <= s.length; i++) {
        const sub = s.substr(i, minSize);
        const seen: Record<string, boolean> = {};
        let distinct = 0;
        for (let j = 0; j < sub.length; j++) {
          const c = sub.charAt(j);
          if (seen[c] !== true) { seen[c] = true; distinct++; }
        }
        if (distinct > maxLetters) continue;
        count[sub] = (count[sub] === undefined ? 0 : count[sub]) + 1;
        if (count[sub] > best) best = count[sub];
      }
      return best;
    };
    return {
      slug: "maximum-number-of-occurrences-of-a-substring",
      title: "Maximum Number of Occurrences of a Substring",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window", "Hash Table", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "maxFreq", params: [{ name: "s", type: "string" as const }, { name: "maxLetters", type: "int" as const }, { name: "minSize", type: "int" as const }, { name: "maxSize", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s`, return the maximum number of occurrences of any substring that satisfies both rules:\n\n- it contains at most `maxLetters` **distinct** characters;\n- its length is between `minSize` and `maxSize` inclusive.\n\nIf no substring qualifies, return `0`.",
        [
          { in: 's = "aababcaab", maxLetters = 2, minSize = 3, maxSize = 4', out: "2", note: '"aab" occurs twice and has two distinct letters.' },
          { in: 's = "aaaa", maxLetters = 1, minSize = 3, maxSize = 3', out: "2", note: '"aaa" occurs at indices 0 and 1.' },
          { in: 's = "abcde", maxLetters = 2, minSize = 3, maxSize = 3', out: "0" },
        ],
        ["1 <= s.length <= 100000", "1 <= maxLetters <= 26", "1 <= minSize <= maxSize <= min(26, s.length)"]),
      hints: [
        "`maxSize` is a red herring. Why would a longer substring ever beat a shorter one?",
        "Any occurrence of a longer valid substring contains an occurrence of its length-`minSize` prefix, which is also valid.",
        "So only windows of exactly `minSize` need counting.",
      ],
      editorial: explain({
        idea: "Only length `minSize` matters. A substring of length `L > minSize` that occurs `k` times has a prefix of length `minSize` occurring at least `k` times, with no more distinct letters — so the shortest allowed window always ties or wins.",
        steps: [
          "Slide a window of exactly `minSize` characters across `s`.",
          "For each window, count its distinct characters and skip it if that exceeds `maxLetters`.",
          "Tally the window's text in a hash map and keep the running maximum tally.",
        ],
        why: "Every occurrence of a longer valid substring yields an occurrence of its `minSize` prefix at the same start, so the prefix's count is at least as large; and a prefix has a subset of the letters, so it is still within `maxLetters`. The maximum over length-`minSize` windows is therefore the global maximum.",
        time: "O(n · minSize)",
        space: "O(n · minSize)",
        pitfalls: [
          "Enumerating every length from `minSize` to `maxSize` is correct but does far more work than needed.",
          "Forgetting the distinct-letter check counts substrings that violate `maxLetters`.",
        ],
      }),
      examples: [
        { input: '"aababcaab"\n2\n3\n4', expectedOutput: "2" },
        { input: '"aaaa"\n1\n3\n3', expectedOutput: "2" },
        { input: '"abcde"\n2\n3\n3', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.5 ? "ab" : "abcd";
        const n = ri(rng, 1, 40);
        const s = randLower(rng, n, n, alphabet);
        const minSize = ri(rng, 1, Math.min(6, Math.max(1, n)));
        const maxSize = ri(rng, minSize, Math.min(10, Math.max(minSize, n)));
        const maxLetters = ri(rng, 1, 4);
        return { input: `"${s}"\n${maxLetters}\n${minSize}\n${maxSize}`, expectedOutput: String(ref(s, maxLetters, minSize, maxSize)) };
      },
      solutions: {
        python: `def maxFreq(s: str, maxLetters: int, minSize: int, maxSize: int) -> int:\n    count = {}\n    best = 0\n    for i in range(len(s) - minSize + 1):\n        sub = s[i:i + minSize]\n        if len(set(sub)) > maxLetters:\n            continue\n        count[sub] = count.get(sub, 0) + 1\n        best = max(best, count[sub])\n    return best`,
        javascript: `var maxFreq = function(s, maxLetters, minSize, maxSize) {\n    var count = {}, best = 0;\n    for (var i = 0; i + minSize <= s.length; i++) {\n        var sub = s.substr(i, minSize);\n        var seen = {}, distinct = 0;\n        for (var j = 0; j < sub.length; j++) {\n            var c = sub.charAt(j);\n            if (seen[c] !== true) { seen[c] = true; distinct++; }\n        }\n        if (distinct > maxLetters) continue;\n        count[sub] = (count[sub] === undefined ? 0 : count[sub]) + 1;\n        if (count[sub] > best) best = count[sub];\n    }\n    return best;\n};`,
        typescript: `function maxFreq(s: string, maxLetters: number, minSize: number, maxSize: number): number {\n    var count: { [key: string]: number } = {}, best = 0;\n    for (var i = 0; i + minSize <= s.length; i++) {\n        var sub = s.substr(i, minSize);\n        var seen: { [key: string]: boolean } = {}, distinct = 0;\n        for (var j = 0; j < sub.length; j++) {\n            var c = sub.charAt(j);\n            if (seen[c] !== true) { seen[c] = true; distinct++; }\n        }\n        if (distinct > maxLetters) continue;\n        count[sub] = (count[sub] === undefined ? 0 : count[sub]) + 1;\n        if (count[sub] > best) best = count[sub];\n    }\n    return best;\n}`,
        java: `public static int maxFreq(String s, int maxLetters, int minSize, int maxSize) {\n    Map<String, Integer> count = new HashMap<>();\n    int best = 0;\n    for (int i = 0; i + minSize <= s.length(); i++) {\n        String sub = s.substring(i, i + minSize);\n        Set<Character> seen = new HashSet<>();\n        for (int j = 0; j < sub.length(); j++) seen.add(sub.charAt(j));\n        if (seen.size() > maxLetters) continue;\n        int c = count.getOrDefault(sub, 0) + 1;\n        count.put(sub, c);\n        if (c > best) best = c;\n    }\n    return best;\n}`,
        cpp: `int maxFreq(string s, int maxLetters, int minSize, int maxSize) {\n    unordered_map<string, int> count;\n    int best = 0;\n    for (int i = 0; i + minSize <= (int) s.size(); i++) {\n        string sub = s.substr(i, minSize);\n        vector<bool> seen(26, false);\n        int distinct = 0;\n        for (char c : sub) {\n            if (!seen[c - 'a']) { seen[c - 'a'] = true; distinct++; }\n        }\n        if (distinct > maxLetters) continue;\n        int c = ++count[sub];\n        if (c > best) best = c;\n    }\n    return best;\n}`,
        c: `int maxFreq(char* s, int maxLetters, int minSize, int maxSize) {\n    int n = (int) strlen(s);\n    int windows = n - minSize + 1;\n    if (windows <= 0) return 0;\n    int* ok = (int*) calloc((size_t) windows, sizeof(int));\n    for (int i = 0; i < windows; i++) {\n        int seen[26];\n        memset(seen, 0, sizeof(seen));\n        int distinct = 0;\n        for (int j = 0; j < minSize; j++) {\n            int c = s[i + j] - 'a';\n            if (!seen[c]) { seen[c] = 1; distinct++; }\n        }\n        ok[i] = distinct <= maxLetters;\n    }\n    int best = 0;\n    for (int i = 0; i < windows; i++) {\n        if (!ok[i]) continue;\n        int c = 0;\n        for (int j = 0; j < windows; j++) {\n            if (ok[j] && strncmp(s + i, s + j, (size_t) minSize) == 0) c++;\n        }\n        if (c > best) best = c;\n    }\n    free(ok);\n    return best;\n}`,
        csharp: `public static int MaxFreq(string s, int maxLetters, int minSize, int maxSize)\n{\n    var count = new Dictionary<string, int>();\n    int best = 0;\n    for (int i = 0; i + minSize <= s.Length; i++)\n    {\n        string sub = s.Substring(i, minSize);\n        var seen = new HashSet<char>();\n        foreach (char c in sub) seen.Add(c);\n        if (seen.Count > maxLetters) continue;\n        int cur;\n        cur = (count.TryGetValue(sub, out cur) ? cur : 0) + 1;\n        count[sub] = cur;\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,
        go: `func maxFreq(s string, maxLetters int, minSize int, maxSize int) int {\n\tcount := map[string]int{}\n\tbest := 0\n\tfor i := 0; i+minSize <= len(s); i++ {\n\t\tsub := s[i : i+minSize]\n\t\tseen := make([]bool, 26)\n\t\tdistinct := 0\n\t\tfor j := 0; j < len(sub); j++ {\n\t\t\tc := int(sub[j] - \'a\')\n\t\t\tif !seen[c] {\n\t\t\t\tseen[c] = true\n\t\t\t\tdistinct++\n\t\t\t}\n\t\t}\n\t\tif distinct > maxLetters {\n\t\t\tcontinue\n\t\t}\n\t\tcount[sub]++\n\t\tif count[sub] > best {\n\t\t\tbest = count[sub]\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxFreq(s: String, maxLetters: Int, minSize: Int, maxSize: Int): Int {\n    val count = HashMap<String, Int>()\n    var best = 0\n    for (i in 0..s.length - minSize) {\n        val sub = s.substring(i, i + minSize)\n        if (sub.toSet().size > maxLetters) continue\n        val c = (count[sub] ?: 0) + 1\n        count[sub] = c\n        if (c > best) best = c\n    }\n    return best\n}`,
        swift: `func maxFreq(_ s: String, _ maxLetters: Int, _ minSize: Int, _ maxSize: Int) -> Int {\n    let a = Array(s)\n    var count: [String: Int] = [:]\n    var best = 0\n    if a.count < minSize { return 0 }\n    for i in 0...(a.count - minSize) {\n        let window = Array(a[i..<(i + minSize)])\n        if Set(window).count > maxLetters { continue }\n        let sub = String(window)\n        let c = (count[sub] ?? 0) + 1\n        count[sub] = c\n        if c > best { best = c }\n    }\n    return best\n}`,
        rust: `fn maxFreq(s: String, maxLetters: i32, minSize: i32, maxSize: i32) -> i32 {\n    let b = s.as_bytes();\n    let m = minSize as usize;\n    if b.len() < m {\n        return 0;\n    }\n    let mut count: std::collections::HashMap<Vec<u8>, i32> = std::collections::HashMap::new();\n    let mut best = 0;\n    for i in 0..=(b.len() - m) {\n        let window = &b[i..i + m];\n        let mut seen = [false; 26];\n        let mut distinct = 0;\n        for &c in window {\n            let idx = (c - b\'a\') as usize;\n            if !seen[idx] {\n                seen[idx] = true;\n                distinct += 1;\n            }\n        }\n        if distinct > maxLetters {\n            continue;\n        }\n        let e = count.entry(window.to_vec()).or_insert(0);\n        *e += 1;\n        if *e > best {\n            best = *e;\n        }\n    }\n    best\n}`,
        php: `function maxFreq($s, $maxLetters, $minSize, $maxSize) {\n    $count = array();\n    $best = 0;\n    $n = strlen($s);\n    for ($i = 0; $i + $minSize <= $n; $i++) {\n        $sub = substr($s, $i, $minSize);\n        if (count(array_unique(str_split($sub))) > $maxLetters) continue;\n        $count[$sub] = isset($count[$sub]) ? $count[$sub] + 1 : 1;\n        if ($count[$sub] > $best) $best = $count[$sub];\n    }\n    return $best;\n}`,
        ruby: `def maxFreq(s, maxLetters, minSize, maxSize)\n  count = Hash.new(0)\n  best = 0\n  (0..(s.length - minSize)).each do |i|\n    sub = s[i, minSize]\n    next if sub.chars.uniq.length > maxLetters\n    count[sub] += 1\n    best = count[sub] if count[sub] > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Longest Substring With At Least K Repeating Characters (LC 395) ──
  (() => {
    const ref = (s: string, k: number) => {
      const n = s.length;
      let best = 0;
      for (let target = 1; target <= 26; target++) {
        const count = new Array(26).fill(0);
        let left = 0, unique = 0, atLeastK = 0;
        for (let right = 0; right < n; right++) {
          const c = s.charCodeAt(right) - 97;
          if (count[c] === 0) unique++;
          count[c]++;
          if (count[c] === k) atLeastK++;
          while (unique > target) {
            const d = s.charCodeAt(left) - 97;
            if (count[d] === k) atLeastK--;
            count[d]--;
            if (count[d] === 0) unique--;
            left++;
          }
          if (unique === target && atLeastK === target && right - left + 1 > best) best = right - left + 1;
        }
      }
      return best;
    };
    return {
      slug: "longest-substring-with-at-least-k-repeating-characters",
      title: "Longest Substring With At Least K Repeating Characters",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window", "Divide and Conquer", "Amazon", "Google", "Meta"],
      signature: { funcName: "longestSubstring", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s` and an integer `k`, return the length of the longest substring in which **every** character appears at least `k` times.\n\nIf no such substring exists, return `0`.",
        [
          { in: 's = "aaabb", k = 3', out: "3", note: '"aaa" is the longest — b appears only twice.' },
          { in: 's = "ababbc", k = 2', out: "5", note: '"ababb" has a three times and b twice.' },
          { in: 's = "codekairo", k = 2', out: "0", note: "Only o repeats, and never with anything else around it." },
        ],
        ["1 <= s.length <= 10000", "1 <= k <= 100000", "s consists of lowercase English letters."]),
      hints: [
        "A plain sliding window does not work directly — the 'every character appears at least k times' condition is not monotone as the window grows.",
        "Fix the number of **distinct** characters the window may hold. Now the window is monotone again and two pointers apply.",
        "There are only 26 possible values for that number, so try each one.",
      ],
      editorial: explain({
        idea: "The condition is not monotone, so a single sliding window fails. Adding a constraint fixes it: for a fixed number `t` of distinct characters, 'at most `t` distinct' *is* monotone, so a window can be maintained. Trying `t = 1 .. 26` covers every possible answer.",
        steps: [
          "For each `t` from 1 to 26, run a sliding window over `s`.",
          "Track per-character counts, `unique` (distinct characters in the window) and `atLeastK` (how many of them reach `k`).",
          "Shrink from the left while `unique > t`.",
          "Whenever `unique == t` and `atLeastK == t`, every character in the window qualifies — record the window length.",
        ],
        why: "Any optimal substring has some number of distinct characters `t*` between 1 and 26; on the pass with `t = t*` the window can grow to exactly that substring, because the shrink rule only triggers when the distinct count exceeds `t*`. So the maximum over all 26 passes is the true answer.",
        time: "O(26 · n)",
        space: "O(26)",
        pitfalls: [
          "A single unconstrained window is the classic wrong answer — growing it can break the condition and shrinking it can fix it, so neither pointer moves monotonically.",
          "Recording the window when `atLeastK == t` but `unique < t` counts a window that has not yet reached the target distinct count.",
          "The divide-and-conquer solution — split on any character with fewer than `k` occurrences and recurse — is the other standard route.",
        ],
      }),
      examples: [
        { input: '"aaabb"\n3', expectedOutput: "3" },
        { input: '"ababbc"\n2', expectedOutput: "5" },
        { input: '"codekairo"\n2', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.6 ? "abc" : "abcde";
        const s = randLower(rng, 1, 40, alphabet);
        const k = ri(rng, 1, 5);
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: `def longestSubstring(s: str, k: int) -> int:\n    n = len(s)\n    best = 0\n    for target in range(1, 27):\n        count = [0] * 26\n        left = unique = at_least_k = 0\n        for right in range(n):\n            c = ord(s[right]) - 97\n            if count[c] == 0:\n                unique += 1\n            count[c] += 1\n            if count[c] == k:\n                at_least_k += 1\n            while unique > target:\n                d = ord(s[left]) - 97\n                if count[d] == k:\n                    at_least_k -= 1\n                count[d] -= 1\n                if count[d] == 0:\n                    unique -= 1\n                left += 1\n            if unique == target and at_least_k == target:\n                best = max(best, right - left + 1)\n    return best`,
        javascript: `var longestSubstring = function(s, k) {\n    var n = s.length, best = 0;\n    for (var target = 1; target <= 26; target++) {\n        var count = [];\n        for (var t = 0; t < 26; t++) count.push(0);\n        var left = 0, unique = 0, atLeastK = 0;\n        for (var right = 0; right < n; right++) {\n            var c = s.charCodeAt(right) - 97;\n            if (count[c] === 0) unique++;\n            count[c]++;\n            if (count[c] === k) atLeastK++;\n            while (unique > target) {\n                var d = s.charCodeAt(left) - 97;\n                if (count[d] === k) atLeastK--;\n                count[d]--;\n                if (count[d] === 0) unique--;\n                left++;\n            }\n            if (unique === target && atLeastK === target && right - left + 1 > best) best = right - left + 1;\n        }\n    }\n    return best;\n};`,
        typescript: `function longestSubstring(s: string, k: number): number {\n    var n = s.length, best = 0;\n    for (var target = 1; target <= 26; target++) {\n        var count: number[] = [];\n        for (var t = 0; t < 26; t++) count.push(0);\n        var left = 0, unique = 0, atLeastK = 0;\n        for (var right = 0; right < n; right++) {\n            var c = s.charCodeAt(right) - 97;\n            if (count[c] === 0) unique++;\n            count[c]++;\n            if (count[c] === k) atLeastK++;\n            while (unique > target) {\n                var d = s.charCodeAt(left) - 97;\n                if (count[d] === k) atLeastK--;\n                count[d]--;\n                if (count[d] === 0) unique--;\n                left++;\n            }\n            if (unique === target && atLeastK === target && right - left + 1 > best) best = right - left + 1;\n        }\n    }\n    return best;\n}`,
        java: `public static int longestSubstring(String s, int k) {\n    int n = s.length(), best = 0;\n    for (int target = 1; target <= 26; target++) {\n        int[] count = new int[26];\n        int left = 0, unique = 0, atLeastK = 0;\n        for (int right = 0; right < n; right++) {\n            int c = s.charAt(right) - 'a';\n            if (count[c] == 0) unique++;\n            count[c]++;\n            if (count[c] == k) atLeastK++;\n            while (unique > target) {\n                int d = s.charAt(left) - 'a';\n                if (count[d] == k) atLeastK--;\n                count[d]--;\n                if (count[d] == 0) unique--;\n                left++;\n            }\n            if (unique == target && atLeastK == target) best = Math.max(best, right - left + 1);\n        }\n    }\n    return best;\n}`,
        cpp: `int longestSubstring(string s, int k) {\n    int n = (int) s.size(), best = 0;\n    for (int target = 1; target <= 26; target++) {\n        vector<int> count(26, 0);\n        int left = 0, unique = 0, atLeastK = 0;\n        for (int right = 0; right < n; right++) {\n            int c = s[right] - 'a';\n            if (count[c] == 0) unique++;\n            count[c]++;\n            if (count[c] == k) atLeastK++;\n            while (unique > target) {\n                int d = s[left] - 'a';\n                if (count[d] == k) atLeastK--;\n                count[d]--;\n                if (count[d] == 0) unique--;\n                left++;\n            }\n            if (unique == target && atLeastK == target) best = max(best, right - left + 1);\n        }\n    }\n    return best;\n}`,
        c: `int longestSubstring(char* s, int k) {\n    int n = (int) strlen(s);\n    int best = 0;\n    for (int target = 1; target <= 26; target++) {\n        int count[26];\n        memset(count, 0, sizeof(count));\n        int left = 0, unique = 0, atLeastK = 0;\n        for (int right = 0; right < n; right++) {\n            int c = s[right] - 'a';\n            if (count[c] == 0) unique++;\n            count[c]++;\n            if (count[c] == k) atLeastK++;\n            while (unique > target) {\n                int d = s[left] - 'a';\n                if (count[d] == k) atLeastK--;\n                count[d]--;\n                if (count[d] == 0) unique--;\n                left++;\n            }\n            if (unique == target && atLeastK == target && right - left + 1 > best) best = right - left + 1;\n        }\n    }\n    return best;\n}`,
        csharp: `public static int LongestSubstring(string s, int k)\n{\n    int n = s.Length, best = 0;\n    for (int target = 1; target <= 26; target++)\n    {\n        int[] count = new int[26];\n        int left = 0, unique = 0, atLeastK = 0;\n        for (int right = 0; right < n; right++)\n        {\n            int c = s[right] - 'a';\n            if (count[c] == 0) unique++;\n            count[c]++;\n            if (count[c] == k) atLeastK++;\n            while (unique > target)\n            {\n                int d = s[left] - 'a';\n                if (count[d] == k) atLeastK--;\n                count[d]--;\n                if (count[d] == 0) unique--;\n                left++;\n            }\n            if (unique == target && atLeastK == target && right - left + 1 > best) best = right - left + 1;\n        }\n    }\n    return best;\n}`,
        go: `func longestSubstring(s string, k int) int {\n\tn := len(s)\n\tbest := 0\n\tfor target := 1; target <= 26; target++ {\n\t\tcount := make([]int, 26)\n\t\tleft, unique, atLeastK := 0, 0, 0\n\t\tfor right := 0; right < n; right++ {\n\t\t\tc := int(s[right] - \'a\')\n\t\t\tif count[c] == 0 {\n\t\t\t\tunique++\n\t\t\t}\n\t\t\tcount[c]++\n\t\t\tif count[c] == k {\n\t\t\t\tatLeastK++\n\t\t\t}\n\t\t\tfor unique > target {\n\t\t\t\td := int(s[left] - \'a\')\n\t\t\t\tif count[d] == k {\n\t\t\t\t\tatLeastK--\n\t\t\t\t}\n\t\t\t\tcount[d]--\n\t\t\t\tif count[d] == 0 {\n\t\t\t\t\tunique--\n\t\t\t\t}\n\t\t\t\tleft++\n\t\t\t}\n\t\t\tif unique == target && atLeastK == target && right-left+1 > best {\n\t\t\t\tbest = right - left + 1\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun longestSubstring(s: String, k: Int): Int {\n    val n = s.length\n    var best = 0\n    for (target in 1..26) {\n        val count = IntArray(26)\n        var left = 0\n        var unique = 0\n        var atLeastK = 0\n        for (right in 0 until n) {\n            val c = s[right] - \'a\'\n            if (count[c] == 0) unique++\n            count[c]++\n            if (count[c] == k) atLeastK++\n            while (unique > target) {\n                val d = s[left] - \'a\'\n                if (count[d] == k) atLeastK--\n                count[d]--\n                if (count[d] == 0) unique--\n                left++\n            }\n            if (unique == target && atLeastK == target && right - left + 1 > best) best = right - left + 1\n        }\n    }\n    return best\n}`,
        swift: `func longestSubstring(_ s: String, _ k: Int) -> Int {\n    let a = Array(s.utf8).map { Int($0) - 97 }\n    let n = a.count\n    var best = 0\n    for target in 1...26 {\n        var count = [Int](repeating: 0, count: 26)\n        var left = 0\n        var unique = 0\n        var atLeastK = 0\n        for right in 0..<n {\n            let c = a[right]\n            if count[c] == 0 { unique += 1 }\n            count[c] += 1\n            if count[c] == k { atLeastK += 1 }\n            while unique > target {\n                let d = a[left]\n                if count[d] == k { atLeastK -= 1 }\n                count[d] -= 1\n                if count[d] == 0 { unique -= 1 }\n                left += 1\n            }\n            if unique == target && atLeastK == target && right - left + 1 > best {\n                best = right - left + 1\n            }\n        }\n    }\n    return best\n}`,
        rust: `fn longestSubstring(s: String, k: i32) -> i32 {\n    let b = s.as_bytes();\n    let n = b.len();\n    let mut best = 0i32;\n    for target in 1..=26 {\n        let mut count = [0i32; 26];\n        let mut left = 0usize;\n        let mut unique = 0i32;\n        let mut at_least_k = 0i32;\n        for right in 0..n {\n            let c = (b[right] - b\'a\') as usize;\n            if count[c] == 0 {\n                unique += 1;\n            }\n            count[c] += 1;\n            if count[c] == k {\n                at_least_k += 1;\n            }\n            while unique > target {\n                let d = (b[left] - b\'a\') as usize;\n                if count[d] == k {\n                    at_least_k -= 1;\n                }\n                count[d] -= 1;\n                if count[d] == 0 {\n                    unique -= 1;\n                }\n                left += 1;\n            }\n            if unique == target && at_least_k == target && (right + 1 - left) as i32 > best {\n                best = (right + 1 - left) as i32;\n            }\n        }\n    }\n    best\n}`,
        php: `function longestSubstring($s, $k) {\n    $n = strlen($s);\n    $best = 0;\n    for ($target = 1; $target <= 26; $target++) {\n        $count = array_fill(0, 26, 0);\n        $left = 0;\n        $unique = 0;\n        $atLeastK = 0;\n        for ($right = 0; $right < $n; $right++) {\n            $c = ord($s[$right]) - 97;\n            if ($count[$c] === 0) $unique++;\n            $count[$c]++;\n            if ($count[$c] === $k) $atLeastK++;\n            while ($unique > $target) {\n                $d = ord($s[$left]) - 97;\n                if ($count[$d] === $k) $atLeastK--;\n                $count[$d]--;\n                if ($count[$d] === 0) $unique--;\n                $left++;\n            }\n            if ($unique === $target && $atLeastK === $target && $right - $left + 1 > $best) $best = $right - $left + 1;\n        }\n    }\n    return $best;\n}`,
        ruby: `def longestSubstring(s, k)\n  n = s.length\n  best = 0\n  (1..26).each do |target|\n    count = Array.new(26, 0)\n    left = 0\n    unique = 0\n    at_least_k = 0\n    (0...n).each do |right|\n      c = s[right].ord - 97\n      unique += 1 if count[c] == 0\n      count[c] += 1\n      at_least_k += 1 if count[c] == k\n      while unique > target\n        d = s[left].ord - 97\n        at_least_k -= 1 if count[d] == k\n        count[d] -= 1\n        unique -= 1 if count[d] == 0\n        left += 1\n      end\n      best = right - left + 1 if unique == target && at_least_k == target && right - left + 1 > best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Can Convert String in K Moves (LC 1540) ─────────────────────
  (() => {
    const ref = (s: string, t: string, k: number) => {
      if (s.length !== t.length) return false;
      const used = new Array(26).fill(0);
      for (let i = 0; i < s.length; i++) {
        const shift = ((t.charCodeAt(i) - s.charCodeAt(i)) % 26 + 26) % 26;
        if (shift === 0) continue;
        const move = shift + 26 * used[shift];
        used[shift]++;
        if (move > k) return false;
      }
      return true;
    };
    return {
      slug: "can-convert-string-in-k-moves",
      title: "Can Convert String in K Moves",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Hash Table", "Greedy", "Amazon", "Google", "Adobe"],
      signature: { funcName: "canConvertString", params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }, { name: "k", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "You have `k` moves, numbered `1` through `k`. On move `i` you may pick an index of `s` **not chosen before** and shift its character forward by `i` positions in the alphabet, wrapping `z` around to `a`. You may also skip a move.\n\nReturn `true` if `s` can be turned into `t` within those `k` moves.",
        [
          { in: 's = "input", t = "ouput", k = 9', out: "true", note: "Shift index 0 by 6 on move 6 and index 4 by 1 on move 1." },
          { in: 's = "abc", t = "bcd", k = 10', out: "false", note: "All three need a shift of 1, but only moves 1 and 27 provide that — and 27 is beyond k." },
          { in: 's = "aab", t = "bbb", k = 27', out: "true", note: "The two shifts of 1 use moves 1 and 27." },
        ],
        ["1 <= s.length, t.length <= 100000", "0 <= k <= 1000000", "s and t consist of lowercase English letters."]),
      hints: [
        "Each index needs one fixed shift: `(t[i] - s[i] + 26) % 26`. A shift of 0 costs no move at all.",
        "Only moves `d`, `d + 26`, `d + 52`, … can deliver a shift of `d`, so several indices needing the same shift must queue up.",
        "The `j`-th index (1-based) needing shift `d` must use move `d + 26·(j-1)`.",
      ],
      editorial: explain({
        idea: "The required shift per index is forced, and the move numbers that produce a given shift form an arithmetic progression with step 26. Counting how many indices already claimed each shift tells you exactly which move number the next one needs.",
        steps: [
          "If the two strings have different lengths, the answer is immediately `false`.",
          "For each index, compute `shift = (t[i] - s[i] + 26) % 26` and skip it when it is 0.",
          "Look up how many indices have already taken this shift, say `used`; the move needed is `shift + 26 * used`.",
          "If that move exceeds `k`, return `false`; otherwise record the claim and continue.",
        ],
        why: "Move `m` shifts by `m mod 26`, so the moves capable of shift `d` are exactly `d, d+26, d+52, …`. Assigning them in increasing order is optimal — any other assignment uses a move at least as large for some index. The check therefore fails only when no assignment exists.",
        time: "O(n)",
        space: "O(26)",
        pitfalls: [
          "Counting a shift of 0 as needing a move wastes the budget and rejects valid inputs.",
          "Forgetting the length check compares mismatched indices.",
          "`shift + 26 * used` overflows 32 bits only for absurd inputs, but a `long` is the safe habit.",
        ],
      }),
      examples: [
        { input: '"input"\n"ouput"\n9', expectedOutput: "true" },
        { input: '"abc"\n"bcd"\n10', expectedOutput: "false" },
        { input: '"aab"\n"bbb"\n27', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const alphabet = rng() < 0.5 ? "abcd" : "abcdefghijklmnopqrstuvwxyz";
        const s = randLower(rng, n, n, alphabet);
        const t = randLower(rng, n, n, alphabet);
        const k = pick(rng, [0, 1, 5, 26, 27, 52, 100]);
        return { input: `"${s}"\n"${t}"\n${k}`, expectedOutput: bool(ref(s, t, k)) };
      },
      solutions: {
        python: `def canConvertString(s: str, t: str, k: int) -> bool:\n    if len(s) != len(t):\n        return False\n    used = [0] * 26\n    for a, b in zip(s, t):\n        shift = (ord(b) - ord(a)) % 26\n        if shift == 0:\n            continue\n        move = shift + 26 * used[shift]\n        used[shift] += 1\n        if move > k:\n            return False\n    return True`,
        javascript: `var canConvertString = function(s, t, k) {\n    if (s.length !== t.length) return false;\n    var used = [];\n    for (var u = 0; u < 26; u++) used.push(0);\n    for (var i = 0; i < s.length; i++) {\n        var shift = ((t.charCodeAt(i) - s.charCodeAt(i)) % 26 + 26) % 26;\n        if (shift === 0) continue;\n        var move = shift + 26 * used[shift];\n        used[shift]++;\n        if (move > k) return false;\n    }\n    return true;\n};`,
        typescript: `function canConvertString(s: string, t: string, k: number): boolean {\n    if (s.length !== t.length) return false;\n    var used: number[] = [];\n    for (var u = 0; u < 26; u++) used.push(0);\n    for (var i = 0; i < s.length; i++) {\n        var shift = ((t.charCodeAt(i) - s.charCodeAt(i)) % 26 + 26) % 26;\n        if (shift === 0) continue;\n        var move = shift + 26 * used[shift];\n        used[shift]++;\n        if (move > k) return false;\n    }\n    return true;\n}`,
        java: `public static boolean canConvertString(String s, String t, int k) {\n    if (s.length() != t.length()) return false;\n    int[] used = new int[26];\n    for (int i = 0; i < s.length(); i++) {\n        int shift = ((t.charAt(i) - s.charAt(i)) % 26 + 26) % 26;\n        if (shift == 0) continue;\n        long move = (long) shift + 26L * used[shift];\n        used[shift]++;\n        if (move > k) return false;\n    }\n    return true;\n}`,
        cpp: `bool canConvertString(string s, string t, int k) {\n    if (s.size() != t.size()) return false;\n    vector<long long> used(26, 0);\n    for (size_t i = 0; i < s.size(); i++) {\n        int shift = ((t[i] - s[i]) % 26 + 26) % 26;\n        if (shift == 0) continue;\n        long long move = shift + 26LL * used[shift];\n        used[shift]++;\n        if (move > k) return false;\n    }\n    return true;\n}`,
        c: `bool canConvertString(char* s, char* t, int k) {\n    int n = (int) strlen(s);\n    if (n != (int) strlen(t)) return false;\n    long long used[26];\n    for (int i = 0; i < 26; i++) used[i] = 0;\n    for (int i = 0; i < n; i++) {\n        int shift = ((t[i] - s[i]) % 26 + 26) % 26;\n        if (shift == 0) continue;\n        long long move = shift + 26LL * used[shift];\n        used[shift]++;\n        if (move > k) return false;\n    }\n    return true;\n}`,
        csharp: `public static bool CanConvertString(string s, string t, int k)\n{\n    if (s.Length != t.Length) return false;\n    long[] used = new long[26];\n    for (int i = 0; i < s.Length; i++)\n    {\n        int shift = ((t[i] - s[i]) % 26 + 26) % 26;\n        if (shift == 0) continue;\n        long move = shift + 26L * used[shift];\n        used[shift]++;\n        if (move > k) return false;\n    }\n    return true;\n}`,
        go: `func canConvertString(s string, t string, k int) bool {\n\tif len(s) != len(t) {\n\t\treturn false\n\t}\n\tused := make([]int, 26)\n\tfor i := 0; i < len(s); i++ {\n\t\tshift := ((int(t[i]) - int(s[i])) % 26 + 26) % 26\n\t\tif shift == 0 {\n\t\t\tcontinue\n\t\t}\n\t\tmove := shift + 26*used[shift]\n\t\tused[shift]++\n\t\tif move > k {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun canConvertString(s: String, t: String, k: Int): Boolean {\n    if (s.length != t.length) return false\n    val used = LongArray(26)\n    for (i in s.indices) {\n        val shift = ((t[i] - s[i]) % 26 + 26) % 26\n        if (shift == 0) continue\n        val move = shift + 26L * used[shift]\n        used[shift]++\n        if (move > k) return false\n    }\n    return true\n}`,
        swift: `func canConvertString(_ s: String, _ t: String, _ k: Int) -> Bool {\n    let a = Array(s.utf8)\n    let b = Array(t.utf8)\n    if a.count != b.count { return false }\n    var used = [Int](repeating: 0, count: 26)\n    for i in 0..<a.count {\n        let shift = ((Int(b[i]) - Int(a[i])) % 26 + 26) % 26\n        if shift == 0 { continue }\n        let move = shift + 26 * used[shift]\n        used[shift] += 1\n        if move > k { return false }\n    }\n    return true\n}`,
        rust: `fn canConvertString(s: String, t: String, k: i32) -> bool {\n    let a = s.as_bytes();\n    let b = t.as_bytes();\n    if a.len() != b.len() {\n        return false;\n    }\n    let mut used = [0i64; 26];\n    for i in 0..a.len() {\n        let shift = (((b[i] as i32 - a[i] as i32) % 26) + 26) % 26;\n        if shift == 0 {\n            continue;\n        }\n        let idx = shift as usize;\n        let mv = shift as i64 + 26 * used[idx];\n        used[idx] += 1;\n        if mv > k as i64 {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function canConvertString($s, $t, $k) {\n    if (strlen($s) !== strlen($t)) return false;\n    $used = array_fill(0, 26, 0);\n    for ($i = 0; $i < strlen($s); $i++) {\n        $shift = ((ord($t[$i]) - ord($s[$i])) % 26 + 26) % 26;\n        if ($shift === 0) continue;\n        $move = $shift + 26 * $used[$shift];\n        $used[$shift]++;\n        if ($move > $k) return false;\n    }\n    return true;\n}`,
        ruby: `def canConvertString(s, t, k)\n  return false if s.length != t.length\n  used = Array.new(26, 0)\n  (0...s.length).each do |i|\n    shift = (t[i].ord - s[i].ord) % 26\n    next if shift == 0\n    move = shift + 26 * used[shift]\n    used[shift] += 1\n    return false if move > k\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Minimum Length of String After Deleting Similar Ends (LC 1750) ──
  (() => {
    const ref = (s: string) => {
      let lo = 0, hi = s.length - 1;
      while (lo < hi && s.charAt(lo) === s.charAt(hi)) {
        const c = s.charAt(lo);
        while (lo <= hi && s.charAt(lo) === c) lo++;
        while (hi >= lo && s.charAt(hi) === c) hi--;
      }
      return hi - lo + 1;
    };
    return {
      slug: "minimum-length-of-string-after-deleting-similar-ends",
      title: "Minimum Length of String After Deleting Similar Ends",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Two Pointers", "Amazon", "Adobe", "Wipro"],
      signature: { funcName: "minimumLength", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You may repeat this operation any number of times on a string `s`:\n\n1. pick a non-empty prefix of identical characters;\n2. pick a non-empty suffix of identical characters **made of the same character**;\n3. the prefix and suffix must not overlap;\n4. delete both.\n\nReturn the minimum length `s` can be reduced to.",
        [
          { in: 's = "ca"', out: "2", note: "The two ends differ, so nothing can be removed." },
          { in: 's = "cabaabac"', out: "0", note: "Strip c's, then a's, then b's, then the middle aa." },
          { in: 's = "aabccabba"', out: "3", note: 'After stripping the a\'s and then the b\'s, "cca" remains... the two pointers stop at "bca".' },
        ],
        ["1 <= s.length <= 100000", "s consists of the characters a, b and c."]),
      hints: [
        "Two pointers, one at each end.",
        "When the ends match, consume the **entire** run of that character from both sides.",
        "Stop as soon as the ends differ or the pointers meet.",
      ],
      editorial: explain({
        idea: "The operation only ever removes matching runs from the two ends, so a two-pointer walk that consumes whole runs simulates the best possible sequence of operations directly.",
        steps: [
          "Set `lo = 0` and `hi = n - 1`.",
          "While `lo < hi` and the two characters match, note the character and advance `lo` past its whole run, then retreat `hi` past its whole run — both guarded so the pointers cannot cross wildly.",
          "Return `hi - lo + 1`, which is `0` when the pointers crossed.",
        ],
        why: "Deleting less than a full run is never better: the leftover characters of that run are still at the end and still match, so the next operation could remove them anyway. Greedily removing whole runs therefore reaches the minimum, and the loop stops exactly when the ends stop matching — at which point no operation applies.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Removing one character per side instead of the whole run makes the loop do extra rounds but, worse, can stop early when the counts differ.",
          "The `lo <= hi` and `hi >= lo` guards inside the inner loops are what stop the pointers from running past each other on a uniform string.",
          "The answer can be `0`; returning `hi - lo` instead of `hi - lo + 1` is off by one.",
        ],
      }),
      examples: [
        { input: '"ca"', expectedOutput: "2" },
        { input: '"cabaabac"', expectedOutput: "0" },
        { input: '"aabccabba"', expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 40, "abc");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minimumLength(s: str) -> int:\n    lo, hi = 0, len(s) - 1\n    while lo < hi and s[lo] == s[hi]:\n        c = s[lo]\n        while lo <= hi and s[lo] == c:\n            lo += 1\n        while hi >= lo and s[hi] == c:\n            hi -= 1\n    return hi - lo + 1`,
        javascript: `var minimumLength = function(s) {\n    var lo = 0, hi = s.length - 1;\n    while (lo < hi && s.charAt(lo) === s.charAt(hi)) {\n        var c = s.charAt(lo);\n        while (lo <= hi && s.charAt(lo) === c) lo++;\n        while (hi >= lo && s.charAt(hi) === c) hi--;\n    }\n    return hi - lo + 1;\n};`,
        typescript: `function minimumLength(s: string): number {\n    var lo = 0, hi = s.length - 1;\n    while (lo < hi && s.charAt(lo) === s.charAt(hi)) {\n        var c = s.charAt(lo);\n        while (lo <= hi && s.charAt(lo) === c) lo++;\n        while (hi >= lo && s.charAt(hi) === c) hi--;\n    }\n    return hi - lo + 1;\n}`,
        java: `public static int minimumLength(String s) {\n    int lo = 0, hi = s.length() - 1;\n    while (lo < hi && s.charAt(lo) == s.charAt(hi)) {\n        char c = s.charAt(lo);\n        while (lo <= hi && s.charAt(lo) == c) lo++;\n        while (hi >= lo && s.charAt(hi) == c) hi--;\n    }\n    return hi - lo + 1;\n}`,
        cpp: `int minimumLength(string s) {\n    int lo = 0, hi = (int) s.size() - 1;\n    while (lo < hi && s[lo] == s[hi]) {\n        char c = s[lo];\n        while (lo <= hi && s[lo] == c) lo++;\n        while (hi >= lo && s[hi] == c) hi--;\n    }\n    return hi - lo + 1;\n}`,
        c: `int minimumLength(char* s) {\n    int lo = 0, hi = (int) strlen(s) - 1;\n    while (lo < hi && s[lo] == s[hi]) {\n        char c = s[lo];\n        while (lo <= hi && s[lo] == c) lo++;\n        while (hi >= lo && s[hi] == c) hi--;\n    }\n    return hi - lo + 1;\n}`,
        csharp: `public static int MinimumLength(string s)\n{\n    int lo = 0, hi = s.Length - 1;\n    while (lo < hi && s[lo] == s[hi])\n    {\n        char c = s[lo];\n        while (lo <= hi && s[lo] == c) lo++;\n        while (hi >= lo && s[hi] == c) hi--;\n    }\n    return hi - lo + 1;\n}`,
        go: `func minimumLength(s string) int {\n\tlo, hi := 0, len(s)-1\n\tfor lo < hi && s[lo] == s[hi] {\n\t\tc := s[lo]\n\t\tfor lo <= hi && s[lo] == c {\n\t\t\tlo++\n\t\t}\n\t\tfor hi >= lo && s[hi] == c {\n\t\t\thi--\n\t\t}\n\t}\n\treturn hi - lo + 1\n}`,
        kotlin: `fun minimumLength(s: String): Int {\n    var lo = 0\n    var hi = s.length - 1\n    while (lo < hi && s[lo] == s[hi]) {\n        val c = s[lo]\n        while (lo <= hi && s[lo] == c) lo++\n        while (hi >= lo && s[hi] == c) hi--\n    }\n    return hi - lo + 1\n}`,
        swift: `func minimumLength(_ s: String) -> Int {\n    let a = Array(s)\n    var lo = 0\n    var hi = a.count - 1\n    while lo < hi && a[lo] == a[hi] {\n        let c = a[lo]\n        while lo <= hi && a[lo] == c { lo += 1 }\n        while hi >= lo && a[hi] == c { hi -= 1 }\n    }\n    return hi - lo + 1\n}`,
        rust: `fn minimumLength(s: String) -> i32 {\n    let b = s.as_bytes();\n    let mut lo: i32 = 0;\n    let mut hi: i32 = b.len() as i32 - 1;\n    while lo < hi && b[lo as usize] == b[hi as usize] {\n        let c = b[lo as usize];\n        while lo <= hi && b[lo as usize] == c {\n            lo += 1;\n        }\n        while hi >= lo && b[hi as usize] == c {\n            hi -= 1;\n        }\n    }\n    hi - lo + 1\n}`,
        php: `function minimumLength($s) {\n    $lo = 0;\n    $hi = strlen($s) - 1;\n    while ($lo < $hi && $s[$lo] === $s[$hi]) {\n        $c = $s[$lo];\n        while ($lo <= $hi && $s[$lo] === $c) $lo++;\n        while ($hi >= $lo && $s[$hi] === $c) $hi--;\n    }\n    return $hi - $lo + 1;\n}`,
        ruby: `def minimumLength(s)\n  lo = 0\n  hi = s.length - 1\n  while lo < hi && s[lo] == s[hi]\n    c = s[lo]\n    lo += 1 while lo <= hi && s[lo] == c\n    hi -= 1 while hi >= lo && s[hi] == c\n  end\n  hi - lo + 1\nend`,
      },
    };
  })(),

  // ── Number of Good Ways to Split a String (LC 1525) ─────────────
  (() => {
    const ref = (s: string) => {
      const n = s.length;
      const right = new Array(n).fill(0);
      const count = new Array(26).fill(0);
      let distinct = 0;
      for (let i = n - 1; i >= 0; i--) {
        const c = s.charCodeAt(i) - 97;
        if (count[c] === 0) distinct++;
        count[c]++;
        right[i] = distinct;
      }
      const seen = new Array(26).fill(0);
      let leftDistinct = 0, total = 0;
      for (let i = 0; i + 1 < n; i++) {
        const c = s.charCodeAt(i) - 97;
        if (seen[c] === 0) leftDistinct++;
        seen[c]++;
        if (leftDistinct === right[i + 1]) total++;
      }
      return total;
    };
    return {
      slug: "number-of-good-ways-to-split-a-string",
      title: "Number of Good Ways to Split a String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Hash Table", "Prefix Sum", "Amazon", "Google", "Zomato"],
      signature: { funcName: "numSplits", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A split of `s` into two non-empty parts `sLeft + sRight` is **good** when the number of **distinct** letters in `sLeft` equals the number of distinct letters in `sRight`.\n\nReturn how many good splits exist.",
        [
          { in: 's = "aacaba"', out: "2", note: 'Splitting after index 1 gives ("aa","caba") — 1 vs 3. The good splits are after index 2 and after index 3.' },
          { in: 's = "abcd"', out: "1", note: 'Only ("ab","cd") balances at 2 and 2.' },
          { in: 's = "aaaaa"', out: "4", note: "Every split gives 1 distinct letter on each side." },
        ],
        ["2 <= s.length <= 100000", "s consists of lowercase English letters."]),
      hints: [
        "For each cut position you need two numbers: distinct on the left and distinct on the right.",
        "One right-to-left pass can precompute the suffix distinct count at every index.",
        "Then a left-to-right pass grows the prefix set and compares.",
      ],
      editorial: explain({
        idea: "Precompute the suffix distinct count for every index in one backward pass, then sweep forward maintaining the prefix distinct count and compare at each cut.",
        steps: [
          "Walk `i` from `n-1` down to `0`, inserting `s[i]` into a counting array and recording `right[i]` — the number of distinct letters in `s[i..n-1]`.",
          "Walk `i` from `0` to `n-2`, inserting `s[i]` into a second counting array and tracking `leftDistinct`.",
          "The cut after index `i` is good when `leftDistinct == right[i + 1]`; count those.",
        ],
        why: "`right[i+1]` is exactly the distinct count of the suffix that begins right after the cut, and `leftDistinct` after inserting `s[i]` is exactly the distinct count of the prefix through `i` — the two quantities the definition compares. Stopping at `n-2` keeps both parts non-empty.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Cutting after the last character leaves an empty right part, which is not allowed.",
          "Recomputing the suffix distinct count inside the forward loop turns a linear solution quadratic.",
          "Using a set of characters rather than counts makes the backward pass harder to get right — a counting array with a 'first sighting' test is simpler.",
        ],
      }),
      examples: [
        { input: '"aacaba"', expectedOutput: "2" },
        { input: '"abcd"', expectedOutput: "1" },
        { input: '"aaaaa"', expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.5 ? "abc" : "abcdef";
        const s = randLower(rng, 2, 50, alphabet);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def numSplits(s: str) -> int:\n    n = len(s)\n    right = [0] * n\n    count = [0] * 26\n    distinct = 0\n    for i in range(n - 1, -1, -1):\n        c = ord(s[i]) - 97\n        if count[c] == 0:\n            distinct += 1\n        count[c] += 1\n        right[i] = distinct\n    seen = [0] * 26\n    left_distinct = 0\n    total = 0\n    for i in range(n - 1):\n        c = ord(s[i]) - 97\n        if seen[c] == 0:\n            left_distinct += 1\n        seen[c] += 1\n        if left_distinct == right[i + 1]:\n            total += 1\n    return total`,
        javascript: `var numSplits = function(s) {\n    var n = s.length;\n    var right = [], count = [];\n    for (var t = 0; t < n; t++) right.push(0);\n    for (var u = 0; u < 26; u++) count.push(0);\n    var distinct = 0;\n    for (var i = n - 1; i >= 0; i--) {\n        var c = s.charCodeAt(i) - 97;\n        if (count[c] === 0) distinct++;\n        count[c]++;\n        right[i] = distinct;\n    }\n    var seen = [];\n    for (var v = 0; v < 26; v++) seen.push(0);\n    var leftDistinct = 0, total = 0;\n    for (var j = 0; j + 1 < n; j++) {\n        var d = s.charCodeAt(j) - 97;\n        if (seen[d] === 0) leftDistinct++;\n        seen[d]++;\n        if (leftDistinct === right[j + 1]) total++;\n    }\n    return total;\n};`,
        typescript: `function numSplits(s: string): number {\n    var n = s.length;\n    var right: number[] = [], count: number[] = [];\n    for (var t = 0; t < n; t++) right.push(0);\n    for (var u = 0; u < 26; u++) count.push(0);\n    var distinct = 0;\n    for (var i = n - 1; i >= 0; i--) {\n        var c = s.charCodeAt(i) - 97;\n        if (count[c] === 0) distinct++;\n        count[c]++;\n        right[i] = distinct;\n    }\n    var seen: number[] = [];\n    for (var v = 0; v < 26; v++) seen.push(0);\n    var leftDistinct = 0, total = 0;\n    for (var j = 0; j + 1 < n; j++) {\n        var d = s.charCodeAt(j) - 97;\n        if (seen[d] === 0) leftDistinct++;\n        seen[d]++;\n        if (leftDistinct === right[j + 1]) total++;\n    }\n    return total;\n}`,
        java: `public static int numSplits(String s) {\n    int n = s.length();\n    int[] right = new int[n];\n    int[] count = new int[26];\n    int distinct = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        int c = s.charAt(i) - 'a';\n        if (count[c] == 0) distinct++;\n        count[c]++;\n        right[i] = distinct;\n    }\n    int[] seen = new int[26];\n    int leftDistinct = 0, total = 0;\n    for (int i = 0; i + 1 < n; i++) {\n        int c = s.charAt(i) - 'a';\n        if (seen[c] == 0) leftDistinct++;\n        seen[c]++;\n        if (leftDistinct == right[i + 1]) total++;\n    }\n    return total;\n}`,
        cpp: `int numSplits(string s) {\n    int n = (int) s.size();\n    vector<int> right(n, 0), count(26, 0);\n    int distinct = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        int c = s[i] - 'a';\n        if (count[c] == 0) distinct++;\n        count[c]++;\n        right[i] = distinct;\n    }\n    vector<int> seen(26, 0);\n    int leftDistinct = 0, total = 0;\n    for (int i = 0; i + 1 < n; i++) {\n        int c = s[i] - 'a';\n        if (seen[c] == 0) leftDistinct++;\n        seen[c]++;\n        if (leftDistinct == right[i + 1]) total++;\n    }\n    return total;\n}`,
        c: `int numSplits(char* s) {\n    int n = (int) strlen(s);\n    int* right = (int*) calloc((size_t) n, sizeof(int));\n    int count[26];\n    memset(count, 0, sizeof(count));\n    int distinct = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        int c = s[i] - 'a';\n        if (count[c] == 0) distinct++;\n        count[c]++;\n        right[i] = distinct;\n    }\n    int seen[26];\n    memset(seen, 0, sizeof(seen));\n    int leftDistinct = 0, total = 0;\n    for (int i = 0; i + 1 < n; i++) {\n        int c = s[i] - 'a';\n        if (seen[c] == 0) leftDistinct++;\n        seen[c]++;\n        if (leftDistinct == right[i + 1]) total++;\n    }\n    free(right);\n    return total;\n}`,
        csharp: `public static int NumSplits(string s)\n{\n    int n = s.Length;\n    int[] right = new int[n];\n    int[] count = new int[26];\n    int distinct = 0;\n    for (int i = n - 1; i >= 0; i--)\n    {\n        int c = s[i] - 'a';\n        if (count[c] == 0) distinct++;\n        count[c]++;\n        right[i] = distinct;\n    }\n    int[] seen = new int[26];\n    int leftDistinct = 0, total = 0;\n    for (int i = 0; i + 1 < n; i++)\n    {\n        int c = s[i] - 'a';\n        if (seen[c] == 0) leftDistinct++;\n        seen[c]++;\n        if (leftDistinct == right[i + 1]) total++;\n    }\n    return total;\n}`,
        go: `func numSplits(s string) int {\n\tn := len(s)\n\tright := make([]int, n)\n\tcount := make([]int, 26)\n\tdistinct := 0\n\tfor i := n - 1; i >= 0; i-- {\n\t\tc := int(s[i] - \'a\')\n\t\tif count[c] == 0 {\n\t\t\tdistinct++\n\t\t}\n\t\tcount[c]++\n\t\tright[i] = distinct\n\t}\n\tseen := make([]int, 26)\n\tleftDistinct, total := 0, 0\n\tfor i := 0; i+1 < n; i++ {\n\t\tc := int(s[i] - \'a\')\n\t\tif seen[c] == 0 {\n\t\t\tleftDistinct++\n\t\t}\n\t\tseen[c]++\n\t\tif leftDistinct == right[i+1] {\n\t\t\ttotal++\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun numSplits(s: String): Int {\n    val n = s.length\n    val right = IntArray(n)\n    val count = IntArray(26)\n    var distinct = 0\n    for (i in n - 1 downTo 0) {\n        val c = s[i] - \'a\'\n        if (count[c] == 0) distinct++\n        count[c]++\n        right[i] = distinct\n    }\n    val seen = IntArray(26)\n    var leftDistinct = 0\n    var total = 0\n    for (i in 0 until n - 1) {\n        val c = s[i] - \'a\'\n        if (seen[c] == 0) leftDistinct++\n        seen[c]++\n        if (leftDistinct == right[i + 1]) total++\n    }\n    return total\n}`,
        swift: `func numSplits(_ s: String) -> Int {\n    let a = Array(s.utf8).map { Int($0) - 97 }\n    let n = a.count\n    var right = [Int](repeating: 0, count: n)\n    var count = [Int](repeating: 0, count: 26)\n    var distinct = 0\n    var i = n - 1\n    while i >= 0 {\n        if count[a[i]] == 0 { distinct += 1 }\n        count[a[i]] += 1\n        right[i] = distinct\n        i -= 1\n    }\n    var seen = [Int](repeating: 0, count: 26)\n    var leftDistinct = 0\n    var total = 0\n    for j in 0..<(n - 1) {\n        if seen[a[j]] == 0 { leftDistinct += 1 }\n        seen[a[j]] += 1\n        if leftDistinct == right[j + 1] { total += 1 }\n    }\n    return total\n}`,
        rust: `fn numSplits(s: String) -> i32 {\n    let b = s.as_bytes();\n    let n = b.len();\n    let mut right = vec![0i32; n];\n    let mut count = [0i32; 26];\n    let mut distinct = 0i32;\n    for i in (0..n).rev() {\n        let c = (b[i] - b\'a\') as usize;\n        if count[c] == 0 {\n            distinct += 1;\n        }\n        count[c] += 1;\n        right[i] = distinct;\n    }\n    let mut seen = [0i32; 26];\n    let mut left_distinct = 0i32;\n    let mut total = 0i32;\n    for i in 0..n - 1 {\n        let c = (b[i] - b\'a\') as usize;\n        if seen[c] == 0 {\n            left_distinct += 1;\n        }\n        seen[c] += 1;\n        if left_distinct == right[i + 1] {\n            total += 1;\n        }\n    }\n    total\n}`,
        php: `function numSplits($s) {\n    $n = strlen($s);\n    $right = array_fill(0, $n, 0);\n    $count = array_fill(0, 26, 0);\n    $distinct = 0;\n    for ($i = $n - 1; $i >= 0; $i--) {\n        $c = ord($s[$i]) - 97;\n        if ($count[$c] === 0) $distinct++;\n        $count[$c]++;\n        $right[$i] = $distinct;\n    }\n    $seen = array_fill(0, 26, 0);\n    $leftDistinct = 0;\n    $total = 0;\n    for ($i = 0; $i + 1 < $n; $i++) {\n        $c = ord($s[$i]) - 97;\n        if ($seen[$c] === 0) $leftDistinct++;\n        $seen[$c]++;\n        if ($leftDistinct === $right[$i + 1]) $total++;\n    }\n    return $total;\n}`,
        ruby: `def numSplits(s)\n  n = s.length\n  right = Array.new(n, 0)\n  count = Array.new(26, 0)\n  distinct = 0\n  (n - 1).downto(0) do |i|\n    c = s[i].ord - 97\n    distinct += 1 if count[c] == 0\n    count[c] += 1\n    right[i] = distinct\n  end\n  seen = Array.new(26, 0)\n  left_distinct = 0\n  total = 0\n  (0...(n - 1)).each do |i|\n    c = s[i].ord - 97\n    left_distinct += 1 if seen[c] == 0\n    seen[c] += 1\n    total += 1 if left_distinct == right[i + 1]\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Shortest Palindrome (LC 214) ────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const n = s.length;
      if (n === 0) return "";
      let rev = "";
      for (let i = n - 1; i >= 0; i--) rev += s.charAt(i);
      const combined = s + "#" + rev;
      const fail = new Array(combined.length).fill(0);
      for (let i = 1; i < combined.length; i++) {
        let j = fail[i - 1];
        while (j > 0 && combined.charAt(i) !== combined.charAt(j)) j = fail[j - 1];
        if (combined.charAt(i) === combined.charAt(j)) j++;
        fail[i] = j;
      }
      const keep = fail[combined.length - 1];
      let head = "";
      for (let i = n - 1; i >= keep; i--) head += s.charAt(i);
      return head + s;
    };
    return {
      slug: "shortest-palindrome",
      title: "Shortest Palindrome",
      difficulty: "HARD" as const,
      tags: ["String", "KMP", "Rolling Hash", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "shortestPalindrome", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You may add characters **in front of** `s` to turn it into a palindrome.\n\nReturn the shortest palindrome you can make this way.",
        [
          { in: 's = "aacecaaa"', out: "aaacecaaa", note: 'The longest palindromic prefix is "aacecaa", so only one "a" needs prepending.' },
          { in: 's = "abcd"', out: "dcbabcd", note: 'Only "a" is a palindromic prefix, so "dcb" is prepended.' },
          { in: 's = "kairo"', out: "oriakairo" },
        ],
        ["0 <= s.length <= 50000", "s consists of lowercase English letters."]),
      hints: [
        "You only ever prepend, so the tail of the answer is `s` itself. The question is the length of the longest **palindromic prefix** of `s`.",
        "Everything after that prefix has to be mirrored in front, reversed.",
        "Finding the longest palindromic prefix is the same as finding the longest prefix of `s` that is also a suffix of `reverse(s)` — which is exactly what KMP's failure function computes on `s + \"#\" + reverse(s)`.",
      ],
      editorial: explain({
        idea: "Let `p` be the longest palindromic prefix of `s`. The answer is `reverse(s[p..]) + s`, because everything beyond the prefix must be mirrored in front and nothing shorter can work. Computing `p` is a classic KMP trick.",
        steps: [
          "Build `combined = s + \"#\" + reverse(s)`. The separator `#` stops a match from spanning the two halves.",
          "Run KMP's failure function over `combined`. Its last value is the length of the longest prefix of `s` that is also a suffix of `reverse(s)` — that is, the longest palindromic prefix of `s`.",
          "Call that length `keep`. Prepend `reverse(s[keep..n-1])` to `s`.",
        ],
        why: "A prefix of `s` equals a suffix of `reverse(s)` exactly when that prefix reads the same forwards and backwards. Any palindrome built by prepending must contain `s` as a suffix, so its first `n - p` characters are forced to mirror `s[p..]`; taking the *longest* palindromic prefix therefore minimises what is prepended.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Omitting the `#` separator lets the failure function report a match longer than `s`, giving nonsense on inputs like `\"aaaa\"`.",
          "Checking each prefix for being a palindrome directly is O(n²) and times out at the stated limit.",
          "An empty input must return the empty string, not crash on `s[n-1]`.",
        ],
      }),
      examples: [
        { input: '"aacecaaa"', expectedOutput: "aaacecaaa" },
        { input: '"abcd"', expectedOutput: "dcbabcd" },
        { input: '"kairo"', expectedOutput: "oriakairo" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.5 ? "ab" : "abcde";
        let s = randLower(rng, 1, 30, alphabet);
        if (rng() < 0.3) {
          // Seed a palindromic prefix so the interesting branch is exercised.
          const half = randLower(rng, 1, 5, alphabet);
          let mirror = "";
          for (let i = half.length - 1; i >= 0; i--) mirror += half.charAt(i);
          s = half + mirror + s;
        }
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def shortestPalindrome(s: str) -> str:\n    n = len(s)\n    if n == 0:\n        return ""\n    combined = s + "#" + s[::-1]\n    fail = [0] * len(combined)\n    for i in range(1, len(combined)):\n        j = fail[i - 1]\n        while j > 0 and combined[i] != combined[j]:\n            j = fail[j - 1]\n        if combined[i] == combined[j]:\n            j += 1\n        fail[i] = j\n    keep = fail[-1]\n    return s[keep:][::-1] + s`,
        javascript: `var shortestPalindrome = function(s) {\n    var n = s.length;\n    if (n === 0) return "";\n    var rev = "";\n    for (var i = n - 1; i >= 0; i--) rev += s.charAt(i);\n    var combined = s + "#" + rev;\n    var fail = [];\n    for (var t = 0; t < combined.length; t++) fail.push(0);\n    for (var p = 1; p < combined.length; p++) {\n        var j = fail[p - 1];\n        while (j > 0 && combined.charAt(p) !== combined.charAt(j)) j = fail[j - 1];\n        if (combined.charAt(p) === combined.charAt(j)) j++;\n        fail[p] = j;\n    }\n    var keep = fail[combined.length - 1];\n    var head = "";\n    for (var q = n - 1; q >= keep; q--) head += s.charAt(q);\n    return head + s;\n};`,
        typescript: `function shortestPalindrome(s: string): string {\n    var n = s.length;\n    if (n === 0) return "";\n    var rev = "";\n    for (var i = n - 1; i >= 0; i--) rev += s.charAt(i);\n    var combined = s + "#" + rev;\n    var fail: number[] = [];\n    for (var t = 0; t < combined.length; t++) fail.push(0);\n    for (var p = 1; p < combined.length; p++) {\n        var j = fail[p - 1];\n        while (j > 0 && combined.charAt(p) !== combined.charAt(j)) j = fail[j - 1];\n        if (combined.charAt(p) === combined.charAt(j)) j++;\n        fail[p] = j;\n    }\n    var keep = fail[combined.length - 1];\n    var head = "";\n    for (var q = n - 1; q >= keep; q--) head += s.charAt(q);\n    return head + s;\n}`,
        java: `public static String shortestPalindrome(String s) {\n    int n = s.length();\n    if (n == 0) return "";\n    String rev = new StringBuilder(s).reverse().toString();\n    String combined = s + "#" + rev;\n    int[] fail = new int[combined.length()];\n    for (int i = 1; i < combined.length(); i++) {\n        int j = fail[i - 1];\n        while (j > 0 && combined.charAt(i) != combined.charAt(j)) j = fail[j - 1];\n        if (combined.charAt(i) == combined.charAt(j)) j++;\n        fail[i] = j;\n    }\n    int keep = fail[combined.length() - 1];\n    return new StringBuilder(s.substring(keep)).reverse().toString() + s;\n}`,
        cpp: `string shortestPalindrome(string s) {\n    int n = (int) s.size();\n    if (n == 0) return "";\n    string rev(s.rbegin(), s.rend());\n    string combined = s + "#" + rev;\n    vector<int> fail(combined.size(), 0);\n    for (size_t i = 1; i < combined.size(); i++) {\n        int j = fail[i - 1];\n        while (j > 0 && combined[i] != combined[j]) j = fail[j - 1];\n        if (combined[i] == combined[j]) j++;\n        fail[i] = j;\n    }\n    int keep = fail[combined.size() - 1];\n    string head = s.substr(keep);\n    reverse(head.begin(), head.end());\n    return head + s;\n}`,
        c: `char* shortestPalindrome(char* s) {\n    int n = (int) strlen(s);\n    char* out = (char*) malloc((size_t) (2 * n + 2));\n    if (n == 0) { out[0] = 0; return out; }\n    int clen = 2 * n + 1;\n    char* combined = (char*) malloc((size_t) clen + 1);\n    memcpy(combined, s, (size_t) n);\n    combined[n] = '#';\n    for (int i = 0; i < n; i++) combined[n + 1 + i] = s[n - 1 - i];\n    combined[clen] = 0;\n    int* fail = (int*) calloc((size_t) clen, sizeof(int));\n    for (int i = 1; i < clen; i++) {\n        int j = fail[i - 1];\n        while (j > 0 && combined[i] != combined[j]) j = fail[j - 1];\n        if (combined[i] == combined[j]) j++;\n        fail[i] = j;\n    }\n    int keep = fail[clen - 1];\n    int m = 0;\n    for (int i = n - 1; i >= keep; i--) out[m++] = s[i];\n    memcpy(out + m, s, (size_t) n);\n    out[m + n] = 0;\n    free(combined);\n    free(fail);\n    return out;\n}`,
        csharp: `public static string ShortestPalindrome(string s)\n{\n    int n = s.Length;\n    if (n == 0) return "";\n    char[] revArr = s.ToCharArray();\n    Array.Reverse(revArr);\n    string rev = new string(revArr);\n    string combined = s + "#" + rev;\n    int[] fail = new int[combined.Length];\n    for (int i = 1; i < combined.Length; i++)\n    {\n        int j = fail[i - 1];\n        while (j > 0 && combined[i] != combined[j]) j = fail[j - 1];\n        if (combined[i] == combined[j]) j++;\n        fail[i] = j;\n    }\n    int keep = fail[combined.Length - 1];\n    char[] headArr = s.Substring(keep).ToCharArray();\n    Array.Reverse(headArr);\n    return new string(headArr) + s;\n}`,
        go: `func shortestPalindrome(s string) string {\n\tn := len(s)\n\tif n == 0 {\n\t\treturn ""\n\t}\n\trev := make([]byte, n)\n\tfor i := 0; i < n; i++ {\n\t\trev[i] = s[n-1-i]\n\t}\n\tcombined := s + "#" + string(rev)\n\tfail := make([]int, len(combined))\n\tfor i := 1; i < len(combined); i++ {\n\t\tj := fail[i-1]\n\t\tfor j > 0 && combined[i] != combined[j] {\n\t\t\tj = fail[j-1]\n\t\t}\n\t\tif combined[i] == combined[j] {\n\t\t\tj++\n\t\t}\n\t\tfail[i] = j\n\t}\n\tkeep := fail[len(combined)-1]\n\thead := make([]byte, 0, n-keep)\n\tfor i := n - 1; i >= keep; i-- {\n\t\thead = append(head, s[i])\n\t}\n\treturn string(head) + s\n}`,
        kotlin: `fun shortestPalindrome(s: String): String {\n    val n = s.length\n    if (n == 0) return ""\n    val rev = s.reversed()\n    val combined = s + "#" + rev\n    val fail = IntArray(combined.length)\n    for (i in 1 until combined.length) {\n        var j = fail[i - 1]\n        while (j > 0 && combined[i] != combined[j]) j = fail[j - 1]\n        if (combined[i] == combined[j]) j++\n        fail[i] = j\n    }\n    val keep = fail[combined.length - 1]\n    return s.substring(keep).reversed() + s\n}`,
        swift: `func shortestPalindrome(_ s: String) -> String {\n    let a = Array(s)\n    let n = a.count\n    if n == 0 { return "" }\n    var combined = a\n    combined.append("#")\n    combined.append(contentsOf: a.reversed())\n    var fail = [Int](repeating: 0, count: combined.count)\n    for i in 1..<combined.count {\n        var j = fail[i - 1]\n        while j > 0 && combined[i] != combined[j] { j = fail[j - 1] }\n        if combined[i] == combined[j] { j += 1 }\n        fail[i] = j\n    }\n    let keep = fail[combined.count - 1]\n    let head = String(a[keep..<n].reversed())\n    return head + s\n}`,
        rust: `fn shortestPalindrome(s: String) -> String {\n    let a = s.as_bytes().to_vec();\n    let n = a.len();\n    if n == 0 {\n        return String::new();\n    }\n    let mut combined: Vec<u8> = a.clone();\n    combined.push(b\'#\');\n    for i in (0..n).rev() {\n        combined.push(a[i]);\n    }\n    let mut fail = vec![0usize; combined.len()];\n    for i in 1..combined.len() {\n        let mut j = fail[i - 1];\n        while j > 0 && combined[i] != combined[j] {\n            j = fail[j - 1];\n        }\n        if combined[i] == combined[j] {\n            j += 1;\n        }\n        fail[i] = j;\n    }\n    let keep = fail[combined.len() - 1];\n    let mut out: Vec<u8> = Vec::new();\n    for i in (keep..n).rev() {\n        out.push(a[i]);\n    }\n    out.extend_from_slice(&a);\n    String::from_utf8(out).unwrap()\n}`,
        php: `function shortestPalindrome($s) {\n    $n = strlen($s);\n    if ($n === 0) return "";\n    $rev = strrev($s);\n    $combined = $s . "#" . $rev;\n    $len = strlen($combined);\n    $fail = array_fill(0, $len, 0);\n    for ($i = 1; $i < $len; $i++) {\n        $j = $fail[$i - 1];\n        while ($j > 0 && $combined[$i] !== $combined[$j]) $j = $fail[$j - 1];\n        if ($combined[$i] === $combined[$j]) $j++;\n        $fail[$i] = $j;\n    }\n    $keep = $fail[$len - 1];\n    return strrev(substr($s, $keep)) . $s;\n}`,
        ruby: `def shortestPalindrome(s)\n  n = s.length\n  return "" if n == 0\n  combined = s + "#" + s.reverse\n  fail_arr = Array.new(combined.length, 0)\n  (1...combined.length).each do |i|\n    j = fail_arr[i - 1]\n    j = fail_arr[j - 1] while j > 0 && combined[i] != combined[j]\n    j += 1 if combined[i] == combined[j]\n    fail_arr[i] = j\n  end\n  keep = fail_arr[-1]\n  s[keep..-1].reverse + s\nend`,
      },
    };
  })(),

  // ── Word Subsets (LC 916) ───────────────────────────────────────
  (() => {
    const counts = (w: string) => {
      const c = new Array(26).fill(0);
      for (let i = 0; i < w.length; i++) c[w.charCodeAt(i) - 97]++;
      return c;
    };
    const ref = (words1: string[], words2: string[]) => {
      const need = new Array(26).fill(0);
      for (const w of words2) {
        const c = counts(w);
        for (let i = 0; i < 26; i++) { if (c[i] > need[i]) need[i] = c[i]; }
      }
      const out: string[] = [];
      for (const w of words1) {
        const c = counts(w);
        let ok = true;
        for (let i = 0; i < 26; i++) { if (c[i] < need[i]) { ok = false; break; } }
        if (ok) out.push(w);
      }
      return out;
    };
    return {
      slug: "word-subsets",
      title: "Word Subsets",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Hash Table", "Counting", "Amazon", "Google", "Uber"],
      signature: { funcName: "wordSubsets", params: [{ name: "words1", type: "string[]" as const }, { name: "words2", type: "string[]" as const }], returns: "string[]" as const },
      description: describe(
        "String `b` is a **subset** of string `a` if every letter of `b` occurs in `a` at least as many times as it occurs in `b`.\n\nA word in `words1` is **universal** if every word in `words2` is a subset of it. Return all universal words, in their original order.",
        [
          { in: 'words1 = ["amazon","apple","facebook","google","leetcode"], words2 = ["e","o"]', out: '["facebook","google","leetcode"]' },
          { in: 'words1 = ["codekairo","kairo","code"], words2 = ["ko","a"]', out: '["codekairo","kairo"]', note: '"code" has no a or k... it lacks both letters of "ko" beyond the o.' },
          { in: 'words1 = ["aaa","bbb"], words2 = ["aa"]', out: '["aaa"]' },
        ],
        ["1 <= words1.length, words2.length <= 10000", "1 <= word length <= 10", "All strings consist of lowercase English letters."]),
      hints: [
        "Checking each word of `words1` against each word of `words2` is too slow.",
        "Collapse `words2` into a single requirement: for each letter, the **maximum** count demanded by any single word.",
        "Then one word of `words1` is universal exactly when its letter counts dominate that requirement.",
      ],
      editorial: explain({
        idea: "Being a superset of every word in `words2` is the same as being a superset of their per-letter maximum. Collapsing `words2` into one 26-slot requirement turns the whole problem into a single comparison per candidate.",
        steps: [
          "Build `need[26]`, where `need[c]` is the largest number of times letter `c` appears in any single word of `words2`.",
          "For each word of `words1`, count its letters.",
          "Keep the word when `count[c] >= need[c]` for all 26 letters.",
        ],
        why: "The subset relation is per-letter and per-word, so satisfying every word at once means meeting each letter's largest single demand. Taking a maximum (not a sum) is the key: `[\"lo\",\"eo\"]` needs one `l`, one `e` and one `o`, not two `o`s.",
        time: "O(total length of both lists)",
        space: "O(1) — two 26-slot arrays",
        pitfalls: [
          "Summing the counts across `words2` instead of taking the maximum over-demands repeated letters.",
          "Comparing word lengths rather than per-letter counts accepts words with the right size but the wrong letters.",
        ],
      }),
      examples: [
        { input: '["amazon","apple","facebook","google","leetcode"]\n["e","o"]', expectedOutput: '["facebook","google","leetcode"]' },
        { input: '["codekairo","kairo","code"]\n["ko","a"]', expectedOutput: '["codekairo","kairo"]' },
        { input: '["aaa","bbb"]\n["aa"]', expectedOutput: '["aaa"]' },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcde";
        const words1 = Array.from({ length: ri(rng, 1, 10) }, () => randLower(rng, 1, 8, alphabet));
        const words2 = Array.from({ length: ri(rng, 1, 4) }, () => randLower(rng, 1, 3, alphabet));
        return { input: `${fmtStrArr(words1)}\n${fmtStrArr(words2)}`, expectedOutput: fmtStrArr(ref(words1, words2)) };
      },
      solutions: {
        python: `from typing import List\n\ndef wordSubsets(words1: List[str], words2: List[str]) -> List[str]:\n    need = [0] * 26\n    for w in words2:\n        c = [0] * 26\n        for ch in w:\n            c[ord(ch) - 97] += 1\n        for i in range(26):\n            need[i] = max(need[i], c[i])\n    out = []\n    for w in words1:\n        c = [0] * 26\n        for ch in w:\n            c[ord(ch) - 97] += 1\n        if all(c[i] >= need[i] for i in range(26)):\n            out.append(w)\n    return out`,
        javascript: `var wordSubsets = function(words1, words2) {\n    var counts = function(w) {\n        var c = [];\n        for (var t = 0; t < 26; t++) c.push(0);\n        for (var i = 0; i < w.length; i++) c[w.charCodeAt(i) - 97]++;\n        return c;\n    };\n    var need = [];\n    for (var u = 0; u < 26; u++) need.push(0);\n    for (var j = 0; j < words2.length; j++) {\n        var c2 = counts(words2[j]);\n        for (var k = 0; k < 26; k++) {\n            if (c2[k] > need[k]) need[k] = c2[k];\n        }\n    }\n    var out = [];\n    for (var m = 0; m < words1.length; m++) {\n        var c1 = counts(words1[m]);\n        var ok = true;\n        for (var p = 0; p < 26; p++) {\n            if (c1[p] < need[p]) { ok = false; break; }\n        }\n        if (ok) out.push(words1[m]);\n    }\n    return out;\n};`,
        typescript: `function wordSubsets(words1: string[], words2: string[]): string[] {\n    var counts = function(w: string): number[] {\n        var c: number[] = [];\n        for (var t = 0; t < 26; t++) c.push(0);\n        for (var i = 0; i < w.length; i++) c[w.charCodeAt(i) - 97]++;\n        return c;\n    };\n    var need: number[] = [];\n    for (var u = 0; u < 26; u++) need.push(0);\n    for (var j = 0; j < words2.length; j++) {\n        var c2 = counts(words2[j]);\n        for (var k = 0; k < 26; k++) {\n            if (c2[k] > need[k]) need[k] = c2[k];\n        }\n    }\n    var out: string[] = [];\n    for (var m = 0; m < words1.length; m++) {\n        var c1 = counts(words1[m]);\n        var ok = true;\n        for (var p = 0; p < 26; p++) {\n            if (c1[p] < need[p]) { ok = false; break; }\n        }\n        if (ok) out.push(words1[m]);\n    }\n    return out;\n}`,
        java: `public static String[] wordSubsets(String[] words1, String[] words2) {\n    int[] need = new int[26];\n    for (String w : words2) {\n        int[] c = new int[26];\n        for (int i = 0; i < w.length(); i++) c[w.charAt(i) - 'a']++;\n        for (int i = 0; i < 26; i++) need[i] = Math.max(need[i], c[i]);\n    }\n    List<String> out = new ArrayList<>();\n    for (String w : words1) {\n        int[] c = new int[26];\n        for (int i = 0; i < w.length(); i++) c[w.charAt(i) - 'a']++;\n        boolean ok = true;\n        for (int i = 0; i < 26; i++) {\n            if (c[i] < need[i]) { ok = false; break; }\n        }\n        if (ok) out.add(w);\n    }\n    return out.toArray(new String[0]);\n}`,
        cpp: `vector<string> wordSubsets(vector<string>& words1, vector<string>& words2) {\n    vector<int> need(26, 0);\n    for (const string& w : words2) {\n        vector<int> c(26, 0);\n        for (char ch : w) c[ch - 'a']++;\n        for (int i = 0; i < 26; i++) need[i] = max(need[i], c[i]);\n    }\n    vector<string> out;\n    for (const string& w : words1) {\n        vector<int> c(26, 0);\n        for (char ch : w) c[ch - 'a']++;\n        bool ok = true;\n        for (int i = 0; i < 26; i++) {\n            if (c[i] < need[i]) { ok = false; break; }\n        }\n        if (ok) out.push_back(w);\n    }\n    return out;\n}`,
        c: `char** wordSubsets(char** words1, int words1Size, char** words2, int words2Size, int* returnSize) {\n    int need[26];\n    memset(need, 0, sizeof(need));\n    for (int j = 0; j < words2Size; j++) {\n        int c[26];\n        memset(c, 0, sizeof(c));\n        for (int i = 0; words2[j][i]; i++) c[words2[j][i] - 'a']++;\n        for (int i = 0; i < 26; i++) {\n            if (c[i] > need[i]) need[i] = c[i];\n        }\n    }\n    char** out = (char**) malloc((size_t) words1Size * sizeof(char*));\n    int m = 0;\n    for (int j = 0; j < words1Size; j++) {\n        int c[26];\n        memset(c, 0, sizeof(c));\n        for (int i = 0; words1[j][i]; i++) c[words1[j][i] - 'a']++;\n        int ok = 1;\n        for (int i = 0; i < 26; i++) {\n            if (c[i] < need[i]) { ok = 0; break; }\n        }\n        if (ok) {\n            char* copy = (char*) malloc(strlen(words1[j]) + 1);\n            strcpy(copy, words1[j]);\n            out[m++] = copy;\n        }\n    }\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static string[] WordSubsets(string[] words1, string[] words2)\n{\n    int[] need = new int[26];\n    foreach (string w in words2)\n    {\n        int[] c = new int[26];\n        foreach (char ch in w) c[ch - 'a']++;\n        for (int i = 0; i < 26; i++) need[i] = Math.Max(need[i], c[i]);\n    }\n    var out_ = new List<string>();\n    foreach (string w in words1)\n    {\n        int[] c = new int[26];\n        foreach (char ch in w) c[ch - 'a']++;\n        bool ok = true;\n        for (int i = 0; i < 26; i++)\n        {\n            if (c[i] < need[i]) { ok = false; break; }\n        }\n        if (ok) out_.Add(w);\n    }\n    return out_.ToArray();\n}`,
        go: `func wordSubsets(words1 []string, words2 []string) []string {\n\tneed := make([]int, 26)\n\tfor _, w := range words2 {\n\t\tc := make([]int, 26)\n\t\tfor i := 0; i < len(w); i++ {\n\t\t\tc[w[i]-\'a\']++\n\t\t}\n\t\tfor i := 0; i < 26; i++ {\n\t\t\tif c[i] > need[i] {\n\t\t\t\tneed[i] = c[i]\n\t\t\t}\n\t\t}\n\t}\n\tout := []string{}\n\tfor _, w := range words1 {\n\t\tc := make([]int, 26)\n\t\tfor i := 0; i < len(w); i++ {\n\t\t\tc[w[i]-\'a\']++\n\t\t}\n\t\tok := true\n\t\tfor i := 0; i < 26; i++ {\n\t\t\tif c[i] < need[i] {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tif ok {\n\t\t\tout = append(out, w)\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun wordSubsets(words1: Array<String>, words2: Array<String>): Array<String> {\n    val need = IntArray(26)\n    for (w in words2) {\n        val c = IntArray(26)\n        for (ch in w) c[ch - \'a\']++\n        for (i in 0 until 26) need[i] = maxOf(need[i], c[i])\n    }\n    val out = ArrayList<String>()\n    for (w in words1) {\n        val c = IntArray(26)\n        for (ch in w) c[ch - \'a\']++\n        var ok = true\n        for (i in 0 until 26) {\n            if (c[i] < need[i]) {\n                ok = false\n                break\n            }\n        }\n        if (ok) out.add(w)\n    }\n    return out.toTypedArray()\n}`,
        swift: `func wordSubsets(_ words1: [String], _ words2: [String]) -> [String] {\n    func counts(_ w: String) -> [Int] {\n        var c = [Int](repeating: 0, count: 26)\n        for ch in w.utf8 { c[Int(ch) - 97] += 1 }\n        return c\n    }\n    var need = [Int](repeating: 0, count: 26)\n    for w in words2 {\n        let c = counts(w)\n        for i in 0..<26 { need[i] = max(need[i], c[i]) }\n    }\n    var out: [String] = []\n    for w in words1 {\n        let c = counts(w)\n        var ok = true\n        for i in 0..<26 where c[i] < need[i] {\n            ok = false\n            break\n        }\n        if ok { out.append(w) }\n    }\n    return out\n}`,
        rust: `fn wordSubsets(words1: Vec<String>, words2: Vec<String>) -> Vec<String> {\n    fn counts(w: &str) -> [i32; 26] {\n        let mut c = [0i32; 26];\n        for &ch in w.as_bytes() {\n            c[(ch - b\'a\') as usize] += 1;\n        }\n        c\n    }\n    let mut need = [0i32; 26];\n    for w in words2.iter() {\n        let c = counts(w);\n        for i in 0..26 {\n            if c[i] > need[i] {\n                need[i] = c[i];\n            }\n        }\n    }\n    let mut out: Vec<String> = Vec::new();\n    for w in words1.iter() {\n        let c = counts(w);\n        let mut ok = true;\n        for i in 0..26 {\n            if c[i] < need[i] {\n                ok = false;\n                break;\n            }\n        }\n        if ok {\n            out.push(w.clone());\n        }\n    }\n    out\n}`,
        php: `function wordSubsets($words1, $words2) {\n    $need = array_fill(0, 26, 0);\n    foreach ($words2 as $w) {\n        $c = array_fill(0, 26, 0);\n        for ($i = 0; $i < strlen($w); $i++) $c[ord($w[$i]) - 97]++;\n        for ($i = 0; $i < 26; $i++) {\n            if ($c[$i] > $need[$i]) $need[$i] = $c[$i];\n        }\n    }\n    $out = array();\n    foreach ($words1 as $w) {\n        $c = array_fill(0, 26, 0);\n        for ($i = 0; $i < strlen($w); $i++) $c[ord($w[$i]) - 97]++;\n        $ok = true;\n        for ($i = 0; $i < 26; $i++) {\n            if ($c[$i] < $need[$i]) { $ok = false; break; }\n        }\n        if ($ok) $out[] = $w;\n    }\n    return $out;\n}`,
        ruby: `def wordSubsets(words1, words2)\n  counts = lambda do |w|\n    c = Array.new(26, 0)\n    w.each_byte { |b| c[b - 97] += 1 }\n    c\n  end\n  need = Array.new(26, 0)\n  words2.each do |w|\n    c = counts.call(w)\n    (0...26).each { |i| need[i] = c[i] if c[i] > need[i] }\n  end\n  words1.select do |w|\n    c = counts.call(w)\n    (0...26).all? { |i| c[i] >= need[i] }\n  end\nend`,
      },
    };
  })(),

  // ── Longest Word in Dictionary (LC 720) ─────────────────────────
  (() => {
    const ref = (words: string[]) => {
      const set: Record<string, boolean> = {};
      for (const w of words) set[w] = true;
      let best = "";
      for (const w of words) {
        let ok = true;
        for (let len = 1; len < w.length; len++) {
          if (set[w.substr(0, len)] !== true) { ok = false; break; }
        }
        if (!ok) continue;
        if (w.length > best.length || (w.length === best.length && w < best)) best = w;
      }
      return best;
    };
    return {
      slug: "longest-word-in-dictionary",
      title: "Longest Word in Dictionary",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Trie", "Hash Table", "Google", "Amazon", "Adobe"],
      signature: { funcName: "longestWord", params: [{ name: "words", type: "string[]" as const }], returns: "string" as const },
      description: describe(
        "Return the longest word in `words` that can be **built one character at a time** by other words in `words` — that is, every proper prefix of it is also in `words`.\n\nIf several words tie on length, return the lexicographically smallest. If none qualifies, return the empty string.",
        [
          { in: 'words = ["w","wo","wor","worl","world"]', out: "world", note: 'Every prefix of "world" is present.' },
          { in: 'words = ["a","banana","app","appl","ap","apply","apple"]', out: "apple", note: '"apple" and "apply" both qualify at length 5; "apple" is lexicographically smaller.' },
          { in: 'words = ["abc","bc","c"]', out: "c", note: '"abc" needs "a" and "ab", which are missing.' },
        ],
        ["1 <= words.length <= 1000", "1 <= words[i].length <= 30", "words[i] consists of lowercase English letters."]),
      hints: [
        "A word qualifies when all of its proper prefixes are in the dictionary.",
        "Put the words in a set so each prefix test is O(1).",
        "Keep a running champion under the rule 'longer wins, then lexicographically smaller wins'.",
      ],
      editorial: explain({
        idea: "The build-up condition is purely about prefixes, so a set membership test per prefix decides each word. A single pass keeping the best word under the stated ordering then finds the answer.",
        steps: [
          "Insert every word into a hash set.",
          "For each word, test each proper prefix (lengths `1` through `len - 1`) for membership; a single miss disqualifies it.",
          "Among the qualifying words, keep the longest, breaking ties by taking the lexicographically smaller.",
        ],
        why: "If every proper prefix is present, the word can be reached by adding one letter at a time starting from its one-letter prefix — and conversely, any such build-up visits exactly those prefixes. The trie solution encodes the same test structurally and runs faster on large dictionaries.",
        time: "O(total characters) with a set, or O(total characters) with a trie",
        space: "O(total characters)",
        pitfalls: [
          "Testing the word itself as a prefix always succeeds and tells you nothing — stop at `len - 1`.",
          "Comparing with `>=` on length without the tie-break returns whichever tied word came last in the input.",
        ],
      }),
      examples: [
        { input: '["w","wo","wor","worl","world"]', expectedOutput: "world" },
        { input: '["a","banana","app","appl","ap","apply","apple"]', expectedOutput: "apple" },
        { input: '["abc","bc","c"]', expectedOutput: "c" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abc";
        const words: string[] = [];
        const chains = ri(rng, 1, 4);
        for (let c = 0; c < chains; c++) {
          const full = randLower(rng, 1, 5, alphabet);
          const upto = ri(rng, 1, full.length);
          for (let len = 1; len <= upto; len++) words.push(full.substr(0, len));
        }
        for (let extra = ri(rng, 0, 3); extra > 0; extra--) words.push(randLower(rng, 1, 5, alphabet));
        return { input: fmtStrArr(shuffle(rng, words)), expectedOutput: ref(words) };
      },
      solutions: {
        python: `from typing import List\n\ndef longestWord(words: List[str]) -> str:\n    have = set(words)\n    best = ""\n    for w in words:\n        if any(w[:i] not in have for i in range(1, len(w))):\n            continue\n        if len(w) > len(best) or (len(w) == len(best) and w < best):\n            best = w\n    return best`,
        javascript: `var longestWord = function(words) {\n    var have = {};\n    for (var i = 0; i < words.length; i++) have[words[i]] = true;\n    var best = "";\n    for (var j = 0; j < words.length; j++) {\n        var w = words[j], ok = true;\n        for (var len = 1; len < w.length; len++) {\n            if (have[w.substr(0, len)] !== true) { ok = false; break; }\n        }\n        if (!ok) continue;\n        if (w.length > best.length || (w.length === best.length && w < best)) best = w;\n    }\n    return best;\n};`,
        typescript: `function longestWord(words: string[]): string {\n    var have: { [key: string]: boolean } = {};\n    for (var i = 0; i < words.length; i++) have[words[i]] = true;\n    var best = "";\n    for (var j = 0; j < words.length; j++) {\n        var w = words[j], ok = true;\n        for (var len = 1; len < w.length; len++) {\n            if (have[w.substr(0, len)] !== true) { ok = false; break; }\n        }\n        if (!ok) continue;\n        if (w.length > best.length || (w.length === best.length && w < best)) best = w;\n    }\n    return best;\n}`,
        java: `public static String longestWord(String[] words) {\n    Set<String> have = new HashSet<>(Arrays.asList(words));\n    String best = "";\n    for (String w : words) {\n        boolean ok = true;\n        for (int len = 1; len < w.length(); len++) {\n            if (!have.contains(w.substring(0, len))) { ok = false; break; }\n        }\n        if (!ok) continue;\n        if (w.length() > best.length() || (w.length() == best.length() && w.compareTo(best) < 0)) best = w;\n    }\n    return best;\n}`,
        cpp: `string longestWord(vector<string>& words) {\n    unordered_set<string> have(words.begin(), words.end());\n    string best = "";\n    for (const string& w : words) {\n        bool ok = true;\n        for (size_t len = 1; len < w.size(); len++) {\n            if (!have.count(w.substr(0, len))) { ok = false; break; }\n        }\n        if (!ok) continue;\n        if (w.size() > best.size() || (w.size() == best.size() && w < best)) best = w;\n    }\n    return best;\n}`,
        c: `char* longestWord(char** words, int wordsSize) {\n    char* best = (char*) malloc(2);\n    best[0] = 0;\n    for (int j = 0; j < wordsSize; j++) {\n        char* w = words[j];\n        int wl = (int) strlen(w);\n        int ok = 1;\n        for (int len = 1; len < wl && ok; len++) {\n            int found = 0;\n            for (int k = 0; k < wordsSize; k++) {\n                if ((int) strlen(words[k]) == len && strncmp(words[k], w, (size_t) len) == 0) { found = 1; break; }\n            }\n            if (!found) ok = 0;\n        }\n        if (!ok) continue;\n        int bl = (int) strlen(best);\n        if (wl > bl || (wl == bl && strcmp(w, best) < 0)) {\n            free(best);\n            best = (char*) malloc((size_t) wl + 1);\n            strcpy(best, w);\n        }\n    }\n    return best;\n}`,
        csharp: `public static string LongestWord(string[] words)\n{\n    var have = new HashSet<string>(words);\n    string best = "";\n    foreach (string w in words)\n    {\n        bool ok = true;\n        for (int len = 1; len < w.Length; len++)\n        {\n            if (!have.Contains(w.Substring(0, len))) { ok = false; break; }\n        }\n        if (!ok) continue;\n        if (w.Length > best.Length || (w.Length == best.Length && string.CompareOrdinal(w, best) < 0)) best = w;\n    }\n    return best;\n}`,
        go: `func longestWord(words []string) string {\n\thave := map[string]bool{}\n\tfor _, w := range words {\n\t\thave[w] = true\n\t}\n\tbest := ""\n\tfor _, w := range words {\n\t\tok := true\n\t\tfor l := 1; l < len(w); l++ {\n\t\t\tif !have[w[:l]] {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tif !ok {\n\t\t\tcontinue\n\t\t}\n\t\tif len(w) > len(best) || (len(w) == len(best) && w < best) {\n\t\t\tbest = w\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun longestWord(words: Array<String>): String {\n    val have = words.toHashSet()\n    var best = ""\n    for (w in words) {\n        var ok = true\n        for (len in 1 until w.length) {\n            if (!have.contains(w.substring(0, len))) {\n                ok = false\n                break\n            }\n        }\n        if (!ok) continue\n        if (w.length > best.length || (w.length == best.length && w < best)) best = w\n    }\n    return best\n}`,
        swift: `func longestWord(_ words: [String]) -> String {\n    let have = Set(words)\n    var best = ""\n    for w in words {\n        let a = Array(w)\n        var ok = true\n        for len in 1..<max(a.count, 1) where len < a.count {\n            if !have.contains(String(a[0..<len])) {\n                ok = false\n                break\n            }\n        }\n        if !ok { continue }\n        if w.count > best.count || (w.count == best.count && w < best) { best = w }\n    }\n    return best\n}`,
        rust: `fn longestWord(words: Vec<String>) -> String {\n    let have: std::collections::HashSet<&String> = words.iter().collect();\n    let mut best = String::new();\n    for w in words.iter() {\n        let mut ok = true;\n        for len in 1..w.len() {\n            let prefix = w[..len].to_string();\n            if !have.contains(&prefix) {\n                ok = false;\n                break;\n            }\n        }\n        if !ok {\n            continue;\n        }\n        if w.len() > best.len() || (w.len() == best.len() && *w < best) {\n            best = w.clone();\n        }\n    }\n    best\n}`,
        php: `function longestWord($words) {\n    $have = array();\n    foreach ($words as $w) $have[$w] = true;\n    $best = "";\n    foreach ($words as $w) {\n        $ok = true;\n        for ($len = 1; $len < strlen($w); $len++) {\n            if (!isset($have[substr($w, 0, $len)])) { $ok = false; break; }\n        }\n        if (!$ok) continue;\n        if (strlen($w) > strlen($best) || (strlen($w) === strlen($best) && strcmp($w, $best) < 0)) $best = $w;\n    }\n    return $best;\n}`,
        ruby: `def longestWord(words)\n  have = {}\n  words.each { |w| have[w] = true }\n  best = ""\n  words.each do |w|\n    ok = true\n    (1...w.length).each do |len|\n      unless have[w[0, len]]\n        ok = false\n        break\n      end\n    end\n    next unless ok\n    best = w if w.length > best.length || (w.length == best.length && w < best)\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Replace Words (LC 648) ──────────────────────────────────────
  (() => {
    const ref = (dictionary: string[], sentence: string) => {
      const roots: Record<string, boolean> = {};
      for (const r of dictionary) roots[r] = true;
      const words = sentence.split(" ");
      const out: string[] = [];
      for (const w of words) {
        let replaced = w;
        for (let len = 1; len <= w.length; len++) {
          const pre = w.substr(0, len);
          if (roots[pre] === true) { replaced = pre; break; }
        }
        out.push(replaced);
      }
      return out.join(" ");
    };
    return {
      slug: "replace-words",
      title: "Replace Words",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Trie", "Hash Table", "Amazon", "Google", "Adobe"],
      signature: { funcName: "replaceWords", params: [{ name: "dictionary", type: "string[]" as const }, { name: "sentence", type: "string" as const }], returns: "string" as const },
      description: describe(
        "In English, a **root** followed by a suffix forms a longer word — for example `help` gives `helpful`. You are given a `dictionary` of roots and a `sentence` of space-separated words.\n\nReplace every word that has a root as a prefix with that root. When several roots match, use the **shortest** one. Words with no matching root are left alone.\n\nReturn the rewritten sentence.",
        [
          { in: 'dictionary = ["cat","bat","rat"], sentence = "the cattle was rattled by the battery"', out: "the cat was rat by the bat" },
          { in: 'dictionary = ["code","kai"], sentence = "codekairo kairo rocks"', out: "code kai rocks", note: '"codekairo" starts with the root "code"; "kairo" starts with "kai"; "rocks" matches nothing.' },
          { in: 'dictionary = ["a","aa","aaa"], sentence = "aaaa bedded"', out: "a bedded", note: "The shortest matching root wins." },
        ],
        ["1 <= dictionary.length <= 1000", "1 <= dictionary[i].length <= 100", "1 <= sentence words <= 1000", "sentence holds lowercase words separated by single spaces."]),
      hints: [
        "Put the roots in a set, then for each word try its prefixes from shortest to longest.",
        "The first hit is by construction the shortest root — stop there.",
        "A trie does the same job in one walk per word and is the intended structure at scale.",
      ],
      editorial: explain({
        idea: "For each word, the shortest matching root is found by testing its prefixes in increasing length and stopping at the first hit. A hash set makes each test O(1); a trie makes the whole word one walk.",
        steps: [
          "Insert every root into a set.",
          "Split the sentence on spaces.",
          "For each word, test prefixes of length `1, 2, …` and replace with the first one present in the set.",
          "Join the results back with single spaces.",
        ],
        why: "Scanning prefixes shortest-first means the first match is minimal by construction, which is exactly the tie-break the statement asks for. A trie walk reaches the same answer by stopping at the first node marked as a root.",
        time: "O(total characters in the sentence × max root length) with a set; O(total characters) with a trie",
        space: "O(total dictionary characters)",
        pitfalls: [
          "Testing prefixes longest-first gives the *longest* root, which is the wrong tie-break.",
          "Joining with the wrong separator or dropping empty results changes the sentence — the split is on single spaces.",
        ],
      }),
      examples: [
        { input: '["cat","bat","rat"]\n"the cattle was rattled by the battery"', expectedOutput: "the cat was rat by the bat" },
        { input: '["code","kai"]\n"codekairo kairo rocks"', expectedOutput: "code kai rocks" },
        { input: '["a","aa","aaa"]\n"aaaa bedded"', expectedOutput: "a bedded" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abc";
        const dictionary = Array.from({ length: ri(rng, 1, 5) }, () => randLower(rng, 1, 3, alphabet));
        const words = Array.from({ length: ri(rng, 1, 8) }, () => {
          if (rng() < 0.5) return dictionary[ri(rng, 0, dictionary.length - 1)] + randLower(rng, 0, 3, alphabet);
          return randLower(rng, 1, 5, alphabet);
        });
        const sentence = words.join(" ");
        return { input: `${fmtStrArr(dictionary)}\n"${sentence}"`, expectedOutput: ref(dictionary, sentence) };
      },
      solutions: {
        python: `from typing import List\n\ndef replaceWords(dictionary: List[str], sentence: str) -> str:\n    roots = set(dictionary)\n    out = []\n    for w in sentence.split(" "):\n        replaced = w\n        for i in range(1, len(w) + 1):\n            if w[:i] in roots:\n                replaced = w[:i]\n                break\n        out.append(replaced)\n    return " ".join(out)`,
        javascript: `var replaceWords = function(dictionary, sentence) {\n    var roots = {};\n    for (var i = 0; i < dictionary.length; i++) roots[dictionary[i]] = true;\n    var words = sentence.split(" ");\n    var out = [];\n    for (var j = 0; j < words.length; j++) {\n        var w = words[j], replaced = w;\n        for (var len = 1; len <= w.length; len++) {\n            var pre = w.substr(0, len);\n            if (roots[pre] === true) { replaced = pre; break; }\n        }\n        out.push(replaced);\n    }\n    return out.join(" ");\n};`,
        typescript: `function replaceWords(dictionary: string[], sentence: string): string {\n    var roots: { [key: string]: boolean } = {};\n    for (var i = 0; i < dictionary.length; i++) roots[dictionary[i]] = true;\n    var words = sentence.split(" ");\n    var out: string[] = [];\n    for (var j = 0; j < words.length; j++) {\n        var w = words[j], replaced = w;\n        for (var len = 1; len <= w.length; len++) {\n            var pre = w.substr(0, len);\n            if (roots[pre] === true) { replaced = pre; break; }\n        }\n        out.push(replaced);\n    }\n    return out.join(" ");\n}`,
        java: `public static String replaceWords(String[] dictionary, String sentence) {\n    Set<String> roots = new HashSet<>(Arrays.asList(dictionary));\n    String[] words = sentence.split(" ");\n    StringBuilder sb = new StringBuilder();\n    for (int j = 0; j < words.length; j++) {\n        String w = words[j];\n        String replaced = w;\n        for (int len = 1; len <= w.length(); len++) {\n            String pre = w.substring(0, len);\n            if (roots.contains(pre)) { replaced = pre; break; }\n        }\n        if (j > 0) sb.append(' ');\n        sb.append(replaced);\n    }\n    return sb.toString();\n}`,
        cpp: `string replaceWords(vector<string>& dictionary, string sentence) {\n    unordered_set<string> roots(dictionary.begin(), dictionary.end());\n    string out, word;\n    stringstream ss(sentence);\n    bool first = true;\n    while (ss >> word) {\n        string replaced = word;\n        for (size_t len = 1; len <= word.size(); len++) {\n            string pre = word.substr(0, len);\n            if (roots.count(pre)) { replaced = pre; break; }\n        }\n        if (!first) out += " ";\n        out += replaced;\n        first = false;\n    }\n    return out;\n}`,
        c: `char* replaceWords(char** dictionary, int dictionarySize, char* sentence) {\n    int n = (int) strlen(sentence);\n    char* out = (char*) malloc((size_t) n + 2);\n    int m = 0;\n    int i = 0;\n    int firstWord = 1;\n    while (i <= n) {\n        int start = i;\n        while (i < n && sentence[i] != ' ') i++;\n        int wl = i - start;\n        if (wl > 0) {\n            int bestLen = wl;\n            for (int len = 1; len <= wl; len++) {\n                int found = 0;\n                for (int k = 0; k < dictionarySize; k++) {\n                    if ((int) strlen(dictionary[k]) == len && strncmp(dictionary[k], sentence + start, (size_t) len) == 0) { found = 1; break; }\n                }\n                if (found) { bestLen = len; break; }\n            }\n            if (!firstWord) out[m++] = ' ';\n            memcpy(out + m, sentence + start, (size_t) bestLen);\n            m += bestLen;\n            firstWord = 0;\n        }\n        i++;\n    }\n    out[m] = 0;\n    return out;\n}`,
        csharp: `public static string ReplaceWords(string[] dictionary, string sentence)\n{\n    var roots = new HashSet<string>(dictionary);\n    string[] words = sentence.Split(' ');\n    for (int j = 0; j < words.Length; j++)\n    {\n        string w = words[j];\n        for (int len = 1; len <= w.Length; len++)\n        {\n            string pre = w.Substring(0, len);\n            if (roots.Contains(pre)) { words[j] = pre; break; }\n        }\n    }\n    return string.Join(" ", words);\n}`,
        go: `func replaceWords(dictionary []string, sentence string) string {\n\troots := map[string]bool{}\n\tfor _, r := range dictionary {\n\t\troots[r] = true\n\t}\n\twords := strings.Split(sentence, " ")\n\tfor j, w := range words {\n\t\tfor l := 1; l <= len(w); l++ {\n\t\t\tif roots[w[:l]] {\n\t\t\t\twords[j] = w[:l]\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t}\n\treturn strings.Join(words, " ")\n}`,
        kotlin: `fun replaceWords(dictionary: Array<String>, sentence: String): String {\n    val roots = dictionary.toHashSet()\n    val words = sentence.split(" ").toMutableList()\n    for (j in words.indices) {\n        val w = words[j]\n        for (len in 1..w.length) {\n            val pre = w.substring(0, len)\n            if (roots.contains(pre)) {\n                words[j] = pre\n                break\n            }\n        }\n    }\n    return words.joinToString(" ")\n}`,
        swift: `func replaceWords(_ dictionary: [String], _ sentence: String) -> String {\n    let roots = Set(dictionary)\n    var out: [String] = []\n    for word in sentence.split(separator: " ", omittingEmptySubsequences: false) {\n        let a = Array(word)\n        var replaced = String(word)\n        for len in 1...max(a.count, 1) where len <= a.count {\n            let pre = String(a[0..<len])\n            if roots.contains(pre) {\n                replaced = pre\n                break\n            }\n        }\n        out.append(replaced)\n    }\n    return out.joined(separator: " ")\n}`,
        rust: `fn replaceWords(dictionary: Vec<String>, sentence: String) -> String {\n    let roots: std::collections::HashSet<String> = dictionary.into_iter().collect();\n    let mut out: Vec<String> = Vec::new();\n    for w in sentence.split(\' \') {\n        let mut replaced = w.to_string();\n        for len in 1..=w.len() {\n            let pre = w[..len].to_string();\n            if roots.contains(&pre) {\n                replaced = pre;\n                break;\n            }\n        }\n        out.push(replaced);\n    }\n    out.join(" ")\n}`,
        php: `function replaceWords($dictionary, $sentence) {\n    $roots = array();\n    foreach ($dictionary as $r) $roots[$r] = true;\n    $words = explode(" ", $sentence);\n    foreach ($words as $j => $w) {\n        for ($len = 1; $len <= strlen($w); $len++) {\n            $pre = substr($w, 0, $len);\n            if (isset($roots[$pre])) { $words[$j] = $pre; break; }\n        }\n    }\n    return implode(" ", $words);\n}`,
        ruby: `def replaceWords(dictionary, sentence)\n  roots = {}\n  dictionary.each { |r| roots[r] = true }\n  sentence.split(" ").map do |w|\n    replaced = w\n    (1..w.length).each do |len|\n      if roots[w[0, len]]\n        replaced = w[0, len]\n        break\n      end\n    end\n    replaced\n  end.join(" ")\nend`,
      },
    };
  })(),

  // ── Short Encoding of Words (LC 820) ────────────────────────────
  (() => {
    const ref = (words: string[]) => {
      const keep: Record<string, boolean> = {};
      for (const w of words) keep[w] = true;
      for (const w of words) {
        for (let i = 1; i < w.length; i++) delete keep[w.substr(i)];
      }
      let total = 0;
      for (const w of Object.keys(keep)) total += w.length + 1;
      return total;
    };
    return {
      slug: "short-encoding-of-words",
      title: "Short Encoding of Words",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Trie", "Hash Table", "Google", "Amazon", "Meta"],
      signature: { funcName: "minimumLengthEncoding", params: [{ name: "words", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "A valid encoding of `words` is a reference string `s` ending in `'#'` together with one starting index per word, such that reading from that index up to the next `'#'` spells the word.\n\nFor example `words = [\"time\",\"me\",\"bell\"]` can be encoded as `s = \"time#bell#\"` with indices `0`, `2` and `5`.\n\nReturn the length of the shortest possible reference string.",
        [
          { in: 'words = ["time","me","bell"]', out: "10", note: '"time#bell#" has length 10 — "me" rides along inside "time#".' },
          { in: 'words = ["t"]', out: "2", note: '"t#".' },
          { in: 'words = ["code","kairo","ro"]', out: "11", note: '"code#kairo#" is 11 characters; "ro" is a suffix of "kairo".' },
        ],
        ["1 <= words.length <= 2000", "1 <= words[i].length <= 7", "words[i] consists of lowercase English letters."]),
      hints: [
        "A word only saves space when it is a **suffix** of another word — then it shares that word's ending.",
        "So discard every word that is a proper suffix of some other word.",
        "Each survivor costs its own length plus one for the `'#'`.",
      ],
      editorial: explain({
        idea: "Two words can share encoding space only when one is a suffix of the other, because every word must run up to a `'#'`. So the shortest encoding keeps exactly the words that are not proper suffixes of any other, and each costs its length plus one.",
        steps: [
          "Put all words in a set.",
          "For each word, remove every proper suffix of it from the set — that is, `w[1..]`, `w[2..]`, and so on.",
          "Sum `length + 1` over the words still in the set.",
        ],
        why: "If `a` is a suffix of `b`, then `a` can be read starting inside `b`'s block and costs nothing extra. If neither is a suffix of the other, their blocks cannot overlap at all, since an overlap would force one to end where the other does. So the survivors are exactly the blocks that must be written.",
        time: "O(total characters × max word length)",
        space: "O(total characters)",
        pitfalls: [
          "Starting the suffix loop at `0` deletes the word itself and empties the set.",
          "Duplicate words must collapse — a set handles that for free, a list does not.",
          "The trailing `'#'` is part of every block, hence the `+ 1` per survivor.",
        ],
      }),
      examples: [
        { input: '["time","me","bell"]', expectedOutput: "10" },
        { input: '["t"]', expectedOutput: "2" },
        { input: '["code","kairo","ro"]', expectedOutput: "11" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abc";
        const base = Array.from({ length: ri(rng, 1, 5) }, () => randLower(rng, 1, 6, alphabet));
        const words = base.slice();
        for (let extra = ri(rng, 0, 4); extra > 0; extra--) {
          const b = base[ri(rng, 0, base.length - 1)];
          words.push(b.substr(ri(rng, 0, b.length - 1)));
        }
        return { input: fmtStrArr(shuffle(rng, words)), expectedOutput: String(ref(words)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minimumLengthEncoding(words: List[str]) -> int:\n    keep = set(words)\n    for w in list(keep):\n        for i in range(1, len(w)):\n            keep.discard(w[i:])\n    return sum(len(w) + 1 for w in keep)`,
        javascript: `var minimumLengthEncoding = function(words) {\n    var keep = {};\n    for (var i = 0; i < words.length; i++) keep[words[i]] = true;\n    for (var j = 0; j < words.length; j++) {\n        var w = words[j];\n        for (var k = 1; k < w.length; k++) delete keep[w.substr(k)];\n    }\n    var total = 0;\n    var left = Object.keys(keep);\n    for (var m = 0; m < left.length; m++) total += left[m].length + 1;\n    return total;\n};`,
        typescript: `function minimumLengthEncoding(words: string[]): number {\n    var keep: { [key: string]: boolean } = {};\n    for (var i = 0; i < words.length; i++) keep[words[i]] = true;\n    for (var j = 0; j < words.length; j++) {\n        var w = words[j];\n        for (var k = 1; k < w.length; k++) delete keep[w.substr(k)];\n    }\n    var total = 0;\n    var left = Object.keys(keep);\n    for (var m = 0; m < left.length; m++) total += left[m].length + 1;\n    return total;\n}`,
        java: `public static int minimumLengthEncoding(String[] words) {\n    Set<String> keep = new HashSet<>(Arrays.asList(words));\n    for (String w : words) {\n        for (int i = 1; i < w.length(); i++) keep.remove(w.substring(i));\n    }\n    int total = 0;\n    for (String w : keep) total += w.length() + 1;\n    return total;\n}`,
        cpp: `int minimumLengthEncoding(vector<string>& words) {\n    unordered_set<string> keep(words.begin(), words.end());\n    for (const string& w : words) {\n        for (size_t i = 1; i < w.size(); i++) keep.erase(w.substr(i));\n    }\n    int total = 0;\n    for (const string& w : keep) total += (int) w.size() + 1;\n    return total;\n}`,
        c: `int minimumLengthEncoding(char** words, int wordsSize) {\n    int* alive = (int*) malloc((size_t) wordsSize * sizeof(int));\n    for (int i = 0; i < wordsSize; i++) alive[i] = 1;\n    for (int i = 0; i < wordsSize; i++) {\n        if (!alive[i]) continue;\n        for (int j = 0; j < wordsSize; j++) {\n            if (i == j || !alive[j]) continue;\n            int li = (int) strlen(words[i]);\n            int lj = (int) strlen(words[j]);\n            if (lj > li) continue;\n            if (lj == li && j > i && strcmp(words[i], words[j]) == 0) { alive[j] = 0; continue; }\n            if (lj < li && strcmp(words[i] + (li - lj), words[j]) == 0) alive[j] = 0;\n        }\n    }\n    int total = 0;\n    for (int i = 0; i < wordsSize; i++) {\n        if (alive[i]) total += (int) strlen(words[i]) + 1;\n    }\n    free(alive);\n    return total;\n}`,
        csharp: `public static int MinimumLengthEncoding(string[] words)\n{\n    var keep = new HashSet<string>(words);\n    foreach (string w in words)\n    {\n        for (int i = 1; i < w.Length; i++) keep.Remove(w.Substring(i));\n    }\n    int total = 0;\n    foreach (string w in keep) total += w.Length + 1;\n    return total;\n}`,
        go: `func minimumLengthEncoding(words []string) int {\n\tkeep := map[string]bool{}\n\tfor _, w := range words {\n\t\tkeep[w] = true\n\t}\n\tfor _, w := range words {\n\t\tfor i := 1; i < len(w); i++ {\n\t\t\tdelete(keep, w[i:])\n\t\t}\n\t}\n\ttotal := 0\n\tfor w := range keep {\n\t\ttotal += len(w) + 1\n\t}\n\treturn total\n}`,
        kotlin: `fun minimumLengthEncoding(words: Array<String>): Int {\n    val keep = words.toHashSet()\n    for (w in words) {\n        for (i in 1 until w.length) keep.remove(w.substring(i))\n    }\n    var total = 0\n    for (w in keep) total += w.length + 1\n    return total\n}`,
        swift: `func minimumLengthEncoding(_ words: [String]) -> Int {\n    var keep = Set(words)\n    for word in words {\n        let a = Array(word)\n        if a.count < 2 { continue }\n        for i in 1..<a.count {\n            keep.remove(String(a[i...]))\n        }\n    }\n    var total = 0\n    for w in keep { total += w.count + 1 }\n    return total\n}`,
        rust: `fn minimumLengthEncoding(words: Vec<String>) -> i32 {\n    let mut keep: std::collections::HashSet<String> = words.iter().cloned().collect();\n    for w in words.iter() {\n        for i in 1..w.len() {\n            let suffix = w[i..].to_string();\n            keep.remove(&suffix);\n        }\n    }\n    let mut total = 0i32;\n    for w in keep.iter() {\n        total += w.len() as i32 + 1;\n    }\n    total\n}`,
        php: `function minimumLengthEncoding($words) {\n    $keep = array();\n    foreach ($words as $w) $keep[$w] = true;\n    foreach ($words as $w) {\n        for ($i = 1; $i < strlen($w); $i++) unset($keep[substr($w, $i)]);\n    }\n    $total = 0;\n    foreach (array_keys($keep) as $w) $total += strlen($w) + 1;\n    return $total;\n}`,
        ruby: `def minimumLengthEncoding(words)\n  keep = {}\n  words.each { |w| keep[w] = true }\n  words.each do |w|\n    (1...w.length).each { |i| keep.delete(w[i..-1]) }\n  end\n  keep.keys.sum { |w| w.length + 1 }\nend`,
      },
    };
  })(),

  // ── Count Unique Characters of All Substrings (LC 828) ──────────
  (() => {
    const ref = (s: string) => {
      const MOD = 1000000007;
      const n = s.length;
      const last: number[] = new Array(26).fill(-1);
      const prev: number[] = new Array(26).fill(-1);
      let total = 0;
      for (let i = 0; i < n; i++) {
        const c = s.charCodeAt(i) - 65;
        total = (total + (i - last[c]) * (last[c] - prev[c])) % MOD;
        prev[c] = last[c];
        last[c] = i;
      }
      for (let c = 0; c < 26; c++) {
        total = (total + (n - last[c]) * (last[c] - prev[c])) % MOD;
      }
      return total;
    };
    return {
      slug: "count-unique-characters-of-all-substrings",
      title: "Count Unique Characters of All Substrings of a Given String",
      difficulty: "HARD" as const,
      tags: ["String", "Hash Table", "Counting", "Google", "Amazon", "Meta"],
      signature: { funcName: "uniqueLetterString", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "For a string `t`, let `countUnique(t)` be the number of characters that occur **exactly once** in `t`. For `\"CODE\"` that is 4; for `\"KAIRO\"` it is 5; for `\"AABB\"` it is 0.\n\nGiven `s`, return the sum of `countUnique(t)` over **every** substring `t` of `s`, modulo `10^9 + 7`. Substrings at different positions count separately even when identical.",
        [
          { in: 's = "ABC"', out: "10", note: "Every one of the six substrings has all-unique characters: 1+1+1+2+2+3 = 10." },
          { in: 's = "ABA"', out: "8", note: 'The two A\'s cancel each other out in the substrings that contain both.' },
          { in: 's = "KAIRO"', out: "35" },
        ],
        ["1 <= s.length <= 100000", "s consists of uppercase English letters."]),
      hints: [
        "Summing over substrings is hopeless directly. Flip it: count the contribution of each **occurrence** of each character.",
        "An occurrence at index `i` is unique in exactly the substrings that contain it but not the previous or next occurrence of the same character.",
        "If `prev` and `next` are those neighbouring positions, the count of such substrings is `(i - prev) × (next - i)`.",
      ],
      editorial: explain({
        idea: "Reverse the order of summation. Instead of asking how many unique characters each substring has, ask how many substrings each occurrence is unique in — a quantity that depends only on its two neighbouring occurrences of the same letter.",
        steps: [
          "For each letter keep `last` — the index of its most recent occurrence — and `prev` — the one before that, both starting at `-1`.",
          "At index `i` with letter `c`, the occurrence at `last[c]` is now fully bracketed: it is unique in `(last[c] - prev[c]) × (i - last[c])` substrings. Add that.",
          "Shift `prev[c] = last[c]` and `last[c] = i`.",
          "After the sweep, close out every letter's final occurrence using `n` as the right bracket.",
        ],
        why: "A substring `s[l..r]` counts the occurrence at `p` as unique exactly when `prev < l <= p` and `p <= r < next`. There are `p - prev` choices for `l` and `next - p` for `r`, and these ranges are independent — hence the product. Summing over all occurrences of all letters counts each (substring, unique character) pair exactly once.",
        time: "O(n)",
        space: "O(26)",
        pitfalls: [
          "Enumerating substrings is O(n²) at best and cannot pass the stated limit.",
          "Forgetting the closing loop drops the contribution of every letter's last occurrence.",
          "The products reach about `n²/4`, which overflows 32 bits — accumulate in 64 bits before the modulo.",
        ],
      }),
      examples: [
        { input: '"ABC"', expectedOutput: "10" },
        { input: '"ABA"', expectedOutput: "8" },
        { input: '"KAIRO"', expectedOutput: "35" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.5 ? "AB" : "ABCDEFGH";
        const s = randLower(rng, 1, 60, alphabet);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def uniqueLetterString(s: str) -> int:\n    MOD = 1000000007\n    n = len(s)\n    last = [-1] * 26\n    prev = [-1] * 26\n    total = 0\n    for i, ch in enumerate(s):\n        c = ord(ch) - 65\n        total = (total + (i - last[c]) * (last[c] - prev[c])) % MOD\n        prev[c] = last[c]\n        last[c] = i\n    for c in range(26):\n        total = (total + (n - last[c]) * (last[c] - prev[c])) % MOD\n    return total`,
        javascript: `var uniqueLetterString = function(s) {\n    var MOD = 1000000007;\n    var n = s.length;\n    var last = [], prev = [];\n    for (var t = 0; t < 26; t++) { last.push(-1); prev.push(-1); }\n    var total = 0;\n    for (var i = 0; i < n; i++) {\n        var c = s.charCodeAt(i) - 65;\n        total = (total + (i - last[c]) * (last[c] - prev[c])) % MOD;\n        prev[c] = last[c];\n        last[c] = i;\n    }\n    for (var d = 0; d < 26; d++) {\n        total = (total + (n - last[d]) * (last[d] - prev[d])) % MOD;\n    }\n    return total;\n};`,
        typescript: `function uniqueLetterString(s: string): number {\n    var MOD = 1000000007;\n    var n = s.length;\n    var last: number[] = [], prev: number[] = [];\n    for (var t = 0; t < 26; t++) { last.push(-1); prev.push(-1); }\n    var total = 0;\n    for (var i = 0; i < n; i++) {\n        var c = s.charCodeAt(i) - 65;\n        total = (total + (i - last[c]) * (last[c] - prev[c])) % MOD;\n        prev[c] = last[c];\n        last[c] = i;\n    }\n    for (var d = 0; d < 26; d++) {\n        total = (total + (n - last[d]) * (last[d] - prev[d])) % MOD;\n    }\n    return total;\n}`,
        java: `public static int uniqueLetterString(String s) {\n    final long MOD = 1000000007L;\n    int n = s.length();\n    int[] last = new int[26];\n    int[] prev = new int[26];\n    Arrays.fill(last, -1);\n    Arrays.fill(prev, -1);\n    long total = 0;\n    for (int i = 0; i < n; i++) {\n        int c = s.charAt(i) - 'A';\n        total = (total + (long) (i - last[c]) * (last[c] - prev[c])) % MOD;\n        prev[c] = last[c];\n        last[c] = i;\n    }\n    for (int c = 0; c < 26; c++) {\n        total = (total + (long) (n - last[c]) * (last[c] - prev[c])) % MOD;\n    }\n    return (int) total;\n}`,
        cpp: `int uniqueLetterString(string s) {\n    const long long MOD = 1000000007LL;\n    int n = (int) s.size();\n    vector<int> last(26, -1), prev(26, -1);\n    long long total = 0;\n    for (int i = 0; i < n; i++) {\n        int c = s[i] - 'A';\n        total = (total + (long long) (i - last[c]) * (last[c] - prev[c])) % MOD;\n        prev[c] = last[c];\n        last[c] = i;\n    }\n    for (int c = 0; c < 26; c++) {\n        total = (total + (long long) (n - last[c]) * (last[c] - prev[c])) % MOD;\n    }\n    return (int) total;\n}`,
        c: `int uniqueLetterString(char* s) {\n    const long long MOD = 1000000007LL;\n    int n = (int) strlen(s);\n    int last[26], prev[26];\n    for (int i = 0; i < 26; i++) { last[i] = -1; prev[i] = -1; }\n    long long total = 0;\n    for (int i = 0; i < n; i++) {\n        int c = s[i] - 'A';\n        total = (total + (long long) (i - last[c]) * (last[c] - prev[c])) % MOD;\n        prev[c] = last[c];\n        last[c] = i;\n    }\n    for (int c = 0; c < 26; c++) {\n        total = (total + (long long) (n - last[c]) * (last[c] - prev[c])) % MOD;\n    }\n    return (int) total;\n}`,
        csharp: `public static int UniqueLetterString(string s)\n{\n    const long MOD = 1000000007L;\n    int n = s.Length;\n    int[] last = new int[26];\n    int[] prev = new int[26];\n    for (int i = 0; i < 26; i++) { last[i] = -1; prev[i] = -1; }\n    long total = 0;\n    for (int i = 0; i < n; i++)\n    {\n        int c = s[i] - 'A';\n        total = (total + (long) (i - last[c]) * (last[c] - prev[c])) % MOD;\n        prev[c] = last[c];\n        last[c] = i;\n    }\n    for (int c = 0; c < 26; c++)\n    {\n        total = (total + (long) (n - last[c]) * (last[c] - prev[c])) % MOD;\n    }\n    return (int) total;\n}`,
        go: `func uniqueLetterString(s string) int {\n\tconst mod = 1000000007\n\tn := len(s)\n\tlast := make([]int, 26)\n\tprev := make([]int, 26)\n\tfor i := range last {\n\t\tlast[i] = -1\n\t\tprev[i] = -1\n\t}\n\ttotal := 0\n\tfor i := 0; i < n; i++ {\n\t\tc := int(s[i] - \'A\')\n\t\ttotal = (total + (i-last[c])*(last[c]-prev[c])) % mod\n\t\tprev[c] = last[c]\n\t\tlast[c] = i\n\t}\n\tfor c := 0; c < 26; c++ {\n\t\ttotal = (total + (n-last[c])*(last[c]-prev[c])) % mod\n\t}\n\treturn total\n}`,
        kotlin: `fun uniqueLetterString(s: String): Int {\n    val mod = 1000000007L\n    val n = s.length\n    val last = IntArray(26) { -1 }\n    val prev = IntArray(26) { -1 }\n    var total = 0L\n    for (i in 0 until n) {\n        val c = s[i] - \'A\'\n        total = (total + (i - last[c]).toLong() * (last[c] - prev[c])) % mod\n        prev[c] = last[c]\n        last[c] = i\n    }\n    for (c in 0 until 26) {\n        total = (total + (n - last[c]).toLong() * (last[c] - prev[c])) % mod\n    }\n    return total.toInt()\n}`,
        swift: `func uniqueLetterString(_ s: String) -> Int {\n    let mod = 1000000007\n    let a = Array(s.utf8).map { Int($0) - 65 }\n    let n = a.count\n    var last = [Int](repeating: -1, count: 26)\n    var prev = [Int](repeating: -1, count: 26)\n    var total = 0\n    for i in 0..<n {\n        let c = a[i]\n        total = (total + (i - last[c]) * (last[c] - prev[c])) % mod\n        prev[c] = last[c]\n        last[c] = i\n    }\n    for c in 0..<26 {\n        total = (total + (n - last[c]) * (last[c] - prev[c])) % mod\n    }\n    return total\n}`,
        rust: `fn uniqueLetterString(s: String) -> i32 {\n    let md: i64 = 1000000007;\n    let b = s.as_bytes();\n    let n = b.len() as i64;\n    let mut last = [-1i64; 26];\n    let mut prev = [-1i64; 26];\n    let mut total: i64 = 0;\n    for i in 0..b.len() {\n        let c = (b[i] - b\'A\') as usize;\n        let idx = i as i64;\n        total = (total + (idx - last[c]) * (last[c] - prev[c])) % md;\n        prev[c] = last[c];\n        last[c] = idx;\n    }\n    for c in 0..26 {\n        total = (total + (n - last[c]) * (last[c] - prev[c])) % md;\n    }\n    total as i32\n}`,
        php: `function uniqueLetterString($s) {\n    $mod = 1000000007;\n    $n = strlen($s);\n    $last = array_fill(0, 26, -1);\n    $prev = array_fill(0, 26, -1);\n    $total = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $c = ord($s[$i]) - 65;\n        $total = ($total + ($i - $last[$c]) * ($last[$c] - $prev[$c])) % $mod;\n        $prev[$c] = $last[$c];\n        $last[$c] = $i;\n    }\n    for ($c = 0; $c < 26; $c++) {\n        $total = ($total + ($n - $last[$c]) * ($last[$c] - $prev[$c])) % $mod;\n    }\n    return $total;\n}`,
        ruby: `def uniqueLetterString(s)\n  mod = 1000000007\n  n = s.length\n  last = Array.new(26, -1)\n  prev = Array.new(26, -1)\n  total = 0\n  (0...n).each do |i|\n    c = s[i].ord - 65\n    total = (total + (i - last[c]) * (last[c] - prev[c])) % mod\n    prev[c] = last[c]\n    last[c] = i\n  end\n  (0...26).each do |c|\n    total = (total + (n - last[c]) * (last[c] - prev[c])) % mod\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Longest Happy Prefix (LC 1392) ──────────────────────────────
  (() => {
    const ref = (s: string) => {
      const n = s.length;
      const fail = new Array(n).fill(0);
      for (let i = 1; i < n; i++) {
        let j = fail[i - 1];
        while (j > 0 && s.charAt(i) !== s.charAt(j)) j = fail[j - 1];
        if (s.charAt(i) === s.charAt(j)) j++;
        fail[i] = j;
      }
      return s.substr(0, fail[n - 1]);
    };
    return {
      slug: "longest-happy-prefix",
      title: "Longest Happy Prefix",
      difficulty: "HARD" as const,
      tags: ["String", "KMP", "Rolling Hash", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "longestPrefix", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A **happy prefix** is a non-empty prefix that is also a suffix, but not the whole string.\n\nGiven `s`, return its longest happy prefix, or the empty string if it has none.",
        [
          { in: 's = "level"', out: "l", note: 'Prefixes that are also suffixes: "l". "le" is not a suffix.' },
          { in: 's = "ababab"', out: "abab", note: '"abab" is both a prefix and a suffix; "ababab" itself does not count.' },
          { in: 's = "codekairo"', out: "", note: "No proper prefix is also a suffix." },
        ],
        ["1 <= s.length <= 100000", "s consists of lowercase English letters."]),
      hints: [
        "This is exactly the value KMP's failure function computes at the last index.",
        "`fail[i]` is the length of the longest proper prefix of `s[0..i]` that is also a suffix of it.",
        "Build `fail` left to right, falling back through `fail[j-1]` on a mismatch.",
      ],
      editorial: explain({
        idea: "The longest happy prefix is by definition the last value of KMP's prefix function, so the whole problem is one failure-function build.",
        steps: [
          "Set `fail[0] = 0`.",
          "For each `i` from 1, start `j = fail[i-1]` and, while `j > 0` and `s[i] != s[j]`, fall back to `j = fail[j-1]`.",
          "If `s[i] == s[j]`, increment `j`; store `fail[i] = j`.",
          "Return the first `fail[n-1]` characters of `s`.",
        ],
        why: "The fallback chain `j, fail[j-1], fail[fail[j-1]-1], …` enumerates every border of the current prefix in decreasing length, so the first one that can be extended by `s[i]` gives the longest border of the prefix ending at `i`. Because `fail` never counts the whole string, the result is automatically proper.",
        time: "O(n) — the fallback chain is amortised constant",
        space: "O(n)",
        pitfalls: [
          "Comparing every prefix with the matching suffix directly is O(n²) and times out.",
          "Returning `s` itself when the string is uniform — the prefix must be **proper**, which `fail` guarantees.",
          "A rolling hash also works but needs a double hash to be safe against collisions at this input size.",
        ],
      }),
      examples: [
        { input: '"level"', expectedOutput: "l" },
        { input: '"ababab"', expectedOutput: "abab" },
        { input: '"codekairo"', expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.5 ? "ab" : "abcde";
        let s: string;
        if (rng() < 0.4) {
          const unit = randLower(rng, 1, 4, alphabet);
          s = unit.repeat(ri(rng, 2, 5)) + (rng() < 0.5 ? randLower(rng, 0, 3, alphabet) : "");
        } else {
          s = randLower(rng, 1, 40, alphabet);
        }
        if (s.length === 0) s = alphabet.charAt(0);
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def longestPrefix(s: str) -> str:\n    n = len(s)\n    fail = [0] * n\n    for i in range(1, n):\n        j = fail[i - 1]\n        while j > 0 and s[i] != s[j]:\n            j = fail[j - 1]\n        if s[i] == s[j]:\n            j += 1\n        fail[i] = j\n    return s[:fail[n - 1]]`,
        javascript: `var longestPrefix = function(s) {\n    var n = s.length;\n    var fail = [];\n    for (var t = 0; t < n; t++) fail.push(0);\n    for (var i = 1; i < n; i++) {\n        var j = fail[i - 1];\n        while (j > 0 && s.charAt(i) !== s.charAt(j)) j = fail[j - 1];\n        if (s.charAt(i) === s.charAt(j)) j++;\n        fail[i] = j;\n    }\n    return s.substr(0, fail[n - 1]);\n};`,
        typescript: `function longestPrefix(s: string): string {\n    var n = s.length;\n    var fail: number[] = [];\n    for (var t = 0; t < n; t++) fail.push(0);\n    for (var i = 1; i < n; i++) {\n        var j = fail[i - 1];\n        while (j > 0 && s.charAt(i) !== s.charAt(j)) j = fail[j - 1];\n        if (s.charAt(i) === s.charAt(j)) j++;\n        fail[i] = j;\n    }\n    return s.substr(0, fail[n - 1]);\n}`,
        java: `public static String longestPrefix(String s) {\n    int n = s.length();\n    int[] fail = new int[n];\n    for (int i = 1; i < n; i++) {\n        int j = fail[i - 1];\n        while (j > 0 && s.charAt(i) != s.charAt(j)) j = fail[j - 1];\n        if (s.charAt(i) == s.charAt(j)) j++;\n        fail[i] = j;\n    }\n    return s.substring(0, fail[n - 1]);\n}`,
        cpp: `string longestPrefix(string s) {\n    int n = (int) s.size();\n    vector<int> fail(n, 0);\n    for (int i = 1; i < n; i++) {\n        int j = fail[i - 1];\n        while (j > 0 && s[i] != s[j]) j = fail[j - 1];\n        if (s[i] == s[j]) j++;\n        fail[i] = j;\n    }\n    return s.substr(0, fail[n - 1]);\n}`,
        c: `char* longestPrefix(char* s) {\n    int n = (int) strlen(s);\n    int* fail = (int*) calloc((size_t) n, sizeof(int));\n    for (int i = 1; i < n; i++) {\n        int j = fail[i - 1];\n        while (j > 0 && s[i] != s[j]) j = fail[j - 1];\n        if (s[i] == s[j]) j++;\n        fail[i] = j;\n    }\n    int keep = fail[n - 1];\n    char* out = (char*) malloc((size_t) keep + 1);\n    memcpy(out, s, (size_t) keep);\n    out[keep] = 0;\n    free(fail);\n    return out;\n}`,
        csharp: `public static string LongestPrefix(string s)\n{\n    int n = s.Length;\n    int[] fail = new int[n];\n    for (int i = 1; i < n; i++)\n    {\n        int j = fail[i - 1];\n        while (j > 0 && s[i] != s[j]) j = fail[j - 1];\n        if (s[i] == s[j]) j++;\n        fail[i] = j;\n    }\n    return s.Substring(0, fail[n - 1]);\n}`,
        go: `func longestPrefix(s string) string {\n\tn := len(s)\n\tfail := make([]int, n)\n\tfor i := 1; i < n; i++ {\n\t\tj := fail[i-1]\n\t\tfor j > 0 && s[i] != s[j] {\n\t\t\tj = fail[j-1]\n\t\t}\n\t\tif s[i] == s[j] {\n\t\t\tj++\n\t\t}\n\t\tfail[i] = j\n\t}\n\treturn s[:fail[n-1]]\n}`,
        kotlin: `fun longestPrefix(s: String): String {\n    val n = s.length\n    val fail = IntArray(n)\n    for (i in 1 until n) {\n        var j = fail[i - 1]\n        while (j > 0 && s[i] != s[j]) j = fail[j - 1]\n        if (s[i] == s[j]) j++\n        fail[i] = j\n    }\n    return s.substring(0, fail[n - 1])\n}`,
        swift: `func longestPrefix(_ s: String) -> String {\n    let a = Array(s)\n    let n = a.count\n    var fail = [Int](repeating: 0, count: n)\n    for i in 1..<max(n, 1) where i < n {\n        var j = fail[i - 1]\n        while j > 0 && a[i] != a[j] { j = fail[j - 1] }\n        if a[i] == a[j] { j += 1 }\n        fail[i] = j\n    }\n    return String(a[0..<fail[n - 1]])\n}`,
        rust: `fn longestPrefix(s: String) -> String {\n    let b = s.as_bytes();\n    let n = b.len();\n    let mut fail = vec![0usize; n];\n    for i in 1..n {\n        let mut j = fail[i - 1];\n        while j > 0 && b[i] != b[j] {\n            j = fail[j - 1];\n        }\n        if b[i] == b[j] {\n            j += 1;\n        }\n        fail[i] = j;\n    }\n    s[..fail[n - 1]].to_string()\n}`,
        php: `function longestPrefix($s) {\n    $n = strlen($s);\n    $fail = array_fill(0, $n, 0);\n    for ($i = 1; $i < $n; $i++) {\n        $j = $fail[$i - 1];\n        while ($j > 0 && $s[$i] !== $s[$j]) $j = $fail[$j - 1];\n        if ($s[$i] === $s[$j]) $j++;\n        $fail[$i] = $j;\n    }\n    return substr($s, 0, $fail[$n - 1]);\n}`,
        ruby: `def longestPrefix(s)\n  n = s.length\n  fail_arr = Array.new(n, 0)\n  (1...n).each do |i|\n    j = fail_arr[i - 1]\n    j = fail_arr[j - 1] while j > 0 && s[i] != s[j]\n    j += 1 if s[i] == s[j]\n    fail_arr[i] = j\n  end\n  s[0, fail_arr[n - 1]]\nend`,
      },
    };
  })(),
];
