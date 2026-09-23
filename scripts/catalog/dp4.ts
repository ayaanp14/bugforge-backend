/**
 * Dynamic-programming problems — wave 4.
 * Real problems only: LeetCode numbered classics plus the GeeksforGeeks
 * "must-do" DP set. Worked examples are phrased for CodeKairo.
 *
 * Judge contract: a string test input must never contain `=` (parseArgs reads
 * `<ident>=` as a named argument), and no input or output may hold a
 * `__CODEXA_` sentinel. JS solutions must be Node 12-safe: no ??, ?., at(),
 * replaceAll, flat or flatMap.
 */
import {
  bool,
  describe,
  explain,
  fmtIntArr,
  fmtIntMat,
  fmtStrArr,
  pick,
  randLower,
  ri,
  shuffle,
  type CatalogProblem,
  type Rng,
} from "./types.js";

export const DP4_PROBLEMS: CatalogProblem[] = [

  // ── Coin Change II (LC 518) ─────────────────────────────────────
  (() => {
    const ref = (amount: number, coins: number[]) => {
      const dp = new Array(amount + 1).fill(0);
      dp[0] = 1;
      for (let i = 0; i < coins.length; i++) {
        for (let a = coins[i]; a <= amount; a++) dp[a] += dp[a - coins[i]];
      }
      return dp[amount];
    };
    return {
      slug: "coin-change-2",
      title: "Coin Change II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "change", params: [{ name: "amount", type: "int" as const }, { name: "coins", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You have an infinite supply of each coin in `coins`.\n\nReturn the number of **combinations** that add up to `amount`. Two combinations differ only by which coins they use and how many of each — order does not matter. Return 0 if the amount cannot be made.",
        [
          { in: "amount = 5, coins = [1,2,5]", out: "4", note: "5, 2+2+1, 2+1+1+1 and 1+1+1+1+1." },
          { in: "amount = 3, coins = [2]", out: "0" },
          { in: "amount = 10, coins = [10]", out: "1" },
        ],
        ["1 <= coins.length <= 300", "1 <= coins[i] <= 5000", "All values in coins are distinct.", "0 <= amount <= 5000", "The answer fits in a signed 32-bit integer."]),
      hints: [
        "Count combinations, not permutations — `1+2` and `2+1` are the same.",
        "Put the coin loop **outside** and the amount loop inside; that fixes an order on the coins and stops permutations being counted.",
        "`dp[a]` is the number of ways to make `a` using the coins considered so far.",
      ],
      editorial: explain({
        idea: "A one-dimensional knapsack over coin types. Processing one coin at a time and sweeping the amounts upwards counts each multiset exactly once, because a combination is built in a fixed coin order.",
        steps: [
          "Set `dp[0] = 1` — one way to make nothing.",
          "For each coin `c`, sweep `a` from `c` to `amount` doing `dp[a] += dp[a - c]`.",
          "Return `dp[amount]`.",
        ],
        why: "With the coin loop outermost, `dp[a]` after processing coins `0…i` counts the ways to make `a` using only those coins — and each combination is generated once, in non-decreasing coin index. Swapping the loops would let the same multiset be built in several orders, which counts permutations instead. Sweeping `a` upwards (rather than downwards) is what allows a coin to be reused.",
        time: "O(n · amount)",
        space: "O(amount)",
        pitfalls: [
          "Putting the amount loop outside counts permutations — the answer explodes.",
          "Sweeping `a` downwards turns it into the 0/1 knapsack, where each coin is used at most once.",
          "`dp[0] = 1` is the base case; starting at 0 makes every answer 0.",
        ],
      }),
      examples: [
        { input: "5\n[1,2,5]", expectedOutput: "4" },
        { input: "3\n[2]", expectedOutput: "0" },
        { input: "10\n[10]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const amount = ri(rng, 0, 120);
        const seen: Record<number, boolean> = {};
        const coins: number[] = [];
        const want = ri(rng, 1, 5);
        let guard = 0;
        while (coins.length < want && guard < 200) {
          guard++;
          const c = ri(rng, 1, 40);
          if (!seen[c]) { seen[c] = true; coins.push(c); }
        }
        return { input: `${amount}\n${fmtIntArr(coins)}`, expectedOutput: String(ref(amount, coins)) };
      },
      solutions: {
        python: `from typing import List\n\ndef change(amount: int, coins: List[int]) -> int:\n    dp = [0] * (amount + 1)\n    dp[0] = 1\n    for c in coins:\n        for a in range(c, amount + 1):\n            dp[a] += dp[a - c]\n    return dp[amount]`,
        javascript: `var change = function(amount, coins) {\n    var dp = [];\n    for (var t = 0; t <= amount; t++) dp.push(0);\n    dp[0] = 1;\n    for (var i = 0; i < coins.length; i++) {\n        for (var a = coins[i]; a <= amount; a++) dp[a] += dp[a - coins[i]];\n    }\n    return dp[amount];\n};`,
        typescript: `function change(amount: number, coins: number[]): number {\n    var dp: number[] = [];\n    for (var t = 0; t <= amount; t++) dp.push(0);\n    dp[0] = 1;\n    for (var i = 0; i < coins.length; i++) {\n        for (var a = coins[i]; a <= amount; a++) dp[a] += dp[a - coins[i]];\n    }\n    return dp[amount];\n}`,
        java: `public static int change(int amount, int[] coins) {\n    int[] dp = new int[amount + 1];\n    dp[0] = 1;\n    for (int c : coins) {\n        for (int a = c; a <= amount; a++) dp[a] += dp[a - c];\n    }\n    return dp[amount];\n}`,
        cpp: `int change(int amount, vector<int>& coins) {\n    vector<int> dp(amount + 1, 0);\n    dp[0] = 1;\n    for (int c : coins) {\n        for (int a = c; a <= amount; a++) dp[a] += dp[a - c];\n    }\n    return dp[amount];\n}`,
        c: `int change(int amount, int* coins, int coinsSize) {\n    int* dp = (int*) calloc((size_t) amount + 1, sizeof(int));\n    dp[0] = 1;\n    for (int i = 0; i < coinsSize; i++) {\n        for (int a = coins[i]; a <= amount; a++) dp[a] += dp[a - coins[i]];\n    }\n    int ans = dp[amount];\n    free(dp);\n    return ans;\n}`,
        csharp: `public static int Change(int amount, int[] coins)\n{\n    int[] dp = new int[amount + 1];\n    dp[0] = 1;\n    foreach (int c in coins)\n    {\n        for (int a = c; a <= amount; a++) dp[a] += dp[a - c];\n    }\n    return dp[amount];\n}`,
        go: `func change(amount int, coins []int) int {\n\tdp := make([]int, amount+1)\n\tdp[0] = 1\n\tfor _, c := range coins {\n\t\tfor a := c; a <= amount; a++ {\n\t\t\tdp[a] += dp[a-c]\n\t\t}\n\t}\n\treturn dp[amount]\n}`,
        kotlin: `fun change(amount: Int, coins: IntArray): Int {\n    val dp = IntArray(amount + 1)\n    dp[0] = 1\n    for (c in coins) {\n        for (a in c..amount) dp[a] += dp[a - c]\n    }\n    return dp[amount]\n}`,
        swift: `func change(_ amount: Int, _ coins: [Int]) -> Int {\n    var dp = [Int](repeating: 0, count: amount + 1)\n    dp[0] = 1\n    for c in coins {\n        if c > amount { continue }\n        for a in c...amount { dp[a] += dp[a - c] }\n    }\n    return dp[amount]\n}`,
        rust: `fn change(amount: i32, coins: Vec<i32>) -> i32 {\n    let n = amount as usize;\n    let mut dp = vec![0i32; n + 1];\n    dp[0] = 1;\n    for &c in coins.iter() {\n        let c = c as usize;\n        if c > n {\n            continue;\n        }\n        for a in c..=n {\n            dp[a] += dp[a - c];\n        }\n    }\n    dp[n]\n}`,
        php: `function change($amount, $coins) {\n    $dp = array_fill(0, $amount + 1, 0);\n    $dp[0] = 1;\n    foreach ($coins as $c) {\n        for ($a = $c; $a <= $amount; $a++) $dp[$a] += $dp[$a - $c];\n    }\n    return $dp[$amount];\n}`,
        ruby: `def change(amount, coins)\n  dp = Array.new(amount + 1, 0)\n  dp[0] = 1\n  coins.each do |c|\n    (c..amount).each { |a| dp[a] += dp[a - c] }\n  end\n  dp[amount]\nend`,
      },
    };
  })(),

  // ── Longest Arithmetic Subsequence (LC 1027) ────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      if (n <= 1) return n;
      const dp: Array<Record<number, number>> = [];
      let best = 1;
      for (let i = 0; i < n; i++) {
        dp.push({});
        for (let j = 0; j < i; j++) {
          const d = nums[i] - nums[j];
          const prev = dp[j][d] || 1;
          dp[i][d] = prev + 1;
          if (dp[i][d] > best) best = dp[i][d];
        }
      }
      return best;
    };
    return {
      slug: "longest-arithmetic-subsequence",
      title: "Longest Arithmetic Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Binary Search", "Amazon", "Google", "Adobe"],
      signature: { funcName: "longestArithSeqLength", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Return the length of the longest **arithmetic subsequence** of `nums` — a subsequence whose consecutive differences are all equal. A subsequence of length 1 or 2 is always arithmetic.",
        [
          { in: "nums = [3,6,9,12]", out: "4", note: "The whole array has common difference 3." },
          { in: "nums = [9,4,7,2,10]", out: "3", note: "[4,7,10] has difference 3." },
          { in: "nums = [20,1,15,3,10,5,8]", out: "4", note: "[20,15,10,5] has difference -5." },
        ],
        ["2 <= nums.length <= 1000", "0 <= nums[i] <= 500"]),
      hints: [
        "A subsequence is pinned down by its last element and its common difference.",
        "`dp[i][d]` is the length of the longest arithmetic subsequence ending at index `i` with difference `d`.",
        "Extend from every earlier index: `dp[i][d] = dp[j][d] + 1` where `d = nums[i] - nums[j]`.",
      ],
      editorial: explain({
        idea: "State the DP on (last index, common difference). Since the difference is fixed once two elements are chosen, every pair `(j, i)` extends exactly one chain.",
        steps: [
          "For each `i`, loop over every `j < i` and compute `d = nums[i] - nums[j]`.",
          "Set `dp[i][d] = (dp[j][d] or 1) + 1` — the `or 1` treats `nums[j]` alone as a length-1 chain.",
          "Track the maximum over all states.",
        ],
        why: "Any arithmetic subsequence of length at least 2 has a well-defined difference, and its longest extension ending at `i` must come from its previous element `j`. So the recurrence is exhaustive. The `or 1` base case is what makes a pair count as length 2.",
        time: "O(n²)",
        space: "O(n²) in the worst case",
        pitfalls: [
          "Differences can be negative, so a plain array needs an offset (values are at most 500, so the range is `[-500, 500]`).",
          "The base for a fresh pair is 2, not 1 — that is what `dp[j][d]` defaulting to 1 encodes.",
          "Taking `dp[j][d] + 1` without the default under-counts every two-element chain.",
        ],
      }),
      examples: [
        { input: "[3,6,9,12]", expectedOutput: "4" },
        { input: "[9,4,7,2,10]", expectedOutput: "3" },
        { input: "[20,1,15,3,10,5,8]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 2, 30) }, () => ri(rng, 0, rng() < 0.6 ? 20 : 500));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef longestArithSeqLength(nums: List[int]) -> int:\n    n = len(nums)\n    dp = [dict() for _ in range(n)]\n    best = 1\n    for i in range(n):\n        for j in range(i):\n            d = nums[i] - nums[j]\n            dp[i][d] = dp[j].get(d, 1) + 1\n            best = max(best, dp[i][d])\n    return best`,
        javascript: `var longestArithSeqLength = function(nums) {\n    var n = nums.length;\n    if (n <= 1) return n;\n    var dp = [];\n    var best = 1;\n    for (var i = 0; i < n; i++) {\n        dp.push({});\n        for (var j = 0; j < i; j++) {\n            var d = nums[i] - nums[j];\n            var prev = dp[j][d] || 1;\n            dp[i][d] = prev + 1;\n            if (dp[i][d] > best) best = dp[i][d];\n        }\n    }\n    return best;\n};`,
        typescript: `function longestArithSeqLength(nums: number[]): number {\n    var n = nums.length;\n    if (n <= 1) return n;\n    var dp: Array<{ [key: number]: number }> = [];\n    var best = 1;\n    for (var i = 0; i < n; i++) {\n        dp.push({});\n        for (var j = 0; j < i; j++) {\n            var d = nums[i] - nums[j];\n            var prev = dp[j][d] || 1;\n            dp[i][d] = prev + 1;\n            if (dp[i][d] > best) best = dp[i][d];\n        }\n    }\n    return best;\n}`,
        java: `public static int longestArithSeqLength(int[] nums) {\n    int n = nums.length;\n    int[][] dp = new int[n][1001];\n    int best = 1;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < i; j++) {\n            int d = nums[i] - nums[j] + 500;\n            int prev = dp[j][d] == 0 ? 1 : dp[j][d];\n            dp[i][d] = prev + 1;\n            best = Math.max(best, dp[i][d]);\n        }\n    }\n    return best;\n}`,
        cpp: `int longestArithSeqLength(vector<int>& nums) {\n    int n = (int) nums.size();\n    vector<vector<int>> dp(n, vector<int>(1001, 0));\n    int best = 1;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < i; j++) {\n            int d = nums[i] - nums[j] + 500;\n            int prev = dp[j][d] == 0 ? 1 : dp[j][d];\n            dp[i][d] = prev + 1;\n            best = max(best, dp[i][d]);\n        }\n    }\n    return best;\n}`,
        c: `int longestArithSeqLength(int* nums, int numsSize) {\n    int n = numsSize;\n    int* dp = (int*) calloc((size_t) n * 1001, sizeof(int));\n    int best = 1;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < i; j++) {\n            int d = nums[i] - nums[j] + 500;\n            int prev = dp[j * 1001 + d] == 0 ? 1 : dp[j * 1001 + d];\n            dp[i * 1001 + d] = prev + 1;\n            if (dp[i * 1001 + d] > best) best = dp[i * 1001 + d];\n        }\n    }\n    free(dp);\n    return best;\n}`,
        csharp: `public static int LongestArithSeqLength(int[] nums)\n{\n    int n = nums.Length;\n    int[,] dp = new int[n, 1001];\n    int best = 1;\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = 0; j < i; j++)\n        {\n            int d = nums[i] - nums[j] + 500;\n            int prev = dp[j, d] == 0 ? 1 : dp[j, d];\n            dp[i, d] = prev + 1;\n            if (dp[i, d] > best) best = dp[i, d];\n        }\n    }\n    return best;\n}`,
        go: `func longestArithSeqLength(nums []int) int {\n\tn := len(nums)\n\tdp := make([][]int, n)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, 1001)\n\t}\n\tbest := 1\n\tfor i := 0; i < n; i++ {\n\t\tfor j := 0; j < i; j++ {\n\t\t\td := nums[i] - nums[j] + 500\n\t\t\tprev := dp[j][d]\n\t\t\tif prev == 0 {\n\t\t\t\tprev = 1\n\t\t\t}\n\t\t\tdp[i][d] = prev + 1\n\t\t\tif dp[i][d] > best {\n\t\t\t\tbest = dp[i][d]\n\t\t\t}\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun longestArithSeqLength(nums: IntArray): Int {\n    val n = nums.size\n    val dp = Array(n) { IntArray(1001) }\n    var best = 1\n    for (i in 0 until n) {\n        for (j in 0 until i) {\n            val d = nums[i] - nums[j] + 500\n            val prev = if (dp[j][d] == 0) 1 else dp[j][d]\n            dp[i][d] = prev + 1\n            if (dp[i][d] > best) best = dp[i][d]\n        }\n    }\n    return best\n}`,
        swift: `func longestArithSeqLength(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: 1001), count: n)\n    var best = 1\n    for i in 0..<n {\n        for j in 0..<i {\n            let d = nums[i] - nums[j] + 500\n            let prev = dp[j][d] == 0 ? 1 : dp[j][d]\n            dp[i][d] = prev + 1\n            if dp[i][d] > best { best = dp[i][d] }\n        }\n    }\n    return best\n}`,
        rust: `fn longestArithSeqLength(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let mut dp = vec![vec![0i32; 1001]; n];\n    let mut best = 1i32;\n    for i in 0..n {\n        for j in 0..i {\n            let d = (nums[i] - nums[j] + 500) as usize;\n            let prev = if dp[j][d] == 0 { 1 } else { dp[j][d] };\n            dp[i][d] = prev + 1;\n            if dp[i][d] > best {\n                best = dp[i][d];\n            }\n        }\n    }\n    best\n}`,
        php: `function longestArithSeqLength($nums) {\n    $n = count($nums);\n    $dp = [];\n    for ($i = 0; $i < $n; $i++) $dp[$i] = [];\n    $best = 1;\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = 0; $j < $i; $j++) {\n            $d = $nums[$i] - $nums[$j];\n            $prev = isset($dp[$j][$d]) ? $dp[$j][$d] : 1;\n            $dp[$i][$d] = $prev + 1;\n            if ($dp[$i][$d] > $best) $best = $dp[$i][$d];\n        }\n    }\n    return $best;\n}`,
        ruby: `def longestArithSeqLength(nums)\n  n = nums.length\n  dp = Array.new(n) { {} }\n  best = 1\n  (0...n).each do |i|\n    (0...i).each do |j|\n      d = nums[i] - nums[j]\n      prev = dp[j][d] || 1\n      dp[i][d] = prev + 1\n      best = dp[i][d] if dp[i][d] > best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Count Ways To Build Good Strings (LC 2466) ──────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (low: number, high: number, zero: number, one: number) => {
      const dp = new Array(high + 1).fill(0);
      dp[0] = 1;
      let ans = 0;
      for (let i = 1; i <= high; i++) {
        if (i >= zero) dp[i] = (dp[i] + dp[i - zero]) % MOD;
        if (i >= one) dp[i] = (dp[i] + dp[i - one]) % MOD;
        if (i >= low) ans = (ans + dp[i]) % MOD;
      }
      return ans;
    };
    return {
      slug: "count-ways-to-build-good-strings",
      title: "Count Ways To Build Good Strings",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Amazon", "Google", "Salesforce"],
      signature: { funcName: "countGoodStrings", params: [{ name: "low", type: "int" as const }, { name: "high", type: "int" as const }, { name: "zero", type: "int" as const }, { name: "one", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Build a binary string starting from the empty string. At each step you may append `zero` copies of `'0'` **or** `one` copies of `'1'`.\n\nA string is **good** when its length is between `low` and `high` inclusive. Return the number of different good strings you can build, modulo `10^9 + 7`.",
        [
          { in: "low = 3, high = 3, zero = 1, one = 1", out: "8", note: "Every binary string of length 3." },
          { in: "low = 2, high = 3, zero = 1, one = 2", out: "5", note: 'Length 2 gives "00" and "11"; length 3 gives "000", "011" and "110".' },
          { in: "low = 1, high = 1, zero = 1, one = 1", out: "2" },
        ],
        ["1 <= low <= high <= 100000", "1 <= zero, one <= high"]),
      hints: [
        "Only the current length matters — the actual characters never constrain the next step.",
        "`dp[i]` is the number of ways to build a string of length exactly `i`.",
        "`dp[i] = dp[i - zero] + dp[i - one]`, and the answer sums `dp[i]` over `low ≤ i ≤ high`.",
      ],
      editorial: explain({
        idea: "The state collapses to the length. A string of length `i` is built by appending a block of `zero` zeros to a string of length `i - zero`, or a block of `one` ones to one of length `i - one` — and those two cases are disjoint because the final block differs.",
        steps: [
          "Set `dp[0] = 1` for the empty string.",
          "For `i` from 1 to `high`, add `dp[i - zero]` and `dp[i - one]` where the indices are valid.",
          "Sum `dp[i]` for `i` in `[low, high]`, all modulo `10^9 + 7`.",
        ],
        why: "Every non-empty buildable string ends in exactly one kind of block, so classifying by that block partitions the ways — no double counting and nothing missed. Different build sequences also give different strings, because the blocks are read off the string's own structure from the right.",
        time: "O(high)",
        space: "O(high)",
        pitfalls: [
          "The two cases are added, not multiplied — they are alternatives.",
          "Reducing modulo only at the end overflows; reduce at every addition.",
          "`zero` and `one` may be equal, in which case `dp[i]` doubles each valid step.",
        ],
      }),
      examples: [
        { input: "3\n3\n1\n1", expectedOutput: "8" },
        { input: "2\n3\n1\n2", expectedOutput: "5" },
        { input: "1\n1\n1\n1", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const high = ri(rng, 1, 200);
        const low = ri(rng, 1, high);
        const zero = ri(rng, 1, high);
        const one = ri(rng, 1, high);
        return { input: `${low}\n${high}\n${zero}\n${one}`, expectedOutput: String(ref(low, high, zero, one)) };
      },
      solutions: {
        python: `def countGoodStrings(low: int, high: int, zero: int, one: int) -> int:\n    MOD = 1000000007\n    dp = [0] * (high + 1)\n    dp[0] = 1\n    ans = 0\n    for i in range(1, high + 1):\n        if i >= zero:\n            dp[i] = (dp[i] + dp[i - zero]) % MOD\n        if i >= one:\n            dp[i] = (dp[i] + dp[i - one]) % MOD\n        if i >= low:\n            ans = (ans + dp[i]) % MOD\n    return ans`,
        javascript: `var countGoodStrings = function(low, high, zero, one) {\n    var MOD = 1000000007;\n    var dp = [];\n    for (var t = 0; t <= high; t++) dp.push(0);\n    dp[0] = 1;\n    var ans = 0;\n    for (var i = 1; i <= high; i++) {\n        if (i >= zero) dp[i] = (dp[i] + dp[i - zero]) % MOD;\n        if (i >= one) dp[i] = (dp[i] + dp[i - one]) % MOD;\n        if (i >= low) ans = (ans + dp[i]) % MOD;\n    }\n    return ans;\n};`,
        typescript: `function countGoodStrings(low: number, high: number, zero: number, one: number): number {\n    var MOD = 1000000007;\n    var dp: number[] = [];\n    for (var t = 0; t <= high; t++) dp.push(0);\n    dp[0] = 1;\n    var ans = 0;\n    for (var i = 1; i <= high; i++) {\n        if (i >= zero) dp[i] = (dp[i] + dp[i - zero]) % MOD;\n        if (i >= one) dp[i] = (dp[i] + dp[i - one]) % MOD;\n        if (i >= low) ans = (ans + dp[i]) % MOD;\n    }\n    return ans;\n}`,
        java: `public static int countGoodStrings(int low, int high, int zero, int one) {\n    final int MOD = 1000000007;\n    int[] dp = new int[high + 1];\n    dp[0] = 1;\n    int ans = 0;\n    for (int i = 1; i <= high; i++) {\n        if (i >= zero) dp[i] = (dp[i] + dp[i - zero]) % MOD;\n        if (i >= one) dp[i] = (dp[i] + dp[i - one]) % MOD;\n        if (i >= low) ans = (ans + dp[i]) % MOD;\n    }\n    return ans;\n}`,
        cpp: `int countGoodStrings(int low, int high, int zero, int one) {\n    const int MOD = 1000000007;\n    vector<int> dp(high + 1, 0);\n    dp[0] = 1;\n    int ans = 0;\n    for (int i = 1; i <= high; i++) {\n        if (i >= zero) dp[i] = (dp[i] + dp[i - zero]) % MOD;\n        if (i >= one) dp[i] = (dp[i] + dp[i - one]) % MOD;\n        if (i >= low) ans = (ans + dp[i]) % MOD;\n    }\n    return ans;\n}`,
        c: `int countGoodStrings(int low, int high, int zero, int one) {\n    const int MOD = 1000000007;\n    int* dp = (int*) calloc((size_t) high + 1, sizeof(int));\n    dp[0] = 1;\n    int ans = 0;\n    for (int i = 1; i <= high; i++) {\n        if (i >= zero) dp[i] = (dp[i] + dp[i - zero]) % MOD;\n        if (i >= one) dp[i] = (dp[i] + dp[i - one]) % MOD;\n        if (i >= low) ans = (ans + dp[i]) % MOD;\n    }\n    free(dp);\n    return ans;\n}`,
        csharp: `public static int CountGoodStrings(int low, int high, int zero, int one)\n{\n    const int MOD = 1000000007;\n    int[] dp = new int[high + 1];\n    dp[0] = 1;\n    int ans = 0;\n    for (int i = 1; i <= high; i++)\n    {\n        if (i >= zero) dp[i] = (dp[i] + dp[i - zero]) % MOD;\n        if (i >= one) dp[i] = (dp[i] + dp[i - one]) % MOD;\n        if (i >= low) ans = (ans + dp[i]) % MOD;\n    }\n    return ans;\n}`,
        go: `func countGoodStrings(low int, high int, zero int, one int) int {\n\tconst MOD = 1000000007\n\tdp := make([]int, high+1)\n\tdp[0] = 1\n\tans := 0\n\tfor i := 1; i <= high; i++ {\n\t\tif i >= zero {\n\t\t\tdp[i] = (dp[i] + dp[i-zero]) % MOD\n\t\t}\n\t\tif i >= one {\n\t\t\tdp[i] = (dp[i] + dp[i-one]) % MOD\n\t\t}\n\t\tif i >= low {\n\t\t\tans = (ans + dp[i]) % MOD\n\t\t}\n\t}\n\treturn ans\n}`,
        kotlin: `fun countGoodStrings(low: Int, high: Int, zero: Int, one: Int): Int {\n    val MOD = 1000000007\n    val dp = IntArray(high + 1)\n    dp[0] = 1\n    var ans = 0\n    for (i in 1..high) {\n        if (i >= zero) dp[i] = (dp[i] + dp[i - zero]) % MOD\n        if (i >= one) dp[i] = (dp[i] + dp[i - one]) % MOD\n        if (i >= low) ans = (ans + dp[i]) % MOD\n    }\n    return ans\n}`,
        swift: `func countGoodStrings(_ low: Int, _ high: Int, _ zero: Int, _ one: Int) -> Int {\n    let MOD = 1000000007\n    var dp = [Int](repeating: 0, count: high + 1)\n    dp[0] = 1\n    var ans = 0\n    for i in 1...high {\n        if i >= zero { dp[i] = (dp[i] + dp[i - zero]) % MOD }\n        if i >= one { dp[i] = (dp[i] + dp[i - one]) % MOD }\n        if i >= low { ans = (ans + dp[i]) % MOD }\n    }\n    return ans\n}`,
        rust: `fn countGoodStrings(low: i32, high: i32, zero: i32, one: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let h = high as usize;\n    let mut dp = vec![0i64; h + 1];\n    dp[0] = 1;\n    let mut ans: i64 = 0;\n    for i in 1..=h {\n        if i >= zero as usize {\n            dp[i] = (dp[i] + dp[i - zero as usize]) % MOD;\n        }\n        if i >= one as usize {\n            dp[i] = (dp[i] + dp[i - one as usize]) % MOD;\n        }\n        if i >= low as usize {\n            ans = (ans + dp[i]) % MOD;\n        }\n    }\n    ans as i32\n}`,
        php: `function countGoodStrings($low, $high, $zero, $one) {\n    $MOD = 1000000007;\n    $dp = array_fill(0, $high + 1, 0);\n    $dp[0] = 1;\n    $ans = 0;\n    for ($i = 1; $i <= $high; $i++) {\n        if ($i >= $zero) $dp[$i] = ($dp[$i] + $dp[$i - $zero]) % $MOD;\n        if ($i >= $one) $dp[$i] = ($dp[$i] + $dp[$i - $one]) % $MOD;\n        if ($i >= $low) $ans = ($ans + $dp[$i]) % $MOD;\n    }\n    return $ans;\n}`,
        ruby: `def countGoodStrings(low, high, zero, one)\n  mod = 1000000007\n  dp = Array.new(high + 1, 0)\n  dp[0] = 1\n  ans = 0\n  (1..high).each do |i|\n    dp[i] = (dp[i] + dp[i - zero]) % mod if i >= zero\n    dp[i] = (dp[i] + dp[i - one]) % mod if i >= one\n    ans = (ans + dp[i]) % mod if i >= low\n  end\n  ans\nend`,
      },
    };
  })(),

  // ── Count Alternating Subarrays (LC 3101) ───────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let total = 1, run = 1;
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] !== nums[i - 1]) run++; else run = 1;
        total += run;
      }
      return total;
    };
    return {
      slug: "count-alternating-subarrays",
      title: "Count Alternating Subarrays",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Amazon", "Microsoft", "Zoho"],
      signature: { funcName: "countAlternatingSubarrays", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A binary subarray is **alternating** when no two adjacent elements in it are equal.\n\nReturn the number of alternating subarrays of `nums`.",
        [
          { in: "nums = [0,1,1,1]", out: "5", note: "The four single elements plus [0,1]." },
          { in: "nums = [1,0,1,0]", out: "10", note: "Every subarray alternates." },
          { in: "nums = [1,1]", out: "2" },
        ],
        ["1 <= nums.length <= 50000", "nums[i] is 0 or 1"]),
      hints: [
        "Count the alternating subarrays **ending** at each index and add them up.",
        "If `nums[i] != nums[i-1]`, every alternating subarray ending at `i-1` extends by one, plus the single element `nums[i]`.",
        "If they are equal, the only one ending at `i` is `nums[i]` alone.",
      ],
      editorial: explain({
        idea: "Let `run` be the number of alternating subarrays ending at the current index — equivalently the length of the longest alternating run ending there. It either grows by one or resets to one.",
        steps: [
          "Start with `run = 1` and `total = 1` for the first element.",
          "For each later index, set `run = run + 1` when it differs from its predecessor, otherwise `run = 1`.",
          "Add `run` to the total at every step.",
        ],
        why: "A subarray ending at `i` alternates exactly when it lies inside the maximal alternating run ending at `i`, and there is one such subarray per starting point inside that run — so the count is the run's length. Summing over all right endpoints counts every alternating subarray once, since each has a unique right endpoint.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Forgetting the initial `total = 1` for the first element loses one.",
          "Resetting `run` to 0 instead of 1 drops the single-element subarray.",
          "The total reaches about `1.25 · 10^9` at the stated size.",
        ],
      }),
      examples: [
        { input: "[0,1,1,1]", expectedOutput: "5" },
        { input: "[1,0,1,0]", expectedOutput: "10" },
        { input: "[1,1]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 45) }, () => (rng() < 0.5 ? 1 : 0));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef countAlternatingSubarrays(nums: List[int]) -> int:\n    total = run = 1\n    for i in range(1, len(nums)):\n        run = run + 1 if nums[i] != nums[i - 1] else 1\n        total += run\n    return total`,
        javascript: `var countAlternatingSubarrays = function(nums) {\n    var total = 1, run = 1;\n    for (var i = 1; i < nums.length; i++) {\n        if (nums[i] !== nums[i - 1]) run++; else run = 1;\n        total += run;\n    }\n    return total;\n};`,
        typescript: `function countAlternatingSubarrays(nums: number[]): number {\n    var total = 1, run = 1;\n    for (var i = 1; i < nums.length; i++) {\n        if (nums[i] !== nums[i - 1]) run++; else run = 1;\n        total += run;\n    }\n    return total;\n}`,
        java: `public static int countAlternatingSubarrays(int[] nums) {\n    long total = 1, run = 1;\n    for (int i = 1; i < nums.length; i++) {\n        run = (nums[i] != nums[i - 1]) ? run + 1 : 1;\n        total += run;\n    }\n    return (int) total;\n}`,
        cpp: `int countAlternatingSubarrays(vector<int>& nums) {\n    long long total = 1, run = 1;\n    for (int i = 1; i < (int) nums.size(); i++) {\n        run = (nums[i] != nums[i - 1]) ? run + 1 : 1;\n        total += run;\n    }\n    return (int) total;\n}`,
        c: `int countAlternatingSubarrays(int* nums, int numsSize) {\n    long long total = 1, run = 1;\n    for (int i = 1; i < numsSize; i++) {\n        run = (nums[i] != nums[i - 1]) ? run + 1 : 1;\n        total += run;\n    }\n    return (int) total;\n}`,
        csharp: `public static int CountAlternatingSubarrays(int[] nums)\n{\n    long total = 1, run = 1;\n    for (int i = 1; i < nums.Length; i++)\n    {\n        run = (nums[i] != nums[i - 1]) ? run + 1 : 1;\n        total += run;\n    }\n    return (int) total;\n}`,
        go: `func countAlternatingSubarrays(nums []int) int {\n\ttotal, run := 1, 1\n\tfor i := 1; i < len(nums); i++ {\n\t\tif nums[i] != nums[i-1] {\n\t\t\trun++\n\t\t} else {\n\t\t\trun = 1\n\t\t}\n\t\ttotal += run\n\t}\n\treturn total\n}`,
        kotlin: `fun countAlternatingSubarrays(nums: IntArray): Int {\n    var total = 1L\n    var run = 1L\n    for (i in 1 until nums.size) {\n        run = if (nums[i] != nums[i - 1]) run + 1 else 1\n        total += run\n    }\n    return total.toInt()\n}`,
        swift: `func countAlternatingSubarrays(_ nums: [Int]) -> Int {\n    var total = 1\n    var run = 1\n    for i in 1..<max(nums.count, 1) where nums.count > 1 {\n        run = nums[i] != nums[i - 1] ? run + 1 : 1\n        total += run\n    }\n    return total\n}`,
        rust: `fn countAlternatingSubarrays(nums: Vec<i32>) -> i32 {\n    let mut total: i64 = 1;\n    let mut run: i64 = 1;\n    for i in 1..nums.len() {\n        run = if nums[i] != nums[i - 1] { run + 1 } else { 1 };\n        total += run;\n    }\n    total as i32\n}`,
        php: `function countAlternatingSubarrays($nums) {\n    $total = 1;\n    $run = 1;\n    for ($i = 1; $i < count($nums); $i++) {\n        $run = ($nums[$i] !== $nums[$i - 1]) ? $run + 1 : 1;\n        $total += $run;\n    }\n    return $total;\n}`,
        ruby: `def countAlternatingSubarrays(nums)\n  total = 1\n  run = 1\n  (1...nums.length).each do |i|\n    run = nums[i] != nums[i - 1] ? run + 1 : 1\n    total += run\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Predict the Winner (LC 486) ─────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      const dp = Array.from({ length: n }, () => new Array(n).fill(0));
      for (let i = 0; i < n; i++) dp[i][i] = nums[i];
      for (let len = 2; len <= n; len++) {
        for (let i = 0; i + len - 1 < n; i++) {
          const j = i + len - 1;
          dp[i][j] = Math.max(nums[i] - dp[i + 1][j], nums[j] - dp[i][j - 1]);
        }
      }
      return dp[0][n - 1] >= 0;
    };
    return {
      slug: "predict-the-winner",
      title: "Predict the Winner",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Recursion", "Game Theory", "Amazon", "Google", "Adobe"],
      signature: { funcName: "predictTheWinner", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Two players take turns picking a number from either **end** of `nums`, adding it to their score. Player 1 goes first and both play optimally.\n\nReturn whether player 1 wins. A tie counts as a win for player 1.",
        [
          { in: "nums = [1,5,2]", out: "false", note: "Whatever player 1 takes, player 2 can take the 5." },
          { in: "nums = [1,5,233,7]", out: "true", note: "Player 1 takes 1, then 233 becomes reachable." },
          { in: "nums = [2,2]", out: "true", note: "Both score 2, and a tie favours player 1." },
        ],
        ["1 <= nums.length <= 20", "0 <= nums[i] <= 10000000"]),
      hints: [
        "Track the **score difference** from the perspective of whoever is about to move, not two separate scores.",
        "`dp[i][j]` is the best difference the current player can force on `nums[i … j]`.",
        "Taking an end flips the perspective: `dp[i][j] = max(nums[i] - dp[i+1][j], nums[j] - dp[i][j-1])`.",
      ],
      editorial: explain({
        idea: "Collapse the two scores into one number — the lead of the player to move. Then the recurrence is symmetric: whichever end you take, the opponent faces the remaining interval and their best lead is subtracted from yours.",
        steps: [
          "Base case: a single element gives the mover that value.",
          "Fill intervals by increasing length with `dp[i][j] = max(nums[i] - dp[i+1][j], nums[j] - dp[i][j-1])`.",
          "Player 1 wins when `dp[0][n-1] >= 0`.",
        ],
        why: "Both players optimise the same objective from their own side, so the game is zero-sum in the lead. Subtracting the opponent's best lead correctly models that their gain is your loss. The interval `[i, j]` is the only state that matters, since the numbers already taken never affect what remains.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "Tracking both scores separately needs an extra dimension and is easy to get wrong.",
          "A tie is a win for player 1, so the test is `>= 0`, not `> 0`.",
          "The intervals must be filled by increasing length, or the subproblems are not ready.",
        ],
      }),
      examples: [
        { input: "[1,5,2]", expectedOutput: "false" },
        { input: "[1,5,233,7]", expectedOutput: "true" },
        { input: "[2,2]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 20 : 10000000;
        const nums = Array.from({ length: ri(rng, 1, 16) }, () => ri(rng, 0, hi));
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef predictTheWinner(nums: List[int]) -> bool:\n    n = len(nums)\n    dp = [[0] * n for _ in range(n)]\n    for i in range(n):\n        dp[i][i] = nums[i]\n    for length in range(2, n + 1):\n        for i in range(n - length + 1):\n            j = i + length - 1\n            dp[i][j] = max(nums[i] - dp[i + 1][j], nums[j] - dp[i][j - 1])\n    return dp[0][n - 1] >= 0`,
        javascript: `var predictTheWinner = function(nums) {\n    var n = nums.length;\n    var dp = [];\n    for (var a = 0; a < n; a++) {\n        var row = [];\n        for (var b = 0; b < n; b++) row.push(0);\n        dp.push(row);\n    }\n    for (var i = 0; i < n; i++) dp[i][i] = nums[i];\n    for (var len = 2; len <= n; len++) {\n        for (var s = 0; s + len - 1 < n; s++) {\n            var e = s + len - 1;\n            dp[s][e] = Math.max(nums[s] - dp[s + 1][e], nums[e] - dp[s][e - 1]);\n        }\n    }\n    return dp[0][n - 1] >= 0;\n};`,
        typescript: `function predictTheWinner(nums: number[]): boolean {\n    var n = nums.length;\n    var dp: number[][] = [];\n    for (var a = 0; a < n; a++) {\n        var row: number[] = [];\n        for (var b = 0; b < n; b++) row.push(0);\n        dp.push(row);\n    }\n    for (var i = 0; i < n; i++) dp[i][i] = nums[i];\n    for (var len = 2; len <= n; len++) {\n        for (var s = 0; s + len - 1 < n; s++) {\n            var e = s + len - 1;\n            dp[s][e] = Math.max(nums[s] - dp[s + 1][e], nums[e] - dp[s][e - 1]);\n        }\n    }\n    return dp[0][n - 1] >= 0;\n}`,
        java: `public static boolean predictTheWinner(int[] nums) {\n    int n = nums.length;\n    long[][] dp = new long[n][n];\n    for (int i = 0; i < n; i++) dp[i][i] = nums[i];\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            dp[i][j] = Math.max(nums[i] - dp[i + 1][j], nums[j] - dp[i][j - 1]);\n        }\n    }\n    return dp[0][n - 1] >= 0;\n}`,
        cpp: `bool predictTheWinner(vector<int>& nums) {\n    int n = (int) nums.size();\n    vector<vector<long long>> dp(n, vector<long long>(n, 0));\n    for (int i = 0; i < n; i++) dp[i][i] = nums[i];\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            dp[i][j] = max((long long) nums[i] - dp[i + 1][j], (long long) nums[j] - dp[i][j - 1]);\n        }\n    }\n    return dp[0][n - 1] >= 0;\n}`,
        c: `bool predictTheWinner(int* nums, int numsSize) {\n    int n = numsSize;\n    long long* dp = (long long*) calloc((size_t) n * n, sizeof(long long));\n    for (int i = 0; i < n; i++) dp[i * n + i] = nums[i];\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            long long a = (long long) nums[i] - dp[(i + 1) * n + j];\n            long long b = (long long) nums[j] - dp[i * n + (j - 1)];\n            dp[i * n + j] = a > b ? a : b;\n        }\n    }\n    bool res = dp[0 * n + (n - 1)] >= 0;\n    free(dp);\n    return res;\n}`,
        csharp: `public static bool PredictTheWinner(int[] nums)\n{\n    int n = nums.Length;\n    long[,] dp = new long[n, n];\n    for (int i = 0; i < n; i++) dp[i, i] = nums[i];\n    for (int len = 2; len <= n; len++)\n    {\n        for (int i = 0; i + len - 1 < n; i++)\n        {\n            int j = i + len - 1;\n            dp[i, j] = Math.Max(nums[i] - dp[i + 1, j], nums[j] - dp[i, j - 1]);\n        }\n    }\n    return dp[0, n - 1] >= 0;\n}`,
        go: `func predictTheWinner(nums []int) bool {\n\tn := len(nums)\n\tdp := make([][]int, n)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, n)\n\t}\n\tfor i := 0; i < n; i++ {\n\t\tdp[i][i] = nums[i]\n\t}\n\tfor length := 2; length <= n; length++ {\n\t\tfor i := 0; i+length-1 < n; i++ {\n\t\t\tj := i + length - 1\n\t\t\ta := nums[i] - dp[i+1][j]\n\t\t\tb := nums[j] - dp[i][j-1]\n\t\t\tif a > b {\n\t\t\t\tdp[i][j] = a\n\t\t\t} else {\n\t\t\t\tdp[i][j] = b\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[0][n-1] >= 0\n}`,
        kotlin: `fun predictTheWinner(nums: IntArray): Boolean {\n    val n = nums.size\n    val dp = Array(n) { LongArray(n) }\n    for (i in 0 until n) dp[i][i] = nums[i].toLong()\n    for (len in 2..n) {\n        for (i in 0..n - len) {\n            val j = i + len - 1\n            dp[i][j] = maxOf(nums[i] - dp[i + 1][j], nums[j] - dp[i][j - 1])\n        }\n    }\n    return dp[0][n - 1] >= 0\n}`,
        swift: `func predictTheWinner(_ nums: [Int]) -> Bool {\n    let n = nums.count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n    for i in 0..<n { dp[i][i] = nums[i] }\n    if n >= 2 {\n        for len in 2...n {\n            for i in 0...(n - len) {\n                let j = i + len - 1\n                dp[i][j] = max(nums[i] - dp[i + 1][j], nums[j] - dp[i][j - 1])\n            }\n        }\n    }\n    return dp[0][n - 1] >= 0\n}`,
        rust: `fn predictTheWinner(nums: Vec<i32>) -> bool {\n    let n = nums.len();\n    let mut dp = vec![vec![0i64; n]; n];\n    for i in 0..n {\n        dp[i][i] = nums[i] as i64;\n    }\n    for len in 2..=n {\n        for i in 0..=(n - len) {\n            let j = i + len - 1;\n            let a = nums[i] as i64 - dp[i + 1][j];\n            let b = nums[j] as i64 - dp[i][j - 1];\n            dp[i][j] = if a > b { a } else { b };\n        }\n    }\n    dp[0][n - 1] >= 0\n}`,
        php: `function predictTheWinner($nums) {\n    $n = count($nums);\n    $dp = [];\n    for ($i = 0; $i < $n; $i++) $dp[$i] = array_fill(0, $n, 0);\n    for ($i = 0; $i < $n; $i++) $dp[$i][$i] = $nums[$i];\n    for ($len = 2; $len <= $n; $len++) {\n        for ($i = 0; $i + $len - 1 < $n; $i++) {\n            $j = $i + $len - 1;\n            $dp[$i][$j] = max($nums[$i] - $dp[$i + 1][$j], $nums[$j] - $dp[$i][$j - 1]);\n        }\n    }\n    return $dp[0][$n - 1] >= 0;\n}`,
        ruby: `def predictTheWinner(nums)\n  n = nums.length\n  dp = Array.new(n) { Array.new(n, 0) }\n  (0...n).each { |i| dp[i][i] = nums[i] }\n  (2..n).each do |len|\n    (0..n - len).each do |i|\n      j = i + len - 1\n      dp[i][j] = [nums[i] - dp[i + 1][j], nums[j] - dp[i][j - 1]].max\n    end\n  end\n  dp[0][n - 1] >= 0\nend`,
      },
    };
  })(),

  // ── Stone Game II (LC 1140) ─────────────────────────────────────
  (() => {
    const ref = (piles: number[]) => {
      const n = piles.length;
      const suf = new Array(n + 1).fill(0);
      for (let i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] + piles[i];
      const memo = Array.from({ length: n + 1 }, () => new Array(2 * n + 2).fill(-1));
      const go = (i: number, m: number): number => {
        if (i >= n) return 0;
        if (i + 2 * m >= n) return suf[i];
        if (memo[i][m] >= 0) return memo[i][m];
        let best = 0;
        for (let x = 1; x <= 2 * m; x++) {
          const take = suf[i] - go(i + x, Math.max(m, x));
          if (take > best) best = take;
        }
        memo[i][m] = best;
        return best;
      };
      return go(0, 1);
    };
    return {
      slug: "stone-game-ii",
      title: "Stone Game II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Prefix Sum", "Game Theory", "Amazon", "Google", "Uber"],
      signature: { funcName: "stoneGameII", params: [{ name: "piles", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Alice and Bob take turns, Alice first. On a turn with parameter `M` (initially 1), the player takes all the stones from the first `X` remaining piles where `1 <= X <= 2M`, and then `M` becomes `max(M, X)`.\n\nBoth play optimally to maximise their own stones. Return the number of stones Alice ends with.",
        [
          { in: "piles = [2,7,9,4,4]", out: "10", note: "Taking one pile first keeps the big piles reachable later." },
          { in: "piles = [1,2,3,4,5,100]", out: "104" },
          { in: "piles = [1,2,3,4]", out: "5", note: "Alice takes the 1; Bob then forces 5 of the remaining 9, leaving Alice 4 more." },
        ],
        ["1 <= piles.length <= 100", "1 <= piles[i] <= 10000"]),
      hints: [
        "The state is `(index, M)` — which piles remain and how many the mover may take.",
        "Work with suffix sums: whatever the mover does not end up with goes to the opponent.",
        "`best(i, M) = max over X of suffix(i) - best(i + X, max(M, X))`.",
      ],
      editorial: explain({
        idea: "Memoise on `(i, M)`. The mover's total from the suffix is the whole suffix minus whatever the opponent can force from what remains — so the recurrence needs only one value per state, not two.",
        steps: [
          "Precompute suffix sums of `piles`.",
          "`go(i, M)`: if `i + 2M >= n`, the mover can sweep the rest, so return `suffix(i)`.",
          "Otherwise try every `X` from 1 to `2M` and take the best of `suffix(i) - go(i + X, max(M, X))`.",
          "The answer is `go(0, 1)`.",
        ],
        why: "The game is zero-sum over the remaining suffix: every stone left goes to one player or the other. So the mover's optimum is the suffix total minus the opponent's optimum on the smaller suffix. `M` never exceeds `n`, which bounds the state space at `O(n²)`, and each state tries `O(n)` moves.",
        time: "O(n³)",
        space: "O(n²)",
        pitfalls: [
          "`M` updates to `max(M, X)`, not to `X` — taking fewer piles does not shrink your future allowance.",
          "The sweep base case `i + 2M >= n` is what stops the recursion from running off the end.",
          "Tracking both players' scores separately doubles the state for no benefit.",
        ],
      }),
      examples: [
        { input: "[2,7,9,4,4]", expectedOutput: "10" },
        { input: "[1,2,3,4,5,100]", expectedOutput: "104" },
        { input: "[1,2,3,4]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const piles = Array.from({ length: ri(rng, 1, 20) }, () => ri(rng, 1, rng() < 0.6 ? 30 : 10000));
        return { input: fmtIntArr(piles), expectedOutput: String(ref(piles)) };
      },
      solutions: {
        python: `from functools import lru_cache\nfrom typing import List\n\ndef stoneGameII(piles: List[int]) -> int:\n    n = len(piles)\n    suf = [0] * (n + 1)\n    for i in range(n - 1, -1, -1):\n        suf[i] = suf[i + 1] + piles[i]\n\n    @lru_cache(maxsize=None)\n    def go(i: int, m: int) -> int:\n        if i >= n:\n            return 0\n        if i + 2 * m >= n:\n            return suf[i]\n        best = 0\n        for x in range(1, 2 * m + 1):\n            best = max(best, suf[i] - go(i + x, max(m, x)))\n        return best\n\n    return go(0, 1)`,
        javascript: `var stoneGameII = function(piles) {\n    var n = piles.length;\n    var suf = [];\n    for (var t = 0; t <= n; t++) suf.push(0);\n    for (var i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] + piles[i];\n    var memo = [];\n    for (var a = 0; a <= n; a++) {\n        var row = [];\n        for (var b = 0; b <= 2 * n + 1; b++) row.push(-1);\n        memo.push(row);\n    }\n    var go = function(i, m) {\n        if (i >= n) return 0;\n        if (i + 2 * m >= n) return suf[i];\n        if (memo[i][m] >= 0) return memo[i][m];\n        var best = 0;\n        for (var x = 1; x <= 2 * m; x++) {\n            var take = suf[i] - go(i + x, Math.max(m, x));\n            if (take > best) best = take;\n        }\n        memo[i][m] = best;\n        return best;\n    };\n    return go(0, 1);\n};`,
        typescript: `function stoneGameII(piles: number[]): number {\n    var n = piles.length;\n    var suf: number[] = [];\n    for (var t = 0; t <= n; t++) suf.push(0);\n    for (var i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] + piles[i];\n    var memo: number[][] = [];\n    for (var a = 0; a <= n; a++) {\n        var row: number[] = [];\n        for (var b = 0; b <= 2 * n + 1; b++) row.push(-1);\n        memo.push(row);\n    }\n    var go = function(i: number, m: number): number {\n        if (i >= n) return 0;\n        if (i + 2 * m >= n) return suf[i];\n        if (memo[i][m] >= 0) return memo[i][m];\n        var best = 0;\n        for (var x = 1; x <= 2 * m; x++) {\n            var take = suf[i] - go(i + x, Math.max(m, x));\n            if (take > best) best = take;\n        }\n        memo[i][m] = best;\n        return best;\n    };\n    return go(0, 1);\n}`,
        java: `private static int stoneGo(int i, int m, int n, int[] suf, int[][] memo) {\n    if (i >= n) return 0;\n    if (i + 2 * m >= n) return suf[i];\n    if (memo[i][m] >= 0) return memo[i][m];\n    int best = 0;\n    for (int x = 1; x <= 2 * m; x++) {\n        best = Math.max(best, suf[i] - stoneGo(i + x, Math.max(m, x), n, suf, memo));\n    }\n    memo[i][m] = best;\n    return best;\n}\n\npublic static int stoneGameII(int[] piles) {\n    int n = piles.length;\n    int[] suf = new int[n + 1];\n    for (int i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] + piles[i];\n    int[][] memo = new int[n + 1][2 * n + 2];\n    for (int[] row : memo) Arrays.fill(row, -1);\n    return stoneGo(0, 1, n, suf, memo);\n}`,
        cpp: `static int stoneGo(int i, int m, int n, vector<int>& suf, vector<vector<int>>& memo) {\n    if (i >= n) return 0;\n    if (i + 2 * m >= n) return suf[i];\n    if (memo[i][m] >= 0) return memo[i][m];\n    int best = 0;\n    for (int x = 1; x <= 2 * m; x++) {\n        best = max(best, suf[i] - stoneGo(i + x, max(m, x), n, suf, memo));\n    }\n    memo[i][m] = best;\n    return best;\n}\n\nint stoneGameII(vector<int>& piles) {\n    int n = (int) piles.size();\n    vector<int> suf(n + 1, 0);\n    for (int i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] + piles[i];\n    vector<vector<int>> memo(n + 1, vector<int>(2 * n + 2, -1));\n    return stoneGo(0, 1, n, suf, memo);\n}`,
        c: `static int stoneGo(int i, int m, int n, int* suf, int* memo, int width) {\n    if (i >= n) return 0;\n    if (i + 2 * m >= n) return suf[i];\n    if (memo[i * width + m] >= 0) return memo[i * width + m];\n    int best = 0;\n    for (int x = 1; x <= 2 * m; x++) {\n        int nm = m > x ? m : x;\n        int take = suf[i] - stoneGo(i + x, nm, n, suf, memo, width);\n        if (take > best) best = take;\n    }\n    memo[i * width + m] = best;\n    return best;\n}\n\nint stoneGameII(int* piles, int pilesSize) {\n    int n = pilesSize;\n    int* suf = (int*) calloc((size_t) n + 1, sizeof(int));\n    for (int i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] + piles[i];\n    int width = 2 * n + 2;\n    int* memo = (int*) malloc((size_t) (n + 1) * (size_t) width * sizeof(int));\n    for (int i = 0; i < (n + 1) * width; i++) memo[i] = -1;\n    int ans = stoneGo(0, 1, n, suf, memo, width);\n    free(suf);\n    free(memo);\n    return ans;\n}`,
        csharp: `private static int StoneGo(int i, int m, int n, int[] suf, int[,] memo)\n{\n    if (i >= n) return 0;\n    if (i + 2 * m >= n) return suf[i];\n    if (memo[i, m] >= 0) return memo[i, m];\n    int best = 0;\n    for (int x = 1; x <= 2 * m; x++)\n    {\n        best = Math.Max(best, suf[i] - StoneGo(i + x, Math.Max(m, x), n, suf, memo));\n    }\n    memo[i, m] = best;\n    return best;\n}\n\npublic static int StoneGameII(int[] piles)\n{\n    int n = piles.Length;\n    int[] suf = new int[n + 1];\n    for (int i = n - 1; i >= 0; i--) suf[i] = suf[i + 1] + piles[i];\n    int[,] memo = new int[n + 1, 2 * n + 2];\n    for (int i = 0; i <= n; i++)\n        for (int j = 0; j < 2 * n + 2; j++)\n            memo[i, j] = -1;\n    return StoneGo(0, 1, n, suf, memo);\n}`,
        go: `func stoneGo(i int, m int, n int, suf []int, memo [][]int) int {\n\tif i >= n {\n\t\treturn 0\n\t}\n\tif i+2*m >= n {\n\t\treturn suf[i]\n\t}\n\tif memo[i][m] >= 0 {\n\t\treturn memo[i][m]\n\t}\n\tbest := 0\n\tfor x := 1; x <= 2*m; x++ {\n\t\tnm := m\n\t\tif x > nm {\n\t\t\tnm = x\n\t\t}\n\t\ttake := suf[i] - stoneGo(i+x, nm, n, suf, memo)\n\t\tif take > best {\n\t\t\tbest = take\n\t\t}\n\t}\n\tmemo[i][m] = best\n\treturn best\n}\n\nfunc stoneGameII(piles []int) int {\n\tn := len(piles)\n\tsuf := make([]int, n+1)\n\tfor i := n - 1; i >= 0; i-- {\n\t\tsuf[i] = suf[i+1] + piles[i]\n\t}\n\tmemo := make([][]int, n+1)\n\tfor i := range memo {\n\t\tmemo[i] = make([]int, 2*n+2)\n\t\tfor j := range memo[i] {\n\t\t\tmemo[i][j] = -1\n\t\t}\n\t}\n\treturn stoneGo(0, 1, n, suf, memo)\n}`,
        kotlin: `private fun stoneGo(i: Int, m: Int, n: Int, suf: IntArray, memo: Array<IntArray>): Int {\n    if (i >= n) return 0\n    if (i + 2 * m >= n) return suf[i]\n    if (memo[i][m] >= 0) return memo[i][m]\n    var best = 0\n    for (x in 1..2 * m) {\n        best = maxOf(best, suf[i] - stoneGo(i + x, maxOf(m, x), n, suf, memo))\n    }\n    memo[i][m] = best\n    return best\n}\n\nfun stoneGameII(piles: IntArray): Int {\n    val n = piles.size\n    val suf = IntArray(n + 1)\n    for (i in n - 1 downTo 0) suf[i] = suf[i + 1] + piles[i]\n    val memo = Array(n + 1) { IntArray(2 * n + 2) { -1 } }\n    return stoneGo(0, 1, n, suf, memo)\n}`,
        swift: `func stoneGameII(_ piles: [Int]) -> Int {\n    let n = piles.count\n    var suf = [Int](repeating: 0, count: n + 1)\n    var i = n - 1\n    while i >= 0 {\n        suf[i] = suf[i + 1] + piles[i]\n        i -= 1\n    }\n    var memo = [[Int]](repeating: [Int](repeating: -1, count: 2 * n + 2), count: n + 1)\n    func go(_ idx: Int, _ m: Int) -> Int {\n        if idx >= n { return 0 }\n        if idx + 2 * m >= n { return suf[idx] }\n        if memo[idx][m] >= 0 { return memo[idx][m] }\n        var best = 0\n        for x in 1...(2 * m) {\n            let take = suf[idx] - go(idx + x, max(m, x))\n            if take > best { best = take }\n        }\n        memo[idx][m] = best\n        return best\n    }\n    return go(0, 1)\n}`,
        rust: `fn stoneGameII(piles: Vec<i32>) -> i32 {\n    fn go(i: usize, m: usize, n: usize, suf: &Vec<i32>, memo: &mut Vec<Vec<i32>>) -> i32 {\n        if i >= n {\n            return 0;\n        }\n        if i + 2 * m >= n {\n            return suf[i];\n        }\n        if memo[i][m] >= 0 {\n            return memo[i][m];\n        }\n        let mut best = 0i32;\n        for x in 1..=(2 * m) {\n            let nm = if m > x { m } else { x };\n            let take = suf[i] - go(i + x, nm, n, suf, memo);\n            if take > best {\n                best = take;\n            }\n        }\n        memo[i][m] = best;\n        best\n    }\n    let n = piles.len();\n    let mut suf = vec![0i32; n + 1];\n    for i in (0..n).rev() {\n        suf[i] = suf[i + 1] + piles[i];\n    }\n    let mut memo = vec![vec![-1i32; 2 * n + 2]; n + 1];\n    go(0, 1, n, &suf, &mut memo)\n}`,
        php: `function stoneGameII($piles) {\n    $n = count($piles);\n    $suf = array_fill(0, $n + 1, 0);\n    for ($i = $n - 1; $i >= 0; $i--) $suf[$i] = $suf[$i + 1] + $piles[$i];\n    $memo = [];\n    for ($i = 0; $i <= $n; $i++) $memo[$i] = array_fill(0, 2 * $n + 2, -1);\n    $go = function($i, $m) use (&$go, $n, $suf, &$memo) {\n        if ($i >= $n) return 0;\n        if ($i + 2 * $m >= $n) return $suf[$i];\n        if ($memo[$i][$m] >= 0) return $memo[$i][$m];\n        $best = 0;\n        for ($x = 1; $x <= 2 * $m; $x++) {\n            $take = $suf[$i] - $go($i + $x, max($m, $x));\n            if ($take > $best) $best = $take;\n        }\n        $memo[$i][$m] = $best;\n        return $best;\n    };\n    return $go(0, 1);\n}`,
        ruby: `def stoneGameII(piles)\n  n = piles.length\n  suf = Array.new(n + 1, 0)\n  (n - 1).downto(0) { |i| suf[i] = suf[i + 1] + piles[i] }\n  memo = Array.new(n + 1) { Array.new(2 * n + 2, -1) }\n  go = lambda do |i, m|\n    next 0 if i >= n\n    next suf[i] if i + 2 * m >= n\n    next memo[i][m] if memo[i][m] >= 0\n    best = 0\n    (1..2 * m).each do |x|\n      take = suf[i] - go.call(i + x, [m, x].max)\n      best = take if take > best\n    end\n    memo[i][m] = best\n    best\n  end\n  go.call(0, 1)\nend`,
      },
    };
  })(),

  // ── Longest Ideal Subsequence (LC 2370) ─────────────────────────
  (() => {
    const ref = (s: string, k: number) => {
      const dp = new Array(26).fill(0);
      let best = 0;
      for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i) - 97;
        let cur = 0;
        const lo = Math.max(0, c - k), hi = Math.min(25, c + k);
        for (let d = lo; d <= hi; d++) if (dp[d] > cur) cur = dp[d];
        dp[c] = cur + 1;
        if (dp[c] > best) best = dp[c];
      }
      return best;
    };
    return {
      slug: "longest-ideal-subsequence",
      title: "Longest Ideal Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "String", "Dynamic Programming", "Amazon", "Google", "Atlassian"],
      signature: { funcName: "longestIdealString", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A subsequence of `s` is **ideal** when every pair of adjacent characters in it differs by at most `k` in the alphabet (using plain letter positions, with no wrap-around between `'z'` and `'a'`).\n\nReturn the length of the longest ideal subsequence.",
        [
          { in: 's = "acfgbd", k = 2', out: "4", note: '"acbd" — the steps a→c, c→b and b→d are all within 2.' },
          { in: 's = "abcd", k = 3', out: "4", note: "The whole string qualifies." },
          { in: 's = "abcd", k = 0', out: "1" },
        ],
        ["1 <= s.length <= 100000", "0 <= k <= 25", "s consists of lowercase English letters."]),
      hints: [
        "Only the **last letter** of the subsequence constrains what can come next — its position in the string does not.",
        "So keep 26 values: the best ideal subsequence ending at each letter.",
        "Appending `c` extends the best of the letters within `k` of it.",
      ],
      editorial: explain({
        idea: "Compress the state from 'index' down to 'last letter'. Scanning left to right, `dp[c]` holds the longest ideal subsequence seen so far that ends in letter `c`, and each new character updates exactly one entry.",
        steps: [
          "Keep `dp[0 … 25]`, all starting at 0.",
          "For each character `c` of `s`, take the maximum `dp[d]` over `|d - c| <= k`.",
          "Set `dp[c] = thatMax + 1` and track the overall best.",
        ],
        why: "A subsequence is extendable by `c` exactly when its last letter is within `k` of `c` — nothing else about it matters, so keeping only the best per last letter loses nothing. Processing the string in order guarantees that `dp[d]` only reflects characters strictly before the current one, which is what makes the result a genuine subsequence.",
        time: "O(n · 26)",
        space: "O(1)",
        pitfalls: [
          "The alphabet does not wrap: `'a'` and `'z'` are 25 apart, not 1.",
          "The scan must be left to right, updating `dp[c]` only after reading the window.",
          "`k = 0` allows only runs of the same letter.",
        ],
      }),
      examples: [
        { input: '"acfgbd"\n2', expectedOutput: "4" },
        { input: '"abcd"\n3', expectedOutput: "4" },
        { input: '"abcd"\n0', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const s = Array.from({ length: ri(rng, 1, 45) }, () => randLower(rng)).join("");
        const k = ri(rng, 0, 25);
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: `def longestIdealString(s: str, k: int) -> int:\n    dp = [0] * 26\n    best = 0\n    for ch in s:\n        c = ord(ch) - 97\n        lo, hi = max(0, c - k), min(25, c + k)\n        cur = max(dp[lo:hi + 1])\n        dp[c] = cur + 1\n        best = max(best, dp[c])\n    return best`,
        javascript: `var longestIdealString = function(s, k) {\n    var dp = [];\n    for (var t = 0; t < 26; t++) dp.push(0);\n    var best = 0;\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charCodeAt(i) - 97;\n        var cur = 0;\n        var lo = Math.max(0, c - k), hi = Math.min(25, c + k);\n        for (var d = lo; d <= hi; d++) if (dp[d] > cur) cur = dp[d];\n        dp[c] = cur + 1;\n        if (dp[c] > best) best = dp[c];\n    }\n    return best;\n};`,
        typescript: `function longestIdealString(s: string, k: number): number {\n    var dp: number[] = [];\n    for (var t = 0; t < 26; t++) dp.push(0);\n    var best = 0;\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charCodeAt(i) - 97;\n        var cur = 0;\n        var lo = Math.max(0, c - k), hi = Math.min(25, c + k);\n        for (var d = lo; d <= hi; d++) if (dp[d] > cur) cur = dp[d];\n        dp[c] = cur + 1;\n        if (dp[c] > best) best = dp[c];\n    }\n    return best;\n}`,
        java: `public static int longestIdealString(String s, int k) {\n    int[] dp = new int[26];\n    int best = 0;\n    for (int i = 0; i < s.length(); i++) {\n        int c = s.charAt(i) - 'a';\n        int cur = 0;\n        for (int d = Math.max(0, c - k); d <= Math.min(25, c + k); d++) {\n            cur = Math.max(cur, dp[d]);\n        }\n        dp[c] = cur + 1;\n        best = Math.max(best, dp[c]);\n    }\n    return best;\n}`,
        cpp: `int longestIdealString(string s, int k) {\n    vector<int> dp(26, 0);\n    int best = 0;\n    for (char ch : s) {\n        int c = ch - 'a';\n        int cur = 0;\n        for (int d = max(0, c - k); d <= min(25, c + k); d++) cur = max(cur, dp[d]);\n        dp[c] = cur + 1;\n        best = max(best, dp[c]);\n    }\n    return best;\n}`,
        c: `int longestIdealString(char* s, int k) {\n    int dp[26];\n    for (int i = 0; i < 26; i++) dp[i] = 0;\n    int best = 0;\n    for (int i = 0; s[i]; i++) {\n        int c = s[i] - 'a';\n        int lo = c - k < 0 ? 0 : c - k;\n        int hi = c + k > 25 ? 25 : c + k;\n        int cur = 0;\n        for (int d = lo; d <= hi; d++) if (dp[d] > cur) cur = dp[d];\n        dp[c] = cur + 1;\n        if (dp[c] > best) best = dp[c];\n    }\n    return best;\n}`,
        csharp: `public static int LongestIdealString(string s, int k)\n{\n    int[] dp = new int[26];\n    int best = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        int c = s[i] - 'a';\n        int cur = 0;\n        for (int d = Math.Max(0, c - k); d <= Math.Min(25, c + k); d++)\n        {\n            if (dp[d] > cur) cur = dp[d];\n        }\n        dp[c] = cur + 1;\n        if (dp[c] > best) best = dp[c];\n    }\n    return best;\n}`,
        go: `func longestIdealString(s string, k int) int {\n\tdp := make([]int, 26)\n\tbest := 0\n\tfor i := 0; i < len(s); i++ {\n\t\tc := int(s[i] - 'a')\n\t\tlo := c - k\n\t\tif lo < 0 {\n\t\t\tlo = 0\n\t\t}\n\t\thi := c + k\n\t\tif hi > 25 {\n\t\t\thi = 25\n\t\t}\n\t\tcur := 0\n\t\tfor d := lo; d <= hi; d++ {\n\t\t\tif dp[d] > cur {\n\t\t\t\tcur = dp[d]\n\t\t\t}\n\t\t}\n\t\tdp[c] = cur + 1\n\t\tif dp[c] > best {\n\t\t\tbest = dp[c]\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun longestIdealString(s: String, k: Int): Int {\n    val dp = IntArray(26)\n    var best = 0\n    for (ch in s) {\n        val c = ch - 'a'\n        var cur = 0\n        for (d in maxOf(0, c - k)..minOf(25, c + k)) {\n            if (dp[d] > cur) cur = dp[d]\n        }\n        dp[c] = cur + 1\n        if (dp[c] > best) best = dp[c]\n    }\n    return best\n}`,
        swift: `func longestIdealString(_ s: String, _ k: Int) -> Int {\n    var dp = [Int](repeating: 0, count: 26)\n    var best = 0\n    for ch in s.unicodeScalars {\n        let c = Int(ch.value) - 97\n        var cur = 0\n        for d in max(0, c - k)...min(25, c + k) {\n            if dp[d] > cur { cur = dp[d] }\n        }\n        dp[c] = cur + 1\n        if dp[c] > best { best = dp[c] }\n    }\n    return best\n}`,
        rust: `fn longestIdealString(s: String, k: i32) -> i32 {\n    let mut dp = [0i32; 26];\n    let mut best = 0i32;\n    for b in s.as_bytes().iter() {\n        let c = (b - b'a') as i32;\n        let lo = std::cmp::max(0, c - k) as usize;\n        let hi = std::cmp::min(25, c + k) as usize;\n        let mut cur = 0i32;\n        for d in lo..=hi {\n            if dp[d] > cur {\n                cur = dp[d];\n            }\n        }\n        dp[c as usize] = cur + 1;\n        if dp[c as usize] > best {\n            best = dp[c as usize];\n        }\n    }\n    best\n}`,
        php: `function longestIdealString($s, $k) {\n    $dp = array_fill(0, 26, 0);\n    $best = 0;\n    for ($i = 0; $i < strlen($s); $i++) {\n        $c = ord($s[$i]) - 97;\n        $lo = max(0, $c - $k);\n        $hi = min(25, $c + $k);\n        $cur = 0;\n        for ($d = $lo; $d <= $hi; $d++) if ($dp[$d] > $cur) $cur = $dp[$d];\n        $dp[$c] = $cur + 1;\n        if ($dp[$c] > $best) $best = $dp[$c];\n    }\n    return $best;\n}`,
        ruby: `def longestIdealString(s, k)\n  dp = Array.new(26, 0)\n  best = 0\n  s.each_char do |ch|\n    c = ch.ord - 97\n    lo = [0, c - k].max\n    hi = [25, c + k].min\n    cur = dp[lo..hi].max\n    dp[c] = cur + 1\n    best = dp[c] if dp[c] > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Number of People Aware of a Secret (LC 2327) ────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (n: number, delay: number, forget: number) => {
      const dp = new Array(n + 1).fill(0);
      dp[1] = 1;
      let share = 0, ans = 0;
      for (let i = 2; i <= n; i++) {
        if (i - delay >= 1) share = (share + dp[i - delay]) % MOD;
        if (i - forget >= 1) share = (share - dp[i - forget] + MOD) % MOD;
        dp[i] = share;
      }
      for (let i = Math.max(1, n - forget + 1); i <= n; i++) ans = (ans + dp[i]) % MOD;
      return ans;
    };
    return {
      slug: "number-of-people-aware-of-a-secret",
      title: "Number of People Aware of a Secret",
      difficulty: "MEDIUM" as const,
      tags: ["Queue", "Dynamic Programming", "Simulation", "Amazon", "Google", "Sprinklr"],
      signature: { funcName: "peopleAwareOfSecret", params: [{ name: "n", type: "int" as const }, { name: "delay", type: "int" as const }, { name: "forget", type: "int" as const }], returns: "int" as const },
      description: describe(
        "On day 1 one person learns a secret. Anyone who learns it starts sharing it with **one new person per day** beginning `delay` days later, and forgets it (and stops sharing) exactly `forget` days after learning it.\n\nReturn the number of people who still know the secret at the end of day `n`, modulo `10^9 + 7`.",
        [
          { in: "n = 6, delay = 2, forget = 4", out: "5" },
          { in: "n = 4, delay = 1, forget = 3", out: "6" },
          { in: "n = 2, delay = 1, forget = 2", out: "2", note: "On day 2 the first person shares with one other and only forgets on day 3." },
        ],
        ["2 <= n <= 1000", "1 <= delay < forget <= n"]),
      hints: [
        "Group people by the day they learned the secret — everyone in a group behaves identically.",
        "`dp[i]` is how many people learn it on day `i`; they share on days `i + delay … i + forget - 1`.",
        "Maintain the number of active sharers with a running sum that adds `dp[i - delay]` and removes `dp[i - forget]`.",
      ],
      editorial: explain({
        idea: "Track new learners per day. The number of people sharing on day `i` is a sliding window over earlier days — those who learned between `i - forget + 1` and `i - delay` — which a running sum maintains in constant time per day.",
        steps: [
          "`dp[1] = 1` for the original person.",
          "For each day `i`, add `dp[i - delay]` to the active sharer count (they start sharing today) and subtract `dp[i - forget]` (they forgot today).",
          "`dp[i]` equals that active count — each sharer tells exactly one new person.",
          "The answer sums `dp[i]` over the last `forget` days, since anyone earlier has already forgotten.",
        ],
        why: "Everyone who learns on the same day starts and stops sharing on the same days, so the whole population collapses to counts per learning day. A person who learned on day `j` is still remembering on day `n` exactly when `n - j < forget`, which is the summation range at the end.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Subtracting before taking the modulo can go negative — add `MOD` before reducing.",
          "The final sum runs over the last `forget` days, not over all days.",
          "Sharing starts `delay` days *after* learning, so day `i + delay` is the first one.",
        ],
      }),
      examples: [
        { input: "6\n2\n4", expectedOutput: "5" },
        { input: "4\n1\n3", expectedOutput: "6" },
        { input: "2\n1\n2", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 200);
        const forget = ri(rng, 2, n);
        const delay = ri(rng, 1, forget - 1);
        return { input: `${n}\n${delay}\n${forget}`, expectedOutput: String(ref(n, delay, forget)) };
      },
      solutions: {
        python: `def peopleAwareOfSecret(n: int, delay: int, forget: int) -> int:\n    MOD = 1000000007\n    dp = [0] * (n + 1)\n    dp[1] = 1\n    share = 0\n    for i in range(2, n + 1):\n        if i - delay >= 1:\n            share = (share + dp[i - delay]) % MOD\n        if i - forget >= 1:\n            share = (share - dp[i - forget]) % MOD\n        dp[i] = share\n    return sum(dp[max(1, n - forget + 1):n + 1]) % MOD`,
        javascript: `var peopleAwareOfSecret = function(n, delay, forget) {\n    var MOD = 1000000007;\n    var dp = [];\n    for (var t = 0; t <= n; t++) dp.push(0);\n    dp[1] = 1;\n    var share = 0, ans = 0;\n    for (var i = 2; i <= n; i++) {\n        if (i - delay >= 1) share = (share + dp[i - delay]) % MOD;\n        if (i - forget >= 1) share = (share - dp[i - forget] + MOD) % MOD;\n        dp[i] = share;\n    }\n    for (var j = Math.max(1, n - forget + 1); j <= n; j++) ans = (ans + dp[j]) % MOD;\n    return ans;\n};`,
        typescript: `function peopleAwareOfSecret(n: number, delay: number, forget: number): number {\n    var MOD = 1000000007;\n    var dp: number[] = [];\n    for (var t = 0; t <= n; t++) dp.push(0);\n    dp[1] = 1;\n    var share = 0, ans = 0;\n    for (var i = 2; i <= n; i++) {\n        if (i - delay >= 1) share = (share + dp[i - delay]) % MOD;\n        if (i - forget >= 1) share = (share - dp[i - forget] + MOD) % MOD;\n        dp[i] = share;\n    }\n    for (var j = Math.max(1, n - forget + 1); j <= n; j++) ans = (ans + dp[j]) % MOD;\n    return ans;\n}`,
        java: `public static int peopleAwareOfSecret(int n, int delay, int forget) {\n    final int MOD = 1000000007;\n    int[] dp = new int[n + 1];\n    dp[1] = 1;\n    int share = 0, ans = 0;\n    for (int i = 2; i <= n; i++) {\n        if (i - delay >= 1) share = (share + dp[i - delay]) % MOD;\n        if (i - forget >= 1) share = (share - dp[i - forget] + MOD) % MOD;\n        dp[i] = share;\n    }\n    for (int i = Math.max(1, n - forget + 1); i <= n; i++) ans = (ans + dp[i]) % MOD;\n    return ans;\n}`,
        cpp: `int peopleAwareOfSecret(int n, int delay, int forget) {\n    const int MOD = 1000000007;\n    vector<int> dp(n + 1, 0);\n    dp[1] = 1;\n    int share = 0, ans = 0;\n    for (int i = 2; i <= n; i++) {\n        if (i - delay >= 1) share = (share + dp[i - delay]) % MOD;\n        if (i - forget >= 1) share = (share - dp[i - forget] + MOD) % MOD;\n        dp[i] = share;\n    }\n    for (int i = max(1, n - forget + 1); i <= n; i++) ans = (ans + dp[i]) % MOD;\n    return ans;\n}`,
        c: `int peopleAwareOfSecret(int n, int delay, int forget) {\n    const int MOD = 1000000007;\n    int* dp = (int*) calloc((size_t) n + 1, sizeof(int));\n    dp[1] = 1;\n    int share = 0, ans = 0;\n    for (int i = 2; i <= n; i++) {\n        if (i - delay >= 1) share = (share + dp[i - delay]) % MOD;\n        if (i - forget >= 1) share = (share - dp[i - forget] + MOD) % MOD;\n        dp[i] = share;\n    }\n    int start = n - forget + 1;\n    if (start < 1) start = 1;\n    for (int i = start; i <= n; i++) ans = (ans + dp[i]) % MOD;\n    free(dp);\n    return ans;\n}`,
        csharp: `public static int PeopleAwareOfSecret(int n, int delay, int forget)\n{\n    const int MOD = 1000000007;\n    int[] dp = new int[n + 1];\n    dp[1] = 1;\n    int share = 0, ans = 0;\n    for (int i = 2; i <= n; i++)\n    {\n        if (i - delay >= 1) share = (share + dp[i - delay]) % MOD;\n        if (i - forget >= 1) share = (share - dp[i - forget] + MOD) % MOD;\n        dp[i] = share;\n    }\n    for (int i = Math.Max(1, n - forget + 1); i <= n; i++) ans = (ans + dp[i]) % MOD;\n    return ans;\n}`,
        go: `func peopleAwareOfSecret(n int, delay int, forget int) int {\n\tconst MOD = 1000000007\n\tdp := make([]int, n+1)\n\tdp[1] = 1\n\tshare, ans := 0, 0\n\tfor i := 2; i <= n; i++ {\n\t\tif i-delay >= 1 {\n\t\t\tshare = (share + dp[i-delay]) % MOD\n\t\t}\n\t\tif i-forget >= 1 {\n\t\t\tshare = (share - dp[i-forget] + MOD) % MOD\n\t\t}\n\t\tdp[i] = share\n\t}\n\tstart := n - forget + 1\n\tif start < 1 {\n\t\tstart = 1\n\t}\n\tfor i := start; i <= n; i++ {\n\t\tans = (ans + dp[i]) % MOD\n\t}\n\treturn ans\n}`,
        kotlin: `fun peopleAwareOfSecret(n: Int, delay: Int, forget: Int): Int {\n    val MOD = 1000000007\n    val dp = IntArray(n + 1)\n    dp[1] = 1\n    var share = 0\n    var ans = 0\n    for (i in 2..n) {\n        if (i - delay >= 1) share = (share + dp[i - delay]) % MOD\n        if (i - forget >= 1) share = (share - dp[i - forget] + MOD) % MOD\n        dp[i] = share\n    }\n    for (i in maxOf(1, n - forget + 1)..n) ans = (ans + dp[i]) % MOD\n    return ans\n}`,
        swift: `func peopleAwareOfSecret(_ n: Int, _ delay: Int, _ forget: Int) -> Int {\n    let MOD = 1000000007\n    var dp = [Int](repeating: 0, count: n + 1)\n    dp[1] = 1\n    var share = 0\n    var ans = 0\n    if n >= 2 {\n        for i in 2...n {\n            if i - delay >= 1 { share = (share + dp[i - delay]) % MOD }\n            if i - forget >= 1 { share = (share - dp[i - forget] + MOD) % MOD }\n            dp[i] = share\n        }\n    }\n    for i in max(1, n - forget + 1)...n { ans = (ans + dp[i]) % MOD }\n    return ans\n}`,
        rust: `fn peopleAwareOfSecret(n: i32, delay: i32, forget: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let nn = n as usize;\n    let mut dp = vec![0i64; nn + 1];\n    dp[1] = 1;\n    let mut share: i64 = 0;\n    for i in 2..=n {\n        if i - delay >= 1 {\n            share = (share + dp[(i - delay) as usize]) % MOD;\n        }\n        if i - forget >= 1 {\n            share = (share - dp[(i - forget) as usize] + MOD) % MOD;\n        }\n        dp[i as usize] = share;\n    }\n    let start = std::cmp::max(1, n - forget + 1);\n    let mut ans: i64 = 0;\n    for i in start..=n {\n        ans = (ans + dp[i as usize]) % MOD;\n    }\n    ans as i32\n}`,
        php: `function peopleAwareOfSecret($n, $delay, $forget) {\n    $MOD = 1000000007;\n    $dp = array_fill(0, $n + 1, 0);\n    $dp[1] = 1;\n    $share = 0;\n    $ans = 0;\n    for ($i = 2; $i <= $n; $i++) {\n        if ($i - $delay >= 1) $share = ($share + $dp[$i - $delay]) % $MOD;\n        if ($i - $forget >= 1) $share = ($share - $dp[$i - $forget] + $MOD) % $MOD;\n        $dp[$i] = $share;\n    }\n    for ($i = max(1, $n - $forget + 1); $i <= $n; $i++) $ans = ($ans + $dp[$i]) % $MOD;\n    return $ans;\n}`,
        ruby: `def peopleAwareOfSecret(n, delay, forget)\n  mod = 1000000007\n  dp = Array.new(n + 1, 0)\n  dp[1] = 1\n  share = 0\n  ans = 0\n  (2..n).each do |i|\n    share = (share + dp[i - delay]) % mod if i - delay >= 1\n    share = (share - dp[i - forget] + mod) % mod if i - forget >= 1\n    dp[i] = share\n  end\n  ([1, n - forget + 1].max..n).each { |i| ans = (ans + dp[i]) % mod }\n  ans\nend`,
      },
    };
  })(),

  // ── Number of Ways to Select Buildings (LC 2222) ────────────────
  (() => {
    const ref = (s: string) => {
      let totalZeros = 0, totalOnes = 0;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "0") totalZeros++; else totalOnes++;
      }
      let res = 0, z = 0, o = 0;
      for (let i = 0; i < s.length; i++) {
        if (s[i] === "0") { res += o * (totalOnes - o); z++; }
        else { res += z * (totalZeros - z); o++; }
      }
      return res;
    };
    return {
      slug: "number-of-ways-to-select-buildings",
      title: "Number of Ways to Select Buildings",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Prefix Sum", "Amazon", "Google", "Zoho"],
      signature: { funcName: "numberOfWays", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "`s[i]` is `'0'` for an office and `'1'` for a restaurant. You must pick **three** buildings, in order of position, so that **no two consecutive picks are the same type** — that is, the picked pattern is `\"010\"` or `\"101\"`.\n\nReturn the number of valid selections.",
        [
          { in: 's = "001101"', out: "6" },
          { in: 's = "11100"', out: "0", note: "No valid alternating triple exists." },
          { in: 's = "0101"', out: "2", note: '"010" using positions 0,1,2 and "101" using 1,2,3.' },
        ],
        ["3 <= s.length <= 1500", "s[i] is '0' or '1'"]),
      hints: [
        "Enumerate by the **middle** building — the two ends are then forced to be the other type.",
        "For a middle `'1'` at index `i`, the count is (zeros before `i`) × (zeros after `i`).",
        "Keep running prefix counts of each type as you sweep.",
      ],
      editorial: explain({
        idea: "Fix the middle pick. The pattern must alternate, so the two outer picks are both the opposite type, and they are chosen independently from the prefix and the suffix — a simple product.",
        steps: [
          "Count the total zeros and ones.",
          "Sweep, keeping `z` and `o`, the counts strictly before the current index.",
          "At a `'1'`, add `z · (totalZeros - z)`; at a `'0'`, add `o · (totalOnes - o)`.",
        ],
        why: "Every valid triple has exactly one middle element, so classifying by it counts each triple once. Given the middle, the left pick is any opposite-type building before it and the right pick any opposite-type building after it, and those choices are independent — hence the product.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Enumerating triples directly is `O(n³)`.",
          "The running counts must exclude the current index, which is why they are updated *after* the contribution.",
          "The total reaches about `5 · 10^8` at the stated size.",
        ],
      }),
      examples: [
        { input: '"001101"', expectedOutput: "6" },
        { input: '"11100"', expectedOutput: "0" },
        { input: '"0101"', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const s = Array.from({ length: ri(rng, 3, 45) }, () => (rng() < 0.5 ? "1" : "0")).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def numberOfWays(s: str) -> int:\n    total_zeros = s.count("0")\n    total_ones = len(s) - total_zeros\n    res = z = o = 0\n    for ch in s:\n        if ch == "0":\n            res += o * (total_ones - o)\n            z += 1\n        else:\n            res += z * (total_zeros - z)\n            o += 1\n    return res`,
        javascript: `var numberOfWays = function(s) {\n    var totalZeros = 0, totalOnes = 0, i;\n    for (i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "0") totalZeros++; else totalOnes++;\n    }\n    var res = 0, z = 0, o = 0;\n    for (i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "0") { res += o * (totalOnes - o); z++; }\n        else { res += z * (totalZeros - z); o++; }\n    }\n    return res;\n};`,
        typescript: `function numberOfWays(s: string): number {\n    var totalZeros = 0, totalOnes = 0, i: number;\n    for (i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "0") totalZeros++; else totalOnes++;\n    }\n    var res = 0, z = 0, o = 0;\n    for (i = 0; i < s.length; i++) {\n        if (s.charAt(i) === "0") { res += o * (totalOnes - o); z++; }\n        else { res += z * (totalZeros - z); o++; }\n    }\n    return res;\n}`,
        java: `public static int numberOfWays(String s) {\n    long totalZeros = 0, totalOnes = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == '0') totalZeros++; else totalOnes++;\n    }\n    long res = 0, z = 0, o = 0;\n    for (int i = 0; i < s.length(); i++) {\n        if (s.charAt(i) == '0') {\n            res += o * (totalOnes - o);\n            z++;\n        } else {\n            res += z * (totalZeros - z);\n            o++;\n        }\n    }\n    return (int) res;\n}`,
        cpp: `int numberOfWays(string s) {\n    long long totalZeros = 0, totalOnes = 0;\n    for (char ch : s) {\n        if (ch == '0') totalZeros++; else totalOnes++;\n    }\n    long long res = 0, z = 0, o = 0;\n    for (char ch : s) {\n        if (ch == '0') {\n            res += o * (totalOnes - o);\n            z++;\n        } else {\n            res += z * (totalZeros - z);\n            o++;\n        }\n    }\n    return (int) res;\n}`,
        c: `int numberOfWays(char* s) {\n    long long totalZeros = 0, totalOnes = 0;\n    for (int i = 0; s[i]; i++) {\n        if (s[i] == '0') totalZeros++; else totalOnes++;\n    }\n    long long res = 0, z = 0, o = 0;\n    for (int i = 0; s[i]; i++) {\n        if (s[i] == '0') {\n            res += o * (totalOnes - o);\n            z++;\n        } else {\n            res += z * (totalZeros - z);\n            o++;\n        }\n    }\n    return (int) res;\n}`,
        csharp: `public static int NumberOfWays(string s)\n{\n    long totalZeros = 0, totalOnes = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (s[i] == '0') totalZeros++; else totalOnes++;\n    }\n    long res = 0, z = 0, o = 0;\n    for (int i = 0; i < s.Length; i++)\n    {\n        if (s[i] == '0')\n        {\n            res += o * (totalOnes - o);\n            z++;\n        }\n        else\n        {\n            res += z * (totalZeros - z);\n            o++;\n        }\n    }\n    return (int) res;\n}`,
        go: `func numberOfWays(s string) int {\n\ttotalZeros, totalOnes := 0, 0\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] == '0' {\n\t\t\ttotalZeros++\n\t\t} else {\n\t\t\ttotalOnes++\n\t\t}\n\t}\n\tres, z, o := 0, 0, 0\n\tfor i := 0; i < len(s); i++ {\n\t\tif s[i] == '0' {\n\t\t\tres += o * (totalOnes - o)\n\t\t\tz++\n\t\t} else {\n\t\t\tres += z * (totalZeros - z)\n\t\t\to++\n\t\t}\n\t}\n\treturn res\n}`,
        kotlin: `fun numberOfWays(s: String): Int {\n    var totalZeros = 0L\n    var totalOnes = 0L\n    for (ch in s) {\n        if (ch == '0') totalZeros++ else totalOnes++\n    }\n    var res = 0L\n    var z = 0L\n    var o = 0L\n    for (ch in s) {\n        if (ch == '0') {\n            res += o * (totalOnes - o)\n            z++\n        } else {\n            res += z * (totalZeros - z)\n            o++\n        }\n    }\n    return res.toInt()\n}`,
        swift: `func numberOfWays(_ s: String) -> Int {\n    let a = Array(s)\n    var totalZeros = 0\n    var totalOnes = 0\n    for ch in a {\n        if ch == "0" { totalZeros += 1 } else { totalOnes += 1 }\n    }\n    var res = 0\n    var z = 0\n    var o = 0\n    for ch in a {\n        if ch == "0" {\n            res += o * (totalOnes - o)\n            z += 1\n        } else {\n            res += z * (totalZeros - z)\n            o += 1\n        }\n    }\n    return res\n}`,
        rust: `fn numberOfWays(s: String) -> i32 {\n    let b = s.as_bytes();\n    let mut total_zeros: i64 = 0;\n    let mut total_ones: i64 = 0;\n    for &ch in b.iter() {\n        if ch == b'0' {\n            total_zeros += 1;\n        } else {\n            total_ones += 1;\n        }\n    }\n    let mut res: i64 = 0;\n    let mut z: i64 = 0;\n    let mut o: i64 = 0;\n    for &ch in b.iter() {\n        if ch == b'0' {\n            res += o * (total_ones - o);\n            z += 1;\n        } else {\n            res += z * (total_zeros - z);\n            o += 1;\n        }\n    }\n    res as i32\n}`,
        php: `function numberOfWays($s) {\n    $totalZeros = 0;\n    $totalOnes = 0;\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        if ($s[$i] === "0") $totalZeros++; else $totalOnes++;\n    }\n    $res = 0;\n    $z = 0;\n    $o = 0;\n    for ($i = 0; $i < $n; $i++) {\n        if ($s[$i] === "0") {\n            $res += $o * ($totalOnes - $o);\n            $z++;\n        } else {\n            $res += $z * ($totalZeros - $z);\n            $o++;\n        }\n    }\n    return $res;\n}`,
        ruby: `def numberOfWays(s)\n  total_zeros = s.count("0")\n  total_ones = s.length - total_zeros\n  res = 0\n  z = 0\n  o = 0\n  s.each_char do |ch|\n    if ch == "0"\n      res += o * (total_ones - o)\n      z += 1\n    else\n      res += z * (total_zeros - z)\n      o += 1\n    end\n  end\n  res\nend`,
      },
    };
  })(),

  // ── Longest Binary Subsequence Less Than or Equal to K (LC 2311) ──
  (() => {
    const ref = (s: string, k: number) => {
      const n = s.length;
      let zeros = 0;
      for (let i = 0; i < n; i++) if (s[i] === "0") zeros++;
      let val = 0, ones = 0, pow = 1;
      for (let i = n - 1; i >= 0; i--) {
        if (s[i] === "1" && pow <= k && val + pow <= k) { val += pow; ones++; }
        if (pow <= k) pow *= 2;
      }
      return zeros + ones;
    };
    return {
      slug: "longest-binary-subsequence-less-than-or-equal-to-k",
      title: "Longest Binary Subsequence Less Than or Equal to K",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Greedy", "Dynamic Programming", "Memoization", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "longestSubsequence", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Return the length of the longest **subsequence** of the binary string `s` whose value, read as a binary number, is at most `k`. Leading zeros are allowed.",
        [
          { in: 's = "1001010", k = 5', out: "5", note: 'Taking "00010" gives the value 2.' },
          { in: 's = "00101001", k = 1', out: "6", note: 'Taking "000001" gives the value 1.' },
          { in: 's = "1", k = 0', out: "0" },
        ],
        ["1 <= s.length <= 1000", "s[i] is '0' or '1'", "1 <= k <= 1000000000"]),
      hints: [
        "Every `'0'` can be taken for free — leading zeros do not change the value.",
        "So the only question is how many `'1'`s to keep, and which.",
        "Ones nearer the **right** carry smaller place values, so take them first while the total stays within `k`.",
      ],
      editorial: explain({
        idea: "Zeros are always free, so the answer is `(number of zeros) + (maximum number of ones affordable)`. Among the ones, the cheapest to keep are the rightmost, because their place value in the resulting subsequence is smallest.",
        steps: [
          "Count all the zeros — every one of them joins the subsequence.",
          "Sweep from the right, tracking the place value `pow` of the next position (1, 2, 4, …).",
          "Take a `'1'` whenever `pow <= k` and the running value plus `pow` stays at or below `k`.",
        ],
        why: "Dropping a `'0'` never reduces the value but always shortens the subsequence, so keeping all of them is free and optimal. For the ones, the `j`-th kept one from the right contributes at least `2^j`, so keeping the rightmost ones minimises the total for any fixed count — making the greedy count maximal. Once `pow` exceeds `k`, no further one can be afforded, so the sweep can stop growing it.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "`pow` doubles without a guard and overflows quickly — stop once it exceeds `k`.",
          "Taking ones from the left picks the expensive ones first and under-counts.",
          "Zeros are always included, even when `k` is tiny.",
        ],
      }),
      examples: [
        { input: '"1001010"\n5', expectedOutput: "5" },
        { input: '"00101001"\n1', expectedOutput: "6" },
        { input: '"1"\n0', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const s = Array.from({ length: ri(rng, 1, 45) }, () => (rng() < 0.5 ? "1" : "0")).join("");
        const k = rng() < 0.6 ? ri(rng, 0, 60) : ri(rng, 0, 1000000000);
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: `def longestSubsequence(s: str, k: int) -> int:\n    zeros = s.count("0")\n    val = ones = 0\n    pow2 = 1\n    for ch in reversed(s):\n        if ch == "1" and pow2 <= k and val + pow2 <= k:\n            val += pow2\n            ones += 1\n        if pow2 <= k:\n            pow2 *= 2\n    return zeros + ones`,
        javascript: `var longestSubsequence = function(s, k) {\n    var n = s.length, zeros = 0, i;\n    for (i = 0; i < n; i++) if (s.charAt(i) === "0") zeros++;\n    var val = 0, ones = 0, pow = 1;\n    for (i = n - 1; i >= 0; i--) {\n        if (s.charAt(i) === "1" && pow <= k && val + pow <= k) { val += pow; ones++; }\n        if (pow <= k) pow *= 2;\n    }\n    return zeros + ones;\n};`,
        typescript: `function longestSubsequence(s: string, k: number): number {\n    var n = s.length, zeros = 0, i: number;\n    for (i = 0; i < n; i++) if (s.charAt(i) === "0") zeros++;\n    var val = 0, ones = 0, pow = 1;\n    for (i = n - 1; i >= 0; i--) {\n        if (s.charAt(i) === "1" && pow <= k && val + pow <= k) { val += pow; ones++; }\n        if (pow <= k) pow *= 2;\n    }\n    return zeros + ones;\n}`,
        java: `public static int longestSubsequence(String s, int k) {\n    int n = s.length(), zeros = 0;\n    for (int i = 0; i < n; i++) if (s.charAt(i) == '0') zeros++;\n    long val = 0, pow = 1;\n    int ones = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        if (s.charAt(i) == '1' && pow <= k && val + pow <= k) {\n            val += pow;\n            ones++;\n        }\n        if (pow <= k) pow *= 2;\n    }\n    return zeros + ones;\n}`,
        cpp: `int longestSubsequence(string s, int k) {\n    int n = (int) s.size(), zeros = 0;\n    for (char ch : s) if (ch == '0') zeros++;\n    long long val = 0, pw = 1;\n    int ones = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        if (s[i] == '1' && pw <= k && val + pw <= k) {\n            val += pw;\n            ones++;\n        }\n        if (pw <= k) pw *= 2;\n    }\n    return zeros + ones;\n}`,
        c: `int longestSubsequence(char* s, int k) {\n    int n = (int) strlen(s), zeros = 0;\n    for (int i = 0; i < n; i++) if (s[i] == '0') zeros++;\n    long long val = 0, pw = 1;\n    int ones = 0;\n    for (int i = n - 1; i >= 0; i--) {\n        if (s[i] == '1' && pw <= (long long) k && val + pw <= (long long) k) {\n            val += pw;\n            ones++;\n        }\n        if (pw <= (long long) k) pw *= 2;\n    }\n    return zeros + ones;\n}`,
        csharp: `public static int LongestSubsequence(string s, int k)\n{\n    int n = s.Length, zeros = 0;\n    for (int i = 0; i < n; i++) if (s[i] == '0') zeros++;\n    long val = 0, pow = 1;\n    int ones = 0;\n    for (int i = n - 1; i >= 0; i--)\n    {\n        if (s[i] == '1' && pow <= k && val + pow <= k)\n        {\n            val += pow;\n            ones++;\n        }\n        if (pow <= k) pow *= 2;\n    }\n    return zeros + ones;\n}`,
        go: `func longestSubsequence(s string, k int) int {\n\tn := len(s)\n\tzeros := 0\n\tfor i := 0; i < n; i++ {\n\t\tif s[i] == '0' {\n\t\t\tzeros++\n\t\t}\n\t}\n\tval, ones, pw := 0, 0, 1\n\tfor i := n - 1; i >= 0; i-- {\n\t\tif s[i] == '1' && pw <= k && val+pw <= k {\n\t\t\tval += pw\n\t\t\tones++\n\t\t}\n\t\tif pw <= k {\n\t\t\tpw *= 2\n\t\t}\n\t}\n\treturn zeros + ones\n}`,
        kotlin: `fun longestSubsequence(s: String, k: Int): Int {\n    val n = s.length\n    var zeros = 0\n    for (ch in s) if (ch == '0') zeros++\n    var value = 0L\n    var pw = 1L\n    var ones = 0\n    for (i in n - 1 downTo 0) {\n        if (s[i] == '1' && pw <= k && value + pw <= k) {\n            value += pw\n            ones++\n        }\n        if (pw <= k) pw *= 2\n    }\n    return zeros + ones\n}`,
        swift: `func longestSubsequence(_ s: String, _ k: Int) -> Int {\n    let a = Array(s)\n    let n = a.count\n    var zeros = 0\n    for ch in a where ch == "0" { zeros += 1 }\n    var val = 0\n    var ones = 0\n    var pw = 1\n    var i = n - 1\n    while i >= 0 {\n        if a[i] == "1" && pw <= k && val + pw <= k {\n            val += pw\n            ones += 1\n        }\n        if pw <= k { pw *= 2 }\n        i -= 1\n    }\n    return zeros + ones\n}`,
        rust: `fn longestSubsequence(s: String, k: i32) -> i32 {\n    let b = s.as_bytes();\n    let n = b.len();\n    let mut zeros = 0i32;\n    for &ch in b.iter() {\n        if ch == b'0' {\n            zeros += 1;\n        }\n    }\n    let mut val: i64 = 0;\n    let mut pw: i64 = 1;\n    let mut ones = 0i32;\n    for i in (0..n).rev() {\n        if b[i] == b'1' && pw <= k as i64 && val + pw <= k as i64 {\n            val += pw;\n            ones += 1;\n        }\n        if pw <= k as i64 {\n            pw *= 2;\n        }\n    }\n    zeros + ones\n}`,
        php: `function longestSubsequence($s, $k) {\n    $n = strlen($s);\n    $zeros = 0;\n    for ($i = 0; $i < $n; $i++) if ($s[$i] === "0") $zeros++;\n    $val = 0;\n    $ones = 0;\n    $pw = 1;\n    for ($i = $n - 1; $i >= 0; $i--) {\n        if ($s[$i] === "1" && $pw <= $k && $val + $pw <= $k) {\n            $val += $pw;\n            $ones++;\n        }\n        if ($pw <= $k) $pw *= 2;\n    }\n    return $zeros + $ones;\n}`,
        ruby: `def longestSubsequence(s, k)\n  zeros = s.count("0")\n  val = 0\n  ones = 0\n  pw = 1\n  (s.length - 1).downto(0) do |i|\n    if s[i] == "1" && pw <= k && val + pw <= k\n      val += pw\n      ones += 1\n    end\n    pw *= 2 if pw <= k\n  end\n  zeros + ones\nend`,
      },
    };
  })(),

  // ── The Number of Beautiful Subsets (LC 2597) ───────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const cnt: Record<number, number> = {};
      for (let i = 0; i < nums.length; i++) cnt[nums[i]] = (cnt[nums[i]] || 0) + 1;
      const vals = Object.keys(cnt).map(Number).sort((a, b) => a - b);
      const done: Record<number, boolean> = {};
      let total = 1;
      for (let a = 0; a < vals.length; a++) {
        const r = vals[a] % k;
        if (done[r]) continue;
        done[r] = true;
        let prevSkip = 1, prevTake = 0, prevVal = -1, started = false;
        for (let b = 0; b < vals.length; b++) {
          const u = vals[b];
          if (u % k !== r) continue;
          const ways = (1 << cnt[u]) - 1;
          const take = (started && u - prevVal === k) ? prevSkip * ways : (prevSkip + prevTake) * ways;
          const skip = prevSkip + prevTake;
          prevSkip = skip;
          prevTake = take;
          prevVal = u;
          started = true;
        }
        total *= prevSkip + prevTake;
      }
      return total - 1;
    };
    return {
      slug: "the-number-of-beautiful-subsets",
      title: "The Number of Beautiful Subsets",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Backtracking", "Amazon", "Google", "Intuit"],
      signature: { funcName: "beautifulSubsets", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A subset is **beautiful** when it contains no two elements whose absolute difference is exactly `k`.\n\nReturn the number of non-empty beautiful subsets of `nums`. Subsets are counted by the indices they use, so equal values at different positions give different subsets.",
        [
          { in: "nums = [2,4,6], k = 2", out: "4", note: "The beautiful subsets are [2], [4], [6] and [2,6]." },
          { in: "nums = [1], k = 1", out: "1" },
          { in: "nums = [4,2,5,9,10,3], k = 1", out: "23" },
        ],
        ["1 <= nums.length <= 20", "1 <= nums[i], k <= 1000"]),
      hints: [
        "Two values can conflict only if they are congruent modulo `k`, so the residue classes are independent.",
        "Within a class, sort the distinct values; conflicts happen only between values exactly `k` apart — a chain.",
        "Along a chain it is the House Robber recurrence, with each value contributing `2^count - 1` ways to pick at least one copy.",
      ],
      editorial: explain({
        idea: "Split by residue modulo `k`. Different classes never conflict, so their counts multiply. Inside a class, sort the distinct values: the only forbidden pairs are consecutive values differing by exactly `k`, which is a path — the classic take-or-skip DP.",
        steps: [
          "Tally the multiplicity of each value and list the distinct values sorted.",
          "For each residue class, run a take/skip DP over its values: taking a value contributes `2^count - 1` (any non-empty choice of its copies) and, when the previous value is exactly `k` smaller, may only follow a skip.",
          "Multiply the per-class totals, then subtract 1 to drop the empty subset.",
        ],
        why: "`|a - b| = k` forces `a ≡ b (mod k)`, so conflicts never cross residue classes and the classes are independent — hence the product. Within a class the sorted values form a path where each node conflicts only with its neighbours at distance `k`, and the take/skip recurrence counts independent sets on a path exactly. The `2^count - 1` factor accounts for equal values being distinguishable by index.",
        time: "O(V²) over the distinct values",
        space: "O(V)",
        pitfalls: [
          "Values equal to each other never conflict (their difference is 0, not `k`), so all their copies may be taken together.",
          "Two values in the same class that are `2k` apart do **not** conflict — only consecutive chain links do.",
          "The empty subset must be subtracted at the end, once, not per class.",
        ],
      }),
      examples: [
        { input: "[2,4,6]\n2", expectedOutput: "4" },
        { input: "[1]\n1", expectedOutput: "1" },
        { input: "[4,2,5,9,10,3]\n1", expectedOutput: "23" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 12) }, () => ri(rng, 1, rng() < 0.6 ? 12 : 1000));
        const k = ri(rng, 1, rng() < 0.6 ? 5 : 1000);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef beautifulSubsets(nums: List[int], k: int) -> int:\n    cnt = {}\n    for x in nums:\n        cnt[x] = cnt.get(x, 0) + 1\n    vals = sorted(cnt)\n    done = set()\n    total = 1\n    for v in vals:\n        r = v % k\n        if r in done:\n            continue\n        done.add(r)\n        prev_skip, prev_take, prev_val, started = 1, 0, -1, False\n        for u in vals:\n            if u % k != r:\n                continue\n            ways = (1 << cnt[u]) - 1\n            take = prev_skip * ways if (started and u - prev_val == k) else (prev_skip + prev_take) * ways\n            skip = prev_skip + prev_take\n            prev_skip, prev_take, prev_val, started = skip, take, u, True\n        total *= prev_skip + prev_take\n    return total - 1`,
        javascript: `var beautifulSubsets = function(nums, k) {\n    var cnt = {}, i;\n    for (i = 0; i < nums.length; i++) cnt[nums[i]] = (cnt[nums[i]] || 0) + 1;\n    var vals = Object.keys(cnt).map(Number).sort(function(a, b) { return a - b; });\n    var done = {};\n    var total = 1;\n    for (var a = 0; a < vals.length; a++) {\n        var r = vals[a] % k;\n        if (done[r]) continue;\n        done[r] = true;\n        var prevSkip = 1, prevTake = 0, prevVal = -1, started = false;\n        for (var b = 0; b < vals.length; b++) {\n            var u = vals[b];\n            if (u % k !== r) continue;\n            var ways = (1 << cnt[u]) - 1;\n            var take = (started && u - prevVal === k) ? prevSkip * ways : (prevSkip + prevTake) * ways;\n            var skip = prevSkip + prevTake;\n            prevSkip = skip;\n            prevTake = take;\n            prevVal = u;\n            started = true;\n        }\n        total *= prevSkip + prevTake;\n    }\n    return total - 1;\n};`,
        typescript: `function beautifulSubsets(nums: number[], k: number): number {\n    var cnt: { [key: number]: number } = {};\n    var i: number;\n    for (i = 0; i < nums.length; i++) cnt[nums[i]] = (cnt[nums[i]] || 0) + 1;\n    var vals = Object.keys(cnt).map(Number).sort(function(a, b) { return a - b; });\n    var done: { [key: number]: boolean } = {};\n    var total = 1;\n    for (var a = 0; a < vals.length; a++) {\n        var r = vals[a] % k;\n        if (done[r]) continue;\n        done[r] = true;\n        var prevSkip = 1, prevTake = 0, prevVal = -1, started = false;\n        for (var b = 0; b < vals.length; b++) {\n            var u = vals[b];\n            if (u % k !== r) continue;\n            var ways = (1 << cnt[u]) - 1;\n            var take = (started && u - prevVal === k) ? prevSkip * ways : (prevSkip + prevTake) * ways;\n            var skip = prevSkip + prevTake;\n            prevSkip = skip;\n            prevTake = take;\n            prevVal = u;\n            started = true;\n        }\n        total *= prevSkip + prevTake;\n    }\n    return total - 1;\n}`,
        java: `public static int beautifulSubsets(int[] nums, int k) {\n    Map<Integer, Integer> cnt = new HashMap<>();\n    for (int x : nums) cnt.merge(x, 1, Integer::sum);\n    List<Integer> vals = new ArrayList<>(cnt.keySet());\n    Collections.sort(vals);\n    Set<Integer> done = new HashSet<>();\n    long total = 1;\n    for (int v : vals) {\n        int r = v % k;\n        if (!done.add(r)) continue;\n        long prevSkip = 1, prevTake = 0;\n        int prevVal = -1;\n        boolean started = false;\n        for (int u : vals) {\n            if (u % k != r) continue;\n            long ways = (1L << cnt.get(u)) - 1;\n            long take = (started && u - prevVal == k) ? prevSkip * ways : (prevSkip + prevTake) * ways;\n            long skip = prevSkip + prevTake;\n            prevSkip = skip;\n            prevTake = take;\n            prevVal = u;\n            started = true;\n        }\n        total *= prevSkip + prevTake;\n    }\n    return (int) (total - 1);\n}`,
        cpp: `int beautifulSubsets(vector<int>& nums, int k) {\n    map<int, int> cnt;\n    for (int x : nums) cnt[x]++;\n    vector<int> vals;\n    for (auto& p : cnt) vals.push_back(p.first);\n    set<int> done;\n    long long total = 1;\n    for (int v : vals) {\n        int r = v % k;\n        if (done.count(r)) continue;\n        done.insert(r);\n        long long prevSkip = 1, prevTake = 0;\n        int prevVal = -1;\n        bool started = false;\n        for (int u : vals) {\n            if (u % k != r) continue;\n            long long ways = (1LL << cnt[u]) - 1;\n            long long take = (started && u - prevVal == k) ? prevSkip * ways : (prevSkip + prevTake) * ways;\n            long long skip = prevSkip + prevTake;\n            prevSkip = skip;\n            prevTake = take;\n            prevVal = u;\n            started = true;\n        }\n        total *= prevSkip + prevTake;\n    }\n    return (int) (total - 1);\n}`,
        c: `static int cmpBeautyAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint beautifulSubsets(int* nums, int numsSize, int k) {\n    int cnt[1001];\n    for (int i = 0; i <= 1000; i++) cnt[i] = 0;\n    for (int i = 0; i < numsSize; i++) cnt[nums[i]]++;\n    int vals[1001];\n    int m = 0;\n    for (int v = 1; v <= 1000; v++) if (cnt[v] > 0) vals[m++] = v;\n    qsort(vals, (size_t) m, sizeof(int), cmpBeautyAsc);\n    char done[1001];\n    for (int i = 0; i <= 1000; i++) done[i] = 0;\n    long long total = 1;\n    for (int a = 0; a < m; a++) {\n        int r = vals[a] % k;\n        if (done[r]) continue;\n        done[r] = 1;\n        long long prevSkip = 1, prevTake = 0;\n        int prevVal = -1, started = 0;\n        for (int b = 0; b < m; b++) {\n            int u = vals[b];\n            if (u % k != r) continue;\n            long long ways = (1LL << cnt[u]) - 1;\n            long long take = (started && u - prevVal == k) ? prevSkip * ways : (prevSkip + prevTake) * ways;\n            long long skip = prevSkip + prevTake;\n            prevSkip = skip;\n            prevTake = take;\n            prevVal = u;\n            started = 1;\n        }\n        total *= prevSkip + prevTake;\n    }\n    return (int) (total - 1);\n}`,
        csharp: `public static int BeautifulSubsets(int[] nums, int k)\n{\n    var cnt = new Dictionary<int, int>();\n    foreach (int x in nums)\n    {\n        int have;\n        cnt.TryGetValue(x, out have);\n        cnt[x] = have + 1;\n    }\n    var vals = new List<int>(cnt.Keys);\n    vals.Sort();\n    var done = new HashSet<int>();\n    long total = 1;\n    foreach (int v in vals)\n    {\n        int r = v % k;\n        if (!done.Add(r)) continue;\n        long prevSkip = 1, prevTake = 0;\n        int prevVal = -1;\n        bool started = false;\n        foreach (int u in vals)\n        {\n            if (u % k != r) continue;\n            long ways = (1L << cnt[u]) - 1;\n            long take = (started && u - prevVal == k) ? prevSkip * ways : (prevSkip + prevTake) * ways;\n            long skip = prevSkip + prevTake;\n            prevSkip = skip;\n            prevTake = take;\n            prevVal = u;\n            started = true;\n        }\n        total *= prevSkip + prevTake;\n    }\n    return (int) (total - 1);\n}`,
        go: `func beautifulSubsets(nums []int, k int) int {\n\tcnt := map[int]int{}\n\tfor _, x := range nums {\n\t\tcnt[x]++\n\t}\n\tvals := []int{}\n\tfor v := range cnt {\n\t\tvals = append(vals, v)\n\t}\n\tsort.Ints(vals)\n\tdone := map[int]bool{}\n\ttotal := int64(1)\n\tfor _, v := range vals {\n\t\tr := v % k\n\t\tif done[r] {\n\t\t\tcontinue\n\t\t}\n\t\tdone[r] = true\n\t\tvar prevSkip, prevTake int64 = 1, 0\n\t\tprevVal := -1\n\t\tstarted := false\n\t\tfor _, u := range vals {\n\t\t\tif u%k != r {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tways := int64(1)<<uint(cnt[u]) - 1\n\t\t\tvar take int64\n\t\t\tif started && u-prevVal == k {\n\t\t\t\ttake = prevSkip * ways\n\t\t\t} else {\n\t\t\t\ttake = (prevSkip + prevTake) * ways\n\t\t\t}\n\t\t\tskip := prevSkip + prevTake\n\t\t\tprevSkip = skip\n\t\t\tprevTake = take\n\t\t\tprevVal = u\n\t\t\tstarted = true\n\t\t}\n\t\ttotal *= prevSkip + prevTake\n\t}\n\treturn int(total - 1)\n}`,
        kotlin: `fun beautifulSubsets(nums: IntArray, k: Int): Int {\n    val cnt = HashMap<Int, Int>()\n    for (x in nums) cnt[x] = cnt.getOrDefault(x, 0) + 1\n    val vals = cnt.keys.sorted()\n    val done = HashSet<Int>()\n    var total = 1L\n    for (v in vals) {\n        val r = v % k\n        if (!done.add(r)) continue\n        var prevSkip = 1L\n        var prevTake = 0L\n        var prevVal = -1\n        var started = false\n        for (u in vals) {\n            if (u % k != r) continue\n            val ways = (1L shl cnt[u]!!) - 1\n            val take = if (started && u - prevVal == k) prevSkip * ways else (prevSkip + prevTake) * ways\n            val skip = prevSkip + prevTake\n            prevSkip = skip\n            prevTake = take\n            prevVal = u\n            started = true\n        }\n        total *= prevSkip + prevTake\n    }\n    return (total - 1).toInt()\n}`,
        swift: `func beautifulSubsets(_ nums: [Int], _ k: Int) -> Int {\n    var cnt = [Int: Int]()\n    for x in nums { cnt[x, default: 0] += 1 }\n    let vals = cnt.keys.sorted()\n    var done = Set<Int>()\n    var total = 1\n    for v in vals {\n        let r = v % k\n        if done.contains(r) { continue }\n        done.insert(r)\n        var prevSkip = 1\n        var prevTake = 0\n        var prevVal = -1\n        var started = false\n        for u in vals {\n            if u % k != r { continue }\n            let ways = (1 << (cnt[u] ?? 0)) - 1\n            let take = (started && u - prevVal == k) ? prevSkip * ways : (prevSkip + prevTake) * ways\n            let skip = prevSkip + prevTake\n            prevSkip = skip\n            prevTake = take\n            prevVal = u\n            started = true\n        }\n        total *= prevSkip + prevTake\n    }\n    return total - 1\n}`,
        rust: `fn beautifulSubsets(nums: Vec<i32>, k: i32) -> i32 {\n    let mut cnt: std::collections::HashMap<i32, i32> = std::collections::HashMap::new();\n    for &x in nums.iter() {\n        *cnt.entry(x).or_insert(0) += 1;\n    }\n    let mut vals: Vec<i32> = cnt.keys().cloned().collect();\n    vals.sort();\n    let mut done: std::collections::HashSet<i32> = std::collections::HashSet::new();\n    let mut total: i64 = 1;\n    for &v in vals.iter() {\n        let r = v % k;\n        if !done.insert(r) {\n            continue;\n        }\n        let mut prev_skip: i64 = 1;\n        let mut prev_take: i64 = 0;\n        let mut prev_val: i32 = -1;\n        let mut started = false;\n        for &u in vals.iter() {\n            if u % k != r {\n                continue;\n            }\n            let ways = (1i64 << cnt[&u]) - 1;\n            let take = if started && u - prev_val == k {\n                prev_skip * ways\n            } else {\n                (prev_skip + prev_take) * ways\n            };\n            let skip = prev_skip + prev_take;\n            prev_skip = skip;\n            prev_take = take;\n            prev_val = u;\n            started = true;\n        }\n        total *= prev_skip + prev_take;\n    }\n    (total - 1) as i32\n}`,
        php: `function beautifulSubsets($nums, $k) {\n    $cnt = [];\n    foreach ($nums as $x) $cnt[$x] = (isset($cnt[$x]) ? $cnt[$x] : 0) + 1;\n    $vals = array_keys($cnt);\n    sort($vals);\n    $done = [];\n    $total = 1;\n    foreach ($vals as $v) {\n        $r = $v % $k;\n        if (isset($done[$r])) continue;\n        $done[$r] = true;\n        $prevSkip = 1;\n        $prevTake = 0;\n        $prevVal = -1;\n        $started = false;\n        foreach ($vals as $u) {\n            if ($u % $k !== $r) continue;\n            $ways = (1 << $cnt[$u]) - 1;\n            $take = ($started && $u - $prevVal === $k) ? $prevSkip * $ways : ($prevSkip + $prevTake) * $ways;\n            $skip = $prevSkip + $prevTake;\n            $prevSkip = $skip;\n            $prevTake = $take;\n            $prevVal = $u;\n            $started = true;\n        }\n        $total *= $prevSkip + $prevTake;\n    }\n    return $total - 1;\n}`,
        ruby: `def beautifulSubsets(nums, k)\n  cnt = Hash.new(0)\n  nums.each { |x| cnt[x] += 1 }\n  vals = cnt.keys.sort\n  done = {}\n  total = 1\n  vals.each do |v|\n    r = v % k\n    next if done[r]\n    done[r] = true\n    prev_skip = 1\n    prev_take = 0\n    prev_val = -1\n    started = false\n    vals.each do |u|\n      next if u % k != r\n      ways = (1 << cnt[u]) - 1\n      take = (started && u - prev_val == k) ? prev_skip * ways : (prev_skip + prev_take) * ways\n      skip = prev_skip + prev_take\n      prev_skip = skip\n      prev_take = take\n      prev_val = u\n      started = true\n    end\n    total *= prev_skip + prev_take\n  end\n  total - 1\nend`,
      },
    };
  })(),

  // ── Minimum Cost Tree From Leaf Values (LC 1130) ────────────────
  (() => {
    const ref = (arr: number[]) => {
      const st: number[] = [];
      let res = 0;
      for (let i = 0; i < arr.length; i++) {
        const x = arr[i];
        while (st.length > 0 && st[st.length - 1] <= x) {
          const mid = st.pop() as number;
          if (st.length > 0) res += mid * Math.min(st[st.length - 1], x);
          else res += mid * x;
        }
        st.push(x);
      }
      while (st.length > 1) {
        const a = st.pop() as number;
        res += a * st[st.length - 1];
      }
      return res;
    };
    return {
      slug: "minimum-cost-tree-from-leaf-values",
      title: "Minimum Cost Tree From Leaf Values",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Stack", "Monotonic Stack", "Greedy", "Amazon", "Google", "Uber"],
      signature: { funcName: "mctFromLeafValues", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Build a binary tree where every node has either 0 or 2 children and the leaves, read left to right, spell out `arr`. Each non-leaf node's value is the product of the largest leaf in its left subtree and the largest leaf in its right subtree.\n\nReturn the smallest possible sum of the non-leaf node values.",
        [
          { in: "arr = [6,2,4]", out: "32", note: "Pair 2 with 4 first (cost 8), then 6 with 4 (cost 24)." },
          { in: "arr = [4,11]", out: "44", note: "Only one tree exists." },
          { in: "arr = [1,2,3,4]", out: "20" },
        ],
        ["2 <= arr.length <= 40", "1 <= arr[i] <= 15", "The answer fits in a signed 32-bit integer."]),
      hints: [
        "Merging two adjacent leaves costs the product of their values and leaves the larger one behind.",
        "So the smallest value should be merged away first, against its **smaller neighbour**.",
        "A decreasing monotonic stack does exactly that in one pass.",
      ],
      editorial: explain({
        idea: "Think of it as repeatedly merging adjacent leaves: merging costs the product and replaces the pair with the larger value. Every element must eventually be merged away except the overall maximum, and the cheapest moment to remove a value is against the smaller of its two neighbours.",
        steps: [
          "Keep a stack that is decreasing from bottom to top.",
          "For each new value, pop while the top is at most the new value: that popped element is a local minimum, so pay `popped × min(newTop, incoming)`.",
          "Push the new value; at the end, drain the stack paying `popped × nextBelow`.",
        ],
        why: "Removing value `v` costs `v × (one of its neighbours)`, and the cheaper neighbour is always the better choice — the larger neighbour survives to be paired later anyway. The monotonic stack pops exactly when both neighbours of an element are known, so each element is charged once, against the smaller of the two. That greedy is optimal, and matches the `O(n³)` interval DP that the problem's tree framing suggests.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Paying against the larger neighbour instead of the smaller over-counts.",
          "The final drain must not be forgotten — the remaining stack is still decreasing.",
          "The `O(n³)` interval DP is also correct but much slower.",
        ],
      }),
      examples: [
        { input: "[6,2,4]", expectedOutput: "32" },
        { input: "[4,11]", expectedOutput: "44" },
        { input: "[1,2,3,4]", expectedOutput: "20" },
      ],
      gen: (rng: Rng) => {
        const arr = Array.from({ length: ri(rng, 2, 30) }, () => ri(rng, 1, 15));
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef mctFromLeafValues(arr: List[int]) -> int:\n    st = []\n    res = 0\n    for x in arr:\n        while st and st[-1] <= x:\n            mid = st.pop()\n            res += mid * (min(st[-1], x) if st else x)\n        st.append(x)\n    while len(st) > 1:\n        res += st.pop() * st[-1]\n    return res`,
        javascript: `var mctFromLeafValues = function(arr) {\n    var st = [];\n    var res = 0;\n    for (var i = 0; i < arr.length; i++) {\n        var x = arr[i];\n        while (st.length > 0 && st[st.length - 1] <= x) {\n            var mid = st.pop();\n            if (st.length > 0) res += mid * Math.min(st[st.length - 1], x);\n            else res += mid * x;\n        }\n        st.push(x);\n    }\n    while (st.length > 1) {\n        var a = st.pop();\n        res += a * st[st.length - 1];\n    }\n    return res;\n};`,
        typescript: `function mctFromLeafValues(arr: number[]): number {\n    var st: number[] = [];\n    var res = 0;\n    for (var i = 0; i < arr.length; i++) {\n        var x = arr[i];\n        while (st.length > 0 && st[st.length - 1] <= x) {\n            var mid = st.pop() as number;\n            if (st.length > 0) res += mid * Math.min(st[st.length - 1], x);\n            else res += mid * x;\n        }\n        st.push(x);\n    }\n    while (st.length > 1) {\n        var a = st.pop() as number;\n        res += a * st[st.length - 1];\n    }\n    return res;\n}`,
        java: `public static int mctFromLeafValues(int[] arr) {\n    Deque<Integer> st = new ArrayDeque<>();\n    int res = 0;\n    for (int x : arr) {\n        while (!st.isEmpty() && st.peek() <= x) {\n            int mid = st.pop();\n            res += mid * (st.isEmpty() ? x : Math.min(st.peek(), x));\n        }\n        st.push(x);\n    }\n    while (st.size() > 1) {\n        int a = st.pop();\n        res += a * st.peek();\n    }\n    return res;\n}`,
        cpp: `int mctFromLeafValues(vector<int>& arr) {\n    vector<int> st;\n    int res = 0;\n    for (int x : arr) {\n        while (!st.empty() && st.back() <= x) {\n            int mid = st.back();\n            st.pop_back();\n            res += mid * (st.empty() ? x : min(st.back(), x));\n        }\n        st.push_back(x);\n    }\n    while (st.size() > 1) {\n        int a = st.back();\n        st.pop_back();\n        res += a * st.back();\n    }\n    return res;\n}`,
        c: `int mctFromLeafValues(int* arr, int arrSize) {\n    int* st = (int*) malloc((size_t) arrSize * sizeof(int));\n    int sn = 0, res = 0;\n    for (int i = 0; i < arrSize; i++) {\n        int x = arr[i];\n        while (sn > 0 && st[sn - 1] <= x) {\n            int mid = st[--sn];\n            int other = (sn > 0 && st[sn - 1] < x) ? st[sn - 1] : x;\n            res += mid * other;\n        }\n        st[sn++] = x;\n    }\n    while (sn > 1) {\n        int a = st[--sn];\n        res += a * st[sn - 1];\n    }\n    free(st);\n    return res;\n}`,
        csharp: `public static int MctFromLeafValues(int[] arr)\n{\n    var st = new List<int>();\n    int res = 0;\n    foreach (int x in arr)\n    {\n        while (st.Count > 0 && st[st.Count - 1] <= x)\n        {\n            int mid = st[st.Count - 1];\n            st.RemoveAt(st.Count - 1);\n            res += mid * (st.Count == 0 ? x : Math.Min(st[st.Count - 1], x));\n        }\n        st.Add(x);\n    }\n    while (st.Count > 1)\n    {\n        int a = st[st.Count - 1];\n        st.RemoveAt(st.Count - 1);\n        res += a * st[st.Count - 1];\n    }\n    return res;\n}`,
        go: `func mctFromLeafValues(arr []int) int {\n\tst := []int{}\n\tres := 0\n\tfor _, x := range arr {\n\t\tfor len(st) > 0 && st[len(st)-1] <= x {\n\t\t\tmid := st[len(st)-1]\n\t\t\tst = st[:len(st)-1]\n\t\t\tother := x\n\t\t\tif len(st) > 0 && st[len(st)-1] < x {\n\t\t\t\tother = st[len(st)-1]\n\t\t\t}\n\t\t\tres += mid * other\n\t\t}\n\t\tst = append(st, x)\n\t}\n\tfor len(st) > 1 {\n\t\ta := st[len(st)-1]\n\t\tst = st[:len(st)-1]\n\t\tres += a * st[len(st)-1]\n\t}\n\treturn res\n}`,
        kotlin: `fun mctFromLeafValues(arr: IntArray): Int {\n    val st = ArrayList<Int>()\n    var res = 0\n    for (x in arr) {\n        while (st.isNotEmpty() && st[st.size - 1] <= x) {\n            val mid = st.removeAt(st.size - 1)\n            res += mid * (if (st.isEmpty()) x else minOf(st[st.size - 1], x))\n        }\n        st.add(x)\n    }\n    while (st.size > 1) {\n        val a = st.removeAt(st.size - 1)\n        res += a * st[st.size - 1]\n    }\n    return res\n}`,
        swift: `func mctFromLeafValues(_ arr: [Int]) -> Int {\n    var st = [Int]()\n    var res = 0\n    for x in arr {\n        while !st.isEmpty && st[st.count - 1] <= x {\n            let mid = st.removeLast()\n            res += mid * (st.isEmpty ? x : min(st[st.count - 1], x))\n        }\n        st.append(x)\n    }\n    while st.count > 1 {\n        let a = st.removeLast()\n        res += a * st[st.count - 1]\n    }\n    return res\n}`,
        rust: `fn mctFromLeafValues(arr: Vec<i32>) -> i32 {\n    let mut st: Vec<i32> = Vec::new();\n    let mut res = 0i32;\n    for &x in arr.iter() {\n        while !st.is_empty() && st[st.len() - 1] <= x {\n            let mid = st.pop().unwrap();\n            let other = if st.is_empty() { x } else { std::cmp::min(st[st.len() - 1], x) };\n            res += mid * other;\n        }\n        st.push(x);\n    }\n    while st.len() > 1 {\n        let a = st.pop().unwrap();\n        res += a * st[st.len() - 1];\n    }\n    res\n}`,
        php: `function mctFromLeafValues($arr) {\n    $st = [];\n    $res = 0;\n    foreach ($arr as $x) {\n        while (count($st) > 0 && $st[count($st) - 1] <= $x) {\n            $mid = array_pop($st);\n            $other = count($st) > 0 ? min($st[count($st) - 1], $x) : $x;\n            $res += $mid * $other;\n        }\n        $st[] = $x;\n    }\n    while (count($st) > 1) {\n        $a = array_pop($st);\n        $res += $a * $st[count($st) - 1];\n    }\n    return $res;\n}`,
        ruby: `def mctFromLeafValues(arr)\n  st = []\n  res = 0\n  arr.each do |x|\n    while !st.empty? && st[-1] <= x\n      mid = st.pop\n      other = st.empty? ? x : [st[-1], x].min\n      res += mid * other\n    end\n    st << x\n  end\n  while st.length > 1\n    a = st.pop\n    res += a * st[-1]\n  end\n  res\nend`,
      },
    };
  })(),

  // ── Dungeon Game (LC 174) ───────────────────────────────────────
  (() => {
    const BIG = 1000000000;
    const ref = (dungeon: number[][]) => {
      const m = dungeon.length, n = dungeon[0].length;
      const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(BIG));
      dp[m][n - 1] = 1;
      dp[m - 1][n] = 1;
      for (let i = m - 1; i >= 0; i--) {
        for (let j = n - 1; j >= 0; j--) {
          const need = Math.min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j];
          dp[i][j] = need <= 0 ? 1 : need;
        }
      }
      return dp[0][0];
    };
    return {
      slug: "dungeon-game",
      title: "Dungeon Game",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "calculateMinimumHP", params: [{ name: "dungeon", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A knight starts at the top-left of `dungeon` and must reach the princess at the bottom-right, moving only **right** or **down**. Each room changes the knight's health by `dungeon[i][j]` (negative rooms hurt, positive rooms heal).\n\nThe knight dies the moment health drops to 0 or below. Return the minimum starting health that guarantees arrival.",
        [
          { in: "dungeon = [[-2,-3,3],[-5,-10,1],[10,30,-5]]", out: "7", note: "Going right, right, down, down needs 7 health to survive." },
          { in: "dungeon = [[0]]", out: "1", note: "Health must stay strictly positive." },
          { in: "dungeon = [[100]]", out: "1" },
        ],
        ["m == dungeon.length", "n == dungeon[0].length", "1 <= m, n <= 200", "-1000 <= dungeon[i][j] <= 1000"]),
      hints: [
        "Working forwards does not work — the best path so far may leave you too weak later.",
        "Work **backwards** from the princess: `dp[i][j]` is the minimum health needed *on entering* room `(i, j)`.",
        "Health must stay at least 1, so clamp: `dp[i][j] = max(1, min(right, down) - dungeon[i][j])`.",
      ],
      editorial: explain({
        idea: "Reverse the direction of the DP. Forwards, maximising health is not enough because a path with more health can still dip below zero earlier. Backwards, the requirement is well defined: the health needed entering a room depends only on the cheaper of the two rooms it leads to.",
        steps: [
          "Pad the grid with a border of 'infinite requirement', except the two cells adjacent to the exit, which need 1.",
          "Fill from bottom-right to top-left with `need = min(dp[i+1][j], dp[i][j+1]) - dungeon[i][j]`.",
          "Clamp to at least 1, since health must stay positive at every step.",
          "The answer is `dp[0][0]`.",
        ],
        why: "The quantity 'minimum health on entry' is exactly what composes backwards: to survive room `(i, j)` and everything after it, you need enough to absorb this room's damage and still meet the next room's requirement. The clamp encodes the death rule — extra healing cannot be banked below 1, because you could die before reaching it.",
        time: "O(m · n)",
        space: "O(m · n)",
        pitfalls: [
          "A forward DP maximising health is wrong; the classic counterexample is a big heal placed after a lethal room.",
          "Forgetting the clamp lets a healing room drive the requirement to zero or negative.",
          "The answer is at least 1 even in an all-positive dungeon.",
        ],
      }),
      examples: [
        { input: "[[-2,-3,3],[-5,-10,1],[10,30,-5]]", expectedOutput: "7" },
        { input: "[[0]]", expectedOutput: "1" },
        { input: "[[100]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const m = ri(rng, 1, 7), n = ri(rng, 1, 7);
        const dungeon = Array.from({ length: m }, () => Array.from({ length: n }, () => ri(rng, -30, 30)));
        return { input: fmtIntMat(dungeon), expectedOutput: String(ref(dungeon)) };
      },
      solutions: {
        python: `from typing import List\n\ndef calculateMinimumHP(dungeon: List[List[int]]) -> int:\n    m, n = len(dungeon), len(dungeon[0])\n    BIG = 10 ** 9\n    dp = [[BIG] * (n + 1) for _ in range(m + 1)]\n    dp[m][n - 1] = 1\n    dp[m - 1][n] = 1\n    for i in range(m - 1, -1, -1):\n        for j in range(n - 1, -1, -1):\n            need = min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j]\n            dp[i][j] = 1 if need <= 0 else need\n    return dp[0][0]`,
        javascript: `var calculateMinimumHP = function(dungeon) {\n    var BIG = 1000000000;\n    var m = dungeon.length, n = dungeon[0].length;\n    var dp = [];\n    for (var a = 0; a <= m; a++) {\n        var row = [];\n        for (var b = 0; b <= n; b++) row.push(BIG);\n        dp.push(row);\n    }\n    dp[m][n - 1] = 1;\n    dp[m - 1][n] = 1;\n    for (var i = m - 1; i >= 0; i--) {\n        for (var j = n - 1; j >= 0; j--) {\n            var need = Math.min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j];\n            dp[i][j] = need <= 0 ? 1 : need;\n        }\n    }\n    return dp[0][0];\n};`,
        typescript: `function calculateMinimumHP(dungeon: number[][]): number {\n    var BIG = 1000000000;\n    var m = dungeon.length, n = dungeon[0].length;\n    var dp: number[][] = [];\n    for (var a = 0; a <= m; a++) {\n        var row: number[] = [];\n        for (var b = 0; b <= n; b++) row.push(BIG);\n        dp.push(row);\n    }\n    dp[m][n - 1] = 1;\n    dp[m - 1][n] = 1;\n    for (var i = m - 1; i >= 0; i--) {\n        for (var j = n - 1; j >= 0; j--) {\n            var need = Math.min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j];\n            dp[i][j] = need <= 0 ? 1 : need;\n        }\n    }\n    return dp[0][0];\n}`,
        java: `public static int calculateMinimumHP(int[][] dungeon) {\n    final int BIG = 1000000000;\n    int m = dungeon.length, n = dungeon[0].length;\n    int[][] dp = new int[m + 1][n + 1];\n    for (int[] row : dp) Arrays.fill(row, BIG);\n    dp[m][n - 1] = 1;\n    dp[m - 1][n] = 1;\n    for (int i = m - 1; i >= 0; i--) {\n        for (int j = n - 1; j >= 0; j--) {\n            int need = Math.min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j];\n            dp[i][j] = need <= 0 ? 1 : need;\n        }\n    }\n    return dp[0][0];\n}`,
        cpp: `int calculateMinimumHP(vector<vector<int>>& dungeon) {\n    const int BIG = 1000000000;\n    int m = (int) dungeon.size(), n = (int) dungeon[0].size();\n    vector<vector<int>> dp(m + 1, vector<int>(n + 1, BIG));\n    dp[m][n - 1] = 1;\n    dp[m - 1][n] = 1;\n    for (int i = m - 1; i >= 0; i--) {\n        for (int j = n - 1; j >= 0; j--) {\n            int need = min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j];\n            dp[i][j] = need <= 0 ? 1 : need;\n        }\n    }\n    return dp[0][0];\n}`,
        c: `int calculateMinimumHP(int** dungeon, int dungeonSize, int* dungeonColSize) {\n    const int BIG = 1000000000;\n    int m = dungeonSize, n = dungeonColSize[0];\n    int w = n + 1;\n    int* dp = (int*) malloc((size_t) (m + 1) * (size_t) w * sizeof(int));\n    for (int i = 0; i < (m + 1) * w; i++) dp[i] = BIG;\n    dp[m * w + (n - 1)] = 1;\n    dp[(m - 1) * w + n] = 1;\n    for (int i = m - 1; i >= 0; i--) {\n        for (int j = n - 1; j >= 0; j--) {\n            int down = dp[(i + 1) * w + j];\n            int right = dp[i * w + (j + 1)];\n            int best = down < right ? down : right;\n            int need = best - dungeon[i][j];\n            dp[i * w + j] = need <= 0 ? 1 : need;\n        }\n    }\n    int ans = dp[0];\n    free(dp);\n    return ans;\n}`,
        csharp: `public static int CalculateMinimumHP(int[][] dungeon)\n{\n    const int BIG = 1000000000;\n    int m = dungeon.Length, n = dungeon[0].Length;\n    int[,] dp = new int[m + 1, n + 1];\n    for (int i = 0; i <= m; i++)\n        for (int j = 0; j <= n; j++)\n            dp[i, j] = BIG;\n    dp[m, n - 1] = 1;\n    dp[m - 1, n] = 1;\n    for (int i = m - 1; i >= 0; i--)\n    {\n        for (int j = n - 1; j >= 0; j--)\n        {\n            int need = Math.Min(dp[i + 1, j], dp[i, j + 1]) - dungeon[i][j];\n            dp[i, j] = need <= 0 ? 1 : need;\n        }\n    }\n    return dp[0, 0];\n}`,
        go: `func calculateMinimumHP(dungeon [][]int) int {\n\tconst BIG = 1000000000\n\tm, n := len(dungeon), len(dungeon[0])\n\tdp := make([][]int, m+1)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, n+1)\n\t\tfor j := range dp[i] {\n\t\t\tdp[i][j] = BIG\n\t\t}\n\t}\n\tdp[m][n-1] = 1\n\tdp[m-1][n] = 1\n\tfor i := m - 1; i >= 0; i-- {\n\t\tfor j := n - 1; j >= 0; j-- {\n\t\t\tbest := dp[i+1][j]\n\t\t\tif dp[i][j+1] < best {\n\t\t\t\tbest = dp[i][j+1]\n\t\t\t}\n\t\t\tneed := best - dungeon[i][j]\n\t\t\tif need <= 0 {\n\t\t\t\tneed = 1\n\t\t\t}\n\t\t\tdp[i][j] = need\n\t\t}\n\t}\n\treturn dp[0][0]\n}`,
        kotlin: `fun calculateMinimumHP(dungeon: Array<IntArray>): Int {\n    val BIG = 1000000000\n    val m = dungeon.size\n    val n = dungeon[0].size\n    val dp = Array(m + 1) { IntArray(n + 1) { BIG } }\n    dp[m][n - 1] = 1\n    dp[m - 1][n] = 1\n    for (i in m - 1 downTo 0) {\n        for (j in n - 1 downTo 0) {\n            val need = minOf(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j]\n            dp[i][j] = if (need <= 0) 1 else need\n        }\n    }\n    return dp[0][0]\n}`,
        swift: `func calculateMinimumHP(_ dungeon: [[Int]]) -> Int {\n    let BIG = 1000000000\n    let m = dungeon.count\n    let n = dungeon[0].count\n    var dp = [[Int]](repeating: [Int](repeating: BIG, count: n + 1), count: m + 1)\n    dp[m][n - 1] = 1\n    dp[m - 1][n] = 1\n    var i = m - 1\n    while i >= 0 {\n        var j = n - 1\n        while j >= 0 {\n            let need = min(dp[i + 1][j], dp[i][j + 1]) - dungeon[i][j]\n            dp[i][j] = need <= 0 ? 1 : need\n            j -= 1\n        }\n        i -= 1\n    }\n    return dp[0][0]\n}`,
        rust: `fn calculateMinimumHP(dungeon: Vec<Vec<i32>>) -> i32 {\n    const BIG: i32 = 1000000000;\n    let m = dungeon.len();\n    let n = dungeon[0].len();\n    let mut dp = vec![vec![BIG; n + 1]; m + 1];\n    dp[m][n - 1] = 1;\n    dp[m - 1][n] = 1;\n    for i in (0..m).rev() {\n        for j in (0..n).rev() {\n            let best = std::cmp::min(dp[i + 1][j], dp[i][j + 1]);\n            let need = best - dungeon[i][j];\n            dp[i][j] = if need <= 0 { 1 } else { need };\n        }\n    }\n    dp[0][0]\n}`,
        php: `function calculateMinimumHP($dungeon) {\n    $BIG = 1000000000;\n    $m = count($dungeon);\n    $n = count($dungeon[0]);\n    $dp = [];\n    for ($i = 0; $i <= $m; $i++) $dp[$i] = array_fill(0, $n + 1, $BIG);\n    $dp[$m][$n - 1] = 1;\n    $dp[$m - 1][$n] = 1;\n    for ($i = $m - 1; $i >= 0; $i--) {\n        for ($j = $n - 1; $j >= 0; $j--) {\n            $need = min($dp[$i + 1][$j], $dp[$i][$j + 1]) - $dungeon[$i][$j];\n            $dp[$i][$j] = $need <= 0 ? 1 : $need;\n        }\n    }\n    return $dp[0][0];\n}`,
        ruby: `def calculateMinimumHP(dungeon)\n  big = 1000000000\n  m = dungeon.length\n  n = dungeon[0].length\n  dp = Array.new(m + 1) { Array.new(n + 1, big) }\n  dp[m][n - 1] = 1\n  dp[m - 1][n] = 1\n  (m - 1).downto(0) do |i|\n    (n - 1).downto(0) do |j|\n      need = [dp[i + 1][j], dp[i][j + 1]].min - dungeon[i][j]\n      dp[i][j] = need <= 0 ? 1 : need\n    end\n  end\n  dp[0][0]\nend`,
      },
    };
  })(),

  // ── Minimum Falling Path Sum II (LC 1289) ───────────────────────
  (() => {
    const ref = (grid: number[][]) => {
      const n = grid.length;
      let prev = grid[0].slice();
      for (let i = 1; i < n; i++) {
        let m1 = Infinity, i1 = -1, m2 = Infinity;
        for (let k = 0; k < n; k++) {
          if (prev[k] < m1) { m2 = m1; m1 = prev[k]; i1 = k; }
          else if (prev[k] < m2) m2 = prev[k];
        }
        const cur = new Array(n).fill(0);
        for (let j = 0; j < n; j++) cur[j] = grid[i][j] + (j === i1 ? m2 : m1);
        prev = cur;
      }
      let best = prev[0];
      for (let k = 1; k < n; k++) if (prev[k] < best) best = prev[k];
      return best;
    };
    return {
      slug: "minimum-falling-path-sum-ii",
      title: "Minimum Falling Path Sum II",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Dynamic Programming", "Amazon", "Google", "Adobe"],
      signature: { funcName: "minFallingPathSum", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "A **falling path with non-zero shifts** picks exactly one element from each row of the `n × n` grid, with no two picks from adjacent rows in the same column.\n\nReturn the minimum sum of such a path.",
        [
          { in: "grid = [[1,2,3],[4,5,6],[7,8,9]]", out: "13", note: "1 → 5 → 7." },
          { in: "grid = [[7]]", out: "7", note: "A single row has nothing to avoid." },
          { in: "grid = [[-73,61,43,-48,-36],[3,30,27,57,10],[96,-76,84,59,-15],[5,-49,76,31,-7],[97,91,61,-46,67]]", out: "-192" },
        ],
        ["n == grid.length == grid[i].length", "1 <= n <= 200", "-99 <= grid[i][j] <= 99"]),
      hints: [
        "Row by row, only the previous row's best totals matter.",
        "For a given column you need the best previous total from a **different** column.",
        "That is the previous row's minimum, unless the minimum sits in this very column — then it is the second minimum.",
      ],
      editorial: explain({
        idea: "The naive transition scans all `n` previous columns per cell, which is `O(n³)`. But the only value that can be blocked is the single best one, so tracking the best and second-best of each row makes each transition `O(1)`.",
        steps: [
          "Start with the first row as the running totals.",
          "For each next row, find the smallest previous total and its column, plus the second smallest.",
          "Each cell adds the smallest — or the second smallest when the smallest came from its own column.",
          "The answer is the minimum of the final row.",
        ],
        why: "Only one previous column is forbidden, so at most one candidate is removed from consideration; the second-best is therefore always available and is the best legal alternative. That makes the two values sufficient to answer every cell in the row.",
        time: "O(n²)",
        space: "O(n)",
        pitfalls: [
          "Only the column holding the *minimum* falls back to the second-best; every other column uses the minimum.",
          "Ties matter: if two columns share the minimum value, the second-best equals it, so no column is penalised — tracking one index handles this correctly.",
          "`n = 1` has no constraint to violate and the answer is the single element.",
        ],
      }),
      examples: [
        { input: "[[1,2,3],[4,5,6],[7,8,9]]", expectedOutput: "13" },
        { input: "[[7]]", expectedOutput: "7" },
        { input: "[[-73,61,43,-48,-36],[3,30,27,57,10],[96,-76,84,59,-15],[5,-49,76,31,-7],[97,91,61,-46,67]]", expectedOutput: "-192" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => ri(rng, -99, 99)));
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minFallingPathSum(grid: List[List[int]]) -> int:\n    n = len(grid)\n    prev = list(grid[0])\n    for i in range(1, n):\n        m1 = m2 = float("inf")\n        i1 = -1\n        for k in range(n):\n            if prev[k] < m1:\n                m2 = m1\n                m1 = prev[k]\n                i1 = k\n            elif prev[k] < m2:\n                m2 = prev[k]\n        prev = [grid[i][j] + (m2 if j == i1 else m1) for j in range(n)]\n    return min(prev)`,
        javascript: `var minFallingPathSum = function(grid) {\n    var n = grid.length;\n    var prev = grid[0].slice();\n    for (var i = 1; i < n; i++) {\n        var m1 = Infinity, i1 = -1, m2 = Infinity, k;\n        for (k = 0; k < n; k++) {\n            if (prev[k] < m1) { m2 = m1; m1 = prev[k]; i1 = k; }\n            else if (prev[k] < m2) m2 = prev[k];\n        }\n        var cur = [];\n        for (var j = 0; j < n; j++) cur.push(grid[i][j] + (j === i1 ? m2 : m1));\n        prev = cur;\n    }\n    var best = prev[0];\n    for (k = 1; k < n; k++) if (prev[k] < best) best = prev[k];\n    return best;\n};`,
        typescript: `function minFallingPathSum(grid: number[][]): number {\n    var n = grid.length;\n    var prev = grid[0].slice();\n    for (var i = 1; i < n; i++) {\n        var m1 = Infinity, i1 = -1, m2 = Infinity, k: number;\n        for (k = 0; k < n; k++) {\n            if (prev[k] < m1) { m2 = m1; m1 = prev[k]; i1 = k; }\n            else if (prev[k] < m2) m2 = prev[k];\n        }\n        var cur: number[] = [];\n        for (var j = 0; j < n; j++) cur.push(grid[i][j] + (j === i1 ? m2 : m1));\n        prev = cur;\n    }\n    var best = prev[0];\n    for (k = 1; k < n; k++) if (prev[k] < best) best = prev[k];\n    return best;\n}`,
        java: `public static int minFallingPathSum(int[][] grid) {\n    int n = grid.length;\n    int[] prev = grid[0].clone();\n    for (int i = 1; i < n; i++) {\n        int m1 = Integer.MAX_VALUE, m2 = Integer.MAX_VALUE, i1 = -1;\n        for (int k = 0; k < n; k++) {\n            if (prev[k] < m1) {\n                m2 = m1;\n                m1 = prev[k];\n                i1 = k;\n            } else if (prev[k] < m2) {\n                m2 = prev[k];\n            }\n        }\n        int[] cur = new int[n];\n        for (int j = 0; j < n; j++) cur[j] = grid[i][j] + (j == i1 ? m2 : m1);\n        prev = cur;\n    }\n    int best = prev[0];\n    for (int k = 1; k < n; k++) best = Math.min(best, prev[k]);\n    return best;\n}`,
        cpp: `int minFallingPathSum(vector<vector<int>>& grid) {\n    int n = (int) grid.size();\n    vector<int> prev = grid[0];\n    for (int i = 1; i < n; i++) {\n        int m1 = INT_MAX, m2 = INT_MAX, i1 = -1;\n        for (int k = 0; k < n; k++) {\n            if (prev[k] < m1) {\n                m2 = m1;\n                m1 = prev[k];\n                i1 = k;\n            } else if (prev[k] < m2) {\n                m2 = prev[k];\n            }\n        }\n        vector<int> cur(n);\n        for (int j = 0; j < n; j++) cur[j] = grid[i][j] + (j == i1 ? m2 : m1);\n        prev = cur;\n    }\n    return *min_element(prev.begin(), prev.end());\n}`,
        c: `int minFallingPathSum(int** grid, int gridSize, int* gridColSize) {\n    (void) gridColSize;\n    int n = gridSize;\n    int* prev = (int*) malloc((size_t) n * sizeof(int));\n    int* cur = (int*) malloc((size_t) n * sizeof(int));\n    for (int j = 0; j < n; j++) prev[j] = grid[0][j];\n    for (int i = 1; i < n; i++) {\n        int m1 = 2147483647, m2 = 2147483647, i1 = -1;\n        for (int k = 0; k < n; k++) {\n            if (prev[k] < m1) {\n                m2 = m1;\n                m1 = prev[k];\n                i1 = k;\n            } else if (prev[k] < m2) {\n                m2 = prev[k];\n            }\n        }\n        for (int j = 0; j < n; j++) cur[j] = grid[i][j] + (j == i1 ? m2 : m1);\n        for (int j = 0; j < n; j++) prev[j] = cur[j];\n    }\n    int best = prev[0];\n    for (int k = 1; k < n; k++) if (prev[k] < best) best = prev[k];\n    free(prev);\n    free(cur);\n    return best;\n}`,
        csharp: `public static int MinFallingPathSum(int[][] grid)\n{\n    int n = grid.Length;\n    int[] prev = (int[]) grid[0].Clone();\n    for (int i = 1; i < n; i++)\n    {\n        int m1 = int.MaxValue, m2 = int.MaxValue, i1 = -1;\n        for (int k = 0; k < n; k++)\n        {\n            if (prev[k] < m1)\n            {\n                m2 = m1;\n                m1 = prev[k];\n                i1 = k;\n            }\n            else if (prev[k] < m2)\n            {\n                m2 = prev[k];\n            }\n        }\n        int[] cur = new int[n];\n        for (int j = 0; j < n; j++) cur[j] = grid[i][j] + (j == i1 ? m2 : m1);\n        prev = cur;\n    }\n    int best = prev[0];\n    for (int k = 1; k < n; k++) if (prev[k] < best) best = prev[k];\n    return best;\n}`,
        go: `func minFallingPathSum(grid [][]int) int {\n\tn := len(grid)\n\tprev := append([]int{}, grid[0]...)\n\tfor i := 1; i < n; i++ {\n\t\tm1, m2, i1 := 1<<62, 1<<62, -1\n\t\tfor k := 0; k < n; k++ {\n\t\t\tif prev[k] < m1 {\n\t\t\t\tm2 = m1\n\t\t\t\tm1 = prev[k]\n\t\t\t\ti1 = k\n\t\t\t} else if prev[k] < m2 {\n\t\t\t\tm2 = prev[k]\n\t\t\t}\n\t\t}\n\t\tcur := make([]int, n)\n\t\tfor j := 0; j < n; j++ {\n\t\t\tif j == i1 {\n\t\t\t\tcur[j] = grid[i][j] + m2\n\t\t\t} else {\n\t\t\t\tcur[j] = grid[i][j] + m1\n\t\t\t}\n\t\t}\n\t\tprev = cur\n\t}\n\tbest := prev[0]\n\tfor k := 1; k < n; k++ {\n\t\tif prev[k] < best {\n\t\t\tbest = prev[k]\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun minFallingPathSum(grid: Array<IntArray>): Int {\n    val n = grid.size\n    var prev = grid[0].copyOf()\n    for (i in 1 until n) {\n        var m1 = Int.MAX_VALUE\n        var m2 = Int.MAX_VALUE\n        var i1 = -1\n        for (k in 0 until n) {\n            if (prev[k] < m1) {\n                m2 = m1\n                m1 = prev[k]\n                i1 = k\n            } else if (prev[k] < m2) {\n                m2 = prev[k]\n            }\n        }\n        val cur = IntArray(n)\n        for (j in 0 until n) cur[j] = grid[i][j] + (if (j == i1) m2 else m1)\n        prev = cur\n    }\n    return prev.min()!!\n}`,
        swift: `func minFallingPathSum(_ grid: [[Int]]) -> Int {\n    let n = grid.count\n    var prev = grid[0]\n    for i in 1..<max(n, 1) where n > 1 {\n        var m1 = Int.max\n        var m2 = Int.max\n        var i1 = -1\n        for k in 0..<n {\n            if prev[k] < m1 {\n                m2 = m1\n                m1 = prev[k]\n                i1 = k\n            } else if prev[k] < m2 {\n                m2 = prev[k]\n            }\n        }\n        var cur = [Int](repeating: 0, count: n)\n        for j in 0..<n { cur[j] = grid[i][j] + (j == i1 ? m2 : m1) }\n        prev = cur\n    }\n    return prev.min()!\n}`,
        rust: `fn minFallingPathSum(grid: Vec<Vec<i32>>) -> i32 {\n    let n = grid.len();\n    let mut prev = grid[0].clone();\n    for i in 1..n {\n        let mut m1 = i32::MAX;\n        let mut m2 = i32::MAX;\n        let mut i1: i32 = -1;\n        for k in 0..n {\n            if prev[k] < m1 {\n                m2 = m1;\n                m1 = prev[k];\n                i1 = k as i32;\n            } else if prev[k] < m2 {\n                m2 = prev[k];\n            }\n        }\n        let mut cur = vec![0i32; n];\n        for j in 0..n {\n            cur[j] = grid[i][j] + if j as i32 == i1 { m2 } else { m1 };\n        }\n        prev = cur;\n    }\n    *prev.iter().min().unwrap()\n}`,
        php: `function minFallingPathSum($grid) {\n    $n = count($grid);\n    $prev = $grid[0];\n    for ($i = 1; $i < $n; $i++) {\n        $m1 = PHP_INT_MAX;\n        $m2 = PHP_INT_MAX;\n        $i1 = -1;\n        for ($k = 0; $k < $n; $k++) {\n            if ($prev[$k] < $m1) {\n                $m2 = $m1;\n                $m1 = $prev[$k];\n                $i1 = $k;\n            } elseif ($prev[$k] < $m2) {\n                $m2 = $prev[$k];\n            }\n        }\n        $cur = [];\n        for ($j = 0; $j < $n; $j++) $cur[] = $grid[$i][$j] + ($j === $i1 ? $m2 : $m1);\n        $prev = $cur;\n    }\n    return min($prev);\n}`,
        ruby: `def minFallingPathSum(grid)\n  n = grid.length\n  prev = grid[0].dup\n  (1...n).each do |i|\n    m1 = Float::INFINITY\n    m2 = Float::INFINITY\n    i1 = -1\n    (0...n).each do |k|\n      if prev[k] < m1\n        m2 = m1\n        m1 = prev[k]\n        i1 = k\n      elsif prev[k] < m2\n        m2 = prev[k]\n      end\n    end\n    prev = (0...n).map { |j| grid[i][j] + (j == i1 ? m2 : m1) }\n  end\n  prev.min\nend`,
      },
    };
  })(),

  // ── Frog Jump (LC 403) ──────────────────────────────────────────
  (() => {
    const ref = (stones: number[]) => {
      const n = stones.length;
      const pos: Record<number, number> = {};
      for (let i = 0; i < n; i++) pos[stones[i]] = i;
      const dp: Array<Record<number, boolean>> = [];
      for (let i = 0; i < n; i++) dp.push({});
      dp[0][0] = true;
      for (let i = 0; i < n; i++) {
        const keys = Object.keys(dp[i]);
        for (let t = 0; t < keys.length; t++) {
          const k = Number(keys[t]);
          const steps = [k - 1, k, k + 1];
          for (let q = 0; q < 3; q++) {
            const step = steps[q];
            if (step <= 0) continue;
            const nxt = stones[i] + step;
            if (pos[nxt] !== undefined) dp[pos[nxt]][step] = true;
          }
        }
      }
      return Object.keys(dp[n - 1]).length > 0;
    };
    return {
      slug: "frog-jump",
      title: "Frog Jump",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "canCross", params: [{ name: "stones", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "A frog crosses a river on stones at the positions listed in `stones` (strictly increasing, starting at 0). It begins on the first stone and its **first jump must be 1 unit**.\n\nIf the last jump was `k` units, the next must be `k - 1`, `k` or `k + 1` units, always forwards. Return whether the frog can reach the last stone.",
        [
          { in: "stones = [0,1,3,5,6,8,12,17]", out: "true", note: "Jumps of 1, 2, 2, 3, 4 and 5 reach the end." },
          { in: "stones = [0,1,2,3,4,8,9,11]", out: "false", note: "The gap from 4 to 8 is too wide for the jump built up so far." },
          { in: "stones = [0,1]", out: "true" },
        ],
        ["2 <= stones.length <= 1000", "0 <= stones[i] <= 1000000000", "stones[0] == 0", "stones is sorted strictly increasing."]),
      hints: [
        "The state is the pair (stone, size of the jump that landed there) — position alone is not enough.",
        "From a state, three jump sizes are possible, and each must land exactly on another stone.",
        "Keep a set of reachable jump sizes per stone and push forwards.",
      ],
      editorial: explain({
        idea: "Forward reachability over states `(stone, lastJump)`. From each reachable state, try the three legal jump sizes and mark the landing stone reachable with that size.",
        steps: [
          "Map each stone position to its index for constant-time landing checks.",
          "Seed stone 0 with jump size 0, so the only legal first move is size 1.",
          "For each stone in order, for each recorded jump size `k`, try `k-1`, `k` and `k+1`, skipping non-positive sizes.",
          "The frog can cross when the last stone has any recorded jump size.",
        ],
        why: "The next legal jumps depend only on the size of the jump just made, so `(stone, lastJump)` is a sufficient state. Processing stones left to right is safe because every jump moves strictly forwards, so a state is finalised before it is used. The jump size never exceeds the number of stones, which bounds the state space.",
        time: "O(n²)",
        space: "O(n²)",
        pitfalls: [
          "Tracking only the stone, not the jump size, loses the information the rules depend on.",
          "A jump of size 0 or less is illegal and must be skipped — seeding stone 0 with 0 is what forces the first jump to be 1.",
          "The landing must be exactly on a stone; there is no partial progress.",
        ],
      }),
      examples: [
        { input: "[0,1,3,5,6,8,12,17]", expectedOutput: "true" },
        { input: "[0,1,2,3,4,8,9,11]", expectedOutput: "false" },
        { input: "[0,1]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 16);
        const stones = [0];
        for (let i = 1; i < n; i++) stones.push(stones[i - 1] + ri(rng, 1, 4));
        return { input: fmtIntArr(stones), expectedOutput: bool(ref(stones)) };
      },
      solutions: {
        python: `from typing import List\n\ndef canCross(stones: List[int]) -> bool:\n    n = len(stones)\n    pos = {s: i for i, s in enumerate(stones)}\n    dp = [set() for _ in range(n)]\n    dp[0].add(0)\n    for i in range(n):\n        for k in list(dp[i]):\n            for step in (k - 1, k, k + 1):\n                if step <= 0:\n                    continue\n                nxt = stones[i] + step\n                if nxt in pos:\n                    dp[pos[nxt]].add(step)\n    return len(dp[n - 1]) > 0`,
        javascript: `var canCross = function(stones) {\n    var n = stones.length;\n    var pos = {}, i;\n    for (i = 0; i < n; i++) pos[stones[i]] = i;\n    var dp = [];\n    for (i = 0; i < n; i++) dp.push({});\n    dp[0][0] = true;\n    for (i = 0; i < n; i++) {\n        var keys = Object.keys(dp[i]);\n        for (var t = 0; t < keys.length; t++) {\n            var k = Number(keys[t]);\n            var steps = [k - 1, k, k + 1];\n            for (var q = 0; q < 3; q++) {\n                var step = steps[q];\n                if (step <= 0) continue;\n                var nxt = stones[i] + step;\n                if (pos[nxt] !== undefined) dp[pos[nxt]][step] = true;\n            }\n        }\n    }\n    return Object.keys(dp[n - 1]).length > 0;\n};`,
        typescript: `function canCross(stones: number[]): boolean {\n    var n = stones.length;\n    var pos: { [key: number]: number } = {};\n    var i: number;\n    for (i = 0; i < n; i++) pos[stones[i]] = i;\n    var dp: Array<{ [key: number]: boolean }> = [];\n    for (i = 0; i < n; i++) dp.push({});\n    dp[0][0] = true;\n    for (i = 0; i < n; i++) {\n        var keys = Object.keys(dp[i]);\n        for (var t = 0; t < keys.length; t++) {\n            var k = Number(keys[t]);\n            var steps = [k - 1, k, k + 1];\n            for (var q = 0; q < 3; q++) {\n                var step = steps[q];\n                if (step <= 0) continue;\n                var nxt = stones[i] + step;\n                if (pos[nxt] !== undefined) dp[pos[nxt]][step] = true;\n            }\n        }\n    }\n    return Object.keys(dp[n - 1]).length > 0;\n}`,
        java: `public static boolean canCross(int[] stones) {\n    int n = stones.length;\n    Map<Integer, Integer> pos = new HashMap<>();\n    for (int i = 0; i < n; i++) pos.put(stones[i], i);\n    List<Set<Integer>> dp = new ArrayList<>();\n    for (int i = 0; i < n; i++) dp.add(new HashSet<>());\n    dp.get(0).add(0);\n    for (int i = 0; i < n; i++) {\n        for (int k : new ArrayList<>(dp.get(i))) {\n            for (int step = k - 1; step <= k + 1; step++) {\n                if (step <= 0) continue;\n                Integer idx = pos.get(stones[i] + step);\n                if (idx != null) dp.get(idx).add(step);\n            }\n        }\n    }\n    return !dp.get(n - 1).isEmpty();\n}`,
        cpp: `bool canCross(vector<int>& stones) {\n    int n = (int) stones.size();\n    unordered_map<int, int> pos;\n    for (int i = 0; i < n; i++) pos[stones[i]] = i;\n    vector<set<int>> dp(n);\n    dp[0].insert(0);\n    for (int i = 0; i < n; i++) {\n        vector<int> ks(dp[i].begin(), dp[i].end());\n        for (int k : ks) {\n            for (int step = k - 1; step <= k + 1; step++) {\n                if (step <= 0) continue;\n                auto it = pos.find(stones[i] + step);\n                if (it != pos.end()) dp[it->second].insert(step);\n            }\n        }\n    }\n    return !dp[n - 1].empty();\n}`,
        c: `bool canCross(int* stones, int stonesSize) {\n    int n = stonesSize;\n    char* dp = (char*) calloc((size_t) n * (size_t) (n + 2), 1);\n    dp[0 * (n + 2) + 0] = 1;\n    for (int i = 0; i < n; i++) {\n        for (int k = 0; k <= n; k++) {\n            if (!dp[i * (n + 2) + k]) continue;\n            for (int step = k - 1; step <= k + 1; step++) {\n                if (step <= 0 || step > n) continue;\n                int target = stones[i] + step;\n                int lo = i + 1, hi = n - 1, found = -1;\n                while (lo <= hi) {\n                    int mid = (lo + hi) / 2;\n                    if (stones[mid] == target) { found = mid; break; }\n                    if (stones[mid] < target) lo = mid + 1; else hi = mid - 1;\n                }\n                if (found >= 0) dp[found * (n + 2) + step] = 1;\n            }\n        }\n    }\n    int ok = 0;\n    for (int k = 0; k <= n; k++) if (dp[(n - 1) * (n + 2) + k]) { ok = 1; break; }\n    free(dp);\n    return ok != 0;\n}`,
        csharp: `public static bool CanCross(int[] stones)\n{\n    int n = stones.Length;\n    var pos = new Dictionary<int, int>();\n    for (int i = 0; i < n; i++) pos[stones[i]] = i;\n    var dp = new List<HashSet<int>>();\n    for (int i = 0; i < n; i++) dp.Add(new HashSet<int>());\n    dp[0].Add(0);\n    for (int i = 0; i < n; i++)\n    {\n        foreach (int k in new List<int>(dp[i]))\n        {\n            for (int step = k - 1; step <= k + 1; step++)\n            {\n                if (step <= 0) continue;\n                int idx;\n                if (pos.TryGetValue(stones[i] + step, out idx)) dp[idx].Add(step);\n            }\n        }\n    }\n    return dp[n - 1].Count > 0;\n}`,
        go: `func canCross(stones []int) bool {\n\tn := len(stones)\n\tpos := map[int]int{}\n\tfor i, s := range stones {\n\t\tpos[s] = i\n\t}\n\tdp := make([]map[int]bool, n)\n\tfor i := range dp {\n\t\tdp[i] = map[int]bool{}\n\t}\n\tdp[0][0] = true\n\tfor i := 0; i < n; i++ {\n\t\tks := []int{}\n\t\tfor k := range dp[i] {\n\t\t\tks = append(ks, k)\n\t\t}\n\t\tfor _, k := range ks {\n\t\t\tfor step := k - 1; step <= k+1; step++ {\n\t\t\t\tif step <= 0 {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tif idx, ok := pos[stones[i]+step]; ok {\n\t\t\t\t\tdp[idx][step] = true\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\treturn len(dp[n-1]) > 0\n}`,
        kotlin: `fun canCross(stones: IntArray): Boolean {\n    val n = stones.size\n    val pos = HashMap<Int, Int>()\n    for (i in 0 until n) pos[stones[i]] = i\n    val dp = Array(n) { HashSet<Int>() }\n    dp[0].add(0)\n    for (i in 0 until n) {\n        for (k in dp[i].toList()) {\n            for (step in k - 1..k + 1) {\n                if (step <= 0) continue\n                val idx = pos[stones[i] + step]\n                if (idx != null) dp[idx].add(step)\n            }\n        }\n    }\n    return dp[n - 1].isNotEmpty()\n}`,
        swift: `func canCross(_ stones: [Int]) -> Bool {\n    let n = stones.count\n    var pos = [Int: Int]()\n    for i in 0..<n { pos[stones[i]] = i }\n    var dp = [Set<Int>](repeating: Set<Int>(), count: n)\n    dp[0].insert(0)\n    for i in 0..<n {\n        for k in Array(dp[i]) {\n            for step in (k - 1)...(k + 1) {\n                if step <= 0 { continue }\n                if let idx = pos[stones[i] + step] { dp[idx].insert(step) }\n            }\n        }\n    }\n    return !dp[n - 1].isEmpty\n}`,
        rust: `fn canCross(stones: Vec<i32>) -> bool {\n    let n = stones.len();\n    let mut pos: std::collections::HashMap<i32, usize> = std::collections::HashMap::new();\n    for i in 0..n {\n        pos.insert(stones[i], i);\n    }\n    let mut dp: Vec<std::collections::HashSet<i32>> = vec![std::collections::HashSet::new(); n];\n    dp[0].insert(0);\n    for i in 0..n {\n        let ks: Vec<i32> = dp[i].iter().cloned().collect();\n        for k in ks {\n            for step in (k - 1)..=(k + 1) {\n                if step <= 0 {\n                    continue;\n                }\n                if let Some(&idx) = pos.get(&(stones[i] + step)) {\n                    dp[idx].insert(step);\n                }\n            }\n        }\n    }\n    !dp[n - 1].is_empty()\n}`,
        php: `function canCross($stones) {\n    $n = count($stones);\n    $pos = [];\n    for ($i = 0; $i < $n; $i++) $pos[$stones[$i]] = $i;\n    $dp = [];\n    for ($i = 0; $i < $n; $i++) $dp[$i] = [];\n    $dp[0][0] = true;\n    for ($i = 0; $i < $n; $i++) {\n        foreach (array_keys($dp[$i]) as $k) {\n            for ($step = $k - 1; $step <= $k + 1; $step++) {\n                if ($step <= 0) continue;\n                $nxt = $stones[$i] + $step;\n                if (isset($pos[$nxt])) $dp[$pos[$nxt]][$step] = true;\n            }\n        }\n    }\n    return count($dp[$n - 1]) > 0;\n}`,
        ruby: `def canCross(stones)\n  n = stones.length\n  pos = {}\n  stones.each_with_index { |s, i| pos[s] = i }\n  dp = Array.new(n) { {} }\n  dp[0][0] = true\n  (0...n).each do |i|\n    dp[i].keys.each do |k|\n      (k - 1..k + 1).each do |step|\n        next if step <= 0\n        nxt = stones[i] + step\n        dp[pos[nxt]][step] = true if pos.key?(nxt)\n      end\n    end\n  end\n  !dp[n - 1].empty?\nend`,
      },
    };
  })(),

  // ── Burst Balloons (LC 312) ─────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      const a = [1].concat(nums).concat([1]);
      const dp = Array.from({ length: n + 2 }, () => new Array(n + 2).fill(0));
      for (let len = 1; len <= n; len++) {
        for (let i = 1; i + len - 1 <= n; i++) {
          const j = i + len - 1;
          for (let k = i; k <= j; k++) {
            const val = dp[i][k - 1] + a[i - 1] * a[k] * a[j + 1] + dp[k + 1][j];
            if (val > dp[i][j]) dp[i][j] = val;
          }
        }
      }
      return dp[1][n];
    };
    return {
      slug: "burst-balloons",
      title: "Burst Balloons",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Uber"],
      signature: { funcName: "maxCoins", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Balloon `i` is painted with the number `nums[i]`. Bursting balloon `i` earns `nums[i-1] · nums[i] · nums[i+1]` coins, where an out-of-range neighbour counts as 1. After a burst, its neighbours become adjacent.\n\nBurst all the balloons and return the maximum coins you can collect.",
        [
          { in: "nums = [3,1,5,8]", out: "167", note: "Burst 1, then 5, then 3, then 8." },
          { in: "nums = [1,5]", out: "10" },
          { in: "nums = [7]", out: "7" },
        ],
        ["n == nums.length", "1 <= n <= 300", "0 <= nums[i] <= 100"]),
      hints: [
        "Thinking about which balloon to burst **first** is hard, because the array keeps changing around it.",
        "Instead, decide which balloon in a range is burst **last** — its neighbours are then the fixed range boundaries.",
        "Pad the array with 1 at both ends so every range has well-defined boundaries.",
      ],
      editorial: explain({
        idea: "Interval DP on 'last to burst'. If balloon `k` is the last one popped inside `[i, j]`, then at that moment its neighbours are exactly `a[i-1]` and `a[j+1]`, which are outside the range and therefore fixed — that is what makes the subproblems independent.",
        steps: [
          "Pad: `a = [1] + nums + [1]`.",
          "Let `dp[i][j]` be the best coins from bursting everything strictly inside `[i, j]`.",
          "Try each `k` in `[i, j]` as the last burst: `dp[i][k-1] + a[i-1]·a[k]·a[j+1] + dp[k+1][j]`.",
          "Fill by increasing interval length; the answer is `dp[1][n]`.",
        ],
        why: "Choosing the *first* burst leaves two sides that are no longer independent — the surviving balloons can interact across the gap. Choosing the *last* burst inside a range fixes that balloon's neighbours to the range's outside boundaries, so the left and right sub-ranges never influence each other and their optima simply add.",
        time: "O(n³)",
        space: "O(n²)",
        pitfalls: [
          "Recursing on 'first to burst' gives overlapping, non-independent subproblems and a wrong answer.",
          "The multiplication uses the *range boundaries* `a[i-1]` and `a[j+1]`, not `a[k-1]` and `a[k+1]`.",
          "The padding is what makes the edge cases uniform; without it the boundaries need special handling.",
        ],
      }),
      examples: [
        { input: "[3,1,5,8]", expectedOutput: "167" },
        { input: "[1,5]", expectedOutput: "10" },
        { input: "[7]", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 18) }, () => ri(rng, 0, 100));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxCoins(nums: List[int]) -> int:\n    n = len(nums)\n    a = [1] + nums + [1]\n    dp = [[0] * (n + 2) for _ in range(n + 2)]\n    for length in range(1, n + 1):\n        for i in range(1, n - length + 2):\n            j = i + length - 1\n            for k in range(i, j + 1):\n                dp[i][j] = max(dp[i][j], dp[i][k - 1] + a[i - 1] * a[k] * a[j + 1] + dp[k + 1][j])\n    return dp[1][n]`,
        javascript: `var maxCoins = function(nums) {\n    var n = nums.length;\n    var a = [1].concat(nums).concat([1]);\n    var dp = [];\n    for (var p = 0; p < n + 2; p++) {\n        var row = [];\n        for (var q = 0; q < n + 2; q++) row.push(0);\n        dp.push(row);\n    }\n    for (var len = 1; len <= n; len++) {\n        for (var i = 1; i + len - 1 <= n; i++) {\n            var j = i + len - 1;\n            for (var k = i; k <= j; k++) {\n                var val = dp[i][k - 1] + a[i - 1] * a[k] * a[j + 1] + dp[k + 1][j];\n                if (val > dp[i][j]) dp[i][j] = val;\n            }\n        }\n    }\n    return dp[1][n];\n};`,
        typescript: `function maxCoins(nums: number[]): number {\n    var n = nums.length;\n    var a = [1].concat(nums).concat([1]);\n    var dp: number[][] = [];\n    for (var p = 0; p < n + 2; p++) {\n        var row: number[] = [];\n        for (var q = 0; q < n + 2; q++) row.push(0);\n        dp.push(row);\n    }\n    for (var len = 1; len <= n; len++) {\n        for (var i = 1; i + len - 1 <= n; i++) {\n            var j = i + len - 1;\n            for (var k = i; k <= j; k++) {\n                var val = dp[i][k - 1] + a[i - 1] * a[k] * a[j + 1] + dp[k + 1][j];\n                if (val > dp[i][j]) dp[i][j] = val;\n            }\n        }\n    }\n    return dp[1][n];\n}`,
        java: `public static int maxCoins(int[] nums) {\n    int n = nums.length;\n    int[] a = new int[n + 2];\n    a[0] = 1;\n    a[n + 1] = 1;\n    for (int i = 0; i < n; i++) a[i + 1] = nums[i];\n    int[][] dp = new int[n + 2][n + 2];\n    for (int len = 1; len <= n; len++) {\n        for (int i = 1; i + len - 1 <= n; i++) {\n            int j = i + len - 1;\n            for (int k = i; k <= j; k++) {\n                dp[i][j] = Math.max(dp[i][j], dp[i][k - 1] + a[i - 1] * a[k] * a[j + 1] + dp[k + 1][j]);\n            }\n        }\n    }\n    return dp[1][n];\n}`,
        cpp: `int maxCoins(vector<int>& nums) {\n    int n = (int) nums.size();\n    vector<int> a(n + 2, 1);\n    for (int i = 0; i < n; i++) a[i + 1] = nums[i];\n    vector<vector<int>> dp(n + 2, vector<int>(n + 2, 0));\n    for (int len = 1; len <= n; len++) {\n        for (int i = 1; i + len - 1 <= n; i++) {\n            int j = i + len - 1;\n            for (int k = i; k <= j; k++) {\n                dp[i][j] = max(dp[i][j], dp[i][k - 1] + a[i - 1] * a[k] * a[j + 1] + dp[k + 1][j]);\n            }\n        }\n    }\n    return dp[1][n];\n}`,
        c: `int maxCoins(int* nums, int numsSize) {\n    int n = numsSize;\n    int* a = (int*) malloc((size_t) (n + 2) * sizeof(int));\n    a[0] = 1;\n    a[n + 1] = 1;\n    for (int i = 0; i < n; i++) a[i + 1] = nums[i];\n    int w = n + 2;\n    int* dp = (int*) calloc((size_t) w * (size_t) w, sizeof(int));\n    for (int len = 1; len <= n; len++) {\n        for (int i = 1; i + len - 1 <= n; i++) {\n            int j = i + len - 1;\n            for (int k = i; k <= j; k++) {\n                int val = dp[i * w + (k - 1)] + a[i - 1] * a[k] * a[j + 1] + dp[(k + 1) * w + j];\n                if (val > dp[i * w + j]) dp[i * w + j] = val;\n            }\n        }\n    }\n    int ans = dp[1 * w + n];\n    free(a);\n    free(dp);\n    return ans;\n}`,
        csharp: `public static int MaxCoins(int[] nums)\n{\n    int n = nums.Length;\n    int[] a = new int[n + 2];\n    a[0] = 1;\n    a[n + 1] = 1;\n    for (int i = 0; i < n; i++) a[i + 1] = nums[i];\n    int[,] dp = new int[n + 2, n + 2];\n    for (int len = 1; len <= n; len++)\n    {\n        for (int i = 1; i + len - 1 <= n; i++)\n        {\n            int j = i + len - 1;\n            for (int k = i; k <= j; k++)\n            {\n                int val = dp[i, k - 1] + a[i - 1] * a[k] * a[j + 1] + dp[k + 1, j];\n                if (val > dp[i, j]) dp[i, j] = val;\n            }\n        }\n    }\n    return dp[1, n];\n}`,
        go: `func maxCoins(nums []int) int {\n\tn := len(nums)\n\ta := make([]int, n+2)\n\ta[0] = 1\n\ta[n+1] = 1\n\tfor i := 0; i < n; i++ {\n\t\ta[i+1] = nums[i]\n\t}\n\tdp := make([][]int, n+2)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, n+2)\n\t}\n\tfor length := 1; length <= n; length++ {\n\t\tfor i := 1; i+length-1 <= n; i++ {\n\t\t\tj := i + length - 1\n\t\t\tfor k := i; k <= j; k++ {\n\t\t\t\tval := dp[i][k-1] + a[i-1]*a[k]*a[j+1] + dp[k+1][j]\n\t\t\t\tif val > dp[i][j] {\n\t\t\t\t\tdp[i][j] = val\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[1][n]\n}`,
        kotlin: `fun maxCoins(nums: IntArray): Int {\n    val n = nums.size\n    val a = IntArray(n + 2) { 1 }\n    for (i in 0 until n) a[i + 1] = nums[i]\n    val dp = Array(n + 2) { IntArray(n + 2) }\n    for (len in 1..n) {\n        for (i in 1..n - len + 1) {\n            val j = i + len - 1\n            for (k in i..j) {\n                val v = dp[i][k - 1] + a[i - 1] * a[k] * a[j + 1] + dp[k + 1][j]\n                if (v > dp[i][j]) dp[i][j] = v\n            }\n        }\n    }\n    return dp[1][n]\n}`,
        swift: `func maxCoins(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var a = [Int](repeating: 1, count: n + 2)\n    for i in 0..<n { a[i + 1] = nums[i] }\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n + 2), count: n + 2)\n    for len in 1...n {\n        for i in 1...(n - len + 1) {\n            let j = i + len - 1\n            for k in i...j {\n                let v = dp[i][k - 1] + a[i - 1] * a[k] * a[j + 1] + dp[k + 1][j]\n                if v > dp[i][j] { dp[i][j] = v }\n            }\n        }\n    }\n    return dp[1][n]\n}`,
        rust: `fn maxCoins(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let mut a = vec![1i32; n + 2];\n    for i in 0..n {\n        a[i + 1] = nums[i];\n    }\n    let mut dp = vec![vec![0i32; n + 2]; n + 2];\n    for len in 1..=n {\n        for i in 1..=(n - len + 1) {\n            let j = i + len - 1;\n            for k in i..=j {\n                let v = dp[i][k - 1] + a[i - 1] * a[k] * a[j + 1] + dp[k + 1][j];\n                if v > dp[i][j] {\n                    dp[i][j] = v;\n                }\n            }\n        }\n    }\n    dp[1][n]\n}`,
        php: `function maxCoins($nums) {\n    $n = count($nums);\n    $a = array_merge([1], $nums, [1]);\n    $dp = [];\n    for ($i = 0; $i < $n + 2; $i++) $dp[$i] = array_fill(0, $n + 2, 0);\n    for ($len = 1; $len <= $n; $len++) {\n        for ($i = 1; $i + $len - 1 <= $n; $i++) {\n            $j = $i + $len - 1;\n            for ($k = $i; $k <= $j; $k++) {\n                $val = $dp[$i][$k - 1] + $a[$i - 1] * $a[$k] * $a[$j + 1] + $dp[$k + 1][$j];\n                if ($val > $dp[$i][$j]) $dp[$i][$j] = $val;\n            }\n        }\n    }\n    return $dp[1][$n];\n}`,
        ruby: `def maxCoins(nums)\n  n = nums.length\n  a = [1] + nums + [1]\n  dp = Array.new(n + 2) { Array.new(n + 2, 0) }\n  (1..n).each do |len|\n    (1..n - len + 1).each do |i|\n      j = i + len - 1\n      (i..j).each do |k|\n        val = dp[i][k - 1] + a[i - 1] * a[k] * a[j + 1] + dp[k + 1][j]\n        dp[i][j] = val if val > dp[i][j]\n      end\n    end\n  end\n  dp[1][n]\nend`,
      },
    };
  })(),

  // ── Best Time to Buy and Sell Stock IV (LC 188) ─────────────────
  (() => {
    const NEG = -1000000000;
    const ref = (k: number, prices: number[]) => {
      const n = prices.length;
      if (n === 0 || k === 0) return 0;
      if (k >= n / 2) {
        let profit = 0;
        for (let i = 1; i < n; i++) if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];
        return profit;
      }
      const buy = new Array(k + 1).fill(NEG);
      const sell = new Array(k + 1).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = 1; j <= k; j++) {
          if (sell[j - 1] - prices[i] > buy[j]) buy[j] = sell[j - 1] - prices[i];
          if (buy[j] + prices[i] > sell[j]) sell[j] = buy[j] + prices[i];
        }
      }
      return sell[k];
    };
    return {
      slug: "best-time-to-buy-and-sell-stock-iv",
      title: "Best Time to Buy and Sell Stock IV",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Goldman Sachs"],
      signature: { funcName: "maxProfit", params: [{ name: "k", type: "int" as const }, { name: "prices", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`prices[i]` is the price of a stock on day `i`. You may complete at most `k` transactions, and you must sell before buying again — never holding more than one share.\n\nReturn the maximum profit.",
        [
          { in: "k = 2, prices = [2,4,1]", out: "2", note: "Buy at 2 and sell at 4." },
          { in: "k = 2, prices = [3,2,6,5,0,3]", out: "7", note: "Buy at 2, sell at 6; buy at 0, sell at 3." },
          { in: "k = 1, prices = [7,6,4,3,1]", out: "0", note: "Prices only fall, so do nothing." },
        ],
        ["1 <= k <= 100", "1 <= prices.length <= 1000", "0 <= prices[i] <= 1000"]),
      hints: [
        "Track two running values per transaction count: the best balance while **holding** a share and while **not** holding one.",
        "`buy[j]` is the best balance after starting the `j`-th transaction; `sell[j]` after finishing it.",
        "When `k` is at least half the number of days, the cap is no constraint — take every upward move.",
      ],
      editorial: explain({
        idea: "A rolling DP over days with two arrays indexed by transaction number. Each day either continues the current state or transitions into it, which keeps everything to one pass over days times `k`.",
        steps: [
          "Short-circuit: if `k >= n / 2`, sum every positive day-to-day increase — the cap cannot bind.",
          "Otherwise initialise `buy[j]` very negative and `sell[j]` to 0.",
          "For each day and each `j`, update `buy[j] = max(buy[j], sell[j-1] - price)` and then `sell[j] = max(sell[j], buy[j] + price)`.",
          "The answer is `sell[k]`.",
        ],
        why: "Updating `buy[j]` before `sell[j]` on the same day would allow buying and selling on the same day, which is harmless: it contributes zero profit and never beats a real transaction. Each transaction is a buy followed by a later sell, and the arrays track exactly the best balance in each of those states, so the recurrence is complete. The `k >= n/2` case matters because at most `n/2` disjoint transactions fit in `n` days.",
        time: "O(n · k)",
        space: "O(k)",
        pitfalls: [
          "Without the `k >= n / 2` shortcut, a large `k` makes the DP needlessly slow.",
          "`buy[j]` must start at a very negative value, not 0, or a phantom free share appears.",
          "`sell[j-1]` is the balance *before* the `j`-th transaction — using `sell[j]` there double-counts.",
        ],
      }),
      examples: [
        { input: "2\n[2,4,1]", expectedOutput: "2" },
        { input: "2\n[3,2,6,5,0,3]", expectedOutput: "7" },
        { input: "1\n[7,6,4,3,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const prices = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 0, 1000));
        const k = ri(rng, 1, 8);
        return { input: `${k}\n${fmtIntArr(prices)}`, expectedOutput: String(ref(k, prices)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxProfit(k: int, prices: List[int]) -> int:\n    n = len(prices)\n    if n == 0 or k == 0:\n        return 0\n    if k >= n // 2:\n        return sum(max(0, prices[i] - prices[i - 1]) for i in range(1, n))\n    NEG = -10 ** 9\n    buy = [NEG] * (k + 1)\n    sell = [0] * (k + 1)\n    for p in prices:\n        for j in range(1, k + 1):\n            buy[j] = max(buy[j], sell[j - 1] - p)\n            sell[j] = max(sell[j], buy[j] + p)\n    return sell[k]`,
        javascript: `var maxProfit = function(k, prices) {\n    var NEG = -1000000000;\n    var n = prices.length;\n    if (n === 0 || k === 0) return 0;\n    var i, j;\n    if (k >= n / 2) {\n        var profit = 0;\n        for (i = 1; i < n; i++) if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];\n        return profit;\n    }\n    var buy = [], sell = [];\n    for (j = 0; j <= k; j++) { buy.push(NEG); sell.push(0); }\n    for (i = 0; i < n; i++) {\n        for (j = 1; j <= k; j++) {\n            if (sell[j - 1] - prices[i] > buy[j]) buy[j] = sell[j - 1] - prices[i];\n            if (buy[j] + prices[i] > sell[j]) sell[j] = buy[j] + prices[i];\n        }\n    }\n    return sell[k];\n};`,
        typescript: `function maxProfit(k: number, prices: number[]): number {\n    var NEG = -1000000000;\n    var n = prices.length;\n    if (n === 0 || k === 0) return 0;\n    var i: number, j: number;\n    if (k >= n / 2) {\n        var profit = 0;\n        for (i = 1; i < n; i++) if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];\n        return profit;\n    }\n    var buy: number[] = [], sell: number[] = [];\n    for (j = 0; j <= k; j++) { buy.push(NEG); sell.push(0); }\n    for (i = 0; i < n; i++) {\n        for (j = 1; j <= k; j++) {\n            if (sell[j - 1] - prices[i] > buy[j]) buy[j] = sell[j - 1] - prices[i];\n            if (buy[j] + prices[i] > sell[j]) sell[j] = buy[j] + prices[i];\n        }\n    }\n    return sell[k];\n}`,
        java: `public static int maxProfit(int k, int[] prices) {\n    final int NEG = -1000000000;\n    int n = prices.length;\n    if (n == 0 || k == 0) return 0;\n    if (k >= n / 2) {\n        int profit = 0;\n        for (int i = 1; i < n; i++) if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];\n        return profit;\n    }\n    int[] buy = new int[k + 1];\n    int[] sell = new int[k + 1];\n    Arrays.fill(buy, NEG);\n    for (int p : prices) {\n        for (int j = 1; j <= k; j++) {\n            buy[j] = Math.max(buy[j], sell[j - 1] - p);\n            sell[j] = Math.max(sell[j], buy[j] + p);\n        }\n    }\n    return sell[k];\n}`,
        cpp: `int maxProfit(int k, vector<int>& prices) {\n    const int NEG = -1000000000;\n    int n = (int) prices.size();\n    if (n == 0 || k == 0) return 0;\n    if (k >= n / 2) {\n        int profit = 0;\n        for (int i = 1; i < n; i++) if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];\n        return profit;\n    }\n    vector<int> buy(k + 1, NEG), sell(k + 1, 0);\n    for (int p : prices) {\n        for (int j = 1; j <= k; j++) {\n            buy[j] = max(buy[j], sell[j - 1] - p);\n            sell[j] = max(sell[j], buy[j] + p);\n        }\n    }\n    return sell[k];\n}`,
        c: `int maxProfit(int k, int* prices, int pricesSize) {\n    const int NEG = -1000000000;\n    int n = pricesSize;\n    if (n == 0 || k == 0) return 0;\n    if (k >= n / 2) {\n        int profit = 0;\n        for (int i = 1; i < n; i++) if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];\n        return profit;\n    }\n    int* buy = (int*) malloc((size_t) (k + 1) * sizeof(int));\n    int* sell = (int*) calloc((size_t) k + 1, sizeof(int));\n    for (int j = 0; j <= k; j++) buy[j] = NEG;\n    for (int i = 0; i < n; i++) {\n        for (int j = 1; j <= k; j++) {\n            int cand = sell[j - 1] - prices[i];\n            if (cand > buy[j]) buy[j] = cand;\n            int cand2 = buy[j] + prices[i];\n            if (cand2 > sell[j]) sell[j] = cand2;\n        }\n    }\n    int ans = sell[k];\n    free(buy);\n    free(sell);\n    return ans;\n}`,
        csharp: `public static int MaxProfit(int k, int[] prices)\n{\n    const int NEG = -1000000000;\n    int n = prices.Length;\n    if (n == 0 || k == 0) return 0;\n    if (k >= n / 2)\n    {\n        int profit = 0;\n        for (int i = 1; i < n; i++) if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1];\n        return profit;\n    }\n    int[] buy = new int[k + 1];\n    int[] sell = new int[k + 1];\n    for (int j = 0; j <= k; j++) buy[j] = NEG;\n    foreach (int p in prices)\n    {\n        for (int j = 1; j <= k; j++)\n        {\n            buy[j] = Math.Max(buy[j], sell[j - 1] - p);\n            sell[j] = Math.Max(sell[j], buy[j] + p);\n        }\n    }\n    return sell[k];\n}`,
        go: `func maxProfit(k int, prices []int) int {\n\tconst NEG = -1000000000\n\tn := len(prices)\n\tif n == 0 || k == 0 {\n\t\treturn 0\n\t}\n\tif k >= n/2 {\n\t\tprofit := 0\n\t\tfor i := 1; i < n; i++ {\n\t\t\tif prices[i] > prices[i-1] {\n\t\t\t\tprofit += prices[i] - prices[i-1]\n\t\t\t}\n\t\t}\n\t\treturn profit\n\t}\n\tbuy := make([]int, k+1)\n\tsell := make([]int, k+1)\n\tfor j := 0; j <= k; j++ {\n\t\tbuy[j] = NEG\n\t}\n\tfor _, p := range prices {\n\t\tfor j := 1; j <= k; j++ {\n\t\t\tif sell[j-1]-p > buy[j] {\n\t\t\t\tbuy[j] = sell[j-1] - p\n\t\t\t}\n\t\t\tif buy[j]+p > sell[j] {\n\t\t\t\tsell[j] = buy[j] + p\n\t\t\t}\n\t\t}\n\t}\n\treturn sell[k]\n}`,
        kotlin: `fun maxProfit(k: Int, prices: IntArray): Int {\n    val NEG = -1000000000\n    val n = prices.size\n    if (n == 0 || k == 0) return 0\n    if (k >= n / 2) {\n        var profit = 0\n        for (i in 1 until n) if (prices[i] > prices[i - 1]) profit += prices[i] - prices[i - 1]\n        return profit\n    }\n    val buy = IntArray(k + 1) { NEG }\n    val sell = IntArray(k + 1)\n    for (p in prices) {\n        for (j in 1..k) {\n            buy[j] = maxOf(buy[j], sell[j - 1] - p)\n            sell[j] = maxOf(sell[j], buy[j] + p)\n        }\n    }\n    return sell[k]\n}`,
        swift: `func maxProfit(_ k: Int, _ prices: [Int]) -> Int {\n    let NEG = -1000000000\n    let n = prices.count\n    if n == 0 || k == 0 { return 0 }\n    if k >= n / 2 {\n        var profit = 0\n        for i in 1..<max(n, 1) where n > 1 && prices[i] > prices[i - 1] {\n            profit += prices[i] - prices[i - 1]\n        }\n        return profit\n    }\n    var buy = [Int](repeating: NEG, count: k + 1)\n    var sell = [Int](repeating: 0, count: k + 1)\n    for p in prices {\n        for j in 1...k {\n            buy[j] = max(buy[j], sell[j - 1] - p)\n            sell[j] = max(sell[j], buy[j] + p)\n        }\n    }\n    return sell[k]\n}`,
        rust: `fn maxProfit(k: i32, prices: Vec<i32>) -> i32 {\n    const NEG: i32 = -1000000000;\n    let n = prices.len();\n    if n == 0 || k == 0 {\n        return 0;\n    }\n    if k as usize >= n / 2 {\n        let mut profit = 0i32;\n        for i in 1..n {\n            if prices[i] > prices[i - 1] {\n                profit += prices[i] - prices[i - 1];\n            }\n        }\n        return profit;\n    }\n    let kk = k as usize;\n    let mut buy = vec![NEG; kk + 1];\n    let mut sell = vec![0i32; kk + 1];\n    for &p in prices.iter() {\n        for j in 1..=kk {\n            if sell[j - 1] - p > buy[j] {\n                buy[j] = sell[j - 1] - p;\n            }\n            if buy[j] + p > sell[j] {\n                sell[j] = buy[j] + p;\n            }\n        }\n    }\n    sell[kk]\n}`,
        php: `function maxProfit($k, $prices) {\n    $NEG = -1000000000;\n    $n = count($prices);\n    if ($n === 0 || $k === 0) return 0;\n    if ($k >= $n / 2) {\n        $profit = 0;\n        for ($i = 1; $i < $n; $i++) if ($prices[$i] > $prices[$i - 1]) $profit += $prices[$i] - $prices[$i - 1];\n        return $profit;\n    }\n    $buy = array_fill(0, $k + 1, $NEG);\n    $sell = array_fill(0, $k + 1, 0);\n    foreach ($prices as $p) {\n        for ($j = 1; $j <= $k; $j++) {\n            $buy[$j] = max($buy[$j], $sell[$j - 1] - $p);\n            $sell[$j] = max($sell[$j], $buy[$j] + $p);\n        }\n    }\n    return $sell[$k];\n}`,
        ruby: `def maxProfit(k, prices)\n  neg = -1000000000\n  n = prices.length\n  return 0 if n == 0 || k == 0\n  if k >= n / 2.0\n    profit = 0\n    (1...n).each { |i| profit += prices[i] - prices[i - 1] if prices[i] > prices[i - 1] }\n    return profit\n  end\n  buy = Array.new(k + 1, neg)\n  sell = Array.new(k + 1, 0)\n  prices.each do |p|\n    (1..k).each do |j|\n      buy[j] = [buy[j], sell[j - 1] - p].max\n      sell[j] = [sell[j], buy[j] + p].max\n    end\n  end\n  sell[k]\nend`,
      },
    };
  })(),

  // ── Tallest Billboard (LC 956) ──────────────────────────────────
  (() => {
    const ref = (rods: number[]) => {
      let dp: Record<number, number> = { 0: 0 };
      for (let i = 0; i < rods.length; i++) {
        const r = rods[i];
        const cur: Record<number, number> = {};
        const keys = Object.keys(dp);
        for (let t = 0; t < keys.length; t++) cur[Number(keys[t])] = dp[Number(keys[t])];
        for (let t = 0; t < keys.length; t++) {
          const d = Number(keys[t]);
          const v = dp[d];
          const a = d + r;
          if (cur[a] === undefined || cur[a] < v) cur[a] = v;
          const b = Math.abs(d - r);
          const nv = v + Math.min(d, r);
          if (cur[b] === undefined || cur[b] < nv) cur[b] = nv;
        }
        dp = cur;
      }
      return dp[0];
    };
    return {
      slug: "tallest-billboard",
      title: "Tallest Billboard",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Databricks"],
      signature: { funcName: "tallestBillboard", params: [{ name: "rods", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are installing a billboard held up by **two steel supports of equal height**. You may weld some of the rods together into each support (each rod used at most once, and some rods may be left out).\n\nReturn the tallest billboard you can install, or 0 if no two equal-height supports can be built.",
        [
          { in: "rods = [1,2,3,6]", out: "6", note: "1 + 2 + 3 on one side, 6 on the other." },
          { in: "rods = [1,2,3,4,5,6]", out: "10", note: "2 + 3 + 5 against 4 + 6." },
          { in: "rods = [1,2]", out: "0", note: "No equal split exists." },
        ],
        ["1 <= rods.length <= 20", "1 <= rods[i] <= 1000", "The sum of rods is at most 5000."]),
      hints: [
        "Enumerating all `3^n` assignments is too slow at `n = 20`.",
        "Only the **difference** between the two supports matters, plus the height of the shorter one.",
        "`dp[d]` is the tallest shorter-support height achievable with a difference of `d`.",
      ],
      editorial: explain({
        idea: "Track the state as the height gap between the two supports, keeping for each gap the tallest achievable *shorter* support. The absolute heights are recoverable from those two numbers, so nothing is lost.",
        steps: [
          "Start with `dp[0] = 0` — no rods used, no gap, zero height.",
          "For each rod, consider three options: skip it, add it to the taller side (gap grows by `r`), or add it to the shorter side (gap becomes `|d - r|` and the shorter height grows by `min(d, r)`).",
          "Keep the best shorter height per gap, and return `dp[0]` at the end.",
        ],
        why: "Adding a rod to the shorter side raises the shorter support by `min(d, r)`: either the rod is shorter than the gap and the shorter side simply grows by `r`, or it overshoots and the old taller side becomes the new shorter one at height `d` above. Either way the formula is exact. Since the total is at most 5000, the gap ranges over a small set and the DP stays small.",
        time: "O(n · S) where S is the total rod length",
        space: "O(S)",
        pitfalls: [
          "Storing the taller height instead of the shorter one makes the transition messier and easy to get wrong.",
          "The 'skip' option must be carried forward explicitly.",
          "The answer is `dp[0]`, the height when the two supports are level — not the maximum over all gaps.",
        ],
      }),
      examples: [
        { input: "[1,2,3,6]", expectedOutput: "6" },
        { input: "[1,2,3,4,5,6]", expectedOutput: "10" },
        { input: "[1,2]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const rods = Array.from({ length: n }, () => ri(rng, 1, Math.floor(5000 / n)));
        return { input: fmtIntArr(rods), expectedOutput: String(ref(rods)) };
      },
      solutions: {
        python: `from typing import List\n\ndef tallestBillboard(rods: List[int]) -> int:\n    dp = {0: 0}\n    for r in rods:\n        cur = dict(dp)\n        for d, v in dp.items():\n            a = d + r\n            if cur.get(a, -1) < v:\n                cur[a] = v\n            b = abs(d - r)\n            nv = v + min(d, r)\n            if cur.get(b, -1) < nv:\n                cur[b] = nv\n        dp = cur\n    return dp[0]`,
        javascript: `var tallestBillboard = function(rods) {\n    var dp = {};\n    dp[0] = 0;\n    for (var i = 0; i < rods.length; i++) {\n        var r = rods[i];\n        var cur = {};\n        var keys = Object.keys(dp), t;\n        for (t = 0; t < keys.length; t++) cur[keys[t]] = dp[keys[t]];\n        for (t = 0; t < keys.length; t++) {\n            var d = Number(keys[t]);\n            var v = dp[d];\n            var a = d + r;\n            if (cur[a] === undefined || cur[a] < v) cur[a] = v;\n            var b = Math.abs(d - r);\n            var nv = v + Math.min(d, r);\n            if (cur[b] === undefined || cur[b] < nv) cur[b] = nv;\n        }\n        dp = cur;\n    }\n    return dp[0];\n};`,
        typescript: `function tallestBillboard(rods: number[]): number {\n    var dp: { [key: number]: number } = {};\n    dp[0] = 0;\n    for (var i = 0; i < rods.length; i++) {\n        var r = rods[i];\n        var cur: { [key: number]: number } = {};\n        var keys = Object.keys(dp), t: number;\n        for (t = 0; t < keys.length; t++) cur[Number(keys[t])] = dp[Number(keys[t])];\n        for (t = 0; t < keys.length; t++) {\n            var d = Number(keys[t]);\n            var v = dp[d];\n            var a = d + r;\n            if (cur[a] === undefined || cur[a] < v) cur[a] = v;\n            var b = Math.abs(d - r);\n            var nv = v + Math.min(d, r);\n            if (cur[b] === undefined || cur[b] < nv) cur[b] = nv;\n        }\n        dp = cur;\n    }\n    return dp[0];\n}`,
        java: `public static int tallestBillboard(int[] rods) {\n    int total = 0;\n    for (int r : rods) total += r;\n    int[] dp = new int[total + 1];\n    Arrays.fill(dp, -1);\n    dp[0] = 0;\n    for (int r : rods) {\n        int[] cur = dp.clone();\n        for (int d = 0; d <= total; d++) {\n            if (dp[d] < 0) continue;\n            int v = dp[d];\n            int a = d + r;\n            if (a <= total && cur[a] < v) cur[a] = v;\n            int b = Math.abs(d - r);\n            int nv = v + Math.min(d, r);\n            if (cur[b] < nv) cur[b] = nv;\n        }\n        dp = cur;\n    }\n    return dp[0];\n}`,
        cpp: `int tallestBillboard(vector<int>& rods) {\n    int total = 0;\n    for (int r : rods) total += r;\n    vector<int> dp(total + 1, -1);\n    dp[0] = 0;\n    for (int r : rods) {\n        vector<int> cur = dp;\n        for (int d = 0; d <= total; d++) {\n            if (dp[d] < 0) continue;\n            int v = dp[d];\n            int a = d + r;\n            if (a <= total && cur[a] < v) cur[a] = v;\n            int b = abs(d - r);\n            int nv = v + min(d, r);\n            if (cur[b] < nv) cur[b] = nv;\n        }\n        dp = cur;\n    }\n    return dp[0];\n}`,
        c: `int tallestBillboard(int* rods, int rodsSize) {\n    int total = 0;\n    for (int i = 0; i < rodsSize; i++) total += rods[i];\n    int* dp = (int*) malloc((size_t) (total + 1) * sizeof(int));\n    int* cur = (int*) malloc((size_t) (total + 1) * sizeof(int));\n    for (int i = 0; i <= total; i++) dp[i] = -1;\n    dp[0] = 0;\n    for (int i = 0; i < rodsSize; i++) {\n        int r = rods[i];\n        for (int d = 0; d <= total; d++) cur[d] = dp[d];\n        for (int d = 0; d <= total; d++) {\n            if (dp[d] < 0) continue;\n            int v = dp[d];\n            int a = d + r;\n            if (a <= total && cur[a] < v) cur[a] = v;\n            int b = d > r ? d - r : r - d;\n            int nv = v + (d < r ? d : r);\n            if (cur[b] < nv) cur[b] = nv;\n        }\n        for (int d = 0; d <= total; d++) dp[d] = cur[d];\n    }\n    int ans = dp[0];\n    free(dp);\n    free(cur);\n    return ans;\n}`,
        csharp: `public static int TallestBillboard(int[] rods)\n{\n    int total = 0;\n    foreach (int r in rods) total += r;\n    int[] dp = new int[total + 1];\n    for (int i = 0; i <= total; i++) dp[i] = -1;\n    dp[0] = 0;\n    foreach (int r in rods)\n    {\n        int[] cur = (int[]) dp.Clone();\n        for (int d = 0; d <= total; d++)\n        {\n            if (dp[d] < 0) continue;\n            int v = dp[d];\n            int a = d + r;\n            if (a <= total && cur[a] < v) cur[a] = v;\n            int b = Math.Abs(d - r);\n            int nv = v + Math.Min(d, r);\n            if (cur[b] < nv) cur[b] = nv;\n        }\n        dp = cur;\n    }\n    return dp[0];\n}`,
        go: `func tallestBillboard(rods []int) int {\n\ttotal := 0\n\tfor _, r := range rods {\n\t\ttotal += r\n\t}\n\tdp := make([]int, total+1)\n\tfor i := range dp {\n\t\tdp[i] = -1\n\t}\n\tdp[0] = 0\n\tfor _, r := range rods {\n\t\tcur := make([]int, total+1)\n\t\tcopy(cur, dp)\n\t\tfor d := 0; d <= total; d++ {\n\t\t\tif dp[d] < 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tv := dp[d]\n\t\t\ta := d + r\n\t\t\tif a <= total && cur[a] < v {\n\t\t\t\tcur[a] = v\n\t\t\t}\n\t\t\tb := d - r\n\t\t\tif b < 0 {\n\t\t\t\tb = -b\n\t\t\t}\n\t\t\tsmaller := d\n\t\t\tif r < smaller {\n\t\t\t\tsmaller = r\n\t\t\t}\n\t\t\tnv := v + smaller\n\t\t\tif cur[b] < nv {\n\t\t\t\tcur[b] = nv\n\t\t\t}\n\t\t}\n\t\tdp = cur\n\t}\n\treturn dp[0]\n}`,
        kotlin: `fun tallestBillboard(rods: IntArray): Int {\n    var total = 0\n    for (r in rods) total += r\n    var dp = IntArray(total + 1) { -1 }\n    dp[0] = 0\n    for (r in rods) {\n        val cur = dp.copyOf()\n        for (d in 0..total) {\n            if (dp[d] < 0) continue\n            val v = dp[d]\n            val a = d + r\n            if (a <= total && cur[a] < v) cur[a] = v\n            val b = Math.abs(d - r)\n            val nv = v + minOf(d, r)\n            if (cur[b] < nv) cur[b] = nv\n        }\n        dp = cur\n    }\n    return dp[0]\n}`,
        swift: `func tallestBillboard(_ rods: [Int]) -> Int {\n    let total = rods.reduce(0, +)\n    var dp = [Int](repeating: -1, count: total + 1)\n    dp[0] = 0\n    for r in rods {\n        var cur = dp\n        for d in 0...total {\n            if dp[d] < 0 { continue }\n            let v = dp[d]\n            let a = d + r\n            if a <= total && cur[a] < v { cur[a] = v }\n            let b = abs(d - r)\n            let nv = v + min(d, r)\n            if cur[b] < nv { cur[b] = nv }\n        }\n        dp = cur\n    }\n    return dp[0]\n}`,
        rust: `fn tallestBillboard(rods: Vec<i32>) -> i32 {\n    let total: i32 = rods.iter().sum();\n    let t = total as usize;\n    let mut dp = vec![-1i32; t + 1];\n    dp[0] = 0;\n    for &r in rods.iter() {\n        let mut cur = dp.clone();\n        for d in 0..=t {\n            if dp[d] < 0 {\n                continue;\n            }\n            let v = dp[d];\n            let a = d + r as usize;\n            if a <= t && cur[a] < v {\n                cur[a] = v;\n            }\n            let b = (d as i32 - r).abs() as usize;\n            let nv = v + std::cmp::min(d as i32, r);\n            if cur[b] < nv {\n                cur[b] = nv;\n            }\n        }\n        dp = cur;\n    }\n    dp[0]\n}`,
        php: `function tallestBillboard($rods) {\n    $total = array_sum($rods);\n    $dp = array_fill(0, $total + 1, -1);\n    $dp[0] = 0;\n    foreach ($rods as $r) {\n        $cur = $dp;\n        for ($d = 0; $d <= $total; $d++) {\n            if ($dp[$d] < 0) continue;\n            $v = $dp[$d];\n            $a = $d + $r;\n            if ($a <= $total && $cur[$a] < $v) $cur[$a] = $v;\n            $b = abs($d - $r);\n            $nv = $v + min($d, $r);\n            if ($cur[$b] < $nv) $cur[$b] = $nv;\n        }\n        $dp = $cur;\n    }\n    return $dp[0];\n}`,
        ruby: `def tallestBillboard(rods)\n  total = rods.sum\n  dp = Array.new(total + 1, -1)\n  dp[0] = 0\n  rods.each do |r|\n    cur = dp.dup\n    (0..total).each do |d|\n      next if dp[d] < 0\n      v = dp[d]\n      a = d + r\n      cur[a] = v if a <= total && cur[a] < v\n      b = (d - r).abs\n      nv = v + [d, r].min\n      cur[b] = nv if cur[b] < nv\n    end\n    dp = cur\n  end\n  dp[0]\nend`,
      },
    };
  })(),

  // ── Number of Ways to Paint N × 3 Grid (LC 1411) ────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (n: number) => {
      let two = 6, three = 6;
      for (let i = 2; i <= n; i++) {
        const nt = (two * 3 + three * 2) % MOD;
        const nh = (two * 2 + three * 2) % MOD;
        two = nt;
        three = nh;
      }
      return (two + three) % MOD;
    };
    return {
      slug: "number-of-ways-to-paint-n-3-grid",
      title: "Number of Ways to Paint N × 3 Grid",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Amazon", "Google", "Adobe"],
      signature: { funcName: "numOfWays", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Paint every cell of an `n × 3` grid Red, Yellow or Green so that **no two adjacent cells** (sharing a side) have the same colour.\n\nReturn the number of ways, modulo `10^9 + 7`.",
        [
          { in: "n = 1", out: "12", note: "Six patterns use two colours (like RYR) and six use three (like RYG)." },
          { in: "n = 2", out: "54" },
          { in: "n = 3", out: "246" },
        ],
        ["n == the number of rows", "1 <= n <= 5000"]),
      hints: [
        "Classify each row by its **shape**, not its exact colours: either the two ends match (`ABA`) or all three differ (`ABC`).",
        "There are 6 colourings of each shape.",
        "Count how many valid next rows each shape allows — it depends only on the shape.",
      ],
      editorial: explain({
        idea: "The only thing a row imposes on the next one is its pattern of equalities, and there are just two: `ABA` (ends equal) and `ABC` (all distinct). Counting transitions between those two classes collapses the whole problem to a two-term recurrence.",
        steps: [
          "Start with 6 rows of each shape for `n = 1`.",
          "An `ABA` row admits 3 `ABA` successors and 2 `ABC` ones; an `ABC` row admits 2 of each.",
          "Iterate `two' = 3·two + 2·three`, `three' = 2·two + 2·three` for each further row.",
          "The answer is the sum of the two counts.",
        ],
        why: "Two rows are compatible when no column matches, which depends only on the equality patterns — the specific colours never change the count of compatible successors. Enumerating the four transition counts by hand once is enough, and the recurrence then runs in linear time with constant state.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Treating the 12 colourings individually needs a 12 × 12 transition table — correct but far more work.",
          "The transition counts are not symmetric: `ABA → ABA` is 3 while `ABC → ABC` is 2.",
          "Reduce modulo at every step; the counts grow exponentially.",
        ],
      }),
      examples: [
        { input: "1", expectedOutput: "12" },
        { input: "2", expectedOutput: "54" },
        { input: "3", expectedOutput: "246" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 5000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def numOfWays(n: int) -> int:\n    MOD = 1000000007\n    two = three = 6\n    for _ in range(2, n + 1):\n        two, three = (two * 3 + three * 2) % MOD, (two * 2 + three * 2) % MOD\n    return (two + three) % MOD`,
        javascript: `var numOfWays = function(n) {\n    var MOD = 1000000007;\n    var two = 6, three = 6;\n    for (var i = 2; i <= n; i++) {\n        var nt = (two * 3 + three * 2) % MOD;\n        var nh = (two * 2 + three * 2) % MOD;\n        two = nt;\n        three = nh;\n    }\n    return (two + three) % MOD;\n};`,
        typescript: `function numOfWays(n: number): number {\n    var MOD = 1000000007;\n    var two = 6, three = 6;\n    for (var i = 2; i <= n; i++) {\n        var nt = (two * 3 + three * 2) % MOD;\n        var nh = (two * 2 + three * 2) % MOD;\n        two = nt;\n        three = nh;\n    }\n    return (two + three) % MOD;\n}`,
        java: `public static int numOfWays(int n) {\n    final long MOD = 1000000007L;\n    long two = 6, three = 6;\n    for (int i = 2; i <= n; i++) {\n        long nt = (two * 3 + three * 2) % MOD;\n        long nh = (two * 2 + three * 2) % MOD;\n        two = nt;\n        three = nh;\n    }\n    return (int) ((two + three) % MOD);\n}`,
        cpp: `int numOfWays(int n) {\n    const long long MOD = 1000000007LL;\n    long long two = 6, three = 6;\n    for (int i = 2; i <= n; i++) {\n        long long nt = (two * 3 + three * 2) % MOD;\n        long long nh = (two * 2 + three * 2) % MOD;\n        two = nt;\n        three = nh;\n    }\n    return (int) ((two + three) % MOD);\n}`,
        c: `int numOfWays(int n) {\n    const long long MOD = 1000000007LL;\n    long long two = 6, three = 6;\n    for (int i = 2; i <= n; i++) {\n        long long nt = (two * 3 + three * 2) % MOD;\n        long long nh = (two * 2 + three * 2) % MOD;\n        two = nt;\n        three = nh;\n    }\n    return (int) ((two + three) % MOD);\n}`,
        csharp: `public static int NumOfWays(int n)\n{\n    const long MOD = 1000000007L;\n    long two = 6, three = 6;\n    for (int i = 2; i <= n; i++)\n    {\n        long nt = (two * 3 + three * 2) % MOD;\n        long nh = (two * 2 + three * 2) % MOD;\n        two = nt;\n        three = nh;\n    }\n    return (int) ((two + three) % MOD);\n}`,
        go: `func numOfWays(n int) int {\n\tconst MOD = 1000000007\n\tvar two, three int64 = 6, 6\n\tfor i := 2; i <= n; i++ {\n\t\tnt := (two*3 + three*2) % MOD\n\t\tnh := (two*2 + three*2) % MOD\n\t\ttwo = nt\n\t\tthree = nh\n\t}\n\treturn int((two + three) % MOD)\n}`,
        kotlin: `fun numOfWays(n: Int): Int {\n    val MOD = 1000000007L\n    var two = 6L\n    var three = 6L\n    for (i in 2..n) {\n        val nt = (two * 3 + three * 2) % MOD\n        val nh = (two * 2 + three * 2) % MOD\n        two = nt\n        three = nh\n    }\n    return ((two + three) % MOD).toInt()\n}`,
        swift: `func numOfWays(_ n: Int) -> Int {\n    let MOD = 1000000007\n    var two = 6\n    var three = 6\n    if n >= 2 {\n        for _ in 2...n {\n            let nt = (two * 3 + three * 2) % MOD\n            let nh = (two * 2 + three * 2) % MOD\n            two = nt\n            three = nh\n        }\n    }\n    return (two + three) % MOD\n}`,
        rust: `fn numOfWays(n: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let mut two: i64 = 6;\n    let mut three: i64 = 6;\n    for _ in 2..=n {\n        let nt = (two * 3 + three * 2) % MOD;\n        let nh = (two * 2 + three * 2) % MOD;\n        two = nt;\n        three = nh;\n    }\n    ((two + three) % MOD) as i32\n}`,
        php: `function numOfWays($n) {\n    $MOD = 1000000007;\n    $two = 6;\n    $three = 6;\n    for ($i = 2; $i <= $n; $i++) {\n        $nt = ($two * 3 + $three * 2) % $MOD;\n        $nh = ($two * 2 + $three * 2) % $MOD;\n        $two = $nt;\n        $three = $nh;\n    }\n    return ($two + $three) % $MOD;\n}`,
        ruby: `def numOfWays(n)\n  mod = 1000000007\n  two = 6\n  three = 6\n  (2..n).each do\n    nt = (two * 3 + three * 2) % mod\n    nh = (two * 2 + three * 2) % mod\n    two = nt\n    three = nh\n  end\n  (two + three) % mod\nend`,
      },
    };
  })(),

  // ── Cherry Pickup (LC 741) ──────────────────────────────────────
  (() => {
    const NEG = -1000000;
    const ref = (grid: number[][]) => {
      const n = grid.length;
      let dp = Array.from({ length: n }, () => new Array(n).fill(NEG));
      dp[0][0] = grid[0][0];
      for (let t = 1; t <= 2 * (n - 1); t++) {
        const ndp = Array.from({ length: n }, () => new Array(n).fill(NEG));
        const lo = Math.max(0, t - (n - 1)), hi = Math.min(n - 1, t);
        for (let r1 = lo; r1 <= hi; r1++) {
          for (let r2 = lo; r2 <= hi; r2++) {
            const c1 = t - r1, c2 = t - r2;
            if (grid[r1][c1] === -1 || grid[r2][c2] === -1) continue;
            let best = NEG;
            const p1s = [r1 - 1, r1], p2s = [r2 - 1, r2];
            for (let a = 0; a < 2; a++) {
              for (let b = 0; b < 2; b++) {
                const p1 = p1s[a], p2 = p2s[b];
                if (p1 < 0 || p2 < 0) continue;
                if (dp[p1][p2] > best) best = dp[p1][p2];
              }
            }
            if (best === NEG) continue;
            let val = grid[r1][c1];
            if (r1 !== r2) val += grid[r2][c2];
            ndp[r1][r2] = best + val;
          }
        }
        dp = ndp;
      }
      return Math.max(0, dp[n - 1][n - 1]);
    };
    return {
      slug: "cherry-pickup",
      title: "Cherry Pickup",
      difficulty: "HARD" as const,
      tags: ["Array", "Matrix", "Dynamic Programming", "Amazon", "Google", "Uber"],
      signature: { funcName: "cherryPickup", params: [{ name: "grid", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An `n × n` grid holds `0` (empty), `1` (a cherry) or `-1` (a thorn you cannot enter).\n\nWalk from `(0,0)` to `(n-1,n-1)` moving only right or down, then walk back to `(0,0)` moving only left or up, picking up every cherry you pass (each cell's cherry is taken at most once). Return the maximum cherries collected, or 0 if the round trip is impossible.",
        [
          { in: "grid = [[0,1,-1],[1,0,-1],[1,1,1]]", out: "5", note: "One path down the left and back along the bottom collects five cherries." },
          { in: "grid = [[1,1,-1],[1,-1,1],[-1,1,1]]", out: "0", note: "No round trip exists." },
          { in: "grid = [[1,1],[1,1]]", out: "4" },
        ],
        ["n == grid.length == grid[i].length", "1 <= n <= 50", "grid[i][j] is -1, 0 or 1", "grid[0][0] and grid[n-1][n-1] are not -1."]),
      hints: [
        "A return trip going up and left is the same as a **second forward trip** going down and right.",
        "So walk two paths forward simultaneously and never double-count a shared cell.",
        "After `t` steps both walkers are on the anti-diagonal `row + col = t`, so one row index each is enough state.",
      ],
      editorial: explain({
        idea: "Reverse the return journey into a second outbound journey, then advance both walkers in lockstep. After `t` steps each sits on the diagonal `row + col = t`, so the state is `(t, row1, row2)` and the column follows.",
        steps: [
          "`dp[r1][r2]` is the best total after `t` steps with the walkers on rows `r1` and `r2`.",
          "Advance `t`; each walker either kept its row (moved right) or came from the row above (moved down) — four combinations.",
          "Add `grid[r1][c1]`, plus `grid[r2][c2]` only when the walkers are on different rows, so a shared cell is counted once.",
          "Skip any state landing on a thorn; the answer is `max(0, dp[n-1][n-1])` at the final step.",
        ],
        why: "Two independent one-way trips collect exactly what one round trip does, because reversing a path preserves the cells visited. The lockstep is what makes the 'shared cell' rule checkable: two walkers can only meet when they are on the same diagonal at the same time, which is precisely when `r1 == r2`. Clamping the final answer at 0 handles the case where no valid round trip exists, which the `NEG` sentinel propagates.",
        time: "O(n³)",
        space: "O(n²)",
        pitfalls: [
          "Running two independent greedy or DP passes is wrong — the best single path twice may overlap badly.",
          "Forgetting the `r1 == r2` check double-counts a cherry.",
          "Unreachable states must stay at the sentinel and not leak into a maximum.",
        ],
      }),
      examples: [
        { input: "[[0,1,-1],[1,0,-1],[1,1,1]]", expectedOutput: "5" },
        { input: "[[1,1,-1],[1,-1,1],[-1,1,1]]", expectedOutput: "0" },
        { input: "[[1,1],[1,1]]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 7);
        const grid = Array.from({ length: n }, () => Array.from({ length: n }, () => {
          const r = rng();
          return r < 0.2 ? -1 : (r < 0.6 ? 1 : 0);
        }));
        grid[0][0] = rng() < 0.5 ? 1 : 0;
        grid[n - 1][n - 1] = rng() < 0.5 ? 1 : 0;
        return { input: fmtIntMat(grid), expectedOutput: String(ref(grid)) };
      },
      solutions: {
        python: `from typing import List\n\ndef cherryPickup(grid: List[List[int]]) -> int:\n    n = len(grid)\n    NEG = -10 ** 6\n    dp = [[NEG] * n for _ in range(n)]\n    dp[0][0] = grid[0][0]\n    for t in range(1, 2 * (n - 1) + 1):\n        ndp = [[NEG] * n for _ in range(n)]\n        lo, hi = max(0, t - (n - 1)), min(n - 1, t)\n        for r1 in range(lo, hi + 1):\n            for r2 in range(lo, hi + 1):\n                c1, c2 = t - r1, t - r2\n                if grid[r1][c1] == -1 or grid[r2][c2] == -1:\n                    continue\n                best = NEG\n                for p1 in (r1 - 1, r1):\n                    for p2 in (r2 - 1, r2):\n                        if p1 < 0 or p2 < 0:\n                            continue\n                        best = max(best, dp[p1][p2])\n                if best == NEG:\n                    continue\n                val = grid[r1][c1]\n                if r1 != r2:\n                    val += grid[r2][c2]\n                ndp[r1][r2] = best + val\n        dp = ndp\n    return max(0, dp[n - 1][n - 1])`,
        javascript: `var cherryPickup = function(grid) {\n    var NEG = -1000000;\n    var n = grid.length;\n    var mk = function() {\n        var m = [];\n        for (var a = 0; a < n; a++) {\n            var row = [];\n            for (var b = 0; b < n; b++) row.push(NEG);\n            m.push(row);\n        }\n        return m;\n    };\n    var dp = mk();\n    dp[0][0] = grid[0][0];\n    for (var t = 1; t <= 2 * (n - 1); t++) {\n        var ndp = mk();\n        var lo = Math.max(0, t - (n - 1)), hi = Math.min(n - 1, t);\n        for (var r1 = lo; r1 <= hi; r1++) {\n            for (var r2 = lo; r2 <= hi; r2++) {\n                var c1 = t - r1, c2 = t - r2;\n                if (grid[r1][c1] === -1 || grid[r2][c2] === -1) continue;\n                var best = NEG;\n                var p1s = [r1 - 1, r1], p2s = [r2 - 1, r2];\n                for (var a = 0; a < 2; a++) {\n                    for (var b = 0; b < 2; b++) {\n                        var p1 = p1s[a], p2 = p2s[b];\n                        if (p1 < 0 || p2 < 0) continue;\n                        if (dp[p1][p2] > best) best = dp[p1][p2];\n                    }\n                }\n                if (best === NEG) continue;\n                var val = grid[r1][c1];\n                if (r1 !== r2) val += grid[r2][c2];\n                ndp[r1][r2] = best + val;\n            }\n        }\n        dp = ndp;\n    }\n    return Math.max(0, dp[n - 1][n - 1]);\n};`,
        typescript: `function cherryPickup(grid: number[][]): number {\n    var NEG = -1000000;\n    var n = grid.length;\n    var mk = function(): number[][] {\n        var m: number[][] = [];\n        for (var a = 0; a < n; a++) {\n            var row: number[] = [];\n            for (var b = 0; b < n; b++) row.push(NEG);\n            m.push(row);\n        }\n        return m;\n    };\n    var dp = mk();\n    dp[0][0] = grid[0][0];\n    for (var t = 1; t <= 2 * (n - 1); t++) {\n        var ndp = mk();\n        var lo = Math.max(0, t - (n - 1)), hi = Math.min(n - 1, t);\n        for (var r1 = lo; r1 <= hi; r1++) {\n            for (var r2 = lo; r2 <= hi; r2++) {\n                var c1 = t - r1, c2 = t - r2;\n                if (grid[r1][c1] === -1 || grid[r2][c2] === -1) continue;\n                var best = NEG;\n                var p1s = [r1 - 1, r1], p2s = [r2 - 1, r2];\n                for (var a = 0; a < 2; a++) {\n                    for (var b = 0; b < 2; b++) {\n                        var p1 = p1s[a], p2 = p2s[b];\n                        if (p1 < 0 || p2 < 0) continue;\n                        if (dp[p1][p2] > best) best = dp[p1][p2];\n                    }\n                }\n                if (best === NEG) continue;\n                var val = grid[r1][c1];\n                if (r1 !== r2) val += grid[r2][c2];\n                ndp[r1][r2] = best + val;\n            }\n        }\n        dp = ndp;\n    }\n    return Math.max(0, dp[n - 1][n - 1]);\n}`,
        java: `public static int cherryPickup(int[][] grid) {\n    final int NEG = -1000000;\n    int n = grid.length;\n    int[][] dp = new int[n][n];\n    for (int[] row : dp) Arrays.fill(row, NEG);\n    dp[0][0] = grid[0][0];\n    for (int t = 1; t <= 2 * (n - 1); t++) {\n        int[][] ndp = new int[n][n];\n        for (int[] row : ndp) Arrays.fill(row, NEG);\n        int lo = Math.max(0, t - (n - 1)), hi = Math.min(n - 1, t);\n        for (int r1 = lo; r1 <= hi; r1++) {\n            for (int r2 = lo; r2 <= hi; r2++) {\n                int c1 = t - r1, c2 = t - r2;\n                if (grid[r1][c1] == -1 || grid[r2][c2] == -1) continue;\n                int best = NEG;\n                for (int p1 = r1 - 1; p1 <= r1; p1++) {\n                    for (int p2 = r2 - 1; p2 <= r2; p2++) {\n                        if (p1 < 0 || p2 < 0) continue;\n                        best = Math.max(best, dp[p1][p2]);\n                    }\n                }\n                if (best == NEG) continue;\n                int val = grid[r1][c1];\n                if (r1 != r2) val += grid[r2][c2];\n                ndp[r1][r2] = best + val;\n            }\n        }\n        dp = ndp;\n    }\n    return Math.max(0, dp[n - 1][n - 1]);\n}`,
        cpp: `int cherryPickup(vector<vector<int>>& grid) {\n    const int NEG = -1000000;\n    int n = (int) grid.size();\n    vector<vector<int>> dp(n, vector<int>(n, NEG));\n    dp[0][0] = grid[0][0];\n    for (int t = 1; t <= 2 * (n - 1); t++) {\n        vector<vector<int>> ndp(n, vector<int>(n, NEG));\n        int lo = max(0, t - (n - 1)), hi = min(n - 1, t);\n        for (int r1 = lo; r1 <= hi; r1++) {\n            for (int r2 = lo; r2 <= hi; r2++) {\n                int c1 = t - r1, c2 = t - r2;\n                if (grid[r1][c1] == -1 || grid[r2][c2] == -1) continue;\n                int best = NEG;\n                for (int p1 = r1 - 1; p1 <= r1; p1++) {\n                    for (int p2 = r2 - 1; p2 <= r2; p2++) {\n                        if (p1 < 0 || p2 < 0) continue;\n                        best = max(best, dp[p1][p2]);\n                    }\n                }\n                if (best == NEG) continue;\n                int val = grid[r1][c1];\n                if (r1 != r2) val += grid[r2][c2];\n                ndp[r1][r2] = best + val;\n            }\n        }\n        dp = ndp;\n    }\n    return max(0, dp[n - 1][n - 1]);\n}`,
        c: `int cherryPickup(int** grid, int gridSize, int* gridColSize) {\n    (void) gridColSize;\n    const int NEG = -1000000;\n    int n = gridSize;\n    int* dp = (int*) malloc((size_t) n * (size_t) n * sizeof(int));\n    int* ndp = (int*) malloc((size_t) n * (size_t) n * sizeof(int));\n    for (int i = 0; i < n * n; i++) dp[i] = NEG;\n    dp[0] = grid[0][0];\n    for (int t = 1; t <= 2 * (n - 1); t++) {\n        for (int i = 0; i < n * n; i++) ndp[i] = NEG;\n        int lo = t - (n - 1) > 0 ? t - (n - 1) : 0;\n        int hi = t < n - 1 ? t : n - 1;\n        for (int r1 = lo; r1 <= hi; r1++) {\n            for (int r2 = lo; r2 <= hi; r2++) {\n                int c1 = t - r1, c2 = t - r2;\n                if (grid[r1][c1] == -1 || grid[r2][c2] == -1) continue;\n                int best = NEG;\n                for (int p1 = r1 - 1; p1 <= r1; p1++) {\n                    for (int p2 = r2 - 1; p2 <= r2; p2++) {\n                        if (p1 < 0 || p2 < 0) continue;\n                        if (dp[p1 * n + p2] > best) best = dp[p1 * n + p2];\n                    }\n                }\n                if (best == NEG) continue;\n                int val = grid[r1][c1];\n                if (r1 != r2) val += grid[r2][c2];\n                ndp[r1 * n + r2] = best + val;\n            }\n        }\n        for (int i = 0; i < n * n; i++) dp[i] = ndp[i];\n    }\n    int ans = dp[(n - 1) * n + (n - 1)];\n    free(dp);\n    free(ndp);\n    return ans > 0 ? ans : 0;\n}`,
        csharp: `public static int CherryPickup(int[][] grid)\n{\n    const int NEG = -1000000;\n    int n = grid.Length;\n    int[,] dp = new int[n, n];\n    for (int i = 0; i < n; i++)\n        for (int j = 0; j < n; j++)\n            dp[i, j] = NEG;\n    dp[0, 0] = grid[0][0];\n    for (int t = 1; t <= 2 * (n - 1); t++)\n    {\n        int[,] ndp = new int[n, n];\n        for (int i = 0; i < n; i++)\n            for (int j = 0; j < n; j++)\n                ndp[i, j] = NEG;\n        int lo = Math.Max(0, t - (n - 1)), hi = Math.Min(n - 1, t);\n        for (int r1 = lo; r1 <= hi; r1++)\n        {\n            for (int r2 = lo; r2 <= hi; r2++)\n            {\n                int c1 = t - r1, c2 = t - r2;\n                if (grid[r1][c1] == -1 || grid[r2][c2] == -1) continue;\n                int best = NEG;\n                for (int p1 = r1 - 1; p1 <= r1; p1++)\n                {\n                    for (int p2 = r2 - 1; p2 <= r2; p2++)\n                    {\n                        if (p1 < 0 || p2 < 0) continue;\n                        if (dp[p1, p2] > best) best = dp[p1, p2];\n                    }\n                }\n                if (best == NEG) continue;\n                int val = grid[r1][c1];\n                if (r1 != r2) val += grid[r2][c2];\n                ndp[r1, r2] = best + val;\n            }\n        }\n        dp = ndp;\n    }\n    return Math.Max(0, dp[n - 1, n - 1]);\n}`,
        go: `func cherryPickup(grid [][]int) int {\n\tconst NEG = -1000000\n\tn := len(grid)\n\tmk := func() [][]int {\n\t\tm := make([][]int, n)\n\t\tfor i := range m {\n\t\t\tm[i] = make([]int, n)\n\t\t\tfor j := range m[i] {\n\t\t\t\tm[i][j] = NEG\n\t\t\t}\n\t\t}\n\t\treturn m\n\t}\n\tdp := mk()\n\tdp[0][0] = grid[0][0]\n\tfor t := 1; t <= 2*(n-1); t++ {\n\t\tndp := mk()\n\t\tlo := t - (n - 1)\n\t\tif lo < 0 {\n\t\t\tlo = 0\n\t\t}\n\t\thi := t\n\t\tif hi > n-1 {\n\t\t\thi = n - 1\n\t\t}\n\t\tfor r1 := lo; r1 <= hi; r1++ {\n\t\t\tfor r2 := lo; r2 <= hi; r2++ {\n\t\t\t\tc1, c2 := t-r1, t-r2\n\t\t\t\tif grid[r1][c1] == -1 || grid[r2][c2] == -1 {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tbest := NEG\n\t\t\t\tfor p1 := r1 - 1; p1 <= r1; p1++ {\n\t\t\t\t\tfor p2 := r2 - 1; p2 <= r2; p2++ {\n\t\t\t\t\t\tif p1 < 0 || p2 < 0 {\n\t\t\t\t\t\t\tcontinue\n\t\t\t\t\t\t}\n\t\t\t\t\t\tif dp[p1][p2] > best {\n\t\t\t\t\t\t\tbest = dp[p1][p2]\n\t\t\t\t\t\t}\n\t\t\t\t\t}\n\t\t\t\t}\n\t\t\t\tif best == NEG {\n\t\t\t\t\tcontinue\n\t\t\t\t}\n\t\t\t\tval := grid[r1][c1]\n\t\t\t\tif r1 != r2 {\n\t\t\t\t\tval += grid[r2][c2]\n\t\t\t\t}\n\t\t\t\tndp[r1][r2] = best + val\n\t\t\t}\n\t\t}\n\t\tdp = ndp\n\t}\n\tif dp[n-1][n-1] < 0 {\n\t\treturn 0\n\t}\n\treturn dp[n-1][n-1]\n}`,
        kotlin: `fun cherryPickup(grid: Array<IntArray>): Int {\n    val NEG = -1000000\n    val n = grid.size\n    var dp = Array(n) { IntArray(n) { NEG } }\n    dp[0][0] = grid[0][0]\n    for (t in 1..2 * (n - 1)) {\n        val ndp = Array(n) { IntArray(n) { NEG } }\n        val lo = maxOf(0, t - (n - 1))\n        val hi = minOf(n - 1, t)\n        for (r1 in lo..hi) {\n            for (r2 in lo..hi) {\n                val c1 = t - r1\n                val c2 = t - r2\n                if (grid[r1][c1] == -1 || grid[r2][c2] == -1) continue\n                var best = NEG\n                for (p1 in r1 - 1..r1) {\n                    for (p2 in r2 - 1..r2) {\n                        if (p1 < 0 || p2 < 0) continue\n                        if (dp[p1][p2] > best) best = dp[p1][p2]\n                    }\n                }\n                if (best == NEG) continue\n                var value = grid[r1][c1]\n                if (r1 != r2) value += grid[r2][c2]\n                ndp[r1][r2] = best + value\n            }\n        }\n        dp = ndp\n    }\n    return maxOf(0, dp[n - 1][n - 1])\n}`,
        swift: `func cherryPickup(_ grid: [[Int]]) -> Int {\n    let NEG = -1000000\n    let n = grid.count\n    var dp = [[Int]](repeating: [Int](repeating: NEG, count: n), count: n)\n    dp[0][0] = grid[0][0]\n    if n > 1 {\n        for t in 1...(2 * (n - 1)) {\n            var ndp = [[Int]](repeating: [Int](repeating: NEG, count: n), count: n)\n            let lo = max(0, t - (n - 1))\n            let hi = min(n - 1, t)\n            for r1 in lo...hi {\n                for r2 in lo...hi {\n                    let c1 = t - r1\n                    let c2 = t - r2\n                    if grid[r1][c1] == -1 || grid[r2][c2] == -1 { continue }\n                    var best = NEG\n                    for p1 in (r1 - 1)...r1 {\n                        for p2 in (r2 - 1)...r2 {\n                            if p1 < 0 || p2 < 0 { continue }\n                            if dp[p1][p2] > best { best = dp[p1][p2] }\n                        }\n                    }\n                    if best == NEG { continue }\n                    var val = grid[r1][c1]\n                    if r1 != r2 { val += grid[r2][c2] }\n                    ndp[r1][r2] = best + val\n                }\n            }\n            dp = ndp\n        }\n    }\n    return max(0, dp[n - 1][n - 1])\n}`,
        rust: `fn cherryPickup(grid: Vec<Vec<i32>>) -> i32 {\n    const NEG: i32 = -1000000;\n    let n = grid.len();\n    let mut dp = vec![vec![NEG; n]; n];\n    dp[0][0] = grid[0][0];\n    for t in 1..=(2 * (n - 1)) {\n        let mut ndp = vec![vec![NEG; n]; n];\n        let lo = if t > n - 1 { t - (n - 1) } else { 0 };\n        let hi = std::cmp::min(n - 1, t);\n        for r1 in lo..=hi {\n            for r2 in lo..=hi {\n                let c1 = t - r1;\n                let c2 = t - r2;\n                if grid[r1][c1] == -1 || grid[r2][c2] == -1 {\n                    continue;\n                }\n                let mut best = NEG;\n                for p1 in (r1 as i32 - 1)..=(r1 as i32) {\n                    for p2 in (r2 as i32 - 1)..=(r2 as i32) {\n                        if p1 < 0 || p2 < 0 {\n                            continue;\n                        }\n                        let v = dp[p1 as usize][p2 as usize];\n                        if v > best {\n                            best = v;\n                        }\n                    }\n                }\n                if best == NEG {\n                    continue;\n                }\n                let mut val = grid[r1][c1];\n                if r1 != r2 {\n                    val += grid[r2][c2];\n                }\n                ndp[r1][r2] = best + val;\n            }\n        }\n        dp = ndp;\n    }\n    std::cmp::max(0, dp[n - 1][n - 1])\n}`,
        php: `function cherryPickup($grid) {\n    $NEG = -1000000;\n    $n = count($grid);\n    $mk = function() use ($n, $NEG) {\n        $m = [];\n        for ($i = 0; $i < $n; $i++) $m[$i] = array_fill(0, $n, $NEG);\n        return $m;\n    };\n    $dp = $mk();\n    $dp[0][0] = $grid[0][0];\n    for ($t = 1; $t <= 2 * ($n - 1); $t++) {\n        $ndp = $mk();\n        $lo = max(0, $t - ($n - 1));\n        $hi = min($n - 1, $t);\n        for ($r1 = $lo; $r1 <= $hi; $r1++) {\n            for ($r2 = $lo; $r2 <= $hi; $r2++) {\n                $c1 = $t - $r1;\n                $c2 = $t - $r2;\n                if ($grid[$r1][$c1] === -1 || $grid[$r2][$c2] === -1) continue;\n                $best = $NEG;\n                for ($p1 = $r1 - 1; $p1 <= $r1; $p1++) {\n                    for ($p2 = $r2 - 1; $p2 <= $r2; $p2++) {\n                        if ($p1 < 0 || $p2 < 0) continue;\n                        if ($dp[$p1][$p2] > $best) $best = $dp[$p1][$p2];\n                    }\n                }\n                if ($best === $NEG) continue;\n                $val = $grid[$r1][$c1];\n                if ($r1 !== $r2) $val += $grid[$r2][$c2];\n                $ndp[$r1][$r2] = $best + $val;\n            }\n        }\n        $dp = $ndp;\n    }\n    return max(0, $dp[$n - 1][$n - 1]);\n}`,
        ruby: `def cherryPickup(grid)\n  neg = -1000000\n  n = grid.length\n  dp = Array.new(n) { Array.new(n, neg) }\n  dp[0][0] = grid[0][0]\n  (1..2 * (n - 1)).each do |t|\n    ndp = Array.new(n) { Array.new(n, neg) }\n    lo = [0, t - (n - 1)].max\n    hi = [n - 1, t].min\n    (lo..hi).each do |r1|\n      (lo..hi).each do |r2|\n        c1 = t - r1\n        c2 = t - r2\n        next if grid[r1][c1] == -1 || grid[r2][c2] == -1\n        best = neg\n        (r1 - 1..r1).each do |p1|\n          (r2 - 1..r2).each do |p2|\n            next if p1 < 0 || p2 < 0\n            best = dp[p1][p2] if dp[p1][p2] > best\n          end\n        end\n        next if best == neg\n        val = grid[r1][c1]\n        val += grid[r2][c2] if r1 != r2\n        ndp[r1][r2] = best + val\n      end\n    end\n    dp = ndp\n  end\n  [0, dp[n - 1][n - 1]].max\nend`,
      },
    };
  })(),

  // ── Find the N-th Value After K Seconds (LC 3179) ───────────────
  (() => {
    const MOD = 1000000007;
    const ref = (n: number, k: number) => {
      const a = new Array(n).fill(1);
      for (let t = 0; t < k; t++) {
        for (let i = 1; i < n; i++) a[i] = (a[i] + a[i - 1]) % MOD;
      }
      return a[n - 1];
    };
    return {
      slug: "find-the-n-th-value-after-k-seconds",
      title: "Find the N-th Value After K Seconds",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Simulation", "Prefix Sum", "Combinatorics", "Amazon", "Adobe", "Zoho"],
      signature: { funcName: "valueAfterKSeconds", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "An array `a` of length `n` starts as all 1s. Every second, **simultaneously**, each element becomes the sum of all elements up to and including itself: `a[i] = a[0] + a[1] + … + a[i]`.\n\nReturn `a[n-1]` after `k` seconds, modulo `10^9 + 7`.",
        [
          { in: "n = 4, k = 5", out: "56", note: "The array goes [1,1,1,1] → [1,2,3,4] → [1,3,6,10] → … → [1,6,21,56]." },
          { in: "n = 5, k = 3", out: "35" },
          { in: "n = 1, k = 1000", out: "1", note: "A single element is always its own prefix sum." },
        ],
        ["1 <= n, k <= 1000"]),
      hints: [
        "One second is exactly a prefix-sum pass over the array.",
        "A left-to-right in-place sweep computes it correctly, because each position wants the already-updated value to its left.",
        "At these sizes `k` passes of length `n` is fast enough; the closed form is a binomial coefficient.",
      ],
      editorial: explain({
        idea: "Each second is one prefix-sum pass. Sweeping left to right in place gives exactly the simultaneous update, because `a[i]`'s new value is the new `a[i-1]` plus the old `a[i]`.",
        steps: [
          "Start with all 1s.",
          "Repeat `k` times: for `i` from 1 to `n-1`, set `a[i] += a[i-1]`, reducing modulo `10^9 + 7`.",
          "Return `a[n-1]`.",
        ],
        why: "The new `a[i]` is the sum of the old `a[0 … i]`, which equals the new `a[i-1]` (already the sum of the old `a[0 … i-1]`) plus the old `a[i]` — so the in-place left-to-right sweep is exact despite the update being 'simultaneous'. The values are the entries of Pascal's triangle, so `a[n-1]` after `k` seconds is `C(n + k - 1, k)`, which is the closed-form shortcut.",
        time: "O(n · k)",
        space: "O(n)",
        pitfalls: [
          "Sweeping right to left would use stale values and give the wrong answer.",
          "The numbers explode without the modulo — reduce at every addition.",
          "`n = 1` never changes, since there is nothing to its left.",
        ],
      }),
      examples: [
        { input: "4\n5", expectedOutput: "56" },
        { input: "5\n3", expectedOutput: "35" },
        { input: "1\n1000", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 1000);
        const k = ri(rng, 1, 1000);
        return { input: `${n}\n${k}`, expectedOutput: String(ref(n, k)) };
      },
      solutions: {
        python: `def valueAfterKSeconds(n: int, k: int) -> int:\n    MOD = 1000000007\n    a = [1] * n\n    for _ in range(k):\n        for i in range(1, n):\n            a[i] = (a[i] + a[i - 1]) % MOD\n    return a[n - 1]`,
        javascript: `var valueAfterKSeconds = function(n, k) {\n    var MOD = 1000000007;\n    var a = [];\n    for (var t = 0; t < n; t++) a.push(1);\n    for (var s = 0; s < k; s++) {\n        for (var i = 1; i < n; i++) a[i] = (a[i] + a[i - 1]) % MOD;\n    }\n    return a[n - 1];\n};`,
        typescript: `function valueAfterKSeconds(n: number, k: number): number {\n    var MOD = 1000000007;\n    var a: number[] = [];\n    for (var t = 0; t < n; t++) a.push(1);\n    for (var s = 0; s < k; s++) {\n        for (var i = 1; i < n; i++) a[i] = (a[i] + a[i - 1]) % MOD;\n    }\n    return a[n - 1];\n}`,
        java: `public static int valueAfterKSeconds(int n, int k) {\n    final int MOD = 1000000007;\n    int[] a = new int[n];\n    Arrays.fill(a, 1);\n    for (int t = 0; t < k; t++) {\n        for (int i = 1; i < n; i++) a[i] = (a[i] + a[i - 1]) % MOD;\n    }\n    return a[n - 1];\n}`,
        cpp: `int valueAfterKSeconds(int n, int k) {\n    const int MOD = 1000000007;\n    vector<int> a(n, 1);\n    for (int t = 0; t < k; t++) {\n        for (int i = 1; i < n; i++) a[i] = (a[i] + a[i - 1]) % MOD;\n    }\n    return a[n - 1];\n}`,
        c: `int valueAfterKSeconds(int n, int k) {\n    const int MOD = 1000000007;\n    int* a = (int*) malloc((size_t) n * sizeof(int));\n    for (int i = 0; i < n; i++) a[i] = 1;\n    for (int t = 0; t < k; t++) {\n        for (int i = 1; i < n; i++) a[i] = (a[i] + a[i - 1]) % MOD;\n    }\n    int ans = a[n - 1];\n    free(a);\n    return ans;\n}`,
        csharp: `public static int ValueAfterKSeconds(int n, int k)\n{\n    const int MOD = 1000000007;\n    int[] a = new int[n];\n    for (int i = 0; i < n; i++) a[i] = 1;\n    for (int t = 0; t < k; t++)\n    {\n        for (int i = 1; i < n; i++) a[i] = (a[i] + a[i - 1]) % MOD;\n    }\n    return a[n - 1];\n}`,
        go: `func valueAfterKSeconds(n int, k int) int {\n\tconst MOD = 1000000007\n\ta := make([]int, n)\n\tfor i := range a {\n\t\ta[i] = 1\n\t}\n\tfor t := 0; t < k; t++ {\n\t\tfor i := 1; i < n; i++ {\n\t\t\ta[i] = (a[i] + a[i-1]) % MOD\n\t\t}\n\t}\n\treturn a[n-1]\n}`,
        kotlin: `fun valueAfterKSeconds(n: Int, k: Int): Int {\n    val MOD = 1000000007\n    val a = IntArray(n) { 1 }\n    for (t in 0 until k) {\n        for (i in 1 until n) a[i] = (a[i] + a[i - 1]) % MOD\n    }\n    return a[n - 1]\n}`,
        swift: `func valueAfterKSeconds(_ n: Int, _ k: Int) -> Int {\n    let MOD = 1000000007\n    var a = [Int](repeating: 1, count: n)\n    for _ in 0..<k {\n        if n > 1 {\n            for i in 1..<n { a[i] = (a[i] + a[i - 1]) % MOD }\n        }\n    }\n    return a[n - 1]\n}`,
        rust: `fn valueAfterKSeconds(n: i32, k: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let nn = n as usize;\n    let mut a = vec![1i64; nn];\n    for _ in 0..k {\n        for i in 1..nn {\n            a[i] = (a[i] + a[i - 1]) % MOD;\n        }\n    }\n    a[nn - 1] as i32\n}`,
        php: `function valueAfterKSeconds($n, $k) {\n    $MOD = 1000000007;\n    $a = array_fill(0, $n, 1);\n    for ($t = 0; $t < $k; $t++) {\n        for ($i = 1; $i < $n; $i++) $a[$i] = ($a[$i] + $a[$i - 1]) % $MOD;\n    }\n    return $a[$n - 1];\n}`,
        ruby: `def valueAfterKSeconds(n, k)\n  mod = 1000000007\n  a = Array.new(n, 1)\n  k.times do\n    (1...n).each { |i| a[i] = (a[i] + a[i - 1]) % mod }\n  end\n  a[n - 1]\nend`,
      },
    };
  })(),

  // ── Distinct Subsequences II (LC 940) ───────────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (s: string) => {
      const dp = new Array(26).fill(0);
      for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i) - 97;
        let sum = 1;
        for (let j = 0; j < 26; j++) sum = (sum + dp[j]) % MOD;
        dp[c] = sum;
      }
      let ans = 0;
      for (let j = 0; j < 26; j++) ans = (ans + dp[j]) % MOD;
      return ans;
    };
    return {
      slug: "distinct-subsequences-ii",
      title: "Distinct Subsequences II",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "distinctSubseqII", params: [{ name: "s", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Return the number of **distinct non-empty subsequences** of `s`, modulo `10^9 + 7`. Two subsequences are the same if they spell the same string, regardless of which indices produced them.",
        [
          { in: 's = "abc"', out: "7", note: '"a", "b", "c", "ab", "ac", "bc", "abc".' },
          { in: 's = "aba"', out: "6", note: '"a", "b", "ab", "aa", "ba", "aba".' },
          { in: 's = "aaa"', out: "3", note: '"a", "aa", "aaa".' },
        ],
        ["1 <= s.length <= 2000", "s consists of lowercase English letters."]),
      hints: [
        "Bucket the distinct subsequences by their **last character** — that is what makes duplicates collapse.",
        "`dp[c]` is the number of distinct subsequences ending in letter `c`.",
        "Appending the current character `c` to every existing subsequence (plus the empty one) **overwrites** `dp[c]` rather than adding to it.",
      ],
      editorial: explain({
        idea: "Group distinct subsequences by last character. When a new occurrence of `c` arrives, the set of distinct subsequences ending in `c` becomes exactly 'everything so far, with `c` appended' — which replaces the old bucket instead of adding to it, and that replacement is precisely what removes the duplicates.",
        steps: [
          "Keep `dp[0 … 25]`, all starting at 0.",
          "For each character `c`, compute `sum = 1 + Σ dp[j]` — the 1 stands for the empty prefix, giving the single-character subsequence.",
          "Set `dp[c] = sum` (overwrite, not add).",
          "The answer is `Σ dp[j]`.",
        ],
        why: "Every distinct non-empty subsequence has exactly one last character, so the buckets partition the set and summing them counts each once. The overwrite is the key step: a subsequence ending in `c` could have been formed using an earlier `c`, and using the latest one instead gives the same string — so the newer bucket subsumes the older, and adding would double-count.",
        time: "O(n · 26)",
        space: "O(1)",
        pitfalls: [
          "Adding to `dp[c]` instead of overwriting counts the same string once per occurrence of its last character.",
          "The `+ 1` inside the sum accounts for the one-character subsequence and is easy to drop.",
          "Keep every addition under the modulo; the counts grow exponentially.",
        ],
      }),
      examples: [
        { input: '"abc"', expectedOutput: "7" },
        { input: '"aba"', expectedOutput: "6" },
        { input: '"aaa"', expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const alpha = rng() < 0.6 ? ["a", "b", "c"] : undefined;
        const s = Array.from({ length: ri(rng, 1, 40) }, () => (alpha ? pick(rng, alpha) : randLower(rng))).join("");
        return { input: `"${s}"`, expectedOutput: String(ref(s)) };
      },
      solutions: {
        python: `def distinctSubseqII(s: str) -> int:\n    MOD = 1000000007\n    dp = [0] * 26\n    for ch in s:\n        c = ord(ch) - 97\n        dp[c] = (1 + sum(dp)) % MOD\n    return sum(dp) % MOD`,
        javascript: `var distinctSubseqII = function(s) {\n    var MOD = 1000000007;\n    var dp = [];\n    for (var t = 0; t < 26; t++) dp.push(0);\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charCodeAt(i) - 97;\n        var sum = 1;\n        for (var j = 0; j < 26; j++) sum = (sum + dp[j]) % MOD;\n        dp[c] = sum;\n    }\n    var ans = 0;\n    for (var j2 = 0; j2 < 26; j2++) ans = (ans + dp[j2]) % MOD;\n    return ans;\n};`,
        typescript: `function distinctSubseqII(s: string): number {\n    var MOD = 1000000007;\n    var dp: number[] = [];\n    for (var t = 0; t < 26; t++) dp.push(0);\n    for (var i = 0; i < s.length; i++) {\n        var c = s.charCodeAt(i) - 97;\n        var sum = 1;\n        for (var j = 0; j < 26; j++) sum = (sum + dp[j]) % MOD;\n        dp[c] = sum;\n    }\n    var ans = 0;\n    for (var j2 = 0; j2 < 26; j2++) ans = (ans + dp[j2]) % MOD;\n    return ans;\n}`,
        java: `public static int distinctSubseqII(String s) {\n    final int MOD = 1000000007;\n    long[] dp = new long[26];\n    for (int i = 0; i < s.length(); i++) {\n        int c = s.charAt(i) - 'a';\n        long sum = 1;\n        for (int j = 0; j < 26; j++) sum = (sum + dp[j]) % MOD;\n        dp[c] = sum;\n    }\n    long ans = 0;\n    for (int j = 0; j < 26; j++) ans = (ans + dp[j]) % MOD;\n    return (int) ans;\n}`,
        cpp: `int distinctSubseqII(string s) {\n    const long long MOD = 1000000007LL;\n    vector<long long> dp(26, 0);\n    for (char ch : s) {\n        int c = ch - 'a';\n        long long sum = 1;\n        for (int j = 0; j < 26; j++) sum = (sum + dp[j]) % MOD;\n        dp[c] = sum;\n    }\n    long long ans = 0;\n    for (int j = 0; j < 26; j++) ans = (ans + dp[j]) % MOD;\n    return (int) ans;\n}`,
        c: `int distinctSubseqII(char* s) {\n    const long long MOD = 1000000007LL;\n    long long dp[26];\n    for (int i = 0; i < 26; i++) dp[i] = 0;\n    for (int i = 0; s[i]; i++) {\n        int c = s[i] - 'a';\n        long long sum = 1;\n        for (int j = 0; j < 26; j++) sum = (sum + dp[j]) % MOD;\n        dp[c] = sum;\n    }\n    long long ans = 0;\n    for (int j = 0; j < 26; j++) ans = (ans + dp[j]) % MOD;\n    return (int) ans;\n}`,
        csharp: `public static int DistinctSubseqII(string s)\n{\n    const long MOD = 1000000007L;\n    long[] dp = new long[26];\n    for (int i = 0; i < s.Length; i++)\n    {\n        int c = s[i] - 'a';\n        long sum = 1;\n        for (int j = 0; j < 26; j++) sum = (sum + dp[j]) % MOD;\n        dp[c] = sum;\n    }\n    long ans = 0;\n    for (int j = 0; j < 26; j++) ans = (ans + dp[j]) % MOD;\n    return (int) ans;\n}`,
        go: `func distinctSubseqII(s string) int {\n\tconst MOD = 1000000007\n\tdp := make([]int64, 26)\n\tfor i := 0; i < len(s); i++ {\n\t\tc := int(s[i] - 'a')\n\t\tvar sum int64 = 1\n\t\tfor j := 0; j < 26; j++ {\n\t\t\tsum = (sum + dp[j]) % MOD\n\t\t}\n\t\tdp[c] = sum\n\t}\n\tvar ans int64 = 0\n\tfor j := 0; j < 26; j++ {\n\t\tans = (ans + dp[j]) % MOD\n\t}\n\treturn int(ans)\n}`,
        kotlin: `fun distinctSubseqII(s: String): Int {\n    val MOD = 1000000007L\n    val dp = LongArray(26)\n    for (ch in s) {\n        val c = ch - 'a'\n        var sum = 1L\n        for (j in 0 until 26) sum = (sum + dp[j]) % MOD\n        dp[c] = sum\n    }\n    var ans = 0L\n    for (j in 0 until 26) ans = (ans + dp[j]) % MOD\n    return ans.toInt()\n}`,
        swift: `func distinctSubseqII(_ s: String) -> Int {\n    let MOD = 1000000007\n    var dp = [Int](repeating: 0, count: 26)\n    for ch in s.unicodeScalars {\n        let c = Int(ch.value) - 97\n        var sum = 1\n        for j in 0..<26 { sum = (sum + dp[j]) % MOD }\n        dp[c] = sum\n    }\n    var ans = 0\n    for j in 0..<26 { ans = (ans + dp[j]) % MOD }\n    return ans\n}`,
        rust: `fn distinctSubseqII(s: String) -> i32 {\n    const MOD: i64 = 1000000007;\n    let mut dp = [0i64; 26];\n    for b in s.as_bytes().iter() {\n        let c = (b - b'a') as usize;\n        let mut sum: i64 = 1;\n        for j in 0..26 {\n            sum = (sum + dp[j]) % MOD;\n        }\n        dp[c] = sum;\n    }\n    let mut ans: i64 = 0;\n    for j in 0..26 {\n        ans = (ans + dp[j]) % MOD;\n    }\n    ans as i32\n}`,
        php: `function distinctSubseqII($s) {\n    $MOD = 1000000007;\n    $dp = array_fill(0, 26, 0);\n    for ($i = 0; $i < strlen($s); $i++) {\n        $c = ord($s[$i]) - 97;\n        $sum = 1;\n        for ($j = 0; $j < 26; $j++) $sum = ($sum + $dp[$j]) % $MOD;\n        $dp[$c] = $sum;\n    }\n    $ans = 0;\n    for ($j = 0; $j < 26; $j++) $ans = ($ans + $dp[$j]) % $MOD;\n    return $ans;\n}`,
        ruby: `def distinctSubseqII(s)\n  mod = 1000000007\n  dp = Array.new(26, 0)\n  s.each_char do |ch|\n    c = ch.ord - 97\n    dp[c] = (1 + dp.sum) % mod\n  end\n  dp.sum % mod\nend`,
      },
    };
  })(),

  // ── Profitable Schemes (LC 879) ─────────────────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (n: number, minProfit: number, group: number[], profit: number[]) => {
      const dp = Array.from({ length: n + 1 }, () => new Array(minProfit + 1).fill(0));
      for (let g = 0; g <= n; g++) dp[g][0] = 1;
      for (let i = 0; i < group.length; i++) {
        const gi = group[i], pi = profit[i];
        for (let g = n; g >= gi; g--) {
          for (let p = minProfit; p >= 0; p--) {
            const np = Math.max(0, p - pi);
            dp[g][p] = (dp[g][p] + dp[g - gi][np]) % MOD;
          }
        }
      }
      return dp[n][minProfit];
    };
    return {
      slug: "profitable-schemes",
      title: "Profitable Schemes",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Adobe"],
      signature: { funcName: "profitableSchemes", params: [{ name: "n", type: "int" as const }, { name: "minProfit", type: "int" as const }, { name: "group", type: "int[]" as const }, { name: "profit", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A gang of `n` members can commit crimes. Crime `i` needs `group[i]` members and earns `profit[i]`. A member who joins one crime cannot join another.\n\nA **profitable scheme** is any subset of crimes using at most `n` members in total and earning at least `minProfit`. Return the number of such schemes, modulo `10^9 + 7`.",
        [
          { in: "n = 5, minProfit = 3, group = [2,2], profit = [2,3]", out: "2", note: "Either crime 1 alone, or both together." },
          { in: "n = 10, minProfit = 5, group = [2,3,5], profit = [6,7,8]", out: "7", note: "Any non-empty subset already clears the profit bar." },
          { in: "n = 1, minProfit = 1, group = [1], profit = [0]", out: "0" },
        ],
        ["1 <= n <= 100", "0 <= minProfit <= 100", "1 <= group.length <= 100", "1 <= group[i] <= 100", "profit.length == group.length", "0 <= profit[i] <= 100"]),
      hints: [
        "Two budgets: members used (a normal knapsack dimension) and profit earned.",
        "Profit is a *lower* bound, not an exact target — so **cap** it at `minProfit`.",
        "With the cap, `dp[g][minProfit]` means 'profit at least `minProfit`', which is exactly what is asked.",
      ],
      editorial: explain({
        idea: "A 0/1 knapsack in two dimensions, with the profit axis saturated. Since only 'at least `minProfit`' matters, any profit beyond it is indistinguishable — capping the index collapses the unbounded profit range to `minProfit + 1` states.",
        steps: [
          "`dp[g][p]` counts schemes using at most `g` members whose profit, capped at `minProfit`, is `p`.",
          "Base: `dp[g][0] = 1` for every `g` — the empty scheme.",
          "For each crime, sweep `g` and `p` downwards (0/1 knapsack order) and add `dp[g - group[i]][max(0, p - profit[i])]`.",
          "The answer is `dp[n][minProfit]`.",
        ],
        why: "Sweeping downwards ensures each crime is used at most once, as in the standard 0/1 knapsack. The `max(0, p - profit[i])` is the saturation: reaching profit `p` from a state that already had enough profit is the same as reaching it from the capped state, so all of them merge into index `minProfit` without loss.",
        time: "O(len · n · minProfit)",
        space: "O(n · minProfit)",
        pitfalls: [
          "Without capping the profit dimension, the state space is unbounded.",
          "Sweeping upwards turns it into an unbounded knapsack, letting a crime be committed twice.",
          "`minProfit = 0` makes every subset valid, including the empty one.",
        ],
      }),
      examples: [
        { input: "5\n3\n[2,2]\n[2,3]", expectedOutput: "2" },
        { input: "10\n5\n[2,3,5]\n[6,7,8]", expectedOutput: "7" },
        { input: "1\n1\n[1]\n[0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const minProfit = ri(rng, 0, 20);
        const len = ri(rng, 1, 8);
        const group = Array.from({ length: len }, () => ri(rng, 1, 12));
        const profit = Array.from({ length: len }, () => ri(rng, 0, 12));
        return {
          input: `${n}\n${minProfit}\n${fmtIntArr(group)}\n${fmtIntArr(profit)}`,
          expectedOutput: String(ref(n, minProfit, group, profit)),
        };
      },
      solutions: {
        python: `from typing import List\n\ndef profitableSchemes(n: int, minProfit: int, group: List[int], profit: List[int]) -> int:\n    MOD = 1000000007\n    dp = [[0] * (minProfit + 1) for _ in range(n + 1)]\n    for g in range(n + 1):\n        dp[g][0] = 1\n    for gi, pi in zip(group, profit):\n        for g in range(n, gi - 1, -1):\n            for p in range(minProfit, -1, -1):\n                np = max(0, p - pi)\n                dp[g][p] = (dp[g][p] + dp[g - gi][np]) % MOD\n    return dp[n][minProfit]`,
        javascript: `var profitableSchemes = function(n, minProfit, group, profit) {\n    var MOD = 1000000007;\n    var dp = [];\n    for (var a = 0; a <= n; a++) {\n        var row = [];\n        for (var b = 0; b <= minProfit; b++) row.push(0);\n        dp.push(row);\n    }\n    for (var g0 = 0; g0 <= n; g0++) dp[g0][0] = 1;\n    for (var i = 0; i < group.length; i++) {\n        var gi = group[i], pi = profit[i];\n        for (var g = n; g >= gi; g--) {\n            for (var p = minProfit; p >= 0; p--) {\n                var np = Math.max(0, p - pi);\n                dp[g][p] = (dp[g][p] + dp[g - gi][np]) % MOD;\n            }\n        }\n    }\n    return dp[n][minProfit];\n};`,
        typescript: `function profitableSchemes(n: number, minProfit: number, group: number[], profit: number[]): number {\n    var MOD = 1000000007;\n    var dp: number[][] = [];\n    for (var a = 0; a <= n; a++) {\n        var row: number[] = [];\n        for (var b = 0; b <= minProfit; b++) row.push(0);\n        dp.push(row);\n    }\n    for (var g0 = 0; g0 <= n; g0++) dp[g0][0] = 1;\n    for (var i = 0; i < group.length; i++) {\n        var gi = group[i], pi = profit[i];\n        for (var g = n; g >= gi; g--) {\n            for (var p = minProfit; p >= 0; p--) {\n                var np = Math.max(0, p - pi);\n                dp[g][p] = (dp[g][p] + dp[g - gi][np]) % MOD;\n            }\n        }\n    }\n    return dp[n][minProfit];\n}`,
        java: `public static int profitableSchemes(int n, int minProfit, int[] group, int[] profit) {\n    final int MOD = 1000000007;\n    int[][] dp = new int[n + 1][minProfit + 1];\n    for (int g = 0; g <= n; g++) dp[g][0] = 1;\n    for (int i = 0; i < group.length; i++) {\n        int gi = group[i], pi = profit[i];\n        for (int g = n; g >= gi; g--) {\n            for (int p = minProfit; p >= 0; p--) {\n                int np = Math.max(0, p - pi);\n                dp[g][p] = (dp[g][p] + dp[g - gi][np]) % MOD;\n            }\n        }\n    }\n    return dp[n][minProfit];\n}`,
        cpp: `int profitableSchemes(int n, int minProfit, vector<int>& group, vector<int>& profit) {\n    const int MOD = 1000000007;\n    vector<vector<int>> dp(n + 1, vector<int>(minProfit + 1, 0));\n    for (int g = 0; g <= n; g++) dp[g][0] = 1;\n    for (int i = 0; i < (int) group.size(); i++) {\n        int gi = group[i], pi = profit[i];\n        for (int g = n; g >= gi; g--) {\n            for (int p = minProfit; p >= 0; p--) {\n                int np = max(0, p - pi);\n                dp[g][p] = (dp[g][p] + dp[g - gi][np]) % MOD;\n            }\n        }\n    }\n    return dp[n][minProfit];\n}`,
        c: `int profitableSchemes(int n, int minProfit, int* group, int groupSize, int* profit, int profitSize) {\n    (void) profitSize;\n    const int MOD = 1000000007;\n    int w = minProfit + 1;\n    int* dp = (int*) calloc((size_t) (n + 1) * (size_t) w, sizeof(int));\n    for (int g = 0; g <= n; g++) dp[g * w + 0] = 1;\n    for (int i = 0; i < groupSize; i++) {\n        int gi = group[i], pi = profit[i];\n        for (int g = n; g >= gi; g--) {\n            for (int p = minProfit; p >= 0; p--) {\n                int np = p - pi;\n                if (np < 0) np = 0;\n                dp[g * w + p] = (dp[g * w + p] + dp[(g - gi) * w + np]) % MOD;\n            }\n        }\n    }\n    int ans = dp[n * w + minProfit];\n    free(dp);\n    return ans;\n}`,
        csharp: `public static int ProfitableSchemes(int n, int minProfit, int[] group, int[] profit)\n{\n    const int MOD = 1000000007;\n    int[,] dp = new int[n + 1, minProfit + 1];\n    for (int g = 0; g <= n; g++) dp[g, 0] = 1;\n    for (int i = 0; i < group.Length; i++)\n    {\n        int gi = group[i], pi = profit[i];\n        for (int g = n; g >= gi; g--)\n        {\n            for (int p = minProfit; p >= 0; p--)\n            {\n                int np = Math.Max(0, p - pi);\n                dp[g, p] = (dp[g, p] + dp[g - gi, np]) % MOD;\n            }\n        }\n    }\n    return dp[n, minProfit];\n}`,
        go: `func profitableSchemes(n int, minProfit int, group []int, profit []int) int {\n\tconst MOD = 1000000007\n\tdp := make([][]int, n+1)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, minProfit+1)\n\t\tdp[i][0] = 1\n\t}\n\tfor i := 0; i < len(group); i++ {\n\t\tgi, pi := group[i], profit[i]\n\t\tfor g := n; g >= gi; g-- {\n\t\t\tfor p := minProfit; p >= 0; p-- {\n\t\t\t\tnp := p - pi\n\t\t\t\tif np < 0 {\n\t\t\t\t\tnp = 0\n\t\t\t\t}\n\t\t\t\tdp[g][p] = (dp[g][p] + dp[g-gi][np]) % MOD\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[n][minProfit]\n}`,
        kotlin: `fun profitableSchemes(n: Int, minProfit: Int, group: IntArray, profit: IntArray): Int {\n    val MOD = 1000000007\n    val dp = Array(n + 1) { IntArray(minProfit + 1) }\n    for (g in 0..n) dp[g][0] = 1\n    for (i in group.indices) {\n        val gi = group[i]\n        val pi = profit[i]\n        for (g in n downTo gi) {\n            for (p in minProfit downTo 0) {\n                val np = maxOf(0, p - pi)\n                dp[g][p] = (dp[g][p] + dp[g - gi][np]) % MOD\n            }\n        }\n    }\n    return dp[n][minProfit]\n}`,
        swift: `func profitableSchemes(_ n: Int, _ minProfit: Int, _ group: [Int], _ profit: [Int]) -> Int {\n    let MOD = 1000000007\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: minProfit + 1), count: n + 1)\n    for g in 0...n { dp[g][0] = 1 }\n    for i in 0..<group.count {\n        let gi = group[i]\n        let pi = profit[i]\n        if gi > n { continue }\n        var g = n\n        while g >= gi {\n            var p = minProfit\n            while p >= 0 {\n                let np = max(0, p - pi)\n                dp[g][p] = (dp[g][p] + dp[g - gi][np]) % MOD\n                p -= 1\n            }\n            g -= 1\n        }\n    }\n    return dp[n][minProfit]\n}`,
        rust: `fn profitableSchemes(n: i32, minProfit: i32, group: Vec<i32>, profit: Vec<i32>) -> i32 {\n    const MOD: i64 = 1000000007;\n    let nn = n as usize;\n    let mp = minProfit as usize;\n    let mut dp = vec![vec![0i64; mp + 1]; nn + 1];\n    for g in 0..=nn {\n        dp[g][0] = 1;\n    }\n    for i in 0..group.len() {\n        let gi = group[i] as usize;\n        let pi = profit[i] as usize;\n        if gi > nn {\n            continue;\n        }\n        let mut g = nn;\n        while g >= gi {\n            let mut p = mp as i32;\n            while p >= 0 {\n                let np = if (p as usize) > pi { p as usize - pi } else { 0 };\n                dp[g][p as usize] = (dp[g][p as usize] + dp[g - gi][np]) % MOD;\n                p -= 1;\n            }\n            if g == 0 {\n                break;\n            }\n            g -= 1;\n        }\n    }\n    dp[nn][mp] as i32\n}`,
        php: `function profitableSchemes($n, $minProfit, $group, $profit) {\n    $MOD = 1000000007;\n    $dp = [];\n    for ($g = 0; $g <= $n; $g++) {\n        $dp[$g] = array_fill(0, $minProfit + 1, 0);\n        $dp[$g][0] = 1;\n    }\n    for ($i = 0; $i < count($group); $i++) {\n        $gi = $group[$i];\n        $pi = $profit[$i];\n        for ($g = $n; $g >= $gi; $g--) {\n            for ($p = $minProfit; $p >= 0; $p--) {\n                $np = max(0, $p - $pi);\n                $dp[$g][$p] = ($dp[$g][$p] + $dp[$g - $gi][$np]) % $MOD;\n            }\n        }\n    }\n    return $dp[$n][$minProfit];\n}`,
        ruby: `def profitableSchemes(n, minProfit, group, profit)\n  mod = 1000000007\n  dp = Array.new(n + 1) { Array.new(minProfit + 1, 0) }\n  (0..n).each { |g| dp[g][0] = 1 }\n  group.each_with_index do |gi, i|\n    pi = profit[i]\n    n.downto(gi) do |g|\n      minProfit.downto(0) do |p|\n        np = [0, p - pi].max\n        dp[g][p] = (dp[g][p] + dp[g - gi][np]) % mod\n      end\n    end\n  end\n  dp[n][minProfit]\nend`,
      },
    };
  })(),

  // ── Number of Music Playlists (LC 920) ──────────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (n: number, goal: number, k: number) => {
      const dp = Array.from({ length: goal + 1 }, () => new Array(n + 1).fill(0));
      dp[0][0] = 1;
      for (let i = 1; i <= goal; i++) {
        for (let j = 1; j <= n; j++) {
          let v = dp[i - 1][j - 1] * (n - j + 1) % MOD;
          if (j > k) v = (v + dp[i - 1][j] * (j - k)) % MOD;
          dp[i][j] = v;
        }
      }
      return dp[goal][n];
    };
    return {
      slug: "number-of-music-playlists",
      title: "Number of Music Playlists",
      difficulty: "HARD" as const,
      tags: ["Math", "Dynamic Programming", "Combinatorics", "Amazon", "Google", "Spotify"],
      signature: { funcName: "numMusicPlaylists", params: [{ name: "n", type: "int" as const }, { name: "goal", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You have `n` different songs and want a playlist of exactly `goal` songs where:\n\n- every song is played at least once;\n- a song may be replayed only if at least `k` **other** songs have been played since.\n\nReturn the number of possible playlists, modulo `10^9 + 7`.",
        [
          { in: "n = 3, goal = 3, k = 1", out: "6", note: "Every permutation of the three songs." },
          { in: "n = 2, goal = 3, k = 0", out: "6" },
          { in: "n = 2, goal = 3, k = 1", out: "2", note: "Only [1,2,1] and [2,1,2]." },
        ],
        ["0 <= k < n <= 100", "n <= goal <= 100"]),
      hints: [
        "The state is (songs placed so far, how many **distinct** songs have appeared).",
        "The next slot either introduces a new song — `n - j` choices — or repeats an old one.",
        "A repeat is only legal if at least `k` other songs sit in between, which leaves `j - k` choices.",
      ],
      editorial: explain({
        idea: "Count by position, tracking how many distinct songs have been used. Each new slot is either a first-time song or a legal repeat, and both counts depend only on the state.",
        steps: [
          "`dp[i][j]` is the number of playlists of length `i` using exactly `j` distinct songs.",
          "Adding a fresh song: `dp[i-1][j-1] · (n - j + 1)` — any of the songs not yet used.",
          "Repeating: `dp[i-1][j] · (j - k)` when `j > k` — any already-used song except the `k` most recent.",
          "The answer is `dp[goal][n]`, which forces every song to appear.",
        ],
        why: "The repeat count is `j - k` because exactly the last `k` distinct songs played are blocked, and with `j` distinct songs already used there are `j - k` legal choices — a count that does not depend on *which* songs those were, which is what keeps the state small. Requiring `j = n` at the end enforces the 'every song at least once' rule without a separate inclusion-exclusion step.",
        time: "O(goal · n)",
        space: "O(goal · n)",
        pitfalls: [
          "`dp[i-1][j] · (j - k)` must be skipped when `j <= k`, or the count goes negative.",
          "The products reach about `10^9 · 100`, so the multiplication needs 64-bit before the modulo.",
          "`k = 0` allows immediate repeats and is a legal input.",
        ],
      }),
      examples: [
        { input: "3\n3\n1", expectedOutput: "6" },
        { input: "2\n3\n0", expectedOutput: "6" },
        { input: "2\n3\n1", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const goal = ri(rng, n, Math.min(100, n + 30));
        const k = ri(rng, 0, n - 1);
        return { input: `${n}\n${goal}\n${k}`, expectedOutput: String(ref(n, goal, k)) };
      },
      solutions: {
        python: `def numMusicPlaylists(n: int, goal: int, k: int) -> int:\n    MOD = 1000000007\n    dp = [[0] * (n + 1) for _ in range(goal + 1)]\n    dp[0][0] = 1\n    for i in range(1, goal + 1):\n        for j in range(1, n + 1):\n            dp[i][j] = dp[i - 1][j - 1] * (n - j + 1) % MOD\n            if j > k:\n                dp[i][j] = (dp[i][j] + dp[i - 1][j] * (j - k)) % MOD\n    return dp[goal][n]`,
        javascript: `var numMusicPlaylists = function(n, goal, k) {\n    var MOD = 1000000007;\n    var dp = [];\n    for (var a = 0; a <= goal; a++) {\n        var row = [];\n        for (var b = 0; b <= n; b++) row.push(0);\n        dp.push(row);\n    }\n    dp[0][0] = 1;\n    for (var i = 1; i <= goal; i++) {\n        for (var j = 1; j <= n; j++) {\n            var v = dp[i - 1][j - 1] * (n - j + 1) % MOD;\n            if (j > k) v = (v + dp[i - 1][j] * (j - k)) % MOD;\n            dp[i][j] = v;\n        }\n    }\n    return dp[goal][n];\n};`,
        typescript: `function numMusicPlaylists(n: number, goal: number, k: number): number {\n    var MOD = 1000000007;\n    var dp: number[][] = [];\n    for (var a = 0; a <= goal; a++) {\n        var row: number[] = [];\n        for (var b = 0; b <= n; b++) row.push(0);\n        dp.push(row);\n    }\n    dp[0][0] = 1;\n    for (var i = 1; i <= goal; i++) {\n        for (var j = 1; j <= n; j++) {\n            var v = dp[i - 1][j - 1] * (n - j + 1) % MOD;\n            if (j > k) v = (v + dp[i - 1][j] * (j - k)) % MOD;\n            dp[i][j] = v;\n        }\n    }\n    return dp[goal][n];\n}`,
        java: `public static int numMusicPlaylists(int n, int goal, int k) {\n    final long MOD = 1000000007L;\n    long[][] dp = new long[goal + 1][n + 1];\n    dp[0][0] = 1;\n    for (int i = 1; i <= goal; i++) {\n        for (int j = 1; j <= n; j++) {\n            long v = dp[i - 1][j - 1] * (n - j + 1) % MOD;\n            if (j > k) v = (v + dp[i - 1][j] * (j - k)) % MOD;\n            dp[i][j] = v;\n        }\n    }\n    return (int) dp[goal][n];\n}`,
        cpp: `int numMusicPlaylists(int n, int goal, int k) {\n    const long long MOD = 1000000007LL;\n    vector<vector<long long>> dp(goal + 1, vector<long long>(n + 1, 0));\n    dp[0][0] = 1;\n    for (int i = 1; i <= goal; i++) {\n        for (int j = 1; j <= n; j++) {\n            long long v = dp[i - 1][j - 1] * (n - j + 1) % MOD;\n            if (j > k) v = (v + dp[i - 1][j] * (j - k)) % MOD;\n            dp[i][j] = v;\n        }\n    }\n    return (int) dp[goal][n];\n}`,
        c: `int numMusicPlaylists(int n, int goal, int k) {\n    const long long MOD = 1000000007LL;\n    int w = n + 1;\n    long long* dp = (long long*) calloc((size_t) (goal + 1) * (size_t) w, sizeof(long long));\n    dp[0] = 1;\n    for (int i = 1; i <= goal; i++) {\n        for (int j = 1; j <= n; j++) {\n            long long v = dp[(i - 1) * w + (j - 1)] * (long long) (n - j + 1) % MOD;\n            if (j > k) v = (v + dp[(i - 1) * w + j] * (long long) (j - k)) % MOD;\n            dp[i * w + j] = v;\n        }\n    }\n    int ans = (int) dp[goal * w + n];\n    free(dp);\n    return ans;\n}`,
        csharp: `public static int NumMusicPlaylists(int n, int goal, int k)\n{\n    const long MOD = 1000000007L;\n    long[,] dp = new long[goal + 1, n + 1];\n    dp[0, 0] = 1;\n    for (int i = 1; i <= goal; i++)\n    {\n        for (int j = 1; j <= n; j++)\n        {\n            long v = dp[i - 1, j - 1] * (n - j + 1) % MOD;\n            if (j > k) v = (v + dp[i - 1, j] * (j - k)) % MOD;\n            dp[i, j] = v;\n        }\n    }\n    return (int) dp[goal, n];\n}`,
        go: `func numMusicPlaylists(n int, goal int, k int) int {\n\tconst MOD = 1000000007\n\tdp := make([][]int64, goal+1)\n\tfor i := range dp {\n\t\tdp[i] = make([]int64, n+1)\n\t}\n\tdp[0][0] = 1\n\tfor i := 1; i <= goal; i++ {\n\t\tfor j := 1; j <= n; j++ {\n\t\t\tv := dp[i-1][j-1] * int64(n-j+1) % MOD\n\t\t\tif j > k {\n\t\t\t\tv = (v + dp[i-1][j]*int64(j-k)) % MOD\n\t\t\t}\n\t\t\tdp[i][j] = v\n\t\t}\n\t}\n\treturn int(dp[goal][n])\n}`,
        kotlin: `fun numMusicPlaylists(n: Int, goal: Int, k: Int): Int {\n    val MOD = 1000000007L\n    val dp = Array(goal + 1) { LongArray(n + 1) }\n    dp[0][0] = 1\n    for (i in 1..goal) {\n        for (j in 1..n) {\n            var v = dp[i - 1][j - 1] * (n - j + 1) % MOD\n            if (j > k) v = (v + dp[i - 1][j] * (j - k)) % MOD\n            dp[i][j] = v\n        }\n    }\n    return dp[goal][n].toInt()\n}`,
        swift: `func numMusicPlaylists(_ n: Int, _ goal: Int, _ k: Int) -> Int {\n    let MOD = 1000000007\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: goal + 1)\n    dp[0][0] = 1\n    for i in 1...goal {\n        for j in 1...n {\n            var v = dp[i - 1][j - 1] * (n - j + 1) % MOD\n            if j > k { v = (v + dp[i - 1][j] * (j - k)) % MOD }\n            dp[i][j] = v\n        }\n    }\n    return dp[goal][n]\n}`,
        rust: `fn numMusicPlaylists(n: i32, goal: i32, k: i32) -> i32 {\n    const MOD: i64 = 1000000007;\n    let nn = n as usize;\n    let g = goal as usize;\n    let mut dp = vec![vec![0i64; nn + 1]; g + 1];\n    dp[0][0] = 1;\n    for i in 1..=g {\n        for j in 1..=nn {\n            let mut v = dp[i - 1][j - 1] * (n as i64 - j as i64 + 1) % MOD;\n            if j as i32 > k {\n                v = (v + dp[i - 1][j] * (j as i64 - k as i64)) % MOD;\n            }\n            dp[i][j] = v;\n        }\n    }\n    dp[g][nn] as i32\n}`,
        php: `function numMusicPlaylists($n, $goal, $k) {\n    $MOD = 1000000007;\n    $dp = [];\n    for ($i = 0; $i <= $goal; $i++) $dp[$i] = array_fill(0, $n + 1, 0);\n    $dp[0][0] = 1;\n    for ($i = 1; $i <= $goal; $i++) {\n        for ($j = 1; $j <= $n; $j++) {\n            $v = $dp[$i - 1][$j - 1] * ($n - $j + 1) % $MOD;\n            if ($j > $k) $v = ($v + $dp[$i - 1][$j] * ($j - $k)) % $MOD;\n            $dp[$i][$j] = $v;\n        }\n    }\n    return $dp[$goal][$n];\n}`,
        ruby: `def numMusicPlaylists(n, goal, k)\n  mod = 1000000007\n  dp = Array.new(goal + 1) { Array.new(n + 1, 0) }\n  dp[0][0] = 1\n  (1..goal).each do |i|\n    (1..n).each do |j|\n      v = dp[i - 1][j - 1] * (n - j + 1) % mod\n      v = (v + dp[i - 1][j] * (j - k)) % mod if j > k\n      dp[i][j] = v\n    end\n  end\n  dp[goal][n]\nend`,
      },
    };
  })(),

  // ── Scramble String (LC 87) ─────────────────────────────────────
  (() => {
    const ref = (s1: string, s2: string) => {
      const memo: Record<string, boolean> = {};
      const go = (a: string, b: string): boolean => {
        if (a === b) return true;
        const key = a + "#" + b;
        if (memo[key] !== undefined) return memo[key];
        const ca = a.split("").sort().join("");
        const cb = b.split("").sort().join("");
        if (ca !== cb) { memo[key] = false; return false; }
        const n = a.length;
        for (let i = 1; i < n; i++) {
          if (go(a.slice(0, i), b.slice(0, i)) && go(a.slice(i), b.slice(i))) { memo[key] = true; return true; }
          if (go(a.slice(0, i), b.slice(n - i)) && go(a.slice(i), b.slice(0, n - i))) { memo[key] = true; return true; }
        }
        memo[key] = false;
        return false;
      };
      return go(s1, s2);
    };
    return {
      slug: "scramble-string",
      title: "Scramble String",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "isScramble", params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "A string can be **scrambled** by this recursive procedure: if its length is more than 1, split it at any position into two non-empty parts, optionally swap the two parts, and then scramble each part the same way.\n\nGiven two strings of equal length, return whether `s2` is a scramble of `s1`.",
        [
          { in: 's1 = "great", s2 = "rgeat"', out: "true", note: 'Split "great" into "gr" + "eat", scramble "gr" to "rg", and keep "eat".' },
          { in: 's1 = "abcde", s2 = "caebd"', out: "false" },
          { in: 's1 = "a", s2 = "a"', out: "true" },
        ],
        ["s1.length == s2.length", "1 <= s1.length <= 30", "s1 and s2 consist of lowercase English letters."]),
      hints: [
        "Recurse on pairs of substrings, trying every split point.",
        "At each split, try both the un-swapped and the swapped pairing.",
        "Prune hard: if two substrings have different character multisets, they can never match.",
      ],
      editorial: explain({
        idea: "The scramble relation is defined recursively, so the check is too. For a pair of equal-length substrings, try every split position and both orientations; memoise on the pair to avoid the exponential blow-up.",
        steps: [
          "Equal strings match trivially.",
          "If the sorted characters differ, return false — a decisive and cheap prune.",
          "For each split `i`: check `a[0…i) ~ b[0…i)` with `a[i…) ~ b[i…)`, or the swapped `a[0…i) ~ b[n-i…)` with `a[i…) ~ b[0…n-i)`.",
          "Memoise the result for the pair.",
        ],
        why: "The recursion mirrors the definition exactly, so it is complete: any scramble is produced by *some* split with *some* orientation. The multiset prune is what makes it fast in practice — most pairs fail it immediately, and without it the branching is unmanageable even with memoisation.",
        time: "O(n⁴) with memoisation",
        space: "O(n³) states",
        pitfalls: [
          "Forgetting the swapped orientation misses roughly half the scrambles.",
          "Without memoisation the recursion is exponential and times out at `n = 30`.",
          "The split must produce two non-empty parts, so `i` runs from 1 to `n - 1`.",
        ],
      }),
      examples: [
        { input: '"great"\n"rgeat"', expectedOutput: "true" },
        { input: '"abcde"\n"caebd"', expectedOutput: "false" },
        { input: '"a"\n"a"', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const alpha = ["a", "b", "c"];
        const n = ri(rng, 1, 8);
        const s1 = Array.from({ length: n }, () => pick(rng, alpha)).join("");
        // Half the time build a genuine scramble so "true" cases appear.
        const scramble = (t: string): string => {
          if (t.length <= 1 || rng() < 0.3) return t;
          const i = ri(rng, 1, t.length - 1);
          const l = scramble(t.slice(0, i));
          const r = scramble(t.slice(i));
          return rng() < 0.5 ? l + r : r + l;
        };
        const s2 = rng() < 0.55
          ? scramble(s1)
          : shuffle(rng, s1.split("")).join("");
        return { input: `"${s1}"\n"${s2}"`, expectedOutput: bool(ref(s1, s2)) };
      },
      solutions: {
        python: `from functools import lru_cache\n\ndef isScramble(s1: str, s2: str) -> bool:\n    @lru_cache(maxsize=None)\n    def go(a: str, b: str) -> bool:\n        if a == b:\n            return True\n        if sorted(a) != sorted(b):\n            return False\n        n = len(a)\n        for i in range(1, n):\n            if go(a[:i], b[:i]) and go(a[i:], b[i:]):\n                return True\n            if go(a[:i], b[n - i:]) and go(a[i:], b[:n - i]):\n                return True\n        return False\n\n    return go(s1, s2)`,
        javascript: `var isScramble = function(s1, s2) {\n    var memo = {};\n    var go = function(a, b) {\n        if (a === b) return true;\n        var key = a + "#" + b;\n        if (memo[key] !== undefined) return memo[key];\n        var ca = a.split("").sort().join("");\n        var cb = b.split("").sort().join("");\n        if (ca !== cb) { memo[key] = false; return false; }\n        var n = a.length;\n        for (var i = 1; i < n; i++) {\n            if (go(a.slice(0, i), b.slice(0, i)) && go(a.slice(i), b.slice(i))) { memo[key] = true; return true; }\n            if (go(a.slice(0, i), b.slice(n - i)) && go(a.slice(i), b.slice(0, n - i))) { memo[key] = true; return true; }\n        }\n        memo[key] = false;\n        return false;\n    };\n    return go(s1, s2);\n};`,
        typescript: `function isScramble(s1: string, s2: string): boolean {\n    var memo: { [key: string]: boolean } = {};\n    var go = function(a: string, b: string): boolean {\n        if (a === b) return true;\n        var key = a + "#" + b;\n        if (memo[key] !== undefined) return memo[key];\n        var ca = a.split("").sort().join("");\n        var cb = b.split("").sort().join("");\n        if (ca !== cb) { memo[key] = false; return false; }\n        var n = a.length;\n        for (var i = 1; i < n; i++) {\n            if (go(a.slice(0, i), b.slice(0, i)) && go(a.slice(i), b.slice(i))) { memo[key] = true; return true; }\n            if (go(a.slice(0, i), b.slice(n - i)) && go(a.slice(i), b.slice(0, n - i))) { memo[key] = true; return true; }\n        }\n        memo[key] = false;\n        return false;\n    };\n    return go(s1, s2);\n}`,
        java: `private static Map<String, Boolean> scrambleMemo;\n\nprivate static boolean scrambleGo(String a, String b) {\n    if (a.equals(b)) return true;\n    String key = a + "#" + b;\n    Boolean cached = scrambleMemo.get(key);\n    if (cached != null) return cached;\n    char[] ca = a.toCharArray();\n    char[] cb = b.toCharArray();\n    Arrays.sort(ca);\n    Arrays.sort(cb);\n    if (!Arrays.equals(ca, cb)) {\n        scrambleMemo.put(key, false);\n        return false;\n    }\n    int n = a.length();\n    for (int i = 1; i < n; i++) {\n        if (scrambleGo(a.substring(0, i), b.substring(0, i)) && scrambleGo(a.substring(i), b.substring(i))) {\n            scrambleMemo.put(key, true);\n            return true;\n        }\n        if (scrambleGo(a.substring(0, i), b.substring(n - i)) && scrambleGo(a.substring(i), b.substring(0, n - i))) {\n            scrambleMemo.put(key, true);\n            return true;\n        }\n    }\n    scrambleMemo.put(key, false);\n    return false;\n}\n\npublic static boolean isScramble(String s1, String s2) {\n    scrambleMemo = new HashMap<>();\n    return scrambleGo(s1, s2);\n}`,
        cpp: `static unordered_map<string, bool> scrambleMemo;\n\nstatic bool scrambleGo(const string& a, const string& b) {\n    if (a == b) return true;\n    string key = a + "#" + b;\n    auto it = scrambleMemo.find(key);\n    if (it != scrambleMemo.end()) return it->second;\n    string ca = a, cb = b;\n    sort(ca.begin(), ca.end());\n    sort(cb.begin(), cb.end());\n    if (ca != cb) {\n        scrambleMemo[key] = false;\n        return false;\n    }\n    int n = (int) a.size();\n    for (int i = 1; i < n; i++) {\n        if (scrambleGo(a.substr(0, i), b.substr(0, i)) && scrambleGo(a.substr(i), b.substr(i))) {\n            scrambleMemo[key] = true;\n            return true;\n        }\n        if (scrambleGo(a.substr(0, i), b.substr(n - i)) && scrambleGo(a.substr(i), b.substr(0, n - i))) {\n            scrambleMemo[key] = true;\n            return true;\n        }\n    }\n    scrambleMemo[key] = false;\n    return false;\n}\n\nbool isScramble(string s1, string s2) {\n    scrambleMemo.clear();\n    return scrambleGo(s1, s2);\n}`,
        c: `static char* scrambleS1;\nstatic char* scrambleS2;\nstatic signed char* scrambleMemo;\nstatic int scrambleN;\n\nstatic int scrambleGo(int i, int j, int len) {\n    int idx = (i * scrambleN + j) * (scrambleN + 1) + len;\n    if (scrambleMemo[idx] >= 0) return scrambleMemo[idx];\n    int same = 1;\n    for (int t = 0; t < len; t++) {\n        if (scrambleS1[i + t] != scrambleS2[j + t]) { same = 0; break; }\n    }\n    if (same) { scrambleMemo[idx] = 1; return 1; }\n    int cnt[26];\n    for (int t = 0; t < 26; t++) cnt[t] = 0;\n    for (int t = 0; t < len; t++) {\n        cnt[scrambleS1[i + t] - 'a']++;\n        cnt[scrambleS2[j + t] - 'a']--;\n    }\n    for (int t = 0; t < 26; t++) {\n        if (cnt[t] != 0) { scrambleMemo[idx] = 0; return 0; }\n    }\n    for (int k = 1; k < len; k++) {\n        if (scrambleGo(i, j, k) && scrambleGo(i + k, j + k, len - k)) { scrambleMemo[idx] = 1; return 1; }\n        if (scrambleGo(i, j + len - k, k) && scrambleGo(i + k, j, len - k)) { scrambleMemo[idx] = 1; return 1; }\n    }\n    scrambleMemo[idx] = 0;\n    return 0;\n}\n\nbool isScramble(char* s1, char* s2) {\n    int n = (int) strlen(s1);\n    scrambleS1 = s1;\n    scrambleS2 = s2;\n    scrambleN = n;\n    size_t total = (size_t) n * (size_t) n * (size_t) (n + 1);\n    scrambleMemo = (signed char*) malloc(total);\n    for (size_t t = 0; t < total; t++) scrambleMemo[t] = -1;\n    int res = scrambleGo(0, 0, n);\n    free(scrambleMemo);\n    return res != 0;\n}`,
        csharp: `private static Dictionary<string, bool> scrambleMemo;\n\nprivate static bool ScrambleGo(string a, string b)\n{\n    if (a == b) return true;\n    string key = a + "#" + b;\n    bool cached;\n    if (scrambleMemo.TryGetValue(key, out cached)) return cached;\n    char[] ca = a.ToCharArray();\n    char[] cb = b.ToCharArray();\n    Array.Sort(ca);\n    Array.Sort(cb);\n    if (new string(ca) != new string(cb))\n    {\n        scrambleMemo[key] = false;\n        return false;\n    }\n    int n = a.Length;\n    for (int i = 1; i < n; i++)\n    {\n        if (ScrambleGo(a.Substring(0, i), b.Substring(0, i)) && ScrambleGo(a.Substring(i), b.Substring(i)))\n        {\n            scrambleMemo[key] = true;\n            return true;\n        }\n        if (ScrambleGo(a.Substring(0, i), b.Substring(n - i)) && ScrambleGo(a.Substring(i), b.Substring(0, n - i)))\n        {\n            scrambleMemo[key] = true;\n            return true;\n        }\n    }\n    scrambleMemo[key] = false;\n    return false;\n}\n\npublic static bool IsScramble(string s1, string s2)\n{\n    scrambleMemo = new Dictionary<string, bool>();\n    return ScrambleGo(s1, s2);\n}`,
        go: `func isScramble(s1 string, s2 string) bool {\n\tmemo := map[string]bool{}\n\tvar go1 func(a, b string) bool\n\tgo1 = func(a, b string) bool {\n\t\tif a == b {\n\t\t\treturn true\n\t\t}\n\t\tkey := a + "#" + b\n\t\tif v, ok := memo[key]; ok {\n\t\t\treturn v\n\t\t}\n\t\tca := []byte(a)\n\t\tcb := []byte(b)\n\t\tsort.Slice(ca, func(x, y int) bool { return ca[x] < ca[y] })\n\t\tsort.Slice(cb, func(x, y int) bool { return cb[x] < cb[y] })\n\t\tif string(ca) != string(cb) {\n\t\t\tmemo[key] = false\n\t\t\treturn false\n\t\t}\n\t\tn := len(a)\n\t\tfor i := 1; i < n; i++ {\n\t\t\tif go1(a[:i], b[:i]) && go1(a[i:], b[i:]) {\n\t\t\t\tmemo[key] = true\n\t\t\t\treturn true\n\t\t\t}\n\t\t\tif go1(a[:i], b[n-i:]) && go1(a[i:], b[:n-i]) {\n\t\t\t\tmemo[key] = true\n\t\t\t\treturn true\n\t\t\t}\n\t\t}\n\t\tmemo[key] = false\n\t\treturn false\n\t}\n\treturn go1(s1, s2)\n}`,
        kotlin: `fun isScramble(s1: String, s2: String): Boolean {\n    val memo = HashMap<String, Boolean>()\n    fun go(a: String, b: String): Boolean {\n        if (a == b) return true\n        val key = "$a#$b"\n        memo[key]?.let { return it }\n        if (a.toCharArray().sorted() != b.toCharArray().sorted()) {\n            memo[key] = false\n            return false\n        }\n        val n = a.length\n        for (i in 1 until n) {\n            if (go(a.substring(0, i), b.substring(0, i)) && go(a.substring(i), b.substring(i))) {\n                memo[key] = true\n                return true\n            }\n            if (go(a.substring(0, i), b.substring(n - i)) && go(a.substring(i), b.substring(0, n - i))) {\n                memo[key] = true\n                return true\n            }\n        }\n        memo[key] = false\n        return false\n    }\n    return go(s1, s2)\n}`,
        swift: `func isScramble(_ s1: String, _ s2: String) -> Bool {\n    var memo = [String: Bool]()\n    func go(_ a: String, _ b: String) -> Bool {\n        if a == b { return true }\n        let key = a + "#" + b\n        if let v = memo[key] { return v }\n        if a.sorted() != b.sorted() {\n            memo[key] = false\n            return false\n        }\n        let aa = Array(a)\n        let bb = Array(b)\n        let n = aa.count\n        for i in 1..<n {\n            let a1 = String(aa[0..<i]), a2 = String(aa[i...])\n            let b1 = String(bb[0..<i]), b2 = String(bb[i...])\n            if go(a1, b1) && go(a2, b2) {\n                memo[key] = true\n                return true\n            }\n            let b3 = String(bb[(n - i)...]), b4 = String(bb[0..<(n - i)])\n            if go(a1, b3) && go(a2, b4) {\n                memo[key] = true\n                return true\n            }\n        }\n        memo[key] = false\n        return false\n    }\n    return go(s1, s2)\n}`,
        rust: `fn isScramble(s1: String, s2: String) -> bool {\n    fn go(a: &str, b: &str, memo: &mut std::collections::HashMap<String, bool>) -> bool {\n        if a == b {\n            return true;\n        }\n        let key = format!("{}#{}", a, b);\n        if let Some(&v) = memo.get(&key) {\n            return v;\n        }\n        let mut ca: Vec<u8> = a.bytes().collect();\n        let mut cb: Vec<u8> = b.bytes().collect();\n        ca.sort();\n        cb.sort();\n        if ca != cb {\n            memo.insert(key, false);\n            return false;\n        }\n        let n = a.len();\n        for i in 1..n {\n            if go(&a[..i], &b[..i], memo) && go(&a[i..], &b[i..], memo) {\n                memo.insert(key, true);\n                return true;\n            }\n            if go(&a[..i], &b[n - i..], memo) && go(&a[i..], &b[..n - i], memo) {\n                memo.insert(key, true);\n                return true;\n            }\n        }\n        memo.insert(key, false);\n        false\n    }\n    let mut memo = std::collections::HashMap::new();\n    go(&s1, &s2, &mut memo)\n}`,
        php: `function isScramble($s1, $s2) {\n    $memo = [];\n    $go = function($a, $b) use (&$go, &$memo) {\n        if ($a === $b) return true;\n        $key = $a . "#" . $b;\n        if (isset($memo[$key])) return $memo[$key];\n        $ca = str_split($a);\n        $cb = str_split($b);\n        sort($ca);\n        sort($cb);\n        if ($ca !== $cb) { $memo[$key] = false; return false; }\n        $n = strlen($a);\n        for ($i = 1; $i < $n; $i++) {\n            if ($go(substr($a, 0, $i), substr($b, 0, $i)) && $go(substr($a, $i), substr($b, $i))) {\n                $memo[$key] = true;\n                return true;\n            }\n            if ($go(substr($a, 0, $i), substr($b, $n - $i)) && $go(substr($a, $i), substr($b, 0, $n - $i))) {\n                $memo[$key] = true;\n                return true;\n            }\n        }\n        $memo[$key] = false;\n        return false;\n    };\n    return $go($s1, $s2);\n}`,
        ruby: `def isScramble(s1, s2)
  memo = {}
  go = lambda do |a, b|
    next true if a == b
    key = a + "#" + b
    next memo[key] if memo.key?(key)
    if a.chars.sort != b.chars.sort
      memo[key] = false
      next false
    end
    n = a.length
    result = false
    (1...n).each do |i|
      if (go.call(a[0, i], b[0, i]) && go.call(a[i..-1], b[i..-1])) ||
         (go.call(a[0, i], b[(n - i)..-1]) && go.call(a[i..-1], b[0, n - i]))
        result = true
        break
      end
    end
    memo[key] = result
    result
  end
  go.call(s1, s2)
end`,
      },
    };
  })(),

  // ── Number of Ways to Earn Points (LC 2585) ─────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (target: number, types: number[][]) => {
      let dp = new Array(target + 1).fill(0);
      dp[0] = 1;
      for (let i = 0; i < types.length; i++) {
        const count = types[i][0], marks = types[i][1];
        const ndp = new Array(target + 1).fill(0);
        for (let t = 0; t <= target; t++) {
          if (dp[t] === 0) continue;
          for (let c = 0; c <= count && t + c * marks <= target; c++) {
            ndp[t + c * marks] = (ndp[t + c * marks] + dp[t]) % MOD;
          }
        }
        dp = ndp;
      }
      return dp[target];
    };
    return {
      slug: "number-of-ways-to-earn-points",
      title: "Number of Ways to Earn Points",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Flipkart"],
      signature: { funcName: "waysToReachTarget", params: [{ name: "target", type: "int" as const }, { name: "types", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "An exam has several **types** of question. `types[i] = [count_i, marks_i]` means there are `count_i` questions of the `i`-th type, each worth `marks_i` marks. Questions of the same type are indistinguishable.\n\nReturn the number of ways to earn exactly `target` marks, modulo `10^9 + 7`.",
        [
          { in: "target = 6, types = [[6,1],[3,2],[2,3]]", out: "7" },
          { in: "target = 5, types = [[50,1],[50,2],[50,5]]", out: "4" },
          { in: "target = 18, types = [[6,1],[3,2],[2,3]]", out: "1", note: "Only answering every question reaches 18." },
        ],
        ["1 <= target <= 1000", "n == types.length", "1 <= n <= 50", "types[i].length == 2", "1 <= count_i, marks_i <= 50"]),
      hints: [
        "Questions of one type are interchangeable, so only **how many** of that type you answer matters.",
        "That makes it a bounded knapsack: for each type, choose a count between 0 and `count_i`.",
        "`dp[t]` is the number of ways to reach exactly `t` marks using the types processed so far.",
      ],
      editorial: explain({
        idea: "A bounded knapsack over question types. Because same-type questions are indistinguishable, a scheme is fully described by how many of each type it answers — so each type contributes one loop over its allowed counts.",
        steps: [
          "Start with `dp[0] = 1`.",
          "For each type `(count, marks)`, build a fresh array: for every reachable total `t` and every `c` in `0 … count`, add `dp[t]` into `ndp[t + c·marks]` while it stays within `target`.",
          "Return `dp[target]` at the end.",
        ],
        why: "Using a fresh array per type is what enforces the bound: without it, an in-place upward sweep would let a type be used unboundedly, and a downward sweep would cap it at one. Processing one type at a time in a fixed order counts each multiset of answers exactly once.",
        time: "O(n · target · maxCount)",
        space: "O(target)",
        pitfalls: [
          "An in-place sweep gives the unbounded or 0/1 knapsack, not the bounded one.",
          "The target must be hit **exactly**; `dp[target]` is the answer, not a running sum.",
          "Reduce modulo on every addition.",
        ],
      }),
      examples: [
        { input: "6\n[[6,1],[3,2],[2,3]]", expectedOutput: "7" },
        { input: "5\n[[50,1],[50,2],[50,5]]", expectedOutput: "4" },
        { input: "18\n[[6,1],[3,2],[2,3]]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const target = ri(rng, 1, 120);
        const n = ri(rng, 1, 6);
        const types = Array.from({ length: n }, () => [ri(rng, 1, 12), ri(rng, 1, 12)]);
        return { input: `${target}\n${fmtIntMat(types)}`, expectedOutput: String(ref(target, types)) };
      },
      solutions: {
        python: `from typing import List\n\ndef waysToReachTarget(target: int, types: List[List[int]]) -> int:\n    MOD = 1000000007\n    dp = [0] * (target + 1)\n    dp[0] = 1\n    for count, marks in types:\n        ndp = [0] * (target + 1)\n        for t in range(target + 1):\n            if dp[t] == 0:\n                continue\n            c = 0\n            while c <= count and t + c * marks <= target:\n                ndp[t + c * marks] = (ndp[t + c * marks] + dp[t]) % MOD\n                c += 1\n        dp = ndp\n    return dp[target]`,
        javascript: `var waysToReachTarget = function(target, types) {\n    var MOD = 1000000007;\n    var dp = [];\n    for (var t0 = 0; t0 <= target; t0++) dp.push(0);\n    dp[0] = 1;\n    for (var i = 0; i < types.length; i++) {\n        var count = types[i][0], marks = types[i][1];\n        var ndp = [];\n        for (var b = 0; b <= target; b++) ndp.push(0);\n        for (var t = 0; t <= target; t++) {\n            if (dp[t] === 0) continue;\n            for (var c = 0; c <= count && t + c * marks <= target; c++) {\n                ndp[t + c * marks] = (ndp[t + c * marks] + dp[t]) % MOD;\n            }\n        }\n        dp = ndp;\n    }\n    return dp[target];\n};`,
        typescript: `function waysToReachTarget(target: number, types: number[][]): number {\n    var MOD = 1000000007;\n    var dp: number[] = [];\n    for (var t0 = 0; t0 <= target; t0++) dp.push(0);\n    dp[0] = 1;\n    for (var i = 0; i < types.length; i++) {\n        var count = types[i][0], marks = types[i][1];\n        var ndp: number[] = [];\n        for (var b = 0; b <= target; b++) ndp.push(0);\n        for (var t = 0; t <= target; t++) {\n            if (dp[t] === 0) continue;\n            for (var c = 0; c <= count && t + c * marks <= target; c++) {\n                ndp[t + c * marks] = (ndp[t + c * marks] + dp[t]) % MOD;\n            }\n        }\n        dp = ndp;\n    }\n    return dp[target];\n}`,
        java: `public static int waysToReachTarget(int target, int[][] types) {\n    final int MOD = 1000000007;\n    int[] dp = new int[target + 1];\n    dp[0] = 1;\n    for (int[] ty : types) {\n        int count = ty[0], marks = ty[1];\n        int[] ndp = new int[target + 1];\n        for (int t = 0; t <= target; t++) {\n            if (dp[t] == 0) continue;\n            for (int c = 0; c <= count && t + c * marks <= target; c++) {\n                ndp[t + c * marks] = (ndp[t + c * marks] + dp[t]) % MOD;\n            }\n        }\n        dp = ndp;\n    }\n    return dp[target];\n}`,
        cpp: `int waysToReachTarget(int target, vector<vector<int>>& types) {\n    const int MOD = 1000000007;\n    vector<int> dp(target + 1, 0);\n    dp[0] = 1;\n    for (auto& ty : types) {\n        int count = ty[0], marks = ty[1];\n        vector<int> ndp(target + 1, 0);\n        for (int t = 0; t <= target; t++) {\n            if (dp[t] == 0) continue;\n            for (int c = 0; c <= count && t + c * marks <= target; c++) {\n                ndp[t + c * marks] = (ndp[t + c * marks] + dp[t]) % MOD;\n            }\n        }\n        dp = ndp;\n    }\n    return dp[target];\n}`,
        c: `int waysToReachTarget(int target, int** types, int typesSize, int* typesColSize) {\n    (void) typesColSize;\n    const int MOD = 1000000007;\n    int* dp = (int*) calloc((size_t) target + 1, sizeof(int));\n    int* ndp = (int*) calloc((size_t) target + 1, sizeof(int));\n    dp[0] = 1;\n    for (int i = 0; i < typesSize; i++) {\n        int count = types[i][0], marks = types[i][1];\n        for (int t = 0; t <= target; t++) ndp[t] = 0;\n        for (int t = 0; t <= target; t++) {\n            if (dp[t] == 0) continue;\n            for (int c = 0; c <= count && t + c * marks <= target; c++) {\n                ndp[t + c * marks] = (ndp[t + c * marks] + dp[t]) % MOD;\n            }\n        }\n        for (int t = 0; t <= target; t++) dp[t] = ndp[t];\n    }\n    int ans = dp[target];\n    free(dp);\n    free(ndp);\n    return ans;\n}`,
        csharp: `public static int WaysToReachTarget(int target, int[][] types)\n{\n    const int MOD = 1000000007;\n    int[] dp = new int[target + 1];\n    dp[0] = 1;\n    foreach (var ty in types)\n    {\n        int count = ty[0], marks = ty[1];\n        int[] ndp = new int[target + 1];\n        for (int t = 0; t <= target; t++)\n        {\n            if (dp[t] == 0) continue;\n            for (int c = 0; c <= count && t + c * marks <= target; c++)\n            {\n                ndp[t + c * marks] = (ndp[t + c * marks] + dp[t]) % MOD;\n            }\n        }\n        dp = ndp;\n    }\n    return dp[target];\n}`,
        go: `func waysToReachTarget(target int, types [][]int) int {\n\tconst MOD = 1000000007\n\tdp := make([]int, target+1)\n\tdp[0] = 1\n\tfor _, ty := range types {\n\t\tcount, marks := ty[0], ty[1]\n\t\tndp := make([]int, target+1)\n\t\tfor t := 0; t <= target; t++ {\n\t\t\tif dp[t] == 0 {\n\t\t\t\tcontinue\n\t\t\t}\n\t\t\tfor c := 0; c <= count && t+c*marks <= target; c++ {\n\t\t\t\tndp[t+c*marks] = (ndp[t+c*marks] + dp[t]) % MOD\n\t\t\t}\n\t\t}\n\t\tdp = ndp\n\t}\n\treturn dp[target]\n}`,
        kotlin: `fun waysToReachTarget(target: Int, types: Array<IntArray>): Int {\n    val MOD = 1000000007\n    var dp = IntArray(target + 1)\n    dp[0] = 1\n    for (ty in types) {\n        val count = ty[0]\n        val marks = ty[1]\n        val ndp = IntArray(target + 1)\n        for (t in 0..target) {\n            if (dp[t] == 0) continue\n            var c = 0\n            while (c <= count && t + c * marks <= target) {\n                ndp[t + c * marks] = (ndp[t + c * marks] + dp[t]) % MOD\n                c++\n            }\n        }\n        dp = ndp\n    }\n    return dp[target]\n}`,
        swift: `func waysToReachTarget(_ target: Int, _ types: [[Int]]) -> Int {\n    let MOD = 1000000007\n    var dp = [Int](repeating: 0, count: target + 1)\n    dp[0] = 1\n    for ty in types {\n        let count = ty[0]\n        let marks = ty[1]\n        var ndp = [Int](repeating: 0, count: target + 1)\n        for t in 0...target {\n            if dp[t] == 0 { continue }\n            var c = 0\n            while c <= count && t + c * marks <= target {\n                ndp[t + c * marks] = (ndp[t + c * marks] + dp[t]) % MOD\n                c += 1\n            }\n        }\n        dp = ndp\n    }\n    return dp[target]\n}`,
        rust: `fn waysToReachTarget(target: i32, types: Vec<Vec<i32>>) -> i32 {\n    const MOD: i64 = 1000000007;\n    let t0 = target as usize;\n    let mut dp = vec![0i64; t0 + 1];\n    dp[0] = 1;\n    for ty in types.iter() {\n        let count = ty[0] as usize;\n        let marks = ty[1] as usize;\n        let mut ndp = vec![0i64; t0 + 1];\n        for t in 0..=t0 {\n            if dp[t] == 0 {\n                continue;\n            }\n            let mut c = 0usize;\n            while c <= count && t + c * marks <= t0 {\n                ndp[t + c * marks] = (ndp[t + c * marks] + dp[t]) % MOD;\n                c += 1;\n            }\n        }\n        dp = ndp;\n    }\n    dp[t0] as i32\n}`,
        php: `function waysToReachTarget($target, $types) {\n    $MOD = 1000000007;\n    $dp = array_fill(0, $target + 1, 0);\n    $dp[0] = 1;\n    foreach ($types as $ty) {\n        $count = $ty[0];\n        $marks = $ty[1];\n        $ndp = array_fill(0, $target + 1, 0);\n        for ($t = 0; $t <= $target; $t++) {\n            if ($dp[$t] === 0) continue;\n            for ($c = 0; $c <= $count && $t + $c * $marks <= $target; $c++) {\n                $ndp[$t + $c * $marks] = ($ndp[$t + $c * $marks] + $dp[$t]) % $MOD;\n            }\n        }\n        $dp = $ndp;\n    }\n    return $dp[$target];\n}`,
        ruby: `def waysToReachTarget(target, types)\n  mod = 1000000007\n  dp = Array.new(target + 1, 0)\n  dp[0] = 1\n  types.each do |ty|\n    count, marks = ty[0], ty[1]\n    ndp = Array.new(target + 1, 0)\n    (0..target).each do |t|\n      next if dp[t] == 0\n      c = 0\n      while c <= count && t + c * marks <= target\n        ndp[t + c * marks] = (ndp[t + c * marks] + dp[t]) % mod\n        c += 1\n      end\n    end\n    dp = ndp\n  end\n  dp[target]\nend`,
      },
    };
  })(),

  // ── Maximum Number of Groups With Increasing Length (LC 2790) ───
  (() => {
    const ref = (usageLimits: number[]) => {
      const a = usageLimits.slice().sort((x, y) => x - y);
      let total = 0, k = 0;
      for (let i = 0; i < a.length; i++) {
        total += a[i];
        if (total >= ((k + 1) * (k + 2)) / 2) k++;
      }
      return k;
    };
    return {
      slug: "maximum-number-of-groups-with-increasing-length",
      title: "Maximum Number of Groups With Increasing Length",
      difficulty: "HARD" as const,
      tags: ["Array", "Greedy", "Sorting", "Binary Search", "Amazon", "Google", "Rubrik"],
      signature: { funcName: "maxIncreasingGroups", params: [{ name: "usageLimits", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You have numbers `0 … n-1`, and number `i` may be used at most `usageLimits[i]` times in total.\n\nBuild groups so that each group holds **distinct** numbers and every group after the first is **strictly longer** than the one before. Return the maximum number of groups.",
        [
          { in: "usageLimits = [1,2,5]", out: "3", note: "Groups of sizes 1, 2 and 3." },
          { in: "usageLimits = [2,1,2]", out: "2", note: "Sizes 1 and 2; a third group of size 3 needs 6 usages but only 5 exist." },
          { in: "usageLimits = [1,1]", out: "1" },
        ],
        ["1 <= usageLimits.length <= 100000", "1 <= usageLimits[i] <= 1000000000"]),
      hints: [
        "With `k` groups the sizes must be at least `1, 2, …, k`, needing `k(k+1)/2` usages in total.",
        "That count is also sufficient, provided you have enough *distinct* numbers — and sorting ascending makes the check greedy.",
        "Sweep the sorted limits, and whenever the running total reaches the next triangular number, one more group fits.",
      ],
      editorial: explain({
        idea: "Sort the limits ascending and sweep. After consuming the `i` smallest limits, the total usages available is their sum; `k` groups are achievable exactly when that sum reaches `k(k+1)/2` while at least `k` numbers have been consumed — and sorting makes both conditions line up.",
        steps: [
          "Sort `usageLimits` ascending.",
          "Keep a running total and a group count `k`.",
          "After adding each limit, if the total reaches `(k+1)(k+2)/2`, increment `k`.",
          "Return `k`.",
        ],
        why: "The necessity is clear: `k` groups need at least `1 + 2 + … + k` usages and at least `k` distinct numbers (the largest group needs `k` of them). Sufficiency follows from the sorted sweep: processing the smallest limits first means that by the time the total reaches the `k`-th triangular number, at least `k` numbers have contributed — so a valid assignment exists, filling the largest group from the most plentiful numbers.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "The running total reaches about `10^14`, so it needs 64-bit.",
          "`(k+1)(k+2)/2` also exceeds 32 bits for large `k` — compute it in 64-bit.",
          "Sorting descending breaks the argument; the smallest limits must come first.",
        ],
      }),
      examples: [
        { input: "[1,2,5]", expectedOutput: "3" },
        { input: "[2,1,2]", expectedOutput: "2" },
        { input: "[1,1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.6 ? 12 : 1000000000;
        const usageLimits = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, 1, hi));
        return { input: fmtIntArr(usageLimits), expectedOutput: String(ref(usageLimits)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxIncreasingGroups(usageLimits: List[int]) -> int:\n    a = sorted(usageLimits)\n    total = k = 0\n    for v in a:\n        total += v\n        if total >= (k + 1) * (k + 2) // 2:\n            k += 1\n    return k`,
        javascript: `var maxIncreasingGroups = function(usageLimits) {\n    var a = usageLimits.slice().sort(function(x, y) { return x - y; });\n    var total = 0, k = 0;\n    for (var i = 0; i < a.length; i++) {\n        total += a[i];\n        if (total >= (k + 1) * (k + 2) / 2) k++;\n    }\n    return k;\n};`,
        typescript: `function maxIncreasingGroups(usageLimits: number[]): number {\n    var a = usageLimits.slice().sort(function(x, y) { return x - y; });\n    var total = 0, k = 0;\n    for (var i = 0; i < a.length; i++) {\n        total += a[i];\n        if (total >= (k + 1) * (k + 2) / 2) k++;\n    }\n    return k;\n}`,
        java: `public static int maxIncreasingGroups(int[] usageLimits) {\n    int[] a = usageLimits.clone();\n    Arrays.sort(a);\n    long total = 0;\n    long k = 0;\n    for (int v : a) {\n        total += v;\n        if (total >= (k + 1) * (k + 2) / 2) k++;\n    }\n    return (int) k;\n}`,
        cpp: `int maxIncreasingGroups(vector<int>& usageLimits) {\n    vector<int> a = usageLimits;\n    sort(a.begin(), a.end());\n    long long total = 0, k = 0;\n    for (int v : a) {\n        total += v;\n        if (total >= (k + 1) * (k + 2) / 2) k++;\n    }\n    return (int) k;\n}`,
        c: `static int cmpUsageAsc(const void* x, const void* y) {\n    int p = *(const int*) x;\n    int q = *(const int*) y;\n    return (p > q) - (p < q);\n}\n\nint maxIncreasingGroups(int* usageLimits, int usageLimitsSize) {\n    int* a = (int*) malloc((size_t) usageLimitsSize * sizeof(int));\n    for (int i = 0; i < usageLimitsSize; i++) a[i] = usageLimits[i];\n    qsort(a, (size_t) usageLimitsSize, sizeof(int), cmpUsageAsc);\n    long long total = 0, k = 0;\n    for (int i = 0; i < usageLimitsSize; i++) {\n        total += a[i];\n        if (total >= (k + 1) * (k + 2) / 2) k++;\n    }\n    free(a);\n    return (int) k;\n}`,
        csharp: `public static int MaxIncreasingGroups(int[] usageLimits)\n{\n    int[] a = (int[]) usageLimits.Clone();\n    Array.Sort(a);\n    long total = 0, k = 0;\n    foreach (int v in a)\n    {\n        total += v;\n        if (total >= (k + 1) * (k + 2) / 2) k++;\n    }\n    return (int) k;\n}`,
        go: `func maxIncreasingGroups(usageLimits []int) int {\n\ta := append([]int{}, usageLimits...)\n\tsort.Ints(a)\n\tvar total, k int64 = 0, 0\n\tfor _, v := range a {\n\t\ttotal += int64(v)\n\t\tif total >= (k+1)*(k+2)/2 {\n\t\t\tk++\n\t\t}\n\t}\n\treturn int(k)\n}`,
        kotlin: `fun maxIncreasingGroups(usageLimits: IntArray): Int {\n    val a = usageLimits.sortedArray()\n    var total = 0L\n    var k = 0L\n    for (v in a) {\n        total += v\n        if (total >= (k + 1) * (k + 2) / 2) k++\n    }\n    return k.toInt()\n}`,
        swift: `func maxIncreasingGroups(_ usageLimits: [Int]) -> Int {\n    let a = usageLimits.sorted()\n    var total = 0\n    var k = 0\n    for v in a {\n        total += v\n        if total >= (k + 1) * (k + 2) / 2 { k += 1 }\n    }\n    return k\n}`,
        rust: `fn maxIncreasingGroups(usageLimits: Vec<i32>) -> i32 {\n    let mut a = usageLimits.clone();\n    a.sort();\n    let mut total: i64 = 0;\n    let mut k: i64 = 0;\n    for &v in a.iter() {\n        total += v as i64;\n        if total >= (k + 1) * (k + 2) / 2 {\n            k += 1;\n        }\n    }\n    k as i32\n}`,
        php: `function maxIncreasingGroups($usageLimits) {\n    $a = $usageLimits;\n    sort($a);\n    $total = 0;\n    $k = 0;\n    foreach ($a as $v) {\n        $total += $v;\n        if ($total >= ($k + 1) * ($k + 2) / 2) $k++;\n    }\n    return $k;\n}`,
        ruby: `def maxIncreasingGroups(usageLimits)\n  a = usageLimits.sort\n  total = 0\n  k = 0\n  a.each do |v|\n    total += v\n    k += 1 if total >= (k + 1) * (k + 2) / 2\n  end\n  k\nend`,
      },
    };
  })(),

  // ── Minimum White Tiles After Covering With Carpets (LC 2209) ───
  (() => {
    const ref = (floor: string, numCarpets: number, carpetLen: number) => {
      const n = floor.length;
      const dp = Array.from({ length: numCarpets + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 1; i <= n; i++) {
        const white = floor[i - 1] === "1" ? 1 : 0;
        dp[0][i] = dp[0][i - 1] + white;
        for (let j = 1; j <= numCarpets; j++) {
          const skip = dp[j][i - 1] + white;
          const cover = i >= carpetLen ? dp[j - 1][i - carpetLen] : 0;
          dp[j][i] = Math.min(skip, cover);
        }
      }
      return dp[numCarpets][n];
    };
    return {
      slug: "minimum-white-tiles-after-covering-with-carpets",
      title: "Minimum White Tiles After Covering With Carpets",
      difficulty: "HARD" as const,
      tags: ["String", "Dynamic Programming", "Prefix Sum", "Amazon", "Google", "Uber"],
      signature: { funcName: "minimumWhiteTiles", params: [{ name: "floor", type: "string" as const }, { name: "numCarpets", type: "int" as const }, { name: "carpetLen", type: "int" as const }], returns: "int" as const },
      description: describe(
        "`floor[i]` is `'1'` for a white tile and `'0'` for a black one. You have `numCarpets` carpets, each covering exactly `carpetLen` consecutive tiles. Carpets may overlap and must not hang off either end.\n\nReturn the minimum number of white tiles still visible after placing the carpets.",
        [
          { in: 'floor = "10110101", numCarpets = 2, carpetLen = 2', out: "2" },
          { in: 'floor = "11111", numCarpets = 2, carpetLen = 3', out: "0", note: "Two carpets of length 3 cover all five tiles." },
          { in: 'floor = "10", numCarpets = 1, carpetLen = 1', out: "0" },
        ],
        ["1 <= carpetLen <= floor.length <= 1000", "floor[i] is '0' or '1'", "1 <= numCarpets <= 1000"]),
      hints: [
        "Decide, for each position from the right end backwards, whether a carpet **ends** there.",
        "`dp[j][i]` is the fewest white tiles visible among the first `i` tiles using at most `j` carpets.",
        "Either the `i`-th tile is left uncovered (add it if white) or a carpet covers `[i - carpetLen + 1, i]`.",
      ],
      editorial: explain({
        idea: "A two-dimensional DP over prefix length and carpets used. At each prefix end the only decision is whether a carpet finishes there, which makes the transition a simple two-way minimum.",
        steps: [
          "`dp[0][i]` is the number of white tiles in the first `i` tiles — no carpets available.",
          "For `j >= 1`, either skip the tile (`dp[j][i-1] + isWhite(i)`) or end a carpet at `i` (`dp[j-1][i - carpetLen]`, or 0 if the carpet covers the whole prefix).",
          "Take the smaller of the two; the answer is `dp[numCarpets][n]`.",
        ],
        why: "A carpet placement is fully described by where it ends, so scanning prefix ends enumerates every arrangement. Overlap costs nothing but never helps — the DP naturally avoids it, since a carpet that ends earlier covers at least as much new ground. Letting a carpet 'hang off' the front is handled by the 0 branch, which is correct because a carpet covering the whole remaining prefix leaves nothing visible.",
        time: "O(n · numCarpets)",
        space: "O(n · numCarpets)",
        pitfalls: [
          "A carpet may not extend past either end, which is what the `i >= carpetLen` guard and the 0 fallback encode.",
          "Deciding where carpets *start* rather than end makes the recurrence look forwards and is harder to write.",
          "`numCarpets` can exceed what is useful; the DP handles that without special-casing.",
        ],
      }),
      examples: [
        { input: '"10110101"\n2\n2', expectedOutput: "2" },
        { input: '"11111"\n2\n3', expectedOutput: "0" },
        { input: '"10"\n1\n1', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const floor = Array.from({ length: n }, () => (rng() < 0.5 ? "1" : "0")).join("");
        const carpetLen = ri(rng, 1, n);
        const numCarpets = ri(rng, 1, 6);
        return { input: `"${floor}"\n${numCarpets}\n${carpetLen}`, expectedOutput: String(ref(floor, numCarpets, carpetLen)) };
      },
      solutions: {
        python: `def minimumWhiteTiles(floor: str, numCarpets: int, carpetLen: int) -> int:\n    n = len(floor)\n    dp = [[0] * (n + 1) for _ in range(numCarpets + 1)]\n    for i in range(1, n + 1):\n        white = 1 if floor[i - 1] == "1" else 0\n        dp[0][i] = dp[0][i - 1] + white\n        for j in range(1, numCarpets + 1):\n            skip = dp[j][i - 1] + white\n            cover = dp[j - 1][i - carpetLen] if i >= carpetLen else 0\n            dp[j][i] = min(skip, cover)\n    return dp[numCarpets][n]`,
        javascript: `var minimumWhiteTiles = function(floor, numCarpets, carpetLen) {\n    var n = floor.length;\n    var dp = [];\n    for (var a = 0; a <= numCarpets; a++) {\n        var row = [];\n        for (var b = 0; b <= n; b++) row.push(0);\n        dp.push(row);\n    }\n    for (var i = 1; i <= n; i++) {\n        var white = floor.charAt(i - 1) === "1" ? 1 : 0;\n        dp[0][i] = dp[0][i - 1] + white;\n        for (var j = 1; j <= numCarpets; j++) {\n            var skip = dp[j][i - 1] + white;\n            var cover = i >= carpetLen ? dp[j - 1][i - carpetLen] : 0;\n            dp[j][i] = Math.min(skip, cover);\n        }\n    }\n    return dp[numCarpets][n];\n};`,
        typescript: `function minimumWhiteTiles(floor: string, numCarpets: number, carpetLen: number): number {\n    var n = floor.length;\n    var dp: number[][] = [];\n    for (var a = 0; a <= numCarpets; a++) {\n        var row: number[] = [];\n        for (var b = 0; b <= n; b++) row.push(0);\n        dp.push(row);\n    }\n    for (var i = 1; i <= n; i++) {\n        var white = floor.charAt(i - 1) === "1" ? 1 : 0;\n        dp[0][i] = dp[0][i - 1] + white;\n        for (var j = 1; j <= numCarpets; j++) {\n            var skip = dp[j][i - 1] + white;\n            var cover = i >= carpetLen ? dp[j - 1][i - carpetLen] : 0;\n            dp[j][i] = Math.min(skip, cover);\n        }\n    }\n    return dp[numCarpets][n];\n}`,
        java: `public static int minimumWhiteTiles(String floor, int numCarpets, int carpetLen) {\n    int n = floor.length();\n    int[][] dp = new int[numCarpets + 1][n + 1];\n    for (int i = 1; i <= n; i++) {\n        int white = floor.charAt(i - 1) == '1' ? 1 : 0;\n        dp[0][i] = dp[0][i - 1] + white;\n        for (int j = 1; j <= numCarpets; j++) {\n            int skip = dp[j][i - 1] + white;\n            int cover = i >= carpetLen ? dp[j - 1][i - carpetLen] : 0;\n            dp[j][i] = Math.min(skip, cover);\n        }\n    }\n    return dp[numCarpets][n];\n}`,
        cpp: `int minimumWhiteTiles(string floor, int numCarpets, int carpetLen) {\n    int n = (int) floor.size();\n    vector<vector<int>> dp(numCarpets + 1, vector<int>(n + 1, 0));\n    for (int i = 1; i <= n; i++) {\n        int white = floor[i - 1] == '1' ? 1 : 0;\n        dp[0][i] = dp[0][i - 1] + white;\n        for (int j = 1; j <= numCarpets; j++) {\n            int skip = dp[j][i - 1] + white;\n            int cover = i >= carpetLen ? dp[j - 1][i - carpetLen] : 0;\n            dp[j][i] = min(skip, cover);\n        }\n    }\n    return dp[numCarpets][n];\n}`,
        c: `int minimumWhiteTiles(char* floor, int numCarpets, int carpetLen) {\n    int n = (int) strlen(floor);\n    int w = n + 1;\n    int* dp = (int*) calloc((size_t) (numCarpets + 1) * (size_t) w, sizeof(int));\n    for (int i = 1; i <= n; i++) {\n        int white = floor[i - 1] == '1' ? 1 : 0;\n        dp[0 * w + i] = dp[0 * w + (i - 1)] + white;\n        for (int j = 1; j <= numCarpets; j++) {\n            int skip = dp[j * w + (i - 1)] + white;\n            int cover = i >= carpetLen ? dp[(j - 1) * w + (i - carpetLen)] : 0;\n            dp[j * w + i] = skip < cover ? skip : cover;\n        }\n    }\n    int ans = dp[numCarpets * w + n];\n    free(dp);\n    return ans;\n}`,
        csharp: `public static int MinimumWhiteTiles(string floor, int numCarpets, int carpetLen)\n{\n    int n = floor.Length;\n    int[,] dp = new int[numCarpets + 1, n + 1];\n    for (int i = 1; i <= n; i++)\n    {\n        int white = floor[i - 1] == '1' ? 1 : 0;\n        dp[0, i] = dp[0, i - 1] + white;\n        for (int j = 1; j <= numCarpets; j++)\n        {\n            int skip = dp[j, i - 1] + white;\n            int cover = i >= carpetLen ? dp[j - 1, i - carpetLen] : 0;\n            dp[j, i] = Math.Min(skip, cover);\n        }\n    }\n    return dp[numCarpets, n];\n}`,
        go: `func minimumWhiteTiles(floor string, numCarpets int, carpetLen int) int {\n\tn := len(floor)\n\tdp := make([][]int, numCarpets+1)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, n+1)\n\t}\n\tfor i := 1; i <= n; i++ {\n\t\twhite := 0\n\t\tif floor[i-1] == '1' {\n\t\t\twhite = 1\n\t\t}\n\t\tdp[0][i] = dp[0][i-1] + white\n\t\tfor j := 1; j <= numCarpets; j++ {\n\t\t\tskip := dp[j][i-1] + white\n\t\t\tcover := 0\n\t\t\tif i >= carpetLen {\n\t\t\t\tcover = dp[j-1][i-carpetLen]\n\t\t\t}\n\t\t\tif skip < cover {\n\t\t\t\tdp[j][i] = skip\n\t\t\t} else {\n\t\t\t\tdp[j][i] = cover\n\t\t\t}\n\t\t}\n\t}\n\treturn dp[numCarpets][n]\n}`,
        kotlin: `fun minimumWhiteTiles(floor: String, numCarpets: Int, carpetLen: Int): Int {\n    val n = floor.length\n    val dp = Array(numCarpets + 1) { IntArray(n + 1) }\n    for (i in 1..n) {\n        val white = if (floor[i - 1] == '1') 1 else 0\n        dp[0][i] = dp[0][i - 1] + white\n        for (j in 1..numCarpets) {\n            val skip = dp[j][i - 1] + white\n            val cover = if (i >= carpetLen) dp[j - 1][i - carpetLen] else 0\n            dp[j][i] = minOf(skip, cover)\n        }\n    }\n    return dp[numCarpets][n]\n}`,
        swift: `func minimumWhiteTiles(_ floor: String, _ numCarpets: Int, _ carpetLen: Int) -> Int {\n    let a = Array(floor)\n    let n = a.count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: numCarpets + 1)\n    for i in 1...n {\n        let white = a[i - 1] == "1" ? 1 : 0\n        dp[0][i] = dp[0][i - 1] + white\n        for j in 1...numCarpets {\n            let skip = dp[j][i - 1] + white\n            let cover = i >= carpetLen ? dp[j - 1][i - carpetLen] : 0\n            dp[j][i] = min(skip, cover)\n        }\n    }\n    return dp[numCarpets][n]\n}`,
        rust: `fn minimumWhiteTiles(floor: String, numCarpets: i32, carpetLen: i32) -> i32 {\n    let b = floor.as_bytes();\n    let n = b.len();\n    let nc = numCarpets as usize;\n    let cl = carpetLen as usize;\n    let mut dp = vec![vec![0i32; n + 1]; nc + 1];\n    for i in 1..=n {\n        let white = if b[i - 1] == b'1' { 1 } else { 0 };\n        dp[0][i] = dp[0][i - 1] + white;\n        for j in 1..=nc {\n            let skip = dp[j][i - 1] + white;\n            let cover = if i >= cl { dp[j - 1][i - cl] } else { 0 };\n            dp[j][i] = std::cmp::min(skip, cover);\n        }\n    }\n    dp[nc][n]\n}`,
        php: `function minimumWhiteTiles($floor, $numCarpets, $carpetLen) {\n    $n = strlen($floor);\n    $dp = [];\n    for ($j = 0; $j <= $numCarpets; $j++) $dp[$j] = array_fill(0, $n + 1, 0);\n    for ($i = 1; $i <= $n; $i++) {\n        $white = $floor[$i - 1] === "1" ? 1 : 0;\n        $dp[0][$i] = $dp[0][$i - 1] + $white;\n        for ($j = 1; $j <= $numCarpets; $j++) {\n            $skip = $dp[$j][$i - 1] + $white;\n            $cover = $i >= $carpetLen ? $dp[$j - 1][$i - $carpetLen] : 0;\n            $dp[$j][$i] = min($skip, $cover);\n        }\n    }\n    return $dp[$numCarpets][$n];\n}`,
        ruby: `def minimumWhiteTiles(floor, numCarpets, carpetLen)\n  n = floor.length\n  dp = Array.new(numCarpets + 1) { Array.new(n + 1, 0) }\n  (1..n).each do |i|\n    white = floor[i - 1] == "1" ? 1 : 0\n    dp[0][i] = dp[0][i - 1] + white\n    (1..numCarpets).each do |j|\n      skip = dp[j][i - 1] + white\n      cover = i >= carpetLen ? dp[j - 1][i - carpetLen] : 0\n      dp[j][i] = [skip, cover].min\n    end\n  end\n  dp[numCarpets][n]\nend`,
      },
    };
  })(),

  // ── Minimum Cost to Cut a Stick (LC 1547) ───────────────────────
  (() => {
    const ref = (n: number, cuts: number[]) => {
      const pts = [0].concat(cuts.slice().sort((a, b) => a - b)).concat([n]);
      const m = pts.length;
      const dp = Array.from({ length: m }, () => new Array(m).fill(0));
      for (let len = 2; len < m; len++) {
        for (let i = 0; i + len < m; i++) {
          const j = i + len;
          let best = Infinity;
          for (let k = i + 1; k < j; k++) {
            const v = dp[i][k] + dp[k][j];
            if (v < best) best = v;
          }
          dp[i][j] = best + pts[j] - pts[i];
        }
      }
      return dp[0][m - 1];
    };
    return {
      slug: "minimum-cost-to-cut-a-stick",
      title: "Minimum Cost to Cut a Stick",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Sorting", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "minCost", params: [{ name: "n", type: "int" as const }, { name: "cuts", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A stick of length `n` is marked at the positions in `cuts`. Cutting a stick costs the **length of the stick being cut**, and after a cut the two pieces are cut independently.\n\nYou may perform the cuts in any order. Return the minimum total cost.",
        [
          { in: "n = 7, cuts = [1,3,4,5]", out: "16", note: "Cutting in the order 3, 5, 1, 4 costs 7 + 4 + 3 + 2." },
          { in: "n = 9, cuts = [5,6,1,4,2]", out: "22" },
          { in: "n = 5, cuts = [2]", out: "5", note: "One cut on the whole stick." },
        ],
        ["2 <= n <= 1000000", "1 <= cuts.length <= 100", "1 <= cuts[i] <= n - 1", "All values in cuts are distinct."]),
      hints: [
        "Sort the cut positions and add the two stick ends, 0 and `n`, as sentinels.",
        "`dp[i][j]` is the cost of fully cutting the piece between sentinel positions `i` and `j`.",
        "Choose which cut inside that piece is made **first**: it costs the piece's length and splits the work in two.",
      ],
      editorial: explain({
        idea: "Interval DP over the sorted cut positions. Once a piece is isolated, the cuts inside it never interact with anything outside — so deciding which of its cuts happens first splits the problem cleanly.",
        steps: [
          "Build `pts = [0] + sorted(cuts) + [n]`.",
          "`dp[i][j]` is the minimum cost to make every cut strictly between `pts[i]` and `pts[j]`.",
          "For each `k` in `(i, j)`, cutting at `pts[k]` first costs `pts[j] - pts[i]` plus `dp[i][k] + dp[k][j]`.",
          "Fill by increasing interval length; the answer is `dp[0][m-1]`.",
        ],
        why: "The cost of any single cut is the length of the piece it lands on, which depends only on the two nearest cuts already made on either side — exactly the interval boundaries. So fixing the first cut inside an interval makes the two halves independent, which is what licenses the DP. Adding the sentinels removes the need to special-case the stick's ends.",
        time: "O(m³) where m is the number of cuts",
        space: "O(m²)",
        pitfalls: [
          "Choosing which cut is made *last* does not decompose — the piece's length would then depend on cuts outside the interval.",
          "The cuts must be sorted; the input order is arbitrary.",
          "A greedy 'always cut in the middle' is wrong.",
        ],
      }),
      examples: [
        { input: "7\n[1,3,4,5]", expectedOutput: "16" },
        { input: "9\n[5,6,1,4,2]", expectedOutput: "22" },
        { input: "5\n[2]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, rng() < 0.6 ? 40 : 1000000);
        const seen: Record<number, boolean> = {};
        const cuts: number[] = [];
        const want = ri(rng, 1, Math.min(10, n - 1));
        let guard = 0;
        while (cuts.length < want && guard < 300) {
          guard++;
          const c = ri(rng, 1, n - 1);
          if (!seen[c]) { seen[c] = true; cuts.push(c); }
        }
        return { input: `${n}\n${fmtIntArr(cuts)}`, expectedOutput: String(ref(n, cuts)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minCost(n: int, cuts: List[int]) -> int:\n    pts = [0] + sorted(cuts) + [n]\n    m = len(pts)\n    dp = [[0] * m for _ in range(m)]\n    for length in range(2, m):\n        for i in range(m - length):\n            j = i + length\n            best = min(dp[i][k] + dp[k][j] for k in range(i + 1, j))\n            dp[i][j] = best + pts[j] - pts[i]\n    return dp[0][m - 1]`,
        javascript: `var minCost = function(n, cuts) {\n    var pts = [0].concat(cuts.slice().sort(function(a, b) { return a - b; })).concat([n]);\n    var m = pts.length;\n    var dp = [];\n    for (var a = 0; a < m; a++) {\n        var row = [];\n        for (var b = 0; b < m; b++) row.push(0);\n        dp.push(row);\n    }\n    for (var len = 2; len < m; len++) {\n        for (var i = 0; i + len < m; i++) {\n            var j = i + len;\n            var best = Infinity;\n            for (var k = i + 1; k < j; k++) {\n                var v = dp[i][k] + dp[k][j];\n                if (v < best) best = v;\n            }\n            dp[i][j] = best + pts[j] - pts[i];\n        }\n    }\n    return dp[0][m - 1];\n};`,
        typescript: `function minCost(n: number, cuts: number[]): number {\n    var pts = [0].concat(cuts.slice().sort(function(a, b) { return a - b; })).concat([n]);\n    var m = pts.length;\n    var dp: number[][] = [];\n    for (var a = 0; a < m; a++) {\n        var row: number[] = [];\n        for (var b = 0; b < m; b++) row.push(0);\n        dp.push(row);\n    }\n    for (var len = 2; len < m; len++) {\n        for (var i = 0; i + len < m; i++) {\n            var j = i + len;\n            var best = Infinity;\n            for (var k = i + 1; k < j; k++) {\n                var v = dp[i][k] + dp[k][j];\n                if (v < best) best = v;\n            }\n            dp[i][j] = best + pts[j] - pts[i];\n        }\n    }\n    return dp[0][m - 1];\n}`,
        java: `public static int minCost(int n, int[] cuts) {\n    int[] sorted = cuts.clone();\n    Arrays.sort(sorted);\n    int m = sorted.length + 2;\n    int[] pts = new int[m];\n    pts[0] = 0;\n    pts[m - 1] = n;\n    for (int i = 0; i < sorted.length; i++) pts[i + 1] = sorted[i];\n    int[][] dp = new int[m][m];\n    for (int len = 2; len < m; len++) {\n        for (int i = 0; i + len < m; i++) {\n            int j = i + len;\n            int best = Integer.MAX_VALUE;\n            for (int k = i + 1; k < j; k++) best = Math.min(best, dp[i][k] + dp[k][j]);\n            dp[i][j] = best + pts[j] - pts[i];\n        }\n    }\n    return dp[0][m - 1];\n}`,
        cpp: `int minCost(int n, vector<int>& cuts) {\n    vector<int> pts;\n    pts.push_back(0);\n    vector<int> sorted = cuts;\n    sort(sorted.begin(), sorted.end());\n    for (int c : sorted) pts.push_back(c);\n    pts.push_back(n);\n    int m = (int) pts.size();\n    vector<vector<int>> dp(m, vector<int>(m, 0));\n    for (int len = 2; len < m; len++) {\n        for (int i = 0; i + len < m; i++) {\n            int j = i + len;\n            int best = INT_MAX;\n            for (int k = i + 1; k < j; k++) best = min(best, dp[i][k] + dp[k][j]);\n            dp[i][j] = best + pts[j] - pts[i];\n        }\n    }\n    return dp[0][m - 1];\n}`,
        c: `static int cmpCutAsc(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint minCost(int n, int* cuts, int cutsSize) {\n    int m = cutsSize + 2;\n    int* pts = (int*) malloc((size_t) m * sizeof(int));\n    for (int i = 0; i < cutsSize; i++) pts[i + 1] = cuts[i];\n    qsort(pts + 1, (size_t) cutsSize, sizeof(int), cmpCutAsc);\n    pts[0] = 0;\n    pts[m - 1] = n;\n    int* dp = (int*) calloc((size_t) m * (size_t) m, sizeof(int));\n    for (int len = 2; len < m; len++) {\n        for (int i = 0; i + len < m; i++) {\n            int j = i + len;\n            int best = 2147483647;\n            for (int k = i + 1; k < j; k++) {\n                int v = dp[i * m + k] + dp[k * m + j];\n                if (v < best) best = v;\n            }\n            dp[i * m + j] = best + pts[j] - pts[i];\n        }\n    }\n    int ans = dp[0 * m + (m - 1)];\n    free(pts);\n    free(dp);\n    return ans;\n}`,
        csharp: `public static int MinCost(int n, int[] cuts)\n{\n    int[] sorted = (int[]) cuts.Clone();\n    Array.Sort(sorted);\n    int m = sorted.Length + 2;\n    int[] pts = new int[m];\n    pts[0] = 0;\n    pts[m - 1] = n;\n    for (int i = 0; i < sorted.Length; i++) pts[i + 1] = sorted[i];\n    int[,] dp = new int[m, m];\n    for (int len = 2; len < m; len++)\n    {\n        for (int i = 0; i + len < m; i++)\n        {\n            int j = i + len;\n            int best = int.MaxValue;\n            for (int k = i + 1; k < j; k++)\n            {\n                int v = dp[i, k] + dp[k, j];\n                if (v < best) best = v;\n            }\n            dp[i, j] = best + pts[j] - pts[i];\n        }\n    }\n    return dp[0, m - 1];\n}`,
        go: `func minCost(n int, cuts []int) int {\n\tsorted := append([]int{}, cuts...)\n\tsort.Ints(sorted)\n\tpts := append([]int{0}, sorted...)\n\tpts = append(pts, n)\n\tm := len(pts)\n\tdp := make([][]int, m)\n\tfor i := range dp {\n\t\tdp[i] = make([]int, m)\n\t}\n\tfor length := 2; length < m; length++ {\n\t\tfor i := 0; i+length < m; i++ {\n\t\t\tj := i + length\n\t\t\tbest := 1 << 60\n\t\t\tfor k := i + 1; k < j; k++ {\n\t\t\t\tv := dp[i][k] + dp[k][j]\n\t\t\t\tif v < best {\n\t\t\t\t\tbest = v\n\t\t\t\t}\n\t\t\t}\n\t\t\tdp[i][j] = best + pts[j] - pts[i]\n\t\t}\n\t}\n\treturn dp[0][m-1]\n}`,
        kotlin: `fun minCost(n: Int, cuts: IntArray): Int {\n    val sorted = cuts.sortedArray()\n    val m = sorted.size + 2\n    val pts = IntArray(m)\n    pts[0] = 0\n    pts[m - 1] = n\n    for (i in sorted.indices) pts[i + 1] = sorted[i]\n    val dp = Array(m) { IntArray(m) }\n    for (len in 2 until m) {\n        for (i in 0 until m - len) {\n            val j = i + len\n            var best = Int.MAX_VALUE\n            for (k in i + 1 until j) best = minOf(best, dp[i][k] + dp[k][j])\n            dp[i][j] = best + pts[j] - pts[i]\n        }\n    }\n    return dp[0][m - 1]\n}`,
        swift: `func minCost(_ n: Int, _ cuts: [Int]) -> Int {\n    var pts = [0] + cuts.sorted() + [n]\n    let m = pts.count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: m), count: m)\n    if m >= 3 {\n        for len in 2..<m {\n            for i in 0..<(m - len) {\n                let j = i + len\n                var best = Int.max\n                for k in (i + 1)..<j {\n                    let v = dp[i][k] + dp[k][j]\n                    if v < best { best = v }\n                }\n                dp[i][j] = best + pts[j] - pts[i]\n            }\n        }\n    }\n    return dp[0][m - 1]\n}`,
        rust: `fn minCost(n: i32, cuts: Vec<i32>) -> i32 {\n    let mut sorted = cuts.clone();\n    sorted.sort();\n    let mut pts: Vec<i32> = vec![0];\n    pts.extend(sorted.iter());\n    pts.push(n);\n    let m = pts.len();\n    let mut dp = vec![vec![0i32; m]; m];\n    for len in 2..m {\n        for i in 0..(m - len) {\n            let j = i + len;\n            let mut best = i32::MAX;\n            for k in (i + 1)..j {\n                let v = dp[i][k] + dp[k][j];\n                if v < best {\n                    best = v;\n                }\n            }\n            dp[i][j] = best + pts[j] - pts[i];\n        }\n    }\n    dp[0][m - 1]\n}`,
        php: `function minCost($n, $cuts) {\n    $sorted = $cuts;\n    sort($sorted);\n    $pts = array_merge([0], $sorted, [$n]);\n    $m = count($pts);\n    $dp = [];\n    for ($i = 0; $i < $m; $i++) $dp[$i] = array_fill(0, $m, 0);\n    for ($len = 2; $len < $m; $len++) {\n        for ($i = 0; $i + $len < $m; $i++) {\n            $j = $i + $len;\n            $best = PHP_INT_MAX;\n            for ($k = $i + 1; $k < $j; $k++) {\n                $v = $dp[$i][$k] + $dp[$k][$j];\n                if ($v < $best) $best = $v;\n            }\n            $dp[$i][$j] = $best + $pts[$j] - $pts[$i];\n        }\n    }\n    return $dp[0][$m - 1];\n}`,
        ruby: `def minCost(n, cuts)\n  pts = [0] + cuts.sort + [n]\n  m = pts.length\n  dp = Array.new(m) { Array.new(m, 0) }\n  (2...m).each do |len|\n    (0...(m - len)).each do |i|\n      j = i + len\n      best = Float::INFINITY\n      ((i + 1)...j).each do |k|\n        v = dp[i][k] + dp[k][j]\n        best = v if v < best\n      end\n      dp[i][j] = best + pts[j] - pts[i]\n    end\n  end\n  dp[0][m - 1]\nend`,
      },
    };
  })(),

  // ── Minimum Difficulty of a Job Schedule (LC 1335) ──────────────
  (() => {
    const INF = 1000000000;
    const ref = (jobDifficulty: number[], d: number) => {
      const n = jobDifficulty.length;
      if (n < d) return -1;
      let prev = new Array(n + 1).fill(INF);
      prev[0] = 0;
      for (let day = 1; day <= d; day++) {
        const cur = new Array(n + 1).fill(INF);
        for (let i = day; i <= n; i++) {
          let mx = 0;
          for (let j = i; j >= day; j--) {
            if (jobDifficulty[j - 1] > mx) mx = jobDifficulty[j - 1];
            if (prev[j - 1] < INF && prev[j - 1] + mx < cur[i]) cur[i] = prev[j - 1] + mx;
          }
        }
        prev = cur;
      }
      return prev[n];
    };
    return {
      slug: "minimum-difficulty-of-a-job-schedule",
      title: "Minimum Difficulty of a Job Schedule",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Adobe"],
      signature: { funcName: "minDifficulty", params: [{ name: "jobDifficulty", type: "int[]" as const }, { name: "d", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Jobs must be done **in order** over exactly `d` days, with at least one job each day. A day's difficulty is the maximum difficulty among the jobs done that day, and the schedule's difficulty is the sum over the days.\n\nReturn the minimum possible schedule difficulty, or `-1` if there are fewer jobs than days.",
        [
          { in: "jobDifficulty = [6,5,4,3,2,1], d = 2", out: "7", note: "Day 1 takes the first five jobs (difficulty 6), day 2 takes the last (difficulty 1)." },
          { in: "jobDifficulty = [9,9,9], d = 4", out: "-1", note: "Not enough jobs to fill four days." },
          { in: "jobDifficulty = [1,1,1], d = 3", out: "3" },
        ],
        ["1 <= jobDifficulty.length <= 300", "0 <= jobDifficulty[i] <= 1000", "1 <= d <= 10"]),
      hints: [
        "Jobs stay in order, so a schedule is just a way to cut the array into `d` contiguous blocks.",
        "`dp[day][i]` is the best difficulty for the first `i` jobs using `day` days.",
        "Extend backwards from `i`, tracking the running maximum of the last block as it grows.",
      ],
      editorial: explain({
        idea: "A partition DP. The only choice is where each day's block starts, and sweeping that start backwards lets the block's maximum be maintained incrementally instead of recomputed.",
        steps: [
          "Return `-1` immediately when there are fewer jobs than days.",
          "`dp[day][i]` is the minimum difficulty of scheduling the first `i` jobs in `day` days; `dp[0][0] = 0`.",
          "For each `i`, walk `j` from `i` down to `day`, growing the running maximum of `jobDifficulty[j-1 … i-1]`, and take `dp[day-1][j-1] + max`.",
          "The answer is `dp[d][n]`.",
        ],
        why: "Because jobs cannot be reordered, every schedule is a partition into `d` contiguous non-empty blocks — so enumerating the last block's start covers all of them. Sweeping `j` downwards means each new `j` only extends the block leftwards by one job, so the maximum updates in constant time and the inner loop stays linear.",
        time: "O(d · n²)",
        space: "O(n)",
        pitfalls: [
          "Each day needs at least one job, which is what the `j >= day` bound enforces.",
          "Recomputing the block maximum from scratch makes the inner loop quadratic and the whole thing `O(d · n³)`.",
          "A greedy split by equal totals is wrong — the objective is a sum of maxima, not of sums.",
        ],
      }),
      examples: [
        { input: "[6,5,4,3,2,1]\n2", expectedOutput: "7" },
        { input: "[9,9,9]\n4", expectedOutput: "-1" },
        { input: "[1,1,1]\n3", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20);
        const jobDifficulty = Array.from({ length: n }, () => ri(rng, 0, 1000));
        const d = ri(rng, 1, 10);
        return { input: `${fmtIntArr(jobDifficulty)}\n${d}`, expectedOutput: String(ref(jobDifficulty, d)) };
      },
      solutions: {
        python: `from typing import List\n\ndef minDifficulty(jobDifficulty: List[int], d: int) -> int:\n    n = len(jobDifficulty)\n    if n < d:\n        return -1\n    INF = 10 ** 9\n    prev = [INF] * (n + 1)\n    prev[0] = 0\n    for day in range(1, d + 1):\n        cur = [INF] * (n + 1)\n        for i in range(day, n + 1):\n            mx = 0\n            for j in range(i, day - 1, -1):\n                mx = max(mx, jobDifficulty[j - 1])\n                if prev[j - 1] < INF:\n                    cur[i] = min(cur[i], prev[j - 1] + mx)\n        prev = cur\n    return prev[n]`,
        javascript: `var minDifficulty = function(jobDifficulty, d) {\n    var INF = 1000000000;\n    var n = jobDifficulty.length;\n    if (n < d) return -1;\n    var prev = [], t;\n    for (t = 0; t <= n; t++) prev.push(INF);\n    prev[0] = 0;\n    for (var day = 1; day <= d; day++) {\n        var cur = [];\n        for (t = 0; t <= n; t++) cur.push(INF);\n        for (var i = day; i <= n; i++) {\n            var mx = 0;\n            for (var j = i; j >= day; j--) {\n                if (jobDifficulty[j - 1] > mx) mx = jobDifficulty[j - 1];\n                if (prev[j - 1] < INF && prev[j - 1] + mx < cur[i]) cur[i] = prev[j - 1] + mx;\n            }\n        }\n        prev = cur;\n    }\n    return prev[n];\n};`,
        typescript: `function minDifficulty(jobDifficulty: number[], d: number): number {\n    var INF = 1000000000;\n    var n = jobDifficulty.length;\n    if (n < d) return -1;\n    var prev: number[] = [], t: number;\n    for (t = 0; t <= n; t++) prev.push(INF);\n    prev[0] = 0;\n    for (var day = 1; day <= d; day++) {\n        var cur: number[] = [];\n        for (t = 0; t <= n; t++) cur.push(INF);\n        for (var i = day; i <= n; i++) {\n            var mx = 0;\n            for (var j = i; j >= day; j--) {\n                if (jobDifficulty[j - 1] > mx) mx = jobDifficulty[j - 1];\n                if (prev[j - 1] < INF && prev[j - 1] + mx < cur[i]) cur[i] = prev[j - 1] + mx;\n            }\n        }\n        prev = cur;\n    }\n    return prev[n];\n}`,
        java: `public static int minDifficulty(int[] jobDifficulty, int d) {\n    final int INF = 1000000000;\n    int n = jobDifficulty.length;\n    if (n < d) return -1;\n    int[] prev = new int[n + 1];\n    Arrays.fill(prev, INF);\n    prev[0] = 0;\n    for (int day = 1; day <= d; day++) {\n        int[] cur = new int[n + 1];\n        Arrays.fill(cur, INF);\n        for (int i = day; i <= n; i++) {\n            int mx = 0;\n            for (int j = i; j >= day; j--) {\n                mx = Math.max(mx, jobDifficulty[j - 1]);\n                if (prev[j - 1] < INF) cur[i] = Math.min(cur[i], prev[j - 1] + mx);\n            }\n        }\n        prev = cur;\n    }\n    return prev[n];\n}`,
        cpp: `int minDifficulty(vector<int>& jobDifficulty, int d) {\n    const int INF = 1000000000;\n    int n = (int) jobDifficulty.size();\n    if (n < d) return -1;\n    vector<int> prev(n + 1, INF);\n    prev[0] = 0;\n    for (int day = 1; day <= d; day++) {\n        vector<int> cur(n + 1, INF);\n        for (int i = day; i <= n; i++) {\n            int mx = 0;\n            for (int j = i; j >= day; j--) {\n                mx = max(mx, jobDifficulty[j - 1]);\n                if (prev[j - 1] < INF) cur[i] = min(cur[i], prev[j - 1] + mx);\n            }\n        }\n        prev = cur;\n    }\n    return prev[n];\n}`,
        c: `int minDifficulty(int* jobDifficulty, int jobDifficultySize, int d) {\n    const int INF = 1000000000;\n    int n = jobDifficultySize;\n    if (n < d) return -1;\n    int* prev = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    int* cur = (int*) malloc((size_t) (n + 1) * sizeof(int));\n    for (int i = 0; i <= n; i++) prev[i] = INF;\n    prev[0] = 0;\n    for (int day = 1; day <= d; day++) {\n        for (int i = 0; i <= n; i++) cur[i] = INF;\n        for (int i = day; i <= n; i++) {\n            int mx = 0;\n            for (int j = i; j >= day; j--) {\n                if (jobDifficulty[j - 1] > mx) mx = jobDifficulty[j - 1];\n                if (prev[j - 1] < INF && prev[j - 1] + mx < cur[i]) cur[i] = prev[j - 1] + mx;\n            }\n        }\n        for (int i = 0; i <= n; i++) prev[i] = cur[i];\n    }\n    int ans = prev[n];\n    free(prev);\n    free(cur);\n    return ans;\n}`,
        csharp: `public static int MinDifficulty(int[] jobDifficulty, int d)\n{\n    const int INF = 1000000000;\n    int n = jobDifficulty.Length;\n    if (n < d) return -1;\n    int[] prev = new int[n + 1];\n    for (int i = 0; i <= n; i++) prev[i] = INF;\n    prev[0] = 0;\n    for (int day = 1; day <= d; day++)\n    {\n        int[] cur = new int[n + 1];\n        for (int i = 0; i <= n; i++) cur[i] = INF;\n        for (int i = day; i <= n; i++)\n        {\n            int mx = 0;\n            for (int j = i; j >= day; j--)\n            {\n                if (jobDifficulty[j - 1] > mx) mx = jobDifficulty[j - 1];\n                if (prev[j - 1] < INF && prev[j - 1] + mx < cur[i]) cur[i] = prev[j - 1] + mx;\n            }\n        }\n        prev = cur;\n    }\n    return prev[n];\n}`,
        go: `func minDifficulty(jobDifficulty []int, d int) int {\n\tconst INF = 1000000000\n\tn := len(jobDifficulty)\n\tif n < d {\n\t\treturn -1\n\t}\n\tprev := make([]int, n+1)\n\tfor i := range prev {\n\t\tprev[i] = INF\n\t}\n\tprev[0] = 0\n\tfor day := 1; day <= d; day++ {\n\t\tcur := make([]int, n+1)\n\t\tfor i := range cur {\n\t\t\tcur[i] = INF\n\t\t}\n\t\tfor i := day; i <= n; i++ {\n\t\t\tmx := 0\n\t\t\tfor j := i; j >= day; j-- {\n\t\t\t\tif jobDifficulty[j-1] > mx {\n\t\t\t\t\tmx = jobDifficulty[j-1]\n\t\t\t\t}\n\t\t\t\tif prev[j-1] < INF && prev[j-1]+mx < cur[i] {\n\t\t\t\t\tcur[i] = prev[j-1] + mx\n\t\t\t\t}\n\t\t\t}\n\t\t}\n\t\tprev = cur\n\t}\n\treturn prev[n]\n}`,
        kotlin: `fun minDifficulty(jobDifficulty: IntArray, d: Int): Int {\n    val INF = 1000000000\n    val n = jobDifficulty.size\n    if (n < d) return -1\n    var prev = IntArray(n + 1) { INF }\n    prev[0] = 0\n    for (day in 1..d) {\n        val cur = IntArray(n + 1) { INF }\n        for (i in day..n) {\n            var mx = 0\n            for (j in i downTo day) {\n                if (jobDifficulty[j - 1] > mx) mx = jobDifficulty[j - 1]\n                if (prev[j - 1] < INF && prev[j - 1] + mx < cur[i]) cur[i] = prev[j - 1] + mx\n            }\n        }\n        prev = cur\n    }\n    return prev[n]\n}`,
        swift: `func minDifficulty(_ jobDifficulty: [Int], _ d: Int) -> Int {\n    let INF = 1000000000\n    let n = jobDifficulty.count\n    if n < d { return -1 }\n    var prev = [Int](repeating: INF, count: n + 1)\n    prev[0] = 0\n    for day in 1...d {\n        var cur = [Int](repeating: INF, count: n + 1)\n        var i = day\n        while i <= n {\n            var mx = 0\n            var j = i\n            while j >= day {\n                if jobDifficulty[j - 1] > mx { mx = jobDifficulty[j - 1] }\n                if prev[j - 1] < INF && prev[j - 1] + mx < cur[i] { cur[i] = prev[j - 1] + mx }\n                j -= 1\n            }\n            i += 1\n        }\n        prev = cur\n    }\n    return prev[n]\n}`,
        rust: `fn minDifficulty(jobDifficulty: Vec<i32>, d: i32) -> i32 {\n    const INF: i32 = 1000000000;\n    let n = jobDifficulty.len();\n    if (n as i32) < d {\n        return -1;\n    }\n    let mut prev = vec![INF; n + 1];\n    prev[0] = 0;\n    for day in 1..=(d as usize) {\n        let mut cur = vec![INF; n + 1];\n        for i in day..=n {\n            let mut mx = 0i32;\n            let mut j = i;\n            while j >= day {\n                if jobDifficulty[j - 1] > mx {\n                    mx = jobDifficulty[j - 1];\n                }\n                if prev[j - 1] < INF && prev[j - 1] + mx < cur[i] {\n                    cur[i] = prev[j - 1] + mx;\n                }\n                j -= 1;\n            }\n        }\n        prev = cur;\n    }\n    prev[n]\n}`,
        php: `function minDifficulty($jobDifficulty, $d) {\n    $INF = 1000000000;\n    $n = count($jobDifficulty);\n    if ($n < $d) return -1;\n    $prev = array_fill(0, $n + 1, $INF);\n    $prev[0] = 0;\n    for ($day = 1; $day <= $d; $day++) {\n        $cur = array_fill(0, $n + 1, $INF);\n        for ($i = $day; $i <= $n; $i++) {\n            $mx = 0;\n            for ($j = $i; $j >= $day; $j--) {\n                if ($jobDifficulty[$j - 1] > $mx) $mx = $jobDifficulty[$j - 1];\n                if ($prev[$j - 1] < $INF && $prev[$j - 1] + $mx < $cur[$i]) $cur[$i] = $prev[$j - 1] + $mx;\n            }\n        }\n        $prev = $cur;\n    }\n    return $prev[$n];\n}`,
        ruby: `def minDifficulty(jobDifficulty, d)\n  inf = 1000000000\n  n = jobDifficulty.length\n  return -1 if n < d\n  prev = Array.new(n + 1, inf)\n  prev[0] = 0\n  (1..d).each do |day|\n    cur = Array.new(n + 1, inf)\n    (day..n).each do |i|\n      mx = 0\n      i.downto(day) do |j|\n        mx = jobDifficulty[j - 1] if jobDifficulty[j - 1] > mx\n        cur[i] = prev[j - 1] + mx if prev[j - 1] < inf && prev[j - 1] + mx < cur[i]\n      end\n    end\n    prev = cur\n  end\n  prev[n]\nend`,
      },
    };
  })(),
];
