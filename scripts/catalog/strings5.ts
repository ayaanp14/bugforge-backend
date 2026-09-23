/**
 * String problems — wave 5.
 *
 * Real problems only: LeetCode numbered classics, weighted toward the 2000+
 * range the earlier waves did not reach, plus the GeeksforGeeks staples.
 * Sample strings are CodeKairo's own — a problem that ships with
 * `s = "leetcode"` upstream reads `s = "codekairo"` here.
 *
 * Judge contract: a string test input must never contain `=`, because the
 * JS/Python driver's parseArgs reads `<ident>=` as a named argument
 * (src/lib/judge0.ts), and no input or output may hold a `__CODEXA_` sentinel.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at(), .flat() or
 * .flatMap(). The C harness has string.h but no math.h.
 */

import {
  bool, describe, explain, fmtIntArr, fmtStrArr,
  pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const STRINGS5_PROBLEMS: CatalogProblem[] = [

  // ── Find the Encrypted String (LC 3210) ─────────────────────────
  (() => {
    const ref = (s: string, k: number) => {
      const n = s.length;
      let out = "";
      for (let i = 0; i < n; i++) out += s.charAt((i + k) % n);
      return out;
    };
    return {
      slug: "find-the-encrypted-string",
      title: "Find the Encrypted String",
      difficulty: "EASY" as const,
      tags: ["String", "Simulation", "Amazon", "Google", "TCS"],
      signature: { funcName: "getEncryptedString", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "string" as const },
      description: describe(
        "Encrypt `s` by replacing every character with the character `k` places **after** it, wrapping around to the start of the string when you run off the end.\n\nReturn the encrypted string.",
        [
          { in: 's = "codekairo", k = 3', out: "ekairocod", note: "Position 0 takes the character at position 3, and so on around the ring." },
          { in: 's = "dart", k = 3', out: "tdar" },
          { in: 's = "aaa", k = 1', out: "aaa", note: "Every character is the same, so rotating changes nothing." },
        ],
        ["1 <= s.length <= 100", "1 <= k <= 10^4", "s consists only of lowercase English letters."]),
      hints: [
        "The character that lands at position `i` is the one originally at `(i + k) mod n`.",
        "`k` can exceed the length, which is exactly what the modulo handles.",
        "This is a left rotation of the string by `k mod n`.",
      ],
      editorial: explain({
        idea: "The answer at index `i` is `s[(i + k) mod n]` — a left rotation by `k mod n`. Build the result index by index.",
        steps: [
          "For each `i` from 0 to `n - 1`, append `s[(i + k) mod n]`.",
          "Return the accumulated string.",
        ],
        why: "The modulo is doing all the work: `k` can be a hundred times the string's length, and taking it modulo `n` collapses every one of those wraps into the single rotation they amount to. Rotating one character at a time in a loop would be O(n · k) and needlessly slow for large `k`.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Shifting is on **positions**, not on the letters themselves — this is not a Caesar cipher.",
          "`k` may be far larger than the string; reduce it with `mod n`.",
          "The direction is forward: position `i` reads from `i + k`, not `i - k`.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n3', expectedOutput: "ekairocod" },
        { input: '"dart"\n3', expectedOutput: "tdar" },
        { input: '"aaa"\n1', expectedOutput: "aaa" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 14);
        const s = randLower(rng, n);
        const k = ri(rng, 1, 40);
        return { input: `"${s}"\n${k}`, expectedOutput: ref(s, k) };
      },
      solutions: {
        python: `def getEncryptedString(s: str, k: int) -> str:\n    n = len(s)\n    return "".join(s[(i + k) % n] for i in range(n))`,
        javascript: `var getEncryptedString = function(s, k) {\n    var n = s.length, out = "";\n    for (var i = 0; i < n; i++) out += s.charAt((i + k) % n);\n    return out;\n};`,
        typescript: `function getEncryptedString(s: string, k: number): string {\n    var n = s.length, out = "";\n    for (var i = 0; i < n; i++) out += s.charAt((i + k) % n);\n    return out;\n}`,
        java: `public static String getEncryptedString(String s, int k) {\n    int n = s.length();\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < n; i++) sb.append(s.charAt((i + k) % n));\n    return sb.toString();\n}`,
        cpp: `string getEncryptedString(string s, int k) {\n    int n = (int) s.size();\n    string out;\n    out.reserve((size_t) n);\n    for (int i = 0; i < n; i++) out += s[(i + k) % n];\n    return out;\n}`,
        c: `char* getEncryptedString(char* s, int k) {\n    int n = (int) strlen(s);\n    char* out = (char*) malloc((size_t) n + 1);\n    for (int i = 0; i < n; i++) out[i] = s[(i + k) % n];\n    out[n] = '\\0';\n    return out;\n}`,
        csharp: `public static string GetEncryptedString(string s, int k)\n{\n    int n = s.Length;\n    var sb = new System.Text.StringBuilder();\n    for (int i = 0; i < n; i++) sb.Append(s[(i + k) % n]);\n    return sb.ToString();\n}`,
        go: `func getEncryptedString(s string, k int) string {\n\tn := len(s)\n\tout := make([]byte, n)\n\tfor i := 0; i < n; i++ {\n\t\tout[i] = s[(i+k)%n]\n\t}\n\treturn string(out)\n}`,
        kotlin: `fun getEncryptedString(s: String, k: Int): String {\n    val n = s.length\n    val sb = StringBuilder()\n    for (i in 0 until n) sb.append(s[(i + k) % n])\n    return sb.toString()\n}`,
        swift: `func getEncryptedString(_ s: String, _ k: Int) -> String {\n    let chars = Array(s)\n    let n = chars.count\n    var out = ""\n    for i in 0..<n { out.append(chars[(i + k) % n]) }\n    return out\n}`,
        rust: `fn getEncryptedString(s: String, k: i32) -> String {\n    let chars: Vec<char> = s.chars().collect();\n    let n = chars.len();\n    let k = k as usize;\n    (0..n).map(|i| chars[(i + k) % n]).collect()\n}`,
        php: `function getEncryptedString($s, $k) {\n    $n = strlen($s);\n    $out = "";\n    for ($i = 0; $i < $n; $i++) $out .= $s[($i + $k) % $n];\n    return $out;\n}`,
        ruby: `def getEncryptedString(s, k)\n  n = s.length\n  (0...n).map { |i| s[(i + k) % n] }.join\nend`,
      },
    };
  })(),

  // ── Number of Changing Keys (LC 3019) ───────────────────────────
  (() => {
    const lower = (c: string) => (c >= "A" && c <= "Z" ? String.fromCharCode(c.charCodeAt(0) + 32) : c);
    const ref = (s: string) => {
      let count = 0;
      for (let i = 1; i < s.length; i++) {
        if (lower(s.charAt(i)) !== lower(s.charAt(i - 1))) count++;
      }
      return count;
    };
    return {
      slug: "number-of-changing-keys",
      title: "Number of Changing Keys",
      difficulty: "EASY" as const,
      tags: ["String", "Amazon", "Google", "Infosys"],
      signature: { funcName: "countKeyChanges", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "`s` records the keys a user typed. **Changing a key** means using a key different from the last one used — shift and caps lock do not count, so typing `'a'` then `'A'` is the same key.\n\nReturn the number of times the user changed keys.",
        [
          { in: 's = "CodeKairo"', out: "8", note: "Every adjacent pair is a different letter." },
          { in: 's = "aAbBcC"', out: "2", note: "`a`→`A` and `b`→`B` and `c`→`C` are all the same key; only `A`→`b` and `B`→`c` count." },
          { in: 's = "AaAaAaaA"', out: "0", note: "One key throughout." },
        ],
        ["1 <= s.length <= 100", "s consists only of upper and lower case English letters."]),
      hints: [
        "Fold both characters to the same case before comparing them.",
        "Only adjacent pairs matter — this is one pass.",
        "A string of length 1 has no pairs, so the answer is 0.",
      ],
      editorial: explain({
        idea: "Walk the string comparing each character with the previous one, after folding both to lower case; count the pairs that differ.",
        steps: [
          "For `i` from 1 to `n - 1`, lower-case `s[i]` and `s[i-1]`.",
          "Count the positions where the two differ.",
        ],
        why: "Case folding is the whole problem — the modifier keys are pressed *with* the letter key, so they never register as a change. Comparing raw characters would report `a`→`A` as a change and inflate the answer.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Comparing characters without folding case counts `a`→`A` wrongly.",
          "The answer counts **transitions**, so it is at most `n - 1`.",
          "A single character yields 0, not 1.",
        ],
      }),
      examples: [
        { input: '"CodeKairo"', expectedOutput: "8" },
        { input: '"aAbBcC"', expectedOutput: "2" },
        { input: '"AaAaAaaA"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 16);
        let s = "";
        for (let i = 0; i < n; i++) {
          const c = randLower(rng, 1);
          s += rng() < 0.5 ? c : c.toUpperCase();
        }
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def countKeyChanges(s: str) -> int:\n    low = s.lower()\n    return sum(1 for i in range(1, len(low)) if low[i] != low[i - 1])`,
        javascript: `var countKeyChanges = function(s) {\n    var low = s.toLowerCase(), count = 0;\n    for (var i = 1; i < low.length; i++) {\n        if (low.charAt(i) !== low.charAt(i - 1)) count++;\n    }\n    return count;\n};`,
        typescript: `function countKeyChanges(s: string): number {\n    var low = s.toLowerCase(), count = 0;\n    for (var i = 1; i < low.length; i++) {\n        if (low.charAt(i) !== low.charAt(i - 1)) count++;\n    }\n    return count;\n}`,
        java: `public static int countKeyChanges(String s) {\n    String low = s.toLowerCase();\n    int count = 0;\n    for (int i = 1; i < low.length(); i++) {\n        if (low.charAt(i) != low.charAt(i - 1)) count++;\n    }\n    return count;\n}`,
        cpp: `int countKeyChanges(string s) {\n    int count = 0;\n    for (size_t i = 1; i < s.size(); i++) {\n        char a = (char) tolower(s[i]);\n        char b = (char) tolower(s[i - 1]);\n        if (a != b) count++;\n    }\n    return count;\n}`,
        c: `int countKeyChanges(char* s) {\n    int n = (int) strlen(s);\n    int count = 0;\n    for (int i = 1; i < n; i++) {\n        char a = s[i] >= 'A' && s[i] <= 'Z' ? (char) (s[i] + 32) : s[i];\n        char b = s[i - 1] >= 'A' && s[i - 1] <= 'Z' ? (char) (s[i - 1] + 32) : s[i - 1];\n        if (a != b) count++;\n    }\n    return count;\n}`,
        csharp: `public static int CountKeyChanges(string s)\n{\n    string low = s.ToLower();\n    int count = 0;\n    for (int i = 1; i < low.Length; i++)\n    {\n        if (low[i] != low[i - 1]) count++;\n    }\n    return count;\n}`,
        go: `func countKeyChanges(s string) int {\n\tfold := func(c byte) byte {\n\t\tif c >= 'A' && c <= 'Z' {\n\t\t\treturn c + 32\n\t\t}\n\t\treturn c\n\t}\n\tcount := 0\n\tfor i := 1; i < len(s); i++ {\n\t\tif fold(s[i]) != fold(s[i-1]) {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countKeyChanges(s: String): Int {\n    val low = s.toLowerCase()\n    var count = 0\n    for (i in 1 until low.length) {\n        if (low[i] != low[i - 1]) count++\n    }\n    return count\n}`,
        swift: `func countKeyChanges(_ s: String) -> Int {\n    let chars = Array(s.lowercased())\n    var count = 0\n    for i in 1..<max(chars.count, 1) where chars[i] != chars[i - 1] { count += 1 }\n    return count\n}`,
        rust: `fn countKeyChanges(s: String) -> i32 {\n    let chars: Vec<char> = s.to_lowercase().chars().collect();\n    let mut count = 0;\n    for i in 1..chars.len() {\n        if chars[i] != chars[i - 1] {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function countKeyChanges($s) {\n    $low = strtolower($s);\n    $count = 0;\n    for ($i = 1; $i < strlen($low); $i++) {\n        if ($low[$i] !== $low[$i - 1]) $count++;\n    }\n    return $count;\n}`,
        ruby: `def countKeyChanges(s)\n  low = s.downcase\n  (1...low.length).count { |i| low[i] != low[i - 1] }\nend`,
      },
    };
  })(),

  // ── Existence of a Substring in a String and Its Reverse (3083) ──
  (() => {
    const ref = (s: string) => {
      for (let i = 0; i + 1 < s.length; i++) {
        const pair = s.charAt(i + 1) + s.charAt(i);
        if (s.indexOf(pair) !== -1) return true;
      }
      return false;
    };
    return {
      slug: "existence-of-a-substring-in-a-string-and-its-reverse",
      title: "Existence of a Substring in a String and Its Reverse",
      difficulty: "EASY" as const,
      tags: ["String", "Hash Table", "Amazon", "Google", "Cognizant"],
      signature: { funcName: "isSubstringPresent", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Return `true` if **any** substring of `s` of length 2 also occurs in the reverse of `s`, and `false` otherwise.",
        [
          { in: 's = "reedkairo"', out: "true", note: "`ee` occurs in the reverse `oriakdeer`." },
          { in: 's = "codekairo"', out: "false", note: "None of `co`, `od`, `de`, `ek`, `ka`, `ai`, `ir`, `ro` survives the reversal." },
          { in: 's = "abcba"', out: "true", note: "`bc` occurs in the reverse, which is the same string." },
        ],
        ["1 <= s.length <= 100", "s consists only of lowercase English letters."]),
      hints: [
        "A pair `xy` appears in the reverse of `s` exactly when `yx` appears in `s`.",
        "So you never need to build the reversed string at all.",
        "For every adjacent pair, look for its flip anywhere in `s`.",
      ],
      editorial: explain({
        idea: "Reversing `s` maps a substring `xy` to `yx`, so `xy` occurs in the reverse precisely when `yx` occurs in `s`. Check each adjacent pair's flip against the original string.",
        steps: [
          "For each `i`, form the flipped pair `s[i+1] + s[i]`.",
          "If that pair occurs anywhere in `s`, return `true`.",
          "Return `false` if none does.",
        ],
        why: "The flip identity is what removes the reversal entirely — building the reversed string and searching it would work but doubles the memory and hides why the test is symmetric. A set of the 26 × 26 possible pairs seen so far turns this into a single O(n) pass if the string were long.",
        time: "O(n²) with a scan per pair, or O(n) with a set of seen pairs",
        space: "O(1), or O(n) with the set",
        pitfalls: [
          "A palindromic pair like `aa` matches itself — that still counts.",
          "A string of length 1 has no pairs and must return `false`.",
          "The match may overlap the original pair; nothing requires them to be disjoint.",
        ],
      }),
      examples: [
        { input: '"reedkairo"', expectedOutput: "true" },
        { input: '"codekairo"', expectedOutput: "false" },
        { input: '"abcba"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        // A small alphabet makes both answers common.
        const n = ri(rng, 1, 12);
        const alphabet = "abcde";
        let s = "";
        for (let i = 0; i < n; i++) s += alphabet.charAt(ri(rng, 0, alphabet.length - 1));
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: `def isSubstringPresent(s: str) -> bool:\n    for i in range(len(s) - 1):\n        if s[i + 1] + s[i] in s:\n            return True\n    return False`,
        javascript: `var isSubstringPresent = function(s) {\n    for (var i = 0; i + 1 < s.length; i++) {\n        var pair = s.charAt(i + 1) + s.charAt(i);\n        if (s.indexOf(pair) !== -1) return true;\n    }\n    return false;\n};`,
        typescript: `function isSubstringPresent(s: string): boolean {\n    for (var i = 0; i + 1 < s.length; i++) {\n        var pair = s.charAt(i + 1) + s.charAt(i);\n        if (s.indexOf(pair) !== -1) return true;\n    }\n    return false;\n}`,
        java: `public static boolean isSubstringPresent(String s) {\n    for (int i = 0; i + 1 < s.length(); i++) {\n        String pair = "" + s.charAt(i + 1) + s.charAt(i);\n        if (s.contains(pair)) return true;\n    }\n    return false;\n}`,
        cpp: `bool isSubstringPresent(string s) {\n    for (size_t i = 0; i + 1 < s.size(); i++) {\n        string pair;\n        pair += s[i + 1];\n        pair += s[i];\n        if (s.find(pair) != string::npos) return true;\n    }\n    return false;\n}`,
        c: `bool isSubstringPresent(char* s) {\n    int n = (int) strlen(s);\n    for (int i = 0; i + 1 < n; i++) {\n        for (int j = 0; j + 1 < n; j++) {\n            if (s[j] == s[i + 1] && s[j + 1] == s[i]) return true;\n        }\n    }\n    return false;\n}`,
        csharp: `public static bool IsSubstringPresent(string s)\n{\n    for (int i = 0; i + 1 < s.Length; i++)\n    {\n        string pair = "" + s[i + 1] + s[i];\n        if (s.Contains(pair)) return true;\n    }\n    return false;\n}`,
        go: `func isSubstringPresent(s string) bool {\n\tfor i := 0; i+1 < len(s); i++ {\n\t\tpair := string([]byte{s[i+1], s[i]})\n\t\tif strings.Contains(s, pair) {\n\t\t\treturn true\n\t\t}\n\t}\n\treturn false\n}`,
        kotlin: `fun isSubstringPresent(s: String): Boolean {\n    for (i in 0 until s.length - 1) {\n        val pair = "" + s[i + 1] + s[i]\n        if (s.contains(pair)) return true\n    }\n    return false\n}`,
        swift: `func isSubstringPresent(_ s: String) -> Bool {\n    let chars = Array(s)\n    let n = chars.count\n    for i in 0..<max(n - 1, 0) {\n        for j in 0..<max(n - 1, 0) {\n            if chars[j] == chars[i + 1] && chars[j + 1] == chars[i] { return true }\n        }\n    }\n    return false\n}`,
        rust: `fn isSubstringPresent(s: String) -> bool {\n    let chars: Vec<char> = s.chars().collect();\n    let n = chars.len();\n    for i in 0..n.saturating_sub(1) {\n        for j in 0..n.saturating_sub(1) {\n            if chars[j] == chars[i + 1] && chars[j + 1] == chars[i] {\n                return true;\n            }\n        }\n    }\n    false\n}`,
        php: `function isSubstringPresent($s) {\n    $n = strlen($s);\n    for ($i = 0; $i + 1 < $n; $i++) {\n        $pair = $s[$i + 1] . $s[$i];\n        if (strpos($s, $pair) !== false) return true;\n    }\n    return false;\n}`,
        ruby: `def isSubstringPresent(s)\n  (0...(s.length - 1)).each do |i|\n    return true if s.include?(s[i + 1] + s[i])\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Count Asterisks (LC 2315) ───────────────────────────────────
  (() => {
    const ref = (s: string) => {
      let count = 0, inside = false;
      for (let i = 0; i < s.length; i++) {
        const c = s.charAt(i);
        if (c === "|") inside = !inside;
        else if (c === "*" && !inside) count++;
      }
      return count;
    };
    return {
      slug: "count-asterisks",
      title: "Count Asterisks",
      difficulty: "EASY" as const,
      tags: ["String", "Amazon", "Google", "Accenture"],
      signature: { funcName: "countAsterisks", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "`s` is divided into **pairs** of vertical bars: the 1st and 2nd `'|'` form a pair, the 3rd and 4th another, and so on. `s` always holds an even number of bars.\n\nReturn the number of `'*'` characters that lie **outside** every such pair.",
        [
          { in: 's = "code|*kai*|ro**"', out: "2", note: "The two stars inside the bar pair are excluded; the trailing `**` counts." },
          { in: 's = "codekairo"', out: "0", note: "No stars at all." },
          { in: 's = "yo|uar|e**|b|e***au|tifu|l"', out: "5", note: "The segments outside the pairs are `yo`, `e**`, `e***au` and `l`." },
        ],
        ["1 <= s.length <= 1000", "s consists of lowercase English letters, vertical bars '|' and asterisks '*'.", "s contains an even number of vertical bars '|'."]),
      hints: [
        "Sweep left to right keeping one boolean: are you currently between a pair of bars?",
        "Every `'|'` flips that boolean.",
        "Count a `'*'` only while the boolean is false.",
      ],
      editorial: explain({
        idea: "One pass with a single `inside` flag. Each bar toggles it; a star counts only when the flag is off.",
        steps: [
          "Start with `inside = false` and `count = 0`.",
          "For each character: a `'|'` flips `inside`; a `'*'` with `inside` false increments `count`.",
          "Return `count`.",
        ],
        why: "Because the bar count is guaranteed even, a single toggling flag is enough — there is no nesting to track and no unbalanced bar to recover from. Splitting the string on `'|'` and summing the stars in the even-indexed pieces is the same idea written differently.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The bars themselves are never counted, only the asterisks.",
          "A star sitting immediately after an opening bar is inside, not outside.",
          "The flag must toggle on **every** bar, including the closing one.",
        ],
      }),
      examples: [
        { input: '"code|*kai*|ro**"', expectedOutput: "2" },
        { input: '"codekairo"', expectedOutput: "0" },
        { input: '"yo|uar|e**|b|e***au|tifu|l"', expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const pieces = ri(rng, 1, 6);
        let s = "";
        let bars = 0;
        for (let p = 0; p < pieces; p++) {
          const len = ri(rng, 0, 4);
          for (let i = 0; i < len; i++) s += rng() < 0.4 ? "*" : randLower(rng, 1);
          if (rng() < 0.6) { s += "|"; bars++; }
        }
        if (bars % 2 === 1) s += "|";
        if (s.length === 0) s = randLower(rng, 1);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def countAsterisks(s: str) -> int:\n    count = 0\n    inside = False\n    for c in s:\n        if c == "|":\n            inside = not inside\n        elif c == "*" and not inside:\n            count += 1\n    return count`,
        javascript: `var countAsterisks = function(s) {\n    var count = 0, inside = false;\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (c === "|") inside = !inside;\n        else if (c === "*" && !inside) count++;\n    }\n    return count;\n};`,
        typescript: `function countAsterisks(s: string): number {\n    var count = 0, inside = false;\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (c === "|") inside = !inside;\n        else if (c === "*" && !inside) count++;\n    }\n    return count;\n}`,
        java: `public static int countAsterisks(String s) {\n    int count = 0;\n    boolean inside = false;\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        if (c == '|') inside = !inside;\n        else if (c == '*' && !inside) count++;\n    }\n    return count;\n}`,
        cpp: `int countAsterisks(string s) {\n    int count = 0;\n    bool inside = false;\n    for (char c : s) {\n        if (c == '|') inside = !inside;\n        else if (c == '*' && !inside) count++;\n    }\n    return count;\n}`,
        c: `int countAsterisks(char* s) {\n    int count = 0, inside = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        if (s[i] == '|') inside = !inside;\n        else if (s[i] == '*' && !inside) count++;\n    }\n    return count;\n}`,
        csharp: `public static int CountAsterisks(string s)\n{\n    int count = 0;\n    bool inside = false;\n    foreach (char c in s)\n    {\n        if (c == '|') inside = !inside;\n        else if (c == '*' && !inside) count++;\n    }\n    return count;\n}`,
        go: `func countAsterisks(s string) int {\n\tcount := 0\n\tinside := false\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] == '|' {\n\t\t\tinside = !inside\n\t\t} else if s[i] == '*' && !inside {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countAsterisks(s: String): Int {\n    var count = 0\n    var inside = false\n    for (c in s) {\n        if (c == '|') inside = !inside\n        else if (c == '*' && !inside) count++\n    }\n    return count\n}`,
        swift: `func countAsterisks(_ s: String) -> Int {\n    var count = 0\n    var inside = false\n    for c in s {\n        if c == "|" {\n            inside = !inside\n        } else if c == "*" && !inside {\n            count += 1\n        }\n    }\n    return count\n}`,
        rust: `fn countAsterisks(s: String) -> i32 {\n    let mut count = 0;\n    let mut inside = false;\n    for c in s.chars() {\n        if c == '|' {\n            inside = !inside;\n        } else if c == '*' && !inside {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function countAsterisks($s) {\n    $count = 0;\n    $inside = false;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] === "|") $inside = !$inside;\n        elseif ($s[$i] === "*" && !$inside) $count++;\n    }\n    return $count;\n}`,
        ruby: `def countAsterisks(s)\n  count = 0\n  inside = false\n  s.each_char do |c|\n    if c == "|"\n      inside = !inside\n    elsif c == "*" && !inside\n      count += 1\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Count Prefixes of a Given String (LC 2255) ──────────────────
  (() => {
    const ref = (words: string[], s: string) => {
      let count = 0;
      for (let i = 0; i < words.length; i++) {
        if (words[i].length <= s.length && s.slice(0, words[i].length) === words[i]) count++;
      }
      return count;
    };
    return {
      slug: "count-prefixes-of-a-given-string",
      title: "Count Prefixes of a Given String",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Amazon", "Google", "Wipro"],
      signature: { funcName: "countPrefixes", params: [{ name: "words", type: "string[]" as const }, { name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Return the number of strings in `words` that are a **prefix** of `s`.\n\nA prefix is any leading run of characters, including the whole string.",
        [
          { in: 'words = ["co","code","kai","codek"], s = "codekairo"', out: "3", note: "`co`, `code` and `codek` all start `codekairo`; `kai` does not." },
          { in: 'words = ["a","b","c","ab","bc","abc"], s = "abc"', out: "3", note: "`a`, `ab` and `abc`." },
          { in: 'words = ["a","a"], s = "aa"', out: "2", note: "Duplicates each count." },
        ],
        ["1 <= words.length <= 1000", "1 <= words[i].length, s.length <= 10", "words[i] and s consist of lowercase English letters."]),
      hints: [
        "A word longer than `s` can never be a prefix of it.",
        "Otherwise compare the word against the first `len(word)` characters of `s`.",
        "Duplicated words count once each — do not deduplicate.",
      ],
      editorial: explain({
        idea: "For each word, check whether `s` starts with it. Most languages have a built-in `startsWith`; otherwise compare the leading slice.",
        steps: [
          "For each word, reject it immediately if it is longer than `s`.",
          "Compare it against `s`'s first `word.length` characters.",
          "Count the matches.",
        ],
        why: "The length check comes first because slicing past the end of `s` silently returns a shorter string in some languages and throws in others — guarding on length makes the comparison correct everywhere. Building a set of `s`'s prefixes up front would also work and is faster when `words` is huge.",
        time: "O(n · m) where m is the length of s",
        space: "O(1)",
        pitfalls: [
          "Equal strings count — a word may be the whole of `s`.",
          "Duplicates in `words` are counted separately.",
          "\"Prefix\" means from the start, not \"contained anywhere\".",
        ],
      }),
      examples: [
        { input: '["co","code","kai","codek"]\n"codekairo"', expectedOutput: "3" },
        { input: '["a","b","c","ab","bc","abc"]\n"abc"', expectedOutput: "3" },
        { input: '["a","a"]\n"aa"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, ri(rng, 1, 8));
        const count = ri(rng, 1, 8);
        const words = Array.from({ length: count }, () =>
          // Half genuine prefixes of s, half random, so both branches are hit.
          rng() < 0.5 ? s.slice(0, ri(rng, 1, s.length)) : randLower(rng, ri(rng, 1, 6)));
        return { input: `${fmtStrArr(words)}\n"${s}"`, expectedOutput: String(ref(words, s)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countPrefixes(words: List[str], s: str) -> int:\n    return sum(1 for w in words if s.startswith(w))`,
        javascript: `var countPrefixes = function(words, s) {\n    var count = 0;\n    for (var i = 0; i < words.length; i++) {\n        var w = words[i];\n        if (w.length <= s.length && s.slice(0, w.length) === w) count++;\n    }\n    return count;\n};`,
        typescript: `function countPrefixes(words: string[], s: string): number {\n    var count = 0;\n    for (var i = 0; i < words.length; i++) {\n        var w = words[i];\n        if (w.length <= s.length && s.slice(0, w.length) === w) count++;\n    }\n    return count;\n}`,
        java: `public static int countPrefixes(String[] words, String s) {\n    int count = 0;\n    for (String w : words) {\n        if (s.startsWith(w)) count++;\n    }\n    return count;\n}`,
        cpp: `int countPrefixes(vector<string>& words, string s) {\n    int count = 0;\n    for (auto& w : words) {\n        if (w.size() <= s.size() && s.compare(0, w.size(), w) == 0) count++;\n    }\n    return count;\n}`,
        c: `int countPrefixes(char** words, int wordsSize, char* s) {\n    int count = 0;\n    size_t sl = strlen(s);\n    for (int i = 0; i < wordsSize; i++) {\n        size_t wl = strlen(words[i]);\n        if (wl <= sl && strncmp(s, words[i], wl) == 0) count++;\n    }\n    return count;\n}`,
        csharp: `public static int CountPrefixes(string[] words, string s)\n{\n    int count = 0;\n    foreach (var w in words)\n    {\n        if (s.StartsWith(w)) count++;\n    }\n    return count;\n}`,
        go: `func countPrefixes(words []string, s string) int {\n\tcount := 0\n\tfor _, w := range words {\n\t\tif strings.HasPrefix(s, w) {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countPrefixes(words: Array<String>, s: String): Int {\n    return words.count { s.startsWith(it) }\n}`,
        swift: `func countPrefixes(_ words: [String], _ s: String) -> Int {\n    return words.filter { s.hasPrefix($0) }.count\n}`,
        rust: `fn countPrefixes(words: Vec<String>, s: String) -> i32 {\n    words.iter().filter(|w| s.starts_with(w.as_str())).count() as i32\n}`,
        php: `function countPrefixes($words, $s) {\n    $count = 0;\n    foreach ($words as $w) {\n        if (strlen($w) <= strlen($s) && substr($s, 0, strlen($w)) === $w) $count++;\n    }\n    return $count;\n}`,
        ruby: `def countPrefixes(words, s)\n  words.count { |w| s.start_with?(w) }\nend`,
      },
    };
  })(),

  // ── Decode the Message (LC 2325) ────────────────────────────────
  (() => {
    const ref = (key: string, message: string) => {
      const map: Record<string, string> = {};
      let next = 0;
      for (let i = 0; i < key.length; i++) {
        const c = key.charAt(i);
        if (c !== " " && map[c] === undefined) {
          map[c] = String.fromCharCode(97 + next);
          next++;
        }
      }
      let out = "";
      for (let i = 0; i < message.length; i++) {
        const c = message.charAt(i);
        out += c === " " ? " " : map[c];
      }
      return out;
    };
    return {
      slug: "decode-the-message",
      title: "Decode the Message",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Amazon", "Google", "Zoho"],
      signature: { funcName: "decodeMessage", params: [{ name: "key", type: "string" as const }, { name: "message", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Build a substitution table from `key`: walk it left to right and the **first time** each new letter appears, map it to `'a'`, then `'b'`, then `'c'`, and so on. Spaces in `key` are skipped.\n\nDecode `message` with that table, leaving its spaces in place, and return the result.",
        [
          { in: 'key = "codekairo builds the fastest judge in every language zxq w mvp", message = "rbnk yrk dfekn"', out: "hire the coder", note: "`c`→`a`, `o`→`b`, `d`→`c`, … so `r`→`h`, `b`→`i`, `n`→`r`, `k`→`e`." },
          { in: 'key = "the quick brown fox jumps over the lazy dog", message = "vkbs bs t suepuv"', out: "this is a secret" },
          { in: 'key = "eljuxhpwnyrdgtqkviszcfmabo", message = "zwx hnfx lqantp mnoeius ycgk vcnjrdb"', out: "the five boxing wizards jump quickly" },
        ],
        ["26 <= key.length <= 2000", "key consists of lowercase English letters and spaces.", "key contains every letter in the English alphabet at least once.", "1 <= message.length <= 2000", "message consists of lowercase English letters and spaces."]),
      hints: [
        "Only the **first** occurrence of a letter in `key` matters; later ones are ignored.",
        "A 26-slot table or a hash map is enough to hold the substitution.",
        "Spaces pass through untouched, in both the key and the message.",
      ],
      editorial: explain({
        idea: "One pass over `key` builds the table — each unseen letter claims the next letter of the alphabet — and a second pass rewrites `message` through it.",
        steps: [
          "Walk `key`; on a letter not yet in the table, map it to `'a' + next` and advance `next`.",
          "Walk `message`; emit a space unchanged, otherwise the mapped letter.",
        ],
        why: "The \"first occurrence only\" rule is what makes the table a well-defined bijection — the key is longer than 26 characters and letters repeat, so overwriting on every occurrence would scramble the mapping. The alphabet guarantee means every letter in `message` is certain to have an entry.",
        time: "O(len(key) + len(message))",
        space: "O(1) — at most 26 entries",
        pitfalls: [
          "Overwriting the map on repeat occurrences breaks the decoding.",
          "Spaces must be skipped when assigning letters, or they would consume a slot.",
          "The table maps key-letter → plain-letter; inverting it decodes backwards.",
        ],
      }),
      examples: [
        { input: '"codekairo builds the fastest judge in every language zxq w mvp"\n"rbnk yrk dfekn"', expectedOutput: "hire the coder" },
        { input: '"the quick brown fox jumps over the lazy dog"\n"vkbs bs t suepuv"', expectedOutput: "this is a secret" },
        { input: '"eljuxhpwnyrdgtqkviszcfmabo"\n"zwx hnfx lqantp mnoeius ycgk vcnjrdb"', expectedOutput: "the five boxing wizards jump quickly" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
        const order = shuffle(rng, alphabet.slice());
        // Sprinkle spaces and repeats so the "first occurrence wins" rule is exercised.
        let key = "";
        for (let i = 0; i < order.length; i++) {
          key += order[i];
          if (rng() < 0.2) key += order[ri(rng, 0, i)];
          if (rng() < 0.25) key += " ";
        }
        const words = ri(rng, 1, 4);
        const parts: string[] = [];
        for (let w = 0; w < words; w++) parts.push(randLower(rng, ri(rng, 1, 6)));
        const message = parts.join(" ");
        return { input: `"${key}"\n"${message}"`, expectedOutput: ref(key, message) };
      },
      solutions: {
        python: `def decodeMessage(key: str, message: str) -> str:\n    table = {}\n    nxt = 0\n    for c in key:\n        if c != " " and c not in table:\n            table[c] = chr(ord("a") + nxt)\n            nxt += 1\n    return "".join(" " if c == " " else table[c] for c in message)`,
        javascript: `var decodeMessage = function(key, message) {\n    var table = {}, next = 0, i;\n    for (i = 0; i < key.length; i++) {\n        var c = key.charAt(i);\n        if (c !== " " && table[c] === undefined) {\n            table[c] = String.fromCharCode(97 + next);\n            next++;\n        }\n    }\n    var out = "";\n    for (i = 0; i < message.length; i++) {\n        var m = message.charAt(i);\n        out += m === " " ? " " : table[m];\n    }\n    return out;\n};`,
        typescript: `function decodeMessage(key: string, message: string): string {\n    var table: { [k: string]: string } = {}, next = 0, i: number;\n    for (i = 0; i < key.length; i++) {\n        var c = key.charAt(i);\n        if (c !== " " && table[c] === undefined) {\n            table[c] = String.fromCharCode(97 + next);\n            next++;\n        }\n    }\n    var out = "";\n    for (i = 0; i < message.length; i++) {\n        var m = message.charAt(i);\n        out += m === " " ? " " : table[m];\n    }\n    return out;\n}`,
        java: `public static String decodeMessage(String key, String message) {\n    char[] table = new char[26];\n    int next = 0;\n    for (int i = 0; i < key.length(); i++) {\n        char c = key.charAt(i);\n        if (c != ' ' && table[c - 'a'] == 0) {\n            table[c - 'a'] = (char) ('a' + next);\n            next++;\n        }\n    }\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < message.length(); i++) {\n        char m = message.charAt(i);\n        sb.append(m == ' ' ? ' ' : table[m - 'a']);\n    }\n    return sb.toString();\n}`,
        cpp: `string decodeMessage(string key, string message) {\n    vector<char> table(26, 0);\n    int next = 0;\n    for (char c : key) {\n        if (c != ' ' && table[c - 'a'] == 0) {\n            table[c - 'a'] = (char) ('a' + next);\n            next++;\n        }\n    }\n    string out;\n    for (char m : message) out += (m == ' ' ? ' ' : table[m - 'a']);\n    return out;\n}`,
        c: `char* decodeMessage(char* key, char* message) {\n    char table[26];\n    for (int i = 0; i < 26; i++) table[i] = 0;\n    int next = 0;\n    for (int i = 0; key[i] != '\\0'; i++) {\n        char c = key[i];\n        if (c != ' ' && table[c - 'a'] == 0) {\n            table[c - 'a'] = (char) ('a' + next);\n            next++;\n        }\n    }\n    int n = (int) strlen(message);\n    char* out = (char*) malloc((size_t) n + 1);\n    for (int i = 0; i < n; i++) {\n        out[i] = message[i] == ' ' ? ' ' : table[message[i] - 'a'];\n    }\n    out[n] = '\\0';\n    return out;\n}`,
        csharp: `public static string DecodeMessage(string key, string message)\n{\n    var table = new char[26];\n    int next = 0;\n    foreach (char c in key)\n    {\n        if (c != ' ' && table[c - 'a'] == '\\0')\n        {\n            table[c - 'a'] = (char) ('a' + next);\n            next++;\n        }\n    }\n    var sb = new System.Text.StringBuilder();\n    foreach (char m in message) sb.Append(m == ' ' ? ' ' : table[m - 'a']);\n    return sb.ToString();\n}`,
        go: `func decodeMessage(key string, message string) string {\n\tvar table [26]byte\n\tnext := byte(0)\n\tfor i := 0; i < len(key); i++ {\n\t\tc := key[i]\n\t\tif c != ' ' && table[c-'a'] == 0 {\n\t\t\ttable[c-'a'] = 'a' + next\n\t\t\tnext++\n\t\t}\n\t}\n\tout := make([]byte, len(message))\n\tfor i := 0; i < len(message); i++ {\n\t\tif message[i] == ' ' {\n\t\t\tout[i] = ' '\n\t\t} else {\n\t\t\tout[i] = table[message[i]-'a']\n\t\t}\n\t}\n\treturn string(out)\n}`,
        kotlin: `fun decodeMessage(key: String, message: String): String {\n    val table = CharArray(26)\n    var next = 0\n    for (c in key) {\n        if (c != ' ' && table[c - 'a'] == '\\u0000') {\n            table[c - 'a'] = ('a' + next)\n            next++\n        }\n    }\n    val sb = StringBuilder()\n    for (m in message) sb.append(if (m == ' ') ' ' else table[m - 'a'])\n    return sb.toString()\n}`,
        swift: `func decodeMessage(_ key: String, _ message: String) -> String {\n    var table = [Character: Character]()\n    var next = 0\n    let letters = Array("abcdefghijklmnopqrstuvwxyz")\n    for c in key where c != " " && table[c] == nil {\n        table[c] = letters[next]\n        next += 1\n    }\n    var out = ""\n    for m in message {\n        out.append(m == " " ? " " : table[m]!)\n    }\n    return out\n}`,
        rust: `fn decodeMessage(key: String, message: String) -> String {\n    let mut table = [0u8; 26];\n    let mut next = 0u8;\n    for c in key.bytes() {\n        if c != b' ' && table[(c - b'a') as usize] == 0 {\n            table[(c - b'a') as usize] = b'a' + next;\n            next += 1;\n        }\n    }\n    message\n        .bytes()\n        .map(|m| if m == b' ' { ' ' } else { table[(m - b'a') as usize] as char })\n        .collect()\n}`,
        php: `function decodeMessage($key, $message) {\n    $table = [];\n    $next = 0;\n    for ($i = 0; $i < strlen($key); $i++) {\n        $c = $key[$i];\n        if ($c !== " " && !isset($table[$c])) {\n            $table[$c] = chr(97 + $next);\n            $next++;\n        }\n    }\n    $out = "";\n    for ($i = 0; $i < strlen($message); $i++) {\n        $m = $message[$i];\n        $out .= $m === " " ? " " : $table[$m];\n    }\n    return $out;\n}`,
        ruby: `def decodeMessage(key, message)\n  table = {}\n  nxt = 0\n  key.each_char do |c|\n    next if c == " " || table.key?(c)\n    table[c] = (97 + nxt).chr\n    nxt += 1\n  end\n  message.each_char.map { |m| m == " " ? " " : table[m] }.join\nend`,
      },
    };
  })(),

  // ── Strong Password Checker II (LC 2299) ────────────────────────
  (() => {
    const SPECIAL = "!@#$%^&*()-+";
    const ref = (password: string) => {
      if (password.length < 8) return false;
      let lower = false, upper = false, digit = false, special = false;
      for (let i = 0; i < password.length; i++) {
        const c = password.charAt(i);
        if (i > 0 && c === password.charAt(i - 1)) return false;
        if (c >= "a" && c <= "z") lower = true;
        else if (c >= "A" && c <= "Z") upper = true;
        else if (c >= "0" && c <= "9") digit = true;
        else if (SPECIAL.indexOf(c) !== -1) special = true;
      }
      return lower && upper && digit && special;
    };
    return {
      slug: "strong-password-checker-ii",
      title: "Strong Password Checker II",
      difficulty: "EASY" as const,
      tags: ["String", "Amazon", "Google", "TCS"],
      signature: { funcName: "strongPasswordCheckerII", params: [{ name: "password", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A password is **strong** when all of the following hold:\n\n- it is at least 8 characters long;\n- it contains at least one lowercase letter;\n- it contains at least one uppercase letter;\n- it contains at least one digit;\n- it contains at least one of `!@#$%^&*()-+`;\n- it contains **no two adjacent equal characters**.\n\nReturn `true` if `password` is strong.",
        [
          { in: 'password = "CodeKairo#1"', out: "true", note: "Long enough, all four character classes, and no repeated neighbours." },
          { in: 'password = "Coode#1Kairo"', out: "false", note: "The `oo` in `Coode` breaks the adjacency rule." },
          { in: 'password = "Me+You--IsMyDream"', out: "false", note: "No digit, and `--` repeats." },
        ],
        ["1 <= password.length <= 100", "password consists of letters, digits, and characters in \"!@#$%^&*()-+\"."]),
      hints: [
        "Every rule can be checked in a single left-to-right pass.",
        "Track four booleans for the character classes and compare each character with its predecessor.",
        "Return false the moment two neighbours are equal — no later character can undo it.",
      ],
      editorial: explain({
        idea: "One pass. Reject short passwords up front, then for each character update the four class flags and compare it with the one before it.",
        steps: [
          "If the length is under 8, return false.",
          "For each index, return false if the character equals its predecessor.",
          "Set the lowercase/uppercase/digit/special flag according to the character's class.",
          "Return the conjunction of the four flags.",
        ],
        why: "The adjacency rule is the only one that can fail *early* and is worth short-circuiting on; the four class flags can only ever turn on, so they are safe to accumulate and test at the end. Checking the classes with separate scans would be four passes for no gain.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Adjacent equality applies to **any** character, digits and specials included, not just letters.",
          "Exactly 8 characters is long enough — the bound is inclusive.",
          "The special set is fixed; characters outside it satisfy no class at all.",
        ],
      }),
      examples: [
        { input: '"CodeKairo#1"', expectedOutput: "true" },
        { input: '"Coode#1Kairo"', expectedOutput: "false" },
        { input: '"Me+You--IsMyDream"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const pools = ["abcdefghijk", "ABCDEFGHIJK", "0123456789", "!@#$%^&*()-+"];
        const n = ri(rng, 1, 14);
        let s = "";
        for (let i = 0; i < n; i++) {
          const pool = pools[ri(rng, 0, 3)];
          s += pool.charAt(ri(rng, 0, pool.length - 1));
        }
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: `def strongPasswordCheckerII(password: str) -> bool:\n    if len(password) < 8:\n        return False\n    special = "!@#$%^&*()-+"\n    lower = upper = digit = spec = False\n    for i, c in enumerate(password):\n        if i > 0 and c == password[i - 1]:\n            return False\n        if c.islower():\n            lower = True\n        elif c.isupper():\n            upper = True\n        elif c.isdigit():\n            digit = True\n        elif c in special:\n            spec = True\n    return lower and upper and digit and spec`,
        javascript: `var strongPasswordCheckerII = function(password) {\n    if (password.length < 8) return false;\n    var SPECIAL = "!@#$%^&*()-+";\n    var lower = false, upper = false, digit = false, special = false;\n    for (var i = 0; i < password.length; i++) {\n        var c = password.charAt(i);\n        if (i > 0 && c === password.charAt(i - 1)) return false;\n        if (c >= "a" && c <= "z") lower = true;\n        else if (c >= "A" && c <= "Z") upper = true;\n        else if (c >= "0" && c <= "9") digit = true;\n        else if (SPECIAL.indexOf(c) !== -1) special = true;\n    }\n    return lower && upper && digit && special;\n};`,
        typescript: `function strongPasswordCheckerII(password: string): boolean {\n    if (password.length < 8) return false;\n    var SPECIAL = "!@#$%^&*()-+";\n    var lower = false, upper = false, digit = false, special = false;\n    for (var i = 0; i < password.length; i++) {\n        var c = password.charAt(i);\n        if (i > 0 && c === password.charAt(i - 1)) return false;\n        if (c >= "a" && c <= "z") lower = true;\n        else if (c >= "A" && c <= "Z") upper = true;\n        else if (c >= "0" && c <= "9") digit = true;\n        else if (SPECIAL.indexOf(c) !== -1) special = true;\n    }\n    return lower && upper && digit && special;\n}`,
        java: `public static boolean strongPasswordCheckerII(String password) {\n    if (password.length() < 8) return false;\n    String special = "!@#$%^&*()-+";\n    boolean lower = false, upper = false, digit = false, spec = false;\n    for (int i = 0; i < password.length(); i++) {\n        char c = password.charAt(i);\n        if (i > 0 && c == password.charAt(i - 1)) return false;\n        if (c >= 'a' && c <= 'z') lower = true;\n        else if (c >= 'A' && c <= 'Z') upper = true;\n        else if (c >= '0' && c <= '9') digit = true;\n        else if (special.indexOf(c) >= 0) spec = true;\n    }\n    return lower && upper && digit && spec;\n}`,
        cpp: `bool strongPasswordCheckerII(string password) {\n    if (password.size() < 8) return false;\n    string special = "!@#$%^&*()-+";\n    bool lower = false, upper = false, digit = false, spec = false;\n    for (size_t i = 0; i < password.size(); i++) {\n        char c = password[i];\n        if (i > 0 && c == password[i - 1]) return false;\n        if (c >= 'a' && c <= 'z') lower = true;\n        else if (c >= 'A' && c <= 'Z') upper = true;\n        else if (c >= '0' && c <= '9') digit = true;\n        else if (special.find(c) != string::npos) spec = true;\n    }\n    return lower && upper && digit && spec;\n}`,
        c: `bool strongPasswordCheckerII(char* password) {\n    int n = (int) strlen(password);\n    if (n < 8) return false;\n    const char* special = "!@#$%^&*()-+";\n    bool lower = false, upper = false, digit = false, spec = false;\n    for (int i = 0; i < n; i++) {\n        char c = password[i];\n        if (i > 0 && c == password[i - 1]) return false;\n        if (c >= 'a' && c <= 'z') lower = true;\n        else if (c >= 'A' && c <= 'Z') upper = true;\n        else if (c >= '0' && c <= '9') digit = true;\n        else if (strchr(special, c) != NULL) spec = true;\n    }\n    return lower && upper && digit && spec;\n}`,
        csharp: `public static bool StrongPasswordCheckerII(string password)\n{\n    if (password.Length < 8) return false;\n    const string special = "!@#$%^&*()-+";\n    bool lower = false, upper = false, digit = false, spec = false;\n    for (int i = 0; i < password.Length; i++)\n    {\n        char c = password[i];\n        if (i > 0 && c == password[i - 1]) return false;\n        if (c >= 'a' && c <= 'z') lower = true;\n        else if (c >= 'A' && c <= 'Z') upper = true;\n        else if (c >= '0' && c <= '9') digit = true;\n        else if (special.IndexOf(c) >= 0) spec = true;\n    }\n    return lower && upper && digit && spec;\n}`,
        go: `func strongPasswordCheckerII(password string) bool {\n\tif len(password) < 8 {\n\t\treturn false\n\t}\n\tspecial := "!@#$%^&*()-+"\n\tlower, upper, digit, spec := false, false, false, false\n\tfor i := 0; i < len(password); i++ {\n\t\tc := password[i]\n\t\tif i > 0 && c == password[i-1] {\n\t\t\treturn false\n\t\t}\n\t\tswitch {\n\t\tcase c >= 'a' && c <= 'z':\n\t\t\tlower = true\n\t\tcase c >= 'A' && c <= 'Z':\n\t\t\tupper = true\n\t\tcase c >= '0' && c <= '9':\n\t\t\tdigit = true\n\t\tcase strings.IndexByte(special, c) >= 0:\n\t\t\tspec = true\n\t\t}\n\t}\n\treturn lower && upper && digit && spec\n}`,
        kotlin: `fun strongPasswordCheckerII(password: String): Boolean {\n    if (password.length < 8) return false\n    val special = "!@#\\u0024%^&*()-+"\n    var lower = false\n    var upper = false\n    var digit = false\n    var spec = false\n    for (i in password.indices) {\n        val c = password[i]\n        if (i > 0 && c == password[i - 1]) return false\n        when {\n            c in 'a'..'z' -> lower = true\n            c in 'A'..'Z' -> upper = true\n            c in '0'..'9' -> digit = true\n            special.indexOf(c) >= 0 -> spec = true\n        }\n    }\n    return lower && upper && digit && spec\n}`,
        swift: `func strongPasswordCheckerII(_ password: String) -> Bool {\n    let chars = Array(password)\n    if chars.count < 8 { return false }\n    let special = Set("!@#$%^&*()-+")\n    var lower = false, upper = false, digit = false, spec = false\n    for i in 0..<chars.count {\n        let c = chars[i]\n        if i > 0 && c == chars[i - 1] { return false }\n        if c >= "a" && c <= "z" { lower = true }\n        else if c >= "A" && c <= "Z" { upper = true }\n        else if c >= "0" && c <= "9" { digit = true }\n        else if special.contains(c) { spec = true }\n    }\n    return lower && upper && digit && spec\n}`,
        rust: `fn strongPasswordCheckerII(password: String) -> bool {\n    let chars: Vec<char> = password.chars().collect();\n    if chars.len() < 8 {\n        return false;\n    }\n    let special = "!@#$%^&*()-+";\n    let (mut lower, mut upper, mut digit, mut spec) = (false, false, false, false);\n    for i in 0..chars.len() {\n        let c = chars[i];\n        if i > 0 && c == chars[i - 1] {\n            return false;\n        }\n        if c.is_ascii_lowercase() {\n            lower = true;\n        } else if c.is_ascii_uppercase() {\n            upper = true;\n        } else if c.is_ascii_digit() {\n            digit = true;\n        } else if special.contains(c) {\n            spec = true;\n        }\n    }\n    lower && upper && digit && spec\n}`,
        php: `function strongPasswordCheckerII($password) {\n    $n = strlen($password);\n    if ($n < 8) return false;\n    $special = '!@#$%^&*()-+';\n    $lower = false; $upper = false; $digit = false; $spec = false;\n    for ($i = 0; $i < $n; $i++) {\n        $c = $password[$i];\n        if ($i > 0 && $c === $password[$i - 1]) return false;\n        if ($c >= "a" && $c <= "z") $lower = true;\n        elseif ($c >= "A" && $c <= "Z") $upper = true;\n        elseif ($c >= "0" && $c <= "9") $digit = true;\n        elseif (strpos($special, $c) !== false) $spec = true;\n    }\n    return $lower && $upper && $digit && $spec;\n}`,
        ruby: `def strongPasswordCheckerII(password)\n  return false if password.length < 8\n  special = "!@#\\u0024%^&*()-+"\n  lower = upper = digit = spec = false\n  password.each_char.with_index do |c, i|\n    return false if i > 0 && c == password[i - 1]\n    if c >= "a" && c <= "z"\n      lower = true\n    elsif c >= "A" && c <= "Z"\n      upper = true\n    elsif c >= "0" && c <= "9"\n      digit = true\n    elsif special.include?(c)\n      spec = true\n    end\n  end\n  lower && upper && digit && spec\nend`,
      },
    };
  })(),

  // ── Find Words Containing Character (LC 2942) ───────────────────
  (() => {
    const ref = (words: string[], x: string) => {
      const out: number[] = [];
      for (let i = 0; i < words.length; i++) {
        if (words[i].indexOf(x) !== -1) out.push(i);
      }
      return out;
    };
    return {
      slug: "find-words-containing-character",
      title: "Find Words Containing Character",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Amazon", "Google", "Capgemini"],
      signature: { funcName: "findWordsContaining", params: [{ name: "words", type: "string[]" as const }, { name: "x", type: "string" as const }], returns: "int[]" as const },
      description: describe(
        "Given an array of strings `words` and a single character `x`, return the **indices** of the words that contain `x`, in increasing order.",
        [
          { in: 'words = ["code","kairo","judge"], x = "o"', out: "[0,1]", note: "`judge` has no `o`." },
          { in: 'words = ["abc","bcd","aaaa","cbc"], x = "a"', out: "[0,2]" },
          { in: 'words = ["abc","bcd","aaaa","cbc"], x = "z"', out: "[]", note: "No word contains `z`." },
        ],
        ["1 <= words.length <= 50", "1 <= words[i].length <= 50", "x is a lowercase English letter.", "words[i] consists only of lowercase English letters."]),
      hints: [
        "Walk the array in order and test each word for the character.",
        "Collecting indices left to right already gives increasing order.",
        "An empty result is valid — return an empty array, not null.",
      ],
      editorial: explain({
        idea: "A single pass: for each index, if the word contains `x`, record the index.",
        steps: [
          "Iterate over `words` with its index.",
          "Test membership of `x` with a substring search or a character loop.",
          "Append the index to the result when found.",
        ],
        why: "Scanning in index order is what makes the output sorted for free — no sort is needed. The only thing to be careful about is returning an empty array rather than null when nothing matches, which some judges treat differently.",
        time: "O(n · m)",
        space: "O(n) for the output",
        pitfalls: [
          "Return **indices**, not the words themselves.",
          "An empty answer must still be an array.",
          "A word containing `x` several times is still recorded once.",
        ],
      }),
      examples: [
        { input: '["code","kairo","judge"]\n"o"', expectedOutput: "[0,1]" },
        { input: '["abc","bcd","aaaa","cbc"]\n"a"', expectedOutput: "[0,2]" },
        { input: '["abc","bcd","aaaa","cbc"]\n"z"', expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const count = ri(rng, 1, 8);
        const alphabet = "abcde";
        const words = Array.from({ length: count }, () => {
          const len = ri(rng, 1, 6);
          let w = "";
          for (let i = 0; i < len; i++) w += alphabet.charAt(ri(rng, 0, alphabet.length - 1));
          return w;
        });
        const x = pick(rng, ["a", "b", "c", "d", "e", "z"]);
        return { input: `${fmtStrArr(words)}\n"${x}"`, expectedOutput: fmtIntArr(ref(words, x)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findWordsContaining(words: List[str], x: str) -> List[int]:\n    return [i for i, w in enumerate(words) if x in w]`,
        javascript: `var findWordsContaining = function(words, x) {\n    var out = [];\n    for (var i = 0; i < words.length; i++) {\n        if (words[i].indexOf(x) !== -1) out.push(i);\n    }\n    return out;\n};`,
        typescript: `function findWordsContaining(words: string[], x: string): number[] {\n    var out: number[] = [];\n    for (var i = 0; i < words.length; i++) {\n        if (words[i].indexOf(x) !== -1) out.push(i);\n    }\n    return out;\n}`,
        java: `public static int[] findWordsContaining(String[] words, String x) {\n    List<Integer> out = new ArrayList<>();\n    for (int i = 0; i < words.length; i++) {\n        if (words[i].indexOf(x) >= 0) out.add(i);\n    }\n    int[] res = new int[out.size()];\n    for (int i = 0; i < res.length; i++) res[i] = out.get(i);\n    return res;\n}`,
        cpp: `vector<int> findWordsContaining(vector<string>& words, string x) {\n    vector<int> out;\n    for (int i = 0; i < (int) words.size(); i++) {\n        if (words[i].find(x) != string::npos) out.push_back(i);\n    }\n    return out;\n}`,
        c: `int* findWordsContaining(char** words, int wordsSize, char* x, int* returnSize) {\n    int* out = (int*) malloc((size_t) wordsSize * sizeof(int));\n    int count = 0;\n    for (int i = 0; i < wordsSize; i++) {\n        if (strchr(words[i], x[0]) != NULL) out[count++] = i;\n    }\n    *returnSize = count;\n    return out;\n}`,
        csharp: `public static int[] FindWordsContaining(string[] words, string x)\n{\n    var out_ = new List<int>();\n    for (int i = 0; i < words.Length; i++)\n    {\n        if (words[i].Contains(x)) out_.Add(i);\n    }\n    return out_.ToArray();\n}`,
        go: `func findWordsContaining(words []string, x string) []int {\n\tout := []int{}\n\tfor i, w := range words {\n\t\tif strings.Contains(w, x) {\n\t\t\tout = append(out, i)\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun findWordsContaining(words: Array<String>, x: String): IntArray {\n    return words.indices.filter { words[it].contains(x) }.toIntArray()\n}`,
        swift: `func findWordsContaining(_ words: [String], _ x: String) -> [Int] {\n    var out = [Int]()\n    for (i, w) in words.enumerated() where w.contains(x) {\n        out.append(i)\n    }\n    return out\n}`,
        rust: `fn findWordsContaining(words: Vec<String>, x: String) -> Vec<i32> {\n    words\n        .iter()\n        .enumerate()\n        .filter(|(_, w)| w.contains(&x))\n        .map(|(i, _)| i as i32)\n        .collect()\n}`,
        php: `function findWordsContaining($words, $x) {\n    $out = [];\n    foreach ($words as $i => $w) {\n        if (strpos($w, $x) !== false) $out[] = $i;\n    }\n    return $out;\n}`,
        ruby: `def findWordsContaining(words, x)\n  words.each_index.select { |i| words[i].include?(x) }\nend`,
      },
    };
  })(),

  // ── Number of Senior Citizens (LC 2678) ─────────────────────────
  (() => {
    const ref = (details: string[]) => {
      let count = 0;
      for (let i = 0; i < details.length; i++) {
        const age = parseInt(details[i].substring(11, 13), 10);
        if (age > 60) count++;
      }
      return count;
    };
    return {
      slug: "number-of-senior-citizens",
      title: "Number of Senior Citizens",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Amazon", "Google", "Infosys"],
      signature: { funcName: "countSeniors", params: [{ name: "details", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "Each string in `details` is a 15-character passenger record:\n\n- the first **ten** characters are a phone number;\n- the next character is the passenger's gender;\n- the next **two** characters are the age;\n- the final two characters are the seat number.\n\nReturn the number of passengers **strictly older than 60**.",
        [
          { in: 'details = ["7868190130M7522","5303914400F9211","9273338290F4010"]', out: "2", note: "Ages 75, 92 and 40 — the first two clear 60." },
          { in: 'details = ["1313579440F2036","2921522980M5644"]', out: "0", note: "Ages 20 and 56." },
          { in: 'details = ["6060606060M6100"]', out: "1", note: "Age 61; exactly 60 would not count." },
        ],
        ["1 <= details.length <= 100", "details[i].length == 15", "details[i] consists of digits from '0' to '9'.", "details[i][10] is either 'M', 'F' or 'O'.", "The phone numbers and seat numbers of the passengers are distinct."]),
      hints: [
        "The age always sits at the same two positions: indices 11 and 12.",
        "Convert those two characters to a number.",
        "The comparison is strict — an age of exactly 60 is not a senior.",
      ],
      editorial: explain({
        idea: "Every record has a fixed layout, so the age is always the substring at indices 11 and 12. Parse it and count the values above 60.",
        steps: [
          "For each record, take `details[i][11..12]`.",
          "Convert it to an integer.",
          "Count the values strictly greater than 60.",
        ],
        why: "The fixed width is what makes this a slicing problem rather than a parsing one — there are no separators to search for and no variable-length fields. Arithmetic on the two digits (`(d1 - '0') * 10 + (d2 - '0')`) avoids allocating a substring at all.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The age begins at index 11, after ten phone digits and one gender character — off by one and you read the gender.",
          "Strictly greater than 60: 60 itself does not count.",
          "Ages are zero-padded, so `\"05\"` must parse as 5, not fail.",
        ],
      }),
      examples: [
        { input: '["7868190130M7522","5303914400F9211","9273338290F4010"]', expectedOutput: "2" },
        { input: '["1313579440F2036","2921522980M5644"]', expectedOutput: "0" },
        { input: '["6060606060M6100"]', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const count = ri(rng, 1, 8);
        const details = Array.from({ length: count }, () => {
          let phone = "";
          for (let i = 0; i < 10; i++) phone += String(ri(rng, 0, 9));
          const gender = pick(rng, ["M", "F", "O"]);
          // Cluster ages around 60 so the strict comparison is genuinely tested.
          const age = ri(rng, 55, 70);
          const seat = String(ri(rng, 10, 99));
          return `${phone}${gender}${age}${seat}`;
        });
        return { input: fmtStrArr(details), expectedOutput: String(ref(details)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countSeniors(details: List[str]) -> int:\n    return sum(1 for d in details if int(d[11:13]) > 60)`,
        javascript: `var countSeniors = function(details) {\n    var count = 0;\n    for (var i = 0; i < details.length; i++) {\n        var age = parseInt(details[i].substring(11, 13), 10);\n        if (age > 60) count++;\n    }\n    return count;\n};`,
        typescript: `function countSeniors(details: string[]): number {\n    var count = 0;\n    for (var i = 0; i < details.length; i++) {\n        var age = parseInt(details[i].substring(11, 13), 10);\n        if (age > 60) count++;\n    }\n    return count;\n}`,
        java: `public static int countSeniors(String[] details) {\n    int count = 0;\n    for (String d : details) {\n        int age = (d.charAt(11) - '0') * 10 + (d.charAt(12) - '0');\n        if (age > 60) count++;\n    }\n    return count;\n}`,
        cpp: `int countSeniors(vector<string>& details) {\n    int count = 0;\n    for (auto& d : details) {\n        int age = (d[11] - '0') * 10 + (d[12] - '0');\n        if (age > 60) count++;\n    }\n    return count;\n}`,
        c: `int countSeniors(char** details, int detailsSize) {\n    int count = 0;\n    for (int i = 0; i < detailsSize; i++) {\n        int age = (details[i][11] - '0') * 10 + (details[i][12] - '0');\n        if (age > 60) count++;\n    }\n    return count;\n}`,
        csharp: `public static int CountSeniors(string[] details)\n{\n    int count = 0;\n    foreach (var d in details)\n    {\n        int age = (d[11] - '0') * 10 + (d[12] - '0');\n        if (age > 60) count++;\n    }\n    return count;\n}`,
        go: `func countSeniors(details []string) int {\n\tcount := 0\n\tfor _, d := range details {\n\t\tage := int(d[11]-'0')*10 + int(d[12]-'0')\n\t\tif age > 60 {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countSeniors(details: Array<String>): Int {\n    return details.count { (it[11] - '0') * 10 + (it[12] - '0') > 60 }\n}`,
        swift: `func countSeniors(_ details: [String]) -> Int {\n    var count = 0\n    for d in details {\n        let chars = Array(d)\n        let age = (chars[11].wholeNumberValue! * 10) + chars[12].wholeNumberValue!\n        if age > 60 { count += 1 }\n    }\n    return count\n}`,
        rust: `fn countSeniors(details: Vec<String>) -> i32 {\n    details\n        .iter()\n        .filter(|d| {\n            let b = d.as_bytes();\n            (b[11] - b'0') as i32 * 10 + (b[12] - b'0') as i32 > 60\n        })\n        .count() as i32\n}`,
        php: `function countSeniors($details) {\n    $count = 0;\n    foreach ($details as $d) {\n        $age = intval(substr($d, 11, 2));\n        if ($age > 60) $count++;\n    }\n    return $count;\n}`,
        ruby: `def countSeniors(details)\n  details.count { |d| d[11, 2].to_i > 60 }\nend`,
      },
    };
  })(),

  // ── Circular Sentence (LC 2490) ─────────────────────────────────
  (() => {
    const ref = (sentence: string) => {
      const words = sentence.split(" ");
      for (let i = 0; i < words.length; i++) {
        const next = words[(i + 1) % words.length];
        if (words[i].charAt(words[i].length - 1) !== next.charAt(0)) return false;
      }
      return true;
    };
    return {
      slug: "circular-sentence",
      title: "Circular Sentence",
      difficulty: "EASY" as const,
      tags: ["String", "Amazon", "Google", "Wipro"],
      signature: { funcName: "isCircularSentence", params: [{ name: "sentence", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A sentence is a list of words separated by a **single** space, with no leading or trailing space.\n\nIt is **circular** when the last character of every word equals the first character of the next word, and the last character of the final word equals the first character of the first word. The comparison is case-sensitive.\n\nReturn whether `sentence` is circular.",
        [
          { in: 'sentence = "codekairo output tasks sync"', out: "true", note: "o→o, t→t, s→s, and `sync` ends in `c` which begins `codekairo`." },
          { in: 'sentence = "codekairo builds judges"', out: "false", note: "`codekairo` ends in `o` but `builds` begins with `b`." },
          { in: 'sentence = "racecar"', out: "true", note: "A single word is circular when its first and last characters match." },
        ],
        ["1 <= sentence.length <= 500", "sentence consists of only lowercase and uppercase English letters and spaces.", "The words in sentence are separated by a single space.", "There are no leading or trailing spaces."]),
      hints: [
        "Split on spaces, then compare each word's last character with the next word's first.",
        "Use modular indexing so the last word wraps to the first.",
        "A one-word sentence still has to close the loop with itself.",
      ],
      editorial: explain({
        idea: "Split into words and check every consecutive pair around the ring, using `(i + 1) mod n` so the final word is compared with the first.",
        steps: [
          "Split `sentence` on single spaces.",
          "For each index `i`, compare the last character of `words[i]` with the first of `words[(i+1) mod n]`.",
          "Return false on the first mismatch, true otherwise.",
        ],
        why: "The modulo handles the wrap-around without a special case for the last word — which is the part most solutions forget. Splitting can also be avoided entirely: a character at index `i` that is a space means `sentence[i-1]` must equal `sentence[i+1]`, and separately the first and last characters must match.",
        time: "O(n)",
        space: "O(n) for the split, or O(1) scanning in place",
        pitfalls: [
          "The wrap-around from the last word back to the first is part of the rule.",
          "A single word must still satisfy first-equals-last.",
          "Comparison is case-sensitive: `'a'` and `'A'` do not match.",
        ],
      }),
      examples: [
        { input: '"codekairo output tasks sync"', expectedOutput: "true" },
        { input: '"codekairo builds judges"', expectedOutput: "false" },
        { input: '"racecar"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const count = ri(rng, 1, 5);
        const alphabet = "abcd";
        const words: string[] = [];
        // Chain the words most of the time so `true` is not a rare answer.
        let link = alphabet.charAt(ri(rng, 0, 3));
        for (let w = 0; w < count; w++) {
          const len = ri(rng, 1, 4);
          let word = link;
          for (let i = 1; i < len; i++) word += alphabet.charAt(ri(rng, 0, 3));
          words.push(word);
          link = rng() < 0.75 ? word.charAt(word.length - 1) : alphabet.charAt(ri(rng, 0, 3));
        }
        const sentence = words.join(" ");
        return { input: `"${sentence}"`, expectedOutput: bool(ref(sentence)) };
      },
      solutions: {
        python: `def isCircularSentence(sentence: str) -> bool:\n    words = sentence.split(" ")\n    n = len(words)\n    return all(words[i][-1] == words[(i + 1) % n][0] for i in range(n))`,
        javascript: `var isCircularSentence = function(sentence) {\n    var words = sentence.split(" ");\n    for (var i = 0; i < words.length; i++) {\n        var next = words[(i + 1) % words.length];\n        if (words[i].charAt(words[i].length - 1) !== next.charAt(0)) return false;\n    }\n    return true;\n};`,
        typescript: `function isCircularSentence(sentence: string): boolean {\n    var words = sentence.split(" ");\n    for (var i = 0; i < words.length; i++) {\n        var next = words[(i + 1) % words.length];\n        if (words[i].charAt(words[i].length - 1) !== next.charAt(0)) return false;\n    }\n    return true;\n}`,
        java: `public static boolean isCircularSentence(String sentence) {\n    String[] words = sentence.split(" ");\n    int n = words.length;\n    for (int i = 0; i < n; i++) {\n        String cur = words[i];\n        String next = words[(i + 1) % n];\n        if (cur.charAt(cur.length() - 1) != next.charAt(0)) return false;\n    }\n    return true;\n}`,
        cpp: `bool isCircularSentence(string sentence) {\n    vector<string> words;\n    string cur;\n    for (char c : sentence) {\n        if (c == ' ') {\n            words.push_back(cur);\n            cur.clear();\n        } else {\n            cur += c;\n        }\n    }\n    words.push_back(cur);\n    int n = (int) words.size();\n    for (int i = 0; i < n; i++) {\n        if (words[i].back() != words[(i + 1) % n].front()) return false;\n    }\n    return true;\n}`,
        c: `bool isCircularSentence(char* sentence) {\n    int n = (int) strlen(sentence);\n    if (sentence[0] != sentence[n - 1]) return false;\n    for (int i = 1; i < n - 1; i++) {\n        if (sentence[i] == ' ' && sentence[i - 1] != sentence[i + 1]) return false;\n    }\n    return true;\n}`,
        csharp: `public static bool IsCircularSentence(string sentence)\n{\n    var words = sentence.Split(' ');\n    int n = words.Length;\n    for (int i = 0; i < n; i++)\n    {\n        var cur = words[i];\n        var next = words[(i + 1) % n];\n        if (cur[cur.Length - 1] != next[0]) return false;\n    }\n    return true;\n}`,
        go: `func isCircularSentence(sentence string) bool {\n\twords := strings.Split(sentence, " ")\n\tn := len(words)\n\tfor i := 0; i < n; i++ {\n\t\tcur := words[i]\n\t\tnext := words[(i+1)%n]\n\t\tif cur[len(cur)-1] != next[0] {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun isCircularSentence(sentence: String): Boolean {\n    val words = sentence.split(" ")\n    val n = words.size\n    for (i in 0 until n) {\n        if (words[i].last() != words[(i + 1) % n].first()) return false\n    }\n    return true\n}`,
        swift: `func isCircularSentence(_ sentence: String) -> Bool {\n    let words = sentence.split(separator: " ").map(String.init)\n    let n = words.count\n    for i in 0..<n {\n        let cur = Array(words[i])\n        let next = Array(words[(i + 1) % n])\n        if cur[cur.count - 1] != next[0] { return false }\n    }\n    return true\n}`,
        rust: `fn isCircularSentence(sentence: String) -> bool {\n    let words: Vec<&str> = sentence.split(' ').collect();\n    let n = words.len();\n    for i in 0..n {\n        let cur = words[i].as_bytes();\n        let next = words[(i + 1) % n].as_bytes();\n        if cur[cur.len() - 1] != next[0] {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function isCircularSentence($sentence) {\n    $words = explode(" ", $sentence);\n    $n = count($words);\n    for ($i = 0; $i < $n; $i++) {\n        $cur = $words[$i];\n        $next = $words[($i + 1) % $n];\n        if ($cur[strlen($cur) - 1] !== $next[0]) return false;\n    }\n    return true;\n}`,
        ruby: `def isCircularSentence(sentence)\n  words = sentence.split(" ")\n  n = words.length\n  (0...n).all? { |i| words[i][-1] == words[(i + 1) % n][0] }\nend`,
      },
    };
  })(),

  // ── Number of Strings That Appear as Substrings (LC 1967) ───────
  (() => {
    const ref = (patterns: string[], word: string) => {
      let count = 0;
      for (let i = 0; i < patterns.length; i++) {
        if (word.indexOf(patterns[i]) !== -1) count++;
      }
      return count;
    };
    return {
      slug: "number-of-strings-that-appear-as-substrings-in-word",
      title: "Number of Strings That Appear as Substrings in Word",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Amazon", "Google", "Accenture"],
      signature: { funcName: "numOfStrings", params: [{ name: "patterns", type: "string[]" as const }, { name: "word", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Return the number of strings in `patterns` that occur as a **substring** of `word`.\n\nA substring is a contiguous run of characters.",
        [
          { in: 'patterns = ["code","kai","judge","ekai"], word = "codekairo"', out: "3", note: "`code`, `kai` and `ekai` all occur; `judge` does not." },
          { in: 'patterns = ["a","abc","bc","d"], word = "abc"', out: "3" },
          { in: 'patterns = ["a","b","c"], word = "aaaaabbbbb"', out: "2", note: "No `c` anywhere." },
        ],
        ["1 <= patterns.length <= 100", "1 <= patterns[i].length <= 100", "1 <= word.length <= 100", "patterns[i] and word consist of lowercase English letters."]),
      hints: [
        "Every language has a substring search — use it once per pattern.",
        "A pattern longer than `word` can never occur.",
        "Duplicated patterns each count.",
      ],
      editorial: explain({
        idea: "Test each pattern for containment in `word` and count the hits.",
        steps: [
          "For each pattern, search for it inside `word`.",
          "Count the patterns that are found.",
        ],
        why: "At these sizes the naïve search is fine — 100 patterns of length 100 against a word of length 100 is at most a million character comparisons. A suffix automaton of `word` would answer each pattern in linear time in the pattern's own length, which is the shape the problem takes at scale.",
        time: "O(p · n · m) in the worst case",
        space: "O(1)",
        pitfalls: [
          "Substring, not subsequence — the characters must be adjacent.",
          "A pattern equal to `word` counts.",
          "Repeated patterns are counted separately.",
        ],
      }),
      examples: [
        { input: '["code","kai","judge","ekai"]\n"codekairo"', expectedOutput: "3" },
        { input: '["a","abc","bc","d"]\n"abc"', expectedOutput: "3" },
        { input: '["a","b","c"]\n"aaaaabbbbb"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const word = randLower(rng, ri(rng, 1, 10));
        const count = ri(rng, 1, 8);
        const patterns = Array.from({ length: count }, () => {
          if (rng() < 0.5) {
            const start = ri(rng, 0, word.length - 1);
            return word.slice(start, start + ri(rng, 1, word.length - start));
          }
          return randLower(rng, ri(rng, 1, 5));
        });
        return { input: `${fmtStrArr(patterns)}\n"${word}"`, expectedOutput: String(ref(patterns, word)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numOfStrings(patterns: List[str], word: str) -> int:\n    return sum(1 for p in patterns if p in word)`,
        javascript: `var numOfStrings = function(patterns, word) {\n    var count = 0;\n    for (var i = 0; i < patterns.length; i++) {\n        if (word.indexOf(patterns[i]) !== -1) count++;\n    }\n    return count;\n};`,
        typescript: `function numOfStrings(patterns: string[], word: string): number {\n    var count = 0;\n    for (var i = 0; i < patterns.length; i++) {\n        if (word.indexOf(patterns[i]) !== -1) count++;\n    }\n    return count;\n}`,
        java: `public static int numOfStrings(String[] patterns, String word) {\n    int count = 0;\n    for (String p : patterns) {\n        if (word.contains(p)) count++;\n    }\n    return count;\n}`,
        cpp: `int numOfStrings(vector<string>& patterns, string word) {\n    int count = 0;\n    for (auto& p : patterns) {\n        if (word.find(p) != string::npos) count++;\n    }\n    return count;\n}`,
        c: `int numOfStrings(char** patterns, int patternsSize, char* word) {\n    int count = 0;\n    for (int i = 0; i < patternsSize; i++) {\n        if (strstr(word, patterns[i]) != NULL) count++;\n    }\n    return count;\n}`,
        csharp: `public static int NumOfStrings(string[] patterns, string word)\n{\n    int count = 0;\n    foreach (var p in patterns)\n    {\n        if (word.Contains(p)) count++;\n    }\n    return count;\n}`,
        go: `func numOfStrings(patterns []string, word string) int {\n\tcount := 0\n\tfor _, p := range patterns {\n\t\tif strings.Contains(word, p) {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun numOfStrings(patterns: Array<String>, word: String): Int {\n    return patterns.count { word.contains(it) }\n}`,
        swift: `func numOfStrings(_ patterns: [String], _ word: String) -> Int {\n    return patterns.filter { word.contains($0) }.count\n}`,
        rust: `fn numOfStrings(patterns: Vec<String>, word: String) -> i32 {\n    patterns.iter().filter(|p| word.contains(p.as_str())).count() as i32\n}`,
        php: `function numOfStrings($patterns, $word) {\n    $count = 0;\n    foreach ($patterns as $p) {\n        if (strpos($word, $p) !== false) $count++;\n    }\n    return $count;\n}`,
        ruby: `def numOfStrings(patterns, word)\n  patterns.count { |p| word.include?(p) }\nend`,
      },
    };
  })(),

  // ── Rearrange Characters to Make Target String (LC 2287) ────────
  (() => {
    const ref = (s: string, target: string) => {
      const have = new Array(26).fill(0);
      const need = new Array(26).fill(0);
      for (let i = 0; i < s.length; i++) have[s.charCodeAt(i) - 97]++;
      for (let i = 0; i < target.length; i++) need[target.charCodeAt(i) - 97]++;
      let best = -1;
      for (let c = 0; c < 26; c++) {
        if (need[c] === 0) continue;
        const copies = Math.floor(have[c] / need[c]);
        if (best === -1 || copies < best) best = copies;
      }
      return best === -1 ? 0 : best;
    };
    return {
      slug: "rearrange-characters-to-make-target-string",
      title: "Rearrange Characters to Make Target String",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon", "Google", "TCS"],
      signature: { funcName: "rearrangeCharacters", params: [{ name: "s", type: "string" as const }, { name: "target", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You may take characters out of `s` — each one at most once — and rearrange them to spell copies of `target`.\n\nReturn the **maximum number of copies** of `target` you can form.",
        [
          { in: 's = "codekairocodekairo", target = "code"', out: "2", note: "Two `c`s, four `o`s, two `d`s and two `e`s — the `c`, `d` and `e` counts cap it at 2." },
          { in: 's = "abcba", target = "abc"', out: "1", note: "Only one `c` is available." },
          { in: 's = "abbaccaddaeea", target = "aaaaa"', out: "1", note: "Five `a`s make exactly one copy." },
        ],
        ["1 <= s.length <= 100", "1 <= target.length <= 10", "s and target consist of lowercase English letters."]),
      hints: [
        "Count the letters of both strings.",
        "For each letter the target needs, `have / need` copies are possible as far as that letter is concerned.",
        "The answer is the smallest of those per-letter limits.",
      ],
      editorial: explain({
        idea: "Tally both strings, then for each letter the target actually uses, divide the supply by the demand. The bottleneck letter — the smallest quotient — is the answer.",
        steps: [
          "Count the 26 letters in `s` and in `target`.",
          "For each letter with a non-zero demand, compute `have / need` with integer division.",
          "Return the minimum of those quotients.",
        ],
        why: "Integer division is exactly right here: a partial copy is worth nothing, so the floor is the number of whole copies that letter can support. Letters the target never uses are skipped — dividing by a zero demand is both undefined and meaningless.",
        time: "O(n + m)",
        space: "O(1) — two 26-slot tallies",
        pitfalls: [
          "Skip letters with zero demand, or you divide by zero.",
          "The answer is the **minimum** across letters, not the sum or the maximum.",
          "A letter the target needs but `s` lacks makes the answer 0.",
        ],
      }),
      examples: [
        { input: '"codekairocodekairo"\n"code"', expectedOutput: "2" },
        { input: '"abcba"\n"abc"', expectedOutput: "1" },
        { input: '"abbaccaddaeea"\n"aaaaa"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcd";
        let s = "";
        const sLen = ri(rng, 1, 20);
        for (let i = 0; i < sLen; i++) s += alphabet.charAt(ri(rng, 0, 3));
        let target = "";
        const tLen = ri(rng, 1, 4);
        for (let i = 0; i < tLen; i++) target += alphabet.charAt(ri(rng, 0, 3));
        return { input: `"${s}"\n"${target}"`, expectedOutput: String(ref(s, target)) };
      },
      solutions: {
        python: `def rearrangeCharacters(s: str, target: str) -> int:\n    have = [0] * 26\n    need = [0] * 26\n    for c in s:\n        have[ord(c) - 97] += 1\n    for c in target:\n        need[ord(c) - 97] += 1\n    return min(have[i] // need[i] for i in range(26) if need[i] > 0)`,
        javascript: `var rearrangeCharacters = function(s, target) {\n    var have = [], need = [], i;\n    for (i = 0; i < 26; i++) { have.push(0); need.push(0); }\n    for (i = 0; i < s.length; i++) have[s.charCodeAt(i) - 97]++;\n    for (i = 0; i < target.length; i++) need[target.charCodeAt(i) - 97]++;\n    var best = -1;\n    for (i = 0; i < 26; i++) {\n        if (need[i] === 0) continue;\n        var copies = Math.floor(have[i] / need[i]);\n        if (best === -1 || copies < best) best = copies;\n    }\n    return best === -1 ? 0 : best;\n};`,
        typescript: `function rearrangeCharacters(s: string, target: string): number {\n    var have: number[] = [], need: number[] = [], i: number;\n    for (i = 0; i < 26; i++) { have.push(0); need.push(0); }\n    for (i = 0; i < s.length; i++) have[s.charCodeAt(i) - 97]++;\n    for (i = 0; i < target.length; i++) need[target.charCodeAt(i) - 97]++;\n    var best = -1;\n    for (i = 0; i < 26; i++) {\n        if (need[i] === 0) continue;\n        var copies = Math.floor(have[i] / need[i]);\n        if (best === -1 || copies < best) best = copies;\n    }\n    return best === -1 ? 0 : best;\n}`,
        java: `public static int rearrangeCharacters(String s, String target) {\n    int[] have = new int[26];\n    int[] need = new int[26];\n    for (int i = 0; i < s.length(); i++) have[s.charAt(i) - 'a']++;\n    for (int i = 0; i < target.length(); i++) need[target.charAt(i) - 'a']++;\n    int best = Integer.MAX_VALUE;\n    for (int i = 0; i < 26; i++) {\n        if (need[i] == 0) continue;\n        best = Math.min(best, have[i] / need[i]);\n    }\n    return best == Integer.MAX_VALUE ? 0 : best;\n}`,
        cpp: `int rearrangeCharacters(string s, string target) {\n    vector<int> have(26, 0), need(26, 0);\n    for (char c : s) have[c - 'a']++;\n    for (char c : target) need[c - 'a']++;\n    int best = INT_MAX;\n    for (int i = 0; i < 26; i++) {\n        if (need[i] == 0) continue;\n        best = min(best, have[i] / need[i]);\n    }\n    return best == INT_MAX ? 0 : best;\n}`,
        c: `int rearrangeCharacters(char* s, char* target) {\n    int have[26], need[26];\n    for (int i = 0; i < 26; i++) { have[i] = 0; need[i] = 0; }\n    for (int i = 0; s[i] != '\\0'; i++) have[s[i] - 'a']++;\n    for (int i = 0; target[i] != '\\0'; i++) need[target[i] - 'a']++;\n    int best = -1;\n    for (int i = 0; i < 26; i++) {\n        if (need[i] == 0) continue;\n        int copies = have[i] / need[i];\n        if (best == -1 || copies < best) best = copies;\n    }\n    return best == -1 ? 0 : best;\n}`,
        csharp: `public static int RearrangeCharacters(string s, string target)\n{\n    var have = new int[26];\n    var need = new int[26];\n    foreach (char c in s) have[c - 'a']++;\n    foreach (char c in target) need[c - 'a']++;\n    int best = int.MaxValue;\n    for (int i = 0; i < 26; i++)\n    {\n        if (need[i] == 0) continue;\n        best = Math.Min(best, have[i] / need[i]);\n    }\n    return best == int.MaxValue ? 0 : best;\n}`,
        go: `func rearrangeCharacters(s string, target string) int {\n\tvar have, need [26]int\n\tfor i := 0; i < len(s); i++ {\n\t\thave[s[i]-'a']++\n\t}\n\tfor i := 0; i < len(target); i++ {\n\t\tneed[target[i]-'a']++\n\t}\n\tbest := -1\n\tfor i := 0; i < 26; i++ {\n\t\tif need[i] == 0 {\n\t\t\tcontinue\n\t\t}\n\t\tcopies := have[i] / need[i]\n\t\tif best == -1 || copies < best {\n\t\t\tbest = copies\n\t\t}\n\t}\n\tif best == -1 {\n\t\treturn 0\n\t}\n\treturn best\n}`,
        kotlin: `fun rearrangeCharacters(s: String, target: String): Int {\n    val have = IntArray(26)\n    val need = IntArray(26)\n    for (c in s) have[c - 'a']++\n    for (c in target) need[c - 'a']++\n    var best = Int.MAX_VALUE\n    for (i in 0 until 26) {\n        if (need[i] == 0) continue\n        best = minOf(best, have[i] / need[i])\n    }\n    return if (best == Int.MAX_VALUE) 0 else best\n}`,
        swift: `func rearrangeCharacters(_ s: String, _ target: String) -> Int {\n    var have = [Int](repeating: 0, count: 26)\n    var need = [Int](repeating: 0, count: 26)\n    let base = Int(Character("a").asciiValue!)\n    for c in s.unicodeScalars { have[Int(c.value) - base] += 1 }\n    for c in target.unicodeScalars { need[Int(c.value) - base] += 1 }\n    var best = Int.max\n    for i in 0..<26 where need[i] > 0 {\n        best = min(best, have[i] / need[i])\n    }\n    return best == Int.max ? 0 : best\n}`,
        rust: `fn rearrangeCharacters(s: String, target: String) -> i32 {\n    let mut have = [0i32; 26];\n    let mut need = [0i32; 26];\n    for b in s.bytes() {\n        have[(b - b'a') as usize] += 1;\n    }\n    for b in target.bytes() {\n        need[(b - b'a') as usize] += 1;\n    }\n    let mut best = std::i32::MAX;\n    for i in 0..26 {\n        if need[i] == 0 {\n            continue;\n        }\n        best = best.min(have[i] / need[i]);\n    }\n    if best == std::i32::MAX {\n        0\n    } else {\n        best\n    }\n}`,
        php: `function rearrangeCharacters($s, $target) {\n    $have = array_fill(0, 26, 0);\n    $need = array_fill(0, 26, 0);\n    for ($i = 0; $i < strlen($s); $i++) $have[ord($s[$i]) - 97]++;\n    for ($i = 0; $i < strlen($target); $i++) $need[ord($target[$i]) - 97]++;\n    $best = -1;\n    for ($i = 0; $i < 26; $i++) {\n        if ($need[$i] === 0) continue;\n        $copies = intdiv($have[$i], $need[$i]);\n        if ($best === -1 || $copies < $best) $best = $copies;\n    }\n    return $best === -1 ? 0 : $best;\n}`,
        ruby: `def rearrangeCharacters(s, target)\n  have = Array.new(26, 0)\n  need = Array.new(26, 0)\n  s.each_char { |c| have[c.ord - 97] += 1 }\n  target.each_char { |c| need[c.ord - 97] += 1 }\n  (0...26).select { |i| need[i] > 0 }.map { |i| have[i] / need[i] }.min\nend`,
      },
    };
  })(),

  // ── Sort Vowels in a String (LC 2785) ───────────────────────────
  (() => {
    const isVowel = (c: string) => "aeiouAEIOU".indexOf(c) !== -1;
    const ref = (s: string) => {
      const vowels: string[] = [];
      for (let i = 0; i < s.length; i++) if (isVowel(s.charAt(i))) vowels.push(s.charAt(i));
      vowels.sort();
      let out = "", k = 0;
      for (let i = 0; i < s.length; i++) {
        out += isVowel(s.charAt(i)) ? vowels[k++] : s.charAt(i);
      }
      return out;
    };
    return {
      slug: "sort-vowels-in-a-string",
      title: "Sort Vowels in a String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sorting", "Amazon", "Google", "Adobe"],
      signature: { funcName: "sortVowels", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Rearrange `s` so that:\n\n- every **consonant** stays exactly where it was, and\n- the **vowels** — `a`, `e`, `i`, `o`, `u` in either case — are sorted into non-decreasing **ASCII** order among the positions they already occupy.\n\nReturn the resulting string. Note that all uppercase letters sort before all lowercase ones.",
        [
          { in: 's = "codekairo"', out: "cadekioro", note: "The vowels `o,e,a,i,o` sort to `a,e,i,o,o` and refill positions 1, 3, 5, 6 and 8." },
          { in: 's = "lEetcOde"', out: "lEOtcede", note: "`E` (69) and `O` (79) come before the two lowercase `e`s (101)." },
          { in: 's = "lYmpH"', out: "lYmpH", note: "No vowels, so nothing moves." },
        ],
        ["1 <= s.length <= 10^5", "s consists only of letters of the English alphabet in uppercase and lowercase."]),
      hints: [
        "Pull the vowels out into a list, sort it, then put them back into the vowel positions in order.",
        "Sorting is by ASCII code, so `'A'` < `'E'` < `'a'` < `'e'`.",
        "There are only ten distinct vowel characters — a counting sort is linear.",
      ],
      editorial: explain({
        idea: "Extract the vowels, sort them, and write them back into the same positions left to right. Consonants are copied through untouched.",
        steps: [
          "Scan `s`, collecting every vowel into a list.",
          "Sort the list by character code.",
          "Rebuild the string: at a vowel position emit the next sorted vowel, otherwise the original character.",
        ],
        why: "The positions of the vowels never change — only which vowel sits in each — so the problem separates cleanly into \"which slots\" and \"what order\". With only ten possible vowel characters, tallying them and emitting in code order beats a comparison sort and makes the whole thing O(n).",
        time: "O(n log n), or O(n) with a counting sort",
        space: "O(n)",
        pitfalls: [
          "The order is by ASCII, so every uppercase vowel precedes every lowercase one — not case-insensitive alphabetical.",
          "Consonants must not shift; only the vowel slots are refilled.",
          "`y` is not a vowel here.",
        ],
      }),
      examples: [
        { input: '"codekairo"', expectedOutput: "cadekioro" },
        { input: '"lEetcOde"', expectedOutput: "lEOtcede" },
        { input: '"lYmpH"', expectedOutput: "lYmpH" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 14);
        let s = "";
        for (let i = 0; i < n; i++) {
          const c = randLower(rng, 1);
          s += rng() < 0.4 ? c.toUpperCase() : c;
        }
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def sortVowels(s: str) -> str:\n    vowels = sorted(c for c in s if c in "aeiouAEIOU")\n    it = iter(vowels)\n    return "".join(next(it) if c in "aeiouAEIOU" else c for c in s)`,
        javascript: `var sortVowels = function(s) {\n    var V = "aeiouAEIOU";\n    var vowels = [], i;\n    for (i = 0; i < s.length; i++) {\n        if (V.indexOf(s.charAt(i)) !== -1) vowels.push(s.charAt(i));\n    }\n    vowels.sort();\n    var out = "", k = 0;\n    for (i = 0; i < s.length; i++) {\n        out += V.indexOf(s.charAt(i)) !== -1 ? vowels[k++] : s.charAt(i);\n    }\n    return out;\n};`,
        typescript: `function sortVowels(s: string): string {\n    var V = "aeiouAEIOU";\n    var vowels: string[] = [], i: number;\n    for (i = 0; i < s.length; i++) {\n        if (V.indexOf(s.charAt(i)) !== -1) vowels.push(s.charAt(i));\n    }\n    vowels.sort();\n    var out = "", k = 0;\n    for (i = 0; i < s.length; i++) {\n        out += V.indexOf(s.charAt(i)) !== -1 ? vowels[k++] : s.charAt(i);\n    }\n    return out;\n}`,
        java: `public static String sortVowels(String s) {\n    String V = "aeiouAEIOU";\n    List<Character> vowels = new ArrayList<>();\n    for (int i = 0; i < s.length(); i++) {\n        if (V.indexOf(s.charAt(i)) >= 0) vowels.add(s.charAt(i));\n    }\n    Collections.sort(vowels);\n    StringBuilder sb = new StringBuilder();\n    int k = 0;\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        sb.append(V.indexOf(c) >= 0 ? vowels.get(k++) : c);\n    }\n    return sb.toString();\n}`,
        cpp: `string sortVowels(string s) {\n    string V = "aeiouAEIOU";\n    string vowels;\n    for (char c : s) {\n        if (V.find(c) != string::npos) vowels += c;\n    }\n    sort(vowels.begin(), vowels.end());\n    string out;\n    size_t k = 0;\n    for (char c : s) {\n        out += (V.find(c) != string::npos) ? vowels[k++] : c;\n    }\n    return out;\n}`,
        c: `char* sortVowels(char* s) {\n    const char* V = "aeiouAEIOU";\n    int n = (int) strlen(s);\n    /* Only ten distinct vowel characters exist, so tally them instead of sorting. */\n    int cnt[10];\n    for (int i = 0; i < 10; i++) cnt[i] = 0;\n    char order[10] = {'A', 'E', 'I', 'O', 'U', 'a', 'e', 'i', 'o', 'u'};\n    for (int i = 0; i < n; i++) {\n        for (int v = 0; v < 10; v++) {\n            if (s[i] == order[v]) { cnt[v]++; break; }\n        }\n    }\n    char* out = (char*) malloc((size_t) n + 1);\n    int slot = 0;\n    for (int i = 0; i < n; i++) {\n        if (strchr(V, s[i]) != NULL) {\n            while (cnt[slot] == 0) slot++;\n            out[i] = order[slot];\n            cnt[slot]--;\n        } else {\n            out[i] = s[i];\n        }\n    }\n    out[n] = '\\0';\n    return out;\n}`,
        csharp: `public static string SortVowels(string s)\n{\n    const string V = "aeiouAEIOU";\n    var vowels = new List<char>();\n    foreach (char c in s)\n    {\n        if (V.IndexOf(c) >= 0) vowels.Add(c);\n    }\n    vowels.Sort();\n    var sb = new System.Text.StringBuilder();\n    int k = 0;\n    foreach (char c in s)\n    {\n        sb.Append(V.IndexOf(c) >= 0 ? vowels[k++] : c);\n    }\n    return sb.ToString();\n}`,
        go: `func sortVowels(s string) string {\n\tconst V = "aeiouAEIOU"\n\tvowels := []byte{}\n\tfor i := 0; i < len(s); i++ {\n\t\tif strings.IndexByte(V, s[i]) >= 0 {\n\t\t\tvowels = append(vowels, s[i])\n\t\t}\n\t}\n\tsort.Slice(vowels, func(a, b int) bool { return vowels[a] < vowels[b] })\n\tout := make([]byte, len(s))\n\tk := 0\n\tfor i := 0; i < len(s); i++ {\n\t\tif strings.IndexByte(V, s[i]) >= 0 {\n\t\t\tout[i] = vowels[k]\n\t\t\tk++\n\t\t} else {\n\t\t\tout[i] = s[i]\n\t\t}\n\t}\n\treturn string(out)\n}`,
        kotlin: `fun sortVowels(s: String): String {\n    val v = "aeiouAEIOU"\n    val vowels = s.filter { v.contains(it) }.toCharArray()\n    vowels.sort()\n    val sb = StringBuilder()\n    var k = 0\n    for (c in s) {\n        if (v.contains(c)) {\n            sb.append(vowels[k])\n            k++\n        } else {\n            sb.append(c)\n        }\n    }\n    return sb.toString()\n}`,
        swift: `func sortVowels(_ s: String) -> String {\n    let v = Set("aeiouAEIOU")\n    let vowels = s.filter { v.contains($0) }.sorted()\n    var out = ""\n    var k = 0\n    for c in s {\n        if v.contains(c) {\n            out.append(vowels[k])\n            k += 1\n        } else {\n            out.append(c)\n        }\n    }\n    return out\n}`,
        rust: `fn sortVowels(s: String) -> String {\n    let v = "aeiouAEIOU";\n    let mut vowels: Vec<char> = s.chars().filter(|c| v.contains(*c)).collect();\n    vowels.sort();\n    let mut out = String::new();\n    let mut k = 0usize;\n    for c in s.chars() {\n        if v.contains(c) {\n            out.push(vowels[k]);\n            k += 1;\n        } else {\n            out.push(c);\n        }\n    }\n    out\n}`,
        php: `function sortVowels($s) {\n    $v = "aeiouAEIOU";\n    $vowels = [];\n    for ($i = 0; $i < strlen($s); $i++) {\n        if (strpos($v, $s[$i]) !== false) $vowels[] = $s[$i];\n    }\n    sort($vowels);\n    $out = "";\n    $k = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if (strpos($v, $s[$i]) !== false) {\n            $out .= $vowels[$k];\n            $k++;\n        } else {\n            $out .= $s[$i];\n        }\n    }\n    return $out;\n}`,
        ruby: `def sortVowels(s)\n  v = "aeiouAEIOU"\n  vowels = s.each_char.select { |c| v.include?(c) }.sort\n  k = 0\n  s.each_char.map do |c|\n    if v.include?(c)\n      k += 1\n      vowels[k - 1]\n    else\n      c\n    end\n  end.join\nend`,
      },
    };
  })(),

  // ── Count Substrings Starting and Ending With Char (LC 3084) ────
  (() => {
    const ref = (s: string, c: string) => {
      let m = 0;
      for (let i = 0; i < s.length; i++) if (s.charAt(i) === c) m++;
      return (m * (m + 1)) / 2;
    };
    return {
      slug: "count-substrings-starting-and-ending-with-given-character",
      title: "Count Substrings Starting and Ending with Given Character",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "String", "Counting", "Amazon", "Google", "Oracle"],
      signature: { funcName: "countSubstrings", params: [{ name: "s", type: "string" as const }, { name: "c", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Return the number of substrings of `s` that **both start and end** with the character `c`. A single occurrence of `c` counts as a substring of length one.",
        [
          { in: 's = "codekairo", c = "o"', out: "3", note: "The two `o`s give `o`, `o` and `odekairo`." },
          { in: 's = "abada", c = "a"', out: "6", note: "Three `a`s give 3 + 2 + 1 = 6 substrings." },
          { in: 's = "zzz", c = "z"', out: "6" },
        ],
        ["1 <= s.length <= 10^4", "s and c consist only of lowercase English letters."]),
      hints: [
        "A qualifying substring is determined entirely by which occurrence of `c` it starts at and which it ends at.",
        "If `c` occurs `m` times, how many ordered pairs (start, end) with start ≤ end are there?",
        "The answer is `m * (m + 1) / 2` — no substring is ever built.",
      ],
      editorial: explain({
        idea: "Count the occurrences of `c`. Every qualifying substring corresponds to a pair of occurrences — one for the start, one for the end, with the start no later than the end — so the answer is `m choose 2` plus the `m` single-character substrings, which is `m(m+1)/2`.",
        steps: [
          "Count how many times `c` appears in `s`.",
          "Return `m * (m + 1) / 2`.",
        ],
        why: "Everything between the two chosen occurrences is irrelevant — the substring is fixed once its endpoints are. That turns an apparent O(n²) enumeration into a single count, which is what the 10⁴ bound is really testing. The `+ m` term is easy to lose: an occurrence paired with itself is a valid length-one substring.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Length-one substrings count — do not use `m * (m - 1) / 2`.",
          "Enumerating substrings directly is O(n²) and far too slow at the upper bound.",
          "`m * (m + 1)` is always even, so the integer division is exact.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n"o"', expectedOutput: "3" },
        { input: '"abada"\n"a"', expectedOutput: "6" },
        { input: '"zzz"\n"z"', expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcd";
        const n = ri(rng, 1, 20);
        let s = "";
        for (let i = 0; i < n; i++) s += alphabet.charAt(ri(rng, 0, 3));
        const c = pick(rng, ["a", "b", "c", "d", "z"]);
        return { input: `"${s}"\n"${c}"`, expectedOutput: String(ref(s, c)) };
      },
      solutions: {
        python: `def countSubstrings(s: str, c: str) -> int:\n    m = s.count(c)\n    return m * (m + 1) // 2`,
        javascript: `var countSubstrings = function(s, c) {\n    var m = 0;\n    for (var i = 0; i < s.length; i++) if (s.charAt(i) === c) m++;\n    return m * (m + 1) / 2;\n};`,
        typescript: `function countSubstrings(s: string, c: string): number {\n    var m = 0;\n    for (var i = 0; i < s.length; i++) if (s.charAt(i) === c) m++;\n    return m * (m + 1) / 2;\n}`,
        java: `public static int countSubstrings(String s, String c) {\n    long m = 0;\n    char target = c.charAt(0);\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == target) m++;\n    }\n    return (int) (m * (m + 1) / 2);\n}`,
        cpp: `int countSubstrings(string s, string c) {\n    long long m = 0;\n    char target = c[0];\n    for (char ch : s) {\n        if (ch == target) m++;\n    }\n    return (int) (m * (m + 1) / 2);\n}`,
        c: `int countSubstrings(char* s, char* c) {\n    long long m = 0;\n    char target = c[0];\n    for (int i = 0; s[i] != '\\0'; i++) {\n        if (s[i] == target) m++;\n    }\n    return (int) (m * (m + 1) / 2);\n}`,
        csharp: `public static int CountSubstrings(string s, string c)\n{\n    long m = 0;\n    char target = c[0];\n    foreach (char ch in s)\n    {\n        if (ch == target) m++;\n    }\n    return (int) (m * (m + 1) / 2);\n}`,
        go: `func countSubstrings(s string, c string) int {\n\tm := 0\n\ttarget := c[0]\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] == target {\n\t\t\tm++\n\t\t}\n\t}\n\treturn m * (m + 1) / 2\n}`,
        kotlin: `fun countSubstrings(s: String, c: String): Int {\n    val target = c[0]\n    val m = s.count { it == target }.toLong()\n    return (m * (m + 1) / 2).toInt()\n}`,
        swift: `func countSubstrings(_ s: String, _ c: String) -> Int {\n    let target = Array(c)[0]\n    let m = s.filter { $0 == target }.count\n    return m * (m + 1) / 2\n}`,
        rust: `fn countSubstrings(s: String, c: String) -> i32 {\n    let target = c.chars().next().unwrap();\n    let m = s.chars().filter(|&ch| ch == target).count() as i64;\n    (m * (m + 1) / 2) as i32\n}`,
        php: `function countSubstrings($s, $c) {\n    $m = substr_count($s, $c);\n    return intdiv($m * ($m + 1), 2);\n}`,
        ruby: `def countSubstrings(s, c)\n  m = s.count(c)\n  m * (m + 1) / 2\nend`,
      },
    };
  })(),

  // ── Lexicographically Minimum String After Removing Stars (3170) ─
  (() => {
    const ref = (s: string) => {
      const stacks: number[][] = [];
      for (let i = 0; i < 26; i++) stacks.push([]);
      const removed = new Array(s.length).fill(false);
      for (let i = 0; i < s.length; i++) {
        const c = s.charAt(i);
        if (c === "*") {
          removed[i] = true;
          for (let k = 0; k < 26; k++) {
            if (stacks[k].length > 0) {
              removed[stacks[k].pop() as number] = true;
              break;
            }
          }
        } else {
          stacks[s.charCodeAt(i) - 97].push(i);
        }
      }
      let out = "";
      for (let i = 0; i < s.length; i++) if (!removed[i]) out += s.charAt(i);
      return out;
    };
    return {
      slug: "lexicographically-minimum-string-after-removing-stars",
      title: "Lexicographically Minimum String After Removing Stars",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Heap (Priority Queue)", "Stack", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "clearStars", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "`s` contains lowercase letters and `'*'` characters. While a `'*'` remains, you must:\n\n- delete the **smallest** non-star character anywhere to its left, and\n- delete that `'*'` itself.\n\nWhen several characters tie for smallest you may delete any one of them. Return the **lexicographically smallest** string that can remain.",
        [
          { in: 's = "codekairo*"', out: "codekiro", note: "The smallest letter to the left of the star is `a`." },
          { in: 's = "aaba*"', out: "aab", note: "Among the three `a`s, deleting the **rightmost** leaves `aab`, which beats `aba`." },
          { in: 's = "abc"', out: "abc", note: "No stars, nothing to remove." },
        ],
        ["1 <= s.length <= 10^5", "s consists only of lowercase English letters and '*'.", "The input is generated such that the operation is always possible."]),
      hints: [
        "You have no choice about *which letter value* is deleted — always the smallest available. The freedom is only in which occurrence of it.",
        "Among equal smallest letters, deleting the **rightmost** occurrence is best: it keeps the earlier copies, which push smaller characters further left.",
        "Keep one stack of indices per letter; a star pops the top of the lowest non-empty stack.",
      ],
      editorial: explain({
        idea: "Maintain 26 stacks of positions, one per letter. Every letter pushes its index onto its stack; every star pops the top index of the lowest non-empty stack and marks both positions deleted. A final pass emits the survivors in their original order.",
        steps: [
          "For each character: a letter pushes its index onto `stacks[c - 'a']`.",
          "A star marks itself deleted, then scans letters `a` upward for the first non-empty stack and marks its top index deleted.",
          "Build the answer from the unmarked positions, left to right.",
        ],
        why: "Using a **stack** rather than a queue is the whole trick. The smallest letter is forced, but among equal copies removing the rightmost is optimal: deleting an earlier copy would shift a later, larger character into an earlier position, and the first position where two candidate answers differ is what decides the comparison. Scanning 26 stacks per star keeps each operation O(26) — a priority queue of (letter, index) pairs is the same idea at O(log n).",
        time: "O(26 · n)",
        space: "O(n)",
        pitfalls: [
          "Deleting the leftmost copy of the smallest letter gives a larger string — the stack direction matters.",
          "The star itself is deleted as well as the letter it consumes.",
          "The surviving characters keep their original relative order; nothing is sorted.",
        ],
      }),
      examples: [
        { input: '"codekairo*"', expectedOutput: "codekiro" },
        { input: '"aaba*"', expectedOutput: "aab" },
        { input: '"abc"', expectedOutput: "abc" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcd";
        const n = ri(rng, 1, 16);
        let s = "";
        let available = 0;
        for (let i = 0; i < n; i++) {
          // Only emit a star when there is something to its left to consume.
          if (available > 0 && rng() < 0.25) { s += "*"; available--; }
          else { s += alphabet.charAt(ri(rng, 0, 3)); available++; }
        }
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def clearStars(s: str) -> str:\n    stacks = [[] for _ in range(26)]\n    removed = [False] * len(s)\n    for i, c in enumerate(s):\n        if c == "*":\n            removed[i] = True\n            for k in range(26):\n                if stacks[k]:\n                    removed[stacks[k].pop()] = True\n                    break\n        else:\n            stacks[ord(c) - 97].append(i)\n    return "".join(s[i] for i in range(len(s)) if not removed[i])`,
        javascript: `var clearStars = function(s) {\n    var stacks = [], i, k;\n    for (i = 0; i < 26; i++) stacks.push([]);\n    var removed = [];\n    for (i = 0; i < s.length; i++) removed.push(false);\n    for (i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (c === "*") {\n            removed[i] = true;\n            for (k = 0; k < 26; k++) {\n                if (stacks[k].length > 0) {\n                    removed[stacks[k].pop()] = true;\n                    break;\n                }\n            }\n        } else {\n            stacks[s.charCodeAt(i) - 97].push(i);\n        }\n    }\n    var out = "";\n    for (i = 0; i < s.length; i++) if (!removed[i]) out += s.charAt(i);\n    return out;\n};`,
        typescript: `function clearStars(s: string): string {\n    var stacks: number[][] = [], i: number, k: number;\n    for (i = 0; i < 26; i++) stacks.push([]);\n    var removed: boolean[] = [];\n    for (i = 0; i < s.length; i++) removed.push(false);\n    for (i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (c === "*") {\n            removed[i] = true;\n            for (k = 0; k < 26; k++) {\n                if (stacks[k].length > 0) {\n                    removed[stacks[k].pop() as number] = true;\n                    break;\n                }\n            }\n        } else {\n            stacks[s.charCodeAt(i) - 97].push(i);\n        }\n    }\n    var out = "";\n    for (i = 0; i < s.length; i++) if (!removed[i]) out += s.charAt(i);\n    return out;\n}`,
        java: `public static String clearStars(String s) {\n    List<List<Integer>> stacks = new ArrayList<>();\n    for (int i = 0; i < 26; i++) stacks.add(new ArrayList<>());\n    boolean[] removed = new boolean[s.length()];\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        if (c == '*') {\n            removed[i] = true;\n            for (int k = 0; k < 26; k++) {\n                List<Integer> st = stacks.get(k);\n                if (!st.isEmpty()) {\n                    removed[st.remove(st.size() - 1)] = true;\n                    break;\n                }\n            }\n        } else {\n            stacks.get(c - 'a').add(i);\n        }\n    }\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < s.length(); i++) {\n        if (!removed[i]) sb.append(s.charAt(i));\n    }\n    return sb.toString();\n}`,
        cpp: `string clearStars(string s) {\n    vector<vector<int>> stacks(26);\n    vector<bool> removed(s.size(), false);\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (s[i] == '*') {\n            removed[i] = true;\n            for (int k = 0; k < 26; k++) {\n                if (!stacks[k].empty()) {\n                    removed[stacks[k].back()] = true;\n                    stacks[k].pop_back();\n                    break;\n                }\n            }\n        } else {\n            stacks[s[i] - 'a'].push_back(i);\n        }\n    }\n    string out;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (!removed[i]) out += s[i];\n    }\n    return out;\n}`,
        c: `char* clearStars(char* s) {\n    int n = (int) strlen(s);\n    int** stacks = (int**) malloc(26 * sizeof(int*));\n    int* tops = (int*) calloc(26, sizeof(int));\n    for (int k = 0; k < 26; k++) stacks[k] = (int*) malloc((size_t) (n > 0 ? n : 1) * sizeof(int));\n    char* removed = (char*) calloc((size_t) (n > 0 ? n : 1), sizeof(char));\n    for (int i = 0; i < n; i++) {\n        if (s[i] == '*') {\n            removed[i] = 1;\n            for (int k = 0; k < 26; k++) {\n                if (tops[k] > 0) {\n                    removed[stacks[k][--tops[k]]] = 1;\n                    break;\n                }\n            }\n        } else {\n            int k = s[i] - 'a';\n            stacks[k][tops[k]++] = i;\n        }\n    }\n    char* out = (char*) malloc((size_t) n + 1);\n    int len = 0;\n    for (int i = 0; i < n; i++) {\n        if (!removed[i]) out[len++] = s[i];\n    }\n    out[len] = '\\0';\n    for (int k = 0; k < 26; k++) free(stacks[k]);\n    free(stacks);\n    free(tops);\n    free(removed);\n    return out;\n}`,
        csharp: `public static string ClearStars(string s)\n{\n    var stacks = new List<int>[26];\n    for (int i = 0; i < 26; i++) stacks[i] = new List<int>();\n    var removed = new bool[s.Length];\n    for (int i = 0; i < s.Length; i++)\n    {\n        char c = s[i];\n        if (c == '*')\n        {\n            removed[i] = true;\n            for (int k = 0; k < 26; k++)\n            {\n                if (stacks[k].Count > 0)\n                {\n                    removed[stacks[k][stacks[k].Count - 1]] = true;\n                    stacks[k].RemoveAt(stacks[k].Count - 1);\n                    break;\n                }\n            }\n        }\n        else\n        {\n            stacks[c - 'a'].Add(i);\n        }\n    }\n    var sb = new System.Text.StringBuilder();\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (!removed[i]) sb.Append(s[i]);\n    }\n    return sb.ToString();\n}`,
        go: `func clearStars(s string) string {\n\tstacks := make([][]int, 26)\n\tremoved := make([]bool, len(s))\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] == '*' {\n\t\t\tremoved[i] = true\n\t\t\tfor k := 0; k < 26; k++ {\n\t\t\t\tif len(stacks[k]) > 0 {\n\t\t\t\t\tremoved[stacks[k][len(stacks[k])-1]] = true\n\t\t\t\t\tstacks[k] = stacks[k][:len(stacks[k])-1]\n\t\t\t\t\tbreak\n\t\t\t\t}\n\t\t\t}\n\t\t} else {\n\t\t\tk := int(s[i] - 'a')\n\t\t\tstacks[k] = append(stacks[k], i)\n\t\t}\n\t}\n\tout := make([]byte, 0, len(s))\n\tfor i := 0; i < len(s); i++ {\n\t\tif !removed[i] {\n\t\t\tout = append(out, s[i])\n\t\t}\n\t}\n\treturn string(out)\n}`,
        kotlin: `fun clearStars(s: String): String {\n    val stacks = Array(26) { mutableListOf<Int>() }\n    val removed = BooleanArray(s.length)\n    for (i in s.indices) {\n        val c = s[i]\n        if (c == '*') {\n            removed[i] = true\n            for (k in 0 until 26) {\n                if (stacks[k].isNotEmpty()) {\n                    removed[stacks[k].removeAt(stacks[k].size - 1)] = true\n                    break\n                }\n            }\n        } else {\n            stacks[c - 'a'].add(i)\n        }\n    }\n    val sb = StringBuilder()\n    for (i in s.indices) {\n        if (!removed[i]) sb.append(s[i])\n    }\n    return sb.toString()\n}`,
        swift: `func clearStars(_ s: String) -> String {\n    let chars = Array(s)\n    var stacks = [[Int]](repeating: [], count: 26)\n    var removed = [Bool](repeating: false, count: chars.count)\n    let base = Int(Character("a").asciiValue!)\n    for i in 0..<chars.count {\n        if chars[i] == "*" {\n            removed[i] = true\n            for k in 0..<26 where !stacks[k].isEmpty {\n                removed[stacks[k].removeLast()] = true\n                break\n            }\n        } else {\n            let k = Int(chars[i].asciiValue!) - base\n            stacks[k].append(i)\n        }\n    }\n    var out = ""\n    for i in 0..<chars.count where !removed[i] {\n        out.append(chars[i])\n    }\n    return out\n}`,
        rust: `fn clearStars(s: String) -> String {\n    let chars: Vec<char> = s.chars().collect();\n    let mut stacks: Vec<Vec<usize>> = vec![Vec::new(); 26];\n    let mut removed = vec![false; chars.len()];\n    for i in 0..chars.len() {\n        if chars[i] == '*' {\n            removed[i] = true;\n            for k in 0..26 {\n                if let Some(j) = stacks[k].pop() {\n                    removed[j] = true;\n                    break;\n                }\n            }\n        } else {\n            let k = (chars[i] as u8 - b'a') as usize;\n            stacks[k].push(i);\n        }\n    }\n    (0..chars.len()).filter(|&i| !removed[i]).map(|i| chars[i]).collect()\n}`,
        php: `function clearStars($s) {\n    $stacks = [];\n    for ($i = 0; $i < 26; $i++) $stacks[$i] = [];\n    $n = strlen($s);\n    $removed = array_fill(0, $n, false);\n    for ($i = 0; $i < $n; $i++) {\n        if ($s[$i] === "*") {\n            $removed[$i] = true;\n            for ($k = 0; $k < 26; $k++) {\n                if (count($stacks[$k]) > 0) {\n                    $removed[array_pop($stacks[$k])] = true;\n                    break;\n                }\n            }\n        } else {\n            $stacks[ord($s[$i]) - 97][] = $i;\n        }\n    }\n    $out = "";\n    for ($i = 0; $i < $n; $i++) {\n        if (!$removed[$i]) $out .= $s[$i];\n    }\n    return $out;\n}`,
        ruby: `def clearStars(s)\n  stacks = Array.new(26) { [] }\n  removed = Array.new(s.length, false)\n  s.each_char.with_index do |c, i|\n    if c == "*"\n      removed[i] = true\n      (0...26).each do |k|\n        next if stacks[k].empty?\n        removed[stacks[k].pop] = true\n        break\n      end\n    else\n      stacks[c.ord - 97] << i\n    end\n  end\n  (0...s.length).reject { |i| removed[i] }.map { |i| s[i] }.join\nend`,
      },
    };
  })(),

  // ── Minimum Changes to Make Binary String Beautiful (LC 2914) ────
  (() => {
    const ref = (s: string) => {
      let changes = 0;
      for (let i = 0; i + 1 < s.length; i += 2) {
        if (s.charAt(i) !== s.charAt(i + 1)) changes++;
      }
      return changes;
    };
    return {
      slug: "minimum-number-of-changes-to-make-binary-string-beautiful",
      title: "Minimum Number of Changes to Make Binary String Beautiful",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "minChanges", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A binary string of **even** length is **beautiful** if it can be split into substrings such that every piece has even length and consists of a single repeated character — all `0`s or all `1`s.\n\nYou may change any character to `0` or `1`. Return the minimum number of changes that makes `s` beautiful.",
        [
          { in: 's = "1001"', out: "2", note: "Change to `1100` (or `0011`): two edits." },
          { in: 's = "10"', out: "1", note: "One edit makes it `00` or `11`." },
          { in: 's = "0000"', out: "0", note: "Already beautiful." },
        ],
        ["2 <= s.length <= 10^5", "s has an even length.", "s[i] is either '0' or '1'."]),
      hints: [
        "Any partition into even-length blocks can be refined into blocks of exactly length 2.",
        "So it is enough to make each fixed pair `s[0..1]`, `s[2..3]`, … uniform.",
        "A pair whose two characters differ costs exactly one change.",
      ],
      editorial: explain({
        idea: "Split `s` into fixed pairs at indices (0,1), (2,3), … and count the pairs whose two characters differ. Each such pair needs exactly one edit.",
        steps: [
          "For every even index `i`, compare `s[i]` with `s[i+1]`.",
          "Count the mismatches.",
        ],
        why: "The key observation is that any even-length block of a single character can be **cut into blocks of length two** without changing the string, so a string is beautiful exactly when every fixed pair at an even offset is uniform. That collapses a search over partitions into a single independent check per pair, and the pairs cannot interact because the boundaries are fixed at even offsets.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The pairs start at **even** indices; sliding a window by one mixes adjacent blocks.",
          "Each mismatched pair costs 1, not 2 — changing one of the two characters is enough.",
          "The input length is guaranteed even, so there is no trailing odd character.",
        ],
      }),
      examples: [
        { input: '"1001"', expectedOutput: "2" },
        { input: '"10"', expectedOutput: "1" },
        { input: '"0000"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const pairs = ri(rng, 1, 10);
        let s = "";
        for (let i = 0; i < pairs * 2; i++) s += rng() < 0.5 ? "0" : "1";
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minChanges(s: str) -> int:\n    return sum(1 for i in range(0, len(s), 2) if s[i] != s[i + 1])`,
        javascript: `var minChanges = function(s) {\n    var changes = 0;\n    for (var i = 0; i + 1 < s.length; i += 2) {\n        if (s.charAt(i) !== s.charAt(i + 1)) changes++;\n    }\n    return changes;\n};`,
        typescript: `function minChanges(s: string): number {\n    var changes = 0;\n    for (var i = 0; i + 1 < s.length; i += 2) {\n        if (s.charAt(i) !== s.charAt(i + 1)) changes++;\n    }\n    return changes;\n}`,
        java: `public static int minChanges(String s) {\n    int changes = 0;\n    for (int i = 0; i + 1 < s.length(); i += 2) {\n        if (s.charAt(i) != s.charAt(i + 1)) changes++;\n    }\n    return changes;\n}`,
        cpp: `int minChanges(string s) {\n    int changes = 0;\n    for (size_t i = 0; i + 1 < s.size(); i += 2) {\n        if (s[i] != s[i + 1]) changes++;\n    }\n    return changes;\n}`,
        c: `int minChanges(char* s) {\n    int n = (int) strlen(s);\n    int changes = 0;\n    for (int i = 0; i + 1 < n; i += 2) {\n        if (s[i] != s[i + 1]) changes++;\n    }\n    return changes;\n}`,
        csharp: `public static int MinChanges(string s)\n{\n    int changes = 0;\n    for (int i = 0; i + 1 < s.Length; i += 2)\n    {\n        if (s[i] != s[i + 1]) changes++;\n    }\n    return changes;\n}`,
        go: `func minChanges(s string) int {\n\tchanges := 0\n\tfor i := 0; i+1 < len(s); i += 2 {\n\t\tif s[i] != s[i+1] {\n\t\t\tchanges++\n\t\t}\n\t}\n\treturn changes\n}`,
        kotlin: `fun minChanges(s: String): Int {\n    var changes = 0\n    var i = 0\n    while (i + 1 < s.length) {\n        if (s[i] != s[i + 1]) changes++\n        i += 2\n    }\n    return changes\n}`,
        swift: `func minChanges(_ s: String) -> Int {\n    let chars = Array(s)\n    var changes = 0\n    var i = 0\n    while i + 1 < chars.count {\n        if chars[i] != chars[i + 1] { changes += 1 }\n        i += 2\n    }\n    return changes\n}`,
        rust: `fn minChanges(s: String) -> i32 {\n    let b = s.as_bytes();\n    let mut changes = 0;\n    let mut i = 0;\n    while i + 1 < b.len() {\n        if b[i] != b[i + 1] {\n            changes += 1;\n        }\n        i += 2;\n    }\n    changes\n}`,
        php: `function minChanges($s) {\n    $changes = 0;\n    $n = strlen($s);\n    for ($i = 0; $i + 1 < $n; $i += 2) {\n        if ($s[$i] !== $s[$i + 1]) $changes++;\n    }\n    return $changes;\n}`,
        ruby: `def minChanges(s)\n  (0...s.length).step(2).count { |i| s[i] != s[i + 1] }\nend`,
      },
    };
  })(),

  // ── Minimum Length of String After Operations (LC 3223) ─────────
  (() => {
    const ref = (s: string) => {
      const cnt = new Array(26).fill(0);
      for (let i = 0; i < s.length; i++) cnt[s.charCodeAt(i) - 97]++;
      let total = 0;
      for (let c = 0; c < 26; c++) {
        if (cnt[c] === 0) continue;
        total += cnt[c] % 2 === 1 ? 1 : 2;
      }
      return total;
    };
    return {
      slug: "minimum-length-of-string-after-operations",
      title: "Minimum Length of String After Operations",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon", "Google", "Salesforce"],
      signature: { funcName: "minimumLength", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Repeatedly apply this operation as long as it is possible:\n\n- choose an index `i` such that there is **at least one** character equal to `s[i]` to its left and **at least one** to its right;\n- delete the **closest** such character on the left and the **closest** on the right.\n\nReturn the minimum length `s` can reach.",
        [
          { in: 's = "codekairocodekairo"', out: "16", note: "Every letter appears exactly twice, and a letter needs three copies before anything can be deleted." },
          { in: 's = "abaacbcbb"', out: "5", note: "`a` occurs 3 times and drops to 1; `b` (4) and `c` (2) each keep 2." },
          { in: 's = "aa"', out: "2", note: "No index has a matching character on **both** sides." },
        ],
        ["1 <= s.length <= 2 * 10^5", "s consists only of lowercase English letters."]),
      hints: [
        "Each operation removes two copies of one letter, and letters never interfere with each other.",
        "So ask, per letter: how few copies can `k` occurrences be reduced to?",
        "Operating needs three copies, and each operation removes two — so the parity of the count is the whole answer.",
      ],
      editorial: explain({
        idea: "The operation only ever removes two copies of a single letter, so each letter can be reasoned about independently. A letter with `k` occurrences can be reduced while `k >= 3`, two at a time — so it settles at 1 if `k` is odd and 2 if `k` is even. Sum those per-letter residues.",
        steps: [
          "Tally the 26 letter counts.",
          "For each letter present, add 1 if its count is odd and 2 if it is even.",
          "Return the sum.",
        ],
        why: "Two facts make this a counting problem rather than a simulation. First, the deleted pair always matches `s[i]`, so no letter's count is affected by another's. Second, an operation is available for a letter as soon as it has three copies, and removing two keeps that available until only one or two remain — so the reachable minimum is determined entirely by parity, not by the order of operations or the positions of the letters.",
        time: "O(n)",
        space: "O(1) — a 26-slot tally",
        pitfalls: [
          "A letter with count 2 cannot be reduced at all; only three or more can.",
          "Letters absent from `s` contribute nothing, not 2.",
          "Simulating the deletions is unnecessary and quadratic at the upper bound.",
        ],
      }),
      examples: [
        { input: '"codekairocodekairo"', expectedOutput: "16" },
        { input: '"abaacbcbb"', expectedOutput: "5" },
        { input: '"aa"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcd";
        const n = ri(rng, 1, 18);
        let s = "";
        for (let i = 0; i < n; i++) s += alphabet.charAt(ri(rng, 0, 3));
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minimumLength(s: str) -> int:\n    cnt = [0] * 26\n    for c in s:\n        cnt[ord(c) - 97] += 1\n    return sum(1 if k % 2 == 1 else 2 for k in cnt if k > 0)`,
        javascript: `var minimumLength = function(s) {\n    var cnt = [], i;\n    for (i = 0; i < 26; i++) cnt.push(0);\n    for (i = 0; i < s.length; i++) cnt[s.charCodeAt(i) - 97]++;\n    var total = 0;\n    for (i = 0; i < 26; i++) {\n        if (cnt[i] === 0) continue;\n        total += cnt[i] % 2 === 1 ? 1 : 2;\n    }\n    return total;\n};`,
        typescript: `function minimumLength(s: string): number {\n    var cnt: number[] = [], i: number;\n    for (i = 0; i < 26; i++) cnt.push(0);\n    for (i = 0; i < s.length; i++) cnt[s.charCodeAt(i) - 97]++;\n    var total = 0;\n    for (i = 0; i < 26; i++) {\n        if (cnt[i] === 0) continue;\n        total += cnt[i] % 2 === 1 ? 1 : 2;\n    }\n    return total;\n}`,
        java: `public static int minimumLength(String s) {\n    int[] cnt = new int[26];\n    for (int i = 0; i < s.length(); i++) cnt[s.charAt(i) - 'a']++;\n    int total = 0;\n    for (int k : cnt) {\n        if (k == 0) continue;\n        total += k % 2 == 1 ? 1 : 2;\n    }\n    return total;\n}`,
        cpp: `int minimumLength(string s) {\n    vector<int> cnt(26, 0);\n    for (char c : s) cnt[c - 'a']++;\n    int total = 0;\n    for (int k : cnt) {\n        if (k == 0) continue;\n        total += k % 2 == 1 ? 1 : 2;\n    }\n    return total;\n}`,
        c: `int minimumLength(char* s) {\n    int cnt[26];\n    for (int i = 0; i < 26; i++) cnt[i] = 0;\n    for (int i = 0; s[i] != '\\0'; i++) cnt[s[i] - 'a']++;\n    int total = 0;\n    for (int i = 0; i < 26; i++) {\n        if (cnt[i] == 0) continue;\n        total += cnt[i] % 2 == 1 ? 1 : 2;\n    }\n    return total;\n}`,
        csharp: `public static int MinimumLength(string s)\n{\n    var cnt = new int[26];\n    foreach (char c in s) cnt[c - 'a']++;\n    int total = 0;\n    foreach (int k in cnt)\n    {\n        if (k == 0) continue;\n        total += k % 2 == 1 ? 1 : 2;\n    }\n    return total;\n}`,
        go: `func minimumLength(s string) int {\n\tvar cnt [26]int\n\tfor i := 0; i < len(s); i++ {\n\t\tcnt[s[i]-'a']++\n\t}\n\ttotal := 0\n\tfor _, k := range cnt {\n\t\tif k == 0 {\n\t\t\tcontinue\n\t\t}\n\t\tif k%2 == 1 {\n\t\t\ttotal++\n\t\t} else {\n\t\t\ttotal += 2\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun minimumLength(s: String): Int {\n    val cnt = IntArray(26)\n    for (c in s) cnt[c - 'a']++\n    var total = 0\n    for (k in cnt) {\n        if (k == 0) continue\n        total += if (k % 2 == 1) 1 else 2\n    }\n    return total\n}`,
        swift: `func minimumLength(_ s: String) -> Int {\n    var cnt = [Int](repeating: 0, count: 26)\n    let base = Int(Character("a").asciiValue!)\n    for c in s.unicodeScalars { cnt[Int(c.value) - base] += 1 }\n    var total = 0\n    for k in cnt where k > 0 {\n        total += k % 2 == 1 ? 1 : 2\n    }\n    return total\n}`,
        rust: `fn minimumLength(s: String) -> i32 {\n    let mut cnt = [0i32; 26];\n    for b in s.bytes() {\n        cnt[(b - b'a') as usize] += 1;\n    }\n    cnt.iter().filter(|&&k| k > 0).map(|&k| if k % 2 == 1 { 1 } else { 2 }).sum()\n}`,
        php: `function minimumLength($s) {\n    $cnt = array_fill(0, 26, 0);\n    for ($i = 0; $i < strlen($s); $i++) $cnt[ord($s[$i]) - 97]++;\n    $total = 0;\n    for ($i = 0; $i < 26; $i++) {\n        if ($cnt[$i] === 0) continue;\n        $total += $cnt[$i] % 2 === 1 ? 1 : 2;\n    }\n    return $total;\n}`,
        ruby: `def minimumLength(s)\n  cnt = Array.new(26, 0)\n  s.each_char { |c| cnt[c.ord - 97] += 1 }\n  cnt.select { |k| k > 0 }.sum { |k| k.odd? ? 1 : 2 }\nend`,
      },
    };
  })(),

  // ── Minimum Deletions to Make String Balanced (LC 1653) ─────────
  (() => {
    const ref = (s: string) => {
      let bCount = 0, res = 0;
      for (let i = 0; i < s.length; i++) {
        if (s.charAt(i) === "b") bCount++;
        else res = Math.min(res + 1, bCount);
      }
      return res;
    };
    return {
      slug: "minimum-deletions-to-make-string-balanced",
      title: "Minimum Deletions to Make String Balanced",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Stack", "Amazon", "Google", "Uber"],
      signature: { funcName: "minimumDeletions", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "`s` contains only `'a'` and `'b'`. It is **balanced** when there is no pair of indices `i < j` with `s[i] = 'b'` and `s[j] = 'a'` — in other words, every `a` comes before every `b`.\n\nReturn the minimum number of characters you must delete to make `s` balanced.",
        [
          { in: 's = "aababbab"', out: "2", note: "Delete the two `a`s after the first `b`, leaving `aabbbb`." },
          { in: 's = "bbaaaaabb"', out: "2", note: "Delete the two leading `b`s." },
          { in: 's = "aaaa"', out: "0", note: "Already balanced." },
        ],
        ["1 <= s.length <= 10^5", "s[i] is 'a' or 'b'."]),
      hints: [
        "The result is always some prefix of `a`s followed by a suffix of `b`s — you are choosing where the boundary falls.",
        "Sweep left to right keeping the number of `b`s seen so far and the best cost for the prefix processed.",
        "At an `a` you either delete it (cost + 1) or delete every `b` before it.",
      ],
      editorial: explain({
        idea: "Sweep once, carrying two numbers: `bCount`, the number of `b`s seen, and `res`, the cheapest way to balance the prefix so far. A `b` is always free to keep. An `a` forces a choice — delete this `a`, or delete all the `b`s before it — and the cheaper of the two is optimal.",
        steps: [
          "Start `bCount = 0` and `res = 0`.",
          "On a `'b'`, increment `bCount`.",
          "On an `'a'`, set `res = min(res + 1, bCount)`.",
          "Return `res`.",
        ],
        why: "Taking `min(res + 1, bCount)` is the whole algorithm, and it is correct because the two branches are exhaustive: in any balanced result this `a` is either gone, or it survives — and if it survives, no `b` before it can. `bCount` is exactly the cost of the second branch, and it needs no `res` term because deleting every earlier `b` already balances the prefix. Trying every boundary position with prefix sums is the same answer in two passes.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`res + 1` is not always the better branch — deleting the earlier `b`s can be cheaper.",
          "The two branches must not be added; exactly one of them happens.",
          "`bCount` keeps counting even after a branch chooses to \"delete\" those `b`s — it is a cost estimate, not a live state.",
        ],
      }),
      examples: [
        { input: '"aababbab"', expectedOutput: "2" },
        { input: '"bbaaaaabb"', expectedOutput: "2" },
        { input: '"aaaa"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 18);
        let s = "";
        for (let i = 0; i < n; i++) s += rng() < 0.5 ? "a" : "b";
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def minimumDeletions(s: str) -> int:\n    b_count = 0\n    res = 0\n    for c in s:\n        if c == "b":\n            b_count += 1\n        else:\n            res = min(res + 1, b_count)\n    return res`,
        javascript: `var minimumDeletions = function(s) {\n    var bCount = 0, res = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "b") bCount++;\n        else res = Math.min(res + 1, bCount);\n    }\n    return res;\n};`,
        typescript: `function minimumDeletions(s: string): number {\n    var bCount = 0, res = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "b") bCount++;\n        else res = Math.min(res + 1, bCount);\n    }\n    return res;\n}`,
        java: `public static int minimumDeletions(String s) {\n    int bCount = 0, res = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == 'b') bCount++;\n        else res = Math.min(res + 1, bCount);\n    }\n    return res;\n}`,
        cpp: `int minimumDeletions(string s) {\n    int bCount = 0, res = 0;\n    for (char c : s) {\n        if (c == 'b') bCount++;\n        else res = min(res + 1, bCount);\n    }\n    return res;\n}`,
        c: `int minimumDeletions(char* s) {\n    int bCount = 0, res = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        if (s[i] == 'b') bCount++;\n        else res = res + 1 < bCount ? res + 1 : bCount;\n    }\n    return res;\n}`,
        csharp: `public static int MinimumDeletions(string s)\n{\n    int bCount = 0, res = 0;\n    foreach (char c in s)\n    {\n        if (c == 'b') bCount++;\n        else res = Math.Min(res + 1, bCount);\n    }\n    return res;\n}`,
        go: `func minimumDeletions(s string) int {\n\tbCount, res := 0, 0\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] == 'b' {\n\t\t\tbCount++\n\t\t} else if res+1 < bCount {\n\t\t\tres = res + 1\n\t\t} else {\n\t\t\tres = bCount\n\t\t}\n\t}\n\treturn res\n}`,
        kotlin: `fun minimumDeletions(s: String): Int {\n    var bCount = 0\n    var res = 0\n    for (c in s) {\n        if (c == 'b') bCount++\n        else res = minOf(res + 1, bCount)\n    }\n    return res\n}`,
        swift: `func minimumDeletions(_ s: String) -> Int {\n    var bCount = 0\n    var res = 0\n    for c in s {\n        if c == "b" { bCount += 1 } else { res = min(res + 1, bCount) }\n    }\n    return res\n}`,
        rust: `fn minimumDeletions(s: String) -> i32 {\n    let mut b_count = 0;\n    let mut res = 0;\n    for c in s.chars() {\n        if c == 'b' {\n            b_count += 1;\n        } else {\n            res = std::cmp::min(res + 1, b_count);\n        }\n    }\n    res\n}`,
        php: `function minimumDeletions($s) {\n    $bCount = 0;\n    $res = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] === "b") $bCount++;\n        else $res = min($res + 1, $bCount);\n    }\n    return $res;\n}`,
        ruby: `def minimumDeletions(s)\n  b_count = 0\n  res = 0\n  s.each_char do |c|\n    if c == "b"\n      b_count += 1\n    else\n      res = [res + 1, b_count].min\n    end\n  end\n  res\nend`,
      },
    };
  })(),

  // ── Longest Substring of All Vowels in Order (LC 1839) ──────────
  (() => {
    const ref = (word: string) => {
      const order = "aeiou";
      let best = 0, run = 0, distinct = 0, prev = "";
      for (let i = 0; i < word.length; i++) {
        const c = word.charAt(i);
        if (order.indexOf(c) === -1) { run = 0; distinct = 0; prev = ""; continue; }
        if (prev === "") { if (c !== "a") { run = 0; distinct = 0; prev = ""; continue; } run = 1; distinct = 1; }
        else if (c === prev) run++;
        else if (order.indexOf(c) === order.indexOf(prev) + 1) { run++; distinct++; }
        else { if (c === "a") { run = 1; distinct = 1; } else { run = 0; distinct = 0; prev = ""; continue; } }
        prev = c;
        if (distinct === 5 && run > best) best = run;
      }
      return best;
    };
    return {
      slug: "longest-substring-of-all-vowels-in-order",
      title: "Longest Substring of All Vowels in Order",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window", "Amazon", "Google", "Adobe"],
      signature: { funcName: "longestBeautifulSubstring", params: [{ name: "word", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A string is **beautiful** when it contains **all five** vowels at least once and its characters appear in alphabetical vowel order — every `a` before every `e`, every `e` before every `i`, and so on.\n\nReturn the length of the longest beautiful substring of `word`, or 0 if there is none.",
        [
          { in: 'word = "aeiaaioaaaaeiiiiouuuooaauuaeiu"', out: "13", note: "The substring `aaaaeiiiiouuu`." },
          { in: 'word = "aeeeiiiioooauuuaeiou"', out: "5", note: "The trailing `aeiou`." },
          { in: 'word = "codekairo"', out: "0", note: "Consonants break every run, and no run reaches all five vowels." },
        ],
        ["1 <= word.length <= 5 * 10^5", "word consists of lowercase English letters."]),
      hints: [
        "A beautiful substring is a run where each character either repeats the previous vowel or advances to the next one in `aeiou`.",
        "Track the current run length and how many distinct vowels it has covered.",
        "Any break — a consonant, or a vowel that goes backwards — restarts the run, and it can only restart at an `a`.",
      ],
      editorial: explain({
        idea: "Sweep once, carrying the current run's length and the number of distinct vowels it has covered. Extend on a repeat or on the next vowel in order; restart otherwise. Whenever the distinct count hits 5, the current run is beautiful, so record its length.",
        steps: [
          "For each character, if it is not a vowel, reset the run.",
          "If the run is empty, start it only on an `'a'`.",
          "Otherwise extend on an equal vowel, or on the next vowel in `aeiou` (incrementing the distinct count).",
          "On any other vowel, restart — at 1 if the character is `'a'`, at 0 otherwise.",
          "Track the maximum run length seen while the distinct count is 5.",
        ],
        why: "The ordering constraint means a beautiful substring can never restart in the middle — the moment a vowel goes backwards, everything before it is unusable, and the only valid fresh start is an `'a'`. That is what lets a single pass with two counters replace a window that would otherwise have to shrink from the left.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "A run may only begin at `'a'`; starting mid-sequence would miss the leading vowels.",
          "A backwards step to `'a'` restarts the run **at that character**, not at zero.",
          "The answer is 0 when no run ever covers all five vowels — not the longest partial run.",
        ],
      }),
      examples: [
        { input: '"aeiaaioaaaaeiiiiouuuooaauuaeiu"', expectedOutput: "13" },
        { input: '"aeeeiiiioooauuuaeiou"', expectedOutput: "5" },
        { input: '"codekairo"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const vowels = "aeiou";
        const n = ri(rng, 1, 26);
        let word = "";
        // Bias toward forward-ordered runs so a beautiful substring turns up often.
        let idx = 0;
        for (let i = 0; i < n; i++) {
          const r = rng();
          if (r < 0.45) { /* repeat */ }
          else if (r < 0.85) idx = Math.min(idx + 1, 4);
          else idx = ri(rng, 0, 4);
          word += rng() < 0.08 ? "c" : vowels.charAt(idx);
        }
        return { input: `"${word}"`, expectedOutput: String(ref(word)) };
      },
      solutions: {
        python: `def longestBeautifulSubstring(word: str) -> int:\n    order = "aeiou"\n    best = run = distinct = 0\n    prev = ""\n    for c in word:\n        if c not in order:\n            run = distinct = 0\n            prev = ""\n            continue\n        if prev == "":\n            if c != "a":\n                continue\n            run, distinct = 1, 1\n        elif c == prev:\n            run += 1\n        elif order.index(c) == order.index(prev) + 1:\n            run += 1\n            distinct += 1\n        elif c == "a":\n            run, distinct = 1, 1\n        else:\n            run = distinct = 0\n            prev = ""\n            continue\n        prev = c\n        if distinct == 5:\n            best = max(best, run)\n    return best`,
        javascript: `var longestBeautifulSubstring = function(word) {\n    var order = "aeiou";\n    var best = 0, run = 0, distinct = 0, prev = "";\n    for (var i = 0; i < word.length; i++) {\n        var c = word.charAt(i);\n        if (order.indexOf(c) === -1) { run = 0; distinct = 0; prev = ""; continue; }\n        if (prev === "") {\n            if (c !== "a") continue;\n            run = 1; distinct = 1;\n        } else if (c === prev) {\n            run++;\n        } else if (order.indexOf(c) === order.indexOf(prev) + 1) {\n            run++; distinct++;\n        } else if (c === "a") {\n            run = 1; distinct = 1;\n        } else {\n            run = 0; distinct = 0; prev = ""; continue;\n        }\n        prev = c;\n        if (distinct === 5 && run > best) best = run;\n    }\n    return best;\n};`,
        typescript: `function longestBeautifulSubstring(word: string): number {\n    var order = "aeiou";\n    var best = 0, run = 0, distinct = 0, prev = "";\n    for (var i = 0; i < word.length; i++) {\n        var c = word.charAt(i);\n        if (order.indexOf(c) === -1) { run = 0; distinct = 0; prev = ""; continue; }\n        if (prev === "") {\n            if (c !== "a") continue;\n            run = 1; distinct = 1;\n        } else if (c === prev) {\n            run++;\n        } else if (order.indexOf(c) === order.indexOf(prev) + 1) {\n            run++; distinct++;\n        } else if (c === "a") {\n            run = 1; distinct = 1;\n        } else {\n            run = 0; distinct = 0; prev = ""; continue;\n        }\n        prev = c;\n        if (distinct === 5 && run > best) best = run;\n    }\n    return best;\n}`,
        java: `public static int longestBeautifulSubstring(String word) {\n    String order = "aeiou";\n    int best = 0, run = 0, distinct = 0;\n    char prev = 0;\n    for (int i = 0; i < word.length(); i++) {\n        char c = word.charAt(i);\n        if (order.indexOf(c) < 0) { run = 0; distinct = 0; prev = 0; continue; }\n        if (prev == 0) {\n            if (c != 'a') continue;\n            run = 1; distinct = 1;\n        } else if (c == prev) {\n            run++;\n        } else if (order.indexOf(c) == order.indexOf(prev) + 1) {\n            run++; distinct++;\n        } else if (c == 'a') {\n            run = 1; distinct = 1;\n        } else {\n            run = 0; distinct = 0; prev = 0; continue;\n        }\n        prev = c;\n        if (distinct == 5) best = Math.max(best, run);\n    }\n    return best;\n}`,
        cpp: `int longestBeautifulSubstring(string word) {\n    string order = "aeiou";\n    int best = 0, run = 0, distinct = 0;\n    char prev = 0;\n    for (char c : word) {\n        if (order.find(c) == string::npos) { run = 0; distinct = 0; prev = 0; continue; }\n        if (prev == 0) {\n            if (c != 'a') continue;\n            run = 1; distinct = 1;\n        } else if (c == prev) {\n            run++;\n        } else if ((int) order.find(c) == (int) order.find(prev) + 1) {\n            run++; distinct++;\n        } else if (c == 'a') {\n            run = 1; distinct = 1;\n        } else {\n            run = 0; distinct = 0; prev = 0; continue;\n        }\n        prev = c;\n        if (distinct == 5) best = max(best, run);\n    }\n    return best;\n}`,
        c: `static int vowelRank(char c) {\n    const char* order = "aeiou";\n    for (int i = 0; i < 5; i++) {\n        if (order[i] == c) return i;\n    }\n    return -1;\n}\n\nint longestBeautifulSubstring(char* word) {\n    int best = 0, run = 0, distinct = 0;\n    char prev = 0;\n    for (int i = 0; word[i] != '\\0'; i++) {\n        char c = word[i];\n        if (vowelRank(c) < 0) { run = 0; distinct = 0; prev = 0; continue; }\n        if (prev == 0) {\n            if (c != 'a') continue;\n            run = 1; distinct = 1;\n        } else if (c == prev) {\n            run++;\n        } else if (vowelRank(c) == vowelRank(prev) + 1) {\n            run++; distinct++;\n        } else if (c == 'a') {\n            run = 1; distinct = 1;\n        } else {\n            run = 0; distinct = 0; prev = 0; continue;\n        }\n        prev = c;\n        if (distinct == 5 && run > best) best = run;\n    }\n    return best;\n}`,
        csharp: `public static int LongestBeautifulSubstring(string word)\n{\n    const string order = "aeiou";\n    int best = 0, run = 0, distinct = 0;\n    char prev = '\\0';\n    foreach (char c in word)\n    {\n        if (order.IndexOf(c) < 0) { run = 0; distinct = 0; prev = '\\0'; continue; }\n        if (prev == '\\0')\n        {\n            if (c != 'a') continue;\n            run = 1; distinct = 1;\n        }\n        else if (c == prev) { run++; }\n        else if (order.IndexOf(c) == order.IndexOf(prev) + 1) { run++; distinct++; }\n        else if (c == 'a') { run = 1; distinct = 1; }\n        else { run = 0; distinct = 0; prev = '\\0'; continue; }\n        prev = c;\n        if (distinct == 5) best = Math.Max(best, run);\n    }\n    return best;\n}`,
        go: `func longestBeautifulSubstring(word string) int {\n\trank := func(c byte) int {\n\t\torder := "aeiou"\n\t\tfor i := 0; i < 5; i++ {\n\t\t\tif order[i] == c {\n\t\t\t\treturn i\n\t\t\t}\n\t\t}\n\t\treturn -1\n\t}\n\tbest, run, distinct := 0, 0, 0\n\tvar prev byte = 0\n\tfor i := 0; i < len(word); i++ {\n\t\tc := word[i]\n\t\tif rank(c) < 0 {\n\t\t\trun, distinct, prev = 0, 0, 0\n\t\t\tcontinue\n\t\t}\n\t\tif prev == 0 {\n\t\t\tif c != 'a' {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\trun, distinct = 1, 1\n\t\t} else if c == prev {\n\t\t\trun++\n\t\t} else if rank(c) == rank(prev)+1 {\n\t\t\trun++\n\t\t\tdistinct++\n\t\t} else if c == 'a' {\n\t\t\trun, distinct = 1, 1\n\t\t} else {\n\t\t\trun, distinct, prev = 0, 0, 0\n\t\t\tcontinue\n\t\t}\n\t\tprev = c\n\t\tif distinct == 5 && run > best {\n\t\t\tbest = run\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun longestBeautifulSubstring(word: String): Int {\n    val order = "aeiou"\n    var best = 0\n    var run = 0\n    var distinct = 0\n    var prev = '\\u0000'\n    for (c in word) {\n        if (order.indexOf(c) < 0) {\n            run = 0; distinct = 0; prev = '\\u0000'\n            continue\n        }\n        if (prev == '\\u0000') {\n            if (c != 'a') continue\n            run = 1; distinct = 1\n        } else if (c == prev) {\n            run++\n        } else if (order.indexOf(c) == order.indexOf(prev) + 1) {\n            run++; distinct++\n        } else if (c == 'a') {\n            run = 1; distinct = 1\n        } else {\n            run = 0; distinct = 0; prev = '\\u0000'\n            continue\n        }\n        prev = c\n        if (distinct == 5 && run > best) best = run\n    }\n    return best\n}`,
        swift: `func longestBeautifulSubstring(_ word: String) -> Int {\n    let order = Array("aeiou")\n    func rank(_ c: Character) -> Int {\n        for i in 0..<5 where order[i] == c { return i }\n        return -1\n    }\n    var best = 0, run = 0, distinct = 0\n    var prev: Character? = nil\n    for c in word {\n        if rank(c) < 0 {\n            run = 0; distinct = 0; prev = nil\n            continue\n        }\n        if prev == nil {\n            if c != "a" { continue }\n            run = 1; distinct = 1\n        } else if c == prev! {\n            run += 1\n        } else if rank(c) == rank(prev!) + 1 {\n            run += 1; distinct += 1\n        } else if c == "a" {\n            run = 1; distinct = 1\n        } else {\n            run = 0; distinct = 0; prev = nil\n            continue\n        }\n        prev = c\n        if distinct == 5 && run > best { best = run }\n    }\n    return best\n}`,
        rust: `fn longestBeautifulSubstring(word: String) -> i32 {\n    fn rank(c: char) -> i32 {\n        match c {\n            'a' => 0,\n            'e' => 1,\n            'i' => 2,\n            'o' => 3,\n            'u' => 4,\n            _ => -1,\n        }\n    }\n    let mut best = 0;\n    let mut run = 0;\n    let mut distinct = 0;\n    let mut prev: Option<char> = None;\n    for c in word.chars() {\n        if rank(c) < 0 {\n            run = 0;\n            distinct = 0;\n            prev = None;\n            continue;\n        }\n        match prev {\n            None => {\n                if c != 'a' {\n                    continue;\n                }\n                run = 1;\n                distinct = 1;\n            }\n            Some(p) if c == p => run += 1,\n            Some(p) if rank(c) == rank(p) + 1 => {\n                run += 1;\n                distinct += 1;\n            }\n            _ => {\n                if c == 'a' {\n                    run = 1;\n                    distinct = 1;\n                } else {\n                    run = 0;\n                    distinct = 0;\n                    prev = None;\n                    continue;\n                }\n            }\n        }\n        prev = Some(c);\n        if distinct == 5 && run > best {\n            best = run;\n        }\n    }\n    best\n}`,
        php: `function longestBeautifulSubstring($word) {\n    $order = "aeiou";\n    $best = 0; $run = 0; $distinct = 0; $prev = "";\n    for ($i = 0; $i < strlen($word); $i++) {\n        $c = $word[$i];\n        if (strpos($order, $c) === false) { $run = 0; $distinct = 0; $prev = ""; continue; }\n        if ($prev === "") {\n            if ($c !== "a") continue;\n            $run = 1; $distinct = 1;\n        } elseif ($c === $prev) {\n            $run++;\n        } elseif (strpos($order, $c) === strpos($order, $prev) + 1) {\n            $run++; $distinct++;\n        } elseif ($c === "a") {\n            $run = 1; $distinct = 1;\n        } else {\n            $run = 0; $distinct = 0; $prev = ""; continue;\n        }\n        $prev = $c;\n        if ($distinct === 5 && $run > $best) $best = $run;\n    }\n    return $best;\n}`,
        ruby: `def longestBeautifulSubstring(word)\n  order = "aeiou"\n  best = 0\n  run = 0\n  distinct = 0\n  prev = nil\n  word.each_char do |c|\n    if order.index(c).nil?\n      run = 0; distinct = 0; prev = nil\n      next\n    end\n    if prev.nil?\n      next if c != "a"\n      run = 1; distinct = 1\n    elsif c == prev\n      run += 1\n    elsif order.index(c) == order.index(prev) + 1\n      run += 1; distinct += 1\n    elsif c == "a"\n      run = 1; distinct = 1\n    else\n      run = 0; distinct = 0; prev = nil\n      next\n    end\n    prev = c\n    best = run if distinct == 5 && run > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Count Vowel Substrings of a String (LC 2062) ────────────────
  (() => {
    const ref = (word: string) => {
      const V = "aeiou";
      let count = 0;
      for (let i = 0; i < word.length; i++) {
        const seen: Record<string, boolean> = {};
        let distinct = 0;
        for (let j = i; j < word.length; j++) {
          const c = word.charAt(j);
          if (V.indexOf(c) === -1) break;
          if (!seen[c]) { seen[c] = true; distinct++; }
          if (distinct === 5) count++;
        }
      }
      return count;
    };
    return {
      slug: "count-vowel-substrings-of-a-string",
      title: "Count Vowel Substrings of a String",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Sliding Window", "Amazon", "Google", "Cognizant"],
      signature: { funcName: "countVowelSubstrings", params: [{ name: "word", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A **vowel substring** is a contiguous substring made up **only** of vowels (`a`, `e`, `i`, `o`, `u`) that contains **all five** of them at least once.\n\nReturn the number of vowel substrings of `word`.",
        [
          { in: 'word = "aeiouu"', out: "2", note: "`aeiou` and `aeiouu`." },
          { in: 'word = "codekairo"', out: "0", note: "Consonants break every run, so no all-vowel substring exists." },
          { in: 'word = "cuaieuouac"', out: "7" },
        ],
        ["1 <= word.length <= 100", "word consists of lowercase English letters only."]),
      hints: [
        "A consonant ends every candidate — the substring must be entirely vowels.",
        "For each starting index, extend right while the characters stay vowels and count once all five have appeared.",
        "At `n <= 100` the quadratic enumeration is comfortable.",
      ],
      editorial: explain({
        idea: "For each start index, extend a window right while the characters remain vowels, tracking how many distinct vowels have been seen. Every extension after the fifth distinct vowel arrives is another valid substring.",
        steps: [
          "For each `i`, reset a set of seen vowels.",
          "Extend `j` from `i`; break out on a consonant.",
          "Count the substring whenever the set holds all five vowels.",
        ],
        why: "Breaking on a consonant is what keeps this near-linear in practice — the inner loop never crosses one, so the total work is the sum of the squares of the vowel-run lengths, not n². The sliding-window version tracks the smallest window covering all five and adds its left-extension count, which is O(n) but far harder to get exactly right.",
        time: "O(n²) in the worst case, and much less when consonants are common",
        space: "O(1) — at most five distinct vowels",
        pitfalls: [
          "The substring must contain **no** consonants, not merely start and end with vowels.",
          "All five vowels are required — four is not enough.",
          "Longer substrings that still qualify each count separately.",
        ],
      }),
      examples: [
        { input: '"aeiouu"', expectedOutput: "2" },
        { input: '"codekairo"', expectedOutput: "0" },
        { input: '"cuaieuouac"', expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const pool = "aeioubc";
        const n = ri(rng, 1, 18);
        let word = "";
        for (let i = 0; i < n; i++) word += pool.charAt(ri(rng, 0, pool.length - 1));
        return { input: `"${word}"`, expectedOutput: String(ref(word)) };
      },
      solutions: {
        python: `def countVowelSubstrings(word: str) -> int:\n    vowels = set("aeiou")\n    count = 0\n    for i in range(len(word)):\n        seen = set()\n        for j in range(i, len(word)):\n            if word[j] not in vowels:\n                break\n            seen.add(word[j])\n            if len(seen) == 5:\n                count += 1\n    return count`,
        javascript: `var countVowelSubstrings = function(word) {\n    var V = "aeiou", count = 0;\n    for (var i = 0; i < word.length; i++) {\n        var seen = {}, distinct = 0;\n        for (var j = i; j < word.length; j++) {\n            var c = word.charAt(j);\n            if (V.indexOf(c) === -1) break;\n            if (!seen[c]) { seen[c] = true; distinct++; }\n            if (distinct === 5) count++;\n        }\n    }\n    return count;\n};`,
        typescript: `function countVowelSubstrings(word: string): number {\n    var V = "aeiou", count = 0;\n    for (var i = 0; i < word.length; i++) {\n        var seen: { [k: string]: boolean } = {}, distinct = 0;\n        for (var j = i; j < word.length; j++) {\n            var c = word.charAt(j);\n            if (V.indexOf(c) === -1) break;\n            if (!seen[c]) { seen[c] = true; distinct++; }\n            if (distinct === 5) count++;\n        }\n    }\n    return count;\n}`,
        java: `public static int countVowelSubstrings(String word) {\n    String V = "aeiou";\n    int count = 0;\n    for (int i = 0; i < word.length(); i++) {\n        boolean[] seen = new boolean[5];\n        int distinct = 0;\n        for (int j = i; j < word.length(); j++) {\n            int idx = V.indexOf(word.charAt(j));\n            if (idx < 0) break;\n            if (!seen[idx]) { seen[idx] = true; distinct++; }\n            if (distinct == 5) count++;\n        }\n    }\n    return count;\n}`,
        cpp: `int countVowelSubstrings(string word) {\n    string V = "aeiou";\n    int count = 0;\n    for (int i = 0; i < (int) word.size(); i++) {\n        bool seen[5] = {false, false, false, false, false};\n        int distinct = 0;\n        for (int j = i; j < (int) word.size(); j++) {\n            size_t idx = V.find(word[j]);\n            if (idx == string::npos) break;\n            if (!seen[idx]) { seen[idx] = true; distinct++; }\n            if (distinct == 5) count++;\n        }\n    }\n    return count;\n}`,
        c: `static int cvsRank(char c) {\n    const char* order = "aeiou";\n    for (int i = 0; i < 5; i++) {\n        if (order[i] == c) return i;\n    }\n    return -1;\n}\n\nint countVowelSubstrings(char* word) {\n    int n = (int) strlen(word);\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        int seen[5] = {0, 0, 0, 0, 0};\n        int distinct = 0;\n        for (int j = i; j < n; j++) {\n            int idx = cvsRank(word[j]);\n            if (idx < 0) break;\n            if (!seen[idx]) { seen[idx] = 1; distinct++; }\n            if (distinct == 5) count++;\n        }\n    }\n    return count;\n}`,
        csharp: `public static int CountVowelSubstrings(string word)\n{\n    const string V = "aeiou";\n    int count = 0;\n    for (int i = 0; i < word.Length; i++)\n    {\n        var seen = new bool[5];\n        int distinct = 0;\n        for (int j = i; j < word.Length; j++)\n        {\n            int idx = V.IndexOf(word[j]);\n            if (idx < 0) break;\n            if (!seen[idx]) { seen[idx] = true; distinct++; }\n            if (distinct == 5) count++;\n        }\n    }\n    return count;\n}`,
        go: `func countVowelSubstrings(word string) int {\n\trank := func(c byte) int {\n\t\torder := "aeiou"\n\t\tfor i := 0; i < 5; i++ {\n\t\t\tif order[i] == c {\n\t\t\t\treturn i\n\t\t\t}\n\t\t}\n\t\treturn -1\n\t}\n\tcount := 0\n\tfor i := 0; i < len(word); i++ {\n\t\tvar seen [5]bool\n\t\tdistinct := 0\n\t\tfor j := i; j < len(word); j++ {\n\t\t\tidx := rank(word[j])\n\t\t\tif idx < 0 {\n\t\t\t\tbreak\n\t\t\t}\n\t\t\tif !seen[idx] {\n\t\t\t\tseen[idx] = true\n\t\t\t\tdistinct++\n\t\t\t}\n\t\t\tif distinct == 5 {\n\t\t\t\tcount++\n\t\t\t}\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countVowelSubstrings(word: String): Int {\n    val v = "aeiou"\n    var count = 0\n    for (i in word.indices) {\n        val seen = BooleanArray(5)\n        var distinct = 0\n        for (j in i until word.length) {\n            val idx = v.indexOf(word[j])\n            if (idx < 0) break\n            if (!seen[idx]) {\n                seen[idx] = true\n                distinct++\n            }\n            if (distinct == 5) count++\n        }\n    }\n    return count\n}`,
        swift: `func countVowelSubstrings(_ word: String) -> Int {\n    let chars = Array(word)\n    let order = Array("aeiou")\n    var count = 0\n    for i in 0..<chars.count {\n        var seen = [Bool](repeating: false, count: 5)\n        var distinct = 0\n        for j in i..<chars.count {\n            var idx = -1\n            for k in 0..<5 where order[k] == chars[j] { idx = k }\n            if idx < 0 { break }\n            if !seen[idx] {\n                seen[idx] = true\n                distinct += 1\n            }\n            if distinct == 5 { count += 1 }\n        }\n    }\n    return count\n}`,
        rust: `fn countVowelSubstrings(word: String) -> i32 {\n    fn rank(c: char) -> i32 {\n        match c {\n            'a' => 0,\n            'e' => 1,\n            'i' => 2,\n            'o' => 3,\n            'u' => 4,\n            _ => -1,\n        }\n    }\n    let chars: Vec<char> = word.chars().collect();\n    let mut count = 0;\n    for i in 0..chars.len() {\n        let mut seen = [false; 5];\n        let mut distinct = 0;\n        for j in i..chars.len() {\n            let idx = rank(chars[j]);\n            if idx < 0 {\n                break;\n            }\n            if !seen[idx as usize] {\n                seen[idx as usize] = true;\n                distinct += 1;\n            }\n            if distinct == 5 {\n                count += 1;\n            }\n        }\n    }\n    count\n}`,
        php: `function countVowelSubstrings($word) {\n    $v = "aeiou";\n    $count = 0;\n    $n = strlen($word);\n    for ($i = 0; $i < $n; $i++) {\n        $seen = array_fill(0, 5, false);\n        $distinct = 0;\n        for ($j = $i; $j < $n; $j++) {\n            $idx = strpos($v, $word[$j]);\n            if ($idx === false) break;\n            if (!$seen[$idx]) { $seen[$idx] = true; $distinct++; }\n            if ($distinct === 5) $count++;\n        }\n    }\n    return $count;\n}`,
        ruby: `def countVowelSubstrings(word)\n  v = "aeiou"\n  count = 0\n  (0...word.length).each do |i|\n    seen = {}\n    (i...word.length).each do |j|\n      c = word[j]\n      break unless v.include?(c)\n      seen[c] = true\n      count += 1 if seen.size == 5\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Minimum Steps to Make Two Strings Anagram II (LC 2186) ──────
  (() => {
    const ref = (s: string, t: string) => {
      const a = new Array(26).fill(0);
      const b = new Array(26).fill(0);
      for (let i = 0; i < s.length; i++) a[s.charCodeAt(i) - 97]++;
      for (let i = 0; i < t.length; i++) b[t.charCodeAt(i) - 97]++;
      let steps = 0;
      for (let c = 0; c < 26; c++) steps += Math.abs(a[c] - b[c]);
      return steps;
    };
    return {
      slug: "minimum-number-of-steps-to-make-two-strings-anagram-ii",
      title: "Minimum Number of Steps to Make Two Strings Anagram II",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon", "Google", "Infosys"],
      signature: { funcName: "minSteps", params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }], returns: "int" as const },
      description: describe(
        "In one step you may append **any** character to the end of `s` **or** of `t`.\n\nReturn the minimum number of steps needed to make `s` and `t` anagrams of each other — same letters with the same multiplicities, in any order.",
        [
          { in: 's = "codekairo", t = "kairo"', out: "4", note: "`t` is missing one each of `c`, `o`, `d` and `e`." },
          { in: 's = "night", t = "thing"', out: "0", note: "Already anagrams." },
          { in: 's = "leetcode", t = "coats"', out: "7", note: "`t` needs `d` and three `e`s and an `l`; `s` needs `a` and `s`." },
        ],
        ["1 <= s.length, t.length <= 2 * 10^5", "s and t consist of lowercase English letters."]),
      hints: [
        "Characters can only be **added**, never removed — so neither string can lose a surplus.",
        "For each letter, the string with fewer copies must be topped up to match the other.",
        "Sum the absolute differences of the 26 letter counts.",
      ],
      editorial: explain({
        idea: "Tally both strings. For each letter, the one with fewer occurrences needs the difference appended, so the answer is the sum of `|count_s[c] - count_t[c]|` over the alphabet.",
        steps: [
          "Count the 26 letters in `s` and in `t`.",
          "Add up the absolute differences.",
        ],
        why: "Because appends are the only operation, a surplus on either side is permanent — it must be matched rather than removed. The letters are independent, so the total is simply the sum of per-letter shortfalls in both directions, which the absolute value captures in one term.",
        time: "O(n + m)",
        space: "O(1) — two 26-slot tallies",
        pitfalls: [
          "Both directions count: `s` may need characters too, not only `t`.",
          "The absolute difference — not the maximum count, and not half the difference.",
          "Characters cannot be deleted, so the lengths need not end up equal to either original.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n"kairo"', expectedOutput: "4" },
        { input: '"night"\n"thing"', expectedOutput: "0" },
        { input: '"leetcode"\n"coats"', expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcde";
        const make = (len: number) => {
          let out = "";
          for (let i = 0; i < len; i++) out += alphabet.charAt(ri(rng, 0, 4));
          return out;
        };
        const s = make(ri(rng, 1, 12));
        const t = rng() < 0.2 ? shuffle(rng, s.split("")).join("") : make(ri(rng, 1, 12));
        return { input: `"${s}"\n"${t}"`, expectedOutput: String(ref(s, t)) };
      },
      solutions: {
        python: `def minSteps(s: str, t: str) -> int:\n    a = [0] * 26\n    b = [0] * 26\n    for c in s:\n        a[ord(c) - 97] += 1\n    for c in t:\n        b[ord(c) - 97] += 1\n    return sum(abs(a[i] - b[i]) for i in range(26))`,
        javascript: `var minSteps = function(s, t) {\n    var a = [], b = [], i;\n    for (i = 0; i < 26; i++) { a.push(0); b.push(0); }\n    for (i = 0; i < s.length; i++) a[s.charCodeAt(i) - 97]++;\n    for (i = 0; i < t.length; i++) b[t.charCodeAt(i) - 97]++;\n    var steps = 0;\n    for (i = 0; i < 26; i++) steps += Math.abs(a[i] - b[i]);\n    return steps;\n};`,
        typescript: `function minSteps(s: string, t: string): number {\n    var a: number[] = [], b: number[] = [], i: number;\n    for (i = 0; i < 26; i++) { a.push(0); b.push(0); }\n    for (i = 0; i < s.length; i++) a[s.charCodeAt(i) - 97]++;\n    for (i = 0; i < t.length; i++) b[t.charCodeAt(i) - 97]++;\n    var steps = 0;\n    for (i = 0; i < 26; i++) steps += Math.abs(a[i] - b[i]);\n    return steps;\n}`,
        java: `public static int minSteps(String s, String t) {\n    int[] a = new int[26];\n    int[] b = new int[26];\n    for (int i = 0; i < s.length(); i++) a[s.charAt(i) - 'a']++;\n    for (int i = 0; i < t.length(); i++) b[t.charAt(i) - 'a']++;\n    int steps = 0;\n    for (int i = 0; i < 26; i++) steps += Math.abs(a[i] - b[i]);\n    return steps;\n}`,
        cpp: `int minSteps(string s, string t) {\n    vector<int> a(26, 0), b(26, 0);\n    for (char c : s) a[c - 'a']++;\n    for (char c : t) b[c - 'a']++;\n    int steps = 0;\n    for (int i = 0; i < 26; i++) steps += abs(a[i] - b[i]);\n    return steps;\n}`,
        c: `int minSteps(char* s, char* t) {\n    int a[26], b[26];\n    for (int i = 0; i < 26; i++) { a[i] = 0; b[i] = 0; }\n    for (int i = 0; s[i] != '\\0'; i++) a[s[i] - 'a']++;\n    for (int i = 0; t[i] != '\\0'; i++) b[t[i] - 'a']++;\n    int steps = 0;\n    for (int i = 0; i < 26; i++) {\n        int d = a[i] - b[i];\n        steps += d < 0 ? -d : d;\n    }\n    return steps;\n}`,
        csharp: `public static int MinSteps(string s, string t)\n{\n    var a = new int[26];\n    var b = new int[26];\n    foreach (char c in s) a[c - 'a']++;\n    foreach (char c in t) b[c - 'a']++;\n    int steps = 0;\n    for (int i = 0; i < 26; i++) steps += Math.Abs(a[i] - b[i]);\n    return steps;\n}`,
        go: `func minSteps(s string, t string) int {\n\tvar a, b [26]int\n\tfor i := 0; i < len(s); i++ {\n\t\ta[s[i]-'a']++\n\t}\n\tfor i := 0; i < len(t); i++ {\n\t\tb[t[i]-'a']++\n\t}\n\tsteps := 0\n\tfor i := 0; i < 26; i++ {\n\t\td := a[i] - b[i]\n\t\tif d < 0 {\n\t\t\td = -d\n\t\t}\n\t\tsteps += d\n\t}\n\treturn steps\n}`,
        kotlin: `fun minSteps(s: String, t: String): Int {\n    val a = IntArray(26)\n    val b = IntArray(26)\n    for (c in s) a[c - 'a']++\n    for (c in t) b[c - 'a']++\n    var steps = 0\n    for (i in 0 until 26) steps += kotlin.math.abs(a[i] - b[i])\n    return steps\n}`,
        swift: `func minSteps(_ s: String, _ t: String) -> Int {\n    var a = [Int](repeating: 0, count: 26)\n    var b = [Int](repeating: 0, count: 26)\n    let base = Int(Character("a").asciiValue!)\n    for c in s.unicodeScalars { a[Int(c.value) - base] += 1 }\n    for c in t.unicodeScalars { b[Int(c.value) - base] += 1 }\n    var steps = 0\n    for i in 0..<26 { steps += abs(a[i] - b[i]) }\n    return steps\n}`,
        rust: `fn minSteps(s: String, t: String) -> i32 {\n    let mut a = [0i32; 26];\n    let mut b = [0i32; 26];\n    for c in s.bytes() {\n        a[(c - b'a') as usize] += 1;\n    }\n    for c in t.bytes() {\n        b[(c - b'a') as usize] += 1;\n    }\n    (0..26).map(|i| (a[i] - b[i]).abs()).sum()\n}`,
        php: `function minSteps($s, $t) {\n    $a = array_fill(0, 26, 0);\n    $b = array_fill(0, 26, 0);\n    for ($i = 0; $i < strlen($s); $i++) $a[ord($s[$i]) - 97]++;\n    for ($i = 0; $i < strlen($t); $i++) $b[ord($t[$i]) - 97]++;\n    $steps = 0;\n    for ($i = 0; $i < 26; $i++) $steps += abs($a[$i] - $b[$i]);\n    return $steps;\n}`,
        ruby: `def minSteps(s, t)\n  a = Array.new(26, 0)\n  b = Array.new(26, 0)\n  s.each_char { |c| a[c.ord - 97] += 1 }\n  t.each_char { |c| b[c.ord - 97] += 1 }\n  (0...26).sum { |i| (a[i] - b[i]).abs }\nend`,
      },
    };
  })(),

  // ── Construct String With Repeat Limit (LC 2182) ────────────────
  (() => {
    const ref = (s: string, repeatLimit: number) => {
      const cnt = new Array(26).fill(0);
      for (let k = 0; k < s.length; k++) cnt[s.charCodeAt(k) - 97]++;
      let out = "";
      let i = 25;
      while (i >= 0) {
        if (cnt[i] === 0) { i--; continue; }
        const take = Math.min(cnt[i], repeatLimit);
        for (let t = 0; t < take; t++) out += String.fromCharCode(97 + i);
        cnt[i] -= take;
        if (cnt[i] === 0) { i--; continue; }
        let j = i - 1;
        while (j >= 0 && cnt[j] === 0) j--;
        if (j < 0) break;
        out += String.fromCharCode(97 + j);
        cnt[j]--;
      }
      return out;
    };
    return {
      slug: "construct-string-with-repeat-limit",
      title: "Construct String With Repeat Limit",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Greedy", "Heap (Priority Queue)", "Counting", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "repeatLimitedString", params: [{ name: "s", type: "string" as const }, { name: "repeatLimit", type: "int" as const }], returns: "string" as const },
      description: describe(
        "Using **some or all** of the characters of `s`, build the **lexicographically largest** string in which no character appears more than `repeatLimit` times **in a row**.\n\nReturn that string.",
        [
          { in: 's = "codekairo", repeatLimit = 2', out: "rookiedca", note: "Largest first: `r`, then both `o`s (exactly the limit), then the rest descending." },
          { in: 's = "cczazcc", repeatLimit = 3', out: "zzcccac", note: "After three `c`s the run must break, so the lone `a` goes in before the last `c`." },
          { in: 's = "aababab", repeatLimit = 2', out: "bbabaa", note: "One `a` is left unused — you need not use every character." },
        ],
        ["1 <= repeatLimit <= s.length <= 10^5", "s consists of lowercase English letters."]),
      hints: [
        "Greedily emit the largest available character, up to `repeatLimit` copies.",
        "If that character still has copies left, you must break the run with exactly **one** copy of the next-largest available character.",
        "If no smaller character remains, you are finished — the leftovers cannot be placed.",
      ],
      editorial: explain({
        idea: "Count the letters, then repeatedly take the largest one still available, emitting up to `repeatLimit` copies. If it is not exhausted, insert exactly one copy of the next-largest available letter to break the run, and go back to the largest.",
        steps: [
          "Tally the 26 letters.",
          "Point `i` at the largest non-empty letter; emit `min(count[i], repeatLimit)` copies.",
          "If `count[i]` reaches 0, move `i` down and continue.",
          "Otherwise find the largest `j < i` with `count[j] > 0`; if none exists, stop. Emit one copy of `j` and repeat.",
        ],
        why: "The greedy is optimal because lexicographic order is decided at the first differing position: putting the largest possible character there can never be beaten later. The separator must be exactly **one** character and the largest one available — a longer break, or a smaller separator, both push a smaller character earlier than necessary. And when no smaller letter is left, the remaining copies genuinely cannot be used, which is why the output may be shorter than `s`.",
        time: "O(n + 26²)",
        space: "O(1) beyond the output",
        pitfalls: [
          "Insert exactly one separator, not `repeatLimit` of them.",
          "The separator is the **largest** smaller available letter, not the smallest.",
          "Some characters may go unused; the answer need not be a permutation of `s`.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n2', expectedOutput: "rookiedca" },
        { input: '"cczazcc"\n3', expectedOutput: "zzcccac" },
        { input: '"aababab"\n2', expectedOutput: "bbabaa" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcd";
        const n = ri(rng, 1, 14);
        let s = "";
        for (let i = 0; i < n; i++) s += alphabet.charAt(ri(rng, 0, 3));
        const repeatLimit = ri(rng, 1, Math.min(3, n));
        return { input: `"${s}"\n${repeatLimit}`, expectedOutput: ref(s, repeatLimit) };
      },
      solutions: {
        python: `def repeatLimitedString(s: str, repeatLimit: int) -> str:\n    cnt = [0] * 26\n    for c in s:\n        cnt[ord(c) - 97] += 1\n    out = []\n    i = 25\n    while i >= 0:\n        if cnt[i] == 0:\n            i -= 1\n            continue\n        take = min(cnt[i], repeatLimit)\n        out.append(chr(97 + i) * take)\n        cnt[i] -= take\n        if cnt[i] == 0:\n            i -= 1\n            continue\n        j = i - 1\n        while j >= 0 and cnt[j] == 0:\n            j -= 1\n        if j < 0:\n            break\n        out.append(chr(97 + j))\n        cnt[j] -= 1\n    return "".join(out)`,
        javascript: `var repeatLimitedString = function(s, repeatLimit) {\n    var cnt = [], k;\n    for (k = 0; k < 26; k++) cnt.push(0);\n    for (k = 0; k < s.length; k++) cnt[s.charCodeAt(k) - 97]++;\n    var out = "";\n    var i = 25;\n    while (i >= 0) {\n        if (cnt[i] === 0) { i--; continue; }\n        var take = Math.min(cnt[i], repeatLimit);\n        for (var t = 0; t < take; t++) out += String.fromCharCode(97 + i);\n        cnt[i] -= take;\n        if (cnt[i] === 0) { i--; continue; }\n        var j = i - 1;\n        while (j >= 0 && cnt[j] === 0) j--;\n        if (j < 0) break;\n        out += String.fromCharCode(97 + j);\n        cnt[j]--;\n    }\n    return out;\n};`,
        typescript: `function repeatLimitedString(s: string, repeatLimit: number): string {\n    var cnt: number[] = [], k: number;\n    for (k = 0; k < 26; k++) cnt.push(0);\n    for (k = 0; k < s.length; k++) cnt[s.charCodeAt(k) - 97]++;\n    var out = "";\n    var i = 25;\n    while (i >= 0) {\n        if (cnt[i] === 0) { i--; continue; }\n        var take = Math.min(cnt[i], repeatLimit);\n        for (var t = 0; t < take; t++) out += String.fromCharCode(97 + i);\n        cnt[i] -= take;\n        if (cnt[i] === 0) { i--; continue; }\n        var j = i - 1;\n        while (j >= 0 && cnt[j] === 0) j--;\n        if (j < 0) break;\n        out += String.fromCharCode(97 + j);\n        cnt[j]--;\n    }\n    return out;\n}`,
        java: `public static String repeatLimitedString(String s, int repeatLimit) {\n    int[] cnt = new int[26];\n    for (int k = 0; k < s.length(); k++) cnt[s.charAt(k) - 'a']++;\n    StringBuilder sb = new StringBuilder();\n    int i = 25;\n    while (i >= 0) {\n        if (cnt[i] == 0) { i--; continue; }\n        int take = Math.min(cnt[i], repeatLimit);\n        for (int t = 0; t < take; t++) sb.append((char) ('a' + i));\n        cnt[i] -= take;\n        if (cnt[i] == 0) { i--; continue; }\n        int j = i - 1;\n        while (j >= 0 && cnt[j] == 0) j--;\n        if (j < 0) break;\n        sb.append((char) ('a' + j));\n        cnt[j]--;\n    }\n    return sb.toString();\n}`,
        cpp: `string repeatLimitedString(string s, int repeatLimit) {\n    vector<int> cnt(26, 0);\n    for (char c : s) cnt[c - 'a']++;\n    string out;\n    int i = 25;\n    while (i >= 0) {\n        if (cnt[i] == 0) { i--; continue; }\n        int take = min(cnt[i], repeatLimit);\n        out.append((size_t) take, (char) ('a' + i));\n        cnt[i] -= take;\n        if (cnt[i] == 0) { i--; continue; }\n        int j = i - 1;\n        while (j >= 0 && cnt[j] == 0) j--;\n        if (j < 0) break;\n        out += (char) ('a' + j);\n        cnt[j]--;\n    }\n    return out;\n}`,
        c: `char* repeatLimitedString(char* s, int repeatLimit) {\n    int cnt[26];\n    for (int k = 0; k < 26; k++) cnt[k] = 0;\n    int n = (int) strlen(s);\n    for (int k = 0; k < n; k++) cnt[s[k] - 'a']++;\n    char* out = (char*) malloc((size_t) n + 1);\n    int len = 0;\n    int i = 25;\n    while (i >= 0) {\n        if (cnt[i] == 0) { i--; continue; }\n        int take = cnt[i] < repeatLimit ? cnt[i] : repeatLimit;\n        for (int t = 0; t < take; t++) out[len++] = (char) ('a' + i);\n        cnt[i] -= take;\n        if (cnt[i] == 0) { i--; continue; }\n        int j = i - 1;\n        while (j >= 0 && cnt[j] == 0) j--;\n        if (j < 0) break;\n        out[len++] = (char) ('a' + j);\n        cnt[j]--;\n    }\n    out[len] = '\\0';\n    return out;\n}`,
        csharp: `public static string RepeatLimitedString(string s, int repeatLimit)\n{\n    var cnt = new int[26];\n    foreach (char c in s) cnt[c - 'a']++;\n    var sb = new System.Text.StringBuilder();\n    int i = 25;\n    while (i >= 0)\n    {\n        if (cnt[i] == 0) { i--; continue; }\n        int take = Math.Min(cnt[i], repeatLimit);\n        for (int t = 0; t < take; t++) sb.Append((char) ('a' + i));\n        cnt[i] -= take;\n        if (cnt[i] == 0) { i--; continue; }\n        int j = i - 1;\n        while (j >= 0 && cnt[j] == 0) j--;\n        if (j < 0) break;\n        sb.Append((char) ('a' + j));\n        cnt[j]--;\n    }\n    return sb.ToString();\n}`,
        go: `func repeatLimitedString(s string, repeatLimit int) string {\n\tvar cnt [26]int\n\tfor k := 0; k < len(s); k++ {\n\t\tcnt[s[k]-'a']++\n\t}\n\tout := []byte{}\n\ti := 25\n\tfor i >= 0 {\n\t\tif cnt[i] == 0 {\n\t\t\ti--\n\t\t\tcontinue\n\t\t}\n\t\ttake := cnt[i]\n\t\tif repeatLimit < take {\n\t\t\ttake = repeatLimit\n\t\t}\n\t\tfor t := 0; t < take; t++ {\n\t\t\tout = append(out, byte('a'+i))\n\t\t}\n\t\tcnt[i] -= take\n\t\tif cnt[i] == 0 {\n\t\t\ti--\n\t\t\tcontinue\n\t\t}\n\t\tj := i - 1\n\t\tfor j >= 0 && cnt[j] == 0 {\n\t\t\tj--\n\t\t}\n\t\tif j < 0 {\n\t\t\tbreak\n\t\t}\n\t\tout = append(out, byte('a'+j))\n\t\tcnt[j]--\n\t}\n\treturn string(out)\n}`,
        kotlin: `fun repeatLimitedString(s: String, repeatLimit: Int): String {\n    val cnt = IntArray(26)\n    for (c in s) cnt[c - 'a']++\n    val sb = StringBuilder()\n    var i = 25\n    while (i >= 0) {\n        if (cnt[i] == 0) {\n            i--\n            continue\n        }\n        val take = minOf(cnt[i], repeatLimit)\n        repeat(take) { sb.append('a' + i) }\n        cnt[i] -= take\n        if (cnt[i] == 0) {\n            i--\n            continue\n        }\n        var j = i - 1\n        while (j >= 0 && cnt[j] == 0) j--\n        if (j < 0) break\n        sb.append('a' + j)\n        cnt[j]--\n    }\n    return sb.toString()\n}`,
        swift: `func repeatLimitedString(_ s: String, _ repeatLimit: Int) -> String {\n    var cnt = [Int](repeating: 0, count: 26)\n    let base = Int(Character("a").asciiValue!)\n    for c in s.unicodeScalars { cnt[Int(c.value) - base] += 1 }\n    let letters = Array("abcdefghijklmnopqrstuvwxyz")\n    var out = ""\n    var i = 25\n    while i >= 0 {\n        if cnt[i] == 0 {\n            i -= 1\n            continue\n        }\n        let take = min(cnt[i], repeatLimit)\n        for _ in 0..<take { out.append(letters[i]) }\n        cnt[i] -= take\n        if cnt[i] == 0 {\n            i -= 1\n            continue\n        }\n        var j = i - 1\n        while j >= 0 && cnt[j] == 0 { j -= 1 }\n        if j < 0 { break }\n        out.append(letters[j])\n        cnt[j] -= 1\n    }\n    return out\n}`,
        rust: `fn repeatLimitedString(s: String, repeatLimit: i32) -> String {\n    let mut cnt = [0i32; 26];\n    for b in s.bytes() {\n        cnt[(b - b'a') as usize] += 1;\n    }\n    let mut out = String::new();\n    let mut i: i32 = 25;\n    while i >= 0 {\n        let iu = i as usize;\n        if cnt[iu] == 0 {\n            i -= 1;\n            continue;\n        }\n        let take = cnt[iu].min(repeatLimit);\n        for _ in 0..take {\n            out.push((b'a' + i as u8) as char);\n        }\n        cnt[iu] -= take;\n        if cnt[iu] == 0 {\n            i -= 1;\n            continue;\n        }\n        let mut j = i - 1;\n        while j >= 0 && cnt[j as usize] == 0 {\n            j -= 1;\n        }\n        if j < 0 {\n            break;\n        }\n        out.push((b'a' + j as u8) as char);\n        cnt[j as usize] -= 1;\n    }\n    out\n}`,
        php: `function repeatLimitedString($s, $repeatLimit) {\n    $cnt = array_fill(0, 26, 0);\n    for ($k = 0; $k < strlen($s); $k++) $cnt[ord($s[$k]) - 97]++;\n    $out = "";\n    $i = 25;\n    while ($i >= 0) {\n        if ($cnt[$i] === 0) { $i--; continue; }\n        $take = min($cnt[$i], $repeatLimit);\n        $out .= str_repeat(chr(97 + $i), $take);\n        $cnt[$i] -= $take;\n        if ($cnt[$i] === 0) { $i--; continue; }\n        $j = $i - 1;\n        while ($j >= 0 && $cnt[$j] === 0) $j--;\n        if ($j < 0) break;\n        $out .= chr(97 + $j);\n        $cnt[$j]--;\n    }\n    return $out;\n}`,
        ruby: `def repeatLimitedString(s, repeatLimit)\n  cnt = Array.new(26, 0)\n  s.each_char { |c| cnt[c.ord - 97] += 1 }\n  out = ""\n  i = 25\n  while i >= 0\n    if cnt[i] == 0\n      i -= 1\n      next\n    end\n    take = [cnt[i], repeatLimit].min\n    out += (97 + i).chr * take\n    cnt[i] -= take\n    if cnt[i] == 0\n      i -= 1\n      next\n    end\n    j = i - 1\n    j -= 1 while j >= 0 && cnt[j] == 0\n    break if j < 0\n    out += (97 + j).chr\n    cnt[j] -= 1\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Count Number of Homogenous Substrings (LC 1759) ─────────────
  (() => {
    const MOD = 1000000007;
    const ref = (s: string) => {
      let total = 0, run = 0;
      for (let i = 0; i < s.length; i++) {
        run = i > 0 && s.charAt(i) === s.charAt(i - 1) ? run + 1 : 1;
        total = (total + run) % MOD;
      }
      return total;
    };
    return {
      slug: "count-number-of-homogenous-substrings",
      title: "Count Number of Homogenous Substrings",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "String", "Amazon", "Google", "Oracle"],
      signature: { funcName: "countHomogenous", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A string is **homogenous** when all of its characters are the same.\n\nReturn the number of homogenous substrings of `s`, **modulo 10⁹ + 7**.",
        [
          { in: 's = "codekairo"', out: "9", note: "No two adjacent characters match, so only the nine single characters qualify." },
          { in: 's = "abbcccaa"', out: "13", note: "1 + 3 + 6 + 3 — each run of length `L` contributes `L(L+1)/2`." },
          { in: 's = "zzzzz"', out: "15" },
        ],
        ["1 <= s.length <= 10^5", "s consists of lowercase letters."]),
      hints: [
        "Every homogenous substring lies inside a maximal run of one repeated character.",
        "A run of length `L` contains `L * (L + 1) / 2` substrings.",
        "Equivalently, sweep once and add the current run length at every position.",
      ],
      editorial: explain({
        idea: "Count substrings by their **right endpoint**. At position `i`, the number of homogenous substrings ending there equals the length of the run of equal characters ending at `i`. Sum those, modulo 10⁹ + 7.",
        steps: [
          "Keep `run`, reset to 1 whenever the character differs from the previous one, incremented otherwise.",
          "Add `run` to a running total at every position, taking the modulo.",
        ],
        why: "Counting by right endpoint turns the run formula `L(L+1)/2` into a single accumulation — you never have to find the run boundaries or multiply anything, and the total never exceeds the modulus between steps. The formula version is equivalent, but needs 64-bit arithmetic for `L(L+1)/2` before the modulo when `L` is large.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The result must be taken modulo 10⁹ + 7 — the raw count overflows 32 bits at the upper bound.",
          "`run` resets to 1, not 0, on a change of character.",
          "Single characters are homogenous substrings and must be counted.",
        ],
      }),
      examples: [
        { input: '"codekairo"', expectedOutput: "9" },
        { input: '"abbcccaa"', expectedOutput: "13" },
        { input: '"zzzzz"', expectedOutput: "15" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abc";
        const n = ri(rng, 1, 20);
        let s = "";
        let c = alphabet.charAt(ri(rng, 0, 2));
        for (let i = 0; i < n; i++) {
          if (rng() < 0.4) c = alphabet.charAt(ri(rng, 0, 2));
          s += c;
        }
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def countHomogenous(s: str) -> int:\n    MOD = 10**9 + 7\n    total = 0\n    run = 0\n    for i, c in enumerate(s):\n        run = run + 1 if i > 0 and c == s[i - 1] else 1\n        total = (total + run) % MOD\n    return total`,
        javascript: `var countHomogenous = function(s) {\n    var MOD = 1000000007;\n    var total = 0, run = 0;\n    for (var i = 0; i < s.length; i++) {\n        run = i > 0 && s.charAt(i) === s.charAt(i - 1) ? run + 1 : 1;\n        total = (total + run) % MOD;\n    }\n    return total;\n};`,
        typescript: `function countHomogenous(s: string): number {\n    var MOD = 1000000007;\n    var total = 0, run = 0;\n    for (var i = 0; i < s.length; i++) {\n        run = i > 0 && s.charAt(i) === s.charAt(i - 1) ? run + 1 : 1;\n        total = (total + run) % MOD;\n    }\n    return total;\n}`,
        java: `public static int countHomogenous(String s) {\n    final long MOD = 1000000007L;\n    long total = 0;\n    long run = 0;\n    for (int i = 0; i < s.length(); i++) {\n        run = (i > 0 && s.charAt(i) == s.charAt(i - 1)) ? run + 1 : 1;\n        total = (total + run) % MOD;\n    }\n    return (int) total;\n}`,
        cpp: `int countHomogenous(string s) {\n    const long long MOD = 1000000007LL;\n    long long total = 0, run = 0;\n    for (size_t i = 0; i < s.size(); i++) {\n        run = (i > 0 && s[i] == s[i - 1]) ? run + 1 : 1;\n        total = (total + run) % MOD;\n    }\n    return (int) total;\n}`,
        c: `int countHomogenous(char* s) {\n    const long long MOD = 1000000007LL;\n    long long total = 0, run = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        run = (i > 0 && s[i] == s[i - 1]) ? run + 1 : 1;\n        total = (total + run) % MOD;\n    }\n    return (int) total;\n}`,
        csharp: `public static int CountHomogenous(string s)\n{\n    const long MOD = 1000000007L;\n    long total = 0, run = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        run = (i > 0 && s[i] == s[i - 1]) ? run + 1 : 1;\n        total = (total + run) % MOD;\n    }\n    return (int) total;\n}`,
        go: `func countHomogenous(s string) int {\n\tconst MOD = 1000000007\n\ttotal, run := 0, 0\n\tfor i := 0; i < len(s); i++ {\n\t\tif i > 0 && s[i] == s[i-1] {\n\t\t\trun++\n\t\t} else {\n\t\t\trun = 1\n\t\t}\n\t\ttotal = (total + run) % MOD\n\t}\n\treturn total\n}`,
        kotlin: `fun countHomogenous(s: String): Int {\n    val mod = 1000000007L\n    var total = 0L\n    var run = 0L\n    for (i in s.indices) {\n        run = if (i > 0 && s[i] == s[i - 1]) run + 1 else 1\n        total = (total + run) % mod\n    }\n    return total.toInt()\n}`,
        swift: `func countHomogenous(_ s: String) -> Int {\n    let mod = 1000000007\n    let chars = Array(s)\n    var total = 0\n    var run = 0\n    for i in 0..<chars.count {\n        run = (i > 0 && chars[i] == chars[i - 1]) ? run + 1 : 1\n        total = (total + run) % mod\n    }\n    return total\n}`,
        rust: `fn countHomogenous(s: String) -> i32 {\n    const MOD: i64 = 1000000007;\n    let b = s.as_bytes();\n    let mut total: i64 = 0;\n    let mut run: i64 = 0;\n    for i in 0..b.len() {\n        run = if i > 0 && b[i] == b[i - 1] { run + 1 } else { 1 };\n        total = (total + run) % MOD;\n    }\n    total as i32\n}`,
        php: `function countHomogenous($s) {\n    $MOD = 1000000007;\n    $total = 0;\n    $run = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        $run = ($i > 0 && $s[$i] === $s[$i - 1]) ? $run + 1 : 1;\n        $total = ($total + $run) % $MOD;\n    }\n    return $total;\n}`,
        ruby: `def countHomogenous(s)\n  mod = 1000000007\n  total = 0\n  run = 0\n  s.each_char.with_index do |c, i|\n    run = (i > 0 && c == s[i - 1]) ? run + 1 : 1\n    total = (total + run) % mod\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Delete Characters to Make Fancy String (LC 1957) ────────────
  (() => {
    const ref = (s: string) => {
      let out = "";
      for (let i = 0; i < s.length; i++) {
        const n = out.length;
        if (n >= 2 && out.charAt(n - 1) === s.charAt(i) && out.charAt(n - 2) === s.charAt(i)) continue;
        out += s.charAt(i);
      }
      return out;
    };
    return {
      slug: "delete-characters-to-make-fancy-string",
      title: "Delete Characters to Make Fancy String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Amazon", "Google", "TCS"],
      signature: { funcName: "makeFancyString", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A string is **fancy** if no three **consecutive** characters are equal.\n\nDelete the minimum number of characters from `s` to make it fancy and return the result. The answer is unique.",
        [
          { in: 's = "cooodekairo"', out: "coodekairo", note: "One `o` is dropped from the run of three." },
          { in: 's = "aaabaaaa"', out: "aabaa", note: "Each run longer than two is trimmed to two." },
          { in: 's = "aab"', out: "aab", note: "Already fancy." },
        ],
        ["1 <= s.length <= 10^5", "s consists only of lowercase English letters."]),
      hints: [
        "Build the answer left to right and only look at the last two characters you kept.",
        "Skip the incoming character if those two already equal it.",
        "Equivalently, keep the first two characters of every run and drop the rest.",
      ],
      editorial: explain({
        idea: "Build the result greedily: append each character unless the last two already appended are equal to it. That keeps exactly the first two characters of every run.",
        steps: [
          "Start with an empty output.",
          "For each character of `s`, skip it if the output's last two characters both equal it.",
          "Otherwise append it.",
        ],
        why: "Deleting from the end of a run rather than the start costs the same and keeps the check local — only the last two kept characters ever matter, so no lookahead or run-boundary bookkeeping is needed. The answer is unique because within a run every character is identical, so *which* copies are removed is irrelevant; only how many.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Compare against the **output** being built, not against the original string — deletions shift the context.",
          "Runs of exactly two are legal and must be kept intact.",
          "Deleting the whole run is wrong; two copies survive.",
        ],
      }),
      examples: [
        { input: '"cooodekairo"', expectedOutput: "coodekairo" },
        { input: '"aaabaaaa"', expectedOutput: "aabaa" },
        { input: '"aab"', expectedOutput: "aab" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abc";
        const n = ri(rng, 1, 20);
        let s = "";
        let c = alphabet.charAt(ri(rng, 0, 2));
        for (let i = 0; i < n; i++) {
          if (rng() < 0.35) c = alphabet.charAt(ri(rng, 0, 2));
          s += c;
        }
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def makeFancyString(s: str) -> str:\n    out = []\n    for c in s:\n        if len(out) >= 2 and out[-1] == c and out[-2] == c:\n            continue\n        out.append(c)\n    return "".join(out)`,
        javascript: `var makeFancyString = function(s) {\n    var out = "";\n    for (var i = 0; i < s.length; i++) {\n        var n = out.length;\n        var c = s.charAt(i);\n        if (n >= 2 && out.charAt(n - 1) === c && out.charAt(n - 2) === c) continue;\n        out += c;\n    }\n    return out;\n};`,
        typescript: `function makeFancyString(s: string): string {\n    var out = "";\n    for (var i = 0; i < s.length; i++) {\n        var n = out.length;\n        var c = s.charAt(i);\n        if (n >= 2 && out.charAt(n - 1) === c && out.charAt(n - 2) === c) continue;\n        out += c;\n    }\n    return out;\n}`,
        java: `public static String makeFancyString(String s) {\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        int n = sb.length();\n        if (n >= 2 && sb.charAt(n - 1) == c && sb.charAt(n - 2) == c) continue;\n        sb.append(c);\n    }\n    return sb.toString();\n}`,
        cpp: `string makeFancyString(string s) {\n    string out;\n    for (char c : s) {\n        size_t n = out.size();\n        if (n >= 2 && out[n - 1] == c && out[n - 2] == c) continue;\n        out += c;\n    }\n    return out;\n}`,
        c: `char* makeFancyString(char* s) {\n    int n = (int) strlen(s);\n    char* out = (char*) malloc((size_t) n + 1);\n    int len = 0;\n    for (int i = 0; i < n; i++) {\n        if (len >= 2 && out[len - 1] == s[i] && out[len - 2] == s[i]) continue;\n        out[len++] = s[i];\n    }\n    out[len] = '\\0';\n    return out;\n}`,
        csharp: `public static string MakeFancyString(string s)\n{\n    var sb = new System.Text.StringBuilder();\n    foreach (char c in s)\n    {\n        int n = sb.Length;\n        if (n >= 2 && sb[n - 1] == c && sb[n - 2] == c) continue;\n        sb.Append(c);\n    }\n    return sb.ToString();\n}`,
        go: `func makeFancyString(s string) string {\n\tout := []byte{}\n\tfor i := 0; i < len(s); i++ {\n\t\tn := len(out)\n\t\tif n >= 2 && out[n-1] == s[i] && out[n-2] == s[i] {\n\t\t\tcontinue\n\t\t}\n\t\tout = append(out, s[i])\n\t}\n\treturn string(out)\n}`,
        kotlin: `fun makeFancyString(s: String): String {\n    val sb = StringBuilder()\n    for (c in s) {\n        val n = sb.length\n        if (n >= 2 && sb[n - 1] == c && sb[n - 2] == c) continue\n        sb.append(c)\n    }\n    return sb.toString()\n}`,
        swift: `func makeFancyString(_ s: String) -> String {\n    var out = [Character]()\n    for c in s {\n        let n = out.count\n        if n >= 2 && out[n - 1] == c && out[n - 2] == c { continue }\n        out.append(c)\n    }\n    return String(out)\n}`,
        rust: `fn makeFancyString(s: String) -> String {\n    let mut out: Vec<char> = Vec::new();\n    for c in s.chars() {\n        let n = out.len();\n        if n >= 2 && out[n - 1] == c && out[n - 2] == c {\n            continue;\n        }\n        out.push(c);\n    }\n    out.into_iter().collect()\n}`,
        php: `function makeFancyString($s) {\n    $out = "";\n    for ($i = 0; $i < strlen($s); $i++) {\n        $n = strlen($out);\n        if ($n >= 2 && $out[$n - 1] === $s[$i] && $out[$n - 2] === $s[$i]) continue;\n        $out .= $s[$i];\n    }\n    return $out;\n}`,
        ruby: `def makeFancyString(s)\n  out = []\n  s.each_char do |c|\n    n = out.length\n    next if n >= 2 && out[n - 1] == c && out[n - 2] == c\n    out << c\n  end\n  out.join\nend`,
      },
    };
  })(),

  // ── String Compression II (LC 1531) ─────────────────────────────
  (() => {
    const encLen = (cnt: number) => (cnt === 1 ? 1 : cnt < 10 ? 2 : cnt < 100 ? 3 : 4);
    const ref = (s: string, k: number) => {
      const n = s.length;
      const INF = 1000000000;
      const dp: number[][] = [];
      for (let i = 0; i <= n; i++) dp.push(new Array(k + 1).fill(0));
      for (let i = n - 1; i >= 0; i--) {
        for (let j = 0; j <= k; j++) {
          let best = j > 0 ? dp[i + 1][j - 1] : INF;
          let cnt = 0, del = 0;
          for (let m = i; m < n; m++) {
            if (s.charAt(m) === s.charAt(i)) cnt++;
            else { del++; if (del > j) break; }
            const cand = encLen(cnt) + dp[m + 1][j - del];
            if (cand < best) best = cand;
          }
          dp[i][j] = best;
        }
      }
      return dp[0][k];
    };
    return {
      slug: "string-compression-ii",
      title: "String Compression II",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "getLengthOfOptimalCompression", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "**Run-length encoding** rewrites a string by replacing each maximal run of one repeated character with that character followed by its count — the count is omitted when the run has length 1. So `\"aabccc\"` encodes as `\"a2bc3\"`, which is 5 characters long.\n\nDelete **at most `k`** characters from `s` and return the minimum possible length of the run-length encoding of what remains.",
        [
          { in: 's = "aaabcccd", k = 2', out: "4", note: "Delete `b` and `d` to leave `aaaccc`, encoded as `a3c3`." },
          { in: 's = "aabbaa", k = 2', out: "2", note: "Delete both `b`s to leave `aaaa`, encoded as `a4`." },
          { in: 's = "aaaaaaaaaaa", k = 0', out: "3", note: "Eleven `a`s encode as `a11` — the count itself costs two characters." },
        ],
        ["1 <= s.length <= 100", "0 <= k <= s.length", "s contains only lowercase English letters."]),
      hints: [
        "The cost of a run is not its length — it is 1, 2, 3 or 4 characters depending on whether the count is 1, under 10, under 100, or more.",
        "Think of building the answer left to right, deciding for each position either to delete it or to start a new run there.",
        "State: `dp[i][j]` = the best encoding of `s[i..]` with `j` deletions still available.",
      ],
      editorial: explain({
        idea: "Define `dp[i][j]` as the minimum encoded length of the suffix starting at `i` using at most `j` deletions. From position `i` you either delete `s[i]`, or you commit to a run of `s[i]`: scan right, keeping every character equal to `s[i]` and deleting every other one, and at each point charge the run's encoded cost plus the best answer for the rest.",
        steps: [
          "Set `dp[n][j] = 0` for every `j`.",
          "Work `i` from `n - 1` down to 0 and `j` from 0 to `k`.",
          "Option A: if `j > 0`, delete `s[i]` for `dp[i+1][j-1]`.",
          "Option B: extend `m` from `i` rightwards, counting matches of `s[i]` in `cnt` and mismatches (deleted) in `del`; stop when `del > j`. Charge `encLen(cnt) + dp[m+1][j-del]`.",
          "`encLen(c)` is 1 for `c = 1`, 2 for `c < 10`, 3 for `c < 100`, else 4.",
          "Return `dp[0][k]`.",
        ],
        why: "The whole difficulty is that the cost of a run is **not linear** in its length — merging two runs of `a` by deleting a `b` between them may save nothing, or may save two characters if it pushes the count past 9. That rules out any greedy rule, and it is why the state has to fix the *start* of a run and enumerate where it ends: only then is the run's count, and therefore its cost, known. Deleting every non-matching character inside the scanned window is optimal for that choice, since a survivor would split the run and cost strictly more.",
        time: "O(n² · k)",
        space: "O(n · k)",
        pitfalls: [
          "A run of length 1 encodes as a single character — no count is written.",
          "The digit-count thresholds (10 and 100) are what make greedy approaches fail.",
          "Deletions are capped at `k` in total across the whole string, not per run.",
        ],
      }),
      examples: [
        { input: '"aaabcccd"\n2', expectedOutput: "4" },
        { input: '"aabbaa"\n2', expectedOutput: "2" },
        { input: '"aaaaaaaaaaa"\n0', expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abc";
        const n = ri(rng, 1, 16);
        let s = "";
        let c = alphabet.charAt(ri(rng, 0, 2));
        for (let i = 0; i < n; i++) {
          if (rng() < 0.4) c = alphabet.charAt(ri(rng, 0, 2));
          s += c;
        }
        const k = ri(rng, 0, n);
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: `def getLengthOfOptimalCompression(s: str, k: int) -> int:\n    n = len(s)\n    INF = 10**9\n\n    def enc(cnt: int) -> int:\n        if cnt == 1:\n            return 1\n        if cnt < 10:\n            return 2\n        if cnt < 100:\n            return 3\n        return 4\n\n    dp = [[0] * (k + 1) for _ in range(n + 1)]\n    for i in range(n - 1, -1, -1):\n        for j in range(k + 1):\n            best = dp[i + 1][j - 1] if j > 0 else INF\n            cnt = 0\n            dele = 0\n            for m in range(i, n):\n                if s[m] == s[i]:\n                    cnt += 1\n                else:\n                    dele += 1\n                    if dele > j:\n                        break\n                best = min(best, enc(cnt) + dp[m + 1][j - dele])\n            dp[i][j] = best\n    return dp[0][k]`,
        javascript: `var getLengthOfOptimalCompression = function(s, k) {\n    var n = s.length, INF = 1000000000, i, j;\n    var enc = function(cnt) {\n        if (cnt === 1) return 1;\n        if (cnt < 10) return 2;\n        if (cnt < 100) return 3;\n        return 4;\n    };\n    var dp = [];\n    for (i = 0; i <= n; i++) {\n        var row = [];\n        for (j = 0; j <= k; j++) row.push(0);\n        dp.push(row);\n    }\n    for (i = n - 1; i >= 0; i--) {\n        for (j = 0; j <= k; j++) {\n            var best = j > 0 ? dp[i + 1][j - 1] : INF;\n            var cnt = 0, del = 0;\n            for (var m = i; m < n; m++) {\n                if (s.charAt(m) === s.charAt(i)) cnt++;\n                else { del++; if (del > j) break; }\n                var cand = enc(cnt) + dp[m + 1][j - del];\n                if (cand < best) best = cand;\n            }\n            dp[i][j] = best;\n        }\n    }\n    return dp[0][k];\n};`,
        typescript: `function getLengthOfOptimalCompression(s: string, k: number): number {\n    var n = s.length, INF = 1000000000, i: number, j: number;\n    var enc = function(cnt: number): number {\n        if (cnt === 1) return 1;\n        if (cnt < 10) return 2;\n        if (cnt < 100) return 3;\n        return 4;\n    };\n    var dp: number[][] = [];\n    for (i = 0; i <= n; i++) {\n        var row: number[] = [];\n        for (j = 0; j <= k; j++) row.push(0);\n        dp.push(row);\n    }\n    for (i = n - 1; i >= 0; i--) {\n        for (j = 0; j <= k; j++) {\n            var best = j > 0 ? dp[i + 1][j - 1] : INF;\n            var cnt = 0, del = 0;\n            for (var m = i; m < n; m++) {\n                if (s.charAt(m) === s.charAt(i)) cnt++;\n                else { del++; if (del > j) break; }\n                var cand = enc(cnt) + dp[m + 1][j - del];\n                if (cand < best) best = cand;\n            }\n            dp[i][j] = best;\n        }\n    }\n    return dp[0][k];\n}`,
        java: `public static int getLengthOfOptimalCompression(String s, int k) {\n    int n = s.length();\n    final int INF = 1000000000;\n    int[][] dp = new int[n + 1][k + 1];\n    for (int i = n - 1; i >= 0; i--) {\n        for (int j = 0; j <= k; j++) {\n            int best = j > 0 ? dp[i + 1][j - 1] : INF;\n            int cnt = 0, del = 0;\n            for (int m = i; m < n; m++) {\n                if (s.charAt(m) == s.charAt(i)) cnt++;\n                else {\n                    del++;\n                    if (del > j) break;\n                }\n                int len = cnt == 1 ? 1 : cnt < 10 ? 2 : cnt < 100 ? 3 : 4;\n                best = Math.min(best, len + dp[m + 1][j - del]);\n            }\n            dp[i][j] = best;\n        }\n    }\n    return dp[0][k];\n}`,
        cpp: `int getLengthOfOptimalCompression(string s, int k) {\n    int n = (int) s.size();\n    const int INF = 1000000000;\n    vector<vector<int>> dp(n + 1, vector<int>(k + 1, 0));\n    for (int i = n - 1; i >= 0; i--) {\n        for (int j = 0; j <= k; j++) {\n            int best = j > 0 ? dp[i + 1][j - 1] : INF;\n            int cnt = 0, del = 0;\n            for (int m = i; m < n; m++) {\n                if (s[m] == s[i]) cnt++;\n                else {\n                    del++;\n                    if (del > j) break;\n                }\n                int len = cnt == 1 ? 1 : cnt < 10 ? 2 : cnt < 100 ? 3 : 4;\n                best = min(best, len + dp[m + 1][j - del]);\n            }\n            dp[i][j] = best;\n        }\n    }\n    return dp[0][k];\n}`,
        c: `int getLengthOfOptimalCompression(char* s, int k) {\n    int n = (int) strlen(s);\n    const int INF = 1000000000;\n    int width = k + 1;\n    int* dp = (int*) calloc((size_t) (n + 1) * (size_t) width, sizeof(int));\n    for (int i = n - 1; i >= 0; i--) {\n        for (int j = 0; j <= k; j++) {\n            int best = j > 0 ? dp[(i + 1) * width + (j - 1)] : INF;\n            int cnt = 0, del = 0;\n            for (int m = i; m < n; m++) {\n                if (s[m] == s[i]) cnt++;\n                else {\n                    del++;\n                    if (del > j) break;\n                }\n                int len = cnt == 1 ? 1 : (cnt < 10 ? 2 : (cnt < 100 ? 3 : 4));\n                int cand = len + dp[(m + 1) * width + (j - del)];\n                if (cand < best) best = cand;\n            }\n            dp[i * width + j] = best;\n        }\n    }\n    int answer = dp[0 * width + k];\n    free(dp);\n    return answer;\n}`,
        csharp: `public static int GetLengthOfOptimalCompression(string s, int k)\n{\n    int n = s.Length;\n    const int INF = 1000000000;\n    var dp = new int[n + 1, k + 1];\n    for (int i = n - 1; i >= 0; i--)\n    {\n        for (int j = 0; j <= k; j++)\n        {\n            int best = j > 0 ? dp[i + 1, j - 1] : INF;\n            int cnt = 0, del = 0;\n            for (int m = i; m < n; m++)\n            {\n                if (s[m] == s[i]) cnt++;\n                else\n                {\n                    del++;\n                    if (del > j) break;\n                }\n                int len = cnt == 1 ? 1 : cnt < 10 ? 2 : cnt < 100 ? 3 : 4;\n                best = Math.Min(best, len + dp[m + 1, j - del]);\n            }\n            dp[i, j] = best;\n        }\n    }\n    return dp[0, k];\n}`,
        go: `func getLengthOfOptimalCompression(s string, k int) int {\n\tn := len(s)\n\tconst INF = 1000000000\n\tdp := make([][]int, n+1)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, k+1)\n\t}\n\tfor i := n - 1; i >= 0; i-- {\n\t\tfor j := 0; j <= k; j++ {\n\t\t\tbest := INF\n\t\t\tif j > 0 {\n\t\t\t\tbest = dp[i+1][j-1]\n\t\t\t}\n\t\t\tcnt, del := 0, 0\n\t\t\tfor m := i; m < n; m++ {\n\t\t\t\tif s[m] == s[i] {\n\t\t\t\t\tcnt++\n\t\t\t\t} else {\n\t\t\t\t\tdel++\n\t\t\t\t\tif del > j {\n\t\t\t\t\t\tbreak\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tlength := 4\n\t\t\t\tif cnt == 1 {\n\t\t\t\t\tlength = 1\n\t\t\t\t} else if cnt < 10 {\n\t\t\t\t\tlength = 2\n\t\t\t\t} else if cnt < 100 {\n\t\t\t\t\tlength = 3\n\t\t\t\t}\n\t\t\t\tif cand := length + dp[m+1][j-del]; cand < best {\n\t\t\t\t\tbest = cand\n\t\t\t\t}\n\t\t\t}\n\t\t\tdp[i][j] = best\n\t\t}\n\t}\n\treturn dp[0][k]\n}`,
        kotlin: `fun getLengthOfOptimalCompression(s: String, k: Int): Int {\n    val n = s.length\n    val INF = 1000000000\n    val dp = Array(n + 1) { IntArray(k + 1) }\n    for (i in n - 1 downTo 0) {\n        for (j in 0..k) {\n            var best = if (j > 0) dp[i + 1][j - 1] else INF\n            var cnt = 0\n            var del = 0\n            for (m in i until n) {\n                if (s[m] == s[i]) cnt++\n                else {\n                    del++\n                    if (del > j) break\n                }\n                val len = if (cnt == 1) 1 else if (cnt < 10) 2 else if (cnt < 100) 3 else 4\n                best = minOf(best, len + dp[m + 1][j - del])\n            }\n            dp[i][j] = best\n        }\n    }\n    return dp[0][k]\n}`,
        swift: `func getLengthOfOptimalCompression(_ s: String, _ k: Int) -> Int {\n    let chars = Array(s)\n    let n = chars.count\n    let INF = 1000000000\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: k + 1), count: n + 1)\n    for i in stride(from: n - 1, through: 0, by: -1) {\n        for j in 0...k {\n            var best = j > 0 ? dp[i + 1][j - 1] : INF\n            var cnt = 0\n            var del = 0\n            var m = i\n            while m < n {\n                if chars[m] == chars[i] {\n                    cnt += 1\n                } else {\n                    del += 1\n                    if del > j { break }\n                }\n                let len = cnt == 1 ? 1 : (cnt < 10 ? 2 : (cnt < 100 ? 3 : 4))\n                best = min(best, len + dp[m + 1][j - del])\n                m += 1\n            }\n            dp[i][j] = best\n        }\n    }\n    return dp[0][k]\n}`,
        rust: `fn getLengthOfOptimalCompression(s: String, k: i32) -> i32 {\n    let chars: Vec<char> = s.chars().collect();\n    let n = chars.len();\n    let k = k as usize;\n    const INF: i32 = 1000000000;\n    let mut dp = vec![vec![0i32; k + 1]; n + 1];\n    for i in (0..n).rev() {\n        for j in 0..=k {\n            let mut best = if j > 0 { dp[i + 1][j - 1] } else { INF };\n            let mut cnt = 0i32;\n            let mut del = 0usize;\n            for m in i..n {\n                if chars[m] == chars[i] {\n                    cnt += 1;\n                } else {\n                    del += 1;\n                    if del > j {\n                        break;\n                    }\n                }\n                let len = if cnt == 1 { 1 } else if cnt < 10 { 2 } else if cnt < 100 { 3 } else { 4 };\n                let cand = len + dp[m + 1][j - del];\n                if cand < best {\n                    best = cand;\n                }\n            }\n            dp[i][j] = best;\n        }\n    }\n    dp[0][k]\n}`,
        php: `function getLengthOfOptimalCompression($s, $k) {\n    $n = strlen($s);\n    $INF = 1000000000;\n    $dp = [];\n    for ($i = 0; $i <= $n; $i++) $dp[$i] = array_fill(0, $k + 1, 0);\n    for ($i = $n - 1; $i >= 0; $i--) {\n        for ($j = 0; $j <= $k; $j++) {\n            $best = $j > 0 ? $dp[$i + 1][$j - 1] : $INF;\n            $cnt = 0;\n            $del = 0;\n            for ($m = $i; $m < $n; $m++) {\n                if ($s[$m] === $s[$i]) $cnt++;\n                else {\n                    $del++;\n                    if ($del > $j) break;\n                }\n                $len = $cnt === 1 ? 1 : ($cnt < 10 ? 2 : ($cnt < 100 ? 3 : 4));\n                $cand = $len + $dp[$m + 1][$j - $del];\n                if ($cand < $best) $best = $cand;\n            }\n            $dp[$i][$j] = $best;\n        }\n    }\n    return $dp[0][$k];\n}`,
        ruby: `def getLengthOfOptimalCompression(s, k)\n  n = s.length\n  inf = 1000000000\n  dp = Array.new(n + 1) { Array.new(k + 1, 0) }\n  (n - 1).downto(0) do |i|\n    (0..k).each do |j|\n      best = j > 0 ? dp[i + 1][j - 1] : inf\n      cnt = 0\n      del = 0\n      (i...n).each do |m|\n        if s[m] == s[i]\n          cnt += 1\n        else\n          del += 1\n          break if del > j\n        end\n        len = cnt == 1 ? 1 : (cnt < 10 ? 2 : (cnt < 100 ? 3 : 4))\n        cand = len + dp[m + 1][j - del]\n        best = cand if cand < best\n      end\n      dp[i][j] = best\n    end\n  end\n  dp[0][k]\nend`,
      },
    };
  })(),

  // ── Count Anagrams (LC 2514) ────────────────────────────────────
  (() => {
    const MOD = 1000000007;
    const mulmod = (a: number, b: number) => {
      // Splitting `a` keeps every partial product under 2^53.
      const ah = Math.floor(a / 65536), al = a % 65536;
      return ((ah * b % MOD) * 65536 + al * b) % MOD;
    };
    const powmod = (base: number, exp: number) => {
      let result = 1, b = base % MOD, e = exp;
      while (e > 0) {
        if (e % 2 === 1) result = mulmod(result, b);
        b = mulmod(b, b);
        e = Math.floor(e / 2);
      }
      return result;
    };
    const ref = (s: string) => {
      const n = s.length;
      const fact = new Array(n + 1).fill(1);
      for (let i = 1; i <= n; i++) fact[i] = mulmod(fact[i - 1], i);
      const invFact = new Array(n + 1).fill(1);
      invFact[n] = powmod(fact[n], MOD - 2);
      for (let i = n; i >= 1; i--) invFact[i - 1] = mulmod(invFact[i], i);
      let answer = 1;
      const words = s.split(" ");
      for (let w = 0; w < words.length; w++) {
        const word = words[w];
        const cnt = new Array(26).fill(0);
        for (let i = 0; i < word.length; i++) cnt[word.charCodeAt(i) - 97]++;
        let ways = fact[word.length];
        for (let c = 0; c < 26; c++) if (cnt[c] > 1) ways = mulmod(ways, invFact[cnt[c]]);
        answer = mulmod(answer, ways);
      }
      return answer;
    };
    return {
      slug: "count-anagrams",
      title: "Count Anagrams",
      difficulty: "HARD" as const,
      tags: ["Hash Table", "Math", "String", "Combinatorics", "Counting", "Google", "Amazon", "Uber"],
      signature: { funcName: "countAnagrams", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "`s` is a list of words separated by single spaces. Another string `t` is an **anagram of `s`** if it has the same number of words and, for every position, its `i`-th word is a permutation of `s`'s `i`-th word.\n\nReturn the number of distinct anagrams of `s`, **modulo 10⁹ + 7**. `s` itself counts as one of them.",
        [
          { in: 's = "code kairo"', out: "2880", note: "`code` has 4! = 24 arrangements and `kairo` has 5! = 120; 24 × 120 = 2880." },
          { in: 's = "too hot"', out: "18", note: "`too` has only 3 distinct arrangements because the two `o`s are interchangeable; `hot` has 6." },
          { in: 's = "aa"', out: "1", note: "Both letters are the same, so there is one arrangement." },
        ],
        ["1 <= s.length <= 10^5", "s consists of lowercase English letters and spaces ' '.", "There is single space between consecutive words."]),
      hints: [
        "The words are independent, so multiply their counts together.",
        "A word of length `L` whose letters occur `c₁, c₂, …` times has `L! / (c₁! · c₂! · …)` distinct arrangements.",
        "Division under a modulus means multiplying by a modular inverse — precompute factorials and inverse factorials once.",
      ],
      editorial: explain({
        idea: "Each word contributes its multinomial coefficient `L! / ∏ cᵢ!`, and the words are independent so the answers multiply. Precompute factorials and inverse factorials up to `|s|` once, then each word is a linear scan plus at most 26 multiplications.",
        steps: [
          "Build `fact[0..n]` with `fact[i] = fact[i-1] · i mod p`.",
          "Compute `invFact[n]` once with Fermat's little theorem — `fact[n]^(p-2)` — then walk down with `invFact[i-1] = invFact[i] · i`.",
          "Split `s` on spaces. For each word, tally its letters and multiply `fact[L]` by `invFact[cᵢ]` for every letter.",
          "Multiply the per-word results together, modulo 10⁹ + 7.",
        ],
        why: "Two things make this efficient. First, deriving the whole inverse-factorial table from a **single** modular exponentiation — the identity `invFact[i-1] = invFact[i] · i` — turns O(n log p) into O(n + log p). Second, repeated letters are why the answer is not simply `L!`: swapping two identical letters produces the same string, so each group of `cᵢ` identical letters over-counts by exactly `cᵢ!`.",
        time: "O(n + log p)",
        space: "O(n)",
        pitfalls: [
          "Dividing by `∏ cᵢ!` modulo a prime requires a modular inverse; integer division is wrong.",
          "In a language with 64-bit integers, `a * b` for residues near 10⁹ overflows a double — use the split trick or 64-bit arithmetic.",
          "The factorial table must reach the length of the **longest word**, which can be all of `s`.",
        ],
      }),
      examples: [
        { input: '"code kairo"', expectedOutput: "2880" },
        { input: '"too hot"', expectedOutput: "18" },
        { input: '"aa"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcde";
        const words = ri(rng, 1, 3);
        const parts: string[] = [];
        for (let w = 0; w < words; w++) {
          const len = ri(rng, 1, 6);
          let word = "";
          for (let i = 0; i < len; i++) word += alphabet.charAt(ri(rng, 0, 4));
          parts.push(word);
        }
        const s = parts.join(" ");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def countAnagrams(s: str) -> int:\n    MOD = 10**9 + 7\n    n = len(s)\n    fact = [1] * (n + 1)\n    for i in range(1, n + 1):\n        fact[i] = fact[i - 1] * i % MOD\n    inv_fact = [1] * (n + 1)\n    inv_fact[n] = pow(fact[n], MOD - 2, MOD)\n    for i in range(n, 0, -1):\n        inv_fact[i - 1] = inv_fact[i] * i % MOD\n    answer = 1\n    for word in s.split(" "):\n        cnt = [0] * 26\n        for c in word:\n            cnt[ord(c) - 97] += 1\n        ways = fact[len(word)]\n        for c in cnt:\n            if c > 1:\n                ways = ways * inv_fact[c] % MOD\n        answer = answer * ways % MOD\n    return answer`,
        javascript: `var countAnagrams = function(s) {\n    var MOD = 1000000007;\n    var mulmod = function(a, b) {\n        var ah = Math.floor(a / 65536), al = a % 65536;\n        return ((ah * b % MOD) * 65536 + al * b) % MOD;\n    };\n    var powmod = function(base, exp) {\n        var result = 1, bb = base % MOD, e = exp;\n        while (e > 0) {\n            if (e % 2 === 1) result = mulmod(result, bb);\n            bb = mulmod(bb, bb);\n            e = Math.floor(e / 2);\n        }\n        return result;\n    };\n    var n = s.length, i;\n    var fact = [1];\n    for (i = 1; i <= n; i++) fact.push(mulmod(fact[i - 1], i));\n    var invFact = [];\n    for (i = 0; i <= n; i++) invFact.push(1);\n    invFact[n] = powmod(fact[n], MOD - 2);\n    for (i = n; i >= 1; i--) invFact[i - 1] = mulmod(invFact[i], i);\n    var answer = 1;\n    var words = s.split(" ");\n    for (var w = 0; w < words.length; w++) {\n        var word = words[w];\n        var cnt = [];\n        for (i = 0; i < 26; i++) cnt.push(0);\n        for (i = 0; i < word.length; i++) cnt[word.charCodeAt(i) - 97]++;\n        var ways = fact[word.length];\n        for (i = 0; i < 26; i++) {\n            if (cnt[i] > 1) ways = mulmod(ways, invFact[cnt[i]]);\n        }\n        answer = mulmod(answer, ways);\n    }\n    return answer;\n};`,
        typescript: `function countAnagrams(s: string): number {\n    var MOD = 1000000007;\n    var mulmod = function(a: number, b: number): number {\n        var ah = Math.floor(a / 65536), al = a % 65536;\n        return ((ah * b % MOD) * 65536 + al * b) % MOD;\n    };\n    var powmod = function(base: number, exp: number): number {\n        var result = 1, bb = base % MOD, e = exp;\n        while (e > 0) {\n            if (e % 2 === 1) result = mulmod(result, bb);\n            bb = mulmod(bb, bb);\n            e = Math.floor(e / 2);\n        }\n        return result;\n    };\n    var n = s.length, i: number;\n    var fact: number[] = [1];\n    for (i = 1; i <= n; i++) fact.push(mulmod(fact[i - 1], i));\n    var invFact: number[] = [];\n    for (i = 0; i <= n; i++) invFact.push(1);\n    invFact[n] = powmod(fact[n], MOD - 2);\n    for (i = n; i >= 1; i--) invFact[i - 1] = mulmod(invFact[i], i);\n    var answer = 1;\n    var words = s.split(" ");\n    for (var w = 0; w < words.length; w++) {\n        var word = words[w];\n        var cnt: number[] = [];\n        for (i = 0; i < 26; i++) cnt.push(0);\n        for (i = 0; i < word.length; i++) cnt[word.charCodeAt(i) - 97]++;\n        var ways = fact[word.length];\n        for (i = 0; i < 26; i++) {\n            if (cnt[i] > 1) ways = mulmod(ways, invFact[cnt[i]]);\n        }\n        answer = mulmod(answer, ways);\n    }\n    return answer;\n}`,
        java: `public static int countAnagrams(String s) {\n    final long MOD = 1000000007L;\n    int n = s.length();\n    long[] fact = new long[n + 1];\n    fact[0] = 1;\n    for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % MOD;\n    long[] invFact = new long[n + 1];\n    long base = fact[n], e = MOD - 2, cur = 1;\n    while (e > 0) {\n        if ((e & 1L) == 1L) cur = cur * base % MOD;\n        base = base * base % MOD;\n        e >>= 1;\n    }\n    invFact[n] = cur;\n    for (int i = n; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;\n    long answer = 1;\n    for (String word : s.split(" ")) {\n        int[] cnt = new int[26];\n        for (int i = 0; i < word.length(); i++) cnt[word.charAt(i) - 'a']++;\n        long ways = fact[word.length()];\n        for (int c : cnt) {\n            if (c > 1) ways = ways * invFact[c] % MOD;\n        }\n        answer = answer * ways % MOD;\n    }\n    return (int) answer;\n}`,
        cpp: `int countAnagrams(string s) {\n    const long long MOD = 1000000007LL;\n    int n = (int) s.size();\n    vector<long long> fact(n + 1, 1), invFact(n + 1, 1);\n    for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % MOD;\n    long long base = fact[n], e = MOD - 2, cur = 1;\n    while (e > 0) {\n        if (e & 1LL) cur = cur * base % MOD;\n        base = base * base % MOD;\n        e >>= 1;\n    }\n    invFact[n] = cur;\n    for (int i = n; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;\n    long long answer = 1;\n    string word;\n    vector<string> words;\n    for (char c : s) {\n        if (c == ' ') {\n            words.push_back(word);\n            word.clear();\n        } else {\n            word += c;\n        }\n    }\n    words.push_back(word);\n    for (auto& w : words) {\n        vector<int> cnt(26, 0);\n        for (char c : w) cnt[c - 'a']++;\n        long long ways = fact[w.size()];\n        for (int c : cnt) {\n            if (c > 1) ways = ways * invFact[c] % MOD;\n        }\n        answer = answer * ways % MOD;\n    }\n    return (int) answer;\n}`,
        c: `int countAnagrams(char* s) {\n    const long long MOD = 1000000007LL;\n    int n = (int) strlen(s);\n    long long* fact = (long long*) malloc((size_t) (n + 1) * sizeof(long long));\n    long long* invFact = (long long*) malloc((size_t) (n + 1) * sizeof(long long));\n    fact[0] = 1;\n    for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % MOD;\n    long long base = fact[n], e = MOD - 2, cur = 1;\n    while (e > 0) {\n        if (e & 1LL) cur = cur * base % MOD;\n        base = base * base % MOD;\n        e >>= 1;\n    }\n    invFact[n] = cur;\n    for (int i = n; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;\n    long long answer = 1;\n    int start = 0;\n    for (int i = 0; i <= n; i++) {\n        if (i == n || s[i] == ' ') {\n            int cnt[26];\n            for (int c = 0; c < 26; c++) cnt[c] = 0;\n            for (int j = start; j < i; j++) cnt[s[j] - 'a']++;\n            long long ways = fact[i - start];\n            for (int c = 0; c < 26; c++) {\n                if (cnt[c] > 1) ways = ways * invFact[cnt[c]] % MOD;\n            }\n            answer = answer * ways % MOD;\n            start = i + 1;\n        }\n    }\n    free(fact);\n    free(invFact);\n    return (int) answer;\n}`,
        csharp: `public static int CountAnagrams(string s)\n{\n    const long MOD = 1000000007L;\n    int n = s.Length;\n    var fact = new long[n + 1];\n    var invFact = new long[n + 1];\n    fact[0] = 1;\n    for (int i = 1; i <= n; i++) fact[i] = fact[i - 1] * i % MOD;\n    long bse = fact[n], e = MOD - 2, cur = 1;\n    while (e > 0)\n    {\n        if ((e & 1L) == 1L) cur = cur * bse % MOD;\n        bse = bse * bse % MOD;\n        e >>= 1;\n    }\n    invFact[n] = cur;\n    for (int i = n; i >= 1; i--) invFact[i - 1] = invFact[i] * i % MOD;\n    long answer = 1;\n    foreach (var word in s.Split(' '))\n    {\n        var cnt = new int[26];\n        foreach (char c in word) cnt[c - 'a']++;\n        long ways = fact[word.Length];\n        foreach (int c in cnt)\n        {\n            if (c > 1) ways = ways * invFact[c] % MOD;\n        }\n        answer = answer * ways % MOD;\n    }\n    return (int) answer;\n}`,
        go: `func countAnagrams(s string) int {\n\tconst MOD = 1000000007\n\tn := len(s)\n\tfact := make([]int, n+1)\n\tinvFact := make([]int, n+1)\n\tfact[0] = 1\n\tfor i := 1; i <= n; i++ {\n\t\tfact[i] = fact[i-1] * i % MOD\n\t}\n\tbase, e, cur := fact[n], MOD-2, 1\n\tfor e > 0 {\n\t\tif e&1 == 1 {\n\t\t\tcur = cur * base % MOD\n\t\t}\n\t\tbase = base * base % MOD\n\t\te >>= 1\n\t}\n\tinvFact[n] = cur\n\tfor i := n; i >= 1; i-- {\n\t\tinvFact[i-1] = invFact[i] * i % MOD\n\t}\n\tanswer := 1\n\tfor _, word := range strings.Split(s, " ") {\n\t\tvar cnt [26]int\n\t\tfor i := 0; i < len(word); i++ {\n\t\t\tcnt[word[i]-'a']++\n\t\t}\n\t\tways := fact[len(word)]\n\t\tfor _, c := range cnt {\n\t\t\tif c > 1 {\n\t\t\t\tways = ways * invFact[c] % MOD\n\t\t\t}\n\t\t}\n\t\tanswer = answer * ways % MOD\n\t}\n\treturn answer\n}`,
        kotlin: `fun countAnagrams(s: String): Int {\n    val mod = 1000000007L\n    val n = s.length\n    val fact = LongArray(n + 1)\n    val invFact = LongArray(n + 1)\n    fact[0] = 1\n    for (i in 1..n) fact[i] = fact[i - 1] * i % mod\n    var base = fact[n]\n    var e = mod - 2\n    var cur = 1L\n    while (e > 0) {\n        if (e and 1L == 1L) cur = cur * base % mod\n        base = base * base % mod\n        e = e shr 1\n    }\n    invFact[n] = cur\n    for (i in n downTo 1) invFact[i - 1] = invFact[i] * i % mod\n    var answer = 1L\n    for (word in s.split(" ")) {\n        val cnt = IntArray(26)\n        for (c in word) cnt[c - 'a']++\n        var ways = fact[word.length]\n        for (c in cnt) {\n            if (c > 1) ways = ways * invFact[c] % mod\n        }\n        answer = answer * ways % mod\n    }\n    return answer.toInt()\n}`,
        swift: `func countAnagrams(_ s: String) -> Int {\n    let mod = 1000000007\n    let n = s.count\n    var fact = [Int](repeating: 1, count: n + 1)\n    var invFact = [Int](repeating: 1, count: n + 1)\n    for i in 1...max(n, 1) where i <= n { fact[i] = fact[i - 1] * i % mod }\n    var base = fact[n]\n    var e = mod - 2\n    var cur = 1\n    while e > 0 {\n        if e & 1 == 1 { cur = cur * base % mod }\n        base = base * base % mod\n        e >>= 1\n    }\n    invFact[n] = cur\n    var i = n\n    while i >= 1 {\n        invFact[i - 1] = invFact[i] * i % mod\n        i -= 1\n    }\n    var answer = 1\n    let base97 = Int(Character("a").asciiValue!)\n    for word in s.split(separator: " ", omittingEmptySubsequences: false) {\n        var cnt = [Int](repeating: 0, count: 26)\n        for c in word.unicodeScalars { cnt[Int(c.value) - base97] += 1 }\n        var ways = fact[word.count]\n        for c in cnt where c > 1 { ways = ways * invFact[c] % mod }\n        answer = answer * ways % mod\n    }\n    return answer\n}`,
        rust: `fn countAnagrams(s: String) -> i32 {\n    const MOD: i64 = 1000000007;\n    let n = s.len();\n    let mut fact = vec![1i64; n + 1];\n    let mut inv_fact = vec![1i64; n + 1];\n    for i in 1..=n {\n        fact[i] = fact[i - 1] * (i as i64) % MOD;\n    }\n    let mut base = fact[n];\n    let mut e = MOD - 2;\n    let mut cur: i64 = 1;\n    while e > 0 {\n        if e & 1 == 1 {\n            cur = cur * base % MOD;\n        }\n        base = base * base % MOD;\n        e >>= 1;\n    }\n    inv_fact[n] = cur;\n    for i in (1..=n).rev() {\n        inv_fact[i - 1] = inv_fact[i] * (i as i64) % MOD;\n    }\n    let mut answer: i64 = 1;\n    for word in s.split(' ') {\n        let mut cnt = [0usize; 26];\n        for b in word.bytes() {\n            cnt[(b - b'a') as usize] += 1;\n        }\n        let mut ways = fact[word.len()];\n        for &c in cnt.iter() {\n            if c > 1 {\n                ways = ways * inv_fact[c] % MOD;\n            }\n        }\n        answer = answer * ways % MOD;\n    }\n    answer as i32\n}`,
        php: `function countAnagrams($s) {\n    $MOD = 1000000007;\n    $n = strlen($s);\n    $fact = array_fill(0, $n + 1, 1);\n    $invFact = array_fill(0, $n + 1, 1);\n    for ($i = 1; $i <= $n; $i++) $fact[$i] = $fact[$i - 1] * $i % $MOD;\n    $base = $fact[$n];\n    $e = $MOD - 2;\n    $cur = 1;\n    while ($e > 0) {\n        if ($e % 2 === 1) $cur = $cur * $base % $MOD;\n        $base = $base * $base % $MOD;\n        $e = intdiv($e, 2);\n    }\n    $invFact[$n] = $cur;\n    for ($i = $n; $i >= 1; $i--) $invFact[$i - 1] = $invFact[$i] * $i % $MOD;\n    $answer = 1;\n    foreach (explode(" ", $s) as $word) {\n        $cnt = array_fill(0, 26, 0);\n        for ($i = 0; $i < strlen($word); $i++) $cnt[ord($word[$i]) - 97]++;\n        $ways = $fact[strlen($word)];\n        for ($i = 0; $i < 26; $i++) {\n            if ($cnt[$i] > 1) $ways = $ways * $invFact[$cnt[$i]] % $MOD;\n        }\n        $answer = $answer * $ways % $MOD;\n    }\n    return $answer;\n}`,
        ruby: `def countAnagrams(s)\n  mod = 1000000007\n  n = s.length\n  fact = Array.new(n + 1, 1)\n  (1..n).each { |i| fact[i] = fact[i - 1] * i % mod }\n  inv_fact = Array.new(n + 1, 1)\n  inv_fact[n] = fact[n].pow(mod - 2, mod)\n  n.downto(1) { |i| inv_fact[i - 1] = inv_fact[i] * i % mod }\n  answer = 1\n  s.split(" ", -1).each do |word|\n    cnt = Array.new(26, 0)\n    word.each_char { |c| cnt[c.ord - 97] += 1 }\n    ways = fact[word.length]\n    cnt.each { |c| ways = ways * inv_fact[c] % mod if c > 1 }\n    answer = answer * ways % mod\n  end\n  answer\nend`,
      },
    };
  })(),

  // ── Valid Palindrome III (LC 1216) ──────────────────────────────
  (() => {
    const ref = (s: string, k: number) => {
      const n = s.length;
      // dp[i][j] = longest palindromic subsequence of s[i..j]
      const dp: number[][] = [];
      for (let i = 0; i < n; i++) dp.push(new Array(n).fill(0));
      for (let i = 0; i < n; i++) dp[i][i] = 1;
      for (let len = 2; len <= n; len++) {
        for (let i = 0; i + len - 1 < n; i++) {
          const j = i + len - 1;
          if (s.charAt(i) === s.charAt(j)) dp[i][j] = (len === 2 ? 0 : dp[i + 1][j - 1]) + 2;
          else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
        }
      }
      return n - dp[0][n - 1] <= k;
    };
    return {
      slug: "valid-palindrome-iii",
      title: "Valid Palindrome III",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "isValidPalindrome", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "A string is **k-palindrome** if it can be turned into a palindrome by removing **at most `k`** characters.\n\nReturn whether `s` is k-palindrome.",
        [
          { in: 's = "codekairo", k = 6', out: "true", note: "`odo` survives — six of the nine characters come out." },
          { in: 's = "abcdeca", k = 2', out: "true", note: "Remove `b` and `e` to leave `acdca`." },
          { in: 's = "codekairo", k = 5', out: "false", note: "No palindromic subsequence is longer than 3, so five removals are not enough." },
        ],
        ["1 <= s.length <= 1000", "s consists of only lowercase English letters.", "1 <= k <= s.length"]),
      hints: [
        "Whatever you keep must itself be a palindrome — and it is a **subsequence** of `s`.",
        "So the fewest removals equals `n` minus the length of the longest palindromic subsequence.",
        "That length is the classic interval DP on `s[i..j]`.",
      ],
      editorial: explain({
        idea: "The characters you keep form a palindromic subsequence, so the minimum number of removals is `n - LPS(s)`. Compute the longest palindromic subsequence with the standard interval DP and compare.",
        steps: [
          "Let `dp[i][j]` be the LPS length of `s[i..j]`, with `dp[i][i] = 1`.",
          "For increasing lengths: if `s[i] == s[j]`, `dp[i][j] = dp[i+1][j-1] + 2`; otherwise `dp[i][j] = max(dp[i+1][j], dp[i][j-1])`.",
          "Return `n - dp[0][n-1] <= k`.",
        ],
        why: "Reframing \"remove at most k\" as \"keep at least n − k\" is what turns a search over deletion sets into a single optimisation — and what you keep is exactly a palindromic subsequence, so LPS is the right quantity. The DP itself is the usual one, with the one trap that a length-2 interval with equal ends has no inner interval, so `dp[i+1][j-1]` must be read as 0 there rather than from an inverted range.",
        time: "O(n²)",
        space: "O(n²), reducible to O(n) with a rolling row",
        pitfalls: [
          "A palindromic **subsequence** — the kept characters need not be contiguous.",
          "At `len == 2` the inner interval is empty; reading `dp[i+1][j-1]` out of order gives garbage in some implementations.",
          "LPS on `s` equals the LCS of `s` with its reverse, which is the same O(n²) either way.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n6', expectedOutput: "true" },
        { input: '"abcdeca"\n2', expectedOutput: "true" },
        { input: '"codekairo"\n5', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abc";
        const n = ri(rng, 1, 14);
        let s = "";
        for (let i = 0; i < n; i++) s += alphabet.charAt(ri(rng, 0, 2));
        const k = ri(rng, 1, n);
        return { input: `"${s}"\n${k}`, expectedOutput: bool(ref(s, k)) };
      },
      solutions: {
        python: `def isValidPalindrome(s: str, k: int) -> bool:\n    n = len(s)\n    dp = [[0] * n for _ in range(n)]\n    for i in range(n):\n        dp[i][i] = 1\n    for length in range(2, n + 1):\n        for i in range(n - length + 1):\n            j = i + length - 1\n            if s[i] == s[j]:\n                dp[i][j] = (0 if length == 2 else dp[i + 1][j - 1]) + 2\n            else:\n                dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])\n    return n - dp[0][n - 1] <= k`,
        javascript: `var isValidPalindrome = function(s, k) {\n    var n = s.length, i, j;\n    var dp = [];\n    for (i = 0; i < n; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(0);\n        dp.push(row);\n    }\n    for (i = 0; i < n; i++) dp[i][i] = 1;\n    for (var len = 2; len <= n; len++) {\n        for (i = 0; i + len - 1 < n; i++) {\n            j = i + len - 1;\n            if (s.charAt(i) === s.charAt(j)) dp[i][j] = (len === 2 ? 0 : dp[i + 1][j - 1]) + 2;\n            else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);\n        }\n    }\n    return n - dp[0][n - 1] <= k;\n};`,
        typescript: `function isValidPalindrome(s: string, k: number): boolean {\n    var n = s.length, i: number, j: number;\n    var dp: number[][] = [];\n    for (i = 0; i < n; i++) {\n        var row: number[] = [];\n        for (j = 0; j < n; j++) row.push(0);\n        dp.push(row);\n    }\n    for (i = 0; i < n; i++) dp[i][i] = 1;\n    for (var len = 2; len <= n; len++) {\n        for (i = 0; i + len - 1 < n; i++) {\n            j = i + len - 1;\n            if (s.charAt(i) === s.charAt(j)) dp[i][j] = (len === 2 ? 0 : dp[i + 1][j - 1]) + 2;\n            else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);\n        }\n    }\n    return n - dp[0][n - 1] <= k;\n}`,
        java: `public static boolean isValidPalindrome(String s, int k) {\n    int n = s.length();\n    int[][] dp = new int[n][n];\n    for (int i = 0; i < n; i++) dp[i][i] = 1;\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            if (s.charAt(i) == s.charAt(j)) dp[i][j] = (len == 2 ? 0 : dp[i + 1][j - 1]) + 2;\n            else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);\n        }\n    }\n    return n - dp[0][n - 1] <= k;\n}`,
        cpp: `bool isValidPalindrome(string s, int k) {\n    int n = (int) s.size();\n    vector<vector<int>> dp(n, vector<int>(n, 0));\n    for (int i = 0; i < n; i++) dp[i][i] = 1;\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            if (s[i] == s[j]) dp[i][j] = (len == 2 ? 0 : dp[i + 1][j - 1]) + 2;\n            else dp[i][j] = max(dp[i + 1][j], dp[i][j - 1]);\n        }\n    }\n    return n - dp[0][n - 1] <= k;\n}`,
        c: `bool isValidPalindrome(char* s, int k) {\n    int n = (int) strlen(s);\n    int* dp = (int*) calloc((size_t) n * (size_t) n, sizeof(int));\n    for (int i = 0; i < n; i++) dp[i * n + i] = 1;\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            if (s[i] == s[j]) {\n                dp[i * n + j] = (len == 2 ? 0 : dp[(i + 1) * n + (j - 1)]) + 2;\n            } else {\n                int a = dp[(i + 1) * n + j];\n                int b = dp[i * n + (j - 1)];\n                dp[i * n + j] = a > b ? a : b;\n            }\n        }\n    }\n    int lps = dp[0 * n + (n - 1)];\n    free(dp);\n    return n - lps <= k;\n}`,
        csharp: `public static bool IsValidPalindrome(string s, int k)\n{\n    int n = s.Length;\n    var dp = new int[n, n];\n    for (int i = 0; i < n; i++) dp[i, i] = 1;\n    for (int len = 2; len <= n; len++)\n    {\n        for (int i = 0; i + len - 1 < n; i++)\n        {\n            int j = i + len - 1;\n            if (s[i] == s[j]) dp[i, j] = (len == 2 ? 0 : dp[i + 1, j - 1]) + 2;\n            else dp[i, j] = Math.Max(dp[i + 1, j], dp[i, j - 1]);\n        }\n    }\n    return n - dp[0, n - 1] <= k;\n}`,
        go: `func isValidPalindrome(s string, k int) bool {\n\tn := len(s)\n\tdp := make([][]int, n)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, n)\n\t\tdp[i][i] = 1\n\t}\n\tfor length := 2; length <= n; length++ {\n\t\tfor i := 0; i+length-1 < n; i++ {\n\t\t\tj := i + length - 1\n\t\t\tif s[i] == s[j] {\n\t\t\t\tinner := 0\n\t\t\t\tif length > 2 {\n\t\t\t\t\tinner = dp[i+1][j-1]\n\t\t\t\t}\n\t\t\t\tdp[i][j] = inner + 2\n\t\t\t} else if dp[i+1][j] > dp[i][j-1] {\n\t\t\t\tdp[i][j] = dp[i+1][j]\n\t\t\t} else {\n\t\t\t\tdp[i][j] = dp[i][j-1]\n\t\t\t}\n\t\t}\n\t}\n\treturn n-dp[0][n-1] <= k\n}`,
        kotlin: `fun isValidPalindrome(s: String, k: Int): Boolean {\n    val n = s.length\n    val dp = Array(n) { IntArray(n) }\n    for (i in 0 until n) dp[i][i] = 1\n    for (len in 2..n) {\n        for (i in 0..n - len) {\n            val j = i + len - 1\n            if (s[i] == s[j]) dp[i][j] = (if (len == 2) 0 else dp[i + 1][j - 1]) + 2\n            else dp[i][j] = maxOf(dp[i + 1][j], dp[i][j - 1])\n        }\n    }\n    return n - dp[0][n - 1] <= k\n}`,
        swift: `func isValidPalindrome(_ s: String, _ k: Int) -> Bool {\n    let chars = Array(s)\n    let n = chars.count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n    for i in 0..<n { dp[i][i] = 1 }\n    if n >= 2 {\n        for len in 2...n {\n            for i in 0...(n - len) {\n                let j = i + len - 1\n                if chars[i] == chars[j] {\n                    dp[i][j] = (len == 2 ? 0 : dp[i + 1][j - 1]) + 2\n                } else {\n                    dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])\n                }\n            }\n        }\n    }\n    return n - dp[0][n - 1] <= k\n}`,
        rust: `fn isValidPalindrome(s: String, k: i32) -> bool {\n    let chars: Vec<char> = s.chars().collect();\n    let n = chars.len();\n    let mut dp = vec![vec![0i32; n]; n];\n    for i in 0..n {\n        dp[i][i] = 1;\n    }\n    for len in 2..=n {\n        for i in 0..=(n - len) {\n            let j = i + len - 1;\n            if chars[i] == chars[j] {\n                let inner = if len == 2 { 0 } else { dp[i + 1][j - 1] };\n                dp[i][j] = inner + 2;\n            } else {\n                dp[i][j] = dp[i + 1][j].max(dp[i][j - 1]);\n            }\n        }\n    }\n    (n as i32) - dp[0][n - 1] <= k\n}`,
        php: `function isValidPalindrome($s, $k) {\n    $n = strlen($s);\n    $dp = [];\n    for ($i = 0; $i < $n; $i++) $dp[$i] = array_fill(0, $n, 0);\n    for ($i = 0; $i < $n; $i++) $dp[$i][$i] = 1;\n    for ($len = 2; $len <= $n; $len++) {\n        for ($i = 0; $i + $len - 1 < $n; $i++) {\n            $j = $i + $len - 1;\n            if ($s[$i] === $s[$j]) $dp[$i][$j] = ($len === 2 ? 0 : $dp[$i + 1][$j - 1]) + 2;\n            else $dp[$i][$j] = max($dp[$i + 1][$j], $dp[$i][$j - 1]);\n        }\n    }\n    return $n - $dp[0][$n - 1] <= $k;\n}`,
        ruby: `def isValidPalindrome(s, k)\n  n = s.length\n  dp = Array.new(n) { Array.new(n, 0) }\n  (0...n).each { |i| dp[i][i] = 1 }\n  (2..n).each do |len|\n    (0..(n - len)).each do |i|\n      j = i + len - 1\n      if s[i] == s[j]\n        dp[i][j] = (len == 2 ? 0 : dp[i + 1][j - 1]) + 2\n      else\n        dp[i][j] = [dp[i + 1][j], dp[i][j - 1]].max\n      end\n    end\n  end\n  n - dp[0][n - 1] <= k\nend`,
      },
    };
  })(),

  // ── Smallest K-Length Subsequence With Occurrences (LC 2030) ────
  (() => {
    const ref = (s: string, k: number, letter: string, repetition: number) => {
      const n = s.length;
      let remaining = 0;
      for (let i = 0; i < n; i++) if (s.charAt(i) === letter) remaining++;
      const stack: string[] = [];
      let inStack = 0;
      for (let i = 0; i < n; i++) {
        const c = s.charAt(i);
        while (stack.length > 0 && stack[stack.length - 1] > c
          && stack.length + (n - i) > k
          && (stack[stack.length - 1] !== letter || inStack - 1 + remaining >= repetition)) {
          if (stack[stack.length - 1] === letter) inStack--;
          stack.pop();
        }
        if (stack.length < k) {
          if (c === letter) { stack.push(c); inStack++; }
          else if (k - stack.length > repetition - inStack) stack.push(c);
        }
        if (c === letter) remaining--;
      }
      return stack.join("");
    };
    return {
      slug: "smallest-k-length-subsequence-with-occurrences-of-a-letter",
      title: "Smallest K-Length Subsequence With Occurrences of a Letter",
      difficulty: "HARD" as const,
      tags: ["String", "Stack", "Greedy", "Monotonic Stack", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "smallestSubsequence", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }, { name: "letter", type: "string" as const }, { name: "repetition", type: "int" as const }], returns: "string" as const },
      description: describe(
        "Return the **lexicographically smallest** subsequence of `s` that has length exactly `k` and contains the character `letter` **at least `repetition` times**. The input guarantees such a subsequence exists.",
        [
          { in: 's = "codekairo", k = 3, letter = "o", repetition = 2', out: "coo", note: "Both `o`s are required, so only the third character is free — and `c` beats every letter between them." },
          { in: 's = "leetcode", k = 4, letter = "e", repetition = 2', out: "ecde" },
          { in: 's = "leet", k = 3, letter = "e", repetition = 1', out: "eet" },
        ],
        ["1 <= repetition <= k <= s.length <= 5 * 10^4", "s consists of lowercase English letters.", "letter is a lowercase English letter, and appears in s at least repetition times."]),
      hints: [
        "Without the `letter` requirement this is the classic \"smallest subsequence of length k\" monotonic-stack problem.",
        "Two extra guards are needed: never pop a `letter` if the ones left cannot make up the quota, and never push a non-letter if it would leave too few slots for the quota.",
        "Track how many `letter`s are still ahead in `s` and how many are already on the stack.",
      ],
      editorial: explain({
        idea: "Run the standard greedy monotonic stack for the smallest length-`k` subsequence, and add two feasibility guards that keep the `letter` quota reachable at every step.",
        steps: [
          "Count the total occurrences of `letter`; keep `remaining` = how many are at or after the current index, and `inStack` = how many are on the stack.",
          "For each character `c`: pop the stack top while it is greater than `c`, **and** enough characters remain to still reach length `k`, **and** — if the top is `letter` — dropping it would still leave `inStack - 1 + remaining >= repetition`.",
          "Push `c` when the stack is shorter than `k`. A `letter` always pushes. A non-letter pushes only if `k - stack.length > repetition - inStack`, i.e. there is still a free slot after reserving space for the outstanding quota.",
          "Decrement `remaining` after processing an occurrence of `letter`.",
        ],
        why: "The plain greedy is correct because replacing a larger earlier character with a smaller later one always improves the result at the first position where they differ. The two guards are what make it correct *under a constraint*: the pop guard refuses to discard a `letter` the quota still needs, and the push guard refuses to spend a slot that the quota has already claimed. Both are checked against the counts rather than by lookahead, which keeps the whole thing one linear pass.",
        time: "O(n)",
        space: "O(k)",
        pitfalls: [
          "Popping a `letter` without checking the quota can make the target unreachable, with no way to recover later in the pass.",
          "The push guard is a strict `>`: the slot being filled must not be one the quota needs.",
          "`remaining` must count the occurrence at the current index while it is being processed, and drop only afterwards.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n3\n"o"\n2', expectedOutput: "coo" },
        { input: '"leetcode"\n4\n"e"\n2', expectedOutput: "ecde" },
        { input: '"leet"\n3\n"e"\n1', expectedOutput: "eet" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abc";
        const n = ri(rng, 1, 12);
        let s = "";
        for (let i = 0; i < n; i++) s += alphabet.charAt(ri(rng, 0, 2));
        // Draw the letter from s itself, so at least one occurrence is certain.
        const letter = s.charAt(ri(rng, 0, n - 1));
        let total = 0;
        for (let i = 0; i < n; i++) if (s.charAt(i) === letter) total++;
        const k = ri(rng, 1, n);
        const repetition = ri(rng, 1, Math.min(k, total));
        return { input: `"${s}"\n${k}\n"${letter}"\n${repetition}`, expectedOutput: ref(s, k, letter, repetition) };
      },
      solutions: {
        python: `def smallestSubsequence(s: str, k: int, letter: str, repetition: int) -> str:\n    n = len(s)\n    remaining = s.count(letter)\n    stack = []\n    in_stack = 0\n    for i, c in enumerate(s):\n        while (stack and stack[-1] > c and len(stack) + (n - i) > k\n               and (stack[-1] != letter or in_stack - 1 + remaining >= repetition)):\n            if stack[-1] == letter:\n                in_stack -= 1\n            stack.pop()\n        if len(stack) < k:\n            if c == letter:\n                stack.append(c)\n                in_stack += 1\n            elif k - len(stack) > repetition - in_stack:\n                stack.append(c)\n        if c == letter:\n            remaining -= 1\n    return "".join(stack)`,
        javascript: `var smallestSubsequence = function(s, k, letter, repetition) {\n    var n = s.length, i;\n    var remaining = 0;\n    for (i = 0; i < n; i++) if (s.charAt(i) === letter) remaining++;\n    var stack = [], inStack = 0;\n    for (i = 0; i < n; i++) {\n        var c = s.charAt(i);\n        while (stack.length > 0 && stack[stack.length - 1] > c\n            && stack.length + (n - i) > k\n            && (stack[stack.length - 1] !== letter || inStack - 1 + remaining >= repetition)) {\n            if (stack[stack.length - 1] === letter) inStack--;\n            stack.pop();\n        }\n        if (stack.length < k) {\n            if (c === letter) { stack.push(c); inStack++; }\n            else if (k - stack.length > repetition - inStack) stack.push(c);\n        }\n        if (c === letter) remaining--;\n    }\n    return stack.join("");\n};`,
        typescript: `function smallestSubsequence(s: string, k: number, letter: string, repetition: number): string {\n    var n = s.length, i: number;\n    var remaining = 0;\n    for (i = 0; i < n; i++) if (s.charAt(i) === letter) remaining++;\n    var stack: string[] = [], inStack = 0;\n    for (i = 0; i < n; i++) {\n        var c = s.charAt(i);\n        while (stack.length > 0 && stack[stack.length - 1] > c\n            && stack.length + (n - i) > k\n            && (stack[stack.length - 1] !== letter || inStack - 1 + remaining >= repetition)) {\n            if (stack[stack.length - 1] === letter) inStack--;\n            stack.pop();\n        }\n        if (stack.length < k) {\n            if (c === letter) { stack.push(c); inStack++; }\n            else if (k - stack.length > repetition - inStack) stack.push(c);\n        }\n        if (c === letter) remaining--;\n    }\n    return stack.join("");\n}`,
        java: `public static String smallestSubsequence(String s, int k, String letter, int repetition) {\n    int n = s.length();\n    char target = letter.charAt(0);\n    int remaining = 0;\n    for (int i = 0; i < n; i++) {\n        if (s.charAt(i) == target) remaining++;\n    }\n    char[] stack = new char[n];\n    int top = 0, inStack = 0;\n    for (int i = 0; i < n; i++) {\n        char c = s.charAt(i);\n        while (top > 0 && stack[top - 1] > c && top + (n - i) > k\n                && (stack[top - 1] != target || inStack - 1 + remaining >= repetition)) {\n            if (stack[top - 1] == target) inStack--;\n            top--;\n        }\n        if (top < k) {\n            if (c == target) {\n                stack[top++] = c;\n                inStack++;\n            } else if (k - top > repetition - inStack) {\n                stack[top++] = c;\n            }\n        }\n        if (c == target) remaining--;\n    }\n    return new String(stack, 0, top);\n}`,
        cpp: `string smallestSubsequence(string s, int k, string letter, int repetition) {\n    int n = (int) s.size();\n    char target = letter[0];\n    int remaining = 0;\n    for (char c : s) {\n        if (c == target) remaining++;\n    }\n    string stk;\n    int inStack = 0;\n    for (int i = 0; i < n; i++) {\n        char c = s[i];\n        while (!stk.empty() && stk.back() > c && (int) stk.size() + (n - i) > k\n               && (stk.back() != target || inStack - 1 + remaining >= repetition)) {\n            if (stk.back() == target) inStack--;\n            stk.pop_back();\n        }\n        if ((int) stk.size() < k) {\n            if (c == target) {\n                stk += c;\n                inStack++;\n            } else if (k - (int) stk.size() > repetition - inStack) {\n                stk += c;\n            }\n        }\n        if (c == target) remaining--;\n    }\n    return stk;\n}`,
        c: `char* smallestSubsequence(char* s, int k, char* letter, int repetition) {\n    int n = (int) strlen(s);\n    char target = letter[0];\n    int remaining = 0;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == target) remaining++;\n    }\n    char* stack = (char*) malloc((size_t) n + 1);\n    int top = 0, inStack = 0;\n    for (int i = 0; i < n; i++) {\n        char c = s[i];\n        while (top > 0 && stack[top - 1] > c && top + (n - i) > k\n               && (stack[top - 1] != target || inStack - 1 + remaining >= repetition)) {\n            if (stack[top - 1] == target) inStack--;\n            top--;\n        }\n        if (top < k) {\n            if (c == target) {\n                stack[top++] = c;\n                inStack++;\n            } else if (k - top > repetition - inStack) {\n                stack[top++] = c;\n            }\n        }\n        if (c == target) remaining--;\n    }\n    stack[top] = '\\0';\n    return stack;\n}`,
        csharp: `public static string SmallestSubsequence(string s, int k, string letter, int repetition)\n{\n    int n = s.Length;\n    char target = letter[0];\n    int remaining = 0;\n    foreach (char c in s)\n    {\n        if (c == target) remaining++;\n    }\n    var stack = new char[n];\n    int top = 0, inStack = 0;\n    for (int i = 0; i < n; i++)\n    {\n        char c = s[i];\n        while (top > 0 && stack[top - 1] > c && top + (n - i) > k\n               && (stack[top - 1] != target || inStack - 1 + remaining >= repetition))\n        {\n            if (stack[top - 1] == target) inStack--;\n            top--;\n        }\n        if (top < k)\n        {\n            if (c == target)\n            {\n                stack[top++] = c;\n                inStack++;\n            }\n            else if (k - top > repetition - inStack)\n            {\n                stack[top++] = c;\n            }\n        }\n        if (c == target) remaining--;\n    }\n    return new string(stack, 0, top);\n}`,
        go: `func smallestSubsequence(s string, k int, letter string, repetition int) string {\n\tn := len(s)\n\ttarget := letter[0]\n\tremaining := 0\n\tfor i := 0; i < n; i++ {\n\t\tif s[i] == target {\n\t\t\tremaining++\n\t\t}\n\t}\n\tstack := make([]byte, 0, n)\n\tinStack := 0\n\tfor i := 0; i < n; i++ {\n\t\tc := s[i]\n\t\tfor len(stack) > 0 && stack[len(stack)-1] > c && len(stack)+(n-i) > k &&\n\t\t\t(stack[len(stack)-1] != target || inStack-1+remaining >= repetition) {\n\t\t\tif stack[len(stack)-1] == target {\n\t\t\t\tinStack--\n\t\t\t}\n\t\t\tstack = stack[:len(stack)-1]\n\t\t}\n\t\tif len(stack) < k {\n\t\t\tif c == target {\n\t\t\t\tstack = append(stack, c)\n\t\t\t\tinStack++\n\t\t\t} else if k-len(stack) > repetition-inStack {\n\t\t\t\tstack = append(stack, c)\n\t\t\t}\n\t\t}\n\t\tif c == target {\n\t\t\tremaining--\n\t\t}\n\t}\n\treturn string(stack)\n}`,
        kotlin: `fun smallestSubsequence(s: String, k: Int, letter: String, repetition: Int): String {\n    val n = s.length\n    val target = letter[0]\n    var remaining = s.count { it == target }\n    val stack = CharArray(n)\n    var top = 0\n    var inStack = 0\n    for (i in 0 until n) {\n        val c = s[i]\n        while (top > 0 && stack[top - 1] > c && top + (n - i) > k &&\n            (stack[top - 1] != target || inStack - 1 + remaining >= repetition)) {\n            if (stack[top - 1] == target) inStack--\n            top--\n        }\n        if (top < k) {\n            if (c == target) {\n                stack[top++] = c\n                inStack++\n            } else if (k - top > repetition - inStack) {\n                stack[top++] = c\n            }\n        }\n        if (c == target) remaining--\n    }\n    return String(stack, 0, top)\n}`,
        swift: `func smallestSubsequence(_ s: String, _ k: Int, _ letter: String, _ repetition: Int) -> String {\n    let chars = Array(s)\n    let n = chars.count\n    let target = Array(letter)[0]\n    var remaining = chars.filter { $0 == target }.count\n    var stack = [Character]()\n    var inStack = 0\n    for i in 0..<n {\n        let c = chars[i]\n        while let last = stack.last, last > c, stack.count + (n - i) > k,\n              last != target || inStack - 1 + remaining >= repetition {\n            if last == target { inStack -= 1 }\n            stack.removeLast()\n        }\n        if stack.count < k {\n            if c == target {\n                stack.append(c)\n                inStack += 1\n            } else if k - stack.count > repetition - inStack {\n                stack.append(c)\n            }\n        }\n        if c == target { remaining -= 1 }\n    }\n    return String(stack)\n}`,
        rust: `fn smallestSubsequence(s: String, k: i32, letter: String, repetition: i32) -> String {\n    let chars: Vec<char> = s.chars().collect();\n    let n = chars.len() as i32;\n    let target = letter.chars().next().unwrap();\n    let mut remaining = chars.iter().filter(|&&c| c == target).count() as i32;\n    let mut stack: Vec<char> = Vec::new();\n    let mut in_stack = 0i32;\n    for i in 0..chars.len() {\n        let c = chars[i];\n        loop {\n            let last = match stack.last() {\n                Some(&x) => x,\n                None => break,\n            };\n            if !(last > c\n                && stack.len() as i32 + (n - i as i32) > k\n                && (last != target || in_stack - 1 + remaining >= repetition))\n            {\n                break;\n            }\n            if last == target {\n                in_stack -= 1;\n            }\n            stack.pop();\n        }\n        if (stack.len() as i32) < k {\n            if c == target {\n                stack.push(c);\n                in_stack += 1;\n            } else if k - stack.len() as i32 > repetition - in_stack {\n                stack.push(c);\n            }\n        }\n        if c == target {\n            remaining -= 1;\n        }\n    }\n    stack.into_iter().collect()\n}`,
        php: `function smallestSubsequence($s, $k, $letter, $repetition) {\n    $n = strlen($s);\n    $target = $letter[0];\n    $remaining = substr_count($s, $target);\n    $stack = [];\n    $inStack = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $c = $s[$i];\n        while (count($stack) > 0 && $stack[count($stack) - 1] > $c\n            && count($stack) + ($n - $i) > $k\n            && ($stack[count($stack) - 1] !== $target || $inStack - 1 + $remaining >= $repetition)) {\n            if ($stack[count($stack) - 1] === $target) $inStack--;\n            array_pop($stack);\n        }\n        if (count($stack) < $k) {\n            if ($c === $target) {\n                $stack[] = $c;\n                $inStack++;\n            } elseif ($k - count($stack) > $repetition - $inStack) {\n                $stack[] = $c;\n            }\n        }\n        if ($c === $target) $remaining--;\n    }\n    return implode("", $stack);\n}`,
        ruby: `def smallestSubsequence(s, k, letter, repetition)\n  n = s.length\n  remaining = s.count(letter)\n  stack = []\n  in_stack = 0\n  s.each_char.with_index do |c, i|\n    while !stack.empty? && stack[-1] > c && stack.length + (n - i) > k &&\n          (stack[-1] != letter || in_stack - 1 + remaining >= repetition)\n      in_stack -= 1 if stack[-1] == letter\n      stack.pop\n    end\n    if stack.length < k\n      if c == letter\n        stack << c\n        in_stack += 1\n      elsif k - stack.length > repetition - in_stack\n        stack << c\n      end\n    end\n    remaining -= 1 if c == letter\n  end\n  stack.join\nend`,
      },
    };
  })(),

  // ── Count Different Palindromic Subsequences (LC 730) ───────────
  (() => {
    const MOD = 1000000007;
    const ref = (s: string) => {
      const n = s.length;
      // nxt[i][c] = first index >= i holding c; prv[i][c] = last index <= i holding c.
      const nxt: number[][] = [];
      const prv: number[][] = [];
      for (let i = 0; i <= n; i++) nxt.push(new Array(4).fill(n));
      for (let i = 0; i <= n; i++) prv.push(new Array(4).fill(-1));
      for (let i = n - 1; i >= 0; i--) {
        for (let c = 0; c < 4; c++) nxt[i][c] = nxt[i + 1][c];
        nxt[i][s.charCodeAt(i) - 97] = i;
      }
      for (let i = 0; i < n; i++) {
        for (let c = 0; c < 4; c++) prv[i + 1][c] = i > 0 ? prv[i][c] : -1;
        prv[i + 1][s.charCodeAt(i) - 97] = i;
      }
      const dp: number[][] = [];
      for (let i = 0; i < n; i++) dp.push(new Array(n).fill(0));
      for (let i = 0; i < n; i++) dp[i][i] = 1;
      for (let len = 2; len <= n; len++) {
        for (let i = 0; i + len - 1 < n; i++) {
          const j = i + len - 1;
          if (s.charAt(i) !== s.charAt(j)) {
            let v = dp[i + 1][j] + dp[i][j - 1] - (i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0);
            v %= MOD;
            dp[i][j] = ((v % MOD) + MOD) % MOD;
          } else {
            const c = s.charCodeAt(i) - 97;
            const low = nxt[i + 1][c];
            const high = prv[j][c];
            const inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;
            let v: number;
            if (low > high) v = 2 * inner + 2;
            else if (low === high) v = 2 * inner + 1;
            else v = 2 * inner - (low + 1 <= high - 1 ? dp[low + 1][high - 1] : 0);
            dp[i][j] = ((v % MOD) + MOD) % MOD;
          }
        }
      }
      return dp[0][n - 1];
    };
    return {
      slug: "count-different-palindromic-subsequences",
      title: "Count Different Palindromic Subsequences",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Google", "Amazon", "Uber"],
      signature: { funcName: "countPalindromicSubsequences", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Return the number of **different** non-empty palindromic subsequences of `s`, **modulo 10⁹ + 7**.\n\nTwo subsequences are different if the resulting **strings** differ — the positions chosen do not matter.",
        [
          { in: 's = "bccb"', out: "6", note: "`b`, `c`, `bb`, `cc`, `bcb` and `bccb`." },
          { in: 's = "aaa"', out: "3", note: "`a`, `aa` and `aaa` — the three single `a`s are the same string." },
          { in: 's = "abcd"', out: "4", note: "Only the four single characters." },
        ],
        ["1 <= s.length <= 1000", "s[i] is either 'a', 'b', 'c', or 'd'."]),
      hints: [
        "Counting **distinct strings**, not distinct index sets — so identical characters must never be double-counted.",
        "Let `dp[i][j]` be the answer for `s[i..j]`. When the ends differ, inclusion–exclusion on the two shorter intervals works.",
        "When the ends match, the count depends on how many copies of that character lie strictly between them: none, exactly one, or more.",
      ],
      editorial: explain({
        idea: "Interval DP with `dp[i][j]` = the number of distinct palindromic subsequences of `s[i..j]`. When `s[i] != s[j]`, combine the two sub-intervals with inclusion–exclusion. When they are equal, the answer depends on the innermost and outermost copies of that character strictly inside — call them `low` and `high`.",
        steps: [
          "Precompute `nxt[i][c]` (first index ≥ `i` holding `c`) and `prv[i][c]` (last index < `i` holding `c`) so `low` and `high` are O(1) lookups.",
          "`s[i] != s[j]`: `dp[i][j] = dp[i+1][j] + dp[i][j-1] - dp[i+1][j-1]`.",
          "`s[i] == s[j]`, no copy inside (`low > high`): `2·dp[i+1][j-1] + 2` — the inner answers, each optionally wrapped, plus the two new strings `c` and `cc`.",
          "Exactly one copy inside (`low == high`): `2·dp[i+1][j-1] + 1` — `c` alone is already counted inside.",
          "Two or more inside: `2·dp[i+1][j-1] - dp[low+1][high-1]` — subtract what the innermost pair double-counts.",
          "Keep everything modulo 10⁹ + 7, adding `MOD` before the final reduction since subtractions can go negative.",
        ],
        why: "The three cases exist entirely because the count is over **strings**. Wrapping every inner palindrome in `c…c` produces a distinct string, hence the factor of 2 — but the palindromes that already begin and end with `c` inside the interval would be produced twice, and `dp[low+1][high-1]` is exactly that overlap. Getting the `+2` / `+1` / `−` split wrong is the classic way this problem fails: the constants account for whether `c` and `cc` are new strings or were already counted deeper inside.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "Modular subtraction can go negative — add `MOD` before the final `%`.",
          "The alphabet is only `a`–`d`, which is what makes the `nxt`/`prv` tables cheap.",
          "Distinct **strings**, not distinct index sets: `\"aaa\"` has 3 answers, not 7.",
        ],
      }),
      examples: [
        { input: '"bccb"', expectedOutput: "6" },
        { input: '"aaa"', expectedOutput: "3" },
        { input: '"abcd"', expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcd";
        const n = ri(rng, 1, 14);
        let s = "";
        for (let i = 0; i < n; i++) s += alphabet.charAt(ri(rng, 0, 3));
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def countPalindromicSubsequences(s: str) -> int:\n    MOD = 10**9 + 7\n    n = len(s)\n    nxt = [[n] * 4 for _ in range(n + 1)]\n    prv = [[-1] * 4 for _ in range(n + 1)]\n    for i in range(n - 1, -1, -1):\n        for c in range(4):\n            nxt[i][c] = nxt[i + 1][c]\n        nxt[i][ord(s[i]) - 97] = i\n    for i in range(n):\n        for c in range(4):\n            prv[i + 1][c] = prv[i][c] if i > 0 else -1\n        prv[i + 1][ord(s[i]) - 97] = i\n    dp = [[0] * n for _ in range(n)]\n    for i in range(n):\n        dp[i][i] = 1\n    for length in range(2, n + 1):\n        for i in range(n - length + 1):\n            j = i + length - 1\n            inner = dp[i + 1][j - 1] if i + 1 <= j - 1 else 0\n            if s[i] != s[j]:\n                v = dp[i + 1][j] + dp[i][j - 1] - inner\n            else:\n                c = ord(s[i]) - 97\n                low, high = nxt[i + 1][c], prv[j][c]\n                if low > high:\n                    v = 2 * inner + 2\n                elif low == high:\n                    v = 2 * inner + 1\n                else:\n                    v = 2 * inner - (dp[low + 1][high - 1] if low + 1 <= high - 1 else 0)\n            dp[i][j] = (v % MOD + MOD) % MOD\n    return dp[0][n - 1]`,
        javascript: `var countPalindromicSubsequences = function(s) {\n    var MOD = 1000000007;\n    var n = s.length, i, c, j;\n    var nxt = [], prv = [];\n    for (i = 0; i <= n; i++) {\n        var rowN = [], rowP = [];\n        for (c = 0; c < 4; c++) { rowN.push(n); rowP.push(-1); }\n        nxt.push(rowN); prv.push(rowP);\n    }\n    for (i = n - 1; i >= 0; i--) {\n        for (c = 0; c < 4; c++) nxt[i][c] = nxt[i + 1][c];\n        nxt[i][s.charCodeAt(i) - 97] = i;\n    }\n    for (i = 0; i < n; i++) {\n        for (c = 0; c < 4; c++) prv[i + 1][c] = i > 0 ? prv[i][c] : -1;\n        prv[i + 1][s.charCodeAt(i) - 97] = i;\n    }\n    var dp = [];\n    for (i = 0; i < n; i++) {\n        var row = [];\n        for (j = 0; j < n; j++) row.push(0);\n        dp.push(row);\n    }\n    for (i = 0; i < n; i++) dp[i][i] = 1;\n    for (var len = 2; len <= n; len++) {\n        for (i = 0; i + len - 1 < n; i++) {\n            j = i + len - 1;\n            var inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;\n            var v;\n            if (s.charAt(i) !== s.charAt(j)) {\n                v = dp[i + 1][j] + dp[i][j - 1] - inner;\n            } else {\n                var ch = s.charCodeAt(i) - 97;\n                var low = nxt[i + 1][ch], high = prv[j][ch];\n                if (low > high) v = 2 * inner + 2;\n                else if (low === high) v = 2 * inner + 1;\n                else v = 2 * inner - (low + 1 <= high - 1 ? dp[low + 1][high - 1] : 0);\n            }\n            dp[i][j] = ((v % MOD) + MOD) % MOD;\n        }\n    }\n    return dp[0][n - 1];\n};`,
        typescript: `function countPalindromicSubsequences(s: string): number {\n    var MOD = 1000000007;\n    var n = s.length, i: number, c: number, j: number;\n    var nxt: number[][] = [], prv: number[][] = [];\n    for (i = 0; i <= n; i++) {\n        var rowN: number[] = [], rowP: number[] = [];\n        for (c = 0; c < 4; c++) { rowN.push(n); rowP.push(-1); }\n        nxt.push(rowN); prv.push(rowP);\n    }\n    for (i = n - 1; i >= 0; i--) {\n        for (c = 0; c < 4; c++) nxt[i][c] = nxt[i + 1][c];\n        nxt[i][s.charCodeAt(i) - 97] = i;\n    }\n    for (i = 0; i < n; i++) {\n        for (c = 0; c < 4; c++) prv[i + 1][c] = i > 0 ? prv[i][c] : -1;\n        prv[i + 1][s.charCodeAt(i) - 97] = i;\n    }\n    var dp: number[][] = [];\n    for (i = 0; i < n; i++) {\n        var row: number[] = [];\n        for (j = 0; j < n; j++) row.push(0);\n        dp.push(row);\n    }\n    for (i = 0; i < n; i++) dp[i][i] = 1;\n    for (var len = 2; len <= n; len++) {\n        for (i = 0; i + len - 1 < n; i++) {\n            j = i + len - 1;\n            var inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;\n            var v: number;\n            if (s.charAt(i) !== s.charAt(j)) {\n                v = dp[i + 1][j] + dp[i][j - 1] - inner;\n            } else {\n                var ch = s.charCodeAt(i) - 97;\n                var low = nxt[i + 1][ch], high = prv[j][ch];\n                if (low > high) v = 2 * inner + 2;\n                else if (low === high) v = 2 * inner + 1;\n                else v = 2 * inner - (low + 1 <= high - 1 ? dp[low + 1][high - 1] : 0);\n            }\n            dp[i][j] = ((v % MOD) + MOD) % MOD;\n        }\n    }\n    return dp[0][n - 1];\n}`,
        java: `public static int countPalindromicSubsequences(String s) {\n    final long MOD = 1000000007L;\n    int n = s.length();\n    int[][] nxt = new int[n + 1][4];\n    int[][] prv = new int[n + 1][4];\n    for (int c = 0; c < 4; c++) nxt[n][c] = n;\n    for (int i = n - 1; i >= 0; i--) {\n        for (int c = 0; c < 4; c++) nxt[i][c] = nxt[i + 1][c];\n        nxt[i][s.charAt(i) - 'a'] = i;\n    }\n    for (int c = 0; c < 4; c++) prv[0][c] = -1;\n    for (int i = 0; i < n; i++) {\n        for (int c = 0; c < 4; c++) prv[i + 1][c] = prv[i][c];\n        prv[i + 1][s.charAt(i) - 'a'] = i;\n    }\n    long[][] dp = new long[n][n];\n    for (int i = 0; i < n; i++) dp[i][i] = 1;\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            long inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;\n            long v;\n            if (s.charAt(i) != s.charAt(j)) {\n                v = dp[i + 1][j] + dp[i][j - 1] - inner;\n            } else {\n                int c = s.charAt(i) - 'a';\n                int low = nxt[i + 1][c], high = prv[j][c];\n                if (low > high) v = 2 * inner + 2;\n                else if (low == high) v = 2 * inner + 1;\n                else v = 2 * inner - (low + 1 <= high - 1 ? dp[low + 1][high - 1] : 0);\n            }\n            dp[i][j] = ((v % MOD) + MOD) % MOD;\n        }\n    }\n    return (int) dp[0][n - 1];\n}`,
        cpp: `int countPalindromicSubsequences(string s) {\n    const long long MOD = 1000000007LL;\n    int n = (int) s.size();\n    vector<vector<int>> nxt(n + 1, vector<int>(4, n));\n    vector<vector<int>> prv(n + 1, vector<int>(4, -1));\n    for (int i = n - 1; i >= 0; i--) {\n        for (int c = 0; c < 4; c++) nxt[i][c] = nxt[i + 1][c];\n        nxt[i][s[i] - 'a'] = i;\n    }\n    for (int i = 0; i < n; i++) {\n        for (int c = 0; c < 4; c++) prv[i + 1][c] = prv[i][c];\n        prv[i + 1][s[i] - 'a'] = i;\n    }\n    vector<vector<long long>> dp(n, vector<long long>(n, 0));\n    for (int i = 0; i < n; i++) dp[i][i] = 1;\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            long long inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0;\n            long long v;\n            if (s[i] != s[j]) {\n                v = dp[i + 1][j] + dp[i][j - 1] - inner;\n            } else {\n                int c = s[i] - 'a';\n                int low = nxt[i + 1][c], high = prv[j][c];\n                if (low > high) v = 2 * inner + 2;\n                else if (low == high) v = 2 * inner + 1;\n                else v = 2 * inner - (low + 1 <= high - 1 ? dp[low + 1][high - 1] : 0);\n            }\n            dp[i][j] = ((v % MOD) + MOD) % MOD;\n        }\n    }\n    return (int) dp[0][n - 1];\n}`,
        c: `int countPalindromicSubsequences(char* s) {\n    const long long MOD = 1000000007LL;\n    int n = (int) strlen(s);\n    int* nxt = (int*) malloc((size_t) (n + 1) * 4 * sizeof(int));\n    int* prv = (int*) malloc((size_t) (n + 1) * 4 * sizeof(int));\n    for (int c = 0; c < 4; c++) {\n        nxt[n * 4 + c] = n;\n        prv[0 * 4 + c] = -1;\n    }\n    for (int i = n - 1; i >= 0; i--) {\n        for (int c = 0; c < 4; c++) nxt[i * 4 + c] = nxt[(i + 1) * 4 + c];\n        nxt[i * 4 + (s[i] - 'a')] = i;\n    }\n    for (int i = 0; i < n; i++) {\n        for (int c = 0; c < 4; c++) prv[(i + 1) * 4 + c] = prv[i * 4 + c];\n        prv[(i + 1) * 4 + (s[i] - 'a')] = i;\n    }\n    long long* dp = (long long*) calloc((size_t) n * (size_t) n, sizeof(long long));\n    for (int i = 0; i < n; i++) dp[i * n + i] = 1;\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            long long inner = i + 1 <= j - 1 ? dp[(i + 1) * n + (j - 1)] : 0;\n            long long v;\n            if (s[i] != s[j]) {\n                v = dp[(i + 1) * n + j] + dp[i * n + (j - 1)] - inner;\n            } else {\n                int c = s[i] - 'a';\n                int low = nxt[(i + 1) * 4 + c], high = prv[j * 4 + c];\n                if (low > high) v = 2 * inner + 2;\n                else if (low == high) v = 2 * inner + 1;\n                else v = 2 * inner - (low + 1 <= high - 1 ? dp[(low + 1) * n + (high - 1)] : 0);\n            }\n            dp[i * n + j] = ((v % MOD) + MOD) % MOD;\n        }\n    }\n    int answer = (int) dp[0 * n + (n - 1)];\n    free(nxt);\n    free(prv);\n    free(dp);\n    return answer;\n}`,
        csharp: `public static int CountPalindromicSubsequences(string s)\n{\n    const long MOD = 1000000007L;\n    int n = s.Length;\n    var nxt = new int[n + 1, 4];\n    var prv = new int[n + 1, 4];\n    for (int c = 0; c < 4; c++)\n    {\n        nxt[n, c] = n;\n        prv[0, c] = -1;\n    }\n    for (int i = n - 1; i >= 0; i--)\n    {\n        for (int c = 0; c < 4; c++) nxt[i, c] = nxt[i + 1, c];\n        nxt[i, s[i] - 'a'] = i;\n    }\n    for (int i = 0; i < n; i++)\n    {\n        for (int c = 0; c < 4; c++) prv[i + 1, c] = prv[i, c];\n        prv[i + 1, s[i] - 'a'] = i;\n    }\n    var dp = new long[n, n];\n    for (int i = 0; i < n; i++) dp[i, i] = 1;\n    for (int len = 2; len <= n; len++)\n    {\n        for (int i = 0; i + len - 1 < n; i++)\n        {\n            int j = i + len - 1;\n            long inner = i + 1 <= j - 1 ? dp[i + 1, j - 1] : 0;\n            long v;\n            if (s[i] != s[j])\n            {\n                v = dp[i + 1, j] + dp[i, j - 1] - inner;\n            }\n            else\n            {\n                int c = s[i] - 'a';\n                int low = nxt[i + 1, c], high = prv[j, c];\n                if (low > high) v = 2 * inner + 2;\n                else if (low == high) v = 2 * inner + 1;\n                else v = 2 * inner - (low + 1 <= high - 1 ? dp[low + 1, high - 1] : 0);\n            }\n            dp[i, j] = ((v % MOD) + MOD) % MOD;\n        }\n    }\n    return (int) dp[0, n - 1];\n}`,
        go: `func countPalindromicSubsequences(s string) int {\n\tconst MOD = 1000000007\n\tn := len(s)\n\tnxt := make([][4]int, n+1)\n\tprv := make([][4]int, n+1)\n\tfor c := 0; c < 4; c++ {\n\t\tnxt[n][c] = n\n\t\tprv[0][c] = -1\n\t}\n\tfor i := n - 1; i >= 0; i-- {\n\t\tfor c := 0; c < 4; c++ {\n\t\t\tnxt[i][c] = nxt[i+1][c]\n\t\t}\n\t\tnxt[i][s[i]-'a'] = i\n\t}\n\tfor i := 0; i < n; i++ {\n\t\tfor c := 0; c < 4; c++ {\n\t\t\tprv[i+1][c] = prv[i][c]\n\t\t}\n\t\tprv[i+1][s[i]-'a'] = i\n\t}\n\tdp := make([][]int, n)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, n)\n\t\tdp[i][i] = 1\n\t}\n\tfor length := 2; length <= n; length++ {\n\t\tfor i := 0; i+length-1 < n; i++ {\n\t\t\tj := i + length - 1\n\t\t\tinner := 0\n\t\t\tif i+1 <= j-1 {\n\t\t\t\tinner = dp[i+1][j-1]\n\t\t\t}\n\t\t\tv := 0\n\t\t\tif s[i] != s[j] {\n\t\t\t\tv = dp[i+1][j] + dp[i][j-1] - inner\n\t\t\t} else {\n\t\t\t\tc := int(s[i] - 'a')\n\t\t\t\tlow, high := nxt[i+1][c], prv[j][c]\n\t\t\t\tif low > high {\n\t\t\t\t\tv = 2*inner + 2\n\t\t\t\t} else if low == high {\n\t\t\t\t\tv = 2*inner + 1\n\t\t\t\t} else {\n\t\t\t\t\tdeduct := 0\n\t\t\t\t\tif low+1 <= high-1 {\n\t\t\t\t\t\tdeduct = dp[low+1][high-1]\n\t\t\t\t\t}\n\t\t\t\t\tv = 2*inner - deduct\n\t\t\t\t}\n\t\t\t}\n\t\t\tdp[i][j] = ((v % MOD) + MOD) % MOD\n\t\t}\n\t}\n\treturn dp[0][n-1]\n}`,
        kotlin: `fun countPalindromicSubsequences(s: String): Int {\n    val mod = 1000000007L\n    val n = s.length\n    val nxt = Array(n + 1) { IntArray(4) { n } }\n    val prv = Array(n + 1) { IntArray(4) { -1 } }\n    for (i in n - 1 downTo 0) {\n        for (c in 0 until 4) nxt[i][c] = nxt[i + 1][c]\n        nxt[i][s[i] - 'a'] = i\n    }\n    for (i in 0 until n) {\n        for (c in 0 until 4) prv[i + 1][c] = prv[i][c]\n        prv[i + 1][s[i] - 'a'] = i\n    }\n    val dp = Array(n) { LongArray(n) }\n    for (i in 0 until n) dp[i][i] = 1\n    for (len in 2..n) {\n        for (i in 0..n - len) {\n            val j = i + len - 1\n            val inner = if (i + 1 <= j - 1) dp[i + 1][j - 1] else 0L\n            val v: Long\n            if (s[i] != s[j]) {\n                v = dp[i + 1][j] + dp[i][j - 1] - inner\n            } else {\n                val c = s[i] - 'a'\n                val low = nxt[i + 1][c]\n                val high = prv[j][c]\n                v = when {\n                    low > high -> 2 * inner + 2\n                    low == high -> 2 * inner + 1\n                    else -> 2 * inner - (if (low + 1 <= high - 1) dp[low + 1][high - 1] else 0L)\n                }\n            }\n            dp[i][j] = ((v % mod) + mod) % mod\n        }\n    }\n    return dp[0][n - 1].toInt()\n}`,
        swift: `func countPalindromicSubsequences(_ s: String) -> Int {\n    let mod = 1000000007\n    let chars = Array(s)\n    let n = chars.count\n    let base = Int(Character("a").asciiValue!)\n    var nxt = [[Int]](repeating: [Int](repeating: n, count: 4), count: n + 1)\n    var prv = [[Int]](repeating: [Int](repeating: -1, count: 4), count: n + 1)\n    var i = n - 1\n    while i >= 0 {\n        for c in 0..<4 { nxt[i][c] = nxt[i + 1][c] }\n        nxt[i][Int(chars[i].asciiValue!) - base] = i\n        i -= 1\n    }\n    for i in 0..<n {\n        for c in 0..<4 { prv[i + 1][c] = prv[i][c] }\n        prv[i + 1][Int(chars[i].asciiValue!) - base] = i\n    }\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n    for i in 0..<n { dp[i][i] = 1 }\n    if n >= 2 {\n        for len in 2...n {\n            for i in 0...(n - len) {\n                let j = i + len - 1\n                let inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0\n                var v = 0\n                if chars[i] != chars[j] {\n                    v = dp[i + 1][j] + dp[i][j - 1] - inner\n                } else {\n                    let c = Int(chars[i].asciiValue!) - base\n                    let low = nxt[i + 1][c]\n                    let high = prv[j][c]\n                    if low > high { v = 2 * inner + 2 }\n                    else if low == high { v = 2 * inner + 1 }\n                    else { v = 2 * inner - (low + 1 <= high - 1 ? dp[low + 1][high - 1] : 0) }\n                }\n                dp[i][j] = ((v % mod) + mod) % mod\n            }\n        }\n    }\n    return dp[0][n - 1]\n}`,
        rust: `fn countPalindromicSubsequences(s: String) -> i32 {\n    const MOD: i64 = 1000000007;\n    let chars: Vec<char> = s.chars().collect();\n    let n = chars.len();\n    let mut nxt = vec![[n as i32; 4]; n + 1];\n    let mut prv = vec![[-1i32; 4]; n + 1];\n    for i in (0..n).rev() {\n        nxt[i] = nxt[i + 1];\n        nxt[i][(chars[i] as u8 - b'a') as usize] = i as i32;\n    }\n    for i in 0..n {\n        prv[i + 1] = prv[i];\n        prv[i + 1][(chars[i] as u8 - b'a') as usize] = i as i32;\n    }\n    let mut dp = vec![vec![0i64; n]; n];\n    for i in 0..n {\n        dp[i][i] = 1;\n    }\n    for len in 2..=n {\n        for i in 0..=(n - len) {\n            let j = i + len - 1;\n            let inner = if i + 1 <= j - 1 { dp[i + 1][j - 1] } else { 0 };\n            let v: i64;\n            if chars[i] != chars[j] {\n                v = dp[i + 1][j] + dp[i][j - 1] - inner;\n            } else {\n                let c = (chars[i] as u8 - b'a') as usize;\n                let low = nxt[i + 1][c];\n                let high = prv[j][c];\n                if low > high {\n                    v = 2 * inner + 2;\n                } else if low == high {\n                    v = 2 * inner + 1;\n                } else {\n                    let lo = low as usize;\n                    let hi = high as usize;\n                    let deduct = if lo + 1 <= hi - 1 { dp[lo + 1][hi - 1] } else { 0 };\n                    v = 2 * inner - deduct;\n                }\n            }\n            dp[i][j] = ((v % MOD) + MOD) % MOD;\n        }\n    }\n    dp[0][n - 1] as i32\n}`,
        php: `function countPalindromicSubsequences($s) {\n    $MOD = 1000000007;\n    $n = strlen($s);\n    $nxt = [];\n    $prv = [];\n    for ($i = 0; $i <= $n; $i++) {\n        $nxt[$i] = array_fill(0, 4, $n);\n        $prv[$i] = array_fill(0, 4, -1);\n    }\n    for ($i = $n - 1; $i >= 0; $i--) {\n        for ($c = 0; $c < 4; $c++) $nxt[$i][$c] = $nxt[$i + 1][$c];\n        $nxt[$i][ord($s[$i]) - 97] = $i;\n    }\n    for ($i = 0; $i < $n; $i++) {\n        for ($c = 0; $c < 4; $c++) $prv[$i + 1][$c] = $prv[$i][$c];\n        $prv[$i + 1][ord($s[$i]) - 97] = $i;\n    }\n    $dp = [];\n    for ($i = 0; $i < $n; $i++) $dp[$i] = array_fill(0, $n, 0);\n    for ($i = 0; $i < $n; $i++) $dp[$i][$i] = 1;\n    for ($len = 2; $len <= $n; $len++) {\n        for ($i = 0; $i + $len - 1 < $n; $i++) {\n            $j = $i + $len - 1;\n            $inner = $i + 1 <= $j - 1 ? $dp[$i + 1][$j - 1] : 0;\n            if ($s[$i] !== $s[$j]) {\n                $v = $dp[$i + 1][$j] + $dp[$i][$j - 1] - $inner;\n            } else {\n                $c = ord($s[$i]) - 97;\n                $low = $nxt[$i + 1][$c];\n                $high = $prv[$j][$c];\n                if ($low > $high) $v = 2 * $inner + 2;\n                elseif ($low === $high) $v = 2 * $inner + 1;\n                else $v = 2 * $inner - ($low + 1 <= $high - 1 ? $dp[$low + 1][$high - 1] : 0);\n            }\n            $dp[$i][$j] = (($v % $MOD) + $MOD) % $MOD;\n        }\n    }\n    return $dp[0][$n - 1];\n}`,
        ruby: `def countPalindromicSubsequences(s)\n  mod = 1000000007\n  n = s.length\n  nxt = Array.new(n + 1) { Array.new(4, n) }\n  prv = Array.new(n + 1) { Array.new(4, -1) }\n  (n - 1).downto(0) do |i|\n    (0...4).each { |c| nxt[i][c] = nxt[i + 1][c] }\n    nxt[i][s[i].ord - 97] = i\n  end\n  (0...n).each do |i|\n    (0...4).each { |c| prv[i + 1][c] = prv[i][c] }\n    prv[i + 1][s[i].ord - 97] = i\n  end\n  dp = Array.new(n) { Array.new(n, 0) }\n  (0...n).each { |i| dp[i][i] = 1 }\n  (2..n).each do |len|\n    (0..(n - len)).each do |i|\n      j = i + len - 1\n      inner = i + 1 <= j - 1 ? dp[i + 1][j - 1] : 0\n      if s[i] != s[j]\n        v = dp[i + 1][j] + dp[i][j - 1] - inner\n      else\n        c = s[i].ord - 97\n        low = nxt[i + 1][c]\n        high = prv[j][c]\n        if low > high\n          v = 2 * inner + 2\n        elsif low == high\n          v = 2 * inner + 1\n        else\n          v = 2 * inner - (low + 1 <= high - 1 ? dp[low + 1][high - 1] : 0)\n        end\n      end\n      dp[i][j] = ((v % mod) + mod) % mod\n    end\n  end\n  dp[0][n - 1]\nend`,
      },
    };
  })(),

  // ── Special Binary String (LC 761) ──────────────────────────────
  (() => {
    const ref = (s: string): string => {
      let count = 0, start = 0;
      const subs: string[] = [];
      for (let j = 0; j < s.length; j++) {
        count += s.charAt(j) === "1" ? 1 : -1;
        if (count === 0) {
          subs.push("1" + ref(s.substring(start + 1, j)) + "0");
          start = j + 1;
        }
      }
      subs.sort();
      subs.reverse();
      return subs.join("");
    };
    return {
      slug: "special-binary-string",
      title: "Special Binary String",
      difficulty: "HARD" as const,
      tags: ["String", "Recursion", "Divide and Conquer", "Greedy", "Google", "Amazon", "Meta"],
      signature: { funcName: "makeLargestSpecial", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A binary string is **special** when it has an equal number of `0`s and `1`s **and** every prefix has at least as many `1`s as `0`s.\n\nYou may repeatedly choose two **consecutive, non-empty, special** substrings of `s` and swap them. Return the lexicographically largest string reachable.",
        [
          { in: 's = "11011000"', out: "11100100", note: "The two inner special pieces `10` and `1100` swap, putting the larger one first." },
          { in: 's = "101100"', out: "110010", note: "`10` and `1100` are consecutive special substrings; swapping them wins." },
          { in: 's = "10"', out: "10", note: "Nothing to swap." },
        ],
        ["1 <= s.length <= 50", "s[i] is either '0' or '1'.", "s is a special binary string."]),
      hints: [
        "Think of `1` as an opening bracket and `0` as a closing one: a special string is exactly a balanced bracket sequence.",
        "Split `s` into its **top-level** special pieces — each begins where the running balance leaves 0 and ends where it returns to 0.",
        "Each piece is `1 + inner + 0`. Solve `inner` recursively, then sort the pieces in descending order and concatenate.",
      ],
      editorial: explain({
        idea: "Read the string as balanced brackets. Split it into top-level special pieces, recursively make each piece's **interior** as large as possible, then sort the pieces descending and join them.",
        steps: [
          "Walk `s`, adding 1 for `'1'` and subtracting 1 for `'0'`.",
          "Every time the running balance returns to 0, a top-level piece `s[start..j]` has closed.",
          "Rebuild that piece as `\"1\" + solve(s[start+1..j-1]) + \"0\"`.",
          "Sort the pieces in descending lexicographic order and concatenate them.",
        ],
        why: "The swap operation is exactly \"reorder sibling pieces\", so at every nesting level the pieces are freely permutable and the largest-first order is optimal. Recursing into the interior first is what makes the sort correct: comparing two pieces only decides the answer once each is already in its own best form. And because every piece starts with `1` and ends with `0`, no piece is a prefix of another, so the descending sort has no ties to break.",
        time: "O(n² log n) in the worst case, from string building and sorting at each level",
        space: "O(n²) across the recursion",
        pitfalls: [
          "Sort the pieces **after** recursing into them, not before.",
          "The recursive call takes the strict interior `s[start+1..j-1]`, not the whole piece — otherwise it never terminates.",
          "Sorting ascending and reversing is the same as descending here, but a plain ascending sort is the common slip.",
        ],
      }),
      examples: [
        { input: '"11011000"', expectedOutput: "11100100" },
        { input: '"101100"', expectedOutput: "110010" },
        { input: '"10"', expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        // Build a random balanced sequence: '1' opens, '0' closes.
        const pairs = ri(rng, 1, 8);
        let ones = pairs, zeros = pairs, open = 0, s = "";
        while (ones + zeros > 0) {
          if (ones > 0 && (open === 0 || rng() < 0.5)) { s += "1"; ones--; open++; }
          else { s += "0"; zeros--; open--; }
        }
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def makeLargestSpecial(s: str) -> str:\n    count = 0\n    start = 0\n    subs = []\n    for j, c in enumerate(s):\n        count += 1 if c == "1" else -1\n        if count == 0:\n            subs.append("1" + makeLargestSpecial(s[start + 1:j]) + "0")\n            start = j + 1\n    subs.sort(reverse=True)\n    return "".join(subs)`,
        javascript: `var makeLargestSpecial = function(s) {\n    var count = 0, start = 0;\n    var subs = [];\n    for (var j = 0; j < s.length; j++) {\n        count += s.charAt(j) === "1" ? 1 : -1;\n        if (count === 0) {\n            subs.push("1" + makeLargestSpecial(s.substring(start + 1, j)) + "0");\n            start = j + 1;\n        }\n    }\n    subs.sort();\n    subs.reverse();\n    return subs.join("");\n};`,
        typescript: `function makeLargestSpecial(s: string): string {\n    var count = 0, start = 0;\n    var subs: string[] = [];\n    for (var j = 0; j < s.length; j++) {\n        count += s.charAt(j) === "1" ? 1 : -1;\n        if (count === 0) {\n            subs.push("1" + makeLargestSpecial(s.substring(start + 1, j)) + "0");\n            start = j + 1;\n        }\n    }\n    subs.sort();\n    subs.reverse();\n    return subs.join("");\n}`,
        java: `public static String makeLargestSpecial(String s) {\n    int count = 0, start = 0;\n    List<String> subs = new ArrayList<>();\n    for (int j = 0; j < s.length(); j++) {\n        count += s.charAt(j) == '1' ? 1 : -1;\n        if (count == 0) {\n            subs.add("1" + makeLargestSpecial(s.substring(start + 1, j)) + "0");\n            start = j + 1;\n        }\n    }\n    subs.sort(Collections.reverseOrder());\n    StringBuilder sb = new StringBuilder();\n    for (String piece : subs) sb.append(piece);\n    return sb.toString();\n}`,
        cpp: `string makeLargestSpecial(string s) {\n    int count = 0, start = 0;\n    vector<string> subs;\n    for (int j = 0; j < (int) s.size(); j++) {\n        count += s[j] == '1' ? 1 : -1;\n        if (count == 0) {\n            subs.push_back("1" + makeLargestSpecial(s.substr(start + 1, j - start - 1)) + "0");\n            start = j + 1;\n        }\n    }\n    sort(subs.begin(), subs.end(), greater<string>());\n    string out;\n    for (auto& piece : subs) out += piece;\n    return out;\n}`,
        c: `static int mlsCmp(const void* a, const void* b) {\n    char* const* x = (char* const*) a;\n    char* const* y = (char* const*) b;\n    return strcmp(*y, *x);\n}\n\nchar* makeLargestSpecial(char* s) {\n    int n = (int) strlen(s);\n    char** subs = (char**) malloc((size_t) (n / 2 + 1) * sizeof(char*));\n    int total = 0, count = 0, start = 0;\n    for (int j = 0; j < n; j++) {\n        count += s[j] == '1' ? 1 : -1;\n        if (count == 0) {\n            int innerLen = j - start - 1;\n            char* inner = (char*) malloc((size_t) innerLen + 1);\n            memcpy(inner, s + start + 1, (size_t) innerLen);\n            inner[innerLen] = '\\0';\n            char* solved = makeLargestSpecial(inner);\n            free(inner);\n            size_t sl = strlen(solved);\n            char* piece = (char*) malloc(sl + 3);\n            piece[0] = '1';\n            memcpy(piece + 1, solved, sl);\n            piece[sl + 1] = '0';\n            piece[sl + 2] = '\\0';\n            free(solved);\n            subs[total++] = piece;\n            start = j + 1;\n        }\n    }\n    qsort(subs, (size_t) total, sizeof(char*), mlsCmp);\n    char* out = (char*) malloc((size_t) n + 1);\n    int len = 0;\n    for (int i = 0; i < total; i++) {\n        size_t pl = strlen(subs[i]);\n        memcpy(out + len, subs[i], pl);\n        len += (int) pl;\n        free(subs[i]);\n    }\n    out[len] = '\\0';\n    free(subs);\n    return out;\n}`,
        csharp: `public static string MakeLargestSpecial(string s)\n{\n    int count = 0, start = 0;\n    var subs = new List<string>();\n    for (int j = 0; j < s.Length; j++)\n    {\n        count += s[j] == '1' ? 1 : -1;\n        if (count == 0)\n        {\n            subs.Add("1" + MakeLargestSpecial(s.Substring(start + 1, j - start - 1)) + "0");\n            start = j + 1;\n        }\n    }\n    subs.Sort(StringComparer.Ordinal);\n    subs.Reverse();\n    return string.Concat(subs);\n}`,
        go: `func makeLargestSpecial(s string) string {\n\tcount, start := 0, 0\n\tsubs := []string{}\n\tfor j := 0; j < len(s); j++ {\n\t\tif s[j] == '1' {\n\t\t\tcount++\n\t\t} else {\n\t\t\tcount--\n\t\t}\n\t\tif count == 0 {\n\t\t\tsubs = append(subs, "1"+makeLargestSpecial(s[start+1:j])+"0")\n\t\t\tstart = j + 1\n\t\t}\n\t}\n\tsort.Sort(sort.Reverse(sort.StringSlice(subs)))\n\tout := ""\n\tfor _, piece := range subs {\n\t\tout += piece\n\t}\n\treturn out\n}`,
        kotlin: `fun makeLargestSpecial(s: String): String {\n    var count = 0\n    var start = 0\n    val subs = mutableListOf<String>()\n    for (j in s.indices) {\n        count += if (s[j] == '1') 1 else -1\n        if (count == 0) {\n            subs.add("1" + makeLargestSpecial(s.substring(start + 1, j)) + "0")\n            start = j + 1\n        }\n    }\n    subs.sortDescending()\n    return subs.joinToString("")\n}`,
        swift: `func makeLargestSpecial(_ s: String) -> String {\n    let chars = Array(s)\n    var count = 0\n    var start = 0\n    var subs = [String]()\n    for j in 0..<chars.count {\n        count += chars[j] == "1" ? 1 : -1\n        if count == 0 {\n            let inner = String(chars[(start + 1)..<j])\n            subs.append("1" + makeLargestSpecial(inner) + "0")\n            start = j + 1\n        }\n    }\n    subs.sort(by: >)\n    return subs.joined()\n}`,
        rust: `fn makeLargestSpecial(s: String) -> String {\n    let b = s.as_bytes();\n    let mut count = 0i32;\n    let mut start = 0usize;\n    let mut subs: Vec<String> = Vec::new();\n    for j in 0..b.len() {\n        count += if b[j] == b'1' { 1 } else { -1 };\n        if count == 0 {\n            let inner = s[(start + 1)..j].to_string();\n            subs.push(format!("1{}0", makeLargestSpecial(inner)));\n            start = j + 1;\n        }\n    }\n    subs.sort();\n    subs.reverse();\n    subs.concat()\n}`,
        php: `function makeLargestSpecial($s) {\n    $count = 0;\n    $start = 0;\n    $subs = [];\n    for ($j = 0; $j < strlen($s); $j++) {\n        $count += $s[$j] === "1" ? 1 : -1;\n        if ($count === 0) {\n            $subs[] = "1" . makeLargestSpecial(substr($s, $start + 1, $j - $start - 1)) . "0";\n            $start = $j + 1;\n        }\n    }\n    rsort($subs, SORT_STRING);\n    return implode("", $subs);\n}`,
        ruby: `def makeLargestSpecial(s)\n  count = 0\n  start = 0\n  subs = []\n  s.each_char.with_index do |c, j|\n    count += c == "1" ? 1 : -1\n    if count == 0\n      subs << "1" + makeLargestSpecial(s[(start + 1)...j]) + "0"\n      start = j + 1\n    end\n  end\n  subs.sort.reverse.join\nend`,
      },
    };
  })(),
];
