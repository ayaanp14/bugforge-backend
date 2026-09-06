/** Strings & hashing — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, explain, fmtIntArr, fmtStrArr, randLower, ri, type CatalogProblem, type Rng } from "./types.js";

const AL = "abcdefghijklmnopqrstuvwxyz";

export const STRING_PROBLEMS: CatalogProblem[] = [

  // ── Valid Palindrome ────────────────────────────────────────────
  (() => {
    const clean = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const ref = (s: string) => { const c = clean(s); return c === [...c].reverse().join(""); };
    const genStr = (rng: Rng) => {
      const chars = "abcXYZ019 ,.:!";
      let base = Array.from({ length: ri(rng, 0, 30) }, () => chars[ri(rng, 0, chars.length - 1)]).join("");
      if (rng() < 0.5) {
        const core = randLower(rng, 0, 8);
        base = core + (rng() < 0.5 ? "x" : "") + [...core].reverse().join("");
      }
      return base;
    };
    return {
      slug: "valid-palindrome",
      title: "Valid Palindrome",
      difficulty: "EASY" as const,
      tags: ["String", "Two Pointers"],
      signature: { funcName: "isPalindrome", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A phrase is a **palindrome** if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string `s`, return `true` if it is a palindrome, or `false` otherwise.",
        [
          { in: 's = "A man, a plan, a canal: Panama"', out: "true", note: '"amanaplanacanalpanama" is a palindrome.' },
          { in: 's = "race a car"', out: "false", note: '"raceacar" is not a palindrome.' },
        ],
        ["0 <= s.length <= 40", "s consists of printable ASCII characters."]),
      hints: [
        "Normalize first: lowercase and strip everything that is not a letter or digit.",
        "Two pointers from both ends avoid building the reversed copy.",
      ],
      examples: [
        { input: '"A man, a plan, a canal: Panama"', expectedOutput: "true" },
        { input: '"race a car"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const s = genStr(rng);
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      editorial: explain({
        idea: "Do not build a cleaned copy of the string — walk it from both ends at once and simply **skip** anything that is not alphanumeric. Compare the surviving characters case-insensitively; the first mismatch settles it.",
        steps: [
          "Put `l` at the start and `r` at the end.",
          "Advance `l` rightwards past any non-alphanumeric character, and `r` leftwards likewise.",
          "Compare the two characters after lowercasing; a mismatch means it is not a palindrome.",
          "Move both pointers inward and repeat until they meet.",
        ],
        why: "Filtering and lowercasing are per-character decisions, so they can be applied on the fly rather than in a separate pass — which is what keeps the extra space constant. The two-pointer comparison is exactly the definition of a palindrome applied to the filtered sequence: position `i` from the front must equal position `i` from the back, and the skipping ensures both pointers always land on characters that survive the filter.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Keep the skip loops bounded by `l < r`, or a string of only punctuation runs off the end.",
          "Digits count as alphanumeric, not just letters.",
          "Lowercase **both** sides before comparing.",
          "An empty string, or one with no alphanumeric characters at all, is a palindrome.",
        ],
      }),
      solutions: {
        python: `def isPalindrome(s: str) -> bool:\n    c = [ch.lower() for ch in s if ch.isalnum()]\n    return c == c[::-1]`,
        javascript: `var isPalindrome = function(s) {\n    const c = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n    for (let i = 0, j = c.length - 1; i < j; i++, j--) {\n        if (c[i] !== c[j]) return false;\n    }\n    return true;\n};`,
              typescript: `function isPalindrome(s: string): boolean {\n    function isAlnum(c: string): boolean {\n        return (c >= "0" && c <= "9") || (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");\n    }\n    let l = 0;\n    let r = s.length - 1;\n    while (l < r) {\n        while (l < r && !isAlnum(s.charAt(l))) l++;\n        while (l < r && !isAlnum(s.charAt(r))) r--;\n        if (s.charAt(l).toLowerCase() !== s.charAt(r).toLowerCase()) return false;\n        l++;\n        r--;\n    }\n    return true;\n}`,
              java: `public static boolean isPalindrome(String s) {\n    int l = 0, r = s.length() - 1;\n    while (l < r) {\n        while (l < r && !Character.isLetterOrDigit(s.charAt(l))) l++;\n        while (l < r && !Character.isLetterOrDigit(s.charAt(r))) r--;\n        if (Character.toLowerCase(s.charAt(l)) != Character.toLowerCase(s.charAt(r))) return false;\n        l++;\n        r--;\n    }\n    return true;\n}`,
              cpp: `bool isPalindrome(string s) {\n    int l = 0, r = (int) s.size() - 1;\n    while (l < r) {\n        while (l < r && !isalnum((unsigned char) s[l])) l++;\n        while (l < r && !isalnum((unsigned char) s[r])) r--;\n        if (tolower((unsigned char) s[l]) != tolower((unsigned char) s[r])) return false;\n        l++;\n        r--;\n    }\n    return true;\n}`,
              c: `static int isAlnumCh(char c) {\n    return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');\n}\n\nstatic char lowerCh(char c) {\n    if (c >= 'A' && c <= 'Z') return (char) (c + 32);\n    return c;\n}\n\nbool isPalindrome(const char* s) {\n    int l = 0;\n    int r = (int) strlen(s) - 1;\n    while (l < r) {\n        while (l < r && !isAlnumCh(s[l])) l++;\n        while (l < r && !isAlnumCh(s[r])) r--;\n        if (lowerCh(s[l]) != lowerCh(s[r])) return false;\n        l++;\n        r--;\n    }\n    return true;\n}`,
              csharp: `public static bool IsPalindrome(string s)\n{\n    int l = 0, r = s.Length - 1;\n    while (l < r)\n    {\n        while (l < r && !char.IsLetterOrDigit(s[l])) l++;\n        while (l < r && !char.IsLetterOrDigit(s[r])) r--;\n        if (char.ToLower(s[l]) != char.ToLower(s[r])) return false;\n        l++;\n        r--;\n    }\n    return true;\n}`,
              go: `func isPalindrome(s string) bool {\n	isAlnum := func(c byte) bool {\n		return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')\n	}\n	lower := func(c byte) byte {\n		if c >= 'A' && c <= 'Z' {\n			return c + 32\n		}\n		return c\n	}\n	l, r := 0, len(s)-1\n	for l < r {\n		for l < r && !isAlnum(s[l]) {\n			l++\n		}\n		for l < r && !isAlnum(s[r]) {\n			r--\n		}\n		if lower(s[l]) != lower(s[r]) {\n			return false\n		}\n		l++\n		r--\n	}\n	return true\n}`,
              kotlin: `fun isPalindrome(s: String): Boolean {\n    var l = 0\n    var r = s.length - 1\n    while (l < r) {\n        while (l < r && !s[l].isLetterOrDigit()) l++\n        while (l < r && !s[r].isLetterOrDigit()) r--\n        if (s[l].toLowerCase() != s[r].toLowerCase()) return false\n        l++\n        r--\n    }\n    return true\n}`,
              swift: `func isPalindrome(_ s: String) -> Bool {\n    let c = Array(s)\n    func isAlnum(_ ch: Character) -> Bool {\n        return ch.isLetter || ch.isNumber\n    }\n    var l = 0\n    var r = c.count - 1\n    while l < r {\n        while l < r && !isAlnum(c[l]) { l += 1 }\n        while l < r && !isAlnum(c[r]) { r -= 1 }\n        if String(c[l]).lowercased() != String(c[r]).lowercased() { return false }\n        l += 1\n        r -= 1\n    }\n    return true\n}`,
              rust: `fn isPalindrome(s: String) -> bool {\n    let b: Vec<u8> = s.bytes().collect();\n    let is_alnum = |c: u8| (c >= b'0' && c <= b'9') || (c >= b'a' && c <= b'z') || (c >= b'A' && c <= b'Z');\n    let lower = |c: u8| if c >= b'A' && c <= b'Z' { c + 32 } else { c };\n    if b.is_empty() {\n        return true;\n    }\n    let mut l: i32 = 0;\n    let mut r: i32 = b.len() as i32 - 1;\n    while l < r {\n        while l < r && !is_alnum(b[l as usize]) {\n            l += 1;\n        }\n        while l < r && !is_alnum(b[r as usize]) {\n            r -= 1;\n        }\n        if lower(b[l as usize]) != lower(b[r as usize]) {\n            return false;\n        }\n        l += 1;\n        r -= 1;\n    }\n    true\n}`,
              php: `function isPalindrome($s) {\n    $l = 0;\n    $r = strlen($s) - 1;\n    while ($l < $r) {\n        while ($l < $r && !ctype_alnum($s[$l])) $l++;\n        while ($l < $r && !ctype_alnum($s[$r])) $r--;\n        if (strtolower($s[$l]) !== strtolower($s[$r])) return false;\n        $l++;\n        $r--;\n    }\n    return true;\n}`,
              ruby: `def isPalindrome(s)\n  l = 0\n  r = s.length - 1\n  alnum = ->(c) { c =~ /[a-zA-Z0-9]/ }\n  while l < r\n    l += 1 while l < r && !alnum.call(s[l])\n    r -= 1 while l < r && !alnum.call(s[r])\n    return false if s[l].downcase != s[r].downcase\n    l += 1\n    r -= 1\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Longest Common Prefix ───────────────────────────────────────
  (() => {
    const ref = (strs: string[]) => {
      if (strs.length === 0) return "";
      let p = strs[0];
      for (const s of strs) {
        while (!s.startsWith(p)) p = p.slice(0, -1);
        if (p === "") return "";
      }
      return p;
    };
    return {
      slug: "longest-common-prefix",
      title: "Longest Common Prefix",
      difficulty: "EASY" as const,
      tags: ["String"],
      signature: { funcName: "longestCommonPrefix", params: [{ name: "strs", type: "string[]" as const }], returns: "string" as const },
      description: describe(
        'Write a function to find the **longest common prefix** amongst an array of strings. If there is no common prefix, return the empty string `""`.',
        [
          { in: 'strs = ["flower","flow","flight"]', out: '"fl"' },
          { in: 'strs = ["dog","racecar","car"]', out: '""', note: "There is no common prefix." },
        ],
        ["1 <= strs.length <= 15", "0 <= strs[i].length <= 20", "strs[i] consists of lowercase English letters."]),
      hints: [
        "The answer can never be longer than the shortest string.",
        "Shrink a candidate prefix until every string starts with it.",
      ],
      examples: [
        { input: '["flower","flow","flight"]', expectedOutput: "fl" },
        { input: '["dog","racecar","car"]', expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const prefix = randLower(rng, 0, 6);
        const strs = Array.from({ length: ri(rng, 1, 15) }, () => prefix + randLower(rng, 0, 10));
        return { input: fmtStrArr(strs), expectedOutput: ref(strs) };
      },
      editorial: explain({
        idea: "Compare the strings **column by column** rather than string by string. Take the first string as the reference, and at each position check that every other string has the same character there. The first disagreement — or the first string that runs out — ends the prefix.",
        steps: [
          "If the list is empty, the answer is the empty string.",
          "For each index `i` in the first string, take its character `c`.",
          "Check every other string: if it is shorter than `i + 1`, or its character at `i` differs from `c`, stop.",
          "Return the first string's prefix up to the stopping index; if the loop completes, the whole first string is the prefix.",
        ],
        why: "The common prefix can never be longer than the shortest string, and it must agree with the first string at every position — so scanning the first string's characters covers every candidate length in order. Stopping at the earliest disagreement is exactly the definition of the *longest* common prefix, and the column-wise order means the scan can exit as soon as it fails, often long before reading the whole input.",
        time: "O(total characters)",
        space: "O(1) beyond the output",
        pitfalls: [
          "Guard against a string being shorter than the current index before reading it.",
          "An empty string anywhere in the list forces an empty answer, which the length guard handles.",
          "No common prefix means the empty string, not a null or sentinel.",
          "Sorting the array and comparing only the first and last also works, but is `O(n log n)` for no benefit here.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef longestCommonPrefix(strs: List[str]) -> str:\n    p = strs[0]\n    for s in strs[1:]:\n        while not s.startswith(p):\n            p = p[:-1]\n            if not p:\n                return ""\n    return p`,
        javascript: `var longestCommonPrefix = function(strs) {\n    let p = strs[0];\n    for (const s of strs) {\n        while (s.indexOf(p) !== 0) {\n            p = p.slice(0, -1);\n            if (p === "") return "";\n        }\n    }\n    return p;\n};`,
              typescript: `function longestCommonPrefix(strs: string[]): string {\n    if (strs.length === 0) return "";\n    const first = strs[0];\n    for (let i = 0; i < first.length; i++) {\n        const c = first.charAt(i);\n        for (let k = 1; k < strs.length; k++) {\n            if (i >= strs[k].length || strs[k].charAt(i) !== c) return first.substring(0, i);\n        }\n    }\n    return first;\n}`,
              java: `public static String longestCommonPrefix(String[] strs) {\n    if (strs.length == 0) return "";\n    String first = strs[0];\n    for (int i = 0; i < first.length(); i++) {\n        char c = first.charAt(i);\n        for (int k = 1; k < strs.length; k++) {\n            if (i >= strs[k].length() || strs[k].charAt(i) != c) return first.substring(0, i);\n        }\n    }\n    return first;\n}`,
              cpp: `string longestCommonPrefix(vector<string>& strs) {\n    if (strs.empty()) return "";\n    string first = strs[0];\n    for (int i = 0; i < (int) first.size(); i++) {\n        char c = first[i];\n        for (int k = 1; k < (int) strs.size(); k++) {\n            if (i >= (int) strs[k].size() || strs[k][i] != c) return first.substr(0, i);\n        }\n    }\n    return first;\n}`,
              c: `char* longestCommonPrefix(char** strs, int strsSize) {\n    char* out = (char*) malloc(64);\n    out[0] = '\\0';\n    if (strsSize == 0) return out;\n    int firstLen = (int) strlen(strs[0]);\n    int cut = firstLen;\n    for (int i = 0; i < firstLen; i++) {\n        char c = strs[0][i];\n        int stop = 0;\n        for (int k = 1; k < strsSize; k++) {\n            if (i >= (int) strlen(strs[k]) || strs[k][i] != c) {\n                stop = 1;\n                break;\n            }\n        }\n        if (stop) {\n            cut = i;\n            break;\n        }\n    }\n    free(out);\n    char* res = (char*) malloc(cut + 1);\n    for (int i = 0; i < cut; i++) res[i] = strs[0][i];\n    res[cut] = '\\0';\n    return res;\n}`,
              csharp: `public static string LongestCommonPrefix(string[] strs)\n{\n    if (strs.Length == 0) return "";\n    string first = strs[0];\n    for (int i = 0; i < first.Length; i++)\n    {\n        char c = first[i];\n        for (int k = 1; k < strs.Length; k++)\n        {\n            if (i >= strs[k].Length || strs[k][i] != c) return first.Substring(0, i);\n        }\n    }\n    return first;\n}`,
              go: `func longestCommonPrefix(strs []string) string {\n	if len(strs) == 0 {\n		return ""\n	}\n	first := strs[0]\n	for i := 0; i < len(first); i++ {\n		c := first[i]\n		for k := 1; k < len(strs); k++ {\n			if i >= len(strs[k]) || strs[k][i] != c {\n				return first[:i]\n			}\n		}\n	}\n	return first\n}`,
              kotlin: `fun longestCommonPrefix(strs: Array<String>): String {\n    if (strs.isEmpty()) return ""\n    val first = strs[0]\n    for (i in first.indices) {\n        val c = first[i]\n        for (k in 1 until strs.size) {\n            if (i >= strs[k].length || strs[k][i] != c) return first.substring(0, i)\n        }\n    }\n    return first\n}`,
              swift: `func longestCommonPrefix(_ strs: [String]) -> String {\n    if strs.isEmpty { return "" }\n    let arrs = strs.map { Array($0) }\n    let first = arrs[0]\n    for i in 0..<first.count {\n        let c = first[i]\n        for k in 1..<arrs.count {\n            if i >= arrs[k].count || arrs[k][i] != c {\n                return String(first[0..<i])\n            }\n        }\n    }\n    return strs[0]\n}`,
              rust: `fn longestCommonPrefix(strs: Vec<String>) -> String {\n    if strs.is_empty() {\n        return String::new();\n    }\n    let arrs: Vec<Vec<u8>> = strs.iter().map(|s| s.bytes().collect()).collect();\n    let first = &arrs[0];\n    for i in 0..first.len() {\n        let c = first[i];\n        for k in 1..arrs.len() {\n            if i >= arrs[k].len() || arrs[k][i] != c {\n                return String::from_utf8(first[0..i].to_vec()).unwrap();\n            }\n        }\n    }\n    strs[0].clone()\n}`,
              php: `function longestCommonPrefix($strs) {\n    if (count($strs) === 0) return "";\n    $first = $strs[0];\n    $n = strlen($first);\n    for ($i = 0; $i < $n; $i++) {\n        $c = $first[$i];\n        for ($k = 1; $k < count($strs); $k++) {\n            if ($i >= strlen($strs[$k]) || $strs[$k][$i] !== $c) return substr($first, 0, $i);\n        }\n    }\n    return $first;\n}`,
              ruby: `def longestCommonPrefix(strs)\n  return "" if strs.empty?\n  first = strs[0]\n  (0...first.length).each do |i|\n    c = first[i]\n    (1...strs.length).each do |k|\n      return first[0...i] if i >= strs[k].length || strs[k][i] != c\n    end\n  end\n  first\nend`,
      },
    };
  })(),

  // ── Longest Substring Without Repeating Characters ──────────────
  (() => {
    const ref = (s: string) => {
      const last = new Map<string, number>();
      let start = 0, best = 0;
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (last.has(ch) && last.get(ch)! >= start) start = last.get(ch)! + 1;
        last.set(ch, i);
        best = Math.max(best, i - start + 1);
      }
      return best;
    };
    return {
      slug: "longest-substring-without-repeating-characters",
      title: "Longest Substring Without Repeating Characters",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window", "Hash Table"],
      signature: { funcName: "lengthOfLongestSubstring", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s`, find the length of the **longest substring** without duplicate characters.",
        [
          { in: 's = "abcabcbb"', out: "3", note: 'The answer is "abc", length 3.' },
          { in: 's = "bbbbb"', out: "1" },
          { in: 's = "pwwkew"', out: "3", note: '"pwke" is a subsequence, not a substring.' },
        ],
        ["0 <= s.length <= 40", "s consists of lowercase English letters."]),
      hints: [
        "Slide a window [start, i]; a repeat inside the window forces start forward.",
        "Remember the last index of each character to jump start directly.",
      ],
      examples: [
        { input: '"abcabcbb"', expectedOutput: "3" },
        { input: '"bbbbb"', expectedOutput: "1" },
        { input: '"pwwkew"', expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 0, 40, "abcdefgh");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      editorial: explain({
        idea: "Slide a window that never contains a repeat. When the incoming character was already seen **inside the current window**, jump the left edge to just past that earlier occurrence — one hop rather than shrinking step by step.",
        steps: [
          "Keep a table of the last index at which each character was seen, and a left edge `l`.",
          "For each right edge `r`, look up the character's last index.",
          "If that index is at or after `l`, the character is inside the window — set `l` to `lastIndex + 1`.",
          "Record the character's new last index and update the best with `r - l + 1`.",
        ],
        why: "The window `[l, r]` is kept free of duplicates by construction, so its length is a valid candidate at every step, and for each right edge the window is as large as it can possibly be. Jumping `l` directly to `lastIndex + 1` is safe because every position between the old `l` and there would still contain the duplicate, so none of them could yield a longer valid window. That makes the sweep strictly linear, with `l` never moving backwards.",
        time: "O(n)",
        space: "O(1) — the table holds at most the alphabet",
        pitfalls: [
          "Only jump the left edge when the previous occurrence is **inside** the window (`lastIndex >= l`); a stale index from before `l` must be ignored, or the window shrinks wrongly.",
          "Never move `l` backwards.",
          "Record the character's index after adjusting `l`, not before.",
          "An empty string answers `0`.",
        ],
      }),
      solutions: {
        python: `def lengthOfLongestSubstring(s: str) -> int:\n    last = {}\n    start = 0\n    best = 0\n    for i, ch in enumerate(s):\n        if ch in last and last[ch] >= start:\n            start = last[ch] + 1\n        last[ch] = i\n        best = max(best, i - start + 1)\n    return best`,
        javascript: `var lengthOfLongestSubstring = function(s) {\n    const last = new Map();\n    let start = 0, best = 0;\n    for (let i = 0; i < s.length; i++) {\n        const ch = s[i];\n        if (last.has(ch) && last.get(ch) >= start) start = last.get(ch) + 1;\n        last.set(ch, i);\n        best = Math.max(best, i - start + 1);\n    }\n    return best;\n};`,
              typescript: `function lengthOfLongestSubstring(s: string): number {\n    const last: number[] = [];\n    for (let i = 0; i < 128; i++) last.push(-1);\n    let l = 0;\n    let best = 0;\n    for (let r = 0; r < s.length; r++) {\n        const code = s.charCodeAt(r);\n        if (last[code] >= l) l = last[code] + 1;\n        last[code] = r;\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              java: `public static int lengthOfLongestSubstring(String s) {\n    int[] last = new int[128];\n    Arrays.fill(last, -1);\n    int l = 0, best = 0;\n    for (int r = 0; r < s.length(); r++) {\n        int code = s.charAt(r);\n        if (last[code] >= l) l = last[code] + 1;\n        last[code] = r;\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              cpp: `int lengthOfLongestSubstring(string s) {\n    vector<int> last(128, -1);\n    int l = 0, best = 0;\n    for (int r = 0; r < (int) s.size(); r++) {\n        int code = (unsigned char) s[r];\n        if (last[code] >= l) l = last[code] + 1;\n        last[code] = r;\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              c: `int lengthOfLongestSubstring(const char* s) {\n    int last[128];\n    for (int i = 0; i < 128; i++) last[i] = -1;\n    int n = (int) strlen(s);\n    int l = 0, best = 0;\n    for (int r = 0; r < n; r++) {\n        int code = (unsigned char) s[r];\n        if (last[code] >= l) l = last[code] + 1;\n        last[code] = r;\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              csharp: `public static int LengthOfLongestSubstring(string s)\n{\n    int[] last = new int[128];\n    for (int i = 0; i < 128; i++) last[i] = -1;\n    int l = 0, best = 0;\n    for (int r = 0; r < s.Length; r++)\n    {\n        int code = s[r];\n        if (last[code] >= l) l = last[code] + 1;\n        last[code] = r;\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              go: `func lengthOfLongestSubstring(s string) int {\n	last := make([]int, 128)\n	for i := range last {\n		last[i] = -1\n	}\n	l, best := 0, 0\n	for r := 0; r < len(s); r++ {\n		code := int(s[r])\n		if last[code] >= l {\n			l = last[code] + 1\n		}\n		last[code] = r\n		if r-l+1 > best {\n			best = r - l + 1\n		}\n	}\n	return best\n}`,
              kotlin: `fun lengthOfLongestSubstring(s: String): Int {\n    val last = IntArray(128) { -1 }\n    var l = 0\n    var best = 0\n    for (r in s.indices) {\n        val code = s[r].toInt()\n        if (last[code] >= l) l = last[code] + 1\n        last[code] = r\n        if (r - l + 1 > best) best = r - l + 1\n    }\n    return best\n}`,
              swift: `func lengthOfLongestSubstring(_ s: String) -> Int {\n    var last = [Int](repeating: -1, count: 128)\n    let codes = Array(s.unicodeScalars).map { Int($0.value) }\n    var l = 0\n    var best = 0\n    for r in 0..<codes.count {\n        let code = codes[r]\n        if last[code] >= l { l = last[code] + 1 }\n        last[code] = r\n        if r - l + 1 > best { best = r - l + 1 }\n    }\n    return best\n}`,
              rust: `fn lengthOfLongestSubstring(s: String) -> i32 {\n    let b: Vec<u8> = s.bytes().collect();\n    let mut last = [-1i32; 128];\n    let mut l: i32 = 0;\n    let mut best: i32 = 0;\n    for r in 0..b.len() {\n        let code = b[r] as usize;\n        if last[code] >= l {\n            l = last[code] + 1;\n        }\n        last[code] = r as i32;\n        let len = r as i32 - l + 1;\n        if len > best {\n            best = len;\n        }\n    }\n    best\n}`,
              php: `function lengthOfLongestSubstring($s) {\n    $last = array_fill(0, 128, -1);\n    $l = 0;\n    $best = 0;\n    $n = strlen($s);\n    for ($r = 0; $r < $n; $r++) {\n        $code = ord($s[$r]);\n        if ($last[$code] >= $l) $l = $last[$code] + 1;\n        $last[$code] = $r;\n        if ($r - $l + 1 > $best) $best = $r - $l + 1;\n    }\n    return $best;\n}`,
              ruby: `def lengthOfLongestSubstring(s)\n  last = Array.new(128, -1)\n  l = 0\n  best = 0\n  (0...s.length).each do |r|\n    code = s[r].ord\n    l = last[code] + 1 if last[code] >= l\n    last[code] = r\n    best = r - l + 1 if r - l + 1 > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Longest Palindromic Substring (leftmost) ────────────────────
  (() => {
    const ref = (s: string) => {
      let best = "";
      for (let c = 0; c < s.length; c++) {
        for (const [l0, r0] of [[c, c], [c, c + 1]] as const) {
          let l = l0, r = r0;
          while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }
          const cand = s.slice(l + 1, r);
          if (cand.length > best.length) best = cand;
        }
      }
      return best;
    };
    return {
      slug: "longest-palindromic-substring",
      title: "Longest Palindromic Substring",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming"],
      signature: { funcName: "longestPalindrome", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given a string `s`, return the **longest palindromic substring**. If several palindromes share the maximum length, return the **leftmost** one.",
        [
          { in: 's = "babad"', out: '"bab"', note: 'Both "bab" and "aba" have length 3; "bab" starts first.' },
          { in: 's = "cbbd"', out: '"bb"' },
        ],
        ["1 <= s.length <= 30", "s consists of lowercase English letters."]),
      hints: [
        "Every palindrome has a center — a character or a gap between two characters.",
        "Expand around all 2n-1 centers and keep the first longest.",
      ],
      examples: [
        { input: '"babad"', expectedOutput: "bab" },
        { input: '"cbbd"', expectedOutput: "bb" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 30, "abcd");
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      editorial: explain({
        idea: "Every palindrome has a **centre**, and there are only `2n - 1` of them — `n` single characters plus `n - 1` gaps between characters. Try each centre, expand outward while the two sides match, and keep the longest span found.",
        steps: [
          "For each index, expand around it as an odd-length centre (`l = r = i`).",
          "Also expand around the gap after it as an even-length centre (`l = i`, `r = i + 1`).",
          "In each expansion, widen while both ends are in bounds and the characters match.",
          "When expansion stops, the palindrome spans `l + 1 .. r - 1`, of length `r - l - 1`.",
          "Keep the span only when it is **strictly** longer than the best so far, which preserves the leftmost on ties.",
        ],
        why: "Every palindromic substring is produced by exactly one centre, so trying all centres examines every candidate — and expansion from a centre finds the longest palindrome around it, since the moment the ends disagree no wider span can be symmetric. Scanning centres left to right and updating only on a strict improvement is what makes the leftmost maximal palindrome win a tie.",
        time: "O(n^2)",
        space: "O(1)",
        pitfalls: [
          "Even-length palindromes need their own centre between characters — checking only single-character centres misses `\"bb\"` entirely.",
          "After the expansion loop, the bounds have already overshot by one on each side, so the length is `r - l - 1`.",
          "Use a strict `>` when updating the best, or a later equal-length palindrome overwrites the leftmost one.",
          "Manacher's algorithm solves this in linear time, but is far more delicate to write.",
        ],
      }),
      solutions: {
        python: `def longestPalindrome(s: str) -> str:\n    best = ""\n    for c in range(len(s)):\n        for l0, r0 in ((c, c), (c, c + 1)):\n            l, r = l0, r0\n            while l >= 0 and r < len(s) and s[l] == s[r]:\n                l -= 1\n                r += 1\n            cand = s[l + 1:r]\n            if len(cand) > len(best):\n                best = cand\n    return best`,
        javascript: `var longestPalindrome = function(s) {\n    let best = "";\n    for (let c = 0; c < s.length; c++) {\n        for (const [l0, r0] of [[c, c], [c, c + 1]]) {\n            let l = l0, r = r0;\n            while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }\n            const cand = s.slice(l + 1, r);\n            if (cand.length > best.length) best = cand;\n        }\n    }\n    return best;\n};`,
              typescript: `function longestPalindrome(s: string): string {\n    const n = s.length;\n    let bestStart = 0;\n    let bestLen = 1;\n    function expand(lo: number, hi: number): void {\n        let l = lo;\n        let r = hi;\n        while (l >= 0 && r < n && s.charAt(l) === s.charAt(r)) {\n            l--;\n            r++;\n        }\n        const len = r - l - 1;\n        if (len > bestLen) {\n            bestLen = len;\n            bestStart = l + 1;\n        }\n    }\n    for (let i = 0; i < n; i++) {\n        expand(i, i);\n        expand(i, i + 1);\n    }\n    return s.substring(bestStart, bestStart + bestLen);\n}`,
              java: `public static String longestPalindrome(String s) {\n    int n = s.length();\n    int[] best = new int[]{0, 1};\n    for (int i = 0; i < n; i++) {\n        expandLP(s, i, i, best);\n        expandLP(s, i, i + 1, best);\n    }\n    return s.substring(best[0], best[0] + best[1]);\n}\n\nprivate static void expandLP(String s, int lo, int hi, int[] best) {\n    int n = s.length();\n    int l = lo, r = hi;\n    while (l >= 0 && r < n && s.charAt(l) == s.charAt(r)) {\n        l--;\n        r++;\n    }\n    int len = r - l - 1;\n    if (len > best[1]) {\n        best[1] = len;\n        best[0] = l + 1;\n    }\n}`,
              cpp: `void expandLP(const string& s, int lo, int hi, int& bestStart, int& bestLen) {\n    int n = (int) s.size();\n    int l = lo, r = hi;\n    while (l >= 0 && r < n && s[l] == s[r]) {\n        l--;\n        r++;\n    }\n    int len = r - l - 1;\n    if (len > bestLen) {\n        bestLen = len;\n        bestStart = l + 1;\n    }\n}\n\nstring longestPalindrome(string s) {\n    int bestStart = 0, bestLen = 1;\n    for (int i = 0; i < (int) s.size(); i++) {\n        expandLP(s, i, i, bestStart, bestLen);\n        expandLP(s, i, i + 1, bestStart, bestLen);\n    }\n    return s.substr(bestStart, bestLen);\n}`,
              c: `char* longestPalindrome(const char* s) {\n    int n = (int) strlen(s);\n    int bestStart = 0;\n    int bestLen = 1;\n    for (int i = 0; i < n; i++) {\n        for (int mode = 0; mode < 2; mode++) {\n            int l = i;\n            int r = i + mode;\n            while (l >= 0 && r < n && s[l] == s[r]) {\n                l--;\n                r++;\n            }\n            int len = r - l - 1;\n            if (len > bestLen) {\n                bestLen = len;\n                bestStart = l + 1;\n            }\n        }\n    }\n    char* out = (char*) malloc(bestLen + 1);\n    for (int i = 0; i < bestLen; i++) out[i] = s[bestStart + i];\n    out[bestLen] = '\\0';\n    return out;\n}`,
              csharp: `public static string LongestPalindrome(string s)\n{\n    int n = s.Length;\n    int bestStart = 0, bestLen = 1;\n    for (int i = 0; i < n; i++)\n    {\n        for (int mode = 0; mode < 2; mode++)\n        {\n            int l = i, r = i + mode;\n            while (l >= 0 && r < n && s[l] == s[r])\n            {\n                l--;\n                r++;\n            }\n            int len = r - l - 1;\n            if (len > bestLen)\n            {\n                bestLen = len;\n                bestStart = l + 1;\n            }\n        }\n    }\n    return s.Substring(bestStart, bestLen);\n}`,
              go: `func longestPalindrome(s string) string {\n	n := len(s)\n	bestStart, bestLen := 0, 1\n	for i := 0; i < n; i++ {\n		for mode := 0; mode < 2; mode++ {\n			l := i\n			r := i + mode\n			for l >= 0 && r < n && s[l] == s[r] {\n				l--\n				r++\n			}\n			length := r - l - 1\n			if length > bestLen {\n				bestLen = length\n				bestStart = l + 1\n			}\n		}\n	}\n	return s[bestStart : bestStart+bestLen]\n}`,
              kotlin: `fun longestPalindrome(s: String): String {\n    val n = s.length\n    var bestStart = 0\n    var bestLen = 1\n    for (i in 0 until n) {\n        for (mode in 0 until 2) {\n            var l = i\n            var r = i + mode\n            while (l >= 0 && r < n && s[l] == s[r]) {\n                l--\n                r++\n            }\n            val len = r - l - 1\n            if (len > bestLen) {\n                bestLen = len\n                bestStart = l + 1\n            }\n        }\n    }\n    return s.substring(bestStart, bestStart + bestLen)\n}`,
              swift: `func longestPalindrome(_ s: String) -> String {\n    let c = Array(s)\n    let n = c.count\n    var bestStart = 0\n    var bestLen = 1\n    for i in 0..<n {\n        for mode in 0..<2 {\n            var l = i\n            var r = i + mode\n            while l >= 0 && r < n && c[l] == c[r] {\n                l -= 1\n                r += 1\n            }\n            let len = r - l - 1\n            if len > bestLen {\n                bestLen = len\n                bestStart = l + 1\n            }\n        }\n    }\n    return String(c[bestStart..<(bestStart + bestLen)])\n}`,
              rust: `fn longestPalindrome(s: String) -> String {\n    let b: Vec<u8> = s.bytes().collect();\n    let n = b.len() as i32;\n    let mut best_start: i32 = 0;\n    let mut best_len: i32 = 1;\n    for i in 0..n {\n        for mode in 0..2 {\n            let mut l = i;\n            let mut r = i + mode;\n            while l >= 0 && r < n && b[l as usize] == b[r as usize] {\n                l -= 1;\n                r += 1;\n            }\n            let len = r - l - 1;\n            if len > best_len {\n                best_len = len;\n                best_start = l + 1;\n            }\n        }\n    }\n    String::from_utf8(b[best_start as usize..(best_start + best_len) as usize].to_vec()).unwrap()\n}`,
              php: `function longestPalindrome($s) {\n    $n = strlen($s);\n    $bestStart = 0;\n    $bestLen = 1;\n    for ($i = 0; $i < $n; $i++) {\n        for ($mode = 0; $mode < 2; $mode++) {\n            $l = $i;\n            $r = $i + $mode;\n            while ($l >= 0 && $r < $n && $s[$l] === $s[$r]) {\n                $l--;\n                $r++;\n            }\n            $len = $r - $l - 1;\n            if ($len > $bestLen) {\n                $bestLen = $len;\n                $bestStart = $l + 1;\n            }\n        }\n    }\n    return substr($s, $bestStart, $bestLen);\n}`,
              ruby: `def longestPalindrome(s)\n  n = s.length\n  best_start = 0\n  best_len = 1\n  (0...n).each do |i|\n    (0...2).each do |mode|\n      l = i\n      r = i + mode\n      while l >= 0 && r < n && s[l] == s[r]\n        l -= 1\n        r += 1\n      end\n      len = r - l - 1\n      if len > best_len\n        best_len = len\n        best_start = l + 1\n      end\n    end\n  end\n  s[best_start, best_len]\nend`,
      },
    };
  })(),

  // ── Palindromic Substrings ──────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      let count = 0;
      for (let c = 0; c < s.length; c++) {
        for (const [l0, r0] of [[c, c], [c, c + 1]] as const) {
          let l = l0, r = r0;
          while (l >= 0 && r < s.length && s[l] === s[r]) { count++; l--; r++; }
        }
      }
      return count;
    };
    return {
      slug: "palindromic-substrings",
      title: "Palindromic Substrings",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming"],
      signature: { funcName: "countSubstrings", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s`, return the **number of palindromic substrings** in it. Substrings at different positions count separately, even when their text is equal.",
        [
          { in: 's = "abc"', out: "3", note: '"a", "b", "c".' },
          { in: 's = "aaa"', out: "6", note: '"a"×3, "aa"×2, "aaa".' },
        ],
        ["1 <= s.length <= 30", "s consists of lowercase English letters."]),
      hints: [
        "Count palindromes by expanding around each of the 2n-1 centers.",
        "Every successful expansion step is one more palindrome.",
      ],
      examples: [
        { input: '"abc"', expectedOutput: "3" },
        { input: '"aaa"', expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 30, "abc");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      editorial: explain({
        idea: "Same centre-expansion as finding the longest palindrome, but instead of tracking a maximum you **count every successful expansion**. Each time the two ends still match, you have found one more palindromic substring around that centre.",
        steps: [
          "For each of the `2n - 1` centres — every index, and every gap between adjacent indices — start with the two ends at the centre.",
          "While both ends are in bounds and the characters match, increment the count and widen by one on each side.",
          "Stop that centre when the ends disagree or run off the string.",
          "The accumulated count is the answer.",
        ],
        why: "Every palindromic substring is symmetric about exactly one centre, so summing over all centres counts each substring once and none twice — the count is exact, not an approximation. And expansion around a centre enumerates its palindromes in increasing length: if a span of width `w` is a palindrome, so is every narrower span about the same centre, which is why each successful widening is a genuine new substring.",
        time: "O(n^2)",
        space: "O(1)",
        pitfalls: [
          "Both centre kinds are needed — odd centres alone miss every even-length palindrome such as `\"aa\"`.",
          "Count on **each** successful expansion, not once per centre.",
          "Identical substrings at different positions count separately, so no deduplication is wanted.",
          "Every single character is a palindrome, so the answer is never below `n`.",
        ],
      }),
      solutions: {
        python: `def countSubstrings(s: str) -> int:\n    count = 0\n    for c in range(len(s)):\n        for l0, r0 in ((c, c), (c, c + 1)):\n            l, r = l0, r0\n            while l >= 0 and r < len(s) and s[l] == s[r]:\n                count += 1\n                l -= 1\n                r += 1\n    return count`,
        javascript: `var countSubstrings = function(s) {\n    let count = 0;\n    for (let c = 0; c < s.length; c++) {\n        for (const [l0, r0] of [[c, c], [c, c + 1]]) {\n            let l = l0, r = r0;\n            while (l >= 0 && r < s.length && s[l] === s[r]) { count++; l--; r++; }\n        }\n    }\n    return count;\n};`,
              typescript: `function countSubstrings(s: string): number {\n    const n = s.length;\n    let total = 0;\n    for (let i = 0; i < n; i++) {\n        for (let mode = 0; mode < 2; mode++) {\n            let l = i;\n            let r = i + mode;\n            while (l >= 0 && r < n && s.charAt(l) === s.charAt(r)) {\n                total++;\n                l--;\n                r++;\n            }\n        }\n    }\n    return total;\n}`,
              java: `public static int countSubstrings(String s) {\n    int n = s.length(), total = 0;\n    for (int i = 0; i < n; i++) {\n        for (int mode = 0; mode < 2; mode++) {\n            int l = i, r = i + mode;\n            while (l >= 0 && r < n && s.charAt(l) == s.charAt(r)) {\n                total++;\n                l--;\n                r++;\n            }\n        }\n    }\n    return total;\n}`,
              cpp: `int countSubstrings(string s) {\n    int n = (int) s.size(), total = 0;\n    for (int i = 0; i < n; i++) {\n        for (int mode = 0; mode < 2; mode++) {\n            int l = i, r = i + mode;\n            while (l >= 0 && r < n && s[l] == s[r]) {\n                total++;\n                l--;\n                r++;\n            }\n        }\n    }\n    return total;\n}`,
              c: `int countSubstrings(const char* s) {\n    int n = (int) strlen(s);\n    int total = 0;\n    for (int i = 0; i < n; i++) {\n        for (int mode = 0; mode < 2; mode++) {\n            int l = i;\n            int r = i + mode;\n            while (l >= 0 && r < n && s[l] == s[r]) {\n                total++;\n                l--;\n                r++;\n            }\n        }\n    }\n    return total;\n}`,
              csharp: `public static int CountSubstrings(string s)\n{\n    int n = s.Length, total = 0;\n    for (int i = 0; i < n; i++)\n    {\n        for (int mode = 0; mode < 2; mode++)\n        {\n            int l = i, r = i + mode;\n            while (l >= 0 && r < n && s[l] == s[r])\n            {\n                total++;\n                l--;\n                r++;\n            }\n        }\n    }\n    return total;\n}`,
              go: `func countSubstrings(s string) int {\n	n := len(s)\n	total := 0\n	for i := 0; i < n; i++ {\n		for mode := 0; mode < 2; mode++ {\n			l := i\n			r := i + mode\n			for l >= 0 && r < n && s[l] == s[r] {\n				total++\n				l--\n				r++\n			}\n		}\n	}\n	return total\n}`,
              kotlin: `fun countSubstrings(s: String): Int {\n    val n = s.length\n    var total = 0\n    for (i in 0 until n) {\n        for (mode in 0 until 2) {\n            var l = i\n            var r = i + mode\n            while (l >= 0 && r < n && s[l] == s[r]) {\n                total++\n                l--\n                r++\n            }\n        }\n    }\n    return total\n}`,
              swift: `func countSubstrings(_ s: String) -> Int {\n    let c = Array(s)\n    let n = c.count\n    var total = 0\n    for i in 0..<n {\n        for mode in 0..<2 {\n            var l = i\n            var r = i + mode\n            while l >= 0 && r < n && c[l] == c[r] {\n                total += 1\n                l -= 1\n                r += 1\n            }\n        }\n    }\n    return total\n}`,
              rust: `fn countSubstrings(s: String) -> i32 {\n    let b: Vec<u8> = s.bytes().collect();\n    let n = b.len() as i32;\n    let mut total = 0;\n    for i in 0..n {\n        for mode in 0..2 {\n            let mut l = i;\n            let mut r = i + mode;\n            while l >= 0 && r < n && b[l as usize] == b[r as usize] {\n                total += 1;\n                l -= 1;\n                r += 1;\n            }\n        }\n    }\n    total\n}`,
              php: `function countSubstrings($s) {\n    $n = strlen($s);\n    $total = 0;\n    for ($i = 0; $i < $n; $i++) {\n        for ($mode = 0; $mode < 2; $mode++) {\n            $l = $i;\n            $r = $i + $mode;\n            while ($l >= 0 && $r < $n && $s[$l] === $s[$r]) {\n                $total++;\n                $l--;\n                $r++;\n            }\n        }\n    }\n    return $total;\n}`,
              ruby: `def countSubstrings(s)\n  n = s.length\n  total = 0\n  (0...n).each do |i|\n    (0...2).each do |mode|\n      l = i\n      r = i + mode\n      while l >= 0 && r < n && s[l] == s[r]\n        total += 1\n        l -= 1\n        r += 1\n      end\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Longest Repeating Character Replacement ─────────────────────
  (() => {
    const ref = (s: string, k: number) => {
      const count = new Array(26).fill(0);
      let start = 0, maxFreq = 0, best = 0;
      for (let i = 0; i < s.length; i++) {
        const ci = s.charCodeAt(i) - 97;
        count[ci]++;
        maxFreq = Math.max(maxFreq, count[ci]);
        while (i - start + 1 - maxFreq > k) {
          count[s.charCodeAt(start) - 97]--;
          start++;
        }
        best = Math.max(best, i - start + 1);
      }
      return best;
    };
    return {
      slug: "longest-repeating-character-replacement",
      title: "Longest Repeating Character Replacement",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window"],
      signature: { funcName: "characterReplacement", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `s` and an integer `k`. You may change at most `k` characters to any other uppercase letter. Return the length of the **longest substring containing one repeated letter** you can obtain.",
        [
          { in: 's = "ABAB", k = 2', out: "4", note: "Replace both A's (or both B's)." },
          { in: 's = "AABABBA", k = 1', out: "4" },
        ],
        ["1 <= s.length <= 40", "s consists of lowercase English letters.", "0 <= k <= s.length"]),
      hints: [
        "A window is valid when (window length - count of its most frequent letter) <= k.",
        "Grow the right edge; shrink from the left only when the window turns invalid.",
      ],
      examples: [
        { input: '"abab"\n2', expectedOutput: "4" },
        { input: '"aababba"\n1', expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 40, "abc");
        const k = ri(rng, 0, s.length);
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      editorial: explain({
        idea: "A window can be made uniform with at most `k` replacements exactly when the number of characters that are **not** the window's most frequent one is at most `k` — that is, `windowLength - maxFrequency <= k`. Slide a window maintaining that invariant and take the largest.",
        steps: [
          "Keep a frequency table for the characters inside the window and a left edge `l`.",
          "Extend the right edge, incrementing the incoming character's count.",
          "While `windowLength - maxFrequency` exceeds `k`, advance `l`, decrementing the outgoing character's count.",
          "Record the window length once the invariant is restored.",
          "The largest such length is the answer.",
        ],
        why: "Keeping the most frequent character and replacing everything else is always the cheapest way to make a window uniform — any other choice needs at least as many replacements. So `windowLength - maxFrequency` is exactly the minimum cost for that window, and comparing it against `k` is an exact feasibility test. The window only shrinks to restore feasibility, so for each right edge it is as long as it can be.",
        time: "O(n · alphabet)",
        space: "O(1)",
        pitfalls: [
          "The cost is `windowLength - maxFrequency`, not the count of any particular character.",
          "Measure the window only after restoring the invariant.",
          "Decrement the outgoing character's count as the left edge moves, or the frequencies drift.",
          "`k = 0` is legal and reduces to the longest run of a single repeated character.",
        ],
      }),
      solutions: {
        python: `def characterReplacement(s: str, k: int) -> int:\n    count = [0] * 26\n    start = 0\n    max_freq = 0\n    best = 0\n    for i, ch in enumerate(s):\n        ci = ord(ch) - 97\n        count[ci] += 1\n        max_freq = max(max_freq, count[ci])\n        while i - start + 1 - max_freq > k:\n            count[ord(s[start]) - 97] -= 1\n            start += 1\n        best = max(best, i - start + 1)\n    return best`,
        javascript: `var characterReplacement = function(s, k) {\n    const count = new Array(26).fill(0);\n    let start = 0, maxFreq = 0, best = 0;\n    for (let i = 0; i < s.length; i++) {\n        const ci = s.charCodeAt(i) - 97;\n        count[ci]++;\n        maxFreq = Math.max(maxFreq, count[ci]);\n        while (i - start + 1 - maxFreq > k) {\n            count[s.charCodeAt(start) - 97]--;\n            start++;\n        }\n        best = Math.max(best, i - start + 1);\n    }\n    return best;\n};`,
              typescript: `function characterReplacement(s: string, k: number): number {\n    const count: number[] = [];\n    for (let i = 0; i < 128; i++) count.push(0);\n    let l = 0;\n    let best = 0;\n    for (let r = 0; r < s.length; r++) {\n        count[s.charCodeAt(r)]++;\n        while (true) {\n            let maxc = 0;\n            for (let c = 0; c < 128; c++) if (count[c] > maxc) maxc = count[c];\n            if (r - l + 1 - maxc <= k) break;\n            count[s.charCodeAt(l)]--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              java: `public static int characterReplacement(String s, int k) {\n    int[] count = new int[128];\n    int l = 0, best = 0;\n    for (int r = 0; r < s.length(); r++) {\n        count[s.charAt(r)]++;\n        while (true) {\n            int maxc = 0;\n            for (int c = 0; c < 128; c++) if (count[c] > maxc) maxc = count[c];\n            if (r - l + 1 - maxc <= k) break;\n            count[s.charAt(l)]--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              cpp: `int characterReplacement(string s, int k) {\n    vector<int> count(128, 0);\n    int l = 0, best = 0;\n    for (int r = 0; r < (int) s.size(); r++) {\n        count[(unsigned char) s[r]]++;\n        while (true) {\n            int maxc = 0;\n            for (int c = 0; c < 128; c++) if (count[c] > maxc) maxc = count[c];\n            if (r - l + 1 - maxc <= k) break;\n            count[(unsigned char) s[l]]--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              c: `int characterReplacement(const char* s, int k) {\n    int count[128];\n    for (int i = 0; i < 128; i++) count[i] = 0;\n    int n = (int) strlen(s);\n    int l = 0, best = 0;\n    for (int r = 0; r < n; r++) {\n        count[(unsigned char) s[r]]++;\n        while (1) {\n            int maxc = 0;\n            for (int c = 0; c < 128; c++) if (count[c] > maxc) maxc = count[c];\n            if (r - l + 1 - maxc <= k) break;\n            count[(unsigned char) s[l]]--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              csharp: `public static int CharacterReplacement(string s, int k)\n{\n    int[] count = new int[128];\n    int l = 0, best = 0;\n    for (int r = 0; r < s.Length; r++)\n    {\n        count[s[r]]++;\n        while (true)\n        {\n            int maxc = 0;\n            for (int c = 0; c < 128; c++) if (count[c] > maxc) maxc = count[c];\n            if (r - l + 1 - maxc <= k) break;\n            count[s[l]]--;\n            l++;\n        }\n        if (r - l + 1 > best) best = r - l + 1;\n    }\n    return best;\n}`,
              go: `func characterReplacement(s string, k int) int {\n	count := make([]int, 128)\n	l, best := 0, 0\n	for r := 0; r < len(s); r++ {\n		count[s[r]]++\n		for {\n			maxc := 0\n			for c := 0; c < 128; c++ {\n				if count[c] > maxc {\n					maxc = count[c]\n				}\n			}\n			if r-l+1-maxc <= k {\n				break\n			}\n			count[s[l]]--\n			l++\n		}\n		if r-l+1 > best {\n			best = r - l + 1\n		}\n	}\n	return best\n}`,
              kotlin: `fun characterReplacement(s: String, k: Int): Int {\n    val count = IntArray(128)\n    var l = 0\n    var best = 0\n    for (r in s.indices) {\n        count[s[r].toInt()]++\n        while (true) {\n            var maxc = 0\n            for (c in 0 until 128) if (count[c] > maxc) maxc = count[c]\n            if (r - l + 1 - maxc <= k) break\n            count[s[l].toInt()]--\n            l++\n        }\n        if (r - l + 1 > best) best = r - l + 1\n    }\n    return best\n}`,
              swift: `func characterReplacement(_ s: String, _ k: Int) -> Int {\n    let codes = Array(s.unicodeScalars).map { Int($0.value) }\n    var count = [Int](repeating: 0, count: 128)\n    var l = 0\n    var best = 0\n    for r in 0..<codes.count {\n        count[codes[r]] += 1\n        while true {\n            var maxc = 0\n            for c in 0..<128 where count[c] > maxc { maxc = count[c] }\n            if r - l + 1 - maxc <= k { break }\n            count[codes[l]] -= 1\n            l += 1\n        }\n        if r - l + 1 > best { best = r - l + 1 }\n    }\n    return best\n}`,
              rust: `fn characterReplacement(s: String, k: i32) -> i32 {\n    let b: Vec<u8> = s.bytes().collect();\n    let mut count = [0i32; 128];\n    let mut l = 0usize;\n    let mut best = 0;\n    for r in 0..b.len() {\n        count[b[r] as usize] += 1;\n        loop {\n            let mut maxc = 0;\n            for c in 0..128 {\n                if count[c] > maxc {\n                    maxc = count[c];\n                }\n            }\n            if (r + 1 - l) as i32 - maxc <= k {\n                break;\n            }\n            count[b[l] as usize] -= 1;\n            l += 1;\n        }\n        let len = (r + 1 - l) as i32;\n        if len > best {\n            best = len;\n        }\n    }\n    best\n}`,
              php: `function characterReplacement($s, $k) {\n    $count = array_fill(0, 128, 0);\n    $l = 0;\n    $best = 0;\n    $n = strlen($s);\n    for ($r = 0; $r < $n; $r++) {\n        $count[ord($s[$r])]++;\n        while (true) {\n            $maxc = max($count);\n            if ($r - $l + 1 - $maxc <= $k) break;\n            $count[ord($s[$l])]--;\n            $l++;\n        }\n        if ($r - $l + 1 > $best) $best = $r - $l + 1;\n    }\n    return $best;\n}`,
              ruby: `def characterReplacement(s, k)\n  count = Array.new(128, 0)\n  l = 0\n  best = 0\n  (0...s.length).each do |r|\n    count[s[r].ord] += 1\n    loop do\n      maxc = count.max\n      break if r - l + 1 - maxc <= k\n      count[s[l].ord] -= 1\n      l += 1\n    end\n    best = r - l + 1 if r - l + 1 > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Find All Anagrams in a String ───────────────────────────────
  (() => {
    const ref = (s: string, p: string) => {
      const out: number[] = [];
      if (p.length > s.length) return out;
      const need = new Array(26).fill(0);
      const have = new Array(26).fill(0);
      for (const ch of p) need[ch.charCodeAt(0) - 97]++;
      for (let i = 0; i < s.length; i++) {
        have[s.charCodeAt(i) - 97]++;
        if (i >= p.length) have[s.charCodeAt(i - p.length) - 97]--;
        if (i >= p.length - 1 && need.every((n, j) => n === have[j])) out.push(i - p.length + 1);
      }
      return out;
    };
    return {
      slug: "find-all-anagrams-in-a-string",
      title: "Find All Anagrams in a String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window", "Hash Table"],
      signature: { funcName: "findAnagrams", params: [{ name: "s", type: "string" as const }, { name: "p", type: "string" as const }], returns: "int[]" as const },
      description: describe(
        "Given two strings `s` and `p`, return an array of all the **start indices of `p`'s anagrams in `s`**, in increasing order.",
        [
          { in: 's = "cbaebabacd", p = "abc"', out: "[0,6]", note: 'Substrings "cba" (index 0) and "bac" (index 6).' },
          { in: 's = "abab", p = "ab"', out: "[0,1,2]" },
        ],
        ["1 <= s.length, p.length <= 40", "s and p consist of lowercase English letters."]),
      hints: [
        "Compare letter-frequency counts of a sliding window of length |p| against p's counts.",
        "Update the window counts incrementally: add the entering char, remove the leaving one.",
      ],
      examples: [
        { input: '"cbaebabacd"\n"abc"', expectedOutput: "[0,6]" },
        { input: '"abab"\n"ab"', expectedOutput: "[0,1,2]" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 40, "abc");
        const p = randLower(rng, 1, 5, "abc");
        return { input: `"${s}"\n"${p}"`, expectedOutput: fmtIntArr(ref(s, p)) };
      },
      editorial: explain({
        idea: "An anagram of `p` is any window of `s` with the same **length** and the same **character frequencies**. So slide a fixed-width window of size `|p|` across `s`, updating counts incrementally, and record every position where the tables agree.",
        steps: [
          "Build a frequency table for `p`.",
          "Slide a window of width `|p|` across `s`, adding the entering character's count.",
          "Once the window is wider than `|p|`, subtract the character leaving on the left.",
          "When the window reaches full width, compare the two tables and record the start index on a match.",
          "Return the indices in the order found, which is already increasing.",
        ],
        why: "Two equal-length strings are anagrams exactly when their character multisets match, and a fixed-size count table is that multiset. Updating incrementally — one addition and one removal per step — is what keeps the sweep linear instead of rebuilding a table for every window. Because the window advances left to right, the recorded indices come out sorted with no extra work.",
        time: "O(|s| · alphabet)",
        space: "O(1)",
        pitfalls: [
          "The window is **fixed width**; growing and shrinking it solves a different problem.",
          "Remove the outgoing character as well as adding the incoming one.",
          "Start recording only once the window is exactly `|p|` wide.",
          "If `p` is longer than `s` the answer is empty, which falls out because the window never fills.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef findAnagrams(s: str, p: str) -> List[int]:\n    out = []\n    if len(p) > len(s):\n        return out\n    need = [0] * 26\n    have = [0] * 26\n    for ch in p:\n        need[ord(ch) - 97] += 1\n    for i, ch in enumerate(s):\n        have[ord(ch) - 97] += 1\n        if i >= len(p):\n            have[ord(s[i - len(p)]) - 97] -= 1\n        if i >= len(p) - 1 and have == need:\n            out.append(i - len(p) + 1)\n    return out`,
        javascript: `var findAnagrams = function(s, p) {\n    const out = [];\n    if (p.length > s.length) return out;\n    const need = new Array(26).fill(0);\n    const have = new Array(26).fill(0);\n    for (const ch of p) need[ch.charCodeAt(0) - 97]++;\n    for (let i = 0; i < s.length; i++) {\n        have[s.charCodeAt(i) - 97]++;\n        if (i >= p.length) have[s.charCodeAt(i - p.length) - 97]--;\n        if (i >= p.length - 1) {\n            let ok = true;\n            for (let j = 0; j < 26; j++) {\n                if (need[j] !== have[j]) { ok = false; break; }\n            }\n            if (ok) out.push(i - p.length + 1);\n        }\n    }\n    return out;\n};`,
              typescript: `function findAnagrams(s: string, p: string): number[] {\n    const out: number[] = [];\n    const n = s.length;\n    const m = p.length;\n    if (m > n) return out;\n    const need: number[] = [];\n    const have: number[] = [];\n    for (let i = 0; i < 26; i++) {\n        need.push(0);\n        have.push(0);\n    }\n    for (let i = 0; i < m; i++) need[p.charCodeAt(i) - 97]++;\n    for (let i = 0; i < n; i++) {\n        have[s.charCodeAt(i) - 97]++;\n        if (i >= m) have[s.charCodeAt(i - m) - 97]--;\n        if (i >= m - 1) {\n            let same = true;\n            for (let c = 0; c < 26; c++) {\n                if (need[c] !== have[c]) {\n                    same = false;\n                    break;\n                }\n            }\n            if (same) out.push(i - m + 1);\n        }\n    }\n    return out;\n}`,
              java: `public static int[] findAnagrams(String s, String p) {\n    List<Integer> out = new ArrayList<>();\n    int n = s.length(), m = p.length();\n    if (m <= n) {\n        int[] need = new int[26];\n        int[] have = new int[26];\n        for (int i = 0; i < m; i++) need[p.charAt(i) - 'a']++;\n        for (int i = 0; i < n; i++) {\n            have[s.charAt(i) - 'a']++;\n            if (i >= m) have[s.charAt(i - m) - 'a']--;\n            if (i >= m - 1 && Arrays.equals(need, have)) out.add(i - m + 1);\n        }\n    }\n    int[] res = new int[out.size()];\n    for (int i = 0; i < out.size(); i++) res[i] = out.get(i);\n    return res;\n}`,
              cpp: `vector<int> findAnagrams(string s, string p) {\n    vector<int> out;\n    int n = (int) s.size(), m = (int) p.size();\n    if (m > n) return out;\n    vector<int> need(26, 0), have(26, 0);\n    for (int i = 0; i < m; i++) need[p[i] - 'a']++;\n    for (int i = 0; i < n; i++) {\n        have[s[i] - 'a']++;\n        if (i >= m) have[s[i - m] - 'a']--;\n        if (i >= m - 1 && need == have) out.push_back(i - m + 1);\n    }\n    return out;\n}`,
              c: `int* findAnagrams(const char* s, const char* p, int* returnSize) {\n    int n = (int) strlen(s);\n    int m = (int) strlen(p);\n    int* out = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int count = 0;\n    if (m > n) {\n        *returnSize = 0;\n        return out;\n    }\n    int need[26], have[26];\n    for (int i = 0; i < 26; i++) {\n        need[i] = 0;\n        have[i] = 0;\n    }\n    for (int i = 0; i < m; i++) need[p[i] - 'a']++;\n    for (int i = 0; i < n; i++) {\n        have[s[i] - 'a']++;\n        if (i >= m) have[s[i - m] - 'a']--;\n        if (i >= m - 1) {\n            int same = 1;\n            for (int c = 0; c < 26; c++) {\n                if (need[c] != have[c]) {\n                    same = 0;\n                    break;\n                }\n            }\n            if (same) out[count++] = i - m + 1;\n        }\n    }\n    *returnSize = count;\n    return out;\n}`,
              csharp: `public static int[] FindAnagrams(string s, string p)\n{\n    var res = new List<int>();\n    int n = s.Length, m = p.Length;\n    if (m <= n)\n    {\n        int[] need = new int[26];\n        int[] have = new int[26];\n        for (int i = 0; i < m; i++) need[p[i] - 'a']++;\n        for (int i = 0; i < n; i++)\n        {\n            have[s[i] - 'a']++;\n            if (i >= m) have[s[i - m] - 'a']--;\n            if (i >= m - 1)\n            {\n                bool same = true;\n                for (int c = 0; c < 26; c++)\n                {\n                    if (need[c] != have[c]) { same = false; break; }\n                }\n                if (same) res.Add(i - m + 1);\n            }\n        }\n    }\n    return res.ToArray();\n}`,
              go: `func findAnagrams(s string, p string) []int {\n	out := []int{}\n	n, m := len(s), len(p)\n	if m > n {\n		return out\n	}\n	need := make([]int, 26)\n	have := make([]int, 26)\n	for i := 0; i < m; i++ {\n		need[p[i]-'a']++\n	}\n	for i := 0; i < n; i++ {\n		have[s[i]-'a']++\n		if i >= m {\n			have[s[i-m]-'a']--\n		}\n		if i >= m-1 {\n			same := true\n			for c := 0; c < 26; c++ {\n				if need[c] != have[c] {\n					same = false\n					break\n				}\n			}\n			if same {\n				out = append(out, i-m+1)\n			}\n		}\n	}\n	return out\n}`,
              kotlin: `fun findAnagrams(s: String, p: String): IntArray {\n    val out = mutableListOf<Int>()\n    val n = s.length\n    val m = p.length\n    if (m > n) return IntArray(0)\n    val need = IntArray(26)\n    val have = IntArray(26)\n    for (i in 0 until m) need[p[i] - 'a']++\n    for (i in 0 until n) {\n        have[s[i] - 'a']++\n        if (i >= m) have[s[i - m] - 'a']--\n        if (i >= m - 1 && need.contentEquals(have)) out.add(i - m + 1)\n    }\n    return out.toIntArray()\n}`,
              swift: `func findAnagrams(_ s: String, _ p: String) -> [Int] {\n    var out: [Int] = []\n    let a = Array(s.unicodeScalars).map { Int($0.value) - 97 }\n    let b = Array(p.unicodeScalars).map { Int($0.value) - 97 }\n    let n = a.count\n    let m = b.count\n    if m > n { return out }\n    var need = [Int](repeating: 0, count: 26)\n    var have = [Int](repeating: 0, count: 26)\n    for i in 0..<m { need[b[i]] += 1 }\n    for i in 0..<n {\n        have[a[i]] += 1\n        if i >= m { have[a[i - m]] -= 1 }\n        if i >= m - 1 && need == have { out.append(i - m + 1) }\n    }\n    return out\n}`,
              rust: `fn findAnagrams(s: String, p: String) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    let a: Vec<usize> = s.bytes().map(|c| (c - b'a') as usize).collect();\n    let b: Vec<usize> = p.bytes().map(|c| (c - b'a') as usize).collect();\n    let n = a.len();\n    let m = b.len();\n    if m > n {\n        return out;\n    }\n    let mut need = [0i32; 26];\n    let mut have = [0i32; 26];\n    for i in 0..m {\n        need[b[i]] += 1;\n    }\n    for i in 0..n {\n        have[a[i]] += 1;\n        if i >= m {\n            have[a[i - m]] -= 1;\n        }\n        if i + 1 >= m && need == have {\n            out.push((i + 1 - m) as i32);\n        }\n    }\n    out\n}`,
              php: `function findAnagrams($s, $p) {\n    $out = array();\n    $n = strlen($s);\n    $m = strlen($p);\n    if ($m > $n) return $out;\n    $need = array_fill(0, 26, 0);\n    $have = array_fill(0, 26, 0);\n    for ($i = 0; $i < $m; $i++) $need[ord($p[$i]) - 97]++;\n    for ($i = 0; $i < $n; $i++) {\n        $have[ord($s[$i]) - 97]++;\n        if ($i >= $m) $have[ord($s[$i - $m]) - 97]--;\n        if ($i >= $m - 1 && $need === $have) $out[] = $i - $m + 1;\n    }\n    return $out;\n}`,
              ruby: `def findAnagrams(s, p)\n  out = []\n  n = s.length\n  m = p.length\n  return out if m > n\n  need = Array.new(26, 0)\n  have = Array.new(26, 0)\n  (0...m).each { |i| need[p[i].ord - 97] += 1 }\n  (0...n).each do |i|\n    have[s[i].ord - 97] += 1\n    have[s[i - m].ord - 97] -= 1 if i >= m\n    out.push(i - m + 1) if i >= m - 1 && need == have\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Isomorphic Strings ──────────────────────────────────────────
  (() => {
    const ref = (s: string, t: string) => {
      if (s.length !== t.length) return false;
      const m1 = new Map<string, string>(), m2 = new Map<string, string>();
      for (let i = 0; i < s.length; i++) {
        const a = s[i], b = t[i];
        if (m1.has(a) && m1.get(a) !== b) return false;
        if (m2.has(b) && m2.get(b) !== a) return false;
        m1.set(a, b); m2.set(b, a);
      }
      return true;
    };
    return {
      slug: "isomorphic-strings",
      title: "Isomorphic Strings",
      difficulty: "EASY" as const,
      tags: ["String", "Hash Table"],
      signature: { funcName: "isIsomorphic", params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Two strings are **isomorphic** if the characters in `s` can be replaced to get `t`, preserving order, with every occurrence of a character mapping to the same character and **no two characters mapping to the same character**.\n\nGiven `s` and `t`, return `true` if they are isomorphic.",
        [
          { in: 's = "egg", t = "add"', out: "true" },
          { in: 's = "foo", t = "bar"', out: "false" },
          { in: 's = "paper", t = "title"', out: "true" },
        ],
        ["1 <= s.length <= 30", "t.length == s.length", "Lowercase English letters."]),
      hints: [
        "Keep a mapping in BOTH directions — one map alone misses collisions.",
        "Check consistency at every position before recording the pair.",
      ],
      examples: [
        { input: '"egg"\n"add"', expectedOutput: "true" },
        { input: '"foo"\n"bar"', expectedOutput: "false" },
        { input: '"paper"\n"title"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const s = randLower(rng, n, n, "abcde");
        let t: string;
        if (rng() < 0.5) {
          const map = new Map<string, string>();
          const targets = "vwxyz";
          let used = 0;
          t = [...s].map((ch) => {
            if (!map.has(ch)) map.set(ch, targets[used++ % 5]);
            return map.get(ch)!;
          }).join("");
        } else {
          t = randLower(rng, n, n, "abcde");
        }
        return { input: `"${s}"\n"${t}"`, expectedOutput: bool(ref(s, t)) };
      },
      editorial: explain({
        idea: "Isomorphism is a **bijection** between characters, so one mapping table is not enough — you need both directions. `s[i] -> t[i]` must be consistent, and so must `t[i] -> s[i]`; without the second check, `\"ab\"` and `\"aa\"` would wrongly pass.",
        steps: [
          "Keep two tables: forward, from characters of `s` to characters of `t`, and backward, the reverse.",
          "For each position, look up both mappings.",
          "If either has been set before and disagrees with the current pair, return `false`.",
          "Otherwise record both directions and continue.",
          "Surviving the scan means the strings are isomorphic.",
        ],
        why: "A valid replacement scheme must be a function (each character of `s` maps to exactly one character of `t`) and injective (no two characters of `s` collapse onto the same character of `t`). The forward table enforces the first property and the backward table the second — together they make the mapping a bijection on the characters actually used, which is precisely the definition.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "One map alone is the classic bug: it accepts `\"ab\"` → `\"aa\"`, which collapses two characters into one.",
          "The strings are guaranteed to be the same length here, but a length check is the natural first guard in general.",
          "Use a sentinel that cannot be a real character (such as `0`) to mean \"unmapped\".",
          "A character legitimately maps to itself; that is not a special case.",
        ],
      }),
      solutions: {
        python: `def isIsomorphic(s: str, t: str) -> bool:\n    if len(s) != len(t):\n        return False\n    m1 = {}\n    m2 = {}\n    for a, b in zip(s, t):\n        if a in m1 and m1[a] != b:\n            return False\n        if b in m2 and m2[b] != a:\n            return False\n        m1[a] = b\n        m2[b] = a\n    return True`,
        javascript: `var isIsomorphic = function(s, t) {\n    if (s.length !== t.length) return false;\n    const m1 = new Map(), m2 = new Map();\n    for (let i = 0; i < s.length; i++) {\n        const a = s[i], b = t[i];\n        if (m1.has(a) && m1.get(a) !== b) return false;\n        if (m2.has(b) && m2.get(b) !== a) return false;\n        m1.set(a, b);\n        m2.set(b, a);\n    }\n    return true;\n};`,
              typescript: `function isIsomorphic(s: string, t: string): boolean {\n    const forward: number[] = [];\n    const backward: number[] = [];\n    for (let i = 0; i < 128; i++) {\n        forward.push(-1);\n        backward.push(-1);\n    }\n    for (let i = 0; i < s.length; i++) {\n        const a = s.charCodeAt(i);\n        const b = t.charCodeAt(i);\n        if (forward[a] === -1 && backward[b] === -1) {\n            forward[a] = b;\n            backward[b] = a;\n        } else if (forward[a] !== b || backward[b] !== a) {\n            return false;\n        }\n    }\n    return true;\n}`,
              java: `public static boolean isIsomorphic(String s, String t) {\n    int[] forward = new int[128];\n    int[] backward = new int[128];\n    Arrays.fill(forward, -1);\n    Arrays.fill(backward, -1);\n    for (int i = 0; i < s.length(); i++) {\n        int a = s.charAt(i), b = t.charAt(i);\n        if (forward[a] == -1 && backward[b] == -1) {\n            forward[a] = b;\n            backward[b] = a;\n        } else if (forward[a] != b || backward[b] != a) {\n            return false;\n        }\n    }\n    return true;\n}`,
              cpp: `bool isIsomorphic(string s, string t) {\n    vector<int> forward(128, -1), backward(128, -1);\n    for (int i = 0; i < (int) s.size(); i++) {\n        int a = (unsigned char) s[i], b = (unsigned char) t[i];\n        if (forward[a] == -1 && backward[b] == -1) {\n            forward[a] = b;\n            backward[b] = a;\n        } else if (forward[a] != b || backward[b] != a) {\n            return false;\n        }\n    }\n    return true;\n}`,
              c: `bool isIsomorphic(const char* s, const char* t) {\n    int forward[128], backward[128];\n    for (int i = 0; i < 128; i++) {\n        forward[i] = -1;\n        backward[i] = -1;\n    }\n    int n = (int) strlen(s);\n    for (int i = 0; i < n; i++) {\n        int a = (unsigned char) s[i];\n        int b = (unsigned char) t[i];\n        if (forward[a] == -1 && backward[b] == -1) {\n            forward[a] = b;\n            backward[b] = a;\n        } else if (forward[a] != b || backward[b] != a) {\n            return false;\n        }\n    }\n    return true;\n}`,
              csharp: `public static bool IsIsomorphic(string s, string t)\n{\n    int[] forward = new int[128];\n    int[] backward = new int[128];\n    for (int i = 0; i < 128; i++) { forward[i] = -1; backward[i] = -1; }\n    for (int i = 0; i < s.Length; i++)\n    {\n        int a = s[i], b = t[i];\n        if (forward[a] == -1 && backward[b] == -1)\n        {\n            forward[a] = b;\n            backward[b] = a;\n        }\n        else if (forward[a] != b || backward[b] != a)\n        {\n            return false;\n        }\n    }\n    return true;\n}`,
              go: `func isIsomorphic(s string, t string) bool {\n	forward := make([]int, 128)\n	backward := make([]int, 128)\n	for i := 0; i < 128; i++ {\n		forward[i] = -1\n		backward[i] = -1\n	}\n	for i := 0; i < len(s); i++ {\n		a := int(s[i])\n		b := int(t[i])\n		if forward[a] == -1 && backward[b] == -1 {\n			forward[a] = b\n			backward[b] = a\n		} else if forward[a] != b || backward[b] != a {\n			return false\n		}\n	}\n	return true\n}`,
              kotlin: `fun isIsomorphic(s: String, t: String): Boolean {\n    val forward = IntArray(128) { -1 }\n    val backward = IntArray(128) { -1 }\n    for (i in s.indices) {\n        val a = s[i].toInt()\n        val b = t[i].toInt()\n        if (forward[a] == -1 && backward[b] == -1) {\n            forward[a] = b\n            backward[b] = a\n        } else if (forward[a] != b || backward[b] != a) {\n            return false\n        }\n    }\n    return true\n}`,
              swift: `func isIsomorphic(_ s: String, _ t: String) -> Bool {\n    let a = Array(s.unicodeScalars).map { Int($0.value) }\n    let b = Array(t.unicodeScalars).map { Int($0.value) }\n    var forward = [Int](repeating: -1, count: 128)\n    var backward = [Int](repeating: -1, count: 128)\n    for i in 0..<a.count {\n        let x = a[i]\n        let y = b[i]\n        if forward[x] == -1 && backward[y] == -1 {\n            forward[x] = y\n            backward[y] = x\n        } else if forward[x] != y || backward[y] != x {\n            return false\n        }\n    }\n    return true\n}`,
              rust: `fn isIsomorphic(s: String, t: String) -> bool {\n    let a: Vec<usize> = s.bytes().map(|c| c as usize).collect();\n    let b: Vec<usize> = t.bytes().map(|c| c as usize).collect();\n    let mut forward = [-1i32; 128];\n    let mut backward = [-1i32; 128];\n    for i in 0..a.len() {\n        let x = a[i];\n        let y = b[i];\n        if forward[x] == -1 && backward[y] == -1 {\n            forward[x] = y as i32;\n            backward[y] = x as i32;\n        } else if forward[x] != y as i32 || backward[y] != x as i32 {\n            return false;\n        }\n    }\n    true\n}`,
              php: `function isIsomorphic($s, $t) {\n    $forward = array_fill(0, 128, -1);\n    $backward = array_fill(0, 128, -1);\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $a = ord($s[$i]);\n        $b = ord($t[$i]);\n        if ($forward[$a] === -1 && $backward[$b] === -1) {\n            $forward[$a] = $b;\n            $backward[$b] = $a;\n        } elseif ($forward[$a] !== $b || $backward[$b] !== $a) {\n            return false;\n        }\n    }\n    return true;\n}`,
              ruby: `def isIsomorphic(s, t)\n  forward = Array.new(128, -1)\n  backward = Array.new(128, -1)\n  (0...s.length).each do |i|\n    a = s[i].ord\n    b = t[i].ord\n    if forward[a] == -1 && backward[b] == -1\n      forward[a] = b\n      backward[b] = a\n    elsif forward[a] != b || backward[b] != a\n      return false\n    end\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Word Pattern ────────────────────────────────────────────────
  (() => {
    const ref = (pattern: string, s: string) => {
      const words = s.split(" ").filter((w) => w !== "");
      if (words.length !== pattern.length) return false;
      const m1 = new Map<string, string>(), m2 = new Map<string, string>();
      for (let i = 0; i < pattern.length; i++) {
        const a = pattern[i], b = words[i];
        if (m1.has(a) && m1.get(a) !== b) return false;
        if (m2.has(b) && m2.get(b) !== a) return false;
        m1.set(a, b); m2.set(b, a);
      }
      return true;
    };
    return {
      slug: "word-pattern",
      title: "Word Pattern",
      difficulty: "EASY" as const,
      tags: ["String", "Hash Table"],
      signature: { funcName: "wordPattern", params: [{ name: "pattern", type: "string" as const }, { name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given a `pattern` and a string `s`, determine whether `s` follows the same pattern: there is a **bijection** between letters in `pattern` and non-empty words in `s` (words are separated by single spaces).",
        [
          { in: 'pattern = "abba", s = "dog cat cat dog"', out: "true" },
          { in: 'pattern = "abba", s = "dog cat cat fish"', out: "false" },
          { in: 'pattern = "aaaa", s = "dog cat cat dog"', out: "false" },
        ],
        ["1 <= pattern.length <= 10", "s contains lowercase words separated by single spaces."]),
      hints: [
        "This is Isomorphic Strings where one side is words instead of characters.",
        "Lengths must match first: number of words == pattern length.",
      ],
      examples: [
        { input: '"abba"\n"dog cat cat dog"', expectedOutput: "true" },
        { input: '"abba"\n"dog cat cat fish"', expectedOutput: "false" },
        { input: '"aaaa"\n"dog cat cat dog"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 10);
        const pattern = randLower(rng, n, n, "abc");
        const dict = ["dog", "cat", "fish", "bird", "cow"];
        let words: string[];
        if (rng() < 0.5) {
          const map = new Map<string, string>();
          let used = 0;
          words = [...pattern].map((ch) => {
            if (!map.has(ch)) map.set(ch, dict[used++ % dict.length]);
            return map.get(ch)!;
          });
        } else {
          words = Array.from({ length: n }, () => dict[ri(rng, 0, dict.length - 1)]);
        }
        const s = words.join(" ");
        return { input: `"${pattern}"\n"${s}"`, expectedOutput: bool(ref(pattern, s)) };
      },
      editorial: explain({
        idea: "This is Isomorphic Strings with words on one side instead of characters. Split `s` on spaces and require a **bijection** between pattern letters and words — checked in both directions, so neither two letters share a word nor one letter takes two words.",
        steps: [
          "Split `s` into words; if the count differs from the pattern's length, return `false` immediately.",
          "Track, for each pattern letter and for each word, the index at which it **first** appeared.",
          "At each position, compare the letter's first index with the word's first index.",
          "If they disagree, the pairing is inconsistent — return `false`.",
          "Otherwise record both first indices on their debut and continue.",
        ],
        why: "Comparing first-occurrence indices captures both halves of the bijection in a single test: if a letter has been seen before but its word has not (or vice versa), the indices differ and the check fails, catching both a letter mapping to two words and two letters mapping to one word. Two separate lookup tables would express the same thing; this formulation just makes the symmetry explicit.",
        time: "O(|s|)",
        space: "O(number of distinct words)",
        pitfalls: [
          "Check the counts first — `\"abba\"` against three words can never match, and skipping the guard leads to out-of-range reads.",
          "One direction is not enough: `\"aaaa\"` against `\"dog cat cat dog\"` must fail, and only the reverse check catches it.",
          "Words are separated by single spaces; splitting naively on whitespace runs is a different parse.",
          "A letter mapping to the identical word each time is fine, not a special case.",
        ],
      }),
      solutions: {
        python: `def wordPattern(pattern: str, s: str) -> bool:\n    words = s.split()\n    if len(words) != len(pattern):\n        return False\n    m1 = {}\n    m2 = {}\n    for a, b in zip(pattern, words):\n        if a in m1 and m1[a] != b:\n            return False\n        if b in m2 and m2[b] != a:\n            return False\n        m1[a] = b\n        m2[b] = a\n    return True`,
        javascript: `var wordPattern = function(pattern, s) {\n    const words = s.split(" ").filter(function(w) { return w !== ""; });\n    if (words.length !== pattern.length) return false;\n    const m1 = new Map(), m2 = new Map();\n    for (let i = 0; i < pattern.length; i++) {\n        const a = pattern[i], b = words[i];\n        if (m1.has(a) && m1.get(a) !== b) return false;\n        if (m2.has(b) && m2.get(b) !== a) return false;\n        m1.set(a, b);\n        m2.set(b, a);\n    }\n    return true;\n};`,
              typescript: `function wordPattern(pattern: string, s: string): boolean {\n    const words = s.split(" ");\n    if (words.length !== pattern.length) return false;\n    const charFirst: number[] = [];\n    for (let i = 0; i < 128; i++) charFirst.push(-1);\n    const wordFirst: { [w: string]: number } = {};\n    for (let i = 0; i < pattern.length; i++) {\n        const c = pattern.charCodeAt(i);\n        const w = words[i];\n        const ci = charFirst[c];\n        const wi = wordFirst[w] === undefined ? -1 : wordFirst[w];\n        if (ci !== wi) return false;\n        if (ci === -1) {\n            charFirst[c] = i;\n            wordFirst[w] = i;\n        }\n    }\n    return true;\n}`,
              java: `public static boolean wordPattern(String pattern, String s) {\n    String[] words = s.split(" ");\n    if (words.length != pattern.length()) return false;\n    int[] charFirst = new int[128];\n    Arrays.fill(charFirst, -1);\n    Map<String, Integer> wordFirst = new HashMap<>();\n    for (int i = 0; i < pattern.length(); i++) {\n        int c = pattern.charAt(i);\n        String w = words[i];\n        int ci = charFirst[c];\n        int wi = wordFirst.containsKey(w) ? wordFirst.get(w) : -1;\n        if (ci != wi) return false;\n        if (ci == -1) {\n            charFirst[c] = i;\n            wordFirst.put(w, i);\n        }\n    }\n    return true;\n}`,
              cpp: `bool wordPattern(string pattern, string s) {\n    vector<string> words;\n    string cur;\n    for (char ch : s) {\n        if (ch == ' ') {\n            words.push_back(cur);\n            cur.clear();\n        } else {\n            cur += ch;\n        }\n    }\n    words.push_back(cur);\n    if (words.size() != pattern.size()) return false;\n    vector<int> charFirst(128, -1);\n    map<string, int> wordFirst;\n    for (int i = 0; i < (int) pattern.size(); i++) {\n        int c = (unsigned char) pattern[i];\n        string w = words[i];\n        int ci = charFirst[c];\n        int wi = wordFirst.count(w) ? wordFirst[w] : -1;\n        if (ci != wi) return false;\n        if (ci == -1) {\n            charFirst[c] = i;\n            wordFirst[w] = i;\n        }\n    }\n    return true;\n}`,
              c: `bool wordPattern(const char* pattern, const char* s) {\n    int pn = (int) strlen(pattern);\n    int sn = (int) strlen(s);\n    char** words = (char**) malloc((sn + 2) * sizeof(char*));\n    int wc = 0;\n    int start = 0;\n    for (int i = 0; i <= sn; i++) {\n        if (i == sn || s[i] == ' ') {\n            int len = i - start;\n            char* w = (char*) malloc(len + 1);\n            for (int k = 0; k < len; k++) w[k] = s[start + k];\n            w[len] = '\\0';\n            words[wc++] = w;\n            start = i + 1;\n        }\n    }\n    if (wc != pn) {\n        for (int i = 0; i < wc; i++) free(words[i]);\n        free(words);\n        return false;\n    }\n    int charFirst[128];\n    for (int i = 0; i < 128; i++) charFirst[i] = -1;\n    int* wordFirst = (int*) malloc(wc * sizeof(int));\n    for (int i = 0; i < wc; i++) wordFirst[i] = -1;\n    bool ok = true;\n    for (int i = 0; i < pn && ok; i++) {\n        int c = (unsigned char) pattern[i];\n        int ci = charFirst[c];\n        int wi = -1;\n        for (int k = 0; k < i; k++) {\n            if (strcmp(words[k], words[i]) == 0) {\n                wi = wordFirst[k];\n                break;\n            }\n        }\n        if (ci != wi) ok = false;\n        else if (ci == -1) {\n            charFirst[c] = i;\n            wordFirst[i] = i;\n        } else {\n            wordFirst[i] = ci;\n        }\n    }\n    for (int i = 0; i < wc; i++) free(words[i]);\n    free(words);\n    free(wordFirst);\n    return ok;\n}`,
              csharp: `public static bool WordPattern(string pattern, string s)\n{\n    string[] words = s.Split(' ');\n    if (words.Length != pattern.Length) return false;\n    int[] charFirst = new int[128];\n    for (int i = 0; i < 128; i++) charFirst[i] = -1;\n    var wordFirst = new Dictionary<string, int>();\n    for (int i = 0; i < pattern.Length; i++)\n    {\n        int c = pattern[i];\n        string w = words[i];\n        int ci = charFirst[c];\n        int wi = wordFirst.ContainsKey(w) ? wordFirst[w] : -1;\n        if (ci != wi) return false;\n        if (ci == -1)\n        {\n            charFirst[c] = i;\n            wordFirst[w] = i;\n        }\n    }\n    return true;\n}`,
              go: `func wordPattern(pattern string, s string) bool {\n	words := strings.Split(s, " ")\n	if len(words) != len(pattern) {\n		return false\n	}\n	charFirst := make([]int, 128)\n	for i := range charFirst {\n		charFirst[i] = -1\n	}\n	wordFirst := map[string]int{}\n	for i := 0; i < len(pattern); i++ {\n		c := int(pattern[i])\n		w := words[i]\n		ci := charFirst[c]\n		wi := -1\n		if v, ok := wordFirst[w]; ok {\n			wi = v\n		}\n		if ci != wi {\n			return false\n		}\n		if ci == -1 {\n			charFirst[c] = i\n			wordFirst[w] = i\n		}\n	}\n	return true\n}`,
              kotlin: `fun wordPattern(pattern: String, s: String): Boolean {\n    val words = s.split(" ")\n    if (words.size != pattern.length) return false\n    val charFirst = IntArray(128) { -1 }\n    val wordFirst = HashMap<String, Int>()\n    for (i in pattern.indices) {\n        val c = pattern[i].toInt()\n        val w = words[i]\n        val ci = charFirst[c]\n        val wi = wordFirst[w] ?: -1\n        if (ci != wi) return false\n        if (ci == -1) {\n            charFirst[c] = i\n            wordFirst[w] = i\n        }\n    }\n    return true\n}`,
              swift: `func wordPattern(_ pattern: String, _ s: String) -> Bool {\n    let words = s.components(separatedBy: " ")\n    let chars = Array(pattern.unicodeScalars).map { Int($0.value) }\n    if words.count != chars.count { return false }\n    var charFirst = [Int](repeating: -1, count: 128)\n    var wordFirst: [String: Int] = [:]\n    for i in 0..<chars.count {\n        let c = chars[i]\n        let w = words[i]\n        let ci = charFirst[c]\n        let wi = wordFirst[w] ?? -1\n        if ci != wi { return false }\n        if ci == -1 {\n            charFirst[c] = i\n            wordFirst[w] = i\n        }\n    }\n    return true\n}`,
              rust: `fn wordPattern(pattern: String, s: String) -> bool {\n    use std::collections::HashMap;\n    let words: Vec<&str> = s.split(' ').collect();\n    let chars: Vec<usize> = pattern.bytes().map(|c| c as usize).collect();\n    if words.len() != chars.len() {\n        return false;\n    }\n    let mut char_first = [-1i32; 128];\n    let mut word_first: HashMap<&str, i32> = HashMap::new();\n    for i in 0..chars.len() {\n        let c = chars[i];\n        let w = words[i];\n        let ci = char_first[c];\n        let wi = *word_first.get(w).unwrap_or(&-1);\n        if ci != wi {\n            return false;\n        }\n        if ci == -1 {\n            char_first[c] = i as i32;\n            word_first.insert(w, i as i32);\n        }\n    }\n    true\n}`,
              php: `function wordPattern($pattern, $s) {\n    $words = explode(" ", $s);\n    $pn = strlen($pattern);\n    if (count($words) !== $pn) return false;\n    $charFirst = array_fill(0, 128, -1);\n    $wordFirst = array();\n    for ($i = 0; $i < $pn; $i++) {\n        $c = ord($pattern[$i]);\n        $w = $words[$i];\n        $ci = $charFirst[$c];\n        $wi = array_key_exists($w, $wordFirst) ? $wordFirst[$w] : -1;\n        if ($ci !== $wi) return false;\n        if ($ci === -1) {\n            $charFirst[$c] = $i;\n            $wordFirst[$w] = $i;\n        }\n    }\n    return true;\n}`,
              ruby: `def wordPattern(pattern, s)\n  words = s.split(" ", -1)\n  return false if words.length != pattern.length\n  char_first = Array.new(128, -1)\n  word_first = {}\n  (0...pattern.length).each do |i|\n    c = pattern[i].ord\n    w = words[i]\n    ci = char_first[c]\n    wi = word_first.fetch(w, -1)\n    return false if ci != wi\n    if ci == -1\n      char_first[c] = i\n      word_first[w] = i\n    end\n  end\n  true\nend`,
      },
    };
  })(),

  // ── String to Integer (atoi) ────────────────────────────────────
  (() => {
    const INT_MAX = 2147483647, INT_MIN = -2147483648;
    const ref = (s: string) => {
      let i = 0;
      while (i < s.length && s[i] === " ") i++;
      let sign = 1;
      if (i < s.length && (s[i] === "+" || s[i] === "-")) {
        if (s[i] === "-") sign = -1;
        i++;
      }
      let num = 0;
      while (i < s.length && s[i] >= "0" && s[i] <= "9") {
        num = num * 10 + (s.charCodeAt(i) - 48);
        if (sign === 1 && num > INT_MAX) return INT_MAX;
        if (sign === -1 && -num < INT_MIN) return INT_MIN;
        i++;
      }
      return sign * num;
    };
    return {
      slug: "string-to-integer-atoi",
      title: "String to Integer (atoi)",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Math"],
      signature: { funcName: "myAtoi", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Implement `myAtoi(s)`:\n\n1. Skip leading spaces.\n2. Read an optional `+`/`-` sign.\n3. Read digits until a non-digit (or the end).\n4. Clamp the result into the 32-bit signed range `[-2147483648, 2147483647]`.\n\nAnything after the number is ignored; if no digits were read, return `0`.",
        [
          { in: 's = "42"', out: "42" },
          { in: 's = "   -042"', out: "-42" },
          { in: 's = "1337c0d3"', out: "1337" },
          { in: 's = "-91283472332"', out: "-2147483648", note: "Clamped to INT_MIN." },
        ],
        ["0 <= s.length <= 25", "s consists of digits, letters, spaces, '+', '-' and '.'"]),
      hints: [
        "Process in three phases: whitespace, sign, digits — each phase advances an index.",
        "Clamp during accumulation, not only at the end.",
      ],
      examples: [
        { input: '"42"', expectedOutput: "42" },
        { input: '"   -042"', expectedOutput: "-42" },
        { input: '"1337c0d3"', expectedOutput: "1337" },
        { input: '"-91283472332"', expectedOutput: "-2147483648" },
      ],
      gen: (rng: Rng) => {
        const pieces = [
          " ".repeat(ri(rng, 0, 3)),
          ["", "+", "-"][ri(rng, 0, 2)],
          String(ri(rng, 0, 1 << 30)) + (rng() < 0.2 ? String(ri(rng, 0, 999)) : ""),
          ["", "abc", ".5", " 7"][ri(rng, 0, 3)],
        ];
        const s = rng() < 0.1 ? "words" : pieces.join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      editorial: explain({
        idea: "A strict three-phase parse — whitespace, then an optional sign, then digits — with the **overflow check applied before each digit is absorbed**, not after. Checking afterwards is too late in fixed-width integer languages, where the value has already wrapped.",
        steps: [
          "Skip leading spaces.",
          "Read an optional single `+` or `-` and remember the sign.",
          "Read digits, accumulating `result = result * 10 + digit`.",
          "**Before** each absorption, test whether it would exceed the 32-bit range; if so return the clamp immediately.",
          "Stop at the first non-digit and return the signed result — no digits at all means `0`.",
        ],
        why: "The guard `result > INT_MAX / 10, or result == INT_MAX / 10 and digit > 7` is exactly the condition for `result * 10 + digit` to exceed `2147483647`, since `INT_MAX` ends in `7`. Testing before multiplying means the overflow never actually happens. Clamping to `INT_MIN` on the negative side is correct even though its magnitude is one larger, because any input that trips the guard is already beyond the representable range in that direction.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Check for overflow *before* multiplying, or the wrap has already destroyed the value.",
          "Only **one** sign character is allowed; `\"+-2\"` parses no digits and returns `0`.",
          "Leading zeros are fine and must not be mistaken for the end of the number.",
          "Trailing junk is simply ignored, but junk *before* the digits (other than spaces and a sign) stops the parse dead.",
        ],
      }),
      solutions: {
        python: `def myAtoi(s: str) -> int:\n    INT_MAX = 2147483647\n    INT_MIN = -2147483648\n    i = 0\n    while i < len(s) and s[i] == " ":\n        i += 1\n    sign = 1\n    if i < len(s) and s[i] in "+-":\n        if s[i] == "-":\n            sign = -1\n        i += 1\n    num = 0\n    while i < len(s) and s[i].isdigit():\n        num = num * 10 + int(s[i])\n        if sign == 1 and num > INT_MAX:\n            return INT_MAX\n        if sign == -1 and -num < INT_MIN:\n            return INT_MIN\n        i += 1\n    return sign * num`,
        javascript: `var myAtoi = function(s) {\n    const INT_MAX = 2147483647, INT_MIN = -2147483648;\n    let i = 0;\n    while (i < s.length && s[i] === " ") i++;\n    let sign = 1;\n    if (i < s.length && (s[i] === "+" || s[i] === "-")) {\n        if (s[i] === "-") sign = -1;\n        i++;\n    }\n    let num = 0;\n    while (i < s.length && s[i] >= "0" && s[i] <= "9") {\n        num = num * 10 + (s.charCodeAt(i) - 48);\n        if (sign === 1 && num > INT_MAX) return INT_MAX;\n        if (sign === -1 && -num < INT_MIN) return INT_MIN;\n        i++;\n    }\n    return sign * num;\n};`,
              typescript: `function myAtoi(s: string): number {\n    const INT_MAX = 2147483647;\n    const INT_MIN = -2147483648;\n    let i = 0;\n    const n = s.length;\n    while (i < n && s.charAt(i) === " ") i++;\n    let sign = 1;\n    if (i < n && (s.charAt(i) === "+" || s.charAt(i) === "-")) {\n        if (s.charAt(i) === "-") sign = -1;\n        i++;\n    }\n    let result = 0;\n    while (i < n) {\n        const c = s.charCodeAt(i);\n        if (c < 48 || c > 57) break;\n        const d = c - 48;\n        if (result > 214748364 || (result === 214748364 && d > 7)) {\n            return sign === 1 ? INT_MAX : INT_MIN;\n        }\n        result = result * 10 + d;\n        i++;\n    }\n    return sign * result;\n}`,
              java: `public static int myAtoi(String s) {\n    int i = 0, n = s.length();\n    while (i < n && s.charAt(i) == ' ') i++;\n    int sign = 1;\n    if (i < n && (s.charAt(i) == '+' || s.charAt(i) == '-')) {\n        if (s.charAt(i) == '-') sign = -1;\n        i++;\n    }\n    int result = 0;\n    while (i < n) {\n        char c = s.charAt(i);\n        if (c < '0' || c > '9') break;\n        int d = c - '0';\n        if (result > 214748364 || (result == 214748364 && d > 7)) {\n            return sign == 1 ? Integer.MAX_VALUE : Integer.MIN_VALUE;\n        }\n        result = result * 10 + d;\n        i++;\n    }\n    return sign * result;\n}`,
              cpp: `int myAtoi(string s) {\n    int i = 0, n = (int) s.size();\n    while (i < n && s[i] == ' ') i++;\n    int sign = 1;\n    if (i < n && (s[i] == '+' || s[i] == '-')) {\n        if (s[i] == '-') sign = -1;\n        i++;\n    }\n    int result = 0;\n    while (i < n) {\n        char c = s[i];\n        if (c < '0' || c > '9') break;\n        int d = c - '0';\n        if (result > 214748364 || (result == 214748364 && d > 7)) {\n            return sign == 1 ? 2147483647 : -2147483648;\n        }\n        result = result * 10 + d;\n        i++;\n    }\n    return sign * result;\n}`,
              c: `int myAtoi(const char* s) {\n    int i = 0;\n    int n = (int) strlen(s);\n    while (i < n && s[i] == ' ') i++;\n    int sign = 1;\n    if (i < n && (s[i] == '+' || s[i] == '-')) {\n        if (s[i] == '-') sign = -1;\n        i++;\n    }\n    int result = 0;\n    while (i < n) {\n        char c = s[i];\n        if (c < '0' || c > '9') break;\n        int d = c - '0';\n        if (result > 214748364 || (result == 214748364 && d > 7)) {\n            return sign == 1 ? 2147483647 : (-2147483647 - 1);\n        }\n        result = result * 10 + d;\n        i++;\n    }\n    return sign * result;\n}`,
              csharp: `public static int MyAtoi(string s)\n{\n    int i = 0, n = s.Length;\n    while (i < n && s[i] == ' ') i++;\n    int sign = 1;\n    if (i < n && (s[i] == '+' || s[i] == '-'))\n    {\n        if (s[i] == '-') sign = -1;\n        i++;\n    }\n    int result = 0;\n    while (i < n)\n    {\n        char c = s[i];\n        if (c < '0' || c > '9') break;\n        int d = c - '0';\n        if (result > 214748364 || (result == 214748364 && d > 7))\n        {\n            return sign == 1 ? int.MaxValue : int.MinValue;\n        }\n        result = result * 10 + d;\n        i++;\n    }\n    return sign * result;\n}`,
              go: `func myAtoi(s string) int {\n	i, n := 0, len(s)\n	for i < n && s[i] == ' ' {\n		i++\n	}\n	sign := 1\n	if i < n && (s[i] == '+' || s[i] == '-') {\n		if s[i] == '-' {\n			sign = -1\n		}\n		i++\n	}\n	result := 0\n	for i < n {\n		c := s[i]\n		if c < '0' || c > '9' {\n			break\n		}\n		d := int(c - '0')\n		if result > 214748364 || (result == 214748364 && d > 7) {\n			if sign == 1 {\n				return 2147483647\n			}\n			return -2147483648\n		}\n		result = result*10 + d\n		i++\n	}\n	return sign * result\n}`,
              kotlin: `fun myAtoi(s: String): Int {\n    var i = 0\n    val n = s.length\n    while (i < n && s[i] == ' ') i++\n    var sign = 1\n    if (i < n && (s[i] == '+' || s[i] == '-')) {\n        if (s[i] == '-') sign = -1\n        i++\n    }\n    var result = 0\n    while (i < n) {\n        val c = s[i]\n        if (c < '0' || c > '9') break\n        val d = c - '0'\n        if (result > 214748364 || (result == 214748364 && d > 7)) {\n            return if (sign == 1) Int.MAX_VALUE else Int.MIN_VALUE\n        }\n        result = result * 10 + d\n        i++\n    }\n    return sign * result\n}`,
              swift: `func myAtoi(_ s: String) -> Int {\n    let c = Array(s)\n    var i = 0\n    let n = c.count\n    while i < n && c[i] == " " { i += 1 }\n    var sign = 1\n    if i < n && (c[i] == "+" || c[i] == "-") {\n        if c[i] == "-" { sign = -1 }\n        i += 1\n    }\n    var result = 0\n    while i < n {\n        guard let d = c[i].wholeNumberValue, c[i].isNumber else { break }\n        if result > 214748364 || (result == 214748364 && d > 7) {\n            return sign == 1 ? 2147483647 : -2147483648\n        }\n        result = result * 10 + d\n        i += 1\n    }\n    return sign * result\n}`,
              rust: `fn myAtoi(s: String) -> i32 {\n    let b: Vec<u8> = s.bytes().collect();\n    let n = b.len();\n    let mut i = 0;\n    while i < n && b[i] == b' ' {\n        i += 1;\n    }\n    let mut sign: i32 = 1;\n    if i < n && (b[i] == b'+' || b[i] == b'-') {\n        if b[i] == b'-' {\n            sign = -1;\n        }\n        i += 1;\n    }\n    let mut result: i32 = 0;\n    while i < n {\n        let c = b[i];\n        if c < b'0' || c > b'9' {\n            break;\n        }\n        let d = (c - b'0') as i32;\n        if result > 214748364 || (result == 214748364 && d > 7) {\n            return if sign == 1 { 2147483647 } else { -2147483648 };\n        }\n        result = result * 10 + d;\n        i += 1;\n    }\n    sign * result\n}`,
              php: `function myAtoi($s) {\n    $i = 0;\n    $n = strlen($s);\n    while ($i < $n && $s[$i] === ' ') $i++;\n    $sign = 1;\n    if ($i < $n && ($s[$i] === '+' || $s[$i] === '-')) {\n        if ($s[$i] === '-') $sign = -1;\n        $i++;\n    }\n    $result = 0;\n    while ($i < $n) {\n        $c = ord($s[$i]);\n        if ($c < 48 || $c > 57) break;\n        $d = $c - 48;\n        if ($result > 214748364 || ($result === 214748364 && $d > 7)) {\n            return $sign === 1 ? 2147483647 : -2147483648;\n        }\n        $result = $result * 10 + $d;\n        $i++;\n    }\n    return $sign * $result;\n}`,
              ruby: `def myAtoi(s)\n  i = 0\n  n = s.length\n  i += 1 while i < n && s[i] == ' '\n  sign = 1\n  if i < n && (s[i] == '+' || s[i] == '-')\n    sign = -1 if s[i] == '-'\n    i += 1\n  end\n  result = 0\n  while i < n\n    c = s[i].ord\n    break if c < 48 || c > 57\n    d = c - 48\n    if result > 214748364 || (result == 214748364 && d > 7)\n      return sign == 1 ? 2147483647 : -2147483648\n    end\n    result = result * 10 + d\n    i += 1\n  end\n  sign * result\nend`,
      },
    };
  })(),

  // ── Compare Version Numbers ─────────────────────────────────────
  (() => {
    const ref = (v1: string, v2: string) => {
      const a = v1.split(".").map(Number), b = v2.split(".").map(Number);
      const n = Math.max(a.length, b.length);
      for (let i = 0; i < n; i++) {
        const x = a[i] || 0, y = b[i] || 0;
        if (x < y) return -1;
        if (x > y) return 1;
      }
      return 0;
    };
    return {
      slug: "compare-version-numbers",
      title: "Compare Version Numbers",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Two Pointers"],
      signature: { funcName: "compareVersion", params: [{ name: "version1", type: "string" as const }, { name: "version2", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given two version strings, `version1` and `version2` (dot-separated numeric revisions, possibly with leading zeros), compare them.\n\nReturn `-1` if `version1 < version2`, `1` if `version1 > version2`, otherwise `0`. Missing revisions count as `0`.",
        [
          { in: 'version1 = "1.2", version2 = "1.10"', out: "-1", note: "Revision 2 < revision 10." },
          { in: 'version1 = "1.01", version2 = "1.001"', out: "0", note: "Leading zeros are ignored." },
          { in: 'version1 = "1.0", version2 = "1.0.0.0"', out: "0" },
        ],
        ["1 <= version.length <= 20", "Only digits and '.'"]),
      hints: [
        "Split on '.' and compare revision integers left to right.",
        "When one version runs out of revisions, treat the rest as zeros.",
      ],
      examples: [
        { input: '"1.2"\n"1.10"', expectedOutput: "-1" },
        { input: '"1.01"\n"1.001"', expectedOutput: "0" },
        { input: '"1.0"\n"1.0.0.0"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const mk = () => Array.from({ length: ri(rng, 1, 4) }, () => String(ri(rng, 0, 30))).join(".");
        const v1 = mk(), v2 = rng() < 0.3 ? mk() : (rng() < 0.5 ? v1 : v1 + ".0");
        return { input: `"${v1}"\n"${v2}"`, expectedOutput: String(ref(v1, v2)) };
      },
      editorial: explain({
        idea: "Versions compare **revision by revision numerically**, not as text. Split both on dots, convert each revision to an integer — which discards leading zeros automatically — and walk them in parallel, treating a missing revision as `0` so `\"1.0\"` and `\"1.0.0.0\"` come out equal.",
        steps: [
          "Split both versions on `.`.",
          "Walk positions up to the longer of the two lists.",
          "Take each side's revision as an integer, or `0` when that side has run out.",
          "Return `-1` or `1` at the first difference.",
          "If every position matches, return `0`.",
        ],
        why: "Numeric conversion is what makes `\"1.10\"` sort above `\"1.2\"` — lexicographic comparison would get that backwards — and it makes `\"01\"` and `\"1\"` identical without any explicit trimming. Padding the shorter version with zeros is the right semantics because trailing zero revisions carry no information, so `\"1.0\"` and `\"1.0.0.0\"` denote the same release.",
        time: "O(|version1| + |version2|)",
        space: "O(number of revisions)",
        pitfalls: [
          "String comparison is wrong: `\"10\" < \"2\"` lexicographically but `10 > 2` numerically.",
          "Missing revisions default to `0`, so the walk must extend to the longer list rather than stopping at the shorter one.",
          "Leading zeros are insignificant, which numeric conversion handles for free.",
          "Return exactly `-1`, `0` or `1`, not the raw difference of the revisions.",
        ],
      }),
      solutions: {
        python: `def compareVersion(version1: str, version2: str) -> int:\n    a = [int(x) for x in version1.split(".")]\n    b = [int(x) for x in version2.split(".")]\n    n = max(len(a), len(b))\n    for i in range(n):\n        x = a[i] if i < len(a) else 0\n        y = b[i] if i < len(b) else 0\n        if x < y:\n            return -1\n        if x > y:\n            return 1\n    return 0`,
        javascript: `var compareVersion = function(version1, version2) {\n    const a = version1.split(".").map(Number);\n    const b = version2.split(".").map(Number);\n    const n = Math.max(a.length, b.length);\n    for (let i = 0; i < n; i++) {\n        const x = a[i] || 0, y = b[i] || 0;\n        if (x < y) return -1;\n        if (x > y) return 1;\n    }\n    return 0;\n};`,
              typescript: `function compareVersion(version1: string, version2: string): number {\n    const a = version1.split(".");\n    const b = version2.split(".");\n    const n = Math.max(a.length, b.length);\n    for (let i = 0; i < n; i++) {\n        const x = i < a.length ? parseInt(a[i], 10) : 0;\n        const y = i < b.length ? parseInt(b[i], 10) : 0;\n        if (x < y) return -1;\n        if (x > y) return 1;\n    }\n    return 0;\n}`,
              java: `public static int compareVersion(String version1, String version2) {\n    String[] a = version1.split("\\\\.");\n    String[] b = version2.split("\\\\.");\n    int n = Math.max(a.length, b.length);\n    for (int i = 0; i < n; i++) {\n        int x = i < a.length ? Integer.parseInt(a[i]) : 0;\n        int y = i < b.length ? Integer.parseInt(b[i]) : 0;\n        if (x < y) return -1;\n        if (x > y) return 1;\n    }\n    return 0;\n}`,
              cpp: `int compareVersion(string version1, string version2) {\n    size_t i = 0, j = 0;\n    int n1 = (int) version1.size(), n2 = (int) version2.size();\n    while (i < (size_t) n1 || j < (size_t) n2) {\n        int x = 0, y = 0;\n        while (i < (size_t) n1 && version1[i] != '.') {\n            x = x * 10 + (version1[i] - '0');\n            i++;\n        }\n        while (j < (size_t) n2 && version2[j] != '.') {\n            y = y * 10 + (version2[j] - '0');\n            j++;\n        }\n        if (x < y) return -1;\n        if (x > y) return 1;\n        i++;\n        j++;\n    }\n    return 0;\n}`,
              c: `int compareVersion(const char* version1, const char* version2) {\n    int n1 = (int) strlen(version1);\n    int n2 = (int) strlen(version2);\n    int i = 0, j = 0;\n    while (i < n1 || j < n2) {\n        int x = 0, y = 0;\n        while (i < n1 && version1[i] != '.') {\n            x = x * 10 + (version1[i] - '0');\n            i++;\n        }\n        while (j < n2 && version2[j] != '.') {\n            y = y * 10 + (version2[j] - '0');\n            j++;\n        }\n        if (x < y) return -1;\n        if (x > y) return 1;\n        i++;\n        j++;\n    }\n    return 0;\n}`,
              csharp: `public static int CompareVersion(string version1, string version2)\n{\n    string[] a = version1.Split('.');\n    string[] b = version2.Split('.');\n    int n = Math.Max(a.Length, b.Length);\n    for (int i = 0; i < n; i++)\n    {\n        int x = i < a.Length ? int.Parse(a[i]) : 0;\n        int y = i < b.Length ? int.Parse(b[i]) : 0;\n        if (x < y) return -1;\n        if (x > y) return 1;\n    }\n    return 0;\n}`,
              go: `func compareVersion(version1 string, version2 string) int {\n	a := strings.Split(version1, ".")\n	b := strings.Split(version2, ".")\n	n := len(a)\n	if len(b) > n {\n		n = len(b)\n	}\n	for i := 0; i < n; i++ {\n		x, y := 0, 0\n		if i < len(a) {\n			x, _ = strconv.Atoi(a[i])\n		}\n		if i < len(b) {\n			y, _ = strconv.Atoi(b[i])\n		}\n		if x < y {\n			return -1\n		}\n		if x > y {\n			return 1\n		}\n	}\n	return 0\n}`,
              kotlin: `fun compareVersion(version1: String, version2: String): Int {\n    val a = version1.split(".")\n    val b = version2.split(".")\n    val n = maxOf(a.size, b.size)\n    for (i in 0 until n) {\n        val x = if (i < a.size) a[i].toInt() else 0\n        val y = if (i < b.size) b[i].toInt() else 0\n        if (x < y) return -1\n        if (x > y) return 1\n    }\n    return 0\n}`,
              swift: `func compareVersion(_ version1: String, _ version2: String) -> Int {\n    let a = version1.components(separatedBy: ".")\n    let b = version2.components(separatedBy: ".")\n    let n = max(a.count, b.count)\n    for i in 0..<n {\n        let x = i < a.count ? (Int(a[i]) ?? 0) : 0\n        let y = i < b.count ? (Int(b[i]) ?? 0) : 0\n        if x < y { return -1 }\n        if x > y { return 1 }\n    }\n    return 0\n}`,
              rust: `fn compareVersion(version1: String, version2: String) -> i32 {\n    let a: Vec<&str> = version1.split('.').collect();\n    let b: Vec<&str> = version2.split('.').collect();\n    let n = if a.len() > b.len() { a.len() } else { b.len() };\n    for i in 0..n {\n        let x: i64 = if i < a.len() { a[i].parse().unwrap_or(0) } else { 0 };\n        let y: i64 = if i < b.len() { b[i].parse().unwrap_or(0) } else { 0 };\n        if x < y {\n            return -1;\n        }\n        if x > y {\n            return 1;\n        }\n    }\n    0\n}`,
              php: `function compareVersion($version1, $version2) {\n    $a = explode(".", $version1);\n    $b = explode(".", $version2);\n    $n = max(count($a), count($b));\n    for ($i = 0; $i < $n; $i++) {\n        $x = $i < count($a) ? intval($a[$i]) : 0;\n        $y = $i < count($b) ? intval($b[$i]) : 0;\n        if ($x < $y) return -1;\n        if ($x > $y) return 1;\n    }\n    return 0;\n}`,
              ruby: `def compareVersion(version1, version2)\n  a = version1.split(".")\n  b = version2.split(".")\n  n = [a.length, b.length].max\n  (0...n).each do |i|\n    x = i < a.length ? a[i].to_i : 0\n    y = i < b.length ? b[i].to_i : 0\n    return -1 if x < y\n    return 1 if x > y\n  end\n  0\nend`,
      },
    };
  })(),

  // ── Find the Index of the First Occurrence (strStr) ─────────────
  (() => {
    const ref = (haystack: string, needle: string) => haystack.indexOf(needle);
    return {
      slug: "find-first-occurrence-in-string",
      title: "Find the Index of the First Occurrence in a String",
      difficulty: "EASY" as const,
      tags: ["String", "Two Pointers"],
      signature: { funcName: "strStr", params: [{ name: "haystack", type: "string" as const }, { name: "needle", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given two strings `needle` and `haystack`, return the index of the **first occurrence** of `needle` in `haystack`, or `-1` if `needle` is not part of `haystack`.",
        [
          { in: 'haystack = "sadbutsad", needle = "sad"', out: "0" },
          { in: 'haystack = "leetcode", needle = "leeto"', out: "-1" },
        ],
        ["1 <= haystack.length <= 40", "1 <= needle.length <= 10", "Lowercase English letters."]),
      hints: [
        "Try every start position and compare needle character by character.",
        "You can stop a comparison at the first mismatch.",
      ],
      examples: [
        { input: '"sadbutsad"\n"sad"', expectedOutput: "0" },
        { input: '"leetcode"\n"leeto"', expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const haystack = randLower(rng, 1, 40, "abc");
        const needle = rng() < 0.6 && haystack.length > 2
          ? haystack.slice(ri(rng, 0, haystack.length - 2)).slice(0, ri(rng, 1, 6))
          : randLower(rng, 1, 6, "abc");
        return { input: `"${haystack}"\n"${needle}"`, expectedOutput: String(ref(haystack, needle)) };
      },
      editorial: explain({
        idea: "Try every position in `haystack` where `needle` could start, and compare character by character from there — bailing out at the first mismatch. Only starts with enough room left are worth trying, which bounds the outer loop.",
        steps: [
          "Let `n` and `m` be the two lengths; if `m > n` there is no match.",
          "For each start `i` from `0` to `n - m`, compare `needle[j]` with `haystack[i + j]`.",
          "Abandon the start at the first mismatch.",
          "If all `m` characters match, return `i`.",
          "Return `-1` when no start works.",
        ],
        why: "Any occurrence begins at some index with at least `m` characters remaining, so scanning starts in increasing order and returning the first success gives the leftmost occurrence by construction. Early exit on a mismatch is what keeps the average cost near `O(n)` even though the worst case is `O(n · m)`. KMP achieves a guaranteed `O(n + m)` by precomputing how far to shift after a mismatch instead of restarting at the next index.",
        time: "O(n · m) worst case",
        space: "O(1)",
        pitfalls: [
          "Bound the outer loop at `n - m`, or the inner comparison reads past the end.",
          "Return the **start index**, not the end.",
          "Return the first match; later ones are irrelevant.",
          "Handle `m > n` before looping, since the bound would otherwise be negative.",
        ],
      }),
      solutions: {
        python: `def strStr(haystack: str, needle: str) -> int:\n    return haystack.find(needle)`,
        javascript: `var strStr = function(haystack, needle) {\n    return haystack.indexOf(needle);\n};`,
              typescript: `function strStr(haystack: string, needle: string): number {\n    const n = haystack.length;\n    const m = needle.length;\n    if (m > n) return -1;\n    for (let i = 0; i + m <= n; i++) {\n        let j = 0;\n        while (j < m && haystack.charAt(i + j) === needle.charAt(j)) j++;\n        if (j === m) return i;\n    }\n    return -1;\n}`,
              java: `public static int strStr(String haystack, String needle) {\n    int n = haystack.length(), m = needle.length();\n    if (m > n) return -1;\n    for (int i = 0; i + m <= n; i++) {\n        int j = 0;\n        while (j < m && haystack.charAt(i + j) == needle.charAt(j)) j++;\n        if (j == m) return i;\n    }\n    return -1;\n}`,
              cpp: `int strStr(string haystack, string needle) {\n    int n = (int) haystack.size(), m = (int) needle.size();\n    if (m > n) return -1;\n    for (int i = 0; i + m <= n; i++) {\n        int j = 0;\n        while (j < m && haystack[i + j] == needle[j]) j++;\n        if (j == m) return i;\n    }\n    return -1;\n}`,
              c: `int strStr(const char* haystack, const char* needle) {\n    int n = (int) strlen(haystack);\n    int m = (int) strlen(needle);\n    if (m > n) return -1;\n    for (int i = 0; i + m <= n; i++) {\n        int j = 0;\n        while (j < m && haystack[i + j] == needle[j]) j++;\n        if (j == m) return i;\n    }\n    return -1;\n}`,
              csharp: `public static int StrStr(string haystack, string needle)\n{\n    int n = haystack.Length, m = needle.Length;\n    if (m > n) return -1;\n    for (int i = 0; i + m <= n; i++)\n    {\n        int j = 0;\n        while (j < m && haystack[i + j] == needle[j]) j++;\n        if (j == m) return i;\n    }\n    return -1;\n}`,
              go: `func strStr(haystack string, needle string) int {\n	n, m := len(haystack), len(needle)\n	if m > n {\n		return -1\n	}\n	for i := 0; i+m <= n; i++ {\n		j := 0\n		for j < m && haystack[i+j] == needle[j] {\n			j++\n		}\n		if j == m {\n			return i\n		}\n	}\n	return -1\n}`,
              kotlin: `fun strStr(haystack: String, needle: String): Int {\n    val n = haystack.length\n    val m = needle.length\n    if (m > n) return -1\n    for (i in 0..(n - m)) {\n        var j = 0\n        while (j < m && haystack[i + j] == needle[j]) j++\n        if (j == m) return i\n    }\n    return -1\n}`,
              swift: `func strStr(_ haystack: String, _ needle: String) -> Int {\n    let h = Array(haystack)\n    let p = Array(needle)\n    let n = h.count\n    let m = p.count\n    if m > n { return -1 }\n    for i in 0...(n - m) {\n        var j = 0\n        while j < m && h[i + j] == p[j] { j += 1 }\n        if j == m { return i }\n    }\n    return -1\n}`,
              rust: `fn strStr(haystack: String, needle: String) -> i32 {\n    let h: Vec<u8> = haystack.bytes().collect();\n    let p: Vec<u8> = needle.bytes().collect();\n    let n = h.len();\n    let m = p.len();\n    if m > n {\n        return -1;\n    }\n    for i in 0..=(n - m) {\n        let mut j = 0;\n        while j < m && h[i + j] == p[j] {\n            j += 1;\n        }\n        if j == m {\n            return i as i32;\n        }\n    }\n    -1\n}`,
              php: `function strStr($haystack, $needle) {\n    $n = strlen($haystack);\n    $m = strlen($needle);\n    if ($m > $n) return -1;\n    for ($i = 0; $i + $m <= $n; $i++) {\n        $j = 0;\n        while ($j < $m && $haystack[$i + $j] === $needle[$j]) $j++;\n        if ($j === $m) return $i;\n    }\n    return -1;\n}`,
              ruby: `def strStr(haystack, needle)\n  n = haystack.length\n  m = needle.length\n  return -1 if m > n\n  (0..(n - m)).each do |i|\n    j = 0\n    j += 1 while j < m && haystack[i + j] == needle[j]\n    return i if j == m\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Multiply Strings ────────────────────────────────────────────
  (() => {
    const ref = (num1: string, num2: string) => (BigInt(num1) * BigInt(num2)).toString();
    return {
      slug: "multiply-strings",
      title: "Multiply Strings",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Math", "Simulation"],
      signature: { funcName: "multiply", params: [{ name: "num1", type: "string" as const }, { name: "num2", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given two non-negative integers `num1` and `num2` represented as strings, return their **product as a string**.\n\nYou must not use built-in big-integer types or convert the inputs directly to integers.",
        [
          { in: 'num1 = "2", num2 = "3"', out: '"6"' },
          { in: 'num1 = "123", num2 = "456"', out: '"56088"' },
        ],
        ["1 <= num1.length, num2.length <= 15", "Digits only, no leading zeros (except the number 0 itself)."]),
      hints: [
        "Grade-school multiplication: digit i × digit j contributes to positions i + j and i + j + 1.",
        "Work in a digit array, then trim the leading zeros.",
      ],
      examples: [
        { input: '"2"\n"3"', expectedOutput: "6" },
        { input: '"123"\n"456"', expectedOutput: "56088" },
      ],
      gen: (rng: Rng) => {
        const mk = () => {
          const len = ri(rng, 1, 15);
          if (len === 1) return String(ri(rng, 0, 9));
          return String(ri(rng, 1, 9)) + Array.from({ length: len - 1 }, () => ri(rng, 0, 9)).join("");
        };
        const a = mk(), b = mk();
        return { input: `"${a}"\n"${b}"`, expectedOutput: ref(a, b) };
      },
      editorial: explain({
        idea: "Do long multiplication the way it is taught by hand, but into a **digit array** rather than a number. The key observation is positional: the product of `num1[i]` and `num2[j]` always lands in positions `i + j` and `i + j + 1` of the result, counting from the left of an array of length `n1 + n2`.",
        steps: [
          "Return `\"0\"` immediately if either input is `\"0\"`.",
          "Allocate a digit array of length `n1 + n2`, all zeros.",
          "For each pair of digits, multiply them and add the product into position `i + j + 1`, carrying the overflow into position `i + j`.",
          "Work from the least significant digits so carries propagate correctly.",
          "Skip leading zeros and turn the remaining digits into a string.",
        ],
        why: "The positional rule follows from place value: digit `i` of a length-`n1` number has weight `10^(n1-1-i)`, so multiplying two digits gives weight `10^(n1+n2-2-i-j)` — which is exactly the slot `i + j + 1` in a left-aligned array of length `n1 + n2`. Since each partial product is at most 81, adding it to an existing digit can carry at most one place, which is why two positions per pair suffice and no wide arithmetic is ever needed.",
        time: "O(n1 · n2)",
        space: "O(n1 + n2)",
        pitfalls: [
          "The zero case must be handled up front, or the result comes out as a string of zeros.",
          "The array needs `n1 + n2` slots — the product can be that long.",
          "Add into the existing digit before splitting the carry, or accumulated carries are lost.",
          "Trim leading zeros at the end, but never trim the result down to an empty string.",
        ],
      }),
      solutions: {
        python: `def multiply(num1: str, num2: str) -> str:\n    if num1 == "0" or num2 == "0":\n        return "0"\n    n1, n2 = len(num1), len(num2)\n    digits = [0] * (n1 + n2)\n    for i in range(n1 - 1, -1, -1):\n        for j in range(n2 - 1, -1, -1):\n            total = int(num1[i]) * int(num2[j]) + digits[i + j + 1]\n            digits[i + j + 1] = total % 10\n            digits[i + j] += total // 10\n    out = "".join(map(str, digits)).lstrip("0")\n    return out or "0"`,
        javascript: `var multiply = function(num1, num2) {\n    if (num1 === "0" || num2 === "0") return "0";\n    const n1 = num1.length, n2 = num2.length;\n    const digits = new Array(n1 + n2).fill(0);\n    for (let i = n1 - 1; i >= 0; i--) {\n        for (let j = n2 - 1; j >= 0; j--) {\n            const total = (num1.charCodeAt(i) - 48) * (num2.charCodeAt(j) - 48) + digits[i + j + 1];\n            digits[i + j + 1] = total % 10;\n            digits[i + j] += Math.floor(total / 10);\n        }\n    }\n    let out = digits.join("").replace(/^0+/, "");\n    return out === "" ? "0" : out;\n};`,
              typescript: `function multiply(num1: string, num2: string): string {\n    if (num1 === "0" || num2 === "0") return "0";\n    const n1 = num1.length;\n    const n2 = num2.length;\n    const digits: number[] = [];\n    for (let i = 0; i < n1 + n2; i++) digits.push(0);\n    for (let i = n1 - 1; i >= 0; i--) {\n        for (let j = n2 - 1; j >= 0; j--) {\n            const mul = (num1.charCodeAt(i) - 48) * (num2.charCodeAt(j) - 48);\n            const total = mul + digits[i + j + 1];\n            digits[i + j + 1] = total % 10;\n            digits[i + j] += Math.floor(total / 10);\n        }\n    }\n    let start = 0;\n    while (start < digits.length - 1 && digits[start] === 0) start++;\n    let out = "";\n    for (let i = start; i < digits.length; i++) out += String(digits[i]);\n    return out;\n}`,
              java: `public static String multiply(String num1, String num2) {\n    if (num1.equals("0") || num2.equals("0")) return "0";\n    int n1 = num1.length(), n2 = num2.length();\n    int[] digits = new int[n1 + n2];\n    for (int i = n1 - 1; i >= 0; i--) {\n        for (int j = n2 - 1; j >= 0; j--) {\n            int mul = (num1.charAt(i) - '0') * (num2.charAt(j) - '0');\n            int total = mul + digits[i + j + 1];\n            digits[i + j + 1] = total % 10;\n            digits[i + j] += total / 10;\n        }\n    }\n    int start = 0;\n    while (start < digits.length - 1 && digits[start] == 0) start++;\n    StringBuilder out = new StringBuilder();\n    for (int i = start; i < digits.length; i++) out.append((char) ('0' + digits[i]));\n    return out.toString();\n}`,
              cpp: `string multiply(string num1, string num2) {\n    if (num1 == "0" || num2 == "0") return "0";\n    int n1 = (int) num1.size(), n2 = (int) num2.size();\n    vector<int> digits(n1 + n2, 0);\n    for (int i = n1 - 1; i >= 0; i--) {\n        for (int j = n2 - 1; j >= 0; j--) {\n            int mul = (num1[i] - '0') * (num2[j] - '0');\n            int total = mul + digits[i + j + 1];\n            digits[i + j + 1] = total % 10;\n            digits[i + j] += total / 10;\n        }\n    }\n    int start = 0;\n    while (start < (int) digits.size() - 1 && digits[start] == 0) start++;\n    string out;\n    for (int i = start; i < (int) digits.size(); i++) out += (char) ('0' + digits[i]);\n    return out;\n}`,
              c: `char* multiply(const char* num1, const char* num2) {\n    int n1 = (int) strlen(num1);\n    int n2 = (int) strlen(num2);\n    if (strcmp(num1, "0") == 0 || strcmp(num2, "0") == 0) {\n        char* zero = (char*) malloc(2);\n        zero[0] = '0';\n        zero[1] = '\\0';\n        return zero;\n    }\n    int total = n1 + n2;\n    int* digits = (int*) calloc(total, sizeof(int));\n    for (int i = n1 - 1; i >= 0; i--) {\n        for (int j = n2 - 1; j >= 0; j--) {\n            int mul = (num1[i] - '0') * (num2[j] - '0');\n            int sum = mul + digits[i + j + 1];\n            digits[i + j + 1] = sum % 10;\n            digits[i + j] += sum / 10;\n        }\n    }\n    int start = 0;\n    while (start < total - 1 && digits[start] == 0) start++;\n    char* out = (char*) malloc(total - start + 1);\n    int pos = 0;\n    for (int i = start; i < total; i++) out[pos++] = (char) ('0' + digits[i]);\n    out[pos] = '\\0';\n    free(digits);\n    return out;\n}`,
              csharp: `public static string Multiply(string num1, string num2)\n{\n    if (num1 == "0" || num2 == "0") return "0";\n    int n1 = num1.Length, n2 = num2.Length;\n    int[] digits = new int[n1 + n2];\n    for (int i = n1 - 1; i >= 0; i--)\n    {\n        for (int j = n2 - 1; j >= 0; j--)\n        {\n            int mul = (num1[i] - '0') * (num2[j] - '0');\n            int total = mul + digits[i + j + 1];\n            digits[i + j + 1] = total % 10;\n            digits[i + j] += total / 10;\n        }\n    }\n    int start = 0;\n    while (start < digits.Length - 1 && digits[start] == 0) start++;\n    var sb = new List<char>();\n    for (int i = start; i < digits.Length; i++) sb.Add((char)('0' + digits[i]));\n    return new string(sb.ToArray());\n}`,
              go: `func multiply(num1 string, num2 string) string {\n	if num1 == "0" || num2 == "0" {\n		return "0"\n	}\n	n1, n2 := len(num1), len(num2)\n	digits := make([]int, n1+n2)\n	for i := n1 - 1; i >= 0; i-- {\n		for j := n2 - 1; j >= 0; j-- {\n			mul := int(num1[i]-'0') * int(num2[j]-'0')\n			total := mul + digits[i+j+1]\n			digits[i+j+1] = total % 10\n			digits[i+j] += total / 10\n		}\n	}\n	start := 0\n	for start < len(digits)-1 && digits[start] == 0 {\n		start++\n	}\n	out := []byte{}\n	for i := start; i < len(digits); i++ {\n		out = append(out, byte('0'+digits[i]))\n	}\n	return string(out)\n}`,
              kotlin: `fun multiply(num1: String, num2: String): String {\n    if (num1 == "0" || num2 == "0") return "0"\n    val n1 = num1.length\n    val n2 = num2.length\n    val digits = IntArray(n1 + n2)\n    for (i in n1 - 1 downTo 0) {\n        for (j in n2 - 1 downTo 0) {\n            val mul = (num1[i] - '0') * (num2[j] - '0')\n            val total = mul + digits[i + j + 1]\n            digits[i + j + 1] = total % 10\n            digits[i + j] += total / 10\n        }\n    }\n    var start = 0\n    while (start < digits.size - 1 && digits[start] == 0) start++\n    val out = StringBuilder()\n    for (i in start until digits.size) out.append(('0' + digits[i]))\n    return out.toString()\n}`,
              swift: `func multiply(_ num1: String, _ num2: String) -> String {\n    if num1 == "0" || num2 == "0" { return "0" }\n    let a = Array(num1.unicodeScalars).map { Int($0.value) - 48 }\n    let b = Array(num2.unicodeScalars).map { Int($0.value) - 48 }\n    let n1 = a.count\n    let n2 = b.count\n    var digits = [Int](repeating: 0, count: n1 + n2)\n    var i = n1 - 1\n    while i >= 0 {\n        var j = n2 - 1\n        while j >= 0 {\n            let mul = a[i] * b[j]\n            let total = mul + digits[i + j + 1]\n            digits[i + j + 1] = total % 10\n            digits[i + j] += total / 10\n            j -= 1\n        }\n        i -= 1\n    }\n    var start = 0\n    while start < digits.count - 1 && digits[start] == 0 { start += 1 }\n    var out = ""\n    for k in start..<digits.count { out += String(digits[k]) }\n    return out\n}`,
              rust: `fn multiply(num1: String, num2: String) -> String {\n    if num1 == "0" || num2 == "0" {\n        return String::from("0");\n    }\n    let a: Vec<i32> = num1.bytes().map(|c| (c - b'0') as i32).collect();\n    let b: Vec<i32> = num2.bytes().map(|c| (c - b'0') as i32).collect();\n    let n1 = a.len();\n    let n2 = b.len();\n    let mut digits = vec![0i32; n1 + n2];\n    let mut i = n1;\n    while i > 0 {\n        i -= 1;\n        let mut j = n2;\n        while j > 0 {\n            j -= 1;\n            let mul = a[i] * b[j];\n            let total = mul + digits[i + j + 1];\n            digits[i + j + 1] = total % 10;\n            digits[i + j] += total / 10;\n        }\n    }\n    let mut start = 0;\n    while start < digits.len() - 1 && digits[start] == 0 {\n        start += 1;\n    }\n    let mut out = String::new();\n    for k in start..digits.len() {\n        out.push((b'0' + digits[k] as u8) as char);\n    }\n    out\n}`,
              php: `function multiply($num1, $num2) {\n    if ($num1 === "0" || $num2 === "0") return "0";\n    $n1 = strlen($num1);\n    $n2 = strlen($num2);\n    $digits = array_fill(0, $n1 + $n2, 0);\n    for ($i = $n1 - 1; $i >= 0; $i--) {\n        for ($j = $n2 - 1; $j >= 0; $j--) {\n            $mul = (ord($num1[$i]) - 48) * (ord($num2[$j]) - 48);\n            $total = $mul + $digits[$i + $j + 1];\n            $digits[$i + $j + 1] = $total % 10;\n            $digits[$i + $j] += intdiv($total, 10);\n        }\n    }\n    $start = 0;\n    while ($start < count($digits) - 1 && $digits[$start] === 0) $start++;\n    $out = "";\n    for ($i = $start; $i < count($digits); $i++) $out .= strval($digits[$i]);\n    return $out;\n}`,
              ruby: `def multiply(num1, num2)\n  return "0" if num1 == "0" || num2 == "0"\n  n1 = num1.length\n  n2 = num2.length\n  digits = Array.new(n1 + n2, 0)\n  (n1 - 1).downto(0) do |i|\n    (n2 - 1).downto(0) do |j|\n      mul = (num1[i].ord - 48) * (num2[j].ord - 48)\n      total = mul + digits[i + j + 1]\n      digits[i + j + 1] = total % 10\n      digits[i + j] += total / 10\n    end\n  end\n  start = 0\n  start += 1 while start < digits.length - 1 && digits[start] == 0\n  digits[start..-1].join\nend`,
      },
    };
  })(),

  // ── Minimum Window Substring (leftmost minimal) ─────────────────
  (() => {
    const ref = (s: string, t: string) => {
      const need = new Map<string, number>();
      for (const ch of t) need.set(ch, (need.get(ch) || 0) + 1);
      let required = need.size;
      let formed = 0;
      const have = new Map<string, number>();
      let l = 0, bestLen = Infinity, bestL = 0;
      for (let r = 0; r < s.length; r++) {
        const ch = s[r];
        have.set(ch, (have.get(ch) || 0) + 1);
        if (need.has(ch) && have.get(ch) === need.get(ch)) formed++;
        while (formed === required) {
          if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }
          const lc = s[l];
          have.set(lc, have.get(lc)! - 1);
          if (need.has(lc) && have.get(lc)! < need.get(lc)!) formed--;
          l++;
        }
      }
      return bestLen === Infinity ? "" : s.slice(bestL, bestL + bestLen);
    };
    return {
      slug: "minimum-window-substring",
      title: "Minimum Window Substring",
      difficulty: "HARD" as const,
      tags: ["String", "Sliding Window", "Hash Table"],
      signature: { funcName: "minWindow", params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }], returns: "string" as const },
      description: describe(
        'Given strings `s` and `t`, return the **minimum-length window substring** of `s` that contains every character of `t` (including duplicates). If no such substring exists, return `""`. If several minimal windows exist, return the **leftmost** one.',
        [
          { in: 's = "ADOBECODEBANC", t = "ABC"', out: '"BANC"' },
          { in: 's = "a", t = "aa"', out: '""', note: "Both a's of t must be in the window." },
        ],
        ["1 <= s.length <= 40", "1 <= t.length <= 5", "Lowercase English letters."]),
      hints: [
        "Expand the right edge until the window covers t, then shrink from the left while it still covers.",
        "Track how many distinct required characters are currently satisfied.",
      ],
      examples: [
        { input: '"adobecodebanc"\n"abc"', expectedOutput: "banc" },
        { input: '"a"\n"aa"', expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 40, "abcd");
        const t = randLower(rng, 1, 5, "abcd");
        return { input: `"${s}"\n"${t}"`, expectedOutput: ref(s, t) };
      },
      editorial: explain({
        idea: "Grow the window rightwards until it covers every character of `t` (counting duplicates), then shrink it from the left for as long as it still covers. Every time the window is valid, it is the shortest one ending at that right edge — so recording it at each such moment finds the global minimum.",
        steps: [
          "Count the characters `t` requires, and note how many **distinct** characters must be satisfied.",
          "Extend the right edge, incrementing the window's count for the incoming character; when a character's count reaches its requirement, one more distinct requirement is satisfied.",
          "While all requirements are satisfied, record the window if it beats the best, then shrink from the left.",
          "Shrinking un-satisfies a requirement only when a count drops **below** what is needed.",
          "Return the best window, or the empty string if none was ever valid.",
        ],
        why: "Tracking a count of satisfied distinct characters turns the validity test into a single comparison, instead of scanning the whole frequency table at every step — that is what keeps the sweep linear. The shrink loop is what makes each recorded window minimal for its right edge: it stops exactly when removing one more character would break coverage. Recording only on a strictly smaller length keeps the leftmost among equally short windows.",
        time: "O(|s| + |t|)",
        space: "O(1) over a fixed alphabet",
        pitfalls: [
          "Duplicates in `t` matter: `\"aa\"` needs two `a`s, so counts must be compared, not mere presence.",
          "Decrement the satisfied counter only when a count falls **below** the requirement — going from 3 to 2 when 2 are needed changes nothing.",
          "Record the window before shrinking past validity, not after.",
          "No valid window means the empty string, not a sentinel.",
        ],
      }),
      solutions: {
        python: `def minWindow(s: str, t: str) -> str:\n    from collections import Counter\n    need = Counter(t)\n    required = len(need)\n    have = {}\n    formed = 0\n    l = 0\n    best_len = float("inf")\n    best_l = 0\n    for r, ch in enumerate(s):\n        have[ch] = have.get(ch, 0) + 1\n        if ch in need and have[ch] == need[ch]:\n            formed += 1\n        while formed == required:\n            if r - l + 1 < best_len:\n                best_len = r - l + 1\n                best_l = l\n            lc = s[l]\n            have[lc] -= 1\n            if lc in need and have[lc] < need[lc]:\n                formed -= 1\n            l += 1\n    return "" if best_len == float("inf") else s[best_l:best_l + best_len]`,
        javascript: `var minWindow = function(s, t) {\n    const need = new Map();\n    for (const ch of t) need.set(ch, (need.get(ch) || 0) + 1);\n    const required = need.size;\n    const have = new Map();\n    let formed = 0, l = 0, bestLen = Infinity, bestL = 0;\n    for (let r = 0; r < s.length; r++) {\n        const ch = s[r];\n        have.set(ch, (have.get(ch) || 0) + 1);\n        if (need.has(ch) && have.get(ch) === need.get(ch)) formed++;\n        while (formed === required) {\n            if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }\n            const lc = s[l];\n            have.set(lc, have.get(lc) - 1);\n            if (need.has(lc) && have.get(lc) < need.get(lc)) formed--;\n            l++;\n        }\n    }\n    return bestLen === Infinity ? "" : s.slice(bestL, bestL + bestLen);\n};`,
              typescript: `function minWindow(s: string, t: string): string {\n    const need: number[] = [];\n    const win: number[] = [];\n    for (let i = 0; i < 128; i++) {\n        need.push(0);\n        win.push(0);\n    }\n    let required = 0;\n    for (let i = 0; i < t.length; i++) {\n        const c = t.charCodeAt(i);\n        if (need[c] === 0) required++;\n        need[c]++;\n    }\n    let have = 0;\n    let l = 0;\n    let bestLen = -1;\n    let bestStart = 0;\n    for (let r = 0; r < s.length; r++) {\n        const c = s.charCodeAt(r);\n        win[c]++;\n        if (need[c] > 0 && win[c] === need[c]) have++;\n        while (have === required) {\n            if (bestLen === -1 || r - l + 1 < bestLen) {\n                bestLen = r - l + 1;\n                bestStart = l;\n            }\n            const d = s.charCodeAt(l);\n            win[d]--;\n            if (need[d] > 0 && win[d] < need[d]) have--;\n            l++;\n        }\n    }\n    return bestLen === -1 ? "" : s.substring(bestStart, bestStart + bestLen);\n}`,
              java: `public static String minWindow(String s, String t) {\n    int[] need = new int[128];\n    int[] win = new int[128];\n    int required = 0;\n    for (int i = 0; i < t.length(); i++) {\n        char c = t.charAt(i);\n        if (need[c] == 0) required++;\n        need[c]++;\n    }\n    int have = 0, l = 0, bestLen = -1, bestStart = 0;\n    for (int r = 0; r < s.length(); r++) {\n        char c = s.charAt(r);\n        win[c]++;\n        if (need[c] > 0 && win[c] == need[c]) have++;\n        while (have == required) {\n            if (bestLen == -1 || r - l + 1 < bestLen) {\n                bestLen = r - l + 1;\n                bestStart = l;\n            }\n            char d = s.charAt(l);\n            win[d]--;\n            if (need[d] > 0 && win[d] < need[d]) have--;\n            l++;\n        }\n    }\n    return bestLen == -1 ? "" : s.substring(bestStart, bestStart + bestLen);\n}`,
              cpp: `string minWindow(string s, string t) {\n    vector<int> need(128, 0), win(128, 0);\n    int required = 0;\n    for (char c : t) {\n        if (need[(unsigned char) c] == 0) required++;\n        need[(unsigned char) c]++;\n    }\n    int have = 0, l = 0, bestLen = -1, bestStart = 0;\n    for (int r = 0; r < (int) s.size(); r++) {\n        int c = (unsigned char) s[r];\n        win[c]++;\n        if (need[c] > 0 && win[c] == need[c]) have++;\n        while (have == required) {\n            if (bestLen == -1 || r - l + 1 < bestLen) {\n                bestLen = r - l + 1;\n                bestStart = l;\n            }\n            int d = (unsigned char) s[l];\n            win[d]--;\n            if (need[d] > 0 && win[d] < need[d]) have--;\n            l++;\n        }\n    }\n    return bestLen == -1 ? "" : s.substr(bestStart, bestLen);\n}`,
              c: `char* minWindow(const char* s, const char* t) {\n    int need[128], win[128];\n    for (int i = 0; i < 128; i++) {\n        need[i] = 0;\n        win[i] = 0;\n    }\n    int tn = (int) strlen(t);\n    int required = 0;\n    for (int i = 0; i < tn; i++) {\n        int c = (unsigned char) t[i];\n        if (need[c] == 0) required++;\n        need[c]++;\n    }\n    int n = (int) strlen(s);\n    int have = 0, l = 0, bestLen = -1, bestStart = 0;\n    for (int r = 0; r < n; r++) {\n        int c = (unsigned char) s[r];\n        win[c]++;\n        if (need[c] > 0 && win[c] == need[c]) have++;\n        while (have == required) {\n            if (bestLen == -1 || r - l + 1 < bestLen) {\n                bestLen = r - l + 1;\n                bestStart = l;\n            }\n            int d = (unsigned char) s[l];\n            win[d]--;\n            if (need[d] > 0 && win[d] < need[d]) have--;\n            l++;\n        }\n    }\n    if (bestLen == -1) {\n        char* empty = (char*) malloc(1);\n        empty[0] = '\\0';\n        return empty;\n    }\n    char* out = (char*) malloc(bestLen + 1);\n    for (int i = 0; i < bestLen; i++) out[i] = s[bestStart + i];\n    out[bestLen] = '\\0';\n    return out;\n}`,
              csharp: `public static string MinWindow(string s, string t)\n{\n    int[] need = new int[128];\n    int[] win = new int[128];\n    int required = 0;\n    foreach (char c in t)\n    {\n        if (need[c] == 0) required++;\n        need[c]++;\n    }\n    int have = 0, l = 0, bestLen = -1, bestStart = 0;\n    for (int r = 0; r < s.Length; r++)\n    {\n        char c = s[r];\n        win[c]++;\n        if (need[c] > 0 && win[c] == need[c]) have++;\n        while (have == required)\n        {\n            if (bestLen == -1 || r - l + 1 < bestLen)\n            {\n                bestLen = r - l + 1;\n                bestStart = l;\n            }\n            char d = s[l];\n            win[d]--;\n            if (need[d] > 0 && win[d] < need[d]) have--;\n            l++;\n        }\n    }\n    return bestLen == -1 ? "" : s.Substring(bestStart, bestLen);\n}`,
              go: `func minWindow(s string, t string) string {\n	need := make([]int, 128)\n	win := make([]int, 128)\n	required := 0\n	for i := 0; i < len(t); i++ {\n		c := int(t[i])\n		if need[c] == 0 {\n			required++\n		}\n		need[c]++\n	}\n	have, l, bestLen, bestStart := 0, 0, -1, 0\n	for r := 0; r < len(s); r++ {\n		c := int(s[r])\n		win[c]++\n		if need[c] > 0 && win[c] == need[c] {\n			have++\n		}\n		for have == required {\n			if bestLen == -1 || r-l+1 < bestLen {\n				bestLen = r - l + 1\n				bestStart = l\n			}\n			d := int(s[l])\n			win[d]--\n			if need[d] > 0 && win[d] < need[d] {\n				have--\n			}\n			l++\n		}\n	}\n	if bestLen == -1 {\n		return ""\n	}\n	return s[bestStart : bestStart+bestLen]\n}`,
              kotlin: `fun minWindow(s: String, t: String): String {\n    val need = IntArray(128)\n    val win = IntArray(128)\n    var required = 0\n    for (c in t) {\n        if (need[c.toInt()] == 0) required++\n        need[c.toInt()]++\n    }\n    var have = 0\n    var l = 0\n    var bestLen = -1\n    var bestStart = 0\n    for (r in s.indices) {\n        val c = s[r].toInt()\n        win[c]++\n        if (need[c] > 0 && win[c] == need[c]) have++\n        while (have == required) {\n            if (bestLen == -1 || r - l + 1 < bestLen) {\n                bestLen = r - l + 1\n                bestStart = l\n            }\n            val d = s[l].toInt()\n            win[d]--\n            if (need[d] > 0 && win[d] < need[d]) have--\n            l++\n        }\n    }\n    return if (bestLen == -1) "" else s.substring(bestStart, bestStart + bestLen)\n}`,
              swift: `func minWindow(_ s: String, _ t: String) -> String {\n    let sc = Array(s)\n    let scodes = Array(s.unicodeScalars).map { Int($0.value) }\n    let tcodes = Array(t.unicodeScalars).map { Int($0.value) }\n    var need = [Int](repeating: 0, count: 128)\n    var win = [Int](repeating: 0, count: 128)\n    var required = 0\n    for c in tcodes {\n        if need[c] == 0 { required += 1 }\n        need[c] += 1\n    }\n    var have = 0\n    var l = 0\n    var bestLen = -1\n    var bestStart = 0\n    for r in 0..<scodes.count {\n        let c = scodes[r]\n        win[c] += 1\n        if need[c] > 0 && win[c] == need[c] { have += 1 }\n        while have == required {\n            if bestLen == -1 || r - l + 1 < bestLen {\n                bestLen = r - l + 1\n                bestStart = l\n            }\n            let d = scodes[l]\n            win[d] -= 1\n            if need[d] > 0 && win[d] < need[d] { have -= 1 }\n            l += 1\n        }\n    }\n    if bestLen == -1 { return "" }\n    return String(sc[bestStart..<(bestStart + bestLen)])\n}`,
              rust: `fn minWindow(s: String, t: String) -> String {\n    let sb: Vec<u8> = s.bytes().collect();\n    let tb: Vec<u8> = t.bytes().collect();\n    let mut need = [0i32; 128];\n    let mut win = [0i32; 128];\n    let mut required = 0;\n    for &c in tb.iter() {\n        if need[c as usize] == 0 {\n            required += 1;\n        }\n        need[c as usize] += 1;\n    }\n    let mut have = 0;\n    let mut l = 0usize;\n    let mut best_len: i32 = -1;\n    let mut best_start = 0usize;\n    for r in 0..sb.len() {\n        let c = sb[r] as usize;\n        win[c] += 1;\n        if need[c] > 0 && win[c] == need[c] {\n            have += 1;\n        }\n        while have == required {\n            let len = (r + 1 - l) as i32;\n            if best_len == -1 || len < best_len {\n                best_len = len;\n                best_start = l;\n            }\n            let d = sb[l] as usize;\n            win[d] -= 1;\n            if need[d] > 0 && win[d] < need[d] {\n                have -= 1;\n            }\n            l += 1;\n        }\n    }\n    if best_len == -1 {\n        return String::new();\n    }\n    String::from_utf8(sb[best_start..best_start + best_len as usize].to_vec()).unwrap()\n}`,
              php: `function minWindow($s, $t) {\n    $need = array_fill(0, 128, 0);\n    $win = array_fill(0, 128, 0);\n    $required = 0;\n    $tn = strlen($t);\n    for ($i = 0; $i < $tn; $i++) {\n        $c = ord($t[$i]);\n        if ($need[$c] === 0) $required++;\n        $need[$c]++;\n    }\n    $have = 0;\n    $l = 0;\n    $bestLen = -1;\n    $bestStart = 0;\n    $n = strlen($s);\n    for ($r = 0; $r < $n; $r++) {\n        $c = ord($s[$r]);\n        $win[$c]++;\n        if ($need[$c] > 0 && $win[$c] === $need[$c]) $have++;\n        while ($have === $required) {\n            if ($bestLen === -1 || $r - $l + 1 < $bestLen) {\n                $bestLen = $r - $l + 1;\n                $bestStart = $l;\n            }\n            $d = ord($s[$l]);\n            $win[$d]--;\n            if ($need[$d] > 0 && $win[$d] < $need[$d]) $have--;\n            $l++;\n        }\n    }\n    return $bestLen === -1 ? "" : substr($s, $bestStart, $bestLen);\n}`,
              ruby: `def minWindow(s, t)\n  need = Array.new(128, 0)\n  win = Array.new(128, 0)\n  required = 0\n  t.each_char do |ch|\n    c = ch.ord\n    required += 1 if need[c] == 0\n    need[c] += 1\n  end\n  have = 0\n  l = 0\n  best_len = -1\n  best_start = 0\n  (0...s.length).each do |r|\n    c = s[r].ord\n    win[c] += 1\n    have += 1 if need[c] > 0 && win[c] == need[c]\n    while have == required\n      if best_len == -1 || r - l + 1 < best_len\n        best_len = r - l + 1\n        best_start = l\n      end\n      d = s[l].ord\n      win[d] -= 1\n      have -= 1 if need[d] > 0 && win[d] < need[d]\n      l += 1\n    end\n  end\n  best_len == -1 ? "" : s[best_start, best_len]\nend`,
      },
    };
  })(),

  // ── String Matching: All Occurrences (Rabin–Karp) ───────────────
  (() => {
    const ref = (text: string, pattern: string) => {
      const out: number[] = [];
      for (let i = 0; i + pattern.length <= text.length; i++) {
        if (text.slice(i, i + pattern.length) === pattern) out.push(i);
      }
      return out;
    };
    return {
      slug: "string-matching-all-occurrences",
      title: "String Matching: All Occurrences",
      difficulty: "HARD" as const,
      tags: ["String", "Rolling Hash", "String Matching"],
      signature: { funcName: "findOccurrences", params: [{ name: "text", type: "string" as const }, { name: "pattern", type: "string" as const }], returns: "int[]" as const },
      description: describe(
        "Given `text` and a non-empty `pattern`, return **all start indices** where `pattern` occurs in `text` (overlaps count), in increasing order.\n\nAim for average `O(n + m)` time — the Rabin–Karp rolling hash achieves it.",
        [
          { in: 'text = "abababa", pattern = "aba"', out: "[0,2,4]", note: "Occurrences may overlap." },
          { in: 'text = "aaaa", pattern = "b"', out: "[]" },
        ],
        ["1 <= text.length <= 40", "1 <= pattern.length <= 8", "Lowercase English letters."]),
      hints: [
        "A rolling hash lets you update the window hash in O(1) as it slides.",
        "On hash match, verify characters to rule out collisions.",
      ],
      examples: [
        { input: '"abababa"\n"aba"', expectedOutput: "[0,2,4]" },
        { input: '"aaaa"\n"b"', expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const text = randLower(rng, 1, 40, "ab");
        const pattern = randLower(rng, 1, 8, "ab");
        return { input: `"${text}"\n"${pattern}"`, expectedOutput: fmtIntArr(ref(text, pattern)) };
      },
      editorial: explain({
        idea: "Report **every** start where the pattern matches, including overlapping ones — so after a hit you continue from the very next index rather than skipping past the match. The reference below compares directly at each start, bailing at the first mismatch; Rabin–Karp reaches average linear time by comparing a rolling hash first and only verifying characters when the hashes agree.",
        steps: [
          "Let `n` and `m` be the two lengths; if `m > n` there are no occurrences.",
          "For each start `i` from `0` to `n - m`, compare the pattern against `text` from `i`.",
          "Record `i` on a full match.",
          "Continue from `i + 1` regardless — overlaps count.",
          "Return the collected indices, already in increasing order.",
        ],
        why: "Advancing by one after a hit is what makes overlapping occurrences appear: in `\"aaaa\"` with pattern `\"aa\"`, jumping past a match would report only indices 0 and 2 and miss index 1. Scanning starts left to right gives the increasing order for free. The rolling hash speeds the *filtering* step — updating the window's hash in constant time as it slides — but the verification on a hash match is still needed, because distinct strings can share a hash.",
        time: "O(n · m) worst case, O(n + m) average with a rolling hash",
        space: "O(1) beyond the output",
        pitfalls: [
          "Overlaps count, so never skip ahead by the pattern length after a match.",
          "Bound the outer loop at `n - m` so the comparison stays in range.",
          "No occurrences means an empty list, not `[-1]`.",
          "With Rabin–Karp, always verify on a hash match — skipping that step makes the answer wrong on a collision.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef findOccurrences(text: str, pattern: str) -> List[int]:\n    n, m = len(text), len(pattern)\n    if m > n:\n        return []\n    BASE = 131\n    MOD = 1000000007\n    target = 0\n    cur = 0\n    power = 1\n    for i in range(m):\n        target = (target * BASE + ord(pattern[i])) % MOD\n        cur = (cur * BASE + ord(text[i])) % MOD\n        if i > 0:\n            power = (power * BASE) % MOD\n    out = []\n    for i in range(n - m + 1):\n        if cur == target and text[i:i + m] == pattern:\n            out.append(i)\n        if i + m < n:\n            cur = ((cur - ord(text[i]) * power) * BASE + ord(text[i + m])) % MOD\n            cur %= MOD\n    return out`,
        javascript: `var findOccurrences = function(text, pattern) {\n    const n = text.length, m = pattern.length;\n    const out = [];\n    if (m > n) return out;\n    for (let i = 0; i + m <= n; i++) {\n        let ok = true;\n        for (let j = 0; j < m; j++) {\n            if (text[i + j] !== pattern[j]) { ok = false; break; }\n        }\n        if (ok) out.push(i);\n    }\n    return out;\n};`,
              typescript: `function findOccurrences(text: string, pattern: string): number[] {\n    const out: number[] = [];\n    const n = text.length;\n    const m = pattern.length;\n    if (m > n) return out;\n    for (let i = 0; i + m <= n; i++) {\n        let j = 0;\n        while (j < m && text.charAt(i + j) === pattern.charAt(j)) j++;\n        if (j === m) out.push(i);\n    }\n    return out;\n}`,
              java: `public static int[] findOccurrences(String text, String pattern) {\n    List<Integer> out = new ArrayList<>();\n    int n = text.length(), m = pattern.length();\n    for (int i = 0; i + m <= n; i++) {\n        int j = 0;\n        while (j < m && text.charAt(i + j) == pattern.charAt(j)) j++;\n        if (j == m) out.add(i);\n    }\n    int[] res = new int[out.size()];\n    for (int i = 0; i < out.size(); i++) res[i] = out.get(i);\n    return res;\n}`,
              cpp: `vector<int> findOccurrences(string text, string pattern) {\n    vector<int> out;\n    int n = (int) text.size(), m = (int) pattern.size();\n    for (int i = 0; i + m <= n; i++) {\n        int j = 0;\n        while (j < m && text[i + j] == pattern[j]) j++;\n        if (j == m) out.push_back(i);\n    }\n    return out;\n}`,
              c: `int* findOccurrences(const char* text, const char* pattern, int* returnSize) {\n    int n = (int) strlen(text);\n    int m = (int) strlen(pattern);\n    int* out = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int count = 0;\n    for (int i = 0; i + m <= n; i++) {\n        int j = 0;\n        while (j < m && text[i + j] == pattern[j]) j++;\n        if (j == m) out[count++] = i;\n    }\n    *returnSize = count;\n    return out;\n}`,
              csharp: `public static int[] FindOccurrences(string text, string pattern)\n{\n    var res = new List<int>();\n    int n = text.Length, m = pattern.Length;\n    for (int i = 0; i + m <= n; i++)\n    {\n        int j = 0;\n        while (j < m && text[i + j] == pattern[j]) j++;\n        if (j == m) res.Add(i);\n    }\n    return res.ToArray();\n}`,
              go: `func findOccurrences(text string, pattern string) []int {\n	out := []int{}\n	n, m := len(text), len(pattern)\n	for i := 0; i+m <= n; i++ {\n		j := 0\n		for j < m && text[i+j] == pattern[j] {\n			j++\n		}\n		if j == m {\n			out = append(out, i)\n		}\n	}\n	return out\n}`,
              kotlin: `fun findOccurrences(text: String, pattern: String): IntArray {\n    val out = mutableListOf<Int>()\n    val n = text.length\n    val m = pattern.length\n    var i = 0\n    while (i + m <= n) {\n        var j = 0\n        while (j < m && text[i + j] == pattern[j]) j++\n        if (j == m) out.add(i)\n        i++\n    }\n    return out.toIntArray()\n}`,
              swift: `func findOccurrences(_ text: String, _ pattern: String) -> [Int] {\n    let t = Array(text)\n    let p = Array(pattern)\n    var out: [Int] = []\n    let n = t.count\n    let m = p.count\n    if m > n { return out }\n    for i in 0...(n - m) {\n        var j = 0\n        while j < m && t[i + j] == p[j] { j += 1 }\n        if j == m { out.append(i) }\n    }\n    return out\n}`,
              rust: `fn findOccurrences(text: String, pattern: String) -> Vec<i32> {\n    let t: Vec<u8> = text.bytes().collect();\n    let p: Vec<u8> = pattern.bytes().collect();\n    let mut out: Vec<i32> = Vec::new();\n    let n = t.len();\n    let m = p.len();\n    if m > n {\n        return out;\n    }\n    for i in 0..=(n - m) {\n        let mut j = 0;\n        while j < m && t[i + j] == p[j] {\n            j += 1;\n        }\n        if j == m {\n            out.push(i as i32);\n        }\n    }\n    out\n}`,
              php: `function findOccurrences($text, $pattern) {\n    $out = array();\n    $n = strlen($text);\n    $m = strlen($pattern);\n    for ($i = 0; $i + $m <= $n; $i++) {\n        $j = 0;\n        while ($j < $m && $text[$i + $j] === $pattern[$j]) $j++;\n        if ($j === $m) $out[] = $i;\n    }\n    return $out;\n}`,
              ruby: `def findOccurrences(text, pattern)\n  out = []\n  n = text.length\n  m = pattern.length\n  return out if m > n\n  (0..(n - m)).each do |i|\n    j = 0\n    j += 1 while j < m && text[i + j] == pattern[j]\n    out.push(i) if j == m\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Regular Expression Matching ─────────────────────────────────
  (() => {
    const ref = (s: string, p: string) => {
      const n = s.length, m = p.length;
      const dp: boolean[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(false));
      dp[0][0] = true;
      for (let j = 1; j <= m; j++) {
        if (p[j - 1] === "*") dp[0][j] = dp[0][j - 2];
      }
      for (let i = 1; i <= n; i++) {
        for (let j = 1; j <= m; j++) {
          if (p[j - 1] === "*") {
            dp[i][j] = dp[i][j - 2] || ((p[j - 2] === "." || p[j - 2] === s[i - 1]) && dp[i - 1][j]);
          } else {
            dp[i][j] = (p[j - 1] === "." || p[j - 1] === s[i - 1]) && dp[i - 1][j - 1];
          }
        }
      }
      return dp[n][m];
    };
    const genPattern = (rng: Rng) => {
      let p = "";
      const units = ri(rng, 1, 6);
      for (let i = 0; i < units; i++) {
        const ch = rng() < 0.25 ? "." : "abc"[ri(rng, 0, 2)];
        p += ch + (rng() < 0.35 ? "*" : "");
      }
      return p;
    };
    return {
      slug: "regular-expression-matching",
      title: "Regular Expression Matching",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Recursion"],
      signature: { funcName: "isMatch", params: [{ name: "s", type: "string" as const }, { name: "p", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Implement regular-expression matching over the **entire** input string with support for:\n\n- `.` — matches any single character\n- `*` — matches zero or more of the **preceding** element\n\nGiven `s` and pattern `p`, return `true` when `p` matches all of `s`.",
        [
          { in: 's = "aa", p = "a"', out: "false" },
          { in: 's = "aa", p = "a*"', out: "true" },
          { in: 's = "ab", p = ".*"', out: "true", note: '".*" means zero or more of any character.' },
        ],
        ["0 <= s.length <= 12", "1 <= p.length <= 12", "s has lowercase letters; p has lowercase letters, '.' and '*'.", "'*' is always preceded by a valid element."]),
      hints: [
        "dp[i][j]: does p[0..j) match s[0..i)?",
        "For 'x*': either use it zero times (dp[i][j-2]) or consume one matching char (dp[i-1][j]).",
      ],
      examples: [
        { input: '"aa"\n"a"', expectedOutput: "false" },
        { input: '"aa"\n"a*"', expectedOutput: "true" },
        { input: '"ab"\n".*"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 0, 12, "abc");
        const p = genPattern(rng);
        return { input: `"${s}"\n"${p}"`, expectedOutput: bool(ref(s, p)) };
      },
      editorial: explain({
        idea: "Let `dp[i][j]` mean \"the first `j` characters of the pattern match the first `i` characters of the string\". Ordinary characters and `.` advance both by one. A `*` is the interesting case: it governs the element **before** it, and can be used zero times (skip both the element and the star) or one more time (consume one string character and keep the star available).",
        steps: [
          "`dp[0][0] = true` — an empty pattern matches an empty string.",
          "Seed the first row: a pattern can match the empty string only through `x*` groups, so `dp[0][j] = dp[0][j-2]` when `p[j-1]` is `*`.",
          "For a normal character or `.`, `dp[i][j] = dp[i-1][j-1]` provided the characters match.",
          "For `*`, start with `dp[i][j] = dp[i][j-2]` (zero occurrences).",
          "If the starred element also matches `s[i-1]`, additionally allow `dp[i-1][j]` — consuming one character and keeping the star.",
        ],
        why: "Splitting on how the pattern's last element is used covers every possibility exactly once: a plain element must consume exactly one character, and a starred element consumes zero or extends a match that already used it. The `dp[i-1][j]` term is the crucial one — keeping `j` fixed is what lets a single `*` absorb arbitrarily many characters without enumerating how many. The empty-string row must be seeded separately because `x*` can vanish, and nothing else can.",
        time: "O(|s| · |p|)",
        space: "O(|s| · |p|)",
        pitfalls: [
          "A `*` binds to the element **before** it, so skipping the group means stepping back **two** pattern positions, not one.",
          "The first row needs its own pass; without it, patterns like `\"a*b*\"` fail to match the empty string.",
          "When extending a star, keep `j` unchanged and decrease `i` — swapping those is the classic error.",
          "`.` matches any single character, including in the starred-element comparison, so `\".*\"` matches everything.",
        ],
      }),
      solutions: {
        python: `def isMatch(s: str, p: str) -> bool:\n    n, m = len(s), len(p)\n    dp = [[False] * (m + 1) for _ in range(n + 1)]\n    dp[0][0] = True\n    for j in range(1, m + 1):\n        if p[j - 1] == "*":\n            dp[0][j] = dp[0][j - 2]\n    for i in range(1, n + 1):\n        for j in range(1, m + 1):\n            if p[j - 1] == "*":\n                dp[i][j] = dp[i][j - 2] or ((p[j - 2] == "." or p[j - 2] == s[i - 1]) and dp[i - 1][j])\n            else:\n                dp[i][j] = (p[j - 1] == "." or p[j - 1] == s[i - 1]) and dp[i - 1][j - 1]\n    return dp[n][m]`,
        javascript: `var isMatch = function(s, p) {\n    const n = s.length, m = p.length;\n    const dp = [];\n    for (let i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(false));\n    dp[0][0] = true;\n    for (let j = 1; j <= m; j++) {\n        if (p[j - 1] === "*") dp[0][j] = dp[0][j - 2];\n    }\n    for (let i = 1; i <= n; i++) {\n        for (let j = 1; j <= m; j++) {\n            if (p[j - 1] === "*") {\n                dp[i][j] = dp[i][j - 2] || ((p[j - 2] === "." || p[j - 2] === s[i - 1]) && dp[i - 1][j]);\n            } else {\n                dp[i][j] = (p[j - 1] === "." || p[j - 1] === s[i - 1]) && dp[i - 1][j - 1];\n            }\n        }\n    }\n    return dp[n][m];\n};`,
              typescript: `function isMatch(s: string, p: string): boolean {\n    const n = s.length;\n    const m = p.length;\n    const dp: boolean[][] = [];\n    for (let i = 0; i <= n; i++) {\n        const row: boolean[] = [];\n        for (let j = 0; j <= m; j++) row.push(false);\n        dp.push(row);\n    }\n    dp[0][0] = true;\n    for (let j = 1; j <= m; j++) {\n        if (p.charAt(j - 1) === "*" && j >= 2) dp[0][j] = dp[0][j - 2];\n    }\n    for (let i = 1; i <= n; i++) {\n        for (let j = 1; j <= m; j++) {\n            const pc = p.charAt(j - 1);\n            if (pc === "*") {\n                if (j >= 2) {\n                    dp[i][j] = dp[i][j - 2];\n                    const prev = p.charAt(j - 2);\n                    if (prev === "." || prev === s.charAt(i - 1)) {\n                        if (dp[i - 1][j]) dp[i][j] = true;\n                    }\n                }\n            } else if (pc === "." || pc === s.charAt(i - 1)) {\n                dp[i][j] = dp[i - 1][j - 1];\n            }\n        }\n    }\n    return dp[n][m];\n}`,
              java: `public static boolean isMatch(String s, String p) {\n    int n = s.length(), m = p.length();\n    boolean[][] dp = new boolean[n + 1][m + 1];\n    dp[0][0] = true;\n    for (int j = 1; j <= m; j++) {\n        if (p.charAt(j - 1) == '*' && j >= 2) dp[0][j] = dp[0][j - 2];\n    }\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            char pc = p.charAt(j - 1);\n            if (pc == '*') {\n                if (j >= 2) {\n                    dp[i][j] = dp[i][j - 2];\n                    char prev = p.charAt(j - 2);\n                    if ((prev == '.' || prev == s.charAt(i - 1)) && dp[i - 1][j]) dp[i][j] = true;\n                }\n            } else if (pc == '.' || pc == s.charAt(i - 1)) {\n                dp[i][j] = dp[i - 1][j - 1];\n            }\n        }\n    }\n    return dp[n][m];\n}`,
              cpp: `bool isMatch(string s, string p) {\n    int n = (int) s.size(), m = (int) p.size();\n    vector<vector<bool>> dp(n + 1, vector<bool>(m + 1, false));\n    dp[0][0] = true;\n    for (int j = 1; j <= m; j++) {\n        if (p[j - 1] == '*' && j >= 2) dp[0][j] = dp[0][j - 2];\n    }\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            char pc = p[j - 1];\n            if (pc == '*') {\n                if (j >= 2) {\n                    dp[i][j] = dp[i][j - 2];\n                    char prev = p[j - 2];\n                    if ((prev == '.' || prev == s[i - 1]) && dp[i - 1][j]) dp[i][j] = true;\n                }\n            } else if (pc == '.' || pc == s[i - 1]) {\n                dp[i][j] = dp[i - 1][j - 1];\n            }\n        }\n    }\n    return dp[n][m];\n}`,
              c: `bool isMatch(const char* s, const char* p) {\n    int n = (int) strlen(s);\n    int m = (int) strlen(p);\n    int** dp = (int**) malloc((n + 1) * sizeof(int*));\n    for (int i = 0; i <= n; i++) dp[i] = (int*) calloc(m + 1, sizeof(int));\n    dp[0][0] = 1;\n    for (int j = 1; j <= m; j++) {\n        if (p[j - 1] == '*' && j >= 2) dp[0][j] = dp[0][j - 2];\n    }\n    for (int i = 1; i <= n; i++) {\n        for (int j = 1; j <= m; j++) {\n            char pc = p[j - 1];\n            if (pc == '*') {\n                if (j >= 2) {\n                    dp[i][j] = dp[i][j - 2];\n                    char prev = p[j - 2];\n                    if ((prev == '.' || prev == s[i - 1]) && dp[i - 1][j]) dp[i][j] = 1;\n                }\n            } else if (pc == '.' || pc == s[i - 1]) {\n                dp[i][j] = dp[i - 1][j - 1];\n            }\n        }\n    }\n    bool ans = dp[n][m] != 0;\n    for (int i = 0; i <= n; i++) free(dp[i]);\n    free(dp);\n    return ans;\n}`,
              csharp: `public static bool IsMatch(string s, string p)\n{\n    int n = s.Length, m = p.Length;\n    bool[,] dp = new bool[n + 1, m + 1];\n    dp[0, 0] = true;\n    for (int j = 1; j <= m; j++)\n    {\n        if (p[j - 1] == '*' && j >= 2) dp[0, j] = dp[0, j - 2];\n    }\n    for (int i = 1; i <= n; i++)\n    {\n        for (int j = 1; j <= m; j++)\n        {\n            char pc = p[j - 1];\n            if (pc == '*')\n            {\n                if (j >= 2)\n                {\n                    dp[i, j] = dp[i, j - 2];\n                    char prev = p[j - 2];\n                    if ((prev == '.' || prev == s[i - 1]) && dp[i - 1, j]) dp[i, j] = true;\n                }\n            }\n            else if (pc == '.' || pc == s[i - 1])\n            {\n                dp[i, j] = dp[i - 1, j - 1];\n            }\n        }\n    }\n    return dp[n, m];\n}`,
              go: `func isMatch(s string, p string) bool {\n	n, m := len(s), len(p)\n	dp := make([][]bool, n+1)\n	for i := range dp {\n		dp[i] = make([]bool, m+1)\n	}\n	dp[0][0] = true\n	for j := 1; j <= m; j++ {\n		if p[j-1] == '*' && j >= 2 {\n			dp[0][j] = dp[0][j-2]\n		}\n	}\n	for i := 1; i <= n; i++ {\n		for j := 1; j <= m; j++ {\n			pc := p[j-1]\n			if pc == '*' {\n				if j >= 2 {\n					dp[i][j] = dp[i][j-2]\n					prev := p[j-2]\n					if (prev == '.' || prev == s[i-1]) && dp[i-1][j] {\n						dp[i][j] = true\n					}\n				}\n			} else if pc == '.' || pc == s[i-1] {\n				dp[i][j] = dp[i-1][j-1]\n			}\n		}\n	}\n	return dp[n][m]\n}`,
              kotlin: `fun isMatch(s: String, p: String): Boolean {\n    val n = s.length\n    val m = p.length\n    val dp = Array(n + 1) { BooleanArray(m + 1) }\n    dp[0][0] = true\n    for (j in 1..m) {\n        if (p[j - 1] == '*' && j >= 2) dp[0][j] = dp[0][j - 2]\n    }\n    for (i in 1..n) {\n        for (j in 1..m) {\n            val pc = p[j - 1]\n            if (pc == '*') {\n                if (j >= 2) {\n                    dp[i][j] = dp[i][j - 2]\n                    val prev = p[j - 2]\n                    if ((prev == '.' || prev == s[i - 1]) && dp[i - 1][j]) dp[i][j] = true\n                }\n            } else if (pc == '.' || pc == s[i - 1]) {\n                dp[i][j] = dp[i - 1][j - 1]\n            }\n        }\n    }\n    return dp[n][m]\n}`,
              swift: `func isMatch(_ s: String, _ p: String) -> Bool {\n    let sc = Array(s)\n    let pc = Array(p)\n    let n = sc.count\n    let m = pc.count\n    var dp = [[Bool]](repeating: [Bool](repeating: false, count: m + 1), count: n + 1)\n    dp[0][0] = true\n    for j in 1...max(m, 1) {\n        if j > m { break }\n        if pc[j - 1] == "*" && j >= 2 { dp[0][j] = dp[0][j - 2] }\n    }\n    if n == 0 { return dp[0][m] }\n    for i in 1...n {\n        for j in 1...max(m, 1) {\n            if j > m { break }\n            let c = pc[j - 1]\n            if c == "*" {\n                if j >= 2 {\n                    dp[i][j] = dp[i][j - 2]\n                    let prev = pc[j - 2]\n                    if (prev == "." || prev == sc[i - 1]) && dp[i - 1][j] { dp[i][j] = true }\n                }\n            } else if c == "." || c == sc[i - 1] {\n                dp[i][j] = dp[i - 1][j - 1]\n            }\n        }\n    }\n    return dp[n][m]\n}`,
              rust: `fn isMatch(s: String, p: String) -> bool {\n    let sb: Vec<u8> = s.bytes().collect();\n    let pb: Vec<u8> = p.bytes().collect();\n    let n = sb.len();\n    let m = pb.len();\n    let mut dp = vec![vec![false; m + 1]; n + 1];\n    dp[0][0] = true;\n    for j in 1..=m {\n        if pb[j - 1] == b'*' && j >= 2 {\n            dp[0][j] = dp[0][j - 2];\n        }\n    }\n    for i in 1..=n {\n        for j in 1..=m {\n            let pc = pb[j - 1];\n            if pc == b'*' {\n                if j >= 2 {\n                    dp[i][j] = dp[i][j - 2];\n                    let prev = pb[j - 2];\n                    if (prev == b'.' || prev == sb[i - 1]) && dp[i - 1][j] {\n                        dp[i][j] = true;\n                    }\n                }\n            } else if pc == b'.' || pc == sb[i - 1] {\n                dp[i][j] = dp[i - 1][j - 1];\n            }\n        }\n    }\n    dp[n][m]\n}`,
              php: `function isMatch($s, $p) {\n    $n = strlen($s);\n    $m = strlen($p);\n    $dp = array();\n    for ($i = 0; $i <= $n; $i++) $dp[] = array_fill(0, $m + 1, false);\n    $dp[0][0] = true;\n    for ($j = 1; $j <= $m; $j++) {\n        if ($p[$j - 1] === '*' && $j >= 2) $dp[0][$j] = $dp[0][$j - 2];\n    }\n    for ($i = 1; $i <= $n; $i++) {\n        for ($j = 1; $j <= $m; $j++) {\n            $pc = $p[$j - 1];\n            if ($pc === '*') {\n                if ($j >= 2) {\n                    $dp[$i][$j] = $dp[$i][$j - 2];\n                    $prev = $p[$j - 2];\n                    if (($prev === '.' || $prev === $s[$i - 1]) && $dp[$i - 1][$j]) $dp[$i][$j] = true;\n                }\n            } elseif ($pc === '.' || $pc === $s[$i - 1]) {\n                $dp[$i][$j] = $dp[$i - 1][$j - 1];\n            }\n        }\n    }\n    return $dp[$n][$m];\n}`,
              ruby: `def isMatch(s, p)\n  n = s.length\n  m = p.length\n  dp = Array.new(n + 1) { Array.new(m + 1, false) }\n  dp[0][0] = true\n  (1..m).each do |j|\n    dp[0][j] = dp[0][j - 2] if p[j - 1] == '*' && j >= 2\n  end\n  (1..n).each do |i|\n    (1..m).each do |j|\n      pc = p[j - 1]\n      if pc == '*'\n        if j >= 2\n          dp[i][j] = dp[i][j - 2]\n          prev = p[j - 2]\n          dp[i][j] = true if (prev == '.' || prev == s[i - 1]) && dp[i - 1][j]\n        end\n      elsif pc == '.' || pc == s[i - 1]\n        dp[i][j] = dp[i - 1][j - 1]\n      end\n    end\n  end\n  dp[n][m]\nend`,
      },
    };
  })(),

];
