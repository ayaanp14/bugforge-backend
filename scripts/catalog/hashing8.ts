/**
 * Hashing, counting & array problems — wave 7, batch 11.
 * Real problems only: LeetCode numbered problems (LC 2744–3159). Worked
 * examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEKAIRO_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap. The C harness has no math.h or limits.h, and
 * has no hash table either — the C solutions sort and binary-search (or use
 * a direct-address table where the values are small) in place of a hash set.
 *
 * Every answer fits a signed 32-bit integer. Where the original problem's
 * answer could not (Number of Black Blocks counts up to 10^10 empty blocks),
 * the stated constraints are reduced and the statement says so.
 */
import {
  code, describe, explain, fmtIntArr, fmtIntMat, fmtStrArr, pick, randLower, ri, shuffle,
  type CatalogProblem, type Rng,
} from "./types.js";

export const HASHING8_PROBLEMS: CatalogProblem[] = [

  // ── Find Maximum Number of String Pairs (LC 2744) ───────────────
  (() => {
    const ref = (words: string[]) => {
      let c = 0;
      for (let i = 0; i < words.length; i++)
        for (let j = i + 1; j < words.length; j++)
          if (words[i] === words[j].split("").reverse().join("")) c++;
      return c;
    };
    return {
      slug: "find-maximum-number-of-string-pairs",
      title: "Find Maximum Number of String Pairs",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "String", "Simulation", "Amazon"],
      signature: { funcName: "maximumNumberOfStringPairs", params: [{ name: "words", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `words` of **distinct** strings, each exactly two lowercase letters long.\n\nTwo indices `i < j` can be **paired** when `words[i]` is the reverse of `words[j]`. Every string may belong to at most one pair.\n\nReturn the **maximum** number of pairs that can be formed.",
        [
          { in: 'words = ["cd","ac","dc","ca","zz"]', out: "2", note: "`cd` pairs with `dc` and `ac` pairs with `ca`. `zz` is its own reverse, but no other copy of it exists." },
          { in: 'words = ["ab","ba","cc"]', out: "1" },
          { in: 'words = ["aa","ab"]', out: "0", note: "A palindrome cannot pair with itself — a pair needs two different indices." },
        ],
        ["1 <= words.length <= 50", "words[i].length == 2", "words consists of distinct strings", "words[i] contains only lowercase English letters"]),
      hints: [
        "Because the words are distinct, a word has at most one possible partner: its reverse. So no choice is ever involved.",
        "Walk the list once and remember the words seen so far.",
        "Before recording a word, ask whether its reverse is already recorded — if so, that is one more pair.",
      ],
      editorial: explain({
        idea: "With distinct words, each word's only candidate partner is its reverse, and that reverse occurs at most once — so the pairs are forced and you only have to count them. A set of the words seen so far finds each pair when its second word arrives.",
        steps: [
          "Keep an empty set `seen` and a counter `pairs = 0`.",
          "For each word `w`, if `reverse(w)` is in `seen`, increment `pairs`.",
          "Add `w` to `seen`.",
          "Return `pairs`.",
        ],
        why: "A word `w` can only pair with `reverse(w)`, and since words are distinct there is exactly zero or one such word. Pairs therefore never compete for a word, and each is counted exactly once — when its later member is processed. A palindrome such as `zz` would need a second copy of itself, which distinctness rules out, and checking before inserting keeps it from matching itself.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Inserting the word before checking would let a palindrome pair with itself.",
          "With only 26 × 26 possible words, a 26 × 26 boolean table replaces the set in languages without one.",
        ],
      }),
      examples: [
        { input: '["cd","ac","dc","ca","zz"]', expectedOutput: "2" },
        { input: '["ab","ba","cc"]', expectedOutput: "1" },
        { input: '["aa","ab"]', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcd", "abcdef", "abcdefghijklmnopqrstuvwxyz"]);
        const all: string[] = [];
        for (const a of alpha) for (const b of alpha) all.push(a + b);
        shuffle(rng, all);
        const n = ri(rng, 1, Math.min(50, all.length));
        const words = all.slice(0, n);
        return { input: fmtStrArr(words), expectedOutput: String(ref(words)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximumNumberOfStringPairs(words: List[str]) -> int:
              seen = set()
              pairs = 0
              for w in words:
                  if w[::-1] in seen:
                      pairs += 1
                  seen.add(w)
              return pairs
        `,
        javascript: code`
          var maximumNumberOfStringPairs = function(words) {
              var seen = {};
              var pairs = 0;
              for (var i = 0; i < words.length; i++) {
                  var w = words[i];
                  if (seen[w[1] + w[0]]) pairs++;
                  seen[w] = true;
              }
              return pairs;
          };
        `,
        typescript: code`
          function maximumNumberOfStringPairs(words: string[]): number {
              var seen: { [k: string]: boolean } = {};
              var pairs = 0;
              for (var i = 0; i < words.length; i++) {
                  var w = words[i];
                  if (seen[w.charAt(1) + w.charAt(0)]) pairs++;
                  seen[w] = true;
              }
              return pairs;
          }
        `,
        java: code`
          public static int maximumNumberOfStringPairs(String[] words) {
              boolean[][] seen = new boolean[26][26];
              int pairs = 0;
              for (String w : words) {
                  int a = w.charAt(0) - 'a', b = w.charAt(1) - 'a';
                  if (seen[b][a]) pairs++;
                  seen[a][b] = true;
              }
              return pairs;
          }
        `,
        cpp: code`
          int maximumNumberOfStringPairs(vector<string>& words) {
              bool seen[26][26] = {};
              int pairs = 0;
              for (const string& w : words) {
                  int a = w[0] - 'a', b = w[1] - 'a';
                  if (seen[b][a]) pairs++;
                  seen[a][b] = true;
              }
              return pairs;
          }
        `,
        c: code`
          int maximumNumberOfStringPairs(char** words, int wordsSize) {
              bool seen[26][26];
              memset(seen, 0, sizeof(seen));
              int pairs = 0;
              for (int i = 0; i < wordsSize; i++) {
                  int a = words[i][0] - 'a', b = words[i][1] - 'a';
                  if (seen[b][a]) pairs++;
                  seen[a][b] = true;
              }
              return pairs;
          }
        `,
        csharp: code`
          public static int MaximumNumberOfStringPairs(string[] words)
          {
              var seen = new bool[26, 26];
              int pairs = 0;
              foreach (var w in words)
              {
                  int a = w[0] - 'a', b = w[1] - 'a';
                  if (seen[b, a]) pairs++;
                  seen[a, b] = true;
              }
              return pairs;
          }
        `,
        go: code`
          func maximumNumberOfStringPairs(words []string) int {
              var seen [26][26]bool
              pairs := 0
              for _, w := range words {
                  a, b := w[0]-'a', w[1]-'a'
                  if seen[b][a] {
                      pairs++
                  }
                  seen[a][b] = true
              }
              return pairs
          }
        `,
        kotlin: code`
          fun maximumNumberOfStringPairs(words: Array<String>): Int {
              val seen = Array(26) { BooleanArray(26) }
              var pairs = 0
              for (w in words) {
                  val a = w[0] - 'a'
                  val b = w[1] - 'a'
                  if (seen[b][a]) pairs++
                  seen[a][b] = true
              }
              return pairs
          }
        `,
        swift: code`
          func maximumNumberOfStringPairs(_ words: [String]) -> Int {
              var seen = Set<String>()
              var pairs = 0
              for w in words {
                  if seen.contains(String(w.reversed())) { pairs += 1 }
                  seen.insert(w)
              }
              return pairs
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn maximumNumberOfStringPairs(words: Vec<String>) -> i32 {
              let mut seen: HashSet<String> = HashSet::new();
              let mut pairs = 0;
              for w in words.iter() {
                  let r: String = w.chars().rev().collect();
                  if seen.contains(&r) {
                      pairs += 1;
                  }
                  seen.insert(w.clone());
              }
              pairs
          }
        `,
        php: code`
          function maximumNumberOfStringPairs($words) {
              $seen = [];
              $pairs = 0;
              foreach ($words as $w) {
                  if (isset($seen[strrev($w)])) $pairs++;
                  $seen[$w] = true;
              }
              return $pairs;
          }
        `,
        ruby: code`
          def maximumNumberOfStringPairs(words)
            seen = {}
            pairs = 0
            words.each do |w|
              pairs += 1 if seen[w.reverse]
              seen[w] = true
            end
            pairs
          end
        `,
      },
    };
  })(),

  // ── Sum of Imbalance Numbers of All Subarrays (LC 2763) ─────────
  (() => {
    const imbalance = (a: number[]) => {
      const s = a.slice().sort((x, y) => x - y);
      let c = 0;
      for (let i = 0; i + 1 < s.length; i++) if (s[i + 1] - s[i] > 1) c++;
      return c;
    };
    const ref = (nums: number[]) => {
      let t = 0;
      for (let i = 0; i < nums.length; i++)
        for (let j = i; j < nums.length; j++) t += imbalance(nums.slice(i, j + 1));
      return t;
    };
    return {
      slug: "sum-of-imbalance-numbers-of-all-subarrays",
      title: "Sum of Imbalance Numbers of All Subarrays",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Ordered Set", "Google"],
      signature: { funcName: "sumImbalanceNumbers", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The **imbalance number** of an array `arr` is the number of indices `i` (`0 <= i < n - 1`) of `sarr = sorted(arr)` for which `sarr[i + 1] - sarr[i] > 1` — the number of gaps between neighbouring values once the array is sorted.\n\nGiven an integer array `nums`, return the **sum** of the imbalance numbers of all its non-empty contiguous subarrays.",
        [
          { in: "nums = [2,3,1,4]", out: "3", note: "Only `[3,1]`, `[3,1,4]` and `[1,4]` have a gap (each exactly one); every other subarray sorts into consecutive values." },
          { in: "nums = [1,3,3,3,5]", out: "8", note: "Subarrays such as `[1,3,3,3,5]` sort to `[1,3,3,3,5]` with two gaps; equal values never form a gap." },
          { in: "nums = [1]", out: "0" },
        ],
        ["1 <= nums.length <= 1000", "1 <= nums[i] <= nums.length"]),
      hints: [
        "Sorting every subarray is far too slow. Fix the left end and grow the subarray one element at a time — can you update the imbalance in O(1) per step?",
        "Think of the distinct values present as maximal runs of consecutive integers. The imbalance is exactly (number of runs) − 1.",
        "Adding a value `x` that is already present changes nothing. A new `x` starts a run, but merges with the run of `x - 1` if present and with the run of `x + 1` if present — each merge removes one run.",
      ],
      editorial: explain({
        idea: "The sorted distinct values of a subarray split into maximal runs of consecutive integers, and each boundary between two runs is one gap — so imbalance = runs − 1. Runs can be maintained in O(1) as a subarray grows to the right, with a `seen` array over the small value range.",
        steps: [
          "For each left end `i`, clear a boolean array `seen` of size `n + 2` and set `runs = 0`.",
          "Extend the right end `j` from `i`. Let `x = nums[j]`. If `seen[x]` is already set, the runs are unchanged.",
          "Otherwise mark it and set `runs += 1`, then `runs -= 1` if `seen[x - 1]`, and `runs -= 1` if `seen[x + 1]`.",
          "Add `runs - 1` to the answer for the subarray `nums[i..j]`.",
        ],
        why: "Duplicates never create a gap, so only the set of distinct values matters. That set is a union of maximal blocks of consecutive integers; sorted, consecutive blocks are separated by exactly one difference greater than 1, and inside a block every difference is 1 — hence imbalance = blocks − 1. A new value `x` is a block on its own unless `x - 1` or `x + 1` is present, in which case it glues onto (or bridges) those blocks, each neighbour reducing the count by one.",
        time: "O(n^2)",
        space: "O(n)",
        pitfalls: [
          "A repeated value must not change the run count — check `seen[x]` first.",
          "Index `x + 1` can be `n + 1`, so size the array `n + 2`.",
          "The imbalance of a single-element subarray is 0 (one run), not −1 — the formula runs − 1 already gives 0 because there is always at least one run.",
        ],
      }),
      examples: [
        { input: "[2,3,1,4]", expectedOutput: "3" },
        { input: "[1,3,3,3,5]", expectedOutput: "8" },
        { input: "[1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 25, 40]));
        const top = pick(rng, [1, 2, n, n]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, Math.max(1, Math.min(n, top))));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def sumImbalanceNumbers(nums: List[int]) -> int:
              n = len(nums)
              total = 0
              for i in range(n):
                  seen = [False] * (n + 2)
                  runs = 0
                  for j in range(i, n):
                      x = nums[j]
                      if not seen[x]:
                          seen[x] = True
                          runs += 1
                          if seen[x - 1]:
                              runs -= 1
                          if seen[x + 1]:
                              runs -= 1
                      total += runs - 1
              return total
        `,
        javascript: code`
          var sumImbalanceNumbers = function(nums) {
              var n = nums.length;
              var total = 0;
              var seen = new Uint8Array(n + 2);
              for (var i = 0; i < n; i++) {
                  seen.fill(0);
                  var runs = 0;
                  for (var j = i; j < n; j++) {
                      var x = nums[j];
                      if (!seen[x]) {
                          seen[x] = 1;
                          runs++;
                          if (seen[x - 1]) runs--;
                          if (seen[x + 1]) runs--;
                      }
                      total += runs - 1;
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function sumImbalanceNumbers(nums: number[]): number {
              var n = nums.length;
              var total = 0;
              for (var i = 0; i < n; i++) {
                  var seen: boolean[] = [];
                  for (var k = 0; k < n + 2; k++) seen.push(false);
                  var runs = 0;
                  for (var j = i; j < n; j++) {
                      var x = nums[j];
                      if (!seen[x]) {
                          seen[x] = true;
                          runs++;
                          if (seen[x - 1]) runs--;
                          if (seen[x + 1]) runs--;
                      }
                      total += runs - 1;
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int sumImbalanceNumbers(int[] nums) {
              int n = nums.length;
              int total = 0;
              for (int i = 0; i < n; i++) {
                  boolean[] seen = new boolean[n + 2];
                  int runs = 0;
                  for (int j = i; j < n; j++) {
                      int x = nums[j];
                      if (!seen[x]) {
                          seen[x] = true;
                          runs++;
                          if (seen[x - 1]) runs--;
                          if (seen[x + 1]) runs--;
                      }
                      total += runs - 1;
                  }
              }
              return total;
          }
        `,
        cpp: code`
          int sumImbalanceNumbers(vector<int>& nums) {
              int n = nums.size();
              int total = 0;
              for (int i = 0; i < n; i++) {
                  vector<bool> seen(n + 2, false);
                  int runs = 0;
                  for (int j = i; j < n; j++) {
                      int x = nums[j];
                      if (!seen[x]) {
                          seen[x] = true;
                          runs++;
                          if (seen[x - 1]) runs--;
                          if (seen[x + 1]) runs--;
                      }
                      total += runs - 1;
                  }
              }
              return total;
          }
        `,
        c: code`
          int sumImbalanceNumbers(int* nums, int numsSize) {
              int n = numsSize;
              char* seen = (char*) malloc((size_t) (n + 2));
              int total = 0;
              for (int i = 0; i < n; i++) {
                  memset(seen, 0, (size_t) (n + 2));
                  int runs = 0;
                  for (int j = i; j < n; j++) {
                      int x = nums[j];
                      if (!seen[x]) {
                          seen[x] = 1;
                          runs++;
                          if (seen[x - 1]) runs--;
                          if (seen[x + 1]) runs--;
                      }
                      total += runs - 1;
                  }
              }
              free(seen);
              return total;
          }
        `,
        csharp: code`
          public static int SumImbalanceNumbers(int[] nums)
          {
              int n = nums.Length;
              int total = 0;
              for (int i = 0; i < n; i++)
              {
                  var seen = new bool[n + 2];
                  int runs = 0;
                  for (int j = i; j < n; j++)
                  {
                      int x = nums[j];
                      if (!seen[x])
                      {
                          seen[x] = true;
                          runs++;
                          if (seen[x - 1]) runs--;
                          if (seen[x + 1]) runs--;
                      }
                      total += runs - 1;
                  }
              }
              return total;
          }
        `,
        go: code`
          func sumImbalanceNumbers(nums []int) int {
              n := len(nums)
              total := 0
              for i := 0; i < n; i++ {
                  seen := make([]bool, n+2)
                  runs := 0
                  for j := i; j < n; j++ {
                      x := nums[j]
                      if !seen[x] {
                          seen[x] = true
                          runs++
                          if seen[x-1] {
                              runs--
                          }
                          if seen[x+1] {
                              runs--
                          }
                      }
                      total += runs - 1
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun sumImbalanceNumbers(nums: IntArray): Int {
              val n = nums.size
              var total = 0
              for (i in 0 until n) {
                  val seen = BooleanArray(n + 2)
                  var runs = 0
                  for (j in i until n) {
                      val x = nums[j]
                      if (!seen[x]) {
                          seen[x] = true
                          runs++
                          if (seen[x - 1]) runs--
                          if (seen[x + 1]) runs--
                      }
                      total += runs - 1
                  }
              }
              return total
          }
        `,
        swift: code`
          func sumImbalanceNumbers(_ nums: [Int]) -> Int {
              let n = nums.count
              var total = 0
              for i in 0..<n {
                  var seen = [Bool](repeating: false, count: n + 2)
                  var runs = 0
                  for j in i..<n {
                      let x = nums[j]
                      if !seen[x] {
                          seen[x] = true
                          runs += 1
                          if seen[x - 1] { runs -= 1 }
                          if seen[x + 1] { runs -= 1 }
                      }
                      total += runs - 1
                  }
              }
              return total
          }
        `,
        rust: code`
          fn sumImbalanceNumbers(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut total: i32 = 0;
              for i in 0..n {
                  let mut seen = vec![false; n + 2];
                  let mut runs: i32 = 0;
                  for j in i..n {
                      let x = nums[j] as usize;
                      if !seen[x] {
                          seen[x] = true;
                          runs += 1;
                          if seen[x - 1] {
                              runs -= 1;
                          }
                          if seen[x + 1] {
                              runs -= 1;
                          }
                      }
                      total += runs - 1;
                  }
              }
              total
          }
        `,
        php: code`
          function sumImbalanceNumbers($nums) {
              $n = count($nums);
              $total = 0;
              for ($i = 0; $i < $n; $i++) {
                  $seen = array_fill(0, $n + 2, false);
                  $runs = 0;
                  for ($j = $i; $j < $n; $j++) {
                      $x = $nums[$j];
                      if (!$seen[$x]) {
                          $seen[$x] = true;
                          $runs++;
                          if ($seen[$x - 1]) $runs--;
                          if ($seen[$x + 1]) $runs--;
                      }
                      $total += $runs - 1;
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def sumImbalanceNumbers(nums)
            n = nums.length
            total = 0
            (0...n).each do |i|
              seen = Array.new(n + 2, false)
              runs = 0
              (i...n).each do |j|
                x = nums[j]
                unless seen[x]
                  seen[x] = true
                  runs += 1
                  runs -= 1 if seen[x - 1]
                  runs -= 1 if seen[x + 1]
                end
                total += runs - 1
              end
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Relocate Marbles (LC 2766) ──────────────────────────────────
  (() => {
    const ref = (nums: number[], from: number[], to: number[]) => {
      const s = new Set(nums);
      for (let i = 0; i < from.length; i++) { s.delete(from[i]); s.add(to[i]); }
      return [...s].sort((a, b) => a - b);
    };
    return {
      slug: "relocate-marbles",
      title: "Relocate Marbles",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sorting", "Simulation", "Amazon"],
      signature: {
        funcName: "relocateMarbles",
        params: [{ name: "nums", type: "int[]" as const }, { name: "moveFrom", type: "int[]" as const }, { name: "moveTo", type: "int[]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "`nums` lists the starting positions of some marbles — several marbles may share a position. You are also given two equal-length arrays `moveFrom` and `moveTo`.\n\nPerform the moves in order: in step `i`, **every** marble currently at position `moveFrom[i]` moves to position `moveTo[i]`. The tests guarantee that `moveFrom[i]` holds at least one marble at the moment step `i` is applied.\n\nAfter all the steps, return the list of **occupied** positions (each once) **sorted ascending**.",
        [
          { in: "nums = [1,6,7,8], moveFrom = [1,7,2], moveTo = [2,9,5]", out: "[5,6,8,9]", note: "1 moves to 2, 7 moves to 9, then the marble now at 2 moves to 5." },
          { in: "nums = [1,1,3,3], moveFrom = [1,3], moveTo = [2,2]", out: "[2]", note: "All four marbles gather at position 2." },
          { in: "nums = [4], moveFrom = [4], moveTo = [4]", out: "[4]", note: "A move onto the same position leaves it occupied." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= moveFrom.length <= 10^5", "moveFrom.length == moveTo.length", "1 <= nums[i], moveFrom[i], moveTo[i] <= 10^9", "moveFrom[i] is occupied when step i is applied"]),
      hints: [
        "Individual marbles do not matter — only which positions are occupied.",
        "Keep a set of occupied positions. A step empties `moveFrom[i]` and fills `moveTo[i]`.",
        "Remove before you add, so a step whose source and target coincide leaves the position occupied. Sort the set at the end.",
      ],
      editorial: explain({
        idea: "Since all marbles at a position move together, the state is just the set of occupied positions. Each step is a delete followed by an insert.",
        steps: [
          "Insert every value of `nums` into a set.",
          "For each step `i`, delete `moveFrom[i]` from the set, then insert `moveTo[i]`.",
          "Return the set's elements in ascending order.",
        ],
        why: "A step takes every marble at `moveFrom[i]` away, so that position becomes empty (whatever its multiplicity), and at least one marble arrives at `moveTo[i]`, so that position becomes occupied. No other position changes. Doing the delete first gives the right state when `moveFrom[i] == moveTo[i]`.",
        time: "O((n + m) log(n + m))",
        space: "O(n + m)",
        pitfalls: [
          "Inserting before deleting empties a position that a self-move should leave occupied.",
          "Tracking marble counts is unnecessary — and a count map still has to drop the source key entirely, not decrement it once.",
          "The answer must be sorted and free of duplicates.",
        ],
      }),
      examples: [
        { input: "[1,6,7,8]\n[1,7,2]\n[2,9,5]", expectedOutput: "[5,6,8,9]" },
        { input: "[1,1,3,3]\n[1,3]\n[2,2]", expectedOutput: "[2]" },
        { input: "[4]\n[4]\n[4]", expectedOutput: "[4]" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [3, 10, 50, 1000000000]);
        const n = ri(rng, 1, pick(rng, [1, 5, 20, 40]));
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        const occ = new Set(nums);
        const m = ri(rng, 1, pick(rng, [1, 5, 20, 40]));
        const from: number[] = [], to: number[] = [];
        for (let i = 0; i < m; i++) {
          const cur = [...occ];
          const f = cur[ri(rng, 0, cur.length - 1)];
          const t = rng() < 0.3 ? cur[ri(rng, 0, cur.length - 1)] : ri(rng, 1, top);
          from.push(f); to.push(t);
          occ.delete(f); occ.add(t);
        }
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(from)}\n${fmtIntArr(to)}`, expectedOutput: fmtIntArr(ref(nums, from, to)) };
      },
      solutions: {
        python: code`
          from typing import List

          def relocateMarbles(nums: List[int], moveFrom: List[int], moveTo: List[int]) -> List[int]:
              occupied = set(nums)
              for f, t in zip(moveFrom, moveTo):
                  occupied.discard(f)
                  occupied.add(t)
              return sorted(occupied)
        `,
        javascript: code`
          var relocateMarbles = function(nums, moveFrom, moveTo) {
              var occupied = new Set(nums);
              for (var i = 0; i < moveFrom.length; i++) {
                  occupied.delete(moveFrom[i]);
                  occupied.add(moveTo[i]);
              }
              var out = [];
              occupied.forEach(function(v) { out.push(v); });
              out.sort(function(a, b) { return a - b; });
              return out;
          };
        `,
        typescript: code`
          function relocateMarbles(nums: number[], moveFrom: number[], moveTo: number[]): number[] {
              var occupied: { [k: string]: boolean } = {};
              for (var i = 0; i < nums.length; i++) occupied[nums[i]] = true;
              for (var j = 0; j < moveFrom.length; j++) {
                  delete occupied[moveFrom[j]];
                  occupied[moveTo[j]] = true;
              }
              var out: number[] = [];
              for (var key in occupied) {
                  if (occupied.hasOwnProperty(key)) out.push(parseInt(key, 10));
              }
              out.sort(function(a, b) { return a - b; });
              return out;
          }
        `,
        java: code`
          public static int[] relocateMarbles(int[] nums, int[] moveFrom, int[] moveTo) {
              TreeSet<Integer> occupied = new TreeSet<>();
              for (int v : nums) occupied.add(v);
              for (int i = 0; i < moveFrom.length; i++) {
                  occupied.remove(moveFrom[i]);
                  occupied.add(moveTo[i]);
              }
              int[] out = new int[occupied.size()];
              int k = 0;
              for (int v : occupied) out[k++] = v;
              return out;
          }
        `,
        cpp: code`
          vector<int> relocateMarbles(vector<int>& nums, vector<int>& moveFrom, vector<int>& moveTo) {
              set<int> occupied(nums.begin(), nums.end());
              for (size_t i = 0; i < moveFrom.size(); i++) {
                  occupied.erase(moveFrom[i]);
                  occupied.insert(moveTo[i]);
              }
              return vector<int>(occupied.begin(), occupied.end());
          }
        `,
        c: code`
          static int rmCmp(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          static int rmFind(const int* vals, int len, int v) {
              int lo = 0, hi = len - 1;
              while (lo < hi) {
                  int mid = (lo + hi) / 2;
                  if (vals[mid] < v) lo = mid + 1; else hi = mid;
              }
              return lo;
          }

          int* relocateMarbles(int* nums, int numsSize, int* moveFrom, int moveFromSize, int* moveTo, int moveToSize, int* returnSize) {
              // Compress every position that can ever be occupied, then keep a flag per position.
              int total = numsSize + moveToSize;
              int* vals = (int*) malloc(sizeof(int) * total);
              for (int i = 0; i < numsSize; i++) vals[i] = nums[i];
              for (int i = 0; i < moveToSize; i++) vals[numsSize + i] = moveTo[i];
              qsort(vals, total, sizeof(int), rmCmp);
              int len = 0;
              for (int i = 0; i < total; i++) if (len == 0 || vals[len - 1] != vals[i]) vals[len++] = vals[i];
              char* occ = (char*) calloc((size_t) len, 1);
              for (int i = 0; i < numsSize; i++) occ[rmFind(vals, len, nums[i])] = 1;
              for (int i = 0; i < moveFromSize; i++) {
                  occ[rmFind(vals, len, moveFrom[i])] = 0;
                  occ[rmFind(vals, len, moveTo[i])] = 1;
              }
              int* out = (int*) malloc(sizeof(int) * (len > 0 ? len : 1));
              int k = 0;
              for (int i = 0; i < len; i++) if (occ[i]) out[k++] = vals[i];
              free(vals);
              free(occ);
              *returnSize = k;
              return out;
          }
        `,
        csharp: code`
          public static int[] RelocateMarbles(int[] nums, int[] moveFrom, int[] moveTo)
          {
              var occupied = new HashSet<int>(nums);
              for (int i = 0; i < moveFrom.Length; i++)
              {
                  occupied.Remove(moveFrom[i]);
                  occupied.Add(moveTo[i]);
              }
              var out1 = occupied.ToList();
              out1.Sort();
              return out1.ToArray();
          }
        `,
        go: code`
          func relocateMarbles(nums []int, moveFrom []int, moveTo []int) []int {
              occupied := map[int]bool{}
              for _, v := range nums {
                  occupied[v] = true
              }
              for i := range moveFrom {
                  delete(occupied, moveFrom[i])
                  occupied[moveTo[i]] = true
              }
              out := make([]int, 0, len(occupied))
              for v := range occupied {
                  out = append(out, v)
              }
              sort.Ints(out)
              return out
          }
        `,
        kotlin: code`
          fun relocateMarbles(nums: IntArray, moveFrom: IntArray, moveTo: IntArray): IntArray {
              val occupied = java.util.TreeSet<Int>()
              for (v in nums) occupied.add(v)
              for (i in moveFrom.indices) {
                  occupied.remove(moveFrom[i])
                  occupied.add(moveTo[i])
              }
              return occupied.toIntArray()
          }
        `,
        swift: code`
          func relocateMarbles(_ nums: [Int], _ moveFrom: [Int], _ moveTo: [Int]) -> [Int] {
              var occupied = Set(nums)
              for i in 0..<moveFrom.count {
                  occupied.remove(moveFrom[i])
                  occupied.insert(moveTo[i])
              }
              return occupied.sorted()
          }
        `,
        rust: code`
          use std::collections::BTreeSet;

          fn relocateMarbles(nums: Vec<i32>, moveFrom: Vec<i32>, moveTo: Vec<i32>) -> Vec<i32> {
              let mut occupied: BTreeSet<i32> = nums.into_iter().collect();
              for i in 0..moveFrom.len() {
                  occupied.remove(&moveFrom[i]);
                  occupied.insert(moveTo[i]);
              }
              occupied.into_iter().collect()
          }
        `,
        php: code`
          function relocateMarbles($nums, $moveFrom, $moveTo) {
              $occupied = [];
              foreach ($nums as $v) $occupied[$v] = true;
              $m = count($moveFrom);
              for ($i = 0; $i < $m; $i++) {
                  unset($occupied[$moveFrom[$i]]);
                  $occupied[$moveTo[$i]] = true;
              }
              $out = array_keys($occupied);
              sort($out);
              return $out;
          }
        `,
        ruby: code`
          def relocateMarbles(nums, moveFrom, moveTo)
            occupied = {}
            nums.each { |v| occupied[v] = true }
            moveFrom.each_index do |i|
              occupied.delete(moveFrom[i])
              occupied[moveTo[i]] = true
            end
            occupied.keys.sort
          end
        `,
      },
    };
  })(),

  // ── Number of Black Blocks (LC 2768) ────────────────────────────
  (() => {
    const ref = (m: number, n: number, coords: number[][]) => {
      const black = new Set(coords.map(([x, y]) => x * n + y));
      const out = [0, 0, 0, 0, 0];
      const blocks = new Map<number, number>();
      for (const [x, y] of coords)
        for (let bx = x - 1; bx <= x; bx++)
          for (let by = y - 1; by <= y; by++)
            if (bx >= 0 && by >= 0 && bx < m - 1 && by < n - 1) blocks.set(bx * n + by, 0);
      for (const key of blocks.keys()) {
        const bx = Math.floor(key / n), by = key % n;
        let c = 0;
        for (let dx = 0; dx < 2; dx++) for (let dy = 0; dy < 2; dy++) if (black.has((bx + dx) * n + by + dy)) c++;
        out[c]++;
      }
      out[0] = (m - 1) * (n - 1) - out[1] - out[2] - out[3] - out[4];
      return out;
    };
    return {
      slug: "number-of-black-blocks",
      title: "Number of Black Blocks",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Enumeration", "Amazon"],
      signature: {
        funcName: "countBlackBlocks",
        params: [{ name: "m", type: "int" as const }, { name: "n", type: "int" as const }, { name: "coordinates", type: "int[][]" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "A grid has `m` rows and `n` columns. Every cell is white except those listed in `coordinates`, where `coordinates[i] = [x, y]` marks cell `(x, y)` black.\n\nA **block** is a `2 x 2` sub-grid: the cells `(x, y)`, `(x + 1, y)`, `(x, y + 1)` and `(x + 1, y + 1)` for some top-left corner with `0 <= x < m - 1` and `0 <= y < n - 1`. There are `(m - 1) · (n - 1)` blocks in all.\n\nReturn an array `arr` of length 5 where `arr[i]` is the number of blocks containing **exactly** `i` black cells.\n\n*CodeKairo bound:* `m` and `n` are at most `4 · 10^4` here (the original allows `10^5`), so the number of all-white blocks always fits in a 32-bit integer.",
        [
          { in: "m = 3, n = 3, coordinates = [[0,0]]", out: "[3,1,0,0,0]", note: "Only the top-left block contains the black cell." },
          { in: "m = 3, n = 3, coordinates = [[0,0],[1,1],[0,2]]", out: "[0,2,2,0,0]", note: "The two top blocks hold two black cells each; the two bottom blocks hold just the centre cell." },
          { in: "m = 2, n = 2, coordinates = [[0,0],[0,1],[1,0],[1,1]]", out: "[0,0,0,0,1]" },
        ],
        ["2 <= m, n <= 4 * 10^4", "1 <= coordinates.length <= 10^4", "coordinates[i].length == 2", "0 <= coordinates[i][0] < m", "0 <= coordinates[i][1] < n", "All coordinates are distinct"]),
      hints: [
        "There can be over a billion blocks, so you cannot visit them all — but only blocks that touch a black cell can hold a non-zero count.",
        "A black cell `(x, y)` lies in at most four blocks: those with top-left corners `(x - 1, y - 1)`, `(x - 1, y)`, `(x, y - 1)` and `(x, y)` that are inside the grid.",
        "Count, per touched block, how many black cells landed in it (a hash map keyed by the corner). Every block never touched has zero black cells.",
      ],
      editorial: explain({
        idea: "Instead of looking at blocks, let each black cell vote for the at most four blocks that contain it. A hash map from block corner to vote count then gives every non-empty block's black-cell count directly, and the all-white blocks are whatever is left over.",
        steps: [
          "For every black cell `(x, y)` and each corner `(bx, by)` in `{x - 1, x} × {y - 1, y}`, if `0 <= bx < m - 1` and `0 <= by < n - 1`, increment `count[(bx, by)]` (encode the corner as `bx · n + by`).",
          "For every entry of the map, increment `arr[count]`.",
          "Set `arr[0] = (m - 1) · (n - 1) − (arr[1] + arr[2] + arr[3] + arr[4])`.",
        ],
        why: "Block `(bx, by)` contains cell `(x, y)` exactly when `bx ∈ {x - 1, x}` and `by ∈ {y - 1, y}`, so each black cell increments precisely the blocks that contain it, once each. A block's final value is therefore its number of black cells, and blocks absent from the map have none.",
        time: "O(k) expected for k black cells",
        space: "O(k)",
        pitfalls: [
          "Iterating over all `(m - 1)(n - 1)` blocks times out for large grids.",
          "Corners on the last row or column (`bx = m - 1` or `by = n - 1`) are not blocks and must be skipped.",
          "`(m - 1) · (n - 1)` can reach about 1.6 · 10^9 here — compute it in 64-bit where an intermediate could overflow.",
        ],
      }),
      examples: [
        { input: "3\n3\n[[0,0]]", expectedOutput: "[3,1,0,0,0]" },
        { input: "3\n3\n[[0,0],[1,1],[0,2]]", expectedOutput: "[0,2,2,0,0]" },
        { input: "2\n2\n[[0,0],[0,1],[1,0],[1,1]]", expectedOutput: "[0,0,0,0,1]" },
      ],
      gen: (rng: Rng) => {
        const big = rng() < 0.2;
        const m = big ? ri(rng, 2, 40000) : ri(rng, 2, 8);
        const n = big ? ri(rng, 2, 40000) : ri(rng, 2, 8);
        const want = ri(rng, 1, Math.min(m * n, big ? 30 : pick(rng, [1, 4, 12, 64])));
        const seen = new Set<number>();
        const coords: number[][] = [];
        let guard = 0;
        while (coords.length < want && guard++ < 1000) {
          let x: number, y: number;
          if (big && coords.length > 0 && rng() < 0.6) {
            const [px, py] = coords[ri(rng, 0, coords.length - 1)];
            x = Math.min(m - 1, Math.max(0, px + ri(rng, -1, 1)));
            y = Math.min(n - 1, Math.max(0, py + ri(rng, -1, 1)));
          } else { x = ri(rng, 0, m - 1); y = ri(rng, 0, n - 1); }
          const key = x * n + y;
          if (seen.has(key)) continue;
          seen.add(key);
          coords.push([x, y]);
        }
        return { input: `${m}\n${n}\n${fmtIntMat(coords)}`, expectedOutput: fmtIntArr(ref(m, n, coords)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countBlackBlocks(m: int, n: int, coordinates: List[List[int]]) -> List[int]:
              count = {}
              for x, y in coordinates:
                  for bx in (x - 1, x):
                      if bx < 0 or bx >= m - 1:
                          continue
                      for by in (y - 1, y):
                          if by < 0 or by >= n - 1:
                              continue
                          key = bx * n + by
                          count[key] = count.get(key, 0) + 1
              arr = [0] * 5
              for c in count.values():
                  arr[c] += 1
              arr[0] = (m - 1) * (n - 1) - sum(arr[1:])
              return arr
        `,
        javascript: code`
          var countBlackBlocks = function(m, n, coordinates) {
              var count = new Map();
              for (var i = 0; i < coordinates.length; i++) {
                  var x = coordinates[i][0], y = coordinates[i][1];
                  for (var bx = x - 1; bx <= x; bx++) {
                      if (bx < 0 || bx >= m - 1) continue;
                      for (var by = y - 1; by <= y; by++) {
                          if (by < 0 || by >= n - 1) continue;
                          var key = bx * n + by;
                          var prev = count.get(key);
                          count.set(key, (prev === undefined ? 0 : prev) + 1);
                      }
                  }
              }
              var arr = [0, 0, 0, 0, 0];
              count.forEach(function(c) { arr[c]++; });
              arr[0] = (m - 1) * (n - 1) - arr[1] - arr[2] - arr[3] - arr[4];
              return arr;
          };
        `,
        typescript: code`
          function countBlackBlocks(m: number, n: number, coordinates: number[][]): number[] {
              var count: { [k: string]: number } = {};
              for (var i = 0; i < coordinates.length; i++) {
                  var x = coordinates[i][0], y = coordinates[i][1];
                  for (var bx = x - 1; bx <= x; bx++) {
                      if (bx < 0 || bx >= m - 1) continue;
                      for (var by = y - 1; by <= y; by++) {
                          if (by < 0 || by >= n - 1) continue;
                          var key = String(bx * n + by);
                          count[key] = (count.hasOwnProperty(key) ? count[key] : 0) + 1;
                      }
                  }
              }
              var arr = [0, 0, 0, 0, 0];
              for (var k in count) {
                  if (count.hasOwnProperty(k)) arr[count[k]]++;
              }
              arr[0] = (m - 1) * (n - 1) - arr[1] - arr[2] - arr[3] - arr[4];
              return arr;
          }
        `,
        java: code`
          public static int[] countBlackBlocks(int m, int n, int[][] coordinates) {
              HashMap<Long, Integer> count = new HashMap<>();
              for (int[] c : coordinates) {
                  int x = c[0], y = c[1];
                  for (int bx = x - 1; bx <= x; bx++) {
                      if (bx < 0 || bx >= m - 1) continue;
                      for (int by = y - 1; by <= y; by++) {
                          if (by < 0 || by >= n - 1) continue;
                          count.merge((long) bx * n + by, 1, Integer::sum);
                      }
                  }
              }
              int[] arr = new int[5];
              for (int v : count.values()) arr[v]++;
              long all = (long) (m - 1) * (n - 1);
              arr[0] = (int) (all - arr[1] - arr[2] - arr[3] - arr[4]);
              return arr;
          }
        `,
        cpp: code`
          vector<int> countBlackBlocks(int m, int n, vector<vector<int>>& coordinates) {
              unordered_map<long long, int> count;
              for (auto& c : coordinates) {
                  int x = c[0], y = c[1];
                  for (int bx = x - 1; bx <= x; bx++) {
                      if (bx < 0 || bx >= m - 1) continue;
                      for (int by = y - 1; by <= y; by++) {
                          if (by < 0 || by >= n - 1) continue;
                          count[(long long) bx * n + by]++;
                      }
                  }
              }
              vector<int> arr(5, 0);
              for (auto& kv : count) arr[kv.second]++;
              long long all = (long long) (m - 1) * (n - 1);
              arr[0] = (int) (all - arr[1] - arr[2] - arr[3] - arr[4]);
              return arr;
          }
        `,
        c: code`
          static int bbCmp(const void* a, const void* b) {
              long long x = *(const long long*) a, y = *(const long long*) b;
              return (x > y) - (x < y);
          }

          int* countBlackBlocks(int m, int n, int** coordinates, int coordinatesSize, int* coordinatesColSize, int* returnSize) {
              // One key per (black cell, containing block); equal keys sorted together give each block's count.
              long long* keys = (long long*) malloc(sizeof(long long) * (4 * coordinatesSize + 1));
              int k = 0;
              for (int i = 0; i < coordinatesSize; i++) {
                  int x = coordinates[i][0], y = coordinates[i][1];
                  for (int bx = x - 1; bx <= x; bx++) {
                      if (bx < 0 || bx >= m - 1) continue;
                      for (int by = y - 1; by <= y; by++) {
                          if (by < 0 || by >= n - 1) continue;
                          keys[k++] = (long long) bx * n + by;
                      }
                  }
              }
              qsort(keys, k, sizeof(long long), bbCmp);
              int* arr = (int*) calloc(5, sizeof(int));
              int i = 0;
              while (i < k) {
                  int j = i;
                  while (j < k && keys[j] == keys[i]) j++;
                  arr[j - i]++;
                  i = j;
              }
              free(keys);
              long long all = (long long) (m - 1) * (n - 1);
              arr[0] = (int) (all - arr[1] - arr[2] - arr[3] - arr[4]);
              *returnSize = 5;
              return arr;
          }
        `,
        csharp: code`
          public static int[] CountBlackBlocks(int m, int n, int[][] coordinates)
          {
              var count = new Dictionary<long, int>();
              foreach (var c in coordinates)
              {
                  int x = c[0], y = c[1];
                  for (int bx = x - 1; bx <= x; bx++)
                  {
                      if (bx < 0 || bx >= m - 1) continue;
                      for (int by = y - 1; by <= y; by++)
                      {
                          if (by < 0 || by >= n - 1) continue;
                          long key = (long) bx * n + by;
                          count.TryGetValue(key, out int prev);
                          count[key] = prev + 1;
                      }
                  }
              }
              var arr = new int[5];
              foreach (int v in count.Values) arr[v]++;
              long all = (long) (m - 1) * (n - 1);
              arr[0] = (int) (all - arr[1] - arr[2] - arr[3] - arr[4]);
              return arr;
          }
        `,
        go: code`
          func countBlackBlocks(m int, n int, coordinates [][]int) []int {
              count := map[int]int{}
              for _, c := range coordinates {
                  x, y := c[0], c[1]
                  for bx := x - 1; bx <= x; bx++ {
                      if bx < 0 || bx >= m-1 {
                          continue
                      }
                      for by := y - 1; by <= y; by++ {
                          if by < 0 || by >= n-1 {
                              continue
                          }
                          count[bx*n+by]++
                      }
                  }
              }
              arr := make([]int, 5)
              for _, v := range count {
                  arr[v]++
              }
              arr[0] = (m-1)*(n-1) - arr[1] - arr[2] - arr[3] - arr[4]
              return arr
          }
        `,
        kotlin: code`
          fun countBlackBlocks(m: Int, n: Int, coordinates: Array<IntArray>): IntArray {
              val count = HashMap<Long, Int>()
              for (c in coordinates) {
                  val x = c[0]
                  val y = c[1]
                  for (bx in x - 1..x) {
                      if (bx < 0 || bx >= m - 1) continue
                      for (by in y - 1..y) {
                          if (by < 0 || by >= n - 1) continue
                          val key = bx.toLong() * n + by
                          count[key] = (count[key] ?: 0) + 1
                      }
                  }
              }
              val arr = IntArray(5)
              for (v in count.values) arr[v]++
              val all = (m - 1).toLong() * (n - 1)
              arr[0] = (all - arr[1] - arr[2] - arr[3] - arr[4]).toInt()
              return arr
          }
        `,
        swift: code`
          func countBlackBlocks(_ m: Int, _ n: Int, _ coordinates: [[Int]]) -> [Int] {
              var count = [Int: Int]()
              for c in coordinates {
                  let x = c[0], y = c[1]
                  for bx in (x - 1)...x {
                      if bx < 0 || bx >= m - 1 { continue }
                      for by in (y - 1)...y {
                          if by < 0 || by >= n - 1 { continue }
                          count[bx * n + by, default: 0] += 1
                      }
                  }
              }
              var arr = [0, 0, 0, 0, 0]
              for v in count.values { arr[v] += 1 }
              arr[0] = (m - 1) * (n - 1) - arr[1] - arr[2] - arr[3] - arr[4]
              return arr
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn countBlackBlocks(m: i32, n: i32, coordinates: Vec<Vec<i32>>) -> Vec<i32> {
              let mut count: HashMap<i64, i32> = HashMap::new();
              for c in coordinates.iter() {
                  let (x, y) = (c[0], c[1]);
                  for bx in (x - 1)..=x {
                      if bx < 0 || bx >= m - 1 {
                          continue;
                      }
                      for by in (y - 1)..=y {
                          if by < 0 || by >= n - 1 {
                              continue;
                          }
                          *count.entry(bx as i64 * n as i64 + by as i64).or_insert(0) += 1;
                      }
                  }
              }
              let mut arr = vec![0i64; 5];
              for v in count.values() {
                  arr[*v as usize] += 1;
              }
              arr[0] = (m as i64 - 1) * (n as i64 - 1) - arr[1] - arr[2] - arr[3] - arr[4];
              arr.into_iter().map(|v| v as i32).collect()
          }
        `,
        php: code`
          function countBlackBlocks($m, $n, $coordinates) {
              $count = [];
              foreach ($coordinates as $c) {
                  $x = $c[0];
                  $y = $c[1];
                  for ($bx = $x - 1; $bx <= $x; $bx++) {
                      if ($bx < 0 || $bx >= $m - 1) continue;
                      for ($by = $y - 1; $by <= $y; $by++) {
                          if ($by < 0 || $by >= $n - 1) continue;
                          $key = $bx * $n + $by;
                          $count[$key] = ($count[$key] ?? 0) + 1;
                      }
                  }
              }
              $arr = [0, 0, 0, 0, 0];
              foreach ($count as $v) $arr[$v]++;
              $arr[0] = ($m - 1) * ($n - 1) - $arr[1] - $arr[2] - $arr[3] - $arr[4];
              return $arr;
          }
        `,
        ruby: code`
          def countBlackBlocks(m, n, coordinates)
            count = Hash.new(0)
            coordinates.each do |x, y|
              (x - 1..x).each do |bx|
                next if bx < 0 || bx >= m - 1
                (y - 1..y).each do |by|
                  next if by < 0 || by >= n - 1
                  count[bx * n + by] += 1
                end
              end
            end
            arr = [0, 0, 0, 0, 0]
            count.each_value { |v| arr[v] += 1 }
            arr[0] = (m - 1) * (n - 1) - arr[1] - arr[2] - arr[3] - arr[4]
            arr
          end
        `,
      },
    };
  })(),

  // ── Minimum Index of a Valid Split (LC 2780) ────────────────────
  (() => {
    const dominant = (a: number[]) => {
      const c = new Map<number, number>();
      for (const v of a) c.set(v, (c.get(v) || 0) + 1);
      for (const [v, k] of c) if (k * 2 > a.length) return v;
      return null;
    };
    const ref = (nums: number[]) => {
      const d = dominant(nums);
      for (let i = 0; i < nums.length - 1; i++) {
        const l = dominant(nums.slice(0, i + 1)), r = dominant(nums.slice(i + 1));
        if (l !== null && l === d && r === d) return i;
      }
      return -1;
    };
    return {
      slug: "minimum-index-of-a-valid-split",
      title: "Minimum Index of a Valid Split",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sorting", "Amazon", "Google"],
      signature: { funcName: "minimumIndex", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An element `x` is **dominant** in an array `arr` when it occurs more than half the time: `2 · freq(x) > arr.length`. An array has at most one dominant element.\n\nYou are given an integer array `nums` (0-indexed) that is guaranteed to have a dominant element. Splitting at index `i` (`0 <= i < n - 1`) produces `nums[0..i]` and `nums[i + 1..n - 1]`; the split is **valid** if both parts have the **same** dominant element.\n\nReturn the **minimum** index of a valid split, or `-1` if there is none.",
        [
          { in: "nums = [1,2,2,2]", out: "2", note: "Splitting after index 2 gives `[1,2,2]` and `[2]`, both dominated by 2. Splitting at 0 or 1 leaves a left part with no dominant element." },
          { in: "nums = [2,1,3,1,1,1,7,1,2,1]", out: "4", note: "`[2,1,3,1,1]` and `[1,7,1,2,1]` are both dominated by 1." },
          { in: "nums = [3,3,3,3,7,2,2]", out: "-1", note: "Any left part dominated by 3 leaves too few 3s on the right." },
        ],
        ["1 <= nums.length <= 10^5", "1 <= nums[i] <= 10^9", "nums has exactly one dominant element"]),
      hints: [
        "If both halves share a dominant element `y`, then `y` occurs more than half the time in the whole array — so it must be the array's own dominant element.",
        "Find that element `d` and its total count first (a hash map, or Boyer–Moore voting).",
        "Scan the split point left to right, keeping how many copies of `d` are on the left. The split at `i` is valid when `2 · left > i + 1` and `2 · (total − left) > n − i − 1`.",
      ],
      editorial: explain({
        idea: "Only the array's dominant element `d` can dominate both halves: if `y` is more than half of each part, it is more than half of the whole. So count `d` once, then sweep the split point with a running prefix count of `d`.",
        steps: [
          "Find the dominant element `d` (Boyer–Moore majority vote) and its total count `total`.",
          "Sweep `i` from 0 to `n - 2`, adding 1 to `left` whenever `nums[i] == d`.",
          "Return the first `i` with `2 · left > i + 1` and `2 · (total − left) > n − i − 1`.",
          "If no index qualifies, return −1.",
        ],
        why: "If both parts are dominated by `y`, then `freq(y) > (i + 1)/2 + (n − i − 1)/2 = n/2`, so `y = d`. Conversely the two inequalities say exactly that `d` is dominant on each side. The first index where they hold is the answer.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Recomputing each half's dominant element from scratch is O(n^2).",
          "The last valid split index is `n - 2`; the right part must be non-empty.",
          "Use strict inequalities — exactly half is not dominant.",
        ],
      }),
      examples: [
        { input: "[1,2,2,2]", expectedOutput: "2" },
        { input: "[2,1,3,1,1,1,7,1,2,1]", expectedOutput: "4" },
        { input: "[3,3,3,3,7,2,2]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 3, 8, 20, 40]));
        const top = pick(rng, [3, 10, 1000000000]);
        const d = ri(rng, 1, top);
        const c = ri(rng, Math.floor(n / 2) + 1, n);
        const nums: number[] = [];
        for (let i = 0; i < c; i++) nums.push(d);
        while (nums.length < n) { const v = ri(rng, 1, top); if (v !== d) nums.push(v); }
        shuffle(rng, nums);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumIndex(nums: List[int]) -> int:
              d, votes = nums[0], 0
              for v in nums:
                  if votes == 0:
                      d = v
                  votes += 1 if v == d else -1
              total = nums.count(d)
              n = len(nums)
              left = 0
              for i in range(n - 1):
                  if nums[i] == d:
                      left += 1
                  if 2 * left > i + 1 and 2 * (total - left) > n - i - 1:
                      return i
              return -1
        `,
        javascript: code`
          var minimumIndex = function(nums) {
              var n = nums.length;
              var d = nums[0], votes = 0;
              for (var i = 0; i < n; i++) {
                  if (votes === 0) d = nums[i];
                  votes += nums[i] === d ? 1 : -1;
              }
              var total = 0;
              for (var j = 0; j < n; j++) if (nums[j] === d) total++;
              var left = 0;
              for (var k = 0; k < n - 1; k++) {
                  if (nums[k] === d) left++;
                  if (2 * left > k + 1 && 2 * (total - left) > n - k - 1) return k;
              }
              return -1;
          };
        `,
        typescript: code`
          function minimumIndex(nums: number[]): number {
              var n = nums.length;
              var d = nums[0], votes = 0;
              for (var i = 0; i < n; i++) {
                  if (votes === 0) d = nums[i];
                  votes += nums[i] === d ? 1 : -1;
              }
              var total = 0;
              for (var j = 0; j < n; j++) if (nums[j] === d) total++;
              var left = 0;
              for (var k = 0; k < n - 1; k++) {
                  if (nums[k] === d) left++;
                  if (2 * left > k + 1 && 2 * (total - left) > n - k - 1) return k;
              }
              return -1;
          }
        `,
        java: code`
          public static int minimumIndex(int[] nums) {
              int n = nums.length;
              int d = nums[0], votes = 0;
              for (int v : nums) {
                  if (votes == 0) d = v;
                  votes += v == d ? 1 : -1;
              }
              int total = 0;
              for (int v : nums) if (v == d) total++;
              int left = 0;
              for (int i = 0; i < n - 1; i++) {
                  if (nums[i] == d) left++;
                  if (2 * left > i + 1 && 2 * (total - left) > n - i - 1) return i;
              }
              return -1;
          }
        `,
        cpp: code`
          int minimumIndex(vector<int>& nums) {
              int n = nums.size();
              int d = nums[0], votes = 0;
              for (int v : nums) {
                  if (votes == 0) d = v;
                  votes += v == d ? 1 : -1;
              }
              int total = 0;
              for (int v : nums) if (v == d) total++;
              int left = 0;
              for (int i = 0; i < n - 1; i++) {
                  if (nums[i] == d) left++;
                  if (2 * left > i + 1 && 2 * (total - left) > n - i - 1) return i;
              }
              return -1;
          }
        `,
        c: code`
          int minimumIndex(int* nums, int numsSize) {
              int n = numsSize;
              int d = nums[0], votes = 0;
              for (int i = 0; i < n; i++) {
                  if (votes == 0) d = nums[i];
                  votes += nums[i] == d ? 1 : -1;
              }
              int total = 0;
              for (int i = 0; i < n; i++) if (nums[i] == d) total++;
              int left = 0;
              for (int i = 0; i < n - 1; i++) {
                  if (nums[i] == d) left++;
                  if (2 * left > i + 1 && 2 * (total - left) > n - i - 1) return i;
              }
              return -1;
          }
        `,
        csharp: code`
          public static int MinimumIndex(int[] nums)
          {
              int n = nums.Length;
              int d = nums[0], votes = 0;
              foreach (int v in nums)
              {
                  if (votes == 0) d = v;
                  votes += v == d ? 1 : -1;
              }
              int total = 0;
              foreach (int v in nums) if (v == d) total++;
              int left = 0;
              for (int i = 0; i < n - 1; i++)
              {
                  if (nums[i] == d) left++;
                  if (2 * left > i + 1 && 2 * (total - left) > n - i - 1) return i;
              }
              return -1;
          }
        `,
        go: code`
          func minimumIndex(nums []int) int {
              n := len(nums)
              d, votes := nums[0], 0
              for _, v := range nums {
                  if votes == 0 {
                      d = v
                  }
                  if v == d {
                      votes++
                  } else {
                      votes--
                  }
              }
              total := 0
              for _, v := range nums {
                  if v == d {
                      total++
                  }
              }
              left := 0
              for i := 0; i < n-1; i++ {
                  if nums[i] == d {
                      left++
                  }
                  if 2*left > i+1 && 2*(total-left) > n-i-1 {
                      return i
                  }
              }
              return -1
          }
        `,
        kotlin: code`
          fun minimumIndex(nums: IntArray): Int {
              val n = nums.size
              var d = nums[0]
              var votes = 0
              for (v in nums) {
                  if (votes == 0) d = v
                  votes += if (v == d) 1 else -1
              }
              val total = nums.count { it == d }
              var left = 0
              for (i in 0 until n - 1) {
                  if (nums[i] == d) left++
                  if (2 * left > i + 1 && 2 * (total - left) > n - i - 1) return i
              }
              return -1
          }
        `,
        swift: code`
          func minimumIndex(_ nums: [Int]) -> Int {
              let n = nums.count
              var d = nums[0], votes = 0
              for v in nums {
                  if votes == 0 { d = v }
                  votes += v == d ? 1 : -1
              }
              var total = 0
              for v in nums where v == d { total += 1 }
              var left = 0
              var i = 0
              while i < n - 1 {
                  if nums[i] == d { left += 1 }
                  if 2 * left > i + 1 && 2 * (total - left) > n - i - 1 { return i }
                  i += 1
              }
              return -1
          }
        `,
        rust: code`
          fn minimumIndex(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut d = nums[0];
              let mut votes = 0;
              for &v in nums.iter() {
                  if votes == 0 {
                      d = v;
                  }
                  if v == d { votes += 1; } else { votes -= 1; }
              }
              let total = nums.iter().filter(|&&v| v == d).count();
              let mut left = 0usize;
              for i in 0..n.saturating_sub(1) {
                  if nums[i] == d {
                      left += 1;
                  }
                  if 2 * left > i + 1 && 2 * (total - left) > n - i - 1 {
                      return i as i32;
                  }
              }
              -1
          }
        `,
        php: code`
          function minimumIndex($nums) {
              $n = count($nums);
              $d = $nums[0];
              $votes = 0;
              foreach ($nums as $v) {
                  if ($votes == 0) $d = $v;
                  $votes += $v == $d ? 1 : -1;
              }
              $total = 0;
              foreach ($nums as $v) if ($v == $d) $total++;
              $left = 0;
              for ($i = 0; $i < $n - 1; $i++) {
                  if ($nums[$i] == $d) $left++;
                  if (2 * $left > $i + 1 && 2 * ($total - $left) > $n - $i - 1) return $i;
              }
              return -1;
          }
        `,
        ruby: code`
          def minimumIndex(nums)
            n = nums.length
            d = nums[0]
            votes = 0
            nums.each do |v|
              d = v if votes == 0
              votes += v == d ? 1 : -1
            end
            total = nums.count(d)
            left = 0
            (0...n - 1).each do |i|
              left += 1 if nums[i] == d
              return i if 2 * left > i + 1 && 2 * (total - left) > n - i - 1
            end
            -1
          end
        `,
      },
    };
  })(),


  // ── Minimum Seconds to Equalize a Circular Array (LC 2808) ──────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let best = Infinity;
      for (const v of new Set(nums)) {
        let worst = 0;
        for (let i = 0; i < n; i++) {
          let d = Infinity;
          for (let j = 0; j < n; j++) if (nums[j] === v) d = Math.min(d, Math.abs(i - j), n - Math.abs(i - j));
          worst = Math.max(worst, d);
        }
        best = Math.min(best, worst);
      }
      return best;
    };
    return {
      slug: "minimum-seconds-to-equalize-a-circular-array",
      title: "Minimum Seconds to Equalize a Circular Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Greedy", "Microsoft", "Amazon"],
      signature: { funcName: "minimumSeconds", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given a 0-indexed array `nums` of `n` integers arranged in a **circle**: index `n - 1` is next to index `0`.\n\nEvery second, all elements are replaced **simultaneously**: each `nums[i]` becomes one of `nums[i]`, `nums[(i - 1 + n) % n]` or `nums[(i + 1) % n]` (you choose for each index).\n\nReturn the **minimum** number of seconds needed to make every element of the array equal.",
        [
          { in: "nums = [1,2,1,2]", out: "1", note: "In one second every 2 copies a neighbouring 1, giving `[1,1,1,1]`." },
          { in: "nums = [2,1,3,3,2]", out: "2", note: "Spreading the 3s takes two seconds: `[2,3,3,3,3]`, then `[3,3,3,3,3]`." },
          { in: "nums = [5,5,5,5]", out: "0" },
        ],
        ["1 <= n == nums.length <= 10^5", "1 <= nums[i] <= 10^9"]),
      hints: [
        "Fix the final value `v`. Every second, each copy of `v` can spread one step left and one step right — so the time is how far the farthest index is from its nearest copy of `v`.",
        "Between two consecutive copies of `v` that are `g` positions apart (going round the circle), the farthest index in the gap is `floor(g / 2)` away from a copy.",
        "For each distinct value record its largest circular gap between consecutive occurrences, including the wrap-around gap from its last occurrence back to its first. Take the minimum of `floor(gap / 2)` over all values.",
      ],
      editorial: explain({
        idea: "Choosing a target value `v`, the copies of `v` flood outwards one cell per second in both directions. A gap of `g` steps between consecutive copies is filled from both ends in `floor(g / 2)` seconds, so the cost of `v` is half its largest circular gap.",
        steps: [
          "For each distinct value keep its first index, its last index seen so far, and its largest gap so far.",
          "Scanning `i` from left to right, when `nums[i]` was seen before at `last`, update the gap with `i - last`; then set `last = i`.",
          "After the scan, close the circle for each value with the gap `first + n - last` (a value seen once gets the gap `n`).",
          "Return the minimum of `floor(maxGap / 2)` over all values.",
        ],
        why: "After `t` seconds the cells holding `v` (under the best choices) are exactly the cells within circular distance `t` of an original copy: each second a cell may copy a neighbour, so `v` spreads one step per second and no faster. A cell between copies `g` apart is at distance at most `floor(g / 2)` from one of them, with equality at the middle, so `v` needs exactly `floor(maxGap / 2)` seconds.",
        time: "O(n) expected (hash map)",
        space: "O(n)",
        pitfalls: [
          "Forgetting the wrap-around gap from the last copy to the first.",
          "A value that appears once has gap `n`, not 0.",
          "Simulating second by second is far too slow when the answer is large.",
        ],
      }),
      examples: [
        { input: "[1,2,1,2]", expectedOutput: "1" },
        { input: "[2,1,3,3,2]", expectedOutput: "2" },
        { input: "[5,5,5,5]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 4, 10, 25, 40]));
        const top = pick(rng, [1, 2, 3, 6, 20, 1000000000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def minimumSeconds(nums: List[int]) -> int:
              n = len(nums)
              first, last, gap = {}, {}, {}
              for i, v in enumerate(nums):
                  if v in last:
                      gap[v] = max(gap[v], i - last[v])
                  else:
                      first[v] = i
                      gap[v] = 0
                  last[v] = i
              best = n
              for v in first:
                  g = max(gap[v], first[v] + n - last[v])
                  best = min(best, g // 2)
              return best
        `,
        javascript: code`
          var minimumSeconds = function(nums) {
              var n = nums.length;
              var info = new Map(); // value -> [first, last, gap]
              for (var i = 0; i < n; i++) {
                  var e = info.get(nums[i]);
                  if (e === undefined) {
                      info.set(nums[i], [i, i, 0]);
                  } else {
                      if (i - e[1] > e[2]) e[2] = i - e[1];
                      e[1] = i;
                  }
              }
              var best = n;
              info.forEach(function(e) {
                  var g = Math.max(e[2], e[0] + n - e[1]);
                  if (Math.floor(g / 2) < best) best = Math.floor(g / 2);
              });
              return best;
          };
        `,
        typescript: code`
          function minimumSeconds(nums: number[]): number {
              var n = nums.length;
              var info: { [k: string]: number[] } = {};
              for (var i = 0; i < n; i++) {
                  var key = String(nums[i]);
                  if (!info.hasOwnProperty(key)) {
                      info[key] = [i, i, 0];
                  } else {
                      var e = info[key];
                      if (i - e[1] > e[2]) e[2] = i - e[1];
                      e[1] = i;
                  }
              }
              var best = n;
              for (var k in info) {
                  if (!info.hasOwnProperty(k)) continue;
                  var f = info[k];
                  var g = Math.max(f[2], f[0] + n - f[1]);
                  if (Math.floor(g / 2) < best) best = Math.floor(g / 2);
              }
              return best;
          }
        `,
        java: code`
          public static int minimumSeconds(int[] nums) {
              int n = nums.length;
              HashMap<Integer, int[]> info = new HashMap<>(); // value -> {first, last, gap}
              for (int i = 0; i < n; i++) {
                  int[] e = info.get(nums[i]);
                  if (e == null) {
                      info.put(nums[i], new int[]{i, i, 0});
                  } else {
                      e[2] = Math.max(e[2], i - e[1]);
                      e[1] = i;
                  }
              }
              int best = n;
              for (int[] e : info.values()) {
                  int g = Math.max(e[2], e[0] + n - e[1]);
                  best = Math.min(best, g / 2);
              }
              return best;
          }
        `,
        cpp: code`
          int minimumSeconds(vector<int>& nums) {
              int n = nums.size();
              unordered_map<int, array<int, 3>> info; // value -> {first, last, gap}
              for (int i = 0; i < n; i++) {
                  auto it = info.find(nums[i]);
                  if (it == info.end()) {
                      info[nums[i]] = {i, i, 0};
                  } else {
                      auto& e = it->second;
                      e[2] = max(e[2], i - e[1]);
                      e[1] = i;
                  }
              }
              int best = n;
              for (auto& kv : info) {
                  auto& e = kv.second;
                  int g = max(e[2], e[0] + n - e[1]);
                  best = min(best, g / 2);
              }
              return best;
          }
        `,
        c: code`
          static int* msNums;

          static int msCmp(const void* a, const void* b) {
              int i = *(const int*) a, j = *(const int*) b;
              if (msNums[i] != msNums[j]) return msNums[i] < msNums[j] ? -1 : 1;
              return i - j;
          }

          int minimumSeconds(int* nums, int numsSize) {
              // Indices sorted by (value, index): each value's occurrences become one ascending run.
              int n = numsSize;
              int* idx = (int*) malloc(sizeof(int) * n);
              for (int i = 0; i < n; i++) idx[i] = i;
              msNums = nums;
              qsort(idx, n, sizeof(int), msCmp);
              int best = n;
              int s = 0;
              while (s < n) {
                  int e = s;
                  int gap = 0;
                  while (e + 1 < n && nums[idx[e + 1]] == nums[idx[s]]) {
                      if (idx[e + 1] - idx[e] > gap) gap = idx[e + 1] - idx[e];
                      e++;
                  }
                  int wrap = idx[s] + n - idx[e];
                  if (wrap > gap) gap = wrap;
                  if (gap / 2 < best) best = gap / 2;
                  s = e + 1;
              }
              free(idx);
              return best;
          }
        `,
        csharp: code`
          public static int MinimumSeconds(int[] nums)
          {
              int n = nums.Length;
              var info = new Dictionary<int, int[]>(); // value -> {first, last, gap}
              for (int i = 0; i < n; i++)
              {
                  if (!info.TryGetValue(nums[i], out var e))
                  {
                      info[nums[i]] = new int[] { i, i, 0 };
                  }
                  else
                  {
                      e[2] = Math.Max(e[2], i - e[1]);
                      e[1] = i;
                  }
              }
              int best = n;
              foreach (var e in info.Values)
              {
                  int g = Math.Max(e[2], e[0] + n - e[1]);
                  best = Math.Min(best, g / 2);
              }
              return best;
          }
        `,
        go: code`
          func minimumSeconds(nums []int) int {
              n := len(nums)
              info := map[int][]int{} // value -> {first, last, gap}
              for i, v := range nums {
                  e, ok := info[v]
                  if !ok {
                      info[v] = []int{i, i, 0}
                  } else {
                      if i-e[1] > e[2] {
                          e[2] = i - e[1]
                      }
                      e[1] = i
                  }
              }
              best := n
              for _, e := range info {
                  g := e[2]
                  if e[0]+n-e[1] > g {
                      g = e[0] + n - e[1]
                  }
                  if g/2 < best {
                      best = g / 2
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun minimumSeconds(nums: IntArray): Int {
              val n = nums.size
              val info = HashMap<Int, IntArray>() // value -> {first, last, gap}
              for (i in 0 until n) {
                  val e = info[nums[i]]
                  if (e == null) {
                      info[nums[i]] = intArrayOf(i, i, 0)
                  } else {
                      e[2] = maxOf(e[2], i - e[1])
                      e[1] = i
                  }
              }
              var best = n
              for (e in info.values) {
                  val g = maxOf(e[2], e[0] + n - e[1])
                  best = minOf(best, g / 2)
              }
              return best
          }
        `,
        swift: code`
          func minimumSeconds(_ nums: [Int]) -> Int {
              let n = nums.count
              var first = [Int: Int](), last = [Int: Int](), gap = [Int: Int]()
              for i in 0..<n {
                  let v = nums[i]
                  if let l = last[v] {
                      gap[v] = max(gap[v]!, i - l)
                  } else {
                      first[v] = i
                      gap[v] = 0
                  }
                  last[v] = i
              }
              var best = n
              for (v, f) in first {
                  let g = max(gap[v]!, f + n - last[v]!)
                  best = min(best, g / 2)
              }
              return best
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn minimumSeconds(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut info: HashMap<i32, (usize, usize, usize)> = HashMap::new(); // first, last, gap
              for (i, &v) in nums.iter().enumerate() {
                  let e = info.entry(v).or_insert((i, i, 0));
                  if i - e.1 > e.2 {
                      e.2 = i - e.1;
                  }
                  e.1 = i;
              }
              let mut best = n;
              for &(f, l, g) in info.values() {
                  let gap = g.max(f + n - l);
                  best = best.min(gap / 2);
              }
              best as i32
          }
        `,
        php: code`
          function minimumSeconds($nums) {
              $n = count($nums);
              $first = [];
              $last = [];
              $gap = [];
              for ($i = 0; $i < $n; $i++) {
                  $v = $nums[$i];
                  if (isset($last[$v])) {
                      $gap[$v] = max($gap[$v], $i - $last[$v]);
                  } else {
                      $first[$v] = $i;
                      $gap[$v] = 0;
                  }
                  $last[$v] = $i;
              }
              $best = $n;
              foreach ($first as $v => $f) {
                  $g = max($gap[$v], $f + $n - $last[$v]);
                  $best = min($best, intdiv($g, 2));
              }
              return $best;
          }
        `,
        ruby: code`
          def minimumSeconds(nums)
            n = nums.length
            first = {}
            last = {}
            gap = {}
            nums.each_with_index do |v, i|
              if last.key?(v)
                gap[v] = [gap[v], i - last[v]].max
              else
                first[v] = i
                gap[v] = 0
              end
              last[v] = i
            end
            best = n
            first.each do |v, f|
              g = [gap[v], f + n - last[v]].max
              best = [best, g / 2].min
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Max Pair Sum in an Array (LC 2815) ──────────────────────────
  (() => {
    const maxDigit = (x: number) => Math.max(...String(x).split("").map(Number));
    const ref = (nums: number[]) => {
      let best = -1;
      for (let i = 0; i < nums.length; i++)
        for (let j = i + 1; j < nums.length; j++)
          if (maxDigit(nums[i]) === maxDigit(nums[j])) best = Math.max(best, nums[i] + nums[j]);
      return best;
    };
    return {
      slug: "max-pair-sum-in-an-array",
      title: "Max Pair Sum in an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Amazon"],
      signature: { funcName: "maxSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums`. Choose two numbers at **different** indices whose **largest digits are equal** — for example 2373 and 3714 both have largest digit 7.\n\nReturn the **maximum** sum of such a pair, or `-1` if no pair qualifies.",
        [
          { in: "nums = [112,131,411]", out: "-1", note: "The largest digits are 2, 3 and 4 — all different." },
          { in: "nums = [2536,1613,3366,162]", out: "5902", note: "2536 and 3366 both have largest digit 6, and their sum 5902 beats every other qualifying pair." },
          { in: "nums = [51,71,17,24,42]", out: "88", note: "71 and 17 share the largest digit 7." },
        ],
        ["2 <= nums.length <= 100", "1 <= nums[i] <= 10^4"]),
      hints: [
        "Group the numbers by their largest digit. Only numbers in the same group can pair.",
        "Within a group, the best pair is simply its two largest numbers.",
        "In one pass, keep for every digit 0–9 the largest number seen so far with that largest digit. Each new number tries to pair with that stored value before possibly replacing it.",
      ],
      editorial: explain({
        idea: "There are only ten possible largest digits. For each, the best pair is the two largest numbers in that group, which a single pass with a ten-slot array of running maxima finds.",
        steps: [
          "Let `best[d] = 0` for every digit `d`, and `answer = -1`.",
          "For each `x`, compute its largest digit `d` by peeling off digits with `% 10`.",
          "If `best[d] > 0`, set `answer = max(answer, best[d] + x)`.",
          "Set `best[d] = max(best[d], x)`. Return `answer`.",
        ],
        why: "When `x` arrives, pairing it with the largest earlier member of its group is the best pair that has `x` as its later element; every pair is considered when its later element arrives, so the maximum over all `x` is the maximum over all pairs.",
        time: "O(n · log10(max))",
        space: "O(1)",
        pitfalls: [
          "A pair needs two different indices — compare against the stored maximum *before* updating it with `x`.",
          "Return `-1` (not 0) when no group has two members.",
        ],
      }),
      examples: [
        { input: "[112,131,411]", expectedOutput: "-1" },
        { input: "[2536,1613,3366,162]", expectedOutput: "5902" },
        { input: "[51,71,17,24,42]", expectedOutput: "88" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, pick(rng, [2, 5, 20, 100]));
        const top = pick(rng, [9, 99, 1000, 10000]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maxSum(nums: List[int]) -> int:
              best = [0] * 10
              answer = -1
              for x in nums:
                  d = max(int(c) for c in str(x))
                  if best[d] > 0:
                      answer = max(answer, best[d] + x)
                  best[d] = max(best[d], x)
              return answer
        `,
        javascript: code`
          var maxSum = function(nums) {
              var best = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              var answer = -1;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i], d = 0, t = x;
                  while (t > 0) { if (t % 10 > d) d = t % 10; t = Math.floor(t / 10); }
                  if (best[d] > 0 && best[d] + x > answer) answer = best[d] + x;
                  if (x > best[d]) best[d] = x;
              }
              return answer;
          };
        `,
        typescript: code`
          function maxSum(nums: number[]): number {
              var best = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
              var answer = -1;
              for (var i = 0; i < nums.length; i++) {
                  var x = nums[i], d = 0, t = x;
                  while (t > 0) { if (t % 10 > d) d = t % 10; t = Math.floor(t / 10); }
                  if (best[d] > 0 && best[d] + x > answer) answer = best[d] + x;
                  if (x > best[d]) best[d] = x;
              }
              return answer;
          }
        `,
        java: code`
          public static int maxSum(int[] nums) {
              int[] best = new int[10];
              int answer = -1;
              for (int x : nums) {
                  int d = 0;
                  for (int t = x; t > 0; t /= 10) d = Math.max(d, t % 10);
                  if (best[d] > 0) answer = Math.max(answer, best[d] + x);
                  best[d] = Math.max(best[d], x);
              }
              return answer;
          }
        `,
        cpp: code`
          int maxSum(vector<int>& nums) {
              int best[10] = {0};
              int answer = -1;
              for (int x : nums) {
                  int d = 0;
                  for (int t = x; t > 0; t /= 10) d = max(d, t % 10);
                  if (best[d] > 0) answer = max(answer, best[d] + x);
                  best[d] = max(best[d], x);
              }
              return answer;
          }
        `,
        c: code`
          int maxSum(int* nums, int numsSize) {
              int best[10] = {0};
              int answer = -1;
              for (int i = 0; i < numsSize; i++) {
                  int x = nums[i], d = 0;
                  for (int t = x; t > 0; t /= 10) if (t % 10 > d) d = t % 10;
                  if (best[d] > 0 && best[d] + x > answer) answer = best[d] + x;
                  if (x > best[d]) best[d] = x;
              }
              return answer;
          }
        `,
        csharp: code`
          public static int MaxSum(int[] nums)
          {
              var best = new int[10];
              int answer = -1;
              foreach (int x in nums)
              {
                  int d = 0;
                  for (int t = x; t > 0; t /= 10) d = Math.Max(d, t % 10);
                  if (best[d] > 0) answer = Math.Max(answer, best[d] + x);
                  best[d] = Math.Max(best[d], x);
              }
              return answer;
          }
        `,
        go: code`
          func maxSum(nums []int) int {
              best := make([]int, 10)
              answer := -1
              for _, x := range nums {
                  d := 0
                  for t := x; t > 0; t /= 10 {
                      if t%10 > d {
                          d = t % 10
                      }
                  }
                  if best[d] > 0 && best[d]+x > answer {
                      answer = best[d] + x
                  }
                  if x > best[d] {
                      best[d] = x
                  }
              }
              return answer
          }
        `,
        kotlin: code`
          fun maxSum(nums: IntArray): Int {
              val best = IntArray(10)
              var answer = -1
              for (x in nums) {
                  var d = 0
                  var t = x
                  while (t > 0) { d = maxOf(d, t % 10); t /= 10 }
                  if (best[d] > 0) answer = maxOf(answer, best[d] + x)
                  best[d] = maxOf(best[d], x)
              }
              return answer
          }
        `,
        swift: code`
          func maxSum(_ nums: [Int]) -> Int {
              var best = [Int](repeating: 0, count: 10)
              var answer = -1
              for x in nums {
                  var d = 0, t = x
                  while t > 0 { d = max(d, t % 10); t /= 10 }
                  if best[d] > 0 { answer = max(answer, best[d] + x) }
                  best[d] = max(best[d], x)
              }
              return answer
          }
        `,
        rust: code`
          fn maxSum(nums: Vec<i32>) -> i32 {
              let mut best = [0i32; 10];
              let mut answer = -1;
              for &x in nums.iter() {
                  let mut d = 0;
                  let mut t = x;
                  while t > 0 {
                      d = d.max(t % 10);
                      t /= 10;
                  }
                  let d = d as usize;
                  if best[d] > 0 {
                      answer = answer.max(best[d] + x);
                  }
                  best[d] = best[d].max(x);
              }
              answer
          }
        `,
        php: code`
          function maxSum($nums) {
              $best = array_fill(0, 10, 0);
              $answer = -1;
              foreach ($nums as $x) {
                  $d = 0;
                  for ($t = $x; $t > 0; $t = intdiv($t, 10)) $d = max($d, $t % 10);
                  if ($best[$d] > 0) $answer = max($answer, $best[$d] + $x);
                  $best[$d] = max($best[$d], $x);
              }
              return $answer;
          }
        `,
        ruby: code`
          def maxSum(nums)
            best = Array.new(10, 0)
            answer = -1
            nums.each do |x|
              d = x.digits.max
              answer = [answer, best[d] + x].max if best[d] > 0
              best[d] = [best[d], x].max
            end
            answer
          end
        `,
      },
    };
  })(),

  // ── Check if Strings Can be Made Equal With Operations II (LC 2840)
  (() => {
    const ref = (s1: string, s2: string) => {
      const key = (s: string, p: number) => s.split("").filter((_, i) => i % 2 === p).sort().join("");
      return key(s1, 0) === key(s2, 0) && key(s1, 1) === key(s2, 1);
    };
    return {
      slug: "check-if-strings-can-be-made-equal-with-operations-ii",
      title: "Check if Strings Can be Made Equal With Operations II",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Sorting", "Google"],
      signature: { funcName: "checkStrings", params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "You are given two strings `s1` and `s2` of the same length `n`, made of lowercase English letters.\n\nYou may apply the following operation to **either** string, any number of times: choose indices `i < j` such that `j - i` is **even**, and swap the characters at those indices.\n\nReturn `true` if you can make the two strings equal, and `false` otherwise.",
        [
          { in: 's1 = "abcdba", s2 = "cabdab"', out: "true", note: "In `s1`, swapping indices 0 and 2 gives `cbadba`, then 2 and 4 gives `cbbdaa`, then 1 and 5 gives `cabdab`." },
          { in: 's1 = "abe", s2 = "bea"', out: "false", note: "The even positions of `s1` hold `a, e`, but those of `s2` hold `b, a`." },
          { in: 's1 = "kata", s2 = "taka"', out: "true" },
        ],
        ["n == s1.length == s2.length", "1 <= n <= 10^5", "s1 and s2 consist only of lowercase English letters"]),
      hints: [
        "A swap across an even distance never moves a character between an even index and an odd index.",
        "Within the even indices, any permutation is reachable — adjacent even positions differ by 2, and adjacent swaps generate every permutation. The same holds for the odd indices.",
        "So the strings can be made equal exactly when the letters at even indices match as multisets, and the letters at odd indices match as multisets. Count letters per parity.",
      ],
      editorial: explain({
        idea: "Even-distance swaps preserve each character's index parity, and they can rearrange the even-indexed characters (and separately the odd-indexed ones) arbitrarily. So each string is characterised by two multisets — and the strings can meet iff both multisets agree.",
        steps: [
          "Keep two arrays of 26 counters, `even` and `odd`.",
          "For each index `i`, add 1 for `s1[i]` and subtract 1 for `s2[i]` in the counter array of `i`'s parity.",
          "Return `true` iff every counter ends at zero.",
        ],
        why: "Parity is invariant, so differing multisets on either parity make equality impossible. Conversely, swapping positions `i` and `i + 2` is allowed, and adjacent transpositions of a sequence generate all its permutations, so each parity class of `s1` can be sorted into the order `s2` needs — only `s1` ever has to move.",
        time: "O(n)",
        space: "O(1) (52 counters)",
        pitfalls: [
          "Comparing the whole strings' letter counts ignores parity — `ab` and `ba` have equal counts but cannot be made equal.",
          "Sorting each parity class also works but costs `O(n log n)`.",
        ],
      }),
      examples: [
        { input: '"abcdba"\n"cabdab"', expectedOutput: "true" },
        { input: '"abe"\n"bea"', expectedOutput: "false" },
        { input: '"kata"\n"taka"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["ab", "abc", "abcdefghij", "abcdefghijklmnopqrstuvwxyz"]);
        const s1 = randLower(rng, 1, pick(rng, [1, 4, 10, 30]), alpha);
        const n = s1.length;
        const ev: string[] = [], od: string[] = [];
        for (let i = 0; i < n; i++) (i % 2 === 0 ? ev : od).push(s1[i]);
        shuffle(rng, ev); shuffle(rng, od);
        const arr: string[] = [];
        for (let i = 0; i < n; i++) arr.push(i % 2 === 0 ? ev[i >> 1] : od[i >> 1]);
        const mode = ri(rng, 0, 3);
        if (mode === 1) arr[ri(rng, 0, n - 1)] = alpha[ri(rng, 0, alpha.length - 1)];
        else if (mode === 2 && n >= 2) { const i = ri(rng, 0, n - 2); const t = arr[i]; arr[i] = arr[i + 1]; arr[i + 1] = t; }
        const s2 = arr.join("");
        return { input: `"${s1}"\n"${s2}"`, expectedOutput: String(ref(s1, s2)) };
      },
      solutions: {
        python: code`
          def checkStrings(s1: str, s2: str) -> bool:
              cnt = [[0] * 26 for _ in range(2)]
              for i, (a, b) in enumerate(zip(s1, s2)):
                  cnt[i & 1][ord(a) - 97] += 1
                  cnt[i & 1][ord(b) - 97] -= 1
              return all(v == 0 for row in cnt for v in row)
        `,
        javascript: code`
          var checkStrings = function(s1, s2) {
              var cnt = new Array(52).fill(0);
              for (var i = 0; i < s1.length; i++) {
                  var base = (i & 1) * 26;
                  cnt[base + s1.charCodeAt(i) - 97]++;
                  cnt[base + s2.charCodeAt(i) - 97]--;
              }
              for (var k = 0; k < 52; k++) if (cnt[k] !== 0) return false;
              return true;
          };
        `,
        typescript: code`
          function checkStrings(s1: string, s2: string): boolean {
              var cnt: number[] = [];
              for (var k = 0; k < 52; k++) cnt.push(0);
              for (var i = 0; i < s1.length; i++) {
                  var base = (i & 1) * 26;
                  cnt[base + s1.charCodeAt(i) - 97]++;
                  cnt[base + s2.charCodeAt(i) - 97]--;
              }
              for (var j = 0; j < 52; j++) if (cnt[j] !== 0) return false;
              return true;
          }
        `,
        java: code`
          public static boolean checkStrings(String s1, String s2) {
              int[] cnt = new int[52];
              for (int i = 0; i < s1.length(); i++) {
                  int base = (i & 1) * 26;
                  cnt[base + s1.charAt(i) - 'a']++;
                  cnt[base + s2.charAt(i) - 'a']--;
              }
              for (int v : cnt) if (v != 0) return false;
              return true;
          }
        `,
        cpp: code`
          bool checkStrings(string s1, string s2) {
              int cnt[52] = {0};
              for (size_t i = 0; i < s1.size(); i++) {
                  int base = (i & 1) * 26;
                  cnt[base + s1[i] - 'a']++;
                  cnt[base + s2[i] - 'a']--;
              }
              for (int v : cnt) if (v != 0) return false;
              return true;
          }
        `,
        c: code`
          bool checkStrings(const char* s1, const char* s2) {
              int cnt[52];
              memset(cnt, 0, sizeof(cnt));
              for (int i = 0; s1[i] != '\0'; i++) {
                  int base = (i & 1) * 26;
                  cnt[base + s1[i] - 'a']++;
                  cnt[base + s2[i] - 'a']--;
              }
              for (int k = 0; k < 52; k++) if (cnt[k] != 0) return false;
              return true;
          }
        `,
        csharp: code`
          public static bool CheckStrings(string s1, string s2)
          {
              var cnt = new int[52];
              for (int i = 0; i < s1.Length; i++)
              {
                  int bas = (i & 1) * 26;
                  cnt[bas + s1[i] - 'a']++;
                  cnt[bas + s2[i] - 'a']--;
              }
              foreach (int v in cnt) if (v != 0) return false;
              return true;
          }
        `,
        go: code`
          func checkStrings(s1 string, s2 string) bool {
              var cnt [52]int
              for i := 0; i < len(s1); i++ {
                  base := (i & 1) * 26
                  cnt[base+int(s1[i]-'a')]++
                  cnt[base+int(s2[i]-'a')]--
              }
              for _, v := range cnt {
                  if v != 0 {
                      return false
                  }
              }
              return true
          }
        `,
        kotlin: code`
          fun checkStrings(s1: String, s2: String): Boolean {
              val cnt = IntArray(52)
              for (i in s1.indices) {
                  val base = (i and 1) * 26
                  cnt[base + (s1[i] - 'a')]++
                  cnt[base + (s2[i] - 'a')]--
              }
              return cnt.all { it == 0 }
          }
        `,
        swift: code`
          func checkStrings(_ s1: String, _ s2: String) -> Bool {
              let a = Array(s1.utf8), b = Array(s2.utf8)
              var cnt = [Int](repeating: 0, count: 52)
              for i in 0..<a.count {
                  let base = (i & 1) * 26
                  cnt[base + Int(a[i]) - 97] += 1
                  cnt[base + Int(b[i]) - 97] -= 1
              }
              return cnt.allSatisfy { $0 == 0 }
          }
        `,
        rust: code`
          fn checkStrings(s1: String, s2: String) -> bool {
              let (a, b) = (s1.as_bytes(), s2.as_bytes());
              let mut cnt = [0i32; 52];
              for i in 0..a.len() {
                  let base = (i & 1) * 26;
                  cnt[base + (a[i] - b'a') as usize] += 1;
                  cnt[base + (b[i] - b'a') as usize] -= 1;
              }
              cnt.iter().all(|&v| v == 0)
          }
        `,
        php: code`
          function checkStrings($s1, $s2) {
              $cnt = array_fill(0, 52, 0);
              $n = strlen($s1);
              for ($i = 0; $i < $n; $i++) {
                  $base = ($i & 1) * 26;
                  $cnt[$base + ord($s1[$i]) - 97]++;
                  $cnt[$base + ord($s2[$i]) - 97]--;
              }
              foreach ($cnt as $v) if ($v != 0) return false;
              return true;
          }
        `,
        ruby: code`
          def checkStrings(s1, s2)
            cnt = Array.new(52, 0)
            a = s1.bytes
            b = s2.bytes
            a.each_index do |i|
              base = (i & 1) * 26
              cnt[base + a[i] - 97] += 1
              cnt[base + b[i] - 97] -= 1
            end
            cnt.all? { |v| v == 0 }
          end
        `,
      },
    };
  })(),

  // ── Count Pairs of Points With Distance k (LC 2857) ─────────────
  (() => {
    const ref = (pts: number[][], k: number) => {
      let c = 0;
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++)
          if (((pts[i][0] ^ pts[j][0]) + (pts[i][1] ^ pts[j][1])) === k) c++;
      return c;
    };
    return {
      slug: "count-pairs-of-points-with-distance-k",
      title: "Count Pairs of Points With Distance k",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Bit Manipulation", "Google"],
      signature: { funcName: "countPairs", params: [{ name: "coordinates", type: "int[][]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a 2D integer array `coordinates`, where `coordinates[i] = [xi, yi]` is a point in the plane, and an integer `k`.\n\nDefine the **distance** between points `(x1, y1)` and `(x2, y2)` as `(x1 XOR x2) + (y1 XOR y2)`, where XOR is the bitwise exclusive-or.\n\nReturn the number of pairs `(i, j)` with `i < j` whose distance is exactly `k`.",
        [
          { in: "coordinates = [[1,2],[4,2],[1,3],[5,2]], k = 5", out: "2", note: "`(1,2)`–`(4,2)` gives `5 + 0` and `(1,3)`–`(5,2)` gives `4 + 1`." },
          { in: "coordinates = [[1,3],[1,3],[1,3],[1,3],[1,3]], k = 0", out: "10", note: "Every one of the 10 pairs of identical points is at distance 0." },
          { in: "coordinates = [[0,0],[3,5]], k = 8", out: "1" },
        ],
        ["2 <= coordinates.length <= 5 * 10^4", "0 <= xi, yi <= 10^6", "0 <= k <= 100"]),
      hints: [
        "Checking all pairs is quadratic. But `k` is tiny — at most 100.",
        "If the distance is `k`, then `x1 XOR x2 = a` and `y1 XOR y2 = k - a` for some `a` in `0..k`.",
        "XOR is invertible: given `(x1, y1)` and `a`, the partner must be exactly `(x1 XOR a, y1 XOR (k - a))`. Look that point up in a hash map of the points seen so far.",
      ],
      editorial: explain({
        idea: "Split `k` as `a + (k - a)`. For a fixed point and a fixed split, the partner point is fully determined by XOR, so a hash map of earlier points answers each of the `k + 1` splits in O(1).",
        steps: [
          "Keep a hash map `cnt` from point to how many times it has appeared so far.",
          "For each point `(x, y)` in order, and each `a` from 0 to `k`, add `cnt[(x XOR a, y XOR (k - a))]` to the answer.",
          "Then increment `cnt[(x, y)]`.",
          "Return the answer.",
        ],
        why: "Both XOR terms are non-negative, so a distance of `k` means `x1 XOR x2 = a` for exactly one `a` in `0..k`, with `y1 XOR y2 = k - a`. Since `x2 = x1 XOR a` and `y2 = y1 XOR (k - a)`, each pair is counted once for its one split, when its later point is processed.",
        time: "O(n · k)",
        space: "O(n)",
        pitfalls: [
          "The splits are disjoint because `a` determines `x1 XOR x2`; no pair is counted twice.",
          "Encode a point as one 64-bit key (`x · 2^20 + y`) or a pair — coordinates go up to 10^6.",
          "Look up before inserting, so with `k = 0` a point never pairs with itself.",
        ],
      }),
      examples: [
        { input: "[[1,2],[4,2],[1,3],[5,2]]\n5", expectedOutput: "2" },
        { input: "[[1,3],[1,3],[1,3],[1,3],[1,3]]\n0", expectedOutput: "10" },
        { input: "[[0,0],[3,5]]\n8", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const mode = ri(rng, 0, 9);
        const k = mode < 7 ? ri(rng, 0, 8) : mode < 9 ? ri(rng, 0, 30) : ri(rng, 0, 100);
        const n = ri(rng, 2, k > 30 ? 12 : pick(rng, [3, 10, 25, 40]));
        const top = pick(rng, [3, 7, 15, 63, 1000000]);
        const pts: number[][] = [];
        for (let i = 0; i < n; i++) {
          if (pts.length > 0 && rng() < 0.4) {
            const [px, py] = pts[ri(rng, 0, pts.length - 1)];
            const a = ri(rng, 0, k);
            pts.push([Math.min(1000000, px ^ a), Math.min(1000000, py ^ (k - a))]);
          } else pts.push([ri(rng, 0, top), ri(rng, 0, top)]);
        }
        return { input: `${fmtIntMat(pts)}\n${k}`, expectedOutput: String(ref(pts, k)) };
      },
      solutions: {
        python: code`
          from typing import List

          def countPairs(coordinates: List[List[int]], k: int) -> int:
              cnt = {}
              total = 0
              for x, y in coordinates:
                  for a in range(k + 1):
                      total += cnt.get((x ^ a, y ^ (k - a)), 0)
                  cnt[(x, y)] = cnt.get((x, y), 0) + 1
              return total
        `,
        javascript: code`
          var countPairs = function(coordinates, k) {
              var cnt = new Map();
              var total = 0;
              for (var i = 0; i < coordinates.length; i++) {
                  var x = coordinates[i][0], y = coordinates[i][1];
                  for (var a = 0; a <= k; a++) {
                      var got = cnt.get((x ^ a) * 1048576 + (y ^ (k - a)));
                      if (got !== undefined) total += got;
                  }
                  var key = x * 1048576 + y;
                  var prev = cnt.get(key);
                  cnt.set(key, (prev === undefined ? 0 : prev) + 1);
              }
              return total;
          };
        `,
        typescript: code`
          function countPairs(coordinates: number[][], k: number): number {
              var cnt: { [key: string]: number } = {};
              var total = 0;
              for (var i = 0; i < coordinates.length; i++) {
                  var x = coordinates[i][0], y = coordinates[i][1];
                  for (var a = 0; a <= k; a++) {
                      var probe = (x ^ a) + "," + (y ^ (k - a));
                      if (cnt.hasOwnProperty(probe)) total += cnt[probe];
                  }
                  var key = x + "," + y;
                  cnt[key] = (cnt.hasOwnProperty(key) ? cnt[key] : 0) + 1;
              }
              return total;
          }
        `,
        java: code`
          public static int countPairs(int[][] coordinates, int k) {
              HashMap<Long, Integer> cnt = new HashMap<>();
              int total = 0;
              for (int[] p : coordinates) {
                  int x = p[0], y = p[1];
                  for (int a = 0; a <= k; a++) {
                      Integer got = cnt.get(((long) (x ^ a) << 20) | (y ^ (k - a)));
                      if (got != null) total += got;
                  }
                  cnt.merge(((long) x << 20) | y, 1, Integer::sum);
              }
              return total;
          }
        `,
        cpp: code`
          int countPairs(vector<vector<int>>& coordinates, int k) {
              unordered_map<long long, int> cnt;
              int total = 0;
              for (auto& p : coordinates) {
                  int x = p[0], y = p[1];
                  for (int a = 0; a <= k; a++) {
                      auto it = cnt.find(((long long) (x ^ a) << 20) | (y ^ (k - a)));
                      if (it != cnt.end()) total += it->second;
                  }
                  cnt[((long long) x << 20) | y]++;
              }
              return total;
          }
        `,
        c: code`
          static int cpCmp(const void* a, const void* b) {
              long long x = *(const long long*) a, y = *(const long long*) b;
              return (x > y) - (x < y);
          }

          static int cpCount(const long long* keys, int n, long long v) {
              int lo = 0, hi = n;
              while (lo < hi) { int mid = (lo + hi) / 2; if (keys[mid] < v) lo = mid + 1; else hi = mid; }
              int first = lo;
              hi = n;
              while (lo < hi) { int mid = (lo + hi) / 2; if (keys[mid] <= v) lo = mid + 1; else hi = mid; }
              return lo - first;
          }

          int countPairs(int** coordinates, int coordinatesSize, int* coordinatesColSize, int k) {
              // Count ordered pairs (i != j) against the sorted key list, then halve.
              int n = coordinatesSize;
              long long* keys = (long long*) malloc(sizeof(long long) * n);
              for (int i = 0; i < n; i++) keys[i] = ((long long) coordinates[i][0] << 20) | coordinates[i][1];
              qsort(keys, n, sizeof(long long), cpCmp);
              long long total = 0;
              for (int i = 0; i < n; i++) {
                  int x = coordinates[i][0], y = coordinates[i][1];
                  for (int a = 0; a <= k; a++) {
                      total += cpCount(keys, n, ((long long) (x ^ a) << 20) | (y ^ (k - a)));
                  }
                  if (k == 0) total -= 1; // the point itself
              }
              free(keys);
              return (int) (total / 2);
          }
        `,
        csharp: code`
          public static int CountPairs(int[][] coordinates, int k)
          {
              var cnt = new Dictionary<long, int>();
              int total = 0;
              foreach (var p in coordinates)
              {
                  int x = p[0], y = p[1];
                  for (int a = 0; a <= k; a++)
                  {
                      if (cnt.TryGetValue(((long) (x ^ a) << 20) | (long) (y ^ (k - a)), out int got)) total += got;
                  }
                  long key = ((long) x << 20) | (long) y;
                  cnt.TryGetValue(key, out int prev);
                  cnt[key] = prev + 1;
              }
              return total;
          }
        `,
        go: code`
          func countPairs(coordinates [][]int, k int) int {
              cnt := map[int]int{}
              total := 0
              for _, p := range coordinates {
                  x, y := p[0], p[1]
                  for a := 0; a <= k; a++ {
                      total += cnt[(x^a)<<20|(y^(k-a))]
                  }
                  cnt[x<<20|y]++
              }
              return total
          }
        `,
        kotlin: code`
          fun countPairs(coordinates: Array<IntArray>, k: Int): Int {
              val cnt = HashMap<Long, Int>()
              var total = 0
              for (p in coordinates) {
                  val x = p[0]
                  val y = p[1]
                  for (a in 0..k) {
                      val got = cnt[((x xor a).toLong() shl 20) or (y xor (k - a)).toLong()]
                      if (got != null) total += got
                  }
                  val key = (x.toLong() shl 20) or y.toLong()
                  cnt[key] = (cnt[key] ?: 0) + 1
              }
              return total
          }
        `,
        swift: code`
          func countPairs(_ coordinates: [[Int]], _ k: Int) -> Int {
              var cnt = [Int: Int]()
              var total = 0
              for p in coordinates {
                  let x = p[0], y = p[1]
                  for a in 0...k {
                      total += cnt[((x ^ a) << 20) | (y ^ (k - a)), default: 0]
                  }
                  cnt[(x << 20) | y, default: 0] += 1
              }
              return total
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn countPairs(coordinates: Vec<Vec<i32>>, k: i32) -> i32 {
              let mut cnt: HashMap<i64, i32> = HashMap::new();
              let mut total = 0;
              for p in coordinates.iter() {
                  let (x, y) = (p[0], p[1]);
                  for a in 0..=k {
                      let key = (((x ^ a) as i64) << 20) | ((y ^ (k - a)) as i64);
                      if let Some(&got) = cnt.get(&key) {
                          total += got;
                      }
                  }
                  *cnt.entry(((x as i64) << 20) | (y as i64)).or_insert(0) += 1;
              }
              total
          }
        `,
        php: code`
          function countPairs($coordinates, $k) {
              $cnt = [];
              $total = 0;
              foreach ($coordinates as $p) {
                  $x = $p[0];
                  $y = $p[1];
                  for ($a = 0; $a <= $k; $a++) {
                      $key = (($x ^ $a) << 20) | ($y ^ ($k - $a));
                      if (isset($cnt[$key])) $total += $cnt[$key];
                  }
                  $key = ($x << 20) | $y;
                  $cnt[$key] = ($cnt[$key] ?? 0) + 1;
              }
              return $total;
          }
        `,
        ruby: code`
          def countPairs(coordinates, k)
            cnt = Hash.new(0)
            total = 0
            coordinates.each do |x, y|
              (0..k).each do |a|
                total += cnt[((x ^ a) << 20) | (y ^ (k - a))]
              end
              cnt[(x << 20) | y] += 1
            end
            total
          end
        `,
      },
    };
  })(),

  // ── Subarrays Distinct Element Sum of Squares I (LC 2913) ───────
  (() => {
    const ref = (nums: number[]) => {
      let t = 0;
      for (let i = 0; i < nums.length; i++)
        for (let j = i; j < nums.length; j++) { const d = new Set(nums.slice(i, j + 1)).size; t += d * d; }
      return t;
    };
    return {
      slug: "subarrays-distinct-element-sum-of-squares-i",
      title: "Subarrays Distinct Element Sum of Squares I",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Amazon"],
      signature: { funcName: "sumCounts", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums`. The **distinct count** of a subarray is the number of different values it contains.\n\nReturn the sum of the **squares** of the distinct counts of all non-empty contiguous subarrays of `nums`.",
        [
          { in: "nums = [1,2,1]", out: "15", note: "The six subarrays have distinct counts 1, 1, 1, 2, 2, 2, so the sum is `3 · 1 + 3 · 4 = 15`." },
          { in: "nums = [1,1]", out: "3", note: "`[1]`, `[1]` and `[1,1]` each have one distinct value." },
          { in: "nums = [7]", out: "1" },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i] <= 100"]),
      hints: [
        "With at most 100 elements there are only about 5,000 subarrays.",
        "Fix the left end and extend to the right; a value seen for the first time raises the distinct count by one.",
        "Values are at most 100, so a boolean array of size 101 (cleared for each left end) tracks what has been seen.",
      ],
      editorial: explain({
        idea: "For each left end, grow the subarray one element at a time and keep the number of distinct values with a small `seen` table; add its square for every right end.",
        steps: [
          "For each `i`, clear `seen[0..100]` and set `distinct = 0`.",
          "For each `j >= i`: if `nums[j]` is unseen, mark it and increment `distinct`.",
          "Add `distinct^2` to the total.",
        ],
        why: "Each subarray `nums[i..j]` is visited exactly once, and at that moment `distinct` equals the number of values marked, which are exactly the values of `nums[i..j]`.",
        time: "O(n^2)",
        space: "O(V) with V = 100",
        pitfalls: [
          "Recounting each subarray from scratch costs an extra factor of `n` — fine here, but the incremental count is just as short.",
          "Square the distinct count, not the subarray length.",
        ],
      }),
      examples: [
        { input: "[1,2,1]", expectedOutput: "15" },
        { input: "[1,1]", expectedOutput: "3" },
        { input: "[7]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 20, 60, 100]));
        const top = pick(rng, [1, 3, 10, 100]);
        const nums = Array.from({ length: n }, () => ri(rng, 1, top));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def sumCounts(nums: List[int]) -> int:
              n = len(nums)
              total = 0
              for i in range(n):
                  seen = [False] * 101
                  distinct = 0
                  for j in range(i, n):
                      if not seen[nums[j]]:
                          seen[nums[j]] = True
                          distinct += 1
                      total += distinct * distinct
              return total
        `,
        javascript: code`
          var sumCounts = function(nums) {
              var n = nums.length;
              var total = 0;
              var seen = new Uint8Array(101);
              for (var i = 0; i < n; i++) {
                  seen.fill(0);
                  var distinct = 0;
                  for (var j = i; j < n; j++) {
                      if (!seen[nums[j]]) { seen[nums[j]] = 1; distinct++; }
                      total += distinct * distinct;
                  }
              }
              return total;
          };
        `,
        typescript: code`
          function sumCounts(nums: number[]): number {
              var n = nums.length;
              var total = 0;
              for (var i = 0; i < n; i++) {
                  var seen: boolean[] = [];
                  for (var k = 0; k <= 100; k++) seen.push(false);
                  var distinct = 0;
                  for (var j = i; j < n; j++) {
                      if (!seen[nums[j]]) { seen[nums[j]] = true; distinct++; }
                      total += distinct * distinct;
                  }
              }
              return total;
          }
        `,
        java: code`
          public static int sumCounts(int[] nums) {
              int n = nums.length;
              int total = 0;
              for (int i = 0; i < n; i++) {
                  boolean[] seen = new boolean[101];
                  int distinct = 0;
                  for (int j = i; j < n; j++) {
                      if (!seen[nums[j]]) { seen[nums[j]] = true; distinct++; }
                      total += distinct * distinct;
                  }
              }
              return total;
          }
        `,
        cpp: code`
          int sumCounts(vector<int>& nums) {
              int n = nums.size();
              int total = 0;
              for (int i = 0; i < n; i++) {
                  bool seen[101] = {false};
                  int distinct = 0;
                  for (int j = i; j < n; j++) {
                      if (!seen[nums[j]]) { seen[nums[j]] = true; distinct++; }
                      total += distinct * distinct;
                  }
              }
              return total;
          }
        `,
        c: code`
          int sumCounts(int* nums, int numsSize) {
              int total = 0;
              for (int i = 0; i < numsSize; i++) {
                  bool seen[101];
                  memset(seen, 0, sizeof(seen));
                  int distinct = 0;
                  for (int j = i; j < numsSize; j++) {
                      if (!seen[nums[j]]) { seen[nums[j]] = true; distinct++; }
                      total += distinct * distinct;
                  }
              }
              return total;
          }
        `,
        csharp: code`
          public static int SumCounts(int[] nums)
          {
              int n = nums.Length;
              int total = 0;
              for (int i = 0; i < n; i++)
              {
                  var seen = new bool[101];
                  int distinct = 0;
                  for (int j = i; j < n; j++)
                  {
                      if (!seen[nums[j]]) { seen[nums[j]] = true; distinct++; }
                      total += distinct * distinct;
                  }
              }
              return total;
          }
        `,
        go: code`
          func sumCounts(nums []int) int {
              n := len(nums)
              total := 0
              for i := 0; i < n; i++ {
                  var seen [101]bool
                  distinct := 0
                  for j := i; j < n; j++ {
                      if !seen[nums[j]] {
                          seen[nums[j]] = true
                          distinct++
                      }
                      total += distinct * distinct
                  }
              }
              return total
          }
        `,
        kotlin: code`
          fun sumCounts(nums: IntArray): Int {
              val n = nums.size
              var total = 0
              for (i in 0 until n) {
                  val seen = BooleanArray(101)
                  var distinct = 0
                  for (j in i until n) {
                      if (!seen[nums[j]]) { seen[nums[j]] = true; distinct++ }
                      total += distinct * distinct
                  }
              }
              return total
          }
        `,
        swift: code`
          func sumCounts(_ nums: [Int]) -> Int {
              let n = nums.count
              var total = 0
              for i in 0..<n {
                  var seen = [Bool](repeating: false, count: 101)
                  var distinct = 0
                  for j in i..<n {
                      if !seen[nums[j]] { seen[nums[j]] = true; distinct += 1 }
                      total += distinct * distinct
                  }
              }
              return total
          }
        `,
        rust: code`
          fn sumCounts(nums: Vec<i32>) -> i32 {
              let n = nums.len();
              let mut total = 0;
              for i in 0..n {
                  let mut seen = [false; 101];
                  let mut distinct = 0;
                  for j in i..n {
                      let v = nums[j] as usize;
                      if !seen[v] {
                          seen[v] = true;
                          distinct += 1;
                      }
                      total += distinct * distinct;
                  }
              }
              total
          }
        `,
        php: code`
          function sumCounts($nums) {
              $n = count($nums);
              $total = 0;
              for ($i = 0; $i < $n; $i++) {
                  $seen = array_fill(0, 101, false);
                  $distinct = 0;
                  for ($j = $i; $j < $n; $j++) {
                      if (!$seen[$nums[$j]]) { $seen[$nums[$j]] = true; $distinct++; }
                      $total += $distinct * $distinct;
                  }
              }
              return $total;
          }
        `,
        ruby: code`
          def sumCounts(nums)
            n = nums.length
            total = 0
            (0...n).each do |i|
              seen = Array.new(101, false)
              distinct = 0
              (i...n).each do |j|
                unless seen[nums[j]]
                  seen[nums[j]] = true
                  distinct += 1
                end
                total += distinct * distinct
              end
            end
            total
          end
        `,
      },
    };
  })(),


  // ── Find Common Elements Between Two Arrays (LC 2956) ───────────
  (() => {
    const ref = (a: number[], b: number[]) => [a.filter((x) => b.includes(x)).length, b.filter((x) => a.includes(x)).length];
    return {
      slug: "find-common-elements-between-two-arrays",
      title: "Find Common Elements Between Two Arrays",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Amazon"],
      signature: { funcName: "findIntersectionValues", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given two integer arrays `nums1` and `nums2`.\n\nReturn an array `[answer1, answer2]` where:\n\n- `answer1` is the number of indices `i` such that `nums1[i]` occurs somewhere in `nums2`;\n- `answer2` is the number of indices `i` such that `nums2[i]` occurs somewhere in `nums1`.\n\nRepeated values are counted once per index.",
        [
          { in: "nums1 = [2,3,2], nums2 = [1,2]", out: "[2,1]", note: "Both 2s of `nums1` occur in `nums2`; in `nums2` only the 2 occurs in `nums1`." },
          { in: "nums1 = [4,3,2,3,1], nums2 = [2,2,5,2,3,6]", out: "[3,4]" },
          { in: "nums1 = [3,4,2,3], nums2 = [1,5]", out: "[0,0]" },
        ],
        ["1 <= nums1.length, nums2.length <= 100", "1 <= nums1[i], nums2[i] <= 100"]),
      hints: [
        "For each element you only need a yes/no answer: does its value appear in the other array?",
        "Build a membership table (a set, or a boolean array since values are at most 100) for each array.",
        "Then count the indices of each array whose value is marked in the other array's table.",
      ],
      editorial: explain({
        idea: "Membership is all that matters, so precompute which values each array contains and count the indices whose value the other array contains.",
        steps: [
          "Mark `in1[v] = true` for every `v` in `nums1`, and `in2[v] = true` for every `v` in `nums2`.",
          "`answer1` = number of `i` with `in2[nums1[i]]`; `answer2` = number of `i` with `in1[nums2[i]]`.",
          "Return `[answer1, answer2]`.",
        ],
        why: "Each index is checked once against the exact set of values of the other array, so it is counted precisely when its value occurs there; duplicates are separate indices and are counted separately, as required.",
        time: "O(n + m)",
        space: "O(V) with V = 100",
        pitfalls: [
          "Counting distinct common values instead of indices undercounts repeated values.",
          "The two answers are not symmetric — compute each against the other array.",
        ],
      }),
      examples: [
        { input: "[2,3,2]\n[1,2]", expectedOutput: "[2,1]" },
        { input: "[4,3,2,3,1]\n[2,2,5,2,3,6]", expectedOutput: "[3,4]" },
        { input: "[3,4,2,3]\n[1,5]", expectedOutput: "[0,0]" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [3, 10, 30, 100]);
        const a = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 30, 100])) }, () => ri(rng, 1, top));
        const b = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 30, 100])) }, () => ri(rng, 1, top));
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import List

          def findIntersectionValues(nums1: List[int], nums2: List[int]) -> List[int]:
              s1, s2 = set(nums1), set(nums2)
              return [sum(1 for x in nums1 if x in s2), sum(1 for x in nums2 if x in s1)]
        `,
        javascript: code`
          var findIntersectionValues = function(nums1, nums2) {
              var in1 = new Uint8Array(101), in2 = new Uint8Array(101);
              for (var i = 0; i < nums1.length; i++) in1[nums1[i]] = 1;
              for (var j = 0; j < nums2.length; j++) in2[nums2[j]] = 1;
              var a = 0, b = 0;
              for (var p = 0; p < nums1.length; p++) if (in2[nums1[p]]) a++;
              for (var q = 0; q < nums2.length; q++) if (in1[nums2[q]]) b++;
              return [a, b];
          };
        `,
        typescript: code`
          function findIntersectionValues(nums1: number[], nums2: number[]): number[] {
              var in1: boolean[] = [], in2: boolean[] = [];
              for (var k = 0; k <= 100; k++) { in1.push(false); in2.push(false); }
              for (var i = 0; i < nums1.length; i++) in1[nums1[i]] = true;
              for (var j = 0; j < nums2.length; j++) in2[nums2[j]] = true;
              var a = 0, b = 0;
              for (var p = 0; p < nums1.length; p++) if (in2[nums1[p]]) a++;
              for (var q = 0; q < nums2.length; q++) if (in1[nums2[q]]) b++;
              return [a, b];
          }
        `,
        java: code`
          public static int[] findIntersectionValues(int[] nums1, int[] nums2) {
              boolean[] in1 = new boolean[101], in2 = new boolean[101];
              for (int v : nums1) in1[v] = true;
              for (int v : nums2) in2[v] = true;
              int a = 0, b = 0;
              for (int v : nums1) if (in2[v]) a++;
              for (int v : nums2) if (in1[v]) b++;
              return new int[]{a, b};
          }
        `,
        cpp: code`
          vector<int> findIntersectionValues(vector<int>& nums1, vector<int>& nums2) {
              bool in1[101] = {false}, in2[101] = {false};
              for (int v : nums1) in1[v] = true;
              for (int v : nums2) in2[v] = true;
              int a = 0, b = 0;
              for (int v : nums1) if (in2[v]) a++;
              for (int v : nums2) if (in1[v]) b++;
              return {a, b};
          }
        `,
        c: code`
          int* findIntersectionValues(int* nums1, int nums1Size, int* nums2, int nums2Size, int* returnSize) {
              bool in1[101], in2[101];
              memset(in1, 0, sizeof(in1));
              memset(in2, 0, sizeof(in2));
              for (int i = 0; i < nums1Size; i++) in1[nums1[i]] = true;
              for (int i = 0; i < nums2Size; i++) in2[nums2[i]] = true;
              int* res = (int*) malloc(sizeof(int) * 2);
              res[0] = 0;
              res[1] = 0;
              for (int i = 0; i < nums1Size; i++) if (in2[nums1[i]]) res[0]++;
              for (int i = 0; i < nums2Size; i++) if (in1[nums2[i]]) res[1]++;
              *returnSize = 2;
              return res;
          }
        `,
        csharp: code`
          public static int[] FindIntersectionValues(int[] nums1, int[] nums2)
          {
              var in1 = new bool[101];
              var in2 = new bool[101];
              foreach (int v in nums1) in1[v] = true;
              foreach (int v in nums2) in2[v] = true;
              int a = 0, b = 0;
              foreach (int v in nums1) if (in2[v]) a++;
              foreach (int v in nums2) if (in1[v]) b++;
              return new int[] { a, b };
          }
        `,
        go: code`
          func findIntersectionValues(nums1 []int, nums2 []int) []int {
              var in1, in2 [101]bool
              for _, v := range nums1 {
                  in1[v] = true
              }
              for _, v := range nums2 {
                  in2[v] = true
              }
              a, b := 0, 0
              for _, v := range nums1 {
                  if in2[v] {
                      a++
                  }
              }
              for _, v := range nums2 {
                  if in1[v] {
                      b++
                  }
              }
              return []int{a, b}
          }
        `,
        kotlin: code`
          fun findIntersectionValues(nums1: IntArray, nums2: IntArray): IntArray {
              val s1 = nums1.toHashSet()
              val s2 = nums2.toHashSet()
              return intArrayOf(nums1.count { it in s2 }, nums2.count { it in s1 })
          }
        `,
        swift: code`
          func findIntersectionValues(_ nums1: [Int], _ nums2: [Int]) -> [Int] {
              let s1 = Set(nums1), s2 = Set(nums2)
              return [nums1.filter { s2.contains($0) }.count, nums2.filter { s1.contains($0) }.count]
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn findIntersectionValues(nums1: Vec<i32>, nums2: Vec<i32>) -> Vec<i32> {
              let s1: HashSet<i32> = nums1.iter().cloned().collect();
              let s2: HashSet<i32> = nums2.iter().cloned().collect();
              let a = nums1.iter().filter(|v| s2.contains(v)).count() as i32;
              let b = nums2.iter().filter(|v| s1.contains(v)).count() as i32;
              vec![a, b]
          }
        `,
        php: code`
          function findIntersectionValues($nums1, $nums2) {
              $s1 = array_flip($nums1);
              $s2 = array_flip($nums2);
              $a = 0;
              $b = 0;
              foreach ($nums1 as $v) if (isset($s2[$v])) $a++;
              foreach ($nums2 as $v) if (isset($s1[$v])) $b++;
              return [$a, $b];
          }
        `,
        ruby: code`
          def findIntersectionValues(nums1, nums2)
            s1 = {}
            s2 = {}
            nums1.each { |v| s1[v] = true }
            nums2.each { |v| s2[v] = true }
            [nums1.count { |v| s2[v] }, nums2.count { |v| s1[v] }]
          end
        `,
      },
    };
  })(),

  // ── Maximum Square Area by Removing Fences From a Field (LC 2975)
  (() => {
    const MOD = 1000000007n;
    const diffs = (fences: number[], end: number) => {
      const all = [1, end, ...fences];
      const s = new Set<number>();
      for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) s.add(Math.abs(all[i] - all[j]));
      return s;
    };
    const ref = (m: number, n: number, h: number[], v: number[]) => {
      const hs = diffs(h, m), vs = diffs(v, n);
      let best = -1;
      for (const d of hs) if (vs.has(d) && d > best) best = d;
      return best < 0 ? -1 : Number((BigInt(best) * BigInt(best)) % MOD);
    };
    return {
      slug: "maximum-square-area-by-removing-fences-from-a-field",
      title: "Maximum Square Area by Removing Fences From a Field",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Enumeration", "Google"],
      signature: {
        funcName: "maximizeSquareArea",
        params: [{ name: "m", type: "int" as const }, { name: "n", type: "int" as const }, { name: "hFences", type: "int[]" as const }, { name: "vFences", type: "int[]" as const }],
        returns: "int" as const,
      },
      description: describe(
        "A rectangular field spans from corner `(1, 1)` to corner `(m, n)`. Inside it run horizontal fences at the rows listed in `hFences` (a fence at `hFences[i]` goes from `(hFences[i], 1)` to `(hFences[i], n)`) and vertical fences at the columns listed in `vFences` (from `(1, vFences[i])` to `(m, vFences[i])`). The field is also enclosed by four boundary fences — at rows `1` and `m` and columns `1` and `n` — which **cannot** be removed.\n\nYou may remove any of the inner fences. Return the **maximum area** of a **square** region bounded by fences that you can obtain, modulo `10^9 + 7`, or `-1` if no square can be formed.",
        [
          { in: "m = 4, n = 3, hFences = [2,3], vFences = [2]", out: "4", note: "Removing the horizontal fence at 2 leaves a region from row 1 to row 3 and column 1 to column 3: a 2 × 2 square." },
          { in: "m = 6, n = 7, hFences = [2], vFences = [4]", out: "-1", note: "Horizontal spans available are 1, 4 and 5; vertical spans are 3, 3 and 6 — none in common." },
          { in: "m = 3, n = 3, hFences = [2], vFences = [2]", out: "4", note: "Remove both fences and the whole 2 × 2 field is a square." },
        ],
        ["3 <= m, n <= 10^9", "1 <= hFences.length, vFences.length <= 600", "1 < hFences[i] < m", "1 < vFences[i] < n", "hFences and vFences contain unique values"]),
      hints: [
        "A region bounded by fences is chosen by picking two horizontal fences (including the boundaries) and two vertical fences. Its sides are the differences between the picked positions.",
        "A square needs a horizontal span equal to a vertical span. With at most 602 positions per direction there are at most about 180,000 spans of each kind.",
        "Put every horizontal span into a hash set, scan every vertical span, and keep the largest one present in the set. Square it modulo `10^9 + 7` with 64-bit arithmetic.",
      ],
      editorial: explain({
        idea: "Removing fences lets any two remaining horizontal positions bound a region, so the achievable heights are exactly the pairwise differences of `{1, m} ∪ hFences`, and likewise for widths. The answer is the largest value achievable both ways, squared.",
        steps: [
          "Add the boundaries: horizontal positions `H = hFences + [1, m]`, vertical positions `V = vFences + [1, n]`.",
          "Insert every difference `|H[i] - H[j]|` (`i < j`) into a hash set.",
          "For every difference `d` of two vertical positions, if `d` is in the set, update `best = max(best, d)`.",
          "Return `-1` if nothing matched, otherwise `best · best mod (10^9 + 7)`.",
        ],
        why: "For any two horizontal positions `a < b` you can remove every horizontal fence strictly between them (and keep them), so a height of `b - a` is available; vertical fences are independent. Conversely, every bounded region's height is such a difference. So a square of side `d` exists iff `d` is both a horizontal and a vertical difference, and the largest common one gives the largest area.",
        time: "O(h^2 + v^2)",
        space: "O(h^2)",
        pitfalls: [
          "Forgetting the boundary fences at 1 and `m` (or `n`) misses the spans that use the edges of the field.",
          "`d` can be close to 10^9, so `d · d` overflows 32 bits — and a JavaScript double is not exact at 10^18; split the multiplication.",
          "Take the maximum before reducing modulo `10^9 + 7`; comparing reduced areas is wrong.",
        ],
      }),
      examples: [
        { input: "4\n3\n[2,3]\n[2]", expectedOutput: "4" },
        { input: "6\n7\n[2]\n[4]", expectedOutput: "-1" },
        { input: "3\n3\n[2]\n[2]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const mode = ri(rng, 0, 3);
        const top = mode === 0 ? 1000000000 : mode === 1 ? ri(rng, 3, 1000000000) : ri(rng, 3, 40);
        const m = mode === 0 ? top : ri(rng, 3, top);
        const n = mode === 0 ? top : rng() < 0.3 ? m : ri(rng, 3, top);
        const fences = (end: number) => {
          const want = ri(rng, 1, Math.min(end - 2, pick(rng, [1, 3, 8, 15])));
          const s = new Set<number>();
          let guard = 0;
          while (s.size < want && guard++ < 200) s.add(ri(rng, 2, end - 1));
          return [...s];
        };
        const h = fences(m), v = fences(n);
        return { input: `${m}\n${n}\n${fmtIntArr(h)}\n${fmtIntArr(v)}`, expectedOutput: String(ref(m, n, h, v)) };
      },
      solutions: {
        python: code`
          from typing import List

          def maximizeSquareArea(m: int, n: int, hFences: List[int], vFences: List[int]) -> int:
              h = hFences + [1, m]
              v = vFences + [1, n]
              spans = {abs(a - b) for i, a in enumerate(h) for b in h[i + 1:]}
              best = -1
              for i, a in enumerate(v):
                  for b in v[i + 1:]:
                      d = abs(a - b)
                      if d > best and d in spans:
                          best = d
              return -1 if best < 0 else best * best % 1000000007
        `,
        javascript: code`
          var maximizeSquareArea = function(m, n, hFences, vFences) {
              var h = hFences.concat([1, m]), v = vFences.concat([1, n]);
              var spans = new Set();
              for (var i = 0; i < h.length; i++)
                  for (var j = i + 1; j < h.length; j++) spans.add(Math.abs(h[i] - h[j]));
              var best = -1;
              for (var p = 0; p < v.length; p++)
                  for (var q = p + 1; q < v.length; q++) {
                      var d = Math.abs(v[p] - v[q]);
                      if (d > best && spans.has(d)) best = d;
                  }
              if (best < 0) return -1;
              // best * best overflows a double's exact range: multiply in two halves.
              var MOD = 1000000007;
              var hi = (best * Math.floor(best / 32768)) % MOD;
              return (hi * 32768 + best * (best % 32768)) % MOD;
          };
        `,
        typescript: code`
          function maximizeSquareArea(m: number, n: number, hFences: number[], vFences: number[]): number {
              var h = hFences.concat([1, m]), v = vFences.concat([1, n]);
              var spans: { [k: string]: boolean } = {};
              for (var i = 0; i < h.length; i++)
                  for (var j = i + 1; j < h.length; j++) spans[Math.abs(h[i] - h[j])] = true;
              var best = -1;
              for (var p = 0; p < v.length; p++)
                  for (var q = p + 1; q < v.length; q++) {
                      var d = Math.abs(v[p] - v[q]);
                      if (d > best && spans[d]) best = d;
                  }
              if (best < 0) return -1;
              // best * best overflows a double's exact range: multiply in two halves.
              var MOD = 1000000007;
              var hi = (best * Math.floor(best / 32768)) % MOD;
              return (hi * 32768 + best * (best % 32768)) % MOD;
          }
        `,
        java: code`
          public static int maximizeSquareArea(int m, int n, int[] hFences, int[] vFences) {
              int[] h = Arrays.copyOf(hFences, hFences.length + 2);
              h[hFences.length] = 1;
              h[hFences.length + 1] = m;
              int[] v = Arrays.copyOf(vFences, vFences.length + 2);
              v[vFences.length] = 1;
              v[vFences.length + 1] = n;
              HashSet<Integer> spans = new HashSet<>();
              for (int i = 0; i < h.length; i++)
                  for (int j = i + 1; j < h.length; j++) spans.add(Math.abs(h[i] - h[j]));
              int best = -1;
              for (int i = 0; i < v.length; i++)
                  for (int j = i + 1; j < v.length; j++) {
                      int d = Math.abs(v[i] - v[j]);
                      if (d > best && spans.contains(d)) best = d;
                  }
              if (best < 0) return -1;
              return (int) ((long) best * best % 1000000007L);
          }
        `,
        cpp: code`
          int maximizeSquareArea(int m, int n, vector<int>& hFences, vector<int>& vFences) {
              vector<int> h(hFences), v(vFences);
              h.push_back(1); h.push_back(m);
              v.push_back(1); v.push_back(n);
              unordered_set<int> spans;
              for (size_t i = 0; i < h.size(); i++)
                  for (size_t j = i + 1; j < h.size(); j++) spans.insert(abs(h[i] - h[j]));
              int best = -1;
              for (size_t i = 0; i < v.size(); i++)
                  for (size_t j = i + 1; j < v.size(); j++) {
                      int d = abs(v[i] - v[j]);
                      if (d > best && spans.count(d)) best = d;
                  }
              if (best < 0) return -1;
              return (int) ((long long) best * best % 1000000007LL);
          }
        `,
        c: code`
          static int sqCmp(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          static int* sqSpans(int* fences, int size, int end, int* count) {
              int k = size + 2;
              int* pos = (int*) malloc(sizeof(int) * k);
              for (int i = 0; i < size; i++) pos[i] = fences[i];
              pos[size] = 1;
              pos[size + 1] = end;
              int* out = (int*) malloc(sizeof(int) * (k * (k - 1) / 2 + 1));
              int c = 0;
              for (int i = 0; i < k; i++)
                  for (int j = i + 1; j < k; j++) out[c++] = pos[i] > pos[j] ? pos[i] - pos[j] : pos[j] - pos[i];
              free(pos);
              qsort(out, c, sizeof(int), sqCmp);
              *count = c;
              return out;
          }

          int maximizeSquareArea(int m, int n, int* hFences, int hFencesSize, int* vFences, int vFencesSize) {
              // Sort both span lists and walk them from the top: the first common value is the largest.
              int hc, vc;
              int* hs = sqSpans(hFences, hFencesSize, m, &hc);
              int* vs = sqSpans(vFences, vFencesSize, n, &vc);
              int i = hc - 1, j = vc - 1;
              long long best = -1;
              while (i >= 0 && j >= 0) {
                  if (hs[i] == vs[j]) { best = hs[i]; break; }
                  if (hs[i] > vs[j]) i--; else j--;
              }
              free(hs);
              free(vs);
              if (best < 0) return -1;
              return (int) (best * best % 1000000007LL);
          }
        `,
        csharp: code`
          public static int MaximizeSquareArea(int m, int n, int[] hFences, int[] vFences)
          {
              var h = hFences.Concat(new[] { 1, m }).ToArray();
              var v = vFences.Concat(new[] { 1, n }).ToArray();
              var spans = new HashSet<int>();
              for (int i = 0; i < h.Length; i++)
                  for (int j = i + 1; j < h.Length; j++) spans.Add(Math.Abs(h[i] - h[j]));
              int best = -1;
              for (int i = 0; i < v.Length; i++)
                  for (int j = i + 1; j < v.Length; j++)
                  {
                      int d = Math.Abs(v[i] - v[j]);
                      if (d > best && spans.Contains(d)) best = d;
                  }
              if (best < 0) return -1;
              return (int) ((long) best * best % 1000000007L);
          }
        `,
        go: code`
          func maximizeSquareArea(m int, n int, hFences []int, vFences []int) int {
              h := append(append([]int{}, hFences...), 1, m)
              v := append(append([]int{}, vFences...), 1, n)
              abs := func(x int) int {
                  if x < 0 {
                      return -x
                  }
                  return x
              }
              spans := map[int]bool{}
              for i := 0; i < len(h); i++ {
                  for j := i + 1; j < len(h); j++ {
                      spans[abs(h[i]-h[j])] = true
                  }
              }
              best := -1
              for i := 0; i < len(v); i++ {
                  for j := i + 1; j < len(v); j++ {
                      d := abs(v[i] - v[j])
                      if d > best && spans[d] {
                          best = d
                      }
                  }
              }
              if best < 0 {
                  return -1
              }
              return best * best % 1000000007
          }
        `,
        kotlin: code`
          fun maximizeSquareArea(m: Int, n: Int, hFences: IntArray, vFences: IntArray): Int {
              val h = hFences + intArrayOf(1, m)
              val v = vFences + intArrayOf(1, n)
              val spans = HashSet<Int>()
              for (i in h.indices) for (j in i + 1 until h.size) spans.add(Math.abs(h[i] - h[j]))
              var best = -1
              for (i in v.indices) for (j in i + 1 until v.size) {
                  val d = Math.abs(v[i] - v[j])
                  if (d > best && d in spans) best = d
              }
              if (best < 0) return -1
              return (best.toLong() * best % 1000000007L).toInt()
          }
        `,
        swift: code`
          func maximizeSquareArea(_ m: Int, _ n: Int, _ hFences: [Int], _ vFences: [Int]) -> Int {
              let h = hFences + [1, m], v = vFences + [1, n]
              var spans = Set<Int>()
              for i in 0..<h.count {
                  for j in (i + 1)..<h.count { spans.insert(abs(h[i] - h[j])) }
              }
              var best = -1
              for i in 0..<v.count {
                  for j in (i + 1)..<v.count {
                      let d = abs(v[i] - v[j])
                      if d > best && spans.contains(d) { best = d }
                  }
              }
              if best < 0 { return -1 }
              return best * best % 1000000007
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn maximizeSquareArea(m: i32, n: i32, hFences: Vec<i32>, vFences: Vec<i32>) -> i32 {
              let mut h = hFences.clone();
              h.push(1);
              h.push(m);
              let mut v = vFences.clone();
              v.push(1);
              v.push(n);
              let mut spans: HashSet<i32> = HashSet::new();
              for i in 0..h.len() {
                  for j in (i + 1)..h.len() {
                      spans.insert((h[i] - h[j]).abs());
                  }
              }
              let mut best: i64 = -1;
              for i in 0..v.len() {
                  for j in (i + 1)..v.len() {
                      let d = (v[i] - v[j]).abs();
                      if (d as i64) > best && spans.contains(&d) {
                          best = d as i64;
                      }
                  }
              }
              if best < 0 {
                  return -1;
              }
              (best * best % 1_000_000_007) as i32
          }
        `,
        php: code`
          function maximizeSquareArea($m, $n, $hFences, $vFences) {
              $h = array_merge($hFences, [1, $m]);
              $v = array_merge($vFences, [1, $n]);
              $spans = [];
              $hc = count($h);
              for ($i = 0; $i < $hc; $i++)
                  for ($j = $i + 1; $j < $hc; $j++) $spans[abs($h[$i] - $h[$j])] = true;
              $best = -1;
              $vc = count($v);
              for ($i = 0; $i < $vc; $i++)
                  for ($j = $i + 1; $j < $vc; $j++) {
                      $d = abs($v[$i] - $v[$j]);
                      if ($d > $best && isset($spans[$d])) $best = $d;
                  }
              if ($best < 0) return -1;
              return ($best * $best) % 1000000007;
          }
        `,
        ruby: code`
          def maximizeSquareArea(m, n, hFences, vFences)
            h = hFences + [1, m]
            v = vFences + [1, n]
            spans = {}
            h.each_index do |i|
              ((i + 1)...h.length).each { |j| spans[(h[i] - h[j]).abs] = true }
            end
            best = -1
            v.each_index do |i|
              ((i + 1)...v.length).each do |j|
                d = (v[i] - v[j]).abs
                best = d if d > best && spans[d]
              end
            end
            best < 0 ? -1 : best * best % 1000000007
          end
        `,
      },
    };
  })(),

  // ── Smallest Missing Integer Greater Than Sequential Prefix Sum (LC 2996)
  (() => {
    const ref = (nums: number[]) => {
      let s = nums[0];
      for (let i = 1; i < nums.length && nums[i] === nums[i - 1] + 1; i++) s += nums[i];
      while (nums.includes(s)) s++;
      return s;
    };
    return {
      slug: "smallest-missing-integer-greater-than-sequential-prefix-sum",
      title: "Smallest Missing Integer Greater Than Sequential Prefix Sum",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Sorting", "Amazon"],
      signature: { funcName: "missingInteger", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A prefix `nums[0..i]` is **sequential** if every element after the first is exactly one more than the element before it (`nums[j] = nums[j - 1] + 1` for `1 <= j <= i`). The prefix holding only `nums[0]` is always sequential.\n\nLet `s` be the sum of the **longest** sequential prefix of `nums`. Return the **smallest** integer `x` that is missing from `nums` and satisfies `x >= s`.",
        [
          { in: "nums = [1,2,3,2,5]", out: "6", note: "The longest sequential prefix is `[1,2,3]` with sum 6, and 6 is not in `nums`." },
          { in: "nums = [3,4,5,1,12,14,13]", out: "15", note: "The prefix `[3,4,5]` sums to 12; 12, 13 and 14 all occur, so the answer is 15." },
          { in: "nums = [5]", out: "6", note: "The sum is 5, which is in the array." },
        ],
        ["1 <= nums.length <= 50", "1 <= nums[i] <= 50"]),
      hints: [
        "First walk the prefix while each element is one more than the previous, summing as you go.",
        "Then start from that sum and step upwards until you reach a value not in the array.",
        "A set (or a boolean table — values are at most 50) makes each membership test O(1).",
      ],
      editorial: explain({
        idea: "Two plain passes: sum the longest run `nums[0], nums[0] + 1, …` at the start, then probe upward from that sum against a set of the array's values.",
        steps: [
          "Set `s = nums[0]`; for `i = 1, 2, …` while `nums[i] == nums[i - 1] + 1`, add `nums[i]` to `s`.",
          "Put every element of `nums` into a set.",
          "While `s` is in the set, increment `s`. Return `s`.",
        ],
        why: "The first loop stops at the first break in the sequence, which is exactly the end of the longest sequential prefix. The second loop tries candidates in increasing order starting from `s`, so the first one missing from the set is the smallest valid `x`; it terminates within `n + 1` steps because the array has only `n` values.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The prefix must start at index 0 — a longer consecutive run later in the array does not count.",
          "`x` may equal `s` itself; the condition is `x >= s`, not `x > s`.",
        ],
      }),
      examples: [
        { input: "[1,2,3,2,5]", expectedOutput: "6" },
        { input: "[3,4,5,1,12,14,13]", expectedOutput: "15" },
        { input: "[5]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, pick(rng, [1, 5, 15, 50]));
        const start = ri(rng, 1, pick(rng, [3, 10, 50]));
        const run = ri(rng, 1, n);
        const nums: number[] = [];
        for (let i = 0; i < run && start + i <= 50; i++) nums.push(start + i);
        while (nums.length < n) nums.push(ri(rng, 1, 50));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List

          def missingInteger(nums: List[int]) -> int:
              s = nums[0]
              i = 1
              while i < len(nums) and nums[i] == nums[i - 1] + 1:
                  s += nums[i]
                  i += 1
              present = set(nums)
              while s in present:
                  s += 1
              return s
        `,
        javascript: code`
          var missingInteger = function(nums) {
              var s = nums[0];
              for (var i = 1; i < nums.length && nums[i] === nums[i - 1] + 1; i++) s += nums[i];
              var present = new Set(nums);
              while (present.has(s)) s++;
              return s;
          };
        `,
        typescript: code`
          function missingInteger(nums: number[]): number {
              var s = nums[0];
              for (var i = 1; i < nums.length && nums[i] === nums[i - 1] + 1; i++) s += nums[i];
              var present: { [k: string]: boolean } = {};
              for (var j = 0; j < nums.length; j++) present[nums[j]] = true;
              while (present[s]) s++;
              return s;
          }
        `,
        java: code`
          public static int missingInteger(int[] nums) {
              int s = nums[0];
              for (int i = 1; i < nums.length && nums[i] == nums[i - 1] + 1; i++) s += nums[i];
              HashSet<Integer> present = new HashSet<>();
              for (int v : nums) present.add(v);
              while (present.contains(s)) s++;
              return s;
          }
        `,
        cpp: code`
          int missingInteger(vector<int>& nums) {
              int s = nums[0];
              for (size_t i = 1; i < nums.size() && nums[i] == nums[i - 1] + 1; i++) s += nums[i];
              unordered_set<int> present(nums.begin(), nums.end());
              while (present.count(s)) s++;
              return s;
          }
        `,
        c: code`
          int missingInteger(int* nums, int numsSize) {
              int s = nums[0];
              for (int i = 1; i < numsSize && nums[i] == nums[i - 1] + 1; i++) s += nums[i];
              bool present[51];
              memset(present, 0, sizeof(present));
              for (int i = 0; i < numsSize; i++) present[nums[i]] = true;
              while (s <= 50 && present[s]) s++;
              return s;
          }
        `,
        csharp: code`
          public static int MissingInteger(int[] nums)
          {
              int s = nums[0];
              for (int i = 1; i < nums.Length && nums[i] == nums[i - 1] + 1; i++) s += nums[i];
              var present = new HashSet<int>(nums);
              while (present.Contains(s)) s++;
              return s;
          }
        `,
        go: code`
          func missingInteger(nums []int) int {
              s := nums[0]
              for i := 1; i < len(nums) && nums[i] == nums[i-1]+1; i++ {
                  s += nums[i]
              }
              present := map[int]bool{}
              for _, v := range nums {
                  present[v] = true
              }
              for present[s] {
                  s++
              }
              return s
          }
        `,
        kotlin: code`
          fun missingInteger(nums: IntArray): Int {
              var s = nums[0]
              var i = 1
              while (i < nums.size && nums[i] == nums[i - 1] + 1) {
                  s += nums[i]
                  i++
              }
              val present = nums.toHashSet()
              while (s in present) s++
              return s
          }
        `,
        swift: code`
          func missingInteger(_ nums: [Int]) -> Int {
              var s = nums[0]
              var i = 1
              while i < nums.count && nums[i] == nums[i - 1] + 1 {
                  s += nums[i]
                  i += 1
              }
              let present = Set(nums)
              while present.contains(s) { s += 1 }
              return s
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn missingInteger(nums: Vec<i32>) -> i32 {
              let mut s = nums[0];
              let mut i = 1;
              while i < nums.len() && nums[i] == nums[i - 1] + 1 {
                  s += nums[i];
                  i += 1;
              }
              let present: HashSet<i32> = nums.iter().cloned().collect();
              while present.contains(&s) {
                  s += 1;
              }
              s
          }
        `,
        php: code`
          function missingInteger($nums) {
              $s = $nums[0];
              $n = count($nums);
              for ($i = 1; $i < $n && $nums[$i] == $nums[$i - 1] + 1; $i++) $s += $nums[$i];
              $present = array_flip($nums);
              while (isset($present[$s])) $s++;
              return $s;
          }
        `,
        ruby: code`
          def missingInteger(nums)
            s = nums[0]
            i = 1
            while i < nums.length && nums[i] == nums[i - 1] + 1
              s += nums[i]
              i += 1
            end
            present = {}
            nums.each { |v| present[v] = true }
            s += 1 while present[s]
            s
          end
        `,
      },
    };
  })(),

  // ── Find the Maximum Number of Elements in Subset (LC 3020) ─────
  (() => {
    const ref = (nums: number[]) => {
      const cnt = new Map<number, number>();
      for (const v of nums) cnt.set(v, (cnt.get(v) || 0) + 1);
      const c1 = cnt.get(1) || 0;
      let best = c1 % 2 === 1 ? c1 : Math.max(c1 - 1, 0);
      for (const x of cnt.keys()) {
        if (x === 1) continue;
        // Try every height t: the pattern x, x^2, …, x^(2^t), …, x needs two of each lower level and one top.
        const levels: number[] = [x];
        while (levels[levels.length - 1] <= 1000000000 / levels[levels.length - 1] && levels.length < 40) {
          const l = levels[levels.length - 1];
          levels.push(l * l);
        }
        for (let t = 0; t < levels.length; t++) {
          let ok = (cnt.get(levels[t]) || 0) >= 1;
          for (let i = 0; i < t && ok; i++) if ((cnt.get(levels[i]) || 0) < 2) ok = false;
          if (ok) best = Math.max(best, 2 * t + 1);
        }
      }
      return best;
    };
    return {
      slug: "find-the-maximum-number-of-elements-in-subset",
      title: "Find the Maximum Number of Elements in Subset",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Enumeration", "Google"],
      signature: { funcName: "maximumLength", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array of positive integers `nums`. Select a subset of its elements (each index used at most once) that can be arranged as\n\n`[x, x^2, x^4, ..., x^(k/2), x^k, x^(k/2), ..., x^4, x^2, x]`\n\nwhere `k` is any non-negative power of 2 — the values climb by repeated squaring to a peak and then mirror back down. For example `[2, 4, 16, 4, 2]` and `[3, 9, 3]` follow the pattern, and so does a single element `[x]`; `[2, 4, 8, 4, 2]` does not.\n\nReturn the **maximum** number of elements in such a subset.",
        [
          { in: "nums = [5,4,1,2,2]", out: "3", note: "Choose `{4, 2, 2}` and arrange it as `[2, 4, 2]`." },
          { in: "nums = [1,3,2,4]", out: "1", note: "No value has a second copy to climb from, so a single element is the best." },
          { in: "nums = [1,1,1,1]", out: "3", note: "Powers of 1 are all 1, so the pattern needs an odd number of 1s: three of the four." },
        ],
        ["2 <= nums.length <= 10^5", "1 <= nums[i] <= 10^9"]),
      hints: [
        "Count the occurrences of every value. For a starting value `x > 1`, every level below the peak is used twice and the peak once.",
        "Climb from `x`: while the current value occurs at least twice, take two copies and square it. When you stop, the current value is the peak if it occurs once — otherwise drop back one level so the previous value becomes the peak.",
        "`1` is special: `1^2 = 1`, so all ones form one chain whose length must be odd. Squares overflow 32 bits — once the value passes `10^9` it cannot occur.",
      ],
      editorial: explain({
        idea: "Fix the smallest element `x` of the pattern. The pattern uses two copies of `x, x^2, x^4, …` up to the level below the peak and one copy of the peak, so a greedy climb on a frequency map gives the best length for that `x`.",
        steps: [
          "Count every value in a hash map.",
          "For the value 1, the best is `cnt[1]` if odd, else `cnt[1] - 1`.",
          "For each distinct `x > 1`: set `len = 0`, `cur = x`. While `cnt[cur] >= 2`, add 2 and set `cur = cur^2` (stop looking it up once it exceeds `10^9`).",
          "Then if `cnt[cur] >= 1` add 1 (it is the peak), otherwise subtract 1 (the last pair's value becomes the single peak). Track the maximum.",
        ],
        why: "For a fixed `x > 1` the levels `x^(2^i)` are distinct and increasing, so the pattern of height `t` is available iff each of the first `t` levels occurs twice and level `t` once. The greedy climb finds the largest `t` with all lower levels doubled; if level `t` has no copy, level `t - 1` (which has two) can serve as the peak, giving `2t - 1`. Since the climb starts at a value present in `nums`, every `x` yields at least 1.",
        time: "O(n log log V)",
        space: "O(n)",
        pitfalls: [
          "Squaring in 32-bit arithmetic overflows — use 64-bit and stop once past `10^9`.",
          "Treating 1 like any other base loops forever, since `1^2 = 1`.",
          "An even number of 1s cannot all be used — the pattern has odd length.",
        ],
      }),
      examples: [
        { input: "[5,4,1,2,2]", expectedOutput: "3" },
        { input: "[1,3,2,4]", expectedOutput: "1" },
        { input: "[1,1,1,1]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const nums: number[] = [];
        const target = ri(rng, 2, pick(rng, [2, 6, 15, 40]));
        while (nums.length < target) {
          const r = rng();
          if (r < 0.15) nums.push(1);
          else if (r < 0.7) {
            let v = pick(rng, [2, 3, 4, 5, 7, 10, 31622, 31623]);
            const levels = ri(rng, 0, 4);
            for (let l = 0; l <= levels && v <= 1000000000; l++) {
              const copies = ri(rng, 1, 3);
              for (let c = 0; c < copies && nums.length < target; c++) nums.push(v);
              v = v * v;
            }
          } else nums.push(ri(rng, 1, pick(rng, [20, 1000, 1000000000])));
        }
        shuffle(rng, nums);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: code`
          from typing import List
          from collections import Counter

          def maximumLength(nums: List[int]) -> int:
              cnt = Counter(nums)
              ones = cnt.get(1, 0)
              best = ones if ones % 2 == 1 else max(ones - 1, 0)
              for x in cnt:
                  if x == 1:
                      continue
                  length, cur = 0, x
                  while cnt.get(cur, 0) >= 2:
                      length += 2
                      cur *= cur
                  length += 1 if cnt.get(cur, 0) >= 1 else -1
                  best = max(best, length)
              return best
        `,
        javascript: code`
          var maximumLength = function(nums) {
              var cnt = new Map();
              for (var i = 0; i < nums.length; i++) cnt.set(nums[i], (cnt.get(nums[i]) || 0) + 1);
              var ones = cnt.get(1) || 0;
              var best = ones % 2 === 1 ? ones : Math.max(ones - 1, 0);
              cnt.forEach(function(c, x) {
                  if (x === 1) return;
                  var len = 0, cur = x;
                  while (cur <= 1000000000 && (cnt.get(cur) || 0) >= 2) {
                      len += 2;
                      cur = cur * cur;
                  }
                  len += cur <= 1000000000 && (cnt.get(cur) || 0) >= 1 ? 1 : -1;
                  if (len > best) best = len;
              });
              return best;
          };
        `,
        typescript: code`
          function maximumLength(nums: number[]): number {
              var cnt: { [k: string]: number } = {};
              for (var i = 0; i < nums.length; i++) cnt[nums[i]] = (cnt[nums[i]] || 0) + 1;
              var ones = cnt[1] || 0;
              var best = ones % 2 === 1 ? ones : Math.max(ones - 1, 0);
              for (var key in cnt) {
                  if (!cnt.hasOwnProperty(key)) continue;
                  var x = parseInt(key, 10);
                  if (x === 1) continue;
                  var len = 0, cur = x;
                  while (cur <= 1000000000 && (cnt[cur] || 0) >= 2) {
                      len += 2;
                      cur = cur * cur;
                  }
                  len += cur <= 1000000000 && (cnt[cur] || 0) >= 1 ? 1 : -1;
                  if (len > best) best = len;
              }
              return best;
          }
        `,
        java: code`
          public static int maximumLength(int[] nums) {
              HashMap<Long, Integer> cnt = new HashMap<>();
              for (int v : nums) cnt.merge((long) v, 1, Integer::sum);
              int ones = cnt.getOrDefault(1L, 0);
              int best = ones % 2 == 1 ? ones : Math.max(ones - 1, 0);
              for (long x : cnt.keySet()) {
                  if (x == 1) continue;
                  int len = 0;
                  long cur = x;
                  while (cnt.getOrDefault(cur, 0) >= 2) {
                      len += 2;
                      cur = cur * cur; // at most 10^18 — fits a long, and is then simply absent
                  }
                  len += cnt.getOrDefault(cur, 0) >= 1 ? 1 : -1;
                  best = Math.max(best, len);
              }
              return best;
          }
        `,
        cpp: code`
          int maximumLength(vector<int>& nums) {
              unordered_map<long long, int> cnt;
              for (int v : nums) cnt[v]++;
              int ones = cnt.count(1) ? cnt[1] : 0;
              int best = ones % 2 == 1 ? ones : max(ones - 1, 0);
              for (auto& kv : cnt) {
                  long long x = kv.first;
                  if (x == 1) continue;
                  int len = 0;
                  long long cur = x;
                  while (true) {
                      auto it = cnt.find(cur);
                      if (it == cnt.end() || it->second < 2) break;
                      len += 2;
                      cur = cur * cur;
                  }
                  len += cnt.count(cur) ? 1 : -1;
                  best = max(best, len);
              }
              return best;
          }
        `,
        c: code`
          static int mlCmp(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          static int mlCount(const int* s, int n, long long v) {
              if (v > 1000000000LL) return 0;
              int lo = 0, hi = n;
              while (lo < hi) { int mid = (lo + hi) / 2; if (s[mid] < v) lo = mid + 1; else hi = mid; }
              int first = lo;
              hi = n;
              while (lo < hi) { int mid = (lo + hi) / 2; if (s[mid] <= v) lo = mid + 1; else hi = mid; }
              return lo - first;
          }

          int maximumLength(int* nums, int numsSize) {
              int* s = (int*) malloc(sizeof(int) * numsSize);
              memcpy(s, nums, sizeof(int) * numsSize);
              qsort(s, numsSize, sizeof(int), mlCmp);
              int ones = mlCount(s, numsSize, 1);
              int best = ones % 2 == 1 ? ones : (ones > 0 ? ones - 1 : 0);
              for (int i = 0; i < numsSize; i++) {
                  if (s[i] == 1 || (i > 0 && s[i] == s[i - 1])) continue;
                  int len = 0;
                  long long cur = s[i];
                  while (mlCount(s, numsSize, cur) >= 2) {
                      len += 2;
                      cur = cur * cur;
                  }
                  len += mlCount(s, numsSize, cur) >= 1 ? 1 : -1;
                  if (len > best) best = len;
              }
              free(s);
              return best;
          }
        `,
        csharp: code`
          public static int MaximumLength(int[] nums)
          {
              var cnt = new Dictionary<long, int>();
              foreach (int v in nums)
              {
                  cnt.TryGetValue(v, out int c);
                  cnt[v] = c + 1;
              }
              cnt.TryGetValue(1, out int ones);
              int best = ones % 2 == 1 ? ones : Math.Max(ones - 1, 0);
              foreach (long x in cnt.Keys)
              {
                  if (x == 1) continue;
                  int len = 0;
                  long cur = x;
                  while (cnt.TryGetValue(cur, out int c) && c >= 2)
                  {
                      len += 2;
                      cur = cur * cur;
                  }
                  len += cnt.ContainsKey(cur) ? 1 : -1;
                  best = Math.Max(best, len);
              }
              return best;
          }
        `,
        go: code`
          func maximumLength(nums []int) int {
              cnt := map[int]int{}
              for _, v := range nums {
                  cnt[v]++
              }
              ones := cnt[1]
              best := ones
              if ones%2 == 0 {
                  best = ones - 1
                  if best < 0 {
                      best = 0
                  }
              }
              for x := range cnt {
                  if x == 1 {
                      continue
                  }
                  length, cur := 0, x
                  for cnt[cur] >= 2 {
                      length += 2
                      cur = cur * cur
                  }
                  if cnt[cur] >= 1 {
                      length++
                  } else {
                      length--
                  }
                  if length > best {
                      best = length
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun maximumLength(nums: IntArray): Int {
              val cnt = HashMap<Long, Int>()
              for (v in nums) cnt[v.toLong()] = (cnt[v.toLong()] ?: 0) + 1
              val ones = cnt[1L] ?: 0
              var best = if (ones % 2 == 1) ones else maxOf(ones - 1, 0)
              for (x in cnt.keys) {
                  if (x == 1L) continue
                  var len = 0
                  var cur = x
                  while ((cnt[cur] ?: 0) >= 2) {
                      len += 2
                      cur *= cur
                  }
                  len += if ((cnt[cur] ?: 0) >= 1) 1 else -1
                  best = maxOf(best, len)
              }
              return best
          }
        `,
        swift: code`
          func maximumLength(_ nums: [Int]) -> Int {
              var cnt = [Int: Int]()
              for v in nums { cnt[v, default: 0] += 1 }
              let ones = cnt[1] ?? 0
              var best = ones % 2 == 1 ? ones : max(ones - 1, 0)
              for x in cnt.keys where x != 1 {
                  var len = 0, cur = x
                  while (cnt[cur] ?? 0) >= 2 {
                      len += 2
                      cur = cur * cur
                  }
                  len += (cnt[cur] ?? 0) >= 1 ? 1 : -1
                  best = max(best, len)
              }
              return best
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn maximumLength(nums: Vec<i32>) -> i32 {
              let mut cnt: HashMap<i64, i32> = HashMap::new();
              for &v in nums.iter() {
                  *cnt.entry(v as i64).or_insert(0) += 1;
              }
              let ones = *cnt.get(&1).unwrap_or(&0);
              let mut best = if ones % 2 == 1 { ones } else { (ones - 1).max(0) };
              for &x in cnt.keys() {
                  if x == 1 {
                      continue;
                  }
                  let mut len = 0;
                  let mut cur = x;
                  while *cnt.get(&cur).unwrap_or(&0) >= 2 {
                      len += 2;
                      cur = cur * cur;
                  }
                  len += if *cnt.get(&cur).unwrap_or(&0) >= 1 { 1 } else { -1 };
                  best = best.max(len);
              }
              best
          }
        `,
        php: code`
          function maximumLength($nums) {
              $cnt = array_count_values($nums);
              $ones = $cnt[1] ?? 0;
              $best = $ones % 2 == 1 ? $ones : max($ones - 1, 0);
              foreach ($cnt as $x => $c) {
                  if ($x == 1) continue;
                  $len = 0;
                  $cur = $x;
                  while ($cur <= 1000000000 && ($cnt[$cur] ?? 0) >= 2) {
                      $len += 2;
                      $cur = $cur * $cur;
                  }
                  $len += ($cur <= 1000000000 && ($cnt[$cur] ?? 0) >= 1) ? 1 : -1;
                  $best = max($best, $len);
              }
              return $best;
          }
        `,
        ruby: code`
          def maximumLength(nums)
            cnt = Hash.new(0)
            nums.each { |v| cnt[v] += 1 }
            ones = cnt[1]
            best = ones.odd? ? ones : [ones - 1, 0].max
            cnt.each_key do |x|
              next if x == 1
              len = 0
              cur = x
              while cnt[cur] >= 2
                len += 2
                cur *= cur
              end
              len += cnt[cur] >= 1 ? 1 : -1
              best = len if len > best
            end
            best
          end
        `,
      },
    };
  })(),

  // ── Find the Length of the Longest Common Prefix (LC 3043) ──────
  (() => {
    const lcp = (a: string, b: string) => { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; };
    const ref = (a: number[], b: number[]) => {
      let best = 0;
      for (const x of a) for (const y of b) best = Math.max(best, lcp(String(x), String(y)));
      return best;
    };
    return {
      slug: "find-the-length-of-the-longest-common-prefix",
      title: "Find the Length of the Longest Common Prefix",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "String", "Trie", "Amazon", "Google"],
      signature: { funcName: "longestCommonPrefix", params: [{ name: "arr1", type: "int[]" as const }, { name: "arr2", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A **prefix** of a positive integer is a number formed by one or more of its leading digits: 123 is a prefix of 12345, while 234 is not. A **common prefix** of two integers is a prefix of both — 5655359 and 56554 share the prefixes 5, 56, 565 and 5655, but 1223 and 43456 share none.\n\nYou are given two arrays of positive integers `arr1` and `arr2`. Over all pairs `(x, y)` with `x` from `arr1` and `y` from `arr2`, return the number of digits of the **longest** common prefix, or `0` if no pair has one.",
        [
          { in: "arr1 = [1,10,100], arr2 = [1000]", out: "3", note: "`100` and `1000` share the prefix 100, three digits long." },
          { in: "arr1 = [1,2,3], arr2 = [4,4,4]", out: "0" },
          { in: "arr1 = [12345,7], arr2 = [12399,70]", out: "3", note: "`12345` and `12399` share 123; `7` and `70` share only 7." },
        ],
        ["1 <= arr1.length, arr2.length <= 5 * 10^4", "1 <= arr1[i], arr2[i] <= 10^8"]),
      hints: [
        "Comparing every pair is up to 2.5 · 10^9 comparisons. But each number has at most 9 prefixes.",
        "Put every prefix of every `arr1` element into a hash set — strip the last digit with `/ 10` until nothing is left.",
        "For each `y` in `arr2`, strip digits from the end until what remains is in the set; the digit count of that survivor is a candidate answer.",
      ],
      editorial: explain({
        idea: "Numeric prefixes are what you get by repeatedly dividing by 10. Store all prefixes of `arr1` in a set, then for each element of `arr2` find its longest prefix in the set by stripping digits from the end.",
        steps: [
          "For each `x` in `arr1`, insert `x, x / 10, x / 100, …` (while positive) into a set.",
          "For each `y` in `arr2`, while `y > 0` and `y` is not in the set, set `y = y / 10`.",
          "If `y > 0`, its digit count is a common-prefix length; keep the maximum.",
          "Return the maximum (0 if nothing matched).",
        ],
        why: "A common prefix of `x` and `y` is a value that is both a prefix of `x` (so in the set) and a prefix of `y`. Stripping `y` from the longest prefix down finds its longest prefix that lies in the set — that is, the longest prefix `y` shares with any `x`.",
        time: "O((n + m) · D) with D ≤ 9 digits",
        space: "O(n · D)",
        pitfalls: [
          "Matching digits as substrings anywhere (rather than leading digits) is wrong — 234 is not a prefix of 12345.",
          "Prefixes are compared as numbers, which is safe because no number has leading zeros.",
          "A trie of digit strings works too, at a larger constant.",
        ],
      }),
      examples: [
        { input: "[1,10,100]\n[1000]", expectedOutput: "3" },
        { input: "[1,2,3]\n[4,4,4]", expectedOutput: "0" },
        { input: "[12345,7]\n[12399,70]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [9, 999, 100000, 100000000]);
        const a = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 30])) }, () => ri(rng, 1, top));
        const b = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 30])) }, () => {
          if (rng() < 0.4) {
            const base = String(a[ri(rng, 0, a.length - 1)]);
            const keep = base.slice(0, ri(rng, 1, base.length));
            const tail = randLower(rng, 0, Math.max(0, 9 - keep.length), "0123456789");
            const v = Number((keep + tail).slice(0, 9));
            return Math.min(Math.max(v, 1), 100000000);
          }
          return ri(rng, 1, top);
        });
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: code`
          from typing import List

          def longestCommonPrefix(arr1: List[int], arr2: List[int]) -> int:
              prefixes = set()
              for x in arr1:
                  while x > 0:
                      prefixes.add(x)
                      x //= 10
              best = 0
              for y in arr2:
                  while y > 0 and y not in prefixes:
                      y //= 10
                  if y > 0:
                      best = max(best, len(str(y)))
              return best
        `,
        javascript: code`
          var longestCommonPrefix = function(arr1, arr2) {
              var prefixes = new Set();
              for (var i = 0; i < arr1.length; i++) {
                  for (var x = arr1[i]; x > 0; x = Math.floor(x / 10)) prefixes.add(x);
              }
              var best = 0;
              for (var j = 0; j < arr2.length; j++) {
                  var y = arr2[j];
                  while (y > 0 && !prefixes.has(y)) y = Math.floor(y / 10);
                  if (y > 0 && String(y).length > best) best = String(y).length;
              }
              return best;
          };
        `,
        typescript: code`
          function longestCommonPrefix(arr1: number[], arr2: number[]): number {
              var prefixes: { [k: string]: boolean } = {};
              for (var i = 0; i < arr1.length; i++) {
                  for (var x = arr1[i]; x > 0; x = Math.floor(x / 10)) prefixes[x] = true;
              }
              var best = 0;
              for (var j = 0; j < arr2.length; j++) {
                  var y = arr2[j];
                  while (y > 0 && !prefixes[y]) y = Math.floor(y / 10);
                  if (y > 0 && String(y).length > best) best = String(y).length;
              }
              return best;
          }
        `,
        java: code`
          public static int longestCommonPrefix(int[] arr1, int[] arr2) {
              HashSet<Integer> prefixes = new HashSet<>();
              for (int x : arr1) for (int v = x; v > 0; v /= 10) prefixes.add(v);
              int best = 0;
              for (int y : arr2) {
                  int v = y;
                  while (v > 0 && !prefixes.contains(v)) v /= 10;
                  if (v > 0) best = Math.max(best, String.valueOf(v).length());
              }
              return best;
          }
        `,
        cpp: code`
          int longestCommonPrefix(vector<int>& arr1, vector<int>& arr2) {
              unordered_set<int> prefixes;
              for (int x : arr1) for (int v = x; v > 0; v /= 10) prefixes.insert(v);
              int best = 0;
              for (int y : arr2) {
                  int v = y;
                  while (v > 0 && !prefixes.count(v)) v /= 10;
                  if (v > 0) best = max(best, (int) to_string(v).size());
              }
              return best;
          }
        `,
        c: code`
          static int lpCmp(const void* a, const void* b) {
              int x = *(const int*) a, y = *(const int*) b;
              return (x > y) - (x < y);
          }

          static bool lpHas(const int* s, int n, int v) {
              int lo = 0, hi = n - 1;
              while (lo <= hi) {
                  int mid = (lo + hi) / 2;
                  if (s[mid] == v) return true;
                  if (s[mid] < v) lo = mid + 1; else hi = mid - 1;
              }
              return false;
          }

          int longestCommonPrefix(int* arr1, int arr1Size, int* arr2, int arr2Size) {
              int* pre = (int*) malloc(sizeof(int) * (arr1Size * 10 + 1));
              int k = 0;
              for (int i = 0; i < arr1Size; i++) for (int v = arr1[i]; v > 0; v /= 10) pre[k++] = v;
              qsort(pre, k, sizeof(int), lpCmp);
              int best = 0;
              for (int j = 0; j < arr2Size; j++) {
                  int v = arr2[j];
                  while (v > 0 && !lpHas(pre, k, v)) v /= 10;
                  int digits = 0;
                  for (int t = v; t > 0; t /= 10) digits++;
                  if (digits > best) best = digits;
              }
              free(pre);
              return best;
          }
        `,
        csharp: code`
          public static int LongestCommonPrefix(int[] arr1, int[] arr2)
          {
              var prefixes = new HashSet<int>();
              foreach (int x in arr1) for (int v = x; v > 0; v /= 10) prefixes.Add(v);
              int best = 0;
              foreach (int y in arr2)
              {
                  int v = y;
                  while (v > 0 && !prefixes.Contains(v)) v /= 10;
                  if (v > 0) best = Math.Max(best, v.ToString().Length);
              }
              return best;
          }
        `,
        go: code`
          func longestCommonPrefix(arr1 []int, arr2 []int) int {
              prefixes := map[int]bool{}
              for _, x := range arr1 {
                  for v := x; v > 0; v /= 10 {
                      prefixes[v] = true
                  }
              }
              best := 0
              for _, y := range arr2 {
                  v := y
                  for v > 0 && !prefixes[v] {
                      v /= 10
                  }
                  digits := 0
                  for t := v; t > 0; t /= 10 {
                      digits++
                  }
                  if digits > best {
                      best = digits
                  }
              }
              return best
          }
        `,
        kotlin: code`
          fun longestCommonPrefix(arr1: IntArray, arr2: IntArray): Int {
              val prefixes = HashSet<Int>()
              for (x in arr1) {
                  var v = x
                  while (v > 0) { prefixes.add(v); v /= 10 }
              }
              var best = 0
              for (y in arr2) {
                  var v = y
                  while (v > 0 && v !in prefixes) v /= 10
                  if (v > 0) best = maxOf(best, v.toString().length)
              }
              return best
          }
        `,
        swift: code`
          func longestCommonPrefix(_ arr1: [Int], _ arr2: [Int]) -> Int {
              var prefixes = Set<Int>()
              for x in arr1 {
                  var v = x
                  while v > 0 { prefixes.insert(v); v /= 10 }
              }
              var best = 0
              for y in arr2 {
                  var v = y
                  while v > 0 && !prefixes.contains(v) { v /= 10 }
                  if v > 0 { best = max(best, String(v).count) }
              }
              return best
          }
        `,
        rust: code`
          use std::collections::HashSet;

          fn longestCommonPrefix(arr1: Vec<i32>, arr2: Vec<i32>) -> i32 {
              let mut prefixes: HashSet<i32> = HashSet::new();
              for &x in arr1.iter() {
                  let mut v = x;
                  while v > 0 {
                      prefixes.insert(v);
                      v /= 10;
                  }
              }
              let mut best = 0;
              for &y in arr2.iter() {
                  let mut v = y;
                  while v > 0 && !prefixes.contains(&v) {
                      v /= 10;
                  }
                  if v > 0 {
                      best = best.max(v.to_string().len() as i32);
                  }
              }
              best
          }
        `,
        php: code`
          function longestCommonPrefix($arr1, $arr2) {
              $prefixes = [];
              foreach ($arr1 as $x) {
                  for ($v = $x; $v > 0; $v = intdiv($v, 10)) $prefixes[$v] = true;
              }
              $best = 0;
              foreach ($arr2 as $y) {
                  $v = $y;
                  while ($v > 0 && !isset($prefixes[$v])) $v = intdiv($v, 10);
                  if ($v > 0) $best = max($best, strlen((string) $v));
              }
              return $best;
          }
        `,
        ruby: code`
          def longestCommonPrefix(arr1, arr2)
            prefixes = {}
            arr1.each do |x|
              v = x
              while v > 0
                prefixes[v] = true
                v /= 10
              end
            end
            best = 0
            arr2.each do |y|
              v = y
              v /= 10 while v > 0 && !prefixes[v]
              best = [best, v.to_s.length].max if v > 0
            end
            best
          end
        `,
      },
    };
  })(),


  // ── Count the Number of Special Characters I (LC 3120) ──────────
  (() => {
    const ref = (word: string) => {
      let c = 0;
      for (const ch of "abcdefghijklmnopqrstuvwxyz") if (word.includes(ch) && word.includes(ch.toUpperCase())) c++;
      return c;
    };
    return {
      slug: "count-the-number-of-special-characters-i",
      title: "Count the Number of Special Characters I",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Amazon"],
      signature: { funcName: "numberOfSpecialChars", params: [{ name: "word", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A letter is **special** in `word` if it appears in `word` both in lowercase and in uppercase.\n\nReturn the number of special letters in `word`.",
        [
          { in: 'word = "aaAbcBC"', out: "3", note: "`a`, `b` and `c` each appear in both cases." },
          { in: 'word = "abc"', out: "0", note: "No letter appears in uppercase." },
          { in: 'word = "abBCab"', out: "1", note: "Only `b` appears in both cases; `C` has no lowercase `c`." },
        ],
        ["1 <= word.length <= 50", "word consists of only lowercase and uppercase English letters"]),
      hints: [
        "Record which lowercase letters occur and which uppercase letters occur — two sets of 26.",
        "A letter is special when it is in both sets.",
        "Count the letters from `a` to `z` that are marked in both.",
      ],
      editorial: explain({
        idea: "Track presence per letter in each case with two 26-entry tables, then count the letters present in both.",
        steps: [
          "Scan `word`; for a lowercase `c` set `lower[c - 'a']`, for an uppercase `c` set `upper[c - 'A']`.",
          "Count indices `i` in `0..25` where both `lower[i]` and `upper[i]` are set.",
        ],
        why: "A letter is special exactly when at least one lowercase and one uppercase occurrence exist, which is what the two tables record.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Count distinct letters, not occurrences — `aaA` has one special letter.",
        ],
      }),
      examples: [
        { input: '"aaAbcBC"', expectedOutput: "3" },
        { input: '"abc"', expectedOutput: "0" },
        { input: '"abBCab"', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const base = pick(rng, ["ab", "abc", "abcdef", "abcdefghijklmnopqrstuvwxyz"]);
        const alpha = base + base.toUpperCase();
        const word = randLower(rng, 1, pick(rng, [1, 5, 20, 50]), alpha);
        return { input: `"${word}"`, expectedOutput: String(ref(word)) };
      },
      solutions: {
        python: code`
          def numberOfSpecialChars(word: str) -> int:
              lower = {c for c in word if c.islower()}
              upper = {c.lower() for c in word if c.isupper()}
              return len(lower & upper)
        `,
        javascript: code`
          var numberOfSpecialChars = function(word) {
              var lower = new Array(26).fill(false), upper = new Array(26).fill(false);
              for (var i = 0; i < word.length; i++) {
                  var c = word.charCodeAt(i);
                  if (c >= 97) lower[c - 97] = true; else upper[c - 65] = true;
              }
              var count = 0;
              for (var k = 0; k < 26; k++) if (lower[k] && upper[k]) count++;
              return count;
          };
        `,
        typescript: code`
          function numberOfSpecialChars(word: string): number {
              var lower: boolean[] = [], upper: boolean[] = [];
              for (var k = 0; k < 26; k++) { lower.push(false); upper.push(false); }
              for (var i = 0; i < word.length; i++) {
                  var c = word.charCodeAt(i);
                  if (c >= 97) lower[c - 97] = true; else upper[c - 65] = true;
              }
              var count = 0;
              for (var j = 0; j < 26; j++) if (lower[j] && upper[j]) count++;
              return count;
          }
        `,
        java: code`
          public static int numberOfSpecialChars(String word) {
              boolean[] lower = new boolean[26], upper = new boolean[26];
              for (char c : word.toCharArray()) {
                  if (Character.isLowerCase(c)) lower[c - 'a'] = true; else upper[c - 'A'] = true;
              }
              int count = 0;
              for (int i = 0; i < 26; i++) if (lower[i] && upper[i]) count++;
              return count;
          }
        `,
        cpp: code`
          int numberOfSpecialChars(string word) {
              bool lower[26] = {false}, upper[26] = {false};
              for (char c : word) {
                  if (c >= 'a') lower[c - 'a'] = true; else upper[c - 'A'] = true;
              }
              int count = 0;
              for (int i = 0; i < 26; i++) if (lower[i] && upper[i]) count++;
              return count;
          }
        `,
        c: code`
          int numberOfSpecialChars(const char* word) {
              bool lower[26], upper[26];
              memset(lower, 0, sizeof(lower));
              memset(upper, 0, sizeof(upper));
              for (int i = 0; word[i] != '\0'; i++) {
                  char c = word[i];
                  if (c >= 'a') lower[c - 'a'] = true; else upper[c - 'A'] = true;
              }
              int count = 0;
              for (int i = 0; i < 26; i++) if (lower[i] && upper[i]) count++;
              return count;
          }
        `,
        csharp: code`
          public static int NumberOfSpecialChars(string word)
          {
              var lower = new bool[26];
              var upper = new bool[26];
              foreach (char c in word)
              {
                  if (char.IsLower(c)) lower[c - 'a'] = true; else upper[c - 'A'] = true;
              }
              int count = 0;
              for (int i = 0; i < 26; i++) if (lower[i] && upper[i]) count++;
              return count;
          }
        `,
        go: code`
          func numberOfSpecialChars(word string) int {
              var lower, upper [26]bool
              for i := 0; i < len(word); i++ {
                  c := word[i]
                  if c >= 'a' {
                      lower[c-'a'] = true
                  } else {
                      upper[c-'A'] = true
                  }
              }
              count := 0
              for i := 0; i < 26; i++ {
                  if lower[i] && upper[i] {
                      count++
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun numberOfSpecialChars(word: String): Int {
              val lower = BooleanArray(26)
              val upper = BooleanArray(26)
              for (c in word) {
                  if (c.isLowerCase()) lower[c - 'a'] = true else upper[c - 'A'] = true
              }
              return (0 until 26).count { lower[it] && upper[it] }
          }
        `,
        swift: code`
          func numberOfSpecialChars(_ word: String) -> Int {
              var lower = [Bool](repeating: false, count: 26)
              var upper = [Bool](repeating: false, count: 26)
              for b in word.utf8 {
                  if b >= 97 { lower[Int(b) - 97] = true } else { upper[Int(b) - 65] = true }
              }
              var count = 0
              for i in 0..<26 where lower[i] && upper[i] { count += 1 }
              return count
          }
        `,
        rust: code`
          fn numberOfSpecialChars(word: String) -> i32 {
              let mut lower = [false; 26];
              let mut upper = [false; 26];
              for b in word.bytes() {
                  if b >= b'a' {
                      lower[(b - b'a') as usize] = true;
                  } else {
                      upper[(b - b'A') as usize] = true;
                  }
              }
              (0..26).filter(|&i| lower[i] && upper[i]).count() as i32
          }
        `,
        php: code`
          function numberOfSpecialChars($word) {
              $lower = [];
              $upper = [];
              $n = strlen($word);
              for ($i = 0; $i < $n; $i++) {
                  $c = $word[$i];
                  if (ctype_lower($c)) $lower[$c] = true; else $upper[strtolower($c)] = true;
              }
              $count = 0;
              foreach ($lower as $c => $_) if (isset($upper[$c])) $count++;
              return $count;
          }
        `,
        ruby: code`
          def numberOfSpecialChars(word)
            lower = {}
            upper = {}
            word.each_char do |c|
              if c >= 'a'
                lower[c] = true
              else
                upper[c.downcase] = true
              end
            end
            lower.keys.count { |c| upper[c] }
          end
        `,
      },
    };
  })(),

  // ── Count the Number of Special Characters II (LC 3121) ─────────
  (() => {
    const ref = (word: string) => {
      let c = 0;
      for (const ch of "abcdefghijklmnopqrstuvwxyz") {
        const up = ch.toUpperCase();
        if (!word.includes(ch) || !word.includes(up)) continue;
        if (word.lastIndexOf(ch) < word.indexOf(up)) c++;
      }
      return c;
    };
    return {
      slug: "count-the-number-of-special-characters-ii",
      title: "Count the Number of Special Characters II",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Amazon"],
      signature: { funcName: "numberOfSpecialChars", params: [{ name: "word", type: "string" as const }], returns: "int" as const },
      description: describe(
        "A letter `c` is **special** in `word` if it appears in both cases and **every** lowercase occurrence of `c` comes **before** the first uppercase occurrence of `c`.\n\nReturn the number of special letters in `word`.",
        [
          { in: 'word = "aaAbcBC"', out: "3", note: "For `a`, `b` and `c`, all lowercase copies precede the first uppercase copy." },
          { in: 'word = "abc"', out: "0" },
          { in: 'word = "AbBCab"', out: "0", note: "`b` has a lowercase copy after `B`, and `a` has one after `A`; `c` never appears in lowercase." },
        ],
        ["1 <= word.length <= 2 * 10^5", "word consists of only lowercase and uppercase English letters"]),
      hints: [
        "For each letter you only need two positions: the **last** lowercase occurrence and the **first** uppercase occurrence.",
        "One pass can record both for all 26 letters.",
        "The letter is special exactly when both positions exist and `lastLower < firstUpper`.",
      ],
      editorial: explain({
        idea: "\"Every lowercase before the first uppercase\" is the same as \"the last lowercase comes before the first uppercase\", so two indices per letter decide it.",
        steps: [
          "Initialise `lastLower[i] = -1` and `firstUpper[i] = -1` for all 26 letters.",
          "Scan `word` with index `j`: for a lowercase letter set `lastLower = j`; for an uppercase letter set `firstUpper = j` only if it is still `-1`.",
          "Count letters with `lastLower != -1`, `firstUpper != -1` and `lastLower < firstUpper`.",
        ],
        why: "If the latest lowercase copy precedes the earliest uppercase copy, every lowercase copy does; if not, that latest lowercase copy itself breaks the rule. Both occurrences must exist for the letter to appear in both cases.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Overwriting `firstUpper` on later uppercase copies turns it into the last uppercase position.",
          "A letter with uppercase copies only (or lowercase only) is not special.",
        ],
      }),
      examples: [
        { input: '"aaAbcBC"', expectedOutput: "3" },
        { input: '"abc"', expectedOutput: "0" },
        { input: '"AbBCab"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const base = pick(rng, ["ab", "abc", "abcdef", "abcdefghijklmnopqrstuvwxyz"]);
        const n = ri(rng, 1, pick(rng, [1, 5, 20, 60]));
        let word: string;
        if (rng() < 0.5) {
          // Mostly lowercase first, then uppercase — the shape that makes letters special.
          const cut = ri(rng, 0, n);
          word = randLower(rng, cut, cut, base) + randLower(rng, n - cut, n - cut, base).toUpperCase();
          if (rng() < 0.4 && word.length > 0) {
            const arr = word.split("");
            const i = ri(rng, 0, arr.length - 1);
            arr[i] = rng() < 0.5 ? arr[i].toLowerCase() : arr[i].toUpperCase();
            word = arr.join("");
          }
        } else word = randLower(rng, n, n, base + base.toUpperCase());
        if (word.length === 0) word = "a";
        return { input: `"${word}"`, expectedOutput: String(ref(word)) };
      },
      solutions: {
        python: code`
          def numberOfSpecialChars(word: str) -> int:
              last_lower = [-1] * 26
              first_upper = [-1] * 26
              for j, c in enumerate(word):
                  if c.islower():
                      last_lower[ord(c) - 97] = j
                  elif first_upper[ord(c) - 65] == -1:
                      first_upper[ord(c) - 65] = j
              return sum(1 for i in range(26)
                         if last_lower[i] != -1 and first_upper[i] != -1 and last_lower[i] < first_upper[i])
        `,
        javascript: code`
          var numberOfSpecialChars = function(word) {
              var lastLower = new Array(26).fill(-1), firstUpper = new Array(26).fill(-1);
              for (var j = 0; j < word.length; j++) {
                  var c = word.charCodeAt(j);
                  if (c >= 97) lastLower[c - 97] = j;
                  else if (firstUpper[c - 65] === -1) firstUpper[c - 65] = j;
              }
              var count = 0;
              for (var i = 0; i < 26; i++) {
                  if (lastLower[i] !== -1 && firstUpper[i] !== -1 && lastLower[i] < firstUpper[i]) count++;
              }
              return count;
          };
        `,
        typescript: code`
          function numberOfSpecialChars(word: string): number {
              var lastLower: number[] = [], firstUpper: number[] = [];
              for (var k = 0; k < 26; k++) { lastLower.push(-1); firstUpper.push(-1); }
              for (var j = 0; j < word.length; j++) {
                  var c = word.charCodeAt(j);
                  if (c >= 97) lastLower[c - 97] = j;
                  else if (firstUpper[c - 65] === -1) firstUpper[c - 65] = j;
              }
              var count = 0;
              for (var i = 0; i < 26; i++) {
                  if (lastLower[i] !== -1 && firstUpper[i] !== -1 && lastLower[i] < firstUpper[i]) count++;
              }
              return count;
          }
        `,
        java: code`
          public static int numberOfSpecialChars(String word) {
              int[] lastLower = new int[26], firstUpper = new int[26];
              Arrays.fill(lastLower, -1);
              Arrays.fill(firstUpper, -1);
              for (int j = 0; j < word.length(); j++) {
                  char c = word.charAt(j);
                  if (c >= 'a') lastLower[c - 'a'] = j;
                  else if (firstUpper[c - 'A'] == -1) firstUpper[c - 'A'] = j;
              }
              int count = 0;
              for (int i = 0; i < 26; i++) {
                  if (lastLower[i] != -1 && firstUpper[i] != -1 && lastLower[i] < firstUpper[i]) count++;
              }
              return count;
          }
        `,
        cpp: code`
          int numberOfSpecialChars(string word) {
              vector<int> lastLower(26, -1), firstUpper(26, -1);
              for (int j = 0; j < (int) word.size(); j++) {
                  char c = word[j];
                  if (c >= 'a') lastLower[c - 'a'] = j;
                  else if (firstUpper[c - 'A'] == -1) firstUpper[c - 'A'] = j;
              }
              int count = 0;
              for (int i = 0; i < 26; i++) {
                  if (lastLower[i] != -1 && firstUpper[i] != -1 && lastLower[i] < firstUpper[i]) count++;
              }
              return count;
          }
        `,
        c: code`
          int numberOfSpecialChars(const char* word) {
              int lastLower[26], firstUpper[26];
              for (int i = 0; i < 26; i++) { lastLower[i] = -1; firstUpper[i] = -1; }
              for (int j = 0; word[j] != '\0'; j++) {
                  char c = word[j];
                  if (c >= 'a') lastLower[c - 'a'] = j;
                  else if (firstUpper[c - 'A'] == -1) firstUpper[c - 'A'] = j;
              }
              int count = 0;
              for (int i = 0; i < 26; i++) {
                  if (lastLower[i] != -1 && firstUpper[i] != -1 && lastLower[i] < firstUpper[i]) count++;
              }
              return count;
          }
        `,
        csharp: code`
          public static int NumberOfSpecialChars(string word)
          {
              var lastLower = Enumerable.Repeat(-1, 26).ToArray();
              var firstUpper = Enumerable.Repeat(-1, 26).ToArray();
              for (int j = 0; j < word.Length; j++)
              {
                  char c = word[j];
                  if (c >= 'a') lastLower[c - 'a'] = j;
                  else if (firstUpper[c - 'A'] == -1) firstUpper[c - 'A'] = j;
              }
              int count = 0;
              for (int i = 0; i < 26; i++)
              {
                  if (lastLower[i] != -1 && firstUpper[i] != -1 && lastLower[i] < firstUpper[i]) count++;
              }
              return count;
          }
        `,
        go: code`
          func numberOfSpecialChars(word string) int {
              var lastLower, firstUpper [26]int
              for i := 0; i < 26; i++ {
                  lastLower[i], firstUpper[i] = -1, -1
              }
              for j := 0; j < len(word); j++ {
                  c := word[j]
                  if c >= 'a' {
                      lastLower[c-'a'] = j
                  } else if firstUpper[c-'A'] == -1 {
                      firstUpper[c-'A'] = j
                  }
              }
              count := 0
              for i := 0; i < 26; i++ {
                  if lastLower[i] != -1 && firstUpper[i] != -1 && lastLower[i] < firstUpper[i] {
                      count++
                  }
              }
              return count
          }
        `,
        kotlin: code`
          fun numberOfSpecialChars(word: String): Int {
              val lastLower = IntArray(26) { -1 }
              val firstUpper = IntArray(26) { -1 }
              for (j in word.indices) {
                  val c = word[j]
                  if (c >= 'a') lastLower[c - 'a'] = j
                  else if (firstUpper[c - 'A'] == -1) firstUpper[c - 'A'] = j
              }
              return (0 until 26).count { lastLower[it] != -1 && firstUpper[it] != -1 && lastLower[it] < firstUpper[it] }
          }
        `,
        swift: code`
          func numberOfSpecialChars(_ word: String) -> Int {
              var lastLower = [Int](repeating: -1, count: 26)
              var firstUpper = [Int](repeating: -1, count: 26)
              for (j, b) in word.utf8.enumerated() {
                  if b >= 97 {
                      lastLower[Int(b) - 97] = j
                  } else if firstUpper[Int(b) - 65] == -1 {
                      firstUpper[Int(b) - 65] = j
                  }
              }
              var count = 0
              for i in 0..<26 where lastLower[i] != -1 && firstUpper[i] != -1 && lastLower[i] < firstUpper[i] {
                  count += 1
              }
              return count
          }
        `,
        rust: code`
          fn numberOfSpecialChars(word: String) -> i32 {
              let mut last_lower = [-1i32; 26];
              let mut first_upper = [-1i32; 26];
              for (j, b) in word.bytes().enumerate() {
                  if b >= b'a' {
                      last_lower[(b - b'a') as usize] = j as i32;
                  } else if first_upper[(b - b'A') as usize] == -1 {
                      first_upper[(b - b'A') as usize] = j as i32;
                  }
              }
              (0..26)
                  .filter(|&i| last_lower[i] != -1 && first_upper[i] != -1 && last_lower[i] < first_upper[i])
                  .count() as i32
          }
        `,
        php: code`
          function numberOfSpecialChars($word) {
              $lastLower = array_fill(0, 26, -1);
              $firstUpper = array_fill(0, 26, -1);
              $n = strlen($word);
              for ($j = 0; $j < $n; $j++) {
                  $c = ord($word[$j]);
                  if ($c >= 97) $lastLower[$c - 97] = $j;
                  elseif ($firstUpper[$c - 65] == -1) $firstUpper[$c - 65] = $j;
              }
              $count = 0;
              for ($i = 0; $i < 26; $i++) {
                  if ($lastLower[$i] != -1 && $firstUpper[$i] != -1 && $lastLower[$i] < $firstUpper[$i]) $count++;
              }
              return $count;
          }
        `,
        ruby: code`
          def numberOfSpecialChars(word)
            last_lower = Array.new(26, -1)
            first_upper = Array.new(26, -1)
            word.bytes.each_with_index do |b, j|
              if b >= 97
                last_lower[b - 97] = j
              elsif first_upper[b - 65] == -1
                first_upper[b - 65] = j
              end
            end
            (0...26).count { |i| last_lower[i] != -1 && first_upper[i] != -1 && last_lower[i] < first_upper[i] }
          end
        `,
      },
    };
  })(),

  // ── Minimum Number of Operations to Make Word K-Periodic (LC 3137)
  (() => {
    const ref = (word: string, k: number) => {
      const blocks: string[] = [];
      for (let i = 0; i < word.length; i += k) blocks.push(word.slice(i, i + k));
      let best = Infinity;
      for (const b of blocks) best = Math.min(best, blocks.filter((x) => x !== b).length);
      return best;
    };
    return {
      slug: "minimum-number-of-operations-to-make-word-k-periodic",
      title: "Minimum Number of Operations to Make Word K-Periodic",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Counting", "Google"],
      signature: { funcName: "minimumOperationsToMakeKPeriodic", params: [{ name: "word", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `word` of length `n` and an integer `k` that divides `n`.\n\nIn one operation you pick two indices `i` and `j`, both divisible by `k`, and replace the length-`k` substring starting at `i` with the length-`k` substring starting at `j` — that is, `word[i..i + k - 1]` becomes a copy of `word[j..j + k - 1]`.\n\nThe word is **k-periodic** if it equals some length-`k` string `s` repeated `n / k` times (for example, `\"ababab\"` is 2-periodic with `s = \"ab\"`). Return the **minimum** number of operations needed to make `word` k-periodic.",
        [
          { in: 'word = "codekatacode", k = 4', out: "1", note: "Copy the block at index 0 over `kata`, giving `codecodecode`." },
          { in: 'word = "leetcoleet", k = 2', out: "3", note: "The blocks are `le`, `et`, `co`, `le`, `et`; keeping `le` (or `et`) needs the other three blocks replaced." },
          { in: 'word = "aaaa", k = 1', out: "0" },
        ],
        ["1 <= n == word.length <= 10^5", "1 <= k <= word.length", "k divides word.length", "word consists only of lowercase English letters"]),
      hints: [
        "An operation only ever copies a whole aligned block onto another aligned block. Split the word into its `n / k` blocks.",
        "The final periodic word repeats a single block. Any block that already equals it needs no operation; every other block needs exactly one.",
        "So choose the block value that occurs most often: the answer is `n / k − (highest frequency)`. Count block frequencies in a hash map.",
      ],
      editorial: explain({
        idea: "The operations copy existing aligned blocks, so the final word repeats one of the current blocks. Keep the most frequent block and overwrite every block that differs, one operation each.",
        steps: [
          "Cut `word` into the blocks `word[i..i + k - 1]` for `i = 0, k, 2k, …`.",
          "Count how many times each block string occurs.",
          "Return `n / k − maxCount`.",
        ],
        why: "Each operation changes one block, so a block that differs from the final pattern costs at least one operation, and one is enough (copy a block that already holds the pattern). The final pattern must be some existing block, because copies never create a new block value — so the best pattern is the most frequent block.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Only aligned blocks (starting at multiples of `k`) take part; overlapping substrings do not.",
          "Counting characters instead of whole blocks gives the wrong answer — `ab` and `ba` are different blocks.",
        ],
      }),
      examples: [
        { input: '"codekatacode"\n4', expectedOutput: "1" },
        { input: '"leetcoleet"\n2', expectedOutput: "3" },
        { input: '"aaaa"\n1', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const k = ri(rng, 1, pick(rng, [1, 3, 6]));
        const blocks = ri(rng, 1, pick(rng, [1, 4, 10]));
        const alpha = pick(rng, ["ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const pool = Array.from({ length: ri(rng, 1, 4) }, () => randLower(rng, k, k, alpha));
        let word = "";
        for (let i = 0; i < blocks; i++) word += pool[ri(rng, 0, pool.length - 1)];
        return { input: `"${word}"\n${k}`, expectedOutput: String(ref(word, k)) };
      },
      solutions: {
        python: code`
          from collections import Counter

          def minimumOperationsToMakeKPeriodic(word: str, k: int) -> int:
              n = len(word)
              counts = Counter(word[i:i + k] for i in range(0, n, k))
              return n // k - max(counts.values())
        `,
        javascript: code`
          var minimumOperationsToMakeKPeriodic = function(word, k) {
              var counts = new Map();
              var best = 0;
              for (var i = 0; i < word.length; i += k) {
                  var block = word.substring(i, i + k);
                  var c = (counts.get(block) || 0) + 1;
                  counts.set(block, c);
                  if (c > best) best = c;
              }
              return word.length / k - best;
          };
        `,
        typescript: code`
          function minimumOperationsToMakeKPeriodic(word: string, k: number): number {
              var counts: { [b: string]: number } = {};
              var best = 0;
              for (var i = 0; i < word.length; i += k) {
                  var block = "#" + word.substring(i, i + k);
                  var c = (counts.hasOwnProperty(block) ? counts[block] : 0) + 1;
                  counts[block] = c;
                  if (c > best) best = c;
              }
              return word.length / k - best;
          }
        `,
        java: code`
          public static int minimumOperationsToMakeKPeriodic(String word, int k) {
              HashMap<String, Integer> counts = new HashMap<>();
              int best = 0;
              for (int i = 0; i < word.length(); i += k) {
                  int c = counts.merge(word.substring(i, i + k), 1, Integer::sum);
                  best = Math.max(best, c);
              }
              return word.length() / k - best;
          }
        `,
        cpp: code`
          int minimumOperationsToMakeKPeriodic(string word, int k) {
              unordered_map<string, int> counts;
              int best = 0;
              for (size_t i = 0; i < word.size(); i += k) {
                  best = max(best, ++counts[word.substr(i, k)]);
              }
              return (int) word.size() / k - best;
          }
        `,
        c: code`
          static const char* kpWord;
          static int kpK;

          static int kpCmp(const void* a, const void* b) {
              return strncmp(kpWord + *(const int*) a, kpWord + *(const int*) b, (size_t) kpK);
          }

          int minimumOperationsToMakeKPeriodic(const char* word, int k) {
              // Sort the block starts by block text; equal blocks become neighbours.
              int n = (int) strlen(word);
              int m = n / k;
              int* starts = (int*) malloc(sizeof(int) * m);
              for (int i = 0; i < m; i++) starts[i] = i * k;
              kpWord = word;
              kpK = k;
              qsort(starts, m, sizeof(int), kpCmp);
              int best = 0, i = 0;
              while (i < m) {
                  int j = i;
                  while (j < m && strncmp(word + starts[j], word + starts[i], (size_t) k) == 0) j++;
                  if (j - i > best) best = j - i;
                  i = j;
              }
              free(starts);
              return m - best;
          }
        `,
        csharp: code`
          public static int MinimumOperationsToMakeKPeriodic(string word, int k)
          {
              var counts = new Dictionary<string, int>();
              int best = 0;
              for (int i = 0; i < word.Length; i += k)
              {
                  string block = word.Substring(i, k);
                  counts.TryGetValue(block, out int c);
                  counts[block] = c + 1;
                  best = Math.Max(best, c + 1);
              }
              return word.Length / k - best;
          }
        `,
        go: code`
          func minimumOperationsToMakeKPeriodic(word string, k int) int {
              counts := map[string]int{}
              best := 0
              for i := 0; i < len(word); i += k {
                  b := word[i : i+k]
                  counts[b]++
                  if counts[b] > best {
                      best = counts[b]
                  }
              }
              return len(word)/k - best
          }
        `,
        kotlin: code`
          fun minimumOperationsToMakeKPeriodic(word: String, k: Int): Int {
              val counts = HashMap<String, Int>()
              var best = 0
              var i = 0
              while (i < word.length) {
                  val b = word.substring(i, i + k)
                  val c = (counts[b] ?: 0) + 1
                  counts[b] = c
                  best = maxOf(best, c)
                  i += k
              }
              return word.length / k - best
          }
        `,
        swift: code`
          func minimumOperationsToMakeKPeriodic(_ word: String, _ k: Int) -> Int {
              let chars = Array(word.utf8)
              var counts = [ArraySlice<UInt8>: Int]()
              var best = 0
              var i = 0
              while i < chars.count {
                  let b = chars[i..<(i + k)]
                  let c = (counts[b] ?? 0) + 1
                  counts[b] = c
                  best = max(best, c)
                  i += k
              }
              return chars.count / k - best
          }
        `,
        rust: code`
          use std::collections::HashMap;

          fn minimumOperationsToMakeKPeriodic(word: String, k: i32) -> i32 {
              let k = k as usize;
              let bytes = word.as_bytes();
              let mut counts: HashMap<&[u8], i32> = HashMap::new();
              let mut best = 0;
              let mut i = 0;
              while i < bytes.len() {
                  let c = counts.entry(&bytes[i..i + k]).or_insert(0);
                  *c += 1;
                  best = best.max(*c);
                  i += k;
              }
              (bytes.len() / k) as i32 - best
          }
        `,
        php: code`
          function minimumOperationsToMakeKPeriodic($word, $k) {
              $n = strlen($word);
              $counts = [];
              $best = 0;
              for ($i = 0; $i < $n; $i += $k) {
                  $b = "#" . substr($word, $i, $k);
                  $counts[$b] = ($counts[$b] ?? 0) + 1;
                  $best = max($best, $counts[$b]);
              }
              return intdiv($n, $k) - $best;
          }
        `,
        ruby: code`
          def minimumOperationsToMakeKPeriodic(word, k)
            counts = Hash.new(0)
            best = 0
            (0...word.length).step(k) do |i|
              b = word[i, k]
              counts[b] += 1
              best = counts[b] if counts[b] > best
            end
            word.length / k - best
          end
        `,
      },
    };
  })(),

  // ── Minimum Length of Anagram Concatenation (LC 3138) ───────────
  (() => {
    const sig = (s: string) => s.split("").sort().join("");
    const ref = (s: string) => {
      const n = s.length;
      for (let d = 1; d <= n; d++) {
        if (n % d) continue;
        const first = sig(s.slice(0, d));
        let ok = true;
        for (let i = d; i < n && ok; i += d) if (sig(s.slice(i, i + d)) !== first) ok = false;
        if (ok) return d;
      }
      return n;
    };
    return {
      slug: "minimum-length-of-anagram-concatenation",
      title: "Minimum Length of Anagram Concatenation",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Counting", "Google", "Amazon"],
      signature: { funcName: "minAnagramLength", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "You are given a string `s` that is known to be a concatenation of anagrams of some string `t` — that is, `s` can be cut into consecutive pieces, each a rearrangement of `t`.\n\nReturn the **minimum** possible length of `t`.",
        [
          { in: 's = "abba"', out: "2", note: "`t = \"ab\"` works: `s` is `ab` + `ba`." },
          { in: 's = "cdef"', out: "4", note: "No shorter `t` works, so `t` is `s` itself." },
          { in: 's = "abcbcacabbac"', out: "3", note: "The pieces `abc`, `bca`, `cab`, `bac` are all anagrams of `abc`." },
        ],
        ["1 <= s.length <= 10^5", "s consists only of lowercase English letters"]),
      hints: [
        "If `t` has length `d`, every piece has length `d`, so `d` must divide `n = s.length`.",
        "For a candidate `d`, all `n / d` pieces must have the same letter counts as the first piece.",
        "Try the divisors of `n` in increasing order and return the first that passes. A number up to 10^5 has at most 128 divisors, and each check is O(n).",
      ],
      editorial: explain({
        idea: "The length of `t` must divide `n`, and a divisor `d` works exactly when all aligned pieces of length `d` share one letter multiset. Testing divisors from the smallest up finds the minimum.",
        steps: [
          "For each `d` from 1 to `n` with `n % d == 0`:",
          "Count the letters of `s[0..d - 1]`.",
          "For every later piece `s[i..i + d - 1]` (`i = d, 2d, …`), count its letters and compare with the first piece.",
          "Return the first `d` where all pieces match (`d = n` always does).",
        ],
        why: "If `s` is a concatenation of anagrams of `t`, the pieces are the aligned blocks of length `|t|`, so `|t|` divides `n` and every block has `t`'s letter counts — which are those of the first block. Conversely, if all aligned blocks share the first block's counts, `t` can be taken as the first block.",
        time: "O(n · σ(n)) where σ(n) is the number of divisors (≤ 128 for n ≤ 10^5)",
        space: "O(1) (26 counters)",
        pitfalls: [
          "The pieces are consecutive and aligned — any rearrangement of the whole string is not allowed.",
          "Testing only lengths that divide `n` is required; other lengths cannot tile `s`.",
        ],
      }),
      examples: [
        { input: '"abba"', expectedOutput: "2" },
        { input: '"cdef"', expectedOutput: "4" },
        { input: '"abcbcacabbac"', expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const alpha = pick(rng, ["a", "ab", "abc", "abcdefghijklmnopqrstuvwxyz"]);
        const t = randLower(rng, 1, pick(rng, [1, 3, 6]), alpha);
        const reps = ri(rng, 1, pick(rng, [1, 4, 8]));
        let s = "";
        for (let i = 0; i < reps; i++) s += shuffle(rng, t.split("")).join("");
        if (rng() < 0.25 && s.length > 1) {
          const arr = s.split("");
          const i = ri(rng, 0, arr.length - 1), j = ri(rng, 0, arr.length - 1);
          const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
          s = arr.join("");
        }
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: code`
          def minAnagramLength(s: str) -> int:
              n = len(s)
              for d in range(1, n + 1):
                  if n % d:
                      continue
                  first = [0] * 26
                  for c in s[:d]:
                      first[ord(c) - 97] += 1
                  ok = True
                  for i in range(d, n, d):
                      cnt = [0] * 26
                      for c in s[i:i + d]:
                          cnt[ord(c) - 97] += 1
                      if cnt != first:
                          ok = False
                          break
                  if ok:
                      return d
              return n
        `,
        javascript: code`
          var minAnagramLength = function(s) {
              var n = s.length;
              for (var d = 1; d <= n; d++) {
                  if (n % d !== 0) continue;
                  var first = new Array(26).fill(0);
                  for (var a = 0; a < d; a++) first[s.charCodeAt(a) - 97]++;
                  var ok = true;
                  for (var i = d; i < n && ok; i += d) {
                      var cnt = new Array(26).fill(0);
                      for (var b = i; b < i + d; b++) cnt[s.charCodeAt(b) - 97]++;
                      for (var c = 0; c < 26; c++) if (cnt[c] !== first[c]) { ok = false; break; }
                  }
                  if (ok) return d;
              }
              return n;
          };
        `,
        typescript: code`
          function minAnagramLength(s: string): number {
              var n = s.length;
              for (var d = 1; d <= n; d++) {
                  if (n % d !== 0) continue;
                  var first: number[] = [];
                  for (var z = 0; z < 26; z++) first.push(0);
                  for (var a = 0; a < d; a++) first[s.charCodeAt(a) - 97]++;
                  var ok = true;
                  for (var i = d; i < n && ok; i += d) {
                      var cnt: number[] = [];
                      for (var y = 0; y < 26; y++) cnt.push(0);
                      for (var b = i; b < i + d; b++) cnt[s.charCodeAt(b) - 97]++;
                      for (var c = 0; c < 26; c++) if (cnt[c] !== first[c]) { ok = false; break; }
                  }
                  if (ok) return d;
              }
              return n;
          }
        `,
        java: code`
          public static int minAnagramLength(String s) {
              int n = s.length();
              for (int d = 1; d <= n; d++) {
                  if (n % d != 0) continue;
                  int[] first = new int[26];
                  for (int a = 0; a < d; a++) first[s.charAt(a) - 'a']++;
                  boolean ok = true;
                  for (int i = d; i < n && ok; i += d) {
                      int[] cnt = new int[26];
                      for (int b = i; b < i + d; b++) cnt[s.charAt(b) - 'a']++;
                      if (!Arrays.equals(cnt, first)) ok = false;
                  }
                  if (ok) return d;
              }
              return n;
          }
        `,
        cpp: code`
          int minAnagramLength(string s) {
              int n = s.size();
              for (int d = 1; d <= n; d++) {
                  if (n % d != 0) continue;
                  array<int, 26> first{};
                  for (int a = 0; a < d; a++) first[s[a] - 'a']++;
                  bool ok = true;
                  for (int i = d; i < n && ok; i += d) {
                      array<int, 26> cnt{};
                      for (int b = i; b < i + d; b++) cnt[s[b] - 'a']++;
                      if (cnt != first) ok = false;
                  }
                  if (ok) return d;
              }
              return n;
          }
        `,
        c: code`
          int minAnagramLength(const char* s) {
              int n = (int) strlen(s);
              for (int d = 1; d <= n; d++) {
                  if (n % d != 0) continue;
                  int first[26];
                  memset(first, 0, sizeof(first));
                  for (int a = 0; a < d; a++) first[s[a] - 'a']++;
                  bool ok = true;
                  for (int i = d; i < n && ok; i += d) {
                      int cnt[26];
                      memset(cnt, 0, sizeof(cnt));
                      for (int b = i; b < i + d; b++) cnt[s[b] - 'a']++;
                      if (memcmp(cnt, first, sizeof(cnt)) != 0) ok = false;
                  }
                  if (ok) return d;
              }
              return n;
          }
        `,
        csharp: code`
          public static int MinAnagramLength(string s)
          {
              int n = s.Length;
              for (int d = 1; d <= n; d++)
              {
                  if (n % d != 0) continue;
                  var first = new int[26];
                  for (int a = 0; a < d; a++) first[s[a] - 'a']++;
                  bool ok = true;
                  for (int i = d; i < n && ok; i += d)
                  {
                      var cnt = new int[26];
                      for (int b = i; b < i + d; b++) cnt[s[b] - 'a']++;
                      if (!cnt.SequenceEqual(first)) ok = false;
                  }
                  if (ok) return d;
              }
              return n;
          }
        `,
        go: code`
          func minAnagramLength(s string) int {
              n := len(s)
              for d := 1; d <= n; d++ {
                  if n%d != 0 {
                      continue
                  }
                  var first [26]int
                  for a := 0; a < d; a++ {
                      first[s[a]-'a']++
                  }
                  ok := true
                  for i := d; i < n && ok; i += d {
                      var cnt [26]int
                      for b := i; b < i+d; b++ {
                          cnt[s[b]-'a']++
                      }
                      if cnt != first {
                          ok = false
                      }
                  }
                  if ok {
                      return d
                  }
              }
              return n
          }
        `,
        kotlin: code`
          fun minAnagramLength(s: String): Int {
              val n = s.length
              for (d in 1..n) {
                  if (n % d != 0) continue
                  val first = IntArray(26)
                  for (a in 0 until d) first[s[a] - 'a']++
                  var ok = true
                  var i = d
                  while (i < n && ok) {
                      val cnt = IntArray(26)
                      for (b in i until i + d) cnt[s[b] - 'a']++
                      if (!cnt.contentEquals(first)) ok = false
                      i += d
                  }
                  if (ok) return d
              }
              return n
          }
        `,
        swift: code`
          func minAnagramLength(_ s: String) -> Int {
              let c = Array(s.utf8)
              let n = c.count
              for d in 1...n {
                  if n % d != 0 { continue }
                  var first = [Int](repeating: 0, count: 26)
                  for a in 0..<d { first[Int(c[a]) - 97] += 1 }
                  var ok = true
                  var i = d
                  while i < n && ok {
                      var cnt = [Int](repeating: 0, count: 26)
                      for b in i..<(i + d) { cnt[Int(c[b]) - 97] += 1 }
                      if cnt != first { ok = false }
                      i += d
                  }
                  if ok { return d }
              }
              return n
          }
        `,
        rust: code`
          fn minAnagramLength(s: String) -> i32 {
              let b = s.as_bytes();
              let n = b.len();
              for d in 1..=n {
                  if n % d != 0 {
                      continue;
                  }
                  let mut first = [0i32; 26];
                  for a in 0..d {
                      first[(b[a] - b'a') as usize] += 1;
                  }
                  let mut ok = true;
                  let mut i = d;
                  while i < n && ok {
                      let mut cnt = [0i32; 26];
                      for j in i..i + d {
                          cnt[(b[j] - b'a') as usize] += 1;
                      }
                      if cnt != first {
                          ok = false;
                      }
                      i += d;
                  }
                  if ok {
                      return d as i32;
                  }
              }
              n as i32
          }
        `,
        php: code`
          function minAnagramLength($s) {
              $n = strlen($s);
              for ($d = 1; $d <= $n; $d++) {
                  if ($n % $d != 0) continue;
                  $first = count_chars(substr($s, 0, $d), 1);
                  $ok = true;
                  for ($i = $d; $i < $n && $ok; $i += $d) {
                      if (count_chars(substr($s, $i, $d), 1) != $first) $ok = false;
                  }
                  if ($ok) return $d;
              }
              return $n;
          }
        `,
        ruby: code`
          def minAnagramLength(s)
            n = s.length
            (1..n).each do |d|
              next if n % d != 0
              first = s[0, d].chars.sort
              ok = true
              i = d
              while i < n && ok
                ok = false if s[i, d].chars.sort != first
                i += d
              end
              return d if ok
            end
            n
          end
        `,
      },
    };
  })(),

  // ── Find Occurrences of an Element in an Array (LC 3159) ────────
  (() => {
    const ref = (nums: number[], queries: number[], x: number) => {
      const pos: number[] = [];
      nums.forEach((v, i) => { if (v === x) pos.push(i); });
      return queries.map((q) => (q <= pos.length ? pos[q - 1] : -1));
    };
    return {
      slug: "find-occurrences-of-an-element-in-an-array",
      title: "Find Occurrences of an Element in an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Amazon"],
      signature: {
        funcName: "occurrencesOfElement",
        params: [{ name: "nums", type: "int[]" as const }, { name: "queries", type: "int[]" as const }, { name: "x", type: "int" as const }],
        returns: "int[]" as const,
      },
      description: describe(
        "You are given an integer array `nums`, an integer array `queries` and an integer `x`.\n\nFor each `queries[i]`, find the index of the `queries[i]`-th occurrence of `x` in `nums` (counting occurrences from 1, left to right). If `x` occurs fewer than `queries[i]` times, the answer is `-1`.\n\nReturn an array `answer` with the answers to all the queries, in order.",
        [
          { in: "nums = [1,3,1,7], queries = [1,3,2,4], x = 1", out: "[0,-1,2,-1]", note: "1 occurs at indices 0 and 2, so the 1st occurrence is at 0, the 2nd at 2, and there is no 3rd or 4th." },
          { in: "nums = [1,2,3], queries = [10], x = 5", out: "[-1]", note: "5 never occurs." },
          { in: "nums = [4,4,4], queries = [3,1,2,3], x = 4", out: "[2,0,1,2]" },
        ],
        ["1 <= nums.length, queries.length <= 10^5", "1 <= queries[i] <= 10^5", "1 <= nums[i], x <= 10^4"]),
      hints: [
        "Scanning `nums` once per query is too slow for 10^5 queries.",
        "Collect, in one pass, the list of indices where `nums[i] == x`, in increasing order.",
        "The `q`-th occurrence is then simply element `q - 1` of that list, if the list is long enough.",
      ],
      editorial: explain({
        idea: "Precompute the positions of `x` in order; every query is then an array lookup.",
        steps: [
          "Scan `nums` and append every index `i` with `nums[i] == x` to a list `pos`.",
          "For each query `q`, answer `pos[q - 1]` if `q <= pos.length`, otherwise `-1`.",
        ],
        why: "`pos` lists the occurrences of `x` left to right, so its `(q - 1)`-th entry (0-based) is by definition the `q`-th occurrence; a shorter list means there are fewer than `q` occurrences.",
        time: "O(n + q)",
        space: "O(n)",
        pitfalls: [
          "Queries are 1-based: the 1st occurrence is `pos[0]`.",
          "Queries can be far larger than the number of occurrences — check the bound before indexing.",
        ],
      }),
      examples: [
        { input: "[1,3,1,7]\n[1,3,2,4]\n1", expectedOutput: "[0,-1,2,-1]" },
        { input: "[1,2,3]\n[10]\n5", expectedOutput: "[-1]" },
        { input: "[4,4,4]\n[3,1,2,3]\n4", expectedOutput: "[2,0,1,2]" },
      ],
      gen: (rng: Rng) => {
        const top = pick(rng, [1, 3, 10, 10000]);
        const nums = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 20, 50])) }, () => ri(rng, 1, top));
        const x = rng() < 0.8 ? nums[ri(rng, 0, nums.length - 1)] : ri(rng, 1, top);
        const qtop = pick(rng, [3, nums.length + 2, 100000]);
        const queries = Array.from({ length: ri(rng, 1, pick(rng, [1, 5, 30])) }, () => ri(rng, 1, qtop));
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(queries)}\n${x}`, expectedOutput: fmtIntArr(ref(nums, queries, x)) };
      },
      solutions: {
        python: code`
          from typing import List

          def occurrencesOfElement(nums: List[int], queries: List[int], x: int) -> List[int]:
              pos = [i for i, v in enumerate(nums) if v == x]
              return [pos[q - 1] if q <= len(pos) else -1 for q in queries]
        `,
        javascript: code`
          var occurrencesOfElement = function(nums, queries, x) {
              var pos = [];
              for (var i = 0; i < nums.length; i++) if (nums[i] === x) pos.push(i);
              var out = [];
              for (var j = 0; j < queries.length; j++) out.push(queries[j] <= pos.length ? pos[queries[j] - 1] : -1);
              return out;
          };
        `,
        typescript: code`
          function occurrencesOfElement(nums: number[], queries: number[], x: number): number[] {
              var pos: number[] = [];
              for (var i = 0; i < nums.length; i++) if (nums[i] === x) pos.push(i);
              var out: number[] = [];
              for (var j = 0; j < queries.length; j++) out.push(queries[j] <= pos.length ? pos[queries[j] - 1] : -1);
              return out;
          }
        `,
        java: code`
          public static int[] occurrencesOfElement(int[] nums, int[] queries, int x) {
              int[] pos = new int[nums.length];
              int k = 0;
              for (int i = 0; i < nums.length; i++) if (nums[i] == x) pos[k++] = i;
              int[] out = new int[queries.length];
              for (int j = 0; j < queries.length; j++) out[j] = queries[j] <= k ? pos[queries[j] - 1] : -1;
              return out;
          }
        `,
        cpp: code`
          vector<int> occurrencesOfElement(vector<int>& nums, vector<int>& queries, int x) {
              vector<int> pos;
              for (int i = 0; i < (int) nums.size(); i++) if (nums[i] == x) pos.push_back(i);
              vector<int> out;
              out.reserve(queries.size());
              for (int q : queries) out.push_back(q <= (int) pos.size() ? pos[q - 1] : -1);
              return out;
          }
        `,
        c: code`
          int* occurrencesOfElement(int* nums, int numsSize, int* queries, int queriesSize, int x, int* returnSize) {
              int* pos = (int*) malloc(sizeof(int) * numsSize);
              int k = 0;
              for (int i = 0; i < numsSize; i++) if (nums[i] == x) pos[k++] = i;
              int* out = (int*) malloc(sizeof(int) * queriesSize);
              for (int j = 0; j < queriesSize; j++) out[j] = queries[j] <= k ? pos[queries[j] - 1] : -1;
              free(pos);
              *returnSize = queriesSize;
              return out;
          }
        `,
        csharp: code`
          public static int[] OccurrencesOfElement(int[] nums, int[] queries, int x)
          {
              var pos = new List<int>();
              for (int i = 0; i < nums.Length; i++) if (nums[i] == x) pos.Add(i);
              var res = new int[queries.Length];
              for (int j = 0; j < queries.Length; j++) res[j] = queries[j] <= pos.Count ? pos[queries[j] - 1] : -1;
              return res;
          }
        `,
        go: code`
          func occurrencesOfElement(nums []int, queries []int, x int) []int {
              pos := []int{}
              for i, v := range nums {
                  if v == x {
                      pos = append(pos, i)
                  }
              }
              out := make([]int, len(queries))
              for j, q := range queries {
                  if q <= len(pos) {
                      out[j] = pos[q-1]
                  } else {
                      out[j] = -1
                  }
              }
              return out
          }
        `,
        kotlin: code`
          fun occurrencesOfElement(nums: IntArray, queries: IntArray, x: Int): IntArray {
              val pos = ArrayList<Int>()
              for (i in nums.indices) if (nums[i] == x) pos.add(i)
              return IntArray(queries.size) { j -> if (queries[j] <= pos.size) pos[queries[j] - 1] else -1 }
          }
        `,
        swift: code`
          func occurrencesOfElement(_ nums: [Int], _ queries: [Int], _ x: Int) -> [Int] {
              var pos = [Int]()
              for i in 0..<nums.count where nums[i] == x { pos.append(i) }
              return queries.map { $0 <= pos.count ? pos[$0 - 1] : -1 }
          }
        `,
        rust: code`
          fn occurrencesOfElement(nums: Vec<i32>, queries: Vec<i32>, x: i32) -> Vec<i32> {
              let pos: Vec<i32> = nums.iter().enumerate().filter(|&(_, &v)| v == x).map(|(i, _)| i as i32).collect();
              queries
                  .iter()
                  .map(|&q| if (q as usize) <= pos.len() { pos[q as usize - 1] } else { -1 })
                  .collect()
          }
        `,
        php: code`
          function occurrencesOfElement($nums, $queries, $x) {
              $pos = [];
              foreach ($nums as $i => $v) if ($v == $x) $pos[] = $i;
              $k = count($pos);
              $out = [];
              foreach ($queries as $q) $out[] = $q <= $k ? $pos[$q - 1] : -1;
              return $out;
          }
        `,
        ruby: code`
          def occurrencesOfElement(nums, queries, x)
            pos = []
            nums.each_with_index { |v, i| pos << i if v == x }
            queries.map { |q| q <= pos.length ? pos[q - 1] : -1 }
          end
        `,
      },
    };
  })(),

];
