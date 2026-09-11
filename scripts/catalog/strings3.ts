/**
 * Strings — wave 3.
 *
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks /
 * PrepInsta string set that Indian hiring rounds draw from.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, explain, fmtStrArr, pick, ri, randLower, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const STRING3_PROBLEMS: CatalogProblem[] = [

  // ── To Lower Case (LC 709) ──────────────────────────────────────
  (() => {
    const ref = (s: string) =>
      s.split("").map((c) => (c >= "A" && c <= "Z" ? String.fromCharCode(c.charCodeAt(0) + 32) : c)).join("");
    return {
      slug: "to-lower-case",
      title: "To Lower Case",
      difficulty: "EASY" as const,
      tags: ["String", "LeetCode 709", "Amazon", "TCS", "Infosys"],
      signature: { funcName: "toLowerCase", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given a string `s`, return it with every uppercase letter converted to lowercase. All other characters are left unchanged.\n\nSolve it without relying on a built-in case-conversion routine.",
        [
          { in: 's = "Hello"', out: "hello" },
          { in: 's = "here"', out: "here", note: "Already lowercase, so nothing changes." },
          { in: 's = "LOVELY"', out: "lovely" },
        ],
        ["1 <= s.length <= 100", "s consists of printable ASCII characters."]),
      hints: [
        "In ASCII, `'A'` is 65 and `'a'` is 97 — a fixed distance of 32.",
        "Only characters in the range `'A'..'Z'` need shifting.",
        "Leave digits, spaces and punctuation exactly as they are.",
      ],
      editorial: explain({
        idea: "ASCII places the uppercase block immediately before the lowercase block with a constant gap of 32, so case conversion is a single addition on the qualifying characters.",
        steps: [
          "Walk the string one character at a time.",
          "If the character lies between `'A'` and `'Z'`, add 32 to its code point.",
          "Otherwise copy it through untouched.",
        ],
        why: "`'a' - 'A' == 32` holds for every letter in ASCII, so the same offset works across the whole alphabet — no lookup table needed.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Adding 32 unconditionally corrupts digits and punctuation.",
          "Using the bitwise trick `c | 32` also mangles non-letters, so it still needs the range guard.",
        ],
      }),
      examples: [
        { input: '"Hello"', expectedOutput: "hello" },
        { input: '"here"', expectedOutput: "here" },
        { input: '"LOVELY"', expectedOutput: "lovely" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,!";
        const n = ri(rng, 1, 40);
        const s = Array.from({ length: n }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");
        return { input: JSON.stringify(s), expectedOutput: ref(s) };
      },
      solutions: {
        python: `def toLowerCase(s: str) -> str:\n    out = []\n    for c in s:\n        if 'A' <= c <= 'Z':\n            out.append(chr(ord(c) + 32))\n        else:\n            out.append(c)\n    return ''.join(out)`,
        javascript: `var toLowerCase = function(s) {\n    let out = "";\n    for (let i = 0; i < s.length; i++) {\n        const code = s.charCodeAt(i);\n        if (code >= 65 && code <= 90) out += String.fromCharCode(code + 32);\n        else out += s.charAt(i);\n    }\n    return out;\n};`,
        typescript: `function toLowerCase(s: string): string {\n    var out = "";\n    for (var i = 0; i < s.length; i++) {\n        var code = s.charCodeAt(i);\n        if (code >= 65 && code <= 90) out += String.fromCharCode(code + 32);\n        else out += s.charAt(i);\n    }\n    return out;\n}`,
        java: `public static String toLowerCase(String s) {\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        if (c >= 'A' && c <= 'Z') sb.append((char) (c + 32));\n        else sb.append(c);\n    }\n    return sb.toString();\n}`,
        cpp: `string toLowerCase(string s) {\n    string out;\n    for (char c : s) {\n        if (c >= 'A' && c <= 'Z') out += (char) (c + 32);\n        else out += c;\n    }\n    return out;\n}`,
        c: `char* toLowerCase(const char* s) {\n    int n = (int) strlen(s);\n    char* out = (char*) malloc(n + 1);\n    for (int i = 0; i < n; i++) {\n        char c = s[i];\n        out[i] = (c >= 'A' && c <= 'Z') ? (char) (c + 32) : c;\n    }\n    out[n] = '\\0';\n    return out;\n}`,
        csharp: `public static string ToLowerCase(string s)\n{\n    var sb = new System.Text.StringBuilder();\n    foreach (char c in s)\n    {\n        if (c >= 'A' && c <= 'Z') sb.Append((char) (c + 32));\n        else sb.Append(c);\n    }\n    return sb.ToString();\n}`,
        go: `func toLowerCase(s string) string {\n\tb := []byte(s)\n\tfor i := 0; i < len(b); i++ {\n\t\tif b[i] >= 'A' && b[i] <= 'Z' {\n\t\t\tb[i] += 32\n\t\t}\n\t}\n\treturn string(b)\n}`,
        kotlin: `fun toLowerCase(s: String): String {\n    val sb = StringBuilder()\n    for (c in s) {\n        if (c >= 'A' && c <= 'Z') sb.append((c.toInt() + 32).toChar())\n        else sb.append(c)\n    }\n    return sb.toString()\n}`,
        swift: `func toLowerCase(_ s: String) -> String {\n    var out = ""\n    for u in s.unicodeScalars {\n        if u.value >= 65 && u.value <= 90 {\n            out.append(Character(UnicodeScalar(u.value + 32)!))\n        } else {\n            out.append(Character(u))\n        }\n    }\n    return out\n}`,
        rust: `fn toLowerCase(s: String) -> String {\n    let mut out = String::new();\n    for b in s.bytes() {\n        if b >= b'A' && b <= b'Z' {\n            out.push((b + 32) as char);\n        } else {\n            out.push(b as char);\n        }\n    }\n    out\n}`,
        php: `function toLowerCase($s) {\n    $out = "";\n    for ($i = 0; $i < strlen($s); $i++) {\n        $c = ord($s[$i]);\n        if ($c >= 65 && $c <= 90) $out .= chr($c + 32);\n        else $out .= $s[$i];\n    }\n    return $out;\n}`,
        ruby: `def toLowerCase(s)\n  out = ""\n  s.each_char do |c|\n    code = c.ord\n    if code >= 65 && code <= 90\n      out << (code + 32).chr\n    else\n      out << c\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Reverse Only Letters (LC 917) ───────────────────────────────
  (() => {
    const isLetter = (c: string) => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
    const ref = (s: string) => {
      const a = s.split("");
      let i = 0, j = a.length - 1;
      while (i < j) {
        if (!isLetter(a[i])) i++;
        else if (!isLetter(a[j])) j--;
        else { const t = a[i]; a[i] = a[j]; a[j] = t; i++; j--; }
      }
      return a.join("");
    };
    return {
      slug: "reverse-only-letters",
      title: "Reverse Only Letters",
      difficulty: "EASY" as const,
      tags: ["String", "Two Pointers", "LeetCode 917", "Amazon", "Adobe"],
      signature: { funcName: "reverseOnlyLetters", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given a string `s`, reverse the order of the **English letters** in it while leaving every non-letter character at its original index.\n\nReturn the resulting string.",
        [
          { in: 's = "ab-cd"', out: "dc-ba", note: "The dash stays at index 2; the letters a,b,c,d reverse to d,c,b,a." },
          { in: 's = "a-bC-dEf-ghIj"', out: "j-Ih-gfE-dCba" },
          { in: 's = "Test1ng-Leet-code-Q!"', out: "Qedo1ct-eeLg-ntse-T!" },
        ],
        ["1 <= s.length <= 100", "s consists of ASCII characters and contains no backslash or double quote."]),
      hints: [
        "Two pointers, one at each end, is the natural fit.",
        "Advance a pointer past any non-letter without swapping.",
        "Swap only when **both** pointers sit on letters.",
      ],
      editorial: explain({
        idea: "Non-letters are fixed points: the letters must reverse among themselves, which is exactly what a two-pointer swap does when it skips over everything else.",
        steps: [
          "Convert the string to a mutable character array.",
          "Place `i` at the start and `j` at the end.",
          "If `s[i]` is not a letter, advance `i`; if `s[j]` is not a letter, retreat `j`.",
          "When both are letters, swap them and move both pointers inward.",
          "Stop when `i >= j` and join the array.",
        ],
        why: "Each swap pairs the `k`-th letter from the left with the `k`-th from the right, which is precisely a reversal of the letter subsequence; skipped positions are never written, so non-letters keep their indices.",
        time: "O(n)",
        space: "O(n) for the character array",
        pitfalls: [
          "Advancing both pointers on every iteration mis-pairs the letters when non-letters are unevenly distributed.",
          "The letter test must accept both cases — `a-z` and `A-Z`.",
          "Reversing the whole string and then re-inserting non-letters is far more fiddly and easy to get wrong.",
        ],
      }),
      examples: [
        { input: '"ab-cd"', expectedOutput: "dc-ba" },
        { input: '"a-bC-dEf-ghIj"', expectedOutput: "j-Ih-gfE-dCba" },
        { input: '"Test1ng-Leet-code-Q!"', expectedOutput: "Qedo1ct-eeLg-ntse-T!" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-!?.";
        const n = ri(rng, 1, 40);
        const s = Array.from({ length: n }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");
        return { input: JSON.stringify(s), expectedOutput: ref(s) };
      },
      solutions: {
        python: `def reverseOnlyLetters(s: str) -> str:\n    a = list(s)\n    i, j = 0, len(a) - 1\n    while i < j:\n        if not a[i].isalpha():\n            i += 1\n        elif not a[j].isalpha():\n            j -= 1\n        else:\n            a[i], a[j] = a[j], a[i]\n            i += 1\n            j -= 1\n    return ''.join(a)`,
        javascript: `var reverseOnlyLetters = function(s) {\n    function isLetter(c) {\n        return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");\n    }\n    const a = s.split("");\n    let i = 0, j = a.length - 1;\n    while (i < j) {\n        if (!isLetter(a[i])) i++;\n        else if (!isLetter(a[j])) j--;\n        else {\n            const t = a[i];\n            a[i] = a[j];\n            a[j] = t;\n            i++;\n            j--;\n        }\n    }\n    return a.join("");\n};`,
        typescript: `function reverseOnlyLetters(s: string): string {\n    function isLetter(c: string): boolean {\n        return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");\n    }\n    var a = s.split("");\n    var i = 0, j = a.length - 1;\n    while (i < j) {\n        if (!isLetter(a[i])) i++;\n        else if (!isLetter(a[j])) j--;\n        else {\n            var t = a[i];\n            a[i] = a[j];\n            a[j] = t;\n            i++;\n            j--;\n        }\n    }\n    return a.join("");\n}`,
        java: `public static String reverseOnlyLetters(String s) {\n    char[] a = s.toCharArray();\n    int i = 0, j = a.length - 1;\n    while (i < j) {\n        if (!Character.isLetter(a[i])) i++;\n        else if (!Character.isLetter(a[j])) j--;\n        else {\n            char t = a[i];\n            a[i] = a[j];\n            a[j] = t;\n            i++;\n            j--;\n        }\n    }\n    return new String(a);\n}`,
        cpp: `bool isLetterROL(char c) {\n    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');\n}\n\nstring reverseOnlyLetters(string s) {\n    int i = 0, j = (int) s.size() - 1;\n    while (i < j) {\n        if (!isLetterROL(s[i])) i++;\n        else if (!isLetterROL(s[j])) j--;\n        else {\n            char t = s[i];\n            s[i] = s[j];\n            s[j] = t;\n            i++;\n            j--;\n        }\n    }\n    return s;\n}`,
        c: `static bool is_letter_rol(char c) {\n    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');\n}\n\nchar* reverseOnlyLetters(const char* s) {\n    int n = (int) strlen(s);\n    char* a = (char*) malloc(n + 1);\n    for (int k = 0; k < n; k++) a[k] = s[k];\n    a[n] = '\\0';\n    int i = 0, j = n - 1;\n    while (i < j) {\n        if (!is_letter_rol(a[i])) i++;\n        else if (!is_letter_rol(a[j])) j--;\n        else {\n            char t = a[i];\n            a[i] = a[j];\n            a[j] = t;\n            i++;\n            j--;\n        }\n    }\n    return a;\n}`,
        csharp: `public static string ReverseOnlyLetters(string s)\n{\n    char[] a = s.ToCharArray();\n    int i = 0, j = a.Length - 1;\n    while (i < j)\n    {\n        if (!char.IsLetter(a[i])) i++;\n        else if (!char.IsLetter(a[j])) j--;\n        else\n        {\n            char t = a[i];\n            a[i] = a[j];\n            a[j] = t;\n            i++;\n            j--;\n        }\n    }\n    return new string(a);\n}`,
        go: `func reverseOnlyLetters(s string) string {\n\tisLetter := func(c byte) bool {\n\t\treturn (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')\n\t}\n\ta := []byte(s)\n\ti, j := 0, len(a)-1\n\tfor i < j {\n\t\tif !isLetter(a[i]) {\n\t\t\ti++\n\t\t} else if !isLetter(a[j]) {\n\t\t\tj--\n\t\t} else {\n\t\t\ta[i], a[j] = a[j], a[i]\n\t\t\ti++\n\t\t\tj--\n\t\t}\n\t}\n\treturn string(a)\n}`,
        kotlin: `fun reverseOnlyLetters(s: String): String {\n    val a = s.toCharArray()\n    var i = 0\n    var j = a.size - 1\n    while (i < j) {\n        if (!a[i].isLetter()) i++\n        else if (!a[j].isLetter()) j--\n        else {\n            val t = a[i]\n            a[i] = a[j]\n            a[j] = t\n            i++\n            j--\n        }\n    }\n    return String(a)\n}`,
        swift: `func reverseOnlyLetters(_ s: String) -> String {\n    func isLetter(_ c: Character) -> Bool {\n        return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z")\n    }\n    var a = Array(s)\n    var i = 0\n    var j = a.count - 1\n    while i < j {\n        if !isLetter(a[i]) {\n            i += 1\n        } else if !isLetter(a[j]) {\n            j -= 1\n        } else {\n            a.swapAt(i, j)\n            i += 1\n            j -= 1\n        }\n    }\n    return String(a)\n}`,
        rust: `fn reverseOnlyLetters(s: String) -> String {\n    let mut a: Vec<u8> = s.into_bytes();\n    let is_letter = |c: u8| (c >= b'a' && c <= b'z') || (c >= b'A' && c <= b'Z');\n    let mut i = 0usize;\n    let mut j = a.len();\n    while j > 0 && i < j - 1 {\n        if !is_letter(a[i]) {\n            i += 1;\n        } else if !is_letter(a[j - 1]) {\n            j -= 1;\n        } else {\n            a.swap(i, j - 1);\n            i += 1;\n            j -= 1;\n        }\n    }\n    String::from_utf8(a).unwrap()\n}`,
        php: `function reverseOnlyLetters($s) {\n    $a = str_split($s);\n    $isLetter = function($c) {\n        return ($c >= 'a' && $c <= 'z') || ($c >= 'A' && $c <= 'Z');\n    };\n    $i = 0;\n    $j = count($a) - 1;\n    while ($i < $j) {\n        if (!$isLetter($a[$i])) $i++;\n        else if (!$isLetter($a[$j])) $j--;\n        else {\n            $t = $a[$i];\n            $a[$i] = $a[$j];\n            $a[$j] = $t;\n            $i++;\n            $j--;\n        }\n    }\n    return implode("", $a);\n}`,
        ruby: `def reverseOnlyLetters(s)\n  a = s.chars\n  letter = ->(c) { (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') }\n  i = 0\n  j = a.length - 1\n  while i < j\n    if !letter.call(a[i])\n      i += 1\n    elsif !letter.call(a[j])\n      j -= 1\n    else\n      a[i], a[j] = a[j], a[i]\n      i += 1\n      j -= 1\n    end\n  end\n  a.join\nend`,
      },
    };
  })(),

  // ── Long Pressed Name (LC 925) ──────────────────────────────────
  (() => {
    const ref = (name: string, typed: string) => {
      let i = 0, j = 0;
      while (j < typed.length) {
        if (i < name.length && name[i] === typed[j]) { i++; j++; }
        else if (j > 0 && typed[j] === typed[j - 1]) j++;
        else return false;
      }
      return i === name.length;
    };
    return {
      slug: "long-pressed-name",
      title: "Long Pressed Name",
      difficulty: "EASY" as const,
      tags: ["String", "Two Pointers", "LeetCode 925", "Amazon", "Google"],
      signature: {
        funcName: "isLongPressedName",
        params: [{ name: "name", type: "string" as const }, { name: "typed", type: "string" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "Your friend is typing `name` on a keyboard, but sometimes a key gets held down too long and its character is repeated one or more extra times.\n\nGiven `name` and the string `typed` that actually came out, return `true` if `typed` could have been produced this way.",
        [
          { in: 'name = "alex", typed = "aaleex"', out: "true", note: "The a and the e were long-pressed." },
          { in: 'name = "saeed", typed = "ssaaedd"', out: "false", note: "The e was typed only once but appears twice in the name." },
          { in: 'name = "leelee", typed = "lleeelee"', out: "true" },
        ],
        ["1 <= name.length, typed.length <= 1000", "Both strings consist of lowercase English letters only."]),
      hints: [
        "Walk both strings with two pointers, matching characters as they line up.",
        "When they differ, the only legal explanation is that the current `typed` character repeats the previous one.",
        "At the end, every character of `name` must have been consumed.",
      ],
      editorial: explain({
        idea: "Long-pressing only ever *inserts* copies of a character that was already typed, so a greedy left-to-right match works: consume `name` when characters agree, and otherwise allow a repeat of the previous `typed` character.",
        steps: [
          "Set `i` into `name` and `j` into `typed`, both at 0.",
          "If `name[i] == typed[j]`, advance both.",
          "Otherwise, if `typed[j]` equals `typed[j-1]`, it is a long-press artefact — advance `j` only.",
          "Otherwise return `false`.",
          "After the loop return `i == name.length` to confirm every character of `name` was matched.",
        ],
        why: "Matching greedily is safe because a character of `typed` that equals `name[i]` is always better used as the match than as a repeat — using it as a repeat would leave `name[i]` needing a later, identical character, which the repeat rule would also have accepted.",
        time: "O(n + m)",
        space: "O(1)",
        pitfalls: [
          "Forgetting the final `i == name.length` check accepts `name = \"alex\", typed = \"aaleexa\"`… and worse, accepts a `typed` that ran out early.",
          "Comparing against `typed[j-1]` requires `j > 0`.",
          "Counting character frequencies is not enough — order matters, and the run lengths must be at least as long in `typed`.",
        ],
      }),
      examples: [
        { input: '"alex"\n"aaleex"', expectedOutput: "true" },
        { input: '"saeed"\n"ssaaedd"', expectedOutput: "false" },
        { input: '"leelee"\n"lleeelee"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const name = randLower(rng, 1, 10, "abcde");
        let typed = "";
        if (rng() < 0.55) {
          for (const c of name) {
            const reps = rng() < 0.4 ? ri(rng, 2, 3) : 1;
            typed += c.repeat(reps);
          }
        } else {
          typed = randLower(rng, 1, 14, "abcde");
        }
        return { input: `${JSON.stringify(name)}\n${JSON.stringify(typed)}`, expectedOutput: bool(ref(name, typed)) };
      },
      solutions: {
        python: `def isLongPressedName(name: str, typed: str) -> bool:\n    i = 0\n    j = 0\n    while j < len(typed):\n        if i < len(name) and name[i] == typed[j]:\n            i += 1\n            j += 1\n        elif j > 0 and typed[j] == typed[j - 1]:\n            j += 1\n        else:\n            return False\n    return i == len(name)`,
        javascript: `var isLongPressedName = function(name, typed) {\n    let i = 0, j = 0;\n    while (j < typed.length) {\n        if (i < name.length && name.charAt(i) === typed.charAt(j)) { i++; j++; }\n        else if (j > 0 && typed.charAt(j) === typed.charAt(j - 1)) j++;\n        else return false;\n    }\n    return i === name.length;\n};`,
        typescript: `function isLongPressedName(name: string, typed: string): boolean {\n    var i = 0, j = 0;\n    while (j < typed.length) {\n        if (i < name.length && name.charAt(i) === typed.charAt(j)) { i++; j++; }\n        else if (j > 0 && typed.charAt(j) === typed.charAt(j - 1)) j++;\n        else return false;\n    }\n    return i === name.length;\n}`,
        java: `public static boolean isLongPressedName(String name, String typed) {\n    int i = 0, j = 0;\n    while (j < typed.length()) {\n        if (i < name.length() && name.charAt(i) == typed.charAt(j)) { i++; j++; }\n        else if (j > 0 && typed.charAt(j) == typed.charAt(j - 1)) j++;\n        else return false;\n    }\n    return i == name.length();\n}`,
        cpp: `bool isLongPressedName(string name, string typed) {\n    int i = 0, j = 0;\n    while (j < (int) typed.size()) {\n        if (i < (int) name.size() && name[i] == typed[j]) { i++; j++; }\n        else if (j > 0 && typed[j] == typed[j - 1]) j++;\n        else return false;\n    }\n    return i == (int) name.size();\n}`,
        c: `bool isLongPressedName(const char* name, const char* typed) {\n    int n = (int) strlen(name);\n    int m = (int) strlen(typed);\n    int i = 0, j = 0;\n    while (j < m) {\n        if (i < n && name[i] == typed[j]) { i++; j++; }\n        else if (j > 0 && typed[j] == typed[j - 1]) j++;\n        else return false;\n    }\n    return i == n;\n}`,
        csharp: `public static bool IsLongPressedName(string name, string typed)\n{\n    int i = 0, j = 0;\n    while (j < typed.Length)\n    {\n        if (i < name.Length && name[i] == typed[j]) { i++; j++; }\n        else if (j > 0 && typed[j] == typed[j - 1]) j++;\n        else return false;\n    }\n    return i == name.Length;\n}`,
        go: `func isLongPressedName(name string, typed string) bool {\n\ti, j := 0, 0\n\tfor j < len(typed) {\n\t\tif i < len(name) && name[i] == typed[j] {\n\t\t\ti++\n\t\t\tj++\n\t\t} else if j > 0 && typed[j] == typed[j-1] {\n\t\t\tj++\n\t\t} else {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn i == len(name)\n}`,
        kotlin: `fun isLongPressedName(name: String, typed: String): Boolean {\n    var i = 0\n    var j = 0\n    while (j < typed.length) {\n        if (i < name.length && name[i] == typed[j]) {\n            i++\n            j++\n        } else if (j > 0 && typed[j] == typed[j - 1]) {\n            j++\n        } else {\n            return false\n        }\n    }\n    return i == name.length\n}`,
        swift: `func isLongPressedName(_ name: String, _ typed: String) -> Bool {\n    let a = Array(name)\n    let b = Array(typed)\n    var i = 0\n    var j = 0\n    while j < b.count {\n        if i < a.count && a[i] == b[j] {\n            i += 1\n            j += 1\n        } else if j > 0 && b[j] == b[j - 1] {\n            j += 1\n        } else {\n            return false\n        }\n    }\n    return i == a.count\n}`,
        rust: `fn isLongPressedName(name: String, typed: String) -> bool {\n    let a: Vec<u8> = name.into_bytes();\n    let b: Vec<u8> = typed.into_bytes();\n    let mut i = 0usize;\n    let mut j = 0usize;\n    while j < b.len() {\n        if i < a.len() && a[i] == b[j] {\n            i += 1;\n            j += 1;\n        } else if j > 0 && b[j] == b[j - 1] {\n            j += 1;\n        } else {\n            return false;\n        }\n    }\n    i == a.len()\n}`,
        php: `function isLongPressedName($name, $typed) {\n    $i = 0;\n    $j = 0;\n    $n = strlen($name);\n    $m = strlen($typed);\n    while ($j < $m) {\n        if ($i < $n && $name[$i] === $typed[$j]) { $i++; $j++; }\n        else if ($j > 0 && $typed[$j] === $typed[$j - 1]) $j++;\n        else return false;\n    }\n    return $i === $n;\n}`,
        ruby: `def isLongPressedName(name, typed)\n  i = 0\n  j = 0\n  while j < typed.length\n    if i < name.length && name[i] == typed[j]\n      i += 1\n      j += 1\n    elsif j > 0 && typed[j] == typed[j - 1]\n      j += 1\n    else\n      return false\n    end\n  end\n  i == name.length\nend`,
      },
    };
  })(),

  // ── Unique Morse Code Words (LC 804) ────────────────────────────
  (() => {
    const MORSE = [".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---", "-.-", ".-..", "--",
      "-.", "---", ".--.", "--.-", ".-.", "...", "-", "..-", "...-", ".--", "-..-", "-.--", "--.."];
    const ref = (words: string[]) => {
      const seen: Record<string, boolean> = {};
      for (const w of words) {
        let code = "";
        for (const c of w) code += MORSE[c.charCodeAt(0) - 97];
        seen[code] = true;
      }
      return Object.keys(seen).length;
    };
    return {
      slug: "unique-morse-code-words",
      title: "Unique Morse Code Words",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Hash Table", "LeetCode 804", "Amazon", "Google"],
      signature: { funcName: "uniqueMorseRepresentations", params: [{ name: "words", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "Each lowercase letter maps to a Morse code string:\n\n```\na .-      b -...    c -.-.    d -..     e .       f ..-.    g --.\nh ....    i ..      j .---    k -.-     l .-..    m --      n -.\no ---     p .--.    q --.-    r .-.     s ...     t -       u ..-\nv ...-    w .--     x -..-    y -.--    z --..\n```\n\nThe **transformation** of a word is the concatenation of its letters' codes — for example `\"cab\"` becomes `\"-.-..--...\"`.\n\nGiven an array `words`, return the number of **distinct** transformations among them.",
        [
          { in: 'words = ["gin","zen","gig","msg"]', out: "2", note: '"gin" and "zen" both encode to "--...-.", and "gig" and "msg" both encode to "--...--.".' },
          { in: 'words = ["a"]', out: "1" },
          { in: 'words = ["a","b"]', out: "2" },
        ],
        ["1 <= words.length <= 100", "1 <= words[i].length <= 12", "words[i] consists of lowercase English letters."]),
      hints: [
        "Store the 26 codes in an array indexed by `letter - 'a'`.",
        "Build each word's transformation by concatenating its letters' codes.",
        "Push the results into a set and return its size.",
      ],
      editorial: explain({
        idea: "The transformation is a pure function of the word, so the answer is simply the size of the image set — a hash set does all the deduplication.",
        steps: [
          "Keep the 26 codes in a fixed lookup array in alphabet order.",
          "For each word, concatenate `MORSE[c - 'a']` over its characters.",
          "Insert every transformation into a set.",
          "Return the set's size.",
        ],
        why: "Two words collide exactly when their concatenated codes are identical, which is what set membership tests. Note Morse here is not prefix-free once concatenated, which is precisely why distinct words can collide.",
        time: "O(total characters)",
        space: "O(total characters) for the set",
        pitfalls: [
          "Comparing words pairwise is O(n²·L) and unnecessary.",
          "Inserting a separator between letter codes changes the answer — the concatenation must be raw.",
          "Getting even one code in the table wrong silently changes collisions.",
        ],
      }),
      examples: [
        { input: '["gin","zen","gig","msg"]', expectedOutput: "2" },
        { input: '["a"]', expectedOutput: "1" },
        { input: '["a","b"]', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const words = Array.from({ length: n }, () => randLower(rng, 1, 5, "abcdefgimnszt"));
        return { input: fmtStrArr(words), expectedOutput: String(ref(words)) };
      },
      solutions: {
        python: `from typing import List\n\ndef uniqueMorseRepresentations(words: List[str]) -> int:\n    morse = [".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",\n             "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",\n             "..-", "...-", ".--", "-..-", "-.--", "--.."]\n    seen = set()\n    for w in words:\n        seen.add(''.join(morse[ord(c) - 97] for c in w))\n    return len(seen)`,
        javascript: `var uniqueMorseRepresentations = function(words) {\n    const morse = [".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",\n        "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",\n        "..-", "...-", ".--", "-..-", "-.--", "--.."];\n    const seen = {};\n    for (let i = 0; i < words.length; i++) {\n        let code = "";\n        for (let j = 0; j < words[i].length; j++) {\n            code += morse[words[i].charCodeAt(j) - 97];\n        }\n        seen[code] = true;\n    }\n    return Object.keys(seen).length;\n};`,
        typescript: `function uniqueMorseRepresentations(words: string[]): number {\n    var morse = [".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",\n        "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",\n        "..-", "...-", ".--", "-..-", "-.--", "--.."];\n    var seen: { [key: string]: boolean } = {};\n    for (var i = 0; i < words.length; i++) {\n        var code = "";\n        for (var j = 0; j < words[i].length; j++) {\n            code += morse[words[i].charCodeAt(j) - 97];\n        }\n        seen[code] = true;\n    }\n    return Object.keys(seen).length;\n}`,
        java: `public static int uniqueMorseRepresentations(String[] words) {\n    String[] morse = {".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",\n        "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",\n        "..-", "...-", ".--", "-..-", "-.--", "--.."};\n    HashSet<String> seen = new HashSet<>();\n    for (String w : words) {\n        StringBuilder sb = new StringBuilder();\n        for (int i = 0; i < w.length(); i++) sb.append(morse[w.charAt(i) - 'a']);\n        seen.add(sb.toString());\n    }\n    return seen.size();\n}`,
        cpp: `int uniqueMorseRepresentations(vector<string>& words) {\n    vector<string> morse = {".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",\n        "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",\n        "..-", "...-", ".--", "-..-", "-.--", "--.."};\n    unordered_set<string> seen;\n    for (auto& w : words) {\n        string code;\n        for (char c : w) code += morse[c - 'a'];\n        seen.insert(code);\n    }\n    return (int) seen.size();\n}`,
        c: `int uniqueMorseRepresentations(char** words, int wordsSize) {\n    const char* morse[26] = {".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",\n        "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",\n        "..-", "...-", ".--", "-..-", "-.--", "--.."};\n    char codes[100][80];\n    int m = 0;\n    for (int i = 0; i < wordsSize; i++) {\n        char buf[80];\n        buf[0] = '\\0';\n        for (int j = 0; words[i][j] != '\\0'; j++) {\n            strcat(buf, morse[words[i][j] - 'a']);\n        }\n        int dup = 0;\n        for (int k = 0; k < m; k++) {\n            if (strcmp(codes[k], buf) == 0) { dup = 1; break; }\n        }\n        if (!dup) {\n            strcpy(codes[m], buf);\n            m++;\n        }\n    }\n    return m;\n}`,
        csharp: `public static int UniqueMorseRepresentations(string[] words)\n{\n    string[] morse = { ".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",\n        "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",\n        "..-", "...-", ".--", "-..-", "-.--", "--.." };\n    var seen = new HashSet<string>();\n    foreach (string w in words)\n    {\n        var sb = new System.Text.StringBuilder();\n        foreach (char c in w) sb.Append(morse[c - 'a']);\n        seen.Add(sb.ToString());\n    }\n    return seen.Count;\n}`,
        go: `func uniqueMorseRepresentations(words []string) int {\n\tmorse := []string{".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",\n\t\t"-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",\n\t\t"..-", "...-", ".--", "-..-", "-.--", "--.."}\n\tseen := map[string]bool{}\n\tfor _, w := range words {\n\t\tcode := ""\n\t\tfor i := 0; i < len(w); i++ {\n\t\t\tcode += morse[w[i]-'a']\n\t\t}\n\t\tseen[code] = true\n\t}\n\treturn len(seen)\n}`,
        kotlin: `fun uniqueMorseRepresentations(words: Array<String>): Int {\n    val morse = arrayOf(".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",\n        "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",\n        "..-", "...-", ".--", "-..-", "-.--", "--..")\n    val seen = HashSet<String>()\n    for (w in words) {\n        val sb = StringBuilder()\n        for (c in w) sb.append(morse[c - 'a'])\n        seen.add(sb.toString())\n    }\n    return seen.size\n}`,
        swift: `func uniqueMorseRepresentations(_ words: [String]) -> Int {\n    let morse = [".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",\n        "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",\n        "..-", "...-", ".--", "-..-", "-.--", "--.."]\n    var seen = Set<String>()\n    for w in words {\n        var code = ""\n        for u in w.unicodeScalars {\n            code += morse[Int(u.value) - 97]\n        }\n        seen.insert(code)\n    }\n    return seen.count\n}`,
        rust: `fn uniqueMorseRepresentations(words: Vec<String>) -> i32 {\n    use std::collections::HashSet;\n    let morse = [".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",\n        "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",\n        "..-", "...-", ".--", "-..-", "-.--", "--.."];\n    let mut seen: HashSet<String> = HashSet::new();\n    for w in words.iter() {\n        let mut code = String::new();\n        for b in w.bytes() {\n            code.push_str(morse[(b - b'a') as usize]);\n        }\n        seen.insert(code);\n    }\n    seen.len() as i32\n}`,
        php: `function uniqueMorseRepresentations($words) {\n    $morse = array(".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",\n        "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",\n        "..-", "...-", ".--", "-..-", "-.--", "--..");\n    $seen = array();\n    foreach ($words as $w) {\n        $code = "";\n        for ($i = 0; $i < strlen($w); $i++) {\n            $code .= $morse[ord($w[$i]) - 97];\n        }\n        $seen[$code] = true;\n    }\n    return count($seen);\n}`,
        ruby: `def uniqueMorseRepresentations(words)\n  morse = [".-", "-...", "-.-.", "-..", ".", "..-.", "--.", "....", "..", ".---",\n           "-.-", ".-..", "--", "-.", "---", ".--.", "--.-", ".-.", "...", "-",\n           "..-", "...-", ".--", "-..-", "-.--", "--.."]\n  seen = {}\n  words.each do |w|\n    code = ""\n    w.each_char { |c| code << morse[c.ord - 97] }\n    seen[code] = true\n  end\n  seen.size\nend`,
      },
    };
  })(),

  // ── Goat Latin (LC 824) ─────────────────────────────────────────
  (() => {
    const ref = (sentence: string) => {
      const vowels = "aeiouAEIOU";
      const words = sentence.split(" ");
      const out: string[] = [];
      for (let i = 0; i < words.length; i++) {
        let w = words[i];
        if (vowels.indexOf(w[0]) === -1) w = w.slice(1) + w[0];
        out.push(w + "ma" + "a".repeat(i + 1));
      }
      return out.join(" ");
    };
    return {
      slug: "goat-latin",
      title: "Goat Latin",
      difficulty: "EASY" as const,
      tags: ["String", "LeetCode 824", "Amazon", "Adobe"],
      signature: { funcName: "toGoatLatin", params: [{ name: "sentence", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Convert a sentence to **Goat Latin**, a made-up language with these rules applied to each word:\n\n1. If the word begins with a vowel (`a`, `e`, `i`, `o`, `u`, in either case), append `\"ma\"`.\n2. Otherwise move the first letter to the end and then append `\"ma\"`.\n3. Append one `\"a\"` for the first word, two for the second, and so on — the `i`-th word (1-indexed) gets `i` copies of `\"a\"`.\n\nWords are separated by single spaces. Return the converted sentence.",
        [
          { in: 's = "I speak Goat Latin"', out: "Imaa peaksmaaa oatGmaaaa atinLmaaaaa" },
          { in: 's = "The quick brown fox"', out: "heTmaa uickqmaaa rownbmaaaa oxfmaaaaa" },
          { in: 's = "a"', out: "amaa" },
        ],
        ["1 <= sentence.length <= 150", "sentence consists of English letters and single spaces.", "There are no leading or trailing spaces."]),
      hints: [
        "Split on spaces and handle each word independently.",
        "The vowel test must cover both cases — `\"I\"` is a vowel word.",
        "The `i`-th word (1-indexed) ends with `\"ma\"` followed by `i` letters `a`.",
      ],
      editorial: explain({
        idea: "Every rule is local to one word plus its position, so a single split-transform-join does the whole job.",
        steps: [
          "Split the sentence on single spaces.",
          "For each word at index `i` (0-based): if the first character is not a vowel, rotate it to the end.",
          "Append `\"ma\"` followed by `i + 1` copies of `\"a\"`.",
          "Join the transformed words back with single spaces.",
        ],
        why: "The rules never look outside a word other than to read its index, so the transformation is a plain map over the word list.",
        time: "O(n²) in the worst case, because the suffix grows with the word index",
        space: "O(n²) for the same reason",
        pitfalls: [
          "Testing only lowercase vowels mishandles a capitalised word like `\"I\"` or `\"Apple\"`.",
          "The suffix count is 1-based — the first word gets `\"maa\"`, not `\"ma\"`.",
          "Rebuilding with `join(\" \")` matters; adding a trailing space fails the exact judge.",
        ],
      }),
      examples: [
        { input: '"I speak Goat Latin"', expectedOutput: "Imaa peaksmaaa oatGmaaaa atinLmaaaaa" },
        { input: '"The quick brown fox"', expectedOutput: "heTmaa uickqmaaa rownbmaaaa oxfmaaaaa" },
        { input: '"a"', expectedOutput: "amaa" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 6);
        const words = Array.from({ length: n }, () => {
          const w = randLower(rng, 1, 6);
          return rng() < 0.3 ? w.charAt(0).toUpperCase() + w.slice(1) : w;
        });
        const sentence = words.join(" ");
        return { input: JSON.stringify(sentence), expectedOutput: ref(sentence) };
      },
      solutions: {
        python: `def toGoatLatin(sentence: str) -> str:\n    vowels = "aeiouAEIOU"\n    out = []\n    for i, w in enumerate(sentence.split(" ")):\n        if w[0] not in vowels:\n            w = w[1:] + w[0]\n        out.append(w + "ma" + "a" * (i + 1))\n    return " ".join(out)`,
        javascript: `var toGoatLatin = function(sentence) {\n    const vowels = "aeiouAEIOU";\n    const words = sentence.split(" ");\n    const out = [];\n    for (let i = 0; i < words.length; i++) {\n        let w = words[i];\n        if (vowels.indexOf(w.charAt(0)) === -1) w = w.slice(1) + w.charAt(0);\n        let tail = "";\n        for (let k = 0; k <= i; k++) tail += "a";\n        out.push(w + "ma" + tail);\n    }\n    return out.join(" ");\n};`,
        typescript: `function toGoatLatin(sentence: string): string {\n    var vowels = "aeiouAEIOU";\n    var words = sentence.split(" ");\n    var out: string[] = [];\n    for (var i = 0; i < words.length; i++) {\n        var w = words[i];\n        if (vowels.indexOf(w.charAt(0)) === -1) w = w.slice(1) + w.charAt(0);\n        var tail = "";\n        for (var k = 0; k <= i; k++) tail += "a";\n        out.push(w + "ma" + tail);\n    }\n    return out.join(" ");\n}`,
        java: `public static String toGoatLatin(String sentence) {\n    String vowels = "aeiouAEIOU";\n    String[] words = sentence.split(" ");\n    StringBuilder res = new StringBuilder();\n    for (int i = 0; i < words.length; i++) {\n        String w = words[i];\n        if (vowels.indexOf(w.charAt(0)) < 0) w = w.substring(1) + w.charAt(0);\n        if (i > 0) res.append(' ');\n        res.append(w).append("ma");\n        for (int k = 0; k <= i; k++) res.append('a');\n    }\n    return res.toString();\n}`,
        cpp: `string toGoatLatin(string sentence) {\n    string vowels = "aeiouAEIOU";\n    vector<string> words;\n    string cur;\n    for (char c : sentence) {\n        if (c == ' ') { words.push_back(cur); cur.clear(); }\n        else cur += c;\n    }\n    words.push_back(cur);\n    string res;\n    for (int i = 0; i < (int) words.size(); i++) {\n        string w = words[i];\n        if (vowels.find(w[0]) == string::npos) w = w.substr(1) + w[0];\n        if (i > 0) res += ' ';\n        res += w + "ma" + string(i + 1, 'a');\n    }\n    return res;\n}`,
        c: `char* toGoatLatin(const char* sentence) {\n    int n = (int) strlen(sentence);\n    char* out = (char*) malloc(n * n + 8 * n + 16);\n    out[0] = '\\0';\n    const char* vowels = "aeiouAEIOU";\n    int i = 0, wordIndex = 0, pos = 0;\n    while (i <= n) {\n        int start = i;\n        while (i < n && sentence[i] != ' ') i++;\n        int len = i - start;\n        if (len > 0) {\n            if (wordIndex > 0) out[pos++] = ' ';\n            char first = sentence[start];\n            if (strchr(vowels, first) == NULL) {\n                for (int k = 1; k < len; k++) out[pos++] = sentence[start + k];\n                out[pos++] = first;\n            } else {\n                for (int k = 0; k < len; k++) out[pos++] = sentence[start + k];\n            }\n            out[pos++] = 'm';\n            out[pos++] = 'a';\n            for (int k = 0; k <= wordIndex; k++) out[pos++] = 'a';\n            wordIndex++;\n        }\n        i++;\n    }\n    out[pos] = '\\0';\n    return out;\n}`,
        csharp: `public static string ToGoatLatin(string sentence)\n{\n    string vowels = "aeiouAEIOU";\n    string[] words = sentence.Split(' ');\n    var res = new System.Text.StringBuilder();\n    for (int i = 0; i < words.Length; i++)\n    {\n        string w = words[i];\n        if (vowels.IndexOf(w[0]) < 0) w = w.Substring(1) + w[0];\n        if (i > 0) res.Append(' ');\n        res.Append(w).Append("ma");\n        for (int k = 0; k <= i; k++) res.Append('a');\n    }\n    return res.ToString();\n}`,
        go: `func toGoatLatin(sentence string) string {\n\tvowels := "aeiouAEIOU"\n\twords := strings.Split(sentence, " ")\n\tout := make([]string, 0, len(words))\n\tfor i, w := range words {\n\t\tif !strings.ContainsRune(vowels, rune(w[0])) {\n\t\t\tw = w[1:] + string(w[0])\n\t\t}\n\t\tout = append(out, w+"ma"+strings.Repeat("a", i+1))\n\t}\n\treturn strings.Join(out, " ")\n}`,
        kotlin: `fun toGoatLatin(sentence: String): String {\n    val vowels = "aeiouAEIOU"\n    val words = sentence.split(" ")\n    val sb = StringBuilder()\n    for (i in words.indices) {\n        var w = words[i]\n        if (vowels.indexOf(w[0]) < 0) w = w.substring(1) + w[0]\n        if (i > 0) sb.append(' ')\n        sb.append(w).append("ma")\n        for (k in 0..i) sb.append('a')\n    }\n    return sb.toString()\n}`,
        swift: `func toGoatLatin(_ sentence: String) -> String {\n    let vowels = Set("aeiouAEIOU")\n    let words = sentence.split(separator: " ", omittingEmptySubsequences: false).map { String($0) }\n    var out: [String] = []\n    for (i, word) in words.enumerated() {\n        var w = word\n        if let f = w.first, !vowels.contains(f) {\n            w = String(w.dropFirst()) + String(f)\n        }\n        out.append(w + "ma" + String(repeating: "a", count: i + 1))\n    }\n    return out.joined(separator: " ")\n}`,
        rust: `fn toGoatLatin(sentence: String) -> String {\n    let vowels = "aeiouAEIOU";\n    let mut out: Vec<String> = Vec::new();\n    for (i, word) in sentence.split(' ').enumerate() {\n        let bytes = word.as_bytes();\n        let first = bytes[0] as char;\n        let mut w = if vowels.contains(first) {\n            word.to_string()\n        } else {\n            let mut t = word[1..].to_string();\n            t.push(first);\n            t\n        };\n        w.push_str("ma");\n        for _ in 0..=i {\n            w.push('a');\n        }\n        out.push(w);\n    }\n    out.join(" ")\n}`,
        php: `function toGoatLatin($sentence) {\n    $vowels = "aeiouAEIOU";\n    $words = explode(" ", $sentence);\n    $out = array();\n    foreach ($words as $i => $w) {\n        if (strpos($vowels, $w[0]) === false) {\n            $w = substr($w, 1) . $w[0];\n        }\n        $out[] = $w . "ma" . str_repeat("a", $i + 1);\n    }\n    return implode(" ", $out);\n}`,
        ruby: `def toGoatLatin(sentence)\n  vowels = "aeiouAEIOU"\n  sentence.split(" ").each_with_index.map do |w, i|\n    w = w[1..-1] + w[0] unless vowels.include?(w[0])\n    w + "ma" + "a" * (i + 1)\n  end.join(" ")\nend`,
      },
    };
  })(),

  // ── Verifying an Alien Dictionary (LC 953) ──────────────────────
  (() => {
    const ref = (words: string[], order: string) => {
      const rank: Record<string, number> = {};
      for (let i = 0; i < order.length; i++) rank[order[i]] = i;
      const le = (a: string, b: string) => {
        const n = Math.min(a.length, b.length);
        for (let i = 0; i < n; i++) {
          if (a[i] !== b[i]) return rank[a[i]] < rank[b[i]];
        }
        return a.length <= b.length;
      };
      for (let i = 0; i + 1 < words.length; i++) if (!le(words[i], words[i + 1])) return false;
      return true;
    };
    return {
      slug: "verifying-an-alien-dictionary",
      title: "Verifying an Alien Dictionary",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Hash Table", "LeetCode 953", "Facebook", "Amazon", "Google"],
      signature: {
        funcName: "isAlienSorted",
        params: [{ name: "words", type: "string[]" as const }, { name: "order", type: "string" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "An alien language uses the English letters but in a different alphabetical order, given by the permutation `order`.\n\nReturn `true` if `words` is sorted **lexicographically** according to that order.",
        [
          { in: 'words = ["hello","leetcode"], order = "hlabcdefgijkmnopqrstuvwxyz"', out: "true", note: "h precedes l in this alphabet." },
          { in: 'words = ["word","world","row"], order = "worldabcefghijkmnpqstuvxyz"', out: "false", note: '"word" comes after "world" because d follows l here.' },
          { in: 'words = ["apple","app"], order = "abcdefghijklmnopqrstuvwxyz"', out: "false", note: "A prefix must come before the longer word." },
        ],
        ["1 <= words.length <= 100", "1 <= words[i].length <= 20", "order.length == 26", "All characters are lowercase English letters and order is a permutation of them."]),
      hints: [
        "Turn the alphabet string into a rank lookup: `rank[c]` is the position of `c` in `order`.",
        "Comparing two words means finding the first index where they differ and comparing ranks there.",
        "If neither differs before one ends, the shorter word must come first.",
      ],
      editorial: explain({
        idea: "Re-mapping each letter to its rank in the alien alphabet reduces the problem to ordinary lexicographic comparison of adjacent word pairs.",
        steps: [
          "Build `rank` from `order`, mapping each letter to its index.",
          "For each adjacent pair `(a, b)`, scan to the first position where they differ.",
          "If such a position exists, the pair is in order iff `rank[a[i]] < rank[b[i]]`.",
          "If no position differs, the pair is in order iff `a.length <= b.length`.",
          "Return `false` on the first violation, `true` otherwise.",
        ],
        why: "Lexicographic order is a total order, so checking only adjacent pairs is sufficient — sortedness is a chain of pairwise comparisons.",
        time: "O(total characters)",
        space: "O(1) — the rank table is 26 entries",
        pitfalls: [
          "Missing the prefix rule marks `[\"apple\",\"app\"]` as sorted.",
          "Comparing the raw strings with the language's built-in comparison ignores `order` entirely.",
          "Comparing all pairs instead of adjacent ones is O(n²) for no benefit.",
        ],
      }),
      examples: [
        { input: '["hello","leetcode"]\n"hlabcdefgijkmnopqrstuvwxyz"', expectedOutput: "true" },
        { input: '["word","world","row"]\n"worldabcefghijkmnpqstuvxyz"', expectedOutput: "false" },
        { input: '["apple","app"]\n"abcdefghijklmnopqrstuvwxyz"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const letters = "abcdefghijklmnopqrstuvwxyz".split("");
        const order = shuffle(rng, letters.slice()).join("");
        const n = ri(rng, 1, 6);
        const words = Array.from({ length: n }, () => randLower(rng, 1, 5, "abcde"));
        if (rng() < 0.4) {
          const rank: Record<string, number> = {};
          for (let i = 0; i < order.length; i++) rank[order[i]] = i;
          words.sort((a, b) => {
            const m = Math.min(a.length, b.length);
            for (let i = 0; i < m; i++) if (a[i] !== b[i]) return rank[a[i]] - rank[b[i]];
            return a.length - b.length;
          });
        }
        return { input: `${fmtStrArr(words)}\n${JSON.stringify(order)}`, expectedOutput: bool(ref(words, order)) };
      },
      solutions: {
        python: `from typing import List\n\ndef isAlienSorted(words: List[str], order: str) -> bool:\n    rank = {c: i for i, c in enumerate(order)}\n\n    def le(a, b):\n        for x, y in zip(a, b):\n            if x != y:\n                return rank[x] < rank[y]\n        return len(a) <= len(b)\n\n    for i in range(len(words) - 1):\n        if not le(words[i], words[i + 1]):\n            return False\n    return True`,
        javascript: `var isAlienSorted = function(words, order) {\n    const rank = {};\n    for (let i = 0; i < order.length; i++) rank[order.charAt(i)] = i;\n    function le(a, b) {\n        const n = Math.min(a.length, b.length);\n        for (let i = 0; i < n; i++) {\n            if (a.charAt(i) !== b.charAt(i)) return rank[a.charAt(i)] < rank[b.charAt(i)];\n        }\n        return a.length <= b.length;\n    }\n    for (let i = 0; i + 1 < words.length; i++) {\n        if (!le(words[i], words[i + 1])) return false;\n    }\n    return true;\n};`,
        typescript: `function isAlienSorted(words: string[], order: string): boolean {\n    var rank: { [key: string]: number } = {};\n    for (var i = 0; i < order.length; i++) rank[order.charAt(i)] = i;\n    function le(a: string, b: string): boolean {\n        var n = Math.min(a.length, b.length);\n        for (var k = 0; k < n; k++) {\n            if (a.charAt(k) !== b.charAt(k)) return rank[a.charAt(k)] < rank[b.charAt(k)];\n        }\n        return a.length <= b.length;\n    }\n    for (var j = 0; j + 1 < words.length; j++) {\n        if (!le(words[j], words[j + 1])) return false;\n    }\n    return true;\n}`,
        java: `public static boolean isAlienSorted(String[] words, String order) {\n    int[] rank = new int[26];\n    for (int i = 0; i < order.length(); i++) rank[order.charAt(i) - 'a'] = i;\n    for (int w = 0; w + 1 < words.length; w++) {\n        String a = words[w], b = words[w + 1];\n        int n = Math.min(a.length(), b.length());\n        boolean decided = false;\n        for (int i = 0; i < n; i++) {\n            if (a.charAt(i) != b.charAt(i)) {\n                if (rank[a.charAt(i) - 'a'] > rank[b.charAt(i) - 'a']) return false;\n                decided = true;\n                break;\n            }\n        }\n        if (!decided && a.length() > b.length()) return false;\n    }\n    return true;\n}`,
        cpp: `bool isAlienSorted(vector<string>& words, string order) {\n    int rank[26];\n    for (int i = 0; i < (int) order.size(); i++) rank[order[i] - 'a'] = i;\n    for (int w = 0; w + 1 < (int) words.size(); w++) {\n        const string& a = words[w];\n        const string& b = words[w + 1];\n        int n = (int) min(a.size(), b.size());\n        bool decided = false;\n        for (int i = 0; i < n; i++) {\n            if (a[i] != b[i]) {\n                if (rank[a[i] - 'a'] > rank[b[i] - 'a']) return false;\n                decided = true;\n                break;\n            }\n        }\n        if (!decided && a.size() > b.size()) return false;\n    }\n    return true;\n}`,
        c: `bool isAlienSorted(char** words, int wordsSize, const char* order) {\n    int rank[26];\n    for (int i = 0; order[i] != '\\0'; i++) rank[order[i] - 'a'] = i;\n    for (int w = 0; w + 1 < wordsSize; w++) {\n        const char* a = words[w];\n        const char* b = words[w + 1];\n        int la = (int) strlen(a);\n        int lb = (int) strlen(b);\n        int n = la < lb ? la : lb;\n        int decided = 0;\n        for (int i = 0; i < n; i++) {\n            if (a[i] != b[i]) {\n                if (rank[a[i] - 'a'] > rank[b[i] - 'a']) return false;\n                decided = 1;\n                break;\n            }\n        }\n        if (!decided && la > lb) return false;\n    }\n    return true;\n}`,
        csharp: `public static bool IsAlienSorted(string[] words, string order)\n{\n    int[] rank = new int[26];\n    for (int i = 0; i < order.Length; i++) rank[order[i] - 'a'] = i;\n    for (int w = 0; w + 1 < words.Length; w++)\n    {\n        string a = words[w], b = words[w + 1];\n        int n = Math.Min(a.Length, b.Length);\n        bool decided = false;\n        for (int i = 0; i < n; i++)\n        {\n            if (a[i] != b[i])\n            {\n                if (rank[a[i] - 'a'] > rank[b[i] - 'a']) return false;\n                decided = true;\n                break;\n            }\n        }\n        if (!decided && a.Length > b.Length) return false;\n    }\n    return true;\n}`,
        go: `func isAlienSorted(words []string, order string) bool {\n\tvar rank [26]int\n\tfor i := 0; i < len(order); i++ {\n\t\trank[order[i]-'a'] = i\n\t}\n\tfor w := 0; w+1 < len(words); w++ {\n\t\ta, b := words[w], words[w+1]\n\t\tn := len(a)\n\t\tif len(b) < n {\n\t\t\tn = len(b)\n\t\t}\n\t\tdecided := false\n\t\tfor i := 0; i < n; i++ {\n\t\t\tif a[i] != b[i] {\n\t\t\t\tif rank[a[i]-'a'] > rank[b[i]-'a'] {\n\t\t\t\t\treturn false\n\t\t\t\t}\n\t\t\t\tdecided = true\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tif !decided && len(a) > len(b) {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun isAlienSorted(words: Array<String>, order: String): Boolean {\n    val rank = IntArray(26)\n    for (i in order.indices) rank[order[i] - 'a'] = i\n    for (w in 0 until words.size - 1) {\n        val a = words[w]\n        val b = words[w + 1]\n        val n = minOf(a.length, b.length)\n        var decided = false\n        for (i in 0 until n) {\n            if (a[i] != b[i]) {\n                if (rank[a[i] - 'a'] > rank[b[i] - 'a']) return false\n                decided = true\n                break\n            }\n        }\n        if (!decided && a.length > b.length) return false\n    }\n    return true\n}`,
        swift: `func isAlienSorted(_ words: [String], _ order: String) -> Bool {\n    var rank = [Int](repeating: 0, count: 26)\n    for (i, u) in order.unicodeScalars.enumerated() {\n        rank[Int(u.value) - 97] = i\n    }\n    let arrs = words.map { Array($0.unicodeScalars).map { Int($0.value) - 97 } }\n    for w in 0..<max(arrs.count - 1, 0) {\n        let a = arrs[w]\n        let b = arrs[w + 1]\n        let n = min(a.count, b.count)\n        var decided = false\n        for i in 0..<n {\n            if a[i] != b[i] {\n                if rank[a[i]] > rank[b[i]] { return false }\n                decided = true\n                break\n            }\n        }\n        if !decided && a.count > b.count { return false }\n    }\n    return true\n}`,
        rust: `fn isAlienSorted(words: Vec<String>, order: String) -> bool {\n    let mut rank = [0usize; 26];\n    for (i, b) in order.bytes().enumerate() {\n        rank[(b - b'a') as usize] = i;\n    }\n    for w in 0..words.len().saturating_sub(1) {\n        let a = words[w].as_bytes();\n        let b = words[w + 1].as_bytes();\n        let n = a.len().min(b.len());\n        let mut decided = false;\n        for i in 0..n {\n            if a[i] != b[i] {\n                if rank[(a[i] - b'a') as usize] > rank[(b[i] - b'a') as usize] {\n                    return false;\n                }\n                decided = true;\n                break;\n            }\n        }\n        if !decided && a.len() > b.len() {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function isAlienSorted($words, $order) {\n    $rank = array();\n    for ($i = 0; $i < strlen($order); $i++) $rank[$order[$i]] = $i;\n    for ($w = 0; $w + 1 < count($words); $w++) {\n        $a = $words[$w];\n        $b = $words[$w + 1];\n        $n = min(strlen($a), strlen($b));\n        $decided = false;\n        for ($i = 0; $i < $n; $i++) {\n            if ($a[$i] !== $b[$i]) {\n                if ($rank[$a[$i]] > $rank[$b[$i]]) return false;\n                $decided = true;\n                break;\n            }\n        }\n        if (!$decided && strlen($a) > strlen($b)) return false;\n    }\n    return true;\n}`,
        ruby: `def isAlienSorted(words, order)\n  rank = {}\n  order.each_char.with_index { |c, i| rank[c] = i }\n  (0...(words.length - 1)).each do |w|\n    a = words[w]\n    b = words[w + 1]\n    n = [a.length, b.length].min\n    decided = false\n    (0...n).each do |i|\n      next if a[i] == b[i]\n      return false if rank[a[i]] > rank[b[i]]\n      decided = true\n      break\n    end\n    return false if !decided && a.length > b.length\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Greatest Common Divisor of Strings (LC 1071) ────────────────
  (() => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const ref = (s1: string, s2: string) => {
      if (s1 + s2 !== s2 + s1) return "";
      return s1.slice(0, gcd(s1.length, s2.length));
    };
    return {
      slug: "greatest-common-divisor-of-strings",
      title: "Greatest Common Divisor of Strings",
      difficulty: "EASY" as const,
      tags: ["String", "Math", "LeetCode 1071", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "gcdOfStrings",
        params: [{ name: "str1", type: "string" as const }, { name: "str2", type: "string" as const }],
        returns: "string" as const,
      },
      description: describe(
        "For strings `s` and `t`, we say `t` **divides** `s` if `s` equals `t` repeated some whole number of times.\n\nGiven `str1` and `str2`, return the **largest** string `x` that divides both. If no such string exists, return the empty string.",
        [
          { in: 'str1 = "ABCABC", str2 = "ABC"', out: "ABC" },
          { in: 'str1 = "ABABAB", str2 = "ABAB"', out: "AB" },
          { in: 'str1 = "LEET", str2 = "CODE"', out: "", note: "No common divisor string exists." },
        ],
        ["1 <= str1.length, str2.length <= 1000", "Both strings consist of uppercase English letters."]),
      hints: [
        "If a common divisor exists, both strings are built from the same repeating block — so their concatenations in either order must match.",
        "`str1 + str2 == str2 + str1` is exactly the condition for a common divisor to exist.",
        "When it holds, the answer's length is `gcd(len(str1), len(str2))`.",
      ],
      editorial: explain({
        idea: "Strings under concatenation behave like numbers under addition here: a common divisor string exists iff the two commute, and its length is the gcd of the lengths.",
        steps: [
          "If `str1 + str2 != str2 + str1`, return the empty string.",
          "Otherwise compute `g = gcd(len(str1), len(str2))`.",
          "Return the first `g` characters of `str1`.",
        ],
        why: "If both strings are powers of a common block `x`, concatenation is commutative because both sides reduce to the same run of `x`. Conversely, commuting forces a common block. Its length must divide both lengths, and the *largest* such length is their gcd.",
        time: "O(n + m)",
        space: "O(n + m) for the concatenations",
        pitfalls: [
          "Trying every prefix length and testing divisibility is O(n²) and easy to get subtly wrong on the repetition check.",
          "Skipping the commutation test and just returning the gcd-length prefix answers `\"LE\"` for `\"LEET\"`/`\"CODE\"`.",
          "The gcd must be taken over the **lengths**, not the strings.",
        ],
      }),
      examples: [
        { input: '"ABCABC"\n"ABC"', expectedOutput: "ABC" },
        { input: '"ABABAB"\n"ABAB"', expectedOutput: "AB" },
        { input: '"LEET"\n"CODE"', expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        if (rng() < 0.6) {
          const block = randLower(rng, 1, 4, "ABCD");
          const s1 = block.repeat(ri(rng, 1, 5));
          const s2 = block.repeat(ri(rng, 1, 5));
          return { input: `${JSON.stringify(s1)}\n${JSON.stringify(s2)}`, expectedOutput: ref(s1, s2) };
        }
        const s1 = randLower(rng, 1, 8, "ABCD");
        const s2 = randLower(rng, 1, 8, "ABCD");
        return { input: `${JSON.stringify(s1)}\n${JSON.stringify(s2)}`, expectedOutput: ref(s1, s2) };
      },
      solutions: {
        python: `def gcdOfStrings(str1: str, str2: str) -> str:\n    from math import gcd\n    if str1 + str2 != str2 + str1:\n        return ""\n    return str1[:gcd(len(str1), len(str2))]`,
        javascript: `var gcdOfStrings = function(str1, str2) {\n    function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }\n    if (str1 + str2 !== str2 + str1) return "";\n    return str1.slice(0, gcd(str1.length, str2.length));\n};`,
        typescript: `function gcdOfStrings(str1: string, str2: string): string {\n    function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }\n    if (str1 + str2 !== str2 + str1) return "";\n    return str1.slice(0, gcd(str1.length, str2.length));\n}`,
        java: `public static String gcdOfStrings(String str1, String str2) {\n    if (!(str1 + str2).equals(str2 + str1)) return "";\n    int a = str1.length(), b = str2.length();\n    while (b != 0) { int t = a % b; a = b; b = t; }\n    return str1.substring(0, a);\n}`,
        cpp: `string gcdOfStrings(string str1, string str2) {\n    if (str1 + str2 != str2 + str1) return "";\n    int a = (int) str1.size(), b = (int) str2.size();\n    while (b != 0) { int t = a % b; a = b; b = t; }\n    return str1.substr(0, a);\n}`,
        c: `char* gcdOfStrings(const char* str1, const char* str2) {\n    int n = (int) strlen(str1);\n    int m = (int) strlen(str2);\n    char* left = (char*) malloc(n + m + 1);\n    char* right = (char*) malloc(n + m + 1);\n    strcpy(left, str1); strcat(left, str2);\n    strcpy(right, str2); strcat(right, str1);\n    int same = strcmp(left, right) == 0;\n    free(left);\n    free(right);\n    if (!same) {\n        char* empty = (char*) malloc(1);\n        empty[0] = '\\0';\n        return empty;\n    }\n    int a = n, b = m;\n    while (b != 0) { int t = a % b; a = b; b = t; }\n    char* out = (char*) malloc(a + 1);\n    for (int i = 0; i < a; i++) out[i] = str1[i];\n    out[a] = '\\0';\n    return out;\n}`,
        csharp: `public static string GcdOfStrings(string str1, string str2)\n{\n    if (str1 + str2 != str2 + str1) return "";\n    int a = str1.Length, b = str2.Length;\n    while (b != 0) { int t = a % b; a = b; b = t; }\n    return str1.Substring(0, a);\n}`,
        go: `func gcdOfStrings(str1 string, str2 string) string {\n\tif str1+str2 != str2+str1 {\n\t\treturn ""\n\t}\n\ta, b := len(str1), len(str2)\n\tfor b != 0 {\n\t\ta, b = b, a%b\n\t}\n\treturn str1[:a]\n}`,
        kotlin: `fun gcdOfStrings(str1: String, str2: String): String {\n    if (str1 + str2 != str2 + str1) return ""\n    var a = str1.length\n    var b = str2.length\n    while (b != 0) {\n        val t = a % b\n        a = b\n        b = t\n    }\n    return str1.substring(0, a)\n}`,
        swift: `func gcdOfStrings(_ str1: String, _ str2: String) -> String {\n    if str1 + str2 != str2 + str1 { return "" }\n    var a = str1.count\n    var b = str2.count\n    while b != 0 {\n        let t = a % b\n        a = b\n        b = t\n    }\n    return String(str1.prefix(a))\n}`,
        rust: `fn gcdOfStrings(str1: String, str2: String) -> String {\n    let ab = format!("{}{}", str1, str2);\n    let ba = format!("{}{}", str2, str1);\n    if ab != ba {\n        return String::new();\n    }\n    let mut a = str1.len();\n    let mut b = str2.len();\n    while b != 0 {\n        let t = a % b;\n        a = b;\n        b = t;\n    }\n    str1[..a].to_string()\n}`,
        php: `function gcdOfStrings($str1, $str2) {\n    if ($str1 . $str2 !== $str2 . $str1) return "";\n    $a = strlen($str1);\n    $b = strlen($str2);\n    while ($b != 0) { $t = $a % $b; $a = $b; $b = $t; }\n    return substr($str1, 0, $a);\n}`,
        ruby: `def gcdOfStrings(str1, str2)\n  return "" if str1 + str2 != str2 + str1\n  a = str1.length\n  b = str2.length\n  while b != 0\n    a, b = b, a % b\n  end\n  str1[0, a]\nend`,
      },
    };
  })(),

  // ── Remove Vowels from a String (LC 1119) ───────────────────────
  (() => {
    const ref = (s: string) => s.split("").filter((c) => "aeiou".indexOf(c) === -1).join("");
    return {
      slug: "remove-vowels-from-a-string",
      title: "Remove Vowels from a String",
      difficulty: "EASY" as const,
      tags: ["String", "LeetCode 1119", "Amazon", "TCS", "Infosys"],
      signature: { funcName: "removeVowels", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given a string `s` of lowercase English letters, return `s` with every vowel (`a`, `e`, `i`, `o`, `u`) removed.",
        [
          { in: 's = "leetcodeisacommunityforcoders"', out: "ltcdscmmntyfrcdrs" },
          { in: 's = "aeiou"', out: "", note: "Every character is a vowel, so nothing remains." },
          { in: 's = "rhythm"', out: "rhythm" },
        ],
        ["1 <= s.length <= 1000", "s consists of lowercase English letters."]),
      hints: [
        "Build the answer character by character rather than deleting in place.",
        "A five-character membership test is enough — no lookup table needed.",
        "The result may be empty; make sure your code handles that.",
      ],
      editorial: explain({
        idea: "A filter over the characters: keep everything that is not one of the five vowels.",
        steps: [
          "Walk the string once.",
          "Append the character to the output unless it is `a`, `e`, `i`, `o` or `u`.",
          "Return the accumulated output.",
        ],
        why: "Removal is order-preserving and independent per character, so a single filtering pass is exactly right.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Deleting from the string in place while iterating skips characters, because the indices shift under you.",
          "Repeated string concatenation is O(n²) in some languages — prefer a builder or list-join.",
        ],
      }),
      examples: [
        { input: '"leetcodeisacommunityforcoders"', expectedOutput: "ltcdscmmntyfrcdrs" },
        { input: '"aeiou"', expectedOutput: "" },
        { input: '"rhythm"', expectedOutput: "rhythm" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 40);
        return { input: JSON.stringify(s), expectedOutput: ref(s) };
      },
      solutions: {
        python: `def removeVowels(s: str) -> str:\n    return ''.join(c for c in s if c not in 'aeiou')`,
        javascript: `var removeVowels = function(s) {\n    let out = "";\n    for (let i = 0; i < s.length; i++) {\n        const c = s.charAt(i);\n        if ("aeiou".indexOf(c) === -1) out += c;\n    }\n    return out;\n};`,
        typescript: `function removeVowels(s: string): string {\n    var out = "";\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if ("aeiou".indexOf(c) === -1) out += c;\n    }\n    return out;\n}`,
        java: `public static String removeVowels(String s) {\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        if ("aeiou".indexOf(c) < 0) sb.append(c);\n    }\n    return sb.toString();\n}`,
        cpp: `string removeVowels(string s) {\n    string out;\n    string vowels = "aeiou";\n    for (char c : s) {\n        if (vowels.find(c) == string::npos) out += c;\n    }\n    return out;\n}`,
        c: `char* removeVowels(const char* s) {\n    int n = (int) strlen(s);\n    char* out = (char*) malloc(n + 1);\n    int m = 0;\n    for (int i = 0; i < n; i++) {\n        if (strchr("aeiou", s[i]) == NULL) out[m++] = s[i];\n    }\n    out[m] = '\\0';\n    return out;\n}`,
        csharp: `public static string RemoveVowels(string s)\n{\n    var sb = new System.Text.StringBuilder();\n    foreach (char c in s)\n    {\n        if ("aeiou".IndexOf(c) < 0) sb.Append(c);\n    }\n    return sb.ToString();\n}`,
        go: `func removeVowels(s string) string {\n\tvar b []byte\n\tfor i := 0; i < len(s); i++ {\n\t\tif !strings.ContainsRune("aeiou", rune(s[i])) {\n\t\t\tb = append(b, s[i])\n\t\t}\n\t}\n\treturn string(b)\n}`,
        kotlin: `fun removeVowels(s: String): String {\n    val sb = StringBuilder()\n    for (c in s) {\n        if ("aeiou".indexOf(c) < 0) sb.append(c)\n    }\n    return sb.toString()\n}`,
        swift: `func removeVowels(_ s: String) -> String {\n    let vowels: Set<Character> = ["a", "e", "i", "o", "u"]\n    var out = ""\n    for c in s {\n        if !vowels.contains(c) { out.append(c) }\n    }\n    return out\n}`,
        rust: `fn removeVowels(s: String) -> String {\n    let mut out = String::new();\n    for c in s.chars() {\n        if c != 'a' && c != 'e' && c != 'i' && c != 'o' && c != 'u' {\n            out.push(c);\n        }\n    }\n    out\n}`,
        php: `function removeVowels($s) {\n    $out = "";\n    for ($i = 0; $i < strlen($s); $i++) {\n        if (strpos("aeiou", $s[$i]) === false) $out .= $s[$i];\n    }\n    return $out;\n}`,
        ruby: `def removeVowels(s)\n  out = ""\n  s.each_char { |c| out << c unless "aeiou".include?(c) }\n  out\nend`,
      },
    };
  })(),

  // ── Count Substrings with Only One Distinct Letter (LC 1180) ────
  (() => {
    const ref = (s: string) => {
      let total = 0, run = 1;
      for (let i = 1; i <= s.length; i++) {
        if (i < s.length && s[i] === s[i - 1]) run++;
        else { total += (run * (run + 1)) / 2; run = 1; }
      }
      return total;
    };
    return {
      slug: "count-substrings-with-only-one-distinct-letter",
      title: "Count Substrings with Only One Distinct Letter",
      difficulty: "EASY" as const,
      tags: ["String", "Math", "LeetCode 1180", "Amazon", "Adobe"],
      signature: { funcName: "countLetters", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s`, return the number of substrings that contain **only one distinct letter**.\n\nSubstrings are counted by position, so identical substrings occurring at different places count separately.",
        [
          { in: 's = "aaaba"', out: "8", note: '"aaa" contributes 6 substrings, plus "b" and the trailing "a".' },
          { in: 's = "aaaaaaaaaa"', out: "55", note: "A run of 10 gives 10·11/2 = 55." },
          { in: 's = "abc"', out: "3" },
        ],
        ["1 <= s.length <= 1000", "s consists of lowercase English letters."]),
      hints: [
        "Every valid substring lies entirely inside a maximal run of equal characters.",
        "A run of length `k` contains `k(k+1)/2` substrings.",
        "Split the string into runs and sum that formula over them.",
      ],
      editorial: explain({
        idea: "A substring with one distinct letter is a contiguous block of identical characters, so it must sit inside a maximal run. Counting the substrings of each run and summing gives the answer directly.",
        steps: [
          "Scan the string, extending a run counter while consecutive characters match.",
          "When the run ends (or the string does), add `run * (run + 1) / 2` to the total.",
          "Reset the run counter and continue.",
        ],
        why: "A run of length `k` has exactly one substring of length `k`, two of length `k-1`, …, `k` of length 1 — a triangular number, `k(k+1)/2`. Runs are disjoint, so their counts simply add.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting to flush the final run drops every substring in the last block.",
          "Enumerating all substrings is O(n²) and unnecessary.",
          "`k(k+1)/2` for `k = 1000` is 500,500 — comfortably in range, but the product `k*(k+1)` should still be computed before the division.",
        ],
      }),
      examples: [
        { input: '"aaaba"', expectedOutput: "8" },
        { input: '"aaaaaaaaaa"', expectedOutput: "55" },
        { input: '"abc"', expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        let s = "";
        const blocks = ri(rng, 1, 6);
        for (let i = 0; i < blocks; i++) {
          const c = pick(rng, ["a", "b", "c"]);
          s += c.repeat(ri(rng, 1, 6));
        }
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def countLetters(s: str) -> int:\n    total = 0\n    run = 1\n    for i in range(1, len(s) + 1):\n        if i < len(s) and s[i] == s[i - 1]:\n            run += 1\n        else:\n            total += run * (run + 1) // 2\n            run = 1\n    return total`,
        javascript: `var countLetters = function(s) {\n    let total = 0, run = 1;\n    for (let i = 1; i <= s.length; i++) {\n        if (i < s.length && s.charAt(i) === s.charAt(i - 1)) run++;\n        else {\n            total += (run * (run + 1)) / 2;\n            run = 1;\n        }\n    }\n    return total;\n};`,
        typescript: `function countLetters(s: string): number {\n    var total = 0, run = 1;\n    for (var i = 1; i <= s.length; i++) {\n        if (i < s.length && s.charAt(i) === s.charAt(i - 1)) run++;\n        else {\n            total += (run * (run + 1)) / 2;\n            run = 1;\n        }\n    }\n    return total;\n}`,
        java: `public static int countLetters(String s) {\n    long total = 0;\n    int run = 1;\n    for (int i = 1; i <= s.length(); i++) {\n        if (i < s.length() && s.charAt(i) == s.charAt(i - 1)) run++;\n        else {\n            total += (long) run * (run + 1) / 2;\n            run = 1;\n        }\n    }\n    return (int) total;\n}`,
        cpp: `int countLetters(string s) {\n    long long total = 0;\n    int run = 1;\n    for (int i = 1; i <= (int) s.size(); i++) {\n        if (i < (int) s.size() && s[i] == s[i - 1]) run++;\n        else {\n            total += (long long) run * (run + 1) / 2;\n            run = 1;\n        }\n    }\n    return (int) total;\n}`,
        c: `int countLetters(const char* s) {\n    int n = (int) strlen(s);\n    long long total = 0;\n    int run = 1;\n    for (int i = 1; i <= n; i++) {\n        if (i < n && s[i] == s[i - 1]) run++;\n        else {\n            total += (long long) run * (run + 1) / 2;\n            run = 1;\n        }\n    }\n    return (int) total;\n}`,
        csharp: `public static int CountLetters(string s)\n{\n    long total = 0;\n    int run = 1;\n    for (int i = 1; i <= s.Length; i++)\n    {\n        if (i < s.Length && s[i] == s[i - 1]) run++;\n        else\n        {\n            total += (long) run * (run + 1) / 2;\n            run = 1;\n        }\n    }\n    return (int) total;\n}`,
        go: `func countLetters(s string) int {\n\ttotal, run := 0, 1\n\tfor i := 1; i <= len(s); i++ {\n\t\tif i < len(s) && s[i] == s[i-1] {\n\t\t\trun++\n\t\t} else {\n\t\t\ttotal += run * (run + 1) / 2\n\t\t\trun = 1\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun countLetters(s: String): Int {\n    var total = 0L\n    var run = 1\n    for (i in 1..s.length) {\n        if (i < s.length && s[i] == s[i - 1]) run++\n        else {\n            total += run.toLong() * (run + 1) / 2\n            run = 1\n        }\n    }\n    return total.toInt()\n}`,
        swift: `func countLetters(_ s: String) -> Int {\n    let a = Array(s)\n    var total = 0\n    var run = 1\n    for i in 1...max(a.count, 1) {\n        if i < a.count && a[i] == a[i - 1] {\n            run += 1\n        } else {\n            total += run * (run + 1) / 2\n            run = 1\n        }\n    }\n    return total\n}`,
        rust: `fn countLetters(s: String) -> i32 {\n    let a = s.as_bytes();\n    let mut total: i64 = 0;\n    let mut run: i64 = 1;\n    for i in 1..=a.len() {\n        if i < a.len() && a[i] == a[i - 1] {\n            run += 1;\n        } else {\n            total += run * (run + 1) / 2;\n            run = 1;\n        }\n    }\n    total as i32\n}`,
        php: `function countLetters($s) {\n    $total = 0;\n    $run = 1;\n    $n = strlen($s);\n    for ($i = 1; $i <= $n; $i++) {\n        if ($i < $n && $s[$i] === $s[$i - 1]) $run++;\n        else {\n            $total += intdiv($run * ($run + 1), 2);\n            $run = 1;\n        }\n    }\n    return $total;\n}`,
        ruby: `def countLetters(s)\n  total = 0\n  run = 1\n  (1..s.length).each do |i|\n    if i < s.length && s[i] == s[i - 1]\n      run += 1\n    else\n      total += run * (run + 1) / 2\n      run = 1\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Check If a Word Occurs As a Prefix of Any Word (LC 1455) ────
  (() => {
    const ref = (sentence: string, searchWord: string) => {
      const words = sentence.split(" ");
      for (let i = 0; i < words.length; i++) {
        if (words[i].slice(0, searchWord.length) === searchWord) return i + 1;
      }
      return -1;
    };
    return {
      slug: "check-if-a-word-occurs-as-a-prefix-of-any-word-in-a-sentence",
      title: "Check If a Word Occurs As a Prefix of Any Word in a Sentence",
      difficulty: "EASY" as const,
      tags: ["String", "LeetCode 1455", "Amazon", "Wipro"],
      signature: {
        funcName: "isPrefixOfWord",
        params: [{ name: "sentence", type: "string" as const }, { name: "searchWord", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A sentence is a list of words separated by single spaces, with no leading or trailing spaces.\n\nReturn the **1-based index** of the first word in `sentence` that has `searchWord` as a prefix. If no word does, return `-1`.",
        [
          { in: 'sentence = "i love eating burger", searchWord = "burg"', out: "4", note: '"burger" is the 4th word and starts with "burg".' },
          { in: 'sentence = "this problem is an easy problem", searchWord = "pro"', out: "2", note: "The first match wins, even though the 6th word also matches." },
          { in: 'sentence = "i am tired", searchWord = "you"', out: "-1" },
        ],
        ["1 <= sentence.length <= 100", "1 <= searchWord.length <= 10", "Both consist of lowercase English letters and single spaces."]),
      hints: [
        "Split on spaces and test each word in order.",
        "A prefix test compares only the first `searchWord.length` characters.",
        "Return as soon as you find a match — indices are 1-based.",
      ],
      editorial: explain({
        idea: "Split the sentence into words and run a prefix test on each, left to right, stopping at the first hit.",
        steps: [
          "Split `sentence` on single spaces.",
          "For each word at 0-based index `i`, compare its first `searchWord.length` characters with `searchWord`.",
          "Return `i + 1` on the first match.",
          "Return `-1` if the loop finishes.",
        ],
        why: "The problem asks for the earliest match, and scanning in order with an early return delivers exactly that.",
        time: "O(n) over the sentence length",
        space: "O(n) for the split",
        pitfalls: [
          "Returning the 0-based index is the most common mistake — the answer is 1-based.",
          "Using a substring **search** instead of a prefix test matches `\"pro\"` inside `\"approve\"`, which is wrong.",
          "A word shorter than `searchWord` can never match; slicing must not go out of bounds.",
        ],
      }),
      examples: [
        { input: '"i love eating burger"\n"burg"', expectedOutput: "4" },
        { input: '"this problem is an easy problem"\n"pro"', expectedOutput: "2" },
        { input: '"i am tired"\n"you"', expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 6);
        const words = Array.from({ length: n }, () => randLower(rng, 1, 6, "abcde"));
        const sentence = words.join(" ");
        const searchWord = rng() < 0.6
          ? words[ri(rng, 0, n - 1)].slice(0, ri(rng, 1, 3))
          : randLower(rng, 1, 3, "abcde");
        return { input: `${JSON.stringify(sentence)}\n${JSON.stringify(searchWord)}`, expectedOutput: String(ref(sentence, searchWord)) };
      },
      solutions: {
        python: `def isPrefixOfWord(sentence: str, searchWord: str) -> int:\n    for i, w in enumerate(sentence.split(" ")):\n        if w.startswith(searchWord):\n            return i + 1\n    return -1`,
        javascript: `var isPrefixOfWord = function(sentence, searchWord) {\n    const words = sentence.split(" ");\n    for (let i = 0; i < words.length; i++) {\n        if (words[i].slice(0, searchWord.length) === searchWord) return i + 1;\n    }\n    return -1;\n};`,
        typescript: `function isPrefixOfWord(sentence: string, searchWord: string): number {\n    var words = sentence.split(" ");\n    for (var i = 0; i < words.length; i++) {\n        if (words[i].slice(0, searchWord.length) === searchWord) return i + 1;\n    }\n    return -1;\n}`,
        java: `public static int isPrefixOfWord(String sentence, String searchWord) {\n    String[] words = sentence.split(" ");\n    for (int i = 0; i < words.length; i++) {\n        if (words[i].startsWith(searchWord)) return i + 1;\n    }\n    return -1;\n}`,
        cpp: `int isPrefixOfWord(string sentence, string searchWord) {\n    vector<string> words;\n    string cur;\n    for (char c : sentence) {\n        if (c == ' ') { words.push_back(cur); cur.clear(); }\n        else cur += c;\n    }\n    words.push_back(cur);\n    for (int i = 0; i < (int) words.size(); i++) {\n        if (words[i].size() >= searchWord.size() && words[i].compare(0, searchWord.size(), searchWord) == 0) return i + 1;\n    }\n    return -1;\n}`,
        c: `int isPrefixOfWord(const char* sentence, const char* searchWord) {\n    int n = (int) strlen(sentence);\n    int wlen = (int) strlen(searchWord);\n    int i = 0, index = 1;\n    while (i <= n) {\n        int start = i;\n        while (i < n && sentence[i] != ' ') i++;\n        int len = i - start;\n        if (len >= wlen && strncmp(sentence + start, searchWord, wlen) == 0) return index;\n        index++;\n        i++;\n    }\n    return -1;\n}`,
        csharp: `public static int IsPrefixOfWord(string sentence, string searchWord)\n{\n    string[] words = sentence.Split(' ');\n    for (int i = 0; i < words.Length; i++)\n    {\n        if (words[i].StartsWith(searchWord)) return i + 1;\n    }\n    return -1;\n}`,
        go: `func isPrefixOfWord(sentence string, searchWord string) int {\n\twords := strings.Split(sentence, " ")\n\tfor i, w := range words {\n\t\tif strings.HasPrefix(w, searchWord) {\n\t\t\treturn i + 1\n\t\t}\n\t}\n\treturn -1\n}`,
        kotlin: `fun isPrefixOfWord(sentence: String, searchWord: String): Int {\n    val words = sentence.split(" ")\n    for (i in words.indices) {\n        if (words[i].startsWith(searchWord)) return i + 1\n    }\n    return -1\n}`,
        swift: `func isPrefixOfWord(_ sentence: String, _ searchWord: String) -> Int {\n    let words = sentence.split(separator: " ", omittingEmptySubsequences: false)\n    for (i, w) in words.enumerated() {\n        if w.hasPrefix(searchWord) { return i + 1 }\n    }\n    return -1\n}`,
        rust: `fn isPrefixOfWord(sentence: String, searchWord: String) -> i32 {\n    for (i, w) in sentence.split(' ').enumerate() {\n        if w.starts_with(&searchWord) {\n            return (i + 1) as i32;\n        }\n    }\n    -1\n}`,
        php: `function isPrefixOfWord($sentence, $searchWord) {\n    $words = explode(" ", $sentence);\n    foreach ($words as $i => $w) {\n        if (substr($w, 0, strlen($searchWord)) === $searchWord) return $i + 1;\n    }\n    return -1;\n}`,
        ruby: `def isPrefixOfWord(sentence, searchWord)\n  sentence.split(" ").each_with_index do |w, i|\n    return i + 1 if w.start_with?(searchWord)\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Thousand Separator (LC 1556) ────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const s = String(n);
      let out = "";
      for (let i = 0; i < s.length; i++) {
        if (i > 0 && (s.length - i) % 3 === 0) out += ".";
        out += s[i];
      }
      return out;
    };
    return {
      slug: "thousand-separator",
      title: "Thousand Separator",
      difficulty: "EASY" as const,
      tags: ["String", "LeetCode 1556", "Amazon", "TCS"],
      signature: { funcName: "thousandSeparator", params: [{ name: "n", type: "int" as const }], returns: "string" as const },
      description: describe(
        "Given a non-negative integer `n`, return its decimal representation with a dot (`.`) inserted as the thousands separator — every three digits, counting from the right.",
        [
          { in: "n = 987", out: "987", note: "Fewer than four digits, so no separator is added." },
          { in: "n = 1234", out: "1.234" },
          { in: "n = 123456789", out: "123.456.789" },
        ],
        ["0 <= n <= 2147483647"]),
      hints: [
        "Group from the **right**, not the left — the leftmost group may be shorter than three digits.",
        "Working left to right, insert a dot before index `i` when `(len - i)` is a positive multiple of 3.",
        "No separator ever precedes the first digit.",
      ],
      editorial: explain({
        idea: "Grouping is defined from the right, so the condition for a separator at a left-to-right position depends on the number of digits *remaining*, not on the position itself.",
        steps: [
          "Convert `n` to its decimal string.",
          "Walk the digits left to right.",
          "Before writing the digit at index `i`, emit a dot when `i > 0` and `(len - i) % 3 == 0`.",
          "Append the digit and continue.",
        ],
        why: "`len - i` counts the digits from `i` to the end. When that count is a multiple of three, position `i` starts a fresh group — exactly where the separator belongs. The `i > 0` guard prevents a leading dot when the length itself is a multiple of three.",
        time: "O(d) in the digit count",
        space: "O(d)",
        pitfalls: [
          "Inserting every third character from the left produces `123.456.789` correctly by luck but breaks on `1234` (giving `123.4`).",
          "Dropping the `i > 0` guard yields a leading dot for numbers whose length is divisible by 3.",
          "`n = 0` must return `\"0\"`.",
        ],
      }),
      examples: [
        { input: "987", expectedOutput: "987" },
        { input: "1234", expectedOutput: "1.234" },
        { input: "123456789", expectedOutput: "123.456.789" },
      ],
      gen: (rng: Rng) => {
        const roll = rng();
        const n = roll < 0.2 ? ri(rng, 0, 999) : roll < 0.6 ? ri(rng, 0, 999999) : ri(rng, 0, 2147483647);
        return { input: String(n), expectedOutput: ref(n) };
      },
      solutions: {
        python: `def thousandSeparator(n: int) -> str:\n    s = str(n)\n    out = []\n    for i, c in enumerate(s):\n        if i > 0 and (len(s) - i) % 3 == 0:\n            out.append('.')\n        out.append(c)\n    return ''.join(out)`,
        javascript: `var thousandSeparator = function(n) {\n    const s = String(n);\n    let out = "";\n    for (let i = 0; i < s.length; i++) {\n        if (i > 0 && (s.length - i) % 3 === 0) out += ".";\n        out += s.charAt(i);\n    }\n    return out;\n};`,
        typescript: `function thousandSeparator(n: number): string {\n    var s = String(n);\n    var out = "";\n    for (var i = 0; i < s.length; i++) {\n        if (i > 0 && (s.length - i) % 3 === 0) out += ".";\n        out += s.charAt(i);\n    }\n    return out;\n}`,
        java: `public static String thousandSeparator(int n) {\n    String s = Integer.toString(n);\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < s.length(); i++) {\n        if (i > 0 && (s.length() - i) % 3 == 0) sb.append('.');\n        sb.append(s.charAt(i));\n    }\n    return sb.toString();\n}`,
        cpp: `string thousandSeparator(int n) {\n    string s = to_string(n);\n    string out;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (i > 0 && ((int) s.size() - i) % 3 == 0) out += '.';\n        out += s[i];\n    }\n    return out;\n}`,
        c: `char* thousandSeparator(int n) {\n    char buf[16];\n    sprintf(buf, "%d", n);\n    int len = (int) strlen(buf);\n    char* out = (char*) malloc(len + len / 3 + 2);\n    int pos = 0;\n    for (int i = 0; i < len; i++) {\n        if (i > 0 && (len - i) % 3 == 0) out[pos++] = '.';\n        out[pos++] = buf[i];\n    }\n    out[pos] = '\\0';\n    return out;\n}`,
        csharp: `public static string ThousandSeparator(int n)\n{\n    string s = n.ToString();\n    var sb = new System.Text.StringBuilder();\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (i > 0 && (s.Length - i) % 3 == 0) sb.Append('.');\n        sb.Append(s[i]);\n    }\n    return sb.ToString();\n}`,
        go: `func thousandSeparator(n int) string {\n\ts := strconv.Itoa(n)\n\tvar b []byte\n\tfor i := 0; i < len(s); i++ {\n\t\tif i > 0 && (len(s)-i)%3 == 0 {\n\t\t\tb = append(b, '.')\n\t\t}\n\t\tb = append(b, s[i])\n\t}\n\treturn string(b)\n}`,
        kotlin: `fun thousandSeparator(n: Int): String {\n    val s = n.toString()\n    val sb = StringBuilder()\n    for (i in s.indices) {\n        if (i > 0 && (s.length - i) % 3 == 0) sb.append('.')\n        sb.append(s[i])\n    }\n    return sb.toString()\n}`,
        swift: `func thousandSeparator(_ n: Int) -> String {\n    let s = Array(String(n))\n    var out = ""\n    for i in 0..<s.count {\n        if i > 0 && (s.count - i) % 3 == 0 { out.append(".") }\n        out.append(s[i])\n    }\n    return out\n}`,
        rust: `fn thousandSeparator(n: i32) -> String {\n    let s = n.to_string();\n    let bytes = s.as_bytes();\n    let mut out = String::new();\n    for i in 0..bytes.len() {\n        if i > 0 && (bytes.len() - i) % 3 == 0 {\n            out.push('.');\n        }\n        out.push(bytes[i] as char);\n    }\n    out\n}`,
        php: `function thousandSeparator($n) {\n    $s = (string) $n;\n    $out = "";\n    $len = strlen($s);\n    for ($i = 0; $i < $len; $i++) {\n        if ($i > 0 && ($len - $i) % 3 === 0) $out .= ".";\n        $out .= $s[$i];\n    }\n    return $out;\n}`,
        ruby: `def thousandSeparator(n)\n  s = n.to_s\n  out = ""\n  s.each_char.with_index do |c, i|\n    out << "." if i > 0 && (s.length - i) % 3 == 0\n    out << c\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Maximum Repeating Substring (LC 1668) ───────────────────────
  (() => {
    const ref = (sequence: string, word: string) => {
      let k = 0;
      while (sequence.indexOf(word.repeat(k + 1)) !== -1) k++;
      return k;
    };
    return {
      slug: "maximum-repeating-substring",
      title: "Maximum Repeating Substring",
      difficulty: "EASY" as const,
      tags: ["String", "LeetCode 1668", "Amazon", "Adobe"],
      signature: {
        funcName: "maxRepeating",
        params: [{ name: "sequence", type: "string" as const }, { name: "word", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "For a string `word` and an integer `k`, `word` has **k-repeating value** in `sequence` if `word` concatenated `k` times is a substring of `sequence`.\n\nReturn the maximum such `k`, or `0` if `word` is not a substring of `sequence` at all.",
        [
          { in: 'sequence = "ababc", word = "ab"', out: "2", note: '"abab" occurs; "ababab" does not.' },
          { in: 'sequence = "ababc", word = "ba"', out: "1" },
          { in: 'sequence = "ababc", word = "ac"', out: "0" },
        ],
        ["1 <= sequence.length <= 100", "1 <= word.length <= 100", "Both strings consist of lowercase English letters."]),
      hints: [
        "The answer is bounded by `sequence.length / word.length`.",
        "Try `k = 1, 2, 3, …` and stop when the repeated word no longer occurs.",
        "Building the repeated string and using a plain substring search is fast enough here.",
      ],
      editorial: explain({
        idea: "The property is monotone: if `word` repeated `k` times occurs, so does `word` repeated `k-1` times. So climbing `k` from 1 and stopping at the first failure finds the maximum.",
        steps: [
          "Start with `k = 0`.",
          "While `word` repeated `k + 1` times is a substring of `sequence`, increment `k`.",
          "Return `k`.",
        ],
        why: "Monotonicity holds because any occurrence of `word^(k+1)` contains an occurrence of `word^k` as a prefix. The loop cannot run more than `sequence.length / word.length` times, since the repeated string outgrows the sequence.",
        time: "O(n²/m) in the worst case, well within the stated limits",
        space: "O(n) for the repeated string",
        pitfalls: [
          "Counting non-overlapping occurrences of `word` anywhere is wrong — the copies must be **consecutive**.",
          "Starting `k` at 1 and returning it unconditionally reports 1 when `word` never occurs.",
          "Binary searching `k` works but is unnecessary and easy to get off by one.",
        ],
      }),
      examples: [
        { input: '"ababc"\n"ab"', expectedOutput: "2" },
        { input: '"ababc"\n"ba"', expectedOutput: "1" },
        { input: '"ababc"\n"ac"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const word = randLower(rng, 1, 3, "abc");
        const sequence = rng() < 0.6
          ? randLower(rng, 0, 3, "abc") + word.repeat(ri(rng, 1, 4)) + randLower(rng, 0, 3, "abc")
          : randLower(rng, 1, 12, "abc");
        return { input: `${JSON.stringify(sequence)}\n${JSON.stringify(word)}`, expectedOutput: String(ref(sequence, word)) };
      },
      solutions: {
        python: `def maxRepeating(sequence: str, word: str) -> int:\n    k = 0\n    while word * (k + 1) in sequence:\n        k += 1\n    return k`,
        javascript: `var maxRepeating = function(sequence, word) {\n    let k = 0;\n    let cur = word;\n    while (sequence.indexOf(cur) !== -1) {\n        k++;\n        cur += word;\n    }\n    return k;\n};`,
        typescript: `function maxRepeating(sequence: string, word: string): number {\n    var k = 0;\n    var cur = word;\n    while (sequence.indexOf(cur) !== -1) {\n        k++;\n        cur += word;\n    }\n    return k;\n}`,
        java: `public static int maxRepeating(String sequence, String word) {\n    int k = 0;\n    StringBuilder cur = new StringBuilder(word);\n    while (sequence.contains(cur.toString())) {\n        k++;\n        cur.append(word);\n    }\n    return k;\n}`,
        cpp: `int maxRepeating(string sequence, string word) {\n    int k = 0;\n    string cur = word;\n    while (sequence.find(cur) != string::npos) {\n        k++;\n        cur += word;\n    }\n    return k;\n}`,
        c: `int maxRepeating(const char* sequence, const char* word) {\n    int n = (int) strlen(sequence);\n    int m = (int) strlen(word);\n    char* cur = (char*) malloc(n + m + 2);\n    strcpy(cur, word);\n    int k = 0;\n    while (strstr(sequence, cur) != NULL) {\n        k++;\n        if ((int) strlen(cur) + m > n + m) break;\n        strcat(cur, word);\n    }\n    free(cur);\n    return k;\n}`,
        csharp: `public static int MaxRepeating(string sequence, string word)\n{\n    int k = 0;\n    string cur = word;\n    while (sequence.Contains(cur))\n    {\n        k++;\n        cur += word;\n    }\n    return k;\n}`,
        go: `func maxRepeating(sequence string, word string) int {\n\tk := 0\n\tcur := word\n\tfor strings.Contains(sequence, cur) {\n\t\tk++\n\t\tcur += word\n\t}\n\treturn k\n}`,
        kotlin: `fun maxRepeating(sequence: String, word: String): Int {\n    var k = 0\n    var cur = word\n    while (sequence.contains(cur)) {\n        k++\n        cur += word\n    }\n    return k\n}`,
        swift: `func maxRepeating(_ sequence: String, _ word: String) -> Int {\n    var k = 0\n    var cur = word\n    while sequence.range(of: cur) != nil {\n        k += 1\n        cur += word\n    }\n    return k\n}`,
        rust: `fn maxRepeating(sequence: String, word: String) -> i32 {\n    let mut k = 0;\n    let mut cur = word.clone();\n    while sequence.contains(&cur) {\n        k += 1;\n        cur.push_str(&word);\n    }\n    k\n}`,
        php: `function maxRepeating($sequence, $word) {\n    $k = 0;\n    $cur = $word;\n    while (strpos($sequence, $cur) !== false) {\n        $k++;\n        $cur .= $word;\n    }\n    return $k;\n}`,
        ruby: `def maxRepeating(sequence, word)\n  k = 0\n  cur = word.dup\n  while sequence.include?(cur)\n    k += 1\n    cur += word\n  end\n  k\nend`,
      },
    };
  })(),

  // ── Number of Different Integers in a String (LC 1805) ──────────
  (() => {
    const ref = (word: string) => {
      const seen: Record<string, boolean> = {};
      let i = 0;
      while (i < word.length) {
        if (word[i] >= "0" && word[i] <= "9") {
          let j = i;
          while (j < word.length && word[j] >= "0" && word[j] <= "9") j++;
          let t = word.slice(i, j).replace(/^0+/, "");
          if (t === "") t = "0";
          seen[t] = true;
          i = j;
        } else i++;
      }
      return Object.keys(seen).length;
    };
    return {
      slug: "number-of-different-integers-in-a-string",
      title: "Number of Different Integers in a String",
      difficulty: "EASY" as const,
      tags: ["String", "Hash Table", "LeetCode 1805", "Amazon", "Google"],
      signature: { funcName: "numDifferentIntegers", params: [{ name: "word", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `word` of digits and lowercase letters. Replace every maximal run of letters with a single space, then read off the integers that remain.\n\nReturn how many **different** integers appear. Leading zeros are ignored, so `\"01\"` and `\"1\"` are the same integer.",
        [
          { in: 'word = "a123bc34d8ef34"', out: "3", note: "The integers are 123, 34, 8 and 34 — three distinct values." },
          { in: 'word = "leet1234code234"', out: "2" },
          { in: 'word = "a1b01c001"', out: "1", note: "All three are the integer 1." },
        ],
        ["1 <= word.length <= 1000", "word consists of digits and lowercase English letters."]),
      hints: [
        "Scan for maximal digit runs rather than splitting on every letter.",
        "Strip leading zeros before comparing — but a run of all zeros is the integer 0, not the empty string.",
        "The numbers may be far too large for a 64-bit integer, so compare them as normalised strings.",
      ],
      editorial: explain({
        idea: "The integers can be up to 1000 digits long, so they must be compared as strings. Normalising each digit run by stripping leading zeros makes string equality agree with numeric equality.",
        steps: [
          "Walk the string, skipping letters.",
          "On a digit, extend to the end of the maximal digit run.",
          "Strip leading zeros from the run; if nothing is left, use `\"0\"`.",
          "Insert the normalised string into a set and continue after the run.",
          "Return the set's size.",
        ],
        why: "Two digit runs denote the same integer exactly when they agree after leading zeros are removed, so normalised-string equality is precisely numeric equality — without ever needing a numeric type.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Parsing to `int`/`long` overflows on runs longer than about 19 digits.",
          "Stripping every zero rather than only the leading ones turns `\"100\"` into `\"1\"`.",
          "A run of all zeros normalises to `\"0\"`, not to the empty string.",
        ],
      }),
      examples: [
        { input: '"a123bc34d8ef34"', expectedOutput: "3" },
        { input: '"leet1234code234"', expectedOutput: "2" },
        { input: '"a1b01c001"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        let word = "";
        const parts = ri(rng, 1, 6);
        for (let i = 0; i < parts; i++) {
          word += randLower(rng, 1, 3, "abc");
          const digits = ri(rng, 1, 4);
          let num = "";
          for (let d = 0; d < digits; d++) num += String(ri(rng, 0, 9));
          word += num;
        }
        if (word.length === 0) word = "a1";
        return { input: JSON.stringify(word), expectedOutput: String(ref(word)) };
      },
      solutions: {
        python: `def numDifferentIntegers(word: str) -> int:\n    seen = set()\n    i = 0\n    n = len(word)\n    while i < n:\n        if word[i].isdigit():\n            j = i\n            while j < n and word[j].isdigit():\n                j += 1\n            t = word[i:j].lstrip('0')\n            seen.add(t if t else '0')\n            i = j\n        else:\n            i += 1\n    return len(seen)`,
        javascript: `var numDifferentIntegers = function(word) {\n    const seen = {};\n    let i = 0;\n    while (i < word.length) {\n        const c = word.charAt(i);\n        if (c >= "0" && c <= "9") {\n            let j = i;\n            while (j < word.length && word.charAt(j) >= "0" && word.charAt(j) <= "9") j++;\n            let t = word.slice(i, j);\n            let k = 0;\n            while (k < t.length - 1 && t.charAt(k) === "0") k++;\n            t = t.slice(k);\n            if (t === "") t = "0";\n            seen[t] = true;\n            i = j;\n        } else {\n            i++;\n        }\n    }\n    return Object.keys(seen).length;\n};`,
        typescript: `function numDifferentIntegers(word: string): number {\n    var seen: { [key: string]: boolean } = {};\n    var i = 0;\n    while (i < word.length) {\n        var c = word.charAt(i);\n        if (c >= "0" && c <= "9") {\n            var j = i;\n            while (j < word.length && word.charAt(j) >= "0" && word.charAt(j) <= "9") j++;\n            var t = word.slice(i, j);\n            var k = 0;\n            while (k < t.length - 1 && t.charAt(k) === "0") k++;\n            t = t.slice(k);\n            if (t === "") t = "0";\n            seen[t] = true;\n            i = j;\n        } else {\n            i++;\n        }\n    }\n    return Object.keys(seen).length;\n}`,
        java: `public static int numDifferentIntegers(String word) {\n    HashSet<String> seen = new HashSet<>();\n    int i = 0, n = word.length();\n    while (i < n) {\n        char c = word.charAt(i);\n        if (c >= '0' && c <= '9') {\n            int j = i;\n            while (j < n && word.charAt(j) >= '0' && word.charAt(j) <= '9') j++;\n            int k = i;\n            while (k < j - 1 && word.charAt(k) == '0') k++;\n            seen.add(word.substring(k, j));\n            i = j;\n        } else {\n            i++;\n        }\n    }\n    return seen.size();\n}`,
        cpp: `int numDifferentIntegers(string word) {\n    unordered_set<string> seen;\n    int i = 0, n = (int) word.size();\n    while (i < n) {\n        if (word[i] >= '0' && word[i] <= '9') {\n            int j = i;\n            while (j < n && word[j] >= '0' && word[j] <= '9') j++;\n            int k = i;\n            while (k < j - 1 && word[k] == '0') k++;\n            seen.insert(word.substr(k, j - k));\n            i = j;\n        } else {\n            i++;\n        }\n    }\n    return (int) seen.size();\n}`,
        c: `int numDifferentIntegers(const char* word) {\n    int n = (int) strlen(word);\n    char** seen = (char**) malloc((n + 1) * sizeof(char*));\n    int m = 0;\n    int i = 0;\n    while (i < n) {\n        if (word[i] >= '0' && word[i] <= '9') {\n            int j = i;\n            while (j < n && word[j] >= '0' && word[j] <= '9') j++;\n            int k = i;\n            while (k < j - 1 && word[k] == '0') k++;\n            int len = j - k;\n            char* t = (char*) malloc(len + 1);\n            memcpy(t, word + k, len);\n            t[len] = '\\0';\n            int dup = 0;\n            for (int q = 0; q < m; q++) {\n                if (strcmp(seen[q], t) == 0) { dup = 1; break; }\n            }\n            if (dup) free(t);\n            else seen[m++] = t;\n            i = j;\n        } else {\n            i++;\n        }\n    }\n    for (int q = 0; q < m; q++) free(seen[q]);\n    free(seen);\n    return m;\n}`,
        csharp: `public static int NumDifferentIntegers(string word)\n{\n    var seen = new HashSet<string>();\n    int i = 0, n = word.Length;\n    while (i < n)\n    {\n        char c = word[i];\n        if (c >= '0' && c <= '9')\n        {\n            int j = i;\n            while (j < n && word[j] >= '0' && word[j] <= '9') j++;\n            int k = i;\n            while (k < j - 1 && word[k] == '0') k++;\n            seen.Add(word.Substring(k, j - k));\n            i = j;\n        }\n        else\n        {\n            i++;\n        }\n    }\n    return seen.Count;\n}`,
        go: `func numDifferentIntegers(word string) int {\n\tseen := map[string]bool{}\n\tn := len(word)\n\ti := 0\n\tfor i < n {\n\t\tif word[i] >= '0' && word[i] <= '9' {\n\t\t\tj := i\n\t\t\tfor j < n && word[j] >= '0' && word[j] <= '9' {\n\t\t\t\tj++\n\t\t\t}\n\t\t\tk := i\n\t\t\tfor k < j-1 && word[k] == '0' {\n\t\t\t\tk++\n\t\t\t}\n\t\t\tseen[word[k:j]] = true\n\t\t\ti = j\n\t\t} else {\n\t\t\ti++\n\t\t}\n\t}\n\treturn len(seen)\n}`,
        kotlin: `fun numDifferentIntegers(word: String): Int {\n    val seen = HashSet<String>()\n    var i = 0\n    val n = word.length\n    while (i < n) {\n        if (word[i] in '0'..'9') {\n            var j = i\n            while (j < n && word[j] in '0'..'9') j++\n            var k = i\n            while (k < j - 1 && word[k] == '0') k++\n            seen.add(word.substring(k, j))\n            i = j\n        } else {\n            i++\n        }\n    }\n    return seen.size\n}`,
        swift: `func numDifferentIntegers(_ word: String) -> Int {\n    let a = Array(word)\n    var seen = Set<String>()\n    var i = 0\n    while i < a.count {\n        if a[i] >= "0" && a[i] <= "9" {\n            var j = i\n            while j < a.count && a[j] >= "0" && a[j] <= "9" { j += 1 }\n            var k = i\n            while k < j - 1 && a[k] == "0" { k += 1 }\n            seen.insert(String(a[k..<j]))\n            i = j\n        } else {\n            i += 1\n        }\n    }\n    return seen.count\n}`,
        rust: `fn numDifferentIntegers(word: String) -> i32 {\n    use std::collections::HashSet;\n    let a = word.as_bytes();\n    let n = a.len();\n    let mut seen: HashSet<String> = HashSet::new();\n    let mut i = 0;\n    while i < n {\n        if a[i].is_ascii_digit() {\n            let mut j = i;\n            while j < n && a[j].is_ascii_digit() {\n                j += 1;\n            }\n            let mut k = i;\n            while k < j - 1 && a[k] == b'0' {\n                k += 1;\n            }\n            seen.insert(String::from_utf8(a[k..j].to_vec()).unwrap());\n            i = j;\n        } else {\n            i += 1;\n        }\n    }\n    seen.len() as i32\n}`,
        php: `function numDifferentIntegers($word) {\n    $seen = array();\n    $n = strlen($word);\n    $i = 0;\n    while ($i < $n) {\n        if ($word[$i] >= '0' && $word[$i] <= '9') {\n            $j = $i;\n            while ($j < $n && $word[$j] >= '0' && $word[$j] <= '9') $j++;\n            $k = $i;\n            while ($k < $j - 1 && $word[$k] === '0') $k++;\n            $seen[substr($word, $k, $j - $k)] = true;\n            $i = $j;\n        } else {\n            $i++;\n        }\n    }\n    return count($seen);\n}`,
        ruby: `def numDifferentIntegers(word)\n  seen = {}\n  n = word.length\n  i = 0\n  while i < n\n    if word[i] >= '0' && word[i] <= '9'\n      j = i\n      j += 1 while j < n && word[j] >= '0' && word[j] <= '9'\n      k = i\n      k += 1 while k < j - 1 && word[k] == '0'\n      seen[word[k...j]] = true\n      i = j\n    else\n      i += 1\n    end\n  end\n  seen.size\nend`,
      },
    };
  })(),

  // ── Replace All Digits with Characters (LC 1844) ────────────────
  (() => {
    const ref = (s: string) => {
      const a = s.split("");
      for (let i = 1; i < a.length; i += 2) {
        a[i] = String.fromCharCode(a[i - 1].charCodeAt(0) + Number(a[i]));
      }
      return a.join("");
    };
    return {
      slug: "replace-all-digits-with-characters",
      title: "Replace All Digits with Characters",
      difficulty: "EASY" as const,
      tags: ["String", "LeetCode 1844", "Amazon", "Infosys"],
      signature: { funcName: "replaceDigits", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a 0-indexed string `s` whose **even** indices hold lowercase letters and whose **odd** indices hold digits.\n\nFor every odd index `i`, replace `s[i]` with the letter obtained by shifting `s[i-1]` forward by `s[i]` positions in the alphabet. Shifting never goes past `'z'`.\n\nReturn the resulting string.",
        [
          { in: 's = "a1c1e1"', out: "abcdef", note: "a shifted by 1 is b, c shifted by 1 is d, e shifted by 1 is f." },
          { in: 's = "a1b2c3d4"', out: "abbdcfdh" },
          { in: 's = "z"', out: "z", note: "No odd index exists." },
        ],
        ["1 <= s.length <= 100", "Even indices hold lowercase letters; odd indices hold digits.", "The shift never moves a letter past 'z'."]),
      hints: [
        "Work on a mutable character array, not the immutable string.",
        "Only odd indices change, and each depends on the character immediately before it.",
        "Shifting means adding the digit's numeric value to the letter's code point.",
      ],
      editorial: explain({
        idea: "Each odd position is a pure function of the letter at the previous even position and the digit itself — no state carries across pairs.",
        steps: [
          "Copy the string into a character array.",
          "For every odd index `i`, set `a[i] = a[i-1] + (a[i] - '0')` as a character.",
          "Join the array back into a string.",
        ],
        why: "The problem guarantees a letter at every even index, so `a[i-1]` is always a letter when `i` is odd — and because only odd slots are written, the letters the shifts read are never modified.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Using the *already replaced* previous character chains the shifts together; each pair must use the original even-index letter, which is untouched anyway if you only write odd slots.",
          "Converting the digit character with its raw code point instead of its numeric value shifts by about 48 positions.",
        ],
      }),
      examples: [
        { input: '"a1c1e1"', expectedOutput: "abcdef" },
        { input: '"a1b2c3d4"', expectedOutput: "abbdcfdh" },
        { input: '"z"', expectedOutput: "z" },
      ],
      gen: (rng: Rng) => {
        const pairs = ri(rng, 1, 10);
        let s = "";
        for (let i = 0; i < pairs; i++) {
          const letter = String.fromCharCode(97 + ri(rng, 0, 19));
          s += letter;
          if (i < pairs - 1 || rng() < 0.7) s += String(ri(rng, 0, 5));
        }
        return { input: JSON.stringify(s), expectedOutput: ref(s) };
      },
      solutions: {
        python: `def replaceDigits(s: str) -> str:\n    a = list(s)\n    for i in range(1, len(a), 2):\n        a[i] = chr(ord(a[i - 1]) + int(a[i]))\n    return ''.join(a)`,
        javascript: `var replaceDigits = function(s) {\n    const a = s.split("");\n    for (let i = 1; i < a.length; i += 2) {\n        a[i] = String.fromCharCode(a[i - 1].charCodeAt(0) + Number(a[i]));\n    }\n    return a.join("");\n};`,
        typescript: `function replaceDigits(s: string): string {\n    var a = s.split("");\n    for (var i = 1; i < a.length; i += 2) {\n        a[i] = String.fromCharCode(a[i - 1].charCodeAt(0) + Number(a[i]));\n    }\n    return a.join("");\n}`,
        java: `public static String replaceDigits(String s) {\n    char[] a = s.toCharArray();\n    for (int i = 1; i < a.length; i += 2) {\n        a[i] = (char) (a[i - 1] + (a[i] - '0'));\n    }\n    return new String(a);\n}`,
        cpp: `string replaceDigits(string s) {\n    for (int i = 1; i < (int) s.size(); i += 2) {\n        s[i] = (char) (s[i - 1] + (s[i] - '0'));\n    }\n    return s;\n}`,
        c: `char* replaceDigits(const char* s) {\n    int n = (int) strlen(s);\n    char* a = (char*) malloc(n + 1);\n    for (int i = 0; i < n; i++) a[i] = s[i];\n    a[n] = '\\0';\n    for (int i = 1; i < n; i += 2) {\n        a[i] = (char) (a[i - 1] + (a[i] - '0'));\n    }\n    return a;\n}`,
        csharp: `public static string ReplaceDigits(string s)\n{\n    char[] a = s.ToCharArray();\n    for (int i = 1; i < a.Length; i += 2)\n    {\n        a[i] = (char) (a[i - 1] + (a[i] - '0'));\n    }\n    return new string(a);\n}`,
        go: `func replaceDigits(s string) string {\n\ta := []byte(s)\n\tfor i := 1; i < len(a); i += 2 {\n\t\ta[i] = a[i-1] + (a[i] - '0')\n\t}\n\treturn string(a)\n}`,
        kotlin: `fun replaceDigits(s: String): String {\n    val a = s.toCharArray()\n    var i = 1\n    while (i < a.size) {\n        a[i] = (a[i - 1].toInt() + (a[i].toInt() - '0'.toInt())).toChar()\n        i += 2\n    }\n    return String(a)\n}`,
        swift: `func replaceDigits(_ s: String) -> String {\n    var a = Array(s.unicodeScalars).map { Int($0.value) }\n    var i = 1\n    while i < a.count {\n        a[i] = a[i - 1] + (a[i] - 48)\n        i += 2\n    }\n    var out = ""\n    for v in a { out.append(Character(UnicodeScalar(UInt32(v))!)) }\n    return out\n}`,
        rust: `fn replaceDigits(s: String) -> String {\n    let mut a: Vec<u8> = s.into_bytes();\n    let mut i = 1;\n    while i < a.len() {\n        a[i] = a[i - 1] + (a[i] - b'0');\n        i += 2;\n    }\n    String::from_utf8(a).unwrap()\n}`,
        php: `function replaceDigits($s) {\n    $a = str_split($s);\n    for ($i = 1; $i < count($a); $i += 2) {\n        $a[$i] = chr(ord($a[$i - 1]) + intval($a[$i]));\n    }\n    return implode("", $a);\n}`,
        ruby: `def replaceDigits(s)\n  a = s.chars\n  i = 1\n  while i < a.length\n    a[i] = (a[i - 1].ord + a[i].to_i).chr\n    i += 2\n  end\n  a.join\nend`,
      },
    };
  })(),

  // ── Determine Color of a Chessboard Square (LC 1812) ────────────
  (() => {
    const ref = (coordinates: string) => {
      const file = coordinates.charCodeAt(0) - 97;
      const rank = coordinates.charCodeAt(1) - 49;
      return (file + rank) % 2 === 1;
    };
    return {
      slug: "determine-color-of-a-chessboard-square",
      title: "Determine Color of a Chessboard Square",
      difficulty: "EASY" as const,
      tags: ["Math", "String", "LeetCode 1812", "Amazon", "Adobe"],
      signature: { funcName: "squareIsWhite", params: [{ name: "coordinates", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "You are given `coordinates`, a two-character string naming a square on a standard chessboard — a file letter `a`-`h` followed by a rank digit `1`-`8`.\n\nReturn `true` if that square is **white** and `false` if it is black. On a standard board, `a1` is black.",
        [
          { in: 'coordinates = "a1"', out: "false", note: "The bottom-left corner is black." },
          { in: 'coordinates = "h3"', out: "true" },
          { in: 'coordinates = "c7"', out: "false" },
        ],
        ["coordinates.length == 2", "The first character is between 'a' and 'h'.", "The second character is between '1' and '8'."]),
      hints: [
        "Convert the file letter and the rank digit into 0-based numbers.",
        "Neighbouring squares always differ in colour, so colour depends on the parity of their sum.",
        "Fix the parity using the known anchor: `a1` (0 + 0) is black.",
      ],
      editorial: explain({
        idea: "A chessboard is a parity checkerboard: the colour of a square is decided entirely by whether `file + rank` is even or odd.",
        steps: [
          "Map the file letter to `0..7` via `c - 'a'` and the rank digit to `0..7` via `d - '1'`.",
          "Compute the parity of their sum.",
          "Return `true` (white) when the sum is odd, since `a1` — sum 0, even — is black.",
        ],
        why: "Moving one square in any direction changes exactly one coordinate by one, flipping the parity of the sum — which is precisely how the alternating colours work. Anchoring on `a1` fixes which parity is which.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Subtracting `'0'` instead of `'1'` from the rank shifts the parity and inverts every answer.",
          "Getting the anchor backwards flips the whole board — check against a known square such as `h3` (white).",
        ],
      }),
      examples: [
        { input: '"a1"', expectedOutput: "false" },
        { input: '"h3"', expectedOutput: "true" },
        { input: '"c7"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const file = String.fromCharCode(97 + ri(rng, 0, 7));
        const rank = String(ri(rng, 1, 8));
        const c = file + rank;
        return { input: JSON.stringify(c), expectedOutput: bool(ref(c)) };
      },
      solutions: {
        python: `def squareIsWhite(coordinates: str) -> bool:\n    file = ord(coordinates[0]) - ord('a')\n    rank = ord(coordinates[1]) - ord('1')\n    return (file + rank) % 2 == 1`,
        javascript: `var squareIsWhite = function(coordinates) {\n    const file = coordinates.charCodeAt(0) - 97;\n    const rank = coordinates.charCodeAt(1) - 49;\n    return (file + rank) % 2 === 1;\n};`,
        typescript: `function squareIsWhite(coordinates: string): boolean {\n    var file = coordinates.charCodeAt(0) - 97;\n    var rank = coordinates.charCodeAt(1) - 49;\n    return (file + rank) % 2 === 1;\n}`,
        java: `public static boolean squareIsWhite(String coordinates) {\n    int file = coordinates.charAt(0) - 'a';\n    int rank = coordinates.charAt(1) - '1';\n    return (file + rank) % 2 == 1;\n}`,
        cpp: `bool squareIsWhite(string coordinates) {\n    int file = coordinates[0] - 'a';\n    int rank = coordinates[1] - '1';\n    return (file + rank) % 2 == 1;\n}`,
        c: `bool squareIsWhite(const char* coordinates) {\n    int file = coordinates[0] - 'a';\n    int rank = coordinates[1] - '1';\n    return (file + rank) % 2 == 1;\n}`,
        csharp: `public static bool SquareIsWhite(string coordinates)\n{\n    int file = coordinates[0] - 'a';\n    int rank = coordinates[1] - '1';\n    return (file + rank) % 2 == 1;\n}`,
        go: `func squareIsWhite(coordinates string) bool {\n\tfile := int(coordinates[0] - 'a')\n\trank := int(coordinates[1] - '1')\n\treturn (file+rank)%2 == 1\n}`,
        kotlin: `fun squareIsWhite(coordinates: String): Boolean {\n    val file = coordinates[0] - 'a'\n    val rank = coordinates[1] - '1'\n    return (file + rank) % 2 == 1\n}`,
        swift: `func squareIsWhite(_ coordinates: String) -> Bool {\n    let a = Array(coordinates.unicodeScalars)\n    let file = Int(a[0].value) - 97\n    let rank = Int(a[1].value) - 49\n    return (file + rank) % 2 == 1\n}`,
        rust: `fn squareIsWhite(coordinates: String) -> bool {\n    let a = coordinates.as_bytes();\n    let file = (a[0] - b'a') as i32;\n    let rank = (a[1] - b'1') as i32;\n    (file + rank) % 2 == 1\n}`,
        php: `function squareIsWhite($coordinates) {\n    $file = ord($coordinates[0]) - 97;\n    $rank = ord($coordinates[1]) - 49;\n    return ($file + $rank) % 2 === 1;\n}`,
        ruby: `def squareIsWhite(coordinates)\n  file = coordinates[0].ord - 97\n  rank = coordinates[1].ord - 49\n  (file + rank) % 2 == 1\nend`,
      },
    };
  })(),

  // ── Check If Word Equals Summation of Two Words (LC 1880) ──────
  (() => {
    const val = (w: string) => {
      let n = 0;
      for (const c of w) n = n * 10 + (c.charCodeAt(0) - 97);
      return n;
    };
    const ref = (a: string, b: string, t: string) => val(a) + val(b) === val(t);
    return {
      slug: "check-if-word-equals-summation-of-two-words",
      title: "Check If Word Equals Summation of Two Words",
      difficulty: "EASY" as const,
      tags: ["String", "Math", "LeetCode 1880", "Amazon", "TCS"],
      signature: {
        funcName: "isSumEqual",
        params: [
          { name: "firstWord", type: "string" as const },
          { name: "secondWord", type: "string" as const },
          { name: "targetWord", type: "string" as const },
        ],
        returns: "bool" as const,
      },
      description: describe(
        "The letters `a` through `j` stand for the digits `0` through `9`. The **numerical value** of a word is obtained by replacing each letter with its digit and reading the result as a base-10 number — so `\"acb\"` becomes `021`, which is `21`.\n\nGiven three such words, return `true` if the value of `firstWord` plus the value of `secondWord` equals the value of `targetWord`.",
        [
          { in: 'firstWord = "acb", secondWord = "cba", targetWord = "cdb"', out: "true", note: "21 + 210 = 231." },
          { in: 'firstWord = "aaa", secondWord = "a", targetWord = "aab"', out: "false", note: "0 + 0 is 0, not 1." },
          { in: 'firstWord = "aaa", secondWord = "a", targetWord = "aaaa"', out: "true", note: "0 + 0 = 0, and \"aaaa\" is also 0." },
        ],
        ["1 <= firstWord.length, secondWord.length, targetWord.length <= 8", "All three consist of letters from 'a' to 'j'."]),
      hints: [
        "Map each letter to `c - 'a'` to get its digit.",
        "Build the number with the usual `n = n * 10 + digit` accumulation.",
        "Leading zeros are fine — `\"aaa\"` is simply 0.",
      ],
      editorial: explain({
        idea: "Decoding a word is ordinary base-10 assembly with a letter-to-digit shift, after which the check is plain integer arithmetic.",
        steps: [
          "Write a helper that folds a word into a number via `n = n * 10 + (c - 'a')`.",
          "Apply it to all three words.",
          "Return whether the first two values sum to the third.",
        ],
        why: "The mapping is a bijection between the letters `a`-`j` and the digits `0`-`9`, so decoding then comparing is exactly the stated condition. With at most 8 letters the largest value is 99,999,999, which fits comfortably in 32 bits.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Concatenating the digit characters and comparing strings fails on leading zeros — `\"aab\"` (1) and `\"ab\"` (1) are equal as numbers.",
          "Subtracting `'0'` instead of `'a'` produces nonsense.",
        ],
      }),
      examples: [
        { input: '"acb"\n"cba"\n"cdb"', expectedOutput: "true" },
        { input: '"aaa"\n"a"\n"aab"', expectedOutput: "false" },
        { input: '"aaa"\n"a"\n"aaaa"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const mk = () => randLower(rng, 1, 4, "abcj");
        const a = mk(), b = mk();
        let t = mk();
        if (rng() < 0.4) {
          const sum = val(a) + val(b);
          t = String(sum).split("").map((d) => String.fromCharCode(97 + Number(d))).join("");
          if (t.length > 8) t = mk();
        }
        return { input: `${JSON.stringify(a)}\n${JSON.stringify(b)}\n${JSON.stringify(t)}`, expectedOutput: bool(ref(a, b, t)) };
      },
      solutions: {
        python: `def isSumEqual(firstWord: str, secondWord: str, targetWord: str) -> bool:\n    def val(w):\n        n = 0\n        for c in w:\n            n = n * 10 + (ord(c) - 97)\n        return n\n    return val(firstWord) + val(secondWord) == val(targetWord)`,
        javascript: `var isSumEqual = function(firstWord, secondWord, targetWord) {\n    function val(w) {\n        let n = 0;\n        for (let i = 0; i < w.length; i++) n = n * 10 + (w.charCodeAt(i) - 97);\n        return n;\n    }\n    return val(firstWord) + val(secondWord) === val(targetWord);\n};`,
        typescript: `function isSumEqual(firstWord: string, secondWord: string, targetWord: string): boolean {\n    function val(w: string): number {\n        var n = 0;\n        for (var i = 0; i < w.length; i++) n = n * 10 + (w.charCodeAt(i) - 97);\n        return n;\n    }\n    return val(firstWord) + val(secondWord) === val(targetWord);\n}`,
        java: `public static boolean isSumEqual(String firstWord, String secondWord, String targetWord) {\n    return wordValueSum(firstWord) + wordValueSum(secondWord) == wordValueSum(targetWord);\n}\n\nstatic long wordValueSum(String w) {\n    long n = 0;\n    for (int i = 0; i < w.length(); i++) n = n * 10 + (w.charAt(i) - 'a');\n    return n;\n}`,
        cpp: `long long wordValueSum(const string& w) {\n    long long n = 0;\n    for (char c : w) n = n * 10 + (c - 'a');\n    return n;\n}\n\nbool isSumEqual(string firstWord, string secondWord, string targetWord) {\n    return wordValueSum(firstWord) + wordValueSum(secondWord) == wordValueSum(targetWord);\n}`,
        c: `static long long word_value_sum(const char* w) {\n    long long n = 0;\n    for (int i = 0; w[i] != '\\0'; i++) n = n * 10 + (w[i] - 'a');\n    return n;\n}\n\nbool isSumEqual(const char* firstWord, const char* secondWord, const char* targetWord) {\n    return word_value_sum(firstWord) + word_value_sum(secondWord) == word_value_sum(targetWord);\n}`,
        csharp: `public static bool IsSumEqual(string firstWord, string secondWord, string targetWord)\n{\n    Func<string, long> val = w =>\n    {\n        long n = 0;\n        foreach (char c in w) n = n * 10 + (c - 'a');\n        return n;\n    };\n    return val(firstWord) + val(secondWord) == val(targetWord);\n}`,
        go: `func isSumEqual(firstWord string, secondWord string, targetWord string) bool {\n\tval := func(w string) int {\n\t\tn := 0\n\t\tfor i := 0; i < len(w); i++ {\n\t\t\tn = n*10 + int(w[i]-'a')\n\t\t}\n\t\treturn n\n\t}\n\treturn val(firstWord)+val(secondWord) == val(targetWord)\n}`,
        kotlin: `fun isSumEqual(firstWord: String, secondWord: String, targetWord: String): Boolean {\n    fun value(w: String): Long {\n        var n = 0L\n        for (c in w) n = n * 10 + (c - 'a')\n        return n\n    }\n    return value(firstWord) + value(secondWord) == value(targetWord)\n}`,
        swift: `func isSumEqual(_ firstWord: String, _ secondWord: String, _ targetWord: String) -> Bool {\n    func val(_ w: String) -> Int {\n        var n = 0\n        for u in w.unicodeScalars { n = n * 10 + (Int(u.value) - 97) }\n        return n\n    }\n    return val(firstWord) + val(secondWord) == val(targetWord)\n}`,
        rust: `fn isSumEqual(firstWord: String, secondWord: String, targetWord: String) -> bool {\n    fn val(w: &str) -> i64 {\n        let mut n: i64 = 0;\n        for b in w.bytes() {\n            n = n * 10 + (b - b'a') as i64;\n        }\n        n\n    }\n    val(&firstWord) + val(&secondWord) == val(&targetWord)\n}`,
        php: `function isSumEqual($firstWord, $secondWord, $targetWord) {\n    $val = function($w) {\n        $n = 0;\n        for ($i = 0; $i < strlen($w); $i++) $n = $n * 10 + (ord($w[$i]) - 97);\n        return $n;\n    };\n    return $val($firstWord) + $val($secondWord) === $val($targetWord);\n}`,
        ruby: `def isSumEqual(firstWord, secondWord, targetWord)\n  val = lambda do |w|\n    n = 0\n    w.each_char { |c| n = n * 10 + (c.ord - 97) }\n    n\n  end\n  val.call(firstWord) + val.call(secondWord) == val.call(targetWord)\nend`,
      },
    };
  })(),

  // ── Maximum Number of Words You Can Type (LC 1935) ──────────────
  (() => {
    const ref = (text: string, brokenLetters: string) => {
      const broken: Record<string, boolean> = {};
      for (const c of brokenLetters) broken[c] = true;
      let count = 0;
      for (const w of text.split(" ")) {
        let ok = true;
        for (const c of w) if (broken[c]) { ok = false; break; }
        if (ok) count++;
      }
      return count;
    };
    return {
      slug: "maximum-number-of-words-you-can-type",
      title: "Maximum Number of Words You Can Type",
      difficulty: "EASY" as const,
      tags: ["String", "Hash Table", "LeetCode 1935", "Amazon", "Cognizant"],
      signature: {
        funcName: "canBeTypedWords",
        params: [{ name: "text", type: "string" as const }, { name: "brokenLetters", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A keyboard has some broken letter keys. Given `text` — words separated by single spaces — and `brokenLetters` listing the distinct broken keys, return how many words can still be typed in full.",
        [
          { in: 'text = "hello world", brokenLetters = "ad"', out: "1", note: '"world" contains a d, so only "hello" can be typed.' },
          { in: 'text = "leet code", brokenLetters = "lt"', out: "1" },
          { in: 'text = "leet code", brokenLetters = "e"', out: "0" },
        ],
        ["1 <= text.length <= 10000", "0 <= brokenLetters.length <= 26", "text consists of lowercase letters and single spaces, with no leading or trailing spaces."]),
      hints: [
        "Put the broken letters into a set so membership is O(1).",
        "Split `text` on spaces and check each word independently.",
        "A word counts only if **none** of its letters is broken.",
      ],
      editorial: explain({
        idea: "Each word is independently typeable or not, so the answer is a count over an O(1) membership test per character.",
        steps: [
          "Load `brokenLetters` into a set (or a 26-slot boolean array).",
          "Split the text on single spaces.",
          "For each word, scan its characters; if none is broken, increment the count.",
          "Return the count.",
        ],
        why: "Typeability is a conjunction over the word's characters, and set membership answers each character in constant time, so the total work is linear in the text length.",
        time: "O(n)",
        space: "O(1) — the set holds at most 26 letters",
        pitfalls: [
          "An empty `brokenLetters` means every word counts.",
          "Breaking out of the inner loop but forgetting to skip the increment double-counts broken words.",
          "Searching `brokenLetters` with a linear scan per character is still fine at 26 letters, but a set keeps it obviously linear.",
        ],
      }),
      examples: [
        { input: '"hello world"\n"ad"', expectedOutput: "1" },
        { input: '"leet code"\n"lt"', expectedOutput: "1" },
        { input: '"leet code"\n"e"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 6);
        const text = Array.from({ length: n }, () => randLower(rng, 1, 6, "abcde")).join(" ");
        const pool = "abcde".split("");
        shuffle(rng, pool);
        const brokenLetters = pool.slice(0, ri(rng, 0, 3)).join("");
        return { input: `${JSON.stringify(text)}\n${JSON.stringify(brokenLetters)}`, expectedOutput: String(ref(text, brokenLetters)) };
      },
      solutions: {
        python: `def canBeTypedWords(text: str, brokenLetters: str) -> int:\n    broken = set(brokenLetters)\n    count = 0\n    for w in text.split(" "):\n        if not any(c in broken for c in w):\n            count += 1\n    return count`,
        javascript: `var canBeTypedWords = function(text, brokenLetters) {\n    const broken = {};\n    for (let i = 0; i < brokenLetters.length; i++) broken[brokenLetters.charAt(i)] = true;\n    const words = text.split(" ");\n    let count = 0;\n    for (let i = 0; i < words.length; i++) {\n        let ok = true;\n        for (let j = 0; j < words[i].length; j++) {\n            if (broken[words[i].charAt(j)] === true) { ok = false; break; }\n        }\n        if (ok) count++;\n    }\n    return count;\n};`,
        typescript: `function canBeTypedWords(text: string, brokenLetters: string): number {\n    var broken: { [key: string]: boolean } = {};\n    for (var i = 0; i < brokenLetters.length; i++) broken[brokenLetters.charAt(i)] = true;\n    var words = text.split(" ");\n    var count = 0;\n    for (var w = 0; w < words.length; w++) {\n        var ok = true;\n        for (var j = 0; j < words[w].length; j++) {\n            if (broken[words[w].charAt(j)] === true) { ok = false; break; }\n        }\n        if (ok) count++;\n    }\n    return count;\n}`,
        java: `public static int canBeTypedWords(String text, String brokenLetters) {\n    boolean[] broken = new boolean[26];\n    for (int i = 0; i < brokenLetters.length(); i++) broken[brokenLetters.charAt(i) - 'a'] = true;\n    int count = 0;\n    for (String w : text.split(" ")) {\n        boolean ok = true;\n        for (int i = 0; i < w.length(); i++) {\n            if (broken[w.charAt(i) - 'a']) { ok = false; break; }\n        }\n        if (ok) count++;\n    }\n    return count;\n}`,
        cpp: `int canBeTypedWords(string text, string brokenLetters) {\n    bool broken[26] = { false };\n    for (char c : brokenLetters) broken[c - 'a'] = true;\n    int count = 0;\n    bool ok = true;\n    for (size_t i = 0; i <= text.size(); i++) {\n        if (i == text.size() || text[i] == ' ') {\n            if (ok) count++;\n            ok = true;\n        } else if (broken[text[i] - 'a']) {\n            ok = false;\n        }\n    }\n    return count;\n}`,
        c: `int canBeTypedWords(const char* text, const char* brokenLetters) {\n    bool broken[26];\n    for (int i = 0; i < 26; i++) broken[i] = false;\n    for (int i = 0; brokenLetters[i] != '\\0'; i++) broken[brokenLetters[i] - 'a'] = true;\n    int n = (int) strlen(text);\n    int count = 0;\n    bool ok = true;\n    for (int i = 0; i <= n; i++) {\n        if (i == n || text[i] == ' ') {\n            if (ok) count++;\n            ok = true;\n        } else if (broken[text[i] - 'a']) {\n            ok = false;\n        }\n    }\n    return count;\n}`,
        csharp: `public static int CanBeTypedWords(string text, string brokenLetters)\n{\n    bool[] broken = new bool[26];\n    foreach (char c in brokenLetters) broken[c - 'a'] = true;\n    int count = 0;\n    foreach (string w in text.Split(' '))\n    {\n        bool ok = true;\n        foreach (char c in w)\n        {\n            if (broken[c - 'a']) { ok = false; break; }\n        }\n        if (ok) count++;\n    }\n    return count;\n}`,
        go: `func canBeTypedWords(text string, brokenLetters string) int {\n\tvar broken [26]bool\n\tfor i := 0; i < len(brokenLetters); i++ {\n\t\tbroken[brokenLetters[i]-'a'] = true\n\t}\n\tcount := 0\n\tfor _, w := range strings.Split(text, " ") {\n\t\tok := true\n\t\tfor i := 0; i < len(w); i++ {\n\t\t\tif broken[w[i]-'a'] {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tif ok {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun canBeTypedWords(text: String, brokenLetters: String): Int {\n    val broken = BooleanArray(26)\n    for (c in brokenLetters) broken[c - 'a'] = true\n    var count = 0\n    for (w in text.split(" ")) {\n        var ok = true\n        for (c in w) {\n            if (broken[c - 'a']) {\n                ok = false\n                break\n            }\n        }\n        if (ok) count++\n    }\n    return count\n}`,
        swift: `func canBeTypedWords(_ text: String, _ brokenLetters: String) -> Int {\n    var broken = [Bool](repeating: false, count: 26)\n    for u in brokenLetters.unicodeScalars { broken[Int(u.value) - 97] = true }\n    var count = 0\n    for w in text.split(separator: " ", omittingEmptySubsequences: false) {\n        var ok = true\n        for u in w.unicodeScalars {\n            if broken[Int(u.value) - 97] {\n                ok = false\n                break\n            }\n        }\n        if ok { count += 1 }\n    }\n    return count\n}`,
        rust: `fn canBeTypedWords(text: String, brokenLetters: String) -> i32 {\n    let mut broken = [false; 26];\n    for b in brokenLetters.bytes() {\n        broken[(b - b'a') as usize] = true;\n    }\n    let mut count = 0;\n    for w in text.split(' ') {\n        let mut ok = true;\n        for b in w.bytes() {\n            if broken[(b - b'a') as usize] {\n                ok = false;\n                break;\n            }\n        }\n        if ok {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function canBeTypedWords($text, $brokenLetters) {\n    $broken = array();\n    for ($i = 0; $i < strlen($brokenLetters); $i++) $broken[$brokenLetters[$i]] = true;\n    $count = 0;\n    foreach (explode(" ", $text) as $w) {\n        $ok = true;\n        for ($i = 0; $i < strlen($w); $i++) {\n            if (isset($broken[$w[$i]])) { $ok = false; break; }\n        }\n        if ($ok) $count++;\n    }\n    return $count;\n}`,
        ruby: `def canBeTypedWords(text, brokenLetters)\n  broken = {}\n  brokenLetters.each_char { |c| broken[c] = true }\n  count = 0\n  text.split(" ").each do |w|\n    ok = true\n    w.each_char do |c|\n      if broken[c]\n        ok = false\n        break\n      end\n    end\n    count += 1 if ok\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Redistribute Characters to Make All Strings Equal (LC 1897) ─
  (() => {
    const ref = (words: string[]) => {
      const count = new Array(26).fill(0);
      for (const w of words) for (const c of w) count[c.charCodeAt(0) - 97]++;
      for (const c of count) if (c % words.length !== 0) return false;
      return true;
    };
    return {
      slug: "redistribute-characters-to-make-all-strings-equal",
      title: "Redistribute Characters to Make All Strings Equal",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Counting", "LeetCode 1897", "Amazon", "Adobe"],
      signature: { funcName: "makeEqual", params: [{ name: "words", type: "string[]" as const }], returns: "bool" as const },
      description: describe(
        "You are given an array of strings `words`. In one operation you may take **any** character from **any** word and move it into **any** word (possibly the same one).\n\nReturn `true` if some sequence of such operations can make all the strings equal.",
        [
          { in: 'words = ["abc","aabc","bc"]', out: "true", note: "Moving one a and one b from the middle word makes all three \"abc\"." },
          { in: 'words = ["ab","a"]', out: "false", note: "There is one b for two words." },
          { in: 'words = ["aa","aa","aa"]', out: "true" },
        ],
        ["1 <= words.length <= 100", "1 <= words[i].length <= 100", "words[i] consists of lowercase English letters."]),
      hints: [
        "Characters can move anywhere, so only the **totals** matter — position and grouping are irrelevant.",
        "If all `n` words end up equal, each letter's total count must split evenly across them.",
        "So every letter's total must be divisible by `words.length`.",
      ],
      editorial: explain({
        idea: "Because a character may be moved to any word at no cost, the only invariant is the multiset of all characters. The words can be equalised exactly when that multiset splits into `n` identical parts.",
        steps: [
          "Count every letter across all words into a 26-slot table.",
          "If any count is not divisible by `words.length`, return `false`.",
          "Otherwise return `true`.",
        ],
        why: "Necessity: if all `n` words are the string `t`, letter `c` appears `n · count_t(c)` times overall, a multiple of `n`. Sufficiency: when every total is divisible by `n`, hand each word `total(c)/n` copies of each letter — a valid distribution reachable by moves.",
        time: "O(total characters)",
        space: "O(1)",
        pitfalls: [
          "Comparing word lengths first is unnecessary and can mislead — lengths are allowed to differ before the moves.",
          "Dividing by the number of *characters* rather than the number of *words* is the classic slip.",
        ],
      }),
      examples: [
        { input: '["abc","aabc","bc"]', expectedOutput: "true" },
        { input: '["ab","a"]', expectedOutput: "false" },
        { input: '["aa","aa","aa"]', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 5);
        let words: string[];
        if (rng() < 0.45) {
          const base = randLower(rng, 1, 4, "abc");
          const pool = (base.repeat(n)).split("");
          shuffle(rng, pool);
          words = [];
          const per = Math.floor(pool.length / n);
          for (let i = 0; i < n; i++) words.push(pool.slice(i * per, (i + 1) * per).join(""));
          if (pool.length % n !== 0) words[0] += pool.slice(per * n).join("");
        } else {
          words = Array.from({ length: n }, () => randLower(rng, 1, 5, "abc"));
        }
        return { input: fmtStrArr(words), expectedOutput: bool(ref(words)) };
      },
      solutions: {
        python: `from typing import List\n\ndef makeEqual(words: List[str]) -> bool:\n    count = [0] * 26\n    for w in words:\n        for c in w:\n            count[ord(c) - 97] += 1\n    n = len(words)\n    return all(c % n == 0 for c in count)`,
        javascript: `var makeEqual = function(words) {\n    const count = new Array(26).fill(0);\n    for (let i = 0; i < words.length; i++) {\n        for (let j = 0; j < words[i].length; j++) count[words[i].charCodeAt(j) - 97]++;\n    }\n    for (let i = 0; i < 26; i++) {\n        if (count[i] % words.length !== 0) return false;\n    }\n    return true;\n};`,
        typescript: `function makeEqual(words: string[]): boolean {\n    var count: number[] = [];\n    for (var k = 0; k < 26; k++) count.push(0);\n    for (var i = 0; i < words.length; i++) {\n        for (var j = 0; j < words[i].length; j++) count[words[i].charCodeAt(j) - 97]++;\n    }\n    for (var m = 0; m < 26; m++) {\n        if (count[m] % words.length !== 0) return false;\n    }\n    return true;\n}`,
        java: `public static boolean makeEqual(String[] words) {\n    int[] count = new int[26];\n    for (String w : words) {\n        for (int i = 0; i < w.length(); i++) count[w.charAt(i) - 'a']++;\n    }\n    for (int c : count) {\n        if (c % words.length != 0) return false;\n    }\n    return true;\n}`,
        cpp: `bool makeEqual(vector<string>& words) {\n    vector<int> count(26, 0);\n    for (auto& w : words) {\n        for (char c : w) count[c - 'a']++;\n    }\n    int n = (int) words.size();\n    for (int c : count) {\n        if (c % n != 0) return false;\n    }\n    return true;\n}`,
        c: `bool makeEqual(char** words, int wordsSize) {\n    int count[26];\n    for (int i = 0; i < 26; i++) count[i] = 0;\n    for (int i = 0; i < wordsSize; i++) {\n        for (int j = 0; words[i][j] != '\\0'; j++) count[words[i][j] - 'a']++;\n    }\n    for (int i = 0; i < 26; i++) {\n        if (count[i] % wordsSize != 0) return false;\n    }\n    return true;\n}`,
        csharp: `public static bool MakeEqual(string[] words)\n{\n    int[] count = new int[26];\n    foreach (string w in words)\n    {\n        foreach (char c in w) count[c - 'a']++;\n    }\n    foreach (int c in count)\n    {\n        if (c % words.Length != 0) return false;\n    }\n    return true;\n}`,
        go: `func makeEqual(words []string) bool {\n\tvar count [26]int\n\tfor _, w := range words {\n\t\tfor i := 0; i < len(w); i++ {\n\t\t\tcount[w[i]-'a']++\n\t\t}\n\t}\n\tfor _, c := range count {\n\t\tif c%len(words) != 0 {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun makeEqual(words: Array<String>): Boolean {\n    val count = IntArray(26)\n    for (w in words) {\n        for (c in w) count[c - 'a']++\n    }\n    for (c in count) {\n        if (c % words.size != 0) return false\n    }\n    return true\n}`,
        swift: `func makeEqual(_ words: [String]) -> Bool {\n    var count = [Int](repeating: 0, count: 26)\n    for w in words {\n        for u in w.unicodeScalars { count[Int(u.value) - 97] += 1 }\n    }\n    for c in count {\n        if c % words.count != 0 { return false }\n    }\n    return true\n}`,
        rust: `fn makeEqual(words: Vec<String>) -> bool {\n    let mut count = [0usize; 26];\n    for w in words.iter() {\n        for b in w.bytes() {\n            count[(b - b'a') as usize] += 1;\n        }\n    }\n    let n = words.len();\n    for &c in count.iter() {\n        if c % n != 0 {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function makeEqual($words) {\n    $count = array_fill(0, 26, 0);\n    foreach ($words as $w) {\n        for ($i = 0; $i < strlen($w); $i++) $count[ord($w[$i]) - 97]++;\n    }\n    $n = count($words);\n    foreach ($count as $c) {\n        if ($c % $n !== 0) return false;\n    }\n    return true;\n}`,
        ruby: `def makeEqual(words)\n  count = Array.new(26, 0)\n  words.each do |w|\n    w.each_char { |c| count[c.ord - 97] += 1 }\n  end\n  count.all? { |c| c % words.length == 0 }\nend`,
      },
    };
  })(),

  // ── Remove Palindromic Subsequences (LC 1332) ───────────────────
  (() => {
    const ref = (s: string) => {
      if (s.length === 0) return 0;
      let i = 0, j = s.length - 1;
      while (i < j) {
        if (s[i] !== s[j]) return 2;
        i++;
        j--;
      }
      return 1;
    };
    return {
      slug: "remove-palindromic-subsequences",
      title: "Remove Palindromic Subsequences",
      difficulty: "EASY" as const,
      tags: ["String", "Two Pointers", "LeetCode 1332", "Amazon", "Google"],
      signature: { funcName: "removePalindromeSub", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `s` made only of the letters `'a'` and `'b'`.\n\nIn one step you may delete any **palindromic subsequence** from `s` — the remaining characters close up. Return the minimum number of steps needed to make `s` empty.",
        [
          { in: 's = "ababa"', out: "1", note: "The whole string is already a palindrome." },
          { in: 's = "abb"', out: "2", note: 'Delete the subsequence "bb", then delete "a".' },
          { in: 's = "baabb"', out: "2" },
        ],
        ["1 <= s.length <= 1000", "s consists only of the letters 'a' and 'b'."]),
      hints: [
        "A **subsequence** need not be contiguous — so all the a's together form a palindrome, and so do all the b's.",
        "That caps the answer at 2 for any non-empty string over two letters.",
        "The only question left is whether one step suffices.",
      ],
      editorial: explain({
        idea: "With only two distinct letters the answer is always 0, 1 or 2: delete all a's then all b's. So the whole problem reduces to a palindrome check.",
        steps: [
          "If `s` is empty, return 0.",
          "Check whether `s` is a palindrome with two pointers.",
          "Return 1 if it is, otherwise 2.",
        ],
        why: "All occurrences of a single letter form a palindromic subsequence, so two steps always suffice. One step is possible exactly when `s` itself is a palindrome, and zero only when it is already empty.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Reading \"subsequence\" as \"substring\" makes the problem look much harder and gives wrong answers.",
          "Forgetting the empty-string case returns 1 instead of 0 — though the stated constraints exclude it.",
          "Trying dynamic programming here is a large detour for a two-line answer.",
        ],
      }),
      examples: [
        { input: '"ababa"', expectedOutput: "1" },
        { input: '"abb"', expectedOutput: "2" },
        { input: '"baabb"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        let s: string;
        if (rng() < 0.4) {
          const half = randLower(rng, 1, 5, "ab");
          const mid = rng() < 0.5 ? pick(rng, ["a", "b"]) : "";
          s = half + mid + half.split("").reverse().join("");
        } else {
          s = randLower(rng, 1, 12, "ab");
        }
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def removePalindromeSub(s: str) -> int:\n    if not s:\n        return 0\n    return 1 if s == s[::-1] else 2`,
        javascript: `var removePalindromeSub = function(s) {\n    if (s.length === 0) return 0;\n    let i = 0, j = s.length - 1;\n    while (i < j) {\n        if (s.charAt(i) !== s.charAt(j)) return 2;\n        i++;\n        j--;\n    }\n    return 1;\n};`,
        typescript: `function removePalindromeSub(s: string): number {\n    if (s.length === 0) return 0;\n    var i = 0, j = s.length - 1;\n    while (i < j) {\n        if (s.charAt(i) !== s.charAt(j)) return 2;\n        i++;\n        j--;\n    }\n    return 1;\n}`,
        java: `public static int removePalindromeSub(String s) {\n    if (s.length() == 0) return 0;\n    int i = 0, j = s.length() - 1;\n    while (i < j) {\n        if (s.charAt(i) != s.charAt(j)) return 2;\n        i++;\n        j--;\n    }\n    return 1;\n}`,
        cpp: `int removePalindromeSub(string s) {\n    if (s.empty()) return 0;\n    int i = 0, j = (int) s.size() - 1;\n    while (i < j) {\n        if (s[i] != s[j]) return 2;\n        i++;\n        j--;\n    }\n    return 1;\n}`,
        c: `int removePalindromeSub(const char* s) {\n    int n = (int) strlen(s);\n    if (n == 0) return 0;\n    int i = 0, j = n - 1;\n    while (i < j) {\n        if (s[i] != s[j]) return 2;\n        i++;\n        j--;\n    }\n    return 1;\n}`,
        csharp: `public static int RemovePalindromeSub(string s)\n{\n    if (s.Length == 0) return 0;\n    int i = 0, j = s.Length - 1;\n    while (i < j)\n    {\n        if (s[i] != s[j]) return 2;\n        i++;\n        j--;\n    }\n    return 1;\n}`,
        go: `func removePalindromeSub(s string) int {\n\tif len(s) == 0 {\n\t\treturn 0\n\t}\n\ti, j := 0, len(s)-1\n\tfor i < j {\n\t\tif s[i] != s[j] {\n\t\t\treturn 2\n\t\t}\n\t\ti++\n\t\tj--\n\t}\n\treturn 1\n}`,
        kotlin: `fun removePalindromeSub(s: String): Int {\n    if (s.isEmpty()) return 0\n    var i = 0\n    var j = s.length - 1\n    while (i < j) {\n        if (s[i] != s[j]) return 2\n        i++\n        j--\n    }\n    return 1\n}`,
        swift: `func removePalindromeSub(_ s: String) -> Int {\n    let a = Array(s)\n    if a.isEmpty { return 0 }\n    var i = 0\n    var j = a.count - 1\n    while i < j {\n        if a[i] != a[j] { return 2 }\n        i += 1\n        j -= 1\n    }\n    return 1\n}`,
        rust: `fn removePalindromeSub(s: String) -> i32 {\n    let a = s.as_bytes();\n    if a.is_empty() {\n        return 0;\n    }\n    let mut i = 0usize;\n    let mut j = a.len() - 1;\n    while i < j {\n        if a[i] != a[j] {\n            return 2;\n        }\n        i += 1;\n        j -= 1;\n    }\n    1\n}`,
        php: `function removePalindromeSub($s) {\n    $n = strlen($s);\n    if ($n === 0) return 0;\n    $i = 0;\n    $j = $n - 1;\n    while ($i < $j) {\n        if ($s[$i] !== $s[$j]) return 2;\n        $i++;\n        $j--;\n    }\n    return 1;\n}`,
        ruby: `def removePalindromeSub(s)\n  return 0 if s.empty?\n  s == s.reverse ? 1 : 2\nend`,
      },
    };
  })(),

  // ── Longest Nice Substring (LC 1763) ────────────────────────────
  (() => {
    const ref = (s: string): string => {
      if (s.length < 2) return "";
      const set: Record<string, boolean> = {};
      for (const c of s) set[c] = true;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        const other = c >= "a" && c <= "z" ? c.toUpperCase() : c.toLowerCase();
        if (!set[other]) {
          const left = ref(s.slice(0, i));
          const right = ref(s.slice(i + 1));
          return right.length > left.length ? right : left;
        }
      }
      return s;
    };
    return {
      slug: "longest-nice-substring",
      title: "Longest Nice Substring",
      difficulty: "EASY" as const,
      tags: ["String", "Divide and Conquer", "LeetCode 1763", "Amazon", "Microsoft"],
      signature: { funcName: "longestNiceSubstring", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A string is **nice** if, for every letter it contains, it contains **both** the uppercase and the lowercase form. `\"abABB\"` is nice; `\"abA\"` is not, because `b` appears without `B`.\n\nReturn the longest nice **substring** of `s`. If there are several of the same maximum length, return the one that starts **earliest**. If none exists, return the empty string.",
        [
          { in: 's = "YazaAay"', out: "aAa", note: '"aAa" is nice; the surrounding letters break the pairing.' },
          { in: 's = "Bb"', out: "Bb" },
          { in: 's = "c"', out: "", note: "A single letter can never be nice." },
        ],
        ["1 <= s.length <= 100", "s consists of uppercase and lowercase English letters."]),
      hints: [
        "If some character's counterpart is missing from the whole string, no nice substring can cross that character.",
        "That splits the problem: recurse on the part left of it and the part right of it.",
        "Prefer the left answer on a tie so the earliest start wins.",
      ],
      editorial: explain({
        idea: "Divide and conquer on the first *offending* character — one whose opposite case is absent from the current segment. No nice substring can contain it, so the answer lies entirely to its left or entirely to its right.",
        steps: [
          "If the segment is shorter than 2, return the empty string.",
          "Collect the set of characters present.",
          "Scan for the first character whose opposite case is missing from that set.",
          "If found at index `i`, recurse on `s[0..i-1]` and `s[i+1..]` and return the longer result, preferring the left one on a tie.",
          "If no offender exists, the whole segment is nice — return it.",
        ],
        why: "A nice substring containing an offending character would need that character's counterpart, which is absent from the entire segment and therefore from any substring of it. So the offender is a hard split point.",
        time: "O(n²) in the worst case",
        space: "O(n) for the recursion",
        pitfalls: [
          "Returning the right answer on a tie violates the earliest-start rule — `>` rather than `>=` is what keeps the left one.",
          "Checking niceness for all O(n²) substrings independently is O(n³) and times out on longer inputs.",
          "The present-character set must be rebuilt for each segment, not reused from the parent.",
        ],
      }),
      examples: [
        { input: '"YazaAay"', expectedOutput: "aAa" },
        { input: '"Bb"', expectedOutput: "Bb" },
        { input: '"c"', expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "aAbBcCyYzZ";
        const n = ri(rng, 1, 16);
        const s = Array.from({ length: n }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");
        return { input: JSON.stringify(s), expectedOutput: ref(s) };
      },
      solutions: {
        python: `def longestNiceSubstring(s: str) -> str:\n    if len(s) < 2:\n        return ""\n    chars = set(s)\n    for i, c in enumerate(s):\n        if c.swapcase() in chars:\n            continue\n        left = longestNiceSubstring(s[:i])\n        right = longestNiceSubstring(s[i + 1:])\n        return right if len(right) > len(left) else left\n    return s`,
        javascript: `var longestNiceSubstring = function(s) {\n    if (s.length < 2) return "";\n    const set = {};\n    for (let i = 0; i < s.length; i++) set[s.charAt(i)] = true;\n    for (let i = 0; i < s.length; i++) {\n        const c = s.charAt(i);\n        const other = c >= "a" && c <= "z" ? c.toUpperCase() : c.toLowerCase();\n        if (set[other] === true) continue;\n        const left = longestNiceSubstring(s.slice(0, i));\n        const right = longestNiceSubstring(s.slice(i + 1));\n        return right.length > left.length ? right : left;\n    }\n    return s;\n};`,
        typescript: `function longestNiceSubstring(s: string): string {\n    if (s.length < 2) return "";\n    var set: { [key: string]: boolean } = {};\n    for (var i = 0; i < s.length; i++) set[s.charAt(i)] = true;\n    for (var j = 0; j < s.length; j++) {\n        var c = s.charAt(j);\n        var other = c >= "a" && c <= "z" ? c.toUpperCase() : c.toLowerCase();\n        if (set[other] === true) continue;\n        var left = longestNiceSubstring(s.slice(0, j));\n        var right = longestNiceSubstring(s.slice(j + 1));\n        return right.length > left.length ? right : left;\n    }\n    return s;\n}`,
        java: `public static String longestNiceSubstring(String s) {\n    if (s.length() < 2) return "";\n    HashSet<Character> set = new HashSet<>();\n    for (int i = 0; i < s.length(); i++) set.add(s.charAt(i));\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        char other = Character.isLowerCase(c) ? Character.toUpperCase(c) : Character.toLowerCase(c);\n        if (set.contains(other)) continue;\n        String left = longestNiceSubstring(s.substring(0, i));\n        String right = longestNiceSubstring(s.substring(i + 1));\n        return right.length() > left.length() ? right : left;\n    }\n    return s;\n}`,
        cpp: `string longestNiceSubstring(string s) {\n    if (s.size() < 2) return "";\n    unordered_set<char> set;\n    for (char c : s) set.insert(c);\n    for (int i = 0; i < (int) s.size(); i++) {\n        char c = s[i];\n        char other = (c >= 'a' && c <= 'z') ? (char) (c - 32) : (char) (c + 32);\n        if (set.count(other)) continue;\n        string left = longestNiceSubstring(s.substr(0, i));\n        string right = longestNiceSubstring(s.substr(i + 1));\n        return right.size() > left.size() ? right : left;\n    }\n    return s;\n}`,
        c: `static char* nice_helper(const char* s, int len) {\n    if (len < 2) {\n        char* empty = (char*) malloc(1);\n        empty[0] = '\\0';\n        return empty;\n    }\n    bool present[128];\n    for (int i = 0; i < 128; i++) present[i] = false;\n    for (int i = 0; i < len; i++) present[(unsigned char) s[i]] = true;\n    for (int i = 0; i < len; i++) {\n        char c = s[i];\n        char other = (c >= 'a' && c <= 'z') ? (char) (c - 32) : (char) (c + 32);\n        if (present[(unsigned char) other]) continue;\n        char* left = nice_helper(s, i);\n        char* right = nice_helper(s + i + 1, len - i - 1);\n        if (strlen(right) > strlen(left)) {\n            free(left);\n            return right;\n        }\n        free(right);\n        return left;\n    }\n    char* out = (char*) malloc(len + 1);\n    memcpy(out, s, len);\n    out[len] = '\\0';\n    return out;\n}\n\nchar* longestNiceSubstring(const char* s) {\n    return nice_helper(s, (int) strlen(s));\n}`,
        csharp: `public static string LongestNiceSubstring(string s)\n{\n    if (s.Length < 2) return "";\n    var set = new HashSet<char>();\n    foreach (char c in s) set.Add(c);\n    for (int i = 0; i < s.Length; i++)\n    {\n        char c = s[i];\n        char other = char.IsLower(c) ? char.ToUpper(c) : char.ToLower(c);\n        if (set.Contains(other)) continue;\n        string left = LongestNiceSubstring(s.Substring(0, i));\n        string right = LongestNiceSubstring(s.Substring(i + 1));\n        return right.Length > left.Length ? right : left;\n    }\n    return s;\n}`,
        go: `func longestNiceSubstring(s string) string {\n\tif len(s) < 2 {\n\t\treturn ""\n\t}\n\tset := map[byte]bool{}\n\tfor i := 0; i < len(s); i++ {\n\t\tset[s[i]] = true\n\t}\n\tfor i := 0; i < len(s); i++ {\n\t\tc := s[i]\n\t\tvar other byte\n\t\tif c >= 'a' && c <= 'z' {\n\t\t\tother = c - 32\n\t\t} else {\n\t\t\tother = c + 32\n\t\t}\n\t\tif set[other] {\n\t\t\tcontinue\n\t\t}\n\t\tleft := longestNiceSubstring(s[:i])\n\t\tright := longestNiceSubstring(s[i+1:])\n\t\tif len(right) > len(left) {\n\t\t\treturn right\n\t\t}\n\t\treturn left\n\t}\n\treturn s\n}`,
        kotlin: `fun longestNiceSubstring(s: String): String {\n    if (s.length < 2) return ""\n    val set = HashSet<Char>()\n    for (c in s) set.add(c)\n    for (i in s.indices) {\n        val c = s[i]\n        val other = if (c.isLowerCase()) c.toUpperCase() else c.toLowerCase()\n        if (set.contains(other)) continue\n        val left = longestNiceSubstring(s.substring(0, i))\n        val right = longestNiceSubstring(s.substring(i + 1))\n        return if (right.length > left.length) right else left\n    }\n    return s\n}`,
        swift: `func longestNiceSubstring(_ s: String) -> String {\n    let a = Array(s)\n    if a.count < 2 { return "" }\n    var set = Set<Character>()\n    for c in a { set.insert(c) }\n    for i in 0..<a.count {\n        let c = a[i]\n        let other: Character = (c >= "a" && c <= "z")\n            ? Character(String(c).uppercased())\n            : Character(String(c).lowercased())\n        if set.contains(other) { continue }\n        let left = longestNiceSubstring(String(a[0..<i]))\n        let right = longestNiceSubstring(String(a[(i + 1)...]))\n        return right.count > left.count ? right : left\n    }\n    return s\n}`,
        rust: `fn longestNiceSubstring(s: String) -> String {\n    use std::collections::HashSet;\n    let a = s.as_bytes();\n    if a.len() < 2 {\n        return String::new();\n    }\n    let set: HashSet<u8> = a.iter().cloned().collect();\n    for i in 0..a.len() {\n        let c = a[i];\n        let other = if c >= b'a' && c <= b'z' { c - 32 } else { c + 32 };\n        if set.contains(&other) {\n            continue;\n        }\n        let left = longestNiceSubstring(s[..i].to_string());\n        let right = longestNiceSubstring(s[i + 1..].to_string());\n        return if right.len() > left.len() { right } else { left };\n    }\n    s\n}`,
        php: `function longestNiceSubstring($s) {\n    if (strlen($s) < 2) return "";\n    $set = array();\n    for ($i = 0; $i < strlen($s); $i++) $set[$s[$i]] = true;\n    for ($i = 0; $i < strlen($s); $i++) {\n        $c = $s[$i];\n        $other = ($c >= 'a' && $c <= 'z') ? strtoupper($c) : strtolower($c);\n        if (isset($set[$other])) continue;\n        $left = longestNiceSubstring(substr($s, 0, $i));\n        $right = longestNiceSubstring(substr($s, $i + 1));\n        return strlen($right) > strlen($left) ? $right : $left;\n    }\n    return $s;\n}`,
        ruby: `def longestNiceSubstring(s)\n  return "" if s.length < 2\n  set = {}\n  s.each_char { |c| set[c] = true }\n  s.each_char.with_index do |c, i|\n    other = (c >= 'a' && c <= 'z') ? c.upcase : c.downcase\n    next if set[other]\n    left = longestNiceSubstring(s[0...i])\n    right = longestNiceSubstring(s[(i + 1)..-1])\n    return right.length > left.length ? right : left\n  end\n  s\nend`,
      },
    };
  })(),

  // ── Score of a String (LC 3110) ─────────────────────────────────
  (() => {
    const ref = (s: string) => {
      let total = 0;
      for (let i = 1; i < s.length; i++) total += Math.abs(s.charCodeAt(i) - s.charCodeAt(i - 1));
      return total;
    };
    return {
      slug: "score-of-a-string",
      title: "Score of a String",
      difficulty: "EASY" as const,
      tags: ["String", "LeetCode 3110", "Amazon", "TCS"],
      signature: { funcName: "scoreOfString", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "The **score** of a string is the sum of the absolute differences between the ASCII values of every pair of adjacent characters.\n\nGiven a string `s`, return its score.",
        [
          { in: 's = "hello"', out: "13", note: "|h-e| + |e-l| + |l-l| + |l-o| = 3 + 7 + 0 + 3 = 13." },
          { in: 's = "zaz"', out: "50", note: "|z-a| + |a-z| = 25 + 25 = 50." },
          { in: 's = "a"', out: "0", note: "No adjacent pairs exist." },
        ],
        ["1 <= s.length <= 100", "s consists of lowercase English letters."]),
      hints: [
        "Walk the string comparing each character with its predecessor.",
        "Use the character codes, not the characters themselves.",
        "A single-character string has no pairs and therefore scores 0.",
      ],
      editorial: explain({
        idea: "The score is a straight sum over adjacent pairs, so one pass with a running total does the job.",
        steps: [
          "Start the total at 0.",
          "For `i` from 1 to `n-1`, add `|code(s[i]) - code(s[i-1])|`.",
          "Return the total.",
        ],
        why: "There are exactly `n - 1` adjacent pairs and each contributes independently, so the loop covers the definition exactly.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Starting the loop at 0 reads index `-1`.",
          "Forgetting the absolute value lets differences cancel out.",
        ],
      }),
      examples: [
        { input: '"hello"', expectedOutput: "13" },
        { input: '"zaz"', expectedOutput: "50" },
        { input: '"a"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 40);
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def scoreOfString(s: str) -> int:\n    return sum(abs(ord(s[i]) - ord(s[i - 1])) for i in range(1, len(s)))`,
        javascript: `var scoreOfString = function(s) {\n    let total = 0;\n    for (let i = 1; i < s.length; i++) {\n        total += Math.abs(s.charCodeAt(i) - s.charCodeAt(i - 1));\n    }\n    return total;\n};`,
        typescript: `function scoreOfString(s: string): number {\n    var total = 0;\n    for (var i = 1; i < s.length; i++) {\n        total += Math.abs(s.charCodeAt(i) - s.charCodeAt(i - 1));\n    }\n    return total;\n}`,
        java: `public static int scoreOfString(String s) {\n    int total = 0;\n    for (int i = 1; i < s.length(); i++) {\n        total += Math.abs(s.charAt(i) - s.charAt(i - 1));\n    }\n    return total;\n}`,
        cpp: `int scoreOfString(string s) {\n    int total = 0;\n    for (int i = 1; i < (int) s.size(); i++) {\n        total += abs(s[i] - s[i - 1]);\n    }\n    return total;\n}`,
        c: `int scoreOfString(const char* s) {\n    int n = (int) strlen(s);\n    int total = 0;\n    for (int i = 1; i < n; i++) {\n        int d = s[i] - s[i - 1];\n        total += d < 0 ? -d : d;\n    }\n    return total;\n}`,
        csharp: `public static int ScoreOfString(string s)\n{\n    int total = 0;\n    for (int i = 1; i < s.Length; i++)\n    {\n        total += Math.Abs(s[i] - s[i - 1]);\n    }\n    return total;\n}`,
        go: `func scoreOfString(s string) int {\n\ttotal := 0\n\tfor i := 1; i < len(s); i++ {\n\t\td := int(s[i]) - int(s[i-1])\n\t\tif d < 0 {\n\t\t\td = -d\n\t\t}\n\t\ttotal += d\n\t}\n\treturn total\n}`,
        kotlin: `fun scoreOfString(s: String): Int {\n    var total = 0\n    for (i in 1 until s.length) {\n        total += Math.abs(s[i].toInt() - s[i - 1].toInt())\n    }\n    return total\n}`,
        swift: `func scoreOfString(_ s: String) -> Int {\n    let a = Array(s.unicodeScalars).map { Int($0.value) }\n    var total = 0\n    for i in 1..<max(a.count, 1) {\n        total += abs(a[i] - a[i - 1])\n    }\n    return total\n}`,
        rust: `fn scoreOfString(s: String) -> i32 {\n    let a = s.as_bytes();\n    let mut total = 0;\n    for i in 1..a.len() {\n        total += (a[i] as i32 - a[i - 1] as i32).abs();\n    }\n    total\n}`,
        php: `function scoreOfString($s) {\n    $total = 0;\n    for ($i = 1; $i < strlen($s); $i++) {\n        $total += abs(ord($s[$i]) - ord($s[$i - 1]));\n    }\n    return $total;\n}`,
        ruby: `def scoreOfString(s)\n  total = 0\n  (1...s.length).each do |i|\n    total += (s[i].ord - s[i - 1].ord).abs\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Count Common Words With One Occurrence (LC 2085) ────────────
  (() => {
    const tally = (words: string[]) => {
      const m: Record<string, number> = {};
      for (const w of words) m[w] = (m[w] || 0) + 1;
      return m;
    };
    const ref = (w1: string[], w2: string[]) => {
      const a = tally(w1), b = tally(w2);
      let count = 0;
      for (const k of Object.keys(a)) if (a[k] === 1 && b[k] === 1) count++;
      return count;
    };
    return {
      slug: "count-common-words-with-one-occurrence",
      title: "Count Common Words With One Occurrence",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Hash Table", "LeetCode 2085", "Amazon", "Infosys"],
      signature: {
        funcName: "countWords",
        params: [{ name: "words1", type: "string[]" as const }, { name: "words2", type: "string[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given two string arrays `words1` and `words2`, return the number of strings that appear **exactly once in each** of the two arrays.",
        [
          { in: 'words1 = ["leetcode","is","amazing","as","is"], words2 = ["amazing","leetcode","is"]', out: "2", note: '"leetcode" and "amazing" each appear once in both; "is" appears twice in words1.' },
          { in: 'words1 = ["b","bb","bbb"], words2 = ["a","aa","aaa"]', out: "0" },
          { in: 'words1 = ["a","ab"], words2 = ["a","a","a","ab"]', out: "1" },
        ],
        ["1 <= words1.length, words2.length <= 1000", "1 <= words1[i].length, words2[j].length <= 30", "All strings consist of lowercase English letters."]),
      hints: [
        "Count occurrences in each array separately.",
        "A word qualifies only if its count is exactly 1 in **both** tallies.",
        "Iterate over one tally and look the word up in the other.",
      ],
      editorial: explain({
        idea: "Two frequency maps reduce the question to a per-word test: count 1 on the left and count 1 on the right.",
        steps: [
          "Build a frequency map for `words1` and another for `words2`.",
          "Walk the keys of the first map.",
          "Count a key when its value is 1 and the second map maps it to 1 as well.",
        ],
        why: "Both conditions are independent per word, so the count is a simple sum over the distinct words of one array — and any qualifying word necessarily appears in that array.",
        time: "O(total characters)",
        space: "O(n + m)",
        pitfalls: [
          "Using sets loses the multiplicity, so words appearing twice would wrongly qualify.",
          "Counting over the union of both key sets double-counts if you are not careful; iterating one map is enough.",
        ],
      }),
      examples: [
        { input: '["leetcode","is","amazing","as","is"]\n["amazing","leetcode","is"]', expectedOutput: "2" },
        { input: '["b","bb","bbb"]\n["a","aa","aaa"]', expectedOutput: "0" },
        { input: '["a","ab"]\n["a","a","a","ab"]', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const pool = ["a", "ab", "abc", "b", "bc", "c"];
        const mk = () => Array.from({ length: ri(rng, 1, 8) }, () => pick(rng, pool));
        const w1 = mk(), w2 = mk();
        return { input: `${fmtStrArr(w1)}\n${fmtStrArr(w2)}`, expectedOutput: String(ref(w1, w2)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countWords(words1: List[str], words2: List[str]) -> int:\n    a = {}\n    b = {}\n    for w in words1:\n        a[w] = a.get(w, 0) + 1\n    for w in words2:\n        b[w] = b.get(w, 0) + 1\n    return sum(1 for w, c in a.items() if c == 1 and b.get(w, 0) == 1)`,
        javascript: `var countWords = function(words1, words2) {\n    function tally(arr) {\n        const m = {};\n        for (let i = 0; i < arr.length; i++) m[arr[i]] = (m[arr[i]] || 0) + 1;\n        return m;\n    }\n    const a = tally(words1);\n    const b = tally(words2);\n    let count = 0;\n    const keys = Object.keys(a);\n    for (let i = 0; i < keys.length; i++) {\n        if (a[keys[i]] === 1 && b[keys[i]] === 1) count++;\n    }\n    return count;\n};`,
        typescript: `function countWords(words1: string[], words2: string[]): number {\n    function tally(arr: string[]): { [key: string]: number } {\n        var m: { [key: string]: number } = {};\n        for (var i = 0; i < arr.length; i++) m[arr[i]] = (m[arr[i]] || 0) + 1;\n        return m;\n    }\n    var a = tally(words1);\n    var b = tally(words2);\n    var count = 0;\n    var keys = Object.keys(a);\n    for (var j = 0; j < keys.length; j++) {\n        if (a[keys[j]] === 1 && b[keys[j]] === 1) count++;\n    }\n    return count;\n}`,
        java: `public static int countWords(String[] words1, String[] words2) {\n    HashMap<String, Integer> a = new HashMap<>();\n    HashMap<String, Integer> b = new HashMap<>();\n    for (String w : words1) a.put(w, a.getOrDefault(w, 0) + 1);\n    for (String w : words2) b.put(w, b.getOrDefault(w, 0) + 1);\n    int count = 0;\n    for (Map.Entry<String, Integer> e : a.entrySet()) {\n        if (e.getValue() == 1 && b.getOrDefault(e.getKey(), 0) == 1) count++;\n    }\n    return count;\n}`,
        cpp: `int countWords(vector<string>& words1, vector<string>& words2) {\n    unordered_map<string, int> a, b;\n    for (auto& w : words1) a[w]++;\n    for (auto& w : words2) b[w]++;\n    int count = 0;\n    for (auto& e : a) {\n        if (e.second == 1 && b.count(e.first) && b[e.first] == 1) count++;\n    }\n    return count;\n}`,
        c: `int countWords(char** words1, int words1Size, char** words2, int words2Size) {\n    int count = 0;\n    for (int i = 0; i < words1Size; i++) {\n        int c1 = 0;\n        for (int j = 0; j < words1Size; j++) {\n            if (strcmp(words1[i], words1[j]) == 0) c1++;\n        }\n        if (c1 != 1) continue;\n        int c2 = 0;\n        for (int j = 0; j < words2Size; j++) {\n            if (strcmp(words1[i], words2[j]) == 0) c2++;\n        }\n        if (c2 == 1) count++;\n    }\n    return count;\n}`,
        csharp: `public static int CountWords(string[] words1, string[] words2)\n{\n    var a = new Dictionary<string, int>();\n    var b = new Dictionary<string, int>();\n    foreach (string w in words1) { if (a.ContainsKey(w)) a[w]++; else a[w] = 1; }\n    foreach (string w in words2) { if (b.ContainsKey(w)) b[w]++; else b[w] = 1; }\n    int count = 0;\n    foreach (var e in a)\n    {\n        if (e.Value == 1 && b.ContainsKey(e.Key) && b[e.Key] == 1) count++;\n    }\n    return count;\n}`,
        go: `func countWords(words1 []string, words2 []string) int {\n\ta := map[string]int{}\n\tb := map[string]int{}\n\tfor _, w := range words1 {\n\t\ta[w]++\n\t}\n\tfor _, w := range words2 {\n\t\tb[w]++\n\t}\n\tcount := 0\n\tfor w, c := range a {\n\t\tif c == 1 && b[w] == 1 {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count\n}`,
        kotlin: `fun countWords(words1: Array<String>, words2: Array<String>): Int {\n    val a = HashMap<String, Int>()\n    val b = HashMap<String, Int>()\n    for (w in words1) a[w] = (a[w] ?: 0) + 1\n    for (w in words2) b[w] = (b[w] ?: 0) + 1\n    var count = 0\n    for (e in a.entries) {\n        if (e.value == 1 && (b[e.key] ?: 0) == 1) count++\n    }\n    return count\n}`,
        swift: `func countWords(_ words1: [String], _ words2: [String]) -> Int {\n    var a: [String: Int] = [:]\n    var b: [String: Int] = [:]\n    for w in words1 { a[w] = (a[w] ?? 0) + 1 }\n    for w in words2 { b[w] = (b[w] ?? 0) + 1 }\n    var count = 0\n    for (w, c) in a {\n        if c == 1 && (b[w] ?? 0) == 1 { count += 1 }\n    }\n    return count\n}`,
        rust: `fn countWords(words1: Vec<String>, words2: Vec<String>) -> i32 {\n    use std::collections::HashMap;\n    let mut a: HashMap<String, i32> = HashMap::new();\n    let mut b: HashMap<String, i32> = HashMap::new();\n    for w in words1.iter() {\n        *a.entry(w.clone()).or_insert(0) += 1;\n    }\n    for w in words2.iter() {\n        *b.entry(w.clone()).or_insert(0) += 1;\n    }\n    let mut count = 0;\n    for (w, &c) in a.iter() {\n        if c == 1 && *b.get(w).unwrap_or(&0) == 1 {\n            count += 1;\n        }\n    }\n    count\n}`,
        php: `function countWords($words1, $words2) {\n    $a = array();\n    $b = array();\n    foreach ($words1 as $w) { $a[$w] = isset($a[$w]) ? $a[$w] + 1 : 1; }\n    foreach ($words2 as $w) { $b[$w] = isset($b[$w]) ? $b[$w] + 1 : 1; }\n    $count = 0;\n    foreach ($a as $w => $c) {\n        if ($c === 1 && isset($b[$w]) && $b[$w] === 1) $count++;\n    }\n    return $count;\n}`,
        ruby: `def countWords(words1, words2)\n  a = Hash.new(0)\n  b = Hash.new(0)\n  words1.each { |w| a[w] += 1 }\n  words2.each { |w| b[w] += 1 }\n  a.count { |w, c| c == 1 && b[w] == 1 }\nend`,
      },
    };
  })(),

  // ── Check if All A's Appears Before All B's (LC 2124) ───────────
  (() => {
    const ref = (s: string) => {
      let seenB = false;
      for (const c of s) {
        if (c === "b") seenB = true;
        else if (seenB) return false;
      }
      return true;
    };
    return {
      slug: "check-if-all-as-appears-before-all-bs",
      title: "Check if All A's Appears Before All B's",
      difficulty: "EASY" as const,
      tags: ["String", "LeetCode 2124", "Amazon", "TCS"],
      signature: { funcName: "checkString", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given a string `s` consisting only of the letters `'a'` and `'b'`, return `true` if **every** `'a'` appears before **every** `'b'`.",
        [
          { in: 's = "aaabbb"', out: "true" },
          { in: 's = "abab"', out: "false", note: "The second a comes after the first b." },
          { in: 's = "bbb"', out: "true", note: "There are no a's, so the condition holds vacuously." },
        ],
        ["1 <= s.length <= 100", "s consists only of the letters 'a' and 'b'."]),
      hints: [
        "Once you have seen a `'b'`, no `'a'` may follow.",
        "One boolean flag is enough state.",
        "Equivalently: the string must not contain `\"ba\"` as a substring.",
      ],
      editorial: explain({
        idea: "The condition fails exactly when an `'a'` appears after some `'b'` — that is, when `\"ba\"` occurs. A single flag detects it in one pass.",
        steps: [
          "Start with `seenB = false`.",
          "Scan the string: on a `'b'`, set `seenB = true`.",
          "On an `'a'`, return `false` if `seenB` is already set.",
          "Return `true` if the scan finishes.",
        ],
        why: "\"Every a before every b\" is violated precisely when some a follows some b, and by transitivity the earliest such violation involves adjacent-in-order characters — which the flag catches.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Counting a's and b's is not enough — the order matters, not the totals.",
          "Strings of only a's or only b's must both return `true`.",
        ],
      }),
      examples: [
        { input: '"aaabbb"', expectedOutput: "true" },
        { input: '"abab"', expectedOutput: "false" },
        { input: '"bbb"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        let s: string;
        if (rng() < 0.4) {
          s = "a".repeat(ri(rng, 0, 6)) + "b".repeat(ri(rng, 0, 6));
          if (s.length === 0) s = "a";
        } else {
          s = randLower(rng, 1, 14, "ab");
        }
        return { input: JSON.stringify(s), expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: `def checkString(s: str) -> bool:\n    return "ba" not in s`,
        javascript: `var checkString = function(s) {\n    let seenB = false;\n    for (let i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "b") seenB = true;\n        else if (seenB) return false;\n    }\n    return true;\n};`,
        typescript: `function checkString(s: string): boolean {\n    var seenB = false;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "b") seenB = true;\n        else if (seenB) return false;\n    }\n    return true;\n}`,
        java: `public static boolean checkString(String s) {\n    boolean seenB = false;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == 'b') seenB = true;\n        else if (seenB) return false;\n    }\n    return true;\n}`,
        cpp: `bool checkString(string s) {\n    bool seenB = false;\n    for (char c : s) {\n        if (c == 'b') seenB = true;\n        else if (seenB) return false;\n    }\n    return true;\n}`,
        c: `bool checkString(const char* s) {\n    bool seenB = false;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        if (s[i] == 'b') seenB = true;\n        else if (seenB) return false;\n    }\n    return true;\n}`,
        csharp: `public static bool CheckString(string s)\n{\n    bool seenB = false;\n    foreach (char c in s)\n    {\n        if (c == 'b') seenB = true;\n        else if (seenB) return false;\n    }\n    return true;\n}`,
        go: `func checkString(s string) bool {\n\tseenB := false\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] == 'b' {\n\t\t\tseenB = true\n\t\t} else if seenB {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun checkString(s: String): Boolean {\n    var seenB = false\n    for (c in s) {\n        if (c == 'b') seenB = true\n        else if (seenB) return false\n    }\n    return true\n}`,
        swift: `func checkString(_ s: String) -> Bool {\n    var seenB = false\n    for c in s {\n        if c == "b" {\n            seenB = true\n        } else if seenB {\n            return false\n        }\n    }\n    return true\n}`,
        rust: `fn checkString(s: String) -> bool {\n    let mut seen_b = false;\n    for b in s.bytes() {\n        if b == b'b' {\n            seen_b = true;\n        } else if seen_b {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function checkString($s) {\n    $seenB = false;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] === 'b') $seenB = true;\n        else if ($seenB) return false;\n    }\n    return true;\n}`,
        ruby: `def checkString(s)\n  !s.include?("ba")\nend`,
      },
    };
  })(),

  // ── Capitalize the Title (LC 2129) ──────────────────────────────
  (() => {
    const ref = (title: string) =>
      title.split(" ").map((w) => {
        const lower = w.toLowerCase();
        if (lower.length <= 2) return lower;
        return lower.charAt(0).toUpperCase() + lower.slice(1);
      }).join(" ");
    return {
      slug: "capitalize-the-title",
      title: "Capitalize the Title",
      difficulty: "EASY" as const,
      tags: ["String", "LeetCode 2129", "Amazon", "Adobe"],
      signature: { funcName: "capitalizeTitle", params: [{ name: "title", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `title` of words separated by single spaces. Capitalise it as follows:\n\n- Words of length 1 or 2 become entirely lowercase.\n- Longer words become lowercase except for their first letter, which is uppercased.\n\nReturn the capitalised title.",
        [
          { in: 'title = "capiTalIze tHe titLe"', out: "Capitalize The Title" },
          { in: 'title = "First leTTeR of EACH Word"', out: "First Letter of Each Word", note: '"of" has length 2, so it stays lowercase.' },
          { in: 'title = "i lOve leetcode"', out: "i Love Leetcode" },
        ],
        ["1 <= title.length <= 100", "title consists of English letters and single spaces, with no leading or trailing spaces."]),
      hints: [
        "Handle each word independently, then re-join with single spaces.",
        "Lowercase the whole word first — that fixes any stray capitals in the middle.",
        "Only then decide whether to uppercase the first letter, based on the word's length.",
      ],
      editorial: explain({
        idea: "Normalise first, then decide: lowercasing the whole word removes the interior capitals, after which the length rule alone determines the first letter.",
        steps: [
          "Split on single spaces.",
          "Lowercase each word.",
          "If the word is longer than 2 characters, uppercase its first letter.",
          "Join with single spaces.",
        ],
        why: "Lowercasing first means the rule for the first letter is independent of the input's original casing, which is what makes both example transformations agree.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Uppercasing the first letter without lowercasing the rest leaves `\"tHe\"` as `\"THe\"`.",
          "The threshold is `> 2`, so a two-letter word like `\"of\"` stays lowercase while a three-letter one like `\"the\"` is capitalised.",
        ],
      }),
      examples: [
        { input: '"capiTalIze tHe titLe"', expectedOutput: "Capitalize The Title" },
        { input: '"First leTTeR of EACH Word"', expectedOutput: "First Letter of Each Word" },
        { input: '"i lOve leetcode"', expectedOutput: "i Love Leetcode" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 6);
        const words = Array.from({ length: n }, () => {
          const w = randLower(rng, 1, 6);
          return w.split("").map((c) => (rng() < 0.4 ? c.toUpperCase() : c)).join("");
        });
        const title = words.join(" ");
        return { input: JSON.stringify(title), expectedOutput: ref(title) };
      },
      solutions: {
        python: `def capitalizeTitle(title: str) -> str:\n    out = []\n    for w in title.split(" "):\n        lower = w.lower()\n        out.append(lower if len(lower) <= 2 else lower[0].upper() + lower[1:])\n    return " ".join(out)`,
        javascript: `var capitalizeTitle = function(title) {\n    const words = title.split(" ");\n    const out = [];\n    for (let i = 0; i < words.length; i++) {\n        const lower = words[i].toLowerCase();\n        if (lower.length <= 2) out.push(lower);\n        else out.push(lower.charAt(0).toUpperCase() + lower.slice(1));\n    }\n    return out.join(" ");\n};`,
        typescript: `function capitalizeTitle(title: string): string {\n    var words = title.split(" ");\n    var out: string[] = [];\n    for (var i = 0; i < words.length; i++) {\n        var lower = words[i].toLowerCase();\n        if (lower.length <= 2) out.push(lower);\n        else out.push(lower.charAt(0).toUpperCase() + lower.slice(1));\n    }\n    return out.join(" ");\n}`,
        java: `public static String capitalizeTitle(String title) {\n    String[] words = title.split(" ");\n    StringBuilder sb = new StringBuilder();\n    for (int i = 0; i < words.length; i++) {\n        if (i > 0) sb.append(' ');\n        String lower = words[i].toLowerCase();\n        if (lower.length() <= 2) sb.append(lower);\n        else sb.append(Character.toUpperCase(lower.charAt(0))).append(lower.substring(1));\n    }\n    return sb.toString();\n}`,
        cpp: `string capitalizeTitle(string title) {\n    vector<string> words;\n    string cur;\n    for (char c : title) {\n        if (c == ' ') { words.push_back(cur); cur.clear(); }\n        else cur += c;\n    }\n    words.push_back(cur);\n    string res;\n    for (int i = 0; i < (int) words.size(); i++) {\n        string w = words[i];\n        for (auto& ch : w) {\n            if (ch >= 'A' && ch <= 'Z') ch = (char) (ch + 32);\n        }\n        if (w.size() > 2 && w[0] >= 'a' && w[0] <= 'z') w[0] = (char) (w[0] - 32);\n        if (i > 0) res += ' ';\n        res += w;\n    }\n    return res;\n}`,
        c: `char* capitalizeTitle(const char* title) {\n    int n = (int) strlen(title);\n    char* out = (char*) malloc(n + 1);\n    for (int i = 0; i < n; i++) {\n        char c = title[i];\n        out[i] = (c >= 'A' && c <= 'Z') ? (char) (c + 32) : c;\n    }\n    out[n] = '\\0';\n    int i = 0;\n    while (i <= n) {\n        int start = i;\n        while (i < n && out[i] != ' ') i++;\n        int len = i - start;\n        if (len > 2 && out[start] >= 'a' && out[start] <= 'z') {\n            out[start] = (char) (out[start] - 32);\n        }\n        i++;\n    }\n    return out;\n}`,
        csharp: `public static string CapitalizeTitle(string title)\n{\n    string[] words = title.Split(' ');\n    var sb = new System.Text.StringBuilder();\n    for (int i = 0; i < words.Length; i++)\n    {\n        if (i > 0) sb.Append(' ');\n        string lower = words[i].ToLower();\n        if (lower.Length <= 2) sb.Append(lower);\n        else sb.Append(char.ToUpper(lower[0])).Append(lower.Substring(1));\n    }\n    return sb.ToString();\n}`,
        go: `func capitalizeTitle(title string) string {\n\twords := strings.Split(title, " ")\n\tout := make([]string, 0, len(words))\n\tfor _, w := range words {\n\t\tlower := strings.ToLower(w)\n\t\tif len(lower) <= 2 {\n\t\t\tout = append(out, lower)\n\t\t} else {\n\t\t\tout = append(out, strings.ToUpper(lower[:1])+lower[1:])\n\t\t}\n\t}\n\treturn strings.Join(out, " ")\n}`,
        kotlin: `fun capitalizeTitle(title: String): String {\n    val words = title.split(" ")\n    val sb = StringBuilder()\n    for (i in words.indices) {\n        if (i > 0) sb.append(' ')\n        val lower = words[i].toLowerCase()\n        if (lower.length <= 2) sb.append(lower)\n        else sb.append(lower[0].toUpperCase()).append(lower.substring(1))\n    }\n    return sb.toString()\n}`,
        swift: `func capitalizeTitle(_ title: String) -> String {\n    let words = title.split(separator: " ", omittingEmptySubsequences: false)\n    var out: [String] = []\n    for w in words {\n        let lower = w.lowercased()\n        if lower.count <= 2 {\n            out.append(lower)\n        } else {\n            out.append(lower.prefix(1).uppercased() + lower.dropFirst())\n        }\n    }\n    return out.joined(separator: " ")\n}`,
        rust: `fn capitalizeTitle(title: String) -> String {\n    let mut out: Vec<String> = Vec::new();\n    for w in title.split(' ') {\n        let lower = w.to_lowercase();\n        if lower.len() <= 2 {\n            out.push(lower);\n        } else {\n            let mut t = lower[..1].to_uppercase();\n            t.push_str(&lower[1..]);\n            out.push(t);\n        }\n    }\n    out.join(" ")\n}`,
        php: `function capitalizeTitle($title) {\n    $words = explode(" ", $title);\n    $out = array();\n    foreach ($words as $w) {\n        $lower = strtolower($w);\n        if (strlen($lower) <= 2) $out[] = $lower;\n        else $out[] = strtoupper(substr($lower, 0, 1)) . substr($lower, 1);\n    }\n    return implode(" ", $out);\n}`,
        ruby: `def capitalizeTitle(title)\n  title.split(" ").map do |w|\n    lower = w.downcase\n    lower.length <= 2 ? lower : lower[0].upcase + lower[1..-1]\n  end.join(" ")\nend`,
      },
    };
  })(),

  // ── Find First Palindromic String in the Array (LC 2108) ───────
  (() => {
    const isPal = (w: string) => {
      let i = 0, j = w.length - 1;
      while (i < j) { if (w[i] !== w[j]) return false; i++; j--; }
      return true;
    };
    const ref = (words: string[]) => {
      for (const w of words) if (isPal(w)) return w;
      return "";
    };
    return {
      slug: "find-first-palindromic-string-in-the-array",
      title: "Find First Palindromic String in the Array",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Two Pointers", "LeetCode 2108", "Amazon", "TCS"],
      signature: { funcName: "firstPalindrome", params: [{ name: "words", type: "string[]" as const }], returns: "string" as const },
      description: describe(
        "Given an array of strings `words`, return the **first** string in it that is a palindrome. If none is, return the empty string.",
        [
          { in: 'words = ["abc","car","ada","racecar","cool"]', out: "ada", note: '"ada" is the first palindrome; "racecar" is also one but comes later.' },
          { in: 'words = ["notapalindrome","racecar"]', out: "racecar" },
          { in: 'words = ["def","ghi"]', out: "", note: "Neither is a palindrome." },
        ],
        ["1 <= words.length <= 100", "1 <= words[i].length <= 100", "words[i] consists of lowercase English letters."]),
      hints: [
        "Test each word in order and return at the first hit.",
        "A two-pointer scan checks a palindrome in O(length) with no extra memory.",
        "A single character is always a palindrome.",
      ],
      editorial: explain({
        idea: "A linear scan with an early return: the first word that reads the same both ways is the answer.",
        steps: [
          "Iterate the array in order.",
          "For each word, walk two pointers inward comparing characters.",
          "Return the word on the first successful check.",
          "Return the empty string if none matched.",
        ],
        why: "Returning on the first success guarantees the earliest index, and the two-pointer check is exactly the definition of a palindrome.",
        time: "O(total characters)",
        space: "O(1) with the two-pointer check",
        pitfalls: [
          "Building a reversed copy of every word works but allocates unnecessarily.",
          "Returning the *shortest* or *longest* palindrome instead of the first is a misread of the problem.",
        ],
      }),
      examples: [
        { input: '["abc","car","ada","racecar","cool"]', expectedOutput: "ada" },
        { input: '["notapalindrome","racecar"]', expectedOutput: "racecar" },
        { input: '["def","ghi"]', expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 6);
        const words = Array.from({ length: n }, () => {
          if (rng() < 0.35) {
            const half = randLower(rng, 1, 3, "abc");
            const mid = rng() < 0.5 ? pick(rng, ["a", "b", "c"]) : "";
            return half + mid + half.split("").reverse().join("");
          }
          return randLower(rng, 1, 6, "abc");
        });
        return { input: fmtStrArr(words), expectedOutput: ref(words) };
      },
      solutions: {
        python: `from typing import List\n\ndef firstPalindrome(words: List[str]) -> str:\n    for w in words:\n        if w == w[::-1]:\n            return w\n    return ""`,
        javascript: `var firstPalindrome = function(words) {\n    function isPal(w) {\n        let i = 0, j = w.length - 1;\n        while (i < j) {\n            if (w.charAt(i) !== w.charAt(j)) return false;\n            i++;\n            j--;\n        }\n        return true;\n    }\n    for (let i = 0; i < words.length; i++) {\n        if (isPal(words[i])) return words[i];\n    }\n    return "";\n};`,
        typescript: `function firstPalindrome(words: string[]): string {\n    function isPal(w: string): boolean {\n        var i = 0, j = w.length - 1;\n        while (i < j) {\n            if (w.charAt(i) !== w.charAt(j)) return false;\n            i++;\n            j--;\n        }\n        return true;\n    }\n    for (var k = 0; k < words.length; k++) {\n        if (isPal(words[k])) return words[k];\n    }\n    return "";\n}`,
        java: `public static String firstPalindrome(String[] words) {\n    for (String w : words) {\n        int i = 0, j = w.length() - 1;\n        boolean ok = true;\n        while (i < j) {\n            if (w.charAt(i) != w.charAt(j)) { ok = false; break; }\n            i++;\n            j--;\n        }\n        if (ok) return w;\n    }\n    return "";\n}`,
        cpp: `string firstPalindrome(vector<string>& words) {\n    for (auto& w : words) {\n        int i = 0, j = (int) w.size() - 1;\n        bool ok = true;\n        while (i < j) {\n            if (w[i] != w[j]) { ok = false; break; }\n            i++;\n            j--;\n        }\n        if (ok) return w;\n    }\n    return "";\n}`,
        c: `char* firstPalindrome(char** words, int wordsSize) {\n    for (int k = 0; k < wordsSize; k++) {\n        int len = (int) strlen(words[k]);\n        int i = 0, j = len - 1;\n        int ok = 1;\n        while (i < j) {\n            if (words[k][i] != words[k][j]) { ok = 0; break; }\n            i++;\n            j--;\n        }\n        if (ok) {\n            char* out = (char*) malloc(len + 1);\n            strcpy(out, words[k]);\n            return out;\n        }\n    }\n    char* empty = (char*) malloc(1);\n    empty[0] = '\\0';\n    return empty;\n}`,
        csharp: `public static string FirstPalindrome(string[] words)\n{\n    foreach (string w in words)\n    {\n        int i = 0, j = w.Length - 1;\n        bool ok = true;\n        while (i < j)\n        {\n            if (w[i] != w[j]) { ok = false; break; }\n            i++;\n            j--;\n        }\n        if (ok) return w;\n    }\n    return "";\n}`,
        go: `func firstPalindrome(words []string) string {\n\tfor _, w := range words {\n\t\ti, j := 0, len(w)-1\n\t\tok := true\n\t\tfor i < j {\n\t\t\tif w[i] != w[j] {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t\ti++\n\t\t\tj--\n\t\t}\n\t\tif ok {\n\t\t\treturn w\n\t\t}\n\t}\n\treturn ""\n}`,
        kotlin: `fun firstPalindrome(words: Array<String>): String {\n    for (w in words) {\n        var i = 0\n        var j = w.length - 1\n        var ok = true\n        while (i < j) {\n            if (w[i] != w[j]) {\n                ok = false\n                break\n            }\n            i++\n            j--\n        }\n        if (ok) return w\n    }\n    return ""\n}`,
        swift: `func firstPalindrome(_ words: [String]) -> String {\n    for w in words {\n        let a = Array(w)\n        var i = 0\n        var j = a.count - 1\n        var ok = true\n        while i < j {\n            if a[i] != a[j] {\n                ok = false\n                break\n            }\n            i += 1\n            j -= 1\n        }\n        if ok { return w }\n    }\n    return ""\n}`,
        rust: `fn firstPalindrome(words: Vec<String>) -> String {\n    for w in words.iter() {\n        let a = w.as_bytes();\n        let mut i = 0usize;\n        let mut j = a.len();\n        let mut ok = true;\n        while j > 0 && i < j - 1 {\n            if a[i] != a[j - 1] {\n                ok = false;\n                break;\n            }\n            i += 1;\n            j -= 1;\n        }\n        if ok {\n            return w.clone();\n        }\n    }\n    String::new()\n}`,
        php: `function firstPalindrome($words) {\n    foreach ($words as $w) {\n        if ($w === strrev($w)) return $w;\n    }\n    return "";\n}`,
        ruby: `def firstPalindrome(words)\n  words.each do |w|\n    return w if w == w.reverse\n  end\n  ""\nend`,
      },
    };
  })(),

  // ── Minimum Number of Operations to Convert Time (LC 2224) ──────
  (() => {
    const mins = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
    const ref = (current: string, correct: string) => {
      let diff = mins(correct) - mins(current);
      let ops = 0;
      for (const step of [60, 15, 5, 1]) {
        ops += Math.floor(diff / step);
        diff %= step;
      }
      return ops;
    };
    return {
      slug: "minimum-number-of-operations-to-convert-time",
      title: "Minimum Number of Operations to Convert Time",
      difficulty: "EASY" as const,
      tags: ["String", "Greedy", "LeetCode 2224", "Amazon", "Adobe"],
      signature: {
        funcName: "convertTime",
        params: [{ name: "current", type: "string" as const }, { name: "correct", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two times in 24-hour `HH:MM` format, `current` and `correct`, where `current <= correct`.\n\nIn one operation you may add **1, 5, 15 or 60 minutes** to `current`. Return the minimum number of operations needed to make `current` equal `correct`.",
        [
          { in: 'current = "02:30", correct = "04:35"', out: "3", note: "Add 60, 60 and 5." },
          { in: 'current = "11:00", correct = "11:01"', out: "1" },
          { in: 'current = "09:41", correct = "10:34"', out: "7", note: "53 minutes: add 15 three times, then 5 once, then 1 three times." },
        ],
        ["current and correct are valid HH:MM times.", "current <= correct"]),
      hints: [
        "Convert both times to minutes since midnight and work with the difference.",
        "Each increment divides the next larger one — 1 | 5 | 15 | 60 — which makes greedy optimal.",
        "Take as many 60s as possible, then 15s, then 5s, then 1s.",
      ],
      editorial: explain({
        idea: "The coin denominations 1, 5, 15 and 60 form a chain where each divides the next, so the greedy \"largest first\" strategy gives the minimum number of coins.",
        steps: [
          "Parse both times into minutes: `HH * 60 + MM`.",
          "Take the difference `d = correct - current`.",
          "For each step in `[60, 15, 5, 1]`, add `d / step` to the answer and set `d = d % step`.",
          "Return the total.",
        ],
        why: "For a canonical coin system where each denomination divides the next, greedy is provably optimal: using a smaller coin where a larger one fits would need at least as many coins, because the larger denomination is an exact multiple of the smaller.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Parsing the hour and minute with the wrong slice offsets — the colon sits at index 2.",
          "Greedy would **not** be safe for an arbitrary denomination set; it works here only because of the divisibility chain.",
          "The problem guarantees `current <= correct`, so the difference is never negative.",
        ],
      }),
      examples: [
        { input: '"02:30"\n"04:35"', expectedOutput: "3" },
        { input: '"11:00"\n"11:01"', expectedOutput: "1" },
        { input: '"09:41"\n"10:34"', expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const pad = (n: number) => (n < 10 ? "0" + n : String(n));
        const a = ri(rng, 0, 1400);
        const b = ri(rng, a, 1439);
        const fmt = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
        return { input: `${JSON.stringify(fmt(a))}\n${JSON.stringify(fmt(b))}`, expectedOutput: String(ref(fmt(a), fmt(b))) };
      },
      solutions: {
        python: `def convertTime(current: str, correct: str) -> int:\n    def mins(t):\n        return int(t[0:2]) * 60 + int(t[3:5])\n    diff = mins(correct) - mins(current)\n    ops = 0\n    for step in (60, 15, 5, 1):\n        ops += diff // step\n        diff %= step\n    return ops`,
        javascript: `var convertTime = function(current, correct) {\n    function mins(t) {\n        return Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));\n    }\n    let diff = mins(correct) - mins(current);\n    let ops = 0;\n    const steps = [60, 15, 5, 1];\n    for (let i = 0; i < steps.length; i++) {\n        ops += Math.floor(diff / steps[i]);\n        diff %= steps[i];\n    }\n    return ops;\n};`,
        typescript: `function convertTime(current: string, correct: string): number {\n    function mins(t: string): number {\n        return Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));\n    }\n    var diff = mins(correct) - mins(current);\n    var ops = 0;\n    var steps = [60, 15, 5, 1];\n    for (var i = 0; i < steps.length; i++) {\n        ops += Math.floor(diff / steps[i]);\n        diff %= steps[i];\n    }\n    return ops;\n}`,
        java: `public static int convertTime(String current, String correct) {\n    int a = Integer.parseInt(current.substring(0, 2)) * 60 + Integer.parseInt(current.substring(3, 5));\n    int b = Integer.parseInt(correct.substring(0, 2)) * 60 + Integer.parseInt(correct.substring(3, 5));\n    int diff = b - a;\n    int ops = 0;\n    int[] steps = { 60, 15, 5, 1 };\n    for (int s : steps) {\n        ops += diff / s;\n        diff %= s;\n    }\n    return ops;\n}`,
        cpp: `int convertTime(string current, string correct) {\n    int a = stoi(current.substr(0, 2)) * 60 + stoi(current.substr(3, 2));\n    int b = stoi(correct.substr(0, 2)) * 60 + stoi(correct.substr(3, 2));\n    int diff = b - a;\n    int ops = 0;\n    int steps[4] = { 60, 15, 5, 1 };\n    for (int i = 0; i < 4; i++) {\n        ops += diff / steps[i];\n        diff %= steps[i];\n    }\n    return ops;\n}`,
        c: `int convertTime(const char* current, const char* correct) {\n    int a = (current[0] - '0') * 600 + (current[1] - '0') * 60 + (current[3] - '0') * 10 + (current[4] - '0');\n    int b = (correct[0] - '0') * 600 + (correct[1] - '0') * 60 + (correct[3] - '0') * 10 + (correct[4] - '0');\n    int diff = b - a;\n    int ops = 0;\n    int steps[4] = { 60, 15, 5, 1 };\n    for (int i = 0; i < 4; i++) {\n        ops += diff / steps[i];\n        diff %= steps[i];\n    }\n    return ops;\n}`,
        csharp: `public static int ConvertTime(string current, string correct)\n{\n    int a = int.Parse(current.Substring(0, 2)) * 60 + int.Parse(current.Substring(3, 2));\n    int b = int.Parse(correct.Substring(0, 2)) * 60 + int.Parse(correct.Substring(3, 2));\n    int diff = b - a;\n    int ops = 0;\n    int[] steps = { 60, 15, 5, 1 };\n    foreach (int s in steps)\n    {\n        ops += diff / s;\n        diff %= s;\n    }\n    return ops;\n}`,
        go: `func convertTime(current string, correct string) int {\n\tmins := func(t string) int {\n\t\th, _ := strconv.Atoi(t[0:2])\n\t\tm, _ := strconv.Atoi(t[3:5])\n\t\treturn h*60 + m\n\t}\n\tdiff := mins(correct) - mins(current)\n\tops := 0\n\tfor _, s := range []int{60, 15, 5, 1} {\n\t\tops += diff / s\n\t\tdiff %= s\n\t}\n\treturn ops\n}`,
        kotlin: `fun convertTime(current: String, correct: String): Int {\n    fun mins(t: String): Int = t.substring(0, 2).toInt() * 60 + t.substring(3, 5).toInt()\n    var diff = mins(correct) - mins(current)\n    var ops = 0\n    for (s in intArrayOf(60, 15, 5, 1)) {\n        ops += diff / s\n        diff %= s\n    }\n    return ops\n}`,
        swift: `func convertTime(_ current: String, _ correct: String) -> Int {\n    func mins(_ t: String) -> Int {\n        let a = Array(t.unicodeScalars).map { Int($0.value) - 48 }\n        return (a[0] * 10 + a[1]) * 60 + (a[3] * 10 + a[4])\n    }\n    var diff = mins(correct) - mins(current)\n    var ops = 0\n    for s in [60, 15, 5, 1] {\n        ops += diff / s\n        diff %= s\n    }\n    return ops\n}`,
        rust: `fn convertTime(current: String, correct: String) -> i32 {\n    fn mins(t: &str) -> i32 {\n        let a = t.as_bytes();\n        ((a[0] - b'0') as i32 * 10 + (a[1] - b'0') as i32) * 60\n            + ((a[3] - b'0') as i32 * 10 + (a[4] - b'0') as i32)\n    }\n    let mut diff = mins(&correct) - mins(&current);\n    let mut ops = 0;\n    for s in [60, 15, 5, 1].iter() {\n        ops += diff / s;\n        diff %= s;\n    }\n    ops\n}`,
        php: `function convertTime($current, $correct) {\n    $mins = function($t) {\n        return intval(substr($t, 0, 2)) * 60 + intval(substr($t, 3, 2));\n    };\n    $diff = $mins($correct) - $mins($current);\n    $ops = 0;\n    foreach (array(60, 15, 5, 1) as $s) {\n        $ops += intdiv($diff, $s);\n        $diff = $diff % $s;\n    }\n    return $ops;\n}`,
        ruby: `def convertTime(current, correct)\n  mins = ->(t) { t[0, 2].to_i * 60 + t[3, 2].to_i }\n  diff = mins.call(correct) - mins.call(current)\n  ops = 0\n  [60, 15, 5, 1].each do |s|\n    ops += diff / s\n    diff %= s\n  end\n  ops\nend`,
      },
    };
  })(),

  // ── Largest 3-Same-Digit Number in String (LC 2264) ─────────────
  (() => {
    const ref = (num: string) => {
      let best = "";
      for (let i = 0; i + 2 < num.length; i++) {
        if (num[i] === num[i + 1] && num[i] === num[i + 2]) {
          const cand = num.slice(i, i + 3);
          if (cand > best) best = cand;
        }
      }
      return best;
    };
    return {
      slug: "largest-3-same-digit-number-in-string",
      title: "Largest 3-Same-Digit Number in String",
      difficulty: "EASY" as const,
      tags: ["String", "LeetCode 2264", "Amazon", "Wipro"],
      signature: { funcName: "largestGoodInteger", params: [{ name: "num", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A **good** substring is a length-3 substring of `num` whose three digits are all the same.\n\nGiven a digit string `num`, return the largest good substring as a string, or the empty string if there is none. The answer keeps its three characters, so `\"000\"` is a valid answer.",
        [
          { in: 'num = "6777133339"', out: "777" },
          { in: 'num = "2300019"', out: "000" },
          { in: 'num = "42352338"', out: "", note: "No digit repeats three times in a row." },
        ],
        ["3 <= num.length <= 1000", "num consists of digits only."]),
      hints: [
        "Slide a window of size 3 and test whether all three characters agree.",
        "Comparing two length-3 digit strings lexicographically is the same as comparing them numerically.",
        "Keep the largest match seen, starting from the empty string.",
      ],
      editorial: explain({
        idea: "Only `n - 2` windows exist, and since all candidates have the same length, string comparison and numeric comparison agree — so no parsing is needed.",
        steps: [
          "Start with `best = \"\"`.",
          "For each `i` from 0 to `n - 3`, check `num[i] == num[i+1] == num[i+2]`.",
          "If they match, compare the substring with `best` and keep the larger.",
          "Return `best`.",
        ],
        why: "Equal-length digit strings order identically under lexicographic and numeric comparison, so the maximum found by string comparison is the numerically largest good integer. Keeping the string preserves the required leading zeros.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Parsing candidates to integers loses the leading zeros — `\"000\"` would print as `\"0\"`.",
          "Scanning `i` up to `n - 1` reads past the end of the string.",
          "Since only 10 distinct answers exist, you could scan digits 9 down to 0 and search for the first triple — but the direct sweep is simpler.",
        ],
      }),
      examples: [
        { input: '"6777133339"', expectedOutput: "777" },
        { input: '"2300019"', expectedOutput: "000" },
        { input: '"42352338"', expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        let num = "";
        const parts = ri(rng, 2, 6);
        for (let i = 0; i < parts; i++) {
          if (rng() < 0.4) num += String(ri(rng, 0, 9)).repeat(3);
          else num += String(ri(rng, 0, 9));
        }
        while (num.length < 3) num += String(ri(rng, 0, 9));
        return { input: JSON.stringify(num), expectedOutput: ref(num) };
      },
      solutions: {
        python: `def largestGoodInteger(num: str) -> str:\n    best = ""\n    for i in range(len(num) - 2):\n        if num[i] == num[i + 1] == num[i + 2]:\n            cand = num[i:i + 3]\n            if cand > best:\n                best = cand\n    return best`,
        javascript: `var largestGoodInteger = function(num) {\n    let best = "";\n    for (let i = 0; i + 2 < num.length; i++) {\n        if (num.charAt(i) === num.charAt(i + 1) && num.charAt(i) === num.charAt(i + 2)) {\n            const cand = num.slice(i, i + 3);\n            if (cand > best) best = cand;\n        }\n    }\n    return best;\n};`,
        typescript: `function largestGoodInteger(num: string): string {\n    var best = "";\n    for (var i = 0; i + 2 < num.length; i++) {\n        if (num.charAt(i) === num.charAt(i + 1) && num.charAt(i) === num.charAt(i + 2)) {\n            var cand = num.slice(i, i + 3);\n            if (cand > best) best = cand;\n        }\n    }\n    return best;\n}`,
        java: `public static String largestGoodInteger(String num) {\n    String best = "";\n    for (int i = 0; i + 2 < num.length(); i++) {\n        if (num.charAt(i) == num.charAt(i + 1) && num.charAt(i) == num.charAt(i + 2)) {\n            String cand = num.substring(i, i + 3);\n            if (cand.compareTo(best) > 0) best = cand;\n        }\n    }\n    return best;\n}`,
        cpp: `string largestGoodInteger(string num) {\n    string best = "";\n    for (int i = 0; i + 2 < (int) num.size(); i++) {\n        if (num[i] == num[i + 1] && num[i] == num[i + 2]) {\n            string cand = num.substr(i, 3);\n            if (cand > best) best = cand;\n        }\n    }\n    return best;\n}`,
        c: `char* largestGoodInteger(const char* num) {\n    int n = (int) strlen(num);\n    char best[4];\n    best[0] = '\\0';\n    for (int i = 0; i + 2 < n; i++) {\n        if (num[i] == num[i + 1] && num[i] == num[i + 2]) {\n            char cand[4];\n            cand[0] = num[i];\n            cand[1] = num[i + 1];\n            cand[2] = num[i + 2];\n            cand[3] = '\\0';\n            if (best[0] == '\\0' || strcmp(cand, best) > 0) strcpy(best, cand);\n        }\n    }\n    char* out = (char*) malloc(4);\n    strcpy(out, best);\n    return out;\n}`,
        csharp: `public static string LargestGoodInteger(string num)\n{\n    string best = "";\n    for (int i = 0; i + 2 < num.Length; i++)\n    {\n        if (num[i] == num[i + 1] && num[i] == num[i + 2])\n        {\n            string cand = num.Substring(i, 3);\n            if (string.CompareOrdinal(cand, best) > 0) best = cand;\n        }\n    }\n    return best;\n}`,
        go: `func largestGoodInteger(num string) string {\n\tbest := ""\n\tfor i := 0; i+2 < len(num); i++ {\n\t\tif num[i] == num[i+1] && num[i] == num[i+2] {\n\t\t\tcand := num[i : i+3]\n\t\t\tif cand > best {\n\t\t\t\tbest = cand\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun largestGoodInteger(num: String): String {\n    var best = ""\n    for (i in 0 until num.length - 2) {\n        if (num[i] == num[i + 1] && num[i] == num[i + 2]) {\n            val cand = num.substring(i, i + 3)\n            if (cand > best) best = cand\n        }\n    }\n    return best\n}`,
        swift: `func largestGoodInteger(_ num: String) -> String {\n    let a = Array(num)\n    var best = ""\n    var i = 0\n    while i + 2 < a.count {\n        if a[i] == a[i + 1] && a[i] == a[i + 2] {\n            let cand = String(a[i...(i + 2)])\n            if cand > best { best = cand }\n        }\n        i += 1\n    }\n    return best\n}`,
        rust: `fn largestGoodInteger(num: String) -> String {\n    let a = num.as_bytes();\n    let mut best = String::new();\n    let mut i = 0;\n    while i + 2 < a.len() {\n        if a[i] == a[i + 1] && a[i] == a[i + 2] {\n            let cand = String::from_utf8(a[i..i + 3].to_vec()).unwrap();\n            if cand > best {\n                best = cand;\n            }\n        }\n        i += 1;\n    }\n    best\n}`,
        php: `function largestGoodInteger($num) {\n    $best = "";\n    $n = strlen($num);\n    for ($i = 0; $i + 2 < $n; $i++) {\n        if ($num[$i] === $num[$i + 1] && $num[$i] === $num[$i + 2]) {\n            $cand = substr($num, $i, 3);\n            if (strcmp($cand, $best) > 0) $best = $cand;\n        }\n    }\n    return $best;\n}`,
        ruby: `def largestGoodInteger(num)\n  best = ""\n  (0..(num.length - 3)).each do |i|\n    if num[i] == num[i + 1] && num[i] == num[i + 2]\n      cand = num[i, 3]\n      best = cand if cand > best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Percentage of Letter in String (LC 2278) ────────────────────
  (() => {
    const ref = (s: string, letter: string) => {
      let c = 0;
      for (const ch of s) if (ch === letter) c++;
      return Math.floor((c * 100) / s.length);
    };
    return {
      slug: "percentage-of-letter-in-string",
      title: "Percentage of Letter in String",
      difficulty: "EASY" as const,
      tags: ["String", "LeetCode 2278", "Amazon", "TCS"],
      signature: {
        funcName: "percentageLetter",
        params: [{ name: "s", type: "string" as const }, { name: "letter", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Given a string `s` and a single-character string `letter`, return the percentage of characters in `s` that equal `letter`, **rounded down** to the nearest whole number.",
        [
          { in: 's = "foobar", letter = "o"', out: "33", note: "2 of 6 characters are o, and 200/6 truncates to 33." },
          { in: 's = "jjjj", letter = "k"', out: "0" },
          { in: 's = "vmvvvm", letter = "v"', out: "66" },
        ],
        ["1 <= s.length <= 100", "letter is a single lowercase English letter.", "s consists of lowercase English letters."]),
      hints: [
        "Count the occurrences, then scale by 100.",
        "Multiply **before** dividing so the integer division truncates only once, at the end.",
        "Integer division already rounds down for non-negative values.",
      ],
      editorial: explain({
        idea: "Count and scale. The only subtlety is doing the multiplication first so the single truncation happens on the final quotient.",
        steps: [
          "Count how many characters of `s` equal `letter`.",
          "Return `count * 100 / s.length` using integer division.",
        ],
        why: "Multiplying by 100 before dividing keeps full precision through the computation, so the floor is applied exactly once — to the true percentage.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Computing `count / s.length` first yields 0 for every case in integer arithmetic.",
          "Using floating point and then flooring is fine here but risks representation surprises; integer arithmetic is exact.",
        ],
      }),
      examples: [
        { input: '"foobar"\n"o"', expectedOutput: "33" },
        { input: '"jjjj"\n"k"', expectedOutput: "0" },
        { input: '"vmvvvm"\n"v"', expectedOutput: "66" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 30, "abcv");
        const letter = pick(rng, ["a", "b", "c", "v", "z"]);
        return { input: `${JSON.stringify(s)}\n${JSON.stringify(letter)}`, expectedOutput: String(ref(s, letter)) };
      },
      solutions: {
        python: `def percentageLetter(s: str, letter: str) -> int:\n    return s.count(letter) * 100 // len(s)`,
        javascript: `var percentageLetter = function(s, letter) {\n    let count = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s.charAt(i) === letter) count++;\n    }\n    return Math.floor((count * 100) / s.length);\n};`,
        typescript: `function percentageLetter(s: string, letter: string): number {\n    var count = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === letter) count++;\n    }\n    return Math.floor((count * 100) / s.length);\n}`,
        java: `public static int percentageLetter(String s, String letter) {\n    char target = letter.charAt(0);\n    int count = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == target) count++;\n    }\n    return count * 100 / s.length();\n}`,
        cpp: `int percentageLetter(string s, string letter) {\n    char target = letter[0];\n    int count = 0;\n    for (char c : s) {\n        if (c == target) count++;\n    }\n    return count * 100 / (int) s.size();\n}`,
        c: `int percentageLetter(const char* s, const char* letter) {\n    char target = letter[0];\n    int n = (int) strlen(s);\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == target) count++;\n    }\n    return count * 100 / n;\n}`,
        csharp: `public static int PercentageLetter(string s, string letter)\n{\n    char target = letter[0];\n    int count = 0;\n    foreach (char c in s)\n    {\n        if (c == target) count++;\n    }\n    return count * 100 / s.Length;\n}`,
        go: `func percentageLetter(s string, letter string) int {\n\ttarget := letter[0]\n\tcount := 0\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] == target {\n\t\t\tcount++\n\t\t}\n\t}\n\treturn count * 100 / len(s)\n}`,
        kotlin: `fun percentageLetter(s: String, letter: String): Int {\n    val target = letter[0]\n    var count = 0\n    for (c in s) {\n        if (c == target) count++\n    }\n    return count * 100 / s.length\n}`,
        swift: `func percentageLetter(_ s: String, _ letter: String) -> Int {\n    let target = Array(letter)[0]\n    var count = 0\n    for c in s {\n        if c == target { count += 1 }\n    }\n    return count * 100 / s.count\n}`,
        rust: `fn percentageLetter(s: String, letter: String) -> i32 {\n    let target = letter.as_bytes()[0];\n    let mut count = 0;\n    for b in s.bytes() {\n        if b == target {\n            count += 1;\n        }\n    }\n    count * 100 / s.len() as i32\n}`,
        php: `function percentageLetter($s, $letter) {\n    $count = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] === $letter) $count++;\n    }\n    return intdiv($count * 100, strlen($s));\n}`,
        ruby: `def percentageLetter(s, letter)\n  s.count(letter) * 100 / s.length\nend`,
      },
    };
  })(),

  // ── First Letter to Appear Twice (LC 2351) ──────────────────────
  (() => {
    const ref = (s: string) => {
      const seen: Record<string, boolean> = {};
      for (const c of s) {
        if (seen[c]) return c;
        seen[c] = true;
      }
      return "";
    };
    return {
      slug: "first-letter-to-appear-twice",
      title: "First Letter to Appear Twice",
      difficulty: "EASY" as const,
      tags: ["String", "Hash Table", "LeetCode 2351", "Amazon", "Infosys"],
      signature: { funcName: "repeatedCharacter", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given a string `s` of lowercase English letters, return the first letter whose **second occurrence** comes earliest.\n\nThe input is guaranteed to contain at least one repeated letter.",
        [
          { in: 's = "abccbaacz"', out: "c", note: "c is the first letter to appear a second time, at index 3." },
          { in: 's = "abcdd"', out: "d" },
          { in: 's = "aa"', out: "a" },
        ],
        ["2 <= s.length <= 100", "s consists of lowercase English letters.", "At least one letter appears more than once."]),
      hints: [
        "Scan left to right and remember which letters you have already seen.",
        "The moment a letter is seen for the second time, that is the answer.",
        "A 26-slot boolean array is enough state.",
      ],
      editorial: explain({
        idea: "\"The letter whose second occurrence is earliest\" is exactly the first letter that is already in the seen-set when you reach it.",
        steps: [
          "Keep a set (or 26-slot boolean array) of letters seen so far.",
          "Walk the string. If the current letter is already in the set, return it.",
          "Otherwise add it and continue.",
        ],
        why: "The scan reaches each index in order, so the first time the set test succeeds is the earliest second occurrence in the whole string.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Counting frequencies first and then picking the letter with the smallest *first* index gives the wrong letter — the tie-break is on the second occurrence.",
          "A bitmask over 26 bits is a compact alternative to the boolean array.",
        ],
      }),
      examples: [
        { input: '"abccbaacz"', expectedOutput: "c" },
        { input: '"abcdd"', expectedOutput: "d" },
        { input: '"aa"', expectedOutput: "a" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcdef";
        let s = "";
        do {
          const n = ri(rng, 2, 20);
          s = Array.from({ length: n }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");
        } while (ref(s) === "");
        return { input: JSON.stringify(s), expectedOutput: ref(s) };
      },
      solutions: {
        python: `def repeatedCharacter(s: str) -> str:\n    seen = set()\n    for c in s:\n        if c in seen:\n            return c\n        seen.add(c)\n    return ""`,
        javascript: `var repeatedCharacter = function(s) {\n    const seen = {};\n    for (let i = 0; i < s.length; i++) {\n        const c = s.charAt(i);\n        if (seen[c] === true) return c;\n        seen[c] = true;\n    }\n    return "";\n};`,
        typescript: `function repeatedCharacter(s: string): string {\n    var seen: { [key: string]: boolean } = {};\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (seen[c] === true) return c;\n        seen[c] = true;\n    }\n    return "";\n}`,
        java: `public static String repeatedCharacter(String s) {\n    boolean[] seen = new boolean[26];\n    for (int i = 0; i < s.length(); i++) {\n        int idx = s.charAt(i) - 'a';\n        if (seen[idx]) return String.valueOf(s.charAt(i));\n        seen[idx] = true;\n    }\n    return "";\n}`,
        cpp: `string repeatedCharacter(string s) {\n    bool seen[26] = { false };\n    for (char c : s) {\n        if (seen[c - 'a']) return string(1, c);\n        seen[c - 'a'] = true;\n    }\n    return "";\n}`,
        c: `char* repeatedCharacter(const char* s) {\n    bool seen[26];\n    for (int i = 0; i < 26; i++) seen[i] = false;\n    char* out = (char*) malloc(2);\n    out[0] = '\\0';\n    out[1] = '\\0';\n    for (int i = 0; s[i] != '\\0'; i++) {\n        int idx = s[i] - 'a';\n        if (seen[idx]) {\n            out[0] = s[i];\n            return out;\n        }\n        seen[idx] = true;\n    }\n    return out;\n}`,
        csharp: `public static string RepeatedCharacter(string s)\n{\n    bool[] seen = new bool[26];\n    foreach (char c in s)\n    {\n        if (seen[c - 'a']) return c.ToString();\n        seen[c - 'a'] = true;\n    }\n    return "";\n}`,
        go: `func repeatedCharacter(s string) string {\n\tvar seen [26]bool\n\tfor i := 0; i < len(s); i++ {\n\t\tidx := s[i] - 'a'\n\t\tif seen[idx] {\n\t\t\treturn string(s[i])\n\t\t}\n\t\tseen[idx] = true\n\t}\n\treturn ""\n}`,
        kotlin: `fun repeatedCharacter(s: String): String {\n    val seen = BooleanArray(26)\n    for (c in s) {\n        val idx = c - 'a'\n        if (seen[idx]) return c.toString()\n        seen[idx] = true\n    }\n    return ""\n}`,
        swift: `func repeatedCharacter(_ s: String) -> String {\n    var seen = [Bool](repeating: false, count: 26)\n    for c in s {\n        let idx = Int(c.unicodeScalars.first!.value) - 97\n        if seen[idx] { return String(c) }\n        seen[idx] = true\n    }\n    return ""\n}`,
        rust: `fn repeatedCharacter(s: String) -> String {\n    let mut seen = [false; 26];\n    for b in s.bytes() {\n        let idx = (b - b'a') as usize;\n        if seen[idx] {\n            return (b as char).to_string();\n        }\n        seen[idx] = true;\n    }\n    String::new()\n}`,
        php: `function repeatedCharacter($s) {\n    $seen = array();\n    for ($i = 0; $i < strlen($s); $i++) {\n        if (isset($seen[$s[$i]])) return $s[$i];\n        $seen[$s[$i]] = true;\n    }\n    return "";\n}`,
        ruby: `def repeatedCharacter(s)\n  seen = {}\n  s.each_char do |c|\n    return c if seen[c]\n    seen[c] = true\n  end\n  ""\nend`,
      },
    };
  })(),

  // ── Odd String Difference (LC 2451) ─────────────────────────────
  (() => {
    const diffOf = (w: string) => {
      const d: number[] = [];
      for (let i = 1; i < w.length; i++) d.push(w.charCodeAt(i) - w.charCodeAt(i - 1));
      return d.join(",");
    };
    const ref = (words: string[]) => {
      const groups: Record<string, number[]> = {};
      words.forEach((w, i) => {
        const k = diffOf(w);
        if (!groups[k]) groups[k] = [];
        groups[k].push(i);
      });
      for (const k of Object.keys(groups)) {
        if (groups[k].length === 1) return words[groups[k][0]];
      }
      return "";
    };
    return {
      slug: "odd-string-difference",
      title: "Odd String Difference",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Hash Table", "LeetCode 2451", "Amazon", "Adobe"],
      signature: { funcName: "oddString", params: [{ name: "words", type: "string[]" as const }], returns: "string" as const },
      description: describe(
        "You are given an array `words` of strings that all have the **same length** `n`.\n\nThe **difference array** of a string `s` is the array `[s[1]-s[0], s[2]-s[1], …, s[n-1]-s[n-2]]` of character-code differences.\n\nAll but one of the strings share the same difference array. Return the odd one out.",
        [
          { in: 'words = ["adc","wzy","abc"]', out: "abc", note: '"adc" and "wzy" both have difference array [3,-1]; "abc" has [1,1].' },
          { in: 'words = ["aaa","bob","ccc","ddd"]', out: "bob", note: 'The others have [0,0]; "bob" has [13,-13].' },
          { in: 'words = ["abm","bcn","alk"]', out: "alk" },
        ],
        ["3 <= words.length <= 100", "n == words[i].length", "2 <= n <= 20", "words[i] consists of lowercase English letters.", "Exactly one string has a different difference array."]),
      hints: [
        "Encode each difference array as a hashable key — joining the numbers with a separator works.",
        "Group the word indices by that key.",
        "Exactly one group has size 1; the word in it is the answer.",
      ],
      editorial: explain({
        idea: "Reduce each word to a canonical key — its difference array — then group. The problem guarantees a 1-and-the-rest split, so the singleton group holds the answer.",
        steps: [
          "For each word, build its difference array and turn it into a string key.",
          "Map each key to the list of word indices producing it.",
          "Find the key whose list has exactly one element and return that word.",
        ],
        why: "Two words share a difference array exactly when their keys match, so the grouping is by the equivalence the problem defines. With `words.length >= 3` and exactly one odd string, precisely one group is a singleton.",
        time: "O(total characters)",
        space: "O(total characters)",
        pitfalls: [
          "Concatenating the differences without a separator collides — `[1,11]` and `[11,1]` both become `\"111\"`.",
          "Differences can be negative, so the key must survive a minus sign.",
          "Comparing only the first two words to pick the \"majority\" pattern breaks when one of them is the odd string.",
        ],
      }),
      examples: [
        { input: '["adc","wzy","abc"]', expectedOutput: "abc" },
        { input: '["aaa","bob","ccc","ddd"]', expectedOutput: "bob" },
        { input: '["abm","bcn","alk"]', expectedOutput: "alk" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, 2, 6);
        const n = ri(rng, 3, 7);
        const pattern = Array.from({ length: len - 1 }, () => ri(rng, -3, 3));
        const build = (diffs: number[]) => {
          let code = ri(rng, 8, 17);
          let w = String.fromCharCode(97 + code);
          for (const d of diffs) {
            code = Math.min(25, Math.max(0, code + d));
            w += String.fromCharCode(97 + code);
          }
          return w;
        };
        const words: string[] = [];
        for (let i = 0; i < n - 1; i++) {
          let code = ri(rng, 8, 17);
          let w = String.fromCharCode(97 + code);
          for (const d of pattern) { code += d; w += String.fromCharCode(97 + code); }
          words.push(w);
        }
        let odd: string;
        do {
          const alt = pattern.map(() => ri(rng, -3, 3));
          odd = build(alt);
        } while (diffOf(odd) === diffOf(words[0]) || odd.length !== words[0].length);
        words.push(odd);
        shuffle(rng, words);
        const answer = ref(words);
        if (answer === "") return { input: '["adc","wzy","abc"]', expectedOutput: "abc" };
        return { input: fmtStrArr(words), expectedOutput: answer };
      },
      solutions: {
        python: `from typing import List\n\ndef oddString(words: List[str]) -> str:\n    groups = {}\n    for i, w in enumerate(words):\n        key = ",".join(str(ord(w[j]) - ord(w[j - 1])) for j in range(1, len(w)))\n        groups.setdefault(key, []).append(i)\n    for key, idxs in groups.items():\n        if len(idxs) == 1:\n            return words[idxs[0]]\n    return ""`,
        javascript: `var oddString = function(words) {\n    function keyOf(w) {\n        const d = [];\n        for (let i = 1; i < w.length; i++) d.push(w.charCodeAt(i) - w.charCodeAt(i - 1));\n        return d.join(",");\n    }\n    const groups = {};\n    for (let i = 0; i < words.length; i++) {\n        const k = keyOf(words[i]);\n        if (!groups[k]) groups[k] = [];\n        groups[k].push(i);\n    }\n    const keys = Object.keys(groups);\n    for (let i = 0; i < keys.length; i++) {\n        if (groups[keys[i]].length === 1) return words[groups[keys[i]][0]];\n    }\n    return "";\n};`,
        typescript: `function oddString(words: string[]): string {\n    function keyOf(w: string): string {\n        var d: number[] = [];\n        for (var i = 1; i < w.length; i++) d.push(w.charCodeAt(i) - w.charCodeAt(i - 1));\n        return d.join(",");\n    }\n    var groups: { [key: string]: number[] } = {};\n    for (var i = 0; i < words.length; i++) {\n        var k = keyOf(words[i]);\n        if (!groups[k]) groups[k] = [];\n        groups[k].push(i);\n    }\n    var keys = Object.keys(groups);\n    for (var j = 0; j < keys.length; j++) {\n        if (groups[keys[j]].length === 1) return words[groups[keys[j]][0]];\n    }\n    return "";\n}`,
        java: `public static String oddString(String[] words) {\n    HashMap<String, ArrayList<Integer>> groups = new HashMap<>();\n    for (int i = 0; i < words.length; i++) {\n        StringBuilder sb = new StringBuilder();\n        String w = words[i];\n        for (int j = 1; j < w.length(); j++) {\n            if (j > 1) sb.append(',');\n            sb.append(w.charAt(j) - w.charAt(j - 1));\n        }\n        String k = sb.toString();\n        groups.computeIfAbsent(k, x -> new ArrayList<>()).add(i);\n    }\n    for (Map.Entry<String, ArrayList<Integer>> e : groups.entrySet()) {\n        if (e.getValue().size() == 1) return words[e.getValue().get(0)];\n    }\n    return "";\n}`,
        cpp: `string oddString(vector<string>& words) {\n    unordered_map<string, vector<int>> groups;\n    for (int i = 0; i < (int) words.size(); i++) {\n        string k;\n        const string& w = words[i];\n        for (int j = 1; j < (int) w.size(); j++) {\n            if (j > 1) k += ',';\n            k += to_string((int) w[j] - (int) w[j - 1]);\n        }\n        groups[k].push_back(i);\n    }\n    for (auto& e : groups) {\n        if (e.second.size() == 1) return words[e.second[0]];\n    }\n    return "";\n}`,
        c: `char* oddString(char** words, int wordsSize) {\n    int len = (int) strlen(words[0]);\n    for (int i = 0; i < wordsSize; i++) {\n        int matches = 0;\n        for (int j = 0; j < wordsSize; j++) {\n            if (i == j) continue;\n            int same = 1;\n            for (int k = 1; k < len; k++) {\n                int di = words[i][k] - words[i][k - 1];\n                int dj = words[j][k] - words[j][k - 1];\n                if (di != dj) { same = 0; break; }\n            }\n            if (same) matches++;\n        }\n        if (matches == 0) {\n            char* out = (char*) malloc(len + 1);\n            strcpy(out, words[i]);\n            return out;\n        }\n    }\n    char* empty = (char*) malloc(1);\n    empty[0] = '\\0';\n    return empty;\n}`,
        csharp: `public static string OddString(string[] words)\n{\n    var groups = new Dictionary<string, List<int>>();\n    for (int i = 0; i < words.Length; i++)\n    {\n        var sb = new System.Text.StringBuilder();\n        string w = words[i];\n        for (int j = 1; j < w.Length; j++)\n        {\n            if (j > 1) sb.Append(',');\n            sb.Append(w[j] - w[j - 1]);\n        }\n        string k = sb.ToString();\n        if (!groups.ContainsKey(k)) groups[k] = new List<int>();\n        groups[k].Add(i);\n    }\n    foreach (var e in groups)\n    {\n        if (e.Value.Count == 1) return words[e.Value[0]];\n    }\n    return "";\n}`,
        go: `func oddString(words []string) string {\n\tgroups := map[string][]int{}\n\tfor i, w := range words {\n\t\tparts := make([]string, 0, len(w))\n\t\tfor j := 1; j < len(w); j++ {\n\t\t\tparts = append(parts, strconv.Itoa(int(w[j])-int(w[j-1])))\n\t\t}\n\t\tk := strings.Join(parts, ",")\n\t\tgroups[k] = append(groups[k], i)\n\t}\n\tfor _, idxs := range groups {\n\t\tif len(idxs) == 1 {\n\t\t\treturn words[idxs[0]]\n\t\t}\n\t}\n\treturn ""\n}`,
        kotlin: `fun oddString(words: Array<String>): String {\n    val groups = HashMap<String, MutableList<Int>>()\n    for (i in words.indices) {\n        val w = words[i]\n        val sb = StringBuilder()\n        for (j in 1 until w.length) {\n            if (j > 1) sb.append(',')\n            sb.append(w[j] - w[j - 1])\n        }\n        val k = sb.toString()\n        groups.getOrPut(k) { ArrayList() }.add(i)\n    }\n    for (e in groups.entries) {\n        if (e.value.size == 1) return words[e.value[0]]\n    }\n    return ""\n}`,
        swift: `func oddString(_ words: [String]) -> String {\n    var groups: [String: [Int]] = [:]\n    for (i, w) in words.enumerated() {\n        let a = Array(w.unicodeScalars).map { Int($0.value) }\n        var parts: [String] = []\n        for j in 1..<a.count {\n            parts.append(String(a[j] - a[j - 1]))\n        }\n        let k = parts.joined(separator: ",")\n        groups[k, default: []].append(i)\n    }\n    for (_, idxs) in groups {\n        if idxs.count == 1 { return words[idxs[0]] }\n    }\n    return ""\n}`,
        rust: `fn oddString(words: Vec<String>) -> String {\n    use std::collections::HashMap;\n    let mut groups: HashMap<String, Vec<usize>> = HashMap::new();\n    for (i, w) in words.iter().enumerate() {\n        let a = w.as_bytes();\n        let mut parts: Vec<String> = Vec::new();\n        for j in 1..a.len() {\n            parts.push((a[j] as i32 - a[j - 1] as i32).to_string());\n        }\n        groups.entry(parts.join(",")).or_insert_with(Vec::new).push(i);\n    }\n    for (_, idxs) in groups.iter() {\n        if idxs.len() == 1 {\n            return words[idxs[0]].clone();\n        }\n    }\n    String::new()\n}`,
        php: `function oddString($words) {\n    $groups = array();\n    foreach ($words as $i => $w) {\n        $parts = array();\n        for ($j = 1; $j < strlen($w); $j++) {\n            $parts[] = (string) (ord($w[$j]) - ord($w[$j - 1]));\n        }\n        $k = implode(",", $parts);\n        if (!isset($groups[$k])) $groups[$k] = array();\n        $groups[$k][] = $i;\n    }\n    foreach ($groups as $idxs) {\n        if (count($idxs) === 1) return $words[$idxs[0]];\n    }\n    return "";\n}`,
        ruby: `def oddString(words)\n  groups = {}\n  words.each_with_index do |w, i|\n    key = (1...w.length).map { |j| (w[j].ord - w[j - 1].ord).to_s }.join(",")\n    (groups[key] ||= []) << i\n  end\n  groups.each_value do |idxs|\n    return words[idxs[0]] if idxs.length == 1\n  end\n  ""\nend`,
      },
    };
  })(),

  // ── Maximum Value of a String in an Array (LC 2496) ─────────────
  (() => {
    const valueOf = (s: string) => {
      let allDigits = s.length > 0;
      for (const c of s) if (c < "0" || c > "9") { allDigits = false; break; }
      if (!allDigits) return s.length;
      let n = 0;
      for (const c of s) n = n * 10 + (c.charCodeAt(0) - 48);
      return n;
    };
    const ref = (strs: string[]) => {
      let best = 0;
      for (const s of strs) { const v = valueOf(s); if (v > best) best = v; }
      return best;
    };
    return {
      slug: "maximum-value-of-a-string-in-an-array",
      title: "Maximum Value of a String in an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "LeetCode 2496", "Amazon", "TCS"],
      signature: { funcName: "maximumValue", params: [{ name: "strs", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "The **value** of an alphanumeric string is defined as follows:\n\n- If it consists only of digits, its value is that number (leading zeros allowed).\n- Otherwise its value is its length.\n\nGiven an array `strs`, return the maximum value among its strings.",
        [
          { in: 'strs = ["alic3","bob","3","4","00000"]', out: "5", note: '"alic3" has length 5; the numeric strings are worth 3, 4 and 0.' },
          { in: 'strs = ["1","01","001","0001"]', out: "1", note: "All are the number 1 after ignoring leading zeros." },
          { in: 'strs = ["abc","12345"]', out: "12345" },
        ],
        ["1 <= strs.length <= 100", "1 <= strs[i].length <= 9", "strs[i] consists of lowercase English letters and digits."]),
      hints: [
        "Test whether the string is all digits before deciding which rule applies.",
        "Length is at most 9, so a digit string always fits in a 32-bit integer.",
        "Track a running maximum.",
      ],
      editorial: explain({
        idea: "Each string's value is decided by a single all-digits test, after which the answer is a plain maximum.",
        steps: [
          "For each string, check whether every character is a digit.",
          "If so, parse it as an integer; otherwise take its length.",
          "Keep the running maximum and return it.",
        ],
        why: "The two rules are mutually exclusive and cover every input, so the value function is total; the maximum over independent values is a simple fold.",
        time: "O(total characters)",
        space: "O(1)",
        pitfalls: [
          "Parsing without the all-digits test throws (or silently returns 0) on `\"alic3\"`.",
          "Leading zeros are harmless once parsed as a number — `\"00000\"` is 0, not 5.",
          "With at most 9 digits the maximum is 999,999,999, safely inside a 32-bit int.",
        ],
      }),
      examples: [
        { input: '["alic3","bob","3","4","00000"]', expectedOutput: "5" },
        { input: '["1","01","001","0001"]', expectedOutput: "1" },
        { input: '["abc","12345"]', expectedOutput: "12345" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const strs = Array.from({ length: n }, () => {
          if (rng() < 0.5) {
            const d = ri(rng, 1, 6);
            return Array.from({ length: d }, () => String(ri(rng, 0, 9))).join("");
          }
          return randLower(rng, 1, 8, "abc123");
        });
        return { input: fmtStrArr(strs), expectedOutput: String(ref(strs)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maximumValue(strs: List[str]) -> int:\n    best = 0\n    for s in strs:\n        v = int(s) if s.isdigit() else len(s)\n        if v > best:\n            best = v\n    return best`,
        javascript: `var maximumValue = function(strs) {\n    let best = 0;\n    for (let i = 0; i < strs.length; i++) {\n        const s = strs[i];\n        let allDigits = s.length > 0;\n        for (let j = 0; j < s.length; j++) {\n            const c = s.charAt(j);\n            if (c < "0" || c > "9") { allDigits = false; break; }\n        }\n        const v = allDigits ? parseInt(s, 10) : s.length;\n        if (v > best) best = v;\n    }\n    return best;\n};`,
        typescript: `function maximumValue(strs: string[]): number {\n    var best = 0;\n    for (var i = 0; i < strs.length; i++) {\n        var s = strs[i];\n        var allDigits = s.length > 0;\n        for (var j = 0; j < s.length; j++) {\n            var c = s.charAt(j);\n            if (c < "0" || c > "9") { allDigits = false; break; }\n        }\n        var v = allDigits ? parseInt(s, 10) : s.length;\n        if (v > best) best = v;\n    }\n    return best;\n}`,
        java: `public static int maximumValue(String[] strs) {\n    int best = 0;\n    for (String s : strs) {\n        boolean allDigits = s.length() > 0;\n        for (int i = 0; i < s.length(); i++) {\n            char c = s.charAt(i);\n            if (c < '0' || c > '9') { allDigits = false; break; }\n        }\n        int v = allDigits ? Integer.parseInt(s) : s.length();\n        if (v > best) best = v;\n    }\n    return best;\n}`,
        cpp: `int maximumValue(vector<string>& strs) {\n    int best = 0;\n    for (auto& s : strs) {\n        bool allDigits = !s.empty();\n        for (char c : s) {\n            if (c < '0' || c > '9') { allDigits = false; break; }\n        }\n        int v = allDigits ? stoi(s) : (int) s.size();\n        if (v > best) best = v;\n    }\n    return best;\n}`,
        c: `int maximumValue(char** strs, int strsSize) {\n    int best = 0;\n    for (int i = 0; i < strsSize; i++) {\n        const char* s = strs[i];\n        int len = (int) strlen(s);\n        int allDigits = len > 0;\n        for (int j = 0; j < len; j++) {\n            if (s[j] < '0' || s[j] > '9') { allDigits = 0; break; }\n        }\n        int v;\n        if (allDigits) {\n            v = 0;\n            for (int j = 0; j < len; j++) v = v * 10 + (s[j] - '0');\n        } else {\n            v = len;\n        }\n        if (v > best) best = v;\n    }\n    return best;\n}`,
        csharp: `public static int MaximumValue(string[] strs)\n{\n    int best = 0;\n    foreach (string s in strs)\n    {\n        bool allDigits = s.Length > 0;\n        foreach (char c in s)\n        {\n            if (c < '0' || c > '9') { allDigits = false; break; }\n        }\n        int v = allDigits ? int.Parse(s) : s.Length;\n        if (v > best) best = v;\n    }\n    return best;\n}`,
        go: `func maximumValue(strs []string) int {\n\tbest := 0\n\tfor _, s := range strs {\n\t\tallDigits := len(s) > 0\n\t\tfor i := 0; i < len(s); i++ {\n\t\t\tif s[i] < '0' || s[i] > '9' {\n\t\t\t\tallDigits = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tv := len(s)\n\t\tif allDigits {\n\t\t\tv, _ = strconv.Atoi(s)\n\t\t}\n\t\tif v > best {\n\t\t\tbest = v\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maximumValue(strs: Array<String>): Int {\n    var best = 0\n    for (s in strs) {\n        var allDigits = s.isNotEmpty()\n        for (c in s) {\n            if (c < '0' || c > '9') {\n                allDigits = false\n                break\n            }\n        }\n        val v = if (allDigits) s.toInt() else s.length\n        if (v > best) best = v\n    }\n    return best\n}`,
        swift: `func maximumValue(_ strs: [String]) -> Int {\n    var best = 0\n    for s in strs {\n        var allDigits = !s.isEmpty\n        for c in s {\n            if c < "0" || c > "9" {\n                allDigits = false\n                break\n            }\n        }\n        let v = allDigits ? (Int(s) ?? 0) : s.count\n        if v > best { best = v }\n    }\n    return best\n}`,
        rust: `fn maximumValue(strs: Vec<String>) -> i32 {\n    let mut best = 0;\n    for s in strs.iter() {\n        let mut all_digits = !s.is_empty();\n        for b in s.bytes() {\n            if b < b'0' || b > b'9' {\n                all_digits = false;\n                break;\n            }\n        }\n        let v: i32 = if all_digits {\n            s.parse().unwrap_or(0)\n        } else {\n            s.len() as i32\n        };\n        if v > best {\n            best = v;\n        }\n    }\n    best\n}`,
        php: `function maximumValue($strs) {\n    $best = 0;\n    foreach ($strs as $s) {\n        $allDigits = strlen($s) > 0;\n        for ($i = 0; $i < strlen($s); $i++) {\n            if ($s[$i] < '0' || $s[$i] > '9') { $allDigits = false; break; }\n        }\n        $v = $allDigits ? intval($s) : strlen($s);\n        if ($v > $best) $best = $v;\n    }\n    return $best;\n}`,
        ruby: `def maximumValue(strs)\n  best = 0\n  strs.each do |s|\n    v = s.match?(/\\A[0-9]+\\z/) ? s.to_i : s.length\n    best = v if v > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Split Strings by Separator (LC 2788) ────────────────────────
  (() => {
    const ref = (words: string[], sep: string) => {
      const out: string[] = [];
      for (const w of words) {
        let cur = "";
        for (const c of w) {
          if (c === sep) { if (cur.length > 0) out.push(cur); cur = ""; }
          else cur += c;
        }
        if (cur.length > 0) out.push(cur);
      }
      return out;
    };
    return {
      slug: "split-strings-by-separator",
      title: "Split Strings by Separator",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "LeetCode 2788", "Amazon", "Adobe"],
      signature: {
        funcName: "splitWordsBySeparator",
        params: [{ name: "words", type: "string[]" as const }, { name: "separator", type: "string" as const }],
        returns: "string[]" as const,
      },
      description: describe(
        "Given an array of strings `words` and a single-character string `separator`, split each string in `words` at every occurrence of `separator`.\n\nReturn all the resulting pieces in their original order, **excluding empty pieces**. The separators themselves are not part of the result.",
        [
          { in: 'words = ["one.two.three","four.five","six"], separator = "."', out: '["one","two","three","four","five","six"]' },
          { in: 'words = ["$easy$","$problem$"], separator = "$"', out: '["easy","problem"]', note: "The leading and trailing empty pieces are dropped." },
          { in: 'words = ["|||"], separator = "|"', out: "[]", note: "Every piece is empty." },
        ],
        ["1 <= words.length <= 100", "1 <= words[i].length <= 20", "separator is one of the characters .,|$#@ (excluding quotes)."]),
      hints: [
        "Process each word independently and append its pieces to one shared output list.",
        "Accumulate characters until you hit the separator, then flush.",
        "Flush only non-empty pieces — and do not forget the final flush after the loop.",
      ],
      editorial: explain({
        idea: "A manual split keeps the empty-piece rule obvious: build up a buffer, flush it at each separator and at the end, and only emit it when it is non-empty.",
        steps: [
          "Create the output list.",
          "For each word, walk its characters accumulating into `cur`.",
          "On a separator, push `cur` if non-empty and reset it.",
          "After the word ends, push `cur` once more if non-empty.",
          "Return the collected pieces.",
        ],
        why: "Consecutive separators, and separators at either end, all produce empty buffers — which the non-empty guard drops, exactly as the problem requires.",
        time: "O(total characters)",
        space: "O(total characters) for the output",
        pitfalls: [
          "Built-in split functions keep empty pieces, so they need a filter afterwards.",
          "Several of these separator characters are regex metacharacters, so a regex-based split needs escaping.",
          "Forgetting the flush after the final character drops the last piece of every word.",
        ],
      }),
      examples: [
        { input: '["one.two.three","four.five","six"]\n"."', expectedOutput: '["one","two","three","four","five","six"]' },
        { input: '["$easy$","$problem$"]\n"$"', expectedOutput: '["easy","problem"]' },
        { input: '["|||"]\n"|"', expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const sep = pick(rng, [".", "|", "$", "#", "@"]);
        const n = ri(rng, 1, 5);
        const words = Array.from({ length: n }, () => {
          const chunks = ri(rng, 1, 4);
          const parts: string[] = [];
          for (let i = 0; i < chunks; i++) parts.push(rng() < 0.2 ? "" : randLower(rng, 1, 4, "abc"));
          let w = parts.join(sep);
          if (w.length === 0) w = sep;
          return w;
        });
        return { input: `${fmtStrArr(words)}\n${JSON.stringify(sep)}`, expectedOutput: fmtStrArr(ref(words, sep)) };
      },
      solutions: {
        python: `from typing import List\n\ndef splitWordsBySeparator(words: List[str], separator: str) -> List[str]:\n    out = []\n    for w in words:\n        for part in w.split(separator):\n            if part:\n                out.append(part)\n    return out`,
        javascript: `var splitWordsBySeparator = function(words, separator) {\n    const out = [];\n    for (let i = 0; i < words.length; i++) {\n        let cur = "";\n        const w = words[i];\n        for (let j = 0; j < w.length; j++) {\n            if (w.charAt(j) === separator) {\n                if (cur.length > 0) out.push(cur);\n                cur = "";\n            } else {\n                cur += w.charAt(j);\n            }\n        }\n        if (cur.length > 0) out.push(cur);\n    }\n    return out;\n};`,
        typescript: `function splitWordsBySeparator(words: string[], separator: string): string[] {\n    var out: string[] = [];\n    for (var i = 0; i < words.length; i++) {\n        var cur = "";\n        var w = words[i];\n        for (var j = 0; j < w.length; j++) {\n            if (w.charAt(j) === separator) {\n                if (cur.length > 0) out.push(cur);\n                cur = "";\n            } else {\n                cur += w.charAt(j);\n            }\n        }\n        if (cur.length > 0) out.push(cur);\n    }\n    return out;\n}`,
        java: `public static String[] splitWordsBySeparator(String[] words, String separator) {\n    char sep = separator.charAt(0);\n    ArrayList<String> out = new ArrayList<>();\n    for (String w : words) {\n        StringBuilder cur = new StringBuilder();\n        for (int i = 0; i < w.length(); i++) {\n            if (w.charAt(i) == sep) {\n                if (cur.length() > 0) out.add(cur.toString());\n                cur.setLength(0);\n            } else {\n                cur.append(w.charAt(i));\n            }\n        }\n        if (cur.length() > 0) out.add(cur.toString());\n    }\n    return out.toArray(new String[0]);\n}`,
        cpp: `vector<string> splitWordsBySeparator(vector<string>& words, string separator) {\n    char sep = separator[0];\n    vector<string> out;\n    for (auto& w : words) {\n        string cur;\n        for (char c : w) {\n            if (c == sep) {\n                if (!cur.empty()) out.push_back(cur);\n                cur.clear();\n            } else {\n                cur += c;\n            }\n        }\n        if (!cur.empty()) out.push_back(cur);\n    }\n    return out;\n}`,
        c: `char** splitWordsBySeparator(char** words, int wordsSize, const char* separator, int* returnSize) {\n    char sep = separator[0];\n    int cap = 0;\n    for (int i = 0; i < wordsSize; i++) cap += (int) strlen(words[i]) + 1;\n    char** out = (char**) malloc((cap > 0 ? cap : 1) * sizeof(char*));\n    int m = 0;\n    for (int i = 0; i < wordsSize; i++) {\n        const char* w = words[i];\n        int len = (int) strlen(w);\n        int start = 0;\n        for (int j = 0; j <= len; j++) {\n            if (j == len || w[j] == sep) {\n                int plen = j - start;\n                if (plen > 0) {\n                    char* p = (char*) malloc(plen + 1);\n                    memcpy(p, w + start, plen);\n                    p[plen] = '\\0';\n                    out[m++] = p;\n                }\n                start = j + 1;\n            }\n        }\n    }\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static string[] SplitWordsBySeparator(string[] words, string separator)\n{\n    char sep = separator[0];\n    var out_ = new List<string>();\n    foreach (string w in words)\n    {\n        var cur = new System.Text.StringBuilder();\n        foreach (char c in w)\n        {\n            if (c == sep)\n            {\n                if (cur.Length > 0) out_.Add(cur.ToString());\n                cur.Clear();\n            }\n            else\n            {\n                cur.Append(c);\n            }\n        }\n        if (cur.Length > 0) out_.Add(cur.ToString());\n    }\n    return out_.ToArray();\n}`,
        go: `func splitWordsBySeparator(words []string, separator string) []string {\n\tsep := separator[0]\n\tout := []string{}\n\tfor _, w := range words {\n\t\tcur := []byte{}\n\t\tfor i := 0; i < len(w); i++ {\n\t\t\tif w[i] == sep {\n\t\t\t\tif len(cur) > 0 {\n\t\t\t\t\tout = append(out, string(cur))\n\t\t\t\t}\n\t\t\t\tcur = []byte{}\n\t\t\t} else {\n\t\t\t\tcur = append(cur, w[i])\n\t\t\t}\n\t\t}\n\t\tif len(cur) > 0 {\n\t\t\tout = append(out, string(cur))\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun splitWordsBySeparator(words: Array<String>, separator: String): Array<String> {\n    val sep = separator[0]\n    val out = ArrayList<String>()\n    for (w in words) {\n        val cur = StringBuilder()\n        for (c in w) {\n            if (c == sep) {\n                if (cur.isNotEmpty()) out.add(cur.toString())\n                cur.setLength(0)\n            } else {\n                cur.append(c)\n            }\n        }\n        if (cur.isNotEmpty()) out.add(cur.toString())\n    }\n    return out.toTypedArray()\n}`,
        swift: `func splitWordsBySeparator(_ words: [String], _ separator: String) -> [String] {\n    let sep = Array(separator)[0]\n    var out: [String] = []\n    for w in words {\n        var cur = ""\n        for c in w {\n            if c == sep {\n                if !cur.isEmpty { out.append(cur) }\n                cur = ""\n            } else {\n                cur.append(c)\n            }\n        }\n        if !cur.isEmpty { out.append(cur) }\n    }\n    return out\n}`,
        rust: `fn splitWordsBySeparator(words: Vec<String>, separator: String) -> Vec<String> {\n    let sep = separator.chars().next().unwrap();\n    let mut out: Vec<String> = Vec::new();\n    for w in words.iter() {\n        let mut cur = String::new();\n        for c in w.chars() {\n            if c == sep {\n                if !cur.is_empty() {\n                    out.push(cur.clone());\n                }\n                cur.clear();\n            } else {\n                cur.push(c);\n            }\n        }\n        if !cur.is_empty() {\n            out.push(cur);\n        }\n    }\n    out\n}`,
        php: `function splitWordsBySeparator($words, $separator) {\n    $out = array();\n    foreach ($words as $w) {\n        $cur = "";\n        for ($i = 0; $i < strlen($w); $i++) {\n            if ($w[$i] === $separator) {\n                if (strlen($cur) > 0) $out[] = $cur;\n                $cur = "";\n            } else {\n                $cur .= $w[$i];\n            }\n        }\n        if (strlen($cur) > 0) $out[] = $cur;\n    }\n    return $out;\n}`,
        ruby: `def splitWordsBySeparator(words, separator)\n  out = []\n  words.each do |w|\n    cur = ""\n    w.each_char do |c|\n      if c == separator\n        out << cur unless cur.empty?\n        cur = ""\n      else\n        cur << c\n      end\n    end\n    out << cur unless cur.empty?\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Permutation Difference between Two Strings (LC 3146) ────────
  (() => {
    const ref = (s: string, t: string) => {
      const pos: Record<string, number> = {};
      for (let i = 0; i < t.length; i++) pos[t[i]] = i;
      let total = 0;
      for (let i = 0; i < s.length; i++) total += Math.abs(i - pos[s[i]]);
      return total;
    };
    return {
      slug: "permutation-difference-between-two-strings",
      title: "Permutation Difference between Two Strings",
      difficulty: "EASY" as const,
      tags: ["String", "Hash Table", "LeetCode 3146", "Amazon", "Google"],
      signature: {
        funcName: "findPermutationDifference",
        params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two strings `s` and `t` where `t` is a permutation of `s`, and every character in `s` is **distinct**.\n\nThe **permutation difference** is the sum, over all characters, of the absolute difference between the character's index in `s` and its index in `t`.\n\nReturn that value.",
        [
          { in: 's = "abc", t = "bac"', out: "2", note: "a moves from 0 to 1 and b from 1 to 0; c does not move." },
          { in: 's = "abcde", t = "edbac"', out: "12" },
          { in: 's = "a", t = "a"', out: "0" },
        ],
        ["1 <= s.length <= 26", "Every character in s occurs at most once.", "t is a permutation of s."]),
      hints: [
        "Record each character's index in `t` first.",
        "Then walk `s` and accumulate `|i - pos[s[i]]|`.",
        "Because characters are distinct, a plain map from character to index is unambiguous.",
      ],
      editorial: explain({
        idea: "With distinct characters, each one has a single index in each string, so a lookup table over `t` turns the sum into one pass over `s`.",
        steps: [
          "Build `pos`, mapping each character of `t` to its index.",
          "Sweep `s`, adding `|i - pos[s[i]]|` to a running total.",
          "Return the total.",
        ],
        why: "Distinctness is what makes `pos` well defined; without it a character would have several indices and the pairing would be ambiguous.",
        time: "O(n)",
        space: "O(1) — at most 26 entries",
        pitfalls: [
          "Searching `t` for each character with `indexOf` inside the loop makes it O(n²) — harmless at n ≤ 26 but a bad habit.",
          "Forgetting the absolute value lets forward and backward moves cancel.",
        ],
      }),
      examples: [
        { input: '"abc"\n"bac"', expectedOutput: "2" },
        { input: '"abcde"\n"edbac"', expectedOutput: "12" },
        { input: '"a"\n"a"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const letters = "abcdefghijklmnopqrstuvwxyz".split("");
        shuffle(rng, letters);
        const s = letters.slice(0, n).join("");
        const t = shuffle(rng, s.split("")).join("");
        return { input: `${JSON.stringify(s)}\n${JSON.stringify(t)}`, expectedOutput: String(ref(s, t)) };
      },
      solutions: {
        python: `def findPermutationDifference(s: str, t: str) -> int:\n    pos = {c: i for i, c in enumerate(t)}\n    return sum(abs(i - pos[c]) for i, c in enumerate(s))`,
        javascript: `var findPermutationDifference = function(s, t) {\n    const pos = {};\n    for (let i = 0; i < t.length; i++) pos[t.charAt(i)] = i;\n    let total = 0;\n    for (let i = 0; i < s.length; i++) total += Math.abs(i - pos[s.charAt(i)]);\n    return total;\n};`,
        typescript: `function findPermutationDifference(s: string, t: string): number {\n    var pos: { [key: string]: number } = {};\n    for (var i = 0; i < t.length; i++) pos[t.charAt(i)] = i;\n    var total = 0;\n    for (var j = 0; j < s.length; j++) total += Math.abs(j - pos[s.charAt(j)]);\n    return total;\n}`,
        java: `public static int findPermutationDifference(String s, String t) {\n    int[] pos = new int[26];\n    for (int i = 0; i < t.length(); i++) pos[t.charAt(i) - 'a'] = i;\n    int total = 0;\n    for (int i = 0; i < s.length(); i++) total += Math.abs(i - pos[s.charAt(i) - 'a']);\n    return total;\n}`,
        cpp: `int findPermutationDifference(string s, string t) {\n    int pos[26] = { 0 };\n    for (int i = 0; i < (int) t.size(); i++) pos[t[i] - 'a'] = i;\n    int total = 0;\n    for (int i = 0; i < (int) s.size(); i++) total += abs(i - pos[s[i] - 'a']);\n    return total;\n}`,
        c: `int findPermutationDifference(const char* s, const char* t) {\n    int pos[26];\n    for (int i = 0; i < 26; i++) pos[i] = 0;\n    for (int i = 0; t[i] != '\\0'; i++) pos[t[i] - 'a'] = i;\n    int total = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        int d = i - pos[s[i] - 'a'];\n        total += d < 0 ? -d : d;\n    }\n    return total;\n}`,
        csharp: `public static int FindPermutationDifference(string s, string t)\n{\n    int[] pos = new int[26];\n    for (int i = 0; i < t.Length; i++) pos[t[i] - 'a'] = i;\n    int total = 0;\n    for (int i = 0; i < s.Length; i++) total += Math.Abs(i - pos[s[i] - 'a']);\n    return total;\n}`,
        go: `func findPermutationDifference(s string, t string) int {\n\tvar pos [26]int\n\tfor i := 0; i < len(t); i++ {\n\t\tpos[t[i]-'a'] = i\n\t}\n\ttotal := 0\n\tfor i := 0; i < len(s); i++ {\n\t\td := i - pos[s[i]-'a']\n\t\tif d < 0 {\n\t\t\td = -d\n\t\t}\n\t\ttotal += d\n\t}\n\treturn total\n}`,
        kotlin: `fun findPermutationDifference(s: String, t: String): Int {\n    val pos = IntArray(26)\n    for (i in t.indices) pos[t[i] - 'a'] = i\n    var total = 0\n    for (i in s.indices) total += Math.abs(i - pos[s[i] - 'a'])\n    return total\n}`,
        swift: `func findPermutationDifference(_ s: String, _ t: String) -> Int {\n    var pos = [Int](repeating: 0, count: 26)\n    for (i, u) in t.unicodeScalars.enumerated() {\n        pos[Int(u.value) - 97] = i\n    }\n    var total = 0\n    for (i, u) in s.unicodeScalars.enumerated() {\n        total += abs(i - pos[Int(u.value) - 97])\n    }\n    return total\n}`,
        rust: `fn findPermutationDifference(s: String, t: String) -> i32 {\n    let mut pos = [0i32; 26];\n    for (i, b) in t.bytes().enumerate() {\n        pos[(b - b'a') as usize] = i as i32;\n    }\n    let mut total = 0;\n    for (i, b) in s.bytes().enumerate() {\n        total += (i as i32 - pos[(b - b'a') as usize]).abs();\n    }\n    total\n}`,
        php: `function findPermutationDifference($s, $t) {\n    $pos = array();\n    for ($i = 0; $i < strlen($t); $i++) $pos[$t[$i]] = $i;\n    $total = 0;\n    for ($i = 0; $i < strlen($s); $i++) $total += abs($i - $pos[$s[$i]]);\n    return $total;\n}`,
        ruby: `def findPermutationDifference(s, t)\n  pos = {}\n  t.each_char.with_index { |c, i| pos[c] = i }\n  total = 0\n  s.each_char.with_index { |c, i| total += (i - pos[c]).abs }\n  total\nend`,
      },
    };
  })(),

  // ── END STRING3 ──
];
