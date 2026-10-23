/**
 * Hashing & counting problems — wave 7, batch 10.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Almost every problem here is "count something into a table, then read the
 * table": the languages with a hash map use it, and C — which has none on the
 * judge — either indexes a plain array (the value range is small: letters,
 * remainders, digit sums) or sorts and binary-searches, which keeps it
 * O(n log n) without a hand-rolled hash table. Where a statement's real answer
 * could pass 2^31 - 1 (a pair sum of two values near 10^9), the stated range
 * is narrowed so the answer provably fits a signed 32-bit int; products and
 * sums are still formed in 64 bits in the typed languages. The local Judge0
 * runs old toolchains (Kotlin 1.3, Rust 1.40, Go 1.13, Swift 5.2, Ruby 2.7),
 * so the solutions stay inside what those accept.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const HASHING7_PROBLEMS: CatalogProblem[] = [

  // ── Shortest Completing Word (LC 748) ───────────────────────────
  (() => {
    const ref = (plate: string, words: string[]) => {
      const need = new Array(26).fill(0);
      for (const ch of plate.toLowerCase()) if (ch >= "a" && ch <= "z") need[ch.charCodeAt(0) - 97]++;
      let best: string | null = null;
      for (const w of words) {
        const cnt = new Array(26).fill(0);
        for (const ch of w) cnt[ch.charCodeAt(0) - 97]++;
        if (need.every((v, i) => cnt[i] >= v) && (best === null || w.length < best.length)) best = w;
      }
      return best as string;
    };
    return {
      slug: "shortest-completing-word",
      title: "Shortest Completing Word",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "String", "Google"],
      signature: { funcName: "shortestCompletingWord", params: [{ name: "licensePlate", type: "string" as const }, { name: "words", type: "string[]" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `licensePlate` and a list of lowercase `words`.\n\nOnly the **letters** of `licensePlate` matter: ignore its digits and spaces, and treat upper- and lowercase letters as the same. A word **completes** the plate when it contains every one of those letters at least as many times as the plate does (a letter that appears twice on the plate must appear at least twice in the word).\n\nReturn the **shortest** completing word. If several completing words share the shortest length, return the one that appears **first** in `words`. An answer is guaranteed to exist.",
        [
          { in: "licensePlate = \"aB 7b\", words = [\"bake\",\"abbey\",\"barb\",\"bob\"]", out: "barb", note: "The plate needs one `a` and two `b`s. `abbey` (5 letters) and `barb` (4 letters) both complete it; `barb` is shorter." },
          { in: "licensePlate = \"1s3 456\", words = [\"looks\",\"pest\",\"stew\",\"show\"]", out: "pest", note: "Only an `s` is needed. Three words of length 4 qualify, and `pest` comes first." },
          { in: "licensePlate = \"Zz9\", words = [\"zaz\",\"z\",\"zz\"]", out: "zz", note: "Case is ignored, so two `z`s are needed and `z` alone is not enough." },
        ],
        ["1 <= licensePlate.length <= 7", "licensePlate holds digits, letters (either case) and spaces", "1 <= words.length <= 1000", "1 <= words[i].length <= 15", "words[i] holds lowercase English letters"]),
      hints: [
        "Reduce the plate to 26 letter counts first — digits, spaces and case all disappear.",
        "A word completes the plate exactly when its own 26 counts are each at least the plate's.",
        "Scan the words in order and replace the current best only on a strictly shorter completing word, so ties keep the earliest.",
      ],
      editorial: explain({
        idea: "Comparing letter *counts* rather than letters turns the check into 26 integer comparisons per word. Scanning in order and keeping the best only on a strictly shorter length gives the earliest-of-shortest rule for free.",
        steps: [
          "Count the plate's letters into `need[26]`, lowercasing and skipping everything that is not a letter.",
          "For each word in order, skip it if it is not shorter than the best found so far.",
          "Otherwise count its letters and check `count[c] >= need[c]` for all 26 letters; if so, it becomes the best.",
          "Return the best word.",
        ],
        why: "A word contains the plate's letters with multiplicity exactly when every letter's count in the word reaches the plate's count. Because the best only changes on a strictly shorter word, the first of the shortest completing words is never displaced by a later word of the same length.",
        time: "O(P + Σ|words[i]|)",
        space: "O(1)",
        pitfalls: [
          "Uppercase plate letters must count toward the lowercase letter.",
          "Multiplicity matters: a plate with two `s`s rejects a word with one.",
          "Using `<=` when comparing lengths returns the last shortest word instead of the first.",
        ],
      }),
      examples: [
        { input: "\"aB 7b\"\n[\"bake\",\"abbey\",\"barb\",\"bob\"]", expectedOutput: "barb" },
        { input: "\"1s3 456\"\n[\"looks\",\"pest\",\"stew\",\"show\"]", expectedOutput: "pest" },
        { input: "\"Zz9\"\n[\"zaz\",\"z\",\"zz\"]", expectedOutput: "zz" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["abc", "abcdef", "abcdefghijklmnopqrstuvwxyz"]);
        const plen = ri(rng, 1, 7);
        const chars: string[] = [];
        for (let i = 0; i < plen; i++) {
          const t = ri(rng, 0, 9);
          if (t < 6) {
            const ch = alpha[ri(rng, 0, alpha.length - 1)];
            chars.push(rng() < 0.4 ? ch.toUpperCase() : ch);
          } else if (t < 9 || i === 0 || i === plen - 1) {
            chars.push(String(ri(rng, 0, 9)));
          } else {
            chars.push(" ");
          }
        }
        const plate = chars.join("");
        const letters = plate.toLowerCase().split("").filter((c) => c >= "a" && c <= "z");
        const pool = alpha + letters.join("") + letters.join("");
        const rand = (lo: number, hi: number) =>
          Array.from({ length: ri(rng, lo, hi) }, () => pool[ri(rng, 0, pool.length - 1)]).join("");
        const n = ri(rng, 0, pick(rng, [0, 4, 12, 25]));
        const words: string[] = [];
        for (let i = 0; i < n; i++) words.push(rand(1, pick(rng, [4, 8, 15])));
        const extra = ri(rng, letters.length === 0 ? 1 : 0, Math.min(4, 15 - letters.length));
        const good = shuffle(rng, letters.concat(rand(extra, extra).split(""))).join("");
        const copies = ri(rng, 1, 2);
        for (let c = 0; c < copies; c++) words.splice(ri(rng, 0, words.length), 0, good);
        return { input: `"${plate}"\n${fmtStrArr(words)}`, expectedOutput: ref(plate, words) };
      },
      solutions: {
        python: code`
          from typing import List

          def shortestCompletingWord(licensePlate: str, words: List[str]) -> str:
              need = [0] * 26
              for ch in licensePlate.lower():
                  if 'a' <= ch <= 'z':
                      need[ord(ch) - 97] += 1
              best = None
              for w in words:
                  if best is not None and len(w) >= len(best):
                      continue
                  cnt = [0] * 26
                  for ch in w:
                      cnt[ord(ch) - 97] += 1
                  if all(cnt[i] >= need[i] for i in range(26)):
                      best = w
              return best
        `,
        javascript: code`
          var shortestCompletingWord = function(licensePlate, words) {
              var need = new Array(26).fill(0);
              for (var i = 0; i < licensePlate.length; i++) {
                  var c = licensePlate.charCodeAt(i);
                  if (c >= 65 && c <= 90) need[c - 65]++;
                  else if (c >= 97 && c <= 122) need[c - 97]++;
              }
              var best = null;
              for (var w = 0; w < words.length; w++) {
                  var word = words[w];
                  if (best !== null && word.length >= best.length) continue;
                  var cnt = new Array(26).fill(0);
                  for (var j = 0; j < word.length; j++) cnt[word.charCodeAt(j) - 97]++;
                  var ok = true;
                  for (var k = 0; k < 26; k++) if (cnt[k] < need[k]) { ok = false; break; }
                  if (ok) best = word;
              }
              return best;
          };
        `,
        typescript: code`
          function shortestCompletingWord(licensePlate: string, words: string[]): string {
              var need: number[] = [];
              for (var z = 0; z < 26; z++) need.push(0);
              for (var i = 0; i < licensePlate.length; i++) {
                  var c = licensePlate.charCodeAt(i);
                  if (c >= 65 && c <= 90) need[c - 65]++;
                  else if (c >= 97 && c <= 122) need[c - 97]++;
              }
              var best: string = null;
              for (var w = 0; w < words.length; w++) {
                  var word = words[w];
                  if (best !== null && word.length >= best.length) continue;
                  var cnt: number[] = [];
                  for (var y = 0; y < 26; y++) cnt.push(0);
                  for (var j = 0; j < word.length; j++) cnt[word.charCodeAt(j) - 97]++;
                  var ok = true;
                  for (var k = 0; k < 26; k++) if (cnt[k] < need[k]) { ok = false; break; }
                  if (ok) best = word;
              }
              return best;
          }
        `,
        java: code`
          public static String shortestCompletingWord(String licensePlate, String[] words) {
              int[] need = new int[26];
              for (char ch : licensePlate.toCharArray()) {
                  if (Character.isLetter(ch)) need[Character.toLowerCase(ch) - 'a']++;
              }
              String best = null;
              for (String w : words) {
                  if (best != null && w.length() >= best.length()) continue;
                  int[] cnt = new int[26];
                  for (char ch : w.toCharArray()) cnt[ch - 'a']++;
                  boolean ok = true;
                  for (int k = 0; k < 26; k++) if (cnt[k] < need[k]) { ok = false; break; }
                  if (ok) best = w;
              }
              return best;
          }
        `,
        cpp: code`
          string shortestCompletingWord(string licensePlate, vector<string>& words) {
              int need[26] = {0};
              for (char ch : licensePlate) {
                  if (isalpha((unsigned char)ch)) need[tolower((unsigned char)ch) - 'a']++;
              }
              int best = -1;
              for (int w = 0; w < (int)words.size(); w++) {
                  if (best >= 0 && words[w].size() >= words[best].size()) continue;
                  int cnt[26] = {0};
                  for (char ch : words[w]) cnt[ch - 'a']++;
                  bool ok = true;
                  for (int k = 0; k < 26; k++) if (cnt[k] < need[k]) { ok = false; break; }
                  if (ok) best = w;
              }
              return words[best];
          }
        `,
        c: code`
          char* shortestCompletingWord(const char* licensePlate, char** words, int wordsSize) {
              int need[26] = {0};
              for (const char* p = licensePlate; *p; p++) {
                  if (*p >= 'A' && *p <= 'Z') need[*p - 'A']++;
                  else if (*p >= 'a' && *p <= 'z') need[*p - 'a']++;
              }
              int best = -1, bestLen = 0;
              for (int w = 0; w < wordsSize; w++) {
                  int len = (int)strlen(words[w]);
                  if (best >= 0 && len >= bestLen) continue;
                  int cnt[26] = {0};
                  for (int j = 0; j < len; j++) cnt[words[w][j] - 'a']++;
                  int ok = 1;
                  for (int k = 0; k < 26; k++) if (cnt[k] < need[k]) { ok = 0; break; }
                  if (ok) { best = w; bestLen = len; }
              }
              char* out = (char*)malloc(bestLen + 1);
              memcpy(out, words[best], bestLen + 1);
              return out;
          }
        `,
        csharp: code`
          public static string ShortestCompletingWord(string licensePlate, string[] words)
          {
              var need = new int[26];
              foreach (char ch in licensePlate)
              {
                  if (char.IsLetter(ch)) need[char.ToLowerInvariant(ch) - 'a']++;
              }
              string best = null;
              foreach (string w in words)
              {
                  if (best != null && w.Length >= best.Length) continue;
                  var cnt = new int[26];
                  foreach (char ch in w) cnt[ch - 'a']++;
                  bool ok = true;
                  for (int k = 0; k < 26; k++) if (cnt[k] < need[k]) { ok = false; break; }
                  if (ok) best = w;
              }
              return best;
          }
        `,
        go: code`
          func shortestCompletingWord(licensePlate string, words []string) string {
              need := [26]int{}
              for i := 0; i < len(licensePlate); i++ {
                  c := licensePlate[i]
                  if c >= 'A' && c <= 'Z' {
                      need[c-'A']++
                  } else if c >= 'a' && c <= 'z' {
                      need[c-'a']++
                  }
              }
              best := -1
              for w, word := range words {
                  if best >= 0 && len(word) >= len(words[best]) {
                      continue
                  }
                  cnt := [26]int{}
                  for i := 0; i < len(word); i++ {
                      cnt[word[i]-'a']++
                  }
                  ok := true
                  for k := 0; k < 26; k++ {
                      if cnt[k] < need[k] {
                          ok = false
                          break
                      }
                  }
                  if ok {
                      best = w
                  }
              }
              return words[best]
          }
        `,
        kotlin: code`
          fun shortestCompletingWord(licensePlate: String, words: Array<String>): String {
              val need = IntArray(26)
              for (ch in licensePlate) {
                  if (ch.isLetter()) need[ch.toLowerCase() - 'a']++
              }
              var best = -1
              for (w in words.indices) {
                  if (best >= 0 && words[w].length >= words[best].length) continue
                  val cnt = IntArray(26)
                  for (ch in words[w]) cnt[ch - 'a']++
                  var ok = true
                  for (k in 0 until 26) if (cnt[k] < need[k]) { ok = false; break }
                  if (ok) best = w
              }
              return words[best]
          }
        `,
        swift: code`
          func shortestCompletingWord(_ licensePlate: String, _ words: [String]) -> String {
              var need = [Int](repeating: 0, count: 26)
              for c in licensePlate.utf8 {
                  if c >= 65 && c <= 90 { need[Int(c) - 65] += 1 }
                  else if c >= 97 && c <= 122 { need[Int(c) - 97] += 1 }
              }
              var best = -1
              var bestLen = 0
              for (w, word) in words.enumerated() {
                  let bytes = Array(word.utf8)
                  if best >= 0 && bytes.count >= bestLen { continue }
                  var cnt = [Int](repeating: 0, count: 26)
                  for c in bytes { cnt[Int(c) - 97] += 1 }
                  var ok = true
                  for k in 0..<26 where cnt[k] < need[k] { ok = false; break }
                  if ok { best = w; bestLen = bytes.count }
              }
              return words[best]
          }
        `,
        rust: code`
          fn shortestCompletingWord(license_plate: String, words: Vec<String>) -> String {
              let mut need = [0i32; 26];
              for c in license_plate.bytes() {
                  if c.is_ascii_alphabetic() {
                      need[(c.to_ascii_lowercase() - b'a') as usize] += 1;
                  }
              }
              let mut best: Option<usize> = None;
              for (w, word) in words.iter().enumerate() {
                  if let Some(b) = best {
                      if word.len() >= words[b].len() {
                          continue;
                      }
                  }
                  let mut cnt = [0i32; 26];
                  for c in word.bytes() {
                      cnt[(c - b'a') as usize] += 1;
                  }
                  if (0..26).all(|k| cnt[k] >= need[k]) {
                      best = Some(w);
                  }
              }
              words[best.unwrap()].clone()
          }
        `,
        php: code`
          function shortestCompletingWord($licensePlate, $words) {
              $need = array_fill(0, 26, 0);
              $lower = strtolower($licensePlate);
              for ($i = 0; $i < strlen($lower); $i++) {
                  $c = ord($lower[$i]);
                  if ($c >= 97 && $c <= 122) $need[$c - 97]++;
              }
              $best = null;
              foreach ($words as $w) {
                  if ($best !== null && strlen($w) >= strlen($best)) continue;
                  $cnt = array_fill(0, 26, 0);
                  for ($j = 0; $j < strlen($w); $j++) $cnt[ord($w[$j]) - 97]++;
                  $ok = true;
                  for ($k = 0; $k < 26; $k++) {
                      if ($cnt[$k] < $need[$k]) { $ok = false; break; }
                  }
                  if ($ok) $best = $w;
              }
              return $best;
          }
        `,
        ruby: code`
          def shortestCompletingWord(license_plate, words)
            need = Array.new(26, 0)
            license_plate.downcase.each_byte do |c|
              need[c - 97] += 1 if c >= 97 && c <= 122
            end
            best = nil
            words.each do |w|
              next if best && w.length >= best.length
              cnt = Array.new(26, 0)
              w.each_byte { |c| cnt[c - 97] += 1 }
              best = w if (0...26).all? { |k| cnt[k] >= need[k] }
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Rabbits in Forest (LC 781) ──────────────────────────────────
  (() => {
    const ref = (answers: number[]) => {
      const cnt = new Map<number, number>();
      for (const a of answers) cnt.set(a, (cnt.get(a) || 0) + 1);
      let total = 0;
      for (const [a, c] of cnt) total += Math.ceil(c / (a + 1)) * (a + 1);
      return total;
    };
    return {
      slug: "rabbits-in-forest",
      title: "Rabbits in Forest",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Math", "Greedy", "Google", "Amazon"],
      signature: { funcName: "numRabbits", params: [{ name: "answers", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A forest holds an unknown number of rabbits, each of one colour. You ask some of them the question *\"How many other rabbits share your colour?\"* and record the replies in `answers`, where `answers[i]` is the reply of the `i`-th rabbit you asked. Every rabbit answers truthfully.\n\nReturn the **minimum** number of rabbits that could be living in the forest.",
        [
          { in: "answers = [1,1,2]", out: "5", note: "The two rabbits that said 1 can share one colour (a group of 2). The rabbit that said 2 belongs to a group of 3, of which we met only one, so two more exist. 2 + 3 = 5." },
          { in: "answers = [10,10,10]", out: "11", note: "All three can belong to the same group of 11 rabbits." },
          { in: "answers = [0,0,1,1,1]", out: "6", note: "Each 0 is a rabbit alone in its colour (2 rabbits). Three rabbits said 1, but a group of that colour holds only 2, so they need two groups: 4 rabbits." },
        ],
        ["1 <= answers.length <= 1000", "0 <= answers[i] < 1000"]),
      hints: [
        "A rabbit that answers `x` belongs to a colour group of exactly `x + 1` rabbits.",
        "Rabbits giving the same answer can share a group — but only `x + 1` of them can.",
        "If `c` rabbits answered `x`, they need `ceil(c / (x + 1))` groups of `x + 1` rabbits each.",
      ],
      editorial: explain({
        idea: "An answer `x` pins its rabbit to a group of size `x + 1`. To minimise the total, pack rabbits with the same answer into as few such groups as possible.",
        steps: [
          "Count how many rabbits gave each answer.",
          "For each answer `x` with count `c`, add `ceil(c / (x + 1)) * (x + 1)`.",
          "Return the sum.",
        ],
        why: "Rabbits with different answers can never share a colour (they would disagree about the group size), so answers are independent. Within one answer `x`, each group holds at most `x + 1` of the rabbits we met, so at least `ceil(c / (x + 1))` groups exist, each contributing exactly `x + 1` rabbits; filling groups greedily achieves that bound.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Counting `x + 1` once per distinct answer undercounts when more than `x + 1` rabbits gave the same answer.",
          "An answer of 0 is a group of one, so every such rabbit counts separately.",
        ],
      }),
      examples: [
        { input: "[1,1,2]", expectedOutput: "5" },
        { input: "[10,10,10]", expectedOutput: "11" },
        { input: "[0,0,1,1,1]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 20, 60]));
        const top = pick(rng, [0, 1, 3, 6, 999]);
        const answers = Array.from({ length: n }, () => ri(rng, 0, top));
        return { input: fmtIntArr(answers), expectedOutput: String(ref(answers)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def numRabbits(answers: List[int]) -> int:
              total = 0
              for x, c in Counter(answers).items():
                  size = x + 1
                  total += (c + size - 1) // size * size
              return total
        `,
        javascript: code`
          var numRabbits = function(answers) {
              var cnt = new Array(1001).fill(0);
              for (var i = 0; i < answers.length; i++) cnt[answers[i]]++;
              var total = 0;
              for (var x = 0; x <= 1000; x++) {
                  if (cnt[x] === 0) continue;
                  var size = x + 1;
                  total += Math.floor((cnt[x] + size - 1) / size) * size;
              }
              return total;
          };
        `,
        typescript: code`
          function numRabbits(answers: number[]): number {
              var cnt: number[] = [];
              for (var z = 0; z <= 1000; z++) cnt.push(0);
              for (var i = 0; i < answers.length; i++) cnt[answers[i]]++;
              var total = 0;
              for (var x = 0; x <= 1000; x++) {
                  if (cnt[x] === 0) continue;
                  var size = x + 1;
                  total += Math.floor((cnt[x] + size - 1) / size) * size;
              }
              return total;
          }
        `,
        java: code`
          public static int numRabbits(int[] answers) {
              int[] cnt = new int[1001];
              for (int a : answers) cnt[a]++;
              int total = 0;
              for (int x = 0; x <= 1000; x++) {
                  if (cnt[x] == 0) continue;
                  int size = x + 1;
                  total += (cnt[x] + size - 1) / size * size;
              }
              return total;
          }
        `,
        cpp: code`
          int numRabbits(vector<int>& answers) {
              vector<int> cnt(1001, 0);
              for (int a : answers) cnt[a]++;
              int total = 0;
              for (int x = 0; x <= 1000; x++) {
                  if (cnt[x] == 0) continue;
                  int size = x + 1;
                  total += (cnt[x] + size - 1) / size * size;
              }
              return total;
          }
        `,
        c: code`
          int numRabbits(int* answers, int answersSize) {
              int cnt[1001] = {0};
              for (int i = 0; i < answersSize; i++) cnt[answers[i]]++;
              int total = 0;
              for (int x = 0; x <= 1000; x++) {
                  if (cnt[x] == 0) continue;
                  int size = x + 1;
                  total += (cnt[x] + size - 1) / size * size;
              }
              return total;
          }
        `,
        csharp: code`
          public static int NumRabbits(int[] answers)
          {
              var cnt = new int[1001];
              foreach (int a in answers) cnt[a]++;
              int total = 0;
              for (int x = 0; x <= 1000; x++)
              {
                  if (cnt[x] == 0) continue;
                  int size = x + 1;
                  total += (cnt[x] + size - 1) / size * size;
              }
              return total;
          }
        `,
        go: code`
          func numRabbits(answers []int) int {
              cnt := make([]int, 1001)
              for _, a := range answers {
                  cnt[a]++
              }
              total := 0
              for x := 0; x <= 1000; x++ {
                  if cnt[x] == 0 {
                      continue
                  }
                  size := x + 1
                  total += (cnt[x] + size - 1) / size * size
              }
              return total
          }
        `,
        kotlin: code`
          fun numRabbits(answers: IntArray): Int {
              val cnt = IntArray(1001)
              for (a in answers) cnt[a]++
              var total = 0
              for (x in 0..1000) {
                  if (cnt[x] == 0) continue
                  val size = x + 1
                  total += (cnt[x] + size - 1) / size * size
              }
              return total
          }
        `,
        swift: code`
          func numRabbits(_ answers: [Int]) -> Int {
              var cnt = [Int](repeating: 0, count: 1001)
              for a in answers { cnt[a] += 1 }
              var total = 0
              for x in 0...1000 where cnt[x] > 0 {
                  let size = x + 1
                  total += (cnt[x] + size - 1) / size * size
              }
              return total
          }
        `,
        rust: code`
          fn numRabbits(answers: Vec<i32>) -> i32 {
              let mut cnt = vec![0i32; 1001];
              for &a in answers.iter() {
                  cnt[a as usize] += 1;
              }
              let mut total = 0i32;
              for x in 0..=1000usize {
                  if cnt[x] == 0 {
                      continue;
                  }
                  let size = x as i32 + 1;
                  total += (cnt[x] + size - 1) / size * size;
              }
              total
          }
        `,
        php: code`
          function numRabbits($answers) {
              $cnt = array_count_values($answers);
              $total = 0;
              foreach ($cnt as $x => $c) {
                  $size = $x + 1;
                  $total += intdiv($c + $size - 1, $size) * $size;
              }
              return $total;
          }
        `,
        ruby: code`
          def numRabbits(answers)
            cnt = Hash.new(0)
            answers.each { |a| cnt[a] += 1 }
            total = 0
            cnt.each do |x, c|
              size = x + 1
              total += (c + size - 1) / size * size
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Card Flipping Game (LC 822) ─────────────────────────────────
  (() => {
    const ref = (fronts: number[], backs: number[]) => {
      // x can be made good unless some card carries x on both faces.
      let best = 0;
      for (const x of fronts.concat(backs)) {
        let blocked = false;
        for (let i = 0; i < fronts.length; i++) if (fronts[i] === x && backs[i] === x) blocked = true;
        if (!blocked && (best === 0 || x < best)) best = x;
      }
      return best;
    };
    return {
      slug: "card-flipping-game",
      title: "Card Flipping Game",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Google"],
      signature: { funcName: "flipgame", params: [{ name: "fronts", type: "int[]" as const }, { name: "backs", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You have `n` cards on a table. Card `i` has the positive integer `fronts[i]` on its face and `backs[i]` on its reverse, and it starts face up.\n\nYou may flip any number of cards (possibly none). After flipping, an integer is **good** if it is printed on the back of some card *and* it is not showing on the front of any card.\n\nReturn the **smallest** integer that can be made good by some choice of flips, or `0` if no integer can ever be good.",
        [
          { in: "fronts = [1,2,4,4,7], backs = [1,3,4,1,3]", out: "2", note: "Flip the second card: it now shows 3 and hides 2. No front shows 2, so 2 is good. 1 can never be good because the first card has 1 on both faces." },
          { in: "fronts = [1], backs = [1]", out: "0", note: "The only number, 1, is on both faces of the same card, so it always shows." },
          { in: "fronts = [5,3], backs = [3,5]", out: "3", note: "Flip the second card so it shows 5 and hides 3. The fronts now read 5 and 5, and 3 sits on a back, so 3 is good." },
        ],
        ["n == fronts.length == backs.length", "1 <= n <= 1000", "1 <= fronts[i], backs[i] <= 2000"]),
      hints: [
        "Which numbers can *never* be good, whatever you flip?",
        "A card with the same number on both faces always shows that number on its front.",
        "Every other number can be made good by turning each card that carries it so the number is hidden. Take the smallest number that is not on a same-faced card.",
      ],
      editorial: explain({
        idea: "A number `x` is blocked only when some card has `x` on both faces — that card shows `x` whatever you do. Any unblocked `x` that appears anywhere can be made good, so the answer is the smallest unblocked number.",
        steps: [
          "Collect every value with `fronts[i] == backs[i]` into a blocked set.",
          "Scan all values in `fronts` and `backs`; keep the smallest that is not blocked.",
          "Return it, or 0 if every value is blocked.",
        ],
        why: "If `x` is not blocked, every card carrying `x` has a different number on its other face, so turn each such card to show that other number. Then no front shows `x`, and at least one back carries it — `x` is good. Conversely, a blocked `x` always shows on a front.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Only cards with equal faces block a number; a number appearing on several different cards is still achievable.",
          "Candidates come from both arrays — a number seen only on a front can be flipped to the back.",
        ],
      }),
      examples: [
        { input: "[1,2,4,4,7]\n[1,3,4,1,3]", expectedOutput: "2" },
        { input: "[1]\n[1]", expectedOutput: "0" },
        { input: "[5,3]\n[3,5]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 40]));
        const top = pick(rng, [2, 5, 12, 2000]);
        const fronts: number[] = [], backs: number[] = [];
        for (let i = 0; i < n; i++) {
          const f = ri(rng, 1, top);
          fronts.push(f);
          backs.push(rng() < 0.3 ? f : ri(rng, 1, top));
        }
        return { input: `${fmtIntArr(fronts)}\n${fmtIntArr(backs)}`, expectedOutput: String(ref(fronts, backs)) };
      },
      solutions: {
        python: code`
          from typing import List

          def flipgame(fronts: List[int], backs: List[int]) -> int:
              blocked = {f for f, b in zip(fronts, backs) if f == b}
              best = 0
              for x in fronts + backs:
                  if x not in blocked and (best == 0 or x < best):
                      best = x
              return best
        `,
        javascript: code`
          var flipgame = function(fronts, backs) {
              var blocked = new Set();
              for (var i = 0; i < fronts.length; i++) if (fronts[i] === backs[i]) blocked.add(fronts[i]);
              var best = 0;
              for (var j = 0; j < fronts.length; j++) {
                  var a = fronts[j], b = backs[j];
                  if (!blocked.has(a) && (best === 0 || a < best)) best = a;
                  if (!blocked.has(b) && (best === 0 || b < best)) best = b;
              }
              return best;
          };
        `,
        typescript: code`
          function flipgame(fronts: number[], backs: number[]): number {
              var blocked: { [v: number]: boolean } = {};
              for (var i = 0; i < fronts.length; i++) if (fronts[i] === backs[i]) blocked[fronts[i]] = true;
              var best = 0;
              for (var j = 0; j < fronts.length; j++) {
                  var a = fronts[j], b = backs[j];
                  if (!blocked[a] && (best === 0 || a < best)) best = a;
                  if (!blocked[b] && (best === 0 || b < best)) best = b;
              }
              return best;
          }
        `,
        java: code`
          public static int flipgame(int[] fronts, int[] backs) {
              Set<Integer> blocked = new HashSet<>();
              for (int i = 0; i < fronts.length; i++) if (fronts[i] == backs[i]) blocked.add(fronts[i]);
              int best = 0;
              for (int i = 0; i < fronts.length; i++) {
                  int a = fronts[i], b = backs[i];
                  if (!blocked.contains(a) && (best == 0 || a < best)) best = a;
                  if (!blocked.contains(b) && (best == 0 || b < best)) best = b;
              }
              return best;
          }
        `,
        cpp: code`
          int flipgame(vector<int>& fronts, vector<int>& backs) {
              unordered_set<int> blocked;
              for (size_t i = 0; i < fronts.size(); i++) if (fronts[i] == backs[i]) blocked.insert(fronts[i]);
              int best = 0;
              for (size_t i = 0; i < fronts.size(); i++) {
                  int a = fronts[i], b = backs[i];
                  if (!blocked.count(a) && (best == 0 || a < best)) best = a;
                  if (!blocked.count(b) && (best == 0 || b < best)) best = b;
              }
              return best;
          }
        `,
        c: code`
          int flipgame(int* fronts, int frontsSize, int* backs, int backsSize) {
              static char blocked[2001];
              memset(blocked, 0, sizeof(blocked));
              for (int i = 0; i < frontsSize; i++) if (fronts[i] == backs[i]) blocked[fronts[i]] = 1;
              int best = 0;
              for (int i = 0; i < frontsSize; i++) {
                  int a = fronts[i], b = backs[i];
                  if (!blocked[a] && (best == 0 || a < best)) best = a;
                  if (!blocked[b] && (best == 0 || b < best)) best = b;
              }
              return best;
          }
        `,
        csharp: code`
          public static int Flipgame(int[] fronts, int[] backs)
          {
              var blocked = new HashSet<int>();
              for (int i = 0; i < fronts.Length; i++) if (fronts[i] == backs[i]) blocked.Add(fronts[i]);
              int best = 0;
              for (int i = 0; i < fronts.Length; i++)
              {
                  int a = fronts[i], b = backs[i];
                  if (!blocked.Contains(a) && (best == 0 || a < best)) best = a;
                  if (!blocked.Contains(b) && (best == 0 || b < best)) best = b;
              }
              return best;
          }
        `,
        go: code`
          func flipgame(fronts []int, backs []int) int {
              blocked := map[int]bool{}
              for i := range fronts {
                  if fronts[i] == backs[i] {
                      blocked[fronts[i]] = true
                  }
              }
              best := 0
              for i := range fronts {
                  for _, v := range []int{fronts[i], backs[i]} {
                      if !blocked[v] && (best == 0 || v < best) {
                          best = v
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun flipgame(fronts: IntArray, backs: IntArray): Int {
              val blocked = HashSet<Int>()
              for (i in fronts.indices) if (fronts[i] == backs[i]) blocked.add(fronts[i])
              var best = 0
              for (i in fronts.indices) {
                  for (v in intArrayOf(fronts[i], backs[i])) {
                      if (v !in blocked && (best == 0 || v < best)) best = v
                  }
              }
              return best
          }
        `,
        swift: code`
          func flipgame(_ fronts: [Int], _ backs: [Int]) -> Int {
              var blocked = Set<Int>()
              for i in 0..<fronts.count where fronts[i] == backs[i] { blocked.insert(fronts[i]) }
              var best = 0
              for i in 0..<fronts.count {
                  for v in [fronts[i], backs[i]] where !blocked.contains(v) && (best == 0 || v < best) {
                      best = v
                  }
              }
              return best
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn flipgame(fronts: Vec<i32>, backs: Vec<i32>) -> i32 {
              let mut blocked = HashSet::new();
              for i in 0..fronts.len() {
                  if fronts[i] == backs[i] {
                      blocked.insert(fronts[i]);
                  }
              }
              let mut best = 0;
              for i in 0..fronts.len() {
                  for &v in [fronts[i], backs[i]].iter() {
                      if !blocked.contains(&v) && (best == 0 || v < best) {
                          best = v;
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function flipgame($fronts, $backs) {
              $blocked = [];
              $n = count($fronts);
              for ($i = 0; $i < $n; $i++) if ($fronts[$i] === $backs[$i]) $blocked[$fronts[$i]] = true;
              $best = 0;
              for ($i = 0; $i < $n; $i++) {
                  foreach ([$fronts[$i], $backs[$i]] as $v) {
                      if (!isset($blocked[$v]) && ($best === 0 || $v < $best)) $best = $v;
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          require 'set'

          def flipgame(fronts, backs)
            blocked = Set.new
            fronts.each_index { |i| blocked << fronts[i] if fronts[i] == backs[i] }
            best = 0
            (fronts + backs).each do |v|
              best = v if !blocked.include?(v) && (best == 0 || v < best)
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Vowel Spellchecker (LC 966) ─────────────────────────────────
  (() => {
    const dv = (s: string) => s.toLowerCase().split("").map((c) => ("aeiou".includes(c) ? "*" : c)).join("");
    const ref = (wordlist: string[], queries: string[]) => queries.map((q) => {
      if (wordlist.includes(q)) return q;
      const byCase = wordlist.find((w) => w.toLowerCase() === q.toLowerCase());
      if (byCase !== undefined) return byCase;
      const byVowel = wordlist.find((w) => dv(w) === dv(q));
      return byVowel === undefined ? "" : byVowel;
    });
    return {
      slug: "vowel-spellchecker",
      title: "Vowel Spellchecker",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Google", "Amazon"],
      signature: { funcName: "spellchecker", params: [{ name: "wordlist", type: "string[]" as const }, { name: "queries", type: "string[]" as const }], returns: "string[]" as const },
      description: describe(
        "Build a spellchecker over a dictionary `wordlist`. For each word in `queries`, return the dictionary word it corrects to, applying these rules **in order of precedence**:\n\n1. **Exact match** — the query is in `wordlist` exactly (same case): return the query itself.\n2. **Capitalisation** — the query equals some dictionary word when both are lowercased: return the **first** such word in `wordlist`.\n3. **Vowel errors** — after lowercasing both, the query equals some dictionary word if each vowel (`a`, `e`, `i`, `o`, `u`) may be swapped for any vowel in place: return the **first** such word in `wordlist`.\n4. Otherwise return the empty string `\"\"`.\n\nReturn the list of corrections, one per query, in query order.",
        [
          { in: "wordlist = [\"Apple\",\"apply\",\"Orange\"], queries = [\"apple\",\"APPLY\",\"Apple\",\"upplo\",\"orangi\",\"pear\"]", out: "[\"Apple\",\"apply\",\"Apple\",\"Apple\",\"Orange\",\"\"]", note: "`apple` matches `Apple` ignoring case. `upplo` matches `Apple` up to vowels (`*ppl*`) — `apply` ends in `y`, which is not a vowel. Nothing resembles `pear`." },
          { in: "wordlist = [\"yellow\"], queries = [\"YellOw\",\"yollow\",\"yeellow\"]", out: "[\"yellow\",\"yellow\",\"\"]", note: "A vowel can be swapped but not inserted, so `yeellow` matches nothing." },
        ],
        ["1 <= wordlist.length, queries.length <= 5000", "1 <= wordlist[i].length, queries[i].length <= 7", "wordlist[i] and queries[i] hold English letters only"]),
      hints: [
        "Each rule is a lookup on a different normal form of the word: as-is, lowercased, and lowercased with vowels masked.",
        "Precompute three tables from the dictionary: a set of exact words, and two maps from a normal form to the first dictionary word with that form.",
        "When filling the maps, only insert a key the first time you see it, so the earliest dictionary word wins.",
      ],
      editorial: explain({
        idea: "Normalise words two ways — lowercase, and lowercase with every vowel replaced by `*` — and the three matching rules become three hash lookups, tried in precedence order.",
        steps: [
          "Put every dictionary word in an exact-match set.",
          "For each dictionary word in order, insert `lower(w) → w` and `devowel(lower(w)) → w` into two maps, only if the key is not already present.",
          "For each query: if it is in the exact set, answer it; else if `lower(q)` is in the first map, answer that; else if `devowel(lower(q))` is in the second map, answer that; else answer `\"\"`.",
        ],
        why: "Two words match under rule 2 exactly when their lowercase forms are equal, and under rule 3 exactly when their masked forms are equal (vowels are only swapped in place, so lengths and consonant positions must agree). Keeping the first insertion per key yields the first dictionary word for that form, and checking the rules in order applies the precedence.",
        time: "O((W + Q) · L)",
        space: "O(W · L)",
        pitfalls: [
          "Rule 1 is case-sensitive: `Apple` matches `Apple` exactly, but `apple` is not an exact match for it.",
          "Overwriting map entries makes the *last* dictionary word win instead of the first.",
          "Only vowels are masked — `y` is a consonant here.",
        ],
      }),
      examples: [
        { input: "[\"Apple\",\"apply\",\"Orange\"]\n[\"apple\",\"APPLY\",\"Apple\",\"upplo\",\"orangi\",\"pear\"]", expectedOutput: "[\"Apple\",\"apply\",\"Apple\",\"Apple\",\"Orange\",\"\"]" },
        { input: "[\"yellow\"]\n[\"YellOw\",\"yollow\",\"yeellow\"]", expectedOutput: "[\"yellow\",\"yellow\",\"\"]" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["aebc", "aeiobcd", "aeiouAEIOUbcBC", "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"]);
        const word = () => Array.from({ length: ri(rng, 1, pick(rng, [3, 5, 7])) }, () => alpha[ri(rng, 0, alpha.length - 1)]).join("");
        const w = ri(rng, 1, pick(rng, [1, 4, 10, 18]));
        const wordlist = Array.from({ length: w }, word);
        const q = ri(rng, 1, pick(rng, [2, 8, 20]));
        const vowels = "aeiouAEIOU";
        const queries: string[] = [];
        for (let i = 0; i < q; i++) {
          if (rng() < 0.65) {
            const out = pick(rng, wordlist).split("").map((c) => {
              let ch = c;
              if (vowels.includes(ch) && rng() < 0.4) ch = vowels[ri(rng, 0, 9)];
              if (rng() < 0.3) ch = rng() < 0.5 ? ch.toUpperCase() : ch.toLowerCase();
              return ch;
            });
            queries.push(out.join(""));
          } else {
            queries.push(word());
          }
        }
        return { input: `${fmtStrArr(wordlist)}\n${fmtStrArr(queries)}`, expectedOutput: fmtStrArr(ref(wordlist, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def spellchecker(wordlist: List[str], queries: List[str]) -> List[str]:
              def devowel(s):
                  return ''.join('*' if c in 'aeiou' else c for c in s)

              exact = set(wordlist)
              by_case = {}
              by_vowel = {}
              for w in wordlist:
                  low = w.lower()
                  by_case.setdefault(low, w)
                  by_vowel.setdefault(devowel(low), w)
              out = []
              for q in queries:
                  if q in exact:
                      out.append(q)
                      continue
                  low = q.lower()
                  if low in by_case:
                      out.append(by_case[low])
                  else:
                      out.append(by_vowel.get(devowel(low), ''))
              return out
        `,
        javascript: code`
          var spellchecker = function(wordlist, queries) {
              var devowel = function(s) { return s.replace(/[aeiou]/g, '*'); };
              var exact = new Set(wordlist);
              var byCase = new Map(), byVowel = new Map();
              for (var i = 0; i < wordlist.length; i++) {
                  var low = wordlist[i].toLowerCase();
                  if (!byCase.has(low)) byCase.set(low, wordlist[i]);
                  var dv = devowel(low);
                  if (!byVowel.has(dv)) byVowel.set(dv, wordlist[i]);
              }
              var out = [];
              for (var j = 0; j < queries.length; j++) {
                  var q = queries[j];
                  if (exact.has(q)) { out.push(q); continue; }
                  var lq = q.toLowerCase();
                  if (byCase.has(lq)) { out.push(byCase.get(lq)); continue; }
                  var dq = devowel(lq);
                  out.push(byVowel.has(dq) ? byVowel.get(dq) : '');
              }
              return out;
          };
        `,
        typescript: code`
          function spellchecker(wordlist: string[], queries: string[]): string[] {
              var devowel = function(s: string): string { return s.replace(/[aeiou]/g, '*'); };
              // Keys carry a '#' prefix so no word can collide with an Object builtin.
              var exact: { [w: string]: boolean } = {};
              var byCase: { [w: string]: string } = {};
              var byVowel: { [w: string]: string } = {};
              for (var i = 0; i < wordlist.length; i++) {
                  exact['#' + wordlist[i]] = true;
                  var low = '#' + wordlist[i].toLowerCase();
                  if (!(low in byCase)) byCase[low] = wordlist[i];
                  var dv = devowel(low);
                  if (!(dv in byVowel)) byVowel[dv] = wordlist[i];
              }
              var out: string[] = [];
              for (var j = 0; j < queries.length; j++) {
                  var q = queries[j];
                  if (exact['#' + q]) { out.push(q); continue; }
                  var lq = '#' + q.toLowerCase();
                  if (lq in byCase) { out.push(byCase[lq]); continue; }
                  var dq = devowel(lq);
                  out.push(dq in byVowel ? byVowel[dq] : '');
              }
              return out;
          }
        `,
        java: code`
          public static String[] spellchecker(String[] wordlist, String[] queries) {
              Set<String> exact = new HashSet<>(Arrays.asList(wordlist));
              Map<String, String> byCase = new HashMap<>();
              Map<String, String> byVowel = new HashMap<>();
              for (String w : wordlist) {
                  String low = w.toLowerCase();
                  byCase.putIfAbsent(low, w);
                  byVowel.putIfAbsent(devowel(low), w);
              }
              String[] out = new String[queries.length];
              for (int i = 0; i < queries.length; i++) {
                  String q = queries[i];
                  if (exact.contains(q)) { out[i] = q; continue; }
                  String low = q.toLowerCase();
                  if (byCase.containsKey(low)) { out[i] = byCase.get(low); continue; }
                  out[i] = byVowel.getOrDefault(devowel(low), "");
              }
              return out;
          }

          private static String devowel(String s) {
              char[] a = s.toCharArray();
              for (int i = 0; i < a.length; i++) if ("aeiou".indexOf(a[i]) >= 0) a[i] = '*';
              return new String(a);
          }
        `,
        cpp: code`
          static string devowelOf(const string& s) {
              string r = s;
              for (char& c : r) if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') c = '*';
              return r;
          }

          static string lowerOf(const string& s) {
              string r = s;
              for (char& c : r) c = (char)tolower((unsigned char)c);
              return r;
          }

          vector<string> spellchecker(vector<string>& wordlist, vector<string>& queries) {
              unordered_set<string> exact(wordlist.begin(), wordlist.end());
              unordered_map<string, string> byCase, byVowel;
              for (const string& w : wordlist) {
                  string low = lowerOf(w);
                  byCase.emplace(low, w);
                  byVowel.emplace(devowelOf(low), w);
              }
              vector<string> out;
              for (const string& q : queries) {
                  if (exact.count(q)) { out.push_back(q); continue; }
                  string low = lowerOf(q);
                  auto it = byCase.find(low);
                  if (it != byCase.end()) { out.push_back(it->second); continue; }
                  auto jt = byVowel.find(devowelOf(low));
                  out.push_back(jt != byVowel.end() ? jt->second : "");
              }
              return out;
          }
        `,
        c: code`
          static char** scKeys;

          static int scCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              int c = strcmp(scKeys[x], scKeys[y]);
              return c != 0 ? c : x - y;
          }

          /* Indices sorted by (key, index): the first hit of a key is its earliest word. */
          static int* scOrder(char** keys, int n) {
              int* o = (int*)malloc((n > 0 ? n : 1) * sizeof(int));
              for (int i = 0; i < n; i++) o[i] = i;
              scKeys = keys;
              qsort(o, n, sizeof(int), scCmp);
              return o;
          }

          static int scFind(char** keys, const int* order, int n, const char* key) {
              int lo = 0, hi = n;
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (strcmp(keys[order[mid]], key) < 0) lo = mid + 1; else hi = mid;
              }
              if (lo < n && strcmp(keys[order[lo]], key) == 0) return order[lo];
              return -1;
          }

          static char* scCopy(const char* s) {
              size_t n = strlen(s);
              char* r = (char*)malloc(n + 1);
              memcpy(r, s, n + 1);
              return r;
          }

          static char* scLower(const char* s) {
              char* r = scCopy(s);
              for (char* p = r; *p; p++) if (*p >= 'A' && *p <= 'Z') *p = (char)(*p + 32);
              return r;
          }

          static char* scDevowel(const char* s) {
              char* r = scLower(s);
              for (char* p = r; *p; p++) if (*p == 'a' || *p == 'e' || *p == 'i' || *p == 'o' || *p == 'u') *p = '*';
              return r;
          }

          char** spellchecker(char** wordlist, int wordlistSize, char** queries, int queriesSize, int* returnSize) {
              int n = wordlistSize;
              char** low = (char**)malloc(n * sizeof(char*));
              char** dev = (char**)malloc(n * sizeof(char*));
              for (int i = 0; i < n; i++) { low[i] = scLower(wordlist[i]); dev[i] = scDevowel(wordlist[i]); }
              int* oe = scOrder(wordlist, n);
              int* ol = scOrder(low, n);
              int* od = scOrder(dev, n);
              char** out = (char**)malloc((queriesSize > 0 ? queriesSize : 1) * sizeof(char*));
              for (int i = 0; i < queriesSize; i++) {
                  const char* q = queries[i];
                  if (scFind(wordlist, oe, n, q) >= 0) { out[i] = scCopy(q); continue; }
                  char* lq = scLower(q);
                  int j = scFind(low, ol, n, lq);
                  if (j >= 0) {
                      out[i] = scCopy(wordlist[j]);
                  } else {
                      char* dq = scDevowel(q);
                      j = scFind(dev, od, n, dq);
                      out[i] = scCopy(j >= 0 ? wordlist[j] : "");
                      free(dq);
                  }
                  free(lq);
              }
              for (int i = 0; i < n; i++) { free(low[i]); free(dev[i]); }
              free(low); free(dev); free(oe); free(ol); free(od);
              *returnSize = queriesSize;
              return out;
          }
        `,
        csharp: code`
          static string Devowel(string s)
          {
              var a = s.ToCharArray();
              for (int i = 0; i < a.Length; i++) if ("aeiou".IndexOf(a[i]) >= 0) a[i] = '*';
              return new string(a);
          }

          public static string[] Spellchecker(string[] wordlist, string[] queries)
          {
              var exact = new HashSet<string>(wordlist);
              var byCase = new Dictionary<string, string>();
              var byVowel = new Dictionary<string, string>();
              foreach (string w in wordlist)
              {
                  string low = w.ToLowerInvariant();
                  if (!byCase.ContainsKey(low)) byCase[low] = w;
                  string dv = Devowel(low);
                  if (!byVowel.ContainsKey(dv)) byVowel[dv] = w;
              }
              var result = new string[queries.Length];
              for (int i = 0; i < queries.Length; i++)
              {
                  string q = queries[i];
                  if (exact.Contains(q)) { result[i] = q; continue; }
                  string low = q.ToLowerInvariant();
                  string hit;
                  if (byCase.TryGetValue(low, out hit)) { result[i] = hit; continue; }
                  result[i] = byVowel.TryGetValue(Devowel(low), out hit) ? hit : "";
              }
              return result;
          }
        `,
        go: code`
          func devowel(s string) string {
              b := []byte(s)
              for i, c := range b {
                  if c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u' {
                      b[i] = '*'
                  }
              }
              return string(b)
          }

          func spellchecker(wordlist []string, queries []string) []string {
              exact := map[string]bool{}
              byCase := map[string]string{}
              byVowel := map[string]string{}
              for _, w := range wordlist {
                  exact[w] = true
                  low := strings.ToLower(w)
                  if _, ok := byCase[low]; !ok {
                      byCase[low] = w
                  }
                  dv := devowel(low)
                  if _, ok := byVowel[dv]; !ok {
                      byVowel[dv] = w
                  }
              }
              out := make([]string, len(queries))
              for i, q := range queries {
                  if exact[q] {
                      out[i] = q
                      continue
                  }
                  low := strings.ToLower(q)
                  if w, ok := byCase[low]; ok {
                      out[i] = w
                      continue
                  }
                  out[i] = byVowel[devowel(low)]
              }
              return out
          }
        `,
        kotlin: code`
          fun spellchecker(wordlist: Array<String>, queries: Array<String>): Array<String> {
              fun devowel(s: String): String = s.map { if (it in "aeiou") '*' else it }.joinToString("")
              val exact = wordlist.toHashSet()
              val byCase = HashMap<String, String>()
              val byVowel = HashMap<String, String>()
              for (w in wordlist) {
                  val low = w.toLowerCase()
                  if (!byCase.containsKey(low)) byCase[low] = w
                  val dv = devowel(low)
                  if (!byVowel.containsKey(dv)) byVowel[dv] = w
              }
              return Array(queries.size) { i ->
                  val q = queries[i]
                  if (q in exact) q
                  else {
                      val low = q.toLowerCase()
                      byCase[low] ?: (byVowel[devowel(low)] ?: "")
                  }
              }
          }
        `,
        swift: code`
          func spellchecker(_ wordlist: [String], _ queries: [String]) -> [String] {
              func devowel(_ s: String) -> String {
                  return String(s.map { "aeiou".contains($0) ? "*" : $0 })
              }
              let exact = Set(wordlist)
              var byCase = [String: String]()
              var byVowel = [String: String]()
              for w in wordlist {
                  let low = w.lowercased()
                  if byCase[low] == nil { byCase[low] = w }
                  let dv = devowel(low)
                  if byVowel[dv] == nil { byVowel[dv] = w }
              }
              var out = [String]()
              for q in queries {
                  if exact.contains(q) { out.append(q); continue }
                  let low = q.lowercased()
                  if let w = byCase[low] { out.append(w); continue }
                  out.append(byVowel[devowel(low)] ?? "")
              }
              return out
          }
        `,
        rust: code`
          use std::collections::{HashMap, HashSet};

          fn devowel(s: &str) -> String {
              s.chars().map(|c| if "aeiou".contains(c) { '*' } else { c }).collect()
          }

          fn spellchecker(wordlist: Vec<String>, queries: Vec<String>) -> Vec<String> {
              let exact: HashSet<String> = wordlist.iter().cloned().collect();
              let mut by_case: HashMap<String, String> = HashMap::new();
              let mut by_vowel: HashMap<String, String> = HashMap::new();
              for w in wordlist.iter() {
                  let low = w.to_lowercase();
                  by_vowel.entry(devowel(&low)).or_insert_with(|| w.clone());
                  by_case.entry(low).or_insert_with(|| w.clone());
              }
              let mut out = Vec::with_capacity(queries.len());
              for q in queries.iter() {
                  if exact.contains(q) {
                      out.push(q.clone());
                      continue;
                  }
                  let low = q.to_lowercase();
                  if let Some(w) = by_case.get(&low) {
                      out.push(w.clone());
                  } else if let Some(w) = by_vowel.get(&devowel(&low)) {
                      out.push(w.clone());
                  } else {
                      out.push(String::new());
                  }
              }
              out
          }
        `,
        php: code`
          function spellchecker($wordlist, $queries) {
              // Keys carry a '#' prefix so a numeric-looking word never becomes an int key.
              $exact = [];
              $byCase = [];
              $byVowel = [];
              foreach ($wordlist as $w) {
                  $exact['#' . $w] = true;
                  $low = strtolower($w);
                  if (!isset($byCase['#' . $low])) $byCase['#' . $low] = $w;
                  $dv = '#' . strtr($low, 'aeiou', '*****');
                  if (!isset($byVowel[$dv])) $byVowel[$dv] = $w;
              }
              $out = [];
              foreach ($queries as $q) {
                  if (isset($exact['#' . $q])) { $out[] = $q; continue; }
                  $low = strtolower($q);
                  if (isset($byCase['#' . $low])) { $out[] = $byCase['#' . $low]; continue; }
                  $dv = '#' . strtr($low, 'aeiou', '*****');
                  $out[] = isset($byVowel[$dv]) ? $byVowel[$dv] : '';
              }
              return $out;
          }
        `,
        ruby: code`
          require 'set'

          def spellchecker(wordlist, queries)
            exact = wordlist.to_set
            by_case = {}
            by_vowel = {}
            wordlist.each do |w|
              low = w.downcase
              by_case[low] ||= w
              by_vowel[low.tr('aeiou', '*')] ||= w
            end
            queries.map do |q|
              if exact.include?(q)
                q
              else
                low = q.downcase
                by_case[low] || by_vowel[low.tr('aeiou', '*')] || ''
              end
            end
          end
        `,
      },
    };
  })(),

  // ── Flip Columns For Maximum Number of Equal Rows (LC 1072) ─────
  (() => {
    const ref = (matrix: number[][]) => {
      // A set of flips can make rows a and b uniform together exactly when
      // b equals a or a's complement; count that for every row.
      let best = 0;
      for (const a of matrix) {
        let c = 0;
        for (const b of matrix) {
          const same = a.every((v, j) => v === b[j]);
          const comp = a.every((v, j) => v !== b[j]);
          if (same || comp) c++;
        }
        best = Math.max(best, c);
      }
      return best;
    };
    return {
      slug: "flip-columns-for-maximum-number-of-equal-rows",
      title: "Flip Columns For Maximum Number of Equal Rows",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Matrix", "Google"],
      signature: { funcName: "maxEqualRowsAfterFlips", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `m x n` binary `matrix`. You may choose any set of columns and flip every cell in them (each `0` becomes `1` and each `1` becomes `0`).\n\nA row is **uniform** when all of its cells hold the same value. Return the **maximum** number of rows that can be uniform at the same time after some choice of column flips.",
        [
          { in: "matrix = [[0,1],[1,1]]", out: "1", note: "Without flips the second row is already uniform. No choice makes both rows uniform." },
          { in: "matrix = [[0,1],[1,0]]", out: "2", note: "Flip the first column: the rows become `[1,1]` and `[0,0]`." },
          { in: "matrix = [[0,0,0],[0,0,1],[1,1,0]]", out: "2", note: "Flip the last column: the rows become `[0,0,1]`, `[0,0,0]` and `[1,1,1]`." },
        ],
        ["m == matrix.length", "n == matrix[i].length", "1 <= m, n <= 300", "matrix[i][j] is 0 or 1"]),
      hints: [
        "Once you fix the set of flipped columns, which rows end up uniform?",
        "Two rows can be uniform together only if they are identical or exact complements of each other.",
        "Normalise each row so it starts with 0 (complement it otherwise) and count the most common normalised row.",
      ],
      editorial: explain({
        idea: "Making a row uniform forces the exact set of columns to flip (up to flipping all of them). So rows that become uniform together share a *pattern*: they are equal or complementary. Normalising every row to start with 0 maps a row and its complement to the same key.",
        steps: [
          "For each row, if its first cell is 1, complement the whole row; otherwise keep it.",
          "Count identical normalised rows with a hash map (key: the row as a string or tuple).",
          "Return the largest count.",
        ],
        why: "Flipping exactly the columns where a row holds 1 makes it all zeros; the only other uniforming choice is the complementary set. A second row is uniform under the same flips exactly when it equals the first row (it becomes all zeros) or its complement (it becomes all ones). Both cases normalise to the same key, so the most frequent key is the largest set of rows that can be uniform together.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "Counting only identical rows misses complementary rows, which become uniform with the opposite value.",
          "Build the key from the whole row — comparing only a few cells or summing values conflates different patterns.",
        ],
      }),
      examples: [
        { input: "[[0,1],[1,1]]", expectedOutput: "1" },
        { input: "[[0,1],[1,0]]", expectedOutput: "2" },
        { input: "[[0,0,0],[0,0,1],[1,1,0]]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 4, 8, 12]));
        const n = ri(rng, 1, pick(rng, [1, 3, 6, 10]));
        const bases = Array.from({ length: ri(rng, 1, 3) }, () => Array.from({ length: n }, () => ri(rng, 0, 1)));
        const matrix: number[][] = [];
        for (let i = 0; i < m; i++) {
          if (rng() < 0.7) {
            const b = pick(rng, bases);
            matrix.push(rng() < 0.5 ? b.slice() : b.map((v) => 1 - v));
          } else {
            matrix.push(Array.from({ length: n }, () => ri(rng, 0, 1)));
          }
        }
        return { input: fmtIntMat(matrix), expectedOutput: String(ref(matrix)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def maxEqualRowsAfterFlips(matrix: List[List[int]]) -> int:
              seen = Counter()
              for row in matrix:
                  key = tuple(v ^ row[0] for v in row)
                  seen[key] += 1
              return max(seen.values())
        `,
        javascript: code`
          var maxEqualRowsAfterFlips = function(matrix) {
              var seen = new Map();
              var best = 0;
              for (var i = 0; i < matrix.length; i++) {
                  var row = matrix[i];
                  var key = '';
                  for (var j = 0; j < row.length; j++) key += (row[j] ^ row[0]);
                  var c = (seen.get(key) || 0) + 1;
                  seen.set(key, c);
                  if (c > best) best = c;
              }
              return best;
          };
        `,
        typescript: code`
          function maxEqualRowsAfterFlips(matrix: number[][]): number {
              var seen: { [k: string]: number } = {};
              var best = 0;
              for (var i = 0; i < matrix.length; i++) {
                  var row = matrix[i];
                  var key = 'k';
                  for (var j = 0; j < row.length; j++) key += (row[j] ^ row[0]);
                  var c = (seen[key] || 0) + 1;
                  seen[key] = c;
                  if (c > best) best = c;
              }
              return best;
          }
        `,
        java: code`
          public static int maxEqualRowsAfterFlips(int[][] matrix) {
              Map<String, Integer> seen = new HashMap<>();
              int best = 0;
              for (int[] row : matrix) {
                  char[] key = new char[row.length];
                  for (int j = 0; j < row.length; j++) key[j] = (char) ('0' + (row[j] ^ row[0]));
                  int c = seen.merge(new String(key), 1, Integer::sum);
                  best = Math.max(best, c);
              }
              return best;
          }
        `,
        cpp: code`
          int maxEqualRowsAfterFlips(vector<vector<int>>& matrix) {
              unordered_map<string, int> seen;
              int best = 0;
              for (auto& row : matrix) {
                  string key(row.size(), '0');
                  for (size_t j = 0; j < row.size(); j++) key[j] = (char)('0' + (row[j] ^ row[0]));
                  best = max(best, ++seen[key]);
              }
              return best;
          }
        `,
        c: code`
          static int feCols;

          static int feCmp(const void* a, const void* b) {
              return memcmp(*(char* const*)a, *(char* const*)b, (size_t)feCols);
          }

          int maxEqualRowsAfterFlips(int** matrix, int matrixSize, int* matrixColSize) {
              int m = matrixSize, n = matrixColSize[0];
              char** keys = (char**)malloc(m * sizeof(char*));
              for (int i = 0; i < m; i++) {
                  keys[i] = (char*)malloc(n);
                  for (int j = 0; j < n; j++) keys[i][j] = (char)(matrix[i][j] ^ matrix[i][0]);
              }
              feCols = n;
              qsort(keys, m, sizeof(char*), feCmp);
              int best = 0, run = 0;
              for (int i = 0; i < m; i++) {
                  run = (i > 0 && memcmp(keys[i], keys[i - 1], n) == 0) ? run + 1 : 1;
                  if (run > best) best = run;
              }
              for (int i = 0; i < m; i++) free(keys[i]);
              free(keys);
              return best;
          }
        `,
        csharp: code`
          public static int MaxEqualRowsAfterFlips(int[][] matrix)
          {
              var seen = new Dictionary<string, int>();
              int best = 0;
              foreach (var row in matrix)
              {
                  var key = new char[row.Length];
                  for (int j = 0; j < row.Length; j++) key[j] = (char)('0' + (row[j] ^ row[0]));
                  string k = new string(key);
                  int c;
                  seen.TryGetValue(k, out c);
                  seen[k] = ++c;
                  if (c > best) best = c;
              }
              return best;
          }
        `,
        go: code`
          func maxEqualRowsAfterFlips(matrix [][]int) int {
              seen := map[string]int{}
              best := 0
              for _, row := range matrix {
                  key := make([]byte, len(row))
                  for j, v := range row {
                      key[j] = byte('0' + (v ^ row[0]))
                  }
                  k := string(key)
                  seen[k]++
                  if seen[k] > best {
                      best = seen[k]
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxEqualRowsAfterFlips(matrix: Array<IntArray>): Int {
              val seen = HashMap<String, Int>()
              var best = 0
              for (row in matrix) {
                  val key = CharArray(row.size) { j -> '0' + (row[j] xor row[0]) }
                  val k = String(key)
                  val c = (seen[k] ?: 0) + 1
                  seen[k] = c
                  if (c > best) best = c
              }
              return best
          }
        `,
        swift: code`
          func maxEqualRowsAfterFlips(_ matrix: [[Int]]) -> Int {
              var seen = [[Int]: Int]()
              var best = 0
              for row in matrix {
                  let key = row.map { $0 ^ row[0] }
                  let c = (seen[key] ?? 0) + 1
                  seen[key] = c
                  if c > best { best = c }
              }
              return best
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn maxEqualRowsAfterFlips(matrix: Vec<Vec<i32>>) -> i32 {
              let mut seen: HashMap<Vec<i32>, i32> = HashMap::new();
              let mut best = 0;
              for row in matrix.iter() {
                  let key: Vec<i32> = row.iter().map(|&v| v ^ row[0]).collect();
                  let c = seen.entry(key).or_insert(0);
                  *c += 1;
                  if *c > best {
                      best = *c;
                  }
              }
              best
          }
        `,
        php: code`
          function maxEqualRowsAfterFlips($matrix) {
              $seen = [];
              $best = 0;
              foreach ($matrix as $row) {
                  $key = 'k';
                  foreach ($row as $v) $key .= ($v ^ $row[0]);
                  $seen[$key] = isset($seen[$key]) ? $seen[$key] + 1 : 1;
                  if ($seen[$key] > $best) $best = $seen[$key];
              }
              return $best;
          }
        `,
        ruby: code`
          def maxEqualRowsAfterFlips(matrix)
            seen = Hash.new(0)
            matrix.each do |row|
              seen[row.map { |v| v ^ row[0] }] += 1
            end
            seen.values.max
          end
        `,
      },
    };
  })(),

  // ── Maximum Equal Frequency (LC 1224) ───────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      for (let len = nums.length; len >= 1; len--) {
        const cnt = new Map<number, number>();
        for (let i = 0; i < len; i++) cnt.set(nums[i], (cnt.get(nums[i]) || 0) + 1);
        for (const v of Array.from(cnt.keys())) {
          const rest: number[] = [];
          for (const [u, c] of cnt) {
            const k = u === v ? c - 1 : c;
            if (k > 0) rest.push(k);
          }
          if (rest.every((k) => k === rest[0])) return len;
        }
      }
      return 0;
    };
    return {
      slug: "maximum-equal-frequency",
      title: "Maximum Equal Frequency",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Counting", "Amazon"],
      signature: { funcName: "maxEqualFreq", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of positive integers.\n\nReturn the length of the **longest prefix** of `nums` from which you can remove **exactly one** element so that every number still present in the prefix occurs the **same number of times**.\n\nIf removing that element leaves the prefix empty, it still counts: an empty selection has every (no) number occurring equally often.",
        [
          { in: "nums = [4,4,7,7,9,6,6,9]", out: "7", note: "The prefix `[4,4,7,7,9,6,6]` drops its single 9 to leave 4, 7 and 6 twice each. The whole array cannot work: two 9s already give every value two copies, and any removal breaks that." },
          { in: "nums = [5,5,5,8,8,8,2]", out: "7", note: "Remove the 2: both 5 and 8 then occur three times." },
          { in: "nums = [1,2]", out: "2", note: "Remove either element; the one left occurs once." },
        ],
        ["2 <= nums.length <= 10^5", "1 <= nums[i] <= 10^5"]),
      hints: [
        "Track, while scanning the prefix, how often each number occurs *and* how many numbers have each occurrence count.",
        "With `maxF` the largest occurrence count, only three shapes allow a single removal to equalise everything.",
        "The shapes: every count is 1; every number occurs `maxF` times except one number that occurs once; or one number occurs `maxF` times and every other number `maxF - 1` times. Each can be checked in O(1) with the two tables.",
      ],
      editorial: explain({
        idea: "Keep `cnt[x]` (occurrences of `x`) and `freq[c]` (how many numbers occur exactly `c` times) as the prefix grows. Whether a prefix of length `L` qualifies depends only on `maxF` and `freq`, through three O(1) tests.",
        steps: [
          "For each index `i`, move `nums[i]` from count `c` to `c + 1`: decrement `freq[c]`, increment `freq[c + 1]`, and update `maxF`.",
          "Let `L = i + 1`. The prefix qualifies if `maxF == 1` (remove any element), or `maxF * freq[maxF] == L - 1` (all numbers occur `maxF` times plus one stray element that occurs once — remove it), or `(maxF - 1) * (freq[maxF - 1] + 1) == L - 1` (one number occurs `maxF` times and the rest `maxF - 1` — remove one copy of it).",
          "Record the last qualifying `L`.",
        ],
        why: "Removing one element changes a single number's count by one. For the remaining counts to be equal, either the removed element was the only copy of its number (the others all share one count) or it reduced the unique maximum to match the rest. The two equations restate exactly those shapes as sums over `freq`: in each, the left side counts the elements that stay, so it must equal `L - 1`. All-ones is the degenerate case where any removal works.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Forgetting the single-distinct-number prefix (`[7,7,7]`): it is covered by the third test with `freq[maxF - 1] = 0`.",
          "Checking only the full array: the answer is the *longest* qualifying prefix, so test every length.",
          "Exactly one element must be removed — an array whose counts are already all equal (and not all 1) does not qualify as is.",
        ],
      }),
      examples: [
        { input: "[4,4,7,7,9,6,6,9]", expectedOutput: "7" },
        { input: "[5,5,5,8,8,8,2]", expectedOutput: "7" },
        { input: "[1,2]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const mode = ri(rng, 0, 2);
        let nums: number[];
        if (mode === 0) {
          const n = ri(rng, 2, pick(rng, [3, 10, 30]));
          const top = pick(rng, [1, 2, 3, 5, 100000]);
          nums = Array.from({ length: n }, () => ri(rng, 1, top));
        } else {
          // Equal-frequency blocks, then a stray or two, shuffled a little.
          const k = ri(rng, 1, 5), f = ri(rng, 1, 5);
          const vals = Array.from({ length: k }, () => ri(rng, 1, 100000));
          nums = [];
          for (const v of vals) for (let t = 0; t < f; t++) nums.push(v);
          shuffle(rng, nums);
          const extra = ri(rng, 0, 2);
          for (let t = 0; t < extra; t++) nums.push(rng() < 0.5 ? pick(rng, vals) : ri(rng, 1, 100000));
          if (mode === 2) nums.push(...Array.from({ length: ri(rng, 0, 4) }, () => pick(rng, vals)));
          if (nums.length < 2) nums.push(pick(rng, vals));
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxEqualFreq(nums: List[int]) -> int:
              cnt = {}
              freq = [0] * (len(nums) + 2)
              max_f = 0
              ans = 0
              for i, x in enumerate(nums):
                  c = cnt.get(x, 0)
                  if c:
                      freq[c] -= 1
                  c += 1
                  cnt[x] = c
                  freq[c] += 1
                  if c > max_f:
                      max_f = c
                  if (max_f == 1 or max_f * freq[max_f] == i
                          or (max_f - 1) * (freq[max_f - 1] + 1) == i):
                      ans = i + 1
              return ans
        `,
        javascript: code`
          var maxEqualFreq = function(nums) {
              var cnt = new Map();
              var freq = new Array(nums.length + 2).fill(0);
              var maxF = 0, ans = 0;
              for (var i = 0; i < nums.length; i++) {
                  var c = cnt.get(nums[i]) || 0;
                  if (c > 0) freq[c]--;
                  c++;
                  cnt.set(nums[i], c);
                  freq[c]++;
                  if (c > maxF) maxF = c;
                  if (maxF === 1 || maxF * freq[maxF] === i || (maxF - 1) * (freq[maxF - 1] + 1) === i) ans = i + 1;
              }
              return ans;
          };
        `,
        typescript: code`
          function maxEqualFreq(nums: number[]): number {
              var cnt: { [v: number]: number } = {};
              var freq: number[] = [];
              for (var z = 0; z < nums.length + 2; z++) freq.push(0);
              var maxF = 0, ans = 0;
              for (var i = 0; i < nums.length; i++) {
                  var c = cnt[nums[i]] || 0;
                  if (c > 0) freq[c]--;
                  c++;
                  cnt[nums[i]] = c;
                  freq[c]++;
                  if (c > maxF) maxF = c;
                  if (maxF === 1 || maxF * freq[maxF] === i || (maxF - 1) * (freq[maxF - 1] + 1) === i) ans = i + 1;
              }
              return ans;
          }
        `,
        java: code`
          public static int maxEqualFreq(int[] nums) {
              int n = nums.length;
              int[] cnt = new int[100001];
              int[] freq = new int[n + 2];
              int maxF = 0, ans = 0;
              for (int i = 0; i < n; i++) {
                  int c = cnt[nums[i]];
                  if (c > 0) freq[c]--;
                  c++;
                  cnt[nums[i]] = c;
                  freq[c]++;
                  maxF = Math.max(maxF, c);
                  if (maxF == 1 || maxF * freq[maxF] == i || (maxF - 1) * (freq[maxF - 1] + 1) == i) ans = i + 1;
              }
              return ans;
          }
        `,
        cpp: code`
          int maxEqualFreq(vector<int>& nums) {
              int n = nums.size();
              unordered_map<int, int> cnt;
              vector<int> freq(n + 2, 0);
              int maxF = 0, ans = 0;
              for (int i = 0; i < n; i++) {
                  int& c = cnt[nums[i]];
                  if (c > 0) freq[c]--;
                  c++;
                  freq[c]++;
                  maxF = max(maxF, c);
                  if (maxF == 1 || maxF * freq[maxF] == i || (maxF - 1) * (freq[maxF - 1] + 1) == i) ans = i + 1;
              }
              return ans;
          }
        `,
        c: code`
          int maxEqualFreq(int* nums, int numsSize) {
              int* cnt = (int*)calloc(100001, sizeof(int));
              int* freq = (int*)calloc(numsSize + 2, sizeof(int));
              int maxF = 0, ans = 0;
              for (int i = 0; i < numsSize; i++) {
                  int c = cnt[nums[i]];
                  if (c > 0) freq[c]--;
                  c++;
                  cnt[nums[i]] = c;
                  freq[c]++;
                  if (c > maxF) maxF = c;
                  if (maxF == 1 || maxF * freq[maxF] == i || (maxF - 1) * (freq[maxF - 1] + 1) == i) ans = i + 1;
              }
              free(cnt);
              free(freq);
              return ans;
          }
        `,
        csharp: code`
          public static int MaxEqualFreq(int[] nums)
          {
              int n = nums.Length;
              var cnt = new Dictionary<int, int>();
              var freq = new int[n + 2];
              int maxF = 0, ans = 0;
              for (int i = 0; i < n; i++)
              {
                  int c;
                  cnt.TryGetValue(nums[i], out c);
                  if (c > 0) freq[c]--;
                  c++;
                  cnt[nums[i]] = c;
                  freq[c]++;
                  if (c > maxF) maxF = c;
                  if (maxF == 1 || maxF * freq[maxF] == i || (maxF - 1) * (freq[maxF - 1] + 1) == i) ans = i + 1;
              }
              return ans;
          }
        `,
        go: code`
          func maxEqualFreq(nums []int) int {
              cnt := map[int]int{}
              freq := make([]int, len(nums)+2)
              maxF, ans := 0, 0
              for i, x := range nums {
                  c := cnt[x]
                  if c > 0 {
                      freq[c]--
                  }
                  c++
                  cnt[x] = c
                  freq[c]++
                  if c > maxF {
                      maxF = c
                  }
                  if maxF == 1 || maxF*freq[maxF] == i || (maxF-1)*(freq[maxF-1]+1) == i {
                      ans = i + 1
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun maxEqualFreq(nums: IntArray): Int {
              val cnt = HashMap<Int, Int>()
              val freq = IntArray(nums.size + 2)
              var maxF = 0
              var ans = 0
              for (i in nums.indices) {
                  var c = cnt[nums[i]] ?: 0
                  if (c > 0) freq[c]--
                  c++
                  cnt[nums[i]] = c
                  freq[c]++
                  if (c > maxF) maxF = c
                  if (maxF == 1 || maxF * freq[maxF] == i || (maxF - 1) * (freq[maxF - 1] + 1) == i) ans = i + 1
              }
              return ans
          }
        `,
        swift: code`
          func maxEqualFreq(_ nums: [Int]) -> Int {
              var cnt = [Int: Int]()
              var freq = [Int](repeating: 0, count: nums.count + 2)
              var maxF = 0, ans = 0
              for (i, x) in nums.enumerated() {
                  var c = cnt[x] ?? 0
                  if c > 0 { freq[c] -= 1 }
                  c += 1
                  cnt[x] = c
                  freq[c] += 1
                  if c > maxF { maxF = c }
                  if maxF == 1 || maxF * freq[maxF] == i || (maxF - 1) * (freq[maxF - 1] + 1) == i { ans = i + 1 }
              }
              return ans
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn maxEqualFreq(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut cnt: HashMap<i32, usize> = HashMap::new();
              let mut freq = vec![0usize; n + 2];
              let mut max_f = 0usize;
              let mut ans = 0usize;
              for (i, &x) in nums.iter().enumerate() {
                  let e = cnt.entry(x).or_insert(0);
                  if *e > 0 {
                      freq[*e] -= 1;
                  }
                  *e += 1;
                  let c = *e;
                  freq[c] += 1;
                  if c > max_f {
                      max_f = c;
                  }
                  if max_f == 1 || max_f * freq[max_f] == i || (max_f - 1) * (freq[max_f - 1] + 1) == i {
                      ans = i + 1;
                  }
              }
              ans as i32
          }
        `,
        php: code`
          function maxEqualFreq($nums) {
              $n = count($nums);
              $cnt = [];
              $freq = array_fill(0, $n + 2, 0);
              $maxF = 0;
              $ans = 0;
              for ($i = 0; $i < $n; $i++) {
                  $x = $nums[$i];
                  $c = isset($cnt[$x]) ? $cnt[$x] : 0;
                  if ($c > 0) $freq[$c]--;
                  $c++;
                  $cnt[$x] = $c;
                  $freq[$c]++;
                  if ($c > $maxF) $maxF = $c;
                  if ($maxF == 1 || $maxF * $freq[$maxF] == $i || ($maxF - 1) * ($freq[$maxF - 1] + 1) == $i) $ans = $i + 1;
              }
              return $ans;
          }
        `,
        ruby: code`
          def maxEqualFreq(nums)
            cnt = Hash.new(0)
            freq = Array.new(nums.length + 2, 0)
            max_f = 0
            ans = 0
            nums.each_with_index do |x, i|
              c = cnt[x]
              freq[c] -= 1 if c > 0
              c += 1
              cnt[x] = c
              freq[c] += 1
              max_f = c if c > max_f
              if max_f == 1 || max_f * freq[max_f] == i || (max_f - 1) * (freq[max_f - 1] + 1) == i
                ans = i + 1
              end
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Construct K Palindrome Strings (LC 1400) ────────────────────
  (() => {
    const ref = (s: string, k: number) => {
      const cnt = new Map<string, number>();
      for (const ch of s) cnt.set(ch, (cnt.get(ch) || 0) + 1);
      let odd = 0;
      for (const c of cnt.values()) if (c % 2 === 1) odd++;
      return k <= s.length && odd <= k;
    };
    return {
      slug: "construct-k-palindrome-strings",
      title: "Construct K Palindrome Strings",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Greedy", "Counting", "Uber"],
      signature: { funcName: "canConstruct", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "You are given a string `s` and an integer `k`.\n\nReturn `true` if you can use **every** character of `s` exactly once to build exactly `k` **non-empty** palindromes, and `false` otherwise. Characters may be rearranged freely across and within the palindromes.",
        [
          { in: "s = \"racecars\", k = 2", out: "true", note: "`e` and `s` occur an odd number of times, and each palindrome can hold one odd letter in its middle: for example `rcecr` and `asa`." },
          { in: "s = \"codekairo\", k = 3", out: "false", note: "Seven letters occur once each (c, d, e, k, a, i, r), and three palindromes can hold at most three of them in their centres." },
          { in: "s = \"abc\", k = 4", out: "false", note: "Three characters cannot fill four non-empty strings." },
        ],
        ["1 <= s.length <= 10^5", "s holds lowercase English letters", "1 <= k <= 10^5"]),
      hints: [
        "In a palindrome, at most one character can appear an odd number of times.",
        "Count the characters of `s` that occur an odd number of times — each of them needs its own palindrome.",
        "Beyond that, `k` palindromes need at least `k` characters. Are these two conditions enough?",
      ],
      editorial: explain({
        idea: "Each palindrome absorbs at most one odd-count character (its centre), so `odd <= k` is necessary; non-emptiness needs `k <= |s|`. Both together are also sufficient.",
        steps: [
          "Count each letter of `s`.",
          "Let `odd` be the number of letters with an odd count.",
          "Return `odd <= k && k <= s.length`.",
        ],
        why: "Necessity is clear from the two observations. For sufficiency, start with `odd` single-letter palindromes (one per odd letter, or one palindrome of any pair-built letters if `odd` is 0) and distribute the remaining letters as mirrored pairs around existing centres. While fewer than `k` palindromes exist, split off a new one: take one pair and form a two-letter palindrome, or a single letter from a pair — there are `|s| - odd` paired letters, enough to create `k - odd` extra non-empty palindromes when `k <= |s|`; splitting a pair into two singles keeps every string a palindrome.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting `k <= s.length` returns `true` for `s = \"a\", k = 2`.",
          "Comparing the number of *distinct* letters with `k` is wrong — only letters with an odd count matter.",
        ],
      }),
      examples: [
        { input: "\"racecars\"\n2", expectedOutput: "true" },
        { input: "\"codekairo\"\n3", expectedOutput: "false" },
        { input: "\"abc\"\n4", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcdef", "abcdefghijklmnopqrstuvwxyz"]);
        const n = ri(rng, 1, pick(rng, [1, 5, 15, 40]));
        const s = Array.from({ length: n }, () => alpha[ri(rng, 0, alpha.length - 1)]).join("");
        const k = rng() < 0.1 ? ri(rng, 1, 100000) : ri(rng, 1, n + 2);
        return { input: `"${s}"\n${k}`, expectedOutput: bool(ref(s, k)) };
      },
      solutions: {
        python: code`
          def canConstruct(s: str, k: int) -> bool:
              if k > len(s):
                  return False
              cnt = [0] * 26
              for ch in s:
                  cnt[ord(ch) - 97] += 1
              odd = sum(c & 1 for c in cnt)
              return odd <= k
        `,
        javascript: code`
          var canConstruct = function(s, k) {
              if (k > s.length) return false;
              var cnt = new Array(26).fill(0);
              for (var i = 0; i < s.length; i++) cnt[s.charCodeAt(i) - 97]++;
              var odd = 0;
              for (var j = 0; j < 26; j++) odd += cnt[j] & 1;
              return odd <= k;
          };
        `,
        typescript: code`
          function canConstruct(s: string, k: number): boolean {
              if (k > s.length) return false;
              var cnt: number[] = [];
              for (var z = 0; z < 26; z++) cnt.push(0);
              for (var i = 0; i < s.length; i++) cnt[s.charCodeAt(i) - 97]++;
              var odd = 0;
              for (var j = 0; j < 26; j++) odd += cnt[j] & 1;
              return odd <= k;
          }
        `,
        java: code`
          public static boolean canConstruct(String s, int k) {
              if (k > s.length()) return false;
              int[] cnt = new int[26];
              for (int i = 0; i < s.length(); i++) cnt[s.charAt(i) - 'a']++;
              int odd = 0;
              for (int c : cnt) odd += c & 1;
              return odd <= k;
          }
        `,
        cpp: code`
          bool canConstruct(string s, int k) {
              if (k > (int)s.size()) return false;
              int cnt[26] = {0};
              for (char ch : s) cnt[ch - 'a']++;
              int odd = 0;
              for (int c : cnt) odd += c & 1;
              return odd <= k;
          }
        `,
        c: code`
          bool canConstruct(const char* s, int k) {
              int n = (int)strlen(s);
              if (k > n) return false;
              int cnt[26] = {0};
              for (int i = 0; i < n; i++) cnt[s[i] - 'a']++;
              int odd = 0;
              for (int j = 0; j < 26; j++) odd += cnt[j] & 1;
              return odd <= k;
          }
        `,
        csharp: code`
          public static bool CanConstruct(string s, int k)
          {
              if (k > s.Length) return false;
              var cnt = new int[26];
              foreach (char ch in s) cnt[ch - 'a']++;
              int odd = 0;
              foreach (int c in cnt) odd += c & 1;
              return odd <= k;
          }
        `,
        go: code`
          func canConstruct(s string, k int) bool {
              if k > len(s) {
                  return false
              }
              cnt := [26]int{}
              for i := 0; i < len(s); i++ {
                  cnt[s[i]-'a']++
              }
              odd := 0
              for _, c := range cnt {
                  odd += c & 1
              }
              return odd <= k
          }
        `,
        kotlin: code`
          fun canConstruct(s: String, k: Int): Boolean {
              if (k > s.length) return false
              val cnt = IntArray(26)
              for (ch in s) cnt[ch - 'a']++
              var odd = 0
              for (c in cnt) odd += c and 1
              return odd <= k
          }
        `,
        swift: code`
          func canConstruct(_ s: String, _ k: Int) -> Bool {
              let bytes = Array(s.utf8)
              if k > bytes.count { return false }
              var cnt = [Int](repeating: 0, count: 26)
              for c in bytes { cnt[Int(c) - 97] += 1 }
              var odd = 0
              for c in cnt { odd += c & 1 }
              return odd <= k
          }
        `,
        rust: code`
          fn canConstruct(s: String, k: i32) -> bool {
              if k as usize > s.len() {
                  return false;
              }
              let mut cnt = [0i32; 26];
              for c in s.bytes() {
                  cnt[(c - b'a') as usize] += 1;
              }
              let odd: i32 = cnt.iter().map(|c| c & 1).sum();
              odd <= k
          }
        `,
        php: code`
          function canConstruct($s, $k) {
              if ($k > strlen($s)) return false;
              $odd = 0;
              foreach (count_chars($s, 1) as $c) $odd += $c & 1;
              return $odd <= $k;
          }
        `,
        ruby: code`
          def canConstruct(s, k)
            return false if k > s.length
            cnt = Array.new(26, 0)
            s.each_byte { |c| cnt[c - 97] += 1 }
            cnt.count(&:odd?) <= k
          end
        `,
      },
    };
  })(),

  // ── Making File Names Unique (LC 1487) ──────────────────────────
  (() => {
    const ref = (names: string[]) => {
      const used = new Set<string>();
      return names.map((name) => {
        let got = name;
        for (let k = 1; used.has(got); k++) got = `${name}(${k})`;
        used.add(got);
        return got;
      });
    };
    return {
      slug: "making-file-names-unique",
      title: "Making File Names Unique",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Microsoft", "Amazon"],
      signature: { funcName: "getFolderNames", params: [{ name: "names", type: "string[]" as const }], returns: "string[]" as const },
      description: describe(
        "You create `n` folders one after another; the `i`-th should be called `names[i]`.\n\nNo two folders may share a name. When the requested name is already taken, the system appends a suffix `(k)`, using the **smallest positive integer** `k` for which `name(k)` is still free.\n\nReturn the names the system actually assigns, in creation order.",
        [
          { in: "names = [\"doc\",\"doc\",\"doc(1)\",\"doc\"]", out: "[\"doc\",\"doc(1)\",\"doc(1)(1)\",\"doc(2)\"]", note: "The second `doc` becomes `doc(1)`. Then `doc(1)` is taken, so the third folder becomes `doc(1)(1)`. The last `doc` finds `doc(1)` taken and settles on `doc(2)`." },
          { in: "names = [\"gta\",\"gta(1)\",\"gta\",\"avalon\"]", out: "[\"gta\",\"gta(1)\",\"gta(2)\",\"avalon\"]", note: "`gta(1)` was requested directly, so the repeated `gta` skips to `gta(2)`." },
          { in: "names = [\"pes\",\"fifa\",\"pes(2019)\"]", out: "[\"pes\",\"fifa\",\"pes(2019)\"]", note: "No name repeats, so nothing changes." },
        ],
        ["1 <= names.length <= 5 * 10^4", "1 <= names[i].length <= 20", "names[i] holds lowercase English letters, digits and round brackets"]),
      hints: [
        "Keep every name assigned so far in a hash set; a repeated name then needs the first free `name(k)`.",
        "Trying `k = 1, 2, 3, ...` from scratch for every repeat can be quadratic when the same name repeats many times.",
        "Remember, per base name, the next `k` worth trying. Every suffix below it is already known to be taken.",
      ],
      editorial: explain({
        idea: "A hash map from a name to the next suffix to try both answers \"is this name taken?\" and lets every repeated name resume its search where the previous one stopped.",
        steps: [
          "For each requested `name`: if it is not in the map, assign it and store `map[name] = 1`.",
          "Otherwise start at `k = map[name]` and increase `k` while `name(k)` is in the map.",
          "Assign `name(k)`, set `map[name] = k + 1`, and add `name(k)` itself to the map with value 1 (it can be requested later as a base name too).",
        ],
        why: "Suffixes below `map[name]` were found taken earlier, and a taken name never becomes free, so skipping them is safe and the first free `k` found is the smallest. Each assigned name is a new key, so the total number of failed probes is bounded by the number of names in the map.",
        time: "O(n · L) amortised",
        space: "O(n · L)",
        pitfalls: [
          "Generated names must be recorded too — `doc(1)` created as a suffix blocks a later request for `doc(1)`.",
          "A requested name that already contains brackets (`doc(1)`) is still just a name: its own suffix is appended after it, giving `doc(1)(1)`.",
        ],
      }),
      examples: [
        { input: "[\"doc\",\"doc\",\"doc(1)\",\"doc\"]", expectedOutput: "[\"doc\",\"doc(1)\",\"doc(1)(1)\",\"doc(2)\"]" },
        { input: "[\"gta\",\"gta(1)\",\"gta\",\"avalon\"]", expectedOutput: "[\"gta\",\"gta(1)\",\"gta(2)\",\"avalon\"]" },
        { input: "[\"pes\",\"fifa\",\"pes(2019)\"]", expectedOutput: "[\"pes\",\"fifa\",\"pes(2019)\"]" },
      ],
      gen: (rng: Rng) => {
        const pool = pick(rng, [
          ["a"],
          ["a", "b"],
          ["a", "a(1)", "a(2)", "a(1)(1)"],
          ["x", "x(1)", "x(3)", "y", "y(1)", "x9", "x(1)(1)"],
          ["file", "file(1)", "file(2)", "img", "img(10)", "img(1)"],
        ]);
        const n = ri(rng, 1, pick(rng, [1, 6, 15, 40]));
        const names = Array.from({ length: n }, () => (rng() < 0.15 ? Array.from({ length: ri(rng, 1, 4) }, () => "abc12()"[ri(rng, 0, 6)]).join("") : pick(rng, pool)));
        return { input: fmtStrArr(names), expectedOutput: fmtStrArr(ref(names)) };
      },
      solutions: {
        python: code`
          from typing import List

          def getFolderNames(names: List[str]) -> List[str]:
              nxt = {}
              out = []
              for name in names:
                  if name not in nxt:
                      nxt[name] = 1
                      out.append(name)
                      continue
                  k = nxt[name]
                  while f"{name}({k})" in nxt:
                      k += 1
                  got = f"{name}({k})"
                  nxt[name] = k + 1
                  nxt[got] = 1
                  out.append(got)
              return out
        `,
        javascript: code`
          var getFolderNames = function(names) {
              var nxt = new Map();
              var out = [];
              for (var i = 0; i < names.length; i++) {
                  var name = names[i];
                  if (!nxt.has(name)) { nxt.set(name, 1); out.push(name); continue; }
                  var k = nxt.get(name);
                  while (nxt.has(name + '(' + k + ')')) k++;
                  var got = name + '(' + k + ')';
                  nxt.set(name, k + 1);
                  nxt.set(got, 1);
                  out.push(got);
              }
              return out;
          };
        `,
        typescript: code`
          function getFolderNames(names: string[]): string[] {
              // Keys carry a '#' prefix so no name can collide with an Object builtin.
              var nxt: { [k: string]: number } = {};
              var out: string[] = [];
              for (var i = 0; i < names.length; i++) {
                  var name = names[i];
                  if (!(('#' + name) in nxt)) { nxt['#' + name] = 1; out.push(name); continue; }
                  var k = nxt['#' + name];
                  while (('#' + name + '(' + k + ')') in nxt) k++;
                  var got = name + '(' + k + ')';
                  nxt['#' + name] = k + 1;
                  nxt['#' + got] = 1;
                  out.push(got);
              }
              return out;
          }
        `,
        java: code`
          public static String[] getFolderNames(String[] names) {
              Map<String, Integer> nxt = new HashMap<>();
              String[] out = new String[names.length];
              for (int i = 0; i < names.length; i++) {
                  String name = names[i];
                  Integer start = nxt.get(name);
                  if (start == null) { nxt.put(name, 1); out[i] = name; continue; }
                  int k = start;
                  while (nxt.containsKey(name + "(" + k + ")")) k++;
                  String got = name + "(" + k + ")";
                  nxt.put(name, k + 1);
                  nxt.put(got, 1);
                  out[i] = got;
              }
              return out;
          }
        `,
        cpp: code`
          vector<string> getFolderNames(vector<string>& names) {
              unordered_map<string, int> nxt;
              vector<string> out;
              for (const string& name : names) {
                  auto it = nxt.find(name);
                  if (it == nxt.end()) { nxt[name] = 1; out.push_back(name); continue; }
                  int k = it->second;
                  while (nxt.count(name + "(" + to_string(k) + ")")) k++;
                  string got = name + "(" + to_string(k) + ")";
                  nxt[name] = k + 1;
                  nxt[got] = 1;
                  out.push_back(got);
              }
              return out;
          }
        `,
        c: code`
          typedef struct { char* key; int val; } FnEntry;
          static FnEntry* fnTab;
          static int fnCap;

          static unsigned fnHash(const char* s) {
              unsigned h = 2166136261u;
              while (*s) { h ^= (unsigned char)*s++; h *= 16777619u; }
              return h;
          }

          /* Open addressing, linear probing: the slot holding key, or the empty slot it would take. */
          static int fnSlot(const char* key) {
              unsigned i = fnHash(key) & (unsigned)(fnCap - 1);
              while (fnTab[i].key && strcmp(fnTab[i].key, key) != 0) i = (i + 1) & (unsigned)(fnCap - 1);
              return (int)i;
          }

          static char* fnCopy(const char* s) {
              size_t n = strlen(s);
              char* r = (char*)malloc(n + 1);
              memcpy(r, s, n + 1);
              return r;
          }

          char** getFolderNames(char** names, int namesSize, int* returnSize) {
              fnCap = 16;
              while (fnCap < namesSize * 4) fnCap <<= 1;
              fnTab = (FnEntry*)calloc(fnCap, sizeof(FnEntry));
              char** out = (char**)malloc((namesSize > 0 ? namesSize : 1) * sizeof(char*));
              for (int i = 0; i < namesSize; i++) {
                  const char* name = names[i];
                  int s = fnSlot(name);
                  if (!fnTab[s].key) {
                      fnTab[s].key = fnCopy(name);
                      fnTab[s].val = 1;
                      out[i] = fnCopy(name);
                      continue;
                  }
                  int k = fnTab[s].val;
                  char* cand = (char*)malloc(strlen(name) + 16);
                  for (;;) {
                      sprintf(cand, "%s(%d)", name, k);
                      if (!fnTab[fnSlot(cand)].key) break;
                      k++;
                  }
                  fnTab[s].val = k + 1;
                  int c = fnSlot(cand);
                  fnTab[c].key = cand;
                  fnTab[c].val = 1;
                  out[i] = fnCopy(cand);
              }
              for (int i = 0; i < fnCap; i++) free(fnTab[i].key);
              free(fnTab);
              *returnSize = namesSize;
              return out;
          }
        `,
        csharp: code`
          public static string[] GetFolderNames(string[] names)
          {
              var nxt = new Dictionary<string, int>();
              var result = new string[names.Length];
              for (int i = 0; i < names.Length; i++)
              {
                  string name = names[i];
                  int k;
                  if (!nxt.TryGetValue(name, out k)) { nxt[name] = 1; result[i] = name; continue; }
                  while (nxt.ContainsKey(name + "(" + k + ")")) k++;
                  string got = name + "(" + k + ")";
                  nxt[name] = k + 1;
                  nxt[got] = 1;
                  result[i] = got;
              }
              return result;
          }
        `,
        go: code`
          func getFolderNames(names []string) []string {
              nxt := map[string]int{}
              out := make([]string, len(names))
              for i, name := range names {
                  k, ok := nxt[name]
                  if !ok {
                      nxt[name] = 1
                      out[i] = name
                      continue
                  }
                  got := fmt.Sprintf("%s(%d)", name, k)
                  for {
                      if _, taken := nxt[got]; !taken {
                          break
                      }
                      k++
                      got = fmt.Sprintf("%s(%d)", name, k)
                  }
                  nxt[name] = k + 1
                  nxt[got] = 1
                  out[i] = got
              }
              return out
          }
        `,
        kotlin: code`
          fun getFolderNames(names: Array<String>): Array<String> {
              val nxt = HashMap<String, Int>()
              return Array(names.size) { i ->
                  val name = names[i]
                  val start = nxt[name]
                  if (start == null) {
                      nxt[name] = 1
                      name
                  } else {
                      var k = start
                      while (nxt.containsKey(name + "(" + k + ")")) k++
                      val got = name + "(" + k + ")"
                      nxt[name] = k + 1
                      nxt[got] = 1
                      got
                  }
              }
          }
        `,
        swift: code`
          func getFolderNames(_ names: [String]) -> [String] {
              var nxt = [String: Int]()
              var out = [String]()
              for name in names {
                  guard var k = nxt[name] else {
                      nxt[name] = 1
                      out.append(name)
                      continue
                  }
                  while nxt["\(name)(\(k))"] != nil { k += 1 }
                  let got = "\(name)(\(k))"
                  nxt[name] = k + 1
                  nxt[got] = 1
                  out.append(got)
              }
              return out
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn getFolderNames(names: Vec<String>) -> Vec<String> {
              let mut nxt: HashMap<String, i32> = HashMap::new();
              let mut out = Vec::with_capacity(names.len());
              for name in names.into_iter() {
                  let start: Option<i32> = nxt.get(&name).cloned();
                  if start.is_none() {
                      nxt.insert(name.clone(), 1);
                      out.push(name);
                      continue;
                  }
                  let mut k = start.unwrap();
                  let mut got = format!("{}({})", name, k);
                  while nxt.contains_key(&got) {
                      k += 1;
                      got = format!("{}({})", name, k);
                  }
                  nxt.insert(name, k + 1);
                  nxt.insert(got.clone(), 1);
                  out.push(got);
              }
              out
          }
        `,
        php: code`
          function getFolderNames($names) {
              // Keys carry a '#' prefix so a numeric-looking name never becomes an int key.
              $nxt = [];
              $out = [];
              foreach ($names as $name) {
                  if (!isset($nxt['#' . $name])) {
                      $nxt['#' . $name] = 1;
                      $out[] = $name;
                      continue;
                  }
                  $k = $nxt['#' . $name];
                  while (isset($nxt['#' . $name . '(' . $k . ')'])) $k++;
                  $got = $name . '(' . $k . ')';
                  $nxt['#' . $name] = $k + 1;
                  $nxt['#' . $got] = 1;
                  $out[] = $got;
              }
              return $out;
          }
        `,
        ruby: code`
          def getFolderNames(names)
            nxt = {}
            names.map do |name|
              if nxt.key?(name)
                k = nxt[name]
                k += 1 while nxt.key?("#{name}(#{k})")
                got = "#{name}(#{k})"
                nxt[name] = k + 1
                nxt[got] = 1
                got
              else
                nxt[name] = 1
                name
              end
            end
          end
        `,
      },
    };
  })(),

  // ── Check If Array Pairs Are Divisible by k (LC 1497) ───────────
  (() => {
    const ref = (arr: number[], k: number) => {
      // Greedy matching by remainder class: any partner in the needed class
      // is as good as any other, so pairing first-come is exact.
      const waiting = new Map<number, number>();
      for (const x of arr) {
        const r = ((x % k) + k) % k;
        const need = (k - r) % k;
        if ((waiting.get(need) || 0) > 0) waiting.set(need, (waiting.get(need) as number) - 1);
        else waiting.set(r, (waiting.get(r) || 0) + 1);
      }
      for (const c of waiting.values()) if (c > 0) return false;
      return true;
    };
    return {
      slug: "check-if-array-pairs-are-divisible-by-k",
      title: "Check If Array Pairs Are Divisible by k",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Counting", "Google", "Amazon"],
      signature: { funcName: "canArrange", params: [{ name: "arr", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "You are given an integer array `arr` of **even** length `n` and an integer `k`.\n\nYou want to split `arr` into exactly `n / 2` pairs, every element in exactly one pair, such that the sum of each pair is divisible by `k`.\n\nReturn `true` if such a split exists, and `false` otherwise.",
        [
          { in: "arr = [-1,1,-2,2,3,7], k = 5", out: "true", note: "Pairs `(-1,1)`, `(-2,2)` and `(3,7)` sum to 0, 0 and 10, all divisible by 5." },
          { in: "arr = [4,4,4,6], k = 10", out: "false", note: "A 4 needs a partner leaving remainder 6, and there is only one 6 for three 4s." },
          { in: "arr = [5,5,5,5], k = 10", out: "true", note: "5 is exactly half of 10, so 5s pair with each other: `(5,5)` twice." },
        ],
        ["arr.length == n", "1 <= n <= 10^5", "n is even", "-10^9 <= arr[i] <= 10^9", "1 <= k <= 10^5"]),
      hints: [
        "Whether `a + b` is divisible by `k` depends only on `a mod k` and `b mod k`.",
        "An element with remainder `r` needs a partner with remainder `k - r`; remainder 0 needs another remainder 0.",
        "Count elements per remainder (taking care with negative numbers) and compare `count[r]` with `count[k - r]`.",
      ],
      editorial: explain({
        idea: "Reduce every element to its non-negative remainder modulo `k`. Remainders `r` and `k - r` must be matched one to one, and the self-paired classes (`0`, and `k / 2` when `k` is even) must each have an even size.",
        steps: [
          "Compute `r = ((x % k) + k) % k` for every element and count each remainder.",
          "If `count[0]` is odd, return false.",
          "For every other remainder `r`: if `2r == k`, require `count[r]` to be even; otherwise require `count[r] == count[k - r]`.",
          "Return true if every check passes.",
        ],
        why: "Two elements can pair only if their remainders add to 0 or `k`, so each class `r` can only pair with class `k - r`. When those classes are distinct, a perfect pairing exists exactly when their sizes match; when a class pairs with itself (`r = 0` or `r = k / 2`), it needs an even size. These classes partition the array, so the conditions together are necessary and sufficient.",
        time: "O(n)",
        space: "O(min(n, k))",
        pitfalls: [
          "In most languages `%` of a negative number is negative: `-1 % 5` is `-1`, so normalise with `((x % k) + k) % k`.",
          "Remainder `k / 2` for even `k` pairs with itself — comparing `count[r]` with `count[k - r]` there is trivially true and misses an odd count.",
          "With `k = 1` every sum is divisible, and every remainder is 0.",
        ],
      }),
      examples: [
        { input: "[-1,1,-2,2,3,7]\n5", expectedOutput: "true" },
        { input: "[4,4,4,6]\n10", expectedOutput: "false" },
        { input: "[5,5,5,5]\n10", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const k = pick(rng, [1, 2, 3, 4, 5, 10, 97, 100000, ri(rng, 1, 1000)]);
        const pairs = ri(rng, 1, pick(rng, [1, 3, 10, 25]));
        const big = pick(rng, [10, 1000, 1000000000]);
        const arr: number[] = [];
        const valid = rng() < 0.6;
        for (let p = 0; p < pairs; p++) {
          const a = ri(rng, -big, big);
          let b = valid ? -a + k * ri(rng, -3, 3) : ri(rng, -big, big);
          if (b > 1000000000 || b < -1000000000) b = -a;
          arr.push(a, b);
        }
        if (valid && rng() < 0.3) arr[ri(rng, 0, arr.length - 1)] += 1;
        shuffle(rng, arr);
        for (let i = 0; i < arr.length; i++) arr[i] = Math.max(-1000000000, Math.min(1000000000, arr[i]));
        return { input: `${fmtIntArr(arr)}\n${k}`, expectedOutput: bool(ref(arr, k)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def canArrange(arr: List[int], k: int) -> bool:
              cnt = Counter(x % k for x in arr)
              for r, c in cnt.items():
                  if r == 0 or 2 * r == k:
                      if c % 2:
                          return False
                  elif cnt.get(k - r, 0) != c:
                      return False
              return True
        `,
        javascript: code`
          var canArrange = function(arr, k) {
              var cnt = new Map();
              for (var i = 0; i < arr.length; i++) {
                  var r = ((arr[i] % k) + k) % k;
                  cnt.set(r, (cnt.get(r) || 0) + 1);
              }
              var ok = true;
              cnt.forEach(function(c, r) {
                  if (r === 0 || 2 * r === k) { if (c % 2 !== 0) ok = false; }
                  else if ((cnt.get(k - r) || 0) !== c) ok = false;
              });
              return ok;
          };
        `,
        typescript: code`
          function canArrange(arr: number[], k: number): boolean {
              var cnt: { [r: number]: number } = {};
              var keys: number[] = [];
              for (var i = 0; i < arr.length; i++) {
                  var r = ((arr[i] % k) + k) % k;
                  if (cnt[r] === undefined) { cnt[r] = 0; keys.push(r); }
                  cnt[r]++;
              }
              for (var j = 0; j < keys.length; j++) {
                  var q = keys[j], c = cnt[q];
                  if (q === 0 || 2 * q === k) { if (c % 2 !== 0) return false; }
                  else if ((cnt[k - q] || 0) !== c) return false;
              }
              return true;
          }
        `,
        java: code`
          public static boolean canArrange(int[] arr, int k) {
              Map<Integer, Integer> cnt = new HashMap<>();
              for (int x : arr) cnt.merge(((x % k) + k) % k, 1, Integer::sum);
              for (Map.Entry<Integer, Integer> e : cnt.entrySet()) {
                  int r = e.getKey(), c = e.getValue();
                  if (r == 0 || 2 * r == k) { if (c % 2 != 0) return false; }
                  else if (cnt.getOrDefault(k - r, 0) != c) return false;
              }
              return true;
          }
        `,
        cpp: code`
          bool canArrange(vector<int>& arr, int k) {
              unordered_map<int, int> cnt;
              for (int x : arr) cnt[((x % k) + k) % k]++;
              for (auto& e : cnt) {
                  int r = e.first, c = e.second;
                  if (r == 0 || 2 * r == k) { if (c % 2 != 0) return false; }
                  else {
                      auto it = cnt.find(k - r);
                      if (it == cnt.end() || it->second != c) return false;
                  }
              }
              return true;
          }
        `,
        c: code`
          bool canArrange(int* arr, int arrSize, int k) {
              int* cnt = (int*)calloc(k, sizeof(int));
              for (int i = 0; i < arrSize; i++) cnt[((arr[i] % k) + k) % k]++;
              bool ok = cnt[0] % 2 == 0;
              for (int r = 1; ok && r < k; r++) {
                  if (2 * r == k) { if (cnt[r] % 2 != 0) ok = false; }
                  else if (cnt[r] != cnt[k - r]) ok = false;
              }
              free(cnt);
              return ok;
          }
        `,
        csharp: code`
          public static bool CanArrange(int[] arr, int k)
          {
              var cnt = new Dictionary<int, int>();
              foreach (int x in arr)
              {
                  int r = ((x % k) + k) % k;
                  int c;
                  cnt.TryGetValue(r, out c);
                  cnt[r] = c + 1;
              }
              foreach (var e in cnt)
              {
                  int r = e.Key, c = e.Value;
                  if (r == 0 || 2 * r == k) { if (c % 2 != 0) return false; }
                  else
                  {
                      int other;
                      cnt.TryGetValue(k - r, out other);
                      if (other != c) return false;
                  }
              }
              return true;
          }
        `,
        go: code`
          func canArrange(arr []int, k int) bool {
              cnt := map[int]int{}
              for _, x := range arr {
                  cnt[((x%k)+k)%k]++
              }
              for r, c := range cnt {
                  if r == 0 || 2*r == k {
                      if c%2 != 0 {
                          return false
                      }
                  } else if cnt[k-r] != c {
                      return false
                  }
              }
              return true
          }
        `,
        kotlin: code`
          fun canArrange(arr: IntArray, k: Int): Boolean {
              val cnt = HashMap<Int, Int>()
              for (x in arr) {
                  val r = ((x % k) + k) % k
                  cnt[r] = (cnt[r] ?: 0) + 1
              }
              for ((r, c) in cnt) {
                  if (r == 0 || 2 * r == k) {
                      if (c % 2 != 0) return false
                  } else if ((cnt[k - r] ?: 0) != c) return false
              }
              return true
          }
        `,
        swift: code`
          func canArrange(_ arr: [Int], _ k: Int) -> Bool {
              var cnt = [Int: Int]()
              for x in arr { cnt[((x % k) + k) % k, default: 0] += 1 }
              for (r, c) in cnt {
                  if r == 0 || 2 * r == k {
                      if c % 2 != 0 { return false }
                  } else if (cnt[k - r] ?? 0) != c {
                      return false
                  }
              }
              return true
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn canArrange(arr: Vec<i32>, k: i32) -> bool {
              let mut cnt: HashMap<i32, i32> = HashMap::new();
              for &x in arr.iter() {
                  *cnt.entry(((x % k) + k) % k).or_insert(0) += 1;
              }
              for (&r, &c) in cnt.iter() {
                  if r == 0 || 2 * r == k {
                      if c % 2 != 0 {
                          return false;
                      }
                  } else if *cnt.get(&(k - r)).unwrap_or(&0) != c {
                      return false;
                  }
              }
              true
          }
        `,
        php: code`
          function canArrange($arr, $k) {
              $cnt = [];
              foreach ($arr as $x) {
                  $r = (($x % $k) + $k) % $k;
                  $cnt[$r] = isset($cnt[$r]) ? $cnt[$r] + 1 : 1;
              }
              foreach ($cnt as $r => $c) {
                  if ($r == 0 || 2 * $r == $k) {
                      if ($c % 2 != 0) return false;
                  } elseif ((isset($cnt[$k - $r]) ? $cnt[$k - $r] : 0) != $c) {
                      return false;
                  }
              }
              return true;
          }
        `,
        ruby: code`
          def canArrange(arr, k)
            cnt = Hash.new(0)
            arr.each { |x| cnt[x % k] += 1 }
            cnt.each do |r, c|
              if r == 0 || 2 * r == k
                return false if c.odd?
              elsif cnt[k - r] != c
                return false
              end
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Number of Ways Where Square of Number Is Equal to Product of Two Numbers (LC 1577)
  (() => {
    const ref = (a: number[], b: number[]) => {
      const side = (x: number[], y: number[]) => {
        let t = 0;
        for (const v of x) for (let j = 0; j < y.length; j++) for (let k = j + 1; k < y.length; k++) if (v * v === y[j] * y[k]) t++;
        return t;
      };
      return side(a, b) + side(b, a);
    };
    return {
      slug: "number-of-ways-where-square-of-number-is-equal-to-product-of-two-numbers",
      title: "Number of Ways Where Square of Number Is Equal to Product of Two Numbers",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Math", "Two Pointers", "Google"],
      signature: { funcName: "numTriplets", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given two arrays of positive integers, `nums1` and `nums2`. Count the triplets of these two types:\n\n- **Type 1:** `(i, j, k)` with `nums1[i]^2 == nums2[j] * nums2[k]`, where `0 <= i < nums1.length` and `0 <= j < k < nums2.length`.\n- **Type 2:** `(i, j, k)` with `nums2[i]^2 == nums1[j] * nums1[k]`, where `0 <= i < nums2.length` and `0 <= j < k < nums1.length`.\n\nReturn the total number of triplets of both types.",
        [
          { in: "nums1 = [4,6], nums2 = [2,8,3,12,1]", out: "2", note: "Type 1: 4² = 16 = 2 · 8 and 6² = 36 = 3 · 12. No square of `nums2` is the product of 4 and 6." },
          { in: "nums1 = [1,1], nums2 = [1,1,1]", out: "9", note: "Type 1: 2 choices of `i` times 3 pairs `(j, k)` = 6. Type 2: 3 choices of `i` times 1 pair = 3." },
          { in: "nums1 = [3], nums2 = [5]", out: "0", note: "Neither array has two elements to multiply." },
        ],
        ["1 <= nums1.length, nums2.length <= 1000", "1 <= nums1[i], nums2[i] <= 10^5"]),
      hints: [
        "The two types are the same question with the arrays swapped — solve one direction and call it twice.",
        "For a fixed square `s = x²`, you need the number of index pairs `j < k` in the other array with product `s`: a two-sum on products.",
        "Count the other array's values in a hash map. For each distinct value `v` with `v² < s` dividing `s`, add `count[v] · count[s / v]`; if `v² == s`, add `count[v] · (count[v] - 1) / 2`.",
      ],
      editorial: explain({
        idea: "Each type is a \"two-product\" count: for every square `s` from one array, count unordered pairs in the other array multiplying to `s`. A frequency map of the other array answers that by walking its distinct values `v` and looking up the partner `s / v`.",
        steps: [
          "Write `count(xs, ys)`: build a frequency map of `ys`.",
          "For each `x` in `xs`, let `s = x · x` (64-bit). For every distinct `v` in the map: if `v · v < s` and `s % v == 0`, add `freq[v] · freq[s / v]`; if `v · v == s`, add `freq[v] · (freq[v] - 1) / 2`.",
          "Return `count(nums1, nums2) + count(nums2, nums1)`.",
        ],
        why: "Restricting to `v < s / v` visits each unordered pair of distinct values once, and the product of their frequencies counts every index pair with those values. Pairs of equal values (`v = s / v`) are chosen within one bucket, `C(freq, 2)` ways. Every index pair `j < k` with `ys[j] · ys[k] = s` falls in exactly one of these cases.",
        time: "O(n · d1 + m · d2) with d the distinct counts",
        space: "O(n + m)",
        pitfalls: [
          "`x²` reaches 10^10 — keep it, and every product, in 64 bits.",
          "Counting ordered pairs (both `(v, w)` and `(w, v)`) doubles the answer.",
          "Equal values need `C(c, 2)` pairs, not `c²`.",
        ],
      }),
      examples: [
        { input: "[4,6]\n[2,8,3,12,1]", expectedOutput: "2" },
        { input: "[1,1]\n[1,1,1]", expectedOutput: "9" },
        { input: "[3]\n[5]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const mode = ri(rng, 0, 3);
        const vals = mode === 0 ? [1, 2, 4, 8, 16, 3, 6, 9, 12, 18, 27, 36]
          : mode === 1 ? [1, 2, 4]
          : mode === 2 ? [100000, 50000, 200000 / 4, 99999, 1]
          : [];
        const make = () => Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 12, 25])) }, () => (vals.length ? pick(rng, vals) : ri(rng, 1, 100000)));
        const a = make(), b = make();
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def numTriplets(nums1: List[int], nums2: List[int]) -> int:
              def count(xs, ys):
                  freq = Counter(ys)
                  total = 0
                  for x in xs:
                      s = x * x
                      for v, c in freq.items():
                          if v * v == s:
                              total += c * (c - 1) // 2
                          elif v * v < s and s % v == 0:
                              total += c * freq.get(s // v, 0)
                  return total

              return count(nums1, nums2) + count(nums2, nums1)
        `,
        javascript: code`
          var numTriplets = function(nums1, nums2) {
              var count = function(xs, ys) {
                  var freq = new Map();
                  for (var i = 0; i < ys.length; i++) freq.set(ys[i], (freq.get(ys[i]) || 0) + 1);
                  var keys = Array.from(freq.keys());
                  var total = 0;
                  for (var a = 0; a < xs.length; a++) {
                      var s = xs[a] * xs[a]; // at most 10^10: exact in a double
                      for (var b = 0; b < keys.length; b++) {
                          var v = keys[b], c = freq.get(v);
                          if (v * v === s) total += c * (c - 1) / 2;
                          else if (v * v < s && s % v === 0) total += c * (freq.get(s / v) || 0);
                      }
                  }
                  return total;
              };
              return count(nums1, nums2) + count(nums2, nums1);
          };
        `,
        typescript: code`
          function numTriplets(nums1: number[], nums2: number[]): number {
              var count = function(xs: number[], ys: number[]): number {
                  var freq: { [v: number]: number } = {};
                  var keys: number[] = [];
                  for (var i = 0; i < ys.length; i++) {
                      if (freq[ys[i]] === undefined) { freq[ys[i]] = 0; keys.push(ys[i]); }
                      freq[ys[i]]++;
                  }
                  var total = 0;
                  for (var a = 0; a < xs.length; a++) {
                      var s = xs[a] * xs[a]; // at most 10^10: exact in a double
                      for (var b = 0; b < keys.length; b++) {
                          var v = keys[b], c = freq[v];
                          if (v * v === s) total += c * (c - 1) / 2;
                          else if (v * v < s && s % v === 0) total += c * (freq[s / v] || 0);
                      }
                  }
                  return total;
              };
              return count(nums1, nums2) + count(nums2, nums1);
          }
        `,
        java: code`
          public static int numTriplets(int[] nums1, int[] nums2) {
              return (int) (countWays(nums1, nums2) + countWays(nums2, nums1));
          }

          private static long countWays(int[] xs, int[] ys) {
              Map<Long, Long> freq = new HashMap<>();
              for (int y : ys) freq.merge((long) y, 1L, Long::sum);
              long total = 0;
              for (int x : xs) {
                  long s = (long) x * x;
                  for (Map.Entry<Long, Long> e : freq.entrySet()) {
                      long v = e.getKey(), c = e.getValue();
                      if (v * v == s) total += c * (c - 1) / 2;
                      else if (v * v < s && s % v == 0) total += c * freq.getOrDefault(s / v, 0L);
                  }
              }
              return total;
          }
        `,
        cpp: code`
          static long long countWays(const vector<int>& xs, const vector<int>& ys) {
              unordered_map<long long, long long> freq;
              for (int y : ys) freq[y]++;
              long long total = 0;
              for (int x : xs) {
                  long long s = (long long)x * x;
                  for (auto& e : freq) {
                      long long v = e.first, c = e.second;
                      if (v * v == s) total += c * (c - 1) / 2;
                      else if (v * v < s && s % v == 0) {
                          auto it = freq.find(s / v);
                          if (it != freq.end()) total += c * it->second;
                      }
                  }
              }
              return total;
          }

          int numTriplets(vector<int>& nums1, vector<int>& nums2) {
              return (int)(countWays(nums1, nums2) + countWays(nums2, nums1));
          }
        `,
        c: code`
          static int ntCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          /* Distinct values of ys ascending with their counts; for each square, walk v <= s / v. */
          static long long countWays(const int* xs, int xn, const int* ys, int yn) {
              int* s = (int*)malloc(yn * sizeof(int));
              memcpy(s, ys, yn * sizeof(int));
              qsort(s, yn, sizeof(int), ntCmp);
              long long* val = (long long*)malloc(yn * sizeof(long long));
              long long* cnt = (long long*)malloc(yn * sizeof(long long));
              int d = 0;
              for (int i = 0; i < yn; i++) {
                  if (d > 0 && val[d - 1] == s[i]) cnt[d - 1]++;
                  else { val[d] = s[i]; cnt[d] = 1; d++; }
              }
              long long total = 0;
              for (int i = 0; i < xn; i++) {
                  long long sq = (long long)xs[i] * xs[i];
                  for (int j = 0; j < d; j++) {
                      long long v = val[j];
                      if (v * v > sq) break;
                      if (sq % v != 0) continue;
                      long long w = sq / v;
                      if (w == v) { total += cnt[j] * (cnt[j] - 1) / 2; continue; }
                      int lo = j + 1, hi = d;
                      while (lo < hi) {
                          int mid = (lo + hi) / 2;
                          if (val[mid] < w) lo = mid + 1; else hi = mid;
                      }
                      if (lo < d && val[lo] == w) total += cnt[j] * cnt[lo];
                  }
              }
              free(s); free(val); free(cnt);
              return total;
          }

          int numTriplets(int* nums1, int nums1Size, int* nums2, int nums2Size) {
              return (int)(countWays(nums1, nums1Size, nums2, nums2Size) + countWays(nums2, nums2Size, nums1, nums1Size));
          }
        `,
        csharp: code`
          static long CountWays(int[] xs, int[] ys)
          {
              var freq = new Dictionary<long, long>();
              foreach (int y in ys)
              {
                  long c;
                  freq.TryGetValue(y, out c);
                  freq[y] = c + 1;
              }
              long total = 0;
              foreach (int x in xs)
              {
                  long s = (long)x * x;
                  foreach (var e in freq)
                  {
                      long v = e.Key, c = e.Value;
                      if (v * v == s) total += c * (c - 1) / 2;
                      else if (v * v < s && s % v == 0)
                      {
                          long w;
                          if (freq.TryGetValue(s / v, out w)) total += c * w;
                      }
                  }
              }
              return total;
          }

          public static int NumTriplets(int[] nums1, int[] nums2)
          {
              return (int)(CountWays(nums1, nums2) + CountWays(nums2, nums1));
          }
        `,
        go: code`
          func countWays(xs []int, ys []int) int {
              freq := map[int]int{}
              for _, y := range ys {
                  freq[y]++
              }
              total := 0
              for _, x := range xs {
                  s := x * x
                  for v, c := range freq {
                      if v*v == s {
                          total += c * (c - 1) / 2
                      } else if v*v < s && s%v == 0 {
                          total += c * freq[s/v]
                      }
                  }
              }
              return total
          }

          func numTriplets(nums1 []int, nums2 []int) int {
              return countWays(nums1, nums2) + countWays(nums2, nums1)
          }
        `,
        kotlin: code`
          fun countWays(xs: IntArray, ys: IntArray): Long {
              val freq = HashMap<Long, Long>()
              for (y in ys) freq[y.toLong()] = (freq[y.toLong()] ?: 0L) + 1L
              var total = 0L
              for (x in xs) {
                  val s = x.toLong() * x
                  for ((v, c) in freq) {
                      if (v * v == s) total += c * (c - 1) / 2
                      else if (v * v < s && s % v == 0L) total += c * (freq[s / v] ?: 0L)
                  }
              }
              return total
          }

          fun numTriplets(nums1: IntArray, nums2: IntArray): Int {
              return (countWays(nums1, nums2) + countWays(nums2, nums1)).toInt()
          }
        `,
        swift: code`
          func countWays(_ xs: [Int], _ ys: [Int]) -> Int {
              var freq = [Int: Int]()
              for y in ys { freq[y, default: 0] += 1 }
              var total = 0
              for x in xs {
                  let s = x * x
                  for (v, c) in freq {
                      if v * v == s { total += c * (c - 1) / 2 }
                      else if v * v < s && s % v == 0 { total += c * (freq[s / v] ?? 0) }
                  }
              }
              return total
          }

          func numTriplets(_ nums1: [Int], _ nums2: [Int]) -> Int {
              return countWays(nums1, nums2) + countWays(nums2, nums1)
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn count_ways(xs: &Vec<i32>, ys: &Vec<i32>) -> i64 {
              let mut freq: HashMap<i64, i64> = HashMap::new();
              for &y in ys.iter() {
                  *freq.entry(y as i64).or_insert(0) += 1;
              }
              let mut total = 0i64;
              for &x in xs.iter() {
                  let s = x as i64 * x as i64;
                  for (&v, &c) in freq.iter() {
                      if v * v == s {
                          total += c * (c - 1) / 2;
                      } else if v * v < s && s % v == 0 {
                          total += c * *freq.get(&(s / v)).unwrap_or(&0);
                      }
                  }
              }
              total
          }

          fn numTriplets(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {
              (count_ways(&nums1, &nums2) + count_ways(&nums2, &nums1)) as i32
          }
        `,
        php: code`
          function countWays($xs, $ys) {
              $freq = array_count_values($ys);
              $total = 0;
              foreach ($xs as $x) {
                  $s = $x * $x;
                  foreach ($freq as $v => $c) {
                      if ($v * $v == $s) $total += intdiv($c * ($c - 1), 2);
                      elseif ($v * $v < $s && $s % $v == 0) {
                          $w = intdiv($s, $v);
                          if (isset($freq[$w])) $total += $c * $freq[$w];
                      }
                  }
              }
              return $total;
          }

          function numTriplets($nums1, $nums2) {
              return countWays($nums1, $nums2) + countWays($nums2, $nums1);
          }
        `,
        ruby: code`
          def count_ways(xs, ys)
            freq = Hash.new(0)
            ys.each { |y| freq[y] += 1 }
            total = 0
            xs.each do |x|
              s = x * x
              freq.each do |v, c|
                if v * v == s
                  total += c * (c - 1) / 2
                elsif v * v < s && s % v == 0
                  total += c * freq[s / v]
                end
              end
            end
            total
          end

          def numTriplets(nums1, nums2)
            count_ways(nums1, nums2) + count_ways(nums2, nums1)
          end
        `,
      },
    };
  })(),

  // ── Finding the Users Active Minutes (LC 1817) ──────────────────
  (() => {
    const ref = (logs: number[][], k: number) => {
      const mins = new Map<number, Set<number>>();
      for (const [id, t] of logs) {
        if (!mins.has(id)) mins.set(id, new Set());
        (mins.get(id) as Set<number>).add(t);
      }
      const ans = new Array(k).fill(0);
      for (const s of mins.values()) ans[s.size - 1]++;
      return ans;
    };
    return {
      slug: "finding-the-users-active-minutes",
      title: "Finding the Users Active Minutes",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Twitter"],
      signature: { funcName: "findingUsersActiveMinutes", params: [{ name: "logs", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "You are given the activity `logs` of a site, where `logs[i] = [ID, time]` records that the user with `ID` took an action at minute `time`. Several users may act in the same minute, and one user may act several times in the same minute.\n\nA user's **active minutes** (UAM) is the number of **distinct** minutes in which that user took at least one action.\n\nReturn an array `answer` of length `k` (1-indexed by UAM) where `answer[j - 1]` is the number of users whose UAM equals `j`. It is guaranteed that every user's UAM is at most `k`.",
        [
          { in: "logs = [[3,10],[3,10],[7,1],[3,11],[7,1]], k = 3", out: "[1,1,0]", note: "User 3 acted in minutes 10 and 11 (UAM 2); the repeat in minute 10 counts once. User 7 acted only in minute 1 (UAM 1)." },
          { in: "logs = [[1,1],[2,2],[2,3]], k = 4", out: "[1,1,0,0]", note: "User 1 has UAM 1 and user 2 has UAM 2; no user reaches 3 or 4." },
          { in: "logs = [[5,4]], k = 1", out: "[1]" },
        ],
        ["1 <= logs.length <= 10^4", "0 <= ID <= 10^9", "1 <= time <= 10^5", "k is in the range [the maximum UAM of any user, 10^5]"]),
      hints: [
        "A user's UAM is the size of the *set* of minutes they appear with.",
        "Map each user ID to a set of minutes in one pass over the logs.",
        "Then bucket the users by the size of their set into an array of length `k`.",
      ],
      editorial: explain({
        idea: "Group the logs by user and deduplicate the minutes with a set: the set's size is the UAM. A final pass histograms those sizes.",
        steps: [
          "Build a map `ID → set of minutes` from the logs.",
          "Create `answer` of length `k` filled with zeros.",
          "For each user, increment `answer[size - 1]`.",
        ],
        why: "The set keeps exactly the distinct minutes of each user, so its size is the UAM by definition, and every user is counted in exactly one bucket.",
        time: "O(L)",
        space: "O(L)",
        pitfalls: [
          "Repeated actions in the same minute must not inflate the UAM — count distinct minutes.",
          "The answer is indexed from UAM 1, so a user with UAM `j` goes to index `j - 1`.",
          "IDs reach 10^9: key a map by them rather than indexing an array.",
        ],
      }),
      examples: [
        { input: "[[3,10],[3,10],[7,1],[3,11],[7,1]]\n3", expectedOutput: "[1,1,0]" },
        { input: "[[1,1],[2,2],[2,3]]\n4", expectedOutput: "[1,1,0,0]" },
        { input: "[[5,4]]\n1", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const users = Array.from({ length: ri(rng, 1, pick(rng, [1, 3, 8])) }, () => (rng() < 0.3 ? ri(rng, 0, 1000000000) : ri(rng, 0, 20)));
        const tmax = pick(rng, [1, 3, 10, 100000]);
        const n = ri(rng, 1, pick(rng, [1, 6, 20, 50]));
        const logs = Array.from({ length: n }, () => [pick(rng, users), ri(rng, 1, tmax)]);
        let maxU = 0;
        const r0 = ref(logs, n);
        for (let j = 0; j < r0.length; j++) if (r0[j] > 0) maxU = j + 1;
        const k = maxU + ri(rng, 0, 3);
        return { input: `${fmtIntMat(logs)}\n${k}`, expectedOutput: fmtIntArr(ref(logs, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findingUsersActiveMinutes(logs: List[List[int]], k: int) -> List[int]:
              mins = {}
              for uid, t in logs:
                  mins.setdefault(uid, set()).add(t)
              ans = [0] * k
              for s in mins.values():
                  ans[len(s) - 1] += 1
              return ans
        `,
        javascript: code`
          var findingUsersActiveMinutes = function(logs, k) {
              var mins = new Map();
              for (var i = 0; i < logs.length; i++) {
                  var id = logs[i][0];
                  if (!mins.has(id)) mins.set(id, new Set());
                  mins.get(id).add(logs[i][1]);
              }
              var ans = new Array(k).fill(0);
              mins.forEach(function(s) { ans[s.size - 1]++; });
              return ans;
          };
        `,
        typescript: code`
          function findingUsersActiveMinutes(logs: number[][], k: number): number[] {
              // One key per (user, minute) pair, then one count per user.
              var seen: { [key: string]: boolean } = {};
              var uam: { [id: number]: number } = {};
              var ids: number[] = [];
              for (var i = 0; i < logs.length; i++) {
                  var id = logs[i][0];
                  var key = id + ':' + logs[i][1];
                  if (seen[key]) continue;
                  seen[key] = true;
                  if (uam[id] === undefined) { uam[id] = 0; ids.push(id); }
                  uam[id]++;
              }
              var ans: number[] = [];
              for (var z = 0; z < k; z++) ans.push(0);
              for (var j = 0; j < ids.length; j++) ans[uam[ids[j]] - 1]++;
              return ans;
          }
        `,
        java: code`
          public static int[] findingUsersActiveMinutes(int[][] logs, int k) {
              Map<Integer, Set<Integer>> mins = new HashMap<>();
              for (int[] log : logs) mins.computeIfAbsent(log[0], x -> new HashSet<>()).add(log[1]);
              int[] ans = new int[k];
              for (Set<Integer> s : mins.values()) ans[s.size() - 1]++;
              return ans;
          }
        `,
        cpp: code`
          vector<int> findingUsersActiveMinutes(vector<vector<int>>& logs, int k) {
              unordered_map<int, unordered_set<int>> mins;
              for (auto& log : logs) mins[log[0]].insert(log[1]);
              vector<int> ans(k, 0);
              for (auto& e : mins) ans[e.second.size() - 1]++;
              return ans;
          }
        `,
        c: code`
          static int uamCmp(const void* a, const void* b) {
              const long long x = *(const long long*)a, y = *(const long long*)b;
              return (x > y) - (x < y);
          }

          int* findingUsersActiveMinutes(int** logs, int logsSize, int* logsColSize, int k, int* returnSize) {
              /* Sort (ID, minute) pairs packed into one key; distinct keys per ID are its UAM. */
              long long* keys = (long long*)malloc(logsSize * sizeof(long long));
              for (int i = 0; i < logsSize; i++) keys[i] = (long long)logs[i][0] * 200000LL + logs[i][1];
              qsort(keys, logsSize, sizeof(long long), uamCmp);
              int* ans = (int*)calloc(k, sizeof(int));
              int run = 0;
              for (int i = 0; i < logsSize; i++) {
                  if (i > 0 && keys[i] == keys[i - 1]) continue;
                  if (i > 0 && keys[i] / 200000LL != keys[i - 1] / 200000LL) { ans[run - 1]++; run = 0; }
                  run++;
              }
              ans[run - 1]++;
              free(keys);
              *returnSize = k;
              return ans;
          }
        `,
        csharp: code`
          public static int[] FindingUsersActiveMinutes(int[][] logs, int k)
          {
              var mins = new Dictionary<int, HashSet<int>>();
              foreach (var log in logs)
              {
                  HashSet<int> s;
                  if (!mins.TryGetValue(log[0], out s)) { s = new HashSet<int>(); mins[log[0]] = s; }
                  s.Add(log[1]);
              }
              var ans = new int[k];
              foreach (var s in mins.Values) ans[s.Count - 1]++;
              return ans;
          }
        `,
        go: code`
          func findingUsersActiveMinutes(logs [][]int, k int) []int {
              mins := map[int]map[int]bool{}
              for _, log := range logs {
                  if mins[log[0]] == nil {
                      mins[log[0]] = map[int]bool{}
                  }
                  mins[log[0]][log[1]] = true
              }
              ans := make([]int, k)
              for _, s := range mins {
                  ans[len(s)-1]++
              }
              return ans
          }
        `,
        kotlin: code`
          fun findingUsersActiveMinutes(logs: Array<IntArray>, k: Int): IntArray {
              val mins = HashMap<Int, HashSet<Int>>()
              for (log in logs) mins.getOrPut(log[0]) { HashSet() }.add(log[1])
              val ans = IntArray(k)
              for (s in mins.values) ans[s.size - 1]++
              return ans
          }
        `,
        swift: code`
          func findingUsersActiveMinutes(_ logs: [[Int]], _ k: Int) -> [Int] {
              var mins = [Int: Set<Int>]()
              for log in logs { mins[log[0], default: Set<Int>()].insert(log[1]) }
              var ans = [Int](repeating: 0, count: k)
              for s in mins.values { ans[s.count - 1] += 1 }
              return ans
          }
        `,
        rust: code`
          use std::collections::{HashMap, HashSet};

          fn findingUsersActiveMinutes(logs: Vec<Vec<i32>>, k: i32) -> Vec<i32> {
              let mut mins: HashMap<i32, HashSet<i32>> = HashMap::new();
              for log in logs.iter() {
                  mins.entry(log[0]).or_insert_with(HashSet::new).insert(log[1]);
              }
              let mut ans = vec![0i32; k as usize];
              for s in mins.values() {
                  ans[s.len() - 1] += 1;
              }
              ans
          }
        `,
        php: code`
          function findingUsersActiveMinutes($logs, $k) {
              $mins = [];
              foreach ($logs as $log) $mins[$log[0]][$log[1]] = true;
              $ans = array_fill(0, $k, 0);
              foreach ($mins as $s) $ans[count($s) - 1]++;
              return $ans;
          }
        `,
        ruby: code`
          require 'set'

          def findingUsersActiveMinutes(logs, k)
            mins = Hash.new { |h, key| h[key] = Set.new }
            logs.each { |id, t| mins[id] << t }
            ans = Array.new(k, 0)
            mins.each_value { |s| ans[s.size - 1] += 1 }
            ans
          end
        `,
      },
    };
  })(),

  // ── Minimum Operations to Make the Array Alternating (LC 2170) ──
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      const cands = Array.from(new Set(nums.concat([0])));
      let best = Infinity;
      for (const a of cands) for (const b of cands) {
        if (a === b) continue;
        let ops = 0;
        for (let i = 0; i < n; i++) if (nums[i] !== (i % 2 === 0 ? a : b)) ops++;
        best = Math.min(best, ops);
      }
      return n === 1 ? 0 : best;
    };
    return {
      slug: "minimum-operations-to-make-the-array-alternating",
      title: "Minimum Operations to Make the Array Alternating",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Greedy", "Counting", "Amazon"],
      signature: { funcName: "minimumOperations", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of `n` positive integers.\n\nThe array is **alternating** when:\n\n- `nums[i - 2] == nums[i]` for every `2 <= i < n`, and\n- `nums[i - 1] != nums[i]` for every `1 <= i < n`.\n\nIn one operation you may change any element to any positive integer. Return the **minimum** number of operations needed to make the array alternating.",
        [
          { in: "nums = [5,9,5,9,5,2]", out: "1", note: "Change the last element to 9, giving `[5,9,5,9,5,9]`." },
          { in: "nums = [7,7,7,7]", out: "2", note: "The even positions can stay 7, but the odd positions must differ from them: change both to, say, 1." },
          { in: "nums = [4]", out: "0", note: "A single element is already alternating." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^5"]),
      hints: [
        "An alternating array is fully described by two values: `a` on the even indices and `b` on the odd indices, with `a != b`.",
        "For a chosen `(a, b)`, the cost is the number of even positions not equal to `a` plus odd positions not equal to `b` — so pick the most frequent value on each side.",
        "If both sides' most frequent values coincide, one side has to settle for its second most frequent value (or a value that is not there at all). Keep the top two of each side.",
      ],
      editorial: explain({
        idea: "Keeping as many elements as possible means choosing the most common value among even indices and among odd indices. The only conflict is when those two values are equal; then the better of the two \"second choices\" decides.",
        steps: [
          "Count values at even indices and at odd indices separately.",
          "Find the top two (value, count) pairs on each side, using count 0 for a missing second choice.",
          "If the two top values differ, keep both: answer `n - e1 - o1`.",
          "Otherwise answer `n - max(e1 + o2, e2 + o1)`.",
        ],
        why: "The kept elements are exactly the even positions equal to `a` plus the odd positions equal to `b`, and those two counts are independent except for the constraint `a != b`. Without a clash, each side's maximum is optimal. With a clash, at least one side must give up its top value, and the best it can then keep is its second-best count (a value absent from that side keeps 0, which the 0 default covers).",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Only the top value per side is not enough — the clash case needs the runner-up.",
          "With a single element there are no odd positions; the answer is 0.",
          "The two sides may be forced to different values even if neither side has a second value: changing every odd element to a fresh value costs all of them.",
        ],
      }),
      examples: [
        { input: "[5,9,5,9,5,2]", expectedOutput: "1" },
        { input: "[7,7,7,7]", expectedOutput: "2" },
        { input: "[4]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 8, 20, 40]));
        const top = pick(rng, [1, 2, 3, 5, 100000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def minimumOperations(nums: List[int]) -> int:
              n = len(nums)
              def top2(vals):
                  best = Counter(vals).most_common(2)
                  while len(best) < 2:
                      best.append((0, 0))
                  return best
              (ev, e1), (_, e2) = top2(nums[0::2])
              (ov, o1), (_, o2) = top2(nums[1::2])
              if ev != ov:
                  return n - e1 - o1
              return n - max(e1 + o2, e2 + o1)
        `,
        javascript: code`
          var minimumOperations = function(nums) {
              var n = nums.length;
              var top2 = function(start) {
                  var cnt = new Map();
                  for (var i = start; i < n; i += 2) cnt.set(nums[i], (cnt.get(nums[i]) || 0) + 1);
                  var v1 = 0, c1 = 0, c2 = 0;
                  cnt.forEach(function(c, v) {
                      if (c > c1) { c2 = c1; c1 = c; v1 = v; }
                      else if (c > c2) c2 = c;
                  });
                  return [v1, c1, c2];
              };
              var e = top2(0), o = top2(1);
              if (e[0] !== o[0]) return n - e[1] - o[1];
              return n - Math.max(e[1] + o[2], e[2] + o[1]);
          };
        `,
        typescript: code`
          function minimumOperations(nums: number[]): number {
              var n = nums.length;
              var top2 = function(start: number): number[] {
                  var cnt: { [v: number]: number } = {};
                  var keys: number[] = [];
                  for (var i = start; i < n; i += 2) {
                      if (cnt[nums[i]] === undefined) { cnt[nums[i]] = 0; keys.push(nums[i]); }
                      cnt[nums[i]]++;
                  }
                  var v1 = 0, c1 = 0, c2 = 0;
                  for (var j = 0; j < keys.length; j++) {
                      var c = cnt[keys[j]];
                      if (c > c1) { c2 = c1; c1 = c; v1 = keys[j]; }
                      else if (c > c2) c2 = c;
                  }
                  return [v1, c1, c2];
              };
              var e = top2(0), o = top2(1);
              if (e[0] !== o[0]) return n - e[1] - o[1];
              return n - Math.max(e[1] + o[2], e[2] + o[1]);
          }
        `,
        java: code`
          public static int minimumOperations(int[] nums) {
              int n = nums.length;
              int[] e = top2(nums, 0), o = top2(nums, 1);
              if (e[0] != o[0]) return n - e[1] - o[1];
              return n - Math.max(e[1] + o[2], e[2] + o[1]);
          }

          private static int[] top2(int[] nums, int start) {
              Map<Integer, Integer> cnt = new HashMap<>();
              for (int i = start; i < nums.length; i += 2) cnt.merge(nums[i], 1, Integer::sum);
              int v1 = 0, c1 = 0, c2 = 0;
              for (Map.Entry<Integer, Integer> en : cnt.entrySet()) {
                  int c = en.getValue();
                  if (c > c1) { c2 = c1; c1 = c; v1 = en.getKey(); }
                  else if (c > c2) c2 = c;
              }
              return new int[] { v1, c1, c2 };
          }
        `,
        cpp: code`
          static array<int, 3> top2(const vector<int>& nums, int start) {
              unordered_map<int, int> cnt;
              for (size_t i = start; i < nums.size(); i += 2) cnt[nums[i]]++;
              int v1 = 0, c1 = 0, c2 = 0;
              for (auto& e : cnt) {
                  if (e.second > c1) { c2 = c1; c1 = e.second; v1 = e.first; }
                  else if (e.second > c2) c2 = e.second;
              }
              return {v1, c1, c2};
          }

          int minimumOperations(vector<int>& nums) {
              int n = nums.size();
              auto e = top2(nums, 0), o = top2(nums, 1);
              if (e[0] != o[0]) return n - e[1] - o[1];
              return n - max(e[1] + o[2], e[2] + o[1]);
          }
        `,
        c: code`
          static void top2(const int* nums, int n, int start, int* cnt, int* v1, int* c1, int* c2) {
              *v1 = 0; *c1 = 0; *c2 = 0;
              for (int i = start; i < n; i += 2) cnt[nums[i]]++;
              for (int i = start; i < n; i += 2) {
                  int v = nums[i], c = cnt[v];
                  if (c < 0) continue; /* value already ranked */
                  if (c > *c1) { *c2 = *c1; *c1 = c; *v1 = v; }
                  else if (c > *c2) *c2 = c;
                  cnt[v] = -1;
              }
              for (int i = start; i < n; i += 2) cnt[nums[i]] = 0;
          }

          int minimumOperations(int* nums, int numsSize) {
              int* cnt = (int*)calloc(100001, sizeof(int));
              int ev, e1, e2, ov, o1, o2;
              top2(nums, numsSize, 0, cnt, &ev, &e1, &e2);
              top2(nums, numsSize, 1, cnt, &ov, &o1, &o2);
              free(cnt);
              if (ev != ov) return numsSize - e1 - o1;
              int keep = e1 + o2 > e2 + o1 ? e1 + o2 : e2 + o1;
              return numsSize - keep;
          }
        `,
        csharp: code`
          static int[] Top2(int[] nums, int start)
          {
              var cnt = new Dictionary<int, int>();
              for (int i = start; i < nums.Length; i += 2)
              {
                  int c;
                  cnt.TryGetValue(nums[i], out c);
                  cnt[nums[i]] = c + 1;
              }
              int v1 = 0, c1 = 0, c2 = 0;
              foreach (var e in cnt)
              {
                  if (e.Value > c1) { c2 = c1; c1 = e.Value; v1 = e.Key; }
                  else if (e.Value > c2) c2 = e.Value;
              }
              return new[] { v1, c1, c2 };
          }

          public static int MinimumOperations(int[] nums)
          {
              int n = nums.Length;
              var e = Top2(nums, 0);
              var o = Top2(nums, 1);
              if (e[0] != o[0]) return n - e[1] - o[1];
              return n - Math.Max(e[1] + o[2], e[2] + o[1]);
          }
        `,
        go: code`
          func top2(nums []int, start int) (int, int, int) {
              cnt := map[int]int{}
              for i := start; i < len(nums); i += 2 {
                  cnt[nums[i]]++
              }
              v1, c1, c2 := 0, 0, 0
              for v, c := range cnt {
                  if c > c1 {
                      c2, c1, v1 = c1, c, v
                  } else if c > c2 {
                      c2 = c
                  }
              }
              return v1, c1, c2
          }

          func minimumOperations(nums []int) int {
              n := len(nums)
              ev, e1, e2 := top2(nums, 0)
              ov, o1, o2 := top2(nums, 1)
              if ev != ov {
                  return n - e1 - o1
              }
              keep := e1 + o2
              if e2+o1 > keep {
                  keep = e2 + o1
              }
              return n - keep
          }
        `,
        kotlin: code`
          fun top2(nums: IntArray, start: Int): IntArray {
              val cnt = HashMap<Int, Int>()
              var i = start
              while (i < nums.size) {
                  cnt[nums[i]] = (cnt[nums[i]] ?: 0) + 1
                  i += 2
              }
              var v1 = 0
              var c1 = 0
              var c2 = 0
              for ((v, c) in cnt) {
                  if (c > c1) { c2 = c1; c1 = c; v1 = v }
                  else if (c > c2) c2 = c
              }
              return intArrayOf(v1, c1, c2)
          }

          fun minimumOperations(nums: IntArray): Int {
              val n = nums.size
              val e = top2(nums, 0)
              val o = top2(nums, 1)
              if (e[0] != o[0]) return n - e[1] - o[1]
              return n - maxOf(e[1] + o[2], e[2] + o[1])
          }
        `,
        swift: code`
          func top2(_ nums: [Int], _ start: Int) -> (Int, Int, Int) {
              var cnt = [Int: Int]()
              var i = start
              while i < nums.count {
                  cnt[nums[i], default: 0] += 1
                  i += 2
              }
              var v1 = 0, c1 = 0, c2 = 0
              for (v, c) in cnt {
                  if c > c1 { c2 = c1; c1 = c; v1 = v }
                  else if c > c2 { c2 = c }
              }
              return (v1, c1, c2)
          }

          func minimumOperations(_ nums: [Int]) -> Int {
              let n = nums.count
              let (ev, e1, e2) = top2(nums, 0)
              let (ov, o1, o2) = top2(nums, 1)
              if ev != ov { return n - e1 - o1 }
              return n - max(e1 + o2, e2 + o1)
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn top2(nums: &Vec<i32>, start: usize) -> (i32, i32, i32) {
              let mut cnt: HashMap<i32, i32> = HashMap::new();
              let mut i = start;
              while i < nums.len() {
                  *cnt.entry(nums[i]).or_insert(0) += 1;
                  i += 2;
              }
              let (mut v1, mut c1, mut c2) = (0, 0, 0);
              for (&v, &c) in cnt.iter() {
                  if c > c1 {
                      c2 = c1;
                      c1 = c;
                      v1 = v;
                  } else if c > c2 {
                      c2 = c;
                  }
              }
              (v1, c1, c2)
          }

          fn minimumOperations(nums: Vec<i32>) -> i32 {
              let n = nums.len() as i32;
              let (ev, e1, e2) = top2(&nums, 0);
              let (ov, o1, o2) = top2(&nums, 1);
              if ev != ov {
                  return n - e1 - o1;
              }
              n - std::cmp::max(e1 + o2, e2 + o1)
          }
        `,
        php: code`
          function top2($nums, $start) {
              $cnt = [];
              for ($i = $start; $i < count($nums); $i += 2) {
                  $cnt[$nums[$i]] = isset($cnt[$nums[$i]]) ? $cnt[$nums[$i]] + 1 : 1;
              }
              $v1 = 0; $c1 = 0; $c2 = 0;
              foreach ($cnt as $v => $c) {
                  if ($c > $c1) { $c2 = $c1; $c1 = $c; $v1 = $v; }
                  elseif ($c > $c2) $c2 = $c;
              }
              return [$v1, $c1, $c2];
          }

          function minimumOperations($nums) {
              $n = count($nums);
              $e = top2($nums, 0);
              $o = top2($nums, 1);
              if ($e[0] != $o[0]) return $n - $e[1] - $o[1];
              return $n - max($e[1] + $o[2], $e[2] + $o[1]);
          }
        `,
        ruby: code`
          def top2(vals)
            cnt = Hash.new(0)
            vals.each { |v| cnt[v] += 1 }
            v1 = 0
            c1 = 0
            c2 = 0
            cnt.each do |v, c|
              if c > c1
                c2 = c1
                c1 = c
                v1 = v
              elsif c > c2
                c2 = c
              end
            end
            [v1, c1, c2]
          end

          def minimumOperations(nums)
            n = nums.length
            ev, e1, e2 = top2(nums.each_slice(2).map(&:first))
            ov, o1, o2 = top2(nums.each_slice(2).map { |p| p[1] }.compact)
            return n - e1 - o1 if ev != ov
            n - [e1 + o2, e2 + o1].max
          end
        `,
      },
    };
  })(),

  // ── Most Frequent Number Following Key In an Array (LC 2190) ────
  (() => {
    const counts = (nums: number[], key: number) => {
      const cnt = new Map<number, number>();
      for (let i = 0; i + 1 < nums.length; i++) if (nums[i] === key) cnt.set(nums[i + 1], (cnt.get(nums[i + 1]) || 0) + 1);
      return cnt;
    };
    const ref = (nums: number[], key: number) => {
      let best = -1, bestC = 0;
      for (const [v, c] of counts(nums, key)) if (c > bestC) { bestC = c; best = v; }
      return best;
    };
    const unique = (nums: number[], key: number) => {
      const cs = Array.from(counts(nums, key).values());
      if (cs.length === 0) return false;
      const m = Math.max(...cs);
      return cs.filter((c) => c === m).length === 1;
    };
    return {
      slug: "most-frequent-number-following-key-in-an-array",
      title: "Most Frequent Number Following Key In an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Counting", "Google"],
      signature: { funcName: "mostFrequent", params: [{ name: "nums", type: "int[]" as const }, { name: "key", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and an integer `key` that occurs in `nums`.\n\nFor every distinct value `target` in `nums`, count the indices `i` with `0 <= i <= nums.length - 2`, `nums[i] == key` and `nums[i + 1] == target` — that is, how often `target` comes **immediately after** an occurrence of `key`.\n\nReturn the `target` with the **maximum** count. The input guarantees that this target is unique.",
        [
          { in: "nums = [3,8,3,8,3,5], key = 3", out: "8", note: "The values right after a 3 are 8, 8 and 5, so 8 follows the key twice." },
          { in: "nums = [9,9,9,4], key = 9", out: "9", note: "After the 9s come 9, 9 and 4: the key can follow itself." },
          { in: "nums = [6,1], key = 6", out: "1" },
        ],
        ["2 <= nums.length <= 1000", "1 <= nums[i] <= 1000", "key occurs in nums", "the answer is unique"]),
      hints: [
        "Only the element right after each occurrence of `key` matters.",
        "Walk the array once and, whenever `nums[i] == key`, count `nums[i + 1]`.",
        "Return the value with the largest count — values are at most 1000, so an array of counters works.",
      ],
      editorial: explain({
        idea: "A single scan of adjacent pairs `(nums[i], nums[i + 1])` collects exactly the values that follow `key`; the most counted one is the answer.",
        steps: [
          "Create counters for the values 1–1000.",
          "For `i` from 0 to `n - 2`, if `nums[i] == key`, increment `count[nums[i + 1]]`.",
          "Return the value with the largest count.",
        ],
        why: "Each index `i` contributes to exactly one target — the element after it — and only when `nums[i]` is the key, which is precisely the definition of the count. Uniqueness of the maximum makes the answer well defined.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Stop at `n - 2`: the last element has no successor.",
          "Count what *follows* the key, not the key's own occurrences.",
        ],
      }),
      examples: [
        { input: "[3,8,3,8,3,5]\n3", expectedOutput: "8" },
        { input: "[9,9,9,4]\n9", expectedOutput: "9" },
        { input: "[6,1]\n6", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        for (;;) {
          const n = ri(rng, 2, pick(rng, [2, 6, 15, 40]));
          const top = pick(rng, [2, 3, 5, 1000]);
          const nums = Array.from({ length: n }, () => ri(rng, 1, top));
          const key = nums[ri(rng, 0, n - 2)];
          if (unique(nums, key)) return { input: `${fmtIntArr(nums)}\n${key}`, expectedOutput: String(ref(nums, key)) };
        }
      },
      solutions: {
        python: code`
          from typing import List

          def mostFrequent(nums: List[int], key: int) -> int:
              cnt = [0] * 1001
              for i in range(len(nums) - 1):
                  if nums[i] == key:
                      cnt[nums[i + 1]] += 1
              return max(range(1001), key=lambda v: cnt[v])
        `,
        javascript: code`
          var mostFrequent = function(nums, key) {
              var cnt = new Array(1001).fill(0);
              var best = 0;
              for (var i = 0; i + 1 < nums.length; i++) {
                  if (nums[i] !== key) continue;
                  var t = nums[i + 1];
                  cnt[t]++;
                  if (cnt[t] > cnt[best]) best = t;
              }
              return best;
          };
        `,
        typescript: code`
          function mostFrequent(nums: number[], key: number): number {
              var cnt: number[] = [];
              for (var z = 0; z <= 1000; z++) cnt.push(0);
              var best = 0;
              for (var i = 0; i + 1 < nums.length; i++) {
                  if (nums[i] !== key) continue;
                  var t = nums[i + 1];
                  cnt[t]++;
                  if (cnt[t] > cnt[best]) best = t;
              }
              return best;
          }
        `,
        java: code`
          public static int mostFrequent(int[] nums, int key) {
              int[] cnt = new int[1001];
              int best = 0;
              for (int i = 0; i + 1 < nums.length; i++) {
                  if (nums[i] != key) continue;
                  int t = nums[i + 1];
                  cnt[t]++;
                  if (cnt[t] > cnt[best]) best = t;
              }
              return best;
          }
        `,
        cpp: code`
          int mostFrequent(vector<int>& nums, int key) {
              vector<int> cnt(1001, 0);
              int best = 0;
              for (size_t i = 0; i + 1 < nums.size(); i++) {
                  if (nums[i] != key) continue;
                  int t = nums[i + 1];
                  if (++cnt[t] > cnt[best]) best = t;
              }
              return best;
          }
        `,
        c: code`
          int mostFrequent(int* nums, int numsSize, int key) {
              int cnt[1001] = {0};
              int best = 0;
              for (int i = 0; i + 1 < numsSize; i++) {
                  if (nums[i] != key) continue;
                  int t = nums[i + 1];
                  if (++cnt[t] > cnt[best]) best = t;
              }
              return best;
          }
        `,
        csharp: code`
          public static int MostFrequent(int[] nums, int key)
          {
              var cnt = new int[1001];
              int best = 0;
              for (int i = 0; i + 1 < nums.Length; i++)
              {
                  if (nums[i] != key) continue;
                  int t = nums[i + 1];
                  if (++cnt[t] > cnt[best]) best = t;
              }
              return best;
          }
        `,
        go: code`
          func mostFrequent(nums []int, key int) int {
              cnt := make([]int, 1001)
              best := 0
              for i := 0; i+1 < len(nums); i++ {
                  if nums[i] != key {
                      continue
                  }
                  t := nums[i+1]
                  cnt[t]++
                  if cnt[t] > cnt[best] {
                      best = t
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun mostFrequent(nums: IntArray, key: Int): Int {
              val cnt = IntArray(1001)
              var best = 0
              for (i in 0 until nums.size - 1) {
                  if (nums[i] != key) continue
                  val t = nums[i + 1]
                  cnt[t]++
                  if (cnt[t] > cnt[best]) best = t
              }
              return best
          }
        `,
        swift: code`
          func mostFrequent(_ nums: [Int], _ key: Int) -> Int {
              var cnt = [Int](repeating: 0, count: 1001)
              var best = 0
              for i in 0..<(nums.count - 1) where nums[i] == key {
                  let t = nums[i + 1]
                  cnt[t] += 1
                  if cnt[t] > cnt[best] { best = t }
              }
              return best
          }
        `,
        rust: code`
          fn mostFrequent(nums: Vec<i32>, key: i32) -> i32 {
              let mut cnt = vec![0i32; 1001];
              let mut best = 0usize;
              for i in 0..nums.len() - 1 {
                  if nums[i] != key {
                      continue;
                  }
                  let t = nums[i + 1] as usize;
                  cnt[t] += 1;
                  if cnt[t] > cnt[best] {
                      best = t;
                  }
              }
              best as i32
          }
        `,
        php: code`
          function mostFrequent($nums, $key) {
              $cnt = array_fill(0, 1001, 0);
              $best = 0;
              for ($i = 0; $i + 1 < count($nums); $i++) {
                  if ($nums[$i] != $key) continue;
                  $t = $nums[$i + 1];
                  $cnt[$t]++;
                  if ($cnt[$t] > $cnt[$best]) $best = $t;
              }
              return $best;
          }
        `,
        ruby: code`
          def mostFrequent(nums, key)
            cnt = Hash.new(0)
            nums.each_cons(2) { |a, b| cnt[b] += 1 if a == key }
            cnt.max_by { |_, c| c }[0]
          end
        `,
      },
    };
  })(),

  // ── Count Artifacts That Can Be Extracted (LC 2201) ─────────────
  (() => {
    const ref = (n: number, artifacts: number[][], dig: number[][]) => {
      const dug = new Set(dig.map(([r, c]) => r * n + c));
      let total = 0;
      for (const [r1, c1, r2, c2] of artifacts) {
        let all = true;
        for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) if (!dug.has(r * n + c)) all = false;
        if (all) total++;
      }
      return total;
    };
    const SHAPES = [[1, 1], [1, 2], [2, 1], [2, 2], [1, 3], [3, 1], [1, 4], [4, 1]];
    return {
      slug: "count-artifacts-that-can-be-extracted",
      title: "Count Artifacts That Can Be Extracted",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Simulation", "Google"],
      signature: {
        funcName: "digArtifacts",
        params: [{ name: "n", type: "int" as const }, { name: "artifacts", type: "int[][]" as const }, { name: "dig", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "An `n x n` grid of earth hides some artifacts. Artifact `i` is the axis-aligned rectangle `artifacts[i] = [r1, c1, r2, c2]`: it covers every cell `(r, c)` with `r1 <= r <= r2` and `c1 <= c <= c2`. No two artifacts overlap, and each covers at most 4 cells.\n\nYou excavate the cells listed in `dig`, where `dig[j] = [r, c]`. An artifact can be **extracted** once every cell it covers has been excavated.\n\nReturn the number of artifacts you can extract.",
        [
          { in: "n = 3, artifacts = [[0,0,1,0],[2,1,2,2],[0,2,0,2]], dig = [[0,0],[1,0],[2,2],[0,2]]", out: "2", note: "The first artifact covers (0,0) and (1,0), both dug. The third covers only (0,2), dug. The second still has (2,1) buried." },
          { in: "n = 2, artifacts = [[0,0,0,0],[0,1,1,1]], dig = [[0,0],[0,1]]", out: "1", note: "The second artifact also covers (1,1), which was not dug." },
          { in: "n = 1, artifacts = [[0,0,0,0]], dig = [[0,0]]", out: "1" },
        ],
        ["1 <= n <= 1000", "1 <= artifacts.length, dig.length <= min(n^2, 10^5)", "artifacts[i].length == 4", "dig[j].length == 2", "0 <= r1 <= r2 < n, 0 <= c1 <= c2 < n", "no two artifacts overlap; each covers at most 4 cells", "the entries of dig are unique"]),
      hints: [
        "Checking a cell should be O(1): store the excavated cells first.",
        "Put every dug cell in a hash set (encode `(r, c)` as `r * n + c`) or a boolean grid.",
        "Each artifact covers at most 4 cells, so checking all of its cells is cheap.",
      ],
      editorial: explain({
        idea: "Mark the excavated cells, then test each artifact's (at most four) cells against the marks.",
        steps: [
          "Insert `r * n + c` for every `[r, c]` in `dig` into a hash set.",
          "For each artifact, loop over its rows `r1..r2` and columns `c1..c2`; it counts if every cell is in the set.",
          "Return the count.",
        ],
        why: "An artifact is extractable exactly when all its cells are excavated, which is what the loop checks with constant-time lookups. Because artifacts do not overlap, each is judged independently.",
        time: "O(D + A)",
        space: "O(D)",
        pitfalls: [
          "Encoding a cell as `r + c` or `r * c` collides; use `r * n + c` (or a pair).",
          "Both corners are inclusive — the loops run to `r2` and `c2`.",
        ],
      }),
      examples: [
        { input: "3\n[[0,0,1,0],[2,1,2,2],[0,2,0,2]]\n[[0,0],[1,0],[2,2],[0,2]]", expectedOutput: "2" },
        { input: "2\n[[0,0,0,0],[0,1,1,1]]\n[[0,0],[0,1]]", expectedOutput: "1" },
        { input: "1\n[[0,0,0,0]]\n[[0,0]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 5, 8]));
        const taken: boolean[] = new Array(n * n).fill(false);
        const artifacts: number[][] = [];
        const tries = ri(rng, 1, n * n);
        for (let t = 0; t < tries; t++) {
          const [h, w] = pick(rng, SHAPES);
          if (h > n || w > n) continue;
          const r1 = ri(rng, 0, n - h), c1 = ri(rng, 0, n - w);
          let free = true;
          for (let r = r1; r < r1 + h; r++) for (let c = c1; c < c1 + w; c++) if (taken[r * n + c]) free = false;
          if (!free) continue;
          for (let r = r1; r < r1 + h; r++) for (let c = c1; c < c1 + w; c++) taken[r * n + c] = true;
          artifacts.push([r1, c1, r1 + h - 1, c1 + w - 1]);
        }
        if (artifacts.length === 0) {
          const cell = taken.indexOf(false);
          artifacts.push([Math.floor(cell / n), cell % n, Math.floor(cell / n), cell % n]);
          taken[cell] = true;
        }
        const cells = shuffle(rng, Array.from({ length: n * n }, (_, i) => i));
        const covered = cells.filter((i) => taken[i]), open = cells.filter((i) => !taken[i]);
        const pickCov = ri(rng, 0, covered.length), pickOpen = ri(rng, 0, open.length);
        let chosen = covered.slice(0, pickCov).concat(open.slice(0, pickOpen));
        if (chosen.length === 0) chosen = [cells[0]];
        shuffle(rng, chosen);
        const dig = chosen.map((i) => [Math.floor(i / n), i % n]);
        return { input: `${n}\n${fmtIntMat(artifacts)}\n${fmtIntMat(dig)}`, expectedOutput: String(ref(n, artifacts, dig)) };
      },
      solutions: {
        python: code`
          from typing import List

          def digArtifacts(n: int, artifacts: List[List[int]], dig: List[List[int]]) -> int:
              dug = {r * n + c for r, c in dig}
              total = 0
              for r1, c1, r2, c2 in artifacts:
                  if all(r * n + c in dug for r in range(r1, r2 + 1) for c in range(c1, c2 + 1)):
                      total += 1
              return total
        `,
        javascript: code`
          var digArtifacts = function(n, artifacts, dig) {
              var dug = new Set();
              for (var i = 0; i < dig.length; i++) dug.add(dig[i][0] * n + dig[i][1]);
              var total = 0;
              for (var a = 0; a < artifacts.length; a++) {
                  var art = artifacts[a], all = true;
                  for (var r = art[0]; r <= art[2] && all; r++)
                      for (var c = art[1]; c <= art[3]; c++)
                          if (!dug.has(r * n + c)) { all = false; break; }
                  if (all) total++;
              }
              return total;
          };
        `,
        typescript: code`
          function digArtifacts(n: number, artifacts: number[][], dig: number[][]): number {
              var dug: { [cell: number]: boolean } = {};
              for (var i = 0; i < dig.length; i++) dug[dig[i][0] * n + dig[i][1]] = true;
              var total = 0;
              for (var a = 0; a < artifacts.length; a++) {
                  var art = artifacts[a], all = true;
                  for (var r = art[0]; r <= art[2] && all; r++)
                      for (var c = art[1]; c <= art[3]; c++)
                          if (!dug[r * n + c]) { all = false; break; }
                  if (all) total++;
              }
              return total;
          }
        `,
        java: code`
          public static int digArtifacts(int n, int[][] artifacts, int[][] dig) {
              Set<Long> dug = new HashSet<>();
              for (int[] d : dig) dug.add((long) d[0] * n + d[1]);
              int total = 0;
              for (int[] a : artifacts) {
                  boolean all = true;
                  for (int r = a[0]; r <= a[2] && all; r++)
                      for (int c = a[1]; c <= a[3]; c++)
                          if (!dug.contains((long) r * n + c)) { all = false; break; }
                  if (all) total++;
              }
              return total;
          }
        `,
        cpp: code`
          int digArtifacts(int n, vector<vector<int>>& artifacts, vector<vector<int>>& dig) {
              unordered_set<long long> dug;
              for (auto& d : dig) dug.insert((long long)d[0] * n + d[1]);
              int total = 0;
              for (auto& a : artifacts) {
                  bool all = true;
                  for (int r = a[0]; r <= a[2] && all; r++)
                      for (int c = a[1]; c <= a[3]; c++)
                          if (!dug.count((long long)r * n + c)) { all = false; break; }
                  if (all) total++;
              }
              return total;
          }
        `,
        c: code`
          int digArtifacts(int n, int** artifacts, int artifactsSize, int* artifactsColSize, int** dig, int digSize, int* digColSize) {
              char* dug = (char*)calloc((size_t)n * n, 1);
              for (int i = 0; i < digSize; i++) dug[(size_t)dig[i][0] * n + dig[i][1]] = 1;
              int total = 0;
              for (int a = 0; a < artifactsSize; a++) {
                  int* art = artifacts[a];
                  int all = 1;
                  for (int r = art[0]; r <= art[2] && all; r++)
                      for (int c = art[1]; c <= art[3]; c++)
                          if (!dug[(size_t)r * n + c]) { all = 0; break; }
                  total += all;
              }
              free(dug);
              return total;
          }
        `,
        csharp: code`
          public static int DigArtifacts(int n, int[][] artifacts, int[][] dig)
          {
              var dug = new HashSet<long>();
              foreach (var d in dig) dug.Add((long)d[0] * n + d[1]);
              int total = 0;
              foreach (var a in artifacts)
              {
                  bool all = true;
                  for (int r = a[0]; r <= a[2] && all; r++)
                      for (int c = a[1]; c <= a[3]; c++)
                          if (!dug.Contains((long)r * n + c)) { all = false; break; }
                  if (all) total++;
              }
              return total;
          }
        `,
        go: code`
          func digArtifacts(n int, artifacts [][]int, dig [][]int) int {
              dug := map[int]bool{}
              for _, d := range dig {
                  dug[d[0]*n+d[1]] = true
              }
              total := 0
              for _, a := range artifacts {
                  all := true
                  for r := a[0]; r <= a[2] && all; r++ {
                      for c := a[1]; c <= a[3]; c++ {
                          if !dug[r*n+c] {
                              all = false
                              break
                          }
                      }
                  }
                  if all {
                      total++
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun digArtifacts(n: Int, artifacts: Array<IntArray>, dig: Array<IntArray>): Int {
              val dug = HashSet<Long>()
              for (d in dig) dug.add(d[0].toLong() * n + d[1])
              var total = 0
              for (a in artifacts) {
                  var all = true
                  for (r in a[0]..a[2]) {
                      for (c in a[1]..a[3]) {
                          if (!dug.contains(r.toLong() * n + c)) all = false
                      }
                  }
                  if (all) total++
              }
              return total
          }
        `,
        swift: code`
          func digArtifacts(_ n: Int, _ artifacts: [[Int]], _ dig: [[Int]]) -> Int {
              var dug = Set<Int>()
              for d in dig { dug.insert(d[0] * n + d[1]) }
              var total = 0
              for a in artifacts {
                  var all = true
                  for r in a[0]...a[2] {
                      for c in a[1]...a[3] where !dug.contains(r * n + c) { all = false }
                  }
                  if all { total += 1 }
              }
              return total
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn digArtifacts(n: i32, artifacts: Vec<Vec<i32>>, dig: Vec<Vec<i32>>) -> i32 {
              let n = n as i64;
              let dug: HashSet<i64> = dig.iter().map(|d| d[0] as i64 * n + d[1] as i64).collect();
              let mut total = 0;
              for a in artifacts.iter() {
                  let mut all = true;
                  for r in a[0]..=a[2] {
                      for c in a[1]..=a[3] {
                          if !dug.contains(&(r as i64 * n + c as i64)) {
                              all = false;
                          }
                      }
                  }
                  if all {
                      total += 1;
                  }
              }
              total
          }
        `,
        php: code`
          function digArtifacts($n, $artifacts, $dig) {
              $dug = [];
              foreach ($dig as $d) $dug[$d[0] * $n + $d[1]] = true;
              $total = 0;
              foreach ($artifacts as $a) {
                  $all = true;
                  for ($r = $a[0]; $r <= $a[2] && $all; $r++) {
                      for ($c = $a[1]; $c <= $a[3]; $c++) {
                          if (!isset($dug[$r * $n + $c])) { $all = false; break; }
                      }
                  }
                  if ($all) $total++;
              }
              return $total;
          }
        `,
        ruby: code`
          require 'set'

          def digArtifacts(n, artifacts, dig)
            dug = dig.map { |r, c| r * n + c }.to_set
            artifacts.count do |r1, c1, r2, c2|
              (r1..r2).all? { |r| (c1..c2).all? { |c| dug.include?(r * n + c) } }
            end
          end
        `,
      },
    };
  })(),

  // ── Sender With Largest Word Count (LC 2284) ────────────────────
  (() => {
    const ref = (messages: string[], senders: string[]) => {
      const cnt = new Map<string, number>();
      messages.forEach((m, i) => cnt.set(senders[i], (cnt.get(senders[i]) || 0) + m.split(" ").length));
      let best = "", bestC = -1;
      for (const [s, c] of cnt) if (c > bestC || (c === bestC && s > best)) { best = s; bestC = c; }
      return best;
    };
    const WORDS = ["hi", "ok", "ship", "it", "lgtm", "review", "the", "patch", "please", "Deploy", "now", "a", "b", "Hello", "world"];
    return {
      slug: "sender-with-largest-word-count",
      title: "Sender With Largest Word Count",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Counting", "Amazon"],
      signature: { funcName: "largestWordCount", params: [{ name: "messages", type: "string[]" as const }, { name: "senders", type: "string[]" as const }], returns: "string" as const },
      description: describe(
        "You have a chat log of `n` messages: `messages[i]` was sent by `senders[i]`. Each message is a list of words separated by single spaces, with no leading or trailing spaces.\n\nA sender's **word count** is the total number of words across all the messages they sent. Return the sender with the **largest** word count. If several senders tie, return the one whose name is **lexicographically largest** — comparing characters by their codes, so every uppercase letter sorts before every lowercase letter, and names differing in case are different senders.",
        [
          { in: "messages = [\"ship it\",\"review the patch please\",\"lgtm\"], senders = [\"dev\",\"Ana\",\"dev\"]", out: "Ana", note: "`dev` sent 2 + 1 = 3 words; `Ana` sent 4." },
          { in: "messages = [\"a b c\",\"d e f\"], senders = [\"Zoe\",\"amy\"]", out: "amy", note: "Both sent 3 words. `amy` is larger than `Zoe` because lowercase `a` comes after uppercase `Z`." },
          { in: "messages = [\"hi\"], senders = [\"Sam\"]", out: "Sam" },
        ],
        ["n == messages.length == senders.length", "1 <= n <= 10^4", "1 <= messages[i].length <= 100", "1 <= senders[i].length <= 10", "messages[i] holds English letters and single spaces between words", "senders[i] holds English letters only"]),
      hints: [
        "The number of words in a message is the number of spaces plus one.",
        "Accumulate a total per sender in a hash map.",
        "Scan the map for the largest total, breaking ties with a plain string comparison (`>` on the names).",
      ],
      editorial: explain({
        idea: "Sum word counts per sender in a hash map, then pick the maximum with ties going to the lexicographically larger name.",
        steps: [
          "For each message, count its words as `spaces + 1` and add that to `total[senders[i]]`.",
          "Walk the map, keeping the sender with the larger total, or the larger name when totals are equal.",
          "Return that sender.",
        ],
        why: "Words are separated by exactly one space and the message has no outer spaces, so the space count is one less than the word count. The final scan compares every sender on the pair (total, name), which is exactly the required order.",
        time: "O(total message length)",
        space: "O(number of senders)",
        pitfalls: [
          "Counting messages instead of words.",
          "Case-insensitive comparison: `amy` and `Amy` are different senders, and the ordering is by character code.",
          "Ties need the *largest* name, not the first seen.",
        ],
      }),
      examples: [
        { input: "[\"ship it\",\"review the patch please\",\"lgtm\"]\n[\"dev\",\"Ana\",\"dev\"]", expectedOutput: "Ana" },
        { input: "[\"a b c\",\"d e f\"]\n[\"Zoe\",\"amy\"]", expectedOutput: "amy" },
        { input: "[\"hi\"]\n[\"Sam\"]", expectedOutput: "Sam" },
      ],
      gen: (rng: Rng) => {
        const names = pick(rng, [["A", "a"], ["Alice", "alice", "Bob", "bob"], ["Zoe", "amy", "Amy", "zed", "Max"], ["x", "y", "z", "X", "Y", "Z", "ab", "aB"]]);
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 30]));
        const messages: string[] = [], senders: string[] = [];
        for (let i = 0; i < n; i++) {
          messages.push(Array.from({ length: ri(rng, 1, pick(rng, [1, 3, 8])) }, () => pick(rng, WORDS)).join(" "));
          senders.push(pick(rng, names));
        }
        return { input: `${fmtStrArr(messages)}\n${fmtStrArr(senders)}`, expectedOutput: ref(messages, senders) };
      },
      solutions: {
        python: code`
          from typing import List

          def largestWordCount(messages: List[str], senders: List[str]) -> str:
              total = {}
              for m, s in zip(messages, senders):
                  total[s] = total.get(s, 0) + m.count(' ') + 1
              return max(total.items(), key=lambda e: (e[1], e[0]))[0]
        `,
        javascript: code`
          var largestWordCount = function(messages, senders) {
              var total = new Map();
              for (var i = 0; i < messages.length; i++) {
                  var words = messages[i].split(' ').length;
                  total.set(senders[i], (total.get(senders[i]) || 0) + words);
              }
              var best = '', bestC = -1;
              total.forEach(function(c, s) {
                  if (c > bestC || (c === bestC && s > best)) { best = s; bestC = c; }
              });
              return best;
          };
        `,
        typescript: code`
          function largestWordCount(messages: string[], senders: string[]): string {
              var total: { [s: string]: number } = {};
              var names: string[] = [];
              for (var i = 0; i < messages.length; i++) {
                  var key = '#' + senders[i];
                  if (total[key] === undefined) { total[key] = 0; names.push(senders[i]); }
                  total[key] += messages[i].split(' ').length;
              }
              var best = '', bestC = -1;
              for (var j = 0; j < names.length; j++) {
                  var c = total['#' + names[j]];
                  if (c > bestC || (c === bestC && names[j] > best)) { best = names[j]; bestC = c; }
              }
              return best;
          }
        `,
        java: code`
          public static String largestWordCount(String[] messages, String[] senders) {
              Map<String, Integer> total = new HashMap<>();
              for (int i = 0; i < messages.length; i++) {
                  int words = 1;
                  for (int j = 0; j < messages[i].length(); j++) if (messages[i].charAt(j) == ' ') words++;
                  total.merge(senders[i], words, Integer::sum);
              }
              String best = "";
              int bestC = -1;
              for (Map.Entry<String, Integer> e : total.entrySet()) {
                  int c = e.getValue();
                  if (c > bestC || (c == bestC && e.getKey().compareTo(best) > 0)) { best = e.getKey(); bestC = c; }
              }
              return best;
          }
        `,
        cpp: code`
          string largestWordCount(vector<string>& messages, vector<string>& senders) {
              unordered_map<string, int> total;
              for (size_t i = 0; i < messages.size(); i++)
                  total[senders[i]] += (int)count(messages[i].begin(), messages[i].end(), ' ') + 1;
              string best;
              int bestC = -1;
              for (auto& e : total) {
                  if (e.second > bestC || (e.second == bestC && e.first > best)) { best = e.first; bestC = e.second; }
              }
              return best;
          }
        `,
        c: code`
          static char** lwNames;

          static int lwCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return strcmp(lwNames[x], lwNames[y]);
          }

          char* largestWordCount(char** messages, int messagesSize, char** senders, int sendersSize) {
              /* Sort message indices by sender; each run of equal names is one sender's total. */
              int* order = (int*)malloc(messagesSize * sizeof(int));
              for (int i = 0; i < messagesSize; i++) order[i] = i;
              lwNames = senders;
              qsort(order, messagesSize, sizeof(int), lwCmp);
              const char* best = "";
              int bestC = -1, run = 0;
              for (int k = 0; k < messagesSize; k++) {
                  int i = order[k];
                  int words = 1;
                  for (const char* p = messages[i]; *p; p++) if (*p == ' ') words++;
                  run += words;
                  if (k + 1 == messagesSize || strcmp(senders[order[k + 1]], senders[i]) != 0) {
                      if (run > bestC || (run == bestC && strcmp(senders[i], best) > 0)) { best = senders[i]; bestC = run; }
                      run = 0;
                  }
              }
              size_t len = strlen(best);
              char* out = (char*)malloc(len + 1);
              memcpy(out, best, len + 1);
              free(order);
              return out;
          }
        `,
        csharp: code`
          public static string LargestWordCount(string[] messages, string[] senders)
          {
              var total = new Dictionary<string, int>();
              for (int i = 0; i < messages.Length; i++)
              {
                  int words = 1;
                  foreach (char ch in messages[i]) if (ch == ' ') words++;
                  int c;
                  total.TryGetValue(senders[i], out c);
                  total[senders[i]] = c + words;
              }
              string best = "";
              int bestC = -1;
              foreach (var e in total)
              {
                  if (e.Value > bestC || (e.Value == bestC && string.CompareOrdinal(e.Key, best) > 0)) { best = e.Key; bestC = e.Value; }
              }
              return best;
          }
        `,
        go: code`
          func largestWordCount(messages []string, senders []string) string {
              total := map[string]int{}
              for i, m := range messages {
                  total[senders[i]] += strings.Count(m, " ") + 1
              }
              best, bestC := "", -1
              for s, c := range total {
                  if c > bestC || (c == bestC && s > best) {
                      best, bestC = s, c
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun largestWordCount(messages: Array<String>, senders: Array<String>): String {
              val total = HashMap<String, Int>()
              for (i in messages.indices) {
                  val words = messages[i].count { it == ' ' } + 1
                  total[senders[i]] = (total[senders[i]] ?: 0) + words
              }
              var best = ""
              var bestC = -1
              for ((s, c) in total) {
                  if (c > bestC || (c == bestC && s > best)) { best = s; bestC = c }
              }
              return best
          }
        `,
        swift: code`
          func largestWordCount(_ messages: [String], _ senders: [String]) -> String {
              var total = [String: Int]()
              for i in 0..<messages.count {
                  var words = 1
                  for c in messages[i].utf8 where c == 32 { words += 1 }
                  total[senders[i], default: 0] += words
              }
              var best = ""
              var bestC = -1
              for (s, c) in total {
                  // For ASCII names Swift's String order is the character-code order.
                  if c > bestC || (c == bestC && s > best) {
                      best = s
                      bestC = c
                  }
              }
              return best
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn largestWordCount(messages: Vec<String>, senders: Vec<String>) -> String {
              let mut total: HashMap<&String, i32> = HashMap::new();
              for i in 0..messages.len() {
                  let words = messages[i].bytes().filter(|&b| b == b' ').count() as i32 + 1;
                  *total.entry(&senders[i]).or_insert(0) += words;
              }
              let mut best: &String = &senders[0];
              let mut best_c = -1;
              for (s, &c) in total.iter() {
                  if c > best_c || (c == best_c && *s > best) {
                      best = s;
                      best_c = c;
                  }
              }
              best.clone()
          }
        `,
        php: code`
          function largestWordCount($messages, $senders) {
              // Keys carry a '#' prefix so PHP keeps every name a string key.
              $total = [];
              foreach ($messages as $i => $m) {
                  $key = '#' . $senders[$i];
                  $total[$key] = (isset($total[$key]) ? $total[$key] : 0) + substr_count($m, ' ') + 1;
              }
              $best = '';
              $bestC = -1;
              foreach ($total as $key => $c) {
                  $s = substr($key, 1);
                  if ($c > $bestC || ($c == $bestC && strcmp($s, $best) > 0)) { $best = $s; $bestC = $c; }
              }
              return $best;
          }
        `,
        ruby: code`
          def largestWordCount(messages, senders)
            total = Hash.new(0)
            messages.each_with_index { |m, i| total[senders[i]] += m.count(' ') + 1 }
            total.max_by { |s, c| [c, s] }[0]
          end
        `,
      },
    };
  })(),

  // ── Max Sum of a Pair With Equal Sum of Digits (LC 2342) ────────
  (() => {
    const ds = (x: number) => String(x).split("").reduce((s, d) => s + Number(d), 0);
    const ref = (nums: number[]) => {
      let best = -1;
      for (let i = 0; i < nums.length; i++)
        for (let j = i + 1; j < nums.length; j++)
          if (ds(nums[i]) === ds(nums[j])) best = Math.max(best, nums[i] + nums[j]);
      return best;
    };
    return {
      slug: "max-sum-of-a-pair-with-equal-sum-of-digits",
      title: "Max Sum of a Pair With Equal Sum of Digits",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sorting", "Heap (Priority Queue)", "Amazon", "Google"],
      signature: { funcName: "maximumSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of positive integers.\n\nChoose two different indices `i != j` such that the **sum of the digits** of `nums[i]` equals the sum of the digits of `nums[j]`. Return the **maximum** value of `nums[i] + nums[j]` over all such pairs, or `-1` if no pair qualifies.\n\n(The values are capped at 5 · 10^8 here — below LeetCode's 10^9 — so that every pair sum fits a 32-bit integer.)",
        [
          { in: "nums = [51,42,24,33,9]", out: "93", note: "51, 42, 24 and 33 all have digit sum 6; the two largest give 51 + 42 = 93. 9 has digit sum 9 and no partner." },
          { in: "nums = [10,12,19,14]", out: "-1", note: "The digit sums 1, 3, 10 and 5 are all different." },
          { in: "nums = [500000000,50000000]", out: "550000000", note: "Both have digit sum 5." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 5 * 10^8"]),
      hints: [
        "Only pairs with the same digit sum compete, so group the numbers by digit sum.",
        "Within one group, the best pair is its two largest numbers.",
        "Scan once, keeping the largest number seen so far for each digit sum: each new number pairs with that maximum.",
      ],
      editorial: explain({
        idea: "Bucket the numbers by digit sum; inside a bucket the best pair is its top two. Keeping just the running maximum per digit sum lets every number be paired with its best partner as it arrives.",
        steps: [
          "Keep `best[s]`, the largest number seen so far with digit sum `s` (there are at most 82 sums).",
          "For each `x`, compute its digit sum `s`. If `best[s]` exists, update the answer with `best[s] + x`.",
          "Set `best[s] = max(best[s], x)`.",
          "Return the answer, or -1 if nothing was paired.",
        ],
        why: "For a fixed digit sum, the largest pair sum is the sum of its two largest members. When the second of those two is scanned, `best[s]` holds the first, so that pair is evaluated; every evaluated pair is valid, so the maximum found is exactly the answer.",
        time: "O(n · d) with d the number of digits",
        space: "O(1)",
        pitfalls: [
          "Pairing the largest number with the second-largest *overall* ignores the digit-sum condition.",
          "A group with a single number produces no pair — the answer stays -1 if every group is a singleton.",
          "With LeetCode's full 10^9 range the sum overflows a 32-bit int; use 64-bit arithmetic there.",
        ],
      }),
      examples: [
        { input: "[51,42,24,33,9]", expectedOutput: "93" },
        { input: "[10,12,19,14]", expectedOutput: "-1" },
        { input: "[500000000,50000000]", expectedOutput: "550000000" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 15, 40]));
        const mode = ri(rng, 0, 2);
        const nums = Array.from({ length: n }, () =>
          mode === 0 ? ri(rng, 1, 100) : mode === 1 ? ri(rng, 1, 500000000) : pick(rng, [ri(rng, 1, 1000), ri(rng, 400000000, 500000000)]));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumSum(nums: List[int]) -> int:
              best = [0] * 82
              ans = -1
              for x in nums:
                  s, y = 0, x
                  while y:
                      s += y % 10
                      y //= 10
                  if best[s] and best[s] + x > ans:
                      ans = best[s] + x
                  if x > best[s]:
                      best[s] = x
              return ans
        `,
        javascript: code`
          var maximumSum = function(nums) {
              var best = new Array(82).fill(0);
              var ans = -1;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i], s = 0, y = x;
                  while (y > 0) { s += y % 10; y = Math.floor(y / 10); }
                  if (best[s] > 0 && best[s] + x > ans) ans = best[s] + x;
                  if (x > best[s]) best[s] = x;
              }
              return ans;
          };
        `,
        typescript: code`
          function maximumSum(nums: number[]): number {
              var best: number[] = [];
              for (var z = 0; z < 82; z++) best.push(0);
              var ans = -1;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i], s = 0, y = x;
                  while (y > 0) { s += y % 10; y = Math.floor(y / 10); }
                  if (best[s] > 0 && best[s] + x > ans) ans = best[s] + x;
                  if (x > best[s]) best[s] = x;
              }
              return ans;
          }
        `,
        java: code`
          public static int maximumSum(int[] nums) {
              int[] best = new int[82];
              long ans = -1;
              for (int x : nums) {
                  int s = 0;
                  for (int y = x; y > 0; y /= 10) s += y % 10;
                  if (best[s] > 0) ans = Math.max(ans, (long) best[s] + x);
                  best[s] = Math.max(best[s], x);
              }
              return (int) ans;
          }
        `,
        cpp: code`
          int maximumSum(vector<int>& nums) {
              int best[82] = {0};
              long long ans = -1;
              for (int x : nums) {
                  int s = 0;
                  for (int y = x; y > 0; y /= 10) s += y % 10;
                  if (best[s] > 0) ans = max(ans, (long long)best[s] + x);
                  best[s] = max(best[s], x);
              }
              return (int)ans;
          }
        `,
        c: code`
          int maximumSum(int* nums, int numsSize) {
              int best[82] = {0};
              long long ans = -1;
              for (int i = 0; i < numsSize; i++) {
                  int x = nums[i], s = 0;
                  for (int y = x; y > 0; y /= 10) s += y % 10;
                  if (best[s] > 0 && (long long)best[s] + x > ans) ans = (long long)best[s] + x;
                  if (x > best[s]) best[s] = x;
              }
              return (int)ans;
          }
        `,
        csharp: code`
          public static int MaximumSum(int[] nums)
          {
              var best = new int[82];
              long ans = -1;
              foreach (int x in nums)
              {
                  int s = 0;
                  for (int y = x; y > 0; y /= 10) s += y % 10;
                  if (best[s] > 0) ans = Math.Max(ans, (long)best[s] + x);
                  best[s] = Math.Max(best[s], x);
              }
              return (int)ans;
          }
        `,
        go: code`
          func maximumSum(nums []int) int {
              best := make([]int, 82)
              ans := -1
              for _, x := range nums {
                  s := 0
                  for y := x; y > 0; y /= 10 {
                      s += y % 10
                  }
                  if best[s] > 0 && best[s]+x > ans {
                      ans = best[s] + x
                  }
                  if x > best[s] {
                      best[s] = x
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun maximumSum(nums: IntArray): Int {
              val best = IntArray(82)
              var ans = -1L
              for (x in nums) {
                  var s = 0
                  var y = x
                  while (y > 0) { s += y % 10; y /= 10 }
                  if (best[s] > 0) ans = maxOf(ans, best[s].toLong() + x)
                  best[s] = maxOf(best[s], x)
              }
              return ans.toInt()
          }
        `,
        swift: code`
          func maximumSum(_ nums: [Int]) -> Int {
              var best = [Int](repeating: 0, count: 82)
              var ans = -1
              for x in nums {
                  var s = 0, y = x
                  while y > 0 { s += y % 10; y /= 10 }
                  if best[s] > 0 { ans = max(ans, best[s] + x) }
                  best[s] = max(best[s], x)
              }
              return ans
          }
        `,
        rust: code`
          fn maximumSum(nums: Vec<i32>) -> i32 {
              let mut best = [0i64; 82];
              let mut ans: i64 = -1;
              for &x in nums.iter() {
                  let mut s = 0usize;
                  let mut y = x;
                  while y > 0 {
                      s += (y % 10) as usize;
                      y /= 10;
                  }
                  let x = x as i64;
                  if best[s] > 0 && best[s] + x > ans {
                      ans = best[s] + x;
                  }
                  if x > best[s] {
                      best[s] = x;
                  }
              }
              ans as i32
          }
        `,
        php: code`
          function maximumSum($nums) {
              $best = array_fill(0, 82, 0);
              $ans = -1;
              foreach ($nums as $x) {
                  $s = 0;
                  for ($y = $x; $y > 0; $y = intdiv($y, 10)) $s += $y % 10;
                  if ($best[$s] > 0 && $best[$s] + $x > $ans) $ans = $best[$s] + $x;
                  if ($x > $best[$s]) $best[$s] = $x;
              }
              return $ans;
          }
        `,
        ruby: code`
          def maximumSum(nums)
            best = Array.new(82, 0)
            ans = -1
            nums.each do |x|
              s = x.digits.sum
              ans = best[s] + x if best[s] > 0 && best[s] + x > ans
              best[s] = x if x > best[s]
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Make Array Zero by Subtracting Equal Amounts (LC 2357) ──────
  (() => {
    const ref = (nums: number[]) => {
      // Simulate the operation literally.
      const a = nums.slice();
      let ops = 0;
      for (;;) {
        const pos = a.filter((v) => v > 0);
        if (pos.length === 0) return ops;
        const x = Math.min(...pos);
        for (let i = 0; i < a.length; i++) if (a[i] > 0) a[i] -= x;
        ops++;
      }
    };
    return {
      slug: "make-array-zero-by-subtracting-equal-amounts",
      title: "Make Array Zero by Subtracting Equal Amounts",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Greedy", "Sorting", "Simulation", "Heap (Priority Queue)", "Amazon"],
      signature: { funcName: "minimumOperations", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of non-negative integers. In one operation you:\n\n- choose a positive integer `x` no larger than the **smallest non-zero** element of `nums`, and\n- subtract `x` from **every** positive element.\n\nReturn the **minimum** number of operations needed to make every element of `nums` equal to `0`.",
        [
          { in: "nums = [4,0,4,2,2]", out: "2", note: "Subtract 2: `[2,0,2,0,0]`. Subtract 2 again: all zeros." },
          { in: "nums = [0,0]", out: "0", note: "The array is already all zeros." },
          { in: "nums = [7,1,3,7,1]", out: "3", note: "Subtract 1, then 2, then 4: the distinct values 1, 3 and 7 each need their own step." },
        ],
        ["1 <= nums.length <= 100", "0 <= nums[i] <= 100"]),
      hints: [
        "Subtracting the smallest positive element each time is never worse than subtracting less.",
        "Each such operation turns every copy of the current minimum into 0 and keeps distinct values distinct.",
        "So the answer is the number of distinct positive values.",
      ],
      editorial: explain({
        idea: "Equal elements stay equal through every operation, and each operation can zero out at most one group of equal values (the smallest). Taking `x` = the current minimum does exactly that, so the answer is the count of distinct non-zero values.",
        steps: [
          "Insert every positive element into a set.",
          "Return the size of the set.",
        ],
        why: "An operation subtracts the same amount from every positive element, so two positive elements that differ keep differing until the smaller reaches 0 — they can never reach 0 in the same operation. Hence at least one operation per distinct positive value is needed. Choosing `x` equal to the smallest positive value zeroes exactly that value's group each time, meeting the bound.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Zero is not counted — elements already at 0 are untouched.",
          "Duplicates collapse into one operation; counting elements instead of distinct values overcounts.",
        ],
      }),
      examples: [
        { input: "[4,0,4,2,2]", expectedOutput: "2" },
        { input: "[0,0]", expectedOutput: "0" },
        { input: "[7,1,3,7,1]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 20, 100]));
        const top = pick(rng, [0, 1, 3, 10, 100]);
        const nums = Array.from({ length: n }, () => (rng() < 0.2 ? 0 : ri(rng, 0, top)));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumOperations(nums: List[int]) -> int:
              return len({x for x in nums if x > 0})
        `,
        javascript: code`
          var minimumOperations = function(nums) {
              var seen = new Set();
              for (var i = 0; i < nums.length; i++) if (nums[i] > 0) seen.add(nums[i]);
              return seen.size;
          };
        `,
        typescript: code`
          function minimumOperations(nums: number[]): number {
              var seen: boolean[] = [];
              var count = 0;
              for (var i = 0; i < nums.length; i++) {
                  if (nums[i] > 0 && !seen[nums[i]]) { seen[nums[i]] = true; count++; }
              }
              return count;
          }
        `,
        java: code`
          public static int minimumOperations(int[] nums) {
              boolean[] seen = new boolean[101];
              int count = 0;
              for (int x : nums) {
                  if (x > 0 && !seen[x]) { seen[x] = true; count++; }
              }
              return count;
          }
        `,
        cpp: code`
          int minimumOperations(vector<int>& nums) {
              unordered_set<int> seen;
              for (int x : nums) if (x > 0) seen.insert(x);
              return (int)seen.size();
          }
        `,
        c: code`
          int minimumOperations(int* nums, int numsSize) {
              bool seen[101] = {false};
              int count = 0;
              for (int i = 0; i < numsSize; i++) {
                  if (nums[i] > 0 && !seen[nums[i]]) { seen[nums[i]] = true; count++; }
              }
              return count;
          }
        `,
        csharp: code`
          public static int MinimumOperations(int[] nums)
          {
              var seen = new HashSet<int>();
              foreach (int x in nums) if (x > 0) seen.Add(x);
              return seen.Count;
          }
        `,
        go: code`
          func minimumOperations(nums []int) int {
              seen := map[int]bool{}
              for _, x := range nums {
                  if x > 0 {
                      seen[x] = true
                  }
              }
              return len(seen)
          }
        `,
        kotlin: code`
          fun minimumOperations(nums: IntArray): Int {
              return nums.filter { it > 0 }.toSet().size
          }
        `,
        swift: code`
          func minimumOperations(_ nums: [Int]) -> Int {
              return Set(nums.filter { $0 > 0 }).count
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn minimumOperations(nums: Vec<i32>) -> i32 {
              nums.into_iter().filter(|&x| x > 0).collect::<HashSet<i32>>().len() as i32
          }
        `,
        php: code`
          function minimumOperations($nums) {
              return count(array_unique(array_filter($nums, function ($x) { return $x > 0; })));
          }
        `,
        ruby: code`
          def minimumOperations(nums)
            nums.select(&:positive?).uniq.size
          end
        `,
      },
    };
  })(),

  // ── Merge Similar Items (LC 2363) ───────────────────────────────
  (() => {
    const ref = (items1: number[][], items2: number[][]) => {
      const w = new Map<number, number>();
      for (const [v, x] of items1.concat(items2)) w.set(v, (w.get(v) || 0) + x);
      return Array.from(w.entries()).sort((a, b) => a[0] - b[0]).map(([v, x]) => [v, x]);
    };
    const makeItems = (rng: Rng) => {
      const top = pick(rng, [3, 10, 1000]);
      const k = ri(rng, 1, Math.min(top, pick(rng, [1, 4, 12, 30])));
      const vals = shuffle(rng, Array.from({ length: top }, (_, i) => i + 1)).slice(0, k);
      return vals.map((v) => [v, ri(rng, 1, pick(rng, [5, 1000]))]);
    };
    return {
      slug: "merge-similar-items",
      title: "Merge Similar Items",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Sorting", "Ordered Set", "Amazon"],
      signature: { funcName: "mergeSimilarItems", params: [{ name: "items1", type: "int[][]" as const }, { name: "items2", type: "int[][]" as const }], returns: "int[][]" as const },
      description: describe(
        "You are given two lists of items, `items1` and `items2`. Each entry `[value, weight]` describes an item: its `value` and its `weight`. The values within one list are **unique**, but a value may appear in both lists.\n\nReturn a list `ret` of pairs `[value, totalWeight]`, one for every value that appears in either list, where `totalWeight` is the sum of the weights of all items with that value. Return `ret` sorted by `value` in **ascending** order.",
        [
          { in: "items1 = [[2,3],[7,1]], items2 = [[7,4],[5,2],[2,1]]", out: "[[2,4],[5,2],[7,5]]", note: "Value 2 weighs 3 + 1, value 5 weighs 2, value 7 weighs 1 + 4." },
          { in: "items1 = [[1,1]], items2 = [[2,2]]", out: "[[1,1],[2,2]]", note: "No value is shared, so each item passes through unchanged." },
          { in: "items1 = [[9,1000]], items2 = [[9,1000]]", out: "[[9,2000]]" },
        ],
        ["1 <= items1.length, items2.length <= 1000", "items1[i].length == items2[i].length == 2", "1 <= value, weight <= 1000", "the values in items1 are unique, and so are the values in items2"]),
      hints: [
        "Add up weights per value — a hash map or, since values are at most 1000, an array indexed by value.",
        "Walking the indices 1..1000 in order produces the values already sorted.",
      ],
      editorial: explain({
        idea: "Sum the weights per value; because values are small integers, an array indexed by value both accumulates and sorts them.",
        steps: [
          "Create `total[1..1000]` filled with 0.",
          "For each `[v, w]` in both lists, add `w` to `total[v]`.",
          "For `v` from 1 to 1000, emit `[v, total[v]]` whenever it is positive.",
        ],
        why: "Every item contributes its weight to exactly its own value, and weights are positive, so a value appears in the output exactly when some item has it. Scanning the indices in increasing order yields ascending values without a sort.",
        time: "O(n + m + V) with V = 1000",
        space: "O(V)",
        pitfalls: [
          "A value present in only one list must still appear in the result.",
          "The output order is by value, not by first appearance.",
        ],
      }),
      examples: [
        { input: "[[2,3],[7,1]]\n[[7,4],[5,2],[2,1]]", expectedOutput: "[[2,4],[5,2],[7,5]]" },
        { input: "[[1,1]]\n[[2,2]]", expectedOutput: "[[1,1],[2,2]]" },
        { input: "[[9,1000]]\n[[9,1000]]", expectedOutput: "[[9,2000]]" },
      ],
      gen: (rng: Rng) => {
        const items1 = makeItems(rng), items2 = makeItems(rng);
        return { input: `${fmtIntMat(items1)}\n${fmtIntMat(items2)}`, expectedOutput: fmtIntMat(ref(items1, items2)) };
      },
      solutions: {
        python: code`
          from typing import List

          def mergeSimilarItems(items1: List[List[int]], items2: List[List[int]]) -> List[List[int]]:
              total = [0] * 1001
              for v, w in items1 + items2:
                  total[v] += w
              return [[v, total[v]] for v in range(1, 1001) if total[v]]
        `,
        javascript: code`
          var mergeSimilarItems = function(items1, items2) {
              var total = new Array(1001).fill(0);
              var all = items1.concat(items2);
              for (var i = 0; i < all.length; i++) total[all[i][0]] += all[i][1];
              var out = [];
              for (var v = 1; v <= 1000; v++) if (total[v] > 0) out.push([v, total[v]]);
              return out;
          };
        `,
        typescript: code`
          function mergeSimilarItems(items1: number[][], items2: number[][]): number[][] {
              var total: number[] = [];
              for (var z = 0; z <= 1000; z++) total.push(0);
              var all = items1.concat(items2);
              for (var i = 0; i < all.length; i++) total[all[i][0]] += all[i][1];
              var out: number[][] = [];
              for (var v = 1; v <= 1000; v++) if (total[v] > 0) out.push([v, total[v]]);
              return out;
          }
        `,
        java: code`
          public static int[][] mergeSimilarItems(int[][] items1, int[][] items2) {
              int[] total = new int[1001];
              for (int[] it : items1) total[it[0]] += it[1];
              for (int[] it : items2) total[it[0]] += it[1];
              List<int[]> out = new ArrayList<>();
              for (int v = 1; v <= 1000; v++) if (total[v] > 0) out.add(new int[] { v, total[v] });
              return out.toArray(new int[0][]);
          }
        `,
        cpp: code`
          vector<vector<int>> mergeSimilarItems(vector<vector<int>>& items1, vector<vector<int>>& items2) {
              vector<int> total(1001, 0);
              for (auto& it : items1) total[it[0]] += it[1];
              for (auto& it : items2) total[it[0]] += it[1];
              vector<vector<int>> out;
              for (int v = 1; v <= 1000; v++) if (total[v] > 0) out.push_back({v, total[v]});
              return out;
          }
        `,
        c: code`
          int** mergeSimilarItems(int** items1, int items1Size, int* items1ColSize, int** items2, int items2Size, int* items2ColSize, int* returnSize, int** returnColumnSizes) {
              int total[1001] = {0};
              for (int i = 0; i < items1Size; i++) total[items1[i][0]] += items1[i][1];
              for (int i = 0; i < items2Size; i++) total[items2[i][0]] += items2[i][1];
              int count = 0;
              for (int v = 1; v <= 1000; v++) if (total[v] > 0) count++;
              int** out = (int**)malloc((count > 0 ? count : 1) * sizeof(int*));
              *returnColumnSizes = (int*)malloc((count > 0 ? count : 1) * sizeof(int));
              int k = 0;
              for (int v = 1; v <= 1000; v++) {
                  if (total[v] == 0) continue;
                  out[k] = (int*)malloc(2 * sizeof(int));
                  out[k][0] = v;
                  out[k][1] = total[v];
                  (*returnColumnSizes)[k] = 2;
                  k++;
              }
              *returnSize = count;
              return out;
          }
        `,
        csharp: code`
          public static int[][] MergeSimilarItems(int[][] items1, int[][] items2)
          {
              var total = new int[1001];
              foreach (var it in items1) total[it[0]] += it[1];
              foreach (var it in items2) total[it[0]] += it[1];
              var result = new List<int[]>();
              for (int v = 1; v <= 1000; v++) if (total[v] > 0) result.Add(new[] { v, total[v] });
              return result.ToArray();
          }
        `,
        go: code`
          func mergeSimilarItems(items1 [][]int, items2 [][]int) [][]int {
              total := make([]int, 1001)
              for _, it := range items1 {
                  total[it[0]] += it[1]
              }
              for _, it := range items2 {
                  total[it[0]] += it[1]
              }
              out := [][]int{}
              for v := 1; v <= 1000; v++ {
                  if total[v] > 0 {
                      out = append(out, []int{v, total[v]})
                  }
              }
              return out
          }
        `,
        kotlin: code`
          fun mergeSimilarItems(items1: Array<IntArray>, items2: Array<IntArray>): Array<IntArray> {
              val total = IntArray(1001)
              for (it in items1) total[it[0]] += it[1]
              for (it in items2) total[it[0]] += it[1]
              val out = ArrayList<IntArray>()
              for (v in 1..1000) if (total[v] > 0) out.add(intArrayOf(v, total[v]))
              return out.toTypedArray()
          }
        `,
        swift: code`
          func mergeSimilarItems(_ items1: [[Int]], _ items2: [[Int]]) -> [[Int]] {
              var total = [Int](repeating: 0, count: 1001)
              for it in items1 + items2 { total[it[0]] += it[1] }
              var out = [[Int]]()
              for v in 1...1000 where total[v] > 0 { out.append([v, total[v]]) }
              return out
          }
        `,
        rust: code`
          fn mergeSimilarItems(items1: Vec<Vec<i32>>, items2: Vec<Vec<i32>>) -> Vec<Vec<i32>> {
              let mut total = vec![0i32; 1001];
              for it in items1.iter().chain(items2.iter()) {
                  total[it[0] as usize] += it[1];
              }
              (1..=1000usize).filter(|&v| total[v] > 0).map(|v| vec![v as i32, total[v]]).collect()
          }
        `,
        php: code`
          function mergeSimilarItems($items1, $items2) {
              $total = [];
              foreach (array_merge($items1, $items2) as $it) {
                  $total[$it[0]] = (isset($total[$it[0]]) ? $total[$it[0]] : 0) + $it[1];
              }
              ksort($total);
              $out = [];
              foreach ($total as $v => $w) $out[] = [$v, $w];
              return $out;
          }
        `,
        ruby: code`
          def mergeSimilarItems(items1, items2)
            total = Hash.new(0)
            (items1 + items2).each { |v, w| total[v] += w }
            total.sort.map { |v, w| [v, w] }
          end
        `,
      },
    };
  })(),

  // ── Find Subarrays With Equal Sum (LC 2395) ─────────────────────
  (() => {
    const ref = (nums: number[]) => {
      for (let i = 0; i + 1 < nums.length; i++)
        for (let j = i + 1; j + 1 < nums.length; j++)
          if (nums[i] + nums[i + 1] === nums[j] + nums[j + 1]) return true;
      return false;
    };
    return {
      slug: "find-subarrays-with-equal-sum",
      title: "Find Subarrays With Equal Sum",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Morgan Stanley"],
      signature: { funcName: "findSubarrays", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "You are given an integer array `nums`. Decide whether there are **two subarrays of length 2** with **equal sums** that start at **different** indices.\n\nReturn `true` if such a pair exists and `false` otherwise. (A subarray is a contiguous, non-empty part of the array; the two subarrays may overlap.)",
        [
          { in: "nums = [3,1,2,2]", out: "true", note: "`[3,1]` (start 0) and `[2,2]` (start 2) both sum to 4." },
          { in: "nums = [1,2,3,4,5]", out: "false", note: "The adjacent sums 3, 5, 7 and 9 are all different." },
          { in: "nums = [0,0,0]", out: "true", note: "`[0,0]` at index 0 and `[0,0]` at index 1 overlap but start at different indices, and both sum to 0." },
        ],
        ["2 <= nums.length <= 1000", "-10^9 <= nums[i] <= 10^9"]),
      hints: [
        "A length-2 subarray is identified by its start `i`; its sum is `nums[i] + nums[i + 1]`.",
        "The question becomes: do any two of these `n - 1` sums coincide?",
        "Insert each sum into a hash set and report a repeat. The sums can reach ±2·10^9, so hold them in 64 bits.",
      ],
      editorial: explain({
        idea: "There are only `n - 1` length-2 subarrays, one per start index. Two with equal sums exist exactly when the list of adjacent sums has a duplicate — a hash-set check.",
        steps: [
          "For `i` from 0 to `n - 2`, compute `s = nums[i] + nums[i + 1]` in 64-bit arithmetic.",
          "If `s` is already in the set, return true; otherwise insert it.",
          "Return false after the loop.",
        ],
        why: "Distinct start indices give distinct subarrays, so a repeated sum in the sequence is precisely a pair of different subarrays with equal sums, and the set detects the first repeat.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Two values of 10^9 sum past the 32-bit range — use 64-bit sums in typed languages.",
          "Overlapping subarrays count (`[0,0,0]` is true); only the start indices must differ.",
        ],
      }),
      examples: [
        { input: "[3,1,2,2]", expectedOutput: "true" },
        { input: "[1,2,3,4,5]", expectedOutput: "false" },
        { input: "[0,0,0]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 4, 10, 30]));
        const big = pick(rng, [1, 3, 20, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, -big, big));
        if (big === 1000000000 && rng() < 0.3) {
          // Plant an equal pair of extreme sums.
          const i = ri(rng, 0, n - 2);
          nums[i] = 1000000000; nums[i + 1] = 1000000000;
          if (n >= 4 && rng() < 0.5) { const j = (i + 2) % (n - 1); nums[j] = 1000000000; nums[j + 1] = 1000000000; }
        }
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findSubarrays(nums: List[int]) -> bool:
              seen = set()
              for i in range(len(nums) - 1):
                  s = nums[i] + nums[i + 1]
                  if s in seen:
                      return True
                  seen.add(s)
              return False
        `,
        javascript: code`
          var findSubarrays = function(nums) {
              var seen = new Set();
              for (var i = 0; i + 1 < nums.length; i++) {
                  var s = nums[i] + nums[i + 1];
                  if (seen.has(s)) return true;
                  seen.add(s);
              }
              return false;
          };
        `,
        typescript: code`
          function findSubarrays(nums: number[]): boolean {
              var seen: { [s: number]: boolean } = {};
              for (var i = 0; i + 1 < nums.length; i++) {
                  var s = nums[i] + nums[i + 1];
                  if (seen[s]) return true;
                  seen[s] = true;
              }
              return false;
          }
        `,
        java: code`
          public static boolean findSubarrays(int[] nums) {
              Set<Long> seen = new HashSet<>();
              for (int i = 0; i + 1 < nums.length; i++) {
                  if (!seen.add((long) nums[i] + nums[i + 1])) return true;
              }
              return false;
          }
        `,
        cpp: code`
          bool findSubarrays(vector<int>& nums) {
              unordered_set<long long> seen;
              for (size_t i = 0; i + 1 < nums.size(); i++) {
                  if (!seen.insert((long long)nums[i] + nums[i + 1]).second) return true;
              }
              return false;
          }
        `,
        c: code`
          static int fsCmp(const void* a, const void* b) {
              long long x = *(const long long*)a, y = *(const long long*)b;
              return (x > y) - (x < y);
          }

          bool findSubarrays(int* nums, int numsSize) {
              int m = numsSize - 1;
              long long* sums = (long long*)malloc(m * sizeof(long long));
              for (int i = 0; i < m; i++) sums[i] = (long long)nums[i] + nums[i + 1];
              qsort(sums, m, sizeof(long long), fsCmp);
              bool found = false;
              for (int i = 1; i < m; i++) if (sums[i] == sums[i - 1]) { found = true; break; }
              free(sums);
              return found;
          }
        `,
        csharp: code`
          public static bool FindSubarrays(int[] nums)
          {
              var seen = new HashSet<long>();
              for (int i = 0; i + 1 < nums.Length; i++)
              {
                  if (!seen.Add((long)nums[i] + nums[i + 1])) return true;
              }
              return false;
          }
        `,
        go: code`
          func findSubarrays(nums []int) bool {
              seen := map[int]bool{}
              for i := 0; i+1 < len(nums); i++ {
                  s := nums[i] + nums[i+1]
                  if seen[s] {
                      return true
                  }
                  seen[s] = true
              }
              return false
          }
        `,
        kotlin: code`
          fun findSubarrays(nums: IntArray): Boolean {
              val seen = HashSet<Long>()
              for (i in 0 until nums.size - 1) {
                  if (!seen.add(nums[i].toLong() + nums[i + 1])) return true
              }
              return false
          }
        `,
        swift: code`
          func findSubarrays(_ nums: [Int]) -> Bool {
              var seen = Set<Int>()
              for i in 0..<(nums.count - 1) {
                  if !seen.insert(nums[i] + nums[i + 1]).inserted { return true }
              }
              return false
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn findSubarrays(nums: Vec<i32>) -> bool {
              let mut seen: HashSet<i64> = HashSet::new();
              for i in 0..nums.len() - 1 {
                  if !seen.insert(nums[i] as i64 + nums[i + 1] as i64) {
                      return true;
                  }
              }
              false
          }
        `,
        php: code`
          function findSubarrays($nums) {
              $seen = [];
              for ($i = 0; $i + 1 < count($nums); $i++) {
                  $s = $nums[$i] + $nums[$i + 1];
                  if (isset($seen[$s])) return true;
                  $seen[$s] = true;
              }
              return false;
          }
        `,
        ruby: code`
          require 'set'

          def findSubarrays(nums)
            seen = Set.new
            nums.each_cons(2) do |a, b|
              return true unless seen.add?(a + b)
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Check Distances Between Same Letters (LC 2399) ──────────────
  (() => {
    const ref = (s: string, distance: number[]) => {
      for (let c = 0; c < 26; c++) {
        const ch = String.fromCharCode(97 + c);
        const a = s.indexOf(ch), b = s.lastIndexOf(ch);
        if (a >= 0 && b - a - 1 !== distance[c]) return false;
      }
      return true;
    };
    return {
      slug: "check-distances-between-same-letters",
      title: "Check Distances Between Same Letters",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "String", "Amazon"],
      signature: { funcName: "checkDistances", params: [{ name: "s", type: "string" as const }, { name: "distance", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "You are given a lowercase string `s` in which **every letter that appears, appears exactly twice**, and an integer array `distance` of length 26.\n\nLetter `i` of the alphabet (`a` is 0, `b` is 1, …, `z` is 25) is **well spaced** if the number of characters strictly between its two occurrences equals `distance[i]`. Letters that do not appear in `s` are ignored.\n\nReturn `true` if every letter in `s` is well spaced, and `false` otherwise.",
        [
          { in: "s = \"bccb\", distance = [0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]", out: "true", note: "The two `b`s have 2 characters between them and the two `c`s have 0, matching `distance[1] = 2` and `distance[2] = 0`." },
          { in: "s = \"aa\", distance = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]", out: "false", note: "The two `a`s are adjacent, with 0 characters between them, not 1." },
          { in: "s = \"abcabc\", distance = [2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]", out: "false", note: "`a` and `b` each have 2 characters between their copies, but so does `c`, and `distance[2]` asks for 1." },
        ],
        ["2 <= s.length <= 52", "s holds lowercase English letters; each letter in s appears exactly twice", "distance.length == 26", "0 <= distance[i] <= 50"]),
      hints: [
        "Record the index where each letter first appears.",
        "When you meet a letter the second time at index `j` after first seeing it at `i`, the gap is `j - i - 1`.",
        "Compare that gap with `distance[letter]` and stop at the first mismatch.",
      ],
      editorial: explain({
        idea: "One pass with a 26-slot table of first positions measures every letter's gap at its second occurrence.",
        steps: [
          "Fill `first[26]` with -1.",
          "For each index `j`: let `c` be the letter. If `first[c] == -1`, set it to `j`; otherwise, if `j - first[c] - 1 != distance[c]`, return false.",
          "Return true.",
        ],
        why: "Each letter appears exactly twice, so the second sighting closes its only gap, and `j - i - 1` counts the characters strictly between positions `i` and `j`. Letters absent from `s` are never checked.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The distance counts characters *between* the copies: adjacent copies have distance 0, not 1.",
          "Only letters present in `s` are checked; `distance` entries for absent letters can be anything.",
        ],
      }),
      examples: [
        { input: "\"bccb\"\n[0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]", expectedOutput: "true" },
        { input: "\"aa\"\n[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]", expectedOutput: "false" },
        { input: "\"abcabc\"\n[2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 3, 8, 26]));
        const letters = shuffle(rng, Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i))).slice(0, m);
        const s = shuffle(rng, letters.concat(letters)).join("");
        const distance = Array.from({ length: 26 }, () => ri(rng, 0, 50));
        const honest = rng() < 0.6;
        for (const ch of letters) {
          const c = ch.charCodeAt(0) - 97;
          const gap = s.lastIndexOf(ch) - s.indexOf(ch) - 1;
          if (honest || rng() < 0.85) distance[c] = gap;
          else distance[c] = rng() < 0.5 ? Math.max(0, gap - 1) : Math.min(50, gap + 1);
        }
        return { input: `"${s}"\n${fmtIntArr(distance)}`, expectedOutput: bool(ref(s, distance)) };
      },
      solutions: {
        python: code`
          from typing import List

          def checkDistances(s: str, distance: List[int]) -> bool:
              first = [-1] * 26
              for j, ch in enumerate(s):
                  c = ord(ch) - 97
                  if first[c] == -1:
                      first[c] = j
                  elif j - first[c] - 1 != distance[c]:
                      return False
              return True
        `,
        javascript: code`
          var checkDistances = function(s, distance) {
              var first = new Array(26).fill(-1);
              for (var j = 0; j < s.length; j++) {
                  var c = s.charCodeAt(j) - 97;
                  if (first[c] === -1) first[c] = j;
                  else if (j - first[c] - 1 !== distance[c]) return false;
              }
              return true;
          };
        `,
        typescript: code`
          function checkDistances(s: string, distance: number[]): boolean {
              var first: number[] = [];
              for (var z = 0; z < 26; z++) first.push(-1);
              for (var j = 0; j < s.length; j++) {
                  var c = s.charCodeAt(j) - 97;
                  if (first[c] === -1) first[c] = j;
                  else if (j - first[c] - 1 !== distance[c]) return false;
              }
              return true;
          }
        `,
        java: code`
          public static boolean checkDistances(String s, int[] distance) {
              int[] first = new int[26];
              Arrays.fill(first, -1);
              for (int j = 0; j < s.length(); j++) {
                  int c = s.charAt(j) - 'a';
                  if (first[c] == -1) first[c] = j;
                  else if (j - first[c] - 1 != distance[c]) return false;
              }
              return true;
          }
        `,
        cpp: code`
          bool checkDistances(string s, vector<int>& distance) {
              vector<int> first(26, -1);
              for (int j = 0; j < (int)s.size(); j++) {
                  int c = s[j] - 'a';
                  if (first[c] == -1) first[c] = j;
                  else if (j - first[c] - 1 != distance[c]) return false;
              }
              return true;
          }
        `,
        c: code`
          bool checkDistances(const char* s, int* distance, int distanceSize) {
              int first[26];
              for (int i = 0; i < 26; i++) first[i] = -1;
              for (int j = 0; s[j]; j++) {
                  int c = s[j] - 'a';
                  if (first[c] == -1) first[c] = j;
                  else if (j - first[c] - 1 != distance[c]) return false;
              }
              return true;
          }
        `,
        csharp: code`
          public static bool CheckDistances(string s, int[] distance)
          {
              var first = new int[26];
              for (int i = 0; i < 26; i++) first[i] = -1;
              for (int j = 0; j < s.Length; j++)
              {
                  int c = s[j] - 'a';
                  if (first[c] == -1) first[c] = j;
                  else if (j - first[c] - 1 != distance[c]) return false;
              }
              return true;
          }
        `,
        go: code`
          func checkDistances(s string, distance []int) bool {
              first := [26]int{}
              for i := range first {
                  first[i] = -1
              }
              for j := 0; j < len(s); j++ {
                  c := int(s[j] - 'a')
                  if first[c] == -1 {
                      first[c] = j
                  } else if j-first[c]-1 != distance[c] {
                      return false
                  }
              }
              return true
          }
        `,
        kotlin: code`
          fun checkDistances(s: String, distance: IntArray): Boolean {
              val first = IntArray(26) { -1 }
              for (j in s.indices) {
                  val c = s[j] - 'a'
                  if (first[c] == -1) first[c] = j
                  else if (j - first[c] - 1 != distance[c]) return false
              }
              return true
          }
        `,
        swift: code`
          func checkDistances(_ s: String, _ distance: [Int]) -> Bool {
              var first = [Int](repeating: -1, count: 26)
              for (j, ch) in s.utf8.enumerated() {
                  let c = Int(ch) - 97
                  if first[c] == -1 { first[c] = j }
                  else if j - first[c] - 1 != distance[c] { return false }
              }
              return true
          }
        `,
        rust: code`
          fn checkDistances(s: String, distance: Vec<i32>) -> bool {
              let mut first = [-1i32; 26];
              for (j, ch) in s.bytes().enumerate() {
                  let c = (ch - b'a') as usize;
                  if first[c] == -1 {
                      first[c] = j as i32;
                  } else if j as i32 - first[c] - 1 != distance[c] {
                      return false;
                  }
              }
              true
          }
        `,
        php: code`
          function checkDistances($s, $distance) {
              $first = array_fill(0, 26, -1);
              for ($j = 0; $j < strlen($s); $j++) {
                  $c = ord($s[$j]) - 97;
                  if ($first[$c] == -1) $first[$c] = $j;
                  elseif ($j - $first[$c] - 1 != $distance[$c]) return false;
              }
              return true;
          }
        `,
        ruby: code`
          def checkDistances(s, distance)
            first = Array.new(26, -1)
            s.each_byte.with_index do |ch, j|
              c = ch - 97
              if first[c] == -1
                first[c] = j
              elsif j - first[c] - 1 != distance[c]
                return false
              end
            end
            true
          end
        `,
      },
    };
  })(),

];
