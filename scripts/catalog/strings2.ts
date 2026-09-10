/**
 * Strings, second wave — the string questions that actually get asked at
 * Amazon, Google, Microsoft and Meta, plus the sentence/parsing drills common
 * in TCS, Infosys and Zoho rounds. Company names ride in `tags`.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, fmtStrArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

const LOWER = "abcdefghijklmnopqrstuvwxyz";

/** A random lowercase string of length in [lo, hi] over `alphabet`. */
const randStr = (rng: Rng, lo: number, hi: number, alphabet = LOWER) =>
  Array.from({ length: ri(rng, lo, hi) }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");

const WORDS = ["the", "sky", "is", "blue", "hello", "world", "code", "kata", "let", "us", "go", "now", "fast", "slow", "red", "dojo"];

/** A random space-separated sentence of `n` words from WORDS. */
const randSentence = (rng: Rng, n: number) =>
  Array.from({ length: n }, () => WORDS[ri(rng, 0, WORDS.length - 1)]).join(" ");

export const STRING2_PROBLEMS: CatalogProblem[] = [

  // ── Reverse String ──────────────────────────────────────────────
  (() => {
    const ref = (s: string) => s.split("").reverse().join("");
    return {
      slug: "reverse-string",
      title: "Reverse String",
      difficulty: "EASY" as const,
      tags: ["Two Pointers", "String", "Amazon", "Microsoft", "Apple", "TCS", "Infosys"],
      signature: { funcName: "reverseString", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Write a function that reverses a string and returns the result.\n\nThe classic form of this question hands you a character array and asks you to reverse it **in place** with O(1) extra memory; think in those terms even though this version returns a new string.",
        [
          { in: 's = "hello"', out: "olleh" },
          { in: 's = "Hannah"', out: "hannaH" },
          { in: 's = "a"', out: "a" },
        ],
        ["1 <= s.length <= 40", "s consists of printable ASCII letters."]),
      hints: [
        "Two pointers, one at each end, swapping and stepping inward.",
        "Stop when they meet; a middle character in an odd-length string swaps with itself and needs no special case.",
      ],
      examples: [
        { input: '"hello"', expectedOutput: "olleh" },
        { input: '"Hannah"', expectedOutput: "hannaH" },
        { input: '"a"', expectedOutput: "a" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 1, 40, LOWER + "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def reverseString(s: str) -> str:\n    chars = list(s)\n    left, right = 0, len(chars) - 1\n    while left < right:\n        chars[left], chars[right] = chars[right], chars[left]\n        left += 1\n        right -= 1\n    return "".join(chars)`,
        javascript: `var reverseString = function(s) {\n    const chars = s.split("");\n    let left = 0, right = chars.length - 1;\n    while (left < right) {\n        const t = chars[left];\n        chars[left] = chars[right];\n        chars[right] = t;\n        left++;\n        right--;\n    }\n    return chars.join("");\n};`,
              typescript: `function reverseString(s: string): string {\n    var chars = s.split("");\n    var left = 0;\n    var right = chars.length - 1;\n    while (left < right) {\n        var t = chars[left];\n        chars[left] = chars[right];\n        chars[right] = t;\n        left++;\n        right--;\n    }\n    return chars.join("");\n}`,
              java: `public static String reverseString(String s) {\n    char[] chars = s.toCharArray();\n    int left = 0, right = chars.length - 1;\n    while (left < right) {\n        char t = chars[left];\n        chars[left] = chars[right];\n        chars[right] = t;\n        left++;\n        right--;\n    }\n    return new String(chars);\n}`,
              cpp: `string reverseString(string s) {\n    int left = 0, right = (int) s.size() - 1;\n    while (left < right) {\n        char t = s[left];\n        s[left] = s[right];\n        s[right] = t;\n        left++;\n        right--;\n    }\n    return s;\n}`,
              c: `char* reverseString(const char* s) {\n    int n = (int) strlen(s);\n    char* out = (char*) malloc(n + 1);\n    for (int i = 0; i < n; i++) out[i] = s[n - 1 - i];\n    out[n] = '\\0';\n    return out;\n}`,
              csharp: `public static string ReverseString(string s)\n{\n    char[] chars = s.ToCharArray();\n    int left = 0, right = chars.Length - 1;\n    while (left < right)\n    {\n        char t = chars[left];\n        chars[left] = chars[right];\n        chars[right] = t;\n        left++;\n        right--;\n    }\n    return new string(chars);\n}`,
              go: `func reverseString(s string) string {\n	b := []byte(s)\n	for l, r := 0, len(b)-1; l < r; l, r = l+1, r-1 {\n		b[l], b[r] = b[r], b[l]\n	}\n	return string(b)\n}`,
              kotlin: `fun reverseString(s: String): String {\n    val chars = s.toCharArray()\n    var left = 0\n    var right = chars.size - 1\n    while (left < right) {\n        val t = chars[left]\n        chars[left] = chars[right]\n        chars[right] = t\n        left++\n        right--\n    }\n    return String(chars)\n}`,
              swift: `func reverseString(_ s: String) -> String {\n    return String(s.reversed())\n}`,
              rust: `fn reverseString(s: String) -> String {\n    let mut bytes = s.into_bytes();\n    bytes.reverse();\n    String::from_utf8(bytes).unwrap()\n}`,
              php: `function reverseString($s) {\n    return strrev($s);\n}`,
              ruby: `def reverseString(s)\n  s.reverse\nend`,
      },
    };
  })(),

  // ── Reverse Words in a String ───────────────────────────────────
  (() => {
    const ref = (s: string) => s.split(" ").filter((w) => w.length > 0).reverse().join(" ");
    return {
      slug: "reverse-words-in-a-string",
      title: "Reverse Words in a String",
      difficulty: "MEDIUM" as const,
      tags: ["Two Pointers", "String", "Amazon", "Microsoft", "Meta", "Snapchat", "Bloomberg"],
      signature: { funcName: "reverseWords", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given an input string `s`, reverse the order of the **words**.\n\nA word is a maximal run of non-space characters. The words in `s` may be separated by more than one space. The returned string must have the words in reverse order joined by a **single** space, with no leading or trailing spaces.",
        [
          { in: 's = "the sky is blue"', out: "blue is sky the" },
          { in: 's = "  hello world  "', out: "world hello", note: "The surrounding spaces are dropped." },
          { in: 's = "a good   example"', out: "example good a", note: "Runs of spaces collapse to one." },
        ],
        ["1 <= s.length <= 60", "s consists of lowercase English letters and spaces.", "There is at least one word in s."]),
      hints: [
        "Split on whitespace and discard the empty pieces that runs of spaces produce.",
        "Reverse the list of words, then join with a single space.",
        "The in-place variant reverses the whole string, then reverses each word again.",
      ],
      examples: [
        { input: '"the sky is blue"', expectedOutput: "blue is sky the" },
        { input: '"  hello world  "', expectedOutput: "world hello" },
        { input: '"a good   example"', expectedOutput: "example good a" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 7);
        const parts: string[] = [];
        for (let i = 0; i < n; i++) {
          parts.push(WORDS[ri(rng, 0, WORDS.length - 1)]);
          if (rng() < 0.3) parts.push("");
        }
        let s = parts.join(" ");
        if (rng() < 0.4) s = "  " + s;
        if (rng() < 0.4) s = s + "  ";
        s = s.slice(0, 60);
        if (s.trim().length === 0) s = "the sky";
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def reverseWords(s: str) -> str:\n    return " ".join(reversed(s.split()))`,
        javascript: `var reverseWords = function(s) {\n    const words = s.split(" ").filter(function(w) { return w.length > 0; });\n    words.reverse();\n    return words.join(" ");\n};`,
              typescript: `function reverseWords(s: string): string {\n    var words: string[] = [];\n    var pieces = s.split(" ");\n    for (var i = 0; i < pieces.length; i++) {\n        if (pieces[i].length > 0) words.push(pieces[i]);\n    }\n    words.reverse();\n    return words.join(" ");\n}`,
              java: `public static String reverseWords(String s) {\n    String[] pieces = s.split(" ");\n    List<String> words = new ArrayList<>();\n    for (String w : pieces) {\n        if (w.length() > 0) words.add(w);\n    }\n    Collections.reverse(words);\n    return String.join(" ", words);\n}`,
              cpp: `string reverseWords(string s) {\n    vector<string> words;\n    string cur = "";\n    for (char ch : s) {\n        if (ch == ' ') {\n            if (!cur.empty()) { words.push_back(cur); cur = ""; }\n        } else {\n            cur += ch;\n        }\n    }\n    if (!cur.empty()) words.push_back(cur);\n    string out = "";\n    for (int i = (int) words.size() - 1; i >= 0; i--) {\n        if (!out.empty()) out += " ";\n        out += words[i];\n    }\n    return out;\n}`,
              c: `char* reverseWords(const char* s) {\n    int n = (int) strlen(s);\n    char* out = (char*) malloc(n + 2);\n    int len = 0;\n    int end = n - 1;\n    while (end >= 0) {\n        while (end >= 0 && s[end] == ' ') end--;\n        if (end < 0) break;\n        int start = end;\n        while (start >= 0 && s[start] != ' ') start--;\n        if (len > 0) out[len++] = ' ';\n        for (int i = start + 1; i <= end; i++) out[len++] = s[i];\n        end = start;\n    }\n    out[len] = '\\0';\n    return out;\n}`,
              csharp: `public static string ReverseWords(string s)\n{\n    var words = new List<string>();\n    foreach (string w in s.Split(' '))\n    {\n        if (w.Length > 0) words.Add(w);\n    }\n    words.Reverse();\n    return string.Join(" ", words);\n}`,
              go: `func reverseWords(s string) string {\n	words := strings.Fields(s)\n	for l, r := 0, len(words)-1; l < r; l, r = l+1, r-1 {\n		words[l], words[r] = words[r], words[l]\n	}\n	return strings.Join(words, " ")\n}`,
              kotlin: `fun reverseWords(s: String): String {\n    val words = ArrayList<String>()\n    for (w in s.split(" ")) {\n        if (w.isNotEmpty()) words.add(w)\n    }\n    words.reverse()\n    return words.joinToString(" ")\n}`,
              swift: `func reverseWords(_ s: String) -> String {\n    let words = s.split(separator: " ").map { String($0) }\n    return words.reversed().joined(separator: " ")\n}`,
              rust: `fn reverseWords(s: String) -> String {\n    let words: Vec<&str> = s.split_whitespace().collect();\n    let reversed: Vec<&str> = words.into_iter().rev().collect();\n    reversed.join(" ")\n}`,
              php: `function reverseWords($s) {\n    $words = array();\n    foreach (explode(" ", $s) as $w) {\n        if (strlen($w) > 0) $words[] = $w;\n    }\n    return implode(" ", array_reverse($words));\n}`,
              ruby: `def reverseWords(s)\n  s.split(" ").reject(&:empty?).reverse.join(" ")\nend`,
      },
    };
  })(),

  // ── Reverse Words in a String III ───────────────────────────────
  (() => {
    const ref = (s: string) => s.split(" ").map((w) => w.split("").reverse().join("")).join(" ");
    return {
      slug: "reverse-words-in-a-string-iii",
      title: "Reverse Words in a String III",
      difficulty: "EASY" as const,
      tags: ["Two Pointers", "String", "Amazon", "Meta", "Zoho"],
      signature: { funcName: "reverseWords", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given a string `s`, reverse the characters of **each word** while keeping the words in their original order and preserving the single spaces between them.",
        [
          { in: 's = "Let us code"', out: "teL su edoc" },
          { in: 's = "God Ding"', out: "doG gniD" },
          { in: 's = "a"', out: "a" },
        ],
        ["1 <= s.length <= 60", "s contains printable ASCII letters and single spaces between words.", "There are no leading or trailing spaces."]),
      hints: [
        "Split on the single space, reverse each piece, join back with a space.",
        "Because the spacing is guaranteed simple, no trimming or collapsing is needed.",
      ],
      examples: [
        { input: '"Let us code"', expectedOutput: "teL su edoc" },
        { input: '"God Ding"', expectedOutput: "doG gniD" },
        { input: '"a"', expectedOutput: "a" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 7);
        const s = randSentence(rng, n).slice(0, 60).replace(/\s+$/, "");
        const safe = s.length === 0 ? "code" : s;
        return { input: `"${safe}"`, expectedOutput: ref(safe) };
      },
      solutions: {
        python: `def reverseWords(s: str) -> str:\n    return " ".join(word[::-1] for word in s.split(" "))`,
        javascript: `var reverseWords = function(s) {\n    return s.split(" ").map(function(w) {\n        return w.split("").reverse().join("");\n    }).join(" ");\n};`,
              typescript: `function reverseWords(s: string): string {\n    var pieces = s.split(" ");\n    var out: string[] = [];\n    for (var i = 0; i < pieces.length; i++) {\n        out.push(pieces[i].split("").reverse().join(""));\n    }\n    return out.join(" ");\n}`,
              java: `public static String reverseWords(String s) {\n    String[] pieces = s.split(" ", -1);\n    StringBuilder out = new StringBuilder();\n    for (int i = 0; i < pieces.length; i++) {\n        if (i > 0) out.append(' ');\n        out.append(new StringBuilder(pieces[i]).reverse());\n    }\n    return out.toString();\n}`,
              cpp: `string reverseWords(string s) {\n    int i = 0;\n    int n = (int) s.size();\n    while (i < n) {\n        int j = i;\n        while (j < n && s[j] != ' ') j++;\n        reverse(s.begin() + i, s.begin() + j);\n        i = j + 1;\n    }\n    return s;\n}`,
              c: `char* reverseWords(const char* s) {\n    int n = (int) strlen(s);\n    char* out = (char*) malloc(n + 1);\n    int i = 0;\n    while (i < n) {\n        int j = i;\n        while (j < n && s[j] != ' ') j++;\n        for (int k = 0; k < j - i; k++) out[i + k] = s[j - 1 - k];\n        if (j < n) out[j] = ' ';\n        i = j + 1;\n    }\n    out[n] = '\\0';\n    return out;\n}`,
              csharp: `public static string ReverseWords(string s)\n{\n    string[] pieces = s.Split(' ');\n    var out_ = new List<string>();\n    foreach (string w in pieces)\n    {\n        char[] chars = w.ToCharArray();\n        Array.Reverse(chars);\n        out_.Add(new string(chars));\n    }\n    return string.Join(" ", out_);\n}`,
              go: `func reverseWords(s string) string {\n	b := []byte(s)\n	i := 0\n	for i < len(b) {\n		j := i\n		for j < len(b) && b[j] != ' ' {\n			j++\n		}\n		for l, r := i, j-1; l < r; l, r = l+1, r-1 {\n			b[l], b[r] = b[r], b[l]\n		}\n		i = j + 1\n	}\n	return string(b)\n}`,
              kotlin: `fun reverseWords(s: String): String {\n    return s.split(" ").joinToString(" ") { it.reversed() }\n}`,
              swift: `func reverseWords(_ s: String) -> String {\n    let pieces = s.components(separatedBy: " ")\n    return pieces.map { String($0.reversed()) }.joined(separator: " ")\n}`,
              rust: `fn reverseWords(s: String) -> String {\n    let pieces: Vec<String> = s\n        .split(' ')\n        .map(|w| w.chars().rev().collect::<String>())\n        .collect();\n    pieces.join(" ")\n}`,
              php: `function reverseWords($s) {\n    $pieces = explode(" ", $s);\n    $out = array();\n    foreach ($pieces as $w) {\n        $out[] = strrev($w);\n    }\n    return implode(" ", $out);\n}`,
              ruby: `def reverseWords(s)\n  s.split(/ /).map(&:reverse).join(" ")\nend`,
      },
    };
  })(),

  // ── Reverse Vowels of a String ──────────────────────────────────
  (() => {
    const isVowel = (c: string) => "aeiouAEIOU".indexOf(c) >= 0;
    const ref = (s: string) => {
      const chars = s.split("");
      let l = 0, r = chars.length - 1;
      while (l < r) {
        while (l < r && !isVowel(chars[l])) l++;
        while (l < r && !isVowel(chars[r])) r--;
        if (l < r) {
          const t = chars[l]; chars[l] = chars[r]; chars[r] = t;
          l++; r--;
        }
      }
      return chars.join("");
    };
    return {
      slug: "reverse-vowels-of-a-string",
      title: "Reverse Vowels of a String",
      difficulty: "EASY" as const,
      tags: ["Two Pointers", "String", "Amazon", "Google", "Adobe"],
      signature: { funcName: "reverseVowels", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given a string `s`, reverse only the **vowels** in it and return the result. Every other character stays exactly where it is.\n\nThe vowels are `a`, `e`, `i`, `o` and `u`, in either case.",
        [
          { in: 's = "hello"', out: "holle", note: "The vowels e and o swap places." },
          { in: 's = "leetcode"', out: "leotcede" },
          { in: 's = "sky"', out: "sky", note: "No vowels, so nothing moves." },
        ],
        ["1 <= s.length <= 40", "s consists of English letters."]),
      hints: [
        "Two pointers walking inward, each skipping over consonants until it lands on a vowel.",
        "Swap the two vowels, then step both pointers past them.",
        "Stop as soon as the pointers cross.",
      ],
      examples: [
        { input: '"hello"', expectedOutput: "holle" },
        { input: '"leetcode"', expectedOutput: "leotcede" },
        { input: '"sky"', expectedOutput: "sky" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 1, 40, LOWER + "AEIOUXYZ");
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def reverseVowels(s: str) -> str:\n    vowels = set("aeiouAEIOU")\n    chars = list(s)\n    left, right = 0, len(chars) - 1\n    while left < right:\n        while left < right and chars[left] not in vowels:\n            left += 1\n        while left < right and chars[right] not in vowels:\n            right -= 1\n        if left < right:\n            chars[left], chars[right] = chars[right], chars[left]\n            left += 1\n            right -= 1\n    return "".join(chars)`,
        javascript: `var reverseVowels = function(s) {\n    const isVowel = function(c) { return "aeiouAEIOU".indexOf(c) >= 0; };\n    const chars = s.split("");\n    let left = 0, right = chars.length - 1;\n    while (left < right) {\n        while (left < right && !isVowel(chars[left])) left++;\n        while (left < right && !isVowel(chars[right])) right--;\n        if (left < right) {\n            const t = chars[left];\n            chars[left] = chars[right];\n            chars[right] = t;\n            left++;\n            right--;\n        }\n    }\n    return chars.join("");\n};`,
              typescript: `function reverseVowels(s: string): string {\n    var vowels = "aeiouAEIOU";\n    var chars = s.split("");\n    var left = 0;\n    var right = chars.length - 1;\n    while (left < right) {\n        while (left < right && vowels.indexOf(chars[left]) < 0) left++;\n        while (left < right && vowels.indexOf(chars[right]) < 0) right--;\n        if (left < right) {\n            var t = chars[left];\n            chars[left] = chars[right];\n            chars[right] = t;\n            left++;\n            right--;\n        }\n    }\n    return chars.join("");\n}`,
              java: `public static String reverseVowels(String s) {\n    String vowels = "aeiouAEIOU";\n    char[] chars = s.toCharArray();\n    int left = 0, right = chars.length - 1;\n    while (left < right) {\n        while (left < right && vowels.indexOf(chars[left]) < 0) left++;\n        while (left < right && vowels.indexOf(chars[right]) < 0) right--;\n        if (left < right) {\n            char t = chars[left];\n            chars[left] = chars[right];\n            chars[right] = t;\n            left++;\n            right--;\n        }\n    }\n    return new String(chars);\n}`,
              cpp: `string reverseVowels(string s) {\n    string vowels = "aeiouAEIOU";\n    int left = 0, right = (int) s.size() - 1;\n    while (left < right) {\n        while (left < right && vowels.find(s[left]) == string::npos) left++;\n        while (left < right && vowels.find(s[right]) == string::npos) right--;\n        if (left < right) {\n            char t = s[left];\n            s[left] = s[right];\n            s[right] = t;\n            left++;\n            right--;\n        }\n    }\n    return s;\n}`,
              c: `static bool isVowelChar(char c) {\n    return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u'\n        || c == 'A' || c == 'E' || c == 'I' || c == 'O' || c == 'U';\n}\n\nchar* reverseVowels(const char* s) {\n    int n = (int) strlen(s);\n    char* out = (char*) malloc(n + 1);\n    for (int i = 0; i < n; i++) out[i] = s[i];\n    out[n] = '\\0';\n    int left = 0, right = n - 1;\n    while (left < right) {\n        while (left < right && !isVowelChar(out[left])) left++;\n        while (left < right && !isVowelChar(out[right])) right--;\n        if (left < right) {\n            char t = out[left];\n            out[left] = out[right];\n            out[right] = t;\n            left++;\n            right--;\n        }\n    }\n    return out;\n}`,
              csharp: `public static string ReverseVowels(string s)\n{\n    string vowels = "aeiouAEIOU";\n    char[] chars = s.ToCharArray();\n    int left = 0, right = chars.Length - 1;\n    while (left < right)\n    {\n        while (left < right && vowels.IndexOf(chars[left]) < 0) left++;\n        while (left < right && vowels.IndexOf(chars[right]) < 0) right--;\n        if (left < right)\n        {\n            char t = chars[left];\n            chars[left] = chars[right];\n            chars[right] = t;\n            left++;\n            right--;\n        }\n    }\n    return new string(chars);\n}`,
              go: `func reverseVowels(s string) string {\n	isVowel := func(c byte) bool {\n		return strings.IndexByte("aeiouAEIOU", c) >= 0\n	}\n	b := []byte(s)\n	left, right := 0, len(b)-1\n	for left < right {\n		for left < right && !isVowel(b[left]) {\n			left++\n		}\n		for left < right && !isVowel(b[right]) {\n			right--\n		}\n		if left < right {\n			b[left], b[right] = b[right], b[left]\n			left++\n			right--\n		}\n	}\n	return string(b)\n}`,
              kotlin: `fun reverseVowels(s: String): String {\n    val vowels = "aeiouAEIOU"\n    val chars = s.toCharArray()\n    var left = 0\n    var right = chars.size - 1\n    while (left < right) {\n        while (left < right && vowels.indexOf(chars[left]) < 0) left++\n        while (left < right && vowels.indexOf(chars[right]) < 0) right--\n        if (left < right) {\n            val t = chars[left]\n            chars[left] = chars[right]\n            chars[right] = t\n            left++\n            right--\n        }\n    }\n    return String(chars)\n}`,
              swift: `func reverseVowels(_ s: String) -> String {\n    let vowels = Set("aeiouAEIOU")\n    var chars = Array(s)\n    var left = 0\n    var right = chars.count - 1\n    while left < right {\n        while left < right && !vowels.contains(chars[left]) { left += 1 }\n        while left < right && !vowels.contains(chars[right]) { right -= 1 }\n        if left < right {\n            chars.swapAt(left, right)\n            left += 1\n            right -= 1\n        }\n    }\n    return String(chars)\n}`,
              rust: `fn reverseVowels(s: String) -> String {\n    fn is_vowel(c: u8) -> bool {\n        b"aeiouAEIOU".contains(&c)\n    }\n    let mut bytes = s.into_bytes();\n    if bytes.is_empty() {\n        return String::new();\n    }\n    let mut left = 0usize;\n    let mut right = bytes.len() - 1;\n    while left < right {\n        while left < right && !is_vowel(bytes[left]) {\n            left += 1;\n        }\n        while left < right && !is_vowel(bytes[right]) {\n            right -= 1;\n        }\n        if left < right {\n            bytes.swap(left, right);\n            left += 1;\n            right -= 1;\n        }\n    }\n    String::from_utf8(bytes).unwrap()\n}`,
              php: `function reverseVowels($s) {\n    $vowels = "aeiouAEIOU";\n    $chars = str_split($s);\n    $left = 0;\n    $right = count($chars) - 1;\n    while ($left < $right) {\n        while ($left < $right && strpos($vowels, $chars[$left]) === false) $left++;\n        while ($left < $right && strpos($vowels, $chars[$right]) === false) $right--;\n        if ($left < $right) {\n            $t = $chars[$left];\n            $chars[$left] = $chars[$right];\n            $chars[$right] = $t;\n            $left++;\n            $right--;\n        }\n    }\n    return implode("", $chars);\n}`,
              ruby: `def reverseVowels(s)\n  vowels = "aeiouAEIOU"\n  chars = s.chars\n  left = 0\n  right = chars.length - 1\n  while left < right\n    left += 1 while left < right && !vowels.include?(chars[left])\n    right -= 1 while left < right && !vowels.include?(chars[right])\n    if left < right\n      chars[left], chars[right] = chars[right], chars[left]\n      left += 1\n      right -= 1\n    end\n  end\n  chars.join\nend`,
      },
    };
  })(),

  // ── First Unique Character in a String ──────────────────────────
  (() => {
    const ref = (s: string) => {
      const count = new Array(26).fill(0);
      for (let i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;
      for (let i = 0; i < s.length; i++) if (count[s.charCodeAt(i) - 97] === 1) return i;
      return -1;
    };
    return {
      slug: "first-unique-character-in-a-string",
      title: "First Unique Character in a String",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Queue", "Counting", "Amazon", "Microsoft", "Bloomberg", "Goldman Sachs"],
      signature: { funcName: "firstUniqChar", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s`, find the first character that does not repeat anywhere in the string and return its index. If there is no such character, return `-1`.",
        [
          { in: 's = "leetcode"', out: "0", note: "l occurs once and is first." },
          { in: 's = "loveleetcode"', out: "2", note: "v is the first character with a count of one." },
          { in: 's = "aabb"', out: "-1" },
        ],
        ["1 <= s.length <= 40", "s consists of lowercase English letters."]),
      hints: [
        "You cannot know a character is unique until you have seen the whole string — so make two passes.",
        "First pass: tally the 26 letter counts. Second pass: return the index of the first letter whose tally is 1.",
        "Scanning in index order during the second pass is what makes it the *first* such character.",
      ],
      examples: [
        { input: '"leetcode"', expectedOutput: "0" },
        { input: '"loveleetcode"', expectedOutput: "2" },
        { input: '"aabb"', expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.5 ? "abcde" : LOWER;
        const s = randStr(rng, 1, 40, alphabet);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def firstUniqChar(s: str) -> int:\n    count = [0] * 26\n    for ch in s:\n        count[ord(ch) - 97] += 1\n    for i, ch in enumerate(s):\n        if count[ord(ch) - 97] == 1:\n            return i\n    return -1`,
        javascript: `var firstUniqChar = function(s) {\n    const count = new Array(26).fill(0);\n    for (let i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;\n    for (let i = 0; i < s.length; i++) {\n        if (count[s.charCodeAt(i) - 97] === 1) return i;\n    }\n    return -1;\n};`,
              typescript: `function firstUniqChar(s: string): number {\n    var count: number[] = [];\n    for (var k = 0; k < 26; k++) count.push(0);\n    for (var i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;\n    for (var j = 0; j < s.length; j++) {\n        if (count[s.charCodeAt(j) - 97] === 1) return j;\n    }\n    return -1;\n}`,
              java: `public static int firstUniqChar(String s) {\n    int[] count = new int[26];\n    for (int i = 0; i < s.length(); i++) count[s.charAt(i) - 'a']++;\n    for (int i = 0; i < s.length(); i++) {\n        if (count[s.charAt(i) - 'a'] == 1) return i;\n    }\n    return -1;\n}`,
              cpp: `int firstUniqChar(string s) {\n    int count[26] = {0};\n    for (char ch : s) count[ch - 'a']++;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (count[s[i] - 'a'] == 1) return i;\n    }\n    return -1;\n}`,
              c: `int firstUniqChar(const char* s) {\n    int count[26] = {0};\n    int n = (int) strlen(s);\n    for (int i = 0; i < n; i++) count[s[i] - 'a']++;\n    for (int i = 0; i < n; i++) {\n        if (count[s[i] - 'a'] == 1) return i;\n    }\n    return -1;\n}`,
              csharp: `public static int FirstUniqChar(string s)\n{\n    int[] count = new int[26];\n    for (int i = 0; i < s.Length; i++) count[s[i] - 'a']++;\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (count[s[i] - 'a'] == 1) return i;\n    }\n    return -1;\n}`,
              go: `func firstUniqChar(s string) int {\n	var count [26]int\n	for i := 0; i < len(s); i++ {\n		count[s[i]-'a']++\n	}\n	for i := 0; i < len(s); i++ {\n		if count[s[i]-'a'] == 1 {\n			return i\n		}\n	}\n	return -1\n}`,
              kotlin: `fun firstUniqChar(s: String): Int {\n    val count = IntArray(26)\n    for (ch in s) count[ch - 'a']++\n    for (i in s.indices) {\n        if (count[s[i] - 'a'] == 1) return i\n    }\n    return -1\n}`,
              swift: `func firstUniqChar(_ s: String) -> Int {\n    let bytes = Array(s.utf8)\n    var count = [Int](repeating: 0, count: 26)\n    for b in bytes { count[Int(b) - 97] += 1 }\n    for i in 0..<bytes.count {\n        if count[Int(bytes[i]) - 97] == 1 { return i }\n    }\n    return -1\n}`,
              rust: `fn firstUniqChar(s: String) -> i32 {\n    let bytes = s.as_bytes();\n    let mut count = [0i32; 26];\n    for b in bytes.iter() {\n        count[(*b - b'a') as usize] += 1;\n    }\n    for i in 0..bytes.len() {\n        if count[(bytes[i] - b'a') as usize] == 1 {\n            return i as i32;\n        }\n    }\n    -1\n}`,
              php: `function firstUniqChar($s) {\n    $count = array_fill(0, 26, 0);\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) $count[ord($s[$i]) - 97]++;\n    for ($i = 0; $i < $n; $i++) {\n        if ($count[ord($s[$i]) - 97] === 1) return $i;\n    }\n    return -1;\n}`,
              ruby: `def firstUniqChar(s)\n  count = Array.new(26, 0)\n  s.each_char { |ch| count[ch.ord - 97] += 1 }\n  s.each_char.with_index do |ch, i|\n    return i if count[ch.ord - 97] == 1\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Ransom Note ─────────────────────────────────────────────────
  (() => {
    const ref = (note: string, magazine: string) => {
      const count = new Array(26).fill(0);
      for (let i = 0; i < magazine.length; i++) count[magazine.charCodeAt(i) - 97]++;
      for (let i = 0; i < note.length; i++) {
        const c = note.charCodeAt(i) - 97;
        if (--count[c] < 0) return false;
      }
      return true;
    };
    return {
      slug: "ransom-note",
      title: "Ransom Note",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon", "Apple", "Bloomberg", "Infosys"],
      signature: { funcName: "canConstruct", params: [{ name: "ransomNote", type: "string" as const }, { name: "magazine", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given two strings `ransomNote` and `magazine`, return `true` if `ransomNote` can be built using the letters of `magazine`.\n\nEach letter of `magazine` may be used **at most once**.",
        [
          { in: 'ransomNote = "a", magazine = "b"', out: "false" },
          { in: 'ransomNote = "aa", magazine = "ab"', out: "false", note: "The magazine has only one a." },
          { in: 'ransomNote = "aa", magazine = "aab"', out: "true" },
        ],
        ["1 <= ransomNote.length, magazine.length <= 40", "Both consist of lowercase English letters."]),
      hints: [
        "Count what the magazine supplies, then spend from those counts as you read the note.",
        "The moment a count would go negative, the magazine cannot cover the note.",
      ],
      examples: [
        { input: '"a"\n"b"', expectedOutput: "false" },
        { input: '"aa"\n"ab"', expectedOutput: "false" },
        { input: '"aa"\n"aab"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcde";
        const magazine = randStr(rng, 1, 40, alphabet);
        let note: string;
        if (rng() < 0.5) {
          const chars = shuffle(rng, magazine.split(""));
          note = chars.slice(0, ri(rng, 1, chars.length)).join("");
        } else {
          note = randStr(rng, 1, 20, alphabet);
        }
        return { input: `"${note}"\n"${magazine}"`, expectedOutput: bool(ref(note, magazine)) };
      },
      solutions: {
        python: `def canConstruct(ransomNote: str, magazine: str) -> bool:\n    count = [0] * 26\n    for ch in magazine:\n        count[ord(ch) - 97] += 1\n    for ch in ransomNote:\n        idx = ord(ch) - 97\n        count[idx] -= 1\n        if count[idx] < 0:\n            return False\n    return True`,
        javascript: `var canConstruct = function(ransomNote, magazine) {\n    const count = new Array(26).fill(0);\n    for (let i = 0; i < magazine.length; i++) count[magazine.charCodeAt(i) - 97]++;\n    for (let i = 0; i < ransomNote.length; i++) {\n        const idx = ransomNote.charCodeAt(i) - 97;\n        count[idx]--;\n        if (count[idx] < 0) return false;\n    }\n    return true;\n};`,
              typescript: `function canConstruct(ransomNote: string, magazine: string): boolean {\n    var count: number[] = [];\n    for (var k = 0; k < 26; k++) count.push(0);\n    for (var i = 0; i < magazine.length; i++) count[magazine.charCodeAt(i) - 97]++;\n    for (var j = 0; j < ransomNote.length; j++) {\n        var idx = ransomNote.charCodeAt(j) - 97;\n        count[idx]--;\n        if (count[idx] < 0) return false;\n    }\n    return true;\n}`,
              java: `public static boolean canConstruct(String ransomNote, String magazine) {\n    int[] count = new int[26];\n    for (int i = 0; i < magazine.length(); i++) count[magazine.charAt(i) - 'a']++;\n    for (int i = 0; i < ransomNote.length(); i++) {\n        int idx = ransomNote.charAt(i) - 'a';\n        count[idx]--;\n        if (count[idx] < 0) return false;\n    }\n    return true;\n}`,
              cpp: `bool canConstruct(string ransomNote, string magazine) {\n    int count[26] = {0};\n    for (char ch : magazine) count[ch - 'a']++;\n    for (char ch : ransomNote) {\n        int idx = ch - 'a';\n        count[idx]--;\n        if (count[idx] < 0) return false;\n    }\n    return true;\n}`,
              c: `bool canConstruct(const char* ransomNote, const char* magazine) {\n    int count[26] = {0};\n    for (int i = 0; magazine[i] != '\\0'; i++) count[magazine[i] - 'a']++;\n    for (int i = 0; ransomNote[i] != '\\0'; i++) {\n        int idx = ransomNote[i] - 'a';\n        count[idx]--;\n        if (count[idx] < 0) return false;\n    }\n    return true;\n}`,
              csharp: `public static bool CanConstruct(string ransomNote, string magazine)\n{\n    int[] count = new int[26];\n    for (int i = 0; i < magazine.Length; i++) count[magazine[i] - 'a']++;\n    for (int i = 0; i < ransomNote.Length; i++)\n    {\n        int idx = ransomNote[i] - 'a';\n        count[idx]--;\n        if (count[idx] < 0) return false;\n    }\n    return true;\n}`,
              go: `func canConstruct(ransomNote string, magazine string) bool {\n	var count [26]int\n	for i := 0; i < len(magazine); i++ {\n		count[magazine[i]-'a']++\n	}\n	for i := 0; i < len(ransomNote); i++ {\n		idx := ransomNote[i] - 'a'\n		count[idx]--\n		if count[idx] < 0 {\n			return false\n		}\n	}\n	return true\n}`,
              kotlin: `fun canConstruct(ransomNote: String, magazine: String): Boolean {\n    val count = IntArray(26)\n    for (ch in magazine) count[ch - 'a']++\n    for (ch in ransomNote) {\n        val idx = ch - 'a'\n        count[idx]--\n        if (count[idx] < 0) return false\n    }\n    return true\n}`,
              swift: `func canConstruct(_ ransomNote: String, _ magazine: String) -> Bool {\n    var count = [Int](repeating: 0, count: 26)\n    for b in Array(magazine.utf8) { count[Int(b) - 97] += 1 }\n    for b in Array(ransomNote.utf8) {\n        let idx = Int(b) - 97\n        count[idx] -= 1\n        if count[idx] < 0 { return false }\n    }\n    return true\n}`,
              rust: `fn canConstruct(ransomNote: String, magazine: String) -> bool {\n    let mut count = [0i32; 26];\n    for b in magazine.as_bytes().iter() {\n        count[(*b - b'a') as usize] += 1;\n    }\n    for b in ransomNote.as_bytes().iter() {\n        let idx = (*b - b'a') as usize;\n        count[idx] -= 1;\n        if count[idx] < 0 {\n            return false;\n        }\n    }\n    true\n}`,
              php: `function canConstruct($ransomNote, $magazine) {\n    $count = array_fill(0, 26, 0);\n    for ($i = 0; $i < strlen($magazine); $i++) $count[ord($magazine[$i]) - 97]++;\n    for ($i = 0; $i < strlen($ransomNote); $i++) {\n        $idx = ord($ransomNote[$i]) - 97;\n        $count[$idx]--;\n        if ($count[$idx] < 0) return false;\n    }\n    return true;\n}`,
              ruby: `def canConstruct(ransomNote, magazine)\n  count = Array.new(26, 0)\n  magazine.each_char { |ch| count[ch.ord - 97] += 1 }\n  ransomNote.each_char do |ch|\n    idx = ch.ord - 97\n    count[idx] -= 1\n    return false if count[idx] < 0\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Length of Last Word ─────────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      let i = s.length - 1;
      while (i >= 0 && s[i] === " ") i--;
      let len = 0;
      while (i >= 0 && s[i] !== " ") { len++; i--; }
      return len;
    };
    return {
      slug: "length-of-last-word",
      title: "Length of Last Word",
      difficulty: "EASY" as const,
      tags: ["String", "Amazon", "Microsoft", "TCS", "Infosys", "Accenture"],
      signature: { funcName: "lengthOfLastWord", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s` consisting of words and spaces, return the length of the **last** word.\n\nA word is a maximal run of non-space characters.",
        [
          { in: 's = "Hello World"', out: "5" },
          { in: 's = "   fly me   to   the moon  "', out: "4", note: "The last word is moon, and the trailing spaces are ignored." },
          { in: 's = "a"', out: "1" },
        ],
        ["1 <= s.length <= 60", "s consists of English letters and spaces.", "There is at least one word in s."]),
      hints: [
        "Work from the right rather than splitting the whole string.",
        "First skip any trailing spaces, then count characters until the next space or the start of the string.",
      ],
      examples: [
        { input: '"Hello World"', expectedOutput: "5" },
        { input: '"   fly me   to   the moon  "', expectedOutput: "4" },
        { input: '"a"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const parts: string[] = [];
        const n = ri(rng, 1, 6);
        for (let i = 0; i < n; i++) {
          parts.push(WORDS[ri(rng, 0, WORDS.length - 1)]);
          if (rng() < 0.3) parts.push("");
        }
        let s = parts.join(" ");
        if (rng() < 0.4) s = "  " + s;
        if (rng() < 0.5) s = s + "   ";
        s = s.slice(0, 60);
        if (s.trim().length === 0) s = "moon";
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def lengthOfLastWord(s: str) -> int:\n    i = len(s) - 1\n    while i >= 0 and s[i] == " ":\n        i -= 1\n    length = 0\n    while i >= 0 and s[i] != " ":\n        length += 1\n        i -= 1\n    return length`,
        javascript: `var lengthOfLastWord = function(s) {\n    let i = s.length - 1;\n    while (i >= 0 && s[i] === " ") i--;\n    let len = 0;\n    while (i >= 0 && s[i] !== " ") {\n        len++;\n        i--;\n    }\n    return len;\n};`,
              typescript: `function lengthOfLastWord(s: string): number {\n    var i = s.length - 1;\n    while (i >= 0 && s.charAt(i) === " ") i--;\n    var len = 0;\n    while (i >= 0 && s.charAt(i) !== " ") {\n        len++;\n        i--;\n    }\n    return len;\n}`,
              java: `public static int lengthOfLastWord(String s) {\n    int i = s.length() - 1;\n    while (i >= 0 && s.charAt(i) == ' ') i--;\n    int len = 0;\n    while (i >= 0 && s.charAt(i) != ' ') {\n        len++;\n        i--;\n    }\n    return len;\n}`,
              cpp: `int lengthOfLastWord(string s) {\n    int i = (int) s.size() - 1;\n    while (i >= 0 && s[i] == ' ') i--;\n    int len = 0;\n    while (i >= 0 && s[i] != ' ') {\n        len++;\n        i--;\n    }\n    return len;\n}`,
              c: `int lengthOfLastWord(const char* s) {\n    int i = (int) strlen(s) - 1;\n    while (i >= 0 && s[i] == ' ') i--;\n    int len = 0;\n    while (i >= 0 && s[i] != ' ') {\n        len++;\n        i--;\n    }\n    return len;\n}`,
              csharp: `public static int LengthOfLastWord(string s)\n{\n    int i = s.Length - 1;\n    while (i >= 0 && s[i] == ' ') i--;\n    int len = 0;\n    while (i >= 0 && s[i] != ' ')\n    {\n        len++;\n        i--;\n    }\n    return len;\n}`,
              go: `func lengthOfLastWord(s string) int {\n	i := len(s) - 1\n	for i >= 0 && s[i] == ' ' {\n		i--\n	}\n	length := 0\n	for i >= 0 && s[i] != ' ' {\n		length++\n		i--\n	}\n	return length\n}`,
              kotlin: `fun lengthOfLastWord(s: String): Int {\n    var i = s.length - 1\n    while (i >= 0 && s[i] == ' ') i--\n    var len = 0\n    while (i >= 0 && s[i] != ' ') {\n        len++\n        i--\n    }\n    return len\n}`,
              swift: `func lengthOfLastWord(_ s: String) -> Int {\n    let chars = Array(s)\n    var i = chars.count - 1\n    while i >= 0 && chars[i] == " " { i -= 1 }\n    var len = 0\n    while i >= 0 && chars[i] != " " {\n        len += 1\n        i -= 1\n    }\n    return len\n}`,
              rust: `fn lengthOfLastWord(s: String) -> i32 {\n    let bytes = s.as_bytes();\n    let mut i = bytes.len() as i32 - 1;\n    while i >= 0 && bytes[i as usize] == b' ' {\n        i -= 1;\n    }\n    let mut len = 0;\n    while i >= 0 && bytes[i as usize] != b' ' {\n        len += 1;\n        i -= 1;\n    }\n    len\n}`,
              php: `function lengthOfLastWord($s) {\n    $i = strlen($s) - 1;\n    while ($i >= 0 && $s[$i] === " ") $i--;\n    $len = 0;\n    while ($i >= 0 && $s[$i] !== " ") {\n        $len++;\n        $i--;\n    }\n    return $len;\n}`,
              ruby: `def lengthOfLastWord(s)\n  i = s.length - 1\n  i -= 1 while i >= 0 && s[i] == " "\n  len = 0\n  while i >= 0 && s[i] != " "\n    len += 1\n    i -= 1\n  end\n  len\nend`,
      },
    };
  })(),

  // ── Detect Capital ──────────────────────────────────────────────
  (() => {
    const ref = (word: string) => {
      const upper = word.split("").filter((c) => c >= "A" && c <= "Z").length;
      if (upper === word.length) return true;
      if (upper === 0) return true;
      return upper === 1 && word[0] >= "A" && word[0] <= "Z";
    };
    return {
      slug: "detect-capital",
      title: "Detect Capital",
      difficulty: "EASY" as const,
      tags: ["String", "Amazon", "Google", "Cognizant"],
      signature: { funcName: "detectCapitalUse", params: [{ name: "word", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "We define the usage of capitals in a word to be right when one of these holds:\n\n1. All letters are capitals, like `\"USA\"`.\n2. No letter is a capital, like `\"leetcode\"`.\n3. Only the first letter is a capital, like `\"Google\"`.\n\nGiven a string `word`, return `true` if the capitals are used correctly.",
        [
          { in: 'word = "USA"', out: "true" },
          { in: 'word = "FlaG"', out: "false" },
          { in: 'word = "leetcode"', out: "true" },
        ],
        ["1 <= word.length <= 40", "word consists of upper and lowercase English letters."]),
      hints: [
        "Count the capitals in one pass — the three legal patterns are distinguishable from that count alone.",
        "All capitals means the count equals the length; no capitals means the count is zero.",
        "Exactly one capital is legal only when it is at index 0.",
      ],
      examples: [
        { input: '"USA"', expectedOutput: "true" },
        { input: '"FlaG"', expectedOutput: "false" },
        { input: '"leetcode"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        let word: string;
        const roll = rng();
        if (roll < 0.25) word = randStr(rng, n, n, "ABCDEFGHIJKLMNOPQRSTUVWXYZ");
        else if (roll < 0.5) word = randStr(rng, n, n, LOWER);
        else if (roll < 0.7) word = randStr(rng, 1, 1, "ABCDEFGHIJKLMNOPQRSTUVWXYZ") + randStr(rng, n, n, LOWER);
        else word = randStr(rng, n, n, LOWER + "ABCDEFGHIJ");
        return { input: `"${word}"`, expectedOutput: bool(ref(word)) };
      },
      solutions: {
        python: `def detectCapitalUse(word: str) -> bool:\n    upper = sum(1 for ch in word if ch.isupper())\n    if upper == len(word) or upper == 0:\n        return True\n    return upper == 1 and word[0].isupper()`,
        javascript: `var detectCapitalUse = function(word) {\n    let upper = 0;\n    for (let i = 0; i < word.length; i++) {\n        const c = word[i];\n        if (c >= "A" && c <= "Z") upper++;\n    }\n    if (upper === word.length || upper === 0) return true;\n    return upper === 1 && word[0] >= "A" && word[0] <= "Z";\n};`,
              typescript: `function detectCapitalUse(word: string): boolean {\n    var upper = 0;\n    for (var i = 0; i < word.length; i++) {\n        var c = word.charAt(i);\n        if (c >= "A" && c <= "Z") upper++;\n    }\n    if (upper === word.length || upper === 0) return true;\n    return upper === 1 && word.charAt(0) >= "A" && word.charAt(0) <= "Z";\n}`,
              java: `public static boolean detectCapitalUse(String word) {\n    int upper = 0;\n    for (int i = 0; i < word.length(); i++) {\n        if (Character.isUpperCase(word.charAt(i))) upper++;\n    }\n    if (upper == word.length() || upper == 0) return true;\n    return upper == 1 && Character.isUpperCase(word.charAt(0));\n}`,
              cpp: `bool detectCapitalUse(string word) {\n    int upper = 0;\n    for (char ch : word) {\n        if (ch >= 'A' && ch <= 'Z') upper++;\n    }\n    if (upper == (int) word.size() || upper == 0) return true;\n    return upper == 1 && word[0] >= 'A' && word[0] <= 'Z';\n}`,
              c: `bool detectCapitalUse(const char* word) {\n    int n = (int) strlen(word);\n    int upper = 0;\n    for (int i = 0; i < n; i++) {\n        if (word[i] >= 'A' && word[i] <= 'Z') upper++;\n    }\n    if (upper == n || upper == 0) return true;\n    return upper == 1 && word[0] >= 'A' && word[0] <= 'Z';\n}`,
              csharp: `public static bool DetectCapitalUse(string word)\n{\n    int upper = 0;\n    foreach (char ch in word)\n    {\n        if (ch >= 'A' && ch <= 'Z') upper++;\n    }\n    if (upper == word.Length || upper == 0) return true;\n    return upper == 1 && word[0] >= 'A' && word[0] <= 'Z';\n}`,
              go: `func detectCapitalUse(word string) bool {\n	upper := 0\n	for i := 0; i < len(word); i++ {\n		if word[i] >= 'A' && word[i] <= 'Z' {\n			upper++\n		}\n	}\n	if upper == len(word) || upper == 0 {\n		return true\n	}\n	return upper == 1 && word[0] >= 'A' && word[0] <= 'Z'\n}`,
              kotlin: `fun detectCapitalUse(word: String): Boolean {\n    var upper = 0\n    for (ch in word) {\n        if (ch in 'A'..'Z') upper++\n    }\n    if (upper == word.length || upper == 0) return true\n    return upper == 1 && word[0] in 'A'..'Z'\n}`,
              swift: `func detectCapitalUse(_ word: String) -> Bool {\n    let bytes = Array(word.utf8)\n    var upper = 0\n    for b in bytes {\n        if b >= 65 && b <= 90 { upper += 1 }\n    }\n    if upper == bytes.count || upper == 0 { return true }\n    return upper == 1 && bytes[0] >= 65 && bytes[0] <= 90\n}`,
              rust: `fn detectCapitalUse(word: String) -> bool {\n    let bytes = word.as_bytes();\n    let mut upper = 0;\n    for b in bytes.iter() {\n        if *b >= b'A' && *b <= b'Z' {\n            upper += 1;\n        }\n    }\n    if upper == bytes.len() || upper == 0 {\n        return true;\n    }\n    upper == 1 && bytes[0] >= b'A' && bytes[0] <= b'Z'\n}`,
              php: `function detectCapitalUse($word) {\n    $n = strlen($word);\n    $upper = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $c = ord($word[$i]);\n        if ($c >= 65 && $c <= 90) $upper++;\n    }\n    if ($upper === $n || $upper === 0) return true;\n    $first = ord($word[0]);\n    return $upper === 1 && $first >= 65 && $first <= 90;\n}`,
              ruby: `def detectCapitalUse(word)\n  upper = word.count("A-Z")\n  return true if upper == word.length || upper == 0\n  upper == 1 && word[0].between?("A", "Z")\nend`,
      },
    };
  })(),

  // ── Repeated Substring Pattern ──────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const n = s.length;
      for (let len = 1; len <= Math.floor(n / 2); len++) {
        if (n % len !== 0) continue;
        const unit = s.slice(0, len);
        let ok = true;
        for (let i = len; i < n; i += len) {
          if (s.slice(i, i + len) !== unit) { ok = false; break; }
        }
        if (ok) return true;
      }
      return false;
    };
    return {
      slug: "repeated-substring-pattern",
      title: "Repeated Substring Pattern",
      difficulty: "EASY" as const,
      tags: ["String", "String Matching", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "repeatedSubstringPattern", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given a string `s`, return `true` if it can be built by taking one of its **proper** substrings and concatenating multiple copies of it.",
        [
          { in: 's = "abab"', out: "true", note: 'It is "ab" twice.' },
          { in: 's = "aba"', out: "false" },
          { in: 's = "abcabcabcabc"', out: "true", note: 'It is "abc" four times.' },
        ],
        ["1 <= s.length <= 40", "s consists of lowercase English letters."]),
      hints: [
        "The repeating unit's length must divide the string's length, and be at most half of it.",
        "Test each such length by comparing every block against the first one.",
        "A neat trick: `s` has this property exactly when it appears inside `(s + s)` with the first and last characters removed.",
      ],
      examples: [
        { input: '"abab"', expectedOutput: "true" },
        { input: '"aba"', expectedOutput: "false" },
        { input: '"abcabcabcabc"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        let s: string;
        if (rng() < 0.45) {
          const unit = randStr(rng, 1, 5, "abc");
          const reps = ri(rng, 2, Math.max(2, Math.floor(40 / unit.length)));
          s = unit.repeat(reps).slice(0, 40);
          if (s.length === 0) s = "ab";
        } else {
          s = randStr(rng, 1, 20, "abc");
        }
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: `def repeatedSubstringPattern(s: str) -> bool:\n    n = len(s)\n    for length in range(1, n // 2 + 1):\n        if n % length != 0:\n            continue\n        if s[:length] * (n // length) == s:\n            return True\n    return False`,
        javascript: `var repeatedSubstringPattern = function(s) {\n    const n = s.length;\n    for (let len = 1; len <= Math.floor(n / 2); len++) {\n        if (n % len !== 0) continue;\n        const unit = s.slice(0, len);\n        let ok = true;\n        for (let i = len; i < n; i += len) {\n            if (s.slice(i, i + len) !== unit) { ok = false; break; }\n        }\n        if (ok) return true;\n    }\n    return false;\n};`,
              typescript: `function repeatedSubstringPattern(s: string): boolean {\n    var n = s.length;\n    for (var len = 1; len <= Math.floor(n / 2); len++) {\n        if (n % len !== 0) continue;\n        var unit = s.substring(0, len);\n        var ok = true;\n        for (var i = len; i < n; i += len) {\n            if (s.substring(i, i + len) !== unit) {\n                ok = false;\n                break;\n            }\n        }\n        if (ok) return true;\n    }\n    return false;\n}`,
              java: `public static boolean repeatedSubstringPattern(String s) {\n    int n = s.length();\n    for (int len = 1; len <= n / 2; len++) {\n        if (n % len != 0) continue;\n        String unit = s.substring(0, len);\n        boolean ok = true;\n        for (int i = len; i < n; i += len) {\n            if (!s.substring(i, i + len).equals(unit)) {\n                ok = false;\n                break;\n            }\n        }\n        if (ok) return true;\n    }\n    return false;\n}`,
              cpp: `bool repeatedSubstringPattern(string s) {\n    int n = (int) s.size();\n    for (int len = 1; len <= n / 2; len++) {\n        if (n % len != 0) continue;\n        bool ok = true;\n        for (int i = len; i < n; i++) {\n            if (s[i] != s[i - len]) { ok = false; break; }\n        }\n        if (ok) return true;\n    }\n    return false;\n}`,
              c: `bool repeatedSubstringPattern(const char* s) {\n    int n = (int) strlen(s);\n    for (int len = 1; len <= n / 2; len++) {\n        if (n % len != 0) continue;\n        bool ok = true;\n        for (int i = len; i < n; i++) {\n            if (s[i] != s[i - len]) { ok = false; break; }\n        }\n        if (ok) return true;\n    }\n    return false;\n}`,
              csharp: `public static bool RepeatedSubstringPattern(string s)\n{\n    int n = s.Length;\n    for (int len = 1; len <= n / 2; len++)\n    {\n        if (n % len != 0) continue;\n        bool ok = true;\n        for (int i = len; i < n; i++)\n        {\n            if (s[i] != s[i - len]) { ok = false; break; }\n        }\n        if (ok) return true;\n    }\n    return false;\n}`,
              go: `func repeatedSubstringPattern(s string) bool {\n	n := len(s)\n	for length := 1; length <= n/2; length++ {\n		if n%length != 0 {\n			continue\n		}\n		ok := true\n		for i := length; i < n; i++ {\n			if s[i] != s[i-length] {\n				ok = false\n				break\n			}\n		}\n		if ok {\n			return true\n		}\n	}\n	return false\n}`,
              kotlin: `fun repeatedSubstringPattern(s: String): Boolean {\n    val n = s.length\n    for (len in 1..n / 2) {\n        if (n % len != 0) continue\n        var ok = true\n        for (i in len until n) {\n            if (s[i] != s[i - len]) {\n                ok = false\n                break\n            }\n        }\n        if (ok) return true\n    }\n    return false\n}`,
              swift: `func repeatedSubstringPattern(_ s: String) -> Bool {\n    let chars = Array(s)\n    let n = chars.count\n    var len = 1\n    while len <= n / 2 {\n        if n % len == 0 {\n            var ok = true\n            var i = len\n            while i < n {\n                if chars[i] != chars[i - len] {\n                    ok = false\n                    break\n                }\n                i += 1\n            }\n            if ok { return true }\n        }\n        len += 1\n    }\n    return false\n}`,
              rust: `fn repeatedSubstringPattern(s: String) -> bool {\n    let bytes = s.as_bytes();\n    let n = bytes.len();\n    let mut len = 1;\n    while len <= n / 2 {\n        if n % len == 0 {\n            let mut ok = true;\n            let mut i = len;\n            while i < n {\n                if bytes[i] != bytes[i - len] {\n                    ok = false;\n                    break;\n                }\n                i += 1;\n            }\n            if ok {\n                return true;\n            }\n        }\n        len += 1;\n    }\n    false\n}`,
              php: `function repeatedSubstringPattern($s) {\n    $n = strlen($s);\n    for ($len = 1; $len <= intdiv($n, 2); $len++) {\n        if ($n % $len !== 0) continue;\n        $ok = true;\n        for ($i = $len; $i < $n; $i++) {\n            if ($s[$i] !== $s[$i - $len]) { $ok = false; break; }\n        }\n        if ($ok) return true;\n    }\n    return false;\n}`,
              ruby: `def repeatedSubstringPattern(s)\n  n = s.length\n  (1..n / 2).each do |len|\n    next unless n % len == 0\n    ok = true\n    (len...n).each do |i|\n      if s[i] != s[i - len]\n        ok = false\n        break\n      end\n    end\n    return true if ok\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Count and Say ───────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let cur = "1";
      for (let step = 2; step <= n; step++) {
        let next = "";
        let i = 0;
        while (i < cur.length) {
          let j = i;
          while (j < cur.length && cur[j] === cur[i]) j++;
          next += String(j - i) + cur[i];
          i = j;
        }
        cur = next;
      }
      return cur;
    };
    return {
      slug: "count-and-say",
      title: "Count and Say",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Simulation", "Amazon", "Meta", "Google", "Microsoft"],
      signature: { funcName: "countAndSay", params: [{ name: "n", type: "int" as const }], returns: "string" as const },
      description: describe(
        "The count-and-say sequence starts at `countAndSay(1) = \"1\"`. Each later term is produced by reading the previous term aloud: split it into runs of identical digits, then write each run as its length followed by its digit.\n\nFor example, `\"3322251\"` reads as two 3s, three 2s, one 5, one 1 — giving `\"23321511\"`.\n\nGiven an integer `n`, return the n-th term.",
        [
          { in: "n = 1", out: "1" },
          { in: "n = 4", out: "1211", note: '1 → 11 → 21 → 1211.' },
          { in: "n = 6", out: "312211" },
        ],
        ["1 <= n <= 22"]),
      hints: [
        "There is no closed form — build each term from the previous one.",
        "Scan the current term with two indices, extending the second while the digit stays the same.",
        "Append the run length and then the digit; do not reverse the two.",
      ],
      examples: [
        { input: "1", expectedOutput: "1" },
        { input: "4", expectedOutput: "1211" },
        { input: "6", expectedOutput: "312211" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 22);
        return { input: String(n), expectedOutput: ref(n) };
      },
      solutions: {
        python: `def countAndSay(n: int) -> str:\n    cur = "1"\n    for _ in range(n - 1):\n        parts = []\n        i = 0\n        while i < len(cur):\n            j = i\n            while j < len(cur) and cur[j] == cur[i]:\n                j += 1\n            parts.append(str(j - i))\n            parts.append(cur[i])\n            i = j\n        cur = "".join(parts)\n    return cur`,
        javascript: `var countAndSay = function(n) {\n    let cur = "1";\n    for (let step = 2; step <= n; step++) {\n        let next = "";\n        let i = 0;\n        while (i < cur.length) {\n            let j = i;\n            while (j < cur.length && cur[j] === cur[i]) j++;\n            next += String(j - i) + cur[i];\n            i = j;\n        }\n        cur = next;\n    }\n    return cur;\n};`,
              typescript: `function countAndSay(n: number): string {\n    var cur = "1";\n    for (var step = 2; step <= n; step++) {\n        var next = "";\n        var i = 0;\n        while (i < cur.length) {\n            var j = i;\n            while (j < cur.length && cur.charAt(j) === cur.charAt(i)) j++;\n            next += String(j - i) + cur.charAt(i);\n            i = j;\n        }\n        cur = next;\n    }\n    return cur;\n}`,
              java: `public static String countAndSay(int n) {\n    String cur = "1";\n    for (int step = 2; step <= n; step++) {\n        StringBuilder next = new StringBuilder();\n        int i = 0;\n        while (i < cur.length()) {\n            int j = i;\n            while (j < cur.length() && cur.charAt(j) == cur.charAt(i)) j++;\n            next.append(j - i).append(cur.charAt(i));\n            i = j;\n        }\n        cur = next.toString();\n    }\n    return cur;\n}`,
              cpp: `string countAndSay(int n) {\n    string cur = "1";\n    for (int step = 2; step <= n; step++) {\n        string next = "";\n        int i = 0;\n        int len = (int) cur.size();\n        while (i < len) {\n            int j = i;\n            while (j < len && cur[j] == cur[i]) j++;\n            next += to_string(j - i);\n            next += cur[i];\n            i = j;\n        }\n        cur = next;\n    }\n    return cur;\n}`,
              c: `char* countAndSay(int n) {\n    char* cur = (char*) malloc(8192);\n    char* next = (char*) malloc(8192);\n    strcpy(cur, "1");\n    for (int step = 2; step <= n; step++) {\n        int len = (int) strlen(cur);\n        int pos = 0;\n        int i = 0;\n        while (i < len) {\n            int j = i;\n            while (j < len && cur[j] == cur[i]) j++;\n            pos += sprintf(next + pos, "%d%c", j - i, cur[i]);\n            i = j;\n        }\n        next[pos] = '\\0';\n        char* tmp = cur;\n        cur = next;\n        next = tmp;\n    }\n    free(next);\n    return cur;\n}`,
              csharp: `public static string CountAndSay(int n)\n{\n    string cur = "1";\n    for (int step = 2; step <= n; step++)\n    {\n        var next = new System.Text.StringBuilder();\n        int i = 0;\n        while (i < cur.Length)\n        {\n            int j = i;\n            while (j < cur.Length && cur[j] == cur[i]) j++;\n            next.Append(j - i).Append(cur[i]);\n            i = j;\n        }\n        cur = next.ToString();\n    }\n    return cur;\n}`,
              go: `func countAndSay(n int) string {\n	cur := "1"\n	for step := 2; step <= n; step++ {\n		var sb strings.Builder\n		i := 0\n		for i < len(cur) {\n			j := i\n			for j < len(cur) && cur[j] == cur[i] {\n				j++\n			}\n			sb.WriteString(strconv.Itoa(j - i))\n			sb.WriteByte(cur[i])\n			i = j\n		}\n		cur = sb.String()\n	}\n	return cur\n}`,
              kotlin: `fun countAndSay(n: Int): String {\n    var cur = "1"\n    for (step in 2..n) {\n        val next = StringBuilder()\n        var i = 0\n        while (i < cur.length) {\n            var j = i\n            while (j < cur.length && cur[j] == cur[i]) j++\n            next.append(j - i).append(cur[i])\n            i = j\n        }\n        cur = next.toString()\n    }\n    return cur\n}`,
              swift: `func countAndSay(_ n: Int) -> String {\n    var cur = "1"\n    var step = 2\n    while step <= n {\n        let chars = Array(cur)\n        var next = ""\n        var i = 0\n        while i < chars.count {\n            var j = i\n            while j < chars.count && chars[j] == chars[i] { j += 1 }\n            next += String(j - i)\n            next.append(chars[i])\n            i = j\n        }\n        cur = next\n        step += 1\n    }\n    return cur\n}`,
              rust: `fn countAndSay(n: i32) -> String {\n    let mut cur = String::from("1");\n    for _ in 2..=n {\n        let bytes = cur.as_bytes().to_vec();\n        let mut next = String::new();\n        let mut i = 0;\n        while i < bytes.len() {\n            let mut j = i;\n            while j < bytes.len() && bytes[j] == bytes[i] {\n                j += 1;\n            }\n            next.push_str(&(j - i).to_string());\n            next.push(bytes[i] as char);\n            i = j;\n        }\n        cur = next;\n    }\n    cur\n}`,
              php: `function countAndSay($n) {\n    $cur = "1";\n    for ($step = 2; $step <= $n; $step++) {\n        $next = "";\n        $i = 0;\n        $len = strlen($cur);\n        while ($i < $len) {\n            $j = $i;\n            while ($j < $len && $cur[$j] === $cur[$i]) $j++;\n            $next .= strval($j - $i) . $cur[$i];\n            $i = $j;\n        }\n        $cur = $next;\n    }\n    return $cur;\n}`,
              ruby: `def countAndSay(n)\n  cur = "1"\n  (2..n).each do\n    nxt = ""\n    i = 0\n    while i < cur.length\n      j = i\n      j += 1 while j < cur.length && cur[j] == cur[i]\n      nxt += (j - i).to_s + cur[i]\n      i = j\n    end\n    cur = nxt\n  end\n  cur\nend`,
      },
    };
  })(),

  // ── String Compression ──────────────────────────────────────────
  (() => {
    const ref = (chars: string) => {
      let out = "";
      let i = 0;
      while (i < chars.length) {
        let j = i;
        while (j < chars.length && chars[j] === chars[i]) j++;
        out += chars[i];
        if (j - i > 1) out += String(j - i);
        i = j;
      }
      return out;
    };
    return {
      slug: "string-compression",
      title: "String Compression",
      difficulty: "MEDIUM" as const,
      tags: ["Two Pointers", "String", "Amazon", "Microsoft", "Google", "Adobe"],
      signature: { funcName: "compress", params: [{ name: "chars", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Compress a string using run-length encoding: replace each maximal run of a repeated character by that character followed by the run length. A run of length **1** is written as the character alone, with no number.\n\nReturn the compressed string.",
        [
          { in: 'chars = "aabbccc"', out: "a2b2c3" },
          { in: 'chars = "a"', out: "a", note: "A run of one keeps no count." },
          { in: 'chars = "abbbbbbbbbbbb"', out: "ab12", note: "Multi-digit counts are written out in full." },
        ],
        ["1 <= chars.length <= 40", "chars consists of lowercase English letters."],
        "The interview version modifies the character array in place and returns the new length, using O(1) extra space."),
      hints: [
        "Walk the string with a run-start index and a scanning index.",
        "Append the character, and append the count only when the run is longer than one.",
        "Counts of ten or more contribute several characters — write the whole number, not one digit.",
      ],
      examples: [
        { input: '"aabbccc"', expectedOutput: "a2b2c3" },
        { input: '"a"', expectedOutput: "a" },
        { input: '"abbbbbbbbbbbb"', expectedOutput: "ab12" },
      ],
      gen: (rng: Rng) => {
        let s = "";
        while (s.length < 40) {
          const c = "abc"[ri(rng, 0, 2)];
          const run = ri(rng, 1, 13);
          s += c.repeat(run);
        }
        s = s.slice(0, ri(rng, 1, 40));
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def compress(chars: str) -> str:\n    out = []\n    i = 0\n    while i < len(chars):\n        j = i\n        while j < len(chars) and chars[j] == chars[i]:\n            j += 1\n        out.append(chars[i])\n        if j - i > 1:\n            out.append(str(j - i))\n        i = j\n    return "".join(out)`,
        javascript: `var compress = function(chars) {\n    let out = "";\n    let i = 0;\n    while (i < chars.length) {\n        let j = i;\n        while (j < chars.length && chars[j] === chars[i]) j++;\n        out += chars[i];\n        if (j - i > 1) out += String(j - i);\n        i = j;\n    }\n    return out;\n};`,
              typescript: `function compress(chars: string): string {\n    var out = "";\n    var i = 0;\n    while (i < chars.length) {\n        var j = i;\n        while (j < chars.length && chars.charAt(j) === chars.charAt(i)) j++;\n        out += chars.charAt(i);\n        if (j - i > 1) out += String(j - i);\n        i = j;\n    }\n    return out;\n}`,
              java: `public static String compress(String chars) {\n    StringBuilder out = new StringBuilder();\n    int i = 0;\n    while (i < chars.length()) {\n        int j = i;\n        while (j < chars.length() && chars.charAt(j) == chars.charAt(i)) j++;\n        out.append(chars.charAt(i));\n        if (j - i > 1) out.append(j - i);\n        i = j;\n    }\n    return out.toString();\n}`,
              cpp: `string compress(string chars) {\n    string out = "";\n    int i = 0;\n    int n = (int) chars.size();\n    while (i < n) {\n        int j = i;\n        while (j < n && chars[j] == chars[i]) j++;\n        out += chars[i];\n        if (j - i > 1) out += to_string(j - i);\n        i = j;\n    }\n    return out;\n}`,
              c: `char* compress(const char* chars) {\n    int n = (int) strlen(chars);\n    char* out = (char*) malloc(128);\n    int pos = 0;\n    int i = 0;\n    while (i < n) {\n        int j = i;\n        while (j < n && chars[j] == chars[i]) j++;\n        out[pos++] = chars[i];\n        if (j - i > 1) pos += sprintf(out + pos, "%d", j - i);\n        i = j;\n    }\n    out[pos] = '\\0';\n    return out;\n}`,
              csharp: `public static string Compress(string chars)\n{\n    var out_ = new System.Text.StringBuilder();\n    int i = 0;\n    while (i < chars.Length)\n    {\n        int j = i;\n        while (j < chars.Length && chars[j] == chars[i]) j++;\n        out_.Append(chars[i]);\n        if (j - i > 1) out_.Append(j - i);\n        i = j;\n    }\n    return out_.ToString();\n}`,
              go: `func compress(chars string) string {\n	var sb strings.Builder\n	i := 0\n	for i < len(chars) {\n		j := i\n		for j < len(chars) && chars[j] == chars[i] {\n			j++\n		}\n		sb.WriteByte(chars[i])\n		if j-i > 1 {\n			sb.WriteString(strconv.Itoa(j - i))\n		}\n		i = j\n	}\n	return sb.String()\n}`,
              kotlin: `fun compress(chars: String): String {\n    val out = StringBuilder()\n    var i = 0\n    while (i < chars.length) {\n        var j = i\n        while (j < chars.length && chars[j] == chars[i]) j++\n        out.append(chars[i])\n        if (j - i > 1) out.append(j - i)\n        i = j\n    }\n    return out.toString()\n}`,
              swift: `func compress(_ chars: String) -> String {\n    let arr = Array(chars)\n    var out = ""\n    var i = 0\n    while i < arr.count {\n        var j = i\n        while j < arr.count && arr[j] == arr[i] { j += 1 }\n        out.append(arr[i])\n        if j - i > 1 { out += String(j - i) }\n        i = j\n    }\n    return out\n}`,
              rust: `fn compress(chars: String) -> String {\n    let bytes = chars.as_bytes();\n    let mut out = String::new();\n    let mut i = 0;\n    while i < bytes.len() {\n        let mut j = i;\n        while j < bytes.len() && bytes[j] == bytes[i] {\n            j += 1;\n        }\n        out.push(bytes[i] as char);\n        if j - i > 1 {\n            out.push_str(&(j - i).to_string());\n        }\n        i = j;\n    }\n    out\n}`,
              php: `function compress($chars) {\n    $out = "";\n    $i = 0;\n    $n = strlen($chars);\n    while ($i < $n) {\n        $j = $i;\n        while ($j < $n && $chars[$j] === $chars[$i]) $j++;\n        $out .= $chars[$i];\n        if ($j - $i > 1) $out .= strval($j - $i);\n        $i = $j;\n    }\n    return $out;\n}`,
              ruby: `def compress(chars)\n  out = ""\n  i = 0\n  while i < chars.length\n    j = i\n    j += 1 while j < chars.length && chars[j] == chars[i]\n    out += chars[i]\n    out += (j - i).to_s if j - i > 1\n    i = j\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Longest Palindrome ──────────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const count = new Map<string, number>();
      for (let i = 0; i < s.length; i++) count.set(s[i], (count.get(s[i]) ?? 0) + 1);
      let total = 0, hasOdd = false;
      count.forEach((c) => {
        total += c - (c % 2);
        if (c % 2 === 1) hasOdd = true;
      });
      return total + (hasOdd ? 1 : 0);
    };
    return {
      slug: "longest-palindrome",
      title: "Longest Palindrome",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Greedy", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "longestPalindrome", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s` of upper and lowercase letters, return the length of the **longest palindrome** that can be built using those letters, in any order. Case matters: `\"Aa\"` is not a pair.",
        [
          { in: 's = "abccccdd"', out: "7", note: 'One longest palindrome is "dccaccd".' },
          { in: 's = "a"', out: "1" },
          { in: 's = "bb"', out: "2" },
        ],
        ["1 <= s.length <= 40", "s consists of upper and lowercase English letters."]),
      hints: [
        "A palindrome uses every letter an even number of times, except possibly one letter in the exact middle.",
        "So take the largest even number below or equal to each letter's count.",
        "If any letter had an odd count, one leftover can still sit in the centre — add 1.",
      ],
      examples: [
        { input: '"abccccdd"', expectedOutput: "7" },
        { input: '"a"', expectedOutput: "1" },
        { input: '"bb"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 1, 40, rng() < 0.5 ? "abcABC" : LOWER + "ABCDEF");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def longestPalindrome(s: str) -> int:\n    count = {}\n    for ch in s:\n        count[ch] = count.get(ch, 0) + 1\n    total = 0\n    has_odd = False\n    for c in count.values():\n        total += c - (c % 2)\n        if c % 2 == 1:\n            has_odd = True\n    return total + (1 if has_odd else 0)`,
        javascript: `var longestPalindrome = function(s) {\n    const count = new Map();\n    for (let i = 0; i < s.length; i++) {\n        count.set(s[i], (count.get(s[i]) || 0) + 1);\n    }\n    let total = 0, hasOdd = false;\n    count.forEach(function(c) {\n        total += c - (c % 2);\n        if (c % 2 === 1) hasOdd = true;\n    });\n    return total + (hasOdd ? 1 : 0);\n};`,
              typescript: `function longestPalindrome(s: string): number {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < s.length; i++) {\n        var ch = s.charAt(i);\n        count[ch] = (count[ch] === undefined ? 0 : count[ch]) + 1;\n    }\n    var total = 0;\n    var hasOdd = false;\n    for (var k in count) {\n        total += count[k] - (count[k] % 2);\n        if (count[k] % 2 === 1) hasOdd = true;\n    }\n    return total + (hasOdd ? 1 : 0);\n}`,
              java: `public static int longestPalindrome(String s) {\n    int[] count = new int[128];\n    for (int i = 0; i < s.length(); i++) count[s.charAt(i)]++;\n    int total = 0;\n    boolean hasOdd = false;\n    for (int c : count) {\n        total += c - (c % 2);\n        if (c % 2 == 1) hasOdd = true;\n    }\n    return total + (hasOdd ? 1 : 0);\n}`,
              cpp: `int longestPalindrome(string s) {\n    int count[128] = {0};\n    for (char ch : s) count[(int) ch]++;\n    int total = 0;\n    bool hasOdd = false;\n    for (int i = 0; i < 128; i++) {\n        total += count[i] - (count[i] % 2);\n        if (count[i] % 2 == 1) hasOdd = true;\n    }\n    return total + (hasOdd ? 1 : 0);\n}`,
              c: `int longestPalindrome(const char* s) {\n    int count[128] = {0};\n    for (int i = 0; s[i] != '\\0'; i++) count[(int) s[i]]++;\n    int total = 0;\n    bool hasOdd = false;\n    for (int i = 0; i < 128; i++) {\n        total += count[i] - (count[i] % 2);\n        if (count[i] % 2 == 1) hasOdd = true;\n    }\n    return total + (hasOdd ? 1 : 0);\n}`,
              csharp: `public static int LongestPalindrome(string s)\n{\n    int[] count = new int[128];\n    foreach (char ch in s) count[ch]++;\n    int total = 0;\n    bool hasOdd = false;\n    foreach (int c in count)\n    {\n        total += c - (c % 2);\n        if (c % 2 == 1) hasOdd = true;\n    }\n    return total + (hasOdd ? 1 : 0);\n}`,
              go: `func longestPalindrome(s string) int {\n	var count [128]int\n	for i := 0; i < len(s); i++ {\n		count[s[i]]++\n	}\n	total := 0\n	hasOdd := false\n	for _, c := range count {\n		total += c - (c % 2)\n		if c%2 == 1 {\n			hasOdd = true\n		}\n	}\n	if hasOdd {\n		return total + 1\n	}\n	return total\n}`,
              kotlin: `fun longestPalindrome(s: String): Int {\n    val count = IntArray(128)\n    for (ch in s) count[ch.toInt()]++\n    var total = 0\n    var hasOdd = false\n    for (c in count) {\n        total += c - (c % 2)\n        if (c % 2 == 1) hasOdd = true\n    }\n    return total + (if (hasOdd) 1 else 0)\n}`,
              swift: `func longestPalindrome(_ s: String) -> Int {\n    var count = [Int](repeating: 0, count: 128)\n    for b in Array(s.utf8) { count[Int(b)] += 1 }\n    var total = 0\n    var hasOdd = false\n    for c in count {\n        total += c - (c % 2)\n        if c % 2 == 1 { hasOdd = true }\n    }\n    return total + (hasOdd ? 1 : 0)\n}`,
              rust: `fn longestPalindrome(s: String) -> i32 {\n    let mut count = [0i32; 128];\n    for b in s.as_bytes().iter() {\n        count[*b as usize] += 1;\n    }\n    let mut total = 0;\n    let mut has_odd = false;\n    for c in count.iter() {\n        total += c - (c % 2);\n        if c % 2 == 1 {\n            has_odd = true;\n        }\n    }\n    total + if has_odd { 1 } else { 0 }\n}`,
              php: `function longestPalindrome($s) {\n    $count = array_fill(0, 128, 0);\n    for ($i = 0; $i < strlen($s); $i++) $count[ord($s[$i])]++;\n    $total = 0;\n    $hasOdd = false;\n    foreach ($count as $c) {\n        $total += $c - ($c % 2);\n        if ($c % 2 === 1) $hasOdd = true;\n    }\n    return $total + ($hasOdd ? 1 : 0);\n}`,
              ruby: `def longestPalindrome(s)\n  count = Hash.new(0)\n  s.each_char { |ch| count[ch] += 1 }\n  total = 0\n  has_odd = false\n  count.each_value do |c|\n    total += c - (c % 2)\n    has_odd = true if c.odd?\n  end\n  total + (has_odd ? 1 : 0)\nend`,
      },
    };
  })(),

  // ── Valid Parenthesis String ────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      let lo = 0, hi = 0;
      for (let i = 0; i < s.length; i++) {
        const c = s[i];
        if (c === "(") { lo++; hi++; }
        else if (c === ")") { lo--; hi--; }
        else { lo--; hi++; }
        if (hi < 0) return false;
        if (lo < 0) lo = 0;
      }
      return lo === 0;
    };
    return {
      slug: "valid-parenthesis-string",
      title: "Valid Parenthesis String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Stack", "Greedy", "Amazon", "Meta", "Google", "Bloomberg"],
      signature: { funcName: "checkValidString", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given a string `s` containing only `'('`, `')'` and `'*'`, return `true` if `s` is valid.\n\nThe rules are the usual bracket-matching rules, and a `'*'` may stand for `'('`, for `')'`, or for the empty string.",
        [
          { in: 's = "()"', out: "true" },
          { in: 's = "(*)"', out: "true", note: "The star can be the empty string." },
          { in: 's = "(*))"', out: "true", note: "The star can be an opening bracket." },
        ],
        ["1 <= s.length <= 40", "s consists of '(', ')' and '*'."]),
      hints: [
        "Instead of trying every meaning of every star, track the **range** of possible open-bracket counts.",
        "`lo` assumes every star is a closing bracket (or empty); `hi` assumes every star is an opening bracket.",
        "If `hi` ever drops below zero there are too many closers to fix; clamp `lo` at zero, and at the end the string is valid iff `lo` reached 0.",
      ],
      examples: [
        { input: '"()"', expectedOutput: "true" },
        { input: '"(*)"', expectedOutput: "true" },
        { input: '"(*))"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 1, 24, "()*");
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: `def checkValidString(s: str) -> bool:\n    lo = hi = 0\n    for ch in s:\n        if ch == "(":\n            lo += 1\n            hi += 1\n        elif ch == ")":\n            lo -= 1\n            hi -= 1\n        else:\n            lo -= 1\n            hi += 1\n        if hi < 0:\n            return False\n        if lo < 0:\n            lo = 0\n    return lo == 0`,
        javascript: `var checkValidString = function(s) {\n    let lo = 0, hi = 0;\n    for (let i = 0; i < s.length; i++) {\n        const c = s[i];\n        if (c === "(") { lo++; hi++; }\n        else if (c === ")") { lo--; hi--; }\n        else { lo--; hi++; }\n        if (hi < 0) return false;\n        if (lo < 0) lo = 0;\n    }\n    return lo === 0;\n};`,
              typescript: `function checkValidString(s: string): boolean {\n    var lo = 0;\n    var hi = 0;\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (c === "(") {\n            lo++;\n            hi++;\n        } else if (c === ")") {\n            lo--;\n            hi--;\n        } else {\n            lo--;\n            hi++;\n        }\n        if (hi < 0) return false;\n        if (lo < 0) lo = 0;\n    }\n    return lo === 0;\n}`,
              java: `public static boolean checkValidString(String s) {\n    int lo = 0, hi = 0;\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        if (c == '(') { lo++; hi++; }\n        else if (c == ')') { lo--; hi--; }\n        else { lo--; hi++; }\n        if (hi < 0) return false;\n        if (lo < 0) lo = 0;\n    }\n    return lo == 0;\n}`,
              cpp: `bool checkValidString(string s) {\n    int lo = 0, hi = 0;\n    for (char c : s) {\n        if (c == '(') { lo++; hi++; }\n        else if (c == ')') { lo--; hi--; }\n        else { lo--; hi++; }\n        if (hi < 0) return false;\n        if (lo < 0) lo = 0;\n    }\n    return lo == 0;\n}`,
              c: `bool checkValidString(const char* s) {\n    int lo = 0, hi = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        char c = s[i];\n        if (c == '(') { lo++; hi++; }\n        else if (c == ')') { lo--; hi--; }\n        else { lo--; hi++; }\n        if (hi < 0) return false;\n        if (lo < 0) lo = 0;\n    }\n    return lo == 0;\n}`,
              csharp: `public static bool CheckValidString(string s)\n{\n    int lo = 0, hi = 0;\n    foreach (char c in s)\n    {\n        if (c == '(') { lo++; hi++; }\n        else if (c == ')') { lo--; hi--; }\n        else { lo--; hi++; }\n        if (hi < 0) return false;\n        if (lo < 0) lo = 0;\n    }\n    return lo == 0;\n}`,
              go: `func checkValidString(s string) bool {\n	lo, hi := 0, 0\n	for i := 0; i < len(s); i++ {\n		c := s[i]\n		if c == '(' {\n			lo++\n			hi++\n		} else if c == ')' {\n			lo--\n			hi--\n		} else {\n			lo--\n			hi++\n		}\n		if hi < 0 {\n			return false\n		}\n		if lo < 0 {\n			lo = 0\n		}\n	}\n	return lo == 0\n}`,
              kotlin: `fun checkValidString(s: String): Boolean {\n    var lo = 0\n    var hi = 0\n    for (c in s) {\n        when (c) {\n            '(' -> { lo++; hi++ }\n            ')' -> { lo--; hi-- }\n            else -> { lo--; hi++ }\n        }\n        if (hi < 0) return false\n        if (lo < 0) lo = 0\n    }\n    return lo == 0\n}`,
              swift: `func checkValidString(_ s: String) -> Bool {\n    var lo = 0\n    var hi = 0\n    for c in s {\n        if c == "(" {\n            lo += 1\n            hi += 1\n        } else if c == ")" {\n            lo -= 1\n            hi -= 1\n        } else {\n            lo -= 1\n            hi += 1\n        }\n        if hi < 0 { return false }\n        if lo < 0 { lo = 0 }\n    }\n    return lo == 0\n}`,
              rust: `fn checkValidString(s: String) -> bool {\n    let mut lo = 0i32;\n    let mut hi = 0i32;\n    for c in s.as_bytes().iter() {\n        if *c == b'(' {\n            lo += 1;\n            hi += 1;\n        } else if *c == b')' {\n            lo -= 1;\n            hi -= 1;\n        } else {\n            lo -= 1;\n            hi += 1;\n        }\n        if hi < 0 {\n            return false;\n        }\n        if lo < 0 {\n            lo = 0;\n        }\n    }\n    lo == 0\n}`,
              php: `function checkValidString($s) {\n    $lo = 0;\n    $hi = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        $c = $s[$i];\n        if ($c === "(") { $lo++; $hi++; }\n        else if ($c === ")") { $lo--; $hi--; }\n        else { $lo--; $hi++; }\n        if ($hi < 0) return false;\n        if ($lo < 0) $lo = 0;\n    }\n    return $lo === 0;\n}`,
              ruby: `def checkValidString(s)\n  lo = 0\n  hi = 0\n  s.each_char do |c|\n    if c == "("\n      lo += 1\n      hi += 1\n    elsif c == ")"\n      lo -= 1\n      hi -= 1\n    else\n      lo -= 1\n      hi += 1\n    end\n    return false if hi < 0\n    lo = 0 if lo < 0\n  end\n  lo == 0\nend`,
      },
    };
  })(),

  // ── Defanging an IP Address ─────────────────────────────────────
  (() => {
    const ref = (address: string) => address.split(".").join("[.]");
    return {
      slug: "defanging-an-ip-address",
      title: "Defanging an IP Address",
      difficulty: "EASY" as const,
      tags: ["String", "Amazon", "Wipro", "Capgemini"],
      signature: { funcName: "defangIPaddr", params: [{ name: "address", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A **defanged IP address** replaces every period `\".\"` with `\"[.]\"` so the address cannot be clicked by accident.\n\nGiven a valid IPv4 address, return its defanged form.",
        [
          { in: 'address = "1.1.1.1"', out: "1[.]1[.]1[.]1" },
          { in: 'address = "255.100.50.0"', out: "255[.]100[.]50[.]0" },
          { in: 'address = "8.8.8.8"', out: "8[.]8[.]8[.]8" },
        ],
        ["The input is a valid IPv4 address."]),
      hints: [
        "Split on the period and join the pieces with `\"[.]\"`.",
        "Or build the output character by character, appending three characters instead of one for a period.",
      ],
      examples: [
        { input: '"1.1.1.1"', expectedOutput: "1[.]1[.]1[.]1" },
        { input: '"255.100.50.0"', expectedOutput: "255[.]100[.]50[.]0" },
        { input: '"8.8.8.8"', expectedOutput: "8[.]8[.]8[.]8" },
      ],
      gen: (rng: Rng) => {
        const parts = Array.from({ length: 4 }, () => String(ri(rng, 0, 255)));
        const address = parts.join(".");
        return { input: `"${address}"`, expectedOutput: ref(address) };
      },
      solutions: {
        python: `def defangIPaddr(address: str) -> str:\n    return address.replace(".", "[.]")`,
        javascript: `var defangIPaddr = function(address) {\n    return address.split(".").join("[.]");\n};`,
              typescript: `function defangIPaddr(address: string): string {\n    var out = "";\n    for (var i = 0; i < address.length; i++) {\n        out += address.charAt(i) === "." ? "[.]" : address.charAt(i);\n    }\n    return out;\n}`,
              java: `public static String defangIPaddr(String address) {\n    StringBuilder out = new StringBuilder();\n    for (int i = 0; i < address.length(); i++) {\n        char c = address.charAt(i);\n        if (c == '.') out.append("[.]");\n        else out.append(c);\n    }\n    return out.toString();\n}`,
              cpp: `string defangIPaddr(string address) {\n    string out = "";\n    for (char c : address) {\n        if (c == '.') out += "[.]";\n        else out += c;\n    }\n    return out;\n}`,
              c: `char* defangIPaddr(const char* address) {\n    int n = (int) strlen(address);\n    char* out = (char*) malloc(3 * n + 1);\n    int pos = 0;\n    for (int i = 0; i < n; i++) {\n        if (address[i] == '.') {\n            out[pos++] = '[';\n            out[pos++] = '.';\n            out[pos++] = ']';\n        } else {\n            out[pos++] = address[i];\n        }\n    }\n    out[pos] = '\\0';\n    return out;\n}`,
              csharp: `public static string DefangIPaddr(string address)\n{\n    return address.Replace(".", "[.]");\n}`,
              go: `func defangIPaddr(address string) string {\n	return strings.Replace(address, ".", "[.]", -1)\n}`,
              kotlin: `fun defangIPaddr(address: String): String {\n    return address.replace(".", "[.]")\n}`,
              swift: `func defangIPaddr(_ address: String) -> String {\n    return address.replacingOccurrences(of: ".", with: "[.]")\n}`,
              rust: `fn defangIPaddr(address: String) -> String {\n    address.replace(".", "[.]")\n}`,
              php: `function defangIPaddr($address) {\n    return str_replace(".", "[.]", $address);\n}`,
              ruby: `def defangIPaddr(address)\n  address.gsub(".", "[.]")\nend`,
      },
    };
  })(),

  // ── Jewels and Stones ───────────────────────────────────────────
  (() => {
    const ref = (jewels: string, stones: string) => {
      const set = new Set(jewels.split(""));
      let count = 0;
      for (let i = 0; i < stones.length; i++) if (set.has(stones[i])) count++;
      return count;
    };
    return {
      slug: "jewels-and-stones",
      title: "Jewels and Stones",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Amazon", "Meta", "Google", "Adobe"],
      signature: { funcName: "numJewelsInStones", params: [{ name: "jewels", type: "string" as const }, { name: "stones", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given `jewels`, a string where each character is a type of stone that counts as a jewel, and `stones`, a string where each character is a stone you have.\n\nReturn how many of your stones are jewels. Letters are **case-sensitive**, so `\"a\"` and `\"A\"` are different types.",
        [
          { in: 'jewels = "aA", stones = "aAAbbbb"', out: "3" },
          { in: 'jewels = "z", stones = "ZZ"', out: "0", note: "Case matters." },
          { in: 'jewels = "abc", stones = "cba"', out: "3" },
        ],
        ["1 <= jewels.length, stones.length <= 40", "All characters are English letters.", "The characters of jewels are distinct."]),
      hints: [
        "Put the jewel types into a hash set so each stone is a constant-time lookup.",
        "Then scan the stones once and count the hits.",
      ],
      examples: [
        { input: '"aA"\n"aAAbbbb"', expectedOutput: "3" },
        { input: '"z"\n"ZZ"', expectedOutput: "0" },
        { input: '"abc"\n"cba"', expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const pool = "abcdeABCDE";
        const jewelChars = shuffle(rng, pool.split("")).slice(0, ri(rng, 1, 5));
        const jewels = jewelChars.join("");
        const stones = randStr(rng, 1, 40, pool);
        return { input: `"${jewels}"\n"${stones}"`, expectedOutput: String(ref(jewels, stones)) };
      },
      solutions: {
        python: `def numJewelsInStones(jewels: str, stones: str) -> int:\n    jewel_set = set(jewels)\n    return sum(1 for ch in stones if ch in jewel_set)`,
        javascript: `var numJewelsInStones = function(jewels, stones) {\n    const set = new Set(jewels.split(""));\n    let count = 0;\n    for (let i = 0; i < stones.length; i++) {\n        if (set.has(stones[i])) count++;\n    }\n    return count;\n};`,
              typescript: `function numJewelsInStones(jewels: string, stones: string): number {\n    var isJewel: { [key: string]: boolean } = {};\n    for (var i = 0; i < jewels.length; i++) isJewel[jewels.charAt(i)] = true;\n    var count = 0;\n    for (var j = 0; j < stones.length; j++) {\n        if (isJewel[stones.charAt(j)] === true) count++;\n    }\n    return count;\n}`,
              java: `public static int numJewelsInStones(String jewels, String stones) {\n    Set<Character> set = new HashSet<>();\n    for (int i = 0; i < jewels.length(); i++) set.add(jewels.charAt(i));\n    int count = 0;\n    for (int i = 0; i < stones.length(); i++) {\n        if (set.contains(stones.charAt(i))) count++;\n    }\n    return count;\n}`,
              cpp: `int numJewelsInStones(string jewels, string stones) {\n    bool isJewel[128] = {false};\n    for (char c : jewels) isJewel[(int) c] = true;\n    int count = 0;\n    for (char c : stones) {\n        if (isJewel[(int) c]) count++;\n    }\n    return count;\n}`,
              c: `int numJewelsInStones(const char* jewels, const char* stones) {\n    bool isJewel[128] = {false};\n    for (int i = 0; jewels[i] != '\\0'; i++) isJewel[(int) jewels[i]] = true;\n    int count = 0;\n    for (int i = 0; stones[i] != '\\0'; i++) {\n        if (isJewel[(int) stones[i]]) count++;\n    }\n    return count;\n}`,
              csharp: `public static int NumJewelsInStones(string jewels, string stones)\n{\n    var set = new HashSet<char>(jewels);\n    int count = 0;\n    foreach (char c in stones)\n    {\n        if (set.Contains(c)) count++;\n    }\n    return count;\n}`,
              go: `func numJewelsInStones(jewels string, stones string) int {\n	var isJewel [128]bool\n	for i := 0; i < len(jewels); i++ {\n		isJewel[jewels[i]] = true\n	}\n	count := 0\n	for i := 0; i < len(stones); i++ {\n		if isJewel[stones[i]] {\n			count++\n		}\n	}\n	return count\n}`,
              kotlin: `fun numJewelsInStones(jewels: String, stones: String): Int {\n    val set = jewels.toHashSet()\n    var count = 0\n    for (c in stones) {\n        if (set.contains(c)) count++\n    }\n    return count\n}`,
              swift: `func numJewelsInStones(_ jewels: String, _ stones: String) -> Int {\n    let set = Set(jewels)\n    var count = 0\n    for c in stones {\n        if set.contains(c) { count += 1 }\n    }\n    return count\n}`,
              rust: `fn numJewelsInStones(jewels: String, stones: String) -> i32 {\n    let mut is_jewel = [false; 128];\n    for b in jewels.as_bytes().iter() {\n        is_jewel[*b as usize] = true;\n    }\n    let mut count = 0;\n    for b in stones.as_bytes().iter() {\n        if is_jewel[*b as usize] {\n            count += 1;\n        }\n    }\n    count\n}`,
              php: `function numJewelsInStones($jewels, $stones) {\n    $isJewel = array();\n    for ($i = 0; $i < strlen($jewels); $i++) $isJewel[$jewels[$i]] = true;\n    $count = 0;\n    for ($i = 0; $i < strlen($stones); $i++) {\n        if (isset($isJewel[$stones[$i]])) $count++;\n    }\n    return $count;\n}`,
              ruby: `def numJewelsInStones(jewels, stones)\n  set = jewels.chars.to_a\n  stones.each_char.count { |c| set.include?(c) }\nend`,
      },
    };
  })(),

  // ── Goal Parser Interpretation ──────────────────────────────────
  (() => {
    const ref = (command: string) => {
      let out = "";
      let i = 0;
      while (i < command.length) {
        if (command[i] === "G") { out += "G"; i += 1; }
        else if (command[i + 1] === ")") { out += "o"; i += 2; }
        else { out += "al"; i += 4; }
      }
      return out;
    };
    return {
      slug: "goal-parser-interpretation",
      title: "Goal Parser Interpretation",
      difficulty: "EASY" as const,
      tags: ["String", "Amazon", "Adobe"],
      signature: { funcName: "interpret", params: [{ name: "command", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You own a **Goal Parser** that reads a string made only of `\"G\"`, `\"()\"` and `\"(al)\"`. It interprets `\"G\"` as `\"G\"`, `\"()\"` as `\"o\"` and `\"(al)\"` as `\"al\"`, then concatenates the pieces in order.\n\nGiven the string `command`, return the parser's interpretation.",
        [
          { in: 'command = "G()(al)"', out: "Goal" },
          { in: 'command = "G()()()()(al)"', out: "Gooooal" },
          { in: 'command = "(al)G(al)()()G"', out: "alGalooG" },
        ],
        ["1 <= command.length <= 40", 'command consists only of "G", "()" and "(al)" in some order.']),
      hints: [
        "Scan left to right; the character at the cursor tells you which of the three tokens starts there.",
        "A `G` advances one, `()` advances two, `(al)` advances four.",
        "Peeking at the next character after a `(` is enough to tell `()` from `(al)`.",
      ],
      examples: [
        { input: '"G()(al)"', expectedOutput: "Goal" },
        { input: '"G()()()()(al)"', expectedOutput: "Gooooal" },
        { input: '"(al)G(al)()()G"', expectedOutput: "alGalooG" },
      ],
      gen: (rng: Rng) => {
        const tokens = ["G", "()", "(al)"];
        let command = "";
        while (command.length < 34) {
          const t = tokens[ri(rng, 0, 2)];
          if (command.length + t.length > 40) break;
          command += t;
        }
        if (command.length === 0) command = "G";
        return { input: `"${command}"`, expectedOutput: ref(command) };
      },
      solutions: {
        python: `def interpret(command: str) -> str:\n    return command.replace("()", "o").replace("(al)", "al")`,
        javascript: `var interpret = function(command) {\n    let out = "";\n    let i = 0;\n    while (i < command.length) {\n        if (command[i] === "G") { out += "G"; i += 1; }\n        else if (command[i + 1] === ")") { out += "o"; i += 2; }\n        else { out += "al"; i += 4; }\n    }\n    return out;\n};`,
              typescript: `function interpret(command: string): string {\n    var out = "";\n    var i = 0;\n    while (i < command.length) {\n        if (command.charAt(i) === "G") {\n            out += "G";\n            i += 1;\n        } else if (command.charAt(i + 1) === ")") {\n            out += "o";\n            i += 2;\n        } else {\n            out += "al";\n            i += 4;\n        }\n    }\n    return out;\n}`,
              java: `public static String interpret(String command) {\n    StringBuilder out = new StringBuilder();\n    int i = 0;\n    while (i < command.length()) {\n        if (command.charAt(i) == 'G') {\n            out.append('G');\n            i += 1;\n        } else if (command.charAt(i + 1) == ')') {\n            out.append('o');\n            i += 2;\n        } else {\n            out.append("al");\n            i += 4;\n        }\n    }\n    return out.toString();\n}`,
              cpp: `string interpret(string command) {\n    string out = "";\n    int i = 0;\n    int n = (int) command.size();\n    while (i < n) {\n        if (command[i] == 'G') { out += 'G'; i += 1; }\n        else if (command[i + 1] == ')') { out += 'o'; i += 2; }\n        else { out += "al"; i += 4; }\n    }\n    return out;\n}`,
              c: `char* interpret(const char* command) {\n    int n = (int) strlen(command);\n    char* out = (char*) malloc(n + 1);\n    int pos = 0;\n    int i = 0;\n    while (i < n) {\n        if (command[i] == 'G') {\n            out[pos++] = 'G';\n            i += 1;\n        } else if (command[i + 1] == ')') {\n            out[pos++] = 'o';\n            i += 2;\n        } else {\n            out[pos++] = 'a';\n            out[pos++] = 'l';\n            i += 4;\n        }\n    }\n    out[pos] = '\\0';\n    return out;\n}`,
              csharp: `public static string Interpret(string command)\n{\n    var out_ = new System.Text.StringBuilder();\n    int i = 0;\n    while (i < command.Length)\n    {\n        if (command[i] == 'G') { out_.Append('G'); i += 1; }\n        else if (command[i + 1] == ')') { out_.Append('o'); i += 2; }\n        else { out_.Append("al"); i += 4; }\n    }\n    return out_.ToString();\n}`,
              go: `func interpret(command string) string {\n	var sb strings.Builder\n	i := 0\n	for i < len(command) {\n		if command[i] == 'G' {\n			sb.WriteByte('G')\n			i += 1\n		} else if command[i+1] == ')' {\n			sb.WriteByte('o')\n			i += 2\n		} else {\n			sb.WriteString("al")\n			i += 4\n		}\n	}\n	return sb.String()\n}`,
              kotlin: `fun interpret(command: String): String {\n    val out = StringBuilder()\n    var i = 0\n    while (i < command.length) {\n        if (command[i] == 'G') {\n            out.append('G')\n            i += 1\n        } else if (command[i + 1] == ')') {\n            out.append('o')\n            i += 2\n        } else {\n            out.append("al")\n            i += 4\n        }\n    }\n    return out.toString()\n}`,
              swift: `func interpret(_ command: String) -> String {\n    let chars = Array(command)\n    var out = ""\n    var i = 0\n    while i < chars.count {\n        if chars[i] == "G" {\n            out += "G"\n            i += 1\n        } else if chars[i + 1] == ")" {\n            out += "o"\n            i += 2\n        } else {\n            out += "al"\n            i += 4\n        }\n    }\n    return out\n}`,
              rust: `fn interpret(command: String) -> String {\n    let bytes = command.as_bytes();\n    let mut out = String::new();\n    let mut i = 0;\n    while i < bytes.len() {\n        if bytes[i] == b'G' {\n            out.push('G');\n            i += 1;\n        } else if bytes[i + 1] == b')' {\n            out.push('o');\n            i += 2;\n        } else {\n            out.push_str("al");\n            i += 4;\n        }\n    }\n    out\n}`,
              php: `function interpret($command) {\n    $out = "";\n    $i = 0;\n    $n = strlen($command);\n    while ($i < $n) {\n        if ($command[$i] === "G") { $out .= "G"; $i += 1; }\n        else if ($command[$i + 1] === ")") { $out .= "o"; $i += 2; }\n        else { $out .= "al"; $i += 4; }\n    }\n    return $out;\n}`,
              ruby: `def interpret(command)\n  out = ""\n  i = 0\n  while i < command.length\n    if command[i] == "G"\n      out += "G"\n      i += 1\n    elsif command[i + 1] == ")"\n      out += "o"\n      i += 2\n    else\n      out += "al"\n      i += 4\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Shuffle String ──────────────────────────────────────────────
  (() => {
    const ref = (s: string, indices: number[]) => {
      const out = new Array(s.length).fill("");
      for (let i = 0; i < s.length; i++) out[indices[i]] = s[i];
      return out.join("");
    };
    return {
      slug: "shuffle-string",
      title: "Shuffle String",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Amazon", "Microsoft"],
      signature: { funcName: "restoreString", params: [{ name: "s", type: "string" as const }, { name: "indices", type: "int[]" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `s` and an integer array `indices` of the same length. The string was shuffled so that the character originally at position `i` moved to position `indices[i]`.\n\nReturn the restored string.",
        [
          { in: 's = "codeleet", indices = [4,5,6,7,0,2,1,3]', out: "leetcode" },
          { in: 's = "abc", indices = [0,1,2]', out: "abc" },
          { in: 's = "aiohn", indices = [3,1,4,2,0]', out: "nihao" },
        ],
        ["1 <= s.length <= 40", "indices.length == s.length", "indices is a permutation of 0 … s.length - 1."]),
      hints: [
        "Allocate the answer up front and write each character straight into its destination slot.",
        "Do not confuse the two directions: `indices[i]` is where character `i` **goes**, not where it comes from.",
      ],
      examples: [
        { input: '"codeleet"\n[4,5,6,7,0,2,1,3]', expectedOutput: "leetcode" },
        { input: '"abc"\n[0,1,2]', expectedOutput: "abc" },
        { input: '"aiohn"\n[3,1,4,2,0]', expectedOutput: "nihao" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const s = randStr(rng, n, n);
        const indices = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        return { input: `"${s}"\n[${indices.join(",")}]`, expectedOutput: ref(s, indices) };
      },
      solutions: {
        python: `def restoreString(s: str, indices) -> str:\n    out = [""] * len(s)\n    for i, ch in enumerate(s):\n        out[indices[i]] = ch\n    return "".join(out)`,
        javascript: `var restoreString = function(s, indices) {\n    const out = new Array(s.length).fill("");\n    for (let i = 0; i < s.length; i++) {\n        out[indices[i]] = s[i];\n    }\n    return out.join("");\n};`,
              typescript: `function restoreString(s: string, indices: number[]): string {\n    var out: string[] = [];\n    for (var k = 0; k < s.length; k++) out.push("");\n    for (var i = 0; i < s.length; i++) out[indices[i]] = s.charAt(i);\n    return out.join("");\n}`,
              java: `public static String restoreString(String s, int[] indices) {\n    char[] out = new char[s.length()];\n    for (int i = 0; i < s.length(); i++) out[indices[i]] = s.charAt(i);\n    return new String(out);\n}`,
              cpp: `string restoreString(string s, vector<int>& indices) {\n    string out = s;\n    for (int i = 0; i < (int) s.size(); i++) out[indices[i]] = s[i];\n    return out;\n}`,
              c: `char* restoreString(const char* s, int* indices, int indicesSize) {\n    char* out = (char*) malloc(indicesSize + 1);\n    for (int i = 0; i < indicesSize; i++) out[indices[i]] = s[i];\n    out[indicesSize] = '\\0';\n    return out;\n}`,
              csharp: `public static string RestoreString(string s, int[] indices)\n{\n    char[] out_ = new char[s.Length];\n    for (int i = 0; i < s.Length; i++) out_[indices[i]] = s[i];\n    return new string(out_);\n}`,
              go: `func restoreString(s string, indices []int) string {\n	out := make([]byte, len(s))\n	for i := 0; i < len(s); i++ {\n		out[indices[i]] = s[i]\n	}\n	return string(out)\n}`,
              kotlin: `fun restoreString(s: String, indices: IntArray): String {\n    val out = CharArray(s.length)\n    for (i in s.indices) out[indices[i]] = s[i]\n    return String(out)\n}`,
              swift: `func restoreString(_ s: String, _ indices: [Int]) -> String {\n    let chars = Array(s)\n    var out = [Character](repeating: " ", count: chars.count)\n    for i in 0..<chars.count {\n        out[indices[i]] = chars[i]\n    }\n    return String(out)\n}`,
              rust: `fn restoreString(s: String, indices: Vec<i32>) -> String {\n    let bytes = s.as_bytes();\n    let mut out = vec![b' '; bytes.len()];\n    for i in 0..bytes.len() {\n        out[indices[i] as usize] = bytes[i];\n    }\n    String::from_utf8(out).unwrap()\n}`,
              php: `function restoreString($s, $indices) {\n    $out = array_fill(0, strlen($s), "");\n    for ($i = 0; $i < strlen($s); $i++) {\n        $out[$indices[$i]] = $s[$i];\n    }\n    return implode("", $out);\n}`,
              ruby: `def restoreString(s, indices)\n  out = Array.new(s.length, "")\n  s.each_char.with_index { |ch, i| out[indices[i]] = ch }\n  out.join\nend`,
      },
    };
  })(),

  // ── Maximum Nesting Depth of the Parentheses ────────────────────
  (() => {
    const ref = (s: string) => {
      let depth = 0, best = 0;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "(") { depth++; if (depth > best) best = depth; }
        else if (s[i] === ")") depth--;
      }
      return best;
    };
    return {
      slug: "maximum-nesting-depth-of-the-parentheses",
      title: "Maximum Nesting Depth of the Parentheses",
      difficulty: "EASY" as const,
      tags: ["String", "Stack", "Amazon", "Adobe"],
      signature: { funcName: "maxDepth", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a **valid parentheses string** `s` — a string of digits, `+`, `-`, `*`, `/` and balanced parentheses — return the maximum nesting depth of its parentheses.\n\nThe nesting depth of a string with no parentheses is 0.",
        [
          { in: 's = "(1+(2*3)+((8)/4))+1"', out: "3", note: "The 8 sits three levels deep." },
          { in: 's = "(1)+((2))+(((3)))"', out: "3" },
          { in: 's = "1+2"', out: "0" },
        ],
        ["1 <= s.length <= 40", "s is a valid parentheses string."]),
      hints: [
        "No stack is needed — only the stack's **height** matters.",
        "Increment a counter on `(`, decrement on `)`, and record the largest value the counter ever reaches.",
      ],
      examples: [
        { input: '"(1+(2*3)+((8)/4))+1"', expectedOutput: "3" },
        { input: '"(1)+((2))+(((3)))"', expectedOutput: "3" },
        { input: '"1+2"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const build = (depth: number): string => {
          if (depth <= 0 || rng() < 0.3) return String(ri(rng, 1, 9));
          const inner = build(depth - 1);
          const op = "+-*/"[ri(rng, 0, 3)];
          return rng() < 0.5 ? `(${inner})` : `(${inner}${op}${ri(rng, 1, 9)})`;
        };
        let s = "";
        while (s.length < 20) {
          const piece = build(ri(rng, 0, 3));
          if (s.length + piece.length > 40) break;
          s += (s.length > 0 ? "+" : "") + piece;
        }
        if (s.length === 0) s = "1+2";
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def maxDepth(s: str) -> int:\n    depth = best = 0\n    for ch in s:\n        if ch == "(":\n            depth += 1\n            if depth > best:\n                best = depth\n        elif ch == ")":\n            depth -= 1\n    return best`,
        javascript: `var maxDepth = function(s) {\n    let depth = 0, best = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] === "(") {\n            depth++;\n            if (depth > best) best = depth;\n        } else if (s[i] === ")") {\n            depth--;\n        }\n    }\n    return best;\n};`,
              typescript: `function maxDepth(s: string): number {\n    var depth = 0;\n    var best = 0;\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charAt(i);\n        if (c === "(") {\n            depth++;\n            if (depth > best) best = depth;\n        } else if (c === ")") {\n            depth--;\n        }\n    }\n    return best;\n}`,
              java: `public static int maxDepth(String s) {\n    int depth = 0, best = 0;\n    for (int i = 0; i < s.length(); i++) {\n        char c = s.charAt(i);\n        if (c == '(') {\n            depth++;\n            if (depth > best) best = depth;\n        } else if (c == ')') {\n            depth--;\n        }\n    }\n    return best;\n}`,
              cpp: `int maxDepth(string s) {\n    int depth = 0, best = 0;\n    for (char c : s) {\n        if (c == '(') {\n            depth++;\n            if (depth > best) best = depth;\n        } else if (c == ')') {\n            depth--;\n        }\n    }\n    return best;\n}`,
              c: `int maxDepth(const char* s) {\n    int depth = 0, best = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        if (s[i] == '(') {\n            depth++;\n            if (depth > best) best = depth;\n        } else if (s[i] == ')') {\n            depth--;\n        }\n    }\n    return best;\n}`,
              csharp: `public static int MaxDepth(string s)\n{\n    int depth = 0, best = 0;\n    foreach (char c in s)\n    {\n        if (c == '(')\n        {\n            depth++;\n            if (depth > best) best = depth;\n        }\n        else if (c == ')')\n        {\n            depth--;\n        }\n    }\n    return best;\n}`,
              go: `func maxDepth(s string) int {\n	depth, best := 0, 0\n	for i := 0; i < len(s); i++ {\n		if s[i] == '(' {\n			depth++\n			if depth > best {\n				best = depth\n			}\n		} else if s[i] == ')' {\n			depth--\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxDepth(s: String): Int {\n    var depth = 0\n    var best = 0\n    for (c in s) {\n        if (c == '(') {\n            depth++\n            if (depth > best) best = depth\n        } else if (c == ')') {\n            depth--\n        }\n    }\n    return best\n}`,
              swift: `func maxDepth(_ s: String) -> Int {\n    var depth = 0\n    var best = 0\n    for c in s {\n        if c == "(" {\n            depth += 1\n            if depth > best { best = depth }\n        } else if c == ")" {\n            depth -= 1\n        }\n    }\n    return best\n}`,
              rust: `fn maxDepth(s: String) -> i32 {\n    let mut depth = 0;\n    let mut best = 0;\n    for b in s.as_bytes().iter() {\n        if *b == b'(' {\n            depth += 1;\n            if depth > best {\n                best = depth;\n            }\n        } else if *b == b')' {\n            depth -= 1;\n        }\n    }\n    best\n}`,
              php: `function maxDepth($s) {\n    $depth = 0;\n    $best = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] === "(") {\n            $depth++;\n            if ($depth > $best) $best = $depth;\n        } else if ($s[$i] === ")") {\n            $depth--;\n        }\n    }\n    return $best;\n}`,
              ruby: `def maxDepth(s)\n  depth = 0\n  best = 0\n  s.each_char do |c|\n    if c == "("\n      depth += 1\n      best = depth if depth > best\n    elsif c == ")"\n      depth -= 1\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Check if the Sentence Is Pangram ────────────────────────────
  (() => {
    const ref = (sentence: string) => new Set(sentence.split("")).size === 26;
    return {
      slug: "check-if-the-sentence-is-pangram",
      title: "Check if the Sentence Is Pangram",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Amazon", "TCS", "Infosys"],
      signature: { funcName: "checkIfPangram", params: [{ name: "sentence", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A **pangram** is a sentence that uses every letter of the English alphabet at least once.\n\nGiven a string `sentence` of lowercase English letters, return `true` if it is a pangram.",
        [
          { in: 'sentence = "thequickbrownfoxjumpsoverthelazydog"', out: "true" },
          { in: 'sentence = "leetcode"', out: "false" },
          { in: 'sentence = "abcdefghijklmnopqrstuvwxyz"', out: "true" },
        ],
        ["1 <= sentence.length <= 40", "sentence consists of lowercase English letters."]),
      hints: [
        "Collect the distinct letters and check whether there are 26 of them.",
        "A 26-bit mask works too: set bit `ch - 'a'` and compare the mask against `(1 << 26) - 1`.",
        "Any sentence shorter than 26 characters can be rejected immediately.",
      ],
      examples: [
        { input: '"thequickbrownfoxjumpsoverthelazydog"', expectedOutput: "true" },
        { input: '"leetcode"', expectedOutput: "false" },
        { input: '"abcdefghijklmnopqrstuvwxyz"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        let sentence: string;
        if (rng() < 0.3) {
          sentence = shuffle(rng, LOWER.split("")).join("");
          if (rng() < 0.5) {
            const extra = ri(rng, 0, 14);
            sentence = (sentence + randStr(rng, extra, extra)).slice(0, 40);
          }
        } else {
          sentence = randStr(rng, 1, 40);
        }
        return { input: `"${sentence}"`, expectedOutput: bool(ref(sentence)) };
      },
      solutions: {
        python: `def checkIfPangram(sentence: str) -> bool:\n    return len(set(sentence)) == 26`,
        javascript: `var checkIfPangram = function(sentence) {\n    const seen = new Set();\n    for (let i = 0; i < sentence.length; i++) seen.add(sentence[i]);\n    return seen.size === 26;\n};`,
              typescript: `function checkIfPangram(sentence: string): boolean {\n    var mask = 0;\n    for (var i = 0; i < sentence.length; i++) {\n        mask |= 1 << (sentence.charCodeAt(i) - 97);\n    }\n    return mask === (1 << 26) - 1;\n}`,
              java: `public static boolean checkIfPangram(String sentence) {\n    int mask = 0;\n    for (int i = 0; i < sentence.length(); i++) {\n        mask |= 1 << (sentence.charAt(i) - 'a');\n    }\n    return mask == (1 << 26) - 1;\n}`,
              cpp: `bool checkIfPangram(string sentence) {\n    int mask = 0;\n    for (char c : sentence) mask |= 1 << (c - 'a');\n    return mask == (1 << 26) - 1;\n}`,
              c: `bool checkIfPangram(const char* sentence) {\n    int mask = 0;\n    for (int i = 0; sentence[i] != '\\0'; i++) {\n        mask |= 1 << (sentence[i] - 'a');\n    }\n    return mask == (1 << 26) - 1;\n}`,
              csharp: `public static bool CheckIfPangram(string sentence)\n{\n    int mask = 0;\n    foreach (char c in sentence) mask |= 1 << (c - 'a');\n    return mask == (1 << 26) - 1;\n}`,
              go: `func checkIfPangram(sentence string) bool {\n	mask := 0\n	for i := 0; i < len(sentence); i++ {\n		mask |= 1 << uint(sentence[i]-'a')\n	}\n	return mask == (1<<26)-1\n}`,
              kotlin: `fun checkIfPangram(sentence: String): Boolean {\n    var mask = 0\n    for (c in sentence) mask = mask or (1 shl (c - 'a'))\n    return mask == (1 shl 26) - 1\n}`,
              swift: `func checkIfPangram(_ sentence: String) -> Bool {\n    var mask = 0\n    for b in Array(sentence.utf8) {\n        mask |= 1 << (Int(b) - 97)\n    }\n    return mask == (1 << 26) - 1\n}`,
              rust: `fn checkIfPangram(sentence: String) -> bool {\n    let mut mask: i32 = 0;\n    for b in sentence.as_bytes().iter() {\n        mask |= 1 << (*b - b'a');\n    }\n    mask == (1 << 26) - 1\n}`,
              php: `function checkIfPangram($sentence) {\n    $mask = 0;\n    for ($i = 0; $i < strlen($sentence); $i++) {\n        $mask |= 1 << (ord($sentence[$i]) - 97);\n    }\n    return $mask === (1 << 26) - 1;\n}`,
              ruby: `def checkIfPangram(sentence)\n  mask = 0\n  sentence.each_char { |c| mask |= 1 << (c.ord - 97) }\n  mask == (1 << 26) - 1\nend`,
      },
    };
  })(),

  // ── Truncate Sentence ───────────────────────────────────────────
  (() => {
    const ref = (s: string, k: number) => s.split(" ").slice(0, k).join(" ");
    return {
      slug: "truncate-sentence",
      title: "Truncate Sentence",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Amazon", "Cognizant"],
      signature: { funcName: "truncateSentence", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "string" as const },
      description: describe(
        "A sentence is a list of words separated by single spaces, with no leading or trailing spaces.\n\nGiven a sentence `s` and an integer `k`, truncate `s` so that it contains only the **first `k`** words, and return the result.",
        [
          { in: 's = "Hello how are you Contestant", k = 4', out: "Hello how are you" },
          { in: 's = "What is the solution to this problem", k = 4', out: "What is the solution" },
          { in: 's = "chopper is not a tanuki", k = 5', out: "chopper is not a tanuki", note: "k equals the word count, so nothing is dropped." },
        ],
        ["1 <= s.length <= 60", "1 <= k <= number of words in s", "s contains only English letters and single spaces."]),
      hints: [
        "Split on the space, take the first `k` pieces, and join them back with a space.",
        "Without splitting: count spaces as you scan and stop at the k-th one.",
      ],
      examples: [
        { input: '"Hello how are you Contestant"\n4', expectedOutput: "Hello how are you" },
        { input: '"What is the solution to this problem"\n4', expectedOutput: "What is the solution" },
        { input: '"chopper is not a tanuki"\n5', expectedOutput: "chopper is not a tanuki" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const s = randSentence(rng, n);
        const words = s.split(" ").length;
        const k = ri(rng, 1, words);
        return { input: `"${s}"\n${k}`, expectedOutput: ref(s, k) };
      },
      solutions: {
        python: `def truncateSentence(s: str, k: int) -> str:\n    return " ".join(s.split(" ")[:k])`,
        javascript: `var truncateSentence = function(s, k) {\n    return s.split(" ").slice(0, k).join(" ");\n};`,
              typescript: `function truncateSentence(s: string, k: number): string {\n    var pieces = s.split(" ");\n    var out: string[] = [];\n    for (var i = 0; i < k && i < pieces.length; i++) out.push(pieces[i]);\n    return out.join(" ");\n}`,
              java: `public static String truncateSentence(String s, int k) {\n    String[] pieces = s.split(" ");\n    StringBuilder out = new StringBuilder();\n    for (int i = 0; i < k && i < pieces.length; i++) {\n        if (i > 0) out.append(' ');\n        out.append(pieces[i]);\n    }\n    return out.toString();\n}`,
              cpp: `string truncateSentence(string s, int k) {\n    int spaces = 0;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (s[i] == ' ') {\n            spaces++;\n            if (spaces == k) return s.substr(0, i);\n        }\n    }\n    return s;\n}`,
              c: `char* truncateSentence(const char* s, int k) {\n    int n = (int) strlen(s);\n    int spaces = 0;\n    int cut = n;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == ' ') {\n            spaces++;\n            if (spaces == k) { cut = i; break; }\n        }\n    }\n    char* out = (char*) malloc(cut + 1);\n    for (int i = 0; i < cut; i++) out[i] = s[i];\n    out[cut] = '\\0';\n    return out;\n}`,
              csharp: `public static string TruncateSentence(string s, int k)\n{\n    string[] pieces = s.Split(' ');\n    var taken = new List<string>();\n    for (int i = 0; i < k && i < pieces.Length; i++) taken.Add(pieces[i]);\n    return string.Join(" ", taken);\n}`,
              go: `func truncateSentence(s string, k int) string {\n	pieces := strings.Split(s, " ")\n	if k > len(pieces) {\n		k = len(pieces)\n	}\n	return strings.Join(pieces[:k], " ")\n}`,
              kotlin: `fun truncateSentence(s: String, k: Int): String {\n    val pieces = s.split(" ")\n    val take = if (k < pieces.size) k else pieces.size\n    return pieces.subList(0, take).joinToString(" ")\n}`,
              swift: `func truncateSentence(_ s: String, _ k: Int) -> String {\n    let pieces = s.components(separatedBy: " ")\n    let take = k < pieces.count ? k : pieces.count\n    return pieces[0..<take].joined(separator: " ")\n}`,
              rust: `fn truncateSentence(s: String, k: i32) -> String {\n    let pieces: Vec<&str> = s.split(' ').collect();\n    let mut take = k as usize;\n    if take > pieces.len() {\n        take = pieces.len();\n    }\n    pieces[0..take].join(" ")\n}`,
              php: `function truncateSentence($s, $k) {\n    $pieces = explode(" ", $s);\n    return implode(" ", array_slice($pieces, 0, $k));\n}`,
              ruby: `def truncateSentence(s, k)\n  s.split(" ").first(k).join(" ")\nend`,
      },
    };
  })(),

  // ── Sorting the Sentence ────────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const parts = s.split(" ");
      const out = new Array(parts.length).fill("");
      for (let i = 0; i < parts.length; i++) {
        const w = parts[i];
        const pos = parseInt(w[w.length - 1], 10);
        out[pos - 1] = w.slice(0, w.length - 1);
      }
      return out.join(" ");
    };
    return {
      slug: "sorting-the-sentence",
      title: "Sorting the Sentence",
      difficulty: "EASY" as const,
      tags: ["String", "Sorting", "Amazon", "Zoho"],
      signature: { funcName: "sortSentence", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A sentence was **shuffled** by appending the 1-indexed position of each word to the end of that word, then rearranging the words.\n\nGiven such a shuffled sentence `s`, reconstruct and return the original sentence.",
        [
          { in: 's = "is2 sentence4 This1 a3"', out: "This is a sentence" },
          { in: 's = "Myself2 Me1 I4 and3"', out: "Me Myself and I" },
          { in: 's = "there1"', out: "there" },
        ],
        ["2 <= s.length <= 60", "Each word ends in a single digit giving its position.", "There are at most 9 words."]),
      hints: [
        "The last character of each word is its destination, 1-indexed.",
        "Strip that digit off and write the remaining word straight into its slot.",
        "Then join the slots with single spaces.",
      ],
      examples: [
        { input: '"is2 sentence4 This1 a3"', expectedOutput: "This is a sentence" },
        { input: '"Myself2 Me1 I4 and3"', expectedOutput: "Me Myself and I" },
        { input: '"there1"', expectedOutput: "there" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 7);
        const words = Array.from({ length: n }, () => WORDS[ri(rng, 0, WORDS.length - 1)]);
        const tagged = words.map((w, i) => w + String(i + 1));
        const s = shuffle(rng, tagged).join(" ");
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def sortSentence(s: str) -> str:\n    parts = s.split(" ")\n    out = [""] * len(parts)\n    for word in parts:\n        out[int(word[-1]) - 1] = word[:-1]\n    return " ".join(out)`,
        javascript: `var sortSentence = function(s) {\n    const parts = s.split(" ");\n    const out = new Array(parts.length).fill("");\n    for (let i = 0; i < parts.length; i++) {\n        const w = parts[i];\n        const pos = parseInt(w[w.length - 1], 10);\n        out[pos - 1] = w.slice(0, w.length - 1);\n    }\n    return out.join(" ");\n};`,
              typescript: `function sortSentence(s: string): string {\n    var pieces = s.split(" ");\n    var out: string[] = [];\n    for (var k = 0; k < pieces.length; k++) out.push("");\n    for (var i = 0; i < pieces.length; i++) {\n        var w = pieces[i];\n        var pos = parseInt(w.charAt(w.length - 1), 10);\n        out[pos - 1] = w.substring(0, w.length - 1);\n    }\n    return out.join(" ");\n}`,
              java: `public static String sortSentence(String s) {\n    String[] pieces = s.split(" ");\n    String[] out = new String[pieces.length];\n    for (String w : pieces) {\n        int pos = w.charAt(w.length() - 1) - '0';\n        out[pos - 1] = w.substring(0, w.length() - 1);\n    }\n    return String.join(" ", out);\n}`,
              cpp: `string sortSentence(string s) {\n    vector<string> pieces;\n    string cur = "";\n    for (char c : s) {\n        if (c == ' ') { pieces.push_back(cur); cur = ""; }\n        else cur += c;\n    }\n    pieces.push_back(cur);\n    vector<string> out(pieces.size());\n    for (string& w : pieces) {\n        int pos = w[w.size() - 1] - '0';\n        out[pos - 1] = w.substr(0, w.size() - 1);\n    }\n    string result = "";\n    for (size_t i = 0; i < out.size(); i++) {\n        if (i > 0) result += " ";\n        result += out[i];\n    }\n    return result;\n}`,
              c: `char* sortSentence(const char* s) {\n    int n = (int) strlen(s);\n    char words[10][32];\n    int count = 0;\n    int i = 0;\n    while (i < n) {\n        int j = i;\n        while (j < n && s[j] != ' ') j++;\n        int pos = s[j - 1] - '0';\n        int len = j - i - 1;\n        for (int k = 0; k < len; k++) words[pos - 1][k] = s[i + k];\n        words[pos - 1][len] = '\\0';\n        count++;\n        i = j + 1;\n    }\n    char* out = (char*) malloc(n + 1);\n    int pos = 0;\n    for (int w = 0; w < count; w++) {\n        if (w > 0) out[pos++] = ' ';\n        for (int k = 0; words[w][k] != '\\0'; k++) out[pos++] = words[w][k];\n    }\n    out[pos] = '\\0';\n    return out;\n}`,
              csharp: `public static string SortSentence(string s)\n{\n    string[] pieces = s.Split(' ');\n    string[] out_ = new string[pieces.Length];\n    foreach (string w in pieces)\n    {\n        int pos = w[w.Length - 1] - '0';\n        out_[pos - 1] = w.Substring(0, w.Length - 1);\n    }\n    return string.Join(" ", out_);\n}`,
              go: `func sortSentence(s string) string {\n	pieces := strings.Split(s, " ")\n	out := make([]string, len(pieces))\n	for _, w := range pieces {\n		pos := int(w[len(w)-1] - '0')\n		out[pos-1] = w[:len(w)-1]\n	}\n	return strings.Join(out, " ")\n}`,
              kotlin: `fun sortSentence(s: String): String {\n    val pieces = s.split(" ")\n    val out = arrayOfNulls<String>(pieces.size)\n    for (w in pieces) {\n        val pos = w[w.length - 1] - '0'\n        out[pos - 1] = w.substring(0, w.length - 1)\n    }\n    return out.joinToString(" ")\n}`,
              swift: `func sortSentence(_ s: String) -> String {\n    let pieces = s.components(separatedBy: " ")\n    var out = [String](repeating: "", count: pieces.count)\n    for w in pieces {\n        let chars = Array(w)\n        let pos = Int(String(chars[chars.count - 1]))!\n        out[pos - 1] = String(chars[0..<(chars.count - 1)])\n    }\n    return out.joined(separator: " ")\n}`,
              rust: `fn sortSentence(s: String) -> String {\n    let pieces: Vec<&str> = s.split(' ').collect();\n    let mut out: Vec<String> = vec![String::new(); pieces.len()];\n    for w in pieces.iter() {\n        let bytes = w.as_bytes();\n        let pos = (bytes[bytes.len() - 1] - b'0') as usize;\n        out[pos - 1] = w[0..w.len() - 1].to_string();\n    }\n    out.join(" ")\n}`,
              php: `function sortSentence($s) {\n    $pieces = explode(" ", $s);\n    $out = array_fill(0, count($pieces), "");\n    foreach ($pieces as $w) {\n        $pos = intval($w[strlen($w) - 1]);\n        $out[$pos - 1] = substr($w, 0, strlen($w) - 1);\n    }\n    return implode(" ", $out);\n}`,
              ruby: `def sortSentence(s)\n  pieces = s.split(" ")\n  out = Array.new(pieces.length, "")\n  pieces.each do |w|\n    pos = w[-1].to_i\n    out[pos - 1] = w[0...-1]\n  end\n  out.join(" ")\nend`,
      },
    };
  })(),

  // ── Number of Segments in a String ──────────────────────────────
  (() => {
    const ref = (s: string) => s.split(" ").filter((w) => w.length > 0).length;
    return {
      slug: "number-of-segments-in-a-string",
      title: "Number of Segments in a String",
      difficulty: "EASY" as const,
      tags: ["String", "Amazon", "Infosys", "Wipro"],
      signature: { funcName: "countSegments", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s`, return the number of **segments** in it.\n\nA segment is a maximal run of non-space characters.",
        [
          { in: 's = "Hello, my name is John"', out: "5" },
          { in: 's = "Hello"', out: "1" },
          { in: 's = "   "', out: "0" },
        ],
        ["0 <= s.length <= 60", "s consists of printable ASCII characters and spaces."]),
      hints: [
        "A segment begins at a non-space character whose predecessor is a space or the start of the string.",
        "Counting those starts in one pass avoids allocating a word list.",
        "Careful with a string that is all spaces, or empty — both answer 0.",
      ],
      examples: [
        { input: '"Hello, my name is John"', expectedOutput: "5" },
        { input: '"Hello"', expectedOutput: "1" },
        { input: '"   "', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const parts: string[] = [];
        const n = ri(rng, 0, 7);
        for (let i = 0; i < n; i++) {
          parts.push(WORDS[ri(rng, 0, WORDS.length - 1)]);
          if (rng() < 0.35) parts.push("");
        }
        let s = parts.join(" ");
        if (rng() < 0.4) s = "  " + s;
        if (rng() < 0.4) s = s + "  ";
        s = s.slice(0, 60);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def countSegments(s: str) -> int:\n    return len(s.split())`,
        javascript: `var countSegments = function(s) {\n    let count = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] !== " " && (i === 0 || s[i - 1] === " ")) count++;\n    }\n    return count;\n};`,
              typescript: `function countSegments(s: string): number {\n    var count = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) !== " " && (i === 0 || s.charAt(i - 1) === " ")) count++;\n    }\n    return count;\n}`,
              java: `public static int countSegments(String s) {\n    int count = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) != ' ' && (i == 0 || s.charAt(i - 1) == ' ')) count++;\n    }\n    return count;\n}`,
              cpp: `int countSegments(string s) {\n    int count = 0;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (s[i] != ' ' && (i == 0 || s[i - 1] == ' ')) count++;\n    }\n    return count;\n}`,
              c: `int countSegments(const char* s) {\n    int count = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        if (s[i] != ' ' && (i == 0 || s[i - 1] == ' ')) count++;\n    }\n    return count;\n}`,
              csharp: `public static int CountSegments(string s)\n{\n    int count = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (s[i] != ' ' && (i == 0 || s[i - 1] == ' ')) count++;\n    }\n    return count;\n}`,
              go: `func countSegments(s string) int {\n	count := 0\n	for i := 0; i < len(s); i++ {\n		if s[i] != ' ' && (i == 0 || s[i-1] == ' ') {\n			count++\n		}\n	}\n	return count\n}`,
              kotlin: `fun countSegments(s: String): Int {\n    var count = 0\n    for (i in s.indices) {\n        if (s[i] != ' ' && (i == 0 || s[i - 1] == ' ')) count++\n    }\n    return count\n}`,
              swift: `func countSegments(_ s: String) -> Int {\n    let chars = Array(s)\n    var count = 0\n    for i in 0..<chars.count {\n        if chars[i] != " " && (i == 0 || chars[i - 1] == " ") { count += 1 }\n    }\n    return count\n}`,
              rust: `fn countSegments(s: String) -> i32 {\n    let bytes = s.as_bytes();\n    let mut count = 0;\n    for i in 0..bytes.len() {\n        if bytes[i] != b' ' && (i == 0 || bytes[i - 1] == b' ') {\n            count += 1;\n        }\n    }\n    count\n}`,
              php: `function countSegments($s) {\n    $count = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] !== " " && ($i === 0 || $s[$i - 1] === " ")) $count++;\n    }\n    return $count;\n}`,
              ruby: `def countSegments(s)\n  count = 0\n  s.each_char.with_index do |c, i|\n    count += 1 if c != " " && (i == 0 || s[i - 1] == " ")\n  end\n  count\nend`,
      },
    };
  })(),

  // ── License Key Formatting ──────────────────────────────────────
  (() => {
    const ref = (s: string, k: number) => {
      const clean: string[] = [];
      for (let i = 0; i < s.length; i++) if (s[i] !== "-") clean.push(s[i].toUpperCase());
      if (clean.length === 0) return "";
      const first = clean.length % k === 0 ? k : clean.length % k;
      const groups: string[] = [clean.slice(0, first).join("")];
      for (let i = first; i < clean.length; i += k) groups.push(clean.slice(i, i + k).join(""));
      return groups.join("-");
    };
    return {
      slug: "license-key-formatting",
      title: "License Key Formatting",
      difficulty: "EASY" as const,
      tags: ["String", "Google", "Amazon", "Capital One"],
      signature: { funcName: "licenseKeyFormatting", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "string" as const },
      description: describe(
        "You are given a licence key `s` made of alphanumeric characters and dashes, and an integer `k`.\n\nReformat it so that every group contains exactly `k` characters, except the **first** group, which may be shorter but must contain at least one character. Groups are joined by a single dash, and every letter is converted to uppercase.",
        [
          { in: 's = "5F3Z-2e-9-w", k = 4', out: "5F3Z-2E9W" },
          { in: 's = "2-5g-3-J", k = 2', out: "2-5G-3J" },
          { in: 's = "---", k = 3', out: "", note: "Nothing but dashes leaves an empty key." },
        ],
        ["1 <= s.length <= 40", "s consists of English letters, digits and dashes.", "1 <= k <= 40"]),
      hints: [
        "First strip every dash and uppercase what remains — the grouping is decided only by that cleaned string.",
        "The first group's size is `len % k`, or the full `k` when the length divides evenly.",
        "Building from the right in chunks of `k` gives the same answer without the modulo case.",
      ],
      examples: [
        { input: '"5F3Z-2e-9-w"\n4', expectedOutput: "5F3Z-2E9W" },
        { input: '"2-5g-3-J"\n2', expectedOutput: "2-5G-3J" },
        { input: '"---"\n3', expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const pool = "abcdefABCDEF0123456789-";
        const s = randStr(rng, 1, 40, pool);
        const k = ri(rng, 1, 6);
        return { input: `"${s}"\n${k}`, expectedOutput: ref(s, k) };
      },
      solutions: {
        python: `def licenseKeyFormatting(s: str, k: int) -> str:\n    clean = [ch.upper() for ch in s if ch != "-"]\n    if not clean:\n        return ""\n    first = len(clean) % k or k\n    groups = ["".join(clean[:first])]\n    for i in range(first, len(clean), k):\n        groups.append("".join(clean[i:i + k]))\n    return "-".join(groups)`,
        javascript: `var licenseKeyFormatting = function(s, k) {\n    const clean = [];\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] !== "-") clean.push(s[i].toUpperCase());\n    }\n    if (clean.length === 0) return "";\n    const first = clean.length % k === 0 ? k : clean.length % k;\n    const groups = [clean.slice(0, first).join("")];\n    for (let i = first; i < clean.length; i += k) {\n        groups.push(clean.slice(i, i + k).join(""));\n    }\n    return groups.join("-");\n};`,
              typescript: `function licenseKeyFormatting(s: string, k: number): string {\n    var clean: string[] = [];\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) !== "-") clean.push(s.charAt(i).toUpperCase());\n    }\n    if (clean.length === 0) return "";\n    var first = clean.length % k === 0 ? k : clean.length % k;\n    var groups: string[] = [clean.slice(0, first).join("")];\n    for (var j = first; j < clean.length; j += k) {\n        groups.push(clean.slice(j, j + k).join(""));\n    }\n    return groups.join("-");\n}`,
              java: `public static String licenseKeyFormatting(String s, int k) {\n    StringBuilder clean = new StringBuilder();\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) != '-') clean.append(Character.toUpperCase(s.charAt(i)));\n    }\n    int n = clean.length();\n    if (n == 0) return "";\n    int first = n % k == 0 ? k : n % k;\n    StringBuilder out = new StringBuilder(clean.substring(0, first));\n    for (int i = first; i < n; i += k) {\n        out.append('-').append(clean, i, i + k);\n    }\n    return out.toString();\n}`,
              cpp: `string licenseKeyFormatting(string s, int k) {\n    string clean = "";\n    for (char c : s) {\n        if (c != '-') clean += (char) toupper(c);\n    }\n    int n = (int) clean.size();\n    if (n == 0) return "";\n    int first = n % k == 0 ? k : n % k;\n    string out = clean.substr(0, first);\n    for (int i = first; i < n; i += k) {\n        out += "-";\n        out += clean.substr(i, k);\n    }\n    return out;\n}`,
              c: `char* licenseKeyFormatting(const char* s, int k) {\n    int n = (int) strlen(s);\n    char* clean = (char*) malloc(n + 1);\n    int len = 0;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == '-') continue;\n        char c = s[i];\n        if (c >= 'a' && c <= 'z') c = (char) (c - 'a' + 'A');\n        clean[len++] = c;\n    }\n    char* out = (char*) malloc(2 * n + 2);\n    if (len == 0) {\n        out[0] = '\\0';\n        free(clean);\n        return out;\n    }\n    int first = len % k == 0 ? k : len % k;\n    int pos = 0;\n    for (int i = 0; i < first; i++) out[pos++] = clean[i];\n    for (int i = first; i < len; i += k) {\n        out[pos++] = '-';\n        for (int j = 0; j < k && i + j < len; j++) out[pos++] = clean[i + j];\n    }\n    out[pos] = '\\0';\n    free(clean);\n    return out;\n}`,
              csharp: `public static string LicenseKeyFormatting(string s, int k)\n{\n    var clean = new System.Text.StringBuilder();\n    foreach (char c in s)\n    {\n        if (c != '-') clean.Append(char.ToUpper(c));\n    }\n    int n = clean.Length;\n    if (n == 0) return "";\n    int first = n % k == 0 ? k : n % k;\n    var out_ = new System.Text.StringBuilder(clean.ToString(0, first));\n    for (int i = first; i < n; i += k)\n    {\n        out_.Append('-').Append(clean.ToString(i, k));\n    }\n    return out_.ToString();\n}`,
              go: `func licenseKeyFormatting(s string, k int) string {\n	clean := []byte{}\n	for i := 0; i < len(s); i++ {\n		c := s[i]\n		if c == '-' {\n			continue\n		}\n		if c >= 'a' && c <= 'z' {\n			c = c - 'a' + 'A'\n		}\n		clean = append(clean, c)\n	}\n	n := len(clean)\n	if n == 0 {\n		return ""\n	}\n	first := n % k\n	if first == 0 {\n		first = k\n	}\n	var sb strings.Builder\n	sb.Write(clean[:first])\n	for i := first; i < n; i += k {\n		sb.WriteByte('-')\n		sb.Write(clean[i : i+k])\n	}\n	return sb.String()\n}`,
              kotlin: `fun licenseKeyFormatting(s: String, k: Int): String {\n    val clean = StringBuilder()\n    for (c in s) {\n        if (c != '-') clean.append(c.toUpperCase())\n    }\n    val n = clean.length\n    if (n == 0) return ""\n    val first = if (n % k == 0) k else n % k\n    val out = StringBuilder(clean.substring(0, first))\n    var i = first\n    while (i < n) {\n        out.append('-').append(clean.substring(i, i + k))\n        i += k\n    }\n    return out.toString()\n}`,
              swift: `func licenseKeyFormatting(_ s: String, _ k: Int) -> String {\n    var clean: [Character] = []\n    for c in s where c != "-" {\n        clean.append(Character(String(c).uppercased()))\n    }\n    let n = clean.count\n    if n == 0 { return "" }\n    let first = n % k == 0 ? k : n % k\n    var groups: [String] = [String(clean[0..<first])]\n    var i = first\n    while i < n {\n        groups.append(String(clean[i..<(i + k)]))\n        i += k\n    }\n    return groups.joined(separator: "-")\n}`,
              rust: `fn licenseKeyFormatting(s: String, k: i32) -> String {\n    let step = k as usize;\n    let clean: Vec<u8> = s\n        .as_bytes()\n        .iter()\n        .filter(|c| **c != b'-')\n        .map(|c| c.to_ascii_uppercase())\n        .collect();\n    let n = clean.len();\n    if n == 0 {\n        return String::new();\n    }\n    let first = if n % step == 0 { step } else { n % step };\n    let mut groups: Vec<String> = vec![String::from_utf8(clean[0..first].to_vec()).unwrap()];\n    let mut i = first;\n    while i < n {\n        groups.push(String::from_utf8(clean[i..i + step].to_vec()).unwrap());\n        i += step;\n    }\n    groups.join("-")\n}`,
              php: `function licenseKeyFormatting($s, $k) {\n    $clean = "";\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] !== "-") $clean .= strtoupper($s[$i]);\n    }\n    $n = strlen($clean);\n    if ($n === 0) return "";\n    $first = $n % $k === 0 ? $k : $n % $k;\n    $groups = array(substr($clean, 0, $first));\n    for ($i = $first; $i < $n; $i += $k) {\n        $groups[] = substr($clean, $i, $k);\n    }\n    return implode("-", $groups);\n}`,
              ruby: `def licenseKeyFormatting(s, k)\n  clean = s.delete("-").upcase\n  n = clean.length\n  return "" if n == 0\n  first = n % k == 0 ? k : n % k\n  groups = [clean[0, first]]\n  i = first\n  while i < n\n    groups << clean[i, k]\n    i += k\n  end\n  groups.join("-")\nend`,
      },
    };
  })(),

  // ── Custom Sort String ──────────────────────────────────────────
  (() => {
    const ref = (order: string, s: string) => {
      const count = new Map<string, number>();
      for (let i = 0; i < s.length; i++) count.set(s[i], (count.get(s[i]) ?? 0) + 1);
      let out = "";
      for (let i = 0; i < order.length; i++) {
        const c = count.get(order[i]);
        if (c) { out += order[i].repeat(c); count.delete(order[i]); }
      }
      for (let i = 0; i < s.length; i++) {
        if (count.has(s[i])) out += s[i];
      }
      return out;
    };
    return {
      slug: "custom-sort-string",
      title: "Custom Sort String",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Sorting", "Meta", "Amazon", "Bloomberg"],
      signature: { funcName: "customSortString", params: [{ name: "order", type: "string" as const }, { name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given two strings, `order` and `s`. The characters of `order` are distinct and were sorted into a custom order.\n\nPermute `s` so that characters appearing in `order` come first, grouped and arranged in exactly that order. Characters of `s` that do **not** appear in `order` follow, keeping their original relative order.",
        [
          { in: 'order = "cba", s = "abcd"', out: "cbad", note: "c, b and a follow the custom order; d is not in order, so it keeps its place at the end." },
          { in: 'order = "bcafg", s = "abcd"', out: "bcad" },
          { in: 'order = "xyz", s = "abc"', out: "abc", note: "Nothing in s appears in order, so s is unchanged." },
        ],
        ["1 <= order.length <= 26", "1 <= s.length <= 40", "Both consist of lowercase English letters.", "The characters of order are distinct."]),
      hints: [
        "Count the letters of `s`; the answer needs the multiplicities, not the positions.",
        "Walk `order` and emit each of its letters as many times as `s` contains it.",
        "Then walk `s` once more and emit only the letters that `order` never mentioned — that pass is what preserves their relative order.",
      ],
      examples: [
        { input: '"cba"\n"abcd"', expectedOutput: "cbad" },
        { input: '"bcafg"\n"abcd"', expectedOutput: "bcad" },
        { input: '"xyz"\n"abc"', expectedOutput: "abc" },
      ],
      gen: (rng: Rng) => {
        const letters = shuffle(rng, "abcdefgh".split(""));
        const order = letters.slice(0, ri(rng, 1, 6)).join("");
        const s = randStr(rng, 1, 30, "abcdefgh");
        return { input: `"${order}"\n"${s}"`, expectedOutput: ref(order, s) };
      },
      solutions: {
        python: `def customSortString(order: str, s: str) -> str:\n    count = {}\n    for ch in s:\n        count[ch] = count.get(ch, 0) + 1\n    parts = []\n    for ch in order:\n        if ch in count:\n            parts.append(ch * count[ch])\n            del count[ch]\n    for ch in s:\n        if ch in count:\n            parts.append(ch)\n    return "".join(parts)`,
        javascript: `var customSortString = function(order, s) {\n    const count = new Map();\n    for (let i = 0; i < s.length; i++) {\n        count.set(s[i], (count.get(s[i]) || 0) + 1);\n    }\n    let out = "";\n    for (let i = 0; i < order.length; i++) {\n        const c = count.get(order[i]);\n        if (c) {\n            for (let k = 0; k < c; k++) out += order[i];\n            count.delete(order[i]);\n        }\n    }\n    for (let i = 0; i < s.length; i++) {\n        if (count.has(s[i])) out += s[i];\n    }\n    return out;\n};`,
              typescript: `function customSortString(order: string, s: string): string {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < s.length; i++) {\n        var ch = s.charAt(i);\n        count[ch] = (count[ch] === undefined ? 0 : count[ch]) + 1;\n    }\n    var out = "";\n    var used: { [key: string]: boolean } = {};\n    for (var j = 0; j < order.length; j++) {\n        var oc = order.charAt(j);\n        var c = count[oc];\n        if (c !== undefined && c > 0) {\n            for (var r = 0; r < c; r++) out += oc;\n        }\n        used[oc] = true;\n    }\n    for (var m = 0; m < s.length; m++) {\n        if (used[s.charAt(m)] !== true) out += s.charAt(m);\n    }\n    return out;\n}`,
              java: `public static String customSortString(String order, String s) {\n    int[] count = new int[26];\n    for (int i = 0; i < s.length(); i++) count[s.charAt(i) - 'a']++;\n    boolean[] used = new boolean[26];\n    StringBuilder out = new StringBuilder();\n    for (int i = 0; i < order.length(); i++) {\n        int idx = order.charAt(i) - 'a';\n        for (int r = 0; r < count[idx]; r++) out.append(order.charAt(i));\n        used[idx] = true;\n    }\n    for (int i = 0; i < s.length(); i++) {\n        if (!used[s.charAt(i) - 'a']) out.append(s.charAt(i));\n    }\n    return out.toString();\n}`,
              cpp: `string customSortString(string order, string s) {\n    int count[26] = {0};\n    for (char c : s) count[c - 'a']++;\n    bool used[26] = {false};\n    string out = "";\n    for (char c : order) {\n        for (int r = 0; r < count[c - 'a']; r++) out += c;\n        used[c - 'a'] = true;\n    }\n    for (char c : s) {\n        if (!used[c - 'a']) out += c;\n    }\n    return out;\n}`,
              c: `char* customSortString(const char* order, const char* s) {\n    int count[26] = {0};\n    int n = (int) strlen(s);\n    for (int i = 0; i < n; i++) count[s[i] - 'a']++;\n    bool used[26] = {false};\n    char* out = (char*) malloc(n + 1);\n    int pos = 0;\n    for (int i = 0; order[i] != '\\0'; i++) {\n        int idx = order[i] - 'a';\n        for (int r = 0; r < count[idx]; r++) out[pos++] = order[i];\n        used[idx] = true;\n    }\n    for (int i = 0; i < n; i++) {\n        if (!used[s[i] - 'a']) out[pos++] = s[i];\n    }\n    out[pos] = '\\0';\n    return out;\n}`,
              csharp: `public static string CustomSortString(string order, string s)\n{\n    int[] count = new int[26];\n    foreach (char c in s) count[c - 'a']++;\n    bool[] used = new bool[26];\n    var out_ = new System.Text.StringBuilder();\n    foreach (char c in order)\n    {\n        for (int r = 0; r < count[c - 'a']; r++) out_.Append(c);\n        used[c - 'a'] = true;\n    }\n    foreach (char c in s)\n    {\n        if (!used[c - 'a']) out_.Append(c);\n    }\n    return out_.ToString();\n}`,
              go: `func customSortString(order string, s string) string {\n	var count [26]int\n	for i := 0; i < len(s); i++ {\n		count[s[i]-'a']++\n	}\n	var used [26]bool\n	var sb strings.Builder\n	for i := 0; i < len(order); i++ {\n		idx := order[i] - 'a'\n		for r := 0; r < count[idx]; r++ {\n			sb.WriteByte(order[i])\n		}\n		used[idx] = true\n	}\n	for i := 0; i < len(s); i++ {\n		if !used[s[i]-'a'] {\n			sb.WriteByte(s[i])\n		}\n	}\n	return sb.String()\n}`,
              kotlin: `fun customSortString(order: String, s: String): String {\n    val count = IntArray(26)\n    for (c in s) count[c - 'a']++\n    val used = BooleanArray(26)\n    val out = StringBuilder()\n    for (c in order) {\n        val idx = c - 'a'\n        for (r in 0 until count[idx]) out.append(c)\n        used[idx] = true\n    }\n    for (c in s) {\n        if (!used[c - 'a']) out.append(c)\n    }\n    return out.toString()\n}`,
              swift: `func customSortString(_ order: String, _ s: String) -> String {\n    var count = [Int](repeating: 0, count: 26)\n    let sb = Array(s.utf8)\n    for b in sb { count[Int(b) - 97] += 1 }\n    var used = [Bool](repeating: false, count: 26)\n    var out = ""\n    for b in Array(order.utf8) {\n        let idx = Int(b) - 97\n        for _ in 0..<count[idx] {\n            out.append(Character(UnicodeScalar(b)))\n        }\n        used[idx] = true\n    }\n    for b in sb {\n        if !used[Int(b) - 97] {\n            out.append(Character(UnicodeScalar(b)))\n        }\n    }\n    return out\n}`,
              rust: `fn customSortString(order: String, s: String) -> String {\n    let sb = s.as_bytes();\n    let mut count = [0usize; 26];\n    for b in sb.iter() {\n        count[(*b - b'a') as usize] += 1;\n    }\n    let mut used = [false; 26];\n    let mut out: Vec<u8> = Vec::new();\n    for b in order.as_bytes().iter() {\n        let idx = (*b - b'a') as usize;\n        for _ in 0..count[idx] {\n            out.push(*b);\n        }\n        used[idx] = true;\n    }\n    for b in sb.iter() {\n        if !used[(*b - b'a') as usize] {\n            out.push(*b);\n        }\n    }\n    String::from_utf8(out).unwrap()\n}`,
              php: `function customSortString($order, $s) {\n    $count = array_fill(0, 26, 0);\n    for ($i = 0; $i < strlen($s); $i++) $count[ord($s[$i]) - 97]++;\n    $used = array_fill(0, 26, false);\n    $out = "";\n    for ($i = 0; $i < strlen($order); $i++) {\n        $idx = ord($order[$i]) - 97;\n        for ($r = 0; $r < $count[$idx]; $r++) $out .= $order[$i];\n        $used[$idx] = true;\n    }\n    for ($i = 0; $i < strlen($s); $i++) {\n        if (!$used[ord($s[$i]) - 97]) $out .= $s[$i];\n    }\n    return $out;\n}`,
              ruby: `def customSortString(order, s)\n  count = Array.new(26, 0)\n  s.each_char { |c| count[c.ord - 97] += 1 }\n  used = Array.new(26, false)\n  out = ""\n  order.each_char do |c|\n    idx = c.ord - 97\n    out += c * count[idx]\n    used[idx] = true\n  end\n  s.each_char do |c|\n    out += c unless used[c.ord - 97]\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Buddy Strings ───────────────────────────────────────────────
  (() => {
    const ref = (s: string, goal: string) => {
      if (s.length !== goal.length) return false;
      if (s === goal) return new Set(s.split("")).size < s.length;
      const diff: number[] = [];
      for (let i = 0; i < s.length; i++) if (s[i] !== goal[i]) diff.push(i);
      return diff.length === 2 && s[diff[0]] === goal[diff[1]] && s[diff[1]] === goal[diff[0]];
    };
    return {
      slug: "buddy-strings",
      title: "Buddy Strings",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Google", "Amazon", "Adobe"],
      signature: { funcName: "buddyStrings", params: [{ name: "s", type: "string" as const }, { name: "goal", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given two strings `s` and `goal`, return `true` if you can swap **exactly two** characters of `s` — at two different positions — so that the result equals `goal`.",
        [
          { in: 's = "ab", goal = "ba"', out: "true" },
          { in: 's = "ab", goal = "ab"', out: "false", note: "Any swap changes the string, since every letter is distinct." },
          { in: 's = "aa", goal = "aa"', out: "true", note: "Swapping the two a's leaves the string unchanged." },
        ],
        ["1 <= s.length, goal.length <= 40", "Both consist of lowercase English letters."]),
      hints: [
        "Different lengths can never be buddies.",
        "If the strings are already equal, the swap must be a no-op — which needs a repeated letter somewhere.",
        "Otherwise there must be exactly two mismatched positions, and they must be each other's mirror image.",
      ],
      examples: [
        { input: '"ab"\n"ba"', expectedOutput: "true" },
        { input: '"ab"\n"ab"', expectedOutput: "false" },
        { input: '"aa"\n"aa"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 1, 20, "abcd");
        let goal: string;
        const roll = rng();
        if (roll < 0.3) {
          goal = s;
        } else if (roll < 0.7 && s.length >= 2) {
          const chars = s.split("");
          const i = ri(rng, 0, chars.length - 1);
          let j = ri(rng, 0, chars.length - 1);
          while (j === i) j = ri(rng, 0, chars.length - 1);
          const t = chars[i]; chars[i] = chars[j]; chars[j] = t;
          goal = chars.join("");
        } else {
          goal = randStr(rng, 1, 20, "abcd");
        }
        return { input: `"${s}"\n"${goal}"`, expectedOutput: bool(ref(s, goal)) };
      },
      solutions: {
        python: `def buddyStrings(s: str, goal: str) -> bool:\n    if len(s) != len(goal):\n        return False\n    if s == goal:\n        return len(set(s)) < len(s)\n    diff = [i for i in range(len(s)) if s[i] != goal[i]]\n    return len(diff) == 2 and s[diff[0]] == goal[diff[1]] and s[diff[1]] == goal[diff[0]]`,
        javascript: `var buddyStrings = function(s, goal) {\n    if (s.length !== goal.length) return false;\n    if (s === goal) {\n        const seen = new Set();\n        for (let i = 0; i < s.length; i++) seen.add(s[i]);\n        return seen.size < s.length;\n    }\n    const diff = [];\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] !== goal[i]) diff.push(i);\n    }\n    return diff.length === 2 && s[diff[0]] === goal[diff[1]] && s[diff[1]] === goal[diff[0]];\n};`,
              typescript: `function buddyStrings(s: string, goal: string): boolean {\n    if (s.length !== goal.length) return false;\n    if (s === goal) {\n        var seen: { [key: string]: boolean } = {};\n        var distinct = 0;\n        for (var i = 0; i < s.length; i++) {\n            if (seen[s.charAt(i)] !== true) {\n                seen[s.charAt(i)] = true;\n                distinct++;\n            }\n        }\n        return distinct < s.length;\n    }\n    var diff: number[] = [];\n    for (var j = 0; j < s.length; j++) {\n        if (s.charAt(j) !== goal.charAt(j)) diff.push(j);\n    }\n    return diff.length === 2 && s.charAt(diff[0]) === goal.charAt(diff[1]) && s.charAt(diff[1]) === goal.charAt(diff[0]);\n}`,
              java: `public static boolean buddyStrings(String s, String goal) {\n    if (s.length() != goal.length()) return false;\n    if (s.equals(goal)) {\n        Set<Character> seen = new HashSet<>();\n        for (int i = 0; i < s.length(); i++) seen.add(s.charAt(i));\n        return seen.size() < s.length();\n    }\n    List<Integer> diff = new ArrayList<>();\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) != goal.charAt(i)) diff.add(i);\n    }\n    return diff.size() == 2\n        && s.charAt(diff.get(0)) == goal.charAt(diff.get(1))\n        && s.charAt(diff.get(1)) == goal.charAt(diff.get(0));\n}`,
              cpp: `bool buddyStrings(string s, string goal) {\n    if (s.size() != goal.size()) return false;\n    if (s == goal) {\n        unordered_set<char> seen(s.begin(), s.end());\n        return seen.size() < s.size();\n    }\n    vector<int> diff;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (s[i] != goal[i]) diff.push_back(i);\n    }\n    return diff.size() == 2 && s[diff[0]] == goal[diff[1]] && s[diff[1]] == goal[diff[0]];\n}`,
              c: `bool buddyStrings(const char* s, const char* goal) {\n    int n = (int) strlen(s);\n    int m = (int) strlen(goal);\n    if (n != m) return false;\n    if (strcmp(s, goal) == 0) {\n        int count[26] = {0};\n        for (int i = 0; i < n; i++) {\n            count[s[i] - 'a']++;\n            if (count[s[i] - 'a'] > 1) return true;\n        }\n        return false;\n    }\n    int first = -1, second = -1, total = 0;\n    for (int i = 0; i < n; i++) {\n        if (s[i] != goal[i]) {\n            total++;\n            if (total == 1) first = i;\n            else if (total == 2) second = i;\n            else return false;\n        }\n    }\n    return total == 2 && s[first] == goal[second] && s[second] == goal[first];\n}`,
              csharp: `public static bool BuddyStrings(string s, string goal)\n{\n    if (s.Length != goal.Length) return false;\n    if (s == goal)\n    {\n        var seen = new HashSet<char>(s);\n        return seen.Count < s.Length;\n    }\n    var diff = new List<int>();\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (s[i] != goal[i]) diff.Add(i);\n    }\n    return diff.Count == 2\n        && s[diff[0]] == goal[diff[1]]\n        && s[diff[1]] == goal[diff[0]];\n}`,
              go: `func buddyStrings(s string, goal string) bool {\n	if len(s) != len(goal) {\n		return false\n	}\n	if s == goal {\n		seen := make(map[byte]bool)\n		for i := 0; i < len(s); i++ {\n			if seen[s[i]] {\n				return true\n			}\n			seen[s[i]] = true\n		}\n		return false\n	}\n	diff := []int{}\n	for i := 0; i < len(s); i++ {\n		if s[i] != goal[i] {\n			diff = append(diff, i)\n		}\n	}\n	return len(diff) == 2 && s[diff[0]] == goal[diff[1]] && s[diff[1]] == goal[diff[0]]\n}`,
              kotlin: `fun buddyStrings(s: String, goal: String): Boolean {\n    if (s.length != goal.length) return false\n    if (s == goal) {\n        return s.toHashSet().size < s.length\n    }\n    val diff = ArrayList<Int>()\n    for (i in s.indices) {\n        if (s[i] != goal[i]) diff.add(i)\n    }\n    return diff.size == 2 && s[diff[0]] == goal[diff[1]] && s[diff[1]] == goal[diff[0]]\n}`,
              swift: `func buddyStrings(_ s: String, _ goal: String) -> Bool {\n    let a = Array(s)\n    let b = Array(goal)\n    if a.count != b.count { return false }\n    if s == goal {\n        return Set(a).count < a.count\n    }\n    var diff: [Int] = []\n    for i in 0..<a.count {\n        if a[i] != b[i] { diff.append(i) }\n    }\n    return diff.count == 2 && a[diff[0]] == b[diff[1]] && a[diff[1]] == b[diff[0]]\n}`,
              rust: `fn buddyStrings(s: String, goal: String) -> bool {\n    use std::collections::HashSet;\n    let a = s.as_bytes();\n    let b = goal.as_bytes();\n    if a.len() != b.len() {\n        return false;\n    }\n    if s == goal {\n        let seen: HashSet<u8> = a.iter().cloned().collect();\n        return seen.len() < a.len();\n    }\n    let mut diff: Vec<usize> = Vec::new();\n    for i in 0..a.len() {\n        if a[i] != b[i] {\n            diff.push(i);\n        }\n    }\n    diff.len() == 2 && a[diff[0]] == b[diff[1]] && a[diff[1]] == b[diff[0]]\n}`,
              php: `function buddyStrings($s, $goal) {\n    if (strlen($s) !== strlen($goal)) return false;\n    if ($s === $goal) {\n        return count(array_unique(str_split($s))) < strlen($s);\n    }\n    $diff = array();\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] !== $goal[$i]) $diff[] = $i;\n    }\n    return count($diff) === 2 && $s[$diff[0]] === $goal[$diff[1]] && $s[$diff[1]] === $goal[$diff[0]];\n}`,
              ruby: `def buddyStrings(s, goal)\n  return false if s.length != goal.length\n  return s.chars.uniq.length < s.length if s == goal\n  diff = (0...s.length).select { |i| s[i] != goal[i] }\n  diff.length == 2 && s[diff[0]] == goal[diff[1]] && s[diff[1]] == goal[diff[0]]\nend`,
      },
    };
  })(),

  // ── Rotate String ───────────────────────────────────────────────
  (() => {
    const ref = (s: string, goal: string) => s.length === goal.length && (s + s).indexOf(goal) >= 0;
    return {
      slug: "rotate-string",
      title: "Rotate String",
      difficulty: "EASY" as const,
      tags: ["String", "String Matching", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "rotateString", params: [{ name: "s", type: "string" as const }, { name: "goal", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given two strings `s` and `goal`, return `true` if `s` can become `goal` after some number of **left shifts**.\n\nA left shift moves the leftmost character to the end of the string.",
        [
          { in: 's = "abcde", goal = "cdeab"', out: "true", note: "Two left shifts." },
          { in: 's = "abcde", goal = "abced"', out: "false" },
          { in: 's = "a", goal = "a"', out: "true" },
        ],
        ["1 <= s.length, goal.length <= 40", "Both consist of lowercase English letters."]),
      hints: [
        "Every rotation of `s` appears as a contiguous substring of `s + s`.",
        "So the answer is just a length check plus a substring search.",
        "Do not skip the length check — `\"a\"` is a substring of `\"abab\"` without being a rotation of `\"ab\"`.",
      ],
      examples: [
        { input: '"abcde"\n"cdeab"', expectedOutput: "true" },
        { input: '"abcde"\n"abced"', expectedOutput: "false" },
        { input: '"a"\n"a"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 1, 20, "abcd");
        let goal: string;
        const roll = rng();
        if (roll < 0.45) {
          const k = ri(rng, 0, s.length - 1);
          goal = s.slice(k) + s.slice(0, k);
        } else {
          goal = randStr(rng, 1, 20, "abcd");
        }
        return { input: `"${s}"\n"${goal}"`, expectedOutput: bool(ref(s, goal)) };
      },
      solutions: {
        python: `def rotateString(s: str, goal: str) -> bool:\n    return len(s) == len(goal) and goal in s + s`,
        javascript: `var rotateString = function(s, goal) {\n    return s.length === goal.length && (s + s).indexOf(goal) >= 0;\n};`,
              typescript: `function rotateString(s: string, goal: string): boolean {\n    return s.length === goal.length && (s + s).indexOf(goal) >= 0;\n}`,
              java: `public static boolean rotateString(String s, String goal) {\n    return s.length() == goal.length() && (s + s).contains(goal);\n}`,
              cpp: `bool rotateString(string s, string goal) {\n    return s.size() == goal.size() && (s + s).find(goal) != string::npos;\n}`,
              c: `bool rotateString(const char* s, const char* goal) {\n    int n = (int) strlen(s);\n    if (n != (int) strlen(goal)) return false;\n    char* doubled = (char*) malloc(2 * n + 1);\n    for (int i = 0; i < n; i++) {\n        doubled[i] = s[i];\n        doubled[i + n] = s[i];\n    }\n    doubled[2 * n] = '\\0';\n    bool found = strstr(doubled, goal) != NULL;\n    free(doubled);\n    return found;\n}`,
              csharp: `public static bool RotateString(string s, string goal)\n{\n    return s.Length == goal.Length && (s + s).Contains(goal);\n}`,
              go: `func rotateString(s string, goal string) bool {\n	return len(s) == len(goal) && strings.Contains(s+s, goal)\n}`,
              kotlin: `fun rotateString(s: String, goal: String): Boolean {\n    return s.length == goal.length && (s + s).contains(goal)\n}`,
              swift: `func rotateString(_ s: String, _ goal: String) -> Bool {\n    return s.count == goal.count && (s + s).contains(goal)\n}`,
              rust: `fn rotateString(s: String, goal: String) -> bool {\n    s.len() == goal.len() && (s.clone() + &s).contains(&goal)\n}`,
              php: `function rotateString($s, $goal) {\n    return strlen($s) === strlen($goal) && strpos($s . $s, $goal) !== false;\n}`,
              ruby: `def rotateString(s, goal)\n  s.length == goal.length && (s + s).include?(goal)\nend`,
      },
    };
  })(),

  // ── Unique Email Addresses ──────────────────────────────────────
  (() => {
    const ref = (emails: string[]) => {
      const set = new Set<string>();
      for (let i = 0; i < emails.length; i++) {
        const at = emails[i].indexOf("@");
        let local = emails[i].slice(0, at);
        const domain = emails[i].slice(at);
        const plus = local.indexOf("+");
        if (plus >= 0) local = local.slice(0, plus);
        local = local.split(".").join("");
        set.add(local + domain);
      }
      return set.size;
    };
    return {
      slug: "unique-email-addresses",
      title: "Unique Email Addresses",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "String", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "numUniqueEmails", params: [{ name: "emails", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "Every valid email is a **local name** plus `'@'` plus a **domain name**.\n\nWhen delivering, the server ignores every period in the local name, and ignores the local name from the first `'+'` onward. Both rules apply only to the local name — the domain is used exactly as written.\n\nGiven an array of `emails`, return how many distinct addresses actually receive mail.",
        [
          { in: 'emails = ["test.email+alex@leetcode.com","test.e.mail+bob.cathy@leetcode.com","testemail+david@lee.tcode.com"]', out: "2", note: 'The first two both deliver to "testemail@leetcode.com".' },
          { in: 'emails = ["a@leetcode.com","b@leetcode.com","c@leetcode.com"]', out: "3" },
          { in: 'emails = ["a.b+c@x.com"]', out: "1" },
        ],
        ["1 <= emails.length <= 20", "Each email contains exactly one '@'.", "Local and domain names use lowercase letters, '.' and '+'."]),
      hints: [
        "Split each address at the `'@'` — everything after it is untouched.",
        "In the local part, cut at the first `'+'` and then delete every period.",
        "Insert the normalised address into a hash set and return its size.",
      ],
      examples: [
        { input: '["test.email+alex@leetcode.com","test.e.mail+bob.cathy@leetcode.com","testemail+david@lee.tcode.com"]', expectedOutput: "2" },
        { input: '["a@leetcode.com","b@leetcode.com","c@leetcode.com"]', expectedOutput: "3" },
        { input: '["a.b+c@x.com"]', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const domains = ["leetcode.com", "lee.tcode.com", "mail.com", "x.com"];
        const n = ri(rng, 1, 20);
        const emails: string[] = [];
        for (let i = 0; i < n; i++) {
          let local = randStr(rng, 1, 5, "abc");
          if (rng() < 0.5) local += "." + randStr(rng, 1, 4, "abc");
          if (rng() < 0.5) local += "+" + randStr(rng, 1, 4, "abcd");
          emails.push(local + "@" + domains[ri(rng, 0, domains.length - 1)]);
        }
        return { input: fmtStrArr(emails), expectedOutput: String(ref(emails)) };
      },
      solutions: {
        python: `def numUniqueEmails(emails) -> int:\n    seen = set()\n    for email in emails:\n        local, domain = email.split("@")\n        local = local.split("+")[0].replace(".", "")\n        seen.add(local + "@" + domain)\n    return len(seen)`,
        javascript: `var numUniqueEmails = function(emails) {\n    const seen = new Set();\n    for (let i = 0; i < emails.length; i++) {\n        const at = emails[i].indexOf("@");\n        let local = emails[i].slice(0, at);\n        const domain = emails[i].slice(at);\n        const plus = local.indexOf("+");\n        if (plus >= 0) local = local.slice(0, plus);\n        local = local.split(".").join("");\n        seen.add(local + domain);\n    }\n    return seen.size;\n};`,
              typescript: `function numUniqueEmails(emails: string[]): number {\n    var seen: { [key: string]: boolean } = {};\n    var count = 0;\n    for (var i = 0; i < emails.length; i++) {\n        var at = emails[i].indexOf("@");\n        var local = emails[i].substring(0, at);\n        var domain = emails[i].substring(at);\n        var plus = local.indexOf("+");\n        if (plus >= 0) local = local.substring(0, plus);\n        local = local.split(".").join("");\n        var key = local + domain;\n        if (seen[key] !== true) {\n            seen[key] = true;\n            count++;\n        }\n    }\n    return count;\n}`,
              java: `public static int numUniqueEmails(String[] emails) {\n    Set<String> seen = new HashSet<>();\n    for (String email : emails) {\n        int at = email.indexOf('@');\n        String local = email.substring(0, at);\n        String domain = email.substring(at);\n        int plus = local.indexOf('+');\n        if (plus >= 0) local = local.substring(0, plus);\n        local = local.replace(".", "");\n        seen.add(local + domain);\n    }\n    return seen.size();\n}`,
              cpp: `int numUniqueEmails(vector<string>& emails) {\n    set<string> seen;\n    for (string& email : emails) {\n        size_t at = email.find('@');\n        string local = email.substr(0, at);\n        string domain = email.substr(at);\n        size_t plus = local.find('+');\n        if (plus != string::npos) local = local.substr(0, plus);\n        string cleaned = "";\n        for (char c : local) {\n            if (c != '.') cleaned += c;\n        }\n        seen.insert(cleaned + domain);\n    }\n    return (int) seen.size();\n}`,
              c: `int numUniqueEmails(char** emails, int emailsSize) {\n    char normalized[32][128];\n    int count = 0;\n    for (int i = 0; i < emailsSize; i++) {\n        const char* email = emails[i];\n        int len = (int) strlen(email);\n        int at = 0;\n        while (at < len && email[at] != '@') at++;\n        char buf[128];\n        int pos = 0;\n        for (int j = 0; j < at; j++) {\n            if (email[j] == '+') break;\n            if (email[j] == '.') continue;\n            buf[pos++] = email[j];\n        }\n        for (int j = at; j < len; j++) buf[pos++] = email[j];\n        buf[pos] = '\\0';\n        bool already = false;\n        for (int k = 0; k < count; k++) {\n            if (strcmp(normalized[k], buf) == 0) { already = true; break; }\n        }\n        if (!already) {\n            strcpy(normalized[count], buf);\n            count++;\n        }\n    }\n    return count;\n}`,
              csharp: `public static int NumUniqueEmails(string[] emails)\n{\n    var seen = new HashSet<string>();\n    foreach (string email in emails)\n    {\n        int at = email.IndexOf('@');\n        string local = email.Substring(0, at);\n        string domain = email.Substring(at);\n        int plus = local.IndexOf('+');\n        if (plus >= 0) local = local.Substring(0, plus);\n        local = local.Replace(".", "");\n        seen.Add(local + domain);\n    }\n    return seen.Count;\n}`,
              go: `func numUniqueEmails(emails []string) int {\n	seen := make(map[string]bool)\n	for _, email := range emails {\n		at := strings.Index(email, "@")\n		local := email[:at]\n		domain := email[at:]\n		if plus := strings.Index(local, "+"); plus >= 0 {\n			local = local[:plus]\n		}\n		local = strings.Replace(local, ".", "", -1)\n		seen[local+domain] = true\n	}\n	return len(seen)\n}`,
              kotlin: `fun numUniqueEmails(emails: Array<String>): Int {\n    val seen = HashSet<String>()\n    for (email in emails) {\n        val at = email.indexOf('@')\n        var local = email.substring(0, at)\n        val domain = email.substring(at)\n        val plus = local.indexOf('+')\n        if (plus >= 0) local = local.substring(0, plus)\n        local = local.replace(".", "")\n        seen.add(local + domain)\n    }\n    return seen.size\n}`,
              swift: `func numUniqueEmails(_ emails: [String]) -> Int {\n    var seen = Set<String>()\n    for email in emails {\n        let chars = Array(email)\n        var at = 0\n        while at < chars.count && chars[at] != "@" { at += 1 }\n        var local = ""\n        var j = 0\n        while j < at {\n            if chars[j] == "+" { break }\n            if chars[j] != "." { local.append(chars[j]) }\n            j += 1\n        }\n        let domain = String(chars[at...])\n        seen.insert(local + domain)\n    }\n    return seen.count\n}`,
              rust: `fn numUniqueEmails(emails: Vec<String>) -> i32 {\n    use std::collections::HashSet;\n    let mut seen: HashSet<String> = HashSet::new();\n    for email in emails.iter() {\n        let at = email.find('@').unwrap();\n        let mut local = email[0..at].to_string();\n        let domain = email[at..].to_string();\n        if let Some(plus) = local.find('+') {\n            local = local[0..plus].to_string();\n        }\n        local = local.replace(".", "");\n        seen.insert(local + &domain);\n    }\n    seen.len() as i32\n}`,
              php: `function numUniqueEmails($emails) {\n    $seen = array();\n    foreach ($emails as $email) {\n        $at = strpos($email, "@");\n        $local = substr($email, 0, $at);\n        $domain = substr($email, $at);\n        $plus = strpos($local, "+");\n        if ($plus !== false) $local = substr($local, 0, $plus);\n        $local = str_replace(".", "", $local);\n        $seen[$local . $domain] = true;\n    }\n    return count($seen);\n}`,
              ruby: `def numUniqueEmails(emails)\n  seen = {}\n  emails.each do |email|\n    at = email.index("@")\n    local = email[0...at]\n    domain = email[at..-1]\n    plus = local.index("+")\n    local = local[0...plus] if plus\n    local = local.delete(".")\n    seen[local + domain] = true\n  end\n  seen.length\nend`,
      },
    };
  })(),

  // ── Maximum Number of Balloons ──────────────────────────────────
  (() => {
    const ref = (text: string) => {
      const count: Record<string, number> = {};
      for (let i = 0; i < text.length; i++) count[text[i]] = (count[text[i]] || 0) + 1;
      const need: Array<[string, number]> = [["b", 1], ["a", 1], ["l", 2], ["o", 2], ["n", 1]];
      let best = Infinity;
      for (const [ch, k] of need) best = Math.min(best, Math.floor((count[ch] || 0) / k));
      return best;
    };
    return {
      slug: "maximum-number-of-balloons",
      title: "Maximum Number of Balloons",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon", "Adobe"],
      signature: { funcName: "maxNumberOfBalloons", params: [{ name: "text", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `text`, use its characters to spell as many copies of the word `\"balloon\"` as possible. Each character of `text` may be used at most once.\n\nReturn the maximum number of copies you can spell.",
        [
          { in: 'text = "nlaebolko"', out: "1" },
          { in: 'text = "loonbalxballpoon"', out: "2" },
          { in: 'text = "leetcode"', out: "0" },
        ],
        ["1 <= text.length <= 40", "text consists of lowercase English letters."]),
      hints: [
        'Only five letters matter: b, a, l, o, n — and "balloon" needs two each of l and o.',
        "Divide each available count by how many that letter is needed, rounding down.",
        "The answer is the smallest of those five quotients — the scarcest letter is the bottleneck.",
      ],
      examples: [
        { input: '"nlaebolko"', expectedOutput: "1" },
        { input: '"loonbalxballpoon"', expectedOutput: "2" },
        { input: '"leetcode"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.6 ? "balon" : "balonxyz";
        const text = randStr(rng, 1, 40, alphabet);
        return { input: `"${text}"`, expectedOutput: String(ref(text)) };
      },
      solutions: {
        python: `def maxNumberOfBalloons(text: str) -> int:\n    count = {}\n    for ch in text:\n        count[ch] = count.get(ch, 0) + 1\n    need = [("b", 1), ("a", 1), ("l", 2), ("o", 2), ("n", 1)]\n    return min(count.get(ch, 0) // k for ch, k in need)`,
        javascript: `var maxNumberOfBalloons = function(text) {\n    const count = {};\n    for (let i = 0; i < text.length; i++) {\n        count[text[i]] = (count[text[i]] || 0) + 1;\n    }\n    const need = [["b", 1], ["a", 1], ["l", 2], ["o", 2], ["n", 1]];\n    let best = Infinity;\n    for (let i = 0; i < need.length; i++) {\n        const have = count[need[i][0]] || 0;\n        const copies = Math.floor(have / need[i][1]);\n        if (copies < best) best = copies;\n    }\n    return best;\n};`,
              typescript: `function maxNumberOfBalloons(text: string): number {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < text.length; i++) {\n        var ch = text.charAt(i);\n        count[ch] = (count[ch] === undefined ? 0 : count[ch]) + 1;\n    }\n    var letters = ["b", "a", "l", "o", "n"];\n    var needed = [1, 1, 2, 2, 1];\n    var best = -1;\n    for (var j = 0; j < letters.length; j++) {\n        var have = count[letters[j]] === undefined ? 0 : count[letters[j]];\n        var copies = Math.floor(have / needed[j]);\n        if (best < 0 || copies < best) best = copies;\n    }\n    return best;\n}`,
              java: `public static int maxNumberOfBalloons(String text) {\n    int[] count = new int[26];\n    for (int i = 0; i < text.length(); i++) count[text.charAt(i) - 'a']++;\n    int[] idx = {'b' - 'a', 'a' - 'a', 'l' - 'a', 'o' - 'a', 'n' - 'a'};\n    int[] needed = {1, 1, 2, 2, 1};\n    int best = Integer.MAX_VALUE;\n    for (int i = 0; i < 5; i++) {\n        best = Math.min(best, count[idx[i]] / needed[i]);\n    }\n    return best;\n}`,
              cpp: `int maxNumberOfBalloons(string text) {\n    int count[26] = {0};\n    for (char c : text) count[c - 'a']++;\n    int idx[5] = {'b' - 'a', 'a' - 'a', 'l' - 'a', 'o' - 'a', 'n' - 'a'};\n    int needed[5] = {1, 1, 2, 2, 1};\n    int best = count[idx[0]] / needed[0];\n    for (int i = 1; i < 5; i++) {\n        int copies = count[idx[i]] / needed[i];\n        if (copies < best) best = copies;\n    }\n    return best;\n}`,
              c: `int maxNumberOfBalloons(const char* text) {\n    int count[26] = {0};\n    for (int i = 0; text[i] != '\\0'; i++) count[text[i] - 'a']++;\n    int idx[5] = {'b' - 'a', 'a' - 'a', 'l' - 'a', 'o' - 'a', 'n' - 'a'};\n    int needed[5] = {1, 1, 2, 2, 1};\n    int best = count[idx[0]] / needed[0];\n    for (int i = 1; i < 5; i++) {\n        int copies = count[idx[i]] / needed[i];\n        if (copies < best) best = copies;\n    }\n    return best;\n}`,
              csharp: `public static int MaxNumberOfBalloons(string text)\n{\n    int[] count = new int[26];\n    foreach (char c in text) count[c - 'a']++;\n    int[] idx = { 'b' - 'a', 'a' - 'a', 'l' - 'a', 'o' - 'a', 'n' - 'a' };\n    int[] needed = { 1, 1, 2, 2, 1 };\n    int best = int.MaxValue;\n    for (int i = 0; i < 5; i++)\n    {\n        best = Math.Min(best, count[idx[i]] / needed[i]);\n    }\n    return best;\n}`,
              go: `func maxNumberOfBalloons(text string) int {\n	var count [26]int\n	for i := 0; i < len(text); i++ {\n		count[text[i]-'a']++\n	}\n	idx := []int{'b' - 'a', 'a' - 'a', 'l' - 'a', 'o' - 'a', 'n' - 'a'}\n	needed := []int{1, 1, 2, 2, 1}\n	best := count[idx[0]] / needed[0]\n	for i := 1; i < 5; i++ {\n		copies := count[idx[i]] / needed[i]\n		if copies < best {\n			best = copies\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxNumberOfBalloons(text: String): Int {\n    val count = IntArray(26)\n    for (c in text) count[c - 'a']++\n    val idx = intArrayOf('b' - 'a', 'a' - 'a', 'l' - 'a', 'o' - 'a', 'n' - 'a')\n    val needed = intArrayOf(1, 1, 2, 2, 1)\n    var best = count[idx[0]] / needed[0]\n    for (i in 1 until 5) {\n        val copies = count[idx[i]] / needed[i]\n        if (copies < best) best = copies\n    }\n    return best\n}`,
              swift: `func maxNumberOfBalloons(_ text: String) -> Int {\n    var count = [Int](repeating: 0, count: 26)\n    for b in Array(text.utf8) { count[Int(b) - 97] += 1 }\n    let idx = [1, 0, 11, 14, 13]\n    let needed = [1, 1, 2, 2, 1]\n    var best = count[idx[0]] / needed[0]\n    for i in 1..<5 {\n        let copies = count[idx[i]] / needed[i]\n        if copies < best { best = copies }\n    }\n    return best\n}`,
              rust: `fn maxNumberOfBalloons(text: String) -> i32 {\n    let mut count = [0i32; 26];\n    for b in text.as_bytes().iter() {\n        count[(*b - b'a') as usize] += 1;\n    }\n    let idx = [1usize, 0, 11, 14, 13];\n    let needed = [1i32, 1, 2, 2, 1];\n    let mut best = count[idx[0]] / needed[0];\n    for i in 1..5 {\n        let copies = count[idx[i]] / needed[i];\n        if copies < best {\n            best = copies;\n        }\n    }\n    best\n}`,
              php: `function maxNumberOfBalloons($text) {\n    $count = array_fill(0, 26, 0);\n    for ($i = 0; $i < strlen($text); $i++) $count[ord($text[$i]) - 97]++;\n    $idx = array(1, 0, 11, 14, 13);\n    $needed = array(1, 1, 2, 2, 1);\n    $best = intdiv($count[$idx[0]], $needed[0]);\n    for ($i = 1; $i < 5; $i++) {\n        $copies = intdiv($count[$idx[$i]], $needed[$i]);\n        if ($copies < $best) $best = $copies;\n    }\n    return $best;\n}`,
              ruby: `def maxNumberOfBalloons(text)\n  count = Hash.new(0)\n  text.each_char { |c| count[c] += 1 }\n  needed = { "b" => 1, "a" => 1, "l" => 2, "o" => 2, "n" => 1 }\n  needed.map { |ch, k| count[ch] / k }.min\nend`,
      },
    };
  })(),

  // ── Determine if String Halves Are Alike ────────────────────────
  (() => {
    const ref = (s: string) => {
      const isVowel = (c: string) => "aeiouAEIOU".indexOf(c) >= 0;
      const half = s.length / 2;
      let a = 0, b = 0;
      for (let i = 0; i < half; i++) if (isVowel(s[i])) a++;
      for (let i = half; i < s.length; i++) if (isVowel(s[i])) b++;
      return a === b;
    };
    return {
      slug: "determine-if-string-halves-are-alike",
      title: "Determine if String Halves Are Alike",
      difficulty: "EASY" as const,
      tags: ["String", "Counting", "Amazon", "Adobe"],
      signature: { funcName: "halvesAreAlike", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "You are given a string `s` of **even** length. Split it into two halves of equal length.\n\nTwo strings are **alike** if they contain the same number of vowels (`a`, `e`, `i`, `o`, `u`, in either case). Return `true` if the two halves are alike.",
        [
          { in: 's = "book"', out: "true", note: '"bo" and "ok" each contain one vowel.' },
          { in: 's = "textbook"', out: "false", note: '"text" has one vowel and "book" has two.' },
          { in: 's = "AbCdEfGh"', out: "true" },
        ],
        ["2 <= s.length <= 40", "s.length is even.", "s consists of upper and lowercase English letters."]),
      hints: [
        "Count vowels in the first half and in the second half, then compare.",
        "Both cases count: treat `A` exactly like `a`.",
        "One pass suffices — pick which counter to bump from the index.",
      ],
      examples: [
        { input: '"book"', expectedOutput: "true" },
        { input: '"textbook"', expectedOutput: "false" },
        { input: '"AbCdEfGh"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = 2 * ri(rng, 1, 20);
        const s = randStr(rng, n, n, "aeiouAEIOUbcdfg");
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: `def halvesAreAlike(s: str) -> bool:\n    vowels = set("aeiouAEIOU")\n    half = len(s) // 2\n    a = sum(1 for ch in s[:half] if ch in vowels)\n    b = sum(1 for ch in s[half:] if ch in vowels)\n    return a == b`,
        javascript: `var halvesAreAlike = function(s) {\n    const isVowel = function(c) { return "aeiouAEIOU".indexOf(c) >= 0; };\n    const half = s.length / 2;\n    let a = 0, b = 0;\n    for (let i = 0; i < half; i++) {\n        if (isVowel(s[i])) a++;\n    }\n    for (let i = half; i < s.length; i++) {\n        if (isVowel(s[i])) b++;\n    }\n    return a === b;\n};`,
              typescript: `function halvesAreAlike(s: string): boolean {\n    var vowels = "aeiouAEIOU";\n    var half = s.length / 2;\n    var a = 0;\n    var b = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (vowels.indexOf(s.charAt(i)) >= 0) {\n            if (i < half) a++;\n            else b++;\n        }\n    }\n    return a === b;\n}`,
              java: `public static boolean halvesAreAlike(String s) {\n    String vowels = "aeiouAEIOU";\n    int half = s.length() / 2;\n    int a = 0, b = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (vowels.indexOf(s.charAt(i)) >= 0) {\n            if (i < half) a++;\n            else b++;\n        }\n    }\n    return a == b;\n}`,
              cpp: `bool halvesAreAlike(string s) {\n    string vowels = "aeiouAEIOU";\n    int half = (int) s.size() / 2;\n    int a = 0, b = 0;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (vowels.find(s[i]) != string::npos) {\n            if (i < half) a++;\n            else b++;\n        }\n    }\n    return a == b;\n}`,
              c: `bool halvesAreAlike(const char* s) {\n    const char* vowels = "aeiouAEIOU";\n    int n = (int) strlen(s);\n    int half = n / 2;\n    int a = 0, b = 0;\n    for (int i = 0; i < n; i++) {\n        if (strchr(vowels, s[i]) != NULL) {\n            if (i < half) a++;\n            else b++;\n        }\n    }\n    return a == b;\n}`,
              csharp: `public static bool HalvesAreAlike(string s)\n{\n    string vowels = "aeiouAEIOU";\n    int half = s.Length / 2;\n    int a = 0, b = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (vowels.IndexOf(s[i]) >= 0)\n        {\n            if (i < half) a++;\n            else b++;\n        }\n    }\n    return a == b;\n}`,
              go: `func halvesAreAlike(s string) bool {\n	half := len(s) / 2\n	a, b := 0, 0\n	for i := 0; i < len(s); i++ {\n		if strings.IndexByte("aeiouAEIOU", s[i]) >= 0 {\n			if i < half {\n				a++\n			} else {\n				b++\n			}\n		}\n	}\n	return a == b\n}`,
              kotlin: `fun halvesAreAlike(s: String): Boolean {\n    val vowels = "aeiouAEIOU"\n    val half = s.length / 2\n    var a = 0\n    var b = 0\n    for (i in s.indices) {\n        if (vowels.indexOf(s[i]) >= 0) {\n            if (i < half) a++ else b++\n        }\n    }\n    return a == b\n}`,
              swift: `func halvesAreAlike(_ s: String) -> Bool {\n    let vowels = Set("aeiouAEIOU")\n    let chars = Array(s)\n    let half = chars.count / 2\n    var a = 0\n    var b = 0\n    for i in 0..<chars.count {\n        if vowels.contains(chars[i]) {\n            if i < half { a += 1 } else { b += 1 }\n        }\n    }\n    return a == b\n}`,
              rust: `fn halvesAreAlike(s: String) -> bool {\n    let bytes = s.as_bytes();\n    let half = bytes.len() / 2;\n    let mut a = 0;\n    let mut b = 0;\n    for i in 0..bytes.len() {\n        if b"aeiouAEIOU".contains(&bytes[i]) {\n            if i < half {\n                a += 1;\n            } else {\n                b += 1;\n            }\n        }\n    }\n    a == b\n}`,
              php: `function halvesAreAlike($s) {\n    $vowels = "aeiouAEIOU";\n    $n = strlen($s);\n    $half = intdiv($n, 2);\n    $a = 0;\n    $b = 0;\n    for ($i = 0; $i < $n; $i++) {\n        if (strpos($vowels, $s[$i]) !== false) {\n            if ($i < $half) $a++;\n            else $b++;\n        }\n    }\n    return $a === $b;\n}`,
              ruby: `def halvesAreAlike(s)\n  vowels = "aeiouAEIOU"\n  half = s.length / 2\n  a = 0\n  b = 0\n  s.each_char.with_index do |c, i|\n    next unless vowels.include?(c)\n    if i < half\n      a += 1\n    else\n      b += 1\n    end\n  end\n  a == b\nend`,
      },
    };
  })(),

  // ── Remove Outermost Parentheses ────────────────────────────────
  (() => {
    const ref = (s: string) => {
      let out = "";
      let depth = 0;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "(") {
          if (depth > 0) out += "(";
          depth++;
        } else {
          depth--;
          if (depth > 0) out += ")";
        }
      }
      return out;
    };
    return {
      slug: "remove-outermost-parentheses",
      title: "Remove Outermost Parentheses",
      difficulty: "EASY" as const,
      tags: ["String", "Stack", "Amazon", "Adobe"],
      signature: { funcName: "removeOuterParentheses", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A valid parentheses string is **primitive** if it is non-empty and cannot be split into two non-empty valid parentheses strings.\n\nEvery valid parentheses string `s` decomposes uniquely into primitive pieces. Remove the outermost parentheses of each piece and return the concatenation of what is left.",
        [
          { in: 's = "(()())(())"', out: "()()()", note: 'The pieces are "(()())" and "(())"; stripping the outer layer leaves "()()" and "()".' },
          { in: 's = "(()())(())(()(()))"', out: "()()()()(())" },
          { in: 's = "()()"', out: "", note: "Both pieces are bare, so nothing survives." },
        ],
        ["1 <= s.length <= 40", "s is a valid parentheses string."]),
      hints: [
        "Track the nesting depth as you scan.",
        "An opening bracket at depth 0 and a closing bracket that returns to depth 0 are exactly the outer layer of a primitive piece — skip those.",
        "Careful with the order: increment the depth **after** deciding about a `(`, and decrement **before** deciding about a `)`.",
      ],
      examples: [
        { input: '"(()())(())"', expectedOutput: "()()()" },
        { input: '"(()())(())(()(()))"', expectedOutput: "()()()()(())" },
        { input: '"()()"', expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const build = (depth: number): string => {
          if (depth <= 0 || rng() < 0.35) return "()";
          const inner = rng() < 0.5 ? build(depth - 1) : build(depth - 1) + build(depth - 1);
          return "(" + inner + ")";
        };
        let s = "";
        while (s.length < 24) {
          const piece = build(ri(rng, 0, 2));
          if (s.length + piece.length > 40) break;
          s += piece;
        }
        if (s.length === 0) s = "()";
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def removeOuterParentheses(s: str) -> str:\n    out = []\n    depth = 0\n    for ch in s:\n        if ch == "(":\n            if depth > 0:\n                out.append(ch)\n            depth += 1\n        else:\n            depth -= 1\n            if depth > 0:\n                out.append(ch)\n    return "".join(out)`,
        javascript: `var removeOuterParentheses = function(s) {\n    let out = "";\n    let depth = 0;\n    for (let i = 0; i < s.length; i++) {\n        if (s[i] === "(") {\n            if (depth > 0) out += "(";\n            depth++;\n        } else {\n            depth--;\n            if (depth > 0) out += ")";\n        }\n    }\n    return out;\n};`,
              typescript: `function removeOuterParentheses(s: string): string {\n    var out = "";\n    var depth = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "(") {\n            if (depth > 0) out += "(";\n            depth++;\n        } else {\n            depth--;\n            if (depth > 0) out += ")";\n        }\n    }\n    return out;\n}`,
              java: `public static String removeOuterParentheses(String s) {\n    StringBuilder out = new StringBuilder();\n    int depth = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == '(') {\n            if (depth > 0) out.append('(');\n            depth++;\n        } else {\n            depth--;\n            if (depth > 0) out.append(')');\n        }\n    }\n    return out.toString();\n}`,
              cpp: `string removeOuterParentheses(string s) {\n    string out = "";\n    int depth = 0;\n    for (char c : s) {\n        if (c == '(') {\n            if (depth > 0) out += '(';\n            depth++;\n        } else {\n            depth--;\n            if (depth > 0) out += ')';\n        }\n    }\n    return out;\n}`,
              c: `char* removeOuterParentheses(const char* s) {\n    int n = (int) strlen(s);\n    char* out = (char*) malloc(n + 1);\n    int pos = 0;\n    int depth = 0;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == '(') {\n            if (depth > 0) out[pos++] = '(';\n            depth++;\n        } else {\n            depth--;\n            if (depth > 0) out[pos++] = ')';\n        }\n    }\n    out[pos] = '\\0';\n    return out;\n}`,
              csharp: `public static string RemoveOuterParentheses(string s)\n{\n    var out_ = new System.Text.StringBuilder();\n    int depth = 0;\n    foreach (char c in s)\n    {\n        if (c == '(')\n        {\n            if (depth > 0) out_.Append('(');\n            depth++;\n        }\n        else\n        {\n            depth--;\n            if (depth > 0) out_.Append(')');\n        }\n    }\n    return out_.ToString();\n}`,
              go: `func removeOuterParentheses(s string) string {\n	var sb strings.Builder\n	depth := 0\n	for i := 0; i < len(s); i++ {\n		if s[i] == '(' {\n			if depth > 0 {\n				sb.WriteByte('(')\n			}\n			depth++\n		} else {\n			depth--\n			if depth > 0 {\n				sb.WriteByte(')')\n			}\n		}\n	}\n	return sb.String()\n}`,
              kotlin: `fun removeOuterParentheses(s: String): String {\n    val out = StringBuilder()\n    var depth = 0\n    for (c in s) {\n        if (c == '(') {\n            if (depth > 0) out.append('(')\n            depth++\n        } else {\n            depth--\n            if (depth > 0) out.append(')')\n        }\n    }\n    return out.toString()\n}`,
              swift: `func removeOuterParentheses(_ s: String) -> String {\n    var out = ""\n    var depth = 0\n    for c in s {\n        if c == "(" {\n            if depth > 0 { out.append("(") }\n            depth += 1\n        } else {\n            depth -= 1\n            if depth > 0 { out.append(")") }\n        }\n    }\n    return out\n}`,
              rust: `fn removeOuterParentheses(s: String) -> String {\n    let mut out = String::new();\n    let mut depth = 0;\n    for b in s.as_bytes().iter() {\n        if *b == b'(' {\n            if depth > 0 {\n                out.push('(');\n            }\n            depth += 1;\n        } else {\n            depth -= 1;\n            if depth > 0 {\n                out.push(')');\n            }\n        }\n    }\n    out\n}`,
              php: `function removeOuterParentheses($s) {\n    $out = "";\n    $depth = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($s[$i] === "(") {\n            if ($depth > 0) $out .= "(";\n            $depth++;\n        } else {\n            $depth--;\n            if ($depth > 0) $out .= ")";\n        }\n    }\n    return $out;\n}`,
              ruby: `def removeOuterParentheses(s)\n  out = ""\n  depth = 0\n  s.each_char do |c|\n    if c == "("\n      out += "(" if depth > 0\n      depth += 1\n    else\n      depth -= 1\n      out += ")" if depth > 0\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Split a String in Balanced Strings ──────────────────────────
  (() => {
    const ref = (s: string) => {
      let balance = 0, count = 0;
      for (let i = 0; i < s.length; i++) {
        balance += s[i] === "R" ? 1 : -1;
        if (balance === 0) count++;
      }
      return count;
    };
    return {
      slug: "split-a-string-in-balanced-strings",
      title: "Split a String in Balanced Strings",
      difficulty: "EASY" as const,
      tags: ["String", "Greedy", "Counting", "Amazon", "Adobe"],
      signature: { funcName: "balancedStringSplit", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A string is **balanced** when it contains an equal number of `'L'` and `'R'` characters.\n\nGiven a balanced string `s`, split it into the **maximum** number of balanced substrings and return that count.",
        [
          { in: 's = "RLRRLLRLRL"', out: "4", note: 'The pieces are "RL", "RRLL", "RL" and "RL".' },
          { in: 's = "RLRRRLLRLL"', out: "2" },
          { in: 's = "LLLLRRRR"', out: "1" },
        ],
        ["2 <= s.length <= 40", "s[i] is 'L' or 'R'.", "s is balanced."]),
      hints: [
        "Track a running balance: +1 for `R`, -1 for `L`.",
        "Every time the balance returns to zero, you have completed a balanced piece — cut there.",
        "Cutting at the earliest opportunity is what maximises the count.",
      ],
      examples: [
        { input: '"RLRRLLRLRL"', expectedOutput: "4" },
        { input: '"RLRRRLLRLL"', expectedOutput: "2" },
        { input: '"LLLLRRRR"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const pairs = ri(rng, 1, 20);
        const chars: string[] = [];
        for (let i = 0; i < pairs; i++) { chars.push("R"); chars.push("L"); }
        // Reject arrangements that are not balanced prefixes-wise? Any permutation
        // with equal counts is a valid input; the answer just varies.
        const s = shuffle(rng, chars).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def balancedStringSplit(s: str) -> int:\n    balance = count = 0\n    for ch in s:\n        balance += 1 if ch == "R" else -1\n        if balance == 0:\n            count += 1\n    return count`,
        javascript: `var balancedStringSplit = function(s) {\n    let balance = 0, count = 0;\n    for (let i = 0; i < s.length; i++) {\n        balance += s[i] === "R" ? 1 : -1;\n        if (balance === 0) count++;\n    }\n    return count;\n};`,
              typescript: `function balancedStringSplit(s: string): number {\n    var balance = 0;\n    var count = 0;\n    for (var i = 0; i < s.length; i++) {\n        balance += s.charAt(i) === "R" ? 1 : -1;\n        if (balance === 0) count++;\n    }\n    return count;\n}`,
              java: `public static int balancedStringSplit(String s) {\n    int balance = 0, count = 0;\n    for (int i = 0; i < s.length(); i++) {\n        balance += s.charAt(i) == 'R' ? 1 : -1;\n        if (balance == 0) count++;\n    }\n    return count;\n}`,
              cpp: `int balancedStringSplit(string s) {\n    int balance = 0, count = 0;\n    for (char c : s) {\n        balance += c == 'R' ? 1 : -1;\n        if (balance == 0) count++;\n    }\n    return count;\n}`,
              c: `int balancedStringSplit(const char* s) {\n    int balance = 0, count = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        balance += s[i] == 'R' ? 1 : -1;\n        if (balance == 0) count++;\n    }\n    return count;\n}`,
              csharp: `public static int BalancedStringSplit(string s)\n{\n    int balance = 0, count = 0;\n    foreach (char c in s)\n    {\n        balance += c == 'R' ? 1 : -1;\n        if (balance == 0) count++;\n    }\n    return count;\n}`,
              go: `func balancedStringSplit(s string) int {\n	balance, count := 0, 0\n	for i := 0; i < len(s); i++ {\n		if s[i] == 'R' {\n			balance++\n		} else {\n			balance--\n		}\n		if balance == 0 {\n			count++\n		}\n	}\n	return count\n}`,
              kotlin: `fun balancedStringSplit(s: String): Int {\n    var balance = 0\n    var count = 0\n    for (c in s) {\n        balance += if (c == 'R') 1 else -1\n        if (balance == 0) count++\n    }\n    return count\n}`,
              swift: `func balancedStringSplit(_ s: String) -> Int {\n    var balance = 0\n    var count = 0\n    for c in s {\n        balance += c == "R" ? 1 : -1\n        if balance == 0 { count += 1 }\n    }\n    return count\n}`,
              rust: `fn balancedStringSplit(s: String) -> i32 {\n    let mut balance = 0;\n    let mut count = 0;\n    for b in s.as_bytes().iter() {\n        balance += if *b == b'R' { 1 } else { -1 };\n        if balance == 0 {\n            count += 1;\n        }\n    }\n    count\n}`,
              php: `function balancedStringSplit($s) {\n    $balance = 0;\n    $count = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        $balance += $s[$i] === "R" ? 1 : -1;\n        if ($balance === 0) $count++;\n    }\n    return $count;\n}`,
              ruby: `def balancedStringSplit(s)\n  balance = 0\n  count = 0\n  s.each_char do |c|\n    balance += c == "R" ? 1 : -1\n    count += 1 if balance == 0\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Check If Two String Arrays Are Equivalent ───────────────────
  (() => {
    const ref = (word1: string[], word2: string[]) => word1.join("") === word2.join("");
    return {
      slug: "check-if-two-string-arrays-are-equivalent",
      title: "Check If Two String Arrays Are Equivalent",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Amazon", "Microsoft"],
      signature: { funcName: "arrayStringsAreEqual", params: [{ name: "word1", type: "string[]" as const }, { name: "word2", type: "string[]" as const }], returns: "bool" as const },
      description: describe(
        "Given two string arrays `word1` and `word2`, return `true` if the two arrays represent the same string.\n\nAn array represents the string formed by concatenating its elements in order.",
        [
          { in: 'word1 = ["ab","c"], word2 = ["a","bc"]', out: "true", note: 'Both spell "abc".' },
          { in: 'word1 = ["a","cb"], word2 = ["ab","c"]', out: "false" },
          { in: 'word1 = ["abc","d","defg"], word2 = ["abcddefg"]', out: "true" },
        ],
        ["1 <= word1.length, word2.length <= 10", "1 <= word1[i].length, word2[i].length <= 8", "All strings consist of lowercase English letters."]),
      hints: [
        "Joining both arrays and comparing the results is the direct answer.",
        "To avoid building the strings, walk both arrays with a pair of (array index, character index) cursors and compare character by character.",
      ],
      examples: [
        { input: '["ab","c"]\n["a","bc"]', expectedOutput: "true" },
        { input: '["a","cb"]\n["ab","c"]', expectedOutput: "false" },
        { input: '["abc","d","defg"]\n["abcddefg"]', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const full = randStr(rng, 1, 30, "abc");
        const chop = (text: string) => {
          const parts: string[] = [];
          let i = 0;
          while (i < text.length && parts.length < 9) {
            const take = ri(rng, 1, Math.min(8, text.length - i));
            parts.push(text.slice(i, i + take));
            i += take;
          }
          if (i < text.length) parts.push(text.slice(i));
          return parts.length > 0 ? parts : [text];
        };
        const word1 = chop(full);
        const word2 = rng() < 0.6 ? chop(full) : chop(randStr(rng, 1, 30, "abc"));
        return { input: `${fmtStrArr(word1)}\n${fmtStrArr(word2)}`, expectedOutput: bool(ref(word1, word2)) };
      },
      solutions: {
        python: `def arrayStringsAreEqual(word1, word2) -> bool:\n    return "".join(word1) == "".join(word2)`,
        javascript: `var arrayStringsAreEqual = function(word1, word2) {\n    return word1.join("") === word2.join("");\n};`,
              typescript: `function arrayStringsAreEqual(word1: string[], word2: string[]): boolean {\n    return word1.join("") === word2.join("");\n}`,
              java: `public static boolean arrayStringsAreEqual(String[] word1, String[] word2) {\n    return String.join("", word1).equals(String.join("", word2));\n}`,
              cpp: `bool arrayStringsAreEqual(vector<string>& word1, vector<string>& word2) {\n    string a = "";\n    for (string& w : word1) a += w;\n    string b = "";\n    for (string& w : word2) b += w;\n    return a == b;\n}`,
              c: `bool arrayStringsAreEqual(char** word1, int word1Size, char** word2, int word2Size) {\n    char a[256];\n    char b[256];\n    int pa = 0, pb = 0;\n    for (int i = 0; i < word1Size; i++) {\n        for (int j = 0; word1[i][j] != '\\0'; j++) a[pa++] = word1[i][j];\n    }\n    a[pa] = '\\0';\n    for (int i = 0; i < word2Size; i++) {\n        for (int j = 0; word2[i][j] != '\\0'; j++) b[pb++] = word2[i][j];\n    }\n    b[pb] = '\\0';\n    return strcmp(a, b) == 0;\n}`,
              csharp: `public static bool ArrayStringsAreEqual(string[] word1, string[] word2)\n{\n    return string.Join("", word1) == string.Join("", word2);\n}`,
              go: `func arrayStringsAreEqual(word1 []string, word2 []string) bool {\n	return strings.Join(word1, "") == strings.Join(word2, "")\n}`,
              kotlin: `fun arrayStringsAreEqual(word1: Array<String>, word2: Array<String>): Boolean {\n    return word1.joinToString("") == word2.joinToString("")\n}`,
              swift: `func arrayStringsAreEqual(_ word1: [String], _ word2: [String]) -> Bool {\n    return word1.joined() == word2.joined()\n}`,
              rust: `fn arrayStringsAreEqual(word1: Vec<String>, word2: Vec<String>) -> bool {\n    word1.join("") == word2.join("")\n}`,
              php: `function arrayStringsAreEqual($word1, $word2) {\n    return implode("", $word1) === implode("", $word2);\n}`,
              ruby: `def arrayStringsAreEqual(word1, word2)\n  word1.join == word2.join\nend`,
      },
    };
  })(),

  // ── Count Binary Substrings ─────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const groups: number[] = [];
      let i = 0;
      while (i < s.length) {
        let j = i;
        while (j < s.length && s[j] === s[i]) j++;
        groups.push(j - i);
        i = j;
      }
      let total = 0;
      for (let k = 1; k < groups.length; k++) total += Math.min(groups[k - 1], groups[k]);
      return total;
    };
    return {
      slug: "count-binary-substrings",
      title: "Count Binary Substrings",
      difficulty: "EASY" as const,
      tags: ["Two Pointers", "String", "Amazon", "Google"],
      signature: { funcName: "countBinarySubstrings", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a binary string `s`, count the non-empty substrings that have the **same number of 0s and 1s**, with all the 0s and all the 1s grouped consecutively.\n\nSubstrings that occur multiple times are counted once per occurrence.",
        [
          { in: 's = "00110011"', out: "6", note: 'The qualifying substrings are "0011", "01", "1100", "10", "0011" and "01".' },
          { in: 's = "10101"', out: "4" },
          { in: 's = "000"', out: "0" },
        ],
        ["1 <= s.length <= 40", "s[i] is '0' or '1'."]),
      hints: [
        "Only runs of equal characters matter — compress the string into a list of run lengths.",
        "Each adjacent pair of runs contributes `min(previous, current)` valid substrings.",
        "You can keep just the previous and current run lengths and never build the list at all.",
      ],
      examples: [
        { input: '"00110011"', expectedOutput: "6" },
        { input: '"10101"', expectedOutput: "4" },
        { input: '"000"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        let s = "";
        let cur = rng() < 0.5 ? "0" : "1";
        while (s.length < 40) {
          const run = ri(rng, 1, 5);
          s += cur.repeat(run);
          cur = cur === "0" ? "1" : "0";
        }
        s = s.slice(0, ri(rng, 1, 40));
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def countBinarySubstrings(s: str) -> int:\n    groups = []\n    i = 0\n    while i < len(s):\n        j = i\n        while j < len(s) and s[j] == s[i]:\n            j += 1\n        groups.append(j - i)\n        i = j\n    return sum(min(groups[k - 1], groups[k]) for k in range(1, len(groups)))`,
        javascript: `var countBinarySubstrings = function(s) {\n    const groups = [];\n    let i = 0;\n    while (i < s.length) {\n        let j = i;\n        while (j < s.length && s[j] === s[i]) j++;\n        groups.push(j - i);\n        i = j;\n    }\n    let total = 0;\n    for (let k = 1; k < groups.length; k++) {\n        total += Math.min(groups[k - 1], groups[k]);\n    }\n    return total;\n};`,
              typescript: `function countBinarySubstrings(s: string): number {\n    var prev = 0;\n    var cur = 0;\n    var total = 0;\n    for (var i = 0; i < s.length; i++) {\n        if (i > 0 && s.charAt(i) !== s.charAt(i - 1)) {\n            prev = cur;\n            cur = 1;\n        } else {\n            cur++;\n        }\n        if (prev >= cur) total++;\n    }\n    return total;\n}`,
              java: `public static int countBinarySubstrings(String s) {\n    int prev = 0, cur = 0, total = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (i > 0 && s.charAt(i) != s.charAt(i - 1)) {\n            prev = cur;\n            cur = 1;\n        } else {\n            cur++;\n        }\n        if (prev >= cur) total++;\n    }\n    return total;\n}`,
              cpp: `int countBinarySubstrings(string s) {\n    int prev = 0, cur = 0, total = 0;\n    for (int i = 0; i < (int) s.size(); i++) {\n        if (i > 0 && s[i] != s[i - 1]) {\n            prev = cur;\n            cur = 1;\n        } else {\n            cur++;\n        }\n        if (prev >= cur) total++;\n    }\n    return total;\n}`,
              c: `int countBinarySubstrings(const char* s) {\n    int prev = 0, cur = 0, total = 0;\n    for (int i = 0; s[i] != '\\0'; i++) {\n        if (i > 0 && s[i] != s[i - 1]) {\n            prev = cur;\n            cur = 1;\n        } else {\n            cur++;\n        }\n        if (prev >= cur) total++;\n    }\n    return total;\n}`,
              csharp: `public static int CountBinarySubstrings(string s)\n{\n    int prev = 0, cur = 0, total = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (i > 0 && s[i] != s[i - 1])\n        {\n            prev = cur;\n            cur = 1;\n        }\n        else\n        {\n            cur++;\n        }\n        if (prev >= cur) total++;\n    }\n    return total;\n}`,
              go: `func countBinarySubstrings(s string) int {\n	prev, cur, total := 0, 0, 0\n	for i := 0; i < len(s); i++ {\n		if i > 0 && s[i] != s[i-1] {\n			prev = cur\n			cur = 1\n		} else {\n			cur++\n		}\n		if prev >= cur {\n			total++\n		}\n	}\n	return total\n}`,
              kotlin: `fun countBinarySubstrings(s: String): Int {\n    var prev = 0\n    var cur = 0\n    var total = 0\n    for (i in s.indices) {\n        if (i > 0 && s[i] != s[i - 1]) {\n            prev = cur\n            cur = 1\n        } else {\n            cur++\n        }\n        if (prev >= cur) total++\n    }\n    return total\n}`,
              swift: `func countBinarySubstrings(_ s: String) -> Int {\n    let chars = Array(s)\n    var prev = 0\n    var cur = 0\n    var total = 0\n    for i in 0..<chars.count {\n        if i > 0 && chars[i] != chars[i - 1] {\n            prev = cur\n            cur = 1\n        } else {\n            cur += 1\n        }\n        if prev >= cur { total += 1 }\n    }\n    return total\n}`,
              rust: `fn countBinarySubstrings(s: String) -> i32 {\n    let bytes = s.as_bytes();\n    let mut prev = 0;\n    let mut cur = 0;\n    let mut total = 0;\n    for i in 0..bytes.len() {\n        if i > 0 && bytes[i] != bytes[i - 1] {\n            prev = cur;\n            cur = 1;\n        } else {\n            cur += 1;\n        }\n        if prev >= cur {\n            total += 1;\n        }\n    }\n    total\n}`,
              php: `function countBinarySubstrings($s) {\n    $prev = 0;\n    $cur = 0;\n    $total = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        if ($i > 0 && $s[$i] !== $s[$i - 1]) {\n            $prev = $cur;\n            $cur = 1;\n        } else {\n            $cur++;\n        }\n        if ($prev >= $cur) $total++;\n    }\n    return $total;\n}`,
              ruby: `def countBinarySubstrings(s)\n  prev = 0\n  cur = 0\n  total = 0\n  s.each_char.with_index do |c, i|\n    if i > 0 && c != s[i - 1]\n      prev = cur\n      cur = 1\n    else\n      cur += 1\n    end\n    total += 1 if prev >= cur\n  end\n  total\nend`,
      },
    };
  })(),
];
