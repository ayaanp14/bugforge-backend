/**
 * Dynamic programming, digit DP & counting problems — wave 7, batch 03.
 * Real problems only: LeetCode numbered problems from the 2800–3200 range.
 * Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * int32 rule: where the original problem's answer can exceed a signed 32-bit
 * int and it has no modulus, the stated constraints are reduced so it provably
 * cannot (Count the Number of Powerful Integers takes `finish <= 10^9`, the two
 * tree problems and Maximum Total Damage cap their values) and the statement
 * says so. Intermediates that can pass 2^31 (prefix sums, products before a
 * modulus) are 64-bit in every typed language; JavaScript and TypeScript
 * multiply under a modulus with a 16-bit split (`mulmod`) so every partial
 * product stays below 2^53.
 *
 * Problems whose honest reference is a search (digit DP over 5,000 ranges,
 * every pairwise difference) set `hiddenCount` so the whole suite stays inside
 * the judge's CPU budget in Python, Ruby and PHP.
 */
import {
  code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

void fmtStrArr; void shuffle; void fmtIntMat; void randLower;

/** A random tree on nodes 0..n-1, every node hung under an earlier one. */
const randomTree = (rng: Rng, n: number): number[][] => {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 1; i--) {
    const j = 1 + Math.floor(rng() * i);
    [order[i], order[j]] = [order[j], order[i]];
  }
  const edges: number[][] = [];
  for (let i = 1; i < n; i++) {
    const parent = order[ri(rng, Math.max(0, i - pick(rng, [1, 2, i])), i - 1)];
    edges.push(rng() < 0.5 ? [parent, order[i]] : [order[i], parent]);
  }
  return edges;
};
void randomTree;

export const DP10_PROBLEMS: CatalogProblem[] = [

  // ── Number of Beautiful Integers in the Range (LC 2827) ─────────
  (() => {
    // Digit DP over (tight, started, remainder, even-minus-odd balance),
    // cross-checked against a scan of every integer for narrow ranges.
    const count = (n: number, k: number) => {
      if (n <= 0) return 0;
      const size = 4 * k * 21;
      let cur = new Array(size).fill(0);
      cur[2 * k * 21 + 10] = 1;
      for (const ch of String(n)) {
        const D = Number(ch);
        const nxt = new Array(size).fill(0);
        for (let idx = 0; idx < size; idx++) {
          const c = cur[idx];
          if (!c) continue;
          const d = idx % 21, r = Math.floor(idx / 21) % k, ts = Math.floor(idx / (21 * k));
          const t = ts >> 1, st = ts & 1;
          const hi = t ? D : 9;
          for (let g = 0; g <= hi; g++) {
            const nt = t && g === hi ? 1 : 0;
            if (!st && g === 0) nxt[nt * 2 * k * 21 + 10] += c;
            else nxt[((nt * 2 + 1) * k + (r * 10 + g) % k) * 21 + d + (g % 2 === 0 ? 1 : -1)] += c;
          }
        }
        cur = nxt;
      }
      return cur[k * 21 + 10] + cur[3 * k * 21 + 10];
    };
    const ref = (low: number, high: number, k: number) => {
      if (high - low <= 20000) {
        let total = 0;
        for (let x = low; x <= high; x++) {
          if (x % k !== 0) continue;
          let bal = 0;
          for (const ch of String(x)) bal += Number(ch) % 2 === 0 ? 1 : -1;
          if (bal === 0) total++;
        }
        return total;
      }
      return count(high, k) - count(low - 1, k);
    };
    return {
      slug: "number-of-beautiful-integers-in-the-range",
      title: "Number of Beautiful Integers in the Range",
      difficulty: "HARD" as const,
      tags: ["Math", "Dynamic Programming", "Digit DP", "Google", "Amazon"],
      signature: {
        funcName: "numberOfBeautifulIntegers",
        params: [{ name: "low", type: "int" as const }, { name: "high", type: "int" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "Call a positive integer **beautiful** for a given `k` when both of these hold:\n\n- its decimal representation has exactly as many **even** digits as **odd** digits, and\n- it is divisible by `k`.\n\nGiven `low`, `high` and `k`, return how many beautiful integers lie in the inclusive range `[low, high]`.",
        [
          { in: "low = 10, high = 20, k = 3", out: "2", note: "12 (one odd digit, one even) and 18 (likewise) are multiples of 3. 15 is a multiple of 3 but both its digits are odd." },
          { in: "low = 1, high = 10, k = 1", out: "1", note: "Only 10 has one odd and one even digit; every single-digit number is unbalanced." },
          { in: "low = 5, high = 5, k = 2", out: "0", note: "A one-digit number can never have equal counts." },
        ],
        ["0 < low <= high <= 10^9", "0 < k <= 20"]),
      hints: [
        "Count beautiful numbers in `[1, n]` with a function `f(n)`; the answer is `f(high) - f(low - 1)`.",
        "Build numbers digit by digit from the most significant one (digit DP). What do you need to remember about the prefix so far to finish the decision?",
        "Track four things: whether the prefix still equals `n`'s prefix (tight), whether a non-zero digit has been placed yet (leading zeros are not digits), the remainder modulo `k`, and the difference between even and odd digit counts.",
      ],
      editorial: explain({
        idea: "The range is too large to scan, but whether a number is beautiful depends only on two running quantities — its remainder modulo `k` and the balance of even versus odd digits — so a digit DP counts all numbers up to a bound at once.",
        steps: [
          "Write `f(n)` = beautiful numbers in `[1, n]`; return `f(high) - f(low - 1)`.",
          "For `f(n)`, walk the digits of `n` from the left. A state is `(tight, started, rem, balance)` with a count of prefixes in it; start from `(tight, not started, 0, 0)` with count 1.",
          "At each position try every digit `g` from 0 up to `n`'s digit if tight, else 9. The new state stays tight only if it was tight and `g` equals the bound.",
          "If the number has not started and `g = 0`, it is still a leading zero: stay unstarted with remainder 0 and balance 0. Otherwise mark it started, set `rem = (rem * 10 + g) mod k` and add +1 to the balance for an even `g`, -1 for an odd one.",
          "After the last digit, add up the counts of started states with remainder 0 and balance 0.",
        ],
        why: "Two numbers whose prefixes agree on remainder and balance can be completed by exactly the same suffixes, so grouping prefixes by those values loses nothing. The tight flag keeps every counted number at most `n`, and the started flag keeps leading zeros out of the even-digit count.",
        time: "O(D · k · D · 10) per bound, with D ≤ 10 digits",
        space: "O(k · D)",
        pitfalls: [
          "Leading zeros are not even digits — without the started flag, 7 would be read as 07 and look balanced.",
          "Use `low - 1` for the lower bound, not `low`.",
          "The balance can range from -10 to +10, so offset it before using it as an index.",
        ],
      }),
      examples: [
        { input: "10\n20\n3", expectedOutput: String(ref(10, 20, 3)) },
        { input: "1\n10\n1", expectedOutput: String(ref(1, 10, 1)) },
        { input: "5\n5\n2", expectedOutput: String(ref(5, 5, 2)) },
      ],
      hiddenCount: 500,
      gen: (rng: Rng) => {
        const top = pick(rng, [9, 100, 5000, 100000, 1000000, 1000000000]);
        const high = ri(rng, 1, top);
        const low = rng() < 0.3 ? ri(rng, 1, high) : ri(rng, Math.max(1, high - pick(rng, [0, 50, 3000, 1000000])), high);
        const k = ri(rng, 1, 20);
        return { input: `${low}\n${high}\n${k}`, expectedOutput: String(ref(low, high, k)) };
      },
      solutions: {
        python: code`
          def numberOfBeautifulIntegers(low: int, high: int, k: int) -> int:
              # state index = ((tight * 2 + started) * k + rem) * 21 + balance + 10
              def count(n):
                  if n <= 0:
                      return 0
                  size = 4 * k * 21
                  cur = [0] * size
                  cur[2 * k * 21 + 10] = 1
                  for ch in str(n):
                      top = ord(ch) - 48
                      nxt = [0] * size
                      for idx in range(size):
                          c = cur[idx]
                          if c == 0:
                              continue
                          d = idx % 21
                          r = (idx // 21) % k
                          ts = idx // (21 * k)
                          t, st = ts >> 1, ts & 1
                          hi = top if t else 9
                          for g in range(hi + 1):
                              nt = 1 if (t and g == hi) else 0
                              if not st and g == 0:
                                  nxt[nt * 2 * k * 21 + 10] += c
                              else:
                                  nd = d + 1 if g % 2 == 0 else d - 1
                                  nxt[((nt * 2 + 1) * k + (r * 10 + g) % k) * 21 + nd] += c
                      cur = nxt
                  return cur[k * 21 + 10] + cur[3 * k * 21 + 10]

              return count(high) - count(low - 1)
        `,
        javascript: code`
          var numberOfBeautifulIntegers = function(low, high, k) {
              // state index = ((tight * 2 + started) * k + rem) * 21 + balance + 10
              var count = function(n) {
                  if (n <= 0) return 0;
                  var size = 4 * k * 21;
                  var cur = new Array(size).fill(0);
                  cur[2 * k * 21 + 10] = 1;
                  var digits = String(n);
                  for (var p = 0; p < digits.length; p++) {
                      var top = digits.charCodeAt(p) - 48;
                      var nxt = new Array(size).fill(0);
                      for (var idx = 0; idx < size; idx++) {
                          var c = cur[idx];
                          if (c === 0) continue;
                          var d = idx % 21, r = Math.floor(idx / 21) % k, ts = Math.floor(idx / (21 * k));
                          var t = ts >> 1, st = ts & 1;
                          var hi = t ? top : 9;
                          for (var g = 0; g <= hi; g++) {
                              var nt = (t && g === hi) ? 1 : 0;
                              if (!st && g === 0) nxt[nt * 2 * k * 21 + 10] += c;
                              else nxt[((nt * 2 + 1) * k + (r * 10 + g) % k) * 21 + d + (g % 2 === 0 ? 1 : -1)] += c;
                          }
                      }
                      cur = nxt;
                  }
                  return cur[k * 21 + 10] + cur[3 * k * 21 + 10];
              };
              return count(high) - count(low - 1);
          };
        `,
        typescript: code`
          function beautifulUpTo(n: number, k: number): number {
              // state index = ((tight * 2 + started) * k + rem) * 21 + balance + 10
              if (n <= 0) return 0;
              var size = 4 * k * 21;
              var cur: number[] = [];
              for (var i = 0; i < size; i++) cur.push(0);
              cur[2 * k * 21 + 10] = 1;
              var digits = String(n);
              for (var p = 0; p < digits.length; p++) {
                  var top = digits.charCodeAt(p) - 48;
                  var nxt: number[] = [];
                  for (var i = 0; i < size; i++) nxt.push(0);
                  for (var idx = 0; idx < size; idx++) {
                      var c = cur[idx];
                      if (c === 0) continue;
                      var d = idx % 21, r = Math.floor(idx / 21) % k, ts = Math.floor(idx / (21 * k));
                      var t = ts >> 1, st = ts & 1;
                      var hi = t ? top : 9;
                      for (var g = 0; g <= hi; g++) {
                          var nt = (t && g === hi) ? 1 : 0;
                          if (!st && g === 0) nxt[nt * 2 * k * 21 + 10] += c;
                          else nxt[((nt * 2 + 1) * k + (r * 10 + g) % k) * 21 + d + (g % 2 === 0 ? 1 : -1)] += c;
                      }
                  }
                  cur = nxt;
              }
              return cur[k * 21 + 10] + cur[3 * k * 21 + 10];
          }

          function numberOfBeautifulIntegers(low: number, high: number, k: number): number {
              return beautifulUpTo(high, k) - beautifulUpTo(low - 1, k);
          }
        `,
        java: code`
          static long beautifulUpTo(int n, int k) {
              // state index = ((tight * 2 + started) * k + rem) * 21 + balance + 10
              if (n <= 0) return 0;
              int size = 4 * k * 21;
              long[] cur = new long[size];
              cur[2 * k * 21 + 10] = 1;
              String digits = Integer.toString(n);
              for (int p = 0; p < digits.length(); p++) {
                  int top = digits.charAt(p) - '0';
                  long[] nxt = new long[size];
                  for (int idx = 0; idx < size; idx++) {
                      long c = cur[idx];
                      if (c == 0) continue;
                      int d = idx % 21, r = (idx / 21) % k, ts = idx / (21 * k);
                      int t = ts >> 1, st = ts & 1;
                      int hi = t == 1 ? top : 9;
                      for (int g = 0; g <= hi; g++) {
                          int nt = (t == 1 && g == hi) ? 1 : 0;
                          if (st == 0 && g == 0) nxt[nt * 2 * k * 21 + 10] += c;
                          else nxt[((nt * 2 + 1) * k + (r * 10 + g) % k) * 21 + d + (g % 2 == 0 ? 1 : -1)] += c;
                      }
                  }
                  cur = nxt;
              }
              return cur[k * 21 + 10] + cur[3 * k * 21 + 10];
          }

          public static int numberOfBeautifulIntegers(int low, int high, int k) {
              return (int) (beautifulUpTo(high, k) - beautifulUpTo(low - 1, k));
          }
        `,
        cpp: code`
          long long beautifulUpTo(int n, int k) {
              // state index = ((tight * 2 + started) * k + rem) * 21 + balance + 10
              if (n <= 0) return 0;
              int size = 4 * k * 21;
              vector<long long> cur(size, 0);
              cur[2 * k * 21 + 10] = 1;
              string digits = to_string(n);
              for (char ch : digits) {
                  int top = ch - '0';
                  vector<long long> nxt(size, 0);
                  for (int idx = 0; idx < size; idx++) {
                      long long c = cur[idx];
                      if (c == 0) continue;
                      int d = idx % 21, r = (idx / 21) % k, ts = idx / (21 * k);
                      int t = ts >> 1, st = ts & 1;
                      int hi = t ? top : 9;
                      for (int g = 0; g <= hi; g++) {
                          int nt = (t && g == hi) ? 1 : 0;
                          if (!st && g == 0) nxt[nt * 2 * k * 21 + 10] += c;
                          else nxt[((nt * 2 + 1) * k + (r * 10 + g) % k) * 21 + d + (g % 2 == 0 ? 1 : -1)] += c;
                      }
                  }
                  cur = nxt;
              }
              return cur[k * 21 + 10] + cur[3 * k * 21 + 10];
          }

          int numberOfBeautifulIntegers(int low, int high, int k) {
              return (int) (beautifulUpTo(high, k) - beautifulUpTo(low - 1, k));
          }
        `,
        c: code`
          static long long beautifulUpTo(int n, int k) {
              // state index = ((tight * 2 + started) * k + rem) * 21 + balance + 10
              if (n <= 0) return 0;
              int size = 4 * k * 21;
              long long cur[1680], nxt[1680];
              int digits[12], len = 0;
              for (int i = 0; i < size; i++) cur[i] = 0;
              cur[2 * k * 21 + 10] = 1;
              while (n > 0) { digits[len++] = n % 10; n /= 10; }
              for (int p = len - 1; p >= 0; p--) {
                  int top = digits[p];
                  for (int i = 0; i < size; i++) nxt[i] = 0;
                  for (int idx = 0; idx < size; idx++) {
                      long long c = cur[idx];
                      if (c == 0) continue;
                      int d = idx % 21, r = (idx / 21) % k, ts = idx / (21 * k);
                      int t = ts >> 1, st = ts & 1;
                      int hi = t ? top : 9;
                      for (int g = 0; g <= hi; g++) {
                          int nt = (t && g == hi) ? 1 : 0;
                          if (!st && g == 0) nxt[nt * 2 * k * 21 + 10] += c;
                          else nxt[((nt * 2 + 1) * k + (r * 10 + g) % k) * 21 + d + (g % 2 == 0 ? 1 : -1)] += c;
                      }
                  }
                  for (int i = 0; i < size; i++) cur[i] = nxt[i];
              }
              return cur[k * 21 + 10] + cur[3 * k * 21 + 10];
          }

          int numberOfBeautifulIntegers(int low, int high, int k) {
              return (int) (beautifulUpTo(high, k) - beautifulUpTo(low - 1, k));
          }
        `,
        csharp: code`
          static long BeautifulUpTo(int n, int k)
          {
              // state index = ((tight * 2 + started) * k + rem) * 21 + balance + 10
              if (n <= 0) return 0;
              int size = 4 * k * 21;
              long[] cur = new long[size];
              cur[2 * k * 21 + 10] = 1;
              string digits = n.ToString();
              foreach (char ch in digits)
              {
                  int top = ch - '0';
                  long[] nxt = new long[size];
                  for (int idx = 0; idx < size; idx++)
                  {
                      long c = cur[idx];
                      if (c == 0) continue;
                      int d = idx % 21, r = (idx / 21) % k, ts = idx / (21 * k);
                      int t = ts >> 1, st = ts & 1;
                      int hi = t == 1 ? top : 9;
                      for (int g = 0; g <= hi; g++)
                      {
                          int nt = (t == 1 && g == hi) ? 1 : 0;
                          if (st == 0 && g == 0) nxt[nt * 2 * k * 21 + 10] += c;
                          else nxt[((nt * 2 + 1) * k + (r * 10 + g) % k) * 21 + d + (g % 2 == 0 ? 1 : -1)] += c;
                      }
                  }
                  cur = nxt;
              }
              return cur[k * 21 + 10] + cur[3 * k * 21 + 10];
          }

          public static int NumberOfBeautifulIntegers(int low, int high, int k)
          {
              return (int) (BeautifulUpTo(high, k) - BeautifulUpTo(low - 1, k));
          }
        `,
        go: code`
          func beautifulUpTo(n int, k int) int {
              // state index = ((tight * 2 + started) * k + rem) * 21 + balance + 10
              if n <= 0 {
                  return 0
              }
              size := 4 * k * 21
              cur := make([]int, size)
              cur[2*k*21+10] = 1
              digits := []int{}
              for m := n; m > 0; m /= 10 {
                  digits = append([]int{m % 10}, digits...)
              }
              for _, top := range digits {
                  nxt := make([]int, size)
                  for idx := 0; idx < size; idx++ {
                      c := cur[idx]
                      if c == 0 {
                          continue
                      }
                      d, r, ts := idx%21, (idx/21)%k, idx/(21*k)
                      t, st := ts>>1, ts&1
                      hi := 9
                      if t == 1 {
                          hi = top
                      }
                      for g := 0; g <= hi; g++ {
                          nt := 0
                          if t == 1 && g == hi {
                              nt = 1
                          }
                          if st == 0 && g == 0 {
                              nxt[nt*2*k*21+10] += c
                          } else {
                              nd := d - 1
                              if g%2 == 0 {
                                  nd = d + 1
                              }
                              nxt[((nt*2+1)*k+(r*10+g)%k)*21+nd] += c
                          }
                      }
                  }
                  cur = nxt
              }
              return cur[k*21+10] + cur[3*k*21+10]
          }

          func numberOfBeautifulIntegers(low int, high int, k int) int {
              return beautifulUpTo(high, k) - beautifulUpTo(low-1, k)
          }
        `,
        kotlin: code`
          fun beautifulUpTo(n: Int, k: Int): Long {
              // state index = ((tight * 2 + started) * k + rem) * 21 + balance + 10
              if (n <= 0) return 0L
              val size = 4 * k * 21
              var cur = LongArray(size)
              cur[2 * k * 21 + 10] = 1L
              for (ch in n.toString()) {
                  val top = ch - '0'
                  val nxt = LongArray(size)
                  for (idx in 0 until size) {
                      val c = cur[idx]
                      if (c == 0L) continue
                      val d = idx % 21
                      val r = (idx / 21) % k
                      val ts = idx / (21 * k)
                      val t = ts shr 1
                      val st = ts and 1
                      val hi = if (t == 1) top else 9
                      for (g in 0..hi) {
                          val nt = if (t == 1 && g == hi) 1 else 0
                          if (st == 0 && g == 0) nxt[nt * 2 * k * 21 + 10] += c
                          else nxt[((nt * 2 + 1) * k + (r * 10 + g) % k) * 21 + d + (if (g % 2 == 0) 1 else -1)] += c
                      }
                  }
                  cur = nxt
              }
              return cur[k * 21 + 10] + cur[3 * k * 21 + 10]
          }

          fun numberOfBeautifulIntegers(low: Int, high: Int, k: Int): Int {
              return (beautifulUpTo(high, k) - beautifulUpTo(low - 1, k)).toInt()
          }
        `,
        swift: code`
          func beautifulUpTo(_ n: Int, _ k: Int) -> Int {
              // state index = ((tight * 2 + started) * k + rem) * 21 + balance + 10
              if n <= 0 { return 0 }
              let size = 4 * k * 21
              var cur = [Int](repeating: 0, count: size)
              cur[2 * k * 21 + 10] = 1
              for ch in String(n).utf8 {
                  let top = Int(ch) - 48
                  var nxt = [Int](repeating: 0, count: size)
                  for idx in 0..<size {
                      let c = cur[idx]
                      if c == 0 { continue }
                      let d = idx % 21, r = (idx / 21) % k, ts = idx / (21 * k)
                      let t = ts >> 1, st = ts & 1
                      let hi = t == 1 ? top : 9
                      for g in 0...hi {
                          let nt = (t == 1 && g == hi) ? 1 : 0
                          if st == 0 && g == 0 {
                              nxt[nt * 2 * k * 21 + 10] += c
                          } else {
                              let nd = g % 2 == 0 ? d + 1 : d - 1
                              nxt[((nt * 2 + 1) * k + (r * 10 + g) % k) * 21 + nd] += c
                          }
                      }
                  }
                  cur = nxt
              }
              return cur[k * 21 + 10] + cur[3 * k * 21 + 10]
          }

          func numberOfBeautifulIntegers(_ low: Int, _ high: Int, _ k: Int) -> Int {
              return beautifulUpTo(high, k) - beautifulUpTo(low - 1, k)
          }
        `,
        rust: code`
          fn beautiful_up_to(n: i64, k: usize) -> i64 {
              // state index = ((tight * 2 + started) * k + rem) * 21 + balance + 10
              if n <= 0 {
                  return 0;
              }
              let size = 4 * k * 21;
              let mut cur = vec![0i64; size];
              cur[2 * k * 21 + 10] = 1;
              for ch in n.to_string().bytes() {
                  let top = (ch - b'0') as usize;
                  let mut nxt = vec![0i64; size];
                  for idx in 0..size {
                      let c = cur[idx];
                      if c == 0 {
                          continue;
                      }
                      let d = idx % 21;
                      let r = (idx / 21) % k;
                      let ts = idx / (21 * k);
                      let t = ts >> 1;
                      let st = ts & 1;
                      let hi = if t == 1 { top } else { 9 };
                      for g in 0..=hi {
                          let nt = if t == 1 && g == hi { 1 } else { 0 };
                          if st == 0 && g == 0 {
                              nxt[nt * 2 * k * 21 + 10] += c;
                          } else {
                              let nd = if g % 2 == 0 { d + 1 } else { d - 1 };
                              nxt[((nt * 2 + 1) * k + (r * 10 + g) % k) * 21 + nd] += c;
                          }
                      }
                  }
                  cur = nxt;
              }
              cur[k * 21 + 10] + cur[3 * k * 21 + 10]
          }

          fn numberOfBeautifulIntegers(low: i32, high: i32, k: i32) -> i32 {
              let k = k as usize;
              (beautiful_up_to(high as i64, k) - beautiful_up_to(low as i64 - 1, k)) as i32
          }
        `,
        php: code`
          function beautifulUpTo($n, $k) {
              // state index = ((tight * 2 + started) * k + rem) * 21 + balance + 10
              if ($n <= 0) return 0;
              $size = 4 * $k * 21;
              $cur = array_fill(0, $size, 0);
              $cur[2 * $k * 21 + 10] = 1;
              $digits = strval($n);
              for ($p = 0; $p < strlen($digits); $p++) {
                  $top = ord($digits[$p]) - 48;
                  $nxt = array_fill(0, $size, 0);
                  for ($idx = 0; $idx < $size; $idx++) {
                      $c = $cur[$idx];
                      if ($c == 0) continue;
                      $d = $idx % 21;
                      $r = intdiv($idx, 21) % $k;
                      $ts = intdiv($idx, 21 * $k);
                      $t = $ts >> 1;
                      $st = $ts & 1;
                      $hi = $t ? $top : 9;
                      for ($g = 0; $g <= $hi; $g++) {
                          $nt = ($t && $g == $hi) ? 1 : 0;
                          if (!$st && $g == 0) $nxt[$nt * 2 * $k * 21 + 10] += $c;
                          else $nxt[(($nt * 2 + 1) * $k + ($r * 10 + $g) % $k) * 21 + $d + ($g % 2 == 0 ? 1 : -1)] += $c;
                      }
                  }
                  $cur = $nxt;
              }
              return $cur[$k * 21 + 10] + $cur[3 * $k * 21 + 10];
          }

          function numberOfBeautifulIntegers($low, $high, $k) {
              return beautifulUpTo($high, $k) - beautifulUpTo($low - 1, $k);
          }
        `,
        ruby: code`
          def beautiful_up_to(n, k)
            # state index = ((tight * 2 + started) * k + rem) * 21 + balance + 10
            return 0 if n <= 0
            size = 4 * k * 21
            cur = Array.new(size, 0)
            cur[2 * k * 21 + 10] = 1
            n.to_s.each_byte do |ch|
              top = ch - 48
              nxt = Array.new(size, 0)
              size.times do |idx|
                c = cur[idx]
                next if c == 0
                d = idx % 21
                r = (idx / 21) % k
                ts = idx / (21 * k)
                t = ts >> 1
                st = ts & 1
                hi = t == 1 ? top : 9
                (0..hi).each do |g|
                  nt = (t == 1 && g == hi) ? 1 : 0
                  if st == 0 && g == 0
                    nxt[nt * 2 * k * 21 + 10] += c
                  else
                    nd = g.even? ? d + 1 : d - 1
                    nxt[((nt * 2 + 1) * k + (r * 10 + g) % k) * 21 + nd] += c
                  end
                end
              end
              cur = nxt
            end
            cur[k * 21 + 10] + cur[3 * k * 21 + 10]
          end

          def numberOfBeautifulIntegers(low, high, k)
            beautiful_up_to(high, k) - beautiful_up_to(low - 1, k)
          end
        `,
      },
    };
  })(),

  // ── Apply Operations to Make Two Strings Equal (LC 2896) ────────
  (() => {
    const ref = (s1: string, s2: string, x: number) => {
      // Doubled costs: pairing a mismatch with any far one costs x/2 each.
      // Cross-checked offline against Dijkstra over every flip state (n ≤ 9).
      const p: number[] = [];
      for (let i = 0; i < s1.length; i++) if (s1[i] !== s2[i]) p.push(i);
      if (p.length % 2) return -1;
      if (!p.length) return 0;
      const dp = new Array(p.length + 1).fill(0);
      dp[1] = x;
      for (let i = 2; i <= p.length; i++) dp[i] = Math.min(dp[i - 1] + x, dp[i - 2] + 2 * (p[i - 1] - p[i - 2]));
      return dp[p.length] / 2;
    };
    const bin = (rng: Rng, n: number) => Array.from({ length: n }, () => (rng() < 0.5 ? "0" : "1")).join("");
    return {
      slug: "apply-operations-to-make-two-strings-equal",
      title: "Apply Operations to Make Two Strings Equal",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "minOperations",
        params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }, { name: "x", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two binary strings `s1` and `s2` of the same length `n`, and a positive integer `x`. You may change `s1` with these operations, any number of times:\n\n- Pick **any** two indices `i` and `j` and flip both `s1[i]` and `s1[j]`. This costs `x`.\n- Pick an index `i < n - 1` and flip both `s1[i]` and `s1[i + 1]`. This costs `1`.\n\nFlipping turns `0` into `1` and `1` into `0`.\n\nReturn the **minimum** total cost to make `s1` equal to `s2`, or `-1` if it cannot be done.",
        [
          { in: "s1 = \"1100011000\", s2 = \"0101001010\", x = 2", out: "4", note: "The strings differ at indices 0, 3, 5 and 8. Flip indices 3 and 4 (cost 1), then 4 and 5 (cost 1) — that fixes 3 and 5. Pair 0 with 8 using the first operation (cost 2). Total 4." },
          { in: "s1 = \"10110\", s2 = \"00011\", x = 4", out: "-1", note: "They differ in three places. Every operation flips two bits, so the number of mismatches always changes by an even amount and can never reach zero." },
          { in: "s1 = \"0110\", s2 = \"0110\", x = 7", out: "0" },
        ],
        ["n == s1.length == s2.length", "1 <= n, x <= 500", "s1 and s2 consist only of '0' and '1'"]),
      hints: [
        "Only the indices where the strings differ matter. Every operation flips two bits, so an odd number of mismatches is impossible.",
        "Fixing two mismatches at positions `a < b` costs `x` with one far flip, or `b - a` with a chain of adjacent flips. It never pays to chain two mismatches that are not neighbours in the list of mismatches.",
        "Let `dp[i]` be the cost to fix the first `i` mismatches. Either the `i`-th one is chained to the `(i-1)`-th, or it is paired with some far mismatch — count that as `x / 2` per endpoint (double every cost to keep integers).",
      ],
      editorial: explain({
        idea: "Reduce the strings to the sorted list `p` of mismatch positions. Each mismatch is either chained to its neighbour in `p` (cost `p[i] - p[i-1]`) or matched with some other far mismatch for `x`, which is fair to charge as `x / 2` to each of its two ends.",
        steps: [
          "Collect the mismatch positions `p`. If their count is odd, return -1; if zero, return 0.",
          "Work with doubled costs: `dp[0] = 0`, `dp[1] = x` (half of `x`, doubled).",
          "For `i ≥ 2`: `dp[i] = min(dp[i-1] + x, dp[i-2] + 2 · (p[i-1] - p[i-2]))`.",
          "Return `dp[m] / 2`.",
        ],
        why: "The far operations pair up mismatches arbitrarily, so all that matters is which mismatches are fixed that way — an even number of them — and each costs `x / 2`. A chain between two mismatches costs their distance; an optimal solution only chains neighbours in `p`, because a chain from `a` to `c` past `b` can be uncrossed without raising the cost. The DP decides, left to right, whether the current mismatch closes a chain with the previous one or goes into the far pool.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Chaining adjacent flips between two mismatches flips every bit in between twice — it really costs `b - a`, not 1.",
          "`x` may be odd: halving inside the DP loses precision, so double every cost and halve at the end.",
          "When `x` is 1 or 2 the far operation can be cheaper than chaining even close neighbours.",
        ],
      }),
      examples: [
        { input: "\"1100011000\"\n\"0101001010\"\n2", expectedOutput: String(ref("1100011000", "0101001010", 2)) },
        { input: "\"10110\"\n\"00011\"\n4", expectedOutput: String(ref("10110", "00011", 4)) },
        { input: "\"0110\"\n\"0110\"\n7", expectedOutput: String(ref("0110", "0110", 7)) },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [2, 6, 20, 60, 120]));
        const s1 = bin(rng, n);
        let s2 = bin(rng, n);
        if (rng() < 0.5) {
          // Make the mismatch count even half the time so most cases are solvable.
          let diff = 0;
          for (let i = 0; i < n; i++) if (s1[i] !== s2[i]) diff++;
          if (diff % 2) s2 = (s2[0] === "0" ? "1" : "0") + s2.slice(1);
        }
        const x = pick(rng, [1, 2, ri(rng, 1, 10), ri(rng, 1, 500)]);
        return { input: `"${s1}"\n"${s2}"\n${x}`, expectedOutput: String(ref(s1, s2, x)) };
      },
      solutions: {
        python: code`
          def minOperations(s1: str, s2: str, x: int) -> int:
              pos = [i for i in range(len(s1)) if s1[i] != s2[i]]
              if len(pos) % 2:
                  return -1
              if not pos:
                  return 0
              # Costs are doubled so a far pairing can be charged x/2 per mismatch.
              prev2, prev1 = 0, x
              for i in range(1, len(pos)):
                  cur = min(prev1 + x, prev2 + 2 * (pos[i] - pos[i - 1]))
                  prev2, prev1 = prev1, cur
              return prev1 // 2
        `,
        javascript: code`
          var minOperations = function(s1, s2, x) {
              var pos = [];
              for (var i = 0; i < s1.length; i++) if (s1[i] !== s2[i]) pos.push(i);
              if (pos.length % 2 === 1) return -1;
              if (pos.length === 0) return 0;
              // Costs are doubled so a far pairing can be charged x/2 per mismatch.
              var prev2 = 0, prev1 = x;
              for (var j = 1; j < pos.length; j++) {
                  var cur = Math.min(prev1 + x, prev2 + 2 * (pos[j] - pos[j - 1]));
                  prev2 = prev1;
                  prev1 = cur;
              }
              return prev1 / 2;
          };
        `,
        typescript: code`
          function minOperations(s1: string, s2: string, x: number): number {
              var pos: number[] = [];
              for (var i = 0; i < s1.length; i++) if (s1.charAt(i) !== s2.charAt(i)) pos.push(i);
              if (pos.length % 2 === 1) return -1;
              if (pos.length === 0) return 0;
              // Costs are doubled so a far pairing can be charged x/2 per mismatch.
              var prev2 = 0, prev1 = x;
              for (var j = 1; j < pos.length; j++) {
                  var cur = Math.min(prev1 + x, prev2 + 2 * (pos[j] - pos[j - 1]));
                  prev2 = prev1;
                  prev1 = cur;
              }
              return prev1 / 2;
          }
        `,
        java: code`
          public static int minOperations(String s1, String s2, int x) {
              List<Integer> pos = new ArrayList<>();
              for (int i = 0; i < s1.length(); i++) if (s1.charAt(i) != s2.charAt(i)) pos.add(i);
              if (pos.size() % 2 == 1) return -1;
              if (pos.isEmpty()) return 0;
              // Costs are doubled so a far pairing can be charged x/2 per mismatch.
              int prev2 = 0, prev1 = x;
              for (int j = 1; j < pos.size(); j++) {
                  int cur = Math.min(prev1 + x, prev2 + 2 * (pos.get(j) - pos.get(j - 1)));
                  prev2 = prev1;
                  prev1 = cur;
              }
              return prev1 / 2;
          }
        `,
        cpp: code`
          int minOperations(string s1, string s2, int x) {
              vector<int> pos;
              for (int i = 0; i < (int) s1.size(); i++) if (s1[i] != s2[i]) pos.push_back(i);
              if (pos.size() % 2 == 1) return -1;
              if (pos.empty()) return 0;
              // Costs are doubled so a far pairing can be charged x/2 per mismatch.
              int prev2 = 0, prev1 = x;
              for (int j = 1; j < (int) pos.size(); j++) {
                  int cur = min(prev1 + x, prev2 + 2 * (pos[j] - pos[j - 1]));
                  prev2 = prev1;
                  prev1 = cur;
              }
              return prev1 / 2;
          }
        `,
        c: code`
          int minOperations(const char* s1, const char* s2, int x) {
              int n = (int) strlen(s1);
              int* pos = (int*) malloc(sizeof(int) * (n + 1));
              int m = 0;
              for (int i = 0; i < n; i++) if (s1[i] != s2[i]) pos[m++] = i;
              if (m % 2 == 1) { free(pos); return -1; }
              if (m == 0) { free(pos); return 0; }
              // Costs are doubled so a far pairing can be charged x/2 per mismatch.
              int prev2 = 0, prev1 = x;
              for (int j = 1; j < m; j++) {
                  int a = prev1 + x, b = prev2 + 2 * (pos[j] - pos[j - 1]);
                  int cur = a < b ? a : b;
                  prev2 = prev1;
                  prev1 = cur;
              }
              free(pos);
              return prev1 / 2;
          }
        `,
        csharp: code`
          public static int MinOperations(string s1, string s2, int x)
          {
              var pos = new List<int>();
              for (int i = 0; i < s1.Length; i++) if (s1[i] != s2[i]) pos.Add(i);
              if (pos.Count % 2 == 1) return -1;
              if (pos.Count == 0) return 0;
              // Costs are doubled so a far pairing can be charged x/2 per mismatch.
              int prev2 = 0, prev1 = x;
              for (int j = 1; j < pos.Count; j++)
              {
                  int cur = Math.Min(prev1 + x, prev2 + 2 * (pos[j] - pos[j - 1]));
                  prev2 = prev1;
                  prev1 = cur;
              }
              return prev1 / 2;
          }
        `,
        go: code`
          func minOperations(s1 string, s2 string, x int) int {
              pos := []int{}
              for i := 0; i < len(s1); i++ {
                  if s1[i] != s2[i] {
                      pos = append(pos, i)
                  }
              }
              if len(pos)%2 == 1 {
                  return -1
              }
              if len(pos) == 0 {
                  return 0
              }
              // Costs are doubled so a far pairing can be charged x/2 per mismatch.
              prev2, prev1 := 0, x
              for j := 1; j < len(pos); j++ {
                  cur := prev1 + x
                  if alt := prev2 + 2*(pos[j]-pos[j-1]); alt < cur {
                      cur = alt
                  }
                  prev2, prev1 = prev1, cur
              }
              return prev1 / 2
          }
        `,
        kotlin: code`
          fun minOperations(s1: String, s2: String, x: Int): Int {
              val pos = ArrayList<Int>()
              for (i in s1.indices) if (s1[i] != s2[i]) pos.add(i)
              if (pos.size % 2 == 1) return -1
              if (pos.isEmpty()) return 0
              // Costs are doubled so a far pairing can be charged x/2 per mismatch.
              var prev2 = 0
              var prev1 = x
              for (j in 1 until pos.size) {
                  val cur = minOf(prev1 + x, prev2 + 2 * (pos[j] - pos[j - 1]))
                  prev2 = prev1
                  prev1 = cur
              }
              return prev1 / 2
          }
        `,
        swift: code`
          func minOperations(_ s1: String, _ s2: String, _ x: Int) -> Int {
              let a = Array(s1.utf8), b = Array(s2.utf8)
              var pos = [Int]()
              for i in 0..<a.count where a[i] != b[i] { pos.append(i) }
              if pos.count % 2 == 1 { return -1 }
              if pos.isEmpty { return 0 }
              // Costs are doubled so a far pairing can be charged x/2 per mismatch.
              var prev2 = 0, prev1 = x
              for j in 1..<pos.count {
                  let cur = min(prev1 + x, prev2 + 2 * (pos[j] - pos[j - 1]))
                  prev2 = prev1
                  prev1 = cur
              }
              return prev1 / 2
          }
        `,
        rust: code`
          fn minOperations(s1: String, s2: String, x: i32) -> i32 {
              let a = s1.as_bytes();
              let b = s2.as_bytes();
              let pos: Vec<i32> = (0..a.len()).filter(|&i| a[i] != b[i]).map(|i| i as i32).collect();
              if pos.len() % 2 == 1 {
                  return -1;
              }
              if pos.is_empty() {
                  return 0;
              }
              // Costs are doubled so a far pairing can be charged x/2 per mismatch.
              let (mut prev2, mut prev1) = (0, x);
              for j in 1..pos.len() {
                  let cur = std::cmp::min(prev1 + x, prev2 + 2 * (pos[j] - pos[j - 1]));
                  prev2 = prev1;
                  prev1 = cur;
              }
              prev1 / 2
          }
        `,
        php: code`
          function minOperations($s1, $s2, $x) {
              $pos = [];
              for ($i = 0; $i < strlen($s1); $i++) if ($s1[$i] !== $s2[$i]) $pos[] = $i;
              $m = count($pos);
              if ($m % 2 == 1) return -1;
              if ($m == 0) return 0;
              // Costs are doubled so a far pairing can be charged x/2 per mismatch.
              $prev2 = 0;
              $prev1 = $x;
              for ($j = 1; $j < $m; $j++) {
                  $cur = min($prev1 + $x, $prev2 + 2 * ($pos[$j] - $pos[$j - 1]));
                  $prev2 = $prev1;
                  $prev1 = $cur;
              }
              return intdiv($prev1, 2);
          }
        `,
        ruby: code`
          def minOperations(s1, s2, x)
            pos = (0...s1.length).select { |i| s1[i] != s2[i] }
            return -1 if pos.length.odd?
            return 0 if pos.empty?
            # Costs are doubled so a far pairing can be charged x/2 per mismatch.
            prev2 = 0
            prev1 = x
            (1...pos.length).each do |j|
              cur = [prev1 + x, prev2 + 2 * (pos[j] - pos[j - 1])].min
              prev2 = prev1
              prev1 = cur
            end
            prev1 / 2
          end
        `,
      },
    };
  })(),

  // ── Count of Sub-Multisets With Bounded Sum (LC 2902) ───────────
  (() => {
    const MOD = 1000000007;
    // Plain bounded knapsack: for a value v taken 0..c times,
    // new[s] = sum of old[s - j*v] for j = 0..c (zeros fall out as (c+1)·old[s]).
    const ref = (nums: number[], l: number, r: number) => {
      const cnt = new Map<number, number>();
      for (const v of nums) cnt.set(v, (cnt.get(v) || 0) + 1);
      let dp = new Array(r + 1).fill(0);
      dp[0] = 1;
      for (const [v, c] of cnt) {
        const nd = new Array(r + 1).fill(0);
        for (let s = 0; s <= r; s++) {
          let t = 0;
          for (let j = 0; j <= c && s - j * v >= 0; j++) t = (t + dp[s - j * v]) % MOD;
          nd[s] = t;
        }
        dp = nd;
      }
      let ans = 0;
      for (let s = l; s <= r; s++) ans = (ans + dp[s]) % MOD;
      return ans;
    };
    return {
      slug: "count-of-sub-multisets-with-bounded-sum",
      title: "Count of Sub-Multisets With Bounded Sum",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Sliding Window", "Google"],
      signature: {
        funcName: "countSubMultisets",
        params: [{ name: "nums", type: "int[]" as const }, { name: "l", type: "int" as const }, { name: "r", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an array `nums` of non-negative integers and two integers `l` and `r`.\n\nA **sub-multiset** of `nums` is an unordered collection in which each value `x` appears between `0` and `occ[x]` times, where `occ[x]` is how often `x` occurs in `nums`. Two sub-multisets are the same if every value appears the same number of times in both — which positions the copies came from does not matter. The empty collection is a sub-multiset with sum `0`.\n\nReturn the number of sub-multisets whose sum lies in the inclusive range `[l, r]`. Since the answer may be large, return it **modulo** `10^9 + 7`.",
        [
          { in: "nums = [1,2,2,3], l = 6, r = 6", out: String(ref([1, 2, 2, 3], 6, 6)), note: "Only {1, 2, 3} sums to 6. Using either copy of 2 gives the same sub-multiset." },
          { in: "nums = [2,1,4,2,7], l = 1, r = 5", out: String(ref([2, 1, 4, 2, 7], 1, 5)), note: "{1}, {2}, {4}, {2, 2}, {1, 2}, {1, 4} and {1, 2, 2}." },
          { in: "nums = [0,0,3], l = 0, r = 0", out: String(ref([0, 0, 3], 0, 0)), note: "The empty collection, {0} and {0, 0} all sum to 0." },
        ],
        ["1 <= nums.length <= 2 * 10^4", "0 <= nums[i] <= 2 * 10^4", "Sum of nums does not exceed 2 * 10^4", "0 <= l <= r <= 2 * 10^4"]),
      hints: [
        "Group equal values: for a value `v` that occurs `c` times you only choose how many copies to take, 0 through `c`.",
        "This is a bounded knapsack over sums up to `r`. Because the total of `nums` is at most `2 · 10^4`, there are only about 200 distinct values.",
        "`new[s] = old[s] + old[s - v] + … + old[s - c·v]` is a sliding window along the residue class of `s` mod `v`: `new[s] = new[s - v] + old[s] - old[s - (c+1)·v]`. Treat zeros separately — they multiply every count by `c₀ + 1`.",
      ],
      editorial: explain({
        idea: "Counting sub-multisets is a bounded knapsack over distinct values. Because the sum of `nums` is at most `2 · 10^4`, there are at most about 200 distinct positive values, and each can be folded into the DP in `O(r)` with a sliding-window sum.",
        steps: [
          "Count occurrences of each value. Pull out the zeros: `z` copies of 0 can be added to any sub-multiset in `z + 1` ways.",
          "Let `dp[s]` be the number of sub-multisets (of the values processed so far) with sum `s`, for `s ≤ r`; start with `dp[0] = 1`.",
          "For each positive value `v ≤ r` with count `c`, build `nd` with `nd[s] = dp[s]` for `s < v` and `nd[s] = nd[s - v] + dp[s] - dp[s - (c + 1)·v]` (the last term only when the index is non-negative), all modulo `10^9 + 7`.",
          "Return `(z + 1) · (dp[l] + … + dp[r])` modulo `10^9 + 7`.",
        ],
        why: "`nd[s]` must equal `dp[s] + dp[s - v] + … + dp[s - c·v]` — the ways to reach `s` after choosing 0 to `c` copies of `v`. `nd[s - v]` is the same window shifted one step down, so adding `dp[s]` and dropping `dp[s - (c+1)·v]` slides it. Zeros never change a sum, so they only multiply the count.",
        time: "O(r · √S) where S is the sum of nums (the number of distinct values)",
        space: "O(r)",
        pitfalls: [
          "Do not treat equal values as distinct items — {2} from either copy of 2 is one sub-multiset.",
          "Zeros break the sliding window (a step of 0); handle them with the `z + 1` factor.",
          "Subtraction under a modulus can go negative — add the modulus back before taking the remainder.",
        ],
      }),
      examples: [
        { input: "[1,2,2,3]\n6\n6", expectedOutput: String(ref([1, 2, 2, 3], 6, 6)) },
        { input: "[2,1,4,2,7]\n1\n5", expectedOutput: String(ref([2, 1, 4, 2, 7], 1, 5)) },
        { input: "[0,0,3]\n0\n0", expectedOutput: String(ref([0, 0, 3], 0, 0)) },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 25]));
        const top = pick(rng, [0, 1, 3, 8, 20]);
        const nums = Array.from({ length: n }, () => ri(rng, 0, top));
        const sum = nums.reduce((a, b) => a + b, 0);
        const r = ri(rng, 0, sum + 3);
        const l = ri(rng, 0, r);
        return { input: `${fmtIntArr(nums)}\n${l}\n${r}`, expectedOutput: String(ref(nums, l, r)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countSubMultisets(nums: List[int], l: int, r: int) -> int:
              MOD = 10**9 + 7
              cnt = {}
              for v in nums:
                  cnt[v] = cnt.get(v, 0) + 1
              zeros = cnt.pop(0, 0)
              dp = [0] * (r + 1)
              dp[0] = 1
              for v, c in cnt.items():
                  if v > r:
                      continue
                  nd = dp[:]
                  span = (c + 1) * v
                  for s in range(v, r + 1):
                      val = nd[s - v] + dp[s]
                      if s >= span:
                          val -= dp[s - span]
                      nd[s] = val % MOD
                  dp = nd
              return (zeros + 1) * (sum(dp[l:r + 1]) % MOD) % MOD
        `,
        javascript: code`
          var countSubMultisets = function(nums, l, r) {
              var MOD = 1000000007;
              var maxV = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] > maxV) maxV = nums[i];
              var cnt = new Array(maxV + 1).fill(0);
              for (var i = 0; i < nums.length; i++) cnt[nums[i]]++;
              var dp = new Array(r + 1).fill(0);
              dp[0] = 1;
              for (var v = 1; v <= maxV && v <= r; v++) {
                  var c = cnt[v];
                  if (c === 0) continue;
                  var nd = dp.slice();
                  var span = (c + 1) * v;
                  for (var s = v; s <= r; s++) {
                      var val = nd[s - v] + dp[s];
                      if (s >= span) val -= dp[s - span];
                      nd[s] = ((val % MOD) + MOD) % MOD;
                  }
                  dp = nd;
              }
              var total = 0;
              for (var s = l; s <= r; s++) total = (total + dp[s]) % MOD;
              return ((cnt[0] + 1) * total) % MOD;
          };
        `,
        typescript: code`
          function countSubMultisets(nums: number[], l: number, r: number): number {
              var MOD = 1000000007;
              var maxV = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] > maxV) maxV = nums[i];
              var cnt: number[] = [];
              for (var i = 0; i <= maxV; i++) cnt.push(0);
              for (var i = 0; i < nums.length; i++) cnt[nums[i]]++;
              var dp: number[] = [];
              for (var s = 0; s <= r; s++) dp.push(0);
              dp[0] = 1;
              for (var v = 1; v <= maxV && v <= r; v++) {
                  var c = cnt[v];
                  if (c === 0) continue;
                  var nd = dp.slice();
                  var span = (c + 1) * v;
                  for (var s = v; s <= r; s++) {
                      var val = nd[s - v] + dp[s];
                      if (s >= span) val -= dp[s - span];
                      nd[s] = ((val % MOD) + MOD) % MOD;
                  }
                  dp = nd;
              }
              var total = 0;
              for (var s = l; s <= r; s++) total = (total + dp[s]) % MOD;
              return ((cnt[0] + 1) * total) % MOD;
          }
        `,
        java: code`
          public static int countSubMultisets(int[] nums, int l, int r) {
              final long MOD = 1000000007L;
              int maxV = 0;
              for (int v : nums) maxV = Math.max(maxV, v);
              int[] cnt = new int[maxV + 1];
              for (int v : nums) cnt[v]++;
              long[] dp = new long[r + 1];
              dp[0] = 1;
              for (int v = 1; v <= maxV && v <= r; v++) {
                  int c = cnt[v];
                  if (c == 0) continue;
                  long[] nd = dp.clone();
                  long span = (long) (c + 1) * v;
                  for (int s = v; s <= r; s++) {
                      long val = nd[s - v] + dp[s];
                      if (s >= span) val -= dp[(int) (s - span)];
                      nd[s] = ((val % MOD) + MOD) % MOD;
                  }
                  dp = nd;
              }
              long total = 0;
              for (int s = l; s <= r; s++) total = (total + dp[s]) % MOD;
              return (int) ((cnt[0] + 1) * total % MOD);
          }
        `,
        cpp: code`
          int countSubMultisets(vector<int>& nums, int l, int r) {
              const long long MOD = 1000000007LL;
              int maxV = 0;
              for (int v : nums) maxV = max(maxV, v);
              vector<int> cnt(maxV + 1, 0);
              for (int v : nums) cnt[v]++;
              vector<long long> dp(r + 1, 0);
              dp[0] = 1;
              for (int v = 1; v <= maxV && v <= r; v++) {
                  int c = cnt[v];
                  if (c == 0) continue;
                  vector<long long> nd = dp;
                  long long span = (long long) (c + 1) * v;
                  for (int s = v; s <= r; s++) {
                      long long val = nd[s - v] + dp[s];
                      if (s >= span) val -= dp[s - span];
                      nd[s] = ((val % MOD) + MOD) % MOD;
                  }
                  dp = nd;
              }
              long long total = 0;
              for (int s = l; s <= r; s++) total = (total + dp[s]) % MOD;
              return (int) ((cnt[0] + 1) * total % MOD);
          }
        `,
        c: code`
          int countSubMultisets(int* nums, int numsSize, int l, int r) {
              const long long MOD = 1000000007LL;
              int maxV = 0;
              for (int i = 0; i < numsSize; i++) if (nums[i] > maxV) maxV = nums[i];
              int* cnt = (int*) calloc((size_t) maxV + 1, sizeof(int));
              for (int i = 0; i < numsSize; i++) cnt[nums[i]]++;
              long long* dp = (long long*) calloc((size_t) r + 1, sizeof(long long));
              long long* nd = (long long*) malloc(sizeof(long long) * (r + 1));
              dp[0] = 1;
              for (int v = 1; v <= maxV && v <= r; v++) {
                  int c = cnt[v];
                  if (c == 0) continue;
                  long long span = (long long) (c + 1) * v;
                  for (int s = 0; s <= r; s++) nd[s] = dp[s];
                  for (int s = v; s <= r; s++) {
                      long long val = nd[s - v] + dp[s];
                      if (s >= span) val -= dp[s - span];
                      nd[s] = ((val % MOD) + MOD) % MOD;
                  }
                  long long* t = dp;
                  dp = nd;
                  nd = t;
              }
              long long total = 0;
              for (int s = l; s <= r; s++) total = (total + dp[s]) % MOD;
              int ans = (int) ((cnt[0] + 1) * total % MOD);
              free(cnt);
              free(dp);
              free(nd);
              return ans;
          }
        `,
        csharp: code`
          public static int CountSubMultisets(int[] nums, int l, int r)
          {
              const long MOD = 1000000007L;
              int maxV = 0;
              foreach (int v in nums) maxV = Math.Max(maxV, v);
              int[] cnt = new int[maxV + 1];
              foreach (int v in nums) cnt[v]++;
              long[] dp = new long[r + 1];
              dp[0] = 1;
              for (int v = 1; v <= maxV && v <= r; v++)
              {
                  int c = cnt[v];
                  if (c == 0) continue;
                  long[] nd = (long[]) dp.Clone();
                  long span = (long) (c + 1) * v;
                  for (int s = v; s <= r; s++)
                  {
                      long val = nd[s - v] + dp[s];
                      if (s >= span) val -= dp[s - span];
                      nd[s] = ((val % MOD) + MOD) % MOD;
                  }
                  dp = nd;
              }
              long total = 0;
              for (int s = l; s <= r; s++) total = (total + dp[s]) % MOD;
              return (int) ((cnt[0] + 1) * total % MOD);
          }
        `,
        go: code`
          func countSubMultisets(nums []int, l int, r int) int {
              const mod = 1000000007
              maxV := 0
              for _, v := range nums {
                  if v > maxV {
                      maxV = v
                  }
              }
              cnt := make([]int, maxV+1)
              for _, v := range nums {
                  cnt[v]++
              }
              dp := make([]int, r+1)
              dp[0] = 1
              for v := 1; v <= maxV && v <= r; v++ {
                  c := cnt[v]
                  if c == 0 {
                      continue
                  }
                  nd := make([]int, r+1)
                  copy(nd, dp)
                  span := (c + 1) * v
                  for s := v; s <= r; s++ {
                      val := nd[s-v] + dp[s]
                      if s >= span {
                          val -= dp[s-span]
                      }
                      nd[s] = ((val % mod) + mod) % mod
                  }
                  dp = nd
              }
              total := 0
              for s := l; s <= r; s++ {
                  total = (total + dp[s]) % mod
              }
              return (cnt[0] + 1) * total % mod
          }
        `,
        kotlin: code`
          fun countSubMultisets(nums: IntArray, l: Int, r: Int): Int {
              val modulus = 1000000007L
              var maxV = 0
              for (v in nums) if (v > maxV) maxV = v
              val cnt = IntArray(maxV + 1)
              for (v in nums) cnt[v]++
              var dp = LongArray(r + 1)
              dp[0] = 1L
              var v = 1
              while (v <= maxV && v <= r) {
                  val c = cnt[v]
                  if (c > 0) {
                      val nd = dp.copyOf()
                      val span = (c + 1).toLong() * v
                      for (s in v..r) {
                          var value = nd[s - v] + dp[s]
                          if (s >= span) value -= dp[(s - span).toInt()]
                          nd[s] = ((value % modulus) + modulus) % modulus
                      }
                      dp = nd
                  }
                  v++
              }
              var total = 0L
              for (s in l..r) total = (total + dp[s]) % modulus
              return ((cnt[0] + 1) * total % modulus).toInt()
          }
        `,
        swift: code`
          func countSubMultisets(_ nums: [Int], _ l: Int, _ r: Int) -> Int {
              let mod = 1000000007
              let maxV = nums.max() ?? 0
              var cnt = [Int](repeating: 0, count: maxV + 1)
              for v in nums { cnt[v] += 1 }
              var dp = [Int](repeating: 0, count: r + 1)
              dp[0] = 1
              var v = 1
              while v <= maxV && v <= r {
                  let c = cnt[v]
                  if c > 0 {
                      var nd = dp
                      let span = (c + 1) * v
                      var s = v
                      while s <= r {
                          var val = nd[s - v] + dp[s]
                          if s >= span { val -= dp[s - span] }
                          nd[s] = ((val % mod) + mod) % mod
                          s += 1
                      }
                      dp = nd
                  }
                  v += 1
              }
              var total = 0
              var s = l
              while s <= r {
                  total = (total + dp[s]) % mod
                  s += 1
              }
              return (cnt[0] + 1) * total % mod
          }
        `,
        rust: code`
          fn countSubMultisets(nums: Vec<i32>, l: i32, r: i32) -> i32 {
              const MOD: i64 = 1_000_000_007;
              let max_v = *nums.iter().max().unwrap_or(&0) as usize;
              let (l, r) = (l as usize, r as usize);
              let mut cnt = vec![0usize; max_v + 1];
              for &v in &nums {
                  cnt[v as usize] += 1;
              }
              let mut dp = vec![0i64; r + 1];
              dp[0] = 1;
              let mut v = 1usize;
              while v <= max_v && v <= r {
                  let c = cnt[v];
                  if c > 0 {
                      let mut nd = dp.clone();
                      let span = (c + 1) * v;
                      for s in v..=r {
                          let mut val = nd[s - v] + dp[s];
                          if s >= span {
                              val -= dp[s - span];
                          }
                          nd[s] = ((val % MOD) + MOD) % MOD;
                      }
                      dp = nd;
                  }
                  v += 1;
              }
              let mut total = 0i64;
              for s in l..=r {
                  total = (total + dp[s]) % MOD;
              }
              ((cnt[0] as i64 + 1) * total % MOD) as i32
          }
        `,
        php: code`
          function countSubMultisets($nums, $l, $r) {
              $MOD = 1000000007;
              $maxV = max($nums);
              $cnt = array_fill(0, $maxV + 1, 0);
              foreach ($nums as $v) $cnt[$v]++;
              $dp = array_fill(0, $r + 1, 0);
              $dp[0] = 1;
              for ($v = 1; $v <= $maxV && $v <= $r; $v++) {
                  $c = $cnt[$v];
                  if ($c == 0) continue;
                  $nd = $dp;
                  $span = ($c + 1) * $v;
                  for ($s = $v; $s <= $r; $s++) {
                      $val = $nd[$s - $v] + $dp[$s];
                      if ($s >= $span) $val -= $dp[$s - $span];
                      $nd[$s] = (($val % $MOD) + $MOD) % $MOD;
                  }
                  $dp = $nd;
              }
              $total = 0;
              for ($s = $l; $s <= $r; $s++) $total = ($total + $dp[$s]) % $MOD;
              return ($cnt[0] + 1) * $total % $MOD;
          }
        `,
        ruby: code`
          def countSubMultisets(nums, l, r)
            mod = 1_000_000_007
            max_v = nums.max
            cnt = Array.new(max_v + 1, 0)
            nums.each { |v| cnt[v] += 1 }
            dp = Array.new(r + 1, 0)
            dp[0] = 1
            v = 1
            while v <= max_v && v <= r
              c = cnt[v]
              if c > 0
                nd = dp.dup
                span = (c + 1) * v
                (v..r).each do |s|
                  val = nd[s - v] + dp[s]
                  val -= dp[s - span] if s >= span
                  nd[s] = val % mod
                end
                dp = nd
              end
              v += 1
            end
            total = 0
            (l..r).each { |s| total = (total + dp[s]) % mod }
            (cnt[0] + 1) * total % mod
          end
        `,
      },
    };
  })(),

  // ── Minimum Changes to Make K Semi-palindromes (LC 2911) ────────
  (() => {
    const INF = 1 << 29;
    const ref = (s: string, k: number) => {
      const n = s.length;
      const cost: number[][] = Array.from({ length: n }, () => new Array(n).fill(INF));
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const L = j - i + 1;
          for (let d = 1; d < L; d++) {
            if (L % d) continue;
            const m = L / d;
            let ch = 0;
            for (let r = 0; r < d; r++) {
              for (let t = 0; t < Math.floor(m / 2); t++) if (s[i + r + t * d] !== s[i + r + (m - 1 - t) * d]) ch++;
            }
            cost[i][j] = Math.min(cost[i][j], ch);
          }
        }
      }
      let dp = new Array(n + 1).fill(INF);
      dp[0] = 0;
      for (let p = 1; p <= k; p++) {
        const nd = new Array(n + 1).fill(INF);
        for (let e = 2; e <= n; e++) {
          for (let b = 0; b + 2 <= e; b++) if (dp[b] < INF) nd[e] = Math.min(nd[e], dp[b] + cost[b][e - 1]);
        }
        dp = nd;
      }
      return dp[n];
    };
    return {
      slug: "minimum-changes-to-make-k-semi-palindromes",
      title: "Minimum Changes to Make K Semi-palindromes",
      difficulty: "HARD" as const,
      tags: ["Two Pointers", "String", "Dynamic Programming", "Amazon"],
      signature: {
        funcName: "minimumChanges",
        params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A string of length `len` is a **semi-palindrome** if there is an integer `d` with `1 <= d < len` and `len % d == 0` such that, when the characters are grouped by their index modulo `d`, every group read in order is a palindrome. For example `\"adbgad\"` is one with `d = 2`: the groups `\"aba\"` (indices 0, 2, 4) and `\"dgd\"` (indices 1, 3, 5) are palindromes. A single character is never a semi-palindrome, since no valid `d` exists.\n\nGiven a string `s` and an integer `k`, split `s` into exactly `k` non-empty contiguous substrings and then change as few characters as possible so that **every** substring is a semi-palindrome.\n\nReturn the minimum number of character changes needed.",
        [
          { in: "s = \"abcac\", k = 2", out: String(ref("abcac", 2)), note: "Split into \"ab\" and \"cac\". \"cac\" is already a palindrome (d = 1); \"ab\" needs one change to become \"aa\"." },
          { in: "s = \"abcdef\", k = 2", out: String(ref("abcdef", 2)), note: "Split into \"abc\" and \"def\"; each needs one change to become a palindrome." },
          { in: "s = \"aabbaa\", k = 3", out: String(ref("aabbaa", 3)), note: "\"aa\", \"bb\" and \"aa\" are already semi-palindromes." },
        ],
        ["2 <= s.length <= 200", "1 <= k <= s.length / 2", "s consists of lowercase English letters"]),
      hints: [
        "First answer a smaller question: what does it cost to turn one substring `s[i..j]` into a semi-palindrome?",
        "For a fixed divisor `d` of the length, each residue group is fixed independently: compare its characters pairwise from both ends and count mismatches. Take the minimum over all valid `d`.",
        "With every substring's cost precomputed, the split is a standard partition DP: `dp[p][e]` = cheapest way to cut the first `e` characters into `p` pieces, each piece at least 2 long.",
      ],
      editorial: explain({
        idea: "The problem separates into two layers: a per-substring cost (best divisor `d`, mismatched mirror pairs inside each residue group) and a partition DP that chooses where to cut.",
        steps: [
          "For every substring `s[i..j]` with length `L ≥ 2`, and every `d` with `1 ≤ d < L` and `L % d == 0`: for each residue `r < d`, its group has `m = L / d` characters `s[i + r + t·d]`; count positions `t < m / 2` whose character differs from its mirror `s[i + r + (m - 1 - t)·d]`. The sum over residues is the cost for `d`; `cost[i][j]` is the minimum over `d`.",
          "Let `dp[p][e]` be the fewest changes to split `s[0..e-1]` into `p` semi-palindromes, with `dp[0][0] = 0` and everything else infinite.",
          "`dp[p][e] = min over b ≤ e - 2 of dp[p-1][b] + cost[b][e-1]`.",
          "Return `dp[k][n]`.",
        ],
        why: "Within a residue group, making it a palindrome only constrains mirrored pairs, and each mismatched pair needs exactly one change (set one character to the other), so the count of mismatched pairs is exact. Different residue groups share no characters, so their costs add. The substrings of a split are independent, so the partition DP over precomputed costs is exact.",
        time: "O(n^2 · σ(n) + k · n^2), where σ(n) is the sum of divisors — about O(n^3) in practice",
        space: "O(n^2)",
        pitfalls: [
          "`d` must be strictly less than the length, so a length-1 piece is impossible — keep every piece at least 2 long.",
          "`d = 1` is allowed and means the substring itself must be a palindrome.",
          "Mirror within the group, not within the substring: the partner of the `t`-th group member is the `(m - 1 - t)`-th member.",
        ],
      }),
      examples: [
        { input: "\"abcac\"\n2", expectedOutput: String(ref("abcac", 2)) },
        { input: "\"abcdef\"\n2", expectedOutput: String(ref("abcdef", 2)) },
        { input: "\"aabbaa\"\n3", expectedOutput: String(ref("aabbaa", 3)) },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [3, 8, 14, 20]));
        const s = randLower(rng, n, n, pick(rng, ["ab", "abc", "abcdefghij"]));
        const k = ri(rng, 1, Math.floor(n / 2));
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: code`
          def minimumChanges(s: str, k: int) -> int:
              n = len(s)
              INF = float('inf')
              cost = [[INF] * n for _ in range(n)]
              for i in range(n):
                  for j in range(i + 1, n):
                      L = j - i + 1
                      best = INF
                      for d in range(1, L):
                          if L % d:
                              continue
                          m = L // d
                          ch = 0
                          for r in range(d):
                              for t in range(m // 2):
                                  if s[i + r + t * d] != s[i + r + (m - 1 - t) * d]:
                                      ch += 1
                          best = min(best, ch)
                      cost[i][j] = best
              dp = [INF] * (n + 1)
              dp[0] = 0
              for _ in range(k):
                  nd = [INF] * (n + 1)
                  for e in range(2, n + 1):
                      for b in range(e - 1):
                          if dp[b] < INF:
                              v = dp[b] + cost[b][e - 1]
                              if v < nd[e]:
                                  nd[e] = v
                  dp = nd
              return dp[n]
        `,
        javascript: code`
          var minimumChanges = function(s, k) {
              var n = s.length, INF = 1 << 29;
              var cost = [];
              for (var i = 0; i < n; i++) cost.push(new Array(n).fill(INF));
              for (var i = 0; i < n; i++) {
                  for (var j = i + 1; j < n; j++) {
                      var L = j - i + 1;
                      for (var d = 1; d < L; d++) {
                          if (L % d !== 0) continue;
                          var m = L / d, ch = 0;
                          for (var r = 0; r < d; r++) {
                              for (var t = 0; t < (m >> 1); t++) {
                                  if (s[i + r + t * d] !== s[i + r + (m - 1 - t) * d]) ch++;
                              }
                          }
                          if (ch < cost[i][j]) cost[i][j] = ch;
                      }
                  }
              }
              var dp = new Array(n + 1).fill(INF);
              dp[0] = 0;
              for (var p = 0; p < k; p++) {
                  var nd = new Array(n + 1).fill(INF);
                  for (var e = 2; e <= n; e++) {
                      for (var b = 0; b + 2 <= e; b++) {
                          if (dp[b] < INF && dp[b] + cost[b][e - 1] < nd[e]) nd[e] = dp[b] + cost[b][e - 1];
                      }
                  }
                  dp = nd;
              }
              return dp[n];
          };
        `,
        typescript: code`
          function minimumChanges(s: string, k: number): number {
              var n = s.length, INF = 1 << 29;
              var cost: number[][] = [];
              for (var i = 0; i < n; i++) {
                  var row: number[] = [];
                  for (var j = 0; j < n; j++) row.push(INF);
                  cost.push(row);
              }
              for (var i = 0; i < n; i++) {
                  for (var j = i + 1; j < n; j++) {
                      var L = j - i + 1;
                      for (var d = 1; d < L; d++) {
                          if (L % d !== 0) continue;
                          var m = L / d, ch = 0;
                          for (var r = 0; r < d; r++) {
                              for (var t = 0; t < (m >> 1); t++) {
                                  if (s.charAt(i + r + t * d) !== s.charAt(i + r + (m - 1 - t) * d)) ch++;
                              }
                          }
                          if (ch < cost[i][j]) cost[i][j] = ch;
                      }
                  }
              }
              var dp: number[] = [];
              for (var e = 0; e <= n; e++) dp.push(INF);
              dp[0] = 0;
              for (var p = 0; p < k; p++) {
                  var nd: number[] = [];
                  for (var e = 0; e <= n; e++) nd.push(INF);
                  for (var e = 2; e <= n; e++) {
                      for (var b = 0; b + 2 <= e; b++) {
                          if (dp[b] < INF && dp[b] + cost[b][e - 1] < nd[e]) nd[e] = dp[b] + cost[b][e - 1];
                      }
                  }
                  dp = nd;
              }
              return dp[n];
          }
        `,
        java: code`
          public static int minimumChanges(String s, int k) {
              int n = s.length();
              final int INF = 1 << 29;
              int[][] cost = new int[n][n];
              for (int[] row : cost) Arrays.fill(row, INF);
              for (int i = 0; i < n; i++) {
                  for (int j = i + 1; j < n; j++) {
                      int L = j - i + 1;
                      for (int d = 1; d < L; d++) {
                          if (L % d != 0) continue;
                          int m = L / d, ch = 0;
                          for (int r = 0; r < d; r++) {
                              for (int t = 0; t < m / 2; t++) {
                                  if (s.charAt(i + r + t * d) != s.charAt(i + r + (m - 1 - t) * d)) ch++;
                              }
                          }
                          cost[i][j] = Math.min(cost[i][j], ch);
                      }
                  }
              }
              int[] dp = new int[n + 1];
              Arrays.fill(dp, INF);
              dp[0] = 0;
              for (int p = 0; p < k; p++) {
                  int[] nd = new int[n + 1];
                  Arrays.fill(nd, INF);
                  for (int e = 2; e <= n; e++) {
                      for (int b = 0; b + 2 <= e; b++) {
                          if (dp[b] < INF) nd[e] = Math.min(nd[e], dp[b] + cost[b][e - 1]);
                      }
                  }
                  dp = nd;
              }
              return dp[n];
          }
        `,
        cpp: code`
          int minimumChanges(string s, int k) {
              int n = s.size();
              const int INF = 1 << 29;
              vector<vector<int>> cost(n, vector<int>(n, INF));
              for (int i = 0; i < n; i++) {
                  for (int j = i + 1; j < n; j++) {
                      int L = j - i + 1;
                      for (int d = 1; d < L; d++) {
                          if (L % d != 0) continue;
                          int m = L / d, ch = 0;
                          for (int r = 0; r < d; r++) {
                              for (int t = 0; t < m / 2; t++) {
                                  if (s[i + r + t * d] != s[i + r + (m - 1 - t) * d]) ch++;
                              }
                          }
                          cost[i][j] = min(cost[i][j], ch);
                      }
                  }
              }
              vector<int> dp(n + 1, INF);
              dp[0] = 0;
              for (int p = 0; p < k; p++) {
                  vector<int> nd(n + 1, INF);
                  for (int e = 2; e <= n; e++) {
                      for (int b = 0; b + 2 <= e; b++) {
                          if (dp[b] < INF) nd[e] = min(nd[e], dp[b] + cost[b][e - 1]);
                      }
                  }
                  dp = nd;
              }
              return dp[n];
          }
        `,
        c: code`
          int minimumChanges(const char* s, int k) {
              int n = (int) strlen(s);
              const int INF = 1 << 29;
              int* cost = (int*) malloc(sizeof(int) * n * n);
              for (int i = 0; i < n * n; i++) cost[i] = INF;
              for (int i = 0; i < n; i++) {
                  for (int j = i + 1; j < n; j++) {
                      int L = j - i + 1;
                      for (int d = 1; d < L; d++) {
                          if (L % d != 0) continue;
                          int m = L / d, ch = 0;
                          for (int r = 0; r < d; r++) {
                              for (int t = 0; t < m / 2; t++) {
                                  if (s[i + r + t * d] != s[i + r + (m - 1 - t) * d]) ch++;
                              }
                          }
                          if (ch < cost[i * n + j]) cost[i * n + j] = ch;
                      }
                  }
              }
              int* dp = (int*) malloc(sizeof(int) * (n + 1));
              int* nd = (int*) malloc(sizeof(int) * (n + 1));
              for (int e = 0; e <= n; e++) dp[e] = INF;
              dp[0] = 0;
              for (int p = 0; p < k; p++) {
                  for (int e = 0; e <= n; e++) nd[e] = INF;
                  for (int e = 2; e <= n; e++) {
                      for (int b = 0; b + 2 <= e; b++) {
                          if (dp[b] < INF && dp[b] + cost[b * n + e - 1] < nd[e]) nd[e] = dp[b] + cost[b * n + e - 1];
                      }
                  }
                  int* t = dp;
                  dp = nd;
                  nd = t;
              }
              int ans = dp[n];
              free(cost);
              free(dp);
              free(nd);
              return ans;
          }
        `,
        csharp: code`
          public static int MinimumChanges(string s, int k)
          {
              int n = s.Length;
              const int INF = 1 << 29;
              int[,] cost = new int[n, n];
              for (int i = 0; i < n; i++) for (int j = 0; j < n; j++) cost[i, j] = INF;
              for (int i = 0; i < n; i++)
              {
                  for (int j = i + 1; j < n; j++)
                  {
                      int L = j - i + 1;
                      for (int d = 1; d < L; d++)
                      {
                          if (L % d != 0) continue;
                          int m = L / d, ch = 0;
                          for (int r = 0; r < d; r++)
                          {
                              for (int t = 0; t < m / 2; t++)
                              {
                                  if (s[i + r + t * d] != s[i + r + (m - 1 - t) * d]) ch++;
                              }
                          }
                          cost[i, j] = Math.Min(cost[i, j], ch);
                      }
                  }
              }
              int[] dp = new int[n + 1];
              for (int e = 0; e <= n; e++) dp[e] = INF;
              dp[0] = 0;
              for (int p = 0; p < k; p++)
              {
                  int[] nd = new int[n + 1];
                  for (int e = 0; e <= n; e++) nd[e] = INF;
                  for (int e = 2; e <= n; e++)
                  {
                      for (int b = 0; b + 2 <= e; b++)
                      {
                          if (dp[b] < INF) nd[e] = Math.Min(nd[e], dp[b] + cost[b, e - 1]);
                      }
                  }
                  dp = nd;
              }
              return dp[n];
          }
        `,
        go: code`
          func minimumChanges(s string, k int) int {
              n := len(s)
              const inf = 1 << 29
              cost := make([][]int, n)
              for i := range cost {
                  cost[i] = make([]int, n)
                  for j := range cost[i] {
                      cost[i][j] = inf
                  }
              }
              for i := 0; i < n; i++ {
                  for j := i + 1; j < n; j++ {
                      L := j - i + 1
                      for d := 1; d < L; d++ {
                          if L%d != 0 {
                              continue
                          }
                          m, ch := L/d, 0
                          for r := 0; r < d; r++ {
                              for t := 0; t < m/2; t++ {
                                  if s[i+r+t*d] != s[i+r+(m-1-t)*d] {
                                      ch++
                                  }
                              }
                          }
                          if ch < cost[i][j] {
                              cost[i][j] = ch
                          }
                      }
                  }
              }
              dp := make([]int, n+1)
              for e := range dp {
                  dp[e] = inf
              }
              dp[0] = 0
              for p := 0; p < k; p++ {
                  nd := make([]int, n+1)
                  for e := range nd {
                      nd[e] = inf
                  }
                  for e := 2; e <= n; e++ {
                      for b := 0; b+2 <= e; b++ {
                          if dp[b] < inf && dp[b]+cost[b][e-1] < nd[e] {
                              nd[e] = dp[b] + cost[b][e-1]
                          }
                      }
                  }
                  dp = nd
              }
              return dp[n]
          }
        `,
        kotlin: code`
          fun minimumChanges(s: String, k: Int): Int {
              val n = s.length
              val inf = 1 shl 29
              val cost = Array(n) { IntArray(n) { inf } }
              for (i in 0 until n) {
                  for (j in i + 1 until n) {
                      val len = j - i + 1
                      for (d in 1 until len) {
                          if (len % d != 0) continue
                          val m = len / d
                          var ch = 0
                          for (r in 0 until d) {
                              for (t in 0 until m / 2) {
                                  if (s[i + r + t * d] != s[i + r + (m - 1 - t) * d]) ch++
                              }
                          }
                          cost[i][j] = minOf(cost[i][j], ch)
                      }
                  }
              }
              var dp = IntArray(n + 1) { inf }
              dp[0] = 0
              repeat(k) {
                  val nd = IntArray(n + 1) { inf }
                  for (e in 2..n) {
                      for (b in 0..e - 2) {
                          if (dp[b] < inf) nd[e] = minOf(nd[e], dp[b] + cost[b][e - 1])
                      }
                  }
                  dp = nd
              }
              return dp[n]
          }
        `,
        swift: code`
          func minimumChanges(_ s: String, _ k: Int) -> Int {
              let a = Array(s.utf8)
              let n = a.count
              let inf = 1 << 29
              var cost = [[Int]](repeating: [Int](repeating: inf, count: n), count: n)
              for i in 0..<n {
                  var j = i + 1
                  while j < n {
                      let L = j - i + 1
                      for d in 1..<L where L % d == 0 {
                          let m = L / d
                          var ch = 0
                          for r in 0..<d {
                              var t = 0
                              while t < m / 2 {
                                  if a[i + r + t * d] != a[i + r + (m - 1 - t) * d] { ch += 1 }
                                  t += 1
                              }
                          }
                          cost[i][j] = min(cost[i][j], ch)
                      }
                      j += 1
                  }
              }
              var dp = [Int](repeating: inf, count: n + 1)
              dp[0] = 0
              for _ in 0..<k {
                  var nd = [Int](repeating: inf, count: n + 1)
                  var e = 2
                  while e <= n {
                      var b = 0
                      while b + 2 <= e {
                          if dp[b] < inf { nd[e] = min(nd[e], dp[b] + cost[b][e - 1]) }
                          b += 1
                      }
                      e += 1
                  }
                  dp = nd
              }
              return dp[n]
          }
        `,
        rust: code`
          fn minimumChanges(s: String, k: i32) -> i32 {
              let a = s.as_bytes();
              let n = a.len();
              let inf = 1i32 << 29;
              let mut cost = vec![vec![inf; n]; n];
              for i in 0..n {
                  for j in i + 1..n {
                      let len = j - i + 1;
                      for d in 1..len {
                          if len % d != 0 {
                              continue;
                          }
                          let m = len / d;
                          let mut ch = 0;
                          for r in 0..d {
                              for t in 0..m / 2 {
                                  if a[i + r + t * d] != a[i + r + (m - 1 - t) * d] {
                                      ch += 1;
                                  }
                              }
                          }
                          if ch < cost[i][j] {
                              cost[i][j] = ch;
                          }
                      }
                  }
              }
              let mut dp = vec![inf; n + 1];
              dp[0] = 0;
              for _ in 0..k {
                  let mut nd = vec![inf; n + 1];
                  for e in 2..=n {
                      for b in 0..=e - 2 {
                          if dp[b] < inf && dp[b] + cost[b][e - 1] < nd[e] {
                              nd[e] = dp[b] + cost[b][e - 1];
                          }
                      }
                  }
                  dp = nd;
              }
              dp[n]
          }
        `,
        php: code`
          function minimumChanges($s, $k) {
              $n = strlen($s);
              $INF = 1 << 29;
              $cost = array_fill(0, $n, array_fill(0, $n, $INF));
              for ($i = 0; $i < $n; $i++) {
                  for ($j = $i + 1; $j < $n; $j++) {
                      $L = $j - $i + 1;
                      for ($d = 1; $d < $L; $d++) {
                          if ($L % $d != 0) continue;
                          $m = intdiv($L, $d);
                          $ch = 0;
                          for ($r = 0; $r < $d; $r++) {
                              for ($t = 0; $t < intdiv($m, 2); $t++) {
                                  if ($s[$i + $r + $t * $d] !== $s[$i + $r + ($m - 1 - $t) * $d]) $ch++;
                              }
                          }
                          if ($ch < $cost[$i][$j]) $cost[$i][$j] = $ch;
                      }
                  }
              }
              $dp = array_fill(0, $n + 1, $INF);
              $dp[0] = 0;
              for ($p = 0; $p < $k; $p++) {
                  $nd = array_fill(0, $n + 1, $INF);
                  for ($e = 2; $e <= $n; $e++) {
                      for ($b = 0; $b + 2 <= $e; $b++) {
                          if ($dp[$b] < $INF && $dp[$b] + $cost[$b][$e - 1] < $nd[$e]) $nd[$e] = $dp[$b] + $cost[$b][$e - 1];
                      }
                  }
                  $dp = $nd;
              }
              return $dp[$n];
          }
        `,
        ruby: code`
          def minimumChanges(s, k)
            n = s.length
            inf = 1 << 29
            cost = Array.new(n) { Array.new(n, inf) }
            (0...n).each do |i|
              (i + 1...n).each do |j|
                len = j - i + 1
                (1...len).each do |d|
                  next if len % d != 0
                  m = len / d
                  ch = 0
                  d.times do |r|
                    (m / 2).times do |t|
                      ch += 1 if s[i + r + t * d] != s[i + r + (m - 1 - t) * d]
                    end
                  end
                  cost[i][j] = ch if ch < cost[i][j]
                end
              end
            end
            dp = Array.new(n + 1, inf)
            dp[0] = 0
            k.times do
              nd = Array.new(n + 1, inf)
              (2..n).each do |e|
                (0..e - 2).each do |b|
                  next if dp[b] >= inf
                  v = dp[b] + cost[b][e - 1]
                  nd[e] = v if v < nd[e]
                end
              end
              dp = nd
            end
            dp[n]
          end
        `,
      },
    };
  })(),

  // ── Maximum Points After Collecting Coins From All Nodes (LC 2920) ──
  (() => {
    // f(u, h): best score in u's subtree when every coin there has already
    // been halved h times. h is capped at 14 — 10^4 >> 14 == 0, so deeper
    // halvings change nothing. Memoised over (node, h); checked offline
    // against all 2^n choices for n <= 10.
    const ref = (edges: number[][], coins: number[], k: number) => {
      const n = coins.length;
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
      const memo = new Map<number, number>();
      const f = (u: number, p: number, h: number): number => {
        const key = u * 16 + h;
        const got = memo.get(key);
        if (got !== undefined) return got;
        let a = (coins[u] >> h) - k, b = coins[u] >> (h + 1);
        for (const v of adj[u]) if (v !== p) { a += f(v, u, h); b += f(v, u, Math.min(h + 1, 14)); }
        const res = Math.max(a, b);
        memo.set(key, res);
        return res;
      };
      return f(0, -1, 0);
    };
    const ex1 = { e: [[0, 1], [1, 2], [2, 3]], c: [10, 10, 3, 3], k: 5 };
    const ex2 = { e: [[0, 1], [0, 2]], c: [8, 4, 4], k: 0 };
    const ex3 = { e: [[1, 0]], c: [0, 7], k: 3 };
    return {
      slug: "maximum-points-after-collecting-coins-from-all-nodes",
      title: "Maximum Points After Collecting Coins From All Nodes",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Bit Manipulation", "Tree", "Depth-First Search", "Google"],
      signature: {
        funcName: "maximumPoints",
        params: [{ name: "edges", type: "int[][]" as const }, { name: "coins", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "An undirected tree has `n` nodes labelled `0` to `n - 1` and is rooted at node `0`. You are given `edges`, where `edges[i] = [a, b]` is an edge, an array `coins` where node `i` holds `coins[i]` coins, and an integer `k`.\n\nCoins must be collected from **every** node, and a node can only be collected after its parent has been. When you collect node `i` you choose one of two ways:\n\n1. Take `coins[i] - k` points. This may be negative.\n2. Take `floor(coins[i] / 2)` points — and every node in `i`'s subtree then has its coin count halved (rounded down) as well.\n\nHalvings stack: a node under two nodes that chose the second way has been halved twice by the time it is collected.\n\nReturn the **maximum** total points you can get.",
        [
          { in: "edges = [[0,1],[1,2],[2,3]], coins = [10,10,3,3], k = 5", out: String(ref(ex1.e, ex1.c, ex1.k)), note: "Take 10 - 5 = 5 at node 0 and at node 1. At node 2 take floor(3 / 2) = 1, which halves node 3 to 1; take floor(1 / 2) = 0 there. Total 11." },
          { in: "edges = [[0,1],[0,2]], coins = [8,4,4], k = 0", out: String(ref(ex2.e, ex2.c, ex2.k)), note: "With k = 0 the first way always gives the full count: 8 + 4 + 4." },
          { in: "edges = [[1,0]], coins = [0,7], k = 3", out: String(ref(ex3.e, ex3.c, ex3.k)), note: "Either take 0 - 3 = -3 at the root and then 7 - 3 = 4 at node 1, or take floor(0 / 2) = 0 at the root — which halves node 1 to 3 — and then floor(3 / 2) = 1. Both total 1." },
        ],
        ["n == coins.length", "2 <= n <= 10^5", "0 <= coins[i] <= 10^4", "edges.length == n - 1", "0 <= edges[i][0], edges[i][1] < n", "0 <= k <= 10^4", "The edges form a tree"]),
      hints: [
        "What does a node need to know about its ancestors' choices? Only how many of them chose the halving way.",
        "Coins are at most `10^4 < 2^14`, so after 14 halvings every count is 0 — the halving count can be capped at 14.",
        "Let `f(u, h)` be the best score in `u`'s subtree when its coins have been halved `h` times: `max((coins[u] >> h) - k + Σ f(child, h), (coins[u] >> (h + 1)) + Σ f(child, min(h + 1, 14)))`.",
      ],
      editorial: explain({
        idea: "A node's options depend only on how many ancestors halved — and that number stops mattering after 14, since every coin count is below `2^14`. That gives a tree DP with 15 states per node.",
        steps: [
          "Build the adjacency list and an order in which parents come before children (BFS from 0), remembering each node's parent.",
          "Process nodes in reverse order. Keep `S[u][h]`, the sum of `f(child, h)` over `u`'s children processed so far.",
          "For each `h` from 0 to 14: `f(u, h) = max((coins[u] >> h) - k + S[u][h], (coins[u] >> (h + 1)) + S[u][min(h + 1, 14)])`.",
          "Add `f(u, ·)` into `S[parent(u)]`. The answer is `f(0, 0)`.",
        ],
        why: "Halving `h` times and then rounding down equals a right shift by `h`, so a node's coins under `h` ancestor halvings are `coins[u] >> h`. The two choices at `u` affect its subtree only through `h` (unchanged or plus one), so subtrees of different children are independent given `h`, which is exactly what the DP sums. Capping at 14 is exact because `x >> 14 = 0` for every allowed coin count.",
        time: "O(n · 15)",
        space: "O(n · 15)",
        pitfalls: [
          "Without the cap, `h` could grow to the depth of the tree and the table would be `O(n^2)`.",
          "The first way can be negative — the best score for a subtree is not simply the sum of positive choices.",
          "A deep path tree overflows the call stack in recursive solutions; process nodes iteratively.",
        ],
      }),
      examples: [
        { input: `${fmtIntMat(ex1.e)}\n${fmtIntArr(ex1.c)}\n${ex1.k}`, expectedOutput: String(ref(ex1.e, ex1.c, ex1.k)) },
        { input: `${fmtIntMat(ex2.e)}\n${fmtIntArr(ex2.c)}\n${ex2.k}`, expectedOutput: String(ref(ex2.e, ex2.c, ex2.k)) },
        { input: `${fmtIntMat(ex3.e)}\n${fmtIntArr(ex3.c)}\n${ex3.k}`, expectedOutput: String(ref(ex3.e, ex3.c, ex3.k)) },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [3, 8, 20, 40]));
        const edges = randomTree(rng, n);
        const top = pick(rng, [0, 10, 100, 10000]);
        const coins = Array.from({ length: n }, () => ri(rng, 0, top));
        const k = pick(rng, [0, ri(rng, 0, 10), ri(rng, 0, 100), ri(rng, 0, 10000)]);
        return { input: `${fmtIntMat(edges)}\n${fmtIntArr(coins)}\n${k}`, expectedOutput: String(ref(edges, coins, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumPoints(edges: List[List[int]], coins: List[int], k: int) -> int:
              n = len(coins)
              H = 15  # coins < 2^14, so 14 halvings already reach 0
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              parent = [-1] * n
              order = [0]
              seen = [False] * n
              seen[0] = True
              i = 0
              while i < len(order):
                  u = order[i]
                  i += 1
                  for v in adj[u]:
                      if not seen[v]:
                          seen[v] = True
                          parent[v] = u
                          order.append(v)
              S = [[0] * H for _ in range(n)]
              root = 0
              for u in reversed(order):
                  c = coins[u]
                  su = S[u]
                  fu = [0] * H
                  for h in range(H):
                      a = (c >> h) - k + su[h]
                      b = (c >> (h + 1)) + su[min(h + 1, H - 1)]
                      fu[h] = a if a > b else b
                  p = parent[u]
                  if p >= 0:
                      sp = S[p]
                      for h in range(H):
                          sp[h] += fu[h]
                  else:
                      root = fu[0]
              return root
        `,
        javascript: code`
          var maximumPoints = function(edges, coins, k) {
              var n = coins.length, H = 15; // coins < 2^14, so 14 halvings already reach 0
              var adj = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var i = 0; i < edges.length; i++) {
                  adj[edges[i][0]].push(edges[i][1]);
                  adj[edges[i][1]].push(edges[i][0]);
              }
              var parent = new Array(n).fill(-1), seen = new Array(n).fill(false), order = [0];
              seen[0] = true;
              for (var q = 0; q < order.length; q++) {
                  var u = order[q];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (!seen[v]) { seen[v] = true; parent[v] = u; order.push(v); }
                  }
              }
              var S = new Array(n * H).fill(0), root = 0, fu = new Array(H);
              for (var q = n - 1; q >= 0; q--) {
                  var u = order[q], c = coins[u];
                  for (var h = 0; h < H; h++) {
                      var a = (c >> h) - k + S[u * H + h];
                      var b = (c >> (h + 1)) + S[u * H + Math.min(h + 1, H - 1)];
                      fu[h] = a > b ? a : b;
                  }
                  if (parent[u] >= 0) {
                      for (var h = 0; h < H; h++) S[parent[u] * H + h] += fu[h];
                  } else {
                      root = fu[0];
                  }
              }
              return root;
          };
        `,
        typescript: code`
          function maximumPoints(edges: number[][], coins: number[], k: number): number {
              var n = coins.length, H = 15; // coins < 2^14, so 14 halvings already reach 0
              var adj: number[][] = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var i = 0; i < edges.length; i++) {
                  adj[edges[i][0]].push(edges[i][1]);
                  adj[edges[i][1]].push(edges[i][0]);
              }
              var parent: number[] = [], seen: boolean[] = [], order: number[] = [0];
              for (var i = 0; i < n; i++) { parent.push(-1); seen.push(false); }
              seen[0] = true;
              for (var q = 0; q < order.length; q++) {
                  var u = order[q];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (!seen[v]) { seen[v] = true; parent[v] = u; order.push(v); }
                  }
              }
              var S: number[] = [];
              for (var i = 0; i < n * H; i++) S.push(0);
              var root = 0, fu: number[] = [];
              for (var h = 0; h < H; h++) fu.push(0);
              for (var q = n - 1; q >= 0; q--) {
                  var u = order[q], c = coins[u];
                  for (var h = 0; h < H; h++) {
                      var a = (c >> h) - k + S[u * H + h];
                      var b = (c >> (h + 1)) + S[u * H + Math.min(h + 1, H - 1)];
                      fu[h] = a > b ? a : b;
                  }
                  if (parent[u] >= 0) {
                      for (var h = 0; h < H; h++) S[parent[u] * H + h] += fu[h];
                  } else {
                      root = fu[0];
                  }
              }
              return root;
          }
        `,
        java: code`
          public static int maximumPoints(int[][] edges, int[] coins, int k) {
              int n = coins.length, H = 15; // coins < 2^14, so 14 halvings already reach 0
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] parent = new int[n], order = new int[n];
              boolean[] seen = new boolean[n];
              Arrays.fill(parent, -1);
              int tail = 0;
              order[tail++] = 0;
              seen[0] = true;
              for (int q = 0; q < tail; q++) {
                  int u = order[q];
                  for (int v : adj.get(u)) if (!seen[v]) { seen[v] = true; parent[v] = u; order[tail++] = v; }
              }
              long[][] S = new long[n][H];
              long[] fu = new long[H];
              long root = 0;
              for (int q = n - 1; q >= 0; q--) {
                  int u = order[q], c = coins[u];
                  for (int h = 0; h < H; h++) {
                      long a = (c >> h) - k + S[u][h];
                      long b = (c >> (h + 1)) + S[u][Math.min(h + 1, H - 1)];
                      fu[h] = Math.max(a, b);
                  }
                  if (parent[u] >= 0) for (int h = 0; h < H; h++) S[parent[u]][h] += fu[h];
                  else root = fu[0];
              }
              return (int) root;
          }
        `,
        cpp: code`
          int maximumPoints(vector<vector<int>>& edges, vector<int>& coins, int k) {
              int n = coins.size();
              const int H = 15; // coins < 2^14, so 14 halvings already reach 0
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> parent(n, -1), order;
              vector<bool> seen(n, false);
              order.push_back(0);
              seen[0] = true;
              for (int q = 0; q < (int) order.size(); q++) {
                  int u = order[q];
                  for (int v : adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; order.push_back(v); }
              }
              vector<vector<long long>> S(n, vector<long long>(H, 0));
              long long fu[H];
              long long root = 0;
              for (int q = n - 1; q >= 0; q--) {
                  int u = order[q], c = coins[u];
                  for (int h = 0; h < H; h++) {
                      long long a = (c >> h) - k + S[u][h];
                      long long b = (c >> (h + 1)) + S[u][min(h + 1, H - 1)];
                      fu[h] = max(a, b);
                  }
                  if (parent[u] >= 0) for (int h = 0; h < H; h++) S[parent[u]][h] += fu[h];
                  else root = fu[0];
              }
              return (int) root;
          }
        `,
        c: code`
          int maximumPoints(int** edges, int edgesSize, int* edgesColSize, int* coins, int coinsSize, int k) {
              int n = coinsSize;
              const int H = 15; // coins < 2^14, so 14 halvings already reach 0
              int* start = (int*) calloc((size_t) n + 1, sizeof(int));
              for (int i = 0; i < edgesSize; i++) { start[edges[i][0] + 1]++; start[edges[i][1] + 1]++; }
              for (int i = 0; i < n; i++) start[i + 1] += start[i];
              int* fillAt = (int*) malloc(sizeof(int) * (n + 1));
              for (int i = 0; i <= n; i++) fillAt[i] = start[i];
              int* adj = (int*) malloc(sizeof(int) * (2 * edgesSize + 1));
              for (int i = 0; i < edgesSize; i++) {
                  adj[fillAt[edges[i][0]]++] = edges[i][1];
                  adj[fillAt[edges[i][1]]++] = edges[i][0];
              }
              int* parent = (int*) malloc(sizeof(int) * n);
              int* order = (int*) malloc(sizeof(int) * n);
              char* seen = (char*) calloc((size_t) n, 1);
              for (int i = 0; i < n; i++) parent[i] = -1;
              int tail = 0;
              order[tail++] = 0;
              seen[0] = 1;
              for (int q = 0; q < tail; q++) {
                  int u = order[q];
                  for (int j = start[u]; j < start[u + 1]; j++) {
                      int v = adj[j];
                      if (!seen[v]) { seen[v] = 1; parent[v] = u; order[tail++] = v; }
                  }
              }
              long long* S = (long long*) calloc((size_t) n * H, sizeof(long long));
              long long fu[15];
              long long root = 0;
              for (int q = n - 1; q >= 0; q--) {
                  int u = order[q], c = coins[u];
                  for (int h = 0; h < H; h++) {
                      int nh = h + 1 < H ? h + 1 : H - 1;
                      long long a = (c >> h) - k + S[(long long) u * H + h];
                      long long b = (c >> (h + 1)) + S[(long long) u * H + nh];
                      fu[h] = a > b ? a : b;
                  }
                  if (parent[u] >= 0) for (int h = 0; h < H; h++) S[(long long) parent[u] * H + h] += fu[h];
                  else root = fu[0];
              }
              free(start); free(fillAt); free(adj); free(parent); free(order); free(seen); free(S);
              return (int) root;
          }
        `,
        csharp: code`
          public static int MaximumPoints(int[][] edges, int[] coins, int k)
          {
              int n = coins.Length, H = 15; // coins < 2^14, so 14 halvings already reach 0
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              int[] parent = new int[n], order = new int[n];
              bool[] seen = new bool[n];
              for (int i = 0; i < n; i++) parent[i] = -1;
              int tail = 0;
              order[tail++] = 0;
              seen[0] = true;
              for (int q = 0; q < tail; q++)
              {
                  int u = order[q];
                  foreach (int v in adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; order[tail++] = v; }
              }
              long[,] S = new long[n, H];
              long[] fu = new long[H];
              long root = 0;
              for (int q = n - 1; q >= 0; q--)
              {
                  int u = order[q], c = coins[u];
                  for (int h = 0; h < H; h++)
                  {
                      long a = (c >> h) - k + S[u, h];
                      long b = (c >> (h + 1)) + S[u, Math.Min(h + 1, H - 1)];
                      fu[h] = Math.Max(a, b);
                  }
                  if (parent[u] >= 0) for (int h = 0; h < H; h++) S[parent[u], h] += fu[h];
                  else root = fu[0];
              }
              return (int) root;
          }
        `,
        go: code`
          func maximumPoints(edges [][]int, coins []int, k int) int {
              n, H := len(coins), 15 // coins < 2^14, so 14 halvings already reach 0
              adj := make([][]int, n)
              for _, e := range edges {
                  adj[e[0]] = append(adj[e[0]], e[1])
                  adj[e[1]] = append(adj[e[1]], e[0])
              }
              parent := make([]int, n)
              for i := range parent {
                  parent[i] = -1
              }
              seen := make([]bool, n)
              order := []int{0}
              seen[0] = true
              for q := 0; q < len(order); q++ {
                  u := order[q]
                  for _, v := range adj[u] {
                      if !seen[v] {
                          seen[v] = true
                          parent[v] = u
                          order = append(order, v)
                      }
                  }
              }
              S := make([]int, n*H)
              fu := make([]int, H)
              root := 0
              for q := n - 1; q >= 0; q-- {
                  u := order[q]
                  c := coins[u]
                  for h := 0; h < H; h++ {
                      nh := h + 1
                      if nh > H-1 {
                          nh = H - 1
                      }
                      a := (c >> uint(h)) - k + S[u*H+h]
                      b := (c >> uint(h+1)) + S[u*H+nh]
                      if a > b {
                          fu[h] = a
                      } else {
                          fu[h] = b
                      }
                  }
                  if parent[u] >= 0 {
                      for h := 0; h < H; h++ {
                          S[parent[u]*H+h] += fu[h]
                      }
                  } else {
                      root = fu[0]
                  }
              }
              return root
          }
        `,
        kotlin: code`
          fun maximumPoints(edges: Array<IntArray>, coins: IntArray, k: Int): Int {
              val n = coins.size
              val hMax = 15 // coins < 2^14, so 14 halvings already reach 0
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val parent = IntArray(n) { -1 }
              val order = IntArray(n)
              val seen = BooleanArray(n)
              var tail = 0
              order[tail++] = 0
              seen[0] = true
              var q = 0
              while (q < tail) {
                  val u = order[q++]
                  for (v in adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; order[tail++] = v }
              }
              val s = Array(n) { LongArray(hMax) }
              val fu = LongArray(hMax)
              var root = 0L
              for (idx in n - 1 downTo 0) {
                  val u = order[idx]
                  val c = coins[u]
                  for (h in 0 until hMax) {
                      val a = (c shr h) - k + s[u][h]
                      val b = (c shr (h + 1)) + s[u][minOf(h + 1, hMax - 1)]
                      fu[h] = maxOf(a, b)
                  }
                  if (parent[u] >= 0) for (h in 0 until hMax) s[parent[u]][h] += fu[h]
                  else root = fu[0]
              }
              return root.toInt()
          }
        `,
        swift: code`
          func maximumPoints(_ edges: [[Int]], _ coins: [Int], _ k: Int) -> Int {
              let n = coins.count, H = 15 // coins < 2^14, so 14 halvings already reach 0
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var parent = [Int](repeating: -1, count: n)
              var seen = [Bool](repeating: false, count: n)
              var order = [0]
              seen[0] = true
              var q = 0
              while q < order.count {
                  let u = order[q]
                  q += 1
                  for v in adj[u] where !seen[v] {
                      seen[v] = true
                      parent[v] = u
                      order.append(v)
                  }
              }
              var S = [Int](repeating: 0, count: n * H)
              var fu = [Int](repeating: 0, count: H)
              var root = 0
              for idx in stride(from: n - 1, through: 0, by: -1) {
                  let u = order[idx], c = coins[u]
                  for h in 0..<H {
                      let a = (c >> h) - k + S[u * H + h]
                      let b = (c >> (h + 1)) + S[u * H + min(h + 1, H - 1)]
                      fu[h] = max(a, b)
                  }
                  if parent[u] >= 0 {
                      for h in 0..<H { S[parent[u] * H + h] += fu[h] }
                  } else {
                      root = fu[0]
                  }
              }
              return root
          }
        `,
        rust: code`
          fn maximumPoints(edges: Vec<Vec<i32>>, coins: Vec<i32>, k: i32) -> i32 {
              let n = coins.len();
              const H: usize = 15; // coins < 2^14, so 14 halvings already reach 0
              let mut adj = vec![Vec::new(); n];
              for e in &edges {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let mut parent = vec![std::usize::MAX; n];
              let mut seen = vec![false; n];
              let mut order = vec![0usize];
              seen[0] = true;
              let mut q = 0;
              while q < order.len() {
                  let u = order[q];
                  q += 1;
                  for &v in &adj[u] {
                      if !seen[v] {
                          seen[v] = true;
                          parent[v] = u;
                          order.push(v);
                      }
                  }
              }
              let mut s = vec![0i64; n * H];
              let mut fu = [0i64; H];
              let mut root = 0i64;
              for idx in (0..n).rev() {
                  let u = order[idx];
                  let c = coins[u] as i64;
                  for h in 0..H {
                      let a = (c >> h) - k as i64 + s[u * H + h];
                      let b = (c >> (h + 1)) + s[u * H + std::cmp::min(h + 1, H - 1)];
                      fu[h] = std::cmp::max(a, b);
                  }
                  if parent[u] != std::usize::MAX {
                      for h in 0..H {
                          s[parent[u] * H + h] += fu[h];
                      }
                  } else {
                      root = fu[0];
                  }
              }
              root as i32
          }
        `,
        php: code`
          function maximumPoints($edges, $coins, $k) {
              $n = count($coins);
              $H = 15; // coins < 2^14, so 14 halvings already reach 0
              $adj = array_fill(0, $n, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              $parent = array_fill(0, $n, -1);
              $seen = array_fill(0, $n, false);
              $order = [0];
              $seen[0] = true;
              for ($q = 0; $q < count($order); $q++) {
                  $u = $order[$q];
                  foreach ($adj[$u] as $v) {
                      if (!$seen[$v]) { $seen[$v] = true; $parent[$v] = $u; $order[] = $v; }
                  }
              }
              $S = array_fill(0, $n * $H, 0);
              $fu = array_fill(0, $H, 0);
              $root = 0;
              for ($q = $n - 1; $q >= 0; $q--) {
                  $u = $order[$q];
                  $c = $coins[$u];
                  for ($h = 0; $h < $H; $h++) {
                      $a = ($c >> $h) - $k + $S[$u * $H + $h];
                      $b = ($c >> ($h + 1)) + $S[$u * $H + min($h + 1, $H - 1)];
                      $fu[$h] = $a > $b ? $a : $b;
                  }
                  if ($parent[$u] >= 0) {
                      for ($h = 0; $h < $H; $h++) $S[$parent[$u] * $H + $h] += $fu[$h];
                  } else {
                      $root = $fu[0];
                  }
              }
              return $root;
          }
        `,
        ruby: code`
          def maximumPoints(edges, coins, k)
            n = coins.length
            hh = 15 # coins < 2^14, so 14 halvings already reach 0
            adj = Array.new(n) { [] }
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
            end
            parent = Array.new(n, -1)
            seen = Array.new(n, false)
            order = [0]
            seen[0] = true
            q = 0
            while q < order.length
              u = order[q]
              q += 1
              adj[u].each do |v|
                next if seen[v]
                seen[v] = true
                parent[v] = u
                order << v
              end
            end
            s = Array.new(n) { Array.new(hh, 0) }
            root = 0
            order.reverse_each do |u|
              c = coins[u]
              su = s[u]
              fu = Array.new(hh) do |h|
                a = (c >> h) - k + su[h]
                b = (c >> (h + 1)) + su[h + 1 < hh ? h + 1 : hh - 1]
                a > b ? a : b
              end
              if parent[u] >= 0
                sp = s[parent[u]]
                hh.times { |h| sp[h] += fu[h] }
              else
                root = fu[0]
              end
            end
            root
          end
        `,
      },
    };
  })(),

  // ── Maximum Score After Applying Operations on a Tree (LC 2925) ──
  (() => {
    // keep(u) = the least value that must stay untaken in u's subtree so
    // every root-to-leaf path keeps a non-zero sum. Checked offline against
    // all 2^n subsets for n <= 10.
    const ref = (edges: number[][], values: number[]) => {
      const n = values.length;
      const adj: number[][] = Array.from({ length: n }, () => []);
      for (const [a, b] of edges) { adj[a].push(b); adj[b].push(a); }
      const keep = (u: number, p: number): number => {
        let s = 0, leaf = true;
        for (const v of adj[u]) if (v !== p) { leaf = false; s += keep(v, u); }
        return leaf ? values[u] : Math.min(values[u], s);
      };
      return values.reduce((a, b) => a + b, 0) - keep(0, -1);
    };
    const ex1 = { e: [[0, 1], [0, 2], [0, 3], [2, 4], [4, 5]], v: [5, 2, 5, 2, 1, 1] };
    const ex2 = { e: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]], v: [20, 10, 9, 7, 4, 3, 5] };
    const ex3 = { e: [[0, 1]], v: [3, 7] };
    return {
      slug: "maximum-score-after-applying-operations-on-a-tree",
      title: "Maximum Score After Applying Operations on a Tree",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Tree", "Depth-First Search", "Amazon", "Google"],
      signature: {
        funcName: "maximumScoreAfterOperations",
        params: [{ name: "edges", type: "int[][]" as const }, { name: "values", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "An undirected tree has `n` nodes labelled `0` to `n - 1` and is rooted at node `0`; `edges[i] = [a, b]` is an edge. Each node carries a positive value `values[i]`. Your score starts at `0`.\n\nIn one operation you pick a node `i`, add `values[i]` to your score and set `values[i]` to `0`. You may perform any number of operations, but afterwards the tree must stay **healthy**: the sum of values on every path from the root to a leaf must be non-zero.\n\nReturn the **maximum** score you can reach while keeping the tree healthy.",
        [
          { in: "edges = [[0,1],[0,2],[0,3],[2,4],[4,5]], values = [5,2,5,2,1,1]", out: String(ref(ex1.e, ex1.v)), note: "Take every node except the root: each path still contains the root's 5. The score is 2 + 5 + 2 + 1 + 1 = 11." },
          { in: "edges = [[0,1],[0,2],[1,3],[1,4],[2,5],[2,6]], values = [20,10,9,7,4,3,5]", out: String(ref(ex2.e, ex2.v)), note: "Leave node 1 (value 10) untaken, which protects both leaves under it, and leave the two leaves under node 2 (3 + 5 = 8, cheaper than node 2's 9). Everything else — 20 + 9 + 7 + 4 = 40 — is taken." },
          { in: "edges = [[0,1]], values = [3,7]", out: String(ref(ex3.e, ex3.v)), note: "One path, 0 → 1. Keep the cheaper node: take 7, leave 3." },
        ],
        ["2 <= n <= 2 * 10^4", "edges.length == n - 1", "0 <= edges[i][0], edges[i][1] < n", "1 <= values[i] <= 10^5 (reduced from 10^9 so the score fits a 32-bit integer)", "The edges form a tree"]),
      hints: [
        "Instead of maximising what you take, minimise what you must leave behind: score = total − (value kept).",
        "A root-to-leaf path is safe as soon as one node on it is left untaken. For a subtree, either its root is left untaken (all paths through it are safe at once), or every child subtree must be made safe on its own.",
        "`keep(leaf) = values[leaf]`; for an inner node `keep(u) = min(values[u], Σ keep(child))`. The answer is `total − keep(0)`.",
      ],
      editorial: explain({
        idea: "Flip the objective: maximising the taken sum is the same as minimising the untaken sum, subject to every root-to-leaf path keeping at least one untaken node (values are positive, so a path is non-zero exactly when something on it remains).",
        steps: [
          "Root the tree at 0 and get a parent-before-child order with BFS.",
          "Process nodes in reverse order. For a leaf (no children) `keep = values[leaf]` — its own path ends there, so it must stay.",
          "For an inner node `keep(u) = min(values[u], sum of keep over its children)`: either leave `u` itself, which protects every path below it, or take `u` and protect each child subtree separately.",
          "Return `sum(values) − keep(0)`.",
        ],
        why: "Every root-to-leaf path through `u` continues into exactly one child subtree. Leaving `u` untaken protects all of them, and once that is done the cheapest choice below is to take everything. Taking `u` means each child subtree must protect its own paths, independently, at cost `keep(child)`. Those are the only two options, so the minimum is exact.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "A leaf must be kept if every ancestor was taken — `keep(leaf)` is its value, not 0.",
          "The root is never a leaf here (`n ≥ 2`), even when it has a single child.",
          "Sums can pass 2^31 in the original constraints; with values up to 10^5 here they still need care in intermediate totals — keep them 64-bit.",
        ],
      }),
      examples: [
        { input: `${fmtIntMat(ex1.e)}\n${fmtIntArr(ex1.v)}`, expectedOutput: String(ref(ex1.e, ex1.v)) },
        { input: `${fmtIntMat(ex2.e)}\n${fmtIntArr(ex2.v)}`, expectedOutput: String(ref(ex2.e, ex2.v)) },
        { input: `${fmtIntMat(ex3.e)}\n${fmtIntArr(ex3.v)}`, expectedOutput: String(ref(ex3.e, ex3.v)) },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [3, 8, 20, 50]));
        const edges = randomTree(rng, n);
        const top = pick(rng, [1, 10, 1000, 100000]);
        const values = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: `${fmtIntMat(edges)}\n${fmtIntArr(values)}`, expectedOutput: String(ref(edges, values)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumScoreAfterOperations(edges: List[List[int]], values: List[int]) -> int:
              n = len(values)
              adj = [[] for _ in range(n)]
              for a, b in edges:
                  adj[a].append(b)
                  adj[b].append(a)
              parent = [-1] * n
              order = [0]
              seen = [False] * n
              seen[0] = True
              i = 0
              while i < len(order):
                  u = order[i]
                  i += 1
                  for v in adj[u]:
                      if not seen[v]:
                          seen[v] = True
                          parent[v] = u
                          order.append(v)
              child_sum = [0] * n
              has_child = [False] * n
              keep = [0] * n
              for u in reversed(order):
                  keep[u] = min(values[u], child_sum[u]) if has_child[u] else values[u]
                  p = parent[u]
                  if p >= 0:
                      child_sum[p] += keep[u]
                      has_child[p] = True
              return sum(values) - keep[0]
        `,
        javascript: code`
          var maximumScoreAfterOperations = function(edges, values) {
              var n = values.length;
              var adj = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var i = 0; i < edges.length; i++) {
                  adj[edges[i][0]].push(edges[i][1]);
                  adj[edges[i][1]].push(edges[i][0]);
              }
              var parent = new Array(n).fill(-1), seen = new Array(n).fill(false), order = [0];
              seen[0] = true;
              for (var q = 0; q < order.length; q++) {
                  var u = order[q];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (!seen[v]) { seen[v] = true; parent[v] = u; order.push(v); }
                  }
              }
              var childSum = new Array(n).fill(0), hasChild = new Array(n).fill(false), keep = new Array(n).fill(0);
              var total = 0;
              for (var q = n - 1; q >= 0; q--) {
                  var u = order[q];
                  total += values[u];
                  keep[u] = hasChild[u] ? Math.min(values[u], childSum[u]) : values[u];
                  if (parent[u] >= 0) { childSum[parent[u]] += keep[u]; hasChild[parent[u]] = true; }
              }
              return total - keep[0];
          };
        `,
        typescript: code`
          function maximumScoreAfterOperations(edges: number[][], values: number[]): number {
              var n = values.length;
              var adj: number[][] = [];
              for (var i = 0; i < n; i++) adj.push([]);
              for (var i = 0; i < edges.length; i++) {
                  adj[edges[i][0]].push(edges[i][1]);
                  adj[edges[i][1]].push(edges[i][0]);
              }
              var parent: number[] = [], seen: boolean[] = [], order: number[] = [0];
              var childSum: number[] = [], hasChild: boolean[] = [], keep: number[] = [];
              for (var i = 0; i < n; i++) { parent.push(-1); seen.push(false); childSum.push(0); hasChild.push(false); keep.push(0); }
              seen[0] = true;
              for (var q = 0; q < order.length; q++) {
                  var u = order[q];
                  for (var j = 0; j < adj[u].length; j++) {
                      var v = adj[u][j];
                      if (!seen[v]) { seen[v] = true; parent[v] = u; order.push(v); }
                  }
              }
              var total = 0;
              for (var q = n - 1; q >= 0; q--) {
                  var u = order[q];
                  total += values[u];
                  keep[u] = hasChild[u] ? Math.min(values[u], childSum[u]) : values[u];
                  if (parent[u] >= 0) { childSum[parent[u]] += keep[u]; hasChild[parent[u]] = true; }
              }
              return total - keep[0];
          }
        `,
        java: code`
          public static int maximumScoreAfterOperations(int[][] edges, int[] values) {
              int n = values.length;
              List<List<Integer>> adj = new ArrayList<>();
              for (int i = 0; i < n; i++) adj.add(new ArrayList<>());
              for (int[] e : edges) { adj.get(e[0]).add(e[1]); adj.get(e[1]).add(e[0]); }
              int[] parent = new int[n], order = new int[n];
              boolean[] seen = new boolean[n];
              Arrays.fill(parent, -1);
              int tail = 0;
              order[tail++] = 0;
              seen[0] = true;
              for (int q = 0; q < tail; q++) {
                  int u = order[q];
                  for (int v : adj.get(u)) if (!seen[v]) { seen[v] = true; parent[v] = u; order[tail++] = v; }
              }
              long[] childSum = new long[n], keep = new long[n];
              boolean[] hasChild = new boolean[n];
              long total = 0;
              for (int q = n - 1; q >= 0; q--) {
                  int u = order[q];
                  total += values[u];
                  keep[u] = hasChild[u] ? Math.min(values[u], childSum[u]) : values[u];
                  if (parent[u] >= 0) { childSum[parent[u]] += keep[u]; hasChild[parent[u]] = true; }
              }
              return (int) (total - keep[0]);
          }
        `,
        cpp: code`
          int maximumScoreAfterOperations(vector<vector<int>>& edges, vector<int>& values) {
              int n = values.size();
              vector<vector<int>> adj(n);
              for (auto& e : edges) { adj[e[0]].push_back(e[1]); adj[e[1]].push_back(e[0]); }
              vector<int> parent(n, -1), order;
              vector<bool> seen(n, false);
              order.push_back(0);
              seen[0] = true;
              for (int q = 0; q < (int) order.size(); q++) {
                  int u = order[q];
                  for (int v : adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; order.push_back(v); }
              }
              vector<long long> childSum(n, 0), keep(n, 0);
              vector<bool> hasChild(n, false);
              long long total = 0;
              for (int q = n - 1; q >= 0; q--) {
                  int u = order[q];
                  total += values[u];
                  keep[u] = hasChild[u] ? min((long long) values[u], childSum[u]) : values[u];
                  if (parent[u] >= 0) { childSum[parent[u]] += keep[u]; hasChild[parent[u]] = true; }
              }
              return (int) (total - keep[0]);
          }
        `,
        c: code`
          int maximumScoreAfterOperations(int** edges, int edgesSize, int* edgesColSize, int* values, int valuesSize) {
              int n = valuesSize;
              int* start = (int*) calloc((size_t) n + 1, sizeof(int));
              for (int i = 0; i < edgesSize; i++) { start[edges[i][0] + 1]++; start[edges[i][1] + 1]++; }
              for (int i = 0; i < n; i++) start[i + 1] += start[i];
              int* fillAt = (int*) malloc(sizeof(int) * (n + 1));
              for (int i = 0; i <= n; i++) fillAt[i] = start[i];
              int* adj = (int*) malloc(sizeof(int) * (2 * edgesSize + 1));
              for (int i = 0; i < edgesSize; i++) {
                  adj[fillAt[edges[i][0]]++] = edges[i][1];
                  adj[fillAt[edges[i][1]]++] = edges[i][0];
              }
              int* parent = (int*) malloc(sizeof(int) * n);
              int* order = (int*) malloc(sizeof(int) * n);
              char* seen = (char*) calloc((size_t) n, 1);
              char* hasChild = (char*) calloc((size_t) n, 1);
              long long* childSum = (long long*) calloc((size_t) n, sizeof(long long));
              long long* keep = (long long*) calloc((size_t) n, sizeof(long long));
              for (int i = 0; i < n; i++) parent[i] = -1;
              int tail = 0;
              order[tail++] = 0;
              seen[0] = 1;
              for (int q = 0; q < tail; q++) {
                  int u = order[q];
                  for (int j = start[u]; j < start[u + 1]; j++) {
                      int v = adj[j];
                      if (!seen[v]) { seen[v] = 1; parent[v] = u; order[tail++] = v; }
                  }
              }
              long long total = 0;
              for (int q = n - 1; q >= 0; q--) {
                  int u = order[q];
                  total += values[u];
                  if (hasChild[u]) keep[u] = values[u] < childSum[u] ? values[u] : childSum[u];
                  else keep[u] = values[u];
                  if (parent[u] >= 0) { childSum[parent[u]] += keep[u]; hasChild[parent[u]] = 1; }
              }
              int ans = (int) (total - keep[0]);
              free(start); free(fillAt); free(adj); free(parent); free(order);
              free(seen); free(hasChild); free(childSum); free(keep);
              return ans;
          }
        `,
        csharp: code`
          public static int MaximumScoreAfterOperations(int[][] edges, int[] values)
          {
              int n = values.Length;
              var adj = new List<int>[n];
              for (int i = 0; i < n; i++) adj[i] = new List<int>();
              foreach (var e in edges) { adj[e[0]].Add(e[1]); adj[e[1]].Add(e[0]); }
              int[] parent = new int[n], order = new int[n];
              bool[] seen = new bool[n], hasChild = new bool[n];
              for (int i = 0; i < n; i++) parent[i] = -1;
              int tail = 0;
              order[tail++] = 0;
              seen[0] = true;
              for (int q = 0; q < tail; q++)
              {
                  int u = order[q];
                  foreach (int v in adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; order[tail++] = v; }
              }
              long[] childSum = new long[n], keep = new long[n];
              long total = 0;
              for (int q = n - 1; q >= 0; q--)
              {
                  int u = order[q];
                  total += values[u];
                  keep[u] = hasChild[u] ? Math.Min(values[u], childSum[u]) : values[u];
                  if (parent[u] >= 0) { childSum[parent[u]] += keep[u]; hasChild[parent[u]] = true; }
              }
              return (int) (total - keep[0]);
          }
        `,
        go: code`
          func maximumScoreAfterOperations(edges [][]int, values []int) int {
              n := len(values)
              adj := make([][]int, n)
              for _, e := range edges {
                  adj[e[0]] = append(adj[e[0]], e[1])
                  adj[e[1]] = append(adj[e[1]], e[0])
              }
              parent := make([]int, n)
              for i := range parent {
                  parent[i] = -1
              }
              seen := make([]bool, n)
              order := []int{0}
              seen[0] = true
              for q := 0; q < len(order); q++ {
                  u := order[q]
                  for _, v := range adj[u] {
                      if !seen[v] {
                          seen[v] = true
                          parent[v] = u
                          order = append(order, v)
                      }
                  }
              }
              childSum := make([]int, n)
              keep := make([]int, n)
              hasChild := make([]bool, n)
              total := 0
              for q := n - 1; q >= 0; q-- {
                  u := order[q]
                  total += values[u]
                  keep[u] = values[u]
                  if hasChild[u] && childSum[u] < values[u] {
                      keep[u] = childSum[u]
                  }
                  if parent[u] >= 0 {
                      childSum[parent[u]] += keep[u]
                      hasChild[parent[u]] = true
                  }
              }
              return total - keep[0]
          }
        `,
        kotlin: code`
          fun maximumScoreAfterOperations(edges: Array<IntArray>, values: IntArray): Int {
              val n = values.size
              val adj = Array(n) { ArrayList<Int>() }
              for (e in edges) { adj[e[0]].add(e[1]); adj[e[1]].add(e[0]) }
              val parent = IntArray(n) { -1 }
              val order = IntArray(n)
              val seen = BooleanArray(n)
              var tail = 0
              order[tail++] = 0
              seen[0] = true
              var q = 0
              while (q < tail) {
                  val u = order[q++]
                  for (v in adj[u]) if (!seen[v]) { seen[v] = true; parent[v] = u; order[tail++] = v }
              }
              val childSum = LongArray(n)
              val keep = LongArray(n)
              val hasChild = BooleanArray(n)
              var total = 0L
              for (idx in n - 1 downTo 0) {
                  val u = order[idx]
                  total += values[u]
                  keep[u] = if (hasChild[u]) minOf(values[u].toLong(), childSum[u]) else values[u].toLong()
                  if (parent[u] >= 0) { childSum[parent[u]] += keep[u]; hasChild[parent[u]] = true }
              }
              return (total - keep[0]).toInt()
          }
        `,
        swift: code`
          func maximumScoreAfterOperations(_ edges: [[Int]], _ values: [Int]) -> Int {
              let n = values.count
              var adj = [[Int]](repeating: [], count: n)
              for e in edges { adj[e[0]].append(e[1]); adj[e[1]].append(e[0]) }
              var parent = [Int](repeating: -1, count: n)
              var seen = [Bool](repeating: false, count: n)
              var order = [0]
              seen[0] = true
              var q = 0
              while q < order.count {
                  let u = order[q]
                  q += 1
                  for v in adj[u] where !seen[v] {
                      seen[v] = true
                      parent[v] = u
                      order.append(v)
                  }
              }
              var childSum = [Int](repeating: 0, count: n)
              var keep = [Int](repeating: 0, count: n)
              var hasChild = [Bool](repeating: false, count: n)
              var total = 0
              for idx in stride(from: n - 1, through: 0, by: -1) {
                  let u = order[idx]
                  total += values[u]
                  keep[u] = hasChild[u] ? min(values[u], childSum[u]) : values[u]
                  if parent[u] >= 0 {
                      childSum[parent[u]] += keep[u]
                      hasChild[parent[u]] = true
                  }
              }
              return total - keep[0]
          }
        `,
        rust: code`
          fn maximumScoreAfterOperations(edges: Vec<Vec<i32>>, values: Vec<i32>) -> i32 {
              let n = values.len();
              let mut adj = vec![Vec::new(); n];
              for e in &edges {
                  adj[e[0] as usize].push(e[1] as usize);
                  adj[e[1] as usize].push(e[0] as usize);
              }
              let mut parent = vec![std::usize::MAX; n];
              let mut seen = vec![false; n];
              let mut order = vec![0usize];
              seen[0] = true;
              let mut q = 0;
              while q < order.len() {
                  let u = order[q];
                  q += 1;
                  for &v in &adj[u] {
                      if !seen[v] {
                          seen[v] = true;
                          parent[v] = u;
                          order.push(v);
                      }
                  }
              }
              let mut child_sum = vec![0i64; n];
              let mut keep = vec![0i64; n];
              let mut has_child = vec![false; n];
              let mut total = 0i64;
              for idx in (0..n).rev() {
                  let u = order[idx];
                  let v = values[u] as i64;
                  total += v;
                  keep[u] = if has_child[u] { std::cmp::min(v, child_sum[u]) } else { v };
                  if parent[u] != std::usize::MAX {
                      child_sum[parent[u]] += keep[u];
                      has_child[parent[u]] = true;
                  }
              }
              (total - keep[0]) as i32
          }
        `,
        php: code`
          function maximumScoreAfterOperations($edges, $values) {
              $n = count($values);
              $adj = array_fill(0, $n, []);
              foreach ($edges as $e) { $adj[$e[0]][] = $e[1]; $adj[$e[1]][] = $e[0]; }
              $parent = array_fill(0, $n, -1);
              $seen = array_fill(0, $n, false);
              $order = [0];
              $seen[0] = true;
              for ($q = 0; $q < count($order); $q++) {
                  $u = $order[$q];
                  foreach ($adj[$u] as $v) {
                      if (!$seen[$v]) { $seen[$v] = true; $parent[$v] = $u; $order[] = $v; }
                  }
              }
              $childSum = array_fill(0, $n, 0);
              $hasChild = array_fill(0, $n, false);
              $keep = array_fill(0, $n, 0);
              $total = 0;
              for ($q = $n - 1; $q >= 0; $q--) {
                  $u = $order[$q];
                  $total += $values[$u];
                  $keep[$u] = $hasChild[$u] ? min($values[$u], $childSum[$u]) : $values[$u];
                  if ($parent[$u] >= 0) { $childSum[$parent[$u]] += $keep[$u]; $hasChild[$parent[$u]] = true; }
              }
              return $total - $keep[0];
          }
        `,
        ruby: code`
          def maximumScoreAfterOperations(edges, values)
            n = values.length
            adj = Array.new(n) { [] }
            edges.each do |a, b|
              adj[a] << b
              adj[b] << a
            end
            parent = Array.new(n, -1)
            seen = Array.new(n, false)
            order = [0]
            seen[0] = true
            q = 0
            while q < order.length
              u = order[q]
              q += 1
              adj[u].each do |v|
                next if seen[v]
                seen[v] = true
                parent[v] = u
                order << v
              end
            end
            child_sum = Array.new(n, 0)
            has_child = Array.new(n, false)
            keep = Array.new(n, 0)
            order.reverse_each do |u|
              keep[u] = has_child[u] ? [values[u], child_sum[u]].min : values[u]
              if parent[u] >= 0
                child_sum[parent[u]] += keep[u]
                has_child[parent[u]] = true
              end
            end
            values.sum - keep[0]
          end
        `,
      },
    };
  })(),

  // ── Number of Strings Which Can Be Rearranged to Contain Substring (LC 2930) ──
  (() => {
    const MOD = 1000000007n;
    // Up to n = 300 the reference is a plain 12-state DP over (has l, e count
    // capped at 2, has t); beyond that the inclusion–exclusion formula in
    // BigInt, which the DP pins on every smaller n.
    const ref = (n: number): number => {
      if (n <= 300) {
        let st = new Array(12).fill(0n);
        st[0] = 1n;
        const id = (l: number, e: number, t: number) => (l * 3 + e) * 2 + t;
        for (let step = 0; step < n; step++) {
          const nx = new Array(12).fill(0n);
          for (let l = 0; l < 2; l++) for (let e = 0; e < 3; e++) for (let t = 0; t < 2; t++) {
            const c = st[id(l, e, t)];
            if (c === 0n) continue;
            nx[id(1, e, t)] += c;
            nx[id(l, Math.min(e + 1, 2), t)] += c;
            nx[id(l, e, 1)] += c;
            nx[id(l, e, t)] += 23n * c;
          }
          st = nx.map((v) => v % MOD);
        }
        return Number(st[id(1, 2, 1)]);
      }
      const pw = (b: bigint, e: number) => {
        let r = 1n, x = b % MOD, k = e;
        while (k > 0) { if (k & 1) r = (r * x) % MOD; x = (x * x) % MOD; k >>= 1; }
        return r;
      };
      const N = BigInt(n);
      const bad = (3n * pw(25n, n) + N * pw(25n, n - 1)) - (3n * pw(24n, n) + 2n * N * pw(24n, n - 1)) + (pw(23n, n) + N * pw(23n, n - 1));
      return Number((((pw(26n, n) - bad) % MOD) + MOD) % MOD);
    };
    return {
      slug: "number-of-strings-which-can-be-rearranged-to-contain-substring",
      title: "Number of Strings Which Can Be Rearranged to Contain Substring",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Dynamic Programming", "Combinatorics", "Google"],
      signature: { funcName: "stringCount", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A string of lowercase English letters is **good** if its characters can be rearranged so that the result contains `\"leet\"` as a contiguous substring. For example `\"lteer\"` is good (rearrange it to `\"leetr\"`), while `\"letl\"` is not — it has only one `e`.\n\nGiven an integer `n`, return the number of good strings of length `n`. Since the answer may be large, return it **modulo** `10^9 + 7`.",
        [
          { in: "n = 4", out: String(ref(4)), note: "The good strings of length 4 are exactly the 12 arrangements of the letters l, e, e, t (4! / 2!)." },
          { in: "n = 10", out: String(ref(10)) },
          { in: "n = 3", out: String(ref(3)), note: "Three letters cannot hold four required characters." },
        ],
        ["1 <= n <= 10^5"]),
      hints: [
        "Order does not matter at all: a string is good exactly when it has at least one `l`, at least two `e`s and at least one `t`.",
        "Count the complement. Let A = no `l`, B = fewer than two `e`s, C = no `t`, and apply inclusion–exclusion to `|A ∪ B ∪ C|`.",
        "`|B| = 25^n + n · 25^(n-1)` (zero `e`s, or exactly one in one of `n` places); intersections shrink the alphabet the same way. Alternatively, run a 12-state DP over (has l, e count capped at 2, has t).",
      ],
      editorial: explain({
        idea: "Since characters can be rearranged freely, a string is good exactly when its letter counts include `l ≥ 1`, `e ≥ 2`, `t ≥ 1`. Count all `26^n` strings and subtract the bad ones with inclusion–exclusion over the three ways to fail.",
        steps: [
          "Let A = strings with no `l`, B = strings with at most one `e`, C = strings with no `t`.",
          "`|A| = |C| = 25^n`, `|B| = 25^n + n·25^(n-1)`; `|A∩C| = 24^n`, `|A∩B| = |B∩C| = 24^n + n·24^(n-1)`; `|A∩B∩C| = 23^n + n·23^(n-1)`.",
          "Bad = `|A| + |B| + |C| − |A∩B| − |A∩C| − |B∩C| + |A∩B∩C|`.",
          "Return `(26^n − bad) mod (10^9 + 7)`, computing every power by fast exponentiation and keeping the result non-negative.",
        ],
        why: "Inclusion–exclusion counts each bad string exactly once. For the `e` condition, \"at most one `e`\" splits into no `e` at all (25 letters everywhere) and exactly one `e` (choose its position, 25 letters elsewhere); each extra forbidden letter in an intersection removes one more letter from the alphabet.",
        time: "O(log n)",
        space: "O(1)",
        pitfalls: [
          "`n·25^(n-1)` mod p multiplies two numbers that need 64-bit room (or BigInt / a split multiply in JavaScript).",
          "Subtraction under the modulus can be negative — add the modulus back.",
          "For `n < 4` the answer is 0; the formula gives that automatically, but an off-by-one in the `e` term will not.",
        ],
      }),
      examples: [
        { input: "4", expectedOutput: String(ref(4)) },
        { input: "10", expectedOutput: String(ref(10)) },
        { input: "3", expectedOutput: String(ref(3)) },
      ],
      gen: (rng: Rng) => {
        const n = pick(rng, [ri(rng, 1, 8), ri(rng, 1, 300), ri(rng, 1, 100000), 100000]);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: code`
          def stringCount(n: int) -> int:
              MOD = 10**9 + 7

              def p(b, e):
                  return pow(b, e, MOD)

              bad = (3 * p(25, n) + n * p(25, n - 1)) \
                  - (3 * p(24, n) + 2 * n * p(24, n - 1)) \
                  + (p(23, n) + n * p(23, n - 1))
              return (p(26, n) - bad) % MOD
        `,
        javascript: code`
          var stringCount = function(n) {
              var MOD = 1000000007;
              // a * b mod MOD with every partial product below 2^53.
              var mulmod = function(a, b) {
                  return ((a * (b >>> 16)) % MOD * 65536 + a * (b & 65535)) % MOD;
              };
              var p = function(b, e) {
                  var r = 1, x = b % MOD;
                  while (e > 0) {
                      if (e & 1) r = mulmod(r, x);
                      x = mulmod(x, x);
                      e >>= 1;
                  }
                  return r;
              };
              var bad = (3 * p(25, n) + mulmod(n, p(25, n - 1))) % MOD;
              bad = (bad - (3 * p(24, n) + mulmod(2 * n, p(24, n - 1))) % MOD + MOD) % MOD;
              bad = (bad + p(23, n) + mulmod(n, p(23, n - 1))) % MOD;
              return (p(26, n) - bad + MOD) % MOD;
          };
        `,
        typescript: code`
          var MOD_LEET = 1000000007;

          // a * b mod MOD with every partial product below 2^53.
          function mulmodLeet(a: number, b: number): number {
              return ((a * (b >>> 16)) % MOD_LEET * 65536 + a * (b & 65535)) % MOD_LEET;
          }

          function powLeet(b: number, e: number): number {
              var r = 1, x = b % MOD_LEET;
              while (e > 0) {
                  if (e & 1) r = mulmodLeet(r, x);
                  x = mulmodLeet(x, x);
                  e >>= 1;
              }
              return r;
          }

          function stringCount(n: number): number {
              var M = MOD_LEET;
              var bad = (3 * powLeet(25, n) + mulmodLeet(n, powLeet(25, n - 1))) % M;
              bad = (bad - (3 * powLeet(24, n) + mulmodLeet(2 * n, powLeet(24, n - 1))) % M + M) % M;
              bad = (bad + powLeet(23, n) + mulmodLeet(n, powLeet(23, n - 1))) % M;
              return (powLeet(26, n) - bad + M) % M;
          }
        `,
        java: code`
          static final long MOD = 1000000007L;

          static long pw(long b, long e) {
              long r = 1, x = b % MOD;
              while (e > 0) {
                  if ((e & 1) == 1) r = r * x % MOD;
                  x = x * x % MOD;
                  e >>= 1;
              }
              return r;
          }

          public static int stringCount(int n) {
              long bad = (3 * pw(25, n) + (long) n * pw(25, n - 1)) % MOD;
              bad = (bad - (3 * pw(24, n) + 2L * n % MOD * pw(24, n - 1)) % MOD + MOD) % MOD;
              bad = (bad + pw(23, n) + (long) n * pw(23, n - 1)) % MOD;
              return (int) ((pw(26, n) - bad + MOD) % MOD);
          }
        `,
        cpp: code`
          const long long MOD = 1000000007LL;

          long long pw(long long b, long long e) {
              long long r = 1, x = b % MOD;
              while (e > 0) {
                  if (e & 1) r = r * x % MOD;
                  x = x * x % MOD;
                  e >>= 1;
              }
              return r;
          }

          int stringCount(int n) {
              long long bad = (3 * pw(25, n) + (long long) n * pw(25, n - 1)) % MOD;
              bad = (bad - (3 * pw(24, n) + 2LL * n % MOD * pw(24, n - 1)) % MOD + MOD) % MOD;
              bad = (bad + pw(23, n) + (long long) n * pw(23, n - 1)) % MOD;
              return (int) ((pw(26, n) - bad + MOD) % MOD);
          }
        `,
        c: code`
          static const long long MOD = 1000000007LL;

          static long long pw(long long b, long long e) {
              long long r = 1, x = b % MOD;
              while (e > 0) {
                  if (e & 1) r = r * x % MOD;
                  x = x * x % MOD;
                  e >>= 1;
              }
              return r;
          }

          int stringCount(int n) {
              long long bad = (3 * pw(25, n) + (long long) n * pw(25, n - 1)) % MOD;
              bad = (bad - (3 * pw(24, n) + 2LL * n % MOD * pw(24, n - 1)) % MOD + MOD) % MOD;
              bad = (bad + pw(23, n) + (long long) n * pw(23, n - 1)) % MOD;
              return (int) ((pw(26, n) - bad + MOD) % MOD);
          }
        `,
        csharp: code`
          const long MOD = 1000000007L;

          static long Pw(long b, long e)
          {
              long r = 1, x = b % MOD;
              while (e > 0)
              {
                  if ((e & 1) == 1) r = r * x % MOD;
                  x = x * x % MOD;
                  e >>= 1;
              }
              return r;
          }

          public static int StringCount(int n)
          {
              long bad = (3 * Pw(25, n) + (long) n * Pw(25, n - 1)) % MOD;
              bad = (bad - (3 * Pw(24, n) + 2L * n % MOD * Pw(24, n - 1)) % MOD + MOD) % MOD;
              bad = (bad + Pw(23, n) + (long) n * Pw(23, n - 1)) % MOD;
              return (int) ((Pw(26, n) - bad + MOD) % MOD);
          }
        `,
        go: code`
          const leetMod = 1000000007

          func leetPow(b int, e int) int {
              r, x := 1, b%leetMod
              for e > 0 {
                  if e&1 == 1 {
                      r = r * x % leetMod
                  }
                  x = x * x % leetMod
                  e >>= 1
              }
              return r
          }

          func stringCount(n int) int {
              bad := (3*leetPow(25, n) + n*leetPow(25, n-1)) % leetMod
              bad = (bad - (3*leetPow(24, n)+2*n%leetMod*leetPow(24, n-1))%leetMod + leetMod) % leetMod
              bad = (bad + leetPow(23, n) + n*leetPow(23, n-1)) % leetMod
              return (leetPow(26, n) - bad + leetMod) % leetMod
          }
        `,
        kotlin: code`
          const val MOD = 1000000007L

          fun pw(b: Long, e: Int): Long {
              var r = 1L
              var x = b % MOD
              var k = e
              while (k > 0) {
                  if (k and 1 == 1) r = r * x % MOD
                  x = x * x % MOD
                  k = k shr 1
              }
              return r
          }

          fun stringCount(n: Int): Int {
              val nl = n.toLong()
              var bad = (3 * pw(25, n) + nl * pw(25, n - 1)) % MOD
              bad = (bad - (3 * pw(24, n) + 2 * nl % MOD * pw(24, n - 1)) % MOD + MOD) % MOD
              bad = (bad + pw(23, n) + nl * pw(23, n - 1)) % MOD
              return ((pw(26, n) - bad + MOD) % MOD).toInt()
          }
        `,
        swift: code`
          let leetMod = 1000000007

          func leetPow(_ b: Int, _ e: Int) -> Int {
              var r = 1, x = b % leetMod, k = e
              while k > 0 {
                  if k & 1 == 1 { r = r * x % leetMod }
                  x = x * x % leetMod
                  k >>= 1
              }
              return r
          }

          func stringCount(_ n: Int) -> Int {
              var bad = (3 * leetPow(25, n) + n * leetPow(25, n - 1)) % leetMod
              bad = (bad - (3 * leetPow(24, n) + 2 * n % leetMod * leetPow(24, n - 1)) % leetMod + leetMod) % leetMod
              bad = (bad + leetPow(23, n) + n * leetPow(23, n - 1)) % leetMod
              return (leetPow(26, n) - bad + leetMod) % leetMod
          }
        `,
        rust: code`
          const MOD: i64 = 1_000_000_007;

          fn pw(b: i64, e: i64) -> i64 {
              let (mut r, mut x, mut k) = (1i64, b % MOD, e);
              while k > 0 {
                  if k & 1 == 1 {
                      r = r * x % MOD;
                  }
                  x = x * x % MOD;
                  k >>= 1;
              }
              r
          }

          fn stringCount(n: i32) -> i32 {
              let n = n as i64;
              let mut bad = (3 * pw(25, n) + n * pw(25, n - 1)) % MOD;
              bad = (bad - (3 * pw(24, n) + 2 * n % MOD * pw(24, n - 1)) % MOD + MOD) % MOD;
              bad = (bad + pw(23, n) + n * pw(23, n - 1)) % MOD;
              ((pw(26, n) - bad + MOD) % MOD) as i32
          }
        `,
        php: code`
          function leetPow($b, $e) {
              $M = 1000000007;
              $r = 1;
              $x = $b % $M;
              while ($e > 0) {
                  if ($e & 1) $r = $r * $x % $M;
                  $x = $x * $x % $M;
                  $e >>= 1;
              }
              return $r;
          }

          function stringCount($n) {
              $M = 1000000007;
              $bad = (3 * leetPow(25, $n) + $n * leetPow(25, $n - 1)) % $M;
              $bad = ($bad - (3 * leetPow(24, $n) + 2 * $n % $M * leetPow(24, $n - 1)) % $M + $M) % $M;
              $bad = ($bad + leetPow(23, $n) + $n * leetPow(23, $n - 1)) % $M;
              return (leetPow(26, $n) - $bad + $M) % $M;
          }
        `,
        ruby: code`
          def stringCount(n)
            m = 1_000_000_007
            bad = (3 * 25.pow(n, m) + n * 25.pow(n - 1, m)) -
                  (3 * 24.pow(n, m) + 2 * n * 24.pow(n - 1, m)) +
                  (23.pow(n, m) + n * 23.pow(n - 1, m))
            (26.pow(n, m) - bad) % m
          end
        `,
      },
    };
  })(),

  // ── Find Maximum Non-decreasing Array Length (LC 2945) ──────────
  (() => {
    // O(n^2) reference: for every prefix, the most pieces, and among those
    // the smallest last piece. Checked offline against all 2^(n-1) splits.
    const ref = (a: number[]) => {
      const n = a.length;
      const pre = [0];
      for (const v of a) pre.push(pre[pre.length - 1] + v);
      const dp = [0], last = [0];
      for (let i = 1; i <= n; i++) {
        let bd = -1, bl = 0;
        for (let j = 0; j < i; j++) {
          if (last[j] > pre[i] - pre[j]) continue;
          const d = dp[j] + 1, l = pre[i] - pre[j];
          if (d > bd || (d === bd && l < bl)) { bd = d; bl = l; }
        }
        dp.push(bd);
        last.push(bl);
      }
      return dp[n];
    };
    return {
      slug: "find-maximum-non-decreasing-array-length",
      title: "Find Maximum Non-decreasing Array Length",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Dynamic Programming", "Stack", "Queue", "Monotonic Stack", "Monotonic Queue", "Google", "Amazon"],
      signature: { funcName: "findMaximumLength", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums`. In one operation you choose a contiguous subarray and replace it with a single element equal to its sum — for example `[1,3,5,6]` can become `[4,5,6]` by merging `[1,3]`. You may perform any number of operations.\n\nReturn the **maximum** length of a **non-decreasing** array you can end up with.",
        [
          { in: "nums = [5,2,2]", out: String(ref([5, 2, 2])), note: "[5,4] and [7,2] are not non-decreasing; merging everything gives [9]. No length-2 result works." },
          { in: "nums = [1,2,3,4]", out: String(ref([1, 2, 3, 4])), note: "Already non-decreasing." },
          { in: "nums = [4,3,2,6]", out: String(ref([4, 3, 2, 6])), note: "Merge [3,2] into 5 to get [4,5,6]." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^5"]),
      hints: [
        "The final array is a split of `nums` into consecutive pieces whose sums are non-decreasing. Maximise the number of pieces.",
        "For each prefix, track the most pieces `dp[i]` and, among splits achieving it, the smallest possible last piece `last[i]` — a smaller last piece leaves more room for what follows.",
        "A prefix ending at `j` can be extended by the piece `nums[j..i-1]` when `pre[j] + last[j] ≤ pre[i]`. Taking the **largest** such `j` is optimal, and `pre[j] + last[j]` can be kept in a monotonic queue so the whole pass is linear.",
      ],
      editorial: explain({
        idea: "Choose the pieces greedily from the right end of each prefix: for prefix length `i`, the best split ends with the shortest possible last piece that is still at least the piece before it. That is the largest `j` with `pre[j] + last[j] ≤ pre[i]`, and a monotonic queue finds it in amortised O(1).",
        steps: [
          "Compute prefix sums `pre`. Set `dp[0] = 0`, `last[0] = 0`, and a deque holding index 0.",
          "For each `i` from 1 to `n`: while the second index in the deque, `q[1]`, satisfies `pre[q[1]] + last[q[1]] ≤ pre[i]`, pop the front — later indices are better.",
          "With `j` the front index, set `dp[i] = dp[j] + 1` and `last[i] = pre[i] - pre[j]`.",
          "Pop from the back every index whose key `pre[k] + last[k]` is at least `pre[i] + last[i]`, then push `i`.",
          "Return `dp[n]`.",
        ],
        why: "`dp` is non-decreasing in `i` (a longer prefix can absorb its extra elements into the last piece), so among valid `j` the largest one has the most pieces and the smallest last piece `pre[i] - pre[j]` at once. A valid `j` stays valid for every later `i` because `pre` only grows, so front pops never discard anything needed. An index whose key is not smaller than a later index's key can never be the largest valid one, which is why the back pops keep the keys increasing.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Maximising pieces alone is not enough; ties must prefer the smallest last piece.",
          "Prefix sums reach `10^10` — use 64-bit integers.",
          "A greedy that merges from the left whenever a drop appears fails on inputs like `[4,3,2,6]`.",
        ],
      }),
      examples: [
        { input: "[5,2,2]", expectedOutput: String(ref([5, 2, 2])) },
        { input: "[1,2,3,4]", expectedOutput: String(ref([1, 2, 3, 4])) },
        { input: "[4,3,2,6]", expectedOutput: String(ref([4, 3, 2, 6])) },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 12, 40, 80]));
        const top = pick(rng, [1, 3, 10, 100, 100000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        if (rng() < 0.15) nums.sort((x, y) => y - x);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findMaximumLength(nums: List[int]) -> int:
              n = len(nums)
              pre = [0] * (n + 1)
              for i, v in enumerate(nums):
                  pre[i + 1] = pre[i] + v
              dp = [0] * (n + 1)
              last = [0] * (n + 1)
              q = [0] * (n + 1)
              head, tail = 0, 1
              for i in range(1, n + 1):
                  while tail - head >= 2 and pre[q[head + 1]] + last[q[head + 1]] <= pre[i]:
                      head += 1
                  j = q[head]
                  dp[i] = dp[j] + 1
                  last[i] = pre[i] - pre[j]
                  key = pre[i] + last[i]
                  while tail > head and pre[q[tail - 1]] + last[q[tail - 1]] >= key:
                      tail -= 1
                  q[tail] = i
                  tail += 1
              return dp[n]
        `,
        javascript: code`
          var findMaximumLength = function(nums) {
              var n = nums.length;
              var pre = new Array(n + 1).fill(0);
              for (var i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              var dp = new Array(n + 1).fill(0), last = new Array(n + 1).fill(0), q = new Array(n + 1).fill(0);
              var head = 0, tail = 1;
              for (var i = 1; i <= n; i++) {
                  while (tail - head >= 2 && pre[q[head + 1]] + last[q[head + 1]] <= pre[i]) head++;
                  var j = q[head];
                  dp[i] = dp[j] + 1;
                  last[i] = pre[i] - pre[j];
                  var key = pre[i] + last[i];
                  while (tail > head && pre[q[tail - 1]] + last[q[tail - 1]] >= key) tail--;
                  q[tail++] = i;
              }
              return dp[n];
          };
        `,
        typescript: code`
          function findMaximumLength(nums: number[]): number {
              var n = nums.length;
              var pre: number[] = [], dp: number[] = [], last: number[] = [], q: number[] = [];
              for (var i = 0; i <= n; i++) { pre.push(0); dp.push(0); last.push(0); q.push(0); }
              for (var i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              var head = 0, tail = 1;
              for (var i = 1; i <= n; i++) {
                  while (tail - head >= 2 && pre[q[head + 1]] + last[q[head + 1]] <= pre[i]) head++;
                  var j = q[head];
                  dp[i] = dp[j] + 1;
                  last[i] = pre[i] - pre[j];
                  var key = pre[i] + last[i];
                  while (tail > head && pre[q[tail - 1]] + last[q[tail - 1]] >= key) tail--;
                  q[tail++] = i;
              }
              return dp[n];
          }
        `,
        java: code`
          public static int findMaximumLength(int[] nums) {
              int n = nums.length;
              long[] pre = new long[n + 1], last = new long[n + 1];
              int[] dp = new int[n + 1], q = new int[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              int head = 0, tail = 1;
              for (int i = 1; i <= n; i++) {
                  while (tail - head >= 2 && pre[q[head + 1]] + last[q[head + 1]] <= pre[i]) head++;
                  int j = q[head];
                  dp[i] = dp[j] + 1;
                  last[i] = pre[i] - pre[j];
                  long key = pre[i] + last[i];
                  while (tail > head && pre[q[tail - 1]] + last[q[tail - 1]] >= key) tail--;
                  q[tail++] = i;
              }
              return dp[n];
          }
        `,
        cpp: code`
          int findMaximumLength(vector<int>& nums) {
              int n = nums.size();
              vector<long long> pre(n + 1, 0), last(n + 1, 0);
              vector<int> dp(n + 1, 0), q(n + 1, 0);
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              int head = 0, tail = 1;
              for (int i = 1; i <= n; i++) {
                  while (tail - head >= 2 && pre[q[head + 1]] + last[q[head + 1]] <= pre[i]) head++;
                  int j = q[head];
                  dp[i] = dp[j] + 1;
                  last[i] = pre[i] - pre[j];
                  long long key = pre[i] + last[i];
                  while (tail > head && pre[q[tail - 1]] + last[q[tail - 1]] >= key) tail--;
                  q[tail++] = i;
              }
              return dp[n];
          }
        `,
        c: code`
          int findMaximumLength(int* nums, int numsSize) {
              int n = numsSize;
              long long* pre = (long long*) calloc((size_t) n + 1, sizeof(long long));
              long long* last = (long long*) calloc((size_t) n + 1, sizeof(long long));
              int* dp = (int*) calloc((size_t) n + 1, sizeof(int));
              int* q = (int*) calloc((size_t) n + 1, sizeof(int));
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              int head = 0, tail = 1;
              for (int i = 1; i <= n; i++) {
                  while (tail - head >= 2 && pre[q[head + 1]] + last[q[head + 1]] <= pre[i]) head++;
                  int j = q[head];
                  dp[i] = dp[j] + 1;
                  last[i] = pre[i] - pre[j];
                  long long key = pre[i] + last[i];
                  while (tail > head && pre[q[tail - 1]] + last[q[tail - 1]] >= key) tail--;
                  q[tail++] = i;
              }
              int ans = dp[n];
              free(pre); free(last); free(dp); free(q);
              return ans;
          }
        `,
        csharp: code`
          public static int FindMaximumLength(int[] nums)
          {
              int n = nums.Length;
              long[] pre = new long[n + 1], last = new long[n + 1];
              int[] dp = new int[n + 1], q = new int[n + 1];
              for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];
              int head = 0, tail = 1;
              for (int i = 1; i <= n; i++)
              {
                  while (tail - head >= 2 && pre[q[head + 1]] + last[q[head + 1]] <= pre[i]) head++;
                  int j = q[head];
                  dp[i] = dp[j] + 1;
                  last[i] = pre[i] - pre[j];
                  long key = pre[i] + last[i];
                  while (tail > head && pre[q[tail - 1]] + last[q[tail - 1]] >= key) tail--;
                  q[tail++] = i;
              }
              return dp[n];
          }
        `,
        go: code`
          func findMaximumLength(nums []int) int {
              n := len(nums)
              pre := make([]int, n+1)
              last := make([]int, n+1)
              dp := make([]int, n+1)
              q := make([]int, n+1)
              for i := 0; i < n; i++ {
                  pre[i+1] = pre[i] + nums[i]
              }
              head, tail := 0, 1
              for i := 1; i <= n; i++ {
                  for tail-head >= 2 && pre[q[head+1]]+last[q[head+1]] <= pre[i] {
                      head++
                  }
                  j := q[head]
                  dp[i] = dp[j] + 1
                  last[i] = pre[i] - pre[j]
                  key := pre[i] + last[i]
                  for tail > head && pre[q[tail-1]]+last[q[tail-1]] >= key {
                      tail--
                  }
                  q[tail] = i
                  tail++
              }
              return dp[n]
          }
        `,
        kotlin: code`
          fun findMaximumLength(nums: IntArray): Int {
              val n = nums.size
              val pre = LongArray(n + 1)
              val last = LongArray(n + 1)
              val dp = IntArray(n + 1)
              val q = IntArray(n + 1)
              for (i in 0 until n) pre[i + 1] = pre[i] + nums[i]
              var head = 0
              var tail = 1
              for (i in 1..n) {
                  while (tail - head >= 2 && pre[q[head + 1]] + last[q[head + 1]] <= pre[i]) head++
                  val j = q[head]
                  dp[i] = dp[j] + 1
                  last[i] = pre[i] - pre[j]
                  val key = pre[i] + last[i]
                  while (tail > head && pre[q[tail - 1]] + last[q[tail - 1]] >= key) tail--
                  q[tail++] = i
              }
              return dp[n]
          }
        `,
        swift: code`
          func findMaximumLength(_ nums: [Int]) -> Int {
              let n = nums.count
              var pre = [Int](repeating: 0, count: n + 1)
              var last = [Int](repeating: 0, count: n + 1)
              var dp = [Int](repeating: 0, count: n + 1)
              var q = [Int](repeating: 0, count: n + 1)
              for i in 0..<n { pre[i + 1] = pre[i] + nums[i] }
              var head = 0, tail = 1
              for i in 1...n {
                  while tail - head >= 2 && pre[q[head + 1]] + last[q[head + 1]] <= pre[i] { head += 1 }
                  let j = q[head]
                  dp[i] = dp[j] + 1
                  last[i] = pre[i] - pre[j]
                  let key = pre[i] + last[i]
                  while tail > head && pre[q[tail - 1]] + last[q[tail - 1]] >= key { tail -= 1 }
                  q[tail] = i
                  tail += 1
              }
              return dp[n]
          }
        `,
        rust: code`
          fn findMaximumLength(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut pre = vec![0i64; n + 1];
              let mut last = vec![0i64; n + 1];
              let mut dp = vec![0i32; n + 1];
              let mut q = vec![0usize; n + 1];
              for i in 0..n {
                  pre[i + 1] = pre[i] + nums[i] as i64;
              }
              let (mut head, mut tail) = (0usize, 1usize);
              for i in 1..=n {
                  while tail - head >= 2 && pre[q[head + 1]] + last[q[head + 1]] <= pre[i] {
                      head += 1;
                  }
                  let j = q[head];
                  dp[i] = dp[j] + 1;
                  last[i] = pre[i] - pre[j];
                  let key = pre[i] + last[i];
                  while tail > head && pre[q[tail - 1]] + last[q[tail - 1]] >= key {
                      tail -= 1;
                  }
                  q[tail] = i;
                  tail += 1;
              }
              dp[n]
          }
        `,
        php: code`
          function findMaximumLength($nums) {
              $n = count($nums);
              $pre = array_fill(0, $n + 1, 0);
              $last = array_fill(0, $n + 1, 0);
              $dp = array_fill(0, $n + 1, 0);
              $q = array_fill(0, $n + 1, 0);
              for ($i = 0; $i < $n; $i++) $pre[$i + 1] = $pre[$i] + $nums[$i];
              $head = 0;
              $tail = 1;
              for ($i = 1; $i <= $n; $i++) {
                  while ($tail - $head >= 2 && $pre[$q[$head + 1]] + $last[$q[$head + 1]] <= $pre[$i]) $head++;
                  $j = $q[$head];
                  $dp[$i] = $dp[$j] + 1;
                  $last[$i] = $pre[$i] - $pre[$j];
                  $key = $pre[$i] + $last[$i];
                  while ($tail > $head && $pre[$q[$tail - 1]] + $last[$q[$tail - 1]] >= $key) $tail--;
                  $q[$tail++] = $i;
              }
              return $dp[$n];
          }
        `,
        ruby: code`
          def findMaximumLength(nums)
            n = nums.length
            pre = Array.new(n + 1, 0)
            nums.each_with_index { |v, i| pre[i + 1] = pre[i] + v }
            dp = Array.new(n + 1, 0)
            last = Array.new(n + 1, 0)
            q = Array.new(n + 1, 0)
            head = 0
            tail = 1
            (1..n).each do |i|
              head += 1 while tail - head >= 2 && pre[q[head + 1]] + last[q[head + 1]] <= pre[i]
              j = q[head]
              dp[i] = dp[j] + 1
              last[i] = pre[i] - pre[j]
              key = pre[i] + last[i]
              tail -= 1 while tail > head && pre[q[tail - 1]] + last[q[tail - 1]] >= key
              q[tail] = i
              tail += 1
            end
            dp[n]
          end
        `,
      },
    };
  })(),

  // ── Count the Number of Powerful Integers (LC 2999) ─────────────
  (() => {
    // count(n): numbers <= n ending in s with every digit <= limit — walk
    // n's prefix (the part before the suffix) digit by digit. Narrow ranges
    // are scanned directly instead.
    const count = (n: number, limit: number, s: string) => {
      const N = String(n), L = s.length;
      if (N.length < L) return 0;
      const pre = N.length - L;
      let ans = 0;
      for (let i = 0; i < pre; i++) {
        const d = Number(N[i]);
        if (d > limit) return ans + (limit + 1) ** (pre - i);
        ans += d * (limit + 1) ** (pre - i - 1);
      }
      if (N.slice(pre) >= s) ans++;
      return ans;
    };
    const ref = (start: number, finish: number, limit: number, s: string) => {
      if (finish - start <= 20000) {
        let total = 0;
        for (let x = start; x <= finish; x++) {
          const t = String(x);
          if (!t.endsWith(s)) continue;
          let ok = true;
          for (const ch of t) if (Number(ch) > limit) { ok = false; break; }
          if (ok) total++;
        }
        return total;
      }
      return count(finish, limit, s) - count(start - 1, limit, s);
    };
    return {
      slug: "count-the-number-of-powerful-integers",
      title: "Count the Number of Powerful Integers",
      difficulty: "HARD" as const,
      tags: ["Math", "String", "Dynamic Programming", "Digit DP", "Google"],
      signature: {
        funcName: "numberOfPowerfulInt",
        params: [{ name: "start", type: "int" as const }, { name: "finish", type: "int" as const }, { name: "limit", type: "int" as const }, { name: "s", type: "string" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given integers `start`, `finish` and `limit`, and a string `s` of digits representing a positive integer.\n\nA positive integer `x` is **powerful** if its decimal representation ends with `s` (that is, `s` is a suffix of `x`) and **every** digit of `x` is at most `limit`.\n\nReturn how many powerful integers lie in the inclusive range `[start, finish]`.",
        [
          { in: "start = 1, finish = 6000, limit = 4, s = \"124\"", out: String(ref(1, 6000, 4, "124")), note: "124, 1124, 2124, 3124 and 4124. 5124 ends with 124 but its digit 5 exceeds the limit." },
          { in: "start = 15, finish = 215, limit = 6, s = \"10\"", out: String(ref(15, 215, 6, "10")), note: "110 and 210." },
          { in: "start = 1000, finish = 2000, limit = 4, s = \"3000\"", out: String(ref(1000, 2000, 4, "3000")), note: "Every number in the range is smaller than 3000, so none can end with it." },
        ],
        ["1 <= start <= finish <= 10^9 (reduced from 10^15 so the count fits a 32-bit integer)", "1 <= limit <= 9", "1 <= s.length <= floor(log10(finish)) + 1", "s consists only of digits, each at most limit", "s has no leading zeros"]),
      hints: [
        "Count powerful integers in `[1, n]` with a function `f(n)`; the answer is `f(finish) - f(start - 1)`.",
        "A powerful integer is some prefix `p` (possibly empty) followed by `s`. Every digit of `p` must be at most `limit`, so there are `limit + 1` choices per digit.",
        "Walk the first `len(n) - len(s)` digits of `n`. If a digit exceeds `limit`, every smaller-digit choice there completes freely: add `(limit + 1)^(remaining)` and stop. Otherwise add `digit · (limit + 1)^(remaining - 1)` and continue. At the end, count `n`'s own prefix if `n`'s last `len(s)` digits are at least `s`.",
      ],
      editorial: explain({
        idea: "Strip the fixed suffix: a powerful number `≤ n` is a prefix `p` written with digits `0..limit`, followed by `s`. Counting such prefixes that keep the whole number at most `n` is a short digit walk over `n`'s leading digits.",
        steps: [
          "Define `f(n)`; return `f(finish) - f(start - 1)`.",
          "Let `N` be `n` as a string. If it is shorter than `s`, return 0. Let `k = len(N) - len(s)` be the number of prefix digits (prefixes shorter than `k` are covered as leading zeros).",
          "For `i = 0..k-1` with digit `d = N[i]`: if `d > limit`, add `(limit + 1)^(k - i)` — every allowed digit here is below `d`, and the rest is free — and return. Otherwise add `d · (limit + 1)^(k - i - 1)` for the choices smaller than `d`, and keep `d`.",
          "If the loop finishes, the prefix equals `N`'s prefix; add 1 if `N`'s last `len(s)` digits, compared as a string, are `≥ s`.",
        ],
        why: "Two numbers with the same suffix `s` compare like their prefixes, and padding a shorter prefix with leading zeros does not change it, so counting length-`k` digit strings over `0..limit` that are `≤` `N`'s prefix (strictly smaller, or equal with a large-enough suffix) counts every powerful number up to `n` exactly once. A digit above `limit` cannot be matched, so all prefixes that branch below it are counted and nothing equal remains.",
        time: "O(len(finish))",
        space: "O(1)",
        pitfalls: [
          "Leading zeros in the prefix are fine — they correspond to shorter numbers — but `s` itself has none, so it is never confused with a number having fewer digits.",
          "Compare the final suffix of `n` with `s` as equal-length strings, not character by character against `limit`.",
          "`f(start - 1)` may be called with 0.",
        ],
      }),
      examples: [
        { input: "1\n6000\n4\n\"124\"", expectedOutput: String(ref(1, 6000, 4, "124")) },
        { input: "15\n215\n6\n\"10\"", expectedOutput: String(ref(15, 215, 6, "10")) },
        { input: "1000\n2000\n4\n\"3000\"", expectedOutput: String(ref(1000, 2000, 4, "3000")) },
      ],
      gen: (rng: Rng) => {
        const finish = ri(rng, 1, pick(rng, [9, 500, 30000, 10000000, 1000000000]));
        const start = rng() < 0.4 ? ri(rng, 1, finish) : ri(rng, Math.max(1, finish - pick(rng, [0, 100, 20000])), finish);
        const limit = ri(rng, 1, 9);
        const L = ri(rng, 1, Math.min(String(finish).length, pick(rng, [1, 2, 3, 10])));
        let s = String(ri(rng, 1, limit));
        while (s.length < L) s += String(ri(rng, 0, limit));
        return { input: `${start}\n${finish}\n${limit}\n"${s}"`, expectedOutput: String(ref(start, finish, limit, s)) };
      },
      solutions: {
        python: code`
          def numberOfPowerfulInt(start: int, finish: int, limit: int, s: str) -> int:
              def count(n):
                  N = str(n)
                  if len(N) < len(s):
                      return 0
                  k = len(N) - len(s)
                  ans = 0
                  for i in range(k):
                      d = ord(N[i]) - 48
                      if d > limit:
                          return ans + (limit + 1) ** (k - i)
                      ans += d * (limit + 1) ** (k - i - 1)
                  if N[k:] >= s:
                      ans += 1
                  return ans

              return count(finish) - count(start - 1)
        `,
        javascript: code`
          var numberOfPowerfulInt = function(start, finish, limit, s) {
              var count = function(n) {
                  var N = String(n);
                  if (N.length < s.length) return 0;
                  var k = N.length - s.length, ans = 0;
                  for (var i = 0; i < k; i++) {
                      var d = N.charCodeAt(i) - 48;
                      if (d > limit) return ans + Math.pow(limit + 1, k - i);
                      ans += d * Math.pow(limit + 1, k - i - 1);
                  }
                  if (N.substring(k) >= s) ans++;
                  return ans;
              };
              return count(finish) - count(start - 1);
          };
        `,
        typescript: code`
          function powerfulUpTo(n: number, limit: number, s: string): number {
              var N = String(n);
              if (N.length < s.length) return 0;
              var k = N.length - s.length, ans = 0;
              for (var i = 0; i < k; i++) {
                  var d = N.charCodeAt(i) - 48;
                  if (d > limit) return ans + Math.pow(limit + 1, k - i);
                  ans += d * Math.pow(limit + 1, k - i - 1);
              }
              if (N.substring(k) >= s) ans++;
              return ans;
          }

          function numberOfPowerfulInt(start: number, finish: number, limit: number, s: string): number {
              return powerfulUpTo(finish, limit, s) - powerfulUpTo(start - 1, limit, s);
          }
        `,
        java: code`
          static long powerfulUpTo(long n, int limit, String s) {
              String N = Long.toString(n);
              if (N.length() < s.length()) return 0;
              int k = N.length() - s.length();
              long[] pw = new long[k + 1];
              pw[0] = 1;
              for (int i = 1; i <= k; i++) pw[i] = pw[i - 1] * (limit + 1);
              long ans = 0;
              for (int i = 0; i < k; i++) {
                  int d = N.charAt(i) - '0';
                  if (d > limit) return ans + pw[k - i];
                  ans += d * pw[k - i - 1];
              }
              if (N.substring(k).compareTo(s) >= 0) ans++;
              return ans;
          }

          public static int numberOfPowerfulInt(int start, int finish, int limit, String s) {
              return (int) (powerfulUpTo(finish, limit, s) - powerfulUpTo((long) start - 1, limit, s));
          }
        `,
        cpp: code`
          long long powerfulUpTo(long long n, int limit, const string& s) {
              string N = to_string(n);
              if (N.size() < s.size()) return 0;
              int k = N.size() - s.size();
              vector<long long> pw(k + 1, 1);
              for (int i = 1; i <= k; i++) pw[i] = pw[i - 1] * (limit + 1);
              long long ans = 0;
              for (int i = 0; i < k; i++) {
                  int d = N[i] - '0';
                  if (d > limit) return ans + pw[k - i];
                  ans += d * pw[k - i - 1];
              }
              if (N.substr(k) >= s) ans++;
              return ans;
          }

          int numberOfPowerfulInt(int start, int finish, int limit, string s) {
              return (int) (powerfulUpTo(finish, limit, s) - powerfulUpTo((long long) start - 1, limit, s));
          }
        `,
        c: code`
          static long long powerfulUpTo(long long n, int limit, const char* s) {
              char N[24];
              int len = 0;
              if (n == 0) N[len++] = '0';
              while (n > 0) { N[len++] = (char) ('0' + n % 10); n /= 10; }
              for (int i = 0; i < len / 2; i++) { char t = N[i]; N[i] = N[len - 1 - i]; N[len - 1 - i] = t; }
              N[len] = 0;
              int L = (int) strlen(s);
              if (len < L) return 0;
              int k = len - L;
              long long pw[24];
              pw[0] = 1;
              for (int i = 1; i <= k; i++) pw[i] = pw[i - 1] * (limit + 1);
              long long ans = 0;
              for (int i = 0; i < k; i++) {
                  int d = N[i] - '0';
                  if (d > limit) return ans + pw[k - i];
                  ans += d * pw[k - i - 1];
              }
              if (strcmp(N + k, s) >= 0) ans++;
              return ans;
          }

          int numberOfPowerfulInt(int start, int finish, int limit, const char* s) {
              return (int) (powerfulUpTo(finish, limit, s) - powerfulUpTo((long long) start - 1, limit, s));
          }
        `,
        csharp: code`
          static long PowerfulUpTo(long n, int limit, string s)
          {
              string N = n.ToString();
              if (N.Length < s.Length) return 0;
              int k = N.Length - s.Length;
              long[] pw = new long[k + 1];
              pw[0] = 1;
              for (int i = 1; i <= k; i++) pw[i] = pw[i - 1] * (limit + 1);
              long ans = 0;
              for (int i = 0; i < k; i++)
              {
                  int d = N[i] - '0';
                  if (d > limit) return ans + pw[k - i];
                  ans += d * pw[k - i - 1];
              }
              if (string.CompareOrdinal(N.Substring(k), s) >= 0) ans++;
              return ans;
          }

          public static int NumberOfPowerfulInt(int start, int finish, int limit, string s)
          {
              return (int) (PowerfulUpTo(finish, limit, s) - PowerfulUpTo((long) start - 1, limit, s));
          }
        `,
        go: code`
          func powerfulUpTo(n int, limit int, s string) int {
              N := strconv.Itoa(n)
              if len(N) < len(s) {
                  return 0
              }
              k := len(N) - len(s)
              pw := make([]int, k+1)
              pw[0] = 1
              for i := 1; i <= k; i++ {
                  pw[i] = pw[i-1] * (limit + 1)
              }
              ans := 0
              for i := 0; i < k; i++ {
                  d := int(N[i] - '0')
                  if d > limit {
                      return ans + pw[k-i]
                  }
                  ans += d * pw[k-i-1]
              }
              if N[k:] >= s {
                  ans++
              }
              return ans
          }

          func numberOfPowerfulInt(start int, finish int, limit int, s string) int {
              return powerfulUpTo(finish, limit, s) - powerfulUpTo(start-1, limit, s)
          }
        `,
        kotlin: code`
          fun powerfulUpTo(n: Long, limit: Int, s: String): Long {
              val big = n.toString()
              if (big.length < s.length) return 0L
              val k = big.length - s.length
              val pw = LongArray(k + 1)
              pw[0] = 1L
              for (i in 1..k) pw[i] = pw[i - 1] * (limit + 1)
              var ans = 0L
              for (i in 0 until k) {
                  val d = big[i] - '0'
                  if (d > limit) return ans + pw[k - i]
                  ans += d * pw[k - i - 1]
              }
              if (big.substring(k) >= s) ans++
              return ans
          }

          fun numberOfPowerfulInt(start: Int, finish: Int, limit: Int, s: String): Int {
              return (powerfulUpTo(finish.toLong(), limit, s) - powerfulUpTo(start.toLong() - 1, limit, s)).toInt()
          }
        `,
        swift: code`
          func powerfulUpTo(_ n: Int, _ limit: Int, _ s: [UInt8]) -> Int {
              let big = Array(String(n).utf8)
              if big.count < s.count { return 0 }
              let k = big.count - s.count
              var pw = [Int](repeating: 1, count: k + 1)
              if k > 0 { for i in 1...k { pw[i] = pw[i - 1] * (limit + 1) } }
              var ans = 0
              for i in 0..<k {
                  let d = Int(big[i]) - 48
                  if d > limit { return ans + pw[k - i] }
                  ans += d * pw[k - i - 1]
              }
              if !Array(big[k...]).lexicographicallyPrecedes(s) { ans += 1 }
              return ans
          }

          func numberOfPowerfulInt(_ start: Int, _ finish: Int, _ limit: Int, _ s: String) -> Int {
              let suffix = Array(s.utf8)
              return powerfulUpTo(finish, limit, suffix) - powerfulUpTo(start - 1, limit, suffix)
          }
        `,
        rust: code`
          fn powerful_up_to(n: i64, limit: i64, s: &str) -> i64 {
              let big = n.to_string();
              let b = big.as_bytes();
              if b.len() < s.len() {
                  return 0;
              }
              let k = b.len() - s.len();
              let mut pw = vec![1i64; k + 1];
              for i in 1..=k {
                  pw[i] = pw[i - 1] * (limit + 1);
              }
              let mut ans = 0i64;
              for i in 0..k {
                  let d = (b[i] - b'0') as i64;
                  if d > limit {
                      return ans + pw[k - i];
                  }
                  ans += d * pw[k - i - 1];
              }
              if &big[k..] >= s {
                  ans += 1;
              }
              ans
          }

          fn numberOfPowerfulInt(start: i32, finish: i32, limit: i32, s: String) -> i32 {
              (powerful_up_to(finish as i64, limit as i64, &s) - powerful_up_to(start as i64 - 1, limit as i64, &s)) as i32
          }
        `,
        php: code`
          function powerfulUpTo($n, $limit, $s) {
              $N = strval($n);
              if (strlen($N) < strlen($s)) return 0;
              $k = strlen($N) - strlen($s);
              $pw = [1];
              for ($i = 1; $i <= $k; $i++) $pw[$i] = $pw[$i - 1] * ($limit + 1);
              $ans = 0;
              for ($i = 0; $i < $k; $i++) {
                  $d = ord($N[$i]) - 48;
                  if ($d > $limit) return $ans + $pw[$k - $i];
                  $ans += $d * $pw[$k - $i - 1];
              }
              if (strcmp(substr($N, $k), $s) >= 0) $ans++;
              return $ans;
          }

          function numberOfPowerfulInt($start, $finish, $limit, $s) {
              return powerfulUpTo($finish, $limit, $s) - powerfulUpTo($start - 1, $limit, $s);
          }
        `,
        ruby: code`
          def powerful_up_to(n, limit, s)
            big = n.to_s
            return 0 if big.length < s.length
            k = big.length - s.length
            ans = 0
            k.times do |i|
              d = big[i].ord - 48
              return ans + (limit + 1)**(k - i) if d > limit
              ans += d * (limit + 1)**(k - i - 1)
            end
            ans += 1 if big[k, big.length] >= s
            ans
          end

          def numberOfPowerfulInt(start, finish, limit, s)
            powerful_up_to(finish, limit, s) - powerful_up_to(start - 1, limit, s)
          end
        `,
      },
    };
  })(),

  // ── Maximize the Number of Partitions After Operations (LC 3003) ──
  (() => {
    const partitions = (s: string, k: number) => {
      let count = 1;
      const seen = new Set<string>();
      for (const ch of s) {
        if (seen.has(ch) || seen.size < k) seen.add(ch);
        else { count++; seen.clear(); seen.add(ch); }
      }
      return count;
    };
    // Brute force: try every single-character change (and none).
    const ref = (s: string, k: number) => {
      let best = partitions(s, k);
      for (let i = 0; i < s.length; i++) {
        for (let c = 0; c < 26; c++) {
          const t = s.slice(0, i) + String.fromCharCode(97 + c) + s.slice(i + 1);
          best = Math.max(best, partitions(t, k));
        }
      }
      return best;
    };
    return {
      slug: "maximize-the-number-of-partitions-after-operations",
      title: "Maximize the Number of Partitions After Operations",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Bit Manipulation", "Bitmask", "Google"],
      signature: {
        funcName: "maxPartitionsAfterOperations",
        params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given a string `s` and an integer `k`. You split `s` with the following process until it is empty:\n\n- Remove the **longest** prefix of `s` that contains at most `k` distinct characters. That prefix counts as one partition.\n\nBefore you start, you may change **at most one** character of `s` to any lowercase English letter.\n\nReturn the **maximum** number of partitions you can get with an optimal choice of that change.",
        [
          { in: "s = \"accca\", k = 2", out: String(ref("accca", 2)), note: "Change s[2] to 'b' to get \"acbca\". The prefixes taken are \"ac\", \"bc\" and \"a\": 3 partitions." },
          { in: "s = \"aabaab\", k = 3", out: String(ref("aabaab", 3)), note: "Only two distinct letters exist and one change adds at most one more, so the whole string is always one partition." },
          { in: "s = \"xxyz\", k = 1", out: String(ref("xxyz", 1)), note: "Change s[1] to 'a': \"xayz\" splits into \"x\", \"a\", \"y\", \"z\"." },
        ],
        ["1 <= s.length <= 10^4", "s consists only of lowercase English letters", "1 <= k <= 26"]),
      hints: [
        "Without a change, the split is fixed by a left-to-right greedy. A change at index `i` leaves everything before `i` exactly as it was.",
        "Precompute, for every suffix start `j`, how many partitions the greedy makes on `s[j..]` when a fresh partition starts at `j`.",
        "When you change `s[i]` to `c`, simulate only the partition that contains index `i`: from the greedy state before `i` (partitions closed, letter set of the open one), add `c`, then extend through `s[i+1..]` until a `(k+1)`-th distinct letter appears. Past that point the rest is a fresh suffix you already counted. Using the order in which letters first appear after `i`, the extension takes `O(26)`.",
      ],
      editorial: explain({
        idea: "A single change splits the string into three zones: an untouched prefix (whose greedy state is known), the one partition that contains the changed index, and an untouched suffix that starts a fresh partition — whose count can be precomputed for every start position.",
        steps: [
          "For every `j`, record `next[j][c]` (first index ≥ `j` holding letter `c`) and `order[j]`, the letters of `s[j..]` in order of first appearance.",
          "`fresh[j]` = partitions of `s[j..]` from a fresh start: the open partition ends right before the `(k+1)`-th letter of `order[j]`, at index `e`, so `fresh[j] = 1 + fresh[e]` (with `fresh[n] = 0`).",
          "Walk `i` from left to right keeping the greedy state before `i`: `done` closed partitions and the letter set `mask` of the open one.",
          "For every letter `c`: if `c` is already in `mask` or `mask` has fewer than `k` letters, add it; otherwise close the partition (`done + 1`) and open `{c}`. Then scan `order[i+1]`, counting letters not in the set; the first one that pushes the count above `k` sits at `e = next[i+1][that letter]`. The total is `done' + 1 + fresh[e]` (`fresh[n] = 0` if no such letter).",
          "Advance the state with the original `s[i]`. The answer is the best total seen, including `fresh[0]` (no change).",
        ],
        why: "The greedy only looks forward, so characters before `i` behave identically with or without the change, and once a partition boundary appears after `i`, the remaining string is untouched and starts fresh — exactly `fresh[e]`. Inside the open partition, a letter extends it unless it is new and the set is full; scanning letters in order of first appearance finds the first such position, because positions between first appearances repeat letters already counted.",
        time: "O(26 · 26 · n)",
        space: "O(26 · n)",
        pitfalls: [
          "Changing to the same letter (no change) must also be considered — it is covered by trying every `c`.",
          "With `k = 26` nothing can ever be split; the answer is 1.",
          "When the changed letter closes the current partition, the new partition starts **at** `i`, not after it.",
        ],
      }),
      examples: [
        { input: "\"accca\"\n2", expectedOutput: String(ref("accca", 2)) },
        { input: "\"aabaab\"\n3", expectedOutput: String(ref("aabaab", 3)) },
        { input: "\"xxyz\"\n1", expectedOutput: String(ref("xxyz", 1)) },
      ],
      hiddenCount: 1500,
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 18, 30]));
        const alpha = "abcdefghijklmnopqrstuvwxyz".slice(0, pick(rng, [1, 2, 3, 5, 8]));
        const s = randLower(rng, n, n, alpha);
        const k = ri(rng, 1, pick(rng, [1, 3, 6, 26]));
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: code`
          def maxPartitionsAfterOperations(s: str, k: int) -> int:
              n = len(s)
              a = [ord(c) - 97 for c in s]
              nxt = [None] * (n + 1)
              nxt[n] = [n] * 26
              order = [None] * (n + 1)
              order[n] = []
              for i in range(n - 1, -1, -1):
                  row = nxt[i + 1][:]
                  row[a[i]] = i
                  nxt[i] = row
                  order[i] = [a[i]] + [c for c in order[i + 1] if c != a[i]]
              fresh = [0] * (n + 1)
              for i in range(n - 1, -1, -1):
                  e = nxt[i][order[i][k]] if len(order[i]) > k else n
                  fresh[i] = 1 + fresh[e]
              best = fresh[0]
              done, mask, size = 0, 0, 0
              for i in range(n):
                  for c in range(26):
                      d2, m2, z2 = done, mask, size
                      if (m2 >> c) & 1:
                          pass
                      elif z2 < k:
                          m2 |= 1 << c
                          z2 += 1
                      else:
                          d2 += 1
                          m2 = 1 << c
                          z2 = 1
                      e = n
                      for ch in order[i + 1]:
                          if not (m2 >> ch) & 1:
                              z2 += 1
                              if z2 > k:
                                  e = nxt[i + 1][ch]
                                  break
                      total = d2 + 1 + fresh[e]
                      if total > best:
                          best = total
                  c = a[i]
                  if (mask >> c) & 1:
                      pass
                  elif size < k:
                      mask |= 1 << c
                      size += 1
                  else:
                      done += 1
                      mask = 1 << c
                      size = 1
              return best
        `,
        javascript: code`
          var maxPartitionsAfterOperations = function(s, k) {
              var n = s.length, i, c;
              var a = new Array(n);
              for (i = 0; i < n; i++) a[i] = s.charCodeAt(i) - 97;
              // nxt[i*26+c]: first index >= i holding c; order[i]: letters of s[i..] by first appearance
              var nxt = new Array((n + 1) * 26).fill(n);
              var order = new Array(n + 1);
              order[n] = [];
              for (i = n - 1; i >= 0; i--) {
                  for (c = 0; c < 26; c++) nxt[i * 26 + c] = nxt[(i + 1) * 26 + c];
                  nxt[i * 26 + a[i]] = i;
                  var o = [a[i]];
                  for (var t = 0; t < order[i + 1].length; t++) if (order[i + 1][t] !== a[i]) o.push(order[i + 1][t]);
                  order[i] = o;
              }
              var fresh = new Array(n + 1).fill(0);
              for (i = n - 1; i >= 0; i--) {
                  var e0 = order[i].length > k ? nxt[i * 26 + order[i][k]] : n;
                  fresh[i] = 1 + fresh[e0];
              }
              var best = fresh[0], done = 0, mask = 0, size = 0;
              for (i = 0; i < n; i++) {
                  for (c = 0; c < 26; c++) {
                      var d2 = done, m2 = mask, z2 = size;
                      if ((m2 >> c) & 1) {
                          // already in the open partition
                      } else if (z2 < k) { m2 |= 1 << c; z2++; }
                      else { d2++; m2 = 1 << c; z2 = 1; }
                      var e = n, ord = order[i + 1];
                      for (var t = 0; t < ord.length; t++) {
                          if (!((m2 >> ord[t]) & 1)) {
                              z2++;
                              if (z2 > k) { e = nxt[(i + 1) * 26 + ord[t]]; break; }
                          }
                      }
                      if (d2 + 1 + fresh[e] > best) best = d2 + 1 + fresh[e];
                  }
                  c = a[i];
                  if ((mask >> c) & 1) {
                      // unchanged
                  } else if (size < k) { mask |= 1 << c; size++; }
                  else { done++; mask = 1 << c; size = 1; }
              }
              return best;
          };
        `,
        typescript: code`
          function maxPartitionsAfterOperations(s: string, k: number): number {
              var n = s.length, i: number, c: number;
              var a: number[] = [];
              for (i = 0; i < n; i++) a.push(s.charCodeAt(i) - 97);
              // nxt[i*26+c]: first index >= i holding c; order[i]: letters of s[i..] by first appearance
              var nxt: number[] = [];
              for (i = 0; i < (n + 1) * 26; i++) nxt.push(n);
              var order: number[][] = [];
              for (i = 0; i <= n; i++) order.push([]);
              for (i = n - 1; i >= 0; i--) {
                  for (c = 0; c < 26; c++) nxt[i * 26 + c] = nxt[(i + 1) * 26 + c];
                  nxt[i * 26 + a[i]] = i;
                  var o: number[] = [a[i]];
                  for (var t = 0; t < order[i + 1].length; t++) if (order[i + 1][t] !== a[i]) o.push(order[i + 1][t]);
                  order[i] = o;
              }
              var fresh: number[] = [];
              for (i = 0; i <= n; i++) fresh.push(0);
              for (i = n - 1; i >= 0; i--) {
                  var e0 = order[i].length > k ? nxt[i * 26 + order[i][k]] : n;
                  fresh[i] = 1 + fresh[e0];
              }
              var best = fresh[0], done = 0, mask = 0, size = 0;
              for (i = 0; i < n; i++) {
                  for (c = 0; c < 26; c++) {
                      var d2 = done, m2 = mask, z2 = size;
                      if ((m2 >> c) & 1) {
                          // already in the open partition
                      } else if (z2 < k) { m2 |= 1 << c; z2++; }
                      else { d2++; m2 = 1 << c; z2 = 1; }
                      var e = n, ord = order[i + 1];
                      for (var t = 0; t < ord.length; t++) {
                          if (!((m2 >> ord[t]) & 1)) {
                              z2++;
                              if (z2 > k) { e = nxt[(i + 1) * 26 + ord[t]]; break; }
                          }
                      }
                      if (d2 + 1 + fresh[e] > best) best = d2 + 1 + fresh[e];
                  }
                  c = a[i];
                  if ((mask >> c) & 1) {
                      // unchanged
                  } else if (size < k) { mask |= 1 << c; size++; }
                  else { done++; mask = 1 << c; size = 1; }
              }
              return best;
          }
        `,
        java: code`
          public static int maxPartitionsAfterOperations(String s, int k) {
              int n = s.length();
              int[] a = new int[n];
              for (int i = 0; i < n; i++) a[i] = s.charAt(i) - 'a';
              // nxt[i][c]: first index >= i holding c; order[i]: letters of s[i..] by first appearance
              int[][] nxt = new int[n + 1][26];
              int[][] order = new int[n + 1][26];
              int[] olen = new int[n + 1];
              Arrays.fill(nxt[n], n);
              for (int i = n - 1; i >= 0; i--) {
                  nxt[i] = nxt[i + 1].clone();
                  nxt[i][a[i]] = i;
                  order[i][olen[i]++] = a[i];
                  for (int t = 0; t < olen[i + 1]; t++) if (order[i + 1][t] != a[i]) order[i][olen[i]++] = order[i + 1][t];
              }
              int[] fresh = new int[n + 1];
              for (int i = n - 1; i >= 0; i--) {
                  int e = olen[i] > k ? nxt[i][order[i][k]] : n;
                  fresh[i] = 1 + fresh[e];
              }
              int best = fresh[0], done = 0, mask = 0, size = 0;
              for (int i = 0; i < n; i++) {
                  for (int c = 0; c < 26; c++) {
                      int d2 = done, m2 = mask, z2 = size;
                      if (((m2 >> c) & 1) == 0) {
                          if (z2 < k) { m2 |= 1 << c; z2++; }
                          else { d2++; m2 = 1 << c; z2 = 1; }
                      }
                      int e = n;
                      for (int t = 0; t < olen[i + 1]; t++) {
                          int ch = order[i + 1][t];
                          if (((m2 >> ch) & 1) == 0 && ++z2 > k) { e = nxt[i + 1][ch]; break; }
                      }
                      best = Math.max(best, d2 + 1 + fresh[e]);
                  }
                  int c = a[i];
                  if (((mask >> c) & 1) == 0) {
                      if (size < k) { mask |= 1 << c; size++; }
                      else { done++; mask = 1 << c; size = 1; }
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int maxPartitionsAfterOperations(string s, int k) {
              int n = s.size();
              vector<int> a(n);
              for (int i = 0; i < n; i++) a[i] = s[i] - 'a';
              // nxt[i][c]: first index >= i holding c; order[i]: letters of s[i..] by first appearance
              vector<array<int, 26>> nxt(n + 1), order(n + 1);
              vector<int> olen(n + 1, 0);
              nxt[n].fill(n);
              for (int i = n - 1; i >= 0; i--) {
                  nxt[i] = nxt[i + 1];
                  nxt[i][a[i]] = i;
                  order[i][olen[i]++] = a[i];
                  for (int t = 0; t < olen[i + 1]; t++) if (order[i + 1][t] != a[i]) order[i][olen[i]++] = order[i + 1][t];
              }
              vector<int> fresh(n + 1, 0);
              for (int i = n - 1; i >= 0; i--) {
                  int e = olen[i] > k ? nxt[i][order[i][k]] : n;
                  fresh[i] = 1 + fresh[e];
              }
              int best = fresh[0], done = 0, mask = 0, size = 0;
              for (int i = 0; i < n; i++) {
                  for (int c = 0; c < 26; c++) {
                      int d2 = done, m2 = mask, z2 = size;
                      if (!((m2 >> c) & 1)) {
                          if (z2 < k) { m2 |= 1 << c; z2++; }
                          else { d2++; m2 = 1 << c; z2 = 1; }
                      }
                      int e = n;
                      for (int t = 0; t < olen[i + 1]; t++) {
                          int ch = order[i + 1][t];
                          if (!((m2 >> ch) & 1) && ++z2 > k) { e = nxt[i + 1][ch]; break; }
                      }
                      best = max(best, d2 + 1 + fresh[e]);
                  }
                  int c = a[i];
                  if (!((mask >> c) & 1)) {
                      if (size < k) { mask |= 1 << c; size++; }
                      else { done++; mask = 1 << c; size = 1; }
                  }
              }
              return best;
          }
        `,
        c: code`
          int maxPartitionsAfterOperations(const char* s, int k) {
              int n = (int) strlen(s);
              // nxt[i*26+c]: first index >= i holding c; order[i*26..]: letters of s[i..] by first appearance
              int* nxt = (int*) malloc(sizeof(int) * (n + 1) * 26);
              int* order = (int*) malloc(sizeof(int) * (n + 1) * 26);
              int* olen = (int*) calloc((size_t) n + 1, sizeof(int));
              int* fresh = (int*) calloc((size_t) n + 1, sizeof(int));
              for (int c = 0; c < 26; c++) nxt[n * 26 + c] = n;
              for (int i = n - 1; i >= 0; i--) {
                  int ai = s[i] - 'a';
                  for (int c = 0; c < 26; c++) nxt[i * 26 + c] = nxt[(i + 1) * 26 + c];
                  nxt[i * 26 + ai] = i;
                  order[i * 26 + olen[i]++] = ai;
                  for (int t = 0; t < olen[i + 1]; t++) {
                      int ch = order[(i + 1) * 26 + t];
                      if (ch != ai) order[i * 26 + olen[i]++] = ch;
                  }
              }
              for (int i = n - 1; i >= 0; i--) {
                  int e = olen[i] > k ? nxt[i * 26 + order[i * 26 + k]] : n;
                  fresh[i] = 1 + fresh[e];
              }
              int best = fresh[0], done = 0, mask = 0, size = 0;
              for (int i = 0; i < n; i++) {
                  for (int c = 0; c < 26; c++) {
                      int d2 = done, m2 = mask, z2 = size;
                      if (!((m2 >> c) & 1)) {
                          if (z2 < k) { m2 |= 1 << c; z2++; }
                          else { d2++; m2 = 1 << c; z2 = 1; }
                      }
                      int e = n;
                      for (int t = 0; t < olen[i + 1]; t++) {
                          int ch = order[(i + 1) * 26 + t];
                          if (!((m2 >> ch) & 1) && ++z2 > k) { e = nxt[(i + 1) * 26 + ch]; break; }
                      }
                      if (d2 + 1 + fresh[e] > best) best = d2 + 1 + fresh[e];
                  }
                  int c = s[i] - 'a';
                  if (!((mask >> c) & 1)) {
                      if (size < k) { mask |= 1 << c; size++; }
                      else { done++; mask = 1 << c; size = 1; }
                  }
              }
              free(nxt); free(order); free(olen); free(fresh);
              return best;
          }
        `,
        csharp: code`
          public static int MaxPartitionsAfterOperations(string s, int k)
          {
              int n = s.Length;
              int[] a = new int[n];
              for (int i = 0; i < n; i++) a[i] = s[i] - 'a';
              // nxt[i*26+c]: first index >= i holding c; order[i*26..]: letters of s[i..] by first appearance
              int[] nxt = new int[(n + 1) * 26], order = new int[(n + 1) * 26], olen = new int[n + 1], fresh = new int[n + 1];
              for (int c = 0; c < 26; c++) nxt[n * 26 + c] = n;
              for (int i = n - 1; i >= 0; i--)
              {
                  for (int c = 0; c < 26; c++) nxt[i * 26 + c] = nxt[(i + 1) * 26 + c];
                  nxt[i * 26 + a[i]] = i;
                  order[i * 26 + olen[i]++] = a[i];
                  for (int t = 0; t < olen[i + 1]; t++)
                  {
                      int ch = order[(i + 1) * 26 + t];
                      if (ch != a[i]) order[i * 26 + olen[i]++] = ch;
                  }
              }
              for (int i = n - 1; i >= 0; i--)
              {
                  int e = olen[i] > k ? nxt[i * 26 + order[i * 26 + k]] : n;
                  fresh[i] = 1 + fresh[e];
              }
              int best = fresh[0], done = 0, mask = 0, size = 0;
              for (int i = 0; i < n; i++)
              {
                  for (int c = 0; c < 26; c++)
                  {
                      int d2 = done, m2 = mask, z2 = size;
                      if (((m2 >> c) & 1) == 0)
                      {
                          if (z2 < k) { m2 |= 1 << c; z2++; }
                          else { d2++; m2 = 1 << c; z2 = 1; }
                      }
                      int e = n;
                      for (int t = 0; t < olen[i + 1]; t++)
                      {
                          int ch = order[(i + 1) * 26 + t];
                          if (((m2 >> ch) & 1) == 0 && ++z2 > k) { e = nxt[(i + 1) * 26 + ch]; break; }
                      }
                      best = Math.Max(best, d2 + 1 + fresh[e]);
                  }
                  int cc = a[i];
                  if (((mask >> cc) & 1) == 0)
                  {
                      if (size < k) { mask |= 1 << cc; size++; }
                      else { done++; mask = 1 << cc; size = 1; }
                  }
              }
              return best;
          }
        `,
        go: code`
          func maxPartitionsAfterOperations(s string, k int) int {
              n := len(s)
              // nxt[i*26+c]: first index >= i holding c; order[i*26..]: letters of s[i..] by first appearance
              nxt := make([]int, (n+1)*26)
              order := make([]int, (n+1)*26)
              olen := make([]int, n+1)
              fresh := make([]int, n+1)
              for c := 0; c < 26; c++ {
                  nxt[n*26+c] = n
              }
              for i := n - 1; i >= 0; i-- {
                  ai := int(s[i] - 'a')
                  copy(nxt[i*26:i*26+26], nxt[(i+1)*26:(i+1)*26+26])
                  nxt[i*26+ai] = i
                  order[i*26] = ai
                  olen[i] = 1
                  for t := 0; t < olen[i+1]; t++ {
                      if ch := order[(i+1)*26+t]; ch != ai {
                          order[i*26+olen[i]] = ch
                          olen[i]++
                      }
                  }
              }
              for i := n - 1; i >= 0; i-- {
                  e := n
                  if olen[i] > k {
                      e = nxt[i*26+order[i*26+k]]
                  }
                  fresh[i] = 1 + fresh[e]
              }
              best, done, mask, size := fresh[0], 0, 0, 0
              for i := 0; i < n; i++ {
                  for c := 0; c < 26; c++ {
                      d2, m2, z2 := done, mask, size
                      if (m2>>uint(c))&1 == 0 {
                          if z2 < k {
                              m2 |= 1 << uint(c)
                              z2++
                          } else {
                              d2++
                              m2 = 1 << uint(c)
                              z2 = 1
                          }
                      }
                      e := n
                      for t := 0; t < olen[i+1]; t++ {
                          ch := order[(i+1)*26+t]
                          if (m2>>uint(ch))&1 == 0 {
                              z2++
                              if z2 > k {
                                  e = nxt[(i+1)*26+ch]
                                  break
                              }
                          }
                      }
                      if d2+1+fresh[e] > best {
                          best = d2 + 1 + fresh[e]
                      }
                  }
                  c := int(s[i] - 'a')
                  if (mask>>uint(c))&1 == 0 {
                      if size < k {
                          mask |= 1 << uint(c)
                          size++
                      } else {
                          done++
                          mask = 1 << uint(c)
                          size = 1
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxPartitionsAfterOperations(s: String, k: Int): Int {
              val n = s.length
              // nxt[i*26+c]: first index >= i holding c; order[i*26..]: letters of s[i..] by first appearance
              val nxt = IntArray((n + 1) * 26)
              val order = IntArray((n + 1) * 26)
              val olen = IntArray(n + 1)
              val fresh = IntArray(n + 1)
              for (c in 0 until 26) nxt[n * 26 + c] = n
              for (i in n - 1 downTo 0) {
                  val ai = s[i] - 'a'
                  for (c in 0 until 26) nxt[i * 26 + c] = nxt[(i + 1) * 26 + c]
                  nxt[i * 26 + ai] = i
                  order[i * 26 + olen[i]++] = ai
                  for (t in 0 until olen[i + 1]) {
                      val ch = order[(i + 1) * 26 + t]
                      if (ch != ai) order[i * 26 + olen[i]++] = ch
                  }
              }
              for (i in n - 1 downTo 0) {
                  val e = if (olen[i] > k) nxt[i * 26 + order[i * 26 + k]] else n
                  fresh[i] = 1 + fresh[e]
              }
              var best = fresh[0]
              var done = 0
              var mask = 0
              var size = 0
              for (i in 0 until n) {
                  for (c in 0 until 26) {
                      var d2 = done
                      var m2 = mask
                      var z2 = size
                      if ((m2 shr c) and 1 == 0) {
                          if (z2 < k) { m2 = m2 or (1 shl c); z2++ }
                          else { d2++; m2 = 1 shl c; z2 = 1 }
                      }
                      var e = n
                      for (t in 0 until olen[i + 1]) {
                          val ch = order[(i + 1) * 26 + t]
                          if ((m2 shr ch) and 1 == 0) {
                              z2++
                              if (z2 > k) { e = nxt[(i + 1) * 26 + ch]; break }
                          }
                      }
                      best = maxOf(best, d2 + 1 + fresh[e])
                  }
                  val c = s[i] - 'a'
                  if ((mask shr c) and 1 == 0) {
                      if (size < k) { mask = mask or (1 shl c); size++ }
                      else { done++; mask = 1 shl c; size = 1 }
                  }
              }
              return best
          }
        `,
        swift: code`
          func maxPartitionsAfterOperations(_ s: String, _ k: Int) -> Int {
              let a = s.utf8.map { Int($0) - 97 }
              let n = a.count
              // nxt[i*26+c]: first index >= i holding c; order[i*26..]: letters of s[i..] by first appearance
              var nxt = [Int](repeating: n, count: (n + 1) * 26)
              var order = [Int](repeating: 0, count: (n + 1) * 26)
              var olen = [Int](repeating: 0, count: n + 1)
              var fresh = [Int](repeating: 0, count: n + 1)
              var i = n - 1
              while i >= 0 {
                  for c in 0..<26 { nxt[i * 26 + c] = nxt[(i + 1) * 26 + c] }
                  nxt[i * 26 + a[i]] = i
                  order[i * 26] = a[i]
                  olen[i] = 1
                  for t in 0..<olen[i + 1] {
                      let ch = order[(i + 1) * 26 + t]
                      if ch != a[i] { order[i * 26 + olen[i]] = ch; olen[i] += 1 }
                  }
                  i -= 1
              }
              i = n - 1
              while i >= 0 {
                  let e = olen[i] > k ? nxt[i * 26 + order[i * 26 + k]] : n
                  fresh[i] = 1 + fresh[e]
                  i -= 1
              }
              var best = fresh[0], done = 0, mask = 0, size = 0
              for i in 0..<n {
                  for c in 0..<26 {
                      var d2 = done, m2 = mask, z2 = size
                      if (m2 >> c) & 1 == 0 {
                          if z2 < k { m2 |= 1 << c; z2 += 1 }
                          else { d2 += 1; m2 = 1 << c; z2 = 1 }
                      }
                      var e = n
                      for t in 0..<olen[i + 1] {
                          let ch = order[(i + 1) * 26 + t]
                          if (m2 >> ch) & 1 == 0 {
                              z2 += 1
                              if z2 > k { e = nxt[(i + 1) * 26 + ch]; break }
                          }
                      }
                      best = max(best, d2 + 1 + fresh[e])
                  }
                  let c = a[i]
                  if (mask >> c) & 1 == 0 {
                      if size < k { mask |= 1 << c; size += 1 }
                      else { done += 1; mask = 1 << c; size = 1 }
                  }
              }
              return best
          }
        `,
        rust: code`
          fn maxPartitionsAfterOperations(s: String, k: i32) -> i32 {
              let a: Vec<usize> = s.bytes().map(|b| (b - b'a') as usize).collect();
              let n = a.len();
              let k = k as usize;
              // nxt[i*26+c]: first index >= i holding c; order[i*26..]: letters of s[i..] by first appearance
              let mut nxt = vec![n; (n + 1) * 26];
              let mut order = vec![0usize; (n + 1) * 26];
              let mut olen = vec![0usize; n + 1];
              let mut fresh = vec![0i32; n + 1];
              for i in (0..n).rev() {
                  for c in 0..26 {
                      nxt[i * 26 + c] = nxt[(i + 1) * 26 + c];
                  }
                  nxt[i * 26 + a[i]] = i;
                  order[i * 26] = a[i];
                  olen[i] = 1;
                  for t in 0..olen[i + 1] {
                      let ch = order[(i + 1) * 26 + t];
                      if ch != a[i] {
                          order[i * 26 + olen[i]] = ch;
                          olen[i] += 1;
                      }
                  }
              }
              for i in (0..n).rev() {
                  let e = if olen[i] > k { nxt[i * 26 + order[i * 26 + k]] } else { n };
                  fresh[i] = 1 + fresh[e];
              }
              let (mut best, mut done, mut mask, mut size) = (fresh[0], 0i32, 0u32, 0usize);
              for i in 0..n {
                  for c in 0..26usize {
                      let (mut d2, mut m2, mut z2) = (done, mask, size);
                      if (m2 >> c) & 1 == 0 {
                          if z2 < k {
                              m2 |= 1 << c;
                              z2 += 1;
                          } else {
                              d2 += 1;
                              m2 = 1 << c;
                              z2 = 1;
                          }
                      }
                      let mut e = n;
                      for t in 0..olen[i + 1] {
                          let ch = order[(i + 1) * 26 + t];
                          if (m2 >> ch) & 1 == 0 {
                              z2 += 1;
                              if z2 > k {
                                  e = nxt[(i + 1) * 26 + ch];
                                  break;
                              }
                          }
                      }
                      best = std::cmp::max(best, d2 + 1 + fresh[e]);
                  }
                  let c = a[i];
                  if (mask >> c) & 1 == 0 {
                      if size < k {
                          mask |= 1 << c;
                          size += 1;
                      } else {
                          done += 1;
                          mask = 1 << c;
                          size = 1;
                      }
                  }
              }
              best
          }
        `,
        php: code`
          function maxPartitionsAfterOperations($s, $k) {
              $n = strlen($s);
              $a = [];
              for ($i = 0; $i < $n; $i++) $a[] = ord($s[$i]) - 97;
              // nxt[i][c]: first index >= i holding c; order[i]: letters of s[i..] by first appearance
              $nxt = array_fill(0, $n + 1, null);
              $nxt[$n] = array_fill(0, 26, $n);
              $order = array_fill(0, $n + 1, []);
              for ($i = $n - 1; $i >= 0; $i--) {
                  $row = $nxt[$i + 1];
                  $row[$a[$i]] = $i;
                  $nxt[$i] = $row;
                  $o = [$a[$i]];
                  foreach ($order[$i + 1] as $ch) if ($ch != $a[$i]) $o[] = $ch;
                  $order[$i] = $o;
              }
              $fresh = array_fill(0, $n + 1, 0);
              for ($i = $n - 1; $i >= 0; $i--) {
                  $e = count($order[$i]) > $k ? $nxt[$i][$order[$i][$k]] : $n;
                  $fresh[$i] = 1 + $fresh[$e];
              }
              $best = $fresh[0];
              $done = 0;
              $mask = 0;
              $size = 0;
              for ($i = 0; $i < $n; $i++) {
                  $ord = $order[$i + 1];
                  for ($c = 0; $c < 26; $c++) {
                      $d2 = $done;
                      $m2 = $mask;
                      $z2 = $size;
                      if ((($m2 >> $c) & 1) == 0) {
                          if ($z2 < $k) { $m2 |= 1 << $c; $z2++; }
                          else { $d2++; $m2 = 1 << $c; $z2 = 1; }
                      }
                      $e = $n;
                      foreach ($ord as $ch) {
                          if ((($m2 >> $ch) & 1) == 0) {
                              $z2++;
                              if ($z2 > $k) { $e = $nxt[$i + 1][$ch]; break; }
                          }
                      }
                      if ($d2 + 1 + $fresh[$e] > $best) $best = $d2 + 1 + $fresh[$e];
                  }
                  $c = $a[$i];
                  if ((($mask >> $c) & 1) == 0) {
                      if ($size < $k) { $mask |= 1 << $c; $size++; }
                      else { $done++; $mask = 1 << $c; $size = 1; }
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def maxPartitionsAfterOperations(s, k)
            a = s.bytes.map { |b| b - 97 }
            n = a.length
            # nxt[i][c]: first index >= i holding c; order[i]: letters of s[i..] by first appearance
            nxt = Array.new(n + 1)
            nxt[n] = Array.new(26, n)
            order = Array.new(n + 1)
            order[n] = []
            (n - 1).downto(0) do |i|
              row = nxt[i + 1].dup
              row[a[i]] = i
              nxt[i] = row
              order[i] = [a[i]] + order[i + 1].reject { |ch| ch == a[i] }
            end
            fresh = Array.new(n + 1, 0)
            (n - 1).downto(0) do |i|
              e = order[i].length > k ? nxt[i][order[i][k]] : n
              fresh[i] = 1 + fresh[e]
            end
            best = fresh[0]
            done = 0
            mask = 0
            size = 0
            n.times do |i|
              ord = order[i + 1]
              26.times do |c|
                d2 = done
                m2 = mask
                z2 = size
                if (m2 >> c) & 1 == 0
                  if z2 < k
                    m2 |= 1 << c
                    z2 += 1
                  else
                    d2 += 1
                    m2 = 1 << c
                    z2 = 1
                  end
                end
                e = n
                ord.each do |ch|
                  next if (m2 >> ch) & 1 == 1
                  z2 += 1
                  if z2 > k
                    e = nxt[i + 1][ch]
                    break
                  end
                end
                total = d2 + 1 + fresh[e]
                best = total if total > best
              end
              c = a[i]
              if (mask >> c) & 1 == 0
                if size < k
                  mask |= 1 << c
                  size += 1
                else
                  done += 1
                  mask = 1 << c
                  size = 1
                end
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Maximize Consecutive Elements in an Array After Modification (LC 3041) ──
  (() => {
    // Brute force over every subset of elements to bump by one.
    const ref = (nums: number[]) => {
      const n = nums.length;
      let best = 0;
      for (let m = 0; m < 1 << n; m++) {
        const vals = Array.from(new Set(nums.map((v, i) => v + ((m >> i) & 1)))).sort((x, y) => x - y);
        let run = 1;
        for (let i = 0; i < vals.length; i++) {
          run = i > 0 && vals[i] === vals[i - 1] + 1 ? run + 1 : 1;
          if (run > best) best = run;
        }
      }
      return best;
    };
    return {
      slug: "maximize-consecutive-elements-in-an-array-after-modification",
      title: "Maximize Consecutive Elements in an Array After Modification",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Sorting", "Google"],
      signature: { funcName: "maxSelectedElements", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of positive integers. First, you may increase the value of **any** element by at most `1` (each element independently: by 0 or by 1).\n\nThen select one or more elements from the modified array such that, once sorted, they are **consecutive** — each one exactly one more than the previous. For example `[3, 4, 5]` is consecutive, while `[3, 4, 6]` and `[1, 1, 2, 3]` are not.\n\nReturn the **maximum** number of elements you can select.",
        [
          { in: "nums = [2,1,5,1,1]", out: String(ref([2, 1, 5, 1, 1])), note: "Bump index 0 to 3 and index 3 to 2: [3,1,5,2,1]. Select 1, 2 and 3." },
          { in: "nums = [1,4,7,10]", out: String(ref([1, 4, 7, 10])), note: "The values are too far apart; any single element works." },
          { in: "nums = [3,3,3]", out: String(ref([3, 3, 3])), note: "Keep one 3 and bump another to 4. The third copy cannot help — a value cannot be selected twice." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^6"]),
      hints: [
        "After sorting, every element can play one of two values: `x` or `x + 1`.",
        "Let `dp[v]` be the longest consecutive run that ends exactly at value `v` using the elements seen so far.",
        "Process elements in sorted order. For each `x`, first set `dp[x + 1] = dp[x] + 1` (use it as `x + 1`), then `dp[x] = dp[x - 1] + 1` (use it as `x`). The order matters: the second update must not feed the first.",
      ],
      editorial: explain({
        idea: "Sort the array; then a run of consecutive values can be built by scanning elements in order, each element extending a run either as itself or as itself plus one. A hash map from the run's last value to its best length captures every choice.",
        steps: [
          "Sort `nums`.",
          "Keep a map `dp` (missing keys are 0). For each `x` in sorted order: `dp[x + 1] = dp[x] + 1`, then `dp[x] = dp[x - 1] + 1`.",
          "Track the maximum value written; that is the answer.",
        ],
        why: "In a chosen run, sort the selected elements by value; their original values are non-decreasing too, because each final value is the original or one more and finals are strictly increasing by one. So processing elements in sorted order sees every run's elements in run order, and each element can only extend a run ending at `x - 1` (as `x`) or at `x` (as `x + 1`). Updating `x + 1` first uses the value of `dp[x]` from earlier elements, so one element never counts twice.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Updating `dp[x]` before `dp[x + 1]` lets one element be used both as `x` and `x + 1`.",
          "Duplicate values are common — a sorted run of equal elements can supply both `x` and `x + 1`, but never more than that.",
          "An array indexed up to `10^6 + 2` works too, but a hash map avoids allocating it per test.",
        ],
      }),
      examples: [
        { input: "[2,1,5,1,1]", expectedOutput: String(ref([2, 1, 5, 1, 1])) },
        { input: "[1,4,7,10]", expectedOutput: String(ref([1, 4, 7, 10])) },
        { input: "[3,3,3]", expectedOutput: String(ref([3, 3, 3])) },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 8, 11]));
        const top = pick(rng, [2, 6, 15, 1000000]);
        const base = top === 1000000 ? ri(rng, 1, 999980) : 1;
        const nums = Array.from({ length: n }, () => (top === 1000000 ? base + ri(rng, 0, 20) : ri(rng, 1, top)));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxSelectedElements(nums: List[int]) -> int:
              dp = {}
              best = 0
              for x in sorted(nums):
                  dp[x + 1] = dp.get(x, 0) + 1
                  dp[x] = dp.get(x - 1, 0) + 1
                  best = max(best, dp[x], dp[x + 1])
              return best
        `,
        javascript: code`
          var maxSelectedElements = function(nums) {
              var a = nums.slice().sort(function(p, q) { return p - q; });
              var dp = new Map(), best = 0;
              for (var i = 0; i < a.length; i++) {
                  var x = a[i];
                  var up = (dp.get(x) || 0) + 1;
                  dp.set(x + 1, up);
                  var here = (dp.get(x - 1) || 0) + 1;
                  dp.set(x, here);
                  best = Math.max(best, up, here);
              }
              return best;
          };
        `,
        typescript: code`
          function maxSelectedElements(nums: number[]): number {
              var a = nums.slice().sort(function(p, q) { return p - q; });
              var dp: { [key: number]: number } = {};
              var best = 0;
              for (var i = 0; i < a.length; i++) {
                  var x = a[i];
                  var up = (dp[x] || 0) + 1;
                  dp[x + 1] = up;
                  var here = (dp[x - 1] || 0) + 1;
                  dp[x] = here;
                  best = Math.max(best, up, here);
              }
              return best;
          }
        `,
        java: code`
          public static int maxSelectedElements(int[] nums) {
              int[] a = nums.clone();
              Arrays.sort(a);
              HashMap<Integer, Integer> dp = new HashMap<>();
              int best = 0;
              for (int x : a) {
                  int up = dp.getOrDefault(x, 0) + 1;
                  dp.put(x + 1, up);
                  int here = dp.getOrDefault(x - 1, 0) + 1;
                  dp.put(x, here);
                  best = Math.max(best, Math.max(up, here));
              }
              return best;
          }
        `,
        cpp: code`
          int maxSelectedElements(vector<int>& nums) {
              vector<int> a = nums;
              sort(a.begin(), a.end());
              unordered_map<int, int> dp;
              int best = 0;
              for (int x : a) {
                  int up = (dp.count(x) ? dp[x] : 0) + 1;
                  dp[x + 1] = up;
                  int here = (dp.count(x - 1) ? dp[x - 1] : 0) + 1;
                  dp[x] = here;
                  best = max(best, max(up, here));
              }
              return best;
          }
        `,
        c: code`
          static int cmpInt(const void* p, const void* q) {
              int a = *(const int*) p, b = *(const int*) q;
              return (a > b) - (a < b);
          }

          // Index of value v in the sorted distinct key list (every key looked up exists).
          static int keyIndex(const int* keys, int m, int v) {
              int lo = 0, hi = m - 1;
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (keys[mid] < v) lo = mid + 1; else hi = mid;
              }
              return keys[lo] == v ? lo : -1;
          }

          int maxSelectedElements(int* nums, int numsSize) {
              int n = numsSize;
              int* a = (int*) malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) a[i] = nums[i];
              qsort(a, n, sizeof(int), cmpInt);
              // dp is only ever read or written at x - 1, x and x + 1 for some x in nums.
              int* keys = (int*) malloc(sizeof(int) * 3 * n);
              for (int i = 0; i < n; i++) { keys[3 * i] = a[i] - 1; keys[3 * i + 1] = a[i]; keys[3 * i + 2] = a[i] + 1; }
              qsort(keys, 3 * n, sizeof(int), cmpInt);
              int m = 0;
              for (int i = 0; i < 3 * n; i++) if (m == 0 || keys[m - 1] != keys[i]) keys[m++] = keys[i];
              int* dp = (int*) calloc((size_t) m, sizeof(int));
              int best = 0;
              for (int i = 0; i < n; i++) {
                  int x = a[i];
                  int ix = keyIndex(keys, m, x), iu = keyIndex(keys, m, x + 1), il = keyIndex(keys, m, x - 1);
                  int up = dp[ix] + 1;
                  dp[iu] = up;
                  int here = dp[il] + 1;
                  dp[ix] = here;
                  if (up > best) best = up;
                  if (here > best) best = here;
              }
              free(a); free(keys); free(dp);
              return best;
          }
        `,
        csharp: code`
          public static int MaxSelectedElements(int[] nums)
          {
              int[] a = (int[]) nums.Clone();
              Array.Sort(a);
              var dp = new Dictionary<int, int>();
              int best = 0;
              foreach (int x in a)
              {
                  int cur;
                  int up = (dp.TryGetValue(x, out cur) ? cur : 0) + 1;
                  dp[x + 1] = up;
                  int here = (dp.TryGetValue(x - 1, out cur) ? cur : 0) + 1;
                  dp[x] = here;
                  best = Math.Max(best, Math.Max(up, here));
              }
              return best;
          }
        `,
        go: code`
          func maxSelectedElements(nums []int) int {
              a := append([]int(nil), nums...)
              sort.Ints(a)
              dp := map[int]int{}
              best := 0
              for _, x := range a {
                  up := dp[x] + 1
                  dp[x+1] = up
                  here := dp[x-1] + 1
                  dp[x] = here
                  if up > best {
                      best = up
                  }
                  if here > best {
                      best = here
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxSelectedElements(nums: IntArray): Int {
              val a = nums.sortedArray()
              val dp = HashMap<Int, Int>()
              var best = 0
              for (x in a) {
                  val up = (dp[x] ?: 0) + 1
                  dp[x + 1] = up
                  val here = (dp[x - 1] ?: 0) + 1
                  dp[x] = here
                  best = maxOf(best, up, here)
              }
              return best
          }
        `,
        swift: code`
          func maxSelectedElements(_ nums: [Int]) -> Int {
              var dp = [Int: Int]()
              var best = 0
              for x in nums.sorted() {
                  let up = (dp[x] ?? 0) + 1
                  dp[x + 1] = up
                  let here = (dp[x - 1] ?? 0) + 1
                  dp[x] = here
                  best = max(best, max(up, here))
              }
              return best
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn maxSelectedElements(nums: Vec<i32>) -> i32 {
              let mut a = nums.clone();
              a.sort();
              let mut dp: HashMap<i32, i32> = HashMap::new();
              let mut best = 0;
              for &x in &a {
                  let up = dp.get(&x).copied().unwrap_or(0) + 1;
                  dp.insert(x + 1, up);
                  let here = dp.get(&(x - 1)).copied().unwrap_or(0) + 1;
                  dp.insert(x, here);
                  best = best.max(up).max(here);
              }
              best
          }
        `,
        php: code`
          function maxSelectedElements($nums) {
              sort($nums);
              $dp = [];
              $best = 0;
              foreach ($nums as $x) {
                  $up = ($dp[$x] ?? 0) + 1;
                  $dp[$x + 1] = $up;
                  $here = ($dp[$x - 1] ?? 0) + 1;
                  $dp[$x] = $here;
                  $best = max($best, $up, $here);
              }
              return $best;
          }
        `,
        ruby: code`
          def maxSelectedElements(nums)
            dp = Hash.new(0)
            best = 0
            nums.sort.each do |x|
              up = dp[x] + 1
              dp[x + 1] = up
              here = dp[x - 1] + 1
              dp[x] = here
              best = [best, up, here].max
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Find the Sum of the Power of All Subsequences (LC 3082) ─────
  (() => {
    const MOD = 1000000007;
    // Brute force: every subset T summing to k sits inside 2^(n - |T|)
    // subsequences, each of which counts it once.
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      const pw = [1];
      for (let i = 1; i <= n; i++) pw.push((pw[i - 1] * 2) % MOD);
      let ans = 0;
      for (let m = 0; m < 1 << n; m++) {
        let s = 0, c = 0;
        for (let i = 0; i < n; i++) if ((m >> i) & 1) { s += nums[i]; c++; }
        if (s === k) ans = (ans + pw[n - c]) % MOD;
      }
      return ans;
    };
    return {
      slug: "find-the-sum-of-the-power-of-all-subsequences",
      title: "Find the Sum of the Power of All Subsequences",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "sumOfPower",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an integer array `nums` of length `n` and a positive integer `k`.\n\nThe **power** of an array is the number of its subsequences whose elements sum to exactly `k`. (Subsequences are chosen by index, so equal values at different positions give different subsequences.)\n\nReturn the sum of the power of **all** subsequences of `nums`. Since the answer may be very large, return it **modulo** `10^9 + 7`.",
        [
          { in: "nums = [1,2,3], k = 3", out: String(ref([1, 2, 3], 3)), note: "The subsets summing to 3 are [3] and [1,2]. [3] lies inside 4 subsequences of nums and [1,2] inside 2, so the total is 6." },
          { in: "nums = [2,3,3], k = 5", out: String(ref([2, 3, 3], 5)), note: "[2,3] using either 3 sums to 5, and each lies inside 2 subsequences: 4." },
          { in: "nums = [1,2,3], k = 7", out: String(ref([1, 2, 3], 7)), note: "Nothing sums to 7." },
        ],
        ["1 <= n <= 100", "1 <= nums[i] <= 10^4", "1 <= k <= 100"]),
      hints: [
        "Swap the order of counting: instead of looping over outer subsequences, count each inner subset `T` with sum `k` by how many outer subsequences contain it.",
        "A subset `T` of size `t` is contained in `2^(n - t)` subsequences — every other element is free to be in or out.",
        "Knapsack DP over sums: for each element there are three fates — not in the outer subsequence, in the outer but not in `T`, or in `T`. So `dp[j] = 2 · dp[j] + dp[j - x]`.",
      ],
      editorial: explain({
        idea: "The answer counts pairs (outer subsequence S, inner subset T ⊆ S with sum k). Each element independently is outside S, inside S but not in T, or in T — so a knapsack over the sum of T, with weight 2 for the first two fates and a shift for the third, counts every pair once.",
        steps: [
          "Let `dp[j]` count pairs (S, T) over the elements processed so far where T sums to `j`; start with `dp[0] = 1`.",
          "For each `x`, update `j` from `k` down to 0: `dp[j] = 2 · dp[j] + (j ≥ x ? dp[j - x] : 0)`, modulo `10^9 + 7`.",
          "Return `dp[k]`.",
        ],
        why: "The power summed over all S is the number of pairs (S, T) with T ⊆ S and sum(T) = k. Deciding each element's fate independently enumerates every such pair exactly once: \"not in T\" happens in two ways (in S or not), \"in T\" in one way and adds `x` to the sum. Iterating `j` downwards keeps `dp[j - x]` from the previous element.",
        time: "O(n · k)",
        space: "O(k)",
        pitfalls: [
          "Values larger than `k` can never be in T but still double every count.",
          "`dp[0]` keeps doubling (it counts pairs with empty T) — do not skip `j = 0`.",
          "Reduce modulo `10^9 + 7` at every step; `2 · dp[j] + dp[j - x]` stays below `2^32`, so 64-bit arithmetic is enough.",
        ],
      }),
      examples: [
        { input: "[1,2,3]\n3", expectedOutput: String(ref([1, 2, 3], 3)) },
        { input: "[2,3,3]\n5", expectedOutput: String(ref([2, 3, 3], 5)) },
        { input: "[1,2,3]\n7", expectedOutput: String(ref([1, 2, 3], 7)) },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 10, 14]));
        const top = pick(rng, [1, 3, 10, 50, 10000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const k = ri(rng, 1, pick(rng, [5, 20, 100]));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def sumOfPower(nums: List[int], k: int) -> int:
              MOD = 10**9 + 7
              dp = [0] * (k + 1)
              dp[0] = 1
              for x in nums:
                  for j in range(k, -1, -1):
                      dp[j] = (2 * dp[j] + (dp[j - x] if j >= x else 0)) % MOD
              return dp[k]
        `,
        javascript: code`
          var sumOfPower = function(nums, k) {
              var MOD = 1000000007;
              var dp = new Array(k + 1).fill(0);
              dp[0] = 1;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i];
                  for (var j = k; j >= 0; j--) dp[j] = (2 * dp[j] + (j >= x ? dp[j - x] : 0)) % MOD;
              }
              return dp[k];
          };
        `,
        typescript: code`
          function sumOfPower(nums: number[], k: number): number {
              var MOD = 1000000007;
              var dp: number[] = [];
              for (var j = 0; j <= k; j++) dp.push(0);
              dp[0] = 1;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i];
                  for (var j = k; j >= 0; j--) dp[j] = (2 * dp[j] + (j >= x ? dp[j - x] : 0)) % MOD;
              }
              return dp[k];
          }
        `,
        java: code`
          public static int sumOfPower(int[] nums, int k) {
              final long MOD = 1000000007L;
              long[] dp = new long[k + 1];
              dp[0] = 1;
              for (int x : nums) {
                  for (int j = k; j >= 0; j--) dp[j] = (2 * dp[j] + (j >= x ? dp[j - x] : 0)) % MOD;
              }
              return (int) dp[k];
          }
        `,
        cpp: code`
          int sumOfPower(vector<int>& nums, int k) {
              const long long MOD = 1000000007LL;
              vector<long long> dp(k + 1, 0);
              dp[0] = 1;
              for (int x : nums) {
                  for (int j = k; j >= 0; j--) dp[j] = (2 * dp[j] + (j >= x ? dp[j - x] : 0)) % MOD;
              }
              return (int) dp[k];
          }
        `,
        c: code`
          int sumOfPower(int* nums, int numsSize, int k) {
              const long long MOD = 1000000007LL;
              long long* dp = (long long*) calloc((size_t) k + 1, sizeof(long long));
              dp[0] = 1;
              for (int i = 0; i < numsSize; i++) {
                  int x = nums[i];
                  for (int j = k; j >= 0; j--) dp[j] = (2 * dp[j] + (j >= x ? dp[j - x] : 0)) % MOD;
              }
              int ans = (int) dp[k];
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int SumOfPower(int[] nums, int k)
          {
              const long MOD = 1000000007L;
              long[] dp = new long[k + 1];
              dp[0] = 1;
              foreach (int x in nums)
              {
                  for (int j = k; j >= 0; j--) dp[j] = (2 * dp[j] + (j >= x ? dp[j - x] : 0)) % MOD;
              }
              return (int) dp[k];
          }
        `,
        go: code`
          func sumOfPower(nums []int, k int) int {
              const mod = 1000000007
              dp := make([]int, k+1)
              dp[0] = 1
              for _, x := range nums {
                  for j := k; j >= 0; j-- {
                      add := 0
                      if j >= x {
                          add = dp[j-x]
                      }
                      dp[j] = (2*dp[j] + add) % mod
                  }
              }
              return dp[k]
          }
        `,
        kotlin: code`
          fun sumOfPower(nums: IntArray, k: Int): Int {
              val modulus = 1000000007L
              val dp = LongArray(k + 1)
              dp[0] = 1L
              for (x in nums) {
                  for (j in k downTo 0) dp[j] = (2 * dp[j] + (if (j >= x) dp[j - x] else 0L)) % modulus
              }
              return dp[k].toInt()
          }
        `,
        swift: code`
          func sumOfPower(_ nums: [Int], _ k: Int) -> Int {
              let mod = 1000000007
              var dp = [Int](repeating: 0, count: k + 1)
              dp[0] = 1
              for x in nums {
                  var j = k
                  while j >= 0 {
                      dp[j] = (2 * dp[j] + (j >= x ? dp[j - x] : 0)) % mod
                      j -= 1
                  }
              }
              return dp[k]
          }
        `,
        rust: code`
          fn sumOfPower(nums: Vec<i32>, k: i32) -> i32 {
              const MOD: i64 = 1_000_000_007;
              let k = k as usize;
              let mut dp = vec![0i64; k + 1];
              dp[0] = 1;
              for &x in &nums {
                  let x = x as usize;
                  for j in (0..=k).rev() {
                      let add = if j >= x { dp[j - x] } else { 0 };
                      dp[j] = (2 * dp[j] + add) % MOD;
                  }
              }
              dp[k] as i32
          }
        `,
        php: code`
          function sumOfPower($nums, $k) {
              $MOD = 1000000007;
              $dp = array_fill(0, $k + 1, 0);
              $dp[0] = 1;
              foreach ($nums as $x) {
                  for ($j = $k; $j >= 0; $j--) $dp[$j] = (2 * $dp[$j] + ($j >= $x ? $dp[$j - $x] : 0)) % $MOD;
              }
              return $dp[$k];
          }
        `,
        ruby: code`
          def sumOfPower(nums, k)
            mod = 1_000_000_007
            dp = Array.new(k + 1, 0)
            dp[0] = 1
            nums.each do |x|
              k.downto(0) do |j|
                dp[j] = (2 * dp[j] + (j >= x ? dp[j - x] : 0)) % mod
              end
            end
            dp[k]
          end
        `,
      },
    };
  })(),

  // ── Find the Sum of Subsequence Powers (LC 3098) ────────────────
  (() => {
    const MOD = 1000000007;
    // Brute force over every k-element subsequence.
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      let total = 0;
      const pickIdx: number[] = [];
      const rec = (start: number) => {
        if (pickIdx.length === k) {
          let mn = Infinity;
          for (let i = 0; i < k; i++) for (let j = i + 1; j < k; j++) mn = Math.min(mn, Math.abs(nums[pickIdx[i]] - nums[pickIdx[j]]));
          total = (total + mn) % MOD;
          return;
        }
        for (let i = start; i <= n - (k - pickIdx.length); i++) { pickIdx.push(i); rec(i + 1); pickIdx.pop(); }
      };
      rec(0);
      return total;
    };
    return {
      slug: "find-the-sum-of-subsequence-powers",
      title: "Find the Sum of Subsequence Powers",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Sorting", "Google"],
      signature: {
        funcName: "sumOfPowers",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an integer array `nums` of length `n` and a positive integer `k`.\n\nThe **power** of a subsequence is the **minimum** absolute difference between any two of its elements.\n\nReturn the sum of the powers of **all** subsequences of `nums` that have length exactly `k`. Since the answer may be large, return it **modulo** `10^9 + 7`.",
        [
          { in: "nums = [1,2,3,4], k = 3", out: String(ref([1, 2, 3, 4], 3)), note: "[1,2,3], [1,3,4], [1,2,4] and [2,3,4] each have power 1." },
          { in: "nums = [2,2], k = 2", out: String(ref([2, 2], 2)), note: "The only subsequence has two equal elements, so its power is 0." },
          { in: "nums = [4,3,-1], k = 2", out: String(ref([4, 3, -1], 2)), note: "[4,3] has power 1, [4,-1] has 5 and [3,-1] has 4: 10 in total." },
        ],
        ["2 <= n == nums.length <= 50", "-10^8 <= nums[i] <= 10^8", "2 <= k <= n"]),
      hints: [
        "Sort the array: a subsequence's minimum absolute difference is then the minimum gap between neighbours in it.",
        "Counting subsequences whose power is **exactly** `d` is hard; counting those whose power is **at least** `d` is easy — every adjacent gap must be at least `d`.",
        "The power is always one of the `O(n^2)` pairwise differences. With `C(d)` = number of length-`k` subsequences with all gaps ≥ `d`, sort the distinct differences `d_1 < d_2 < …`; exactly `C(d_t) − C(d_{t+1})` subsequences have power `d_t`. Compute each `C(d)` with a prefix-sum DP in `O(n · k)`.",
      ],
      editorial: explain({
        idea: "After sorting, the power of a subsequence is its smallest gap between neighbours, and it is always one of the pairwise differences. Counting subsequences with every gap at least `d` is a simple DP; differences of those counts at consecutive candidate values give the exact count for each power.",
        steps: [
          "Sort `nums` into `a`. Collect the distinct pairwise differences `D_1 < D_2 < … < D_m`.",
          "For a threshold `d`, let `f[j][i]` be the number of length-`j` subsequences ending at index `i` with every gap ≥ `d`: `f[1][i] = 1`, and `f[j][i]` = sum of `f[j-1][p]` over `p < i` with `a[i] − a[p] ≥ d`. Those `p` form a prefix of the indices, so a pointer plus prefix sums gives each layer in `O(n)`.",
          "`C(d) = Σ_i f[k][i]`. Compute `C(D_t)` for every `t`, with `C(D_{m+1}) = 0`.",
          "Return `Σ_t D_t · (C(D_t) − C(D_{t+1}))` modulo `10^9 + 7`.",
        ],
        why: "A subsequence has power exactly `D_t` when its gaps are all at least `D_t` but not all at least the next candidate `D_{t+1}`; since its power is one of the candidates, nothing lies strictly between. So `C(D_t) − C(D_{t+1})` counts it exactly once, and weighting by `D_t` sums the powers.",
        time: "O(n^3 · k) — O(n^2) thresholds, O(n · k) each",
        space: "O(n^2)",
        pitfalls: [
          "Equal elements give a difference of 0, which is a valid power.",
          "`D_t` (up to `2 · 10^8`) times a count modulo `10^9 + 7` overflows 32 bits — and 2^53 in JavaScript, so split the multiplication there.",
          "Keep the difference of counts non-negative under the modulus.",
        ],
      }),
      examples: [
        { input: "[1,2,3,4]\n3", expectedOutput: String(ref([1, 2, 3, 4], 3)) },
        { input: "[2,2]\n2", expectedOutput: String(ref([2, 2], 2)) },
        { input: "[4,3,-1]\n2", expectedOutput: String(ref([4, 3, -1], 2)) },
      ],
      hiddenCount: 1000,
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 5, 9, 12]));
        const k = ri(rng, 2, n);
        const span = pick(rng, [3, 20, 1000, 100000000]);
        const nums = Array.from({ length: n }, () => ri(rng, -span, span));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def sumOfPowers(nums: List[int], k: int) -> int:
              MOD = 10**9 + 7
              a = sorted(nums)
              n = len(a)
              diffs = sorted(set(a[j] - a[i] for i in range(n) for j in range(i + 1, n)))

              def count(d):
                  # length-k subsequences whose adjacent gaps are all >= d
                  dp = [1] * n
                  for _ in range(k - 1):
                      pre = [0] * (n + 1)
                      for i in range(n):
                          pre[i + 1] = (pre[i] + dp[i]) % MOD
                      nd = [0] * n
                      p = 0
                      for i in range(n):
                          while p < i and a[i] - a[p] >= d:
                              p += 1
                          nd[i] = pre[p]
                      dp = nd
                  return sum(dp) % MOD

              counts = [count(d) for d in diffs] + [0]
              ans = 0
              for t, d in enumerate(diffs):
                  ans = (ans + d * (counts[t] - counts[t + 1])) % MOD
              return ans
        `,
        javascript: code`
          var sumOfPowers = function(nums, k) {
              var MOD = 1000000007;
              var mulmod = function(a, b) {
                  return ((a * (b >>> 16)) % MOD * 65536 + a * (b & 65535)) % MOD;
              };
              var a = nums.slice().sort(function(p, q) { return p - q; });
              var n = a.length;
              var all = [];
              for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) all.push(a[j] - a[i]);
              all.sort(function(p, q) { return p - q; });
              var diffs = [];
              for (var i = 0; i < all.length; i++) if (i === 0 || all[i] !== all[i - 1]) diffs.push(all[i]);
              var count = function(d) {
                  // length-k subsequences whose adjacent gaps are all >= d
                  var dp = new Array(n).fill(1);
                  for (var len = 1; len < k; len++) {
                      var pre = new Array(n + 1).fill(0);
                      for (var i = 0; i < n; i++) pre[i + 1] = (pre[i] + dp[i]) % MOD;
                      var nd = new Array(n).fill(0), p = 0;
                      for (var i = 0; i < n; i++) {
                          while (p < i && a[i] - a[p] >= d) p++;
                          nd[i] = pre[p];
                      }
                      dp = nd;
                  }
                  var s = 0;
                  for (var i = 0; i < n; i++) s = (s + dp[i]) % MOD;
                  return s;
              };
              var counts = [];
              for (var t = 0; t < diffs.length; t++) counts.push(count(diffs[t]));
              counts.push(0);
              var ans = 0;
              for (var t = 0; t < diffs.length; t++) {
                  var exact = (counts[t] - counts[t + 1] + MOD) % MOD;
                  ans = (ans + mulmod(diffs[t], exact)) % MOD;
              }
              return ans;
          };
        `,
        typescript: code`
          var MOD_POW = 1000000007;

          function mulmodPow(a: number, b: number): number {
              return ((a * (b >>> 16)) % MOD_POW * 65536 + a * (b & 65535)) % MOD_POW;
          }

          // length-k subsequences of sorted a whose adjacent gaps are all >= d
          function countGapsAtLeast(a: number[], k: number, d: number): number {
              var n = a.length;
              var dp: number[] = [];
              for (var i = 0; i < n; i++) dp.push(1);
              for (var len = 1; len < k; len++) {
                  var pre: number[] = [0];
                  for (var i = 0; i < n; i++) pre.push((pre[i] + dp[i]) % MOD_POW);
                  var nd: number[] = [], p = 0;
                  for (var i = 0; i < n; i++) {
                      while (p < i && a[i] - a[p] >= d) p++;
                      nd.push(pre[p]);
                  }
                  dp = nd;
              }
              var s = 0;
              for (var i = 0; i < n; i++) s = (s + dp[i]) % MOD_POW;
              return s;
          }

          function sumOfPowers(nums: number[], k: number): number {
              var a = nums.slice().sort(function(p, q) { return p - q; });
              var n = a.length;
              var all: number[] = [];
              for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) all.push(a[j] - a[i]);
              all.sort(function(p, q) { return p - q; });
              var diffs: number[] = [];
              for (var i = 0; i < all.length; i++) if (i === 0 || all[i] !== all[i - 1]) diffs.push(all[i]);
              var counts: number[] = [];
              for (var t = 0; t < diffs.length; t++) counts.push(countGapsAtLeast(a, k, diffs[t]));
              counts.push(0);
              var ans = 0;
              for (var t = 0; t < diffs.length; t++) {
                  var exact = (counts[t] - counts[t + 1] + MOD_POW) % MOD_POW;
                  ans = (ans + mulmodPow(diffs[t], exact)) % MOD_POW;
              }
              return ans;
          }
        `,
        java: code`
          static final long MOD = 1000000007L;

          // length-k subsequences of sorted a whose adjacent gaps are all >= d
          static long countGapsAtLeast(int[] a, int k, long d) {
              int n = a.length;
              long[] dp = new long[n];
              Arrays.fill(dp, 1);
              for (int len = 1; len < k; len++) {
                  long[] pre = new long[n + 1];
                  for (int i = 0; i < n; i++) pre[i + 1] = (pre[i] + dp[i]) % MOD;
                  long[] nd = new long[n];
                  int p = 0;
                  for (int i = 0; i < n; i++) {
                      while (p < i && (long) a[i] - a[p] >= d) p++;
                      nd[i] = pre[p];
                  }
                  dp = nd;
              }
              long s = 0;
              for (long v : dp) s = (s + v) % MOD;
              return s;
          }

          public static int sumOfPowers(int[] nums, int k) {
              int[] a = nums.clone();
              Arrays.sort(a);
              int n = a.length;
              TreeSet<Long> set = new TreeSet<>();
              for (int i = 0; i < n; i++) for (int j = i + 1; j < n; j++) set.add((long) a[j] - a[i]);
              long[] diffs = new long[set.size()];
              int m = 0;
              for (long d : set) diffs[m++] = d;
              long[] counts = new long[m + 1];
              for (int t = 0; t < m; t++) counts[t] = countGapsAtLeast(a, k, diffs[t]);
              long ans = 0;
              for (int t = 0; t < m; t++) {
                  long exact = (counts[t] - counts[t + 1] + MOD) % MOD;
                  ans = (ans + diffs[t] % MOD * exact) % MOD;
              }
              return (int) ans;
          }
        `,
        cpp: code`
          const long long MOD = 1000000007LL;

          // length-k subsequences of sorted a whose adjacent gaps are all >= d
          long long countGapsAtLeast(const vector<long long>& a, int k, long long d) {
              int n = a.size();
              vector<long long> dp(n, 1);
              for (int len = 1; len < k; len++) {
                  vector<long long> pre(n + 1, 0), nd(n, 0);
                  for (int i = 0; i < n; i++) pre[i + 1] = (pre[i] + dp[i]) % MOD;
                  int p = 0;
                  for (int i = 0; i < n; i++) {
                      while (p < i && a[i] - a[p] >= d) p++;
                      nd[i] = pre[p];
                  }
                  dp = nd;
              }
              long long s = 0;
              for (long long v : dp) s = (s + v) % MOD;
              return s;
          }

          int sumOfPowers(vector<int>& nums, int k) {
              vector<long long> a(nums.begin(), nums.end());
              sort(a.begin(), a.end());
              int n = a.size();
              vector<long long> diffs;
              for (int i = 0; i < n; i++) for (int j = i + 1; j < n; j++) diffs.push_back(a[j] - a[i]);
              sort(diffs.begin(), diffs.end());
              diffs.erase(unique(diffs.begin(), diffs.end()), diffs.end());
              int m = diffs.size();
              vector<long long> counts(m + 1, 0);
              for (int t = 0; t < m; t++) counts[t] = countGapsAtLeast(a, k, diffs[t]);
              long long ans = 0;
              for (int t = 0; t < m; t++) {
                  long long exact = (counts[t] - counts[t + 1] + MOD) % MOD;
                  ans = (ans + diffs[t] % MOD * exact) % MOD;
              }
              return (int) ans;
          }
        `,
        c: code`
          static const long long MOD = 1000000007LL;

          static int cmpLL(const void* p, const void* q) {
              long long a = *(const long long*) p, b = *(const long long*) q;
              return (a > b) - (a < b);
          }

          // length-k subsequences of sorted a whose adjacent gaps are all >= d
          static long long countGapsAtLeast(const long long* a, int n, int k, long long d, long long* dp, long long* nd, long long* pre) {
              for (int i = 0; i < n; i++) dp[i] = 1;
              for (int len = 1; len < k; len++) {
                  pre[0] = 0;
                  for (int i = 0; i < n; i++) pre[i + 1] = (pre[i] + dp[i]) % MOD;
                  int p = 0;
                  for (int i = 0; i < n; i++) {
                      while (p < i && a[i] - a[p] >= d) p++;
                      nd[i] = pre[p];
                  }
                  for (int i = 0; i < n; i++) dp[i] = nd[i];
              }
              long long s = 0;
              for (int i = 0; i < n; i++) s = (s + dp[i]) % MOD;
              return s;
          }

          int sumOfPowers(int* nums, int numsSize, int k) {
              int n = numsSize;
              long long* a = (long long*) malloc(sizeof(long long) * n);
              for (int i = 0; i < n; i++) a[i] = nums[i];
              qsort(a, n, sizeof(long long), cmpLL);
              int total = n * (n - 1) / 2;
              long long* diffs = (long long*) malloc(sizeof(long long) * (total + 1));
              int m = 0;
              for (int i = 0; i < n; i++) for (int j = i + 1; j < n; j++) diffs[m++] = a[j] - a[i];
              qsort(diffs, m, sizeof(long long), cmpLL);
              int u = 0;
              for (int i = 0; i < m; i++) if (u == 0 || diffs[u - 1] != diffs[i]) diffs[u++] = diffs[i];
              long long* counts = (long long*) calloc((size_t) u + 1, sizeof(long long));
              long long* dp = (long long*) malloc(sizeof(long long) * n);
              long long* nd = (long long*) malloc(sizeof(long long) * n);
              long long* pre = (long long*) malloc(sizeof(long long) * (n + 1));
              for (int t = 0; t < u; t++) counts[t] = countGapsAtLeast(a, n, k, diffs[t], dp, nd, pre);
              long long ans = 0;
              for (int t = 0; t < u; t++) {
                  long long exact = (counts[t] - counts[t + 1] + MOD) % MOD;
                  ans = (ans + diffs[t] % MOD * exact) % MOD;
              }
              free(a); free(diffs); free(counts); free(dp); free(nd); free(pre);
              return (int) ans;
          }
        `,
        csharp: code`
          const long MOD = 1000000007L;

          // length-k subsequences of sorted a whose adjacent gaps are all >= d
          static long CountGapsAtLeast(long[] a, int k, long d)
          {
              int n = a.Length;
              long[] dp = new long[n];
              for (int i = 0; i < n; i++) dp[i] = 1;
              for (int len = 1; len < k; len++)
              {
                  long[] pre = new long[n + 1], nd = new long[n];
                  for (int i = 0; i < n; i++) pre[i + 1] = (pre[i] + dp[i]) % MOD;
                  int p = 0;
                  for (int i = 0; i < n; i++)
                  {
                      while (p < i && a[i] - a[p] >= d) p++;
                      nd[i] = pre[p];
                  }
                  dp = nd;
              }
              long s = 0;
              foreach (long v in dp) s = (s + v) % MOD;
              return s;
          }

          public static int SumOfPowers(int[] nums, int k)
          {
              long[] a = nums.Select(x => (long) x).ToArray();
              Array.Sort(a);
              int n = a.Length;
              var set = new SortedSet<long>();
              for (int i = 0; i < n; i++) for (int j = i + 1; j < n; j++) set.Add(a[j] - a[i]);
              long[] diffs = set.ToArray();
              int m = diffs.Length;
              long[] counts = new long[m + 1];
              for (int t = 0; t < m; t++) counts[t] = CountGapsAtLeast(a, k, diffs[t]);
              long ans = 0;
              for (int t = 0; t < m; t++)
              {
                  long exact = (counts[t] - counts[t + 1] + MOD) % MOD;
                  ans = (ans + diffs[t] % MOD * exact) % MOD;
              }
              return (int) ans;
          }
        `,
        go: code`
          const powMod = 1000000007

          // length-k subsequences of sorted a whose adjacent gaps are all >= d
          func countGapsAtLeast(a []int, k int, d int) int {
              n := len(a)
              dp := make([]int, n)
              for i := range dp {
                  dp[i] = 1
              }
              for length := 1; length < k; length++ {
                  pre := make([]int, n+1)
                  for i := 0; i < n; i++ {
                      pre[i+1] = (pre[i] + dp[i]) % powMod
                  }
                  nd := make([]int, n)
                  p := 0
                  for i := 0; i < n; i++ {
                      for p < i && a[i]-a[p] >= d {
                          p++
                      }
                      nd[i] = pre[p]
                  }
                  dp = nd
              }
              s := 0
              for _, v := range dp {
                  s = (s + v) % powMod
              }
              return s
          }

          func sumOfPowers(nums []int, k int) int {
              a := append([]int(nil), nums...)
              sort.Ints(a)
              n := len(a)
              all := []int{}
              for i := 0; i < n; i++ {
                  for j := i + 1; j < n; j++ {
                      all = append(all, a[j]-a[i])
                  }
              }
              sort.Ints(all)
              diffs := []int{}
              for i, d := range all {
                  if i == 0 || d != all[i-1] {
                      diffs = append(diffs, d)
                  }
              }
              m := len(diffs)
              counts := make([]int, m+1)
              for t := 0; t < m; t++ {
                  counts[t] = countGapsAtLeast(a, k, diffs[t])
              }
              ans := 0
              for t := 0; t < m; t++ {
                  exact := (counts[t] - counts[t+1] + powMod) % powMod
                  ans = (ans + diffs[t]%powMod*exact) % powMod
              }
              return ans
          }
        `,
        kotlin: code`
          const val MOD = 1000000007L

          // length-k subsequences of sorted a whose adjacent gaps are all >= d
          fun countGapsAtLeast(a: LongArray, k: Int, d: Long): Long {
              val n = a.size
              var dp = LongArray(n) { 1L }
              for (len in 1 until k) {
                  val pre = LongArray(n + 1)
                  for (i in 0 until n) pre[i + 1] = (pre[i] + dp[i]) % MOD
                  val nd = LongArray(n)
                  var p = 0
                  for (i in 0 until n) {
                      while (p < i && a[i] - a[p] >= d) p++
                      nd[i] = pre[p]
                  }
                  dp = nd
              }
              var s = 0L
              for (v in dp) s = (s + v) % MOD
              return s
          }

          fun sumOfPowers(nums: IntArray, k: Int): Int {
              val a = LongArray(nums.size) { nums[it].toLong() }
              a.sort()
              val n = a.size
              val set = java.util.TreeSet<Long>()
              for (i in 0 until n) for (j in i + 1 until n) set.add(a[j] - a[i])
              val diffs = set.toLongArray()
              val m = diffs.size
              val counts = LongArray(m + 1)
              for (t in 0 until m) counts[t] = countGapsAtLeast(a, k, diffs[t])
              var ans = 0L
              for (t in 0 until m) {
                  val exact = (counts[t] - counts[t + 1] + MOD) % MOD
                  ans = (ans + diffs[t] % MOD * exact) % MOD
              }
              return ans.toInt()
          }
        `,
        swift: code`
          let powMod = 1000000007

          // length-k subsequences of sorted a whose adjacent gaps are all >= d
          func countGapsAtLeast(_ a: [Int], _ k: Int, _ d: Int) -> Int {
              let n = a.count
              var dp = [Int](repeating: 1, count: n)
              var len = 1
              while len < k {
                  var pre = [Int](repeating: 0, count: n + 1)
                  for i in 0..<n { pre[i + 1] = (pre[i] + dp[i]) % powMod }
                  var nd = [Int](repeating: 0, count: n)
                  var p = 0
                  for i in 0..<n {
                      while p < i && a[i] - a[p] >= d { p += 1 }
                      nd[i] = pre[p]
                  }
                  dp = nd
                  len += 1
              }
              var s = 0
              for v in dp { s = (s + v) % powMod }
              return s
          }

          func sumOfPowers(_ nums: [Int], _ k: Int) -> Int {
              let a = nums.sorted()
              let n = a.count
              var set = Set<Int>()
              for i in 0..<n { for j in (i + 1)..<max(i + 1, n) { set.insert(a[j] - a[i]) } }
              let diffs = set.sorted()
              let m = diffs.count
              var counts = [Int](repeating: 0, count: m + 1)
              for t in 0..<m { counts[t] = countGapsAtLeast(a, k, diffs[t]) }
              var ans = 0
              for t in 0..<m {
                  let exact = (counts[t] - counts[t + 1] + powMod) % powMod
                  ans = (ans + diffs[t] % powMod * exact) % powMod
              }
              return ans
          }
        `,
        rust: code`
          const MOD: i64 = 1_000_000_007;

          // length-k subsequences of sorted a whose adjacent gaps are all >= d
          fn count_gaps_at_least(a: &Vec<i64>, k: usize, d: i64) -> i64 {
              let n = a.len();
              let mut dp = vec![1i64; n];
              for _ in 1..k {
                  let mut pre = vec![0i64; n + 1];
                  for i in 0..n {
                      pre[i + 1] = (pre[i] + dp[i]) % MOD;
                  }
                  let mut nd = vec![0i64; n];
                  let mut p = 0;
                  for i in 0..n {
                      while p < i && a[i] - a[p] >= d {
                          p += 1;
                      }
                      nd[i] = pre[p];
                  }
                  dp = nd;
              }
              dp.iter().fold(0, |s, &v| (s + v) % MOD)
          }

          fn sumOfPowers(nums: Vec<i32>, k: i32) -> i32 {
              let mut a: Vec<i64> = nums.iter().map(|&x| x as i64).collect();
              a.sort();
              let n = a.len();
              let mut diffs = Vec::new();
              for i in 0..n {
                  for j in i + 1..n {
                      diffs.push(a[j] - a[i]);
                  }
              }
              diffs.sort();
              diffs.dedup();
              let m = diffs.len();
              let mut counts = vec![0i64; m + 1];
              for t in 0..m {
                  counts[t] = count_gaps_at_least(&a, k as usize, diffs[t]);
              }
              let mut ans = 0i64;
              for t in 0..m {
                  let exact = (counts[t] - counts[t + 1] + MOD) % MOD;
                  ans = (ans + diffs[t] % MOD * exact) % MOD;
              }
              ans as i32
          }
        `,
        php: code`
          // length-k subsequences of sorted a whose adjacent gaps are all >= d
          function countGapsAtLeast($a, $k, $d) {
              $MOD = 1000000007;
              $n = count($a);
              $dp = array_fill(0, $n, 1);
              for ($len = 1; $len < $k; $len++) {
                  $pre = [0];
                  for ($i = 0; $i < $n; $i++) $pre[] = ($pre[$i] + $dp[$i]) % $MOD;
                  $nd = array_fill(0, $n, 0);
                  $p = 0;
                  for ($i = 0; $i < $n; $i++) {
                      while ($p < $i && $a[$i] - $a[$p] >= $d) $p++;
                      $nd[$i] = $pre[$p];
                  }
                  $dp = $nd;
              }
              $s = 0;
              foreach ($dp as $v) $s = ($s + $v) % $MOD;
              return $s;
          }

          function sumOfPowers($nums, $k) {
              $MOD = 1000000007;
              $a = $nums;
              sort($a);
              $n = count($a);
              $set = [];
              for ($i = 0; $i < $n; $i++) for ($j = $i + 1; $j < $n; $j++) $set[$a[$j] - $a[$i]] = true;
              $diffs = array_keys($set);
              sort($diffs);
              $m = count($diffs);
              $counts = [];
              for ($t = 0; $t < $m; $t++) $counts[] = countGapsAtLeast($a, $k, $diffs[$t]);
              $counts[] = 0;
              $ans = 0;
              for ($t = 0; $t < $m; $t++) {
                  $exact = ($counts[$t] - $counts[$t + 1] + $MOD) % $MOD;
                  $ans = ($ans + $diffs[$t] % $MOD * $exact) % $MOD;
              }
              return $ans;
          }
        `,
        ruby: code`
          # length-k subsequences of sorted a whose adjacent gaps are all >= d
          def count_gaps_at_least(a, k, d)
            mod = 1_000_000_007
            n = a.length
            dp = Array.new(n, 1)
            (k - 1).times do
              pre = [0]
              n.times { |i| pre << (pre[i] + dp[i]) % mod }
              nd = Array.new(n, 0)
              p = 0
              n.times do |i|
                p += 1 while p < i && a[i] - a[p] >= d
                nd[i] = pre[p]
              end
              dp = nd
            end
            dp.sum % mod
          end

          def sumOfPowers(nums, k)
            mod = 1_000_000_007
            a = nums.sort
            n = a.length
            diffs = []
            (0...n).each { |i| (i + 1...n).each { |j| diffs << a[j] - a[i] } }
            diffs = diffs.uniq.sort
            counts = diffs.map { |d| count_gaps_at_least(a, k, d) } + [0]
            ans = 0
            diffs.each_with_index do |d, t|
              ans = (ans + d * (counts[t] - counts[t + 1])) % mod
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Minimum Sum of Values by Dividing Array (LC 3117) ───────────
  (() => {
    // Memoised search over (start, piece index) that tries every end.
    const ref = (nums: number[], andValues: number[]) => {
      const n = nums.length, m = andValues.length;
      const INF = Number.MAX_SAFE_INTEGER;
      const memo = new Map<number, number>();
      const rec = (i: number, j: number): number => {
        if (j === m) return i === n ? 0 : INF;
        const key = i * 16 + j;
        const got = memo.get(key);
        if (got !== undefined) return got;
        let best = INF, acc = -1;
        for (let e = i; e < n; e++) {
          acc &= nums[e];
          if (acc === andValues[j]) {
            const rest = rec(e + 1, j + 1);
            if (rest < INF) best = Math.min(best, nums[e] + rest);
          }
        }
        memo.set(key, best);
        return best;
      };
      const r = rec(0, 0);
      return r === INF ? -1 : r;
    };
    const genAnd = (rng: Rng, nums: number[], m: number) => {
      const n = nums.length;
      const cuts = shuffle(rng, Array.from({ length: n - 1 }, (_, i) => i + 1)).slice(0, m - 1).sort((x, y) => x - y);
      const bounds = [0, ...cuts, n];
      const out: number[] = [];
      for (let t = 0; t + 1 < bounds.length; t++) {
        let acc = -1;
        for (let i = bounds[t]; i < bounds[t + 1]; i++) acc &= nums[i];
        out.push(acc);
      }
      return out;
    };
    return {
      slug: "minimum-sum-of-values-by-dividing-array",
      title: "Minimum Sum of Values by Dividing Array",
      difficulty: "HARD" as const,
      tags: ["Array", "Binary Search", "Dynamic Programming", "Bit Manipulation", "Segment Tree", "Queue", "Google"],
      signature: {
        funcName: "minimumValueSum",
        params: [{ name: "nums", type: "int[]" as const }, { name: "andValues", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given two arrays, `nums` of length `n` and `andValues` of length `m`.\n\nThe **value** of an array is its **last** element.\n\nSplit `nums` into exactly `m` disjoint contiguous non-empty subarrays so that for the `i`-th subarray `[l_i, r_i]`, the bitwise `AND` of its elements equals `andValues[i]`: `nums[l_i] & nums[l_i + 1] & … & nums[r_i] == andValues[i]` for every `1 <= i <= m`.\n\nReturn the **minimum** possible sum of the values of the `m` subarrays, or `-1` if no such split exists.",
        [
          { in: "nums = [1,4,3,3,2], andValues = [0,3,3,2]", out: String(ref([1, 4, 3, 3, 2], [0, 3, 3, 2])), note: "Split as [1,4], [3], [3], [2]: 1 & 4 = 0, and the values are 4 + 3 + 3 + 2 = 12." },
          { in: "nums = [2,3,5,7,7,7,5], andValues = [0,7,5]", out: String(ref([2, 3, 5, 7, 7, 7, 5], [0, 7, 5])), note: "[2,3,5], [7,7,7], [5] gives 5 + 7 + 5 = 17, the cheapest valid split." },
          { in: "nums = [1,2,3,4], andValues = [2]", out: String(ref([1, 2, 3, 4], [2])), note: "One piece must cover everything, and 1 & 2 & 3 & 4 = 0." },
        ],
        ["1 <= n == nums.length <= 10^4", "1 <= m == andValues.length <= min(n, 10)", "1 <= nums[i] < 10^5", "0 <= andValues[j] < 10^5"]),
      hints: [
        "Think of the split piece by piece: `f_j[i]` = cheapest way to cover the first `i` elements with the first `j` pieces.",
        "For a fixed end `i`, the AND of `nums[l..i]` only loses bits as `l` moves left, so it takes at most about 17 distinct values — and each value covers a contiguous range of starts `l`.",
        "Keep, for the current end, the list of distinct AND values of subarrays ending there, each with the minimum of `f_{j}` over its starts. Extending the end by one element ANDs every value with it and merges equal neighbours. If the target appears, `f_{j+1}[i+1] = that minimum + nums[i]`.",
      ],
      editorial: explain({
        idea: "Process the pieces one at a time. For each new piece, sweep the end position and maintain the distinct AND values of all subarrays ending there — at most `log(max)` of them — each paired with the cheapest prefix cost among the starts that produce it.",
        steps: [
          "`f[0] = 0`, `f[i] = ∞` for `i > 0`: the cost of covering a prefix of length `i` with the pieces placed so far.",
          "For each target `t = andValues[j]`: start an empty list of pairs `(and, best)`. For `i = 1..n`, with `x = nums[i-1]`, build the new list: first `(x, f[i-1])` (the piece starting at `i-1`), then every old pair as `(and & x, best)`, merging a pair into the previous one when the AND values are equal (keep the smaller `best`).",
          "If some pair has `and == t` and a finite `best`, set `g[i] = best + x`; otherwise `g[i] = ∞`.",
          "After the sweep, `f = g`. After all `m` targets, return `f[n]`, or -1 if it is infinite.",
        ],
        why: "Every subarray ending at `i - 1` starts at some `l`; its AND is one of the list's values, and the list groups starts by that value, so `best` is exactly the minimum of `f[l]` over the starts that produce it. Adding a piece only adds its last element to the cost, which is fixed once the end is fixed. Since ANDs only lose bits as the subarray grows, the values are strictly decreasing along the list and there are at most about 17 of them.",
        time: "O(m · n · log(max(nums)))",
        space: "O(n)",
        pitfalls: [
          "The cost of a piece is its **last** element, not its AND.",
          "Every element must belong to some piece — the last piece must end at `n - 1`.",
          "A start `l` whose prefix `f[l]` is infinite must not make an otherwise impossible state look reachable.",
        ],
      }),
      examples: [
        { input: "[1,4,3,3,2]\n[0,3,3,2]", expectedOutput: String(ref([1, 4, 3, 3, 2], [0, 3, 3, 2])) },
        { input: "[2,3,5,7,7,7,5]\n[0,7,5]", expectedOutput: String(ref([2, 3, 5, 7, 7, 7, 5], [0, 7, 5])) },
        { input: "[1,2,3,4]\n[2]", expectedOutput: String(ref([1, 2, 3, 4], [2])) },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 25, 50]));
        const m = ri(rng, 1, Math.min(n, pick(rng, [1, 3, 10])));
        const top = pick(rng, [3, 15, 255, 99999]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        let andValues = genAnd(rng, nums, m);
        if (rng() < 0.3) andValues = andValues.map((v) => (rng() < 0.3 ? ri(rng, 0, top) : v));
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(andValues)}`, expectedOutput: String(ref(nums, andValues)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumValueSum(nums: List[int], andValues: List[int]) -> int:
              INF = float('inf')
              n = len(nums)
              f = [INF] * (n + 1)
              f[0] = 0
              for target in andValues:
                  g = [INF] * (n + 1)
                  vals, mins = [], []  # distinct ANDs of subarrays ending here, cheapest prefix for each
                  for i in range(1, n + 1):
                      x = nums[i - 1]
                      nv, nm = [x], [f[i - 1]]
                      for v, m in zip(vals, mins):
                          w = v & x
                          if w == nv[-1]:
                              if m < nm[-1]:
                                  nm[-1] = m
                          else:
                              nv.append(w)
                              nm.append(m)
                      vals, mins = nv, nm
                      for v, m in zip(vals, mins):
                          if v == target:
                              if m < INF:
                                  g[i] = m + x
                              break
                  f = g
              return f[n] if f[n] < INF else -1
        `,
        javascript: code`
          var minimumValueSum = function(nums, andValues) {
              var INF = 1e15, n = nums.length;
              var f = new Array(n + 1).fill(INF);
              f[0] = 0;
              for (var j = 0; j < andValues.length; j++) {
                  var target = andValues[j];
                  var g = new Array(n + 1).fill(INF);
                  var vals = [], mins = []; // distinct ANDs of subarrays ending here, cheapest prefix for each
                  for (var i = 1; i <= n; i++) {
                      var x = nums[i - 1];
                      var nv = [x], nm = [f[i - 1]];
                      for (var t = 0; t < vals.length; t++) {
                          var w = vals[t] & x;
                          if (w === nv[nv.length - 1]) {
                              if (mins[t] < nm[nm.length - 1]) nm[nm.length - 1] = mins[t];
                          } else {
                              nv.push(w);
                              nm.push(mins[t]);
                          }
                      }
                      vals = nv;
                      mins = nm;
                      for (var t = 0; t < vals.length; t++) {
                          if (vals[t] === target) {
                              if (mins[t] < INF) g[i] = mins[t] + x;
                              break;
                          }
                      }
                  }
                  f = g;
              }
              return f[n] < INF ? f[n] : -1;
          };
        `,
        typescript: code`
          function minimumValueSum(nums: number[], andValues: number[]): number {
              var INF = 1e15, n = nums.length;
              var f: number[] = [];
              for (var i = 0; i <= n; i++) f.push(INF);
              f[0] = 0;
              for (var j = 0; j < andValues.length; j++) {
                  var target = andValues[j];
                  var g: number[] = [];
                  for (var i = 0; i <= n; i++) g.push(INF);
                  var vals: number[] = [], mins: number[] = []; // distinct ANDs ending here, cheapest prefix for each
                  for (var i = 1; i <= n; i++) {
                      var x = nums[i - 1];
                      var nv: number[] = [x], nm: number[] = [f[i - 1]];
                      for (var t = 0; t < vals.length; t++) {
                          var w = vals[t] & x;
                          if (w === nv[nv.length - 1]) {
                              if (mins[t] < nm[nm.length - 1]) nm[nm.length - 1] = mins[t];
                          } else {
                              nv.push(w);
                              nm.push(mins[t]);
                          }
                      }
                      vals = nv;
                      mins = nm;
                      for (var t = 0; t < vals.length; t++) {
                          if (vals[t] === target) {
                              if (mins[t] < INF) g[i] = mins[t] + x;
                              break;
                          }
                      }
                  }
                  f = g;
              }
              return f[n] < INF ? f[n] : -1;
          }
        `,
        java: code`
          public static int minimumValueSum(int[] nums, int[] andValues) {
              final int INF = Integer.MAX_VALUE;
              int n = nums.length;
              int[] f = new int[n + 1];
              Arrays.fill(f, INF);
              f[0] = 0;
              int[] vals = new int[40], mins = new int[40], nv = new int[40], nm = new int[40];
              for (int target : andValues) {
                  int[] g = new int[n + 1];
                  Arrays.fill(g, INF);
                  int len = 0; // distinct ANDs of subarrays ending here, cheapest prefix for each
                  for (int i = 1; i <= n; i++) {
                      int x = nums[i - 1];
                      int nl = 0;
                      nv[nl] = x; nm[nl] = f[i - 1]; nl++;
                      for (int t = 0; t < len; t++) {
                          int w = vals[t] & x;
                          if (w == nv[nl - 1]) nm[nl - 1] = Math.min(nm[nl - 1], mins[t]);
                          else { nv[nl] = w; nm[nl] = mins[t]; nl++; }
                      }
                      int[] tmp = vals; vals = nv; nv = tmp;
                      tmp = mins; mins = nm; nm = tmp;
                      len = nl;
                      for (int t = 0; t < len; t++) {
                          if (vals[t] == target) {
                              if (mins[t] < INF) g[i] = mins[t] + x;
                              break;
                          }
                      }
                  }
                  f = g;
              }
              return f[n] < INF ? f[n] : -1;
          }
        `,
        cpp: code`
          int minimumValueSum(vector<int>& nums, vector<int>& andValues) {
              const int INF = INT_MAX;
              int n = nums.size();
              vector<int> f(n + 1, INF);
              f[0] = 0;
              for (int target : andValues) {
                  vector<int> g(n + 1, INF);
                  vector<pair<int, int>> cur; // distinct ANDs of subarrays ending here, cheapest prefix for each
                  for (int i = 1; i <= n; i++) {
                      int x = nums[i - 1];
                      vector<pair<int, int>> nxt;
                      nxt.push_back({x, f[i - 1]});
                      for (auto& pr : cur) {
                          int w = pr.first & x;
                          if (w == nxt.back().first) nxt.back().second = min(nxt.back().second, pr.second);
                          else nxt.push_back({w, pr.second});
                      }
                      cur.swap(nxt);
                      for (auto& pr : cur) {
                          if (pr.first == target) {
                              if (pr.second < INF) g[i] = pr.second + x;
                              break;
                          }
                      }
                  }
                  f = g;
              }
              return f[n] < INF ? f[n] : -1;
          }
        `,
        c: code`
          int minimumValueSum(int* nums, int numsSize, int* andValues, int andValuesSize) {
              const int INF = 2147483647;
              int n = numsSize;
              int* f = (int*) malloc(sizeof(int) * (n + 1));
              int* g = (int*) malloc(sizeof(int) * (n + 1));
              for (int i = 0; i <= n; i++) f[i] = INF;
              f[0] = 0;
              int vals[40], mins[40], nv[40], nm[40];
              for (int j = 0; j < andValuesSize; j++) {
                  int target = andValues[j];
                  for (int i = 0; i <= n; i++) g[i] = INF;
                  int len = 0; // distinct ANDs of subarrays ending here, cheapest prefix for each
                  for (int i = 1; i <= n; i++) {
                      int x = nums[i - 1];
                      int nl = 0;
                      nv[nl] = x; nm[nl] = f[i - 1]; nl++;
                      for (int t = 0; t < len; t++) {
                          int w = vals[t] & x;
                          if (w == nv[nl - 1]) { if (mins[t] < nm[nl - 1]) nm[nl - 1] = mins[t]; }
                          else { nv[nl] = w; nm[nl] = mins[t]; nl++; }
                      }
                      for (int t = 0; t < nl; t++) { vals[t] = nv[t]; mins[t] = nm[t]; }
                      len = nl;
                      for (int t = 0; t < len; t++) {
                          if (vals[t] == target) {
                              if (mins[t] < INF) g[i] = mins[t] + x;
                              break;
                          }
                      }
                  }
                  int* tmp = f; f = g; g = tmp;
              }
              int ans = f[n] < INF ? f[n] : -1;
              free(f);
              free(g);
              return ans;
          }
        `,
        csharp: code`
          public static int MinimumValueSum(int[] nums, int[] andValues)
          {
              const int INF = int.MaxValue;
              int n = nums.Length;
              int[] f = new int[n + 1];
              for (int i = 0; i <= n; i++) f[i] = INF;
              f[0] = 0;
              int[] vals = new int[40], mins = new int[40], nv = new int[40], nm = new int[40];
              foreach (int target in andValues)
              {
                  int[] g = new int[n + 1];
                  for (int i = 0; i <= n; i++) g[i] = INF;
                  int len = 0; // distinct ANDs of subarrays ending here, cheapest prefix for each
                  for (int i = 1; i <= n; i++)
                  {
                      int x = nums[i - 1];
                      int nl = 0;
                      nv[nl] = x; nm[nl] = f[i - 1]; nl++;
                      for (int t = 0; t < len; t++)
                      {
                          int w = vals[t] & x;
                          if (w == nv[nl - 1]) nm[nl - 1] = Math.Min(nm[nl - 1], mins[t]);
                          else { nv[nl] = w; nm[nl] = mins[t]; nl++; }
                      }
                      int[] tmp = vals; vals = nv; nv = tmp;
                      tmp = mins; mins = nm; nm = tmp;
                      len = nl;
                      for (int t = 0; t < len; t++)
                      {
                          if (vals[t] == target)
                          {
                              if (mins[t] < INF) g[i] = mins[t] + x;
                              break;
                          }
                      }
                  }
                  f = g;
              }
              return f[n] < INF ? f[n] : -1;
          }
        `,
        go: code`
          func minimumValueSum(nums []int, andValues []int) int {
              const inf = 1 << 60
              n := len(nums)
              f := make([]int, n+1)
              for i := range f {
                  f[i] = inf
              }
              f[0] = 0
              for _, target := range andValues {
                  g := make([]int, n+1)
                  for i := range g {
                      g[i] = inf
                  }
                  vals, mins := []int{}, []int{} // distinct ANDs of subarrays ending here, cheapest prefix for each
                  for i := 1; i <= n; i++ {
                      x := nums[i-1]
                      nv, nm := []int{x}, []int{f[i-1]}
                      for t := range vals {
                          w := vals[t] & x
                          if w == nv[len(nv)-1] {
                              if mins[t] < nm[len(nm)-1] {
                                  nm[len(nm)-1] = mins[t]
                              }
                          } else {
                              nv = append(nv, w)
                              nm = append(nm, mins[t])
                          }
                      }
                      vals, mins = nv, nm
                      for t := range vals {
                          if vals[t] == target {
                              if mins[t] < inf {
                                  g[i] = mins[t] + x
                              }
                              break
                          }
                      }
                  }
                  f = g
              }
              if f[n] < inf {
                  return f[n]
              }
              return -1
          }
        `,
        kotlin: code`
          fun minimumValueSum(nums: IntArray, andValues: IntArray): Int {
              val inf = Int.MAX_VALUE
              val n = nums.size
              var f = IntArray(n + 1) { inf }
              f[0] = 0
              var vals = IntArray(40)
              var mins = IntArray(40)
              var nv = IntArray(40)
              var nm = IntArray(40)
              for (target in andValues) {
                  val g = IntArray(n + 1) { inf }
                  var len = 0 // distinct ANDs of subarrays ending here, cheapest prefix for each
                  for (i in 1..n) {
                      val x = nums[i - 1]
                      var nl = 0
                      nv[nl] = x; nm[nl] = f[i - 1]; nl++
                      for (t in 0 until len) {
                          val w = vals[t] and x
                          if (w == nv[nl - 1]) nm[nl - 1] = minOf(nm[nl - 1], mins[t])
                          else { nv[nl] = w; nm[nl] = mins[t]; nl++ }
                      }
                      var tmp = vals; vals = nv; nv = tmp
                      tmp = mins; mins = nm; nm = tmp
                      len = nl
                      for (t in 0 until len) {
                          if (vals[t] == target) {
                              if (mins[t] < inf) g[i] = mins[t] + x
                              break
                          }
                      }
                  }
                  f = g
              }
              return if (f[n] < inf) f[n] else -1
          }
        `,
        swift: code`
          func minimumValueSum(_ nums: [Int], _ andValues: [Int]) -> Int {
              let inf = Int.max
              let n = nums.count
              var f = [Int](repeating: inf, count: n + 1)
              f[0] = 0
              for target in andValues {
                  var g = [Int](repeating: inf, count: n + 1)
                  var vals = [Int](), mins = [Int]() // distinct ANDs ending here, cheapest prefix for each
                  for i in 1...n {
                      let x = nums[i - 1]
                      var nv = [x], nm = [f[i - 1]]
                      for t in 0..<vals.count {
                          let w = vals[t] & x
                          if w == nv[nv.count - 1] {
                              nm[nm.count - 1] = min(nm[nm.count - 1], mins[t])
                          } else {
                              nv.append(w)
                              nm.append(mins[t])
                          }
                      }
                      vals = nv
                      mins = nm
                      for t in 0..<vals.count where vals[t] == target {
                          if mins[t] < inf { g[i] = mins[t] + x }
                          break
                      }
                  }
                  f = g
              }
              return f[n] < inf ? f[n] : -1
          }
        `,
        rust: code`
          fn minimumValueSum(nums: Vec<i32>, and_values: Vec<i32>) -> i32 {
              let inf = std::i32::MAX;
              let n = nums.len();
              let mut f = vec![inf; n + 1];
              f[0] = 0;
              for &target in &and_values {
                  let mut g = vec![inf; n + 1];
                  let mut cur: Vec<(i32, i32)> = Vec::new(); // distinct ANDs ending here, cheapest prefix for each
                  for i in 1..=n {
                      let x = nums[i - 1];
                      let mut nxt: Vec<(i32, i32)> = vec![(x, f[i - 1])];
                      for &(v, m) in &cur {
                          let w = v & x;
                          let last = nxt.len() - 1;
                          if w == nxt[last].0 {
                              if m < nxt[last].1 {
                                  nxt[last].1 = m;
                              }
                          } else {
                              nxt.push((w, m));
                          }
                      }
                      cur = nxt;
                      for &(v, m) in &cur {
                          if v == target {
                              if m < inf {
                                  g[i] = m + x;
                              }
                              break;
                          }
                      }
                  }
                  f = g;
              }
              if f[n] < inf { f[n] } else { -1 }
          }
        `,
        php: code`
          function minimumValueSum($nums, $andValues) {
              $INF = PHP_INT_MAX;
              $n = count($nums);
              $f = array_fill(0, $n + 1, $INF);
              $f[0] = 0;
              foreach ($andValues as $target) {
                  $g = array_fill(0, $n + 1, $INF);
                  $vals = [];
                  $mins = []; // distinct ANDs of subarrays ending here, cheapest prefix for each
                  for ($i = 1; $i <= $n; $i++) {
                      $x = $nums[$i - 1];
                      $nv = [$x];
                      $nm = [$f[$i - 1]];
                      $len = count($vals);
                      for ($t = 0; $t < $len; $t++) {
                          $w = $vals[$t] & $x;
                          $last = count($nv) - 1;
                          if ($w == $nv[$last]) {
                              if ($mins[$t] < $nm[$last]) $nm[$last] = $mins[$t];
                          } else {
                              $nv[] = $w;
                              $nm[] = $mins[$t];
                          }
                      }
                      $vals = $nv;
                      $mins = $nm;
                      $len = count($vals);
                      for ($t = 0; $t < $len; $t++) {
                          if ($vals[$t] == $target) {
                              if ($mins[$t] < $INF) $g[$i] = $mins[$t] + $x;
                              break;
                          }
                      }
                  }
                  $f = $g;
              }
              return $f[$n] < $INF ? $f[$n] : -1;
          }
        `,
        ruby: code`
          def minimumValueSum(nums, andValues)
            inf = Float::INFINITY
            n = nums.length
            f = Array.new(n + 1, inf)
            f[0] = 0
            andValues.each do |target|
              g = Array.new(n + 1, inf)
              vals = []
              mins = [] # distinct ANDs of subarrays ending here, cheapest prefix for each
              (1..n).each do |i|
                x = nums[i - 1]
                nv = [x]
                nm = [f[i - 1]]
                vals.each_with_index do |v, t|
                  w = v & x
                  if w == nv[-1]
                    nm[-1] = mins[t] if mins[t] < nm[-1]
                  else
                    nv << w
                    nm << mins[t]
                  end
                end
                vals = nv
                mins = nm
                t = vals.index(target)
                g[i] = mins[t] + x if t && mins[t] < inf
              end
              f = g
            end
            f[n] < inf ? f[n] : -1
          end
        `,
      },
    };
  })(),

  // ── Minimum Number of Operations to Satisfy Conditions (LC 3122) ──
  (() => {
    // Brute force over every column colouring with adjacent columns
    // different, for grids up to 4 columns; DP (the same recurrence) beyond.
    const colCost = (grid: number[][], c: number, v: number) => {
      let cost = 0;
      for (const row of grid) if (row[c] !== v) cost++;
      return cost;
    };
    const ref = (grid: number[][]) => {
      const n = grid[0].length;
      if (n <= 3) {
        let best = Infinity;
        const rec = (c: number, prev: number, acc: number) => {
          if (c === n) { best = Math.min(best, acc); return; }
          for (let v = 0; v < 10; v++) if (v !== prev) rec(c + 1, v, acc + colCost(grid, c, v));
        };
        rec(0, -1, 0);
        return best;
      }
      let prev = new Array(10).fill(0);
      for (let c = 0; c < n; c++) {
        const cur = new Array(10).fill(0);
        for (let v = 0; v < 10; v++) {
          let best = Infinity;
          for (let u = 0; u < 10; u++) if (c === 0 || u !== v) best = Math.min(best, prev[u]);
          cur[v] = colCost(grid, c, v) + best;
        }
        prev = cur;
      }
      return Math.min(...prev);
    };
    const ex1 = [[1, 0, 2], [1, 0, 2]];
    const ex2 = [[1, 1, 1], [0, 0, 0]];
    const ex3 = [[1], [2], [3]];
    return {
      slug: "minimum-number-of-operations-to-satisfy-conditions",
      title: "Minimum Number of Operations to Satisfy Conditions",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Amazon"],
      signature: { funcName: "minimumOperations", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `m x n` matrix `grid` of digits. In one operation you may change any cell to any non-negative integer.\n\nYou want every cell to satisfy both conditions:\n\n- it equals the cell **below** it, if that cell exists (`grid[i][j] == grid[i + 1][j]`), and\n- it differs from the cell to its **right**, if that cell exists (`grid[i][j] != grid[i][j + 1]`).\n\nIn other words, each column must be filled with one value, and neighbouring columns must use different values. Return the **minimum** number of operations needed.",
        [
          { in: "grid = [[1,0,2],[1,0,2]]", out: String(ref(ex1)), note: "Every column is already uniform and neighbours differ." },
          { in: "grid = [[1,1,1],[0,0,0]]", out: String(ref(ex2)), note: "Make the columns 1, 0, 1 (or 0, 1, 0): one change in each column." },
          { in: "grid = [[1],[2],[3]]", out: String(ref(ex3)), note: "A single column: keep one of the values, change the other two." },
        ],
        ["1 <= n, m <= 1000", "0 <= grid[i][j] <= 9"]),
      hints: [
        "Each column ends up as a single value, and only neighbouring columns interact.",
        "Choosing a value outside 0–9 never helps: some digit not used by either neighbour is always available and costs no more.",
        "`dp[j][v]` = cheapest way to fix columns `0..j` with column `j` set to `v` = (rows of column `j` not equal to `v`) + the best `dp[j-1][u]` with `u ≠ v`.",
      ],
      editorial: explain({
        idea: "The conditions say: columns are constant, adjacent columns differ. So the task is to colour a path of `n` columns with digits, where colouring column `j` with `v` costs the number of its cells not already equal to `v`, and neighbouring colours must differ.",
        steps: [
          "For each column `j`, count how many cells hold each digit; the cost of colour `v` is `m - count[v]`.",
          "`dp[0][v] = cost(0, v)`.",
          "`dp[j][v] = cost(j, v) + min over u ≠ v of dp[j-1][u]`.",
          "Return the minimum of `dp[n-1][v]`.",
        ],
        why: "The cost decomposes over columns and the only constraint links consecutive columns, so a left-to-right DP over the colour of the last column is exact. Restricting colours to 0–9 loses nothing: any optimal colouring that uses another number can swap it for a digit different from both neighbours (ten digits, at most two forbidden), which changes no more cells, since no cell held the outside number to begin with.",
        time: "O(m · n + n · 10 · 10)",
        space: "O(10)",
        pitfalls: [
          "Count per column before the DP — recounting inside the colour loop makes it `O(m · n · 10)`, still fine but wasteful.",
          "The first column has no left neighbour, so every colour is allowed there.",
          "A single row still needs adjacent cells to differ.",
        ],
      }),
      examples: [
        { input: fmtIntMat(ex1), expectedOutput: String(ref(ex1)) },
        { input: fmtIntMat(ex2), expectedOutput: String(ref(ex2)) },
        { input: fmtIntMat(ex3), expectedOutput: String(ref(ex3)) },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, pick(rng, [1, 3, 6, 10]));
        const n = ri(rng, 1, pick(rng, [1, 3, 6, 12]));
        const top = pick(rng, [1, 2, 4, 9]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 0, top)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumOperations(grid: List[List[int]]) -> int:
              m, n = len(grid), len(grid[0])
              prev = None
              for c in range(n):
                  cnt = [0] * 10
                  for r in range(m):
                      cnt[grid[r][c]] += 1
                  cur = [0] * 10
                  for v in range(10):
                      cost = m - cnt[v]
                      if prev is None:
                          cur[v] = cost
                      else:
                          cur[v] = cost + min(prev[u] for u in range(10) if u != v)
                  prev = cur
              return min(prev)
        `,
        javascript: code`
          var minimumOperations = function(grid) {
              var m = grid.length, n = grid[0].length;
              var prev = null;
              for (var c = 0; c < n; c++) {
                  var cnt = new Array(10).fill(0);
                  for (var r = 0; r < m; r++) cnt[grid[r][c]]++;
                  var cur = new Array(10).fill(0);
                  for (var v = 0; v < 10; v++) {
                      var best = 0;
                      if (prev !== null) {
                          best = Infinity;
                          for (var u = 0; u < 10; u++) if (u !== v && prev[u] < best) best = prev[u];
                      }
                      cur[v] = m - cnt[v] + best;
                  }
                  prev = cur;
              }
              return Math.min.apply(null, prev);
          };
        `,
        typescript: code`
          function minimumOperations(grid: number[][]): number {
              var m = grid.length, n = grid[0].length;
              var prev: number[] = [];
              for (var c = 0; c < n; c++) {
                  var cnt = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                  for (var r = 0; r < m; r++) cnt[grid[r][c]]++;
                  var cur: number[] = [];
                  for (var v = 0; v < 10; v++) {
                      var best = 0;
                      if (c > 0) {
                          best = Infinity;
                          for (var u = 0; u < 10; u++) if (u !== v && prev[u] < best) best = prev[u];
                      }
                      cur.push(m - cnt[v] + best);
                  }
                  prev = cur;
              }
              return Math.min.apply(null, prev);
          }
        `,
        java: code`
          public static int minimumOperations(int[][] grid) {
              int m = grid.length, n = grid[0].length;
              int[] prev = new int[10];
              for (int c = 0; c < n; c++) {
                  int[] cnt = new int[10];
                  for (int r = 0; r < m; r++) cnt[grid[r][c]]++;
                  int[] cur = new int[10];
                  for (int v = 0; v < 10; v++) {
                      int best = 0;
                      if (c > 0) {
                          best = Integer.MAX_VALUE;
                          for (int u = 0; u < 10; u++) if (u != v) best = Math.min(best, prev[u]);
                      }
                      cur[v] = m - cnt[v] + best;
                  }
                  prev = cur;
              }
              int ans = Integer.MAX_VALUE;
              for (int v : prev) ans = Math.min(ans, v);
              return ans;
          }
        `,
        cpp: code`
          int minimumOperations(vector<vector<int>>& grid) {
              int m = grid.size(), n = grid[0].size();
              vector<int> prev(10, 0);
              for (int c = 0; c < n; c++) {
                  int cnt[10] = {0};
                  for (int r = 0; r < m; r++) cnt[grid[r][c]]++;
                  vector<int> cur(10, 0);
                  for (int v = 0; v < 10; v++) {
                      int best = 0;
                      if (c > 0) {
                          best = INT_MAX;
                          for (int u = 0; u < 10; u++) if (u != v) best = min(best, prev[u]);
                      }
                      cur[v] = m - cnt[v] + best;
                  }
                  prev = cur;
              }
              return *min_element(prev.begin(), prev.end());
          }
        `,
        c: code`
          int minimumOperations(int** grid, int gridSize, int* gridColSize) {
              int m = gridSize, n = gridColSize[0];
              int prev[10] = {0}, cur[10];
              for (int c = 0; c < n; c++) {
                  int cnt[10] = {0};
                  for (int r = 0; r < m; r++) cnt[grid[r][c]]++;
                  for (int v = 0; v < 10; v++) {
                      int best = 0;
                      if (c > 0) {
                          best = 2147483647;
                          for (int u = 0; u < 10; u++) if (u != v && prev[u] < best) best = prev[u];
                      }
                      cur[v] = m - cnt[v] + best;
                  }
                  for (int v = 0; v < 10; v++) prev[v] = cur[v];
              }
              int ans = prev[0];
              for (int v = 1; v < 10; v++) if (prev[v] < ans) ans = prev[v];
              return ans;
          }
        `,
        csharp: code`
          public static int MinimumOperations(int[][] grid)
          {
              int m = grid.Length, n = grid[0].Length;
              int[] prev = new int[10];
              for (int c = 0; c < n; c++)
              {
                  int[] cnt = new int[10];
                  for (int r = 0; r < m; r++) cnt[grid[r][c]]++;
                  int[] cur = new int[10];
                  for (int v = 0; v < 10; v++)
                  {
                      int best = 0;
                      if (c > 0)
                      {
                          best = int.MaxValue;
                          for (int u = 0; u < 10; u++) if (u != v) best = Math.Min(best, prev[u]);
                      }
                      cur[v] = m - cnt[v] + best;
                  }
                  prev = cur;
              }
              return prev.Min();
          }
        `,
        go: code`
          func minimumOperations(grid [][]int) int {
              m, n := len(grid), len(grid[0])
              prev := make([]int, 10)
              for c := 0; c < n; c++ {
                  cnt := make([]int, 10)
                  for r := 0; r < m; r++ {
                      cnt[grid[r][c]]++
                  }
                  cur := make([]int, 10)
                  for v := 0; v < 10; v++ {
                      best := 0
                      if c > 0 {
                          best = 1 << 30
                          for u := 0; u < 10; u++ {
                              if u != v && prev[u] < best {
                                  best = prev[u]
                              }
                          }
                      }
                      cur[v] = m - cnt[v] + best
                  }
                  prev = cur
              }
              ans := prev[0]
              for _, v := range prev {
                  if v < ans {
                      ans = v
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun minimumOperations(grid: Array<IntArray>): Int {
              val m = grid.size
              val n = grid[0].size
              var prev = IntArray(10)
              for (c in 0 until n) {
                  val cnt = IntArray(10)
                  for (r in 0 until m) cnt[grid[r][c]]++
                  val cur = IntArray(10)
                  for (v in 0 until 10) {
                      var best = 0
                      if (c > 0) {
                          best = Int.MAX_VALUE
                          for (u in 0 until 10) if (u != v) best = minOf(best, prev[u])
                      }
                      cur[v] = m - cnt[v] + best
                  }
                  prev = cur
              }
              return prev.minOrNull()!!
          }
        `,
        swift: code`
          func minimumOperations(_ grid: [[Int]]) -> Int {
              let m = grid.count, n = grid[0].count
              var prev = [Int](repeating: 0, count: 10)
              for c in 0..<n {
                  var cnt = [Int](repeating: 0, count: 10)
                  for r in 0..<m { cnt[grid[r][c]] += 1 }
                  var cur = [Int](repeating: 0, count: 10)
                  for v in 0..<10 {
                      var best = 0
                      if c > 0 {
                          best = Int.max
                          for u in 0..<10 where u != v { best = min(best, prev[u]) }
                      }
                      cur[v] = m - cnt[v] + best
                  }
                  prev = cur
              }
              return prev.min()!
          }
        `,
        rust: code`
          fn minimumOperations(grid: Vec<Vec<i32>>) -> i32 {
              let m = grid.len();
              let n = grid[0].len();
              let mut prev = [0i32; 10];
              for c in 0..n {
                  let mut cnt = [0i32; 10];
                  for r in 0..m {
                      cnt[grid[r][c] as usize] += 1;
                  }
                  let mut cur = [0i32; 10];
                  for v in 0..10 {
                      let mut best = 0;
                      if c > 0 {
                          best = std::i32::MAX;
                          for u in 0..10 {
                              if u != v && prev[u] < best {
                                  best = prev[u];
                              }
                          }
                      }
                      cur[v] = m as i32 - cnt[v] + best;
                  }
                  prev = cur;
              }
              *prev.iter().min().unwrap()
          }
        `,
        php: code`
          function minimumOperations($grid) {
              $m = count($grid);
              $n = count($grid[0]);
              $prev = array_fill(0, 10, 0);
              for ($c = 0; $c < $n; $c++) {
                  $cnt = array_fill(0, 10, 0);
                  for ($r = 0; $r < $m; $r++) $cnt[$grid[$r][$c]]++;
                  $cur = array_fill(0, 10, 0);
                  for ($v = 0; $v < 10; $v++) {
                      $best = 0;
                      if ($c > 0) {
                          $best = PHP_INT_MAX;
                          for ($u = 0; $u < 10; $u++) if ($u != $v && $prev[$u] < $best) $best = $prev[$u];
                      }
                      $cur[$v] = $m - $cnt[$v] + $best;
                  }
                  $prev = $cur;
              }
              return min($prev);
          }
        `,
        ruby: code`
          def minimumOperations(grid)
            m = grid.length
            n = grid[0].length
            prev = nil
            n.times do |c|
              cnt = Array.new(10, 0)
              m.times { |r| cnt[grid[r][c]] += 1 }
              cur = Array.new(10) do |v|
                best = prev.nil? ? 0 : (0...10).reject { |u| u == v }.map { |u| prev[u] }.min
                m - cnt[v] + best
              end
              prev = cur
            end
            prev.min
          end
        `,
      },
    };
  })(),

  // ── Minimum Substring Partition of Equal Character Frequency (LC 3144) ──
  (() => {
    // Partition DP with an explicit "every present letter has the same count"
    // check on each candidate piece.
    const ref = (s: string) => {
      const n = s.length;
      const dp = new Array(n + 1).fill(Infinity);
      dp[0] = 0;
      for (let i = 1; i <= n; i++) {
        const cnt = new Array(26).fill(0);
        for (let j = i - 1; j >= 0; j--) {
          cnt[s.charCodeAt(j) - 97]++;
          const present = cnt.filter((c) => c > 0);
          if (present.every((c) => c === present[0])) dp[i] = Math.min(dp[i], dp[j] + 1);
        }
      }
      return dp[n];
    };
    return {
      slug: "minimum-substring-partition-of-equal-character-frequency",
      title: "Minimum Substring Partition of Equal Character Frequency",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Dynamic Programming", "Counting", "Amazon"],
      signature: { funcName: "minimumSubstringsInPartition", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A string is **balanced** if every character that appears in it appears the same number of times. For example `\"aabb\"`, `\"abc\"` and `\"zzz\"` are balanced, while `\"aab\"` is not.\n\nGiven a string `s`, split it into one or more **balanced** substrings (contiguous, covering `s` in order). For example `\"ababcc\"` can be split as `(\"abab\", \"c\", \"c\")` or `(\"ab\", \"abc\", \"c\")`, but `(\"a\", \"bab\", \"cc\")` is not valid because `\"bab\"` is unbalanced.\n\nReturn the **minimum** number of substrings in such a split.",
        [
          { in: "s = \"fabccddg\"", out: String(ref("fabccddg")), note: "One optimal split is (\"fab\", \"ccdd\", \"g\")." },
          { in: "s = \"abababaccddb\"", out: String(ref("abababaccddb")), note: "(\"abab\", \"abaccddb\"): the second piece has two of each of a, b, c, d." },
          { in: "s = \"a\"", out: String(ref("a")) },
        ],
        ["1 <= s.length <= 1000", "s consists only of lowercase English letters"]),
      hints: [
        "This is a partition DP: `dp[i]` = fewest balanced pieces covering the first `i` characters.",
        "For a fixed end `i`, grow the last piece leftwards one character at a time and keep its letter counts up to date, instead of recounting every substring.",
        "A piece is balanced exactly when `(largest count) × (number of distinct letters) == length`. Track both while extending, and each check is O(1).",
      ],
      editorial: explain({
        idea: "Classic minimum partition DP. The only question is how to test each candidate last piece quickly: grow it from right to left, maintaining its letter counts, its number of distinct letters and its maximum count.",
        steps: [
          "`dp[0] = 0`; every other entry starts at infinity.",
          "For each end `i` from 1 to `n`, reset the counts and walk `j` from `i - 1` down to 0, adding `s[j]` to the piece `s[j..i-1]`. Update `distinct` when a count goes from 0 to 1, and `maxCount`.",
          "If `maxCount · distinct == i - j`, the piece is balanced: `dp[i] = min(dp[i], dp[j] + 1)`.",
          "Return `dp[n]`.",
        ],
        why: "If every present letter appears exactly `maxCount` times, the length is `maxCount · distinct`. Conversely, if any letter appears fewer times, the length is strictly smaller than that product. So the product test is equivalent to balance. The DP tries every possible last piece, so the minimum is exact.",
        time: "O(n^2)",
        space: "O(n + 26)",
        pitfalls: [
          "A single character is always balanced, so `dp[i] ≤ dp[i-1] + 1` and the answer is at most `n`.",
          "Recomputing all 26 counts for each substring works but is 26 times slower; the product test avoids it.",
          "A greedy that takes the longest balanced prefix each time is not optimal.",
        ],
      }),
      examples: [
        { input: "\"fabccddg\"", expectedOutput: String(ref("fabccddg")) },
        { input: "\"abababaccddb\"", expectedOutput: String(ref("abababaccddb")) },
        { input: "\"a\"", expectedOutput: String(ref("a")) },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 6, 15, 40]));
        const s = randLower(rng, n, n, pick(rng, ["a", "ab", "abc", "abcd", "abcdefghijklmnopqrstuvwxyz"]));
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def minimumSubstringsInPartition(s: str) -> int:
              n = len(s)
              dp = [0] + [n + 1] * n
              for i in range(1, n + 1):
                  cnt = [0] * 26
                  distinct = 0
                  mx = 0
                  for j in range(i - 1, -1, -1):
                      c = ord(s[j]) - 97
                      if cnt[c] == 0:
                          distinct += 1
                      cnt[c] += 1
                      if cnt[c] > mx:
                          mx = cnt[c]
                      if mx * distinct == i - j and dp[j] + 1 < dp[i]:
                          dp[i] = dp[j] + 1
              return dp[n]
        `,
        javascript: code`
          var minimumSubstringsInPartition = function(s) {
              var n = s.length;
              var dp = new Array(n + 1).fill(n + 1);
              dp[0] = 0;
              for (var i = 1; i <= n; i++) {
                  var cnt = new Array(26).fill(0), distinct = 0, mx = 0;
                  for (var j = i - 1; j >= 0; j--) {
                      var c = s.charCodeAt(j) - 97;
                      if (cnt[c] === 0) distinct++;
                      cnt[c]++;
                      if (cnt[c] > mx) mx = cnt[c];
                      if (mx * distinct === i - j && dp[j] + 1 < dp[i]) dp[i] = dp[j] + 1;
                  }
              }
              return dp[n];
          };
        `,
        typescript: code`
          function minimumSubstringsInPartition(s: string): number {
              var n = s.length;
              var dp: number[] = [0];
              for (var i = 1; i <= n; i++) dp.push(n + 1);
              for (var i = 1; i <= n; i++) {
                  var cnt: number[] = [];
                  for (var c = 0; c < 26; c++) cnt.push(0);
                  var distinct = 0, mx = 0;
                  for (var j = i - 1; j >= 0; j--) {
                      var ch = s.charCodeAt(j) - 97;
                      if (cnt[ch] === 0) distinct++;
                      cnt[ch]++;
                      if (cnt[ch] > mx) mx = cnt[ch];
                      if (mx * distinct === i - j && dp[j] + 1 < dp[i]) dp[i] = dp[j] + 1;
                  }
              }
              return dp[n];
          }
        `,
        java: code`
          public static int minimumSubstringsInPartition(String s) {
              int n = s.length();
              int[] dp = new int[n + 1];
              Arrays.fill(dp, n + 1);
              dp[0] = 0;
              for (int i = 1; i <= n; i++) {
                  int[] cnt = new int[26];
                  int distinct = 0, mx = 0;
                  for (int j = i - 1; j >= 0; j--) {
                      int c = s.charAt(j) - 'a';
                      if (cnt[c]++ == 0) distinct++;
                      mx = Math.max(mx, cnt[c]);
                      if (mx * distinct == i - j) dp[i] = Math.min(dp[i], dp[j] + 1);
                  }
              }
              return dp[n];
          }
        `,
        cpp: code`
          int minimumSubstringsInPartition(string s) {
              int n = s.size();
              vector<int> dp(n + 1, n + 1);
              dp[0] = 0;
              for (int i = 1; i <= n; i++) {
                  int cnt[26] = {0};
                  int distinct = 0, mx = 0;
                  for (int j = i - 1; j >= 0; j--) {
                      int c = s[j] - 'a';
                      if (cnt[c]++ == 0) distinct++;
                      mx = max(mx, cnt[c]);
                      if (mx * distinct == i - j) dp[i] = min(dp[i], dp[j] + 1);
                  }
              }
              return dp[n];
          }
        `,
        c: code`
          int minimumSubstringsInPartition(const char* s) {
              int n = (int) strlen(s);
              int* dp = (int*) malloc(sizeof(int) * (n + 1));
              for (int i = 0; i <= n; i++) dp[i] = n + 1;
              dp[0] = 0;
              for (int i = 1; i <= n; i++) {
                  int cnt[26] = {0};
                  int distinct = 0, mx = 0;
                  for (int j = i - 1; j >= 0; j--) {
                      int c = s[j] - 'a';
                      if (cnt[c]++ == 0) distinct++;
                      if (cnt[c] > mx) mx = cnt[c];
                      if (mx * distinct == i - j && dp[j] + 1 < dp[i]) dp[i] = dp[j] + 1;
                  }
              }
              int ans = dp[n];
              free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int MinimumSubstringsInPartition(string s)
          {
              int n = s.Length;
              int[] dp = new int[n + 1];
              for (int i = 1; i <= n; i++) dp[i] = n + 1;
              for (int i = 1; i <= n; i++)
              {
                  int[] cnt = new int[26];
                  int distinct = 0, mx = 0;
                  for (int j = i - 1; j >= 0; j--)
                  {
                      int c = s[j] - 'a';
                      if (cnt[c]++ == 0) distinct++;
                      mx = Math.Max(mx, cnt[c]);
                      if (mx * distinct == i - j) dp[i] = Math.Min(dp[i], dp[j] + 1);
                  }
              }
              return dp[n];
          }
        `,
        go: code`
          func minimumSubstringsInPartition(s string) int {
              n := len(s)
              dp := make([]int, n+1)
              for i := 1; i <= n; i++ {
                  dp[i] = n + 1
              }
              for i := 1; i <= n; i++ {
                  var cnt [26]int
                  distinct, mx := 0, 0
                  for j := i - 1; j >= 0; j-- {
                      c := s[j] - 'a'
                      if cnt[c] == 0 {
                          distinct++
                      }
                      cnt[c]++
                      if cnt[c] > mx {
                          mx = cnt[c]
                      }
                      if mx*distinct == i-j && dp[j]+1 < dp[i] {
                          dp[i] = dp[j] + 1
                      }
                  }
              }
              return dp[n]
          }
        `,
        kotlin: code`
          fun minimumSubstringsInPartition(s: String): Int {
              val n = s.length
              val dp = IntArray(n + 1) { n + 1 }
              dp[0] = 0
              for (i in 1..n) {
                  val cnt = IntArray(26)
                  var distinct = 0
                  var mx = 0
                  for (j in i - 1 downTo 0) {
                      val c = s[j] - 'a'
                      if (cnt[c] == 0) distinct++
                      cnt[c]++
                      if (cnt[c] > mx) mx = cnt[c]
                      if (mx * distinct == i - j && dp[j] + 1 < dp[i]) dp[i] = dp[j] + 1
                  }
              }
              return dp[n]
          }
        `,
        swift: code`
          func minimumSubstringsInPartition(_ s: String) -> Int {
              let a = s.utf8.map { Int($0) - 97 }
              let n = a.count
              var dp = [Int](repeating: n + 1, count: n + 1)
              dp[0] = 0
              for i in 1...n {
                  var cnt = [Int](repeating: 0, count: 26)
                  var distinct = 0, mx = 0
                  var j = i - 1
                  while j >= 0 {
                      let c = a[j]
                      if cnt[c] == 0 { distinct += 1 }
                      cnt[c] += 1
                      if cnt[c] > mx { mx = cnt[c] }
                      if mx * distinct == i - j && dp[j] + 1 < dp[i] { dp[i] = dp[j] + 1 }
                      j -= 1
                  }
              }
              return dp[n]
          }
        `,
        rust: code`
          fn minimumSubstringsInPartition(s: String) -> i32 {
              let a = s.as_bytes();
              let n = a.len();
              let mut dp = vec![n as i32 + 1; n + 1];
              dp[0] = 0;
              for i in 1..=n {
                  let mut cnt = [0usize; 26];
                  let (mut distinct, mut mx) = (0usize, 0usize);
                  for j in (0..i).rev() {
                      let c = (a[j] - b'a') as usize;
                      if cnt[c] == 0 {
                          distinct += 1;
                      }
                      cnt[c] += 1;
                      if cnt[c] > mx {
                          mx = cnt[c];
                      }
                      if mx * distinct == i - j && dp[j] + 1 < dp[i] {
                          dp[i] = dp[j] + 1;
                      }
                  }
              }
              dp[n]
          }
        `,
        php: code`
          function minimumSubstringsInPartition($s) {
              $n = strlen($s);
              $dp = array_fill(0, $n + 1, $n + 1);
              $dp[0] = 0;
              for ($i = 1; $i <= $n; $i++) {
                  $cnt = array_fill(0, 26, 0);
                  $distinct = 0;
                  $mx = 0;
                  for ($j = $i - 1; $j >= 0; $j--) {
                      $c = ord($s[$j]) - 97;
                      if ($cnt[$c] == 0) $distinct++;
                      $cnt[$c]++;
                      if ($cnt[$c] > $mx) $mx = $cnt[$c];
                      if ($mx * $distinct == $i - $j && $dp[$j] + 1 < $dp[$i]) $dp[$i] = $dp[$j] + 1;
                  }
              }
              return $dp[$n];
          }
        `,
        ruby: code`
          def minimumSubstringsInPartition(s)
            a = s.bytes.map { |b| b - 97 }
            n = a.length
            dp = Array.new(n + 1, n + 1)
            dp[0] = 0
            (1..n).each do |i|
              cnt = Array.new(26, 0)
              distinct = 0
              mx = 0
              (i - 1).downto(0) do |j|
                c = a[j]
                distinct += 1 if cnt[c] == 0
                cnt[c] += 1
                mx = cnt[c] if cnt[c] > mx
                dp[i] = dp[j] + 1 if mx * distinct == i - j && dp[j] + 1 < dp[i]
              end
            end
            dp[n]
          end
        `,
      },
    };
  })(),

  // ── Maximum Difference Score in a Grid (LC 3148) ────────────────
  (() => {
    // Brute force: the score of a path is last − first, so try every pair
    // (start, end) with the end weakly below-right of the start.
    const ref = (grid: number[][]) => {
      const m = grid.length, n = grid[0].length;
      let best = -Infinity;
      for (let a = 0; a < m; a++) for (let b = 0; b < n; b++) {
        for (let c = a; c < m; c++) for (let d = b; d < n; d++) {
          if (c === a && d === b) continue;
          best = Math.max(best, grid[c][d] - grid[a][b]);
        }
      }
      return best;
    };
    const ex1 = [[9, 5, 7, 3], [8, 9, 6, 1], [6, 7, 14, 3], [2, 5, 3, 1]];
    const ex2 = [[4, 3, 2], [3, 2, 1]];
    const ex3 = [[1, 9], [9, 9]];
    return {
      slug: "maximum-difference-score-in-a-grid",
      title: "Maximum Difference Score in a Grid",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Amazon", "Google"],
      signature: { funcName: "maxScore", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an `m x n` matrix `grid` of positive integers. From a cell you may move to **any** cell strictly below it in the same column, or strictly to its right in the same row — not necessarily adjacent. A move from a cell holding `c1` to a cell holding `c2` scores `c2 - c1`.\n\nYou may start at any cell and must make **at least one** move. Return the **maximum** total score you can achieve (it may be negative).",
        [
          { in: "grid = [[9,5,7,3],[8,9,6,1],[6,7,14,3],[2,5,3,1]]", out: String(ref(ex1)), note: "Start at (0,1) holding 5, move to (2,1) holding 7 (+2), then to (2,2) holding 14 (+7): total 9." },
          { in: "grid = [[4,3,2],[3,2,1]]", out: String(ref(ex2)), note: "Every move goes to a smaller value; the best single move is from 4 to 3 (or 3 to 2, …), scoring -1." },
          { in: "grid = [[1,9],[9,9]]", out: String(ref(ex3)), note: "Start at the 1 and move to any 9." },
        ],
        ["m == grid.length", "n == grid[i].length", "2 <= m, n <= 1000", "4 <= m * n <= 10^5", "1 <= grid[i][j] <= 10^5"]),
      hints: [
        "Add up the scores along a path: the middle values cancel. A path's score is just (last value) − (first value).",
        "So you only need the best pair of cells where the end is below and/or right of the start (and not the same cell).",
        "For each cell, keep the minimum over the rectangle above-left of it: `mn[i][j] = min(grid[i][j], mn[i-1][j], mn[i][j-1])`. The best path ending at `(i, j)` scores `grid[i][j] − min(mn[i-1][j], mn[i][j-1])`.",
      ],
      editorial: explain({
        idea: "The scores telescope: moving `a → b → c` scores `(b − a) + (c − b) = c − a`. So the answer is the largest `grid[end] − grid[start]` over pairs where `end` is reachable from `start` — any cell weakly below and weakly right, other than the start itself.",
        steps: [
          "Let `mn[i][j]` be the smallest value in the rectangle of rows `0..i` and columns `0..j`.",
          "For each cell in row-major order, let `prev = min(mn[i-1][j], mn[i][j-1])` (ignoring missing neighbours). If some neighbour exists, update the answer with `grid[i][j] − prev`.",
          "Set `mn[i][j] = min(prev, grid[i][j])`.",
          "Return the best value found.",
        ],
        why: "The cells that can reach `(i, j)` with at least one move are exactly the cells of its above-left rectangle other than itself, which is the union of the rectangles ending at `(i-1, j)` and `(i, j-1)`; their minimum is `prev`. Any such start reaches `(i, j)` by one vertical and one horizontal move (or a single move), and the telescoping sum makes the route irrelevant.",
        time: "O(m · n)",
        space: "O(m · n), or O(n) with one row",
        pitfalls: [
          "At least one move is required, so the start cannot equal the end — do not include `grid[i][j]` itself in `prev`.",
          "The answer can be negative; initialise the best with negative infinity, not 0.",
          "Moves go right or down only — a cell up-right of the start is not reachable.",
        ],
      }),
      examples: [
        { input: fmtIntMat(ex1), expectedOutput: String(ref(ex1)) },
        { input: fmtIntMat(ex2), expectedOutput: String(ref(ex2)) },
        { input: fmtIntMat(ex3), expectedOutput: String(ref(ex3)) },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 2, pick(rng, [2, 4, 8]));
        const n = ri(rng, 2, pick(rng, [2, 4, 8]));
        const top = pick(rng, [3, 20, 100000]);
        const grid = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, 1, top)));
        if (rng() < 0.15) {
          // strictly decreasing along both directions: every answer is negative
          for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) grid[i][j] = 100000 - (i + j) * ri(rng, 1, 50);
        }
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxScore(grid: List[List[int]]) -> int:
              m, n = len(grid), len(grid[0])
              INF = float('inf')
              mn = [[INF] * n for _ in range(m)]
              best = -INF
              for i in range(m):
                  for j in range(n):
                      prev = INF
                      if i > 0:
                          prev = mn[i - 1][j]
                      if j > 0 and mn[i][j - 1] < prev:
                          prev = mn[i][j - 1]
                      if prev < INF and grid[i][j] - prev > best:
                          best = grid[i][j] - prev
                      mn[i][j] = min(prev, grid[i][j])
              return best
        `,
        javascript: code`
          var maxScore = function(grid) {
              var m = grid.length, n = grid[0].length;
              var INF = Infinity, best = -Infinity;
              var mn = [];
              for (var i = 0; i < m; i++) mn.push(new Array(n).fill(INF));
              for (var i = 0; i < m; i++) {
                  for (var j = 0; j < n; j++) {
                      var prev = INF;
                      if (i > 0) prev = mn[i - 1][j];
                      if (j > 0 && mn[i][j - 1] < prev) prev = mn[i][j - 1];
                      if (prev < INF && grid[i][j] - prev > best) best = grid[i][j] - prev;
                      mn[i][j] = Math.min(prev, grid[i][j]);
                  }
              }
              return best;
          };
        `,
        typescript: code`
          function maxScore(grid: number[][]): number {
              var m = grid.length, n = grid[0].length;
              var INF = Infinity, best = -Infinity;
              var mn: number[][] = [];
              for (var i = 0; i < m; i++) {
                  var row: number[] = [];
                  for (var j = 0; j < n; j++) row.push(INF);
                  mn.push(row);
              }
              for (var i = 0; i < m; i++) {
                  for (var j = 0; j < n; j++) {
                      var prev = INF;
                      if (i > 0) prev = mn[i - 1][j];
                      if (j > 0 && mn[i][j - 1] < prev) prev = mn[i][j - 1];
                      if (prev < INF && grid[i][j] - prev > best) best = grid[i][j] - prev;
                      mn[i][j] = Math.min(prev, grid[i][j]);
                  }
              }
              return best;
          }
        `,
        java: code`
          public static int maxScore(int[][] grid) {
              int m = grid.length, n = grid[0].length;
              final int INF = Integer.MAX_VALUE;
              int[][] mn = new int[m][n];
              int best = Integer.MIN_VALUE;
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      int prev = INF;
                      if (i > 0) prev = mn[i - 1][j];
                      if (j > 0) prev = Math.min(prev, mn[i][j - 1]);
                      if (prev < INF) best = Math.max(best, grid[i][j] - prev);
                      mn[i][j] = Math.min(prev, grid[i][j]);
                  }
              }
              return best;
          }
        `,
        cpp: code`
          int maxScore(vector<vector<int>>& grid) {
              int m = grid.size(), n = grid[0].size();
              const int INF = INT_MAX;
              vector<vector<int>> mn(m, vector<int>(n, INF));
              int best = INT_MIN;
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      int prev = INF;
                      if (i > 0) prev = mn[i - 1][j];
                      if (j > 0) prev = min(prev, mn[i][j - 1]);
                      if (prev < INF) best = max(best, grid[i][j] - prev);
                      mn[i][j] = min(prev, grid[i][j]);
                  }
              }
              return best;
          }
        `,
        c: code`
          int maxScore(int** grid, int gridSize, int* gridColSize) {
              int m = gridSize, n = gridColSize[0];
              const int INF = 2147483647;
              int* mn = (int*) malloc(sizeof(int) * m * n);
              int best = -2147483647 - 1;
              for (int i = 0; i < m; i++) {
                  for (int j = 0; j < n; j++) {
                      int prev = INF;
                      if (i > 0) prev = mn[(i - 1) * n + j];
                      if (j > 0 && mn[i * n + j - 1] < prev) prev = mn[i * n + j - 1];
                      if (prev < INF && grid[i][j] - prev > best) best = grid[i][j] - prev;
                      mn[i * n + j] = prev < grid[i][j] ? prev : grid[i][j];
                  }
              }
              free(mn);
              return best;
          }
        `,
        csharp: code`
          public static int MaxScore(int[][] grid)
          {
              int m = grid.Length, n = grid[0].Length;
              const int INF = int.MaxValue;
              int[,] mn = new int[m, n];
              int best = int.MinValue;
              for (int i = 0; i < m; i++)
              {
                  for (int j = 0; j < n; j++)
                  {
                      int prev = INF;
                      if (i > 0) prev = mn[i - 1, j];
                      if (j > 0) prev = Math.Min(prev, mn[i, j - 1]);
                      if (prev < INF) best = Math.Max(best, grid[i][j] - prev);
                      mn[i, j] = Math.Min(prev, grid[i][j]);
                  }
              }
              return best;
          }
        `,
        go: code`
          func maxScore(grid [][]int) int {
              m, n := len(grid), len(grid[0])
              const inf = 1 << 40
              mn := make([][]int, m)
              for i := range mn {
                  mn[i] = make([]int, n)
              }
              best := -inf
              for i := 0; i < m; i++ {
                  for j := 0; j < n; j++ {
                      prev := inf
                      if i > 0 {
                          prev = mn[i-1][j]
                      }
                      if j > 0 && mn[i][j-1] < prev {
                          prev = mn[i][j-1]
                      }
                      if prev < inf && grid[i][j]-prev > best {
                          best = grid[i][j] - prev
                      }
                      if grid[i][j] < prev {
                          mn[i][j] = grid[i][j]
                      } else {
                          mn[i][j] = prev
                      }
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maxScore(grid: Array<IntArray>): Int {
              val m = grid.size
              val n = grid[0].size
              val inf = Int.MAX_VALUE
              val mn = Array(m) { IntArray(n) }
              var best = Int.MIN_VALUE
              for (i in 0 until m) {
                  for (j in 0 until n) {
                      var prev = inf
                      if (i > 0) prev = mn[i - 1][j]
                      if (j > 0) prev = minOf(prev, mn[i][j - 1])
                      if (prev < inf) best = maxOf(best, grid[i][j] - prev)
                      mn[i][j] = minOf(prev, grid[i][j])
                  }
              }
              return best
          }
        `,
        swift: code`
          func maxScore(_ grid: [[Int]]) -> Int {
              let m = grid.count, n = grid[0].count
              let inf = Int.max
              var mn = [[Int]](repeating: [Int](repeating: inf, count: n), count: m)
              var best = Int.min
              for i in 0..<m {
                  for j in 0..<n {
                      var prev = inf
                      if i > 0 { prev = mn[i - 1][j] }
                      if j > 0 { prev = min(prev, mn[i][j - 1]) }
                      if prev < inf { best = max(best, grid[i][j] - prev) }
                      mn[i][j] = min(prev, grid[i][j])
                  }
              }
              return best
          }
        `,
        rust: code`
          fn maxScore(grid: Vec<Vec<i32>>) -> i32 {
              let m = grid.len();
              let n = grid[0].len();
              let inf = std::i32::MAX;
              let mut mn = vec![vec![inf; n]; m];
              let mut best = std::i32::MIN;
              for i in 0..m {
                  for j in 0..n {
                      let mut prev = inf;
                      if i > 0 {
                          prev = mn[i - 1][j];
                      }
                      if j > 0 && mn[i][j - 1] < prev {
                          prev = mn[i][j - 1];
                      }
                      if prev < inf && grid[i][j] - prev > best {
                          best = grid[i][j] - prev;
                      }
                      mn[i][j] = std::cmp::min(prev, grid[i][j]);
                  }
              }
              best
          }
        `,
        php: code`
          function maxScore($grid) {
              $m = count($grid);
              $n = count($grid[0]);
              $INF = PHP_INT_MAX;
              $mn = array_fill(0, $m, array_fill(0, $n, $INF));
              $best = PHP_INT_MIN;
              for ($i = 0; $i < $m; $i++) {
                  for ($j = 0; $j < $n; $j++) {
                      $prev = $INF;
                      if ($i > 0) $prev = $mn[$i - 1][$j];
                      if ($j > 0 && $mn[$i][$j - 1] < $prev) $prev = $mn[$i][$j - 1];
                      if ($prev < $INF && $grid[$i][$j] - $prev > $best) $best = $grid[$i][$j] - $prev;
                      $mn[$i][$j] = min($prev, $grid[$i][$j]);
                  }
              }
              return $best;
          }
        `,
        ruby: code`
          def maxScore(grid)
            m = grid.length
            n = grid[0].length
            inf = Float::INFINITY
            mn = Array.new(m) { Array.new(n, inf) }
            best = -inf
            m.times do |i|
              n.times do |j|
                prev = inf
                prev = mn[i - 1][j] if i > 0
                prev = mn[i][j - 1] if j > 0 && mn[i][j - 1] < prev
                best = grid[i][j] - prev if prev < inf && grid[i][j] - prev > best
                mn[i][j] = [prev, grid[i][j]].min
              end
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Find the Maximum Length of a Good Subsequence II (LC 3177) ──
  (() => {
    // Brute force over every subsequence.
    const ref = (nums: number[], k: number) => {
      const n = nums.length;
      let best = 0;
      for (let m = 1; m < 1 << n; m++) {
        let len = 0, changes = 0, last = 0, have = false;
        for (let i = 0; i < n; i++) {
          if (!((m >> i) & 1)) continue;
          if (have && nums[i] !== last) changes++;
          last = nums[i];
          have = true;
          len++;
        }
        if (changes <= k && len > best) best = len;
      }
      return best;
    };
    return {
      slug: "find-the-maximum-length-of-a-good-subsequence-ii",
      title: "Find the Maximum Length of a Good Subsequence II",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Amazon", "Google"],
      signature: {
        funcName: "maximumLength",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an integer array `nums` and a non-negative integer `k`.\n\nA sequence `seq` is **good** if at most `k` indices `i` in the range `[0, seq.length - 2]` satisfy `seq[i] != seq[i + 1]` — that is, its value changes between neighbours at most `k` times.\n\nReturn the **maximum** possible length of a good subsequence of `nums`.",
        [
          { in: "nums = [1,2,1,1,3], k = 2", out: String(ref([1, 2, 1, 1, 3], 2)), note: "[1,2,1,1] changes value twice (1→2, 2→1)." },
          { in: "nums = [1,2,3,4,5,1], k = 0", out: String(ref([1, 2, 3, 4, 5, 1], 0)), note: "With no changes allowed, take equal values only: the two 1s." },
          { in: "nums = [7], k = 0", out: String(ref([7], 0)) },
        ],
        ["1 <= nums.length <= 5 * 10^3", "1 <= nums[i] <= 10^9", "0 <= k <= min(50, nums.length)"]),
      hints: [
        "Let `dp[x][j]` be the longest good subsequence (so far) that ends with value `x` and uses at most `j` changes.",
        "When you read another `x`, it can extend a subsequence already ending in `x` for free, or follow the best subsequence of any value that used at most `j - 1` changes.",
        "Keep `best[j]` = max over all values of `dp[·][j]`. Process `j` from `k` down to 0 so `best[j - 1]` still describes earlier elements: `dp[x][j] = max(dp[x][j], best[j - 1]) + 1`, then raise `best[j]`.",
      ],
      editorial: explain({
        idea: "A DP over (last value, changes used) is natural but naively takes `O(n^2 k)`. The trick: the best predecessor with a different value only matters through its length, so a running maximum `best[j]` over all values replaces the inner loop.",
        steps: [
          "Map each distinct value to an index and keep `dp[value][0..k]` (initially 0) and `best[0..k]`.",
          "For each element `x`, for `j` from `k` down to 0: `dp[x][j] = max(dp[x][j], j > 0 ? best[j - 1] : 0) + 1`, then `best[j] = max(best[j], dp[x][j])`.",
          "Return the maximum of `best`.",
        ],
        why: "A good subsequence ending at this `x` with at most `j` changes either had `x` before it (same value, no new change — the old `dp[x][j]`), or had some other value before it, spending one change on top of a subsequence with at most `j - 1` changes. Using `best[j - 1]` also allows a predecessor ending in `x`; counting that as a change only overestimates the changes used, so the result is still a valid subsequence and never exceeds the true optimum. Going from `k` down keeps this element from being used twice.",
        time: "O(n · k)",
        space: "O(n · k)",
        pitfalls: [
          "Updating `j` upwards lets one element follow itself through `best[j - 1]` in the same step.",
          "Values reach `10^9` — index them with a hash map, not an array.",
          "With `k = 0` the answer is the largest frequency of a single value.",
        ],
      }),
      examples: [
        { input: "[1,2,1,1,3]\n2", expectedOutput: String(ref([1, 2, 1, 1, 3], 2)) },
        { input: "[1,2,3,4,5,1]\n0", expectedOutput: String(ref([1, 2, 3, 4, 5, 1], 0)) },
        { input: "[7]\n0", expectedOutput: String(ref([7], 0)) },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 9, 12]));
        const top = pick(rng, [1, 2, 3, 6, 1000000000]);
        const pool = Array.from({ length: 6 }, () => ri(rng, 1, top));
        const nums = Array.from({ length: n }, () => (top === 1000000000 ? pick(rng, pool) : ri(rng, 1, top)));
        const k = ri(rng, 0, Math.min(n, pick(rng, [0, 2, 5, 50])));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumLength(nums: List[int], k: int) -> int:
              dp = {}
              best = [0] * (k + 1)
              for x in nums:
                  row = dp.get(x)
                  if row is None:
                      row = [0] * (k + 1)
                      dp[x] = row
                  for j in range(k, -1, -1):
                      prev = best[j - 1] if j > 0 else 0
                      row[j] = max(row[j], prev) + 1
                      if row[j] > best[j]:
                          best[j] = row[j]
              return max(best)
        `,
        javascript: code`
          var maximumLength = function(nums, k) {
              var dp = new Map();
              var best = new Array(k + 1).fill(0);
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i];
                  var row = dp.get(x);
                  if (row === undefined) { row = new Array(k + 1).fill(0); dp.set(x, row); }
                  for (var j = k; j >= 0; j--) {
                      var prev = j > 0 ? best[j - 1] : 0;
                      row[j] = Math.max(row[j], prev) + 1;
                      if (row[j] > best[j]) best[j] = row[j];
                  }
              }
              return Math.max.apply(null, best);
          };
        `,
        typescript: code`
          function maximumLength(nums: number[], k: number): number {
              var dp: { [key: string]: number[] } = {};
              var best: number[] = [];
              for (var j = 0; j <= k; j++) best.push(0);
              for (var i = 0; i < nums.length; i++) {
                  var key = String(nums[i]);
                  var row = dp[key];
                  if (row === undefined) {
                      row = [];
                      for (var j = 0; j <= k; j++) row.push(0);
                      dp[key] = row;
                  }
                  for (var j = k; j >= 0; j--) {
                      var prev = j > 0 ? best[j - 1] : 0;
                      row[j] = Math.max(row[j], prev) + 1;
                      if (row[j] > best[j]) best[j] = row[j];
                  }
              }
              return Math.max.apply(null, best);
          }
        `,
        java: code`
          public static int maximumLength(int[] nums, int k) {
              HashMap<Integer, int[]> dp = new HashMap<>();
              int[] best = new int[k + 1];
              for (int x : nums) {
                  int[] row = dp.computeIfAbsent(x, key -> new int[k + 1]);
                  for (int j = k; j >= 0; j--) {
                      int prev = j > 0 ? best[j - 1] : 0;
                      row[j] = Math.max(row[j], prev) + 1;
                      best[j] = Math.max(best[j], row[j]);
                  }
              }
              int ans = 0;
              for (int v : best) ans = Math.max(ans, v);
              return ans;
          }
        `,
        cpp: code`
          int maximumLength(vector<int>& nums, int k) {
              unordered_map<int, vector<int>> dp;
              vector<int> best(k + 1, 0);
              for (int x : nums) {
                  auto it = dp.find(x);
                  if (it == dp.end()) it = dp.emplace(x, vector<int>(k + 1, 0)).first;
                  vector<int>& row = it->second;
                  for (int j = k; j >= 0; j--) {
                      int prev = j > 0 ? best[j - 1] : 0;
                      row[j] = max(row[j], prev) + 1;
                      best[j] = max(best[j], row[j]);
                  }
              }
              return *max_element(best.begin(), best.end());
          }
        `,
        c: code`
          static int cmpInt(const void* p, const void* q) {
              int a = *(const int*) p, b = *(const int*) q;
              return (a > b) - (a < b);
          }

          int maximumLength(int* nums, int numsSize, int k) {
              int n = numsSize;
              // Compress values: sorted distinct copy + binary search.
              int* keys = (int*) malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) keys[i] = nums[i];
              qsort(keys, n, sizeof(int), cmpInt);
              int m = 0;
              for (int i = 0; i < n; i++) if (m == 0 || keys[m - 1] != keys[i]) keys[m++] = keys[i];
              int W = k + 1;
              int* dp = (int*) calloc((size_t) m * W, sizeof(int));
              int* best = (int*) calloc((size_t) W, sizeof(int));
              for (int i = 0; i < n; i++) {
                  int lo = 0, hi = m - 1;
                  while (lo < hi) {
                      int mid = (lo + hi) / 2;
                      if (keys[mid] < nums[i]) lo = mid + 1; else hi = mid;
                  }
                  int* row = dp + (long long) lo * W;
                  for (int j = k; j >= 0; j--) {
                      int prev = j > 0 ? best[j - 1] : 0;
                      row[j] = (row[j] > prev ? row[j] : prev) + 1;
                      if (row[j] > best[j]) best[j] = row[j];
                  }
              }
              int ans = 0;
              for (int j = 0; j <= k; j++) if (best[j] > ans) ans = best[j];
              free(keys); free(dp); free(best);
              return ans;
          }
        `,
        csharp: code`
          public static int MaximumLength(int[] nums, int k)
          {
              var dp = new Dictionary<int, int[]>();
              int[] best = new int[k + 1];
              foreach (int x in nums)
              {
                  int[] row;
                  if (!dp.TryGetValue(x, out row)) { row = new int[k + 1]; dp[x] = row; }
                  for (int j = k; j >= 0; j--)
                  {
                      int prev = j > 0 ? best[j - 1] : 0;
                      row[j] = Math.Max(row[j], prev) + 1;
                      best[j] = Math.Max(best[j], row[j]);
                  }
              }
              return best.Max();
          }
        `,
        go: code`
          func maximumLength(nums []int, k int) int {
              dp := map[int][]int{}
              best := make([]int, k+1)
              for _, x := range nums {
                  row, ok := dp[x]
                  if !ok {
                      row = make([]int, k+1)
                      dp[x] = row
                  }
                  for j := k; j >= 0; j-- {
                      prev := 0
                      if j > 0 {
                          prev = best[j-1]
                      }
                      if row[j] > prev {
                          prev = row[j]
                      }
                      row[j] = prev + 1
                      if row[j] > best[j] {
                          best[j] = row[j]
                      }
                  }
              }
              ans := 0
              for _, v := range best {
                  if v > ans {
                      ans = v
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun maximumLength(nums: IntArray, k: Int): Int {
              val dp = HashMap<Int, IntArray>()
              val best = IntArray(k + 1)
              for (x in nums) {
                  val row = dp.getOrPut(x) { IntArray(k + 1) }
                  for (j in k downTo 0) {
                      val prev = if (j > 0) best[j - 1] else 0
                      row[j] = maxOf(row[j], prev) + 1
                      best[j] = maxOf(best[j], row[j])
                  }
              }
              return best.maxOrNull()!!
          }
        `,
        swift: code`
          func maximumLength(_ nums: [Int], _ k: Int) -> Int {
              var index = [Int: Int]()
              var dp = [[Int]]()
              var best = [Int](repeating: 0, count: k + 1)
              for x in nums {
                  let r: Int
                  if let found = index[x] {
                      r = found
                  } else {
                      r = dp.count
                      index[x] = r
                      dp.append([Int](repeating: 0, count: k + 1))
                  }
                  var j = k
                  while j >= 0 {
                      let prev = j > 0 ? best[j - 1] : 0
                      dp[r][j] = max(dp[r][j], prev) + 1
                      best[j] = max(best[j], dp[r][j])
                      j -= 1
                  }
              }
              return best.max()!
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn maximumLength(nums: Vec<i32>, k: i32) -> i32 {
              let k = k as usize;
              let mut dp: HashMap<i32, Vec<i32>> = HashMap::new();
              let mut best = vec![0i32; k + 1];
              for &x in &nums {
                  let row = dp.entry(x).or_insert_with(|| vec![0; k + 1]);
                  for j in (0..=k).rev() {
                      let prev = if j > 0 { best[j - 1] } else { 0 };
                      row[j] = std::cmp::max(row[j], prev) + 1;
                      if row[j] > best[j] {
                          best[j] = row[j];
                      }
                  }
              }
              *best.iter().max().unwrap()
          }
        `,
        php: code`
          function maximumLength($nums, $k) {
              $dp = [];
              $best = array_fill(0, $k + 1, 0);
              foreach ($nums as $x) {
                  if (!isset($dp[$x])) $dp[$x] = array_fill(0, $k + 1, 0);
                  $row = $dp[$x];
                  for ($j = $k; $j >= 0; $j--) {
                      $prev = $j > 0 ? $best[$j - 1] : 0;
                      $row[$j] = max($row[$j], $prev) + 1;
                      if ($row[$j] > $best[$j]) $best[$j] = $row[$j];
                  }
                  $dp[$x] = $row;
              }
              return max($best);
          }
        `,
        ruby: code`
          def maximumLength(nums, k)
            dp = {}
            best = Array.new(k + 1, 0)
            nums.each do |x|
              row = (dp[x] ||= Array.new(k + 1, 0))
              k.downto(0) do |j|
                prev = j > 0 ? best[j - 1] : 0
                row[j] = [row[j], prev].max + 1
                best[j] = row[j] if row[j] > best[j]
              end
            end
            best.max
          end
        `,
      },
    };
  })(),

  // ── Maximum Total Reward Using Operations I (LC 3180) ───────────
  (() => {
    // Brute force: a set of rewards can all be collected iff, taken in
    // increasing order, each one exceeds the sum of those before it.
    const ref = (rewardValues: number[]) => {
      const n = rewardValues.length;
      let best = 0;
      for (let m = 0; m < 1 << n; m++) {
        const chosen: number[] = [];
        for (let i = 0; i < n; i++) if ((m >> i) & 1) chosen.push(rewardValues[i]);
        chosen.sort((a, b) => a - b);
        let x = 0, ok = true;
        for (const v of chosen) { if (v <= x) { ok = false; break; } x += v; }
        if (ok && x > best) best = x;
      }
      return best;
    };
    return {
      slug: "maximum-total-reward-using-operations-i",
      title: "Maximum Total Reward Using Operations I",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Bit Manipulation", "Amazon"],
      signature: { funcName: "maxTotalReward", params: [{ name: "rewardValues", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `rewardValues` of length `n`. Your total reward `x` starts at `0`, and every index starts unmarked.\n\nYou may repeat the following operation any number of times: choose an unmarked index `i`; if `rewardValues[i]` is **strictly greater** than your current total `x`, add it to `x` (`x = x + rewardValues[i]`). Either way, mark index `i`.\n\nReturn the **maximum** total reward you can collect by performing the operations optimally.",
        [
          { in: "rewardValues = [1,1,3,3]", out: String(ref([1, 1, 3, 3])), note: "Take a 1 (x = 1), then a 3 (x = 4). The other 1 and 3 are no longer larger than x." },
          { in: "rewardValues = [1,6,4,3,2]", out: String(ref([1, 6, 4, 3, 2])), note: "Take 1, then 4 (x = 5), then 6 (x = 11). Taking 1, 2 and 4 instead reaches 7 and blocks the 6." },
          { in: "rewardValues = [7]", out: String(ref([7])) },
        ],
        ["1 <= rewardValues.length <= 2000", "1 <= rewardValues[i] <= 2000"]),
      hints: [
        "Any set of rewards you collect can be collected in increasing order, and that order works exactly when each value exceeds the sum of the smaller chosen ones.",
        "So sort the values and decide, in increasing order, which to take. The state is just the current total `x`.",
        "Every reachable total is below `2 · max(rewardValues)`. Keep a boolean array of reachable totals; a value `v` can be added to any reachable total `x < v`, giving `x + v`.",
      ],
      editorial: explain({
        idea: "Collect rewards in increasing order — any feasible set stays feasible in that order. Then it is a reachability DP over the running total, which never exceeds `2 · max − 1` (the last value added is at most the max, and the total before it is smaller than that value).",
        steps: [
          "Sort the distinct values ascending. Let `M` be the largest; make `reach[0..2M-1]` with only `reach[0] = true`.",
          "For each value `v` in order, for every total `x < v` with `reach[x]`, set `reach[x + v] = true`.",
          "Return the largest `x` with `reach[x]`.",
        ],
        why: "If a set can be collected in some order, then in that order each element exceeds the sum of everything before it, including every smaller element of the set — so increasing order works too. Processing values in increasing order and only adding `v` to totals below `v` is exactly that rule. Duplicates never help (a second copy of `v` would need `x < v` after already adding `v`), so distinct values suffice. Totals written by `v` are at least `v`, above the totals it reads, so one pass per value does not reuse `v`.",
        time: "O(n log n + n · M)",
        space: "O(M)",
        pitfalls: [
          "The condition is strictly greater: a value equal to the current total cannot be taken.",
          "Taking values greedily from smallest up is not optimal — skipping small values can unlock a larger one.",
          "A bitset (a big integer in Python) speeds the inner loop up by a word size; that is what the harder version of this problem needs.",
        ],
      }),
      examples: [
        { input: "[1,1,3,3]", expectedOutput: String(ref([1, 1, 3, 3])) },
        { input: "[1,6,4,3,2]", expectedOutput: String(ref([1, 6, 4, 3, 2])) },
        { input: "[7]", expectedOutput: String(ref([7])) },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 8, 11]));
        const top = pick(rng, [3, 10, 50, 2000]);
        const rewardValues = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(rewardValues), expectedOutput: String(ref(rewardValues)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxTotalReward(rewardValues: List[int]) -> int:
              reach = 1  # bit x set <=> total x is reachable
              for v in sorted(set(rewardValues)):
                  reach |= (reach & ((1 << v) - 1)) << v
              return reach.bit_length() - 1
        `,
        javascript: code`
          var maxTotalReward = function(rewardValues) {
              var vals = rewardValues.slice().sort(function(a, b) { return a - b; });
              var M = vals[vals.length - 1];
              var reach = new Array(2 * M).fill(false);
              reach[0] = true;
              for (var i = 0; i < vals.length; i++) {
                  var v = vals[i];
                  if (i > 0 && v === vals[i - 1]) continue;
                  for (var x = 0; x < v; x++) if (reach[x]) reach[x + v] = true;
              }
              for (var x = 2 * M - 1; x >= 0; x--) if (reach[x]) return x;
              return 0;
          };
        `,
        typescript: code`
          function maxTotalReward(rewardValues: number[]): number {
              var vals = rewardValues.slice().sort(function(a, b) { return a - b; });
              var M = vals[vals.length - 1];
              var reach: boolean[] = [];
              for (var x = 0; x < 2 * M; x++) reach.push(false);
              reach[0] = true;
              for (var i = 0; i < vals.length; i++) {
                  var v = vals[i];
                  if (i > 0 && v === vals[i - 1]) continue;
                  for (var x = 0; x < v; x++) if (reach[x]) reach[x + v] = true;
              }
              for (var x = 2 * M - 1; x >= 0; x--) if (reach[x]) return x;
              return 0;
          }
        `,
        java: code`
          public static int maxTotalReward(int[] rewardValues) {
              int[] vals = rewardValues.clone();
              Arrays.sort(vals);
              int M = vals[vals.length - 1];
              boolean[] reach = new boolean[2 * M];
              reach[0] = true;
              for (int i = 0; i < vals.length; i++) {
                  int v = vals[i];
                  if (i > 0 && v == vals[i - 1]) continue;
                  for (int x = 0; x < v; x++) if (reach[x]) reach[x + v] = true;
              }
              for (int x = 2 * M - 1; x >= 0; x--) if (reach[x]) return x;
              return 0;
          }
        `,
        cpp: code`
          int maxTotalReward(vector<int>& rewardValues) {
              vector<int> vals = rewardValues;
              sort(vals.begin(), vals.end());
              int M = vals.back();
              vector<char> reach(2 * M, 0);
              reach[0] = 1;
              for (int i = 0; i < (int) vals.size(); i++) {
                  int v = vals[i];
                  if (i > 0 && v == vals[i - 1]) continue;
                  for (int x = 0; x < v; x++) if (reach[x]) reach[x + v] = 1;
              }
              for (int x = 2 * M - 1; x >= 0; x--) if (reach[x]) return x;
              return 0;
          }
        `,
        c: code`
          static int cmpInt(const void* p, const void* q) {
              int a = *(const int*) p, b = *(const int*) q;
              return (a > b) - (a < b);
          }

          int maxTotalReward(int* rewardValues, int rewardValuesSize) {
              int n = rewardValuesSize;
              int* vals = (int*) malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) vals[i] = rewardValues[i];
              qsort(vals, n, sizeof(int), cmpInt);
              int M = vals[n - 1];
              char* reach = (char*) calloc((size_t) 2 * M, 1);
              reach[0] = 1;
              for (int i = 0; i < n; i++) {
                  int v = vals[i];
                  if (i > 0 && v == vals[i - 1]) continue;
                  for (int x = 0; x < v; x++) if (reach[x]) reach[x + v] = 1;
              }
              int ans = 0;
              for (int x = 2 * M - 1; x >= 0; x--) if (reach[x]) { ans = x; break; }
              free(vals);
              free(reach);
              return ans;
          }
        `,
        csharp: code`
          public static int MaxTotalReward(int[] rewardValues)
          {
              int[] vals = (int[]) rewardValues.Clone();
              Array.Sort(vals);
              int M = vals[vals.Length - 1];
              bool[] reach = new bool[2 * M];
              reach[0] = true;
              for (int i = 0; i < vals.Length; i++)
              {
                  int v = vals[i];
                  if (i > 0 && v == vals[i - 1]) continue;
                  for (int x = 0; x < v; x++) if (reach[x]) reach[x + v] = true;
              }
              for (int x = 2 * M - 1; x >= 0; x--) if (reach[x]) return x;
              return 0;
          }
        `,
        go: code`
          func maxTotalReward(rewardValues []int) int {
              vals := append([]int(nil), rewardValues...)
              sort.Ints(vals)
              M := vals[len(vals)-1]
              reach := make([]bool, 2*M)
              reach[0] = true
              for i, v := range vals {
                  if i > 0 && v == vals[i-1] {
                      continue
                  }
                  for x := 0; x < v; x++ {
                      if reach[x] {
                          reach[x+v] = true
                      }
                  }
              }
              for x := 2*M - 1; x >= 0; x-- {
                  if reach[x] {
                      return x
                  }
              }
              return 0
          }
        `,
        kotlin: code`
          fun maxTotalReward(rewardValues: IntArray): Int {
              val vals = rewardValues.sortedArray()
              val top = vals[vals.size - 1]
              val reach = BooleanArray(2 * top)
              reach[0] = true
              for (i in vals.indices) {
                  val v = vals[i]
                  if (i > 0 && v == vals[i - 1]) continue
                  for (x in 0 until v) if (reach[x]) reach[x + v] = true
              }
              for (x in 2 * top - 1 downTo 0) if (reach[x]) return x
              return 0
          }
        `,
        swift: code`
          func maxTotalReward(_ rewardValues: [Int]) -> Int {
              let vals = rewardValues.sorted()
              let M = vals[vals.count - 1]
              var reach = [Bool](repeating: false, count: 2 * M)
              reach[0] = true
              for i in 0..<vals.count {
                  let v = vals[i]
                  if i > 0 && v == vals[i - 1] { continue }
                  for x in 0..<v where reach[x] { reach[x + v] = true }
              }
              var x = 2 * M - 1
              while x >= 0 {
                  if reach[x] { return x }
                  x -= 1
              }
              return 0
          }
        `,
        rust: code`
          fn maxTotalReward(reward_values: Vec<i32>) -> i32 {
              let mut vals: Vec<usize> = reward_values.iter().map(|&v| v as usize).collect();
              vals.sort();
              vals.dedup();
              let m = *vals.last().unwrap();
              let mut reach = vec![false; 2 * m];
              reach[0] = true;
              for &v in &vals {
                  for x in 0..v {
                      if reach[x] {
                          reach[x + v] = true;
                      }
                  }
              }
              (0..2 * m).rev().find(|&x| reach[x]).unwrap_or(0) as i32
          }
        `,
        php: code`
          function maxTotalReward($rewardValues) {
              $vals = array_values(array_unique($rewardValues));
              sort($vals);
              $M = $vals[count($vals) - 1];
              $reach = array_fill(0, 2 * $M, false);
              $reach[0] = true;
              foreach ($vals as $v) {
                  for ($x = 0; $x < $v; $x++) if ($reach[$x]) $reach[$x + $v] = true;
              }
              for ($x = 2 * $M - 1; $x >= 0; $x--) if ($reach[$x]) return $x;
              return 0;
          }
        `,
        ruby: code`
          def maxTotalReward(rewardValues)
            reach = 1 # bit x set <=> total x is reachable
            rewardValues.uniq.sort.each do |v|
              reach |= (reach & ((1 << v) - 1)) << v
            end
            reach.bit_length - 1
          end
        `,
      },
    };
  })(),

  // ── Maximum Total Damage With Spell Casting (LC 3186) ───────────
  (() => {
    // Brute force over subsets of distinct values (taking a value means
    // casting every spell with it — the copies never conflict).
    const ref = (power: number[]) => {
      const cnt = new Map<number, number>();
      for (const p of power) cnt.set(p, (cnt.get(p) || 0) + 1);
      const vals = Array.from(cnt.keys()).sort((a, b) => a - b);
      const m = vals.length;
      let best = 0;
      for (let mask = 0; mask < 1 << m; mask++) {
        let ok = true, total = 0, prev = -Infinity;
        for (let i = 0; i < m; i++) {
          if (!((mask >> i) & 1)) continue;
          if (vals[i] - prev <= 2) { ok = false; break; }
          prev = vals[i];
          total += vals[i] * (cnt.get(vals[i]) as number);
        }
        if (ok && total > best) best = total;
      }
      return best;
    };
    return {
      slug: "maximum-total-damage-with-spell-casting",
      title: "Maximum Total Damage With Spell Casting",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Two Pointers", "Binary Search", "Dynamic Programming", "Sorting", "Counting", "Amazon"],
      signature: { funcName: "maximumTotalDamage", params: [{ name: "power", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A magician knows several spells; `power[i]` is the damage of the `i`-th spell. Several spells may share the same damage value.\n\nIf the magician casts a spell with damage `power[i]`, they can no longer cast any spell with damage `power[i] - 2`, `power[i] - 1`, `power[i] + 1` or `power[i] + 2`. Each spell can be cast at most once.\n\nReturn the **maximum** total damage the magician can deal.",
        [
          { in: "power = [1,1,3,4]", out: String(ref([1, 1, 3, 4])), note: "Cast both 1s and the 4: 1 + 1 + 4 = 6." },
          { in: "power = [7,1,6,6]", out: String(ref([7, 1, 6, 6])), note: "Cast 1, 6 and 6: 13." },
          { in: "power = [5]", out: String(ref([5])) },
        ],
        ["1 <= power.length <= 10^5", "1 <= power[i] <= 10^4 (reduced from 10^9 so the total fits a 32-bit integer)"]),
      hints: [
        "Spells with the same damage never block each other, so if you cast one with value `v` you should cast all of them: the value is worth `v · count(v)`.",
        "Sort the distinct values. Choosing a value forbids its neighbours within distance 2 — a house-robber-style DP over sorted values.",
        "`dp[i] = max(dp[i - 1], value_i · count_i + dp[j])`, where `j` counts the distinct values smaller than `value_i - 2` — a pointer that only moves forward finds it.",
      ],
      editorial: explain({
        idea: "Group spells by damage. Within a group there is no conflict, so a group is all-or-nothing, worth `v · count(v)`. Across groups the rule is: chosen values must differ by more than 2. On the sorted distinct values that is a house-robber DP with a variable look-back.",
        steps: [
          "Count each damage value and sort the distinct values `v_0 < v_1 < … < v_{m-1}`.",
          "Let `dp[i]` be the best total using only `v_0..v_{i-1}`; `dp[0] = 0`.",
          "For each `i`, advance a pointer `j` while `v_j < v_i - 2`, so `j` is the number of values compatible with `v_i`. Then `dp[i + 1] = max(dp[i], dp[j] + v_i · count(v_i))`.",
          "Return `dp[m]`.",
        ],
        why: "The best set either skips `v_i` (giving `dp[i]`) or takes it, in which case it cannot contain `v_i - 1` or `v_i - 2` and every other smaller value is unaffected — exactly the first `j` values. Because the values are sorted, `j` never moves backwards.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Looking back exactly two positions is wrong — the values are not consecutive integers; use the pointer.",
          "Taking only one copy of a value wastes damage; copies never conflict.",
          "Totals can be large; use 64-bit accumulators where the language needs them.",
        ],
      }),
      examples: [
        { input: "[1,1,3,4]", expectedOutput: String(ref([1, 1, 3, 4])) },
        { input: "[7,1,6,6]", expectedOutput: String(ref([7, 1, 6, 6])) },
        { input: "[5]", expectedOutput: String(ref([5])) },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 15, 40]));
        const top = pick(rng, [3, 8, 20, 10000]);
        let power = Array.from({ length: n }, () => ri(rng, 1, top));
        if (top === 10000) {
          // keep at most ~12 distinct values so the reference subset search stays small
          const pool = Array.from({ length: 12 }, () => ri(rng, 1, 10000));
          power = power.map(() => pick(rng, pool));
        }
        return { input: fmtIntArr(power), expectedOutput: String(ref(power)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumTotalDamage(power: List[int]) -> int:
              cnt = {}
              for p in power:
                  cnt[p] = cnt.get(p, 0) + 1
              vals = sorted(cnt)
              m = len(vals)
              dp = [0] * (m + 1)
              j = 0
              for i in range(m):
                  while vals[j] < vals[i] - 2:
                      j += 1
                  dp[i + 1] = max(dp[i], dp[j] + vals[i] * cnt[vals[i]])
              return dp[m]
        `,
        javascript: code`
          var maximumTotalDamage = function(power) {
              var a = power.slice().sort(function(p, q) { return p - q; });
              var vals = [], tot = [];
              for (var i = 0; i < a.length; i++) {
                  if (vals.length > 0 && vals[vals.length - 1] === a[i]) tot[tot.length - 1] += a[i];
                  else { vals.push(a[i]); tot.push(a[i]); }
              }
              var m = vals.length;
              var dp = new Array(m + 1).fill(0), j = 0;
              for (var i = 0; i < m; i++) {
                  while (vals[j] < vals[i] - 2) j++;
                  dp[i + 1] = Math.max(dp[i], dp[j] + tot[i]);
              }
              return dp[m];
          };
        `,
        typescript: code`
          function maximumTotalDamage(power: number[]): number {
              var a = power.slice().sort(function(p, q) { return p - q; });
              var vals: number[] = [], tot: number[] = [];
              for (var i = 0; i < a.length; i++) {
                  if (vals.length > 0 && vals[vals.length - 1] === a[i]) tot[tot.length - 1] += a[i];
                  else { vals.push(a[i]); tot.push(a[i]); }
              }
              var m = vals.length;
              var dp: number[] = [];
              for (var i = 0; i <= m; i++) dp.push(0);
              var j = 0;
              for (var i = 0; i < m; i++) {
                  while (vals[j] < vals[i] - 2) j++;
                  dp[i + 1] = Math.max(dp[i], dp[j] + tot[i]);
              }
              return dp[m];
          }
        `,
        java: code`
          public static int maximumTotalDamage(int[] power) {
              int[] a = power.clone();
              Arrays.sort(a);
              int n = a.length, m = 0;
              int[] vals = new int[n];
              long[] tot = new long[n];
              for (int i = 0; i < n; i++) {
                  if (m > 0 && vals[m - 1] == a[i]) tot[m - 1] += a[i];
                  else { vals[m] = a[i]; tot[m] = a[i]; m++; }
              }
              long[] dp = new long[m + 1];
              int j = 0;
              for (int i = 0; i < m; i++) {
                  while (vals[j] < vals[i] - 2) j++;
                  dp[i + 1] = Math.max(dp[i], dp[j] + tot[i]);
              }
              return (int) dp[m];
          }
        `,
        cpp: code`
          int maximumTotalDamage(vector<int>& power) {
              vector<int> a = power;
              sort(a.begin(), a.end());
              vector<int> vals;
              vector<long long> tot;
              for (int x : a) {
                  if (!vals.empty() && vals.back() == x) tot.back() += x;
                  else { vals.push_back(x); tot.push_back(x); }
              }
              int m = vals.size();
              vector<long long> dp(m + 1, 0);
              int j = 0;
              for (int i = 0; i < m; i++) {
                  while (vals[j] < vals[i] - 2) j++;
                  dp[i + 1] = max(dp[i], dp[j] + tot[i]);
              }
              return (int) dp[m];
          }
        `,
        c: code`
          static int cmpInt(const void* p, const void* q) {
              int a = *(const int*) p, b = *(const int*) q;
              return (a > b) - (a < b);
          }

          int maximumTotalDamage(int* power, int powerSize) {
              int n = powerSize, m = 0;
              int* a = (int*) malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) a[i] = power[i];
              qsort(a, n, sizeof(int), cmpInt);
              int* vals = (int*) malloc(sizeof(int) * n);
              long long* tot = (long long*) malloc(sizeof(long long) * n);
              for (int i = 0; i < n; i++) {
                  if (m > 0 && vals[m - 1] == a[i]) tot[m - 1] += a[i];
                  else { vals[m] = a[i]; tot[m] = a[i]; m++; }
              }
              long long* dp = (long long*) calloc((size_t) m + 1, sizeof(long long));
              int j = 0;
              for (int i = 0; i < m; i++) {
                  while (vals[j] < vals[i] - 2) j++;
                  long long take = dp[j] + tot[i];
                  dp[i + 1] = dp[i] > take ? dp[i] : take;
              }
              int ans = (int) dp[m];
              free(a); free(vals); free(tot); free(dp);
              return ans;
          }
        `,
        csharp: code`
          public static int MaximumTotalDamage(int[] power)
          {
              int[] a = (int[]) power.Clone();
              Array.Sort(a);
              var vals = new List<int>();
              var tot = new List<long>();
              foreach (int x in a)
              {
                  if (vals.Count > 0 && vals[vals.Count - 1] == x) tot[tot.Count - 1] += x;
                  else { vals.Add(x); tot.Add(x); }
              }
              int m = vals.Count;
              long[] dp = new long[m + 1];
              int j = 0;
              for (int i = 0; i < m; i++)
              {
                  while (vals[j] < vals[i] - 2) j++;
                  dp[i + 1] = Math.Max(dp[i], dp[j] + tot[i]);
              }
              return (int) dp[m];
          }
        `,
        go: code`
          func maximumTotalDamage(power []int) int {
              a := append([]int(nil), power...)
              sort.Ints(a)
              vals, tot := []int{}, []int{}
              for _, x := range a {
                  if len(vals) > 0 && vals[len(vals)-1] == x {
                      tot[len(tot)-1] += x
                  } else {
                      vals = append(vals, x)
                      tot = append(tot, x)
                  }
              }
              m := len(vals)
              dp := make([]int, m+1)
              j := 0
              for i := 0; i < m; i++ {
                  for vals[j] < vals[i]-2 {
                      j++
                  }
                  dp[i+1] = dp[i]
                  if dp[j]+tot[i] > dp[i+1] {
                      dp[i+1] = dp[j] + tot[i]
                  }
              }
              return dp[m]
          }
        `,
        kotlin: code`
          fun maximumTotalDamage(power: IntArray): Int {
              val a = power.sortedArray()
              val vals = ArrayList<Int>()
              val tot = ArrayList<Long>()
              for (x in a) {
                  if (vals.isNotEmpty() && vals[vals.size - 1] == x) tot[tot.size - 1] = tot[tot.size - 1] + x
                  else { vals.add(x); tot.add(x.toLong()) }
              }
              val m = vals.size
              val dp = LongArray(m + 1)
              var j = 0
              for (i in 0 until m) {
                  while (vals[j] < vals[i] - 2) j++
                  dp[i + 1] = maxOf(dp[i], dp[j] + tot[i])
              }
              return dp[m].toInt()
          }
        `,
        swift: code`
          func maximumTotalDamage(_ power: [Int]) -> Int {
              var vals = [Int](), tot = [Int]()
              for x in power.sorted() {
                  if let last = vals.last, last == x {
                      tot[tot.count - 1] += x
                  } else {
                      vals.append(x)
                      tot.append(x)
                  }
              }
              let m = vals.count
              var dp = [Int](repeating: 0, count: m + 1)
              var j = 0
              for i in 0..<m {
                  while vals[j] < vals[i] - 2 { j += 1 }
                  dp[i + 1] = max(dp[i], dp[j] + tot[i])
              }
              return dp[m]
          }
        `,
        rust: code`
          fn maximumTotalDamage(power: Vec<i32>) -> i32 {
              let mut a = power.clone();
              a.sort();
              let mut vals: Vec<i64> = Vec::new();
              let mut tot: Vec<i64> = Vec::new();
              for &x in &a {
                  let x = x as i64;
                  if !vals.is_empty() && *vals.last().unwrap() == x {
                      *tot.last_mut().unwrap() += x;
                  } else {
                      vals.push(x);
                      tot.push(x);
                  }
              }
              let m = vals.len();
              let mut dp = vec![0i64; m + 1];
              let mut j = 0;
              for i in 0..m {
                  while vals[j] < vals[i] - 2 {
                      j += 1;
                  }
                  dp[i + 1] = std::cmp::max(dp[i], dp[j] + tot[i]);
              }
              dp[m] as i32
          }
        `,
        php: code`
          function maximumTotalDamage($power) {
              sort($power);
              $vals = [];
              $tot = [];
              foreach ($power as $x) {
                  $m = count($vals);
                  if ($m > 0 && $vals[$m - 1] == $x) $tot[$m - 1] += $x;
                  else { $vals[] = $x; $tot[] = $x; }
              }
              $m = count($vals);
              $dp = array_fill(0, $m + 1, 0);
              $j = 0;
              for ($i = 0; $i < $m; $i++) {
                  while ($vals[$j] < $vals[$i] - 2) $j++;
                  $dp[$i + 1] = max($dp[$i], $dp[$j] + $tot[$i]);
              }
              return $dp[$m];
          }
        `,
        ruby: code`
          def maximumTotalDamage(power)
            cnt = Hash.new(0)
            power.each { |p| cnt[p] += 1 }
            vals = cnt.keys.sort
            m = vals.length
            dp = Array.new(m + 1, 0)
            j = 0
            m.times do |i|
              j += 1 while vals[j] < vals[i] - 2
              dp[i + 1] = [dp[i], dp[j] + vals[i] * cnt[vals[i]]].max
            end
            dp[m]
          end
        `,
      },
    };
  })(),
];
