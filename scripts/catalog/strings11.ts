/**
 * String problems VI (mostly recent LeetCode contest problems) — wave 7, batch 09.
 * Real problems only: LeetCode numbered problems. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Several entries come in LeetCode's "I / II" pairs (Revert Word to Initial
 * State, Subarrays That Match a Pattern): the task is the same and only the
 * limits differ, so the I entry's solutions are the direct quadratic check and
 * the II entry's are the linear string-matching ones (Z-function, KMP). The
 * hidden cases of both stay small enough for the judge's time budget; the
 * statements keep the real limits.
 *
 * Where LeetCode accepts any order or any valid answer the statement fixes one;
 * every answer here is an int32.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

const VOWELS = "aeiou";

/** A word for the Revert Word pair: often a repeated block, so long borders exist. */
const revertWord = (rng: Rng, maxLen: number) => {
  const alpha = pick(rng, ["a", "ab", "ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
  if (rng() < 0.45) {
    const block = randLower(rng, 1, 4, alpha);
    const len = ri(rng, 1, maxLen);
    let w = "";
    while (w.length < len) w += block;
    w = w.slice(0, len);
    if (rng() < 0.3) { const i = ri(rng, 0, w.length - 1); w = w.slice(0, i) + pick(rng, alpha.split("")) + w.slice(i + 1); }
    return w;
  }
  return randLower(rng, 1, maxLen, alpha);
};

export const STRINGS11_PROBLEMS: CatalogProblem[] = [

  // ── Check if a String Is an Acronym of Words (LC 2828) ──────────
  (() => {
    const ref = (words: string[], s: string) => words.map((w) => w[0]).join("") === s;
    return {
      slug: "check-if-a-string-is-an-acronym-of-words",
      title: "Check if a String Is an Acronym of Words",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Amazon", "Google"],
      signature: { funcName: "isAcronym", params: [{ name: "words", type: "string[]" as const }, { name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "You are given an array of lowercase strings `words` and a string `s`.\n\nThe **acronym** of `words` is the string formed by taking the first character of every word, in order. For example, the acronym of `[\"code\",\"kairo\",\"rocks\"]` is `\"ckr\"`.\n\nReturn `true` if `s` is exactly the acronym of `words`, and `false` otherwise.",
        [
          { in: 'words = ["alice","bob","charlie"], s = "abc"', out: "true", note: "The first letters are a, b and c." },
          { in: 'words = ["an","apple"], s = "a"', out: "false", note: "The acronym is \"aa\"; \"a\" is only part of it." },
          { in: 'words = ["never","gonna","give","up","on","you"], s = "ngguoy"', out: "true" },
        ],
        ["1 <= words.length <= 100", "1 <= words[i].length <= 10", "1 <= s.length <= 100", "words[i] and s consist of lowercase English letters"]),
      hints: [
        "The acronym has exactly one character per word, so a length mismatch already decides the answer.",
        "Otherwise compare `s[i]` with the first character of `words[i]` for every `i`.",
      ],
      editorial: explain({
        idea: "The acronym is fully determined by `words`: one character per word, in order. So `s` matches it only if it has the same length and agrees with every word's first letter.",
        steps: [
          "If `s.length != words.length`, return `false`.",
          "For each index `i`, if `words[i][0] != s[i]`, return `false`.",
          "Return `true`.",
        ],
        why: "Two strings are equal exactly when their lengths agree and they agree position by position; the acronym's `i`-th character is `words[i][0]` by definition.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Check the length first — a shorter `s` that matches a prefix of the acronym is still `false`.",
        ],
      }),
      examples: [
        { input: '["alice","bob","charlie"]\n"abc"', expectedOutput: "true" },
        { input: '["an","apple"]\n"a"', expectedOutput: "false" },
        { input: '["never","gonna","give","up","on","you"]\n"ngguoy"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const n = ri(rng, 1, pick(rng, [1, 3, 8, 20, 40]));
        const words = Array.from({ length: n }, () => randLower(rng, 1, 10, alpha));
        let s = words.map((w) => w[0]).join("");
        const mode = ri(rng, 0, 5);
        if (mode === 0) s = randLower(rng, 1, Math.min(100, n + 2), alpha);
        else if (mode === 1) { const i = ri(rng, 0, s.length - 1); s = s.slice(0, i) + pick(rng, alpha.split("")) + s.slice(i + 1); }
        else if (mode === 2 && s.length > 1) s = s.slice(0, s.length - 1);
        else if (mode === 3) s = s + pick(rng, alpha.split(""));
        return { input: `${fmtStrArr(words)}\n"${s}"`, expectedOutput: bool(ref(words, s)) };
      },
      solutions: {
        python: code`
          from typing import List

          def isAcronym(words: List[str], s: str) -> bool:
              if len(words) != len(s):
                  return False
              for w, c in zip(words, s):
                  if w[0] != c:
                      return False
              return True
        `,
        javascript: code`
          var isAcronym = function(words, s) {
              if (words.length !== s.length) return false;
              for (var i = 0; i < words.length; i++) {
                  if (words[i].charAt(0) !== s.charAt(i)) return false;
              }
              return true;
          };
        `,
        typescript: code`
          function isAcronym(words: string[], s: string): boolean {
              if (words.length !== s.length) return false;
              for (var i = 0; i < words.length; i++) {
                  if (words[i].charAt(0) !== s.charAt(i)) return false;
              }
              return true;
          }
        `,
        java: code`
          public static boolean isAcronym(String[] words, String s) {
              if (words.length != s.length()) return false;
              for (int i = 0; i < words.length; i++) {
                  if (words[i].charAt(0) != s.charAt(i)) return false;
              }
              return true;
          }
        `,
        cpp: code`
          bool isAcronym(vector<string>& words, string s) {
              if (words.size() != s.size()) return false;
              for (size_t i = 0; i < words.size(); i++) {
                  if (words[i][0] != s[i]) return false;
              }
              return true;
          }
        `,
        c: code`
          bool isAcronym(char** words, int wordsSize, const char* s) {
              if ((int) strlen(s) != wordsSize) return false;
              for (int i = 0; i < wordsSize; i++) {
                  if (words[i][0] != s[i]) return false;
              }
              return true;
          }
        `,
        csharp: code`
          public static bool IsAcronym(string[] words, string s)
          {
              if (words.Length != s.Length) return false;
              for (int i = 0; i < words.Length; i++)
              {
                  if (words[i][0] != s[i]) return false;
              }
              return true;
          }
        `,
        go: code`
          func isAcronym(words []string, s string) bool {
              if len(words) != len(s) {
                  return false
              }
              for i, w := range words {
                  if w[0] != s[i] {
                      return false
                  }
              }
              return true
          }
        `,
        kotlin: code`
          fun isAcronym(words: Array<String>, s: String): Boolean {
              if (words.size != s.length) return false
              for (i in words.indices) {
                  if (words[i][0] != s[i]) return false
              }
              return true
          }
        `,
        swift: code`
          func isAcronym(_ words: [String], _ s: String) -> Bool {
              let chars = Array(s.utf8)
              if words.count != chars.count { return false }
              for i in 0..<words.count {
                  if words[i].utf8.first! != chars[i] { return false }
              }
              return true
          }
        `,
        rust: code`
          fn isAcronym(words: Vec<String>, s: String) -> bool {
              let b = s.as_bytes();
              if words.len() != b.len() {
                  return false;
              }
              for i in 0..words.len() {
                  if words[i].as_bytes()[0] != b[i] {
                      return false;
                  }
              }
              true
          }
        `,
        php: code`
          function isAcronym($words, $s) {
              if (count($words) != strlen($s)) return false;
              for ($i = 0; $i < count($words); $i++) {
                  if ($words[$i][0] !== $s[$i]) return false;
              }
              return true;
          }
        `,
        ruby: code`
          def isAcronym(words, s)
            return false if words.length != s.length
            words.each_with_index do |w, i|
              return false if w[0] != s[i]
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Check if Strings Can be Made Equal With Operations I (LC 2839) ─
  (() => {
    const ref = (s1: string, s2: string) => {
      const pair = (s: string, i: number) => [s[i], s[i + 2]].sort().join("");
      return pair(s1, 0) === pair(s2, 0) && pair(s1, 1) === pair(s2, 1);
    };
    return {
      slug: "check-if-strings-can-be-made-equal-with-operations-i",
      title: "Check if Strings Can be Made Equal With Operations I",
      difficulty: "EASY" as const,
      tags: ["String", "Google"],
      signature: { funcName: "canBeEqual", params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "You are given two strings `s1` and `s2`, each of length exactly `4` and made of lowercase letters.\n\nYou may apply the following operation to **either** string as many times as you like: pick two indices `i` and `j` with `j - i = 2` and swap the characters at those indices.\n\nReturn `true` if you can make `s1` and `s2` equal, and `false` otherwise.",
        [
          { in: 's1 = "abcd", s2 = "cdab"', out: "true", note: "Swap indices 0 and 2 of s1 to get \"cbad\", then indices 1 and 3 to get \"cdab\"." },
          { in: 's1 = "abcd", s2 = "dacb"', out: "false", note: "Index 0 of s2 holds 'd', but only 'a' or 'c' can ever reach index 0 of s1." },
          { in: 's1 = "kair", s2 = "kair"', out: "true", note: "The strings are already equal; no operation is needed." },
        ],
        ["s1.length == s2.length == 4", "s1 and s2 consist only of lowercase English letters"]),
      hints: [
        "A swap with `j - i = 2` only ever moves characters between index 0 and index 2, or between index 1 and index 3.",
        "So each string splits into two independent pairs: positions `{0, 2}` and positions `{1, 3}`. Within a pair the two characters can be in either order.",
        "The strings can be made equal exactly when the pair at `{0, 2}` holds the same two characters in both strings, and likewise for `{1, 3}`.",
      ],
      editorial: explain({
        idea: "The allowed swaps never mix the even positions with the odd positions; within each group of two the characters can be ordered freely. So all that matters is the unordered pair at `{0, 2}` and the unordered pair at `{1, 3}`.",
        steps: [
          "Check that `{s1[0], s1[2]}` equals `{s2[0], s2[2]}` as an unordered pair — either `s1[0] == s2[0] && s1[2] == s2[2]` or the crossed version.",
          "Check the same for indices 1 and 3.",
          "Return `true` only if both checks pass.",
        ],
        why: "Each operation permutes the characters inside one of the two groups, so the multiset of each group is invariant — the condition is necessary. It is also sufficient: if a group's characters are the same two but in the other order, one swap on `s1` fixes it.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Comparing the sorted whole strings is wrong — a character cannot move from an even to an odd index (\"abcd\" vs \"badc\" is false).",
        ],
      }),
      examples: [
        { input: '"abcd"\n"cdab"', expectedOutput: "true" },
        { input: '"abcd"\n"dacb"', expectedOutput: "false" },
        { input: '"kair"\n"kair"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcd", "abcdefghijklmnopqrstuvwxyz"]);
        const s1 = randLower(rng, 4, 4, alpha);
        let s2: string;
        const mode = ri(rng, 0, 3);
        if (mode <= 1) {
          const a = s1.split("");
          if (rng() < 0.5) [a[0], a[2]] = [a[2], a[0]];
          if (rng() < 0.5) [a[1], a[3]] = [a[3], a[1]];
          if (mode === 1) { const i = ri(rng, 0, 3); a[i] = pick(rng, alpha.split("")); }
          s2 = a.join("");
        } else if (mode === 2) s2 = shuffle(rng, s1.split("")).join("");
        else s2 = randLower(rng, 4, 4, alpha);
        return { input: `"${s1}"\n"${s2}"`, expectedOutput: bool(ref(s1, s2)) };
      },
      solutions: {
        python: code`
          def canBeEqual(s1: str, s2: str) -> bool:
              def same(i: int, j: int) -> bool:
                  return (s1[i] == s2[i] and s1[j] == s2[j]) or (s1[i] == s2[j] and s1[j] == s2[i])
              return same(0, 2) and same(1, 3)
        `,
        javascript: code`
          var canBeEqual = function(s1, s2) {
              var same = function(i, j) {
                  return (s1[i] === s2[i] && s1[j] === s2[j]) || (s1[i] === s2[j] && s1[j] === s2[i]);
              };
              return same(0, 2) && same(1, 3);
          };
        `,
        typescript: code`
          function canBeEqual(s1: string, s2: string): boolean {
              var same = function(i: number, j: number): boolean {
                  return (s1[i] === s2[i] && s1[j] === s2[j]) || (s1[i] === s2[j] && s1[j] === s2[i]);
              };
              return same(0, 2) && same(1, 3);
          }
        `,
        java: code`
          public static boolean canBeEqual(String s1, String s2) {
              return same(s1, s2, 0, 2) && same(s1, s2, 1, 3);
          }

          static boolean same(String a, String b, int i, int j) {
              return (a.charAt(i) == b.charAt(i) && a.charAt(j) == b.charAt(j))
                  || (a.charAt(i) == b.charAt(j) && a.charAt(j) == b.charAt(i));
          }
        `,
        cpp: code`
          bool canBeEqual(string s1, string s2) {
              auto same = [&](int i, int j) {
                  return (s1[i] == s2[i] && s1[j] == s2[j]) || (s1[i] == s2[j] && s1[j] == s2[i]);
              };
              return same(0, 2) && same(1, 3);
          }
        `,
        c: code`
          static bool samePair(const char* a, const char* b, int i, int j) {
              return (a[i] == b[i] && a[j] == b[j]) || (a[i] == b[j] && a[j] == b[i]);
          }

          bool canBeEqual(const char* s1, const char* s2) {
              return samePair(s1, s2, 0, 2) && samePair(s1, s2, 1, 3);
          }
        `,
        csharp: code`
          static bool Same(string a, string b, int i, int j)
          {
              return (a[i] == b[i] && a[j] == b[j]) || (a[i] == b[j] && a[j] == b[i]);
          }

          public static bool CanBeEqual(string s1, string s2)
          {
              return Same(s1, s2, 0, 2) && Same(s1, s2, 1, 3);
          }
        `,
        go: code`
          func canBeEqual(s1 string, s2 string) bool {
              same := func(i, j int) bool {
                  return (s1[i] == s2[i] && s1[j] == s2[j]) || (s1[i] == s2[j] && s1[j] == s2[i])
              }
              return same(0, 2) && same(1, 3)
          }
        `,
        kotlin: code`
          fun canBeEqual(s1: String, s2: String): Boolean {
              fun same(i: Int, j: Int): Boolean =
                  (s1[i] == s2[i] && s1[j] == s2[j]) || (s1[i] == s2[j] && s1[j] == s2[i])
              return same(0, 2) && same(1, 3)
          }
        `,
        swift: code`
          func canBeEqual(_ s1: String, _ s2: String) -> Bool {
              let a = Array(s1.utf8), b = Array(s2.utf8)
              func same(_ i: Int, _ j: Int) -> Bool {
                  return (a[i] == b[i] && a[j] == b[j]) || (a[i] == b[j] && a[j] == b[i])
              }
              return same(0, 2) && same(1, 3)
          }
        `,
        rust: code`
          fn canBeEqual(s1: String, s2: String) -> bool {
              let a = s1.as_bytes();
              let b = s2.as_bytes();
              let same = |i: usize, j: usize| (a[i] == b[i] && a[j] == b[j]) || (a[i] == b[j] && a[j] == b[i]);
              same(0, 2) && same(1, 3)
          }
        `,
        php: code`
          function canBeEqual($s1, $s2) {
              $same = function ($i, $j) use ($s1, $s2) {
                  return ($s1[$i] === $s2[$i] && $s1[$j] === $s2[$j]) || ($s1[$i] === $s2[$j] && $s1[$j] === $s2[$i]);
              };
              return $same(0, 2) && $same(1, 3);
          }
        `,
        ruby: code`
          def canBeEqual(s1, s2)
            same = lambda do |i, j|
              (s1[i] == s2[i] && s1[j] == s2[j]) || (s1[i] == s2[j] && s1[j] == s2[i])
            end
            same.call(0, 2) && same.call(1, 3)
          end
        `,
      },
    };
  })(),

  // ── Count Beautiful Substrings I (LC 2947) ──────────────────────
  (() => {
    const ref = (s: string, k: number) => {
      let res = 0;
      for (let i = 0; i < s.length; i++) {
        for (let j = i + 1; j <= s.length; j++) {
          let v = 0;
          for (let t = i; t < j; t++) if (VOWELS.includes(s[t])) v++;
          const c = j - i - v;
          if (v === c && (v * c) % k === 0) res++;
        }
      }
      return res;
    };
    return {
      slug: "count-beautiful-substrings-i",
      title: "Count Beautiful Substrings I",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Math", "String", "Enumeration", "Prefix Sum", "Amazon"],
      signature: { funcName: "beautifulSubstrings", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `s` of lowercase letters and a positive integer `k`.\n\nFor a string, let `vowels` be the number of vowels in it (`a`, `e`, `i`, `o`, `u`) and `consonants` the number of other letters. A string is **beautiful** when:\n\n- `vowels == consonants`, and\n- `(vowels * consonants) % k == 0`.\n\nReturn the number of **non-empty substrings** of `s` that are beautiful. Substrings at different positions count separately even if they read the same.",
        [
          { in: 's = "baeyh", k = 2', out: "2", note: "\"baey\" has 2 vowels and 2 consonants and 2 * 2 = 4 is divisible by 2; so is \"aeyh\". No other substring qualifies." },
          { in: 's = "abba", k = 1', out: "3", note: "\"ab\", \"ba\" (the last two letters) and \"abba\" each balance vowels and consonants, and every product is divisible by 1." },
          { in: 's = "bcdf", k = 1', out: "0", note: "There are no vowels, so no non-empty substring can balance." },
        ],
        ["1 <= s.length <= 1000", "1 <= k <= 1000", "s consists only of lowercase English letters"]),
      hints: [
        "With `s.length <= 1000` you can afford to look at every substring, as long as you do not recount its vowels from scratch.",
        "Fix the left end `i` and extend the right end `j` one character at a time, updating a running vowel count.",
        "The consonant count is the length minus the vowel count; test both conditions for each `(i, j)`.",
      ],
      editorial: explain({
        idea: "There are only about half a million substrings at the largest size, so enumerate them all — but grow each one from a fixed start so the vowel count updates in `O(1)` per step.",
        steps: [
          "For every start index `i`, set `v = 0`.",
          "For every end index `j >= i`, add one to `v` if `s[j]` is a vowel; the consonant count is `c = (j - i + 1) - v`.",
          "If `v == c` and `(v * c) % k == 0`, count the substring.",
          "Return the total.",
        ],
        why: "Each non-empty substring is `s[i..j]` for exactly one pair `i <= j`, and the running count makes `v` the exact vowel count of `s[i..j]` when it is tested — so every substring is checked once against the definition.",
        time: "O(n^2)",
        space: "O(1)",
        pitfalls: [
          "Recounting the vowels inside the double loop makes it `O(n^3)`, too slow at `n = 1000`.",
          "`y` is a consonant here.",
          "A balanced substring always has even length, but both conditions must still hold — `v * c` must be divisible by `k`, not `v` alone.",
        ],
      }),
      examples: [
        { input: '"baeyh"\n2', expectedOutput: "2" },
        { input: '"abba"\n1', expectedOutput: "3" },
        { input: '"bcdf"\n1', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "ae", "abe", "abcdeiou", "abcdefghijklmnopqrstuvwxyz", "aeioub"]);
        const s = randLower(rng, 1, pick(rng, [1, 6, 16, 30, 40]), alpha);
        const k = pick(rng, [1, 1, 2, 3, 4, 5, 9, 16, 25, ri(rng, 1, 1000)]);
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: code`
          def beautifulSubstrings(s: str, k: int) -> int:
              n = len(s)
              res = 0
              for i in range(n):
                  v = 0
                  for j in range(i, n):
                      if s[j] in "aeiou":
                          v += 1
                      c = j - i + 1 - v
                      if v == c and (v * c) % k == 0:
                          res += 1
              return res
        `,
        javascript: code`
          var beautifulSubstrings = function(s, k) {
              var n = s.length, res = 0;
              for (var i = 0; i < n; i++) {
                  var v = 0;
                  for (var j = i; j < n; j++) {
                      if ("aeiou".indexOf(s[j]) >= 0) v++;
                      var c = j - i + 1 - v;
                      if (v === c && (v * c) % k === 0) res++;
                  }
              }
              return res;
          };
        `,
        typescript: code`
          function beautifulSubstrings(s: string, k: number): number {
              var n = s.length, res = 0;
              for (var i = 0; i < n; i++) {
                  var v = 0;
                  for (var j = i; j < n; j++) {
                      if ("aeiou".indexOf(s[j]) >= 0) v++;
                      var c = j - i + 1 - v;
                      if (v === c && (v * c) % k === 0) res++;
                  }
              }
              return res;
          }
        `,
        java: code`
          public static int beautifulSubstrings(String s, int k) {
              int n = s.length(), res = 0;
              for (int i = 0; i < n; i++) {
                  int v = 0;
                  for (int j = i; j < n; j++) {
                      if ("aeiou".indexOf(s.charAt(j)) >= 0) v++;
                      int c = j - i + 1 - v;
                      if (v == c && (v * c) % k == 0) res++;
                  }
              }
              return res;
          }
        `,
        cpp: code`
          int beautifulSubstrings(string s, int k) {
              int n = s.size(), res = 0;
              for (int i = 0; i < n; i++) {
                  int v = 0;
                  for (int j = i; j < n; j++) {
                      char ch = s[j];
                      if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') v++;
                      int c = j - i + 1 - v;
                      if (v == c && (v * c) % k == 0) res++;
                  }
              }
              return res;
          }
        `,
        c: code`
          int beautifulSubstrings(const char* s, int k) {
              int n = (int) strlen(s), res = 0;
              for (int i = 0; i < n; i++) {
                  int v = 0;
                  for (int j = i; j < n; j++) {
                      char ch = s[j];
                      if (ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u') v++;
                      int c = j - i + 1 - v;
                      if (v == c && (v * c) % k == 0) res++;
                  }
              }
              return res;
          }
        `,
        csharp: code`
          public static int BeautifulSubstrings(string s, int k)
          {
              int n = s.Length, res = 0;
              for (int i = 0; i < n; i++)
              {
                  int v = 0;
                  for (int j = i; j < n; j++)
                  {
                      if ("aeiou".IndexOf(s[j]) >= 0) v++;
                      int c = j - i + 1 - v;
                      if (v == c && (v * c) % k == 0) res++;
                  }
              }
              return res;
          }
        `,
        go: code`
          func beautifulSubstrings(s string, k int) int {
              n, res := len(s), 0
              for i := 0; i < n; i++ {
                  v := 0
                  for j := i; j < n; j++ {
                      ch := s[j]
                      if ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u' {
                          v++
                      }
                      c := j - i + 1 - v
                      if v == c && (v*c)%k == 0 {
                          res++
                      }
                  }
              }
              return res
          }
        `,
        kotlin: code`
          fun beautifulSubstrings(s: String, k: Int): Int {
              val n = s.length
              var res = 0
              for (i in 0 until n) {
                  var v = 0
                  for (j in i until n) {
                      if ("aeiou".indexOf(s[j]) >= 0) v++
                      val c = j - i + 1 - v
                      if (v == c && (v * c) % k == 0) res++
                  }
              }
              return res
          }
        `,
        swift: code`
          func beautifulSubstrings(_ s: String, _ k: Int) -> Int {
              let a = Array(s.utf8)
              let vowel: Set<UInt8> = [97, 101, 105, 111, 117]
              let n = a.count
              var res = 0
              for i in 0..<n {
                  var v = 0
                  for j in i..<n {
                      if vowel.contains(a[j]) { v += 1 }
                      let c = j - i + 1 - v
                      if v == c && (v * c) % k == 0 { res += 1 }
                  }
              }
              return res
          }
        `,
        rust: code`
          fn beautifulSubstrings(s: String, k: i32) -> i32 {
              let a = s.as_bytes();
              let n = a.len();
              let mut res = 0;
              for i in 0..n {
                  let mut v: i32 = 0;
                  for j in i..n {
                      if b"aeiou".contains(&a[j]) {
                          v += 1;
                      }
                      let c = (j - i + 1) as i32 - v;
                      if v == c && (v * c) % k == 0 {
                          res += 1;
                      }
                  }
              }
              res
          }
        `,
        php: code`
          function beautifulSubstrings($s, $k) {
              $n = strlen($s);
              $res = 0;
              for ($i = 0; $i < $n; $i++) {
                  $v = 0;
                  for ($j = $i; $j < $n; $j++) {
                      if (strpos("aeiou", $s[$j]) !== false) $v++;
                      $c = $j - $i + 1 - $v;
                      if ($v == $c && ($v * $c) % $k == 0) $res++;
                  }
              }
              return $res;
          }
        `,
        ruby: code`
          def beautifulSubstrings(s, k)
            a = s.bytes
            n = a.length
            res = 0
            n.times do |i|
              v = 0
              (i...n).each do |j|
                ch = a[j]
                v += 1 if ch == 97 || ch == 101 || ch == 105 || ch == 111 || ch == 117
                c = j - i + 1 - v
                res += 1 if v == c && (v * c) % k == 0
              end
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Find Longest Special Substring That Occurs Thrice I (LC 2981) ─
  (() => {
    const ref = (s: string) => {
      const cnt = new Map<string, number>();
      for (let i = 0; i < s.length; i++) {
        for (let j = i + 1; j <= s.length; j++) {
          const sub = s.slice(i, j);
          if (sub.split("").every((c) => c === sub[0])) cnt.set(sub, (cnt.get(sub) || 0) + 1);
        }
      }
      let best = -1;
      for (const [sub, c] of cnt) if (c >= 3 && sub.length > best) best = sub.length;
      return best;
    };
    return {
      slug: "find-longest-special-substring-that-occurs-thrice-i",
      title: "Find Longest Special Substring That Occurs Thrice I",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Binary Search", "Sliding Window", "Counting", "Google", "Amazon"],
      signature: { funcName: "maximumLength", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `s` of lowercase letters.\n\nA string is **special** if every character in it is the same — `\"ddd\"`, `\"z\"` and `\"ff\"` are special, `\"abc\"` and `\"ccd\"` are not.\n\nReturn the length of the **longest** special substring of `s` that occurs **at least three times** (occurrences may overlap), or `-1` if no special substring occurs three times.",
        [
          { in: 's = "aaaa"', out: "2", note: "\"aa\" starts at indices 0, 1 and 2. \"aaa\" occurs only twice." },
          { in: 's = "abcdef"', out: "-1", note: "Every special substring is a single letter that occurs once." },
          { in: 's = "abcaba"', out: "1", note: "\"a\" occurs at indices 0, 3 and 5." },
        ],
        ["3 <= s.length <= 50", "s consists only of lowercase English letters"]),
      hints: [
        "A special substring lives entirely inside one maximal run of a single repeated letter.",
        "A run of letter `c` with length `L` contains the special string of length `l` exactly `L - l + 1` times (for `l <= L`).",
        "For every letter and every length, add those counts over all runs, and keep the largest length whose total reaches 3.",
      ],
      editorial: explain({
        idea: "Split `s` into maximal runs of one letter. Every occurrence of a special substring sits inside one run, and a run of length `L` contributes `L - l + 1` occurrences of the length-`l` string of its letter. Summing those per (letter, length) gives every occurrence count directly.",
        steps: [
          "Walk `s` and cut it into maximal runs; for a run of letter `c` and length `L`, add `L - l + 1` to `count[c][l]` for every `l` from 1 to `L`.",
          "Scan all `(c, l)` with `count[c][l] >= 3` and keep the largest `l`.",
          "Return it, or `-1` if there is none.",
        ],
        why: "Two different runs of the same letter are separated by another letter, so no occurrence spans two runs, and inside a run every window of length `l` is an occurrence. The sum therefore counts every occurrence exactly once.",
        time: "O(n^2) at worst (the sum of the squared run lengths)",
        space: "O(26 * n)",
        pitfalls: [
          "Occurrences may overlap: \"aaaa\" contains \"aa\" three times.",
          "Runs of the same letter in different places all add to the same counter — in \"aabaab\" the two runs of `a` together give \"a\" four times.",
        ],
      }),
      examples: [
        { input: '"aaaa"', expectedOutput: "2" },
        { input: '"abcdef"', expectedOutput: "-1" },
        { input: '"abcaba"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "ab", "abc", "abcd", "abcdefghijklmnopqrstuvwxyz"]);
        let s = "";
        const target = ri(rng, 3, pick(rng, [3, 8, 20, 50]));
        while (s.length < target) s += pick(rng, alpha.split("")).repeat(ri(rng, 1, pick(rng, [1, 3, 6, 12])));
        s = s.slice(0, target);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def maximumLength(s: str) -> int:
              n = len(s)
              count = [[0] * (n + 2) for _ in range(26)]
              i = 0
              while i < n:
                  j = i
                  while j < n and s[j] == s[i]:
                      j += 1
                  run = j - i
                  c = ord(s[i]) - 97
                  for l in range(1, run + 1):
                      count[c][l] += run - l + 1
                  i = j
              best = -1
              for c in range(26):
                  for l in range(1, n + 1):
                      if count[c][l] >= 3 and l > best:
                          best = l
              return best
        `,
        javascript: code`
          var maximumLength = function(s) {
              var n = s.length;
              var count = [];
              for (var c = 0; c < 26; c++) {
                  count.push(new Array(n + 2).fill(0));
              }
              var i = 0;
              while (i < n) {
                  var j = i;
                  while (j < n && s[j] === s[i]) j++;
                  var run = j - i, ch = s.charCodeAt(i) - 97;
                  for (var l = 1; l <= run; l++) count[ch][l] += run - l + 1;
                  i = j;
              }
              var best = -1;
              for (var c2 = 0; c2 < 26; c2++) {
                  for (var l2 = 1; l2 <= n; l2++) {
                      if (count[c2][l2] >= 3 && l2 > best) best = l2;
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function maximumLength(s: string): number {
              var n = s.length;
              var count: number[][] = [];
              for (var c = 0; c < 26; c++) {
                  var row: number[] = [];
                  for (var z = 0; z < n + 2; z++) row.push(0);
                  count.push(row);
              }
              var i = 0;
              while (i < n) {
                  var j = i;
                  while (j < n && s[j] === s[i]) j++;
                  var run = j - i, ch = s.charCodeAt(i) - 97;
                  for (var l = 1; l <= run; l++) count[ch][l] += run - l + 1;
                  i = j;
              }
              var best = -1;
              for (var c2 = 0; c2 < 26; c2++) {
                  for (var l2 = 1; l2 <= n; l2++) {
                      if (count[c2][l2] >= 3 && l2 > best) best = l2;
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int maximumLength(String s) {
              int n = s.length();
              int[][] count = new int[26][n + 2];
              int i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && s.charAt(j) == s.charAt(i)) j++;
                  int run = j - i, c = s.charAt(i) - 'a';
                  for (int l = 1; l <= run; l++) count[c][l] += run - l + 1;
                  i = j;
              }
              int best = -1;
              for (int c = 0; c < 26; c++)
                  for (int l = 1; l <= n; l++)
                      if (count[c][l] >= 3 && l > best) best = l;
              return best;
          }
        `,
        cpp: code`
          int maximumLength(string s) {
              int n = s.size();
              vector<vector<int>> count(26, vector<int>(n + 2, 0));
              int i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && s[j] == s[i]) j++;
                  int run = j - i, c = s[i] - 'a';
                  for (int l = 1; l <= run; l++) count[c][l] += run - l + 1;
                  i = j;
              }
              int best = -1;
              for (int c = 0; c < 26; c++)
                  for (int l = 1; l <= n; l++)
                      if (count[c][l] >= 3 && l > best) best = l;
              return best;
          }
        `,
        c: code`
          int maximumLength(const char* s) {
              int n = (int) strlen(s);
              int* count = (int*) calloc((size_t) 26 * (n + 2), sizeof(int));
              int i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && s[j] == s[i]) j++;
                  int run = j - i, c = s[i] - 'a';
                  for (int l = 1; l <= run; l++) count[c * (n + 2) + l] += run - l + 1;
                  i = j;
              }
              int best = -1;
              for (int c = 0; c < 26; c++)
                  for (int l = 1; l <= n; l++)
                      if (count[c * (n + 2) + l] >= 3 && l > best) best = l;
              free(count);
              return best;
          }
        `,
        csharp: code`
          public static int MaximumLength(string s)
          {
              int n = s.Length;
              var count = new int[26, n + 2];
              int i = 0;
              while (i < n)
              {
                  int j = i;
                  while (j < n && s[j] == s[i]) j++;
                  int run = j - i, c = s[i] - 'a';
                  for (int l = 1; l <= run; l++) count[c, l] += run - l + 1;
                  i = j;
              }
              int best = -1;
              for (int c = 0; c < 26; c++)
                  for (int l = 1; l <= n; l++)
                      if (count[c, l] >= 3 && l > best) best = l;
              return best;
          }
        `,
        go: code`
          func maximumLength(s string) int {
              n := len(s)
              count := make([][]int, 26)
              for c := range count {
                  count[c] = make([]int, n+2)
              }
              i := 0
              for i < n {
                  j := i
                  for j < n && s[j] == s[i] {
                      j++
                  }
                  run, c := j-i, int(s[i]-'a')
                  for l := 1; l <= run; l++ {
                      count[c][l] += run - l + 1
                  }
                  i = j
              }
              best := -1
              for c := 0; c < 26; c++ {
                  for l := 1; l <= n; l++ {
                      if count[c][l] >= 3 && l > best {
                          best = l
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maximumLength(s: String): Int {
              val n = s.length
              val count = Array(26) { IntArray(n + 2) }
              var i = 0
              while (i < n) {
                  var j = i
                  while (j < n && s[j] == s[i]) j++
                  val run = j - i
                  val c = s[i] - 'a'
                  for (l in 1..run) count[c][l] += run - l + 1
                  i = j
              }
              var best = -1
              for (c in 0 until 26)
                  for (l in 1..n)
                      if (count[c][l] >= 3 && l > best) best = l
              return best
          }
        `,
        swift: code`
          func maximumLength(_ s: String) -> Int {
              let a = Array(s.utf8)
              let n = a.count
              var count = [[Int]](repeating: [Int](repeating: 0, count: n + 2), count: 26)
              var i = 0
              while i < n {
                  var j = i
                  while j < n && a[j] == a[i] { j += 1 }
                  let run = j - i
                  let c = Int(a[i]) - 97
                  for l in 1...run { count[c][l] += run - l + 1 }
                  i = j
              }
              var best = -1
              for c in 0..<26 {
                  for l in 1...n where count[c][l] >= 3 && l > best { best = l }
              }
              return best
          }
        `,
        rust: code`
          fn maximumLength(s: String) -> i32 {
              let a = s.as_bytes();
              let n = a.len();
              let mut count = vec![vec![0usize; n + 2]; 26];
              let mut i = 0;
              while i < n {
                  let mut j = i;
                  while j < n && a[j] == a[i] {
                      j += 1;
                  }
                  let run = j - i;
                  let c = (a[i] - b'a') as usize;
                  for l in 1..=run {
                      count[c][l] += run - l + 1;
                  }
                  i = j;
              }
              let mut best: i32 = -1;
              for c in 0..26 {
                  for l in 1..=n {
                      if count[c][l] >= 3 && l as i32 > best {
                          best = l as i32;
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function maximumLength($s) {
              $n = strlen($s);
              $count = array_fill(0, 26, array_fill(0, $n + 2, 0));
              $i = 0;
              while ($i < $n) {
                  $j = $i;
                  while ($j < $n && $s[$j] === $s[$i]) $j++;
                  $run = $j - $i;
                  $c = ord($s[$i]) - 97;
                  for ($l = 1; $l <= $run; $l++) $count[$c][$l] += $run - $l + 1;
                  $i = $j;
              }
              $best = -1;
              for ($c = 0; $c < 26; $c++)
                  for ($l = 1; $l <= $n; $l++)
                      if ($count[$c][$l] >= 3 && $l > $best) $best = $l;
              return $best;
          }
        `,
        ruby: code`
          def maximumLength(s)
            n = s.length
            count = Array.new(26) { Array.new(n + 2, 0) }
            i = 0
            while i < n
              j = i
              j += 1 while j < n && s[j] == s[i]
              run = j - i
              c = s[i].ord - 97
              (1..run).each { |l| count[c][l] += run - l + 1 }
              i = j
            end
            best = -1
            26.times do |c|
              (1..n).each { |l| best = l if count[c][l] >= 3 && l > best }
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Minimum Time to Revert Word to Initial State I (LC 3029) ────
  (() => {
    const ref = (word: string, k: number) => {
      const n = word.length;
      for (let t = 1; ; t++) {
        if (t * k >= n) return t;
        if (word.startsWith(word.slice(t * k))) return t;
      }
    };
    return {
      slug: "minimum-time-to-revert-word-to-initial-state-i",
      title: "Minimum Time to Revert Word to Initial State I",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Rolling Hash", "String Matching", "Google"],
      signature: { funcName: "minimumTimeToInitialState", params: [{ name: "word", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `word` and an integer `k`.\n\nEvery second you must do **both** of the following:\n\n- remove the first `k` characters of `word`, and\n- append any `k` characters of your choice to the end of `word`.\n\nThe characters you append do not have to be the ones you removed. Return the **minimum time greater than zero** after which `word` can be back in its initial state.",
        [
          { in: 'word = "abacaba", k = 3', out: "2", note: "After 1 second the word could be \"cababac\" (it must start with \"caba\", which is not a prefix of \"abacaba\"). After 2 seconds the kept part is just \"a\", which is a prefix, so append \"bacaba\" to restore it." },
          { in: 'word = "abacaba", k = 4', out: "1", note: "Removing \"abac\" keeps \"aba\", a prefix of the word; appending \"caba\" restores it at once." },
          { in: 'word = "abcbabcd", k = 2', out: "4", note: "No kept suffix is a prefix until all 8 characters have been replaced after 4 seconds." },
        ],
        ["1 <= word.length <= 50", "1 <= k <= word.length", "word consists only of lowercase English letters"]),
      hints: [
        "After `t` seconds the first `t * k` characters are gone; what remains of the original word is its suffix starting at index `t * k`, followed by characters you chose freely.",
        "You can rebuild the original exactly when that surviving suffix equals the word's prefix of the same length — the free characters fill in the rest.",
        "Try `t = 1, 2, …` in order. Once `t * k >= n` nothing original survives and the answer is that `t`.",
      ],
      editorial: explain({
        idea: "Only the original characters that have not yet been removed constrain the result. After `t` seconds those are `word[t*k..]`, sitting at the front; the word can be restored exactly when that suffix is also a prefix of `word`.",
        steps: [
          "For `t = 1, 2, 3, …`: let `i = t * k`.",
          "If `i >= n`, every original character is gone — return `t`.",
          "If `word[i..]` equals `word[0 .. n - i)`, return `t`.",
        ],
        why: "The appended characters are arbitrary, so after `t` seconds the word is `word[i..]` followed by any `i` characters. That equals the original iff `word[i..]` matches the original's first `n - i` characters (then append the original's last `i`). Checking `t` in increasing order returns the minimum.",
        time: "O(n^2 / k)",
        space: "O(1) beyond the compared substrings",
        pitfalls: [
          "The answer is never 0 — at least one second must pass.",
          "When `t * k` passes `n` the answer is `ceil(n / k)`, not `n / k`.",
        ],
      }),
      examples: [
        { input: '"abacaba"\n3', expectedOutput: "2" },
        { input: '"abacaba"\n4', expectedOutput: "1" },
        { input: '"abcbabcd"\n2', expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const word = revertWord(rng,pick(rng, [1, 6, 15, 30, 50]));
        const k = rng() < 0.5 ? ri(rng, 1, Math.min(3, word.length)) : ri(rng, 1, word.length);
        return { input: `"${word}"\n${k}`, expectedOutput: String(ref(word, k)) };
      },
      solutions: {
        python: code`
          def minimumTimeToInitialState(word: str, k: int) -> int:
              n = len(word)
              t = 1
              while t * k < n:
                  if word.startswith(word[t * k:]):
                      return t
                  t += 1
              return t
        `,
        javascript: code`
          var minimumTimeToInitialState = function(word, k) {
              var n = word.length, t = 1;
              while (t * k < n) {
                  var i = t * k, ok = true;
                  for (var j = 0; i + j < n; j++) {
                      if (word[i + j] !== word[j]) { ok = false; break; }
                  }
                  if (ok) return t;
                  t++;
              }
              return t;
          };
        `,
        typescript: code`
          function minimumTimeToInitialState(word: string, k: number): number {
              var n = word.length, t = 1;
              while (t * k < n) {
                  var i = t * k, ok = true;
                  for (var j = 0; i + j < n; j++) {
                      if (word[i + j] !== word[j]) { ok = false; break; }
                  }
                  if (ok) return t;
                  t++;
              }
              return t;
          }
        `,
        java: code`
          public static int minimumTimeToInitialState(String word, int k) {
              int n = word.length(), t = 1;
              while (t * k < n) {
                  if (word.startsWith(word.substring(t * k))) return t;
                  t++;
              }
              return t;
          }
        `,
        cpp: code`
          int minimumTimeToInitialState(string word, int k) {
              int n = word.size(), t = 1;
              while (t * k < n) {
                  int i = t * k;
                  if (word.compare(i, n - i, word, 0, n - i) == 0) return t;
                  t++;
              }
              return t;
          }
        `,
        c: code`
          int minimumTimeToInitialState(const char* word, int k) {
              int n = (int) strlen(word), t = 1;
              while (t * k < n) {
                  int i = t * k;
                  if (strncmp(word + i, word, (size_t) (n - i)) == 0) return t;
                  t++;
              }
              return t;
          }
        `,
        csharp: code`
          public static int MinimumTimeToInitialState(string word, int k)
          {
              int n = word.Length, t = 1;
              while (t * k < n)
              {
                  int i = t * k;
                  if (string.CompareOrdinal(word, i, word, 0, n - i) == 0) return t;
                  t++;
              }
              return t;
          }
        `,
        go: code`
          func minimumTimeToInitialState(word string, k int) int {
              n, t := len(word), 1
              for t*k < n {
                  if strings.HasPrefix(word, word[t*k:]) {
                      return t
                  }
                  t++
              }
              return t
          }
        `,
        kotlin: code`
          fun minimumTimeToInitialState(word: String, k: Int): Int {
              val n = word.length
              var t = 1
              while (t * k < n) {
                  if (word.startsWith(word.substring(t * k))) return t
                  t++
              }
              return t
          }
        `,
        swift: code`
          func minimumTimeToInitialState(_ word: String, _ k: Int) -> Int {
              let a = Array(word.utf8)
              let n = a.count
              var t = 1
              while t * k < n {
                  let i = t * k
                  var ok = true
                  var j = 0
                  while i + j < n {
                      if a[i + j] != a[j] { ok = false; break }
                      j += 1
                  }
                  if ok { return t }
                  t += 1
              }
              return t
          }
        `,
        rust: code`
          fn minimumTimeToInitialState(word: String, k: i32) -> i32 {
              let a = word.as_bytes();
              let n = a.len();
              let k = k as usize;
              let mut t = 1usize;
              while t * k < n {
                  let i = t * k;
                  if a[i..] == a[..n - i] {
                      return t as i32;
                  }
                  t += 1;
              }
              t as i32
          }
        `,
        php: code`
          function minimumTimeToInitialState($word, $k) {
              $n = strlen($word);
              $t = 1;
              while ($t * $k < $n) {
                  $i = $t * $k;
                  if (substr_compare($word, substr($word, 0, $n - $i), $i) === 0) return $t;
                  $t++;
              }
              return $t;
          }
        `,
        ruby: code`
          def minimumTimeToInitialState(word, k)
            n = word.length
            t = 1
            while t * k < n
              return t if word.start_with?(word[t * k..-1])
              t += 1
            end
            t
          end
        `,
      },
    };
  })(),

  // ── Minimum Time to Revert Word to Initial State II (LC 3031) ───
  (() => {
    const ref = (word: string, k: number) => {
      const n = word.length;
      for (let t = 1; ; t++) {
        if (t * k >= n) return t;
        if (word.startsWith(word.slice(t * k))) return t;
      }
    };
    return {
      slug: "minimum-time-to-revert-word-to-initial-state-ii",
      title: "Minimum Time to Revert Word to Initial State II",
      difficulty: "HARD" as const,
      tags: ["String", "Rolling Hash", "String Matching", "Google"],
      signature: { funcName: "minimumTimeToInitialState", params: [{ name: "word", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `word` and an integer `k`.\n\nEvery second you must do **both** of the following:\n\n- remove the first `k` characters of `word`, and\n- append any `k` characters of your choice to the end of `word`.\n\nReturn the **minimum time greater than zero** after which `word` can be back in its initial state.\n\nThis is the large version of the problem: `word` can hold up to a million characters, so checking each candidate time by comparing strings is too slow.",
        [
          { in: 'word = "abacaba", k = 3', out: "2", note: "After 2 seconds only the final \"a\" of the original survives at the front; it is a prefix of \"abacaba\", so appending \"bacaba\" restores the word." },
          { in: 'word = "abababab", k = 3', out: "2", note: "After 1 second \"babab\" survives, which is not a prefix. After 2 seconds \"ab\" survives, which is." },
          { in: 'word = "abcbabcd", k = 2', out: "4", note: "No surviving suffix is ever a prefix, so all 8 characters must be replaced: 4 seconds." },
        ],
        ["1 <= word.length <= 10^6", "1 <= k <= word.length", "word consists only of lowercase English letters"]),
      hints: [
        "After `t` seconds the word can be the original again exactly when the suffix `word[t*k..]` is also a prefix of `word` (or nothing original is left).",
        "So you need, for many positions `i`, to know whether the suffix starting at `i` matches the prefix of the same length — the length of the longest common prefix of `word` and `word[i..]`.",
        "The Z-function gives that length for every `i` in linear time: `z[i] == n - i` means the whole suffix is a prefix.",
      ],
      editorial: explain({
        idea: "The question at time `t` is whether `word[t*k..]` is a prefix of `word`. That is exactly `z[t*k] == n - t*k`, where `z[i]` is the longest common prefix of `word` and its suffix at `i` — and the Z-function computes all of them in `O(n)`.",
        steps: [
          "Compute the Z-array: keep the rightmost window `[l, r)` known to match the prefix. For each `i`, start `z[i]` at `min(r - i, z[i - l])` when `i < r`, extend it by direct comparison, and move the window if it now reaches further right.",
          "For `t = 1, 2, …`: if `t * k >= n` return `t`; if `z[t*k] == n - t*k` return `t`.",
        ],
        why: "After `t` seconds the word is `word[t*k..]` followed by `t*k` free characters, which can equal the original iff that suffix matches the original's prefix. `z[i] == n - i` states precisely that the suffix at `i` matches the prefix along its whole length. Each character extension in the Z loop pushes `r` right, so the total work is linear.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Comparing `word[i..]` with the prefix directly for every candidate `t` is `O(n^2 / k)` — fine for the small version, too slow here when `k` is 1.",
          "If no candidate works the answer is `ceil(n / k)`, reached when `t * k >= n`.",
          "`z[0]` is never consulted (`t` starts at 1), so its convention does not matter.",
        ],
      }),
      examples: [
        { input: '"abacaba"\n3', expectedOutput: "2" },
        { input: '"abababab"\n3', expectedOutput: "2" },
        { input: '"abcbabcd"\n2', expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const word = revertWord(rng, pick(rng, [1, 10, 40, 120, 200]));
        const k = rng() < 0.5 ? ri(rng, 1, Math.min(4, word.length)) : ri(rng, 1, word.length);
        return { input: `"${word}"\n${k}`, expectedOutput: String(ref(word, k)) };
      },
      solutions: {
        python: code`
          def minimumTimeToInitialState(word: str, k: int) -> int:
              n = len(word)
              z = [0] * n
              l = r = 0
              for i in range(1, n):
                  if i < r:
                      z[i] = min(r - i, z[i - l])
                  while i + z[i] < n and word[z[i]] == word[i + z[i]]:
                      z[i] += 1
                  if i + z[i] > r:
                      l, r = i, i + z[i]
              t = 1
              while t * k < n:
                  if z[t * k] == n - t * k:
                      return t
                  t += 1
              return t
        `,
        javascript: code`
          var minimumTimeToInitialState = function(word, k) {
              var n = word.length;
              var z = new Array(n).fill(0);
              var l = 0, r = 0;
              for (var i = 1; i < n; i++) {
                  if (i < r) z[i] = Math.min(r - i, z[i - l]);
                  while (i + z[i] < n && word.charCodeAt(z[i]) === word.charCodeAt(i + z[i])) z[i]++;
                  if (i + z[i] > r) { l = i; r = i + z[i]; }
              }
              var t = 1;
              while (t * k < n) {
                  if (z[t * k] === n - t * k) return t;
                  t++;
              }
              return t;
          };
        `,
        typescript: code`
          function minimumTimeToInitialState(word: string, k: number): number {
              var n = word.length;
              var z: number[] = [];
              for (var q = 0; q < n; q++) z.push(0);
              var l = 0, r = 0;
              for (var i = 1; i < n; i++) {
                  if (i < r) z[i] = Math.min(r - i, z[i - l]);
                  while (i + z[i] < n && word.charCodeAt(z[i]) === word.charCodeAt(i + z[i])) z[i]++;
                  if (i + z[i] > r) { l = i; r = i + z[i]; }
              }
              var t = 1;
              while (t * k < n) {
                  if (z[t * k] === n - t * k) return t;
                  t++;
              }
              return t;
          }
        `,
        java: code`
          public static int minimumTimeToInitialState(String word, int k) {
              int n = word.length();
              int[] z = new int[n];
              int l = 0, r = 0;
              for (int i = 1; i < n; i++) {
                  if (i < r) z[i] = Math.min(r - i, z[i - l]);
                  while (i + z[i] < n && word.charAt(z[i]) == word.charAt(i + z[i])) z[i]++;
                  if (i + z[i] > r) { l = i; r = i + z[i]; }
              }
              int t = 1;
              while ((long) t * k < n) {
                  if (z[t * k] == n - t * k) return t;
                  t++;
              }
              return t;
          }
        `,
        cpp: code`
          int minimumTimeToInitialState(string word, int k) {
              int n = word.size();
              vector<int> z(n, 0);
              int l = 0, r = 0;
              for (int i = 1; i < n; i++) {
                  if (i < r) z[i] = min(r - i, z[i - l]);
                  while (i + z[i] < n && word[z[i]] == word[i + z[i]]) z[i]++;
                  if (i + z[i] > r) { l = i; r = i + z[i]; }
              }
              int t = 1;
              while ((long long) t * k < n) {
                  if (z[t * k] == n - t * k) return t;
                  t++;
              }
              return t;
          }
        `,
        c: code`
          int minimumTimeToInitialState(const char* word, int k) {
              int n = (int) strlen(word);
              int* z = (int*) calloc((size_t) n + 1, sizeof(int));
              int l = 0, r = 0;
              for (int i = 1; i < n; i++) {
                  if (i < r) z[i] = (r - i < z[i - l]) ? r - i : z[i - l];
                  while (i + z[i] < n && word[z[i]] == word[i + z[i]]) z[i]++;
                  if (i + z[i] > r) { l = i; r = i + z[i]; }
              }
              int t = 1;
              while ((long long) t * k < n) {
                  if (z[t * k] == n - t * k) { free(z); return t; }
                  t++;
              }
              free(z);
              return t;
          }
        `,
        csharp: code`
          public static int MinimumTimeToInitialState(string word, int k)
          {
              int n = word.Length;
              var z = new int[n];
              int l = 0, r = 0;
              for (int i = 1; i < n; i++)
              {
                  if (i < r) z[i] = Math.Min(r - i, z[i - l]);
                  while (i + z[i] < n && word[z[i]] == word[i + z[i]]) z[i]++;
                  if (i + z[i] > r) { l = i; r = i + z[i]; }
              }
              int t = 1;
              while ((long) t * k < n)
              {
                  if (z[t * k] == n - t * k) return t;
                  t++;
              }
              return t;
          }
        `,
        go: code`
          func minimumTimeToInitialState(word string, k int) int {
              n := len(word)
              z := make([]int, n)
              l, r := 0, 0
              for i := 1; i < n; i++ {
                  if i < r {
                      z[i] = r - i
                      if z[i-l] < z[i] {
                          z[i] = z[i-l]
                      }
                  }
                  for i+z[i] < n && word[z[i]] == word[i+z[i]] {
                      z[i]++
                  }
                  if i+z[i] > r {
                      l, r = i, i+z[i]
                  }
              }
              t := 1
              for t*k < n {
                  if z[t*k] == n-t*k {
                      return t
                  }
                  t++
              }
              return t
          }
        `,
        kotlin: code`
          fun minimumTimeToInitialState(word: String, k: Int): Int {
              val n = word.length
              val z = IntArray(n)
              var l = 0
              var r = 0
              for (i in 1 until n) {
                  if (i < r) z[i] = minOf(r - i, z[i - l])
                  while (i + z[i] < n && word[z[i]] == word[i + z[i]]) z[i]++
                  if (i + z[i] > r) { l = i; r = i + z[i] }
              }
              var t = 1
              while (t.toLong() * k < n) {
                  if (z[t * k] == n - t * k) return t
                  t++
              }
              return t
          }
        `,
        swift: code`
          func minimumTimeToInitialState(_ word: String, _ k: Int) -> Int {
              let a = Array(word.utf8)
              let n = a.count
              var z = [Int](repeating: 0, count: n)
              var l = 0, r = 0
              var i = 1
              while i < n {
                  if i < r { z[i] = min(r - i, z[i - l]) }
                  while i + z[i] < n && a[z[i]] == a[i + z[i]] { z[i] += 1 }
                  if i + z[i] > r { l = i; r = i + z[i] }
                  i += 1
              }
              var t = 1
              while t * k < n {
                  if z[t * k] == n - t * k { return t }
                  t += 1
              }
              return t
          }
        `,
        rust: code`
          fn minimumTimeToInitialState(word: String, k: i32) -> i32 {
              let a = word.as_bytes();
              let n = a.len();
              let k = k as usize;
              let mut z = vec![0usize; n];
              let (mut l, mut r) = (0usize, 0usize);
              for i in 1..n {
                  if i < r {
                      z[i] = std::cmp::min(r - i, z[i - l]);
                  }
                  while i + z[i] < n && a[z[i]] == a[i + z[i]] {
                      z[i] += 1;
                  }
                  if i + z[i] > r {
                      l = i;
                      r = i + z[i];
                  }
              }
              let mut t = 1usize;
              while t * k < n {
                  if z[t * k] == n - t * k {
                      return t as i32;
                  }
                  t += 1;
              }
              t as i32
          }
        `,
        php: code`
          function minimumTimeToInitialState($word, $k) {
              $n = strlen($word);
              $z = array_fill(0, $n, 0);
              $l = 0;
              $r = 0;
              for ($i = 1; $i < $n; $i++) {
                  if ($i < $r) $z[$i] = min($r - $i, $z[$i - $l]);
                  while ($i + $z[$i] < $n && $word[$z[$i]] === $word[$i + $z[$i]]) $z[$i]++;
                  if ($i + $z[$i] > $r) { $l = $i; $r = $i + $z[$i]; }
              }
              $t = 1;
              while ($t * $k < $n) {
                  if ($z[$t * $k] == $n - $t * $k) return $t;
                  $t++;
              }
              return $t;
          }
        `,
        ruby: code`
          def minimumTimeToInitialState(word, k)
            a = word.bytes
            n = a.length
            z = Array.new(n, 0)
            l = 0
            r = 0
            (1...n).each do |i|
              z[i] = [r - i, z[i - l]].min if i < r
              z[i] += 1 while i + z[i] < n && a[z[i]] == a[i + z[i]]
              if i + z[i] > r
                l = i
                r = i + z[i]
              end
            end
            t = 1
            while t * k < n
              return t if z[t * k] == n - t * k
              t += 1
            end
            t
          end
        `,
      },
    };
  })(),

  // ── Number of Subarrays That Match a Pattern I (LC 3034) ────────
  (() => {
    const ref = (nums: number[], pattern: number[]) => {
      const m = pattern.length;
      let res = 0;
      for (let i = 0; i + m < nums.length; i++) {
        let ok = true;
        for (let k = 0; k < m; k++) {
          const s = Math.sign(nums[i + k + 1] - nums[i + k]);
          if (s !== pattern[k]) { ok = false; break; }
        }
        if (ok) res++;
      }
      return res;
    };
    return {
      slug: "number-of-subarrays-that-match-a-pattern-i",
      title: "Number of Subarrays That Match a Pattern I",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Rolling Hash", "String Matching", "Amazon"],
      signature: { funcName: "countMatchingSubarrays", params: [{ name: "nums", type: "int[]" as const }, { name: "pattern", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` of length `n` and an array `pattern` of length `m` whose entries are each `-1`, `0` or `1`.\n\nA subarray `nums[i..i+m]` (of size `m + 1`) **matches** the pattern when, for every `k` from `0` to `m - 1`:\n\n- `nums[i + k + 1] > nums[i + k]` if `pattern[k] == 1`;\n- `nums[i + k + 1] == nums[i + k]` if `pattern[k] == 0`;\n- `nums[i + k + 1] < nums[i + k]` if `pattern[k] == -1`.\n\nReturn the number of subarrays of `nums` that match `pattern`.",
        [
          { in: "nums = [1,2,3,4,5,6], pattern = [1,1]", out: "4", note: "Every window of three consecutive values is strictly increasing: [1,2,3], [2,3,4], [3,4,5] and [4,5,6]." },
          { in: "nums = [1,4,4,1,3,5,5,3], pattern = [1,0,-1]", out: "2", note: "[1,4,4,1] and [3,5,5,3] go up, stay level, then go down." },
          { in: "nums = [7,7,7,7], pattern = [0,0,0]", out: "1", note: "The only subarray of size 4 is the whole array, and it never changes." },
        ],
        ["2 <= n == nums.length <= 100", "1 <= nums[i] <= 10^9", "1 <= m == pattern.length < n", "-1 <= pattern[i] <= 1"]),
      hints: [
        "A pattern entry only describes how one element compares with the next one.",
        "For every start `i`, walk `k` from `0` to `m - 1` and compare the sign of `nums[i + k + 1] - nums[i + k]` with `pattern[k]`.",
        "Stop a start early at its first mismatch and count the starts that survive all `m` comparisons.",
      ],
      editorial: explain({
        idea: "With `n <= 100` each of the `n - m` candidate subarrays can be checked against the pattern directly — one comparison of neighbours per pattern entry.",
        steps: [
          "For every start `i` with `i + m < n`:",
          "for `k = 0 .. m - 1`, compute `s = 1` if `nums[i+k+1] > nums[i+k]`, `0` if equal, `-1` if smaller; if `s != pattern[k]`, the start fails.",
          "Count the starts that never fail.",
        ],
        why: "The definition of a match is exactly these `m` neighbour comparisons, and every subarray of size `m + 1` is identified by its start `i`, so each candidate is tested once against the full definition.",
        time: "O(n * m)",
        space: "O(1)",
        pitfalls: [
          "The subarray has `m + 1` elements, so the last start is `n - m - 1`.",
          "Compare values rather than subtracting into a sign in languages where a difference could overflow — here values are at most `10^9`, so a difference fits in 32 bits, but a comparison is clearer.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5,6]\n[1,1]", expectedOutput: "4" },
        { input: "[1,4,4,1,3,5,5,3]\n[1,0,-1]", expectedOutput: "2" },
        { input: "[7,7,7,7]\n[0,0,0]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 5, 12, 30, 60]));
        const top = pick(rng, [1, 2, 3, 5, 100, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const m = ri(rng, 1, Math.min(n - 1, pick(rng, [1, 2, 3, 5, 99])));
        let pattern: number[];
        if (rng() < 0.6) {
          const st = ri(rng, 0, n - m - 1);
          pattern = Array.from({ length: m }, (_, k) => Math.sign(nums[st + k + 1] - nums[st + k]));
        } else pattern = Array.from({ length: m }, () => ri(rng, -1, 1));
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(pattern)}`, expectedOutput: String(ref(nums, pattern)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countMatchingSubarrays(nums: List[int], pattern: List[int]) -> int:
              n, m = len(nums), len(pattern)
              res = 0
              for i in range(n - m):
                  ok = True
                  for k in range(m):
                      a, b = nums[i + k], nums[i + k + 1]
                      s = 1 if b > a else (0 if b == a else -1)
                      if s != pattern[k]:
                          ok = False
                          break
                  if ok:
                      res += 1
              return res
        `,
        javascript: code`
          var countMatchingSubarrays = function(nums, pattern) {
              var n = nums.length, m = pattern.length, res = 0;
              for (var i = 0; i + m < n; i++) {
                  var ok = true;
                  for (var k = 0; k < m; k++) {
                      var a = nums[i + k], b = nums[i + k + 1];
                      var s = b > a ? 1 : (b === a ? 0 : -1);
                      if (s !== pattern[k]) { ok = false; break; }
                  }
                  if (ok) res++;
              }
              return res;
          };
        `,
        typescript: code`
          function countMatchingSubarrays(nums: number[], pattern: number[]): number {
              var n = nums.length, m = pattern.length, res = 0;
              for (var i = 0; i + m < n; i++) {
                  var ok = true;
                  for (var k = 0; k < m; k++) {
                      var a = nums[i + k], b = nums[i + k + 1];
                      var s = b > a ? 1 : (b === a ? 0 : -1);
                      if (s !== pattern[k]) { ok = false; break; }
                  }
                  if (ok) res++;
              }
              return res;
          }
        `,
        java: code`
          public static int countMatchingSubarrays(int[] nums, int[] pattern) {
              int n = nums.length, m = pattern.length, res = 0;
              for (int i = 0; i + m < n; i++) {
                  boolean ok = true;
                  for (int k = 0; k < m; k++) {
                      int s = Integer.compare(nums[i + k + 1], nums[i + k]);
                      if (s != pattern[k]) { ok = false; break; }
                  }
                  if (ok) res++;
              }
              return res;
          }
        `,
        cpp: code`
          int countMatchingSubarrays(vector<int>& nums, vector<int>& pattern) {
              int n = nums.size(), m = pattern.size(), res = 0;
              for (int i = 0; i + m < n; i++) {
                  bool ok = true;
                  for (int k = 0; k < m; k++) {
                      int a = nums[i + k], b = nums[i + k + 1];
                      int s = (b > a) - (b < a);
                      if (s != pattern[k]) { ok = false; break; }
                  }
                  if (ok) res++;
              }
              return res;
          }
        `,
        c: code`
          int countMatchingSubarrays(int* nums, int numsSize, int* pattern, int patternSize) {
              int m = patternSize, res = 0;
              for (int i = 0; i + m < numsSize; i++) {
                  bool ok = true;
                  for (int k = 0; k < m; k++) {
                      int a = nums[i + k], b = nums[i + k + 1];
                      int s = (b > a) - (b < a);
                      if (s != pattern[k]) { ok = false; break; }
                  }
                  if (ok) res++;
              }
              return res;
          }
        `,
        csharp: code`
          public static int CountMatchingSubarrays(int[] nums, int[] pattern)
          {
              int n = nums.Length, m = pattern.Length, res = 0;
              for (int i = 0; i + m < n; i++)
              {
                  bool ok = true;
                  for (int k = 0; k < m; k++)
                  {
                      int s = nums[i + k + 1].CompareTo(nums[i + k]);
                      if (s != pattern[k]) { ok = false; break; }
                  }
                  if (ok) res++;
              }
              return res;
          }
        `,
        go: code`
          func countMatchingSubarrays(nums []int, pattern []int) int {
              n, m, res := len(nums), len(pattern), 0
              for i := 0; i+m < n; i++ {
                  ok := true
                  for k := 0; k < m; k++ {
                      a, b := nums[i+k], nums[i+k+1]
                      s := 0
                      if b > a {
                          s = 1
                      } else if b < a {
                          s = -1
                      }
                      if s != pattern[k] {
                          ok = false
                          break
                      }
                  }
                  if ok {
                      res++
                  }
              }
              return res
          }
        `,
        kotlin: code`
          fun countMatchingSubarrays(nums: IntArray, pattern: IntArray): Int {
              val n = nums.size
              val m = pattern.size
              var res = 0
              for (i in 0 until n - m) {
                  var ok = true
                  for (k in 0 until m) {
                      val s = nums[i + k + 1].compareTo(nums[i + k]).coerceIn(-1, 1)
                      if (s != pattern[k]) { ok = false; break }
                  }
                  if (ok) res++
              }
              return res
          }
        `,
        swift: code`
          func countMatchingSubarrays(_ nums: [Int], _ pattern: [Int]) -> Int {
              let n = nums.count, m = pattern.count
              var res = 0
              var i = 0
              while i + m < n {
                  var ok = true
                  for k in 0..<m {
                      let a = nums[i + k], b = nums[i + k + 1]
                      let s = b > a ? 1 : (b == a ? 0 : -1)
                      if s != pattern[k] { ok = false; break }
                  }
                  if ok { res += 1 }
                  i += 1
              }
              return res
          }
        `,
        rust: code`
          fn countMatchingSubarrays(nums: Vec<i32>, pattern: Vec<i32>) -> i32 {
              let n = nums.len();
              let m = pattern.len();
              let mut res = 0;
              let mut i = 0;
              while i + m < n {
                  let mut ok = true;
                  for k in 0..m {
                      let s = (nums[i + k + 1] > nums[i + k]) as i32 - (nums[i + k + 1] < nums[i + k]) as i32;
                      if s != pattern[k] {
                          ok = false;
                          break;
                      }
                  }
                  if ok {
                      res += 1;
                  }
                  i += 1;
              }
              res
          }
        `,
        php: code`
          function countMatchingSubarrays($nums, $pattern) {
              $n = count($nums);
              $m = count($pattern);
              $res = 0;
              for ($i = 0; $i + $m < $n; $i++) {
                  $ok = true;
                  for ($k = 0; $k < $m; $k++) {
                      $s = $nums[$i + $k + 1] <=> $nums[$i + $k];
                      if ($s != $pattern[$k]) { $ok = false; break; }
                  }
                  if ($ok) $res++;
              }
              return $res;
          }
        `,
        ruby: code`
          def countMatchingSubarrays(nums, pattern)
            n = nums.length
            m = pattern.length
            res = 0
            (0...(n - m)).each do |i|
              ok = true
              m.times do |k|
                if (nums[i + k + 1] <=> nums[i + k]) != pattern[k]
                  ok = false
                  break
                end
              end
              res += 1 if ok
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Number of Subarrays That Match a Pattern II (LC 3036) ───────
  (() => {
    const ref = (nums: number[], pattern: number[]) => {
      const m = pattern.length;
      let res = 0;
      for (let i = 0; i + m < nums.length; i++) {
        let ok = true;
        for (let k = 0; k < m; k++) {
          if (Math.sign(nums[i + k + 1] - nums[i + k]) !== pattern[k]) { ok = false; break; }
        }
        if (ok) res++;
      }
      return res;
    };
    return {
      slug: "number-of-subarrays-that-match-a-pattern-ii",
      title: "Number of Subarrays That Match a Pattern II",
      difficulty: "HARD" as const,
      tags: ["Array", "Rolling Hash", "String Matching", "Amazon"],
      signature: { funcName: "countMatchingSubarrays", params: [{ name: "nums", type: "int[]" as const }, { name: "pattern", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` of length `n` and an array `pattern` of length `m` whose entries are each `-1`, `0` or `1`.\n\nA subarray `nums[i..i+m]` (of size `m + 1`) **matches** the pattern when, for every `k` from `0` to `m - 1`:\n\n- `nums[i + k + 1] > nums[i + k]` if `pattern[k] == 1`;\n- `nums[i + k + 1] == nums[i + k]` if `pattern[k] == 0`;\n- `nums[i + k + 1] < nums[i + k]` if `pattern[k] == -1`.\n\nReturn the number of subarrays of `nums` that match `pattern`. This is the large version: `n` can reach a million, so checking every start against the whole pattern is too slow.",
        [
          { in: "nums = [1,2,3,4,5,6], pattern = [1,1]", out: "4", note: "Every window of three consecutive values is strictly increasing." },
          { in: "nums = [1,4,4,1,3,5,5,3], pattern = [1,0,-1]", out: "2", note: "[1,4,4,1] and [3,5,5,3] match." },
          { in: "nums = [3,1,3,1,3,1,3], pattern = [-1,1,-1]", out: "2", note: "The matches start at indices 0 and 2 and overlap — both count." },
        ],
        ["2 <= n == nums.length <= 10^6", "1 <= nums[i] <= 10^9", "1 <= m == pattern.length < n", "-1 <= pattern[i] <= 1"]),
      hints: [
        "Turn `nums` into a sequence of `n - 1` signs: `1`, `0` or `-1` for each neighbouring pair.",
        "A subarray matches exactly when `pattern` appears in that sign sequence starting at the subarray's first index.",
        "Count the (possibly overlapping) occurrences of `pattern` in the sign sequence with a linear string-matching algorithm such as KMP or the Z-function.",
      ],
      editorial: explain({
        idea: "Comparing neighbours turns the array into a 'text' of signs over the alphabet `{-1, 0, 1}`. The question becomes: how many times does `pattern` occur in that text? That is classic string matching, solvable in linear time with KMP.",
        steps: [
          "Build the KMP failure table of `pattern`: `fail[i]` is the length of the longest proper border of `pattern[0..i]`.",
          "Scan `i = 0 .. n - 2`, computing the sign `s` of `nums[i+1]` versus `nums[i]` on the fly.",
          "Keep `j`, the length of the pattern prefix matched so far: while `j > 0` and `s != pattern[j]`, fall back to `fail[j - 1]`; if `s == pattern[j]`, advance `j`.",
          "When `j == m`, count a match and continue from `fail[m - 1]` so overlapping matches are found.",
        ],
        why: "Subarray `nums[i..i+m]` matches iff signs `i .. i+m-1` equal `pattern`, so the matches are in one-to-one correspondence with occurrences of `pattern` in the sign text. KMP finds every occurrence, overlapping ones included, and its fallback pointer only moves forward overall, so the scan is linear.",
        time: "O(n + m)",
        space: "O(m)",
        pitfalls: [
          "After a full match fall back to `fail[m - 1]` rather than resetting to 0, or overlapping matches like Example 3 are missed.",
          "The text has `n - 1` symbols, not `n`.",
          "Use comparisons for the sign rather than a subtraction that could overflow in other variants of the problem.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4,5,6]\n[1,1]", expectedOutput: "4" },
        { input: "[1,4,4,1,3,5,5,3]\n[1,0,-1]", expectedOutput: "2" },
        { input: "[3,1,3,1,3,1,3]\n[-1,1,-1]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 8, 30, 80, 150]));
        const top = pick(rng, [1, 2, 3, 3, 100, 1000000000]);
        let nums: number[];
        if (rng() < 0.3) {
          const block = Array.from({ length: ri(rng, 1, 4) }, () => ri(rng, 1, top));
          nums = Array.from({ length: n }, (_, i) => block[i % block.length]);
        } else nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const m = ri(rng, 1, Math.min(n - 1, pick(rng, [1, 2, 3, 6, 20])));
        let pattern: number[];
        if (rng() < 0.7) {
          const st = ri(rng, 0, n - m - 1);
          pattern = Array.from({ length: m }, (_, k) => Math.sign(nums[st + k + 1] - nums[st + k]));
        } else pattern = Array.from({ length: m }, () => ri(rng, -1, 1));
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(pattern)}`, expectedOutput: String(ref(nums, pattern)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countMatchingSubarrays(nums: List[int], pattern: List[int]) -> int:
              m = len(pattern)
              fail = [0] * m
              j = 0
              for i in range(1, m):
                  while j and pattern[i] != pattern[j]:
                      j = fail[j - 1]
                  if pattern[i] == pattern[j]:
                      j += 1
                  fail[i] = j
              res = j = 0
              for i in range(len(nums) - 1):
                  a, b = nums[i], nums[i + 1]
                  s = (b > a) - (b < a)
                  while j and s != pattern[j]:
                      j = fail[j - 1]
                  if s == pattern[j]:
                      j += 1
                  if j == m:
                      res += 1
                      j = fail[j - 1]
              return res
        `,
        javascript: code`
          var countMatchingSubarrays = function(nums, pattern) {
              var m = pattern.length;
              var fail = new Array(m).fill(0);
              var j = 0;
              for (var i = 1; i < m; i++) {
                  while (j > 0 && pattern[i] !== pattern[j]) j = fail[j - 1];
                  if (pattern[i] === pattern[j]) j++;
                  fail[i] = j;
              }
              var res = 0;
              j = 0;
              for (var t = 0; t + 1 < nums.length; t++) {
                  var a = nums[t], b = nums[t + 1];
                  var s = b > a ? 1 : (b === a ? 0 : -1);
                  while (j > 0 && s !== pattern[j]) j = fail[j - 1];
                  if (s === pattern[j]) j++;
                  if (j === m) { res++; j = fail[j - 1]; }
              }
              return res;
          };
        `,
        typescript: code`
          function countMatchingSubarrays(nums: number[], pattern: number[]): number {
              var m = pattern.length;
              var fail: number[] = [];
              for (var q = 0; q < m; q++) fail.push(0);
              var j = 0;
              for (var i = 1; i < m; i++) {
                  while (j > 0 && pattern[i] !== pattern[j]) j = fail[j - 1];
                  if (pattern[i] === pattern[j]) j++;
                  fail[i] = j;
              }
              var res = 0;
              j = 0;
              for (var t = 0; t + 1 < nums.length; t++) {
                  var a = nums[t], b = nums[t + 1];
                  var s = b > a ? 1 : (b === a ? 0 : -1);
                  while (j > 0 && s !== pattern[j]) j = fail[j - 1];
                  if (s === pattern[j]) j++;
                  if (j === m) { res++; j = fail[j - 1]; }
              }
              return res;
          }
        `,
        java: code`
          public static int countMatchingSubarrays(int[] nums, int[] pattern) {
              int m = pattern.length;
              int[] fail = new int[m];
              int j = 0;
              for (int i = 1; i < m; i++) {
                  while (j > 0 && pattern[i] != pattern[j]) j = fail[j - 1];
                  if (pattern[i] == pattern[j]) j++;
                  fail[i] = j;
              }
              int res = 0;
              j = 0;
              for (int t = 0; t + 1 < nums.length; t++) {
                  int s = Integer.compare(nums[t + 1], nums[t]);
                  while (j > 0 && s != pattern[j]) j = fail[j - 1];
                  if (s == pattern[j]) j++;
                  if (j == m) { res++; j = fail[j - 1]; }
              }
              return res;
          }
        `,
        cpp: code`
          int countMatchingSubarrays(vector<int>& nums, vector<int>& pattern) {
              int m = pattern.size();
              vector<int> fail(m, 0);
              int j = 0;
              for (int i = 1; i < m; i++) {
                  while (j > 0 && pattern[i] != pattern[j]) j = fail[j - 1];
                  if (pattern[i] == pattern[j]) j++;
                  fail[i] = j;
              }
              int res = 0;
              j = 0;
              for (int t = 0; t + 1 < (int) nums.size(); t++) {
                  int s = (nums[t + 1] > nums[t]) - (nums[t + 1] < nums[t]);
                  while (j > 0 && s != pattern[j]) j = fail[j - 1];
                  if (s == pattern[j]) j++;
                  if (j == m) { res++; j = fail[j - 1]; }
              }
              return res;
          }
        `,
        c: code`
          int countMatchingSubarrays(int* nums, int numsSize, int* pattern, int patternSize) {
              int m = patternSize;
              int* fail = (int*) calloc((size_t) m, sizeof(int));
              int j = 0;
              for (int i = 1; i < m; i++) {
                  while (j > 0 && pattern[i] != pattern[j]) j = fail[j - 1];
                  if (pattern[i] == pattern[j]) j++;
                  fail[i] = j;
              }
              int res = 0;
              j = 0;
              for (int t = 0; t + 1 < numsSize; t++) {
                  int s = (nums[t + 1] > nums[t]) - (nums[t + 1] < nums[t]);
                  while (j > 0 && s != pattern[j]) j = fail[j - 1];
                  if (s == pattern[j]) j++;
                  if (j == m) { res++; j = fail[j - 1]; }
              }
              free(fail);
              return res;
          }
        `,
        csharp: code`
          public static int CountMatchingSubarrays(int[] nums, int[] pattern)
          {
              int m = pattern.Length;
              var fail = new int[m];
              int j = 0;
              for (int i = 1; i < m; i++)
              {
                  while (j > 0 && pattern[i] != pattern[j]) j = fail[j - 1];
                  if (pattern[i] == pattern[j]) j++;
                  fail[i] = j;
              }
              int res = 0;
              j = 0;
              for (int t = 0; t + 1 < nums.Length; t++)
              {
                  int s = nums[t + 1].CompareTo(nums[t]);
                  while (j > 0 && s != pattern[j]) j = fail[j - 1];
                  if (s == pattern[j]) j++;
                  if (j == m) { res++; j = fail[j - 1]; }
              }
              return res;
          }
        `,
        go: code`
          func countMatchingSubarrays(nums []int, pattern []int) int {
              m := len(pattern)
              fail := make([]int, m)
              j := 0
              for i := 1; i < m; i++ {
                  for j > 0 && pattern[i] != pattern[j] {
                      j = fail[j-1]
                  }
                  if pattern[i] == pattern[j] {
                      j++
                  }
                  fail[i] = j
              }
              res := 0
              j = 0
              for t := 0; t+1 < len(nums); t++ {
                  s := 0
                  if nums[t+1] > nums[t] {
                      s = 1
                  } else if nums[t+1] < nums[t] {
                      s = -1
                  }
                  for j > 0 && s != pattern[j] {
                      j = fail[j-1]
                  }
                  if s == pattern[j] {
                      j++
                  }
                  if j == m {
                      res++
                      j = fail[j-1]
                  }
              }
              return res
          }
        `,
        kotlin: code`
          fun countMatchingSubarrays(nums: IntArray, pattern: IntArray): Int {
              val m = pattern.size
              val fail = IntArray(m)
              var j = 0
              for (i in 1 until m) {
                  while (j > 0 && pattern[i] != pattern[j]) j = fail[j - 1]
                  if (pattern[i] == pattern[j]) j++
                  fail[i] = j
              }
              var res = 0
              j = 0
              for (t in 0 until nums.size - 1) {
                  val s = nums[t + 1].compareTo(nums[t]).coerceIn(-1, 1)
                  while (j > 0 && s != pattern[j]) j = fail[j - 1]
                  if (s == pattern[j]) j++
                  if (j == m) { res++; j = fail[j - 1] }
              }
              return res
          }
        `,
        swift: code`
          func countMatchingSubarrays(_ nums: [Int], _ pattern: [Int]) -> Int {
              let m = pattern.count
              var fail = [Int](repeating: 0, count: m)
              var j = 0
              var i = 1
              while i < m {
                  while j > 0 && pattern[i] != pattern[j] { j = fail[j - 1] }
                  if pattern[i] == pattern[j] { j += 1 }
                  fail[i] = j
                  i += 1
              }
              var res = 0
              j = 0
              var t = 0
              while t + 1 < nums.count {
                  let a = nums[t], b = nums[t + 1]
                  let s = b > a ? 1 : (b == a ? 0 : -1)
                  while j > 0 && s != pattern[j] { j = fail[j - 1] }
                  if s == pattern[j] { j += 1 }
                  if j == m { res += 1; j = fail[j - 1] }
                  t += 1
              }
              return res
          }
        `,
        rust: code`
          fn countMatchingSubarrays(nums: Vec<i32>, pattern: Vec<i32>) -> i32 {
              let m = pattern.len();
              let mut fail = vec![0usize; m];
              let mut j = 0usize;
              for i in 1..m {
                  while j > 0 && pattern[i] != pattern[j] {
                      j = fail[j - 1];
                  }
                  if pattern[i] == pattern[j] {
                      j += 1;
                  }
                  fail[i] = j;
              }
              let mut res = 0;
              j = 0;
              for t in 0..nums.len() - 1 {
                  let s = (nums[t + 1] > nums[t]) as i32 - (nums[t + 1] < nums[t]) as i32;
                  while j > 0 && s != pattern[j] {
                      j = fail[j - 1];
                  }
                  if s == pattern[j] {
                      j += 1;
                  }
                  if j == m {
                      res += 1;
                      j = fail[j - 1];
                  }
              }
              res
          }
        `,
        php: code`
          function countMatchingSubarrays($nums, $pattern) {
              $m = count($pattern);
              $fail = array_fill(0, $m, 0);
              $j = 0;
              for ($i = 1; $i < $m; $i++) {
                  while ($j > 0 && $pattern[$i] != $pattern[$j]) $j = $fail[$j - 1];
                  if ($pattern[$i] == $pattern[$j]) $j++;
                  $fail[$i] = $j;
              }
              $res = 0;
              $j = 0;
              $n = count($nums);
              for ($t = 0; $t + 1 < $n; $t++) {
                  $s = $nums[$t + 1] <=> $nums[$t];
                  while ($j > 0 && $s != $pattern[$j]) $j = $fail[$j - 1];
                  if ($s == $pattern[$j]) $j++;
                  if ($j == $m) { $res++; $j = $fail[$j - 1]; }
              }
              return $res;
          }
        `,
        ruby: code`
          def countMatchingSubarrays(nums, pattern)
            m = pattern.length
            fail = Array.new(m, 0)
            j = 0
            (1...m).each do |i|
              j = fail[j - 1] while j > 0 && pattern[i] != pattern[j]
              j += 1 if pattern[i] == pattern[j]
              fail[i] = j
            end
            res = 0
            j = 0
            (0...(nums.length - 1)).each do |t|
              s = nums[t + 1] <=> nums[t]
              j = fail[j - 1] while j > 0 && s != pattern[j]
              j += 1 if s == pattern[j]
              if j == m
                res += 1
                j = fail[j - 1]
              end
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Shortest Uncommon Substring in an Array (LC 3076) ───────────
  (() => {
    const ref = (arr: string[]): string[] => arr.map((s, i) => {
      for (let len = 1; len <= s.length; len++) {
        const cands: string[] = [];
        for (let st = 0; st + len <= s.length; st++) cands.push(s.slice(st, st + len));
        cands.sort();
        for (const t of cands) if (!arr.some((o, j) => j !== i && o.includes(t))) return t;
      }
      return "";
    });
    return {
      slug: "shortest-uncommon-substring-in-an-array",
      title: "Shortest Uncommon Substring in an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Trie", "Google"],
      signature: { funcName: "shortestSubstrings", params: [{ name: "arr", type: "string[]" as const }], returns: "string[]" as const },
      description: describe(
        "You are given an array `arr` of `n` non-empty strings of lowercase letters.\n\nBuild an array `answer` of size `n` where `answer[i]` is the **shortest** substring of `arr[i]` that does **not** occur as a substring of any other string in `arr`. If several substrings of that shortest length qualify, take the **lexicographically smallest** one. If no substring of `arr[i]` qualifies, `answer[i]` is the empty string.\n\nReturn `answer`.",
        [
          { in: 'arr = ["cab","ad","bad","c"]', out: '["ab","","ba",""]', note: "Every single letter of \"cab\" appears elsewhere; of its length-2 substrings \"ab\" and \"ca\", \"ab\" is unused elsewhere and smaller. Every substring of \"ad\" appears in \"bad\". For \"bad\", \"ba\" is the shortest unused one. \"c\" appears in \"cab\"." },
          { in: 'arr = ["abc","bcd","abcd"]', out: '["","","abcd"]', note: "Every substring of \"abc\" and of \"bcd\" occurs inside \"abcd\"; only \"abcd\" itself is unique to the third string." },
          { in: 'arr = ["zz","zz"]', out: '["",""]', note: "Two identical strings share every substring." },
        ],
        ["2 <= n == arr.length <= 100", "1 <= arr[i].length <= 20", "arr[i] consists only of lowercase English letters"]),
      hints: [
        "Each string has at most `20 * 21 / 2 = 210` substrings, so you can afford to try them all.",
        "Try lengths in increasing order; for a fixed length, consider the candidates in lexicographic order so the first one that works is the answer.",
        "A candidate works when no other string contains it. Remember to skip the string itself — and that a duplicate of `arr[i]` elsewhere blocks everything.",
      ],
      editorial: explain({
        idea: "The strings are tiny, so the answer can be found by direct search: try every substring of `arr[i]` from shortest to longest, lexicographically within a length, and stop at the first one no other string contains.",
        steps: [
          "For each index `i` and each length `len = 1 .. arr[i].length`:",
          "among the substrings of `arr[i]` of that length, keep the lexicographically smallest one that is not contained in any `arr[j]` with `j != i`;",
          "if one was found, that is `answer[i]` — move on to the next `i`.",
          "If no length produced one, `answer[i]` is `\"\"`.",
        ],
        why: "Lengths are tried in increasing order, so the first length with a qualifying substring is the shortest possible; within it the smallest qualifying candidate is chosen, which is exactly the tie-break the statement demands.",
        time: "O(n^2 * L^3) with L <= 20 (each of ~L^2 candidates checked against n strings in O(L^2))",
        space: "O(L)",
        pitfalls: [
          "Do not test the candidate against `arr[i]` itself — it always occurs there.",
          "Compare candidates only within the same length; the shortest length wins even if a longer substring is lexicographically smaller.",
          "Identical strings make each other's answers empty.",
        ],
      }),
      examples: [
        { input: '["cab","ad","bad","c"]', expectedOutput: '["ab","","ba",""]' },
        { input: '["abc","bcd","abcd"]', expectedOutput: '["","","abcd"]' },
        { input: '["zz","zz"]', expectedOutput: '["",""]' },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcd", "abcdefghijklmnopqrstuvwxyz"]);
        const n = ri(rng, 2, pick(rng, [2, 3, 5, 8, 12]));
        const maxLen = pick(rng, [2, 5, 10, 14, 20]);
        const arr: string[] = [];
        for (let i = 0; i < n; i++) {
          if (i > 0 && rng() < 0.15) {
            const src = pick(rng, arr);
            const a = ri(rng, 0, src.length - 1);
            arr.push(src.slice(a, ri(rng, a + 1, src.length)));
          } else arr.push(randLower(rng, 1, maxLen, alpha));
        }
        return { input: fmtStrArr(arr), expectedOutput: fmtStrArr(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def shortestSubstrings(arr: List[str]) -> List[str]:
              n = len(arr)
              res = []
              for i, s in enumerate(arr):
                  ans = ""
                  for length in range(1, len(s) + 1):
                      best = None
                      for st in range(len(s) - length + 1):
                          t = s[st:st + length]
                          if best is not None and t >= best:
                              continue
                          if all(j == i or t not in arr[j] for j in range(n)):
                              best = t
                      if best is not None:
                          ans = best
                          break
                  res.append(ans)
              return res
        `,
        javascript: code`
          var shortestSubstrings = function(arr) {
              var n = arr.length, res = [];
              for (var i = 0; i < n; i++) {
                  var s = arr[i], ans = "";
                  for (var len = 1; len <= s.length; len++) {
                      var best = null;
                      for (var st = 0; st + len <= s.length; st++) {
                          var t = s.substring(st, st + len);
                          if (best !== null && t >= best) continue;
                          var unique = true;
                          for (var j = 0; j < n; j++) {
                              if (j !== i && arr[j].indexOf(t) >= 0) { unique = false; break; }
                          }
                          if (unique) best = t;
                      }
                      if (best !== null) { ans = best; break; }
                  }
                  res.push(ans);
              }
              return res;
          };
        `,
        typescript: code`
          function shortestSubstrings(arr: string[]): string[] {
              var n = arr.length, res: string[] = [];
              for (var i = 0; i < n; i++) {
                  var s = arr[i], ans = "";
                  for (var len = 1; len <= s.length; len++) {
                      var best: string = null;
                      for (var st = 0; st + len <= s.length; st++) {
                          var t = s.substring(st, st + len);
                          if (best !== null && t >= best) continue;
                          var unique = true;
                          for (var j = 0; j < n; j++) {
                              if (j !== i && arr[j].indexOf(t) >= 0) { unique = false; break; }
                          }
                          if (unique) best = t;
                      }
                      if (best !== null) { ans = best; break; }
                  }
                  res.push(ans);
              }
              return res;
          }
        `,
        java: code`
          public static String[] shortestSubstrings(String[] arr) {
              int n = arr.length;
              String[] res = new String[n];
              for (int i = 0; i < n; i++) {
                  String s = arr[i], ans = "";
                  for (int len = 1; len <= s.length(); len++) {
                      String best = null;
                      for (int st = 0; st + len <= s.length(); st++) {
                          String t = s.substring(st, st + len);
                          if (best != null && t.compareTo(best) >= 0) continue;
                          boolean unique = true;
                          for (int j = 0; j < n; j++) {
                              if (j != i && arr[j].contains(t)) { unique = false; break; }
                          }
                          if (unique) best = t;
                      }
                      if (best != null) { ans = best; break; }
                  }
                  res[i] = ans;
              }
              return res;
          }
        `,
        cpp: code`
          vector<string> shortestSubstrings(vector<string>& arr) {
              int n = arr.size();
              vector<string> res(n);
              for (int i = 0; i < n; i++) {
                  const string& s = arr[i];
                  string ans;
                  for (int len = 1; len <= (int) s.size(); len++) {
                      string best;
                      bool found = false;
                      for (int st = 0; st + len <= (int) s.size(); st++) {
                          string t = s.substr(st, len);
                          if (found && t >= best) continue;
                          bool unique = true;
                          for (int j = 0; j < n; j++) {
                              if (j != i && arr[j].find(t) != string::npos) { unique = false; break; }
                          }
                          if (unique) { best = t; found = true; }
                      }
                      if (found) { ans = best; break; }
                  }
                  res[i] = ans;
              }
              return res;
          }
        `,
        c: code`
          char** shortestSubstrings(char** arr, int arrSize, int* returnSize) {
              char** res = (char**) malloc(sizeof(char*) * (arrSize + 1));
              char t[32], best[32];
              for (int i = 0; i < arrSize; i++) {
                  const char* s = arr[i];
                  int L = (int) strlen(s);
                  res[i] = (char*) calloc(L + 1, 1);
                  for (int len = 1; len <= L; len++) {
                      int found = 0;
                      for (int st = 0; st + len <= L; st++) {
                          memcpy(t, s + st, (size_t) len);
                          t[len] = '\0';
                          if (found && strcmp(t, best) >= 0) continue;
                          int unique = 1;
                          for (int j = 0; j < arrSize; j++) {
                              if (j != i && strstr(arr[j], t) != NULL) { unique = 0; break; }
                          }
                          if (unique) { strcpy(best, t); found = 1; }
                      }
                      if (found) { strcpy(res[i], best); break; }
                  }
              }
              *returnSize = arrSize;
              return res;
          }
        `,
        csharp: code`
          public static string[] ShortestSubstrings(string[] arr)
          {
              int n = arr.Length;
              var res = new string[n];
              for (int i = 0; i < n; i++)
              {
                  string s = arr[i], ans = "";
                  for (int len = 1; len <= s.Length; len++)
                  {
                      string best = null;
                      for (int st = 0; st + len <= s.Length; st++)
                      {
                          string t = s.Substring(st, len);
                          if (best != null && string.CompareOrdinal(t, best) >= 0) continue;
                          bool unique = true;
                          for (int j = 0; j < n; j++)
                          {
                              if (j != i && arr[j].Contains(t)) { unique = false; break; }
                          }
                          if (unique) best = t;
                      }
                      if (best != null) { ans = best; break; }
                  }
                  res[i] = ans;
              }
              return res;
          }
        `,
        go: code`
          func shortestSubstrings(arr []string) []string {
              n := len(arr)
              res := make([]string, n)
              for i, s := range arr {
                  ans := ""
                  for length := 1; length <= len(s); length++ {
                      best, found := "", false
                      for st := 0; st+length <= len(s); st++ {
                          t := s[st : st+length]
                          if found && t >= best {
                              continue
                          }
                          unique := true
                          for j := 0; j < n; j++ {
                              if j != i && strings.Contains(arr[j], t) {
                                  unique = false
                                  break
                              }
                          }
                          if unique {
                              best, found = t, true
                          }
                      }
                      if found {
                          ans = best
                          break
                      }
                  }
                  res[i] = ans
              }
              return res
          }
        `,
        kotlin: code`
          fun shortestSubstrings(arr: Array<String>): Array<String> {
              val n = arr.size
              return Array(n) { i ->
                  val s = arr[i]
                  var ans = ""
                  for (len in 1..s.length) {
                      var best: String? = null
                      for (st in 0..s.length - len) {
                          val t = s.substring(st, st + len)
                          if (best != null && t >= best) continue
                          var unique = true
                          for (j in 0 until n) {
                              if (j != i && arr[j].contains(t)) { unique = false; break }
                          }
                          if (unique) best = t
                      }
                      if (best != null) { ans = best; break }
                  }
                  ans
              }
          }
        `,
        swift: code`
          func shortestSubstrings(_ arr: [String]) -> [String] {
              let n = arr.count
              var res = [String]()
              for i in 0..<n {
                  let chars = Array(arr[i])
                  var ans = ""
                  if !chars.isEmpty {
                      for len in 1...chars.count {
                          var best: String? = nil
                          for st in 0...(chars.count - len) {
                              let t = String(chars[st..<(st + len)])
                              if let b = best, t >= b { continue }
                              var unique = true
                              for j in 0..<n where j != i {
                                  if arr[j].range(of: t) != nil { unique = false; break }
                              }
                              if unique { best = t }
                          }
                          if let b = best { ans = b; break }
                      }
                  }
                  res.append(ans)
              }
              return res
          }
        `,
        rust: code`
          fn shortestSubstrings(arr: Vec<String>) -> Vec<String> {
              let n = arr.len();
              let mut res = Vec::with_capacity(n);
              for i in 0..n {
                  let s = &arr[i];
                  let mut ans = String::new();
                  for len in 1..=s.len() {
                      let mut best: Option<&str> = None;
                      for st in 0..=(s.len() - len) {
                          let t = &s[st..st + len];
                          if let Some(b) = best {
                              if t >= b {
                                  continue;
                              }
                          }
                          let unique = (0..n).all(|j| j == i || !arr[j].contains(t));
                          if unique {
                              best = Some(t);
                          }
                      }
                      if let Some(b) = best {
                          ans = b.to_string();
                          break;
                      }
                  }
                  res.push(ans);
              }
              res
          }
        `,
        php: code`
          function shortestSubstrings($arr) {
              $n = count($arr);
              $res = [];
              for ($i = 0; $i < $n; $i++) {
                  $s = $arr[$i];
                  $L = strlen($s);
                  $ans = "";
                  for ($len = 1; $len <= $L; $len++) {
                      $best = null;
                      for ($st = 0; $st + $len <= $L; $st++) {
                          $t = substr($s, $st, $len);
                          if ($best !== null && strcmp($t, $best) >= 0) continue;
                          $unique = true;
                          for ($j = 0; $j < $n; $j++) {
                              if ($j != $i && strpos($arr[$j], $t) !== false) { $unique = false; break; }
                          }
                          if ($unique) $best = $t;
                      }
                      if ($best !== null) { $ans = $best; break; }
                  }
                  $res[] = $ans;
              }
              return $res;
          }
        `,
        ruby: code`
          def shortestSubstrings(arr)
            n = arr.length
            arr.each_with_index.map do |s, i|
              ans = ""
              (1..s.length).each do |len|
                best = nil
                (0..(s.length - len)).each do |st|
                  t = s[st, len]
                  next if best && t >= best
                  unique = (0...n).all? { |j| j == i || !arr[j].include?(t) }
                  best = t if unique
                end
                if best
                  ans = best
                  break
                end
              end
              ans
            end
          end
        `,
      },
    };
  })(),

  // ── Latest Time You Can Obtain After Replacing Characters (LC 3114) ─
  (() => {
    const ref = (s: string) => {
      for (let h = 11; h >= 0; h--) {
        for (let m = 59; m >= 0; m--) {
          const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          if (t.split("").every((c, i) => s[i] === "?" || s[i] === c)) return t;
        }
      }
      return "";
    };
    return {
      slug: "latest-time-you-can-obtain-after-replacing-characters",
      title: "Latest Time You Can Obtain After Replacing Characters",
      difficulty: "EASY" as const,
      tags: ["String", "Enumeration", "Amazon", "Microsoft"],
      signature: { funcName: "findLatestTime", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `s` describing a 12-hour clock reading in the format `\"HH:MM\"`, where some digits have been replaced by `'?'`. A valid reading has `HH` between `00` and `11` and `MM` between `00` and `59`; the earliest is `00:00` and the latest is `11:59`.\n\nReplace **every** `'?'` with a digit so that the result is a valid time and is as **late** as possible. Return the resulting string.\n\nThe input is guaranteed to allow at least one valid time.",
        [
          { in: 's = "1?:?4"', out: "11:54", note: "The hour can be at most 11, and with the last digit fixed at 4 the latest minute is 54." },
          { in: 's = "0?:5?"', out: "09:59", note: "An hour starting with 0 can reach 09." },
          { in: 's = "??:??"', out: "11:59" },
        ],
        ["s.length == 5", "s[2] == ':'", "every other character of s is a digit or '?'", "at least one valid time between 00:00 and 11:59 can be produced"]),
      hints: [
        "Fill the positions from left to right — a larger digit earlier always beats anything later.",
        "The first hour digit can be `1` only if the second hour digit is `?` or at most `1`; otherwise it must be `0`.",
        "The second hour digit is `1` after a `1`, else `9`. Minutes are simply `5` then `9`.",
      ],
      editorial: explain({
        idea: "Times compare like strings of the same shape, so the latest time is found greedily: give each `?` the largest digit that still leaves a valid time, from the most significant position to the least.",
        steps: [
          "If `s[0]` is `?`: it becomes `1` when `s[1]` is `?` or `<= '1'`, and `0` otherwise.",
          "If `s[1]` is `?`: it becomes `1` when `s[0]` is `1`, and `9` otherwise.",
          "If `s[3]` is `?` it becomes `5`; if `s[4]` is `?` it becomes `9`.",
        ],
        why: "Hour 1x is only valid for x in {0, 1}, so `s[0] = '1'` is possible exactly when `s[1]` allows 0 or 1, and it is always better than `0`. Given the first hour digit, the largest allowed second digit is `1` or `9`. The minutes are independent of the hour and are maximised by 59.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "\"?9:..\" must become \"09\" — a greedy `1` in front would make the invalid hour 19.",
          "This is a 12-hour clock: the latest hour is 11, not 23.",
        ],
      }),
      examples: [
        { input: '"1?:?4"', expectedOutput: "11:54" },
        { input: '"0?:5?"', expectedOutput: "09:59" },
        { input: '"??:??"', expectedOutput: "11:59" },
      ],
      gen: (rng: Rng) => {
        const h = ri(rng, 0, 11), m = ri(rng, 0, 59);
        const t = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`.split("");
        const p = pick(rng, [0.2, 0.5, 0.8]);
        for (const i of [0, 1, 3, 4]) if (rng() < p) t[i] = "?";
        const s = t.join("");
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: code`
          def findLatestTime(s: str) -> str:
              t = list(s)
              if t[0] == "?":
                  t[0] = "1" if t[1] == "?" or t[1] <= "1" else "0"
              if t[1] == "?":
                  t[1] = "1" if t[0] == "1" else "9"
              if t[3] == "?":
                  t[3] = "5"
              if t[4] == "?":
                  t[4] = "9"
              return "".join(t)
        `,
        javascript: code`
          var findLatestTime = function(s) {
              var t = s.split("");
              if (t[0] === "?") t[0] = (t[1] === "?" || t[1] <= "1") ? "1" : "0";
              if (t[1] === "?") t[1] = t[0] === "1" ? "1" : "9";
              if (t[3] === "?") t[3] = "5";
              if (t[4] === "?") t[4] = "9";
              return t.join("");
          };
        `,
        typescript: code`
          function findLatestTime(s: string): string {
              var t = s.split("");
              if (t[0] === "?") t[0] = (t[1] === "?" || t[1] <= "1") ? "1" : "0";
              if (t[1] === "?") t[1] = t[0] === "1" ? "1" : "9";
              if (t[3] === "?") t[3] = "5";
              if (t[4] === "?") t[4] = "9";
              return t.join("");
          }
        `,
        java: code`
          public static String findLatestTime(String s) {
              char[] t = s.toCharArray();
              if (t[0] == '?') t[0] = (t[1] == '?' || t[1] <= '1') ? '1' : '0';
              if (t[1] == '?') t[1] = t[0] == '1' ? '1' : '9';
              if (t[3] == '?') t[3] = '5';
              if (t[4] == '?') t[4] = '9';
              return new String(t);
          }
        `,
        cpp: code`
          string findLatestTime(string s) {
              if (s[0] == '?') s[0] = (s[1] == '?' || s[1] <= '1') ? '1' : '0';
              if (s[1] == '?') s[1] = s[0] == '1' ? '1' : '9';
              if (s[3] == '?') s[3] = '5';
              if (s[4] == '?') s[4] = '9';
              return s;
          }
        `,
        c: code`
          char* findLatestTime(const char* s) {
              char* t = (char*) malloc(6);
              memcpy(t, s, 5);
              t[5] = '\0';
              if (t[0] == '?') t[0] = (t[1] == '?' || t[1] <= '1') ? '1' : '0';
              if (t[1] == '?') t[1] = t[0] == '1' ? '1' : '9';
              if (t[3] == '?') t[3] = '5';
              if (t[4] == '?') t[4] = '9';
              return t;
          }
        `,
        csharp: code`
          public static string FindLatestTime(string s)
          {
              char[] t = s.ToCharArray();
              if (t[0] == '?') t[0] = (t[1] == '?' || t[1] <= '1') ? '1' : '0';
              if (t[1] == '?') t[1] = t[0] == '1' ? '1' : '9';
              if (t[3] == '?') t[3] = '5';
              if (t[4] == '?') t[4] = '9';
              return new string(t);
          }
        `,
        go: code`
          func findLatestTime(s string) string {
              t := []byte(s)
              if t[0] == '?' {
                  if t[1] == '?' || t[1] <= '1' {
                      t[0] = '1'
                  } else {
                      t[0] = '0'
                  }
              }
              if t[1] == '?' {
                  if t[0] == '1' {
                      t[1] = '1'
                  } else {
                      t[1] = '9'
                  }
              }
              if t[3] == '?' {
                  t[3] = '5'
              }
              if t[4] == '?' {
                  t[4] = '9'
              }
              return string(t)
          }
        `,
        kotlin: code`
          fun findLatestTime(s: String): String {
              val t = s.toCharArray()
              if (t[0] == '?') t[0] = if (t[1] == '?' || t[1] <= '1') '1' else '0'
              if (t[1] == '?') t[1] = if (t[0] == '1') '1' else '9'
              if (t[3] == '?') t[3] = '5'
              if (t[4] == '?') t[4] = '9'
              return String(t)
          }
        `,
        swift: code`
          func findLatestTime(_ s: String) -> String {
              var t = Array(s)
              if t[0] == "?" { t[0] = (t[1] == "?" || t[1] <= "1") ? "1" : "0" }
              if t[1] == "?" { t[1] = t[0] == "1" ? "1" : "9" }
              if t[3] == "?" { t[3] = "5" }
              if t[4] == "?" { t[4] = "9" }
              return String(t)
          }
        `,
        rust: code`
          fn findLatestTime(s: String) -> String {
              let mut t: Vec<u8> = s.into_bytes();
              if t[0] == b'?' {
                  t[0] = if t[1] == b'?' || t[1] <= b'1' { b'1' } else { b'0' };
              }
              if t[1] == b'?' {
                  t[1] = if t[0] == b'1' { b'1' } else { b'9' };
              }
              if t[3] == b'?' {
                  t[3] = b'5';
              }
              if t[4] == b'?' {
                  t[4] = b'9';
              }
              String::from_utf8(t).unwrap()
          }
        `,
        php: code`
          function findLatestTime($s) {
              if ($s[0] === '?') $s[0] = ($s[1] === '?' || $s[1] <= '1') ? '1' : '0';
              if ($s[1] === '?') $s[1] = $s[0] === '1' ? '1' : '9';
              if ($s[3] === '?') $s[3] = '5';
              if ($s[4] === '?') $s[4] = '9';
              return $s;
          }
        `,
        ruby: code`
          def findLatestTime(s)
            t = s.dup
            t[0] = (t[1] == "?" || t[1] <= "1") ? "1" : "0" if t[0] == "?"
            t[1] = t[0] == "1" ? "1" : "9" if t[1] == "?"
            t[3] = "5" if t[3] == "?"
            t[4] = "9" if t[4] == "?"
            t
          end
        `,
      },
    };
  })(),

  // ── Valid Word (LC 3136) ────────────────────────────────────────
  (() => {
    const ref = (word: string) => {
      if (word.length < 3) return false;
      if (!/^[A-Za-z0-9]+$/.test(word)) return false;
      return /[aeiouAEIOU]/.test(word) && /[b-df-hj-np-tv-zB-DF-HJ-NP-TV-Z]/.test(word);
    };
    return {
      slug: "valid-word",
      title: "Valid Word",
      difficulty: "EASY" as const,
      tags: ["String", "Amazon", "Google"],
      signature: { funcName: "isValid", params: [{ name: "word", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A word is **valid** when all of the following hold:\n\n- it has at least `3` characters;\n- it contains only digits `0`–`9` and English letters (uppercase or lowercase);\n- it contains at least one **vowel** (`a`, `e`, `i`, `o`, `u` in either case);\n- it contains at least one **consonant** (any English letter that is not a vowel).\n\nGiven a string `word`, return `true` if it is valid, otherwise `false`.",
        [
          { in: 'word = "234Adas"', out: "true", note: "Seven characters, only digits and letters, with vowel 'A' and consonant 'd'." },
          { in: 'word = "b3"', out: "false", note: "Fewer than three characters, and no vowel." },
          { in: 'word = "a3$e"', out: "false", note: "'$' is neither a digit nor a letter." },
        ],
        ["1 <= word.length <= 20", "word consists of English uppercase and lowercase letters, digits, '@', '#' and '$'"]),
      hints: [
        "Check the length first; then look at every character once.",
        "A character that is neither a letter nor a digit makes the word invalid immediately.",
        "Track two flags — saw a vowel, saw a consonant — and lowercase a letter before testing whether it is a vowel. Digits set neither flag.",
      ],
      editorial: explain({
        idea: "Each rule is a property of single characters or of the length, so one pass with two flags checks them all.",
        steps: [
          "If `word.length < 3`, return `false`.",
          "For each character: if it is a letter, set `vowel` when its lowercase form is in `aeiou`, otherwise set `consonant`; if it is a digit, do nothing; otherwise return `false`.",
          "Return `vowel && consonant`.",
        ],
        why: "The pass rejects any forbidden character, and after it the two flags say exactly whether a vowel and a consonant occurred, which with the length check covers all four rules.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Uppercase vowels count as vowels: \"AbC\" is valid.",
          "Digits are allowed but are not consonants — \"a12\" has no consonant.",
          "Testing for 'not a vowel' without first checking it is a letter would count digits or symbols as consonants.",
        ],
      }),
      examples: [
        { input: '"234Adas"', expectedOutput: "true" },
        { input: '"b3"', expectedOutput: "false" },
        { input: '"a3$e"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, [
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
          "aeiouAEIOU0123456789",
          "bcdBCD0123456789",
          "aEb7",
          "aEb7@#$",
          "abcXYZ0129@",
          "0123456789",
        ]);
        const word = randLower(rng, 1, pick(rng, [2, 3, 5, 10, 20]), alpha);
        return { input: `"${word}"`, expectedOutput: bool(ref(word)) };
      },
      solutions: {
        python: code`
          def isValid(word: str) -> bool:
              if len(word) < 3:
                  return False
              vowel = consonant = False
              for c in word:
                  if "a" <= c <= "z" or "A" <= c <= "Z":
                      if c in "aeiouAEIOU":
                          vowel = True
                      else:
                          consonant = True
                  elif not ("0" <= c <= "9"):
                      return False
              return vowel and consonant
        `,
        javascript: code`
          var isValid = function(word) {
              if (word.length < 3) return false;
              var vowel = false, consonant = false;
              for (var i = 0; i < word.length; i++) {
                  var c = word[i];
                  if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z")) {
                      if ("aeiouAEIOU".indexOf(c) >= 0) vowel = true;
                      else consonant = true;
                  } else if (!(c >= "0" && c <= "9")) {
                      return false;
                  }
              }
              return vowel && consonant;
          };
        `,
        typescript: code`
          function isValid(word: string): boolean {
              if (word.length < 3) return false;
              var vowel = false, consonant = false;
              for (var i = 0; i < word.length; i++) {
                  var c = word[i];
                  if ((c >= "a" && c <= "z") || (c >= "A" && c <= "Z")) {
                      if ("aeiouAEIOU".indexOf(c) >= 0) vowel = true;
                      else consonant = true;
                  } else if (!(c >= "0" && c <= "9")) {
                      return false;
                  }
              }
              return vowel && consonant;
          }
        `,
        java: code`
          public static boolean isValid(String word) {
              if (word.length() < 3) return false;
              boolean vowel = false, consonant = false;
              for (char c : word.toCharArray()) {
                  if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
                      if ("aeiouAEIOU".indexOf(c) >= 0) vowel = true;
                      else consonant = true;
                  } else if (!(c >= '0' && c <= '9')) {
                      return false;
                  }
              }
              return vowel && consonant;
          }
        `,
        cpp: code`
          bool isValid(string word) {
              if (word.size() < 3) return false;
              bool vowel = false, consonant = false;
              for (char c : word) {
                  if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
                      char l = (char) tolower(c);
                      if (l == 'a' || l == 'e' || l == 'i' || l == 'o' || l == 'u') vowel = true;
                      else consonant = true;
                  } else if (!(c >= '0' && c <= '9')) {
                      return false;
                  }
              }
              return vowel && consonant;
          }
        `,
        c: code`
          bool isValid(const char* word) {
              int n = (int) strlen(word);
              if (n < 3) return false;
              bool vowel = false, consonant = false;
              for (int i = 0; i < n; i++) {
                  char c = word[i];
                  if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
                      char l = (c >= 'A' && c <= 'Z') ? (char) (c - 'A' + 'a') : c;
                      if (l == 'a' || l == 'e' || l == 'i' || l == 'o' || l == 'u') vowel = true;
                      else consonant = true;
                  } else if (!(c >= '0' && c <= '9')) {
                      return false;
                  }
              }
              return vowel && consonant;
          }
        `,
        csharp: code`
          public static bool IsValid(string word)
          {
              if (word.Length < 3) return false;
              bool vowel = false, consonant = false;
              foreach (char c in word)
              {
                  if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z'))
                  {
                      if ("aeiouAEIOU".IndexOf(c) >= 0) vowel = true;
                      else consonant = true;
                  }
                  else if (!(c >= '0' && c <= '9'))
                  {
                      return false;
                  }
              }
              return vowel && consonant;
          }
        `,
        go: code`
          func isValid(word string) bool {
              if len(word) < 3 {
                  return false
              }
              vowel, consonant := false, false
              for i := 0; i < len(word); i++ {
                  c := word[i]
                  if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') {
                      l := c | 32
                      if l == 'a' || l == 'e' || l == 'i' || l == 'o' || l == 'u' {
                          vowel = true
                      } else {
                          consonant = true
                      }
                  } else if !(c >= '0' && c <= '9') {
                      return false
                  }
              }
              return vowel && consonant
          }
        `,
        kotlin: code`
          fun isValid(word: String): Boolean {
              if (word.length < 3) return false
              var vowel = false
              var consonant = false
              for (c in word) {
                  if (c in 'a'..'z' || c in 'A'..'Z') {
                      if ("aeiouAEIOU".indexOf(c) >= 0) vowel = true else consonant = true
                  } else if (c !in '0'..'9') {
                      return false
                  }
              }
              return vowel && consonant
          }
        `,
        swift: code`
          func isValid(_ word: String) -> Bool {
              let a = Array(word.utf8)
              if a.count < 3 { return false }
              var vowel = false, consonant = false
              for c in a {
                  if (c >= 97 && c <= 122) || (c >= 65 && c <= 90) {
                      let l = c | 32
                      if l == 97 || l == 101 || l == 105 || l == 111 || l == 117 { vowel = true } else { consonant = true }
                  } else if !(c >= 48 && c <= 57) {
                      return false
                  }
              }
              return vowel && consonant
          }
        `,
        rust: code`
          fn isValid(word: String) -> bool {
              if word.len() < 3 {
                  return false;
              }
              let (mut vowel, mut consonant) = (false, false);
              for c in word.bytes() {
                  if c.is_ascii_alphabetic() {
                      match c.to_ascii_lowercase() {
                          b'a' | b'e' | b'i' | b'o' | b'u' => vowel = true,
                          _ => consonant = true,
                      }
                  } else if !c.is_ascii_digit() {
                      return false;
                  }
              }
              vowel && consonant
          }
        `,
        php: code`
          function isValid($word) {
              $n = strlen($word);
              if ($n < 3) return false;
              $vowel = false;
              $consonant = false;
              for ($i = 0; $i < $n; $i++) {
                  $c = $word[$i];
                  if (ctype_alpha($c)) {
                      if (strpos("aeiou", strtolower($c)) !== false) $vowel = true;
                      else $consonant = true;
                  } elseif (!ctype_digit($c)) {
                      return false;
                  }
              }
              return $vowel && $consonant;
          }
        `,
        ruby: code`
          def isValid(word)
            return false if word.length < 3
            vowel = false
            consonant = false
            word.each_char do |c|
              if c =~ /[A-Za-z]/
                if "aeiou".include?(c.downcase)
                  vowel = true
                else
                  consonant = true
                end
              elsif c !~ /[0-9]/
                return false
              end
            end
            vowel && consonant
          end
        `,
      },
    };
  })(),

  // ── String Compression III (LC 3163) ────────────────────────────
  (() => {
    const ref = (word: string) => {
      let out = "";
      let i = 0;
      while (i < word.length) {
        let j = i;
        while (j < word.length && j - i < 9 && word[j] === word[i]) j++;
        out += String(j - i) + word[i];
        i = j;
      }
      return out;
    };
    return {
      slug: "string-compression-iii",
      title: "String Compression III",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "compressedString", params: [{ name: "word", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given a string `word`, compress it with the following procedure. Start with an empty string `comp`. While `word` is not empty:\n\n- remove the **longest** prefix of `word` that consists of a single character `c` repeated **at most 9 times**;\n- append the length of that prefix (a single digit) followed by `c` to `comp`.\n\nReturn `comp`.",
        [
          { in: 'word = "abcde"', out: "1a1b1c1d1e", note: "Every prefix is a single letter." },
          { in: 'word = "aaaaaaaaaaaaaabb"', out: "9a5a2b", note: "Fourteen a's are cut into a block of 9 and a block of 5, then the two b's." },
          { in: 'word = "z"', out: "1z" },
        ],
        ["1 <= word.length <= 2 * 10^5", "word consists only of lowercase English letters"]),
      hints: [
        "Walk the string once, measuring the run of equal characters that starts at the current position.",
        "Cap each run at 9 characters: a longer run is emitted as several blocks.",
        "Append the count and the character for each block; use a string builder so the output is built in linear time.",
      ],
      editorial: explain({
        idea: "The procedure is a run-length encoding whose counts are capped at a single digit, so a single left-to-right scan that cuts runs at 9 produces the answer.",
        steps: [
          "Set `i = 0`.",
          "Advance `j` from `i` while `j < n`, `j - i < 9` and `word[j] == word[i]`.",
          "Append the digit `j - i` and the character `word[i]`; set `i = j` and repeat until `i == n`.",
        ],
        why: "At each step the removed prefix is the longest run of one character of length at most 9 — exactly what the loop measures — and the remainder is processed the same way, so the output is the procedure's output.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "A run of 10 or more equal characters must be split: \"aaaaaaaaaa\" is \"9a1a\", not \"10a\".",
          "Repeated string concatenation is quadratic in some languages; use a builder.",
        ],
      }),
      examples: [
        { input: '"abcde"', expectedOutput: "1a1b1c1d1e" },
        { input: '"aaaaaaaaaaaaaabb"', expectedOutput: "9a5a2b" },
        { input: '"z"', expectedOutput: "1z" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const target = ri(rng, 1, pick(rng, [1, 5, 20, 60]));
        let w = "";
        while (w.length < target) w += pick(rng, alpha.split("")).repeat(ri(rng, 1, pick(rng, [1, 3, 9, 10, 25])));
        w = w.slice(0, target);
        return { input: `"${w}"`, expectedOutput: ref(w) };
      },
      solutions: {
        python: code`
          def compressedString(word: str) -> str:
              parts = []
              n, i = len(word), 0
              while i < n:
                  j = i
                  while j < n and j - i < 9 and word[j] == word[i]:
                      j += 1
                  parts.append(str(j - i))
                  parts.append(word[i])
                  i = j
              return "".join(parts)
        `,
        javascript: code`
          var compressedString = function(word) {
              var parts = [], n = word.length, i = 0;
              while (i < n) {
                  var j = i;
                  while (j < n && j - i < 9 && word[j] === word[i]) j++;
                  parts.push(String(j - i), word[i]);
                  i = j;
              }
              return parts.join("");
          };
        `,
        typescript: code`
          function compressedString(word: string): string {
              var parts: string[] = [], n = word.length, i = 0;
              while (i < n) {
                  var j = i;
                  while (j < n && j - i < 9 && word[j] === word[i]) j++;
                  parts.push(String(j - i), word[i]);
                  i = j;
              }
              return parts.join("");
          }
        `,
        java: code`
          public static String compressedString(String word) {
              StringBuilder sb = new StringBuilder();
              int n = word.length(), i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && j - i < 9 && word.charAt(j) == word.charAt(i)) j++;
                  sb.append(j - i).append(word.charAt(i));
                  i = j;
              }
              return sb.toString();
          }
        `,
        cpp: code`
          string compressedString(string word) {
              string out;
              int n = word.size(), i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && j - i < 9 && word[j] == word[i]) j++;
                  out += (char) ('0' + (j - i));
                  out += word[i];
                  i = j;
              }
              return out;
          }
        `,
        c: code`
          char* compressedString(const char* word) {
              int n = (int) strlen(word);
              char* out = (char*) malloc((size_t) 2 * n + 1);
              int p = 0, i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && j - i < 9 && word[j] == word[i]) j++;
                  out[p++] = (char) ('0' + (j - i));
                  out[p++] = word[i];
                  i = j;
              }
              out[p] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string CompressedString(string word)
          {
              var sb = new System.Text.StringBuilder();
              int n = word.Length, i = 0;
              while (i < n)
              {
                  int j = i;
                  while (j < n && j - i < 9 && word[j] == word[i]) j++;
                  sb.Append(j - i).Append(word[i]);
                  i = j;
              }
              return sb.ToString();
          }
        `,
        go: code`
          func compressedString(word string) string {
              var sb strings.Builder
              n, i := len(word), 0
              for i < n {
                  j := i
                  for j < n && j-i < 9 && word[j] == word[i] {
                      j++
                  }
                  sb.WriteByte(byte('0' + (j - i)))
                  sb.WriteByte(word[i])
                  i = j
              }
              return sb.String()
          }
        `,
        kotlin: code`
          fun compressedString(word: String): String {
              val sb = StringBuilder()
              val n = word.length
              var i = 0
              while (i < n) {
                  var j = i
                  while (j < n && j - i < 9 && word[j] == word[i]) j++
                  sb.append(j - i).append(word[i])
                  i = j
              }
              return sb.toString()
          }
        `,
        swift: code`
          func compressedString(_ word: String) -> String {
              let a = Array(word.utf8)
              let n = a.count
              var out = [UInt8]()
              out.reserveCapacity(2 * n)
              var i = 0
              while i < n {
                  var j = i
                  while j < n && j - i < 9 && a[j] == a[i] { j += 1 }
                  out.append(UInt8(48 + j - i))
                  out.append(a[i])
                  i = j
              }
              return String(decoding: out, as: UTF8.self)
          }
        `,
        rust: code`
          fn compressedString(word: String) -> String {
              let a = word.as_bytes();
              let n = a.len();
              let mut out: Vec<u8> = Vec::with_capacity(2 * n);
              let mut i = 0;
              while i < n {
                  let mut j = i;
                  while j < n && j - i < 9 && a[j] == a[i] {
                      j += 1;
                  }
                  out.push(b'0' + (j - i) as u8);
                  out.push(a[i]);
                  i = j;
              }
              String::from_utf8(out).unwrap()
          }
        `,
        php: code`
          function compressedString($word) {
              $n = strlen($word);
              $out = "";
              $i = 0;
              while ($i < $n) {
                  $j = $i;
                  while ($j < $n && $j - $i < 9 && $word[$j] === $word[$i]) $j++;
                  $out .= ($j - $i) . $word[$i];
                  $i = $j;
              }
              return $out;
          }
        `,
        ruby: code`
          def compressedString(word)
            out = String.new
            n = word.length
            i = 0
            while i < n
              j = i
              j += 1 while j < n && j - i < 9 && word[j] == word[i]
              out << (j - i).to_s << word[i]
              i = j
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Hash Divided String (LC 3271) ───────────────────────────────
  (() => {
    const ref = (s: string, k: number) => {
      let out = "";
      for (let i = 0; i < s.length; i += k) {
        let sum = 0;
        for (let j = i; j < i + k; j++) sum += s.charCodeAt(j) - 97;
        out += String.fromCharCode(97 + (sum % 26));
      }
      return out;
    };
    return {
      slug: "hash-divided-string",
      title: "Hash Divided String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Simulation", "Google"],
      signature: { funcName: "stringHash", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `s` of length `n` and an integer `k`, where `n` is a multiple of `k`.\n\nCut `s` into `n / k` consecutive pieces of length `k`. For each piece, in order:\n\n- give every letter its **hash value** — its index in the alphabet (`'a'` is 0, `'b'` is 1, …, `'z'` is 25);\n- add the hash values of the piece and take the sum modulo 26;\n- append the letter with that index to the result.\n\nReturn the resulting string of length `n / k`.",
        [
          { in: 's = "abcd", k = 2', out: "bf", note: "\"ab\" sums to 0 + 1 = 1 → 'b'; \"cd\" sums to 2 + 3 = 5 → 'f'." },
          { in: 's = "mxz", k = 3', out: "i", note: "12 + 23 + 25 = 60, and 60 mod 26 = 8 → 'i'." },
          { in: 's = "zzab", k = 1', out: "zzab", note: "With pieces of one letter each, every letter maps to itself." },
        ],
        ["1 <= k <= 100", "k <= s.length <= 1000", "s.length % k == 0", "s consists only of lowercase English letters"]),
      hints: [
        "The pieces are independent: process `s` in steps of `k`.",
        "Sum `s[j] - 'a'` over the piece; the largest possible sum is `100 * 25`, far from overflowing.",
        "Reduce the sum modulo 26 and turn it back into a letter with `'a' + value`.",
      ],
      editorial: explain({
        idea: "A direct simulation: each output letter depends only on its own block of `k` input letters.",
        steps: [
          "For `i = 0, k, 2k, …`: sum `s[j] - 'a'` for `j` in `[i, i + k)`.",
          "Append the letter `'a' + (sum mod 26)`.",
          "Return the built string.",
        ],
        why: "The statement defines each output character from one block, and the loop visits the blocks in order exactly once.",
        time: "O(n)",
        space: "O(n / k) for the output",
        pitfalls: [
          "Use the letter's index (`'a'` = 0), not its character code, before taking the modulus.",
        ],
      }),
      examples: [
        { input: '"abcd"\n2', expectedOutput: "bf" },
        { input: '"mxz"\n3', expectedOutput: "i" },
        { input: '"zzab"\n1', expectedOutput: "zzab" },
      ],
      gen: (rng: Rng) => {
        const k = pick(rng, [1, 2, 3, ri(rng, 1, 10), ri(rng, 1, 100)]);
        const blocks = ri(rng, 1, Math.max(1, Math.min(pick(rng, [1, 4, 12]), Math.floor(300 / k))));
        const alpha = pick(rng, ["z", "yz", "abcdefghijklmnopqrstuvwxyz"]);
        const s = randLower(rng, k * blocks, k * blocks, alpha);
        return { input: `"${s}"\n${k}`, expectedOutput: ref(s, k) };
      },
      solutions: {
        python: code`
          def stringHash(s: str, k: int) -> str:
              out = []
              for i in range(0, len(s), k):
                  total = sum(ord(c) - 97 for c in s[i:i + k])
                  out.append(chr(97 + total % 26))
              return "".join(out)
        `,
        javascript: code`
          var stringHash = function(s, k) {
              var out = [];
              for (var i = 0; i < s.length; i += k) {
                  var sum = 0;
                  for (var j = i; j < i + k; j++) sum += s.charCodeAt(j) - 97;
                  out.push(String.fromCharCode(97 + sum % 26));
              }
              return out.join("");
          };
        `,
        typescript: code`
          function stringHash(s: string, k: number): string {
              var out: string[] = [];
              for (var i = 0; i < s.length; i += k) {
                  var sum = 0;
                  for (var j = i; j < i + k; j++) sum += s.charCodeAt(j) - 97;
                  out.push(String.fromCharCode(97 + sum % 26));
              }
              return out.join("");
          }
        `,
        java: code`
          public static String stringHash(String s, int k) {
              StringBuilder sb = new StringBuilder();
              for (int i = 0; i < s.length(); i += k) {
                  int sum = 0;
                  for (int j = i; j < i + k; j++) sum += s.charAt(j) - 'a';
                  sb.append((char) ('a' + sum % 26));
              }
              return sb.toString();
          }
        `,
        cpp: code`
          string stringHash(string s, int k) {
              string out;
              for (int i = 0; i < (int) s.size(); i += k) {
                  int sum = 0;
                  for (int j = i; j < i + k; j++) sum += s[j] - 'a';
                  out += (char) ('a' + sum % 26);
              }
              return out;
          }
        `,
        c: code`
          char* stringHash(const char* s, int k) {
              int n = (int) strlen(s);
              char* out = (char*) malloc((size_t) n / k + 1);
              int p = 0;
              for (int i = 0; i < n; i += k) {
                  int sum = 0;
                  for (int j = i; j < i + k; j++) sum += s[j] - 'a';
                  out[p++] = (char) ('a' + sum % 26);
              }
              out[p] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string StringHash(string s, int k)
          {
              var sb = new System.Text.StringBuilder();
              for (int i = 0; i < s.Length; i += k)
              {
                  int sum = 0;
                  for (int j = i; j < i + k; j++) sum += s[j] - 'a';
                  sb.Append((char) ('a' + sum % 26));
              }
              return sb.ToString();
          }
        `,
        go: code`
          func stringHash(s string, k int) string {
              out := make([]byte, 0, len(s)/k)
              for i := 0; i < len(s); i += k {
                  sum := 0
                  for j := i; j < i+k; j++ {
                      sum += int(s[j] - 'a')
                  }
                  out = append(out, byte('a'+sum%26))
              }
              return string(out)
          }
        `,
        kotlin: code`
          fun stringHash(s: String, k: Int): String {
              val sb = StringBuilder()
              var i = 0
              while (i < s.length) {
                  var sum = 0
                  for (j in i until i + k) sum += s[j] - 'a'
                  sb.append('a' + sum % 26)
                  i += k
              }
              return sb.toString()
          }
        `,
        swift: code`
          func stringHash(_ s: String, _ k: Int) -> String {
              let a = Array(s.utf8)
              var out = [UInt8]()
              var i = 0
              while i < a.count {
                  var sum = 0
                  for j in i..<(i + k) { sum += Int(a[j]) - 97 }
                  out.append(UInt8(97 + sum % 26))
                  i += k
              }
              return String(decoding: out, as: UTF8.self)
          }
        `,
        rust: code`
          fn stringHash(s: String, k: i32) -> String {
              let a = s.as_bytes();
              let k = k as usize;
              let mut out: Vec<u8> = Vec::new();
              let mut i = 0;
              while i < a.len() {
                  let sum: usize = a[i..i + k].iter().map(|&c| (c - b'a') as usize).sum();
                  out.push(b'a' + (sum % 26) as u8);
                  i += k;
              }
              String::from_utf8(out).unwrap()
          }
        `,
        php: code`
          function stringHash($s, $k) {
              $n = strlen($s);
              $out = "";
              for ($i = 0; $i < $n; $i += $k) {
                  $sum = 0;
                  for ($j = $i; $j < $i + $k; $j++) $sum += ord($s[$j]) - 97;
                  $out .= chr(97 + $sum % 26);
              }
              return $out;
          }
        `,
        ruby: code`
          def stringHash(s, k)
            out = String.new
            s.bytes.each_slice(k) do |piece|
              out << (97 + piece.sum { |c| c - 97 } % 26).chr
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Convert Date to Binary (LC 3280) ────────────────────────────
  (() => {
    const ref = (date: string) => date.split("-").map((p) => parseInt(p, 10).toString(2)).join("-");
    const daysIn = (y: number, m: number) => {
      if (m === 2) return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28;
      return [4, 6, 9, 11].includes(m) ? 30 : 31;
    };
    const pad = (v: number, w: number) => String(v).padStart(w, "0");
    return {
      slug: "convert-date-to-binary",
      title: "Convert Date to Binary",
      difficulty: "EASY" as const,
      tags: ["Math", "String", "Microsoft"],
      signature: { funcName: "convertDateToBinary", params: [{ name: "date", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `date` in the format `yyyy-mm-dd` (a valid Gregorian date).\n\nWrite the year, the month and the day each in **binary**, without leading zeros, and join them with `-` in the same order: `year-month-day`.\n\nReturn that string.",
        [
          { in: 'date = "2080-02-29"', out: "100000100000-10-11101", note: "2080, 2 and 29 in binary are 100000100000, 10 and 11101." },
          { in: 'date = "1900-01-01"', out: "11101101100-1-1", note: "Leading zeros of \"01\" disappear: 1 is just 1 in binary." },
          { in: 'date = "2024-12-31"', out: "11111101000-1100-11111" },
        ],
        ["date.length == 10", "date[4] == date[7] == '-'", "every other character of date is a digit", "date is a valid date between 1900-01-01 and 2100-12-31"]),
      hints: [
        "Split the string on `-` into three decimal numbers.",
        "Convert each number to binary — most languages have a built-in, or repeatedly take `n % 2` and divide by 2.",
        "Parsing the number first removes the leading zeros of `\"01\"`; join the three binary strings with `-`.",
      ],
      editorial: explain({
        idea: "The date's three fields are independent numbers; converting each to base 2 and joining them is the whole task.",
        steps: [
          "Parse `year = date[0..4)`, `month = date[5..7)`, `day = date[8..10)` as integers.",
          "Write each in binary with no leading zeros (collect `n % 2` while `n > 0`, then reverse).",
          "Return `bin(year) + \"-\" + bin(month) + \"-\" + bin(day)`.",
        ],
        why: "Every field is at least 1, so its binary form is non-empty, and converting the parsed integer guarantees there are no leading zeros.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Converting the text \"01\" digit by digit would keep a leading zero; parse it as a number first.",
        ],
      }),
      examples: [
        { input: '"2080-02-29"', expectedOutput: "100000100000-10-11101" },
        { input: '"1900-01-01"', expectedOutput: "11101101100-1-1" },
        { input: '"2024-12-31"', expectedOutput: "11111101000-1100-11111" },
      ],
      gen: (rng: Rng) => {
        const y = pick(rng, [1900, 2000, 2100, ri(rng, 1900, 2100), ri(rng, 1900, 2100)]);
        const m = ri(rng, 1, 12);
        const d = rng() < 0.3 ? daysIn(y, m) : ri(rng, 1, daysIn(y, m));
        const date = `${pad(y, 4)}-${pad(m, 2)}-${pad(d, 2)}`;
        return { input: `"${date}"`, expectedOutput: ref(date) };
      },
      solutions: {
        python: code`
          def convertDateToBinary(date: str) -> str:
              return "-".join(bin(int(part))[2:] for part in date.split("-"))
        `,
        javascript: code`
          var convertDateToBinary = function(date) {
              return date.split("-").map(function(p) { return parseInt(p, 10).toString(2); }).join("-");
          };
        `,
        typescript: code`
          function convertDateToBinary(date: string): string {
              return date.split("-").map(function(p) { return parseInt(p, 10).toString(2); }).join("-");
          }
        `,
        java: code`
          public static String convertDateToBinary(String date) {
              String[] parts = date.split("-");
              StringBuilder sb = new StringBuilder();
              for (int i = 0; i < parts.length; i++) {
                  if (i > 0) sb.append('-');
                  sb.append(Integer.toBinaryString(Integer.parseInt(parts[i])));
              }
              return sb.toString();
          }
        `,
        cpp: code`
          string convertDateToBinary(string date) {
              auto bin = [](int v) {
                  string r;
                  while (v > 0) { r += (char) ('0' + v % 2); v /= 2; }
                  reverse(r.begin(), r.end());
                  return r;
              };
              int y = stoi(date.substr(0, 4)), m = stoi(date.substr(5, 2)), d = stoi(date.substr(8, 2));
              return bin(y) + "-" + bin(m) + "-" + bin(d);
          }
        `,
        c: code`
          static int appendBinary(char* out, int p, int v) {
              char tmp[16];
              int len = 0;
              while (v > 0) { tmp[len++] = (char) ('0' + v % 2); v /= 2; }
              while (len > 0) out[p++] = tmp[--len];
              return p;
          }

          char* convertDateToBinary(const char* date) {
              int y = (date[0] - '0') * 1000 + (date[1] - '0') * 100 + (date[2] - '0') * 10 + (date[3] - '0');
              int m = (date[5] - '0') * 10 + (date[6] - '0');
              int d = (date[8] - '0') * 10 + (date[9] - '0');
              char* out = (char*) malloc(32);
              int p = appendBinary(out, 0, y);
              out[p++] = '-';
              p = appendBinary(out, p, m);
              out[p++] = '-';
              p = appendBinary(out, p, d);
              out[p] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string ConvertDateToBinary(string date)
          {
              return string.Join("-", date.Split('-').Select(p => Convert.ToString(int.Parse(p), 2)));
          }
        `,
        go: code`
          func convertDateToBinary(date string) string {
              parts := strings.Split(date, "-")
              for i, p := range parts {
                  v, _ := strconv.Atoi(p)
                  parts[i] = strconv.FormatInt(int64(v), 2)
              }
              return strings.Join(parts, "-")
          }
        `,
        kotlin: code`
          fun convertDateToBinary(date: String): String =
              date.split("-").joinToString("-") { Integer.toBinaryString(it.toInt()) }
        `,
        swift: code`
          func convertDateToBinary(_ date: String) -> String {
              return date.split(separator: "-").map { String(Int($0)!, radix: 2) }.joined(separator: "-")
          }
        `,
        rust: code`
          fn convertDateToBinary(date: String) -> String {
              date.split('-')
                  .map(|p| format!("{:b}", p.parse::<u32>().unwrap()))
                  .collect::<Vec<String>>()
                  .join("-")
          }
        `,
        php: code`
          function convertDateToBinary($date) {
              return implode("-", array_map(function ($p) { return decbin(intval($p, 10)); }, explode("-", $date)));
          }
        `,
        ruby: code`
          def convertDateToBinary(date)
            date.split("-").map { |p| p.to_i(10).to_s(2) }.join("-")
          end
        `,
      },
    };
  })(),

  // ── Check Balanced String (LC 3340) ─────────────────────────────
  (() => {
    const ref = (num: string) => {
      let d = 0;
      for (let i = 0; i < num.length; i++) d += (i % 2 === 0 ? 1 : -1) * Number(num[i]);
      return d === 0;
    };
    return {
      slug: "check-balanced-string",
      title: "Check Balanced String",
      difficulty: "EASY" as const,
      tags: ["String", "Amazon"],
      signature: { funcName: "isBalanced", params: [{ name: "num", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "You are given a string `num` made only of digits.\n\n`num` is **balanced** if the sum of the digits at even indices equals the sum of the digits at odd indices (indices start at 0).\n\nReturn `true` if `num` is balanced, otherwise `false`.",
        [
          { in: 'num = "1234"', out: "false", note: "Even indices give 1 + 3 = 4, odd indices give 2 + 4 = 6." },
          { in: 'num = "24123"', out: "true", note: "Even indices give 2 + 1 + 3 = 6, odd indices give 4 + 2 = 6." },
          { in: 'num = "00"', out: "true" },
        ],
        ["2 <= num.length <= 100", "num consists of digits only"]),
      hints: [
        "You only need the difference between the two sums.",
        "Add digits at even indices and subtract digits at odd indices in one pass; the string is balanced when the result is 0.",
      ],
      editorial: explain({
        idea: "Keep one running value: add each even-index digit and subtract each odd-index digit. The two sums are equal exactly when this difference ends at zero.",
        steps: [
          "Set `diff = 0`.",
          "For each index `i`: add `num[i] - '0'` if `i` is even, subtract it if `i` is odd.",
          "Return `diff == 0`.",
        ],
        why: "`diff` equals (sum at even indices) − (sum at odd indices) after the loop, which is zero iff the sums match.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Use the digit's value (`c - '0'`), not its character code.",
        ],
      }),
      examples: [
        { input: '"1234"', expectedOutput: "false" },
        { input: '"24123"', expectedOutput: "true" },
        { input: '"00"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 5, 20, 100]));
        const digits = pick(rng, ["01", "0123456789", "19", "5"]);
        const a = randLower(rng, n, n, digits).split("");
        if (rng() < 0.4) {
          // nudge towards balance: fix the last digit if possible
          let d = 0;
          for (let i = 0; i < n - 1; i++) d += (i % 2 === 0 ? 1 : -1) * Number(a[i]);
          const need = (n - 1) % 2 === 0 ? -d : d;
          if (need >= 0 && need <= 9) a[n - 1] = String(need);
        }
        const num = a.join("");
        return { input: `"${num}"`, expectedOutput: bool(ref(num)) };
      },
      solutions: {
        python: code`
          def isBalanced(num: str) -> bool:
              diff = 0
              for i, c in enumerate(num):
                  d = ord(c) - 48
                  diff += d if i % 2 == 0 else -d
              return diff == 0
        `,
        javascript: code`
          var isBalanced = function(num) {
              var diff = 0;
              for (var i = 0; i < num.length; i++) {
                  var d = num.charCodeAt(i) - 48;
                  diff += i % 2 === 0 ? d : -d;
              }
              return diff === 0;
          };
        `,
        typescript: code`
          function isBalanced(num: string): boolean {
              var diff = 0;
              for (var i = 0; i < num.length; i++) {
                  var d = num.charCodeAt(i) - 48;
                  diff += i % 2 === 0 ? d : -d;
              }
              return diff === 0;
          }
        `,
        java: code`
          public static boolean isBalanced(String num) {
              int diff = 0;
              for (int i = 0; i < num.length(); i++) {
                  int d = num.charAt(i) - '0';
                  diff += i % 2 == 0 ? d : -d;
              }
              return diff == 0;
          }
        `,
        cpp: code`
          bool isBalanced(string num) {
              int diff = 0;
              for (int i = 0; i < (int) num.size(); i++) {
                  int d = num[i] - '0';
                  diff += i % 2 == 0 ? d : -d;
              }
              return diff == 0;
          }
        `,
        c: code`
          bool isBalanced(const char* num) {
              int diff = 0;
              for (int i = 0; num[i] != '\0'; i++) {
                  int d = num[i] - '0';
                  diff += i % 2 == 0 ? d : -d;
              }
              return diff == 0;
          }
        `,
        csharp: code`
          public static bool IsBalanced(string num)
          {
              int diff = 0;
              for (int i = 0; i < num.Length; i++)
              {
                  int d = num[i] - '0';
                  diff += i % 2 == 0 ? d : -d;
              }
              return diff == 0;
          }
        `,
        go: code`
          func isBalanced(num string) bool {
              diff := 0
              for i := 0; i < len(num); i++ {
                  d := int(num[i] - '0')
                  if i%2 == 0 {
                      diff += d
                  } else {
                      diff -= d
                  }
              }
              return diff == 0
          }
        `,
        kotlin: code`
          fun isBalanced(num: String): Boolean {
              var diff = 0
              for (i in num.indices) {
                  val d = num[i] - '0'
                  diff += if (i % 2 == 0) d else -d
              }
              return diff == 0
          }
        `,
        swift: code`
          func isBalanced(_ num: String) -> Bool {
              var diff = 0
              for (i, c) in num.utf8.enumerated() {
                  let d = Int(c) - 48
                  diff += i % 2 == 0 ? d : -d
              }
              return diff == 0
          }
        `,
        rust: code`
          fn isBalanced(num: String) -> bool {
              let mut diff: i32 = 0;
              for (i, c) in num.bytes().enumerate() {
                  let d = (c - b'0') as i32;
                  diff += if i % 2 == 0 { d } else { -d };
              }
              diff == 0
          }
        `,
        php: code`
          function isBalanced($num) {
              $diff = 0;
              $n = strlen($num);
              for ($i = 0; $i < $n; $i++) {
                  $d = ord($num[$i]) - 48;
                  $diff += $i % 2 == 0 ? $d : -$d;
              }
              return $diff == 0;
          }
        `,
        ruby: code`
          def isBalanced(num)
            diff = 0
            num.each_char.with_index do |c, i|
              d = c.ord - 48
              diff += i.even? ? d : -d
            end
            diff == 0
          end
        `,
      },
    };
  })(),

  // ── Find the Lexicographically Largest String From the Box I (LC 3403) ─
  (() => {
    // Brute force over every split for short words, the closed form otherwise
    // (gen keeps the brute-force share large enough to pin the closed form).
    const splitMax = (word: string, f: number) => {
      let best = "";
      const rec = (start: number, left: number) => {
        if (left === 1) { const p = word.slice(start); if (p > best) best = p; return; }
        for (let end = start + 1; end <= word.length - (left - 1); end++) {
          const p = word.slice(start, end);
          if (p > best) best = p;
          rec(end, left - 1);
        }
      };
      rec(0, f);
      return best;
    };
    const closed = (word: string, f: number) => {
      if (f === 1) return word;
      const L = word.length - f + 1;
      let best = "";
      for (let i = 0; i < word.length; i++) { const p = word.slice(i, i + L); if (p > best) best = p; }
      return best;
    };
    const ref = (word: string, f: number) => (word.length <= 10 ? splitMax(word, f) : closed(word, f));
    return {
      slug: "find-the-lexicographically-largest-string-from-the-box-i",
      title: "Find the Lexicographically Largest String From the Box I",
      difficulty: "MEDIUM" as const,
      tags: ["Two Pointers", "String", "Enumeration", "Google"],
      signature: { funcName: "answerString", params: [{ name: "word", type: "string" as const }, { name: "numFriends", type: "int" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `word` and an integer `numFriends`.\n\nA game is played over several rounds. In each round `word` is cut into exactly `numFriends` **non-empty** pieces, in a way that no earlier round used, and every piece is put into a box. The rounds continue until every possible split has been used once.\n\nReturn the **lexicographically largest** string in the box after all rounds.",
        [
          { in: 'word = "dbca", numFriends = 2', out: "dbc", note: "The splits are d|bca, db|ca and dbc|a; the largest piece is \"dbc\"." },
          { in: 'word = "gggg", numFriends = 4', out: "g", note: "The only split cuts the word into four \"g\" pieces." },
          { in: 'word = "abc", numFriends = 1', out: "abc", note: "With one friend the only piece is the whole word." },
        ],
        ["1 <= word.length <= 5 * 10^3", "word consists only of lowercase English letters", "1 <= numFriends <= word.length"]),
      hints: [
        "A piece can be any substring, as long as the rest of the word can still be cut into `numFriends - 1` non-empty pieces.",
        "So a piece can be at most `n - numFriends + 1` characters long, and every substring of at most that length is achievable.",
        "Longer is never worse for a fixed start (a prefix is smaller than the string it begins), so for each start take the longest allowed substring and keep the maximum. Handle `numFriends == 1` separately.",
      ],
      editorial: explain({
        idea: "The box contains exactly the substrings of length at most `L = n - numFriends + 1` (or just the whole word when `numFriends == 1`). Among the substrings starting at index `i`, the longest allowed one is the largest, because a string is larger than any of its proper prefixes. So the answer is the maximum over `i` of `word[i .. min(i + L, n))`.",
        steps: [
          "If `numFriends == 1`, return `word`.",
          "Let `L = n - numFriends + 1`.",
          "For every start `i`, take `word[i .. min(i + L, n))` and keep the lexicographically largest.",
        ],
        why: "A piece of length `len` starting at `i` can be placed in some split iff the `n - len` remaining characters can form `numFriends - 1` non-empty pieces, i.e. `len <= L` (with `numFriends >= 2` there is always room on one side or both). Every achievable piece is therefore a prefix of the candidate taken at its start, and the candidate is at least as large.",
        time: "O(n * L)",
        space: "O(L)",
        pitfalls: [
          "With one friend the length bound `n - 1 + 1 = n` happens to give the whole word too, but only the start 0 is a legal piece — return `word` directly.",
          "Near the end of the word the candidate is shorter than `L`; do not skip those starts (\"ab\", 2 friends → \"b\").",
        ],
      }),
      examples: [
        { input: '"dbca"\n2', expectedOutput: "dbc" },
        { input: '"gggg"\n4', expectedOutput: "g" },
        { input: '"abc"\n1', expectedOutput: "abc" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcdefghijklmnopqrstuvwxyz", "zyab"]);
        const word = randLower(rng, 1, pick(rng, [3, 6, 10, 10, 40]), alpha);
        const f = ri(rng, 1, word.length);
        return { input: `"${word}"\n${f}`, expectedOutput: ref(word, f) };
      },
      solutions: {
        python: code`
          def answerString(word: str, numFriends: int) -> str:
              if numFriends == 1:
                  return word
              n = len(word)
              length = n - numFriends + 1
              best = ""
              for i in range(n):
                  cand = word[i:i + length]
                  if cand > best:
                      best = cand
              return best
        `,
        javascript: code`
          var answerString = function(word, numFriends) {
              if (numFriends === 1) return word;
              var n = word.length, len = n - numFriends + 1, best = "";
              for (var i = 0; i < n; i++) {
                  var cand = word.substring(i, Math.min(n, i + len));
                  if (cand > best) best = cand;
              }
              return best;
          };
        `,
        typescript: code`
          function answerString(word: string, numFriends: number): string {
              if (numFriends === 1) return word;
              var n = word.length, len = n - numFriends + 1, best = "";
              for (var i = 0; i < n; i++) {
                  var cand = word.substring(i, Math.min(n, i + len));
                  if (cand > best) best = cand;
              }
              return best;
          }
        `,
        java: code`
          public static String answerString(String word, int numFriends) {
              if (numFriends == 1) return word;
              int n = word.length(), len = n - numFriends + 1;
              String best = "";
              for (int i = 0; i < n; i++) {
                  String cand = word.substring(i, Math.min(n, i + len));
                  if (cand.compareTo(best) > 0) best = cand;
              }
              return best;
          }
        `,
        cpp: code`
          string answerString(string word, int numFriends) {
              if (numFriends == 1) return word;
              int n = word.size(), len = n - numFriends + 1;
              string best;
              for (int i = 0; i < n; i++) {
                  string cand = word.substr(i, len);
                  if (cand > best) best = cand;
              }
              return best;
          }
        `,
        c: code`
          char* answerString(const char* word, int numFriends) {
              int n = (int) strlen(word);
              char* out = (char*) malloc((size_t) n + 1);
              if (numFriends == 1) {
                  memcpy(out, word, (size_t) n + 1);
                  return out;
              }
              int len = n - numFriends + 1;
              int bestStart = 0, bestLen = len < n ? len : n;
              for (int i = 1; i < n; i++) {
                  int cl = (n - i < len) ? n - i : len;
                  int common = cl < bestLen ? cl : bestLen;
                  int c = strncmp(word + i, word + bestStart, (size_t) common);
                  if (c > 0 || (c == 0 && cl > bestLen)) { bestStart = i; bestLen = cl; }
              }
              memcpy(out, word + bestStart, (size_t) bestLen);
              out[bestLen] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string AnswerString(string word, int numFriends)
          {
              if (numFriends == 1) return word;
              int n = word.Length, len = n - numFriends + 1;
              string best = "";
              for (int i = 0; i < n; i++)
              {
                  string cand = word.Substring(i, Math.Min(len, n - i));
                  if (string.CompareOrdinal(cand, best) > 0) best = cand;
              }
              return best;
          }
        `,
        go: code`
          func answerString(word string, numFriends int) string {
              if numFriends == 1 {
                  return word
              }
              n := len(word)
              length := n - numFriends + 1
              best := ""
              for i := 0; i < n; i++ {
                  end := i + length
                  if end > n {
                      end = n
                  }
                  if cand := word[i:end]; cand > best {
                      best = cand
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun answerString(word: String, numFriends: Int): String {
              if (numFriends == 1) return word
              val n = word.length
              val len = n - numFriends + 1
              var best = ""
              for (i in 0 until n) {
                  val cand = word.substring(i, minOf(n, i + len))
                  if (cand > best) best = cand
              }
              return best
          }
        `,
        swift: code`
          func answerString(_ word: String, _ numFriends: Int) -> String {
              if numFriends == 1 { return word }
              let a = Array(word.utf8)
              let n = a.count
              let len = n - numFriends + 1
              var bestStart = 0, bestLen = min(len, n)
              for i in 1..<max(n, 1) {
                  let cl = min(len, n - i)
                  var c = 0
                  var k = 0
                  while k < min(cl, bestLen) {
                      if a[i + k] != a[bestStart + k] { c = a[i + k] > a[bestStart + k] ? 1 : -1; break }
                      k += 1
                  }
                  if c > 0 || (c == 0 && cl > bestLen) { bestStart = i; bestLen = cl }
              }
              return String(decoding: a[bestStart..<(bestStart + bestLen)], as: UTF8.self)
          }
        `,
        rust: code`
          fn answerString(word: String, numFriends: i32) -> String {
              if numFriends == 1 {
                  return word;
              }
              let n = word.len();
              let len = n - numFriends as usize + 1;
              let mut best: &str = "";
              for i in 0..n {
                  let cand = &word[i..std::cmp::min(n, i + len)];
                  if cand > best {
                      best = cand;
                  }
              }
              best.to_string()
          }
        `,
        php: code`
          function answerString($word, $numFriends) {
              if ($numFriends == 1) return $word;
              $n = strlen($word);
              $len = $n - $numFriends + 1;
              $best = "";
              for ($i = 0; $i < $n; $i++) {
                  $cand = substr($word, $i, $len);
                  if (strcmp($cand, $best) > 0) $best = $cand;
              }
              return $best;
          }
        `,
        ruby: code`
          def answerString(word, numFriends)
            return word if numFriends == 1
            n = word.length
            len = n - numFriends + 1
            best = ""
            (0...n).each do |i|
              cand = word[i, len]
              best = cand if cand > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Substring Matching Pattern (LC 3407) ────────────────────────
  (() => {
    const ref = (s: string, p: string) => {
      const k = p.indexOf("*");
      const a = p.slice(0, k), b = p.slice(k + 1);
      for (let i = 0; i <= s.length; i++) {
        for (let j = i + a.length + b.length; j <= s.length; j++) {
          const sub = s.slice(i, j);
          if (sub.startsWith(a) && sub.endsWith(b)) return true;
        }
      }
      return false;
    };
    return {
      slug: "substring-matching-pattern",
      title: "Substring Matching Pattern",
      difficulty: "EASY" as const,
      tags: ["String", "String Matching", "Google"],
      signature: { funcName: "hasMatch", params: [{ name: "s", type: "string" as const }, { name: "p", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "You are given a string `s` and a pattern `p` that contains **exactly one** `'*'`.\n\nThe `'*'` may be replaced by any sequence of zero or more characters. Return `true` if `p` can be turned this way into a **substring** of `s`, and `false` otherwise. (A substring is a contiguous, possibly empty, run of characters.)",
        [
          { in: 's = "leetcode", p = "ee*e"', out: "true", note: "Replacing '*' with \"tcod\" gives \"eetcode\", a substring of s." },
          { in: 's = "car", p = "c*v"', out: "false", note: "There is no 'v' in s at all." },
          { in: 's = "luck", p = "u*"', out: "true", note: "\"u\", \"uc\" and \"uck\" all match." },
        ],
        ["1 <= s.length <= 50", "1 <= p.length <= 50", "s contains only lowercase English letters", "p contains only lowercase English letters and exactly one '*'"]),
      hints: [
        "Split `p` at the star into a prefix `a` and a suffix `b`. You need an occurrence of `a` followed, later and without overlap, by an occurrence of `b`.",
        "Which occurrence of `a` gives `b` the most room?",
        "Take the leftmost occurrence of `a`, then search for `b` starting right after it. Empty `a` or `b` always match.",
      ],
      editorial: explain({
        idea: "A match is `a`, then anything, then `b`, inside `s`. Choosing the earliest occurrence of `a` leaves the longest tail of `s` in which to find `b`, so a single greedy pair of searches decides it.",
        steps: [
          "Let `a = p[0 .. star)` and `b = p[star + 1 ..]`.",
          "Find the first index `i` where `a` occurs in `s`; if there is none, return `false`.",
          "Return whether `b` occurs in `s` at some index `>= i + a.length`.",
        ],
        why: "If any match exists, with `a` at `i'` and `b` at `j >= i' + |a|`, then the leftmost occurrence `i <= i'` satisfies `j >= i + |a|` too, so the greedy search finds `b` as well. Conversely anything it finds is a valid match.",
        time: "O(n * m)",
        space: "O(1)",
        pitfalls: [
          "`a` and `b` must not overlap: in s = \"ab\", p = \"ab*b\" is false.",
          "An empty side matches anywhere — some library calls (Swift's `range(of:)`, PHP 7's `strpos`) mishandle an empty needle, so test it explicitly.",
        ],
      }),
      examples: [
        { input: '"leetcode"\n"ee*e"', expectedOutput: "true" },
        { input: '"car"\n"c*v"', expectedOutput: "false" },
        { input: '"luck"\n"u*"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const s = randLower(rng, 1, pick(rng, [3, 10, 25, 50]), alpha);
        const piece = () => {
          if (rng() < 0.2) return "";
          if (rng() < 0.6) { const i = ri(rng, 0, s.length - 1); return s.slice(i, i + ri(rng, 1, 4)); }
          return randLower(rng, 1, 3, alpha);
        };
        const p = (piece() + "*" + piece()).slice(0, 50);
        const fixed = p.includes("*") ? p : p.slice(0, 49) + "*";
        return { input: `"${s}"\n"${fixed}"`, expectedOutput: bool(ref(s, fixed)) };
      },
      solutions: {
        python: code`
          def hasMatch(s: str, p: str) -> bool:
              star = p.index("*")
              a, b = p[:star], p[star + 1:]
              i = s.find(a)
              if i < 0:
                  return False
              return s.find(b, i + len(a)) >= 0
        `,
        javascript: code`
          var hasMatch = function(s, p) {
              var star = p.indexOf("*");
              var a = p.substring(0, star), b = p.substring(star + 1);
              var i = s.indexOf(a);
              if (i < 0) return false;
              return s.indexOf(b, i + a.length) >= 0;
          };
        `,
        typescript: code`
          function hasMatch(s: string, p: string): boolean {
              var star = p.indexOf("*");
              var a = p.substring(0, star), b = p.substring(star + 1);
              var i = s.indexOf(a);
              if (i < 0) return false;
              return s.indexOf(b, i + a.length) >= 0;
          }
        `,
        java: code`
          public static boolean hasMatch(String s, String p) {
              int star = p.indexOf('*');
              String a = p.substring(0, star), b = p.substring(star + 1);
              int i = s.indexOf(a);
              if (i < 0) return false;
              return s.indexOf(b, i + a.length()) >= 0;
          }
        `,
        cpp: code`
          bool hasMatch(string s, string p) {
              size_t star = p.find('*');
              string a = p.substr(0, star), b = p.substr(star + 1);
              size_t i = s.find(a);
              if (i == string::npos) return false;
              return s.find(b, i + a.size()) != string::npos;
          }
        `,
        c: code`
          bool hasMatch(const char* s, const char* p) {
              const char* star = strchr(p, '*');
              int la = (int) (star - p);
              char a[64], b[64];
              memcpy(a, p, (size_t) la);
              a[la] = '\0';
              strcpy(b, star + 1);
              const char* at = strstr(s, a);
              if (at == NULL) return false;
              return strstr(at + la, b) != NULL;
          }
        `,
        csharp: code`
          public static bool HasMatch(string s, string p)
          {
              int star = p.IndexOf('*');
              string a = p.Substring(0, star), b = p.Substring(star + 1);
              int i = s.IndexOf(a, StringComparison.Ordinal);
              if (i < 0) return false;
              return s.IndexOf(b, i + a.Length, StringComparison.Ordinal) >= 0;
          }
        `,
        go: code`
          func hasMatch(s string, p string) bool {
              star := strings.IndexByte(p, '*')
              a, b := p[:star], p[star+1:]
              i := strings.Index(s, a)
              if i < 0 {
                  return false
              }
              return strings.Contains(s[i+len(a):], b)
          }
        `,
        kotlin: code`
          fun hasMatch(s: String, p: String): Boolean {
              val star = p.indexOf('*')
              val a = p.substring(0, star)
              val b = p.substring(star + 1)
              val i = s.indexOf(a)
              if (i < 0) return false
              return s.indexOf(b, i + a.length) >= 0
          }
        `,
        swift: code`
          func hasMatch(_ s: String, _ p: String) -> Bool {
              let t = Array(s.utf8), q = Array(p.utf8)
              let star = q.firstIndex(of: 42)!
              let a = Array(q[0..<star]), b = Array(q[(star + 1)...])
              func find(_ needle: [UInt8], from: Int) -> Int {
                  if needle.isEmpty { return from <= t.count ? from : -1 }
                  var i = from
                  while i + needle.count <= t.count {
                      if Array(t[i..<(i + needle.count)]) == needle { return i }
                      i += 1
                  }
                  return -1
              }
              let i = find(a, from: 0)
              if i < 0 { return false }
              return find(b, from: i + a.count) >= 0
          }
        `,
        rust: code`
          fn hasMatch(s: String, p: String) -> bool {
              let star = p.find('*').unwrap();
              let a = &p[..star];
              let b = &p[star + 1..];
              match s.find(a) {
                  None => false,
                  Some(i) => s[i + a.len()..].contains(b),
              }
          }
        `,
        php: code`
          function hasMatch($s, $p) {
              $star = strpos($p, '*');
              $a = substr($p, 0, $star);
              $b = substr($p, $star + 1);
              $i = $a === "" ? 0 : strpos($s, $a);
              if ($i === false) return false;
              if ($b === "") return true;
              $rest = substr($s, $i + strlen($a));
              return $rest !== false && $rest !== "" && strpos($rest, $b) !== false;
          }
        `,
        ruby: code`
          def hasMatch(s, p)
            star = p.index("*")
            a = p[0, star]
            b = p[(star + 1)..-1]
            i = s.index(a)
            return false if i.nil?
            !s.index(b, i + a.length).nil?
          end
        `,
      },
    };
  })(),

  // ── Find Special Substring of Length K (LC 3456) ────────────────
  (() => {
    const ref = (s: string, k: number) => {
      for (let i = 0; i + k <= s.length; i++) {
        const sub = s.slice(i, i + k);
        if (!sub.split("").every((c) => c === sub[0])) continue;
        if (i > 0 && s[i - 1] === sub[0]) continue;
        if (i + k < s.length && s[i + k] === sub[0]) continue;
        return true;
      }
      return false;
    };
    return {
      slug: "find-special-substring-of-length-k",
      title: "Find Special Substring of Length K",
      difficulty: "EASY" as const,
      tags: ["String", "Amazon"],
      signature: { funcName: "hasSpecialSubstring", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "You are given a string `s` and an integer `k`.\n\nDecide whether `s` has a substring of length **exactly** `k` such that:\n\n- all of its characters are the same letter `c`;\n- the character just before it (if there is one) is not `c`;\n- the character just after it (if there is one) is not `c`.\n\nReturn `true` if such a substring exists, otherwise `false`.",
        [
          { in: 's = "aaabaaa", k = 3', out: "true", note: "\"aaa\" at the start is followed by 'b' and has nothing before it." },
          { in: 's = "abc", k = 2', out: "false", note: "No two neighbouring letters are equal." },
          { in: 's = "bbbb", k = 2', out: "false", note: "Every \"bb\" touches another 'b' on at least one side." },
        ],
        ["1 <= k <= s.length <= 100", "s consists only of lowercase English letters"]),
      hints: [
        "The conditions say the substring cannot be extended on either side with the same letter.",
        "So it is exactly a maximal run of one letter — and its length must be `k`.",
        "Scan the runs of equal letters and check whether any run has length exactly `k`.",
      ],
      editorial: explain({
        idea: "A block of `k` equal letters whose neighbours differ from them is precisely a maximal run of length `k`. So the answer is whether some maximal run has length exactly `k`.",
        steps: [
          "Walk `s`, measuring each maximal run of one letter.",
          "If a run has length exactly `k`, return `true`.",
          "Return `false` after the scan.",
        ],
        why: "A qualifying substring cannot be extended (its neighbours differ) and contains only one letter, so it is a whole maximal run. Conversely a maximal run of length `k` satisfies all three conditions.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "A longer run does not contain a valid length-`k` block: \"bbbb\" with `k = 2` is false.",
          "The last run ends at the end of the string — check it after the loop if your scan only checks on a letter change.",
        ],
      }),
      examples: [
        { input: '"aaabaaa"\n3', expectedOutput: "true" },
        { input: '"abc"\n2', expectedOutput: "false" },
        { input: '"bbbb"\n2', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const target = ri(rng, 1, pick(rng, [1, 5, 20, 60, 100]));
        let s = "";
        while (s.length < target) s += pick(rng, alpha.split("")).repeat(ri(rng, 1, pick(rng, [1, 3, 6])));
        s = s.slice(0, target);
        const k = rng() < 0.6 ? ri(rng, 1, Math.min(s.length, 6)) : ri(rng, 1, s.length);
        return { input: `"${s}"\n${k}`, expectedOutput: bool(ref(s, k)) };
      },
      solutions: {
        python: code`
          def hasSpecialSubstring(s: str, k: int) -> bool:
              n, i = len(s), 0
              while i < n:
                  j = i
                  while j < n and s[j] == s[i]:
                      j += 1
                  if j - i == k:
                      return True
                  i = j
              return False
        `,
        javascript: code`
          var hasSpecialSubstring = function(s, k) {
              var n = s.length, i = 0;
              while (i < n) {
                  var j = i;
                  while (j < n && s[j] === s[i]) j++;
                  if (j - i === k) return true;
                  i = j;
              }
              return false;
          };
        `,
        typescript: code`
          function hasSpecialSubstring(s: string, k: number): boolean {
              var n = s.length, i = 0;
              while (i < n) {
                  var j = i;
                  while (j < n && s[j] === s[i]) j++;
                  if (j - i === k) return true;
                  i = j;
              }
              return false;
          }
        `,
        java: code`
          public static boolean hasSpecialSubstring(String s, int k) {
              int n = s.length(), i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && s.charAt(j) == s.charAt(i)) j++;
                  if (j - i == k) return true;
                  i = j;
              }
              return false;
          }
        `,
        cpp: code`
          bool hasSpecialSubstring(string s, int k) {
              int n = s.size(), i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && s[j] == s[i]) j++;
                  if (j - i == k) return true;
                  i = j;
              }
              return false;
          }
        `,
        c: code`
          bool hasSpecialSubstring(const char* s, int k) {
              int n = (int) strlen(s), i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && s[j] == s[i]) j++;
                  if (j - i == k) return true;
                  i = j;
              }
              return false;
          }
        `,
        csharp: code`
          public static bool HasSpecialSubstring(string s, int k)
          {
              int n = s.Length, i = 0;
              while (i < n)
              {
                  int j = i;
                  while (j < n && s[j] == s[i]) j++;
                  if (j - i == k) return true;
                  i = j;
              }
              return false;
          }
        `,
        go: code`
          func hasSpecialSubstring(s string, k int) bool {
              n, i := len(s), 0
              for i < n {
                  j := i
                  for j < n && s[j] == s[i] {
                      j++
                  }
                  if j-i == k {
                      return true
                  }
                  i = j
              }
              return false
          }
        `,
        kotlin: code`
          fun hasSpecialSubstring(s: String, k: Int): Boolean {
              val n = s.length
              var i = 0
              while (i < n) {
                  var j = i
                  while (j < n && s[j] == s[i]) j++
                  if (j - i == k) return true
                  i = j
              }
              return false
          }
        `,
        swift: code`
          func hasSpecialSubstring(_ s: String, _ k: Int) -> Bool {
              let a = Array(s.utf8)
              let n = a.count
              var i = 0
              while i < n {
                  var j = i
                  while j < n && a[j] == a[i] { j += 1 }
                  if j - i == k { return true }
                  i = j
              }
              return false
          }
        `,
        rust: code`
          fn hasSpecialSubstring(s: String, k: i32) -> bool {
              let a = s.as_bytes();
              let n = a.len();
              let mut i = 0;
              while i < n {
                  let mut j = i;
                  while j < n && a[j] == a[i] {
                      j += 1;
                  }
                  if (j - i) as i32 == k {
                      return true;
                  }
                  i = j;
              }
              false
          }
        `,
        php: code`
          function hasSpecialSubstring($s, $k) {
              $n = strlen($s);
              $i = 0;
              while ($i < $n) {
                  $j = $i;
                  while ($j < $n && $s[$j] === $s[$i]) $j++;
                  if ($j - $i == $k) return true;
                  $i = $j;
              }
              return false;
          }
        `,
        ruby: code`
          def hasSpecialSubstring(s, k)
            n = s.length
            i = 0
            while i < n
              j = i
              j += 1 while j < n && s[j] == s[i]
              return true if j - i == k
              i = j
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Reverse Degree of a String (LC 3498) ────────────────────────
  (() => {
    const ref = (s: string) => {
      let total = 0;
      for (let i = 0; i < s.length; i++) total += (26 - (s.charCodeAt(i) - 97)) * (i + 1);
      return total;
    };
    return {
      slug: "reverse-degree-of-a-string",
      title: "Reverse Degree of a String",
      difficulty: "EASY" as const,
      tags: ["String", "Simulation", "Amazon"],
      signature: { funcName: "reverseDegree", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `s` of lowercase letters.\n\nIn the **reversed alphabet** `'a'` has position 26, `'b'` has 25, …, and `'z'` has 1. The **reverse degree** of `s` is the sum, over every index `i` (counted from **1**), of the reversed-alphabet position of `s[i]` multiplied by `i`.\n\nReturn the reverse degree of `s`.",
        [
          { in: 's = "abc"', out: "148", note: "26 * 1 + 25 * 2 + 24 * 3 = 26 + 50 + 72 = 148." },
          { in: 's = "zaza"', out: "160", note: "1 * 1 + 26 * 2 + 1 * 3 + 26 * 4 = 160." },
          { in: 's = "z"', out: "1" },
        ],
        ["1 <= s.length <= 1000", "s consists only of lowercase English letters"]),
      hints: [
        "The reversed-alphabet position of a letter `c` is `26 - (c - 'a')`.",
        "Multiply it by the 1-based index and add everything up in one pass. The largest total, `26 * (1 + 2 + … + 1000)`, fits in a 32-bit integer.",
      ],
      editorial: explain({
        idea: "Each character contributes independently: its reversed position times its 1-based index. One pass sums the contributions.",
        steps: [
          "Set `total = 0`.",
          "For `i = 0 .. n - 1`, add `(26 - (s[i] - 'a')) * (i + 1)`.",
          "Return `total`.",
        ],
        why: "This is the definition term by term; the bound `26 * 1000 * 1001 / 2 = 13,013,000` keeps it inside int32.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Indices are 1-based in the formula — multiply by `i + 1` in a 0-based loop.",
          "`'a'` is worth 26 and `'z'` is worth 1, not the other way round.",
        ],
      }),
      examples: [
        { input: '"abc"', expectedOutput: "148" },
        { input: '"zaza"', expectedOutput: "160" },
        { input: '"z"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "z", "az", "abcdefghijklmnopqrstuvwxyz"]);
        const s = randLower(rng, 1, pick(rng, [1, 5, 30, 200, 1000]), alpha);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def reverseDegree(s: str) -> int:
              return sum((26 - (ord(c) - 97)) * (i + 1) for i, c in enumerate(s))
        `,
        javascript: code`
          var reverseDegree = function(s) {
              var total = 0;
              for (var i = 0; i < s.length; i++) total += (26 - (s.charCodeAt(i) - 97)) * (i + 1);
              return total;
          };
        `,
        typescript: code`
          function reverseDegree(s: string): number {
              var total = 0;
              for (var i = 0; i < s.length; i++) total += (26 - (s.charCodeAt(i) - 97)) * (i + 1);
              return total;
          }
        `,
        java: code`
          public static int reverseDegree(String s) {
              int total = 0;
              for (int i = 0; i < s.length(); i++) total += (26 - (s.charAt(i) - 'a')) * (i + 1);
              return total;
          }
        `,
        cpp: code`
          int reverseDegree(string s) {
              int total = 0;
              for (int i = 0; i < (int) s.size(); i++) total += (26 - (s[i] - 'a')) * (i + 1);
              return total;
          }
        `,
        c: code`
          int reverseDegree(const char* s) {
              int total = 0;
              for (int i = 0; s[i] != '\0'; i++) total += (26 - (s[i] - 'a')) * (i + 1);
              return total;
          }
        `,
        csharp: code`
          public static int ReverseDegree(string s)
          {
              int total = 0;
              for (int i = 0; i < s.Length; i++) total += (26 - (s[i] - 'a')) * (i + 1);
              return total;
          }
        `,
        go: code`
          func reverseDegree(s string) int {
              total := 0
              for i := 0; i < len(s); i++ {
                  total += (26 - int(s[i]-'a')) * (i + 1)
              }
              return total
          }
        `,
        kotlin: code`
          fun reverseDegree(s: String): Int {
              var total = 0
              for (i in s.indices) total += (26 - (s[i] - 'a')) * (i + 1)
              return total
          }
        `,
        swift: code`
          func reverseDegree(_ s: String) -> Int {
              var total = 0
              for (i, c) in s.utf8.enumerated() {
                  total += (26 - (Int(c) - 97)) * (i + 1)
              }
              return total
          }
        `,
        rust: code`
          fn reverseDegree(s: String) -> i32 {
              s.bytes()
                  .enumerate()
                  .map(|(i, c)| (26 - (c - b'a') as i32) * (i as i32 + 1))
                  .sum()
          }
        `,
        php: code`
          function reverseDegree($s) {
              $total = 0;
              $n = strlen($s);
              for ($i = 0; $i < $n; $i++) $total += (26 - (ord($s[$i]) - 97)) * ($i + 1);
              return $total;
          }
        `,
        ruby: code`
          def reverseDegree(s)
            total = 0
            s.bytes.each_with_index { |c, i| total += (26 - (c - 97)) * (i + 1) }
            total
          end
        `,
      },
    };
  })(),

  // ── Maximize Active Section with Trade I (LC 3499) ──────────────
  (() => {
    const runs = (t: string, ch: string) => {
      const out: Array<[number, number]> = [];
      let i = 0;
      while (i < t.length) {
        if (t[i] !== ch) { i++; continue; }
        let j = i;
        while (j < t.length && t[j] === ch) j++;
        out.push([i, j]);
        i = j;
      }
      return out;
    };
    const ones = (t: string) => t.split("").filter((c) => c === "1").length;
    // Brute force: try every trade on the augmented string.
    const ref = (s: string) => {
      const t = "1" + s + "1";
      let best = ones(s);
      for (const [l, r] of runs(t, "1")) {
        if (l === 0 || r === t.length) continue;
        const u = t.slice(0, l) + "0".repeat(r - l) + t.slice(r);
        for (const [a, b] of runs(u, "0")) {
          const v = u.slice(0, a) + "1".repeat(b - a) + u.slice(b);
          best = Math.max(best, ones(v.slice(1, v.length - 1)));
        }
      }
      return best;
    };
    return {
      slug: "maximize-active-section-with-trade-i",
      title: "Maximize Active Section with Trade I",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Enumeration", "Google"],
      signature: { funcName: "maxActiveSectionsAfterTrade", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a binary string `s` of length `n`, where `'1'` marks an active section and `'0'` an inactive one.\n\nYou may perform **at most one trade**. A trade is two steps, done in order:\n\n1. pick a contiguous block of `'1'`s that is surrounded by `'0'`s on both sides and turn all of it into `'0'`s;\n2. then pick a contiguous block of `'0'`s that is surrounded by `'1'`s on both sides and turn all of it into `'1'`s.\n\nFor the purpose of the trade only, treat `s` as if it had an extra `'1'` at each end (`t = '1' + s + '1'`); those two added characters are never counted.\n\nReturn the **maximum number of `'1'`s** that `s` can contain after the best choice.",
        [
          { in: 's = "01"', out: "1", note: "No block of '1's is surrounded by '0's, so no trade is possible." },
          { in: 's = "0100"', out: "4", note: "With t = \"101001\", zero the middle '1' to get \"100001\", then fill the zero block to get \"111111\": all 4 characters of s are '1'." },
          { in: 's = "1000100"', out: "7", note: "t = \"110001001\". Zero the lone '1' between the zero blocks (\"110000001\"), then fill them all: every character of s becomes '1'." },
        ],
        ["1 <= n == s.length <= 10^5", "s[i] is either '0' or '1'"]),
      hints: [
        "Step 1 can only remove a block of `'1'`s that has a block of `'0'`s directly on each side — it merges those two zero blocks into one big block.",
        "Step 2 should then fill that merged block: you lose the removed ones but gain them back, plus both zero blocks.",
        "So the gain is the sum of two **consecutive** zero blocks. Take the best such pair and add it to the number of `'1'`s already in `s`; with fewer than two zero blocks no trade helps.",
      ],
      editorial: explain({
        idea: "Removing a `'1'` block that separates zero blocks of sizes `z1` and `z2` creates one zero block of size `z1 + o + z2`, and filling it gives back the `o` ones plus `z1 + z2` new ones. So a trade gains the sum of two adjacent zero blocks; the answer is the count of ones plus the best adjacent pair.",
        steps: [
          "Count the `'1'`s in `s`.",
          "Scan `s` for its maximal blocks of `'0'`s, in order, remembering the length of the previous block.",
          "For each block after the first, update `best = max(best, previous + current)`.",
          "Return `ones + best` (`best` stays 0 when there are fewer than two zero blocks).",
        ],
        why: "In the augmented string any `'1'` block surrounded by zeros lies between two consecutive zero blocks of `s`. After removing it, filling the merged block gains `z1 + z2`; filling any other zero block `z` gains `z - o < z`, and `z` itself is part of some adjacent pair whose sum is at least `z`. Hence the best trade gains exactly the largest adjacent-pair sum, and not trading gains 0.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "A `'1'` block touching either end of `s` is next to the augmented `'1'`, not a `'0'`, so it cannot be removed.",
          "The augmented `'1'`s are never counted in the answer.",
          "Two zero blocks are always separated by a `'1'` block, so consecutive zero blocks in a scan are exactly the pairs a trade can merge.",
        ],
      }),
      examples: [
        { input: '"01"', expectedOutput: "1" },
        { input: '"0100"', expectedOutput: "4" },
        { input: '"1000100"', expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 20, 30]));
        const p = pick(rng, [0.2, 0.5, 0.8]);
        let s = "";
        while (s.length < n) s += (rng() < p ? "1" : "0").repeat(ri(rng, 1, pick(rng, [1, 2, 4])));
        s = s.slice(0, n);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def maxActiveSectionsAfterTrade(s: str) -> int:
              ones = s.count("1")
              best, prev = 0, -1
              n, i = len(s), 0
              while i < n:
                  if s[i] == "1":
                      i += 1
                      continue
                  j = i
                  while j < n and s[j] == "0":
                      j += 1
                  cur = j - i
                  if prev >= 0:
                      best = max(best, prev + cur)
                  prev = cur
                  i = j
              return ones + best
        `,
        javascript: code`
          var maxActiveSectionsAfterTrade = function(s) {
              var n = s.length, ones = 0, best = 0, prev = -1, i = 0;
              for (var k = 0; k < n; k++) if (s[k] === "1") ones++;
              while (i < n) {
                  if (s[i] === "1") { i++; continue; }
                  var j = i;
                  while (j < n && s[j] === "0") j++;
                  var cur = j - i;
                  if (prev >= 0 && prev + cur > best) best = prev + cur;
                  prev = cur;
                  i = j;
              }
              return ones + best;
          };
        `,
        typescript: code`
          function maxActiveSectionsAfterTrade(s: string): number {
              var n = s.length, ones = 0, best = 0, prev = -1, i = 0;
              for (var k = 0; k < n; k++) if (s[k] === "1") ones++;
              while (i < n) {
                  if (s[i] === "1") { i++; continue; }
                  var j = i;
                  while (j < n && s[j] === "0") j++;
                  var cur = j - i;
                  if (prev >= 0 && prev + cur > best) best = prev + cur;
                  prev = cur;
                  i = j;
              }
              return ones + best;
          }
        `,
        java: code`
          public static int maxActiveSectionsAfterTrade(String s) {
              int n = s.length(), ones = 0, best = 0, prev = -1, i = 0;
              for (int k = 0; k < n; k++) if (s.charAt(k) == '1') ones++;
              while (i < n) {
                  if (s.charAt(i) == '1') { i++; continue; }
                  int j = i;
                  while (j < n && s.charAt(j) == '0') j++;
                  int cur = j - i;
                  if (prev >= 0) best = Math.max(best, prev + cur);
                  prev = cur;
                  i = j;
              }
              return ones + best;
          }
        `,
        cpp: code`
          int maxActiveSectionsAfterTrade(string s) {
              int n = s.size(), ones = 0, best = 0, prev = -1, i = 0;
              for (char c : s) if (c == '1') ones++;
              while (i < n) {
                  if (s[i] == '1') { i++; continue; }
                  int j = i;
                  while (j < n && s[j] == '0') j++;
                  int cur = j - i;
                  if (prev >= 0) best = max(best, prev + cur);
                  prev = cur;
                  i = j;
              }
              return ones + best;
          }
        `,
        c: code`
          int maxActiveSectionsAfterTrade(const char* s) {
              int n = (int) strlen(s), ones = 0, best = 0, prev = -1, i = 0;
              for (int k = 0; k < n; k++) if (s[k] == '1') ones++;
              while (i < n) {
                  if (s[i] == '1') { i++; continue; }
                  int j = i;
                  while (j < n && s[j] == '0') j++;
                  int cur = j - i;
                  if (prev >= 0 && prev + cur > best) best = prev + cur;
                  prev = cur;
                  i = j;
              }
              return ones + best;
          }
        `,
        csharp: code`
          public static int MaxActiveSectionsAfterTrade(string s)
          {
              int n = s.Length, ones = 0, best = 0, prev = -1, i = 0;
              foreach (char c in s) if (c == '1') ones++;
              while (i < n)
              {
                  if (s[i] == '1') { i++; continue; }
                  int j = i;
                  while (j < n && s[j] == '0') j++;
                  int cur = j - i;
                  if (prev >= 0) best = Math.Max(best, prev + cur);
                  prev = cur;
                  i = j;
              }
              return ones + best;
          }
        `,
        go: code`
          func maxActiveSectionsAfterTrade(s string) int {
              n := len(s)
              ones, best, prev, i := 0, 0, -1, 0
              for k := 0; k < n; k++ {
                  if s[k] == '1' {
                      ones++
                  }
              }
              for i < n {
                  if s[i] == '1' {
                      i++
                      continue
                  }
                  j := i
                  for j < n && s[j] == '0' {
                      j++
                  }
                  cur := j - i
                  if prev >= 0 && prev+cur > best {
                      best = prev + cur
                  }
                  prev = cur
                  i = j
              }
              return ones + best
          }
        `,
        kotlin: code`
          fun maxActiveSectionsAfterTrade(s: String): Int {
              val n = s.length
              val ones = s.count { it == '1' }
              var best = 0
              var prev = -1
              var i = 0
              while (i < n) {
                  if (s[i] == '1') { i++; continue }
                  var j = i
                  while (j < n && s[j] == '0') j++
                  val cur = j - i
                  if (prev >= 0) best = maxOf(best, prev + cur)
                  prev = cur
                  i = j
              }
              return ones + best
          }
        `,
        swift: code`
          func maxActiveSectionsAfterTrade(_ s: String) -> Int {
              let a = Array(s.utf8)
              let n = a.count
              let ones = a.filter { $0 == 49 }.count
              var best = 0, prev = -1, i = 0
              while i < n {
                  if a[i] == 49 { i += 1; continue }
                  var j = i
                  while j < n && a[j] == 48 { j += 1 }
                  let cur = j - i
                  if prev >= 0 { best = max(best, prev + cur) }
                  prev = cur
                  i = j
              }
              return ones + best
          }
        `,
        rust: code`
          fn maxActiveSectionsAfterTrade(s: String) -> i32 {
              let a = s.as_bytes();
              let n = a.len();
              let ones = a.iter().filter(|&&c| c == b'1').count() as i32;
              let (mut best, mut prev, mut i) = (0i32, -1i32, 0usize);
              while i < n {
                  if a[i] == b'1' {
                      i += 1;
                      continue;
                  }
                  let mut j = i;
                  while j < n && a[j] == b'0' {
                      j += 1;
                  }
                  let cur = (j - i) as i32;
                  if prev >= 0 {
                      best = best.max(prev + cur);
                  }
                  prev = cur;
                  i = j;
              }
              ones + best
          }
        `,
        php: code`
          function maxActiveSectionsAfterTrade($s) {
              $n = strlen($s);
              $ones = substr_count($s, "1");
              $best = 0;
              $prev = -1;
              $i = 0;
              while ($i < $n) {
                  if ($s[$i] === "1") { $i++; continue; }
                  $j = $i;
                  while ($j < $n && $s[$j] === "0") $j++;
                  $cur = $j - $i;
                  if ($prev >= 0) $best = max($best, $prev + $cur);
                  $prev = $cur;
                  $i = $j;
              }
              return $ones + $best;
          }
        `,
        ruby: code`
          def maxActiveSectionsAfterTrade(s)
            n = s.length
            ones = s.count("1")
            best = 0
            prev = -1
            i = 0
            while i < n
              if s[i] == "1"
                i += 1
                next
              end
              j = i
              j += 1 while j < n && s[j] == "0"
              cur = j - i
              best = [best, prev + cur].max if prev >= 0
              prev = cur
              i = j
            end
            ones + best
          end
        `,
      },
    };
  })(),

];
