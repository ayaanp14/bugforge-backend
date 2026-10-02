/**
 * String problems — wave 6 (Strings I, mostly easy).
 * Real problems only: LeetCode numbered classics. Worked examples are phrased
 * for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h, limits.h or
 * ctype.h, so character classes are written as range checks.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

/** A sentence of `count` words drawn from `pool`, single-spaced. */
const sentenceFrom = (rng: Rng, pool: string[], count: number) =>
  Array.from({ length: count }, () => pick(rng, pool)).join(" ");

/** `size` distinct short words over `alphabet`. */
const wordPool = (rng: Rng, size: number, alphabet: string, maxLen: number) => {
  const seen = new Set<string>();
  let guard = 0;
  while (seen.size < size && guard++ < 500) seen.add(randLower(rng, 1, maxLen, alphabet));
  return [...seen];
};

export const STRINGS6_PROBLEMS: CatalogProblem[] = [

  // ── Positions of Large Groups (LC 830) ──────────────────────────
  (() => {
    const ref = (s: string) => {
      const out: number[][] = [];
      for (let i = 0; i < s.length; i++) {
        if (i > 0 && s[i - 1] === s[i]) continue;
        let j = i;
        while (j + 1 < s.length && s[j + 1] === s[i]) j++;
        if (j - i + 1 >= 3) out.push([i, j]);
      }
      return out;
    };
    return {
      slug: "positions-of-large-groups",
      title: "Positions of Large Groups",
      difficulty: "EASY" as const,
      tags: ["String", "Two Pointers", "Google", "Adobe"],
      signature: { funcName: "largeGroupPositions", params: [{ name: "s", type: "string" as const }], returns: "int[][]" as const },
      description: describe(
        "The string `s` is made of lowercase letters. A **group** is a maximal run of equal consecutive characters — in `\"kaaairooo\"` the groups are `\"k\"`, `\"aaa\"`, `\"i\"`, `\"r\"` and `\"ooo\"`.\n\nA group is **large** when it holds three or more characters. Describe each large group by the pair `[start, end]` of the indices of its first and last characters (0-indexed, both inclusive).\n\nReturn the pairs of every large group, ordered by `start` ascending. Return an empty list if there are none.",
        [
          { in: "s = \"kaaairooo\"", out: "[[1,3],[6,8]]", note: "`\"aaa\"` covers indices 1..3 and `\"ooo\"` covers 6..8." },
          { in: "s = \"codekairo\"", out: "[]", note: "Every group has length 1." },
          { in: "s = \"zzzzz\"", out: "[[0,4]]" },
        ],
        ["1 <= s.length <= 1000", "s contains lowercase English letters only"]),
      hints: [
        "Walk the string once and notice where one run ends and the next begins.",
        "Keep the index where the current run started; a run ends when the next character differs or the string ends.",
        "At each run end, if `end - start + 1 >= 3`, record `[start, end]` — runs are found left to right, so the list is already sorted.",
      ],
      editorial: explain({
        idea: "Groups are just runs of equal characters, so one left-to-right scan with a run-start pointer finds every group, and the long ones are recorded as they close.",
        steps: [
          "Set `i = 0`.",
          "While `i < n`, advance `j` from `i` while `s[j] == s[i]`; the run is `i..j-1`.",
          "If `j - i >= 3`, append `[i, j - 1]`.",
          "Continue from `i = j`.",
        ],
        why: "Every index belongs to exactly one run, and the scan visits runs in order of their start, so each large group is reported exactly once and the output comes out sorted without any extra work.",
        time: "O(n)",
        space: "O(1) besides the output",
        pitfalls: [
          "The last run ends at the end of the string, not at a character change — make sure it is checked too.",
          "The end index is inclusive: a run of length 3 starting at 4 is `[4,6]`, not `[4,7]`.",
          "A run of exactly three characters already counts as large.",
        ],
      }),
      examples: [
        { input: "\"kaaairooo\"", expectedOutput: "[[1,3],[6,8]]" },
        { input: "\"codekairo\"", expectedOutput: "[]" },
        { input: "\"zzzzz\"", expectedOutput: "[[0,4]]" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        let s: string;
        if (cls === 0) s = randLower(rng, 1, 3);
        else if (cls === 1) s = pick(rng, ["a", "q", "z"]).repeat(ri(rng, 1, 40));
        else {
          const alpha = pick(rng, ["ab", "abc", "xyz", "abcdefghijklmnopqrstuvwxyz"]);
          const runs = ri(rng, 1, 14);
          s = "";
          for (let r = 0; r < runs; r++) s += alpha[ri(rng, 0, alpha.length - 1)].repeat(ri(rng, 1, 6));
        }
        return { input: `"${s}"`, expectedOutput: fmtIntMat(ref(s)) };
      },
      solutions: {
        python: code`
          from typing import List

          def largeGroupPositions(s: str) -> List[List[int]]:
              res = []
              n = len(s)
              i = 0
              while i < n:
                  j = i
                  while j < n and s[j] == s[i]:
                      j += 1
                  if j - i >= 3:
                      res.append([i, j - 1])
                  i = j
              return res
        `,
        javascript: code`
          var largeGroupPositions = function(s) {
              var res = [];
              var n = s.length;
              var i = 0;
              while (i < n) {
                  var j = i;
                  while (j < n && s[j] === s[i]) j++;
                  if (j - i >= 3) res.push([i, j - 1]);
                  i = j;
              }
              return res;
          };
        `,
        typescript: code`
          function largeGroupPositions(s: string): number[][] {
              var res: number[][] = [];
              var n = s.length;
              var i = 0;
              while (i < n) {
                  var j = i;
                  while (j < n && s.charAt(j) === s.charAt(i)) j++;
                  if (j - i >= 3) res.push([i, j - 1]);
                  i = j;
              }
              return res;
          }
        `,
        java: code`
          public static int[][] largeGroupPositions(String s) {
              List<int[]> res = new ArrayList<>();
              int n = s.length(), i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && s.charAt(j) == s.charAt(i)) j++;
                  if (j - i >= 3) res.add(new int[] { i, j - 1 });
                  i = j;
              }
              return res.toArray(new int[0][]);
          }
        `,
        cpp: code`
          vector<vector<int>> largeGroupPositions(string s) {
              vector<vector<int>> res;
              int n = s.size(), i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && s[j] == s[i]) j++;
                  if (j - i >= 3) res.push_back({i, j - 1});
                  i = j;
              }
              return res;
          }
        `,
        c: code`
          int** largeGroupPositions(const char* s, int* returnSize, int** returnColumnSizes) {
              int n = (int)strlen(s);
              int** res = (int**)malloc(sizeof(int*) * (n / 3 + 1));
              int* cols = (int*)malloc(sizeof(int) * (n / 3 + 1));
              int cnt = 0, i = 0;
              while (i < n) {
                  int j = i;
                  while (j < n && s[j] == s[i]) j++;
                  if (j - i >= 3) {
                      res[cnt] = (int*)malloc(sizeof(int) * 2);
                      res[cnt][0] = i;
                      res[cnt][1] = j - 1;
                      cols[cnt] = 2;
                      cnt++;
                  }
                  i = j;
              }
              *returnSize = cnt;
              *returnColumnSizes = cols;
              return res;
          }
        `,
        csharp: code`
          public static int[][] LargeGroupPositions(string s)
          {
              var res = new List<int[]>();
              int n = s.Length, i = 0;
              while (i < n)
              {
                  int j = i;
                  while (j < n && s[j] == s[i]) j++;
                  if (j - i >= 3) res.Add(new int[] { i, j - 1 });
                  i = j;
              }
              return res.ToArray();
          }
        `,
        go: code`
          func largeGroupPositions(s string) [][]int {
          	res := [][]int{}
          	n := len(s)
          	i := 0
          	for i < n {
          		j := i
          		for j < n && s[j] == s[i] {
          			j++
          		}
          		if j-i >= 3 {
          			res = append(res, []int{i, j - 1})
          		}
          		i = j
          	}
          	return res
          }
        `,
        kotlin: code`
          fun largeGroupPositions(s: String): Array<IntArray> {
              val res = ArrayList<IntArray>()
              val n = s.length
              var i = 0
              while (i < n) {
                  var j = i
                  while (j < n && s[j] == s[i]) j++
                  if (j - i >= 3) res.add(intArrayOf(i, j - 1))
                  i = j
              }
              return res.toTypedArray()
          }
        `,
        swift: code`
          func largeGroupPositions(_ s: String) -> [[Int]] {
              let a = Array(s.utf8)
              let n = a.count
              var res: [[Int]] = []
              var i = 0
              while i < n {
                  var j = i
                  while j < n && a[j] == a[i] { j += 1 }
                  if j - i >= 3 { res.append([i, j - 1]) }
                  i = j
              }
              return res
          }
        `,
        rust: code`
          fn largeGroupPositions(s: String) -> Vec<Vec<i32>> {
              let b = s.as_bytes();
              let n = b.len();
              let mut res: Vec<Vec<i32>> = Vec::new();
              let mut i = 0;
              while i < n {
                  let mut j = i;
                  while j < n && b[j] == b[i] {
                      j += 1;
                  }
                  if j - i >= 3 {
                      res.push(vec![i as i32, (j - 1) as i32]);
                  }
                  i = j;
              }
              res
          }
        `,
        php: code`
          function largeGroupPositions($s) {
              $res = [];
              $n = strlen($s);
              $i = 0;
              while ($i < $n) {
                  $j = $i;
                  while ($j < $n && $s[$j] === $s[$i]) $j++;
                  if ($j - $i >= 3) $res[] = [$i, $j - 1];
                  $i = $j;
              }
              return $res;
          }
        `,
        ruby: code`
          def largeGroupPositions(s)
            res = []
            n = s.length
            i = 0
            while i < n
              j = i
              j += 1 while j < n && s[j] == s[i]
              res << [i, j - 1] if j - i >= 3
              i = j
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Rotated Digits (LC 788) ─────────────────────────────────────
  (() => {
    const ROT = [0, 1, 5, -1, -1, 2, 9, -1, 8, 6];
    const ref = (n: number) => {
      let good = 0;
      for (let x = 1; x <= n; x++) {
        let y = x, rotated = 0, place = 1, ok = true;
        while (y > 0) {
          const r = ROT[y % 10];
          if (r < 0) { ok = false; break; }
          rotated += r * place;
          place *= 10;
          y = Math.floor(y / 10);
        }
        if (ok && rotated !== x) good++;
      }
      return good;
    };
    return {
      slug: "rotated-digits",
      title: "Rotated Digits",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Dynamic Programming", "Google", "Amazon"],
      signature: { funcName: "rotatedDigits", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Turn every digit of a number upside down (rotate it by 180 degrees), one digit at a time, keeping the digits in place. Under that rotation `0`, `1` and `8` stay themselves, `2` and `5` turn into each other, `6` and `9` turn into each other, and `3`, `4` and `7` become unreadable.\n\nA positive integer `x` is **good** when every one of its digits survives the rotation **and** the rotated number is different from `x`. For example `69` becomes `96` (good), `818` stays `818` (not good) and `47` cannot be rotated (not good).\n\nReturn how many integers in the range `[1, n]` are good.",
        [
          { in: "n = 10", out: "4", note: "The good numbers are 2, 5, 6 and 9. The number 10 rotates to itself." },
          { in: "n = 1", out: "0" },
          { in: "n = 25", out: "12", note: "2, 5, 6, 9, 12, 15, 16, 19, 20, 21, 22 and 25." },
        ],
        ["1 <= n <= 10^4"]),
      hints: [
        "A number is good when it uses no digit from {3, 4, 7} and uses at least one digit from {2, 5, 6, 9}.",
        "Checking every number up to `n` digit by digit already works for these limits.",
        "Faster: count the numbers up to `n` built only from {0,1,2,5,6,8,9}, then subtract those built only from {0,1,8} — a digit-by-digit walk over `n` counts each set in O(digits).",
      ],
      editorial: explain({
        idea: "A number is good exactly when all its digits lie in {0,1,2,5,6,8,9} and not all of them lie in {0,1,8}. So the answer is (numbers in `[0, n]` using only the seven rotatable digits) minus (numbers in `[0, n]` using only the three self-rotating digits) — both counts include 0, which cancels.",
        steps: [
          "Write `count(n, D)` = how many integers in `[0, n]` have every digit in the set `D` (with leading zeros allowed, since 0 is in both sets).",
          "Walk the digits of `n` from the most significant. At a position with digit `d` and `p` positions to its right, every digit of `D` below `d` can be placed here followed by any of `|D|^p` tails: add `(digits of D below d) * |D|^p`.",
          "If `d` itself is not in `D`, stop — no number with this prefix can continue; otherwise move to the next digit.",
          "If the walk passes every digit, `n` itself qualifies: add 1.",
          "Return `count(n, {0,1,2,5,6,8,9}) - count(n, {0,1,8})`.",
        ],
        why: "The walk is the standard way to count numbers below a bound: every number `< n` agrees with `n` on some prefix and is smaller at the first differing position, and each such (prefix, smaller digit) pair is counted once with all its free tails. Numbers made only of {0,1,8} rotate to themselves and are exactly the rotatable numbers that are not good, so the difference counts the good ones.",
        time: "O(log n)",
        space: "O(log n)",
        pitfalls: [
          "A number that rotates to itself (like 1, 8 or 808) is not good even though it is rotatable.",
          "Rotation acts per digit; do not reverse the digit order — the question only asks whether the result differs, and it differs exactly when a digit from {2,5,6,9} is present.",
          "The brute-force check of every number is fine for `n <= 10^4`; the counting walk is what scales.",
        ],
      }),
      examples: [
        { input: "10", expectedOutput: "4" },
        { input: "1", expectedOutput: "0" },
        { input: "25", expectedOutput: "12" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        let n: number;
        if (cls === 0) n = ri(rng, 1, 30);
        else if (cls === 1) n = pick(rng, [1, 2, 9, 10, 99, 100, 999, 1000, 9999, 10000, 2569, 8181]);
        else if (cls <= 3) n = ri(rng, 1, 1000);
        else n = ri(rng, 1, 10000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def rotatedDigits(n: int) -> int:
              return _rd_count(n, {0, 1, 2, 5, 6, 8, 9}) - _rd_count(n, {0, 1, 8})

          def _rd_count(n: int, allowed: set) -> int:
              digits = [int(c) for c in str(n)]
              k = len(digits)
              res = 0
              for i, d in enumerate(digits):
                  smaller = sum(1 for a in allowed if a < d)
                  res += smaller * len(allowed) ** (k - 1 - i)
                  if d not in allowed:
                      return res
              return res + 1
        `,
        javascript: code`
          var rotatedDigits = function(n) {
              // 871 = digits {0,1,2,5,6,8,9}; 259 = digits {0,1,8}
              return rdCount(n, 871, 7) - rdCount(n, 259, 3);
          };

          var rdCount = function(n, mask, m) {
              var digs = [];
              while (n > 0) { digs.push(n % 10); n = Math.floor(n / 10); }
              var res = 0;
              for (var i = digs.length - 1; i >= 0; i--) {
                  var d = digs[i];
                  var smaller = 0;
                  for (var a = 0; a < d; a++) if ((mask >> a) & 1) smaller++;
                  var p = 1;
                  for (var t = 0; t < i; t++) p *= m;
                  res += smaller * p;
                  if (((mask >> d) & 1) === 0) return res;
              }
              return res + 1;
          };
        `,
        typescript: code`
          function rdCount(n: number, mask: number, m: number): number {
              var digs: number[] = [];
              while (n > 0) { digs.push(n % 10); n = Math.floor(n / 10); }
              var res = 0;
              for (var i = digs.length - 1; i >= 0; i--) {
                  var d = digs[i];
                  var smaller = 0;
                  for (var a = 0; a < d; a++) if ((mask >> a) & 1) smaller++;
                  var p = 1;
                  for (var t = 0; t < i; t++) p *= m;
                  res += smaller * p;
                  if (((mask >> d) & 1) === 0) return res;
              }
              return res + 1;
          }

          function rotatedDigits(n: number): number {
              // 871 = digits {0,1,2,5,6,8,9}; 259 = digits {0,1,8}
              return rdCount(n, 871, 7) - rdCount(n, 259, 3);
          }
        `,
        java: code`
          static int rdCount(int n, int mask, int m) {
              int[] digs = new int[12];
              int k = 0;
              while (n > 0) { digs[k++] = n % 10; n /= 10; }
              int res = 0;
              for (int i = k - 1; i >= 0; i--) {
                  int d = digs[i];
                  int smaller = 0;
                  for (int a = 0; a < d; a++) if (((mask >> a) & 1) == 1) smaller++;
                  int p = 1;
                  for (int t = 0; t < i; t++) p *= m;
                  res += smaller * p;
                  if (((mask >> d) & 1) == 0) return res;
              }
              return res + 1;
          }

          public static int rotatedDigits(int n) {
              // 871 = digits {0,1,2,5,6,8,9}; 259 = digits {0,1,8}
              return rdCount(n, 871, 7) - rdCount(n, 259, 3);
          }
        `,
        cpp: code`
          int rdCount(int n, int mask, int m) {
              int digs[12];
              int k = 0;
              while (n > 0) { digs[k++] = n % 10; n /= 10; }
              int res = 0;
              for (int i = k - 1; i >= 0; i--) {
                  int d = digs[i];
                  int smaller = 0;
                  for (int a = 0; a < d; a++) if ((mask >> a) & 1) smaller++;
                  int p = 1;
                  for (int t = 0; t < i; t++) p *= m;
                  res += smaller * p;
                  if (((mask >> d) & 1) == 0) return res;
              }
              return res + 1;
          }

          int rotatedDigits(int n) {
              // 871 = digits {0,1,2,5,6,8,9}; 259 = digits {0,1,8}
              return rdCount(n, 871, 7) - rdCount(n, 259, 3);
          }
        `,
        c: code`
          static int rdCount(int n, int mask, int m) {
              int digs[12];
              int k = 0;
              while (n > 0) { digs[k++] = n % 10; n /= 10; }
              int res = 0;
              for (int i = k - 1; i >= 0; i--) {
                  int d = digs[i];
                  int smaller = 0;
                  for (int a = 0; a < d; a++) if ((mask >> a) & 1) smaller++;
                  int p = 1;
                  for (int t = 0; t < i; t++) p *= m;
                  res += smaller * p;
                  if (((mask >> d) & 1) == 0) return res;
              }
              return res + 1;
          }

          int rotatedDigits(int n) {
              /* 871 = digits {0,1,2,5,6,8,9}; 259 = digits {0,1,8} */
              return rdCount(n, 871, 7) - rdCount(n, 259, 3);
          }
        `,
        csharp: code`
          static int RdCount(int n, int mask, int m)
          {
              var digs = new int[12];
              int k = 0;
              while (n > 0) { digs[k++] = n % 10; n /= 10; }
              int res = 0;
              for (int i = k - 1; i >= 0; i--)
              {
                  int d = digs[i];
                  int smaller = 0;
                  for (int a = 0; a < d; a++) if (((mask >> a) & 1) == 1) smaller++;
                  int p = 1;
                  for (int t = 0; t < i; t++) p *= m;
                  res += smaller * p;
                  if (((mask >> d) & 1) == 0) return res;
              }
              return res + 1;
          }

          public static int RotatedDigits(int n)
          {
              // 871 = digits {0,1,2,5,6,8,9}; 259 = digits {0,1,8}
              return RdCount(n, 871, 7) - RdCount(n, 259, 3);
          }
        `,
        go: code`
          func rdCount(n int, mask int, m int) int {
          	digs := []int{}
          	for n > 0 {
          		digs = append(digs, n%10)
          		n /= 10
          	}
          	res := 0
          	for i := len(digs) - 1; i >= 0; i-- {
          		d := digs[i]
          		smaller := 0
          		for a := 0; a < d; a++ {
          			if (mask>>uint(a))&1 == 1 {
          				smaller++
          			}
          		}
          		p := 1
          		for t := 0; t < i; t++ {
          			p *= m
          		}
          		res += smaller * p
          		if (mask>>uint(d))&1 == 0 {
          			return res
          		}
          	}
          	return res + 1
          }

          func rotatedDigits(n int) int {
          	// 871 = digits {0,1,2,5,6,8,9}; 259 = digits {0,1,8}
          	return rdCount(n, 871, 7) - rdCount(n, 259, 3)
          }
        `,
        kotlin: code`
          fun rdCount(n0: Int, mask: Int, m: Int): Int {
              var n = n0
              val digs = ArrayList<Int>()
              while (n > 0) { digs.add(n % 10); n /= 10 }
              var res = 0
              for (i in digs.size - 1 downTo 0) {
                  val d = digs[i]
                  var smaller = 0
                  for (a in 0 until d) if ((mask shr a) and 1 == 1) smaller++
                  var p = 1
                  for (t in 0 until i) p *= m
                  res += smaller * p
                  if ((mask shr d) and 1 == 0) return res
              }
              return res + 1
          }

          fun rotatedDigits(n: Int): Int {
              // 871 = digits {0,1,2,5,6,8,9}; 259 = digits {0,1,8}
              return rdCount(n, 871, 7) - rdCount(n, 259, 3)
          }
        `,
        swift: code`
          func rdCount(_ n0: Int, _ mask: Int, _ m: Int) -> Int {
              var n = n0
              var digs: [Int] = []
              while n > 0 { digs.append(n % 10); n /= 10 }
              var res = 0
              var i = digs.count - 1
              while i >= 0 {
                  let d = digs[i]
                  var smaller = 0
                  var a = 0
                  while a < d {
                      if (mask >> a) & 1 == 1 { smaller += 1 }
                      a += 1
                  }
                  var p = 1
                  var t = 0
                  while t < i { p *= m; t += 1 }
                  res += smaller * p
                  if (mask >> d) & 1 == 0 { return res }
                  i -= 1
              }
              return res + 1
          }

          func rotatedDigits(_ n: Int) -> Int {
              // 871 = digits {0,1,2,5,6,8,9}; 259 = digits {0,1,8}
              return rdCount(n, 871, 7) - rdCount(n, 259, 3)
          }
        `,
        rust: code`
          fn rd_count(n0: i32, mask: i32, m: i32) -> i32 {
              let mut n = n0;
              let mut digs: Vec<i32> = Vec::new();
              while n > 0 {
                  digs.push(n % 10);
                  n /= 10;
              }
              let mut res = 0;
              for i in (0..digs.len()).rev() {
                  let d = digs[i];
                  let mut smaller = 0;
                  for a in 0..d {
                      if (mask >> a) & 1 == 1 {
                          smaller += 1;
                      }
                  }
                  let mut p = 1;
                  for _ in 0..i {
                      p *= m;
                  }
                  res += smaller * p;
                  if (mask >> d) & 1 == 0 {
                      return res;
                  }
              }
              res + 1
          }

          fn rotatedDigits(n: i32) -> i32 {
              // 871 = digits {0,1,2,5,6,8,9}; 259 = digits {0,1,8}
              rd_count(n, 871, 7) - rd_count(n, 259, 3)
          }
        `,
        php: code`
          function rdCount($n, $mask, $m) {
              $digs = [];
              while ($n > 0) { $digs[] = $n % 10; $n = intdiv($n, 10); }
              $res = 0;
              for ($i = count($digs) - 1; $i >= 0; $i--) {
                  $d = $digs[$i];
                  $smaller = 0;
                  for ($a = 0; $a < $d; $a++) if (($mask >> $a) & 1) $smaller++;
                  $p = 1;
                  for ($t = 0; $t < $i; $t++) $p *= $m;
                  $res += $smaller * $p;
                  if ((($mask >> $d) & 1) == 0) return $res;
              }
              return $res + 1;
          }

          function rotatedDigits($n) {
              // 871 = digits {0,1,2,5,6,8,9}; 259 = digits {0,1,8}
              return rdCount($n, 871, 7) - rdCount($n, 259, 3);
          }
        `,
        ruby: code`
          def rd_count(n, allowed)
            digits = n.to_s.chars.map(&:to_i)
            k = digits.length
            res = 0
            digits.each_with_index do |d, i|
              smaller = allowed.count { |a| a < d }
              res += smaller * allowed.length**(k - 1 - i)
              return res unless allowed.include?(d)
            end
            res + 1
          end

          def rotatedDigits(n)
            rd_count(n, [0, 1, 2, 5, 6, 8, 9]) - rd_count(n, [0, 1, 8])
          end
        `,
      },
    };
  })(),

  // ── Uncommon Words from Two Sentences (LC 884) ──────────────────
  (() => {
    const ref = (s1: string, s2: string) => {
      const words = s1.split(" ").concat(s2.split(" "));
      return words.filter((w) => words.filter((x) => x === w).length === 1);
    };
    return {
      slug: "uncommon-words-from-two-sentences",
      title: "Uncommon Words from Two Sentences",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon", "Bloomberg"],
      signature: {
        funcName: "uncommonFromSentences",
        params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }],
        returns: "string[]" as const,
      },
      description: describe(
        "A **sentence** is a list of words separated by single spaces, where every word is made of lowercase letters.\n\nGiven two sentences `s1` and `s2`, a word is **uncommon** when it appears exactly once in one of the sentences and does not appear in the other — in other words, it occurs exactly once across both sentences together.\n\nReturn all uncommon words in the order they appear when reading `s1` first and then `s2`. Return an empty list if there are none.",
        [
          { in: "s1 = \"code kairo code\", s2 = \"kairo duel\"", out: "[\"duel\"]", note: "`code` appears twice in `s1`, `kairo` once in each sentence." },
          { in: "s1 = \"fast fast\", s2 = \"fast\"", out: "[]" },
          { in: "s1 = \"solve the bug\", s2 = \"hunt the bug today\"", out: "[\"solve\",\"hunt\",\"today\"]" },
        ],
        [
          "1 <= s1.length, s2.length <= 200",
          "s1 and s2 consist of lowercase English letters and spaces",
          "s1 and s2 have no leading or trailing spaces",
          "all words in s1 and s2 are separated by a single space",
        ]),
      hints: [
        "Being uncommon only depends on how many times a word occurs in total.",
        "Put the words of both sentences into one list and count each word.",
        "Walk the combined list in order and keep the words whose count is exactly 1.",
      ],
      editorial: explain({
        idea: "\"Once in one sentence and absent from the other\" is the same as \"exactly once across both\", so the two sentences can be merged into one word list and counted.",
        steps: [
          "Split `s1` and `s2` on spaces and concatenate the word lists, `s1`'s first.",
          "Count every word in a hash map.",
          "Scan the combined list in order and output each word whose count is 1.",
        ],
        why: "A word that appears twice in the same sentence, or once in each, has a total count of at least 2 and is excluded; a word with total count 1 appears in exactly one sentence exactly once, which is the definition. Each such word occurs once in the list, so scanning in order emits it once, at its position.",
        time: "O(|s1| + |s2|)",
        space: "O(|s1| + |s2|)",
        pitfalls: [
          "A word repeated inside one sentence is not uncommon even if the other sentence lacks it.",
          "Count words, not characters — split on spaces first.",
          "Keep the reading order (s1 then s2); iterating a hash map gives an unspecified order.",
        ],
      }),
      examples: [
        { input: "\"code kairo code\"\n\"kairo duel\"", expectedOutput: "[\"duel\"]" },
        { input: "\"fast fast\"\n\"fast\"", expectedOutput: "[]" },
        { input: "\"solve the bug\"\n\"hunt the bug today\"", expectedOutput: "[\"solve\",\"hunt\",\"today\"]" },
      ],
      gen: (rng: Rng) => {
        const pool = wordPool(rng, ri(rng, 1, 10), pick(rng, ["ab", "abc", "abcde", "kairo"]), ri(rng, 1, 4));
        const s1 = sentenceFrom(rng, pool, ri(rng, 1, 7));
        const s2 = sentenceFrom(rng, pool, ri(rng, 1, 7));
        return { input: `"${s1}"\n"${s2}"`, expectedOutput: fmtStrArr(ref(s1, s2)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def uncommonFromSentences(s1: str, s2: str) -> List[str]:
              words = s1.split() + s2.split()
              cnt = Counter(words)
              return [w for w in words if cnt[w] == 1]
        `,
        javascript: code`
          var uncommonFromSentences = function(s1, s2) {
              var words = s1.split(" ").concat(s2.split(" "));
              var cnt = new Map();
              for (var i = 0; i < words.length; i++) cnt.set(words[i], (cnt.get(words[i]) || 0) + 1);
              return words.filter(function(w) { return cnt.get(w) === 1; });
          };
        `,
        typescript: code`
          function uncommonFromSentences(s1: string, s2: string): string[] {
              var words: string[] = s1.split(" ").concat(s2.split(" "));
              var cnt: { [k: string]: number } = {};
              for (var i = 0; i < words.length; i++) {
                  var key = "#" + words[i];
                  cnt[key] = (cnt[key] || 0) + 1;
              }
              var res: string[] = [];
              for (var j = 0; j < words.length; j++) {
                  if (cnt["#" + words[j]] === 1) res.push(words[j]);
              }
              return res;
          }
        `,
        java: code`
          public static String[] uncommonFromSentences(String s1, String s2) {
              String[] words = (s1 + " " + s2).split(" ");
              Map<String, Integer> cnt = new HashMap<>();
              for (String w : words) cnt.merge(w, 1, Integer::sum);
              List<String> res = new ArrayList<>();
              for (String w : words) if (cnt.get(w) == 1) res.add(w);
              return res.toArray(new String[0]);
          }
        `,
        cpp: code`
          vector<string> uncommonFromSentences(string s1, string s2) {
              vector<string> words;
              istringstream in1(s1 + " " + s2);
              string w;
              while (in1 >> w) words.push_back(w);
              unordered_map<string, int> cnt;
              for (const string& x : words) cnt[x]++;
              vector<string> res;
              for (const string& x : words) if (cnt[x] == 1) res.push_back(x);
              return res;
          }
        `,
        c: code`
          char** uncommonFromSentences(const char* s1, const char* s2, int* returnSize) {
              int l1 = (int)strlen(s1), l2 = (int)strlen(s2);
              int total = l1 + l2 + 1;
              char* buf = (char*)malloc(total + 1);
              memcpy(buf, s1, l1);
              buf[l1] = ' ';
              memcpy(buf + l1 + 1, s2, l2);
              buf[total] = '\0';
              char** words = (char**)malloc(sizeof(char*) * (total + 1));
              int w = 0, i = 0;
              while (i < total) {
                  while (i < total && buf[i] == ' ') i++;
                  if (i >= total) break;
                  words[w++] = buf + i;
                  while (i < total && buf[i] != ' ') i++;
                  buf[i] = '\0';
                  i++;
              }
              char** res = (char**)malloc(sizeof(char*) * (w + 1));
              int cnt = 0;
              for (int a = 0; a < w; a++) {
                  int c = 0;
                  for (int b = 0; b < w; b++) if (strcmp(words[a], words[b]) == 0) c++;
                  if (c == 1) res[cnt++] = words[a];
              }
              *returnSize = cnt;
              return res;
          }
        `,
        csharp: code`
          public static string[] UncommonFromSentences(string s1, string s2)
          {
              var words = (s1 + " " + s2).Split(' ');
              var cnt = new Dictionary<string, int>();
              foreach (var w in words)
              {
                  cnt.TryGetValue(w, out int c);
                  cnt[w] = c + 1;
              }
              var res = new List<string>();
              foreach (var w in words) if (cnt[w] == 1) res.Add(w);
              return res.ToArray();
          }
        `,
        go: code`
          func uncommonFromSentences(s1 string, s2 string) []string {
          	words := strings.Fields(s1 + " " + s2)
          	cnt := map[string]int{}
          	for _, w := range words {
          		cnt[w]++
          	}
          	res := []string{}
          	for _, w := range words {
          		if cnt[w] == 1 {
          			res = append(res, w)
          		}
          	}
          	return res
          }
        `,
        kotlin: code`
          fun uncommonFromSentences(s1: String, s2: String): Array<String> {
              val words = (s1 + " " + s2).split(" ")
              val cnt = HashMap<String, Int>()
              for (w in words) cnt[w] = (cnt[w] ?: 0) + 1
              return words.filter { cnt[it] == 1 }.toTypedArray()
          }
        `,
        swift: code`
          func uncommonFromSentences(_ s1: String, _ s2: String) -> [String] {
              let words = (s1 + " " + s2).split(separator: " ").map { String($0) }
              var cnt = [String: Int]()
              for w in words { cnt[w, default: 0] += 1 }
              return words.filter { cnt[$0] == 1 }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn uncommonFromSentences(s1: String, s2: String) -> Vec<String> {
              let joined = format!("{} {}", s1, s2);
              let words: Vec<&str> = joined.split_whitespace().collect();
              let mut cnt: HashMap<&str, i32> = HashMap::new();
              for w in words.iter() {
                  *cnt.entry(*w).or_insert(0) += 1;
              }
              let mut res: Vec<String> = Vec::new();
              for w in words.iter() {
                  if cnt[w] == 1 {
                      res.push(w.to_string());
                  }
              }
              res
          }
        `,
        php: code`
          function uncommonFromSentences($s1, $s2) {
              $words = explode(' ', $s1 . ' ' . $s2);
              $cnt = [];
              foreach ($words as $w) $cnt[$w] = (isset($cnt[$w]) ? $cnt[$w] : 0) + 1;
              $res = [];
              foreach ($words as $w) if ($cnt[$w] == 1) $res[] = $w;
              return $res;
          }
        `,
        ruby: code`
          def uncommonFromSentences(s1, s2)
            words = s1.split(' ') + s2.split(' ')
            cnt = Hash.new(0)
            words.each { |w| cnt[w] += 1 }
            words.select { |w| cnt[w] == 1 }
          end
        `,
      },
    };
  })(),

  // ── Groups of Special-Equivalent Strings (LC 893) ───────────────
  (() => {
    // Pairwise check against one representative per group found so far — independent of the
    // hash-key trick the solutions use.
    const ref = (words: string[]) => {
      const reps: string[] = [];
      for (const w of words) {
        let found = false;
        for (const r of reps) {
          let same = true;
          for (let parity = 0; parity < 2 && same; parity++) {
            const a: string[] = [], b: string[] = [];
            for (let i = parity; i < w.length; i += 2) { a.push(w[i]); b.push(r[i]); }
            a.sort(); b.sort();
            if (a.join("") !== b.join("")) same = false;
          }
          if (same) { found = true; break; }
        }
        if (!found) reps.push(w);
      }
      return reps.length;
    };
    return {
      slug: "groups-of-special-equivalent-strings",
      title: "Groups of Special-Equivalent Strings",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Sorting", "Meta", "Amazon"],
      signature: { funcName: "numSpecialEquivGroups", params: [{ name: "words", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `words` of lowercase strings, all of the same length.\n\nIn one **move** you may pick a string and swap two of its characters whose indices are both even, or two whose indices are both odd. Two strings are **special-equivalent** when some sequence of moves turns one into the other. For example `\"kode\"` and `\"doke\"` are special-equivalent: swapping the even-indexed `k` and `d` turns one into the other.\n\nA **group** of special-equivalent strings is a non-empty subset of `words` in which every pair is special-equivalent and that cannot be extended by any other string of `words`. Return the number of groups.",
        [
          { in: "words = [\"kode\",\"doke\",\"koed\",\"edok\"]", out: "3", note: "`\"kode\"` and `\"doke\"` form one group; `\"koed\"` and `\"edok\"` each stand alone." },
          { in: "words = [\"xyz\",\"zyx\",\"yxz\"]", out: "2" },
          { in: "words = [\"a\",\"b\",\"a\"]", out: "2" },
        ],
        ["1 <= words.length <= 1000", "1 <= words[i].length <= 20", "words[i] consists of lowercase English letters", "all strings in words have the same length"]),
      hints: [
        "Moves only shuffle the even positions among themselves and the odd positions among themselves.",
        "Any rearrangement of the even positions is reachable by swaps, and so is any rearrangement of the odd ones.",
        "So two strings are equivalent exactly when their even-index letters form the same multiset and their odd-index letters do too — build that as a key and count distinct keys.",
      ],
      editorial: explain({
        idea: "Swaps generate every permutation, so a string can reach exactly the strings whose even-indexed letters are a rearrangement of its own even-indexed letters and likewise for odd. The pair (multiset of even letters, multiset of odd letters) is therefore a complete invariant, and the groups are its distinct values.",
        steps: [
          "For each word, count its letters at even indices and at odd indices separately (or sort each half).",
          "Combine the two into one key, e.g. the 52 counts or `sortedEven + \"|\" + sortedOdd`.",
          "Insert every key into a hash set.",
          "Return the size of the set.",
        ],
        why: "Moves never carry a letter from an even index to an odd one, so the two multisets never change — equivalent strings share the key. Conversely, any two arrangements of the same multiset are connected by transpositions, so strings with the same key are equivalent. Special-equivalence is thus an equivalence relation whose classes are the key values.",
        time: "O(n · L) with counting (O(n · L log L) with sorting)",
        space: "O(n · L)",
        pitfalls: [
          "Sorting the whole word is wrong — `\"ab\"` and `\"ba\"` have the same letters but are not equivalent.",
          "Separate the two halves in the key (a delimiter or fixed-size counts); concatenating unsorted halves of different words can collide otherwise.",
          "Duplicate words belong to the same group.",
        ],
      }),
      examples: [
        { input: "[\"kode\",\"doke\",\"koed\",\"edok\"]", expectedOutput: "3" },
        { input: "[\"xyz\",\"zyx\",\"yxz\"]", expectedOutput: "2" },
        { input: "[\"a\",\"b\",\"a\"]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const len = pick(rng, [1, 2, 3, 4, 5, 6, 8]);
        const n = ri(rng, 1, 14);
        const alpha = pick(rng, ["ab", "abc", "abcd", "xyz", "abcdefghijklmnopqrstuvwxyz"]);
        const words: string[] = [];
        for (let i = 0; i < n; i++) {
          if (words.length && ri(rng, 0, 2) > 0) {
            // derive from an earlier word: shuffle evens and odds independently, sometimes break it
            const base = pick(rng, words).split("");
            const ev: string[] = [], od: string[] = [];
            for (let k = 0; k < len; k++) (k % 2 === 0 ? ev : od).push(base[k]);
            shuffle(rng, ev); shuffle(rng, od);
            const out: string[] = [];
            for (let k = 0; k < len; k++) out.push(k % 2 === 0 ? ev[k >> 1] : od[k >> 1]);
            if (ri(rng, 0, 3) === 0) out[ri(rng, 0, len - 1)] = alpha[ri(rng, 0, alpha.length - 1)];
            words.push(out.join(""));
          } else {
            words.push(randLower(rng, len, len, alpha));
          }
        }
        return { input: fmtStrArr(words), expectedOutput: String(ref(words)) };
      },
      solutions: {
        python: code`
          from typing import List

          def numSpecialEquivGroups(words: List[str]) -> int:
              seen = set()
              for w in words:
                  seen.add((''.join(sorted(w[0::2])), ''.join(sorted(w[1::2]))))
              return len(seen)
        `,
        javascript: code`
          var numSpecialEquivGroups = function(words) {
              var seen = new Set();
              for (var i = 0; i < words.length; i++) {
                  var w = words[i];
                  var ev = [], od = [];
                  for (var j = 0; j < w.length; j++) {
                      if (j % 2 === 0) ev.push(w[j]); else od.push(w[j]);
                  }
                  seen.add(ev.sort().join("") + "|" + od.sort().join(""));
              }
              return seen.size;
          };
        `,
        typescript: code`
          function numSpecialEquivGroups(words: string[]): number {
              var seen: { [k: string]: boolean } = {};
              var groups = 0;
              for (var i = 0; i < words.length; i++) {
                  var w = words[i];
                  var ev: string[] = [];
                  var od: string[] = [];
                  for (var j = 0; j < w.length; j++) {
                      if (j % 2 === 0) ev.push(w.charAt(j)); else od.push(w.charAt(j));
                  }
                  var key = ev.sort().join("") + "|" + od.sort().join("");
                  if (!seen[key]) {
                      seen[key] = true;
                      groups++;
                  }
              }
              return groups;
          }
        `,
        java: code`
          public static int numSpecialEquivGroups(String[] words) {
              Set<String> seen = new HashSet<>();
              for (String w : words) {
                  int[] cnt = new int[52];
                  for (int i = 0; i < w.length(); i++) cnt[(i % 2) * 26 + (w.charAt(i) - 'a')]++;
                  seen.add(Arrays.toString(cnt));
              }
              return seen.size();
          }
        `,
        cpp: code`
          int numSpecialEquivGroups(vector<string>& words) {
              set<vector<int>> seen;
              for (const string& w : words) {
                  vector<int> cnt(52, 0);
                  for (int i = 0; i < (int)w.size(); i++) cnt[(i % 2) * 26 + (w[i] - 'a')]++;
                  seen.insert(cnt);
              }
              return (int)seen.size();
          }
        `,
        c: code`
          int numSpecialEquivGroups(char** words, int wordsSize) {
              int* sig = (int*)malloc(sizeof(int) * 52 * (wordsSize + 1));
              int groups = 0;
              for (int i = 0; i < wordsSize; i++) {
                  int cur[52];
                  memset(cur, 0, sizeof(cur));
                  for (int j = 0; words[i][j]; j++) cur[(j % 2) * 26 + (words[i][j] - 'a')]++;
                  int found = 0;
                  for (int g = 0; g < groups && !found; g++) {
                      if (memcmp(sig + g * 52, cur, sizeof(cur)) == 0) found = 1;
                  }
                  if (!found) {
                      memcpy(sig + groups * 52, cur, sizeof(cur));
                      groups++;
                  }
              }
              free(sig);
              return groups;
          }
        `,
        csharp: code`
          public static int NumSpecialEquivGroups(string[] words)
          {
              var seen = new HashSet<string>();
              foreach (var w in words)
              {
                  var cnt = new int[52];
                  for (int i = 0; i < w.Length; i++) cnt[(i % 2) * 26 + (w[i] - 'a')]++;
                  seen.Add(string.Join(",", cnt));
              }
              return seen.Count;
          }
        `,
        go: code`
          func numSpecialEquivGroups(words []string) int {
          	seen := map[[52]int]bool{}
          	for _, w := range words {
          		var cnt [52]int
          		for i := 0; i < len(w); i++ {
          			cnt[(i%2)*26+int(w[i]-'a')]++
          		}
          		seen[cnt] = true
          	}
          	return len(seen)
          }
        `,
        kotlin: code`
          fun numSpecialEquivGroups(words: Array<String>): Int {
              val seen = HashSet<String>()
              for (w in words) {
                  val cnt = IntArray(52)
                  for (i in w.indices) cnt[(i % 2) * 26 + (w[i] - 'a')]++
                  seen.add(cnt.joinToString(","))
              }
              return seen.size
          }
        `,
        swift: code`
          func numSpecialEquivGroups(_ words: [String]) -> Int {
              var seen = Set<[Int]>()
              for w in words {
                  var cnt = [Int](repeating: 0, count: 52)
                  for (i, b) in w.utf8.enumerated() {
                      cnt[(i % 2) * 26 + Int(b) - 97] += 1
                  }
                  seen.insert(cnt)
              }
              return seen.count
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn numSpecialEquivGroups(words: Vec<String>) -> i32 {
              let mut seen: HashSet<Vec<i32>> = HashSet::new();
              for w in words.iter() {
                  let mut cnt = vec![0i32; 52];
                  for (i, b) in w.bytes().enumerate() {
                      cnt[(i % 2) * 26 + (b - b'a') as usize] += 1;
                  }
                  seen.insert(cnt);
              }
              seen.len() as i32
          }
        `,
        php: code`
          function numSpecialEquivGroups($words) {
              $seen = [];
              foreach ($words as $w) {
                  $cnt = array_fill(0, 52, 0);
                  $len = strlen($w);
                  for ($i = 0; $i < $len; $i++) $cnt[($i % 2) * 26 + ord($w[$i]) - 97]++;
                  $seen[implode(',', $cnt)] = true;
              }
              return count($seen);
          }
        `,
        ruby: code`
          def numSpecialEquivGroups(words)
            seen = {}
            words.each do |w|
              cnt = Array.new(52, 0)
              w.each_char.with_index { |c, i| cnt[(i % 2) * 26 + c.ord - 97] += 1 }
              seen[cnt] = true
            end
            seen.size
          end
        `,
      },
    };
  })(),

  // ── Occurrences After Bigram (LC 1078) ──────────────────────────
  (() => {
    const ref = (text: string, first: string, second: string) => {
      const w = text.split(" ");
      const out: string[] = [];
      for (let i = 2; i < w.length; i++) if (w[i - 2] === first && w[i - 1] === second) out.push(w[i]);
      return out;
    };
    return {
      slug: "occurrences-after-bigram",
      title: "Occurrences After Bigram",
      difficulty: "EASY" as const,
      tags: ["String", "Sliding Window", "Google", "Amazon"],
      signature: {
        funcName: "findOcurrences",
        params: [
          { name: "text", type: "string" as const },
          { name: "first", type: "string" as const },
          { name: "second", type: "string" as const },
        ],
        returns: "string[]" as const,
      },
      description: describe(
        "You are given a sentence `text` (lowercase words separated by single spaces) and two words `first` and `second`.\n\nWhenever three consecutive words of `text` read `first second third` — `first` immediately followed by `second`, immediately followed by some word `third` — that `third` word is an occurrence.\n\nReturn every such `third` word, in the order they appear in `text`. Occurrences may overlap, and the same word may be returned more than once.",
        [
          { in: "text = \"kairo solves bugs kairo solves duels\", first = \"kairo\", second = \"solves\"", out: "[\"bugs\",\"duels\"]" },
          { in: "text = \"we we we we\", first = \"we\", second = \"we\"", out: "[\"we\",\"we\"]", note: "The windows starting at the first and second words both match." },
          { in: "text = \"code fast\", first = \"code\", second = \"fast\"", out: "[]", note: "Nothing follows the bigram." },
        ],
        [
          "1 <= text.length <= 1000",
          "text consists of lowercase English letters and spaces",
          "all words in text are separated by a single space, with no leading or trailing spaces",
          "1 <= first.length, second.length <= 10",
          "first and second consist of lowercase English letters",
        ]),
      hints: [
        "Split the sentence into words first.",
        "Look at every window of three consecutive words.",
        "If the window's first two words are `first` and `second`, record the third — keep going even after a match, since windows overlap.",
      ],
      editorial: explain({
        idea: "After splitting into words the task is a fixed-width window: slide over every triple of consecutive words and test its first two.",
        steps: [
          "Split `text` on spaces into an array `w`.",
          "For every `i` from 0 while `i + 2 < w.length`, if `w[i] == first` and `w[i+1] == second`, append `w[i+2]`.",
          "Return the collected words.",
        ],
        why: "Every occurrence is identified by the index of its `first` word, and the loop tries every index that has two words after it, in increasing order — so each occurrence is reported once and in text order, overlapping ones included.",
        time: "O(|text|)",
        space: "O(|text|)",
        pitfalls: [
          "Compare whole words, not substrings — `\"we\"` must not match inside `\"web\"`.",
          "Do not skip ahead after a match: with `first == second` the windows overlap.",
          "Stop two words before the end so the third word exists.",
        ],
      }),
      examples: [
        { input: "\"kairo solves bugs kairo solves duels\"\n\"kairo\"\n\"solves\"", expectedOutput: "[\"bugs\",\"duels\"]" },
        { input: "\"we we we we\"\n\"we\"\n\"we\"", expectedOutput: "[\"we\",\"we\"]" },
        { input: "\"code fast\"\n\"code\"\n\"fast\"", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const pool = wordPool(rng, ri(rng, 1, 5), pick(rng, ["ab", "abc", "kairo"]), ri(rng, 1, 3));
        const text = sentenceFrom(rng, pool, ri(rng, 1, 22));
        const w = text.split(" ");
        let first: string, second: string;
        if (w.length >= 2 && ri(rng, 0, 1) === 0) {
          // a bigram that really occurs (it may still have no third word after it)
          const i = ri(rng, 0, w.length - 2);
          first = w[i];
          second = w[i + 1];
        } else {
          first = ri(rng, 0, 6) === 0 ? randLower(rng, 1, 3) : pick(rng, pool);
          second = ri(rng, 0, 6) === 0 ? randLower(rng, 1, 3) : pick(rng, pool);
        }
        return { input: `"${text}"\n"${first}"\n"${second}"`, expectedOutput: fmtStrArr(ref(text, first, second)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findOcurrences(text: str, first: str, second: str) -> List[str]:
              w = text.split()
              return [w[i + 2] for i in range(len(w) - 2) if w[i] == first and w[i + 1] == second]
        `,
        javascript: code`
          var findOcurrences = function(text, first, second) {
              var w = text.split(" ");
              var res = [];
              for (var i = 0; i + 2 < w.length; i++) {
                  if (w[i] === first && w[i + 1] === second) res.push(w[i + 2]);
              }
              return res;
          };
        `,
        typescript: code`
          function findOcurrences(text: string, first: string, second: string): string[] {
              var w: string[] = text.split(" ");
              var res: string[] = [];
              for (var i = 0; i + 2 < w.length; i++) {
                  if (w[i] === first && w[i + 1] === second) res.push(w[i + 2]);
              }
              return res;
          }
        `,
        java: code`
          public static String[] findOcurrences(String text, String first, String second) {
              String[] w = text.split(" ");
              List<String> res = new ArrayList<>();
              for (int i = 0; i + 2 < w.length; i++) {
                  if (w[i].equals(first) && w[i + 1].equals(second)) res.add(w[i + 2]);
              }
              return res.toArray(new String[0]);
          }
        `,
        cpp: code`
          vector<string> findOcurrences(string text, string first, string second) {
              vector<string> w;
              istringstream in1(text);
              string t;
              while (in1 >> t) w.push_back(t);
              vector<string> res;
              for (int i = 0; i + 2 < (int)w.size(); i++) {
                  if (w[i] == first && w[i + 1] == second) res.push_back(w[i + 2]);
              }
              return res;
          }
        `,
        c: code`
          char** findOcurrences(const char* text, const char* first, const char* second, int* returnSize) {
              int n = (int)strlen(text);
              char* buf = (char*)malloc(n + 1);
              memcpy(buf, text, n + 1);
              char** w = (char**)malloc(sizeof(char*) * (n + 1));
              int cnt = 0, i = 0;
              while (i < n) {
                  while (i < n && buf[i] == ' ') i++;
                  if (i >= n) break;
                  w[cnt++] = buf + i;
                  while (i < n && buf[i] != ' ') i++;
                  buf[i] = '\0';
                  i++;
              }
              char** res = (char**)malloc(sizeof(char*) * (cnt + 1));
              int k = 0;
              for (int j = 0; j + 2 < cnt; j++) {
                  if (strcmp(w[j], first) == 0 && strcmp(w[j + 1], second) == 0) res[k++] = w[j + 2];
              }
              *returnSize = k;
              return res;
          }
        `,
        csharp: code`
          public static string[] FindOcurrences(string text, string first, string second)
          {
              var w = text.Split(' ');
              var res = new List<string>();
              for (int i = 0; i + 2 < w.Length; i++)
              {
                  if (w[i] == first && w[i + 1] == second) res.Add(w[i + 2]);
              }
              return res.ToArray();
          }
        `,
        go: code`
          func findOcurrences(text string, first string, second string) []string {
          	w := strings.Fields(text)
          	res := []string{}
          	for i := 0; i+2 < len(w); i++ {
          		if w[i] == first && w[i+1] == second {
          			res = append(res, w[i+2])
          		}
          	}
          	return res
          }
        `,
        kotlin: code`
          fun findOcurrences(text: String, first: String, second: String): Array<String> {
              val w = text.split(" ")
              val res = ArrayList<String>()
              for (i in 0 until w.size - 2) {
                  if (w[i] == first && w[i + 1] == second) res.add(w[i + 2])
              }
              return res.toTypedArray()
          }
        `,
        swift: code`
          func findOcurrences(_ text: String, _ first: String, _ second: String) -> [String] {
              let w = text.split(separator: " ").map { String($0) }
              var res: [String] = []
              var i = 0
              while i + 2 < w.count {
                  if w[i] == first && w[i + 1] == second { res.append(w[i + 2]) }
                  i += 1
              }
              return res
          }
        `,
        rust: code`
          fn findOcurrences(text: String, first: String, second: String) -> Vec<String> {
              let w: Vec<&str> = text.split_whitespace().collect();
              let mut res: Vec<String> = Vec::new();
              let mut i = 0;
              while i + 2 < w.len() {
                  if w[i] == first.as_str() && w[i + 1] == second.as_str() {
                      res.push(w[i + 2].to_string());
                  }
                  i += 1;
              }
              res
          }
        `,
        php: code`
          function findOcurrences($text, $first, $second) {
              $w = explode(' ', $text);
              $n = count($w);
              $res = [];
              for ($i = 0; $i + 2 < $n; $i++) {
                  if ($w[$i] === $first && $w[$i + 1] === $second) $res[] = $w[$i + 2];
              }
              return $res;
          }
        `,
        ruby: code`
          def findOcurrences(text, first, second)
            w = text.split(' ')
            res = []
            (0...(w.length - 2)).each do |i|
              res << w[i + 2] if w[i] == first && w[i + 1] == second
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Increasing Decreasing String (LC 1370) ──────────────────────
  (() => {
    // Follows the statement literally on a sorted pool of characters.
    const ref = (s: string) => {
      const pool = s.split("").sort();
      let res = "";
      while (pool.length) {
        let last = "";
        for (;;) {
          let idx = -1;
          for (let i = 0; i < pool.length; i++) if (pool[i] > last) { idx = i; break; }
          if (idx < 0) break;
          last = pool[idx]; res += last; pool.splice(idx, 1);
        }
        last = "{";
        for (;;) {
          let idx = -1;
          for (let i = pool.length - 1; i >= 0; i--) if (pool[i] < last) { idx = i; break; }
          if (idx < 0) break;
          last = pool[idx]; res += last; pool.splice(idx, 1);
        }
      }
      return res;
    };
    return {
      slug: "increasing-decreasing-string",
      title: "Increasing Decreasing String",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon", "Adobe"],
      signature: { funcName: "sortString", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Rebuild the lowercase string `s` by repeatedly moving its characters to a result, using this procedure:\n\n1. Take the **smallest** character left in `s` and append it to the result.\n2. Take the smallest character left that is **strictly greater** than the last one appended, and append it. Repeat until no such character exists.\n3. Take the **largest** character left in `s` and append it.\n4. Take the largest character left that is **strictly smaller** than the last one appended, and append it. Repeat until no such character exists.\n5. Go back to step 1 until every character of `s` has been used.\n\nWhenever a character occurs several times you may take any copy — the result is the same. Return the result string.",
        [
          { in: "s = \"kairokairo\"", out: "aikorrokia", note: "Rising pass `aikor`, falling pass `rokia`." },
          { in: "s = \"codekairo\"", out: "acdeikoro", note: "Rising pass `acdeikor` leaves one `o` for the falling pass." },
          { in: "s = \"zzz\"", out: "zzz" },
        ],
        ["1 <= s.length <= 500", "s consists of only lowercase English letters"]),
      hints: [
        "Only how many copies of each letter are left matters, not where they were.",
        "Keep a count for each of the 26 letters.",
        "One rising pass is a walk a→z taking one copy of every letter still available; a falling pass is the same walk z→a. Alternate until the counts are empty.",
      ],
      editorial: explain({
        idea: "Each rising pass takes exactly one copy of every letter that is still available, in alphabetical order, and each falling pass does the same in reverse — so a 26-entry count table replaces any searching.",
        steps: [
          "Count the occurrences of each letter.",
          "While the result is shorter than `s`: walk the letters from `a` to `z`, appending each letter whose count is positive and decrementing it.",
          "Then walk from `z` to `a` the same way.",
          "Return the result.",
        ],
        why: "In a rising pass the first pick is the smallest available letter, and each following pick is the smallest available letter strictly greater than the previous one — exactly the next letter with a positive count in alphabetical order. The pass ends when no larger letter is left, i.e. when the walk reaches `z`. The falling pass is symmetric. Each full round removes at least one character, so the loop ends.",
        time: "O(26 · rounds + n) = O(n)",
        space: "O(1) besides the output",
        pitfalls: [
          "\"Strictly greater\" means one copy per letter per pass — duplicates wait for later passes.",
          "The falling pass starts from the largest remaining letter, not from the last letter appended.",
          "Stop as soon as all characters are used; an empty pass is harmless but the length check must cover both halves.",
        ],
      }),
      examples: [
        { input: "\"kairokairo\"", expectedOutput: "aikorrokia" },
        { input: "\"codekairo\"", expectedOutput: "acdeikoro" },
        { input: "\"zzz\"", expectedOutput: "zzz" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        const alpha = pick(rng, ["ab", "abc", "kairo", "xyz", "abcdefghijklmnopqrstuvwxyz"]);
        const s = cls === 0 ? randLower(rng, 1, 2, alpha) : randLower(rng, 1, cls < 4 ? 12 : 60, alpha);
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: code`
          def sortString(s: str) -> str:
              cnt = [0] * 26
              for c in s:
                  cnt[ord(c) - 97] += 1
              order = list(range(26)) + list(range(25, -1, -1))
              res = []
              while len(res) < len(s):
                  for i in order:
                      if cnt[i] > 0:
                          res.append(chr(97 + i))
                          cnt[i] -= 1
              return ''.join(res)
        `,
        javascript: code`
          var sortString = function(s) {
              var cnt = [];
              for (var z = 0; z < 26; z++) cnt.push(0);
              for (var i = 0; i < s.length; i++) cnt[s.charCodeAt(i) - 97]++;
              var res = [];
              while (res.length < s.length) {
                  for (var a = 0; a < 26; a++) if (cnt[a] > 0) { res.push(String.fromCharCode(97 + a)); cnt[a]--; }
                  for (var b = 25; b >= 0; b--) if (cnt[b] > 0) { res.push(String.fromCharCode(97 + b)); cnt[b]--; }
              }
              return res.join("");
          };
        `,
        typescript: code`
          function sortString(s: string): string {
              var cnt: number[] = [];
              for (var z = 0; z < 26; z++) cnt.push(0);
              for (var i = 0; i < s.length; i++) cnt[s.charCodeAt(i) - 97]++;
              var res: string[] = [];
              while (res.length < s.length) {
                  for (var a = 0; a < 26; a++) if (cnt[a] > 0) { res.push(String.fromCharCode(97 + a)); cnt[a]--; }
                  for (var b = 25; b >= 0; b--) if (cnt[b] > 0) { res.push(String.fromCharCode(97 + b)); cnt[b]--; }
              }
              return res.join("");
          }
        `,
        java: code`
          public static String sortString(String s) {
              int[] cnt = new int[26];
              for (int i = 0; i < s.length(); i++) cnt[s.charAt(i) - 'a']++;
              StringBuilder res = new StringBuilder();
              while (res.length() < s.length()) {
                  for (int a = 0; a < 26; a++) if (cnt[a] > 0) { res.append((char) ('a' + a)); cnt[a]--; }
                  for (int b = 25; b >= 0; b--) if (cnt[b] > 0) { res.append((char) ('a' + b)); cnt[b]--; }
              }
              return res.toString();
          }
        `,
        cpp: code`
          string sortString(string s) {
              int cnt[26] = {0};
              for (char c : s) cnt[c - 'a']++;
              string res;
              while (res.size() < s.size()) {
                  for (int a = 0; a < 26; a++) if (cnt[a] > 0) { res += (char)('a' + a); cnt[a]--; }
                  for (int b = 25; b >= 0; b--) if (cnt[b] > 0) { res += (char)('a' + b); cnt[b]--; }
              }
              return res;
          }
        `,
        c: code`
          char* sortString(const char* s) {
              int n = (int)strlen(s);
              int cnt[26] = {0};
              for (int i = 0; i < n; i++) cnt[s[i] - 'a']++;
              char* res = (char*)malloc(n + 1);
              int k = 0;
              while (k < n) {
                  for (int a = 0; a < 26; a++) if (cnt[a] > 0) { res[k++] = (char)('a' + a); cnt[a]--; }
                  for (int b = 25; b >= 0; b--) if (cnt[b] > 0) { res[k++] = (char)('a' + b); cnt[b]--; }
              }
              res[k] = '\0';
              return res;
          }
        `,
        csharp: code`
          public static string SortString(string s)
          {
              var cnt = new int[26];
              foreach (char c in s) cnt[c - 'a']++;
              var res = new char[s.Length];
              int k = 0;
              while (k < s.Length)
              {
                  for (int a = 0; a < 26; a++) if (cnt[a] > 0) { res[k++] = (char)('a' + a); cnt[a]--; }
                  for (int b = 25; b >= 0; b--) if (cnt[b] > 0) { res[k++] = (char)('a' + b); cnt[b]--; }
              }
              return new string(res);
          }
        `,
        go: code`
          func sortString(s string) string {
          	cnt := make([]int, 26)
          	for i := 0; i < len(s); i++ {
          		cnt[s[i]-'a']++
          	}
          	res := make([]byte, 0, len(s))
          	for len(res) < len(s) {
          		for a := 0; a < 26; a++ {
          			if cnt[a] > 0 {
          				res = append(res, byte('a'+a))
          				cnt[a]--
          			}
          		}
          		for b := 25; b >= 0; b-- {
          			if cnt[b] > 0 {
          				res = append(res, byte('a'+b))
          				cnt[b]--
          			}
          		}
          	}
          	return string(res)
          }
        `,
        kotlin: code`
          fun sortString(s: String): String {
              val cnt = IntArray(26)
              for (c in s) cnt[c - 'a']++
              val res = StringBuilder()
              while (res.length < s.length) {
                  for (a in 0 until 26) if (cnt[a] > 0) { res.append('a' + a); cnt[a]-- }
                  for (b in 25 downTo 0) if (cnt[b] > 0) { res.append('a' + b); cnt[b]-- }
              }
              return res.toString()
          }
        `,
        swift: code`
          func sortString(_ s: String) -> String {
              let letters = Array("abcdefghijklmnopqrstuvwxyz")
              var cnt = [Int](repeating: 0, count: 26)
              for b in s.utf8 { cnt[Int(b) - 97] += 1 }
              let n = s.utf8.count
              var res: [Character] = []
              while res.count < n {
                  for a in 0..<26 where cnt[a] > 0 {
                      res.append(letters[a])
                      cnt[a] -= 1
                  }
                  for b in stride(from: 25, through: 0, by: -1) where cnt[b] > 0 {
                      res.append(letters[b])
                      cnt[b] -= 1
                  }
              }
              return String(res)
          }
        `,
        rust: code`
          fn sortString(s: String) -> String {
              let mut cnt = [0usize; 26];
              for b in s.bytes() {
                  cnt[(b - b'a') as usize] += 1;
              }
              let n = s.len();
              let mut res: Vec<u8> = Vec::with_capacity(n);
              while res.len() < n {
                  for a in 0..26 {
                      if cnt[a] > 0 {
                          res.push(b'a' + a as u8);
                          cnt[a] -= 1;
                      }
                  }
                  for b in (0..26).rev() {
                      if cnt[b] > 0 {
                          res.push(b'a' + b as u8);
                          cnt[b] -= 1;
                      }
                  }
              }
              String::from_utf8(res).unwrap()
          }
        `,
        php: code`
          function sortString($s) {
              $n = strlen($s);
              $cnt = array_fill(0, 26, 0);
              for ($i = 0; $i < $n; $i++) $cnt[ord($s[$i]) - 97]++;
              $res = '';
              while (strlen($res) < $n) {
                  for ($a = 0; $a < 26; $a++) if ($cnt[$a] > 0) { $res .= chr(97 + $a); $cnt[$a]--; }
                  for ($b = 25; $b >= 0; $b--) if ($cnt[$b] > 0) { $res .= chr(97 + $b); $cnt[$b]--; }
              }
              return $res;
          }
        `,
        ruby: code`
          def sortString(s)
            cnt = Array.new(26, 0)
            s.each_byte { |b| cnt[b - 97] += 1 }
            res = []
            order = (0...26).to_a + 25.downto(0).to_a
            while res.length < s.length
              order.each do |i|
                next unless cnt[i] > 0
                res << (97 + i).chr
                cnt[i] -= 1
              end
            end
            res.join
          end
        `,
      },
    };
  })(),

  // ── String Matching in an Array (LC 1408) ───────────────────────
  (() => {
    const ref = (words: string[]) =>
      words.filter((w, i) => words.some((x, j) => j !== i && x.includes(w)));
    return {
      slug: "string-matching-in-an-array",
      title: "String Matching in an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "String Matching", "Amazon", "Microsoft"],
      signature: { funcName: "stringMatching", params: [{ name: "words", type: "string[]" as const }], returns: "string[]" as const },
      description: describe(
        "You are given an array `words` of distinct lowercase strings.\n\nReturn every string of `words` that occurs as a **substring** (a contiguous run of characters) of some **other** string of `words`. List them in the order they appear in `words`; return an empty list if there are none.",
        [
          { in: "words = [\"kairo\",\"air\",\"code\",\"od\",\"duel\"]", out: "[\"air\",\"od\"]", note: "`\"air\"` sits inside `\"kairo\"` and `\"od\"` inside `\"code\"`." },
          { in: "words = [\"bug\",\"hunt\",\"bughunt\"]", out: "[\"bug\",\"hunt\"]" },
          { in: "words = [\"abc\",\"xyz\"]", out: "[]" },
        ],
        ["1 <= words.length <= 100", "1 <= words[i].length <= 30", "words[i] contains only lowercase English letters", "all the strings of words are unique"]),
      hints: [
        "With at most 100 short words, comparing every pair is cheap.",
        "For each word, look for another word (a different index) that contains it.",
        "Stop searching for a word as soon as one container is found, so it is reported only once.",
      ],
      editorial: explain({
        idea: "The limits are tiny, so test every ordered pair `(i, j)` with `i != j` and ask whether `words[j]` contains `words[i]` using the language's substring search.",
        steps: [
          "For each index `i` in order:",
          "Scan every `j != i`; if `words[i]` is a substring of `words[j]`, append `words[i]` to the answer and stop scanning for this `i`.",
          "Return the answer.",
        ],
        why: "A word belongs to the answer exactly when some other word contains it, which is what the inner scan checks. Breaking after the first container keeps each word at most once, and the outer loop runs in input order.",
        time: "O(n² · L²) worst case with naive substring search (L ≤ 30)",
        space: "O(1) besides the output",
        pitfalls: [
          "Skip `j == i`: every word contains itself.",
          "Report a word once even if several words contain it.",
          "Only a longer (or equal-length, impossible here since words are distinct) word can contain another — an optional speed-up, not a requirement.",
        ],
      }),
      examples: [
        { input: "[\"kairo\",\"air\",\"code\",\"od\",\"duel\"]", expectedOutput: "[\"air\",\"od\"]" },
        { input: "[\"bug\",\"hunt\",\"bughunt\"]", expectedOutput: "[\"bug\",\"hunt\"]" },
        { input: "[\"abc\",\"xyz\"]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "kairo", "abcdefghijklmnopqrstuvwxyz"]);
        const target = ri(rng, 1, 12);
        const set = new Set<string>();
        let guard = 0;
        while (set.size < target && guard++ < 300) {
          const have = [...set];
          if (have.length && ri(rng, 0, 2) === 0) {
            const w = pick(rng, have);
            const a = ri(rng, 0, w.length - 1);
            set.add(w.slice(a, ri(rng, a + 1, w.length)));
          } else set.add(randLower(rng, 1, 8, alpha));
        }
        const words = shuffle(rng, [...set]);
        return { input: fmtStrArr(words), expectedOutput: fmtStrArr(ref(words)) };
      },
      solutions: {
        python: code`
          from typing import List

          def stringMatching(words: List[str]) -> List[str]:
              res = []
              for i, w in enumerate(words):
                  if any(i != j and w in x for j, x in enumerate(words)):
                      res.append(w)
              return res
        `,
        javascript: code`
          var stringMatching = function(words) {
              var res = [];
              for (var i = 0; i < words.length; i++) {
                  for (var j = 0; j < words.length; j++) {
                      if (i !== j && words[j].indexOf(words[i]) >= 0) {
                          res.push(words[i]);
                          break;
                      }
                  }
              }
              return res;
          };
        `,
        typescript: code`
          function stringMatching(words: string[]): string[] {
              var res: string[] = [];
              for (var i = 0; i < words.length; i++) {
                  for (var j = 0; j < words.length; j++) {
                      if (i !== j && words[j].indexOf(words[i]) >= 0) {
                          res.push(words[i]);
                          break;
                      }
                  }
              }
              return res;
          }
        `,
        java: code`
          public static String[] stringMatching(String[] words) {
              List<String> res = new ArrayList<>();
              for (int i = 0; i < words.length; i++) {
                  for (int j = 0; j < words.length; j++) {
                      if (i != j && words[j].contains(words[i])) {
                          res.add(words[i]);
                          break;
                      }
                  }
              }
              return res.toArray(new String[0]);
          }
        `,
        cpp: code`
          vector<string> stringMatching(vector<string>& words) {
              vector<string> res;
              int n = words.size();
              for (int i = 0; i < n; i++) {
                  for (int j = 0; j < n; j++) {
                      if (i != j && words[j].find(words[i]) != string::npos) {
                          res.push_back(words[i]);
                          break;
                      }
                  }
              }
              return res;
          }
        `,
        c: code`
          char** stringMatching(char** words, int wordsSize, int* returnSize) {
              char** res = (char**)malloc(sizeof(char*) * (wordsSize + 1));
              int k = 0;
              for (int i = 0; i < wordsSize; i++) {
                  for (int j = 0; j < wordsSize; j++) {
                      if (i != j && strstr(words[j], words[i]) != NULL) {
                          res[k++] = words[i];
                          break;
                      }
                  }
              }
              *returnSize = k;
              return res;
          }
        `,
        csharp: code`
          public static string[] StringMatching(string[] words)
          {
              var res = new List<string>();
              for (int i = 0; i < words.Length; i++)
              {
                  for (int j = 0; j < words.Length; j++)
                  {
                      if (i != j && words[j].Contains(words[i]))
                      {
                          res.Add(words[i]);
                          break;
                      }
                  }
              }
              return res.ToArray();
          }
        `,
        go: code`
          func stringMatching(words []string) []string {
          	res := []string{}
          	for i := range words {
          		for j := range words {
          			if i != j && strings.Contains(words[j], words[i]) {
          				res = append(res, words[i])
          				break
          			}
          		}
          	}
          	return res
          }
        `,
        kotlin: code`
          fun stringMatching(words: Array<String>): Array<String> {
              val res = ArrayList<String>()
              for (i in words.indices) {
                  for (j in words.indices) {
                      if (i != j && words[j].contains(words[i])) {
                          res.add(words[i])
                          break
                      }
                  }
              }
              return res.toTypedArray()
          }
        `,
        swift: code`
          func stringMatching(_ words: [String]) -> [String] {
              var res: [String] = []
              for i in 0..<words.count {
                  for j in 0..<words.count {
                      if i != j && words[j].range(of: words[i]) != nil {
                          res.append(words[i])
                          break
                      }
                  }
              }
              return res
          }
        `,
        rust: code`
          fn stringMatching(words: Vec<String>) -> Vec<String> {
              let mut res: Vec<String> = Vec::new();
              for i in 0..words.len() {
                  for j in 0..words.len() {
                      if i != j && words[j].contains(words[i].as_str()) {
                          res.push(words[i].clone());
                          break;
                      }
                  }
              }
              res
          }
        `,
        php: code`
          function stringMatching($words) {
              $res = [];
              $n = count($words);
              for ($i = 0; $i < $n; $i++) {
                  for ($j = 0; $j < $n; $j++) {
                      if ($i != $j && strpos($words[$j], $words[$i]) !== false) {
                          $res[] = $words[$i];
                          break;
                      }
                  }
              }
              return $res;
          }
        `,
        ruby: code`
          def stringMatching(words)
            res = []
            words.each_with_index do |w, i|
              found = false
              words.each_with_index do |x, j|
                if i != j && x.include?(w)
                  found = true
                  break
                end
              end
              res << w if found
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Consecutive Characters (LC 1446) ────────────────────────────
  (() => {
    const ref = (s: string) => {
      let best = 0;
      for (let i = 0; i < s.length; i++) {
        let j = i;
        while (j < s.length && s[j] === s[i]) j++;
        best = Math.max(best, j - i);
      }
      return best;
    };
    return {
      slug: "consecutive-characters",
      title: "Consecutive Characters",
      difficulty: "EASY" as const,
      tags: ["String", "Two Pointers", "Microsoft", "Google"],
      signature: { funcName: "maxPower", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "The **power** of a string is the length of its longest non-empty substring made of a single repeated character.\n\nGiven a lowercase string `s`, return its power.",
        [
          { in: "s = \"keeeeeep\"", out: "6", note: "The substring `\"eeeeee\"` has length 6." },
          { in: "s = \"codekairo\"", out: "1" },
          { in: "s = \"aabbbbcc\"", out: "4" },
        ],
        ["1 <= s.length <= 500", "s consists of only lowercase English letters"]),
      hints: [
        "Only runs of equal adjacent characters matter.",
        "Scan once, tracking the length of the current run.",
        "Extend the run when a character equals the previous one, otherwise restart it at 1; keep the maximum.",
      ],
      editorial: explain({
        idea: "The answer is the longest run of equal adjacent characters, which a single pass with a running counter finds.",
        steps: [
          "Set `best = run = 1`.",
          "For `i` from 1: if `s[i] == s[i-1]`, increment `run`, otherwise reset `run = 1`.",
          "After each step set `best = max(best, run)`.",
          "Return `best`.",
        ],
        why: "Any single-character substring lies inside one maximal run, so its length is at most that run's length; the counter measures each maximal run in full before it is reset, so the maximum over runs is found.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Start `best` at 1, not 0 — a one-character string has power 1.",
          "Update the maximum while the run grows, or the final run at the end of the string is missed.",
        ],
      }),
      examples: [
        { input: "\"keeeeeep\"", expectedOutput: "6" },
        { input: "\"codekairo\"", expectedOutput: "1" },
        { input: "\"aabbbbcc\"", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        let s: string;
        if (cls === 0) s = randLower(rng, 1, 3);
        else if (cls === 1) s = pick(rng, ["a", "k", "z"]).repeat(ri(rng, 1, 60));
        else {
          const alpha = pick(rng, ["ab", "abc", "kairo", "abcdefghijklmnopqrstuvwxyz"]);
          const runs = ri(rng, 1, 14);
          s = "";
          for (let r = 0; r < runs; r++) s += alpha[ri(rng, 0, alpha.length - 1)].repeat(ri(rng, 1, 7));
        }
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def maxPower(s: str) -> int:
              best = run = 1
              for i in range(1, len(s)):
                  run = run + 1 if s[i] == s[i - 1] else 1
                  best = max(best, run)
              return best
        `,
        javascript: code`
          var maxPower = function(s) {
              var best = 1, run = 1;
              for (var i = 1; i < s.length; i++) {
                  run = s[i] === s[i - 1] ? run + 1 : 1;
                  if (run > best) best = run;
              }
              return best;
          };
        `,
        typescript: code`
          function maxPower(s: string): number {
              var best = 1, run = 1;
              for (var i = 1; i < s.length; i++) {
                  run = s.charAt(i) === s.charAt(i - 1) ? run + 1 : 1;
                  if (run > best) best = run;
              }
              return best;
          }
        `,
        java: code`
          public static int maxPower(String s) {
              int best = 1, run = 1;
              for (int i = 1; i < s.length(); i++) {
                  run = s.charAt(i) == s.charAt(i - 1) ? run + 1 : 1;
                  best = Math.max(best, run);
              }
              return best;
          }
        `,
        cpp: code`
          int maxPower(string s) {
              int best = 1, run = 1;
              for (int i = 1; i < (int)s.size(); i++) {
                  run = s[i] == s[i - 1] ? run + 1 : 1;
                  best = max(best, run);
              }
              return best;
          }
        `,
        c: code`
          int maxPower(const char* s) {
              int best = 1, run = 1;
              for (int i = 1; s[i]; i++) {
                  run = s[i] == s[i - 1] ? run + 1 : 1;
                  if (run > best) best = run;
              }
              return best;
          }
        `,
        csharp: code`
          public static int MaxPower(string s)
          {
              int best = 1, run = 1;
              for (int i = 1; i < s.Length; i++)
              {
                  run = s[i] == s[i - 1] ? run + 1 : 1;
                  best = Math.Max(best, run);
              }
              return best;
          }
        `,
        go: code`
          func maxPower(s string) int {
          	best, run := 1, 1
          	for i := 1; i < len(s); i++ {
          		if s[i] == s[i-1] {
          			run++
          		} else {
          			run = 1
          		}
          		if run > best {
          			best = run
          		}
          	}
          	return best
          }
        `,
        kotlin: code`
          fun maxPower(s: String): Int {
              var best = 1
              var run = 1
              for (i in 1 until s.length) {
                  run = if (s[i] == s[i - 1]) run + 1 else 1
                  if (run > best) best = run
              }
              return best
          }
        `,
        swift: code`
          func maxPower(_ s: String) -> Int {
              let a = Array(s.utf8)
              var best = 1
              var run = 1
              var i = 1
              while i < a.count {
                  run = a[i] == a[i - 1] ? run + 1 : 1
                  if run > best { best = run }
                  i += 1
              }
              return best
          }
        `,
        rust: code`
          fn maxPower(s: String) -> i32 {
              let b = s.as_bytes();
              let mut best = 1;
              let mut run = 1;
              for i in 1..b.len() {
                  run = if b[i] == b[i - 1] { run + 1 } else { 1 };
                  if run > best {
                      best = run;
                  }
              }
              best
          }
        `,
        php: code`
          function maxPower($s) {
              $best = 1;
              $run = 1;
              $n = strlen($s);
              for ($i = 1; $i < $n; $i++) {
                  $run = $s[$i] === $s[$i - 1] ? $run + 1 : 1;
                  if ($run > $best) $best = $run;
              }
              return $best;
          }
        `,
        ruby: code`
          def maxPower(s)
            best = 1
            run = 1
            (1...s.length).each do |i|
              run = s[i] == s[i - 1] ? run + 1 : 1
              best = run if run > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Path Crossing (LC 1496) ─────────────────────────────────────
  (() => {
    const ref = (path: string) => {
      const seen: number[][] = [[0, 0]];
      let x = 0, y = 0;
      for (const c of path) {
        if (c === "N") y++;
        else if (c === "S") y--;
        else if (c === "E") x++;
        else x--;
        if (seen.some((p) => p[0] === x && p[1] === y)) return true;
        seen.push([x, y]);
      }
      return false;
    };
    return {
      slug: "path-crossing",
      title: "Path Crossing",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Amazon", "Google"],
      signature: { funcName: "isPathCrossing", params: [{ name: "path", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A walker starts at the origin `(0, 0)` of a grid and follows the instructions in `path`, one character per step: `'N'` moves one unit north (`y + 1`), `'S'` one unit south (`y - 1`), `'E'` one unit east (`x + 1`) and `'W'` one unit west (`x - 1`).\n\nReturn `true` if the walker ever stands on a point it has already visited — the origin counts as visited from the start — and `false` otherwise.",
        [
          { in: "path = \"NNEE\"", out: "false" },
          { in: "path = \"NEWS\"", out: "true", note: "After `N` and `E` the walker is at (1,1); `W` brings it back to (0,1)." },
          { in: "path = \"EESWWN\"", out: "true", note: "The last step returns to the origin." },
        ],
        ["1 <= path.length <= 10^4", "path[i] is either 'N', 'S', 'E' or 'W'"]),
      hints: [
        "Track the walker's coordinates as you read the instructions.",
        "You need to remember every point visited so far, starting with the origin.",
        "Store the points in a hash set (encode a point as one number or a string); the first time a new position is already in the set, answer true.",
      ],
      editorial: explain({
        idea: "Simulate the walk and keep every visited point in a hash set; a crossing is simply a position that is already in the set.",
        steps: [
          "Put `(0, 0)` into an empty set and start at `x = y = 0`.",
          "For each character, update `x` or `y`.",
          "If `(x, y)` is already in the set, return `true`; otherwise add it.",
          "If the walk ends without a repeat, return `false`.",
        ],
        why: "The set holds exactly the points visited before the current step, so the check answers \"has this point been visited already\" at every step. Encoding a point as a single integer such as `(x + 10001) * 20003 + (y + 10001)` is collision-free because both coordinates stay within ±10^4.",
        time: "O(n) expected",
        space: "O(n)",
        pitfalls: [
          "The origin is visited before the first move — `\"NS\"` crosses.",
          "Encoding a point as `x * 10 + y` (or concatenating digits without a separator) makes different points collide.",
          "Checking only for a return to the origin misses crossings elsewhere.",
        ],
      }),
      examples: [
        { input: "\"NNEE\"", expectedOutput: "false" },
        { input: "\"NEWS\"", expectedOutput: "true" },
        { input: "\"EESWWN\"", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        let path: string;
        if (cls < 4) path = randLower(rng, 1, cls === 0 ? 4 : 40, "NSEW");
        else {
          // two non-opposite directions never revisit a point; a stray last step may
          path = randLower(rng, 1, 40, pick(rng, ["NE", "NW", "SE", "SW", "N", "W", "NNE", "SWW"]));
          if (cls >= 8) path += pick(rng, ["N", "S", "E", "W"]);
        }
        return { input: `"${path}"`, expectedOutput: bool(ref(path)) };
      },
      solutions: {
        python: code`
          def isPathCrossing(path: str) -> bool:
              moves = {'N': (0, 1), 'S': (0, -1), 'E': (1, 0), 'W': (-1, 0)}
              x = y = 0
              seen = {(0, 0)}
              for c in path:
                  dx, dy = moves[c]
                  x += dx
                  y += dy
                  if (x, y) in seen:
                      return True
                  seen.add((x, y))
              return False
        `,
        javascript: code`
          var isPathCrossing = function(path) {
              var x = 0, y = 0;
              var seen = new Set(["0,0"]);
              for (var i = 0; i < path.length; i++) {
                  var c = path[i];
                  if (c === "N") y++;
                  else if (c === "S") y--;
                  else if (c === "E") x++;
                  else x--;
                  var key = x + "," + y;
                  if (seen.has(key)) return true;
                  seen.add(key);
              }
              return false;
          };
        `,
        typescript: code`
          function isPathCrossing(path: string): boolean {
              var x = 0, y = 0;
              var seen: { [k: string]: boolean } = { "0,0": true };
              for (var i = 0; i < path.length; i++) {
                  var c = path.charAt(i);
                  if (c === "N") y++;
                  else if (c === "S") y--;
                  else if (c === "E") x++;
                  else x--;
                  var key = x + "," + y;
                  if (seen[key]) return true;
                  seen[key] = true;
              }
              return false;
          }
        `,
        java: code`
          public static boolean isPathCrossing(String path) {
              Set<Integer> seen = new HashSet<>();
              int x = 0, y = 0;
              seen.add(10001 * 20003 + 10001);
              for (int i = 0; i < path.length(); i++) {
                  char c = path.charAt(i);
                  if (c == 'N') y++;
                  else if (c == 'S') y--;
                  else if (c == 'E') x++;
                  else x--;
                  if (!seen.add((x + 10001) * 20003 + (y + 10001))) return true;
              }
              return false;
          }
        `,
        cpp: code`
          bool isPathCrossing(string path) {
              set<pair<int, int>> seen;
              int x = 0, y = 0;
              seen.insert({0, 0});
              for (char c : path) {
                  if (c == 'N') y++;
                  else if (c == 'S') y--;
                  else if (c == 'E') x++;
                  else x--;
                  if (!seen.insert({x, y}).second) return true;
              }
              return false;
          }
        `,
        c: code`
          static int pcCmp(const void* a, const void* b) {
              int x = *(const int*)a, y = *(const int*)b;
              return (x > y) - (x < y);
          }

          bool isPathCrossing(const char* path) {
              int n = (int)strlen(path);
              int* codes = (int*)malloc(sizeof(int) * (n + 1));
              int x = 0, y = 0;
              codes[0] = 10001 * 20003 + 10001;
              for (int i = 0; i < n; i++) {
                  char c = path[i];
                  if (c == 'N') y++;
                  else if (c == 'S') y--;
                  else if (c == 'E') x++;
                  else x--;
                  codes[i + 1] = (x + 10001) * 20003 + (y + 10001);
              }
              qsort(codes, n + 1, sizeof(int), pcCmp);
              bool crossed = false;
              for (int i = 1; i <= n; i++) {
                  if (codes[i] == codes[i - 1]) { crossed = true; break; }
              }
              free(codes);
              return crossed;
          }
        `,
        csharp: code`
          public static bool IsPathCrossing(string path)
          {
              var seen = new HashSet<int>();
              int x = 0, y = 0;
              seen.Add(10001 * 20003 + 10001);
              foreach (char c in path)
              {
                  if (c == 'N') y++;
                  else if (c == 'S') y--;
                  else if (c == 'E') x++;
                  else x--;
                  if (!seen.Add((x + 10001) * 20003 + (y + 10001))) return true;
              }
              return false;
          }
        `,
        go: code`
          func isPathCrossing(path string) bool {
          	seen := map[[2]int]bool{{0, 0}: true}
          	x, y := 0, 0
          	for i := 0; i < len(path); i++ {
          		switch path[i] {
          		case 'N':
          			y++
          		case 'S':
          			y--
          		case 'E':
          			x++
          		default:
          			x--
          		}
          		p := [2]int{x, y}
          		if seen[p] {
          			return true
          		}
          		seen[p] = true
          	}
          	return false
          }
        `,
        kotlin: code`
          fun isPathCrossing(path: String): Boolean {
              val seen = HashSet<Int>()
              var x = 0
              var y = 0
              seen.add(10001 * 20003 + 10001)
              for (c in path) {
                  when (c) {
                      'N' -> y++
                      'S' -> y--
                      'E' -> x++
                      else -> x--
                  }
                  if (!seen.add((x + 10001) * 20003 + (y + 10001))) return true
              }
              return false
          }
        `,
        swift: code`
          func isPathCrossing(_ path: String) -> Bool {
              var seen = Set<Int>()
              var x = 0
              var y = 0
              seen.insert(10001 * 20003 + 10001)
              for c in path {
                  if c == "N" { y += 1 }
                  else if c == "S" { y -= 1 }
                  else if c == "E" { x += 1 }
                  else { x -= 1 }
                  if !seen.insert((x + 10001) * 20003 + (y + 10001)).inserted { return true }
              }
              return false
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn isPathCrossing(path: String) -> bool {
              let mut seen: HashSet<(i32, i32)> = HashSet::new();
              let (mut x, mut y) = (0i32, 0i32);
              seen.insert((0, 0));
              for c in path.bytes() {
                  match c {
                      b'N' => y += 1,
                      b'S' => y -= 1,
                      b'E' => x += 1,
                      _ => x -= 1,
                  }
                  if !seen.insert((x, y)) {
                      return true;
                  }
              }
              false
          }
        `,
        php: code`
          function isPathCrossing($path) {
              $x = 0;
              $y = 0;
              $seen = ['0,0' => true];
              $n = strlen($path);
              for ($i = 0; $i < $n; $i++) {
                  $c = $path[$i];
                  if ($c === 'N') $y++;
                  elseif ($c === 'S') $y--;
                  elseif ($c === 'E') $x++;
                  else $x--;
                  $key = $x . ',' . $y;
                  if (isset($seen[$key])) return true;
                  $seen[$key] = true;
              }
              return false;
          }
        `,
        ruby: code`
          def isPathCrossing(path)
            x = 0
            y = 0
            seen = { [0, 0] => true }
            path.each_char do |c|
              case c
              when 'N' then y += 1
              when 'S' then y -= 1
              when 'E' then x += 1
              else x -= 1
              end
              return true if seen[[x, y]]
              seen[[x, y]] = true
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Reformat Date (LC 1507) ─────────────────────────────────────
  (() => {
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const ref = (date: string) => {
      const m = /^(\d+)(st|nd|rd|th) ([A-Z][a-z]{2}) (\d{4})$/.exec(date);
      if (!m) throw new Error(`bad date ${date}`);
      const pad = (v: number) => (v < 10 ? "0" : "") + v;
      return `${m[4]}-${pad(MONTHS.indexOf(m[3]) + 1)}-${pad(Number(m[1]))}`;
    };
    return {
      slug: "reformat-date",
      title: "Reformat Date",
      difficulty: "EASY" as const,
      tags: ["String", "Simulation", "Amazon", "Bloomberg"],
      signature: { funcName: "reformatDate", params: [{ name: "date", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A date is written as `\"Day Month Year\"`, where:\n\n- `Day` is an ordinal such as `\"1st\"`, `\"2nd\"`, `\"3rd\"`, `\"4th\"`, …, `\"30th\"`, `\"31st\"`;\n- `Month` is one of `\"Jan\"`, `\"Feb\"`, `\"Mar\"`, `\"Apr\"`, `\"May\"`, `\"Jun\"`, `\"Jul\"`, `\"Aug\"`, `\"Sep\"`, `\"Oct\"`, `\"Nov\"`, `\"Dec\"`;\n- `Year` is a four-digit year between 1900 and 2100.\n\nConvert it to the `YYYY-MM-DD` format: the four-digit year, the two-digit month and the two-digit day, joined by dashes. The given date is always a real calendar date.",
        [
          { in: "date = \"2nd Oct 2026\"", out: '"2026-10-02"' },
          { in: "date = \"31st Dec 1999\"", out: '"1999-12-31"' },
          { in: "date = \"13th Mar 2100\"", out: '"2100-03-13"' },
        ],
        ["the given dates are guaranteed to be valid", "the year is in the range [1900, 2100]"]),
      hints: [
        "Split the date on spaces into its three parts.",
        "The day is the number in front of its two-letter suffix (`st`, `nd`, `rd` or `th`).",
        "Look the month up in a 12-entry table, then pad the month and day to two digits.",
      ],
      editorial: explain({
        idea: "The input is fully structured, so this is a parsing exercise: split into three tokens, strip the ordinal suffix from the day, map the month name to its number and print with zero-padding.",
        steps: [
          "Split `date` on spaces into `day`, `month`, `year`.",
          "Drop the last two characters of `day` and read the rest as a number.",
          "Find `month` in the list `Jan … Dec`; its 1-based position is the month number.",
          "Return `year + \"-\" + pad2(month) + \"-\" + pad2(day)`.",
        ],
        why: "Every suffix is exactly two letters, so removing two characters leaves the digits whatever the number. The year is already four digits, and padding month and day to width two produces the required fixed-width format.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Days 1–9 and months 1–9 need a leading zero.",
          "Do not try to strip `\"st\"` with a search — `\"1st\"` and `\"21st\"` both end in it, but cutting a fixed two characters is simpler and always right.",
          "The month is a 1-based number; a 0-based table index must be shifted.",
        ],
      }),
      examples: [
        { input: "\"2nd Oct 2026\"", expectedOutput: "2026-10-02" },
        { input: "\"31st Dec 1999\"", expectedOutput: "1999-12-31" },
        { input: "\"13th Mar 2100\"", expectedOutput: "2100-03-13" },
      ],
      gen: (rng: Rng) => {
        const year = ri(rng, 0, 9) === 0 ? pick(rng, [1900, 2000, 2024, 2100]) : ri(rng, 1900, 2100);
        const month = ri(rng, 1, 12);
        const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        const dim = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
        const day = ri(rng, 0, 3) === 0 ? pick(rng, [1, 2, 3, 11, 12, 13, 21, 22, 23, dim]) : ri(rng, 1, dim);
        const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
        const date = `${day}${suffix} ${MONTHS[month - 1]} ${year}`;
        return { input: `"${date}"`, expectedOutput: ref(date) };
      },
      solutions: {
        python: code`
          def reformatDate(date: str) -> str:
              months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
              d, m, y = date.split()
              return "%s-%02d-%02d" % (y, months.index(m) + 1, int(d[:-2]))
        `,
        javascript: code`
          var reformatDate = function(date) {
              var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              var p = date.split(" ");
              var day = parseInt(p[0].slice(0, p[0].length - 2), 10);
              var mon = months.indexOf(p[1]) + 1;
              return p[2] + "-" + (mon < 10 ? "0" : "") + mon + "-" + (day < 10 ? "0" : "") + day;
          };
        `,
        typescript: code`
          function reformatDate(date: string): string {
              var months: string[] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              var p: string[] = date.split(" ");
              var day = parseInt(p[0].substring(0, p[0].length - 2), 10);
              var mon = 0;
              for (var i = 0; i < 12; i++) if (months[i] === p[1]) mon = i + 1;
              return p[2] + "-" + (mon < 10 ? "0" : "") + mon + "-" + (day < 10 ? "0" : "") + day;
          }
        `,
        java: code`
          public static String reformatDate(String date) {
              String[] months = { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
              String[] p = date.split(" ");
              int day = Integer.parseInt(p[0].substring(0, p[0].length() - 2));
              int mon = 0;
              for (int i = 0; i < 12; i++) if (months[i].equals(p[1])) mon = i + 1;
              return String.format("%s-%02d-%02d", p[2], mon, day);
          }
        `,
        cpp: code`
          string reformatDate(string date) {
              vector<string> months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"};
              istringstream in1(date);
              string d, m, y;
              in1 >> d >> m >> y;
              int day = stoi(d.substr(0, d.size() - 2));
              int mon = (int)(find(months.begin(), months.end(), m) - months.begin()) + 1;
              char buf[16];
              snprintf(buf, sizeof(buf), "%s-%02d-%02d", y.c_str(), mon, day);
              return string(buf);
          }
        `,
        c: code`
          char* reformatDate(const char* date) {
              const char* months[12] = { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
              int i = 0, day = 0, mon = 0;
              while (date[i] >= '0' && date[i] <= '9') { day = day * 10 + (date[i] - '0'); i++; }
              while (date[i] != ' ') i++;
              i++;
              for (int m = 0; m < 12; m++) {
                  if (strncmp(date + i, months[m], 3) == 0) { mon = m + 1; break; }
              }
              i += 4;
              char* res = (char*)malloc(11);
              memcpy(res, date + i, 4);
              res[4] = '-';
              res[5] = (char)('0' + mon / 10);
              res[6] = (char)('0' + mon % 10);
              res[7] = '-';
              res[8] = (char)('0' + day / 10);
              res[9] = (char)('0' + day % 10);
              res[10] = '\0';
              return res;
          }
        `,
        csharp: code`
          public static string ReformatDate(string date)
          {
              var months = new[] { "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
              var p = date.Split(' ');
              int day = int.Parse(p[0].Substring(0, p[0].Length - 2));
              int mon = Array.IndexOf(months, p[1]) + 1;
              return p[2] + "-" + mon.ToString("D2") + "-" + day.ToString("D2");
          }
        `,
        go: code`
          func reformatDate(date string) string {
          	months := []string{"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}
          	p := strings.Fields(date)
          	day := 0
          	for i := 0; i < len(p[0]) && p[0][i] >= '0' && p[0][i] <= '9'; i++ {
          		day = day*10 + int(p[0][i]-'0')
          	}
          	mon := 0
          	for i, m := range months {
          		if m == p[1] {
          			mon = i + 1
          		}
          	}
          	return fmt.Sprintf("%s-%02d-%02d", p[2], mon, day)
          }
        `,
        kotlin: code`
          fun reformatDate(date: String): String {
              val months = listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
              val p = date.split(" ")
              val day = p[0].substring(0, p[0].length - 2).toInt()
              val mon = months.indexOf(p[1]) + 1
              return "%s-%02d-%02d".format(p[2], mon, day)
          }
        `,
        swift: code`
          func reformatDate(_ date: String) -> String {
              let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
              let p = date.split(separator: " ").map { String($0) }
              let day = Int(String(p[0].dropLast(2)))!
              let mon = months.firstIndex(of: p[1])! + 1
              return p[2] + "-" + (mon < 10 ? "0" : "") + String(mon) + "-" + (day < 10 ? "0" : "") + String(day)
          }
        `,
        rust: code`
          fn reformatDate(date: String) -> String {
              let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
              let p: Vec<&str> = date.split(' ').collect();
              let day: i32 = p[0][..p[0].len() - 2].parse().unwrap();
              let mut mon = 0;
              for (i, m) in months.iter().enumerate() {
                  if *m == p[1] {
                      mon = i + 1;
                  }
              }
              format!("{}-{:02}-{:02}", p[2], mon, day)
          }
        `,
        php: code`
          function reformatDate($date) {
              $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              $p = explode(' ', $date);
              $day = intval(substr($p[0], 0, strlen($p[0]) - 2));
              $mon = array_search($p[1], $months) + 1;
              return sprintf('%s-%02d-%02d', $p[2], $mon, $day);
          }
        `,
        ruby: code`
          def reformatDate(date)
            months = %w[Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec]
            d, m, y = date.split(' ')
            format('%s-%02d-%02d', y, months.index(m) + 1, d.to_i)
          end
        `,
      },
    };
  })(),

  // ── Slowest Key (LC 1629) ───────────────────────────────────────
  (() => {
    const ref = (rt: number[], keys: string) => {
      let bestKey = "", bestDur = -1;
      for (let i = 0; i < rt.length; i++) {
        const d = rt[i] - (i ? rt[i - 1] : 0);
        if (d > bestDur || (d === bestDur && keys[i] > bestKey)) { bestDur = d; bestKey = keys[i]; }
      }
      return bestKey;
    };
    return {
      slug: "slowest-key",
      title: "Slowest Key",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Amazon", "Microsoft"],
      signature: {
        funcName: "slowestKey",
        params: [{ name: "releaseTimes", type: "int[]" as const }, { name: "keysPressed", type: "string" as const }],
        returns: "string" as const,
      },
      description: describe(
        "A tester typed `n` keys, one after another. `keysPressed[i]` is the `i`-th key pressed and `releaseTimes[i]` is the moment it was released (the array is strictly increasing). The first key was pressed at time 0, and every later key was pressed at the exact moment the previous one was released.\n\nSo the `i`-th keypress lasted `releaseTimes[i] - releaseTimes[i - 1]`, and the first lasted `releaseTimes[0]`. The same key may be pressed several times, and each press is measured on its own.\n\nReturn the key of the **longest** single keypress. If several presses tie for the longest, return the lexicographically **largest** of their keys. The answer is a one-character string.",
        [
          { in: "releaseTimes = [4,9,14,16], keysPressed = \"kaio\"", out: "i", note: "Durations 4, 5, 5, 2 — `a` and `i` tie at 5 and `i` is larger." },
          { in: "releaseTimes = [3,10,12], keysPressed = \"zrz\"", out: "r", note: "Durations 3, 7, 2." },
          { in: "releaseTimes = [5,10], keysPressed = \"ab\"", out: "b" },
        ],
        [
          "releaseTimes.length == n",
          "keysPressed.length == n",
          "2 <= n <= 1000",
          "1 <= releaseTimes[i] <= 10^9",
          "releaseTimes[i] < releaseTimes[i + 1]",
          "keysPressed contains only lowercase English letters",
        ]),
      hints: [
        "Compute the duration of each keypress from consecutive release times.",
        "Keep the best duration seen so far and its key.",
        "Replace the best when a press is strictly longer, or equally long with a larger key.",
      ],
      editorial: explain({
        idea: "Each press's duration is the gap between consecutive release times, so one pass that tracks the best (duration, key) pair under the tie rule is enough.",
        steps: [
          "Start with `bestDur = releaseTimes[0]` and `bestKey = keysPressed[0]`.",
          "For `i` from 1, let `d = releaseTimes[i] - releaseTimes[i-1]`.",
          "If `d > bestDur`, or `d == bestDur` and `keysPressed[i] > bestKey`, take `(d, keysPressed[i])` as the new best.",
          "Return `bestKey`.",
        ],
        why: "The comparison orders presses first by duration and then by key, and the pass keeps the maximum of that order — exactly the press the statement asks for. Durations are compared per press, never summed per key.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The first press lasts `releaseTimes[0]`, not 0.",
          "Do not add up the durations of repeated presses of the same key.",
          "On a tie the larger letter wins, regardless of which press came first.",
        ],
      }),
      examples: [
        { input: "[4,9,14,16]\n\"kaio\"", expectedOutput: "i" },
        { input: "[3,10,12]\n\"zrz\"", expectedOutput: "r" },
        { input: "[5,10]\n\"ab\"", expectedOutput: "b" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 0, 5) === 0 ? 2 : ri(rng, 2, 25);
        const maxD = pick(rng, [2, 4, 10, 1000, 30000000]);
        const rt: number[] = [];
        let t = 0;
        for (let i = 0; i < n; i++) { t += ri(rng, 1, maxD); rt.push(t); }
        const keys = randLower(rng, n, n, pick(rng, ["ab", "kairo", "xyz", "abcdefghijklmnopqrstuvwxyz"]));
        return { input: `${fmtIntArr(rt)}\n"${keys}"`, expectedOutput: ref(rt, keys) };
      },
      solutions: {
        python: code`
          from typing import List

          def slowestKey(releaseTimes: List[int], keysPressed: str) -> str:
              best_dur, best_key = releaseTimes[0], keysPressed[0]
              for i in range(1, len(releaseTimes)):
                  d = releaseTimes[i] - releaseTimes[i - 1]
                  if d > best_dur or (d == best_dur and keysPressed[i] > best_key):
                      best_dur, best_key = d, keysPressed[i]
              return best_key
        `,
        javascript: code`
          var slowestKey = function(releaseTimes, keysPressed) {
              var bestDur = releaseTimes[0], bestKey = keysPressed[0];
              for (var i = 1; i < releaseTimes.length; i++) {
                  var d = releaseTimes[i] - releaseTimes[i - 1];
                  if (d > bestDur || (d === bestDur && keysPressed[i] > bestKey)) {
                      bestDur = d;
                      bestKey = keysPressed[i];
                  }
              }
              return bestKey;
          };
        `,
        typescript: code`
          function slowestKey(releaseTimes: number[], keysPressed: string): string {
              var bestDur = releaseTimes[0];
              var bestKey = keysPressed.charAt(0);
              for (var i = 1; i < releaseTimes.length; i++) {
                  var d = releaseTimes[i] - releaseTimes[i - 1];
                  var k = keysPressed.charAt(i);
                  if (d > bestDur || (d === bestDur && k > bestKey)) {
                      bestDur = d;
                      bestKey = k;
                  }
              }
              return bestKey;
          }
        `,
        java: code`
          public static String slowestKey(int[] releaseTimes, String keysPressed) {
              int bestDur = releaseTimes[0];
              char bestKey = keysPressed.charAt(0);
              for (int i = 1; i < releaseTimes.length; i++) {
                  int d = releaseTimes[i] - releaseTimes[i - 1];
                  char k = keysPressed.charAt(i);
                  if (d > bestDur || (d == bestDur && k > bestKey)) {
                      bestDur = d;
                      bestKey = k;
                  }
              }
              return String.valueOf(bestKey);
          }
        `,
        cpp: code`
          string slowestKey(vector<int>& releaseTimes, string keysPressed) {
              int bestDur = releaseTimes[0];
              char bestKey = keysPressed[0];
              for (int i = 1; i < (int)releaseTimes.size(); i++) {
                  int d = releaseTimes[i] - releaseTimes[i - 1];
                  if (d > bestDur || (d == bestDur && keysPressed[i] > bestKey)) {
                      bestDur = d;
                      bestKey = keysPressed[i];
                  }
              }
              return string(1, bestKey);
          }
        `,
        c: code`
          char* slowestKey(int* releaseTimes, int releaseTimesSize, const char* keysPressed) {
              int bestDur = releaseTimes[0];
              char bestKey = keysPressed[0];
              for (int i = 1; i < releaseTimesSize; i++) {
                  int d = releaseTimes[i] - releaseTimes[i - 1];
                  if (d > bestDur || (d == bestDur && keysPressed[i] > bestKey)) {
                      bestDur = d;
                      bestKey = keysPressed[i];
                  }
              }
              char* res = (char*)malloc(2);
              res[0] = bestKey;
              res[1] = '\0';
              return res;
          }
        `,
        csharp: code`
          public static string SlowestKey(int[] releaseTimes, string keysPressed)
          {
              int bestDur = releaseTimes[0];
              char bestKey = keysPressed[0];
              for (int i = 1; i < releaseTimes.Length; i++)
              {
                  int d = releaseTimes[i] - releaseTimes[i - 1];
                  if (d > bestDur || (d == bestDur && keysPressed[i] > bestKey))
                  {
                      bestDur = d;
                      bestKey = keysPressed[i];
                  }
              }
              return bestKey.ToString();
          }
        `,
        go: code`
          func slowestKey(releaseTimes []int, keysPressed string) string {
          	bestDur := releaseTimes[0]
          	bestKey := keysPressed[0]
          	for i := 1; i < len(releaseTimes); i++ {
          		d := releaseTimes[i] - releaseTimes[i-1]
          		if d > bestDur || (d == bestDur && keysPressed[i] > bestKey) {
          			bestDur = d
          			bestKey = keysPressed[i]
          		}
          	}
          	return string([]byte{bestKey})
          }
        `,
        kotlin: code`
          fun slowestKey(releaseTimes: IntArray, keysPressed: String): String {
              var bestDur = releaseTimes[0]
              var bestKey = keysPressed[0]
              for (i in 1 until releaseTimes.size) {
                  val d = releaseTimes[i] - releaseTimes[i - 1]
                  if (d > bestDur || (d == bestDur && keysPressed[i] > bestKey)) {
                      bestDur = d
                      bestKey = keysPressed[i]
                  }
              }
              return bestKey.toString()
          }
        `,
        swift: code`
          func slowestKey(_ releaseTimes: [Int], _ keysPressed: String) -> String {
              let keys = Array(keysPressed)
              var bestDur = releaseTimes[0]
              var bestKey = keys[0]
              var i = 1
              while i < releaseTimes.count {
                  let d = releaseTimes[i] - releaseTimes[i - 1]
                  if d > bestDur || (d == bestDur && keys[i] > bestKey) {
                      bestDur = d
                      bestKey = keys[i]
                  }
                  i += 1
              }
              return String(bestKey)
          }
        `,
        rust: code`
          fn slowestKey(releaseTimes: Vec<i32>, keysPressed: String) -> String {
              let keys = keysPressed.as_bytes();
              let mut best_dur = releaseTimes[0];
              let mut best_key = keys[0];
              for i in 1..releaseTimes.len() {
                  let d = releaseTimes[i] - releaseTimes[i - 1];
                  if d > best_dur || (d == best_dur && keys[i] > best_key) {
                      best_dur = d;
                      best_key = keys[i];
                  }
              }
              (best_key as char).to_string()
          }
        `,
        php: code`
          function slowestKey($releaseTimes, $keysPressed) {
              $bestDur = $releaseTimes[0];
              $bestKey = $keysPressed[0];
              $n = count($releaseTimes);
              for ($i = 1; $i < $n; $i++) {
                  $d = $releaseTimes[$i] - $releaseTimes[$i - 1];
                  if ($d > $bestDur || ($d == $bestDur && strcmp($keysPressed[$i], $bestKey) > 0)) {
                      $bestDur = $d;
                      $bestKey = $keysPressed[$i];
                  }
              }
              return $bestKey;
          }
        `,
        ruby: code`
          def slowestKey(releaseTimes, keysPressed)
            best_dur = releaseTimes[0]
            best_key = keysPressed[0]
            (1...releaseTimes.length).each do |i|
              d = releaseTimes[i] - releaseTimes[i - 1]
              if d > best_dur || (d == best_dur && keysPressed[i] > best_key)
                best_dur = d
                best_key = keysPressed[i]
              end
            end
            best_key
          end
        `,
      },
    };
  })(),

  // ── Reformat Phone Number (LC 1694) ─────────────────────────────
  (() => {
    const ref = (number: string) => {
      let d = number.replace(/[ -]/g, "");
      const blocks: string[] = [];
      while (d.length > 4) { blocks.push(d.slice(0, 3)); d = d.slice(3); }
      if (d.length === 4) blocks.push(d.slice(0, 2), d.slice(2));
      else blocks.push(d);
      return blocks.join("-");
    };
    return {
      slug: "reformat-phone-number",
      title: "Reformat Phone Number",
      difficulty: "EASY" as const,
      tags: ["String", "Simulation", "Amazon", "Google"],
      signature: { funcName: "reformatNumber", params: [{ name: "number", type: "string" as const }], returns: "string" as const },
      description: describe(
        "A phone number `number` is given as a string of digits, spaces `' '` and dashes `'-'`.\n\nReformat it as follows. First drop every space and dash. Then cut the digits, from left to right, into blocks of 3 until **4 or fewer** digits remain, and finish with:\n\n- 2 remaining digits → one block of 2;\n- 3 remaining digits → one block of 3;\n- 4 remaining digits → two blocks of 2.\n\nJoin the blocks with dashes and return the result. No block of length 1 is ever produced, and at most two blocks have length 2.",
        [
          { in: "number = \"98 76-5 4\"", out: '"987-654"' },
          { in: "number = \"1-2 3-4\"", out: '"12-34"', note: "Four digits become two blocks of two." },
          { in: "number = \"4 0 0-1 2 3 4 5\"", out: '"400-123-45"' },
        ],
        ["2 <= number.length <= 100", "number consists of digits and the characters '-' and ' '", "there are at least two digits in number"]),
      hints: [
        "Strip the spaces and dashes first; only the digit string matters.",
        "Take blocks of three while more than four digits remain.",
        "Four leftover digits split as 2 + 2; two or three leftover digits form the last block on their own.",
      ],
      editorial: explain({
        idea: "After removing separators the rule is a simple loop: greedily emit blocks of three while more than four digits are left, then handle the 2/3/4 tail specially so no block of one is ever created.",
        steps: [
          "Build `d`, the string of digits in order.",
          "Set `i = 0`; while `len(d) - i > 4`, emit `d[i..i+3)` and advance `i` by 3.",
          "If exactly 4 digits remain, emit `d[i..i+2)` and `d[i+2..i+4)`; otherwise emit the remaining 2 or 3 digits as one block.",
          "Join the blocks with `-`.",
        ],
        why: "Taking 3 while more than 4 remain always leaves 2, 3 or 4 digits (a count above 4 minus 3 is at least 2), and those three tails are exactly the cases the statement defines. The procedure mirrors the statement step by step, so the result is unique and correct.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Stopping when fewer than 3 digits remain would leave a block of 1 for lengths like 4 or 7.",
          "Separators can appear anywhere, including several in a row or at the ends.",
          "Do not put a dash after the final block.",
        ],
      }),
      examples: [
        { input: "\"98 76-5 4\"", expectedOutput: "987-654" },
        { input: "\"1-2 3-4\"", expectedOutput: "12-34" },
        { input: "\"4 0 0-1 2 3 4 5\"", expectedOutput: "400-123-45" },
      ],
      gen: (rng: Rng) => {
        const nd = pick(rng, [2, 3, 4, 5, 6, 7, ri(rng, 2, 12), ri(rng, 2, 30)]);
        const sep = () => {
          let t = "";
          const k = ri(rng, 0, 2) === 0 ? ri(rng, 1, 2) : 0;
          for (let i = 0; i < k; i++) t += pick(rng, [" ", "-"]);
          return t;
        };
        let s = sep();
        for (let i = 0; i < nd; i++) s += String(ri(rng, 0, 9)) + (i < nd - 1 ? sep() : "");
        s += sep();
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: code`
          def reformatNumber(number: str) -> str:
              d = ''.join(c for c in number if c.isdigit())
              blocks = []
              i = 0
              while len(d) - i > 4:
                  blocks.append(d[i:i + 3])
                  i += 3
              if len(d) - i == 4:
                  blocks.append(d[i:i + 2])
                  blocks.append(d[i + 2:])
              else:
                  blocks.append(d[i:])
              return '-'.join(blocks)
        `,
        javascript: code`
          var reformatNumber = function(number) {
              var d = "";
              for (var k = 0; k < number.length; k++) {
                  var c = number[k];
                  if (c >= "0" && c <= "9") d += c;
              }
              var blocks = [];
              var i = 0;
              while (d.length - i > 4) {
                  blocks.push(d.substring(i, i + 3));
                  i += 3;
              }
              if (d.length - i === 4) {
                  blocks.push(d.substring(i, i + 2));
                  blocks.push(d.substring(i + 2));
              } else {
                  blocks.push(d.substring(i));
              }
              return blocks.join("-");
          };
        `,
        typescript: code`
          function reformatNumber(number: string): string {
              var d = "";
              for (var k = 0; k < number.length; k++) {
                  var c = number.charAt(k);
                  if (c >= "0" && c <= "9") d += c;
              }
              var blocks: string[] = [];
              var i = 0;
              while (d.length - i > 4) {
                  blocks.push(d.substring(i, i + 3));
                  i += 3;
              }
              if (d.length - i === 4) {
                  blocks.push(d.substring(i, i + 2));
                  blocks.push(d.substring(i + 2));
              } else {
                  blocks.push(d.substring(i));
              }
              return blocks.join("-");
          }
        `,
        java: code`
          public static String reformatNumber(String number) {
              StringBuilder d = new StringBuilder();
              for (int k = 0; k < number.length(); k++) {
                  char c = number.charAt(k);
                  if (c >= '0' && c <= '9') d.append(c);
              }
              int n = d.length(), i = 0;
              StringBuilder res = new StringBuilder();
              while (n - i > 4) {
                  res.append(d, i, i + 3).append('-');
                  i += 3;
              }
              if (n - i == 4) res.append(d, i, i + 2).append('-').append(d, i + 2, n);
              else res.append(d, i, n);
              return res.toString();
          }
        `,
        cpp: code`
          string reformatNumber(string number) {
              string d;
              for (char c : number) if (c >= '0' && c <= '9') d += c;
              int n = d.size(), i = 0;
              string res;
              while (n - i > 4) {
                  res += d.substr(i, 3) + "-";
                  i += 3;
              }
              if (n - i == 4) res += d.substr(i, 2) + "-" + d.substr(i + 2, 2);
              else res += d.substr(i);
              return res;
          }
        `,
        c: code`
          char* reformatNumber(const char* number) {
              int len = (int)strlen(number);
              char* d = (char*)malloc(len + 1);
              int n = 0;
              for (int k = 0; k < len; k++) {
                  if (number[k] >= '0' && number[k] <= '9') d[n++] = number[k];
              }
              char* res = (char*)malloc(2 * n + 2);
              int r = 0, i = 0;
              while (n - i > 4) {
                  res[r++] = d[i];
                  res[r++] = d[i + 1];
                  res[r++] = d[i + 2];
                  res[r++] = '-';
                  i += 3;
              }
              if (n - i == 4) {
                  res[r++] = d[i];
                  res[r++] = d[i + 1];
                  res[r++] = '-';
                  res[r++] = d[i + 2];
                  res[r++] = d[i + 3];
              } else {
                  while (i < n) res[r++] = d[i++];
              }
              res[r] = '\0';
              free(d);
              return res;
          }
        `,
        csharp: code`
          public static string ReformatNumber(string number)
          {
              var d = new string(number.Where(c => c >= '0' && c <= '9').ToArray());
              int n = d.Length, i = 0;
              var blocks = new List<string>();
              while (n - i > 4)
              {
                  blocks.Add(d.Substring(i, 3));
                  i += 3;
              }
              if (n - i == 4)
              {
                  blocks.Add(d.Substring(i, 2));
                  blocks.Add(d.Substring(i + 2, 2));
              }
              else blocks.Add(d.Substring(i));
              return string.Join("-", blocks);
          }
        `,
        go: code`
          func reformatNumber(number string) string {
          	d := []byte{}
          	for i := 0; i < len(number); i++ {
          		if number[i] >= '0' && number[i] <= '9' {
          			d = append(d, number[i])
          		}
          	}
          	n := len(d)
          	i := 0
          	blocks := []string{}
          	for n-i > 4 {
          		blocks = append(blocks, string(d[i:i+3]))
          		i += 3
          	}
          	if n-i == 4 {
          		blocks = append(blocks, string(d[i:i+2]), string(d[i+2:]))
          	} else {
          		blocks = append(blocks, string(d[i:]))
          	}
          	return strings.Join(blocks, "-")
          }
        `,
        kotlin: code`
          fun reformatNumber(number: String): String {
              val d = number.filter { it in '0'..'9' }
              val n = d.length
              var i = 0
              val blocks = ArrayList<String>()
              while (n - i > 4) {
                  blocks.add(d.substring(i, i + 3))
                  i += 3
              }
              if (n - i == 4) {
                  blocks.add(d.substring(i, i + 2))
                  blocks.add(d.substring(i + 2))
              } else {
                  blocks.add(d.substring(i))
              }
              return blocks.joinToString("-")
          }
        `,
        swift: code`
          func reformatNumber(_ number: String) -> String {
              let d = Array(number.filter { $0 >= "0" && $0 <= "9" })
              let n = d.count
              var i = 0
              var blocks: [String] = []
              while n - i > 4 {
                  blocks.append(String(d[i..<(i + 3)]))
                  i += 3
              }
              if n - i == 4 {
                  blocks.append(String(d[i..<(i + 2)]))
                  blocks.append(String(d[(i + 2)..<n]))
              } else {
                  blocks.append(String(d[i..<n]))
              }
              return blocks.joined(separator: "-")
          }
        `,
        rust: code`
          fn reformatNumber(number: String) -> String {
              let d: Vec<char> = number.chars().filter(|c| c.is_ascii_digit()).collect();
              let n = d.len();
              let mut i = 0;
              let mut blocks: Vec<String> = Vec::new();
              while n - i > 4 {
                  blocks.push(d[i..i + 3].iter().collect());
                  i += 3;
              }
              if n - i == 4 {
                  blocks.push(d[i..i + 2].iter().collect());
                  blocks.push(d[i + 2..n].iter().collect());
              } else {
                  blocks.push(d[i..n].iter().collect());
              }
              blocks.join("-")
          }
        `,
        php: code`
          function reformatNumber($number) {
              $d = str_replace([' ', '-'], '', $number);
              $n = strlen($d);
              $i = 0;
              $blocks = [];
              while ($n - $i > 4) {
                  $blocks[] = substr($d, $i, 3);
                  $i += 3;
              }
              if ($n - $i == 4) {
                  $blocks[] = substr($d, $i, 2);
                  $blocks[] = substr($d, $i + 2, 2);
              } else {
                  $blocks[] = substr($d, $i);
              }
              return implode('-', $blocks);
          }
        `,
        ruby: code`
          def reformatNumber(number)
            d = number.gsub(/[^0-9]/, '')
            n = d.length
            i = 0
            blocks = []
            while n - i > 4
              blocks << d[i, 3]
              i += 3
            end
            if n - i == 4
              blocks << d[i, 2]
              blocks << d[i + 2, 2]
            else
              blocks << d[i..-1]
            end
            blocks.join('-')
          end
        `,
      },
    };
  })(),

  // ── Latest Time by Replacing Hidden Digits (LC 1736) ────────────
  (() => {
    const pad = (v: number) => (v < 10 ? "0" : "") + v;
    // Tries every time of day from 23:59 downwards and takes the first that fits the pattern.
    const ref = (time: string) => {
      for (let t = 1439; t >= 0; t--) {
        const s = pad(Math.floor(t / 60)) + ":" + pad(t % 60);
        let ok = true;
        for (let k = 0; k < 5; k++) if (time[k] !== "?" && time[k] !== s[k]) ok = false;
        if (ok) return s;
      }
      throw new Error(`no valid time for ${time}`);
    };
    return {
      slug: "latest-time-by-replacing-hidden-digits",
      title: "Latest Time by Replacing Hidden Digits",
      difficulty: "EASY" as const,
      tags: ["String", "Greedy", "Google", "Amazon"],
      signature: { funcName: "maximumTime", params: [{ name: "time", type: "string" as const }], returns: "string" as const },
      description: describe(
        "`time` is a 24-hour clock reading in the form `hh:mm`, but some of its digits are hidden and shown as `'?'`.\n\nA valid time is any reading from `00:00` to `23:59` inclusive. Replace every `'?'` with a digit so that the result is a valid time, and return the **latest** valid time you can obtain, in the same `hh:mm` form. At least one valid replacement always exists.",
        [
          { in: "time = \"?4:5?\"", out: '"14:59"', note: "With a 4 in the second hour digit the first one can be at most 1." },
          { in: "time = \"1?:4?\"", out: '"19:49"' },
          { in: "time = \"??:??\"", out: '"23:59"' },
        ],
        ["time is in the format hh:mm", "it is guaranteed that you can produce a valid time from the given string"]),
      hints: [
        "Fill the digits from left to right — an earlier digit matters more than all later ones.",
        "The minute digits are independent of everything else: `5` and `9` are always allowed.",
        "For the hours: the first digit can be `2` only if the second is hidden or at most `3`; the second digit can be `9` unless the first is `2`, in which case it is `3`.",
      ],
      editorial: explain({
        idea: "Comparing two times is comparing their digits left to right, so greedily give each hidden digit the largest value that still allows a valid time, starting from the most significant position.",
        steps: [
          "If `h0` is hidden: set it to `2` when `h1` is hidden or `h1 <= '3'`, otherwise to `1`.",
          "If `h1` is hidden: set it to `3` when `h0` is `2`, otherwise to `9`.",
          "If `m0` is hidden, set it to `5`; if `m1` is hidden, set it to `9`.",
          "Return the filled string.",
        ],
        why: "Hours run up to 23, so `h0` can be 2 only if the second digit can still be 0–3 — true when it is hidden (we will choose 3) or already at most 3. Once `h0` is fixed, the largest legal `h1` is 3 after a 2 and 9 after a 0 or 1. Minutes go up to 59 independently. Each choice is the maximum that keeps a completion possible, and earlier digits dominate later ones, so the result is the latest time.",
        time: "O(1)",
        space: "O(1)",
        pitfalls: [
          "Decide `h0` before `h1`, but look at the *original* `h1` when deciding `h0`.",
          "`\"?4:00\"` must become `14:00`, not `24:00`.",
          "`\"2?:..\"` allows at most `23`, not `29`.",
        ],
      }),
      examples: [
        { input: "\"?4:5?\"", expectedOutput: "14:59" },
        { input: "\"1?:4?\"", expectedOutput: "19:49" },
        { input: "\"??:??\"", expectedOutput: "23:59" },
      ],
      gen: (rng: Rng) => {
        const h = ri(rng, 0, 23), m = ri(rng, 0, 59);
        const full = (pad(h) + ":" + pad(m)).split("");
        const prob = pick(rng, [0.1, 0.25, 0.5, 0.75, 0.9]);
        for (const k of [0, 1, 3, 4]) if (rng() < prob) full[k] = "?";
        const time = full.join("");
        return { input: `"${time}"`, expectedOutput: ref(time) };
      },
      solutions: {
        python: code`
          def maximumTime(time: str) -> str:
              t = list(time)
              if t[0] == '?':
                  t[0] = '2' if t[1] == '?' or t[1] <= '3' else '1'
              if t[1] == '?':
                  t[1] = '3' if t[0] == '2' else '9'
              if t[3] == '?':
                  t[3] = '5'
              if t[4] == '?':
                  t[4] = '9'
              return ''.join(t)
        `,
        javascript: code`
          var maximumTime = function(time) {
              var t = time.split("");
              if (t[0] === "?") t[0] = (t[1] === "?" || t[1] <= "3") ? "2" : "1";
              if (t[1] === "?") t[1] = t[0] === "2" ? "3" : "9";
              if (t[3] === "?") t[3] = "5";
              if (t[4] === "?") t[4] = "9";
              return t.join("");
          };
        `,
        typescript: code`
          function maximumTime(time: string): string {
              var t: string[] = time.split("");
              if (t[0] === "?") t[0] = (t[1] === "?" || t[1] <= "3") ? "2" : "1";
              if (t[1] === "?") t[1] = t[0] === "2" ? "3" : "9";
              if (t[3] === "?") t[3] = "5";
              if (t[4] === "?") t[4] = "9";
              return t.join("");
          }
        `,
        java: code`
          public static String maximumTime(String time) {
              char[] t = time.toCharArray();
              if (t[0] == '?') t[0] = (t[1] == '?' || t[1] <= '3') ? '2' : '1';
              if (t[1] == '?') t[1] = t[0] == '2' ? '3' : '9';
              if (t[3] == '?') t[3] = '5';
              if (t[4] == '?') t[4] = '9';
              return new String(t);
          }
        `,
        cpp: code`
          string maximumTime(string time) {
              string t = time;
              if (t[0] == '?') t[0] = (t[1] == '?' || t[1] <= '3') ? '2' : '1';
              if (t[1] == '?') t[1] = t[0] == '2' ? '3' : '9';
              if (t[3] == '?') t[3] = '5';
              if (t[4] == '?') t[4] = '9';
              return t;
          }
        `,
        c: code`
          char* maximumTime(const char* time) {
              char* t = (char*)malloc(6);
              memcpy(t, time, 5);
              t[5] = '\0';
              if (t[0] == '?') t[0] = (t[1] == '?' || t[1] <= '3') ? '2' : '1';
              if (t[1] == '?') t[1] = t[0] == '2' ? '3' : '9';
              if (t[3] == '?') t[3] = '5';
              if (t[4] == '?') t[4] = '9';
              return t;
          }
        `,
        csharp: code`
          public static string MaximumTime(string time)
          {
              var t = time.ToCharArray();
              if (t[0] == '?') t[0] = (t[1] == '?' || t[1] <= '3') ? '2' : '1';
              if (t[1] == '?') t[1] = t[0] == '2' ? '3' : '9';
              if (t[3] == '?') t[3] = '5';
              if (t[4] == '?') t[4] = '9';
              return new string(t);
          }
        `,
        go: code`
          func maximumTime(time string) string {
          	t := []byte(time)
          	if t[0] == '?' {
          		if t[1] == '?' || t[1] <= '3' {
          			t[0] = '2'
          		} else {
          			t[0] = '1'
          		}
          	}
          	if t[1] == '?' {
          		if t[0] == '2' {
          			t[1] = '3'
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
          fun maximumTime(time: String): String {
              val t = time.toCharArray()
              if (t[0] == '?') t[0] = if (t[1] == '?' || t[1] <= '3') '2' else '1'
              if (t[1] == '?') t[1] = if (t[0] == '2') '3' else '9'
              if (t[3] == '?') t[3] = '5'
              if (t[4] == '?') t[4] = '9'
              return String(t)
          }
        `,
        swift: code`
          func maximumTime(_ time: String) -> String {
              var t = Array(time)
              if t[0] == "?" { t[0] = (t[1] == "?" || t[1] <= "3") ? "2" : "1" }
              if t[1] == "?" { t[1] = t[0] == "2" ? "3" : "9" }
              if t[3] == "?" { t[3] = "5" }
              if t[4] == "?" { t[4] = "9" }
              return String(t)
          }
        `,
        rust: code`
          fn maximumTime(time: String) -> String {
              let mut t: Vec<u8> = time.into_bytes();
              if t[0] == b'?' {
                  t[0] = if t[1] == b'?' || t[1] <= b'3' { b'2' } else { b'1' };
              }
              if t[1] == b'?' {
                  t[1] = if t[0] == b'2' { b'3' } else { b'9' };
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
          function maximumTime($time) {
              $t = $time;
              if ($t[0] === '?') $t[0] = ($t[1] === '?' || strcmp($t[1], '3') <= 0) ? '2' : '1';
              if ($t[1] === '?') $t[1] = $t[0] === '2' ? '3' : '9';
              if ($t[3] === '?') $t[3] = '5';
              if ($t[4] === '?') $t[4] = '9';
              return $t;
          }
        `,
        ruby: code`
          def maximumTime(time)
            t = time.dup
            t[0] = (t[1] == '?' || t[1] <= '3') ? '2' : '1' if t[0] == '?'
            t[1] = t[0] == '2' ? '3' : '9' if t[1] == '?'
            t[3] = '5' if t[3] == '?'
            t[4] = '9' if t[4] == '?'
            t
          end
        `,
      },
    };
  })(),

  // ── Check if One String Swap Can Make Strings Equal (LC 1790) ───
  (() => {
    // Brute force: the strings are equal already, or some single swap inside s1 makes them so.
    const ref = (s1: string, s2: string) => {
      if (s1 === s2) return true;
      const a = s1.split("");
      for (let i = 0; i < a.length; i++) {
        for (let j = i + 1; j < a.length; j++) {
          [a[i], a[j]] = [a[j], a[i]];
          const same = a.join("") === s2;
          [a[i], a[j]] = [a[j], a[i]];
          if (same) return true;
        }
      }
      return false;
    };
    return {
      slug: "check-if-one-string-swap-can-make-strings-equal",
      title: "Check if One String Swap Can Make Strings Equal",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Counting", "Meta", "Amazon"],
      signature: {
        funcName: "areAlmostEqual",
        params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "You are given two lowercase strings `s1` and `s2` of the same length. A **string swap** picks two indices of one string (not necessarily different) and exchanges the characters at them.\n\nReturn `true` if you can make the two strings equal by performing **at most one** string swap on **exactly one** of them, and `false` otherwise.",
        [
          { in: "s1 = \"kairo\", s2 = \"kiaro\"", out: "true", note: "Swap `a` and `i` in `s1`." },
          { in: "s1 = \"code\", s2 = \"dcoe\"", out: "false", note: "Three positions differ; one swap fixes at most two." },
          { in: "s1 = \"bug\", s2 = \"bug\"", out: "true", note: "No swap needed." },
        ],
        ["1 <= s1.length, s2.length <= 100", "s1.length == s2.length", "s1 and s2 consist of only lowercase English letters"]),
      hints: [
        "Look at the indices where the two strings differ.",
        "One swap changes at most two positions, so more than two differences is hopeless — and so is exactly one.",
        "With exactly two differing indices `i` and `j`, a swap works only if `s1[i] == s2[j]` and `s1[j] == s2[i]`.",
      ],
      editorial: explain({
        idea: "A swap touches two positions, so the strings must already agree everywhere except at zero or two indices, and those two must be each other's mirror image.",
        steps: [
          "Collect the indices where `s1[k] != s2[k]`, stopping early once there are three.",
          "No differences → `true`.",
          "Exactly two differences `i < j` → return whether `s1[i] == s2[j]` and `s1[j] == s2[i]`.",
          "Any other count → `false`.",
        ],
        why: "Swapping positions `i` and `j` in `s1` changes only those two characters. Every mismatch outside `{i, j}` therefore survives, so all mismatches must lie in `{i, j}`; a single mismatch cannot be fixed because the swap would have to bring in a character from a matching position and break it. With two mismatches the swap fixes both exactly when the characters are crossed. Swapping in `s2` instead is symmetric.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Equal strings need no swap and return `true`.",
          "Equal character counts are not enough — `\"abcd\"` and `\"badc\"` need two swaps.",
          "Exactly one mismatch is always `false`.",
        ],
      }),
      examples: [
        { input: "\"kairo\"\n\"kiaro\"", expectedOutput: "true" },
        { input: "\"code\"\n\"dcoe\"", expectedOutput: "false" },
        { input: "\"bug\"\n\"bug\"", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, 2, ri(rng, 2, 8), ri(rng, 3, 20), ri(rng, 3, 20)]);
        const alpha = pick(rng, ["ab", "abc", "kairo", "abcdefghijklmnopqrstuvwxyz"]);
        const s1 = randLower(rng, n, n, alpha);
        const a = s1.split("");
        const swap = () => {
          const i = ri(rng, 0, n - 1), j = ri(rng, 0, n - 1);
          [a[i], a[j]] = [a[j], a[i]];
        };
        const cls = ri(rng, 0, 5);
        if (cls === 1 || cls === 2) swap();
        else if (cls === 3) { swap(); swap(); }
        else if (cls === 4) a[ri(rng, 0, n - 1)] = alpha[ri(rng, 0, alpha.length - 1)];
        else if (cls === 5) shuffle(rng, a);
        const s2 = a.join("");
        return { input: `"${s1}"\n"${s2}"`, expectedOutput: bool(ref(s1, s2)) };
      },
      solutions: {
        python: code`
          def areAlmostEqual(s1: str, s2: str) -> bool:
              diff = [i for i in range(len(s1)) if s1[i] != s2[i]]
              if not diff:
                  return True
              if len(diff) != 2:
                  return False
              i, j = diff
              return s1[i] == s2[j] and s1[j] == s2[i]
        `,
        javascript: code`
          var areAlmostEqual = function(s1, s2) {
              var diff = [];
              for (var k = 0; k < s1.length; k++) {
                  if (s1[k] !== s2[k]) {
                      if (diff.length === 2) return false;
                      diff.push(k);
                  }
              }
              if (diff.length === 0) return true;
              if (diff.length === 1) return false;
              var i = diff[0], j = diff[1];
              return s1[i] === s2[j] && s1[j] === s2[i];
          };
        `,
        typescript: code`
          function areAlmostEqual(s1: string, s2: string): boolean {
              var diff: number[] = [];
              for (var k = 0; k < s1.length; k++) {
                  if (s1.charAt(k) !== s2.charAt(k)) {
                      if (diff.length === 2) return false;
                      diff.push(k);
                  }
              }
              if (diff.length === 0) return true;
              if (diff.length === 1) return false;
              var i = diff[0], j = diff[1];
              return s1.charAt(i) === s2.charAt(j) && s1.charAt(j) === s2.charAt(i);
          }
        `,
        java: code`
          public static boolean areAlmostEqual(String s1, String s2) {
              int[] d = new int[2];
              int k = 0;
              for (int i = 0; i < s1.length(); i++) {
                  if (s1.charAt(i) != s2.charAt(i)) {
                      if (k == 2) return false;
                      d[k++] = i;
                  }
              }
              if (k == 0) return true;
              if (k == 1) return false;
              return s1.charAt(d[0]) == s2.charAt(d[1]) && s1.charAt(d[1]) == s2.charAt(d[0]);
          }
        `,
        cpp: code`
          bool areAlmostEqual(string s1, string s2) {
              vector<int> d;
              for (int i = 0; i < (int)s1.size(); i++) {
                  if (s1[i] != s2[i]) {
                      if (d.size() == 2) return false;
                      d.push_back(i);
                  }
              }
              if (d.empty()) return true;
              if (d.size() == 1) return false;
              return s1[d[0]] == s2[d[1]] && s1[d[1]] == s2[d[0]];
          }
        `,
        c: code`
          bool areAlmostEqual(const char* s1, const char* s2) {
              int n = (int)strlen(s1);
              int d[2];
              int k = 0;
              for (int i = 0; i < n; i++) {
                  if (s1[i] != s2[i]) {
                      if (k == 2) return false;
                      d[k++] = i;
                  }
              }
              if (k == 0) return true;
              if (k == 1) return false;
              return s1[d[0]] == s2[d[1]] && s1[d[1]] == s2[d[0]];
          }
        `,
        csharp: code`
          public static bool AreAlmostEqual(string s1, string s2)
          {
              var d = new List<int>();
              for (int i = 0; i < s1.Length; i++)
              {
                  if (s1[i] != s2[i])
                  {
                      if (d.Count == 2) return false;
                      d.Add(i);
                  }
              }
              if (d.Count == 0) return true;
              if (d.Count == 1) return false;
              return s1[d[0]] == s2[d[1]] && s1[d[1]] == s2[d[0]];
          }
        `,
        go: code`
          func areAlmostEqual(s1 string, s2 string) bool {
          	d := []int{}
          	for i := 0; i < len(s1); i++ {
          		if s1[i] != s2[i] {
          			if len(d) == 2 {
          				return false
          			}
          			d = append(d, i)
          		}
          	}
          	if len(d) == 0 {
          		return true
          	}
          	if len(d) == 1 {
          		return false
          	}
          	return s1[d[0]] == s2[d[1]] && s1[d[1]] == s2[d[0]]
          }
        `,
        kotlin: code`
          fun areAlmostEqual(s1: String, s2: String): Boolean {
              val d = ArrayList<Int>()
              for (i in s1.indices) {
                  if (s1[i] != s2[i]) {
                      if (d.size == 2) return false
                      d.add(i)
                  }
              }
              if (d.isEmpty()) return true
              if (d.size == 1) return false
              return s1[d[0]] == s2[d[1]] && s1[d[1]] == s2[d[0]]
          }
        `,
        swift: code`
          func areAlmostEqual(_ s1: String, _ s2: String) -> Bool {
              let a = Array(s1.utf8), b = Array(s2.utf8)
              var d: [Int] = []
              for i in 0..<a.count where a[i] != b[i] {
                  if d.count == 2 { return false }
                  d.append(i)
              }
              if d.isEmpty { return true }
              if d.count == 1 { return false }
              return a[d[0]] == b[d[1]] && a[d[1]] == b[d[0]]
          }
        `,
        rust: code`
          fn areAlmostEqual(s1: String, s2: String) -> bool {
              let a = s1.as_bytes();
              let b = s2.as_bytes();
              let mut d: Vec<usize> = Vec::new();
              for i in 0..a.len() {
                  if a[i] != b[i] {
                      if d.len() == 2 {
                          return false;
                      }
                      d.push(i);
                  }
              }
              if d.is_empty() {
                  return true;
              }
              if d.len() == 1 {
                  return false;
              }
              a[d[0]] == b[d[1]] && a[d[1]] == b[d[0]]
          }
        `,
        php: code`
          function areAlmostEqual($s1, $s2) {
              $d = [];
              $n = strlen($s1);
              for ($i = 0; $i < $n; $i++) {
                  if ($s1[$i] !== $s2[$i]) {
                      if (count($d) == 2) return false;
                      $d[] = $i;
                  }
              }
              if (count($d) == 0) return true;
              if (count($d) == 1) return false;
              return $s1[$d[0]] === $s2[$d[1]] && $s1[$d[1]] === $s2[$d[0]];
          }
        `,
        ruby: code`
          def areAlmostEqual(s1, s2)
            d = (0...s1.length).select { |i| s1[i] != s2[i] }
            return true if d.empty?
            return false if d.length != 2
            i, j = d
            s1[i] == s2[j] && s1[j] == s2[i]
          end
        `,
      },
    };
  })(),

  // ── Second Largest Digit in a String (LC 1796) ──────────────────
  (() => {
    const ref = (s: string) => {
      const ds = Array.from(new Set(s.split("").filter((c) => c >= "0" && c <= "9").map(Number))).sort((a, b) => b - a);
      return ds.length >= 2 ? ds[1] : -1;
    };
    return {
      slug: "second-largest-digit-in-a-string",
      title: "Second Largest Digit in a String",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Amazon", "Google"],
      signature: { funcName: "secondHighest", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "The string `s` mixes lowercase letters and digits.\n\nAmong the **distinct** digits that appear in `s`, return the second largest one. If fewer than two distinct digits appear, return `-1`.",
        [
          { in: "s = \"kairo2026x9\"", out: "6", note: "The distinct digits are 0, 2, 6 and 9." },
          { in: "s = \"codekairo7\"", out: "-1", note: "Only one distinct digit." },
          { in: "s = \"a5b3c5\"", out: "3" },
        ],
        ["1 <= s.length <= 500", "s consists of only lowercase English letters and digits"]),
      hints: [
        "Letters can be ignored entirely.",
        "Repeated digits count once — you need the two largest *different* digits.",
        "Keep `first` and `second` (both starting at -1) and update them as you see each digit; a digit equal to `first` changes nothing.",
      ],
      editorial: explain({
        idea: "Track the largest and second-largest distinct digits in one pass, the same way one finds the top two values of an array, skipping duplicates of the current maximum.",
        steps: [
          "Set `first = second = -1`.",
          "For each digit character with value `d`: if `d > first`, shift `second = first` and set `first = d`.",
          "Otherwise, if `second < d < first`, set `second = d`.",
          "Return `second`.",
        ],
        why: "After each step `first` is the largest digit seen and `second` the largest digit seen that is strictly smaller than `first` (or -1). A new maximum demotes the old one to second place; a value strictly between them improves `second`; anything else changes neither. Using strict comparisons makes duplicates harmless.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`\"99\"` has only one distinct digit — the answer is -1, not 9.",
          "When a new maximum arrives, the old maximum must move to `second`.",
          "`0` is a real digit; initialise with -1, not 0.",
        ],
      }),
      examples: [
        { input: "\"kairo2026x9\"", expectedOutput: "6" },
        { input: "\"codekairo7\"", expectedOutput: "-1" },
        { input: "\"a5b3c5\"", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        // "xyz" and "z3" (no digit, or a single distinct one) keep the -1 answer in the mix
        const alpha = pick(rng, ["abc0123456789", "kairo79", "xy09", "a12", "0123456789", "xyz", "q556", "abcdefghij98", "z3"]);
        const s = randLower(rng, 1, pick(rng, [3, 10, 40]), alpha);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def secondHighest(s: str) -> int:
              first = second = -1
              for c in s:
                  if c.isdigit():
                      d = int(c)
                      if d > first:
                          first, second = d, first
                      elif second < d < first:
                          second = d
              return second
        `,
        javascript: code`
          var secondHighest = function(s) {
              var first = -1, second = -1;
              for (var i = 0; i < s.length; i++) {
                  var c = s.charCodeAt(i);
                  if (c < 48 || c > 57) continue;
                  var d = c - 48;
                  if (d > first) {
                      second = first;
                      first = d;
                  } else if (d < first && d > second) {
                      second = d;
                  }
              }
              return second;
          };
        `,
        typescript: code`
          function secondHighest(s: string): number {
              var first = -1, second = -1;
              for (var i = 0; i < s.length; i++) {
                  var c = s.charCodeAt(i);
                  if (c < 48 || c > 57) continue;
                  var d = c - 48;
                  if (d > first) {
                      second = first;
                      first = d;
                  } else if (d < first && d > second) {
                      second = d;
                  }
              }
              return second;
          }
        `,
        java: code`
          public static int secondHighest(String s) {
              int first = -1, second = -1;
              for (int i = 0; i < s.length(); i++) {
                  char c = s.charAt(i);
                  if (c < '0' || c > '9') continue;
                  int d = c - '0';
                  if (d > first) {
                      second = first;
                      first = d;
                  } else if (d < first && d > second) {
                      second = d;
                  }
              }
              return second;
          }
        `,
        cpp: code`
          int secondHighest(string s) {
              int first = -1, second = -1;
              for (char c : s) {
                  if (c < '0' || c > '9') continue;
                  int d = c - '0';
                  if (d > first) {
                      second = first;
                      first = d;
                  } else if (d < first && d > second) {
                      second = d;
                  }
              }
              return second;
          }
        `,
        c: code`
          int secondHighest(const char* s) {
              int first = -1, second = -1;
              for (int i = 0; s[i]; i++) {
                  char c = s[i];
                  if (c < '0' || c > '9') continue;
                  int d = c - '0';
                  if (d > first) {
                      second = first;
                      first = d;
                  } else if (d < first && d > second) {
                      second = d;
                  }
              }
              return second;
          }
        `,
        csharp: code`
          public static int SecondHighest(string s)
          {
              int first = -1, second = -1;
              foreach (char c in s)
              {
                  if (c < '0' || c > '9') continue;
                  int d = c - '0';
                  if (d > first)
                  {
                      second = first;
                      first = d;
                  }
                  else if (d < first && d > second)
                  {
                      second = d;
                  }
              }
              return second;
          }
        `,
        go: code`
          func secondHighest(s string) int {
          	first, second := -1, -1
          	for i := 0; i < len(s); i++ {
          		c := s[i]
          		if c < '0' || c > '9' {
          			continue
          		}
          		d := int(c - '0')
          		if d > first {
          			second = first
          			first = d
          		} else if d < first && d > second {
          			second = d
          		}
          	}
          	return second
          }
        `,
        kotlin: code`
          fun secondHighest(s: String): Int {
              var first = -1
              var second = -1
              for (c in s) {
                  if (c < '0' || c > '9') continue
                  val d = c - '0'
                  if (d > first) {
                      second = first
                      first = d
                  } else if (d < first && d > second) {
                      second = d
                  }
              }
              return second
          }
        `,
        swift: code`
          func secondHighest(_ s: String) -> Int {
              var first = -1
              var second = -1
              for b in s.utf8 {
                  if b < 48 || b > 57 { continue }
                  let d = Int(b) - 48
                  if d > first {
                      second = first
                      first = d
                  } else if d < first && d > second {
                      second = d
                  }
              }
              return second
          }
        `,
        rust: code`
          fn secondHighest(s: String) -> i32 {
              let mut first = -1;
              let mut second = -1;
              for b in s.bytes() {
                  if b < b'0' || b > b'9' {
                      continue;
                  }
                  let d = (b - b'0') as i32;
                  if d > first {
                      second = first;
                      first = d;
                  } else if d < first && d > second {
                      second = d;
                  }
              }
              second
          }
        `,
        php: code`
          function secondHighest($s) {
              $first = -1;
              $second = -1;
              $n = strlen($s);
              for ($i = 0; $i < $n; $i++) {
                  $c = ord($s[$i]);
                  if ($c < 48 || $c > 57) continue;
                  $d = $c - 48;
                  if ($d > $first) {
                      $second = $first;
                      $first = $d;
                  } elseif ($d < $first && $d > $second) {
                      $second = $d;
                  }
              }
              return $second;
          }
        `,
        ruby: code`
          def secondHighest(s)
            first = -1
            second = -1
            s.each_char do |c|
              next unless c >= '0' && c <= '9'
              d = c.to_i
              if d > first
                second = first
                first = d
              elsif d < first && d > second
                second = d
              end
            end
            second
          end
        `,
      },
    };
  })(),

  // ── Longer Contiguous Segments of Ones than Zeros (LC 1869) ─────
  (() => {
    const longest = (s: string, ch: string) => {
      let best = 0;
      for (let i = 0; i < s.length; i++) {
        let j = i;
        while (j < s.length && s[j] === ch) j++;
        best = Math.max(best, j - i);
      }
      return best;
    };
    const ref = (s: string) => longest(s, "1") > longest(s, "0");
    return {
      slug: "longer-contiguous-segments-of-ones-than-zeros",
      title: "Longer Contiguous Segments of Ones than Zeros",
      difficulty: "EASY" as const,
      tags: ["String", "Counting", "Amazon", "Microsoft"],
      signature: { funcName: "checkZeroOnes", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "`s` is a binary string. Return `true` if its longest contiguous segment of `1`s is **strictly longer** than its longest contiguous segment of `0`s, and `false` otherwise.\n\nIf `s` has no `0`s, its longest segment of `0`s has length 0; likewise for `1`s.",
        [
          { in: "s = \"11100110\"", out: "true", note: "The longest run of 1s has length 3, of 0s length 2." },
          { in: "s = \"111000\"", out: "false", note: "Both longest runs have length 3." },
          { in: "s = \"0\"", out: "false" },
        ],
        ["1 <= s.length <= 100", "s[i] is either '0' or '1'"]),
      hints: [
        "Measure every maximal run of equal characters.",
        "Keep two maxima: one for runs of 1s, one for runs of 0s.",
        "Compare them at the end with a strict `>`.",
      ],
      editorial: explain({
        idea: "One scan measures every run of equal characters; record the longest run separately for each of the two characters and compare.",
        steps: [
          "Set `best[0] = best[1] = 0` and `run = 0`.",
          "For each index `i`: `run = run + 1` if `s[i] == s[i-1]`, otherwise `run = 1`.",
          "Update `best[s[i]] = max(best[s[i]], run)`.",
          "Return `best[1] > best[0]`.",
        ],
        why: "The running counter equals the length of the run ending at `i`, so the maximum over all `i` with `s[i] == c` is the length of the longest run of `c`. A character that never appears keeps its maximum at 0, as the statement requires.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The comparison is strict — equal lengths give `false`.",
          "Update the maximum during the scan so the final run is not forgotten.",
        ],
      }),
      examples: [
        { input: "\"11100110\"", expectedOutput: "true" },
        { input: "\"111000\"", expectedOutput: "false" },
        { input: "\"0\"", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const cls = ri(rng, 0, 9);
        let s: string;
        if (cls === 0) s = pick(rng, ["0", "1"]).repeat(ri(rng, 1, 6));
        else if (cls === 1) s = randLower(rng, 1, 3, "01");
        else {
          s = "";
          const runs = ri(rng, 1, 12);
          let ch = pick(rng, ["0", "1"]);
          for (let r = 0; r < runs; r++) {
            s += ch.repeat(ri(rng, 1, 6));
            ch = ch === "0" ? "1" : "0";
          }
        }
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: code`
          def checkZeroOnes(s: str) -> bool:
              best = [0, 0]
              run = 0
              for i, c in enumerate(s):
                  run = run + 1 if i > 0 and s[i - 1] == c else 1
                  b = 1 if c == '1' else 0
                  best[b] = max(best[b], run)
              return best[1] > best[0]
        `,
        javascript: code`
          var checkZeroOnes = function(s) {
              var best = [0, 0];
              var run = 0;
              for (var i = 0; i < s.length; i++) {
                  run = (i > 0 && s[i] === s[i - 1]) ? run + 1 : 1;
                  var b = s[i] === "1" ? 1 : 0;
                  if (run > best[b]) best[b] = run;
              }
              return best[1] > best[0];
          };
        `,
        typescript: code`
          function checkZeroOnes(s: string): boolean {
              var best: number[] = [0, 0];
              var run = 0;
              for (var i = 0; i < s.length; i++) {
                  run = (i > 0 && s.charAt(i) === s.charAt(i - 1)) ? run + 1 : 1;
                  var b = s.charAt(i) === "1" ? 1 : 0;
                  if (run > best[b]) best[b] = run;
              }
              return best[1] > best[0];
          }
        `,
        java: code`
          public static boolean checkZeroOnes(String s) {
              int[] best = new int[2];
              int run = 0;
              for (int i = 0; i < s.length(); i++) {
                  run = (i > 0 && s.charAt(i) == s.charAt(i - 1)) ? run + 1 : 1;
                  int b = s.charAt(i) - '0';
                  best[b] = Math.max(best[b], run);
              }
              return best[1] > best[0];
          }
        `,
        cpp: code`
          bool checkZeroOnes(string s) {
              int best[2] = {0, 0};
              int run = 0;
              for (int i = 0; i < (int)s.size(); i++) {
                  run = (i > 0 && s[i] == s[i - 1]) ? run + 1 : 1;
                  int b = s[i] - '0';
                  best[b] = max(best[b], run);
              }
              return best[1] > best[0];
          }
        `,
        c: code`
          bool checkZeroOnes(const char* s) {
              int best[2] = {0, 0};
              int run = 0;
              for (int i = 0; s[i]; i++) {
                  run = (i > 0 && s[i] == s[i - 1]) ? run + 1 : 1;
                  int b = s[i] - '0';
                  if (run > best[b]) best[b] = run;
              }
              return best[1] > best[0];
          }
        `,
        csharp: code`
          public static bool CheckZeroOnes(string s)
          {
              var best = new int[2];
              int run = 0;
              for (int i = 0; i < s.Length; i++)
              {
                  run = (i > 0 && s[i] == s[i - 1]) ? run + 1 : 1;
                  int b = s[i] - '0';
                  best[b] = Math.Max(best[b], run);
              }
              return best[1] > best[0];
          }
        `,
        go: code`
          func checkZeroOnes(s string) bool {
          	best := [2]int{0, 0}
          	run := 0
          	for i := 0; i < len(s); i++ {
          		if i > 0 && s[i] == s[i-1] {
          			run++
          		} else {
          			run = 1
          		}
          		b := int(s[i] - '0')
          		if run > best[b] {
          			best[b] = run
          		}
          	}
          	return best[1] > best[0]
          }
        `,
        kotlin: code`
          fun checkZeroOnes(s: String): Boolean {
              val best = IntArray(2)
              var run = 0
              for (i in s.indices) {
                  run = if (i > 0 && s[i] == s[i - 1]) run + 1 else 1
                  val b = s[i] - '0'
                  if (run > best[b]) best[b] = run
              }
              return best[1] > best[0]
          }
        `,
        swift: code`
          func checkZeroOnes(_ s: String) -> Bool {
              let a = Array(s.utf8)
              var best = [0, 0]
              var run = 0
              for i in 0..<a.count {
                  run = (i > 0 && a[i] == a[i - 1]) ? run + 1 : 1
                  let b = Int(a[i]) - 48
                  if run > best[b] { best[b] = run }
              }
              return best[1] > best[0]
          }
        `,
        rust: code`
          fn checkZeroOnes(s: String) -> bool {
              let a = s.as_bytes();
              let mut best = [0i32; 2];
              let mut run = 0;
              for i in 0..a.len() {
                  run = if i > 0 && a[i] == a[i - 1] { run + 1 } else { 1 };
                  let b = (a[i] - b'0') as usize;
                  if run > best[b] {
                      best[b] = run;
                  }
              }
              best[1] > best[0]
          }
        `,
        php: code`
          function checkZeroOnes($s) {
              $best = [0, 0];
              $run = 0;
              $n = strlen($s);
              for ($i = 0; $i < $n; $i++) {
                  $run = ($i > 0 && $s[$i] === $s[$i - 1]) ? $run + 1 : 1;
                  $b = $s[$i] === '1' ? 1 : 0;
                  if ($run > $best[$b]) $best[$b] = $run;
              }
              return $best[1] > $best[0];
          }
        `,
        ruby: code`
          def checkZeroOnes(s)
            best = [0, 0]
            run = 0
            s.each_char.with_index do |c, i|
              run = (i > 0 && s[i - 1] == c) ? run + 1 : 1
              b = c == '1' ? 1 : 0
              best[b] = run if run > best[b]
            end
            best[1] > best[0]
          end
        `,
      },
    };
  })(),

  // ── Minimum Time to Type Word Using Special Typewriter (LC 1974) ─
  (() => {
    // Walks the wheel one letter at a time in each direction.
    const ref = (word: string) => {
      let total = 0, at = 0;
      for (const ch of word) {
        const target = ch.charCodeAt(0) - 97;
        let cw = 0, p = at;
        while (p !== target) { p = (p + 1) % 26; cw++; }
        let ccw = 0; p = at;
        while (p !== target) { p = (p + 25) % 26; ccw++; }
        total += Math.min(cw, ccw) + 1;
        at = target;
      }
      return total;
    };
    return {
      slug: "minimum-time-to-type-word-using-special-typewriter",
      title: "Minimum Time to Type Word Using Special Typewriter",
      difficulty: "EASY" as const,
      tags: ["String", "Greedy", "Google", "Amazon"],
      signature: { funcName: "minTimeToType", params: [{ name: "word", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A special typewriter has the letters `'a'` to `'z'` arranged on a circle, with a pointer that starts at `'a'`. Each second you may do exactly one of:\n\n- move the pointer one letter clockwise or one letter counterclockwise (the circle wraps, so `'z'` and `'a'` are neighbours);\n- type the letter the pointer is on.\n\nReturn the minimum number of seconds needed to type the string `word`.",
        [
          { in: "word = \"kai\"", out: "31", note: "a→k takes 10 moves, k→a takes 10, a→i takes 8, plus 3 seconds of typing." },
          { in: "word = \"zz\"", out: "3", note: "One counterclockwise move to `z`, then type it twice." },
          { in: "word = \"a\"", out: "1" },
        ],
        ["1 <= word.length <= 100", "word consists of lowercase English letters"]),
      hints: [
        "Each letter is reached from the previous one independently, so add the costs letter by letter.",
        "Between two letters `d` apart in the alphabet, one direction costs `d` moves and the other `26 - d`.",
        "Total = sum over letters of `min(d, 26 - d) + 1`, starting from `'a'`.",
      ],
      editorial: explain({
        idea: "Typing a letter only depends on where the pointer was, so the optimal plan moves the shorter way round the circle to each letter in turn and types it.",
        steps: [
          "Start with the pointer at `'a'` and `total = 0`.",
          "For each letter `c`: let `d = |c - prev|`; add `min(d, 26 - d)` moves plus 1 second to type.",
          "Set `prev = c` and continue.",
          "Return `total`.",
        ],
        why: "The pointer must visit the letters of `word` in order, and the only cost between consecutive letters is the movement. On a circle of 26 positions the two ways round cost `d` and `26 - d`, so the shorter one is optimal for that leg, and the legs do not interact because each starts exactly where the previous one ended.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The pointer starts at `'a'`, so the first letter also costs movement.",
          "Count one second per typed letter, including repeats with zero movement.",
          "Remember the wrap-around: from `a` to `z` is one move, not 25.",
        ],
      }),
      examples: [
        { input: "\"kai\"", expectedOutput: "31" },
        { input: "\"zz\"", expectedOutput: "3" },
        { input: "\"a\"", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["az", "amz", "kairo", "abcdefghijklmnopqrstuvwxyz"]);
        const word = randLower(rng, 1, pick(rng, [3, 12, 40]), alpha);
        return { input: `"${word}"`, expectedOutput: String(ref(word)) };
      },
      solutions: {
        python: code`
          def minTimeToType(word: str) -> int:
              total = 0
              prev = 'a'
              for c in word:
                  d = abs(ord(c) - ord(prev))
                  total += min(d, 26 - d) + 1
                  prev = c
              return total
        `,
        javascript: code`
          var minTimeToType = function(word) {
              var total = 0, prev = 97;
              for (var i = 0; i < word.length; i++) {
                  var c = word.charCodeAt(i);
                  var d = Math.abs(c - prev);
                  total += Math.min(d, 26 - d) + 1;
                  prev = c;
              }
              return total;
          };
        `,
        typescript: code`
          function minTimeToType(word: string): number {
              var total = 0, prev = 97;
              for (var i = 0; i < word.length; i++) {
                  var c = word.charCodeAt(i);
                  var d = Math.abs(c - prev);
                  total += Math.min(d, 26 - d) + 1;
                  prev = c;
              }
              return total;
          }
        `,
        java: code`
          public static int minTimeToType(String word) {
              int total = 0;
              char prev = 'a';
              for (int i = 0; i < word.length(); i++) {
                  char c = word.charAt(i);
                  int d = Math.abs(c - prev);
                  total += Math.min(d, 26 - d) + 1;
                  prev = c;
              }
              return total;
          }
        `,
        cpp: code`
          int minTimeToType(string word) {
              int total = 0;
              char prev = 'a';
              for (char c : word) {
                  int d = abs(c - prev);
                  total += min(d, 26 - d) + 1;
                  prev = c;
              }
              return total;
          }
        `,
        c: code`
          int minTimeToType(const char* word) {
              int total = 0;
              char prev = 'a';
              for (int i = 0; word[i]; i++) {
                  int d = word[i] - prev;
                  if (d < 0) d = -d;
                  total += (d < 26 - d ? d : 26 - d) + 1;
                  prev = word[i];
              }
              return total;
          }
        `,
        csharp: code`
          public static int MinTimeToType(string word)
          {
              int total = 0;
              char prev = 'a';
              foreach (char c in word)
              {
                  int d = Math.Abs(c - prev);
                  total += Math.Min(d, 26 - d) + 1;
                  prev = c;
              }
              return total;
          }
        `,
        go: code`
          func minTimeToType(word string) int {
          	total := 0
          	prev := byte('a')
          	for i := 0; i < len(word); i++ {
          		d := int(word[i]) - int(prev)
          		if d < 0 {
          			d = -d
          		}
          		if 26-d < d {
          			d = 26 - d
          		}
          		total += d + 1
          		prev = word[i]
          	}
          	return total
          }
        `,
        kotlin: code`
          fun minTimeToType(word: String): Int {
              var total = 0
              var prev = 'a'
              for (c in word) {
                  val d = Math.abs(c - prev)
                  total += Math.min(d, 26 - d) + 1
                  prev = c
              }
              return total
          }
        `,
        swift: code`
          func minTimeToType(_ word: String) -> Int {
              var total = 0
              var prev = 97
              for b in word.utf8 {
                  let c = Int(b)
                  let d = abs(c - prev)
                  total += min(d, 26 - d) + 1
                  prev = c
              }
              return total
          }
        `,
        rust: code`
          fn minTimeToType(word: String) -> i32 {
              let mut total = 0;
              let mut prev = b'a' as i32;
              for b in word.bytes() {
                  let c = b as i32;
                  let d = (c - prev).abs();
                  total += std::cmp::min(d, 26 - d) + 1;
                  prev = c;
              }
              total
          }
        `,
        php: code`
          function minTimeToType($word) {
              $total = 0;
              $prev = 97;
              $n = strlen($word);
              for ($i = 0; $i < $n; $i++) {
                  $c = ord($word[$i]);
                  $d = abs($c - $prev);
                  $total += min($d, 26 - $d) + 1;
                  $prev = $c;
              }
              return $total;
          }
        `,
        ruby: code`
          def minTimeToType(word)
            total = 0
            prev = 97
            word.each_byte do |c|
              d = (c - prev).abs
              total += [d, 26 - d].min + 1
              prev = c
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Check if Numbers Are Ascending in a Sentence (LC 2042) ──────
  (() => {
    const ref = (s: string) => {
      const nums = s.split(" ").filter((t) => /^\d+$/.test(t)).map(Number);
      return nums.every((v, i) => i === 0 || nums[i - 1] < v);
    };
    return {
      slug: "check-if-numbers-are-ascending-in-a-sentence",
      title: "Check if Numbers Are Ascending in a Sentence",
      difficulty: "EASY" as const,
      tags: ["String", "Simulation", "Amazon", "Microsoft"],
      signature: { funcName: "areNumbersAscending", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A sentence `s` is a list of **tokens** separated by single spaces. Every token is either a positive number written without leading zeros, or a word made of lowercase letters.\n\nReturn `true` if the numbers in `s`, read from left to right, are **strictly increasing** — each number is smaller than the next one — and `false` otherwise.",
        [
          { in: "s = \"kairo solved 3 bugs in 7 minutes and 12 duels\"", out: "true", note: "3 < 7 < 12." },
          { in: "s = \"level 5 then 5 again\"", out: "false", note: "5 is not smaller than 5." },
          { in: "s = \"rank 40 dropped to 9 today\"", out: "false" },
        ],
        [
          "3 <= s.length <= 200",
          "s consists of lowercase English letters, spaces and digits from 0 to 9",
          "the number of tokens in s is between 2 and 100",
          "the tokens are separated by a single space, with no leading or trailing spaces",
          "there are at least two numbers in s",
          "each number in s is a positive number less than 100, with no leading zeros",
        ]),
      hints: [
        "Split the sentence into tokens and keep only the numeric ones.",
        "A token is a number exactly when its first character is a digit.",
        "Remember the previous number (start at 0, since numbers are positive) and fail as soon as a number is not larger.",
      ],
      editorial: explain({
        idea: "Only the numeric tokens matter, and \"strictly increasing\" is a property of each adjacent pair — so scan once, remembering the previous number.",
        steps: [
          "Set `prev = 0`.",
          "For each token that starts with a digit, parse it as `v`.",
          "If `v <= prev`, return `false`; otherwise set `prev = v`.",
          "Return `true` after the scan.",
        ],
        why: "A sequence is strictly increasing exactly when every number is larger than the one before it, which is the check made at each step. Starting `prev` at 0 is safe because every number is positive.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Equal neighbours break strictness — `5 5` is not ascending.",
          "Compare numerically, not as strings: `\"9\" > \"12\"` as text.",
          "Numbers can have two digits; parse the whole token.",
        ],
      }),
      examples: [
        { input: "\"kairo solved 3 bugs in 7 minutes and 12 duels\"", expectedOutput: "true" },
        { input: "\"level 5 then 5 again\"", expectedOutput: "false" },
        { input: "\"rank 40 dropped to 9 today\"", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const numCount = ri(rng, 2, 8);
        let nums = Array.from({ length: numCount }, () => ri(rng, 1, pick(rng, [9, 20, 99])));
        const mode = ri(rng, 0, 3);
        if (mode <= 1) nums = [...new Set(nums)].sort((a, b) => a - b);
        if (nums.length < 2) nums = [nums[0], Math.min(99, nums[0] + ri(rng, 0, 1))];
        if (mode === 1 && nums.length >= 2) {
          const i = ri(rng, 1, nums.length - 1);
          nums[i] = pick(rng, [nums[i - 1], Math.max(1, nums[i - 1] - 1), nums[i]]);
        }
        const tokens: string[] = nums.map(String);
        const words = ri(rng, 0, 8);
        for (let w = 0; w < words; w++) {
          tokens.splice(ri(rng, 0, tokens.length), 0, randLower(rng, 1, 5, pick(rng, ["ab", "kairo", "abcdefghijklmnopqrstuvwxyz"])));
        }
        // numbers keep their relative order: the words were only inserted between them
        const s = tokens.join(" ");
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: code`
          def areNumbersAscending(s: str) -> bool:
              prev = 0
              for tok in s.split():
                  if tok[0].isdigit():
                      v = int(tok)
                      if v <= prev:
                          return False
                      prev = v
              return True
        `,
        javascript: code`
          var areNumbersAscending = function(s) {
              var toks = s.split(" ");
              var prev = 0;
              for (var i = 0; i < toks.length; i++) {
                  var c = toks[i][0];
                  if (c >= "0" && c <= "9") {
                      var v = parseInt(toks[i], 10);
                      if (v <= prev) return false;
                      prev = v;
                  }
              }
              return true;
          };
        `,
        typescript: code`
          function areNumbersAscending(s: string): boolean {
              var toks: string[] = s.split(" ");
              var prev = 0;
              for (var i = 0; i < toks.length; i++) {
                  var c = toks[i].charAt(0);
                  if (c >= "0" && c <= "9") {
                      var v = parseInt(toks[i], 10);
                      if (v <= prev) return false;
                      prev = v;
                  }
              }
              return true;
          }
        `,
        java: code`
          public static boolean areNumbersAscending(String s) {
              int prev = 0;
              for (String tok : s.split(" ")) {
                  char c = tok.charAt(0);
                  if (c >= '0' && c <= '9') {
                      int v = Integer.parseInt(tok);
                      if (v <= prev) return false;
                      prev = v;
                  }
              }
              return true;
          }
        `,
        cpp: code`
          bool areNumbersAscending(string s) {
              istringstream in1(s);
              string tok;
              int prev = 0;
              while (in1 >> tok) {
                  if (tok[0] >= '0' && tok[0] <= '9') {
                      int v = stoi(tok);
                      if (v <= prev) return false;
                      prev = v;
                  }
              }
              return true;
          }
        `,
        c: code`
          bool areNumbersAscending(const char* s) {
              int prev = 0, i = 0;
              while (s[i]) {
                  if (s[i] >= '0' && s[i] <= '9') {
                      int v = 0;
                      while (s[i] >= '0' && s[i] <= '9') {
                          v = v * 10 + (s[i] - '0');
                          i++;
                      }
                      if (v <= prev) return false;
                      prev = v;
                  } else {
                      i++;
                  }
              }
              return true;
          }
        `,
        csharp: code`
          public static bool AreNumbersAscending(string s)
          {
              int prev = 0;
              foreach (var tok in s.Split(' '))
              {
                  if (tok[0] >= '0' && tok[0] <= '9')
                  {
                      int v = int.Parse(tok);
                      if (v <= prev) return false;
                      prev = v;
                  }
              }
              return true;
          }
        `,
        go: code`
          func areNumbersAscending(s string) bool {
          	prev := 0
          	for _, tok := range strings.Fields(s) {
          		if tok[0] >= '0' && tok[0] <= '9' {
          			v := 0
          			for i := 0; i < len(tok); i++ {
          				v = v*10 + int(tok[i]-'0')
          			}
          			if v <= prev {
          				return false
          			}
          			prev = v
          		}
          	}
          	return true
          }
        `,
        kotlin: code`
          fun areNumbersAscending(s: String): Boolean {
              var prev = 0
              for (tok in s.split(" ")) {
                  if (tok[0] in '0'..'9') {
                      val v = tok.toInt()
                      if (v <= prev) return false
                      prev = v
                  }
              }
              return true
          }
        `,
        swift: code`
          func areNumbersAscending(_ s: String) -> Bool {
              var prev = 0
              for tok in s.split(separator: " ") {
                  if let v = Int(tok) {
                      if v <= prev { return false }
                      prev = v
                  }
              }
              return true
          }
        `,
        rust: code`
          fn areNumbersAscending(s: String) -> bool {
              let mut prev = 0;
              for tok in s.split_whitespace() {
                  if let Ok(v) = tok.parse::<i32>() {
                      if v <= prev {
                          return false;
                      }
                      prev = v;
                  }
              }
              true
          }
        `,
        php: code`
          function areNumbersAscending($s) {
              $prev = 0;
              foreach (explode(' ', $s) as $tok) {
                  $o = ord($tok[0]);
                  if ($o >= 48 && $o <= 57) {
                      $v = intval($tok);
                      if ($v <= $prev) return false;
                      $prev = $v;
                  }
              }
              return true;
          }
        `,
        ruby: code`
          def areNumbersAscending(s)
            prev = 0
            s.split(' ').each do |tok|
              next unless tok[0] >= '0' && tok[0] <= '9'
              v = tok.to_i
              return false if v <= prev
              prev = v
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Number of Valid Words in a Sentence (LC 2047) ───────────────
  (() => {
    const VALID = /^([a-z]+(-[a-z]+)?)?[!.,]?$/;
    const ref = (sentence: string) => sentence.split(" ").filter((t) => t.length > 0 && VALID.test(t)).length;
    return {
      slug: "number-of-valid-words-in-a-sentence",
      title: "Number of Valid Words in a Sentence",
      difficulty: "EASY" as const,
      tags: ["String", "Simulation", "Amazon", "Microsoft"],
      signature: { funcName: "countValidWords", params: [{ name: "sentence", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A `sentence` is made of lowercase letters, digits, hyphens `'-'`, punctuation marks `'!'`, `'.'` and `','`, and spaces. Splitting it on spaces (one or more) gives its **tokens**.\n\nA token is a **valid word** when all three rules hold:\n\n1. It contains only lowercase letters, hyphens and punctuation marks — no digits.\n2. It contains at most one hyphen, and a hyphen must have a lowercase letter immediately on both sides (`\"a-b\"` is fine, `\"-ab\"` and `\"ab-\"` are not).\n3. It contains at most one punctuation mark, and if there is one it must be the token's last character (`\"ab,\"`, `\"cd!\"` and `\".\"` are fine, `\"a!b\"` and `\"c.,\"` are not).\n\nReturn the number of valid words in `sentence`.",
        [
          { in: "sentence = \"kairo  solves bugs-fast!\"", out: "3" },
          { in: "sentence = \"a-b-c 4you !no -dash\"", out: "0", note: "Two hyphens, a digit, punctuation at the start, and a hyphen with no left letter." },
          { in: "sentence = \"hi, there. ok! x-y, a.\"", out: "5" },
        ],
        [
          "1 <= sentence.length <= 1000",
          "sentence only contains lowercase English letters, digits, ' ', '-', '!', '.' and ','",
          "there will be at least 1 token",
        ]),
      hints: [
        "Split on spaces and ignore the empty pieces between repeated spaces.",
        "Check each token character by character against the three rules.",
        "A hyphen needs `0 < i < len - 1` and letters at `i - 1` and `i + 1`; a punctuation mark needs `i == len - 1`; any digit fails the token.",
      ],
      editorial: explain({
        idea: "Validity is a local property of each token, so tokenise and run a single character scan per token that enforces the three rules.",
        steps: [
          "Split `sentence` on spaces, skipping empty tokens.",
          "For each token, scan its characters with a hyphen counter.",
          "A digit makes the token invalid. A hyphen is invalid if it is the second one, or sits at either end, or a neighbour is not a lowercase letter.",
          "A punctuation mark is invalid unless it is the last character.",
          "Count the tokens that survive the scan.",
        ],
        why: "The scan checks every condition at the exact position it constrains: digits anywhere, each hyphen's neighbours, each punctuation mark's position. Requiring every punctuation mark to be last also limits them to one, and requiring letters on both sides of a hyphen rules out a hyphen next to punctuation. Equivalently, a valid token matches `([a-z]+(-[a-z]+)?)?[!.,]?`.",
        time: "O(n)",
        space: "O(n) for the tokens (O(1) with an index scan)",
        pitfalls: [
          "Several spaces in a row (and spaces at the ends) produce empty pieces that are not tokens.",
          "A lone punctuation mark such as `\"!\"` is a valid word.",
          "`\"a-!\"` is invalid: the hyphen needs a letter on its right.",
        ],
      }),
      examples: [
        { input: "\"kairo  solves bugs-fast!\"", expectedOutput: "3" },
        { input: "\"a-b-c 4you !no -dash\"", expectedOutput: "0" },
        { input: "\"hi, there. ok! x-y, a.\"", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const word = () => randLower(rng, 1, 4, pick(rng, ["ab", "kairo", "xyz"]));
        const punct = () => pick(rng, ["!", ".", ","]);
        const piece = () => {
          const kind = ri(rng, 0, 11);
          if (kind <= 2) return word();
          if (kind === 3) return word() + "-" + word();
          if (kind === 4) return word() + punct();
          if (kind === 5) return word() + "-" + word() + punct();
          if (kind === 6) return punct();
          return randLower(rng, 1, 5, pick(rng, ["ab-", "a1", "a!.", "-,b", "ab-c!", "a,b", "x-"]));
        };
        const spaces = (lo: number, hi: number) => " ".repeat(ri(rng, lo, hi));
        const count = ri(rng, 1, 10);
        let s = ri(rng, 0, 4) === 0 ? spaces(1, 2) : "";
        for (let i = 0; i < count; i++) s += (i ? spaces(1, 3) : "") + piece();
        if (ri(rng, 0, 4) === 0) s += spaces(1, 2);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def countValidWords(sentence: str) -> int:
              def ok(t: str) -> bool:
                  n = len(t)
                  hy = 0
                  for i, c in enumerate(t):
                      if '0' <= c <= '9':
                          return False
                      if c == '-':
                          hy += 1
                          if hy > 1 or i == 0 or i == n - 1:
                              return False
                          if not ('a' <= t[i - 1] <= 'z') or not ('a' <= t[i + 1] <= 'z'):
                              return False
                      elif c in '!.,':
                          if i != n - 1:
                              return False
                  return True
              return sum(1 for t in sentence.split() if ok(t))
        `,
        javascript: code`
          var countValidWords = function(sentence) {
              var isLower = function(c) { return c >= "a" && c <= "z"; };
              var toks = sentence.split(" ");
              var count = 0;
              for (var k = 0; k < toks.length; k++) {
                  var t = toks[k];
                  if (t.length === 0) continue;
                  var ok = true, hy = 0;
                  for (var i = 0; i < t.length && ok; i++) {
                      var c = t[i];
                      if (c >= "0" && c <= "9") ok = false;
                      else if (c === "-") {
                          hy++;
                          if (hy > 1 || i === 0 || i === t.length - 1 || !isLower(t[i - 1]) || !isLower(t[i + 1])) ok = false;
                      } else if (c === "!" || c === "." || c === ",") {
                          if (i !== t.length - 1) ok = false;
                      }
                  }
                  if (ok) count++;
              }
              return count;
          };
        `,
        typescript: code`
          function cvwIsLower(c: string): boolean {
              return c >= "a" && c <= "z";
          }

          function countValidWords(sentence: string): number {
              var toks: string[] = sentence.split(" ");
              var count = 0;
              for (var k = 0; k < toks.length; k++) {
                  var t = toks[k];
                  if (t.length === 0) continue;
                  var ok = true, hy = 0;
                  for (var i = 0; i < t.length && ok; i++) {
                      var c = t.charAt(i);
                      if (c >= "0" && c <= "9") ok = false;
                      else if (c === "-") {
                          hy++;
                          if (hy > 1 || i === 0 || i === t.length - 1 || !cvwIsLower(t.charAt(i - 1)) || !cvwIsLower(t.charAt(i + 1))) ok = false;
                      } else if (c === "!" || c === "." || c === ",") {
                          if (i !== t.length - 1) ok = false;
                      }
                  }
                  if (ok) count++;
              }
              return count;
          }
        `,
        java: code`
          static boolean cvwValid(String t) {
              int n = t.length(), hy = 0;
              for (int i = 0; i < n; i++) {
                  char c = t.charAt(i);
                  if (c >= '0' && c <= '9') return false;
                  if (c == '-') {
                      hy++;
                      if (hy > 1 || i == 0 || i == n - 1) return false;
                      if (!Character.isLowerCase(t.charAt(i - 1)) || !Character.isLowerCase(t.charAt(i + 1))) return false;
                  } else if (c == '!' || c == '.' || c == ',') {
                      if (i != n - 1) return false;
                  }
              }
              return true;
          }

          public static int countValidWords(String sentence) {
              int count = 0;
              for (String t : sentence.split(" ")) {
                  if (!t.isEmpty() && cvwValid(t)) count++;
              }
              return count;
          }
        `,
        cpp: code`
          bool cvwValid(const string& t) {
              int n = t.size(), hy = 0;
              for (int i = 0; i < n; i++) {
                  char c = t[i];
                  if (c >= '0' && c <= '9') return false;
                  if (c == '-') {
                      hy++;
                      if (hy > 1 || i == 0 || i == n - 1) return false;
                      if (!(t[i - 1] >= 'a' && t[i - 1] <= 'z') || !(t[i + 1] >= 'a' && t[i + 1] <= 'z')) return false;
                  } else if (c == '!' || c == '.' || c == ',') {
                      if (i != n - 1) return false;
                  }
              }
              return true;
          }

          int countValidWords(string sentence) {
              istringstream in1(sentence);
              string t;
              int count = 0;
              while (in1 >> t) if (cvwValid(t)) count++;
              return count;
          }
        `,
        c: code`
          static bool cvwValid(const char* t, int n) {
              int hy = 0;
              for (int i = 0; i < n; i++) {
                  char c = t[i];
                  if (c >= '0' && c <= '9') return false;
                  if (c == '-') {
                      hy++;
                      if (hy > 1 || i == 0 || i == n - 1) return false;
                      if (!(t[i - 1] >= 'a' && t[i - 1] <= 'z') || !(t[i + 1] >= 'a' && t[i + 1] <= 'z')) return false;
                  } else if (c == '!' || c == '.' || c == ',') {
                      if (i != n - 1) return false;
                  }
              }
              return true;
          }

          int countValidWords(const char* sentence) {
              int count = 0, i = 0;
              while (sentence[i]) {
                  if (sentence[i] == ' ') {
                      i++;
                      continue;
                  }
                  int start = i;
                  while (sentence[i] && sentence[i] != ' ') i++;
                  if (cvwValid(sentence + start, i - start)) count++;
              }
              return count;
          }
        `,
        csharp: code`
          static bool CvwValid(string t)
          {
              int n = t.Length, hy = 0;
              for (int i = 0; i < n; i++)
              {
                  char c = t[i];
                  if (c >= '0' && c <= '9') return false;
                  if (c == '-')
                  {
                      hy++;
                      if (hy > 1 || i == 0 || i == n - 1) return false;
                      if (!(t[i - 1] >= 'a' && t[i - 1] <= 'z') || !(t[i + 1] >= 'a' && t[i + 1] <= 'z')) return false;
                  }
                  else if (c == '!' || c == '.' || c == ',')
                  {
                      if (i != n - 1) return false;
                  }
              }
              return true;
          }

          public static int CountValidWords(string sentence)
          {
              int count = 0;
              foreach (var t in sentence.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries))
              {
                  if (CvwValid(t)) count++;
              }
              return count;
          }
        `,
        go: code`
          func cvwIsLower(c byte) bool {
          	return c >= 'a' && c <= 'z'
          }

          func cvwValid(t string) bool {
          	n := len(t)
          	hy := 0
          	for i := 0; i < n; i++ {
          		c := t[i]
          		if c >= '0' && c <= '9' {
          			return false
          		}
          		if c == '-' {
          			hy++
          			if hy > 1 || i == 0 || i == n-1 || !cvwIsLower(t[i-1]) || !cvwIsLower(t[i+1]) {
          				return false
          			}
          		} else if c == '!' || c == '.' || c == ',' {
          			if i != n-1 {
          				return false
          			}
          		}
          	}
          	return true
          }

          func countValidWords(sentence string) int {
          	count := 0
          	for _, t := range strings.Fields(sentence) {
          		if cvwValid(t) {
          			count++
          		}
          	}
          	return count
          }
        `,
        kotlin: code`
          fun cvwValid(t: String): Boolean {
              val n = t.length
              var hy = 0
              for (i in 0 until n) {
                  val c = t[i]
                  if (c in '0'..'9') return false
                  if (c == '-') {
                      hy++
                      if (hy > 1 || i == 0 || i == n - 1) return false
                      if (t[i - 1] !in 'a'..'z' || t[i + 1] !in 'a'..'z') return false
                  } else if (c == '!' || c == '.' || c == ',') {
                      if (i != n - 1) return false
                  }
              }
              return true
          }

          fun countValidWords(sentence: String): Int {
              return sentence.split(" ").count { it.isNotEmpty() && cvwValid(it) }
          }
        `,
        swift: code`
          func cvwValid(_ t: [UInt8]) -> Bool {
              let n = t.count
              var hy = 0
              for i in 0..<n {
                  let c = t[i]
                  if c >= 48 && c <= 57 { return false }
                  if c == 45 {
                      hy += 1
                      if hy > 1 || i == 0 || i == n - 1 { return false }
                      if !(t[i - 1] >= 97 && t[i - 1] <= 122) || !(t[i + 1] >= 97 && t[i + 1] <= 122) { return false }
                  } else if c == 33 || c == 46 || c == 44 {
                      if i != n - 1 { return false }
                  }
              }
              return true
          }

          func countValidWords(_ sentence: String) -> Int {
              var count = 0
              for tok in sentence.split(separator: " ") {
                  if cvwValid(Array(tok.utf8)) { count += 1 }
              }
              return count
          }
        `,
        rust: code`
          fn cvw_valid(t: &[u8]) -> bool {
              let n = t.len();
              let mut hy = 0;
              for i in 0..n {
                  let c = t[i];
                  if c >= b'0' && c <= b'9' {
                      return false;
                  }
                  if c == b'-' {
                      hy += 1;
                      if hy > 1 || i == 0 || i == n - 1 {
                          return false;
                      }
                      if !t[i - 1].is_ascii_lowercase() || !t[i + 1].is_ascii_lowercase() {
                          return false;
                      }
                  } else if c == b'!' || c == b'.' || c == b',' {
                      if i != n - 1 {
                          return false;
                      }
                  }
              }
              true
          }

          fn countValidWords(sentence: String) -> i32 {
              sentence.split_whitespace().filter(|t| cvw_valid(t.as_bytes())).count() as i32
          }
        `,
        php: code`
          function cvwValid($t) {
              $n = strlen($t);
              $hy = 0;
              for ($i = 0; $i < $n; $i++) {
                  $c = $t[$i];
                  $o = ord($c);
                  if ($o >= 48 && $o <= 57) return false;
                  if ($c === '-') {
                      $hy++;
                      if ($hy > 1 || $i == 0 || $i == $n - 1) return false;
                      $l = ord($t[$i - 1]);
                      $r = ord($t[$i + 1]);
                      if ($l < 97 || $l > 122 || $r < 97 || $r > 122) return false;
                  } elseif ($c === '!' || $c === '.' || $c === ',') {
                      if ($i != $n - 1) return false;
                  }
              }
              return true;
          }

          function countValidWords($sentence) {
              $count = 0;
              foreach (explode(' ', $sentence) as $t) {
                  if ($t !== '' && cvwValid($t)) $count++;
              }
              return $count;
          }
        `,
        ruby: code`
          def cvw_valid(t)
            n = t.length
            hy = 0
            t.each_char.with_index do |c, i|
              return false if c >= '0' && c <= '9'
              if c == '-'
                hy += 1
                return false if hy > 1 || i == 0 || i == n - 1
                return false unless t[i - 1] =~ /[a-z]/ && t[i + 1] =~ /[a-z]/
              elsif c == '!' || c == '.' || c == ','
                return false if i != n - 1
              end
            end
            true
          end

          def countValidWords(sentence)
            sentence.split(' ').count { |t| cvw_valid(t) }
          end
        `,
      },
    };
  })(),

  // ── Kth Distinct String in an Array (LC 2053) ───────────────────
  (() => {
    const ref = (arr: string[], k: number) => {
      const distinct = arr.filter((s) => arr.indexOf(s) === arr.lastIndexOf(s));
      return k <= distinct.length ? distinct[k - 1] : "";
    };
    return {
      slug: "kth-distinct-string-in-an-array",
      title: "Kth Distinct String in an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "String", "Counting", "Amazon", "Google"],
      signature: {
        funcName: "kthDistinct",
        params: [{ name: "arr", type: "string[]" as const }, { name: "k", type: "int" as const }],
        returns: "string" as const,
      },
      description: describe(
        "A string of the array `arr` is **distinct** when it appears in `arr` exactly once.\n\nReturn the `k`-th distinct string, counting in the order the strings appear in `arr` (the first distinct string is the 1st). If `arr` has fewer than `k` distinct strings, return the empty string `\"\"`.",
        [
          { in: "arr = [\"kai\",\"ro\",\"kai\",\"duel\",\"bug\"], k = 2", out: "duel", note: "The distinct strings, in order, are `ro`, `duel`, `bug`." },
          { in: "arr = [\"x\",\"y\",\"x\",\"y\"], k = 1", out: "\"\"", note: "No string appears exactly once, so the answer is the empty string." },
          { in: "arr = [\"a\",\"b\",\"c\"], k = 3", out: "c" },
        ],
        ["1 <= k <= arr.length <= 1000", "1 <= arr[i].length <= 5", "arr[i] consists of lowercase English letters"]),
      hints: [
        "First find out how many times every string occurs.",
        "A hash map from string to count does it in one pass.",
        "Then walk `arr` in order, counting down `k` on each string whose count is 1; the one that brings `k` to 0 is the answer.",
      ],
      editorial: explain({
        idea: "Two passes: count every string, then scan the array in its original order and pick the `k`-th string whose count is exactly one.",
        steps: [
          "Build a map `count[s]` over `arr`.",
          "Scan `arr` from left to right; whenever `count[s] == 1`, decrement `k`.",
          "When `k` reaches 0, return the current string.",
          "If the scan ends first, return `\"\"`.",
        ],
        why: "The first pass gives the exact multiplicity of each string, so the second pass recognises distinct strings correctly; it visits them in array order, so the string at which the counter reaches zero is the `k`-th distinct one. A distinct string appears once, so it cannot be counted twice.",
        time: "O(n · L) with L ≤ 5",
        space: "O(n · L)",
        pitfalls: [
          "\"Distinct\" means appearing exactly once, not \"first occurrence of each value\".",
          "Keep the original order — iterating the hash map would scramble it.",
          "Return the empty string, not null, when there are fewer than `k` distinct strings.",
        ],
      }),
      examples: [
        { input: "[\"kai\",\"ro\",\"kai\",\"duel\",\"bug\"]\n2", expectedOutput: "duel" },
        { input: "[\"x\",\"y\",\"x\",\"y\"]\n1", expectedOutput: "" },
        { input: "[\"a\",\"b\",\"c\"]\n3", expectedOutput: "c" },
      ],
      gen: (rng: Rng) => {
        const pool = wordPool(rng, ri(rng, 1, 8), pick(rng, ["ab", "abc", "kairo"]), ri(rng, 1, 3));
        const n = ri(rng, 1, 16);
        const arr = Array.from({ length: n }, () => pick(rng, pool));
        const distinct = arr.filter((s) => arr.indexOf(s) === arr.lastIndexOf(s)).length;
        // mostly ask for a k that exists, sometimes one past the end
        const k = distinct > 0 && ri(rng, 0, 3) > 0 ? ri(rng, 1, distinct) : ri(rng, 1, n);
        return { input: `${fmtStrArr(arr)}\n${k}`, expectedOutput: ref(arr, k) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def kthDistinct(arr: List[str], k: int) -> str:
              cnt = Counter(arr)
              for s in arr:
                  if cnt[s] == 1:
                      k -= 1
                      if k == 0:
                          return s
              return ""
        `,
        javascript: code`
          var kthDistinct = function(arr, k) {
              var cnt = new Map();
              for (var i = 0; i < arr.length; i++) cnt.set(arr[i], (cnt.get(arr[i]) || 0) + 1);
              for (var j = 0; j < arr.length; j++) {
                  if (cnt.get(arr[j]) === 1) {
                      k--;
                      if (k === 0) return arr[j];
                  }
              }
              return "";
          };
        `,
        typescript: code`
          function kthDistinct(arr: string[], k: number): string {
              var cnt: { [key: string]: number } = {};
              for (var i = 0; i < arr.length; i++) {
                  var key = "#" + arr[i];
                  cnt[key] = (cnt[key] || 0) + 1;
              }
              for (var j = 0; j < arr.length; j++) {
                  if (cnt["#" + arr[j]] === 1) {
                      k--;
                      if (k === 0) return arr[j];
                  }
              }
              return "";
          }
        `,
        java: code`
          public static String kthDistinct(String[] arr, int k) {
              Map<String, Integer> cnt = new HashMap<>();
              for (String s : arr) cnt.merge(s, 1, Integer::sum);
              for (String s : arr) {
                  if (cnt.get(s) == 1) {
                      k--;
                      if (k == 0) return s;
                  }
              }
              return "";
          }
        `,
        cpp: code`
          string kthDistinct(vector<string>& arr, int k) {
              unordered_map<string, int> cnt;
              for (const string& s : arr) cnt[s]++;
              for (const string& s : arr) {
                  if (cnt[s] == 1) {
                      k--;
                      if (k == 0) return s;
                  }
              }
              return "";
          }
        `,
        c: code`
          char* kthDistinct(char** arr, int arrSize, int k) {
              for (int i = 0; i < arrSize; i++) {
                  int c = 0;
                  for (int j = 0; j < arrSize; j++) {
                      if (strcmp(arr[i], arr[j]) == 0) c++;
                  }
                  if (c == 1) {
                      k--;
                      if (k == 0) return arr[i];
                  }
              }
              return "";
          }
        `,
        csharp: code`
          public static string KthDistinct(string[] arr, int k)
          {
              var cnt = new Dictionary<string, int>();
              foreach (var s in arr)
              {
                  cnt.TryGetValue(s, out int c);
                  cnt[s] = c + 1;
              }
              foreach (var s in arr)
              {
                  if (cnt[s] == 1)
                  {
                      k--;
                      if (k == 0) return s;
                  }
              }
              return "";
          }
        `,
        go: code`
          func kthDistinct(arr []string, k int) string {
          	cnt := map[string]int{}
          	for _, s := range arr {
          		cnt[s]++
          	}
          	for _, s := range arr {
          		if cnt[s] == 1 {
          			k--
          			if k == 0 {
          				return s
          			}
          		}
          	}
          	return ""
          }
        `,
        kotlin: code`
          fun kthDistinct(arr: Array<String>, k: Int): String {
              val cnt = HashMap<String, Int>()
              for (s in arr) cnt[s] = (cnt[s] ?: 0) + 1
              var left = k
              for (s in arr) {
                  if (cnt[s] == 1) {
                      left--
                      if (left == 0) return s
                  }
              }
              return ""
          }
        `,
        swift: code`
          func kthDistinct(_ arr: [String], _ k: Int) -> String {
              var cnt = [String: Int]()
              for s in arr { cnt[s, default: 0] += 1 }
              var left = k
              for s in arr where cnt[s] == 1 {
                  left -= 1
                  if left == 0 { return s }
              }
              return ""
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn kthDistinct(arr: Vec<String>, k: i32) -> String {
              let mut cnt: HashMap<&String, i32> = HashMap::new();
              for s in arr.iter() {
                  *cnt.entry(s).or_insert(0) += 1;
              }
              let mut left = k;
              for s in arr.iter() {
                  if cnt[s] == 1 {
                      left -= 1;
                      if left == 0 {
                          return s.clone();
                      }
                  }
              }
              String::new()
          }
        `,
        php: code`
          function kthDistinct($arr, $k) {
              $cnt = [];
              foreach ($arr as $s) $cnt[$s] = (isset($cnt[$s]) ? $cnt[$s] : 0) + 1;
              foreach ($arr as $s) {
                  if ($cnt[$s] == 1) {
                      $k--;
                      if ($k == 0) return $s;
                  }
              }
              return "";
          }
        `,
        ruby: code`
          def kthDistinct(arr, k)
            cnt = Hash.new(0)
            arr.each { |s| cnt[s] += 1 }
            arr.each do |s|
              next unless cnt[s] == 1
              k -= 1
              return s if k == 0
            end
            ""
          end
        `,
      },
    };
  })(),

  // ── Check Whether Two Strings are Almost Equivalent (LC 2068) ───
  (() => {
    const ref = (w1: string, w2: string) => {
      for (const ch of "abcdefghijklmnopqrstuvwxyz") {
        const a = w1.split(ch).length - 1, b = w2.split(ch).length - 1;
        if (Math.abs(a - b) > 3) return false;
      }
      return true;
    };
    return {
      slug: "check-whether-two-strings-are-almost-equivalent",
      title: "Check Whether Two Strings are Almost Equivalent",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon", "Google"],
      signature: {
        funcName: "checkAlmostEquivalent",
        params: [{ name: "word1", type: "string" as const }, { name: "word2", type: "string" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "Two strings are **almost equivalent** when, for every letter from `'a'` to `'z'`, the number of times it occurs in one string differs from the number of times it occurs in the other by **at most 3**.\n\nGiven two lowercase strings `word1` and `word2` of the same length, return `true` if they are almost equivalent and `false` otherwise.",
        [
          { in: "word1 = \"duel\", word2 = \"lead\"", out: "true" },
          { in: "word1 = \"kkkkkiro\", word2 = \"kairoabc\"", out: "false", note: "`k` occurs 5 times in `word1` but once in `word2` — a gap of 4." },
          { in: "word1 = \"aaab\", word2 = \"bbbb\"", out: "true", note: "`a` differs by 3 and `b` by 3, which is allowed." },
        ],
        ["n == word1.length == word2.length", "1 <= n <= 100", "word1 and word2 consist only of lowercase English letters"]),
      hints: [
        "Only letter counts matter, not positions.",
        "Count the 26 letters of each word (or add for `word1` and subtract for `word2` in one array).",
        "Check that every one of the 26 differences has absolute value at most 3.",
      ],
      editorial: explain({
        idea: "Keep one array of 26 signed counters: add 1 for each letter of `word1`, subtract 1 for each letter of `word2`. Each counter is then the frequency difference of its letter.",
        steps: [
          "Initialise `diff[26] = 0`.",
          "For each character of `word1`, increment its counter; for each character of `word2`, decrement it.",
          "Return `true` exactly when every `|diff[c]| <= 3`.",
        ],
        why: "After both passes `diff[c] = count1(c) - count2(c)`, which is precisely the quantity the definition bounds, and the check covers all 26 letters — including those absent from one or both words.",
        time: "O(n + 26)",
        space: "O(1)",
        pitfalls: [
          "Letters that appear in only one word must still be checked — iterate over all 26, not just one word's letters.",
          "The bound is inclusive: a difference of exactly 3 is fine.",
          "Use the absolute value; the gap may go either way.",
        ],
      }),
      examples: [
        { input: "\"duel\"\n\"lead\"", expectedOutput: "true" },
        { input: "\"kkkkkiro\"\n\"kairoabc\"", expectedOutput: "false" },
        { input: "\"aaab\"\n\"bbbb\"", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [1, ri(rng, 1, 10), ri(rng, 4, 30), ri(rng, 8, 30)]);
        const alpha = pick(rng, ["ab", "abc", "kairo", "abcdefghijklmnopqrstuvwxyz"]);
        const w1 = randLower(rng, n, n, alpha);
        let w2: string;
        if (ri(rng, 0, 1) === 0) w2 = randLower(rng, n, n, pick(rng, [alpha, "ab", "z"]));
        else {
          const a = shuffle(rng, w1.split(""));
          const edits = ri(rng, 0, 9);
          for (let e = 0; e < edits; e++) a[ri(rng, 0, n - 1)] = alpha[ri(rng, 0, alpha.length - 1)];
          w2 = a.join("");
        }
        return { input: `"${w1}"\n"${w2}"`, expectedOutput: bool(ref(w1, w2)) };
      },
      solutions: {
        python: code`
          from collections import Counter

          def checkAlmostEquivalent(word1: str, word2: str) -> bool:
              c1, c2 = Counter(word1), Counter(word2)
              return all(abs(c1[ch] - c2[ch]) <= 3 for ch in 'abcdefghijklmnopqrstuvwxyz')
        `,
        javascript: code`
          var checkAlmostEquivalent = function(word1, word2) {
              var diff = [];
              for (var z = 0; z < 26; z++) diff.push(0);
              for (var i = 0; i < word1.length; i++) diff[word1.charCodeAt(i) - 97]++;
              for (var j = 0; j < word2.length; j++) diff[word2.charCodeAt(j) - 97]--;
              for (var c = 0; c < 26; c++) if (Math.abs(diff[c]) > 3) return false;
              return true;
          };
        `,
        typescript: code`
          function checkAlmostEquivalent(word1: string, word2: string): boolean {
              var diff: number[] = [];
              for (var z = 0; z < 26; z++) diff.push(0);
              for (var i = 0; i < word1.length; i++) diff[word1.charCodeAt(i) - 97]++;
              for (var j = 0; j < word2.length; j++) diff[word2.charCodeAt(j) - 97]--;
              for (var c = 0; c < 26; c++) if (Math.abs(diff[c]) > 3) return false;
              return true;
          }
        `,
        java: code`
          public static boolean checkAlmostEquivalent(String word1, String word2) {
              int[] diff = new int[26];
              for (int i = 0; i < word1.length(); i++) diff[word1.charAt(i) - 'a']++;
              for (int i = 0; i < word2.length(); i++) diff[word2.charAt(i) - 'a']--;
              for (int d : diff) if (Math.abs(d) > 3) return false;
              return true;
          }
        `,
        cpp: code`
          bool checkAlmostEquivalent(string word1, string word2) {
              int diff[26] = {0};
              for (char c : word1) diff[c - 'a']++;
              for (char c : word2) diff[c - 'a']--;
              for (int d : diff) if (abs(d) > 3) return false;
              return true;
          }
        `,
        c: code`
          bool checkAlmostEquivalent(const char* word1, const char* word2) {
              int diff[26] = {0};
              for (int i = 0; word1[i]; i++) diff[word1[i] - 'a']++;
              for (int i = 0; word2[i]; i++) diff[word2[i] - 'a']--;
              for (int c = 0; c < 26; c++) {
                  if (diff[c] > 3 || diff[c] < -3) return false;
              }
              return true;
          }
        `,
        csharp: code`
          public static bool CheckAlmostEquivalent(string word1, string word2)
          {
              var diff = new int[26];
              foreach (char c in word1) diff[c - 'a']++;
              foreach (char c in word2) diff[c - 'a']--;
              foreach (int d in diff) if (Math.Abs(d) > 3) return false;
              return true;
          }
        `,
        go: code`
          func checkAlmostEquivalent(word1 string, word2 string) bool {
          	var diff [26]int
          	for i := 0; i < len(word1); i++ {
          		diff[word1[i]-'a']++
          	}
          	for i := 0; i < len(word2); i++ {
          		diff[word2[i]-'a']--
          	}
          	for _, d := range diff {
          		if d > 3 || d < -3 {
          			return false
          		}
          	}
          	return true
          }
        `,
        kotlin: code`
          fun checkAlmostEquivalent(word1: String, word2: String): Boolean {
              val diff = IntArray(26)
              for (c in word1) diff[c - 'a']++
              for (c in word2) diff[c - 'a']--
              return diff.all { Math.abs(it) <= 3 }
          }
        `,
        swift: code`
          func checkAlmostEquivalent(_ word1: String, _ word2: String) -> Bool {
              var diff = [Int](repeating: 0, count: 26)
              for b in word1.utf8 { diff[Int(b) - 97] += 1 }
              for b in word2.utf8 { diff[Int(b) - 97] -= 1 }
              return diff.allSatisfy { abs($0) <= 3 }
          }
        `,
        rust: code`
          fn checkAlmostEquivalent(word1: String, word2: String) -> bool {
              let mut diff = [0i32; 26];
              for b in word1.bytes() {
                  diff[(b - b'a') as usize] += 1;
              }
              for b in word2.bytes() {
                  diff[(b - b'a') as usize] -= 1;
              }
              diff.iter().all(|d| d.abs() <= 3)
          }
        `,
        php: code`
          function checkAlmostEquivalent($word1, $word2) {
              $diff = array_fill(0, 26, 0);
              $n1 = strlen($word1);
              $n2 = strlen($word2);
              for ($i = 0; $i < $n1; $i++) $diff[ord($word1[$i]) - 97]++;
              for ($i = 0; $i < $n2; $i++) $diff[ord($word2[$i]) - 97]--;
              foreach ($diff as $d) if (abs($d) > 3) return false;
              return true;
          }
        `,
        ruby: code`
          def checkAlmostEquivalent(word1, word2)
            diff = Array.new(26, 0)
            word1.each_byte { |b| diff[b - 97] += 1 }
            word2.each_byte { |b| diff[b - 97] -= 1 }
            diff.all? { |d| d.abs <= 3 }
          end
        `,
      },
    };
  })(),

  // ── Calculate Digit Sum of a String (LC 2243) ───────────────────
  (() => {
    const ref = (s: string, k: number) => {
      let cur = s;
      while (cur.length > k) {
        let nxt = "";
        for (let i = 0; i < cur.length; i += k) {
          let sum = 0;
          for (const ch of cur.slice(i, i + k)) sum += Number(ch);
          nxt += String(sum);
        }
        cur = nxt;
      }
      return cur;
    };
    return {
      slug: "calculate-digit-sum-of-a-string",
      title: "Calculate Digit Sum of a String",
      difficulty: "EASY" as const,
      tags: ["String", "Simulation", "Amazon", "Google"],
      signature: {
        funcName: "digitSum",
        params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }],
        returns: "string" as const,
      },
      description: describe(
        "You are given a string of digits `s` and an integer `k`. While `s` is **longer** than `k`, perform a round:\n\n1. Cut `s` into consecutive groups of `k` characters — the first `k` characters, the next `k`, and so on; the last group may be shorter.\n2. Replace every group by the decimal representation of the sum of its digits (so `\"346\"` becomes `\"13\"`).\n3. Concatenate the results, in order, to form the new `s`.\n\nReturn `s` once its length is at most `k`.",
        [
          { in: "s = \"20261002\", k = 3", out: "472", note: "Groups `202`, `610`, `02` sum to 4, 7 and 2." },
          { in: "s = \"9999\", k = 2", out: "99", note: "`9999` → `1818` → `99`." },
          { in: "s = \"12\", k = 5", out: "12", note: "Already short enough — no rounds." },
        ],
        ["1 <= s.length <= 100", "2 <= k <= 100", "s consists of digits only"]),
      hints: [
        "Simulate the rounds exactly as described.",
        "In each round step through `s` in strides of `k` and sum the digits of each slice.",
        "Append each sum as text (it may have more than one digit) and loop until the length is at most `k`.",
      ],
      editorial: explain({
        idea: "The process is fully specified and short-lived, so simulate it: each round turns every group of `k` digits into the text of its digit sum.",
        steps: [
          "While `len(s) > k`:",
          "Build `next` by walking `i = 0, k, 2k, …`, summing the digits of `s[i .. i+k)` (clipped at the end) and appending the sum's decimal text.",
          "Set `s = next`.",
          "Return `s`.",
        ],
        why: "The loop applies the round literally, so its result is the defined one. It always stops: a full group whose sum is a single digit makes the string shorter, and a group whose sum has two or more digits makes the total digit sum strictly smaller (a number's digit sum is below the number once it reaches 10), so the string cannot stay long forever.",
        time: "O(n) per round, and the length drops quickly",
        space: "O(n)",
        pitfalls: [
          "A group sum can have several digits (`\"99\"` → `\"18\"`) — append all of them.",
          "The last group may be shorter than `k`; do not read past the end.",
          "Stop when the length is `<= k`, not `< k`.",
        ],
      }),
      examples: [
        { input: "\"20261002\"\n3", expectedOutput: "472" },
        { input: "\"9999\"\n2", expectedOutput: "99" },
        { input: "\"12\"\n5", expectedOutput: "12" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["0123456789", "9", "0", "19", "5678"]);
        const s = randLower(rng, 1, pick(rng, [5, 20, 60]), alpha);
        const k = ri(rng, 0, 9) === 0 ? ri(rng, 2, 100) : ri(rng, 2, 6);
        return { input: `"${s}"\n${k}`, expectedOutput: ref(s, k) };
      },
      solutions: {
        python: code`
          def digitSum(s: str, k: int) -> str:
              while len(s) > k:
                  s = ''.join(str(sum(int(c) for c in s[i:i + k])) for i in range(0, len(s), k))
              return s
        `,
        javascript: code`
          var digitSum = function(s, k) {
              while (s.length > k) {
                  var next = "";
                  for (var i = 0; i < s.length; i += k) {
                      var sum = 0;
                      for (var j = i; j < i + k && j < s.length; j++) sum += s.charCodeAt(j) - 48;
                      next += String(sum);
                  }
                  s = next;
              }
              return s;
          };
        `,
        typescript: code`
          function digitSum(s: string, k: number): string {
              while (s.length > k) {
                  var next = "";
                  for (var i = 0; i < s.length; i += k) {
                      var sum = 0;
                      for (var j = i; j < i + k && j < s.length; j++) sum += s.charCodeAt(j) - 48;
                      next += String(sum);
                  }
                  s = next;
              }
              return s;
          }
        `,
        java: code`
          public static String digitSum(String s, int k) {
              while (s.length() > k) {
                  StringBuilder next = new StringBuilder();
                  for (int i = 0; i < s.length(); i += k) {
                      int sum = 0;
                      for (int j = i; j < i + k && j < s.length(); j++) sum += s.charAt(j) - '0';
                      next.append(sum);
                  }
                  s = next.toString();
              }
              return s;
          }
        `,
        cpp: code`
          string digitSum(string s, int k) {
              while ((int)s.size() > k) {
                  string next;
                  for (int i = 0; i < (int)s.size(); i += k) {
                      int sum = 0;
                      for (int j = i; j < i + k && j < (int)s.size(); j++) sum += s[j] - '0';
                      next += to_string(sum);
                  }
                  s = next;
              }
              return s;
          }
        `,
        c: code`
          char* digitSum(const char* s, int k) {
              int n = (int)strlen(s);
              char* cur = (char*)malloc(n + 1);
              memcpy(cur, s, n + 1);
              while (n > k) {
                  char* nxt = (char*)malloc(4 * n + 2);
                  int m = 0;
                  for (int i = 0; i < n; i += k) {
                      int sum = 0;
                      for (int j = i; j < i + k && j < n; j++) sum += cur[j] - '0';
                      m += sprintf(nxt + m, "%d", sum);
                  }
                  nxt[m] = '\0';
                  free(cur);
                  cur = nxt;
                  n = m;
              }
              return cur;
          }
        `,
        csharp: code`
          public static string DigitSum(string s, int k)
          {
              while (s.Length > k)
              {
                  var parts = new List<string>();
                  for (int i = 0; i < s.Length; i += k)
                  {
                      int sum = 0;
                      for (int j = i; j < i + k && j < s.Length; j++) sum += s[j] - '0';
                      parts.Add(sum.ToString());
                  }
                  s = string.Concat(parts);
              }
              return s;
          }
        `,
        go: code`
          func digitSum(s string, k int) string {
          	for len(s) > k {
          		next := ""
          		for i := 0; i < len(s); i += k {
          			sum := 0
          			for j := i; j < i+k && j < len(s); j++ {
          				sum += int(s[j] - '0')
          			}
          			next += strconv.Itoa(sum)
          		}
          		s = next
          	}
          	return s
          }
        `,
        kotlin: code`
          fun digitSum(s: String, k: Int): String {
              var cur = s
              while (cur.length > k) {
                  val next = StringBuilder()
                  var i = 0
                  while (i < cur.length) {
                      var sum = 0
                      var j = i
                      while (j < i + k && j < cur.length) {
                          sum += cur[j] - '0'
                          j++
                      }
                      next.append(sum)
                      i += k
                  }
                  cur = next.toString()
              }
              return cur
          }
        `,
        swift: code`
          func digitSum(_ s: String, _ k: Int) -> String {
              var cur = Array(s.utf8)
              while cur.count > k {
                  var next: [UInt8] = []
                  var i = 0
                  while i < cur.count {
                      var sum = 0
                      var j = i
                      while j < i + k && j < cur.count {
                          sum += Int(cur[j]) - 48
                          j += 1
                      }
                      next.append(contentsOf: Array(String(sum).utf8))
                      i += k
                  }
                  cur = next
              }
              return String(decoding: cur, as: UTF8.self)
          }
        `,
        rust: code`
          fn digitSum(s: String, k: i32) -> String {
              let k = k as usize;
              let mut cur = s;
              while cur.len() > k {
                  let b = cur.as_bytes();
                  let mut next = String::new();
                  let mut i = 0;
                  while i < b.len() {
                      let mut sum = 0;
                      let mut j = i;
                      while j < i + k && j < b.len() {
                          sum += (b[j] - b'0') as i32;
                          j += 1;
                      }
                      next.push_str(&sum.to_string());
                      i += k;
                  }
                  cur = next;
              }
              cur
          }
        `,
        php: code`
          function digitSum($s, $k) {
              while (strlen($s) > $k) {
                  $next = '';
                  $n = strlen($s);
                  for ($i = 0; $i < $n; $i += $k) {
                      $sum = 0;
                      for ($j = $i; $j < $i + $k && $j < $n; $j++) $sum += ord($s[$j]) - 48;
                      $next .= (string)$sum;
                  }
                  $s = $next;
              }
              return $s;
          }
        `,
        ruby: code`
          def digitSum(s, k)
            while s.length > k
              s = s.chars.each_slice(k).map { |g| g.map(&:to_i).sum.to_s }.join
            end
            s
          end
        `,
      },
    };
  })(),

  // ── Remove Digit From Number to Maximize Result (LC 2259) ───────
  (() => {
    // Tries every occurrence; equal-length digit strings compare like numbers.
    const ref = (number: string, digit: string) => {
      let best = "";
      for (let i = 0; i < number.length; i++) {
        if (number[i] !== digit) continue;
        const cand = number.slice(0, i) + number.slice(i + 1);
        if (cand > best) best = cand;
      }
      return best;
    };
    return {
      slug: "remove-digit-from-number-to-maximize-result",
      title: "Remove Digit From Number to Maximize Result",
      difficulty: "EASY" as const,
      tags: ["String", "Greedy", "Enumeration", "Amazon", "Microsoft"],
      signature: {
        funcName: "removeDigit",
        params: [{ name: "number", type: "string" as const }, { name: "digit", type: "string" as const }],
        returns: "string" as const,
      },
      description: describe(
        "You are given a positive integer as a string `number` and a single character `digit` that occurs in `number` at least once.\n\nRemove **exactly one** occurrence of `digit` from `number` so that the remaining string, read as a decimal number, is as **large** as possible. Return that remaining string.",
        [
          { in: "number = \"1231\", digit = \"1\"", out: "231", note: "Removing the first `1` gives 231; removing the last gives 123." },
          { in: "number = \"551\", digit = \"5\"", out: "51", note: "Either `5` gives the same result." },
          { in: "number = \"9479\", digit = \"9\"", out: "947" },
        ],
        [
          "2 <= number.length <= 100",
          "number consists of digits from '1' to '9'",
          "digit is a digit from '1' to '9'",
          "digit occurs at least once in number",
        ]),
      hints: [
        "Every candidate has the same length, so comparing them as strings compares them as numbers.",
        "Trying each occurrence and keeping the best already works for 100 digits.",
        "Greedy: remove the first occurrence that is followed by a larger digit — that raises the earliest possible position. If no such occurrence exists, remove the last one.",
      ],
      editorial: explain({
        idea: "Removing `digit` at index `i` shifts the next character into position `i`. The result grows at the earliest position possible when that next character is larger than `digit`, so the best choice is the first such occurrence; if every occurrence is followed by a smaller-or-equal digit (or nothing), removing the last occurrence disturbs the number as late as possible.",
        steps: [
          "Scan `number` from left to right, remembering the index `last` of each occurrence of `digit`.",
          "At an occurrence `i` with `number[i+1] > digit`, stop and remove index `i`.",
          "If the scan finishes, remove index `last`.",
          "Return the string without that character.",
        ],
        why: "Two candidates that remove occurrences `i < j` agree before position `i`; at position `i` the first has `number[i+1]` and the second still has `digit`. If `number[i+1] > digit` the first is larger, and choosing the earliest such `i` beats every later removal. If `number[i+1] < digit` the first is smaller, so a later removal wins; if they are equal the comparison moves on in the same way. Hence, without an improving occurrence, the last occurrence is best. The simple alternative — build all candidates and keep the largest — is also correct at these sizes.",
        time: "O(n)",
        space: "O(n) for the result",
        pitfalls: [
          "Do not convert to an integer: 100 digits overflow every fixed-width type.",
          "Removing the first occurrence is not always right (`\"9479\"` with `9`).",
          "With no improving occurrence, remove the *last* occurrence, not the first.",
        ],
      }),
      examples: [
        { input: "\"1231\"\n\"1\"", expectedOutput: "231" },
        { input: "\"551\"\n\"5\"", expectedOutput: "51" },
        { input: "\"9479\"\n\"9\"", expectedOutput: "947" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["12", "123", "19", "959", "123456789", "5"]);
        const number = randLower(rng, 2, pick(rng, [4, 12, 30]), alpha);
        const digit = number[ri(rng, 0, number.length - 1)];
        return { input: `"${number}"\n"${digit}"`, expectedOutput: ref(number, digit) };
      },
      solutions: {
        python: code`
          def removeDigit(number: str, digit: str) -> str:
              last = -1
              for i, c in enumerate(number):
                  if c == digit:
                      last = i
                      if i + 1 < len(number) and number[i + 1] > digit:
                          break
              return number[:last] + number[last + 1:]
        `,
        javascript: code`
          var removeDigit = function(number, digit) {
              var idx = -1;
              for (var i = 0; i < number.length; i++) {
                  if (number[i] === digit) {
                      idx = i;
                      if (i + 1 < number.length && number[i + 1] > digit) break;
                  }
              }
              return number.slice(0, idx) + number.slice(idx + 1);
          };
        `,
        typescript: code`
          function removeDigit(number: string, digit: string): string {
              var idx = -1;
              for (var i = 0; i < number.length; i++) {
                  if (number.charAt(i) === digit) {
                      idx = i;
                      if (i + 1 < number.length && number.charAt(i + 1) > digit) break;
                  }
              }
              return number.substring(0, idx) + number.substring(idx + 1);
          }
        `,
        java: code`
          public static String removeDigit(String number, String digit) {
              char d = digit.charAt(0);
              int idx = -1;
              for (int i = 0; i < number.length(); i++) {
                  if (number.charAt(i) == d) {
                      idx = i;
                      if (i + 1 < number.length() && number.charAt(i + 1) > d) break;
                  }
              }
              return number.substring(0, idx) + number.substring(idx + 1);
          }
        `,
        cpp: code`
          string removeDigit(string number, string digit) {
              char d = digit[0];
              int n = number.size(), idx = -1;
              for (int i = 0; i < n; i++) {
                  if (number[i] == d) {
                      idx = i;
                      if (i + 1 < n && number[i + 1] > d) break;
                  }
              }
              return number.substr(0, idx) + number.substr(idx + 1);
          }
        `,
        c: code`
          char* removeDigit(const char* number, const char* digit) {
              int n = (int)strlen(number);
              char d = digit[0];
              int idx = -1;
              for (int i = 0; i < n; i++) {
                  if (number[i] == d) {
                      idx = i;
                      if (i + 1 < n && number[i + 1] > d) break;
                  }
              }
              char* res = (char*)malloc(n);
              int k = 0;
              for (int i = 0; i < n; i++) {
                  if (i != idx) res[k++] = number[i];
              }
              res[k] = '\0';
              return res;
          }
        `,
        csharp: code`
          public static string RemoveDigit(string number, string digit)
          {
              char d = digit[0];
              int idx = -1;
              for (int i = 0; i < number.Length; i++)
              {
                  if (number[i] == d)
                  {
                      idx = i;
                      if (i + 1 < number.Length && number[i + 1] > d) break;
                  }
              }
              return number.Remove(idx, 1);
          }
        `,
        go: code`
          func removeDigit(number string, digit string) string {
          	d := digit[0]
          	idx := -1
          	for i := 0; i < len(number); i++ {
          		if number[i] == d {
          			idx = i
          			if i+1 < len(number) && number[i+1] > d {
          				break
          			}
          		}
          	}
          	return number[:idx] + number[idx+1:]
          }
        `,
        kotlin: code`
          fun removeDigit(number: String, digit: String): String {
              val d = digit[0]
              var idx = -1
              for (i in number.indices) {
                  if (number[i] == d) {
                      idx = i
                      if (i + 1 < number.length && number[i + 1] > d) break
                  }
              }
              return number.substring(0, idx) + number.substring(idx + 1)
          }
        `,
        swift: code`
          func removeDigit(_ number: String, _ digit: String) -> String {
              var a = Array(number.utf8)
              let d = Array(digit.utf8)[0]
              var idx = -1
              var i = 0
              while i < a.count {
                  if a[i] == d {
                      idx = i
                      if i + 1 < a.count && a[i + 1] > d { break }
                  }
                  i += 1
              }
              a.remove(at: idx)
              return String(decoding: a, as: UTF8.self)
          }
        `,
        rust: code`
          fn removeDigit(number: String, digit: String) -> String {
              let b = number.as_bytes();
              let d = digit.as_bytes()[0];
              let mut idx = 0;
              for i in 0..b.len() {
                  if b[i] == d {
                      idx = i;
                      if i + 1 < b.len() && b[i + 1] > d {
                          break;
                      }
                  }
              }
              let mut res = String::new();
              res.push_str(&number[..idx]);
              res.push_str(&number[idx + 1..]);
              res
          }
        `,
        php: code`
          function removeDigit($number, $digit) {
              $n = strlen($number);
              $idx = -1;
              for ($i = 0; $i < $n; $i++) {
                  if ($number[$i] === $digit) {
                      $idx = $i;
                      if ($i + 1 < $n && strcmp($number[$i + 1], $digit) > 0) break;
                  }
              }
              return substr($number, 0, $idx) . substr($number, $idx + 1);
          }
        `,
        ruby: code`
          def removeDigit(number, digit)
            idx = -1
            number.each_char.with_index do |c, i|
              next unless c == digit
              idx = i
              break if i + 1 < number.length && number[i + 1] > digit
            end
            number[0, idx] + number[(idx + 1)..-1]
          end
        `,
      },
    };
  })(),

  // ── Find Resultant Array After Removing Anagrams (LC 2273) ──────
  (() => {
    const sig = (w: string) => w.split("").sort().join("");
    // Applies the deletion operation literally until no adjacent anagram pair is left.
    const ref = (words: string[]) => {
      const cur = words.slice();
      for (;;) {
        let hit = -1;
        for (let i = 1; i < cur.length; i++) if (sig(cur[i]) === sig(cur[i - 1])) { hit = i; break; }
        if (hit < 0) return cur;
        cur.splice(hit, 1);
      }
    };
    return {
      slug: "find-resultant-array-after-removing-anagrams",
      title: "Find Resultant Array After Removing Anagrams",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "String", "Sorting", "Amazon", "Google"],
      signature: { funcName: "removeAnagrams", params: [{ name: "words", type: "string[]" as const }], returns: "string[]" as const },
      description: describe(
        "You are given an array `words` of lowercase strings. In one operation, pick an index `i` with `0 < i < words.length` such that `words[i - 1]` and `words[i]` are **anagrams** (one is a rearrangement of the other's letters), and delete `words[i]`.\n\nKeep performing operations while any such index exists. Return the final array. The result is the same whatever order the operations are performed in.",
        [
          { in: "words = [\"kairo\",\"oriak\",\"duel\",\"lude\",\"duel\",\"bug\"]", out: "[\"kairo\",\"duel\",\"bug\"]", note: "`oriak` follows its anagram `kairo`; `lude` and the second `duel` follow anagrams of themselves." },
          { in: "words = [\"a\",\"b\",\"c\"]", out: "[\"a\",\"b\",\"c\"]" },
          { in: "words = [\"ab\",\"ba\",\"ab\",\"ba\"]", out: "[\"ab\"]" },
        ],
        ["1 <= words.length <= 100", "1 <= words[i].length <= 10", "words[i] consists of lowercase English letters"]),
      hints: [
        "Being anagrams is an equivalence: sort a word's letters to get a canonical key.",
        "A word survives exactly when it is not an anagram of the word just before it in the original array.",
        "Walk the array once, keep a word if its key differs from the previous word's key, and always move the 'previous' key forward.",
      ],
      editorial: explain({
        idea: "Deletions only ever remove a word that is an anagram of its left neighbour, so each maximal run of consecutive mutual anagrams collapses to its first word — and that is decided by comparing each word with the one right before it.",
        steps: [
          "For each word compute `key = sorted letters`.",
          "Keep `words[0]`.",
          "For `i >= 1`, keep `words[i]` when `key(words[i]) != key(words[i-1])`.",
          "Return the kept words in order.",
        ],
        why: "Anagram-ness is transitive, so the array splits into maximal blocks of consecutive words sharing a key. Inside a block every word after the first has an anagram on its left and is eventually deleted, while the first word of a block never has an anagram immediately to its left (the word before it, or whatever block-first word ends up there, has a different key). Comparing each word with its original predecessor detects exactly the block starts.",
        time: "O(n · L log L)",
        space: "O(n · L)",
        pitfalls: [
          "Compare with the immediately preceding word, not with every earlier word — `[\"ab\",\"c\",\"ba\"]` keeps all three.",
          "Equal words are anagrams of each other too.",
          "Sorting the letters (or counting them) is the anagram test; comparing lengths alone is not enough.",
        ],
      }),
      examples: [
        { input: "[\"kairo\",\"oriak\",\"duel\",\"lude\",\"duel\",\"bug\"]", expectedOutput: "[\"kairo\",\"duel\",\"bug\"]" },
        { input: "[\"a\",\"b\",\"c\"]", expectedOutput: "[\"a\",\"b\",\"c\"]" },
        { input: "[\"ab\",\"ba\",\"ab\",\"ba\"]", expectedOutput: "[\"ab\"]" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "kairo", "abcdefghijklmnopqrstuvwxyz"]);
        const bases = Array.from({ length: ri(rng, 1, 4) }, () => randLower(rng, 1, 5, alpha));
        const n = ri(rng, 1, 15);
        const words: string[] = [];
        for (let i = 0; i < n; i++) {
          if (ri(rng, 0, 5) === 0) words.push(randLower(rng, 1, 5, alpha));
          else words.push(shuffle(rng, pick(rng, bases).split("")).join(""));
        }
        return { input: fmtStrArr(words), expectedOutput: fmtStrArr(ref(words)) };
      },
      solutions: {
        python: code`
          from typing import List

          def removeAnagrams(words: List[str]) -> List[str]:
              res = []
              prev = None
              for w in words:
                  key = ''.join(sorted(w))
                  if key != prev:
                      res.append(w)
                  prev = key
              return res
        `,
        javascript: code`
          var removeAnagrams = function(words) {
              var res = [];
              var prev = null;
              for (var i = 0; i < words.length; i++) {
                  var key = words[i].split("").sort().join("");
                  if (key !== prev) res.push(words[i]);
                  prev = key;
              }
              return res;
          };
        `,
        typescript: code`
          function removeAnagrams(words: string[]): string[] {
              var res: string[] = [];
              var prev = "";
              for (var i = 0; i < words.length; i++) {
                  var key = words[i].split("").sort().join("");
                  if (i === 0 || key !== prev) res.push(words[i]);
                  prev = key;
              }
              return res;
          }
        `,
        java: code`
          public static String[] removeAnagrams(String[] words) {
              List<String> res = new ArrayList<>();
              String prev = null;
              for (String w : words) {
                  char[] a = w.toCharArray();
                  Arrays.sort(a);
                  String key = new String(a);
                  if (!key.equals(prev)) res.add(w);
                  prev = key;
              }
              return res.toArray(new String[0]);
          }
        `,
        cpp: code`
          vector<string> removeAnagrams(vector<string>& words) {
              vector<string> res;
              string prev;
              for (int i = 0; i < (int)words.size(); i++) {
                  string key = words[i];
                  sort(key.begin(), key.end());
                  if (i == 0 || key != prev) res.push_back(words[i]);
                  prev = key;
              }
              return res;
          }
        `,
        c: code`
          static int raCmp(const void* a, const void* b) {
              return (int)(*(const char*)a) - (int)(*(const char*)b);
          }

          char** removeAnagrams(char** words, int wordsSize, int* returnSize) {
              char** res = (char**)malloc(sizeof(char*) * (wordsSize + 1));
              int k = 0;
              char prev[16];
              prev[0] = '\0';
              for (int i = 0; i < wordsSize; i++) {
                  char key[16];
                  int len = (int)strlen(words[i]);
                  memcpy(key, words[i], len + 1);
                  qsort(key, len, 1, raCmp);
                  if (i == 0 || strcmp(key, prev) != 0) res[k++] = words[i];
                  memcpy(prev, key, len + 1);
              }
              *returnSize = k;
              return res;
          }
        `,
        csharp: code`
          public static string[] RemoveAnagrams(string[] words)
          {
              var res = new List<string>();
              string prev = null;
              foreach (var w in words)
              {
                  var a = w.ToCharArray();
                  Array.Sort(a);
                  var key = new string(a);
                  if (key != prev) res.Add(w);
                  prev = key;
              }
              return res.ToArray();
          }
        `,
        go: code`
          func removeAnagrams(words []string) []string {
          	res := []string{}
          	prev := ""
          	for i, w := range words {
          		b := []byte(w)
          		sort.Slice(b, func(x, y int) bool { return b[x] < b[y] })
          		key := string(b)
          		if i == 0 || key != prev {
          			res = append(res, w)
          		}
          		prev = key
          	}
          	return res
          }
        `,
        kotlin: code`
          fun removeAnagrams(words: Array<String>): Array<String> {
              val res = ArrayList<String>()
              var prev: String? = null
              for (w in words) {
                  val key = String(w.toCharArray().sortedArray())
                  if (key != prev) res.add(w)
                  prev = key
              }
              return res.toTypedArray()
          }
        `,
        swift: code`
          func removeAnagrams(_ words: [String]) -> [String] {
              var res: [String] = []
              var prev: String? = nil
              for w in words {
                  let key = String(w.sorted())
                  if key != prev { res.append(w) }
                  prev = key
              }
              return res
          }
        `,
        rust: code`
          fn removeAnagrams(words: Vec<String>) -> Vec<String> {
              let mut res: Vec<String> = Vec::new();
              let mut prev: Option<Vec<u8>> = None;
              for w in words.iter() {
                  let mut key = w.as_bytes().to_vec();
                  key.sort();
                  if prev.as_ref() != Some(&key) {
                      res.push(w.clone());
                  }
                  prev = Some(key);
              }
              res
          }
        `,
        php: code`
          function removeAnagrams($words) {
              $res = [];
              $prev = null;
              foreach ($words as $w) {
                  $chars = str_split($w);
                  sort($chars);
                  $key = implode('', $chars);
                  if ($key !== $prev) $res[] = $w;
                  $prev = $key;
              }
              return $res;
          }
        `,
        ruby: code`
          def removeAnagrams(words)
            res = []
            prev = nil
            words.each do |w|
              key = w.chars.sort.join
              res << w if key != prev
              prev = key
            end
            res
          end
        `,
      },
    };
  })(),

  // ── Greatest English Letter in Upper and Lower Case (LC 2309) ───
  (() => {
    const ref = (s: string) => {
      for (let c = 25; c >= 0; c--) {
        const up = String.fromCharCode(65 + c), lo = String.fromCharCode(97 + c);
        if (s.includes(up) && s.includes(lo)) return up;
      }
      return "";
    };
    return {
      slug: "greatest-english-letter-in-upper-and-lower-case",
      title: "Greatest English Letter in Upper and Lower Case",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Enumeration", "Microsoft", "Amazon"],
      signature: { funcName: "greatestLetter", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "The string `s` contains English letters in both cases.\n\nAmong the letters that appear in `s` **both** as a lowercase letter and as an uppercase letter, find the one that comes latest in the alphabet and return it as an **uppercase** one-character string. If no letter appears in both cases, return the empty string `\"\"`.",
        [
          { in: "s = \"KaiRoKAIro\"", out: "R", note: "A, I and R appear in both cases; R is the greatest." },
          { in: "s = \"codeKAIRO\"", out: "O" },
          { in: "s = \"Bug\"", out: "\"\"", note: "No letter appears in both cases, so the answer is the empty string." },
        ],
        ["1 <= s.length <= 1000", "s consists of lowercase and uppercase English letters"]),
      hints: [
        "Record which lowercase letters and which uppercase letters occur.",
        "Two arrays of 26 flags (or one set of characters) are enough.",
        "Check the letters from `Z` down to `A` and return the first one present in both cases.",
      ],
      editorial: explain({
        idea: "Mark the letters seen in each case, then scan the alphabet from the top; the first letter marked in both cases is the greatest.",
        steps: [
          "Create flags `lower[26]` and `upper[26]`.",
          "For each character set the flag of its case.",
          "For `c` from 25 down to 0, if `lower[c]` and `upper[c]`, return the uppercase letter `'A' + c`.",
          "Return `\"\"` if the scan finds nothing.",
        ],
        why: "The flags record exactly which letters occur in which case, and scanning from `Z` downward returns the largest qualifying letter first. The answer is required in uppercase, which is what is returned.",
        time: "O(n + 26)",
        space: "O(1)",
        pitfalls: [
          "Return the uppercase form even though the letter also appears in lowercase.",
          "Compare letters by alphabet position, not by raw character codes across cases (every uppercase code is smaller than every lowercase one).",
          "Return the empty string, not a space or null, when no letter qualifies.",
        ],
      }),
      examples: [
        { input: "\"KaiRoKAIro\"", expectedOutput: "R" },
        { input: "\"codeKAIRO\"", expectedOutput: "O" },
        { input: "\"Bug\"", expectedOutput: "" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["aA", "abAB", "kairoKAIRO", "xyzXYZ", "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", "abcdeQRSTU", "zZm"]);
        const s = randLower(rng, 1, pick(rng, [3, 12, 40]), alpha);
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: code`
          def greatestLetter(s: str) -> str:
              present = set(s)
              for c in reversed('ABCDEFGHIJKLMNOPQRSTUVWXYZ'):
                  if c in present and c.lower() in present:
                      return c
              return ""
        `,
        javascript: code`
          var greatestLetter = function(s) {
              var lower = [], upper = [];
              for (var z = 0; z < 26; z++) { lower.push(false); upper.push(false); }
              for (var i = 0; i < s.length; i++) {
                  var c = s.charCodeAt(i);
                  if (c >= 97) lower[c - 97] = true;
                  else upper[c - 65] = true;
              }
              for (var k = 25; k >= 0; k--) {
                  if (lower[k] && upper[k]) return String.fromCharCode(65 + k);
              }
              return "";
          };
        `,
        typescript: code`
          function greatestLetter(s: string): string {
              var lower: boolean[] = [], upper: boolean[] = [];
              for (var z = 0; z < 26; z++) { lower.push(false); upper.push(false); }
              for (var i = 0; i < s.length; i++) {
                  var c = s.charCodeAt(i);
                  if (c >= 97) lower[c - 97] = true;
                  else upper[c - 65] = true;
              }
              for (var k = 25; k >= 0; k--) {
                  if (lower[k] && upper[k]) return String.fromCharCode(65 + k);
              }
              return "";
          }
        `,
        java: code`
          public static String greatestLetter(String s) {
              boolean[] lower = new boolean[26], upper = new boolean[26];
              for (int i = 0; i < s.length(); i++) {
                  char c = s.charAt(i);
                  if (c >= 'a') lower[c - 'a'] = true;
                  else upper[c - 'A'] = true;
              }
              for (int k = 25; k >= 0; k--) {
                  if (lower[k] && upper[k]) return String.valueOf((char) ('A' + k));
              }
              return "";
          }
        `,
        cpp: code`
          string greatestLetter(string s) {
              bool lower[26] = {false}, upper[26] = {false};
              for (char c : s) {
                  if (c >= 'a') lower[c - 'a'] = true;
                  else upper[c - 'A'] = true;
              }
              for (int k = 25; k >= 0; k--) {
                  if (lower[k] && upper[k]) return string(1, (char)('A' + k));
              }
              return "";
          }
        `,
        c: code`
          char* greatestLetter(const char* s) {
              int lower[26] = {0}, upper[26] = {0};
              for (int i = 0; s[i]; i++) {
                  if (s[i] >= 'a') lower[s[i] - 'a'] = 1;
                  else upper[s[i] - 'A'] = 1;
              }
              char* res = (char*)malloc(2);
              res[0] = '\0';
              res[1] = '\0';
              for (int k = 25; k >= 0; k--) {
                  if (lower[k] && upper[k]) {
                      res[0] = (char)('A' + k);
                      break;
                  }
              }
              return res;
          }
        `,
        csharp: code`
          public static string GreatestLetter(string s)
          {
              var lower = new bool[26];
              var upper = new bool[26];
              foreach (char c in s)
              {
                  if (c >= 'a') lower[c - 'a'] = true;
                  else upper[c - 'A'] = true;
              }
              for (int k = 25; k >= 0; k--)
              {
                  if (lower[k] && upper[k]) return ((char)('A' + k)).ToString();
              }
              return "";
          }
        `,
        go: code`
          func greatestLetter(s string) string {
          	var lower, upper [26]bool
          	for i := 0; i < len(s); i++ {
          		c := s[i]
          		if c >= 'a' {
          			lower[c-'a'] = true
          		} else {
          			upper[c-'A'] = true
          		}
          	}
          	for k := 25; k >= 0; k-- {
          		if lower[k] && upper[k] {
          			return string([]byte{byte('A' + k)})
          		}
          	}
          	return ""
          }
        `,
        kotlin: code`
          fun greatestLetter(s: String): String {
              val lower = BooleanArray(26)
              val upper = BooleanArray(26)
              for (c in s) {
                  if (c >= 'a') lower[c - 'a'] = true
                  else upper[c - 'A'] = true
              }
              for (k in 25 downTo 0) {
                  if (lower[k] && upper[k]) return ('A' + k).toString()
              }
              return ""
          }
        `,
        swift: code`
          func greatestLetter(_ s: String) -> String {
              var lower = [Bool](repeating: false, count: 26)
              var upper = [Bool](repeating: false, count: 26)
              for b in s.utf8 {
                  if b >= 97 { lower[Int(b) - 97] = true }
                  else { upper[Int(b) - 65] = true }
              }
              let letters = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
              var k = 25
              while k >= 0 {
                  if lower[k] && upper[k] { return String(letters[k]) }
                  k -= 1
              }
              return ""
          }
        `,
        rust: code`
          fn greatestLetter(s: String) -> String {
              let mut lower = [false; 26];
              let mut upper = [false; 26];
              for b in s.bytes() {
                  if b >= b'a' {
                      lower[(b - b'a') as usize] = true;
                  } else {
                      upper[(b - b'A') as usize] = true;
                  }
              }
              for k in (0..26).rev() {
                  if lower[k] && upper[k] {
                      return ((b'A' + k as u8) as char).to_string();
                  }
              }
              String::new()
          }
        `,
        php: code`
          function greatestLetter($s) {
              $lower = array_fill(0, 26, false);
              $upper = array_fill(0, 26, false);
              $n = strlen($s);
              for ($i = 0; $i < $n; $i++) {
                  $c = ord($s[$i]);
                  if ($c >= 97) $lower[$c - 97] = true;
                  else $upper[$c - 65] = true;
              }
              for ($k = 25; $k >= 0; $k--) {
                  if ($lower[$k] && $upper[$k]) return chr(65 + $k);
              }
              return "";
          }
        `,
        ruby: code`
          def greatestLetter(s)
            25.downto(0) do |k|
              up = (65 + k).chr
              return up if s.include?(up) && s.include?((97 + k).chr)
            end
            ""
          end
        `,
      },
    };
  })(),

];
