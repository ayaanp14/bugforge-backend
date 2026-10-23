/**
 * Hashing, counting & array-scan problems — wave 7, batch 12.
 * Real problems only: LeetCode numbered problems (recent weekly-contest
 * mediums and easies, plus a few long-standing classics). Worked examples are
 * phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h.
 *
 * Where LeetCode returns a 64-bit count (Count Special Subsequences), the
 * constraints are tightened so the true answer fits in int32, and the entry
 * says so. Where the answer is a list, the statement fixes its order. Most
 * entries here are a frequency table away from the answer; the C solutions
 * use a fixed-size count array where the value range allows it, and sort +
 * binary search or a small trie where it does not.
 */
import {
  bool, code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const HASHING9_PROBLEMS: CatalogProblem[] = [

  // ── Count Almost Equal Pairs I (LC 3265) ────────────────────────
  (() => {
    const swapsOf = (x: number): Set<number> => {
      const d = String(x).split("");
      const out = new Set<number>([x]);
      for (let i = 0; i < d.length; i++) {
        for (let j = i + 1; j < d.length; j++) {
          const t = d.slice();
          const tmp = t[i]; t[i] = t[j]; t[j] = tmp;
          out.add(parseInt(t.join(""), 10));
        }
      }
      return out;
    };
    const ref = (nums: number[]) => {
      const sets = nums.map(swapsOf);
      let c = 0;
      for (let i = 0; i < nums.length; i++) {
        for (let j = i + 1; j < nums.length; j++) if (sets[i].has(nums[j]) || sets[j].has(nums[i])) c++;
      }
      return c;
    };
    return {
      slug: "count-almost-equal-pairs-i",
      title: "Count Almost Equal Pairs I",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sorting", "Counting", "Enumeration", "Amazon"],
      signature: { funcName: "countPairs", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of positive integers.\n\n" +
        "Two integers `x` and `y` are called **almost equal** if they can be made equal by doing the following **at most once**: pick one of the two numbers and swap any two of its digits. A swap may put a zero in front, and the leading zeros are then simply ignored (so `30` can become `03`, which is `3`).\n\n" +
        "Return the number of index pairs `i < j` such that `nums[i]` and `nums[j]` are almost equal.",
        [
          { in: "nums = [3,12,30,17,21]", out: "2", note: "`3` and `30` (swap the digits of `30` to get `03 = 3`), and `12` and `21`." },
          { in: "nums = [1,1,1,1,1]", out: "10", note: "Every pair is already equal, and there are `5 * 4 / 2 = 10` pairs." },
          { in: "nums = [123,231]", out: "0", note: "Turning `123` into `231` moves all three digits — one swap is not enough." },
        ],
        ["2 <= nums.length <= 100", "1 <= nums[i] <= 10^6"]),
      hints: [
        "With at most 100 numbers you can afford to test every pair; the question is how to test one pair quickly.",
        "Pad the shorter number with leading zeros so both have the same number of digits, then compare them digit by digit.",
        "The pair is almost equal when no digit differs, or exactly two positions differ and the two differing digits are crossed (`a[i] == b[j]` and `a[j] == b[i]`).",
      ],
      editorial: explain({
        idea: "One swap changes exactly two digit positions of one number. So after lining the two numbers up digit by digit (padding the shorter with zeros, which is what a swap into the leading position produces), they must either already agree everywhere or disagree in exactly two positions holding the same two digits in crossed order.",
        steps: [
          "For every pair `i < j`, take `x = nums[i]` and `y = nums[j]`.",
          "Walk both numbers from the last digit, `x % 10` and `y % 10`, dividing by 10 until both are zero — a number that runs out first contributes zeros, exactly like padding.",
          "Record the positions where the digits differ; stop early once there are three of them.",
          "Count the pair if there were no differences, or exactly two differences `(a1, b1)` and `(a2, b2)` with `a1 == b2` and `a2 == b1`.",
        ],
        why: "Swapping two digits of `x` changes it only in those two positions, and only by exchanging their values. So `x` can reach `y` in one swap precisely when they differ in two positions whose digits are crossed; swapping in `y` instead is the same condition read the other way. Leading zeros are harmless: `x` and `y` agree on every position beyond the longer length, and a swap that moves a zero to the front corresponds to padding the shorter number.",
        time: "O(n^2 * d) with d ≤ 7 digits",
        space: "O(1)",
        pitfalls: [
          "Comparing the decimal strings without padding misses pairs like `3` and `30`.",
          "Two differing positions are not enough on their own: `12` and `34` differ in two places but no swap helps.",
          "Equal numbers count as almost equal — zero swaps is allowed.",
        ],
      }),
      examples: [
        { input: "[3,12,30,17,21]", expectedOutput: "2" },
        { input: "[1,1,1,1,1]", expectedOutput: "10" },
        { input: "[123,231]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 5, 15, 40]));
        const top = pick(rng, [9, 99, 999, 9999, 999999, 1000000]);
        const bases = Array.from({ length: ri(rng, 1, 4) }, () => ri(rng, 1, top));
        const nums: number[] = [];
        for (let i = 0; i < n; i++) {
          const b = pick(rng, bases);
          const d = String(b).split("");
          const mode = ri(rng, 0, 4);
          if (mode === 1 && d.length > 1) {
            const p = ri(rng, 0, d.length - 1), q = ri(rng, 0, d.length - 1);
            const t = d[p]; d[p] = d[q]; d[q] = t;
          } else if (mode === 2) shuffle(rng, d);
          else if (mode === 3 && d.length < 6) d.splice(ri(rng, 0, d.length), 0, "0");
          let v = parseInt(d.join(""), 10);
          if (mode === 4) v = ri(rng, 1, top);
          if (v < 1) v = 1;
          if (v > 1000000) v = b;
          nums.push(v);
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countPairs(nums: List[int]) -> int:
              def almost_equal(x: int, y: int) -> bool:
                  diff = []
                  while x > 0 or y > 0:
                      a, b = x % 10, y % 10
                      if a != b:
                          diff.append((a, b))
                          if len(diff) > 2:
                              return False
                      x //= 10
                      y //= 10
                  if not diff:
                      return True
                  return len(diff) == 2 and diff[0][0] == diff[1][1] and diff[0][1] == diff[1][0]

              n = len(nums)
              count = 0
              for i in range(n):
                  for j in range(i + 1, n):
                      if almost_equal(nums[i], nums[j]):
                          count += 1
              return count
        `,
        javascript: code`
          var countPairs = function(nums) {
              var count = 0;
              for (var i = 0; i < nums.length; i++) {
                  for (var j = i + 1; j < nums.length; j++) {
                      if (almostEqual(nums[i], nums[j])) count++;
                  }
              }
              return count;
          };

          var almostEqual = function(x, y) {
              var cnt = 0, a1 = 0, b1 = 0, a2 = 0, b2 = 0;
              while (x > 0 || y > 0) {
                  var a = x % 10, b = y % 10;
                  if (a !== b) {
                      if (cnt === 0) { a1 = a; b1 = b; }
                      else if (cnt === 1) { a2 = a; b2 = b; }
                      cnt++;
                      if (cnt > 2) return false;
                  }
                  x = Math.floor(x / 10);
                  y = Math.floor(y / 10);
              }
              return cnt === 0 || (cnt === 2 && a1 === b2 && a2 === b1);
          };
        `,
        typescript: code`
          function almostEqual(x: number, y: number): boolean {
              var cnt = 0, a1 = 0, b1 = 0, a2 = 0, b2 = 0;
              while (x > 0 || y > 0) {
                  var a = x % 10, b = y % 10;
                  if (a !== b) {
                      if (cnt === 0) { a1 = a; b1 = b; }
                      else if (cnt === 1) { a2 = a; b2 = b; }
                      cnt++;
                      if (cnt > 2) return false;
                  }
                  x = Math.floor(x / 10);
                  y = Math.floor(y / 10);
              }
              return cnt === 0 || (cnt === 2 && a1 === b2 && a2 === b1);
          }

          function countPairs(nums: number[]): number {
              var count = 0;
              for (var i = 0; i < nums.length; i++) {
                  for (var j = i + 1; j < nums.length; j++) {
                      if (almostEqual(nums[i], nums[j])) count++;
                  }
              }
              return count;
          }
        `,
        java: code`
          static boolean almostEqual(int x, int y) {
              int cnt = 0, a1 = 0, b1 = 0, a2 = 0, b2 = 0;
              while (x > 0 || y > 0) {
                  int a = x % 10, b = y % 10;
                  if (a != b) {
                      if (cnt == 0) { a1 = a; b1 = b; }
                      else if (cnt == 1) { a2 = a; b2 = b; }
                      cnt++;
                      if (cnt > 2) return false;
                  }
                  x /= 10;
                  y /= 10;
              }
              return cnt == 0 || (cnt == 2 && a1 == b2 && a2 == b1);
          }

          public static int countPairs(int[] nums) {
              int count = 0;
              for (int i = 0; i < nums.length; i++) {
                  for (int j = i + 1; j < nums.length; j++) {
                      if (almostEqual(nums[i], nums[j])) count++;
                  }
              }
              return count;
          }
        `,
        cpp: code`
          bool almostEqual(int x, int y) {
              int cnt = 0, a1 = 0, b1 = 0, a2 = 0, b2 = 0;
              while (x > 0 || y > 0) {
                  int a = x % 10, b = y % 10;
                  if (a != b) {
                      if (cnt == 0) { a1 = a; b1 = b; }
                      else if (cnt == 1) { a2 = a; b2 = b; }
                      cnt++;
                      if (cnt > 2) return false;
                  }
                  x /= 10;
                  y /= 10;
              }
              return cnt == 0 || (cnt == 2 && a1 == b2 && a2 == b1);
          }

          int countPairs(vector<int>& nums) {
              int count = 0, n = nums.size();
              for (int i = 0; i < n; i++) {
                  for (int j = i + 1; j < n; j++) {
                      if (almostEqual(nums[i], nums[j])) count++;
                  }
              }
              return count;
          }
        `,
        c: code`
          static bool almostEqual(int x, int y) {
              int cnt = 0, a1 = 0, b1 = 0, a2 = 0, b2 = 0;
              while (x > 0 || y > 0) {
                  int a = x % 10, b = y % 10;
                  if (a != b) {
                      if (cnt == 0) { a1 = a; b1 = b; }
                      else if (cnt == 1) { a2 = a; b2 = b; }
                      cnt++;
                      if (cnt > 2) return false;
                  }
                  x /= 10;
                  y /= 10;
              }
              return cnt == 0 || (cnt == 2 && a1 == b2 && a2 == b1);
          }

          int countPairs(int* nums, int numsSize) {
              int count = 0;
              for (int i = 0; i < numsSize; i++) {
                  for (int j = i + 1; j < numsSize; j++) {
                      if (almostEqual(nums[i], nums[j])) count++;
                  }
              }
              return count;
          }
        `,
        csharp: code`
          static bool AlmostEqual(int x, int y)
          {
              int cnt = 0, a1 = 0, b1 = 0, a2 = 0, b2 = 0;
              while (x > 0 || y > 0)
              {
                  int a = x % 10, b = y % 10;
                  if (a != b)
                  {
                      if (cnt == 0) { a1 = a; b1 = b; }
                      else if (cnt == 1) { a2 = a; b2 = b; }
                      cnt++;
                      if (cnt > 2) return false;
                  }
                  x /= 10;
                  y /= 10;
              }
              return cnt == 0 || (cnt == 2 && a1 == b2 && a2 == b1);
          }

          public static int CountPairs(int[] nums)
          {
              int count = 0;
              for (int i = 0; i < nums.Length; i++)
              {
                  for (int j = i + 1; j < nums.Length; j++)
                  {
                      if (AlmostEqual(nums[i], nums[j])) count++;
                  }
              }
              return count;
          }
        `,
        go: code`
          func almostEqual(x, y int) bool {
              cnt, a1, b1, a2, b2 := 0, 0, 0, 0, 0
              for x > 0 || y > 0 {
                  a, b := x%10, y%10
                  if a != b {
                      if cnt == 0 {
                          a1, b1 = a, b
                      } else if cnt == 1 {
                          a2, b2 = a, b
                      }
                      cnt++
                      if cnt > 2 {
                          return false
                      }
                  }
                  x /= 10
                  y /= 10
              }
              return cnt == 0 || (cnt == 2 && a1 == b2 && a2 == b1)
          }

          func countPairs(nums []int) int {
              count := 0
              for i := 0; i < len(nums); i++ {
                  for j := i + 1; j < len(nums); j++ {
                      if almostEqual(nums[i], nums[j]) {
                          count++
                      }
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun almostEqual(x0: Int, y0: Int): Boolean {
              var x = x0
              var y = y0
              var cnt = 0
              var a1 = 0
              var b1 = 0
              var a2 = 0
              var b2 = 0
              while (x > 0 || y > 0) {
                  val a = x % 10
                  val b = y % 10
                  if (a != b) {
                      if (cnt == 0) { a1 = a; b1 = b }
                      else if (cnt == 1) { a2 = a; b2 = b }
                      cnt++
                      if (cnt > 2) return false
                  }
                  x /= 10
                  y /= 10
              }
              return cnt == 0 || (cnt == 2 && a1 == b2 && a2 == b1)
          }

          fun countPairs(nums: IntArray): Int {
              var count = 0
              for (i in nums.indices) {
                  for (j in i + 1 until nums.size) {
                      if (almostEqual(nums[i], nums[j])) count++
                  }
              }
              return count
          }
        `,
        swift: code`
          func almostEqual(_ x0: Int, _ y0: Int) -> Bool {
              var x = x0, y = y0
              var cnt = 0, a1 = 0, b1 = 0, a2 = 0, b2 = 0
              while x > 0 || y > 0 {
                  let a = x % 10, b = y % 10
                  if a != b {
                      if cnt == 0 { a1 = a; b1 = b }
                      else if cnt == 1 { a2 = a; b2 = b }
                      cnt += 1
                      if cnt > 2 { return false }
                  }
                  x /= 10
                  y /= 10
              }
              return cnt == 0 || (cnt == 2 && a1 == b2 && a2 == b1)
          }

          func countPairs(_ nums: [Int]) -> Int {
              var count = 0
              for i in 0..<nums.count {
                  for j in (i + 1)..<max(i + 1, nums.count) {
                      if almostEqual(nums[i], nums[j]) { count += 1 }
                  }
              }
              return count
          }
        `,
        rust: code`
          fn almost_equal(mut x: i32, mut y: i32) -> bool {
              let (mut cnt, mut a1, mut b1, mut a2, mut b2) = (0, 0, 0, 0, 0);
              while x > 0 || y > 0 {
                  let (a, b) = (x % 10, y % 10);
                  if a != b {
                      if cnt == 0 { a1 = a; b1 = b; }
                      else if cnt == 1 { a2 = a; b2 = b; }
                      cnt += 1;
                      if cnt > 2 { return false; }
                  }
                  x /= 10;
                  y /= 10;
              }
              cnt == 0 || (cnt == 2 && a1 == b2 && a2 == b1)
          }

          fn countPairs(nums: Vec<i32>) -> i32 {
              let mut count = 0;
              for i in 0..nums.len() {
                  for j in (i + 1)..nums.len() {
                      if almost_equal(nums[i], nums[j]) { count += 1; }
                  }
              }
              count
          }
        `,
        php: code`
          function almostEqual($x, $y) {
              $cnt = 0; $a1 = 0; $b1 = 0; $a2 = 0; $b2 = 0;
              while ($x > 0 || $y > 0) {
                  $a = $x % 10;
                  $b = $y % 10;
                  if ($a != $b) {
                      if ($cnt == 0) { $a1 = $a; $b1 = $b; }
                      elseif ($cnt == 1) { $a2 = $a; $b2 = $b; }
                      $cnt++;
                      if ($cnt > 2) return false;
                  }
                  $x = intdiv($x, 10);
                  $y = intdiv($y, 10);
              }
              return $cnt == 0 || ($cnt == 2 && $a1 == $b2 && $a2 == $b1);
          }

          function countPairs($nums) {
              $n = count($nums);
              $count = 0;
              for ($i = 0; $i < $n; $i++) {
                  for ($j = $i + 1; $j < $n; $j++) {
                      if (almostEqual($nums[$i], $nums[$j])) $count++;
                  }
              }
              return $count;
          }
        `,
        ruby: code`
          def almost_equal(x, y)
            cnt = 0
            a1 = b1 = a2 = b2 = 0
            while x > 0 || y > 0
              a = x % 10
              b = y % 10
              if a != b
                if cnt == 0
                  a1 = a
                  b1 = b
                elsif cnt == 1
                  a2 = a
                  b2 = b
                end
                cnt += 1
                return false if cnt > 2
              end
              x /= 10
              y /= 10
            end
            cnt == 0 || (cnt == 2 && a1 == b2 && a2 == b1)
          end

          def countPairs(nums)
            n = nums.length
            count = 0
            (0...n).each do |i|
              ((i + 1)...n).each do |j|
                count += 1 if almost_equal(nums[i], nums[j])
              end
            end
            count
          end
        `,
      },
    };
  })(),

  // ── Report Spam Message (LC 3295) ───────────────────────────────
  (() => {
    const ref = (message: string[], banned: string[]) => {
      let hits = 0;
      for (const w of message) if (banned.indexOf(w) >= 0) hits++;
      return hits >= 2;
    };
    return {
      slug: "report-spam-message",
      title: "Report Spam Message",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Amazon", "Google"],
      signature: {
        funcName: "reportSpam",
        params: [{ name: "message", type: "string[]" as const }, { name: "bannedWords", type: "string[]" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "A message arrives as an array of words `message`, and a moderation list holds the words in `bannedWords`.\n\n" +
        "The message is **spam** if **at least two** of its words (counted by position, so the same banned word appearing twice counts twice) are exactly equal to some word in `bannedWords`.\n\n" +
        "Return `true` if the message is spam, and `false` otherwise.",
        [
          { in: 'message = ["free","prize","click","now"], bannedWords = ["prize","now"]', out: "true", note: "`prize` and `now` are both banned." },
          { in: 'message = ["hello","coder","free","code"], bannedWords = ["free","spam"]', out: "false", note: "Only `free` is banned — one match is not enough." },
          { in: 'message = ["win","win"], bannedWords = ["win"]', out: "true", note: "The same banned word appearing twice gives two matching words." },
        ],
        [
          "1 <= message.length, bannedWords.length <= 10^5",
          "1 <= message[i].length, bannedWords[i].length <= 15",
          "message[i] and bannedWords[i] consist only of lowercase English letters",
        ]),
      hints: [
        "For every word of the message you need to answer one question: is it in the banned list?",
        "Scanning `bannedWords` for each word is `O(n * m)` — too slow at `10^5` each. Put the banned words in a hash set first.",
        "Count the message words found in the set and stop as soon as the count reaches two.",
      ],
      editorial: explain({
        idea: "Membership tests against a fixed list are what a hash set is for: build it once from `bannedWords`, then each message word is checked in expected constant time.",
        steps: [
          "Insert every word of `bannedWords` into a hash set.",
          "Walk `message`, incrementing a counter whenever the word is in the set.",
          "Return `true` as soon as the counter reaches 2; return `false` if the walk ends first.",
        ],
        why: "The definition counts message positions whose word is banned, so a single pass with an exact-match lookup counts exactly those positions. Duplicates in `bannedWords` do not matter because the set only records membership, and duplicates in `message` count separately because each position is visited once.",
        time: "O((n + m) * L) where L ≤ 15 is the word length",
        space: "O(m * L)",
        pitfalls: [
          "Counting **distinct** banned words found is wrong: `[\"win\",\"win\"]` with `[\"win\"]` is spam.",
          "Matches must be whole words — `prizes` does not match `prize`.",
        ],
      }),
      examples: [
        { input: '["free","prize","click","now"]\n["prize","now"]', expectedOutput: "true" },
        { input: '["hello","coder","free","code"]\n["free","spam"]', expectedOutput: "false" },
        { input: '["win","win"]\n["win"]', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcdefghij"]);
        const maxLen = pick(rng, [1, 2, 3, 15]);
        const message = Array.from({ length: ri(rng, 1, pick(rng, [1, 3, 10, 25])) }, () => randLower(rng, 1, maxLen, alpha));
        const banned = Array.from({ length: ri(rng, 1, pick(rng, [1, 3, 10, 25])) }, () =>
          rng() < 0.3 ? pick(rng, message) : randLower(rng, 1, maxLen, alpha));
        return { input: `${fmtStrArr(message)}\n${fmtStrArr(banned)}`, expectedOutput: bool(ref(message, banned)) };
      },
      solutions: {
        python: code`
          from typing import List

          def reportSpam(message: List[str], bannedWords: List[str]) -> bool:
              banned = set(bannedWords)
              hits = 0
              for word in message:
                  if word in banned:
                      hits += 1
                      if hits >= 2:
                          return True
              return False
        `,
        javascript: code`
          var reportSpam = function(message, bannedWords) {
              var banned = new Set(bannedWords);
              var hits = 0;
              for (var i = 0; i < message.length; i++) {
                  if (banned.has(message[i])) {
                      hits++;
                      if (hits >= 2) return true;
                  }
              }
              return false;
          };
        `,
        typescript: code`
          function reportSpam(message: string[], bannedWords: string[]): boolean {
              var banned: { [w: string]: boolean } = {};
              for (var j = 0; j < bannedWords.length; j++) banned[bannedWords[j]] = true;
              var hits = 0;
              for (var i = 0; i < message.length; i++) {
                  if (banned.hasOwnProperty(message[i])) {
                      hits++;
                      if (hits >= 2) return true;
                  }
              }
              return false;
          }
        `,
        java: code`
          public static boolean reportSpam(String[] message, String[] bannedWords) {
              Set<String> banned = new HashSet<>(Arrays.asList(bannedWords));
              int hits = 0;
              for (String w : message) {
                  if (banned.contains(w) && ++hits >= 2) return true;
              }
              return false;
          }
        `,
        cpp: code`
          bool reportSpam(vector<string>& message, vector<string>& bannedWords) {
              unordered_set<string> banned(bannedWords.begin(), bannedWords.end());
              int hits = 0;
              for (const string& w : message) {
                  if (banned.count(w) && ++hits >= 2) return true;
              }
              return false;
          }
        `,
        c: code`
          static int cmpWord(const void* a, const void* b) {
              return strcmp(*(char* const*)a, *(char* const*)b);
          }

          bool reportSpam(char** message, int messageSize, char** bannedWords, int bannedWordsSize) {
              // Sorted copy of the banned list, then a binary search per word.
              char** sorted = (char**)malloc(sizeof(char*) * (bannedWordsSize > 0 ? bannedWordsSize : 1));
              memcpy(sorted, bannedWords, sizeof(char*) * bannedWordsSize);
              qsort(sorted, bannedWordsSize, sizeof(char*), cmpWord);
              int hits = 0;
              for (int i = 0; i < messageSize && hits < 2; i++) {
                  char* key = message[i];
                  if (bsearch(&key, sorted, bannedWordsSize, sizeof(char*), cmpWord) != NULL) hits++;
              }
              free(sorted);
              return hits >= 2;
          }
        `,
        csharp: code`
          public static bool ReportSpam(string[] message, string[] bannedWords)
          {
              var banned = new HashSet<string>(bannedWords);
              int hits = 0;
              foreach (string w in message)
              {
                  if (banned.Contains(w) && ++hits >= 2) return true;
              }
              return false;
          }
        `,
        go: code`
          func reportSpam(message []string, bannedWords []string) bool {
              banned := make(map[string]bool, len(bannedWords))
              for _, w := range bannedWords {
                  banned[w] = true
              }
              hits := 0
              for _, w := range message {
                  if banned[w] {
                      hits++
                      if hits >= 2 {
                          return true
                      }
                  }
              }
              return false
          }
        `,
        kotlin: code`
          fun reportSpam(message: Array<String>, bannedWords: Array<String>): Boolean {
              val banned = bannedWords.toHashSet()
              var hits = 0
              for (w in message) {
                  if (w in banned) {
                      hits++
                      if (hits >= 2) return true
                  }
              }
              return false
          }
        `,
        swift: code`
          func reportSpam(_ message: [String], _ bannedWords: [String]) -> Bool {
              let banned = Set(bannedWords)
              var hits = 0
              for w in message where banned.contains(w) {
                  hits += 1
                  if hits >= 2 { return true }
              }
              return false
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn reportSpam(message: Vec<String>, banned_words: Vec<String>) -> bool {
              let banned: HashSet<&String> = banned_words.iter().collect();
              let mut hits = 0;
              for w in message.iter() {
                  if banned.contains(w) {
                      hits += 1;
                      if hits >= 2 { return true; }
                  }
              }
              false
          }
        `,
        php: code`
          function reportSpam($message, $bannedWords) {
              $banned = array_flip($bannedWords);
              $hits = 0;
              foreach ($message as $w) {
                  if (isset($banned[$w])) {
                      $hits++;
                      if ($hits >= 2) return true;
                  }
              }
              return false;
          }
        `,
        ruby: code`
          def reportSpam(message, bannedWords)
            banned = {}
            bannedWords.each { |w| banned[w] = true }
            hits = 0
            message.each do |w|
              next unless banned[w]
              hits += 1
              return true if hits >= 2
            end
            false
          end
        `,
      },
    };
  })(),

  // ── Rearrange K Substrings to Form Target String (LC 3365) ──────
  (() => {
    const chunks = (s: string, k: number) => {
      const m = s.length / k;
      const out: string[] = [];
      for (let i = 0; i < s.length; i += m) out.push(s.substring(i, i + m));
      return out.sort();
    };
    const ref = (s: string, t: string, k: number) => chunks(s, k).join("|") === chunks(t, k).join("|");
    return {
      slug: "rearrange-k-substrings-to-form-target-string",
      title: "Rearrange K Substrings to Form Target String",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Sorting", "Amazon"],
      signature: {
        funcName: "isPossibleToRearrange",
        params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }, { name: "k", type: "int" as const }],
        returns: "bool" as const,
      },
      description: describe(
        "You are given two strings `s` and `t` that are anagrams of each other (they hold the same letters with the same counts), and an integer `k` that divides their common length.\n\n" +
        "Cut `s` into `k` contiguous pieces of equal length, put the pieces in any order you like, and glue them back together.\n\n" +
        "Return `true` if some order of the pieces produces exactly `t`, and `false` otherwise.",
        [
          { in: 's = "abcd", t = "cdab", k = 2', out: "true", note: "The pieces are `ab` and `cd`; placing `cd` first gives `cdab`." },
          { in: 's = "aabbcc", t = "bbaacc", k = 3', out: "true", note: "Pieces `aa`, `bb`, `cc` reordered as `bb`, `aa`, `cc`." },
          { in: 's = "aabbcc", t = "bbaacc", k = 2', out: "false", note: "The pieces of `s` are `aab` and `bcc`, but `t` needs `bba` and `acc`." },
        ],
        [
          "1 <= s.length == t.length <= 2 * 10^5",
          "1 <= k <= s.length",
          "s.length is divisible by k",
          "s and t consist only of lowercase English letters",
          "s and t are anagrams of each other",
        ]),
      hints: [
        "Cut `t` into `k` pieces of the same length too. Whatever order you choose for the pieces of `s`, the result's pieces are exactly the pieces of `s`.",
        "So the question becomes: are the two collections of pieces the same multiset?",
        "Count the pieces of `s` in a hash map, then subtract the pieces of `t`; every count must end at zero (or sort both lists and compare).",
      ],
      editorial: explain({
        idea: "Any arrangement of the pieces of `s` is a string whose `k` equal-length pieces are those same pieces in some order. So `t` is reachable exactly when cutting `t` the same way yields the same multiset of pieces.",
        steps: [
          "Let `m = n / k`, the length of each piece.",
          "For each `i = 0, m, 2m, …` add one to the count of `s[i..i+m)` in a hash map.",
          "For each such `i` subtract one from the count of `t[i..i+m)`; if a count would go below zero, return `false`.",
          "Return `true` — both sides had `k` pieces, so no count is left positive.",
        ],
        why: "If `t` is a reordering of the pieces of `s`, then its `j`-th block of length `m` is one of those pieces, so the two multisets agree. Conversely, if the multisets agree, placing the pieces of `s` in the order the blocks of `t` appear reproduces `t` block by block.",
        time: "O(n) expected (hashing each piece once)",
        space: "O(n)",
        pitfalls: [
          "Being anagrams is not enough — the letters must stay grouped inside their pieces (the third example).",
          "With `k = 1` there is one piece, so the answer is simply whether `s == t`.",
          "Duplicate pieces are common; compare counts, not just sets.",
        ],
      }),
      examples: [
        { input: '"abcd"\n"cdab"\n2', expectedOutput: "true" },
        { input: '"aabbcc"\n"bbaacc"\n3', expectedOutput: "true" },
        { input: '"aabbcc"\n"bbaacc"\n2', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const k = ri(rng, 1, pick(rng, [1, 3, 6, 12]));
        const m = ri(rng, 1, pick(rng, [1, 2, 4]));
        const s = randLower(rng, k * m, k * m, pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"]));
        let t: string;
        const mode = ri(rng, 0, 4);
        if (mode <= 2) {
          const parts: string[] = [];
          for (let i = 0; i < s.length; i += m) parts.push(s.substring(i, i + m));
          t = shuffle(rng, parts).join("");
          if (mode === 2 && t.length > 1) {
            const c = t.split("");
            const p = ri(rng, 0, c.length - 1), q = ri(rng, 0, c.length - 1);
            const x = c[p]; c[p] = c[q]; c[q] = x;
            t = c.join("");
          }
        } else if (mode === 3) t = shuffle(rng, s.split("")).join("");
        else t = s;
        return { input: `"${s}"\n"${t}"\n${k}`, expectedOutput: bool(ref(s, t, k)) };
      },
      solutions: {
        python: code`
          from collections import Counter

          def isPossibleToRearrange(s: str, t: str, k: int) -> bool:
              m = len(s) // k
              pieces = Counter(s[i:i + m] for i in range(0, len(s), m))
              for i in range(0, len(t), m):
                  piece = t[i:i + m]
                  if pieces[piece] == 0:
                      return False
                  pieces[piece] -= 1
              return True
        `,
        javascript: code`
          var isPossibleToRearrange = function(s, t, k) {
              var m = s.length / k;
              var count = new Map();
              for (var i = 0; i < s.length; i += m) {
                  var p = s.substring(i, i + m);
                  count.set(p, (count.get(p) || 0) + 1);
              }
              for (var j = 0; j < t.length; j += m) {
                  var q = t.substring(j, j + m);
                  var c = count.get(q) || 0;
                  if (c === 0) return false;
                  count.set(q, c - 1);
              }
              return true;
          };
        `,
        typescript: code`
          function isPossibleToRearrange(s: string, t: string, k: number): boolean {
              var m = s.length / k;
              var count: { [piece: string]: number } = {};
              for (var i = 0; i < s.length; i += m) {
                  var p = s.substring(i, i + m);
                  count[p] = (count[p] || 0) + 1;
              }
              for (var j = 0; j < t.length; j += m) {
                  var q = t.substring(j, j + m);
                  if (!count[q]) return false;
                  count[q]--;
              }
              return true;
          }
        `,
        java: code`
          public static boolean isPossibleToRearrange(String s, String t, int k) {
              int m = s.length() / k;
              Map<String, Integer> count = new HashMap<>();
              for (int i = 0; i < s.length(); i += m) count.merge(s.substring(i, i + m), 1, Integer::sum);
              for (int i = 0; i < t.length(); i += m) {
                  String q = t.substring(i, i + m);
                  int c = count.getOrDefault(q, 0);
                  if (c == 0) return false;
                  count.put(q, c - 1);
              }
              return true;
          }
        `,
        cpp: code`
          bool isPossibleToRearrange(string s, string t, int k) {
              int m = s.size() / k;
              unordered_map<string, int> count;
              for (int i = 0; i < (int)s.size(); i += m) count[s.substr(i, m)]++;
              for (int i = 0; i < (int)t.size(); i += m) {
                  auto it = count.find(t.substr(i, m));
                  if (it == count.end() || it->second == 0) return false;
                  it->second--;
              }
              return true;
          }
        `,
        c: code`
          static int gPieceLen;

          static int cmpPiece(const void* a, const void* b) {
              return strncmp(*(const char* const*)a, *(const char* const*)b, gPieceLen);
          }

          bool isPossibleToRearrange(const char* s, const char* t, int k) {
              // Sort the piece pointers of both strings and compare them in order.
              int n = (int)strlen(s);
              int m = n / k;
              gPieceLen = m;
              const char** ps = (const char**)malloc(sizeof(char*) * k);
              const char** pt = (const char**)malloc(sizeof(char*) * k);
              for (int i = 0; i < k; i++) {
                  ps[i] = s + i * m;
                  pt[i] = t + i * m;
              }
              qsort(ps, k, sizeof(char*), cmpPiece);
              qsort(pt, k, sizeof(char*), cmpPiece);
              bool ok = true;
              for (int i = 0; i < k && ok; i++) {
                  if (strncmp(ps[i], pt[i], m) != 0) ok = false;
              }
              free(ps);
              free(pt);
              return ok;
          }
        `,
        csharp: code`
          public static bool IsPossibleToRearrange(string s, string t, int k)
          {
              int m = s.Length / k;
              var count = new Dictionary<string, int>();
              for (int i = 0; i < s.Length; i += m)
              {
                  string p = s.Substring(i, m);
                  int c0;
                  count.TryGetValue(p, out c0);
                  count[p] = c0 + 1;
              }
              for (int i = 0; i < t.Length; i += m)
              {
                  string q = t.Substring(i, m);
                  int c;
                  if (!count.TryGetValue(q, out c) || c == 0) return false;
                  count[q] = c - 1;
              }
              return true;
          }
        `,
        go: code`
          func isPossibleToRearrange(s string, t string, k int) bool {
              m := len(s) / k
              count := map[string]int{}
              for i := 0; i < len(s); i += m {
                  count[s[i:i+m]]++
              }
              for i := 0; i < len(t); i += m {
                  q := t[i : i+m]
                  if count[q] == 0 {
                      return false
                  }
                  count[q]--
              }
              return true
          }
        `,
        kotlin: code`
          fun isPossibleToRearrange(s: String, t: String, k: Int): Boolean {
              val m = s.length / k
              val count = HashMap<String, Int>()
              for (i in 0 until s.length step m) {
                  val p = s.substring(i, i + m)
                  count[p] = (count[p] ?: 0) + 1
              }
              for (i in 0 until t.length step m) {
                  val q = t.substring(i, i + m)
                  val c = count[q] ?: 0
                  if (c == 0) return false
                  count[q] = c - 1
              }
              return true
          }
        `,
        swift: code`
          func isPossibleToRearrange(_ s: String, _ t: String, _ k: Int) -> Bool {
              let a = Array(s.utf8), b = Array(t.utf8)
              let m = a.count / k
              var count = [[UInt8]: Int]()
              var i = 0
              while i < a.count {
                  count[Array(a[i..<(i + m)]), default: 0] += 1
                  i += m
              }
              i = 0
              while i < b.count {
                  let q = Array(b[i..<(i + m)])
                  let c = count[q, default: 0]
                  if c == 0 { return false }
                  count[q] = c - 1
                  i += m
              }
              return true
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn isPossibleToRearrange(s: String, t: String, k: i32) -> bool {
              let (a, b) = (s.as_bytes(), t.as_bytes());
              let m = a.len() / k as usize;
              let mut count: HashMap<&[u8], i32> = HashMap::new();
              for chunk in a.chunks(m) {
                  *count.entry(chunk).or_insert(0) += 1;
              }
              for chunk in b.chunks(m) {
                  match count.get_mut(chunk) {
                      Some(c) if *c > 0 => *c -= 1,
                      _ => return false,
                  }
              }
              true
          }
        `,
        php: code`
          function isPossibleToRearrange($s, $t, $k) {
              $n = strlen($s);
              $m = intdiv($n, $k);
              $count = [];
              for ($i = 0; $i < $n; $i += $m) {
                  $p = substr($s, $i, $m);
                  $count[$p] = ($count[$p] ?? 0) + 1;
              }
              for ($i = 0; $i < $n; $i += $m) {
                  $q = substr($t, $i, $m);
                  if (empty($count[$q])) return false;
                  $count[$q]--;
              }
              return true;
          }
        `,
        ruby: code`
          def isPossibleToRearrange(s, t, k)
            m = s.length / k
            count = Hash.new(0)
            (0...s.length).step(m) { |i| count[s[i, m]] += 1 }
            (0...t.length).step(m) do |i|
              q = t[i, m]
              return false if count[q] == 0
              count[q] -= 1
            end
            true
          end
        `,
      },
    };
  })(),

  // ── Identify the Largest Outlier in an Array (LC 3371) ──────────
  (() => {
    const ref = (nums: number[]) => {
      const total = nums.reduce((a, b) => a + b, 0);
      let best = -Infinity;
      for (let i = 0; i < nums.length; i++) {
        for (let j = 0; j < nums.length; j++) {
          if (i !== j && total - nums[i] - nums[j] === nums[j]) best = Math.max(best, nums[i]);
        }
      }
      return best;
    };
    return {
      slug: "identify-the-largest-outlier-in-an-array",
      title: "Identify the Largest Outlier in an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Counting", "Enumeration", "Amazon", "Google"],
      signature: { funcName: "getLargestOutlier", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of `n` integers. Exactly `n - 2` of its elements are **special numbers**. Of the two remaining elements, one is the **sum** of all the special numbers, and the other is an **outlier** — a number that is neither special nor that sum.\n\n" +
        "The special numbers, the sum element and the outlier sit at distinct indices, but they may share values.\n\n" +
        "Return the **largest** value that could be the outlier. The input is guaranteed to admit at least one valid split.",
        [
          { in: "nums = [4,1,5,12]", out: "12", note: "`4` and `1` are special, `5` is their sum, and `12` is the outlier." },
          { in: "nums = [-1,-2,-3,-6,5]", out: "5", note: "`-1`, `-2`, `-3` are special and sum to `-6`; `5` is the outlier." },
          { in: "nums = [2,2,2,2,8,8]", out: "8", note: "The four `2`s are special with sum `8`; the other `8` is the outlier." },
        ],
        ["3 <= nums.length <= 10^5", "-1000 <= nums[i] <= 1000", "At least one potential outlier exists in nums"]),
      hints: [
        "Let `S` be the total of the array. If `x` is the outlier and `y` the sum element, the specials add up to `S - x - y`, and they must also add up to `y`.",
        "So `x` is a valid outlier exactly when `S - x = 2y` for some **other** element `y`.",
        "Try every element as `x`: `y = (S - x) / 2` must be an integer present in the array — and if `y == x`, it must appear at least twice. A count table answers that in O(1).",
      ],
      editorial: explain({
        idea: "Removing the outlier `x` leaves the specials plus their sum `y`, which total `2y`. So `x` works exactly when `S - x` is even and `(S - x) / 2` occurs at some index other than `x`'s own.",
        steps: [
          "Compute the total `S` and count how many times each value occurs.",
          "For each element `x`: if `S - x` is odd, skip it. Otherwise let `y = (S - x) / 2`.",
          "`x` is a valid outlier if `y` occurs at least once when `y != x`, or at least twice when `y == x`.",
          "Return the largest valid `x`.",
        ],
        why: "If `x` is the outlier and `y` the sum, the array total is `specials + y + x = y + y + x`, so `S - x = 2y`. Conversely, if some other index holds `y = (S - x) / 2`, then the remaining `n - 2` elements add up to `S - x - y = y`, so they are a valid set of specials with `y` as their sum and `x` as the outlier.",
        time: "O(n)",
        space: "O(V) for the counts, V = 2001 possible values",
        pitfalls: [
          "`y` must be a different index from `x`: with `y == x`, one copy is not enough.",
          "Values are negative too — test parity with `% 2 != 0`, not `% 2 == 1`, which misses negative odd numbers in most languages.",
          "`y` can fall outside `[-1000, 1000]`; guard the count lookup.",
        ],
      }),
      examples: [
        { input: "[4,1,5,12]", expectedOutput: "12" },
        { input: "[-1,-2,-3,-6,5]", expectedOutput: "5" },
        { input: "[2,2,2,2,8,8]", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, pick(rng, [3, 6, 15, 40]));
        const r = pick(rng, [2, 10, 100, 1000]);
        const sp = Array.from({ length: n - 2 }, () => ri(rng, -r, r));
        let sum = sp.reduce((a, b) => a + b, 0);
        while (Math.abs(sum) > 1000) {
          const i = ri(rng, 0, sp.length - 1);
          sp[i] = Math.trunc(sp[i] / 2);
          sum = sp.reduce((a, b) => a + b, 0);
        }
        const mode = ri(rng, 0, 5);
        const outlier = mode === 0 ? sum : mode === 1 ? pick(rng, sp) : ri(rng, -1000, 1000);
        const nums = shuffle(rng, sp.concat([sum, outlier]));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def getLargestOutlier(nums: List[int]) -> int:
              total = sum(nums)
              count = Counter(nums)
              best = None
              for x in nums:
                  rest = total - x
                  if rest % 2 != 0:
                      continue
                  y = rest // 2
                  need = 2 if y == x else 1
                  if count.get(y, 0) >= need and (best is None or x > best):
                      best = x
              return best
        `,
        javascript: code`
          var getLargestOutlier = function(nums) {
              var total = 0;
              var count = new Array(2001).fill(0);
              for (var i = 0; i < nums.length; i++) {
                  total += nums[i];
                  count[nums[i] + 1000]++;
              }
              var best = -Infinity;
              for (var j = 0; j < nums.length; j++) {
                  var x = nums[j], rest = total - x;
                  if (rest % 2 !== 0) continue;
                  var y = rest / 2;
                  if (y < -1000 || y > 1000) continue;
                  var need = y === x ? 2 : 1;
                  if (count[y + 1000] >= need && x > best) best = x;
              }
              return best;
          };
        `,
        typescript: code`
          function getLargestOutlier(nums: number[]): number {
              var total = 0;
              var count: number[] = [];
              for (var v = 0; v <= 2000; v++) count.push(0);
              for (var i = 0; i < nums.length; i++) {
                  total += nums[i];
                  count[nums[i] + 1000]++;
              }
              var best = -Infinity;
              for (var j = 0; j < nums.length; j++) {
                  var x = nums[j], rest = total - x;
                  if (rest % 2 !== 0) continue;
                  var y = rest / 2;
                  if (y < -1000 || y > 1000) continue;
                  var need = y === x ? 2 : 1;
                  if (count[y + 1000] >= need && x > best) best = x;
              }
              return best;
          }
        `,
        java: code`
          public static int getLargestOutlier(int[] nums) {
              int total = 0;
              int[] count = new int[2001];
              for (int v : nums) {
                  total += v;
                  count[v + 1000]++;
              }
              int best = Integer.MIN_VALUE;
              for (int x : nums) {
                  int rest = total - x;
                  if (rest % 2 != 0) continue;
                  int y = rest / 2;
                  if (y < -1000 || y > 1000) continue;
                  int need = y == x ? 2 : 1;
                  if (count[y + 1000] >= need) best = Math.max(best, x);
              }
              return best;
          }
        `,
        cpp: code`
          int getLargestOutlier(vector<int>& nums) {
              int total = 0;
              vector<int> count(2001, 0);
              for (int v : nums) {
                  total += v;
                  count[v + 1000]++;
              }
              int best = INT_MIN;
              for (int x : nums) {
                  int rest = total - x;
                  if (rest % 2 != 0) continue;
                  int y = rest / 2;
                  if (y < -1000 || y > 1000) continue;
                  int need = y == x ? 2 : 1;
                  if (count[y + 1000] >= need) best = max(best, x);
              }
              return best;
          }
        `,
        c: code`
          int getLargestOutlier(int* nums, int numsSize) {
              int total = 0;
              int count[2001] = {0};
              for (int i = 0; i < numsSize; i++) {
                  total += nums[i];
                  count[nums[i] + 1000]++;
              }
              int best = -2147483647 - 1;
              for (int i = 0; i < numsSize; i++) {
                  int x = nums[i];
                  int rest = total - x;
                  if (rest % 2 != 0) continue;
                  int y = rest / 2;
                  if (y < -1000 || y > 1000) continue;
                  int need = y == x ? 2 : 1;
                  if (count[y + 1000] >= need && x > best) best = x;
              }
              return best;
          }
        `,
        csharp: code`
          public static int GetLargestOutlier(int[] nums)
          {
              int total = 0;
              int[] count = new int[2001];
              foreach (int v in nums)
              {
                  total += v;
                  count[v + 1000]++;
              }
              int best = int.MinValue;
              foreach (int x in nums)
              {
                  int rest = total - x;
                  if (rest % 2 != 0) continue;
                  int y = rest / 2;
                  if (y < -1000 || y > 1000) continue;
                  int need = y == x ? 2 : 1;
                  if (count[y + 1000] >= need) best = Math.Max(best, x);
              }
              return best;
          }
        `,
        go: code`
          func getLargestOutlier(nums []int) int {
              total := 0
              count := make([]int, 2001)
              for _, v := range nums {
                  total += v
                  count[v+1000]++
              }
              best := -1 << 31
              for _, x := range nums {
                  rest := total - x
                  if rest%2 != 0 {
                      continue
                  }
                  y := rest / 2
                  if y < -1000 || y > 1000 {
                      continue
                  }
                  need := 1
                  if y == x {
                      need = 2
                  }
                  if count[y+1000] >= need && x > best {
                      best = x
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun getLargestOutlier(nums: IntArray): Int {
              var total = 0
              val count = IntArray(2001)
              for (v in nums) {
                  total += v
                  count[v + 1000]++
              }
              var best = Int.MIN_VALUE
              for (x in nums) {
                  val rest = total - x
                  if (rest % 2 != 0) continue
                  val y = rest / 2
                  if (y < -1000 || y > 1000) continue
                  val need = if (y == x) 2 else 1
                  if (count[y + 1000] >= need) best = maxOf(best, x)
              }
              return best
          }
        `,
        swift: code`
          func getLargestOutlier(_ nums: [Int]) -> Int {
              var total = 0
              var count = [Int](repeating: 0, count: 2001)
              for v in nums {
                  total += v
                  count[v + 1000] += 1
              }
              var best = Int.min
              for x in nums {
                  let rest = total - x
                  if rest % 2 != 0 { continue }
                  let y = rest / 2
                  if y < -1000 || y > 1000 { continue }
                  let need = y == x ? 2 : 1
                  if count[y + 1000] >= need { best = max(best, x) }
              }
              return best
          }
        `,
        rust: code`
          fn getLargestOutlier(nums: Vec<i32>) -> i32 {
              let mut total = 0;
              let mut count = vec![0; 2001];
              for &v in &nums {
                  total += v;
                  count[(v + 1000) as usize] += 1;
              }
              let mut best = std::i32::MIN;
              for &x in &nums {
                  let rest = total - x;
                  if rest % 2 != 0 { continue; }
                  let y = rest / 2;
                  if y < -1000 || y > 1000 { continue; }
                  let need = if y == x { 2 } else { 1 };
                  if count[(y + 1000) as usize] >= need { best = best.max(x); }
              }
              best
          }
        `,
        php: code`
          function getLargestOutlier($nums) {
              $total = array_sum($nums);
              $count = array_count_values($nums);
              $best = PHP_INT_MIN;
              foreach ($nums as $x) {
                  $rest = $total - $x;
                  if ($rest % 2 != 0) continue;
                  $y = intdiv($rest, 2);
                  $need = $y == $x ? 2 : 1;
                  if (($count[$y] ?? 0) >= $need && $x > $best) $best = $x;
              }
              return $best;
          }
        `,
        ruby: code`
          def getLargestOutlier(nums)
            total = nums.sum
            count = Hash.new(0)
            nums.each { |v| count[v] += 1 }
            best = nil
            nums.each do |x|
              rest = total - x
              next if rest.odd?
              y = rest / 2
              need = y == x ? 2 : 1
              best = x if count[y] >= need && (best.nil? || x > best)
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Minimum Operations to Make Array Values Equal to K (LC 3375) ─
  (() => {
    const ref = (nums: number[], k: number) => {
      // Simulate: repeatedly lower every maximum to the next value below it (or to k).
      const a = nums.slice();
      if (a.some((v) => v < k)) return -1;
      let ops = 0;
      for (;;) {
        const mx = Math.max(...a);
        if (mx === k) return ops;
        const below = a.filter((v) => v < mx);
        const h = below.length ? Math.max(k, Math.max(...below)) : k;
        for (let i = 0; i < a.length; i++) if (a[i] > h) a[i] = h;
        ops++;
      }
    };
    return {
      slug: "minimum-operations-to-make-array-values-equal-to-k",
      title: "Minimum Operations to Make Array Values Equal to K",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Amazon", "Google"],
      signature: {
        funcName: "minOperations",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an integer array `nums` and an integer `k`.\n\n" +
        "Call an integer `h` **valid** if every element of `nums` that is strictly greater than `h` has the same value. (For `nums = [10,8,10,8]`, `h = 9` is valid because every element above 9 is `10`, but `h = 5` is not.)\n\n" +
        "In one operation you choose a valid `h` and set every element greater than `h` to `h`.\n\n" +
        "Return the minimum number of operations needed to make every element equal to `k`, or `-1` if it cannot be done.",
        [
          { in: "nums = [6,3,6,4], k = 3", out: "2", note: "Lower the `6`s to `4` (h = 4 is valid), then lower the `4`s to `3`." },
          { in: "nums = [4,1,4], k = 2", out: "-1", note: "Operations only lower values, so the `1` can never become `2`." },
          { in: "nums = [7,7,7], k = 7", out: "0" },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i] <= 100", "1 <= k <= 100"]),
      hints: [
        "An operation can only decrease values. What does that say about an element already below `k`?",
        "A valid `h` can only touch the elements equal to the current maximum, and the best it can do is bring them down to the next distinct value (or to `k`).",
        "So every distinct value above `k` costs exactly one operation.",
      ],
      editorial: explain({
        idea: "Since `h` is valid only when everything above it is one value, each operation can flatten just the current maximum level. Each distinct value greater than `k` therefore needs its own operation, and lowering to the next distinct value achieves exactly that count.",
        steps: [
          "If any element is smaller than `k`, return `-1` — nothing can raise it.",
          "Otherwise collect the distinct values strictly greater than `k` in a set.",
          "Return the size of that set.",
        ],
        why: "Each operation merges the top level into a lower one, reducing the number of distinct values above `k` by at most one — any lower `h` would have two different values above it and be invalid. Choosing `h` as the next distinct value (or `k` for the last level) achieves a reduction of exactly one each time, so the count of distinct values above `k` is both a lower bound and achievable.",
        time: "O(n)",
        space: "O(V) with V = 100 possible values",
        pitfalls: [
          "Count **distinct** values above `k`, not elements.",
          "Values equal to `k` need no operation; values below `k` make the task impossible.",
        ],
      }),
      examples: [
        { input: "[6,3,6,4]\n3", expectedOutput: "2" },
        { input: "[4,1,4]\n2", expectedOutput: "-1" },
        { input: "[7,7,7]\n7", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 15, 100]));
        const top = pick(rng, [3, 10, 100]);
        const k = ri(rng, 1, top);
        const lo = rng() < 0.75 ? k : 1;
        const nums = Array.from({ length: n }, () => ri(rng, lo, Math.max(lo, top)));
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minOperations(nums: List[int], k: int) -> int:
              if min(nums) < k:
                  return -1
              return len({v for v in nums if v > k})
        `,
        javascript: code`
          var minOperations = function(nums, k) {
              var seen = {};
              var distinct = 0;
              for (var i = 0; i < nums.length; i++) {
                  var v = nums[i];
                  if (v < k) return -1;
                  if (v > k && !seen[v]) {
                      seen[v] = true;
                      distinct++;
                  }
              }
              return distinct;
          };
        `,
        typescript: code`
          function minOperations(nums: number[], k: number): number {
              var seen: { [v: number]: boolean } = {};
              var distinct = 0;
              for (var i = 0; i < nums.length; i++) {
                  var v = nums[i];
                  if (v < k) return -1;
                  if (v > k && !seen[v]) {
                      seen[v] = true;
                      distinct++;
                  }
              }
              return distinct;
          }
        `,
        java: code`
          public static int minOperations(int[] nums, int k) {
              boolean[] seen = new boolean[101];
              int distinct = 0;
              for (int v : nums) {
                  if (v < k) return -1;
                  if (v > k && !seen[v]) {
                      seen[v] = true;
                      distinct++;
                  }
              }
              return distinct;
          }
        `,
        cpp: code`
          int minOperations(vector<int>& nums, int k) {
              vector<bool> seen(101, false);
              int distinct = 0;
              for (int v : nums) {
                  if (v < k) return -1;
                  if (v > k && !seen[v]) {
                      seen[v] = true;
                      distinct++;
                  }
              }
              return distinct;
          }
        `,
        c: code`
          int minOperations(int* nums, int numsSize, int k) {
              bool seen[101] = {false};
              int distinct = 0;
              for (int i = 0; i < numsSize; i++) {
                  int v = nums[i];
                  if (v < k) return -1;
                  if (v > k && !seen[v]) {
                      seen[v] = true;
                      distinct++;
                  }
              }
              return distinct;
          }
        `,
        csharp: code`
          public static int MinOperations(int[] nums, int k)
          {
              bool[] seen = new bool[101];
              int distinct = 0;
              foreach (int v in nums)
              {
                  if (v < k) return -1;
                  if (v > k && !seen[v])
                  {
                      seen[v] = true;
                      distinct++;
                  }
              }
              return distinct;
          }
        `,
        go: code`
          func minOperations(nums []int, k int) int {
              seen := make([]bool, 101)
              distinct := 0
              for _, v := range nums {
                  if v < k {
                      return -1
                  }
                  if v > k && !seen[v] {
                      seen[v] = true
                      distinct++
                  }
              }
              return distinct
          }
        `,
        kotlin: code`
          fun minOperations(nums: IntArray, k: Int): Int {
              val seen = BooleanArray(101)
              var distinct = 0
              for (v in nums) {
                  if (v < k) return -1
                  if (v > k && !seen[v]) {
                      seen[v] = true
                      distinct++
                  }
              }
              return distinct
          }
        `,
        swift: code`
          func minOperations(_ nums: [Int], _ k: Int) -> Int {
              var seen = [Bool](repeating: false, count: 101)
              var distinct = 0
              for v in nums {
                  if v < k { return -1 }
                  if v > k && !seen[v] {
                      seen[v] = true
                      distinct += 1
                  }
              }
              return distinct
          }
        `,
        rust: code`
          fn minOperations(nums: Vec<i32>, k: i32) -> i32 {
              let mut seen = [false; 101];
              let mut distinct = 0;
              for &v in &nums {
                  if v < k { return -1; }
                  if v > k && !seen[v as usize] {
                      seen[v as usize] = true;
                      distinct += 1;
                  }
              }
              distinct
          }
        `,
        php: code`
          function minOperations($nums, $k) {
              $seen = [];
              foreach ($nums as $v) {
                  if ($v < $k) return -1;
                  if ($v > $k) $seen[$v] = true;
              }
              return count($seen);
          }
        `,
        ruby: code`
          def minOperations(nums, k)
            return -1 if nums.min < k
            nums.select { |v| v > k }.uniq.length
          end
        `,
      },
    };
  })(),

  // ── Minimum Number of Operations to Make Elements in Array Distinct (LC 3396) ─
  (() => {
    const ref = (nums: number[]) => {
      let a = nums.slice();
      let ops = 0;
      while (new Set(a).size !== a.length) {
        a = a.slice(3);
        ops++;
      }
      return ops;
    };
    return {
      slug: "minimum-number-of-operations-to-make-elements-in-array-distinct",
      title: "Minimum Number of Operations to Make Elements in Array Distinct",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Amazon", "Google"],
      signature: { funcName: "minimumOperations", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums`. You want every element of the array to be distinct.\n\n" +
        "The only operation allowed removes the **first three** elements of the array; if fewer than three remain, it removes all of them. An empty array counts as distinct.\n\n" +
        "Return the minimum number of operations needed to make the elements distinct.",
        [
          { in: "nums = [3,8,3,5,1,1,9]", out: "2", note: "After one operation `[5,1,1,9]` still repeats `1`; after the second only `[9]` is left." },
          { in: "nums = [4,5,6,4,4]", out: "2", note: "One operation leaves `[4,4]`; the second empties the array." },
          { in: "nums = [2,9,4]", out: "0", note: "The elements are already distinct." },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i] <= 100"]),
      hints: [
        "The operations always remove a prefix, so what remains is a suffix of `nums` starting at a multiple of 3.",
        "Find the shortest suffix that is already distinct: scan from the right and stop at the first value you have seen before.",
        "If that repeated value sits at index `i`, the removed prefix must cover index `i`, which takes `floor(i / 3) + 1` operations.",
      ],
      editorial: explain({
        idea: "After `t` operations the array is the suffix starting at `3t`. A suffix is distinct exactly when it starts after the last index `i` whose value occurs again to its right, so the answer is the smallest `t` with `3t > i`.",
        steps: [
          "Walk `nums` from right to left, marking values in a seen table.",
          "At the first index `i` whose value is already marked, return `i / 3 + 1` (integer division).",
          "If the walk finishes without a repeat, return `0`.",
        ],
        why: "The suffix starting at `i + 1` is distinct (the scan found no repeat there), and any suffix starting at or before `i` contains `nums[i]` and its later copy. So the remaining suffix must start beyond `i`; the first multiple of 3 greater than `i` is `3 * (floor(i / 3) + 1)`.",
        time: "O(n)",
        space: "O(V) with V = 100 possible values",
        pitfalls: [
          "Scanning from the left finds the first duplicate pair, not the last repeated index that matters.",
          "An operation on fewer than three elements still counts as one operation.",
        ],
      }),
      examples: [
        { input: "[3,8,3,5,1,1,9]", expectedOutput: "2" },
        { input: "[4,5,6,4,4]", expectedOutput: "2" },
        { input: "[2,9,4]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 20, 100]));
        const top = pick(rng, [2, 10, 50, 100]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumOperations(nums: List[int]) -> int:
              seen = set()
              for i in range(len(nums) - 1, -1, -1):
                  if nums[i] in seen:
                      return i // 3 + 1
                  seen.add(nums[i])
              return 0
        `,
        javascript: code`
          var minimumOperations = function(nums) {
              var seen = new Array(101).fill(false);
              for (var i = nums.length - 1; i >= 0; i--) {
                  if (seen[nums[i]]) return Math.floor(i / 3) + 1;
                  seen[nums[i]] = true;
              }
              return 0;
          };
        `,
        typescript: code`
          function minimumOperations(nums: number[]): number {
              var seen: boolean[] = [];
              for (var v = 0; v <= 100; v++) seen.push(false);
              for (var i = nums.length - 1; i >= 0; i--) {
                  if (seen[nums[i]]) return Math.floor(i / 3) + 1;
                  seen[nums[i]] = true;
              }
              return 0;
          }
        `,
        java: code`
          public static int minimumOperations(int[] nums) {
              boolean[] seen = new boolean[101];
              for (int i = nums.length - 1; i >= 0; i--) {
                  if (seen[nums[i]]) return i / 3 + 1;
                  seen[nums[i]] = true;
              }
              return 0;
          }
        `,
        cpp: code`
          int minimumOperations(vector<int>& nums) {
              vector<bool> seen(101, false);
              for (int i = (int)nums.size() - 1; i >= 0; i--) {
                  if (seen[nums[i]]) return i / 3 + 1;
                  seen[nums[i]] = true;
              }
              return 0;
          }
        `,
        c: code`
          int minimumOperations(int* nums, int numsSize) {
              bool seen[101] = {false};
              for (int i = numsSize - 1; i >= 0; i--) {
                  if (seen[nums[i]]) return i / 3 + 1;
                  seen[nums[i]] = true;
              }
              return 0;
          }
        `,
        csharp: code`
          public static int MinimumOperations(int[] nums)
          {
              bool[] seen = new bool[101];
              for (int i = nums.Length - 1; i >= 0; i--)
              {
                  if (seen[nums[i]]) return i / 3 + 1;
                  seen[nums[i]] = true;
              }
              return 0;
          }
        `,
        go: code`
          func minimumOperations(nums []int) int {
              seen := make([]bool, 101)
              for i := len(nums) - 1; i >= 0; i-- {
                  if seen[nums[i]] {
                      return i/3 + 1
                  }
                  seen[nums[i]] = true
              }
              return 0
          }
        `,
        kotlin: code`
          fun minimumOperations(nums: IntArray): Int {
              val seen = BooleanArray(101)
              for (i in nums.indices.reversed()) {
                  if (seen[nums[i]]) return i / 3 + 1
                  seen[nums[i]] = true
              }
              return 0
          }
        `,
        swift: code`
          func minimumOperations(_ nums: [Int]) -> Int {
              var seen = [Bool](repeating: false, count: 101)
              var i = nums.count - 1
              while i >= 0 {
                  if seen[nums[i]] { return i / 3 + 1 }
                  seen[nums[i]] = true
                  i -= 1
              }
              return 0
          }
        `,
        rust: code`
          fn minimumOperations(nums: Vec<i32>) -> i32 {
              let mut seen = [false; 101];
              for i in (0..nums.len()).rev() {
                  let v = nums[i] as usize;
                  if seen[v] { return (i / 3 + 1) as i32; }
                  seen[v] = true;
              }
              0
          }
        `,
        php: code`
          function minimumOperations($nums) {
              $seen = [];
              for ($i = count($nums) - 1; $i >= 0; $i--) {
                  if (isset($seen[$nums[$i]])) return intdiv($i, 3) + 1;
                  $seen[$nums[$i]] = true;
              }
              return 0;
          }
        `,
        ruby: code`
          def minimumOperations(nums)
            seen = {}
            (nums.length - 1).downto(0) do |i|
              return i / 3 + 1 if seen[nums[i]]
              seen[nums[i]] = true
            end
            0
          end
        `,
      },
    };
  })(),

  // ── Count Special Subsequences (LC 3404) ────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let c = 0;
      for (let p = 0; p < n; p++)
        for (let q = p + 2; q < n; q++)
          for (let r = q + 2; r < n; r++)
            for (let s = r + 2; s < n; s++) if (nums[p] * nums[r] === nums[q] * nums[s]) c++;
      return c;
    };
    return {
      slug: "count-special-subsequences",
      title: "Count Special Subsequences",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Math", "Enumeration", "Google"],
      signature: { funcName: "numberOfSubsequences", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of positive integers.\n\n" +
        "A **special subsequence** is a choice of four indices `(p, q, r, s)` with `p < q < r < s` such that:\n\n" +
        "- `nums[p] * nums[r] == nums[q] * nums[s]`, and\n" +
        "- consecutive indices are not neighbours: `q - p > 1`, `r - q > 1` and `s - r > 1`.\n\n" +
        "Return the number of special subsequences in `nums`.",
        [
          { in: "nums = [2,9,4,9,8,9,4]", out: "1", note: "Only `(0, 2, 4, 6)` works: `2 * 8 = 16 = 4 * 4`." },
          { in: "nums = [1,1,1,1,1,1,1,1]", out: "5", note: "Every product is 1, so each of the 5 ways to place four indices with gaps of at least 2 in 8 positions counts." },
          { in: "nums = [1,2,3,4,5,6,7]", out: "0", note: "The only spaced choice is `(0, 2, 4, 6)`, and `1 * 5 != 3 * 7`." },
        ],
        [
          "7 <= nums.length <= 200 (LeetCode allows 1000; reduced here so the count fits a 32-bit integer)",
          "1 <= nums[i] <= 1000",
        ]),
      hints: [
        "Rewrite the condition as a ratio: `nums[p] / nums[q] == nums[s] / nums[r]`. The left side only involves `p, q`; the right side only `r, s`.",
        "Fix `r`. Every valid `q` is at most `r - 2`, and every valid `p` at most `q - 2`. If you have already counted the ratios of all such `(p, q)` pairs, each `s >= r + 2` just looks its ratio up.",
        "Store ratios exactly as reduced fractions (divide both parts by their gcd) — never as floating-point numbers. Moving `r` forward by one adds exactly the pairs with `q = r - 2`.",
      ],
      editorial: explain({
        idea: "The equation separates into a ratio of the left pair and a ratio of the right pair. Sweeping the third index `r` from left to right, a hash map holds the reduced-fraction ratio of every `(p, q)` pair that can precede it, and every `s` to the right of `r` counts the matching pairs in one lookup.",
        steps: [
          "Keep a map from a reduced fraction `a/b` to the number of pairs `(p, q)` with `nums[p] / nums[q] = a/b` seen so far.",
          "For `r` from 4 to `n - 3`: let `q = r - 2` and add the ratio `nums[p] / nums[q]` for every `p <= q - 2` to the map.",
          "Then, for every `s` from `r + 2` to `n - 1`, add the map's count for the ratio `nums[s] / nums[r]` to the answer.",
          "Reduce each fraction by its gcd and encode it as one integer key, e.g. `a * 1024 + b` (both parts are at most 1000).",
        ],
        why: "`nums[p] * nums[r] = nums[q] * nums[s]` is equivalent (all values positive) to `nums[p] / nums[q] = nums[s] / nums[r]`, and two fractions are equal exactly when their reduced forms are identical. When the sweep reaches `r`, the map contains every pair with `q <= r - 2` and `p <= q - 2` — each added exactly once, at the step where its `q` equalled `r - 2` — which is precisely the set of left pairs that may combine with this `r`. Each `s >= r + 2` then counts its matches once, so every special subsequence is counted exactly once, at its own `r`.",
        time: "O(n^2 log V)",
        space: "O(n^2) for the map in the worst case",
        pitfalls: [
          "Floating-point ratios can collide or miss: `1/3` computed two ways need not compare equal. Use reduced integer fractions.",
          "The gaps are strict: `q - p > 1` means `p <= q - 2`, not `p <= q - 1`.",
          "On LeetCode's full limits the count overflows 32 bits and needs a 64-bit integer.",
        ],
      }),
      examples: [
        { input: "[2,9,4,9,8,9,4]", expectedOutput: "1" },
        { input: "[1,1,1,1,1,1,1,1]", expectedOutput: "5" },
        { input: "[1,2,3,4,5,6,7]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 7, pick(rng, [7, 10, 16, 26]));
        const pool = pick(rng, [[1], [1, 2], [1, 2, 3, 4], [1, 2, 3, 4, 6, 8, 12], [2, 3, 5, 6, 10, 15, 30], [500, 1000, 250, 750]]);
        const wild = rng() < 0.25;
        const nums = Array.from({ length: n }, () => (wild ? ri(rng, 1, 1000) : pick(rng, pool)));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List
          from math import gcd

          def numberOfSubsequences(nums: List[int]) -> int:
              n = len(nums)
              ratios = {}
              ans = 0
              for r in range(4, n - 2):
                  q = r - 2
                  b = nums[q]
                  for p in range(q - 1):
                      a = nums[p]
                      g = gcd(a, b)
                      key = (a // g) * 1024 + b // g
                      ratios[key] = ratios.get(key, 0) + 1
                  d = nums[r]
                  for s in range(r + 2, n):
                      c = nums[s]
                      g = gcd(c, d)
                      ans += ratios.get((c // g) * 1024 + d // g, 0)
              return ans
        `,
        javascript: code`
          var numberOfSubsequences = function(nums) {
              var n = nums.length;
              var ratios = new Map();
              var ans = 0;
              for (var r = 4; r < n - 2; r++) {
                  var q = r - 2, b = nums[q];
                  for (var p = 0; p <= q - 2; p++) {
                      var g = gcdOf(nums[p], b);
                      var key = (nums[p] / g) * 1024 + b / g;
                      ratios.set(key, (ratios.get(key) || 0) + 1);
                  }
                  var d = nums[r];
                  for (var s = r + 2; s < n; s++) {
                      var h = gcdOf(nums[s], d);
                      ans += ratios.get((nums[s] / h) * 1024 + d / h) || 0;
                  }
              }
              return ans;
          };

          var gcdOf = function(a, b) {
              while (b) { var t = a % b; a = b; b = t; }
              return a;
          };
        `,
        typescript: code`
          function gcdOf(a: number, b: number): number {
              while (b) { var t = a % b; a = b; b = t; }
              return a;
          }

          function numberOfSubsequences(nums: number[]): number {
              var n = nums.length;
              var ratios: { [key: number]: number } = {};
              var ans = 0;
              for (var r = 4; r < n - 2; r++) {
                  var q = r - 2, b = nums[q];
                  for (var p = 0; p <= q - 2; p++) {
                      var g = gcdOf(nums[p], b);
                      var key = (nums[p] / g) * 1024 + b / g;
                      ratios[key] = (ratios[key] || 0) + 1;
                  }
                  var d = nums[r];
                  for (var s = r + 2; s < n; s++) {
                      var h = gcdOf(nums[s], d);
                      ans += ratios[(nums[s] / h) * 1024 + d / h] || 0;
                  }
              }
              return ans;
          }
        `,
        java: code`
          static int gcdOf(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          public static int numberOfSubsequences(int[] nums) {
              int n = nums.length;
              HashMap<Integer, Integer> ratios = new HashMap<>();
              int ans = 0;
              for (int r = 4; r < n - 2; r++) {
                  int q = r - 2, b = nums[q];
                  for (int p = 0; p <= q - 2; p++) {
                      int g = gcdOf(nums[p], b);
                      ratios.merge((nums[p] / g) * 1024 + b / g, 1, Integer::sum);
                  }
                  int d = nums[r];
                  for (int s = r + 2; s < n; s++) {
                      int h = gcdOf(nums[s], d);
                      ans += ratios.getOrDefault((nums[s] / h) * 1024 + d / h, 0);
                  }
              }
              return ans;
          }
        `,
        cpp: code`
          int numberOfSubsequences(vector<int>& nums) {
              int n = nums.size();
              unordered_map<int, int> ratios;
              int ans = 0;
              for (int r = 4; r < n - 2; r++) {
                  int q = r - 2, b = nums[q];
                  for (int p = 0; p <= q - 2; p++) {
                      int g = __gcd(nums[p], b);
                      ratios[(nums[p] / g) * 1024 + b / g]++;
                  }
                  int d = nums[r];
                  for (int s = r + 2; s < n; s++) {
                      int h = __gcd(nums[s], d);
                      auto it = ratios.find((nums[s] / h) * 1024 + d / h);
                      if (it != ratios.end()) ans += it->second;
                  }
              }
              return ans;
          }
        `,
        c: code`
          // Ratio counts indexed by (a/g) * 1024 + (b/g); only touched slots are reset.
          static int gRatio[1001 * 1024 + 1024];

          static int gcdOf(int a, int b) {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          int numberOfSubsequences(int* nums, int numsSize) {
              int n = numsSize;
              int* touched = (int*)malloc(sizeof(int) * (n * n + 1));
              int nTouched = 0;
              int ans = 0;
              for (int r = 4; r < n - 2; r++) {
                  int q = r - 2, b = nums[q];
                  for (int p = 0; p <= q - 2; p++) {
                      int g = gcdOf(nums[p], b);
                      int key = (nums[p] / g) * 1024 + b / g;
                      if (gRatio[key] == 0) touched[nTouched++] = key;
                      gRatio[key]++;
                  }
                  int d = nums[r];
                  for (int s = r + 2; s < n; s++) {
                      int h = gcdOf(nums[s], d);
                      ans += gRatio[(nums[s] / h) * 1024 + d / h];
                  }
              }
              for (int i = 0; i < nTouched; i++) gRatio[touched[i]] = 0;
              free(touched);
              return ans;
          }
        `,
        csharp: code`
          static int GcdOf(int a, int b)
          {
              while (b != 0) { int t = a % b; a = b; b = t; }
              return a;
          }

          public static int NumberOfSubsequences(int[] nums)
          {
              int n = nums.Length;
              var ratios = new Dictionary<int, int>();
              int ans = 0;
              for (int r = 4; r < n - 2; r++)
              {
                  int q = r - 2, b = nums[q];
                  for (int p = 0; p <= q - 2; p++)
                  {
                      int g = GcdOf(nums[p], b);
                      int key = (nums[p] / g) * 1024 + b / g;
                      int c0;
                      ratios.TryGetValue(key, out c0);
                      ratios[key] = c0 + 1;
                  }
                  int d = nums[r];
                  for (int s = r + 2; s < n; s++)
                  {
                      int h = GcdOf(nums[s], d);
                      int c;
                      if (ratios.TryGetValue((nums[s] / h) * 1024 + d / h, out c)) ans += c;
                  }
              }
              return ans;
          }
        `,
        go: code`
          func gcdOf(a, b int) int {
              for b != 0 {
                  a, b = b, a%b
              }
              return a
          }

          func numberOfSubsequences(nums []int) int {
              n := len(nums)
              ratios := map[int]int{}
              ans := 0
              for r := 4; r < n-2; r++ {
                  q, b := r-2, nums[r-2]
                  for p := 0; p <= q-2; p++ {
                      g := gcdOf(nums[p], b)
                      ratios[(nums[p]/g)*1024+b/g]++
                  }
                  d := nums[r]
                  for s := r + 2; s < n; s++ {
                      h := gcdOf(nums[s], d)
                      ans += ratios[(nums[s]/h)*1024+d/h]
                  }
              }
              return ans
          }
        `,
        kotlin: code`
          fun gcdOf(a0: Int, b0: Int): Int {
              var a = a0
              var b = b0
              while (b != 0) { val t = a % b; a = b; b = t }
              return a
          }

          fun numberOfSubsequences(nums: IntArray): Int {
              val n = nums.size
              val ratios = HashMap<Int, Int>()
              var ans = 0
              for (r in 4 until n - 2) {
                  val q = r - 2
                  val b = nums[q]
                  for (p in 0..q - 2) {
                      val g = gcdOf(nums[p], b)
                      val key = (nums[p] / g) * 1024 + b / g
                      ratios[key] = (ratios[key] ?: 0) + 1
                  }
                  val d = nums[r]
                  for (s in r + 2 until n) {
                      val h = gcdOf(nums[s], d)
                      ans += ratios[(nums[s] / h) * 1024 + d / h] ?: 0
                  }
              }
              return ans
          }
        `,
        swift: code`
          func gcdOf(_ a0: Int, _ b0: Int) -> Int {
              var a = a0, b = b0
              while b != 0 { (a, b) = (b, a % b) }
              return a
          }

          func numberOfSubsequences(_ nums: [Int]) -> Int {
              let n = nums.count
              var ratios = [Int: Int]()
              var ans = 0
              var r = 4
              while r < n - 2 {
                  let q = r - 2, b = nums[q]
                  var p = 0
                  while p <= q - 2 {
                      let g = gcdOf(nums[p], b)
                      ratios[(nums[p] / g) * 1024 + b / g, default: 0] += 1
                      p += 1
                  }
                  let d = nums[r]
                  var s = r + 2
                  while s < n {
                      let h = gcdOf(nums[s], d)
                      ans += ratios[(nums[s] / h) * 1024 + d / h, default: 0]
                      s += 1
                  }
                  r += 1
              }
              return ans
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn gcd_of(mut a: i32, mut b: i32) -> i32 {
              while b != 0 { let t = a % b; a = b; b = t; }
              a
          }

          fn numberOfSubsequences(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut ratios: HashMap<i32, i32> = HashMap::new();
              let mut ans = 0;
              for r in 4..n.saturating_sub(2) {
                  let q = r - 2;
                  let b = nums[q];
                  for p in 0..(q - 1) {
                      let g = gcd_of(nums[p], b);
                      *ratios.entry((nums[p] / g) * 1024 + b / g).or_insert(0) += 1;
                  }
                  let d = nums[r];
                  for s in (r + 2)..n {
                      let h = gcd_of(nums[s], d);
                      if let Some(c) = ratios.get(&((nums[s] / h) * 1024 + d / h)) { ans += c; }
                  }
              }
              ans
          }
        `,
        php: code`
          function gcdOf($a, $b) {
              while ($b != 0) { $t = $a % $b; $a = $b; $b = $t; }
              return $a;
          }

          function numberOfSubsequences($nums) {
              $n = count($nums);
              $ratios = [];
              $ans = 0;
              for ($r = 4; $r < $n - 2; $r++) {
                  $q = $r - 2;
                  $b = $nums[$q];
                  for ($p = 0; $p <= $q - 2; $p++) {
                      $g = gcdOf($nums[$p], $b);
                      $key = intdiv($nums[$p], $g) * 1024 + intdiv($b, $g);
                      $ratios[$key] = ($ratios[$key] ?? 0) + 1;
                  }
                  $d = $nums[$r];
                  for ($s = $r + 2; $s < $n; $s++) {
                      $h = gcdOf($nums[$s], $d);
                      $ans += $ratios[intdiv($nums[$s], $h) * 1024 + intdiv($d, $h)] ?? 0;
                  }
              }
              return $ans;
          }
        `,
        ruby: code`
          def numberOfSubsequences(nums)
            n = nums.length
            ratios = Hash.new(0)
            ans = 0
            (4...(n - 2)).each do |r|
              q = r - 2
              b = nums[q]
              (0..(q - 2)).each do |p|
                g = nums[p].gcd(b)
                ratios[(nums[p] / g) * 1024 + b / g] += 1
              end
              d = nums[r]
              ((r + 2)...n).each do |s|
                h = nums[s].gcd(d)
                ans += ratios[(nums[s] / h) * 1024 + d / h]
              end
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Find Valid Pair of Adjacent Digits in String (LC 3438) ──────
  (() => {
    const ref = (s: string) => {
      for (let i = 0; i + 1 < s.length; i++) {
        const a = s[i], b = s[i + 1];
        if (a === b) continue;
        const ca = s.split(a).length - 1, cb = s.split(b).length - 1;
        if (ca === Number(a) && cb === Number(b)) return a + b;
      }
      return "";
    };
    return {
      slug: "find-valid-pair-of-adjacent-digits-in-string",
      title: "Find Valid Pair of Adjacent Digits in String",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon"],
      signature: { funcName: "findValidPair", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `s` made only of the digits `1` to `9`.\n\n" +
        "A **valid pair** is two adjacent characters `s[i]` and `s[i + 1]` such that:\n\n" +
        "- the two digits are different, and\n" +
        "- each of the two digits occurs in the whole of `s` exactly as many times as its own value (a `3` must occur exactly three times, a `1` exactly once).\n\n" +
        "Scanning from left to right, return the **first** valid pair as a two-character string, or an empty string if there is none.",
        [
          { in: 's = "4221333"', out: "21", note: "`42` fails (`4` occurs once, not four times), `22` repeats a digit, and `21` works: `2` occurs twice and `1` once." },
          { in: 's = "5535"', out: "", note: "`5` occurs three times, not five, and `3` occurs once, not three times, so no pair is valid." },
          { in: 's = "22333"', out: "23" },
        ],
        ["2 <= s.length <= 100", "s consists only of digits from '1' to '9'"]),
      hints: [
        "Whether a digit qualifies depends only on how often it occurs in the whole string — count all nine digits first.",
        "Then walk the adjacent pairs from the left and return the first one whose digits differ and both match their counts.",
      ],
      editorial: explain({
        idea: "The validity of a digit is a global property (its total count), so one counting pass followed by one scan over adjacent pairs settles it.",
        steps: [
          "Count the occurrences of each digit `1`–`9`.",
          "For `i` from 0 to `n - 2`, let `a = s[i]` and `b = s[i + 1]`.",
          "If `a != b`, `count[a] == a` and `count[b] == b`, return `a` followed by `b`.",
          "If no pair qualifies, return the empty string.",
        ],
        why: "Both conditions of a valid pair are checked exactly as stated for every adjacent pair in left-to-right order, so the first one returned is the first valid pair, and the empty string is returned only when none exists.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Compare the count with the digit's **value**, not its character code.",
          "A pair of equal digits such as `22` never counts, even when `2` occurs exactly twice.",
        ],
      }),
      examples: [
        { input: '"4221333"', expectedOutput: "21" },
        { input: '"5535"', expectedOutput: "" },
        { input: '"22333"', expectedOutput: "23" },
      ],
      gen: (rng: Rng) => {
        const chars: string[] = [];
        const kinds = ri(rng, 1, 5);
        for (let t = 0; t < kinds; t++) {
          const d = ri(rng, 1, pick(rng, [3, 5, 9]));
          const c = rng() < 0.6 ? d : Math.max(1, d + ri(rng, -1, 1));
          for (let i = 0; i < c; i++) chars.push(String(d));
        }
        if (rng() < 0.2) for (let i = 0; i < ri(rng, 1, 30); i++) chars.push(String(ri(rng, 1, 9)));
        while (chars.length < 2) chars.push(String(ri(rng, 1, 9)));
        const s = shuffle(rng, chars).slice(0, 100).join("");
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: code`
          def findValidPair(s: str) -> str:
              count = [0] * 10
              for ch in s:
                  count[int(ch)] += 1
              for i in range(len(s) - 1):
                  a, b = int(s[i]), int(s[i + 1])
                  if a != b and count[a] == a and count[b] == b:
                      return s[i:i + 2]
              return ""
        `,
        javascript: code`
          var findValidPair = function(s) {
              var count = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              for (var i = 0; i < s.length; i++) count[s.charCodeAt(i) - 48]++;
              for (var j = 0; j + 1 < s.length; j++) {
                  var a = s.charCodeAt(j) - 48, b = s.charCodeAt(j + 1) - 48;
                  if (a !== b && count[a] === a && count[b] === b) return s.substring(j, j + 2);
              }
              return "";
          };
        `,
        typescript: code`
          function findValidPair(s: string): string {
              var count = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              for (var i = 0; i < s.length; i++) count[s.charCodeAt(i) - 48]++;
              for (var j = 0; j + 1 < s.length; j++) {
                  var a = s.charCodeAt(j) - 48, b = s.charCodeAt(j + 1) - 48;
                  if (a !== b && count[a] === a && count[b] === b) return s.substring(j, j + 2);
              }
              return "";
          }
        `,
        java: code`
          public static String findValidPair(String s) {
              int[] count = new int[10];
              for (int i = 0; i < s.length(); i++) count[s.charAt(i) - '0']++;
              for (int i = 0; i + 1 < s.length(); i++) {
                  int a = s.charAt(i) - '0', b = s.charAt(i + 1) - '0';
                  if (a != b && count[a] == a && count[b] == b) return s.substring(i, i + 2);
              }
              return "";
          }
        `,
        cpp: code`
          string findValidPair(string s) {
              int count[10] = {0};
              for (char c : s) count[c - '0']++;
              for (int i = 0; i + 1 < (int)s.size(); i++) {
                  int a = s[i] - '0', b = s[i + 1] - '0';
                  if (a != b && count[a] == a && count[b] == b) return s.substr(i, 2);
              }
              return "";
          }
        `,
        c: code`
          char* findValidPair(const char* s) {
              int count[10] = {0};
              int n = (int)strlen(s);
              for (int i = 0; i < n; i++) count[s[i] - '0']++;
              char* res = (char*)malloc(3);
              res[0] = '\0';
              for (int i = 0; i + 1 < n; i++) {
                  int a = s[i] - '0', b = s[i + 1] - '0';
                  if (a != b && count[a] == a && count[b] == b) {
                      res[0] = s[i];
                      res[1] = s[i + 1];
                      res[2] = '\0';
                      break;
                  }
              }
              return res;
          }
        `,
        csharp: code`
          public static string FindValidPair(string s)
          {
              int[] count = new int[10];
              foreach (char c in s) count[c - '0']++;
              for (int i = 0; i + 1 < s.Length; i++)
              {
                  int a = s[i] - '0', b = s[i + 1] - '0';
                  if (a != b && count[a] == a && count[b] == b) return s.Substring(i, 2);
              }
              return "";
          }
        `,
        go: code`
          func findValidPair(s string) string {
              count := make([]int, 10)
              for i := 0; i < len(s); i++ {
                  count[s[i]-'0']++
              }
              for i := 0; i+1 < len(s); i++ {
                  a, b := int(s[i]-'0'), int(s[i+1]-'0')
                  if a != b && count[a] == a && count[b] == b {
                      return s[i : i+2]
                  }
              }
              return ""
          }
        `,
        kotlin: code`
          fun findValidPair(s: String): String {
              val count = IntArray(10)
              for (c in s) count[c - '0']++
              for (i in 0 until s.length - 1) {
                  val a = s[i] - '0'
                  val b = s[i + 1] - '0'
                  if (a != b && count[a] == a && count[b] == b) return s.substring(i, i + 2)
              }
              return ""
          }
        `,
        swift: code`
          func findValidPair(_ s: String) -> String {
              let d = s.utf8.map { Int($0) - 48 }
              var count = [Int](repeating: 0, count: 10)
              for v in d { count[v] += 1 }
              var i = 0
              while i + 1 < d.count {
                  let a = d[i], b = d[i + 1]
                  if a != b && count[a] == a && count[b] == b { return "\(a)\(b)" }
                  i += 1
              }
              return ""
          }
        `,
        rust: code`
          fn findValidPair(s: String) -> String {
              let d: Vec<usize> = s.bytes().map(|c| (c - b'0') as usize).collect();
              let mut count = [0usize; 10];
              for &v in &d { count[v] += 1; }
              for i in 0..d.len().saturating_sub(1) {
                  let (a, b) = (d[i], d[i + 1]);
                  if a != b && count[a] == a && count[b] == b { return s[i..i + 2].to_string(); }
              }
              String::new()
          }
        `,
        php: code`
          function findValidPair($s) {
              $count = array_fill(0, 10, 0);
              $n = strlen($s);
              for ($i = 0; $i < $n; $i++) $count[(int)$s[$i]]++;
              for ($i = 0; $i + 1 < $n; $i++) {
                  $a = (int)$s[$i];
                  $b = (int)$s[$i + 1];
                  if ($a != $b && $count[$a] == $a && $count[$b] == $b) return substr($s, $i, 2);
              }
              return "";
          }
        `,
        ruby: code`
          def findValidPair(s)
            d = s.chars.map(&:to_i)
            count = Array.new(10, 0)
            d.each { |v| count[v] += 1 }
            (0...(d.length - 1)).each do |i|
              a = d[i]
              b = d[i + 1]
              return s[i, 2] if a != b && count[a] == a && count[b] == b
            end
            ""
          end
        `,
      },
    };
  })(),

  // ── Maximum Difference Between Even and Odd Frequency I (LC 3442) ─
  (() => {
    const ref = (s: string) => {
      const f: Record<string, number> = {};
      for (const c of s) f[c] = (f[c] || 0) + 1;
      let best = -Infinity;
      for (const a of Object.keys(f)) for (const b of Object.keys(f)) {
        if (f[a] % 2 === 1 && f[b] % 2 === 0) best = Math.max(best, f[a] - f[b]);
      }
      return best;
    };
    const valid = (s: string) => {
      const f: Record<string, number> = {};
      for (const c of s) f[c] = (f[c] || 0) + 1;
      const v = Object.values(f);
      return v.some((x) => x % 2 === 1) && v.some((x) => x % 2 === 0);
    };
    return {
      slug: "maximum-difference-between-even-and-odd-frequency-i",
      title: "Maximum Difference Between Even and Odd Frequency I",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon", "Microsoft"],
      signature: { funcName: "maxDifference", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `s` of lowercase English letters.\n\n" +
        "Choose two characters `a1` and `a2` of `s` such that `a1` occurs an **odd** number of times in `s` and `a2` occurs an **even** number of times. Return the **largest** possible value of `freq(a1) - freq(a2)`.\n\n" +
        "`s` is guaranteed to contain at least one character with an odd frequency and at least one with an even frequency.",
        [
          { in: 's = "cccccdde"', out: "3", note: "`c` occurs 5 times (odd) and `d` twice (even): `5 - 2 = 3`." },
          { in: 's = "abbbbcc"', out: "-1", note: "Odd: `a` (1). Even: `b` (4), `c` (2). The best is `1 - 2 = -1`." },
          { in: 's = "zzzyyyyyyx"', out: "-3", note: "Odd: `z` (3), `x` (1). Even: `y` (6). The best is `3 - 6 = -3`." },
        ],
        [
          "3 <= s.length <= 100",
          "s consists only of lowercase English letters",
          "s contains at least one character with an odd frequency and one with an even frequency",
        ]),
      hints: [
        "Count each letter's frequency first.",
        "To make the difference as large as possible, take the largest odd frequency and subtract the smallest (non-zero) even frequency.",
      ],
      editorial: explain({
        idea: "The two choices are independent: the difference is maximised by the largest odd frequency minus the smallest even frequency among the letters that actually occur.",
        steps: [
          "Count the 26 letter frequencies.",
          "Over the letters with an odd count, take the maximum `maxOdd`.",
          "Over the letters with a non-zero even count, take the minimum `minEven`.",
          "Return `maxOdd - minEven`.",
        ],
        why: "`freq(a1) - freq(a2)` grows with `freq(a1)` and shrinks with `freq(a2)`, and the two characters are chosen from disjoint groups (odd versus even counts), so each can be optimised on its own.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Letters that do not occur have frequency 0, which is even — they must be excluded, or `minEven` collapses to 0.",
          "The answer can be negative.",
        ],
      }),
      examples: [
        { input: '"cccccdde"', expectedOutput: "3" },
        { input: '"abbbbcc"', expectedOutput: "-1" },
        { input: '"zzzyyyyyyx"', expectedOutput: "-3" },
      ],
      gen: (rng: Rng) => {
        for (;;) {
          const s = randLower(rng, 3, pick(rng, [4, 10, 30, 100]), pick(rng, ["ab", "abc", "abcde", "abcdefghijklmnopqrstuvwxyz"]));
          if (valid(s)) return { input: `"${s}"`, expectedOutput: String(ref(s)) };
        }
      },
      solutions: {
        python: code`
          def maxDifference(s: str) -> int:
              freq = [0] * 26
              for ch in s:
                  freq[ord(ch) - 97] += 1
              max_odd = max(f for f in freq if f % 2 == 1)
              min_even = min(f for f in freq if f > 0 and f % 2 == 0)
              return max_odd - min_even
        `,
        javascript: code`
          var maxDifference = function(s) {
              var freq = new Array(26).fill(0);
              for (var i = 0; i < s.length; i++) freq[s.charCodeAt(i) - 97]++;
              var maxOdd = 0, minEven = 1000;
              for (var c = 0; c < 26; c++) {
                  var f = freq[c];
                  if (f % 2 === 1) maxOdd = Math.max(maxOdd, f);
                  else if (f > 0) minEven = Math.min(minEven, f);
              }
              return maxOdd - minEven;
          };
        `,
        typescript: code`
          function maxDifference(s: string): number {
              var freq: number[] = [];
              for (var c0 = 0; c0 < 26; c0++) freq.push(0);
              for (var i = 0; i < s.length; i++) freq[s.charCodeAt(i) - 97]++;
              var maxOdd = 0, minEven = 1000;
              for (var c = 0; c < 26; c++) {
                  var f = freq[c];
                  if (f % 2 === 1) maxOdd = Math.max(maxOdd, f);
                  else if (f > 0) minEven = Math.min(minEven, f);
              }
              return maxOdd - minEven;
          }
        `,
        java: code`
          public static int maxDifference(String s) {
              int[] freq = new int[26];
              for (int i = 0; i < s.length(); i++) freq[s.charAt(i) - 'a']++;
              int maxOdd = 0, minEven = 1000;
              for (int f : freq) {
                  if (f % 2 == 1) maxOdd = Math.max(maxOdd, f);
                  else if (f > 0) minEven = Math.min(minEven, f);
              }
              return maxOdd - minEven;
          }
        `,
        cpp: code`
          int maxDifference(string s) {
              int freq[26] = {0};
              for (char c : s) freq[c - 'a']++;
              int maxOdd = 0, minEven = 1000;
              for (int f : freq) {
                  if (f % 2 == 1) maxOdd = max(maxOdd, f);
                  else if (f > 0) minEven = min(minEven, f);
              }
              return maxOdd - minEven;
          }
        `,
        c: code`
          int maxDifference(const char* s) {
              int freq[26] = {0};
              for (int i = 0; s[i]; i++) freq[s[i] - 'a']++;
              int maxOdd = 0, minEven = 1000;
              for (int c = 0; c < 26; c++) {
                  int f = freq[c];
                  if (f % 2 == 1) { if (f > maxOdd) maxOdd = f; }
                  else if (f > 0 && f < minEven) minEven = f;
              }
              return maxOdd - minEven;
          }
        `,
        csharp: code`
          public static int MaxDifference(string s)
          {
              int[] freq = new int[26];
              foreach (char c in s) freq[c - 'a']++;
              int maxOdd = 0, minEven = 1000;
              foreach (int f in freq)
              {
                  if (f % 2 == 1) maxOdd = Math.Max(maxOdd, f);
                  else if (f > 0) minEven = Math.Min(minEven, f);
              }
              return maxOdd - minEven;
          }
        `,
        go: code`
          func maxDifference(s string) int {
              freq := make([]int, 26)
              for i := 0; i < len(s); i++ {
                  freq[s[i]-'a']++
              }
              maxOdd, minEven := 0, 1000
              for _, f := range freq {
                  if f%2 == 1 {
                      if f > maxOdd {
                          maxOdd = f
                      }
                  } else if f > 0 && f < minEven {
                      minEven = f
                  }
              }
              return maxOdd - minEven
          }
        `,
        kotlin: code`
          fun maxDifference(s: String): Int {
              val freq = IntArray(26)
              for (c in s) freq[c - 'a']++
              var maxOdd = 0
              var minEven = 1000
              for (f in freq) {
                  if (f % 2 == 1) maxOdd = maxOf(maxOdd, f)
                  else if (f > 0) minEven = minOf(minEven, f)
              }
              return maxOdd - minEven
          }
        `,
        swift: code`
          func maxDifference(_ s: String) -> Int {
              var freq = [Int](repeating: 0, count: 26)
              for c in s.utf8 { freq[Int(c) - 97] += 1 }
              var maxOdd = 0, minEven = 1000
              for f in freq {
                  if f % 2 == 1 { maxOdd = max(maxOdd, f) }
                  else if f > 0 { minEven = min(minEven, f) }
              }
              return maxOdd - minEven
          }
        `,
        rust: code`
          fn maxDifference(s: String) -> i32 {
              let mut freq = [0i32; 26];
              for c in s.bytes() { freq[(c - b'a') as usize] += 1; }
              let (mut max_odd, mut min_even) = (0, 1000);
              for &f in freq.iter() {
                  if f % 2 == 1 { max_odd = max_odd.max(f); }
                  else if f > 0 { min_even = min_even.min(f); }
              }
              max_odd - min_even
          }
        `,
        php: code`
          function maxDifference($s) {
              $maxOdd = 0;
              $minEven = 1000;
              foreach (count_chars($s, 1) as $f) {
                  if ($f % 2 == 1) $maxOdd = max($maxOdd, $f);
                  else $minEven = min($minEven, $f);
              }
              return $maxOdd - $minEven;
          }
        `,
        ruby: code`
          def maxDifference(s)
            count = Hash.new(0)
            s.each_char { |c| count[c] += 1 }
            freq = count.values
            freq.select(&:odd?).max - freq.select(&:even?).min
          end
        `,
      },
    };
  })(),

  // ── Find the Largest Almost Missing Integer (LC 3471) ───────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const windows: Record<number, number> = {};
      for (let i = 0; i + k <= nums.length; i++) {
        const seen = new Set(nums.slice(i, i + k));
        seen.forEach((v) => { windows[v] = (windows[v] || 0) + 1; });
      }
      let best = -1;
      for (const v of Object.keys(windows)) if (windows[Number(v)] === 1) best = Math.max(best, Number(v));
      return best;
    };
    return {
      slug: "find-the-largest-almost-missing-integer",
      title: "Find the Largest Almost Missing Integer",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Amazon"],
      signature: {
        funcName: "largestInteger",
        params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }],
        returns: "int" as const,
      },
      description: describe(
        "You are given an integer array `nums` and an integer `k`.\n\n" +
        "An integer `x` is **almost missing** from `nums` if it occurs in **exactly one** of the subarrays of `nums` that have length `k`. (A subarray contains `x` if at least one of its elements equals `x`.)\n\n" +
        "Return the largest almost missing integer, or `-1` if there is none.",
        [
          { in: "nums = [4,8,1,6,5], k = 3", out: "5", note: "The windows are `[4,8,1]`, `[8,1,6]`, `[1,6,5]`. `4` and `5` each occur in exactly one of them; `8`, `6` and `1` occur in more." },
          { in: "nums = [2,7,7,3], k = 1", out: "3", note: "With `k = 1` each element is its own window: `2` and `3` occur once, `7` twice." },
          { in: "nums = [9,9], k = 1", out: "-1", note: "`9` occurs in both windows." },
        ],
        ["1 <= nums.length <= 50", "0 <= nums[i] <= 50", "1 <= k <= nums.length"]),
      hints: [
        "Think about which positions belong to only one window of length `k`. If `1 < k < n`, every position except the two ends lies in at least two windows.",
        "So for `1 < k < n`, only `nums[0]` and `nums[n-1]` can be almost missing — and only if that value occurs nowhere else in the array.",
        "Handle the two edge cases separately: `k == n` (one window holds everything) and `k == 1` (a value must occur exactly once).",
      ],
      editorial: explain({
        idea: "For `1 < k < n`, an interior index is covered by at least two windows, so a value is almost missing only if its single occurrence is at index 0 or `n - 1`. The cases `k == n` and `k == 1` are degenerate and read off directly.",
        steps: [
          "If `k == n`, there is one window, so every value is almost missing: return `max(nums)`.",
          "Count how often each value occurs.",
          "If `k == 1`, each element is a window: return the largest value whose count is 1, or `-1`.",
          "Otherwise start with `-1`; if `nums[0]` occurs once, take it; if `nums[n-1]` occurs once, take the larger. Return the result.",
        ],
        why: "Index `i` lies in windows starting from `max(0, i - k + 1)` to `min(i, n - k)`. For `0 < i < n - 1` with `1 < k < n` that range has at least two starts, so any value occurring at an interior index appears in two windows. Index 0 lies only in the first window and index `n - 1` only in the last, which are different windows when `k < n` — so a value occurring solely at one end is in exactly one window, and a value occurring at an end and anywhere else is in at least two.",
        time: "O(n)",
        space: "O(V) with V = 51 possible values",
        pitfalls: [
          "With `k == n` the general rule fails: the first and last windows are the same window, and every value counts.",
          "A value at index 0 that also appears later is **not** almost missing.",
        ],
      }),
      examples: [
        { input: "[4,8,1,6,5]\n3", expectedOutput: "5" },
        { input: "[2,7,7,3]\n1", expectedOutput: "3" },
        { input: "[9,9]\n1", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 8, 20, 50]));
        const top = pick(rng, [2, 5, 15, 50]);
        const nums = Array.from({ length: n }, () => ri(rng, 0, top));
        const k = pick(rng, [1, n, ri(rng, 1, n)]);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def largestInteger(nums: List[int], k: int) -> int:
              n = len(nums)
              if k == n:
                  return max(nums)
              count = {}
              for v in nums:
                  count[v] = count.get(v, 0) + 1
              if k == 1:
                  once = [v for v, c in count.items() if c == 1]
                  return max(once) if once else -1
              best = -1
              if count[nums[0]] == 1:
                  best = nums[0]
              if count[nums[-1]] == 1:
                  best = max(best, nums[-1])
              return best
        `,
        javascript: code`
          var largestInteger = function(nums, k) {
              var n = nums.length;
              var count = new Array(51).fill(0);
              var mx = -1;
              for (var i = 0; i < n; i++) {
                  count[nums[i]]++;
                  mx = Math.max(mx, nums[i]);
              }
              if (k === n) return mx;
              var best = -1;
              if (k === 1) {
                  for (var v = 0; v <= 50; v++) if (count[v] === 1) best = v;
                  return best;
              }
              if (count[nums[0]] === 1) best = nums[0];
              if (count[nums[n - 1]] === 1) best = Math.max(best, nums[n - 1]);
              return best;
          };
        `,
        typescript: code`
          function largestInteger(nums: number[], k: number): number {
              var n = nums.length;
              var count: number[] = [];
              for (var z = 0; z <= 50; z++) count.push(0);
              var mx = -1;
              for (var i = 0; i < n; i++) {
                  count[nums[i]]++;
                  mx = Math.max(mx, nums[i]);
              }
              if (k === n) return mx;
              var best = -1;
              if (k === 1) {
                  for (var v = 0; v <= 50; v++) if (count[v] === 1) best = v;
                  return best;
              }
              if (count[nums[0]] === 1) best = nums[0];
              if (count[nums[n - 1]] === 1) best = Math.max(best, nums[n - 1]);
              return best;
          }
        `,
        java: code`
          public static int largestInteger(int[] nums, int k) {
              int n = nums.length;
              int[] count = new int[51];
              int mx = -1;
              for (int v : nums) {
                  count[v]++;
                  mx = Math.max(mx, v);
              }
              if (k == n) return mx;
              int best = -1;
              if (k == 1) {
                  for (int v = 0; v <= 50; v++) if (count[v] == 1) best = v;
                  return best;
              }
              if (count[nums[0]] == 1) best = nums[0];
              if (count[nums[n - 1]] == 1) best = Math.max(best, nums[n - 1]);
              return best;
          }
        `,
        cpp: code`
          int largestInteger(vector<int>& nums, int k) {
              int n = nums.size();
              vector<int> count(51, 0);
              int mx = -1;
              for (int v : nums) {
                  count[v]++;
                  mx = max(mx, v);
              }
              if (k == n) return mx;
              int best = -1;
              if (k == 1) {
                  for (int v = 0; v <= 50; v++) if (count[v] == 1) best = v;
                  return best;
              }
              if (count[nums[0]] == 1) best = nums[0];
              if (count[nums[n - 1]] == 1) best = max(best, nums[n - 1]);
              return best;
          }
        `,
        c: code`
          int largestInteger(int* nums, int numsSize, int k) {
              int n = numsSize;
              int count[51] = {0};
              int mx = -1;
              for (int i = 0; i < n; i++) {
                  count[nums[i]]++;
                  if (nums[i] > mx) mx = nums[i];
              }
              if (k == n) return mx;
              int best = -1;
              if (k == 1) {
                  for (int v = 0; v <= 50; v++) if (count[v] == 1) best = v;
                  return best;
              }
              if (count[nums[0]] == 1) best = nums[0];
              if (count[nums[n - 1]] == 1 && nums[n - 1] > best) best = nums[n - 1];
              return best;
          }
        `,
        csharp: code`
          public static int LargestInteger(int[] nums, int k)
          {
              int n = nums.Length;
              int[] count = new int[51];
              int mx = -1;
              foreach (int v in nums)
              {
                  count[v]++;
                  mx = Math.Max(mx, v);
              }
              if (k == n) return mx;
              int best = -1;
              if (k == 1)
              {
                  for (int v = 0; v <= 50; v++) if (count[v] == 1) best = v;
                  return best;
              }
              if (count[nums[0]] == 1) best = nums[0];
              if (count[nums[n - 1]] == 1) best = Math.Max(best, nums[n - 1]);
              return best;
          }
        `,
        go: code`
          func largestInteger(nums []int, k int) int {
              n := len(nums)
              count := make([]int, 51)
              mx := -1
              for _, v := range nums {
                  count[v]++
                  if v > mx {
                      mx = v
                  }
              }
              if k == n {
                  return mx
              }
              best := -1
              if k == 1 {
                  for v := 0; v <= 50; v++ {
                      if count[v] == 1 {
                          best = v
                      }
                  }
                  return best
              }
              if count[nums[0]] == 1 {
                  best = nums[0]
              }
              if count[nums[n-1]] == 1 && nums[n-1] > best {
                  best = nums[n-1]
              }
              return best
          }
        `,
        kotlin: code`
          fun largestInteger(nums: IntArray, k: Int): Int {
              val n = nums.size
              val count = IntArray(51)
              var mx = -1
              for (v in nums) {
                  count[v]++
                  mx = maxOf(mx, v)
              }
              if (k == n) return mx
              var best = -1
              if (k == 1) {
                  for (v in 0..50) if (count[v] == 1) best = v
                  return best
              }
              if (count[nums[0]] == 1) best = nums[0]
              if (count[nums[n - 1]] == 1) best = maxOf(best, nums[n - 1])
              return best
          }
        `,
        swift: code`
          func largestInteger(_ nums: [Int], _ k: Int) -> Int {
              let n = nums.count
              var count = [Int](repeating: 0, count: 51)
              var mx = -1
              for v in nums {
                  count[v] += 1
                  mx = max(mx, v)
              }
              if k == n { return mx }
              var best = -1
              if k == 1 {
                  for v in 0...50 where count[v] == 1 { best = v }
                  return best
              }
              if count[nums[0]] == 1 { best = nums[0] }
              if count[nums[n - 1]] == 1 { best = max(best, nums[n - 1]) }
              return best
          }
        `,
        rust: code`
          fn largestInteger(nums: Vec<i32>, k: i32) -> i32 {
              let n = nums.len();
              let mut count = [0; 51];
              let mut mx = -1;
              for &v in &nums {
                  count[v as usize] += 1;
                  mx = mx.max(v);
              }
              if k as usize == n { return mx; }
              let mut best = -1;
              if k == 1 {
                  for v in 0..=50 { if count[v] == 1 { best = v as i32; } }
                  return best;
              }
              if count[nums[0] as usize] == 1 { best = nums[0]; }
              if count[nums[n - 1] as usize] == 1 { best = best.max(nums[n - 1]); }
              best
          }
        `,
        php: code`
          function largestInteger($nums, $k) {
              $n = count($nums);
              if ($k == $n) return max($nums);
              $cnt = array_count_values($nums);
              $best = -1;
              if ($k == 1) {
                  foreach ($cnt as $v => $c) if ($c == 1 && $v > $best) $best = $v;
                  return $best;
              }
              if ($cnt[$nums[0]] == 1) $best = $nums[0];
              if ($cnt[$nums[$n - 1]] == 1) $best = max($best, $nums[$n - 1]);
              return $best;
          }
        `,
        ruby: code`
          def largestInteger(nums, k)
            n = nums.length
            return nums.max if k == n
            count = Hash.new(0)
            nums.each { |v| count[v] += 1 }
            if k == 1
              once = count.select { |_, c| c == 1 }.keys
              return once.empty? ? -1 : once.max
            end
            best = -1
            best = nums[0] if count[nums[0]] == 1
            best = [best, nums[-1]].max if count[nums[-1]] == 1
            best
          end
        `,
      },
    };
  })(),

  // ── Closest Equal Element Queries (LC 3488) ─────────────────────
  (() => {
    const ref = (nums: number[], queries: number[]) => {
      const n = nums.length;
      return queries.map((q) => {
        let best = -1;
        for (let j = 0; j < n; j++) {
          if (j === q || nums[j] !== nums[q]) continue;
          const d = Math.abs(j - q);
          const cd = Math.min(d, n - d);
          if (best < 0 || cd < best) best = cd;
        }
        return best;
      });
    };
    return {
      slug: "closest-equal-element-queries",
      title: "Closest Equal Element Queries",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Binary Search", "Amazon", "Google"],
      signature: {
        funcName: "solveQueries",
        params: [{ name: "nums", type: "int[]" as const }, { name: "queries", type: "int[]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "You are given a **circular** array `nums` (the element after the last one is the first one) and an array `queries` of indices into it.\n\n" +
        "For each query index `i`, find the minimum distance from `i` to any **other** index `j` with `nums[j] == nums[i]`. Distances are measured around the circle: between `i` and `j` it is `min(|i - j|, n - |i - j|)`. If no other index holds the same value, the answer is `-1`.\n\n" +
        "Return the answers in the order of `queries`.",
        [
          { in: "nums = [5,2,5,7,2,5], queries = [0,3,4]", out: "[1,-1,3]", note: "Index 0 reaches the `5` at index 5 by wrapping around (distance 1). `7` occurs once. The other `2` is 3 steps away either way." },
          { in: "nums = [1,2,3,4], queries = [0,1,2,3]", out: "[-1,-1,-1,-1]", note: "Every value is unique." },
          { in: "nums = [8,8], queries = [1]", out: "[1]" },
        ],
        ["1 <= queries.length <= nums.length <= 10^5", "1 <= nums[i] <= 10^6", "0 <= queries[i] < nums.length"]),
      hints: [
        "Group the indices by value. Inside one group, which other index can be closest to a given index on the circle?",
        "Sort each group's indices. The closest equal element is always one of the two neighbours in that sorted list — treating the list itself as circular, so the first and last indices are neighbours too.",
        "Precompute the answer for every index once (`-1` for groups of size 1), then answer each query by lookup.",
      ],
      editorial: explain({
        idea: "On a circle, the nearest index holding the same value is the next or previous occurrence of that value going around. Listing each value's indices in increasing order makes those two occurrences neighbours in the list, with wrap-around.",
        steps: [
          "Collect, for each value, the list of indices where it occurs (in increasing order).",
          "For a list of size 1, its index answers `-1`.",
          "For a list `idx` of size `m >= 2`, each `idx[t]` answers the smaller circular distance to `idx[t - 1]` and `idx[t + 1]`, indices taken modulo `m`.",
          "Return `answer[queries[k]]` for each query.",
        ],
        why: "Walking clockwise from `i`, the first equal value met is the next occurrence in sorted order (or the first one, after wrapping). Walking counter-clockwise it is the previous occurrence. The circular distance to any other occurrence is at least the walk to one of these two, because reaching it requires passing one of them first in the direction of the shorter arc.",
        time: "O(n log n) with sorting, or O(n) with a hash map filled left to right",
        space: "O(n)",
        pitfalls: [
          "Forgetting the wrap-around neighbour: the first and last occurrences can be adjacent across the end of the array.",
          "The distance itself is also circular: take `min(d, n - d)`.",
          "Answering each query by scanning the array is `O(n * q)` — too slow at `10^5`.",
        ],
      }),
      examples: [
        { input: "[5,2,5,7,2,5]\n[0,3,4]", expectedOutput: "[1,-1,3]" },
        { input: "[1,2,3,4]\n[0,1,2,3]", expectedOutput: "[-1,-1,-1,-1]" },
        { input: "[8,8]\n[1]", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 12, 40]));
        const top = pick(rng, [2, 4, 10, 1000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const qn = ri(rng, 1, n);
        const queries = Array.from({ length: qn }, () => ri(rng, 0, n - 1));
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(queries)}`, expectedOutput: fmtIntArr(ref(nums, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def solveQueries(nums: List[int], queries: List[int]) -> List[int]:
              n = len(nums)
              groups = {}
              for i, v in enumerate(nums):
                  groups.setdefault(v, []).append(i)
              best = [-1] * n
              for idx in groups.values():
                  m = len(idx)
                  if m < 2:
                      continue
                  for t in range(m):
                      i = idx[t]
                      for j in (idx[t - 1], idx[(t + 1) % m]):
                          d = abs(i - j)
                          d = min(d, n - d)
                          if best[i] < 0 or d < best[i]:
                              best[i] = d
              return [best[q] for q in queries]
        `,
        javascript: code`
          var solveQueries = function(nums, queries) {
              var n = nums.length;
              var groups = new Map();
              for (var i = 0; i < n; i++) {
                  var g = groups.get(nums[i]);
                  if (!g) { g = []; groups.set(nums[i], g); }
                  g.push(i);
              }
              var best = new Array(n).fill(-1);
              groups.forEach(function(idx) {
                  var m = idx.length;
                  if (m < 2) return;
                  for (var t = 0; t < m; t++) {
                      var a = idx[t];
                      var nb = [idx[(t - 1 + m) % m], idx[(t + 1) % m]];
                      for (var k = 0; k < 2; k++) {
                          var d = Math.abs(a - nb[k]);
                          d = Math.min(d, n - d);
                          if (best[a] < 0 || d < best[a]) best[a] = d;
                      }
                  }
              });
              var out = [];
              for (var q = 0; q < queries.length; q++) out.push(best[queries[q]]);
              return out;
          };
        `,
        typescript: code`
          function solveQueries(nums: number[], queries: number[]): number[] {
              var n = nums.length;
              var groups: { [v: number]: number[] } = {};
              var keys: number[] = [];
              for (var i = 0; i < n; i++) {
                  if (!groups[nums[i]]) { groups[nums[i]] = []; keys.push(nums[i]); }
                  groups[nums[i]].push(i);
              }
              var best: number[] = [];
              for (var z = 0; z < n; z++) best.push(-1);
              for (var g = 0; g < keys.length; g++) {
                  var idx = groups[keys[g]];
                  var m = idx.length;
                  if (m < 2) continue;
                  for (var t = 0; t < m; t++) {
                      var a = idx[t];
                      var nb = [idx[(t - 1 + m) % m], idx[(t + 1) % m]];
                      for (var k = 0; k < 2; k++) {
                          var d = Math.abs(a - nb[k]);
                          d = Math.min(d, n - d);
                          if (best[a] < 0 || d < best[a]) best[a] = d;
                      }
                  }
              }
              var out: number[] = [];
              for (var q = 0; q < queries.length; q++) out.push(best[queries[q]]);
              return out;
          }
        `,
        java: code`
          public static int[] solveQueries(int[] nums, int[] queries) {
              int n = nums.length;
              Map<Integer, List<Integer>> groups = new HashMap<>();
              for (int i = 0; i < n; i++) groups.computeIfAbsent(nums[i], x -> new ArrayList<>()).add(i);
              int[] best = new int[n];
              Arrays.fill(best, -1);
              for (List<Integer> idx : groups.values()) {
                  int m = idx.size();
                  if (m < 2) continue;
                  for (int t = 0; t < m; t++) {
                      int a = idx.get(t);
                      int[] nb = { idx.get((t - 1 + m) % m), idx.get((t + 1) % m) };
                      for (int j : nb) {
                          int d = Math.abs(a - j);
                          d = Math.min(d, n - d);
                          if (best[a] < 0 || d < best[a]) best[a] = d;
                      }
                  }
              }
              int[] out = new int[queries.length];
              for (int q = 0; q < queries.length; q++) out[q] = best[queries[q]];
              return out;
          }
        `,
        cpp: code`
          vector<int> solveQueries(vector<int>& nums, vector<int>& queries) {
              int n = nums.size();
              unordered_map<int, vector<int>> groups;
              for (int i = 0; i < n; i++) groups[nums[i]].push_back(i);
              vector<int> best(n, -1);
              for (auto& kv : groups) {
                  vector<int>& idx = kv.second;
                  int m = idx.size();
                  if (m < 2) continue;
                  for (int t = 0; t < m; t++) {
                      int a = idx[t];
                      int nb[2] = { idx[(t - 1 + m) % m], idx[(t + 1) % m] };
                      for (int j : nb) {
                          int d = abs(a - j);
                          d = min(d, n - d);
                          if (best[a] < 0 || d < best[a]) best[a] = d;
                      }
                  }
              }
              vector<int> out;
              for (int q : queries) out.push_back(best[q]);
              return out;
          }
        `,
        c: code`
          static int cmpLL(const void* a, const void* b) {
              long long x = *(const long long*)a, y = *(const long long*)b;
              return x < y ? -1 : (x > y ? 1 : 0);
          }

          int* solveQueries(int* nums, int numsSize, int* queries, int queriesSize, int* returnSize) {
              int n = numsSize;
              // Indices ordered by (value, index), packed as value * 2^17 + index.
              long long* order = (long long*)malloc(sizeof(long long) * n);
              for (int i = 0; i < n; i++) order[i] = (long long)nums[i] * 131072 + i;
              qsort(order, n, sizeof(long long), cmpLL);
              int* best = (int*)malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) best[i] = -1;
              int start = 0;
              while (start < n) {
                  int end = start;
                  while (end < n && order[end] / 131072 == order[start] / 131072) end++;
                  int m = end - start;
                  if (m >= 2) {
                      for (int t = 0; t < m; t++) {
                          int a = (int)(order[start + t] % 131072);
                          int nb[2];
                          nb[0] = (int)(order[start + (t - 1 + m) % m] % 131072);
                          nb[1] = (int)(order[start + (t + 1) % m] % 131072);
                          for (int k = 0; k < 2; k++) {
                              int d = a > nb[k] ? a - nb[k] : nb[k] - a;
                              if (n - d < d) d = n - d;
                              if (best[a] < 0 || d < best[a]) best[a] = d;
                          }
                      }
                  }
                  start = end;
              }
              int* out = (int*)malloc(sizeof(int) * (queriesSize > 0 ? queriesSize : 1));
              for (int q = 0; q < queriesSize; q++) out[q] = best[queries[q]];
              free(order);
              free(best);
              *returnSize = queriesSize;
              return out;
          }
        `,
        csharp: code`
          public static int[] SolveQueries(int[] nums, int[] queries)
          {
              int n = nums.Length;
              var groups = new Dictionary<int, List<int>>();
              for (int i = 0; i < n; i++)
              {
                  List<int> g;
                  if (!groups.TryGetValue(nums[i], out g)) { g = new List<int>(); groups[nums[i]] = g; }
                  g.Add(i);
              }
              int[] best = new int[n];
              for (int i = 0; i < n; i++) best[i] = -1;
              foreach (var idx in groups.Values)
              {
                  int m = idx.Count;
                  if (m < 2) continue;
                  for (int t = 0; t < m; t++)
                  {
                      int a = idx[t];
                      int[] nb = { idx[(t - 1 + m) % m], idx[(t + 1) % m] };
                      foreach (int j in nb)
                      {
                          int d = Math.Abs(a - j);
                          d = Math.Min(d, n - d);
                          if (best[a] < 0 || d < best[a]) best[a] = d;
                      }
                  }
              }
              int[] output = new int[queries.Length];
              for (int q = 0; q < queries.Length; q++) output[q] = best[queries[q]];
              return output;
          }
        `,
        go: code`
          func solveQueries(nums []int, queries []int) []int {
              n := len(nums)
              groups := map[int][]int{}
              for i, v := range nums {
                  groups[v] = append(groups[v], i)
              }
              best := make([]int, n)
              for i := range best {
                  best[i] = -1
              }
              for _, idx := range groups {
                  m := len(idx)
                  if m < 2 {
                      continue
                  }
                  for t := 0; t < m; t++ {
                      a := idx[t]
                      for _, j := range []int{idx[(t-1+m)%m], idx[(t+1)%m]} {
                          d := a - j
                          if d < 0 {
                              d = -d
                          }
                          if n-d < d {
                              d = n - d
                          }
                          if best[a] < 0 || d < best[a] {
                              best[a] = d
                          }
                      }
                  }
              }
              out := make([]int, len(queries))
              for q, qi := range queries {
                  out[q] = best[qi]
              }
              return out
          }
        `,
        kotlin: code`
          fun solveQueries(nums: IntArray, queries: IntArray): IntArray {
              val n = nums.size
              val groups = HashMap<Int, MutableList<Int>>()
              for (i in 0 until n) groups.getOrPut(nums[i]) { mutableListOf() }.add(i)
              val best = IntArray(n) { -1 }
              for (idx in groups.values) {
                  val m = idx.size
                  if (m < 2) continue
                  for (t in 0 until m) {
                      val a = idx[t]
                      for (j in intArrayOf(idx[(t - 1 + m) % m], idx[(t + 1) % m])) {
                          var d = Math.abs(a - j)
                          d = minOf(d, n - d)
                          if (best[a] < 0 || d < best[a]) best[a] = d
                      }
                  }
              }
              return IntArray(queries.size) { best[queries[it]] }
          }
        `,
        swift: code`
          func solveQueries(_ nums: [Int], _ queries: [Int]) -> [Int] {
              let n = nums.count
              var groups = [Int: [Int]]()
              for i in 0..<n { groups[nums[i], default: []].append(i) }
              var best = [Int](repeating: -1, count: n)
              for idx in groups.values {
                  let m = idx.count
                  if m < 2 { continue }
                  for t in 0..<m {
                      let a = idx[t]
                      for j in [idx[(t - 1 + m) % m], idx[(t + 1) % m]] {
                          var d = abs(a - j)
                          d = min(d, n - d)
                          if best[a] < 0 || d < best[a] { best[a] = d }
                      }
                  }
              }
              return queries.map { best[$0] }
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn solveQueries(nums: Vec<i32>, queries: Vec<i32>) -> Vec<i32> {
              let n = nums.len() as i32;
              let mut groups: HashMap<i32, Vec<i32>> = HashMap::new();
              for (i, &v) in nums.iter().enumerate() {
                  groups.entry(v).or_insert_with(Vec::new).push(i as i32);
              }
              let mut best = vec![-1i32; nums.len()];
              for idx in groups.values() {
                  let m = idx.len();
                  if m < 2 { continue; }
                  for t in 0..m {
                      let a = idx[t];
                      for &j in [idx[(t + m - 1) % m], idx[(t + 1) % m]].iter() {
                          let mut d = (a - j).abs();
                          d = d.min(n - d);
                          let b = &mut best[a as usize];
                          if *b < 0 || d < *b { *b = d; }
                      }
                  }
              }
              queries.iter().map(|&q| best[q as usize]).collect()
          }
        `,
        php: code`
          function solveQueries($nums, $queries) {
              $n = count($nums);
              $groups = [];
              foreach ($nums as $i => $v) $groups[$v][] = $i;
              $best = array_fill(0, $n, -1);
              foreach ($groups as $idx) {
                  $m = count($idx);
                  if ($m < 2) continue;
                  for ($t = 0; $t < $m; $t++) {
                      $a = $idx[$t];
                      foreach ([$idx[($t - 1 + $m) % $m], $idx[($t + 1) % $m]] as $j) {
                          $d = abs($a - $j);
                          $d = min($d, $n - $d);
                          if ($best[$a] < 0 || $d < $best[$a]) $best[$a] = $d;
                      }
                  }
              }
              $out = [];
              foreach ($queries as $q) $out[] = $best[$q];
              return $out;
          }
        `,
        ruby: code`
          def solveQueries(nums, queries)
            n = nums.length
            groups = Hash.new { |h, k| h[k] = [] }
            nums.each_with_index { |v, i| groups[v] << i }
            best = Array.new(n, -1)
            groups.each_value do |idx|
              m = idx.length
              next if m < 2
              (0...m).each do |t|
                a = idx[t]
                [idx[(t - 1) % m], idx[(t + 1) % m]].each do |j|
                  d = (a - j).abs
                  d = [d, n - d].min
                  best[a] = d if best[a] < 0 || d < best[a]
                end
              end
            end
            queries.map { |q| best[q] }
          end
        `,
      },
    };
  })(),

  // ── Count Covered Buildings (LC 3531) ───────────────────────────
  (() => {
    const ref = (n: number, buildings: number[][]) => {
      let c = 0;
      for (const [x, y] of buildings) {
        let l = false, r = false, u = false, d = false;
        for (const [a, b] of buildings) {
          if (a === x && b < y) l = true;
          if (a === x && b > y) r = true;
          if (b === y && a < x) u = true;
          if (b === y && a > x) d = true;
        }
        if (l && r && u && d) c++;
      }
      return c;
    };
    return {
      slug: "count-covered-buildings",
      title: "Count Covered Buildings",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sorting", "Google", "Amazon"],
      signature: {
        funcName: "countCoveredBuildings",
        params: [{ name: "n", type: "int" as const }, { name: "buildings", type: "int[][]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A city is an `n x n` grid. You are given the positions of its buildings as `buildings[i] = [x, y]`; no two buildings share a position.\n\n" +
        "A building is **covered** if there is at least one other building in each of the four directions from it:\n\n" +
        "- **left** and **right**: a building with the same `x` and a smaller / larger `y`;\n" +
        "- **above** and **below**: a building with the same `y` and a smaller / larger `x`.\n\n" +
        "Return the number of covered buildings.",
        [
          { in: "n = 4, buildings = [[2,2],[1,2],[4,2],[2,1],[2,4],[3,3]]", out: "1", note: "`[2,2]` has `[2,1]` and `[2,4]` beside it and `[1,2]` and `[4,2]` above and below it. No other building has neighbours on all four sides." },
          { in: "n = 3, buildings = [[1,1],[1,2],[2,1],[2,2]]", out: "0", note: "Every building sits on the edge of the block." },
          { in: "n = 4, buildings = [[1,2],[1,3],[2,1],[2,2],[2,3],[2,4],[3,1],[3,2],[3,3],[3,4],[4,2],[4,3]]", out: "4", note: "The four inner buildings `[2,2]`, `[2,3]`, `[3,2]`, `[3,3]` are covered." },
        ],
        [
          "2 <= n <= 10^5",
          "1 <= buildings.length <= 10^5",
          "buildings[i] = [x, y] with 1 <= x, y <= n",
          "All positions in buildings are unique",
        ]),
      hints: [
        "A building has something to its left and to its right exactly when its `y` is neither the smallest nor the largest `y` among buildings with the same `x`.",
        "Likewise for above and below, using the smallest and largest `x` among buildings with the same `y`.",
        "One pass records, for every `x`, the min and max `y`, and for every `y`, the min and max `x`. A second pass tests each building strictly between both pairs.",
      ],
      editorial: explain({
        idea: "Only the extremes of each row and column matter: a building has a neighbour on both sides of its line exactly when it is strictly inside that line's range of occupied positions.",
        steps: [
          "For each `x`, track `minY[x]` and `maxY[x]` over buildings with that `x`.",
          "For each `y`, track `minX[y]` and `maxX[y]` over buildings with that `y`.",
          "Count the buildings with `minY[x] < y < maxY[x]` and `minX[y] < x < maxX[y]`.",
        ],
        why: "A building with the same `x` and a smaller `y` exists iff the smallest `y` for that `x` is below this one, and similarly for the other three directions. The four strict inequalities are exactly the four directions of the definition.",
        time: "O(n + m) where m is the number of buildings",
        space: "O(n)",
        pitfalls: [
          "Checking all four directions by scanning every other building is `O(m^2)` — too slow at `10^5` buildings.",
          "The comparisons are strict: a building is not its own neighbour.",
        ],
      }),
      examples: [
        { input: "4\n[[2,2],[1,2],[4,2],[2,1],[2,4],[3,3]]", expectedOutput: "1" },
        { input: "3\n[[1,1],[1,2],[2,1],[2,2]]", expectedOutput: "0" },
        { input: "4\n[[1,2],[1,3],[2,1],[2,2],[2,3],[2,4],[3,1],[3,2],[3,3],[3,4],[4,2],[4,3]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 3, 5, 8]));
        const p = pick(rng, [0.2, 0.5, 0.8, 1]);
        let cells: number[][] = [];
        for (let x = 1; x <= n; x++) for (let y = 1; y <= n; y++) if (rng() < p) cells.push([x, y]);
        if (cells.length === 0) cells.push([ri(rng, 1, n), ri(rng, 1, n)]);
        cells = shuffle(rng, cells).slice(0, 40);
        return { input: `${n}\n${fmtIntMat(cells)}`, expectedOutput: String(ref(n, cells)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countCoveredBuildings(n: int, buildings: List[List[int]]) -> int:
              big = n + 1
              min_y = [big] * (n + 1)
              max_y = [0] * (n + 1)
              min_x = [big] * (n + 1)
              max_x = [0] * (n + 1)
              for x, y in buildings:
                  min_y[x] = min(min_y[x], y)
                  max_y[x] = max(max_y[x], y)
                  min_x[y] = min(min_x[y], x)
                  max_x[y] = max(max_x[y], x)
              return sum(1 for x, y in buildings
                         if min_y[x] < y < max_y[x] and min_x[y] < x < max_x[y])
        `,
        javascript: code`
          var countCoveredBuildings = function(n, buildings) {
              var minY = new Array(n + 1).fill(n + 1), maxY = new Array(n + 1).fill(0);
              var minX = new Array(n + 1).fill(n + 1), maxX = new Array(n + 1).fill(0);
              for (var i = 0; i < buildings.length; i++) {
                  var x = buildings[i][0], y = buildings[i][1];
                  if (y < minY[x]) minY[x] = y;
                  if (y > maxY[x]) maxY[x] = y;
                  if (x < minX[y]) minX[y] = x;
                  if (x > maxX[y]) maxX[y] = x;
              }
              var count = 0;
              for (var j = 0; j < buildings.length; j++) {
                  var a = buildings[j][0], b = buildings[j][1];
                  if (minY[a] < b && b < maxY[a] && minX[b] < a && a < maxX[b]) count++;
              }
              return count;
          };
        `,
        typescript: code`
          function countCoveredBuildings(n: number, buildings: number[][]): number {
              var minY: number[] = [], maxY: number[] = [], minX: number[] = [], maxX: number[] = [];
              for (var z = 0; z <= n; z++) { minY.push(n + 1); maxY.push(0); minX.push(n + 1); maxX.push(0); }
              for (var i = 0; i < buildings.length; i++) {
                  var x = buildings[i][0], y = buildings[i][1];
                  if (y < minY[x]) minY[x] = y;
                  if (y > maxY[x]) maxY[x] = y;
                  if (x < minX[y]) minX[y] = x;
                  if (x > maxX[y]) maxX[y] = x;
              }
              var count = 0;
              for (var j = 0; j < buildings.length; j++) {
                  var a = buildings[j][0], b = buildings[j][1];
                  if (minY[a] < b && b < maxY[a] && minX[b] < a && a < maxX[b]) count++;
              }
              return count;
          }
        `,
        java: code`
          public static int countCoveredBuildings(int n, int[][] buildings) {
              int[] minY = new int[n + 1], maxY = new int[n + 1], minX = new int[n + 1], maxX = new int[n + 1];
              Arrays.fill(minY, n + 1);
              Arrays.fill(minX, n + 1);
              for (int[] b : buildings) {
                  int x = b[0], y = b[1];
                  minY[x] = Math.min(minY[x], y);
                  maxY[x] = Math.max(maxY[x], y);
                  minX[y] = Math.min(minX[y], x);
                  maxX[y] = Math.max(maxX[y], x);
              }
              int count = 0;
              for (int[] b : buildings) {
                  int x = b[0], y = b[1];
                  if (minY[x] < y && y < maxY[x] && minX[y] < x && x < maxX[y]) count++;
              }
              return count;
          }
        `,
        cpp: code`
          int countCoveredBuildings(int n, vector<vector<int>>& buildings) {
              vector<int> minY(n + 1, n + 1), maxY(n + 1, 0), minX(n + 1, n + 1), maxX(n + 1, 0);
              for (auto& b : buildings) {
                  int x = b[0], y = b[1];
                  minY[x] = min(minY[x], y);
                  maxY[x] = max(maxY[x], y);
                  minX[y] = min(minX[y], x);
                  maxX[y] = max(maxX[y], x);
              }
              int count = 0;
              for (auto& b : buildings) {
                  int x = b[0], y = b[1];
                  if (minY[x] < y && y < maxY[x] && minX[y] < x && x < maxX[y]) count++;
              }
              return count;
          }
        `,
        c: code`
          int countCoveredBuildings(int n, int** buildings, int buildingsSize, int* buildingsColSize) {
              int* minY = (int*)malloc(sizeof(int) * (n + 1));
              int* maxY = (int*)malloc(sizeof(int) * (n + 1));
              int* minX = (int*)malloc(sizeof(int) * (n + 1));
              int* maxX = (int*)malloc(sizeof(int) * (n + 1));
              for (int i = 0; i <= n; i++) {
                  minY[i] = n + 1; maxY[i] = 0;
                  minX[i] = n + 1; maxX[i] = 0;
              }
              for (int i = 0; i < buildingsSize; i++) {
                  int x = buildings[i][0], y = buildings[i][1];
                  if (y < minY[x]) minY[x] = y;
                  if (y > maxY[x]) maxY[x] = y;
                  if (x < minX[y]) minX[y] = x;
                  if (x > maxX[y]) maxX[y] = x;
              }
              int count = 0;
              for (int i = 0; i < buildingsSize; i++) {
                  int x = buildings[i][0], y = buildings[i][1];
                  if (minY[x] < y && y < maxY[x] && minX[y] < x && x < maxX[y]) count++;
              }
              free(minY); free(maxY); free(minX); free(maxX);
              return count;
          }
        `,
        csharp: code`
          public static int CountCoveredBuildings(int n, int[][] buildings)
          {
              int[] minY = new int[n + 1], maxY = new int[n + 1], minX = new int[n + 1], maxX = new int[n + 1];
              for (int i = 0; i <= n; i++) { minY[i] = n + 1; minX[i] = n + 1; }
              foreach (int[] b in buildings)
              {
                  int x = b[0], y = b[1];
                  minY[x] = Math.Min(minY[x], y);
                  maxY[x] = Math.Max(maxY[x], y);
                  minX[y] = Math.Min(minX[y], x);
                  maxX[y] = Math.Max(maxX[y], x);
              }
              int count = 0;
              foreach (int[] b in buildings)
              {
                  int x = b[0], y = b[1];
                  if (minY[x] < y && y < maxY[x] && minX[y] < x && x < maxX[y]) count++;
              }
              return count;
          }
        `,
        go: code`
          func countCoveredBuildings(n int, buildings [][]int) int {
              minY, maxY := make([]int, n+1), make([]int, n+1)
              minX, maxX := make([]int, n+1), make([]int, n+1)
              for i := 0; i <= n; i++ {
                  minY[i], minX[i] = n+1, n+1
              }
              for _, b := range buildings {
                  x, y := b[0], b[1]
                  if y < minY[x] {
                      minY[x] = y
                  }
                  if y > maxY[x] {
                      maxY[x] = y
                  }
                  if x < minX[y] {
                      minX[y] = x
                  }
                  if x > maxX[y] {
                      maxX[y] = x
                  }
              }
              count := 0
              for _, b := range buildings {
                  x, y := b[0], b[1]
                  if minY[x] < y && y < maxY[x] && minX[y] < x && x < maxX[y] {
                      count++
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun countCoveredBuildings(n: Int, buildings: Array<IntArray>): Int {
              val minY = IntArray(n + 1) { n + 1 }
              val maxY = IntArray(n + 1)
              val minX = IntArray(n + 1) { n + 1 }
              val maxX = IntArray(n + 1)
              for (b in buildings) {
                  val x = b[0]
                  val y = b[1]
                  minY[x] = minOf(minY[x], y)
                  maxY[x] = maxOf(maxY[x], y)
                  minX[y] = minOf(minX[y], x)
                  maxX[y] = maxOf(maxX[y], x)
              }
              var count = 0
              for (b in buildings) {
                  val x = b[0]
                  val y = b[1]
                  if (minY[x] < y && y < maxY[x] && minX[y] < x && x < maxX[y]) count++
              }
              return count
          }
        `,
        swift: code`
          func countCoveredBuildings(_ n: Int, _ buildings: [[Int]]) -> Int {
              var minY = [Int](repeating: n + 1, count: n + 1), maxY = [Int](repeating: 0, count: n + 1)
              var minX = [Int](repeating: n + 1, count: n + 1), maxX = [Int](repeating: 0, count: n + 1)
              for b in buildings {
                  let x = b[0], y = b[1]
                  minY[x] = min(minY[x], y)
                  maxY[x] = max(maxY[x], y)
                  minX[y] = min(minX[y], x)
                  maxX[y] = max(maxX[y], x)
              }
              var count = 0
              for b in buildings {
                  let x = b[0], y = b[1]
                  if minY[x] < y && y < maxY[x] && minX[y] < x && x < maxX[y] { count += 1 }
              }
              return count
          }
        `,
        rust: code`
          fn countCoveredBuildings(n: i32, buildings: Vec<Vec<i32>>) -> i32 {
              let m = (n + 1) as usize;
              let (mut min_y, mut max_y) = (vec![n + 1; m], vec![0; m]);
              let (mut min_x, mut max_x) = (vec![n + 1; m], vec![0; m]);
              for b in &buildings {
                  let (x, y) = (b[0], b[1]);
                  let (xi, yi) = (x as usize, y as usize);
                  min_y[xi] = min_y[xi].min(y);
                  max_y[xi] = max_y[xi].max(y);
                  min_x[yi] = min_x[yi].min(x);
                  max_x[yi] = max_x[yi].max(x);
              }
              let mut count = 0;
              for b in &buildings {
                  let (x, y) = (b[0], b[1]);
                  let (xi, yi) = (x as usize, y as usize);
                  if min_y[xi] < y && y < max_y[xi] && min_x[yi] < x && x < max_x[yi] { count += 1; }
              }
              count
          }
        `,
        php: code`
          function countCoveredBuildings($n, $buildings) {
              $minY = array_fill(0, $n + 1, $n + 1);
              $maxY = array_fill(0, $n + 1, 0);
              $minX = array_fill(0, $n + 1, $n + 1);
              $maxX = array_fill(0, $n + 1, 0);
              foreach ($buildings as $b) {
                  [$x, $y] = $b;
                  if ($y < $minY[$x]) $minY[$x] = $y;
                  if ($y > $maxY[$x]) $maxY[$x] = $y;
                  if ($x < $minX[$y]) $minX[$y] = $x;
                  if ($x > $maxX[$y]) $maxX[$y] = $x;
              }
              $count = 0;
              foreach ($buildings as $b) {
                  [$x, $y] = $b;
                  if ($minY[$x] < $y && $y < $maxY[$x] && $minX[$y] < $x && $x < $maxX[$y]) $count++;
              }
              return $count;
          }
        `,
        ruby: code`
          def countCoveredBuildings(n, buildings)
            min_y = Array.new(n + 1, n + 1)
            max_y = Array.new(n + 1, 0)
            min_x = Array.new(n + 1, n + 1)
            max_x = Array.new(n + 1, 0)
            buildings.each do |x, y|
              min_y[x] = y if y < min_y[x]
              max_y[x] = y if y > max_y[x]
              min_x[y] = x if x < min_x[y]
              max_x[y] = x if x > max_x[y]
            end
            buildings.count { |x, y| min_y[x] < y && y < max_y[x] && min_x[y] < x && x < max_x[y] }
          end
        `,
      },
    };
  })(),

  // ── Find Most Frequent Vowel and Consonant (LC 3541) ────────────
  (() => {
    const ref = (s: string) => {
      const f: Record<string, number> = {};
      for (const c of s) f[c] = (f[c] || 0) + 1;
      let v = 0, c = 0;
      for (const k of Object.keys(f)) {
        if ("aeiou".indexOf(k) >= 0) v = Math.max(v, f[k]);
        else c = Math.max(c, f[k]);
      }
      return v + c;
    };
    return {
      slug: "find-most-frequent-vowel-and-consonant",
      title: "Find Most Frequent Vowel and Consonant",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Counting", "Amazon", "Google"],
      signature: { funcName: "maxFreqSum", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `s` of lowercase English letters. The vowels are `a`, `e`, `i`, `o` and `u`; every other letter is a consonant.\n\n" +
        "Find the highest frequency of any vowel in `s` and the highest frequency of any consonant in `s`, and return their **sum**. If `s` has no vowels (or no consonants), that part counts as `0`.",
        [
          { in: 's = "codekairo"', out: "3", note: "`o` is the most frequent vowel (2); every consonant occurs once. `2 + 1 = 3`." },
          { in: 's = "aeiaeia"', out: "3", note: "`a` occurs 3 times; there are no consonants, so that part is 0." },
          { in: 's = "rhythm"', out: "2", note: "No vowels; `h` occurs twice." },
        ],
        ["1 <= s.length <= 100", "s consists only of lowercase English letters"]),
      hints: [
        "Count all 26 letter frequencies in one pass.",
        "Then take the maximum over the five vowels and the maximum over the 21 consonants separately, starting each at 0.",
      ],
      editorial: explain({
        idea: "The two maxima are independent, so one frequency table and two separate maximum scans answer it.",
        steps: [
          "Count each letter's occurrences.",
          "`bestVowel` = largest count among `a, e, i, o, u` (0 if none occur).",
          "`bestConsonant` = largest count among the other letters (0 if none occur).",
          "Return `bestVowel + bestConsonant`.",
        ],
        why: "The answer is defined as the sum of two maxima over disjoint letter groups; computing each over the full frequency table gives exactly those values, with the absent-group case falling out as 0.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`y` is a consonant here.",
          "Add the two **frequencies**, not the number of distinct letters.",
        ],
      }),
      examples: [
        { input: '"codekairo"', expectedOutput: "3" },
        { input: '"aeiaeia"', expectedOutput: "3" },
        { input: '"rhythm"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["aeiou", "bcdfg", "aeb", "abcdefghijklmnopqrstuvwxyz", "ouxyz"]);
        const s = randLower(rng, 1, pick(rng, [1, 5, 30, 100]), alpha);
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def maxFreqSum(s: str) -> int:
              freq = [0] * 26
              for ch in s:
                  freq[ord(ch) - 97] += 1
              vowel = consonant = 0
              for i in range(26):
                  if chr(97 + i) in "aeiou":
                      vowel = max(vowel, freq[i])
                  else:
                      consonant = max(consonant, freq[i])
              return vowel + consonant
        `,
        javascript: code`
          var maxFreqSum = function(s) {
              var freq = new Array(26).fill(0);
              for (var i = 0; i < s.length; i++) freq[s.charCodeAt(i) - 97]++;
              var vowel = 0, consonant = 0;
              for (var c = 0; c < 26; c++) {
                  if ("aeiou".indexOf(String.fromCharCode(97 + c)) >= 0) vowel = Math.max(vowel, freq[c]);
                  else consonant = Math.max(consonant, freq[c]);
              }
              return vowel + consonant;
          };
        `,
        typescript: code`
          function maxFreqSum(s: string): number {
              var freq: number[] = [];
              for (var z = 0; z < 26; z++) freq.push(0);
              for (var i = 0; i < s.length; i++) freq[s.charCodeAt(i) - 97]++;
              var vowel = 0, consonant = 0;
              for (var c = 0; c < 26; c++) {
                  if ("aeiou".indexOf(String.fromCharCode(97 + c)) >= 0) vowel = Math.max(vowel, freq[c]);
                  else consonant = Math.max(consonant, freq[c]);
              }
              return vowel + consonant;
          }
        `,
        java: code`
          public static int maxFreqSum(String s) {
              int[] freq = new int[26];
              for (int i = 0; i < s.length(); i++) freq[s.charAt(i) - 'a']++;
              int vowel = 0, consonant = 0;
              for (int c = 0; c < 26; c++) {
                  if ("aeiou".indexOf('a' + c) >= 0) vowel = Math.max(vowel, freq[c]);
                  else consonant = Math.max(consonant, freq[c]);
              }
              return vowel + consonant;
          }
        `,
        cpp: code`
          int maxFreqSum(string s) {
              int freq[26] = {0};
              for (char c : s) freq[c - 'a']++;
              int vowel = 0, consonant = 0;
              string vowels = "aeiou";
              for (int c = 0; c < 26; c++) {
                  if (vowels.find((char)('a' + c)) != string::npos) vowel = max(vowel, freq[c]);
                  else consonant = max(consonant, freq[c]);
              }
              return vowel + consonant;
          }
        `,
        c: code`
          int maxFreqSum(const char* s) {
              int freq[26] = {0};
              for (int i = 0; s[i]; i++) freq[s[i] - 'a']++;
              int vowel = 0, consonant = 0;
              for (int c = 0; c < 26; c++) {
                  char ch = (char)('a' + c);
                  bool isVowel = ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u';
                  if (isVowel) { if (freq[c] > vowel) vowel = freq[c]; }
                  else if (freq[c] > consonant) consonant = freq[c];
              }
              return vowel + consonant;
          }
        `,
        csharp: code`
          public static int MaxFreqSum(string s)
          {
              int[] freq = new int[26];
              foreach (char c in s) freq[c - 'a']++;
              int vowel = 0, consonant = 0;
              for (int c = 0; c < 26; c++)
              {
                  if ("aeiou".IndexOf((char)('a' + c)) >= 0) vowel = Math.Max(vowel, freq[c]);
                  else consonant = Math.Max(consonant, freq[c]);
              }
              return vowel + consonant;
          }
        `,
        go: code`
          func maxFreqSum(s string) int {
              freq := make([]int, 26)
              for i := 0; i < len(s); i++ {
                  freq[s[i]-'a']++
              }
              vowel, consonant := 0, 0
              for c := 0; c < 26; c++ {
                  ch := byte('a' + c)
                  if ch == 'a' || ch == 'e' || ch == 'i' || ch == 'o' || ch == 'u' {
                      if freq[c] > vowel {
                          vowel = freq[c]
                      }
                  } else if freq[c] > consonant {
                      consonant = freq[c]
                  }
              }
              return vowel + consonant
          }
        `,
        kotlin: code`
          fun maxFreqSum(s: String): Int {
              val freq = IntArray(26)
              for (c in s) freq[c - 'a']++
              var vowel = 0
              var consonant = 0
              for (c in 0 until 26) {
                  if (('a' + c) in "aeiou") vowel = maxOf(vowel, freq[c])
                  else consonant = maxOf(consonant, freq[c])
              }
              return vowel + consonant
          }
        `,
        swift: code`
          func maxFreqSum(_ s: String) -> Int {
              var freq = [Int](repeating: 0, count: 26)
              for c in s.utf8 { freq[Int(c) - 97] += 1 }
              let vowels: Set<Int> = [0, 4, 8, 14, 20]
              var vowel = 0, consonant = 0
              for c in 0..<26 {
                  if vowels.contains(c) { vowel = max(vowel, freq[c]) }
                  else { consonant = max(consonant, freq[c]) }
              }
              return vowel + consonant
          }
        `,
        rust: code`
          fn maxFreqSum(s: String) -> i32 {
              let mut freq = [0i32; 26];
              for c in s.bytes() { freq[(c - b'a') as usize] += 1; }
              let (mut vowel, mut consonant) = (0, 0);
              for c in 0..26 {
                  if b"aeiou".contains(&(b'a' + c as u8)) { vowel = vowel.max(freq[c]); }
                  else { consonant = consonant.max(freq[c]); }
              }
              vowel + consonant
          }
        `,
        php: code`
          function maxFreqSum($s) {
              $vowel = 0;
              $consonant = 0;
              foreach (count_chars($s, 1) as $code => $f) {
                  if (strpos("aeiou", chr($code)) !== false) $vowel = max($vowel, $f);
                  else $consonant = max($consonant, $f);
              }
              return $vowel + $consonant;
          }
        `,
        ruby: code`
          def maxFreqSum(s)
            count = Hash.new(0)
            s.each_char { |c| count[c] += 1 }
            vowel = 0
            consonant = 0
            count.each do |c, f|
              if "aeiou".include?(c)
                vowel = f if f > vowel
              elsif f > consonant
                consonant = f
              end
            end
            vowel + consonant
          end
        `,
      },
    };
  })(),

  // ── Count Special Triplets (LC 3583) ────────────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (nums: number[]) => {
      // For each middle j, count matching values on each side directly.
      let total = 0;
      for (let j = 0; j < nums.length; j++) {
        const t = nums[j] * 2;
        let l = 0, r = 0;
        for (let i = 0; i < j; i++) if (nums[i] === t) l++;
        for (let k = j + 1; k < nums.length; k++) if (nums[k] === t) r++;
        total = (total + l * r) % MOD;
      }
      return total;
    };
    return {
      slug: "count-special-triplets",
      title: "Count Special Triplets",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Counting", "Amazon", "Google"],
      signature: { funcName: "specialTriplets", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums`.\n\n" +
        "A **special triplet** is a triple of indices `(i, j, k)` with `0 <= i < j < k < n` such that `nums[i] == nums[j] * 2` and `nums[k] == nums[j] * 2`.\n\n" +
        "Return the number of special triplets. Since it can be very large, return it **modulo** `10^9 + 7`.",
        [
          { in: "nums = [4,2,4,2,4]", out: "4", note: "With the `2` at index 1: one `4` before it and two after (2 triplets). With the `2` at index 3: two `4`s before and one after (2 more)." },
          { in: "nums = [0,0,0,0]", out: "4", note: "`0 * 2 = 0`: middle index 1 gives `1 * 2`, middle index 2 gives `2 * 1`." },
          { in: "nums = [1,2,3]", out: "0" },
        ],
        ["3 <= nums.length <= 10^5", "0 <= nums[i] <= 10^5"]),
      hints: [
        "Fix the middle index `j`. The outer indices are independent: any `i < j` holding `2 * nums[j]` pairs with any `k > j` holding the same value.",
        "So the middle contributes `left[2 * nums[j]] * right[2 * nums[j]]`, where `left` counts values before `j` and `right` counts values after it.",
        "Start with `right` = counts of the whole array; while sweeping `j` left to right, remove `nums[j]` from `right` before using it and add it to `left` afterwards. The product can exceed 32 bits — use 64-bit arithmetic before taking the modulus.",
      ],
      editorial: explain({
        idea: "Count by the middle element. For a fixed `j`, the number of valid outer pairs is the product of how many times `2 * nums[j]` appears to the left and to the right, and both counts can be maintained in one sweep.",
        steps: [
          "Build `right`, the frequency of every value in `nums`, and an empty `left`.",
          "For each `j` from left to right: decrement `right[nums[j]]` (so `right` covers indices after `j`).",
          "Let `t = 2 * nums[j]`; add `left[t] * right[t]` to the answer, modulo `10^9 + 7`.",
          "Increment `left[nums[j]]`.",
        ],
        why: "Every special triplet has exactly one middle index, and for that `j` the pair `(i, k)` is any choice of an index before `j` and an index after `j` that both hold `t`. The number of such choices is `left[t] * right[t]`, and the sweep keeps `left` and `right` equal to the counts strictly before and strictly after `j`.",
        time: "O(n)",
        space: "O(V) for the counts",
        pitfalls: [
          "Zeros satisfy `0 == 0 * 2`: the middle itself must not be counted on either side, which is why `right` is decremented before the lookup and `left` incremented after.",
          "`left[t] * right[t]` can reach about `2.5 * 10^9`, which overflows a 32-bit integer.",
          "`2 * nums[j]` can exceed the largest value present — guard the lookup.",
        ],
      }),
      examples: [
        { input: "[4,2,4,2,4]", expectedOutput: "4" },
        { input: "[0,0,0,0]", expectedOutput: "4" },
        { input: "[1,2,3]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const big = rng() < 0.01;
        const n = big ? ri(rng, 1500, 2500) : ri(rng, 3, pick(rng, [3, 6, 20, 60]));
        const pool = pick(rng, [[0], [0, 1, 2], [1, 2, 4], [3, 6, 12], [50000, 100000], [0, 1, 2, 4, 8]]);
        const wild = !big && rng() < 0.2;
        const nums = Array.from({ length: n }, () => (wild ? ri(rng, 0, 100000) : pick(rng, pool)));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def specialTriplets(nums: List[int]) -> int:
              MOD = 10**9 + 7
              right = {}
              for v in nums:
                  right[v] = right.get(v, 0) + 1
              left = {}
              ans = 0
              for v in nums:
                  right[v] -= 1
                  t = v * 2
                  ans = (ans + left.get(t, 0) * right.get(t, 0)) % MOD
                  left[v] = left.get(v, 0) + 1
              return ans
        `,
        javascript: code`
          var specialTriplets = function(nums) {
              var MOD = 1000000007;
              var right = new Map(), left = new Map();
              for (var i = 0; i < nums.length; i++) right.set(nums[i], (right.get(nums[i]) || 0) + 1);
              var ans = 0;
              for (var j = 0; j < nums.length; j++) {
                  var v = nums[j];
                  right.set(v, right.get(v) - 1);
                  var t = v * 2;
                  // Both counts are at most 1e5, so the product stays below 2^53.
                  ans = (ans + ((left.get(t) || 0) * (right.get(t) || 0)) % MOD) % MOD;
                  left.set(v, (left.get(v) || 0) + 1);
              }
              return ans;
          };
        `,
        typescript: code`
          function specialTriplets(nums: number[]): number {
              var MOD = 1000000007;
              var right: { [v: number]: number } = {}, left: { [v: number]: number } = {};
              for (var i = 0; i < nums.length; i++) right[nums[i]] = (right[nums[i]] || 0) + 1;
              var ans = 0;
              for (var j = 0; j < nums.length; j++) {
                  var v = nums[j];
                  right[v]--;
                  var t = v * 2;
                  // Both counts are at most 1e5, so the product stays below 2^53.
                  ans = (ans + ((left[t] || 0) * (right[t] || 0)) % MOD) % MOD;
                  left[v] = (left[v] || 0) + 1;
              }
              return ans;
          }
        `,
        java: code`
          public static int specialTriplets(int[] nums) {
              final long MOD = 1_000_000_007L;
              int mx = 0;
              for (int v : nums) mx = Math.max(mx, v);
              int[] left = new int[mx + 1], right = new int[mx + 1];
              for (int v : nums) right[v]++;
              long ans = 0;
              for (int v : nums) {
                  right[v]--;
                  int t = v * 2;
                  if (t <= mx) ans = (ans + (long) left[t] * right[t]) % MOD;
                  left[v]++;
              }
              return (int) ans;
          }
        `,
        cpp: code`
          int specialTriplets(vector<int>& nums) {
              const long long MOD = 1000000007LL;
              int mx = 0;
              for (int v : nums) mx = max(mx, v);
              vector<int> left(mx + 1, 0), right(mx + 1, 0);
              for (int v : nums) right[v]++;
              long long ans = 0;
              for (int v : nums) {
                  right[v]--;
                  int t = v * 2;
                  if (t <= mx) ans = (ans + (long long)left[t] * right[t]) % MOD;
                  left[v]++;
              }
              return (int)ans;
          }
        `,
        c: code`
          int specialTriplets(int* nums, int numsSize) {
              const long long MOD = 1000000007LL;
              int mx = 0;
              for (int i = 0; i < numsSize; i++) if (nums[i] > mx) mx = nums[i];
              int* left = (int*)calloc(mx + 1, sizeof(int));
              int* right = (int*)calloc(mx + 1, sizeof(int));
              for (int i = 0; i < numsSize; i++) right[nums[i]]++;
              long long ans = 0;
              for (int i = 0; i < numsSize; i++) {
                  int v = nums[i];
                  right[v]--;
                  int t = v * 2;
                  if (t <= mx) ans = (ans + (long long)left[t] * right[t]) % MOD;
                  left[v]++;
              }
              free(left);
              free(right);
              return (int)ans;
          }
        `,
        csharp: code`
          public static int SpecialTriplets(int[] nums)
          {
              const long MOD = 1000000007L;
              int mx = 0;
              foreach (int v in nums) mx = Math.Max(mx, v);
              int[] left = new int[mx + 1], right = new int[mx + 1];
              foreach (int v in nums) right[v]++;
              long ans = 0;
              foreach (int v in nums)
              {
                  right[v]--;
                  int t = v * 2;
                  if (t <= mx) ans = (ans + (long)left[t] * right[t]) % MOD;
                  left[v]++;
              }
              return (int)ans;
          }
        `,
        go: code`
          func specialTriplets(nums []int) int {
              const MOD = 1000000007
              mx := 0
              for _, v := range nums {
                  if v > mx {
                      mx = v
                  }
              }
              left, right := make([]int, mx+1), make([]int, mx+1)
              for _, v := range nums {
                  right[v]++
              }
              ans := 0
              for _, v := range nums {
                  right[v]--
                  t := v * 2
                  if t <= mx {
                      ans = (ans + left[t]*right[t]) % MOD
                  }
                  left[v]++
              }
              return ans
          }
        `,
        kotlin: code`
          fun specialTriplets(nums: IntArray): Int {
              val MOD = 1_000_000_007L
              var mx = 0
              for (v in nums) if (v > mx) mx = v
              val left = IntArray(mx + 1)
              val right = IntArray(mx + 1)
              for (v in nums) right[v]++
              var ans = 0L
              for (v in nums) {
                  right[v]--
                  val t = v * 2
                  if (t <= mx) ans = (ans + left[t].toLong() * right[t]) % MOD
                  left[v]++
              }
              return ans.toInt()
          }
        `,
        swift: code`
          func specialTriplets(_ nums: [Int]) -> Int {
              let MOD = 1_000_000_007
              let mx = nums.max() ?? 0
              var left = [Int](repeating: 0, count: mx + 1)
              var right = [Int](repeating: 0, count: mx + 1)
              for v in nums { right[v] += 1 }
              var ans = 0
              for v in nums {
                  right[v] -= 1
                  let t = v * 2
                  if t <= mx { ans = (ans + left[t] * right[t]) % MOD }
                  left[v] += 1
              }
              return ans
          }
        `,
        rust: code`
          fn specialTriplets(nums: Vec<i32>) -> i32 {
              const MOD: i64 = 1_000_000_007;
              let mx = *nums.iter().max().unwrap_or(&0) as usize;
              let mut left = vec![0i64; mx + 1];
              let mut right = vec![0i64; mx + 1];
              for &v in &nums { right[v as usize] += 1; }
              let mut ans: i64 = 0;
              for &v in &nums {
                  right[v as usize] -= 1;
                  let t = (v as usize) * 2;
                  if t <= mx { ans = (ans + left[t] * right[t]) % MOD; }
                  left[v as usize] += 1;
              }
              ans as i32
          }
        `,
        php: code`
          function specialTriplets($nums) {
              $MOD = 1000000007;
              $right = array_count_values($nums);
              $left = [];
              $ans = 0;
              foreach ($nums as $v) {
                  $right[$v]--;
                  $t = $v * 2;
                  $ans = ($ans + ($left[$t] ?? 0) * ($right[$t] ?? 0)) % $MOD;
                  $left[$v] = ($left[$v] ?? 0) + 1;
              }
              return $ans;
          }
        `,
        ruby: code`
          def specialTriplets(nums)
            mod = 1_000_000_007
            right = Hash.new(0)
            nums.each { |v| right[v] += 1 }
            left = Hash.new(0)
            ans = 0
            nums.each do |v|
              right[v] -= 1
              t = v * 2
              ans = (ans + left[t] * right[t]) % mod
              left[v] += 1
            end
            ans
          end
        `,
      },
    };
  })(),

  // ── Check if Any Element Has Prime Frequency (LC 3591) ──────────
  (() => {
    const isPrime = (x: number) => {
      if (x < 2) return false;
      for (let d = 2; d * d <= x; d++) if (x % d === 0) return false;
      return true;
    };
    const ref = (nums: number[]) => {
      const f: Record<number, number> = {};
      for (const v of nums) f[v] = (f[v] || 0) + 1;
      return Object.values(f).some(isPrime);
    };
    return {
      slug: "check-if-any-element-has-prime-frequency",
      title: "Check if Any Element Has Prime Frequency",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Math", "Counting", "Number Theory", "Amazon"],
      signature: { funcName: "checkPrimeFrequency", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "You are given an integer array `nums`.\n\n" +
        "Return `true` if the number of occurrences of **some** element of `nums` is a prime number, and `false` otherwise.\n\n" +
        "A prime number is a natural number greater than 1 whose only divisors are 1 and itself.",
        [
          { in: "nums = [7,3,7,9,7]", out: "true", note: "`7` occurs 3 times, and 3 is prime." },
          { in: "nums = [1,2,3,4]", out: "false", note: "Every element occurs once, and 1 is not prime." },
          { in: "nums = [6,6,6,6]", out: "false", note: "`6` occurs 4 times, and 4 is not prime." },
        ],
        ["1 <= nums.length <= 100", "0 <= nums[i] <= 100"]),
      hints: [
        "Count how many times each value occurs.",
        "Test each count for primality by trial division up to its square root — counts are at most 100.",
      ],
      editorial: explain({
        idea: "Build the frequency table, then ask whether any frequency is prime.",
        steps: [
          "Count the occurrences of each value (an array of 101 counters suffices).",
          "For each non-zero count `c`, test whether `c` is prime: `c >= 2` and no `d` with `2 <= d * d <= c` divides it.",
          "Return `true` on the first prime count, `false` if there is none.",
        ],
        why: "The table holds exactly the frequency of every element, and trial division up to `sqrt(c)` decides primality because any composite number has a divisor no larger than its square root.",
        time: "O(n + V * sqrt(n))",
        space: "O(V) with V = 101",
        pitfalls: [
          "1 is not prime, so an array of distinct values answers `false`.",
          "Test the **frequencies**, not the values themselves.",
        ],
      }),
      examples: [
        { input: "[7,3,7,9,7]", expectedOutput: "true" },
        { input: "[1,2,3,4]", expectedOutput: "false" },
        { input: "[6,6,6,6]", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const nums: number[] = [];
        const kinds = ri(rng, 1, 5);
        for (let t = 0; t < kinds; t++) {
          const v = ri(rng, 0, 100);
          const c = pick(rng, [1, 1, 4, 6, 8, 9, 2, 3, 5, 7, 11, 25]);
          for (let i = 0; i < c; i++) nums.push(v);
        }
        const arr = shuffle(rng, nums).slice(0, 100);
        return { input: fmtIntArr(arr), expectedOutput: bool(ref(arr)) };
      },
      solutions: {
        python: code`
          from typing import List

          def checkPrimeFrequency(nums: List[int]) -> bool:
              def is_prime(x: int) -> bool:
                  if x < 2:
                      return False
                  d = 2
                  while d * d <= x:
                      if x % d == 0:
                          return False
                      d += 1
                  return True

              count = {}
              for v in nums:
                  count[v] = count.get(v, 0) + 1
              return any(is_prime(c) for c in count.values())
        `,
        javascript: code`
          var checkPrimeFrequency = function(nums) {
              var count = new Array(101).fill(0);
              for (var i = 0; i < nums.length; i++) count[nums[i]]++;
              for (var v = 0; v <= 100; v++) if (isPrimeCount(count[v])) return true;
              return false;
          };

          var isPrimeCount = function(x) {
              if (x < 2) return false;
              for (var d = 2; d * d <= x; d++) if (x % d === 0) return false;
              return true;
          };
        `,
        typescript: code`
          function isPrimeCount(x: number): boolean {
              if (x < 2) return false;
              for (var d = 2; d * d <= x; d++) if (x % d === 0) return false;
              return true;
          }

          function checkPrimeFrequency(nums: number[]): boolean {
              var count: number[] = [];
              for (var z = 0; z <= 100; z++) count.push(0);
              for (var i = 0; i < nums.length; i++) count[nums[i]]++;
              for (var v = 0; v <= 100; v++) if (isPrimeCount(count[v])) return true;
              return false;
          }
        `,
        java: code`
          static boolean isPrimeCount(int x) {
              if (x < 2) return false;
              for (int d = 2; d * d <= x; d++) if (x % d == 0) return false;
              return true;
          }

          public static boolean checkPrimeFrequency(int[] nums) {
              int[] count = new int[101];
              for (int v : nums) count[v]++;
              for (int c : count) if (isPrimeCount(c)) return true;
              return false;
          }
        `,
        cpp: code`
          bool isPrimeCount(int x) {
              if (x < 2) return false;
              for (int d = 2; d * d <= x; d++) if (x % d == 0) return false;
              return true;
          }

          bool checkPrimeFrequency(vector<int>& nums) {
              vector<int> count(101, 0);
              for (int v : nums) count[v]++;
              for (int c : count) if (isPrimeCount(c)) return true;
              return false;
          }
        `,
        c: code`
          static bool isPrimeCount(int x) {
              if (x < 2) return false;
              for (int d = 2; d * d <= x; d++) if (x % d == 0) return false;
              return true;
          }

          bool checkPrimeFrequency(int* nums, int numsSize) {
              int count[101] = {0};
              for (int i = 0; i < numsSize; i++) count[nums[i]]++;
              for (int v = 0; v <= 100; v++) if (isPrimeCount(count[v])) return true;
              return false;
          }
        `,
        csharp: code`
          static bool IsPrimeCount(int x)
          {
              if (x < 2) return false;
              for (int d = 2; d * d <= x; d++) if (x % d == 0) return false;
              return true;
          }

          public static bool CheckPrimeFrequency(int[] nums)
          {
              int[] count = new int[101];
              foreach (int v in nums) count[v]++;
              foreach (int c in count) if (IsPrimeCount(c)) return true;
              return false;
          }
        `,
        go: code`
          func isPrimeCount(x int) bool {
              if x < 2 {
                  return false
              }
              for d := 2; d*d <= x; d++ {
                  if x%d == 0 {
                      return false
                  }
              }
              return true
          }

          func checkPrimeFrequency(nums []int) bool {
              count := make([]int, 101)
              for _, v := range nums {
                  count[v]++
              }
              for _, c := range count {
                  if isPrimeCount(c) {
                      return true
                  }
              }
              return false
          }
        `,
        kotlin: code`
          fun isPrimeCount(x: Int): Boolean {
              if (x < 2) return false
              var d = 2
              while (d * d <= x) {
                  if (x % d == 0) return false
                  d++
              }
              return true
          }

          fun checkPrimeFrequency(nums: IntArray): Boolean {
              val count = IntArray(101)
              for (v in nums) count[v]++
              return count.any { isPrimeCount(it) }
          }
        `,
        swift: code`
          func isPrimeCount(_ x: Int) -> Bool {
              if x < 2 { return false }
              var d = 2
              while d * d <= x {
                  if x % d == 0 { return false }
                  d += 1
              }
              return true
          }

          func checkPrimeFrequency(_ nums: [Int]) -> Bool {
              var count = [Int](repeating: 0, count: 101)
              for v in nums { count[v] += 1 }
              return count.contains { isPrimeCount($0) }
          }
        `,
        rust: code`
          fn is_prime_count(x: i32) -> bool {
              if x < 2 { return false; }
              let mut d = 2;
              while d * d <= x {
                  if x % d == 0 { return false; }
                  d += 1;
              }
              true
          }

          fn checkPrimeFrequency(nums: Vec<i32>) -> bool {
              let mut count = [0i32; 101];
              for &v in &nums { count[v as usize] += 1; }
              count.iter().any(|&c| is_prime_count(c))
          }
        `,
        php: code`
          function isPrimeCount($x) {
              if ($x < 2) return false;
              for ($d = 2; $d * $d <= $x; $d++) if ($x % $d == 0) return false;
              return true;
          }

          function checkPrimeFrequency($nums) {
              foreach (array_count_values($nums) as $c) if (isPrimeCount($c)) return true;
              return false;
          }
        `,
        ruby: code`
          def prime_count?(x)
            return false if x < 2
            d = 2
            while d * d <= x
              return false if x % d == 0
              d += 1
            end
            true
          end

          def checkPrimeFrequency(nums)
            count = Hash.new(0)
            nums.each { |v| count[v] += 1 }
            count.values.any? { |c| prime_count?(c) }
          end
        `,
      },
    };
  })(),

  // ── Partition String (LC 3597) ──────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const seen = new Set<string>();
      const out: string[] = [];
      let cur = "";
      for (const c of s) {
        cur += c;
        if (!seen.has(cur)) {
          seen.add(cur);
          out.push(cur);
          cur = "";
        }
      }
      return out;
    };
    return {
      slug: "partition-string",
      title: "Partition String",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Trie", "Simulation", "Amazon"],
      signature: { funcName: "partitionString", params: [{ name: "s", type: "string" as const }], returns: "string[]" as const },
      description: describe(
        "You are given a string `s`. Split it into segments with the following procedure:\n\n" +
        "- Start a new segment at index 0 and keep a set of segments already produced (initially empty).\n" +
        "- Extend the current segment one character at a time. As soon as it is a string **not yet in the set**, add it to the set and to the answer, and start a new segment at the next index.\n" +
        "- If the string ends while the current segment is still one that was seen before, that leftover piece is discarded.\n\n" +
        "Return the segments in the order they were produced.",
        [
          { in: 's = "aababa"', out: '["a","ab","aba"]', note: "`a` is new. Then `a` is seen, so it grows to `ab` (new). Then `a`, `ab` are seen, so it grows to `aba` (new)." },
          { in: 's = "kairo"', out: '["k","a","i","r","o"]', note: "Every single letter is new." },
          { in: 's = "aaaa"', out: '["a","aa"]', note: "After `a` and `aa`, the last `a` is a segment already seen, so it is dropped." },
        ],
        ["1 <= s.length <= 10^5", "s consists only of lowercase English letters"]),
      hints: [
        "This is a direct simulation: build the current segment, test it against a hash set, and cut when it is new.",
        "Notice that a segment only grows while it is already in the set — so every new segment is an earlier segment plus one character.",
        "That means a trie works too: walk down from the root one character at a time, and the moment a child is missing, create it and cut. Each character then costs O(1).",
      ],
      editorial: explain({
        idea: "Simulate exactly as described. Because a segment only keeps growing while it is a previously produced segment, the produced segments form a trie (this is the LZ78 phrase parsing), so membership can be tested in constant time per character.",
        steps: [
          "Keep a set of produced segments (or a trie whose nodes are produced segments) and the current segment.",
          "For each character, append it to the current segment.",
          "If the extended segment is new, record it in the set and in the answer, and reset the current segment to empty.",
          "When the input ends, return the answer; an unfinished segment is ignored.",
        ],
        why: "The loop implements the definition step by step: a cut happens at the first extension that is not in the set, and that string is then added, so later segments are compared against everything produced before them. In the trie version, walking to an existing child means the extended string is a known segment, and a missing child means it is new.",
        time: "O(n) with the trie; O(n * L) with a hash set of strings, L the longest segment (about sqrt(2n))",
        space: "O(n)",
        pitfalls: [
          "Do not append the trailing leftover — it is a segment already seen.",
          "Reset the segment **after** recording it, so the next segment starts at the following character.",
        ],
      }),
      examples: [
        { input: '"aababa"', expectedOutput: '["a","ab","aba"]' },
        { input: '"kairo"', expectedOutput: '["k","a","i","r","o"]' },
        { input: '"aaaa"', expectedOutput: '["a","aa"]' },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, pick(rng, [1, 6, 20, 60]), pick(rng, ["a", "ab", "abc", "abcdefghijklmnopqrstuvwxyz"]));
        return { input: `"${s}"`, expectedOutput: fmtStrArr(ref(s)) };
      },
      solutions: {
        python: code`
          from typing import List

          def partitionString(s: str) -> List[str]:
              seen = set()
              out = []
              start = 0
              for i in range(len(s)):
                  seg = s[start:i + 1]
                  if seg not in seen:
                      seen.add(seg)
                      out.append(seg)
                      start = i + 1
              return out
        `,
        javascript: code`
          var partitionString = function(s) {
              var seen = new Set();
              var out = [];
              var cur = "";
              for (var i = 0; i < s.length; i++) {
                  cur += s[i];
                  if (!seen.has(cur)) {
                      seen.add(cur);
                      out.push(cur);
                      cur = "";
                  }
              }
              return out;
          };
        `,
        typescript: code`
          function partitionString(s: string): string[] {
              var seen: { [seg: string]: boolean } = {};
              var out: string[] = [];
              var cur = "";
              for (var i = 0; i < s.length; i++) {
                  cur += s.charAt(i);
                  if (!seen.hasOwnProperty(cur)) {
                      seen[cur] = true;
                      out.push(cur);
                      cur = "";
                  }
              }
              return out;
          }
        `,
        java: code`
          public static String[] partitionString(String s) {
              Set<String> seen = new HashSet<>();
              List<String> out = new ArrayList<>();
              int start = 0;
              for (int i = 0; i < s.length(); i++) {
                  String seg = s.substring(start, i + 1);
                  if (seen.add(seg)) {
                      out.add(seg);
                      start = i + 1;
                  }
              }
              return out.toArray(new String[0]);
          }
        `,
        cpp: code`
          vector<string> partitionString(string s) {
              unordered_set<string> seen;
              vector<string> out;
              string cur;
              for (char c : s) {
                  cur += c;
                  if (seen.insert(cur).second) {
                      out.push_back(cur);
                      cur.clear();
                  }
              }
              return out;
          }
        `,
        c: code`
          char** partitionString(const char* s, int* returnSize) {
              // Every new segment is a known segment plus one letter, so the
              // segments form a trie: walk it, and a missing child is a cut.
              int n = (int)strlen(s);
              int (*child)[26] = calloc((size_t)(n + 2), sizeof *child);
              int nodes = 1;
              char** out = (char**)malloc(sizeof(char*) * (n + 1));
              int cnt = 0, node = 0, start = 0;
              for (int i = 0; i < n; i++) {
                  int c = s[i] - 'a';
                  if (child[node][c] == 0) {
                      child[node][c] = nodes++;
                      int len = i - start + 1;
                      char* seg = (char*)malloc(len + 1);
                      memcpy(seg, s + start, len);
                      seg[len] = '\0';
                      out[cnt++] = seg;
                      node = 0;
                      start = i + 1;
                  } else {
                      node = child[node][c];
                  }
              }
              free(child);
              *returnSize = cnt;
              return out;
          }
        `,
        csharp: code`
          public static string[] PartitionString(string s)
          {
              var seen = new HashSet<string>();
              var output = new List<string>();
              int start = 0;
              for (int i = 0; i < s.Length; i++)
              {
                  string seg = s.Substring(start, i - start + 1);
                  if (seen.Add(seg))
                  {
                      output.Add(seg);
                      start = i + 1;
                  }
              }
              return output.ToArray();
          }
        `,
        go: code`
          func partitionString(s string) []string {
              seen := map[string]bool{}
              out := []string{}
              start := 0
              for i := 0; i < len(s); i++ {
                  seg := s[start : i+1]
                  if !seen[seg] {
                      seen[seg] = true
                      out = append(out, seg)
                      start = i + 1
                  }
              }
              return out
          }
        `,
        kotlin: code`
          fun partitionString(s: String): Array<String> {
              val seen = HashSet<String>()
              val out = ArrayList<String>()
              var start = 0
              for (i in s.indices) {
                  val seg = s.substring(start, i + 1)
                  if (seen.add(seg)) {
                      out.add(seg)
                      start = i + 1
                  }
              }
              return out.toTypedArray()
          }
        `,
        swift: code`
          func partitionString(_ s: String) -> [String] {
              var seen = Set<String>()
              var out = [String]()
              var cur = ""
              for ch in s {
                  cur.append(ch)
                  if !seen.contains(cur) {
                      seen.insert(cur)
                      out.append(cur)
                      cur = ""
                  }
              }
              return out
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn partitionString(s: String) -> Vec<String> {
              let mut seen: HashSet<String> = HashSet::new();
              let mut out: Vec<String> = Vec::new();
              let mut start = 0;
              for i in 0..s.len() {
                  let seg = &s[start..i + 1];
                  if !seen.contains(seg) {
                      seen.insert(seg.to_string());
                      out.push(seg.to_string());
                      start = i + 1;
                  }
              }
              out
          }
        `,
        php: code`
          function partitionString($s) {
              $seen = [];
              $out = [];
              $cur = "";
              $n = strlen($s);
              for ($i = 0; $i < $n; $i++) {
                  $cur .= $s[$i];
                  if (!isset($seen[$cur])) {
                      $seen[$cur] = true;
                      $out[] = $cur;
                      $cur = "";
                  }
              }
              return $out;
          }
        `,
        ruby: code`
          def partitionString(s)
            seen = {}
            out = []
            cur = +""
            s.each_char do |c|
              cur << c
              next if seen[cur]
              seen[cur] = true
              out << cur
              cur = +""
            end
            out
          end
        `,
      },
    };
  })(),

  // ── Longest Continuous Increasing Subsequence (LC 674) ──────────
  (() => {
    const ref = (nums: number[]) => {
      let best = 0;
      for (let i = 0; i < nums.length; i++) {
        let j = i;
        while (j + 1 < nums.length && nums[j + 1] > nums[j]) j++;
        best = Math.max(best, j - i + 1);
      }
      return best;
    };
    return {
      slug: "longest-continuous-increasing-subsequence",
      title: "Longest Continuous Increasing Subsequence",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "findLengthOfLCIS", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an unsorted integer array `nums`. Return the length of the longest **continuous** strictly increasing run — a subarray `nums[l..r]` in which every element is strictly greater than the one before it.",
        [
          { in: "nums = [2,6,8,3,4,5,9,1]", out: "4", note: "The run `[3,4,5,9]` has length 4; `[2,6,8]` has only 3." },
          { in: "nums = [5,5,5]", out: "1", note: "Equal neighbours break a strictly increasing run, so each run is a single element." },
          { in: "nums = [-3,-1,0,7]", out: "4" },
        ],
        ["1 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"]),
      hints: [
        "A run ends exactly where `nums[i] <= nums[i - 1]`.",
        "Scan once, keeping the length of the run that ends at the current index: extend it when the element increases, reset it to 1 otherwise.",
      ],
      editorial: explain({
        idea: "Maximal increasing runs are separated by the positions where the sequence fails to increase, so one pass that tracks the current run length finds the longest.",
        steps: [
          "Set `cur = 1` and `best = 1`.",
          "For `i` from 1 to `n - 1`: if `nums[i] > nums[i - 1]`, increment `cur`; otherwise reset `cur = 1`.",
          "Update `best = max(best, cur)` after each step and return it.",
        ],
        why: "`cur` is always the length of the longest strictly increasing subarray ending at index `i`: either it extends the run ending at `i - 1`, or the comparison fails and only `nums[i]` itself remains. The answer is the maximum of these lengths over all end points.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Strictly increasing: equal neighbours end a run.",
          "This is about **contiguous** runs, not the longest increasing subsequence (which may skip elements).",
        ],
      }),
      examples: [
        { input: "[2,6,8,3,4,5,9,1]", expectedOutput: "4" },
        { input: "[5,5,5]", expectedOutput: "1" },
        { input: "[-3,-1,0,7]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 20, 60]));
        const top = pick(rng, [2, 10, 1000, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, -top, top));
        if (rng() < 0.2) nums.sort((a, b) => a - b);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findLengthOfLCIS(nums: List[int]) -> int:
              best = cur = 1
              for i in range(1, len(nums)):
                  cur = cur + 1 if nums[i] > nums[i - 1] else 1
                  best = max(best, cur)
              return best
        `,
        javascript: code`
          var findLengthOfLCIS = function(nums) {
              var best = 1, cur = 1;
              for (var i = 1; i < nums.length; i++) {
                  cur = nums[i] > nums[i - 1] ? cur + 1 : 1;
                  if (cur > best) best = cur;
              }
              return best;
          };
        `,
        typescript: code`
          function findLengthOfLCIS(nums: number[]): number {
              var best = 1, cur = 1;
              for (var i = 1; i < nums.length; i++) {
                  cur = nums[i] > nums[i - 1] ? cur + 1 : 1;
                  if (cur > best) best = cur;
              }
              return best;
          }
        `,
        java: code`
          public static int findLengthOfLCIS(int[] nums) {
              int best = 1, cur = 1;
              for (int i = 1; i < nums.length; i++) {
                  cur = nums[i] > nums[i - 1] ? cur + 1 : 1;
                  best = Math.max(best, cur);
              }
              return best;
          }
        `,
        cpp: code`
          int findLengthOfLCIS(vector<int>& nums) {
              int best = 1, cur = 1;
              for (int i = 1; i < (int)nums.size(); i++) {
                  cur = nums[i] > nums[i - 1] ? cur + 1 : 1;
                  best = max(best, cur);
              }
              return best;
          }
        `,
        c: code`
          int findLengthOfLCIS(int* nums, int numsSize) {
              int best = 1, cur = 1;
              for (int i = 1; i < numsSize; i++) {
                  cur = nums[i] > nums[i - 1] ? cur + 1 : 1;
                  if (cur > best) best = cur;
              }
              return best;
          }
        `,
        csharp: code`
          public static int FindLengthOfLCIS(int[] nums)
          {
              int best = 1, cur = 1;
              for (int i = 1; i < nums.Length; i++)
              {
                  cur = nums[i] > nums[i - 1] ? cur + 1 : 1;
                  best = Math.Max(best, cur);
              }
              return best;
          }
        `,
        go: code`
          func findLengthOfLCIS(nums []int) int {
              best, cur := 1, 1
              for i := 1; i < len(nums); i++ {
                  if nums[i] > nums[i-1] {
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
          fun findLengthOfLCIS(nums: IntArray): Int {
              var best = 1
              var cur = 1
              for (i in 1 until nums.size) {
                  cur = if (nums[i] > nums[i - 1]) cur + 1 else 1
                  best = maxOf(best, cur)
              }
              return best
          }
        `,
        swift: code`
          func findLengthOfLCIS(_ nums: [Int]) -> Int {
              var best = 1, cur = 1
              var i = 1
              while i < nums.count {
                  cur = nums[i] > nums[i - 1] ? cur + 1 : 1
                  best = max(best, cur)
                  i += 1
              }
              return best
          }
        `,
        rust: code`
          fn findLengthOfLCIS(nums: Vec<i32>) -> i32 {
              let (mut best, mut cur) = (1, 1);
              for i in 1..nums.len() {
                  cur = if nums[i] > nums[i - 1] { cur + 1 } else { 1 };
                  best = best.max(cur);
              }
              best
          }
        `,
        php: code`
          function findLengthOfLCIS($nums) {
              $best = 1;
              $cur = 1;
              $n = count($nums);
              for ($i = 1; $i < $n; $i++) {
                  $cur = $nums[$i] > $nums[$i - 1] ? $cur + 1 : 1;
                  if ($cur > $best) $best = $cur;
              }
              return $best;
          }
        `,
        ruby: code`
          def findLengthOfLCIS(nums)
            best = 1
            cur = 1
            (1...nums.length).each do |i|
              cur = nums[i] > nums[i - 1] ? cur + 1 : 1
              best = cur if cur > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── 1-bit and 2-bit Characters (LC 717) ─────────────────────────
  (() => {
    const ref = (bits: number[]) => {
      let i = 0, last = -1;
      while (i < bits.length) {
        last = i;
        i += bits[i] === 1 ? 2 : 1;
      }
      return last === bits.length - 1;
    };
    return {
      slug: "1-bit-and-2-bit-characters",
      title: "1-bit and 2-bit Characters",
      difficulty: "EASY" as const,
      tags: ["Array", "Google", "Amazon"],
      signature: { funcName: "isOneBitCharacter", params: [{ name: "bits", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "A code has two kinds of characters: a **one-bit** character written as `0`, and **two-bit** characters written as `10` or `11`.\n\n" +
        "You are given a bit array `bits` that ends with `0` and is a valid encoding of some text. Return `true` if its last character must be a one-bit character, and `false` otherwise.",
        [
          { in: "bits = [1,1,0]", out: "true", note: "It decodes as `11` then `0`." },
          { in: "bits = [0,1,0]", out: "false", note: "It decodes as `0` then `10` — the final `0` belongs to a two-bit character." },
          { in: "bits = [0]", out: "true" },
        ],
        ["1 <= bits.length <= 1000", "bits[i] is either 0 or 1", "bits[bits.length - 1] == 0"]),
      hints: [
        "Decoding from the left is unambiguous: a `0` is always a whole character, and a `1` always starts a two-bit character that swallows the next bit.",
        "Walk with an index: step 1 on a `0`, step 2 on a `1`. Where does the walk land just before the end?",
        "The last character is one bit exactly when the walk lands on index `n - 1`.",
      ],
      editorial: explain({
        idea: "The encoding is prefix-free, so a single left-to-right walk decodes it. The question is only whether some character starts at the final index.",
        steps: [
          "Set `i = 0`.",
          "While `i < n - 1`: advance `i` by `bits[i] + 1` (1 for a `0`, 2 for a `1`).",
          "Return `i == n - 1`.",
        ],
        why: "At every step `i` is the start of a character, because `0` is a complete character and `1` must begin a two-bit one. The loop stops when `i` reaches `n - 1` (a character starts at the last bit, and since it is `0`, that character is one bit) or `n` (the last bit was the second half of a two-bit character).",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Looking only at `bits[n - 2]` is wrong: `[1,1,0]` has a `1` there but the answer is `true`.",
          "An equivalent shortcut counts the run of `1`s just before the last `0`: an even count means `true`.",
        ],
      }),
      examples: [
        { input: "[1,1,0]", expectedOutput: "true" },
        { input: "[0,1,0]", expectedOutput: "false" },
        { input: "[0]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 0, pick(rng, [0, 3, 10, 40]));
        const p = pick(rng, [0.3, 0.5, 0.8]);
        const bits = Array.from({ length: n }, () => (rng() < p ? 1 : 0));
        bits.push(0);
        return { input: fmtIntArr(bits), expectedOutput: bool(ref(bits)) };
      },
      solutions: {
        python: code`
          from typing import List

          def isOneBitCharacter(bits: List[int]) -> bool:
              i, n = 0, len(bits)
              while i < n - 1:
                  i += bits[i] + 1
              return i == n - 1
        `,
        javascript: code`
          var isOneBitCharacter = function(bits) {
              var i = 0, n = bits.length;
              while (i < n - 1) i += bits[i] + 1;
              return i === n - 1;
          };
        `,
        typescript: code`
          function isOneBitCharacter(bits: number[]): boolean {
              var i = 0, n = bits.length;
              while (i < n - 1) i += bits[i] + 1;
              return i === n - 1;
          }
        `,
        java: code`
          public static boolean isOneBitCharacter(int[] bits) {
              int i = 0, n = bits.length;
              while (i < n - 1) i += bits[i] + 1;
              return i == n - 1;
          }
        `,
        cpp: code`
          bool isOneBitCharacter(vector<int>& bits) {
              int i = 0, n = bits.size();
              while (i < n - 1) i += bits[i] + 1;
              return i == n - 1;
          }
        `,
        c: code`
          bool isOneBitCharacter(int* bits, int bitsSize) {
              int i = 0;
              while (i < bitsSize - 1) i += bits[i] + 1;
              return i == bitsSize - 1;
          }
        `,
        csharp: code`
          public static bool IsOneBitCharacter(int[] bits)
          {
              int i = 0, n = bits.Length;
              while (i < n - 1) i += bits[i] + 1;
              return i == n - 1;
          }
        `,
        go: code`
          func isOneBitCharacter(bits []int) bool {
              i, n := 0, len(bits)
              for i < n-1 {
                  i += bits[i] + 1
              }
              return i == n-1
          }
        `,
        kotlin: code`
          fun isOneBitCharacter(bits: IntArray): Boolean {
              var i = 0
              val n = bits.size
              while (i < n - 1) i += bits[i] + 1
              return i == n - 1
          }
        `,
        swift: code`
          func isOneBitCharacter(_ bits: [Int]) -> Bool {
              var i = 0
              let n = bits.count
              while i < n - 1 { i += bits[i] + 1 }
              return i == n - 1
          }
        `,
        rust: code`
          fn isOneBitCharacter(bits: Vec<i32>) -> bool {
              let n = bits.len();
              let mut i = 0usize;
              while i + 1 < n { i += bits[i] as usize + 1; }
              i == n - 1
          }
        `,
        php: code`
          function isOneBitCharacter($bits) {
              $i = 0;
              $n = count($bits);
              while ($i < $n - 1) $i += $bits[$i] + 1;
              return $i == $n - 1;
          }
        `,
        ruby: code`
          def isOneBitCharacter(bits)
            i = 0
            n = bits.length
            i += bits[i] + 1 while i < n - 1
            i == n - 1
          end
        `,
      },
    };
  })(),

  // ── Maximize Distance to Closest Person (LC 849) ────────────────
  (() => {
    const ref = (seats: number[]) => {
      let best = 0;
      for (let i = 0; i < seats.length; i++) {
        if (seats[i] === 1) continue;
        let d = Infinity;
        for (let j = 0; j < seats.length; j++) if (seats[j] === 1) d = Math.min(d, Math.abs(i - j));
        best = Math.max(best, d);
      }
      return best;
    };
    return {
      slug: "maximize-distance-to-closest-person",
      title: "Maximize Distance to Closest Person",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Google", "Amazon", "Microsoft"],
      signature: { funcName: "maxDistToClosest", params: [{ name: "seats", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A row of seats is given as an array `seats`, where `seats[i] = 1` means seat `i` is taken and `seats[i] = 0` means it is empty. At least one seat is empty and at least one is taken.\n\n" +
        "Alex wants to sit in an empty seat that is as far as possible from the nearest person. Return that largest possible distance to the closest person.",
        [
          { in: "seats = [0,0,1,0,0,0,0,0,1]", out: "3", note: "In the middle gap of five empty seats, the centre seat (index 5) is 3 away from both neighbours. The leading gap only gives 2." },
          { in: "seats = [1,0,0,0,0]", out: "4", note: "The last seat is 4 away from the only person." },
          { in: "seats = [1,0]", out: "1" },
        ],
        ["2 <= seats.length <= 2 * 10^4", "seats[i] is 0 or 1", "At least one seat is empty", "At least one seat is occupied"]),
      hints: [
        "The empty seats form gaps between people. Treat a gap between two people differently from a gap at either end of the row.",
        "In an interior gap of `k` empty seats, the best seat is in the middle, at distance `(k + 1) / 2` (integer division).",
        "At the ends there is nobody on one side, so a leading or trailing gap of `k` seats gives distance `k`.",
      ],
      editorial: explain({
        idea: "Only the lengths of the runs of empty seats matter: an interior run of `k` seats offers `ceil(k / 2)`, and a run touching either end of the row offers `k`.",
        steps: [
          "Find the first and last occupied seats `first` and `last`.",
          "Start with `best = max(first, n - 1 - last)` — the edge gaps.",
          "Walk the occupied seats in order; for consecutive people at `p` and `q`, update `best = max(best, (q - p) / 2)`.",
          "Return `best`.",
        ],
        why: "For a seat in an interior gap between people at `p` and `q`, the distance to the closest person is `min(i - p, q - i)`, maximised at the middle with value `floor((q - p) / 2)`, which equals `ceil(k / 2)` for `k = q - p - 1` empty seats. In an edge gap only one person is near, so the far end of the gap is best, at distance equal to the gap length.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Edge gaps are not halved: `[1,0,0,0,0]` answers 4, not 2.",
          "For an interior gap use the distance between the two people, `(q - p) / 2`, not the number of empty seats divided by two.",
        ],
      }),
      examples: [
        { input: "[0,0,1,0,0,0,0,0,1]", expectedOutput: "3" },
        { input: "[1,0,0,0,0]", expectedOutput: "4" },
        { input: "[1,0]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 6, 20, 60]));
        const p = pick(rng, [0.1, 0.3, 0.6]);
        const seats = Array.from({ length: n }, () => (rng() < p ? 1 : 0));
        if (!seats.includes(1)) seats[ri(rng, 0, n - 1)] = 1;
        if (!seats.includes(0)) seats[ri(rng, 0, n - 1)] = 0;
        return { input: fmtIntArr(seats), expectedOutput: String(ref(seats)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxDistToClosest(seats: List[int]) -> int:
              n = len(seats)
              prev = -1
              best = 0
              for i, s in enumerate(seats):
                  if s == 1:
                      best = max(best, i if prev < 0 else (i - prev) // 2)
                      prev = i
              return max(best, n - 1 - prev)
        `,
        javascript: code`
          var maxDistToClosest = function(seats) {
              var n = seats.length, prev = -1, best = 0;
              for (var i = 0; i < n; i++) {
                  if (seats[i] !== 1) continue;
                  best = Math.max(best, prev < 0 ? i : Math.floor((i - prev) / 2));
                  prev = i;
              }
              return Math.max(best, n - 1 - prev);
          };
        `,
        typescript: code`
          function maxDistToClosest(seats: number[]): number {
              var n = seats.length, prev = -1, best = 0;
              for (var i = 0; i < n; i++) {
                  if (seats[i] !== 1) continue;
                  best = Math.max(best, prev < 0 ? i : Math.floor((i - prev) / 2));
                  prev = i;
              }
              return Math.max(best, n - 1 - prev);
          }
        `,
        java: code`
          public static int maxDistToClosest(int[] seats) {
              int n = seats.length, prev = -1, best = 0;
              for (int i = 0; i < n; i++) {
                  if (seats[i] != 1) continue;
                  best = Math.max(best, prev < 0 ? i : (i - prev) / 2);
                  prev = i;
              }
              return Math.max(best, n - 1 - prev);
          }
        `,
        cpp: code`
          int maxDistToClosest(vector<int>& seats) {
              int n = seats.size(), prev = -1, best = 0;
              for (int i = 0; i < n; i++) {
                  if (seats[i] != 1) continue;
                  best = max(best, prev < 0 ? i : (i - prev) / 2);
                  prev = i;
              }
              return max(best, n - 1 - prev);
          }
        `,
        c: code`
          int maxDistToClosest(int* seats, int seatsSize) {
              int prev = -1, best = 0;
              for (int i = 0; i < seatsSize; i++) {
                  if (seats[i] != 1) continue;
                  int d = prev < 0 ? i : (i - prev) / 2;
                  if (d > best) best = d;
                  prev = i;
              }
              if (seatsSize - 1 - prev > best) best = seatsSize - 1 - prev;
              return best;
          }
        `,
        csharp: code`
          public static int MaxDistToClosest(int[] seats)
          {
              int n = seats.Length, prev = -1, best = 0;
              for (int i = 0; i < n; i++)
              {
                  if (seats[i] != 1) continue;
                  best = Math.Max(best, prev < 0 ? i : (i - prev) / 2);
                  prev = i;
              }
              return Math.Max(best, n - 1 - prev);
          }
        `,
        go: code`
          func maxDistToClosest(seats []int) int {
              n, prev, best := len(seats), -1, 0
              for i, s := range seats {
                  if s != 1 {
                      continue
                  }
                  d := i
                  if prev >= 0 {
                      d = (i - prev) / 2
                  }
                  if d > best {
                      best = d
                  }
                  prev = i
              }
              if n-1-prev > best {
                  best = n - 1 - prev
              }
              return best
          }
        `,
        kotlin: code`
          fun maxDistToClosest(seats: IntArray): Int {
              val n = seats.size
              var prev = -1
              var best = 0
              for (i in 0 until n) {
                  if (seats[i] != 1) continue
                  best = maxOf(best, if (prev < 0) i else (i - prev) / 2)
                  prev = i
              }
              return maxOf(best, n - 1 - prev)
          }
        `,
        swift: code`
          func maxDistToClosest(_ seats: [Int]) -> Int {
              let n = seats.count
              var prev = -1, best = 0
              for i in 0..<n where seats[i] == 1 {
                  best = max(best, prev < 0 ? i : (i - prev) / 2)
                  prev = i
              }
              return max(best, n - 1 - prev)
          }
        `,
        rust: code`
          fn maxDistToClosest(seats: Vec<i32>) -> i32 {
              let n = seats.len() as i32;
              let (mut prev, mut best) = (-1i32, 0i32);
              for (i, &s) in seats.iter().enumerate() {
                  if s != 1 { continue; }
                  let i = i as i32;
                  best = best.max(if prev < 0 { i } else { (i - prev) / 2 });
                  prev = i;
              }
              best.max(n - 1 - prev)
          }
        `,
        php: code`
          function maxDistToClosest($seats) {
              $n = count($seats);
              $prev = -1;
              $best = 0;
              for ($i = 0; $i < $n; $i++) {
                  if ($seats[$i] != 1) continue;
                  $best = max($best, $prev < 0 ? $i : intdiv($i - $prev, 2));
                  $prev = $i;
              }
              return max($best, $n - 1 - $prev);
          }
        `,
        ruby: code`
          def maxDistToClosest(seats)
            n = seats.length
            prev = -1
            best = 0
            seats.each_with_index do |s, i|
              next unless s == 1
              d = prev < 0 ? i : (i - prev) / 2
              best = d if d > best
              prev = i
            end
            [best, n - 1 - prev].max
          end
        `,
      },
    };
  })(),

  // ── Sum of Even Numbers After Queries (LC 985) ──────────────────
  (() => {
    const ref = (nums: number[], queries: number[][]) => {
      const a = nums.slice();
      return queries.map(([val, idx]) => {
        a[idx] += val;
        return a.reduce((s, v) => (v % 2 === 0 ? s + v : s), 0);
      });
    };
    return {
      slug: "sum-of-even-numbers-after-queries",
      title: "Sum of Even Numbers After Queries",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Simulation", "Indeed", "Amazon"],
      signature: {
        funcName: "sumEvenAfterQueries",
        params: [{ name: "nums", type: "int[]" as const }, { name: "queries", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "You are given an integer array `nums` and an array `queries` where `queries[i] = [val, index]`.\n\n" +
        "Process the queries in order. For query `i`, first add `val` to `nums[index]`, then record the sum of the **even** values currently in `nums`.\n\n" +
        "Return the recorded sums as an array, one per query.",
        [
          { in: "nums = [2,5,6,1], queries = [[3,1],[-2,0],[1,3],[-6,2]]", out: "[16,14,16,10]", note: "The array becomes [2,8,6,1] (sum 16), [0,8,6,1] (14), [0,8,6,2] (16), [0,8,0,2] (10)." },
          { in: "nums = [7], queries = [[4,0]]", out: "[0]", note: "`7 + 4 = 11` is odd, so no even value remains." },
          { in: "nums = [-2,3], queries = [[1,1],[-1,0]]", out: "[2,4]", note: "Negative even numbers count too: `-2 + 4 = 2`, then `-2` becomes `-3`, leaving `4`." },
        ],
        [
          "1 <= nums.length <= 10^4",
          "-10^4 <= nums[i] <= 10^4",
          "1 <= queries.length <= 10^4",
          "-10^4 <= val <= 10^4",
          "0 <= index < nums.length",
        ]),
      hints: [
        "Recomputing the even sum after every query is `O(n)` per query — `10^8` steps at the limits. Only one element changes per query.",
        "Keep the running even sum. Before changing `nums[index]`, subtract it from the sum if it is even; after changing it, add it back if it is now even.",
      ],
      editorial: explain({
        idea: "Maintain the even sum incrementally: a query changes one element, so only that element's contribution to the sum can change.",
        steps: [
          "Compute `even` = the sum of the even values of `nums`.",
          "For each query `[val, index]`: if `nums[index]` is even, subtract it from `even`.",
          "Add `val` to `nums[index]`; if the new value is even, add it to `even`.",
          "Record `even`.",
        ],
        why: "Before the update, `even` counts `nums[index]` exactly when it is even, so removing that contribution leaves the even sum of all other elements, which the query does not touch. Adding the new value back when it is even restores the definition.",
        time: "O(n + q)",
        space: "O(1) besides the output",
        pitfalls: [
          "Negative numbers: `-3 % 2` is `-1` in most languages, so test evenness with `% 2 == 0`, never `% 2 == 1` for odd.",
          "Remove the old contribution **before** applying `val`.",
        ],
      }),
      examples: [
        { input: "[2,5,6,1]\n[[3,1],[-2,0],[1,3],[-6,2]]", expectedOutput: "[16,14,16,10]" },
        { input: "[7]\n[[4,0]]", expectedOutput: "[0]" },
        { input: "[-2,3]\n[[1,1],[-1,0]]", expectedOutput: "[2,4]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 15, 40]));
        const top = pick(rng, [3, 20, 10000]);
        const nums = Array.from({ length: n }, () => ri(rng, -top, top));
        const q = ri(rng, 1, pick(rng, [1, 5, 20, 40]));
        const queries = Array.from({ length: q }, () => [ri(rng, -top, top), ri(rng, 0, n - 1)]);
        return { input: `${fmtIntArr(nums)}\n${fmtIntMat(queries)}`, expectedOutput: fmtIntArr(ref(nums, queries)) };
      },
      solutions: {
        python: code`
          from typing import List

          def sumEvenAfterQueries(nums: List[int], queries: List[List[int]]) -> List[int]:
              even = sum(v for v in nums if v % 2 == 0)
              out = []
              for val, idx in queries:
                  if nums[idx] % 2 == 0:
                      even -= nums[idx]
                  nums[idx] += val
                  if nums[idx] % 2 == 0:
                      even += nums[idx]
                  out.append(even)
              return out
        `,
        javascript: code`
          var sumEvenAfterQueries = function(nums, queries) {
              var even = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] % 2 === 0) even += nums[i];
              var out = [];
              for (var q = 0; q < queries.length; q++) {
                  var val = queries[q][0], idx = queries[q][1];
                  if (nums[idx] % 2 === 0) even -= nums[idx];
                  nums[idx] += val;
                  if (nums[idx] % 2 === 0) even += nums[idx];
                  out.push(even);
              }
              return out;
          };
        `,
        typescript: code`
          function sumEvenAfterQueries(nums: number[], queries: number[][]): number[] {
              var even = 0;
              for (var i = 0; i < nums.length; i++) if (nums[i] % 2 === 0) even += nums[i];
              var out: number[] = [];
              for (var q = 0; q < queries.length; q++) {
                  var val = queries[q][0], idx = queries[q][1];
                  if (nums[idx] % 2 === 0) even -= nums[idx];
                  nums[idx] += val;
                  if (nums[idx] % 2 === 0) even += nums[idx];
                  out.push(even);
              }
              return out;
          }
        `,
        java: code`
          public static int[] sumEvenAfterQueries(int[] nums, int[][] queries) {
              int even = 0;
              for (int v : nums) if (v % 2 == 0) even += v;
              int[] out = new int[queries.length];
              for (int q = 0; q < queries.length; q++) {
                  int val = queries[q][0], idx = queries[q][1];
                  if (nums[idx] % 2 == 0) even -= nums[idx];
                  nums[idx] += val;
                  if (nums[idx] % 2 == 0) even += nums[idx];
                  out[q] = even;
              }
              return out;
          }
        `,
        cpp: code`
          vector<int> sumEvenAfterQueries(vector<int>& nums, vector<vector<int>>& queries) {
              int even = 0;
              for (int v : nums) if (v % 2 == 0) even += v;
              vector<int> out;
              for (auto& q : queries) {
                  int val = q[0], idx = q[1];
                  if (nums[idx] % 2 == 0) even -= nums[idx];
                  nums[idx] += val;
                  if (nums[idx] % 2 == 0) even += nums[idx];
                  out.push_back(even);
              }
              return out;
          }
        `,
        c: code`
          int* sumEvenAfterQueries(int* nums, int numsSize, int** queries, int queriesSize, int* queriesColSize, int* returnSize) {
              int even = 0;
              for (int i = 0; i < numsSize; i++) if (nums[i] % 2 == 0) even += nums[i];
              int* out = (int*)malloc(sizeof(int) * (queriesSize > 0 ? queriesSize : 1));
              for (int q = 0; q < queriesSize; q++) {
                  int val = queries[q][0], idx = queries[q][1];
                  if (nums[idx] % 2 == 0) even -= nums[idx];
                  nums[idx] += val;
                  if (nums[idx] % 2 == 0) even += nums[idx];
                  out[q] = even;
              }
              *returnSize = queriesSize;
              return out;
          }
        `,
        csharp: code`
          public static int[] SumEvenAfterQueries(int[] nums, int[][] queries)
          {
              int even = 0;
              foreach (int v in nums) if (v % 2 == 0) even += v;
              int[] output = new int[queries.Length];
              for (int q = 0; q < queries.Length; q++)
              {
                  int val = queries[q][0], idx = queries[q][1];
                  if (nums[idx] % 2 == 0) even -= nums[idx];
                  nums[idx] += val;
                  if (nums[idx] % 2 == 0) even += nums[idx];
                  output[q] = even;
              }
              return output;
          }
        `,
        go: code`
          func sumEvenAfterQueries(nums []int, queries [][]int) []int {
              even := 0
              for _, v := range nums {
                  if v%2 == 0 {
                      even += v
                  }
              }
              out := make([]int, len(queries))
              for q, query := range queries {
                  val, idx := query[0], query[1]
                  if nums[idx]%2 == 0 {
                      even -= nums[idx]
                  }
                  nums[idx] += val
                  if nums[idx]%2 == 0 {
                      even += nums[idx]
                  }
                  out[q] = even
              }
              return out
          }
        `,
        kotlin: code`
          fun sumEvenAfterQueries(nums: IntArray, queries: Array<IntArray>): IntArray {
              var even = 0
              for (v in nums) if (v % 2 == 0) even += v
              val out = IntArray(queries.size)
              for (q in queries.indices) {
                  val v = queries[q][0]
                  val idx = queries[q][1]
                  if (nums[idx] % 2 == 0) even -= nums[idx]
                  nums[idx] += v
                  if (nums[idx] % 2 == 0) even += nums[idx]
                  out[q] = even
              }
              return out
          }
        `,
        swift: code`
          func sumEvenAfterQueries(_ nums: [Int], _ queries: [[Int]]) -> [Int] {
              var a = nums
              var even = 0
              for v in a where v % 2 == 0 { even += v }
              var out = [Int]()
              for q in queries {
                  let val = q[0], idx = q[1]
                  if a[idx] % 2 == 0 { even -= a[idx] }
                  a[idx] += val
                  if a[idx] % 2 == 0 { even += a[idx] }
                  out.append(even)
              }
              return out
          }
        `,
        rust: code`
          fn sumEvenAfterQueries(nums: Vec<i32>, queries: Vec<Vec<i32>>) -> Vec<i32> {
              let mut a = nums;
              let mut even: i32 = a.iter().filter(|&&v| v % 2 == 0).sum();
              let mut out = Vec::with_capacity(queries.len());
              for q in &queries {
                  let (val, idx) = (q[0], q[1] as usize);
                  if a[idx] % 2 == 0 { even -= a[idx]; }
                  a[idx] += val;
                  if a[idx] % 2 == 0 { even += a[idx]; }
                  out.push(even);
              }
              out
          }
        `,
        php: code`
          function sumEvenAfterQueries($nums, $queries) {
              $even = 0;
              foreach ($nums as $v) if ($v % 2 == 0) $even += $v;
              $out = [];
              foreach ($queries as $q) {
                  [$val, $idx] = $q;
                  if ($nums[$idx] % 2 == 0) $even -= $nums[$idx];
                  $nums[$idx] += $val;
                  if ($nums[$idx] % 2 == 0) $even += $nums[$idx];
                  $out[] = $even;
              }
              return $out;
          }
        `,
        ruby: code`
          def sumEvenAfterQueries(nums, queries)
            even = nums.select(&:even?).sum
            queries.map do |val, idx|
              even -= nums[idx] if nums[idx].even?
              nums[idx] += val
              even += nums[idx] if nums[idx].even?
              even
            end
          end
        `,
      },
    };
  })(),
];
