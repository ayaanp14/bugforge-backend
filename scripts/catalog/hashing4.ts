/**
 * Hash-table and counting problems — wave 4.
 *
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks
 * "must-do" hashing set. Sample strings are CodeKairo's own rather than
 * another site's name.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs in
 * src/lib/judge0.ts reads `<ident>=` as a named argument).
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const HASHING4_PROBLEMS: CatalogProblem[] = [

  // ── Find Words That Can Be Formed by Characters (LC 1160) ───────
  (() => {
    const ref = (words: string[], chars: string) => {
      const have = new Array(26).fill(0);
      for (let i = 0; i < chars.length; i++) have[chars.charCodeAt(i) - 97]++;
      let total = 0;
      for (const w of words) {
        const need = new Array(26).fill(0);
        for (let i = 0; i < w.length; i++) need[w.charCodeAt(i) - 97]++;
        let ok = true;
        for (let c = 0; c < 26; c++) { if (need[c] > have[c]) { ok = false; break; } }
        if (ok) total += w.length;
      }
      return total;
    };
    return {
      slug: "find-words-that-can-be-formed-by-characters",
      title: "Find Words That Can Be Formed by Characters",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Counting", "TCS", "Infosys", "Amazon"],
      signature: { funcName: "countCharacters", params: [{ name: "words", type: "string[]" as const }, { name: "chars", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A word can be **formed** from `chars` if every letter it uses is available in `chars` at least as many times. Each letter of `chars` may be used at most once per word, but `chars` is not consumed between words.\n\nReturn the sum of the lengths of all words that can be formed.",
        [
          { in: 'words = ["cat","bt","hat","tree"], chars = "atach"', out: "6", note: '"cat" and "hat" can be formed: 3 + 3 = 6.' },
          { in: 'words = ["code","kairo","coco"], chars = "codekairo"', out: "9", note: '"code" and "kairo" fit; "coco" needs two c\'s and only one is available.' },
          { in: 'words = ["a"], chars = "b"', out: "0" },
        ],
        ["1 <= words.length <= 1000", "1 <= words[i].length, chars.length <= 100", "All strings consist of lowercase English letters."]),
      hints: [
        "Count the letters of `chars` once — the budget is the same for every word.",
        "For each word, count its own letters and compare slot by slot.",
        "Counts, not membership: `\"cook\"` needs two `o`s.",
      ],
      editorial: explain({
        idea: "The budget is fixed, so tally `chars` once and then test each word against it with a 26-slot comparison.",
        steps: [
          "Build `have[26]` from `chars`.",
          "For each word, build `need[26]` and check `need[c] <= have[c]` for every letter.",
          "Add the word's length when every slot passes.",
        ],
        why: "Because `chars` is not consumed between words, each word is an independent test against the same budget — so recomputing `have` per word would be wasted work, and a shared mutable budget would be wrong.",
        time: "O(total characters)",
        space: "O(1)",
        pitfalls: [
          "Decrementing `have` as words are matched treats `chars` as consumable, which the statement does not.",
          "A set-based check ignores multiplicity and accepts `\"cook\"` from `\"cok\"`.",
        ],
      }),
      examples: [
        { input: '["cat","bt","hat","tree"]\n"atach"', expectedOutput: "6" },
        { input: '["code","kairo","coco"]\n"codekairo"', expectedOutput: "9" },
        { input: '["a"]\n"b"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcde";
        const words = Array.from({ length: ri(rng, 1, 10) }, () => randLower(rng, 1, 6, alphabet));
        const chars = randLower(rng, 1, 12, alphabet);
        return { input: `${fmtStrArr(words)}\n"${chars}"`, expectedOutput: String(ref(words, chars)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countCharacters(words: List[str], chars: str) -> int:\n    have = [0] * 26\n    for c in chars:\n        have[ord(c) - 97] += 1\n    total = 0\n    for w in words:\n        need = [0] * 26\n        for c in w:\n            need[ord(c) - 97] += 1\n        if all(need[i] <= have[i] for i in range(26)):\n            total += len(w)\n    return total`,
        javascript: `var countCharacters = function(words, chars) {\n    var have = [];\n    for (var t = 0; t < 26; t++) have.push(0);\n    for (var i = 0; i < chars.length; i++) have[chars.charCodeAt(i) - 97]++;\n    var total = 0;\n    for (var j = 0; j < words.length; j++) {\n        var w = words[j];\n        var need = [];\n        for (var u = 0; u < 26; u++) need.push(0);\n        for (var k = 0; k < w.length; k++) need[w.charCodeAt(k) - 97]++;\n        var ok = true;\n        for (var c = 0; c < 26; c++) {\n            if (need[c] > have[c]) { ok = false; break; }\n        }\n        if (ok) total += w.length;\n    }\n    return total;\n};`,
        typescript: `function countCharacters(words: string[], chars: string): number {\n    var have: number[] = [];\n    for (var t = 0; t < 26; t++) have.push(0);\n    for (var i = 0; i < chars.length; i++) have[chars.charCodeAt(i) - 97]++;\n    var total = 0;\n    for (var j = 0; j < words.length; j++) {\n        var w = words[j];\n        var need: number[] = [];\n        for (var u = 0; u < 26; u++) need.push(0);\n        for (var k = 0; k < w.length; k++) need[w.charCodeAt(k) - 97]++;\n        var ok = true;\n        for (var c = 0; c < 26; c++) {\n            if (need[c] > have[c]) { ok = false; break; }\n        }\n        if (ok) total += w.length;\n    }\n    return total;\n}`,
        java: `public static int countCharacters(String[] words, String chars) {\n    int[] have = new int[26];\n    for (int i = 0; i < chars.length(); i++) have[chars.charAt(i) - 'a']++;\n    int total = 0;\n    for (String w : words) {\n        int[] need = new int[26];\n        for (int i = 0; i < w.length(); i++) need[w.charAt(i) - 'a']++;\n        boolean ok = true;\n        for (int c = 0; c < 26; c++) {\n            if (need[c] > have[c]) { ok = false; break; }\n        }\n        if (ok) total += w.length();\n    }\n    return total;\n}`,
        cpp: `int countCharacters(vector<string>& words, string chars) {\n    vector<int> have(26, 0);\n    for (char c : chars) have[c - 'a']++;\n    int total = 0;\n    for (const string& w : words) {\n        vector<int> need(26, 0);\n        for (char c : w) need[c - 'a']++;\n        bool ok = true;\n        for (int c = 0; c < 26; c++) {\n            if (need[c] > have[c]) { ok = false; break; }\n        }\n        if (ok) total += (int) w.size();\n    }\n    return total;\n}`,
        c: `int countCharacters(char** words, int wordsSize, char* chars) {\n    int have[26];\n    memset(have, 0, sizeof(have));\n    for (int i = 0; chars[i]; i++) have[chars[i] - 'a']++;\n    int total = 0;\n    for (int j = 0; j < wordsSize; j++) {\n        int need[26];\n        memset(need, 0, sizeof(need));\n        for (int i = 0; words[j][i]; i++) need[words[j][i] - 'a']++;\n        int ok = 1;\n        for (int c = 0; c < 26; c++) {\n            if (need[c] > have[c]) { ok = 0; break; }\n        }\n        if (ok) total += (int) strlen(words[j]);\n    }\n    return total;\n}`,
        csharp: `public static int CountCharacters(string[] words, string chars)\n{\n    int[] have = new int[26];\n    foreach (char c in chars) have[c - 'a']++;\n    int total = 0;\n    foreach (string w in words)\n    {\n        int[] need = new int[26];\n        foreach (char c in w) need[c - 'a']++;\n        bool ok = true;\n        for (int c = 0; c < 26; c++)\n        {\n            if (need[c] > have[c]) { ok = false; break; }\n        }\n        if (ok) total += w.Length;\n    }\n    return total;\n}`,
        go: `func countCharacters(words []string, chars string) int {\n\thave := make([]int, 26)\n\tfor i := 0; i < len(chars); i++ {\n\t\thave[chars[i]-\'a\']++\n\t}\n\ttotal := 0\n\tfor _, w := range words {\n\t\tneed := make([]int, 26)\n\t\tfor i := 0; i < len(w); i++ {\n\t\t\tneed[w[i]-\'a\']++\n\t\t}\n\t\tok := true\n\t\tfor c := 0; c < 26; c++ {\n\t\t\tif need[c] > have[c] {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tif ok {\n\t\t\ttotal += len(w)\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun countCharacters(words: Array<String>, chars: String): Int {\n    val have = IntArray(26)\n    for (c in chars) have[c - \'a\']++\n    var total = 0\n    for (w in words) {\n        val need = IntArray(26)\n        for (c in w) need[c - \'a\']++\n        var ok = true\n        for (c in 0 until 26) {\n            if (need[c] > have[c]) {\n                ok = false\n                break\n            }\n        }\n        if (ok) total += w.length\n    }\n    return total\n}`,
        swift: `func countCharacters(_ words: [String], _ chars: String) -> Int {\n    var have = [Int](repeating: 0, count: 26)\n    for c in chars.utf8 { have[Int(c) - 97] += 1 }\n    var total = 0\n    for w in words {\n        var need = [Int](repeating: 0, count: 26)\n        for c in w.utf8 { need[Int(c) - 97] += 1 }\n        var ok = true\n        for c in 0..<26 where need[c] > have[c] {\n            ok = false\n            break\n        }\n        if ok { total += w.count }\n    }\n    return total\n}`,
        rust: `fn countCharacters(words: Vec<String>, chars: String) -> i32 {\n    let mut have = [0i32; 26];\n    for &c in chars.as_bytes() {\n        have[(c - b\'a\') as usize] += 1;\n    }\n    let mut total = 0i32;\n    for w in words.iter() {\n        let mut need = [0i32; 26];\n        for &c in w.as_bytes() {\n            need[(c - b\'a\') as usize] += 1;\n        }\n        let mut ok = true;\n        for c in 0..26 {\n            if need[c] > have[c] {\n                ok = false;\n                break;\n            }\n        }\n        if ok {\n            total += w.len() as i32;\n        }\n    }\n    total\n}`,
        php: `function countCharacters($words, $chars) {\n    $have = array_fill(0, 26, 0);\n    for ($i = 0; $i < strlen($chars); $i++) $have[ord($chars[$i]) - 97]++;\n    $total = 0;\n    foreach ($words as $w) {\n        $need = array_fill(0, 26, 0);\n        for ($i = 0; $i < strlen($w); $i++) $need[ord($w[$i]) - 97]++;\n        $ok = true;\n        for ($c = 0; $c < 26; $c++) {\n            if ($need[$c] > $have[$c]) { $ok = false; break; }\n        }\n        if ($ok) $total += strlen($w);\n    }\n    return $total;\n}`,
        ruby: `def countCharacters(words, chars)\n  have = Array.new(26, 0)\n  chars.each_byte { |b| have[b - 97] += 1 }\n  total = 0\n  words.each do |w|\n    need = Array.new(26, 0)\n    w.each_byte { |b| need[b - 97] += 1 }\n    total += w.length if (0...26).all? { |c| need[c] <= have[c] }\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Maximum Number of Words Found in Sentences (LC 2114) ────────
  (() => {
    const ref = (sentences: string[]) => {
      let best = 0;
      for (const s of sentences) {
        let words = 1;
        for (let i = 0; i < s.length; i++) { if (s.charAt(i) === " ") words++; }
        if (words > best) best = words;
      }
      return best;
    };
    return {
      slug: "maximum-number-of-words-found-in-sentences",
      title: "Maximum Number of Words Found in Sentences",
      difficulty: "EASY" as const,
      tags: ["String", "Array", "TCS", "Capgemini", "Accenture"],
      signature: { funcName: "mostWordsFound", params: [{ name: "sentences", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "A **sentence** is a list of words separated by single spaces, with no leading or trailing spaces.\n\nGiven an array `sentences`, return the maximum number of words that appear in any single sentence.",
        [
          { in: 'sentences = ["alice and bob love codekairo","i think so too","this is great thanks very much"]', out: "6", note: "The last sentence has six words." },
          { in: 'sentences = ["please wait","continue to fight","continue to win"]', out: "3" },
          { in: 'sentences = ["solo"]', out: "1" },
        ],
        ["1 <= sentences.length <= 100", "1 <= sentences[i].length <= 100", "Words are separated by single spaces with no leading or trailing space."]),
      hints: [
        "With single spaces and no padding, the word count is the space count plus one.",
        "No splitting is needed at all — just count the spaces.",
        "Track the running maximum as you go.",
      ],
      editorial: explain({
        idea: "The formatting guarantee turns counting words into counting separators: `n` single spaces split a sentence into exactly `n + 1` words.",
        steps: [
          "For each sentence, count the space characters.",
          "The word count is that plus one.",
          "Keep the largest value seen.",
        ],
        why: "Because there are no leading, trailing or repeated spaces, every space sits strictly between two words, so the separators and the gaps between words are in bijection.",
        time: "O(total characters)",
        space: "O(1)",
        pitfalls: [
          "Splitting on whitespace in a language that produces an empty leading token would be off by one on padded input — the guarantee is what makes the shortcut safe.",
          "Starting the count at 0 rather than 1 undercounts every sentence.",
        ],
      }),
      examples: [
        { input: '["alice and bob love codekairo","i think so too","this is great thanks very much"]', expectedOutput: "6" },
        { input: '["please wait","continue to fight","continue to win"]', expectedOutput: "3" },
        { input: '["solo"]', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const vocab = ["code", "kairo", "duel", "kata", "rank", "solve", "streak", "round"];
        const sentences = Array.from({ length: ri(rng, 1, 12) }, () =>
          Array.from({ length: ri(rng, 1, 10) }, () => pick(rng, vocab)).join(" "));
        return { input: fmtStrArr(sentences), expectedOutput: String(ref(sentences)) };
      },
      solutions: {
        python: `from typing import List\n\ndef mostWordsFound(sentences: List[str]) -> int:\n    return max(s.count(" ") + 1 for s in sentences)`,
        javascript: `var mostWordsFound = function(sentences) {\n    var best = 0;\n    for (var j = 0; j < sentences.length; j++) {\n        var s = sentences[j], words = 1;\n        for (var i = 0; i < s.length; i++) {\n            if (s.charAt(i) === " ") words++;\n        }\n        if (words > best) best = words;\n    }\n    return best;\n};`,
        typescript: `function mostWordsFound(sentences: string[]): number {\n    var best = 0;\n    for (var j = 0; j < sentences.length; j++) {\n        var s = sentences[j], words = 1;\n        for (var i = 0; i < s.length; i++) {\n            if (s.charAt(i) === " ") words++;\n        }\n        if (words > best) best = words;\n    }\n    return best;\n}`,
        java: `public static int mostWordsFound(String[] sentences) {\n    int best = 0;\n    for (String s : sentences) {\n        int words = 1;\n        for (int i = 0; i < s.length(); i++) {\n            if (s.charAt(i) == ' ') words++;\n        }\n        if (words > best) best = words;\n    }\n    return best;\n}`,
        cpp: `int mostWordsFound(vector<string>& sentences) {\n    int best = 0;\n    for (const string& s : sentences) {\n        int words = 1;\n        for (char c : s) {\n            if (c == ' ') words++;\n        }\n        if (words > best) best = words;\n    }\n    return best;\n}`,
        c: `int mostWordsFound(char** sentences, int sentencesSize) {\n    int best = 0;\n    for (int j = 0; j < sentencesSize; j++) {\n        int words = 1;\n        for (int i = 0; sentences[j][i]; i++) {\n            if (sentences[j][i] == ' ') words++;\n        }\n        if (words > best) best = words;\n    }\n    return best;\n}`,
        csharp: `public static int MostWordsFound(string[] sentences)\n{\n    int best = 0;\n    foreach (string s in sentences)\n    {\n        int words = 1;\n        foreach (char c in s)\n        {\n            if (c == ' ') words++;\n        }\n        if (words > best) best = words;\n    }\n    return best;\n}`,
        go: `func mostWordsFound(sentences []string) int {\n\tbest := 0\n\tfor _, s := range sentences {\n\t\twords := 1 + strings.Count(s, " ")\n\t\tif words > best {\n\t\t\tbest = words\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun mostWordsFound(sentences: Array<String>): Int {\n    var best = 0\n    for (s in sentences) {\n        var words = 1\n        for (c in s) if (c == \' \') words++\n        if (words > best) best = words\n    }\n    return best\n}`,
        swift: `func mostWordsFound(_ sentences: [String]) -> Int {\n    var best = 0\n    for s in sentences {\n        var words = 1\n        for c in s where c == " " { words += 1 }\n        if words > best { best = words }\n    }\n    return best\n}`,
        rust: `fn mostWordsFound(sentences: Vec<String>) -> i32 {\n    let mut best = 0i32;\n    for s in sentences.iter() {\n        let mut words = 1i32;\n        for &c in s.as_bytes() {\n            if c == b\' \' {\n                words += 1;\n            }\n        }\n        if words > best {\n            best = words;\n        }\n    }\n    best\n}`,
        php: `function mostWordsFound($sentences) {\n    $best = 0;\n    foreach ($sentences as $s) {\n        $words = 1 + substr_count($s, " ");\n        if ($words > $best) $best = $words;\n    }\n    return $best;\n}`,
        ruby: `def mostWordsFound(sentences)\n  sentences.map { |s| s.count(" ") + 1 }.max\nend`,
      },
    };
  })(),

  // ── Check If All Characters Have Equal Number of Occurrences (LC 1941) ──
  (() => {
    const ref = (s: string) => {
      const count = new Array(26).fill(0);
      for (let i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;
      let first = -1;
      for (let c = 0; c < 26; c++) {
        if (count[c] === 0) continue;
        if (first < 0) first = count[c];
        else if (count[c] !== first) return false;
      }
      return true;
    };
    return {
      slug: "check-if-all-characters-have-equal-number-of-occurrences",
      title: "Check if All Characters Have Equal Number of Occurrences",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Counting", "TCS", "Wipro", "Zoho"],
      signature: { funcName: "areOccurrencesEqual", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A string is **good** if every character that appears in it appears the same number of times.\n\nGiven `s`, return `true` if it is good.",
        [
          { in: 's = "abacbc"', out: "true", note: "a, b and c each appear twice." },
          { in: 's = "aaabb"', out: "false", note: "a appears three times and b twice." },
          { in: 's = "codekairo"', out: "false", note: "o appears twice, everything else once." },
        ],
        ["1 <= s.length <= 1000", "s consists of lowercase English letters."]),
      hints: [
        "Tally the 26 letters.",
        "Ignore letters with a count of 0 — they do not appear.",
        "Every non-zero count must equal the first non-zero count you saw.",
      ],
      editorial: explain({
        idea: "Tally the letters, then check that all non-zero tallies agree. The first non-zero tally becomes the reference value.",
        steps: [
          "Build `count[26]` from `s`.",
          "Scan the tallies, skipping zeros.",
          "Remember the first non-zero tally and reject as soon as another differs.",
        ],
        why: "The property is exactly 'the multiset of non-zero counts has one distinct value', and comparing every count against the first is the cheapest way to test that in one pass.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Including zero counts in the comparison rejects every string that does not use all 26 letters.",
          "Comparing `count[c]` against `count[0]` rather than the first *non-zero* tally fails whenever `'a'` is absent.",
        ],
      }),
      examples: [
        { input: '"abacbc"', expectedOutput: "true" },
        { input: '"aaabb"', expectedOutput: "false" },
        { input: '"codekairo"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcd";
        if (rng() < 0.35) {
          const per = ri(rng, 1, 4);
          const used = shuffle(rng, alphabet.split("")).slice(0, ri(rng, 1, 4));
          const chars: string[] = [];
          for (const c of used) { for (let t = 0; t < per; t++) chars.push(c); }
          const s = shuffle(rng, chars).join("");
          return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
        }
        const s = randLower(rng, 1, 25, alphabet);
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: `def areOccurrencesEqual(s: str) -> bool:\n    count = [0] * 26\n    for c in s:\n        count[ord(c) - 97] += 1\n    seen = [c for c in count if c > 0]\n    return all(c == seen[0] for c in seen)`,
        javascript: `var areOccurrencesEqual = function(s) {\n    var count = [];\n    for (var t = 0; t < 26; t++) count.push(0);\n    for (var i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;\n    var first = -1;\n    for (var c = 0; c < 26; c++) {\n        if (count[c] === 0) continue;\n        if (first < 0) first = count[c];\n        else if (count[c] !== first) return false;\n    }\n    return true;\n};`,
        typescript: `function areOccurrencesEqual(s: string): boolean {\n    var count: number[] = [];\n    for (var t = 0; t < 26; t++) count.push(0);\n    for (var i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;\n    var first = -1;\n    for (var c = 0; c < 26; c++) {\n        if (count[c] === 0) continue;\n        if (first < 0) first = count[c];\n        else if (count[c] !== first) return false;\n    }\n    return true;\n}`,
        java: `public static boolean areOccurrencesEqual(String s) {\n    int[] count = new int[26];\n    for (int i = 0; i < s.length(); i++) count[s.charAt(i) - 'a']++;\n    int first = -1;\n    for (int c = 0; c < 26; c++) {\n        if (count[c] == 0) continue;\n        if (first < 0) first = count[c];\n        else if (count[c] != first) return false;\n    }\n    return true;\n}`,
        cpp: `bool areOccurrencesEqual(string s) {\n    vector<int> count(26, 0);\n    for (char c : s) count[c - 'a']++;\n    int first = -1;\n    for (int c = 0; c < 26; c++) {\n        if (count[c] == 0) continue;\n        if (first < 0) first = count[c];\n        else if (count[c] != first) return false;\n    }\n    return true;\n}`,
        c: `bool areOccurrencesEqual(char* s) {\n    int count[26];\n    memset(count, 0, sizeof(count));\n    for (int i = 0; s[i]; i++) count[s[i] - 'a']++;\n    int first = -1;\n    for (int c = 0; c < 26; c++) {\n        if (count[c] == 0) continue;\n        if (first < 0) first = count[c];\n        else if (count[c] != first) return false;\n    }\n    return true;\n}`,
        csharp: `public static bool AreOccurrencesEqual(string s)\n{\n    int[] count = new int[26];\n    foreach (char c in s) count[c - 'a']++;\n    int first = -1;\n    for (int c = 0; c < 26; c++)\n    {\n        if (count[c] == 0) continue;\n        if (first < 0) first = count[c];\n        else if (count[c] != first) return false;\n    }\n    return true;\n}`,
        go: `func areOccurrencesEqual(s string) bool {\n\tcount := make([]int, 26)\n\tfor i := 0; i < len(s); i++ {\n\t\tcount[s[i]-\'a\']++\n\t}\n\tfirst := -1\n\tfor c := 0; c < 26; c++ {\n\t\tif count[c] == 0 {\n\t\t\tcontinue\n\t\t}\n\t\tif first < 0 {\n\t\t\tfirst = count[c]\n\t\t} else if count[c] != first {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun areOccurrencesEqual(s: String): Boolean {\n    val count = IntArray(26)\n    for (c in s) count[c - \'a\']++\n    var first = -1\n    for (c in 0 until 26) {\n        if (count[c] == 0) continue\n        if (first < 0) first = count[c]\n        else if (count[c] != first) return false\n    }\n    return true\n}`,
        swift: `func areOccurrencesEqual(_ s: String) -> Bool {\n    var count = [Int](repeating: 0, count: 26)\n    for c in s.utf8 { count[Int(c) - 97] += 1 }\n    var first = -1\n    for c in 0..<26 {\n        if count[c] == 0 { continue }\n        if first < 0 { first = count[c] }\n        else if count[c] != first { return false }\n    }\n    return true\n}`,
        rust: `fn areOccurrencesEqual(s: String) -> bool {\n    let mut count = [0i32; 26];\n    for &c in s.as_bytes() {\n        count[(c - b\'a\') as usize] += 1;\n    }\n    let mut first = -1i32;\n    for c in 0..26 {\n        if count[c] == 0 {\n            continue;\n        }\n        if first < 0 {\n            first = count[c];\n        } else if count[c] != first {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function areOccurrencesEqual($s) {\n    $count = array_fill(0, 26, 0);\n    for ($i = 0; $i < strlen($s); $i++) $count[ord($s[$i]) - 97]++;\n    $first = -1;\n    for ($c = 0; $c < 26; $c++) {\n        if ($count[$c] === 0) continue;\n        if ($first < 0) $first = $count[$c];\n        else if ($count[$c] !== $first) return false;\n    }\n    return true;\n}`,
        ruby: `def areOccurrencesEqual(s)\n  count = Array.new(26, 0)\n  s.each_byte { |b| count[b - 97] += 1 }\n  seen = count.select { |c| c > 0 }\n  seen.all? { |c| c == seen[0] }\nend`,
      },
    };
  })(),

  // ── Rings and Rods (LC 2103) ────────────────────────────────────
  (() => {
    const ref = (rings: string) => {
      const mask = new Array(10).fill(0);
      for (let i = 0; i + 1 < rings.length; i += 2) {
        const colour = rings.charAt(i);
        const rod = rings.charCodeAt(i + 1) - 48;
        const bit = colour === "R" ? 1 : colour === "G" ? 2 : 4;
        mask[rod] |= bit;
      }
      let total = 0;
      for (let r = 0; r < 10; r++) { if (mask[r] === 7) total++; }
      return total;
    };
    return {
      slug: "rings-and-rods",
      title: "Rings and Rods",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Bit Manipulation", "TCS", "Infosys", "Amazon"],
      signature: { funcName: "countPoints", params: [{ name: "rings", type: "string" as const }], returns: "int" as const },
      description: describe(
        "There are ten rods numbered `0` to `9`. The string `rings` describes the rings on them in pairs: a colour character (`'R'` red, `'G'` green, `'B'` blue) followed by the rod digit it sits on.\n\nReturn how many rods carry **all three** colours.",
        [
          { in: 'rings = "B0B6G0R6R0R6"', out: "1", note: "Rod 0 holds blue, green and red. Rod 6 holds only blue and red." },
          { in: 'rings = "R0G0B1"', out: "0", note: "Rod 0 is missing blue and rod 1 has only blue." },
          { in: 'rings = "G4"', out: "0" },
        ],
        ["rings.length is even", "2 <= rings.length <= 100", "Colours are R, G or B; rod digits are 0 through 9."]),
      hints: [
        "Walk the string two characters at a time — colour, then digit.",
        "Each rod needs a three-bit set: one bit per colour.",
        "A rod qualifies when its mask is `111` in binary, which is 7.",
      ],
      editorial: explain({
        idea: "Each rod's state is a set of at most three colours, which fits in three bits. Accumulate one bitmask per rod and count the rods whose mask is full.",
        steps: [
          "Step `i` through the string in increments of two: `rings[i]` is the colour, `rings[i+1]` the rod digit.",
          "OR the colour's bit (`1` for R, `2` for G, `4` for B) into `mask[rod]`.",
          "Count the rods whose mask equals `7`.",
        ],
        why: "Bitwise OR is idempotent, so repeated rings of the same colour on the same rod cost nothing, and a mask of `7` is exactly 'all three bits present'.",
        time: "O(n)",
        space: "O(1) — ten masks",
        pitfalls: [
          "Stepping by one rather than two reads digits as colours and vice versa.",
          "Counting rings per rod instead of distinct colours: three red rings on one rod is not three colours.",
        ],
      }),
      examples: [
        { input: '"B0B6G0R6R0R6"', expectedOutput: "1" },
        { input: '"R0G0B1"', expectedOutput: "0" },
        { input: '"G4"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const pairs = ri(rng, 1, 20);
        const rods = ri(rng, 1, 4);
        let rings = "";
        for (let i = 0; i < pairs; i++) rings += pick(rng, ["R", "G", "B"]) + String(ri(rng, 0, rods - 1));
        return { input: `"${rings}"`, expectedOutput: String(ref(rings)) };
      },
      solutions: {
        python: `def countPoints(rings: str) -> int:\n    mask = [0] * 10\n    bits = {"R": 1, "G": 2, "B": 4}\n    for i in range(0, len(rings) - 1, 2):\n        colour = rings[i]\n        rod = ord(rings[i + 1]) - 48\n        if colour in bits and 0 <= rod <= 9:\n            mask[rod] |= bits[colour]\n    return sum(1 for m in mask if m == 7)`,
        javascript: `var countPoints = function(rings) {\n    var mask = [];\n    for (var t = 0; t < 10; t++) mask.push(0);\n    for (var i = 0; i + 1 < rings.length; i += 2) {\n        var colour = rings.charAt(i);\n        var rod = rings.charCodeAt(i + 1) - 48;\n        var bit = colour === "R" ? 1 : (colour === "G" ? 2 : 4);\n        mask[rod] |= bit;\n    }\n    var total = 0;\n    for (var r = 0; r < 10; r++) {\n        if (mask[r] === 7) total++;\n    }\n    return total;\n};`,
        typescript: `function countPoints(rings: string): number {\n    var mask: number[] = [];\n    for (var t = 0; t < 10; t++) mask.push(0);\n    for (var i = 0; i + 1 < rings.length; i += 2) {\n        var colour = rings.charAt(i);\n        var rod = rings.charCodeAt(i + 1) - 48;\n        var bit = colour === "R" ? 1 : (colour === "G" ? 2 : 4);\n        mask[rod] |= bit;\n    }\n    var total = 0;\n    for (var r = 0; r < 10; r++) {\n        if (mask[r] === 7) total++;\n    }\n    return total;\n}`,
        java: `public static int countPoints(String rings) {\n    int[] mask = new int[10];\n    for (int i = 0; i + 1 < rings.length(); i += 2) {\n        char colour = rings.charAt(i);\n        int rod = rings.charAt(i + 1) - '0';\n        int bit = colour == 'R' ? 1 : (colour == 'G' ? 2 : 4);\n        if (rod >= 0 && rod <= 9) mask[rod] |= bit;\n    }\n    int total = 0;\n    for (int r = 0; r < 10; r++) {\n        if (mask[r] == 7) total++;\n    }\n    return total;\n}`,
        cpp: `int countPoints(string rings) {\n    vector<int> mask(10, 0);\n    for (int i = 0; i + 1 < (int) rings.size(); i += 2) {\n        char colour = rings[i];\n        int rod = rings[i + 1] - '0';\n        int bit = colour == 'R' ? 1 : (colour == 'G' ? 2 : 4);\n        if (rod >= 0 && rod <= 9) mask[rod] |= bit;\n    }\n    int total = 0;\n    for (int r = 0; r < 10; r++) {\n        if (mask[r] == 7) total++;\n    }\n    return total;\n}`,
        c: `int countPoints(char* rings) {\n    int mask[10];\n    memset(mask, 0, sizeof(mask));\n    int n = (int) strlen(rings);\n    for (int i = 0; i + 1 < n; i += 2) {\n        char colour = rings[i];\n        int rod = rings[i + 1] - '0';\n        int bit = colour == 'R' ? 1 : (colour == 'G' ? 2 : 4);\n        if (rod >= 0 && rod <= 9) mask[rod] |= bit;\n    }\n    int total = 0;\n    for (int r = 0; r < 10; r++) {\n        if (mask[r] == 7) total++;\n    }\n    return total;\n}`,
        csharp: `public static int CountPoints(string rings)\n{\n    int[] mask = new int[10];\n    for (int i = 0; i + 1 < rings.Length; i += 2)\n    {\n        char colour = rings[i];\n        int rod = rings[i + 1] - '0';\n        int bit = colour == 'R' ? 1 : (colour == 'G' ? 2 : 4);\n        if (rod >= 0 && rod <= 9) mask[rod] |= bit;\n    }\n    int total = 0;\n    for (int r = 0; r < 10; r++)\n    {\n        if (mask[r] == 7) total++;\n    }\n    return total;\n}`,
        go: `func countPoints(rings string) int {\n\tmask := make([]int, 10)\n\tfor i := 0; i+1 < len(rings); i += 2 {\n\t\tcolour := rings[i]\n\t\trod := int(rings[i+1] - \'0\')\n\t\tbit := 4\n\t\tif colour == \'R\' {\n\t\t\tbit = 1\n\t\t} else if colour == \'G\' {\n\t\t\tbit = 2\n\t\t}\n\t\tif rod >= 0 && rod <= 9 {\n\t\t\tmask[rod] |= bit\n\t\t}\n\t}\n\ttotal := 0\n\tfor r := 0; r < 10; r++ {\n\t\tif mask[r] == 7 {\n\t\t\ttotal++\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun countPoints(rings: String): Int {\n    val mask = IntArray(10)\n    var i = 0\n    while (i + 1 < rings.length) {\n        val colour = rings[i]\n        val rod = rings[i + 1] - \'0\'\n        val bit = if (colour == \'R\') 1 else if (colour == \'G\') 2 else 4\n        if (rod in 0..9) mask[rod] = mask[rod] or bit\n        i += 2\n    }\n    var total = 0\n    for (r in 0 until 10) if (mask[r] == 7) total++\n    return total\n}`,
        swift: `func countPoints(_ rings: String) -> Int {\n    let a = Array(rings)\n    var mask = [Int](repeating: 0, count: 10)\n    var i = 0\n    while i + 1 < a.count {\n        let colour = a[i]\n        let rod = Int(String(a[i + 1])) ?? -1\n        let bit = colour == "R" ? 1 : (colour == "G" ? 2 : 4)\n        if rod >= 0 && rod <= 9 { mask[rod] |= bit }\n        i += 2\n    }\n    var total = 0\n    for r in 0..<10 where mask[r] == 7 { total += 1 }\n    return total\n}`,
        rust: `fn countPoints(rings: String) -> i32 {\n    let b = rings.as_bytes();\n    let mut mask = [0i32; 10];\n    let mut i = 0usize;\n    while i + 1 < b.len() {\n        let colour = b[i];\n        let rod = (b[i + 1] - b\'0\') as usize;\n        let bit = if colour == b\'R\' { 1 } else if colour == b\'G\' { 2 } else { 4 };\n        if rod < 10 {\n            mask[rod] |= bit;\n        }\n        i += 2;\n    }\n    let mut total = 0;\n    for r in 0..10 {\n        if mask[r] == 7 {\n            total += 1;\n        }\n    }\n    total\n}`,
        php: `function countPoints($rings) {\n    $mask = array_fill(0, 10, 0);\n    $n = strlen($rings);\n    for ($i = 0; $i + 1 < $n; $i += 2) {\n        $colour = $rings[$i];\n        $rod = ord($rings[$i + 1]) - 48;\n        $bit = $colour === "R" ? 1 : ($colour === "G" ? 2 : 4);\n        if ($rod >= 0 && $rod <= 9) $mask[$rod] |= $bit;\n    }\n    $total = 0;\n    for ($r = 0; $r < 10; $r++) {\n        if ($mask[$r] === 7) $total++;\n    }\n    return $total;\n}`,
        ruby: `def countPoints(rings)\n  mask = Array.new(10, 0)\n  i = 0\n  while i + 1 < rings.length\n    colour = rings[i]\n    rod = rings[i + 1].ord - 48\n    bit = colour == "R" ? 1 : (colour == "G" ? 2 : 4)\n    mask[rod] |= bit if rod >= 0 && rod <= 9\n    i += 2\n  end\n  (0...10).count { |r| mask[r] == 7 }\nend`,
      },
    };
  })(),

  // ── Divide a String Into Groups of Size k (LC 2138) ─────────────
  (() => {
    const ref = (s: string, k: number, fill: string) => {
      const out: string[] = [];
      for (let i = 0; i < s.length; i += k) {
        let part = s.substr(i, k);
        while (part.length < k) part += fill;
        out.push(part);
      }
      return out;
    };
    return {
      slug: "divide-a-string-into-groups-of-size-k",
      title: "Divide a String Into Groups of Size k",
      difficulty: "EASY" as const,
      tags: ["String", "Simulation", "TCS", "Capgemini", "Cognizant"],
      signature: { funcName: "divideString", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }, { name: "fill", type: "string" as const }], returns: "string[]" as const },
      description: describe(
        "Split the string `s` into consecutive groups of exactly `k` characters, in order.\n\nIf the last group is short, pad it on the right with the character `fill` until it reaches length `k`. Return the groups.",
        [
          { in: 's = "codekairo", k = 4, fill = "x"', out: '["code","kair","oxxx"]', note: "The last group holds only o, so three x characters are appended." },
          { in: 's = "abcdefghi", k = 3, fill = "x"', out: '["abc","def","ghi"]', note: "The length divides evenly, so no padding is needed." },
          { in: 's = "ab", k = 5, fill = "z"', out: '["abzzz"]' },
        ],
        ["1 <= s.length <= 100", "1 <= k <= 100", "fill is a single lowercase letter", "s consists of lowercase English letters."]),
      hints: [
        "Step through `s` in strides of `k` and slice.",
        "The last slice may be short — pad it after cutting, not before.",
        "Only the final group can ever need padding.",
      ],
      editorial: explain({
        idea: "Cut the string at every multiple of `k`; at most the final piece is short, and padding it to length is a simple append loop.",
        steps: [
          "Loop `i = 0, k, 2k, …` while `i < s.length`.",
          "Take the slice starting at `i` of length up to `k`.",
          "While the slice is shorter than `k`, append `fill`.",
          "Collect the slices in order.",
        ],
        why: "Slices at multiples of `k` partition the string, and only the last can fall short because every earlier start has at least `k` characters remaining by construction.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Padding `s` to a multiple of `k` up front also works, but computing the pad length wrong adds a whole spurious group when the length already divides evenly.",
          "Prepending the fill instead of appending reverses the padded group.",
        ],
      }),
      examples: [
        { input: '"codekairo"\n4\n"x"', expectedOutput: '["code","kair","oxxx"]' },
        { input: '"abcdefghi"\n3\n"x"', expectedOutput: '["abc","def","ghi"]' },
        { input: '"ab"\n5\n"z"', expectedOutput: '["abzzz"]' },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 30);
        const k = ri(rng, 1, 8);
        const fill = pick(rng, ["x", "z", "q"]);
        return { input: `"${s}"\n${k}\n"${fill}"`, expectedOutput: fmtStrArr(ref(s, k, fill)) };
      },
      solutions: {
        python: `from typing import List\n\ndef divideString(s: str, k: int, fill: str) -> List[str]:\n    out = []\n    for i in range(0, len(s), k):\n        part = s[i:i + k]\n        part += fill * (k - len(part))\n        out.append(part)\n    return out`,
        javascript: `var divideString = function(s, k, fill) {\n    var out = [];\n    for (var i = 0; i < s.length; i += k) {\n        var part = s.substr(i, k);\n        while (part.length < k) part += fill;\n        out.push(part);\n    }\n    return out;\n};`,
        typescript: `function divideString(s: string, k: number, fill: string): string[] {\n    var out: string[] = [];\n    for (var i = 0; i < s.length; i += k) {\n        var part = s.substr(i, k);\n        while (part.length < k) part += fill;\n        out.push(part);\n    }\n    return out;\n}`,
        java: `public static String[] divideString(String s, int k, String fill) {\n    List<String> out = new ArrayList<>();\n    for (int i = 0; i < s.length(); i += k) {\n        StringBuilder part = new StringBuilder(s.substring(i, Math.min(i + k, s.length())));\n        while (part.length() < k) part.append(fill);\n        out.add(part.toString());\n    }\n    return out.toArray(new String[0]);\n}`,
        cpp: `vector<string> divideString(string s, int k, string fill) {\n    vector<string> out;\n    for (int i = 0; i < (int) s.size(); i += k) {\n        string part = s.substr(i, k);\n        while ((int) part.size() < k) part += fill;\n        out.push_back(part);\n    }\n    return out;\n}`,
        c: `char** divideString(char* s, int k, char* fill, int* returnSize) {\n    int n = (int) strlen(s);\n    int groups = (n + k - 1) / k;\n    char** out = (char**) malloc((size_t) (groups > 0 ? groups : 1) * sizeof(char*));\n    for (int g = 0; g < groups; g++) {\n        char* part = (char*) malloc((size_t) k + 1);\n        for (int j = 0; j < k; j++) {\n            int idx = g * k + j;\n            part[j] = idx < n ? s[idx] : fill[0];\n        }\n        part[k] = 0;\n        out[g] = part;\n    }\n    *returnSize = groups;\n    return out;\n}`,
        csharp: `public static string[] DivideString(string s, int k, string fill)\n{\n    var out_ = new List<string>();\n    for (int i = 0; i < s.Length; i += k)\n    {\n        var part = new System.Text.StringBuilder(s.Substring(i, Math.Min(k, s.Length - i)));\n        while (part.Length < k) part.Append(fill);\n        out_.Add(part.ToString());\n    }\n    return out_.ToArray();\n}`,
        go: `func divideString(s string, k int, fill string) []string {\n\tout := []string{}\n\tfor i := 0; i < len(s); i += k {\n\t\tend := i + k\n\t\tif end > len(s) {\n\t\t\tend = len(s)\n\t\t}\n\t\tpart := s[i:end]\n\t\tfor len(part) < k {\n\t\t\tpart += fill\n\t\t}\n\t\tout = append(out, part)\n\t}\n\treturn out\n}`,
        kotlin: `fun divideString(s: String, k: Int, fill: String): Array<String> {\n    val out = ArrayList<String>()\n    var i = 0\n    while (i < s.length) {\n        val sb = StringBuilder(s.substring(i, minOf(i + k, s.length)))\n        while (sb.length < k) sb.append(fill)\n        out.add(sb.toString())\n        i += k\n    }\n    return out.toTypedArray()\n}`,
        swift: `func divideString(_ s: String, _ k: Int, _ fill: String) -> [String] {\n    let a = Array(s)\n    var out: [String] = []\n    var i = 0\n    while i < a.count {\n        var part = String(a[i..<min(i + k, a.count)])\n        while part.count < k { part += fill }\n        out.append(part)\n        i += k\n    }\n    return out\n}`,
        rust: `fn divideString(s: String, k: i32, fill: String) -> Vec<String> {\n    let b = s.as_bytes();\n    let k = k as usize;\n    let pad = fill.as_bytes()[0];\n    let mut out: Vec<String> = Vec::new();\n    let mut i = 0usize;\n    while i < b.len() {\n        let mut part: Vec<u8> = Vec::new();\n        for j in 0..k {\n            if i + j < b.len() {\n                part.push(b[i + j]);\n            } else {\n                part.push(pad);\n            }\n        }\n        out.push(String::from_utf8(part).unwrap());\n        i += k;\n    }\n    out\n}`,
        php: `function divideString($s, $k, $fill) {\n    $out = array();\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i += $k) {\n        $part = substr($s, $i, $k);\n        while (strlen($part) < $k) $part .= $fill;\n        $out[] = $part;\n    }\n    return $out;\n}`,
        ruby: `def divideString(s, k, fill)\n  out = []\n  i = 0\n  while i < s.length\n    part = s[i, k]\n    part += fill while part.length < k\n    out << part\n    i += k\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Largest Unique Number (LC 1133) ─────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const count: Record<string, number> = {};
      for (const x of nums) count[String(x)] = (count[String(x)] === undefined ? 0 : count[String(x)]) + 1;
      let best = -1;
      for (const k of Object.keys(count)) {
        if (count[k] === 1) {
          const v = Number(k);
          if (v > best) best = v;
        }
      }
      return best;
    };
    return {
      slug: "largest-unique-number",
      title: "Largest Unique Number",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "Array", "Sorting", "TCS", "Amazon", "Zoho"],
      signature: { funcName: "largestUniqueNumber", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums`, return the largest value that appears **exactly once**.\n\nIf every value repeats, return `-1`.",
        [
          { in: "nums = [5,7,3,9,4,9,8,3,1]", out: "8", note: "9 and 3 repeat; among the rest 8 is the largest." },
          { in: "nums = [9,9,8,8]", out: "-1", note: "Nothing appears exactly once." },
          { in: "nums = [0]", out: "0" },
        ],
        ["1 <= nums.length <= 2000", "0 <= nums[i] <= 1000"]),
      hints: [
        "Tally the values first — you cannot know a value is unique until the whole array is read.",
        "Then scan the tallies for entries equal to 1 and keep the largest key.",
        "The values are small and non-negative, so a counting array works as well as a hash map.",
      ],
      editorial: explain({
        idea: "Uniqueness is a global property, so it needs a full tally before any decision. A second pass over the tallies then picks the largest key with a count of one.",
        steps: [
          "Count occurrences of every value.",
          "Walk the counts and consider only the values whose count is exactly 1.",
          "Return the largest such value, or `-1` if there is none.",
        ],
        why: "A single pass cannot decide uniqueness, because a later duplicate would invalidate an earlier decision — which is why the two-pass structure is essential here.",
        time: "O(n + V)",
        space: "O(V)",
        pitfalls: [
          "Returning the first unique value found rather than the largest.",
          "`0` is a legitimate answer, so `-1` must be the sentinel, not `0`.",
        ],
      }),
      examples: [
        { input: "[5,7,3,9,4,9,8,3,1]", expectedOutput: "8" },
        { input: "[9,9,8,8]", expectedOutput: "-1" },
        { input: "[0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const hi = rng() < 0.5 ? 8 : 1000;
        const nums = Array.from({ length: n }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef largestUniqueNumber(nums: List[int]) -> int:\n    count = {}\n    for x in nums:\n        count[x] = count.get(x, 0) + 1\n    best = -1\n    for v, c in count.items():\n        if c == 1 and v > best:\n            best = v\n    return best`,
        javascript: `var largestUniqueNumber = function(nums) {\n    var count = {};\n    for (var i = 0; i < nums.length; i++) {\n        var k = String(nums[i]);\n        count[k] = (count[k] === undefined ? 0 : count[k]) + 1;\n    }\n    var best = -1;\n    var keys = Object.keys(count);\n    for (var j = 0; j < keys.length; j++) {\n        if (count[keys[j]] === 1) {\n            var v = Number(keys[j]);\n            if (v > best) best = v;\n        }\n    }\n    return best;\n};`,
        typescript: `function largestUniqueNumber(nums: number[]): number {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var k = String(nums[i]);\n        count[k] = (count[k] === undefined ? 0 : count[k]) + 1;\n    }\n    var best = -1;\n    var keys = Object.keys(count);\n    for (var j = 0; j < keys.length; j++) {\n        if (count[keys[j]] === 1) {\n            var v = Number(keys[j]);\n            if (v > best) best = v;\n        }\n    }\n    return best;\n}`,
        java: `public static int largestUniqueNumber(int[] nums) {\n    int[] count = new int[1001];\n    for (int x : nums) count[x]++;\n    int best = -1;\n    for (int v = 0; v <= 1000; v++) {\n        if (count[v] == 1) best = v;\n    }\n    return best;\n}`,
        cpp: `int largestUniqueNumber(vector<int>& nums) {\n    vector<int> count(1001, 0);\n    for (int x : nums) count[x]++;\n    int best = -1;\n    for (int v = 0; v <= 1000; v++) {\n        if (count[v] == 1) best = v;\n    }\n    return best;\n}`,
        c: `int largestUniqueNumber(int* nums, int numsSize) {\n    int count[1001];\n    memset(count, 0, sizeof(count));\n    for (int i = 0; i < numsSize; i++) count[nums[i]]++;\n    int best = -1;\n    for (int v = 0; v <= 1000; v++) {\n        if (count[v] == 1) best = v;\n    }\n    return best;\n}`,
        csharp: `public static int LargestUniqueNumber(int[] nums)\n{\n    int[] count = new int[1001];\n    foreach (int x in nums) count[x]++;\n    int best = -1;\n    for (int v = 0; v <= 1000; v++)\n    {\n        if (count[v] == 1) best = v;\n    }\n    return best;\n}`,
        go: `func largestUniqueNumber(nums []int) int {\n\tcount := make([]int, 1001)\n\tfor _, x := range nums {\n\t\tcount[x]++\n\t}\n\tbest := -1\n\tfor v := 0; v <= 1000; v++ {\n\t\tif count[v] == 1 {\n\t\t\tbest = v\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun largestUniqueNumber(nums: IntArray): Int {\n    val count = IntArray(1001)\n    for (x in nums) count[x]++\n    var best = -1\n    for (v in 0..1000) {\n        if (count[v] == 1) best = v\n    }\n    return best\n}`,
        swift: `func largestUniqueNumber(_ nums: [Int]) -> Int {\n    var count = [Int](repeating: 0, count: 1001)\n    for x in nums { count[x] += 1 }\n    var best = -1\n    for v in 0...1000 where count[v] == 1 { best = v }\n    return best\n}`,
        rust: `fn largestUniqueNumber(nums: Vec<i32>) -> i32 {\n    let mut count = vec![0i32; 1001];\n    for &x in nums.iter() {\n        count[x as usize] += 1;\n    }\n    let mut best = -1i32;\n    for v in 0..=1000 {\n        if count[v] == 1 {\n            best = v as i32;\n        }\n    }\n    best\n}`,
        php: `function largestUniqueNumber($nums) {\n    $count = array_fill(0, 1001, 0);\n    foreach ($nums as $x) $count[$x]++;\n    $best = -1;\n    for ($v = 0; $v <= 1000; $v++) {\n        if ($count[$v] === 1) $best = $v;\n    }\n    return $best;\n}`,
        ruby: `def largestUniqueNumber(nums)\n  count = Hash.new(0)\n  nums.each { |x| count[x] += 1 }\n  best = -1\n  count.each { |v, c| best = v if c == 1 && v > best }\n  best\nend`,
      },
    };
  })(),

  // ── Counting Elements (LC 1426) ─────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const present: Record<string, boolean> = {};
      for (const x of arr) present[String(x)] = true;
      let total = 0;
      for (const x of arr) { if (present[String(x + 1)] === true) total++; }
      return total;
    };
    return {
      slug: "counting-elements",
      title: "Counting Elements",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "Array", "Counting", "Amazon", "TCS", "Accenture"],
      signature: { funcName: "countElements", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `arr`, count the elements `x` such that `x + 1` also appears somewhere in `arr`.\n\nDuplicates are counted separately: if `arr` holds `1` twice and also holds `2`, both copies of `1` count.",
        [
          { in: "arr = [1,2,3]", out: "2", note: "1 and 2 both have a successor present." },
          { in: "arr = [1,1,3,3,5,5,7,7]", out: "0", note: "No value has its successor in the array." },
          { in: "arr = [1,3,2,3,5,0]", out: "3", note: "0, 1 and 2 each have a successor." },
        ],
        ["1 <= arr.length <= 1000", "0 <= arr[i] <= 1000"]),
      hints: [
        "Membership is what matters for `x + 1`, but **multiplicity** matters for `x`.",
        "So build a set once, then walk the original array — not the set.",
        "Walking the set instead would count each distinct value only once.",
      ],
      editorial: explain({
        idea: "Two different notions are in play: `x + 1` only needs to exist, while each copy of `x` counts on its own. A set answers the first, and iterating the original array answers the second.",
        steps: [
          "Insert every element into a set.",
          "Walk the **original array** and count the elements whose successor is in the set.",
        ],
        why: "Testing `x + 1` against a set is a pure existence question, so duplicates there are irrelevant; counting over the array rather than the set is what preserves the multiplicity the statement asks for.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Iterating the set loses duplicates — `[1,1,2]` would answer 1 instead of 2.",
          "Checking `x - 1` answers the mirror-image question.",
        ],
      }),
      examples: [
        { input: "[1,2,3]", expectedOutput: "2" },
        { input: "[1,1,3,3,5,5,7,7]", expectedOutput: "0" },
        { input: "[1,3,2,3,5,0]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const hi = rng() < 0.5 ? 6 : 1000;
        const arr = Array.from({ length: n }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countElements(arr: List[int]) -> int:\n    present = set(arr)\n    return sum(1 for x in arr if x + 1 in present)`,
        javascript: `var countElements = function(arr) {\n    var present = {};\n    for (var i = 0; i < arr.length; i++) present[String(arr[i])] = true;\n    var total = 0;\n    for (var j = 0; j < arr.length; j++) {\n        if (present[String(arr[j] + 1)] === true) total++;\n    }\n    return total;\n};`,
        typescript: `function countElements(arr: number[]): number {\n    var present: { [key: string]: boolean } = {};\n    for (var i = 0; i < arr.length; i++) present[String(arr[i])] = true;\n    var total = 0;\n    for (var j = 0; j < arr.length; j++) {\n        if (present[String(arr[j] + 1)] === true) total++;\n    }\n    return total;\n}`,
        java: `public static int countElements(int[] arr) {\n    Set<Integer> present = new HashSet<>();\n    for (int x : arr) present.add(x);\n    int total = 0;\n    for (int x : arr) {\n        if (present.contains(x + 1)) total++;\n    }\n    return total;\n}`,
        cpp: `int countElements(vector<int>& arr) {\n    unordered_set<int> present(arr.begin(), arr.end());\n    int total = 0;\n    for (int x : arr) {\n        if (present.count(x + 1)) total++;\n    }\n    return total;\n}`,
        c: `int countElements(int* arr, int arrSize) {\n    int present[1002];\n    memset(present, 0, sizeof(present));\n    for (int i = 0; i < arrSize; i++) present[arr[i]] = 1;\n    int total = 0;\n    for (int i = 0; i < arrSize; i++) {\n        if (arr[i] + 1 <= 1001 && present[arr[i] + 1]) total++;\n    }\n    return total;\n}`,
        csharp: `public static int CountElements(int[] arr)\n{\n    var present = new HashSet<int>(arr);\n    int total = 0;\n    foreach (int x in arr)\n    {\n        if (present.Contains(x + 1)) total++;\n    }\n    return total;\n}`,
        go: `func countElements(arr []int) int {\n\tpresent := map[int]bool{}\n\tfor _, x := range arr {\n\t\tpresent[x] = true\n\t}\n\ttotal := 0\n\tfor _, x := range arr {\n\t\tif present[x+1] {\n\t\t\ttotal++\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun countElements(arr: IntArray): Int {\n    val present = arr.toHashSet()\n    var total = 0\n    for (x in arr) {\n        if (present.contains(x + 1)) total++\n    }\n    return total\n}`,
        swift: `func countElements(_ arr: [Int]) -> Int {\n    let present = Set(arr)\n    var total = 0\n    for x in arr where present.contains(x + 1) { total += 1 }\n    return total\n}`,
        rust: `fn countElements(arr: Vec<i32>) -> i32 {\n    let present: std::collections::HashSet<i32> = arr.iter().cloned().collect();\n    let mut total = 0;\n    for &x in arr.iter() {\n        if present.contains(&(x + 1)) {\n            total += 1;\n        }\n    }\n    total\n}`,
        php: `function countElements($arr) {\n    $present = array();\n    foreach ($arr as $x) $present[$x] = true;\n    $total = 0;\n    foreach ($arr as $x) {\n        if (isset($present[$x + 1])) $total++;\n    }\n    return $total;\n}`,
        ruby: `def countElements(arr)\n  present = {}\n  arr.each { |x| present[x] = true }\n  arr.count { |x| present[x + 1] }\nend`,
      },
    };
  })(),

  // ── Number of Lines To Write String (LC 806) ────────────────────
  (() => {
    const ref = (widths: number[], s: string) => {
      let lines = 1, used = 0;
      for (let i = 0; i < s.length; i++) {
        const w = widths[s.charCodeAt(i) - 97];
        if (used + w > 100) { lines++; used = 0; }
        used += w;
      }
      return [lines, used];
    };
    return {
      slug: "number-of-lines-to-write-string",
      title: "Number of Lines To Write String",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Simulation", "TCS", "Infosys", "Adobe"],
      signature: { funcName: "numberOfLines", params: [{ name: "widths", type: "int[]" as const }, { name: "s", type: "string" as const }], returns: "int[]" as const },
      description: describe(
        "You are writing `s` across lines that are at most **100 units** wide. `widths[0]` is the width of `'a'`, `widths[1]` of `'b'`, and so on.\n\nWrite the characters in order, moving to a new line whenever the next character would push the current line past 100 units. Return `[numberOfLines, widthOfLastLine]`.",
        [
          { in: 'widths = [10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10], s = "abcdefghijklmnopqrstuvwxyz"', out: "[3,60]", note: "Ten characters fill a line exactly; the third line holds the last six." },
          { in: 'widths = [4,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10], s = "bbbcccdddaaa"', out: "[2,4]", note: "The narrow a lets eleven characters fit on the first line." },
          { in: 'widths = [5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5], s = "ab"', out: "[1,10]" },
        ],
        ["widths.length == 26", "2 <= widths[i] <= 10", "1 <= s.length <= 1000", "s consists of lowercase English letters."]),
      hints: [
        "Simulate: carry the width used on the current line.",
        "Break **before** adding a character that would overflow, not after.",
        "The answer's second component is whatever is left on the final line.",
      ],
      editorial: explain({
        idea: "Straight simulation. The only decision per character is whether it still fits, and that decision must be made before the character is placed.",
        steps: [
          "Start on line 1 with 0 units used.",
          "For each character, look up its width. If `used + width > 100`, start a new line with 0 used.",
          "Add the width to `used`.",
          "Return `[lines, used]`.",
        ],
        why: "Greedy placement is forced — the statement gives no choice about where characters go, so the simulation is the definition.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Adding the width first and then checking for overflow miscounts the line the character lands on.",
          "Using `>= 100` breaks a line that is exactly full, which is still legal.",
          "Starting the line counter at 0 undercounts by one for any non-empty string.",
        ],
      }),
      examples: [
        { input: "[10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10]\n\"abcdefghijklmnopqrstuvwxyz\"", expectedOutput: "[3,60]" },
        { input: "[4,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10]\n\"bbbcccdddaaa\"", expectedOutput: "[2,4]" },
        { input: "[5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5,5]\n\"ab\"", expectedOutput: "[1,10]" },
      ],
      gen: (rng: Rng) => {
        const widths = Array.from({ length: 26 }, () => ri(rng, 2, 10));
        const s = randLower(rng, 1, 60);
        return { input: `${fmtIntArr(widths)}\n"${s}"`, expectedOutput: fmtIntArr(ref(widths, s)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numberOfLines(widths: List[int], s: str) -> List[int]:\n    lines, used = 1, 0\n    for c in s:\n        w = widths[ord(c) - 97]\n        if used + w > 100:\n            lines += 1\n            used = 0\n        used += w\n    return [lines, used]`,
        javascript: `var numberOfLines = function(widths, s) {\n    var lines = 1, used = 0;\n    for (var i = 0; i < s.length; i++) {\n        var w = widths[s.charCodeAt(i) - 97];\n        if (used + w > 100) { lines++; used = 0; }\n        used += w;\n    }\n    return [lines, used];\n};`,
        typescript: `function numberOfLines(widths: number[], s: string): number[] {\n    var lines = 1, used = 0;\n    for (var i = 0; i < s.length; i++) {\n        var w = widths[s.charCodeAt(i) - 97];\n        if (used + w > 100) { lines++; used = 0; }\n        used += w;\n    }\n    return [lines, used];\n}`,
        java: `public static int[] numberOfLines(int[] widths, String s) {\n    int lines = 1, used = 0;\n    for (int i = 0; i < s.length(); i++) {\n        int w = widths[s.charAt(i) - 'a'];\n        if (used + w > 100) { lines++; used = 0; }\n        used += w;\n    }\n    return new int[] { lines, used };\n}`,
        cpp: `vector<int> numberOfLines(vector<int>& widths, string s) {\n    int lines = 1, used = 0;\n    for (char c : s) {\n        int w = widths[c - 'a'];\n        if (used + w > 100) { lines++; used = 0; }\n        used += w;\n    }\n    return { lines, used };\n}`,
        c: `int* numberOfLines(int* widths, int widthsSize, char* s, int* returnSize) {\n    int lines = 1, used = 0;\n    for (int i = 0; s[i]; i++) {\n        int w = widths[s[i] - 'a'];\n        if (used + w > 100) { lines++; used = 0; }\n        used += w;\n    }\n    int* out = (int*) malloc(2 * sizeof(int));\n    out[0] = lines;\n    out[1] = used;\n    *returnSize = 2;\n    return out;\n}`,
        csharp: `public static int[] NumberOfLines(int[] widths, string s)\n{\n    int lines = 1, used = 0;\n    foreach (char c in s)\n    {\n        int w = widths[c - 'a'];\n        if (used + w > 100) { lines++; used = 0; }\n        used += w;\n    }\n    return new int[] { lines, used };\n}`,
        go: `func numberOfLines(widths []int, s string) []int {\n\tlines, used := 1, 0\n\tfor i := 0; i < len(s); i++ {\n\t\tw := widths[s[i]-\'a\']\n\t\tif used+w > 100 {\n\t\t\tlines++\n\t\t\tused = 0\n\t\t}\n\t\tused += w\n\t}\n\treturn []int{lines, used}\n}`,
        kotlin: `fun numberOfLines(widths: IntArray, s: String): IntArray {\n    var lines = 1\n    var used = 0\n    for (c in s) {\n        val w = widths[c - \'a\']\n        if (used + w > 100) {\n            lines++\n            used = 0\n        }\n        used += w\n    }\n    return intArrayOf(lines, used)\n}`,
        swift: `func numberOfLines(_ widths: [Int], _ s: String) -> [Int] {\n    var lines = 1\n    var used = 0\n    for c in s.utf8 {\n        let w = widths[Int(c) - 97]\n        if used + w > 100 {\n            lines += 1\n            used = 0\n        }\n        used += w\n    }\n    return [lines, used]\n}`,
        rust: `fn numberOfLines(widths: Vec<i32>, s: String) -> Vec<i32> {\n    let mut lines = 1i32;\n    let mut used = 0i32;\n    for &c in s.as_bytes() {\n        let w = widths[(c - b\'a\') as usize];\n        if used + w > 100 {\n            lines += 1;\n            used = 0;\n        }\n        used += w;\n    }\n    vec![lines, used]\n}`,
        php: `function numberOfLines($widths, $s) {\n    $lines = 1;\n    $used = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        $w = $widths[ord($s[$i]) - 97];\n        if ($used + $w > 100) { $lines++; $used = 0; }\n        $used += $w;\n    }\n    return array($lines, $used);\n}`,
        ruby: `def numberOfLines(widths, s)\n  lines = 1\n  used = 0\n  s.each_byte do |b|\n    w = widths[b - 97]\n    if used + w > 100\n      lines += 1\n      used = 0\n    end\n    used += w\n  end\n  [lines, used]\nend`,
      },
    };
  })(),

  // ── Check if The Number is Fascinating (LC 2729) ────────────────
  (() => {
    const ref = (n: number) => {
      const joined = String(n) + String(2 * n) + String(3 * n);
      if (joined.length !== 9) return false;
      const seen = new Array(10).fill(0);
      for (let i = 0; i < joined.length; i++) seen[joined.charCodeAt(i) - 48]++;
      if (seen[0] !== 0) return false;
      for (let d = 1; d <= 9; d++) { if (seen[d] !== 1) return false; }
      return true;
    };
    return {
      slug: "check-if-the-number-is-fascinating",
      title: "Check if The Number is Fascinating",
      difficulty: "EASY" as const,
      tags: ["Math", "Hash Table", "String", "TCS", "Wipro", "Cognizant"],
      signature: { funcName: "isFascinating", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "A three-digit number `n` is **fascinating** if, after concatenating `n`, `2 * n` and `3 * n` into one string, the result contains each digit from `1` to `9` **exactly once** and contains no `0`.\n\nReturn `true` if `n` is fascinating.",
        [
          { in: "n = 192", out: "true", note: "192, 384 and 576 concatenate to 192384576, which uses 1 through 9 once each." },
          { in: "n = 100", out: "false", note: "100200300 is full of zeros." },
          { in: "n = 583", out: "false", note: "583, 1166 and 1749 concatenate to eleven digits, so the count is already wrong." },
        ],
        ["100 <= n <= 999"]),
      hints: [
        "Build the concatenation as a string — that is the cleanest way to inspect the digits.",
        "The result must be exactly nine characters long; anything else fails immediately.",
        "Tally the ten digits: `0` must be absent and each of `1..9` must appear once.",
      ],
      editorial: explain({
        idea: "The property is stated directly in terms of the digit string, so build it and tally. The length check is a cheap early exit that also guards against `3 * n` growing to four digits.",
        steps: [
          "Concatenate the decimal forms of `n`, `2 * n` and `3 * n`.",
          "If the result is not nine characters long, return `false`.",
          "Tally the digits; reject if any `0` appears or if any digit `1..9` does not appear exactly once.",
        ],
        why: "Nine characters holding the nine non-zero digits once each is exactly the definition, and checking the length first means the tally never has to reason about repeated digits in an over-long string.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Skipping the length check lets a four-digit `3 * n` slip through with a coincidentally valid tally prefix.",
          "Checking only for duplicates misses a missing digit, and vice versa — both conditions are needed.",
        ],
      }),
      examples: [
        { input: "192", expectedOutput: "true" },
        { input: "100", expectedOutput: "false" },
        { input: "583", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.15 ? pick(rng, [192, 219, 273, 327, 327, 219]) : ri(rng, 100, 999);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def isFascinating(n: int) -> bool:\n    joined = str(n) + str(2 * n) + str(3 * n)\n    if len(joined) != 9:\n        return False\n    return sorted(joined) == list("123456789")`,
        javascript: `var isFascinating = function(n) {\n    var joined = String(n) + String(2 * n) + String(3 * n);\n    if (joined.length !== 9) return false;\n    var seen = [];\n    for (var t = 0; t < 10; t++) seen.push(0);\n    for (var i = 0; i < joined.length; i++) seen[joined.charCodeAt(i) - 48]++;\n    if (seen[0] !== 0) return false;\n    for (var d = 1; d <= 9; d++) {\n        if (seen[d] !== 1) return false;\n    }\n    return true;\n};`,
        typescript: `function isFascinating(n: number): boolean {\n    var joined = String(n) + String(2 * n) + String(3 * n);\n    if (joined.length !== 9) return false;\n    var seen: number[] = [];\n    for (var t = 0; t < 10; t++) seen.push(0);\n    for (var i = 0; i < joined.length; i++) seen[joined.charCodeAt(i) - 48]++;\n    if (seen[0] !== 0) return false;\n    for (var d = 1; d <= 9; d++) {\n        if (seen[d] !== 1) return false;\n    }\n    return true;\n}`,
        java: `public static boolean isFascinating(int n) {\n    String joined = "" + n + (2 * n) + (3 * n);\n    if (joined.length() != 9) return false;\n    int[] seen = new int[10];\n    for (int i = 0; i < joined.length(); i++) seen[joined.charAt(i) - '0']++;\n    if (seen[0] != 0) return false;\n    for (int d = 1; d <= 9; d++) {\n        if (seen[d] != 1) return false;\n    }\n    return true;\n}`,
        cpp: `bool isFascinating(int n) {\n    string joined = to_string(n) + to_string(2 * n) + to_string(3 * n);\n    if (joined.size() != 9) return false;\n    vector<int> seen(10, 0);\n    for (char c : joined) seen[c - '0']++;\n    if (seen[0] != 0) return false;\n    for (int d = 1; d <= 9; d++) {\n        if (seen[d] != 1) return false;\n    }\n    return true;\n}`,
        c: `bool isFascinating(int n) {\n    char joined[32];\n    sprintf(joined, "%d%d%d", n, 2 * n, 3 * n);\n    if ((int) strlen(joined) != 9) return false;\n    int seen[10];\n    memset(seen, 0, sizeof(seen));\n    for (int i = 0; joined[i]; i++) seen[joined[i] - '0']++;\n    if (seen[0] != 0) return false;\n    for (int d = 1; d <= 9; d++) {\n        if (seen[d] != 1) return false;\n    }\n    return true;\n}`,
        csharp: `public static bool IsFascinating(int n)\n{\n    string joined = n.ToString() + (2 * n).ToString() + (3 * n).ToString();\n    if (joined.Length != 9) return false;\n    int[] seen = new int[10];\n    foreach (char c in joined) seen[c - '0']++;\n    if (seen[0] != 0) return false;\n    for (int d = 1; d <= 9; d++)\n    {\n        if (seen[d] != 1) return false;\n    }\n    return true;\n}`,
        go: `func isFascinating(n int) bool {\n\tjoined := strconv.Itoa(n) + strconv.Itoa(2*n) + strconv.Itoa(3*n)\n\tif len(joined) != 9 {\n\t\treturn false\n\t}\n\tseen := make([]int, 10)\n\tfor i := 0; i < len(joined); i++ {\n\t\tseen[joined[i]-\'0\']++\n\t}\n\tif seen[0] != 0 {\n\t\treturn false\n\t}\n\tfor d := 1; d <= 9; d++ {\n\t\tif seen[d] != 1 {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun isFascinating(n: Int): Boolean {\n    val joined = "" + n + (2 * n) + (3 * n)\n    if (joined.length != 9) return false\n    val seen = IntArray(10)\n    for (c in joined) seen[c - \'0\']++\n    if (seen[0] != 0) return false\n    for (d in 1..9) {\n        if (seen[d] != 1) return false\n    }\n    return true\n}`,
        swift: `func isFascinating(_ n: Int) -> Bool {\n    let joined = String(n) + String(2 * n) + String(3 * n)\n    if joined.count != 9 { return false }\n    var seen = [Int](repeating: 0, count: 10)\n    for c in joined.utf8 { seen[Int(c) - 48] += 1 }\n    if seen[0] != 0 { return false }\n    for d in 1...9 where seen[d] != 1 { return false }\n    return true\n}`,
        rust: `fn isFascinating(n: i32) -> bool {\n    let joined = format!("{}{}{}", n, 2 * n, 3 * n);\n    if joined.len() != 9 {\n        return false;\n    }\n    let mut seen = [0i32; 10];\n    for &c in joined.as_bytes() {\n        seen[(c - b\'0\') as usize] += 1;\n    }\n    if seen[0] != 0 {\n        return false;\n    }\n    for d in 1..=9 {\n        if seen[d] != 1 {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function isFascinating($n) {\n    $joined = strval($n) . strval(2 * $n) . strval(3 * $n);\n    if (strlen($joined) !== 9) return false;\n    $seen = array_fill(0, 10, 0);\n    for ($i = 0; $i < 9; $i++) $seen[intval($joined[$i])]++;\n    if ($seen[0] !== 0) return false;\n    for ($d = 1; $d <= 9; $d++) {\n        if ($seen[$d] !== 1) return false;\n    }\n    return true;\n}`,
        ruby: `def isFascinating(n)\n  joined = n.to_s + (2 * n).to_s + (3 * n).to_s\n  return false if joined.length != 9\n  joined.chars.sort.join == "123456789"\nend`,
      },
    };
  })(),

  // ── Number of Distinct Averages (LC 2465) ───────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const s = nums.slice().sort((a, b) => a - b);
      const sums: Record<string, boolean> = {};
      let total = 0;
      for (let i = 0, j = s.length - 1; i < j; i++, j--) {
        const key = String(s[i] + s[j]);
        if (sums[key] !== true) { sums[key] = true; total++; }
      }
      return total;
    };
    return {
      slug: "number-of-distinct-averages",
      title: "Number of Distinct Averages",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Two Pointers", "Sorting", "TCS", "Amazon"],
      signature: { funcName: "distinctAverages", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The array `nums` has **even** length. Repeat until it is empty: remove the smallest remaining value and the largest remaining value, and record their average.\n\nWhen several elements tie for smallest or largest, any one of them may be removed — the multiset of averages is the same either way.\n\nReturn how many **distinct** averages were recorded.",
        [
          { in: "nums = [4,1,4,0,3,5]", out: "2", note: "Sorted: 0,1,3,4,4,5. The pairs average 2.5, 2.5 and 3.5 — two distinct values." },
          { in: "nums = [1,100]", out: "1", note: "One pair, one average." },
          { in: "nums = [9,5,7,8,7,9,8,2,0,7]", out: "5" },
        ],
        ["2 <= nums.length <= 100", "nums.length is even", "0 <= nums[i] <= 100"]),
      hints: [
        "Sorting makes the removal order explicit: the `i`-th pair is `s[i]` with `s[n-1-i]`.",
        "Two averages are equal exactly when the two **sums** are equal — so you can avoid floating point entirely.",
        "Count distinct sums with a set.",
      ],
      editorial: explain({
        idea: "Sorting fixes the pairing, and comparing sums instead of averages keeps everything in integers — dividing by two would only invite floating-point equality bugs.",
        steps: [
          "Sort a copy of `nums`.",
          "Walk two pointers inward, pairing `s[i]` with `s[n-1-i]`.",
          "Insert each pair's **sum** into a set.",
          "Return the set's size.",
        ],
        why: "Each round removes the current minimum and maximum, which in sorted order are exactly the outermost untouched elements. Since all pairs divide by the same 2, two averages match precisely when their sums do.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Storing averages as floating-point values risks `2.5` comparing unequal to itself across platforms; integer sums are exact.",
          "Removing elements from the array as you go is O(n²) and unnecessary.",
        ],
      }),
      examples: [
        { input: "[4,1,4,0,3,5]", expectedOutput: "2" },
        { input: "[1,100]", expectedOutput: "1" },
        { input: "[9,5,7,8,7,9,8,2,0,7]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 8 : 100;
        const nums = Array.from({ length: 2 * ri(rng, 1, 25) }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef distinctAverages(nums: List[int]) -> int:\n    s = sorted(nums)\n    sums = set()\n    i, j = 0, len(s) - 1\n    while i < j:\n        sums.add(s[i] + s[j])\n        i += 1\n        j -= 1\n    return len(sums)`,
        javascript: `var distinctAverages = function(nums) {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var sums = {}, total = 0;\n    for (var i = 0, j = s.length - 1; i < j; i++, j--) {\n        var key = String(s[i] + s[j]);\n        if (sums[key] !== true) { sums[key] = true; total++; }\n    }\n    return total;\n};`,
        typescript: `function distinctAverages(nums: number[]): number {\n    var s = nums.slice().sort(function(a, b) { return a - b; });\n    var sums: { [key: string]: boolean } = {}, total = 0;\n    for (var i = 0, j = s.length - 1; i < j; i++, j--) {\n        var key = String(s[i] + s[j]);\n        if (sums[key] !== true) { sums[key] = true; total++; }\n    }\n    return total;\n}`,
        java: `public static int distinctAverages(int[] nums) {\n    int[] s = nums.clone();\n    Arrays.sort(s);\n    Set<Integer> sums = new HashSet<>();\n    for (int i = 0, j = s.length - 1; i < j; i++, j--) sums.add(s[i] + s[j]);\n    return sums.size();\n}`,
        cpp: `int distinctAverages(vector<int>& nums) {\n    vector<int> s = nums;\n    sort(s.begin(), s.end());\n    unordered_set<int> sums;\n    for (int i = 0, j = (int) s.size() - 1; i < j; i++, j--) sums.insert(s[i] + s[j]);\n    return (int) sums.size();\n}`,
        c: `static int cmpAvgAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint distinctAverages(int* nums, int numsSize) {\n    int* s = (int*) malloc((size_t) numsSize * sizeof(int));\n    for (int i = 0; i < numsSize; i++) s[i] = nums[i];\n    qsort(s, (size_t) numsSize, sizeof(int), cmpAvgAsc);\n    int seen[201];\n    memset(seen, 0, sizeof(seen));\n    int total = 0;\n    for (int i = 0, j = numsSize - 1; i < j; i++, j--) {\n        int sum = s[i] + s[j];\n        if (!seen[sum]) { seen[sum] = 1; total++; }\n    }\n    free(s);\n    return total;\n}`,
        csharp: `public static int DistinctAverages(int[] nums)\n{\n    int[] s = (int[]) nums.Clone();\n    Array.Sort(s);\n    var sums = new HashSet<int>();\n    for (int i = 0, j = s.Length - 1; i < j; i++, j--) sums.Add(s[i] + s[j]);\n    return sums.Count;\n}`,
        go: `func distinctAverages(nums []int) int {\n\ts := append([]int{}, nums...)\n\tsort.Ints(s)\n\tsums := map[int]bool{}\n\tfor i, j := 0, len(s)-1; i < j; i, j = i+1, j-1 {\n\t\tsums[s[i]+s[j]] = true\n\t}\n\treturn len(sums)\n}`,
        kotlin: `fun distinctAverages(nums: IntArray): Int {\n    val s = nums.sortedArray()\n    val sums = HashSet<Int>()\n    var i = 0\n    var j = s.size - 1\n    while (i < j) {\n        sums.add(s[i] + s[j])\n        i++\n        j--\n    }\n    return sums.size\n}`,
        swift: `func distinctAverages(_ nums: [Int]) -> Int {\n    let s = nums.sorted()\n    var sums = Set<Int>()\n    var i = 0\n    var j = s.count - 1\n    while i < j {\n        sums.insert(s[i] + s[j])\n        i += 1\n        j -= 1\n    }\n    return sums.count\n}`,
        rust: `fn distinctAverages(nums: Vec<i32>) -> i32 {\n    let mut s = nums.clone();\n    s.sort();\n    let mut sums: std::collections::HashSet<i32> = std::collections::HashSet::new();\n    let mut i = 0usize;\n    let mut j = s.len() - 1;\n    while i < j {\n        sums.insert(s[i] + s[j]);\n        i += 1;\n        j -= 1;\n    }\n    sums.len() as i32\n}`,
        php: `function distinctAverages($nums) {\n    $s = $nums;\n    sort($s);\n    $sums = array();\n    $i = 0;\n    $j = count($s) - 1;\n    while ($i < $j) {\n        $sums[$s[$i] + $s[$j]] = true;\n        $i++;\n        $j--;\n    }\n    return count($sums);\n}`,
        ruby: `def distinctAverages(nums)\n  s = nums.sort\n  sums = {}\n  i = 0\n  j = s.length - 1\n  while i < j\n    sums[s[i] + s[j]] = true\n    i += 1\n    j -= 1\n  end\n  sums.size\nend`,
      },
    };
  })(),

  // ── Maximum Number of Integers to Choose From a Range I (LC 2554) ──
  (() => {
    const ref = (banned: number[], n: number, maxSum: number) => {
      const block: Record<string, boolean> = {};
      for (const b of banned) block[String(b)] = true;
      let sum = 0, taken = 0;
      for (let v = 1; v <= n; v++) {
        if (block[String(v)] === true) continue;
        if (sum + v > maxSum) break;
        sum += v;
        taken++;
      }
      return taken;
    };
    return {
      slug: "maximum-number-of-integers-to-choose-from-a-range-i",
      title: "Maximum Number of Integers to Choose From a Range I",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Greedy", "Binary Search", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "maxCount", params: [{ name: "banned", type: "int[]" as const }, { name: "n", type: "int" as const }, { name: "maxSum", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Choose integers from the range `[1, n]` subject to three rules: each chosen integer appears in `banned` never, each is chosen at most once, and their total is at most `maxSum`.\n\nReturn the maximum number of integers you can choose.",
        [
          { in: "banned = [1,6,5], n = 5, maxSum = 6", out: "2", note: "Choosing 2 and 4 gives a total of 6." },
          { in: "banned = [1,2,3,4,5,6,7], n = 8, maxSum = 1", out: "0", note: "Only 8 is allowed and it already exceeds the budget." },
          { in: "banned = [11], n = 7, maxSum = 50", out: "7", note: "All of 1 through 7 sum to 28." },
        ],
        ["1 <= banned.length <= 10000", "1 <= n <= 10000", "1 <= maxSum <= 1000000000", "1 <= banned[i] <= 10000"]),
      hints: [
        "To maximise the *count* under a sum budget, always prefer smaller numbers.",
        "So walk `1, 2, 3, …` in order, skipping banned values, and take each one while it still fits.",
        "Stop as soon as the next allowed value would overflow the budget — every later value is at least as large.",
      ],
      editorial: explain({
        idea: "The objective counts integers, not their values, so the greedy choice is to take the smallest allowed integers first. Sweeping upward and stopping at the first overflow is optimal.",
        steps: [
          "Put `banned` in a set for O(1) rejection.",
          "Walk `v` from `1` to `n`, skipping banned values.",
          "If `sum + v` exceeds `maxSum`, stop; otherwise add `v` to the running sum and increment the count.",
        ],
        why: "Exchange argument: take any valid selection of size `k` and replace its largest element with the smallest allowed integer not already chosen — the total never rises and the size is unchanged. Repeating turns any optimal selection into the greedy prefix, so the greedy prefix is optimal.",
        time: "O(n + banned.length)",
        space: "O(banned.length)",
        pitfalls: [
          "Continuing past the first overflow does not help — values only grow, so the loop can stop.",
          "`maxSum` reaches a billion, so accumulate in 64 bits in fixed-width languages.",
          "Entries of `banned` may exceed `n` and are simply irrelevant.",
        ],
      }),
      examples: [
        { input: "[1,6,5]\n5\n6", expectedOutput: "2" },
        { input: "[1,2,3,4,5,6,7]\n8\n1", expectedOutput: "0" },
        { input: "[11]\n7\n50", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const banned = Array.from({ length: ri(rng, 1, 10) }, () => ri(rng, 1, n + 5));
        const maxSum = rng() < 0.5 ? ri(rng, 1, 60) : ri(rng, 1, 2000);
        return { input: `${fmtIntArr(banned)}\n${n}\n${maxSum}`, expectedOutput: String(ref(banned, n, maxSum)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxCount(banned: List[int], n: int, maxSum: int) -> int:\n    block = set(banned)\n    total = 0\n    taken = 0\n    for v in range(1, n + 1):\n        if v in block:\n            continue\n        if total + v > maxSum:\n            break\n        total += v\n        taken += 1\n    return taken`,
        javascript: `var maxCount = function(banned, n, maxSum) {\n    var block = {};\n    for (var i = 0; i < banned.length; i++) block[String(banned[i])] = true;\n    var sum = 0, taken = 0;\n    for (var v = 1; v <= n; v++) {\n        if (block[String(v)] === true) continue;\n        if (sum + v > maxSum) break;\n        sum += v;\n        taken++;\n    }\n    return taken;\n};`,
        typescript: `function maxCount(banned: number[], n: number, maxSum: number): number {\n    var block: { [key: string]: boolean } = {};\n    for (var i = 0; i < banned.length; i++) block[String(banned[i])] = true;\n    var sum = 0, taken = 0;\n    for (var v = 1; v <= n; v++) {\n        if (block[String(v)] === true) continue;\n        if (sum + v > maxSum) break;\n        sum += v;\n        taken++;\n    }\n    return taken;\n}`,
        java: `public static int maxCount(int[] banned, int n, int maxSum) {\n    Set<Integer> block = new HashSet<>();\n    for (int b : banned) block.add(b);\n    long sum = 0;\n    int taken = 0;\n    for (int v = 1; v <= n; v++) {\n        if (block.contains(v)) continue;\n        if (sum + v > maxSum) break;\n        sum += v;\n        taken++;\n    }\n    return taken;\n}`,
        cpp: `int maxCount(vector<int>& banned, int n, int maxSum) {\n    unordered_set<int> block(banned.begin(), banned.end());\n    long long sum = 0;\n    int taken = 0;\n    for (int v = 1; v <= n; v++) {\n        if (block.count(v)) continue;\n        if (sum + v > maxSum) break;\n        sum += v;\n        taken++;\n    }\n    return taken;\n}`,
        c: `int maxCount(int* banned, int bannedSize, int n, int maxSum) {\n    int* block = (int*) calloc((size_t) n + 2, sizeof(int));\n    for (int i = 0; i < bannedSize; i++) {\n        if (banned[i] >= 1 && banned[i] <= n) block[banned[i]] = 1;\n    }\n    long long sum = 0;\n    int taken = 0;\n    for (int v = 1; v <= n; v++) {\n        if (block[v]) continue;\n        if (sum + v > maxSum) break;\n        sum += v;\n        taken++;\n    }\n    free(block);\n    return taken;\n}`,
        csharp: `public static int MaxCount(int[] banned, int n, int maxSum)\n{\n    var block = new HashSet<int>(banned);\n    long sum = 0;\n    int taken = 0;\n    for (int v = 1; v <= n; v++)\n    {\n        if (block.Contains(v)) continue;\n        if (sum + v > maxSum) break;\n        sum += v;\n        taken++;\n    }\n    return taken;\n}`,
        go: `func maxCount(banned []int, n int, maxSum int) int {\n\tblock := map[int]bool{}\n\tfor _, b := range banned {\n\t\tblock[b] = true\n\t}\n\tsum, taken := 0, 0\n\tfor v := 1; v <= n; v++ {\n\t\tif block[v] {\n\t\t\tcontinue\n\t\t}\n\t\tif sum+v > maxSum {\n\t\t\tbreak\n\t\t}\n\t\tsum += v\n\t\ttaken++\n\t}\n\treturn taken\n}`,
        kotlin: `fun maxCount(banned: IntArray, n: Int, maxSum: Int): Int {\n    val block = banned.toHashSet()\n    var sum = 0L\n    var taken = 0\n    for (v in 1..n) {\n        if (block.contains(v)) continue\n        if (sum + v > maxSum) break\n        sum += v\n        taken++\n    }\n    return taken\n}`,
        swift: `func maxCount(_ banned: [Int], _ n: Int, _ maxSum: Int) -> Int {\n    let block = Set(banned)\n    var sum = 0\n    var taken = 0\n    for v in 1...max(n, 1) where v <= n {\n        if block.contains(v) { continue }\n        if sum + v > maxSum { break }\n        sum += v\n        taken += 1\n    }\n    return taken\n}`,
        rust: `fn maxCount(banned: Vec<i32>, n: i32, maxSum: i32) -> i32 {\n    let block: std::collections::HashSet<i32> = banned.into_iter().collect();\n    let mut sum: i64 = 0;\n    let mut taken = 0i32;\n    for v in 1..=n {\n        if block.contains(&v) {\n            continue;\n        }\n        if sum + v as i64 > maxSum as i64 {\n            break;\n        }\n        sum += v as i64;\n        taken += 1;\n    }\n    taken\n}`,
        php: `function maxCount($banned, $n, $maxSum) {\n    $block = array();\n    foreach ($banned as $b) $block[$b] = true;\n    $sum = 0;\n    $taken = 0;\n    for ($v = 1; $v <= $n; $v++) {\n        if (isset($block[$v])) continue;\n        if ($sum + $v > $maxSum) break;\n        $sum += $v;\n        $taken++;\n    }\n    return $taken;\n}`,
        ruby: `def maxCount(banned, n, maxSum)\n  block = {}\n  banned.each { |b| block[b] = true }\n  sum = 0\n  taken = 0\n  (1..n).each do |v|\n    next if block[v]\n    break if sum + v > maxSum\n    sum += v\n    taken += 1\n  end\n  taken\nend`,
      },
    };
  })(),

  // ── Subarray Sums Divisible by K (LC 974) ───────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const count: Record<string, number> = { "0": 1 };
      let sum = 0, total = 0;
      for (const x of nums) {
        sum = ((sum + x) % k + k) % k;
        const key = String(sum);
        if (count[key] !== undefined) total += count[key];
        count[key] = (count[key] === undefined ? 0 : count[key]) + 1;
      }
      return total;
    };
    return {
      slug: "subarray-sums-divisible-by-k",
      title: "Subarray Sums Divisible by K",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Prefix Sum", "Amazon", "Google", "Goldman Sachs"],
      signature: { funcName: "subarraysDivByK", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums` and an integer `k`, return the number of **non-empty contiguous subarrays** whose sum is divisible by `k`.",
        [
          { in: "nums = [4,5,0,-2,-3,1], k = 5", out: "7", note: "Seven subarrays have a sum that is a multiple of 5, including the whole array and the single 0." },
          { in: "nums = [5], k = 9", out: "0" },
          { in: "nums = [-1,2,9], k = 2", out: "2", note: "[2] and [-1,2,9]." },
        ],
        ["1 <= nums.length <= 30000", "-10000 <= nums[i] <= 10000", "2 <= k <= 10000"]),
      hints: [
        "A subarray sum is `P[j] - P[i]`, so it is divisible by `k` exactly when `P[i]` and `P[j]` leave the same remainder.",
        "So count, for each remainder, how many prefixes produce it — then every pair of them is one subarray.",
        "Negative numbers make the language's `%` go negative; normalise with `((x % k) + k) % k`.",
      ],
      editorial: explain({
        idea: "Reduce the prefix sums modulo `k`. Two prefixes with the same remainder bracket a subarray divisible by `k`, so the answer is the number of equal-remainder pairs.",
        steps: [
          "Start a remainder tally with `count[0] = 1`, standing for the empty prefix.",
          "Sweep the array keeping the running prefix sum reduced mod `k` (normalised to be non-negative).",
          "Before recording the current remainder, add its existing tally to the answer — those are all the earlier prefixes that pair with this one.",
          "Increment the tally and continue.",
        ],
        why: "`(P[j] - P[i]) % k == 0` is the same as `P[j] % k == P[i] % k`, so counting pairs of equal remainders counts exactly the qualifying subarrays. Seeding `count[0] = 1` is what lets subarrays starting at index 0 be found.",
        time: "O(n)",
        space: "O(k)",
        pitfalls: [
          "Forgetting the `count[0] = 1` seed drops every subarray that starts at the beginning.",
          "In C, Java, Go and friends `-3 % 5` is `-3`, not `2` — the double-modulo normalisation is mandatory.",
          "Adding the tally *after* incrementing it counts a prefix as pairing with itself.",
        ],
      }),
      examples: [
        { input: "[4,5,0,-2,-3,1]\n5", expectedOutput: "7" },
        { input: "[5]\n9", expectedOutput: "0" },
        { input: "[-1,2,9]\n2", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const hi = rng() < 0.5 ? 8 : 10000;
        const nums = Array.from({ length: n }, () => ri(rng, -hi, hi));
        const k = ri(rng, 2, rng() < 0.5 ? 6 : 200);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef subarraysDivByK(nums: List[int], k: int) -> int:\n    count = {0: 1}\n    total = 0\n    s = 0\n    for x in nums:\n        s = (s + x) % k\n        total += count.get(s, 0)\n        count[s] = count.get(s, 0) + 1\n    return total`,
        javascript: `var subarraysDivByK = function(nums, k) {\n    var count = {};\n    count["0"] = 1;\n    var sum = 0, total = 0;\n    for (var i = 0; i < nums.length; i++) {\n        sum = ((sum + nums[i]) % k + k) % k;\n        var key = String(sum);\n        if (count[key] !== undefined) total += count[key];\n        count[key] = (count[key] === undefined ? 0 : count[key]) + 1;\n    }\n    return total;\n};`,
        typescript: `function subarraysDivByK(nums: number[], k: number): number {\n    var count: { [key: string]: number } = {};\n    count["0"] = 1;\n    var sum = 0, total = 0;\n    for (var i = 0; i < nums.length; i++) {\n        sum = ((sum + nums[i]) % k + k) % k;\n        var key = String(sum);\n        if (count[key] !== undefined) total += count[key];\n        count[key] = (count[key] === undefined ? 0 : count[key]) + 1;\n    }\n    return total;\n}`,
        java: `public static int subarraysDivByK(int[] nums, int k) {\n    int[] count = new int[k];\n    count[0] = 1;\n    int sum = 0, total = 0;\n    for (int x : nums) {\n        sum = ((sum + x) % k + k) % k;\n        total += count[sum];\n        count[sum]++;\n    }\n    return total;\n}`,
        cpp: `int subarraysDivByK(vector<int>& nums, int k) {\n    vector<int> count(k, 0);\n    count[0] = 1;\n    int sum = 0, total = 0;\n    for (int x : nums) {\n        sum = ((sum + x) % k + k) % k;\n        total += count[sum];\n        count[sum]++;\n    }\n    return total;\n}`,
        c: `int subarraysDivByK(int* nums, int numsSize, int k) {\n    int* count = (int*) calloc((size_t) k, sizeof(int));\n    count[0] = 1;\n    int sum = 0, total = 0;\n    for (int i = 0; i < numsSize; i++) {\n        sum = ((sum + nums[i]) % k + k) % k;\n        total += count[sum];\n        count[sum]++;\n    }\n    free(count);\n    return total;\n}`,
        csharp: `public static int SubarraysDivByK(int[] nums, int k)\n{\n    int[] count = new int[k];\n    count[0] = 1;\n    int sum = 0, total = 0;\n    foreach (int x in nums)\n    {\n        sum = ((sum + x) % k + k) % k;\n        total += count[sum];\n        count[sum]++;\n    }\n    return total;\n}`,
        go: `func subarraysDivByK(nums []int, k int) int {\n\tcount := make([]int, k)\n\tcount[0] = 1\n\tsum, total := 0, 0\n\tfor _, x := range nums {\n\t\tsum = ((sum+x)%k + k) % k\n\t\ttotal += count[sum]\n\t\tcount[sum]++\n\t}\n\treturn total\n}`,
        kotlin: `fun subarraysDivByK(nums: IntArray, k: Int): Int {\n    val count = IntArray(k)\n    count[0] = 1\n    var sum = 0\n    var total = 0\n    for (x in nums) {\n        sum = ((sum + x) % k + k) % k\n        total += count[sum]\n        count[sum]++\n    }\n    return total\n}`,
        swift: `func subarraysDivByK(_ nums: [Int], _ k: Int) -> Int {\n    var count = [Int](repeating: 0, count: k)\n    count[0] = 1\n    var sum = 0\n    var total = 0\n    for x in nums {\n        sum = ((sum + x) % k + k) % k\n        total += count[sum]\n        count[sum] += 1\n    }\n    return total\n}`,
        rust: `fn subarraysDivByK(nums: Vec<i32>, k: i32) -> i32 {\n    let mut count = vec![0i32; k as usize];\n    count[0] = 1;\n    let mut sum = 0i32;\n    let mut total = 0i32;\n    for &x in nums.iter() {\n        sum = ((sum + x) % k + k) % k;\n        total += count[sum as usize];\n        count[sum as usize] += 1;\n    }\n    total\n}`,
        php: `function subarraysDivByK($nums, $k) {\n    $count = array_fill(0, $k, 0);\n    $count[0] = 1;\n    $sum = 0;\n    $total = 0;\n    foreach ($nums as $x) {\n        $sum = (($sum + $x) % $k + $k) % $k;\n        $total += $count[$sum];\n        $count[$sum]++;\n    }\n    return $total;\n}`,
        ruby: `def subarraysDivByK(nums, k)\n  count = Array.new(k, 0)\n  count[0] = 1\n  sum = 0\n  total = 0\n  nums.each do |x|\n    sum = (sum + x) % k\n    total += count[sum]\n    count[sum] += 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Longest Well-Performing Interval (LC 1124) ──────────────────
  (() => {
    const ref = (hours: number[]) => {
      const first: Record<string, number> = {};
      let score = 0, best = 0;
      for (let i = 0; i < hours.length; i++) {
        score += hours[i] > 8 ? 1 : -1;
        if (score > 0) { best = i + 1; continue; }
        const key = String(score - 1);
        if (first[key] !== undefined && i - first[key] > best) best = i - first[key];
        const own = String(score);
        if (first[own] === undefined) first[own] = i;
      }
      return best;
    };
    return {
      slug: "longest-well-performing-interval",
      title: "Longest Well-Performing Interval",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Prefix Sum", "Stack", "Amazon", "Google", "Uber"],
      signature: { funcName: "longestWPI", params: [{ name: "hours", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A day is **tiring** if more than `8` hours were worked. An interval of days is **well-performing** when it contains strictly more tiring days than non-tiring days.\n\nGiven `hours`, return the length of the longest well-performing interval.",
        [
          { in: "hours = [9,9,6,0,6,6,9]", out: "3", note: "The first three days have two tiring days and one that is not." },
          { in: "hours = [6,6,6]", out: "0", note: "No tiring days at all." },
          { in: "hours = [9,6,9]", out: "3", note: "Two tiring against one." },
        ],
        ["1 <= hours.length <= 10000", "0 <= hours[i] <= 16"]),
      hints: [
        "Score each day `+1` when tiring and `-1` otherwise. The question becomes: what is the longest subarray with a **positive** sum?",
        "With prefix sums `P`, you want the widest `i < j` with `P[j] > P[i]`.",
        "Because consecutive prefix sums differ by exactly 1, you only ever need to look for `P[j] - 1` — and only at its **first** occurrence.",
      ],
      editorial: explain({
        idea: "Convert to ±1 and look for the widest prefix-sum increase. The scores change by exactly one per step, which is what makes a single hash-map lookup enough instead of a search over all smaller prefix sums.",
        steps: [
          "Sweep the days, maintaining `score` — the running sum of `+1` for tiring and `-1` otherwise.",
          "If `score > 0`, the whole prefix through `i` qualifies, giving a candidate of length `i + 1`.",
          "Otherwise look up the first index where the score was `score - 1`; the interval after it is well-performing, giving a candidate of `i - first[score - 1]`.",
          "Record the first index at which each score value appears and never overwrite it.",
        ],
        why: "For the interval ending at `j` to be positive you need an earlier prefix strictly smaller than `P[j]`. Since the prefix sums move in steps of one, the first time a value below `P[j]` ever appeared it must have been exactly `P[j] - 1` — so that single lookup finds the leftmost usable start.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Overwriting `first[score]` gives the shortest interval instead of the longest.",
          "Searching every smaller score is O(n²) and unnecessary given the step-of-one property.",
          "`hours[i] == 8` is **not** tiring — the threshold is strict.",
        ],
      }),
      examples: [
        { input: "[9,9,6,0,6,6,9]", expectedOutput: "3" },
        { input: "[6,6,6]", expectedOutput: "0" },
        { input: "[9,6,9]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const hours = Array.from({ length: ri(rng, 1, 60) }, () => (rng() < 0.5 ? ri(rng, 0, 8) : ri(rng, 9, 16)));
        return { input: fmtIntArr(hours), expectedOutput: String(ref(hours)) };
      },
      solutions: {
        python: `from typing import List\n\ndef longestWPI(hours: List[int]) -> int:\n    first = {}\n    score = 0\n    best = 0\n    for i, h in enumerate(hours):\n        score += 1 if h > 8 else -1\n        if score > 0:\n            best = i + 1\n            continue\n        if score - 1 in first:\n            best = max(best, i - first[score - 1])\n        if score not in first:\n            first[score] = i\n    return best`,
        javascript: `var longestWPI = function(hours) {\n    var first = {};\n    var score = 0, best = 0;\n    for (var i = 0; i < hours.length; i++) {\n        score += hours[i] > 8 ? 1 : -1;\n        if (score > 0) { best = i + 1; continue; }\n        var key = String(score - 1);\n        if (first[key] !== undefined && i - first[key] > best) best = i - first[key];\n        var own = String(score);\n        if (first[own] === undefined) first[own] = i;\n    }\n    return best;\n};`,
        typescript: `function longestWPI(hours: number[]): number {\n    var first: { [key: string]: number } = {};\n    var score = 0, best = 0;\n    for (var i = 0; i < hours.length; i++) {\n        score += hours[i] > 8 ? 1 : -1;\n        if (score > 0) { best = i + 1; continue; }\n        var key = String(score - 1);\n        if (first[key] !== undefined && i - first[key] > best) best = i - first[key];\n        var own = String(score);\n        if (first[own] === undefined) first[own] = i;\n    }\n    return best;\n}`,
        java: `public static int longestWPI(int[] hours) {\n    Map<Integer, Integer> first = new HashMap<>();\n    int score = 0, best = 0;\n    for (int i = 0; i < hours.length; i++) {\n        score += hours[i] > 8 ? 1 : -1;\n        if (score > 0) { best = i + 1; continue; }\n        Integer at = first.get(score - 1);\n        if (at != null && i - at > best) best = i - at;\n        if (!first.containsKey(score)) first.put(score, i);\n    }\n    return best;\n}`,
        cpp: `int longestWPI(vector<int>& hours) {\n    unordered_map<int, int> first;\n    int score = 0, best = 0;\n    for (int i = 0; i < (int) hours.size(); i++) {\n        score += hours[i] > 8 ? 1 : -1;\n        if (score > 0) { best = i + 1; continue; }\n        auto it = first.find(score - 1);\n        if (it != first.end() && i - it->second > best) best = i - it->second;\n        if (!first.count(score)) first[score] = i;\n    }\n    return best;\n}`,
        c: `int longestWPI(int* hours, int hoursSize) {\n    int offset = hoursSize + 1;\n    int span = 2 * hoursSize + 3;\n    int* first = (int*) malloc((size_t) span * sizeof(int));\n    for (int i = 0; i < span; i++) first[i] = -2;\n    int score = 0, best = 0;\n    for (int i = 0; i < hoursSize; i++) {\n        score += hours[i] > 8 ? 1 : -1;\n        if (score > 0) { best = i + 1; continue; }\n        int prevKey = score - 1 + offset;\n        if (prevKey >= 0 && prevKey < span && first[prevKey] != -2 && i - first[prevKey] > best) best = i - first[prevKey];\n        int own = score + offset;\n        if (first[own] == -2) first[own] = i;\n    }\n    free(first);\n    return best;\n}`,
        csharp: `public static int LongestWPI(int[] hours)\n{\n    var first = new Dictionary<int, int>();\n    int score = 0, best = 0;\n    for (int i = 0; i < hours.Length; i++)\n    {\n        score += hours[i] > 8 ? 1 : -1;\n        if (score > 0) { best = i + 1; continue; }\n        int at;\n        if (first.TryGetValue(score - 1, out at) && i - at > best) best = i - at;\n        if (!first.ContainsKey(score)) first[score] = i;\n    }\n    return best;\n}`,
        go: `func longestWPI(hours []int) int {\n\tfirst := map[int]int{}\n\tscore, best := 0, 0\n\tfor i, h := range hours {\n\t\tif h > 8 {\n\t\t\tscore++\n\t\t} else {\n\t\t\tscore--\n\t\t}\n\t\tif score > 0 {\n\t\t\tbest = i + 1\n\t\t\tcontinue\n\t\t}\n\t\tif at, ok := first[score-1]; ok && i-at > best {\n\t\t\tbest = i - at\n\t\t}\n\t\tif _, ok := first[score]; !ok {\n\t\t\tfirst[score] = i\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun longestWPI(hours: IntArray): Int {\n    val first = HashMap<Int, Int>()\n    var score = 0\n    var best = 0\n    for (i in hours.indices) {\n        score += if (hours[i] > 8) 1 else -1\n        if (score > 0) {\n            best = i + 1\n            continue\n        }\n        val at = first[score - 1]\n        if (at != null && i - at > best) best = i - at\n        if (!first.containsKey(score)) first[score] = i\n    }\n    return best\n}`,
        swift: `func longestWPI(_ hours: [Int]) -> Int {\n    var first: [Int: Int] = [:]\n    var score = 0\n    var best = 0\n    for i in 0..<hours.count {\n        score += hours[i] > 8 ? 1 : -1\n        if score > 0 {\n            best = i + 1\n            continue\n        }\n        if let at = first[score - 1], i - at > best { best = i - at }\n        if first[score] == nil { first[score] = i }\n    }\n    return best\n}`,
        rust: `fn longestWPI(hours: Vec<i32>) -> i32 {\n    let mut first: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();\n    let mut score = 0i32;\n    let mut best = 0i32;\n    for i in 0..hours.len() {\n        score += if hours[i] > 8 { 1 } else { -1 };\n        let idx = i as i32;\n        if score > 0 {\n            best = idx + 1;\n            continue;\n        }\n        if let Some(&at) = first.get(&(score - 1)) {\n            if idx - at > best {\n                best = idx - at;\n            }\n        }\n        first.entry(score).or_insert(idx);\n    }\n    best\n}`,
        php: `function longestWPI($hours) {\n    $first = array();\n    $score = 0;\n    $best = 0;\n    for ($i = 0; $i < count($hours); $i++) {\n        $score += $hours[$i] > 8 ? 1 : -1;\n        if ($score > 0) { $best = $i + 1; continue; }\n        if (array_key_exists($score - 1, $first) && $i - $first[$score - 1] > $best) $best = $i - $first[$score - 1];\n        if (!array_key_exists($score, $first)) $first[$score] = $i;\n    }\n    return $best;\n}`,
        ruby: `def longestWPI(hours)\n  first = {}\n  score = 0\n  best = 0\n  hours.each_with_index do |h, i|\n    score += h > 8 ? 1 : -1\n    if score > 0\n      best = i + 1\n      next\n    end\n    best = i - first[score - 1] if first.key?(score - 1) && i - first[score - 1] > best\n    first[score] = i unless first.key?(score)\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Maximum Size Subarray Sum Equals k (LC 325) ─────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const first: Record<string, number> = { "0": -1 };
      let sum = 0, best = 0;
      for (let i = 0; i < nums.length; i++) {
        sum += nums[i];
        const want = String(sum - k);
        if (first[want] !== undefined && i - first[want] > best) best = i - first[want];
        const own = String(sum);
        if (first[own] === undefined) first[own] = i;
      }
      return best;
    };
    return {
      slug: "maximum-size-subarray-sum-equals-k",
      title: "Maximum Size Subarray Sum Equals k",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Prefix Sum", "Meta", "Amazon", "Microsoft"],
      signature: { funcName: "maxSubArrayLen", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums` that may contain negative numbers and an integer `k`, return the length of the **longest** contiguous subarray whose sum equals `k`.\n\nIf no such subarray exists, return `0`.",
        [
          { in: "nums = [1,-1,5,-2,3], k = 3", out: "4", note: "[1,-1,5,-2] sums to 3 and is the longest such subarray." },
          { in: "nums = [-2,-1,2,1], k = 1", out: "2", note: "[-1,2] sums to 1." },
          { in: "nums = [1,2,3], k = 100", out: "0" },
        ],
        ["1 <= nums.length <= 200000", "-10000 <= nums[i] <= 10000", "-1000000000 <= k <= 1000000000"]),
      hints: [
        "Negative values rule out a sliding window — use prefix sums instead.",
        "`nums[i+1..j]` sums to `k` exactly when `P[j] - P[i] == k`, so look up `P[j] - k`.",
        "Keep only the **first** index at which each prefix sum appears; that maximises the distance.",
      ],
      editorial: explain({
        idea: "With prefix sums, a subarray summing to `k` is a pair of prefixes differing by `k`. Recording the earliest index for each prefix value turns 'longest' into a single lookup per position.",
        steps: [
          "Seed the map with prefix sum `0` at index `-1`, representing the empty prefix.",
          "Sweep the array keeping the running sum.",
          "Look up `sum - k`; if present, the subarray after that index sums to `k`, giving a candidate length of `i - first[sum - k]`.",
          "Record `sum` at index `i` only if it has not been seen before.",
        ],
        why: "For a fixed right end, the longest qualifying subarray starts at the leftmost prefix with the required value — which is exactly what 'never overwrite' preserves. The `-1` seed makes subarrays starting at index 0 reachable.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Overwriting the stored index yields the shortest such subarray, not the longest.",
          "Omitting the `{0: -1}` seed misses every subarray that starts at the beginning.",
          "A sliding window is wrong here: negative values break the monotonicity it depends on.",
        ],
      }),
      examples: [
        { input: "[1,-1,5,-2,3]\n3", expectedOutput: "4" },
        { input: "[-2,-1,2,1]\n1", expectedOutput: "2" },
        { input: "[1,2,3]\n100", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const hi = rng() < 0.5 ? 5 : 10000;
        const nums = Array.from({ length: n }, () => ri(rng, -hi, hi));
        let k: number;
        if (rng() < 0.6) {
          const i = ri(rng, 0, n - 1);
          const j = ri(rng, i, n - 1);
          k = 0;
          for (let t = i; t <= j; t++) k += nums[t];
        } else {
          k = ri(rng, -3 * hi, 3 * hi);
        }
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxSubArrayLen(nums: List[int], k: int) -> int:\n    first = {0: -1}\n    total = 0\n    best = 0\n    for i, x in enumerate(nums):\n        total += x\n        if total - k in first:\n            best = max(best, i - first[total - k])\n        if total not in first:\n            first[total] = i\n    return best`,
        javascript: `var maxSubArrayLen = function(nums, k) {\n    var first = {};\n    first["0"] = -1;\n    var sum = 0, best = 0;\n    for (var i = 0; i < nums.length; i++) {\n        sum += nums[i];\n        var want = String(sum - k);\n        if (first[want] !== undefined && i - first[want] > best) best = i - first[want];\n        var own = String(sum);\n        if (first[own] === undefined) first[own] = i;\n    }\n    return best;\n};`,
        typescript: `function maxSubArrayLen(nums: number[], k: number): number {\n    var first: { [key: string]: number } = {};\n    first["0"] = -1;\n    var sum = 0, best = 0;\n    for (var i = 0; i < nums.length; i++) {\n        sum += nums[i];\n        var want = String(sum - k);\n        if (first[want] !== undefined && i - first[want] > best) best = i - first[want];\n        var own = String(sum);\n        if (first[own] === undefined) first[own] = i;\n    }\n    return best;\n}`,
        java: `public static int maxSubArrayLen(int[] nums, int k) {\n    Map<Long, Integer> first = new HashMap<>();\n    first.put(0L, -1);\n    long sum = 0;\n    int best = 0;\n    for (int i = 0; i < nums.length; i++) {\n        sum += nums[i];\n        Integer at = first.get(sum - k);\n        if (at != null && i - at > best) best = i - at;\n        if (!first.containsKey(sum)) first.put(sum, i);\n    }\n    return best;\n}`,
        cpp: `int maxSubArrayLen(vector<int>& nums, int k) {\n    unordered_map<long long, int> first;\n    first[0] = -1;\n    long long sum = 0;\n    int best = 0;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        sum += nums[i];\n        auto it = first.find(sum - k);\n        if (it != first.end() && i - it->second > best) best = i - it->second;\n        if (!first.count(sum)) first[sum] = i;\n    }\n    return best;\n}`,
        c: `typedef struct { long long key; int at; int used; } SlotK;\n\nstatic int slotFor(SlotK* tbl, int mask, long long key) {\n    unsigned long long h = (unsigned long long) key * 1146111111111111u;\n    int i = (int) ((h >> 20) & (unsigned long long) mask);\n    while (tbl[i].used && tbl[i].key != key) i = (i + 1) & mask;\n    return i;\n}\n\nint maxSubArrayLen(int* nums, int numsSize, int k) {\n    int cap = 1;\n    while (cap < 2 * numsSize + 8) cap <<= 1;\n    int mask = cap - 1;\n    SlotK* tbl = (SlotK*) calloc((size_t) cap, sizeof(SlotK));\n    int zero = slotFor(tbl, mask, 0);\n    tbl[zero].used = 1;\n    tbl[zero].key = 0;\n    tbl[zero].at = -1;\n    long long sum = 0;\n    int best = 0;\n    for (int i = 0; i < numsSize; i++) {\n        sum += nums[i];\n        int want = slotFor(tbl, mask, sum - k);\n        if (tbl[want].used && i - tbl[want].at > best) best = i - tbl[want].at;\n        int own = slotFor(tbl, mask, sum);\n        if (!tbl[own].used) { tbl[own].used = 1; tbl[own].key = sum; tbl[own].at = i; }\n    }\n    free(tbl);\n    return best;\n}`,
        csharp: `public static int MaxSubArrayLen(int[] nums, int k)\n{\n    var first = new Dictionary<long, int>();\n    first[0L] = -1;\n    long sum = 0;\n    int best = 0;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        sum += nums[i];\n        int at;\n        if (first.TryGetValue(sum - k, out at) && i - at > best) best = i - at;\n        if (!first.ContainsKey(sum)) first[sum] = i;\n    }\n    return best;\n}`,
        go: `func maxSubArrayLen(nums []int, k int) int {\n\tfirst := map[int]int{0: -1}\n\tsum, best := 0, 0\n\tfor i, x := range nums {\n\t\tsum += x\n\t\tif at, ok := first[sum-k]; ok && i-at > best {\n\t\t\tbest = i - at\n\t\t}\n\t\tif _, ok := first[sum]; !ok {\n\t\t\tfirst[sum] = i\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxSubArrayLen(nums: IntArray, k: Int): Int {\n    val first = HashMap<Long, Int>()\n    first[0L] = -1\n    var sum = 0L\n    var best = 0\n    for (i in nums.indices) {\n        sum += nums[i]\n        val at = first[sum - k]\n        if (at != null && i - at > best) best = i - at\n        if (!first.containsKey(sum)) first[sum] = i\n    }\n    return best\n}`,
        swift: `func maxSubArrayLen(_ nums: [Int], _ k: Int) -> Int {\n    var first: [Int: Int] = [0: -1]\n    var sum = 0\n    var best = 0\n    for i in 0..<nums.count {\n        sum += nums[i]\n        if let at = first[sum - k], i - at > best { best = i - at }\n        if first[sum] == nil { first[sum] = i }\n    }\n    return best\n}`,
        rust: `fn maxSubArrayLen(nums: Vec<i32>, k: i32) -> i32 {\n    let mut first: std::collections::HashMap<i64, i32> = std::collections::HashMap::new();\n    first.insert(0, -1);\n    let mut sum: i64 = 0;\n    let mut best = 0i32;\n    for i in 0..nums.len() {\n        sum += nums[i] as i64;\n        let idx = i as i32;\n        if let Some(&at) = first.get(&(sum - k as i64)) {\n            if idx - at > best {\n                best = idx - at;\n            }\n        }\n        first.entry(sum).or_insert(idx);\n    }\n    best\n}`,
        php: `function maxSubArrayLen($nums, $k) {\n    $first = array();\n    $first[0] = -1;\n    $sum = 0;\n    $best = 0;\n    for ($i = 0; $i < count($nums); $i++) {\n        $sum += $nums[$i];\n        if (array_key_exists($sum - $k, $first) && $i - $first[$sum - $k] > $best) $best = $i - $first[$sum - $k];\n        if (!array_key_exists($sum, $first)) $first[$sum] = $i;\n    }\n    return $best;\n}`,
        ruby: `def maxSubArrayLen(nums, k)\n  first = { 0 => -1 }\n  sum = 0\n  best = 0\n  nums.each_with_index do |x, i|\n    sum += x\n    best = i - first[sum - k] if first.key?(sum - k) && i - first[sum - k] > best\n    first[sum] = i unless first.key?(sum)\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Count Nice Pairs in an Array (LC 1814) ──────────────────────
  (() => {
    const revNum = (x: number) => {
      let r = 0, v = x;
      while (v > 0) { r = r * 10 + (v % 10); v = Math.floor(v / 10); }
      return r;
    };
    const ref = (nums: number[]) => {
      const MOD = 1000000007;
      const seen: Record<string, number> = {};
      let total = 0;
      for (const x of nums) {
        const key = String(x - revNum(x));
        if (seen[key] !== undefined) total = (total + seen[key]) % MOD;
        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;
      }
      return total;
    };
    return {
      slug: "count-nice-pairs-in-an-array",
      title: "Count Nice Pairs in an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Math", "Counting", "Amazon", "Google", "Adobe"],
      signature: { funcName: "countNicePairs", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Let `rev(x)` be the value of `x` with its decimal digits reversed — `rev(123) = 321`, `rev(120) = 21`.\n\nA pair of indices `(i, j)` with `i < j` is **nice** when `nums[i] + rev(nums[j]) == nums[j] + rev(nums[i])`.\n\nReturn the number of nice pairs, modulo `10^9 + 7`.",
        [
          { in: "nums = [42,11,1,97]", out: "2", note: "The nice pairs are (0,3) and (1,2)." },
          { in: "nums = [13,10,35,24,76]", out: "4" },
          { in: "nums = [1,2,3]", out: "3", note: "Single digits are their own reversals, so every pair is nice." },
        ],
        ["1 <= nums.length <= 100000", "0 <= nums[i] <= 1000000000"]),
      hints: [
        "Rearrange the condition: move the `i` terms to one side and the `j` terms to the other.",
        "It becomes `nums[i] - rev(nums[i]) == nums[j] - rev(nums[j])`.",
        "So group by that key and count pairs within each group as you sweep.",
      ],
      editorial: explain({
        idea: "The condition couples `i` and `j` only through the quantity `x - rev(x)`. Rewriting it that way turns the problem into counting pairs with equal keys, which one pass with a tally solves.",
        steps: [
          "For each value compute `key = x - rev(x)`.",
          "Sweep the array; before inserting the current key, add its existing tally to the answer — those are the earlier indices it pairs with.",
          "Increment the tally and reduce the running answer modulo `10^9 + 7`.",
        ],
        why: "`a + rev(b) == b + rev(a)` rearranges to `a - rev(a) == b - rev(b)`, an equality between two independent quantities. Counting before inserting attributes each pair to its later index exactly once.",
        time: "O(n · digits)",
        space: "O(n)",
        pitfalls: [
          "Computing `rev` with string reversal is fine, but be careful that trailing zeros vanish — `rev(120)` is `21`, not `021`.",
          "The pair count can reach about `n²/2`, so reduce modulo as you go rather than at the end.",
          "Inserting before counting makes an element pair with itself.",
        ],
      }),
      examples: [
        { input: "[42,11,1,97]", expectedOutput: "2" },
        { input: "[13,10,35,24,76]", expectedOutput: "4" },
        { input: "[1,2,3]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 60);
        const hi = pick(rng, [9, 99, 1000, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countNicePairs(nums: List[int]) -> int:\n    MOD = 1000000007\n    seen = {}\n    total = 0\n    for x in nums:\n        key = x - int(str(x)[::-1])\n        total = (total + seen.get(key, 0)) % MOD\n        seen[key] = seen.get(key, 0) + 1\n    return total`,
        javascript: `var countNicePairs = function(nums) {\n    var MOD = 1000000007;\n    var rev = function(x) {\n        var r = 0, v = x;\n        while (v > 0) { r = r * 10 + (v % 10); v = Math.floor(v / 10); }\n        return r;\n    };\n    var seen = {}, total = 0;\n    for (var i = 0; i < nums.length; i++) {\n        var key = String(nums[i] - rev(nums[i]));\n        if (seen[key] !== undefined) total = (total + seen[key]) % MOD;\n        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;\n    }\n    return total;\n};`,
        typescript: `function countNicePairs(nums: number[]): number {\n    var MOD = 1000000007;\n    var rev = function(x: number): number {\n        var r = 0, v = x;\n        while (v > 0) { r = r * 10 + (v % 10); v = Math.floor(v / 10); }\n        return r;\n    };\n    var seen: { [key: string]: number } = {}, total = 0;\n    for (var i = 0; i < nums.length; i++) {\n        var key = String(nums[i] - rev(nums[i]));\n        if (seen[key] !== undefined) total = (total + seen[key]) % MOD;\n        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;\n    }\n    return total;\n}`,
        java: `public static int countNicePairs(int[] nums) {\n    final int MOD = 1000000007;\n    Map<Integer, Integer> seen = new HashMap<>();\n    long total = 0;\n    for (int x : nums) {\n        int r = 0, v = x;\n        while (v > 0) { r = r * 10 + v % 10; v /= 10; }\n        int key = x - r;\n        total = (total + seen.getOrDefault(key, 0)) % MOD;\n        seen.put(key, seen.getOrDefault(key, 0) + 1);\n    }\n    return (int) total;\n}`,
        cpp: `int countNicePairs(vector<int>& nums) {\n    const long long MOD = 1000000007LL;\n    unordered_map<int, int> seen;\n    long long total = 0;\n    for (int x : nums) {\n        int r = 0, v = x;\n        while (v > 0) { r = r * 10 + v % 10; v /= 10; }\n        int key = x - r;\n        total = (total + seen[key]) % MOD;\n        seen[key]++;\n    }\n    return (int) total;\n}`,
        c: `typedef struct { int key; int count; int used; } SlotN;\n\nint countNicePairs(int* nums, int numsSize) {\n    const long long MOD = 1000000007LL;\n    int cap = 1;\n    while (cap < 2 * numsSize + 8) cap <<= 1;\n    int mask = cap - 1;\n    SlotN* tbl = (SlotN*) calloc((size_t) cap, sizeof(SlotN));\n    long long total = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int r = 0, v = nums[i];\n        while (v > 0) { r = r * 10 + v % 10; v /= 10; }\n        int key = nums[i] - r;\n        unsigned int h = (unsigned int) key * 2654435761u;\n        int s = (int) (h & (unsigned int) mask);\n        while (tbl[s].used && tbl[s].key != key) s = (s + 1) & mask;\n        if (tbl[s].used) total = (total + tbl[s].count) % MOD;\n        else { tbl[s].used = 1; tbl[s].key = key; tbl[s].count = 0; }\n        tbl[s].count++;\n    }\n    free(tbl);\n    return (int) total;\n}`,
        csharp: `public static int CountNicePairs(int[] nums)\n{\n    const long MOD = 1000000007L;\n    var seen = new Dictionary<int, int>();\n    long total = 0;\n    foreach (int x in nums)\n    {\n        int r = 0, v = x;\n        while (v > 0) { r = r * 10 + v % 10; v /= 10; }\n        int key = x - r;\n        int c;\n        c = seen.TryGetValue(key, out c) ? c : 0;\n        total = (total + c) % MOD;\n        seen[key] = c + 1;\n    }\n    return (int) total;\n}`,
        go: `func countNicePairs(nums []int) int {\n\tconst mod = 1000000007\n\tseen := map[int]int{}\n\ttotal := 0\n\tfor _, x := range nums {\n\t\tr, v := 0, x\n\t\tfor v > 0 {\n\t\t\tr = r*10 + v%10\n\t\t\tv /= 10\n\t\t}\n\t\tkey := x - r\n\t\ttotal = (total + seen[key]) % mod\n\t\tseen[key]++\n\t}\n\treturn total\n}`,
        kotlin: `fun countNicePairs(nums: IntArray): Int {\n    val mod = 1000000007L\n    val seen = HashMap<Int, Int>()\n    var total = 0L\n    for (x in nums) {\n        var r = 0\n        var v = x\n        while (v > 0) {\n            r = r * 10 + v % 10\n            v /= 10\n        }\n        val key = x - r\n        val c = seen[key] ?: 0\n        total = (total + c) % mod\n        seen[key] = c + 1\n    }\n    return total.toInt()\n}`,
        swift: `func countNicePairs(_ nums: [Int]) -> Int {\n    let mod = 1000000007\n    var seen: [Int: Int] = [:]\n    var total = 0\n    for x in nums {\n        var r = 0\n        var v = x\n        while v > 0 {\n            r = r * 10 + v % 10\n            v /= 10\n        }\n        let key = x - r\n        let c = seen[key] ?? 0\n        total = (total + c) % mod\n        seen[key] = c + 1\n    }\n    return total\n}`,
        rust: `fn countNicePairs(nums: Vec<i32>) -> i32 {\n    let md: i64 = 1000000007;\n    let mut seen: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();\n    let mut total: i64 = 0;\n    for &x in nums.iter() {\n        let mut r = 0i32;\n        let mut v = x;\n        while v > 0 {\n            r = r * 10 + v % 10;\n            v /= 10;\n        }\n        let key = x - r;\n        let c = *seen.get(&key).unwrap_or(&0);\n        total = (total + c as i64) % md;\n        seen.insert(key, c + 1);\n    }\n    total as i32\n}`,
        php: `function countNicePairs($nums) {\n    $mod = 1000000007;\n    $seen = array();\n    $total = 0;\n    foreach ($nums as $x) {\n        $r = 0;\n        $v = $x;\n        while ($v > 0) { $r = $r * 10 + $v % 10; $v = intdiv($v, 10); }\n        $key = $x - $r;\n        if (isset($seen[$key])) $total = ($total + $seen[$key]) % $mod;\n        $seen[$key] = isset($seen[$key]) ? $seen[$key] + 1 : 1;\n    }\n    return $total;\n}`,
        ruby: `def countNicePairs(nums)\n  mod = 1000000007\n  seen = Hash.new(0)\n  total = 0\n  nums.each do |x|\n    key = x - x.to_s.reverse.to_i\n    total = (total + seen[key]) % mod\n    seen[key] += 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Number of Pairs of Interchangeable Rectangles (LC 2001) ─────
  (() => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const ref = (rectangles: number[][]) => {
      const seen: Record<string, number> = {};
      let total = 0;
      for (const r of rectangles) {
        const g = gcd(r[0], r[1]);
        const key = String(r[0] / g) + "/" + String(r[1] / g);
        if (seen[key] !== undefined) total += seen[key];
        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;
      }
      return total;
    };
    return {
      slug: "number-of-pairs-of-interchangeable-rectangles",
      title: "Number of Pairs of Interchangeable Rectangles",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Math", "Counting", "Amazon", "Google", "Walmart"],
      signature: { funcName: "interchangeableRectangles", params: [{ name: "rectangles", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Each entry `rectangles[i] = [width, height]` describes a rectangle. Two rectangles are **interchangeable** when they have the same width-to-height ratio.\n\nReturn the number of pairs `(i, j)` with `i < j` that are interchangeable.",
        [
          { in: "rectangles = [[4,8],[3,6],[10,20],[15,30]]", out: "6", note: "All four share the ratio 1/2, giving every one of the six pairs." },
          { in: "rectangles = [[4,5],[7,8]]", out: "0", note: "4/5 and 7/8 differ." },
          { in: "rectangles = [[2,3],[4,6],[5,7]]", out: "1", note: "Only the first two match, both reducing to 2/3." },
        ],
        ["1 <= rectangles.length <= 1000", "rectangles[i].length == 2", "1 <= width, height <= 100000"]),
      hints: [
        "Comparing `w1 / h1 == w2 / h2` in floating point is a correctness trap at these magnitudes.",
        "Reduce each ratio by the greatest common divisor and use the reduced pair as an exact key.",
        "Then the answer is the number of same-key pairs, which one pass with a tally gives.",
      ],
      editorial: explain({
        idea: "Two ratios are equal exactly when their reduced fractions match, so dividing width and height by their gcd gives a canonical, exact key. The rest is counting pairs within each group.",
        steps: [
          "For each rectangle compute `g = gcd(width, height)` and form the key `(width/g, height/g)`.",
          "Sweep the list; before recording a key, add its current tally to the answer.",
          "Increment the tally.",
        ],
        why: "Reducing by the gcd yields the unique lowest-terms representative of a rational, so key equality is ratio equality with no rounding involved. Counting before inserting attributes each pair to its later index exactly once, which is the `i < j` requirement.",
        time: "O(n log V)",
        space: "O(n)",
        pitfalls: [
          "Floating-point division can make `10/20` and `15/30` compare unequal — or, worse, make genuinely different ratios compare equal.",
          "Squashing the key into a single number such as `w * 100000 + h` works only if the reduced values stay in range; a pair or a string key is safer.",
          "With 1000 rectangles the pair count reaches about 500000, which fits in a 32-bit integer, but a larger limit would not.",
        ],
      }),
      examples: [
        { input: "[[4,8],[3,6],[10,20],[15,30]]", expectedOutput: "6" },
        { input: "[[4,5],[7,8]]", expectedOutput: "0" },
        { input: "[[2,3],[4,6],[5,7]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const rectangles: number[][] = [];
        for (let i = 0; i < n; i++) {
          if (rng() < 0.5 && rectangles.length > 0) {
            const base = rectangles[ri(rng, 0, rectangles.length - 1)];
            const m = ri(rng, 1, 5);
            rectangles.push([base[0] * m, base[1] * m]);
          } else {
            rectangles.push([ri(rng, 1, 30), ri(rng, 1, 30)]);
          }
        }
        return { input: fmtIntMat(rectangles), expectedOutput: String(ref(rectangles)) };
      },
      solutions: {
        python: `from math import gcd\nfrom typing import List\n\ndef interchangeableRectangles(rectangles: List[List[int]]) -> int:\n    seen = {}\n    total = 0\n    for w, h in rectangles:\n        g = gcd(w, h)\n        key = (w // g, h // g)\n        total += seen.get(key, 0)\n        seen[key] = seen.get(key, 0) + 1\n    return total`,
        javascript: `var interchangeableRectangles = function(rectangles) {\n    var gcd = function(a, b) {\n        while (b !== 0) {\n            var t = a % b;\n            a = b;\n            b = t;\n        }\n        return a;\n    };\n    var seen = {}, total = 0;\n    for (var i = 0; i < rectangles.length; i++) {\n        var w = rectangles[i][0], h = rectangles[i][1];\n        var g = gcd(w, h);\n        var key = String(w / g) + "/" + String(h / g);\n        if (seen[key] !== undefined) total += seen[key];\n        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;\n    }\n    return total;\n};`,
        typescript: `function interchangeableRectangles(rectangles: number[][]): number {\n    var gcd = function(a: number, b: number): number {\n        while (b !== 0) {\n            var t = a % b;\n            a = b;\n            b = t;\n        }\n        return a;\n    };\n    var seen: { [key: string]: number } = {}, total = 0;\n    for (var i = 0; i < rectangles.length; i++) {\n        var w = rectangles[i][0], h = rectangles[i][1];\n        var g = gcd(w, h);\n        var key = String(w / g) + "/" + String(h / g);\n        if (seen[key] !== undefined) total += seen[key];\n        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;\n    }\n    return total;\n}`,
        java: `public static int interchangeableRectangles(int[][] rectangles) {\n    Map<String, Integer> seen = new HashMap<>();\n    int total = 0;\n    for (int[] r : rectangles) {\n        int a = r[0], b = r[1];\n        while (b != 0) { int t = a % b; a = b; b = t; }\n        String key = (r[0] / a) + "/" + (r[1] / a);\n        int c = seen.getOrDefault(key, 0);\n        total += c;\n        seen.put(key, c + 1);\n    }\n    return total;\n}`,
        cpp: `int interchangeableRectangles(vector<vector<int>>& rectangles) {\n    map<pair<int, int>, int> seen;\n    int total = 0;\n    for (auto& r : rectangles) {\n        int a = r[0], b = r[1];\n        while (b != 0) { int t = a % b; a = b; b = t; }\n        pair<int, int> key = { r[0] / a, r[1] / a };\n        total += seen[key];\n        seen[key]++;\n    }\n    return total;\n}`,
        c: `static int gcdRect(int a, int b) {\n    while (b != 0) { int t = a % b; a = b; b = t; }\n    return a;\n}\n\nint interchangeableRectangles(int** rectangles, int rectanglesSize, int* rectanglesColSize) {\n    int* rw = (int*) malloc((size_t) rectanglesSize * sizeof(int));\n    int* rh = (int*) malloc((size_t) rectanglesSize * sizeof(int));\n    for (int i = 0; i < rectanglesSize; i++) {\n        int g = gcdRect(rectangles[i][0], rectangles[i][1]);\n        rw[i] = rectangles[i][0] / g;\n        rh[i] = rectangles[i][1] / g;\n    }\n    int total = 0;\n    for (int i = 0; i < rectanglesSize; i++) {\n        for (int j = 0; j < i; j++) {\n            if (rw[i] == rw[j] && rh[i] == rh[j]) total++;\n        }\n    }\n    free(rw);\n    free(rh);\n    return total;\n}`,
        csharp: `public static int InterchangeableRectangles(int[][] rectangles)\n{\n    var seen = new Dictionary<string, int>();\n    int total = 0;\n    foreach (var r in rectangles)\n    {\n        int a = r[0], b = r[1];\n        while (b != 0) { int t = a % b; a = b; b = t; }\n        string key = (r[0] / a) + "/" + (r[1] / a);\n        int c;\n        c = seen.TryGetValue(key, out c) ? c : 0;\n        total += c;\n        seen[key] = c + 1;\n    }\n    return total;\n}`,
        go: `func interchangeableRectangles(rectangles [][]int) int {\n\ttype ratio struct{ w, h int }\n\tseen := map[ratio]int{}\n\ttotal := 0\n\tfor _, r := range rectangles {\n\t\ta, b := r[0], r[1]\n\t\tfor b != 0 {\n\t\t\ta, b = b, a%b\n\t\t}\n\t\tkey := ratio{r[0] / a, r[1] / a}\n\t\ttotal += seen[key]\n\t\tseen[key]++\n\t}\n\treturn total\n}`,
        kotlin: `fun interchangeableRectangles(rectangles: Array<IntArray>): Int {\n    val seen = HashMap<String, Int>()\n    var total = 0\n    for (r in rectangles) {\n        var a = r[0]\n        var b = r[1]\n        while (b != 0) {\n            val t = a % b\n            a = b\n            b = t\n        }\n        val key = "" + (r[0] / a) + "/" + (r[1] / a)\n        val c = seen[key] ?: 0\n        total += c\n        seen[key] = c + 1\n    }\n    return total\n}`,
        swift: `func interchangeableRectangles(_ rectangles: [[Int]]) -> Int {\n    var seen: [String: Int] = [:]\n    var total = 0\n    for r in rectangles {\n        var a = r[0]\n        var b = r[1]\n        while b != 0 {\n            let t = a % b\n            a = b\n            b = t\n        }\n        let key = "\\(r[0] / a)/\\(r[1] / a)"\n        let c = seen[key] ?? 0\n        total += c\n        seen[key] = c + 1\n    }\n    return total\n}`,
        rust: `fn interchangeableRectangles(rectangles: Vec<Vec<i32>>) -> i32 {\n    let mut seen: std::collections::HashMap<(i32, i32), i32> = std::collections::HashMap::new();\n    let mut total = 0i32;\n    for r in rectangles.iter() {\n        let (mut a, mut b) = (r[0], r[1]);\n        while b != 0 {\n            let t = a % b;\n            a = b;\n            b = t;\n        }\n        let key = (r[0] / a, r[1] / a);\n        let c = *seen.get(&key).unwrap_or(&0);\n        total += c;\n        seen.insert(key, c + 1);\n    }\n    total\n}`,
        php: `function interchangeableRectangles($rectangles) {\n    $seen = array();\n    $total = 0;\n    foreach ($rectangles as $r) {\n        $a = $r[0];\n        $b = $r[1];\n        while ($b != 0) { $t = $a % $b; $a = $b; $b = $t; }\n        $key = ($r[0] / $a) . "/" . ($r[1] / $a);\n        if (isset($seen[$key])) $total += $seen[$key];\n        $seen[$key] = isset($seen[$key]) ? $seen[$key] + 1 : 1;\n    }\n    return $total;\n}`,
        ruby: `def interchangeableRectangles(rectangles)\n  seen = Hash.new(0)\n  total = 0\n  rectangles.each do |r|\n    g = r[0].gcd(r[1])\n    key = [r[0] / g, r[1] / g]\n    total += seen[key]\n    seen[key] += 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Smallest String With Swaps (LC 1202) ────────────────────────
  (() => {
    const ref = (s: string, pairs: number[][]) => {
      const n = s.length;
      const parent = Array.from({ length: n }, (_, i) => i);
      const find = (x: number): number => {
        while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }
        return x;
      };
      for (const p of pairs) {
        const a = find(p[0]), b = find(p[1]);
        if (a !== b) parent[a] = b;
      }
      const groups: Record<string, number[]> = {};
      for (let i = 0; i < n; i++) {
        const r = String(find(i));
        if (groups[r] === undefined) groups[r] = [];
        groups[r].push(i);
      }
      const out = s.split("");
      for (const key of Object.keys(groups)) {
        const idx = groups[key];
        const chars = idx.map((i) => s.charAt(i)).sort();
        for (let t = 0; t < idx.length; t++) out[idx[t]] = chars[t];
      }
      return out.join("");
    };
    return {
      slug: "smallest-string-with-swaps",
      title: "Smallest String With Swaps",
      difficulty: "MEDIUM" as const,
      tags: ["Union Find", "Hash Table", "String", "Sorting", "Amazon", "Google", "Uber"],
      signature: { funcName: "smallestStringWithSwaps", params: [{ name: "s", type: "string" as const }, { name: "pairs", type: "int[][]" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `s` and a list `pairs` of index pairs. You may swap the characters at any listed pair **any number of times**, in any order.\n\nReturn the lexicographically smallest string reachable this way.",
        [
          { in: 's = "dcab", pairs = [[0,3],[1,2]]', out: "bacd", note: "Indices 0 and 3 can swap, as can 1 and 2, giving two independent pairs." },
          { in: 's = "dcab", pairs = [[0,3],[1,2],[0,2]]', out: "abcd", note: "The third pair links everything into one group, so all four characters can be sorted freely." },
          { in: 's = "cba", pairs = [[0,1],[1,2]]', out: "abc" },
        ],
        ["1 <= s.length <= 100000", "0 <= pairs.length <= 100000", "0 <= pairs[i][0], pairs[i][1] < s.length", "s consists of lowercase English letters."]),
      hints: [
        "Repeated swaps mean the pairs define **connected components** of indices.",
        "Within one component any permutation of its characters is reachable.",
        "So sort each component's characters and write them back into that component's indices in sorted order.",
      ],
      editorial: explain({
        idea: "Swapping along edges any number of times generates every permutation within a connected component. So the smallest string sorts each component's multiset of characters into its component's sorted index list.",
        steps: [
          "Union the indices of every pair with a disjoint-set structure.",
          "Group the indices by their component root.",
          "For each group, collect its characters, sort them, and write them back into the group's indices in increasing index order.",
        ],
        why: "Transpositions along a connected graph generate the full symmetric group on its vertices, so any arrangement of a component's characters is reachable. Placing the smallest available character at the smallest index of the component is greedily optimal and cannot be beaten, because positions in different components are independent.",
        time: "O(n log n + p α(n))",
        space: "O(n)",
        pitfalls: [
          "Swapping only the listed pairs once misses arrangements that need a chain of swaps.",
          "Sorting the whole string ignores the component boundaries and is wrong whenever the graph is disconnected.",
          "Path compression matters: without it the union-find degrades badly at the stated limits.",
        ],
      }),
      examples: [
        { input: '"dcab"\n[[0,3],[1,2]]', expectedOutput: "bacd" },
        { input: '"dcab"\n[[0,3],[1,2],[0,2]]', expectedOutput: "abcd" },
        { input: '"cba"\n[[0,1],[1,2]]', expectedOutput: "abc" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 14);
        const s = randLower(rng, n, n, "abcd");
        const pairs: number[][] = [];
        for (let t = ri(rng, 0, n + 2); t > 0; t--) {
          const a = ri(rng, 0, n - 1);
          const b = ri(rng, 0, n - 1);
          pairs.push([a, b]);
        }
        return { input: `"${s}"\n${fmtIntMat(pairs)}`, expectedOutput: ref(s, pairs) };
      },
      solutions: {
        python: `from typing import List\n\ndef smallestStringWithSwaps(s: str, pairs: List[List[int]]) -> str:\n    n = len(s)\n    parent = list(range(n))\n\n    def find(x: int) -> int:\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    for a, b in pairs:\n        ra, rb = find(a), find(b)\n        if ra != rb:\n            parent[ra] = rb\n    groups = {}\n    for i in range(n):\n        groups.setdefault(find(i), []).append(i)\n    out = list(s)\n    for idx in groups.values():\n        chars = sorted(s[i] for i in idx)\n        for t, i in enumerate(idx):\n            out[i] = chars[t]\n    return "".join(out)`,
        javascript: `var smallestStringWithSwaps = function(s, pairs) {\n    var n = s.length;\n    var parent = [];\n    for (var t = 0; t < n; t++) parent.push(t);\n    var find = function(x) {\n        while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }\n        return x;\n    };\n    for (var p = 0; p < pairs.length; p++) {\n        var a = find(pairs[p][0]), b = find(pairs[p][1]);\n        if (a !== b) parent[a] = b;\n    }\n    var groups = {};\n    for (var i = 0; i < n; i++) {\n        var r = String(find(i));\n        if (groups[r] === undefined) groups[r] = [];\n        groups[r].push(i);\n    }\n    var out = s.split("");\n    var keys = Object.keys(groups);\n    for (var k = 0; k < keys.length; k++) {\n        var idx = groups[keys[k]];\n        var chars = [];\n        for (var m = 0; m < idx.length; m++) chars.push(s.charAt(idx[m]));\n        chars.sort();\n        for (var q = 0; q < idx.length; q++) out[idx[q]] = chars[q];\n    }\n    return out.join("");\n};`,
        typescript: `function smallestStringWithSwaps(s: string, pairs: number[][]): string {\n    var n = s.length;\n    var parent: number[] = [];\n    for (var t = 0; t < n; t++) parent.push(t);\n    var find = function(x: number): number {\n        while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; }\n        return x;\n    };\n    for (var p = 0; p < pairs.length; p++) {\n        var a = find(pairs[p][0]), b = find(pairs[p][1]);\n        if (a !== b) parent[a] = b;\n    }\n    var groups: { [key: string]: number[] } = {};\n    for (var i = 0; i < n; i++) {\n        var r = String(find(i));\n        if (groups[r] === undefined) groups[r] = [];\n        groups[r].push(i);\n    }\n    var out = s.split("");\n    var keys = Object.keys(groups);\n    for (var k = 0; k < keys.length; k++) {\n        var idx = groups[keys[k]];\n        var chars: string[] = [];\n        for (var m = 0; m < idx.length; m++) chars.push(s.charAt(idx[m]));\n        chars.sort();\n        for (var q = 0; q < idx.length; q++) out[idx[q]] = chars[q];\n    }\n    return out.join("");\n}`,
        java: `public static String smallestStringWithSwaps(String s, int[][] pairs) {\n    int n = s.length();\n    int[] parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    for (int[] p : pairs) {\n        int a = findRoot(parent, p[0]);\n        int b = findRoot(parent, p[1]);\n        if (a != b) parent[a] = b;\n    }\n    Map<Integer, List<Integer>> groups = new HashMap<>();\n    for (int i = 0; i < n; i++) groups.computeIfAbsent(findRoot(parent, i), z -> new ArrayList<>()).add(i);\n    char[] out = s.toCharArray();\n    for (List<Integer> idx : groups.values()) {\n        char[] chars = new char[idx.size()];\n        for (int t = 0; t < idx.size(); t++) chars[t] = s.charAt(idx.get(t));\n        Arrays.sort(chars);\n        for (int t = 0; t < idx.size(); t++) out[idx.get(t)] = chars[t];\n    }\n    return new String(out);\n}\n\nstatic int findRoot(int[] parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}`,
        cpp: `static int findRootSwap(vector<int>& parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nstring smallestStringWithSwaps(string s, vector<vector<int>>& pairs) {\n    int n = (int) s.size();\n    vector<int> parent(n);\n    for (int i = 0; i < n; i++) parent[i] = i;\n    for (auto& p : pairs) {\n        int a = findRootSwap(parent, p[0]);\n        int b = findRootSwap(parent, p[1]);\n        if (a != b) parent[a] = b;\n    }\n    unordered_map<int, vector<int>> groups;\n    for (int i = 0; i < n; i++) groups[findRootSwap(parent, i)].push_back(i);\n    string out = s;\n    for (auto& g : groups) {\n        string chars;\n        for (int i : g.second) chars += s[i];\n        sort(chars.begin(), chars.end());\n        for (size_t t = 0; t < g.second.size(); t++) out[g.second[t]] = chars[t];\n    }\n    return out;\n}`,
        c: `static int findRootC(int* parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nstatic int cmpCharSwap(const void* a, const void* b) {\n    return (*(const char*) a) - (*(const char*) b);\n}\n\nchar* smallestStringWithSwaps(char* s, int** pairs, int pairsSize, int* pairsColSize) {\n    int n = (int) strlen(s);\n    int* parent = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) parent[i] = i;\n    for (int p = 0; p < pairsSize; p++) {\n        int a = findRootC(parent, pairs[p][0]);\n        int b = findRootC(parent, pairs[p][1]);\n        if (a != b) parent[a] = b;\n    }\n    char* out = (char*) malloc((size_t) n + 1);\n    strcpy(out, s);\n    int* idx = (int*) malloc((size_t) n * sizeof(int));\n    char* buf = (char*) malloc((size_t) n + 1);\n    int* done = (int*) calloc((size_t) n, sizeof(int));\n    for (int i = 0; i < n; i++) {\n        int root = findRootC(parent, i);\n        if (done[root]) continue;\n        done[root] = 1;\n        int m = 0;\n        for (int j = 0; j < n; j++) {\n            if (findRootC(parent, j) == root) { idx[m] = j; buf[m] = s[j]; m++; }\n        }\n        qsort(buf, (size_t) m, 1, cmpCharSwap);\n        for (int t = 0; t < m; t++) out[idx[t]] = buf[t];\n    }\n    free(parent);\n    free(idx);\n    free(buf);\n    free(done);\n    return out;\n}`,
        csharp: `public static string SmallestStringWithSwaps(string s, int[][] pairs)\n{\n    int n = s.Length;\n    int[] parent = new int[n];\n    for (int i = 0; i < n; i++) parent[i] = i;\n    Func<int, int> find = null;\n    find = x =>\n    {\n        while (parent[x] != x) { parent[x] = parent[parent[x]]; x = parent[x]; }\n        return x;\n    };\n    foreach (var p in pairs)\n    {\n        int a = find(p[0]), b = find(p[1]);\n        if (a != b) parent[a] = b;\n    }\n    var groups = new Dictionary<int, List<int>>();\n    for (int i = 0; i < n; i++)\n    {\n        int r = find(i);\n        if (!groups.ContainsKey(r)) groups[r] = new List<int>();\n        groups[r].Add(i);\n    }\n    char[] out_ = s.ToCharArray();\n    foreach (var idx in groups.Values)\n    {\n        char[] chars = new char[idx.Count];\n        for (int t = 0; t < idx.Count; t++) chars[t] = s[idx[t]];\n        Array.Sort(chars);\n        for (int t = 0; t < idx.Count; t++) out_[idx[t]] = chars[t];\n    }\n    return new string(out_);\n}`,
        go: `func smallestStringWithSwaps(s string, pairs [][]int) string {\n\tn := len(s)\n\tparent := make([]int, n)\n\tfor i := range parent {\n\t\tparent[i] = i\n\t}\n\tvar find func(int) int\n\tfind = func(x int) int {\n\t\tfor parent[x] != x {\n\t\t\tparent[x] = parent[parent[x]]\n\t\t\tx = parent[x]\n\t\t}\n\t\treturn x\n\t}\n\tfor _, p := range pairs {\n\t\ta, b := find(p[0]), find(p[1])\n\t\tif a != b {\n\t\t\tparent[a] = b\n\t\t}\n\t}\n\tgroups := map[int][]int{}\n\tfor i := 0; i < n; i++ {\n\t\tr := find(i)\n\t\tgroups[r] = append(groups[r], i)\n\t}\n\tout := []byte(s)\n\tfor _, idx := range groups {\n\t\tchars := make([]byte, len(idx))\n\t\tfor t, i := range idx {\n\t\t\tchars[t] = s[i]\n\t\t}\n\t\tsort.Slice(chars, func(a, b int) bool { return chars[a] < chars[b] })\n\t\tfor t, i := range idx {\n\t\t\tout[i] = chars[t]\n\t\t}\n\t}\n\treturn string(out)\n}`,
        kotlin: `fun smallestStringWithSwaps(s: String, pairs: Array<IntArray>): String {\n    val n = s.length\n    val parent = IntArray(n) { it }\n    fun find(start: Int): Int {\n        var x = start\n        while (parent[x] != x) {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    for (p in pairs) {\n        val a = find(p[0])\n        val b = find(p[1])\n        if (a != b) parent[a] = b\n    }\n    val groups = HashMap<Int, MutableList<Int>>()\n    for (i in 0 until n) groups.getOrPut(find(i)) { ArrayList() }.add(i)\n    val out = s.toCharArray()\n    for (idx in groups.values) {\n        val chars = idx.map { s[it] }.sorted()\n        for (t in idx.indices) out[idx[t]] = chars[t]\n    }\n    return String(out)\n}`,
        swift: `func smallestStringWithSwaps(_ s: String, _ pairs: [[Int]]) -> String {\n    let a = Array(s)\n    let n = a.count\n    var parent = Array(0..<n)\n    func find(_ start: Int) -> Int {\n        var x = start\n        while parent[x] != x {\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        }\n        return x\n    }\n    for p in pairs {\n        let ra = find(p[0])\n        let rb = find(p[1])\n        if ra != rb { parent[ra] = rb }\n    }\n    var groups: [Int: [Int]] = [:]\n    for i in 0..<n { groups[find(i), default: []].append(i) }\n    var out = a\n    for (_, idx) in groups {\n        let chars = idx.map { a[$0] }.sorted()\n        for t in 0..<idx.count { out[idx[t]] = chars[t] }\n    }\n    return String(out)\n}`,
        rust: `fn smallestStringWithSwaps(s: String, pairs: Vec<Vec<i32>>) -> String {\n    let a: Vec<u8> = s.clone().into_bytes();\n    let n = a.len();\n    let mut parent: Vec<usize> = (0..n).collect();\n    fn find(parent: &mut Vec<usize>, start: usize) -> usize {\n        let mut x = start;\n        while parent[x] != x {\n            parent[x] = parent[parent[x]];\n            x = parent[x];\n        }\n        x\n    }\n    for p in pairs.iter() {\n        let ra = find(&mut parent, p[0] as usize);\n        let rb = find(&mut parent, p[1] as usize);\n        if ra != rb {\n            parent[ra] = rb;\n        }\n    }\n    let mut groups: std::collections::HashMap<usize, Vec<usize>> = std::collections::HashMap::new();\n    for i in 0..n {\n        let r = find(&mut parent, i);\n        groups.entry(r).or_insert_with(Vec::new).push(i);\n    }\n    let mut out = a.clone();\n    for (_, idx) in groups.iter() {\n        let mut chars: Vec<u8> = idx.iter().map(|&i| a[i]).collect();\n        chars.sort();\n        for t in 0..idx.len() {\n            out[idx[t]] = chars[t];\n        }\n    }\n    String::from_utf8(out).unwrap()\n}`,
        php: `function smallestStringWithSwaps($s, $pairs) {\n    $n = strlen($s);\n    $parent = range(0, $n - 1);\n    $find = function($x) use (&$parent) {\n        while ($parent[$x] !== $x) { $parent[$x] = $parent[$parent[$x]]; $x = $parent[$x]; }\n        return $x;\n    };\n    foreach ($pairs as $p) {\n        $a = $find($p[0]);\n        $b = $find($p[1]);\n        if ($a !== $b) $parent[$a] = $b;\n    }\n    $groups = array();\n    for ($i = 0; $i < $n; $i++) {\n        $r = $find($i);\n        if (!isset($groups[$r])) $groups[$r] = array();\n        $groups[$r][] = $i;\n    }\n    $out = str_split($s);\n    foreach ($groups as $idx) {\n        $chars = array();\n        foreach ($idx as $i) $chars[] = $s[$i];\n        sort($chars);\n        foreach ($idx as $t => $i) $out[$i] = $chars[$t];\n    }\n    return implode("", $out);\n}`,
        ruby: `def smallestStringWithSwaps(s, pairs)\n  n = s.length\n  parent = (0...n).to_a\n  find = lambda do |x|\n    while parent[x] != x\n      parent[x] = parent[parent[x]]\n      x = parent[x]\n    end\n    x\n  end\n  pairs.each do |p|\n    a = find.call(p[0])\n    b = find.call(p[1])\n    parent[a] = b if a != b\n  end\n  groups = Hash.new { |h, k| h[k] = [] }\n  (0...n).each { |i| groups[find.call(i)] << i }\n  out = s.chars\n  groups.each_value do |idx|\n    chars = idx.map { |i| s[i] }.sort\n    idx.each_with_index { |i, t| out[i] = chars[t] }\n  end\n  out.join\nend`,
      },
    };
  })(),

  // ── Brick Wall (LC 554) ─────────────────────────────────────────
  (() => {
    const ref = (wall: number[][]) => {
      const edges: Record<string, number> = {};
      let best = 0;
      for (const row of wall) {
        let x = 0;
        for (let i = 0; i + 1 < row.length; i++) {
          x += row[i];
          const key = String(x);
          edges[key] = (edges[key] === undefined ? 0 : edges[key]) + 1;
          if (edges[key] > best) best = edges[key];
        }
      }
      return wall.length - best;
    };
    return {
      slug: "brick-wall",
      title: "Brick Wall",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Array", "Counting", "Amazon", "Google", "Meta"],
      signature: { funcName: "leastBricks", params: [{ name: "wall", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A rectangular brick wall is given as `wall`, where `wall[i]` lists the widths of the bricks in row `i` from left to right. Every row has the same total width.\n\nDraw a **vertical line** from top to bottom. The line crosses a brick unless it falls exactly on that brick's edge. The line may not be drawn along either outer border.\n\nReturn the fewest bricks the line must cross.",
        [
          { in: "wall = [[1,2,2,1],[3,1,2],[1,3,2],[2,4],[3,1,2],[1,3,1,1]]", out: "2", note: "A line at offset 4 passes through the edges of four rows, so it crosses only the other two." },
          { in: "wall = [[1],[1],[1]]", out: "3", note: "Only the outer borders are edges, and those are not allowed — every line crosses all three bricks." },
          { in: "wall = [[2,2],[2,2],[1,3]]", out: "1", note: "A line at offset 2 falls on an edge in the first two rows, so it crosses only the third." },
        ],
        ["1 <= wall.length <= 10000", "1 <= wall[i].length <= 10000", "Each row sums to the same total width.", "1 <= brick width <= 2147483647"]),
      hints: [
        "Crossing the fewest bricks is the same as passing through the **most** edges.",
        "For each row, the interior edges sit at its running prefix sums — excluding the final one, which is the outer border.",
        "Tally those offsets across all rows; the busiest offset wins.",
      ],
      editorial: explain({
        idea: "Flip the objective. A line at a given offset crosses `rows - (number of rows whose edge falls there)` bricks, so minimising crossings means maximising shared edges.",
        steps: [
          "For every row, walk its bricks accumulating a running width and record each running total **except the last**, which is the wall's right border.",
          "Tally these offsets in a hash map across all rows.",
          "The answer is `wall.length - maxTally`.",
        ],
        why: "Each row contributes at most one edge at a given offset, so the tally at an offset is exactly the number of rows the line slips through. Excluding the final prefix sum is what enforces the rule against drawing along the outer border — and it also handles the all-one-brick case, where no offsets are recorded and the answer is every row.",
        time: "O(total bricks)",
        space: "O(distinct offsets)",
        pitfalls: [
          "Including the last prefix sum makes the right border look like the best line and returns 0.",
          "Brick widths reach the 32-bit limit, so the running offset needs 64 bits in fixed-width languages.",
          "Scanning candidate offsets one by one is hopeless — the wall can be billions of units wide.",
        ],
      }),
      examples: [
        { input: "[[1,2,2,1],[3,1,2],[1,3,2],[2,4],[3,1,2],[1,3,1,1]]", expectedOutput: "2" },
        { input: "[[1],[1],[1]]", expectedOutput: "3" },
        { input: "[[2,2],[2,2],[1,3]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const total = ri(rng, 1, 12);
        const rows = ri(rng, 1, 8);
        const wall: number[][] = [];
        for (let r = 0; r < rows; r++) {
          const row: number[] = [];
          let left = total;
          while (left > 0) {
            const w = ri(rng, 1, left);
            row.push(w);
            left -= w;
          }
          wall.push(row);
        }
        return { input: fmtIntMat(wall), expectedOutput: String(ref(wall)) };
      },
      solutions: {
        python: `from typing import List\n\ndef leastBricks(wall: List[List[int]]) -> int:\n    edges = {}\n    best = 0\n    for row in wall:\n        x = 0\n        for w in row[:-1]:\n            x += w\n            edges[x] = edges.get(x, 0) + 1\n            best = max(best, edges[x])\n    return len(wall) - best`,
        javascript: `var leastBricks = function(wall) {\n    var edges = {}, best = 0;\n    for (var r = 0; r < wall.length; r++) {\n        var row = wall[r], x = 0;\n        for (var i = 0; i + 1 < row.length; i++) {\n            x += row[i];\n            var key = String(x);\n            edges[key] = (edges[key] === undefined ? 0 : edges[key]) + 1;\n            if (edges[key] > best) best = edges[key];\n        }\n    }\n    return wall.length - best;\n};`,
        typescript: `function leastBricks(wall: number[][]): number {\n    var edges: { [key: string]: number } = {}, best = 0;\n    for (var r = 0; r < wall.length; r++) {\n        var row = wall[r], x = 0;\n        for (var i = 0; i + 1 < row.length; i++) {\n            x += row[i];\n            var key = String(x);\n            edges[key] = (edges[key] === undefined ? 0 : edges[key]) + 1;\n            if (edges[key] > best) best = edges[key];\n        }\n    }\n    return wall.length - best;\n}`,
        java: `public static int leastBricks(int[][] wall) {\n    Map<Long, Integer> edges = new HashMap<>();\n    int best = 0;\n    for (int[] row : wall) {\n        long x = 0;\n        for (int i = 0; i + 1 < row.length; i++) {\n            x += row[i];\n            int c = edges.getOrDefault(x, 0) + 1;\n            edges.put(x, c);\n            if (c > best) best = c;\n        }\n    }\n    return wall.length - best;\n}`,
        cpp: `int leastBricks(vector<vector<int>>& wall) {\n    unordered_map<long long, int> edges;\n    int best = 0;\n    for (auto& row : wall) {\n        long long x = 0;\n        for (size_t i = 0; i + 1 < row.size(); i++) {\n            x += row[i];\n            int c = ++edges[x];\n            if (c > best) best = c;\n        }\n    }\n    return (int) wall.size() - best;\n}`,
        c: `int leastBricks(int** wall, int wallSize, int* wallColSize) {\n    int cap = 16;\n    int total = 0;\n    for (int r = 0; r < wallSize; r++) total += wallColSize[r];\n    while (cap < 2 * total + 8) cap <<= 1;\n    int mask = cap - 1;\n    long long* keys = (long long*) calloc((size_t) cap, sizeof(long long));\n    int* used = (int*) calloc((size_t) cap, sizeof(int));\n    int* cnt = (int*) calloc((size_t) cap, sizeof(int));\n    int best = 0;\n    for (int r = 0; r < wallSize; r++) {\n        long long x = 0;\n        for (int i = 0; i + 1 < wallColSize[r]; i++) {\n            x += wall[r][i];\n            unsigned long long h = (unsigned long long) x * 1146111111111111u;\n            int s = (int) ((h >> 20) & (unsigned long long) mask);\n            while (used[s] && keys[s] != x) s = (s + 1) & mask;\n            if (!used[s]) { used[s] = 1; keys[s] = x; cnt[s] = 0; }\n            cnt[s]++;\n            if (cnt[s] > best) best = cnt[s];\n        }\n    }\n    free(keys);\n    free(used);\n    free(cnt);\n    return wallSize - best;\n}`,
        csharp: `public static int LeastBricks(int[][] wall)\n{\n    var edges = new Dictionary<long, int>();\n    int best = 0;\n    foreach (var row in wall)\n    {\n        long x = 0;\n        for (int i = 0; i + 1 < row.Length; i++)\n        {\n            x += row[i];\n            int c;\n            c = (edges.TryGetValue(x, out c) ? c : 0) + 1;\n            edges[x] = c;\n            if (c > best) best = c;\n        }\n    }\n    return wall.Length - best;\n}`,
        go: `func leastBricks(wall [][]int) int {\n\tedges := map[int]int{}\n\tbest := 0\n\tfor _, row := range wall {\n\t\tx := 0\n\t\tfor i := 0; i+1 < len(row); i++ {\n\t\t\tx += row[i]\n\t\t\tedges[x]++\n\t\t\tif edges[x] > best {\n\t\t\t\tbest = edges[x]\n\t\t\t}\n\t\t}\n\t}\n\treturn len(wall) - best\n}`,
        kotlin: `fun leastBricks(wall: Array<IntArray>): Int {\n    val edges = HashMap<Long, Int>()\n    var best = 0\n    for (row in wall) {\n        var x = 0L\n        for (i in 0 until row.size - 1) {\n            x += row[i]\n            val c = (edges[x] ?: 0) + 1\n            edges[x] = c\n            if (c > best) best = c\n        }\n    }\n    return wall.size - best\n}`,
        swift: `func leastBricks(_ wall: [[Int]]) -> Int {\n    var edges: [Int: Int] = [:]\n    var best = 0\n    for row in wall {\n        var x = 0\n        var i = 0\n        while i + 1 < row.count {\n            x += row[i]\n            let c = (edges[x] ?? 0) + 1\n            edges[x] = c\n            if c > best { best = c }\n            i += 1\n        }\n    }\n    return wall.count - best\n}`,
        rust: `fn leastBricks(wall: Vec<Vec<i32>>) -> i32 {\n    let mut edges: std::collections::HashMap<i64, i32> = std::collections::HashMap::new();\n    let mut best = 0i32;\n    for row in wall.iter() {\n        let mut x: i64 = 0;\n        for i in 0..row.len().saturating_sub(1) {\n            x += row[i] as i64;\n            let e = edges.entry(x).or_insert(0);\n            *e += 1;\n            if *e > best {\n                best = *e;\n            }\n        }\n    }\n    wall.len() as i32 - best\n}`,
        php: `function leastBricks($wall) {\n    $edges = array();\n    $best = 0;\n    foreach ($wall as $row) {\n        $x = 0;\n        for ($i = 0; $i + 1 < count($row); $i++) {\n            $x += $row[$i];\n            $edges[$x] = isset($edges[$x]) ? $edges[$x] + 1 : 1;\n            if ($edges[$x] > $best) $best = $edges[$x];\n        }\n    }\n    return count($wall) - $best;\n}`,
        ruby: `def leastBricks(wall)\n  edges = Hash.new(0)\n  best = 0\n  wall.each do |row|\n    x = 0\n    (0...(row.length - 1)).each do |i|\n      x += row[i]\n      edges[x] += 1\n      best = edges[x] if edges[x] > best\n    end\n  end\n  wall.length - best\nend`,
      },
    };
  })(),

  // ── Equal Row and Column Pairs (LC 2352) ────────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      const rows: Record<string, number> = {};
      for (const row of grid) {
        const key = row.join(",");
        rows[key] = (rows[key] === undefined ? 0 : rows[key]) + 1;
      }
      let total = 0;
      for (let c = 0; c < n; c++) {
        const col: number[] = [];
        for (let r = 0; r < n; r++) col.push(grid[r][c]);
        const key = col.join(",");
        if (rows[key] !== undefined) total += rows[key];
      }
      return total;
    };
    return {
      slug: "equal-row-and-column-pairs",
      title: "Equal Row and Column Pairs",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Matrix", "Simulation", "Amazon", "Adobe", "Walmart"],
      signature: { funcName: "equalPairs", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an `n x n` integer matrix `grid`, return the number of pairs `(r, c)` such that row `r` and column `c` hold the same values **in the same order**.",
        [
          { in: "grid = [[3,2,1],[1,7,6],[2,7,7]]", out: "1", note: "Row 2 is [2,7,7] and column 1 read downwards is [2,7,7]." },
          { in: "grid = [[3,1,2,2],[1,4,4,5],[2,4,2,2],[2,4,2,2]]", out: "3", note: "Rows 2 and 3 are identical and each matches column 2; row 1 matches column 1." },
          { in: "grid = [[1,2],[3,4]]", out: "0" },
        ],
        ["1 <= n <= 200", "grid.length == grid[i].length == n", "1 <= grid[i][j] <= 100000"]),
      hints: [
        "Comparing every row against every column is O(n³) — fine at n = 200, but the hash approach is cleaner.",
        "Turn each row into a single hashable key and tally the keys.",
        "Then build each column's key and add its tally to the answer.",
      ],
      editorial: explain({
        idea: "Encode each row as one key, tally the keys, then look each column up. Because rows can repeat, the tally — not a set — is what makes the pair count come out right.",
        steps: [
          "Build a map from row-encoding to how many rows produce it.",
          "For each column `c`, read `grid[0][c], grid[1][c], …` into a sequence and encode it the same way.",
          "Add the map's tally for that encoding to the answer.",
        ],
        why: "A pair `(r, c)` qualifies exactly when row `r` and column `c` encode identically, so each column contributes one pair for every row sharing its encoding — which is precisely the stored tally.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "A set of row encodings loses multiplicity and undercounts whenever two rows are identical.",
          "Joining values without a separator makes `[1,23]` and `[12,3]` collide; join on a delimiter.",
          "Reading a column left to right instead of top to bottom transposes the comparison.",
        ],
      }),
      examples: [
        { input: "[[3,2,1],[1,7,6],[2,7,7]]", expectedOutput: "1" },
        { input: "[[3,1,2,2],[1,4,4,5],[2,4,2,2],[2,4,2,2]]", expectedOutput: "3" },
        { input: "[[1,2],[3,4]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 7);
        const hi = rng() < 0.6 ? 3 : 100000;
        const grid: number[][] = [];
        for (let r = 0; r < n; r++) grid.push(Array.from({ length: n }, () => ri(rng, 1, hi)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef equalPairs(grid: List[List[int]]) -> int:\n    n = len(grid)\n    rows = {}\n    for row in grid:\n        key = tuple(row)\n        rows[key] = rows.get(key, 0) + 1\n    total = 0\n    for c in range(n):\n        key = tuple(grid[r][c] for r in range(n))\n        total += rows.get(key, 0)\n    return total`,
        javascript: `var equalPairs = function(grid) {\n    var n = grid.length;\n    var rows = {};\n    for (var r = 0; r < n; r++) {\n        var key = grid[r].join(",");\n        rows[key] = (rows[key] === undefined ? 0 : rows[key]) + 1;\n    }\n    var total = 0;\n    for (var c = 0; c < n; c++) {\n        var col = [];\n        for (var i = 0; i < n; i++) col.push(grid[i][c]);\n        var ck = col.join(",");\n        if (rows[ck] !== undefined) total += rows[ck];\n    }\n    return total;\n};`,
        typescript: `function equalPairs(grid: number[][]): number {\n    var n = grid.length;\n    var rows: { [key: string]: number } = {};\n    for (var r = 0; r < n; r++) {\n        var key = grid[r].join(",");\n        rows[key] = (rows[key] === undefined ? 0 : rows[key]) + 1;\n    }\n    var total = 0;\n    for (var c = 0; c < n; c++) {\n        var col: number[] = [];\n        for (var i = 0; i < n; i++) col.push(grid[i][c]);\n        var ck = col.join(",");\n        if (rows[ck] !== undefined) total += rows[ck];\n    }\n    return total;\n}`,
        java: `public static int equalPairs(int[][] grid) {\n    int n = grid.length;\n    Map<String, Integer> rows = new HashMap<>();\n    for (int[] row : grid) {\n        StringBuilder sb = new StringBuilder();\n        for (int v : row) sb.append(v).append(',');\n        String key = sb.toString();\n        rows.put(key, rows.getOrDefault(key, 0) + 1);\n    }\n    int total = 0;\n    for (int c = 0; c < n; c++) {\n        StringBuilder sb = new StringBuilder();\n        for (int r = 0; r < n; r++) sb.append(grid[r][c]).append(',');\n        total += rows.getOrDefault(sb.toString(), 0);\n    }\n    return total;\n}`,
        cpp: `int equalPairs(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    map<vector<int>, int> rows;\n    for (auto& row : grid) rows[row]++;\n    int total = 0;\n    for (int c = 0; c < n; c++) {\n        vector<int> col;\n        for (int r = 0; r < n; r++) col.push_back(grid[r][c]);\n        auto it = rows.find(col);\n        if (it != rows.end()) total += it->second;\n    }\n    return total;\n}`,
        c: `int equalPairs(int** grid, int gridSize, int* gridColSize) {\n    int n = gridSize;\n    int total = 0;\n    for (int r = 0; r < n; r++) {\n        for (int c = 0; c < n; c++) {\n            int ok = 1;\n            for (int i = 0; i < n; i++) {\n                if (grid[r][i] != grid[i][c]) { ok = 0; break; }\n            }\n            if (ok) total++;\n        }\n    }\n    return total;\n}`,
        csharp: `public static int EqualPairs(int[][] grid)\n{\n    int n = grid.Length;\n    var rows = new Dictionary<string, int>();\n    foreach (var row in grid)\n    {\n        string key = string.Join(",", row);\n        int c;\n        rows[key] = (rows.TryGetValue(key, out c) ? c : 0) + 1;\n    }\n    int total = 0;\n    for (int c = 0; c < n; c++)\n    {\n        var col = new int[n];\n        for (int r = 0; r < n; r++) col[r] = grid[r][c];\n        int cnt;\n        if (rows.TryGetValue(string.Join(",", col), out cnt)) total += cnt;\n    }\n    return total;\n}`,
        go: `func equalPairs(grid [][]int) int {\n\tn := len(grid)\n\trows := map[string]int{}\n\tfor _, row := range grid {\n\t\tparts := make([]string, n)\n\t\tfor i, v := range row {\n\t\t\tparts[i] = strconv.Itoa(v)\n\t\t}\n\t\trows[strings.Join(parts, ",")]++\n\t}\n\ttotal := 0\n\tfor c := 0; c < n; c++ {\n\t\tparts := make([]string, n)\n\t\tfor r := 0; r < n; r++ {\n\t\t\tparts[r] = strconv.Itoa(grid[r][c])\n\t\t}\n\t\ttotal += rows[strings.Join(parts, ",")]\n\t}\n\treturn total\n}`,
        kotlin: `fun equalPairs(grid: Array<IntArray>): Int {\n    val n = grid.size\n    val rows = HashMap<String, Int>()\n    for (row in grid) {\n        val key = row.joinToString(",")\n        rows[key] = (rows[key] ?: 0) + 1\n    }\n    var total = 0\n    for (c in 0 until n) {\n        val col = IntArray(n) { grid[it][c] }\n        total += rows[col.joinToString(",")] ?: 0\n    }\n    return total\n}`,
        swift: `func equalPairs(_ grid: [[Int]]) -> Int {\n    let n = grid.count\n    var rows: [String: Int] = [:]\n    for row in grid {\n        let key = row.map { String($0) }.joined(separator: ",")\n        rows[key] = (rows[key] ?? 0) + 1\n    }\n    var total = 0\n    for c in 0..<n {\n        var col: [Int] = []\n        for r in 0..<n { col.append(grid[r][c]) }\n        let key = col.map { String($0) }.joined(separator: ",")\n        total += rows[key] ?? 0\n    }\n    return total\n}`,
        rust: `fn equalPairs(grid: Vec<Vec<i32>>) -> i32 {\n    let n = grid.len();\n    let mut rows: std::collections::HashMap<Vec<i32>, i32> = std::collections::HashMap::new();\n    for row in grid.iter() {\n        *rows.entry(row.clone()).or_insert(0) += 1;\n    }\n    let mut total = 0i32;\n    for c in 0..n {\n        let mut col: Vec<i32> = Vec::with_capacity(n);\n        for r in 0..n {\n            col.push(grid[r][c]);\n        }\n        if let Some(&cnt) = rows.get(&col) {\n            total += cnt;\n        }\n    }\n    total\n}`,
        php: `function equalPairs($grid) {\n    $n = count($grid);\n    $rows = array();\n    foreach ($grid as $row) {\n        $key = implode(",", $row);\n        $rows[$key] = isset($rows[$key]) ? $rows[$key] + 1 : 1;\n    }\n    $total = 0;\n    for ($c = 0; $c < $n; $c++) {\n        $col = array();\n        for ($r = 0; $r < $n; $r++) $col[] = $grid[$r][$c];\n        $key = implode(",", $col);\n        if (isset($rows[$key])) $total += $rows[$key];\n    }\n    return $total;\n}`,
        ruby: `def equalPairs(grid)\n  n = grid.length\n  rows = Hash.new(0)\n  grid.each { |row| rows[row] += 1 }\n  total = 0\n  (0...n).each do |c|\n    col = (0...n).map { |r| grid[r][c] }\n    total += rows[col]\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Determine if Two Strings Are Close (LC 1657) ────────────────
  (() => {
    const ref = (word1: string, word2: string) => {
      if (word1.length !== word2.length) return false;
      const c1 = new Array(26).fill(0), c2 = new Array(26).fill(0);
      for (let i = 0; i < word1.length; i++) c1[word1.charCodeAt(i) - 97]++;
      for (let i = 0; i < word2.length; i++) c2[word2.charCodeAt(i) - 97]++;
      for (let c = 0; c < 26; c++) {
        if ((c1[c] === 0) !== (c2[c] === 0)) return false;
      }
      const f1 = c1.filter((x) => x > 0).sort((a, b) => a - b);
      const f2 = c2.filter((x) => x > 0).sort((a, b) => a - b);
      if (f1.length !== f2.length) return false;
      for (let i = 0; i < f1.length; i++) { if (f1[i] !== f2[i]) return false; }
      return true;
    };
    return {
      slug: "determine-if-two-strings-are-close",
      title: "Determine if Two Strings Are Close",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Counting", "Sorting", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "closeStrings", params: [{ name: "word1", type: "string" as const }, { name: "word2", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Two strings are **close** if one can be turned into the other using these operations any number of times:\n\n1. swap any two existing characters (for example `\"abcde\"` to `\"aecdb\"`);\n2. transform **every** occurrence of one existing character into another existing character, and vice versa (for example `\"aacabb\"` to `\"bbcbaa\"` by swapping all a's with all b's).\n\nReturn `true` if `word1` and `word2` are close.",
        [
          { in: 'word1 = "abc", word2 = "bca"', out: "true", note: "Swapping characters is enough." },
          { in: 'word1 = "a", word2 = "aa"', out: "false", note: "Neither operation changes the length." },
          { in: 'word1 = "cabbba", word2 = "abbccc"', out: "true", note: "Both use {a,b,c} and both have the frequency multiset {1,2,3}." },
        ],
        ["1 <= word1.length, word2.length <= 100000", "Both strings consist of lowercase English letters."]),
      hints: [
        "Operation 1 says order does not matter — only the frequencies do.",
        "Operation 2 says the frequencies can be **permuted** among the characters, but no character can be created or destroyed.",
        "So two conditions: the two strings use exactly the same **set** of letters, and their sorted frequency lists are identical.",
      ],
      editorial: explain({
        idea: "Swaps make order irrelevant; the second operation lets frequencies move between letters but never introduces a new letter. That leaves exactly two invariants to compare.",
        steps: [
          "Count the letters of each word.",
          "Check that a letter is present in one word exactly when it is present in the other.",
          "Collect the non-zero counts from each word, sort both lists, and check they match.",
        ],
        why: "The first operation preserves the multiset of counts and the set of letters used; the second permutes counts among used letters, again preserving both. Conversely, when both invariants match, a sequence of the second operation can align the counts letter by letter and swaps finish the job — so the two conditions are exactly right.",
        time: "O(n + 26 log 26)",
        space: "O(1)",
        pitfalls: [
          "Comparing only the sorted frequency lists accepts `\"aaabb\"` and `\"cccdd\"`, which use different letters.",
          "Comparing only the letter sets accepts `\"aaab\"` and `\"aabb\"`, whose frequency multisets `{1,3}` and `{2,2}` differ.",
          "Different lengths can be rejected immediately.",
        ],
      }),
      examples: [
        { input: '"abc"\n"bca"', expectedOutput: "true" },
        { input: '"a"\n"aa"', expectedOutput: "false" },
        { input: '"cabbba"\n"abbccc"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcd";
        const word1 = randLower(rng, 1, 20, alphabet);
        let word2: string;
        if (rng() < 0.45) {
          word2 = shuffle(rng, word1.split("")).join("");
          if (rng() < 0.5) {
            const swapFrom = pick(rng, alphabet.split(""));
            const swapTo = pick(rng, alphabet.split(""));
            word2 = word2.split("").map((c) => (c === swapFrom ? swapTo : c === swapTo ? swapFrom : c)).join("");
          }
        } else {
          word2 = randLower(rng, 1, 20, alphabet);
        }
        return { input: `"${word1}"\n"${word2}"`, expectedOutput: bool(ref(word1, word2)) };
      },
      solutions: {
        python: `def closeStrings(word1: str, word2: str) -> bool:\n    if len(word1) != len(word2):\n        return False\n    c1 = [0] * 26\n    c2 = [0] * 26\n    for ch in word1:\n        c1[ord(ch) - 97] += 1\n    for ch in word2:\n        c2[ord(ch) - 97] += 1\n    for i in range(26):\n        if (c1[i] == 0) != (c2[i] == 0):\n            return False\n    return sorted(x for x in c1 if x) == sorted(x for x in c2 if x)`,
        javascript: `var closeStrings = function(word1, word2) {\n    if (word1.length !== word2.length) return false;\n    var c1 = [], c2 = [];\n    for (var t = 0; t < 26; t++) { c1.push(0); c2.push(0); }\n    for (var i = 0; i < word1.length; i++) c1[word1.charCodeAt(i) - 97]++;\n    for (var j = 0; j < word2.length; j++) c2[word2.charCodeAt(j) - 97]++;\n    for (var c = 0; c < 26; c++) {\n        if ((c1[c] === 0) !== (c2[c] === 0)) return false;\n    }\n    var f1 = [], f2 = [];\n    for (var k = 0; k < 26; k++) {\n        if (c1[k] > 0) f1.push(c1[k]);\n        if (c2[k] > 0) f2.push(c2[k]);\n    }\n    f1.sort(function(a, b) { return a - b; });\n    f2.sort(function(a, b) { return a - b; });\n    if (f1.length !== f2.length) return false;\n    for (var m = 0; m < f1.length; m++) {\n        if (f1[m] !== f2[m]) return false;\n    }\n    return true;\n};`,
        typescript: `function closeStrings(word1: string, word2: string): boolean {\n    if (word1.length !== word2.length) return false;\n    var c1: number[] = [], c2: number[] = [];\n    for (var t = 0; t < 26; t++) { c1.push(0); c2.push(0); }\n    for (var i = 0; i < word1.length; i++) c1[word1.charCodeAt(i) - 97]++;\n    for (var j = 0; j < word2.length; j++) c2[word2.charCodeAt(j) - 97]++;\n    for (var c = 0; c < 26; c++) {\n        if ((c1[c] === 0) !== (c2[c] === 0)) return false;\n    }\n    var f1: number[] = [], f2: number[] = [];\n    for (var k = 0; k < 26; k++) {\n        if (c1[k] > 0) f1.push(c1[k]);\n        if (c2[k] > 0) f2.push(c2[k]);\n    }\n    f1.sort(function(a, b) { return a - b; });\n    f2.sort(function(a, b) { return a - b; });\n    if (f1.length !== f2.length) return false;\n    for (var m = 0; m < f1.length; m++) {\n        if (f1[m] !== f2[m]) return false;\n    }\n    return true;\n}`,
        java: `public static boolean closeStrings(String word1, String word2) {\n    if (word1.length() != word2.length()) return false;\n    int[] c1 = new int[26];\n    int[] c2 = new int[26];\n    for (int i = 0; i < word1.length(); i++) c1[word1.charAt(i) - 'a']++;\n    for (int i = 0; i < word2.length(); i++) c2[word2.charAt(i) - 'a']++;\n    for (int c = 0; c < 26; c++) {\n        if ((c1[c] == 0) != (c2[c] == 0)) return false;\n    }\n    int[] a = c1.clone();\n    int[] b = c2.clone();\n    Arrays.sort(a);\n    Arrays.sort(b);\n    return Arrays.equals(a, b);\n}`,
        cpp: `bool closeStrings(string word1, string word2) {\n    if (word1.size() != word2.size()) return false;\n    vector<int> c1(26, 0), c2(26, 0);\n    for (char c : word1) c1[c - 'a']++;\n    for (char c : word2) c2[c - 'a']++;\n    for (int c = 0; c < 26; c++) {\n        if ((c1[c] == 0) != (c2[c] == 0)) return false;\n    }\n    vector<int> a = c1, b = c2;\n    sort(a.begin(), a.end());\n    sort(b.begin(), b.end());\n    return a == b;\n}`,
        c: `static int cmpCloseAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nbool closeStrings(char* word1, char* word2) {\n    if (strlen(word1) != strlen(word2)) return false;\n    int c1[26], c2[26];\n    memset(c1, 0, sizeof(c1));\n    memset(c2, 0, sizeof(c2));\n    for (int i = 0; word1[i]; i++) c1[word1[i] - 'a']++;\n    for (int i = 0; word2[i]; i++) c2[word2[i] - 'a']++;\n    for (int c = 0; c < 26; c++) {\n        if ((c1[c] == 0) != (c2[c] == 0)) return false;\n    }\n    qsort(c1, 26, sizeof(int), cmpCloseAsc);\n    qsort(c2, 26, sizeof(int), cmpCloseAsc);\n    for (int c = 0; c < 26; c++) {\n        if (c1[c] != c2[c]) return false;\n    }\n    return true;\n}`,
        csharp: `public static bool CloseStrings(string word1, string word2)\n{\n    if (word1.Length != word2.Length) return false;\n    int[] c1 = new int[26];\n    int[] c2 = new int[26];\n    foreach (char c in word1) c1[c - 'a']++;\n    foreach (char c in word2) c2[c - 'a']++;\n    for (int c = 0; c < 26; c++)\n    {\n        if ((c1[c] == 0) != (c2[c] == 0)) return false;\n    }\n    int[] a = (int[]) c1.Clone();\n    int[] b = (int[]) c2.Clone();\n    Array.Sort(a);\n    Array.Sort(b);\n    for (int c = 0; c < 26; c++)\n    {\n        if (a[c] != b[c]) return false;\n    }\n    return true;\n}`,
        go: `func closeStrings(word1 string, word2 string) bool {\n\tif len(word1) != len(word2) {\n\t\treturn false\n\t}\n\tc1 := make([]int, 26)\n\tc2 := make([]int, 26)\n\tfor i := 0; i < len(word1); i++ {\n\t\tc1[word1[i]-\'a\']++\n\t}\n\tfor i := 0; i < len(word2); i++ {\n\t\tc2[word2[i]-\'a\']++\n\t}\n\tfor c := 0; c < 26; c++ {\n\t\tif (c1[c] == 0) != (c2[c] == 0) {\n\t\t\treturn false\n\t\t}\n\t}\n\ta := append([]int{}, c1...)\n\tb := append([]int{}, c2...)\n\tsort.Ints(a)\n\tsort.Ints(b)\n\tfor c := 0; c < 26; c++ {\n\t\tif a[c] != b[c] {\n\t\t\treturn false\n\t\t}\n\t}\n\treturn true\n}`,
        kotlin: `fun closeStrings(word1: String, word2: String): Boolean {\n    if (word1.length != word2.length) return false\n    val c1 = IntArray(26)\n    val c2 = IntArray(26)\n    for (c in word1) c1[c - \'a\']++\n    for (c in word2) c2[c - \'a\']++\n    for (c in 0 until 26) {\n        if ((c1[c] == 0) != (c2[c] == 0)) return false\n    }\n    val a = c1.sortedArray()\n    val b = c2.sortedArray()\n    for (c in 0 until 26) {\n        if (a[c] != b[c]) return false\n    }\n    return true\n}`,
        swift: `func closeStrings(_ word1: String, _ word2: String) -> Bool {\n    if word1.count != word2.count { return false }\n    var c1 = [Int](repeating: 0, count: 26)\n    var c2 = [Int](repeating: 0, count: 26)\n    for c in word1.utf8 { c1[Int(c) - 97] += 1 }\n    for c in word2.utf8 { c2[Int(c) - 97] += 1 }\n    for c in 0..<26 {\n        if (c1[c] == 0) != (c2[c] == 0) { return false }\n    }\n    return c1.sorted() == c2.sorted()\n}`,
        rust: `fn closeStrings(word1: String, word2: String) -> bool {\n    if word1.len() != word2.len() {\n        return false;\n    }\n    let mut c1 = [0i32; 26];\n    let mut c2 = [0i32; 26];\n    for &c in word1.as_bytes() {\n        c1[(c - b\'a\') as usize] += 1;\n    }\n    for &c in word2.as_bytes() {\n        c2[(c - b\'a\') as usize] += 1;\n    }\n    for c in 0..26 {\n        if (c1[c] == 0) != (c2[c] == 0) {\n            return false;\n        }\n    }\n    let mut a = c1.to_vec();\n    let mut b = c2.to_vec();\n    a.sort();\n    b.sort();\n    a == b\n}`,
        php: `function closeStrings($word1, $word2) {\n    if (strlen($word1) !== strlen($word2)) return false;\n    $c1 = array_fill(0, 26, 0);\n    $c2 = array_fill(0, 26, 0);\n    for ($i = 0; $i < strlen($word1); $i++) $c1[ord($word1[$i]) - 97]++;\n    for ($i = 0; $i < strlen($word2); $i++) $c2[ord($word2[$i]) - 97]++;\n    for ($c = 0; $c < 26; $c++) {\n        if (($c1[$c] === 0) !== ($c2[$c] === 0)) return false;\n    }\n    $a = $c1;\n    $b = $c2;\n    sort($a);\n    sort($b);\n    return $a === $b;\n}`,
        ruby: `def closeStrings(word1, word2)\n  return false if word1.length != word2.length\n  c1 = Array.new(26, 0)\n  c2 = Array.new(26, 0)\n  word1.each_byte { |b| c1[b - 97] += 1 }\n  word2.each_byte { |b| c2[b - 97] += 1 }\n  (0...26).each do |c|\n    return false if (c1[c] == 0) != (c2[c] == 0)\n  end\n  c1.sort == c2.sort\nend`,
      },
    };
  })(),

  // ── Count Number of Bad Pairs (LC 2364) ─────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const seen: Record<string, number> = {};
      let good = 0;
      const n = nums.length;
      for (let i = 0; i < n; i++) {
        const key = String(nums[i] - i);
        if (seen[key] !== undefined) good += seen[key];
        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;
      }
      return (n * (n - 1)) / 2 - good;
    };
    return {
      slug: "count-number-of-bad-pairs",
      title: "Count Number of Bad Pairs",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Array", "Counting", "Amazon", "Google", "Swiggy"],
      signature: { funcName: "countBadPairs", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A pair of indices `(i, j)` with `i < j` is **bad** when `j - i != nums[j] - nums[i]`.\n\nReturn the number of bad pairs.",
        [
          { in: "nums = [4,1,3,3]", out: "5", note: "Of the six pairs only (1,3) is good, since 3 - 1 equals nums[3] - nums[1]." },
          { in: "nums = [1,2,3,4,5]", out: "0", note: "Every pair satisfies the equality, so none is bad." },
          { in: "nums = [7,7]", out: "1" },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= 1000000000"]),
      hints: [
        "Counting bad pairs directly is awkward; count the **good** ones and subtract from the total.",
        "Rearrange `j - i == nums[j] - nums[i]` to `nums[i] - i == nums[j] - j`.",
        "So good pairs are pairs with equal `nums[k] - k`, which one tally pass counts.",
      ],
      editorial: explain({
        idea: "Complementary counting. The good condition rearranges into an equality between two independent per-index quantities, so a single tally counts the good pairs and the rest are bad.",
        steps: [
          "The total number of pairs is `n * (n - 1) / 2`.",
          "Sweep the array keeping a tally of the key `nums[k] - k`; before inserting, add the current tally to the good count.",
          "Return `total - good`.",
        ],
        why: "`j - i == nums[j] - nums[i]` is equivalent to `nums[i] - i == nums[j] - j`, so the good pairs are exactly the equal-key pairs. Counting before inserting attributes each pair to its later index once.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "`nums[k] - k` can be negative, so a plain array index will not do — use a hash map.",
          "`n * (n - 1) / 2` overflows 32 bits once `n` passes about 65000; at the stated limit it is safe, but the habit matters.",
        ],
      }),
      examples: [
        { input: "[4,1,3,3]", expectedOutput: "5" },
        { input: "[1,2,3,4,5]", expectedOutput: "0" },
        { input: "[7,7]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 50);
        let nums: number[];
        if (rng() < 0.3) {
          const start = ri(rng, 1, 100);
          nums = Array.from({ length: n }, (_, i) => start + i);
        } else {
          const hi = rng() < 0.5 ? 6 : 1000000000;
          nums = Array.from({ length: n }, () => ri(rng, 1, hi));
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countBadPairs(nums: List[int]) -> int:\n    seen = {}\n    good = 0\n    for i, x in enumerate(nums):\n        key = x - i\n        good += seen.get(key, 0)\n        seen[key] = seen.get(key, 0) + 1\n    n = len(nums)\n    return n * (n - 1) // 2 - good`,
        javascript: `var countBadPairs = function(nums) {\n    var seen = {}, good = 0;\n    var n = nums.length;\n    for (var i = 0; i < n; i++) {\n        var key = String(nums[i] - i);\n        if (seen[key] !== undefined) good += seen[key];\n        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;\n    }\n    return (n * (n - 1)) / 2 - good;\n};`,
        typescript: `function countBadPairs(nums: number[]): number {\n    var seen: { [key: string]: number } = {}, good = 0;\n    var n = nums.length;\n    for (var i = 0; i < n; i++) {\n        var key = String(nums[i] - i);\n        if (seen[key] !== undefined) good += seen[key];\n        seen[key] = (seen[key] === undefined ? 0 : seen[key]) + 1;\n    }\n    return (n * (n - 1)) / 2 - good;\n}`,
        java: `public static int countBadPairs(int[] nums) {\n    Map<Integer, Integer> seen = new HashMap<>();\n    long good = 0;\n    int n = nums.length;\n    for (int i = 0; i < n; i++) {\n        int key = nums[i] - i;\n        int c = seen.getOrDefault(key, 0);\n        good += c;\n        seen.put(key, c + 1);\n    }\n    return (int) ((long) n * (n - 1) / 2 - good);\n}`,
        cpp: `int countBadPairs(vector<int>& nums) {\n    unordered_map<int, int> seen;\n    long long good = 0;\n    long long n = (long long) nums.size();\n    for (int i = 0; i < (int) nums.size(); i++) {\n        int key = nums[i] - i;\n        good += seen[key];\n        seen[key]++;\n    }\n    return (int) (n * (n - 1) / 2 - good);\n}`,
        c: `typedef struct { int key; int count; int used; } SlotB;\n\nint countBadPairs(int* nums, int numsSize) {\n    int cap = 1;\n    while (cap < 2 * numsSize + 8) cap <<= 1;\n    int mask = cap - 1;\n    SlotB* tbl = (SlotB*) calloc((size_t) cap, sizeof(SlotB));\n    long long good = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int key = nums[i] - i;\n        unsigned int h = (unsigned int) key * 2654435761u;\n        int s = (int) (h & (unsigned int) mask);\n        while (tbl[s].used && tbl[s].key != key) s = (s + 1) & mask;\n        if (tbl[s].used) good += tbl[s].count;\n        else { tbl[s].used = 1; tbl[s].key = key; tbl[s].count = 0; }\n        tbl[s].count++;\n    }\n    free(tbl);\n    long long n = numsSize;\n    return (int) (n * (n - 1) / 2 - good);\n}`,
        csharp: `public static int CountBadPairs(int[] nums)\n{\n    var seen = new Dictionary<int, int>();\n    long good = 0;\n    long n = nums.Length;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        int key = nums[i] - i;\n        int c;\n        c = seen.TryGetValue(key, out c) ? c : 0;\n        good += c;\n        seen[key] = c + 1;\n    }\n    return (int) (n * (n - 1) / 2 - good);\n}`,
        go: `func countBadPairs(nums []int) int {\n\tseen := map[int]int{}\n\tgood := 0\n\tn := len(nums)\n\tfor i := 0; i < n; i++ {\n\t\tkey := nums[i] - i\n\t\tgood += seen[key]\n\t\tseen[key]++\n\t}\n\treturn n*(n-1)/2 - good\n}`,
        kotlin: `fun countBadPairs(nums: IntArray): Int {\n    val seen = HashMap<Int, Int>()\n    var good = 0L\n    val n = nums.size.toLong()\n    for (i in nums.indices) {\n        val key = nums[i] - i\n        val c = seen[key] ?: 0\n        good += c\n        seen[key] = c + 1\n    }\n    return (n * (n - 1) / 2 - good).toInt()\n}`,
        swift: `func countBadPairs(_ nums: [Int]) -> Int {\n    var seen: [Int: Int] = [:]\n    var good = 0\n    let n = nums.count\n    for i in 0..<n {\n        let key = nums[i] - i\n        let c = seen[key] ?? 0\n        good += c\n        seen[key] = c + 1\n    }\n    return n * (n - 1) / 2 - good\n}`,
        rust: `fn countBadPairs(nums: Vec<i32>) -> i32 {\n    let mut seen: std::collections::HashMap<i64, i64> = std::collections::HashMap::new();\n    let mut good: i64 = 0;\n    let n = nums.len() as i64;\n    for i in 0..nums.len() {\n        let key = nums[i] as i64 - i as i64;\n        let c = *seen.get(&key).unwrap_or(&0);\n        good += c;\n        seen.insert(key, c + 1);\n    }\n    (n * (n - 1) / 2 - good) as i32\n}`,
        php: `function countBadPairs($nums) {\n    $seen = array();\n    $good = 0;\n    $n = count($nums);\n    for ($i = 0; $i < $n; $i++) {\n        $key = $nums[$i] - $i;\n        if (isset($seen[$key])) $good += $seen[$key];\n        $seen[$key] = isset($seen[$key]) ? $seen[$key] + 1 : 1;\n    }\n    return intdiv($n * ($n - 1), 2) - $good;\n}`,
        ruby: `def countBadPairs(nums)\n  seen = Hash.new(0)\n  good = 0\n  n = nums.length\n  nums.each_with_index do |x, i|\n    key = x - i\n    good += seen[key]\n    seen[key] += 1\n  end\n  n * (n - 1) / 2 - good\nend`,
      },
    };
  })(),

  // ── Optimal Partition of String (LC 2405) ───────────────────────
  (() => {
    const ref = (s: string) => {
      let seen = 0, parts = 1;
      for (let i = 0; i < s.length; i++) {
        const bit = 1 << (s.charCodeAt(i) - 97);
        if ((seen & bit) !== 0) { parts++; seen = 0; }
        seen |= bit;
      }
      return s.length === 0 ? 0 : parts;
    };
    return {
      slug: "optimal-partition-of-string",
      title: "Optimal Partition of String",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Greedy", "Amazon", "Google", "Zomato"],
      signature: { funcName: "partitionString", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Partition `s` into the fewest possible contiguous substrings such that no substring contains a repeated character.\n\nReturn the number of substrings in the partition.",
        [
          { in: 's = "abacaba"', out: "4", note: 'One optimal partition is "ab", "ac", "ab", "a".' },
          { in: 's = "ssssss"', out: "6", note: "Every character must start its own substring." },
          { in: 's = "codekairo"', out: "2", note: '"codekair" then "o".' },
        ],
        ["1 <= s.length <= 100000", "s consists of lowercase English letters."]),
      hints: [
        "Extend the current piece as far as possible; cut only when forced.",
        "You are forced exactly when the next character already appears in the current piece.",
        "A 26-bit mask tracks the current piece's characters in O(1) per step.",
      ],
      editorial: explain({
        idea: "Greedy is optimal here: never cut early. Keep extending the current substring and start a new one only at the first character that would repeat.",
        steps: [
          "Keep a 26-bit mask of the characters in the current piece and a counter starting at 1.",
          "For each character, if its bit is already set, close the piece — increment the counter and reset the mask to empty.",
          "Set the character's bit and continue.",
        ],
        why: "Exchange argument: take any optimal partition and compare it with the greedy one left to right. The greedy piece always reaches at least as far as the optimal piece starting at the same index, because it only stops when *any* valid piece would have to stop. So greedy uses no more pieces than optimal.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Resetting the mask to the current character's bit rather than to empty and then setting it is the same thing — but resetting to empty and *forgetting* to set it drops that character from the new piece.",
          "Starting the counter at 0 undercounts by one for any non-empty string.",
        ],
      }),
      examples: [
        { input: '"abacaba"', expectedOutput: "4" },
        { input: '"ssssss"', expectedOutput: "6" },
        { input: '"codekairo"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.5 ? "abc" : "abcdefgh";
        const s = randLower(rng, 1, 50, alphabet);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def partitionString(s: str) -> int:\n    seen = 0\n    parts = 1\n    for ch in s:\n        bit = 1 << (ord(ch) - 97)\n        if seen & bit:\n            parts += 1\n            seen = 0\n        seen |= bit\n    return parts`,
        javascript: `var partitionString = function(s) {\n    var seen = 0, parts = 1;\n    for (var i = 0; i < s.length; i++) {\n        var bit = 1 << (s.charCodeAt(i) - 97);\n        if ((seen & bit) !== 0) { parts++; seen = 0; }\n        seen |= bit;\n    }\n    return parts;\n};`,
        typescript: `function partitionString(s: string): number {\n    var seen = 0, parts = 1;\n    for (var i = 0; i < s.length; i++) {\n        var bit = 1 << (s.charCodeAt(i) - 97);\n        if ((seen & bit) !== 0) { parts++; seen = 0; }\n        seen |= bit;\n    }\n    return parts;\n}`,
        java: `public static int partitionString(String s) {\n    int seen = 0, parts = 1;\n    for (int i = 0; i < s.length(); i++) {\n        int bit = 1 << (s.charAt(i) - 'a');\n        if ((seen & bit) != 0) { parts++; seen = 0; }\n        seen |= bit;\n    }\n    return parts;\n}`,
        cpp: `int partitionString(string s) {\n    int seen = 0, parts = 1;\n    for (char c : s) {\n        int bit = 1 << (c - 'a');\n        if (seen & bit) { parts++; seen = 0; }\n        seen |= bit;\n    }\n    return parts;\n}`,
        c: `int partitionString(char* s) {\n    int seen = 0, parts = 1;\n    for (int i = 0; s[i]; i++) {\n        int bit = 1 << (s[i] - 'a');\n        if (seen & bit) { parts++; seen = 0; }\n        seen |= bit;\n    }\n    return parts;\n}`,
        csharp: `public static int PartitionString(string s)\n{\n    int seen = 0, parts = 1;\n    foreach (char c in s)\n    {\n        int bit = 1 << (c - 'a');\n        if ((seen & bit) != 0) { parts++; seen = 0; }\n        seen |= bit;\n    }\n    return parts;\n}`,
        go: `func partitionString(s string) int {\n\tseen, parts := 0, 1\n\tfor i := 0; i < len(s); i++ {\n\t\tbit := 1 << uint(s[i]-\'a\')\n\t\tif seen&bit != 0 {\n\t\t\tparts++\n\t\t\tseen = 0\n\t\t}\n\t\tseen |= bit\n\t}\n\treturn parts\n}`,
        kotlin: `fun partitionString(s: String): Int {\n    var seen = 0\n    var parts = 1\n    for (c in s) {\n        val bit = 1 shl (c - \'a\')\n        if (seen and bit != 0) {\n            parts++\n            seen = 0\n        }\n        seen = seen or bit\n    }\n    return parts\n}`,
        swift: `func partitionString(_ s: String) -> Int {\n    var seen = 0\n    var parts = 1\n    for c in s.utf8 {\n        let bit = 1 << (Int(c) - 97)\n        if seen & bit != 0 {\n            parts += 1\n            seen = 0\n        }\n        seen |= bit\n    }\n    return parts\n}`,
        rust: `fn partitionString(s: String) -> i32 {\n    let mut seen = 0i32;\n    let mut parts = 1i32;\n    for &c in s.as_bytes() {\n        let bit = 1i32 << (c - b\'a\');\n        if seen & bit != 0 {\n            parts += 1;\n            seen = 0;\n        }\n        seen |= bit;\n    }\n    parts\n}`,
        php: `function partitionString($s) {\n    $seen = 0;\n    $parts = 1;\n    for ($i = 0; $i < strlen($s); $i++) {\n        $bit = 1 << (ord($s[$i]) - 97);\n        if ($seen & $bit) { $parts++; $seen = 0; }\n        $seen |= $bit;\n    }\n    return $parts;\n}`,
        ruby: `def partitionString(s)\n  seen = 0\n  parts = 1\n  s.each_byte do |b|\n    bit = 1 << (b - 97)\n    if seen & bit != 0\n      parts += 1\n      seen = 0\n    end\n    seen |= bit\n  end\n  parts\nend`,
      },
    };
  })(),

  // ── Group the People Given the Group Size They Belong To (LC 1282) ──
  (() => {
    const ref = (groupSizes: number[]) => {
      const pending: Record<string, number[]> = {};
      const out: number[][] = [];
      for (let i = 0; i < groupSizes.length; i++) {
        const size = groupSizes[i];
        const key = String(size);
        if (pending[key] === undefined) pending[key] = [];
        pending[key].push(i);
        if (pending[key].length === size) {
          out.push(pending[key]);
          pending[key] = [];
        }
      }
      return out;
    };
    return {
      slug: "group-the-people-given-the-group-size-they-belong-to",
      title: "Group the People Given the Group Size They Belong To",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Array", "Greedy", "Amazon", "Google", "Adobe"],
      signature: { funcName: "groupThePeople", params: [{ name: "groupSizes", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "There are `n` people numbered `0` to `n - 1`, and `groupSizes[i]` is the size of the group person `i` must belong to.\n\nReturn a valid grouping. To make the answer unique, build it this way: walk the people in increasing order, adding each to the open group for their size; the moment a group reaches its size, it is **closed and appended** to the answer.",
        [
          { in: "groupSizes = [3,3,3,3,3,1,3]", out: "[[0,1,2],[5],[3,4,6]]", note: "People 0-2 close the first group of three; person 5 forms a group alone; 3, 4 and 6 close the last group." },
          { in: "groupSizes = [2,1,3,3,3,2]", out: "[[1],[2,3,4],[0,5]]", note: "Person 1 closes first because their group needs only one member." },
          { in: "groupSizes = [1,1]", out: "[[0],[1]]" },
        ],
        ["groupSizes.length == n", "1 <= n <= 500", "1 <= groupSizes[i] <= n", "The input always admits a valid grouping."]),
      hints: [
        "Bucket the people by the group size they require.",
        "Each bucket fills up and empties repeatedly — flush it every time it reaches the required size.",
        "Appending at the moment of closure is what makes the answer order deterministic.",
      ],
      editorial: explain({
        idea: "People who need the same group size are interchangeable, so bucket by size and emit a group whenever a bucket is full. Nothing has to be planned ahead.",
        steps: [
          "Keep a map from required size to the list of people waiting at that size.",
          "Walk the people in index order, appending each to their bucket.",
          "When a bucket's length equals its size, append it to the answer and clear it.",
        ],
        why: "The input guarantees each size's population is a multiple of that size, so every bucket empties exactly. Emitting greedily is valid because any full bucket is already a legal group, and the indices left behind can still be grouped among themselves.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Reusing the same list object after flushing mutates a group already placed in the answer — clear by assigning a fresh list.",
          "Collecting all buckets first and slicing at the end gives a different (also valid) order, which this statement's determinism rule rules out.",
        ],
      }),
      examples: [
        { input: "[3,3,3,3,3,1,3]", expectedOutput: "[[0,1,2],[5],[3,4,6]]" },
        { input: "[2,1,3,3,3,2]", expectedOutput: "[[1],[2,3,4],[0,5]]" },
        { input: "[1,1]", expectedOutput: "[[0],[1]]" },
      ],
      gen: (rng: Rng) => {
        const sizes: number[] = [];
        const blocks = ri(rng, 1, 8);
        for (let b = 0; b < blocks; b++) {
          const size = ri(rng, 1, 4);
          for (let t = 0; t < size; t++) sizes.push(size);
        }
        const groupSizes = shuffle(rng, sizes);
        return { input: fmtIntArr(groupSizes), expectedOutput: fmtIntMat(ref(groupSizes)) };
      },
      solutions: {
        python: `from typing import List\n\ndef groupThePeople(groupSizes: List[int]) -> List[List[int]]:\n    pending = {}\n    out = []\n    for i, size in enumerate(groupSizes):\n        pending.setdefault(size, []).append(i)\n        if len(pending[size]) == size:\n            out.append(pending[size])\n            pending[size] = []\n    return out`,
        javascript: `var groupThePeople = function(groupSizes) {\n    var pending = {}, out = [];\n    for (var i = 0; i < groupSizes.length; i++) {\n        var size = groupSizes[i];\n        var key = String(size);\n        if (pending[key] === undefined) pending[key] = [];\n        pending[key].push(i);\n        if (pending[key].length === size) {\n            out.push(pending[key]);\n            pending[key] = [];\n        }\n    }\n    return out;\n};`,
        typescript: `function groupThePeople(groupSizes: number[]): number[][] {\n    var pending: { [key: string]: number[] } = {}, out: number[][] = [];\n    for (var i = 0; i < groupSizes.length; i++) {\n        var size = groupSizes[i];\n        var key = String(size);\n        if (pending[key] === undefined) pending[key] = [];\n        pending[key].push(i);\n        if (pending[key].length === size) {\n            out.push(pending[key]);\n            pending[key] = [];\n        }\n    }\n    return out;\n}`,
        java: `public static int[][] groupThePeople(int[] groupSizes) {\n    Map<Integer, List<Integer>> pending = new HashMap<>();\n    List<int[]> out = new ArrayList<>();\n    for (int i = 0; i < groupSizes.length; i++) {\n        int size = groupSizes[i];\n        List<Integer> bucket = pending.computeIfAbsent(size, z -> new ArrayList<>());\n        bucket.add(i);\n        if (bucket.size() == size) {\n            int[] group = new int[size];\n            for (int t = 0; t < size; t++) group[t] = bucket.get(t);\n            out.add(group);\n            pending.put(size, new ArrayList<>());\n        }\n    }\n    return out.toArray(new int[0][]);\n}`,
        cpp: `vector<vector<int>> groupThePeople(vector<int>& groupSizes) {\n    unordered_map<int, vector<int>> pending;\n    vector<vector<int>> out;\n    for (int i = 0; i < (int) groupSizes.size(); i++) {\n        int size = groupSizes[i];\n        pending[size].push_back(i);\n        if ((int) pending[size].size() == size) {\n            out.push_back(pending[size]);\n            pending[size].clear();\n        }\n    }\n    return out;\n}`,
        c: `int** groupThePeople(int* groupSizes, int groupSizesSize, int* returnSize, int** returnColumnSizes) {\n    int n = groupSizesSize;\n    int** pending = (int**) malloc((size_t) (n + 1) * sizeof(int*));\n    int* fill = (int*) calloc((size_t) n + 1, sizeof(int));\n    for (int s = 0; s <= n; s++) pending[s] = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    int** out = (int**) malloc((size_t) n * sizeof(int*));\n    int* cols = (int*) malloc((size_t) n * sizeof(int));\n    int m = 0;\n    for (int i = 0; i < n; i++) {\n        int size = groupSizes[i];\n        pending[size][fill[size]++] = i;\n        if (fill[size] == size) {\n            int* group = (int*) malloc((size_t) size * sizeof(int));\n            for (int t = 0; t < size; t++) group[t] = pending[size][t];\n            out[m] = group;\n            cols[m] = size;\n            m++;\n            fill[size] = 0;\n        }\n    }\n    for (int s = 0; s <= n; s++) free(pending[s]);\n    free(pending);\n    free(fill);\n    *returnSize = m;\n    *returnColumnSizes = cols;\n    return out;\n}`,
        csharp: `public static int[][] GroupThePeople(int[] groupSizes)\n{\n    var pending = new Dictionary<int, List<int>>();\n    var out_ = new List<int[]>();\n    for (int i = 0; i < groupSizes.Length; i++)\n    {\n        int size = groupSizes[i];\n        if (!pending.ContainsKey(size)) pending[size] = new List<int>();\n        pending[size].Add(i);\n        if (pending[size].Count == size)\n        {\n            out_.Add(pending[size].ToArray());\n            pending[size] = new List<int>();\n        }\n    }\n    return out_.ToArray();\n}`,
        go: `func groupThePeople(groupSizes []int) [][]int {\n\tpending := map[int][]int{}\n\tout := [][]int{}\n\tfor i, size := range groupSizes {\n\t\tpending[size] = append(pending[size], i)\n\t\tif len(pending[size]) == size {\n\t\t\tgroup := make([]int, size)\n\t\t\tcopy(group, pending[size])\n\t\t\tout = append(out, group)\n\t\t\tpending[size] = nil\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun groupThePeople(groupSizes: IntArray): Array<IntArray> {\n    val pending = HashMap<Int, MutableList<Int>>()\n    val out = ArrayList<IntArray>()\n    for (i in groupSizes.indices) {\n        val size = groupSizes[i]\n        val bucket = pending.getOrPut(size) { ArrayList() }\n        bucket.add(i)\n        if (bucket.size == size) {\n            out.add(bucket.toIntArray())\n            pending[size] = ArrayList()\n        }\n    }\n    return out.toTypedArray()\n}`,
        swift: `func groupThePeople(_ groupSizes: [Int]) -> [[Int]] {\n    var pending: [Int: [Int]] = [:]\n    var out: [[Int]] = []\n    for i in 0..<groupSizes.count {\n        let size = groupSizes[i]\n        pending[size, default: []].append(i)\n        if pending[size]!.count == size {\n            out.append(pending[size]!)\n            pending[size] = []\n        }\n    }\n    return out\n}`,
        rust: `fn groupThePeople(groupSizes: Vec<i32>) -> Vec<Vec<i32>> {\n    let mut pending: std::collections::HashMap<i32, Vec<i32>> = std::collections::HashMap::new();\n    let mut out: Vec<Vec<i32>> = Vec::new();\n    for i in 0..groupSizes.len() {\n        let size = groupSizes[i];\n        let bucket = pending.entry(size).or_insert_with(Vec::new);\n        bucket.push(i as i32);\n        if bucket.len() as i32 == size {\n            out.push(bucket.clone());\n            bucket.clear();\n        }\n    }\n    out\n}`,
        php: `function groupThePeople($groupSizes) {\n    $pending = array();\n    $out = array();\n    for ($i = 0; $i < count($groupSizes); $i++) {\n        $size = $groupSizes[$i];\n        if (!isset($pending[$size])) $pending[$size] = array();\n        $pending[$size][] = $i;\n        if (count($pending[$size]) === $size) {\n            $out[] = $pending[$size];\n            $pending[$size] = array();\n        }\n    }\n    return $out;\n}`,
        ruby: `def groupThePeople(groupSizes)\n  pending = Hash.new { |h, k| h[k] = [] }\n  out = []\n  groupSizes.each_with_index do |size, i|\n    pending[size] << i\n    if pending[size].length == size\n      out << pending[size]\n      pending[size] = []\n    end\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Number of Boomerangs (LC 447) ───────────────────────────────
  (() => {
    const ref = (points: number[][]) => {
      let total = 0;
      for (let i = 0; i < points.length; i++) {
        const dist: Record<string, number> = {};
        for (let j = 0; j < points.length; j++) {
          if (i === j) continue;
          const dx = points[i][0] - points[j][0];
          const dy = points[i][1] - points[j][1];
          const key = String(dx * dx + dy * dy);
          const c = dist[key] === undefined ? 0 : dist[key];
          total += 2 * c;
          dist[key] = c + 1;
        }
      }
      return total;
    };
    return {
      slug: "number-of-boomerangs",
      title: "Number of Boomerangs",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Math", "Array", "Google", "Amazon", "Meta"],
      signature: { funcName: "numberOfBoomerangs", params: [{ name: "points", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A **boomerang** is an ordered triple of distinct points `(i, j, k)` such that the distance from `i` to `j` equals the distance from `i` to `k`. The order of `j` and `k` matters, so each unordered pair contributes two boomerangs.\n\nReturn the number of boomerangs.",
        [
          { in: "points = [[0,0],[1,0],[2,0]]", out: "2", note: "Only the middle point has two others at equal distance, giving the two orderings." },
          { in: "points = [[1,1],[2,2],[3,3]]", out: "2" },
          { in: "points = [[1,1]]", out: "0" },
        ],
        ["1 <= points.length <= 500", "points[i].length == 2", "-10000 <= x, y <= 10000", "All points are distinct."]),
      hints: [
        "Fix the apex `i`. Then you need pairs of other points equidistant from it.",
        "Group the other points by their **squared** distance to `i` — square roots are both slower and lossy.",
        "A group of size `m` contributes `m * (m - 1)` ordered pairs.",
      ],
      editorial: explain({
        idea: "The apex is the only point that matters for the constraint, so fix it and tally squared distances. A bucket of size `m` yields `m * (m - 1)` ordered pairs, which is exactly the number of boomerangs with that apex and that radius.",
        steps: [
          "For each point `i`, build a map from squared distance to how many other points sit at it.",
          "As you insert each distance, add twice the bucket's current size to the answer — that accounts for both orderings with every earlier point at the same distance.",
          "Repeat for every apex.",
        ],
        why: "Adding `2 * c` on insertion telescopes to `m * (m - 1)` over a bucket that ends at size `m`, which is the count of ordered pairs drawn from it. Summing over apexes counts each boomerang once, since the apex is determined by the triple.",
        time: "O(n²)",
        space: "O(n)",
        pitfalls: [
          "Using floating-point distances makes equal distances compare unequal; squared integer distances are exact.",
          "Forgetting to skip `j == i` puts a zero distance in the tally and invents boomerangs.",
          "Counting `m * (m - 1) / 2` gives unordered pairs, which is half the intended answer.",
        ],
      }),
      examples: [
        { input: "[[0,0],[1,0],[2,0]]", expectedOutput: "2" },
        { input: "[[1,1],[2,2],[3,3]]", expectedOutput: "2" },
        { input: "[[1,1]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 18);
        const seen: Record<string, boolean> = {};
        const points: number[][] = [];
        const span = rng() < 0.5 ? 4 : 40;
        while (points.length < n) {
          const x = ri(rng, -span, span);
          const y = ri(rng, -span, span);
          const key = x + ":" + y;
          if (seen[key] === true) continue;
          seen[key] = true;
          points.push([x, y]);
        }
        return { input: fmtIntMat(points), expectedOutput: String(ref(points)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numberOfBoomerangs(points: List[List[int]]) -> int:\n    total = 0\n    for xi, yi in points:\n        dist = {}\n        for xj, yj in points:\n            d = (xi - xj) ** 2 + (yi - yj) ** 2\n            if d == 0 and (xi, yi) == (xj, yj):\n                continue\n            c = dist.get(d, 0)\n            total += 2 * c\n            dist[d] = c + 1\n    return total`,
        javascript: `var numberOfBoomerangs = function(points) {\n    var total = 0;\n    for (var i = 0; i < points.length; i++) {\n        var dist = {};\n        for (var j = 0; j < points.length; j++) {\n            if (i === j) continue;\n            var dx = points[i][0] - points[j][0];\n            var dy = points[i][1] - points[j][1];\n            var key = String(dx * dx + dy * dy);\n            var c = dist[key] === undefined ? 0 : dist[key];\n            total += 2 * c;\n            dist[key] = c + 1;\n        }\n    }\n    return total;\n};`,
        typescript: `function numberOfBoomerangs(points: number[][]): number {\n    var total = 0;\n    for (var i = 0; i < points.length; i++) {\n        var dist: { [key: string]: number } = {};\n        for (var j = 0; j < points.length; j++) {\n            if (i === j) continue;\n            var dx = points[i][0] - points[j][0];\n            var dy = points[i][1] - points[j][1];\n            var key = String(dx * dx + dy * dy);\n            var c = dist[key] === undefined ? 0 : dist[key];\n            total += 2 * c;\n            dist[key] = c + 1;\n        }\n    }\n    return total;\n}`,
        java: `public static int numberOfBoomerangs(int[][] points) {\n    int total = 0;\n    for (int i = 0; i < points.length; i++) {\n        Map<Long, Integer> dist = new HashMap<>();\n        for (int j = 0; j < points.length; j++) {\n            if (i == j) continue;\n            long dx = points[i][0] - points[j][0];\n            long dy = points[i][1] - points[j][1];\n            long d = dx * dx + dy * dy;\n            int c = dist.getOrDefault(d, 0);\n            total += 2 * c;\n            dist.put(d, c + 1);\n        }\n    }\n    return total;\n}`,
        cpp: `int numberOfBoomerangs(vector<vector<int>>& points) {\n    int total = 0;\n    for (size_t i = 0; i < points.size(); i++) {\n        unordered_map<long long, int> dist;\n        for (size_t j = 0; j < points.size(); j++) {\n            if (i == j) continue;\n            long long dx = points[i][0] - points[j][0];\n            long long dy = points[i][1] - points[j][1];\n            long long d = dx * dx + dy * dy;\n            int c = dist[d];\n            total += 2 * c;\n            dist[d] = c + 1;\n        }\n    }\n    return total;\n}`,
        c: `int numberOfBoomerangs(int** points, int pointsSize, int* pointsColSize) {\n    int total = 0;\n    long long* d = (long long*) malloc((size_t) pointsSize * sizeof(long long));\n    for (int i = 0; i < pointsSize; i++) {\n        int m = 0;\n        for (int j = 0; j < pointsSize; j++) {\n            if (i == j) continue;\n            long long dx = points[i][0] - points[j][0];\n            long long dy = points[i][1] - points[j][1];\n            d[m++] = dx * dx + dy * dy;\n        }\n        for (int a = 0; a < m; a++) {\n            for (int b = 0; b < a; b++) {\n                if (d[a] == d[b]) total += 2;\n            }\n        }\n    }\n    free(d);\n    return total;\n}`,
        csharp: `public static int NumberOfBoomerangs(int[][] points)\n{\n    int total = 0;\n    for (int i = 0; i < points.Length; i++)\n    {\n        var dist = new Dictionary<long, int>();\n        for (int j = 0; j < points.Length; j++)\n        {\n            if (i == j) continue;\n            long dx = points[i][0] - points[j][0];\n            long dy = points[i][1] - points[j][1];\n            long d = dx * dx + dy * dy;\n            int c;\n            c = dist.TryGetValue(d, out c) ? c : 0;\n            total += 2 * c;\n            dist[d] = c + 1;\n        }\n    }\n    return total;\n}`,
        go: `func numberOfBoomerangs(points [][]int) int {\n\ttotal := 0\n\tfor i := 0; i < len(points); i++ {\n\t\tdist := map[int]int{}\n\t\tfor j := 0; j < len(points); j++ {\n\t\t\tif i == j {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tdx := points[i][0] - points[j][0]\n\t\t\tdy := points[i][1] - points[j][1]\n\t\t\td := dx*dx + dy*dy\n\t\t\ttotal += 2 * dist[d]\n\t\t\tdist[d]++\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun numberOfBoomerangs(points: Array<IntArray>): Int {\n    var total = 0\n    for (i in points.indices) {\n        val dist = HashMap<Long, Int>()\n        for (j in points.indices) {\n            if (i == j) continue\n            val dx = (points[i][0] - points[j][0]).toLong()\n            val dy = (points[i][1] - points[j][1]).toLong()\n            val d = dx * dx + dy * dy\n            val c = dist[d] ?: 0\n            total += 2 * c\n            dist[d] = c + 1\n        }\n    }\n    return total\n}`,
        swift: `func numberOfBoomerangs(_ points: [[Int]]) -> Int {\n    var total = 0\n    for i in 0..<points.count {\n        var dist: [Int: Int] = [:]\n        for j in 0..<points.count {\n            if i == j { continue }\n            let dx = points[i][0] - points[j][0]\n            let dy = points[i][1] - points[j][1]\n            let d = dx * dx + dy * dy\n            let c = dist[d] ?? 0\n            total += 2 * c\n            dist[d] = c + 1\n        }\n    }\n    return total\n}`,
        rust: `fn numberOfBoomerangs(points: Vec<Vec<i32>>) -> i32 {\n    let mut total = 0i32;\n    for i in 0..points.len() {\n        let mut dist: std::collections::HashMap<i64, i32> = std::collections::HashMap::new();\n        for j in 0..points.len() {\n            if i == j {\n                continue;\n            }\n            let dx = (points[i][0] - points[j][0]) as i64;\n            let dy = (points[i][1] - points[j][1]) as i64;\n            let d = dx * dx + dy * dy;\n            let c = *dist.get(&d).unwrap_or(&0);\n            total += 2 * c;\n            dist.insert(d, c + 1);\n        }\n    }\n    total\n}`,
        php: `function numberOfBoomerangs($points) {\n    $total = 0;\n    $n = count($points);\n    for ($i = 0; $i < $n; $i++) {\n        $dist = array();\n        for ($j = 0; $j < $n; $j++) {\n            if ($i === $j) continue;\n            $dx = $points[$i][0] - $points[$j][0];\n            $dy = $points[$i][1] - $points[$j][1];\n            $d = $dx * $dx + $dy * $dy;\n            $c = isset($dist[$d]) ? $dist[$d] : 0;\n            $total += 2 * $c;\n            $dist[$d] = $c + 1;\n        }\n    }\n    return $total;\n}`,
        ruby: `def numberOfBoomerangs(points)\n  total = 0\n  points.each_with_index do |pi, i|\n    dist = Hash.new(0)\n    points.each_with_index do |pj, j|\n      next if i == j\n      dx = pi[0] - pj[0]\n      dy = pi[1] - pj[1]\n      d = dx * dx + dy * dy\n      total += 2 * dist[d]\n      dist[d] += 1\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Minimum Area Rectangle (LC 939) ─────────────────────────────
  (() => {
    const ref = (points: number[][]) => {
      const have: Record<string, boolean> = {};
      for (const p of points) have[p[0] + ":" + p[1]] = true;
      let best = 0;
      for (let i = 0; i < points.length; i++) {
        for (let j = 0; j < points.length; j++) {
          const x1 = points[i][0], y1 = points[i][1];
          const x2 = points[j][0], y2 = points[j][1];
          if (x1 >= x2 || y1 >= y2) continue;
          if (have[x1 + ":" + y2] !== true || have[x2 + ":" + y1] !== true) continue;
          const area = (x2 - x1) * (y2 - y1);
          if (best === 0 || area < best) best = area;
        }
      }
      return best;
    };
    return {
      slug: "minimum-area-rectangle",
      title: "Minimum Area Rectangle",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Array", "Geometry", "Google", "Amazon", "Meta"],
      signature: { funcName: "minAreaRect", params: [{ name: "points", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given points on a plane, find the minimum area of a rectangle whose four corners are all among the given points and whose sides are **parallel to the axes**.\n\nReturn `0` if no such rectangle exists.",
        [
          { in: "points = [[1,1],[1,3],[3,1],[3,3],[2,2]]", out: "4", note: "The four corner points form a 2 by 2 square." },
          { in: "points = [[1,1],[1,3],[3,1],[3,3],[4,1],[4,3]]", out: "2", note: "The columns at x = 3 and x = 4 give a 1 by 2 rectangle." },
          { in: "points = [[0,0],[1,1]]", out: "0" },
        ],
        ["1 <= points.length <= 500", "points[i].length == 2", "0 <= x, y <= 40000", "All points are distinct."]),
      hints: [
        "An axis-parallel rectangle is determined by two opposite corners with different `x` and different `y`.",
        "Given those two corners, the other two are forced: `(x1, y2)` and `(x2, y1)`.",
        "So put the points in a set and test every ordered pair of candidate diagonals.",
      ],
      editorial: explain({
        idea: "Pick two points as a diagonal. Their `x` and `y` values determine the remaining two corners exactly, so a set membership test decides whether the rectangle exists.",
        steps: [
          "Insert every point into a set keyed on its coordinates.",
          "For each ordered pair `(i, j)` with `x1 < x2` and `y1 < y2` — which fixes the diagonal's orientation and avoids double counting — check whether `(x1, y2)` and `(x2, y1)` are both present.",
          "Track the smallest `(x2 - x1) * (y2 - y1)` found; return `0` if none.",
        ],
        why: "Sides parallel to the axes mean a rectangle's corner set is exactly `{x1, x2} × {y1, y2}`, so any two opposite corners determine the whole shape. Requiring `x1 < x2` and `y1 < y2` names each rectangle by its bottom-left and top-right corner once.",
        time: "O(n²)",
        space: "O(n)",
        pitfalls: [
          "Allowing `x1 == x2` or `y1 == y2` degenerates the rectangle to a line with zero area.",
          "Encoding the point key as `x * 40001 + y` is fine, but a plain concatenation without a separator collides.",
          "`0` is the sentinel for 'no rectangle', so `best` cannot simply start at zero and use `min` — guard the first assignment.",
        ],
      }),
      examples: [
        { input: "[[1,1],[1,3],[3,1],[3,3],[2,2]]", expectedOutput: "4" },
        { input: "[[1,1],[1,3],[3,1],[3,3],[4,1],[4,3]]", expectedOutput: "2" },
        { input: "[[0,0],[1,1]]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const span = ri(rng, 2, 6);
        const seen: Record<string, boolean> = {};
        const points: number[][] = [];
        // The grid only holds (span + 1)^2 distinct cells, so cap the draw or the
        // rejection loop never terminates.
        const n = Math.min(ri(rng, 1, 16), (span + 1) * (span + 1));
        while (points.length < n) {
          const x = ri(rng, 0, span);
          const y = ri(rng, 0, span);
          const key = x + ":" + y;
          if (seen[key] === true) continue;
          seen[key] = true;
          points.push([x, y]);
        }
        return { input: fmtIntMat(points), expectedOutput: String(ref(points)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minAreaRect(points: List[List[int]]) -> int:\n    have = set((x, y) for x, y in points)\n    best = 0\n    for x1, y1 in points:\n        for x2, y2 in points:\n            if x1 >= x2 or y1 >= y2:\n                continue\n            if (x1, y2) in have and (x2, y1) in have:\n                area = (x2 - x1) * (y2 - y1)\n                if best == 0 or area < best:\n                    best = area\n    return best`,
        javascript: `var minAreaRect = function(points) {\n    var have = {};\n    for (var t = 0; t < points.length; t++) have[points[t][0] + ":" + points[t][1]] = true;\n    var best = 0;\n    for (var i = 0; i < points.length; i++) {\n        for (var j = 0; j < points.length; j++) {\n            var x1 = points[i][0], y1 = points[i][1];\n            var x2 = points[j][0], y2 = points[j][1];\n            if (x1 >= x2 || y1 >= y2) continue;\n            if (have[x1 + ":" + y2] !== true || have[x2 + ":" + y1] !== true) continue;\n            var area = (x2 - x1) * (y2 - y1);\n            if (best === 0 || area < best) best = area;\n        }\n    }\n    return best;\n};`,
        typescript: `function minAreaRect(points: number[][]): number {\n    var have: { [key: string]: boolean } = {};\n    for (var t = 0; t < points.length; t++) have[points[t][0] + ":" + points[t][1]] = true;\n    var best = 0;\n    for (var i = 0; i < points.length; i++) {\n        for (var j = 0; j < points.length; j++) {\n            var x1 = points[i][0], y1 = points[i][1];\n            var x2 = points[j][0], y2 = points[j][1];\n            if (x1 >= x2 || y1 >= y2) continue;\n            if (have[x1 + ":" + y2] !== true || have[x2 + ":" + y1] !== true) continue;\n            var area = (x2 - x1) * (y2 - y1);\n            if (best === 0 || area < best) best = area;\n        }\n    }\n    return best;\n}`,
        java: `public static int minAreaRect(int[][] points) {\n    Set<Long> have = new HashSet<>();\n    for (int[] p : points) have.add((long) p[0] * 40001L + p[1]);\n    int best = 0;\n    for (int[] a : points) {\n        for (int[] b : points) {\n            int x1 = a[0], y1 = a[1], x2 = b[0], y2 = b[1];\n            if (x1 >= x2 || y1 >= y2) continue;\n            if (!have.contains((long) x1 * 40001L + y2)) continue;\n            if (!have.contains((long) x2 * 40001L + y1)) continue;\n            int area = (x2 - x1) * (y2 - y1);\n            if (best == 0 || area < best) best = area;\n        }\n    }\n    return best;\n}`,
        cpp: `int minAreaRect(vector<vector<int>>& points) {\n    unordered_set<long long> have;\n    for (auto& p : points) have.insert((long long) p[0] * 40001LL + p[1]);\n    int best = 0;\n    for (auto& a : points) {\n        for (auto& b : points) {\n            int x1 = a[0], y1 = a[1], x2 = b[0], y2 = b[1];\n            if (x1 >= x2 || y1 >= y2) continue;\n            if (!have.count((long long) x1 * 40001LL + y2)) continue;\n            if (!have.count((long long) x2 * 40001LL + y1)) continue;\n            int area = (x2 - x1) * (y2 - y1);\n            if (best == 0 || area < best) best = area;\n        }\n    }\n    return best;\n}`,
        c: `static int hasPointC(int** points, int n, int x, int y) {\n    for (int i = 0; i < n; i++) {\n        if (points[i][0] == x && points[i][1] == y) return 1;\n    }\n    return 0;\n}\n\nint minAreaRect(int** points, int pointsSize, int* pointsColSize) {\n    int best = 0;\n    for (int i = 0; i < pointsSize; i++) {\n        for (int j = 0; j < pointsSize; j++) {\n            int x1 = points[i][0], y1 = points[i][1];\n            int x2 = points[j][0], y2 = points[j][1];\n            if (x1 >= x2 || y1 >= y2) continue;\n            if (!hasPointC(points, pointsSize, x1, y2)) continue;\n            if (!hasPointC(points, pointsSize, x2, y1)) continue;\n            int area = (x2 - x1) * (y2 - y1);\n            if (best == 0 || area < best) best = area;\n        }\n    }\n    return best;\n}`,
        csharp: `public static int MinAreaRect(int[][] points)\n{\n    var have = new HashSet<long>();\n    foreach (var p in points) have.Add((long) p[0] * 40001L + p[1]);\n    int best = 0;\n    foreach (var a in points)\n    {\n        foreach (var b in points)\n        {\n            int x1 = a[0], y1 = a[1], x2 = b[0], y2 = b[1];\n            if (x1 >= x2 || y1 >= y2) continue;\n            if (!have.Contains((long) x1 * 40001L + y2)) continue;\n            if (!have.Contains((long) x2 * 40001L + y1)) continue;\n            int area = (x2 - x1) * (y2 - y1);\n            if (best == 0 || area < best) best = area;\n        }\n    }\n    return best;\n}`,
        go: `func minAreaRect(points [][]int) int {\n\thave := map[int]bool{}\n\tfor _, p := range points {\n\t\thave[p[0]*40001+p[1]] = true\n\t}\n\tbest := 0\n\tfor _, a := range points {\n\t\tfor _, b := range points {\n\t\t\tx1, y1, x2, y2 := a[0], a[1], b[0], b[1]\n\t\t\tif x1 >= x2 || y1 >= y2 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tif !have[x1*40001+y2] || !have[x2*40001+y1] {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tarea := (x2 - x1) * (y2 - y1)\n\t\t\tif best == 0 || area < best {\n\t\t\t\tbest = area\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun minAreaRect(points: Array<IntArray>): Int {\n    val have = HashSet<Long>()\n    for (p in points) have.add(p[0].toLong() * 40001L + p[1])\n    var best = 0\n    for (a in points) {\n        for (b in points) {\n            val x1 = a[0]\n            val y1 = a[1]\n            val x2 = b[0]\n            val y2 = b[1]\n            if (x1 >= x2 || y1 >= y2) continue\n            if (!have.contains(x1.toLong() * 40001L + y2)) continue\n            if (!have.contains(x2.toLong() * 40001L + y1)) continue\n            val area = (x2 - x1) * (y2 - y1)\n            if (best == 0 || area < best) best = area\n        }\n    }\n    return best\n}`,
        swift: `func minAreaRect(_ points: [[Int]]) -> Int {\n    var have = Set<Int>()\n    for p in points { have.insert(p[0] * 40001 + p[1]) }\n    var best = 0\n    for a in points {\n        for b in points {\n            let x1 = a[0], y1 = a[1], x2 = b[0], y2 = b[1]\n            if x1 >= x2 || y1 >= y2 { continue }\n            if !have.contains(x1 * 40001 + y2) { continue }\n            if !have.contains(x2 * 40001 + y1) { continue }\n            let area = (x2 - x1) * (y2 - y1)\n            if best == 0 || area < best { best = area }\n        }\n    }\n    return best\n}`,
        rust: `fn minAreaRect(points: Vec<Vec<i32>>) -> i32 {\n    let mut have: std::collections::HashSet<i64> = std::collections::HashSet::new();\n    for p in points.iter() {\n        have.insert(p[0] as i64 * 40001 + p[1] as i64);\n    }\n    let mut best = 0i32;\n    for a in points.iter() {\n        for b in points.iter() {\n            let (x1, y1, x2, y2) = (a[0], a[1], b[0], b[1]);\n            if x1 >= x2 || y1 >= y2 {\n                continue;\n            }\n            if !have.contains(&(x1 as i64 * 40001 + y2 as i64)) {\n                continue;\n            }\n            if !have.contains(&(x2 as i64 * 40001 + y1 as i64)) {\n                continue;\n            }\n            let area = (x2 - x1) * (y2 - y1);\n            if best == 0 || area < best {\n                best = area;\n            }\n        }\n    }\n    best\n}`,
        php: `function minAreaRect($points) {\n    $have = array();\n    foreach ($points as $p) $have[$p[0] * 40001 + $p[1]] = true;\n    $best = 0;\n    foreach ($points as $a) {\n        foreach ($points as $b) {\n            $x1 = $a[0]; $y1 = $a[1]; $x2 = $b[0]; $y2 = $b[1];\n            if ($x1 >= $x2 || $y1 >= $y2) continue;\n            if (!isset($have[$x1 * 40001 + $y2])) continue;\n            if (!isset($have[$x2 * 40001 + $y1])) continue;\n            $area = ($x2 - $x1) * ($y2 - $y1);\n            if ($best === 0 || $area < $best) $best = $area;\n        }\n    }\n    return $best;\n}`,
        ruby: `def minAreaRect(points)\n  have = {}\n  points.each { |p| have[[p[0], p[1]]] = true }\n  best = 0\n  points.each do |a|\n    points.each do |b|\n      x1, y1, x2, y2 = a[0], a[1], b[0], b[1]\n      next if x1 >= x2 || y1 >= y2\n      next unless have[[x1, y2]] && have[[x2, y1]]\n      area = (x2 - x1) * (y2 - y1)\n      best = area if best == 0 || area < best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Find Players With Zero or One Losses (LC 2225) ──────────────
  (() => {
    const ref = (matches: number[][]) => {
      const losses: Record<string, number> = {};
      for (const m of matches) {
        const w = String(m[0]), l = String(m[1]);
        if (losses[w] === undefined) losses[w] = 0;
        losses[l] = (losses[l] === undefined ? 0 : losses[l]) + 1;
      }
      const zero: number[] = [], one: number[] = [];
      for (const k of Object.keys(losses)) {
        if (losses[k] === 0) zero.push(Number(k));
        else if (losses[k] === 1) one.push(Number(k));
      }
      zero.sort((a, b) => a - b);
      one.sort((a, b) => a - b);
      return [zero, one];
    };
    return {
      slug: "find-players-with-zero-or-one-losses",
      title: "Find Players With Zero or One Losses",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Array", "Sorting", "Counting", "Amazon", "Google", "Paytm"],
      signature: { funcName: "findWinners", params: [{ name: "matches", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "Each entry `matches[i] = [winner, loser]` records one completed match.\n\nReturn a list of two lists: the players who have **never lost**, and the players who have lost **exactly once**. Both lists must be sorted in increasing order. Only players who appear in at least one match are considered.",
        [
          { in: "matches = [[1,3],[2,3],[3,6],[5,6],[5,7],[4,5],[4,8],[4,9],[10,4],[10,9]]", out: "[[1,2,10],[4,5,7,8]]", note: "Players 1, 2 and 10 never lost; 4, 5, 7 and 8 each lost once." },
          { in: "matches = [[2,3],[1,3],[5,4],[6,4]]", out: "[[1,2,5,6],[]]", note: "Players 3 and 4 each lost twice, so the second list is empty." },
          { in: "matches = [[1,2]]", out: "[[1],[2]]" },
        ],
        ["1 <= matches.length <= 100000", "matches[i].length == 2", "1 <= winner, loser <= 100000", "Each pair of players meets at most once."]),
      hints: [
        "One tally per player: how many times they lost.",
        "A winner still needs an entry, initialised to zero, or they will be missing from the first list.",
        "Then filter for a tally of 0 and a tally of 1, sorting each list.",
      ],
      editorial: explain({
        idea: "A single map from player to loss count answers both questions. The subtlety is that winners must be inserted with a count of zero so they are not forgotten.",
        steps: [
          "For each match, ensure the winner has an entry (defaulting to 0) and increment the loser's entry.",
          "Walk the map, collecting keys with a count of 0 into one list and keys with a count of 1 into the other.",
          "Sort both lists ascending.",
        ],
        why: "Every player who appears in any match ends up in the map — losers by incrementing, winners by the explicit zero-initialisation — so the two filters cover exactly the players the statement considers.",
        time: "O(m log m)",
        space: "O(m)",
        pitfalls: [
          "Only inserting losers loses every undefeated player, which is the whole first list.",
          "Returning the lists in map iteration order rather than sorted.",
          "An empty list must still appear as `[]` — the answer always has two entries.",
        ],
      }),
      examples: [
        { input: "[[1,3],[2,3],[3,6],[5,6],[5,7],[4,5],[4,8],[4,9],[10,4],[10,9]]", expectedOutput: "[[1,2,10],[4,5,7,8]]" },
        { input: "[[2,3],[1,3],[5,4],[6,4]]", expectedOutput: "[[1,2,5,6],[]]" },
        { input: "[[1,2]]", expectedOutput: "[[1],[2]]" },
      ],
      gen: (rng: Rng) => {
        const players = ri(rng, 2, 10);
        const matches: number[][] = [];
        for (let t = ri(rng, 1, 16); t > 0; t--) {
          const a = ri(rng, 1, players);
          let b = ri(rng, 1, players);
          while (b === a) b = ri(rng, 1, players);
          matches.push([a, b]);
        }
        return { input: fmtIntMat(matches), expectedOutput: fmtIntMat(ref(matches)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findWinners(matches: List[List[int]]) -> List[List[int]]:\n    losses = {}\n    for w, l in matches:\n        losses.setdefault(w, 0)\n        losses[l] = losses.get(l, 0) + 1\n    zero = sorted(p for p, c in losses.items() if c == 0)\n    one = sorted(p for p, c in losses.items() if c == 1)\n    return [zero, one]`,
        javascript: `var findWinners = function(matches) {\n    var losses = {};\n    for (var i = 0; i < matches.length; i++) {\n        var w = String(matches[i][0]), l = String(matches[i][1]);\n        if (losses[w] === undefined) losses[w] = 0;\n        losses[l] = (losses[l] === undefined ? 0 : losses[l]) + 1;\n    }\n    var zero = [], one = [];\n    var keys = Object.keys(losses);\n    for (var j = 0; j < keys.length; j++) {\n        if (losses[keys[j]] === 0) zero.push(Number(keys[j]));\n        else if (losses[keys[j]] === 1) one.push(Number(keys[j]));\n    }\n    zero.sort(function(a, b) { return a - b; });\n    one.sort(function(a, b) { return a - b; });\n    return [zero, one];\n};`,
        typescript: `function findWinners(matches: number[][]): number[][] {\n    var losses: { [key: string]: number } = {};\n    for (var i = 0; i < matches.length; i++) {\n        var w = String(matches[i][0]), l = String(matches[i][1]);\n        if (losses[w] === undefined) losses[w] = 0;\n        losses[l] = (losses[l] === undefined ? 0 : losses[l]) + 1;\n    }\n    var zero: number[] = [], one: number[] = [];\n    var keys = Object.keys(losses);\n    for (var j = 0; j < keys.length; j++) {\n        if (losses[keys[j]] === 0) zero.push(Number(keys[j]));\n        else if (losses[keys[j]] === 1) one.push(Number(keys[j]));\n    }\n    zero.sort(function(a, b) { return a - b; });\n    one.sort(function(a, b) { return a - b; });\n    return [zero, one];\n}`,
        java: `public static int[][] findWinners(int[][] matches) {\n    TreeMap<Integer, Integer> losses = new TreeMap<>();\n    for (int[] m : matches) {\n        losses.putIfAbsent(m[0], 0);\n        losses.put(m[1], losses.getOrDefault(m[1], 0) + 1);\n    }\n    List<Integer> zero = new ArrayList<>();\n    List<Integer> one = new ArrayList<>();\n    for (Map.Entry<Integer, Integer> e : losses.entrySet()) {\n        if (e.getValue() == 0) zero.add(e.getKey());\n        else if (e.getValue() == 1) one.add(e.getKey());\n    }\n    int[][] out = new int[2][];\n    out[0] = new int[zero.size()];\n    for (int i = 0; i < zero.size(); i++) out[0][i] = zero.get(i);\n    out[1] = new int[one.size()];\n    for (int i = 0; i < one.size(); i++) out[1][i] = one.get(i);\n    return out;\n}`,
        cpp: `vector<vector<int>> findWinners(vector<vector<int>>& matches) {\n    map<int, int> losses;\n    for (auto& m : matches) {\n        if (!losses.count(m[0])) losses[m[0]] = 0;\n        losses[m[1]]++;\n    }\n    vector<int> zero, one;\n    for (auto& e : losses) {\n        if (e.second == 0) zero.push_back(e.first);\n        else if (e.second == 1) one.push_back(e.first);\n    }\n    return { zero, one };\n}`,
        c: `int** findWinners(int** matches, int matchesSize, int* matchesColSize, int* returnSize, int** returnColumnSizes) {\n    int maxId = 0;\n    for (int i = 0; i < matchesSize; i++) {\n        if (matches[i][0] > maxId) maxId = matches[i][0];\n        if (matches[i][1] > maxId) maxId = matches[i][1];\n    }\n    int* losses = (int*) malloc((size_t) (maxId + 1) * sizeof(int));\n    for (int i = 0; i <= maxId; i++) losses[i] = -1;\n    for (int i = 0; i < matchesSize; i++) {\n        if (losses[matches[i][0]] < 0) losses[matches[i][0]] = 0;\n        if (losses[matches[i][1]] < 0) losses[matches[i][1]] = 0;\n        losses[matches[i][1]]++;\n    }\n    int zc = 0, oc = 0;\n    for (int p = 0; p <= maxId; p++) {\n        if (losses[p] == 0) zc++;\n        else if (losses[p] == 1) oc++;\n    }\n    int* zero = (int*) malloc((size_t) (zc > 0 ? zc : 1) * sizeof(int));\n    int* one = (int*) malloc((size_t) (oc > 0 ? oc : 1) * sizeof(int));\n    int zi = 0, oi = 0;\n    for (int p = 0; p <= maxId; p++) {\n        if (losses[p] == 0) zero[zi++] = p;\n        else if (losses[p] == 1) one[oi++] = p;\n    }\n    free(losses);\n    int** out = (int**) malloc(2 * sizeof(int*));\n    int* cols = (int*) malloc(2 * sizeof(int));\n    out[0] = zero; cols[0] = zc;\n    out[1] = one; cols[1] = oc;\n    *returnSize = 2;\n    *returnColumnSizes = cols;\n    return out;\n}`,
        csharp: `public static int[][] FindWinners(int[][] matches)\n{\n    var losses = new Dictionary<int, int>();\n    foreach (var m in matches)\n    {\n        if (!losses.ContainsKey(m[0])) losses[m[0]] = 0;\n        int c;\n        losses[m[1]] = (losses.TryGetValue(m[1], out c) ? c : 0) + 1;\n    }\n    var zero = new List<int>();\n    var one = new List<int>();\n    foreach (var e in losses)\n    {\n        if (e.Value == 0) zero.Add(e.Key);\n        else if (e.Value == 1) one.Add(e.Key);\n    }\n    zero.Sort();\n    one.Sort();\n    return new int[][] { zero.ToArray(), one.ToArray() };\n}`,
        go: `func findWinners(matches [][]int) [][]int {\n\tlosses := map[int]int{}\n\tfor _, m := range matches {\n\t\tif _, ok := losses[m[0]]; !ok {\n\t\t\tlosses[m[0]] = 0\n\t\t}\n\t\tlosses[m[1]]++\n\t}\n\tzero := []int{}\n\tone := []int{}\n\tfor p, c := range losses {\n\t\tif c == 0 {\n\t\t\tzero = append(zero, p)\n\t\t} else if c == 1 {\n\t\t\tone = append(one, p)\n\t\t}\n\t}\n\tsort.Ints(zero)\n\tsort.Ints(one)\n\treturn [][]int{zero, one}\n}`,
        kotlin: `fun findWinners(matches: Array<IntArray>): Array<IntArray> {\n    val losses = HashMap<Int, Int>()\n    for (m in matches) {\n        if (!losses.containsKey(m[0])) losses[m[0]] = 0\n        losses[m[1]] = (losses[m[1]] ?: 0) + 1\n    }\n    val zero = losses.filter { it.value == 0 }.keys.sorted().toIntArray()\n    val one = losses.filter { it.value == 1 }.keys.sorted().toIntArray()\n    return arrayOf(zero, one)\n}`,
        swift: `func findWinners(_ matches: [[Int]]) -> [[Int]] {\n    var losses: [Int: Int] = [:]\n    for m in matches {\n        if losses[m[0]] == nil { losses[m[0]] = 0 }\n        losses[m[1]] = (losses[m[1]] ?? 0) + 1\n    }\n    let zero = losses.filter { $0.value == 0 }.keys.sorted()\n    let one = losses.filter { $0.value == 1 }.keys.sorted()\n    return [zero, one]\n}`,
        rust: `fn findWinners(matches: Vec<Vec<i32>>) -> Vec<Vec<i32>> {\n    let mut losses: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();\n    for m in matches.iter() {\n        losses.entry(m[0]).or_insert(0);\n        *losses.entry(m[1]).or_insert(0) += 1;\n    }\n    let mut zero: Vec<i32> = Vec::new();\n    let mut one: Vec<i32> = Vec::new();\n    for (&p, &c) in losses.iter() {\n        if c == 0 {\n            zero.push(p);\n        } else if c == 1 {\n            one.push(p);\n        }\n    }\n    zero.sort();\n    one.sort();\n    vec![zero, one]\n}`,
        php: `function findWinners($matches) {\n    $losses = array();\n    foreach ($matches as $m) {\n        if (!isset($losses[$m[0]])) $losses[$m[0]] = 0;\n        $losses[$m[1]] = isset($losses[$m[1]]) ? $losses[$m[1]] + 1 : 1;\n    }\n    $zero = array();\n    $one = array();\n    foreach ($losses as $p => $c) {\n        if ($c === 0) $zero[] = $p;\n        else if ($c === 1) $one[] = $p;\n    }\n    sort($zero);\n    sort($one);\n    return array($zero, $one);\n}`,
        ruby: `def findWinners(matches)\n  losses = {}\n  matches.each do |m|\n    losses[m[0]] = 0 unless losses.key?(m[0])\n    losses[m[1]] = (losses[m[1]] || 0) + 1\n  end\n  zero = losses.select { |_, c| c == 0 }.keys.sort\n  one = losses.select { |_, c| c == 1 }.keys.sort\n  [zero, one]\nend`,
      },
    };
  })(),

  // ── 4Sum II (LC 454) ────────────────────────────────────────────
  (() => {
    const ref = (nums1: number[], nums2: number[], nums3: number[], nums4: number[]) => {
      const pair: Record<string, number> = {};
      for (const a of nums1) {
        for (const b of nums2) {
          const key = String(a + b);
          pair[key] = (pair[key] === undefined ? 0 : pair[key]) + 1;
        }
      }
      let total = 0;
      for (const c of nums3) {
        for (const d of nums4) {
          const key = String(-(c + d));
          if (pair[key] !== undefined) total += pair[key];
        }
      }
      return total;
    };
    return {
      slug: "4sum-ii",
      title: "4Sum II",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Array", "Counting", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "fourSumCount", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }, { name: "nums3", type: "int[]" as const }, { name: "nums4", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given four integer arrays of the same length `n`, count the index tuples `(i, j, k, l)` such that `nums1[i] + nums2[j] + nums3[k] + nums4[l] == 0`.\n\nTuples are counted by index, so repeated values contribute separately.",
        [
          { in: "nums1 = [1,2], nums2 = [-2,-1], nums3 = [-1,2], nums4 = [0,2]", out: "2", note: "The two valid tuples are (0,0,0,1) and (1,1,0,0)." },
          { in: "nums1 = [0], nums2 = [0], nums3 = [0], nums4 = [0]", out: "1" },
          { in: "nums1 = [1], nums2 = [1], nums3 = [1], nums4 = [1]", out: "0" },
        ],
        ["n == nums1.length == nums2.length == nums3.length == nums4.length", "1 <= n <= 200", "-100000000 <= values <= 100000000"]),
      hints: [
        "Four nested loops is O(n⁴). Split the four arrays into two halves instead.",
        "Tally every sum `nums1[i] + nums2[j]` in a map — that is O(n²) entries.",
        "Then for each `nums3[k] + nums4[l]`, look up its negation and add the tally.",
      ],
      editorial: explain({
        idea: "Meet in the middle. The condition `a + b + c + d == 0` splits into `(a + b) == -(c + d)`, so precomputing all pairwise sums from the first two arrays turns the search into a lookup.",
        steps: [
          "Build a map from `nums1[i] + nums2[j]` to how many `(i, j)` pairs produce it.",
          "For each `(k, l)`, look up `-(nums3[k] + nums4[l])` and add its tally to the answer.",
        ],
        why: "Every qualifying tuple is counted exactly once: its first half contributes one unit to the map entry that its second half looks up. Splitting 4 into 2 + 2 takes the cost from `n⁴` to `n²`.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "Looking up `nums3[k] + nums4[l]` instead of its negation answers a different equation.",
          "A set instead of a count map collapses repeated pair sums and undercounts badly.",
          "The sums reach 200 million, which fits in 32 bits, but the answer can reach `n⁴ = 1.6 billion` — use 64 bits while accumulating if `n` grows.",
        ],
      }),
      examples: [
        { input: "[1,2]\n[-2,-1]\n[-1,2]\n[0,2]", expectedOutput: "2" },
        { input: "[0]\n[0]\n[0]\n[0]", expectedOutput: "1" },
        { input: "[1]\n[1]\n[1]\n[1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const hi = rng() < 0.6 ? 3 : 100000000;
        const mk = () => Array.from({ length: n }, () => ri(rng, -hi, hi));
        const a = mk(), b = mk(), c = mk(), d = mk();
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}\n${fmtIntArr(c)}\n${fmtIntArr(d)}`, expectedOutput: String(ref(a, b, c, d)) };
      },
      solutions: {
        python: `from typing import List\n\ndef fourSumCount(nums1: List[int], nums2: List[int], nums3: List[int], nums4: List[int]) -> int:\n    pair = {}\n    for a in nums1:\n        for b in nums2:\n            pair[a + b] = pair.get(a + b, 0) + 1\n    total = 0\n    for c in nums3:\n        for d in nums4:\n            total += pair.get(-(c + d), 0)\n    return total`,
        javascript: `var fourSumCount = function(nums1, nums2, nums3, nums4) {\n    var pair = {};\n    for (var i = 0; i < nums1.length; i++) {\n        for (var j = 0; j < nums2.length; j++) {\n            var key = String(nums1[i] + nums2[j]);\n            pair[key] = (pair[key] === undefined ? 0 : pair[key]) + 1;\n        }\n    }\n    var total = 0;\n    for (var k = 0; k < nums3.length; k++) {\n        for (var l = 0; l < nums4.length; l++) {\n            var want = String(-(nums3[k] + nums4[l]));\n            if (pair[want] !== undefined) total += pair[want];\n        }\n    }\n    return total;\n};`,
        typescript: `function fourSumCount(nums1: number[], nums2: number[], nums3: number[], nums4: number[]): number {\n    var pair: { [key: string]: number } = {};\n    for (var i = 0; i < nums1.length; i++) {\n        for (var j = 0; j < nums2.length; j++) {\n            var key = String(nums1[i] + nums2[j]);\n            pair[key] = (pair[key] === undefined ? 0 : pair[key]) + 1;\n        }\n    }\n    var total = 0;\n    for (var k = 0; k < nums3.length; k++) {\n        for (var l = 0; l < nums4.length; l++) {\n            var want = String(-(nums3[k] + nums4[l]));\n            if (pair[want] !== undefined) total += pair[want];\n        }\n    }\n    return total;\n}`,
        java: `public static int fourSumCount(int[] nums1, int[] nums2, int[] nums3, int[] nums4) {\n    Map<Long, Integer> pair = new HashMap<>();\n    for (int a : nums1) {\n        for (int b : nums2) {\n            long s = (long) a + b;\n            pair.put(s, pair.getOrDefault(s, 0) + 1);\n        }\n    }\n    int total = 0;\n    for (int c : nums3) {\n        for (int d : nums4) {\n            total += pair.getOrDefault(-((long) c + d), 0);\n        }\n    }\n    return total;\n}`,
        cpp: `int fourSumCount(vector<int>& nums1, vector<int>& nums2, vector<int>& nums3, vector<int>& nums4) {\n    unordered_map<long long, int> pair;\n    for (int a : nums1) {\n        for (int b : nums2) pair[(long long) a + b]++;\n    }\n    int total = 0;\n    for (int c : nums3) {\n        for (int d : nums4) {\n            auto it = pair.find(-((long long) c + d));\n            if (it != pair.end()) total += it->second;\n        }\n    }\n    return total;\n}`,
        c: `int fourSumCount(int* nums1, int nums1Size, int* nums2, int nums2Size, int* nums3, int nums3Size, int* nums4, int nums4Size) {\n    int m = nums1Size * nums2Size;\n    long long* sums = (long long*) malloc((size_t) m * sizeof(long long));\n    int idx = 0;\n    for (int i = 0; i < nums1Size; i++) {\n        for (int j = 0; j < nums2Size; j++) sums[idx++] = (long long) nums1[i] + nums2[j];\n    }\n    int total = 0;\n    for (int k = 0; k < nums3Size; k++) {\n        for (int l = 0; l < nums4Size; l++) {\n            long long want = -((long long) nums3[k] + nums4[l]);\n            for (int t = 0; t < m; t++) {\n                if (sums[t] == want) total++;\n            }\n        }\n    }\n    free(sums);\n    return total;\n}`,
        csharp: `public static int FourSumCount(int[] nums1, int[] nums2, int[] nums3, int[] nums4)\n{\n    var pair = new Dictionary<long, int>();\n    foreach (int a in nums1)\n    {\n        foreach (int b in nums2)\n        {\n            long s = (long) a + b;\n            int c;\n            pair[s] = (pair.TryGetValue(s, out c) ? c : 0) + 1;\n        }\n    }\n    int total = 0;\n    foreach (int c3 in nums3)\n    {\n        foreach (int d in nums4)\n        {\n            int cnt;\n            if (pair.TryGetValue(-((long) c3 + d), out cnt)) total += cnt;\n        }\n    }\n    return total;\n}`,
        go: `func fourSumCount(nums1 []int, nums2 []int, nums3 []int, nums4 []int) int {\n\tpair := map[int]int{}\n\tfor _, a := range nums1 {\n\t\tfor _, b := range nums2 {\n\t\t\tpair[a+b]++\n\t\t}\n\t}\n\ttotal := 0\n\tfor _, c := range nums3 {\n\t\tfor _, d := range nums4 {\n\t\t\ttotal += pair[-(c + d)]\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun fourSumCount(nums1: IntArray, nums2: IntArray, nums3: IntArray, nums4: IntArray): Int {\n    val pair = HashMap<Long, Int>()\n    for (a in nums1) {\n        for (b in nums2) {\n            val s = a.toLong() + b\n            pair[s] = (pair[s] ?: 0) + 1\n        }\n    }\n    var total = 0\n    for (c in nums3) {\n        for (d in nums4) {\n            total += pair[-(c.toLong() + d)] ?: 0\n        }\n    }\n    return total\n}`,
        swift: `func fourSumCount(_ nums1: [Int], _ nums2: [Int], _ nums3: [Int], _ nums4: [Int]) -> Int {\n    var pair: [Int: Int] = [:]\n    for a in nums1 {\n        for b in nums2 { pair[a + b] = (pair[a + b] ?? 0) + 1 }\n    }\n    var total = 0\n    for c in nums3 {\n        for d in nums4 { total += pair[-(c + d)] ?? 0 }\n    }\n    return total\n}`,
        rust: `fn fourSumCount(nums1: Vec<i32>, nums2: Vec<i32>, nums3: Vec<i32>, nums4: Vec<i32>) -> i32 {\n    let mut pair: std::collections::HashMap<i64, i32> = std::collections::HashMap::new();\n    for &a in nums1.iter() {\n        for &b in nums2.iter() {\n            *pair.entry(a as i64 + b as i64).or_insert(0) += 1;\n        }\n    }\n    let mut total = 0i32;\n    for &c in nums3.iter() {\n        for &d in nums4.iter() {\n            if let Some(&cnt) = pair.get(&(-(c as i64 + d as i64))) {\n                total += cnt;\n            }\n        }\n    }\n    total\n}`,
        php: `function fourSumCount($nums1, $nums2, $nums3, $nums4) {\n    $pair = array();\n    foreach ($nums1 as $a) {\n        foreach ($nums2 as $b) {\n            $s = $a + $b;\n            $pair[$s] = isset($pair[$s]) ? $pair[$s] + 1 : 1;\n        }\n    }\n    $total = 0;\n    foreach ($nums3 as $c) {\n        foreach ($nums4 as $d) {\n            $want = -($c + $d);\n            if (isset($pair[$want])) $total += $pair[$want];\n        }\n    }\n    return $total;\n}`,
        ruby: `def fourSumCount(nums1, nums2, nums3, nums4)\n  pair = Hash.new(0)\n  nums1.each { |a| nums2.each { |b| pair[a + b] += 1 } }\n  total = 0\n  nums3.each { |c| nums4.each { |d| total += pair[-(c + d)] } }\n  total\nend`,
      },
    };
  })(),

  // ── Max Points on a Line (LC 149) ───────────────────────────────
  (() => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const ref = (points: number[][]) => {
      const n = points.length;
      if (n <= 2) return n;
      let best = 1;
      for (let i = 0; i < n; i++) {
        const slopes: Record<string, number> = {};
        for (let j = 0; j < n; j++) {
          if (i === j) continue;
          let dx = points[j][0] - points[i][0];
          let dy = points[j][1] - points[i][1];
          let g = gcd(Math.abs(dx), Math.abs(dy));
          if (g === 0) g = 1;
          dx /= g;
          dy /= g;
          if (dx < 0 || (dx === 0 && dy < 0)) { dx = -dx; dy = -dy; }
          const key = dx + "/" + dy;
          slopes[key] = (slopes[key] === undefined ? 0 : slopes[key]) + 1;
          if (slopes[key] + 1 > best) best = slopes[key] + 1;
        }
      }
      return best;
    };
    return {
      slug: "max-points-on-a-line",
      title: "Max Points on a Line",
      difficulty: "HARD" as const,
      tags: ["Hash Table", "Math", "Geometry", "Google", "Amazon", "Apple"],
      signature: { funcName: "maxPoints", params: [{ name: "points", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given `points` on a plane, return the maximum number of them that lie on the same straight line.",
        [
          { in: "points = [[1,1],[2,2],[3,3]]", out: "3", note: "All three sit on the line y = x." },
          { in: "points = [[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]", out: "4", note: "(1,4), (2,3), (3,2) and (4,1) are collinear." },
          { in: "points = [[0,0]]", out: "1" },
        ],
        ["1 <= points.length <= 300", "points[i].length == 2", "-10000 <= x, y <= 10000", "All points are distinct."]),
      hints: [
        "Every line through at least two points passes through some point `i` — so fix `i` and group the others by direction.",
        "Floating-point slopes are the classic trap: vertical lines divide by zero, and rounding merges distinct slopes.",
        "Normalise each direction vector `(dx, dy)` by its gcd and fix a canonical sign so that `(1,2)` and `(-1,-2)` are the same key.",
      ],
      editorial: explain({
        idea: "Anchor on each point and bucket the other points by the reduced direction vector to it. The largest bucket plus the anchor itself is the best line through that anchor; the maximum over anchors is the answer.",
        steps: [
          "For each anchor `i`, walk every other point `j` and form `(dx, dy) = (xj - xi, yj - yi)`.",
          "Divide both by `gcd(|dx|, |dy|)` so parallel vectors reduce to the same pair.",
          "Flip the sign so that `dx > 0`, or `dx == 0` with `dy > 0` — this merges a direction with its opposite.",
          "Tally the normalised keys; the best count plus one (for the anchor) is a candidate answer.",
        ],
        why: "Two points lie on a line through the anchor exactly when their direction vectors from it are parallel, and the gcd-reduced sign-normalised vector is a canonical representative of a direction. Since every line with two or more points contains an anchor that is examined, no line is missed.",
        time: "O(n² log V)",
        space: "O(n)",
        pitfalls: [
          "Using `dy / dx` as a double breaks on vertical lines and can equate slopes that differ in the last bits.",
          "Without sign normalisation, points on opposite sides of the anchor land in different buckets and the count halves.",
          "`gcd(0, 0)` never arises because the points are distinct, but guarding `g == 0` costs nothing.",
          "One or two points trivially lie on a line — return `n` directly.",
        ],
      }),
      examples: [
        { input: "[[1,1],[2,2],[3,3]]", expectedOutput: "3" },
        { input: "[[1,1],[3,2],[5,3],[4,1],[2,3],[1,4]]", expectedOutput: "4" },
        { input: "[[0,0]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const span = ri(rng, 2, 6);
        const cells = (2 * span + 1) * (2 * span + 1);
        const n = Math.min(ri(rng, 1, 14), cells);
        const seen: Record<string, boolean> = {};
        const points: number[][] = [];
        while (points.length < n) {
          const x = ri(rng, -span, span);
          const y = ri(rng, -span, span);
          const key = x + ":" + y;
          if (seen[key] === true) continue;
          seen[key] = true;
          points.push([x, y]);
        }
        return { input: fmtIntMat(points), expectedOutput: String(ref(points)) };
      },
      solutions: {
        python: `from math import gcd\nfrom typing import List\n\ndef maxPoints(points: List[List[int]]) -> int:\n    n = len(points)\n    if n <= 2:\n        return n\n    best = 1\n    for i in range(n):\n        slopes = {}\n        for j in range(n):\n            if i == j:\n                continue\n            dx = points[j][0] - points[i][0]\n            dy = points[j][1] - points[i][1]\n            g = gcd(abs(dx), abs(dy)) or 1\n            dx //= g\n            dy //= g\n            if dx < 0 or (dx == 0 and dy < 0):\n                dx, dy = -dx, -dy\n            key = (dx, dy)\n            slopes[key] = slopes.get(key, 0) + 1\n            best = max(best, slopes[key] + 1)\n    return best`,
        javascript: `var maxPoints = function(points) {\n    var n = points.length;\n    if (n <= 2) return n;\n    var gcd = function(a, b) {\n        while (b !== 0) {\n            var t = a % b;\n            a = b;\n            b = t;\n        }\n        return a;\n    };\n    var best = 1;\n    for (var i = 0; i < n; i++) {\n        var slopes = {};\n        for (var j = 0; j < n; j++) {\n            if (i === j) continue;\n            var dx = points[j][0] - points[i][0];\n            var dy = points[j][1] - points[i][1];\n            var g = gcd(Math.abs(dx), Math.abs(dy));\n            if (g === 0) g = 1;\n            dx = dx / g;\n            dy = dy / g;\n            if (dx < 0 || (dx === 0 && dy < 0)) { dx = -dx; dy = -dy; }\n            var key = dx + "/" + dy;\n            slopes[key] = (slopes[key] === undefined ? 0 : slopes[key]) + 1;\n            if (slopes[key] + 1 > best) best = slopes[key] + 1;\n        }\n    }\n    return best;\n};`,
        typescript: `function maxPoints(points: number[][]): number {\n    var n = points.length;\n    if (n <= 2) return n;\n    var gcd = function(a: number, b: number): number {\n        while (b !== 0) {\n            var t = a % b;\n            a = b;\n            b = t;\n        }\n        return a;\n    };\n    var best = 1;\n    for (var i = 0; i < n; i++) {\n        var slopes: { [key: string]: number } = {};\n        for (var j = 0; j < n; j++) {\n            if (i === j) continue;\n            var dx = points[j][0] - points[i][0];\n            var dy = points[j][1] - points[i][1];\n            var g = gcd(Math.abs(dx), Math.abs(dy));\n            if (g === 0) g = 1;\n            dx = dx / g;\n            dy = dy / g;\n            if (dx < 0 || (dx === 0 && dy < 0)) { dx = -dx; dy = -dy; }\n            var key = dx + "/" + dy;\n            slopes[key] = (slopes[key] === undefined ? 0 : slopes[key]) + 1;\n            if (slopes[key] + 1 > best) best = slopes[key] + 1;\n        }\n    }\n    return best;\n}`,
        java: `public static int maxPoints(int[][] points) {\n    int n = points.length;\n    if (n <= 2) return n;\n    int best = 1;\n    for (int i = 0; i < n; i++) {\n        Map<String, Integer> slopes = new HashMap<>();\n        for (int j = 0; j < n; j++) {\n            if (i == j) continue;\n            int dx = points[j][0] - points[i][0];\n            int dy = points[j][1] - points[i][1];\n            int g = gcdPoints(Math.abs(dx), Math.abs(dy));\n            if (g == 0) g = 1;\n            dx /= g;\n            dy /= g;\n            if (dx < 0 || (dx == 0 && dy < 0)) { dx = -dx; dy = -dy; }\n            String key = dx + "/" + dy;\n            int c = slopes.getOrDefault(key, 0) + 1;\n            slopes.put(key, c);\n            if (c + 1 > best) best = c + 1;\n        }\n    }\n    return best;\n}\n\nstatic int gcdPoints(int a, int b) {\n    while (b != 0) { int t = a % b; a = b; b = t; }\n    return a;\n}`,
        cpp: `static int gcdPoints(int a, int b) {\n    while (b != 0) { int t = a % b; a = b; b = t; }\n    return a;\n}\n\nint maxPoints(vector<vector<int>>& points) {\n    int n = (int) points.size();\n    if (n <= 2) return n;\n    int best = 1;\n    for (int i = 0; i < n; i++) {\n        map<pair<int, int>, int> slopes;\n        for (int j = 0; j < n; j++) {\n            if (i == j) continue;\n            int dx = points[j][0] - points[i][0];\n            int dy = points[j][1] - points[i][1];\n            int g = gcdPoints(abs(dx), abs(dy));\n            if (g == 0) g = 1;\n            dx /= g;\n            dy /= g;\n            if (dx < 0 || (dx == 0 && dy < 0)) { dx = -dx; dy = -dy; }\n            int c = ++slopes[{ dx, dy }];\n            if (c + 1 > best) best = c + 1;\n        }\n    }\n    return best;\n}`,
        c: `static int gcdPointsC(int a, int b) {\n    while (b != 0) { int t = a % b; a = b; b = t; }\n    return a;\n}\n\nint maxPoints(int** points, int pointsSize, int* pointsColSize) {\n    int n = pointsSize;\n    if (n <= 2) return n;\n    int best = 1;\n    int* dxs = (int*) malloc((size_t) n * sizeof(int));\n    int* dys = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) {\n        int m = 0;\n        for (int j = 0; j < n; j++) {\n            if (i == j) continue;\n            int dx = points[j][0] - points[i][0];\n            int dy = points[j][1] - points[i][1];\n            int g = gcdPointsC(dx < 0 ? -dx : dx, dy < 0 ? -dy : dy);\n            if (g == 0) g = 1;\n            dx /= g;\n            dy /= g;\n            if (dx < 0 || (dx == 0 && dy < 0)) { dx = -dx; dy = -dy; }\n            dxs[m] = dx;\n            dys[m] = dy;\n            m++;\n        }\n        for (int a = 0; a < m; a++) {\n            int c = 1;\n            for (int b = 0; b < a; b++) {\n                if (dxs[a] == dxs[b] && dys[a] == dys[b]) c++;\n            }\n            if (c + 1 > best) best = c + 1;\n        }\n    }\n    free(dxs);\n    free(dys);\n    return best;\n}`,
        csharp: `public static int MaxPoints(int[][] points)\n{\n    int n = points.Length;\n    if (n <= 2) return n;\n    int best = 1;\n    for (int i = 0; i < n; i++)\n    {\n        var slopes = new Dictionary<string, int>();\n        for (int j = 0; j < n; j++)\n        {\n            if (i == j) continue;\n            int dx = points[j][0] - points[i][0];\n            int dy = points[j][1] - points[i][1];\n            int a = Math.Abs(dx), b = Math.Abs(dy);\n            while (b != 0) { int t = a % b; a = b; b = t; }\n            if (a == 0) a = 1;\n            dx /= a;\n            dy /= a;\n            if (dx < 0 || (dx == 0 && dy < 0)) { dx = -dx; dy = -dy; }\n            string key = dx + "/" + dy;\n            int c;\n            c = (slopes.TryGetValue(key, out c) ? c : 0) + 1;\n            slopes[key] = c;\n            if (c + 1 > best) best = c + 1;\n        }\n    }\n    return best;\n}`,
        go: `func maxPoints(points [][]int) int {\n\tn := len(points)\n\tif n <= 2 {\n\t\treturn n\n\t}\n\tgcd := func(a, b int) int {\n\t\tfor b != 0 {\n\t\t\ta, b = b, a%b\n\t\t}\n\t\treturn a\n\t}\n\ttype dir struct{ dx, dy int }\n\tbest := 1\n\tfor i := 0; i < n; i++ {\n\t\tslopes := map[dir]int{}\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif i == j {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tdx := points[j][0] - points[i][0]\n\t\t\tdy := points[j][1] - points[i][1]\n\t\t\tax, ay := dx, dy\n\t\t\tif ax < 0 {\n\t\t\t\tax = -ax\n\t\t\t}\n\t\t\tif ay < 0 {\n\t\t\t\tay = -ay\n\t\t\t}\n\t\t\tg := gcd(ax, ay)\n\t\t\tif g == 0 {\n\t\t\t\tg = 1\n\t\t\t}\n\t\t\tdx /= g\n\t\t\tdy /= g\n\t\t\tif dx < 0 || (dx == 0 && dy < 0) {\n\t\t\t\tdx, dy = -dx, -dy\n\t\t\t}\n\t\t\tslopes[dir{dx, dy}]++\n\t\t\tif slopes[dir{dx, dy}]+1 > best {\n\t\t\t\tbest = slopes[dir{dx, dy}] + 1\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun maxPoints(points: Array<IntArray>): Int {\n    val n = points.size\n    if (n <= 2) return n\n    fun gcd(x: Int, y: Int): Int {\n        var a = x\n        var b = y\n        while (b != 0) {\n            val t = a % b\n            a = b\n            b = t\n        }\n        return a\n    }\n    var best = 1\n    for (i in 0 until n) {\n        val slopes = HashMap<String, Int>()\n        for (j in 0 until n) {\n            if (i == j) continue\n            var dx = points[j][0] - points[i][0]\n            var dy = points[j][1] - points[i][1]\n            var g = gcd(Math.abs(dx), Math.abs(dy))\n            if (g == 0) g = 1\n            dx /= g\n            dy /= g\n            if (dx < 0 || (dx == 0 && dy < 0)) {\n                dx = -dx\n                dy = -dy\n            }\n            val key = "" + dx + "/" + dy\n            val c = (slopes[key] ?: 0) + 1\n            slopes[key] = c\n            if (c + 1 > best) best = c + 1\n        }\n    }\n    return best\n}`,
        swift: `func maxPoints(_ points: [[Int]]) -> Int {\n    let n = points.count\n    if n <= 2 { return n }\n    func gcd(_ x: Int, _ y: Int) -> Int {\n        var a = x\n        var b = y\n        while b != 0 {\n            let t = a % b\n            a = b\n            b = t\n        }\n        return a\n    }\n    var best = 1\n    for i in 0..<n {\n        var slopes: [String: Int] = [:]\n        for j in 0..<n {\n            if i == j { continue }\n            var dx = points[j][0] - points[i][0]\n            var dy = points[j][1] - points[i][1]\n            var g = gcd(abs(dx), abs(dy))\n            if g == 0 { g = 1 }\n            dx /= g\n            dy /= g\n            if dx < 0 || (dx == 0 && dy < 0) {\n                dx = -dx\n                dy = -dy\n            }\n            let key = "\\(dx)/\\(dy)"\n            let c = (slopes[key] ?? 0) + 1\n            slopes[key] = c\n            if c + 1 > best { best = c + 1 }\n        }\n    }\n    return best\n}`,
        rust: `fn maxPoints(points: Vec<Vec<i32>>) -> i32 {\n    let n = points.len();\n    if n <= 2 {\n        return n as i32;\n    }\n    fn gcd(mut a: i32, mut b: i32) -> i32 {\n        while b != 0 {\n            let t = a % b;\n            a = b;\n            b = t;\n        }\n        a\n    }\n    let mut best = 1i32;\n    for i in 0..n {\n        let mut slopes: std::collections::HashMap<(i32, i32), i32> = std::collections::HashMap::new();\n        for j in 0..n {\n            if i == j {\n                continue;\n            }\n            let mut dx = points[j][0] - points[i][0];\n            let mut dy = points[j][1] - points[i][1];\n            let mut g = gcd(dx.abs(), dy.abs());\n            if g == 0 {\n                g = 1;\n            }\n            dx /= g;\n            dy /= g;\n            if dx < 0 || (dx == 0 && dy < 0) {\n                dx = -dx;\n                dy = -dy;\n            }\n            let e = slopes.entry((dx, dy)).or_insert(0);\n            *e += 1;\n            if *e + 1 > best {\n                best = *e + 1;\n            }\n        }\n    }\n    best\n}`,
        php: `function maxPoints($points) {\n    $n = count($points);\n    if ($n <= 2) return $n;\n    $gcd = function($a, $b) {\n        while ($b != 0) { $t = $a % $b; $a = $b; $b = $t; }\n        return $a;\n    };\n    $best = 1;\n    for ($i = 0; $i < $n; $i++) {\n        $slopes = array();\n        for ($j = 0; $j < $n; $j++) {\n            if ($i === $j) continue;\n            $dx = $points[$j][0] - $points[$i][0];\n            $dy = $points[$j][1] - $points[$i][1];\n            $g = $gcd(abs($dx), abs($dy));\n            if ($g === 0) $g = 1;\n            $dx = intdiv($dx, $g);\n            $dy = intdiv($dy, $g);\n            if ($dx < 0 || ($dx === 0 && $dy < 0)) { $dx = -$dx; $dy = -$dy; }\n            $key = $dx . "/" . $dy;\n            $c = (isset($slopes[$key]) ? $slopes[$key] : 0) + 1;\n            $slopes[$key] = $c;\n            if ($c + 1 > $best) $best = $c + 1;\n        }\n    }\n    return $best;\n}`,
        ruby: `def maxPoints(points)\n  n = points.length\n  return n if n <= 2\n  best = 1\n  (0...n).each do |i|\n    slopes = Hash.new(0)\n    (0...n).each do |j|\n      next if i == j\n      dx = points[j][0] - points[i][0]\n      dy = points[j][1] - points[i][1]\n      g = dx.abs.gcd(dy.abs)\n      g = 1 if g == 0\n      dx /= g\n      dy /= g\n      if dx < 0 || (dx == 0 && dy < 0)\n        dx = -dx\n        dy = -dy\n      end\n      slopes[[dx, dy]] += 1\n      best = slopes[[dx, dy]] + 1 if slopes[[dx, dy]] + 1 > best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Substring with Concatenation of All Words (LC 30) ───────────
  (() => {
    const ref = (s: string, words: string[]) => {
      const out: number[] = [];
      const k = words.length;
      if (k === 0) return out;
      const w = words[0].length;
      const total = k * w;
      if (s.length < total) return out;
      const need: Record<string, number> = {};
      for (const word of words) need[word] = (need[word] === undefined ? 0 : need[word]) + 1;
      for (let start = 0; start + total <= s.length; start++) {
        const have: Record<string, number> = {};
        let ok = true;
        for (let t = 0; t < k; t++) {
          const piece = s.substr(start + t * w, w);
          if (need[piece] === undefined) { ok = false; break; }
          have[piece] = (have[piece] === undefined ? 0 : have[piece]) + 1;
          if (have[piece] > need[piece]) { ok = false; break; }
        }
        if (ok) out.push(start);
      }
      return out;
    };
    return {
      slug: "substring-with-concatenation-of-all-words",
      title: "Substring with Concatenation of All Words",
      difficulty: "HARD" as const,
      tags: ["Hash Table", "String", "Sliding Window", "Amazon", "Google", "Meta"],
      signature: { funcName: "findSubstring", params: [{ name: "s", type: "string" as const }, { name: "words", type: "string[]" as const }], returns: "int[]" as const },
      description: describe(
        "All strings in `words` have the **same length**. A **concatenated substring** of `s` is a substring made by joining every word of `words` exactly once, in any order and with nothing in between.\n\nReturn the starting indices of all concatenated substrings, in increasing order.",
        [
          { in: 's = "barfoothefoobarman", words = ["foo","bar"]', out: "[0,9]", note: '"barfoo" starts at 0 and "foobar" at 9.' },
          { in: 's = "wordgoodgoodgoodbestword", words = ["word","good","best","word"]', out: "[]", note: "No window holds two words and one each of good and best." },
          { in: 's = "barfoofoobarthefoobarman", words = ["bar","foo","the"]', out: "[6,9,12]" },
        ],
        ["1 <= s.length <= 10000", "1 <= words.length <= 5000", "1 <= words[i].length <= 30", "All words have the same length.", "s and words[i] consist of lowercase English letters."]),
      hints: [
        "Every word is the same length `w`, so a valid window is exactly `words.length * w` characters and splits cleanly into `w`-sized pieces.",
        "Build a multiset (count map) of the required words.",
        "For each start index, chop the window into pieces and check the counts match — bail out the moment a piece is unknown or over-used.",
      ],
      editorial: explain({
        idea: "Equal word lengths make the window's decomposition unique: slice it into `w`-character pieces and compare the resulting multiset against the required one.",
        steps: [
          "Tally the required words into `need`.",
          "The window length is `k * w`; slide `start` over every position where a full window fits.",
          "Walk the window in `w`-sized steps, tallying pieces into `have`; abandon the window as soon as a piece is not in `need` or exceeds its required count.",
          "Record `start` when all `k` pieces pass.",
        ],
        why: "Because the concatenation uses each word exactly once and all words are the same length, a window is valid precisely when its piece multiset equals `need` — and checking 'no piece over its quota' across exactly `k` pieces is equivalent to multiset equality.",
        time: "O(n · k)",
        space: "O(total word length)",
        pitfalls: [
          "Using a set rather than a count map accepts a window that repeats one word and omits another.",
          "Checking `have[piece] > need[piece]` is what lets the early exit be correct — without it, a duplicate slips through.",
          "The `O(n · w)` refinement runs `w` sliding windows, one per offset class, instead of restarting at each index.",
        ],
      }),
      examples: [
        { input: '"barfoothefoobarman"\n["foo","bar"]', expectedOutput: "[0,9]" },
        { input: '"wordgoodgoodgoodbestword"\n["word","good","best","word"]', expectedOutput: "[]" },
        { input: '"barfoofoobarthefoobarman"\n["bar","foo","the"]', expectedOutput: "[6,9,12]" },
      ],
      gen: (rng: Rng) => {
        const w = ri(rng, 1, 3);
        const k = ri(rng, 1, 3);
        const pool = Array.from({ length: ri(rng, 1, 3) }, () => randLower(rng, w, w, "abc"));
        const words = Array.from({ length: k }, () => pick(rng, pool));
        let s = "";
        const pieces = ri(rng, 1, 8);
        for (let t = 0; t < pieces; t++) {
          s += rng() < 0.6 ? pick(rng, pool) : randLower(rng, w, w, "abc");
        }
        return { input: `"${s}"\n${fmtStrArr(words)}`, expectedOutput: fmtIntArr(ref(s, words)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findSubstring(s: str, words: List[str]) -> List[int]:\n    k = len(words)\n    w = len(words[0])\n    total = k * w\n    need = {}\n    for word in words:\n        need[word] = need.get(word, 0) + 1\n    out = []\n    for start in range(0, len(s) - total + 1):\n        have = {}\n        ok = True\n        for t in range(k):\n            piece = s[start + t * w: start + (t + 1) * w]\n            if piece not in need:\n                ok = False\n                break\n            have[piece] = have.get(piece, 0) + 1\n            if have[piece] > need[piece]:\n                ok = False\n                break\n        if ok:\n            out.append(start)\n    return out`,
        javascript: `var findSubstring = function(s, words) {\n    var out = [];\n    var k = words.length;\n    if (k === 0) return out;\n    var w = words[0].length;\n    var total = k * w;\n    if (s.length < total) return out;\n    var need = {};\n    for (var i = 0; i < k; i++) {\n        need[words[i]] = (need[words[i]] === undefined ? 0 : need[words[i]]) + 1;\n    }\n    for (var start = 0; start + total <= s.length; start++) {\n        var have = {}, ok = true;\n        for (var t = 0; t < k; t++) {\n            var piece = s.substr(start + t * w, w);\n            if (need[piece] === undefined) { ok = false; break; }\n            have[piece] = (have[piece] === undefined ? 0 : have[piece]) + 1;\n            if (have[piece] > need[piece]) { ok = false; break; }\n        }\n        if (ok) out.push(start);\n    }\n    return out;\n};`,
        typescript: `function findSubstring(s: string, words: string[]): number[] {\n    var out: number[] = [];\n    var k = words.length;\n    if (k === 0) return out;\n    var w = words[0].length;\n    var total = k * w;\n    if (s.length < total) return out;\n    var need: { [key: string]: number } = {};\n    for (var i = 0; i < k; i++) {\n        need[words[i]] = (need[words[i]] === undefined ? 0 : need[words[i]]) + 1;\n    }\n    for (var start = 0; start + total <= s.length; start++) {\n        var have: { [key: string]: number } = {}, ok = true;\n        for (var t = 0; t < k; t++) {\n            var piece = s.substr(start + t * w, w);\n            if (need[piece] === undefined) { ok = false; break; }\n            have[piece] = (have[piece] === undefined ? 0 : have[piece]) + 1;\n            if (have[piece] > need[piece]) { ok = false; break; }\n        }\n        if (ok) out.push(start);\n    }\n    return out;\n}`,
        java: `public static int[] findSubstring(String s, String[] words) {\n    List<Integer> out = new ArrayList<>();\n    int k = words.length;\n    int w = words[0].length();\n    int total = k * w;\n    if (s.length() < total) return new int[0];\n    Map<String, Integer> need = new HashMap<>();\n    for (String word : words) need.put(word, need.getOrDefault(word, 0) + 1);\n    for (int start = 0; start + total <= s.length(); start++) {\n        Map<String, Integer> have = new HashMap<>();\n        boolean ok = true;\n        for (int t = 0; t < k; t++) {\n            String piece = s.substring(start + t * w, start + (t + 1) * w);\n            Integer req = need.get(piece);\n            if (req == null) { ok = false; break; }\n            int c = have.getOrDefault(piece, 0) + 1;\n            have.put(piece, c);\n            if (c > req) { ok = false; break; }\n        }\n        if (ok) out.add(start);\n    }\n    int[] res = new int[out.size()];\n    for (int i = 0; i < out.size(); i++) res[i] = out.get(i);\n    return res;\n}`,
        cpp: `vector<int> findSubstring(string s, vector<string>& words) {\n    vector<int> out;\n    int k = (int) words.size();\n    int w = (int) words[0].size();\n    int total = k * w;\n    if ((int) s.size() < total) return out;\n    unordered_map<string, int> need;\n    for (const string& word : words) need[word]++;\n    for (int start = 0; start + total <= (int) s.size(); start++) {\n        unordered_map<string, int> have;\n        bool ok = true;\n        for (int t = 0; t < k; t++) {\n            string piece = s.substr(start + t * w, w);\n            auto it = need.find(piece);\n            if (it == need.end()) { ok = false; break; }\n            int c = ++have[piece];\n            if (c > it->second) { ok = false; break; }\n        }\n        if (ok) out.push_back(start);\n    }\n    return out;\n}`,
        c: `int* findSubstring(char* s, char** words, int wordsSize, int* returnSize) {\n    int n = (int) strlen(s);\n    int k = wordsSize;\n    int w = (int) strlen(words[0]);\n    int total = k * w;\n    int* out = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    int m = 0;\n    int* used = (int*) malloc((size_t) k * sizeof(int));\n    for (int start = 0; start + total <= n; start++) {\n        for (int i = 0; i < k; i++) used[i] = 0;\n        int ok = 1;\n        for (int t = 0; t < k && ok; t++) {\n            int found = 0;\n            for (int i = 0; i < k; i++) {\n                if (used[i]) continue;\n                if (strncmp(words[i], s + start + t * w, (size_t) w) == 0) { used[i] = 1; found = 1; break; }\n            }\n            if (!found) ok = 0;\n        }\n        if (ok) out[m++] = start;\n    }\n    free(used);\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static int[] FindSubstring(string s, string[] words)\n{\n    var out_ = new List<int>();\n    int k = words.Length;\n    int w = words[0].Length;\n    int total = k * w;\n    if (s.Length < total) return new int[0];\n    var need = new Dictionary<string, int>();\n    foreach (string word in words)\n    {\n        int c;\n        need[word] = (need.TryGetValue(word, out c) ? c : 0) + 1;\n    }\n    for (int start = 0; start + total <= s.Length; start++)\n    {\n        var have = new Dictionary<string, int>();\n        bool ok = true;\n        for (int t = 0; t < k; t++)\n        {\n            string piece = s.Substring(start + t * w, w);\n            int req;\n            if (!need.TryGetValue(piece, out req)) { ok = false; break; }\n            int c;\n            c = (have.TryGetValue(piece, out c) ? c : 0) + 1;\n            have[piece] = c;\n            if (c > req) { ok = false; break; }\n        }\n        if (ok) out_.Add(start);\n    }\n    return out_.ToArray();\n}`,
        go: `func findSubstring(s string, words []string) []int {\n\tout := []int{}\n\tk := len(words)\n\tw := len(words[0])\n\ttotal := k * w\n\tif len(s) < total {\n\t\treturn out\n\t}\n\tneed := map[string]int{}\n\tfor _, word := range words {\n\t\tneed[word]++\n\t}\n\tfor start := 0; start+total <= len(s); start++ {\n\t\thave := map[string]int{}\n\t\tok := true\n\t\tfor t := 0; t < k; t++ {\n\t\t\tpiece := s[start+t*w : start+(t+1)*w]\n\t\t\treq, exists := need[piece]\n\t\t\tif !exists {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t\thave[piece]++\n\t\t\tif have[piece] > req {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tif ok {\n\t\t\tout = append(out, start)\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun findSubstring(s: String, words: Array<String>): IntArray {\n    val out = ArrayList<Int>()\n    val k = words.size\n    val w = words[0].length\n    val total = k * w\n    if (s.length < total) return IntArray(0)\n    val need = HashMap<String, Int>()\n    for (word in words) need[word] = (need[word] ?: 0) + 1\n    var start = 0\n    while (start + total <= s.length) {\n        val have = HashMap<String, Int>()\n        var ok = true\n        for (t in 0 until k) {\n            val piece = s.substring(start + t * w, start + (t + 1) * w)\n            val req = need[piece]\n            if (req == null) {\n                ok = false\n                break\n            }\n            val c = (have[piece] ?: 0) + 1\n            have[piece] = c\n            if (c > req) {\n                ok = false\n                break\n            }\n        }\n        if (ok) out.add(start)\n        start++\n    }\n    return out.toIntArray()\n}`,
        swift: `func findSubstring(_ s: String, _ words: [String]) -> [Int] {\n    let a = Array(s)\n    let k = words.count\n    let w = words[0].count\n    let total = k * w\n    var out: [Int] = []\n    if a.count < total { return out }\n    var need: [String: Int] = [:]\n    for word in words { need[word] = (need[word] ?? 0) + 1 }\n    var start = 0\n    while start + total <= a.count {\n        var have: [String: Int] = [:]\n        var ok = true\n        for t in 0..<k {\n            let piece = String(a[(start + t * w)..<(start + (t + 1) * w)])\n            guard let req = need[piece] else {\n                ok = false\n                break\n            }\n            let c = (have[piece] ?? 0) + 1\n            have[piece] = c\n            if c > req {\n                ok = false\n                break\n            }\n        }\n        if ok { out.append(start) }\n        start += 1\n    }\n    return out\n}`,
        rust: `fn findSubstring(s: String, words: Vec<String>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    let k = words.len();\n    let w = words[0].len();\n    let total = k * w;\n    if s.len() < total {\n        return out;\n    }\n    let mut need: std::collections::HashMap<String, i32> = std::collections::HashMap::new();\n    for word in words.iter() {\n        *need.entry(word.clone()).or_insert(0) += 1;\n    }\n    let b = s.as_bytes();\n    let mut start = 0usize;\n    while start + total <= b.len() {\n        let mut have: std::collections::HashMap<String, i32> = std::collections::HashMap::new();\n        let mut ok = true;\n        for t in 0..k {\n            let piece = String::from_utf8(b[start + t * w..start + (t + 1) * w].to_vec()).unwrap();\n            match need.get(&piece) {\n                None => {\n                    ok = false;\n                    break;\n                }\n                Some(&req) => {\n                    let c = have.entry(piece).or_insert(0);\n                    *c += 1;\n                    if *c > req {\n                        ok = false;\n                        break;\n                    }\n                }\n            }\n        }\n        if ok {\n            out.push(start as i32);\n        }\n        start += 1;\n    }\n    out\n}`,
        php: `function findSubstring($s, $words) {\n    $out = array();\n    $k = count($words);\n    $w = strlen($words[0]);\n    $total = $k * $w;\n    $n = strlen($s);\n    if ($n < $total) return $out;\n    $need = array();\n    foreach ($words as $word) {\n        $need[$word] = isset($need[$word]) ? $need[$word] + 1 : 1;\n    }\n    for ($start = 0; $start + $total <= $n; $start++) {\n        $have = array();\n        $ok = true;\n        for ($t = 0; $t < $k; $t++) {\n            $piece = substr($s, $start + $t * $w, $w);\n            if (!isset($need[$piece])) { $ok = false; break; }\n            $have[$piece] = isset($have[$piece]) ? $have[$piece] + 1 : 1;\n            if ($have[$piece] > $need[$piece]) { $ok = false; break; }\n        }\n        if ($ok) $out[] = $start;\n    }\n    return $out;\n}`,
        ruby: `def findSubstring(s, words)\n  out = []\n  k = words.length\n  w = words[0].length\n  total = k * w\n  return out if s.length < total\n  need = Hash.new(0)\n  words.each { |word| need[word] += 1 }\n  (0..(s.length - total)).each do |start|\n    have = Hash.new(0)\n    ok = true\n    (0...k).each do |t|\n      piece = s[start + t * w, w]\n      unless need.key?(piece)\n        ok = false\n        break\n      end\n      have[piece] += 1\n      if have[piece] > need[piece]\n        ok = false\n        break\n      end\n    end\n    out << start if ok\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Count of Range Sum (LC 327) ─────────────────────────────────
  (() => {
    const ref = (nums: number[], lower: number, upper: number) => {
      const n = nums.length;
      const P: number[] = [0];
      for (let i = 0; i < n; i++) P.push(P[i] + nums[i]);
      const sorted = P.slice().sort((a, b) => a - b);
      const uniq: number[] = [];
      for (let i = 0; i < sorted.length; i++) {
        if (i === 0 || sorted[i] !== sorted[i - 1]) uniq.push(sorted[i]);
      }
      const m = uniq.length;
      const bit = new Array(m + 1).fill(0);
      const add = (pos: number) => { for (let p = pos; p <= m; p += p & -p) bit[p]++; };
      const pref = (pos: number) => { let s = 0; for (let p = pos; p > 0; p -= p & -p) s += bit[p]; return s; };
      const lowerBound = (v: number) => {
        let lo = 0, hi = m;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (uniq[mid] < v) lo = mid + 1; else hi = mid; }
        return lo;
      };
      const upperBound = (v: number) => {
        let lo = 0, hi = m;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (uniq[mid] <= v) lo = mid + 1; else hi = mid; }
        return lo;
      };
      let total = 0;
      add(lowerBound(P[0]) + 1);
      for (let j = 1; j <= n; j++) {
        total += pref(upperBound(P[j] - lower)) - pref(lowerBound(P[j] - upper));
        add(lowerBound(P[j]) + 1);
      }
      return total;
    };
    return {
      slug: "count-of-range-sum",
      title: "Count of Range Sum",
      difficulty: "HARD" as const,
      tags: ["Fenwick Tree", "Divide and Conquer", "Prefix Sum", "Google", "Amazon", "Meta"],
      signature: { funcName: "countRangeSum", params: [{ name: "nums", type: "int[]" as const }, { name: "lower", type: "int" as const }, { name: "upper", type: "int" as const }], returns: "int" as const },
      description: describe(
        "The **range sum** `S(i, j)` is the sum of `nums[i..j]` for `i <= j`.\n\nGiven `nums` and two integers `lower` and `upper`, return the number of index pairs `(i, j)` for which `S(i, j)` lies in `[lower, upper]` inclusive.",
        [
          { in: "nums = [-2,5,-1], lower = -2, upper = 2", out: "3", note: "The qualifying ranges are [0,0], [2,2] and [0,2], summing to -2, -1 and 2." },
          { in: "nums = [0], lower = 0, upper = 0", out: "1" },
          { in: "nums = [1,2,3], lower = 10, upper = 20", out: "0" },
        ],
        ["1 <= nums.length <= 10000", "-10000 <= nums[i] <= 10000", "-100000000 <= lower <= upper <= 100000000"]),
      hints: [
        "Write the range sum as a difference of prefix sums: `S(i, j) = P[j+1] - P[i]`.",
        "For a fixed right end `j`, you need the number of earlier prefixes `P[i]` in the window `[P[j+1] - upper, P[j+1] - lower]`.",
        "That is a dynamic order-statistics query — a Fenwick tree over the compressed prefix values answers it in `log n`.",
      ],
      editorial: explain({
        idea: "Turn range sums into prefix-sum differences, then sweep left to right asking a counting question about the prefixes already seen. Coordinate compression puts the (possibly huge) prefix values into a Fenwick tree's index space.",
        steps: [
          "Build the prefix array `P` of length `n + 1` with `P[0] = 0`.",
          "Sort and deduplicate `P` to get the compression table `uniq`.",
          "Insert `P[0]` into a Fenwick tree over `uniq`'s ranks.",
          "For `j` from `1` to `n`: count the inserted prefixes in `[P[j] - upper, P[j] - lower]` using two binary searches into `uniq` and two Fenwick prefix queries, then insert `P[j]`.",
        ],
        why: "`P[j] - P[i]` lies in `[lower, upper]` exactly when `P[i]` lies in `[P[j] - upper, P[j] - lower]`. Processing `j` in increasing order means the tree holds precisely the valid left endpoints `i < j`, so each qualifying pair is counted once at its right end.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "The query bounds `P[j] - upper` and `P[j] - lower` may not appear in `uniq`, so the binary searches must be a strict lower bound and a non-strict upper bound rather than exact lookups.",
          "A Fenwick tree is 1-indexed; adding 1 to the rank is mandatory or the update loop never terminates.",
          "Prefix sums and the shifted bounds exceed 32 bits once `n` and the values grow — accumulate in 64 bits.",
          "Merge sort over the prefix array is the other standard solution with the same complexity.",
        ],
      }),
      examples: [
        { input: "[-2,5,-1]\n-2\n2", expectedOutput: "3" },
        { input: "[0]\n0\n0", expectedOutput: "1" },
        { input: "[1,2,3]\n10\n20", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 50);
        const hi = rng() < 0.5 ? 6 : 10000;
        const nums = Array.from({ length: n }, () => ri(rng, -hi, hi));
        const a = ri(rng, -2 * hi, 2 * hi);
        const b = ri(rng, -2 * hi, 2 * hi);
        const lower = Math.min(a, b);
        const upper = Math.max(a, b);
        return { input: `${fmtIntArr(nums)}\n${lower}\n${upper}`, expectedOutput: String(ref(nums, lower, upper)) };
      },
      solutions: {
        python: `from bisect import bisect_left, bisect_right\nfrom typing import List\n\ndef countRangeSum(nums: List[int], lower: int, upper: int) -> int:\n    n = len(nums)\n    P = [0] * (n + 1)\n    for i in range(n):\n        P[i + 1] = P[i] + nums[i]\n    uniq = sorted(set(P))\n    m = len(uniq)\n    bit = [0] * (m + 1)\n\n    def add(pos: int) -> None:\n        while pos <= m:\n            bit[pos] += 1\n            pos += pos & -pos\n\n    def pref(pos: int) -> int:\n        s = 0\n        while pos > 0:\n            s += bit[pos]\n            pos -= pos & -pos\n        return s\n\n    total = 0\n    add(bisect_left(uniq, P[0]) + 1)\n    for j in range(1, n + 1):\n        total += pref(bisect_right(uniq, P[j] - lower)) - pref(bisect_left(uniq, P[j] - upper))\n        add(bisect_left(uniq, P[j]) + 1)\n    return total`,
        javascript: `var countRangeSum = function(nums, lower, upper) {\n    var n = nums.length;\n    var P = [0];\n    for (var i = 0; i < n; i++) P.push(P[i] + nums[i]);\n    var sorted = P.slice().sort(function(a, b) { return a - b; });\n    var uniq = [];\n    for (var t = 0; t < sorted.length; t++) {\n        if (t === 0 || sorted[t] !== sorted[t - 1]) uniq.push(sorted[t]);\n    }\n    var m = uniq.length;\n    var bit = [];\n    for (var u = 0; u <= m; u++) bit.push(0);\n    var add = function(pos) { for (var p = pos; p <= m; p += p & -p) bit[p]++; };\n    var pref = function(pos) { var s = 0; for (var p = pos; p > 0; p -= p & -p) s += bit[p]; return s; };\n    var lowerBound = function(v) {\n        var lo = 0, hi = m;\n        while (lo < hi) { var mid = (lo + hi) >> 1; if (uniq[mid] < v) lo = mid + 1; else hi = mid; }\n        return lo;\n    };\n    var upperBound = function(v) {\n        var lo = 0, hi = m;\n        while (lo < hi) { var mid = (lo + hi) >> 1; if (uniq[mid] <= v) lo = mid + 1; else hi = mid; }\n        return lo;\n    };\n    var total = 0;\n    add(lowerBound(P[0]) + 1);\n    for (var j = 1; j <= n; j++) {\n        total += pref(upperBound(P[j] - lower)) - pref(lowerBound(P[j] - upper));\n        add(lowerBound(P[j]) + 1);\n    }\n    return total;\n};`,
        typescript: `function countRangeSum(nums: number[], lower: number, upper: number): number {\n    var n = nums.length;\n    var P: number[] = [0];\n    for (var i = 0; i < n; i++) P.push(P[i] + nums[i]);\n    var sorted = P.slice().sort(function(a, b) { return a - b; });\n    var uniq: number[] = [];\n    for (var t = 0; t < sorted.length; t++) {\n        if (t === 0 || sorted[t] !== sorted[t - 1]) uniq.push(sorted[t]);\n    }\n    var m = uniq.length;\n    var bit: number[] = [];\n    for (var u = 0; u <= m; u++) bit.push(0);\n    var add = function(pos: number) { for (var p = pos; p <= m; p += p & -p) bit[p]++; };\n    var pref = function(pos: number) { var s = 0; for (var p = pos; p > 0; p -= p & -p) s += bit[p]; return s; };\n    var lowerBound = function(v: number) {\n        var lo = 0, hi = m;\n        while (lo < hi) { var mid = (lo + hi) >> 1; if (uniq[mid] < v) lo = mid + 1; else hi = mid; }\n        return lo;\n    };\n    var upperBound = function(v: number) {\n        var lo = 0, hi = m;\n        while (lo < hi) { var mid = (lo + hi) >> 1; if (uniq[mid] <= v) lo = mid + 1; else hi = mid; }\n        return lo;\n    };\n    var total = 0;\n    add(lowerBound(P[0]) + 1);\n    for (var j = 1; j <= n; j++) {\n        total += pref(upperBound(P[j] - lower)) - pref(lowerBound(P[j] - upper));\n        add(lowerBound(P[j]) + 1);\n    }\n    return total;\n}`,
        java: `public static int countRangeSum(int[] nums, int lower, int upper) {\n    int n = nums.length;\n    long[] P = new long[n + 1];\n    for (int i = 0; i < n; i++) P[i + 1] = P[i] + nums[i];\n    long[] uniq = P.clone();\n    Arrays.sort(uniq);\n    int m = 0;\n    for (int i = 0; i < uniq.length; i++) {\n        if (i == 0 || uniq[i] != uniq[i - 1]) uniq[m++] = uniq[i];\n    }\n    int[] bit = new int[m + 1];\n    int total = 0;\n    addRange(bit, m, lowerBoundLong(uniq, m, P[0]) + 1);\n    for (int j = 1; j <= n; j++) {\n        total += prefRange(bit, upperBoundLong(uniq, m, P[j] - lower)) - prefRange(bit, lowerBoundLong(uniq, m, P[j] - upper));\n        addRange(bit, m, lowerBoundLong(uniq, m, P[j]) + 1);\n    }\n    return total;\n}\n\nstatic void addRange(int[] bit, int m, int pos) {\n    for (int p = pos; p <= m; p += p & -p) bit[p]++;\n}\n\nstatic int prefRange(int[] bit, int pos) {\n    int s = 0;\n    for (int p = pos; p > 0; p -= p & -p) s += bit[p];\n    return s;\n}\n\nstatic int lowerBoundLong(long[] a, int m, long v) {\n    int lo = 0, hi = m;\n    while (lo < hi) {\n        int mid = (lo + hi) >>> 1;\n        if (a[mid] < v) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}\n\nstatic int upperBoundLong(long[] a, int m, long v) {\n    int lo = 0, hi = m;\n    while (lo < hi) {\n        int mid = (lo + hi) >>> 1;\n        if (a[mid] <= v) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}`,
        cpp: `int countRangeSum(vector<int>& nums, int lower, int upper) {\n    int n = (int) nums.size();\n    vector<long long> P(n + 1, 0);\n    for (int i = 0; i < n; i++) P[i + 1] = P[i] + nums[i];\n    vector<long long> uniq = P;\n    sort(uniq.begin(), uniq.end());\n    uniq.erase(unique(uniq.begin(), uniq.end()), uniq.end());\n    int m = (int) uniq.size();\n    vector<int> bit(m + 1, 0);\n    auto add = [&](int pos) { for (int p = pos; p <= m; p += p & -p) bit[p]++; };\n    auto pref = [&](int pos) { int s = 0; for (int p = pos; p > 0; p -= p & -p) s += bit[p]; return s; };\n    int total = 0;\n    add((int) (lower_bound(uniq.begin(), uniq.end(), P[0]) - uniq.begin()) + 1);\n    for (int j = 1; j <= n; j++) {\n        int hiIdx = (int) (upper_bound(uniq.begin(), uniq.end(), P[j] - lower) - uniq.begin());\n        int loIdx = (int) (lower_bound(uniq.begin(), uniq.end(), P[j] - upper) - uniq.begin());\n        total += pref(hiIdx) - pref(loIdx);\n        add((int) (lower_bound(uniq.begin(), uniq.end(), P[j]) - uniq.begin()) + 1);\n    }\n    return total;\n}`,
        c: `static int cmpLL(const void* a, const void* b) {\n    long long x = *(const long long*) a;\n    long long y = *(const long long*) b;\n    return (x > y) - (x < y);\n}\n\nstatic int lowerBoundLL(long long* a, int m, long long v) {\n    int lo = 0, hi = m;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (a[mid] < v) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}\n\nstatic int upperBoundLL(long long* a, int m, long long v) {\n    int lo = 0, hi = m;\n    while (lo < hi) {\n        int mid = (lo + hi) / 2;\n        if (a[mid] <= v) lo = mid + 1;\n        else hi = mid;\n    }\n    return lo;\n}\n\nint countRangeSum(int* nums, int numsSize, int lower, int upper) {\n    int n = numsSize;\n    long long* P = (long long*) malloc((size_t) (n + 1) * sizeof(long long));\n    P[0] = 0;\n    for (int i = 0; i < n; i++) P[i + 1] = P[i] + nums[i];\n    long long* uniq = (long long*) malloc((size_t) (n + 1) * sizeof(long long));\n    for (int i = 0; i <= n; i++) uniq[i] = P[i];\n    qsort(uniq, (size_t) n + 1, sizeof(long long), cmpLL);\n    int m = 0;\n    for (int i = 0; i <= n; i++) {\n        if (i == 0 || uniq[i] != uniq[i - 1]) uniq[m++] = uniq[i];\n    }\n    int* bit = (int*) calloc((size_t) m + 1, sizeof(int));\n    int total = 0;\n    int start = lowerBoundLL(uniq, m, P[0]) + 1;\n    for (int p = start; p <= m; p += p & -p) bit[p]++;\n    for (int j = 1; j <= n; j++) {\n        int hiIdx = upperBoundLL(uniq, m, P[j] - lower);\n        int loIdx = lowerBoundLL(uniq, m, P[j] - upper);\n        int s1 = 0, s2 = 0;\n        for (int p = hiIdx; p > 0; p -= p & -p) s1 += bit[p];\n        for (int p = loIdx; p > 0; p -= p & -p) s2 += bit[p];\n        total += s1 - s2;\n        int pos = lowerBoundLL(uniq, m, P[j]) + 1;\n        for (int p = pos; p <= m; p += p & -p) bit[p]++;\n    }\n    free(P);\n    free(uniq);\n    free(bit);\n    return total;\n}`,
        csharp: `public static int CountRangeSum(int[] nums, int lower, int upper)\n{\n    int n = nums.Length;\n    long[] P = new long[n + 1];\n    for (int i = 0; i < n; i++) P[i + 1] = P[i] + nums[i];\n    long[] sortedP = (long[]) P.Clone();\n    Array.Sort(sortedP);\n    int m = 0;\n    long[] uniq = new long[sortedP.Length];\n    for (int i = 0; i < sortedP.Length; i++)\n    {\n        if (i == 0 || sortedP[i] != sortedP[i - 1]) uniq[m++] = sortedP[i];\n    }\n    int[] bit = new int[m + 1];\n    Action<int> add = pos => { for (int p = pos; p <= m; p += p & -p) bit[p]++; };\n    Func<int, int> pref = pos => { int s = 0; for (int p = pos; p > 0; p -= p & -p) s += bit[p]; return s; };\n    Func<long, int> lb = v =>\n    {\n        int lo = 0, hi = m;\n        while (lo < hi) { int mid = (lo + hi) / 2; if (uniq[mid] < v) lo = mid + 1; else hi = mid; }\n        return lo;\n    };\n    Func<long, int> ub = v =>\n    {\n        int lo = 0, hi = m;\n        while (lo < hi) { int mid = (lo + hi) / 2; if (uniq[mid] <= v) lo = mid + 1; else hi = mid; }\n        return lo;\n    };\n    int total = 0;\n    add(lb(P[0]) + 1);\n    for (int j = 1; j <= n; j++)\n    {\n        total += pref(ub(P[j] - lower)) - pref(lb(P[j] - upper));\n        add(lb(P[j]) + 1);\n    }\n    return total;\n}`,
        go: `func countRangeSum(nums []int, lower int, upper int) int {\n\tn := len(nums)\n\tP := make([]int, n+1)\n\tfor i := 0; i < n; i++ {\n\t\tP[i+1] = P[i] + nums[i]\n\t}\n\tsorted := append([]int{}, P...)\n\tsort.Ints(sorted)\n\tuniq := []int{}\n\tfor i, v := range sorted {\n\t\tif i == 0 || v != sorted[i-1] {\n\t\t\tuniq = append(uniq, v)\n\t\t}\n\t}\n\tm := len(uniq)\n\tbit := make([]int, m+1)\n\tadd := func(pos int) {\n\t\tfor p := pos; p <= m; p += p & -p {\n\t\t\tbit[p]++\n\t\t}\n\t}\n\tpref := func(pos int) int {\n\t\ts := 0\n\t\tfor p := pos; p > 0; p -= p & -p {\n\t\t\ts += bit[p]\n\t\t}\n\t\treturn s\n\t}\n\tlb := func(v int) int { return sort.SearchInts(uniq, v) }\n\tub := func(v int) int { return sort.Search(m, func(i int) bool { return uniq[i] > v }) }\n\ttotal := 0\n\tadd(lb(P[0]) + 1)\n\tfor j := 1; j <= n; j++ {\n\t\ttotal += pref(ub(P[j]-lower)) - pref(lb(P[j]-upper))\n\t\tadd(lb(P[j]) + 1)\n\t}\n\treturn total\n}`,
        kotlin: `fun countRangeSum(nums: IntArray, lower: Int, upper: Int): Int {\n    val n = nums.size\n    val P = LongArray(n + 1)\n    for (i in 0 until n) P[i + 1] = P[i] + nums[i]\n    val uniq = P.distinct().sorted()\n    val m = uniq.size\n    val bit = IntArray(m + 1)\n    fun add(pos: Int) {\n        var p = pos\n        while (p <= m) {\n            bit[p]++\n            p += p and -p\n        }\n    }\n    fun pref(pos: Int): Int {\n        var s = 0\n        var p = pos\n        while (p > 0) {\n            s += bit[p]\n            p -= p and -p\n        }\n        return s\n    }\n    fun lb(v: Long): Int {\n        var lo = 0\n        var hi = m\n        while (lo < hi) {\n            val mid = (lo + hi) / 2\n            if (uniq[mid] < v) lo = mid + 1 else hi = mid\n        }\n        return lo\n    }\n    fun ub(v: Long): Int {\n        var lo = 0\n        var hi = m\n        while (lo < hi) {\n            val mid = (lo + hi) / 2\n            if (uniq[mid] <= v) lo = mid + 1 else hi = mid\n        }\n        return lo\n    }\n    var total = 0\n    add(lb(P[0]) + 1)\n    for (j in 1..n) {\n        total += pref(ub(P[j] - lower)) - pref(lb(P[j] - upper))\n        add(lb(P[j]) + 1)\n    }\n    return total\n}`,
        swift: `func countRangeSum(_ nums: [Int], _ lower: Int, _ upper: Int) -> Int {\n    let n = nums.count\n    var P = [Int](repeating: 0, count: n + 1)\n    for i in 0..<n { P[i + 1] = P[i] + nums[i] }\n    let uniq = Array(Set(P)).sorted()\n    let m = uniq.count\n    var bit = [Int](repeating: 0, count: m + 1)\n    func add(_ pos: Int) {\n        var p = pos\n        while p <= m {\n            bit[p] += 1\n            p += p & -p\n        }\n    }\n    func pref(_ pos: Int) -> Int {\n        var s = 0\n        var p = pos\n        while p > 0 {\n            s += bit[p]\n            p -= p & -p\n        }\n        return s\n    }\n    func lb(_ v: Int) -> Int {\n        var lo = 0, hi = m\n        while lo < hi {\n            let mid = (lo + hi) / 2\n            if uniq[mid] < v { lo = mid + 1 } else { hi = mid }\n        }\n        return lo\n    }\n    func ub(_ v: Int) -> Int {\n        var lo = 0, hi = m\n        while lo < hi {\n            let mid = (lo + hi) / 2\n            if uniq[mid] <= v { lo = mid + 1 } else { hi = mid }\n        }\n        return lo\n    }\n    var total = 0\n    add(lb(P[0]) + 1)\n    for j in 1...max(n, 1) where j <= n {\n        total += pref(ub(P[j] - lower)) - pref(lb(P[j] - upper))\n        add(lb(P[j]) + 1)\n    }\n    return total\n}`,
        rust: `fn countRangeSum(nums: Vec<i32>, lower: i32, upper: i32) -> i32 {\n    let n = nums.len();\n    let mut p = vec![0i64; n + 1];\n    for i in 0..n {\n        p[i + 1] = p[i] + nums[i] as i64;\n    }\n    let mut uniq = p.clone();\n    uniq.sort();\n    uniq.dedup();\n    let m = uniq.len();\n    let mut bit = vec![0i32; m + 1];\n    let lb = |uniq: &Vec<i64>, v: i64| -> usize {\n        let (mut lo, mut hi) = (0usize, m);\n        while lo < hi {\n            let mid = (lo + hi) / 2;\n            if uniq[mid] < v { lo = mid + 1; } else { hi = mid; }\n        }\n        lo\n    };\n    let ub = |uniq: &Vec<i64>, v: i64| -> usize {\n        let (mut lo, mut hi) = (0usize, m);\n        while lo < hi {\n            let mid = (lo + hi) / 2;\n            if uniq[mid] <= v { lo = mid + 1; } else { hi = mid; }\n        }\n        lo\n    };\n    let mut total = 0i32;\n    let start = lb(&uniq, p[0]) + 1;\n    let mut q = start;\n    while q <= m {\n        bit[q] += 1;\n        q += q & q.wrapping_neg();\n    }\n    for j in 1..=n {\n        let hi_idx = ub(&uniq, p[j] - lower as i64);\n        let lo_idx = lb(&uniq, p[j] - upper as i64);\n        let mut s1 = 0i32;\n        let mut a = hi_idx;\n        while a > 0 {\n            s1 += bit[a];\n            a -= a & a.wrapping_neg();\n        }\n        let mut s2 = 0i32;\n        let mut b = lo_idx;\n        while b > 0 {\n            s2 += bit[b];\n            b -= b & b.wrapping_neg();\n        }\n        total += s1 - s2;\n        let mut c = lb(&uniq, p[j]) + 1;\n        while c <= m {\n            bit[c] += 1;\n            c += c & c.wrapping_neg();\n        }\n    }\n    total\n}`,
        php: `function countRangeSum($nums, $lower, $upper) {\n    $n = count($nums);\n    $P = array_fill(0, $n + 1, 0);\n    for ($i = 0; $i < $n; $i++) $P[$i + 1] = $P[$i] + $nums[$i];\n    $uniq = array_values(array_unique($P));\n    sort($uniq);\n    $m = count($uniq);\n    $bit = array_fill(0, $m + 1, 0);\n    $add = function($pos) use (&$bit, $m) {\n        for ($p = $pos; $p <= $m; $p += $p & -$p) $bit[$p]++;\n    };\n    $pref = function($pos) use (&$bit) {\n        $s = 0;\n        for ($p = $pos; $p > 0; $p -= $p & -$p) $s += $bit[$p];\n        return $s;\n    };\n    $lb = function($v) use ($uniq, $m) {\n        $lo = 0; $hi = $m;\n        while ($lo < $hi) { $mid = intdiv($lo + $hi, 2); if ($uniq[$mid] < $v) $lo = $mid + 1; else $hi = $mid; }\n        return $lo;\n    };\n    $ub = function($v) use ($uniq, $m) {\n        $lo = 0; $hi = $m;\n        while ($lo < $hi) { $mid = intdiv($lo + $hi, 2); if ($uniq[$mid] <= $v) $lo = $mid + 1; else $hi = $mid; }\n        return $lo;\n    };\n    $total = 0;\n    $add($lb($P[0]) + 1);\n    for ($j = 1; $j <= $n; $j++) {\n        $total += $pref($ub($P[$j] - $lower)) - $pref($lb($P[$j] - $upper));\n        $add($lb($P[$j]) + 1);\n    }\n    return $total;\n}`,
        ruby: `def countRangeSum(nums, lower, upper)\n  n = nums.length\n  p_arr = Array.new(n + 1, 0)\n  (0...n).each { |i| p_arr[i + 1] = p_arr[i] + nums[i] }\n  uniq = p_arr.uniq.sort\n  m = uniq.length\n  bit = Array.new(m + 1, 0)\n  add = lambda do |pos|\n    p = pos\n    while p <= m\n      bit[p] += 1\n      p += p & -p\n    end\n  end\n  pref = lambda do |pos|\n    s = 0\n    p = pos\n    while p > 0\n      s += bit[p]\n      p -= p & -p\n    end\n    s\n  end\n  lb = lambda { |v| uniq.bsearch_index { |x| x >= v } || m }\n  ub = lambda { |v| uniq.bsearch_index { |x| x > v } || m }\n  total = 0\n  add.call(lb.call(p_arr[0]) + 1)\n  (1..n).each do |j|\n    total += pref.call(ub.call(p_arr[j] - lower)) - pref.call(lb.call(p_arr[j] - upper))\n    add.call(lb.call(p_arr[j]) + 1)\n  end\n  total\nend`,
      },
    };
  })(),
];
