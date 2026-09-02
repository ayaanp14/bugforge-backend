/** Strings & hashing — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, fmtIntArr, fmtStrArr, randLower, ri, type CatalogProblem, type Rng } from "./types.js";

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
      solutions: {
        python: `def isPalindrome(s: str) -> bool:\n    c = [ch.lower() for ch in s if ch.isalnum()]\n    return c == c[::-1]`,
        javascript: `var isPalindrome = function(s) {\n    const c = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n    for (let i = 0, j = c.length - 1; i < j; i++, j--) {\n        if (c[i] !== c[j]) return false;\n    }\n    return true;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef longestCommonPrefix(strs: List[str]) -> str:\n    p = strs[0]\n    for s in strs[1:]:\n        while not s.startswith(p):\n            p = p[:-1]\n            if not p:\n                return ""\n    return p`,
        javascript: `var longestCommonPrefix = function(strs) {\n    let p = strs[0];\n    for (const s of strs) {\n        while (s.indexOf(p) !== 0) {\n            p = p.slice(0, -1);\n            if (p === "") return "";\n        }\n    }\n    return p;\n};`,
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
      solutions: {
        python: `def lengthOfLongestSubstring(s: str) -> int:\n    last = {}\n    start = 0\n    best = 0\n    for i, ch in enumerate(s):\n        if ch in last and last[ch] >= start:\n            start = last[ch] + 1\n        last[ch] = i\n        best = max(best, i - start + 1)\n    return best`,
        javascript: `var lengthOfLongestSubstring = function(s) {\n    const last = new Map();\n    let start = 0, best = 0;\n    for (let i = 0; i < s.length; i++) {\n        const ch = s[i];\n        if (last.has(ch) && last.get(ch) >= start) start = last.get(ch) + 1;\n        last.set(ch, i);\n        best = Math.max(best, i - start + 1);\n    }\n    return best;\n};`,
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
      solutions: {
        python: `def longestPalindrome(s: str) -> str:\n    best = ""\n    for c in range(len(s)):\n        for l0, r0 in ((c, c), (c, c + 1)):\n            l, r = l0, r0\n            while l >= 0 and r < len(s) and s[l] == s[r]:\n                l -= 1\n                r += 1\n            cand = s[l + 1:r]\n            if len(cand) > len(best):\n                best = cand\n    return best`,
        javascript: `var longestPalindrome = function(s) {\n    let best = "";\n    for (let c = 0; c < s.length; c++) {\n        for (const [l0, r0] of [[c, c], [c, c + 1]]) {\n            let l = l0, r = r0;\n            while (l >= 0 && r < s.length && s[l] === s[r]) { l--; r++; }\n            const cand = s.slice(l + 1, r);\n            if (cand.length > best.length) best = cand;\n        }\n    }\n    return best;\n};`,
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
      solutions: {
        python: `def countSubstrings(s: str) -> int:\n    count = 0\n    for c in range(len(s)):\n        for l0, r0 in ((c, c), (c, c + 1)):\n            l, r = l0, r0\n            while l >= 0 and r < len(s) and s[l] == s[r]:\n                count += 1\n                l -= 1\n                r += 1\n    return count`,
        javascript: `var countSubstrings = function(s) {\n    let count = 0;\n    for (let c = 0; c < s.length; c++) {\n        for (const [l0, r0] of [[c, c], [c, c + 1]]) {\n            let l = l0, r = r0;\n            while (l >= 0 && r < s.length && s[l] === s[r]) { count++; l--; r++; }\n        }\n    }\n    return count;\n};`,
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
      solutions: {
        python: `def characterReplacement(s: str, k: int) -> int:\n    count = [0] * 26\n    start = 0\n    max_freq = 0\n    best = 0\n    for i, ch in enumerate(s):\n        ci = ord(ch) - 97\n        count[ci] += 1\n        max_freq = max(max_freq, count[ci])\n        while i - start + 1 - max_freq > k:\n            count[ord(s[start]) - 97] -= 1\n            start += 1\n        best = max(best, i - start + 1)\n    return best`,
        javascript: `var characterReplacement = function(s, k) {\n    const count = new Array(26).fill(0);\n    let start = 0, maxFreq = 0, best = 0;\n    for (let i = 0; i < s.length; i++) {\n        const ci = s.charCodeAt(i) - 97;\n        count[ci]++;\n        maxFreq = Math.max(maxFreq, count[ci]);\n        while (i - start + 1 - maxFreq > k) {\n            count[s.charCodeAt(start) - 97]--;\n            start++;\n        }\n        best = Math.max(best, i - start + 1);\n    }\n    return best;\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef findAnagrams(s: str, p: str) -> List[int]:\n    out = []\n    if len(p) > len(s):\n        return out\n    need = [0] * 26\n    have = [0] * 26\n    for ch in p:\n        need[ord(ch) - 97] += 1\n    for i, ch in enumerate(s):\n        have[ord(ch) - 97] += 1\n        if i >= len(p):\n            have[ord(s[i - len(p)]) - 97] -= 1\n        if i >= len(p) - 1 and have == need:\n            out.append(i - len(p) + 1)\n    return out`,
        javascript: `var findAnagrams = function(s, p) {\n    const out = [];\n    if (p.length > s.length) return out;\n    const need = new Array(26).fill(0);\n    const have = new Array(26).fill(0);\n    for (const ch of p) need[ch.charCodeAt(0) - 97]++;\n    for (let i = 0; i < s.length; i++) {\n        have[s.charCodeAt(i) - 97]++;\n        if (i >= p.length) have[s.charCodeAt(i - p.length) - 97]--;\n        if (i >= p.length - 1) {\n            let ok = true;\n            for (let j = 0; j < 26; j++) {\n                if (need[j] !== have[j]) { ok = false; break; }\n            }\n            if (ok) out.push(i - p.length + 1);\n        }\n    }\n    return out;\n};`,
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
      solutions: {
        python: `def isIsomorphic(s: str, t: str) -> bool:\n    if len(s) != len(t):\n        return False\n    m1 = {}\n    m2 = {}\n    for a, b in zip(s, t):\n        if a in m1 and m1[a] != b:\n            return False\n        if b in m2 and m2[b] != a:\n            return False\n        m1[a] = b\n        m2[b] = a\n    return True`,
        javascript: `var isIsomorphic = function(s, t) {\n    if (s.length !== t.length) return false;\n    const m1 = new Map(), m2 = new Map();\n    for (let i = 0; i < s.length; i++) {\n        const a = s[i], b = t[i];\n        if (m1.has(a) && m1.get(a) !== b) return false;\n        if (m2.has(b) && m2.get(b) !== a) return false;\n        m1.set(a, b);\n        m2.set(b, a);\n    }\n    return true;\n};`,
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
      solutions: {
        python: `def wordPattern(pattern: str, s: str) -> bool:\n    words = s.split()\n    if len(words) != len(pattern):\n        return False\n    m1 = {}\n    m2 = {}\n    for a, b in zip(pattern, words):\n        if a in m1 and m1[a] != b:\n            return False\n        if b in m2 and m2[b] != a:\n            return False\n        m1[a] = b\n        m2[b] = a\n    return True`,
        javascript: `var wordPattern = function(pattern, s) {\n    const words = s.split(" ").filter(function(w) { return w !== ""; });\n    if (words.length !== pattern.length) return false;\n    const m1 = new Map(), m2 = new Map();\n    for (let i = 0; i < pattern.length; i++) {\n        const a = pattern[i], b = words[i];\n        if (m1.has(a) && m1.get(a) !== b) return false;\n        if (m2.has(b) && m2.get(b) !== a) return false;\n        m1.set(a, b);\n        m2.set(b, a);\n    }\n    return true;\n};`,
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
      solutions: {
        python: `def myAtoi(s: str) -> int:\n    INT_MAX = 2147483647\n    INT_MIN = -2147483648\n    i = 0\n    while i < len(s) and s[i] == " ":\n        i += 1\n    sign = 1\n    if i < len(s) and s[i] in "+-":\n        if s[i] == "-":\n            sign = -1\n        i += 1\n    num = 0\n    while i < len(s) and s[i].isdigit():\n        num = num * 10 + int(s[i])\n        if sign == 1 and num > INT_MAX:\n            return INT_MAX\n        if sign == -1 and -num < INT_MIN:\n            return INT_MIN\n        i += 1\n    return sign * num`,
        javascript: `var myAtoi = function(s) {\n    const INT_MAX = 2147483647, INT_MIN = -2147483648;\n    let i = 0;\n    while (i < s.length && s[i] === " ") i++;\n    let sign = 1;\n    if (i < s.length && (s[i] === "+" || s[i] === "-")) {\n        if (s[i] === "-") sign = -1;\n        i++;\n    }\n    let num = 0;\n    while (i < s.length && s[i] >= "0" && s[i] <= "9") {\n        num = num * 10 + (s.charCodeAt(i) - 48);\n        if (sign === 1 && num > INT_MAX) return INT_MAX;\n        if (sign === -1 && -num < INT_MIN) return INT_MIN;\n        i++;\n    }\n    return sign * num;\n};`,
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
      solutions: {
        python: `def compareVersion(version1: str, version2: str) -> int:\n    a = [int(x) for x in version1.split(".")]\n    b = [int(x) for x in version2.split(".")]\n    n = max(len(a), len(b))\n    for i in range(n):\n        x = a[i] if i < len(a) else 0\n        y = b[i] if i < len(b) else 0\n        if x < y:\n            return -1\n        if x > y:\n            return 1\n    return 0`,
        javascript: `var compareVersion = function(version1, version2) {\n    const a = version1.split(".").map(Number);\n    const b = version2.split(".").map(Number);\n    const n = Math.max(a.length, b.length);\n    for (let i = 0; i < n; i++) {\n        const x = a[i] || 0, y = b[i] || 0;\n        if (x < y) return -1;\n        if (x > y) return 1;\n    }\n    return 0;\n};`,
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
      solutions: {
        python: `def strStr(haystack: str, needle: str) -> int:\n    return haystack.find(needle)`,
        javascript: `var strStr = function(haystack, needle) {\n    return haystack.indexOf(needle);\n};`,
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
      solutions: {
        python: `def multiply(num1: str, num2: str) -> str:\n    if num1 == "0" or num2 == "0":\n        return "0"\n    n1, n2 = len(num1), len(num2)\n    digits = [0] * (n1 + n2)\n    for i in range(n1 - 1, -1, -1):\n        for j in range(n2 - 1, -1, -1):\n            total = int(num1[i]) * int(num2[j]) + digits[i + j + 1]\n            digits[i + j + 1] = total % 10\n            digits[i + j] += total // 10\n    out = "".join(map(str, digits)).lstrip("0")\n    return out or "0"`,
        javascript: `var multiply = function(num1, num2) {\n    if (num1 === "0" || num2 === "0") return "0";\n    const n1 = num1.length, n2 = num2.length;\n    const digits = new Array(n1 + n2).fill(0);\n    for (let i = n1 - 1; i >= 0; i--) {\n        for (let j = n2 - 1; j >= 0; j--) {\n            const total = (num1.charCodeAt(i) - 48) * (num2.charCodeAt(j) - 48) + digits[i + j + 1];\n            digits[i + j + 1] = total % 10;\n            digits[i + j] += Math.floor(total / 10);\n        }\n    }\n    let out = digits.join("").replace(/^0+/, "");\n    return out === "" ? "0" : out;\n};`,
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
      solutions: {
        python: `def minWindow(s: str, t: str) -> str:\n    from collections import Counter\n    need = Counter(t)\n    required = len(need)\n    have = {}\n    formed = 0\n    l = 0\n    best_len = float("inf")\n    best_l = 0\n    for r, ch in enumerate(s):\n        have[ch] = have.get(ch, 0) + 1\n        if ch in need and have[ch] == need[ch]:\n            formed += 1\n        while formed == required:\n            if r - l + 1 < best_len:\n                best_len = r - l + 1\n                best_l = l\n            lc = s[l]\n            have[lc] -= 1\n            if lc in need and have[lc] < need[lc]:\n                formed -= 1\n            l += 1\n    return "" if best_len == float("inf") else s[best_l:best_l + best_len]`,
        javascript: `var minWindow = function(s, t) {\n    const need = new Map();\n    for (const ch of t) need.set(ch, (need.get(ch) || 0) + 1);\n    const required = need.size;\n    const have = new Map();\n    let formed = 0, l = 0, bestLen = Infinity, bestL = 0;\n    for (let r = 0; r < s.length; r++) {\n        const ch = s[r];\n        have.set(ch, (have.get(ch) || 0) + 1);\n        if (need.has(ch) && have.get(ch) === need.get(ch)) formed++;\n        while (formed === required) {\n            if (r - l + 1 < bestLen) { bestLen = r - l + 1; bestL = l; }\n            const lc = s[l];\n            have.set(lc, have.get(lc) - 1);\n            if (need.has(lc) && have.get(lc) < need.get(lc)) formed--;\n            l++;\n        }\n    }\n    return bestLen === Infinity ? "" : s.slice(bestL, bestL + bestLen);\n};`,
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
      solutions: {
        python: `from typing import List\n\ndef findOccurrences(text: str, pattern: str) -> List[int]:\n    n, m = len(text), len(pattern)\n    if m > n:\n        return []\n    BASE = 131\n    MOD = 1000000007\n    target = 0\n    cur = 0\n    power = 1\n    for i in range(m):\n        target = (target * BASE + ord(pattern[i])) % MOD\n        cur = (cur * BASE + ord(text[i])) % MOD\n        if i > 0:\n            power = (power * BASE) % MOD\n    out = []\n    for i in range(n - m + 1):\n        if cur == target and text[i:i + m] == pattern:\n            out.append(i)\n        if i + m < n:\n            cur = ((cur - ord(text[i]) * power) * BASE + ord(text[i + m])) % MOD\n            cur %= MOD\n    return out`,
        javascript: `var findOccurrences = function(text, pattern) {\n    const n = text.length, m = pattern.length;\n    const out = [];\n    if (m > n) return out;\n    for (let i = 0; i + m <= n; i++) {\n        let ok = true;\n        for (let j = 0; j < m; j++) {\n            if (text[i + j] !== pattern[j]) { ok = false; break; }\n        }\n        if (ok) out.push(i);\n    }\n    return out;\n};`,
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
      solutions: {
        python: `def isMatch(s: str, p: str) -> bool:\n    n, m = len(s), len(p)\n    dp = [[False] * (m + 1) for _ in range(n + 1)]\n    dp[0][0] = True\n    for j in range(1, m + 1):\n        if p[j - 1] == "*":\n            dp[0][j] = dp[0][j - 2]\n    for i in range(1, n + 1):\n        for j in range(1, m + 1):\n            if p[j - 1] == "*":\n                dp[i][j] = dp[i][j - 2] or ((p[j - 2] == "." or p[j - 2] == s[i - 1]) and dp[i - 1][j])\n            else:\n                dp[i][j] = (p[j - 1] == "." or p[j - 1] == s[i - 1]) and dp[i - 1][j - 1]\n    return dp[n][m]`,
        javascript: `var isMatch = function(s, p) {\n    const n = s.length, m = p.length;\n    const dp = [];\n    for (let i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(false));\n    dp[0][0] = true;\n    for (let j = 1; j <= m; j++) {\n        if (p[j - 1] === "*") dp[0][j] = dp[0][j - 2];\n    }\n    for (let i = 1; i <= n; i++) {\n        for (let j = 1; j <= m; j++) {\n            if (p[j - 1] === "*") {\n                dp[i][j] = dp[i][j - 2] || ((p[j - 2] === "." || p[j - 2] === s[i - 1]) && dp[i - 1][j]);\n            } else {\n                dp[i][j] = (p[j - 1] === "." || p[j - 1] === s[i - 1]) && dp[i - 1][j - 1];\n            }\n        }\n    }\n    return dp[n][m];\n};`,
      },
    };
  })(),

];
