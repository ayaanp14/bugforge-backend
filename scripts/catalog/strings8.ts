/**
 * String problems III (medium) — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

const LOWER = "abcdefghijklmnopqrstuvwxyz";

export const STRINGS8_PROBLEMS: CatalogProblem[] = [

  // ── Change Minimum Characters to Satisfy One of Three Conditions (LC 1737) ──
  (() => {
    const ref = (a: string, b: string) => {
      let best = Infinity;
      // Condition 3: both strings become one shared letter.
      for (let c = 0; c < 26; c++) {
        const ch = LOWER[c];
        let keep = 0;
        for (const x of a) if (x === ch) keep++;
        for (const x of b) if (x === ch) keep++;
        best = Math.min(best, a.length + b.length - keep);
      }
      // Conditions 1 and 2: one string at or below letter t, the other strictly above it.
      for (let t = 0; t < 25; t++) {
        const lim = LOWER[t];
        let aHigh = 0, aLow = 0, bHigh = 0, bLow = 0;
        for (const x of a) { if (x > lim) aHigh++; else aLow++; }
        for (const x of b) { if (x > lim) bHigh++; else bLow++; }
        best = Math.min(best, aHigh + bLow, bHigh + aLow);
      }
      return best;
    };
    return {
      slug: "change-minimum-characters-to-satisfy-one-of-three-conditions",
      title: "Change Minimum Characters to Satisfy One of Three Conditions",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Counting", "Prefix Sum", "Google", "Amazon"],
      signature: {
        funcName: "minCharacters",
        params: [{ name: "a", type: "string" as const }, { name: "b", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two strings `a` and `b` made of lowercase English letters. In one operation you may pick **any** character of either string and change it to **any** lowercase letter.\n\nYour goal is to make at least one of these three conditions true:\n\n1. Every letter of `a` comes strictly **before** every letter of `b` in the alphabet.\n2. Every letter of `b` comes strictly **before** every letter of `a` in the alphabet.\n3. Both `a` and `b` consist of **one and the same** letter repeated.\n\nReturn the minimum number of operations needed.",
        [
          { in: "a = \"code\", b = \"kairo\"", out: "2", note: "Change the `o` of `a` to `a` and the `a` of `b` to `z`: now `a` = \"cade\" uses only letters up to `e` and `b` = \"kziro\" only letters after `e`, so condition 1 holds." },
          { in: "a = \"zz\", b = \"zzz\"", out: "0", note: "Both strings are already the single letter `z`, so condition 3 holds." },
          { in: "a = \"ab\", b = \"ba\"", out: "2" },
        ],
        ["1 <= a.length, b.length <= 10^5", "a and b consist only of lowercase English letters"]),
      hints: [
        "Only the letter counts of each string matter, not their positions.",
        "Conditions 1 and 2 are about a boundary letter: one string must sit at or below some letter `t`, the other strictly above it. Try all 25 boundaries.",
        "With counts and running prefix sums, each boundary costs O(1): characters of the low string above `t` plus characters of the high string at or below `t`. Condition 3 keeps the letter with the largest combined count.",
      ],
      editorial: explain({
        idea: "Count the 26 letters of each string. Every condition then has a closed-form cost: condition 3 keeps the most common shared letter, and conditions 1 and 2 pick a boundary letter `t` and move everything on the wrong side of it.",
        steps: [
          "Build `ca[26]` and `cb[26]`, the letter counts of `a` and `b`.",
          "Condition 3: for each letter `c`, the cost is `len(a) + len(b) - ca[c] - cb[c]`; keep the minimum.",
          "Sweep `t` from `a` to `y` (never `z`, since nothing can be strictly above `z`), keeping prefix sums `pa` and `pb` of the counts up to `t`.",
          "Condition 1 at `t` costs `(len(a) - pa) + pb`: letters of `a` above `t` must come down, letters of `b` at or below `t` must go up. Condition 2 costs `(len(b) - pb) + pa`.",
          "Return the smallest cost seen.",
        ],
        why: "Condition 1 holds exactly when there is a letter `t` with all of `a` at or below `t` and all of `b` above it, so trying every `t` covers every way to satisfy it. For a fixed `t`, a character on the correct side never needs to change and each character on the wrong side needs exactly one operation, so the cost is precisely the count of misplaced characters. The same argument applies to condition 2 and, with a fixed target letter, to condition 3.",
        time: "O(len(a) + len(b) + 26)",
        space: "O(26)",
        pitfalls: [
          "The boundary `t` must stop at `y`: \"strictly greater than `z`\" is impossible, so `t = z` would count a free win that does not exist.",
          "Condition 3 needs both strings to use the same letter, not each string a single letter of its own.",
          "Do not forget condition 2 — the roles of `a` and `b` are not symmetric in the input.",
        ],
      }),
      examples: [
        { input: "\"code\"\n\"kairo\"", expectedOutput: "2" },
        { input: "\"zz\"\n\"zzz\"", expectedOutput: "0" },
        { input: "\"ab\"\n\"ba\"", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, [LOWER, LOWER, "ab", "abc", "xyz", "az", "mnop", "a", "z"]);
        const big = rng() < 0.15;
        const a = randLower(rng, 1, big ? 40 : 10, alpha);
        const b = randLower(rng, 1, big ? 40 : 10, rng() < 0.3 ? pick(rng, [LOWER, "yz", "abc", "z"]) : alpha);
        return { input: `"${a}"\n"${b}"`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: code`
          def minCharacters(a: str, b: str) -> int:
              ca = [0] * 26
              cb = [0] * 26
              for ch in a:
                  ca[ord(ch) - 97] += 1
              for ch in b:
                  cb[ord(ch) - 97] += 1
              m, n = len(a), len(b)
              best = m + n - max(ca[c] + cb[c] for c in range(26))
              pa = pb = 0
              for t in range(25):
                  pa += ca[t]
                  pb += cb[t]
                  best = min(best, (m - pa) + pb, (n - pb) + pa)
              return best
        `,
        javascript: code`
          var minCharacters = function(a, b) {
              var ca = new Array(26).fill(0), cb = new Array(26).fill(0);
              for (var i = 0; i < a.length; i++) ca[a.charCodeAt(i) - 97]++;
              for (var j = 0; j < b.length; j++) cb[b.charCodeAt(j) - 97]++;
              var m = a.length, n = b.length;
              var best = m + n;
              for (var c = 0; c < 26; c++) best = Math.min(best, m + n - ca[c] - cb[c]);
              var pa = 0, pb = 0;
              for (var t = 0; t < 25; t++) {
                  pa += ca[t];
                  pb += cb[t];
                  best = Math.min(best, m - pa + pb, n - pb + pa);
              }
              return best;
          };
        `,
        typescript: code`
          function minCharacters(a: string, b: string): number {
              var ca: number[] = [], cb: number[] = [];
              for (var z = 0; z < 26; z++) { ca.push(0); cb.push(0); }
              for (var i = 0; i < a.length; i++) ca[a.charCodeAt(i) - 97]++;
              for (var j = 0; j < b.length; j++) cb[b.charCodeAt(j) - 97]++;
              var m = a.length, n = b.length;
              var best = m + n;
              for (var c = 0; c < 26; c++) best = Math.min(best, m + n - ca[c] - cb[c]);
              var pa = 0, pb = 0;
              for (var t = 0; t < 25; t++) {
                  pa += ca[t];
                  pb += cb[t];
                  best = Math.min(best, m - pa + pb, n - pb + pa);
              }
              return best;
          }
        `,
        java: code`
          public static int minCharacters(String a, String b) {
              int[] ca = new int[26], cb = new int[26];
              for (int i = 0; i < a.length(); i++) ca[a.charAt(i) - 'a']++;
              for (int i = 0; i < b.length(); i++) cb[b.charAt(i) - 'a']++;
              int m = a.length(), n = b.length();
              int best = m + n;
              for (int c = 0; c < 26; c++) best = Math.min(best, m + n - ca[c] - cb[c]);
              int pa = 0, pb = 0;
              for (int t = 0; t < 25; t++) {
                  pa += ca[t];
                  pb += cb[t];
                  best = Math.min(best, Math.min(m - pa + pb, n - pb + pa));
              }
              return best;
          }
        `,
        cpp: code`
          int minCharacters(string a, string b) {
              int ca[26] = {0}, cb[26] = {0};
              for (char ch : a) ca[ch - 'a']++;
              for (char ch : b) cb[ch - 'a']++;
              int m = a.size(), n = b.size();
              int best = m + n;
              for (int c = 0; c < 26; c++) best = min(best, m + n - ca[c] - cb[c]);
              int pa = 0, pb = 0;
              for (int t = 0; t < 25; t++) {
                  pa += ca[t];
                  pb += cb[t];
                  best = min(best, min(m - pa + pb, n - pb + pa));
              }
              return best;
          }
        `,
        c: code`
          int minCharacters(const char* a, const char* b) {
              int ca[26] = {0}, cb[26] = {0};
              int m = strlen(a), n = strlen(b);
              for (int i = 0; i < m; i++) ca[a[i] - 'a']++;
              for (int i = 0; i < n; i++) cb[b[i] - 'a']++;
              int best = m + n;
              for (int c = 0; c < 26; c++) {
                  int cost = m + n - ca[c] - cb[c];
                  if (cost < best) best = cost;
              }
              int pa = 0, pb = 0;
              for (int t = 0; t < 25; t++) {
                  pa += ca[t];
                  pb += cb[t];
                  int c1 = m - pa + pb, c2 = n - pb + pa;
                  if (c1 < best) best = c1;
                  if (c2 < best) best = c2;
              }
              return best;
          }
        `,
        csharp: code`
          public static int MinCharacters(string a, string b)
          {
              int[] ca = new int[26], cb = new int[26];
              foreach (char ch in a) ca[ch - 'a']++;
              foreach (char ch in b) cb[ch - 'a']++;
              int m = a.Length, n = b.Length;
              int best = m + n;
              for (int c = 0; c < 26; c++) best = Math.Min(best, m + n - ca[c] - cb[c]);
              int pa = 0, pb = 0;
              for (int t = 0; t < 25; t++)
              {
                  pa += ca[t];
                  pb += cb[t];
                  best = Math.Min(best, Math.Min(m - pa + pb, n - pb + pa));
              }
              return best;
          }
        `,
        go: code`
          func minCharacters(a string, b string) int {
          	var ca, cb [26]int
          	for i := 0; i < len(a); i++ {
          		ca[a[i]-'a']++
          	}
          	for i := 0; i < len(b); i++ {
          		cb[b[i]-'a']++
          	}
          	m, n := len(a), len(b)
          	best := m + n
          	for c := 0; c < 26; c++ {
          		if v := m + n - ca[c] - cb[c]; v < best {
          			best = v
          		}
          	}
          	pa, pb := 0, 0
          	for t := 0; t < 25; t++ {
          		pa += ca[t]
          		pb += cb[t]
          		if v := m - pa + pb; v < best {
          			best = v
          		}
          		if v := n - pb + pa; v < best {
          			best = v
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun minCharacters(a: String, b: String): Int {
              val ca = IntArray(26)
              val cb = IntArray(26)
              for (ch in a) ca[ch - 'a']++
              for (ch in b) cb[ch - 'a']++
              val m = a.length
              val n = b.length
              var best = m + n
              for (c in 0 until 26) best = minOf(best, m + n - ca[c] - cb[c])
              var pa = 0
              var pb = 0
              for (t in 0 until 25) {
                  pa += ca[t]
                  pb += cb[t]
                  best = minOf(best, m - pa + pb, n - pb + pa)
              }
              return best
          }
        `,
        swift: code`
          func minCharacters(_ a: String, _ b: String) -> Int {
              var ca = [Int](repeating: 0, count: 26)
              var cb = [Int](repeating: 0, count: 26)
              for ch in a.utf8 { ca[Int(ch) - 97] += 1 }
              for ch in b.utf8 { cb[Int(ch) - 97] += 1 }
              let m = a.utf8.count, n = b.utf8.count
              var best = m + n
              for c in 0..<26 { best = min(best, m + n - ca[c] - cb[c]) }
              var pa = 0, pb = 0
              for t in 0..<25 {
                  pa += ca[t]
                  pb += cb[t]
                  best = min(best, m - pa + pb, n - pb + pa)
              }
              return best
          }
        `,
        rust: code`
          fn minCharacters(a: String, b: String) -> i32 {
              let mut ca = [0i32; 26];
              let mut cb = [0i32; 26];
              for &ch in a.as_bytes() { ca[(ch - b'a') as usize] += 1; }
              for &ch in b.as_bytes() { cb[(ch - b'a') as usize] += 1; }
              let m = a.len() as i32;
              let n = b.len() as i32;
              let mut best = m + n;
              for c in 0..26 { best = best.min(m + n - ca[c] - cb[c]); }
              let (mut pa, mut pb) = (0i32, 0i32);
              for t in 0..25 {
                  pa += ca[t];
                  pb += cb[t];
                  best = best.min(m - pa + pb).min(n - pb + pa);
              }
              best
          }
        `,
        php: code`
          function minCharacters($a, $b) {
              $ca = array_fill(0, 26, 0);
              $cb = array_fill(0, 26, 0);
              $m = strlen($a);
              $n = strlen($b);
              for ($i = 0; $i < $m; $i++) $ca[ord($a[$i]) - 97]++;
              for ($i = 0; $i < $n; $i++) $cb[ord($b[$i]) - 97]++;
              $best = $m + $n;
              for ($c = 0; $c < 26; $c++) $best = min($best, $m + $n - $ca[$c] - $cb[$c]);
              $pa = 0;
              $pb = 0;
              for ($t = 0; $t < 25; $t++) {
                  $pa += $ca[$t];
                  $pb += $cb[$t];
                  $best = min($best, $m - $pa + $pb, $n - $pb + $pa);
              }
              return $best;
          }
        `,
        ruby: code`
          def minCharacters(a, b)
            ca = Array.new(26, 0)
            cb = Array.new(26, 0)
            a.each_byte { |ch| ca[ch - 97] += 1 }
            b.each_byte { |ch| cb[ch - 97] += 1 }
            m = a.length
            n = b.length
            best = m + n
            26.times { |c| best = [best, m + n - ca[c] - cb[c]].min }
            pa = 0
            pb = 0
            25.times do |t|
              pa += ca[t]
              pb += cb[t]
              best = [best, m - pa + pb, n - pb + pa].min
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Largest Merge Of Two Strings (LC 1754) ──────────────────────
  (() => {
    // Independent check: best merge of every pair of suffixes by DP (all
    // candidates for a state have the same length, so plain string max works).
    const ref = (w1: string, w2: string) => {
      const n = w1.length, m = w2.length;
      const best: string[][] = Array.from({ length: n + 1 }, () => new Array<string>(m + 1).fill(""));
      for (let i = n; i >= 0; i--) {
        for (let j = m; j >= 0; j--) {
          if (i === n) { best[i][j] = w2.slice(j); continue; }
          if (j === m) { best[i][j] = w1.slice(i); continue; }
          const x = w1[i] + best[i + 1][j];
          const y = w2[j] + best[i][j + 1];
          best[i][j] = x > y ? x : y;
        }
      }
      return best[0][0];
    };
    return {
      slug: "largest-merge-of-two-strings",
      title: "Largest Merge Of Two Strings",
      difficulty: "MEDIUM" as const,
      tags: ["Two Pointers", "String", "Greedy", "Snapchat", "Amazon", "Google"],
      signature: {
        funcName: "largestMerge",
        params: [{ name: "word1", type: "string" as const }, { name: "word2", type: "string" as const }],
        returns: "string" as const,
      },
      description: describe(
        "You are given two strings `word1` and `word2`. Build a string `merge` by repeating the following until both words are empty: take the **first** character of `word1` or of `word2` (whichever you like, as long as that word is non-empty), remove it from that word and append it to `merge`.\n\nEvery character of both words ends up in `merge` exactly once, and each word's characters keep their relative order.\n\nReturn the lexicographically **largest** `merge` you can build. A string `x` is larger than a string `y` of the same length if, at the first position where they differ, `x` has the later letter.",
        [
          { in: "word1 = \"kairo\", word2 = \"code\"", out: "kcodeairo", note: "Take `k` first; after that every letter of `code` beats the `a` waiting in `word1`, so all of `code` goes before `airo`." },
          { in: "word1 = \"ab\", word2 = \"ac\"", out: "acab", note: "Both fronts are `a`. Taking it from `word2` exposes `c` next, which beats `b`." },
          { in: "word1 = \"abc\", word2 = \"abd\"", out: "abdabc" },
        ],
        ["1 <= word1.length, word2.length <= 3000", "word1 and word2 consist only of lowercase English letters"]),
      hints: [
        "Comparing only the two front characters fails when they are equal — you need a tie-break.",
        "When the fronts tie, look further: the word whose remaining suffix is larger should give up its character first.",
        "At every step take the front of the word whose whole remaining suffix is lexicographically larger; when one word runs out, append the rest of the other.",
      ],
      editorial: explain({
        idea: "Greedy on suffixes: at each step take the front character of the word whose remaining suffix is lexicographically larger.",
        steps: [
          "Keep indices `i` into `word1` and `j` into `word2`.",
          "While both have characters left, compare the suffixes `word1[i:]` and `word2[j:]`. If `word1[i:]` is larger, append `word1[i]` and advance `i`; otherwise append `word2[j]` and advance `j`.",
          "Append whatever is left of either word.",
        ],
        why: "If the fronts differ, taking the larger one is clearly right. If they are equal, the character appended is the same either way, but the choice decides which word's later characters become available sooner. Taking from the word with the larger suffix exposes the larger continuation earlier; an exchange argument shows any merge that took from the smaller suffix can be rearranged into one at least as large that follows the greedy choice. Comparing whole suffixes handles long runs of equal characters and the case where one suffix is a prefix of the other (the longer one is larger, and drawing from it keeps the shorter one's characters in reserve).",
        time: "O((n + m)^2) in the worst case, from the suffix comparisons",
        space: "O(n + m) for the result",
        pitfalls: [
          "Breaking a tie of equal front characters arbitrarily is wrong: for `word1 = \"ab\"` and `word2 = \"ac\"` you must take the `a` of `word2` first to reach `acab`.",
          "When one suffix is a prefix of the other, the longer suffix compares larger — standard string comparison already does this.",
          "Build the answer with a string builder or list; repeated string concatenation can be quadratic in some languages.",
        ],
      }),
      examples: [
        { input: "\"kairo\"\n\"code\"", expectedOutput: "kcodeairo" },
        { input: "\"ab\"\n\"ac\"", expectedOutput: "acab" },
        { input: "\"abc\"\n\"abd\"", expectedOutput: "abdabc" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "ab", "xyz", "abcd", LOWER]);
        const w1 = randLower(rng, 1, rng() < 0.2 ? 18 : 8, alpha);
        const w2 = rng() < 0.15 ? w1.slice(0, ri(rng, 1, w1.length)) + randLower(rng, 0, 3, alpha) : randLower(rng, 1, rng() < 0.2 ? 18 : 8, alpha);
        return { input: `"${w1}"\n"${w2}"`, expectedOutput: ref(w1, w2) };
      },
      solutions: {
        python: code`
          def largestMerge(word1: str, word2: str) -> str:
              i, j = 0, 0
              out = []
              while i < len(word1) and j < len(word2):
                  if word1[i:] > word2[j:]:
                      out.append(word1[i])
                      i += 1
                  else:
                      out.append(word2[j])
                      j += 1
              out.append(word1[i:])
              out.append(word2[j:])
              return "".join(out)
        `,
        javascript: code`
          var largestMerge = function(word1, word2) {
              var i = 0, j = 0, out = [];
              while (i < word1.length && j < word2.length) {
                  if (word1.slice(i) > word2.slice(j)) out.push(word1[i++]);
                  else out.push(word2[j++]);
              }
              return out.join("") + word1.slice(i) + word2.slice(j);
          };
        `,
        typescript: code`
          function largestMerge(word1: string, word2: string): string {
              var i = 0, j = 0;
              var out: string[] = [];
              while (i < word1.length && j < word2.length) {
                  if (word1.slice(i) > word2.slice(j)) { out.push(word1.charAt(i)); i++; }
                  else { out.push(word2.charAt(j)); j++; }
              }
              return out.join("") + word1.slice(i) + word2.slice(j);
          }
        `,
        java: code`
          public static String largestMerge(String word1, String word2) {
              StringBuilder sb = new StringBuilder();
              int i = 0, j = 0;
              while (i < word1.length() && j < word2.length()) {
                  if (word1.substring(i).compareTo(word2.substring(j)) > 0) sb.append(word1.charAt(i++));
                  else sb.append(word2.charAt(j++));
              }
              sb.append(word1.substring(i)).append(word2.substring(j));
              return sb.toString();
          }
        `,
        cpp: code`
          string largestMerge(string word1, string word2) {
              string out;
              size_t i = 0, j = 0;
              while (i < word1.size() && j < word2.size()) {
                  if (word1.compare(i, string::npos, word2, j, string::npos) > 0) out += word1[i++];
                  else out += word2[j++];
              }
              out += word1.substr(i);
              out += word2.substr(j);
              return out;
          }
        `,
        c: code`
          char* largestMerge(const char* word1, const char* word2) {
              int n = strlen(word1), m = strlen(word2);
              char* out = (char*)malloc(n + m + 1);
              int i = 0, j = 0, k = 0;
              while (i < n && j < m) {
                  if (strcmp(word1 + i, word2 + j) > 0) out[k++] = word1[i++];
                  else out[k++] = word2[j++];
              }
              while (i < n) out[k++] = word1[i++];
              while (j < m) out[k++] = word2[j++];
              out[k] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string LargestMerge(string word1, string word2)
          {
              var sb = new System.Text.StringBuilder();
              int i = 0, j = 0;
              while (i < word1.Length && j < word2.Length)
              {
                  if (string.CompareOrdinal(word1.Substring(i), word2.Substring(j)) > 0) sb.Append(word1[i++]);
                  else sb.Append(word2[j++]);
              }
              sb.Append(word1.Substring(i)).Append(word2.Substring(j));
              return sb.ToString();
          }
        `,
        go: code`
          func largestMerge(word1 string, word2 string) string {
          	var sb strings.Builder
          	i, j := 0, 0
          	for i < len(word1) && j < len(word2) {
          		if word1[i:] > word2[j:] {
          			sb.WriteByte(word1[i])
          			i++
          		} else {
          			sb.WriteByte(word2[j])
          			j++
          		}
          	}
          	sb.WriteString(word1[i:])
          	sb.WriteString(word2[j:])
          	return sb.String()
          }
        `,
        kotlin: code`
          fun largestMerge(word1: String, word2: String): String {
              val sb = StringBuilder()
              var i = 0
              var j = 0
              while (i < word1.length && j < word2.length) {
                  if (word1.substring(i) > word2.substring(j)) {
                      sb.append(word1[i])
                      i++
                  } else {
                      sb.append(word2[j])
                      j++
                  }
              }
              sb.append(word1.substring(i)).append(word2.substring(j))
              return sb.toString()
          }
        `,
        swift: code`
          func largestMerge(_ word1: String, _ word2: String) -> String {
              let a = Array(word1.utf8), b = Array(word2.utf8)
              func firstIsLarger(_ p: Int, _ q: Int) -> Bool {
                  var x = p, y = q
                  while x < a.count && y < b.count {
                      if a[x] != b[y] { return a[x] > b[y] }
                      x += 1
                      y += 1
                  }
                  return x < a.count
              }
              var i = 0, j = 0
              var out = [UInt8]()
              while i < a.count && j < b.count {
                  if firstIsLarger(i, j) {
                      out.append(a[i])
                      i += 1
                  } else {
                      out.append(b[j])
                      j += 1
                  }
              }
              while i < a.count { out.append(a[i]); i += 1 }
              while j < b.count { out.append(b[j]); j += 1 }
              return String(decoding: out, as: UTF8.self)
          }
        `,
        rust: code`
          fn largestMerge(word1: String, word2: String) -> String {
              let a = word1.as_bytes();
              let b = word2.as_bytes();
              let (mut i, mut j) = (0usize, 0usize);
              let mut out: Vec<u8> = Vec::with_capacity(a.len() + b.len());
              while i < a.len() && j < b.len() {
                  if &a[i..] > &b[j..] {
                      out.push(a[i]);
                      i += 1;
                  } else {
                      out.push(b[j]);
                      j += 1;
                  }
              }
              out.extend_from_slice(&a[i..]);
              out.extend_from_slice(&b[j..]);
              String::from_utf8(out).unwrap()
          }
        `,
        php: code`
          function largestMerge($word1, $word2) {
              $i = 0;
              $j = 0;
              $n = strlen($word1);
              $m = strlen($word2);
              $out = "";
              while ($i < $n && $j < $m) {
                  if (strcmp(substr($word1, $i), substr($word2, $j)) > 0) {
                      $out .= $word1[$i];
                      $i++;
                  } else {
                      $out .= $word2[$j];
                      $j++;
                  }
              }
              if ($i < $n) $out .= substr($word1, $i);
              if ($j < $m) $out .= substr($word2, $j);
              return $out;
          }
        `,
        ruby: code`
          def largestMerge(word1, word2)
            i = 0
            j = 0
            out = []
            while i < word1.length && j < word2.length
              if word1[i..-1] > word2[j..-1]
                out << word1[i]
                i += 1
              else
                out << word2[j]
                j += 1
              end
            end
            out.join + word1[i..-1] + word2[j..-1]
          end
        `,
      },
    };
  })(),

  // ── Minimum Number of Swaps to Make the Binary String Alternating (LC 1864) ──
  (() => {
    // Independent check: BFS over swap states for short strings, the counting
    // argument for longer ones.
    const ref = (s: string) => {
      const n = s.length;
      let ones = 0;
      for (const ch of s) if (ch === "1") ones++;
      if (Math.abs(n - 2 * ones) > 1) return -1;
      const alt = (t: string) => { for (let i = 1; i < t.length; i++) if (t[i] === t[i - 1]) return false; return true; };
      if (n <= 10) {
        const seen = new Set<string>([s]);
        let frontier = [s];
        for (let d = 0; frontier.length; d++) {
          const nextF: string[] = [];
          for (const t of frontier) {
            if (alt(t)) return d;
            for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
              if (t[i] === t[j]) continue;
              const arr = t.split("");
              arr[i] = t[j]; arr[j] = t[i];
              const u = arr.join("");
              if (!seen.has(u)) { seen.add(u); nextF.push(u); }
            }
          }
          frontier = nextF;
        }
        return -1;
      }
      let best = -1;
      for (const f of [0, 1]) {
        const want = f === 0 ? n - ones : ones;
        if (want !== Math.ceil(n / 2)) continue;
        let miss = 0;
        for (let i = 0; i < n; i++) if (Number(s[i]) !== (i + f) % 2) miss++;
        if (best === -1 || miss / 2 < best) best = miss / 2;
      }
      return best;
    };
    return {
      slug: "minimum-number-of-swaps-to-make-the-binary-string-alternating",
      title: "Minimum Number of Swaps to Make the Binary String Alternating",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Counting", "Amazon", "Microsoft"],
      signature: { funcName: "minSwaps", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a binary string `s`. In one swap you may exchange **any** two characters of `s` — they do not have to be next to each other.\n\nA string is **alternating** when no two adjacent characters are equal, like `\"0101\"` or `\"10101\"`.\n\nReturn the minimum number of swaps that make `s` alternating, or `-1` if it cannot be done.",
        [
          { in: "s = \"110100\"", out: "1", note: "Swap the first and the last character to get `\"010101\"`." },
          { in: "s = \"010\"", out: "0", note: "Already alternating." },
          { in: "s = \"1110\"", out: "-1", note: "Three `1`s and one `0` can never alternate." },
        ],
        ["1 <= s.length <= 1000", "s[i] is either '0' or '1'"]),
      hints: [
        "Swaps never change how many `0`s and `1`s there are. When is an alternating arrangement possible at all?",
        "There are only two alternating strings of a given length: one starting with `0`, one starting with `1`. Which of them have the right counts?",
        "Against a feasible target, count the mismatched positions. Each swap can fix two of them — one misplaced `0` and one misplaced `1`.",
      ],
      editorial: explain({
        idea: "The counts decide which of the two alternating targets are reachable; against a reachable target, the answer is half the number of mismatched positions.",
        steps: [
          "Count the `1`s and `0`s. If they differ by more than one, return `-1`.",
          "For each start bit `f` in {0, 1}: the target `f, 1-f, f, ...` needs `ceil(n / 2)` copies of `f`. Skip it if `s` does not have exactly that many.",
          "Count positions `i` where `s[i]` differs from the target bit `(i + f) % 2`; the cost is half that count.",
          "Return the smaller cost among the feasible targets.",
        ],
        why: "When the counts match the target, the mismatches split evenly: every position holding a `1` where a `0` belongs is balanced by one holding a `0` where a `1` belongs. One swap of such a pair fixes two mismatches, and no swap can fix more than two, so `mismatches / 2` swaps are both enough and necessary. When `n` is even both targets are feasible and we take the cheaper one; when `n` is odd only the target starting with the majority bit is feasible.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Swaps are between any two positions, not adjacent ones — this is not a bubble-sort distance.",
          "For odd `n` only one target is feasible; computing the other gives a wrong (smaller) answer.",
          "The mismatch count against a feasible target is always even; dividing by two is exact.",
        ],
      }),
      examples: [
        { input: "\"110100\"", expectedOutput: "1" },
        { input: "\"010\"", expectedOutput: "0" },
        { input: "\"1110\"", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.75 ? ri(rng, 1, 10) : ri(rng, 11, 60);
        let s: string;
        if (rng() < 0.7) {
          const ones = Math.floor(n / 2) + (n % 2 === 1 && rng() < 0.5 ? 1 : 0);
          const arr: string[] = [];
          for (let i = 0; i < n; i++) arr.push(i < ones ? "1" : "0");
          s = shuffle(rng, arr).join("");
        } else {
          s = randLower(rng, n, n, "01");
        }
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def minSwaps(s: str) -> int:
              n = len(s)
              ones = s.count("1")
              zeros = n - ones
              if abs(ones - zeros) > 1:
                  return -1
              best = -1
              for f in (0, 1):
                  have = zeros if f == 0 else ones
                  if have != (n + 1) // 2:
                      continue
                  miss = 0
                  for i, ch in enumerate(s):
                      if int(ch) != (i + f) % 2:
                          miss += 1
                  if best == -1 or miss // 2 < best:
                      best = miss // 2
              return best
        `,
        javascript: code`
          var minSwaps = function(s) {
              var n = s.length, ones = 0;
              for (var i = 0; i < n; i++) if (s[i] === "1") ones++;
              var zeros = n - ones;
              if (Math.abs(ones - zeros) > 1) return -1;
              var best = -1;
              for (var f = 0; f < 2; f++) {
                  var have = f === 0 ? zeros : ones;
                  if (have !== Math.floor((n + 1) / 2)) continue;
                  var miss = 0;
                  for (var k = 0; k < n; k++) if (s.charCodeAt(k) - 48 !== (k + f) % 2) miss++;
                  if (best === -1 || miss / 2 < best) best = miss / 2;
              }
              return best;
          };
        `,
        typescript: code`
          function minSwaps(s: string): number {
              var n = s.length, ones = 0;
              for (var i = 0; i < n; i++) if (s.charAt(i) === "1") ones++;
              var zeros = n - ones;
              if (Math.abs(ones - zeros) > 1) return -1;
              var best = -1;
              for (var f = 0; f < 2; f++) {
                  var have = f === 0 ? zeros : ones;
                  if (have !== Math.floor((n + 1) / 2)) continue;
                  var miss = 0;
                  for (var k = 0; k < n; k++) if (s.charCodeAt(k) - 48 !== (k + f) % 2) miss++;
                  if (best === -1 || miss / 2 < best) best = miss / 2;
              }
              return best;
          }
        `,
        java: code`
          public static int minSwaps(String s) {
              int n = s.length(), ones = 0;
              for (int i = 0; i < n; i++) if (s.charAt(i) == '1') ones++;
              int zeros = n - ones;
              if (Math.abs(ones - zeros) > 1) return -1;
              int best = -1;
              for (int f = 0; f < 2; f++) {
                  int have = f == 0 ? zeros : ones;
                  if (have != (n + 1) / 2) continue;
                  int miss = 0;
                  for (int k = 0; k < n; k++) if (s.charAt(k) - '0' != (k + f) % 2) miss++;
                  if (best == -1 || miss / 2 < best) best = miss / 2;
              }
              return best;
          }
        `,
        cpp: code`
          int minSwaps(string s) {
              int n = s.size(), ones = 0;
              for (char ch : s) if (ch == '1') ones++;
              int zeros = n - ones;
              if (abs(ones - zeros) > 1) return -1;
              int best = -1;
              for (int f = 0; f < 2; f++) {
                  int have = f == 0 ? zeros : ones;
                  if (have != (n + 1) / 2) continue;
                  int miss = 0;
                  for (int k = 0; k < n; k++) if (s[k] - '0' != (k + f) % 2) miss++;
                  if (best == -1 || miss / 2 < best) best = miss / 2;
              }
              return best;
          }
        `,
        c: code`
          int minSwaps(const char* s) {
              int n = strlen(s), ones = 0;
              for (int i = 0; i < n; i++) if (s[i] == '1') ones++;
              int zeros = n - ones;
              if (ones - zeros > 1 || zeros - ones > 1) return -1;
              int best = -1;
              for (int f = 0; f < 2; f++) {
                  int have = f == 0 ? zeros : ones;
                  if (have != (n + 1) / 2) continue;
                  int miss = 0;
                  for (int k = 0; k < n; k++) if (s[k] - '0' != (k + f) % 2) miss++;
                  if (best == -1 || miss / 2 < best) best = miss / 2;
              }
              return best;
          }
        `,
        csharp: code`
          public static int MinSwaps(string s)
          {
              int n = s.Length, ones = 0;
              foreach (char ch in s) if (ch == '1') ones++;
              int zeros = n - ones;
              if (Math.Abs(ones - zeros) > 1) return -1;
              int best = -1;
              for (int f = 0; f < 2; f++)
              {
                  int have = f == 0 ? zeros : ones;
                  if (have != (n + 1) / 2) continue;
                  int miss = 0;
                  for (int k = 0; k < n; k++) if (s[k] - '0' != (k + f) % 2) miss++;
                  if (best == -1 || miss / 2 < best) best = miss / 2;
              }
              return best;
          }
        `,
        go: code`
          func minSwaps(s string) int {
          	n, ones := len(s), 0
          	for i := 0; i < n; i++ {
          		if s[i] == '1' {
          			ones++
          		}
          	}
          	zeros := n - ones
          	if ones-zeros > 1 || zeros-ones > 1 {
          		return -1
          	}
          	best := -1
          	for f := 0; f < 2; f++ {
          		have := ones
          		if f == 0 {
          			have = zeros
          		}
          		if have != (n+1)/2 {
          			continue
          		}
          		miss := 0
          		for k := 0; k < n; k++ {
          			if int(s[k]-'0') != (k+f)%2 {
          				miss++
          			}
          		}
          		if best == -1 || miss/2 < best {
          			best = miss / 2
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun minSwaps(s: String): Int {
              val n = s.length
              var ones = 0
              for (ch in s) if (ch == '1') ones++
              val zeros = n - ones
              if (Math.abs(ones - zeros) > 1) return -1
              var best = -1
              for (f in 0..1) {
                  val have = if (f == 0) zeros else ones
                  if (have != (n + 1) / 2) continue
                  var miss = 0
                  for (k in 0 until n) if (s[k] - '0' != (k + f) % 2) miss++
                  if (best == -1 || miss / 2 < best) best = miss / 2
              }
              return best
          }
        `,
        swift: code`
          func minSwaps(_ s: String) -> Int {
              let a = Array(s.utf8)
              let n = a.count
              var ones = 0
              for ch in a where ch == 49 { ones += 1 }
              let zeros = n - ones
              if abs(ones - zeros) > 1 { return -1 }
              var best = -1
              for f in 0..<2 {
                  let have = f == 0 ? zeros : ones
                  if have != (n + 1) / 2 { continue }
                  var miss = 0
                  for k in 0..<n where Int(a[k]) - 48 != (k + f) % 2 { miss += 1 }
                  if best == -1 || miss / 2 < best { best = miss / 2 }
              }
              return best
          }
        `,
        rust: code`
          fn minSwaps(s: String) -> i32 {
              let a = s.as_bytes();
              let n = a.len() as i32;
              let ones = a.iter().filter(|&&c| c == b'1').count() as i32;
              let zeros = n - ones;
              if (ones - zeros).abs() > 1 {
                  return -1;
              }
              let mut best = -1;
              for f in 0..2i32 {
                  let have = if f == 0 { zeros } else { ones };
                  if have != (n + 1) / 2 {
                      continue;
                  }
                  let mut miss = 0;
                  for k in 0..a.len() {
                      if (a[k] - b'0') as i32 != (k as i32 + f) % 2 {
                          miss += 1;
                      }
                  }
                  if best == -1 || miss / 2 < best {
                      best = miss / 2;
                  }
              }
              best
          }
        `,
        php: code`
          function minSwaps($s) {
              $n = strlen($s);
              $ones = substr_count($s, "1");
              $zeros = $n - $ones;
              if (abs($ones - $zeros) > 1) return -1;
              $best = -1;
              for ($f = 0; $f < 2; $f++) {
                  $have = $f == 0 ? $zeros : $ones;
                  if ($have != intdiv($n + 1, 2)) continue;
                  $miss = 0;
                  for ($k = 0; $k < $n; $k++) {
                      if (ord($s[$k]) - 48 != ($k + $f) % 2) $miss++;
                  }
                  $c = intdiv($miss, 2);
                  if ($best == -1 || $c < $best) $best = $c;
              }
              return $best;
          }
        `,
        ruby: code`
          def minSwaps(s)
            n = s.length
            ones = s.count("1")
            zeros = n - ones
            return -1 if (ones - zeros).abs > 1
            best = -1
            [0, 1].each do |f|
              have = f == 0 ? zeros : ones
              next if have != (n + 1) / 2
              miss = 0
              n.times { |k| miss += 1 if s.getbyte(k) - 48 != (k + f) % 2 }
              best = miss / 2 if best == -1 || miss / 2 < best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Maximum Value after Insertion (LC 1881) ─────────────────────
  (() => {
    // Independent check: try every insertion point. All candidates have the
    // same length and sign, so the largest value is the lexicographically
    // largest string when positive and the smallest when negative.
    const ref = (n: string, x: number) => {
      const d = String(x);
      const neg = n[0] === "-";
      let best: string | null = null;
      for (let i = neg ? 1 : 0; i <= n.length; i++) {
        const cand = n.slice(0, i) + d + n.slice(i);
        if (best === null || (neg ? cand < best : cand > best)) best = cand;
      }
      return best as string;
    };
    return {
      slug: "maximum-value-after-insertion",
      title: "Maximum Value after Insertion",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Amazon", "Adobe"],
      signature: {
        funcName: "maxValue",
        params: [{ name: "n", type: "string" as const }, { name: "x", type: "int" as const }],
        returns: "string" as const,
      },
      description: describe(
        "You are given a very large integer `n` written as a string, and a single digit `x`. Every digit of `n` and `x` itself is between `1` and `9`, and `n` may be negative, in which case it starts with `'-'`.\n\nInsert `x` **once** anywhere among the digits of `n` (not to the left of a minus sign) so that the resulting number is as **large** as possible, and return it as a string.\n\nFor a negative number, larger means closer to zero: `-123` is larger than `-321`.",
        [
          { in: "n = \"73\", x = 6", out: "763", note: "The options are 673, 763 and 736; the largest is 763." },
          { in: "n = \"-13\", x = 2", out: "-123", note: "The options are -213, -123 and -132; the largest is -123." },
          { in: "n = \"99\", x = 9", out: "999" },
        ],
        ["1 <= n.length <= 10^5", "1 <= x <= 9", "the digits of n are in the range [1, 9]", "n is a valid representation of an integer; a negative n begins with '-'"]),
      hints: [
        "Every candidate has the same number of digits, so comparing them is comparing the digit strings from the left.",
        "For a positive number you want `x` as early as possible — but only once it beats the digit it displaces.",
        "Positive: insert before the first digit smaller than `x`. Negative: insert before the first digit larger than `x`. If there is none, append `x` at the end.",
      ],
      editorial: explain({
        idea: "All results have equal length, so the first position where two candidates differ decides. Place `x` as early as it improves that first differing digit.",
        steps: [
          "If `n` is positive, scan its digits from the left and insert `x` before the first digit strictly smaller than `x`.",
          "If `n` is negative, skip the `-` and insert `x` before the first digit strictly larger than `x` (a smaller magnitude means a larger negative number).",
          "If the scan finds no such digit, append `x` at the end.",
        ],
        why: "Inserting `x` before digit `i` leaves digits `0..i-1` untouched and puts `x` at position `i`. For a positive `n`, if `n[i] >= x` the candidate that keeps `n[i]` there is at least as large at the first differing spot, so we keep scanning; the first time `n[i] < x`, putting `x` there wins at position `i` against every later insertion point. For a negative `n` the magnitude should be as small as possible, which flips the comparison.",
        time: "O(n)",
        space: "O(n) for the output string",
        pitfalls: [
          "Use strict comparisons: when the digit equals `x`, inserting before or after it gives the same string, and continuing is what keeps the scan correct for later digits.",
          "Never insert before the minus sign.",
          "Do not convert `n` to a number — it can have 100,000 digits.",
        ],
      }),
      examples: [
        { input: "\"73\"\n6", expectedOutput: "763" },
        { input: "\"-13\"\n2", expectedOutput: "-123" },
        { input: "\"99\"\n9", expectedOutput: "999" },
      ],
      gen: (rng: Rng) => {
        const digits = pick(rng, ["123456789", "123456789", "19", "5", "456", "789", "123"]);
        const body = randLower(rng, 1, rng() < 0.2 ? 40 : 8, digits);
        const n = (rng() < 0.5 ? "-" : "") + body;
        const x = ri(rng, 1, 9);
        return { input: `"${n}"\n${x}`, expectedOutput: ref(n, x) };
      },
      solutions: {
        python: code`
          def maxValue(n: str, x: int) -> str:
              d = str(x)
              if n[0] == "-":
                  for i in range(1, len(n)):
                      if n[i] > d:
                          return n[:i] + d + n[i:]
                  return n + d
              for i in range(len(n)):
                  if n[i] < d:
                      return n[:i] + d + n[i:]
              return n + d
        `,
        javascript: code`
          var maxValue = function(n, x) {
              var d = String(x);
              if (n[0] === "-") {
                  for (var i = 1; i < n.length; i++) if (n[i] > d) return n.slice(0, i) + d + n.slice(i);
                  return n + d;
              }
              for (var j = 0; j < n.length; j++) if (n[j] < d) return n.slice(0, j) + d + n.slice(j);
              return n + d;
          };
        `,
        typescript: code`
          function maxValue(n: string, x: number): string {
              var d = String(x);
              if (n.charAt(0) === "-") {
                  for (var i = 1; i < n.length; i++) if (n.charAt(i) > d) return n.slice(0, i) + d + n.slice(i);
                  return n + d;
              }
              for (var j = 0; j < n.length; j++) if (n.charAt(j) < d) return n.slice(0, j) + d + n.slice(j);
              return n + d;
          }
        `,
        java: code`
          public static String maxValue(String n, int x) {
              char d = (char) ('0' + x);
              int len = n.length();
              if (n.charAt(0) == '-') {
                  for (int i = 1; i < len; i++) if (n.charAt(i) > d) return n.substring(0, i) + d + n.substring(i);
                  return n + d;
              }
              for (int i = 0; i < len; i++) if (n.charAt(i) < d) return n.substring(0, i) + d + n.substring(i);
              return n + d;
          }
        `,
        cpp: code`
          string maxValue(string n, int x) {
              char d = (char)('0' + x);
              int len = n.size();
              if (n[0] == '-') {
                  for (int i = 1; i < len; i++) if (n[i] > d) return n.substr(0, i) + d + n.substr(i);
                  return n + d;
              }
              for (int i = 0; i < len; i++) if (n[i] < d) return n.substr(0, i) + d + n.substr(i);
              return n + d;
          }
        `,
        c: code`
          char* maxValue(const char* n, int x) {
              int len = strlen(n);
              char d = (char)('0' + x);
              int pos = len;
              if (n[0] == '-') {
                  for (int i = 1; i < len; i++) if (n[i] > d) { pos = i; break; }
              } else {
                  for (int i = 0; i < len; i++) if (n[i] < d) { pos = i; break; }
              }
              char* out = (char*)malloc(len + 2);
              memcpy(out, n, pos);
              out[pos] = d;
              memcpy(out + pos + 1, n + pos, len - pos);
              out[len + 1] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string MaxValue(string n, int x)
          {
              char d = (char)('0' + x);
              int len = n.Length;
              int pos = len;
              if (n[0] == '-')
              {
                  for (int i = 1; i < len; i++) if (n[i] > d) { pos = i; break; }
              }
              else
              {
                  for (int i = 0; i < len; i++) if (n[i] < d) { pos = i; break; }
              }
              return n.Substring(0, pos) + d + n.Substring(pos);
          }
        `,
        go: code`
          func maxValue(n string, x int) string {
          	d := byte('0' + x)
          	pos := len(n)
          	if n[0] == '-' {
          		for i := 1; i < len(n); i++ {
          			if n[i] > d {
          				pos = i
          				break
          			}
          		}
          	} else {
          		for i := 0; i < len(n); i++ {
          			if n[i] < d {
          				pos = i
          				break
          			}
          		}
          	}
          	return n[:pos] + string(d) + n[pos:]
          }
        `,
        kotlin: code`
          fun maxValue(n: String, x: Int): String {
              val d = '0' + x
              var pos = n.length
              if (n[0] == '-') {
                  for (i in 1 until n.length) if (n[i] > d) { pos = i; break }
              } else {
                  for (i in 0 until n.length) if (n[i] < d) { pos = i; break }
              }
              return n.substring(0, pos) + d + n.substring(pos)
          }
        `,
        swift: code`
          func maxValue(_ n: String, _ x: Int) -> String {
              let a = Array(n.utf8)
              let d = UInt8(48 + x)
              var pos = a.count
              if a[0] == 45 {
                  for i in 1..<a.count where a[i] > d { pos = i; break }
              } else {
                  for i in 0..<a.count where a[i] < d { pos = i; break }
              }
              var out = Array(a[0..<pos])
              out.append(d)
              out.append(contentsOf: a[pos..<a.count])
              return String(decoding: out, as: UTF8.self)
          }
        `,
        rust: code`
          fn maxValue(n: String, x: i32) -> String {
              let a = n.as_bytes();
              let d = b'0' + x as u8;
              let mut pos = a.len();
              if a[0] == b'-' {
                  for i in 1..a.len() {
                      if a[i] > d { pos = i; break; }
                  }
              } else {
                  for i in 0..a.len() {
                      if a[i] < d { pos = i; break; }
                  }
              }
              let mut out: Vec<u8> = Vec::with_capacity(a.len() + 1);
              out.extend_from_slice(&a[..pos]);
              out.push(d);
              out.extend_from_slice(&a[pos..]);
              String::from_utf8(out).unwrap()
          }
        `,
        php: code`
          function maxValue($n, $x) {
              $d = (string)$x;
              $len = strlen($n);
              $pos = $len;
              if ($n[0] === "-") {
                  for ($i = 1; $i < $len; $i++) if ($n[$i] > $d) { $pos = $i; break; }
              } else {
                  for ($i = 0; $i < $len; $i++) if ($n[$i] < $d) { $pos = $i; break; }
              }
              return substr($n, 0, $pos) . $d . substr($n, $pos);
          }
        `,
        ruby: code`
          def maxValue(n, x)
            d = x.to_s
            pos = n.length
            if n[0] == "-"
              (1...n.length).each { |i| if n[i] > d then pos = i; break end }
            else
              (0...n.length).each { |i| if n[i] < d then pos = i; break end }
            end
            n[0, pos] + d + n[pos..-1]
          end
        `,
      },
    };
  })(),

  // ── Number of Pairs of Strings With Concatenation Equal to Target (LC 2023) ──
  (() => {
    const ref = (nums: string[], target: string) => {
      let total = 0;
      for (let i = 0; i < nums.length; i++)
        for (let j = 0; j < nums.length; j++)
          if (i !== j && nums[i] + nums[j] === target) total++;
      return total;
    };
    const noLead = (rng: Rng, s: string) => (s[0] === "0" ? String(ri(rng, 1, 9)) + s.slice(1) : s);
    return {
      slug: "number-of-pairs-of-strings-with-concatenation-equal-to-target",
      title: "Number of Pairs of Strings With Concatenation Equal to Target",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Counting", "Amazon", "Google"],
      signature: {
        funcName: "numOfPairs",
        params: [{ name: "nums", type: "string[]" as const }, { name: "target", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an array `nums` of digit strings and a digit string `target`.\n\nCount the pairs of indices `(i, j)` with `i != j` such that the concatenation `nums[i] + nums[j]` equals `target`. Pairs are **ordered**: `(i, j)` and `(j, i)` are different pairs and are both counted when both concatenations match.",
        [
          { in: "nums = [\"20\",\"26\",\"2026\",\"202\",\"6\"], target = \"2026\"", out: "2", note: "`\"20\" + \"26\"` and `\"202\" + \"6\"`." },
          { in: "nums = [\"7\",\"7\",\"7\"], target = \"77\"", out: "6", note: "Any two different indices work, in either order: 3 × 2 = 6 pairs." },
          { in: "nums = [\"1\",\"23\"], target = \"231\"", out: "1", note: "Only `nums[1] + nums[0]`." },
        ],
        ["2 <= nums.length <= 100", "1 <= nums[i].length <= 100", "2 <= target.length <= 100", "nums[i] and target consist of digits", "nums[i] and target have no leading zeros"]),
      hints: [
        "Checking every pair works for 100 strings, but there is a cleaner count.",
        "A matching pair splits `target` into a non-empty prefix and a non-empty suffix. There are only `target.length - 1` split points.",
        "Count how many times each string occurs. For each split, multiply the prefix's count by the suffix's count — and when prefix and suffix are the same string, use `c × (c - 1)` so an index is never paired with itself.",
      ],
      editorial: explain({
        idea: "Every valid pair corresponds to a split of `target` into prefix + suffix, so count string frequencies and sum over the split points.",
        steps: [
          "Count how many times each string appears in `nums`.",
          "For each split point `k` from 1 to `target.length - 1`, let `pre = target[0:k]` and `suf = target[k:]`.",
          "If `pre != suf`, add `count[pre] × count[suf]`: any index holding `pre` pairs with any index holding `suf`, and they are automatically different indices.",
          "If `pre == suf`, add `count[pre] × (count[pre] - 1)`: ordered pairs of two different indices among the copies.",
        ],
        why: "A pair `(i, j)` matches exactly when `nums[i]` is the prefix of `target` of length `len(nums[i])` and `nums[j]` is the rest, so each matching pair is counted at exactly one split point (the one at `len(nums[i])`). Within a split, the number of ordered index pairs is the product of the two counts, minus the forbidden `i == j` pairs, which only exist when the two pieces are the same string.",
        time: "O(n·L + L²) where L is the target length",
        space: "O(n·L) for the counts",
        pitfalls: [
          "When the prefix equals the suffix (`\"7\" + \"7\"`), `count²` would pair an index with itself.",
          "Pairs are ordered — do not divide by two.",
          "Both pieces must be non-empty, so the split runs from 1 to `L - 1`.",
        ],
      }),
      examples: [
        { input: "[\"20\",\"26\",\"2026\",\"202\",\"6\"]\n\"2026\"", expectedOutput: "2" },
        { input: "[\"7\",\"7\",\"7\"]\n\"77\"", expectedOutput: "6" },
        { input: "[\"1\",\"23\"]\n\"231\"", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const digits = pick(rng, ["1", "12", "123", "0123456789", "10", "7"]);
        const L = ri(rng, 2, rng() < 0.2 ? 20 : 8);
        const target = noLead(rng, randLower(rng, L, L, digits));
        const n = ri(rng, 2, rng() < 0.2 ? 40 : 12);
        const nums: string[] = [];
        for (let i = 0; i < n; i++) {
          const r = rng();
          const k = ri(rng, 1, L - 1);
          let s: string;
          if (r < 0.35) s = target.slice(0, k);
          else if (r < 0.7) s = target.slice(k);
          else if (r < 0.75) s = target;
          else s = randLower(rng, 1, L, digits);
          nums.push(noLead(rng, s));
        }
        return { input: `${fmtStrArr(nums)}\n"${target}"`, expectedOutput: String(ref(nums, target)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def numOfPairs(nums: List[str], target: str) -> int:
              cnt = Counter(nums)
              total = 0
              for k in range(1, len(target)):
                  pre, suf = target[:k], target[k:]
                  if pre == suf:
                      total += cnt[pre] * (cnt[pre] - 1)
                  else:
                      total += cnt[pre] * cnt[suf]
              return total
        `,
        javascript: code`
          var numOfPairs = function(nums, target) {
              var cnt = new Map();
              for (var i = 0; i < nums.length; i++) cnt.set(nums[i], (cnt.get(nums[i]) || 0) + 1);
              var total = 0;
              for (var k = 1; k < target.length; k++) {
                  var pre = target.slice(0, k), suf = target.slice(k);
                  var a = cnt.get(pre) || 0;
                  total += pre === suf ? a * (a - 1) : a * (cnt.get(suf) || 0);
              }
              return total;
          };
        `,
        typescript: code`
          function numOfPairs(nums: string[], target: string): number {
              var cnt: { [k: string]: number } = {};
              for (var i = 0; i < nums.length; i++) {
                  var key = "#" + nums[i];
                  cnt[key] = (cnt[key] === undefined ? 0 : cnt[key]) + 1;
              }
              var get = function (s: string): number {
                  var v = cnt["#" + s];
                  return v === undefined ? 0 : v;
              };
              var total = 0;
              for (var k = 1; k < target.length; k++) {
                  var pre = target.substring(0, k), suf = target.substring(k);
                  var a = get(pre);
                  total += pre === suf ? a * (a - 1) : a * get(suf);
              }
              return total;
          }
        `,
        java: code`
          public static int numOfPairs(String[] nums, String target) {
              Map<String, Integer> cnt = new HashMap<>();
              for (String s : nums) cnt.merge(s, 1, Integer::sum);
              int total = 0;
              for (int k = 1; k < target.length(); k++) {
                  String pre = target.substring(0, k), suf = target.substring(k);
                  int a = cnt.getOrDefault(pre, 0);
                  if (pre.equals(suf)) total += a * (a - 1);
                  else total += a * cnt.getOrDefault(suf, 0);
              }
              return total;
          }
        `,
        cpp: code`
          int numOfPairs(vector<string>& nums, string target) {
              unordered_map<string, int> cnt;
              for (auto& s : nums) cnt[s]++;
              int total = 0;
              for (size_t k = 1; k < target.size(); k++) {
                  string pre = target.substr(0, k), suf = target.substr(k);
                  int a = cnt.count(pre) ? cnt[pre] : 0;
                  if (pre == suf) total += a * (a - 1);
                  else total += a * (cnt.count(suf) ? cnt[suf] : 0);
              }
              return total;
          }
        `,
        c: code`
          int numOfPairs(char** nums, int numsSize, const char* target) {
              int L = strlen(target);
              int total = 0;
              for (int i = 0; i < numsSize; i++) {
                  int li = strlen(nums[i]);
                  if (li >= L || strncmp(nums[i], target, li) != 0) continue;
                  for (int j = 0; j < numsSize; j++) {
                      if (j != i && strcmp(nums[j], target + li) == 0) total++;
                  }
              }
              return total;
          }
        `,
        csharp: code`
          public static int NumOfPairs(string[] nums, string target)
          {
              var cnt = new Dictionary<string, int>();
              foreach (var s in nums)
              {
                  cnt.TryGetValue(s, out int c);
                  cnt[s] = c + 1;
              }
              int total = 0;
              for (int k = 1; k < target.Length; k++)
              {
                  string pre = target.Substring(0, k), suf = target.Substring(k);
                  cnt.TryGetValue(pre, out int a);
                  if (pre == suf) total += a * (a - 1);
                  else
                  {
                      cnt.TryGetValue(suf, out int b);
                      total += a * b;
                  }
              }
              return total;
          }
        `,
        go: code`
          func numOfPairs(nums []string, target string) int {
          	cnt := map[string]int{}
          	for _, s := range nums {
          		cnt[s]++
          	}
          	total := 0
          	for k := 1; k < len(target); k++ {
          		pre, suf := target[:k], target[k:]
          		if pre == suf {
          			total += cnt[pre] * (cnt[pre] - 1)
          		} else {
          			total += cnt[pre] * cnt[suf]
          		}
          	}
          	return total
          }
        `,
        kotlin: code`
          fun numOfPairs(nums: Array<String>, target: String): Int {
              val cnt = HashMap<String, Int>()
              for (s in nums) cnt[s] = (cnt[s] ?: 0) + 1
              var total = 0
              for (k in 1 until target.length) {
                  val pre = target.substring(0, k)
                  val suf = target.substring(k)
                  val a = cnt[pre] ?: 0
                  total += if (pre == suf) a * (a - 1) else a * (cnt[suf] ?: 0)
              }
              return total
          }
        `,
        swift: code`
          func numOfPairs(_ nums: [String], _ target: String) -> Int {
              var cnt = [String: Int]()
              for s in nums { cnt[s, default: 0] += 1 }
              let t = Array(target)
              var total = 0
              for k in 1..<t.count {
                  let pre = String(t[0..<k]), suf = String(t[k..<t.count])
                  let a = cnt[pre] ?? 0
                  if pre == suf {
                      total += a * (a - 1)
                  } else {
                      total += a * (cnt[suf] ?? 0)
                  }
              }
              return total
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn numOfPairs(nums: Vec<String>, target: String) -> i32 {
              let mut cnt: HashMap<&str, i32> = HashMap::new();
              for s in nums.iter() {
                  *cnt.entry(s.as_str()).or_insert(0) += 1;
              }
              let mut total = 0;
              for k in 1..target.len() {
                  let pre = &target[..k];
                  let suf = &target[k..];
                  let a = *cnt.get(pre).unwrap_or(&0);
                  if pre == suf {
                      total += a * (a - 1);
                  } else {
                      total += a * *cnt.get(suf).unwrap_or(&0);
                  }
              }
              total
          }
        `,
        php: code`
          function numOfPairs($nums, $target) {
              $cnt = [];
              foreach ($nums as $s) {
                  $cnt[$s] = (isset($cnt[$s]) ? $cnt[$s] : 0) + 1;
              }
              $total = 0;
              $L = strlen($target);
              for ($k = 1; $k < $L; $k++) {
                  $pre = substr($target, 0, $k);
                  $suf = substr($target, $k);
                  $a = isset($cnt[$pre]) ? $cnt[$pre] : 0;
                  if ($pre === $suf) $total += $a * ($a - 1);
                  else $total += $a * (isset($cnt[$suf]) ? $cnt[$suf] : 0);
              }
              return $total;
          }
        `,
        ruby: code`
          def numOfPairs(nums, target)
            cnt = Hash.new(0)
            nums.each { |s| cnt[s] += 1 }
            total = 0
            (1...target.length).each do |k|
              pre = target[0, k]
              suf = target[k..-1]
              if pre == suf
                total += cnt[pre] * (cnt[pre] - 1)
              else
                total += cnt[pre] * cnt[suf]
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Remove Colored Pieces if Both Neighbors are the Same Color (LC 2038) ──
  (() => {
    // Independent check: play the game out by memoised minimax for short
    // strings; count the available moves for longer ones.
    const ref = (colors: string) => {
      const n = colors.length;
      if (n <= 9) {
        const memo = new Map<string, boolean>();
        const wins = (st: string, turn: string): boolean => {
          const key = st + turn;
          const hit = memo.get(key);
          if (hit !== undefined) return hit;
          let res = false;
          for (let i = 1; i + 1 < st.length && !res; i++) {
            if (st[i] === turn && st[i - 1] === turn && st[i + 1] === turn) {
              if (!wins(st.slice(0, i) + st.slice(i + 1), turn === "A" ? "B" : "A")) res = true;
            }
          }
          memo.set(key, res);
          return res;
        };
        return wins(colors, "A");
      }
      let a = 0, b = 0;
      for (let i = 1; i + 1 < n; i++) {
        if (colors[i - 1] === colors[i] && colors[i] === colors[i + 1]) {
          if (colors[i] === "A") a++; else b++;
        }
      }
      return a > b;
    };
    return {
      slug: "remove-colored-pieces-if-both-neighbors-are-the-same-color",
      title: "Remove Colored Pieces if Both Neighbors are the Same Color",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "String", "Greedy", "Game Theory", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "winnerOfGame", params: [{ name: "colors", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A row of pieces is described by the string `colors`, where each piece is either `'A'` or `'B'`. Alice and Bob take turns removing pieces, **Alice first**:\n\n- Alice may remove a piece colored `'A'` only if **both** of its neighbors are also `'A'`.\n- Bob may remove a piece colored `'B'` only if **both** of its neighbors are also `'B'`.\n- Pieces at either end of the row have only one neighbor, so they can never be removed.\n\nThe player who cannot move on their turn loses. Both play optimally. Return `true` if Alice wins and `false` if Bob wins.",
        [
          { in: "colors = \"AAAABBB\"", out: "true", note: "Alice has two possible removals inside `AAAA`, Bob only one inside `BBB`. Bob runs out first." },
          { in: "colors = \"AABBBBA\"", out: "false", note: "Alice has no legal move at all." },
          { in: "colors = \"ABA\"", out: "false" },
        ],
        ["1 <= colors.length <= 10^5", "colors consists of only the letters 'A' and 'B'"]),
      hints: [
        "Does one player's move ever create or destroy a move for the other player?",
        "Removing an `A` from the middle of an `A` block only shortens that block; it never touches a `B` block, and it never creates a new triple of `A`s.",
        "So each player has a fixed budget of moves: a block of `k` equal letters gives `k - 2` moves. Alice wins exactly when her budget is strictly larger.",
      ],
      editorial: explain({
        idea: "The players never interfere: every `'A'` removal shortens an `A` block by one and leaves all `B` blocks untouched. So each player simply has a fixed number of moves, and Alice needs strictly more.",
        steps: [
          "Count `a`, the positions `i` with `colors[i-1] = colors[i] = colors[i+1] = 'A'`, and `b`, the same for `'B'`.",
          "Return `a > b`.",
        ],
        why: "A block of `k` consecutive `A`s allows exactly `k - 2` removals (each one shrinks the block by one until two remain), whatever order they come in, and nothing Bob does changes that block because he only removes interior `B`s. The same holds for Bob. The game is therefore a race: Alice moves on turns 1, 3, 5, … and loses as soon as she needs move `a + 1`, which happens before Bob needs move `b + 1` exactly when `a <= b`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Ties go to Bob: with equal budgets Alice runs out first because she moves first.",
          "End pieces never count — the scan runs from index 1 to `n - 2`.",
          "There is no need to simulate the game; the budgets are fixed from the start.",
        ],
      }),
      examples: [
        { input: "\"AAAABBB\"", expectedOutput: "true" },
        { input: "\"AABBBBA\"", expectedOutput: "false" },
        { input: "\"ABA\"", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const target = rng() < 0.6 ? ri(rng, 1, 9) : ri(rng, 10, 60);
        let s = "";
        let ch = rng() < 0.5 ? "A" : "B";
        while (s.length < target) {
          const run = ri(rng, 1, pick(rng, [2, 4, 7]));
          s += ch.repeat(run);
          ch = ch === "A" ? "B" : "A";
        }
        s = s.slice(0, target);
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: code`
          def winnerOfGame(colors: str) -> bool:
              a = b = 0
              for i in range(1, len(colors) - 1):
                  if colors[i - 1] == colors[i] == colors[i + 1]:
                      if colors[i] == "A":
                          a += 1
                      else:
                          b += 1
              return a > b
        `,
        javascript: code`
          var winnerOfGame = function(colors) {
              var a = 0, b = 0;
              for (var i = 1; i + 1 < colors.length; i++) {
                  if (colors[i - 1] === colors[i] && colors[i] === colors[i + 1]) {
                      if (colors[i] === "A") a++;
                      else b++;
                  }
              }
              return a > b;
          };
        `,
        typescript: code`
          function winnerOfGame(colors: string): boolean {
              var a = 0, b = 0;
              for (var i = 1; i + 1 < colors.length; i++) {
                  var c = colors.charAt(i);
                  if (colors.charAt(i - 1) === c && colors.charAt(i + 1) === c) {
                      if (c === "A") a++;
                      else b++;
                  }
              }
              return a > b;
          }
        `,
        java: code`
          public static boolean winnerOfGame(String colors) {
              int a = 0, b = 0;
              for (int i = 1; i + 1 < colors.length(); i++) {
                  char c = colors.charAt(i);
                  if (colors.charAt(i - 1) == c && colors.charAt(i + 1) == c) {
                      if (c == 'A') a++;
                      else b++;
                  }
              }
              return a > b;
          }
        `,
        cpp: code`
          bool winnerOfGame(string colors) {
              int a = 0, b = 0;
              for (int i = 1; i + 1 < (int)colors.size(); i++) {
                  if (colors[i - 1] == colors[i] && colors[i] == colors[i + 1]) {
                      if (colors[i] == 'A') a++;
                      else b++;
                  }
              }
              return a > b;
          }
        `,
        c: code`
          bool winnerOfGame(const char* colors) {
              int n = strlen(colors), a = 0, b = 0;
              for (int i = 1; i + 1 < n; i++) {
                  if (colors[i - 1] == colors[i] && colors[i] == colors[i + 1]) {
                      if (colors[i] == 'A') a++;
                      else b++;
                  }
              }
              return a > b;
          }
        `,
        csharp: code`
          public static bool WinnerOfGame(string colors)
          {
              int a = 0, b = 0;
              for (int i = 1; i + 1 < colors.Length; i++)
              {
                  if (colors[i - 1] == colors[i] && colors[i] == colors[i + 1])
                  {
                      if (colors[i] == 'A') a++;
                      else b++;
                  }
              }
              return a > b;
          }
        `,
        go: code`
          func winnerOfGame(colors string) bool {
          	a, b := 0, 0
          	for i := 1; i+1 < len(colors); i++ {
          		if colors[i-1] == colors[i] && colors[i] == colors[i+1] {
          			if colors[i] == 'A' {
          				a++
          			} else {
          				b++
          			}
          		}
          	}
          	return a > b
          }
        `,
        kotlin: code`
          fun winnerOfGame(colors: String): Boolean {
              var a = 0
              var b = 0
              for (i in 1 until colors.length - 1) {
                  if (colors[i - 1] == colors[i] && colors[i] == colors[i + 1]) {
                      if (colors[i] == 'A') a++ else b++
                  }
              }
              return a > b
          }
        `,
        swift: code`
          func winnerOfGame(_ colors: String) -> Bool {
              let c = Array(colors.utf8)
              var a = 0, b = 0
              var i = 1
              while i + 1 < c.count {
                  if c[i - 1] == c[i] && c[i] == c[i + 1] {
                      if c[i] == 65 { a += 1 } else { b += 1 }
                  }
                  i += 1
              }
              return a > b
          }
        `,
        rust: code`
          fn winnerOfGame(colors: String) -> bool {
              let c = colors.as_bytes();
              let (mut a, mut b) = (0, 0);
              let mut i = 1;
              while i + 1 < c.len() {
                  if c[i - 1] == c[i] && c[i] == c[i + 1] {
                      if c[i] == b'A' { a += 1; } else { b += 1; }
                  }
                  i += 1;
              }
              a > b
          }
        `,
        php: code`
          function winnerOfGame($colors) {
              $a = 0;
              $b = 0;
              $n = strlen($colors);
              for ($i = 1; $i + 1 < $n; $i++) {
                  if ($colors[$i - 1] === $colors[$i] && $colors[$i] === $colors[$i + 1]) {
                      if ($colors[$i] === "A") $a++;
                      else $b++;
                  }
              }
              return $a > $b;
          }
        `,
        ruby: code`
          def winnerOfGame(colors)
            a = 0
            b = 0
            (1...(colors.length - 1)).each do |i|
              if colors[i - 1] == colors[i] && colors[i] == colors[i + 1]
                if colors[i] == "A"
                  a += 1
                else
                  b += 1
                end
              end
            end
            a > b
          end
        `,
      },
    };
  })(),

  // ── Plates Between Candles (LC 2055) ────────────────────────────
  (() => {
    const ref = (s: string, queries: number[][]) => queries.map(([l, r]) => {
      let first = -1, last = -1;
      for (let i = l; i <= r; i++) if (s[i] === "|") { if (first === -1) first = i; last = i; }
      if (first === -1) return 0;
      let plates = 0;
      for (let i = first; i <= last; i++) if (s[i] === "*") plates++;
      return plates;
    });
    return {
      slug: "plates-between-candles",
      title: "Plates Between Candles",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Binary Search", "Prefix Sum", "Amazon", "Google", "Meta"],
      signature: {
        funcName: "platesBetweenCandles",
        params: [{ name: "s", type: "string" as const }, { name: "queries", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "A long table is described by the string `s`: `'*'` is a plate and `'|'` is a candle. Positions are 0-indexed.\n\nEach query `queries[i] = [left, right]` looks only at the section `s[left..right]` (inclusive). Within that section, a plate counts if there is **at least one candle to its left and at least one candle to its right inside the same section**.\n\nReturn an array whose `i`-th element is the number of counted plates for the `i`-th query.",
        [
          { in: "s = \"*|*|**|*\", queries = [[0,7],[1,3],[2,5],[0,1]]", out: "[3,1,0,0]", note: "For `[0,7]` the outermost candles are at 1 and 6, enclosing the plates at 2, 4 and 5. The section `[2,5]` holds a single candle, so nothing is enclosed." },
          { in: "s = \"||**||\", queries = [[0,5],[2,3]]", out: "[2,0]" },
        ],
        ["3 <= s.length <= 10^5", "s consists of '*' and '|' characters", "1 <= queries.length <= 10^5", "queries[i].length == 2", "0 <= left <= right < s.length"]),
      hints: [
        "Inside a section, only the leftmost and the rightmost candle matter: every plate between them is enclosed.",
        "Precompute, for every index, the nearest candle at or to its right and the nearest candle at or to its left.",
        "With a prefix count of plates, the answer for `[l, r]` is the number of plates between `nextCandle[l]` and `prevCandle[r]` — or 0 when those candles do not form a valid pair.",
      ],
      editorial: explain({
        idea: "A query's answer is the number of plates between the first candle at or after `left` and the last candle at or before `right`. Three precomputed arrays make each query O(1).",
        steps: [
          "Build `pre`, where `pre[i]` is the number of plates in `s[0..i-1]`.",
          "Build `prevCandle[i]`, the index of the last candle at or before `i` (or -1), with a left-to-right sweep.",
          "Build `nextCandle[i]`, the index of the first candle at or after `i` (or -1), with a right-to-left sweep.",
          "For a query `[l, r]`, let `a = nextCandle[l]` and `b = prevCandle[r]`. If both exist and `a < b`, the answer is `pre[b] - pre[a]`; otherwise it is 0.",
        ],
        why: "A plate inside the section is enclosed exactly when it lies strictly between the section's leftmost candle `a` and rightmost candle `b`. `nextCandle[l]` is the leftmost candle of the section if it is not beyond `r`, and `prevCandle[r]` the rightmost if it is not before `l`; when `a < b` both are inside the section. The prefix difference counts plates in `[a, b)`, and since `s[a]` is a candle that is exactly the plates strictly between them.",
        time: "O(n + q)",
        space: "O(n)",
        pitfalls: [
          "A section with zero or one candle encloses nothing — check `a < b`, not just that both exist.",
          "Use the candles inside the section, not the nearest candles outside it.",
          "Scanning each query directly is O(n·q) and too slow at the full limits.",
        ],
      }),
      examples: [
        { input: "\"*|*|**|*\"\n[[0,7],[1,3],[2,5],[0,1]]", expectedOutput: "[3,1,0,0]" },
        { input: "\"||**||\"\n[[0,5],[2,3]]", expectedOutput: "[2,0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, rng() < 0.2 ? 60 : 15);
        const pCandle = pick(rng, [0.1, 0.3, 0.5, 0.8]);
        let s = "";
        for (let i = 0; i < n; i++) s += rng() < pCandle ? "|" : "*";
        const q = ri(rng, 1, 10);
        const queries: number[][] = [];
        for (let i = 0; i < q; i++) {
          const l = ri(rng, 0, n - 1);
          const r = rng() < 0.2 ? n - 1 : ri(rng, l, n - 1);
          queries.push([l, r]);
        }
        return { input: `"${s}"\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(s, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def platesBetweenCandles(s: str, queries: List[List[int]]) -> List[int]:
              n = len(s)
              pre = [0] * (n + 1)
              for i, ch in enumerate(s):
                  pre[i + 1] = pre[i] + (1 if ch == "*" else 0)
              prev_c = [-1] * n
              last = -1
              for i in range(n):
                  if s[i] == "|":
                      last = i
                  prev_c[i] = last
              next_c = [-1] * n
              last = -1
              for i in range(n - 1, -1, -1):
                  if s[i] == "|":
                      last = i
                  next_c[i] = last
              out = []
              for l, r in queries:
                  a, b = next_c[l], prev_c[r]
                  out.append(pre[b] - pre[a] if a != -1 and b != -1 and a < b else 0)
              return out
        `,
        javascript: code`
          var platesBetweenCandles = function(s, queries) {
              var n = s.length;
              var pre = new Array(n + 1).fill(0);
              for (var i = 0; i < n; i++) pre[i + 1] = pre[i] + (s[i] === "*" ? 1 : 0);
              var prevC = new Array(n), nextC = new Array(n), last = -1;
              for (var i2 = 0; i2 < n; i2++) { if (s[i2] === "|") last = i2; prevC[i2] = last; }
              last = -1;
              for (var i3 = n - 1; i3 >= 0; i3--) { if (s[i3] === "|") last = i3; nextC[i3] = last; }
              return queries.map(function (q) {
                  var a = nextC[q[0]], b = prevC[q[1]];
                  return a !== -1 && b !== -1 && a < b ? pre[b] - pre[a] : 0;
              });
          };
        `,
        typescript: code`
          function platesBetweenCandles(s: string, queries: number[][]): number[] {
              var n = s.length;
              var pre: number[] = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + (s.charAt(i) === "*" ? 1 : 0));
              var prevC: number[] = [], nextC: number[] = [];
              var last = -1;
              for (var j = 0; j < n; j++) { if (s.charAt(j) === "|") last = j; prevC.push(last); nextC.push(-1); }
              last = -1;
              for (var k = n - 1; k >= 0; k--) { if (s.charAt(k) === "|") last = k; nextC[k] = last; }
              var out: number[] = [];
              for (var q = 0; q < queries.length; q++) {
                  var a = nextC[queries[q][0]], b = prevC[queries[q][1]];
                  out.push(a !== -1 && b !== -1 && a < b ? pre[b] - pre[a] : 0);
              }
              return out;
          }
        `,
        java: code`
          public static int[] platesBetweenCandles(String s, int[][] queries) {
              int n = s.length();
              int[] pre = new int[n + 1], prevC = new int[n], nextC = new int[n];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + (s.charAt(i) == '*' ? 1 : 0);
              int last = -1;
              for (int i = 0; i < n; i++) { if (s.charAt(i) == '|') last = i; prevC[i] = last; }
              last = -1;
              for (int i = n - 1; i >= 0; i--) { if (s.charAt(i) == '|') last = i; nextC[i] = last; }
              int[] out = new int[queries.length];
              for (int q = 0; q < queries.length; q++) {
                  int a = nextC[queries[q][0]], b = prevC[queries[q][1]];
                  out[q] = (a != -1 && b != -1 && a < b) ? pre[b] - pre[a] : 0;
              }
              return out;
          }
        `,
        cpp: code`
          vector<int> platesBetweenCandles(string s, vector<vector<int>>& queries) {
              int n = s.size();
              vector<int> pre(n + 1, 0), prevC(n, -1), nextC(n, -1);
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + (s[i] == '*' ? 1 : 0);
              int last = -1;
              for (int i = 0; i < n; i++) { if (s[i] == '|') last = i; prevC[i] = last; }
              last = -1;
              for (int i = n - 1; i >= 0; i--) { if (s[i] == '|') last = i; nextC[i] = last; }
              vector<int> out;
              for (auto& q : queries) {
                  int a = nextC[q[0]], b = prevC[q[1]];
                  out.push_back((a != -1 && b != -1 && a < b) ? pre[b] - pre[a] : 0);
              }
              return out;
          }
        `,
        c: code`
          int* platesBetweenCandles(const char* s, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int n = strlen(s);
              int* pre = (int*)malloc((n + 1) * sizeof(int));
              int* prevC = (int*)malloc(n * sizeof(int));
              int* nextC = (int*)malloc(n * sizeof(int));
              pre[0] = 0;
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + (s[i] == '*' ? 1 : 0);
              int last = -1;
              for (int i = 0; i < n; i++) { if (s[i] == '|') last = i; prevC[i] = last; }
              last = -1;
              for (int i = n - 1; i >= 0; i--) { if (s[i] == '|') last = i; nextC[i] = last; }
              int* out = (int*)malloc((queriesSize > 0 ? queriesSize : 1) * sizeof(int));
              for (int q = 0; q < queriesSize; q++) {
                  int a = nextC[queries[q][0]], b = prevC[queries[q][1]];
                  out[q] = (a != -1 && b != -1 && a < b) ? pre[b] - pre[a] : 0;
              }
              free(pre);
              free(prevC);
              free(nextC);
              *returnSize = queriesSize;
              return out;
          }
        `,
        csharp: code`
          public static int[] PlatesBetweenCandles(string s, int[][] queries)
          {
              int n = s.Length;
              int[] pre = new int[n + 1], prevC = new int[n], nextC = new int[n];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + (s[i] == '*' ? 1 : 0);
              int last = -1;
              for (int i = 0; i < n; i++) { if (s[i] == '|') last = i; prevC[i] = last; }
              last = -1;
              for (int i = n - 1; i >= 0; i--) { if (s[i] == '|') last = i; nextC[i] = last; }
              int[] output = new int[queries.Length];
              for (int q = 0; q < queries.Length; q++)
              {
                  int a = nextC[queries[q][0]], b = prevC[queries[q][1]];
                  output[q] = (a != -1 && b != -1 && a < b) ? pre[b] - pre[a] : 0;
              }
              return output;
          }
        `,
        go: code`
          func platesBetweenCandles(s string, queries [][]int) []int {
          	n := len(s)
          	pre := make([]int, n+1)
          	prevC := make([]int, n)
          	nextC := make([]int, n)
          	for i := 0; i < n; i++ {
          		pre[i+1] = pre[i]
          		if s[i] == '*' {
          			pre[i+1]++
          		}
          	}
          	last := -1
          	for i := 0; i < n; i++ {
          		if s[i] == '|' {
          			last = i
          		}
          		prevC[i] = last
          	}
          	last = -1
          	for i := n - 1; i >= 0; i-- {
          		if s[i] == '|' {
          			last = i
          		}
          		nextC[i] = last
          	}
          	out := make([]int, len(queries))
          	for q, qr := range queries {
          		a, b := nextC[qr[0]], prevC[qr[1]]
          		if a != -1 && b != -1 && a < b {
          			out[q] = pre[b] - pre[a]
          		}
          	}
          	return out
          }
        `,
        kotlin: code`
          fun platesBetweenCandles(s: String, queries: Array<IntArray>): IntArray {
              val n = s.length
              val pre = IntArray(n + 1)
              val prevC = IntArray(n)
              val nextC = IntArray(n)
              for (i in 0 until n) pre[i + 1] = pre[i] + if (s[i] == '*') 1 else 0
              var last = -1
              for (i in 0 until n) { if (s[i] == '|') last = i; prevC[i] = last }
              last = -1
              for (i in n - 1 downTo 0) { if (s[i] == '|') last = i; nextC[i] = last }
              return IntArray(queries.size) { q ->
                  val a = nextC[queries[q][0]]
                  val b = prevC[queries[q][1]]
                  if (a != -1 && b != -1 && a < b) pre[b] - pre[a] else 0
              }
          }
        `,
        swift: code`
          func platesBetweenCandles(_ s: String, _ queries: [[Int]]) -> [Int] {
              let c = Array(s.utf8)
              let n = c.count
              var pre = [Int](repeating: 0, count: n + 1)
              var prevC = [Int](repeating: -1, count: n)
              var nextC = [Int](repeating: -1, count: n)
              for i in 0..<n { pre[i + 1] = pre[i] + (c[i] == 42 ? 1 : 0) }
              var last = -1
              for i in 0..<n {
                  if c[i] == 124 { last = i }
                  prevC[i] = last
              }
              last = -1
              for i in stride(from: n - 1, through: 0, by: -1) {
                  if c[i] == 124 { last = i }
                  nextC[i] = last
              }
              var out = [Int]()
              for q in queries {
                  let a = nextC[q[0]], b = prevC[q[1]]
                  out.append(a != -1 && b != -1 && a < b ? pre[b] - pre[a] : 0)
              }
              return out
          }
        `,
        rust: code`
          fn platesBetweenCandles(s: String, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let c = s.as_bytes();
              let n = c.len();
              let mut pre = vec![0i32; n + 1];
              for i in 0..n {
                  pre[i + 1] = pre[i] + if c[i] == b'*' { 1 } else { 0 };
              }
              let mut prev_c = vec![-1i32; n];
              let mut next_c = vec![-1i32; n];
              let mut last = -1i32;
              for i in 0..n {
                  if c[i] == b'|' { last = i as i32; }
                  prev_c[i] = last;
              }
              last = -1;
              for i in (0..n).rev() {
                  if c[i] == b'|' { last = i as i32; }
                  next_c[i] = last;
              }
              let mut out = Vec::with_capacity(queries.len());
              for q in queries.iter() {
                  let a = next_c[q[0] as usize];
                  let b = prev_c[q[1] as usize];
                  if a != -1 && b != -1 && a < b {
                      out.push(pre[b as usize] - pre[a as usize]);
                  } else {
                      out.push(0);
                  }
              }
              out
          }
        `,
        php: code`
          function platesBetweenCandles($s, $queries) {
              $n = strlen($s);
              $pre = array_fill(0, $n + 1, 0);
              for ($i = 0; $i < $n; $i++) $pre[$i + 1] = $pre[$i] + ($s[$i] === "*" ? 1 : 0);
              $prevC = array_fill(0, $n, -1);
              $nextC = array_fill(0, $n, -1);
              $last = -1;
              for ($i = 0; $i < $n; $i++) { if ($s[$i] === "|") $last = $i; $prevC[$i] = $last; }
              $last = -1;
              for ($i = $n - 1; $i >= 0; $i--) { if ($s[$i] === "|") $last = $i; $nextC[$i] = $last; }
              $out = [];
              foreach ($queries as $q) {
                  $a = $nextC[$q[0]];
                  $b = $prevC[$q[1]];
                  $out[] = ($a != -1 && $b != -1 && $a < $b) ? $pre[$b] - $pre[$a] : 0;
              }
              return $out;
          }
        `,
        ruby: code`
          def platesBetweenCandles(s, queries)
            n = s.length
            pre = Array.new(n + 1, 0)
            n.times { |i| pre[i + 1] = pre[i] + (s[i] == "*" ? 1 : 0) }
            prev_c = Array.new(n, -1)
            next_c = Array.new(n, -1)
            last = -1
            n.times do |i|
              last = i if s[i] == "|"
              prev_c[i] = last
            end
            last = -1
            (n - 1).downto(0) do |i|
              last = i if s[i] == "|"
              next_c[i] = last
            end
            queries.map do |l, r|
              a = next_c[l]
              b = prev_c[r]
              a != -1 && b != -1 && a < b ? pre[b] - pre[a] : 0
            end
          end
        `,
      },
    };
  })(),

  // ── Vowels of All Substrings (LC 2063) ──────────────────────────
  (() => {
    const isV = (c: string) => "aeiou".indexOf(c) >= 0;
    // Independent check: add up the vowel count of every substring through a
    // prefix-count array (O(n^2)).
    const ref = (word: string) => {
      const n = word.length;
      const pre = [0];
      for (let i = 0; i < n; i++) pre.push(pre[i] + (isV(word[i]) ? 1 : 0));
      let total = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j <= n; j++) total += pre[j] - pre[i];
      return total;
    };
    return {
      slug: "vowels-of-all-substrings",
      title: "Vowels of All Substrings",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "String", "Dynamic Programming", "Combinatorics", "Amazon", "Google"],
      signature: { funcName: "countVowels", params: [{ name: "word", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given a string `word`, consider every one of its non-empty **substrings** (contiguous runs of characters). For each substring count its vowels (`'a'`, `'e'`, `'i'`, `'o'` and `'u'`), and return the **sum** of those counts over all substrings.\n\nSubstrings at different positions are counted separately even if they read the same.\n\nThe length bound below is tightened from the original problem so that the answer always fits in a 32-bit signed integer.",
        [
          { in: "word = \"kairo\"", out: "22", note: "The `a` at index 1 lies in 2 × 4 = 8 substrings, the `i` at index 2 in 3 × 3 = 9 and the `o` at index 4 in 5 × 1 = 5." },
          { in: "word = \"ae\"", out: "4", note: "`\"a\"`, `\"e\"` and `\"ae\"` hold 1, 1 and 2 vowels." },
          { in: "word = \"xyz\"", out: "0" },
        ],
        ["1 <= word.length <= 2000", "word consists of lowercase English letters"]),
      hints: [
        "Instead of looking at each substring, flip it around: how many substrings contain a given position?",
        "A substring containing index `i` starts somewhere in `0..i` and ends somewhere in `i..n-1`.",
        "So the vowel at index `i` is counted `(i + 1) × (n - i)` times. Sum that over the vowels.",
      ],
      editorial: explain({
        idea: "Count by contribution: the character at index `i` belongs to exactly `(i + 1) × (n - i)` substrings, so each vowel adds that many to the total.",
        steps: [
          "Let `n` be the length of `word`.",
          "For each index `i` holding a vowel, add `(i + 1) × (n - i)` to the answer.",
          "Return the sum (computed in 64-bit arithmetic where the language needs it).",
        ],
        why: "The requested sum counts pairs (substring, vowel position inside it). Grouping those pairs by the vowel instead of by the substring gives the same total. A substring `word[l..r]` contains `i` exactly when `0 <= l <= i` and `i <= r <= n - 1`, which is `(i + 1)` choices for `l` times `(n - i)` choices for `r`.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Enumerating substrings is O(n²) or worse; the contribution formula is linear.",
          "In the original problem `n` reaches 10^5 and the sum needs 64 bits; here `n <= 2000` keeps it below 2^31, but accumulate in a wide type anyway.",
          "`y` is not a vowel here.",
        ],
      }),
      examples: [
        { input: "\"kairo\"", expectedOutput: "22" },
        { input: "\"ae\"", expectedOutput: "4" },
        { input: "\"xyz\"", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const r = rng();
        let word: string;
        if (r < 0.004) word = randLower(rng, 1900, 2000, pick(rng, ["aeiou", "a", "aeioub"]));
        else if (r < 0.03) word = randLower(rng, 50, 300, pick(rng, [LOWER, "aeiou", "abcde"]));
        else word = randLower(rng, 1, 25, pick(rng, [LOWER, LOWER, "aeiou", "bcd", "aeb", "kairo"]));
        return { input: `"${word}"`, expectedOutput: String(ref(word)) };
      },
      solutions: {
        python: code`
          def countVowels(word: str) -> int:
              n = len(word)
              total = 0
              for i, ch in enumerate(word):
                  if ch in "aeiou":
                      total += (i + 1) * (n - i)
              return total
        `,
        javascript: code`
          var countVowels = function(word) {
              var n = word.length, total = 0;
              for (var i = 0; i < n; i++) {
                  if ("aeiou".indexOf(word[i]) >= 0) total += (i + 1) * (n - i);
              }
              return total;
          };
        `,
        typescript: code`
          function countVowels(word: string): number {
              var n = word.length, total = 0;
              for (var i = 0; i < n; i++) {
                  if ("aeiou".indexOf(word.charAt(i)) >= 0) total += (i + 1) * (n - i);
              }
              return total;
          }
        `,
        java: code`
          public static int countVowels(String word) {
              int n = word.length();
              long total = 0;
              for (int i = 0; i < n; i++) {
                  if ("aeiou".indexOf(word.charAt(i)) >= 0) total += (long) (i + 1) * (n - i);
              }
              return (int) total;
          }
        `,
        cpp: code`
          int countVowels(string word) {
              long long n = word.size(), total = 0;
              for (long long i = 0; i < n; i++) {
                  char c = word[i];
                  if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') total += (i + 1) * (n - i);
              }
              return (int)total;
          }
        `,
        c: code`
          int countVowels(const char* word) {
              long long n = strlen(word), total = 0;
              for (long long i = 0; i < n; i++) {
                  char c = word[i];
                  if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') total += (i + 1) * (n - i);
              }
              return (int)total;
          }
        `,
        csharp: code`
          public static int CountVowels(string word)
          {
              long n = word.Length, total = 0;
              for (int i = 0; i < word.Length; i++)
              {
                  if ("aeiou".IndexOf(word[i]) >= 0) total += (i + 1) * (n - i);
              }
              return (int)total;
          }
        `,
        go: code`
          func countVowels(word string) int {
          	n := len(word)
          	total := 0
          	for i := 0; i < n; i++ {
          		if strings.IndexByte("aeiou", word[i]) >= 0 {
          			total += (i + 1) * (n - i)
          		}
          	}
          	return total
          }
        `,
        kotlin: code`
          fun countVowels(word: String): Int {
              val n = word.length
              var total = 0L
              for (i in 0 until n) {
                  if ("aeiou".indexOf(word[i]) >= 0) total += (i + 1).toLong() * (n - i)
              }
              return total.toInt()
          }
        `,
        swift: code`
          func countVowels(_ word: String) -> Int {
              let c = Array(word.utf8)
              let n = c.count
              var total = 0
              for i in 0..<n {
                  let ch = c[i]
                  if ch == 97 || ch == 101 || ch == 105 || ch == 111 || ch == 117 {
                      total += (i + 1) * (n - i)
                  }
              }
              return total
          }
        `,
        rust: code`
          fn countVowels(word: String) -> i32 {
              let c = word.as_bytes();
              let n = c.len() as i64;
              let mut total: i64 = 0;
              for (i, &ch) in c.iter().enumerate() {
                  if ch == b'a' || ch == b'e' || ch == b'i' || ch == b'o' || ch == b'u' {
                      total += (i as i64 + 1) * (n - i as i64);
                  }
              }
              total as i32
          }
        `,
        php: code`
          function countVowels($word) {
              $n = strlen($word);
              $total = 0;
              for ($i = 0; $i < $n; $i++) {
                  if (strpos("aeiou", $word[$i]) !== false) $total += ($i + 1) * ($n - $i);
              }
              return $total;
          }
        `,
        ruby: code`
          def countVowels(word)
            n = word.length
            total = 0
            word.each_char.with_index do |ch, i|
              total += (i + 1) * (n - i) if "aeiou".include?(ch)
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Decode the Slanted Ciphertext (LC 2075) ─────────────────────
  (() => {
    // The generator encodes a known text, so the expected output is that text
    // itself; ref() decodes and must reproduce it.
    const encode = (text: string, rows: number) => {
      let cols = 0;
      for (let k = 0; k < text.length; k++) cols = Math.max(cols, Math.floor(k / rows) + (k % rows) + 1);
      const grid = Array.from({ length: rows }, () => new Array<string>(cols).fill(" "));
      for (let k = 0; k < text.length; k++) grid[k % rows][Math.floor(k / rows) + (k % rows)] = text[k];
      return grid.map((r) => r.join("")).join("");
    };
    const ref = (enc: string, rows: number) => {
      const cols = enc.length / rows;
      let out = "";
      for (let c = 0; c < cols; c++) for (let r = 0, j = c; r < rows && j < cols; r++, j++) out += enc[r * cols + j];
      return out.replace(/ +$/, "");
    };
    return {
      slug: "decode-the-slanted-ciphertext",
      title: "Decode the Slanted Ciphertext",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Simulation", "Google", "Amazon"],
      signature: {
        funcName: "decodeCiphertext",
        params: [{ name: "encodedText", type: "string" as const }, { name: "rows", type: "int" as const }],
        returns: "string" as const,
      },
      description: describe(
        "A message `originalText` (lowercase letters and spaces, with **no trailing spaces**) was encrypted with a *slanted transposition* using a grid with a fixed number of `rows`:\n\n- The text is written along diagonals that run down and to the right. The first diagonal starts at the top-left cell `(0, 0)` and takes characters until it reaches the last row; the next diagonal starts at `(0, 1)`, then `(0, 2)`, and so on.\n- The grid has the **fewest columns** for which the whole text fits — its rightmost column is not empty.\n- Every cell left unused holds a space `' '`.\n\nThe ciphertext `encodedText` is the grid read **row by row**, left to right, top row first.\n\nGiven `encodedText` and `rows`, return `originalText`.",
        [
          { in: "encodedText = \"ceao  o i   dkr\", rows = 3", out: "code kairo", note: "The grid is 3 × 5: rows `\"ceao \"`, `\" o i \"` and `\"  dkr\"`. Reading the diagonals from columns 0..4 gives `\"cod\"`, `\"e k\"`, `\"air\"`, `\"o \"`, `\" \"`; dropping the trailing spaces leaves `\"code kairo\"`." },
          { in: "encodedText = \"kairo\", rows = 1", out: "kairo", note: "With one row nothing moves." },
          { in: "encodedText = \"a  b  \", rows = 3", out: "ab" },
        ],
        ["1 <= encodedText.length <= 10^6", "encodedText consists of lowercase English letters and ' ' only", "encodedText is a valid encoding of some originalText that has no trailing spaces", "1 <= rows <= 1000", "exactly one originalText produces encodedText"]),
      hints: [
        "The number of columns follows directly from the input: `cols = encodedText.length / rows`.",
        "Cell `(r, c)` of the grid is `encodedText[r * cols + c]`.",
        "Read the diagonal starting at `(0, c)` for every `c` from left to right, then strip the trailing spaces that came from the padding.",
      ],
      editorial: explain({
        idea: "Rebuild the grid's coordinates from the ciphertext and read the diagonals back in the order they were written; only the padding at the end needs removing.",
        steps: [
          "Let `cols = encodedText.length / rows`; cell `(r, c)` sits at index `r * cols + c`.",
          "For each starting column `c` from 0 to `cols - 1`, walk `(0, c), (1, c+1), (2, c+2), …` while both the row and the column stay inside the grid, appending each character.",
          "Remove the trailing spaces from the result and return it.",
        ],
        why: "Encryption wrote character `k` of the text onto diagonal `k / rows` at row `k % rows`, so reading diagonals in order of their starting column, top to bottom, visits the text in its original order. The diagonals also pass through unused cells, which hold spaces; all of those come after the last character of the text, because the text fills diagonals in order. Since the original text has no trailing spaces, stripping them recovers it exactly.",
        time: "O(n) where n is the ciphertext length",
        space: "O(n) for the output",
        pitfalls: [
          "Strip only trailing spaces — spaces inside the text are part of the message.",
          "A diagonal stops at the right edge as well as at the bottom row.",
          "There is no need to materialise the grid; index arithmetic is enough.",
        ],
      }),
      examples: [
        { input: "\"ceao  o i   dkr\"\n3", expectedOutput: "code kairo" },
        { input: "\"kairo\"\n1", expectedOutput: "kairo" },
        { input: "\"a  b  \"\n3", expectedOutput: "ab" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, 1, rng() < 0.2 ? 60 : 16);
        const pSpace = pick(rng, [0, 0.2, 0.35]);
        let text = "";
        for (let i = 0; i < len; i++) {
          const edge = i === 0 || i === len - 1;
          text += !edge && rng() < pSpace ? " " : LOWER[ri(rng, 0, 25)];
        }
        const rows = rng() < 0.15 ? ri(rng, 1, 25) : ri(rng, 1, 6);
        const enc = encode(text, rows);
        if (ref(enc, rows) !== text) throw new Error("slanted cipher round trip failed");
        return { input: `"${enc}"\n${rows}`, expectedOutput: text };
      },
      solutions: {
        python: code`
          def decodeCiphertext(encodedText: str, rows: int) -> str:
              n = len(encodedText)
              cols = n // rows
              out = []
              for c in range(cols):
                  r, j = 0, c
                  while r < rows and j < cols:
                      out.append(encodedText[r * cols + j])
                      r += 1
                      j += 1
              return "".join(out).rstrip(" ")
        `,
        javascript: code`
          var decodeCiphertext = function(encodedText, rows) {
              var cols = encodedText.length / rows;
              var out = [];
              for (var c = 0; c < cols; c++) {
                  for (var r = 0, j = c; r < rows && j < cols; r++, j++) out.push(encodedText[r * cols + j]);
              }
              var k = out.length;
              while (k > 0 && out[k - 1] === " ") k--;
              return out.slice(0, k).join("");
          };
        `,
        typescript: code`
          function decodeCiphertext(encodedText: string, rows: number): string {
              var cols = encodedText.length / rows;
              var out: string[] = [];
              for (var c = 0; c < cols; c++) {
                  for (var r = 0, j = c; r < rows && j < cols; r++, j++) out.push(encodedText.charAt(r * cols + j));
              }
              var k = out.length;
              while (k > 0 && out[k - 1] === " ") k--;
              return out.slice(0, k).join("");
          }
        `,
        java: code`
          public static String decodeCiphertext(String encodedText, int rows) {
              int n = encodedText.length(), cols = n / rows;
              StringBuilder sb = new StringBuilder();
              for (int c = 0; c < cols; c++) {
                  for (int r = 0, j = c; r < rows && j < cols; r++, j++) sb.append(encodedText.charAt(r * cols + j));
              }
              int k = sb.length();
              while (k > 0 && sb.charAt(k - 1) == ' ') k--;
              sb.setLength(k);
              return sb.toString();
          }
        `,
        cpp: code`
          string decodeCiphertext(string encodedText, int rows) {
              int n = encodedText.size(), cols = n / rows;
              string out;
              for (int c = 0; c < cols; c++) {
                  for (int r = 0, j = c; r < rows && j < cols; r++, j++) out += encodedText[r * cols + j];
              }
              while (!out.empty() && out.back() == ' ') out.pop_back();
              return out;
          }
        `,
        c: code`
          char* decodeCiphertext(const char* encodedText, int rows) {
              int n = strlen(encodedText), cols = n / rows;
              char* out = (char*)malloc(n + 1);
              int k = 0;
              for (int c = 0; c < cols; c++) {
                  for (int r = 0, j = c; r < rows && j < cols; r++, j++) out[k++] = encodedText[r * cols + j];
              }
              while (k > 0 && out[k - 1] == ' ') k--;
              out[k] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string DecodeCiphertext(string encodedText, int rows)
          {
              int n = encodedText.Length, cols = n / rows;
              var sb = new System.Text.StringBuilder();
              for (int c = 0; c < cols; c++)
              {
                  for (int r = 0, j = c; r < rows && j < cols; r++, j++) sb.Append(encodedText[r * cols + j]);
              }
              return sb.ToString().TrimEnd(' ');
          }
        `,
        go: code`
          func decodeCiphertext(encodedText string, rows int) string {
          	cols := len(encodedText) / rows
          	out := make([]byte, 0, len(encodedText))
          	for c := 0; c < cols; c++ {
          		for r, j := 0, c; r < rows && j < cols; r, j = r+1, j+1 {
          			out = append(out, encodedText[r*cols+j])
          		}
          	}
          	return strings.TrimRight(string(out), " ")
          }
        `,
        kotlin: code`
          fun decodeCiphertext(encodedText: String, rows: Int): String {
              val cols = encodedText.length / rows
              val sb = StringBuilder()
              for (c in 0 until cols) {
                  var r = 0
                  var j = c
                  while (r < rows && j < cols) {
                      sb.append(encodedText[r * cols + j])
                      r++
                      j++
                  }
              }
              return sb.toString().trimEnd(' ')
          }
        `,
        swift: code`
          func decodeCiphertext(_ encodedText: String, _ rows: Int) -> String {
              let e = Array(encodedText.utf8)
              let cols = e.count / rows
              var out = [UInt8]()
              for c in 0..<cols {
                  var r = 0, j = c
                  while r < rows && j < cols {
                      out.append(e[r * cols + j])
                      r += 1
                      j += 1
                  }
              }
              while let last = out.last, last == 32 { out.removeLast() }
              return String(decoding: out, as: UTF8.self)
          }
        `,
        rust: code`
          fn decodeCiphertext(encodedText: String, rows: i32) -> String {
              let e = encodedText.as_bytes();
              let rows = rows as usize;
              let cols = e.len() / rows;
              let mut out: Vec<u8> = Vec::with_capacity(e.len());
              for c in 0..cols {
                  let (mut r, mut j) = (0usize, c);
                  while r < rows && j < cols {
                      out.push(e[r * cols + j]);
                      r += 1;
                      j += 1;
                  }
              }
              while out.last() == Some(&b' ') {
                  out.pop();
              }
              String::from_utf8(out).unwrap()
          }
        `,
        php: code`
          function decodeCiphertext($encodedText, $rows) {
              $n = strlen($encodedText);
              $cols = intdiv($n, $rows);
              $out = "";
              for ($c = 0; $c < $cols; $c++) {
                  for ($r = 0, $j = $c; $r < $rows && $j < $cols; $r++, $j++) $out .= $encodedText[$r * $cols + $j];
              }
              return rtrim($out, " ");
          }
        `,
        ruby: code`
          def decodeCiphertext(encodedText, rows)
            cols = encodedText.length / rows
            out = []
            cols.times do |c|
              r = 0
              j = c
              while r < rows && j < cols
                out << encodedText[r * cols + j]
                r += 1
                j += 1
              end
            end
            out.join.sub(/ +\z/, "")
          end
        `,
      },
    };
  })(),

  // ── Longest Palindrome by Concatenating Two Letter Words (LC 2131) ──
  (() => {
    const isPal = (s: string) => { for (let i = 0, j = s.length - 1; i < j; i++, j--) if (s[i] !== s[j]) return false; return true; };
    // Independent check: try every ordered selection of distinct indices for
    // small inputs; pair words off one at a time for larger ones.
    const ref = (words: string[]) => {
      const n = words.length;
      if (n <= 6) {
        let best = 0;
        const used = new Array<boolean>(n).fill(false);
        const dfs = (cur: string) => {
          if (cur.length > best && isPal(cur)) best = cur.length;
          for (let i = 0; i < n; i++) {
            if (used[i]) continue;
            used[i] = true;
            dfs(cur + words[i]);
            used[i] = false;
          }
        };
        dfs("");
        return best;
      }
      const left = new Map<string, number>();
      for (const w of words) left.set(w, (left.get(w) || 0) + 1);
      let len = 0;
      for (const w of words) {
        const rev = w[1] + w[0];
        const cw = left.get(w) || 0;
        if (cw === 0) continue;
        if (w === rev) { if (cw >= 2) { left.set(w, cw - 2); len += 4; } }
        else if ((left.get(rev) || 0) > 0) { left.set(w, cw - 1); left.set(rev, (left.get(rev) as number) - 1); len += 4; }
      }
      for (const [w, c] of left) if (c > 0 && w[0] === w[1]) { len += 2; break; }
      return len;
    };
    return {
      slug: "longest-palindrome-by-concatenating-two-letter-words",
      title: "Longest Palindrome by Concatenating Two Letter Words",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Greedy", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "longestPalindrome", params: [{ name: "words", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `words`; every word consists of exactly **two** lowercase letters.\n\nPick some of the words (each array element at most once) and concatenate them in any order you like to form a **palindrome** — a string that reads the same forwards and backwards.\n\nReturn the length of the longest palindrome you can build, or `0` if you cannot build any.",
        [
          { in: "words = [\"ka\",\"ak\",\"oo\",\"oo\",\"oo\",\"co\"]", out: "10", note: "`\"ka\" + \"oo\" + \"oo\" + \"oo\" + \"ak\"` gives `\"kaooooooak\"`. `\"co\"` has no partner `\"oc\"`." },
          { in: "words = [\"ab\",\"cd\",\"ef\"]", out: "0" },
          { in: "words = [\"xx\"]", out: "2", note: "A single word with two equal letters is a palindrome by itself." },
        ],
        ["1 <= words.length <= 10^5", "words[i].length == 2", "words[i] consists of lowercase English letters"]),
      hints: [
        "In a palindrome built from two-letter blocks, the block at position `i` from the left mirrors the block at position `i` from the right.",
        "So a word `xy` with `x != y` can only be used together with a copy of `yx`. A word `xx` can pair with another `xx`.",
        "Count the words. Pair `xy` with `yx` as often as possible, pair `xx` with `xx`, and if any `xx` is left over, put one in the middle.",
      ],
      editorial: explain({
        idea: "Words go in mirrored pairs around the centre: `xy` needs a `yx`, `xx` needs another `xx`. At most one unpaired `xx` can sit in the very middle.",
        steps: [
          "Count every word in a 26 × 26 table `cnt[x][y]`.",
          "For each pair of letters `x < y`, add `4 × min(cnt[x][y], cnt[y][x])`.",
          "For each letter `x`, add `4 × floor(cnt[x][x] / 2)`, and remember whether any `cnt[x][x]` is odd.",
          "If some `xx` word was left over, add 2 for the centre.",
        ],
        why: "Because every word has length 2 and the palindrome is a concatenation of words, the blocks align: the `i`-th word from the left is the reverse of the `i`-th word from the right, except possibly one word exactly in the middle, which must then be a palindrome itself (`xx`). Hence every usable word except the centre is matched with its reverse, the count of `xy` pairs is limited by the rarer of `xy` and `yx`, and greedily using all such pairs plus one spare `xx` is optimal.",
        time: "O(n + 26²)",
        space: "O(26²)",
        pitfalls: [
          "Only one leftover `xx` can be placed in the middle, even if several letters have odd counts.",
          "Do not count an `xy`/`yx` pair twice by visiting both orders — loop over `x < y` only.",
          "A word `xy` with `x != y` can never be the centre.",
        ],
      }),
      examples: [
        { input: "[\"ka\",\"ak\",\"oo\",\"oo\",\"oo\",\"co\"]", expectedOutput: "10" },
        { input: "[\"ab\",\"cd\",\"ef\"]", expectedOutput: "0" },
        { input: "[\"xx\"]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "ab", "xyz", "abcd", LOWER]);
        const n = rng() < 0.5 ? ri(rng, 1, 6) : ri(rng, 7, rng() < 0.3 ? 60 : 20);
        const words = Array.from({ length: n }, () => randLower(rng, 2, 2, alpha));
        return { input: fmtStrArr(words), expectedOutput: String(ref(words)) };
      },
      solutions: {
        python: code`
          from typing import List

          def longestPalindrome(words: List[str]) -> int:
              cnt = [[0] * 26 for _ in range(26)]
              for w in words:
                  cnt[ord(w[0]) - 97][ord(w[1]) - 97] += 1
              length = 0
              center = False
              for x in range(26):
                  length += (cnt[x][x] // 2) * 4
                  if cnt[x][x] % 2 == 1:
                      center = True
                  for y in range(x + 1, 26):
                      length += min(cnt[x][y], cnt[y][x]) * 4
              return length + (2 if center else 0)
        `,
        javascript: code`
          var longestPalindrome = function(words) {
              var cnt = [];
              for (var i = 0; i < 26; i++) cnt.push(new Array(26).fill(0));
              for (var w = 0; w < words.length; w++) cnt[words[w].charCodeAt(0) - 97][words[w].charCodeAt(1) - 97]++;
              var len = 0, center = false;
              for (var x = 0; x < 26; x++) {
                  len += Math.floor(cnt[x][x] / 2) * 4;
                  if (cnt[x][x] % 2 === 1) center = true;
                  for (var y = x + 1; y < 26; y++) len += Math.min(cnt[x][y], cnt[y][x]) * 4;
              }
              return len + (center ? 2 : 0);
          };
        `,
        typescript: code`
          function longestPalindrome(words: string[]): number {
              var cnt: number[][] = [];
              for (var i = 0; i < 26; i++) {
                  var row: number[] = [];
                  for (var j = 0; j < 26; j++) row.push(0);
                  cnt.push(row);
              }
              for (var w = 0; w < words.length; w++) cnt[words[w].charCodeAt(0) - 97][words[w].charCodeAt(1) - 97]++;
              var len = 0, center = false;
              for (var x = 0; x < 26; x++) {
                  len += Math.floor(cnt[x][x] / 2) * 4;
                  if (cnt[x][x] % 2 === 1) center = true;
                  for (var y = x + 1; y < 26; y++) len += Math.min(cnt[x][y], cnt[y][x]) * 4;
              }
              return len + (center ? 2 : 0);
          }
        `,
        java: code`
          public static int longestPalindrome(String[] words) {
              int[][] cnt = new int[26][26];
              for (String w : words) cnt[w.charAt(0) - 'a'][w.charAt(1) - 'a']++;
              int len = 0;
              boolean center = false;
              for (int x = 0; x < 26; x++) {
                  len += (cnt[x][x] / 2) * 4;
                  if (cnt[x][x] % 2 == 1) center = true;
                  for (int y = x + 1; y < 26; y++) len += Math.min(cnt[x][y], cnt[y][x]) * 4;
              }
              return len + (center ? 2 : 0);
          }
        `,
        cpp: code`
          int longestPalindrome(vector<string>& words) {
              int cnt[26][26] = {{0}};
              for (auto& w : words) cnt[w[0] - 'a'][w[1] - 'a']++;
              int len = 0;
              bool center = false;
              for (int x = 0; x < 26; x++) {
                  len += (cnt[x][x] / 2) * 4;
                  if (cnt[x][x] % 2 == 1) center = true;
                  for (int y = x + 1; y < 26; y++) len += min(cnt[x][y], cnt[y][x]) * 4;
              }
              return len + (center ? 2 : 0);
          }
        `,
        c: code`
          int longestPalindrome(char** words, int wordsSize) {
              int cnt[26][26];
              memset(cnt, 0, sizeof(cnt));
              for (int i = 0; i < wordsSize; i++) cnt[words[i][0] - 'a'][words[i][1] - 'a']++;
              int len = 0;
              bool center = false;
              for (int x = 0; x < 26; x++) {
                  len += (cnt[x][x] / 2) * 4;
                  if (cnt[x][x] % 2 == 1) center = true;
                  for (int y = x + 1; y < 26; y++) len += (cnt[x][y] < cnt[y][x] ? cnt[x][y] : cnt[y][x]) * 4;
              }
              return len + (center ? 2 : 0);
          }
        `,
        csharp: code`
          public static int LongestPalindrome(string[] words)
          {
              int[,] cnt = new int[26, 26];
              foreach (var w in words) cnt[w[0] - 'a', w[1] - 'a']++;
              int len = 0;
              bool center = false;
              for (int x = 0; x < 26; x++)
              {
                  len += (cnt[x, x] / 2) * 4;
                  if (cnt[x, x] % 2 == 1) center = true;
                  for (int y = x + 1; y < 26; y++) len += Math.Min(cnt[x, y], cnt[y, x]) * 4;
              }
              return len + (center ? 2 : 0);
          }
        `,
        go: code`
          func longestPalindrome(words []string) int {
          	var cnt [26][26]int
          	for _, w := range words {
          		cnt[w[0]-'a'][w[1]-'a']++
          	}
          	length := 0
          	center := false
          	for x := 0; x < 26; x++ {
          		length += (cnt[x][x] / 2) * 4
          		if cnt[x][x]%2 == 1 {
          			center = true
          		}
          		for y := x + 1; y < 26; y++ {
          			a, b := cnt[x][y], cnt[y][x]
          			if b < a {
          				a = b
          			}
          			length += a * 4
          		}
          	}
          	if center {
          		length += 2
          	}
          	return length
          }
        `,
        kotlin: code`
          fun longestPalindrome(words: Array<String>): Int {
              val cnt = Array(26) { IntArray(26) }
              for (w in words) cnt[w[0] - 'a'][w[1] - 'a']++
              var len = 0
              var center = false
              for (x in 0 until 26) {
                  len += (cnt[x][x] / 2) * 4
                  if (cnt[x][x] % 2 == 1) center = true
                  for (y in x + 1 until 26) len += minOf(cnt[x][y], cnt[y][x]) * 4
              }
              return len + if (center) 2 else 0
          }
        `,
        swift: code`
          func longestPalindrome(_ words: [String]) -> Int {
              var cnt = [[Int]](repeating: [Int](repeating: 0, count: 26), count: 26)
              for w in words {
                  let b = Array(w.utf8)
                  cnt[Int(b[0]) - 97][Int(b[1]) - 97] += 1
              }
              var len = 0
              var center = false
              for x in 0..<26 {
                  len += (cnt[x][x] / 2) * 4
                  if cnt[x][x] % 2 == 1 { center = true }
                  for y in (x + 1)..<26 { len += min(cnt[x][y], cnt[y][x]) * 4 }
              }
              return len + (center ? 2 : 0)
          }
        `,
        rust: code`
          fn longestPalindrome(words: Vec<String>) -> i32 {
              let mut cnt = [[0i32; 26]; 26];
              for w in words.iter() {
                  let b = w.as_bytes();
                  cnt[(b[0] - b'a') as usize][(b[1] - b'a') as usize] += 1;
              }
              let mut len = 0;
              let mut center = false;
              for x in 0..26 {
                  len += (cnt[x][x] / 2) * 4;
                  if cnt[x][x] % 2 == 1 {
                      center = true;
                  }
                  for y in (x + 1)..26 {
                      len += cnt[x][y].min(cnt[y][x]) * 4;
                  }
              }
              len + if center { 2 } else { 0 }
          }
        `,
        php: code`
          function longestPalindrome($words) {
              $cnt = array_fill(0, 26, array_fill(0, 26, 0));
              foreach ($words as $w) $cnt[ord($w[0]) - 97][ord($w[1]) - 97]++;
              $len = 0;
              $center = false;
              for ($x = 0; $x < 26; $x++) {
                  $len += intdiv($cnt[$x][$x], 2) * 4;
                  if ($cnt[$x][$x] % 2 == 1) $center = true;
                  for ($y = $x + 1; $y < 26; $y++) $len += min($cnt[$x][$y], $cnt[$y][$x]) * 4;
              }
              return $len + ($center ? 2 : 0);
          }
        `,
        ruby: code`
          def longestPalindrome(words)
            cnt = Array.new(26) { Array.new(26, 0) }
            words.each { |w| cnt[w.getbyte(0) - 97][w.getbyte(1) - 97] += 1 }
            len = 0
            center = false
            26.times do |x|
              len += (cnt[x][x] / 2) * 4
              center = true if cnt[x][x].odd?
              ((x + 1)...26).each { |y| len += [cnt[x][y], cnt[y][x]].min * 4 }
            end
            len + (center ? 2 : 0)
          end
        `,
      },
    };
  })(),

  // ── Maximize Number of Subsequences in a String (LC 2207) ───────
  (() => {
    const countSub = (t: string, p: string) => {
      let firsts = 0, total = 0;
      for (const ch of t) {
        if (ch === p[1]) total += firsts;
        if (ch === p[0]) firsts++;
      }
      return total;
    };
    // Independent check: try both letters at every insertion point.
    const ref = (text: string, pattern: string) => {
      let best = 0;
      for (let i = 0; i <= text.length; i++) {
        for (const c of [pattern[0], pattern[1]]) best = Math.max(best, countSub(text.slice(0, i) + c + text.slice(i), pattern));
      }
      return best;
    };
    return {
      slug: "maximize-number-of-subsequences-in-a-string",
      title: "Maximize Number of Subsequences in a String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Prefix Sum", "Amazon", "Google"],
      signature: {
        funcName: "maximumSubsequenceCount",
        params: [{ name: "text", type: "string" as const }, { name: "pattern", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given a string `text` and a string `pattern` of length **2**, both lowercase.\n\nInsert **exactly one** character into `text` — either `pattern[0]` or `pattern[1]` — at any position (including the very beginning or end).\n\nReturn the maximum number of times `pattern` can then occur in the new string as a **subsequence**: the number of index pairs `i < j` with `newText[i] = pattern[0]` and `newText[j] = pattern[1]`.\n\nThe length bound below is tightened from the original problem so that the answer always fits in a 32-bit signed integer.",
        [
          { in: "text = \"kakao\", pattern = \"ko\"", out: "4", note: "Appending an `o` gives `\"kakaoo\"`: each of the two `o`s follows both `k`s." },
          { in: "text = \"aabb\", pattern = \"ab\"", out: "6" },
          { in: "text = \"zzz\", pattern = \"zz\"", out: "6", note: "Four `z`s contain 4 × 3 / 2 = 6 ordered pairs." },
        ],
        ["1 <= text.length <= 5 * 10^4", "pattern.length == 2", "text and pattern consist only of lowercase English letters"]),
      hints: [
        "First count the occurrences in `text` as it is: for every `pattern[1]`, add how many `pattern[0]`s came before it.",
        "Where is the best place for an extra `pattern[0]`? And for an extra `pattern[1]`?",
        "A `pattern[0]` at the very front pairs with every `pattern[1]`; a `pattern[1]` at the very end pairs with every `pattern[0]`. Add the larger of the two counts.",
      ],
      editorial: explain({
        idea: "The inserted character only adds the pairs it takes part in. Put `pattern[0]` at the front or `pattern[1]` at the back, whichever pairs with more existing characters.",
        steps: [
          "Scan `text` once, keeping `ca` = number of `pattern[0]` seen so far and `cb` = number of `pattern[1]` seen.",
          "At each character, if it equals `pattern[1]` add `ca` to the running total (pairs it closes), then if it equals `pattern[0]` increase `ca`; count `cb` alongside.",
          "Return `total + max(ca, cb)`.",
        ],
        why: "Inserting a character never destroys existing pairs; it only adds pairs that use it. An inserted `pattern[0]` forms a pair with every `pattern[1]` to its right, which is maximised at the front (`cb` pairs). An inserted `pattern[1]` pairs with every `pattern[0]` to its left, maximised at the end (`ca` pairs). When the two pattern letters are equal the same logic gives `ca = cb`, and checking `pattern[1]` before incrementing `ca` makes a character never pair with itself.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "When `pattern[0] == pattern[1]`, update the total before incrementing the count, or each character pairs with itself.",
          "In the original constraints (n up to 10^5) the answer needs 64 bits; accumulate in a wide type.",
          "Trying every insertion point is O(n²) and unnecessary.",
        ],
      }),
      examples: [
        { input: "\"kakao\"\n\"ko\"", expectedOutput: "4" },
        { input: "\"aabb\"\n\"ab\"", expectedOutput: "6" },
        { input: "\"zzz\"\n\"zz\"", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "ab", "xyz", LOWER, "a"]);
        const text = randLower(rng, 1, rng() < 0.2 ? 40 : 12, alpha);
        const r = rng();
        let pattern: string;
        if (r < 0.15) { const c = pick(rng, alpha.split("")); pattern = c + c; }
        else if (r < 0.85) pattern = pick(rng, alpha.split("")) + pick(rng, alpha.split(""));
        else pattern = randLower(rng, 2, 2);
        return { input: `"${text}"\n"${pattern}"`, expectedOutput: String(ref(text, pattern)) };
      },
      solutions: {
        python: code`
          def maximumSubsequenceCount(text: str, pattern: str) -> int:
              a, b = pattern[0], pattern[1]
              ca = cb = total = 0
              for ch in text:
                  if ch == b:
                      total += ca
                      cb += 1
                  if ch == a:
                      ca += 1
              return total + max(ca, cb)
        `,
        javascript: code`
          var maximumSubsequenceCount = function(text, pattern) {
              var a = pattern[0], b = pattern[1];
              var ca = 0, cb = 0, total = 0;
              for (var i = 0; i < text.length; i++) {
                  var ch = text[i];
                  if (ch === b) { total += ca; cb++; }
                  if (ch === a) ca++;
              }
              return total + Math.max(ca, cb);
          };
        `,
        typescript: code`
          function maximumSubsequenceCount(text: string, pattern: string): number {
              var a = pattern.charAt(0), b = pattern.charAt(1);
              var ca = 0, cb = 0, total = 0;
              for (var i = 0; i < text.length; i++) {
                  var ch = text.charAt(i);
                  if (ch === b) { total += ca; cb++; }
                  if (ch === a) ca++;
              }
              return total + Math.max(ca, cb);
          }
        `,
        java: code`
          public static int maximumSubsequenceCount(String text, String pattern) {
              char a = pattern.charAt(0), b = pattern.charAt(1);
              long ca = 0, cb = 0, total = 0;
              for (int i = 0; i < text.length(); i++) {
                  char ch = text.charAt(i);
                  if (ch == b) { total += ca; cb++; }
                  if (ch == a) ca++;
              }
              return (int) (total + Math.max(ca, cb));
          }
        `,
        cpp: code`
          int maximumSubsequenceCount(string text, string pattern) {
              char a = pattern[0], b = pattern[1];
              long long ca = 0, cb = 0, total = 0;
              for (char ch : text) {
                  if (ch == b) { total += ca; cb++; }
                  if (ch == a) ca++;
              }
              return (int)(total + max(ca, cb));
          }
        `,
        c: code`
          int maximumSubsequenceCount(const char* text, const char* pattern) {
              char a = pattern[0], b = pattern[1];
              long long ca = 0, cb = 0, total = 0;
              for (int i = 0; text[i]; i++) {
                  if (text[i] == b) { total += ca; cb++; }
                  if (text[i] == a) ca++;
              }
              return (int)(total + (ca > cb ? ca : cb));
          }
        `,
        csharp: code`
          public static int MaximumSubsequenceCount(string text, string pattern)
          {
              char a = pattern[0], b = pattern[1];
              long ca = 0, cb = 0, total = 0;
              foreach (char ch in text)
              {
                  if (ch == b) { total += ca; cb++; }
                  if (ch == a) ca++;
              }
              return (int)(total + Math.Max(ca, cb));
          }
        `,
        go: code`
          func maximumSubsequenceCount(text string, pattern string) int {
          	a, b := pattern[0], pattern[1]
          	ca, cb, total := 0, 0, 0
          	for i := 0; i < len(text); i++ {
          		if text[i] == b {
          			total += ca
          			cb++
          		}
          		if text[i] == a {
          			ca++
          		}
          	}
          	if ca > cb {
          		return total + ca
          	}
          	return total + cb
          }
        `,
        kotlin: code`
          fun maximumSubsequenceCount(text: String, pattern: String): Int {
              val a = pattern[0]
              val b = pattern[1]
              var ca = 0L
              var cb = 0L
              var total = 0L
              for (ch in text) {
                  if (ch == b) { total += ca; cb++ }
                  if (ch == a) ca++
              }
              return (total + maxOf(ca, cb)).toInt()
          }
        `,
        swift: code`
          func maximumSubsequenceCount(_ text: String, _ pattern: String) -> Int {
              let p = Array(pattern.utf8)
              let a = p[0], b = p[1]
              var ca = 0, cb = 0, total = 0
              for ch in text.utf8 {
                  if ch == b {
                      total += ca
                      cb += 1
                  }
                  if ch == a { ca += 1 }
              }
              return total + max(ca, cb)
          }
        `,
        rust: code`
          fn maximumSubsequenceCount(text: String, pattern: String) -> i32 {
              let p = pattern.as_bytes();
              let (a, b) = (p[0], p[1]);
              let (mut ca, mut cb, mut total) = (0i64, 0i64, 0i64);
              for &ch in text.as_bytes() {
                  if ch == b {
                      total += ca;
                      cb += 1;
                  }
                  if ch == a {
                      ca += 1;
                  }
              }
              (total + ca.max(cb)) as i32
          }
        `,
        php: code`
          function maximumSubsequenceCount($text, $pattern) {
              $a = $pattern[0];
              $b = $pattern[1];
              $ca = 0;
              $cb = 0;
              $total = 0;
              $n = strlen($text);
              for ($i = 0; $i < $n; $i++) {
                  if ($text[$i] === $b) { $total += $ca; $cb++; }
                  if ($text[$i] === $a) $ca++;
              }
              return $total + max($ca, $cb);
          }
        `,
        ruby: code`
          def maximumSubsequenceCount(text, pattern)
            a = pattern[0]
            b = pattern[1]
            ca = 0
            cb = 0
            total = 0
            text.each_char do |ch|
              if ch == b
                total += ca
                cb += 1
              end
              ca += 1 if ch == a
            end
            total + [ca, cb].max
          end
        `,
      },
    };
  })(),

  // ── Construct Smallest Number From DI String (LC 2375) ──────────
  (() => {
    // Independent check: depth-first search trying the digits in increasing
    // order; the first complete number found is the smallest.
    const ref = (pattern: string) => {
      const n = pattern.length;
      const used = new Array<boolean>(10).fill(false);
      const cur: number[] = [];
      const dfs = (): boolean => {
        if (cur.length === n + 1) return true;
        for (let d = 1; d <= 9; d++) {
          if (used[d]) continue;
          const i = cur.length;
          if (i > 0 && (pattern[i - 1] === "I" ? cur[i - 1] >= d : cur[i - 1] <= d)) continue;
          used[d] = true; cur.push(d);
          if (dfs()) return true;
          used[d] = false; cur.pop();
        }
        return false;
      };
      dfs();
      return cur.join("");
    };
    return {
      slug: "construct-smallest-number-from-di-string",
      title: "Construct Smallest Number From DI String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Greedy", "Backtracking", "Amazon", "Google", "Goldman Sachs"],
      signature: { funcName: "smallestNumber", params: [{ name: "pattern", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `pattern` of length `n` made of the letters `'I'` (increasing) and `'D'` (decreasing).\n\nBuild a string `num` of length `n + 1` such that:\n\n- `num` uses only the digits `'1'` to `'9'`, each digit **at most once**;\n- if `pattern[i] == 'I'` then `num[i] < num[i + 1]`;\n- if `pattern[i] == 'D'` then `num[i] > num[i + 1]`.\n\nReturn the lexicographically **smallest** such string.",
        [
          { in: "pattern = \"DDI\"", out: "3214", note: "The first three digits must fall, then rise; `3214` is the smallest way to do that." },
          { in: "pattern = \"IDID\"", out: "13254" },
          { in: "pattern = \"D\"", out: "21" },
        ],
        ["1 <= pattern.length <= 8", "pattern consists of only the letters 'I' and 'D'"]),
      hints: [
        "If the pattern were all `I`s, the answer would be `1 2 3 …`. What does a run of `D`s do to that?",
        "A run of `k` `D`s needs `k + 1` falling digits. Use the smallest unused digits for them, written in reverse.",
        "Push `i + 1` onto a stack for each position; whenever the pattern says `I` (or the string ends), pop the whole stack into the answer.",
      ],
      editorial: explain({
        idea: "Start from the ascending sequence `1, 2, …, n + 1` and reverse each block that a run of `D`s covers. A stack does those reversals on the fly.",
        steps: [
          "For `i` from 0 to `n`, push the digit `i + 1` onto a stack.",
          "If `i == n` or `pattern[i] == 'I'`, pop every digit off the stack and append it to the answer.",
          "Return the answer.",
        ],
        why: "Each maximal group of positions joined by `D`s must be strictly decreasing, and consecutive groups are joined by an `I`. Using the digits in increasing order, each group receives the smallest digits still unused, placed in decreasing order — any smaller digit at the front of a group would have to be followed by an even smaller one that is already taken. The stack pushes the group's digits in increasing order and pops them in reverse exactly when the group ends at an `I` or at the end of the string. Digits 1 to `n + 1 <= 9` always suffice.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Remember to flush the stack after the last position as well.",
          "A purely greedy \"smallest unused digit\" choice fails on `D`: the first digit must leave room for the whole falling run.",
          "The answer always uses exactly the digits `1..n+1`.",
        ],
      }),
      examples: [
        { input: "\"DDI\"", expectedOutput: "3214" },
        { input: "\"IDID\"", expectedOutput: "13254" },
        { input: "\"D\"", expectedOutput: "21" },
      ],
      // Only 510 patterns exist (lengths 1..8); draw uniformly over all of them.
      hiddenCount: 500,
      gen: (rng: Rng) => {
        let k = ri(rng, 0, 509), len = 1;
        while (k >= 1 << len) { k -= 1 << len; len++; }
        let pattern = "";
        for (let i = 0; i < len; i++) pattern += (k >> i) & 1 ? "D" : "I";
        return { input: `"${pattern}"`, expectedOutput: ref(pattern) };
      },
      solutions: {
        python: code`
          def smallestNumber(pattern: str) -> str:
              out = []
              stack = []
              for i in range(len(pattern) + 1):
                  stack.append(str(i + 1))
                  if i == len(pattern) or pattern[i] == "I":
                      while stack:
                          out.append(stack.pop())
              return "".join(out)
        `,
        javascript: code`
          var smallestNumber = function(pattern) {
              var out = "", stack = [];
              for (var i = 0; i <= pattern.length; i++) {
                  stack.push(String(i + 1));
                  if (i === pattern.length || pattern[i] === "I") {
                      while (stack.length) out += stack.pop();
                  }
              }
              return out;
          };
        `,
        typescript: code`
          function smallestNumber(pattern: string): string {
              var out = "";
              var stack: string[] = [];
              for (var i = 0; i <= pattern.length; i++) {
                  stack.push(String(i + 1));
                  if (i === pattern.length || pattern.charAt(i) === "I") {
                      while (stack.length > 0) out += stack.pop();
                  }
              }
              return out;
          }
        `,
        java: code`
          public static String smallestNumber(String pattern) {
              StringBuilder sb = new StringBuilder();
              Deque<Integer> stack = new ArrayDeque<>();
              int n = pattern.length();
              for (int i = 0; i <= n; i++) {
                  stack.push(i + 1);
                  if (i == n || pattern.charAt(i) == 'I') {
                      while (!stack.isEmpty()) sb.append(stack.pop());
                  }
              }
              return sb.toString();
          }
        `,
        cpp: code`
          string smallestNumber(string pattern) {
              string out;
              vector<char> st;
              int n = pattern.size();
              for (int i = 0; i <= n; i++) {
                  st.push_back((char)('1' + i));
                  if (i == n || pattern[i] == 'I') {
                      while (!st.empty()) { out += st.back(); st.pop_back(); }
                  }
              }
              return out;
          }
        `,
        c: code`
          char* smallestNumber(const char* pattern) {
              int n = strlen(pattern);
              char* out = (char*)malloc(n + 2);
              char st[16];
              int top = 0, k = 0;
              for (int i = 0; i <= n; i++) {
                  st[top++] = (char)('1' + i);
                  if (i == n || pattern[i] == 'I') {
                      while (top > 0) out[k++] = st[--top];
                  }
              }
              out[k] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string SmallestNumber(string pattern)
          {
              var sb = new System.Text.StringBuilder();
              var st = new Stack<char>();
              int n = pattern.Length;
              for (int i = 0; i <= n; i++)
              {
                  st.Push((char)('1' + i));
                  if (i == n || pattern[i] == 'I')
                  {
                      while (st.Count > 0) sb.Append(st.Pop());
                  }
              }
              return sb.ToString();
          }
        `,
        go: code`
          func smallestNumber(pattern string) string {
          	n := len(pattern)
          	out := make([]byte, 0, n+1)
          	st := make([]byte, 0, n+1)
          	for i := 0; i <= n; i++ {
          		st = append(st, byte('1'+i))
          		if i == n || pattern[i] == 'I' {
          			for len(st) > 0 {
          				out = append(out, st[len(st)-1])
          				st = st[:len(st)-1]
          			}
          		}
          	}
          	return string(out)
          }
        `,
        kotlin: code`
          fun smallestNumber(pattern: String): String {
              val sb = StringBuilder()
              val st = java.util.ArrayDeque<Char>()
              val n = pattern.length
              for (i in 0..n) {
                  st.push('1' + i)
                  if (i == n || pattern[i] == 'I') {
                      while (st.isNotEmpty()) sb.append(st.pop())
                  }
              }
              return sb.toString()
          }
        `,
        swift: code`
          func smallestNumber(_ pattern: String) -> String {
              let p = Array(pattern.utf8)
              let n = p.count
              var out = [UInt8]()
              var st = [UInt8]()
              for i in 0...n {
                  st.append(UInt8(49 + i))
                  if i == n || p[i] == 73 {
                      while let top = st.popLast() { out.append(top) }
                  }
              }
              return String(decoding: out, as: UTF8.self)
          }
        `,
        rust: code`
          fn smallestNumber(pattern: String) -> String {
              let p = pattern.as_bytes();
              let n = p.len();
              let mut out: Vec<u8> = Vec::with_capacity(n + 1);
              let mut st: Vec<u8> = Vec::new();
              for i in 0..=n {
                  st.push(b'1' + i as u8);
                  if i == n || p[i] == b'I' {
                      while let Some(top) = st.pop() {
                          out.push(top);
                      }
                  }
              }
              String::from_utf8(out).unwrap()
          }
        `,
        php: code`
          function smallestNumber($pattern) {
              $n = strlen($pattern);
              $out = "";
              $st = [];
              for ($i = 0; $i <= $n; $i++) {
                  $st[] = (string)($i + 1);
                  if ($i == $n || $pattern[$i] === "I") {
                      while (!empty($st)) $out .= array_pop($st);
                  }
              }
              return $out;
          }
        `,
        ruby: code`
          def smallestNumber(pattern)
            n = pattern.length
            out = []
            st = []
            (0..n).each do |i|
              st.push((i + 1).to_s)
              if i == n || pattern[i] == "I"
                out << st.pop until st.empty?
              end
            end
            out.join
          end
        `,
      },
    };
  })(),

  // ── Time Needed to Rearrange a Binary String (LC 2380) ──────────
  (() => {
    // Independent check: run the process second by second.
    const ref = (s: string) => {
      let t = 0;
      while (s.indexOf("01") >= 0) { s = s.replace(/01/g, "10"); t++; }
      return t;
    };
    return {
      slug: "time-needed-to-rearrange-a-binary-string",
      title: "Time Needed to Rearrange a Binary String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Simulation", "Amazon", "Google"],
      signature: { funcName: "secondsToRemoveOccurrences", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a binary string `s`. Every second, **all** occurrences of the substring `\"01\"` are replaced by `\"10\"` at the same time. The process repeats until `s` contains no `\"01\"` at all.\n\nReturn the number of seconds the process takes.",
        [
          { in: "s = \"0011\"", out: "3", note: "`0011` → `0101` → `1010` → `1100`." },
          { in: "s = \"1001\"", out: "2", note: "`1001` → `1010` → `1100`." },
          { in: "s = \"1100\"", out: "0", note: "There is no `\"01\"` to begin with." },
        ],
        ["1 <= s.length <= 1000", "s[i] is either '0' or '1'"],
        "Can you solve it in O(n) time?"),
      hints: [
        "In the end every `1` sits to the left of every `0`. Each second, a `1` with a `0` directly to its left moves one step left.",
        "A `1` needs at least as many seconds as there are `0`s before it — it must pass each of them.",
        "It may also be blocked by the `1` in front of it, finishing at least one second after that one. Sweep left to right: `ans = max(ans + 1, zeros)` at each `1` that has a `0` before it.",
      ],
      editorial: explain({
        idea: "Track when each `1` finishes moving. A `1` with `z` zeros before it needs at least `z` seconds, and it finishes at least one second after the previous moving `1`, which can block it.",
        steps: [
          "Sweep `s` from left to right, counting `zeros`, the `0`s seen so far, and keeping `ans`, the finishing time of the last `1` that had to move.",
          "On a `0`, increase `zeros`.",
          "On a `1` with `zeros > 0`, set `ans = max(ans + 1, zeros)`. A `1` with no `0` before it never moves and changes nothing.",
          "Return `ans`.",
        ],
        why: "Each second a moving `1` advances one place unless the `1` directly ahead of it is still sitting in its way. If it is never blocked it finishes after exactly `zeros` seconds. If it catches up with the previous moving `1`, it from then on trails it by one second, finishing at `previous + 1`. Its true finishing time is the larger of these two bounds, and the last `1` to finish determines the whole process.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Leading `1`s do not move; do not let them bump `ans`.",
          "Simulating directly costs O(n²) — acceptable for n = 1000, but the sweep is linear.",
          "Replacements happen simultaneously, so a `1` moves at most one place per second.",
        ],
      }),
      examples: [
        { input: "\"0011\"", expectedOutput: "3" },
        { input: "\"1001\"", expectedOutput: "2" },
        { input: "\"1100\"", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, rng() < 0.2 ? 60 : 16);
        const pOne = pick(rng, [0.2, 0.5, 0.8]);
        let s = "";
        for (let i = 0; i < n; i++) s += rng() < pOne ? "1" : "0";
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def secondsToRemoveOccurrences(s: str) -> int:
              zeros = 0
              ans = 0
              for ch in s:
                  if ch == "0":
                      zeros += 1
                  elif zeros > 0:
                      ans = max(ans + 1, zeros)
              return ans
        `,
        javascript: code`
          var secondsToRemoveOccurrences = function(s) {
              var zeros = 0, ans = 0;
              for (var i = 0; i < s.length; i++) {
                  if (s[i] === "0") zeros++;
                  else if (zeros > 0) ans = Math.max(ans + 1, zeros);
              }
              return ans;
          };
        `,
        typescript: code`
          function secondsToRemoveOccurrences(s: string): number {
              var zeros = 0, ans = 0;
              for (var i = 0; i < s.length; i++) {
                  if (s.charAt(i) === "0") zeros++;
                  else if (zeros > 0) ans = Math.max(ans + 1, zeros);
              }
              return ans;
          }
        `,
        java: code`
          public static int secondsToRemoveOccurrences(String s) {
              int zeros = 0, ans = 0;
              for (int i = 0; i < s.length(); i++) {
                  if (s.charAt(i) == '0') zeros++;
                  else if (zeros > 0) ans = Math.max(ans + 1, zeros);
              }
              return ans;
          }
        `,
        cpp: code`
          int secondsToRemoveOccurrences(string s) {
              int zeros = 0, ans = 0;
              for (char ch : s) {
                  if (ch == '0') zeros++;
                  else if (zeros > 0) ans = max(ans + 1, zeros);
              }
              return ans;
          }
        `,
        c: code`
          int secondsToRemoveOccurrences(const char* s) {
              int zeros = 0, ans = 0;
              for (int i = 0; s[i]; i++) {
                  if (s[i] == '0') zeros++;
                  else if (zeros > 0) ans = (ans + 1 > zeros) ? ans + 1 : zeros;
              }
              return ans;
          }
        `,
        csharp: code`
          public static int SecondsToRemoveOccurrences(string s)
          {
              int zeros = 0, ans = 0;
              foreach (char ch in s)
              {
                  if (ch == '0') zeros++;
                  else if (zeros > 0) ans = Math.Max(ans + 1, zeros);
              }
              return ans;
          }
        `,
        go: code`
          func secondsToRemoveOccurrences(s string) int {
          	zeros, ans := 0, 0
          	for i := 0; i < len(s); i++ {
          		if s[i] == '0' {
          			zeros++
          		} else if zeros > 0 {
          			ans++
          			if zeros > ans {
          				ans = zeros
          			}
          		}
          	}
          	return ans
          }
        `,
        kotlin: code`
          fun secondsToRemoveOccurrences(s: String): Int {
              var zeros = 0
              var ans = 0
              for (ch in s) {
                  if (ch == '0') zeros++
                  else if (zeros > 0) ans = maxOf(ans + 1, zeros)
              }
              return ans
          }
        `,
        swift: code`
          func secondsToRemoveOccurrences(_ s: String) -> Int {
              var zeros = 0, ans = 0
              for ch in s.utf8 {
                  if ch == 48 {
                      zeros += 1
                  } else if zeros > 0 {
                      ans = max(ans + 1, zeros)
                  }
              }
              return ans
          }
        `,
        rust: code`
          fn secondsToRemoveOccurrences(s: String) -> i32 {
              let (mut zeros, mut ans) = (0i32, 0i32);
              for &ch in s.as_bytes() {
                  if ch == b'0' {
                      zeros += 1;
                  } else if zeros > 0 {
                      ans = (ans + 1).max(zeros);
                  }
              }
              ans
          }
        `,
        php: code`
          function secondsToRemoveOccurrences($s) {
              $zeros = 0;
              $ans = 0;
              $n = strlen($s);
              for ($i = 0; $i < $n; $i++) {
                  if ($s[$i] === "0") $zeros++;
                  elseif ($zeros > 0) $ans = max($ans + 1, $zeros);
              }
              return $ans;
          }
        `,
        ruby: code`
          def secondsToRemoveOccurrences(s)
            zeros = 0
            ans = 0
            s.each_char do |ch|
              if ch == "0"
                zeros += 1
              elsif zeros > 0
                ans = [ans + 1, zeros].max
              end
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Shifting Letters II (LC 2381) ───────────────────────────────
  (() => {
    // Independent check: apply every shift to every letter it covers.
    const ref = (s: string, shifts: number[][]) => {
      const a = s.split("").map((c) => c.charCodeAt(0) - 97);
      for (const [st, en, d] of shifts) for (let i = st; i <= en; i++) a[i] = (a[i] + (d === 1 ? 1 : 25)) % 26;
      return a.map((x) => String.fromCharCode(97 + x)).join("");
    };
    return {
      slug: "shifting-letters-ii",
      title: "Shifting Letters II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Prefix Sum", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "shiftingLetters",
        params: [{ name: "s", type: "string" as const }, { name: "shifts", type: "int[][]" as const }],
        returns: "string" as const,
      },
      description: describe(
        "You are given a lowercase string `s` and a list of operations `shifts`, where `shifts[i] = [start, end, direction]`.\n\nOperation `i` shifts every character from index `start` to index `end` (inclusive) one step **forward** in the alphabet when `direction == 1`, or one step **backward** when `direction == 0`. The alphabet wraps around: shifting `'z'` forward gives `'a'` and shifting `'a'` backward gives `'z'`.\n\nApply all operations and return the final string.",
        [
          { in: "s = \"kairo\", shifts = [[0,4,1],[1,2,0]]", out: "laisp", note: "The first operation gives `\"lbjsp\"`; the second moves indices 1 and 2 back, giving `\"laisp\"`." },
          { in: "s = \"az\", shifts = [[0,1,1]]", out: "ba", note: "`'z'` wraps around to `'a'`." },
          { in: "s = \"a\", shifts = [[0,0,0],[0,0,0]]", out: "y" },
        ],
        ["1 <= s.length, shifts.length <= 5 * 10^4", "shifts[i].length == 3", "0 <= start <= end < s.length", "0 <= direction <= 1", "s consists of lowercase English letters"]),
      hints: [
        "Applying each operation letter by letter is O(n·q). Only the net shift of each position matters.",
        "Add +1 or -1 on a whole range at once with a difference array: mark the start, unmark just after the end.",
        "A running sum over the difference array gives each position's net shift; reduce it modulo 26, taking care with negatives.",
      ],
      editorial: explain({
        idea: "The order of the operations does not matter, only each position's net shift. A difference array records every range update in O(1), and one prefix sum recovers the net shifts.",
        steps: [
          "Create `diff` of length `n + 1`, all zeros.",
          "For each `[start, end, direction]`, let `v = +1` if `direction == 1` else `-1`; do `diff[start] += v` and `diff[end + 1] -= v`.",
          "Sweep `i` from 0 to `n - 1` keeping a running sum `cur += diff[i]`; the new letter is `(s[i] - 'a' + cur) mod 26`, normalised into `0..25`.",
        ],
        why: "Shifts commute, so the final letter at position `i` depends only on the sum of `+1`/`-1` over the operations covering `i`. The running sum of the difference array at `i` counts exactly the operations whose range starts at or before `i` and has not ended before `i`, which are the ones covering it.",
        time: "O(n + q)",
        space: "O(n)",
        pitfalls: [
          "The net shift can be negative: use `((x % 26) + 26) % 26` in languages whose `%` keeps the sign.",
          "`diff` needs one extra slot for `end + 1 == n`.",
          "Backward is `direction == 0`, not `-1`.",
        ],
      }),
      examples: [
        { input: "\"kairo\"\n[[0,4,1],[1,2,0]]", expectedOutput: "laisp" },
        { input: "\"az\"\n[[0,1,1]]", expectedOutput: "ba" },
        { input: "\"a\"\n[[0,0,0],[0,0,0]]", expectedOutput: "y" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, rng() < 0.2 ? 50 : 12, pick(rng, [LOWER, LOWER, "az", "yzab"]));
        const n = s.length;
        const q = ri(rng, 1, rng() < 0.2 ? 60 : 10);
        const bias = pick(rng, [0, 0.5, 1]);
        const shifts: number[][] = [];
        for (let i = 0; i < q; i++) {
          const a = ri(rng, 0, n - 1), b = ri(rng, a, n - 1);
          shifts.push([a, b, rng() < bias ? 1 : 0]);
        }
        return { input: `"${s}"\n${fmtIntMat(shifts)}`, expectedOutput: ref(s, shifts) };
      },
      solutions: {
        python: code`
          from typing import List

          def shiftingLetters(s: str, shifts: List[List[int]]) -> str:
              n = len(s)
              diff = [0] * (n + 1)
              for a, b, d in shifts:
                  v = 1 if d == 1 else -1
                  diff[a] += v
                  diff[b + 1] -= v
              out = []
              cur = 0
              for i, ch in enumerate(s):
                  cur += diff[i]
                  out.append(chr((ord(ch) - 97 + cur) % 26 + 97))
              return "".join(out)
        `,
        javascript: code`
          var shiftingLetters = function(s, shifts) {
              var n = s.length;
              var diff = new Array(n + 1).fill(0);
              for (var i = 0; i < shifts.length; i++) {
                  var v = shifts[i][2] === 1 ? 1 : -1;
                  diff[shifts[i][0]] += v;
                  diff[shifts[i][1] + 1] -= v;
              }
              var out = [], cur = 0;
              for (var j = 0; j < n; j++) {
                  cur += diff[j];
                  var x = (((s.charCodeAt(j) - 97 + cur) % 26) + 26) % 26;
                  out.push(String.fromCharCode(97 + x));
              }
              return out.join("");
          };
        `,
        typescript: code`
          function shiftingLetters(s: string, shifts: number[][]): string {
              var n = s.length;
              var diff: number[] = [];
              for (var z = 0; z <= n; z++) diff.push(0);
              for (var i = 0; i < shifts.length; i++) {
                  var v = shifts[i][2] === 1 ? 1 : -1;
                  diff[shifts[i][0]] += v;
                  diff[shifts[i][1] + 1] -= v;
              }
              var out: string[] = [];
              var cur = 0;
              for (var j = 0; j < n; j++) {
                  cur += diff[j];
                  var x = (((s.charCodeAt(j) - 97 + cur) % 26) + 26) % 26;
                  out.push(String.fromCharCode(97 + x));
              }
              return out.join("");
          }
        `,
        java: code`
          public static String shiftingLetters(String s, int[][] shifts) {
              int n = s.length();
              int[] diff = new int[n + 1];
              for (int[] sh : shifts) {
                  int v = sh[2] == 1 ? 1 : -1;
                  diff[sh[0]] += v;
                  diff[sh[1] + 1] -= v;
              }
              char[] out = new char[n];
              int cur = 0;
              for (int i = 0; i < n; i++) {
                  cur += diff[i];
                  int x = (((s.charAt(i) - 'a' + cur) % 26) + 26) % 26;
                  out[i] = (char) ('a' + x);
              }
              return new String(out);
          }
        `,
        cpp: code`
          string shiftingLetters(string s, vector<vector<int>>& shifts) {
              int n = s.size();
              vector<int> diff(n + 1, 0);
              for (auto& sh : shifts) {
                  int v = sh[2] == 1 ? 1 : -1;
                  diff[sh[0]] += v;
                  diff[sh[1] + 1] -= v;
              }
              int cur = 0;
              for (int i = 0; i < n; i++) {
                  cur += diff[i];
                  int x = (((s[i] - 'a' + cur) % 26) + 26) % 26;
                  s[i] = (char)('a' + x);
              }
              return s;
          }
        `,
        c: code`
          char* shiftingLetters(const char* s, int** shifts, int shiftsSize, int* shiftsColSize) {
              int n = strlen(s);
              int* diff = (int*)calloc(n + 1, sizeof(int));
              for (int i = 0; i < shiftsSize; i++) {
                  int v = shifts[i][2] == 1 ? 1 : -1;
                  diff[shifts[i][0]] += v;
                  diff[shifts[i][1] + 1] -= v;
              }
              char* out = (char*)malloc(n + 1);
              int cur = 0;
              for (int i = 0; i < n; i++) {
                  cur += diff[i];
                  int x = (((s[i] - 'a' + cur) % 26) + 26) % 26;
                  out[i] = (char)('a' + x);
              }
              out[n] = '\0';
              free(diff);
              return out;
          }
        `,
        csharp: code`
          public static string ShiftingLetters(string s, int[][] shifts)
          {
              int n = s.Length;
              int[] diff = new int[n + 1];
              foreach (var sh in shifts)
              {
                  int v = sh[2] == 1 ? 1 : -1;
                  diff[sh[0]] += v;
                  diff[sh[1] + 1] -= v;
              }
              char[] output = new char[n];
              int cur = 0;
              for (int i = 0; i < n; i++)
              {
                  cur += diff[i];
                  int x = (((s[i] - 'a' + cur) % 26) + 26) % 26;
                  output[i] = (char)('a' + x);
              }
              return new string(output);
          }
        `,
        go: code`
          func shiftingLetters(s string, shifts [][]int) string {
          	n := len(s)
          	diff := make([]int, n+1)
          	for _, sh := range shifts {
          		v := -1
          		if sh[2] == 1 {
          			v = 1
          		}
          		diff[sh[0]] += v
          		diff[sh[1]+1] -= v
          	}
          	out := make([]byte, n)
          	cur := 0
          	for i := 0; i < n; i++ {
          		cur += diff[i]
          		x := ((int(s[i]-'a')+cur)%26 + 26) % 26
          		out[i] = byte('a' + x)
          	}
          	return string(out)
          }
        `,
        kotlin: code`
          fun shiftingLetters(s: String, shifts: Array<IntArray>): String {
              val n = s.length
              val diff = IntArray(n + 1)
              for (sh in shifts) {
                  val v = if (sh[2] == 1) 1 else -1
                  diff[sh[0]] += v
                  diff[sh[1] + 1] -= v
              }
              val out = CharArray(n)
              var cur = 0
              for (i in 0 until n) {
                  cur += diff[i]
                  val x = (((s[i] - 'a' + cur) % 26) + 26) % 26
                  out[i] = 'a' + x
              }
              return String(out)
          }
        `,
        swift: code`
          func shiftingLetters(_ s: String, _ shifts: [[Int]]) -> String {
              let c = Array(s.utf8)
              let n = c.count
              var diff = [Int](repeating: 0, count: n + 1)
              for sh in shifts {
                  let v = sh[2] == 1 ? 1 : -1
                  diff[sh[0]] += v
                  diff[sh[1] + 1] -= v
              }
              var out = [UInt8](repeating: 0, count: n)
              var cur = 0
              for i in 0..<n {
                  cur += diff[i]
                  let x = (((Int(c[i]) - 97 + cur) % 26) + 26) % 26
                  out[i] = UInt8(97 + x)
              }
              return String(decoding: out, as: UTF8.self)
          }
        `,
        rust: code`
          fn shiftingLetters(s: String, shifts: Vec<Vec<i32>>) -> String {
              let c = s.as_bytes();
              let n = c.len();
              let mut diff = vec![0i32; n + 1];
              for sh in shifts.iter() {
                  let v = if sh[2] == 1 { 1 } else { -1 };
                  diff[sh[0] as usize] += v;
                  diff[sh[1] as usize + 1] -= v;
              }
              let mut out: Vec<u8> = Vec::with_capacity(n);
              let mut cur = 0i32;
              for i in 0..n {
                  cur += diff[i];
                  let x = (((c[i] - b'a') as i32 + cur) % 26 + 26) % 26;
                  out.push(b'a' + x as u8);
              }
              String::from_utf8(out).unwrap()
          }
        `,
        php: code`
          function shiftingLetters($s, $shifts) {
              $n = strlen($s);
              $diff = array_fill(0, $n + 1, 0);
              foreach ($shifts as $sh) {
                  $v = $sh[2] == 1 ? 1 : -1;
                  $diff[$sh[0]] += $v;
                  $diff[$sh[1] + 1] -= $v;
              }
              $out = "";
              $cur = 0;
              for ($i = 0; $i < $n; $i++) {
                  $cur += $diff[$i];
                  $x = (((ord($s[$i]) - 97 + $cur) % 26) + 26) % 26;
                  $out .= chr(97 + $x);
              }
              return $out;
          }
        `,
        ruby: code`
          def shiftingLetters(s, shifts)
            n = s.length
            diff = Array.new(n + 1, 0)
            shifts.each do |a, b, d|
              v = d == 1 ? 1 : -1
              diff[a] += v
              diff[b + 1] -= v
            end
            cur = 0
            out = []
            n.times do |i|
              cur += diff[i]
              out << ((s.getbyte(i) - 97 + cur) % 26 + 97).chr
            end
            out.join
          end
        `,
      },
    };
  })(),

  // ── Largest Palindromic Number (LC 2384) ────────────────────────
  (() => {
    // Independent check: try every choice of digit pairs and centre digit,
    // arrange each choice in its best order, and keep the largest valid one.
    const ref = (num: string) => {
      const cnt = new Array<number>(10).fill(0);
      for (const ch of num) cnt[Number(ch)]++;
      let best = "";
      const bigger = (x: string, y: string) => (x.length !== y.length ? x.length > y.length : x > y);
      const pairs = new Array<number>(10).fill(0);
      const rec = (d: number) => {
        if (d === 10) {
          let left = "";
          for (let k = 9; k >= 0; k--) left += String(k).repeat(pairs[k]);
          const mids = [""];
          for (let k = 0; k <= 9; k++) if (cnt[k] - 2 * pairs[k] >= 1) mids.push(String(k));
          for (const m of mids) {
            const cand = left + m + left.split("").reverse().join("");
            if (cand === "" || (cand.length > 1 && cand[0] === "0")) continue;
            if (best === "" || bigger(cand, best)) best = cand;
          }
          return;
        }
        for (let p = 0; p * 2 <= cnt[d]; p++) { pairs[d] = p; rec(d + 1); }
        pairs[d] = 0;
      };
      rec(0);
      return best;
    };
    return {
      slug: "largest-palindromic-number",
      title: "Largest Palindromic Number",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Greedy", "Counting", "Amazon", "Google"],
      signature: { funcName: "largestPalindromic", params: [{ name: "num", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `num` of digits. Choose some of its digits — **at least one** — and rearrange them in any order to form a **palindromic** integer (it reads the same forwards and backwards).\n\nThe result must not have **leading zeros**, so `\"0\"` is allowed but `\"00\"` and `\"0110\"` are not. Each character of `num` may be used at most once.\n\nReturn the **largest** palindromic integer you can form, as a string.",
        [
          { in: "num = \"2026\"", out: "262", note: "The pair of `2`s goes on the outside and `6` beats `0` for the middle." },
          { in: "num = \"9911000\"", out: "9100019" },
          { in: "num = \"00009\"", out: "9", note: "`\"90009\"` is impossible with one `9`, and `\"00900\"` has leading zeros." },
        ],
        ["1 <= num.length <= 10^5", "num consists of digits"]),
      hints: [
        "A palindrome is a sequence of mirrored pairs plus at most one unpaired middle digit.",
        "Longer is larger. Use as many pairs as you can, biggest digits on the outside.",
        "Watch out for zeros: if the only pairs available are `0` pairs, they would lead the number — drop them. Then put the largest leftover digit in the middle; if nothing at all is left, the answer is `\"0\"`.",
      ],
      editorial: explain({
        idea: "Count the digits. The left half takes `cnt[d] / 2` copies of each digit from 9 down to 0, the middle takes the largest digit with a copy left over — unless the half would start with `0`, in which case the half is dropped entirely.",
        steps: [
          "Count each digit of `num`.",
          "Build `left` by appending digit `d` exactly `cnt[d] / 2` times for `d` from 9 down to 0.",
          "If `left` starts with `0`, it is made of zeros only; set it to the empty string.",
          "Let `mid` be the largest digit whose count is odd (empty if none).",
          "If both `left` and `mid` are empty, return `\"0\"`; otherwise return `left + mid + reverse(left)`.",
        ],
        why: "A longer number without leading zeros is always larger, so we want as many digits as possible: every available pair, plus a centre if any digit has a copy left. Among palindromes of the same length the largest puts the largest digits outermost, which is the descending left half. The only conflict is with leading zeros: if the outermost pair would be `0`, every pair is a `0` pair, and none of them can be used. After dropping them, every non-zero digit present appears exactly once, so the best we can do is the largest single digit, or `\"0\"` when only zeros were given.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "Dropping the zero pairs only applies when the half starts with `0`; zeros inside a half that starts with a non-zero digit are fine (`9100019`).",
          "`num = \"00\"` must return `\"0\"`, not an empty string.",
          "The middle digit is the largest one with an odd count, which may be `0`.",
        ],
      }),
      examples: [
        { input: "\"2026\"", expectedOutput: "262" },
        { input: "\"9911000\"", expectedOutput: "9100019" },
        { input: "\"00009\"", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const digits = pick(rng, ["0123456789", "0123456789", "0", "01", "00009", "123", "0099", "56789", "0001"]);
        const num = randLower(rng, 1, rng() < 0.15 ? 18 : 10, digits);
        return { input: `"${num}"`, expectedOutput: ref(num) };
      },
      solutions: {
        python: code`
          def largestPalindromic(num: str) -> str:
              cnt = [0] * 10
              for ch in num:
                  cnt[ord(ch) - 48] += 1
              left = "".join(str(d) * (cnt[d] // 2) for d in range(9, -1, -1))
              if left.startswith("0"):
                  left = ""
              mid = ""
              for d in range(9, -1, -1):
                  if cnt[d] % 2 == 1:
                      mid = str(d)
                      break
              if left == "" and mid == "":
                  return "0"
              return left + mid + left[::-1]
        `,
        javascript: code`
          var largestPalindromic = function(num) {
              var cnt = new Array(10).fill(0);
              for (var i = 0; i < num.length; i++) cnt[num.charCodeAt(i) - 48]++;
              var left = "";
              for (var d = 9; d >= 0; d--) for (var k = 0; k < Math.floor(cnt[d] / 2); k++) left += String(d);
              if (left.length > 0 && left[0] === "0") left = "";
              var mid = "";
              for (var e = 9; e >= 0; e--) if (cnt[e] % 2 === 1) { mid = String(e); break; }
              if (left === "" && mid === "") return "0";
              return left + mid + left.split("").reverse().join("");
          };
        `,
        typescript: code`
          function largestPalindromic(num: string): string {
              var cnt: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              for (var i = 0; i < num.length; i++) cnt[num.charCodeAt(i) - 48]++;
              var parts: string[] = [];
              for (var d = 9; d >= 0; d--) for (var k = 0; k < Math.floor(cnt[d] / 2); k++) parts.push(String(d));
              if (parts.length > 0 && parts[0] === "0") parts = [];
              var mid = "";
              for (var e = 9; e >= 0; e--) if (cnt[e] % 2 === 1) { mid = String(e); break; }
              if (parts.length === 0 && mid === "") return "0";
              var left = parts.join("");
              return left + mid + parts.reverse().join("");
          }
        `,
        java: code`
          public static String largestPalindromic(String num) {
              int[] cnt = new int[10];
              for (int i = 0; i < num.length(); i++) cnt[num.charAt(i) - '0']++;
              StringBuilder left = new StringBuilder();
              for (int d = 9; d >= 0; d--) for (int k = 0; k < cnt[d] / 2; k++) left.append((char) ('0' + d));
              if (left.length() > 0 && left.charAt(0) == '0') left.setLength(0);
              String mid = "";
              for (int d = 9; d >= 0; d--) if (cnt[d] % 2 == 1) { mid = String.valueOf((char) ('0' + d)); break; }
              if (left.length() == 0 && mid.isEmpty()) return "0";
              String l = left.toString();
              return l + mid + left.reverse().toString();
          }
        `,
        cpp: code`
          string largestPalindromic(string num) {
              int cnt[10] = {0};
              for (char ch : num) cnt[ch - '0']++;
              string left;
              for (int d = 9; d >= 0; d--) left += string(cnt[d] / 2, (char)('0' + d));
              if (!left.empty() && left[0] == '0') left = "";
              string mid;
              for (int d = 9; d >= 0; d--) if (cnt[d] % 2 == 1) { mid = string(1, (char)('0' + d)); break; }
              if (left.empty() && mid.empty()) return "0";
              string right(left.rbegin(), left.rend());
              return left + mid + right;
          }
        `,
        c: code`
          char* largestPalindromic(const char* num) {
              int n = strlen(num);
              int cnt[10] = {0};
              for (int i = 0; i < n; i++) cnt[num[i] - '0']++;
              char* out = (char*)malloc(n + 2);
              int k = 0;
              for (int d = 9; d >= 0; d--) for (int j = 0; j < cnt[d] / 2; j++) out[k++] = (char)('0' + d);
              if (k > 0 && out[0] == '0') k = 0;
              int half = k;
              for (int d = 9; d >= 0; d--) if (cnt[d] % 2 == 1) { out[k++] = (char)('0' + d); break; }
              if (k == 0) {
                  out[0] = '0';
                  out[1] = '\0';
                  return out;
              }
              for (int j = half - 1; j >= 0; j--) out[k++] = out[j];
              out[k] = '\0';
              return out;
          }
        `,
        csharp: code`
          public static string LargestPalindromic(string num)
          {
              int[] cnt = new int[10];
              foreach (char ch in num) cnt[ch - '0']++;
              var left = new System.Text.StringBuilder();
              for (int d = 9; d >= 0; d--) left.Append((char)('0' + d), cnt[d] / 2);
              if (left.Length > 0 && left[0] == '0') left.Clear();
              string mid = "";
              for (int d = 9; d >= 0; d--) if (cnt[d] % 2 == 1) { mid = ((char)('0' + d)).ToString(); break; }
              if (left.Length == 0 && mid.Length == 0) return "0";
              string l = left.ToString();
              char[] r = l.ToCharArray();
              Array.Reverse(r);
              return l + mid + new string(r);
          }
        `,
        go: code`
          func largestPalindromic(num string) string {
          	var cnt [10]int
          	for i := 0; i < len(num); i++ {
          		cnt[num[i]-'0']++
          	}
          	left := make([]byte, 0, len(num))
          	for d := 9; d >= 0; d-- {
          		for k := 0; k < cnt[d]/2; k++ {
          			left = append(left, byte('0'+d))
          		}
          	}
          	if len(left) > 0 && left[0] == '0' {
          		left = left[:0]
          	}
          	out := make([]byte, 0, len(num)+1)
          	out = append(out, left...)
          	for d := 9; d >= 0; d-- {
          		if cnt[d]%2 == 1 {
          			out = append(out, byte('0'+d))
          			break
          		}
          	}
          	if len(out) == 0 {
          		return "0"
          	}
          	for j := len(left) - 1; j >= 0; j-- {
          		out = append(out, left[j])
          	}
          	return string(out)
          }
        `,
        kotlin: code`
          fun largestPalindromic(num: String): String {
              val cnt = IntArray(10)
              for (ch in num) cnt[ch - '0']++
              val left = StringBuilder()
              for (d in 9 downTo 0) for (k in 0 until cnt[d] / 2) left.append('0' + d)
              if (left.isNotEmpty() && left[0] == '0') left.setLength(0)
              var mid = ""
              for (d in 9 downTo 0) if (cnt[d] % 2 == 1) { mid = ('0' + d).toString(); break }
              if (left.isEmpty() && mid.isEmpty()) return "0"
              val l = left.toString()
              return l + mid + l.reversed()
          }
        `,
        swift: code`
          func largestPalindromic(_ num: String) -> String {
              var cnt = [Int](repeating: 0, count: 10)
              for ch in num.utf8 { cnt[Int(ch) - 48] += 1 }
              var left = [UInt8]()
              for d in stride(from: 9, through: 0, by: -1) {
                  for _ in 0..<(cnt[d] / 2) { left.append(UInt8(48 + d)) }
              }
              if let first = left.first, first == 48 { left = [] }
              var out = left
              for d in stride(from: 9, through: 0, by: -1) where cnt[d] % 2 == 1 {
                  out.append(UInt8(48 + d))
                  break
              }
              if out.isEmpty { return "0" }
              out.append(contentsOf: left.reversed())
              return String(decoding: out, as: UTF8.self)
          }
        `,
        rust: code`
          fn largestPalindromic(num: String) -> String {
              let mut cnt = [0usize; 10];
              for &ch in num.as_bytes() {
                  cnt[(ch - b'0') as usize] += 1;
              }
              let mut left: Vec<u8> = Vec::new();
              for d in (0..10).rev() {
                  for _ in 0..cnt[d] / 2 {
                      left.push(b'0' + d as u8);
                  }
              }
              if !left.is_empty() && left[0] == b'0' {
                  left.clear();
              }
              let mut out = left.clone();
              for d in (0..10).rev() {
                  if cnt[d] % 2 == 1 {
                      out.push(b'0' + d as u8);
                      break;
                  }
              }
              if out.is_empty() {
                  return "0".to_string();
              }
              for &ch in left.iter().rev() {
                  out.push(ch);
              }
              String::from_utf8(out).unwrap()
          }
        `,
        php: code`
          function largestPalindromic($num) {
              $cnt = array_fill(0, 10, 0);
              $n = strlen($num);
              for ($i = 0; $i < $n; $i++) $cnt[ord($num[$i]) - 48]++;
              $left = "";
              for ($d = 9; $d >= 0; $d--) $left .= str_repeat((string)$d, intdiv($cnt[$d], 2));
              if ($left !== "" && $left[0] === "0") $left = "";
              $mid = "";
              for ($d = 9; $d >= 0; $d--) {
                  if ($cnt[$d] % 2 == 1) { $mid = (string)$d; break; }
              }
              if ($left === "" && $mid === "") return "0";
              return $left . $mid . strrev($left);
          }
        `,
        ruby: code`
          def largestPalindromic(num)
            cnt = Array.new(10, 0)
            num.each_byte { |b| cnt[b - 48] += 1 }
            left = 9.downto(0).map { |d| d.to_s * (cnt[d] / 2) }.join
            left = "" if left.start_with?("0")
            mid = ""
            9.downto(0) do |d|
              if cnt[d].odd?
                mid = d.to_s
                break
              end
            end
            return "0" if left.empty? && mid.empty?
            left + mid + left.reverse
          end
        `,
      },
    };
  })(),

  // ── Minimum Amount of Time to Collect Garbage (LC 2391) ─────────
  (() => {
    // Independent check: drive each truck separately to the last house that
    // holds its kind of garbage.
    const ref = (garbage: string[], travel: number[]) => {
      let total = 0;
      for (const kind of ["M", "P", "G"]) {
        let last = -1;
        for (let i = 0; i < garbage.length; i++) if (garbage[i].indexOf(kind) >= 0) last = i;
        for (let i = 0; i <= last; i++) {
          if (i > 0) total += travel[i - 1];
          for (const ch of garbage[i]) if (ch === kind) total++;
        }
      }
      return total;
    };
    return {
      slug: "minimum-amount-of-time-to-collect-garbage",
      title: "Minimum Amount of Time to Collect Garbage",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Prefix Sum", "Amazon", "Google"],
      signature: {
        funcName: "garbageCollection",
        params: [{ name: "garbage", type: "string[]" as const }, { name: "travel", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Houses along a street are numbered from 0. `garbage[i]` lists the garbage bags at house `i`: each character is `'M'` (metal), `'P'` (paper) or `'G'` (glass), and picking up one bag takes **1 minute**. Driving from house `i - 1` to house `i` takes `travel[i - 1]` minutes.\n\nThere are three trucks, one per kind of garbage, and each truck may only pick up its own kind. Every truck starts at house 0 and drives the houses **in order**, but it does not have to visit houses beyond the last one that holds its kind. Only one truck is active at any moment — while one drives or collects, the other two wait.\n\nReturn the minimum total number of minutes needed to collect all the garbage.",
        [
          { in: "garbage = [\"MG\",\"P\",\"GP\",\"M\"], travel = [3,1,2]", out: "20", note: "Collecting the 6 bags takes 6 minutes. The metal truck drives to house 3 (3 + 1 + 2 = 6 minutes); the paper and glass trucks stop at house 2 (4 minutes each). 6 + 6 + 4 + 4 = 20." },
          { in: "garbage = [\"G\",\"G\",\"G\"], travel = [5,5]", out: "13", note: "Only the glass truck moves: 3 minutes of collecting plus 10 of driving." },
        ],
        ["2 <= garbage.length <= 10^5", "garbage[i] consists of only the letters 'M', 'P' and 'G'", "1 <= garbage[i].length <= 10", "travel.length == garbage.length - 1", "1 <= travel[i] <= 100"]),
      hints: [
        "The collecting time does not depend on the trucks at all: it is the total number of bags.",
        "Each truck's driving time is the travel time from house 0 to the last house containing its kind.",
        "Record the last index of each kind and use prefix sums of `travel`.",
      ],
      editorial: explain({
        idea: "Split the total into collecting time (one minute per bag, whatever the trucks do) and driving time (each truck goes exactly as far as the last house holding its kind).",
        steps: [
          "Add up the lengths of all `garbage[i]` — the collecting time.",
          "For each kind `M`, `P`, `G`, find the last house index that contains it (0 if none).",
          "Build prefix sums of `travel` so `prefix[i]` is the time to drive from house 0 to house `i`.",
          "Return the collecting time plus `prefix[last[M]] + prefix[last[P]] + prefix[last[G]]`.",
        ],
        why: "Every bag must be picked up by its own truck, costing one minute each, so the collecting time is fixed. A truck must reach the last house with its kind, and since it drives the houses in order it passes every house before it; it never needs to go further. Trucks never wait for each other in a way that costs extra, because the total is just the sum of each truck's own driving and collecting.",
        time: "O(total characters + n)",
        space: "O(n) for the prefix sums (O(1) if you accumulate on the fly)",
        pitfalls: [
          "A kind that never appears costs nothing: its truck stays at house 0.",
          "`travel[i - 1]` is the time to reach house `i`, so the prefix is shifted by one.",
          "A house may hold several bags of the same kind; each costs a minute.",
        ],
      }),
      examples: [
        { input: "[\"MG\",\"P\",\"GP\",\"M\"]\n[3,1,2]", expectedOutput: "20" },
        { input: "[\"G\",\"G\",\"G\"]\n[5,5]", expectedOutput: "13" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, rng() < 0.2 ? 60 : 12);
        const kinds = pick(rng, ["MPG", "MPG", "G", "MP", "PG"]);
        const garbage = Array.from({ length: n }, () => randLower(rng, 1, pick(rng, [2, 4, 10]), kinds));
        const travel = Array.from({ length: n - 1 }, () => ri(rng, 1, pick(rng, [3, 20, 100])));
        return { input: `${fmtStrArr(garbage)}\n${fmtIntArr(travel)}`, expectedOutput: String(ref(garbage, travel)) };
      },
      solutions: {
        python: code`
          from typing import List

          def garbageCollection(garbage: List[str], travel: List[int]) -> int:
              total = 0
              last = {"M": 0, "P": 0, "G": 0}
              for i, g in enumerate(garbage):
                  total += len(g)
                  for ch in g:
                      last[ch] = i
              prefix = [0]
              for t in travel:
                  prefix.append(prefix[-1] + t)
              return total + sum(prefix[last[k]] for k in "MPG")
        `,
        javascript: code`
          var garbageCollection = function(garbage, travel) {
              var total = 0, lastM = 0, lastP = 0, lastG = 0;
              for (var i = 0; i < garbage.length; i++) {
                  var g = garbage[i];
                  total += g.length;
                  if (g.indexOf("M") >= 0) lastM = i;
                  if (g.indexOf("P") >= 0) lastP = i;
                  if (g.indexOf("G") >= 0) lastG = i;
              }
              var prefix = [0];
              for (var j = 0; j < travel.length; j++) prefix.push(prefix[j] + travel[j]);
              return total + prefix[lastM] + prefix[lastP] + prefix[lastG];
          };
        `,
        typescript: code`
          function garbageCollection(garbage: string[], travel: number[]): number {
              var total = 0, lastM = 0, lastP = 0, lastG = 0;
              for (var i = 0; i < garbage.length; i++) {
                  var g = garbage[i];
                  total += g.length;
                  if (g.indexOf("M") >= 0) lastM = i;
                  if (g.indexOf("P") >= 0) lastP = i;
                  if (g.indexOf("G") >= 0) lastG = i;
              }
              var prefix: number[] = [0];
              for (var j = 0; j < travel.length; j++) prefix.push(prefix[j] + travel[j]);
              return total + prefix[lastM] + prefix[lastP] + prefix[lastG];
          }
        `,
        java: code`
          public static int garbageCollection(String[] garbage, int[] travel) {
              int total = 0, lastM = 0, lastP = 0, lastG = 0;
              for (int i = 0; i < garbage.length; i++) {
                  String g = garbage[i];
                  total += g.length();
                  if (g.indexOf('M') >= 0) lastM = i;
                  if (g.indexOf('P') >= 0) lastP = i;
                  if (g.indexOf('G') >= 0) lastG = i;
              }
              int[] prefix = new int[garbage.length];
              for (int j = 1; j < garbage.length; j++) prefix[j] = prefix[j - 1] + travel[j - 1];
              return total + prefix[lastM] + prefix[lastP] + prefix[lastG];
          }
        `,
        cpp: code`
          int garbageCollection(vector<string>& garbage, vector<int>& travel) {
              int n = garbage.size();
              int total = 0, lastM = 0, lastP = 0, lastG = 0;
              for (int i = 0; i < n; i++) {
                  const string& g = garbage[i];
                  total += g.size();
                  if (g.find('M') != string::npos) lastM = i;
                  if (g.find('P') != string::npos) lastP = i;
                  if (g.find('G') != string::npos) lastG = i;
              }
              vector<int> prefix(n, 0);
              for (int j = 1; j < n; j++) prefix[j] = prefix[j - 1] + travel[j - 1];
              return total + prefix[lastM] + prefix[lastP] + prefix[lastG];
          }
        `,
        c: code`
          int garbageCollection(char** garbage, int garbageSize, int* travel, int travelSize) {
              int total = 0, lastM = 0, lastP = 0, lastG = 0;
              for (int i = 0; i < garbageSize; i++) {
                  for (int k = 0; garbage[i][k]; k++) {
                      total++;
                      char c = garbage[i][k];
                      if (c == 'M') lastM = i;
                      else if (c == 'P') lastP = i;
                      else lastG = i;
                  }
              }
              int* prefix = (int*)malloc(garbageSize * sizeof(int));
              prefix[0] = 0;
              for (int j = 1; j < garbageSize; j++) prefix[j] = prefix[j - 1] + travel[j - 1];
              int ans = total + prefix[lastM] + prefix[lastP] + prefix[lastG];
              free(prefix);
              return ans;
          }
        `,
        csharp: code`
          public static int GarbageCollection(string[] garbage, int[] travel)
          {
              int n = garbage.Length;
              int total = 0, lastM = 0, lastP = 0, lastG = 0;
              for (int i = 0; i < n; i++)
              {
                  string g = garbage[i];
                  total += g.Length;
                  if (g.IndexOf('M') >= 0) lastM = i;
                  if (g.IndexOf('P') >= 0) lastP = i;
                  if (g.IndexOf('G') >= 0) lastG = i;
              }
              int[] prefix = new int[n];
              for (int j = 1; j < n; j++) prefix[j] = prefix[j - 1] + travel[j - 1];
              return total + prefix[lastM] + prefix[lastP] + prefix[lastG];
          }
        `,
        go: code`
          func garbageCollection(garbage []string, travel []int) int {
          	n := len(garbage)
          	total, lastM, lastP, lastG := 0, 0, 0, 0
          	for i, g := range garbage {
          		total += len(g)
          		if strings.IndexByte(g, 'M') >= 0 {
          			lastM = i
          		}
          		if strings.IndexByte(g, 'P') >= 0 {
          			lastP = i
          		}
          		if strings.IndexByte(g, 'G') >= 0 {
          			lastG = i
          		}
          	}
          	prefix := make([]int, n)
          	for j := 1; j < n; j++ {
          		prefix[j] = prefix[j-1] + travel[j-1]
          	}
          	return total + prefix[lastM] + prefix[lastP] + prefix[lastG]
          }
        `,
        kotlin: code`
          fun garbageCollection(garbage: Array<String>, travel: IntArray): Int {
              val n = garbage.size
              var total = 0
              var lastM = 0
              var lastP = 0
              var lastG = 0
              for (i in 0 until n) {
                  val g = garbage[i]
                  total += g.length
                  if (g.indexOf('M') >= 0) lastM = i
                  if (g.indexOf('P') >= 0) lastP = i
                  if (g.indexOf('G') >= 0) lastG = i
              }
              val prefix = IntArray(n)
              for (j in 1 until n) prefix[j] = prefix[j - 1] + travel[j - 1]
              return total + prefix[lastM] + prefix[lastP] + prefix[lastG]
          }
        `,
        swift: code`
          func garbageCollection(_ garbage: [String], _ travel: [Int]) -> Int {
              let n = garbage.count
              var total = 0, lastM = 0, lastP = 0, lastG = 0
              for i in 0..<n {
                  for ch in garbage[i].utf8 {
                      total += 1
                      if ch == 77 { lastM = i } else if ch == 80 { lastP = i } else { lastG = i }
                  }
              }
              var prefix = [Int](repeating: 0, count: n)
              for j in 1..<n { prefix[j] = prefix[j - 1] + travel[j - 1] }
              return total + prefix[lastM] + prefix[lastP] + prefix[lastG]
          }
        `,
        rust: code`
          fn garbageCollection(garbage: Vec<String>, travel: Vec<i32>) -> i32 {
              let n = garbage.len();
              let mut total = 0i32;
              let (mut last_m, mut last_p, mut last_g) = (0usize, 0usize, 0usize);
              for (i, g) in garbage.iter().enumerate() {
                  for &ch in g.as_bytes() {
                      total += 1;
                      if ch == b'M' {
                          last_m = i;
                      } else if ch == b'P' {
                          last_p = i;
                      } else {
                          last_g = i;
                      }
                  }
              }
              let mut prefix = vec![0i32; n];
              for j in 1..n {
                  prefix[j] = prefix[j - 1] + travel[j - 1];
              }
              total + prefix[last_m] + prefix[last_p] + prefix[last_g]
          }
        `,
        php: code`
          function garbageCollection($garbage, $travel) {
              $n = count($garbage);
              $total = 0;
              $lastM = 0;
              $lastP = 0;
              $lastG = 0;
              for ($i = 0; $i < $n; $i++) {
                  $g = $garbage[$i];
                  $total += strlen($g);
                  if (strpos($g, "M") !== false) $lastM = $i;
                  if (strpos($g, "P") !== false) $lastP = $i;
                  if (strpos($g, "G") !== false) $lastG = $i;
              }
              $prefix = array_fill(0, $n, 0);
              for ($j = 1; $j < $n; $j++) $prefix[$j] = $prefix[$j - 1] + $travel[$j - 1];
              return $total + $prefix[$lastM] + $prefix[$lastP] + $prefix[$lastG];
          }
        `,
        ruby: code`
          def garbageCollection(garbage, travel)
            total = 0
            last = { "M" => 0, "P" => 0, "G" => 0 }
            garbage.each_with_index do |g, i|
              total += g.length
              g.each_char { |ch| last[ch] = i }
            end
            prefix = [0]
            travel.each { |t| prefix << prefix[-1] + t }
            total + prefix[last["M"]] + prefix[last["P"]] + prefix[last["G"]]
          end
        `,
      },
    };
  })(),

  // ── Length of the Longest Alphabetical Continuous Substring (LC 2414) ──
  (() => {
    // Independent check: test every substring.
    const ref = (s: string) => {
      let best = 0;
      for (let i = 0; i < s.length; i++) {
        for (let j = i; j < s.length; j++) {
          let ok = true;
          for (let k = i + 1; k <= j; k++) if (s.charCodeAt(k) !== s.charCodeAt(k - 1) + 1) { ok = false; break; }
          if (ok) best = Math.max(best, j - i + 1);
        }
      }
      return best;
    };
    return {
      slug: "length-of-the-longest-alphabetical-continuous-substring",
      title: "Length of the Longest Alphabetical Continuous Substring",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window", "Amazon", "Google"],
      signature: { funcName: "longestContinuousSubstring", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "An **alphabetical continuous** string is one whose letters are consecutive letters of the alphabet, in order — any substring of `\"abcdefghijklmnopqrstuvwxyz\"`. For example `\"cde\"` qualifies, while `\"ace\"` and `\"za\"` do not (the alphabet does not wrap around).\n\nGiven a lowercase string `s`, return the length of its longest alphabetical continuous substring.",
        [
          { in: "s = \"xyzabcd\"", out: "4", note: "`\"abcd\"`. `\"xyz\"` has length 3, and `\"za\"` does not continue it." },
          { in: "s = \"kairo\"", out: "1" },
          { in: "s = \"abcde\"", out: "5" },
        ],
        ["1 <= s.length <= 10^5", "s consists of only lowercase English letters"]),
      hints: [
        "A substring qualifies exactly when every letter is one more than the letter before it.",
        "So the qualifying substrings are pieces of maximal runs where `s[i] == s[i-1] + 1`.",
        "Scan once, extending the current run when the condition holds and restarting at 1 otherwise; track the longest run.",
      ],
      editorial: explain({
        idea: "The answer is the longest run of positions where each letter is exactly one more than the previous one; a single left-to-right scan measures every run.",
        steps: [
          "Set `cur = 1` and `best = 1`.",
          "For `i` from 1 to `n - 1`: if `s[i]` is the letter right after `s[i-1]`, increase `cur`; otherwise reset `cur = 1`.",
          "After each step update `best = max(best, cur)`.",
        ],
        why: "Every alphabetical continuous substring lies inside a maximal run of the \"next letter\" relation, and every run is itself such a substring, so the longest one is the longest run. The scan visits each run once and `cur` is that run's length so far.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`'z'` followed by `'a'` breaks a run — there is no wrap-around.",
          "A run can be at most 26 letters long, but the scan does not need to rely on that.",
          "A single character always counts, so the answer is at least 1.",
        ],
      }),
      examples: [
        { input: "\"xyzabcd\"", expectedOutput: "4" },
        { input: "\"kairo\"", expectedOutput: "1" },
        { input: "\"abcde\"", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const target = ri(rng, 1, rng() < 0.2 ? 60 : 20);
        let s = "";
        while (s.length < target) {
          if (rng() < 0.4) { s += LOWER[ri(rng, 0, 25)]; continue; }
          const start = ri(rng, 0, 25);
          const len = ri(rng, 1, Math.min(26 - start, 8));
          s += LOWER.slice(start, start + len);
        }
        s = s.slice(0, target);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def longestContinuousSubstring(s: str) -> int:
              best = cur = 1
              for i in range(1, len(s)):
                  if ord(s[i]) == ord(s[i - 1]) + 1:
                      cur += 1
                  else:
                      cur = 1
                  best = max(best, cur)
              return best
        `,
        javascript: code`
          var longestContinuousSubstring = function(s) {
              var best = 1, cur = 1;
              for (var i = 1; i < s.length; i++) {
                  cur = s.charCodeAt(i) === s.charCodeAt(i - 1) + 1 ? cur + 1 : 1;
                  if (cur > best) best = cur;
              }
              return best;
          };
        `,
        typescript: code`
          function longestContinuousSubstring(s: string): number {
              var best = 1, cur = 1;
              for (var i = 1; i < s.length; i++) {
                  cur = s.charCodeAt(i) === s.charCodeAt(i - 1) + 1 ? cur + 1 : 1;
                  if (cur > best) best = cur;
              }
              return best;
          }
        `,
        java: code`
          public static int longestContinuousSubstring(String s) {
              int best = 1, cur = 1;
              for (int i = 1; i < s.length(); i++) {
                  cur = s.charAt(i) == s.charAt(i - 1) + 1 ? cur + 1 : 1;
                  best = Math.max(best, cur);
              }
              return best;
          }
        `,
        cpp: code`
          int longestContinuousSubstring(string s) {
              int best = 1, cur = 1;
              for (size_t i = 1; i < s.size(); i++) {
                  cur = s[i] == s[i - 1] + 1 ? cur + 1 : 1;
                  best = max(best, cur);
              }
              return best;
          }
        `,
        c: code`
          int longestContinuousSubstring(const char* s) {
              int best = 1, cur = 1;
              for (int i = 1; s[i]; i++) {
                  cur = s[i] == s[i - 1] + 1 ? cur + 1 : 1;
                  if (cur > best) best = cur;
              }
              return best;
          }
        `,
        csharp: code`
          public static int LongestContinuousSubstring(string s)
          {
              int best = 1, cur = 1;
              for (int i = 1; i < s.Length; i++)
              {
                  cur = s[i] == s[i - 1] + 1 ? cur + 1 : 1;
                  best = Math.Max(best, cur);
              }
              return best;
          }
        `,
        go: code`
          func longestContinuousSubstring(s string) int {
          	best, cur := 1, 1
          	for i := 1; i < len(s); i++ {
          		if s[i] == s[i-1]+1 {
          			cur++
          		} else {
          			cur = 1
          		}
          		if cur > best {
          			best = cur
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun longestContinuousSubstring(s: String): Int {
              var best = 1
              var cur = 1
              for (i in 1 until s.length) {
                  cur = if (s[i] == s[i - 1] + 1) cur + 1 else 1
                  best = maxOf(best, cur)
              }
              return best
          }
        `,
        swift: code`
          func longestContinuousSubstring(_ s: String) -> Int {
              let c = Array(s.utf8)
              var best = 1, cur = 1
              var i = 1
              while i < c.count {
                  cur = Int(c[i]) == Int(c[i - 1]) + 1 ? cur + 1 : 1
                  best = max(best, cur)
                  i += 1
              }
              return best
          }
        `,
        rust: code`
          fn longestContinuousSubstring(s: String) -> i32 {
              let c = s.as_bytes();
              let (mut best, mut cur) = (1, 1);
              for i in 1..c.len() {
                  cur = if c[i] == c[i - 1] + 1 { cur + 1 } else { 1 };
                  if cur > best {
                      best = cur;
                  }
              }
              best
          }
        `,
        php: code`
          function longestContinuousSubstring($s) {
              $best = 1;
              $cur = 1;
              $n = strlen($s);
              for ($i = 1; $i < $n; $i++) {
                  $cur = ord($s[$i]) == ord($s[$i - 1]) + 1 ? $cur + 1 : 1;
                  if ($cur > $best) $best = $cur;
              }
              return $best;
          }
        `,
        ruby: code`
          def longestContinuousSubstring(s)
            best = 1
            cur = 1
            (1...s.length).each do |i|
              cur = s.getbyte(i) == s.getbyte(i - 1) + 1 ? cur + 1 : 1
              best = cur if cur > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Using a Robot to Print the Lexicographically Smallest String (LC 2434) ──
  (() => {
    // Independent check: exhaustive memoised search over (consumed prefix,
    // stack) for short strings — every completion of a state has the same
    // length, so plain string comparison is right; a quadratic greedy that
    // rescans the remaining suffix for longer ones.
    const ref = (s: string) => {
      const n = s.length;
      if (n <= 8) {
        const memo = new Map<string, string>();
        const best = (i: number, st: string): string => {
          if (i === n && st === "") return "";
          const key = i + "|" + st;
          const hit = memo.get(key);
          if (hit !== undefined) return hit;
          let res: string | null = null;
          if (i < n) res = best(i + 1, st + s[i]);
          if (st !== "") {
            const alt = st[st.length - 1] + best(i, st.slice(0, -1));
            if (res === null || alt < res) res = alt;
          }
          memo.set(key, res as string);
          return res as string;
        };
        return best(0, "");
      }
      const st: string[] = [];
      let out = "";
      for (let i = 0; i < n; i++) {
        st.push(s[i]);
        let mn = "{";
        for (let j = i + 1; j < n; j++) if (s[j] < mn) mn = s[j];
        while (st.length && st[st.length - 1] <= mn) out += st.pop();
      }
      return out;
    };
    return {
      slug: "using-a-robot-to-print-the-lexicographically-smallest-string",
      title: "Using a Robot to Print the Lexicographically Smallest String",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Stack", "Greedy", "Amazon", "Google"],
      signature: { funcName: "robotWithString", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A robot holds a string `t` that starts empty, and you are given a string `s`. Until both `s` and `t` are empty, repeatedly perform one of these operations:\n\n- Remove the **first** character of `s` and append it to the end of `t`.\n- Remove the **last** character of `t` and write it on paper.\n\n(`t` behaves like a stack.) Return the lexicographically **smallest** string that can end up written on the paper.",
        [
          { in: "s = \"kairo\"", out: "aikor", note: "Push `k` and `a`, write `a`; push `i`, write `i` and `k`; push `r` and `o`, write `o` and `r`." },
          { in: "s = \"zza\"", out: "azz", note: "Push everything, then write `a`, `z`, `z`." },
          { in: "s = \"cbca\"", out: "acbc" },
        ],
        ["1 <= s.length <= 10^5", "s consists of only lowercase English letters"]),
      hints: [
        "The paper should receive the smallest letter available as early as possible.",
        "Writing the top of `t` is a good idea when nothing still waiting in `s` is smaller than it — otherwise you would rather fetch that smaller letter first.",
        "Keep counts of the letters remaining in `s` and the smallest of them. After each push, pop while the top of `t` is at most that smallest remaining letter.",
      ],
      editorial: explain({
        idea: "Greedy with a stack: after pushing each character, write the top of the stack while it is no larger than the smallest letter still unread in `s`.",
        steps: [
          "Count the letters of `s`; `low` is the smallest letter with a non-zero count.",
          "For each character of `s`: push it, decrease its count, and advance `low` past letters whose count dropped to zero.",
          "While the stack is non-empty and its top is `<= low`, pop it onto the answer. (Once `s` is exhausted, `low` moves past `z` and everything is popped.)",
        ],
        why: "At any moment the next letter written is either the stack's top or some letter still in `s` (which can only be written after pushing everything in front of it). If the top is no larger than every remaining letter of `s`, writing it now cannot hurt: any smaller-or-equal letter we might reach later is no better, and delaying it only buries it. If some remaining letter is strictly smaller than the top, writing the top now would put a larger letter where a smaller one could go, so we must keep reading. Ties favour writing, since an equal letter later gains nothing and the written prefix is the same.",
        time: "O(n + 26)",
        space: "O(n) for the stack",
        pitfalls: [
          "Compare with the smallest letter still in `s` (strictly after the current position), not including letters already pushed.",
          "Pop on equality (`<=`), otherwise `\"zza\"`-style inputs keep equal letters buried behind larger ones.",
          "Recomputing the suffix minimum by scanning is O(n²); keep counts or a suffix-minimum array.",
        ],
      }),
      examples: [
        { input: "\"kairo\"", expectedOutput: "aikor" },
        { input: "\"zza\"", expectedOutput: "azz" },
        { input: "\"cbca\"", expectedOutput: "acbc" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcd", "xyz", "az", LOWER]);
        const s = randLower(rng, 1, rng() < 0.6 ? 8 : rng() < 0.7 ? 20 : 60, alpha);
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: code`
          def robotWithString(s: str) -> str:
              cnt = [0] * 26
              for ch in s:
                  cnt[ord(ch) - 97] += 1
              low = 0
              stack = []
              out = []
              for ch in s:
                  c = ord(ch) - 97
                  stack.append(c)
                  cnt[c] -= 1
                  while low < 26 and cnt[low] == 0:
                      low += 1
                  while stack and stack[-1] <= low:
                      out.append(chr(stack.pop() + 97))
              return "".join(out)
        `,
        javascript: code`
          var robotWithString = function(s) {
              var cnt = new Array(26).fill(0);
              for (var i = 0; i < s.length; i++) cnt[s.charCodeAt(i) - 97]++;
              var low = 0, stack = [], out = [];
              for (var j = 0; j < s.length; j++) {
                  var c = s.charCodeAt(j) - 97;
                  stack.push(c);
                  cnt[c]--;
                  while (low < 26 && cnt[low] === 0) low++;
                  while (stack.length && stack[stack.length - 1] <= low) out.push(String.fromCharCode(97 + stack.pop()));
              }
              return out.join("");
          };
        `,
        typescript: code`
          function robotWithString(s: string): string {
              var cnt: number[] = [];
              for (var z = 0; z < 26; z++) cnt.push(0);
              for (var i = 0; i < s.length; i++) cnt[s.charCodeAt(i) - 97]++;
              var low = 0;
              var stack: number[] = [];
              var out: string[] = [];
              for (var j = 0; j < s.length; j++) {
                  var c = s.charCodeAt(j) - 97;
                  stack.push(c);
                  cnt[c]--;
                  while (low < 26 && cnt[low] === 0) low++;
                  while (stack.length > 0 && stack[stack.length - 1] <= low) {
                      out.push(String.fromCharCode(97 + (stack.pop() as number)));
                  }
              }
              return out.join("");
          }
        `,
        java: code`
          public static String robotWithString(String s) {
              int n = s.length();
              int[] cnt = new int[26];
              for (int i = 0; i < n; i++) cnt[s.charAt(i) - 'a']++;
              char[] st = new char[n];
              int top = 0, low = 0;
              StringBuilder sb = new StringBuilder();
              for (int i = 0; i < n; i++) {
                  char ch = s.charAt(i);
                  st[top++] = ch;
                  cnt[ch - 'a']--;
                  while (low < 26 && cnt[low] == 0) low++;
                  while (top > 0 && st[top - 1] - 'a' <= low) sb.append(st[--top]);
              }
              return sb.toString();
          }
        `,
        cpp: code`
          string robotWithString(string s) {
              int cnt[26] = {0};
              for (char ch : s) cnt[ch - 'a']++;
              string st, out;
              int low = 0;
              for (char ch : s) {
                  st.push_back(ch);
                  cnt[ch - 'a']--;
                  while (low < 26 && cnt[low] == 0) low++;
                  while (!st.empty() && st.back() - 'a' <= low) {
                      out.push_back(st.back());
                      st.pop_back();
                  }
              }
              return out;
          }
        `,
        c: code`
          char* robotWithString(const char* s) {
              int n = strlen(s);
              int cnt[26] = {0};
              for (int i = 0; i < n; i++) cnt[s[i] - 'a']++;
              char* st = (char*)malloc(n + 1);
              char* out = (char*)malloc(n + 1);
              int top = 0, k = 0, low = 0;
              for (int i = 0; i < n; i++) {
                  st[top++] = s[i];
                  cnt[s[i] - 'a']--;
                  while (low < 26 && cnt[low] == 0) low++;
                  while (top > 0 && st[top - 1] - 'a' <= low) out[k++] = st[--top];
              }
              out[k] = '\0';
              free(st);
              return out;
          }
        `,
        csharp: code`
          public static string RobotWithString(string s)
          {
              int[] cnt = new int[26];
              foreach (char ch in s) cnt[ch - 'a']++;
              var st = new Stack<char>();
              var sb = new System.Text.StringBuilder();
              int low = 0;
              foreach (char ch in s)
              {
                  st.Push(ch);
                  cnt[ch - 'a']--;
                  while (low < 26 && cnt[low] == 0) low++;
                  while (st.Count > 0 && st.Peek() - 'a' <= low) sb.Append(st.Pop());
              }
              return sb.ToString();
          }
        `,
        go: code`
          func robotWithString(s string) string {
          	var cnt [26]int
          	for i := 0; i < len(s); i++ {
          		cnt[s[i]-'a']++
          	}
          	st := make([]byte, 0, len(s))
          	out := make([]byte, 0, len(s))
          	low := 0
          	for i := 0; i < len(s); i++ {
          		st = append(st, s[i])
          		cnt[s[i]-'a']--
          		for low < 26 && cnt[low] == 0 {
          			low++
          		}
          		for len(st) > 0 && int(st[len(st)-1]-'a') <= low {
          			out = append(out, st[len(st)-1])
          			st = st[:len(st)-1]
          		}
          	}
          	return string(out)
          }
        `,
        kotlin: code`
          fun robotWithString(s: String): String {
              val cnt = IntArray(26)
              for (ch in s) cnt[ch - 'a']++
              val st = CharArray(s.length)
              var top = 0
              var low = 0
              val sb = StringBuilder()
              for (ch in s) {
                  st[top++] = ch
                  cnt[ch - 'a']--
                  while (low < 26 && cnt[low] == 0) low++
                  while (top > 0 && st[top - 1] - 'a' <= low) {
                      top--
                      sb.append(st[top])
                  }
              }
              return sb.toString()
          }
        `,
        swift: code`
          func robotWithString(_ s: String) -> String {
              let c = Array(s.utf8)
              var cnt = [Int](repeating: 0, count: 26)
              for ch in c { cnt[Int(ch) - 97] += 1 }
              var st = [UInt8]()
              var out = [UInt8]()
              var low = 0
              for ch in c {
                  st.append(ch)
                  cnt[Int(ch) - 97] -= 1
                  while low < 26 && cnt[low] == 0 { low += 1 }
                  while let top = st.last, Int(top) - 97 <= low {
                      out.append(top)
                      st.removeLast()
                  }
              }
              return String(decoding: out, as: UTF8.self)
          }
        `,
        rust: code`
          fn robotWithString(s: String) -> String {
              let c = s.as_bytes();
              let mut cnt = [0usize; 26];
              for &ch in c {
                  cnt[(ch - b'a') as usize] += 1;
              }
              let mut st: Vec<u8> = Vec::with_capacity(c.len());
              let mut out: Vec<u8> = Vec::with_capacity(c.len());
              let mut low = 0usize;
              for &ch in c {
                  st.push(ch);
                  cnt[(ch - b'a') as usize] -= 1;
                  while low < 26 && cnt[low] == 0 {
                      low += 1;
                  }
                  while let Some(&top) = st.last() {
                      if ((top - b'a') as usize) <= low {
                          out.push(top);
                          st.pop();
                      } else {
                          break;
                      }
                  }
              }
              String::from_utf8(out).unwrap()
          }
        `,
        php: code`
          function robotWithString($s) {
              $n = strlen($s);
              $cnt = array_fill(0, 26, 0);
              for ($i = 0; $i < $n; $i++) $cnt[ord($s[$i]) - 97]++;
              $st = [];
              $out = "";
              $low = 0;
              for ($i = 0; $i < $n; $i++) {
                  $c = ord($s[$i]) - 97;
                  $st[] = $c;
                  $cnt[$c]--;
                  while ($low < 26 && $cnt[$low] == 0) $low++;
                  while (!empty($st) && $st[count($st) - 1] <= $low) $out .= chr(97 + array_pop($st));
              }
              return $out;
          }
        `,
        ruby: code`
          def robotWithString(s)
            cnt = Array.new(26, 0)
            s.each_byte { |b| cnt[b - 97] += 1 }
            st = []
            out = []
            low = 0
            s.each_byte do |b|
              c = b - 97
              st.push(c)
              cnt[c] -= 1
              low += 1 while low < 26 && cnt[low] == 0
              out << (st.pop + 97).chr while !st.empty? && st[-1] <= low
            end
            out.join
          end
        `,
      },
    };
  })(),

  // ── Minimum Penalty for a Shop (LC 2483) ────────────────────────
  (() => {
    // Independent check: compute every closing hour's penalty from scratch.
    const ref = (customers: string) => {
      const n = customers.length;
      let bestJ = 0, best = Infinity;
      for (let j = 0; j <= n; j++) {
        let p = 0;
        for (let i = 0; i < n; i++) if ((i < j && customers[i] === "N") || (i >= j && customers[i] === "Y")) p++;
        if (p < best) { best = p; bestJ = j; }
      }
      return bestJ;
    };
    return {
      slug: "minimum-penalty-for-a-shop",
      title: "Minimum Penalty for a Shop",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Prefix Sum", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "bestClosingTime", params: [{ name: "customers", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A shop's log for one day is a string `customers` of `'Y'` and `'N'`: `customers[i] == 'Y'` means some customer arrived during hour `i`, `'N'` means nobody did.\n\nIf the shop closes at hour `j` (where `0 <= j <= n`), it is open for hours `0..j-1` and closed for hours `j..n-1`. The **penalty** is:\n\n- `+1` for every hour the shop is **open** and no customer comes (`'N'`), and\n- `+1` for every hour the shop is **closed** and a customer comes (`'Y'`).\n\nReturn the **earliest** hour at which the shop should close to get the minimum penalty.",
        [
          { in: "customers = \"NYYN\"", out: "3", note: "Closing at 3 costs 1 (the open `N` at hour 0). Every other hour costs at least 2." },
          { in: "customers = \"NNNN\"", out: "0", note: "Closing immediately costs nothing." },
          { in: "customers = \"YYYY\"", out: "4", note: "Stay open all day." },
        ],
        ["1 <= customers.length <= 10^5", "customers consists only of the characters 'Y' and 'N'"]),
      hints: [
        "Computing every closing hour's penalty from scratch is O(n²).",
        "Moving the closing hour from `j` to `j + 1` only changes how hour `j` is charged.",
        "Start with the penalty of closing at 0 (the number of `Y`s) and sweep: a `Y` at hour `j` lowers the penalty by one, an `N` raises it by one. Keep the first hour reaching the minimum.",
      ],
      editorial: explain({
        idea: "Sweep the closing hour from 0 to `n`. Each step only re-charges a single hour, so the penalty changes by exactly one.",
        steps: [
          "Closing at hour 0 costs the number of `'Y'` characters; set `penalty` to that, `best = penalty` and `answer = 0`.",
          "For each hour `j` from 0 to `n - 1`: if `customers[j] == 'Y'`, decrease `penalty` (that customer is now served); otherwise increase it (the shop now idles that hour).",
          "If `penalty < best`, record `best = penalty` and `answer = j + 1`.",
          "Return `answer`.",
        ],
        why: "Closing at `j + 1` instead of `j` moves hour `j` from the closed part to the open part; nothing else changes. A `'Y'` hour stops costing 1 and an `'N'` hour starts costing 1. Tracking the running penalty therefore gives every closing hour's cost, and updating only on a strictly smaller value keeps the earliest optimal hour.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The answer can be `n` (stay open the whole day), so the sweep must consider `j + 1` up to `n`.",
          "Use a strict `<` so ties keep the earliest hour.",
          "Do not confuse the two charges: idle open hours are `'N'`, missed customers are `'Y'`.",
        ],
      }),
      examples: [
        { input: "\"NYYN\"", expectedOutput: "3" },
        { input: "\"NNNN\"", expectedOutput: "0" },
        { input: "\"YYYY\"", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, rng() < 0.2 ? 60 : 14);
        const pY = pick(rng, [0.2, 0.5, 0.5, 0.8]);
        let s = "";
        for (let i = 0; i < n; i++) s += rng() < pY ? "Y" : "N";
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def bestClosingTime(customers: str) -> int:
              penalty = customers.count("Y")
              best = penalty
              answer = 0
              for j, ch in enumerate(customers):
                  penalty += -1 if ch == "Y" else 1
                  if penalty < best:
                      best = penalty
                      answer = j + 1
              return answer
        `,
        javascript: code`
          var bestClosingTime = function(customers) {
              var penalty = 0;
              for (var i = 0; i < customers.length; i++) if (customers[i] === "Y") penalty++;
              var best = penalty, answer = 0;
              for (var j = 0; j < customers.length; j++) {
                  penalty += customers[j] === "Y" ? -1 : 1;
                  if (penalty < best) { best = penalty; answer = j + 1; }
              }
              return answer;
          };
        `,
        typescript: code`
          function bestClosingTime(customers: string): number {
              var penalty = 0;
              for (var i = 0; i < customers.length; i++) if (customers.charAt(i) === "Y") penalty++;
              var best = penalty, answer = 0;
              for (var j = 0; j < customers.length; j++) {
                  penalty += customers.charAt(j) === "Y" ? -1 : 1;
                  if (penalty < best) { best = penalty; answer = j + 1; }
              }
              return answer;
          }
        `,
        java: code`
          public static int bestClosingTime(String customers) {
              int n = customers.length(), penalty = 0;
              for (int i = 0; i < n; i++) if (customers.charAt(i) == 'Y') penalty++;
              int best = penalty, answer = 0;
              for (int j = 0; j < n; j++) {
                  penalty += customers.charAt(j) == 'Y' ? -1 : 1;
                  if (penalty < best) { best = penalty; answer = j + 1; }
              }
              return answer;
          }
        `,
        cpp: code`
          int bestClosingTime(string customers) {
              int n = customers.size(), penalty = 0;
              for (char ch : customers) if (ch == 'Y') penalty++;
              int best = penalty, answer = 0;
              for (int j = 0; j < n; j++) {
                  penalty += customers[j] == 'Y' ? -1 : 1;
                  if (penalty < best) { best = penalty; answer = j + 1; }
              }
              return answer;
          }
        `,
        c: code`
          int bestClosingTime(const char* customers) {
              int n = strlen(customers), penalty = 0;
              for (int i = 0; i < n; i++) if (customers[i] == 'Y') penalty++;
              int best = penalty, answer = 0;
              for (int j = 0; j < n; j++) {
                  penalty += customers[j] == 'Y' ? -1 : 1;
                  if (penalty < best) { best = penalty; answer = j + 1; }
              }
              return answer;
          }
        `,
        csharp: code`
          public static int BestClosingTime(string customers)
          {
              int n = customers.Length, penalty = 0;
              foreach (char ch in customers) if (ch == 'Y') penalty++;
              int best = penalty, answer = 0;
              for (int j = 0; j < n; j++)
              {
                  penalty += customers[j] == 'Y' ? -1 : 1;
                  if (penalty < best) { best = penalty; answer = j + 1; }
              }
              return answer;
          }
        `,
        go: code`
          func bestClosingTime(customers string) int {
          	penalty := strings.Count(customers, "Y")
          	best, answer := penalty, 0
          	for j := 0; j < len(customers); j++ {
          		if customers[j] == 'Y' {
          			penalty--
          		} else {
          			penalty++
          		}
          		if penalty < best {
          			best = penalty
          			answer = j + 1
          		}
          	}
          	return answer
          }
        `,
        kotlin: code`
          fun bestClosingTime(customers: String): Int {
              var penalty = customers.count { it == 'Y' }
              var best = penalty
              var answer = 0
              for (j in 0 until customers.length) {
                  penalty += if (customers[j] == 'Y') -1 else 1
                  if (penalty < best) {
                      best = penalty
                      answer = j + 1
                  }
              }
              return answer
          }
        `,
        swift: code`
          func bestClosingTime(_ customers: String) -> Int {
              let c = Array(customers.utf8)
              var penalty = 0
              for ch in c where ch == 89 { penalty += 1 }
              var best = penalty, answer = 0
              for j in 0..<c.count {
                  penalty += c[j] == 89 ? -1 : 1
                  if penalty < best {
                      best = penalty
                      answer = j + 1
                  }
              }
              return answer
          }
        `,
        rust: code`
          fn bestClosingTime(customers: String) -> i32 {
              let c = customers.as_bytes();
              let mut penalty = c.iter().filter(|&&ch| ch == b'Y').count() as i32;
              let mut best = penalty;
              let mut answer = 0i32;
              for j in 0..c.len() {
                  penalty += if c[j] == b'Y' { -1 } else { 1 };
                  if penalty < best {
                      best = penalty;
                      answer = j as i32 + 1;
                  }
              }
              answer
          }
        `,
        php: code`
          function bestClosingTime($customers) {
              $n = strlen($customers);
              $penalty = substr_count($customers, "Y");
              $best = $penalty;
              $answer = 0;
              for ($j = 0; $j < $n; $j++) {
                  $penalty += $customers[$j] === "Y" ? -1 : 1;
                  if ($penalty < $best) {
                      $best = $penalty;
                      $answer = $j + 1;
                  }
              }
              return $answer;
          }
        `,
        ruby: code`
          def bestClosingTime(customers)
            penalty = customers.count("Y")
            best = penalty
            answer = 0
            customers.each_char.with_index do |ch, j|
              penalty += ch == "Y" ? -1 : 1
              if penalty < best
                best = penalty
                answer = j + 1
              end
            end
            answer
          end
        `,
      },
    };
  })(),

  // ── Append Characters to String to Make Subsequence (LC 2486) ───
  (() => {
    const isSub = (p: string, s: string) => { let j = 0; for (let i = 0; i < s.length && j < p.length; i++) if (s[i] === p[j]) j++; return j === p.length; };
    // Independent check: the longest prefix of t that is already a
    // subsequence of s, tried length by length.
    const ref = (s: string, t: string) => {
      let k = 0;
      while (k < t.length && isSub(t.slice(0, k + 1), s)) k++;
      return t.length - k;
    };
    return {
      slug: "append-characters-to-string-to-make-subsequence",
      title: "Append Characters to String to Make Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["Two Pointers", "String", "Greedy", "Amazon", "Google"],
      signature: {
        funcName: "appendCharacters",
        params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two lowercase strings `s` and `t`. You may append characters to the **end** of `s`.\n\nReturn the minimum number of characters you must append so that `t` becomes a **subsequence** of `s` — that is, `t` can be obtained from the new `s` by deleting some (possibly no) characters without changing the order of the rest.",
        [
          { in: "s = \"codekairo\", t = \"codex\"", out: "1", note: "`\"code\"` already appears in order; only `x` must be appended." },
          { in: "s = \"abc\", t = \"xyz\"", out: "3" },
          { in: "s = \"kairo\", t = \"kio\"", out: "0", note: "`k`, `i` and `o` already appear in order." },
        ],
        ["1 <= s.length, t.length <= 10^5", "s and t consist only of lowercase English letters"]),
      hints: [
        "Appended characters can only help match a suffix of `t`; the part of `t` matched inside `s` must be a prefix.",
        "So the question is: what is the longest prefix of `t` that is a subsequence of `s`?",
        "Match greedily with two pointers — advance in `t` whenever the current character of `s` equals the next needed one. Append the rest.",
      ],
      editorial: explain({
        idea: "Whatever is appended goes after all of `s`, so `s` must cover a prefix of `t` and the rest is appended. Greedy two-pointer matching finds the longest prefix of `t` that is a subsequence of `s`.",
        steps: [
          "Set `j = 0` (the next needed character of `t`).",
          "Scan `s`; whenever `j < t.length` and `s[i] == t[j]`, increase `j`.",
          "Return `t.length - j`.",
        ],
        why: "Taking the earliest possible match for each character of `t` never hurts: it leaves the largest possible remainder of `s` for the following characters. So after the scan `j` is the length of the longest prefix of `t` that `s` contains as a subsequence. The remaining `t.length - j` characters cannot be matched inside `s`, and appending exactly them is enough.",
        time: "O(|s| + |t|)",
        space: "O(1)",
        pitfalls: [
          "Characters can only be appended at the end, not inserted, so only a prefix of `t` can come from `s`.",
          "Stop advancing `j` once all of `t` is matched.",
          "Searching for each character of `t` from the start of `s` again is wrong — order must be preserved.",
        ],
      }),
      examples: [
        { input: "\"codekairo\"\n\"codex\"", expectedOutput: "1" },
        { input: "\"abc\"\n\"xyz\"", expectedOutput: "3" },
        { input: "\"kairo\"\n\"kio\"", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcd", LOWER]);
        const s = randLower(rng, 1, rng() < 0.2 ? 50 : 12, alpha);
        let t: string;
        if (rng() < 0.4) {
          let sub = "";
          for (const ch of s) if (rng() < 0.5) sub += ch;
          t = sub + randLower(rng, sub.length === 0 ? 1 : 0, 4, rng() < 0.5 ? alpha : LOWER);
        } else t = randLower(rng, 1, rng() < 0.2 ? 40 : 10, alpha);
        return { input: `"${s}"\n"${t}"`, expectedOutput: String(ref(s, t)) };
      },
      solutions: {
        python: code`
          def appendCharacters(s: str, t: str) -> int:
              j = 0
              for ch in s:
                  if j < len(t) and ch == t[j]:
                      j += 1
              return len(t) - j
        `,
        javascript: code`
          var appendCharacters = function(s, t) {
              var j = 0;
              for (var i = 0; i < s.length && j < t.length; i++) if (s[i] === t[j]) j++;
              return t.length - j;
          };
        `,
        typescript: code`
          function appendCharacters(s: string, t: string): number {
              var j = 0;
              for (var i = 0; i < s.length && j < t.length; i++) if (s.charAt(i) === t.charAt(j)) j++;
              return t.length - j;
          }
        `,
        java: code`
          public static int appendCharacters(String s, String t) {
              int j = 0;
              for (int i = 0; i < s.length() && j < t.length(); i++) if (s.charAt(i) == t.charAt(j)) j++;
              return t.length() - j;
          }
        `,
        cpp: code`
          int appendCharacters(string s, string t) {
              size_t j = 0;
              for (size_t i = 0; i < s.size() && j < t.size(); i++) if (s[i] == t[j]) j++;
              return (int)(t.size() - j);
          }
        `,
        c: code`
          int appendCharacters(const char* s, const char* t) {
              int m = strlen(t), j = 0;
              for (int i = 0; s[i] && j < m; i++) if (s[i] == t[j]) j++;
              return m - j;
          }
        `,
        csharp: code`
          public static int AppendCharacters(string s, string t)
          {
              int j = 0;
              for (int i = 0; i < s.Length && j < t.Length; i++) if (s[i] == t[j]) j++;
              return t.Length - j;
          }
        `,
        go: code`
          func appendCharacters(s string, t string) int {
          	j := 0
          	for i := 0; i < len(s) && j < len(t); i++ {
          		if s[i] == t[j] {
          			j++
          		}
          	}
          	return len(t) - j
          }
        `,
        kotlin: code`
          fun appendCharacters(s: String, t: String): Int {
              var j = 0
              for (ch in s) {
                  if (j < t.length && ch == t[j]) j++
              }
              return t.length - j
          }
        `,
        swift: code`
          func appendCharacters(_ s: String, _ t: String) -> Int {
              let a = Array(s.utf8), b = Array(t.utf8)
              var j = 0
              for ch in a where j < b.count && ch == b[j] { j += 1 }
              return b.count - j
          }
        `,
        rust: code`
          fn appendCharacters(s: String, t: String) -> i32 {
              let b = t.as_bytes();
              let mut j = 0usize;
              for &ch in s.as_bytes() {
                  if j < b.len() && ch == b[j] {
                      j += 1;
                  }
              }
              (b.len() - j) as i32
          }
        `,
        php: code`
          function appendCharacters($s, $t) {
              $n = strlen($s);
              $m = strlen($t);
              $j = 0;
              for ($i = 0; $i < $n && $j < $m; $i++) {
                  if ($s[$i] === $t[$j]) $j++;
              }
              return $m - $j;
          }
        `,
        ruby: code`
          def appendCharacters(s, t)
            j = 0
            m = t.length
            s.each_char do |ch|
              j += 1 if j < m && ch == t[j]
            end
            m - j
          end
        `,
      },
    };
  })(),

  // ── Make Number of Distinct Characters Equal (LC 2531) ──────────
  (() => {
    // Independent check: perform every possible swap and count directly.
    const ref = (w1: string, w2: string) => {
      for (let i = 0; i < w1.length; i++) {
        for (let j = 0; j < w2.length; j++) {
          const a = w1.slice(0, i) + w2[j] + w1.slice(i + 1);
          const b = w2.slice(0, j) + w1[i] + w2.slice(j + 1);
          if (new Set(a).size === new Set(b).size) return true;
        }
      }
      return false;
    };
    return {
      slug: "make-number-of-distinct-characters-equal",
      title: "Make Number of Distinct Characters Equal",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon", "Google"],
      signature: {
        funcName: "isItPossible",
        params: [{ name: "word1", type: "string" as const }, { name: "word2", type: "string" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "You are given two lowercase strings `word1` and `word2`. A **move** picks an index `i` of `word1` and an index `j` of `word2` and swaps the characters `word1[i]` and `word2[j]`.\n\nReturn `true` if it is possible to make the number of **distinct** characters in `word1` equal to the number of distinct characters in `word2` with **exactly one** move, and `false` otherwise.",
        [
          { in: "word1 = \"aab\", word2 = \"cd\"", out: "true", note: "Swap the `b` of `word1` with the `c` of `word2`: `\"aac\"` and `\"bd\"` both have 2 distinct characters." },
          { in: "word1 = \"ab\", word2 = \"abcc\"", out: "false", note: "No single swap brings the counts (2 and 3) together." },
          { in: "word1 = \"a\", word2 = \"a\"", out: "true", note: "Swapping `a` with `a` changes nothing, and both already have 1." },
        ],
        ["1 <= word1.length, word2.length <= 10^5", "word1 and word2 consist of only lowercase English letters"]),
      hints: [
        "The strings can be long, but a swap is fully described by which **letter** leaves `word1` and which letter leaves `word2` — at most 26 × 26 choices.",
        "Keep letter counts for both words. How does swapping letter `x` (from `word1`) with letter `y` (from `word2`) change each distinct count?",
        "If `x == y` nothing changes. Otherwise `word1` loses `x` as a distinct letter if it had only one, and gains `y` if it had none; symmetrically for `word2`. Check every pair of present letters.",
      ],
      editorial: explain({
        idea: "Only letters matter, not positions: try every pair (letter `x` present in `word1`, letter `y` present in `word2`) and update the two distinct counts in O(1).",
        steps: [
          "Count letters of both words; let `d1` and `d2` be the numbers of distinct letters.",
          "For every `x` with `c1[x] > 0` and every `y` with `c2[y] > 0`:",
          "If `x == y`, the swap changes nothing; succeed if `d1 == d2`.",
          "Otherwise the new counts are `d1 - [c1[x] == 1] + [c1[y] == 0]` and `d2 - [c2[y] == 1] + [c2[x] == 0]`; succeed if they are equal.",
          "If no pair works, return `false`.",
        ],
        why: "Swapping `word1[i]` and `word2[j]` affects the letter multisets only through the two letters involved, so every index pair with the same letters gives the same outcome; enumerating letter pairs covers all moves. `word1` loses one `x` and gains one `y`: `x` disappears from its distinct set exactly when it was its last copy, and `y` appears exactly when it had none. The same reasoning applies to `word2` with the roles reversed.",
        time: "O(n + m + 26²)",
        space: "O(26)",
        pitfalls: [
          "Exactly one move is required: when `x == y` the counts stay as they are, which is fine only if they are already equal.",
          "Update both words: the letter leaving one word arrives in the other.",
          "Only letters actually present can be picked — skip `x` with `c1[x] == 0` and `y` with `c2[y] == 0`.",
        ],
      }),
      examples: [
        { input: "\"aab\"\n\"cd\"", expectedOutput: "true" },
        { input: "\"ab\"\n\"abcc\"", expectedOutput: "false" },
        { input: "\"a\"\n\"a\"", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcd", "abcdef", LOWER]);
        const w1 = randLower(rng, 1, rng() < 0.2 ? 20 : 8, alpha);
        const w2 = randLower(rng, 1, rng() < 0.2 ? 20 : 8, rng() < 0.7 ? alpha : pick(rng, ["xyz", "a", LOWER]));
        return { input: `"${w1}"\n"${w2}"`, expectedOutput: bool(ref(w1, w2)) };
      },
      solutions: {
        python: code`
          def isItPossible(word1: str, word2: str) -> bool:
              c1 = [0] * 26
              c2 = [0] * 26
              for ch in word1:
                  c1[ord(ch) - 97] += 1
              for ch in word2:
                  c2[ord(ch) - 97] += 1
              d1 = sum(1 for v in c1 if v > 0)
              d2 = sum(1 for v in c2 if v > 0)
              for x in range(26):
                  if c1[x] == 0:
                      continue
                  for y in range(26):
                      if c2[y] == 0:
                          continue
                      if x == y:
                          if d1 == d2:
                              return True
                          continue
                      n1 = d1 - (1 if c1[x] == 1 else 0) + (1 if c1[y] == 0 else 0)
                      n2 = d2 - (1 if c2[y] == 1 else 0) + (1 if c2[x] == 0 else 0)
                      if n1 == n2:
                          return True
              return False
        `,
        javascript: code`
          var isItPossible = function(word1, word2) {
              var c1 = new Array(26).fill(0), c2 = new Array(26).fill(0);
              for (var i = 0; i < word1.length; i++) c1[word1.charCodeAt(i) - 97]++;
              for (var j = 0; j < word2.length; j++) c2[word2.charCodeAt(j) - 97]++;
              var d1 = 0, d2 = 0;
              for (var k = 0; k < 26; k++) { if (c1[k] > 0) d1++; if (c2[k] > 0) d2++; }
              for (var x = 0; x < 26; x++) {
                  if (c1[x] === 0) continue;
                  for (var y = 0; y < 26; y++) {
                      if (c2[y] === 0) continue;
                      if (x === y) { if (d1 === d2) return true; continue; }
                      var n1 = d1 - (c1[x] === 1 ? 1 : 0) + (c1[y] === 0 ? 1 : 0);
                      var n2 = d2 - (c2[y] === 1 ? 1 : 0) + (c2[x] === 0 ? 1 : 0);
                      if (n1 === n2) return true;
                  }
              }
              return false;
          };
        `,
        typescript: code`
          function isItPossible(word1: string, word2: string): boolean {
              var c1: number[] = [], c2: number[] = [];
              for (var z = 0; z < 26; z++) { c1.push(0); c2.push(0); }
              for (var i = 0; i < word1.length; i++) c1[word1.charCodeAt(i) - 97]++;
              for (var j = 0; j < word2.length; j++) c2[word2.charCodeAt(j) - 97]++;
              var d1 = 0, d2 = 0;
              for (var k = 0; k < 26; k++) { if (c1[k] > 0) d1++; if (c2[k] > 0) d2++; }
              for (var x = 0; x < 26; x++) {
                  if (c1[x] === 0) continue;
                  for (var y = 0; y < 26; y++) {
                      if (c2[y] === 0) continue;
                      if (x === y) { if (d1 === d2) return true; continue; }
                      var n1 = d1 - (c1[x] === 1 ? 1 : 0) + (c1[y] === 0 ? 1 : 0);
                      var n2 = d2 - (c2[y] === 1 ? 1 : 0) + (c2[x] === 0 ? 1 : 0);
                      if (n1 === n2) return true;
                  }
              }
              return false;
          }
        `,
        java: code`
          public static boolean isItPossible(String word1, String word2) {
              int[] c1 = new int[26], c2 = new int[26];
              for (int i = 0; i < word1.length(); i++) c1[word1.charAt(i) - 'a']++;
              for (int i = 0; i < word2.length(); i++) c2[word2.charAt(i) - 'a']++;
              int d1 = 0, d2 = 0;
              for (int k = 0; k < 26; k++) { if (c1[k] > 0) d1++; if (c2[k] > 0) d2++; }
              for (int x = 0; x < 26; x++) {
                  if (c1[x] == 0) continue;
                  for (int y = 0; y < 26; y++) {
                      if (c2[y] == 0) continue;
                      if (x == y) { if (d1 == d2) return true; continue; }
                      int n1 = d1 - (c1[x] == 1 ? 1 : 0) + (c1[y] == 0 ? 1 : 0);
                      int n2 = d2 - (c2[y] == 1 ? 1 : 0) + (c2[x] == 0 ? 1 : 0);
                      if (n1 == n2) return true;
                  }
              }
              return false;
          }
        `,
        cpp: code`
          bool isItPossible(string word1, string word2) {
              int c1[26] = {0}, c2[26] = {0};
              for (char ch : word1) c1[ch - 'a']++;
              for (char ch : word2) c2[ch - 'a']++;
              int d1 = 0, d2 = 0;
              for (int k = 0; k < 26; k++) { if (c1[k] > 0) d1++; if (c2[k] > 0) d2++; }
              for (int x = 0; x < 26; x++) {
                  if (c1[x] == 0) continue;
                  for (int y = 0; y < 26; y++) {
                      if (c2[y] == 0) continue;
                      if (x == y) { if (d1 == d2) return true; continue; }
                      int n1 = d1 - (c1[x] == 1 ? 1 : 0) + (c1[y] == 0 ? 1 : 0);
                      int n2 = d2 - (c2[y] == 1 ? 1 : 0) + (c2[x] == 0 ? 1 : 0);
                      if (n1 == n2) return true;
                  }
              }
              return false;
          }
        `,
        c: code`
          bool isItPossible(const char* word1, const char* word2) {
              int c1[26] = {0}, c2[26] = {0};
              for (int i = 0; word1[i]; i++) c1[word1[i] - 'a']++;
              for (int i = 0; word2[i]; i++) c2[word2[i] - 'a']++;
              int d1 = 0, d2 = 0;
              for (int k = 0; k < 26; k++) { if (c1[k] > 0) d1++; if (c2[k] > 0) d2++; }
              for (int x = 0; x < 26; x++) {
                  if (c1[x] == 0) continue;
                  for (int y = 0; y < 26; y++) {
                      if (c2[y] == 0) continue;
                      if (x == y) { if (d1 == d2) return true; continue; }
                      int n1 = d1 - (c1[x] == 1 ? 1 : 0) + (c1[y] == 0 ? 1 : 0);
                      int n2 = d2 - (c2[y] == 1 ? 1 : 0) + (c2[x] == 0 ? 1 : 0);
                      if (n1 == n2) return true;
                  }
              }
              return false;
          }
        `,
        csharp: code`
          public static bool IsItPossible(string word1, string word2)
          {
              int[] c1 = new int[26], c2 = new int[26];
              foreach (char ch in word1) c1[ch - 'a']++;
              foreach (char ch in word2) c2[ch - 'a']++;
              int d1 = 0, d2 = 0;
              for (int k = 0; k < 26; k++) { if (c1[k] > 0) d1++; if (c2[k] > 0) d2++; }
              for (int x = 0; x < 26; x++)
              {
                  if (c1[x] == 0) continue;
                  for (int y = 0; y < 26; y++)
                  {
                      if (c2[y] == 0) continue;
                      if (x == y) { if (d1 == d2) return true; continue; }
                      int n1 = d1 - (c1[x] == 1 ? 1 : 0) + (c1[y] == 0 ? 1 : 0);
                      int n2 = d2 - (c2[y] == 1 ? 1 : 0) + (c2[x] == 0 ? 1 : 0);
                      if (n1 == n2) return true;
                  }
              }
              return false;
          }
        `,
        go: code`
          func isItPossible(word1 string, word2 string) bool {
          	var c1, c2 [26]int
          	for i := 0; i < len(word1); i++ {
          		c1[word1[i]-'a']++
          	}
          	for i := 0; i < len(word2); i++ {
          		c2[word2[i]-'a']++
          	}
          	d1, d2 := 0, 0
          	for k := 0; k < 26; k++ {
          		if c1[k] > 0 {
          			d1++
          		}
          		if c2[k] > 0 {
          			d2++
          		}
          	}
          	ind := func(b bool) int {
          		if b {
          			return 1
          		}
          		return 0
          	}
          	for x := 0; x < 26; x++ {
          		if c1[x] == 0 {
          			continue
          		}
          		for y := 0; y < 26; y++ {
          			if c2[y] == 0 {
          				continue
          			}
          			if x == y {
          				if d1 == d2 {
          					return true
          				}
          				continue
          			}
          			n1 := d1 - ind(c1[x] == 1) + ind(c1[y] == 0)
          			n2 := d2 - ind(c2[y] == 1) + ind(c2[x] == 0)
          			if n1 == n2 {
          				return true
          			}
          		}
          	}
          	return false
          }
        `,
        kotlin: code`
          fun isItPossible(word1: String, word2: String): Boolean {
              val c1 = IntArray(26)
              val c2 = IntArray(26)
              for (ch in word1) c1[ch - 'a']++
              for (ch in word2) c2[ch - 'a']++
              val d1 = c1.count { it > 0 }
              val d2 = c2.count { it > 0 }
              for (x in 0 until 26) {
                  if (c1[x] == 0) continue
                  for (y in 0 until 26) {
                      if (c2[y] == 0) continue
                      if (x == y) {
                          if (d1 == d2) return true
                          continue
                      }
                      val n1 = d1 - (if (c1[x] == 1) 1 else 0) + (if (c1[y] == 0) 1 else 0)
                      val n2 = d2 - (if (c2[y] == 1) 1 else 0) + (if (c2[x] == 0) 1 else 0)
                      if (n1 == n2) return true
                  }
              }
              return false
          }
        `,
        swift: code`
          func isItPossible(_ word1: String, _ word2: String) -> Bool {
              var c1 = [Int](repeating: 0, count: 26)
              var c2 = [Int](repeating: 0, count: 26)
              for ch in word1.utf8 { c1[Int(ch) - 97] += 1 }
              for ch in word2.utf8 { c2[Int(ch) - 97] += 1 }
              let d1 = c1.filter { $0 > 0 }.count
              let d2 = c2.filter { $0 > 0 }.count
              for x in 0..<26 where c1[x] > 0 {
                  for y in 0..<26 where c2[y] > 0 {
                      if x == y {
                          if d1 == d2 { return true }
                          continue
                      }
                      let n1 = d1 - (c1[x] == 1 ? 1 : 0) + (c1[y] == 0 ? 1 : 0)
                      let n2 = d2 - (c2[y] == 1 ? 1 : 0) + (c2[x] == 0 ? 1 : 0)
                      if n1 == n2 { return true }
                  }
              }
              return false
          }
        `,
        rust: code`
          fn isItPossible(word1: String, word2: String) -> bool {
              let mut c1 = [0i32; 26];
              let mut c2 = [0i32; 26];
              for &ch in word1.as_bytes() { c1[(ch - b'a') as usize] += 1; }
              for &ch in word2.as_bytes() { c2[(ch - b'a') as usize] += 1; }
              let d1 = c1.iter().filter(|&&v| v > 0).count() as i32;
              let d2 = c2.iter().filter(|&&v| v > 0).count() as i32;
              let ind = |b: bool| if b { 1 } else { 0 };
              for x in 0..26 {
                  if c1[x] == 0 { continue; }
                  for y in 0..26 {
                      if c2[y] == 0 { continue; }
                      if x == y {
                          if d1 == d2 { return true; }
                          continue;
                      }
                      let n1 = d1 - ind(c1[x] == 1) + ind(c1[y] == 0);
                      let n2 = d2 - ind(c2[y] == 1) + ind(c2[x] == 0);
                      if n1 == n2 { return true; }
                  }
              }
              false
          }
        `,
        php: code`
          function isItPossible($word1, $word2) {
              $c1 = array_fill(0, 26, 0);
              $c2 = array_fill(0, 26, 0);
              $n = strlen($word1);
              $m = strlen($word2);
              for ($i = 0; $i < $n; $i++) $c1[ord($word1[$i]) - 97]++;
              for ($i = 0; $i < $m; $i++) $c2[ord($word2[$i]) - 97]++;
              $d1 = 0;
              $d2 = 0;
              for ($k = 0; $k < 26; $k++) {
                  if ($c1[$k] > 0) $d1++;
                  if ($c2[$k] > 0) $d2++;
              }
              for ($x = 0; $x < 26; $x++) {
                  if ($c1[$x] == 0) continue;
                  for ($y = 0; $y < 26; $y++) {
                      if ($c2[$y] == 0) continue;
                      if ($x == $y) {
                          if ($d1 == $d2) return true;
                          continue;
                      }
                      $n1 = $d1 - ($c1[$x] == 1 ? 1 : 0) + ($c1[$y] == 0 ? 1 : 0);
                      $n2 = $d2 - ($c2[$y] == 1 ? 1 : 0) + ($c2[$x] == 0 ? 1 : 0);
                      if ($n1 == $n2) return true;
                  }
              }
              return false;
          }
        `,
        ruby: code`
          def isItPossible(word1, word2)
            c1 = Array.new(26, 0)
            c2 = Array.new(26, 0)
            word1.each_byte { |b| c1[b - 97] += 1 }
            word2.each_byte { |b| c2[b - 97] += 1 }
            d1 = c1.count { |v| v > 0 }
            d2 = c2.count { |v| v > 0 }
            26.times do |x|
              next if c1[x] == 0
              26.times do |y|
                next if c2[y] == 0
                if x == y
                  return true if d1 == d2
                  next
                end
                n1 = d1 - (c1[x] == 1 ? 1 : 0) + (c1[y] == 0 ? 1 : 0)
                n2 = d2 - (c2[y] == 1 ? 1 : 0) + (c2[x] == 0 ? 1 : 0)
                return true if n1 == n2
              end
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Find the Divisibility Array of a String (LC 2575) ───────────
  (() => {
    // Independent check: exact prefix values with BigInt.
    const ref = (word: string, m: number) => {
      const out: number[] = [];
      const bm = BigInt(m);
      for (let i = 1; i <= word.length; i++) out.push(BigInt(word.slice(0, i)) % bm === BigInt(0) ? 1 : 0);
      return out;
    };
    return {
      slug: "find-the-divisibility-array-of-a-string",
      title: "Find the Divisibility Array of a String",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "String", "Amazon", "Google"],
      signature: {
        funcName: "divisibilityArray",
        params: [{ name: "word", type: "string" as const }, { name: "m", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "You are given a string `word` of `n` digits and a positive integer `m`.\n\nThe **divisibility array** `div` of `word` has length `n`: `div[i] = 1` if the number written by the prefix `word[0..i]` is divisible by `m`, and `div[i] = 0` otherwise.\n\nReturn the divisibility array. The prefixes can be far too long to fit in any integer type.",
        [
          { in: "word = \"1020\", m = 10", out: "[0,1,0,1]", note: "The prefixes are 1, 10, 102 and 1020; only 10 and 1020 are multiples of 10." },
          { in: "word = \"2026\", m = 4", out: "[0,1,0,0]" },
          { in: "word = \"777\", m = 7", out: "[1,1,1]" },
        ],
        ["1 <= n <= 10^5", "word.length == n", "word consists of digits from 0 to 9", "1 <= m <= 10^9"]),
      hints: [
        "You never need a prefix's full value — only its remainder modulo `m`.",
        "If the prefix ending at `i - 1` leaves remainder `r`, the next prefix is `10 × previous + digit`.",
        "So `r = (r × 10 + digit) mod m`. With `m` up to 10^9, `r × 10` needs 64-bit arithmetic.",
      ],
      editorial: explain({
        idea: "Carry the remainder of the current prefix modulo `m`; appending a digit multiplies the prefix by 10 and adds the digit, and remainders follow the same rule.",
        steps: [
          "Start with `r = 0`.",
          "For each digit `d` of `word`, set `r = (r × 10 + d) mod m` using a 64-bit integer.",
          "Append `1` to the answer if `r == 0`, otherwise `0`.",
        ],
        why: "If `P = q·m + r` is the previous prefix, the new prefix is `10P + d = 10q·m + (10r + d)`, which has the same remainder as `10r + d`. By induction `r` is always the true remainder of the current prefix, and the prefix is divisible exactly when that remainder is 0.",
        time: "O(n)",
        space: "O(1) besides the output",
        pitfalls: [
          "`r` is below 10^9, so `r × 10 + 9` can reach about 10^10 — overflowing 32-bit integers.",
          "Do not parse the prefix as a number; it can be 100,000 digits long.",
          "A prefix of zeros is divisible by every `m` (its value is 0).",
        ],
      }),
      examples: [
        { input: "\"1020\"\n10", expectedOutput: "[0,1,0,1]" },
        { input: "\"2026\"\n4", expectedOutput: "[0,1,0,0]" },
        { input: "\"777\"\n7", expectedOutput: "[1,1,1]" },
      ],
      gen: (rng: Rng) => {
        const word = randLower(rng, 1, rng() < 0.2 ? 60 : 15, pick(rng, ["0123456789", "0123456789", "0", "05", "123", "9"]));
        const r = rng();
        const m = r < 0.4 ? ri(rng, 1, 12) : r < 0.6 ? pick(rng, [999999937, 1000000000, 999999999, 536870912]) : ri(rng, 1, 1000000000);
        return { input: `"${word}"\n${m}`, expectedOutput: fmtIntArr(ref(word, m)) };
      },
      solutions: {
        python: code`
          from typing import List

          def divisibilityArray(word: str, m: int) -> List[int]:
              r = 0
              out = []
              for ch in word:
                  r = (r * 10 + ord(ch) - 48) % m
                  out.append(1 if r == 0 else 0)
              return out
        `,
        javascript: code`
          var divisibilityArray = function(word, m) {
              var r = 0, out = new Array(word.length);
              for (var i = 0; i < word.length; i++) {
                  r = (r * 10 + (word.charCodeAt(i) - 48)) % m;
                  out[i] = r === 0 ? 1 : 0;
              }
              return out;
          };
        `,
        typescript: code`
          function divisibilityArray(word: string, m: number): number[] {
              var r = 0;
              var out: number[] = [];
              for (var i = 0; i < word.length; i++) {
                  r = (r * 10 + (word.charCodeAt(i) - 48)) % m;
                  out.push(r === 0 ? 1 : 0);
              }
              return out;
          }
        `,
        java: code`
          public static int[] divisibilityArray(String word, int m) {
              int n = word.length();
              int[] out = new int[n];
              long r = 0;
              for (int i = 0; i < n; i++) {
                  r = (r * 10 + (word.charAt(i) - '0')) % m;
                  out[i] = r == 0 ? 1 : 0;
              }
              return out;
          }
        `,
        cpp: code`
          vector<int> divisibilityArray(string word, int m) {
              vector<int> out(word.size());
              long long r = 0;
              for (size_t i = 0; i < word.size(); i++) {
                  r = (r * 10 + (word[i] - '0')) % m;
                  out[i] = r == 0 ? 1 : 0;
              }
              return out;
          }
        `,
        c: code`
          int* divisibilityArray(const char* word, int m, int* returnSize) {
              int n = strlen(word);
              int* out = (int*)malloc((n > 0 ? n : 1) * sizeof(int));
              long long r = 0;
              for (int i = 0; i < n; i++) {
                  r = (r * 10 + (word[i] - '0')) % m;
                  out[i] = r == 0 ? 1 : 0;
              }
              *returnSize = n;
              return out;
          }
        `,
        csharp: code`
          public static int[] DivisibilityArray(string word, int m)
          {
              int n = word.Length;
              int[] output = new int[n];
              long r = 0;
              for (int i = 0; i < n; i++)
              {
                  r = (r * 10 + (word[i] - '0')) % m;
                  output[i] = r == 0 ? 1 : 0;
              }
              return output;
          }
        `,
        go: code`
          func divisibilityArray(word string, m int) []int {
          	out := make([]int, len(word))
          	r := 0
          	for i := 0; i < len(word); i++ {
          		r = (r*10 + int(word[i]-'0')) % m
          		if r == 0 {
          			out[i] = 1
          		}
          	}
          	return out
          }
        `,
        kotlin: code`
          fun divisibilityArray(word: String, m: Int): IntArray {
              val out = IntArray(word.length)
              var r = 0L
              for (i in 0 until word.length) {
                  r = (r * 10 + (word[i] - '0')) % m
                  out[i] = if (r == 0L) 1 else 0
              }
              return out
          }
        `,
        swift: code`
          func divisibilityArray(_ word: String, _ m: Int) -> [Int] {
              var out = [Int]()
              var r = 0
              for ch in word.utf8 {
                  r = (r * 10 + Int(ch) - 48) % m
                  out.append(r == 0 ? 1 : 0)
              }
              return out
          }
        `,
        rust: code`
          fn divisibilityArray(word: String, m: i32) -> Vec<i32> {
              let m = m as i64;
              let mut r: i64 = 0;
              let mut out = Vec::with_capacity(word.len());
              for &ch in word.as_bytes() {
                  r = (r * 10 + (ch - b'0') as i64) % m;
                  out.push(if r == 0 { 1 } else { 0 });
              }
              out
          }
        `,
        php: code`
          function divisibilityArray($word, $m) {
              $n = strlen($word);
              $out = [];
              $r = 0;
              for ($i = 0; $i < $n; $i++) {
                  $r = ($r * 10 + (ord($word[$i]) - 48)) % $m;
                  $out[] = $r == 0 ? 1 : 0;
              }
              return $out;
          }
        `,
        ruby: code`
          def divisibilityArray(word, m)
            r = 0
            word.each_byte.map do |b|
              r = (r * 10 + b - 48) % m
              r == 0 ? 1 : 0
            end
          end
        `,
      },
    };
  })(),

  // ── Find the Substring With Maximum Cost (LC 2606) ──────────────
  (() => {
    const costs = (chars: string, vals: number[]) => {
      const c: number[] = [];
      for (let i = 0; i < 26; i++) c.push(i + 1);
      for (let i = 0; i < chars.length; i++) c[chars.charCodeAt(i) - 97] = vals[i];
      return c;
    };
    // Independent check: the cost of every substring (and 0 for the empty one).
    const ref = (s: string, chars: string, vals: number[]) => {
      const c = costs(chars, vals);
      let best = 0;
      for (let i = 0; i < s.length; i++) {
        let sum = 0;
        for (let j = i; j < s.length; j++) { sum += c[s.charCodeAt(j) - 97]; best = Math.max(best, sum); }
      }
      return best;
    };
    return {
      slug: "find-the-substring-with-maximum-cost",
      title: "Find the Substring With Maximum Cost",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "maximumCostSubstring",
        params: [{ name: "s", type: "string" as const }, { name: "chars", type: "string" as const }, { name: "vals", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given a lowercase string `s`, a string `chars` of **distinct** lowercase letters, and an integer array `vals` of the same length as `chars`.\n\nThe **value** of a letter is:\n\n- `vals[i]` if the letter is `chars[i]`;\n- otherwise its 1-indexed position in the alphabet (`'a'` is 1, `'b'` is 2, …, `'z'` is 26).\n\nThe **cost** of a substring is the sum of the values of its letters, and the cost of the empty string is 0.\n\nReturn the maximum cost over all substrings of `s` (the empty substring included).",
        [
          { in: "s = \"kairo\", chars = \"i\", vals = [-20]", out: "33", note: "Values are k = 11, a = 1, i = -20, r = 18, o = 15. The best substring is `\"ro\"`." },
          { in: "s = \"abc\", chars = \"abc\", vals = [-1,-1,-1]", out: "0", note: "Every letter is negative, so the empty substring is best." },
          { in: "s = \"xyz\", chars = \"y\", vals = [-100]", out: "26" },
        ],
        ["1 <= s.length <= 10^5", "s consists of lowercase English letters", "1 <= chars.length <= 26", "chars consists of distinct lowercase English letters", "vals.length == chars.length", "-1000 <= vals[i] <= 1000"]),
      hints: [
        "First turn `s` into an array of numbers: the value of each letter.",
        "Now you want the maximum sum of a contiguous subarray, where the empty subarray (sum 0) is allowed.",
        "Kadane's algorithm: keep the best sum of a subarray ending here, `cur = max(0, cur + value)`, and track the maximum.",
      ],
      editorial: explain({
        idea: "Map every letter to its value; the question becomes the maximum subarray sum with the empty subarray allowed, which Kadane's algorithm solves in one pass.",
        steps: [
          "Build `cost[26]` with `cost[c] = c + 1`, then overwrite `cost[chars[i]] = vals[i]` for each `i`.",
          "Scan `s` keeping `cur`, the best cost of a substring ending at the current position (or empty): `cur = max(0, cur + cost[s[i]])`.",
          "Track `best = max(best, cur)`; it starts at 0 for the empty substring.",
        ],
        why: "The best substring ending at position `i` either extends the best one ending at `i - 1` or starts fresh; starting fresh (an empty prefix) is better exactly when the running sum went negative. Taking the maximum of these over all `i`, together with the empty substring, gives the overall maximum.",
        time: "O(n + 26)",
        space: "O(26)",
        pitfalls: [
          "The empty substring is allowed, so the answer is never negative.",
          "Letters not in `chars` keep their alphabet position as value.",
          "`chars[i]` pairs with `vals[i]` by index — build the lookup table once instead of searching `chars` for every letter.",
        ],
      }),
      examples: [
        { input: "\"kairo\"\n\"i\"\n[-20]", expectedOutput: "33" },
        { input: "\"abc\"\n\"abc\"\n[-1,-1,-1]", expectedOutput: "0" },
        { input: "\"xyz\"\n\"y\"\n[-100]", expectedOutput: "26" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["abc", "abcdef", "xyz", LOWER, LOWER]);
        const s = randLower(rng, 1, rng() < 0.2 ? 60 : 15, alpha);
        const pool = shuffle(rng, (rng() < 0.6 ? alpha : LOWER).split(""));
        const chars = pool.slice(0, ri(rng, 1, pool.length)).join("");
        const lim = pick(rng, [5, 30, 1000]);
        const neg = pick(rng, [0.3, 0.6, 0.9]);
        const vals = Array.from({ length: chars.length }, () => (rng() < neg ? -ri(rng, 1, lim) : ri(rng, 0, lim)));
        return { input: `"${s}"\n"${chars}"\n${fmtIntArr(vals)}`, expectedOutput: String(ref(s, chars, vals)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumCostSubstring(s: str, chars: str, vals: List[int]) -> int:
              cost = [i + 1 for i in range(26)]
              for ch, v in zip(chars, vals):
                  cost[ord(ch) - 97] = v
              best = cur = 0
              for ch in s:
                  cur = max(0, cur + cost[ord(ch) - 97])
                  best = max(best, cur)
              return best
        `,
        javascript: code`
          var maximumCostSubstring = function(s, chars, vals) {
              var cost = [];
              for (var i = 0; i < 26; i++) cost.push(i + 1);
              for (var j = 0; j < chars.length; j++) cost[chars.charCodeAt(j) - 97] = vals[j];
              var best = 0, cur = 0;
              for (var k = 0; k < s.length; k++) {
                  cur = Math.max(0, cur + cost[s.charCodeAt(k) - 97]);
                  if (cur > best) best = cur;
              }
              return best;
          };
        `,
        typescript: code`
          function maximumCostSubstring(s: string, chars: string, vals: number[]): number {
              var cost: number[] = [];
              for (var i = 0; i < 26; i++) cost.push(i + 1);
              for (var j = 0; j < chars.length; j++) cost[chars.charCodeAt(j) - 97] = vals[j];
              var best = 0, cur = 0;
              for (var k = 0; k < s.length; k++) {
                  cur = Math.max(0, cur + cost[s.charCodeAt(k) - 97]);
                  if (cur > best) best = cur;
              }
              return best;
          }
        `,
        java: code`
          public static int maximumCostSubstring(String s, String chars, int[] vals) {
              int[] cost = new int[26];
              for (int i = 0; i < 26; i++) cost[i] = i + 1;
              for (int j = 0; j < chars.length(); j++) cost[chars.charAt(j) - 'a'] = vals[j];
              int best = 0, cur = 0;
              for (int k = 0; k < s.length(); k++) {
                  cur = Math.max(0, cur + cost[s.charAt(k) - 'a']);
                  best = Math.max(best, cur);
              }
              return best;
          }
        `,
        cpp: code`
          int maximumCostSubstring(string s, string chars, vector<int>& vals) {
              int cost[26];
              for (int i = 0; i < 26; i++) cost[i] = i + 1;
              for (size_t j = 0; j < chars.size(); j++) cost[chars[j] - 'a'] = vals[j];
              int best = 0, cur = 0;
              for (char ch : s) {
                  cur = max(0, cur + cost[ch - 'a']);
                  best = max(best, cur);
              }
              return best;
          }
        `,
        c: code`
          int maximumCostSubstring(const char* s, const char* chars, int* vals, int valsSize) {
              int cost[26];
              for (int i = 0; i < 26; i++) cost[i] = i + 1;
              for (int j = 0; j < valsSize && chars[j]; j++) cost[chars[j] - 'a'] = vals[j];
              int best = 0, cur = 0;
              for (int k = 0; s[k]; k++) {
                  cur += cost[s[k] - 'a'];
                  if (cur < 0) cur = 0;
                  if (cur > best) best = cur;
              }
              return best;
          }
        `,
        csharp: code`
          public static int MaximumCostSubstring(string s, string chars, int[] vals)
          {
              int[] cost = new int[26];
              for (int i = 0; i < 26; i++) cost[i] = i + 1;
              for (int j = 0; j < chars.Length; j++) cost[chars[j] - 'a'] = vals[j];
              int best = 0, cur = 0;
              foreach (char ch in s)
              {
                  cur = Math.Max(0, cur + cost[ch - 'a']);
                  best = Math.Max(best, cur);
              }
              return best;
          }
        `,
        go: code`
          func maximumCostSubstring(s string, chars string, vals []int) int {
          	var cost [26]int
          	for i := 0; i < 26; i++ {
          		cost[i] = i + 1
          	}
          	for j := 0; j < len(chars); j++ {
          		cost[chars[j]-'a'] = vals[j]
          	}
          	best, cur := 0, 0
          	for k := 0; k < len(s); k++ {
          		cur += cost[s[k]-'a']
          		if cur < 0 {
          			cur = 0
          		}
          		if cur > best {
          			best = cur
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun maximumCostSubstring(s: String, chars: String, vals: IntArray): Int {
              val cost = IntArray(26) { it + 1 }
              for (j in 0 until chars.length) cost[chars[j] - 'a'] = vals[j]
              var best = 0
              var cur = 0
              for (ch in s) {
                  cur = maxOf(0, cur + cost[ch - 'a'])
                  best = maxOf(best, cur)
              }
              return best
          }
        `,
        swift: code`
          func maximumCostSubstring(_ s: String, _ chars: String, _ vals: [Int]) -> Int {
              var cost = (0..<26).map { $0 + 1 }
              let cs = Array(chars.utf8)
              for j in 0..<cs.count { cost[Int(cs[j]) - 97] = vals[j] }
              var best = 0, cur = 0
              for ch in s.utf8 {
                  cur = max(0, cur + cost[Int(ch) - 97])
                  best = max(best, cur)
              }
              return best
          }
        `,
        rust: code`
          fn maximumCostSubstring(s: String, chars: String, vals: Vec<i32>) -> i32 {
              let mut cost = [0i32; 26];
              for i in 0..26 {
                  cost[i] = i as i32 + 1;
              }
              for (j, &ch) in chars.as_bytes().iter().enumerate() {
                  cost[(ch - b'a') as usize] = vals[j];
              }
              let (mut best, mut cur) = (0i32, 0i32);
              for &ch in s.as_bytes() {
                  cur = (cur + cost[(ch - b'a') as usize]).max(0);
                  best = best.max(cur);
              }
              best
          }
        `,
        php: code`
          function maximumCostSubstring($s, $chars, $vals) {
              $cost = [];
              for ($i = 0; $i < 26; $i++) $cost[$i] = $i + 1;
              $m = strlen($chars);
              for ($j = 0; $j < $m; $j++) $cost[ord($chars[$j]) - 97] = $vals[$j];
              $best = 0;
              $cur = 0;
              $n = strlen($s);
              for ($k = 0; $k < $n; $k++) {
                  $cur = max(0, $cur + $cost[ord($s[$k]) - 97]);
                  if ($cur > $best) $best = $cur;
              }
              return $best;
          }
        `,
        ruby: code`
          def maximumCostSubstring(s, chars, vals)
            cost = (1..26).to_a
            chars.each_byte.with_index { |b, j| cost[b - 97] = vals[j] }
            best = 0
            cur = 0
            s.each_byte do |b|
              cur = [0, cur + cost[b - 97]].max
              best = cur if cur > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Find the Longest Semi-Repetitive Substring (LC 2730) ────────
  (() => {
    // Independent check: count the equal adjacent pairs of every substring.
    const ref = (s: string) => {
      let best = 0;
      for (let i = 0; i < s.length; i++) {
        let pairs = 0;
        for (let j = i; j < s.length; j++) {
          if (j > i && s[j] === s[j - 1]) pairs++;
          if (pairs <= 1) best = Math.max(best, j - i + 1);
        }
      }
      return best;
    };
    return {
      slug: "find-the-longest-semi-repetitive-substring",
      title: "Find the Longest Semi-Repetitive Substring",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window", "Amazon", "Google"],
      signature: { funcName: "longestSemiRepetitiveSubstring", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `s` of digits. A string is **semi-repetitive** if it contains **at most one** pair of adjacent equal characters. For example `\"0010\"`, `\"2026\"` and `\"54944\"` are semi-repetitive, while `\"00101022\"` (two pairs) and `\"1101234883\"` (two pairs) are not.\n\nReturn the length of the longest semi-repetitive substring of `s`.",
        [
          { in: "s = \"11233\"", out: "4", note: "The whole string has two adjacent pairs (`11` and `33`); `\"1123\"` and `\"1233\"` keep just one." },
          { in: "s = \"2026\"", out: "4", note: "No adjacent pair at all." },
          { in: "s = \"1111\"", out: "2" },
        ],
        ["1 <= s.length <= 50", "'0' <= s[i] <= '9'"]),
      hints: [
        "Think of a window `[l, r]` and the number of positions `i` in it with `s[i] == s[i + 1]`.",
        "Growing the window to the right can add a pair; shrinking from the left can remove one.",
        "Sliding window: extend `r`, and while the window holds two pairs, advance `l` (dropping the pair at `l` when `s[l] == s[l + 1]`). Track the longest window.",
      ],
      editorial: explain({
        idea: "A sliding window that keeps at most one adjacent equal pair inside; the longest window seen is the answer.",
        steps: [
          "Set `l = 0`, `pairs = 0`, `best = 1`.",
          "For each `r` from 1 to `n - 1`: if `s[r] == s[r - 1]`, increase `pairs`.",
          "While `pairs > 1`: if `s[l] == s[l + 1]`, decrease `pairs`; then increase `l`.",
          "Update `best = max(best, r - l + 1)`.",
        ],
        why: "`pairs` always counts the adjacent equal pairs fully inside `[l, r]`: a new pair enters when `r` advances onto a repeat, and the pair `(l, l + 1)` leaves when `l` advances past it. For each `r`, the loop moves `l` to the smallest index that keeps the window valid, so `[l, r]` is the longest semi-repetitive substring ending at `r`; validity is monotone (shrinking never adds pairs), which makes the two-pointer sweep correct.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "A string of length 1 is semi-repetitive; start `best` at 1.",
          "When shrinking, check the pair `(l, l + 1)` before moving `l`.",
          "Pairs may overlap: `\"111\"` already holds two of them, so it is not semi-repetitive.",
        ],
      }),
      examples: [
        { input: "\"11233\"", expectedOutput: "4" },
        { input: "\"2026\"", expectedOutput: "4" },
        { input: "\"1111\"", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const digits = pick(rng, ["0123456789", "01", "012", "1", "12", "0123456789"]);
        const s = randLower(rng, 1, rng() < 0.3 ? 50 : 15, digits);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def longestSemiRepetitiveSubstring(s: str) -> int:
              l = 0
              pairs = 0
              best = 1
              for r in range(1, len(s)):
                  if s[r] == s[r - 1]:
                      pairs += 1
                  while pairs > 1:
                      if s[l] == s[l + 1]:
                          pairs -= 1
                      l += 1
                  best = max(best, r - l + 1)
              return best
        `,
        javascript: code`
          var longestSemiRepetitiveSubstring = function(s) {
              var l = 0, pairs = 0, best = 1;
              for (var r = 1; r < s.length; r++) {
                  if (s[r] === s[r - 1]) pairs++;
                  while (pairs > 1) {
                      if (s[l] === s[l + 1]) pairs--;
                      l++;
                  }
                  best = Math.max(best, r - l + 1);
              }
              return best;
          };
        `,
        typescript: code`
          function longestSemiRepetitiveSubstring(s: string): number {
              var l = 0, pairs = 0, best = 1;
              for (var r = 1; r < s.length; r++) {
                  if (s.charAt(r) === s.charAt(r - 1)) pairs++;
                  while (pairs > 1) {
                      if (s.charAt(l) === s.charAt(l + 1)) pairs--;
                      l++;
                  }
                  best = Math.max(best, r - l + 1);
              }
              return best;
          }
        `,
        java: code`
          public static int longestSemiRepetitiveSubstring(String s) {
              int l = 0, pairs = 0, best = 1;
              for (int r = 1; r < s.length(); r++) {
                  if (s.charAt(r) == s.charAt(r - 1)) pairs++;
                  while (pairs > 1) {
                      if (s.charAt(l) == s.charAt(l + 1)) pairs--;
                      l++;
                  }
                  best = Math.max(best, r - l + 1);
              }
              return best;
          }
        `,
        cpp: code`
          int longestSemiRepetitiveSubstring(string s) {
              int l = 0, pairs = 0, best = 1;
              for (int r = 1; r < (int)s.size(); r++) {
                  if (s[r] == s[r - 1]) pairs++;
                  while (pairs > 1) {
                      if (s[l] == s[l + 1]) pairs--;
                      l++;
                  }
                  best = max(best, r - l + 1);
              }
              return best;
          }
        `,
        c: code`
          int longestSemiRepetitiveSubstring(const char* s) {
              int n = strlen(s), l = 0, pairs = 0, best = 1;
              for (int r = 1; r < n; r++) {
                  if (s[r] == s[r - 1]) pairs++;
                  while (pairs > 1) {
                      if (s[l] == s[l + 1]) pairs--;
                      l++;
                  }
                  if (r - l + 1 > best) best = r - l + 1;
              }
              return best;
          }
        `,
        csharp: code`
          public static int LongestSemiRepetitiveSubstring(string s)
          {
              int l = 0, pairs = 0, best = 1;
              for (int r = 1; r < s.Length; r++)
              {
                  if (s[r] == s[r - 1]) pairs++;
                  while (pairs > 1)
                  {
                      if (s[l] == s[l + 1]) pairs--;
                      l++;
                  }
                  best = Math.Max(best, r - l + 1);
              }
              return best;
          }
        `,
        go: code`
          func longestSemiRepetitiveSubstring(s string) int {
          	l, pairs, best := 0, 0, 1
          	for r := 1; r < len(s); r++ {
          		if s[r] == s[r-1] {
          			pairs++
          		}
          		for pairs > 1 {
          			if s[l] == s[l+1] {
          				pairs--
          			}
          			l++
          		}
          		if r-l+1 > best {
          			best = r - l + 1
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun longestSemiRepetitiveSubstring(s: String): Int {
              var l = 0
              var pairs = 0
              var best = 1
              for (r in 1 until s.length) {
                  if (s[r] == s[r - 1]) pairs++
                  while (pairs > 1) {
                      if (s[l] == s[l + 1]) pairs--
                      l++
                  }
                  best = maxOf(best, r - l + 1)
              }
              return best
          }
        `,
        swift: code`
          func longestSemiRepetitiveSubstring(_ s: String) -> Int {
              let c = Array(s.utf8)
              var l = 0, pairs = 0, best = 1
              var r = 1
              while r < c.count {
                  if c[r] == c[r - 1] { pairs += 1 }
                  while pairs > 1 {
                      if c[l] == c[l + 1] { pairs -= 1 }
                      l += 1
                  }
                  best = max(best, r - l + 1)
                  r += 1
              }
              return best
          }
        `,
        rust: code`
          fn longestSemiRepetitiveSubstring(s: String) -> i32 {
              let c = s.as_bytes();
              let (mut l, mut pairs, mut best) = (0usize, 0, 1usize);
              for r in 1..c.len() {
                  if c[r] == c[r - 1] {
                      pairs += 1;
                  }
                  while pairs > 1 {
                      if c[l] == c[l + 1] {
                          pairs -= 1;
                      }
                      l += 1;
                  }
                  if r + 1 - l > best {
                      best = r + 1 - l;
                  }
              }
              best as i32
          }
        `,
        php: code`
          function longestSemiRepetitiveSubstring($s) {
              $n = strlen($s);
              $l = 0;
              $pairs = 0;
              $best = 1;
              for ($r = 1; $r < $n; $r++) {
                  if ($s[$r] === $s[$r - 1]) $pairs++;
                  while ($pairs > 1) {
                      if ($s[$l] === $s[$l + 1]) $pairs--;
                      $l++;
                  }
                  if ($r - $l + 1 > $best) $best = $r - $l + 1;
              }
              return $best;
          }
        `,
        ruby: code`
          def longestSemiRepetitiveSubstring(s)
            l = 0
            pairs = 0
            best = 1
            (1...s.length).each do |r|
              pairs += 1 if s[r] == s[r - 1]
              while pairs > 1
                pairs -= 1 if s[l] == s[l + 1]
                l += 1
              end
              best = r - l + 1 if r - l + 1 > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Lexicographically Smallest String After Substring Operation (LC 2734) ──
  (() => {
    const dec = (c: string) => (c === "a" ? "z" : String.fromCharCode(c.charCodeAt(0) - 1));
    // Independent check: apply the operation to every substring.
    const ref = (s: string) => {
      let best: string | null = null;
      for (let i = 0; i < s.length; i++) {
        for (let j = i; j < s.length; j++) {
          let t = s.slice(0, i);
          for (let k = i; k <= j; k++) t += dec(s[k]);
          t += s.slice(j + 1);
          if (best === null || t < best) best = t;
        }
      }
      return best as string;
    };
    return {
      slug: "lexicographically-smallest-string-after-substring-operation",
      title: "Lexicographically Smallest String After Substring Operation",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Amazon", "Google"],
      signature: { funcName: "smallestString", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a lowercase string `s`. Perform the following operation **exactly once**: choose a non-empty substring of `s` and replace every letter in it by the **previous** letter of the alphabet, where `'a'` becomes `'z'`.\n\nReturn the lexicographically **smallest** string you can obtain.",
        [
          { in: "s = \"kairo\"", out: "jairo", note: "Shift just the `k`; extending the substring onto the `a` would turn it into `z`." },
          { in: "s = \"abba\"", out: "aaaa", note: "Shift the substring `\"bb\"`." },
          { in: "s = \"aaa\"", out: "aaz", note: "Some letter must change, and an `a` can only become `z`; changing the last one costs the least." },
        ],
        ["1 <= s.length <= 3 * 10^5", "s consists of lowercase English letters"]),
      hints: [
        "Shifting any letter other than `a` makes it smaller; shifting an `a` makes it much larger.",
        "Leading `a`s are already as small as possible — leave them. Start at the first letter that is not `a`.",
        "From there, shift every letter up to (not including) the next `a`. If the string is all `a`s, you are forced to turn the last one into `z`.",
      ],
      editorial: explain({
        idea: "Decrease the first maximal block of non-`a` letters. Everything before it is already optimal, and stopping before the next `a` avoids turning it into `z`.",
        steps: [
          "Find the first index `i` with `s[i] != 'a'`.",
          "If there is none, change the last character to `'z'` and return.",
          "Otherwise, starting at `i`, replace each letter with its predecessor while the letter is not `'a'`; stop at the first `'a'` or at the end.",
        ],
        why: "The leading `a`s cannot get smaller, and touching any of them makes that position a `z`, so the earliest position we can improve is the first non-`a`; improving it beats every string that leaves it alone. Continuing over further non-`a` letters only makes more positions smaller, while including an `a` would make that position larger, so the block stops right before the next `a`. When the string is all `a`s some letter must become `z`, and putting it at the last position keeps the longest possible prefix of `a`s.",
        time: "O(n)",
        space: "O(n) for the output",
        pitfalls: [
          "The operation is mandatory — an all-`a` string cannot stay unchanged.",
          "Do not continue past an `a`: it would wrap around to `z`.",
          "Only one substring may be chosen, so only the first non-`a` block changes.",
        ],
      }),
      examples: [
        { input: "\"kairo\"", expectedOutput: "jairo" },
        { input: "\"abba\"", expectedOutput: "aaaa" },
        { input: "\"aaa\"", expectedOutput: "aaz" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "a", "aab", "az", LOWER]);
        const s = randLower(rng, 1, rng() < 0.2 ? 30 : 12, alpha);
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: code`
          def smallestString(s: str) -> str:
              a = list(s)
              n = len(a)
              i = 0
              while i < n and a[i] == "a":
                  i += 1
              if i == n:
                  a[-1] = "z"
                  return "".join(a)
              while i < n and a[i] != "a":
                  a[i] = chr(ord(a[i]) - 1)
                  i += 1
              return "".join(a)
        `,
        javascript: code`
          var smallestString = function(s) {
              var a = s.split(""), n = a.length, i = 0;
              while (i < n && a[i] === "a") i++;
              if (i === n) {
                  a[n - 1] = "z";
                  return a.join("");
              }
              while (i < n && a[i] !== "a") {
                  a[i] = String.fromCharCode(a[i].charCodeAt(0) - 1);
                  i++;
              }
              return a.join("");
          };
        `,
        typescript: code`
          function smallestString(s: string): string {
              var a: string[] = s.split("");
              var n = a.length, i = 0;
              while (i < n && a[i] === "a") i++;
              if (i === n) {
                  a[n - 1] = "z";
                  return a.join("");
              }
              while (i < n && a[i] !== "a") {
                  a[i] = String.fromCharCode(a[i].charCodeAt(0) - 1);
                  i++;
              }
              return a.join("");
          }
        `,
        java: code`
          public static String smallestString(String s) {
              char[] a = s.toCharArray();
              int n = a.length, i = 0;
              while (i < n && a[i] == 'a') i++;
              if (i == n) {
                  a[n - 1] = 'z';
                  return new String(a);
              }
              while (i < n && a[i] != 'a') {
                  a[i]--;
                  i++;
              }
              return new String(a);
          }
        `,
        cpp: code`
          string smallestString(string s) {
              int n = s.size(), i = 0;
              while (i < n && s[i] == 'a') i++;
              if (i == n) {
                  s[n - 1] = 'z';
                  return s;
              }
              while (i < n && s[i] != 'a') {
                  s[i]--;
                  i++;
              }
              return s;
          }
        `,
        c: code`
          char* smallestString(const char* s) {
              int n = strlen(s);
              char* out = (char*)malloc(n + 1);
              memcpy(out, s, n + 1);
              int i = 0;
              while (i < n && out[i] == 'a') i++;
              if (i == n) {
                  out[n - 1] = 'z';
                  return out;
              }
              while (i < n && out[i] != 'a') {
                  out[i]--;
                  i++;
              }
              return out;
          }
        `,
        csharp: code`
          public static string SmallestString(string s)
          {
              char[] a = s.ToCharArray();
              int n = a.Length, i = 0;
              while (i < n && a[i] == 'a') i++;
              if (i == n)
              {
                  a[n - 1] = 'z';
                  return new string(a);
              }
              while (i < n && a[i] != 'a')
              {
                  a[i]--;
                  i++;
              }
              return new string(a);
          }
        `,
        go: code`
          func smallestString(s string) string {
          	a := []byte(s)
          	n, i := len(a), 0
          	for i < n && a[i] == 'a' {
          		i++
          	}
          	if i == n {
          		a[n-1] = 'z'
          		return string(a)
          	}
          	for i < n && a[i] != 'a' {
          		a[i]--
          		i++
          	}
          	return string(a)
          }
        `,
        kotlin: code`
          fun smallestString(s: String): String {
              val a = s.toCharArray()
              val n = a.size
              var i = 0
              while (i < n && a[i] == 'a') i++
              if (i == n) {
                  a[n - 1] = 'z'
                  return String(a)
              }
              while (i < n && a[i] != 'a') {
                  a[i] = a[i] - 1
                  i++
              }
              return String(a)
          }
        `,
        swift: code`
          func smallestString(_ s: String) -> String {
              var a = Array(s.utf8)
              let n = a.count
              var i = 0
              while i < n && a[i] == 97 { i += 1 }
              if i == n {
                  a[n - 1] = 122
                  return String(decoding: a, as: UTF8.self)
              }
              while i < n && a[i] != 97 {
                  a[i] -= 1
                  i += 1
              }
              return String(decoding: a, as: UTF8.self)
          }
        `,
        rust: code`
          fn smallestString(s: String) -> String {
              let mut a = s.into_bytes();
              let n = a.len();
              let mut i = 0;
              while i < n && a[i] == b'a' {
                  i += 1;
              }
              if i == n {
                  a[n - 1] = b'z';
                  return String::from_utf8(a).unwrap();
              }
              while i < n && a[i] != b'a' {
                  a[i] -= 1;
                  i += 1;
              }
              String::from_utf8(a).unwrap()
          }
        `,
        php: code`
          function smallestString($s) {
              $n = strlen($s);
              $i = 0;
              while ($i < $n && $s[$i] === "a") $i++;
              if ($i == $n) {
                  $s[$n - 1] = "z";
                  return $s;
              }
              while ($i < $n && $s[$i] !== "a") {
                  $s[$i] = chr(ord($s[$i]) - 1);
                  $i++;
              }
              return $s;
          }
        `,
        ruby: code`
          def smallestString(s)
            a = s.dup
            n = a.length
            i = 0
            i += 1 while i < n && a[i] == "a"
            if i == n
              a[n - 1] = "z"
              return a
            end
            while i < n && a[i] != "a"
              a[i] = (a.getbyte(i) - 1).chr
              i += 1
            end
            a
          end
        `,
      },
    };
  })(),

];
