/**
 * Dynamic programming II (hard) — wave 6.
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Hard DP is where the judge's budget bites (5,000 cases, one process, 15 CPU
 * seconds, Python/Ruby/PHP ~30× slower than V8): every generator below keeps
 * its sizes small even where the stated constraints are LeetCode's, and each
 * reference is an independent formulation (brute force where it fits) rather
 * than a copy of the solutions.
 */
import {
  code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const DP7_PROBLEMS: CatalogProblem[] = [

  // ── Decode Ways II (LC 639) ─────────────────────────────────────
  (() => {
    // Enumerates the actual digits each character may stand for, rather than
    // the solutions' closed-form counts per pattern.
    const ref = (s: string) => {
      const MOD = 1000000007;
      const fits = (c: string, d: number) => (c === "*" ? d >= 1 && d <= 9 : c.charCodeAt(0) - 48 === d);
      const dp: number[] = new Array(s.length + 1).fill(0);
      dp[0] = 1;
      for (let i = 1; i <= s.length; i++) {
        let v = 0;
        for (let d = 1; d <= 9; d++) if (fits(s[i - 1], d)) v += dp[i - 1];
        if (i >= 2) {
          for (let c = 10; c <= 26; c++) {
            if (fits(s[i - 2], Math.floor(c / 10)) && fits(s[i - 1], c % 10)) v += dp[i - 2];
          }
        }
        dp[i] = v % MOD;
      }
      return dp[s.length];
    };
    return {
      slug: "decode-ways-ii",
      title: "Decode Ways II",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Google", "Meta", "Amazon"],
      signature: { funcName: "numDecodings", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A message written in capital letters is encoded by replacing every letter with its position in the alphabet: `A` becomes `\"1\"`, `B` becomes `\"2\"`, …, `Z` becomes `\"26\"`. Decoding splits the digit string into groups that each name one letter — a group is either a single digit `1`–`9` or two digits forming a number from `10` to `26`. A group can never start with `0`, so `\"06\"` is not a letter.\n\n" +
        "The encoded string `s` may also contain the wildcard `*`, which stands for **any single digit from `1` to `9`** (never `0`). Every choice of digits for the wildcards combined with every valid grouping counts as a separate decoding.\n\n" +
        "Return the number of ways to decode `s`. The count grows quickly, so return it **modulo** `10^9 + 7`.",
        [
          { in: "s = \"*\"", out: "9", note: "The wildcard is one of `1`–`9`, and each of those is one letter (`A`–`I`)." },
          { in: "s = \"1*\"", out: "18", note: "`\"11\"`…`\"19\"` are 9 strings, and each decodes two ways: as two single digits or as one two-digit group." },
          { in: "s = \"*0\"", out: "2", note: "A lone `0` is never a letter, so the pair must be one group: `\"10\"` (J) or `\"20\"` (T)." },
        ],
        ["1 <= s.length <= 10^5", "s[i] is a digit or '*'"]),
      hints: [
        "Let `f(i)` be the number of decodings of the first `i` characters. The last group is either the last character alone or the last two characters together.",
        "Count how many letters a single character can be (`*` → 9, `0` → 0, any other digit → 1) and how many valid two-digit codes a pair of characters can be.",
        "For a pair: `**` → 15 (11–19 and 21–26), `*d` → 2 when `d ≤ 6` and 1 otherwise, `1*` → 9, `2*` → 6, two digits → 1 if they form 10–26. Then `f(i) = single · f(i-1) + pair · f(i-2)`, reduced modulo 10^9 + 7.",
      ],
      editorial: explain({
        idea: "It is the classic Decode Ways recurrence — the last group is one character or two — except that each option now comes with a **multiplicity**: the number of digit choices that make that group a valid letter. Multiply each branch by its multiplicity and the wildcards are handled without ever expanding them.",
        steps: [
          "Define `single(c)`: 9 for `*`, 0 for `0`, 1 for any other digit.",
          "Define `pair(a, b)`: for `a = *` it is 15 if `b = *`, else 2 when `b ≤ 6` (1b and 2b) and 1 otherwise (only 1b); for `a = 1` it is 9 if `b = *` else 1; for `a = 2` it is 6 if `b = *` else 1 when `b ≤ 6` and 0 otherwise; any other `a` gives 0.",
          "Keep the last two values: `f(0) = 1`, `f(1) = single(s[0])`.",
          "For every next index `i`: `f(i+1) = (single(s[i]) · f(i) + pair(s[i-1], s[i]) · f(i-1)) mod (10^9 + 7)`.",
          "Return the final value.",
        ],
        why: "Every decoding ends with exactly one of the two group shapes, and the choices for the last group are independent of how the prefix before it was decoded, so the count for a prefix is the sum over both shapes of (ways to fill the last group) × (ways to decode what precedes it). The multiplicities are just the number of two-digit numbers in 10–26 (or digits in 1–9) that match the pattern, which is what the small table enumerates.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`*` never stands for `0`, so `**` is 15, not 17 — `10` and `20` are not reachable.",
          "`*` followed by a digit `d ≤ 6` (including `0`) has two readings, `1d` and `2d`; with `d ≥ 7` only `1d` works.",
          "The products reach about 2.4 · 10^10 before the modulus, so use 64-bit integers in Java, C, C#, Kotlin and Rust.",
        ],
      }),
      examples: [
        { input: "\"*\"", expectedOutput: "9" },
        { input: "\"1*\"", expectedOutput: "18" },
        { input: "\"*0\"", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const len = pick(rng, [ri(rng, 1, 3), ri(rng, 1, 10), ri(rng, 8, 40), ri(rng, 30, 250)]);
        const alphabet = pick(rng, ["*", "*1", "*12", "*0", "0123456789*", "12*", "1234567*", "*26", "*10", "*1*2*7", "**1"]);
        let s = "";
        for (let i = 0; i < len; i++) s += alphabet[ri(rng, 0, alphabet.length - 1)];
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def numDecodings(s: str) -> int:
              MOD = 10 ** 9 + 7

              def single(c):
                  if c == '*':
                      return 9
                  return 0 if c == '0' else 1

              def pair(a, b):
                  if a == '*':
                      if b == '*':
                          return 15
                      return 2 if b <= '6' else 1
                  if a == '1':
                      return 9 if b == '*' else 1
                  if a == '2':
                      if b == '*':
                          return 6
                      return 1 if b <= '6' else 0
                  return 0

              prev2, prev1 = 1, single(s[0])
              for i in range(1, len(s)):
                  prev2, prev1 = prev1, (single(s[i]) * prev1 + pair(s[i - 1], s[i]) * prev2) % MOD
              return prev1
        `,
        javascript: code`
          var numDecodings = function(s) {
              var MOD = 1000000007;
              var single = function(c) {
                  if (c === '*') return 9;
                  return c === '0' ? 0 : 1;
              };
              var pair = function(a, b) {
                  if (a === '*') {
                      if (b === '*') return 15;
                      return b <= '6' ? 2 : 1;
                  }
                  if (a === '1') return b === '*' ? 9 : 1;
                  if (a === '2') {
                      if (b === '*') return 6;
                      return b <= '6' ? 1 : 0;
                  }
                  return 0;
              };
              var prev2 = 1, prev1 = single(s[0]);
              for (var i = 1; i < s.length; i++) {
                  var cur = (single(s[i]) * prev1 + pair(s[i - 1], s[i]) * prev2) % MOD;
                  prev2 = prev1;
                  prev1 = cur;
              }
              return prev1;
          };
        `,
        typescript: code`
          function decodeSingle(c: string): number {
              if (c === "*") return 9;
              return c === "0" ? 0 : 1;
          }

          function decodePair(a: string, b: string): number {
              if (a === "*") {
                  if (b === "*") return 15;
                  return b <= "6" ? 2 : 1;
              }
              if (a === "1") return b === "*" ? 9 : 1;
              if (a === "2") {
                  if (b === "*") return 6;
                  return b <= "6" ? 1 : 0;
              }
              return 0;
          }

          function numDecodings(s: string): number {
              var MOD = 1000000007;
              var prev2 = 1, prev1 = decodeSingle(s.charAt(0));
              for (var i = 1; i < s.length; i++) {
                  var cur = (decodeSingle(s.charAt(i)) * prev1 + decodePair(s.charAt(i - 1), s.charAt(i)) * prev2) % MOD;
                  prev2 = prev1;
                  prev1 = cur;
              }
              return prev1;
          }
        `,
        java: code`
          static long decodeSingle(char c) {
              if (c == '*') return 9;
              return c == '0' ? 0 : 1;
          }

          static long decodePair(char a, char b) {
              if (a == '*') {
                  if (b == '*') return 15;
                  return b <= '6' ? 2 : 1;
              }
              if (a == '1') return b == '*' ? 9 : 1;
              if (a == '2') {
                  if (b == '*') return 6;
                  return b <= '6' ? 1 : 0;
              }
              return 0;
          }

          public static int numDecodings(String s) {
              final long MOD = 1000000007L;
              long prev2 = 1, prev1 = decodeSingle(s.charAt(0));
              for (int i = 1; i < s.length(); i++) {
                  long cur = (decodeSingle(s.charAt(i)) * prev1 + decodePair(s.charAt(i - 1), s.charAt(i)) * prev2) % MOD;
                  prev2 = prev1;
                  prev1 = cur;
              }
              return (int) prev1;
          }
        `,
        cpp: code`
          long long decodeSingle(char c) {
              if (c == '*') return 9;
              return c == '0' ? 0 : 1;
          }

          long long decodePair(char a, char b) {
              if (a == '*') {
                  if (b == '*') return 15;
                  return b <= '6' ? 2 : 1;
              }
              if (a == '1') return b == '*' ? 9 : 1;
              if (a == '2') {
                  if (b == '*') return 6;
                  return b <= '6' ? 1 : 0;
              }
              return 0;
          }

          int numDecodings(string s) {
              const long long MOD = 1000000007LL;
              long long prev2 = 1, prev1 = decodeSingle(s[0]);
              for (size_t i = 1; i < s.size(); i++) {
                  long long cur = (decodeSingle(s[i]) * prev1 + decodePair(s[i - 1], s[i]) * prev2) % MOD;
                  prev2 = prev1;
                  prev1 = cur;
              }
              return (int)prev1;
          }
        `,
        c: code`
          static long long decodeSingle(char c) {
              if (c == '*') return 9;
              return c == '0' ? 0 : 1;
          }

          static long long decodePair(char a, char b) {
              if (a == '*') {
                  if (b == '*') return 15;
                  return b <= '6' ? 2 : 1;
              }
              if (a == '1') return b == '*' ? 9 : 1;
              if (a == '2') {
                  if (b == '*') return 6;
                  return b <= '6' ? 1 : 0;
              }
              return 0;
          }

          int numDecodings(const char* s) {
              const long long MOD = 1000000007LL;
              int n = (int)strlen(s);
              long long prev2 = 1, prev1 = decodeSingle(s[0]);
              for (int i = 1; i < n; i++) {
                  long long cur = (decodeSingle(s[i]) * prev1 + decodePair(s[i - 1], s[i]) * prev2) % MOD;
                  prev2 = prev1;
                  prev1 = cur;
              }
              return (int)prev1;
          }
        `,
        csharp: code`
          static long DecodeSingle(char c)
          {
              if (c == '*') return 9;
              return c == '0' ? 0 : 1;
          }

          static long DecodePair(char a, char b)
          {
              if (a == '*')
              {
                  if (b == '*') return 15;
                  return b <= '6' ? 2 : 1;
              }
              if (a == '1') return b == '*' ? 9 : 1;
              if (a == '2')
              {
                  if (b == '*') return 6;
                  return b <= '6' ? 1 : 0;
              }
              return 0;
          }

          public static int NumDecodings(string s)
          {
              const long MOD = 1000000007L;
              long prev2 = 1, prev1 = DecodeSingle(s[0]);
              for (int i = 1; i < s.Length; i++)
              {
                  long cur = (DecodeSingle(s[i]) * prev1 + DecodePair(s[i - 1], s[i]) * prev2) % MOD;
                  prev2 = prev1;
                  prev1 = cur;
              }
              return (int)prev1;
          }
        `,
        go: code`
          func decodeSingle(c byte) int {
              if c == '*' {
                  return 9
              }
              if c == '0' {
                  return 0
              }
              return 1
          }

          func decodePair(a, b byte) int {
              if a == '*' {
                  if b == '*' {
                      return 15
                  }
                  if b <= '6' {
                      return 2
                  }
                  return 1
              }
              if a == '1' {
                  if b == '*' {
                      return 9
                  }
                  return 1
              }
              if a == '2' {
                  if b == '*' {
                      return 6
                  }
                  if b <= '6' {
                      return 1
                  }
                  return 0
              }
              return 0
          }

          func numDecodings(s string) int {
              const mod = 1000000007
              prev2, prev1 := 1, decodeSingle(s[0])
              for i := 1; i < len(s); i++ {
                  cur := (decodeSingle(s[i])*prev1 + decodePair(s[i-1], s[i])*prev2) % mod
                  prev2, prev1 = prev1, cur
              }
              return prev1
          }
        `,
        kotlin: code`
          fun decodeSingle(c: Char): Long = if (c == '*') 9L else if (c == '0') 0L else 1L

          fun decodePair(a: Char, b: Char): Long {
              if (a == '*') {
                  if (b == '*') return 15L
                  return if (b <= '6') 2L else 1L
              }
              if (a == '1') return if (b == '*') 9L else 1L
              if (a == '2') {
                  if (b == '*') return 6L
                  return if (b <= '6') 1L else 0L
              }
              return 0L
          }

          fun numDecodings(s: String): Int {
              val modulus = 1000000007L
              var prev2 = 1L
              var prev1 = decodeSingle(s[0])
              for (i in 1 until s.length) {
                  val cur = (decodeSingle(s[i]) * prev1 + decodePair(s[i - 1], s[i]) * prev2) % modulus
                  prev2 = prev1
                  prev1 = cur
              }
              return prev1.toInt()
          }
        `,
        swift: code`
          func decodeSingle(_ c: Character) -> Int {
              if c == "*" { return 9 }
              return c == "0" ? 0 : 1
          }

          func decodePair(_ a: Character, _ b: Character) -> Int {
              if a == "*" {
                  if b == "*" { return 15 }
                  return b <= "6" ? 2 : 1
              }
              if a == "1" { return b == "*" ? 9 : 1 }
              if a == "2" {
                  if b == "*" { return 6 }
                  return b <= "6" ? 1 : 0
              }
              return 0
          }

          func numDecodings(_ s: String) -> Int {
              let modulus = 1000000007
              let chars = Array(s)
              var prev2 = 1
              var prev1 = decodeSingle(chars[0])
              var i = 1
              while i < chars.count {
                  let cur = (decodeSingle(chars[i]) * prev1 + decodePair(chars[i - 1], chars[i]) * prev2) % modulus
                  prev2 = prev1
                  prev1 = cur
                  i += 1
              }
              return prev1
          }
        `,
        rust: code`
          fn decode_single(c: u8) -> i64 {
              if c == b'*' {
                  9
              } else if c == b'0' {
                  0
              } else {
                  1
              }
          }

          fn decode_pair(a: u8, b: u8) -> i64 {
              if a == b'*' {
                  if b == b'*' { 15 } else if b <= b'6' { 2 } else { 1 }
              } else if a == b'1' {
                  if b == b'*' { 9 } else { 1 }
              } else if a == b'2' {
                  if b == b'*' { 6 } else if b <= b'6' { 1 } else { 0 }
              } else {
                  0
              }
          }

          fn numDecodings(s: String) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let b = s.as_bytes();
              let mut prev2: i64 = 1;
              let mut prev1: i64 = decode_single(b[0]);
              for i in 1..b.len() {
                  let cur = (decode_single(b[i]) * prev1 + decode_pair(b[i - 1], b[i]) * prev2) % modulus;
                  prev2 = prev1;
                  prev1 = cur;
              }
              prev1 as i32
          }
        `,
        php: code`
          function decodeSingle($c) {
              if ($c === '*') return 9;
              return $c === '0' ? 0 : 1;
          }

          function decodePair($a, $b) {
              if ($a === '*') {
                  if ($b === '*') return 15;
                  return $b <= '6' ? 2 : 1;
              }
              if ($a === '1') return $b === '*' ? 9 : 1;
              if ($a === '2') {
                  if ($b === '*') return 6;
                  return $b <= '6' ? 1 : 0;
              }
              return 0;
          }

          function numDecodings($s) {
              $modulus = 1000000007;
              $n = strlen($s);
              $prev2 = 1;
              $prev1 = decodeSingle($s[0]);
              for ($i = 1; $i < $n; $i++) {
                  $cur = (decodeSingle($s[$i]) * $prev1 + decodePair($s[$i - 1], $s[$i]) * $prev2) % $modulus;
                  $prev2 = $prev1;
                  $prev1 = $cur;
              }
              return $prev1;
          }
        `,
        ruby: code`
          def decode_single(c)
            return 9 if c == '*'
            c == '0' ? 0 : 1
          end

          def decode_pair(a, b)
            if a == '*'
              return 15 if b == '*'
              return b <= '6' ? 2 : 1
            end
            if a == '1'
              return b == '*' ? 9 : 1
            end
            if a == '2'
              return 6 if b == '*'
              return b <= '6' ? 1 : 0
            end
            0
          end

          def numDecodings(s)
            modulus = 1_000_000_007
            prev2 = 1
            prev1 = decode_single(s[0])
            (1...s.length).each do |i|
              cur = (decode_single(s[i]) * prev1 + decode_pair(s[i - 1], s[i]) * prev2) % modulus
              prev2 = prev1
              prev1 = cur
            end
            prev1
          end
        `,
      },
    };
  })(),

  // ── Arithmetic Slices II - Subsequence (LC 446) ─────────────────
  (() => {
    // Pair DP over (second-to-last, last) index with a linear scan for the
    // predecessor — no hashing, unlike the solutions.
    const ref = (nums: number[]) => {
      const n = nums.length;
      const weak: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
      let total = 0;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < i; j++) {
          const need = 2 * nums[j] - nums[i];
          let c = 0;
          for (let k = 0; k < j; k++) if (nums[k] === need) c += weak[j][k];
          weak[i][j] = c + 1;
          total += c;
        }
      }
      return total;
    };
    const EXTREMES = [-2147483648, 2147483647, 0, -1, 1, 1073741823, -1073741824];
    return {
      slug: "arithmetic-slices-ii-subsequence",
      title: "Arithmetic Slices II - Subsequence",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Hash Table", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "numberOfArithmeticSlices", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A sequence is **arithmetic** when it has **at least three** elements and every two neighbours differ by the same amount. `[4,4,4]`, `[7,10,13]` and `[3,-1,-5,-9]` are arithmetic; `[1,2,4]` and `[5,8]` are not.\n\n" +
        "Given an integer array `nums`, count its arithmetic **subsequences**. A subsequence keeps the original order but may skip elements. Two subsequences are different when they use different sets of indices, even if they hold the same values.\n\n" +
        "The answer is guaranteed to fit in a 32-bit signed integer.",
        [
          { in: "nums = [2,4,6,8,10]", out: "7", note: "`[2,4,6]`, `[4,6,8]`, `[6,8,10]`, `[2,4,6,8]`, `[4,6,8,10]`, `[2,4,6,8,10]` and `[2,6,10]`." },
          { in: "nums = [5,5,5,5]", out: "5", note: "Any three of the four positions (4 ways) and all four together." },
          { in: "nums = [9,6,3,7,0]", out: "3", note: "`[9,6,3]`, `[6,3,0]` and `[9,6,3,0]` — the `7` never fits." },
        ],
        ["1 <= nums.length <= 1000", "-2^31 <= nums[i] <= 2^31 - 1", "the answer fits in a 32-bit signed integer"]),
      hints: [
        "Build subsequences left to right: an arithmetic subsequence ending at index `i` with common difference `d` extends one that ends at some `j < i` with the same `d`.",
        "Also count the 'weak' ones of length 2. Every pair `(j, i)` starts one, and a real answer is exactly a weak subsequence that gets extended at least once.",
        "For each index keep a map from difference to the number of weak subsequences ending there. For every `j < i` with `d = nums[i] - nums[j]`: add `count[j][d]` to the answer, then add `count[j][d] + 1` to `count[i][d]`.",
      ],
      editorial: explain({
        idea: "Track **weak** arithmetic subsequences — length two or more. Length-2 ones are easy to start (every pair is one), and a length-≥3 one is precisely a weak subsequence ending at `j` with difference `d`, extended by an element `nums[i]` with `nums[i] - nums[j] = d`.",
        steps: [
          "Give every index `i` a hash map `count[i]` from difference to the number of weak subsequences ending at `i` with that difference.",
          "For each `i` and each `j < i`, let `d = nums[i] - nums[j]` (in 64 bits).",
          "Every weak subsequence counted in `count[j][d]` extends to a subsequence of length ≥ 3 ending at `i`: add `count[j][d]` to the answer.",
          "Record the new weak subsequences ending at `i`: `count[i][d] += count[j][d] + 1` (the extensions plus the pair `(j, i)` itself).",
          "Return the accumulated answer.",
        ],
        why: "Each arithmetic subsequence is identified by its last two indices `(j, i)` and its prefix ending at `j`. When the pair `(j, i)` is processed, `count[j][d]` already holds every weak subsequence ending at `j` with difference `d` (all of them end at indices below `i`), so each arithmetic subsequence is added to the answer exactly once — at the moment its last element is appended — and length-2 pairs never reach the answer because they are added to `count[i]` only.",
        time: "O(n^2)",
        space: "O(n^2)",
        pitfalls: [
          "Differences of values near ±2^31 overflow 32 bits — compute `d` in 64-bit arithmetic.",
          "Add `count[j][d]` to the answer, not `count[j][d] + 1`: the bare pair has length 2.",
          "Equal values are fine: `d = 0` is a valid difference, and duplicates are different subsequences because their indices differ.",
        ],
      }),
      examples: [
        { input: "[2,4,6,8,10]", expectedOutput: "7" },
        { input: "[5,5,5,5]", expectedOutput: "5" },
        { input: "[9,6,3,7,0]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        // n <= 30 keeps every answer below 2^31 (all-equal maximises it).
        const n = pick(rng, [ri(rng, 1, 4), ri(rng, 3, 12), ri(rng, 10, 30)]);
        const kind = ri(rng, 0, 5);
        let nums: number[];
        if (kind === 0) nums = Array.from({ length: n }, () => ri(rng, -3, 3));
        else if (kind === 1) { const v = ri(rng, -5, 5); nums = new Array(n).fill(v); }
        else if (kind === 2 || kind === 3) {
          const a = ri(rng, -50, 50), d = ri(rng, -6, 6);
          nums = Array.from({ length: n }, (_, i) => a + d * i + (rng() < 0.3 ? ri(rng, -2, 2) : 0));
          if (rng() < 0.5) shuffle(rng, nums);
        } else if (kind === 4) nums = Array.from({ length: n }, () => pick(rng, EXTREMES));
        else nums = Array.from({ length: n }, () => ri(rng, 1, 20));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numberOfArithmeticSlices(nums: List[int]) -> int:
              n = len(nums)
              count = [dict() for _ in range(n)]
              total = 0
              for i in range(n):
                  here = count[i]
                  for j in range(i):
                      d = nums[i] - nums[j]
                      c = count[j].get(d, 0)
                      total += c
                      here[d] = here.get(d, 0) + c + 1
              return total
        `,
        javascript: code`
          var numberOfArithmeticSlices = function(nums) {
              var n = nums.length, total = 0;
              var count = [];
              for (var i = 0; i < n; i++) {
                  var here = new Map();
                  count.push(here);
                  for (var j = 0; j < i; j++) {
                      var d = nums[i] - nums[j];
                      var c = count[j].get(d) || 0;
                      total += c;
                      here.set(d, (here.get(d) || 0) + c + 1);
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function numberOfArithmeticSlices(nums: number[]): number {
              var n = nums.length, total = 0;
              var count: { [d: string]: number }[] = [];
              for (var i = 0; i < n; i++) {
                  var here: { [d: string]: number } = {};
                  count.push(here);
                  for (var j = 0; j < i; j++) {
                      var key = "" + (nums[i] - nums[j]);
                      var c = count[j].hasOwnProperty(key) ? count[j][key] : 0;
                      total += c;
                      here[key] = (here.hasOwnProperty(key) ? here[key] : 0) + c + 1;
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int numberOfArithmeticSlices(int[] nums) {
              int n = nums.length;
              long total = 0;
              List<Map<Long, Long>> count = new ArrayList<>();
              for (int i = 0; i < n; i++) {
                  Map<Long, Long> here = new HashMap<>();
                  count.add(here);
                  for (int j = 0; j < i; j++) {
                      long d = (long) nums[i] - nums[j];
                      long c = count.get(j).getOrDefault(d, 0L);
                      total += c;
                      here.put(d, here.getOrDefault(d, 0L) + c + 1);
                  }
              }
              return (int) total;
          }
        `,
        cpp: code`
          int numberOfArithmeticSlices(vector<int>& nums) {
              int n = nums.size();
              long long total = 0;
              vector<unordered_map<long long, long long>> count(n);
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < i; j++) {
                      long long d = (long long)nums[i] - nums[j];
                      auto it = count[j].find(d);
                      long long c = it == count[j].end() ? 0 : it->second;
                      total += c;
                      count[i][d] += c + 1;
                  }
              }
              return (int)total;
          }
        `,
        c: code`
          int numberOfArithmeticSlices(int* nums, int numsSize) {
              int n = numsSize;
              if (n < 3) return 0;
              /* weak[i*n+j]: subsequences of length >= 2 whose last two indices are j < i. */
              long long* weak = (long long*)calloc((size_t)n * n, sizeof(long long));
              long long total = 0;
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < i; j++) {
                      long long need = 2LL * nums[j] - nums[i];
                      long long c = 0;
                      for (int k = 0; k < j; k++) {
                          if ((long long)nums[k] == need) c += weak[(size_t)j * n + k];
                      }
                      weak[(size_t)i * n + j] = c + 1;
                      total += c;
                  }
              }
              free(weak);
              return (int)total;
          }
        `,
        csharp: code`
          public static int NumberOfArithmeticSlices(int[] nums)
          {
              int n = nums.Length;
              long total = 0;
              var count = new Dictionary<long, long>[n];
              for (int i = 0; i < n; i++)
              {
                  count[i] = new Dictionary<long, long>();
                  for (int j = 0; j < i; j++)
                  {
                      long d = (long)nums[i] - nums[j];
                      long c;
                      count[j].TryGetValue(d, out c);
                      total += c;
                      long cur;
                      count[i].TryGetValue(d, out cur);
                      count[i][d] = cur + c + 1;
                  }
              }
              return (int)total;
          }
        `,
        go: code`
          func numberOfArithmeticSlices(nums []int) int {
              n := len(nums)
              total := 0
              count := make([]map[int]int, n)
              for i := 0; i < n; i++ {
                  count[i] = map[int]int{}
                  for j := 0; j < i; j++ {
                      d := nums[i] - nums[j]
                      c := count[j][d]
                      total += c
                      count[i][d] += c + 1
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun numberOfArithmeticSlices(nums: IntArray): Int {
              val n = nums.size
              var total = 0L
              val count = Array(n) { HashMap<Long, Long>() }
              for (i in 0 until n) {
                  for (j in 0 until i) {
                      val d = nums[i].toLong() - nums[j].toLong()
                      val c = count[j][d] ?: 0L
                      total += c
                      count[i][d] = (count[i][d] ?: 0L) + c + 1L
                  }
              }
              return total.toInt()
          }
        `,
        swift: code`
          func numberOfArithmeticSlices(_ nums: [Int]) -> Int {
              let n = nums.count
              var total = 0
              var count = [[Int: Int]](repeating: [:], count: n)
              for i in 0..<n {
                  for j in 0..<i {
                      let d = nums[i] - nums[j]
                      let c = count[j][d] ?? 0
                      total += c
                      count[i][d] = (count[i][d] ?? 0) + c + 1
                  }
              }
              return total
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn numberOfArithmeticSlices(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut total: i64 = 0;
              let mut count: Vec<HashMap<i64, i64>> = vec![HashMap::new(); n];
              for i in 0..n {
                  for j in 0..i {
                      let d = nums[i] as i64 - nums[j] as i64;
                      let c = *count[j].get(&d).unwrap_or(&0);
                      total += c;
                      *count[i].entry(d).or_insert(0) += c + 1;
                  }
              }
              total as i32
          }
        `,
        php: code`
          function numberOfArithmeticSlices($nums) {
              $n = count($nums);
              $total = 0;
              $cnt = array_fill(0, $n, []);
              for ($i = 0; $i < $n; $i++) {
                  for ($j = 0; $j < $i; $j++) {
                      $d = $nums[$i] - $nums[$j];
                      $c = isset($cnt[$j][$d]) ? $cnt[$j][$d] : 0;
                      $total += $c;
                      $cnt[$i][$d] = (isset($cnt[$i][$d]) ? $cnt[$i][$d] : 0) + $c + 1;
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def numberOfArithmeticSlices(nums)
            n = nums.length
            total = 0
            count = Array.new(n) { Hash.new(0) }
            (0...n).each do |i|
              (0...i).each do |j|
                d = nums[i] - nums[j]
                c = count[j][d]
                total += c
                count[i][d] += c + 1
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Maximum Sum of 3 Non-Overlapping Subarrays (LC 689) ─────────
  (() => {
    // Every triple of window starts, scanned in lexicographic order with a
    // strict improvement test — the lexicographically smallest optimum wins.
    const ref = (nums: number[], k: number) => {
      const m = nums.length - k + 1;
      const win: number[] = [];
      for (let i = 0; i < m; i++) {
        let s = 0;
        for (let t = i; t < i + k; t++) s += nums[t];
        win.push(s);
      }
      let best = -1, ans: number[] = [];
      for (let a = 0; a < m; a++) {
        for (let b = a + k; b < m; b++) {
          for (let c = b + k; c < m; c++) {
            const t = win[a] + win[b] + win[c];
            if (t > best) { best = t; ans = [a, b, c]; }
          }
        }
      }
      return ans;
    };
    return {
      slug: "maximum-sum-of-3-non-overlapping-subarrays",
      title: "Maximum Sum of 3 Non-Overlapping Subarrays",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Prefix Sum", "Sliding Window", "Meta", "Google", "Amazon"],
      signature: {
        funcName: "maxSumOfThreeSubarrays",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "Given an integer array `nums` and an integer `k`, choose **three non-overlapping subarrays**, each of length exactly `k`, whose elements add up to the largest possible total.\n\n" +
        "Return the 0-indexed **starting positions** of the three subarrays in increasing order. When several choices reach the same maximum total, return the one whose list of positions is **lexicographically smallest**.",
        [
          { in: "nums = [3,1,3,1,8,9,4,1], k = 2", out: "[0,3,5]", note: "The window sums are `[4,4,4,9,17,13,5]`. The best total is 26, reached by `[0,3,5]`, `[1,3,5]`, `[0,4,6]` and others; `[0,3,5]` is the smallest." },
          { in: "nums = [2,2,2,2,2,2], k = 1", out: "[0,1,2]", note: "Every choice totals 6, so the earliest positions win." },
          { in: "nums = [4,5,10,6,11,17,4,11,1,3], k = 1", out: "[4,5,7]", note: "The three largest single values are 11, 17 and 11." },
        ],
        ["1 <= nums.length <= 2 * 10^4", "1 <= nums[i] < 2^16", "1 <= k <= floor(nums.length / 3)"]),
      hints: [
        "Precompute the sum of every window of length `k`. Now pick three window starts `a < b < c` with `b ≥ a + k` and `c ≥ b + k`.",
        "Fix the middle window `b`. The best left window is the best one starting anywhere in `[0, b - k]`; the best right window is the best one starting in `[b + k, last]`.",
        "Precompute the position of the best window on every prefix and on every suffix — keeping the **leftmost** one on ties — then scan `b` from left to right and replace the answer only on a **strictly** larger total.",
      ],
      editorial: explain({
        idea: "Once window sums are known, the three windows interact only through the middle one: for a fixed middle start `b`, the left and right choices are independent maximisations over a prefix and a suffix of the window array. Prefix and suffix argmax tables make each middle choice O(1).",
        steps: [
          "Compute `win[i]`, the sum of `nums[i..i+k-1]`, for every start `i` with a sliding window.",
          "`left[i]` = the start of a maximal window among `win[0..i]`, keeping the earliest on ties (update only on `>`).",
          "`right[i]` = the start of a maximal window among `win[i..]`, keeping the earliest on ties (scanning right to left, update on `>=`).",
          "For every middle start `b` from `k` to `len(win) - 1 - k`: the candidate is `(left[b-k], b, right[b+k])`.",
          "Keep the first candidate with the largest total, replacing it only on a strictly larger total. Return it.",
        ],
        why: "For a fixed middle window the total is `win[a] + win[b] + win[c]` with `a ≤ b - k` and `c ≥ b + k`, so choosing the best `a` and the best `c` independently is optimal. The tie rules give the lexicographically smallest optimum: suppose an optimal triple used a smaller `a'` with a later middle `b'`; then `a'` lies outside `[0, b - k]` for the first optimal middle `b` (otherwise the leftmost-argmax rule would have chosen it), which forces `a' > b - k ≥ a` — a contradiction. The same argument applies to `b` and `c`.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The suffix table must prefer the leftmost window on ties — update on `>=` while scanning right to left.",
          "The outer scan must replace only on a strictly larger total, or a later middle window can displace an equally good earlier one.",
          "The middle start runs from `k` to `len(win) - 1 - k` inclusive; the constraints guarantee at least one value.",
        ],
      }),
      examples: [
        { input: "[3,1,3,1,8,9,4,1]\n2", expectedOutput: "[0,3,5]" },
        { input: "[2,2,2,2,2,2]\n1", expectedOutput: "[0,1,2]" },
        { input: "[4,5,10,6,11,17,4,11,1,3]\n1", expectedOutput: "[4,5,7]" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.03 ? ri(rng, 46, 120) : pick(rng, [ri(rng, 3, 8), ri(rng, 6, 20), ri(rng, 15, 45)]);
        const k = ri(rng, 1, Math.floor(n / 3));
        const kind = ri(rng, 0, 3);
        let nums: number[];
        if (kind === 0) nums = Array.from({ length: n }, () => ri(rng, 1, 65535));
        else if (kind === 1) nums = Array.from({ length: n }, () => ri(rng, 1, 3));
        else if (kind === 2) { const v = ri(rng, 1, 65535); nums = new Array(n).fill(v); }
        else nums = Array.from({ length: n }, () => ri(rng, 1, 20));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: fmtIntArr(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxSumOfThreeSubarrays(nums: List[int], k: int) -> List[int]:
              n = len(nums)
              m = n - k + 1
              win = [0] * m
              s = 0
              for i in range(n):
                  s += nums[i]
                  if i >= k:
                      s -= nums[i - k]
                  if i >= k - 1:
                      win[i - k + 1] = s
              left = [0] * m
              best = 0
              for i in range(m):
                  if win[i] > win[best]:
                      best = i
                  left[i] = best
              right = [0] * m
              best = m - 1
              for i in range(m - 1, -1, -1):
                  if win[i] >= win[best]:
                      best = i
                  right[i] = best
              ans, top = [], -1
              for b in range(k, m - k):
                  a, c = left[b - k], right[b + k]
                  total = win[a] + win[b] + win[c]
                  if total > top:
                      top = total
                      ans = [a, b, c]
              return ans
        `,
        javascript: code`
          var maxSumOfThreeSubarrays = function(nums, k) {
              var n = nums.length, m = n - k + 1;
              var win = new Array(m);
              var s = 0;
              for (var i = 0; i < n; i++) {
                  s += nums[i];
                  if (i >= k) s -= nums[i - k];
                  if (i >= k - 1) win[i - k + 1] = s;
              }
              var left = new Array(m), right = new Array(m);
              var best = 0;
              for (var i = 0; i < m; i++) {
                  if (win[i] > win[best]) best = i;
                  left[i] = best;
              }
              best = m - 1;
              for (var i = m - 1; i >= 0; i--) {
                  if (win[i] >= win[best]) best = i;
                  right[i] = best;
              }
              var ans = [], top = -1;
              for (var b = k; b + k < m; b++) {
                  var a = left[b - k], c = right[b + k];
                  var total = win[a] + win[b] + win[c];
                  if (total > top) {
                      top = total;
                      ans = [a, b, c];
                  }
              }
              return ans;
          };
        `,
        typescript: code`
          function maxSumOfThreeSubarrays(nums: number[], k: number): number[] {
              var n = nums.length, m = n - k + 1;
              var win: number[] = [];
              var s = 0;
              for (var i = 0; i < n; i++) {
                  s += nums[i];
                  if (i >= k) s -= nums[i - k];
                  if (i >= k - 1) win.push(s);
              }
              var left: number[] = [], right: number[] = [];
              var best = 0;
              for (var i = 0; i < m; i++) {
                  if (win[i] > win[best]) best = i;
                  left.push(best);
                  right.push(0);
              }
              best = m - 1;
              for (var i = m - 1; i >= 0; i--) {
                  if (win[i] >= win[best]) best = i;
                  right[i] = best;
              }
              var ans: number[] = [];
              var top = -1;
              for (var b = k; b + k < m; b++) {
                  var a = left[b - k], c = right[b + k];
                  var total = win[a] + win[b] + win[c];
                  if (total > top) {
                      top = total;
                      ans = [a, b, c];
                  }
              }
              return ans;
          }
        `,
        java: code`
          public static int[] maxSumOfThreeSubarrays(int[] nums, int k) {
              int n = nums.length, m = n - k + 1;
              long[] win = new long[m];
              long s = 0;
              for (int i = 0; i < n; i++) {
                  s += nums[i];
                  if (i >= k) s -= nums[i - k];
                  if (i >= k - 1) win[i - k + 1] = s;
              }
              int[] left = new int[m], right = new int[m];
              int best = 0;
              for (int i = 0; i < m; i++) {
                  if (win[i] > win[best]) best = i;
                  left[i] = best;
              }
              best = m - 1;
              for (int i = m - 1; i >= 0; i--) {
                  if (win[i] >= win[best]) best = i;
                  right[i] = best;
              }
              int[] ans = new int[3];
              long top = -1;
              for (int b = k; b + k < m; b++) {
                  int a = left[b - k], c = right[b + k];
                  long total = win[a] + win[b] + win[c];
                  if (total > top) {
                      top = total;
                      ans = new int[] { a, b, c };
                  }
              }
              return ans;
          }
        `,
        cpp: code`
          vector<int> maxSumOfThreeSubarrays(vector<int>& nums, int k) {
              int n = nums.size(), m = n - k + 1;
              vector<long long> win(m);
              long long s = 0;
              for (int i = 0; i < n; i++) {
                  s += nums[i];
                  if (i >= k) s -= nums[i - k];
                  if (i >= k - 1) win[i - k + 1] = s;
              }
              vector<int> left(m), right(m);
              int best = 0;
              for (int i = 0; i < m; i++) {
                  if (win[i] > win[best]) best = i;
                  left[i] = best;
              }
              best = m - 1;
              for (int i = m - 1; i >= 0; i--) {
                  if (win[i] >= win[best]) best = i;
                  right[i] = best;
              }
              vector<int> ans;
              long long top = -1;
              for (int b = k; b + k < m; b++) {
                  int a = left[b - k], c = right[b + k];
                  long long total = win[a] + win[b] + win[c];
                  if (total > top) {
                      top = total;
                      ans = {a, b, c};
                  }
              }
              return ans;
          }
        `,
        c: code`
          int* maxSumOfThreeSubarrays(int* nums, int numsSize, int k, int* returnSize) {
              int n = numsSize, m = n - k + 1;
              long long* win = (long long*)malloc(sizeof(long long) * m);
              int* left = (int*)malloc(sizeof(int) * m);
              int* right = (int*)malloc(sizeof(int) * m);
              long long s = 0;
              for (int i = 0; i < n; i++) {
                  s += nums[i];
                  if (i >= k) s -= nums[i - k];
                  if (i >= k - 1) win[i - k + 1] = s;
              }
              int best = 0;
              for (int i = 0; i < m; i++) {
                  if (win[i] > win[best]) best = i;
                  left[i] = best;
              }
              best = m - 1;
              for (int i = m - 1; i >= 0; i--) {
                  if (win[i] >= win[best]) best = i;
                  right[i] = best;
              }
              int* ans = (int*)malloc(sizeof(int) * 3);
              long long top = -1;
              for (int b = k; b + k < m; b++) {
                  int a = left[b - k], c = right[b + k];
                  long long total = win[a] + win[b] + win[c];
                  if (total > top) {
                      top = total;
                      ans[0] = a;
                      ans[1] = b;
                      ans[2] = c;
                  }
              }
              free(win);
              free(left);
              free(right);
              *returnSize = 3;
              return ans;
          }
        `,
        csharp: code`
          public static int[] MaxSumOfThreeSubarrays(int[] nums, int k)
          {
              int n = nums.Length, m = n - k + 1;
              long[] win = new long[m];
              long s = 0;
              for (int i = 0; i < n; i++)
              {
                  s += nums[i];
                  if (i >= k) s -= nums[i - k];
                  if (i >= k - 1) win[i - k + 1] = s;
              }
              int[] left = new int[m], right = new int[m];
              int best = 0;
              for (int i = 0; i < m; i++)
              {
                  if (win[i] > win[best]) best = i;
                  left[i] = best;
              }
              best = m - 1;
              for (int i = m - 1; i >= 0; i--)
              {
                  if (win[i] >= win[best]) best = i;
                  right[i] = best;
              }
              int[] ans = new int[3];
              long top = -1;
              for (int b = k; b + k < m; b++)
              {
                  int a = left[b - k], c = right[b + k];
                  long total = win[a] + win[b] + win[c];
                  if (total > top)
                  {
                      top = total;
                      ans = new int[] { a, b, c };
                  }
              }
              return ans;
          }
        `,
        go: code`
          func maxSumOfThreeSubarrays(nums []int, k int) []int {
              n := len(nums)
              m := n - k + 1
              win := make([]int, m)
              s := 0
              for i := 0; i < n; i++ {
                  s += nums[i]
                  if i >= k {
                      s -= nums[i-k]
                  }
                  if i >= k-1 {
                      win[i-k+1] = s
                  }
              }
              left := make([]int, m)
              right := make([]int, m)
              best := 0
              for i := 0; i < m; i++ {
                  if win[i] > win[best] {
                      best = i
                  }
                  left[i] = best
              }
              best = m - 1
              for i := m - 1; i >= 0; i-- {
                  if win[i] >= win[best] {
                      best = i
                  }
                  right[i] = best
              }
              ans := []int{}
              top := -1
              for b := k; b+k < m; b++ {
                  a, c := left[b-k], right[b+k]
                  total := win[a] + win[b] + win[c]
                  if total > top {
                      top = total
                      ans = []int{a, b, c}
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun maxSumOfThreeSubarrays(nums: IntArray, k: Int): IntArray {
              val n = nums.size
              val m = n - k + 1
              val win = LongArray(m)
              var s = 0L
              for (i in 0 until n) {
                  s += nums[i]
                  if (i >= k) s -= nums[i - k]
                  if (i >= k - 1) win[i - k + 1] = s
              }
              val left = IntArray(m)
              val right = IntArray(m)
              var best = 0
              for (i in 0 until m) {
                  if (win[i] > win[best]) best = i
                  left[i] = best
              }
              best = m - 1
              for (i in m - 1 downTo 0) {
                  if (win[i] >= win[best]) best = i
                  right[i] = best
              }
              var ans = IntArray(3)
              var top = -1L
              var b = k
              while (b + k < m) {
                  val a = left[b - k]
                  val c = right[b + k]
                  val total = win[a] + win[b] + win[c]
                  if (total > top) {
                      top = total
                      ans = intArrayOf(a, b, c)
                  }
                  b++
              }
              return ans
          }
        `,
        swift: code`
          func maxSumOfThreeSubarrays(_ nums: [Int], _ k: Int) -> [Int] {
              let n = nums.count
              let m = n - k + 1
              var win = [Int](repeating: 0, count: m)
              var s = 0
              for i in 0..<n {
                  s += nums[i]
                  if i >= k { s -= nums[i - k] }
                  if i >= k - 1 { win[i - k + 1] = s }
              }
              var left = [Int](repeating: 0, count: m)
              var right = [Int](repeating: 0, count: m)
              var best = 0
              for i in 0..<m {
                  if win[i] > win[best] { best = i }
                  left[i] = best
              }
              best = m - 1
              for i in stride(from: m - 1, through: 0, by: -1) {
                  if win[i] >= win[best] { best = i }
                  right[i] = best
              }
              var ans = [Int]()
              var top = -1
              var b = k
              while b + k < m {
                  let a = left[b - k]
                  let c = right[b + k]
                  let total = win[a] + win[b] + win[c]
                  if total > top {
                      top = total
                      ans = [a, b, c]
                  }
                  b += 1
              }
              return ans
          }
        `,
        rust: code`
          fn maxSumOfThreeSubarrays(nums: Vec<i32>, k: i32) -> Vec<i32> {
              let n = nums.len();
              let k = k as usize;
              let m = n - k + 1;
              let mut win = vec![0i64; m];
              let mut s: i64 = 0;
              for i in 0..n {
                  s += nums[i] as i64;
                  if i >= k {
                      s -= nums[i - k] as i64;
                  }
                  if i + 1 >= k {
                      win[i + 1 - k] = s;
                  }
              }
              let mut left = vec![0usize; m];
              let mut right = vec![0usize; m];
              let mut best = 0;
              for i in 0..m {
                  if win[i] > win[best] {
                      best = i;
                  }
                  left[i] = best;
              }
              best = m - 1;
              for i in (0..m).rev() {
                  if win[i] >= win[best] {
                      best = i;
                  }
                  right[i] = best;
              }
              let mut ans = vec![0i32; 3];
              let mut top: i64 = -1;
              let mut b = k;
              while b + k < m {
                  let a = left[b - k];
                  let c = right[b + k];
                  let total = win[a] + win[b] + win[c];
                  if total > top {
                      top = total;
                      ans = vec![a as i32, b as i32, c as i32];
                  }
                  b += 1;
              }
              ans
          }
        `,
        php: code`
          function maxSumOfThreeSubarrays($nums, $k) {
              $n = count($nums);
              $m = $n - $k + 1;
              $win = array_fill(0, $m, 0);
              $s = 0;
              for ($i = 0; $i < $n; $i++) {
                  $s += $nums[$i];
                  if ($i >= $k) $s -= $nums[$i - $k];
                  if ($i >= $k - 1) $win[$i - $k + 1] = $s;
              }
              $left = array_fill(0, $m, 0);
              $right = array_fill(0, $m, 0);
              $best = 0;
              for ($i = 0; $i < $m; $i++) {
                  if ($win[$i] > $win[$best]) $best = $i;
                  $left[$i] = $best;
              }
              $best = $m - 1;
              for ($i = $m - 1; $i >= 0; $i--) {
                  if ($win[$i] >= $win[$best]) $best = $i;
                  $right[$i] = $best;
              }
              $ans = [];
              $top = -1;
              for ($b = $k; $b + $k < $m; $b++) {
                  $a = $left[$b - $k];
                  $c = $right[$b + $k];
                  $total = $win[$a] + $win[$b] + $win[$c];
                  if ($total > $top) {
                      $top = $total;
                      $ans = [$a, $b, $c];
                  }
              }
              return $ans;
          }
        `,
        ruby: code`
          def maxSumOfThreeSubarrays(nums, k)
            n = nums.length
            m = n - k + 1
            win = Array.new(m, 0)
            s = 0
            (0...n).each do |i|
              s += nums[i]
              s -= nums[i - k] if i >= k
              win[i - k + 1] = s if i >= k - 1
            end
            left = Array.new(m, 0)
            right = Array.new(m, 0)
            best = 0
            (0...m).each do |i|
              best = i if win[i] > win[best]
              left[i] = best
            end
            best = m - 1
            (m - 1).downto(0) do |i|
              best = i if win[i] >= win[best]
              right[i] = best
            end
            ans = []
            top = -1
            (k...(m - k)).each do |b|
              a = left[b - k]
              c = right[b + k]
              total = win[a] + win[b] + win[c]
              if total > top
                top = total
                ans = [a, b, c]
              end
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Super Egg Drop (LC 887) ─────────────────────────────────────
  (() => {
    // The textbook dp[eggs][floors] = 1 + min over the first drop of the worse
    // outcome, with a binary search over the drop floor; built once for the
    // whole constraint box, independent of the solutions' moves-first DP.
    let table: Int32Array[] | null = null;
    const ref = (k: number, n: number) => {
      if (!table) {
        const N = 10000, K = 100;
        const t: Int32Array[] = [new Int32Array(N + 1)];
        const one = new Int32Array(N + 1);
        for (let f = 0; f <= N; f++) one[f] = f;
        t.push(one);
        for (let e = 2; e <= K; e++) {
          const prev = t[e - 1], cur = new Int32Array(N + 1);
          for (let f = 1; f <= N; f++) {
            let lo = 1, hi = f;
            while (lo + 1 < hi) {
              const mid = (lo + hi) >> 1;
              if (prev[mid - 1] < cur[f - mid]) lo = mid; else hi = mid;
            }
            cur[f] = 1 + Math.min(Math.max(prev[lo - 1], cur[f - lo]), Math.max(prev[hi - 1], cur[f - hi]));
          }
          t.push(cur);
        }
        table = t;
      }
      return table[k][n];
    };
    return {
      slug: "super-egg-drop",
      title: "Super Egg Drop",
      difficulty: "HARD" as const,
      tags: ["Math", "Binary Search", "Dynamic Programming", "Google", "Amazon", "Goldman Sachs"],
      signature: {
        funcName: "superEggDrop",
        params: [{ name: "k", type: "int" as const }, { name: "n", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You have `k` identical eggs and a building with floors numbered `1` to `n`. Somewhere there is a critical floor `f` with `0 <= f <= n`: an egg dropped from any floor **above** `f` breaks, and an egg dropped from floor `f` or below survives.\n\n" +
        "In one move you take an unbroken egg and drop it from a floor of your choice. A broken egg is gone for good; an egg that survives can be dropped again.\n\n" +
        "Return the **minimum number of moves** that is enough to determine `f` exactly, no matter what its value is.",
        [
          { in: "k = 1, n = 3", out: "3", note: "With a single egg you cannot risk skipping a floor: drop from 1, then 2, then 3." },
          { in: "k = 2, n = 10", out: "4", note: "Drop the first egg from 4, then 7, then 9, then 10. When it breaks, walk the second egg up through the floors just above the last safe drop — never more than 4 moves in total." },
          { in: "k = 3, n = 25", out: "5" },
        ],
        ["1 <= k <= 100", "1 <= n <= 10^4"]),
      hints: [
        "Turn the question around: with `m` moves and `e` eggs, what is the largest number of floors whose critical floor you can always pin down?",
        "Make the first drop. If the egg breaks you keep `m - 1` moves and `e - 1` eggs for the floors below; if it survives, `m - 1` moves and `e` eggs for the floors above. So `floors(m, e) = floors(m-1, e-1) + floors(m-1, e) + 1`.",
        "Raise `m` one at a time, updating a one-dimensional array over eggs from `e = k` down to `1` (so the previous move's values are still intact), and stop at the first `m` with `floors(m, k) >= n`.",
      ],
      editorial: explain({
        idea: "Asking for the fewest moves for `n` floors is hard to recurse on directly; the inverse question is easy. Let `floors(m, e)` be the most floors that `m` moves and `e` eggs can fully resolve. The first drop splits the building into the floors below (handled with one fewer egg if it breaks) and the floors above (same eggs if it survives), plus the floor dropped from.",
        steps: [
          "Keep an array `floors[0..k]`, all zero (zero moves resolve zero floors).",
          "Repeat: increment `moves`; for `e` from `k` down to `1`, set `floors[e] = floors[e] + floors[e - 1] + 1`.",
          "Stop as soon as `floors[k] >= n` and return `moves`.",
        ],
        why: "With `m` moves and `e` eggs, drop the first egg from floor `floors(m-1, e-1) + 1`. If it breaks, the critical floor is below and `floors(m-1, e-1)` floors remain for `e - 1` eggs; if not, the floors above number at most `floors(m-1, e)`. Both branches are covered, so `floors(m, e) = floors(m-1, e-1) + floors(m-1, e) + 1` is achievable — and no strategy can do better, because any first drop leaves one of those two subproblems. The answer is the first `m` for which `floors(m, k)` reaches `n`, and since `floors` grows at least linearly (and exponentially with two or more eggs), the loop is short.",
        time: "O(k · m), where m is the answer (at most n, and about log2 n once k is large)",
        space: "O(k)",
        pitfalls: [
          "The direct DP over `(eggs, floors)` with a linear scan over the first drop is O(k · n^2) — far too slow for n = 10^4.",
          "Update the egg array from high to low; going upward would read this move's value of `floors[e - 1]` instead of the previous move's.",
          "`f` can be 0 (every floor breaks the egg), which is why `n` floors need `floors(m, k) >= n`, not `> n`.",
        ],
      }),
      examples: [
        { input: "1\n3", expectedOutput: "3" },
        { input: "2\n10", expectedOutput: "4" },
        { input: "3\n25", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        let k: number, n: number;
        if (cls === 0) { k = 1; n = ri(rng, 1, 3000); }
        else if (cls <= 3) { k = ri(rng, 1, 5); n = ri(rng, 1, 60); }
        else if (cls <= 6) { k = ri(rng, 2, 4); n = ri(rng, 1, 10000); }
        else if (cls <= 8) { k = ri(rng, 5, 20); n = ri(rng, 1, 10000); }
        else { k = ri(rng, 21, 100); n = ri(rng, 1, 10000); }
        return { input: `${k}\n${n}`, expectedOutput: String(ref(k, n)) };
      },
      solutions: {
        python: code`
          def superEggDrop(k: int, n: int) -> int:
              floors = [0] * (k + 1)
              moves = 0
              while floors[k] < n:
                  moves += 1
                  for e in range(k, 0, -1):
                      floors[e] += floors[e - 1] + 1
              return moves
        `,
        javascript: code`
          var superEggDrop = function(k, n) {
              var floors = new Array(k + 1).fill(0);
              var moves = 0;
              while (floors[k] < n) {
                  moves++;
                  for (var e = k; e >= 1; e--) floors[e] = floors[e] + floors[e - 1] + 1;
              }
              return moves;
          };
        `,
        typescript: code`
          function superEggDrop(k: number, n: number): number {
              var floors: number[] = [];
              for (var e = 0; e <= k; e++) floors.push(0);
              var moves = 0;
              while (floors[k] < n) {
                  moves++;
                  for (var j = k; j >= 1; j--) floors[j] = floors[j] + floors[j - 1] + 1;
              }
              return moves;
          }
        `,
        java: code`
          public static int superEggDrop(int k, int n) {
              int[] floors = new int[k + 1];
              int moves = 0;
              while (floors[k] < n) {
                  moves++;
                  for (int e = k; e >= 1; e--) floors[e] = floors[e] + floors[e - 1] + 1;
              }
              return moves;
          }
        `,
        cpp: code`
          int superEggDrop(int k, int n) {
              vector<int> floors(k + 1, 0);
              int moves = 0;
              while (floors[k] < n) {
                  moves++;
                  for (int e = k; e >= 1; e--) floors[e] = floors[e] + floors[e - 1] + 1;
              }
              return moves;
          }
        `,
        c: code`
          int superEggDrop(int k, int n) {
              int* floors = (int*)calloc(k + 1, sizeof(int));
              int moves = 0;
              while (floors[k] < n) {
                  moves++;
                  for (int e = k; e >= 1; e--) floors[e] = floors[e] + floors[e - 1] + 1;
              }
              free(floors);
              return moves;
          }
        `,
        csharp: code`
          public static int SuperEggDrop(int k, int n)
          {
              int[] floors = new int[k + 1];
              int moves = 0;
              while (floors[k] < n)
              {
                  moves++;
                  for (int e = k; e >= 1; e--) floors[e] = floors[e] + floors[e - 1] + 1;
              }
              return moves;
          }
        `,
        go: code`
          func superEggDrop(k int, n int) int {
              floors := make([]int, k+1)
              moves := 0
              for floors[k] < n {
                  moves++
                  for e := k; e >= 1; e-- {
                      floors[e] = floors[e] + floors[e-1] + 1
                  }
              }
              return moves
          }
        `,
        kotlin: code`
          fun superEggDrop(k: Int, n: Int): Int {
              val floors = IntArray(k + 1)
              var moves = 0
              while (floors[k] < n) {
                  moves++
                  for (e in k downTo 1) floors[e] = floors[e] + floors[e - 1] + 1
              }
              return moves
          }
        `,
        swift: code`
          func superEggDrop(_ k: Int, _ n: Int) -> Int {
              var floors = [Int](repeating: 0, count: k + 1)
              var moves = 0
              while floors[k] < n {
                  moves += 1
                  for e in stride(from: k, through: 1, by: -1) {
                      floors[e] = floors[e] + floors[e - 1] + 1
                  }
              }
              return moves
          }
        `,
        rust: code`
          fn superEggDrop(k: i32, n: i32) -> i32 {
              let k = k as usize;
              let mut floors = vec![0i32; k + 1];
              let mut moves = 0;
              while floors[k] < n {
                  moves += 1;
                  for e in (1..=k).rev() {
                      floors[e] = floors[e] + floors[e - 1] + 1;
                  }
              }
              moves
          }
        `,
        php: code`
          function superEggDrop($k, $n) {
              $floors = array_fill(0, $k + 1, 0);
              $moves = 0;
              while ($floors[$k] < $n) {
                  $moves++;
                  for ($e = $k; $e >= 1; $e--) $floors[$e] = $floors[$e] + $floors[$e - 1] + 1;
              }
              return $moves;
          }
        `,
        ruby: code`
          def superEggDrop(k, n)
            floors = Array.new(k + 1, 0)
            moves = 0
            while floors[k] < n
              moves += 1
              k.downto(1) { |e| floors[e] = floors[e] + floors[e - 1] + 1 }
            end
            moves
          end
        `,
      },
    };
  })(),

  // ── Minimum Cost to Merge Stones (LC 1000) ──────────────────────
  (() => {
    // The three-index formulation: best cost to turn stones[i..j] into
    // exactly p piles, for every p up to k.
    const ref = (stones: number[], k: number) => {
      const n = stones.length;
      if ((n - 1) % (k - 1) !== 0) return -1;
      const INF = 1e15;
      const sum = (i: number, j: number) => { let s = 0; for (let t = i; t <= j; t++) s += stones[t]; return s; };
      const dp: number[][][] = Array.from({ length: n }, () => Array.from({ length: n }, () => new Array(k + 1).fill(INF)));
      for (let i = 0; i < n; i++) dp[i][i][1] = 0;
      for (let len = 2; len <= n; len++) {
        for (let i = 0; i + len <= n; i++) {
          const j = i + len - 1;
          for (let p = 2; p <= Math.min(k, len); p++) {
            for (let m = i; m < j; m++) {
              const c = dp[i][m][1] + dp[m + 1][j][p - 1];
              if (c < dp[i][j][p]) dp[i][j][p] = c;
            }
          }
          if (dp[i][j][k] < INF) dp[i][j][1] = dp[i][j][k] + sum(i, j);
        }
      }
      return dp[0][n - 1][1];
    };
    return {
      slug: "minimum-cost-to-merge-stones",
      title: "Minimum Cost to Merge Stones",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Prefix Sum", "Amazon", "Google", "Microsoft"],
      signature: {
        funcName: "mergeStones",
        params: [{ name: "stones", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "There are `n` piles of stones in a row, and pile `i` holds `stones[i]` stones.\n\n" +
        "A move merges exactly `k` **consecutive** piles into a single pile, and it costs the total number of stones in those `k` piles. The new pile takes their place in the row.\n\n" +
        "Return the minimum total cost to merge all the piles into **one** pile, or `-1` if that is impossible.",
        [
          { in: "stones = [6,2,5,1], k = 2", out: "28", note: "Merge `[6,2]` (cost 8) and `[5,1]` (cost 6), then `[8,6]` (cost 14): 28 in total." },
          { in: "stones = [6,2,5,1], k = 3", out: "-1", note: "Each move removes exactly 2 piles, so 4 piles can only become 2, never 1." },
          { in: "stones = [2,6,1,3,5], k = 3", out: "26", note: "Merge `[2,6,1]` (cost 9) to get `[9,3,5]`, then merge everything (cost 17)." },
        ],
        ["n == stones.length", "1 <= n <= 30", "1 <= stones[i] <= 100", "2 <= k <= 30"]),
      hints: [
        "Each move reduces the number of piles by `k - 1`. When can `n` piles end as one?",
        "Let `dp[i][j]` be the cheapest way to merge `stones[i..j]` into as few piles as possible. The leftmost of those piles comes from some prefix `stones[i..mid]` that was merged all the way down to one pile.",
        "Only prefixes with `mid - i` a multiple of `k - 1` can become a single pile, so step `mid` by `k - 1`: `dp[i][j] = min(dp[i][mid] + dp[mid+1][j])`. When `(j - i)` is itself a multiple of `k - 1`, the range can finish as one pile — add its stone total.",
      ],
      editorial: explain({
        idea: "Every move turns `k` piles into one, removing `k - 1`, so `n` piles become one exactly when `(n - 1) % (k - 1) == 0`. More generally a range of length `L` can be reduced to `(L - 1) % (k - 1) + 1` piles and no fewer. An interval DP over ranges, splitting off the leftmost final pile, captures every merge order.",
        steps: [
          "If `(n - 1) % (k - 1) != 0`, return `-1`.",
          "Build prefix sums so any range total is O(1).",
          "`dp[i][i] = 0`. For lengths 2 to `n` and every start `i` (end `j`): `dp[i][j] = min over mid = i, i + (k-1), i + 2(k-1), … < j of dp[i][mid] + dp[mid+1][j]`.",
          "If `(j - i) % (k - 1) == 0`, the range's piles can be merged one final time into one pile: add `sum(i..j)` to `dp[i][j]`.",
          "Return `dp[0][n - 1]`.",
        ],
        why: "Look at the minimal pile configuration of `stones[i..j]`: its leftmost pile came from some prefix `stones[i..mid]` merged into one pile, which is only possible when `mid - i` is a multiple of `k - 1` — hence the step. The rest of the range is handled independently, because merges never cross the boundary between the leftmost pile's stones and the others before that final step. When the whole range reduces to exactly `k` piles, one more merge costs precisely the range total, whatever order came before — so adding `sum(i..j)` at those lengths accounts for the last merge.",
        time: "O(n^3 / (k - 1))",
        space: "O(n^2)",
        pitfalls: [
          "Check feasibility first — without it the DP happily returns a cost for a row that can never become one pile.",
          "Step the split point by `k - 1`, not by 1; other split points describe prefixes that cannot be a single pile.",
          "Add the range sum only when `(len - 1) % (k - 1) == 0`; adding it elsewhere charges merges that never happen.",
        ],
      }),
      examples: [
        { input: "[6,2,5,1]\n2", expectedOutput: "28" },
        { input: "[6,2,5,1]\n3", expectedOutput: "-1" },
        { input: "[2,6,1,3,5]\n3", expectedOutput: "26" },
      ],
      gen: (rng: Rng) => {
        const k = rng() < 0.75 ? pick(rng, [2, 2, 3, 3, 4, 5]) : ri(rng, 2, 30);
        let n: number;
        if (rng() < 0.8) n = 1 + (k - 1) * ri(rng, 0, Math.floor(29 / (k - 1)));
        else n = ri(rng, 1, 30);
        const hi = pick(rng, [5, 100, 100]);
        const stones = Array.from({ length: n }, () => ri(rng, 1, hi));
        return { input: `${fmtIntArr(stones)}\n${k}`, expectedOutput: String(ref(stones, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def mergeStones(stones: List[int], k: int) -> int:
              n = len(stones)
              if (n - 1) % (k - 1) != 0:
                  return -1
              pre = [0] * (n + 1)
              for i in range(n):
                  pre[i + 1] = pre[i] + stones[i]
              dp = [[0] * n for _ in range(n)]
              for length in range(2, n + 1):
                  for i in range(n - length + 1):
                      j = i + length - 1
                      best = 10 ** 18
                      for mid in range(i, j, k - 1):
                          cand = dp[i][mid] + dp[mid + 1][j]
                          if cand < best:
                              best = cand
                      if (length - 1) % (k - 1) == 0:
                          best += pre[j + 1] - pre[i]
                      dp[i][j] = best
              return dp[0][n - 1]
        `,
        javascript: code`
          var mergeStones = function(stones, k) {
              var n = stones.length;
              if ((n - 1) % (k - 1) !== 0) return -1;
              var pre = new Array(n + 1).fill(0);
              for (var i = 0; i < n; i++) pre[i + 1] = pre[i] + stones[i];
              var dp = [];
              for (var i = 0; i < n; i++) dp.push(new Array(n).fill(0));
              for (var len = 2; len <= n; len++) {
                  for (var i = 0; i + len <= n; i++) {
                      var j = i + len - 1, best = Infinity;
                      for (var mid = i; mid < j; mid += k - 1) {
                          best = Math.min(best, dp[i][mid] + dp[mid + 1][j]);
                      }
                      if ((len - 1) % (k - 1) === 0) best += pre[j + 1] - pre[i];
                      dp[i][j] = best;
                  }
              }
              return dp[0][n - 1];
          };
        `,
        typescript: code`
          function mergeStones(stones: number[], k: number): number {
              var n = stones.length;
              if ((n - 1) % (k - 1) !== 0) return -1;
              var pre: number[] = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + stones[i]);
              var dp: number[][] = [];
              for (var i = 0; i < n; i++) {
                  var row: number[] = [];
                  for (var j = 0; j < n; j++) row.push(0);
                  dp.push(row);
              }
              for (var len = 2; len <= n; len++) {
                  for (var i = 0; i + len <= n; i++) {
                      var j = i + len - 1, best = Infinity;
                      for (var mid = i; mid < j; mid += k - 1) {
                          best = Math.min(best, dp[i][mid] + dp[mid + 1][j]);
                      }
                      if ((len - 1) % (k - 1) === 0) best += pre[j + 1] - pre[i];
                      dp[i][j] = best;
                  }
              }
              return dp[0][n - 1];
          }
        `,
        java: code`
          public static int mergeStones(int[] stones, int k) {
              int n = stones.length;
              if ((n - 1) % (k - 1) != 0) return -1;
              int[] pre = new int[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stones[i];
              int[][] dp = new int[n][n];
              for (int len = 2; len <= n; len++) {
                  for (int i = 0; i + len <= n; i++) {
                      int j = i + len - 1;
                      int best = Integer.MAX_VALUE;
                      for (int mid = i; mid < j; mid += k - 1) best = Math.min(best, dp[i][mid] + dp[mid + 1][j]);
                      if ((len - 1) % (k - 1) == 0) best += pre[j + 1] - pre[i];
                      dp[i][j] = best;
                  }
              }
              return dp[0][n - 1];
          }
        `,
        cpp: code`
          int mergeStones(vector<int>& stones, int k) {
              int n = stones.size();
              if ((n - 1) % (k - 1) != 0) return -1;
              vector<int> pre(n + 1, 0);
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stones[i];
              vector<vector<int>> dp(n, vector<int>(n, 0));
              for (int len = 2; len <= n; len++) {
                  for (int i = 0; i + len <= n; i++) {
                      int j = i + len - 1;
                      int best = INT_MAX;
                      for (int mid = i; mid < j; mid += k - 1) best = min(best, dp[i][mid] + dp[mid + 1][j]);
                      if ((len - 1) % (k - 1) == 0) best += pre[j + 1] - pre[i];
                      dp[i][j] = best;
                  }
              }
              return dp[0][n - 1];
          }
        `,
        c: code`
          int mergeStones(int* stones, int stonesSize, int k) {
              int n = stonesSize;
              if ((n - 1) % (k - 1) != 0) return -1;
              int* pre = (int*)calloc(n + 1, sizeof(int));
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stones[i];
              int* dp = (int*)calloc((size_t)n * n, sizeof(int));
              for (int len = 2; len <= n; len++) {
                  for (int i = 0; i + len <= n; i++) {
                      int j = i + len - 1;
                      int best = 2147483647;
                      for (int mid = i; mid < j; mid += k - 1) {
                          int cand = dp[i * n + mid] + dp[(mid + 1) * n + j];
                          if (cand < best) best = cand;
                      }
                      if ((len - 1) % (k - 1) == 0) best += pre[j + 1] - pre[i];
                      dp[i * n + j] = best;
                  }
              }
              int ans = dp[n - 1];
              free(pre);
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int MergeStones(int[] stones, int k)
          {
              int n = stones.Length;
              if ((n - 1) % (k - 1) != 0) return -1;
              int[] pre = new int[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stones[i];
              int[,] dp = new int[n, n];
              for (int len = 2; len <= n; len++)
              {
                  for (int i = 0; i + len <= n; i++)
                  {
                      int j = i + len - 1;
                      int best = int.MaxValue;
                      for (int mid = i; mid < j; mid += k - 1) best = Math.Min(best, dp[i, mid] + dp[mid + 1, j]);
                      if ((len - 1) % (k - 1) == 0) best += pre[j + 1] - pre[i];
                      dp[i, j] = best;
                  }
              }
              return dp[0, n - 1];
          }
        `,
        go: code`
          func mergeStones(stones []int, k int) int {
              n := len(stones)
              if (n-1)%(k-1) != 0 {
                  return -1
              }
              pre := make([]int, n+1)
              for i := 0; i < n; i++ {
                  pre[i+1] = pre[i] + stones[i]
              }
              dp := make([][]int, n)
              for i := range dp {
                  dp[i] = make([]int, n)
              }
              for length := 2; length <= n; length++ {
                  for i := 0; i+length <= n; i++ {
                      j := i + length - 1
                      best := 1 << 60
                      for mid := i; mid < j; mid += k - 1 {
                          if c := dp[i][mid] + dp[mid+1][j]; c < best {
                              best = c
                          }
                      }
                      if (length-1)%(k-1) == 0 {
                          best += pre[j+1] - pre[i]
                      }
                      dp[i][j] = best
                  }
              }
              return dp[0][n-1]
          }
        `,
        kotlin: code`
          fun mergeStones(stones: IntArray, k: Int): Int {
              val n = stones.size
              if ((n - 1) % (k - 1) != 0) return -1
              val pre = IntArray(n + 1)
              for (i in 0 until n) pre[i + 1] = pre[i] + stones[i]
              val dp = Array(n) { IntArray(n) }
              for (len in 2..n) {
                  for (i in 0..n - len) {
                      val j = i + len - 1
                      var best = Int.MAX_VALUE
                      var mid = i
                      while (mid < j) {
                          best = minOf(best, dp[i][mid] + dp[mid + 1][j])
                          mid += k - 1
                      }
                      if ((len - 1) % (k - 1) == 0) best += pre[j + 1] - pre[i]
                      dp[i][j] = best
                  }
              }
              return dp[0][n - 1]
          }
        `,
        swift: code`
          func mergeStones(_ stones: [Int], _ k: Int) -> Int {
              let n = stones.count
              if (n - 1) % (k - 1) != 0 { return -1 }
              var pre = [Int](repeating: 0, count: n + 1)
              for i in 0..<n { pre[i + 1] = pre[i] + stones[i] }
              var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)
              if n >= 2 {
                  for len in 2...n {
                      for i in 0...(n - len) {
                          let j = i + len - 1
                          var best = Int.max
                          for mid in stride(from: i, to: j, by: k - 1) {
                              best = min(best, dp[i][mid] + dp[mid + 1][j])
                          }
                          if (len - 1) % (k - 1) == 0 { best += pre[j + 1] - pre[i] }
                          dp[i][j] = best
                      }
                  }
              }
              return dp[0][n - 1]
          }
        `,
        rust: code`
          fn mergeStones(stones: Vec<i32>, k: i32) -> i32 {
              let n = stones.len();
              let step = (k - 1) as usize;
              if (n - 1) % step != 0 {
                  return -1;
              }
              let mut pre = vec![0i32; n + 1];
              for i in 0..n {
                  pre[i + 1] = pre[i] + stones[i];
              }
              let mut dp = vec![vec![0i32; n]; n];
              for len in 2..=n {
                  for i in 0..=(n - len) {
                      let j = i + len - 1;
                      let mut best = std::i32::MAX;
                      let mut mid = i;
                      while mid < j {
                          let c = dp[i][mid] + dp[mid + 1][j];
                          if c < best {
                              best = c;
                          }
                          mid += step;
                      }
                      if (len - 1) % step == 0 {
                          best += pre[j + 1] - pre[i];
                      }
                      dp[i][j] = best;
                  }
              }
              dp[0][n - 1]
          }
        `,
        php: code`
          function mergeStones($stones, $k) {
              $n = count($stones);
              if (($n - 1) % ($k - 1) != 0) return -1;
              $pre = array_fill(0, $n + 1, 0);
              for ($i = 0; $i < $n; $i++) $pre[$i + 1] = $pre[$i] + $stones[$i];
              $dp = array_fill(0, $n, array_fill(0, $n, 0));
              for ($len = 2; $len <= $n; $len++) {
                  for ($i = 0; $i + $len <= $n; $i++) {
                      $j = $i + $len - 1;
                      $best = PHP_INT_MAX;
                      for ($mid = $i; $mid < $j; $mid += $k - 1) {
                          $c = $dp[$i][$mid] + $dp[$mid + 1][$j];
                          if ($c < $best) $best = $c;
                      }
                      if (($len - 1) % ($k - 1) == 0) $best += $pre[$j + 1] - $pre[$i];
                      $dp[$i][$j] = $best;
                  }
              }
              return $dp[0][$n - 1];
          }
        `,
        ruby: code`
          def mergeStones(stones, k)
            n = stones.length
            return -1 if (n - 1) % (k - 1) != 0
            pre = Array.new(n + 1, 0)
            (0...n).each { |i| pre[i + 1] = pre[i] + stones[i] }
            dp = Array.new(n) { Array.new(n, 0) }
            (2..n).each do |len|
              (0..(n - len)).each do |i|
                j = i + len - 1
                best = nil
                i.step(j - 1, k - 1) do |mid|
                  c = dp[i][mid] + dp[mid + 1][j]
                  best = c if best.nil? || c < best
                end
                best += pre[j + 1] - pre[i] if (len - 1) % (k - 1) == 0
                dp[i][j] = best
              end
            end
            dp[0][n - 1]
          end
        `,
      },
    };
  })(),

  // ── Stone Game V (LC 1563) ──────────────────────────────────────
  (() => {
    // Top-down over (i, j) with every part sum recomputed by a loop.
    const ref = (a: number[]) => {
      const n = a.length;
      const memo = new Map<number, number>();
      const sum = (i: number, j: number) => { let s = 0; for (let t = i; t <= j; t++) s += a[t]; return s; };
      const go = (i: number, j: number): number => {
        if (i === j) return 0;
        const key = i * 1000 + j;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let best = 0;
        for (let m = i; m < j; m++) {
          const L = sum(i, m), R = sum(m + 1, j);
          let c: number;
          if (L < R) c = L + go(i, m);
          else if (L > R) c = R + go(m + 1, j);
          else c = L + Math.max(go(i, m), go(m + 1, j));
          if (c > best) best = c;
        }
        memo.set(key, best);
        return best;
      };
      return go(0, n - 1);
    };
    return {
      slug: "stone-game-v",
      title: "Stone Game V",
      difficulty: "HARD" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Game Theory", "Google", "Amazon"],
      signature: { funcName: "stoneGameV", params: [{ name: "stoneValue", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Stones are arranged in a row and stone `i` has the value `stoneValue[i]`.\n\n" +
        "Alice plays a series of rounds. In each round she splits the current row into two **non-empty** parts, a left part and a right part. Bob adds up the values of each part and throws away the part with the **larger** sum; the sum of the part that stays is added to Alice's score. If both parts have the same sum, Alice chooses which one Bob throws away. The kept part becomes the new row.\n\n" +
        "The game ends when a single stone is left. Alice starts with a score of `0`. Return the **maximum** score she can reach.",
        [
          { in: "stoneValue = [2,4,1,3]", out: "5", note: "Split into `[2,4]` and `[1,3]`: Bob discards `[2,4]` (sum 6), Alice scores 4. Then `[1]`|`[3]`: Bob discards `[3]`, Alice scores 1. Total 5." },
          { in: "stoneValue = [5,5,4,3,2,6]", out: "18" },
          { in: "stoneValue = [9]", out: "0", note: "A single stone ends the game immediately." },
        ],
        ["1 <= stoneValue.length <= 500", "1 <= stoneValue[i] <= 10^6"]),
      hints: [
        "After the first split the game continues on one contiguous part, so the state is just a range `[i, j]` of the original row.",
        "Let `best(i, j)` be Alice's maximum score starting from `stoneValue[i..j]`. Try every split point `m` and compare the two part sums using prefix sums.",
        "If the left sum is smaller, Alice gets `left + best(i, m)`; if larger, `right + best(m+1, j)`; if equal she takes the larger of the two continuations. Fill `best` by increasing range length.",
      ],
      editorial: explain({
        idea: "The row that survives each round is always a contiguous range of the original, and Alice's future depends only on that range. That makes an interval DP: `best(i, j)` is the best score from the range, built from shorter ranges.",
        steps: [
          "Build prefix sums so any range total is O(1).",
          "`best(i, i) = 0`: one stone ends the game.",
          "For each range `[i, j]` by increasing length and each split point `m` in `[i, j - 1]`: let `L = sum(i..m)` and `R = sum(m+1..j)`.",
          "If `L < R` the candidate is `L + best(i, m)`; if `L > R` it is `R + best(m+1, j)`; if `L == R` it is `L + max(best(i, m), best(m+1, j))`.",
          "`best(i, j)` is the largest candidate. Return `best(0, n - 1)`.",
        ],
        why: "Bob's move is forced by the sums, so each split leads to exactly one continuation (two when the sums tie, and Alice picks the better one). Alice's score is the kept sum plus whatever she can make of the kept range, which is exactly `best` of a strictly shorter range — so filling ranges by length always has the needed values ready, and the maximum over all splits is her optimum.",
        time: "O(n^3)",
        space: "O(n^2)",
        pitfalls: [
          "The kept part is the one with the **smaller** sum, and that smaller sum is what Alice scores.",
          "On a tie Alice may keep either part — take the larger continuation, not just one side.",
          "Recomputing part sums inside the split loop makes it O(n^4); use prefix sums.",
        ],
      }),
      examples: [
        { input: "[2,4,1,3]", expectedOutput: "5" },
        { input: "[5,5,4,3,2,6]", expectedOutput: "18" },
        { input: "[9]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [ri(rng, 1, 6), ri(rng, 4, 14), ri(rng, 10, 24)]);
        const kind = ri(rng, 0, 3);
        let a: number[];
        if (kind === 0) a = Array.from({ length: n }, () => ri(rng, 1, 1000000));
        else if (kind === 1) a = Array.from({ length: n }, () => ri(rng, 1, 4));
        else if (kind === 2) { const v = ri(rng, 1, 1000000); a = new Array(n).fill(v); }
        else a = Array.from({ length: n }, () => ri(rng, 1, 30));
        return { input: fmtIntArr(a), expectedOutput: String(ref(a)) };
      },
      solutions: {
        python: code`
          from typing import List

          def stoneGameV(stoneValue: List[int]) -> int:
              n = len(stoneValue)
              pre = [0] * (n + 1)
              for i in range(n):
                  pre[i + 1] = pre[i] + stoneValue[i]
              best = [[0] * n for _ in range(n)]
              for length in range(2, n + 1):
                  for i in range(n - length + 1):
                      j = i + length - 1
                      top = 0
                      for m in range(i, j):
                          left = pre[m + 1] - pre[i]
                          right = pre[j + 1] - pre[m + 1]
                          if left < right:
                              cand = left + best[i][m]
                          elif left > right:
                              cand = right + best[m + 1][j]
                          else:
                              cand = left + max(best[i][m], best[m + 1][j])
                          if cand > top:
                              top = cand
                      best[i][j] = top
              return best[0][n - 1]
        `,
        javascript: code`
          var stoneGameV = function(stoneValue) {
              var n = stoneValue.length;
              var pre = new Array(n + 1).fill(0);
              for (var i = 0; i < n; i++) pre[i + 1] = pre[i] + stoneValue[i];
              var best = [];
              for (var i = 0; i < n; i++) best.push(new Array(n).fill(0));
              for (var len = 2; len <= n; len++) {
                  for (var i = 0; i + len <= n; i++) {
                      var j = i + len - 1, top = 0;
                      for (var m = i; m < j; m++) {
                          var left = pre[m + 1] - pre[i], right = pre[j + 1] - pre[m + 1], cand;
                          if (left < right) cand = left + best[i][m];
                          else if (left > right) cand = right + best[m + 1][j];
                          else cand = left + Math.max(best[i][m], best[m + 1][j]);
                          if (cand > top) top = cand;
                      }
                      best[i][j] = top;
                  }
              }
              return best[0][n - 1];
          };
        `,
        typescript: code`
          function stoneGameV(stoneValue: number[]): number {
              var n = stoneValue.length;
              var pre: number[] = [0];
              for (var i = 0; i < n; i++) pre.push(pre[i] + stoneValue[i]);
              var best: number[][] = [];
              for (var i = 0; i < n; i++) {
                  var row: number[] = [];
                  for (var j = 0; j < n; j++) row.push(0);
                  best.push(row);
              }
              for (var len = 2; len <= n; len++) {
                  for (var i = 0; i + len <= n; i++) {
                      var j = i + len - 1, top = 0;
                      for (var m = i; m < j; m++) {
                          var left = pre[m + 1] - pre[i], right = pre[j + 1] - pre[m + 1], cand: number;
                          if (left < right) cand = left + best[i][m];
                          else if (left > right) cand = right + best[m + 1][j];
                          else cand = left + Math.max(best[i][m], best[m + 1][j]);
                          if (cand > top) top = cand;
                      }
                      best[i][j] = top;
                  }
              }
              return best[0][n - 1];
          }
        `,
        java: code`
          public static int stoneGameV(int[] stoneValue) {
              int n = stoneValue.length;
              long[] pre = new long[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stoneValue[i];
              long[][] best = new long[n][n];
              for (int len = 2; len <= n; len++) {
                  for (int i = 0; i + len <= n; i++) {
                      int j = i + len - 1;
                      long top = 0;
                      for (int m = i; m < j; m++) {
                          long left = pre[m + 1] - pre[i], right = pre[j + 1] - pre[m + 1], cand;
                          if (left < right) cand = left + best[i][m];
                          else if (left > right) cand = right + best[m + 1][j];
                          else cand = left + Math.max(best[i][m], best[m + 1][j]);
                          if (cand > top) top = cand;
                      }
                      best[i][j] = top;
                  }
              }
              return (int) best[0][n - 1];
          }
        `,
        cpp: code`
          int stoneGameV(vector<int>& stoneValue) {
              int n = stoneValue.size();
              vector<long long> pre(n + 1, 0);
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stoneValue[i];
              vector<vector<long long>> best(n, vector<long long>(n, 0));
              for (int len = 2; len <= n; len++) {
                  for (int i = 0; i + len <= n; i++) {
                      int j = i + len - 1;
                      long long top = 0;
                      for (int m = i; m < j; m++) {
                          long long left = pre[m + 1] - pre[i], right = pre[j + 1] - pre[m + 1], cand;
                          if (left < right) cand = left + best[i][m];
                          else if (left > right) cand = right + best[m + 1][j];
                          else cand = left + max(best[i][m], best[m + 1][j]);
                          if (cand > top) top = cand;
                      }
                      best[i][j] = top;
                  }
              }
              return (int)best[0][n - 1];
          }
        `,
        c: code`
          int stoneGameV(int* stoneValue, int stoneValueSize) {
              int n = stoneValueSize;
              long long* pre = (long long*)calloc(n + 1, sizeof(long long));
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stoneValue[i];
              long long* best = (long long*)calloc((size_t)n * n, sizeof(long long));
              for (int len = 2; len <= n; len++) {
                  for (int i = 0; i + len <= n; i++) {
                      int j = i + len - 1;
                      long long top = 0;
                      for (int m = i; m < j; m++) {
                          long long left = pre[m + 1] - pre[i], right = pre[j + 1] - pre[m + 1], cand;
                          if (left < right) cand = left + best[i * n + m];
                          else if (left > right) cand = right + best[(m + 1) * n + j];
                          else {
                              long long a = best[i * n + m], b = best[(m + 1) * n + j];
                              cand = left + (a > b ? a : b);
                          }
                          if (cand > top) top = cand;
                      }
                      best[i * n + j] = top;
                  }
              }
              int ans = (int)best[n - 1];
              free(pre);
              free(best);
              return ans;
          }
        `,
        csharp: code`
          public static int StoneGameV(int[] stoneValue)
          {
              int n = stoneValue.Length;
              long[] pre = new long[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + stoneValue[i];
              long[,] best = new long[n, n];
              for (int len = 2; len <= n; len++)
              {
                  for (int i = 0; i + len <= n; i++)
                  {
                      int j = i + len - 1;
                      long top = 0;
                      for (int m = i; m < j; m++)
                      {
                          long left = pre[m + 1] - pre[i], right = pre[j + 1] - pre[m + 1], cand;
                          if (left < right) cand = left + best[i, m];
                          else if (left > right) cand = right + best[m + 1, j];
                          else cand = left + Math.Max(best[i, m], best[m + 1, j]);
                          if (cand > top) top = cand;
                      }
                      best[i, j] = top;
                  }
              }
              return (int)best[0, n - 1];
          }
        `,
        go: code`
          func stoneGameV(stoneValue []int) int {
              n := len(stoneValue)
              pre := make([]int, n+1)
              for i := 0; i < n; i++ {
                  pre[i+1] = pre[i] + stoneValue[i]
              }
              best := make([][]int, n)
              for i := range best {
                  best[i] = make([]int, n)
              }
              for length := 2; length <= n; length++ {
                  for i := 0; i+length <= n; i++ {
                      j := i + length - 1
                      top := 0
                      for m := i; m < j; m++ {
                          left := pre[m+1] - pre[i]
                          right := pre[j+1] - pre[m+1]
                          var cand int
                          if left < right {
                              cand = left + best[i][m]
                          } else if left > right {
                              cand = right + best[m+1][j]
                          } else {
                              cand = best[i][m]
                              if best[m+1][j] > cand {
                                  cand = best[m+1][j]
                              }
                              cand += left
                          }
                          if cand > top {
                              top = cand
                          }
                      }
                      best[i][j] = top
                  }
              }
              return best[0][n-1]
          }
        `,
        kotlin: code`
          fun stoneGameV(stoneValue: IntArray): Int {
              val n = stoneValue.size
              val pre = LongArray(n + 1)
              for (i in 0 until n) pre[i + 1] = pre[i] + stoneValue[i]
              val best = Array(n) { LongArray(n) }
              for (len in 2..n) {
                  for (i in 0..n - len) {
                      val j = i + len - 1
                      var top = 0L
                      for (m in i until j) {
                          val left = pre[m + 1] - pre[i]
                          val right = pre[j + 1] - pre[m + 1]
                          val cand = when {
                              left < right -> left + best[i][m]
                              left > right -> right + best[m + 1][j]
                              else -> left + maxOf(best[i][m], best[m + 1][j])
                          }
                          if (cand > top) top = cand
                      }
                      best[i][j] = top
                  }
              }
              return best[0][n - 1].toInt()
          }
        `,
        swift: code`
          func stoneGameV(_ stoneValue: [Int]) -> Int {
              let n = stoneValue.count
              var pre = [Int](repeating: 0, count: n + 1)
              for i in 0..<n { pre[i + 1] = pre[i] + stoneValue[i] }
              var best = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)
              if n >= 2 {
                  for len in 2...n {
                      for i in 0...(n - len) {
                          let j = i + len - 1
                          var top = 0
                          for m in i..<j {
                              let left = pre[m + 1] - pre[i]
                              let right = pre[j + 1] - pre[m + 1]
                              var cand: Int
                              if left < right {
                                  cand = left + best[i][m]
                              } else if left > right {
                                  cand = right + best[m + 1][j]
                              } else {
                                  cand = left + max(best[i][m], best[m + 1][j])
                              }
                              if cand > top { top = cand }
                          }
                          best[i][j] = top
                      }
                  }
              }
              return best[0][n - 1]
          }
        `,
        rust: code`
          fn stoneGameV(stone_value: Vec<i32>) -> i32 {
              let n = stone_value.len();
              let mut pre = vec![0i64; n + 1];
              for i in 0..n {
                  pre[i + 1] = pre[i] + stone_value[i] as i64;
              }
              let mut best = vec![vec![0i64; n]; n];
              for len in 2..=n {
                  for i in 0..=(n - len) {
                      let j = i + len - 1;
                      let mut top: i64 = 0;
                      for m in i..j {
                          let left = pre[m + 1] - pre[i];
                          let right = pre[j + 1] - pre[m + 1];
                          let cand = if left < right {
                              left + best[i][m]
                          } else if left > right {
                              right + best[m + 1][j]
                          } else {
                              left + std::cmp::max(best[i][m], best[m + 1][j])
                          };
                          if cand > top {
                              top = cand;
                          }
                      }
                      best[i][j] = top;
                  }
              }
              best[0][n - 1] as i32
          }
        `,
        php: code`
          function stoneGameV($stoneValue) {
              $n = count($stoneValue);
              $pre = array_fill(0, $n + 1, 0);
              for ($i = 0; $i < $n; $i++) $pre[$i + 1] = $pre[$i] + $stoneValue[$i];
              $best = array_fill(0, $n, array_fill(0, $n, 0));
              for ($len = 2; $len <= $n; $len++) {
                  for ($i = 0; $i + $len <= $n; $i++) {
                      $j = $i + $len - 1;
                      $top = 0;
                      for ($m = $i; $m < $j; $m++) {
                          $left = $pre[$m + 1] - $pre[$i];
                          $right = $pre[$j + 1] - $pre[$m + 1];
                          if ($left < $right) $cand = $left + $best[$i][$m];
                          elseif ($left > $right) $cand = $right + $best[$m + 1][$j];
                          else $cand = $left + max($best[$i][$m], $best[$m + 1][$j]);
                          if ($cand > $top) $top = $cand;
                      }
                      $best[$i][$j] = $top;
                  }
              }
              return $best[0][$n - 1];
          }
        `,
        ruby: code`
          def stoneGameV(stoneValue)
            n = stoneValue.length
            pre = Array.new(n + 1, 0)
            (0...n).each { |i| pre[i + 1] = pre[i] + stoneValue[i] }
            best = Array.new(n) { Array.new(n, 0) }
            (2..n).each do |len|
              (0..(n - len)).each do |i|
                j = i + len - 1
                top = 0
                (i...j).each do |m|
                  left = pre[m + 1] - pre[i]
                  right = pre[j + 1] - pre[m + 1]
                  cand = if left < right
                           left + best[i][m]
                         elsif left > right
                           right + best[m + 1][j]
                         else
                           left + [best[i][m], best[m + 1][j]].max
                         end
                  top = cand if cand > top
                end
                best[i][j] = top
              end
            end
            best[0][n - 1]
          end
        `,
      },
    };
  })(),

  // ── Dice Roll Simulation (LC 1223) ──────────────────────────────
  (() => {
    // Explicit run-length states: cnt[f][r] = sequences ending in exactly r
    // consecutive rolls of face f — no telescoping, unlike the solutions.
    const ref = (n: number, rollMax: number[]) => {
      const MOD = 1000000007;
      let cnt: number[][] = Array.from({ length: 6 }, () => new Array(16).fill(0));
      for (let f = 0; f < 6; f++) cnt[f][1] = 1;
      for (let step = 2; step <= n; step++) {
        const nxt: number[][] = Array.from({ length: 6 }, () => new Array(16).fill(0));
        let all = 0;
        const per = new Array(6).fill(0);
        for (let f = 0; f < 6; f++) {
          for (let r = 1; r <= 15; r++) per[f] = (per[f] + cnt[f][r]) % MOD;
          all = (all + per[f]) % MOD;
        }
        for (let f = 0; f < 6; f++) {
          nxt[f][1] = (all - per[f] + MOD) % MOD;
          for (let r = 1; r < rollMax[f]; r++) nxt[f][r + 1] = cnt[f][r];
        }
        cnt = nxt;
      }
      let total = 0;
      for (let f = 0; f < 6; f++) for (let r = 1; r <= 15; r++) total = (total + cnt[f][r]) % MOD;
      return total;
    };
    return {
      slug: "dice-roll-simulation",
      title: "Dice Roll Simulation",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "dieSimulator",
        params: [{ name: "n", type: "int" as const }, { name: "rollMax", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A die simulator produces a number from `1` to `6` on every roll, but with a restriction: face `i` may not come up more than `rollMax[i - 1]` times **in a row** (the array is 0-indexed, the faces are 1-indexed).\n\n" +
        "Given `n` and `rollMax`, return how many distinct sequences of exactly `n` rolls the simulator can produce. Two sequences are distinct if they differ in at least one roll. Return the count **modulo** `10^9 + 7`.",
        [
          { in: "n = 2, rollMax = [1,2,2,2,2,2]", out: "35", note: "Of the 36 two-roll sequences only `(1,1)` is forbidden — face 1 cannot repeat." },
          { in: "n = 3, rollMax = [1,1,1,1,1,1]", out: "150", note: "No face may repeat: 6 · 5 · 5 sequences." },
          { in: "n = 4, rollMax = [3,3,3,3,3,3]", out: "1290", note: "Only the six sequences with one face four times running are excluded: 1296 − 6." },
        ],
        ["1 <= n <= 5000", "rollMax.length == 6", "1 <= rollMax[i] <= 15"]),
      hints: [
        "A sequence stays legal as long as its final run is short enough. What do you need to know about a prefix to extend it?",
        "Let `dp[i][j]` count legal sequences of `i` rolls ending in face `j`, and `total[i]` all legal sequences of `i` rolls. Appending `j` to any legal sequence of `i - 1` rolls gives `total[i-1]` candidates.",
        "The bad candidates are those whose last `rollMax[j]` rolls were already `j` with a different roll (or nothing) before: there are `total[i-1-r] - dp[i-1-r][j]` of them when `i - 1 - r >= 0`. Subtract and reduce modulo 10^9 + 7.",
      ],
      editorial: explain({
        idea: "Count sequences by their last face. Appending face `j` to a legal sequence of `i - 1` rolls is illegal only when that sequence already ended in a run of exactly `r = rollMax[j]` copies of `j` — and those sequences are in one-to-one correspondence with legal sequences of `i - 1 - r` rolls that do **not** end in `j`.",
        steps: [
          "`total[0] = 1` (the empty sequence) and `dp[0][j] = 0` for every face.",
          "For `i` from 1 to `n` and each face `j` with `r = rollMax[j]`: `dp[i][j] = total[i-1]`, minus `total[i-1-r] - dp[i-1-r][j]` when `i - 1 - r >= 0`.",
          "`total[i]` is the sum of `dp[i][j]` over the six faces.",
          "Keep everything modulo 10^9 + 7, adding the modulus back after a subtraction. Return `total[n]`.",
        ],
        why: "A legal sequence of length `i - 1` ending in a run of exactly `r` copies of `j` is a legal sequence of length `i - 1 - r` that does not end in `j` (possibly the empty one), followed by `r` copies of `j`. Appending one more `j` to it would make a run of `r + 1`, and it is the only way appending `j` can break the rule — shorter runs stay legal. So `dp[i][j]` equals all extensions minus exactly that set, which has `total[i-1-r] - dp[i-1-r][j]` members.",
        time: "O(6 · n)",
        space: "O(6 · n)",
        pitfalls: [
          "The empty prefix counts: when `i - 1 - r == 0` the subtraction is `total[0] - dp[0][j] = 1`.",
          "After subtracting, add the modulus before reducing, or languages with truncating `%` give negative results.",
          "`total[i]` sums six values below 10^9 + 7 — use 64-bit integers.",
        ],
      }),
      examples: [
        { input: "2\n[1,2,2,2,2,2]", expectedOutput: "35" },
        { input: "3\n[1,1,1,1,1,1]", expectedOutput: "150" },
        { input: "4\n[3,3,3,3,3,3]", expectedOutput: "1290" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.01 ? ri(rng, 1000, 5000) : pick(rng, [ri(rng, 1, 5), ri(rng, 1, 30), ri(rng, 20, 200)]);
        const kind = ri(rng, 0, 3);
        let rollMax: number[];
        if (kind === 0) rollMax = Array.from({ length: 6 }, () => ri(rng, 1, 15));
        else if (kind === 1) rollMax = Array.from({ length: 6 }, () => ri(rng, 1, 3));
        else if (kind === 2) { const v = ri(rng, 1, 15); rollMax = new Array(6).fill(v); }
        else rollMax = Array.from({ length: 6 }, () => pick(rng, [1, 15]));
        return { input: `${n}\n${fmtIntArr(rollMax)}`, expectedOutput: String(ref(n, rollMax)) };
      },
      solutions: {
        python: code`
          from typing import List

          def dieSimulator(n: int, rollMax: List[int]) -> int:
              MOD = 10 ** 9 + 7
              dp = [[0] * 6 for _ in range(n + 1)]
              total = [0] * (n + 1)
              total[0] = 1
              for i in range(1, n + 1):
                  for j in range(6):
                      r = rollMax[j]
                      v = total[i - 1]
                      if i - 1 - r >= 0:
                          v -= total[i - 1 - r] - dp[i - 1 - r][j]
                      dp[i][j] = v % MOD
                  total[i] = sum(dp[i]) % MOD
              return total[n]
        `,
        javascript: code`
          var dieSimulator = function(n, rollMax) {
              var MOD = 1000000007;
              var dp = [], total = new Array(n + 1).fill(0);
              for (var i = 0; i <= n; i++) dp.push([0, 0, 0, 0, 0, 0]);
              total[0] = 1;
              for (var i = 1; i <= n; i++) {
                  var sum = 0;
                  for (var j = 0; j < 6; j++) {
                      var r = rollMax[j], v = total[i - 1];
                      if (i - 1 - r >= 0) v -= total[i - 1 - r] - dp[i - 1 - r][j];
                      v = ((v % MOD) + MOD) % MOD;
                      dp[i][j] = v;
                      sum += v;
                  }
                  total[i] = sum % MOD;
              }
              return total[n];
          };
        `,
        typescript: code`
          function dieSimulator(n: number, rollMax: number[]): number {
              var MOD = 1000000007;
              var dp: number[][] = [], total: number[] = [];
              for (var i = 0; i <= n; i++) {
                  dp.push([0, 0, 0, 0, 0, 0]);
                  total.push(0);
              }
              total[0] = 1;
              for (var i = 1; i <= n; i++) {
                  var sum = 0;
                  for (var j = 0; j < 6; j++) {
                      var r = rollMax[j], v = total[i - 1];
                      if (i - 1 - r >= 0) v -= total[i - 1 - r] - dp[i - 1 - r][j];
                      v = ((v % MOD) + MOD) % MOD;
                      dp[i][j] = v;
                      sum += v;
                  }
                  total[i] = sum % MOD;
              }
              return total[n];
          }
        `,
        java: code`
          public static int dieSimulator(int n, int[] rollMax) {
              final long MOD = 1000000007L;
              long[][] dp = new long[n + 1][6];
              long[] total = new long[n + 1];
              total[0] = 1;
              for (int i = 1; i <= n; i++) {
                  long sum = 0;
                  for (int j = 0; j < 6; j++) {
                      int r = rollMax[j];
                      long v = total[i - 1];
                      if (i - 1 - r >= 0) v -= total[i - 1 - r] - dp[i - 1 - r][j];
                      v = ((v % MOD) + MOD) % MOD;
                      dp[i][j] = v;
                      sum += v;
                  }
                  total[i] = sum % MOD;
              }
              return (int) total[n];
          }
        `,
        cpp: code`
          int dieSimulator(int n, vector<int>& rollMax) {
              const long long MOD = 1000000007LL;
              vector<vector<long long>> dp(n + 1, vector<long long>(6, 0));
              vector<long long> total(n + 1, 0);
              total[0] = 1;
              for (int i = 1; i <= n; i++) {
                  long long sum = 0;
                  for (int j = 0; j < 6; j++) {
                      int r = rollMax[j];
                      long long v = total[i - 1];
                      if (i - 1 - r >= 0) v -= total[i - 1 - r] - dp[i - 1 - r][j];
                      v = ((v % MOD) + MOD) % MOD;
                      dp[i][j] = v;
                      sum += v;
                  }
                  total[i] = sum % MOD;
              }
              return (int)total[n];
          }
        `,
        c: code`
          int dieSimulator(int n, int* rollMax, int rollMaxSize) {
              const long long MOD = 1000000007LL;
              long long* dp = (long long*)calloc((size_t)(n + 1) * 6, sizeof(long long));
              long long* total = (long long*)calloc(n + 1, sizeof(long long));
              total[0] = 1;
              for (int i = 1; i <= n; i++) {
                  long long sum = 0;
                  for (int j = 0; j < 6; j++) {
                      int r = rollMax[j];
                      long long v = total[i - 1];
                      if (i - 1 - r >= 0) v -= total[i - 1 - r] - dp[(i - 1 - r) * 6 + j];
                      v = ((v % MOD) + MOD) % MOD;
                      dp[i * 6 + j] = v;
                      sum += v;
                  }
                  total[i] = sum % MOD;
              }
              int ans = (int)total[n];
              free(dp);
              free(total);
              return ans;
          }
        `,
        csharp: code`
          public static int DieSimulator(int n, int[] rollMax)
          {
              const long MOD = 1000000007L;
              long[,] dp = new long[n + 1, 6];
              long[] total = new long[n + 1];
              total[0] = 1;
              for (int i = 1; i <= n; i++)
              {
                  long sum = 0;
                  for (int j = 0; j < 6; j++)
                  {
                      int r = rollMax[j];
                      long v = total[i - 1];
                      if (i - 1 - r >= 0) v -= total[i - 1 - r] - dp[i - 1 - r, j];
                      v = ((v % MOD) + MOD) % MOD;
                      dp[i, j] = v;
                      sum += v;
                  }
                  total[i] = sum % MOD;
              }
              return (int)total[n];
          }
        `,
        go: code`
          func dieSimulator(n int, rollMax []int) int {
              const mod = 1000000007
              dp := make([][6]int, n+1)
              total := make([]int, n+1)
              total[0] = 1
              for i := 1; i <= n; i++ {
                  sum := 0
                  for j := 0; j < 6; j++ {
                      r := rollMax[j]
                      v := total[i-1]
                      if i-1-r >= 0 {
                          v -= total[i-1-r] - dp[i-1-r][j]
                      }
                      v = ((v % mod) + mod) % mod
                      dp[i][j] = v
                      sum += v
                  }
                  total[i] = sum % mod
              }
              return total[n]
          }
        `,
        kotlin: code`
          fun dieSimulator(n: Int, rollMax: IntArray): Int {
              val modulus = 1000000007L
              val dp = Array(n + 1) { LongArray(6) }
              val total = LongArray(n + 1)
              total[0] = 1L
              for (i in 1..n) {
                  var sum = 0L
                  for (j in 0 until 6) {
                      val r = rollMax[j]
                      var v = total[i - 1]
                      if (i - 1 - r >= 0) v -= total[i - 1 - r] - dp[i - 1 - r][j]
                      v = ((v % modulus) + modulus) % modulus
                      dp[i][j] = v
                      sum += v
                  }
                  total[i] = sum % modulus
              }
              return total[n].toInt()
          }
        `,
        swift: code`
          func dieSimulator(_ n: Int, _ rollMax: [Int]) -> Int {
              let modulus = 1000000007
              var dp = [[Int]](repeating: [Int](repeating: 0, count: 6), count: n + 1)
              var total = [Int](repeating: 0, count: n + 1)
              total[0] = 1
              if n >= 1 {
                  for i in 1...n {
                      var sum = 0
                      for j in 0..<6 {
                          let r = rollMax[j]
                          var v = total[i - 1]
                          if i - 1 - r >= 0 { v -= total[i - 1 - r] - dp[i - 1 - r][j] }
                          v = ((v % modulus) + modulus) % modulus
                          dp[i][j] = v
                          sum += v
                      }
                      total[i] = sum % modulus
                  }
              }
              return total[n]
          }
        `,
        rust: code`
          fn dieSimulator(n: i32, roll_max: Vec<i32>) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let n = n as usize;
              let mut dp = vec![[0i64; 6]; n + 1];
              let mut total = vec![0i64; n + 1];
              total[0] = 1;
              for i in 1..=n {
                  let mut sum: i64 = 0;
                  for j in 0..6 {
                      let r = roll_max[j] as usize;
                      let mut v = total[i - 1];
                      if i >= r + 1 {
                          v -= total[i - 1 - r] - dp[i - 1 - r][j];
                      }
                      v = ((v % modulus) + modulus) % modulus;
                      dp[i][j] = v;
                      sum += v;
                  }
                  total[i] = sum % modulus;
              }
              total[n] as i32
          }
        `,
        php: code`
          function dieSimulator($n, $rollMax) {
              $modulus = 1000000007;
              $dp = array_fill(0, $n + 1, array_fill(0, 6, 0));
              $total = array_fill(0, $n + 1, 0);
              $total[0] = 1;
              for ($i = 1; $i <= $n; $i++) {
                  $sum = 0;
                  for ($j = 0; $j < 6; $j++) {
                      $r = $rollMax[$j];
                      $v = $total[$i - 1];
                      if ($i - 1 - $r >= 0) $v -= $total[$i - 1 - $r] - $dp[$i - 1 - $r][$j];
                      $v = (($v % $modulus) + $modulus) % $modulus;
                      $dp[$i][$j] = $v;
                      $sum += $v;
                  }
                  $total[$i] = $sum % $modulus;
              }
              return $total[$n];
          }
        `,
        ruby: code`
          def dieSimulator(n, rollMax)
            modulus = 1_000_000_007
            dp = Array.new(n + 1) { Array.new(6, 0) }
            total = Array.new(n + 1, 0)
            total[0] = 1
            (1..n).each do |i|
              6.times do |j|
                r = rollMax[j]
                v = total[i - 1]
                v -= total[i - 1 - r] - dp[i - 1 - r][j] if i - 1 - r >= 0
                dp[i][j] = v % modulus
              end
              total[i] = dp[i].sum % modulus
            end
            total[n]
          end
        `,
      },
    };
  })(),

  // ── Maximum Profit in Job Scheduling (LC 1235) ──────────────────
  (() => {
    // O(n^2) over jobs sorted by start time: take a job and jump to the first
    // job starting at or after its end (linear scan), or skip it.
    const ref = (st: number[], en: number[], pr: number[]) => {
      const n = st.length;
      const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => st[a] - st[b]);
      const best = new Array(n + 1).fill(0);
      for (let t = n - 1; t >= 0; t--) {
        const i = idx[t];
        let nxt = n;
        for (let u = t + 1; u < n; u++) if (st[idx[u]] >= en[i]) { nxt = u; break; }
        best[t] = Math.max(best[t + 1], pr[i] + best[nxt]);
      }
      return best[0];
    };
    return {
      slug: "maximum-profit-in-job-scheduling",
      title: "Maximum Profit in Job Scheduling",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Dynamic Programming", "Sorting", "Amazon", "Google", "Microsoft", "Swiggy"],
      signature: {
        funcName: "jobScheduling",
        params: [
          { name: "startTime", type: "int[]" as const },
          { name: "endTime", type: "int[]" as const },
          { name: "profit", type: "int[]" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "There are `n` jobs. Job `i` runs from `startTime[i]` to `endTime[i]` and pays `profit[i]`.\n\n" +
        "Choose a set of jobs in which no two overlap in time, so that the total profit is as large as possible, and return that total. A job that ends at time `X` does **not** overlap a job that starts at time `X` — you may go straight from one to the other.",
        [
          { in: "startTime = [1,2,4,6], endTime = [3,5,6,9], profit = [20,30,25,40]", out: "85", note: "Jobs 0, 2 and 3 run back to back (1–3, 4–6, 6–9) for 20 + 25 + 40." },
          { in: "startTime = [1,1,1], endTime = [2,3,4], profit = [5,6,4]", out: "6", note: "All three overlap, so only one can be taken." },
          { in: "startTime = [1,3,2,5,7], endTime = [4,6,8,9,10], profit = [30,40,90,25,20]", out: "90" },
        ],
        [
          "1 <= startTime.length == endTime.length == profit.length <= 5 * 10^4",
          "1 <= startTime[i] < endTime[i] <= 10^9",
          "1 <= profit[i] <= 10^4",
        ]),
      hints: [
        "Sort the jobs by end time. Then the best schedule among the first `i` jobs either skips job `i` or ends with it.",
        "If it ends with job `i`, every other chosen job must end by `startTime` of job `i` — and those jobs form a prefix of the sorted order.",
        "Let `dp[i]` be the best profit using the first `i` jobs in end order. Binary-search the number `j` of jobs whose end is `<= start` of job `i`, and set `dp[i] = max(dp[i-1], dp[j] + profit)`.",
      ],
      editorial: explain({
        idea: "Weighted interval scheduling. Once jobs are ordered by end time, the jobs compatible with job `i` that come before it are exactly a **prefix** of that order — the ones ending no later than job `i` starts — so a binary search finds where to continue the DP.",
        steps: [
          "Sort job indices by end time; keep the sorted end times in an array `ends`.",
          "`dp[0] = 0`. For the `t`-th job in this order (1-based) with start `s` and profit `p`:",
          "Find `j` = the number of jobs whose end is `<= s` (upper bound of `s` in `ends`).",
          "`dp[t] = max(dp[t-1], dp[j] + p)` — skip the job, or take it after the best schedule of the first `j` jobs.",
          "Return `dp[n]`.",
        ],
        why: "Consider an optimal schedule of the first `t` jobs. If it does not use job `t`, its value is `dp[t-1]`. If it does, the other jobs end by `s`, and any job ending by `s` ends strictly before job `t` does, so they all lie among the first `j` jobs; conversely every one of those first `j` jobs is compatible with job `t`. The best way to use them is `dp[j]`, so the recurrence covers both cases exactly.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Touching endpoints are allowed: search for ends `<= start`, not `< start`.",
          "Sort by **end** time; sorting by start breaks the prefix property the binary search relies on.",
          "Greedy choices (most profitable first, earliest end first) both fail on weighted jobs.",
        ],
      }),
      examples: [
        { input: "[1,2,4,6]\n[3,5,6,9]\n[20,30,25,40]", expectedOutput: "85" },
        { input: "[1,1,1]\n[2,3,4]\n[5,6,4]", expectedOutput: "6" },
        { input: "[1,3,2,5,7]\n[4,6,8,9,10]\n[30,40,90,25,20]", expectedOutput: "90" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [ri(rng, 1, 4), ri(rng, 3, 15), ri(rng, 10, 40)]);
        const wide = rng() < 0.2;
        const span = pick(rng, [10, 30, 60]);
        const pmax = pick(rng, [10, 10000]);
        const st: number[] = [], en: number[] = [], pr: number[] = [];
        for (let i = 0; i < n; i++) {
          if (wide) {
            const s = ri(rng, 1, 999999000);
            st.push(s);
            en.push(s + ri(rng, 1, 1000));
          } else {
            const s = ri(rng, 1, span);
            st.push(s);
            en.push(s + ri(rng, 1, Math.max(1, Math.floor(span / 3))));
          }
          pr.push(ri(rng, 1, pmax));
        }
        if (wide && rng() < 0.5) { st[0] = 1; en[0] = 1000000000; }
        return { input: `${fmtIntArr(st)}\n${fmtIntArr(en)}\n${fmtIntArr(pr)}`, expectedOutput: String(ref(st, en, pr)) };
      },
      solutions: {
        python: code`
          from typing import List
          from bisect import bisect_right

          def jobScheduling(startTime: List[int], endTime: List[int], profit: List[int]) -> int:
              n = len(startTime)
              order = sorted(range(n), key=lambda i: endTime[i])
              ends = [endTime[i] for i in order]
              dp = [0] * (n + 1)
              for t in range(1, n + 1):
                  i = order[t - 1]
                  j = bisect_right(ends, startTime[i])
                  dp[t] = max(dp[t - 1], dp[j] + profit[i])
              return dp[n]
        `,
        javascript: code`
          var jobScheduling = function(startTime, endTime, profit) {
              var n = startTime.length;
              var order = [];
              for (var i = 0; i < n; i++) order.push(i);
              order.sort(function(a, b) { return endTime[a] - endTime[b]; });
              var ends = order.map(function(i) { return endTime[i]; });
              var dp = new Array(n + 1).fill(0);
              for (var t = 1; t <= n; t++) {
                  var i = order[t - 1], s = startTime[i];
                  var lo = 0, hi = n;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (ends[mid] <= s) lo = mid + 1; else hi = mid;
                  }
                  dp[t] = Math.max(dp[t - 1], dp[lo] + profit[i]);
              }
              return dp[n];
          };
        `,
        typescript: code`
          function jobScheduling(startTime: number[], endTime: number[], profit: number[]): number {
              var n = startTime.length;
              var order: number[] = [];
              for (var i = 0; i < n; i++) order.push(i);
              order.sort(function(a, b) { return endTime[a] - endTime[b]; });
              var ends: number[] = [];
              for (var i = 0; i < n; i++) ends.push(endTime[order[i]]);
              var dp: number[] = [0];
              for (var t = 1; t <= n; t++) {
                  var idx = order[t - 1], s = startTime[idx];
                  var lo = 0, hi = n;
                  while (lo < hi) {
                      var mid = (lo + hi) >> 1;
                      if (ends[mid] <= s) lo = mid + 1; else hi = mid;
                  }
                  dp.push(Math.max(dp[t - 1], dp[lo] + profit[idx]));
              }
              return dp[n];
          }
        `,
        java: code`
          public static int jobScheduling(int[] startTime, int[] endTime, int[] profit) {
              int n = startTime.length;
              Integer[] order = new Integer[n];
              for (int i = 0; i < n; i++) order[i] = i;
              Arrays.sort(order, (a, b) -> Integer.compare(endTime[a], endTime[b]));
              int[] ends = new int[n];
              for (int i = 0; i < n; i++) ends[i] = endTime[order[i]];
              int[] dp = new int[n + 1];
              for (int t = 1; t <= n; t++) {
                  int i = order[t - 1], s = startTime[i];
                  int lo = 0, hi = n;
                  while (lo < hi) {
                      int mid = (lo + hi) >>> 1;
                      if (ends[mid] <= s) lo = mid + 1; else hi = mid;
                  }
                  dp[t] = Math.max(dp[t - 1], dp[lo] + profit[i]);
              }
              return dp[n];
          }
        `,
        cpp: code`
          int jobScheduling(vector<int>& startTime, vector<int>& endTime, vector<int>& profit) {
              int n = startTime.size();
              vector<int> order(n);
              for (int i = 0; i < n; i++) order[i] = i;
              sort(order.begin(), order.end(), [&](int a, int b) { return endTime[a] < endTime[b]; });
              vector<int> ends(n);
              for (int i = 0; i < n; i++) ends[i] = endTime[order[i]];
              vector<int> dp(n + 1, 0);
              for (int t = 1; t <= n; t++) {
                  int i = order[t - 1];
                  int j = upper_bound(ends.begin(), ends.end(), startTime[i]) - ends.begin();
                  dp[t] = max(dp[t - 1], dp[j] + profit[i]);
              }
              return dp[n];
          }
        `,
        c: code`
          typedef struct { int s, e, p; } SchedJob;

          static int cmpSchedJob(const void* a, const void* b) {
              int x = ((const SchedJob*)a)->e, y = ((const SchedJob*)b)->e;
              return (x > y) - (x < y);
          }

          int jobScheduling(int* startTime, int startTimeSize, int* endTime, int endTimeSize, int* profit, int profitSize) {
              int n = startTimeSize;
              SchedJob* jobs = (SchedJob*)malloc(sizeof(SchedJob) * n);
              for (int i = 0; i < n; i++) {
                  jobs[i].s = startTime[i];
                  jobs[i].e = endTime[i];
                  jobs[i].p = profit[i];
              }
              qsort(jobs, n, sizeof(SchedJob), cmpSchedJob);
              int* dp = (int*)calloc(n + 1, sizeof(int));
              for (int t = 1; t <= n; t++) {
                  int s = jobs[t - 1].s;
                  int lo = 0, hi = n;
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (jobs[mid].e <= s) lo = mid + 1; else hi = mid;
                  }
                  int take = dp[lo] + jobs[t - 1].p;
                  dp[t] = dp[t - 1] > take ? dp[t - 1] : take;
              }
              int ans = dp[n];
              free(jobs);
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int JobScheduling(int[] startTime, int[] endTime, int[] profit)
          {
              int n = startTime.Length;
              int[] order = Enumerable.Range(0, n).OrderBy(i => endTime[i]).ToArray();
              int[] ends = new int[n];
              for (int i = 0; i < n; i++) ends[i] = endTime[order[i]];
              int[] dp = new int[n + 1];
              for (int t = 1; t <= n; t++)
              {
                  int idx = order[t - 1], s = startTime[idx];
                  int lo = 0, hi = n;
                  while (lo < hi)
                  {
                      int mid = (lo + hi) / 2;
                      if (ends[mid] <= s) lo = mid + 1; else hi = mid;
                  }
                  dp[t] = Math.Max(dp[t - 1], dp[lo] + profit[idx]);
              }
              return dp[n];
          }
        `,
        go: code`
          func jobScheduling(startTime []int, endTime []int, profit []int) int {
              n := len(startTime)
              order := make([]int, n)
              for i := range order {
                  order[i] = i
              }
              sort.Slice(order, func(a, b int) bool { return endTime[order[a]] < endTime[order[b]] })
              ends := make([]int, n)
              for i := 0; i < n; i++ {
                  ends[i] = endTime[order[i]]
              }
              dp := make([]int, n+1)
              for t := 1; t <= n; t++ {
                  i := order[t-1]
                  s := startTime[i]
                  lo, hi := 0, n
                  for lo < hi {
                      mid := (lo + hi) / 2
                      if ends[mid] <= s {
                          lo = mid + 1
                      } else {
                          hi = mid
                      }
                  }
                  dp[t] = dp[t-1]
                  if dp[lo]+profit[i] > dp[t] {
                      dp[t] = dp[lo] + profit[i]
                  }
              }
              return dp[n]
          }
        `,
        kotlin: code`
          fun jobScheduling(startTime: IntArray, endTime: IntArray, profit: IntArray): Int {
              val n = startTime.size
              val order = (0 until n).sortedBy { endTime[it] }
              val ends = IntArray(n) { endTime[order[it]] }
              val dp = IntArray(n + 1)
              for (t in 1..n) {
                  val i = order[t - 1]
                  val s = startTime[i]
                  var lo = 0
                  var hi = n
                  while (lo < hi) {
                      val mid = (lo + hi) / 2
                      if (ends[mid] <= s) lo = mid + 1 else hi = mid
                  }
                  dp[t] = maxOf(dp[t - 1], dp[lo] + profit[i])
              }
              return dp[n]
          }
        `,
        swift: code`
          func jobScheduling(_ startTime: [Int], _ endTime: [Int], _ profit: [Int]) -> Int {
              let n = startTime.count
              let order = (0..<n).sorted { endTime[$0] < endTime[$1] }
              let ends = order.map { endTime[$0] }
              var dp = [Int](repeating: 0, count: n + 1)
              for t in 1...n {
                  let i = order[t - 1]
                  let s = startTime[i]
                  var lo = 0
                  var hi = n
                  while lo < hi {
                      let mid = (lo + hi) / 2
                      if ends[mid] <= s { lo = mid + 1 } else { hi = mid }
                  }
                  dp[t] = max(dp[t - 1], dp[lo] + profit[i])
              }
              return dp[n]
          }
        `,
        rust: code`
          fn jobScheduling(start_time: Vec<i32>, end_time: Vec<i32>, profit: Vec<i32>) -> i32 {
              let n = start_time.len();
              let mut order: Vec<usize> = (0..n).collect();
              order.sort_by_key(|&i| end_time[i]);
              let ends: Vec<i32> = order.iter().map(|&i| end_time[i]).collect();
              let mut dp = vec![0i32; n + 1];
              for t in 1..=n {
                  let i = order[t - 1];
                  let s = start_time[i];
                  let mut lo = 0;
                  let mut hi = n;
                  while lo < hi {
                      let mid = (lo + hi) / 2;
                      if ends[mid] <= s {
                          lo = mid + 1;
                      } else {
                          hi = mid;
                      }
                  }
                  dp[t] = std::cmp::max(dp[t - 1], dp[lo] + profit[i]);
              }
              dp[n]
          }
        `,
        php: code`
          function jobScheduling($startTime, $endTime, $profit) {
              $n = count($startTime);
              $order = range(0, $n - 1);
              usort($order, function ($a, $b) use ($endTime) { return $endTime[$a] <=> $endTime[$b]; });
              $ends = [];
              foreach ($order as $i) $ends[] = $endTime[$i];
              $dp = array_fill(0, $n + 1, 0);
              for ($t = 1; $t <= $n; $t++) {
                  $i = $order[$t - 1];
                  $s = $startTime[$i];
                  $lo = 0;
                  $hi = $n;
                  while ($lo < $hi) {
                      $mid = intdiv($lo + $hi, 2);
                      if ($ends[$mid] <= $s) $lo = $mid + 1; else $hi = $mid;
                  }
                  $dp[$t] = max($dp[$t - 1], $dp[$lo] + $profit[$i]);
              }
              return $dp[$n];
          }
        `,
        ruby: code`
          def jobScheduling(startTime, endTime, profit)
            n = startTime.length
            order = (0...n).sort_by { |i| endTime[i] }
            ends = order.map { |i| endTime[i] }
            dp = Array.new(n + 1, 0)
            (1..n).each do |t|
              i = order[t - 1]
              s = startTime[i]
              lo = 0
              hi = n
              while lo < hi
                mid = (lo + hi) / 2
                if ends[mid] <= s
                  lo = mid + 1
                else
                  hi = mid
                end
              end
              dp[t] = [dp[t - 1], dp[lo] + profit[i]].max
            end
            dp[n]
          end
        `,
      },
    };
  })(),

  // ── Minimum Distance to Type a Word Using Two Fingers (LC 1320) ─
  (() => {
    // Tracks both fingers explicitly — every reachable (finger 1, finger 2)
    // pair — instead of the solutions' "the other finger" compression.
    const ref = (word: string) => {
      const d = (a: number, b: number) => (a === 26 ? 0 : Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) + Math.abs((a % 6) - (b % 6)));
      let states = new Map<number, number>([[26 * 27 + 26, 0]]);
      for (let i = 0; i < word.length; i++) {
        const c = word.charCodeAt(i) - 65;
        const nx = new Map<number, number>();
        const up = (key: number, v: number) => { const o = nx.get(key); if (o === undefined || v < o) nx.set(key, v); };
        states.forEach((cost, key) => {
          const a = Math.floor(key / 27), b = key % 27;
          up(c * 27 + b, cost + d(a, c));
          up(a * 27 + c, cost + d(b, c));
        });
        states = nx;
      }
      let best = Infinity;
      states.forEach((v) => { if (v < best) best = v; });
      return best;
    };
    return {
      slug: "minimum-distance-to-type-a-word-using-two-fingers",
      title: "Minimum Distance to Type a Word Using Two Fingers",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Google", "Amazon"],
      signature: { funcName: "minimumDistance", params: [{ name: "word", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A keyboard places the 26 capital letters on a grid six keys wide, in order: `A`–`F` on row 0, `G`–`L` on row 1, `M`–`R` on row 2, `S`–`X` on row 3 and `Y`, `Z` on row 4. In other words the `i`-th letter (0-based) sits at row `i / 6`, column `i % 6`. The distance between two keys at `(x1, y1)` and `(x2, y2)` is `|x1 - x2| + |y1 - y2|`.\n\n" +
        "You type the string `word` using two fingers. Each finger may start on any key for free — the first press of each finger costs nothing. After that, every press costs the distance the finger moves from the key it pressed last. Either finger may type any letter.\n\n" +
        "Return the minimum total distance needed to type `word`.",
        [
          { in: "word = \"KAIRO\"", out: "6", note: "One finger types K then R (distance 2); the other types A, I, O (distances 3 and 1)." },
          { in: "word = \"CODEKAIRO\"", out: "13" },
          { in: "word = \"AZ\"", out: "0", note: "Each finger presses one key, and first presses are free." },
        ],
        ["2 <= word.length <= 300", "word consists of uppercase English letters"]),
      hints: [
        "After typing `word[i]`, one finger is certainly resting on `word[i]`. What else do you need to know?",
        "Only the position of the **other** finger matters — or the fact that it has not been used yet. That is 27 possible states.",
        "Let `dp[o]` be the least cost so far with the other finger on key `o` (26 = unused). For the next letter, either the finger on `word[i]` moves (`o` unchanged) or the other finger moves from `o` (free if unused) and the old finger becomes the 'other' one, resting on `word[i]`.",
      ],
      editorial: explain({
        idea: "The state after typing a prefix is the pair of finger positions, but one of them is always the last letter typed — so the only free information is where the other finger is, or that it has never been used. That collapses the state to 27 values per position.",
        steps: [
          "Let `dist(a, b)` be the grid distance, with `dist(26, b) = 0` for an unused finger.",
          "Start with `dp[26] = 0` after the first letter (typed by one finger for free) and every other `dp` value infinite.",
          "For each next letter `cur` with previous letter `prev`, build `next`: for every finite `dp[o]`, set `next[o] = min(next[o], dp[o] + dist(prev, cur))` (the finger on `prev` types `cur`) and `next[prev] = min(next[prev], dp[o] + dist(o, cur))` (the other finger types `cur`).",
          "After the last letter, return the minimum over `dp`.",
        ],
        why: "Every typing plan corresponds to a path through these states: at each letter exactly one of the two fingers presses it, and the finger that does not press keeps its position. Because the costs of later presses depend only on the two current positions, keeping the minimum cost per state loses nothing, and the two transitions enumerate both possible choices.",
        time: "O(27 · n)",
        space: "O(27)",
        pitfalls: [
          "The second finger's first press is free — model the unused state explicitly rather than starting it on some key.",
          "When the other finger types, the finger that typed `prev` becomes the new 'other' finger at `prev`.",
          "Letter `i` is at row `i / 6` and column `i % 6` — integer division, six keys per row.",
        ],
      }),
      examples: [
        { input: "\"KAIRO\"", expectedOutput: "6" },
        { input: "\"CODEKAIRO\"", expectedOutput: "13" },
        { input: "\"AZ\"", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const len = rng() < 0.03 ? ri(rng, 30, 300) : pick(rng, [ri(rng, 2, 4), ri(rng, 2, 12), ri(rng, 8, 30)]);
        const alphabet = pick(rng, ["ABCDEFGHIJKLMNOPQRSTUVWXYZ", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "AZ", "AFYZ", "CODEKAIRO", "QWERTY", "MN"]);
        const word = randLower(rng, len, len, alphabet);
        return { input: JSON.stringify(word), expectedOutput: String(ref(word)) };
      },
      solutions: {
        python: code`
          def minimumDistance(word: str) -> int:
              def dist(a, b):
                  if a == 26:
                      return 0
                  return abs(a // 6 - b // 6) + abs(a % 6 - b % 6)

              INF = float('inf')
              dp = [INF] * 27
              dp[26] = 0
              for i in range(1, len(word)):
                  prev = ord(word[i - 1]) - 65
                  cur = ord(word[i]) - 65
                  nxt = [INF] * 27
                  for o in range(27):
                      if dp[o] == INF:
                          continue
                      a = dp[o] + dist(prev, cur)
                      if a < nxt[o]:
                          nxt[o] = a
                      b = dp[o] + dist(o, cur)
                      if b < nxt[prev]:
                          nxt[prev] = b
                  dp = nxt
              return min(dp)
        `,
        javascript: code`
          var minimumDistance = function(word) {
              var dist = function(a, b) {
                  if (a === 26) return 0;
                  return Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) + Math.abs(a % 6 - b % 6);
              };
              var INF = 1e9;
              var dp = new Array(27).fill(INF);
              dp[26] = 0;
              for (var i = 1; i < word.length; i++) {
                  var prev = word.charCodeAt(i - 1) - 65, cur = word.charCodeAt(i) - 65;
                  var nxt = new Array(27).fill(INF);
                  for (var o = 0; o < 27; o++) {
                      if (dp[o] === INF) continue;
                      nxt[o] = Math.min(nxt[o], dp[o] + dist(prev, cur));
                      nxt[prev] = Math.min(nxt[prev], dp[o] + dist(o, cur));
                  }
                  dp = nxt;
              }
              return Math.min.apply(null, dp);
          };
        `,
        typescript: code`
          function keyDistance(a: number, b: number): number {
              if (a === 26) return 0;
              return Math.abs(Math.floor(a / 6) - Math.floor(b / 6)) + Math.abs(a % 6 - b % 6);
          }

          function minimumDistance(word: string): number {
              var INF = 1000000000;
              var dp: number[] = [];
              for (var o = 0; o < 27; o++) dp.push(INF);
              dp[26] = 0;
              for (var i = 1; i < word.length; i++) {
                  var prev = word.charCodeAt(i - 1) - 65, cur = word.charCodeAt(i) - 65;
                  var nxt: number[] = [];
                  for (var o = 0; o < 27; o++) nxt.push(INF);
                  for (var o = 0; o < 27; o++) {
                      if (dp[o] === INF) continue;
                      nxt[o] = Math.min(nxt[o], dp[o] + keyDistance(prev, cur));
                      nxt[prev] = Math.min(nxt[prev], dp[o] + keyDistance(o, cur));
                  }
                  dp = nxt;
              }
              var best = INF;
              for (var o = 0; o < 27; o++) best = Math.min(best, dp[o]);
              return best;
          }
        `,
        java: code`
          static int keyDistance(int a, int b) {
              if (a == 26) return 0;
              return Math.abs(a / 6 - b / 6) + Math.abs(a % 6 - b % 6);
          }

          public static int minimumDistance(String word) {
              final int INF = Integer.MAX_VALUE / 2;
              int[] dp = new int[27];
              Arrays.fill(dp, INF);
              dp[26] = 0;
              for (int i = 1; i < word.length(); i++) {
                  int prev = word.charAt(i - 1) - 'A', cur = word.charAt(i) - 'A';
                  int[] nxt = new int[27];
                  Arrays.fill(nxt, INF);
                  for (int o = 0; o < 27; o++) {
                      if (dp[o] == INF) continue;
                      nxt[o] = Math.min(nxt[o], dp[o] + keyDistance(prev, cur));
                      nxt[prev] = Math.min(nxt[prev], dp[o] + keyDistance(o, cur));
                  }
                  dp = nxt;
              }
              int best = INF;
              for (int v : dp) best = Math.min(best, v);
              return best;
          }
        `,
        cpp: code`
          int keyDistance(int a, int b) {
              if (a == 26) return 0;
              return abs(a / 6 - b / 6) + abs(a % 6 - b % 6);
          }

          int minimumDistance(string word) {
              const int INF = INT_MAX / 2;
              vector<int> dp(27, INF);
              dp[26] = 0;
              for (size_t i = 1; i < word.size(); i++) {
                  int prev = word[i - 1] - 'A', cur = word[i] - 'A';
                  vector<int> nxt(27, INF);
                  for (int o = 0; o < 27; o++) {
                      if (dp[o] == INF) continue;
                      nxt[o] = min(nxt[o], dp[o] + keyDistance(prev, cur));
                      nxt[prev] = min(nxt[prev], dp[o] + keyDistance(o, cur));
                  }
                  dp = nxt;
              }
              return *min_element(dp.begin(), dp.end());
          }
        `,
        c: code`
          static int keyDistance(int a, int b) {
              if (a == 26) return 0;
              int dr = a / 6 - b / 6, dc = a % 6 - b % 6;
              if (dr < 0) dr = -dr;
              if (dc < 0) dc = -dc;
              return dr + dc;
          }

          int minimumDistance(const char* word) {
              const int INF = 1000000000;
              int n = (int)strlen(word);
              int dp[27], nxt[27];
              for (int o = 0; o < 27; o++) dp[o] = INF;
              dp[26] = 0;
              for (int i = 1; i < n; i++) {
                  int prev = word[i - 1] - 'A', cur = word[i] - 'A';
                  for (int o = 0; o < 27; o++) nxt[o] = INF;
                  for (int o = 0; o < 27; o++) {
                      if (dp[o] == INF) continue;
                      int a = dp[o] + keyDistance(prev, cur);
                      if (a < nxt[o]) nxt[o] = a;
                      int b = dp[o] + keyDistance(o, cur);
                      if (b < nxt[prev]) nxt[prev] = b;
                  }
                  for (int o = 0; o < 27; o++) dp[o] = nxt[o];
              }
              int best = INF;
              for (int o = 0; o < 27; o++) if (dp[o] < best) best = dp[o];
              return best;
          }
        `,
        csharp: code`
          static int KeyDistance(int a, int b)
          {
              if (a == 26) return 0;
              return Math.Abs(a / 6 - b / 6) + Math.Abs(a % 6 - b % 6);
          }

          public static int MinimumDistance(string word)
          {
              const int INF = int.MaxValue / 2;
              int[] dp = Enumerable.Repeat(INF, 27).ToArray();
              dp[26] = 0;
              for (int i = 1; i < word.Length; i++)
              {
                  int prev = word[i - 1] - 'A', cur = word[i] - 'A';
                  int[] nxt = Enumerable.Repeat(INF, 27).ToArray();
                  for (int o = 0; o < 27; o++)
                  {
                      if (dp[o] == INF) continue;
                      nxt[o] = Math.Min(nxt[o], dp[o] + KeyDistance(prev, cur));
                      nxt[prev] = Math.Min(nxt[prev], dp[o] + KeyDistance(o, cur));
                  }
                  dp = nxt;
              }
              return dp.Min();
          }
        `,
        go: code`
          func keyDistance(a, b int) int {
              if a == 26 {
                  return 0
              }
              dr, dc := a/6-b/6, a%6-b%6
              if dr < 0 {
                  dr = -dr
              }
              if dc < 0 {
                  dc = -dc
              }
              return dr + dc
          }

          func minimumDistance(word string) int {
              const inf = 1 << 30
              dp := make([]int, 27)
              for o := range dp {
                  dp[o] = inf
              }
              dp[26] = 0
              for i := 1; i < len(word); i++ {
                  prev, cur := int(word[i-1]-'A'), int(word[i]-'A')
                  nxt := make([]int, 27)
                  for o := range nxt {
                      nxt[o] = inf
                  }
                  for o := 0; o < 27; o++ {
                      if dp[o] == inf {
                          continue
                      }
                      if a := dp[o] + keyDistance(prev, cur); a < nxt[o] {
                          nxt[o] = a
                      }
                      if b := dp[o] + keyDistance(o, cur); b < nxt[prev] {
                          nxt[prev] = b
                      }
                  }
                  dp = nxt
              }
              best := inf
              for _, v := range dp {
                  if v < best {
                      best = v
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun keyDistance(a: Int, b: Int): Int {
              if (a == 26) return 0
              return Math.abs(a / 6 - b / 6) + Math.abs(a % 6 - b % 6)
          }

          fun minimumDistance(word: String): Int {
              val inf = Int.MAX_VALUE / 2
              var dp = IntArray(27) { inf }
              dp[26] = 0
              for (i in 1 until word.length) {
                  val prev = word[i - 1] - 'A'
                  val cur = word[i] - 'A'
                  val nxt = IntArray(27) { inf }
                  for (o in 0 until 27) {
                      if (dp[o] == inf) continue
                      nxt[o] = minOf(nxt[o], dp[o] + keyDistance(prev, cur))
                      nxt[prev] = minOf(nxt[prev], dp[o] + keyDistance(o, cur))
                  }
                  dp = nxt
              }
              var best = inf
              for (v in dp) best = minOf(best, v)
              return best
          }
        `,
        swift: code`
          func keyDistance(_ a: Int, _ b: Int) -> Int {
              if a == 26 { return 0 }
              return abs(a / 6 - b / 6) + abs(a % 6 - b % 6)
          }

          func minimumDistance(_ word: String) -> Int {
              let inf = Int.max / 2
              let letters = word.unicodeScalars.map { Int($0.value) - 65 }
              var dp = [Int](repeating: inf, count: 27)
              dp[26] = 0
              var i = 1
              while i < letters.count {
                  let prev = letters[i - 1], cur = letters[i]
                  var nxt = [Int](repeating: inf, count: 27)
                  for o in 0..<27 {
                      if dp[o] == inf { continue }
                      nxt[o] = min(nxt[o], dp[o] + keyDistance(prev, cur))
                      nxt[prev] = min(nxt[prev], dp[o] + keyDistance(o, cur))
                  }
                  dp = nxt
                  i += 1
              }
              return dp.min()!
          }
        `,
        rust: code`
          fn key_distance(a: i32, b: i32) -> i32 {
              if a == 26 {
                  return 0;
              }
              (a / 6 - b / 6).abs() + (a % 6 - b % 6).abs()
          }

          fn minimumDistance(word: String) -> i32 {
              let inf = std::i32::MAX / 2;
              let w: Vec<i32> = word.bytes().map(|c| (c - b'A') as i32).collect();
              let mut dp = vec![inf; 27];
              dp[26] = 0;
              for i in 1..w.len() {
                  let prev = w[i - 1];
                  let cur = w[i];
                  let mut nxt = vec![inf; 27];
                  for o in 0..27 {
                      if dp[o] == inf {
                          continue;
                      }
                      let a = dp[o] + key_distance(prev, cur);
                      if a < nxt[o] {
                          nxt[o] = a;
                      }
                      let b = dp[o] + key_distance(o as i32, cur);
                      if b < nxt[prev as usize] {
                          nxt[prev as usize] = b;
                      }
                  }
                  dp = nxt;
              }
              *dp.iter().min().unwrap()
          }
        `,
        php: code`
          function keyDistance($a, $b) {
              if ($a == 26) return 0;
              return abs(intdiv($a, 6) - intdiv($b, 6)) + abs($a % 6 - $b % 6);
          }

          function minimumDistance($word) {
              $inf = PHP_INT_MAX;
              $dp = array_fill(0, 27, $inf);
              $dp[26] = 0;
              $n = strlen($word);
              for ($i = 1; $i < $n; $i++) {
                  $prev = ord($word[$i - 1]) - 65;
                  $cur = ord($word[$i]) - 65;
                  $nxt = array_fill(0, 27, $inf);
                  for ($o = 0; $o < 27; $o++) {
                      if ($dp[$o] === $inf) continue;
                      $a = $dp[$o] + keyDistance($prev, $cur);
                      if ($a < $nxt[$o]) $nxt[$o] = $a;
                      $b = $dp[$o] + keyDistance($o, $cur);
                      if ($b < $nxt[$prev]) $nxt[$prev] = $b;
                  }
                  $dp = $nxt;
              }
              return min($dp);
          }
        `,
        ruby: code`
          def key_distance(a, b)
            return 0 if a == 26
            (a / 6 - b / 6).abs + (a % 6 - b % 6).abs
          end

          def minimumDistance(word)
            inf = 1 << 40
            dp = Array.new(27, inf)
            dp[26] = 0
            (1...word.length).each do |i|
              prev = word[i - 1].ord - 65
              cur = word[i].ord - 65
              nxt = Array.new(27, inf)
              27.times do |o|
                next if dp[o] == inf
                a = dp[o] + key_distance(prev, cur)
                nxt[o] = a if a < nxt[o]
                b = dp[o] + key_distance(o, cur)
                nxt[prev] = b if b < nxt[prev]
              end
              dp = nxt
            end
            dp.min
          end
        `,
      },
    };
  })(),

  // ── Jump Game V (LC 1340) ───────────────────────────────────────
  (() => {
    // Memoised depth-first search from each index (the solutions process
    // indices bottom-up in order of height instead).
    const ref = (arr: number[], d: number) => {
      const n = arr.length;
      const memo = new Array(n).fill(0);
      const go = (i: number): number => {
        if (memo[i]) return memo[i];
        let b = 1;
        for (let j = i - 1; j >= Math.max(0, i - d); j--) { if (arr[j] >= arr[i]) break; b = Math.max(b, 1 + go(j)); }
        for (let j = i + 1; j <= Math.min(n - 1, i + d); j++) { if (arr[j] >= arr[i]) break; b = Math.max(b, 1 + go(j)); }
        memo[i] = b;
        return b;
      };
      let best = 0;
      for (let i = 0; i < n; i++) best = Math.max(best, go(i));
      return best;
    };
    return {
      slug: "jump-game-v",
      title: "Jump Game V",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Sorting", "Google", "Amazon"],
      signature: {
        funcName: "maxJumps",
        params: [{ name: "arr", type: "int[]" as const }, { name: "d", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an integer array `arr` and an integer `d`. From index `i` you may jump to index `j` when `1 <= |i - j| <= d` and `j` is inside the array, but only **downhill over lower ground**: `arr[i] > arr[j]`, and `arr[i] > arr[k]` for every index `k` strictly between `i` and `j`.\n\n" +
        "You may start at any index and make as many jumps as you like. Return the maximum number of indices you can visit, counting the starting index.",
        [
          { in: "arr = [5,1,4,2,3], d = 2", out: "4", note: "Start at the 5, jump to the 4, then to the 3, then to the 2. From the 2 the 1 is out of reach — the 4 stands between them." },
          { in: "arr = [4,4,4,4], d = 2", out: "1", note: "A jump needs strictly lower ground, so no jump is possible." },
          { in: "arr = [1,2,3,4,5,6], d = 1", out: "6", note: "Start at the 6 and step down one index at a time." },
        ],
        ["1 <= arr.length <= 1000", "1 <= arr[i] <= 10^5", "1 <= d <= arr.length"]),
      hints: [
        "Every jump goes to a strictly lower value, so no path can loop. The best path from `i` depends only on the best paths from the indices it can reach.",
        "Scan outward from `i` in each direction for at most `d` steps and stop at the first value that is not lower than `arr[i]` — it blocks everything behind it.",
        "Process indices in increasing order of value (or memoise a DFS). Then `dp[i] = 1 + max(dp[j])` over the reachable `j`, all of which are already final.",
      ],
      editorial: explain({
        idea: "The jump graph is acyclic because values strictly decrease along every jump. So the longest path from each index is a DP over that DAG, and sorting indices by value gives a valid evaluation order.",
        steps: [
          "Sort the indices by `arr[i]` in increasing order and set `dp[i] = 1` for all `i`.",
          "Take indices in that order. From `i`, walk left over `j = i-1, i-2, …` while `j >= 0`, `i - j <= d` and `arr[j] < arr[i]`, updating `dp[i] = max(dp[i], dp[j] + 1)`. Stop at the first `arr[j] >= arr[i]`.",
          "Walk right the same way.",
          "Return the largest `dp[i]`.",
        ],
        why: "A jump from `i` to `j` requires `arr[j] < arr[i]`, so when `i` is processed every index it can reach has a smaller value and its `dp` is already final. The outward walks visit exactly the reachable indices: a value at least `arr[i]` blocks every index beyond it, and every index before such a blocker is lower than `arr[i]` together with everything between it and `i`.",
        time: "O(n log n + n · d)",
        space: "O(n)",
        pitfalls: [
          "Stop the scan at the first blocker in each direction; skipping over it is not allowed.",
          "Equal values block too — the condition is strictly greater.",
          "With a recursive DFS, deep chains (a strictly decreasing array) can reach depth n; the sorted bottom-up order avoids recursion entirely.",
        ],
      }),
      examples: [
        { input: "[5,1,4,2,3]\n2", expectedOutput: "4" },
        { input: "[4,4,4,4]\n2", expectedOutput: "1" },
        { input: "[1,2,3,4,5,6]\n1", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [ri(rng, 1, 5), ri(rng, 3, 15), ri(rng, 10, 45)]);
        const d = rng() < 0.3 ? ri(rng, 1, Math.min(n, 3)) : ri(rng, 1, n);
        const kind = ri(rng, 0, 3);
        let arr: number[];
        if (kind === 0) arr = Array.from({ length: n }, () => ri(rng, 1, 5));
        else if (kind === 1) arr = Array.from({ length: n }, () => ri(rng, 1, 100000));
        else if (kind === 2) { arr = Array.from({ length: n }, () => ri(rng, 1, 50)).sort((a, b) => a - b); if (rng() < 0.5) arr.reverse(); }
        else arr = Array.from({ length: n }, () => ri(rng, 1, 20));
        return { input: `${fmtIntArr(arr)}\n${d}`, expectedOutput: String(ref(arr, d)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxJumps(arr: List[int], d: int) -> int:
              n = len(arr)
              order = sorted(range(n), key=lambda i: arr[i])
              dp = [1] * n
              for i in order:
                  for step in (-1, 1):
                      j = i + step
                      while 0 <= j < n and abs(j - i) <= d and arr[j] < arr[i]:
                          if dp[j] + 1 > dp[i]:
                              dp[i] = dp[j] + 1
                          j += step
              return max(dp)
        `,
        javascript: code`
          var maxJumps = function(arr, d) {
              var n = arr.length;
              var order = [];
              for (var i = 0; i < n; i++) order.push(i);
              order.sort(function(a, b) { return arr[a] - arr[b]; });
              var dp = new Array(n).fill(1);
              var best = 1;
              for (var t = 0; t < n; t++) {
                  var i = order[t];
                  for (var j = i - 1; j >= 0 && i - j <= d && arr[j] < arr[i]; j--) dp[i] = Math.max(dp[i], dp[j] + 1);
                  for (var j = i + 1; j < n && j - i <= d && arr[j] < arr[i]; j++) dp[i] = Math.max(dp[i], dp[j] + 1);
                  best = Math.max(best, dp[i]);
              }
              return best;
          };
        `,
        typescript: code`
          function maxJumps(arr: number[], d: number): number {
              var n = arr.length;
              var order: number[] = [], dp: number[] = [];
              for (var i = 0; i < n; i++) {
                  order.push(i);
                  dp.push(1);
              }
              order.sort(function(a, b) { return arr[a] - arr[b]; });
              var best = 1;
              for (var t = 0; t < n; t++) {
                  var i = order[t];
                  for (var j = i - 1; j >= 0 && i - j <= d && arr[j] < arr[i]; j--) dp[i] = Math.max(dp[i], dp[j] + 1);
                  for (var j = i + 1; j < n && j - i <= d && arr[j] < arr[i]; j++) dp[i] = Math.max(dp[i], dp[j] + 1);
                  best = Math.max(best, dp[i]);
              }
              return best;
          }
        `,
        java: code`
          public static int maxJumps(int[] arr, int d) {
              int n = arr.length;
              Integer[] order = new Integer[n];
              for (int i = 0; i < n; i++) order[i] = i;
              Arrays.sort(order, (a, b) -> Integer.compare(arr[a], arr[b]));
              int[] dp = new int[n];
              int best = 1;
              for (int t = 0; t < n; t++) {
                  int i = order[t];
                  dp[i] = 1;
                  for (int j = i - 1; j >= 0 && i - j <= d && arr[j] < arr[i]; j--) dp[i] = Math.max(dp[i], dp[j] + 1);
                  for (int j = i + 1; j < n && j - i <= d && arr[j] < arr[i]; j++) dp[i] = Math.max(dp[i], dp[j] + 1);
                  best = Math.max(best, dp[i]);
              }
              return best;
          }
        `,
        cpp: code`
          int maxJumps(vector<int>& arr, int d) {
              int n = arr.size();
              vector<int> order(n);
              for (int i = 0; i < n; i++) order[i] = i;
              sort(order.begin(), order.end(), [&](int a, int b) { return arr[a] < arr[b]; });
              vector<int> dp(n, 1);
              int best = 1;
              for (int i : order) {
                  for (int j = i - 1; j >= 0 && i - j <= d && arr[j] < arr[i]; j--) dp[i] = max(dp[i], dp[j] + 1);
                  for (int j = i + 1; j < n && j - i <= d && arr[j] < arr[i]; j++) dp[i] = max(dp[i], dp[j] + 1);
                  best = max(best, dp[i]);
              }
              return best;
          }
        `,
        c: code`
          static int* jumpHeights;

          static int cmpJumpHeight(const void* a, const void* b) {
              int x = jumpHeights[*(const int*)a], y = jumpHeights[*(const int*)b];
              return (x > y) - (x < y);
          }

          int maxJumps(int* arr, int arrSize, int d) {
              int n = arrSize;
              int* order = (int*)malloc(sizeof(int) * n);
              int* dp = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) {
                  order[i] = i;
                  dp[i] = 1;
              }
              jumpHeights = arr;
              qsort(order, n, sizeof(int), cmpJumpHeight);
              int best = 1;
              for (int t = 0; t < n; t++) {
                  int i = order[t];
                  for (int j = i - 1; j >= 0 && i - j <= d && arr[j] < arr[i]; j--) {
                      if (dp[j] + 1 > dp[i]) dp[i] = dp[j] + 1;
                  }
                  for (int j = i + 1; j < n && j - i <= d && arr[j] < arr[i]; j++) {
                      if (dp[j] + 1 > dp[i]) dp[i] = dp[j] + 1;
                  }
                  if (dp[i] > best) best = dp[i];
              }
              free(order);
              free(dp);
              return best;
          }
        `,
        csharp: code`
          public static int MaxJumps(int[] arr, int d)
          {
              int n = arr.Length;
              int[] order = Enumerable.Range(0, n).OrderBy(i => arr[i]).ToArray();
              int[] dp = new int[n];
              int best = 1;
              foreach (int i in order)
              {
                  dp[i] = 1;
                  for (int j = i - 1; j >= 0 && i - j <= d && arr[j] < arr[i]; j--) dp[i] = Math.Max(dp[i], dp[j] + 1);
                  for (int j = i + 1; j < n && j - i <= d && arr[j] < arr[i]; j++) dp[i] = Math.Max(dp[i], dp[j] + 1);
                  best = Math.Max(best, dp[i]);
              }
              return best;
          }
        `,
        go: code`
          func maxJumps(arr []int, d int) int {
              n := len(arr)
              order := make([]int, n)
              dp := make([]int, n)
              for i := range order {
                  order[i] = i
                  dp[i] = 1
              }
              sort.Slice(order, func(a, b int) bool { return arr[order[a]] < arr[order[b]] })
              best := 1
              for _, i := range order {
                  for j := i - 1; j >= 0 && i-j <= d && arr[j] < arr[i]; j-- {
                      if dp[j]+1 > dp[i] {
                          dp[i] = dp[j] + 1
                      }
                  }
                  for j := i + 1; j < n && j-i <= d && arr[j] < arr[i]; j++ {
                      if dp[j]+1 > dp[i] {
                          dp[i] = dp[j] + 1
                      }
                  }
                  if dp[i] > best {
                      best = dp[i]
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxJumps(arr: IntArray, d: Int): Int {
              val n = arr.size
              val order = (0 until n).sortedBy { arr[it] }
              val dp = IntArray(n) { 1 }
              var best = 1
              for (i in order) {
                  var j = i - 1
                  while (j >= 0 && i - j <= d && arr[j] < arr[i]) {
                      dp[i] = maxOf(dp[i], dp[j] + 1)
                      j--
                  }
                  j = i + 1
                  while (j < n && j - i <= d && arr[j] < arr[i]) {
                      dp[i] = maxOf(dp[i], dp[j] + 1)
                      j++
                  }
                  best = maxOf(best, dp[i])
              }
              return best
          }
        `,
        swift: code`
          func maxJumps(_ arr: [Int], _ d: Int) -> Int {
              let n = arr.count
              let order = (0..<n).sorted { arr[$0] < arr[$1] }
              var dp = [Int](repeating: 1, count: n)
              var best = 1
              for i in order {
                  var j = i - 1
                  while j >= 0 && i - j <= d && arr[j] < arr[i] {
                      dp[i] = max(dp[i], dp[j] + 1)
                      j -= 1
                  }
                  j = i + 1
                  while j < n && j - i <= d && arr[j] < arr[i] {
                      dp[i] = max(dp[i], dp[j] + 1)
                      j += 1
                  }
                  best = max(best, dp[i])
              }
              return best
          }
        `,
        rust: code`
          fn maxJumps(arr: Vec<i32>, d: i32) -> i32 {
              let n = arr.len() as i64;
              let d = d as i64;
              let mut order: Vec<usize> = (0..arr.len()).collect();
              order.sort_by_key(|&i| arr[i]);
              let mut dp = vec![1i32; arr.len()];
              let mut best = 1;
              for &i in order.iter() {
                  let ii = i as i64;
                  let mut j = ii - 1;
                  while j >= 0 && ii - j <= d && arr[j as usize] < arr[i] {
                      dp[i] = std::cmp::max(dp[i], dp[j as usize] + 1);
                      j -= 1;
                  }
                  j = ii + 1;
                  while j < n && j - ii <= d && arr[j as usize] < arr[i] {
                      dp[i] = std::cmp::max(dp[i], dp[j as usize] + 1);
                      j += 1;
                  }
                  best = std::cmp::max(best, dp[i]);
              }
              best
          }
        `,
        php: code`
          function maxJumps($arr, $d) {
              $n = count($arr);
              $order = range(0, $n - 1);
              usort($order, function ($a, $b) use ($arr) { return $arr[$a] <=> $arr[$b]; });
              $dp = array_fill(0, $n, 1);
              $best = 1;
              foreach ($order as $i) {
                  for ($j = $i - 1; $j >= 0 && $i - $j <= $d && $arr[$j] < $arr[$i]; $j--) {
                      if ($dp[$j] + 1 > $dp[$i]) $dp[$i] = $dp[$j] + 1;
                  }
                  for ($j = $i + 1; $j < $n && $j - $i <= $d && $arr[$j] < $arr[$i]; $j++) {
                      if ($dp[$j] + 1 > $dp[$i]) $dp[$i] = $dp[$j] + 1;
                  }
                  if ($dp[$i] > $best) $best = $dp[$i];
              }
              return $best;
          }
        `,
        ruby: code`
          def maxJumps(arr, d)
            n = arr.length
            order = (0...n).sort_by { |i| arr[i] }
            dp = Array.new(n, 1)
            order.each do |i|
              j = i - 1
              while j >= 0 && i - j <= d && arr[j] < arr[i]
                dp[i] = dp[j] + 1 if dp[j] + 1 > dp[i]
                j -= 1
              end
              j = i + 1
              while j < n && j - i <= d && arr[j] < arr[i]
                dp[i] = dp[j] + 1 if dp[j] + 1 > dp[i]
                j += 1
              end
            end
            dp.max
          end
        `,
      },
    };
  })(),

  // ── Pizza With 3n Slices (LC 1388) ──────────────────────────────
  (() => {
    // Small pizzas: play the actual game (every pick, both neighbours removed),
    // memoised on the remaining circle. Larger ones: exhaustive search over
    // non-adjacent circular selections of exactly n slices.
    const game = (arr: number[], memo: Map<string, number>): number => {
      if (arr.length === 0) return 0;
      const key = arr.join(",");
      const hit = memo.get(key);
      if (hit !== undefined) return hit;
      const L = arr.length;
      let best = 0;
      for (let p = 0; p < L; p++) {
        const rest = arr.filter((_, q) => q !== p && q !== (p + 1) % L && q !== (p - 1 + L) % L);
        best = Math.max(best, arr[p] + game(rest, memo));
      }
      memo.set(key, best);
      return best;
    };
    const select = (s: number[]) => {
      const L = s.length, m = L / 3;
      let best = 0;
      const go = (i: number, cnt: number, sum: number, firstTaken: boolean) => {
        if (cnt === m) { if (sum > best) best = sum; return; }
        if (i >= L || L - i < 2 * (m - cnt) - 1) return;
        if (!(i === L - 1 && firstTaken)) go(i + 2, cnt + 1, sum + s[i], i === 0 ? true : firstTaken);
        go(i + 1, cnt, sum, firstTaken);
      };
      go(0, 0, 0, false);
      return best;
    };
    const ref = (s: number[]) => (s.length <= 12 ? game(s, new Map()) : select(s));
    return {
      slug: "pizza-with-3n-slices",
      title: "Pizza With 3n Slices",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Greedy", "Heap (Priority Queue)", "Google", "Amazon"],
      signature: { funcName: "maxSizeSlices", params: [{ name: "slices", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A round pizza is cut into `3n` slices of different sizes, listed **clockwise** in `slices`. You share it with two friends, Alice and Bob, and the slices are taken in rounds:\n\n" +
        "- You pick any remaining slice.\n" +
        "- Alice takes the next remaining slice **counter-clockwise** from yours.\n" +
        "- Bob takes the next remaining slice **clockwise** from yours.\n\n" +
        "Rounds repeat until no slices are left. Return the maximum total size of the slices you can end up with.",
        [
          { in: "slices = [5,1,1,5,1,1]", out: "10", note: "Pick a 5; Alice and Bob take the 1s beside it. The other 5 is still there in the second round." },
          { in: "slices = [3,7,2]", out: "7" },
          { in: "slices = [4,1,2,5,8,3,1,9,7]", out: "21", note: "The slices of size 4, 8 and 9 — no two of them are next to each other." },
        ],
        ["3 * n == slices.length", "1 <= slices.length <= 500", "1 <= slices[i] <= 1000"]),
      hints: [
        "Which sets of `n` slices can you end up with? Your slices are never adjacent on the original circle — and in fact every set of `n` pairwise non-adjacent slices is achievable.",
        "So the task is: choose exactly `n` non-adjacent slices on a circle of `3n` with maximum total. The circle only adds one constraint — the first and last slice cannot both be chosen.",
        "Break the circle twice: solve the line without the last slice and the line without the first slice. On a line, `dp[i][j] = max(dp[i-1][j], dp[i-2][j-1] + slices[i])` picks `j` non-adjacent slices among the first `i`.",
      ],
      editorial: explain({
        idea: "The game is a disguise. Every round removes your slice and its two current neighbours, so your slices are pairwise non-adjacent on the original circle; conversely any `n` pairwise non-adjacent slices out of `3n` can be collected in some order (always pick a chosen slice that has an unchosen slice on both sides next to it — one exists while the circle is at least three times the number of picks left). The problem becomes: pick `n` non-adjacent elements of a circular array with maximum sum.",
        steps: [
          "Let `n = len(slices) / 3`.",
          "Define `best(line)`: `dp[i][j]` = the largest total of `j` non-adjacent elements among the first `i` of `line`, with `dp[i][0] = 0` and impossible states at minus infinity.",
          "`dp[i][j] = max(dp[i-1][j], dp[i-2][j-1] + line[i-1])` — skip element `i`, or take it and skip its left neighbour.",
          "The answer is `max(best(slices without the last), best(slices without the first))`, each asking for exactly `n` elements.",
        ],
        why: "On the circle the only extra constraint versus a line is that the first and last slices are neighbours. Any valid selection leaves out at least one of them, so it is a valid selection of one of the two lines; and every valid selection of either line is valid on the circle. Taking the better of the two line answers therefore gives the circular optimum, and the line DP is the standard take-or-skip recurrence.",
        time: "O(n^2)",
        space: "O(n^2)",
        pitfalls: [
          "Choose exactly `n` slices, not 'as many as you like' — the count is part of the DP state.",
          "Remember the wrap-around: the first and last slices are adjacent.",
          "A plain greedy (always take the largest slice) fails — taking it can block two medium slices worth more.",
        ],
      }),
      examples: [
        { input: "[5,1,1,5,1,1]", expectedOutput: "10" },
        { input: "[3,7,2]", expectedOutput: "7" },
        { input: "[4,1,2,5,8,3,1,9,7]", expectedOutput: "21" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, 3, 4, ri(rng, 1, 4), ri(rng, 5, 10)]);
        const hi = pick(rng, [3, 10, 1000]);
        const slices = Array.from({ length: 3 * n }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(slices), expectedOutput: String(ref(slices)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxSizeSlices(slices: List[int]) -> int:
              m = len(slices) // 3
              NEG = -10 ** 9

              def best(line):
                  L = len(line)
                  dp = [[NEG] * (m + 1) for _ in range(L + 1)]
                  for i in range(L + 1):
                      dp[i][0] = 0
                  for i in range(1, L + 1):
                      for j in range(1, m + 1):
                          before = dp[i - 2][j - 1] if i >= 2 else (0 if j == 1 else NEG)
                          dp[i][j] = max(dp[i - 1][j], before + line[i - 1])
                  return dp[L][m]

              return max(best(slices[:-1]), best(slices[1:]))
        `,
        javascript: code`
          var maxSizeSlices = function(slices) {
              var m = slices.length / 3, NEG = -1e9;
              var best = function(lo, hi) {
                  var L = hi - lo;
                  var dp = [];
                  for (var i = 0; i <= L; i++) {
                      var row = new Array(m + 1).fill(NEG);
                      row[0] = 0;
                      dp.push(row);
                  }
                  for (var i = 1; i <= L; i++) {
                      for (var j = 1; j <= m; j++) {
                          var before = i >= 2 ? dp[i - 2][j - 1] : (j === 1 ? 0 : NEG);
                          dp[i][j] = Math.max(dp[i - 1][j], before + slices[lo + i - 1]);
                      }
                  }
                  return dp[L][m];
              };
              var n = slices.length;
              return Math.max(best(0, n - 1), best(1, n));
          };
        `,
        typescript: code`
          function bestNonAdjacent(slices: number[], lo: number, hi: number, m: number): number {
              var NEG = -1000000000;
              var L = hi - lo;
              var dp: number[][] = [];
              for (var i = 0; i <= L; i++) {
                  var row: number[] = [0];
                  for (var j = 1; j <= m; j++) row.push(NEG);
                  dp.push(row);
              }
              for (var i = 1; i <= L; i++) {
                  for (var j = 1; j <= m; j++) {
                      var before = i >= 2 ? dp[i - 2][j - 1] : (j === 1 ? 0 : NEG);
                      dp[i][j] = Math.max(dp[i - 1][j], before + slices[lo + i - 1]);
                  }
              }
              return dp[L][m];
          }

          function maxSizeSlices(slices: number[]): number {
              var n = slices.length, m = n / 3;
              return Math.max(bestNonAdjacent(slices, 0, n - 1, m), bestNonAdjacent(slices, 1, n, m));
          }
        `,
        java: code`
          static int bestNonAdjacent(int[] slices, int lo, int hi, int m) {
              final int NEG = -1000000000;
              int L = hi - lo;
              int[][] dp = new int[L + 1][m + 1];
              for (int i = 0; i <= L; i++) {
                  Arrays.fill(dp[i], NEG);
                  dp[i][0] = 0;
              }
              for (int i = 1; i <= L; i++) {
                  for (int j = 1; j <= m; j++) {
                      int before = i >= 2 ? dp[i - 2][j - 1] : (j == 1 ? 0 : NEG);
                      dp[i][j] = Math.max(dp[i - 1][j], before + slices[lo + i - 1]);
                  }
              }
              return dp[L][m];
          }

          public static int maxSizeSlices(int[] slices) {
              int n = slices.length, m = n / 3;
              return Math.max(bestNonAdjacent(slices, 0, n - 1, m), bestNonAdjacent(slices, 1, n, m));
          }
        `,
        cpp: code`
          int bestNonAdjacent(const vector<int>& slices, int lo, int hi, int m) {
              const int NEG = -1000000000;
              int L = hi - lo;
              vector<vector<int>> dp(L + 1, vector<int>(m + 1, NEG));
              for (int i = 0; i <= L; i++) dp[i][0] = 0;
              for (int i = 1; i <= L; i++) {
                  for (int j = 1; j <= m; j++) {
                      int before = i >= 2 ? dp[i - 2][j - 1] : (j == 1 ? 0 : NEG);
                      dp[i][j] = max(dp[i - 1][j], before + slices[lo + i - 1]);
                  }
              }
              return dp[L][m];
          }

          int maxSizeSlices(vector<int>& slices) {
              int n = slices.size(), m = n / 3;
              return max(bestNonAdjacent(slices, 0, n - 1, m), bestNonAdjacent(slices, 1, n, m));
          }
        `,
        c: code`
          static int bestNonAdjacent(int* slices, int lo, int hi, int m) {
              const int NEG = -1000000000;
              int L = hi - lo, W = m + 1;
              int* dp = (int*)malloc(sizeof(int) * (L + 1) * W);
              for (int i = 0; i <= L; i++) {
                  dp[i * W] = 0;
                  for (int j = 1; j <= m; j++) dp[i * W + j] = NEG;
              }
              for (int i = 1; i <= L; i++) {
                  for (int j = 1; j <= m; j++) {
                      int before = i >= 2 ? dp[(i - 2) * W + j - 1] : (j == 1 ? 0 : NEG);
                      int take = before + slices[lo + i - 1];
                      int skip = dp[(i - 1) * W + j];
                      dp[i * W + j] = take > skip ? take : skip;
                  }
              }
              int ans = dp[L * W + m];
              free(dp);
              return ans;
          }

          int maxSizeSlices(int* slices, int slicesSize) {
              int n = slicesSize, m = n / 3;
              int a = bestNonAdjacent(slices, 0, n - 1, m);
              int b = bestNonAdjacent(slices, 1, n, m);
              return a > b ? a : b;
          }
        `,
        csharp: code`
          static int BestNonAdjacent(int[] slices, int lo, int hi, int m)
          {
              const int NEG = -1000000000;
              int L = hi - lo;
              int[,] dp = new int[L + 1, m + 1];
              for (int i = 0; i <= L; i++)
              {
                  dp[i, 0] = 0;
                  for (int j = 1; j <= m; j++) dp[i, j] = NEG;
              }
              for (int i = 1; i <= L; i++)
              {
                  for (int j = 1; j <= m; j++)
                  {
                      int before = i >= 2 ? dp[i - 2, j - 1] : (j == 1 ? 0 : NEG);
                      dp[i, j] = Math.Max(dp[i - 1, j], before + slices[lo + i - 1]);
                  }
              }
              return dp[L, m];
          }

          public static int MaxSizeSlices(int[] slices)
          {
              int n = slices.Length, m = n / 3;
              return Math.Max(BestNonAdjacent(slices, 0, n - 1, m), BestNonAdjacent(slices, 1, n, m));
          }
        `,
        go: code`
          func bestNonAdjacent(slices []int, lo, hi, m int) int {
              const neg = -1000000000
              L := hi - lo
              dp := make([][]int, L+1)
              for i := range dp {
                  dp[i] = make([]int, m+1)
                  for j := 1; j <= m; j++ {
                      dp[i][j] = neg
                  }
              }
              for i := 1; i <= L; i++ {
                  for j := 1; j <= m; j++ {
                      before := neg
                      if i >= 2 {
                          before = dp[i-2][j-1]
                      } else if j == 1 {
                          before = 0
                      }
                      dp[i][j] = dp[i-1][j]
                      if before+slices[lo+i-1] > dp[i][j] {
                          dp[i][j] = before + slices[lo+i-1]
                      }
                  }
              }
              return dp[L][m]
          }

          func maxSizeSlices(slices []int) int {
              n := len(slices)
              m := n / 3
              a := bestNonAdjacent(slices, 0, n-1, m)
              b := bestNonAdjacent(slices, 1, n, m)
              if a > b {
                  return a
              }
              return b
          }
        `,
        kotlin: code`
          fun bestNonAdjacent(slices: IntArray, lo: Int, hi: Int, m: Int): Int {
              val neg = -1000000000
              val len = hi - lo
              val dp = Array(len + 1) { IntArray(m + 1) { neg } }
              for (i in 0..len) dp[i][0] = 0
              for (i in 1..len) {
                  for (j in 1..m) {
                      val before = if (i >= 2) dp[i - 2][j - 1] else if (j == 1) 0 else neg
                      dp[i][j] = maxOf(dp[i - 1][j], before + slices[lo + i - 1])
                  }
              }
              return dp[len][m]
          }

          fun maxSizeSlices(slices: IntArray): Int {
              val n = slices.size
              val m = n / 3
              return maxOf(bestNonAdjacent(slices, 0, n - 1, m), bestNonAdjacent(slices, 1, n, m))
          }
        `,
        swift: code`
          func bestNonAdjacent(_ slices: [Int], _ lo: Int, _ hi: Int, _ m: Int) -> Int {
              let neg = -1000000000
              let len = hi - lo
              var dp = [[Int]](repeating: [Int](repeating: neg, count: m + 1), count: len + 1)
              for i in 0...len { dp[i][0] = 0 }
              if len >= 1 {
                  for i in 1...len {
                      for j in 1...m {
                          let before = i >= 2 ? dp[i - 2][j - 1] : (j == 1 ? 0 : neg)
                          dp[i][j] = max(dp[i - 1][j], before + slices[lo + i - 1])
                      }
                  }
              }
              return dp[len][m]
          }

          func maxSizeSlices(_ slices: [Int]) -> Int {
              let n = slices.count
              let m = n / 3
              return max(bestNonAdjacent(slices, 0, n - 1, m), bestNonAdjacent(slices, 1, n, m))
          }
        `,
        rust: code`
          fn best_non_adjacent(slices: &Vec<i32>, lo: usize, hi: usize, m: usize) -> i32 {
              let neg: i32 = -1_000_000_000;
              let len = hi - lo;
              let mut dp = vec![vec![neg; m + 1]; len + 1];
              for i in 0..=len {
                  dp[i][0] = 0;
              }
              for i in 1..=len {
                  for j in 1..=m {
                      let before = if i >= 2 { dp[i - 2][j - 1] } else if j == 1 { 0 } else { neg };
                      dp[i][j] = std::cmp::max(dp[i - 1][j], before + slices[lo + i - 1]);
                  }
              }
              dp[len][m]
          }

          fn maxSizeSlices(slices: Vec<i32>) -> i32 {
              let n = slices.len();
              let m = n / 3;
              std::cmp::max(best_non_adjacent(&slices, 0, n - 1, m), best_non_adjacent(&slices, 1, n, m))
          }
        `,
        php: code`
          function bestNonAdjacent($slices, $lo, $hi, $m) {
              $neg = -1000000000;
              $len = $hi - $lo;
              $dp = array_fill(0, $len + 1, array_fill(0, $m + 1, $neg));
              for ($i = 0; $i <= $len; $i++) $dp[$i][0] = 0;
              for ($i = 1; $i <= $len; $i++) {
                  for ($j = 1; $j <= $m; $j++) {
                      $before = $i >= 2 ? $dp[$i - 2][$j - 1] : ($j == 1 ? 0 : $neg);
                      $dp[$i][$j] = max($dp[$i - 1][$j], $before + $slices[$lo + $i - 1]);
                  }
              }
              return $dp[$len][$m];
          }

          function maxSizeSlices($slices) {
              $n = count($slices);
              $m = intdiv($n, 3);
              return max(bestNonAdjacent($slices, 0, $n - 1, $m), bestNonAdjacent($slices, 1, $n, $m));
          }
        `,
        ruby: code`
          def best_non_adjacent(slices, lo, hi, m)
            neg = -1_000_000_000
            len = hi - lo
            dp = Array.new(len + 1) { Array.new(m + 1, neg) }
            (0..len).each { |i| dp[i][0] = 0 }
            (1..len).each do |i|
              (1..m).each do |j|
                before = if i >= 2
                           dp[i - 2][j - 1]
                         else
                           j == 1 ? 0 : neg
                         end
                dp[i][j] = [dp[i - 1][j], before + slices[lo + i - 1]].max
              end
            end
            dp[len][m]
          end

          def maxSizeSlices(slices)
            n = slices.length
            m = n / 3
            [best_non_adjacent(slices, 0, n - 1, m), best_non_adjacent(slices, 1, n, m)].max
          end
        `,
      },
    };
  })(),

  // ── Number of Ways of Cutting a Pizza (LC 1444) ─────────────────
  (() => {
    // Memoised recursion that scans the cells of every piece for an apple
    // (no suffix counts).
    const ref = (pizza: string[], k: number) => {
      const R = pizza.length, C = pizza[0].length, MOD = 1000000007;
      const has = (r1: number, c1: number, r2: number, c2: number) => {
        for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++) if (pizza[r][c] === "A") return true;
        return false;
      };
      const memo = new Map<number, number>();
      const go = (r: number, c: number, p: number): number => {
        if (!has(r, c, R, C)) return 0;
        if (p === 1) return 1;
        const key = (r * 64 + c) * 16 + p;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let w = 0;
        for (let nr = r + 1; nr < R; nr++) if (has(r, c, nr, C)) w += go(nr, c, p - 1);
        for (let nc = c + 1; nc < C; nc++) if (has(r, c, R, nc)) w += go(r, nc, p - 1);
        w %= MOD;
        memo.set(key, w);
        return w;
      };
      return go(0, 0, k);
    };
    return {
      slug: "number-of-ways-of-cutting-a-pizza",
      title: "Number of Ways of Cutting a Pizza",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Prefix Sum", "Google", "Amazon"],
      signature: {
        funcName: "ways",
        params: [{ name: "pizza", type: "string[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A rectangular pizza is given as a grid `pizza` of `rows` strings, each `cols` characters long: `'A'` marks a cell with an apple and `'.'` an empty cell. You must cut it into `k` pieces with `k - 1` cuts.\n\n" +
        "Each cut is made on the part of the pizza that is still left: choose a direction and a position on a cell boundary, then cut straight across. A **horizontal** cut gives away the **upper** part; a **vertical** cut gives away the **left** part. After the last cut, the remaining part is the final piece. Every piece — each one given away and the final one — must contain **at least one apple**.\n\n" +
        "Return the number of ways to cut the pizza, modulo `10^9 + 7`. Two ways are different if some cut differs in direction or position.",
        [
          { in: "pizza = [\".A.\",\"A.A\",\"..A\"], k = 3", out: "7" },
          { in: "pizza = [\"A.A\",\"...\"], k = 2", out: "2", note: "Both vertical cuts work. The horizontal cut would leave the empty bottom row as the last piece." },
          { in: "pizza = [\"AA\",\"AA\"], k = 4", out: "0", note: "Every cut removes at least a whole row or column, so a 2 × 2 pizza allows at most two cuts." },
        ],
        ["1 <= rows, cols <= 50", "rows == pizza.length", "cols == pizza[i].length", "1 <= k <= 10", "pizza consists of 'A' and '.' only"]),
      hints: [
        "Whatever cuts you make, the part still left is always a bottom-right sub-rectangle starting at some cell `(r, c)`.",
        "Let `ways(p, r, c)` count the ways to cut the sub-pizza from `(r, c)` into `p` pieces. A cut at row `nr` hands away rows `r..nr-1` and continues with `(nr, c)`; a cut at column `nc` continues with `(r, nc)`.",
        "Precompute `apples[r][c]`, the number of apples in the sub-pizza from `(r, c)`, as a suffix sum. The piece given away by a horizontal cut has `apples[r][c] - apples[nr][c]` apples; by a vertical cut, `apples[r][c] - apples[r][nc]`.",
      ],
      editorial: explain({
        idea: "Since cuts always give away the top or the left, what remains is always the bottom-right sub-rectangle anchored at some cell. That makes the state `(pieces still to produce, r, c)`, and a 2-D suffix sum of apples answers 'does this piece have an apple?' in O(1).",
        steps: [
          "Compute `apples[r][c]` for the sub-pizza from `(r, c)` to the bottom-right, by inclusion–exclusion from the bottom-right corner.",
          "Base layer: `dp[r][c] = 1` if `apples[r][c] > 0`, else 0 (one piece, which must hold an apple).",
          "Repeat `k - 1` times, building a new layer: for each `(r, c)`, sum the previous layer at `(nr, c)` for every `nr > r` with `apples[r][c] - apples[nr][c] > 0`, and at `(r, nc)` for every `nc > c` with `apples[r][c] - apples[r][nc] > 0`; reduce modulo 10^9 + 7.",
          "Return the last layer at `(0, 0)`.",
        ],
        why: "Every sequence of cuts is determined by its first cut and the sequence of cuts on what remains. The first cut is valid exactly when the piece it gives away holds an apple, and the remaining sub-pizza must then be cut into `p - 1` valid pieces — which is the previous layer at the new anchor (and that layer is 0 when the remainder has no apple). Summing over all first cuts counts every valid sequence exactly once.",
        time: "O(k · rows · cols · (rows + cols))",
        space: "O(rows · cols)",
        pitfalls: [
          "Check the piece being given away, not the remaining part — the remaining part is checked by the next layer.",
          "The final piece needs an apple too; the base layer encodes that.",
          "Reduce modulo 10^9 + 7 as you sum.",
        ],
      }),
      examples: [
        { input: "[\".A.\",\"A.A\",\"..A\"]\n3", expectedOutput: "7" },
        { input: "[\"A.A\",\"...\"]\n2", expectedOutput: "2" },
        { input: "[\"AA\",\"AA\"]\n4", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const R = pick(rng, [ri(rng, 1, 3), ri(rng, 2, 6), ri(rng, 4, 7)]);
        const C = pick(rng, [ri(rng, 1, 3), ri(rng, 2, 6), ri(rng, 4, 7)]);
        const k = pick(rng, [1, ri(rng, 2, 3), ri(rng, 2, 5), ri(rng, 3, 7)]);
        const density = pick(rng, [0.1, 0.3, 0.6, 0.95]);
        const pizza: string[] = [];
        for (let r = 0; r < R; r++) {
          let row = "";
          for (let c = 0; c < C; c++) row += rng() < density ? "A" : ".";
          pizza.push(row);
        }
        return { input: `${fmtStrArr(pizza)}\n${k}`, expectedOutput: String(ref(pizza, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def ways(pizza: List[str], k: int) -> int:
              MOD = 10 ** 9 + 7
              R, C = len(pizza), len(pizza[0])
              apples = [[0] * (C + 1) for _ in range(R + 1)]
              for r in range(R - 1, -1, -1):
                  for c in range(C - 1, -1, -1):
                      apples[r][c] = (1 if pizza[r][c] == 'A' else 0) + apples[r + 1][c] + apples[r][c + 1] - apples[r + 1][c + 1]
              dp = [[1 if apples[r][c] > 0 else 0 for c in range(C)] for r in range(R)]
              for _ in range(k - 1):
                  nd = [[0] * C for _ in range(R)]
                  for r in range(R):
                      for c in range(C):
                          total = 0
                          for nr in range(r + 1, R):
                              if apples[r][c] - apples[nr][c] > 0:
                                  total += dp[nr][c]
                          for nc in range(c + 1, C):
                              if apples[r][c] - apples[r][nc] > 0:
                                  total += dp[r][nc]
                          nd[r][c] = total % MOD
                  dp = nd
              return dp[0][0]
        `,
        javascript: code`
          var ways = function(pizza, k) {
              var MOD = 1000000007, R = pizza.length, C = pizza[0].length;
              var apples = [];
              for (var r = 0; r <= R; r++) apples.push(new Array(C + 1).fill(0));
              for (var r = R - 1; r >= 0; r--) {
                  for (var c = C - 1; c >= 0; c--) {
                      apples[r][c] = (pizza[r][c] === 'A' ? 1 : 0) + apples[r + 1][c] + apples[r][c + 1] - apples[r + 1][c + 1];
                  }
              }
              var dp = [];
              for (var r = 0; r < R; r++) {
                  dp.push([]);
                  for (var c = 0; c < C; c++) dp[r].push(apples[r][c] > 0 ? 1 : 0);
              }
              for (var p = 1; p < k; p++) {
                  var nd = [];
                  for (var r = 0; r < R; r++) {
                      nd.push(new Array(C).fill(0));
                      for (var c = 0; c < C; c++) {
                          var total = 0;
                          for (var nr = r + 1; nr < R; nr++) if (apples[r][c] - apples[nr][c] > 0) total += dp[nr][c];
                          for (var nc = c + 1; nc < C; nc++) if (apples[r][c] - apples[r][nc] > 0) total += dp[r][nc];
                          nd[r][c] = total % MOD;
                      }
                  }
                  dp = nd;
              }
              return dp[0][0];
          };
        `,
        typescript: code`
          function ways(pizza: string[], k: number): number {
              var MOD = 1000000007, R = pizza.length, C = pizza[0].length;
              var apples: number[][] = [];
              for (var r = 0; r <= R; r++) {
                  var row: number[] = [];
                  for (var c = 0; c <= C; c++) row.push(0);
                  apples.push(row);
              }
              for (var r = R - 1; r >= 0; r--) {
                  for (var c = C - 1; c >= 0; c--) {
                      apples[r][c] = (pizza[r].charAt(c) === "A" ? 1 : 0) + apples[r + 1][c] + apples[r][c + 1] - apples[r + 1][c + 1];
                  }
              }
              var dp: number[][] = [];
              for (var r = 0; r < R; r++) {
                  var line: number[] = [];
                  for (var c = 0; c < C; c++) line.push(apples[r][c] > 0 ? 1 : 0);
                  dp.push(line);
              }
              for (var p = 1; p < k; p++) {
                  var nd: number[][] = [];
                  for (var r = 0; r < R; r++) {
                      var out: number[] = [];
                      for (var c = 0; c < C; c++) {
                          var total = 0;
                          for (var nr = r + 1; nr < R; nr++) if (apples[r][c] - apples[nr][c] > 0) total += dp[nr][c];
                          for (var nc = c + 1; nc < C; nc++) if (apples[r][c] - apples[r][nc] > 0) total += dp[r][nc];
                          out.push(total % MOD);
                      }
                      nd.push(out);
                  }
                  dp = nd;
              }
              return dp[0][0];
          }
        `,
        java: code`
          public static int ways(String[] pizza, int k) {
              final long MOD = 1000000007L;
              int R = pizza.length, C = pizza[0].length();
              int[][] apples = new int[R + 1][C + 1];
              for (int r = R - 1; r >= 0; r--) {
                  for (int c = C - 1; c >= 0; c--) {
                      apples[r][c] = (pizza[r].charAt(c) == 'A' ? 1 : 0) + apples[r + 1][c] + apples[r][c + 1] - apples[r + 1][c + 1];
                  }
              }
              long[][] dp = new long[R][C];
              for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) dp[r][c] = apples[r][c] > 0 ? 1 : 0;
              for (int p = 1; p < k; p++) {
                  long[][] nd = new long[R][C];
                  for (int r = 0; r < R; r++) {
                      for (int c = 0; c < C; c++) {
                          long total = 0;
                          for (int nr = r + 1; nr < R; nr++) if (apples[r][c] - apples[nr][c] > 0) total += dp[nr][c];
                          for (int nc = c + 1; nc < C; nc++) if (apples[r][c] - apples[r][nc] > 0) total += dp[r][nc];
                          nd[r][c] = total % MOD;
                      }
                  }
                  dp = nd;
              }
              return (int) dp[0][0];
          }
        `,
        cpp: code`
          int ways(vector<string>& pizza, int k) {
              const long long MOD = 1000000007LL;
              int R = pizza.size(), C = pizza[0].size();
              vector<vector<int>> apples(R + 1, vector<int>(C + 1, 0));
              for (int r = R - 1; r >= 0; r--) {
                  for (int c = C - 1; c >= 0; c--) {
                      apples[r][c] = (pizza[r][c] == 'A' ? 1 : 0) + apples[r + 1][c] + apples[r][c + 1] - apples[r + 1][c + 1];
                  }
              }
              vector<vector<long long>> dp(R, vector<long long>(C, 0));
              for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) dp[r][c] = apples[r][c] > 0 ? 1 : 0;
              for (int p = 1; p < k; p++) {
                  vector<vector<long long>> nd(R, vector<long long>(C, 0));
                  for (int r = 0; r < R; r++) {
                      for (int c = 0; c < C; c++) {
                          long long total = 0;
                          for (int nr = r + 1; nr < R; nr++) if (apples[r][c] - apples[nr][c] > 0) total += dp[nr][c];
                          for (int nc = c + 1; nc < C; nc++) if (apples[r][c] - apples[r][nc] > 0) total += dp[r][nc];
                          nd[r][c] = total % MOD;
                      }
                  }
                  dp = nd;
              }
              return (int)dp[0][0];
          }
        `,
        c: code`
          int ways(char** pizza, int pizzaSize, int k) {
              const long long MOD = 1000000007LL;
              int R = pizzaSize, C = (int)strlen(pizza[0]), W = C + 1;
              int* apples = (int*)calloc((size_t)(R + 1) * W, sizeof(int));
              for (int r = R - 1; r >= 0; r--) {
                  for (int c = C - 1; c >= 0; c--) {
                      apples[r * W + c] = (pizza[r][c] == 'A' ? 1 : 0) + apples[(r + 1) * W + c] + apples[r * W + c + 1] - apples[(r + 1) * W + c + 1];
                  }
              }
              long long* dp = (long long*)malloc(sizeof(long long) * R * C);
              long long* nd = (long long*)malloc(sizeof(long long) * R * C);
              for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) dp[r * C + c] = apples[r * W + c] > 0 ? 1 : 0;
              for (int p = 1; p < k; p++) {
                  for (int r = 0; r < R; r++) {
                      for (int c = 0; c < C; c++) {
                          long long total = 0;
                          int here = apples[r * W + c];
                          for (int nr = r + 1; nr < R; nr++) if (here - apples[nr * W + c] > 0) total += dp[nr * C + c];
                          for (int nc = c + 1; nc < C; nc++) if (here - apples[r * W + nc] > 0) total += dp[r * C + nc];
                          nd[r * C + c] = total % MOD;
                      }
                  }
                  long long* t = dp;
                  dp = nd;
                  nd = t;
              }
              int ans = (int)dp[0];
              free(apples);
              free(dp);
              free(nd);
              return ans;
          }
        `,
        csharp: code`
          public static int Ways(string[] pizza, int k)
          {
              const long MOD = 1000000007L;
              int R = pizza.Length, C = pizza[0].Length;
              int[,] apples = new int[R + 1, C + 1];
              for (int r = R - 1; r >= 0; r--)
              {
                  for (int c = C - 1; c >= 0; c--)
                  {
                      apples[r, c] = (pizza[r][c] == 'A' ? 1 : 0) + apples[r + 1, c] + apples[r, c + 1] - apples[r + 1, c + 1];
                  }
              }
              long[,] dp = new long[R, C];
              for (int r = 0; r < R; r++) for (int c = 0; c < C; c++) dp[r, c] = apples[r, c] > 0 ? 1 : 0;
              for (int p = 1; p < k; p++)
              {
                  long[,] nd = new long[R, C];
                  for (int r = 0; r < R; r++)
                  {
                      for (int c = 0; c < C; c++)
                      {
                          long total = 0;
                          for (int nr = r + 1; nr < R; nr++) if (apples[r, c] - apples[nr, c] > 0) total += dp[nr, c];
                          for (int nc = c + 1; nc < C; nc++) if (apples[r, c] - apples[r, nc] > 0) total += dp[r, nc];
                          nd[r, c] = total % MOD;
                      }
                  }
                  dp = nd;
              }
              return (int)dp[0, 0];
          }
        `,
        go: code`
          func ways(pizza []string, k int) int {
              const mod = 1000000007
              R, C := len(pizza), len(pizza[0])
              apples := make([][]int, R+1)
              for r := range apples {
                  apples[r] = make([]int, C+1)
              }
              for r := R - 1; r >= 0; r-- {
                  for c := C - 1; c >= 0; c-- {
                      cell := 0
                      if pizza[r][c] == 'A' {
                          cell = 1
                      }
                      apples[r][c] = cell + apples[r+1][c] + apples[r][c+1] - apples[r+1][c+1]
                  }
              }
              dp := make([][]int, R)
              for r := range dp {
                  dp[r] = make([]int, C)
                  for c := 0; c < C; c++ {
                      if apples[r][c] > 0 {
                          dp[r][c] = 1
                      }
                  }
              }
              for p := 1; p < k; p++ {
                  nd := make([][]int, R)
                  for r := 0; r < R; r++ {
                      nd[r] = make([]int, C)
                      for c := 0; c < C; c++ {
                          total := 0
                          for nr := r + 1; nr < R; nr++ {
                              if apples[r][c]-apples[nr][c] > 0 {
                                  total += dp[nr][c]
                              }
                          }
                          for nc := c + 1; nc < C; nc++ {
                              if apples[r][c]-apples[r][nc] > 0 {
                                  total += dp[r][nc]
                              }
                          }
                          nd[r][c] = total % mod
                      }
                  }
                  dp = nd
              }
              return dp[0][0]
          }
        `,
        kotlin: code`
          fun ways(pizza: Array<String>, k: Int): Int {
              val modulus = 1000000007L
              val rows = pizza.size
              val cols = pizza[0].length
              val apples = Array(rows + 1) { IntArray(cols + 1) }
              for (r in rows - 1 downTo 0) {
                  for (c in cols - 1 downTo 0) {
                      apples[r][c] = (if (pizza[r][c] == 'A') 1 else 0) + apples[r + 1][c] + apples[r][c + 1] - apples[r + 1][c + 1]
                  }
              }
              var dp = Array(rows) { r -> LongArray(cols) { c -> if (apples[r][c] > 0) 1L else 0L } }
              for (p in 1 until k) {
                  val nd = Array(rows) { LongArray(cols) }
                  for (r in 0 until rows) {
                      for (c in 0 until cols) {
                          var total = 0L
                          for (nr in r + 1 until rows) if (apples[r][c] - apples[nr][c] > 0) total += dp[nr][c]
                          for (nc in c + 1 until cols) if (apples[r][c] - apples[r][nc] > 0) total += dp[r][nc]
                          nd[r][c] = total % modulus
                      }
                  }
                  dp = nd
              }
              return dp[0][0].toInt()
          }
        `,
        swift: code`
          func ways(_ pizza: [String], _ k: Int) -> Int {
              let modulus = 1000000007
              let grid = pizza.map { Array($0) }
              let R = grid.count, C = grid[0].count
              var apples = [[Int]](repeating: [Int](repeating: 0, count: C + 1), count: R + 1)
              for r in stride(from: R - 1, through: 0, by: -1) {
                  for c in stride(from: C - 1, through: 0, by: -1) {
                      apples[r][c] = (grid[r][c] == "A" ? 1 : 0) + apples[r + 1][c] + apples[r][c + 1] - apples[r + 1][c + 1]
                  }
              }
              var dp = [[Int]](repeating: [Int](repeating: 0, count: C), count: R)
              for r in 0..<R { for c in 0..<C { dp[r][c] = apples[r][c] > 0 ? 1 : 0 } }
              var p = 1
              while p < k {
                  var nd = [[Int]](repeating: [Int](repeating: 0, count: C), count: R)
                  for r in 0..<R {
                      for c in 0..<C {
                          var total = 0
                          var nr = r + 1
                          while nr < R {
                              if apples[r][c] - apples[nr][c] > 0 { total += dp[nr][c] }
                              nr += 1
                          }
                          var nc = c + 1
                          while nc < C {
                              if apples[r][c] - apples[r][nc] > 0 { total += dp[r][nc] }
                              nc += 1
                          }
                          nd[r][c] = total % modulus
                      }
                  }
                  dp = nd
                  p += 1
              }
              return dp[0][0]
          }
        `,
        rust: code`
          fn ways(pizza: Vec<String>, k: i32) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let grid: Vec<&[u8]> = pizza.iter().map(|s| s.as_bytes()).collect();
              let rows = grid.len();
              let cols = grid[0].len();
              let mut apples = vec![vec![0i32; cols + 1]; rows + 1];
              for r in (0..rows).rev() {
                  for c in (0..cols).rev() {
                      let cell = if grid[r][c] == b'A' { 1 } else { 0 };
                      apples[r][c] = cell + apples[r + 1][c] + apples[r][c + 1] - apples[r + 1][c + 1];
                  }
              }
              let mut dp = vec![vec![0i64; cols]; rows];
              for r in 0..rows {
                  for c in 0..cols {
                      dp[r][c] = if apples[r][c] > 0 { 1 } else { 0 };
                  }
              }
              for _ in 1..k {
                  let mut nd = vec![vec![0i64; cols]; rows];
                  for r in 0..rows {
                      for c in 0..cols {
                          let mut total: i64 = 0;
                          for nr in (r + 1)..rows {
                              if apples[r][c] - apples[nr][c] > 0 {
                                  total += dp[nr][c];
                              }
                          }
                          for nc in (c + 1)..cols {
                              if apples[r][c] - apples[r][nc] > 0 {
                                  total += dp[r][nc];
                              }
                          }
                          nd[r][c] = total % modulus;
                      }
                  }
                  dp = nd;
              }
              dp[0][0] as i32
          }
        `,
        php: code`
          function ways($pizza, $k) {
              $modulus = 1000000007;
              $R = count($pizza);
              $C = strlen($pizza[0]);
              $apples = array_fill(0, $R + 1, array_fill(0, $C + 1, 0));
              for ($r = $R - 1; $r >= 0; $r--) {
                  for ($c = $C - 1; $c >= 0; $c--) {
                      $apples[$r][$c] = ($pizza[$r][$c] === 'A' ? 1 : 0) + $apples[$r + 1][$c] + $apples[$r][$c + 1] - $apples[$r + 1][$c + 1];
                  }
              }
              $dp = [];
              for ($r = 0; $r < $R; $r++) {
                  for ($c = 0; $c < $C; $c++) $dp[$r][$c] = $apples[$r][$c] > 0 ? 1 : 0;
              }
              for ($p = 1; $p < $k; $p++) {
                  $nd = [];
                  for ($r = 0; $r < $R; $r++) {
                      for ($c = 0; $c < $C; $c++) {
                          $total = 0;
                          for ($nr = $r + 1; $nr < $R; $nr++) if ($apples[$r][$c] - $apples[$nr][$c] > 0) $total += $dp[$nr][$c];
                          for ($nc = $c + 1; $nc < $C; $nc++) if ($apples[$r][$c] - $apples[$r][$nc] > 0) $total += $dp[$r][$nc];
                          $nd[$r][$c] = $total % $modulus;
                      }
                  }
                  $dp = $nd;
              }
              return $dp[0][0];
          }
        `,
        ruby: code`
          def ways(pizza, k)
            modulus = 1_000_000_007
            rows = pizza.length
            cols = pizza[0].length
            apples = Array.new(rows + 1) { Array.new(cols + 1, 0) }
            (rows - 1).downto(0) do |r|
              (cols - 1).downto(0) do |c|
                cell = pizza[r][c] == 'A' ? 1 : 0
                apples[r][c] = cell + apples[r + 1][c] + apples[r][c + 1] - apples[r + 1][c + 1]
              end
            end
            dp = Array.new(rows) { |r| Array.new(cols) { |c| apples[r][c] > 0 ? 1 : 0 } }
            (k - 1).times do
              nd = Array.new(rows) { Array.new(cols, 0) }
              rows.times do |r|
                cols.times do |c|
                  total = 0
                  ((r + 1)...rows).each { |nr| total += dp[nr][c] if apples[r][c] - apples[nr][c] > 0 }
                  ((c + 1)...cols).each { |nc| total += dp[r][nc] if apples[r][c] - apples[r][nc] > 0 }
                  nd[r][c] = total % modulus
                end
              end
              dp = nd
            end
            dp[0][0]
          end
        `,
      },
    };
  })(),

  // ── Paint House III (LC 1473) ───────────────────────────────────
  (() => {
    // Exhaustive search over the colours of the unpainted houses, pruned once
    // the neighbourhood count passes the target.
    const ref = (houses: number[], cost: number[][], m: number, n: number, target: number) => {
      let best = Infinity;
      const go = (i: number, last: number, groups: number, spent: number) => {
        if (groups > target) return;
        if (i === m) { if (groups === target && spent < best) best = spent; return; }
        const options = houses[i] ? [houses[i]] : Array.from({ length: n }, (_, c) => c + 1);
        for (const c of options) {
          go(i + 1, c, groups + (c === last ? 0 : 1), spent + (houses[i] ? 0 : cost[i][c - 1]));
        }
      };
      go(0, 0, 0, 0);
      return best === Infinity ? -1 : best;
    };
    return {
      slug: "paint-house-iii",
      title: "Paint House III",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Microsoft", "Google"],
      signature: {
        funcName: "minCost",
        params: [
          { name: "houses", type: "int[]" as const },
          { name: "cost", type: "int[][]" as const },
          { name: "m", type: "int" as const },
          { name: "n", type: "int" as const },
          { name: "target", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "A street has `m` houses in a row, and each must be painted one of `n` colours, labelled `1` to `n`. Some houses were already painted last summer and must **not** be repainted.\n\n" +
        "A **neighbourhood** is a maximal block of consecutive houses with the same colour. For example, the colours `[1,2,2,3,3,2,1,1]` form 5 neighbourhoods: `{1}`, `{2,2}`, `{3,3}`, `{2}`, `{1,1}`.\n\n" +
        "You are given `houses`, where `houses[i]` is the colour of house `i` or `0` if it is unpainted; an `m x n` matrix `cost`, where `cost[i][j]` is the price of painting house `i` with colour `j + 1`; and an integer `target`. Return the minimum cost of painting every unpainted house so that the street has **exactly** `target` neighbourhoods, or `-1` if that is impossible.",
        [
          { in: "houses = [0,0,0,0], cost = [[1,10],[10,1],[1,10],[10,1]], m = 4, n = 2, target = 2", out: "13", note: "Colours `[1,2,2,2]` (or `[1,1,1,2]`) make two neighbourhoods for 1 + 1 + 10 + 1 = 13." },
          { in: "houses = [0,2,1,0], cost = [[4,2],[3,3],[7,1],[2,6]], m = 4, n = 2, target = 3", out: "6", note: "Paint house 0 with colour 1 and house 3 with colour 1: `[1,2,1,1]` has three neighbourhoods." },
          { in: "houses = [1,2,1], cost = [[1,1],[1,1],[1,1]], m = 3, n = 2, target = 2", out: "-1", note: "Every house is painted already and there are three neighbourhoods." },
        ],
        [
          "m == houses.length == cost.length",
          "n == cost[i].length",
          "1 <= m <= 100",
          "1 <= n <= 20",
          "1 <= target <= m",
          "0 <= houses[i] <= n",
          "1 <= cost[i][j] <= 10^4",
        ]),
      hints: [
        "Going left to right, a new neighbourhood starts exactly when a house's colour differs from the previous house's colour.",
        "So the state after house `i` needs only two numbers: the colour of house `i` and how many neighbourhoods exist so far.",
        "`dp[c][t]` = cheapest cost with the current house coloured `c` and `t` neighbourhoods. For the next house and each allowed colour `c2` (only its fixed colour if already painted), move from every `dp[c][t]` to `dp[c2][t + (c != c2)]`, adding the paint cost (0 for a painted house).",
      ],
      editorial: explain({
        idea: "Whether house `i` starts a new neighbourhood depends only on its colour and the colour of house `i - 1`. So a DP over houses whose state is (colour of the current house, neighbourhoods so far) captures everything the future needs.",
        steps: [
          "Let `dp[c][t]` be the minimum cost to paint houses `0..i` with house `i` coloured `c` and exactly `t` neighbourhoods; start from house 0 with `t = 1` for each allowed colour.",
          "For each next house `i` and each allowed colour `c2` (every colour if `houses[i] == 0`, otherwise only `houses[i]`), with paint cost `p` (0 if already painted):",
          "for every previous colour `c` and count `t` with a finite `dp[c][t]`, set `t2 = t` if `c == c2` else `t + 1`; if `t2 <= target`, relax `next[c2][t2]` with `dp[c][t] + p`.",
          "After the last house, the answer is the minimum of `dp[c][target]` over all colours, or `-1` if every entry is infinite.",
        ],
        why: "Two partial paintings of houses `0..i` that agree on the last colour and the neighbourhood count are interchangeable for everything that follows: the future cost and the future neighbourhood changes depend on nothing else. Keeping only the cheapest one per state is therefore safe, and the transitions enumerate every colour choice for the next house.",
        time: "O(m · n^2 · target)",
        space: "O(n · target)",
        pitfalls: [
          "Painted houses keep their colour and cost nothing — but they still count towards neighbourhoods.",
          "Discard states whose count exceeds `target`; they can never come back down.",
          "Return `-1` when no state reaches exactly `target`, rather than an infinity sentinel.",
        ],
      }),
      examples: [
        { input: "[0,0,0,0]\n[[1,10],[10,1],[1,10],[10,1]]\n4\n2\n2", expectedOutput: "13" },
        { input: "[0,2,1,0]\n[[4,2],[3,3],[7,1],[2,6]]\n4\n2\n3", expectedOutput: "6" },
        { input: "[1,2,1]\n[[1,1],[1,1],[1,1]]\n3\n2\n2", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 2);
        let m: number, n: number, zeroP: number;
        if (cls === 0) { m = ri(rng, 1, 7); n = ri(rng, 1, 3); zeroP = pick(rng, [0.5, 0.9, 1]); }
        else if (cls === 1) { m = ri(rng, 1, 5); n = ri(rng, 1, 5); zeroP = pick(rng, [0.5, 0.9, 1]); }
        else { m = ri(rng, 6, 10); n = ri(rng, 2, 4); zeroP = 0.4; }
        const houses = Array.from({ length: m }, () => (rng() < zeroP ? 0 : ri(rng, 1, n)));
        if (cls === 2) {
          // keep the brute force small: at most 5 unpainted houses
          let zeros = 0;
          for (let i = 0; i < m; i++) if (houses[i] === 0 && ++zeros > 5) houses[i] = ri(rng, 1, n);
        }
        const hi = pick(rng, [10, 10000]);
        const cost = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 1, hi)));
        const target = ri(rng, 1, m);
        return {
          input: `${fmtIntArr(houses)}\n${fmtIntMat(cost)}\n${m}\n${n}\n${target}`,
          expectedOutput: String(ref(houses, cost, m, n, target)),
        };
      },
      solutions: {
        python: code`
          from typing import List

          def minCost(houses: List[int], cost: List[List[int]], m: int, n: int, target: int) -> int:
              INF = float('inf')
              dp = [[INF] * (target + 1) for _ in range(n + 1)]
              for c in range(1, n + 1):
                  if houses[0] == 0:
                      dp[c][1] = cost[0][c - 1]
                  elif houses[0] == c:
                      dp[c][1] = 0
              for i in range(1, m):
                  nd = [[INF] * (target + 1) for _ in range(n + 1)]
                  for c in range(1, n + 1):
                      if houses[i] != 0 and houses[i] != c:
                          continue
                      paint = 0 if houses[i] else cost[i][c - 1]
                      for pc in range(1, n + 1):
                          row = dp[pc]
                          for t in range(1, target + 1):
                              if row[t] == INF:
                                  continue
                              nt = t if pc == c else t + 1
                              if nt <= target and row[t] + paint < nd[c][nt]:
                                  nd[c][nt] = row[t] + paint
                  dp = nd
              best = min(dp[c][target] for c in range(1, n + 1))
              return -1 if best == INF else best
        `,
        javascript: code`
          var minCost = function(houses, cost, m, n, target) {
              var INF = Infinity;
              var fresh = function() {
                  var t = [];
                  for (var c = 0; c <= n; c++) t.push(new Array(target + 1).fill(INF));
                  return t;
              };
              var dp = fresh();
              for (var c = 1; c <= n; c++) {
                  if (houses[0] === 0) dp[c][1] = cost[0][c - 1];
                  else if (houses[0] === c) dp[c][1] = 0;
              }
              for (var i = 1; i < m; i++) {
                  var nd = fresh();
                  for (var c = 1; c <= n; c++) {
                      if (houses[i] !== 0 && houses[i] !== c) continue;
                      var paint = houses[i] ? 0 : cost[i][c - 1];
                      for (var pc = 1; pc <= n; pc++) {
                          for (var t = 1; t <= target; t++) {
                              if (dp[pc][t] === INF) continue;
                              var nt = pc === c ? t : t + 1;
                              if (nt <= target && dp[pc][t] + paint < nd[c][nt]) nd[c][nt] = dp[pc][t] + paint;
                          }
                      }
                  }
                  dp = nd;
              }
              var best = INF;
              for (var c = 1; c <= n; c++) best = Math.min(best, dp[c][target]);
              return best === INF ? -1 : best;
          };
        `,
        typescript: code`
          function paintTable(n: number, target: number, fill: number): number[][] {
              var t: number[][] = [];
              for (var c = 0; c <= n; c++) {
                  var row: number[] = [];
                  for (var k = 0; k <= target; k++) row.push(fill);
                  t.push(row);
              }
              return t;
          }

          function minCost(houses: number[], cost: number[][], m: number, n: number, target: number): number {
              var INF = 1000000000;
              var dp = paintTable(n, target, INF);
              for (var c = 1; c <= n; c++) {
                  if (houses[0] === 0) dp[c][1] = cost[0][c - 1];
                  else if (houses[0] === c) dp[c][1] = 0;
              }
              for (var i = 1; i < m; i++) {
                  var nd = paintTable(n, target, INF);
                  for (var c = 1; c <= n; c++) {
                      if (houses[i] !== 0 && houses[i] !== c) continue;
                      var paint = houses[i] ? 0 : cost[i][c - 1];
                      for (var pc = 1; pc <= n; pc++) {
                          for (var t = 1; t <= target; t++) {
                              if (dp[pc][t] === INF) continue;
                              var nt = pc === c ? t : t + 1;
                              if (nt <= target && dp[pc][t] + paint < nd[c][nt]) nd[c][nt] = dp[pc][t] + paint;
                          }
                      }
                  }
                  dp = nd;
              }
              var best = INF;
              for (var c = 1; c <= n; c++) best = Math.min(best, dp[c][target]);
              return best === INF ? -1 : best;
          }
        `,
        java: code`
          public static int minCost(int[] houses, int[][] cost, int m, int n, int target) {
              final int INF = Integer.MAX_VALUE / 2;
              int[][] dp = new int[n + 1][target + 1];
              for (int[] row : dp) Arrays.fill(row, INF);
              for (int c = 1; c <= n; c++) {
                  if (houses[0] == 0) dp[c][1] = cost[0][c - 1];
                  else if (houses[0] == c) dp[c][1] = 0;
              }
              for (int i = 1; i < m; i++) {
                  int[][] nd = new int[n + 1][target + 1];
                  for (int[] row : nd) Arrays.fill(row, INF);
                  for (int c = 1; c <= n; c++) {
                      if (houses[i] != 0 && houses[i] != c) continue;
                      int paint = houses[i] != 0 ? 0 : cost[i][c - 1];
                      for (int pc = 1; pc <= n; pc++) {
                          for (int t = 1; t <= target; t++) {
                              if (dp[pc][t] == INF) continue;
                              int nt = pc == c ? t : t + 1;
                              if (nt <= target && dp[pc][t] + paint < nd[c][nt]) nd[c][nt] = dp[pc][t] + paint;
                          }
                      }
                  }
                  dp = nd;
              }
              int best = INF;
              for (int c = 1; c <= n; c++) best = Math.min(best, dp[c][target]);
              return best == INF ? -1 : best;
          }
        `,
        cpp: code`
          int minCost(vector<int>& houses, vector<vector<int>>& cost, int m, int n, int target) {
              const int INF = INT_MAX / 2;
              vector<vector<int>> dp(n + 1, vector<int>(target + 1, INF));
              for (int c = 1; c <= n; c++) {
                  if (houses[0] == 0) dp[c][1] = cost[0][c - 1];
                  else if (houses[0] == c) dp[c][1] = 0;
              }
              for (int i = 1; i < m; i++) {
                  vector<vector<int>> nd(n + 1, vector<int>(target + 1, INF));
                  for (int c = 1; c <= n; c++) {
                      if (houses[i] != 0 && houses[i] != c) continue;
                      int paint = houses[i] != 0 ? 0 : cost[i][c - 1];
                      for (int pc = 1; pc <= n; pc++) {
                          for (int t = 1; t <= target; t++) {
                              if (dp[pc][t] == INF) continue;
                              int nt = pc == c ? t : t + 1;
                              if (nt <= target && dp[pc][t] + paint < nd[c][nt]) nd[c][nt] = dp[pc][t] + paint;
                          }
                      }
                  }
                  dp = nd;
              }
              int best = INF;
              for (int c = 1; c <= n; c++) best = min(best, dp[c][target]);
              return best == INF ? -1 : best;
          }
        `,
        c: code`
          int minCost(int* houses, int housesSize, int** cost, int costSize, int* costColSize, int m, int n, int target) {
              const int INF = 1000000000;
              int W = target + 1;
              int* dp = (int*)malloc(sizeof(int) * (n + 1) * W);
              int* nd = (int*)malloc(sizeof(int) * (n + 1) * W);
              for (int k = 0; k < (n + 1) * W; k++) dp[k] = INF;
              for (int c = 1; c <= n; c++) {
                  if (houses[0] == 0) dp[c * W + 1] = cost[0][c - 1];
                  else if (houses[0] == c) dp[c * W + 1] = 0;
              }
              for (int i = 1; i < m; i++) {
                  for (int k = 0; k < (n + 1) * W; k++) nd[k] = INF;
                  for (int c = 1; c <= n; c++) {
                      if (houses[i] != 0 && houses[i] != c) continue;
                      int paint = houses[i] != 0 ? 0 : cost[i][c - 1];
                      for (int pc = 1; pc <= n; pc++) {
                          for (int t = 1; t <= target; t++) {
                              int cur = dp[pc * W + t];
                              if (cur == INF) continue;
                              int nt = pc == c ? t : t + 1;
                              if (nt <= target && cur + paint < nd[c * W + nt]) nd[c * W + nt] = cur + paint;
                          }
                      }
                  }
                  int* tmp = dp;
                  dp = nd;
                  nd = tmp;
              }
              int best = INF;
              for (int c = 1; c <= n; c++) if (dp[c * W + target] < best) best = dp[c * W + target];
              free(dp);
              free(nd);
              return best == INF ? -1 : best;
          }
        `,
        csharp: code`
          public static int MinCost(int[] houses, int[][] cost, int m, int n, int target)
          {
              const int INF = int.MaxValue / 2;
              int[,] dp = new int[n + 1, target + 1];
              for (int c = 0; c <= n; c++) for (int t = 0; t <= target; t++) dp[c, t] = INF;
              for (int c = 1; c <= n; c++)
              {
                  if (houses[0] == 0) dp[c, 1] = cost[0][c - 1];
                  else if (houses[0] == c) dp[c, 1] = 0;
              }
              for (int i = 1; i < m; i++)
              {
                  int[,] nd = new int[n + 1, target + 1];
                  for (int c = 0; c <= n; c++) for (int t = 0; t <= target; t++) nd[c, t] = INF;
                  for (int c = 1; c <= n; c++)
                  {
                      if (houses[i] != 0 && houses[i] != c) continue;
                      int paint = houses[i] != 0 ? 0 : cost[i][c - 1];
                      for (int pc = 1; pc <= n; pc++)
                      {
                          for (int t = 1; t <= target; t++)
                          {
                              if (dp[pc, t] == INF) continue;
                              int nt = pc == c ? t : t + 1;
                              if (nt <= target && dp[pc, t] + paint < nd[c, nt]) nd[c, nt] = dp[pc, t] + paint;
                          }
                      }
                  }
                  dp = nd;
              }
              int best = INF;
              for (int c = 1; c <= n; c++) best = Math.Min(best, dp[c, target]);
              return best == INF ? -1 : best;
          }
        `,
        go: code`
          func minCost(houses []int, cost [][]int, m int, n int, target int) int {
              const inf = 1 << 40
              fresh := func() [][]int {
                  t := make([][]int, n+1)
                  for c := range t {
                      t[c] = make([]int, target+1)
                      for k := range t[c] {
                          t[c][k] = inf
                      }
                  }
                  return t
              }
              dp := fresh()
              for c := 1; c <= n; c++ {
                  if houses[0] == 0 {
                      dp[c][1] = cost[0][c-1]
                  } else if houses[0] == c {
                      dp[c][1] = 0
                  }
              }
              for i := 1; i < m; i++ {
                  nd := fresh()
                  for c := 1; c <= n; c++ {
                      if houses[i] != 0 && houses[i] != c {
                          continue
                      }
                      paint := 0
                      if houses[i] == 0 {
                          paint = cost[i][c-1]
                      }
                      for pc := 1; pc <= n; pc++ {
                          for t := 1; t <= target; t++ {
                              if dp[pc][t] == inf {
                                  continue
                              }
                              nt := t
                              if pc != c {
                                  nt = t + 1
                              }
                              if nt <= target && dp[pc][t]+paint < nd[c][nt] {
                                  nd[c][nt] = dp[pc][t] + paint
                              }
                          }
                      }
                  }
                  dp = nd
              }
              best := inf
              for c := 1; c <= n; c++ {
                  if dp[c][target] < best {
                      best = dp[c][target]
                  }
              }
              if best == inf {
                  return -1
              }
              return best
          }
        `,
        kotlin: code`
          fun minCost(houses: IntArray, cost: Array<IntArray>, m: Int, n: Int, target: Int): Int {
              val inf = Int.MAX_VALUE / 2
              var dp = Array(n + 1) { IntArray(target + 1) { inf } }
              for (c in 1..n) {
                  if (houses[0] == 0) dp[c][1] = cost[0][c - 1]
                  else if (houses[0] == c) dp[c][1] = 0
              }
              for (i in 1 until m) {
                  val nd = Array(n + 1) { IntArray(target + 1) { inf } }
                  for (c in 1..n) {
                      if (houses[i] != 0 && houses[i] != c) continue
                      val paint = if (houses[i] != 0) 0 else cost[i][c - 1]
                      for (pc in 1..n) {
                          for (t in 1..target) {
                              if (dp[pc][t] == inf) continue
                              val nt = if (pc == c) t else t + 1
                              if (nt <= target && dp[pc][t] + paint < nd[c][nt]) nd[c][nt] = dp[pc][t] + paint
                          }
                      }
                  }
                  dp = nd
              }
              var best = inf
              for (c in 1..n) best = minOf(best, dp[c][target])
              return if (best == inf) -1 else best
          }
        `,
        swift: code`
          func minCost(_ houses: [Int], _ cost: [[Int]], _ m: Int, _ n: Int, _ target: Int) -> Int {
              let inf = Int.max / 2
              var dp = [[Int]](repeating: [Int](repeating: inf, count: target + 1), count: n + 1)
              for c in 1...n {
                  if houses[0] == 0 { dp[c][1] = cost[0][c - 1] }
                  else if houses[0] == c { dp[c][1] = 0 }
              }
              var i = 1
              while i < m {
                  var nd = [[Int]](repeating: [Int](repeating: inf, count: target + 1), count: n + 1)
                  for c in 1...n {
                      if houses[i] != 0 && houses[i] != c { continue }
                      let paint = houses[i] != 0 ? 0 : cost[i][c - 1]
                      for pc in 1...n {
                          for t in 1...target {
                              if dp[pc][t] == inf { continue }
                              let nt = pc == c ? t : t + 1
                              if nt <= target && dp[pc][t] + paint < nd[c][nt] { nd[c][nt] = dp[pc][t] + paint }
                          }
                      }
                  }
                  dp = nd
                  i += 1
              }
              var best = inf
              for c in 1...n { best = min(best, dp[c][target]) }
              return best == inf ? -1 : best
          }
        `,
        rust: code`
          fn minCost(houses: Vec<i32>, cost: Vec<Vec<i32>>, m: i32, n: i32, target: i32) -> i32 {
              let inf = std::i32::MAX / 2;
              let (m, n, target) = (m as usize, n as usize, target as usize);
              let mut dp = vec![vec![inf; target + 1]; n + 1];
              for c in 1..=n {
                  if houses[0] == 0 {
                      dp[c][1] = cost[0][c - 1];
                  } else if houses[0] as usize == c {
                      dp[c][1] = 0;
                  }
              }
              for i in 1..m {
                  let mut nd = vec![vec![inf; target + 1]; n + 1];
                  for c in 1..=n {
                      if houses[i] != 0 && houses[i] as usize != c {
                          continue;
                      }
                      let paint = if houses[i] != 0 { 0 } else { cost[i][c - 1] };
                      for pc in 1..=n {
                          for t in 1..=target {
                              if dp[pc][t] == inf {
                                  continue;
                              }
                              let nt = if pc == c { t } else { t + 1 };
                              if nt <= target && dp[pc][t] + paint < nd[c][nt] {
                                  nd[c][nt] = dp[pc][t] + paint;
                              }
                          }
                      }
                  }
                  dp = nd;
              }
              let mut best = inf;
              for c in 1..=n {
                  best = std::cmp::min(best, dp[c][target]);
              }
              if best == inf { -1 } else { best }
          }
        `,
        php: code`
          function minCost($houses, $cost, $m, $n, $target) {
              $inf = PHP_INT_MAX;
              $dp = array_fill(0, $n + 1, array_fill(0, $target + 1, $inf));
              for ($c = 1; $c <= $n; $c++) {
                  if ($houses[0] == 0) $dp[$c][1] = $cost[0][$c - 1];
                  elseif ($houses[0] == $c) $dp[$c][1] = 0;
              }
              for ($i = 1; $i < $m; $i++) {
                  $nd = array_fill(0, $n + 1, array_fill(0, $target + 1, $inf));
                  for ($c = 1; $c <= $n; $c++) {
                      if ($houses[$i] != 0 && $houses[$i] != $c) continue;
                      $paint = $houses[$i] != 0 ? 0 : $cost[$i][$c - 1];
                      for ($pc = 1; $pc <= $n; $pc++) {
                          for ($t = 1; $t <= $target; $t++) {
                              if ($dp[$pc][$t] === $inf) continue;
                              $nt = $pc == $c ? $t : $t + 1;
                              if ($nt <= $target && $dp[$pc][$t] + $paint < $nd[$c][$nt]) $nd[$c][$nt] = $dp[$pc][$t] + $paint;
                          }
                      }
                  }
                  $dp = $nd;
              }
              $best = $inf;
              for ($c = 1; $c <= $n; $c++) if ($dp[$c][$target] < $best) $best = $dp[$c][$target];
              return $best === $inf ? -1 : $best;
          }
        `,
        ruby: code`
          def minCost(houses, cost, m, n, target)
            inf = 1 << 40
            dp = Array.new(n + 1) { Array.new(target + 1, inf) }
            (1..n).each do |c|
              if houses[0] == 0
                dp[c][1] = cost[0][c - 1]
              elsif houses[0] == c
                dp[c][1] = 0
              end
            end
            (1...m).each do |i|
              nd = Array.new(n + 1) { Array.new(target + 1, inf) }
              (1..n).each do |c|
                next if houses[i] != 0 && houses[i] != c
                paint = houses[i] != 0 ? 0 : cost[i][c - 1]
                (1..n).each do |pc|
                  (1..target).each do |t|
                    cur = dp[pc][t]
                    next if cur == inf
                    nt = pc == c ? t : t + 1
                    nd[c][nt] = cur + paint if nt <= target && cur + paint < nd[c][nt]
                  end
                end
              end
              dp = nd
            end
            best = (1..n).map { |c| dp[c][target] }.min
            best == inf ? -1 : best
          end
        `,
      },
    };
  })(),

  // ── Minimum Number of Days to Eat N Oranges (LC 1553) ───────────
  (() => {
    // Plain bottom-up over every count up to 2·10^6 (eat one, halve, or take
    // two thirds) — built once. Larger n recurse onto the table through the
    // same "reach a multiple first" rule, which the table itself validates.
    const LIMIT = 2000000;
    let table: Int32Array | null = null;
    const build = () => {
      const t = new Int32Array(LIMIT + 1);
      for (let i = 1; i <= LIMIT; i++) {
        let v = t[i - 1] + 1;
        if (i % 2 === 0 && t[i / 2] + 1 < v) v = t[i / 2] + 1;
        if (i % 3 === 0 && t[i / 3] + 1 < v) v = t[i / 3] + 1;
        t[i] = v;
      }
      return t;
    };
    const ref = (n: number): number => {
      if (!table) table = build();
      if (n <= LIMIT) return table[n];
      return 1 + Math.min((n % 2) + ref(Math.floor(n / 2)), (n % 3) + ref(Math.floor(n / 3)));
    };
    return {
      slug: "minimum-number-of-days-to-eat-n-oranges",
      title: "Minimum Number of Days to Eat N Oranges",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Memoization", "Google", "Amazon"],
      signature: { funcName: "minDays", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "There are `n` oranges in the kitchen. Each day you eat some of them, choosing exactly **one** of these options for the day (with `n` the number of oranges left that morning):\n\n" +
        "- eat one orange;\n" +
        "- if `n` is divisible by 2, eat `n / 2` oranges;\n" +
        "- if `n` is divisible by 3, eat `2 * (n / 3)` oranges.\n\n" +
        "Return the minimum number of days needed to eat all `n` oranges.",
        [
          { in: "n = 1", out: "1" },
          { in: "n = 10", out: "4", note: "10 → 9 (eat one) → 3 (eat two thirds) → 1 (eat two thirds) → 0." },
          { in: "n = 56", out: "6", note: "56 → 28 → 14 → 7 → 6 → 2 → 0 is one six-day plan; there is no five-day plan." },
        ],
        ["1 <= n <= 2 * 10^9"]),
      hints: [
        "A table over every count up to `n` is far too large. Which counts can an optimal plan actually pass through?",
        "Eating one orange at a time is only useful to reach a multiple of 2 or 3. Before halving, eat `n % 2` singles; before taking two thirds, eat `n % 3` singles — never more, because halving earlier would have been at least as good.",
        "So `days(n) = 1 + min(n % 2 + days(n / 2), n % 3 + days(n / 3))` with integer division, `days(0) = 0`, `days(1) = 1`. Memoise it — only O(log² n) distinct values `n / (2^a · 3^b)` ever appear.",
      ],
      editorial: explain({
        idea: "Single-orange days are only worth spending to reach the next multiple of 2 or 3. That turns the huge state space into the values `floor(n / (2^a · 3^b))`, of which there are only about `log2 n · log3 n`.",
        steps: [
          "Define `days(0) = 0` and `days(1) = 1`.",
          "For larger `x`: `days(x) = 1 + min(x % 2 + days(x / 2), x % 3 + days(x / 3))`, using integer division.",
          "Memoise in a hash map and return `days(n)`.",
        ],
        why: "In an optimal plan, look at the first day that halves or takes two thirds. Every single-orange day before it can be rearranged: if more than `x % 2` singles precede a halving, two of them could be traded for one single after it (eating 2 before halving removes the same as eating 1 after), which never costs more. The same exchange with three singles works for the two-thirds move. So an optimal plan eats exactly `x % 2` or `x % 3` singles and then divides, which is the recurrence; since `floor(floor(x/2)/3) = floor(x/6)`, every state is `n` divided by some `2^a · 3^b`.",
        time: "O(log² n)",
        space: "O(log² n)",
        pitfalls: [
          "A bottom-up array or a BFS over all counts up to 2 · 10^9 runs out of memory and time.",
          "Including 'eat one' as its own recursive branch (`days(x - 1)`) brings back the linear state space.",
          "Two-thirds means eating `2 * (n / 3)` and leaving `n / 3`, so the recursion goes to `n / 3`.",
        ],
      }),
      examples: [
        { input: "1", expectedOutput: "1" },
        { input: "10", expectedOutput: "4" },
        { input: "56", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 3);
        let n: number;
        if (cls === 0) n = ri(rng, 1, 100);
        else if (cls === 1) n = ri(rng, 1, 2000000);
        else if (cls === 2) n = ri(rng, 1, 2000000000);
        else n = Math.max(1, Math.min(2000000000, Math.floor(Math.exp(rng() * Math.log(2000000000)))));
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def minDays(n: int) -> int:
              memo = {0: 0, 1: 1}

              def days(x):
                  if x in memo:
                      return memo[x]
                  r = 1 + min(x % 2 + days(x // 2), x % 3 + days(x // 3))
                  memo[x] = r
                  return r

              return days(n)
        `,
        javascript: code`
          var minDays = function(n) {
              var memo = new Map();
              memo.set(0, 0);
              memo.set(1, 1);
              var days = function(x) {
                  var hit = memo.get(x);
                  if (hit !== undefined) return hit;
                  var r = 1 + Math.min(x % 2 + days(Math.floor(x / 2)), x % 3 + days(Math.floor(x / 3)));
                  memo.set(x, r);
                  return r;
              };
              return days(n);
          };
        `,
        typescript: code`
          function orangeDays(x: number, memo: { [k: string]: number }): number {
              if (x <= 1) return x;
              var key = "" + x;
              if (memo.hasOwnProperty(key)) return memo[key];
              var r = 1 + Math.min(x % 2 + orangeDays(Math.floor(x / 2), memo), x % 3 + orangeDays(Math.floor(x / 3), memo));
              memo[key] = r;
              return r;
          }

          function minDays(n: number): number {
              return orangeDays(n, {});
          }
        `,
        java: code`
          static int orangeDays(int x, Map<Integer, Integer> memo) {
              if (x <= 1) return x;
              Integer hit = memo.get(x);
              if (hit != null) return hit;
              int r = 1 + Math.min(x % 2 + orangeDays(x / 2, memo), x % 3 + orangeDays(x / 3, memo));
              memo.put(x, r);
              return r;
          }

          public static int minDays(int n) {
              return orangeDays(n, new HashMap<>());
          }
        `,
        cpp: code`
          int orangeDays(int x, unordered_map<int, int>& memo) {
              if (x <= 1) return x;
              auto it = memo.find(x);
              if (it != memo.end()) return it->second;
              int r = 1 + min(x % 2 + orangeDays(x / 2, memo), x % 3 + orangeDays(x / 3, memo));
              memo[x] = r;
              return r;
          }

          int minDays(int n) {
              unordered_map<int, int> memo;
              return orangeDays(n, memo);
          }
        `,
        c: code`
          /* Every state is n / (2^a * 3^b), so memoise by the exponents (a, b). */
          static int orangeMemo[34][22];

          static int orangeDays(int a, int b, long long x) {
              if (x <= 1) return (int)x;
              if (orangeMemo[a][b]) return orangeMemo[a][b];
              int viaTwo = (int)(x % 2) + orangeDays(a + 1, b, x / 2);
              int viaThree = (int)(x % 3) + orangeDays(a, b + 1, x / 3);
              int r = 1 + (viaTwo < viaThree ? viaTwo : viaThree);
              orangeMemo[a][b] = r;
              return r;
          }

          int minDays(int n) {
              memset(orangeMemo, 0, sizeof(orangeMemo));
              return orangeDays(0, 0, n);
          }
        `,
        csharp: code`
          static int OrangeDays(int x, Dictionary<int, int> memo)
          {
              if (x <= 1) return x;
              int hit;
              if (memo.TryGetValue(x, out hit)) return hit;
              int r = 1 + Math.Min(x % 2 + OrangeDays(x / 2, memo), x % 3 + OrangeDays(x / 3, memo));
              memo[x] = r;
              return r;
          }

          public static int MinDays(int n)
          {
              return OrangeDays(n, new Dictionary<int, int>());
          }
        `,
        go: code`
          func minDays(n int) int {
              memo := map[int]int{0: 0, 1: 1}
              var days func(x int) int
              days = func(x int) int {
                  if v, ok := memo[x]; ok {
                      return v
                  }
                  a := x%2 + days(x/2)
                  b := x%3 + days(x/3)
                  if b < a {
                      a = b
                  }
                  memo[x] = 1 + a
                  return 1 + a
              }
              return days(n)
          }
        `,
        kotlin: code`
          fun orangeDays(x: Int, memo: HashMap<Int, Int>): Int {
              if (x <= 1) return x
              val hit = memo[x]
              if (hit != null) return hit
              val r = 1 + minOf(x % 2 + orangeDays(x / 2, memo), x % 3 + orangeDays(x / 3, memo))
              memo[x] = r
              return r
          }

          fun minDays(n: Int): Int {
              return orangeDays(n, HashMap())
          }
        `,
        swift: code`
          func minDays(_ n: Int) -> Int {
              var memo: [Int: Int] = [0: 0, 1: 1]
              func days(_ x: Int) -> Int {
                  if let v = memo[x] { return v }
                  let r = 1 + min(x % 2 + days(x / 2), x % 3 + days(x / 3))
                  memo[x] = r
                  return r
              }
              return days(n)
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn orange_days(x: i64, memo: &mut HashMap<i64, i32>) -> i32 {
              if x <= 1 {
                  return x as i32;
              }
              if let Some(&v) = memo.get(&x) {
                  return v;
              }
              let a = (x % 2) as i32 + orange_days(x / 2, memo);
              let b = (x % 3) as i32 + orange_days(x / 3, memo);
              let r = 1 + std::cmp::min(a, b);
              memo.insert(x, r);
              r
          }

          fn minDays(n: i32) -> i32 {
              let mut memo: HashMap<i64, i32> = HashMap::new();
              orange_days(n as i64, &mut memo)
          }
        `,
        php: code`
          function orangeDays($x, &$memo) {
              if ($x <= 1) return $x;
              if (isset($memo[$x])) return $memo[$x];
              $r = 1 + min($x % 2 + orangeDays(intdiv($x, 2), $memo), $x % 3 + orangeDays(intdiv($x, 3), $memo));
              $memo[$x] = $r;
              return $r;
          }

          function minDays($n) {
              $memo = [];
              return orangeDays($n, $memo);
          }
        `,
        ruby: code`
          def orange_days(x, memo)
            return x if x <= 1
            return memo[x] if memo.key?(x)
            r = 1 + [x % 2 + orange_days(x / 2, memo), x % 3 + orange_days(x / 3, memo)].min
            memo[x] = r
            r
          end

          def minDays(n)
            orange_days(n, {})
          end
        `,
      },
    };
  })(),

  // ── Count All Possible Routes (LC 1575) ─────────────────────────
  (() => {
    // Forward count of partial routes from `start`, by fuel remaining —
    // the solutions count backward from each city to `finish` instead.
    const ref = (loc: number[], start: number, finish: number, fuel: number) => {
      const n = loc.length, MOD = 1000000007;
      const cnt: number[][] = Array.from({ length: fuel + 1 }, () => new Array(n).fill(0));
      cnt[fuel][start] = 1;
      let ans = 0;
      for (let f = fuel; f >= 0; f--) {
        for (let c = 0; c < n; c++) {
          const v = cnt[f][c];
          if (!v) continue;
          if (c === finish) ans = (ans + v) % MOD;
          for (let j = 0; j < n; j++) {
            if (j === c) continue;
            const d = Math.abs(loc[c] - loc[j]);
            if (d <= f) cnt[f - d][j] = (cnt[f - d][j] + v) % MOD;
          }
        }
      }
      return ans;
    };
    return {
      slug: "count-all-possible-routes",
      title: "Count All Possible Routes",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Memoization", "Amazon", "Google"],
      signature: {
        funcName: "countRoutes",
        params: [
          { name: "locations", type: "int[]" as const },
          { name: "start", type: "int" as const },
          { name: "finish", type: "int" as const },
          { name: "fuel", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "You are given an array of **distinct** positive integers `locations`, where `locations[i]` is the position of city `i`, together with the integers `start`, `finish` and `fuel` — your starting city, your destination and your initial fuel.\n\n" +
        "From city `i` you may drive to any other city `j != i`, which burns `|locations[i] - locations[j]|` units of fuel. Your fuel can never drop below zero. You may visit any city, including `start` and `finish`, as many times as you like.\n\n" +
        "Count the routes that begin at `start` and end at `finish` — a route is the sequence of cities visited, and it ends whenever you are at `finish` (it may also pass through `finish` earlier). If `start == finish`, the route that does not move counts too. Return the count modulo `10^9 + 7`.",
        [
          { in: "locations = [1,4,2], start = 0, finish = 1, fuel = 6", out: "4", note: "`0→1`, `0→2→1`, `0→2→0→1` and `0→2→0→2→1`, using 3, 3, 5 and 5 units of fuel." },
          { in: "locations = [3,8], start = 1, finish = 1, fuel = 9", out: "1", note: "Only the empty route: going to city 0 and back needs 10 units." },
          { in: "locations = [5,2,1], start = 0, finish = 2, fuel = 3", out: "0", note: "Even the direct drive needs 4 units." },
        ],
        [
          "2 <= locations.length <= 100",
          "1 <= locations[i] <= 10^9",
          "all integers in locations are distinct",
          "0 <= start, finish < locations.length",
          "1 <= fuel <= 200",
        ]),
      hints: [
        "A route from a city depends only on where you are and how much fuel is left — not on how you got there.",
        "Let `ways(c, f)` be the number of routes from city `c` to `finish` with `f` fuel. It is 1 if `c == finish` (stop here) plus the sum over every other city `j` you can afford to reach of `ways(j, f - cost)`.",
        "Every move costs at least 1 because the locations are distinct, so fill the table by increasing fuel: each entry only reads entries with less fuel.",
      ],
      editorial: explain({
        idea: "Count routes by state `(city, fuel left)`. Because cities have distinct positions, every move strictly lowers the fuel, so the states form a DAG ordered by fuel and a table filled from low fuel to high fuel counts every route exactly once.",
        steps: [
          "Let `ways[f][c]` be the number of routes from city `c` that end at `finish`, having `f` fuel.",
          "For `f` from 0 to `fuel` and every city `c`: start with 1 if `c == finish` (the route may end right here), then add `ways[f - d][j]` for every city `j != c` with `d = |locations[c] - locations[j]| <= f`.",
          "Reduce modulo 10^9 + 7.",
          "Return `ways[fuel][start]`.",
        ],
        why: "A route from `c` either ends immediately (possible only at `finish`) or makes a first move to some `j`, after which it is an arbitrary route from `j` with the remaining fuel. These cases are disjoint and cover every route, which is the recurrence. Since `d >= 1`, `ways[f - d]` is already computed when row `f` is filled.",
        time: "O(n^2 · fuel)",
        space: "O(n · fuel)",
        pitfalls: [
          "Passing through `finish` does not end the route — routes that continue past it and return later are counted separately.",
          "When `start == finish`, the zero-move route counts.",
          "The sums exceed 32 bits before the modulus; accumulate in 64-bit integers.",
        ],
      }),
      examples: [
        { input: "[1,4,2]\n0\n1\n6", expectedOutput: "4" },
        { input: "[3,8]\n1\n1\n9", expectedOutput: "1" },
        { input: "[5,2,1]\n0\n2\n3", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [2, ri(rng, 2, 4), ri(rng, 3, 7)]);
        let loc: number[];
        if (rng() < 0.15) {
          const seen = new Set<number>();
          while (seen.size < n) seen.add(ri(rng, 1, 1000000000));
          loc = Array.from(seen);
        } else {
          const span = pick(rng, [n + 2, 12, 25]);
          loc = shuffle(rng, Array.from({ length: span }, (_, i) => i + 1)).slice(0, n);
        }
        const fuel = pick(rng, [ri(rng, 1, 8), ri(rng, 1, 20), ri(rng, 10, 30)]);
        const start = ri(rng, 0, n - 1);
        const finish = rng() < 0.2 ? start : ri(rng, 0, n - 1);
        return { input: `${fmtIntArr(loc)}\n${start}\n${finish}\n${fuel}`, expectedOutput: String(ref(loc, start, finish, fuel)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countRoutes(locations: List[int], start: int, finish: int, fuel: int) -> int:
              MOD = 10 ** 9 + 7
              n = len(locations)
              ways = [[0] * n for _ in range(fuel + 1)]
              for f in range(fuel + 1):
                  for c in range(n):
                      total = 1 if c == finish else 0
                      for j in range(n):
                          if j != c:
                              d = abs(locations[c] - locations[j])
                              if d <= f:
                                  total += ways[f - d][j]
                      ways[f][c] = total % MOD
              return ways[fuel][start]
        `,
        javascript: code`
          var countRoutes = function(locations, start, finish, fuel) {
              var MOD = 1000000007, n = locations.length;
              var ways = [];
              for (var f = 0; f <= fuel; f++) {
                  ways.push(new Array(n).fill(0));
                  for (var c = 0; c < n; c++) {
                      var total = c === finish ? 1 : 0;
                      for (var j = 0; j < n; j++) {
                          if (j === c) continue;
                          var d = Math.abs(locations[c] - locations[j]);
                          if (d <= f) total += ways[f - d][j];
                      }
                      ways[f][c] = total % MOD;
                  }
              }
              return ways[fuel][start];
          };
        `,
        typescript: code`
          function countRoutes(locations: number[], start: number, finish: number, fuel: number): number {
              var MOD = 1000000007, n = locations.length;
              var ways: number[][] = [];
              for (var f = 0; f <= fuel; f++) {
                  var row: number[] = [];
                  for (var c = 0; c < n; c++) {
                      var total = c === finish ? 1 : 0;
                      for (var j = 0; j < n; j++) {
                          if (j === c) continue;
                          var d = Math.abs(locations[c] - locations[j]);
                          if (d <= f) total += ways[f - d][j];
                      }
                      row.push(total % MOD);
                  }
                  ways.push(row);
              }
              return ways[fuel][start];
          }
        `,
        java: code`
          public static int countRoutes(int[] locations, int start, int finish, int fuel) {
              final long MOD = 1000000007L;
              int n = locations.length;
              long[][] ways = new long[fuel + 1][n];
              for (int f = 0; f <= fuel; f++) {
                  for (int c = 0; c < n; c++) {
                      long total = c == finish ? 1 : 0;
                      for (int j = 0; j < n; j++) {
                          if (j == c) continue;
                          int d = Math.abs(locations[c] - locations[j]);
                          if (d <= f) total += ways[f - d][j];
                      }
                      ways[f][c] = total % MOD;
                  }
              }
              return (int) ways[fuel][start];
          }
        `,
        cpp: code`
          int countRoutes(vector<int>& locations, int start, int finish, int fuel) {
              const long long MOD = 1000000007LL;
              int n = locations.size();
              vector<vector<long long>> ways(fuel + 1, vector<long long>(n, 0));
              for (int f = 0; f <= fuel; f++) {
                  for (int c = 0; c < n; c++) {
                      long long total = c == finish ? 1 : 0;
                      for (int j = 0; j < n; j++) {
                          if (j == c) continue;
                          int d = abs(locations[c] - locations[j]);
                          if (d <= f) total += ways[f - d][j];
                      }
                      ways[f][c] = total % MOD;
                  }
              }
              return (int)ways[fuel][start];
          }
        `,
        c: code`
          int countRoutes(int* locations, int locationsSize, int start, int finish, int fuel) {
              const long long MOD = 1000000007LL;
              int n = locationsSize;
              long long* ways = (long long*)calloc((size_t)(fuel + 1) * n, sizeof(long long));
              for (int f = 0; f <= fuel; f++) {
                  for (int c = 0; c < n; c++) {
                      long long total = c == finish ? 1 : 0;
                      for (int j = 0; j < n; j++) {
                          if (j == c) continue;
                          int d = locations[c] - locations[j];
                          if (d < 0) d = -d;
                          if (d <= f) total += ways[(f - d) * n + j];
                      }
                      ways[f * n + c] = total % MOD;
                  }
              }
              int ans = (int)ways[fuel * n + start];
              free(ways);
              return ans;
          }
        `,
        csharp: code`
          public static int CountRoutes(int[] locations, int start, int finish, int fuel)
          {
              const long MOD = 1000000007L;
              int n = locations.Length;
              long[,] ways = new long[fuel + 1, n];
              for (int f = 0; f <= fuel; f++)
              {
                  for (int c = 0; c < n; c++)
                  {
                      long total = c == finish ? 1 : 0;
                      for (int j = 0; j < n; j++)
                      {
                          if (j == c) continue;
                          int d = Math.Abs(locations[c] - locations[j]);
                          if (d <= f) total += ways[f - d, j];
                      }
                      ways[f, c] = total % MOD;
                  }
              }
              return (int)ways[fuel, start];
          }
        `,
        go: code`
          func countRoutes(locations []int, start int, finish int, fuel int) int {
              const mod = 1000000007
              n := len(locations)
              ways := make([][]int, fuel+1)
              for f := 0; f <= fuel; f++ {
                  ways[f] = make([]int, n)
                  for c := 0; c < n; c++ {
                      total := 0
                      if c == finish {
                          total = 1
                      }
                      for j := 0; j < n; j++ {
                          if j == c {
                              continue
                          }
                          d := locations[c] - locations[j]
                          if d < 0 {
                              d = -d
                          }
                          if d <= f {
                              total += ways[f-d][j]
                          }
                      }
                      ways[f][c] = total % mod
                  }
              }
              return ways[fuel][start]
          }
        `,
        kotlin: code`
          fun countRoutes(locations: IntArray, start: Int, finish: Int, fuel: Int): Int {
              val modulus = 1000000007L
              val n = locations.size
              val ways = Array(fuel + 1) { LongArray(n) }
              for (f in 0..fuel) {
                  for (c in 0 until n) {
                      var total = if (c == finish) 1L else 0L
                      for (j in 0 until n) {
                          if (j == c) continue
                          val d = Math.abs(locations[c] - locations[j])
                          if (d <= f) total += ways[f - d][j]
                      }
                      ways[f][c] = total % modulus
                  }
              }
              return ways[fuel][start].toInt()
          }
        `,
        swift: code`
          func countRoutes(_ locations: [Int], _ start: Int, _ finish: Int, _ fuel: Int) -> Int {
              let modulus = 1000000007
              let n = locations.count
              var ways = [[Int]](repeating: [Int](repeating: 0, count: n), count: fuel + 1)
              for f in 0...fuel {
                  for c in 0..<n {
                      var total = c == finish ? 1 : 0
                      for j in 0..<n where j != c {
                          let d = abs(locations[c] - locations[j])
                          if d <= f { total += ways[f - d][j] }
                      }
                      ways[f][c] = total % modulus
                  }
              }
              return ways[fuel][start]
          }
        `,
        rust: code`
          fn countRoutes(locations: Vec<i32>, start: i32, finish: i32, fuel: i32) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let n = locations.len();
              let fuel = fuel as usize;
              let mut ways = vec![vec![0i64; n]; fuel + 1];
              for f in 0..=fuel {
                  for c in 0..n {
                      let mut total: i64 = if c == finish as usize { 1 } else { 0 };
                      for j in 0..n {
                          if j == c {
                              continue;
                          }
                          let d = (locations[c] as i64 - locations[j] as i64).abs() as usize;
                          if d <= f {
                              total += ways[f - d][j];
                          }
                      }
                      ways[f][c] = total % modulus;
                  }
              }
              ways[fuel][start as usize] as i32
          }
        `,
        php: code`
          function countRoutes($locations, $start, $finish, $fuel) {
              $modulus = 1000000007;
              $n = count($locations);
              $ways = array_fill(0, $fuel + 1, array_fill(0, $n, 0));
              for ($f = 0; $f <= $fuel; $f++) {
                  for ($c = 0; $c < $n; $c++) {
                      $total = $c == $finish ? 1 : 0;
                      for ($j = 0; $j < $n; $j++) {
                          if ($j == $c) continue;
                          $d = abs($locations[$c] - $locations[$j]);
                          if ($d <= $f) $total += $ways[$f - $d][$j];
                      }
                      $ways[$f][$c] = $total % $modulus;
                  }
              }
              return $ways[$fuel][$start];
          }
        `,
        ruby: code`
          def countRoutes(locations, start, finish, fuel)
            modulus = 1_000_000_007
            n = locations.length
            ways = Array.new(fuel + 1) { Array.new(n, 0) }
            (0..fuel).each do |f|
              n.times do |c|
                total = c == finish ? 1 : 0
                n.times do |j|
                  next if j == c
                  d = (locations[c] - locations[j]).abs
                  total += ways[f - d][j] if d <= f
                end
                ways[f][c] = total % modulus
              end
            end
            ways[fuel][start]
          end
        `,
      },
    };
  })(),

  // ── Number of Ways to Form a Target String Given a Dictionary (LC 1639) ─
  (() => {
    // Top-down over (next target character, first usable column), counting
    // matching characters per column directly.
    const ref = (words: string[], target: string) => {
      const MOD = 1000000007, m = words[0].length, t = target.length;
      const memo = new Map<number, number>();
      const go = (i: number, k: number): number => {
        if (i === t) return 1;
        if (k === m || m - k < t - i) return 0;
        const key = i * 2000 + k;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let c = 0;
        for (const w of words) if (w[k] === target[i]) c++;
        const v = (go(i, k + 1) + c * go(i + 1, k + 1)) % MOD;
        memo.set(key, v);
        return v;
      };
      return go(0, 0);
    };
    return {
      slug: "number-of-ways-to-form-a-target-string-given-a-dictionary",
      title: "Number of Ways to Form a Target String Given a Dictionary",
      difficulty: "HARD" as const,
      tags: ["Array", "String", "Dynamic Programming", "Google", "Amazon"],
      signature: {
        funcName: "numWays",
        params: [{ name: "words", type: "string[]" as const }, { name: "target", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given a list `words` of strings that all have the **same length**, and a string `target`. Build `target` one character at a time, from left to right, under these rules:\n\n" +
        "- To produce `target[i]`, pick the character at some index `k` of any word `words[j]`, provided `words[j][k] == target[i]`.\n" +
        "- Once index `k` of any word has been used, every index `x <= k` of **every** word becomes unusable for the rest of the process.\n" +
        "- You may take several characters from the same word, as long as the rules above hold.\n\n" +
        "Return the number of ways to build `target`, modulo `10^9 + 7`. Two ways differ when, for some `i`, `target[i]` came from a different word or a different index.",
        [
          { in: "words = [\"abc\",\"bca\"], target = \"ac\"", out: "2", note: "The `a` must be index 0 of `\"abc\"`; the `c` is then index 1 of `\"bca\"` or index 2 of `\"abc\"`." },
          { in: "words = [\"kai\",\"kia\",\"ika\"], target = \"ka\"", out: "8" },
          { in: "words = [\"ab\"], target = \"abc\"", out: "0", note: "The target is longer than the words." },
        ],
        [
          "1 <= words.length <= 1000",
          "1 <= words[i].length <= 1000",
          "all strings in words have the same length",
          "1 <= target.length <= 1000",
          "words[i] and target contain only lowercase English letters",
        ]),
      hints: [
        "The rule only cares about indices, not about which word: after using index `k`, everything continues from index `k + 1` in all words.",
        "So all that matters about column `k` is how many words have each letter there. Precompute `cnt[k][letter]`.",
        "Let `dp[i]` be the number of ways to have built `target[0..i)` using columns seen so far. For each column `k`, update `dp[i] += dp[i-1] · cnt[k][target[i-1]]` with `i` running downward (so each column is used at most once per way).",
      ],
      editorial: explain({
        idea: "The words only matter through their columns: the process picks a strictly increasing sequence of column indices, one per target character, and at each picked column it can choose any word with the right letter there. So the count is a sum over increasing index sequences of products of per-column letter counts — a knapsack-style DP over columns.",
        steps: [
          "Count `cnt[k][c]`, the number of words whose letter at index `k` is `c`.",
          "`dp[0] = 1` (the empty prefix), all other `dp[i] = 0`.",
          "For each column `k` from left to right, for `i` from `min(t, k + 1)` down to 1: `dp[i] = (dp[i] + dp[i-1] · cnt[k][target[i-1]]) mod (10^9 + 7)`.",
          "Return `dp[t]`.",
        ],
        why: "After processing columns `0..k`, `dp[i]` counts the ways to build the first `i` target characters using only those columns. For column `k`, a way either does not use it (the old `dp[i]`) or uses it for `target[i-1]`, after building `target[0..i-1)` from earlier columns (`dp[i-1]` before this column's update) times the number of words that offer that letter there. Iterating `i` downward guarantees the right-hand `dp[i-1]` is still the pre-column value.",
        time: "O(L · t + total letters), with L the word length and t the target length",
        space: "O(L · 26 + t)",
        pitfalls: [
          "Iterate `i` downward within a column, or a single column could be used twice.",
          "`dp[i-1] · cnt` can reach about 10^12 before the modulus — multiply in 64 bits.",
          "If the target is longer than the words, the answer is 0.",
        ],
      }),
      examples: [
        { input: "[\"abc\",\"bca\"]\n\"ac\"", expectedOutput: "2" },
        { input: "[\"kai\",\"kia\",\"ika\"]\n\"ka\"", expectedOutput: "8" },
        { input: "[\"ab\"]\n\"abc\"", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const len = pick(rng, [ri(rng, 1, 3), ri(rng, 2, 8), ri(rng, 6, 14)]);
        const count = pick(rng, [1, ri(rng, 1, 3), ri(rng, 2, 8)]);
        const alphabet = pick(rng, ["ab", "abc", "abcd", "aab", "codekairo"]);
        const words = Array.from({ length: count }, () => randLower(rng, len, len, alphabet));
        const tlen = rng() < 0.1 ? ri(rng, len, len + 2) : ri(rng, 1, Math.max(1, Math.min(len, 8)));
        const target = randLower(rng, tlen, tlen, alphabet);
        return { input: `${fmtStrArr(words)}\n${JSON.stringify(target)}`, expectedOutput: String(ref(words, target)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numWays(words: List[str], target: str) -> int:
              MOD = 10 ** 9 + 7
              m, t = len(words[0]), len(target)
              cnt = [[0] * 26 for _ in range(m)]
              for w in words:
                  for k, ch in enumerate(w):
                      cnt[k][ord(ch) - 97] += 1
              dp = [0] * (t + 1)
              dp[0] = 1
              for k in range(m):
                  for i in range(min(t, k + 1), 0, -1):
                      c = cnt[k][ord(target[i - 1]) - 97]
                      if c:
                          dp[i] = (dp[i] + dp[i - 1] * c) % MOD
              return dp[t]
        `,
        javascript: code`
          var numWays = function(words, target) {
              var MOD = 1000000007, m = words[0].length, t = target.length;
              var cnt = [];
              for (var k = 0; k < m; k++) cnt.push(new Array(26).fill(0));
              for (var w = 0; w < words.length; w++) {
                  for (var k = 0; k < m; k++) cnt[k][words[w].charCodeAt(k) - 97]++;
              }
              var dp = new Array(t + 1).fill(0);
              dp[0] = 1;
              for (var k = 0; k < m; k++) {
                  for (var i = Math.min(t, k + 1); i >= 1; i--) {
                      var c = cnt[k][target.charCodeAt(i - 1) - 97];
                      if (c) dp[i] = (dp[i] + dp[i - 1] * c) % MOD;
                  }
              }
              return dp[t];
          };
        `,
        typescript: code`
          function numWays(words: string[], target: string): number {
              var MOD = 1000000007, m = words[0].length, t = target.length;
              var cnt: number[][] = [];
              for (var k = 0; k < m; k++) {
                  var row: number[] = [];
                  for (var c = 0; c < 26; c++) row.push(0);
                  cnt.push(row);
              }
              for (var w = 0; w < words.length; w++) {
                  for (var k = 0; k < m; k++) cnt[k][words[w].charCodeAt(k) - 97]++;
              }
              var dp: number[] = [1];
              for (var i = 1; i <= t; i++) dp.push(0);
              for (var k = 0; k < m; k++) {
                  for (var i = Math.min(t, k + 1); i >= 1; i--) {
                      var c = cnt[k][target.charCodeAt(i - 1) - 97];
                      if (c) dp[i] = (dp[i] + dp[i - 1] * c) % MOD;
                  }
              }
              return dp[t];
          }
        `,
        java: code`
          public static int numWays(String[] words, String target) {
              final long MOD = 1000000007L;
              int m = words[0].length(), t = target.length();
              int[][] cnt = new int[m][26];
              for (String w : words) for (int k = 0; k < m; k++) cnt[k][w.charAt(k) - 'a']++;
              long[] dp = new long[t + 1];
              dp[0] = 1;
              for (int k = 0; k < m; k++) {
                  for (int i = Math.min(t, k + 1); i >= 1; i--) {
                      int c = cnt[k][target.charAt(i - 1) - 'a'];
                      if (c > 0) dp[i] = (dp[i] + dp[i - 1] * c) % MOD;
                  }
              }
              return (int) dp[t];
          }
        `,
        cpp: code`
          int numWays(vector<string>& words, string target) {
              const long long MOD = 1000000007LL;
              int m = words[0].size(), t = target.size();
              vector<array<int, 26>> cnt(m);
              for (auto& row : cnt) row.fill(0);
              for (auto& w : words) for (int k = 0; k < m; k++) cnt[k][w[k] - 'a']++;
              vector<long long> dp(t + 1, 0);
              dp[0] = 1;
              for (int k = 0; k < m; k++) {
                  for (int i = min(t, k + 1); i >= 1; i--) {
                      int c = cnt[k][target[i - 1] - 'a'];
                      if (c > 0) dp[i] = (dp[i] + dp[i - 1] * c) % MOD;
                  }
              }
              return (int)dp[t];
          }
        `,
        c: code`
          int numWays(char** words, int wordsSize, const char* target) {
              const long long MOD = 1000000007LL;
              int m = (int)strlen(words[0]), t = (int)strlen(target);
              int* cnt = (int*)calloc((size_t)m * 26, sizeof(int));
              for (int w = 0; w < wordsSize; w++) {
                  for (int k = 0; k < m; k++) cnt[k * 26 + (words[w][k] - 'a')]++;
              }
              long long* dp = (long long*)calloc(t + 1, sizeof(long long));
              dp[0] = 1;
              for (int k = 0; k < m; k++) {
                  int top = t < k + 1 ? t : k + 1;
                  for (int i = top; i >= 1; i--) {
                      int c = cnt[k * 26 + (target[i - 1] - 'a')];
                      if (c > 0) dp[i] = (dp[i] + dp[i - 1] * c) % MOD;
                  }
              }
              int ans = (int)dp[t];
              free(cnt);
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int NumWays(string[] words, string target)
          {
              const long MOD = 1000000007L;
              int m = words[0].Length, t = target.Length;
              int[,] cnt = new int[m, 26];
              foreach (string w in words) for (int k = 0; k < m; k++) cnt[k, w[k] - 'a']++;
              long[] dp = new long[t + 1];
              dp[0] = 1;
              for (int k = 0; k < m; k++)
              {
                  for (int i = Math.Min(t, k + 1); i >= 1; i--)
                  {
                      int c = cnt[k, target[i - 1] - 'a'];
                      if (c > 0) dp[i] = (dp[i] + dp[i - 1] * c) % MOD;
                  }
              }
              return (int)dp[t];
          }
        `,
        go: code`
          func numWays(words []string, target string) int {
              const mod = 1000000007
              m, t := len(words[0]), len(target)
              cnt := make([][26]int, m)
              for _, w := range words {
                  for k := 0; k < m; k++ {
                      cnt[k][w[k]-'a']++
                  }
              }
              dp := make([]int, t+1)
              dp[0] = 1
              for k := 0; k < m; k++ {
                  top := k + 1
                  if t < top {
                      top = t
                  }
                  for i := top; i >= 1; i-- {
                      c := cnt[k][target[i-1]-'a']
                      if c > 0 {
                          dp[i] = (dp[i] + dp[i-1]*c) % mod
                      }
                  }
              }
              return dp[t]
          }
        `,
        kotlin: code`
          fun numWays(words: Array<String>, target: String): Int {
              val modulus = 1000000007L
              val m = words[0].length
              val t = target.length
              val cnt = Array(m) { IntArray(26) }
              for (w in words) for (k in 0 until m) cnt[k][w[k] - 'a']++
              val dp = LongArray(t + 1)
              dp[0] = 1L
              for (k in 0 until m) {
                  for (i in minOf(t, k + 1) downTo 1) {
                      val c = cnt[k][target[i - 1] - 'a']
                      if (c > 0) dp[i] = (dp[i] + dp[i - 1] * c) % modulus
                  }
              }
              return dp[t].toInt()
          }
        `,
        swift: code`
          func numWays(_ words: [String], _ target: String) -> Int {
              let modulus = 1000000007
              let rows = words.map { $0.unicodeScalars.map { Int($0.value) - 97 } }
              let goal = target.unicodeScalars.map { Int($0.value) - 97 }
              let m = rows[0].count, t = goal.count
              var cnt = [[Int]](repeating: [Int](repeating: 0, count: 26), count: m)
              for w in rows { for k in 0..<m { cnt[k][w[k]] += 1 } }
              var dp = [Int](repeating: 0, count: t + 1)
              dp[0] = 1
              for k in 0..<m {
                  var i = min(t, k + 1)
                  while i >= 1 {
                      let c = cnt[k][goal[i - 1]]
                      if c > 0 { dp[i] = (dp[i] + dp[i - 1] * c) % modulus }
                      i -= 1
                  }
              }
              return dp[t]
          }
        `,
        rust: code`
          fn numWays(words: Vec<String>, target: String) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let m = words[0].len();
              let tb = target.as_bytes();
              let t = tb.len();
              let mut cnt = vec![[0i64; 26]; m];
              for w in words.iter() {
                  let b = w.as_bytes();
                  for k in 0..m {
                      cnt[k][(b[k] - b'a') as usize] += 1;
                  }
              }
              let mut dp = vec![0i64; t + 1];
              dp[0] = 1;
              for k in 0..m {
                  let top = std::cmp::min(t, k + 1);
                  for i in (1..=top).rev() {
                      let c = cnt[k][(tb[i - 1] - b'a') as usize];
                      if c > 0 {
                          dp[i] = (dp[i] + dp[i - 1] * c) % modulus;
                      }
                  }
              }
              dp[t] as i32
          }
        `,
        php: code`
          function numWays($words, $target) {
              $modulus = 1000000007;
              $m = strlen($words[0]);
              $t = strlen($target);
              $cnt = array_fill(0, $m, array_fill(0, 26, 0));
              foreach ($words as $w) {
                  for ($k = 0; $k < $m; $k++) $cnt[$k][ord($w[$k]) - 97]++;
              }
              $dp = array_fill(0, $t + 1, 0);
              $dp[0] = 1;
              for ($k = 0; $k < $m; $k++) {
                  for ($i = min($t, $k + 1); $i >= 1; $i--) {
                      $c = $cnt[$k][ord($target[$i - 1]) - 97];
                      if ($c > 0) $dp[$i] = ($dp[$i] + $dp[$i - 1] * $c) % $modulus;
                  }
              }
              return $dp[$t];
          }
        `,
        ruby: code`
          def numWays(words, target)
            modulus = 1_000_000_007
            m = words[0].length
            t = target.length
            cnt = Array.new(m) { Array.new(26, 0) }
            words.each do |w|
              m.times { |k| cnt[k][w[k].ord - 97] += 1 }
            end
            dp = Array.new(t + 1, 0)
            dp[0] = 1
            m.times do |k|
              [t, k + 1].min.downto(1) do |i|
                c = cnt[k][target[i - 1].ord - 97]
                dp[i] = (dp[i] + dp[i - 1] * c) % modulus if c > 0
              end
            end
            dp[t]
          end
        `,
      },
    };
  })(),

  // ── Maximize Palindrome Length From Subsequences (LC 1771) ──────
  (() => {
    // Small inputs: every pair of non-empty subsequences, concatenated and
    // checked. Larger ones: top-down longest-palindromic-subsequence over the
    // joined string, maximised over outer pairs that straddle the seam.
    const brute = (w1: string, w2: string) => {
      const subs = (w: string) => {
        const out: string[] = [];
        for (let mask = 1; mask < 1 << w.length; mask++) {
          let s = "";
          for (let i = 0; i < w.length; i++) if (mask & (1 << i)) s += w[i];
          out.push(s);
        }
        return out;
      };
      const a = subs(w1), b = subs(w2);
      let best = 0;
      for (const x of a) {
        for (const y of b) {
          const s = x + y;
          if (s.length <= best) continue;
          let ok = true;
          for (let i = 0, j = s.length - 1; i < j; i++, j--) if (s[i] !== s[j]) { ok = false; break; }
          if (ok) best = s.length;
        }
      }
      return best;
    };
    const topDown = (w1: string, w2: string) => {
      const s = w1 + w2, n = s.length, n1 = w1.length;
      const memo = new Map<number, number>();
      const lps = (i: number, j: number): number => {
        if (i > j) return 0;
        if (i === j) return 1;
        const key = i * 4096 + j;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        const v = s[i] === s[j] ? 2 + lps(i + 1, j - 1) : Math.max(lps(i + 1, j), lps(i, j - 1));
        memo.set(key, v);
        return v;
      };
      let best = 0;
      for (let i = 0; i < n1; i++) for (let j = n1; j < n; j++) if (s[i] === s[j]) best = Math.max(best, 2 + lps(i + 1, j - 1));
      return best;
    };
    const ref = (w1: string, w2: string) => (w1.length + w2.length <= 10 ? brute(w1, w2) : topDown(w1, w2));
    return {
      slug: "maximize-palindrome-length-from-subsequences",
      title: "Maximize Palindrome Length From Subsequences",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Google", "Amazon"],
      signature: {
        funcName: "longestPalindrome",
        params: [{ name: "word1", type: "string" as const }, { name: "word2", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two strings `word1` and `word2`. Build a string as follows: choose a **non-empty** subsequence `sub1` of `word1` and a **non-empty** subsequence `sub2` of `word2`, then concatenate them as `sub1 + sub2`.\n\n" +
        "Return the length of the longest **palindrome** that can be built this way. If no palindrome can be built, return `0`.\n\n" +
        "A subsequence keeps the original order of the characters it uses but may skip any of them; a palindrome reads the same forwards and backwards.",
        [
          { in: "word1 = \"code\", word2 = \"kairo\"", out: "3", note: "Take `\"od\"` from `word1` and `\"o\"` from `word2` to get `\"odo\"`. The only letter both words share is `o`." },
          { in: "word1 = \"abc\", word2 = \"cba\"", out: "6", note: "Use both words whole: `\"abccba\"`." },
          { in: "word1 = \"aa\", word2 = \"bb\"", out: "0", note: "A palindrome would need its first character (from `word1`) to equal its last (from `word2`)." },
        ],
        ["1 <= word1.length, word2.length <= 1000", "word1 and word2 consist of lowercase English letters"]),
      hints: [
        "Join the words: `s = word1 + word2`. Any built string is a subsequence of `s` that uses at least one character on each side of the seam.",
        "In a palindrome the first and last characters match. Here the first comes from `word1` and the last from `word2` — so the outermost matched pair must straddle the seam.",
        "Compute the longest palindromic subsequence table `dp[i][j]` of `s`. Whenever `s[i] == s[j]` with `i` in `word1` and `j` in `word2`, `dp[i][j] = dp[i+1][j-1] + 2` is a candidate; take the maximum.",
      ],
      editorial: explain({
        idea: "A palindrome built from `sub1 + sub2` is a palindromic subsequence of `s = word1 + word2` whose first character lies in `word1` and whose last lies in `word2` — and those two characters are equal. So run the standard longest-palindromic-subsequence DP on `s` and only accept answers whose outer pair crosses the seam.",
        steps: [
          "Let `s = word1 + word2` and `n1 = len(word1)`.",
          "Fill `dp[i][j]`, the longest palindromic subsequence of `s[i..j]`, for `i` from the end down and `j` upward: `dp[i][i] = 1`; if `s[i] == s[j]` then `dp[i][j] = dp[i+1][j-1] + 2`, else `max(dp[i+1][j], dp[i][j-1])`.",
          "Whenever `s[i] == s[j]` with `i < n1 <= j`, update the answer with `dp[i][j]`.",
          "Return the answer (0 if no such pair exists).",
        ],
        why: "If a valid palindrome exists, its outermost characters are equal, sit at some `i < n1 <= j`, and the inside is a palindromic subsequence of `s[i+1..j-1]`, so its length is at most `dp[i+1][j-1] + 2`. Conversely, for any such equal pair, the pair plus a longest palindromic subsequence of the inside is a valid build — the outer characters guarantee both parts are non-empty, and the inside may use either word freely. So the maximum over straddling equal pairs is exactly the answer.",
        time: "O((m + n)^2)",
        space: "O((m + n)^2)",
        pitfalls: [
          "Taking the longest palindromic subsequence of `s` overall is wrong — it may lie entirely inside one word.",
          "Only pairs with `s[i] == s[j]` may be the outer pair; a `max(...)` entry is not anchored at `i` and `j`.",
          "If no letter occurs in both words, the answer is 0.",
        ],
      }),
      examples: [
        { input: "\"code\"\n\"kairo\"", expectedOutput: "3" },
        { input: "\"abc\"\n\"cba\"", expectedOutput: "6" },
        { input: "\"aa\"\n\"bb\"", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alphabet = pick(rng, ["ab", "abc", "abcd", "codekairo", "abcdefghijklmnopqrstuvwxyz"]);
        let w1: string, w2: string;
        if (rng() < 0.7) {
          w1 = randLower(rng, 1, 5, alphabet);
          w2 = randLower(rng, 1, 5, alphabet);
        } else {
          w1 = randLower(rng, 1, 25, alphabet);
          w2 = randLower(rng, 1, 25, alphabet);
        }
        return { input: `${JSON.stringify(w1)}\n${JSON.stringify(w2)}`, expectedOutput: String(ref(w1, w2)) };
      },
      solutions: {
        python: code`
          def longestPalindrome(word1: str, word2: str) -> int:
              s = word1 + word2
              n, n1 = len(s), len(word1)
              dp = [[0] * n for _ in range(n)]
              best = 0
              for i in range(n - 1, -1, -1):
                  dp[i][i] = 1
                  for j in range(i + 1, n):
                      if s[i] == s[j]:
                          dp[i][j] = dp[i + 1][j - 1] + 2
                          if i < n1 <= j and dp[i][j] > best:
                              best = dp[i][j]
                      else:
                          dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
              return best
        `,
        javascript: code`
          var longestPalindrome = function(word1, word2) {
              var s = word1 + word2, n = s.length, n1 = word1.length;
              var dp = [];
              for (var i = 0; i < n; i++) dp.push(new Array(n).fill(0));
              var best = 0;
              for (var i = n - 1; i >= 0; i--) {
                  dp[i][i] = 1;
                  for (var j = i + 1; j < n; j++) {
                      if (s[i] === s[j]) {
                          dp[i][j] = dp[i + 1][j - 1] + 2;
                          if (i < n1 && j >= n1 && dp[i][j] > best) best = dp[i][j];
                      } else {
                          dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
                      }
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function longestPalindrome(word1: string, word2: string): number {
              var s = word1 + word2, n = s.length, n1 = word1.length;
              var dp: number[][] = [];
              for (var i = 0; i < n; i++) {
                  var row: number[] = [];
                  for (var j = 0; j < n; j++) row.push(0);
                  dp.push(row);
              }
              var best = 0;
              for (var i = n - 1; i >= 0; i--) {
                  dp[i][i] = 1;
                  for (var j = i + 1; j < n; j++) {
                      if (s.charAt(i) === s.charAt(j)) {
                          dp[i][j] = dp[i + 1][j - 1] + 2;
                          if (i < n1 && j >= n1 && dp[i][j] > best) best = dp[i][j];
                      } else {
                          dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
                      }
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int longestPalindrome(String word1, String word2) {
              String s = word1 + word2;
              int n = s.length(), n1 = word1.length();
              int[][] dp = new int[n][n];
              int best = 0;
              for (int i = n - 1; i >= 0; i--) {
                  dp[i][i] = 1;
                  for (int j = i + 1; j < n; j++) {
                      if (s.charAt(i) == s.charAt(j)) {
                          dp[i][j] = dp[i + 1][j - 1] + 2;
                          if (i < n1 && j >= n1 && dp[i][j] > best) best = dp[i][j];
                      } else {
                          dp[i][j] = Math.max(dp[i + 1][j], dp[i][j - 1]);
                      }
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int longestPalindrome(string word1, string word2) {
              string s = word1 + word2;
              int n = s.size(), n1 = word1.size();
              vector<vector<int>> dp(n, vector<int>(n, 0));
              int best = 0;
              for (int i = n - 1; i >= 0; i--) {
                  dp[i][i] = 1;
                  for (int j = i + 1; j < n; j++) {
                      if (s[i] == s[j]) {
                          dp[i][j] = dp[i + 1][j - 1] + 2;
                          if (i < n1 && j >= n1 && dp[i][j] > best) best = dp[i][j];
                      } else {
                          dp[i][j] = max(dp[i + 1][j], dp[i][j - 1]);
                      }
                  }
              }
              return best;
          }
        `,
        c: code`
          int longestPalindrome(const char* word1, const char* word2) {
              int n1 = (int)strlen(word1), n2 = (int)strlen(word2), n = n1 + n2;
              char* s = (char*)malloc(n + 1);
              memcpy(s, word1, n1);
              memcpy(s + n1, word2, n2);
              s[n] = 0;
              int* dp = (int*)calloc((size_t)n * n, sizeof(int));
              int best = 0;
              for (int i = n - 1; i >= 0; i--) {
                  dp[i * n + i] = 1;
                  for (int j = i + 1; j < n; j++) {
                      if (s[i] == s[j]) {
                          dp[i * n + j] = dp[(i + 1) * n + j - 1] + 2;
                          if (i < n1 && j >= n1 && dp[i * n + j] > best) best = dp[i * n + j];
                      } else {
                          int a = dp[(i + 1) * n + j], b = dp[i * n + j - 1];
                          dp[i * n + j] = a > b ? a : b;
                      }
                  }
              }
              free(s);
              free(dp);
              return best;
          }
        `,
        csharp: code`
          public static int LongestPalindrome(string word1, string word2)
          {
              string s = word1 + word2;
              int n = s.Length, n1 = word1.Length;
              int[,] dp = new int[n, n];
              int best = 0;
              for (int i = n - 1; i >= 0; i--)
              {
                  dp[i, i] = 1;
                  for (int j = i + 1; j < n; j++)
                  {
                      if (s[i] == s[j])
                      {
                          dp[i, j] = dp[i + 1, j - 1] + 2;
                          if (i < n1 && j >= n1 && dp[i, j] > best) best = dp[i, j];
                      }
                      else
                      {
                          dp[i, j] = Math.Max(dp[i + 1, j], dp[i, j - 1]);
                      }
                  }
              }
              return best;
          }
        `,
        go: code`
          func longestPalindrome(word1 string, word2 string) int {
              s := word1 + word2
              n, n1 := len(s), len(word1)
              dp := make([][]int, n)
              for i := range dp {
                  dp[i] = make([]int, n)
              }
              best := 0
              for i := n - 1; i >= 0; i-- {
                  dp[i][i] = 1
                  for j := i + 1; j < n; j++ {
                      if s[i] == s[j] {
                          dp[i][j] = dp[i+1][j-1] + 2
                          if i < n1 && j >= n1 && dp[i][j] > best {
                              best = dp[i][j]
                          }
                      } else if dp[i+1][j] > dp[i][j-1] {
                          dp[i][j] = dp[i+1][j]
                      } else {
                          dp[i][j] = dp[i][j-1]
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun longestPalindrome(word1: String, word2: String): Int {
              val s = word1 + word2
              val n = s.length
              val n1 = word1.length
              val dp = Array(n) { IntArray(n) }
              var best = 0
              for (i in n - 1 downTo 0) {
                  dp[i][i] = 1
                  for (j in i + 1 until n) {
                      if (s[i] == s[j]) {
                          dp[i][j] = dp[i + 1][j - 1] + 2
                          if (i < n1 && j >= n1 && dp[i][j] > best) best = dp[i][j]
                      } else {
                          dp[i][j] = maxOf(dp[i + 1][j], dp[i][j - 1])
                      }
                  }
              }
              return best
          }
        `,
        swift: code`
          func longestPalindrome(_ word1: String, _ word2: String) -> Int {
              let s = Array(word1.utf8) + Array(word2.utf8)
              let n = s.count, n1 = word1.utf8.count
              var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)
              var best = 0
              for i in stride(from: n - 1, through: 0, by: -1) {
                  dp[i][i] = 1
                  var j = i + 1
                  while j < n {
                      if s[i] == s[j] {
                          dp[i][j] = dp[i + 1][j - 1] + 2
                          if i < n1 && j >= n1 && dp[i][j] > best { best = dp[i][j] }
                      } else {
                          dp[i][j] = max(dp[i + 1][j], dp[i][j - 1])
                      }
                      j += 1
                  }
              }
              return best
          }
        `,
        rust: code`
          fn longestPalindrome(word1: String, word2: String) -> i32 {
              let n1 = word1.len();
              let s: Vec<u8> = word1.bytes().chain(word2.bytes()).collect();
              let n = s.len();
              let mut dp = vec![vec![0i32; n]; n];
              let mut best = 0;
              for i in (0..n).rev() {
                  dp[i][i] = 1;
                  for j in (i + 1)..n {
                      if s[i] == s[j] {
                          dp[i][j] = dp[i + 1][j - 1] + 2;
                          if i < n1 && j >= n1 && dp[i][j] > best {
                              best = dp[i][j];
                          }
                      } else {
                          dp[i][j] = std::cmp::max(dp[i + 1][j], dp[i][j - 1]);
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function longestPalindrome($word1, $word2) {
              $s = $word1 . $word2;
              $n = strlen($s);
              $n1 = strlen($word1);
              $dp = array_fill(0, $n, array_fill(0, $n, 0));
              $best = 0;
              for ($i = $n - 1; $i >= 0; $i--) {
                  $dp[$i][$i] = 1;
                  for ($j = $i + 1; $j < $n; $j++) {
                      if ($s[$i] === $s[$j]) {
                          $dp[$i][$j] = $dp[$i + 1][$j - 1] + 2;
                          if ($i < $n1 && $j >= $n1 && $dp[$i][$j] > $best) $best = $dp[$i][$j];
                      } else {
                          $dp[$i][$j] = max($dp[$i + 1][$j], $dp[$i][$j - 1]);
                      }
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def longestPalindrome(word1, word2)
            s = word1 + word2
            n = s.length
            n1 = word1.length
            dp = Array.new(n) { Array.new(n, 0) }
            best = 0
            (n - 1).downto(0) do |i|
              dp[i][i] = 1
              ((i + 1)...n).each do |j|
                if s[i] == s[j]
                  dp[i][j] = dp[i + 1][j - 1] + 2
                  best = dp[i][j] if i < n1 && j >= n1 && dp[i][j] > best
                else
                  dp[i][j] = [dp[i + 1][j], dp[i][j - 1]].max
                end
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Minimum Skips to Arrive at Meeting On Time (LC 1883) ────────
  (() => {
    // Every subset of rests to skip, simulated exactly in units of 1/speed
    // hours (so "the next integer hour" is the next multiple of speed).
    const ref = (dist: number[], speed: number, hoursBefore: number) => {
      const n = dist.length;
      const limit = hoursBefore * speed;
      let best = -1;
      for (let mask = 0; mask < 1 << Math.max(0, n - 1); mask++) {
        let skips = 0;
        for (let b = mask; b; b &= b - 1) skips++;
        if (best !== -1 && skips >= best) continue;
        let t = 0;
        for (let i = 0; i < n; i++) {
          t += dist[i];
          if (i < n - 1 && !(mask & (1 << i))) t = Math.ceil(t / speed) * speed;
        }
        if (t <= limit) best = skips;
      }
      return best;
    };
    return {
      slug: "minimum-skips-to-arrive-at-meeting-on-time",
      title: "Minimum Skips to Arrive at Meeting On Time",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Google", "Amazon"],
      signature: {
        funcName: "minSkips",
        params: [
          { name: "dist", type: "int[]" as const },
          { name: "speed", type: "int" as const },
          { name: "hoursBefore", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "You have `hoursBefore` hours to reach a meeting, and the way there is `n` roads driven in order; road `i` is `dist[i]` kilometres long. You always drive at `speed` km/h.\n\n" +
        "After each road you must **rest** until the next whole hour before starting the next road. For example, if a road ends 1.4 hours after you set off, you wait until hour 2; if it ends exactly at hour 2, there is no wait. No rest is needed after the last road, since you have arrived.\n\n" +
        "To save time you may **skip** some rests and start the next road immediately. Return the minimum number of skips needed to arrive at the meeting on time (arriving exactly at hour `hoursBefore` counts), or `-1` if that is impossible.",
        [
          { in: "dist = [3,1,2], speed = 4, hoursBefore = 2", out: "1", note: "Without skips you arrive at 2.5 hours. Skip the first rest: 0.75 + 0.25 = 1.0 hours, no wait, then 1.0 + 0.5 = 1.5 hours." },
          { in: "dist = [2,3,1], speed = 3, hoursBefore = 2", out: "2", note: "The roads need exactly 2 hours of driving, so no waiting at all is affordable." },
          { in: "dist = [5,5], speed = 2, hoursBefore = 4", out: "-1", note: "Driving alone takes 5 hours." },
        ],
        ["n == dist.length", "1 <= n <= 1000", "1 <= dist[i] <= 10^5", "1 <= speed <= 10^6", "1 <= hoursBefore <= 10^7"]),
      hints: [
        "Greedy choices of which rests to skip go wrong; think about the best arrival time after `i` roads having used exactly `j` skips.",
        "Fractions of hours invite floating-point errors. Measure time in units of `1 / speed` hours instead: road `i` then takes exactly `dist[i]` units, and 'the next whole hour' is the next multiple of `speed`.",
        "`dp[j]` = the earliest time (in those units) after the current road with `j` skips. Resting rounds `t + dist[i]` up to a multiple of `speed`; skipping keeps `t + dist[i]` and uses one more skip. Answer: the smallest `j` with `dp[j] + dist[n-1] <= hoursBefore · speed`.",
      ],
      editorial: explain({
        idea: "With a fixed number of skips, finishing a prefix of roads earlier is never worse, so `dp[i][j]` = the earliest finishing time of the first `i` roads with `j` skips is an optimal-substructure state. Scaling time by `speed` turns every quantity into an integer and the rest rule into 'round up to a multiple of `speed`'.",
        steps: [
          "Work in units of `1 / speed` hours: road `i` takes `dist[i]` units and the deadline is `hoursBefore · speed` units (use 64-bit integers).",
          "`dp[0] = 0`, all other entries infinite.",
          "For every road `i` except the last, build `next`: from each finite `dp[j]`, let `t = dp[j] + dist[i]`; resting gives `next[j] = min(next[j], ceil(t / speed) · speed)`; skipping gives `next[j+1] = min(next[j+1], t)`.",
          "Finally, return the smallest `j` with `dp[j] + dist[n-1] <= hoursBefore · speed`, or `-1` if there is none.",
        ],
        why: "Among plans that cover the first `i` roads with exactly `j` skips, the one that finishes earliest dominates: rounding up to the next hour is monotone, so starting the remaining roads earlier can only make every later time earlier or equal. So keeping the minimum per `(i, j)` loses nothing, and the two transitions cover the only decision after each road. Integer units make the rounding exact — no floating-point comparison can misjudge a time that lands exactly on an hour.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "Floating-point times such as 1/3 + 2/3 can come out as 0.999… or 1.000…1 and wrongly add or skip an hour of waiting — use integer units.",
          "No rest after the last road: add the final road without rounding.",
          "`hoursBefore · speed` can reach 10^13 — compute it in 64 bits.",
        ],
      }),
      examples: [
        { input: "[3,1,2]\n4\n2", expectedOutput: "1" },
        { input: "[2,3,1]\n3\n2", expectedOutput: "2" },
        { input: "[5,5]\n2\n4", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.05 ? ri(rng, 11, 14) : pick(rng, [ri(rng, 1, 3), ri(rng, 2, 10)]);
        const speed = pick(rng, [ri(rng, 1, 10), ri(rng, 1, 1000), ri(rng, 1, 1000000)]);
        const dmax = pick(rng, [10, 100, 100000]);
        const dist = Array.from({ length: n }, () => ri(rng, 1, dmax));
        let sum = 0;
        for (const d of dist) sum += d;
        let t = 0;
        for (let i = 0; i < n; i++) {
          t += dist[i];
          if (i < n - 1) t = Math.ceil(t / speed) * speed;
        }
        const lo = Math.max(1, Math.floor(sum / speed) - 1);
        const hi = Math.max(lo, Math.ceil(t / speed) + 1);
        const hoursBefore = Math.min(10000000, ri(rng, lo, hi));
        return { input: `${fmtIntArr(dist)}\n${speed}\n${hoursBefore}`, expectedOutput: String(ref(dist, speed, hoursBefore)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minSkips(dist: List[int], speed: int, hoursBefore: int) -> int:
              n = len(dist)
              INF = float('inf')
              dp = [INF] * (n + 1)
              dp[0] = 0
              for i in range(n - 1):
                  nd = [INF] * (n + 1)
                  for j in range(i + 1):
                      if dp[j] == INF:
                          continue
                      t = dp[j] + dist[i]
                      rested = (t + speed - 1) // speed * speed
                      if rested < nd[j]:
                          nd[j] = rested
                      if t < nd[j + 1]:
                          nd[j + 1] = t
                  dp = nd
              limit = hoursBefore * speed
              for j in range(n):
                  if dp[j] != INF and dp[j] + dist[n - 1] <= limit:
                      return j
              return -1
        `,
        javascript: code`
          var minSkips = function(dist, speed, hoursBefore) {
              var n = dist.length, INF = Infinity;
              var dp = new Array(n + 1).fill(INF);
              dp[0] = 0;
              for (var i = 0; i < n - 1; i++) {
                  var nd = new Array(n + 1).fill(INF);
                  for (var j = 0; j <= i; j++) {
                      if (dp[j] === INF) continue;
                      var t = dp[j] + dist[i];
                      var rested = Math.floor((t + speed - 1) / speed) * speed;
                      if (rested < nd[j]) nd[j] = rested;
                      if (t < nd[j + 1]) nd[j + 1] = t;
                  }
                  dp = nd;
              }
              var limit = hoursBefore * speed;
              for (var j = 0; j < n; j++) {
                  if (dp[j] !== INF && dp[j] + dist[n - 1] <= limit) return j;
              }
              return -1;
          };
        `,
        typescript: code`
          function minSkips(dist: number[], speed: number, hoursBefore: number): number {
              var n = dist.length, INF = 1e18;
              var dp: number[] = [];
              for (var j = 0; j <= n; j++) dp.push(INF);
              dp[0] = 0;
              for (var i = 0; i < n - 1; i++) {
                  var nd: number[] = [];
                  for (var j = 0; j <= n; j++) nd.push(INF);
                  for (var j = 0; j <= i; j++) {
                      if (dp[j] === INF) continue;
                      var t = dp[j] + dist[i];
                      var rested = Math.floor((t + speed - 1) / speed) * speed;
                      if (rested < nd[j]) nd[j] = rested;
                      if (t < nd[j + 1]) nd[j + 1] = t;
                  }
                  dp = nd;
              }
              var limit = hoursBefore * speed;
              for (var j = 0; j < n; j++) {
                  if (dp[j] !== INF && dp[j] + dist[n - 1] <= limit) return j;
              }
              return -1;
          }
        `,
        java: code`
          public static int minSkips(int[] dist, int speed, int hoursBefore) {
              int n = dist.length;
              final long INF = Long.MAX_VALUE / 4;
              long[] dp = new long[n + 1];
              Arrays.fill(dp, INF);
              dp[0] = 0;
              for (int i = 0; i < n - 1; i++) {
                  long[] nd = new long[n + 1];
                  Arrays.fill(nd, INF);
                  for (int j = 0; j <= i; j++) {
                      if (dp[j] == INF) continue;
                      long t = dp[j] + dist[i];
                      long rested = (t + speed - 1) / speed * speed;
                      if (rested < nd[j]) nd[j] = rested;
                      if (t < nd[j + 1]) nd[j + 1] = t;
                  }
                  dp = nd;
              }
              long limit = (long) hoursBefore * speed;
              for (int j = 0; j < n; j++) {
                  if (dp[j] != INF && dp[j] + dist[n - 1] <= limit) return j;
              }
              return -1;
          }
        `,
        cpp: code`
          int minSkips(vector<int>& dist, int speed, int hoursBefore) {
              int n = dist.size();
              const long long INF = LLONG_MAX / 4;
              vector<long long> dp(n + 1, INF);
              dp[0] = 0;
              for (int i = 0; i < n - 1; i++) {
                  vector<long long> nd(n + 1, INF);
                  for (int j = 0; j <= i; j++) {
                      if (dp[j] == INF) continue;
                      long long t = dp[j] + dist[i];
                      long long rested = (t + speed - 1) / speed * speed;
                      nd[j] = min(nd[j], rested);
                      nd[j + 1] = min(nd[j + 1], t);
                  }
                  dp = nd;
              }
              long long limit = (long long)hoursBefore * speed;
              for (int j = 0; j < n; j++) {
                  if (dp[j] != INF && dp[j] + dist[n - 1] <= limit) return j;
              }
              return -1;
          }
        `,
        c: code`
          int minSkips(int* dist, int distSize, int speed, int hoursBefore) {
              int n = distSize;
              const long long INF = 4000000000000000000LL;
              long long* dp = (long long*)malloc(sizeof(long long) * (n + 1));
              long long* nd = (long long*)malloc(sizeof(long long) * (n + 1));
              for (int j = 0; j <= n; j++) dp[j] = INF;
              dp[0] = 0;
              for (int i = 0; i < n - 1; i++) {
                  for (int j = 0; j <= n; j++) nd[j] = INF;
                  for (int j = 0; j <= i; j++) {
                      if (dp[j] == INF) continue;
                      long long t = dp[j] + dist[i];
                      long long rested = (t + speed - 1) / speed * speed;
                      if (rested < nd[j]) nd[j] = rested;
                      if (t < nd[j + 1]) nd[j + 1] = t;
                  }
                  long long* tmp = dp;
                  dp = nd;
                  nd = tmp;
              }
              long long limit = (long long)hoursBefore * speed;
              int ans = -1;
              for (int j = 0; j < n; j++) {
                  if (dp[j] != INF && dp[j] + dist[n - 1] <= limit) {
                      ans = j;
                      break;
                  }
              }
              free(dp);
              free(nd);
              return ans;
          }
        `,
        csharp: code`
          public static int MinSkips(int[] dist, int speed, int hoursBefore)
          {
              int n = dist.Length;
              const long INF = long.MaxValue / 4;
              long[] dp = Enumerable.Repeat(INF, n + 1).ToArray();
              dp[0] = 0;
              for (int i = 0; i < n - 1; i++)
              {
                  long[] nd = Enumerable.Repeat(INF, n + 1).ToArray();
                  for (int j = 0; j <= i; j++)
                  {
                      if (dp[j] == INF) continue;
                      long t = dp[j] + dist[i];
                      long rested = (t + speed - 1) / speed * speed;
                      if (rested < nd[j]) nd[j] = rested;
                      if (t < nd[j + 1]) nd[j + 1] = t;
                  }
                  dp = nd;
              }
              long limit = (long)hoursBefore * speed;
              for (int j = 0; j < n; j++)
              {
                  if (dp[j] != INF && dp[j] + dist[n - 1] <= limit) return j;
              }
              return -1;
          }
        `,
        go: code`
          func minSkips(dist []int, speed int, hoursBefore int) int {
              n := len(dist)
              const inf = 1 << 62
              dp := make([]int, n+1)
              for j := range dp {
                  dp[j] = inf
              }
              dp[0] = 0
              for i := 0; i < n-1; i++ {
                  nd := make([]int, n+1)
                  for j := range nd {
                      nd[j] = inf
                  }
                  for j := 0; j <= i; j++ {
                      if dp[j] == inf {
                          continue
                      }
                      t := dp[j] + dist[i]
                      rested := (t + speed - 1) / speed * speed
                      if rested < nd[j] {
                          nd[j] = rested
                      }
                      if t < nd[j+1] {
                          nd[j+1] = t
                      }
                  }
                  dp = nd
              }
              limit := hoursBefore * speed
              for j := 0; j < n; j++ {
                  if dp[j] != inf && dp[j]+dist[n-1] <= limit {
                      return j
                  }
              }
              return -1
          }
        `,
        kotlin: code`
          fun minSkips(dist: IntArray, speed: Int, hoursBefore: Int): Int {
              val n = dist.size
              val inf = Long.MAX_VALUE / 4
              var dp = LongArray(n + 1) { inf }
              dp[0] = 0L
              for (i in 0 until n - 1) {
                  val nd = LongArray(n + 1) { inf }
                  for (j in 0..i) {
                      if (dp[j] == inf) continue
                      val t = dp[j] + dist[i]
                      val rested = (t + speed - 1) / speed * speed
                      if (rested < nd[j]) nd[j] = rested
                      if (t < nd[j + 1]) nd[j + 1] = t
                  }
                  dp = nd
              }
              val limit = hoursBefore.toLong() * speed
              for (j in 0 until n) {
                  if (dp[j] != inf && dp[j] + dist[n - 1] <= limit) return j
              }
              return -1
          }
        `,
        swift: code`
          func minSkips(_ dist: [Int], _ speed: Int, _ hoursBefore: Int) -> Int {
              let n = dist.count
              let inf = Int.max / 4
              var dp = [Int](repeating: inf, count: n + 1)
              dp[0] = 0
              var i = 0
              while i < n - 1 {
                  var nd = [Int](repeating: inf, count: n + 1)
                  for j in 0...i {
                      if dp[j] == inf { continue }
                      let t = dp[j] + dist[i]
                      let rested = (t + speed - 1) / speed * speed
                      if rested < nd[j] { nd[j] = rested }
                      if t < nd[j + 1] { nd[j + 1] = t }
                  }
                  dp = nd
                  i += 1
              }
              let limit = hoursBefore * speed
              for j in 0..<n {
                  if dp[j] != inf && dp[j] + dist[n - 1] <= limit { return j }
              }
              return -1
          }
        `,
        rust: code`
          fn minSkips(dist: Vec<i32>, speed: i32, hours_before: i32) -> i32 {
              let n = dist.len();
              let inf = std::i64::MAX / 4;
              let speed = speed as i64;
              let mut dp = vec![inf; n + 1];
              dp[0] = 0;
              for i in 0..n.saturating_sub(1) {
                  let mut nd = vec![inf; n + 1];
                  for j in 0..=i {
                      if dp[j] == inf {
                          continue;
                      }
                      let t = dp[j] + dist[i] as i64;
                      let rested = (t + speed - 1) / speed * speed;
                      if rested < nd[j] {
                          nd[j] = rested;
                      }
                      if t < nd[j + 1] {
                          nd[j + 1] = t;
                      }
                  }
                  dp = nd;
              }
              let limit = hours_before as i64 * speed;
              for j in 0..n {
                  if dp[j] != inf && dp[j] + dist[n - 1] as i64 <= limit {
                      return j as i32;
                  }
              }
              -1
          }
        `,
        php: code`
          function minSkips($dist, $speed, $hoursBefore) {
              $n = count($dist);
              $inf = PHP_INT_MAX;
              $dp = array_fill(0, $n + 1, $inf);
              $dp[0] = 0;
              for ($i = 0; $i < $n - 1; $i++) {
                  $nd = array_fill(0, $n + 1, $inf);
                  for ($j = 0; $j <= $i; $j++) {
                      if ($dp[$j] === $inf) continue;
                      $t = $dp[$j] + $dist[$i];
                      $rested = intdiv($t + $speed - 1, $speed) * $speed;
                      if ($rested < $nd[$j]) $nd[$j] = $rested;
                      if ($t < $nd[$j + 1]) $nd[$j + 1] = $t;
                  }
                  $dp = $nd;
              }
              $limit = $hoursBefore * $speed;
              for ($j = 0; $j < $n; $j++) {
                  if ($dp[$j] !== $inf && $dp[$j] + $dist[$n - 1] <= $limit) return $j;
              }
              return -1;
          }
        `,
        ruby: code`
          def minSkips(dist, speed, hoursBefore)
            n = dist.length
            inf = 1 << 62
            dp = Array.new(n + 1, inf)
            dp[0] = 0
            (0...(n - 1)).each do |i|
              nd = Array.new(n + 1, inf)
              (0..i).each do |j|
                next if dp[j] == inf
                t = dp[j] + dist[i]
                rested = (t + speed - 1) / speed * speed
                nd[j] = rested if rested < nd[j]
                nd[j + 1] = t if t < nd[j + 1]
              end
              dp = nd
            end
            limit = hoursBefore * speed
            n.times do |j|
              return j if dp[j] != inf && dp[j] + dist[n - 1] <= limit
            end
            -1
          end
        `,
      },
    };
  })(),

  // ── Count Number of Special Subsequences (LC 1955) ──────────────
  (() => {
    const MOD = 1000000007;
    // a * b mod MOD without leaving exact double range.
    const mulmod = (a: number, b: number) => (((a * Math.floor(b / 65536)) % MOD) * 65536 + a * (b % 65536)) % MOD;
    // Small inputs: every index subset, checked against the pattern 0+ 1+ 2+.
    const brute = (nums: number[]) => {
      const n = nums.length;
      let total = 0;
      for (let mask = 1; mask < 1 << n; mask++) {
        let stage = 0, ok = true;
        const seen = [false, false, false];
        for (let i = 0; i < n && ok; i++) {
          if (!(mask & (1 << i))) continue;
          const v = nums[i];
          if (v < stage || v > stage + 1 || (v === stage + 1 && !seen[stage])) ok = false;
          else { stage = v; seen[v] = true; }
        }
        if (ok && seen[0] && seen[1] && seen[2]) total++;
      }
      return total;
    };
    // Larger inputs: sum over (first chosen 1, last chosen 1) of
    // (choices of 0s before) × 2^(1s strictly between) × (choices of 2s after).
    const counted = (nums: number[]) => {
      const n = nums.length;
      const pow2 = [1];
      for (let i = 1; i <= n; i++) pow2.push((pow2[i - 1] * 2) % MOD);
      const prefA = new Array(n + 1).fill(0); // sum over zeros p < q of 2^(zeros before p)
      let zeros = 0;
      for (let i = 0; i < n; i++) {
        prefA[i + 1] = prefA[i];
        if (nums[i] === 0) { prefA[i + 1] = (prefA[i + 1] + pow2[zeros]) % MOD; zeros++; }
      }
      const sufC = new Array(n + 1).fill(0); // sum over twos s > r of 2^(twos after s)
      let twos = 0;
      for (let i = n - 1; i >= 0; i--) {
        sufC[i] = sufC[i + 1];
        if (nums[i] === 2) { sufC[i] = (sufC[i] + pow2[twos]) % MOD; twos++; }
      }
      let total = 0;
      for (let q = 0; q < n; q++) {
        if (nums[q] !== 1 || prefA[q] === 0) continue;
        let between = 0;
        for (let r = q; r < n; r++) {
          if (nums[r] !== 1) continue;
          const w = r === q ? 1 : pow2[between];
          total = (total + mulmod(mulmod(prefA[q], w), sufC[r + 1])) % MOD;
          if (r > q) between++;
        }
      }
      return total;
    };
    const ref = (nums: number[]) => (nums.length <= 12 ? brute(nums) : counted(nums));
    return {
      slug: "count-number-of-special-subsequences",
      title: "Count Number of Special Subsequences",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "countSpecialSubsequences", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A sequence is **special** if it consists of a **positive** number of `0`s, followed by a **positive** number of `1`s, followed by a **positive** number of `2`s. For example `[0,1,2]` and `[0,0,1,1,1,2]` are special, while `[2,1,0]`, `[1]` and `[0,1,2,0]` are not.\n\n" +
        "Given an array `nums` containing only the values `0`, `1` and `2`, return the number of **different subsequences** of `nums` that are special, modulo `10^9 + 7`. Two subsequences are different when the sets of indices they use are different.",
        [
          { in: "nums = [0,0,1,2,2]", out: "9", note: "Any non-empty choice of the two 0s (3 ways), the single 1, and any non-empty choice of the two 2s (3 ways)." },
          { in: "nums = [2,1,0]", out: "0" },
          { in: "nums = [0,1,0,1,2]", out: "5" },
        ],
        ["1 <= nums.length <= 10^5", "0 <= nums[i] <= 2"]),
      hints: [
        "Scan left to right and count the subsequences built so far by how far along the pattern they are: only 0s, then 0s followed by 1s, then complete.",
        "A new `0` can be appended to every 'only 0s' subsequence or start a new one: `zeros = 2 · zeros + 1`.",
        "A new `1` extends every '0s then 1s' subsequence or the first 1 after any 'only 0s' one: `ones = 2 · ones + zeros`. Likewise `twos = 2 · twos + ones`. The answer is `twos`.",
      ],
      editorial: explain({
        idea: "Classify every subsequence chosen so far by its stage in the pattern. When a new element arrives, each existing subsequence of a compatible stage can either take it or not, which doubles that stage, and the previous stage feeds new members into it.",
        steps: [
          "Keep three counters: `a` (non-empty, only 0s), `b` (0s then a non-empty run of 1s), `c` (complete special subsequences).",
          "On `0`: `a = 2a + 1` — each old one with or without this 0, plus the 0 alone.",
          "On `1`: `b = 2b + a` — each old `b` with or without this 1, plus every `a` extended by its first 1.",
          "On `2`: `c = 2c + b` — likewise.",
          "Reduce modulo 10^9 + 7 after each step and return `c`.",
        ],
        why: "A subsequence that is special (or a valid prefix of the pattern) stays one when extended only by an element equal to its current stage value or the next one, and only in that order. For each counter, the subsequences counted after the step are exactly the old ones (not taking the element), the old ones of the same stage taking it, and the old ones of the previous stage taking it as their first element of the new value — three disjoint groups, which is the update.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The counts double at every matching element and overflow quickly — reduce modulo 10^9 + 7 at every step and use 64-bit arithmetic for `2x + y`.",
          "A `1` can only extend subsequences that already contain a 0 — that is why it adds `a`, not 1.",
          "Equal values at different positions make different subsequences; never deduplicate by value.",
        ],
      }),
      examples: [
        { input: "[0,0,1,2,2]", expectedOutput: "9" },
        { input: "[2,1,0]", expectedOutput: "0" },
        { input: "[0,1,0,1,2]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.7 ? ri(rng, 1, 12) : ri(rng, 13, 300);
        const kind = ri(rng, 0, 2);
        let nums: number[];
        if (kind === 0) nums = Array.from({ length: n }, () => ri(rng, 0, 2));
        else if (kind === 1) nums = Array.from({ length: n }, () => ri(rng, 0, 2)).sort((a, b) => a - b);
        else nums = Array.from({ length: n }, (_, i) => Math.min(2, Math.max(0, Math.floor((3 * i) / n) + ri(rng, -1, 1))));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countSpecialSubsequences(nums: List[int]) -> int:
              MOD = 10 ** 9 + 7
              a = b = c = 0
              for x in nums:
                  if x == 0:
                      a = (2 * a + 1) % MOD
                  elif x == 1:
                      b = (2 * b + a) % MOD
                  else:
                      c = (2 * c + b) % MOD
              return c
        `,
        javascript: code`
          var countSpecialSubsequences = function(nums) {
              var MOD = 1000000007, a = 0, b = 0, c = 0;
              for (var i = 0; i < nums.length; i++) {
                  if (nums[i] === 0) a = (2 * a + 1) % MOD;
                  else if (nums[i] === 1) b = (2 * b + a) % MOD;
                  else c = (2 * c + b) % MOD;
              }
              return c;
          };
        `,
        typescript: code`
          function countSpecialSubsequences(nums: number[]): number {
              var MOD = 1000000007, a = 0, b = 0, c = 0;
              for (var i = 0; i < nums.length; i++) {
                  if (nums[i] === 0) a = (2 * a + 1) % MOD;
                  else if (nums[i] === 1) b = (2 * b + a) % MOD;
                  else c = (2 * c + b) % MOD;
              }
              return c;
          }
        `,
        java: code`
          public static int countSpecialSubsequences(int[] nums) {
              final long MOD = 1000000007L;
              long a = 0, b = 0, c = 0;
              for (int x : nums) {
                  if (x == 0) a = (2 * a + 1) % MOD;
                  else if (x == 1) b = (2 * b + a) % MOD;
                  else c = (2 * c + b) % MOD;
              }
              return (int) c;
          }
        `,
        cpp: code`
          int countSpecialSubsequences(vector<int>& nums) {
              const long long MOD = 1000000007LL;
              long long a = 0, b = 0, c = 0;
              for (int x : nums) {
                  if (x == 0) a = (2 * a + 1) % MOD;
                  else if (x == 1) b = (2 * b + a) % MOD;
                  else c = (2 * c + b) % MOD;
              }
              return (int)c;
          }
        `,
        c: code`
          int countSpecialSubsequences(int* nums, int numsSize) {
              const long long MOD = 1000000007LL;
              long long a = 0, b = 0, c = 0;
              for (int i = 0; i < numsSize; i++) {
                  if (nums[i] == 0) a = (2 * a + 1) % MOD;
                  else if (nums[i] == 1) b = (2 * b + a) % MOD;
                  else c = (2 * c + b) % MOD;
              }
              return (int)c;
          }
        `,
        csharp: code`
          public static int CountSpecialSubsequences(int[] nums)
          {
              const long MOD = 1000000007L;
              long a = 0, b = 0, c = 0;
              foreach (int x in nums)
              {
                  if (x == 0) a = (2 * a + 1) % MOD;
                  else if (x == 1) b = (2 * b + a) % MOD;
                  else c = (2 * c + b) % MOD;
              }
              return (int)c;
          }
        `,
        go: code`
          func countSpecialSubsequences(nums []int) int {
              const mod = 1000000007
              a, b, c := 0, 0, 0
              for _, x := range nums {
                  if x == 0 {
                      a = (2*a + 1) % mod
                  } else if x == 1 {
                      b = (2*b + a) % mod
                  } else {
                      c = (2*c + b) % mod
                  }
              }
              return c
          }
        `,
        kotlin: code`
          fun countSpecialSubsequences(nums: IntArray): Int {
              val modulus = 1000000007L
              var a = 0L
              var b = 0L
              var c = 0L
              for (x in nums) {
                  when (x) {
                      0 -> a = (2 * a + 1) % modulus
                      1 -> b = (2 * b + a) % modulus
                      else -> c = (2 * c + b) % modulus
                  }
              }
              return c.toInt()
          }
        `,
        swift: code`
          func countSpecialSubsequences(_ nums: [Int]) -> Int {
              let modulus = 1000000007
              var a = 0, b = 0, c = 0
              for x in nums {
                  if x == 0 { a = (2 * a + 1) % modulus }
                  else if x == 1 { b = (2 * b + a) % modulus }
                  else { c = (2 * c + b) % modulus }
              }
              return c
          }
        `,
        rust: code`
          fn countSpecialSubsequences(nums: Vec<i32>) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let (mut a, mut b, mut c) = (0i64, 0i64, 0i64);
              for &x in nums.iter() {
                  if x == 0 {
                      a = (2 * a + 1) % modulus;
                  } else if x == 1 {
                      b = (2 * b + a) % modulus;
                  } else {
                      c = (2 * c + b) % modulus;
                  }
              }
              c as i32
          }
        `,
        php: code`
          function countSpecialSubsequences($nums) {
              $modulus = 1000000007;
              $a = 0;
              $b = 0;
              $c = 0;
              foreach ($nums as $x) {
                  if ($x == 0) $a = (2 * $a + 1) % $modulus;
                  elseif ($x == 1) $b = (2 * $b + $a) % $modulus;
                  else $c = (2 * $c + $b) % $modulus;
              }
              return $c;
          }
        `,
        ruby: code`
          def countSpecialSubsequences(nums)
            modulus = 1_000_000_007
            a = b = c = 0
            nums.each do |x|
              if x == 0
                a = (2 * a + 1) % modulus
              elsif x == 1
                b = (2 * b + a) % modulus
              else
                c = (2 * c + b) % modulus
              end
            end
            c
          end
        `,
      },
    };
  })(),

  // ── Number of Unique Good Subsequences (LC 1987) ────────────────
  (() => {
    const MOD = 1000000007;
    // Small inputs: collect every good subsequence in a set.
    const brute = (b: string) => {
      const seen = new Set<string>();
      for (let mask = 1; mask < 1 << b.length; mask++) {
        let s = "";
        for (let i = 0; i < b.length; i++) if (mask & (1 << i)) s += b[i];
        if (s === "0" || s[0] === "1") seen.add(s);
      }
      return seen.size;
    };
    // Larger inputs: a good subsequence starting with 1 can always take the
    // first 1 of the string, then any distinct subsequence (possibly empty) of
    // what follows — counted with the classic last-occurrence recurrence.
    const counted = (b: string) => {
      const first = b.indexOf("1");
      const hasZero = b.indexOf("0") >= 0 ? 1 : 0;
      if (first < 0) return hasZero;
      let dp = 1;
      const last: { [c: string]: number } = { "0": 0, "1": 0 };
      for (let i = first + 1; i < b.length; i++) {
        const nd = (2 * dp - last[b[i]] + MOD) % MOD;
        last[b[i]] = dp;
        dp = nd;
      }
      return (dp + hasZero) % MOD;
    };
    const ref = (b: string) => (b.length <= 11 ? brute(b) : counted(b));
    return {
      slug: "number-of-unique-good-subsequences",
      title: "Number of Unique Good Subsequences",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Google", "Amazon"],
      signature: { funcName: "numberOfUniqueGoodSubsequences", params: [{ name: "binary", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a binary string `binary`. A subsequence of `binary` is **good** if it is non-empty and has **no leading zeros** — the only good subsequence that starts with `0` is `\"0\"` itself.\n\n" +
        "Return the number of **distinct** good subsequences of `binary`, counted as strings (equal strings obtained from different positions count once), modulo `10^9 + 7`.",
        [
          { in: "binary = \"001\"", out: "2", note: "The good subsequences are `\"0\"`, `\"0\"` and `\"1\"`; as strings that is `\"0\"` and `\"1\"`." },
          { in: "binary = \"110\"", out: "5", note: "`\"0\"`, `\"1\"`, `\"10\"`, `\"11\"` and `\"110\"`." },
          { in: "binary = \"1011\"", out: "7" },
        ],
        ["1 <= binary.length <= 10^5", "binary consists of only '0's and '1's"]),
      hints: [
        "Set `\"0\"` aside — it is good exactly when the string contains a 0. Every other good subsequence starts with `1`.",
        "Count distinct subsequences that start with `1`, split by their **last** character: `end0` and `end1`.",
        "Reading a `1`: every distinct one (ending in 0 or 1) can be extended by it, and `\"1\"` itself appears — `end1 = end0 + end1 + 1`. Reading a `0`: `end0 = end0 + end1`. The answer is `end0 + end1 + (1 if any 0)`.",
      ],
      editorial: explain({
        idea: "Count distinct strings by their last character. After reading a prefix, let `end0` (`end1`) be the number of distinct subsequences that start with `1` and end with `0` (`1`). Appending the next character `c` to every distinct subsequence produces every distinct subsequence ending in `c` — the new set already contains all the old ones ending in `c`, so there is no double counting.",
        steps: [
          "Start with `end0 = end1 = 0` and `hasZero = 0`.",
          "For each character: on `1`, set `end1 = end0 + end1 + 1` (extend everything, plus the string `\"1\"`); on `0`, set `end0 = end0 + end1` and `hasZero = 1` (a 0 cannot start a good subsequence other than `\"0\"`).",
          "Reduce modulo 10^9 + 7 at each step.",
          "Return `end0 + end1 + hasZero` modulo 10^9 + 7.",
        ],
        why: "Fix a prefix and a string `t` that starts with `1` and ends with `c`. If `t` is a subsequence of the prefix, it can be matched greedily so that its last character uses the **latest** `c`; removing that character leaves a distinct subsequence of the earlier part (or the empty string, when `t = \"1\"`). So the distinct strings ending in `c` after reading this `c` are exactly the previous distinct strings with `c` appended, plus `\"1\"` when `c = 1` — which is the update. Strings ending in the other character are unchanged.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`\"0\"` counts once if any 0 exists — it is not built by the recurrence.",
          "A 0 never starts a counted subsequence, so the 0-update has no `+ 1`.",
          "Counting by positions instead of by strings overcounts heavily (`\"11\"` has three subsequences but two distinct strings).",
        ],
      }),
      examples: [
        { input: "\"001\"", expectedOutput: "2" },
        { input: "\"110\"", expectedOutput: "5" },
        { input: "\"1011\"", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const n = rng() < 0.65 ? ri(rng, 1, 11) : pick(rng, [ri(rng, 12, 60), ri(rng, 60, 400)]);
        const p = pick(rng, [0, 0.2, 0.5, 0.8, 1]);
        let s = "";
        for (let i = 0; i < n; i++) s += rng() < p ? "1" : "0";
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def numberOfUniqueGoodSubsequences(binary: str) -> int:
              MOD = 10 ** 9 + 7
              end0 = end1 = 0
              has_zero = 0
              for ch in binary:
                  if ch == '1':
                      end1 = (end0 + end1 + 1) % MOD
                  else:
                      end0 = (end0 + end1) % MOD
                      has_zero = 1
              return (end0 + end1 + has_zero) % MOD
        `,
        javascript: code`
          var numberOfUniqueGoodSubsequences = function(binary) {
              var MOD = 1000000007, end0 = 0, end1 = 0, hasZero = 0;
              for (var i = 0; i < binary.length; i++) {
                  if (binary[i] === '1') end1 = (end0 + end1 + 1) % MOD;
                  else {
                      end0 = (end0 + end1) % MOD;
                      hasZero = 1;
                  }
              }
              return (end0 + end1 + hasZero) % MOD;
          };
        `,
        typescript: code`
          function numberOfUniqueGoodSubsequences(binary: string): number {
              var MOD = 1000000007, end0 = 0, end1 = 0, hasZero = 0;
              for (var i = 0; i < binary.length; i++) {
                  if (binary.charAt(i) === "1") end1 = (end0 + end1 + 1) % MOD;
                  else {
                      end0 = (end0 + end1) % MOD;
                      hasZero = 1;
                  }
              }
              return (end0 + end1 + hasZero) % MOD;
          }
        `,
        java: code`
          public static int numberOfUniqueGoodSubsequences(String binary) {
              final long MOD = 1000000007L;
              long end0 = 0, end1 = 0, hasZero = 0;
              for (int i = 0; i < binary.length(); i++) {
                  if (binary.charAt(i) == '1') end1 = (end0 + end1 + 1) % MOD;
                  else {
                      end0 = (end0 + end1) % MOD;
                      hasZero = 1;
                  }
              }
              return (int) ((end0 + end1 + hasZero) % MOD);
          }
        `,
        cpp: code`
          int numberOfUniqueGoodSubsequences(string binary) {
              const long long MOD = 1000000007LL;
              long long end0 = 0, end1 = 0, hasZero = 0;
              for (char ch : binary) {
                  if (ch == '1') end1 = (end0 + end1 + 1) % MOD;
                  else {
                      end0 = (end0 + end1) % MOD;
                      hasZero = 1;
                  }
              }
              return (int)((end0 + end1 + hasZero) % MOD);
          }
        `,
        c: code`
          int numberOfUniqueGoodSubsequences(const char* binary) {
              const long long MOD = 1000000007LL;
              long long end0 = 0, end1 = 0, hasZero = 0;
              for (int i = 0; binary[i]; i++) {
                  if (binary[i] == '1') end1 = (end0 + end1 + 1) % MOD;
                  else {
                      end0 = (end0 + end1) % MOD;
                      hasZero = 1;
                  }
              }
              return (int)((end0 + end1 + hasZero) % MOD);
          }
        `,
        csharp: code`
          public static int NumberOfUniqueGoodSubsequences(string binary)
          {
              const long MOD = 1000000007L;
              long end0 = 0, end1 = 0, hasZero = 0;
              foreach (char ch in binary)
              {
                  if (ch == '1') end1 = (end0 + end1 + 1) % MOD;
                  else
                  {
                      end0 = (end0 + end1) % MOD;
                      hasZero = 1;
                  }
              }
              return (int)((end0 + end1 + hasZero) % MOD);
          }
        `,
        go: code`
          func numberOfUniqueGoodSubsequences(binary string) int {
              const mod = 1000000007
              end0, end1, hasZero := 0, 0, 0
              for i := 0; i < len(binary); i++ {
                  if binary[i] == '1' {
                      end1 = (end0 + end1 + 1) % mod
                  } else {
                      end0 = (end0 + end1) % mod
                      hasZero = 1
                  }
              }
              return (end0 + end1 + hasZero) % mod
          }
        `,
        kotlin: code`
          fun numberOfUniqueGoodSubsequences(binary: String): Int {
              val modulus = 1000000007L
              var end0 = 0L
              var end1 = 0L
              var hasZero = 0L
              for (ch in binary) {
                  if (ch == '1') {
                      end1 = (end0 + end1 + 1) % modulus
                  } else {
                      end0 = (end0 + end1) % modulus
                      hasZero = 1L
                  }
              }
              return ((end0 + end1 + hasZero) % modulus).toInt()
          }
        `,
        swift: code`
          func numberOfUniqueGoodSubsequences(_ binary: String) -> Int {
              let modulus = 1000000007
              var end0 = 0, end1 = 0, hasZero = 0
              for ch in binary {
                  if ch == "1" {
                      end1 = (end0 + end1 + 1) % modulus
                  } else {
                      end0 = (end0 + end1) % modulus
                      hasZero = 1
                  }
              }
              return (end0 + end1 + hasZero) % modulus
          }
        `,
        rust: code`
          fn numberOfUniqueGoodSubsequences(binary: String) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let (mut end0, mut end1, mut has_zero) = (0i64, 0i64, 0i64);
              for &ch in binary.as_bytes() {
                  if ch == b'1' {
                      end1 = (end0 + end1 + 1) % modulus;
                  } else {
                      end0 = (end0 + end1) % modulus;
                      has_zero = 1;
                  }
              }
              ((end0 + end1 + has_zero) % modulus) as i32
          }
        `,
        php: code`
          function numberOfUniqueGoodSubsequences($binary) {
              $modulus = 1000000007;
              $end0 = 0;
              $end1 = 0;
              $hasZero = 0;
              $n = strlen($binary);
              for ($i = 0; $i < $n; $i++) {
                  if ($binary[$i] === '1') {
                      $end1 = ($end0 + $end1 + 1) % $modulus;
                  } else {
                      $end0 = ($end0 + $end1) % $modulus;
                      $hasZero = 1;
                  }
              }
              return ($end0 + $end1 + $hasZero) % $modulus;
          }
        `,
        ruby: code`
          def numberOfUniqueGoodSubsequences(binary)
            modulus = 1_000_000_007
            end0 = 0
            end1 = 0
            has_zero = 0
            binary.each_char do |ch|
              if ch == '1'
                end1 = (end0 + end1 + 1) % modulus
              else
                end0 = (end0 + end1) % modulus
                has_zero = 1
              end
            end
            (end0 + end1 + has_zero) % modulus
          end
        `,
      },
    };
  })(),

  // ── Minimum Operations to Make the Array K-Increasing (LC 2111) ─
  (() => {
    // Quadratic longest non-decreasing subsequence per residue class.
    const ref = (arr: number[], k: number) => {
      let ops = 0;
      for (let s = 0; s < k; s++) {
        const chain: number[] = [];
        for (let i = s; i < arr.length; i += k) chain.push(arr[i]);
        const best = new Array(chain.length).fill(1);
        let longest = 0;
        for (let i = 0; i < chain.length; i++) {
          for (let j = 0; j < i; j++) if (chain[j] <= chain[i] && best[j] + 1 > best[i]) best[i] = best[j] + 1;
          longest = Math.max(longest, best[i]);
        }
        ops += chain.length - longest;
      }
      return ops;
    };
    return {
      slug: "minimum-operations-to-make-the-array-k-increasing",
      title: "Minimum Operations to Make the Array K-Increasing",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Dynamic Programming", "Google", "Amazon"],
      signature: {
        funcName: "kIncreasing",
        params: [{ name: "arr", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given a 0-indexed array `arr` of `n` positive integers and a positive integer `k`. The array is **K-increasing** if `arr[i - k] <= arr[i]` holds for every index `i` with `k <= i <= n - 1`.\n\n" +
        "For example, `[4,1,5,2,6,2]` is K-increasing for `k = 2` (`arr[0] <= arr[2] <= arr[4]` and `arr[1] <= arr[3] <= arr[5]`), but not for `k = 1`.\n\n" +
        "In one operation you may pick an index `i` and change `arr[i]` to **any** positive integer. Return the minimum number of operations needed to make the array K-increasing.",
        [
          { in: "arr = [3,6,2,5,1,4], k = 2", out: "4", note: "The chains `[3,2,1]` and `[6,5,4]` each keep only one element, so two changes per chain." },
          { in: "arr = [3,6,2,5,1,4], k = 3", out: "1", note: "The chains are `[3,5]`, `[6,1]` and `[2,4]`; only `[6,1]` needs a change." },
          { in: "arr = [2,2,2,1], k = 1", out: "1", note: "Equal neighbours are allowed; change the final 1." },
        ],
        ["1 <= arr.length <= 10^5", "1 <= arr[i], k <= arr.length"]),
      hints: [
        "The condition only ever compares indices that are `k` apart. Split the array into `k` independent chains: indices `s, s + k, s + 2k, …` for each `s < k`.",
        "Within one chain, the elements you leave untouched must already be non-decreasing; every other element can be rewritten to fit between its kept neighbours.",
        "So each chain costs its length minus its longest **non-decreasing** subsequence. Compute that in O(m log m) with the patience method, using an upper-bound search so equal values extend the sequence.",
      ],
      editorial: explain({
        idea: "K-increasing means each of the `k` interleaved chains is non-decreasing, and the chains do not interact. In a chain, the elements you keep must form a non-decreasing subsequence, and any such subsequence can be kept — the rest are rewritten. So the answer is the sum over chains of (length − longest non-decreasing subsequence).",
        steps: [
          "For each start `s` from 0 to `k - 1`, walk the chain `arr[s], arr[s + k], …`.",
          "Maintain `tails`, where `tails[L]` is the smallest possible last value of a non-decreasing subsequence of length `L + 1`.",
          "For each value `x`, find the first position whose tail is **greater than** `x` (upper bound) and put `x` there, or append it if there is none.",
          "Add `chain length − len(tails)` to the answer.",
        ],
        why: "Changed values can be any positive integer, so between two kept values `a <= b` every rewritten element can be set to `a` (and elements before the first kept one to 1), which makes the whole chain non-decreasing. Conversely the untouched elements must already be non-decreasing. Minimising changes therefore means maximising the kept non-decreasing subsequence, and the patience method computes that length exactly — the upper bound lets equal values extend a run rather than replace it.",
        time: "O(n log(n / k))",
        space: "O(n / k)",
        pitfalls: [
          "Use the longest **non-decreasing** subsequence (upper bound), not strictly increasing (lower bound) — equal values are allowed.",
          "The chains are independent; solving the whole array as one sequence is wrong for `k > 1`.",
          "A quadratic LIS per chain is too slow when `k = 1` and `n = 10^5`.",
        ],
      }),
      examples: [
        { input: "[3,6,2,5,1,4]\n2", expectedOutput: "4" },
        { input: "[3,6,2,5,1,4]\n3", expectedOutput: "1" },
        { input: "[2,2,2,1]\n1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [ri(rng, 1, 5), ri(rng, 3, 20), ri(rng, 15, 60)]);
        const k = rng() < 0.4 ? ri(rng, 1, Math.min(3, n)) : ri(rng, 1, n);
        const kind = ri(rng, 0, 3);
        let arr: number[];
        if (kind === 0) arr = Array.from({ length: n }, () => ri(rng, 1, n));
        else if (kind === 1) arr = Array.from({ length: n }, () => ri(rng, 1, Math.min(n, 3)));
        else if (kind === 2) { arr = Array.from({ length: n }, () => ri(rng, 1, n)).sort((a, b) => a - b); if (rng() < 0.5) arr.reverse(); }
        else { arr = Array.from({ length: n }, (_, i) => Math.min(n, Math.floor(i / 2) + 1)); for (let t = 0; t < 3; t++) arr[ri(rng, 0, n - 1)] = ri(rng, 1, n); }
        return { input: `${fmtIntArr(arr)}\n${k}`, expectedOutput: String(ref(arr, k)) };
      },
      solutions: {
        python: code`
          from typing import List
          from bisect import bisect_right

          def kIncreasing(arr: List[int], k: int) -> int:
              ops = 0
              for s in range(k):
                  tails = []
                  length = 0
                  for i in range(s, len(arr), k):
                      x = arr[i]
                      length += 1
                      pos = bisect_right(tails, x)
                      if pos == len(tails):
                          tails.append(x)
                      else:
                          tails[pos] = x
                  ops += length - len(tails)
              return ops
        `,
        javascript: code`
          var kIncreasing = function(arr, k) {
              var ops = 0;
              for (var s = 0; s < k; s++) {
                  var tails = [], length = 0;
                  for (var i = s; i < arr.length; i += k) {
                      var x = arr[i];
                      length++;
                      var lo = 0, hi = tails.length;
                      while (lo < hi) {
                          var mid = (lo + hi) >> 1;
                          if (tails[mid] <= x) lo = mid + 1; else hi = mid;
                      }
                      if (lo === tails.length) tails.push(x); else tails[lo] = x;
                  }
                  ops += length - tails.length;
              }
              return ops;
          };
        `,
        typescript: code`
          function kIncreasing(arr: number[], k: number): number {
              var ops = 0;
              for (var s = 0; s < k; s++) {
                  var tails: number[] = [];
                  var length = 0;
                  for (var i = s; i < arr.length; i += k) {
                      var x = arr[i];
                      length++;
                      var lo = 0, hi = tails.length;
                      while (lo < hi) {
                          var mid = (lo + hi) >> 1;
                          if (tails[mid] <= x) lo = mid + 1; else hi = mid;
                      }
                      if (lo === tails.length) tails.push(x); else tails[lo] = x;
                  }
                  ops += length - tails.length;
              }
              return ops;
          }
        `,
        java: code`
          public static int kIncreasing(int[] arr, int k) {
              int n = arr.length, ops = 0;
              int[] tails = new int[n];
              for (int s = 0; s < k; s++) {
                  int size = 0, length = 0;
                  for (int i = s; i < n; i += k) {
                      int x = arr[i];
                      length++;
                      int lo = 0, hi = size;
                      while (lo < hi) {
                          int mid = (lo + hi) >>> 1;
                          if (tails[mid] <= x) lo = mid + 1; else hi = mid;
                      }
                      tails[lo] = x;
                      if (lo == size) size++;
                  }
                  ops += length - size;
              }
              return ops;
          }
        `,
        cpp: code`
          int kIncreasing(vector<int>& arr, int k) {
              int n = arr.size(), ops = 0;
              for (int s = 0; s < k; s++) {
                  vector<int> tails;
                  int length = 0;
                  for (int i = s; i < n; i += k) {
                      length++;
                      auto it = upper_bound(tails.begin(), tails.end(), arr[i]);
                      if (it == tails.end()) tails.push_back(arr[i]);
                      else *it = arr[i];
                  }
                  ops += length - (int)tails.size();
              }
              return ops;
          }
        `,
        c: code`
          int kIncreasing(int* arr, int arrSize, int k) {
              int n = arrSize, ops = 0;
              int* tails = (int*)malloc(sizeof(int) * (n + 1));
              for (int s = 0; s < k; s++) {
                  int size = 0, length = 0;
                  for (int i = s; i < n; i += k) {
                      int x = arr[i];
                      length++;
                      int lo = 0, hi = size;
                      while (lo < hi) {
                          int mid = (lo + hi) / 2;
                          if (tails[mid] <= x) lo = mid + 1; else hi = mid;
                      }
                      tails[lo] = x;
                      if (lo == size) size++;
                  }
                  ops += length - size;
              }
              free(tails);
              return ops;
          }
        `,
        csharp: code`
          public static int KIncreasing(int[] arr, int k)
          {
              int n = arr.Length, ops = 0;
              int[] tails = new int[n];
              for (int s = 0; s < k; s++)
              {
                  int size = 0, length = 0;
                  for (int i = s; i < n; i += k)
                  {
                      int x = arr[i];
                      length++;
                      int lo = 0, hi = size;
                      while (lo < hi)
                      {
                          int mid = (lo + hi) / 2;
                          if (tails[mid] <= x) lo = mid + 1; else hi = mid;
                      }
                      tails[lo] = x;
                      if (lo == size) size++;
                  }
                  ops += length - size;
              }
              return ops;
          }
        `,
        go: code`
          func kIncreasing(arr []int, k int) int {
              n := len(arr)
              ops := 0
              tails := make([]int, n)
              for s := 0; s < k; s++ {
                  size, length := 0, 0
                  for i := s; i < n; i += k {
                      x := arr[i]
                      length++
                      lo, hi := 0, size
                      for lo < hi {
                          mid := (lo + hi) / 2
                          if tails[mid] <= x {
                              lo = mid + 1
                          } else {
                              hi = mid
                          }
                      }
                      tails[lo] = x
                      if lo == size {
                          size++
                      }
                  }
                  ops += length - size
              }
              return ops
          }
        `,
        kotlin: code`
          fun kIncreasing(arr: IntArray, k: Int): Int {
              val n = arr.size
              var ops = 0
              val tails = IntArray(n)
              for (s in 0 until k) {
                  var size = 0
                  var length = 0
                  var i = s
                  while (i < n) {
                      val x = arr[i]
                      length++
                      var lo = 0
                      var hi = size
                      while (lo < hi) {
                          val mid = (lo + hi) / 2
                          if (tails[mid] <= x) lo = mid + 1 else hi = mid
                      }
                      tails[lo] = x
                      if (lo == size) size++
                      i += k
                  }
                  ops += length - size
              }
              return ops
          }
        `,
        swift: code`
          func kIncreasing(_ arr: [Int], _ k: Int) -> Int {
              let n = arr.count
              var ops = 0
              var tails = [Int](repeating: 0, count: n)
              for s in 0..<k {
                  var size = 0, length = 0
                  var i = s
                  while i < n {
                      let x = arr[i]
                      length += 1
                      var lo = 0, hi = size
                      while lo < hi {
                          let mid = (lo + hi) / 2
                          if tails[mid] <= x { lo = mid + 1 } else { hi = mid }
                      }
                      tails[lo] = x
                      if lo == size { size += 1 }
                      i += k
                  }
                  ops += length - size
              }
              return ops
          }
        `,
        rust: code`
          fn kIncreasing(arr: Vec<i32>, k: i32) -> i32 {
              let n = arr.len();
              let k = k as usize;
              let mut ops = 0;
              let mut tails = vec![0i32; n];
              for s in 0..k {
                  let mut size = 0usize;
                  let mut length = 0usize;
                  let mut i = s;
                  while i < n {
                      let x = arr[i];
                      length += 1;
                      let mut lo = 0;
                      let mut hi = size;
                      while lo < hi {
                          let mid = (lo + hi) / 2;
                          if tails[mid] <= x {
                              lo = mid + 1;
                          } else {
                              hi = mid;
                          }
                      }
                      tails[lo] = x;
                      if lo == size {
                          size += 1;
                      }
                      i += k;
                  }
                  ops += length - size;
              }
              ops as i32
          }
        `,
        php: code`
          function kIncreasing($arr, $k) {
              $n = count($arr);
              $ops = 0;
              for ($s = 0; $s < $k; $s++) {
                  $tails = [];
                  $size = 0;
                  $length = 0;
                  for ($i = $s; $i < $n; $i += $k) {
                      $x = $arr[$i];
                      $length++;
                      $lo = 0;
                      $hi = $size;
                      while ($lo < $hi) {
                          $mid = intdiv($lo + $hi, 2);
                          if ($tails[$mid] <= $x) $lo = $mid + 1; else $hi = $mid;
                      }
                      $tails[$lo] = $x;
                      if ($lo == $size) $size++;
                  }
                  $ops += $length - $size;
              }
              return $ops;
          }
        `,
        ruby: code`
          def kIncreasing(arr, k)
            n = arr.length
            ops = 0
            k.times do |s|
              tails = []
              length = 0
              i = s
              while i < n
                x = arr[i]
                length += 1
                lo = 0
                hi = tails.length
                while lo < hi
                  mid = (lo + hi) / 2
                  if tails[mid] <= x
                    lo = mid + 1
                  else
                    hi = mid
                  end
                end
                tails[lo] = x
                i += k
              end
              ops += length - tails.length
            end
            ops
          end
        `,
      },
    };
  })(),

  // ── Minimum Time to Remove All Cars Containing Illegal Goods (LC 2167) ─
  (() => {
    // Every (prefix removed from the left, suffix removed from the right)
    // pair, with the 1s left in the middle removed one by one.
    const ref = (s: string) => {
      const n = s.length;
      let best = Infinity;
      for (let a = 0; a <= n; a++) {
        for (let b = 0; a + b <= n; b++) {
          let mid = 0;
          for (let i = a; i < n - b; i++) if (s[i] === "1") mid++;
          best = Math.min(best, a + b + 2 * mid);
        }
      }
      return best;
    };
    return {
      slug: "minimum-time-to-remove-all-cars-containing-illegal-goods",
      title: "Minimum Time to Remove All Cars Containing Illegal Goods",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Prefix Sum", "Google", "Amazon"],
      signature: { funcName: "minimumTime", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A train is described by a binary string `s`: `s[i] = '0'` means car `i` is clean and `s[i] = '1'` means it carries illegal goods. You must remove every car that carries illegal goods, using any number of these operations:\n\n" +
        "- remove the car at the **left** end of the train — 1 unit of time;\n" +
        "- remove the car at the **right** end of the train — 1 unit of time;\n" +
        "- remove a car from **anywhere** in the train — 2 units of time.\n\n" +
        "Return the minimum time needed to remove all cars containing illegal goods. A train with no cars left contains no illegal goods.",
        [
          { in: "s = \"0110\"", out: "3", note: "Remove three cars from the left (or from the right) — cheaper than pulling out both 1s from the middle for 4." },
          { in: "s = \"1001\"", out: "2", note: "One car from each end." },
          { in: "s = \"0100010\"", out: "4", note: "Two cars from the left and two from the right." },
        ],
        ["1 <= s.length <= 2 * 10^5", "s[i] is either '0' or '1'"]),
      hints: [
        "An optimal plan removes some prefix from the left, some suffix from the right, and every remaining `1` in between individually.",
        "Let `left[i]` be the cheapest way to clear the prefix `s[0..i]` using left removals and middle removals: either remove the whole prefix from the left (`i + 1`), or clear `s[0..i-1]` and pay 2 more if `s[i]` is `1`.",
        "Then the answer is the minimum over `i` of `left[i] + (n - 1 - i)` — clear the prefix, take the rest from the right — together with `n` (take everything from the right).",
      ],
      editorial: explain({
        idea: "Some prefix goes out of the left end, some suffix out of the right end, and the illegal cars stuck in between are pulled out at 2 each. Scanning left to right, a one-dimensional DP gives the cheapest way to clear each prefix; pairing it with removing everything after it from the right covers every plan.",
        steps: [
          "`left = 0` (empty prefix), `best = n` (everything from the right).",
          "For `i` from 0 to `n - 1`: `left = min(left + (s[i] == '1' ? 2 : 0), i + 1)` — either keep handling the prefix the same way and pull car `i` out from the middle if needed, or remove the whole prefix `0..i` from the left.",
          "`best = min(best, left + (n - 1 - i))`.",
          "Return `best`.",
        ],
        why: "In any plan the cars removed from the left form a prefix and the cars removed from the right form a suffix; every other illegal car must be removed individually. For the split point `i` (the last car not taken from the right), the cheapest handling of `s[0..i]` is `left[i]`, because the left-removed prefix inside it can end anywhere and the recurrence considers every such end; the suffix after `i` costs its length. Minimising over `i` (plus the all-right plan) therefore covers every plan.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Removing a clean car from an end still costs 1 — that is why long clean stretches favour middle removals.",
          "Do not forget the plan that takes every car from the right (`n`), or the one that uses no end removals at all.",
          "Middle removals cost 2 each — pulling out two adjacent 1s at the edge (cost 2) beats pulling them out of the middle (cost 4).",
        ],
      }),
      examples: [
        { input: "\"0110\"", expectedOutput: "3" },
        { input: "\"1001\"", expectedOutput: "2" },
        { input: "\"0100010\"", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [ri(rng, 1, 4), ri(rng, 3, 15), ri(rng, 10, 50)]);
        const p = pick(rng, [0, 0.1, 0.3, 0.5, 0.8, 1]);
        let s = "";
        for (let i = 0; i < n; i++) s += rng() < p ? "1" : "0";
        return { input: JSON.stringify(s), expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def minimumTime(s: str) -> int:
              n = len(s)
              left = 0
              best = n
              for i, ch in enumerate(s):
                  left = min(left + (2 if ch == '1' else 0), i + 1)
                  best = min(best, left + n - 1 - i)
              return best
        `,
        javascript: code`
          var minimumTime = function(s) {
              var n = s.length, left = 0, best = n;
              for (var i = 0; i < n; i++) {
                  left = Math.min(left + (s[i] === '1' ? 2 : 0), i + 1);
                  best = Math.min(best, left + n - 1 - i);
              }
              return best;
          };
        `,
        typescript: code`
          function minimumTime(s: string): number {
              var n = s.length, left = 0, best = n;
              for (var i = 0; i < n; i++) {
                  left = Math.min(left + (s.charAt(i) === "1" ? 2 : 0), i + 1);
                  best = Math.min(best, left + n - 1 - i);
              }
              return best;
          }
        `,
        java: code`
          public static int minimumTime(String s) {
              int n = s.length(), left = 0, best = n;
              for (int i = 0; i < n; i++) {
                  left = Math.min(left + (s.charAt(i) == '1' ? 2 : 0), i + 1);
                  best = Math.min(best, left + n - 1 - i);
              }
              return best;
          }
        `,
        cpp: code`
          int minimumTime(string s) {
              int n = s.size(), left = 0, best = n;
              for (int i = 0; i < n; i++) {
                  left = min(left + (s[i] == '1' ? 2 : 0), i + 1);
                  best = min(best, left + n - 1 - i);
              }
              return best;
          }
        `,
        c: code`
          int minimumTime(const char* s) {
              int n = (int)strlen(s), left = 0, best = n;
              for (int i = 0; i < n; i++) {
                  int keep = left + (s[i] == '1' ? 2 : 0);
                  left = keep < i + 1 ? keep : i + 1;
                  if (left + n - 1 - i < best) best = left + n - 1 - i;
              }
              return best;
          }
        `,
        csharp: code`
          public static int MinimumTime(string s)
          {
              int n = s.Length, left = 0, best = n;
              for (int i = 0; i < n; i++)
              {
                  left = Math.Min(left + (s[i] == '1' ? 2 : 0), i + 1);
                  best = Math.Min(best, left + n - 1 - i);
              }
              return best;
          }
        `,
        go: code`
          func minimumTime(s string) int {
              n := len(s)
              left, best := 0, n
              for i := 0; i < n; i++ {
                  if s[i] == '1' {
                      left += 2
                  }
                  if i+1 < left {
                      left = i + 1
                  }
                  if left+n-1-i < best {
                      best = left + n - 1 - i
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun minimumTime(s: String): Int {
              val n = s.length
              var left = 0
              var best = n
              for (i in 0 until n) {
                  left = minOf(left + (if (s[i] == '1') 2 else 0), i + 1)
                  best = minOf(best, left + n - 1 - i)
              }
              return best
          }
        `,
        swift: code`
          func minimumTime(_ s: String) -> Int {
              let chars = Array(s.utf8)
              let n = chars.count
              var left = 0, best = n
              for i in 0..<n {
                  left = min(left + (chars[i] == 49 ? 2 : 0), i + 1)
                  best = min(best, left + n - 1 - i)
              }
              return best
          }
        `,
        rust: code`
          fn minimumTime(s: String) -> i32 {
              let b = s.as_bytes();
              let n = b.len() as i32;
              let mut left: i32 = 0;
              let mut best = n;
              for i in 0..b.len() {
                  let i32i = i as i32;
                  left = std::cmp::min(left + if b[i] == b'1' { 2 } else { 0 }, i32i + 1);
                  best = std::cmp::min(best, left + n - 1 - i32i);
              }
              best
          }
        `,
        php: code`
          function minimumTime($s) {
              $n = strlen($s);
              $left = 0;
              $best = $n;
              for ($i = 0; $i < $n; $i++) {
                  $left = min($left + ($s[$i] === '1' ? 2 : 0), $i + 1);
                  $best = min($best, $left + $n - 1 - $i);
              }
              return $best;
          }
        `,
        ruby: code`
          def minimumTime(s)
            n = s.length
            left = 0
            best = n
            n.times do |i|
              left = [left + (s[i] == '1' ? 2 : 0), i + 1].min
              best = [best, left + n - 1 - i].min
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Selling Pieces of Wood (LC 2312) ────────────────────────────
  (() => {
    // Memoised top-down over every cut position (both halves of each split).
    const ref = (m: number, n: number, prices: number[][]) => {
      const price = new Map<number, number>();
      for (const [h, w, p] of prices) price.set(h * 1000 + w, Math.max(p, price.get(h * 1000 + w) || 0));
      const memo = new Map<number, number>();
      const best = (h: number, w: number): number => {
        const key = h * 1000 + w;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let v = price.get(key) || 0;
        for (let i = 1; i < h; i++) v = Math.max(v, best(i, w) + best(h - i, w));
        for (let j = 1; j < w; j++) v = Math.max(v, best(h, j) + best(h, w - j));
        memo.set(key, v);
        return v;
      };
      return best(m, n);
    };
    return {
      slug: "selling-pieces-of-wood",
      title: "Selling Pieces of Wood",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Memoization", "Google", "Amazon"],
      signature: {
        funcName: "sellingWood",
        params: [{ name: "m", type: "int" as const }, { name: "n", type: "int" as const }, { name: "prices", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You have a rectangular piece of wood of height `m` and width `n`. You are also given `prices`, where `prices[i] = [hi, wi, pricei]` means a piece of height `hi` and width `wi` sells for `pricei` dollars.\n\n" +
        "To cut a piece, make one straight cut across its **entire** height or **entire** width, splitting it into two smaller pieces. You may cut as many times as you like, then sell any of the resulting pieces whose exact shape appears in `prices` (as many pieces of a shape as you have). Pieces with no listed shape earn nothing. The grain of the wood matters, so a piece can **not** be rotated: an `h x w` piece only matches `[h, w, …]`.\n\n" +
        "Return the maximum amount of money you can earn from the `m x n` piece. (On CodeKairo the prices are capped at `10^4` so the answer fits in a 32-bit integer.)",
        [
          { in: "m = 2, n = 3, prices = [[1,1,2],[2,3,10],[1,3,7]]", out: "14", note: "Cut the board into two `1 x 3` strips and sell both for 7." },
          { in: "m = 3, n = 3, prices = [[2,2,9],[1,1,1]]", out: "14", note: "One `2 x 2` piece for 9 and the five remaining `1 x 1` squares for 1 each." },
          { in: "m = 1, n = 4, prices = [[1,2,3],[1,3,5]]", out: "6", note: "Two `1 x 2` pieces (3 + 3) beat a `1 x 3` piece plus an unsellable `1 x 1` (5)." },
        ],
        [
          "1 <= m, n <= 200",
          "1 <= prices.length <= 2 * 10^4",
          "prices[i].length == 3",
          "1 <= hi <= m",
          "1 <= wi <= n",
          "1 <= pricei <= 10^4",
          "all shapes (hi, wi) are pairwise distinct",
        ]),
      hints: [
        "Every cut runs all the way across, so after any number of cuts each piece is again a full rectangle — described only by its height and width.",
        "Let `best[h][w]` be the most an `h x w` piece can earn. Either sell it whole (its listed price, or 0), or make the first cut and solve both halves independently.",
        "`best[h][w] = max(price[h][w], best[i][w] + best[h-i][w] for 1 <= i < h, best[h][j] + best[h][w-j] for 1 <= j < w)`. Fill the table by increasing size; checking only `i <= h / 2` and `j <= w / 2` is enough by symmetry.",
      ],
      editorial: explain({
        idea: "Full-length cuts keep every piece a rectangle, and the two pieces of a cut are processed independently afterwards. So the value of a piece depends only on its dimensions: a 2-D DP over `(height, width)` with one 'first cut' choice per state.",
        steps: [
          "Build `price[h][w]` from the list (0 for unlisted shapes).",
          "For `h` from 1 to `m` and `w` from 1 to `n`: start with `best[h][w] = price[h][w]`.",
          "Try every horizontal first cut `i` from 1 to `h / 2`: `best[i][w] + best[h-i][w]`.",
          "Try every vertical first cut `j` from 1 to `w / 2`: `best[h][j] + best[h][w-j]`.",
          "Keep the maximum and return `best[m][n]`.",
        ],
        why: "Any selling plan either sells the whole piece or begins with some full cut; after that cut the two parts are disjoint rectangles whose plans do not interact, so the best plan for each is the DP value of its shape. Both pieces are strictly smaller, so filling by increasing height and width has them ready. A cut at `i` and at `h - i` give the same two shapes, which is why half the positions suffice.",
        time: "O(m · n · (m + n))",
        space: "O(m · n)",
        pitfalls: [
          "Pieces cannot be rotated: `[2,1,…]` and `[1,2,…]` are different shapes.",
          "Selling a piece whole is optional — a listed price can be beaten by cutting it further.",
          "On LeetCode prices reach 10^6 and the answer needs 64 bits; here prices are capped at 10^4 so it fits in 32.",
        ],
      }),
      examples: [
        { input: "2\n3\n[[1,1,2],[2,3,10],[1,3,7]]", expectedOutput: "14" },
        { input: "3\n3\n[[2,2,9],[1,1,1]]", expectedOutput: "14" },
        { input: "1\n4\n[[1,2,3],[1,3,5]]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const m = pick(rng, [ri(rng, 1, 3), ri(rng, 1, 6), ri(rng, 4, 7)]);
        const n = pick(rng, [ri(rng, 1, 3), ri(rng, 1, 6), ri(rng, 4, 7)]);
        const shapes: number[][] = [];
        for (let h = 1; h <= m; h++) for (let w = 1; w <= n; w++) shapes.push([h, w]);
        shuffle(rng, shapes);
        const count = ri(rng, 1, Math.min(shapes.length, pick(rng, [3, 6, 12])));
        const hi = pick(rng, [20, 10000]);
        const prices = shapes.slice(0, count).map(([h, w]) => [h, w, ri(rng, 1, hi)]);
        return { input: `${m}\n${n}\n${fmtIntMat(prices)}`, expectedOutput: String(ref(m, n, prices)) };
      },
      solutions: {
        python: code`
          from typing import List

          def sellingWood(m: int, n: int, prices: List[List[int]]) -> int:
              best = [[0] * (n + 1) for _ in range(m + 1)]
              for h, w, p in prices:
                  best[h][w] = max(best[h][w], p)
              for h in range(1, m + 1):
                  for w in range(1, n + 1):
                      top = best[h][w]
                      for i in range(1, h // 2 + 1):
                          v = best[i][w] + best[h - i][w]
                          if v > top:
                              top = v
                      for j in range(1, w // 2 + 1):
                          v = best[h][j] + best[h][w - j]
                          if v > top:
                              top = v
                      best[h][w] = top
              return best[m][n]
        `,
        javascript: code`
          var sellingWood = function(m, n, prices) {
              var best = [];
              for (var h = 0; h <= m; h++) best.push(new Array(n + 1).fill(0));
              for (var t = 0; t < prices.length; t++) {
                  var p = prices[t];
                  best[p[0]][p[1]] = Math.max(best[p[0]][p[1]], p[2]);
              }
              for (var h = 1; h <= m; h++) {
                  for (var w = 1; w <= n; w++) {
                      var top = best[h][w];
                      for (var i = 1; i * 2 <= h; i++) top = Math.max(top, best[i][w] + best[h - i][w]);
                      for (var j = 1; j * 2 <= w; j++) top = Math.max(top, best[h][j] + best[h][w - j]);
                      best[h][w] = top;
                  }
              }
              return best[m][n];
          };
        `,
        typescript: code`
          function sellingWood(m: number, n: number, prices: number[][]): number {
              var best: number[][] = [];
              for (var h = 0; h <= m; h++) {
                  var row: number[] = [];
                  for (var w = 0; w <= n; w++) row.push(0);
                  best.push(row);
              }
              for (var t = 0; t < prices.length; t++) {
                  var p = prices[t];
                  best[p[0]][p[1]] = Math.max(best[p[0]][p[1]], p[2]);
              }
              for (var h = 1; h <= m; h++) {
                  for (var w = 1; w <= n; w++) {
                      var top = best[h][w];
                      for (var i = 1; i * 2 <= h; i++) top = Math.max(top, best[i][w] + best[h - i][w]);
                      for (var j = 1; j * 2 <= w; j++) top = Math.max(top, best[h][j] + best[h][w - j]);
                      best[h][w] = top;
                  }
              }
              return best[m][n];
          }
        `,
        java: code`
          public static int sellingWood(int m, int n, int[][] prices) {
              long[][] best = new long[m + 1][n + 1];
              for (int[] p : prices) best[p[0]][p[1]] = Math.max(best[p[0]][p[1]], p[2]);
              for (int h = 1; h <= m; h++) {
                  for (int w = 1; w <= n; w++) {
                      long top = best[h][w];
                      for (int i = 1; i * 2 <= h; i++) top = Math.max(top, best[i][w] + best[h - i][w]);
                      for (int j = 1; j * 2 <= w; j++) top = Math.max(top, best[h][j] + best[h][w - j]);
                      best[h][w] = top;
                  }
              }
              return (int) best[m][n];
          }
        `,
        cpp: code`
          int sellingWood(int m, int n, vector<vector<int>>& prices) {
              vector<vector<long long>> best(m + 1, vector<long long>(n + 1, 0));
              for (auto& p : prices) best[p[0]][p[1]] = max(best[p[0]][p[1]], (long long)p[2]);
              for (int h = 1; h <= m; h++) {
                  for (int w = 1; w <= n; w++) {
                      long long top = best[h][w];
                      for (int i = 1; i * 2 <= h; i++) top = max(top, best[i][w] + best[h - i][w]);
                      for (int j = 1; j * 2 <= w; j++) top = max(top, best[h][j] + best[h][w - j]);
                      best[h][w] = top;
                  }
              }
              return (int)best[m][n];
          }
        `,
        c: code`
          int sellingWood(int m, int n, int** prices, int pricesSize, int* pricesColSize) {
              int W = n + 1;
              long long* best = (long long*)calloc((size_t)(m + 1) * W, sizeof(long long));
              for (int t = 0; t < pricesSize; t++) {
                  long long* cell = &best[prices[t][0] * W + prices[t][1]];
                  if (prices[t][2] > *cell) *cell = prices[t][2];
              }
              for (int h = 1; h <= m; h++) {
                  for (int w = 1; w <= n; w++) {
                      long long top = best[h * W + w];
                      for (int i = 1; i * 2 <= h; i++) {
                          long long v = best[i * W + w] + best[(h - i) * W + w];
                          if (v > top) top = v;
                      }
                      for (int j = 1; j * 2 <= w; j++) {
                          long long v = best[h * W + j] + best[h * W + w - j];
                          if (v > top) top = v;
                      }
                      best[h * W + w] = top;
                  }
              }
              int ans = (int)best[m * W + n];
              free(best);
              return ans;
          }
        `,
        csharp: code`
          public static int SellingWood(int m, int n, int[][] prices)
          {
              long[,] best = new long[m + 1, n + 1];
              foreach (int[] p in prices) best[p[0], p[1]] = Math.Max(best[p[0], p[1]], p[2]);
              for (int h = 1; h <= m; h++)
              {
                  for (int w = 1; w <= n; w++)
                  {
                      long top = best[h, w];
                      for (int i = 1; i * 2 <= h; i++) top = Math.Max(top, best[i, w] + best[h - i, w]);
                      for (int j = 1; j * 2 <= w; j++) top = Math.Max(top, best[h, j] + best[h, w - j]);
                      best[h, w] = top;
                  }
              }
              return (int)best[m, n];
          }
        `,
        go: code`
          func sellingWood(m int, n int, prices [][]int) int {
              best := make([][]int, m+1)
              for h := range best {
                  best[h] = make([]int, n+1)
              }
              for _, p := range prices {
                  if p[2] > best[p[0]][p[1]] {
                      best[p[0]][p[1]] = p[2]
                  }
              }
              for h := 1; h <= m; h++ {
                  for w := 1; w <= n; w++ {
                      top := best[h][w]
                      for i := 1; i*2 <= h; i++ {
                          if v := best[i][w] + best[h-i][w]; v > top {
                              top = v
                          }
                      }
                      for j := 1; j*2 <= w; j++ {
                          if v := best[h][j] + best[h][w-j]; v > top {
                              top = v
                          }
                      }
                      best[h][w] = top
                  }
              }
              return best[m][n]
          }
        `,
        kotlin: code`
          fun sellingWood(m: Int, n: Int, prices: Array<IntArray>): Int {
              val best = Array(m + 1) { LongArray(n + 1) }
              for (p in prices) best[p[0]][p[1]] = maxOf(best[p[0]][p[1]], p[2].toLong())
              for (h in 1..m) {
                  for (w in 1..n) {
                      var top = best[h][w]
                      var i = 1
                      while (i * 2 <= h) {
                          top = maxOf(top, best[i][w] + best[h - i][w])
                          i++
                      }
                      var j = 1
                      while (j * 2 <= w) {
                          top = maxOf(top, best[h][j] + best[h][w - j])
                          j++
                      }
                      best[h][w] = top
                  }
              }
              return best[m][n].toInt()
          }
        `,
        swift: code`
          func sellingWood(_ m: Int, _ n: Int, _ prices: [[Int]]) -> Int {
              var best = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: m + 1)
              for p in prices { best[p[0]][p[1]] = max(best[p[0]][p[1]], p[2]) }
              for h in 1...m {
                  for w in 1...n {
                      var top = best[h][w]
                      var i = 1
                      while i * 2 <= h {
                          top = max(top, best[i][w] + best[h - i][w])
                          i += 1
                      }
                      var j = 1
                      while j * 2 <= w {
                          top = max(top, best[h][j] + best[h][w - j])
                          j += 1
                      }
                      best[h][w] = top
                  }
              }
              return best[m][n]
          }
        `,
        rust: code`
          fn sellingWood(m: i32, n: i32, prices: Vec<Vec<i32>>) -> i32 {
              let (m, n) = (m as usize, n as usize);
              let mut best = vec![vec![0i64; n + 1]; m + 1];
              for p in prices.iter() {
                  let (h, w) = (p[0] as usize, p[1] as usize);
                  best[h][w] = std::cmp::max(best[h][w], p[2] as i64);
              }
              for h in 1..=m {
                  for w in 1..=n {
                      let mut top = best[h][w];
                      let mut i = 1;
                      while i * 2 <= h {
                          top = std::cmp::max(top, best[i][w] + best[h - i][w]);
                          i += 1;
                      }
                      let mut j = 1;
                      while j * 2 <= w {
                          top = std::cmp::max(top, best[h][j] + best[h][w - j]);
                          j += 1;
                      }
                      best[h][w] = top;
                  }
              }
              best[m][n] as i32
          }
        `,
        php: code`
          function sellingWood($m, $n, $prices) {
              $best = array_fill(0, $m + 1, array_fill(0, $n + 1, 0));
              foreach ($prices as $p) $best[$p[0]][$p[1]] = max($best[$p[0]][$p[1]], $p[2]);
              for ($h = 1; $h <= $m; $h++) {
                  for ($w = 1; $w <= $n; $w++) {
                      $top = $best[$h][$w];
                      for ($i = 1; $i * 2 <= $h; $i++) {
                          $v = $best[$i][$w] + $best[$h - $i][$w];
                          if ($v > $top) $top = $v;
                      }
                      for ($j = 1; $j * 2 <= $w; $j++) {
                          $v = $best[$h][$j] + $best[$h][$w - $j];
                          if ($v > $top) $top = $v;
                      }
                      $best[$h][$w] = $top;
                  }
              }
              return $best[$m][$n];
          }
        `,
        ruby: code`
          def sellingWood(m, n, prices)
            best = Array.new(m + 1) { Array.new(n + 1, 0) }
            prices.each { |h, w, p| best[h][w] = p if p > best[h][w] }
            (1..m).each do |h|
              (1..n).each do |w|
                top = best[h][w]
                (1..(h / 2)).each do |i|
                  v = best[i][w] + best[h - i][w]
                  top = v if v > top
                end
                (1..(w / 2)).each do |j|
                  v = best[h][j] + best[h][w - j]
                  top = v if v > top
                end
                best[h][w] = top
              end
            end
            best[m][n]
          end
        `,
      },
    };
  })(),

  // ── Number of Beautiful Partitions (LC 2478) ────────────────────
  (() => {
    // Direct O(n^2 · k) DP that checks each piece's first and last digit,
    // instead of precomputing legal cut points and prefix sums.
    const ref = (s: string, k: number, minLength: number) => {
      const MOD = 1000000007, n = s.length;
      const isP = (c: string) => c === "2" || c === "3" || c === "5" || c === "7";
      let f: number[] = new Array(n + 1).fill(0);
      f[0] = 1;
      for (let c = 1; c <= k; c++) {
        const g: number[] = new Array(n + 1).fill(0);
        for (let j = 1; j <= n; j++) {
          if (isP(s[j - 1])) continue;
          for (let p = 0; p + minLength <= j; p++) {
            if (f[p] && isP(s[p])) g[j] = (g[j] + f[p]) % MOD;
          }
        }
        f = g;
      }
      return f[n];
    };
    return {
      slug: "number-of-beautiful-partitions",
      title: "Number of Beautiful Partitions",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Prefix Sum", "Google", "Amazon"],
      signature: {
        funcName: "beautifulPartitions",
        params: [
          { name: "s", type: "string" as const },
          { name: "k", type: "int" as const },
          { name: "minLength", type: "int" as const },
        ],
        returns: "int" as const,
      },
      description: describe(
        "You are given a string `s` of the digits `'1'` to `'9'` and two integers `k` and `minLength`. A partition of `s` is **beautiful** when:\n\n" +
        "- `s` is split into exactly `k` non-overlapping, non-empty substrings that together cover all of `s`;\n" +
        "- every substring has length at least `minLength`;\n" +
        "- every substring **starts** with a prime digit and **ends** with a non-prime digit. The prime digits are `'2'`, `'3'`, `'5'` and `'7'`.\n\n" +
        "Return the number of beautiful partitions of `s`, modulo `10^9 + 7`.",
        [
          { in: "s = \"29374951\", k = 2, minLength = 1", out: "2", note: "`\"29\" + \"374951\"` and `\"293749\" + \"51\"`. A cut can only go between a non-prime digit and a prime digit." },
          { in: "s = \"29374951\", k = 3, minLength = 2", out: "1", note: "`\"29\" + \"3749\" + \"51\"`." },
          { in: "s = \"29374951\", k = 2, minLength = 3", out: "0", note: "Both two-piece splits leave a piece of length 2." },
        ],
        ["1 <= k, minLength <= s.length <= 1000", "s consists of the digits '1' to '9'"]),
      hints: [
        "If `s` does not start with a prime digit or does not end with a non-prime digit, the answer is 0. Otherwise, a cut may go between positions `j - 1` and `j` exactly when `s[j-1]` is non-prime and `s[j]` is prime.",
        "Let `dp[c][j]` be the number of ways to split `s[0..j)` into `c` valid pieces, defined only at legal boundaries `j`. Then `dp[c][j]` is the sum of `dp[c-1][p]` over legal boundaries `p <= j - minLength`.",
        "That sum is a running prefix sum: as `j` grows, add `dp[c-1][j - minLength]` to an accumulator. Each layer is O(n), so the whole DP is O(n · k).",
      ],
      editorial: explain({
        idea: "Every piece starts with a prime and ends with a non-prime, so the boundaries between pieces are forced to be 'non-prime then prime' positions. The problem becomes: choose `k - 1` of those legal cut positions so that consecutive boundaries are at least `minLength` apart — a layered DP whose transition is a prefix sum.",
        steps: [
          "Return 0 unless `s[0]` is prime and `s[n-1]` is non-prime.",
          "Mark legal boundaries: 0, `n`, and every `j` in `1..n-1` with `s[j-1]` non-prime and `s[j]` prime.",
          "Layer 0: `prev[0] = 1`. For each of the `k` layers, sweep `j` from 1 to `n` with a running sum: when `j - minLength >= 0`, add `prev[j - minLength]`; if `j` is a legal boundary, `cur[j] = running`.",
          "After `k` layers, return `prev[n]` modulo 10^9 + 7.",
        ],
        why: "A partition into `k` pieces is a sequence of boundaries `0 = b0 < b1 < … < bk = n`. Each piece `s[b(i-1)..bi)` starts with a prime and ends with a non-prime exactly when every inner boundary is a legal cut (and the two ends of `s` are right), and has length at least `minLength` exactly when consecutive boundaries are at least `minLength` apart. The layered DP counts precisely these sequences, and the running sum adds each earlier boundary once it is far enough behind `j`.",
        time: "O(n · k)",
        space: "O(n)",
        pitfalls: [
          "Check the first and last digit of `s` up front — the boundary rule alone does not cover them.",
          "Only add `prev[p]` to the running sum once `p <= j - minLength`; adding it earlier allows short pieces.",
          "The naive transition (loop over every earlier boundary) is O(n^2 · k) — too slow for n = 1000.",
        ],
      }),
      examples: [
        { input: "\"29374951\"\n2\n1", expectedOutput: "2" },
        { input: "\"29374951\"\n3\n2", expectedOutput: "1" },
        { input: "\"29374951\"\n2\n3", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [ri(rng, 1, 6), ri(rng, 4, 16), ri(rng, 12, 32)]);
        const primeP = pick(rng, [0.3, 0.5, 0.7]);
        let s = "";
        for (let i = 0; i < n; i++) s += rng() < primeP ? pick(rng, ["2", "3", "5", "7"]) : pick(rng, ["1", "4", "6", "8", "9"]);
        if (rng() < 0.6) s = pick(rng, ["2", "3", "5", "7"]) + s.slice(1);
        if (rng() < 0.6) s = s.slice(0, n - 1) + pick(rng, ["1", "4", "6", "8", "9"]);
        const k = rng() < 0.7 ? ri(rng, 1, Math.min(n, 5)) : ri(rng, 1, n);
        const minLength = rng() < 0.7 ? ri(rng, 1, Math.min(n, 3)) : ri(rng, 1, n);
        return { input: `${JSON.stringify(s)}\n${k}\n${minLength}`, expectedOutput: String(ref(s, k, minLength)) };
      },
      solutions: {
        python: code`
          def beautifulPartitions(s: str, k: int, minLength: int) -> int:
              MOD = 10 ** 9 + 7
              n = len(s)
              primes = set('2357')
              if s[0] not in primes or s[-1] in primes:
                  return 0
              legal = [False] * (n + 1)
              legal[0] = legal[n] = True
              for j in range(1, n):
                  legal[j] = s[j - 1] not in primes and s[j] in primes
              prev = [0] * (n + 1)
              prev[0] = 1
              for _ in range(k):
                  cur = [0] * (n + 1)
                  running = 0
                  for j in range(1, n + 1):
                      if j - minLength >= 0:
                          running = (running + prev[j - minLength]) % MOD
                      if legal[j]:
                          cur[j] = running
                  prev = cur
              return prev[n]
        `,
        javascript: code`
          var beautifulPartitions = function(s, k, minLength) {
              var MOD = 1000000007, n = s.length;
              var isPrime = function(c) { return c === '2' || c === '3' || c === '5' || c === '7'; };
              if (!isPrime(s[0]) || isPrime(s[n - 1])) return 0;
              var legal = new Array(n + 1).fill(false);
              legal[0] = legal[n] = true;
              for (var j = 1; j < n; j++) legal[j] = !isPrime(s[j - 1]) && isPrime(s[j]);
              var prev = new Array(n + 1).fill(0);
              prev[0] = 1;
              for (var c = 0; c < k; c++) {
                  var cur = new Array(n + 1).fill(0), running = 0;
                  for (var j = 1; j <= n; j++) {
                      if (j - minLength >= 0) running = (running + prev[j - minLength]) % MOD;
                      if (legal[j]) cur[j] = running;
                  }
                  prev = cur;
              }
              return prev[n];
          };
        `,
        typescript: code`
          function isPrimeDigit(c: string): boolean {
              return c === "2" || c === "3" || c === "5" || c === "7";
          }

          function beautifulPartitions(s: string, k: number, minLength: number): number {
              var MOD = 1000000007, n = s.length;
              if (!isPrimeDigit(s.charAt(0)) || isPrimeDigit(s.charAt(n - 1))) return 0;
              var legal: boolean[] = [true];
              for (var j = 1; j < n; j++) legal.push(!isPrimeDigit(s.charAt(j - 1)) && isPrimeDigit(s.charAt(j)));
              legal.push(true);
              var prev: number[] = [1];
              for (var j = 1; j <= n; j++) prev.push(0);
              for (var c = 0; c < k; c++) {
                  var cur: number[] = [0];
                  var running = 0;
                  for (var j = 1; j <= n; j++) {
                      if (j - minLength >= 0) running = (running + prev[j - minLength]) % MOD;
                      cur.push(legal[j] ? running : 0);
                  }
                  prev = cur;
              }
              return prev[n];
          }
        `,
        java: code`
          static boolean isPrimeDigit(char c) {
              return c == '2' || c == '3' || c == '5' || c == '7';
          }

          public static int beautifulPartitions(String s, int k, int minLength) {
              final long MOD = 1000000007L;
              int n = s.length();
              if (!isPrimeDigit(s.charAt(0)) || isPrimeDigit(s.charAt(n - 1))) return 0;
              boolean[] legal = new boolean[n + 1];
              legal[0] = legal[n] = true;
              for (int j = 1; j < n; j++) legal[j] = !isPrimeDigit(s.charAt(j - 1)) && isPrimeDigit(s.charAt(j));
              long[] prev = new long[n + 1];
              prev[0] = 1;
              for (int c = 0; c < k; c++) {
                  long[] cur = new long[n + 1];
                  long running = 0;
                  for (int j = 1; j <= n; j++) {
                      if (j - minLength >= 0) running = (running + prev[j - minLength]) % MOD;
                      if (legal[j]) cur[j] = running;
                  }
                  prev = cur;
              }
              return (int) prev[n];
          }
        `,
        cpp: code`
          bool isPrimeDigit(char c) {
              return c == '2' || c == '3' || c == '5' || c == '7';
          }

          int beautifulPartitions(string s, int k, int minLength) {
              const long long MOD = 1000000007LL;
              int n = s.size();
              if (!isPrimeDigit(s[0]) || isPrimeDigit(s[n - 1])) return 0;
              vector<bool> legal(n + 1, false);
              legal[0] = legal[n] = true;
              for (int j = 1; j < n; j++) legal[j] = !isPrimeDigit(s[j - 1]) && isPrimeDigit(s[j]);
              vector<long long> prev(n + 1, 0);
              prev[0] = 1;
              for (int c = 0; c < k; c++) {
                  vector<long long> cur(n + 1, 0);
                  long long running = 0;
                  for (int j = 1; j <= n; j++) {
                      if (j - minLength >= 0) running = (running + prev[j - minLength]) % MOD;
                      if (legal[j]) cur[j] = running;
                  }
                  prev = cur;
              }
              return (int)prev[n];
          }
        `,
        c: code`
          static int isPrimeDigit(char c) {
              return c == '2' || c == '3' || c == '5' || c == '7';
          }

          int beautifulPartitions(const char* s, int k, int minLength) {
              const long long MOD = 1000000007LL;
              int n = (int)strlen(s);
              if (!isPrimeDigit(s[0]) || isPrimeDigit(s[n - 1])) return 0;
              char* legal = (char*)calloc(n + 1, 1);
              legal[0] = legal[n] = 1;
              for (int j = 1; j < n; j++) legal[j] = !isPrimeDigit(s[j - 1]) && isPrimeDigit(s[j]);
              long long* prev = (long long*)calloc(n + 1, sizeof(long long));
              long long* cur = (long long*)calloc(n + 1, sizeof(long long));
              prev[0] = 1;
              for (int c = 0; c < k; c++) {
                  long long running = 0;
                  cur[0] = 0;
                  for (int j = 1; j <= n; j++) {
                      if (j - minLength >= 0) running = (running + prev[j - minLength]) % MOD;
                      cur[j] = legal[j] ? running : 0;
                  }
                  long long* tmp = prev;
                  prev = cur;
                  cur = tmp;
              }
              int ans = (int)prev[n];
              free(legal);
              free(prev);
              free(cur);
              return ans;
          }
        `,
        csharp: code`
          static bool IsPrimeDigit(char c)
          {
              return c == '2' || c == '3' || c == '5' || c == '7';
          }

          public static int BeautifulPartitions(string s, int k, int minLength)
          {
              const long MOD = 1000000007L;
              int n = s.Length;
              if (!IsPrimeDigit(s[0]) || IsPrimeDigit(s[n - 1])) return 0;
              bool[] legal = new bool[n + 1];
              legal[0] = legal[n] = true;
              for (int j = 1; j < n; j++) legal[j] = !IsPrimeDigit(s[j - 1]) && IsPrimeDigit(s[j]);
              long[] prev = new long[n + 1];
              prev[0] = 1;
              for (int c = 0; c < k; c++)
              {
                  long[] cur = new long[n + 1];
                  long running = 0;
                  for (int j = 1; j <= n; j++)
                  {
                      if (j - minLength >= 0) running = (running + prev[j - minLength]) % MOD;
                      if (legal[j]) cur[j] = running;
                  }
                  prev = cur;
              }
              return (int)prev[n];
          }
        `,
        go: code`
          func isPrimeDigit(c byte) bool {
              return c == '2' || c == '3' || c == '5' || c == '7'
          }

          func beautifulPartitions(s string, k int, minLength int) int {
              const mod = 1000000007
              n := len(s)
              if !isPrimeDigit(s[0]) || isPrimeDigit(s[n-1]) {
                  return 0
              }
              legal := make([]bool, n+1)
              legal[0], legal[n] = true, true
              for j := 1; j < n; j++ {
                  legal[j] = !isPrimeDigit(s[j-1]) && isPrimeDigit(s[j])
              }
              prev := make([]int, n+1)
              prev[0] = 1
              for c := 0; c < k; c++ {
                  cur := make([]int, n+1)
                  running := 0
                  for j := 1; j <= n; j++ {
                      if j-minLength >= 0 {
                          running = (running + prev[j-minLength]) % mod
                      }
                      if legal[j] {
                          cur[j] = running
                      }
                  }
                  prev = cur
              }
              return prev[n]
          }
        `,
        kotlin: code`
          fun isPrimeDigit(c: Char): Boolean = c == '2' || c == '3' || c == '5' || c == '7'

          fun beautifulPartitions(s: String, k: Int, minLength: Int): Int {
              val modulus = 1000000007L
              val n = s.length
              if (!isPrimeDigit(s[0]) || isPrimeDigit(s[n - 1])) return 0
              val legal = BooleanArray(n + 1)
              legal[0] = true
              legal[n] = true
              for (j in 1 until n) legal[j] = !isPrimeDigit(s[j - 1]) && isPrimeDigit(s[j])
              var prev = LongArray(n + 1)
              prev[0] = 1L
              repeat(k) {
                  val cur = LongArray(n + 1)
                  var running = 0L
                  for (j in 1..n) {
                      if (j - minLength >= 0) running = (running + prev[j - minLength]) % modulus
                      if (legal[j]) cur[j] = running
                  }
                  prev = cur
              }
              return prev[n].toInt()
          }
        `,
        swift: code`
          func isPrimeDigit(_ c: UInt8) -> Bool {
              return c == 50 || c == 51 || c == 53 || c == 55
          }

          func beautifulPartitions(_ s: String, _ k: Int, _ minLength: Int) -> Int {
              let modulus = 1000000007
              let d = Array(s.utf8)
              let n = d.count
              if !isPrimeDigit(d[0]) || isPrimeDigit(d[n - 1]) { return 0 }
              var legal = [Bool](repeating: false, count: n + 1)
              legal[0] = true
              legal[n] = true
              var q = 1
              while q < n {
                  legal[q] = !isPrimeDigit(d[q - 1]) && isPrimeDigit(d[q])
                  q += 1
              }
              var prev = [Int](repeating: 0, count: n + 1)
              prev[0] = 1
              for _ in 0..<k {
                  var cur = [Int](repeating: 0, count: n + 1)
                  var running = 0
                  for j in 1...n {
                      if j - minLength >= 0 { running = (running + prev[j - minLength]) % modulus }
                      if legal[j] { cur[j] = running }
                  }
                  prev = cur
              }
              return prev[n]
          }
        `,
        rust: code`
          fn is_prime_digit(c: u8) -> bool {
              c == b'2' || c == b'3' || c == b'5' || c == b'7'
          }

          fn beautifulPartitions(s: String, k: i32, min_length: i32) -> i32 {
              let modulus: i64 = 1_000_000_007;
              let d = s.as_bytes();
              let n = d.len();
              let min_length = min_length as usize;
              if !is_prime_digit(d[0]) || is_prime_digit(d[n - 1]) {
                  return 0;
              }
              let mut legal = vec![false; n + 1];
              legal[0] = true;
              legal[n] = true;
              for j in 1..n {
                  legal[j] = !is_prime_digit(d[j - 1]) && is_prime_digit(d[j]);
              }
              let mut prev = vec![0i64; n + 1];
              prev[0] = 1;
              for _ in 0..k {
                  let mut cur = vec![0i64; n + 1];
                  let mut running: i64 = 0;
                  for j in 1..=n {
                      if j >= min_length {
                          running = (running + prev[j - min_length]) % modulus;
                      }
                      if legal[j] {
                          cur[j] = running;
                      }
                  }
                  prev = cur;
              }
              prev[n] as i32
          }
        `,
        php: code`
          function isPrimeDigit($c) {
              return $c === '2' || $c === '3' || $c === '5' || $c === '7';
          }

          function beautifulPartitions($s, $k, $minLength) {
              $modulus = 1000000007;
              $n = strlen($s);
              if (!isPrimeDigit($s[0]) || isPrimeDigit($s[$n - 1])) return 0;
              $legal = array_fill(0, $n + 1, false);
              $legal[0] = true;
              $legal[$n] = true;
              for ($j = 1; $j < $n; $j++) $legal[$j] = !isPrimeDigit($s[$j - 1]) && isPrimeDigit($s[$j]);
              $prev = array_fill(0, $n + 1, 0);
              $prev[0] = 1;
              for ($c = 0; $c < $k; $c++) {
                  $cur = array_fill(0, $n + 1, 0);
                  $running = 0;
                  for ($j = 1; $j <= $n; $j++) {
                      if ($j - $minLength >= 0) $running = ($running + $prev[$j - $minLength]) % $modulus;
                      if ($legal[$j]) $cur[$j] = $running;
                  }
                  $prev = $cur;
              }
              return $prev[$n];
          }
        `,
        ruby: code`
          def prime_digit?(c)
            c == '2' || c == '3' || c == '5' || c == '7'
          end

          def beautifulPartitions(s, k, minLength)
            modulus = 1_000_000_007
            n = s.length
            return 0 if !prime_digit?(s[0]) || prime_digit?(s[n - 1])
            legal = Array.new(n + 1, false)
            legal[0] = true
            legal[n] = true
            (1...n).each { |j| legal[j] = !prime_digit?(s[j - 1]) && prime_digit?(s[j]) }
            prev = Array.new(n + 1, 0)
            prev[0] = 1
            k.times do
              cur = Array.new(n + 1, 0)
              running = 0
              (1..n).each do |j|
                running = (running + prev[j - minLength]) % modulus if j - minLength >= 0
                cur[j] = running if legal[j]
              end
              prev = cur
            end
            prev[n]
          end
        `,
      },
    };
  })(),

  // ── Palindrome Partitioning III (LC 1278) ───────────────────────
  (() => {
    const changes = (s: string, i: number, j: number) => {
      let c = 0;
      while (i < j) { if (s[i] !== s[j]) c++; i++; j--; }
      return c;
    };
    // Small strings: every placement of the k - 1 cuts. Larger: memoised
    // recursion on (start, pieces left) that measures each piece directly.
    const brute = (s: string, k: number) => {
      const n = s.length;
      let best = Infinity;
      const go = (start: number, left: number, acc: number) => {
        if (acc >= best) return;
        if (left === 1) { best = Math.min(best, acc + changes(s, start, n - 1)); return; }
        for (let end = start; end <= n - left; end++) go(end + 1, left - 1, acc + changes(s, start, end));
      };
      go(0, k, 0);
      return best;
    };
    const topDown = (s: string, k: number) => {
      const n = s.length;
      const memo = new Map<number, number>();
      const go = (start: number, left: number): number => {
        if (left === 1) return changes(s, start, n - 1);
        const key = start * 128 + left;
        const hit = memo.get(key);
        if (hit !== undefined) return hit;
        let best = Infinity;
        for (let end = start; end <= n - left; end++) best = Math.min(best, changes(s, start, end) + go(end + 1, left - 1));
        memo.set(key, best);
        return best;
      };
      return go(0, k);
    };
    const ref = (s: string, k: number) => (s.length <= 12 ? brute(s, k) : topDown(s, k));
    return {
      slug: "palindrome-partitioning-iii",
      title: "Palindrome Partitioning III",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Google", "Amazon"],
      signature: {
        funcName: "palindromePartition",
        params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given a string `s` of lowercase English letters and an integer `k`. You may first change some characters of `s` into other lowercase letters. Then you must split `s` into exactly `k` non-empty, non-overlapping substrings (covering all of `s`) so that **every** substring is a palindrome.\n\n" +
        "Return the **minimum number of characters** you need to change.",
        [
          { in: "s = \"abc\", k = 2", out: "1", note: "Split into `\"ab\"` and `\"c\"`, then change one character of `\"ab\"`." },
          { in: "s = \"aabbc\", k = 3", out: "0", note: "`\"aa\"`, `\"bb\"`, `\"c\"` are already palindromes." },
          { in: "s = \"kairo\", k = 2", out: "2", note: "Every split leaves two mismatched pairs, for example `\"kai\"` (1 change) and `\"ro\"` (1 change)." },
        ],
        ["1 <= k <= s.length <= 100", "s only contains lowercase English letters"]),
      hints: [
        "The changes inside one piece do not affect any other piece. How many changes turn a fixed substring `s[i..j]` into a palindrome?",
        "It is the number of mismatched mirror pairs: `cost[i][j] = cost[i+1][j-1] + (s[i] != s[j])`. Precompute it for every substring.",
        "Let `dp[c][j]` be the fewest changes to split the first `j` characters into `c` palindromes: `dp[c][j] = min over p of dp[c-1][p] + cost[p][j-1]`. The answer is `dp[k][n]`.",
      ],
      editorial: explain({
        idea: "Once the cut positions are fixed, each piece is fixed independently, and the cheapest fix of a piece is to change one character of every mismatched mirror pair. So precompute that cost for every substring, then choose the cuts with a partition DP.",
        steps: [
          "Fill `cost[i][j]` for all `i <= j` by increasing length: `cost[i][j] = cost[i+1][j-1] + (s[i] != s[j] ? 1 : 0)`, with single characters (and empty middles) costing 0.",
          "`dp[0][0] = 0` and every other entry is infinite.",
          "For `c` from 1 to `k` and `j` from `c` to `n`: `dp[c][j] = min over p in [c-1, j-1] of dp[c-1][p] + cost[p][j-1]` — the last piece is `s[p..j-1]`.",
          "Return `dp[k][n]`.",
        ],
        why: "A palindrome needs `s[i+t] == s[j-t]` for each mirror pair, and the pairs are disjoint, so the minimum number of changes for a piece is exactly its number of mismatched pairs (one change per pair suffices and is necessary). The pieces of a split are disjoint, so the total is the sum over pieces, and the DP takes the minimum over the position of the last cut, which enumerates every split into `c` pieces.",
        time: "O(k · n^2)",
        space: "O(n^2 + k · n)",
        pitfalls: [
          "Each mismatched pair needs only one change, not two.",
          "Every piece must be non-empty: the last piece of `c` pieces can start no earlier than index `c - 1`.",
          "Recomputing a piece's cost inside the partition loop makes it O(k · n^3); precompute the table.",
        ],
      }),
      examples: [
        { input: "\"abc\"\n2", expectedOutput: "1" },
        { input: "\"aabbc\"\n3", expectedOutput: "0" },
        { input: "\"kairo\"\n2", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const alphabet = pick(rng, ["ab", "abc", "abcd", "codekairo", "abcdefghijklmnopqrstuvwxyz"]);
        const n = rng() < 0.75 ? ri(rng, 1, 12) : ri(rng, 13, 22);
        const s = randLower(rng, n, n, alphabet);
        const k = rng() < 0.6 ? ri(rng, 1, Math.min(n, 4)) : ri(rng, 1, n);
        return { input: `${JSON.stringify(s)}\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: code`
          def palindromePartition(s: str, k: int) -> int:
              n = len(s)
              cost = [[0] * n for _ in range(n)]
              for length in range(2, n + 1):
                  for i in range(n - length + 1):
                      j = i + length - 1
                      cost[i][j] = cost[i + 1][j - 1] + (1 if s[i] != s[j] else 0)
              INF = float('inf')
              dp = [[INF] * (n + 1) for _ in range(k + 1)]
              dp[0][0] = 0
              for c in range(1, k + 1):
                  for j in range(c, n + 1):
                      best = INF
                      for p in range(c - 1, j):
                          v = dp[c - 1][p] + cost[p][j - 1]
                          if v < best:
                              best = v
                      dp[c][j] = best
              return dp[k][n]
        `,
        javascript: code`
          var palindromePartition = function(s, k) {
              var n = s.length, INF = Infinity;
              var cost = [];
              for (var i = 0; i < n; i++) cost.push(new Array(n).fill(0));
              for (var len = 2; len <= n; len++) {
                  for (var i = 0; i + len <= n; i++) {
                      var j = i + len - 1;
                      cost[i][j] = cost[i + 1][j - 1] + (s[i] !== s[j] ? 1 : 0);
                  }
              }
              var dp = [];
              for (var c = 0; c <= k; c++) dp.push(new Array(n + 1).fill(INF));
              dp[0][0] = 0;
              for (var c = 1; c <= k; c++) {
                  for (var j = c; j <= n; j++) {
                      var best = INF;
                      for (var p = c - 1; p < j; p++) best = Math.min(best, dp[c - 1][p] + cost[p][j - 1]);
                      dp[c][j] = best;
                  }
              }
              return dp[k][n];
          };
        `,
        typescript: code`
          function palindromePartition(s: string, k: number): number {
              var n = s.length, INF = 1000000000;
              var cost: number[][] = [];
              for (var i = 0; i < n; i++) {
                  var row: number[] = [];
                  for (var j = 0; j < n; j++) row.push(0);
                  cost.push(row);
              }
              for (var len = 2; len <= n; len++) {
                  for (var i = 0; i + len <= n; i++) {
                      var j = i + len - 1;
                      cost[i][j] = cost[i + 1][j - 1] + (s.charAt(i) !== s.charAt(j) ? 1 : 0);
                  }
              }
              var dp: number[][] = [];
              for (var c = 0; c <= k; c++) {
                  var line: number[] = [];
                  for (var j = 0; j <= n; j++) line.push(INF);
                  dp.push(line);
              }
              dp[0][0] = 0;
              for (var c = 1; c <= k; c++) {
                  for (var j = c; j <= n; j++) {
                      var best = INF;
                      for (var p = c - 1; p < j; p++) best = Math.min(best, dp[c - 1][p] + cost[p][j - 1]);
                      dp[c][j] = best;
                  }
              }
              return dp[k][n];
          }
        `,
        java: code`
          public static int palindromePartition(String s, int k) {
              int n = s.length();
              int[][] cost = new int[n][n];
              for (int len = 2; len <= n; len++) {
                  for (int i = 0; i + len <= n; i++) {
                      int j = i + len - 1;
                      cost[i][j] = cost[i + 1][j - 1] + (s.charAt(i) != s.charAt(j) ? 1 : 0);
                  }
              }
              final int INF = Integer.MAX_VALUE / 2;
              int[][] dp = new int[k + 1][n + 1];
              for (int[] row : dp) Arrays.fill(row, INF);
              dp[0][0] = 0;
              for (int c = 1; c <= k; c++) {
                  for (int j = c; j <= n; j++) {
                      int best = INF;
                      for (int p = c - 1; p < j; p++) best = Math.min(best, dp[c - 1][p] + cost[p][j - 1]);
                      dp[c][j] = best;
                  }
              }
              return dp[k][n];
          }
        `,
        cpp: code`
          int palindromePartition(string s, int k) {
              int n = s.size();
              vector<vector<int>> cost(n, vector<int>(n, 0));
              for (int len = 2; len <= n; len++) {
                  for (int i = 0; i + len <= n; i++) {
                      int j = i + len - 1;
                      cost[i][j] = cost[i + 1][j - 1] + (s[i] != s[j] ? 1 : 0);
                  }
              }
              const int INF = INT_MAX / 2;
              vector<vector<int>> dp(k + 1, vector<int>(n + 1, INF));
              dp[0][0] = 0;
              for (int c = 1; c <= k; c++) {
                  for (int j = c; j <= n; j++) {
                      int best = INF;
                      for (int p = c - 1; p < j; p++) best = min(best, dp[c - 1][p] + cost[p][j - 1]);
                      dp[c][j] = best;
                  }
              }
              return dp[k][n];
          }
        `,
        c: code`
          int palindromePartition(const char* s, int k) {
              int n = (int)strlen(s);
              int* cost = (int*)calloc((size_t)n * n, sizeof(int));
              for (int len = 2; len <= n; len++) {
                  for (int i = 0; i + len <= n; i++) {
                      int j = i + len - 1;
                      int inner = len > 2 ? cost[(i + 1) * n + j - 1] : 0;
                      cost[i * n + j] = inner + (s[i] != s[j] ? 1 : 0);
                  }
              }
              const int INF = 1000000000;
              int W = n + 1;
              int* dp = (int*)malloc(sizeof(int) * (k + 1) * W);
              for (int t = 0; t < (k + 1) * W; t++) dp[t] = INF;
              dp[0] = 0;
              for (int c = 1; c <= k; c++) {
                  for (int j = c; j <= n; j++) {
                      int best = INF;
                      for (int p = c - 1; p < j; p++) {
                          int v = dp[(c - 1) * W + p] + cost[p * n + j - 1];
                          if (v < best) best = v;
                      }
                      dp[c * W + j] = best;
                  }
              }
              int ans = dp[k * W + n];
              free(cost);
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int PalindromePartition(string s, int k)
          {
              int n = s.Length;
              int[,] cost = new int[n, n];
              for (int len = 2; len <= n; len++)
              {
                  for (int i = 0; i + len <= n; i++)
                  {
                      int j = i + len - 1;
                      int inner = len > 2 ? cost[i + 1, j - 1] : 0;
                      cost[i, j] = inner + (s[i] != s[j] ? 1 : 0);
                  }
              }
              const int INF = int.MaxValue / 2;
              int[,] dp = new int[k + 1, n + 1];
              for (int c = 0; c <= k; c++) for (int j = 0; j <= n; j++) dp[c, j] = INF;
              dp[0, 0] = 0;
              for (int c = 1; c <= k; c++)
              {
                  for (int j = c; j <= n; j++)
                  {
                      int best = INF;
                      for (int p = c - 1; p < j; p++) best = Math.Min(best, dp[c - 1, p] + cost[p, j - 1]);
                      dp[c, j] = best;
                  }
              }
              return dp[k, n];
          }
        `,
        go: code`
          func palindromePartition(s string, k int) int {
              n := len(s)
              cost := make([][]int, n)
              for i := range cost {
                  cost[i] = make([]int, n)
              }
              for length := 2; length <= n; length++ {
                  for i := 0; i+length <= n; i++ {
                      j := i + length - 1
                      inner := 0
                      if length > 2 {
                          inner = cost[i+1][j-1]
                      }
                      if s[i] != s[j] {
                          inner++
                      }
                      cost[i][j] = inner
                  }
              }
              const inf = 1 << 30
              dp := make([][]int, k+1)
              for c := range dp {
                  dp[c] = make([]int, n+1)
                  for j := range dp[c] {
                      dp[c][j] = inf
                  }
              }
              dp[0][0] = 0
              for c := 1; c <= k; c++ {
                  for j := c; j <= n; j++ {
                      best := inf
                      for p := c - 1; p < j; p++ {
                          if v := dp[c-1][p] + cost[p][j-1]; v < best {
                              best = v
                          }
                      }
                      dp[c][j] = best
                  }
              }
              return dp[k][n]
          }
        `,
        kotlin: code`
          fun palindromePartition(s: String, k: Int): Int {
              val n = s.length
              val cost = Array(n) { IntArray(n) }
              for (len in 2..n) {
                  for (i in 0..n - len) {
                      val j = i + len - 1
                      val inner = if (len > 2) cost[i + 1][j - 1] else 0
                      cost[i][j] = inner + (if (s[i] != s[j]) 1 else 0)
                  }
              }
              val inf = Int.MAX_VALUE / 2
              val dp = Array(k + 1) { IntArray(n + 1) { inf } }
              dp[0][0] = 0
              for (c in 1..k) {
                  for (j in c..n) {
                      var best = inf
                      for (p in c - 1 until j) best = minOf(best, dp[c - 1][p] + cost[p][j - 1])
                      dp[c][j] = best
                  }
              }
              return dp[k][n]
          }
        `,
        swift: code`
          func palindromePartition(_ s: String, _ k: Int) -> Int {
              let c0 = Array(s.utf8)
              let n = c0.count
              var cost = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)
              if n >= 2 {
                  for len in 2...n {
                      for i in 0...(n - len) {
                          let j = i + len - 1
                          let inner = len > 2 ? cost[i + 1][j - 1] : 0
                          cost[i][j] = inner + (c0[i] != c0[j] ? 1 : 0)
                      }
                  }
              }
              let inf = Int.max / 2
              var dp = [[Int]](repeating: [Int](repeating: inf, count: n + 1), count: k + 1)
              dp[0][0] = 0
              for c in 1...k {
                  for j in c...n {
                      var best = inf
                      for p in (c - 1)..<j { best = min(best, dp[c - 1][p] + cost[p][j - 1]) }
                      dp[c][j] = best
                  }
              }
              return dp[k][n]
          }
        `,
        rust: code`
          fn palindromePartition(s: String, k: i32) -> i32 {
              let b = s.as_bytes();
              let n = b.len();
              let k = k as usize;
              let mut cost = vec![vec![0i32; n]; n];
              for len in 2..=n {
                  for i in 0..=(n - len) {
                      let j = i + len - 1;
                      let inner = if len > 2 { cost[i + 1][j - 1] } else { 0 };
                      cost[i][j] = inner + if b[i] != b[j] { 1 } else { 0 };
                  }
              }
              let inf = std::i32::MAX / 2;
              let mut dp = vec![vec![inf; n + 1]; k + 1];
              dp[0][0] = 0;
              for c in 1..=k {
                  for j in c..=n {
                      let mut best = inf;
                      for p in (c - 1)..j {
                          best = std::cmp::min(best, dp[c - 1][p] + cost[p][j - 1]);
                      }
                      dp[c][j] = best;
                  }
              }
              dp[k][n]
          }
        `,
        php: code`
          function palindromePartition($s, $k) {
              $n = strlen($s);
              $cost = array_fill(0, $n, array_fill(0, $n, 0));
              for ($len = 2; $len <= $n; $len++) {
                  for ($i = 0; $i + $len <= $n; $i++) {
                      $j = $i + $len - 1;
                      $inner = $len > 2 ? $cost[$i + 1][$j - 1] : 0;
                      $cost[$i][$j] = $inner + ($s[$i] !== $s[$j] ? 1 : 0);
                  }
              }
              $inf = PHP_INT_MAX;
              $dp = array_fill(0, $k + 1, array_fill(0, $n + 1, $inf));
              $dp[0][0] = 0;
              for ($c = 1; $c <= $k; $c++) {
                  for ($j = $c; $j <= $n; $j++) {
                      $best = $inf;
                      for ($p = $c - 1; $p < $j; $p++) {
                          if ($dp[$c - 1][$p] === $inf) continue;
                          $v = $dp[$c - 1][$p] + $cost[$p][$j - 1];
                          if ($v < $best) $best = $v;
                      }
                      $dp[$c][$j] = $best;
                  }
              }
              return $dp[$k][$n];
          }
        `,
        ruby: code`
          def palindromePartition(s, k)
            n = s.length
            cost = Array.new(n) { Array.new(n, 0) }
            (2..n).each do |len|
              (0..(n - len)).each do |i|
                j = i + len - 1
                inner = len > 2 ? cost[i + 1][j - 1] : 0
                cost[i][j] = inner + (s[i] != s[j] ? 1 : 0)
              end
            end
            inf = 1 << 40
            dp = Array.new(k + 1) { Array.new(n + 1, inf) }
            dp[0][0] = 0
            (1..k).each do |c|
              (c..n).each do |j|
                best = inf
                ((c - 1)...j).each do |p|
                  v = dp[c - 1][p] + cost[p][j - 1]
                  best = v if v < best
                end
                dp[c][j] = best
              end
            end
            dp[k][n]
          end
        `,
      },
    };
  })(),

];
