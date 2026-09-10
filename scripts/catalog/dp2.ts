/**
 * Dynamic programming, second wave — the DP questions that actually come up in
 * Amazon, Google, Microsoft and Meta loops: the stock series, the knapsack
 * variants, the grid and sequence recurrences. Company names ride in `tags`.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, fmtIntArr, fmtIntMat, fmtStrArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

const randArr = (rng: Rng, n: number, lo: number, hi: number) =>
  Array.from({ length: n }, () => ri(rng, lo, hi));

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const randStr = (rng: Rng, lo: number, hi: number, alphabet = LOWER) =>
  Array.from({ length: ri(rng, lo, hi) }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");

export const DP2_PROBLEMS: CatalogProblem[] = [

  // ── Delete and Earn ─────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let maxV = 0;
      for (let i = 0; i < nums.length; i++) if (nums[i] > maxV) maxV = nums[i];
      const points = new Array(maxV + 1).fill(0);
      for (let i = 0; i < nums.length; i++) points[nums[i]] += nums[i];
      let take = 0, skip = 0;
      for (let v = 1; v <= maxV; v++) {
        const newTake = skip + points[v];
        const newSkip = Math.max(skip, take);
        take = newTake;
        skip = newSkip;
      }
      return Math.max(take, skip);
    };
    return {
      slug: "delete-and-earn",
      title: "Delete and Earn",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Amazon", "Google", "Adobe"],
      signature: { funcName: "deleteAndEarn", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums`. You want to maximise the points you earn by repeatedly doing this:\n\n- Pick any `nums[i]` and earn `nums[i]` points. You must then delete **every** element equal to `nums[i] - 1` and every element equal to `nums[i] + 1`.\n\nReturn the maximum number of points you can earn.",
        [
          { in: "nums = [3,4,2]", out: "6", note: "Take 4 (earning 4), which deletes the 3; then take 2." },
          { in: "nums = [2,2,3,3,3,4]", out: "9", note: "Take the three 3s for 9; the 2s and the 4 are deleted." },
          { in: "nums = [1]", out: "1" },
        ],
        ["1 <= nums.length <= 40", "1 <= nums[i] <= 100"]),
      hints: [
        "Taking one copy of a value means taking **all** copies — they never conflict with each other.",
        "So collapse the array into `points[v] = v × count(v)`, indexed by value.",
        "Now adjacent values conflict, and the problem is exactly House Robber over that points array.",
      ],
      examples: [
        { input: "[3,4,2]", expectedOutput: "6" },
        { input: "[2,2,3,3,3,4]", expectedOutput: "9" },
        { input: "[1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 1, rng() < 0.6 ? 12 : 100);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def deleteAndEarn(nums) -> int:\n    max_v = max(nums)\n    points = [0] * (max_v + 1)\n    for x in nums:\n        points[x] += x\n    take = skip = 0\n    for v in range(1, max_v + 1):\n        take, skip = skip + points[v], max(skip, take)\n    return max(take, skip)`,
        javascript: `var deleteAndEarn = function(nums) {\n    let maxV = 0;\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] > maxV) maxV = nums[i];\n    }\n    const points = new Array(maxV + 1).fill(0);\n    for (let i = 0; i < nums.length; i++) points[nums[i]] += nums[i];\n    let take = 0, skip = 0;\n    for (let v = 1; v <= maxV; v++) {\n        const newTake = skip + points[v];\n        const newSkip = Math.max(skip, take);\n        take = newTake;\n        skip = newSkip;\n    }\n    return Math.max(take, skip);\n};`,
              typescript: `function deleteAndEarn(nums: number[]): number {\n    var maxV = 0;\n    for (var i = 0; i < nums.length; i++) {\n        if (nums[i] > maxV) maxV = nums[i];\n    }\n    var points: number[] = [];\n    for (var k = 0; k <= maxV; k++) points.push(0);\n    for (var j = 0; j < nums.length; j++) points[nums[j]] += nums[j];\n    var take = 0;\n    var skip = 0;\n    for (var v = 1; v <= maxV; v++) {\n        var newTake = skip + points[v];\n        var newSkip = Math.max(skip, take);\n        take = newTake;\n        skip = newSkip;\n    }\n    return Math.max(take, skip);\n}`,
              java: `public static int deleteAndEarn(int[] nums) {\n    int maxV = 0;\n    for (int x : nums) maxV = Math.max(maxV, x);\n    int[] points = new int[maxV + 1];\n    for (int x : nums) points[x] += x;\n    int take = 0, skip = 0;\n    for (int v = 1; v <= maxV; v++) {\n        int newTake = skip + points[v];\n        int newSkip = Math.max(skip, take);\n        take = newTake;\n        skip = newSkip;\n    }\n    return Math.max(take, skip);\n}`,
              cpp: `int deleteAndEarn(vector<int>& nums) {\n    int maxV = 0;\n    for (int x : nums) maxV = max(maxV, x);\n    vector<int> points(maxV + 1, 0);\n    for (int x : nums) points[x] += x;\n    int take = 0, skip = 0;\n    for (int v = 1; v <= maxV; v++) {\n        int newTake = skip + points[v];\n        int newSkip = max(skip, take);\n        take = newTake;\n        skip = newSkip;\n    }\n    return max(take, skip);\n}`,
              c: `int deleteAndEarn(int* nums, int numsSize) {\n    int maxV = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] > maxV) maxV = nums[i];\n    }\n    int* points = (int*) calloc(maxV + 1, sizeof(int));\n    for (int i = 0; i < numsSize; i++) points[nums[i]] += nums[i];\n    int take = 0, skip = 0;\n    for (int v = 1; v <= maxV; v++) {\n        int newTake = skip + points[v];\n        int newSkip = skip > take ? skip : take;\n        take = newTake;\n        skip = newSkip;\n    }\n    free(points);\n    return take > skip ? take : skip;\n}`,
              csharp: `public static int DeleteAndEarn(int[] nums)\n{\n    int maxV = 0;\n    foreach (int x in nums) maxV = Math.Max(maxV, x);\n    int[] points = new int[maxV + 1];\n    foreach (int x in nums) points[x] += x;\n    int take = 0, skip = 0;\n    for (int v = 1; v <= maxV; v++)\n    {\n        int newTake = skip + points[v];\n        int newSkip = Math.Max(skip, take);\n        take = newTake;\n        skip = newSkip;\n    }\n    return Math.Max(take, skip);\n}`,
              go: `func deleteAndEarn(nums []int) int {\n	maxV := 0\n	for _, x := range nums {\n		if x > maxV {\n			maxV = x\n		}\n	}\n	points := make([]int, maxV+1)\n	for _, x := range nums {\n		points[x] += x\n	}\n	take, skip := 0, 0\n	for v := 1; v <= maxV; v++ {\n		newTake := skip + points[v]\n		newSkip := skip\n		if take > newSkip {\n			newSkip = take\n		}\n		take = newTake\n		skip = newSkip\n	}\n	if take > skip {\n		return take\n	}\n	return skip\n}`,
              kotlin: `fun deleteAndEarn(nums: IntArray): Int {\n    val maxV = nums.max()!!\n    val points = IntArray(maxV + 1)\n    for (x in nums) points[x] += x\n    var take = 0\n    var skip = 0\n    for (v in 1..maxV) {\n        val newTake = skip + points[v]\n        val newSkip = if (skip > take) skip else take\n        take = newTake\n        skip = newSkip\n    }\n    return if (take > skip) take else skip\n}`,
              swift: `func deleteAndEarn(_ nums: [Int]) -> Int {\n    var maxV = 0\n    for x in nums where x > maxV { maxV = x }\n    var points = [Int](repeating: 0, count: maxV + 1)\n    for x in nums { points[x] += x }\n    var take = 0\n    var skip = 0\n    for v in 1...max(maxV, 1) where v <= maxV {\n        let newTake = skip + points[v]\n        let newSkip = max(skip, take)\n        take = newTake\n        skip = newSkip\n    }\n    return max(take, skip)\n}`,
              rust: `fn deleteAndEarn(nums: Vec<i32>) -> i32 {\n    let mut max_v = 0;\n    for x in nums.iter() {\n        if *x > max_v {\n            max_v = *x;\n        }\n    }\n    let mut points = vec![0i32; (max_v + 1) as usize];\n    for x in nums.iter() {\n        points[*x as usize] += *x;\n    }\n    let mut take = 0;\n    let mut skip = 0;\n    for v in 1..=max_v {\n        let new_take = skip + points[v as usize];\n        let new_skip = if skip > take { skip } else { take };\n        take = new_take;\n        skip = new_skip;\n    }\n    if take > skip { take } else { skip }\n}`,
              php: `function deleteAndEarn($nums) {\n    $maxV = max($nums);\n    $points = array_fill(0, $maxV + 1, 0);\n    foreach ($nums as $x) $points[$x] += $x;\n    $take = 0;\n    $skip = 0;\n    for ($v = 1; $v <= $maxV; $v++) {\n        $newTake = $skip + $points[$v];\n        $newSkip = max($skip, $take);\n        $take = $newTake;\n        $skip = $newSkip;\n    }\n    return max($take, $skip);\n}`,
              ruby: `def deleteAndEarn(nums)\n  max_v = nums.max\n  points = Array.new(max_v + 1, 0)\n  nums.each { |x| points[x] += x }\n  take = 0\n  skip = 0\n  (1..max_v).each do |v|\n    new_take = skip + points[v]\n    new_skip = [skip, take].max\n    take = new_take\n    skip = new_skip\n  end\n  [take, skip].max\nend`,
      },
    };
  })(),

  // ── Best Time to Buy and Sell Stock with Cooldown ───────────────
  (() => {
    const ref = (prices: number[]) => {
      let hold = -Infinity, sold = 0, rest = 0;
      for (let i = 0; i < prices.length; i++) {
        const prevSold = sold;
        sold = hold + prices[i];
        hold = Math.max(hold, rest - prices[i]);
        rest = Math.max(rest, prevSold);
      }
      return Math.max(sold, rest);
    };
    return {
      slug: "best-time-to-buy-and-sell-stock-with-cooldown",
      title: "Best Time to Buy and Sell Stock with Cooldown",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Bloomberg", "Adobe"],
      signature: { funcName: "maxProfit", params: [{ name: "prices", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `prices` where `prices[i]` is the price of a stock on day `i`.\n\nYou may complete as many transactions as you like — buy one share and later sell it — with two restrictions: you may hold at most one share at a time, and after you **sell** you must wait one full day before buying again (a cooldown).\n\nReturn the maximum profit.",
        [
          { in: "prices = [1,2,3,0,2]", out: "3", note: "buy, sell, cooldown, buy, sell." },
          { in: "prices = [1]", out: "0" },
          { in: "prices = [2,1]", out: "0" },
        ],
        ["1 <= prices.length <= 40", "0 <= prices[i] <= 1000"]),
      hints: [
        "Each day you are in exactly one of three states: holding a share, having just sold, or resting with nothing.",
        "`hold` can come from staying held or from buying while resting; `sold` only ever comes from selling what you held.",
        "`rest` absorbs the cooldown — it takes the **previous** day's `sold`, which is what forbids buying the day after a sale.",
      ],
      examples: [
        { input: "[1,2,3,0,2]", expectedOutput: "3" },
        { input: "[1]", expectedOutput: "0" },
        { input: "[2,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const prices = randArr(rng, ri(rng, 1, 40), 0, rng() < 0.6 ? 20 : 1000);
        return { input: fmtIntArr(prices), expectedOutput: String(ref(prices)) };
      },
      solutions: {
        python: `def maxProfit(prices) -> int:\n    hold = float("-inf")\n    sold = 0\n    rest = 0\n    for price in prices:\n        prev_sold = sold\n        sold = hold + price\n        hold = max(hold, rest - price)\n        rest = max(rest, prev_sold)\n    return max(sold, rest)`,
        javascript: `var maxProfit = function(prices) {\n    let hold = -Infinity, sold = 0, rest = 0;\n    for (let i = 0; i < prices.length; i++) {\n        const prevSold = sold;\n        sold = hold + prices[i];\n        hold = Math.max(hold, rest - prices[i]);\n        rest = Math.max(rest, prevSold);\n    }\n    return Math.max(sold, rest);\n};`,
              typescript: `function maxProfit(prices: number[]): number {\n    var NEG = -1000000;\n    var hold = NEG;\n    var sold = 0;\n    var rest = 0;\n    for (var i = 0; i < prices.length; i++) {\n        var prevSold = sold;\n        sold = hold + prices[i];\n        hold = Math.max(hold, rest - prices[i]);\n        rest = Math.max(rest, prevSold);\n    }\n    return Math.max(sold, rest);\n}`,
              java: `public static int maxProfit(int[] prices) {\n    final int NEG = -1000000;\n    int hold = NEG, sold = 0, rest = 0;\n    for (int price : prices) {\n        int prevSold = sold;\n        sold = hold + price;\n        hold = Math.max(hold, rest - price);\n        rest = Math.max(rest, prevSold);\n    }\n    return Math.max(sold, rest);\n}`,
              cpp: `int maxProfit(vector<int>& prices) {\n    const int NEG = -1000000;\n    int hold = NEG, sold = 0, rest = 0;\n    for (int price : prices) {\n        int prevSold = sold;\n        sold = hold + price;\n        hold = max(hold, rest - price);\n        rest = max(rest, prevSold);\n    }\n    return max(sold, rest);\n}`,
              c: `int maxProfit(int* prices, int pricesSize) {\n    int hold = -1000000, sold = 0, rest = 0;\n    for (int i = 0; i < pricesSize; i++) {\n        int prevSold = sold;\n        sold = hold + prices[i];\n        int candidate = rest - prices[i];\n        if (candidate > hold) hold = candidate;\n        if (prevSold > rest) rest = prevSold;\n    }\n    return sold > rest ? sold : rest;\n}`,
              csharp: `public static int MaxProfit(int[] prices)\n{\n    int hold = -1000000, sold = 0, rest = 0;\n    foreach (int price in prices)\n    {\n        int prevSold = sold;\n        sold = hold + price;\n        hold = Math.Max(hold, rest - price);\n        rest = Math.Max(rest, prevSold);\n    }\n    return Math.Max(sold, rest);\n}`,
              go: `func maxProfit(prices []int) int {\n	hold, sold, rest := -1000000, 0, 0\n	for _, price := range prices {\n		prevSold := sold\n		sold = hold + price\n		if rest-price > hold {\n			hold = rest - price\n		}\n		if prevSold > rest {\n			rest = prevSold\n		}\n	}\n	if sold > rest {\n		return sold\n	}\n	return rest\n}`,
              kotlin: `fun maxProfit(prices: IntArray): Int {\n    var hold = -1000000\n    var sold = 0\n    var rest = 0\n    for (price in prices) {\n        val prevSold = sold\n        sold = hold + price\n        hold = if (rest - price > hold) rest - price else hold\n        rest = if (prevSold > rest) prevSold else rest\n    }\n    return if (sold > rest) sold else rest\n}`,
              swift: `func maxProfit(_ prices: [Int]) -> Int {\n    var hold = -1000000\n    var sold = 0\n    var rest = 0\n    for price in prices {\n        let prevSold = sold\n        sold = hold + price\n        hold = max(hold, rest - price)\n        rest = max(rest, prevSold)\n    }\n    return max(sold, rest)\n}`,
              rust: `fn maxProfit(prices: Vec<i32>) -> i32 {\n    let mut hold = -1000000;\n    let mut sold = 0;\n    let mut rest = 0;\n    for price in prices.iter() {\n        let prev_sold = sold;\n        sold = hold + *price;\n        if rest - *price > hold {\n            hold = rest - *price;\n        }\n        if prev_sold > rest {\n            rest = prev_sold;\n        }\n    }\n    if sold > rest { sold } else { rest }\n}`,
              php: `function maxProfit($prices) {\n    $hold = -1000000;\n    $sold = 0;\n    $rest = 0;\n    foreach ($prices as $price) {\n        $prevSold = $sold;\n        $sold = $hold + $price;\n        $hold = max($hold, $rest - $price);\n        $rest = max($rest, $prevSold);\n    }\n    return max($sold, $rest);\n}`,
              ruby: `def maxProfit(prices)\n  hold = -1000000\n  sold = 0\n  rest = 0\n  prices.each do |price|\n    prev_sold = sold\n    sold = hold + price\n    hold = [hold, rest - price].max\n    rest = [rest, prev_sold].max\n  end\n  [sold, rest].max\nend`,
      },
    };
  })(),

  // ── Best Time to Buy and Sell Stock with Transaction Fee ────────
  (() => {
    const ref = (prices: number[], fee: number) => {
      let cash = 0, hold = -prices[0];
      for (let i = 1; i < prices.length; i++) {
        cash = Math.max(cash, hold + prices[i] - fee);
        hold = Math.max(hold, cash - prices[i]);
      }
      return cash;
    };
    return {
      slug: "best-time-to-buy-and-sell-stock-with-transaction-fee",
      title: "Best Time to Buy and Sell Stock with Transaction Fee",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Greedy", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "maxProfit", params: [{ name: "prices", type: "int[]" as const }, { name: "fee", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `prices` where `prices[i]` is the price of a stock on day `i`, and an integer `fee` charged on every completed transaction.\n\nYou may complete as many transactions as you like but may hold at most one share at a time. Return the maximum profit.",
        [
          { in: "prices = [1,3,2,8,4,9], fee = 2", out: "8", note: "Buy at 1, sell at 8, buy at 4, sell at 9: (8-1-2) + (9-4-2) = 8." },
          { in: "prices = [1,3,7,5,10,3], fee = 3", out: "6" },
          { in: "prices = [5], fee = 1", out: "0" },
        ],
        ["1 <= prices.length <= 40", "0 <= prices[i] <= 1000", "0 <= fee <= 1000"]),
      hints: [
        "Track two running values: the best profit while holding nothing (`cash`) and while holding a share (`hold`).",
        "Selling pays the fee once — charge it on the sale so a buy is never double-counted.",
        "Each day, both values can only improve, so a single left-to-right pass is enough.",
      ],
      examples: [
        { input: "[1,3,2,8,4,9]\n2", expectedOutput: "8" },
        { input: "[1,3,7,5,10,3]\n3", expectedOutput: "6" },
        { input: "[5]\n1", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const prices = randArr(rng, ri(rng, 1, 40), 0, rng() < 0.6 ? 20 : 1000);
        const fee = ri(rng, 0, rng() < 0.6 ? 10 : 1000);
        return { input: `${fmtIntArr(prices)}\n${fee}`, expectedOutput: String(ref(prices, fee)) };
      },
      solutions: {
        python: `def maxProfit(prices, fee: int) -> int:\n    cash = 0\n    hold = -prices[0]\n    for price in prices[1:]:\n        cash = max(cash, hold + price - fee)\n        hold = max(hold, cash - price)\n    return cash`,
        javascript: `var maxProfit = function(prices, fee) {\n    let cash = 0, hold = -prices[0];\n    for (let i = 1; i < prices.length; i++) {\n        cash = Math.max(cash, hold + prices[i] - fee);\n        hold = Math.max(hold, cash - prices[i]);\n    }\n    return cash;\n};`,
              typescript: `function maxProfit(prices: number[], fee: number): number {\n    var cash = 0;\n    var hold = -prices[0];\n    for (var i = 1; i < prices.length; i++) {\n        cash = Math.max(cash, hold + prices[i] - fee);\n        hold = Math.max(hold, cash - prices[i]);\n    }\n    return cash;\n}`,
              java: `public static int maxProfit(int[] prices, int fee) {\n    int cash = 0, hold = -prices[0];\n    for (int i = 1; i < prices.length; i++) {\n        cash = Math.max(cash, hold + prices[i] - fee);\n        hold = Math.max(hold, cash - prices[i]);\n    }\n    return cash;\n}`,
              cpp: `int maxProfit(vector<int>& prices, int fee) {\n    int cash = 0, hold = -prices[0];\n    for (size_t i = 1; i < prices.size(); i++) {\n        cash = max(cash, hold + prices[i] - fee);\n        hold = max(hold, cash - prices[i]);\n    }\n    return cash;\n}`,
              c: `int maxProfit(int* prices, int pricesSize, int fee) {\n    int cash = 0, hold = -prices[0];\n    for (int i = 1; i < pricesSize; i++) {\n        int candidate = hold + prices[i] - fee;\n        if (candidate > cash) cash = candidate;\n        int keep = cash - prices[i];\n        if (keep > hold) hold = keep;\n    }\n    return cash;\n}`,
              csharp: `public static int MaxProfit(int[] prices, int fee)\n{\n    int cash = 0, hold = -prices[0];\n    for (int i = 1; i < prices.Length; i++)\n    {\n        cash = Math.Max(cash, hold + prices[i] - fee);\n        hold = Math.Max(hold, cash - prices[i]);\n    }\n    return cash;\n}`,
              go: `func maxProfit(prices []int, fee int) int {\n	cash, hold := 0, -prices[0]\n	for i := 1; i < len(prices); i++ {\n		if hold+prices[i]-fee > cash {\n			cash = hold + prices[i] - fee\n		}\n		if cash-prices[i] > hold {\n			hold = cash - prices[i]\n		}\n	}\n	return cash\n}`,
              kotlin: `fun maxProfit(prices: IntArray, fee: Int): Int {\n    var cash = 0\n    var hold = -prices[0]\n    for (i in 1 until prices.size) {\n        val candidate = hold + prices[i] - fee\n        if (candidate > cash) cash = candidate\n        val keep = cash - prices[i]\n        if (keep > hold) hold = keep\n    }\n    return cash\n}`,
              swift: `func maxProfit(_ prices: [Int], _ fee: Int) -> Int {\n    var cash = 0\n    var hold = -prices[0]\n    var i = 1\n    while i < prices.count {\n        cash = max(cash, hold + prices[i] - fee)\n        hold = max(hold, cash - prices[i])\n        i += 1\n    }\n    return cash\n}`,
              rust: `fn maxProfit(prices: Vec<i32>, fee: i32) -> i32 {\n    let mut cash = 0;\n    let mut hold = -prices[0];\n    for i in 1..prices.len() {\n        if hold + prices[i] - fee > cash {\n            cash = hold + prices[i] - fee;\n        }\n        if cash - prices[i] > hold {\n            hold = cash - prices[i];\n        }\n    }\n    cash\n}`,
              php: `function maxProfit($prices, $fee) {\n    $cash = 0;\n    $hold = -$prices[0];\n    for ($i = 1; $i < count($prices); $i++) {\n        $cash = max($cash, $hold + $prices[$i] - $fee);\n        $hold = max($hold, $cash - $prices[$i]);\n    }\n    return $cash;\n}`,
              ruby: `def maxProfit(prices, fee)\n  cash = 0\n  hold = -prices[0]\n  (1...prices.length).each do |i|\n    cash = [cash, hold + prices[i] - fee].max\n    hold = [hold, cash - prices[i]].max\n  end\n  cash\nend`,
      },
    };
  })(),

  // ── Best Time to Buy and Sell Stock III ─────────────────────────
  (() => {
    const ref = (prices: number[]) => {
      let buy1 = -Infinity, sell1 = 0, buy2 = -Infinity, sell2 = 0;
      for (let i = 0; i < prices.length; i++) {
        buy1 = Math.max(buy1, -prices[i]);
        sell1 = Math.max(sell1, buy1 + prices[i]);
        buy2 = Math.max(buy2, sell1 - prices[i]);
        sell2 = Math.max(sell2, buy2 + prices[i]);
      }
      return sell2;
    };
    return {
      slug: "best-time-to-buy-and-sell-stock-iii",
      title: "Best Time to Buy and Sell Stock III",
      difficulty: "HARD" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Meta", "Microsoft", "Goldman Sachs"],
      signature: { funcName: "maxProfit", params: [{ name: "prices", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `prices` where `prices[i]` is the price of a stock on day `i`.\n\nFind the maximum profit achievable with **at most two** transactions. You may not hold two shares at once — a purchase must be sold before the next purchase.",
        [
          { in: "prices = [3,3,5,0,0,3,1,4]", out: "6", note: "Buy at 0 and sell at 3, then buy at 1 and sell at 4." },
          { in: "prices = [1,2,3,4,5]", out: "4", note: "One transaction across the whole rise is best." },
          { in: "prices = [7,6,4,3,1]", out: "0" },
        ],
        ["1 <= prices.length <= 40", "0 <= prices[i] <= 1000"]),
      hints: [
        "Carry four running best values: after the first buy, first sell, second buy and second sell.",
        "Each day, update them in that order — the second buy is funded by whatever the first sale earned.",
        "Because each value depends only on values already updated this day, a single pass is correct.",
      ],
      examples: [
        { input: "[3,3,5,0,0,3,1,4]", expectedOutput: "6" },
        { input: "[1,2,3,4,5]", expectedOutput: "4" },
        { input: "[7,6,4,3,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const prices = randArr(rng, ri(rng, 1, 40), 0, rng() < 0.6 ? 20 : 1000);
        return { input: fmtIntArr(prices), expectedOutput: String(ref(prices)) };
      },
      solutions: {
        python: `def maxProfit(prices) -> int:\n    buy1 = buy2 = float("-inf")\n    sell1 = sell2 = 0\n    for price in prices:\n        buy1 = max(buy1, -price)\n        sell1 = max(sell1, buy1 + price)\n        buy2 = max(buy2, sell1 - price)\n        sell2 = max(sell2, buy2 + price)\n    return sell2`,
        javascript: `var maxProfit = function(prices) {\n    let buy1 = -Infinity, sell1 = 0, buy2 = -Infinity, sell2 = 0;\n    for (let i = 0; i < prices.length; i++) {\n        buy1 = Math.max(buy1, -prices[i]);\n        sell1 = Math.max(sell1, buy1 + prices[i]);\n        buy2 = Math.max(buy2, sell1 - prices[i]);\n        sell2 = Math.max(sell2, buy2 + prices[i]);\n    }\n    return sell2;\n};`,
              typescript: `function maxProfit(prices: number[]): number {\n    var NEG = -1000000;\n    var buy1 = NEG;\n    var sell1 = 0;\n    var buy2 = NEG;\n    var sell2 = 0;\n    for (var i = 0; i < prices.length; i++) {\n        buy1 = Math.max(buy1, -prices[i]);\n        sell1 = Math.max(sell1, buy1 + prices[i]);\n        buy2 = Math.max(buy2, sell1 - prices[i]);\n        sell2 = Math.max(sell2, buy2 + prices[i]);\n    }\n    return sell2;\n}`,
              java: `public static int maxProfit(int[] prices) {\n    int buy1 = -1000000, sell1 = 0, buy2 = -1000000, sell2 = 0;\n    for (int price : prices) {\n        buy1 = Math.max(buy1, -price);\n        sell1 = Math.max(sell1, buy1 + price);\n        buy2 = Math.max(buy2, sell1 - price);\n        sell2 = Math.max(sell2, buy2 + price);\n    }\n    return sell2;\n}`,
              cpp: `int maxProfit(vector<int>& prices) {\n    int buy1 = -1000000, sell1 = 0, buy2 = -1000000, sell2 = 0;\n    for (int price : prices) {\n        buy1 = max(buy1, -price);\n        sell1 = max(sell1, buy1 + price);\n        buy2 = max(buy2, sell1 - price);\n        sell2 = max(sell2, buy2 + price);\n    }\n    return sell2;\n}`,
              c: `int maxProfit(int* prices, int pricesSize) {\n    int buy1 = -1000000, sell1 = 0, buy2 = -1000000, sell2 = 0;\n    for (int i = 0; i < pricesSize; i++) {\n        int p = prices[i];\n        if (-p > buy1) buy1 = -p;\n        if (buy1 + p > sell1) sell1 = buy1 + p;\n        if (sell1 - p > buy2) buy2 = sell1 - p;\n        if (buy2 + p > sell2) sell2 = buy2 + p;\n    }\n    return sell2;\n}`,
              csharp: `public static int MaxProfit(int[] prices)\n{\n    int buy1 = -1000000, sell1 = 0, buy2 = -1000000, sell2 = 0;\n    foreach (int price in prices)\n    {\n        buy1 = Math.Max(buy1, -price);\n        sell1 = Math.Max(sell1, buy1 + price);\n        buy2 = Math.Max(buy2, sell1 - price);\n        sell2 = Math.Max(sell2, buy2 + price);\n    }\n    return sell2;\n}`,
              go: `func maxProfit(prices []int) int {\n	buy1, sell1, buy2, sell2 := -1000000, 0, -1000000, 0\n	for _, p := range prices {\n		if -p > buy1 {\n			buy1 = -p\n		}\n		if buy1+p > sell1 {\n			sell1 = buy1 + p\n		}\n		if sell1-p > buy2 {\n			buy2 = sell1 - p\n		}\n		if buy2+p > sell2 {\n			sell2 = buy2 + p\n		}\n	}\n	return sell2\n}`,
              kotlin: `fun maxProfit(prices: IntArray): Int {\n    var buy1 = -1000000\n    var sell1 = 0\n    var buy2 = -1000000\n    var sell2 = 0\n    for (p in prices) {\n        if (-p > buy1) buy1 = -p\n        if (buy1 + p > sell1) sell1 = buy1 + p\n        if (sell1 - p > buy2) buy2 = sell1 - p\n        if (buy2 + p > sell2) sell2 = buy2 + p\n    }\n    return sell2\n}`,
              swift: `func maxProfit(_ prices: [Int]) -> Int {\n    var buy1 = -1000000\n    var sell1 = 0\n    var buy2 = -1000000\n    var sell2 = 0\n    for p in prices {\n        buy1 = max(buy1, -p)\n        sell1 = max(sell1, buy1 + p)\n        buy2 = max(buy2, sell1 - p)\n        sell2 = max(sell2, buy2 + p)\n    }\n    return sell2\n}`,
              rust: `fn maxProfit(prices: Vec<i32>) -> i32 {\n    let mut buy1 = -1000000;\n    let mut sell1 = 0;\n    let mut buy2 = -1000000;\n    let mut sell2 = 0;\n    for p in prices.iter() {\n        if -*p > buy1 {\n            buy1 = -*p;\n        }\n        if buy1 + *p > sell1 {\n            sell1 = buy1 + *p;\n        }\n        if sell1 - *p > buy2 {\n            buy2 = sell1 - *p;\n        }\n        if buy2 + *p > sell2 {\n            sell2 = buy2 + *p;\n        }\n    }\n    sell2\n}`,
              php: `function maxProfit($prices) {\n    $buy1 = -1000000;\n    $sell1 = 0;\n    $buy2 = -1000000;\n    $sell2 = 0;\n    foreach ($prices as $p) {\n        $buy1 = max($buy1, -$p);\n        $sell1 = max($sell1, $buy1 + $p);\n        $buy2 = max($buy2, $sell1 - $p);\n        $sell2 = max($sell2, $buy2 + $p);\n    }\n    return $sell2;\n}`,
              ruby: `def maxProfit(prices)\n  buy1 = -1000000\n  sell1 = 0\n  buy2 = -1000000\n  sell2 = 0\n  prices.each do |p|\n    buy1 = [buy1, -p].max\n    sell1 = [sell1, buy1 + p].max\n    buy2 = [buy2, sell1 - p].max\n    sell2 = [sell2, buy2 + p].max\n  end\n  sell2\nend`,
      },
    };
  })(),

  // ── Maximum Length of Repeated Subarray ─────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      const m = a.length, n = b.length;
      const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      let best = 0;
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          if (a[i - 1] === b[j - 1]) {
            dp[i][j] = dp[i - 1][j - 1] + 1;
            if (dp[i][j] > best) best = dp[i][j];
          }
        }
      }
      return best;
    };
    return {
      slug: "maximum-length-of-repeated-subarray",
      title: "Maximum Length of Repeated Subarray",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Binary Search", "Dynamic Programming", "Sliding Window", "Rolling Hash", "Amazon", "Google", "Meta"],
      signature: { funcName: "findLength", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given two integer arrays `nums1` and `nums2`, return the maximum length of a subarray that appears in **both** arrays.\n\nA subarray is a contiguous slice.",
        [
          { in: "nums1 = [1,2,3,2,1], nums2 = [3,2,1,4,7]", out: "3", note: "The repeated subarray is [3,2,1]." },
          { in: "nums1 = [0,0,0,0,0], nums2 = [0,0,0,0,0]", out: "5" },
          { in: "nums1 = [1,2], nums2 = [3,4]", out: "0" },
        ],
        ["1 <= nums1.length, nums2.length <= 30", "0 <= nums1[i], nums2[j] <= 20"]),
      hints: [
        "Let `dp[i][j]` be the length of the common run **ending** at `nums1[i-1]` and `nums2[j-1]`.",
        "Equal elements extend the diagonal: `dp[i][j] = dp[i-1][j-1] + 1`. Unequal elements reset it to 0.",
        "The answer is the maximum entry anywhere in the table — not `dp[m][n]`, which is the common *suffix*.",
      ],
      examples: [
        { input: "[1,2,3,2,1]\n[3,2,1,4,7]", expectedOutput: "3" },
        { input: "[0,0,0,0,0]\n[0,0,0,0,0]", expectedOutput: "5" },
        { input: "[1,2]\n[3,4]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const hi = rng() < 0.5 ? 3 : 20;
        const a = randArr(rng, ri(rng, 1, 30), 0, hi);
        const b = randArr(rng, ri(rng, 1, 30), 0, hi);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: `def findLength(nums1, nums2) -> int:\n    m, n = len(nums1), len(nums2)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    best = 0\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if nums1[i - 1] == nums2[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1] + 1\n                best = max(best, dp[i][j])\n    return best`,
        javascript: `var findLength = function(nums1, nums2) {\n    const m = nums1.length, n = nums2.length;\n    const dp = [];\n    for (let i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(0));\n    let best = 0;\n    for (let i = 1; i <= m; i++) {\n        for (let j = 1; j <= n; j++) {\n            if (nums1[i - 1] === nums2[j - 1]) {\n                dp[i][j] = dp[i - 1][j - 1] + 1;\n                if (dp[i][j] > best) best = dp[i][j];\n            }\n        }\n    }\n    return best;\n};`,
              typescript: `function findLength(nums1: number[], nums2: number[]): number {\n    var m = nums1.length;\n    var n = nums2.length;\n    var dp: number[][] = [];\n    for (var i = 0; i <= m; i++) {\n        var row: number[] = [];\n        for (var j = 0; j <= n; j++) row.push(0);\n        dp.push(row);\n    }\n    var best = 0;\n    for (var a = 1; a <= m; a++) {\n        for (var b = 1; b <= n; b++) {\n            if (nums1[a - 1] === nums2[b - 1]) {\n                dp[a][b] = dp[a - 1][b - 1] + 1;\n                if (dp[a][b] > best) best = dp[a][b];\n            }\n        }\n    }\n    return best;\n}`,
              java: `public static int findLength(int[] nums1, int[] nums2) {\n    int m = nums1.length, n = nums2.length;\n    int[][] dp = new int[m + 1][n + 1];\n    int best = 0;\n    for (int i = 1; i <= m; i++) {\n        for (int j = 1; j <= n; j++) {\n            if (nums1[i - 1] == nums2[j - 1]) {\n                dp[i][j] = dp[i - 1][j - 1] + 1;\n                if (dp[i][j] > best) best = dp[i][j];\n            }\n        }\n    }\n    return best;\n}`,
              cpp: `int findLength(vector<int>& nums1, vector<int>& nums2) {\n    int m = (int) nums1.size(), n = (int) nums2.size();\n    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));\n    int best = 0;\n    for (int i = 1; i <= m; i++) {\n        for (int j = 1; j <= n; j++) {\n            if (nums1[i - 1] == nums2[j - 1]) {\n                dp[i][j] = dp[i - 1][j - 1] + 1;\n                best = max(best, dp[i][j]);\n            }\n        }\n    }\n    return best;\n}`,
              c: `int findLength(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n    int m = nums1Size, n = nums2Size;\n    int* prev = (int*) calloc(n + 1, sizeof(int));\n    int* cur = (int*) calloc(n + 1, sizeof(int));\n    int best = 0;\n    for (int i = 1; i <= m; i++) {\n        for (int j = 1; j <= n; j++) {\n            if (nums1[i - 1] == nums2[j - 1]) {\n                cur[j] = prev[j - 1] + 1;\n                if (cur[j] > best) best = cur[j];\n            } else {\n                cur[j] = 0;\n            }\n        }\n        for (int j = 0; j <= n; j++) {\n            prev[j] = cur[j];\n            cur[j] = 0;\n        }\n    }\n    free(prev);\n    free(cur);\n    return best;\n}`,
              csharp: `public static int FindLength(int[] nums1, int[] nums2)\n{\n    int m = nums1.Length, n = nums2.Length;\n    int[][] dp = new int[m + 1][];\n    for (int i = 0; i <= m; i++) dp[i] = new int[n + 1];\n    int best = 0;\n    for (int i = 1; i <= m; i++)\n    {\n        for (int j = 1; j <= n; j++)\n        {\n            if (nums1[i - 1] == nums2[j - 1])\n            {\n                dp[i][j] = dp[i - 1][j - 1] + 1;\n                if (dp[i][j] > best) best = dp[i][j];\n            }\n        }\n    }\n    return best;\n}`,
              go: `func findLength(nums1 []int, nums2 []int) int {\n	m, n := len(nums1), len(nums2)\n	dp := make([][]int, m+1)\n	for i := range dp {\n		dp[i] = make([]int, n+1)\n	}\n	best := 0\n	for i := 1; i <= m; i++ {\n		for j := 1; j <= n; j++ {\n			if nums1[i-1] == nums2[j-1] {\n				dp[i][j] = dp[i-1][j-1] + 1\n				if dp[i][j] > best {\n					best = dp[i][j]\n				}\n			}\n		}\n	}\n	return best\n}`,
              kotlin: `fun findLength(nums1: IntArray, nums2: IntArray): Int {\n    val m = nums1.size\n    val n = nums2.size\n    val dp = Array(m + 1) { IntArray(n + 1) }\n    var best = 0\n    for (i in 1..m) {\n        for (j in 1..n) {\n            if (nums1[i - 1] == nums2[j - 1]) {\n                dp[i][j] = dp[i - 1][j - 1] + 1\n                if (dp[i][j] > best) best = dp[i][j]\n            }\n        }\n    }\n    return best\n}`,
              swift: `func findLength(_ nums1: [Int], _ nums2: [Int]) -> Int {\n    let m = nums1.count\n    let n = nums2.count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: m + 1)\n    var best = 0\n    for i in 1...max(m, 1) where i <= m {\n        for j in 1...max(n, 1) where j <= n {\n            if nums1[i - 1] == nums2[j - 1] {\n                dp[i][j] = dp[i - 1][j - 1] + 1\n                if dp[i][j] > best { best = dp[i][j] }\n            }\n        }\n    }\n    return best\n}`,
              rust: `fn findLength(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {\n    let m = nums1.len();\n    let n = nums2.len();\n    let mut dp = vec![vec![0i32; n + 1]; m + 1];\n    let mut best = 0;\n    for i in 1..=m {\n        for j in 1..=n {\n            if nums1[i - 1] == nums2[j - 1] {\n                dp[i][j] = dp[i - 1][j - 1] + 1;\n                if dp[i][j] > best {\n                    best = dp[i][j];\n                }\n            }\n        }\n    }\n    best\n}`,
              php: `function findLength($nums1, $nums2) {\n    $m = count($nums1);\n    $n = count($nums2);\n    $dp = array();\n    for ($i = 0; $i <= $m; $i++) $dp[] = array_fill(0, $n + 1, 0);\n    $best = 0;\n    for ($i = 1; $i <= $m; $i++) {\n        for ($j = 1; $j <= $n; $j++) {\n            if ($nums1[$i - 1] === $nums2[$j - 1]) {\n                $dp[$i][$j] = $dp[$i - 1][$j - 1] + 1;\n                if ($dp[$i][$j] > $best) $best = $dp[$i][$j];\n            }\n        }\n    }\n    return $best;\n}`,
              ruby: `def findLength(nums1, nums2)\n  m = nums1.length\n  n = nums2.length\n  dp = Array.new(m + 1) { Array.new(n + 1, 0) }\n  best = 0\n  (1..m).each do |i|\n    (1..n).each do |j|\n      next unless nums1[i - 1] == nums2[j - 1]\n      dp[i][j] = dp[i - 1][j - 1] + 1\n      best = dp[i][j] if dp[i][j] > best\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Longest Arithmetic Subsequence of Given Difference ──────────
  (() => {
    const ref = (arr: number[], difference: number) => {
      const best = new Map<number, number>();
      let answer = 0;
      for (let i = 0; i < arr.length; i++) {
        const prev = best.get(arr[i] - difference) ?? 0;
        const len = prev + 1;
        best.set(arr[i], len);
        if (len > answer) answer = len;
      }
      return answer;
    };
    return {
      slug: "longest-arithmetic-subsequence-of-given-difference",
      title: "Longest Arithmetic Subsequence of Given Difference",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "longestSubsequence", params: [{ name: "arr", type: "int[]" as const }, { name: "difference", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `arr` and an integer `difference`, return the length of the longest **subsequence** in `arr` that is an arithmetic sequence with that exact common difference.\n\nA subsequence keeps the relative order of the remaining elements but need not be contiguous.",
        [
          { in: "arr = [1,2,3,4], difference = 1", out: "4" },
          { in: "arr = [1,3,5,7], difference = 1", out: "1", note: "No two elements differ by exactly 1." },
          { in: "arr = [1,5,7,8,5,3,4,2,1], difference = -2", out: "4", note: "The subsequence [7,5,3,1]." },
        ],
        ["1 <= arr.length <= 40", "-1000 <= arr[i], difference <= 1000"]),
      hints: [
        "Any such subsequence is determined by its last element — you never need to look further back than one step.",
        "Keep a map from value to the longest chain ending at that value.",
        "Reading `map[x - difference]` while processing `x` extends the chain in O(1).",
      ],
      examples: [
        { input: "[1,2,3,4]\n1", expectedOutput: "4" },
        { input: "[1,3,5,7]\n1", expectedOutput: "1" },
        { input: "[1,5,7,8,5,3,4,2,1]\n-2", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const arr = randArr(rng, ri(rng, 1, 40), rng() < 0.6 ? -12 : -1000, rng() < 0.6 ? 12 : 1000);
        const difference = ri(rng, -4, 4);
        return { input: `${fmtIntArr(arr)}\n${difference}`, expectedOutput: String(ref(arr, difference)) };
      },
      solutions: {
        python: `def longestSubsequence(arr, difference: int) -> int:\n    best = {}\n    answer = 0\n    for x in arr:\n        best[x] = best.get(x - difference, 0) + 1\n        answer = max(answer, best[x])\n    return answer`,
        javascript: `var longestSubsequence = function(arr, difference) {\n    const best = new Map();\n    let answer = 0;\n    for (let i = 0; i < arr.length; i++) {\n        const prev = best.get(arr[i] - difference) || 0;\n        const len = prev + 1;\n        best.set(arr[i], len);\n        if (len > answer) answer = len;\n    }\n    return answer;\n};`,
              typescript: `function longestSubsequence(arr: number[], difference: number): number {\n    var best: { [key: string]: number } = {};\n    var answer = 0;\n    for (var i = 0; i < arr.length; i++) {\n        var prevKey = String(arr[i] - difference);\n        var prev = best[prevKey] === undefined ? 0 : best[prevKey];\n        var len = prev + 1;\n        best[String(arr[i])] = len;\n        if (len > answer) answer = len;\n    }\n    return answer;\n}`,
              java: `public static int longestSubsequence(int[] arr, int difference) {\n    Map<Integer, Integer> best = new HashMap<>();\n    int answer = 0;\n    for (int x : arr) {\n        int len = best.getOrDefault(x - difference, 0) + 1;\n        best.put(x, len);\n        if (len > answer) answer = len;\n    }\n    return answer;\n}`,
              cpp: `int longestSubsequence(vector<int>& arr, int difference) {\n    unordered_map<int, int> best;\n    int answer = 0;\n    for (int x : arr) {\n        int len = 1;\n        auto it = best.find(x - difference);\n        if (it != best.end()) len = it->second + 1;\n        best[x] = len;\n        answer = max(answer, len);\n    }\n    return answer;\n}`,
              c: `int longestSubsequence(int* arr, int arrSize, int difference) {\n    int* best = (int*) calloc(arrSize, sizeof(int));\n    int answer = 0;\n    for (int i = 0; i < arrSize; i++) {\n        int len = 1;\n        for (int j = i - 1; j >= 0; j--) {\n            if (arr[j] == arr[i] - difference && best[j] + 1 > len) len = best[j] + 1;\n        }\n        best[i] = len;\n        if (len > answer) answer = len;\n    }\n    free(best);\n    return answer;\n}`,
              csharp: `public static int LongestSubsequence(int[] arr, int difference)\n{\n    var best = new Dictionary<int, int>();\n    int answer = 0;\n    foreach (int x in arr)\n    {\n        int prev = best.ContainsKey(x - difference) ? best[x - difference] : 0;\n        int len = prev + 1;\n        best[x] = len;\n        if (len > answer) answer = len;\n    }\n    return answer;\n}`,
              go: `func longestSubsequence(arr []int, difference int) int {\n	best := make(map[int]int)\n	answer := 0\n	for _, x := range arr {\n		length := best[x-difference] + 1\n		best[x] = length\n		if length > answer {\n			answer = length\n		}\n	}\n	return answer\n}`,
              kotlin: `fun longestSubsequence(arr: IntArray, difference: Int): Int {\n    val best = HashMap<Int, Int>()\n    var answer = 0\n    for (x in arr) {\n        val len = (best[x - difference] ?: 0) + 1\n        best[x] = len\n        if (len > answer) answer = len\n    }\n    return answer\n}`,
              swift: `func longestSubsequence(_ arr: [Int], _ difference: Int) -> Int {\n    var best: [Int: Int] = [:]\n    var answer = 0\n    for x in arr {\n        let len = (best[x - difference] ?? 0) + 1\n        best[x] = len\n        if len > answer { answer = len }\n    }\n    return answer\n}`,
              rust: `fn longestSubsequence(arr: Vec<i32>, difference: i32) -> i32 {\n    use std::collections::HashMap;\n    let mut best: HashMap<i32, i32> = HashMap::new();\n    let mut answer = 0;\n    for x in arr.iter() {\n        let len = *best.get(&(*x - difference)).unwrap_or(&0) + 1;\n        best.insert(*x, len);\n        if len > answer {\n            answer = len;\n        }\n    }\n    answer\n}`,
              php: `function longestSubsequence($arr, $difference) {\n    $best = array();\n    $answer = 0;\n    foreach ($arr as $x) {\n        $prevKey = $x - $difference;\n        $prev = isset($best[$prevKey]) ? $best[$prevKey] : 0;\n        $len = $prev + 1;\n        $best[$x] = $len;\n        if ($len > $answer) $answer = $len;\n    }\n    return $answer;\n}`,
              ruby: `def longestSubsequence(arr, difference)\n  best = Hash.new(0)\n  answer = 0\n  arr.each do |x|\n    len = best[x - difference] + 1\n    best[x] = len\n    answer = len if len > answer\n  end\n  answer\nend`,
      },
    };
  })(),

  // ── Number of Longest Increasing Subsequence ────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      const len = new Array(n).fill(1);
      const count = new Array(n).fill(1);
      let best = 1;
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < i; j++) {
          if (nums[j] < nums[i]) {
            if (len[j] + 1 > len[i]) { len[i] = len[j] + 1; count[i] = count[j]; }
            else if (len[j] + 1 === len[i]) count[i] += count[j];
          }
        }
        if (len[i] > best) best = len[i];
      }
      let total = 0;
      for (let i = 0; i < n; i++) if (len[i] === best) total += count[i];
      return total;
    };
    return {
      slug: "number-of-longest-increasing-subsequence",
      title: "Number of Longest Increasing Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Binary Indexed Tree", "Amazon", "Google", "Meta"],
      signature: { funcName: "findNumberOfLIS", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, return the **number of** longest strictly increasing subsequences.",
        [
          { in: "nums = [1,3,5,4,7]", out: "2", note: "The two longest are [1,3,4,7] and [1,3,5,7]." },
          { in: "nums = [2,2,2,2,2]", out: "5", note: "The longest has length 1, and there are five of them." },
          { in: "nums = [1]", out: "1" },
        ],
        ["1 <= nums.length <= 30", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "Extend the usual O(n²) LIS with a second table: how many longest chains end at each index.",
        "When a longer chain is found, the count is replaced; when an equally long one is found, the counts add.",
        "The answer sums the counts at every index whose chain length equals the global maximum.",
      ],
      examples: [
        { input: "[1,3,5,4,7]", expectedOutput: "2" },
        { input: "[2,2,2,2,2]", expectedOutput: "5" },
        { input: "[1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 30), rng() < 0.6 ? -8 : -1000, rng() < 0.6 ? 8 : 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def findNumberOfLIS(nums) -> int:\n    n = len(nums)\n    length = [1] * n\n    count = [1] * n\n    best = 1\n    for i in range(n):\n        for j in range(i):\n            if nums[j] < nums[i]:\n                if length[j] + 1 > length[i]:\n                    length[i] = length[j] + 1\n                    count[i] = count[j]\n                elif length[j] + 1 == length[i]:\n                    count[i] += count[j]\n        best = max(best, length[i])\n    return sum(count[i] for i in range(n) if length[i] == best)`,
        javascript: `var findNumberOfLIS = function(nums) {\n    const n = nums.length;\n    const len = new Array(n).fill(1);\n    const count = new Array(n).fill(1);\n    let best = 1;\n    for (let i = 0; i < n; i++) {\n        for (let j = 0; j < i; j++) {\n            if (nums[j] < nums[i]) {\n                if (len[j] + 1 > len[i]) {\n                    len[i] = len[j] + 1;\n                    count[i] = count[j];\n                } else if (len[j] + 1 === len[i]) {\n                    count[i] += count[j];\n                }\n            }\n        }\n        if (len[i] > best) best = len[i];\n    }\n    let total = 0;\n    for (let i = 0; i < n; i++) {\n        if (len[i] === best) total += count[i];\n    }\n    return total;\n};`,
              typescript: `function findNumberOfLIS(nums: number[]): number {\n    var n = nums.length;\n    var len: number[] = [];\n    var count: number[] = [];\n    for (var k = 0; k < n; k++) { len.push(1); count.push(1); }\n    var best = 1;\n    for (var i = 0; i < n; i++) {\n        for (var j = 0; j < i; j++) {\n            if (nums[j] < nums[i]) {\n                if (len[j] + 1 > len[i]) {\n                    len[i] = len[j] + 1;\n                    count[i] = count[j];\n                } else if (len[j] + 1 === len[i]) {\n                    count[i] += count[j];\n                }\n            }\n        }\n        if (len[i] > best) best = len[i];\n    }\n    var total = 0;\n    for (var m = 0; m < n; m++) {\n        if (len[m] === best) total += count[m];\n    }\n    return total;\n}`,
              java: `public static int findNumberOfLIS(int[] nums) {\n    int n = nums.length;\n    int[] len = new int[n];\n    int[] count = new int[n];\n    Arrays.fill(len, 1);\n    Arrays.fill(count, 1);\n    int best = 1;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < i; j++) {\n            if (nums[j] < nums[i]) {\n                if (len[j] + 1 > len[i]) {\n                    len[i] = len[j] + 1;\n                    count[i] = count[j];\n                } else if (len[j] + 1 == len[i]) {\n                    count[i] += count[j];\n                }\n            }\n        }\n        if (len[i] > best) best = len[i];\n    }\n    int total = 0;\n    for (int i = 0; i < n; i++) {\n        if (len[i] == best) total += count[i];\n    }\n    return total;\n}`,
              cpp: `int findNumberOfLIS(vector<int>& nums) {\n    int n = (int) nums.size();\n    vector<int> len(n, 1), count(n, 1);\n    int best = 1;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < i; j++) {\n            if (nums[j] < nums[i]) {\n                if (len[j] + 1 > len[i]) {\n                    len[i] = len[j] + 1;\n                    count[i] = count[j];\n                } else if (len[j] + 1 == len[i]) {\n                    count[i] += count[j];\n                }\n            }\n        }\n        best = max(best, len[i]);\n    }\n    int total = 0;\n    for (int i = 0; i < n; i++) {\n        if (len[i] == best) total += count[i];\n    }\n    return total;\n}`,
              c: `int findNumberOfLIS(int* nums, int numsSize) {\n    int n = numsSize;\n    int* len = (int*) malloc(sizeof(int) * n);\n    int* count = (int*) malloc(sizeof(int) * n);\n    for (int i = 0; i < n; i++) { len[i] = 1; count[i] = 1; }\n    int best = 1;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < i; j++) {\n            if (nums[j] < nums[i]) {\n                if (len[j] + 1 > len[i]) {\n                    len[i] = len[j] + 1;\n                    count[i] = count[j];\n                } else if (len[j] + 1 == len[i]) {\n                    count[i] += count[j];\n                }\n            }\n        }\n        if (len[i] > best) best = len[i];\n    }\n    int total = 0;\n    for (int i = 0; i < n; i++) {\n        if (len[i] == best) total += count[i];\n    }\n    free(len);\n    free(count);\n    return total;\n}`,
              csharp: `public static int FindNumberOfLIS(int[] nums)\n{\n    int n = nums.Length;\n    int[] len = new int[n];\n    int[] count = new int[n];\n    for (int i = 0; i < n; i++) { len[i] = 1; count[i] = 1; }\n    int best = 1;\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = 0; j < i; j++)\n        {\n            if (nums[j] < nums[i])\n            {\n                if (len[j] + 1 > len[i])\n                {\n                    len[i] = len[j] + 1;\n                    count[i] = count[j];\n                }\n                else if (len[j] + 1 == len[i])\n                {\n                    count[i] += count[j];\n                }\n            }\n        }\n        if (len[i] > best) best = len[i];\n    }\n    int total = 0;\n    for (int i = 0; i < n; i++)\n    {\n        if (len[i] == best) total += count[i];\n    }\n    return total;\n}`,
              go: `func findNumberOfLIS(nums []int) int {\n	n := len(nums)\n	length := make([]int, n)\n	count := make([]int, n)\n	for i := range length {\n		length[i] = 1\n		count[i] = 1\n	}\n	best := 1\n	for i := 0; i < n; i++ {\n		for j := 0; j < i; j++ {\n			if nums[j] < nums[i] {\n				if length[j]+1 > length[i] {\n					length[i] = length[j] + 1\n					count[i] = count[j]\n				} else if length[j]+1 == length[i] {\n					count[i] += count[j]\n				}\n			}\n		}\n		if length[i] > best {\n			best = length[i]\n		}\n	}\n	total := 0\n	for i := 0; i < n; i++ {\n		if length[i] == best {\n			total += count[i]\n		}\n	}\n	return total\n}`,
              kotlin: `fun findNumberOfLIS(nums: IntArray): Int {\n    val n = nums.size\n    val len = IntArray(n) { 1 }\n    val count = IntArray(n) { 1 }\n    var best = 1\n    for (i in 0 until n) {\n        for (j in 0 until i) {\n            if (nums[j] < nums[i]) {\n                if (len[j] + 1 > len[i]) {\n                    len[i] = len[j] + 1\n                    count[i] = count[j]\n                } else if (len[j] + 1 == len[i]) {\n                    count[i] += count[j]\n                }\n            }\n        }\n        if (len[i] > best) best = len[i]\n    }\n    var total = 0\n    for (i in 0 until n) {\n        if (len[i] == best) total += count[i]\n    }\n    return total\n}`,
              swift: `func findNumberOfLIS(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var len = [Int](repeating: 1, count: n)\n    var count = [Int](repeating: 1, count: n)\n    var best = 1\n    for i in 0..<n {\n        for j in 0..<i {\n            if nums[j] < nums[i] {\n                if len[j] + 1 > len[i] {\n                    len[i] = len[j] + 1\n                    count[i] = count[j]\n                } else if len[j] + 1 == len[i] {\n                    count[i] += count[j]\n                }\n            }\n        }\n        if len[i] > best { best = len[i] }\n    }\n    var total = 0\n    for i in 0..<n where len[i] == best { total += count[i] }\n    return total\n}`,
              rust: `fn findNumberOfLIS(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let mut len = vec![1i32; n];\n    let mut count = vec![1i32; n];\n    let mut best = 1;\n    for i in 0..n {\n        for j in 0..i {\n            if nums[j] < nums[i] {\n                if len[j] + 1 > len[i] {\n                    len[i] = len[j] + 1;\n                    count[i] = count[j];\n                } else if len[j] + 1 == len[i] {\n                    count[i] += count[j];\n                }\n            }\n        }\n        if len[i] > best {\n            best = len[i];\n        }\n    }\n    let mut total = 0;\n    for i in 0..n {\n        if len[i] == best {\n            total += count[i];\n        }\n    }\n    total\n}`,
              php: `function findNumberOfLIS($nums) {\n    $n = count($nums);\n    $len = array_fill(0, $n, 1);\n    $count = array_fill(0, $n, 1);\n    $best = 1;\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = 0; $j < $i; $j++) {\n            if ($nums[$j] < $nums[$i]) {\n                if ($len[$j] + 1 > $len[$i]) {\n                    $len[$i] = $len[$j] + 1;\n                    $count[$i] = $count[$j];\n                } else if ($len[$j] + 1 === $len[$i]) {\n                    $count[$i] += $count[$j];\n                }\n            }\n        }\n        if ($len[$i] > $best) $best = $len[$i];\n    }\n    $total = 0;\n    for ($i = 0; $i < $n; $i++) {\n        if ($len[$i] === $best) $total += $count[$i];\n    }\n    return $total;\n}`,
              ruby: `def findNumberOfLIS(nums)\n  n = nums.length\n  len = Array.new(n, 1)\n  count = Array.new(n, 1)\n  best = 1\n  (0...n).each do |i|\n    (0...i).each do |j|\n      next unless nums[j] < nums[i]\n      if len[j] + 1 > len[i]\n        len[i] = len[j] + 1\n        count[i] = count[j]\n      elsif len[j] + 1 == len[i]\n        count[i] += count[j]\n      end\n    end\n    best = len[i] if len[i] > best\n  end\n  total = 0\n  (0...n).each { |i| total += count[i] if len[i] == best }\n  total\nend`,
      },
    };
  })(),

  // ── Wiggle Subsequence ──────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      if (nums.length < 2) return nums.length;
      let up = 1, down = 1;
      for (let i = 1; i < nums.length; i++) {
        if (nums[i] > nums[i - 1]) up = down + 1;
        else if (nums[i] < nums[i - 1]) down = up + 1;
      }
      return Math.max(up, down);
    };
    return {
      slug: "wiggle-subsequence",
      title: "Wiggle Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Greedy", "Amazon", "Google", "Adobe"],
      signature: { funcName: "wiggleMaxLength", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A **wiggle sequence** is one where the differences between successive numbers alternate strictly between positive and negative. A sequence of one element, and any two-element sequence with unequal values, count as wiggle sequences.\n\nGiven an integer array `nums`, return the length of the longest wiggle **subsequence**.",
        [
          { in: "nums = [1,7,4,9,2,5]", out: "6", note: "The whole array already wiggles." },
          { in: "nums = [1,17,5,10,13,15,10,5,16,8]", out: "7" },
          { in: "nums = [1,2,3,4,5,6,7,8,9]", out: "2" },
        ],
        ["1 <= nums.length <= 40", "0 <= nums[i] <= 1000"],
        "The O(n²) DP is straightforward. Can you do it in O(n)?"),
      hints: [
        "Track two lengths: the best wiggle ending with an **upward** step and the best ending with a **downward** step.",
        "A rise updates `up` from `down + 1`; a fall updates `down` from `up + 1`.",
        "Equal neighbours change nothing — they never contribute a wiggle.",
      ],
      examples: [
        { input: "[1,7,4,9,2,5]", expectedOutput: "6" },
        { input: "[1,17,5,10,13,15,10,5,16,8]", expectedOutput: "7" },
        { input: "[1,2,3,4,5,6,7,8,9]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 0, rng() < 0.5 ? 6 : 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def wiggleMaxLength(nums) -> int:\n    if len(nums) < 2:\n        return len(nums)\n    up = down = 1\n    for i in range(1, len(nums)):\n        if nums[i] > nums[i - 1]:\n            up = down + 1\n        elif nums[i] < nums[i - 1]:\n            down = up + 1\n    return max(up, down)`,
        javascript: `var wiggleMaxLength = function(nums) {\n    if (nums.length < 2) return nums.length;\n    let up = 1, down = 1;\n    for (let i = 1; i < nums.length; i++) {\n        if (nums[i] > nums[i - 1]) up = down + 1;\n        else if (nums[i] < nums[i - 1]) down = up + 1;\n    }\n    return Math.max(up, down);\n};`,
              typescript: `function wiggleMaxLength(nums: number[]): number {\n    if (nums.length < 2) return nums.length;\n    var up = 1;\n    var down = 1;\n    for (var i = 1; i < nums.length; i++) {\n        if (nums[i] > nums[i - 1]) up = down + 1;\n        else if (nums[i] < nums[i - 1]) down = up + 1;\n    }\n    return Math.max(up, down);\n}`,
              java: `public static int wiggleMaxLength(int[] nums) {\n    if (nums.length < 2) return nums.length;\n    int up = 1, down = 1;\n    for (int i = 1; i < nums.length; i++) {\n        if (nums[i] > nums[i - 1]) up = down + 1;\n        else if (nums[i] < nums[i - 1]) down = up + 1;\n    }\n    return Math.max(up, down);\n}`,
              cpp: `int wiggleMaxLength(vector<int>& nums) {\n    if (nums.size() < 2) return (int) nums.size();\n    int up = 1, down = 1;\n    for (size_t i = 1; i < nums.size(); i++) {\n        if (nums[i] > nums[i - 1]) up = down + 1;\n        else if (nums[i] < nums[i - 1]) down = up + 1;\n    }\n    return max(up, down);\n}`,
              c: `int wiggleMaxLength(int* nums, int numsSize) {\n    if (numsSize < 2) return numsSize;\n    int up = 1, down = 1;\n    for (int i = 1; i < numsSize; i++) {\n        if (nums[i] > nums[i - 1]) up = down + 1;\n        else if (nums[i] < nums[i - 1]) down = up + 1;\n    }\n    return up > down ? up : down;\n}`,
              csharp: `public static int WiggleMaxLength(int[] nums)\n{\n    if (nums.Length < 2) return nums.Length;\n    int up = 1, down = 1;\n    for (int i = 1; i < nums.Length; i++)\n    {\n        if (nums[i] > nums[i - 1]) up = down + 1;\n        else if (nums[i] < nums[i - 1]) down = up + 1;\n    }\n    return Math.Max(up, down);\n}`,
              go: `func wiggleMaxLength(nums []int) int {\n	if len(nums) < 2 {\n		return len(nums)\n	}\n	up, down := 1, 1\n	for i := 1; i < len(nums); i++ {\n		if nums[i] > nums[i-1] {\n			up = down + 1\n		} else if nums[i] < nums[i-1] {\n			down = up + 1\n		}\n	}\n	if up > down {\n		return up\n	}\n	return down\n}`,
              kotlin: `fun wiggleMaxLength(nums: IntArray): Int {\n    if (nums.size < 2) return nums.size\n    var up = 1\n    var down = 1\n    for (i in 1 until nums.size) {\n        if (nums[i] > nums[i - 1]) up = down + 1\n        else if (nums[i] < nums[i - 1]) down = up + 1\n    }\n    return if (up > down) up else down\n}`,
              swift: `func wiggleMaxLength(_ nums: [Int]) -> Int {\n    if nums.count < 2 { return nums.count }\n    var up = 1\n    var down = 1\n    for i in 1..<nums.count {\n        if nums[i] > nums[i - 1] { up = down + 1 }\n        else if nums[i] < nums[i - 1] { down = up + 1 }\n    }\n    return max(up, down)\n}`,
              rust: `fn wiggleMaxLength(nums: Vec<i32>) -> i32 {\n    if nums.len() < 2 {\n        return nums.len() as i32;\n    }\n    let mut up = 1;\n    let mut down = 1;\n    for i in 1..nums.len() {\n        if nums[i] > nums[i - 1] {\n            up = down + 1;\n        } else if nums[i] < nums[i - 1] {\n            down = up + 1;\n        }\n    }\n    if up > down { up } else { down }\n}`,
              php: `function wiggleMaxLength($nums) {\n    $n = count($nums);\n    if ($n < 2) return $n;\n    $up = 1;\n    $down = 1;\n    for ($i = 1; $i < $n; $i++) {\n        if ($nums[$i] > $nums[$i - 1]) $up = $down + 1;\n        else if ($nums[$i] < $nums[$i - 1]) $down = $up + 1;\n    }\n    return max($up, $down);\n}`,
              ruby: `def wiggleMaxLength(nums)\n  return nums.length if nums.length < 2\n  up = 1\n  down = 1\n  (1...nums.length).each do |i|\n    if nums[i] > nums[i - 1]\n      up = down + 1\n    elsif nums[i] < nums[i - 1]\n      down = up + 1\n    end\n  end\n  [up, down].max\nend`,
      },
    };
  })(),

  // ── Arithmetic Slices ───────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let total = 0, cur = 0;
      for (let i = 2; i < nums.length; i++) {
        if (nums[i] - nums[i - 1] === nums[i - 1] - nums[i - 2]) { cur++; total += cur; }
        else cur = 0;
      }
      return total;
    };
    return {
      slug: "arithmetic-slices",
      title: "Arithmetic Slices",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Meta", "Bloomberg"],
      signature: { funcName: "numberOfArithmeticSlices", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An integer array is **arithmetic** if it has at least three elements and the difference between consecutive elements is constant.\n\nGiven an integer array `nums`, return the number of arithmetic **subarrays** (contiguous slices).",
        [
          { in: "nums = [1,2,3,4]", out: "3", note: "The slices are [1,2,3], [2,3,4] and [1,2,3,4]." },
          { in: "nums = [1]", out: "0" },
          { in: "nums = [1,3,5,7,9]", out: "6" },
        ],
        ["1 <= nums.length <= 40", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "Let `cur` be the number of arithmetic slices **ending** at the current index.",
        "If the current difference matches the previous one, `cur` grows by one; otherwise it resets to zero.",
        "The answer is the running sum of `cur` — each step adds the slices that end right there.",
      ],
      examples: [
        { input: "[1,2,3,4]", expectedOutput: "3" },
        { input: "[1]", expectedOutput: "0" },
        { input: "[1,3,5,7,9]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        let nums: number[];
        if (rng() < 0.35) {
          const n = ri(rng, 1, 30);
          const start = ri(rng, -100, 100);
          const d = ri(rng, -5, 5);
          nums = Array.from({ length: n }, (_, i) => start + i * d);
          if (rng() < 0.5 && n > 2) nums[ri(rng, 0, n - 1)] = ri(rng, -100, 100);
        } else {
          nums = randArr(rng, ri(rng, 1, 40), rng() < 0.5 ? -5 : -1000, rng() < 0.5 ? 5 : 1000);
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def numberOfArithmeticSlices(nums) -> int:\n    total = cur = 0\n    for i in range(2, len(nums)):\n        if nums[i] - nums[i - 1] == nums[i - 1] - nums[i - 2]:\n            cur += 1\n            total += cur\n        else:\n            cur = 0\n    return total`,
        javascript: `var numberOfArithmeticSlices = function(nums) {\n    let total = 0, cur = 0;\n    for (let i = 2; i < nums.length; i++) {\n        if (nums[i] - nums[i - 1] === nums[i - 1] - nums[i - 2]) {\n            cur++;\n            total += cur;\n        } else {\n            cur = 0;\n        }\n    }\n    return total;\n};`,
              typescript: `function numberOfArithmeticSlices(nums: number[]): number {\n    var total = 0;\n    var cur = 0;\n    for (var i = 2; i < nums.length; i++) {\n        if (nums[i] - nums[i - 1] === nums[i - 1] - nums[i - 2]) {\n            cur++;\n            total += cur;\n        } else {\n            cur = 0;\n        }\n    }\n    return total;\n}`,
              java: `public static int numberOfArithmeticSlices(int[] nums) {\n    int total = 0, cur = 0;\n    for (int i = 2; i < nums.length; i++) {\n        if (nums[i] - nums[i - 1] == nums[i - 1] - nums[i - 2]) {\n            cur++;\n            total += cur;\n        } else {\n            cur = 0;\n        }\n    }\n    return total;\n}`,
              cpp: `int numberOfArithmeticSlices(vector<int>& nums) {\n    int total = 0, cur = 0;\n    for (int i = 2; i < (int) nums.size(); i++) {\n        if (nums[i] - nums[i - 1] == nums[i - 1] - nums[i - 2]) {\n            cur++;\n            total += cur;\n        } else {\n            cur = 0;\n        }\n    }\n    return total;\n}`,
              c: `int numberOfArithmeticSlices(int* nums, int numsSize) {\n    int total = 0, cur = 0;\n    for (int i = 2; i < numsSize; i++) {\n        if (nums[i] - nums[i - 1] == nums[i - 1] - nums[i - 2]) {\n            cur++;\n            total += cur;\n        } else {\n            cur = 0;\n        }\n    }\n    return total;\n}`,
              csharp: `public static int NumberOfArithmeticSlices(int[] nums)\n{\n    int total = 0, cur = 0;\n    for (int i = 2; i < nums.Length; i++)\n    {\n        if (nums[i] - nums[i - 1] == nums[i - 1] - nums[i - 2])\n        {\n            cur++;\n            total += cur;\n        }\n        else\n        {\n            cur = 0;\n        }\n    }\n    return total;\n}`,
              go: `func numberOfArithmeticSlices(nums []int) int {\n	total, cur := 0, 0\n	for i := 2; i < len(nums); i++ {\n		if nums[i]-nums[i-1] == nums[i-1]-nums[i-2] {\n			cur++\n			total += cur\n		} else {\n			cur = 0\n		}\n	}\n	return total\n}`,
              kotlin: `fun numberOfArithmeticSlices(nums: IntArray): Int {\n    var total = 0\n    var cur = 0\n    for (i in 2 until nums.size) {\n        if (nums[i] - nums[i - 1] == nums[i - 1] - nums[i - 2]) {\n            cur++\n            total += cur\n        } else {\n            cur = 0\n        }\n    }\n    return total\n}`,
              swift: `func numberOfArithmeticSlices(_ nums: [Int]) -> Int {\n    var total = 0\n    var cur = 0\n    var i = 2\n    while i < nums.count {\n        if nums[i] - nums[i - 1] == nums[i - 1] - nums[i - 2] {\n            cur += 1\n            total += cur\n        } else {\n            cur = 0\n        }\n        i += 1\n    }\n    return total\n}`,
              rust: `fn numberOfArithmeticSlices(nums: Vec<i32>) -> i32 {\n    let mut total = 0;\n    let mut cur = 0;\n    if nums.len() < 3 {\n        return 0;\n    }\n    for i in 2..nums.len() {\n        if nums[i] - nums[i - 1] == nums[i - 1] - nums[i - 2] {\n            cur += 1;\n            total += cur;\n        } else {\n            cur = 0;\n        }\n    }\n    total\n}`,
              php: `function numberOfArithmeticSlices($nums) {\n    $total = 0;\n    $cur = 0;\n    for ($i = 2; $i < count($nums); $i++) {\n        if ($nums[$i] - $nums[$i - 1] === $nums[$i - 1] - $nums[$i - 2]) {\n            $cur++;\n            $total += $cur;\n        } else {\n            $cur = 0;\n        }\n    }\n    return $total;\n}`,
              ruby: `def numberOfArithmeticSlices(nums)\n  total = 0\n  cur = 0\n  (2...nums.length).each do |i|\n    if nums[i] - nums[i - 1] == nums[i - 1] - nums[i - 2]\n      cur += 1\n      total += cur\n    else\n      cur = 0\n    end\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Count Sorted Vowel Strings ──────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const dp = [1, 1, 1, 1, 1];
      for (let step = 1; step < n; step++) {
        for (let i = 3; i >= 0; i--) dp[i] += dp[i + 1];
      }
      return dp[0] + dp[1] + dp[2] + dp[3] + dp[4];
    };
    return {
      slug: "count-sorted-vowel-strings",
      title: "Count Sorted Vowel Strings",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Math", "Combinatorics", "Amazon", "Adobe"],
      signature: { funcName: "countVowelStrings", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer `n`, return the number of strings of length `n` that consist only of the vowels `a`, `e`, `i`, `o` and `u` and are **lexicographically sorted** — every letter is greater than or equal to the one before it.",
        [
          { in: "n = 1", out: "5", note: 'The five single vowels.' },
          { in: "n = 2", out: "15" },
          { in: "n = 33", out: "66045" },
        ],
        ["1 <= n <= 50"]),
      hints: [
        "Sorted means the choice at each position is limited to the current letter or a later one.",
        "Let `dp[v]` be the number of valid suffixes that start with vowel `v`; extending the length turns it into a suffix sum.",
        "Closed form: the answer is `C(n + 4, 4)` — the number of ways to split `n` positions among 5 vowels.",
      ],
      examples: [
        { input: "1", expectedOutput: "5" },
        { input: "2", expectedOutput: "15" },
        { input: "33", expectedOutput: "66045" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 50);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def countVowelStrings(n: int) -> int:\n    dp = [1] * 5\n    for _ in range(n - 1):\n        for i in range(3, -1, -1):\n            dp[i] += dp[i + 1]\n    return sum(dp)`,
        javascript: `var countVowelStrings = function(n) {\n    const dp = [1, 1, 1, 1, 1];\n    for (let step = 1; step < n; step++) {\n        for (let i = 3; i >= 0; i--) dp[i] += dp[i + 1];\n    }\n    return dp[0] + dp[1] + dp[2] + dp[3] + dp[4];\n};`,
              typescript: `function countVowelStrings(n: number): number {\n    var dp = [1, 1, 1, 1, 1];\n    for (var step = 1; step < n; step++) {\n        for (var i = 3; i >= 0; i--) dp[i] += dp[i + 1];\n    }\n    return dp[0] + dp[1] + dp[2] + dp[3] + dp[4];\n}`,
              java: `public static int countVowelStrings(int n) {\n    int[] dp = {1, 1, 1, 1, 1};\n    for (int step = 1; step < n; step++) {\n        for (int i = 3; i >= 0; i--) dp[i] += dp[i + 1];\n    }\n    return dp[0] + dp[1] + dp[2] + dp[3] + dp[4];\n}`,
              cpp: `int countVowelStrings(int n) {\n    int dp[5] = {1, 1, 1, 1, 1};\n    for (int step = 1; step < n; step++) {\n        for (int i = 3; i >= 0; i--) dp[i] += dp[i + 1];\n    }\n    return dp[0] + dp[1] + dp[2] + dp[3] + dp[4];\n}`,
              c: `int countVowelStrings(int n) {\n    int dp[5] = {1, 1, 1, 1, 1};\n    for (int step = 1; step < n; step++) {\n        for (int i = 3; i >= 0; i--) dp[i] += dp[i + 1];\n    }\n    return dp[0] + dp[1] + dp[2] + dp[3] + dp[4];\n}`,
              csharp: `public static int CountVowelStrings(int n)\n{\n    int[] dp = { 1, 1, 1, 1, 1 };\n    for (int step = 1; step < n; step++)\n    {\n        for (int i = 3; i >= 0; i--) dp[i] += dp[i + 1];\n    }\n    return dp[0] + dp[1] + dp[2] + dp[3] + dp[4];\n}`,
              go: `func countVowelStrings(n int) int {\n	dp := [5]int{1, 1, 1, 1, 1}\n	for step := 1; step < n; step++ {\n		for i := 3; i >= 0; i-- {\n			dp[i] += dp[i+1]\n		}\n	}\n	return dp[0] + dp[1] + dp[2] + dp[3] + dp[4]\n}`,
              kotlin: `fun countVowelStrings(n: Int): Int {\n    val dp = intArrayOf(1, 1, 1, 1, 1)\n    for (step in 1 until n) {\n        for (i in 3 downTo 0) dp[i] += dp[i + 1]\n    }\n    return dp[0] + dp[1] + dp[2] + dp[3] + dp[4]\n}`,
              swift: `func countVowelStrings(_ n: Int) -> Int {\n    var dp = [1, 1, 1, 1, 1]\n    var step = 1\n    while step < n {\n        var i = 3\n        while i >= 0 {\n            dp[i] += dp[i + 1]\n            i -= 1\n        }\n        step += 1\n    }\n    return dp[0] + dp[1] + dp[2] + dp[3] + dp[4]\n}`,
              rust: `fn countVowelStrings(n: i32) -> i32 {\n    let mut dp = [1i32; 5];\n    for _ in 1..n {\n        let mut i: i32 = 3;\n        while i >= 0 {\n            dp[i as usize] += dp[(i + 1) as usize];\n            i -= 1;\n        }\n    }\n    dp[0] + dp[1] + dp[2] + dp[3] + dp[4]\n}`,
              php: `function countVowelStrings($n) {\n    $dp = array(1, 1, 1, 1, 1);\n    for ($step = 1; $step < $n; $step++) {\n        for ($i = 3; $i >= 0; $i--) $dp[$i] += $dp[$i + 1];\n    }\n    return $dp[0] + $dp[1] + $dp[2] + $dp[3] + $dp[4];\n}`,
              ruby: `def countVowelStrings(n)\n  dp = [1, 1, 1, 1, 1]\n  (1...n).each do\n    3.downto(0) { |i| dp[i] += dp[i + 1] }\n  end\n  dp.sum\nend`,
      },
    };
  })(),

  // ── Delete Operation for Two Strings ────────────────────────────
  (() => {
    const ref = (a: string, b: string) => {
      const m = a.length, n = b.length;
      const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
      return m + n - 2 * dp[m][n];
    };
    return {
      slug: "delete-operation-for-two-strings",
      title: "Delete Operation for Two Strings",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "minDistance", params: [{ name: "word1", type: "string" as const }, { name: "word2", type: "string" as const }], returns: "int" as const },
      description: describe(
        "Given two strings `word1` and `word2`, return the **minimum number of single-character deletions** needed to make them equal. A deletion may be applied to either string.",
        [
          { in: 'word1 = "sea", word2 = "eat"', out: "2", note: 'Delete "s" from the first and "t" from the second, leaving "ea".' },
          { in: 'word1 = "leetcode", word2 = "etco"', out: "4" },
          { in: 'word1 = "abc", word2 = "abc"', out: "0" },
        ],
        ["1 <= word1.length, word2.length <= 25", "Both consist of lowercase English letters."]),
      hints: [
        "Whatever survives the deletions is a common subsequence of both strings.",
        "To delete as little as possible, keep the **longest** common subsequence.",
        "The answer is then `len(a) + len(b) - 2 × LCS`.",
      ],
      examples: [
        { input: '"sea"\n"eat"', expectedOutput: "2" },
        { input: '"leetcode"\n"etco"', expectedOutput: "4" },
        { input: '"abc"\n"abc"', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const alphabet = rng() < 0.6 ? "abc" : LOWER;
        const a = randStr(rng, 1, 25, alphabet);
        const b = rng() < 0.3 ? shuffle(rng, a.split("")).join("") : randStr(rng, 1, 25, alphabet);
        return { input: `"${a}"\n"${b}"`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: `def minDistance(word1: str, word2: str) -> int:\n    m, n = len(word1), len(word2)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if word1[i - 1] == word2[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1] + 1\n            else:\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\n    return m + n - 2 * dp[m][n]`,
        javascript: `var minDistance = function(word1, word2) {\n    const m = word1.length, n = word2.length;\n    const dp = [];\n    for (let i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(0));\n    for (let i = 1; i <= m; i++) {\n        for (let j = 1; j <= n; j++) {\n            if (word1[i - 1] === word2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;\n            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return m + n - 2 * dp[m][n];\n};`,
              typescript: `function minDistance(word1: string, word2: string): number {\n    var m = word1.length;\n    var n = word2.length;\n    var dp: number[][] = [];\n    for (var i = 0; i <= m; i++) {\n        var row: number[] = [];\n        for (var j = 0; j <= n; j++) row.push(0);\n        dp.push(row);\n    }\n    for (var a = 1; a <= m; a++) {\n        for (var b = 1; b <= n; b++) {\n            if (word1.charAt(a - 1) === word2.charAt(b - 1)) dp[a][b] = dp[a - 1][b - 1] + 1;\n            else dp[a][b] = Math.max(dp[a - 1][b], dp[a][b - 1]);\n        }\n    }\n    return m + n - 2 * dp[m][n];\n}`,
              java: `public static int minDistance(String word1, String word2) {\n    int m = word1.length(), n = word2.length();\n    int[][] dp = new int[m + 1][n + 1];\n    for (int i = 1; i <= m; i++) {\n        for (int j = 1; j <= n; j++) {\n            if (word1.charAt(i - 1) == word2.charAt(j - 1)) dp[i][j] = dp[i - 1][j - 1] + 1;\n            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return m + n - 2 * dp[m][n];\n}`,
              cpp: `int minDistance(string word1, string word2) {\n    int m = (int) word1.size(), n = (int) word2.size();\n    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));\n    for (int i = 1; i <= m; i++) {\n        for (int j = 1; j <= n; j++) {\n            if (word1[i - 1] == word2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;\n            else dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return m + n - 2 * dp[m][n];\n}`,
              c: `int minDistance(const char* word1, const char* word2) {\n    int m = (int) strlen(word1), n = (int) strlen(word2);\n    int* prev = (int*) calloc(n + 1, sizeof(int));\n    int* cur = (int*) calloc(n + 1, sizeof(int));\n    for (int i = 1; i <= m; i++) {\n        cur[0] = 0;\n        for (int j = 1; j <= n; j++) {\n            if (word1[i - 1] == word2[j - 1]) cur[j] = prev[j - 1] + 1;\n            else cur[j] = prev[j] > cur[j - 1] ? prev[j] : cur[j - 1];\n        }\n        for (int j = 0; j <= n; j++) prev[j] = cur[j];\n    }\n    int lcs = prev[n];\n    free(prev);\n    free(cur);\n    return m + n - 2 * lcs;\n}`,
              csharp: `public static int MinDistance(string word1, string word2)\n{\n    int m = word1.Length, n = word2.Length;\n    int[][] dp = new int[m + 1][];\n    for (int i = 0; i <= m; i++) dp[i] = new int[n + 1];\n    for (int i = 1; i <= m; i++)\n    {\n        for (int j = 1; j <= n; j++)\n        {\n            if (word1[i - 1] == word2[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;\n            else dp[i][j] = Math.Max(dp[i - 1][j], dp[i][j - 1]);\n        }\n    }\n    return m + n - 2 * dp[m][n];\n}`,
              go: `func minDistance(word1 string, word2 string) int {\n	m, n := len(word1), len(word2)\n	dp := make([][]int, m+1)\n	for i := range dp {\n		dp[i] = make([]int, n+1)\n	}\n	for i := 1; i <= m; i++ {\n		for j := 1; j <= n; j++ {\n			if word1[i-1] == word2[j-1] {\n				dp[i][j] = dp[i-1][j-1] + 1\n			} else if dp[i-1][j] > dp[i][j-1] {\n				dp[i][j] = dp[i-1][j]\n			} else {\n				dp[i][j] = dp[i][j-1]\n			}\n		}\n	}\n	return m + n - 2*dp[m][n]\n}`,
              kotlin: `fun minDistance(word1: String, word2: String): Int {\n    val m = word1.length\n    val n = word2.length\n    val dp = Array(m + 1) { IntArray(n + 1) }\n    for (i in 1..m) {\n        for (j in 1..n) {\n            dp[i][j] = if (word1[i - 1] == word2[j - 1]) dp[i - 1][j - 1] + 1\n            else if (dp[i - 1][j] > dp[i][j - 1]) dp[i - 1][j] else dp[i][j - 1]\n        }\n    }\n    return m + n - 2 * dp[m][n]\n}`,
              swift: `func minDistance(_ word1: String, _ word2: String) -> Int {\n    let a = Array(word1)\n    let b = Array(word2)\n    let m = a.count\n    let n = b.count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: m + 1)\n    var i = 1\n    while i <= m {\n        var j = 1\n        while j <= n {\n            if a[i - 1] == b[j - 1] { dp[i][j] = dp[i - 1][j - 1] + 1 }\n            else { dp[i][j] = max(dp[i - 1][j], dp[i][j - 1]) }\n            j += 1\n        }\n        i += 1\n    }\n    return m + n - 2 * dp[m][n]\n}`,
              rust: `fn minDistance(word1: String, word2: String) -> i32 {\n    let a = word1.as_bytes();\n    let b = word2.as_bytes();\n    let m = a.len();\n    let n = b.len();\n    let mut dp = vec![vec![0i32; n + 1]; m + 1];\n    for i in 1..=m {\n        for j in 1..=n {\n            dp[i][j] = if a[i - 1] == b[j - 1] {\n                dp[i - 1][j - 1] + 1\n            } else if dp[i - 1][j] > dp[i][j - 1] {\n                dp[i - 1][j]\n            } else {\n                dp[i][j - 1]\n            };\n        }\n    }\n    (m + n) as i32 - 2 * dp[m][n]\n}`,
              php: `function minDistance($word1, $word2) {\n    $m = strlen($word1);\n    $n = strlen($word2);\n    $dp = array();\n    for ($i = 0; $i <= $m; $i++) $dp[] = array_fill(0, $n + 1, 0);\n    for ($i = 1; $i <= $m; $i++) {\n        for ($j = 1; $j <= $n; $j++) {\n            if ($word1[$i - 1] === $word2[$j - 1]) $dp[$i][$j] = $dp[$i - 1][$j - 1] + 1;\n            else $dp[$i][$j] = max($dp[$i - 1][$j], $dp[$i][$j - 1]);\n        }\n    }\n    return $m + $n - 2 * $dp[$m][$n];\n}`,
              ruby: `def minDistance(word1, word2)\n  m = word1.length\n  n = word2.length\n  dp = Array.new(m + 1) { Array.new(n + 1, 0) }\n  (1..m).each do |i|\n    (1..n).each do |j|\n      dp[i][j] = if word1[i - 1] == word2[j - 1]\n                   dp[i - 1][j - 1] + 1\n                 else\n                   [dp[i - 1][j], dp[i][j - 1]].max\n                 end\n    end\n  end\n  m + n - 2 * dp[m][n]\nend`,
      },
    };
  })(),

  // ── Interleaving String ─────────────────────────────────────────
  (() => {
    const ref = (s1: string, s2: string, s3: string) => {
      const m = s1.length, n = s2.length;
      if (m + n !== s3.length) return false;
      const dp: boolean[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(false));
      dp[0][0] = true;
      for (let i = 0; i <= m; i++) {
        for (let j = 0; j <= n; j++) {
          if (i > 0 && dp[i - 1][j] && s1[i - 1] === s3[i + j - 1]) dp[i][j] = true;
          if (j > 0 && dp[i][j - 1] && s2[j - 1] === s3[i + j - 1]) dp[i][j] = true;
        }
      }
      return dp[m][n];
    };
    return {
      slug: "interleaving-string",
      title: "Interleaving String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Dynamic Programming", "Amazon", "Google", "Microsoft", "Meta"],
      signature: { funcName: "isInterleave", params: [{ name: "s1", type: "string" as const }, { name: "s2", type: "string" as const }, { name: "s3", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given three strings `s1`, `s2` and `s3`, return `true` if `s3` is formed by **interleaving** `s1` and `s2`.\n\nAn interleaving splits both strings into blocks and alternates them, preserving the order within each original string.",
        [
          { in: 's1 = "aabcc", s2 = "dbbca", s3 = "aadbbcbcac"', out: "true" },
          { in: 's1 = "aabcc", s2 = "dbbca", s3 = "aadbbbaccc"', out: "false" },
          { in: 's1 = "", s2 = "", s3 = ""', out: "true" },
        ],
        ["0 <= s1.length, s2.length <= 15", "s3.length == s1.length + s2.length is required for a true answer.", "All strings consist of lowercase English letters."]),
      hints: [
        "The lengths must add up; otherwise reject immediately.",
        "Let `dp[i][j]` mean the first `i` characters of `s1` and the first `j` of `s2` can interleave into the first `i + j` of `s3`.",
        "The next character of `s3` must come from one side or the other — that is exactly the two transitions.",
      ],
      examples: [
        { input: '"aabcc"\n"dbbca"\n"aadbbcbcac"', expectedOutput: "true" },
        { input: '"aabcc"\n"dbbca"\n"aadbbbaccc"', expectedOutput: "false" },
        { input: '""\n""\n""', expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abc";
        const s1 = randStr(rng, 0, 12, alphabet);
        const s2 = randStr(rng, 0, 12, alphabet);
        let s3: string;
        if (rng() < 0.5) {
          let i = 0, j = 0;
          s3 = "";
          while (i < s1.length || j < s2.length) {
            if (j >= s2.length || (i < s1.length && rng() < 0.5)) { s3 += s1[i]; i++; }
            else { s3 += s2[j]; j++; }
          }
          if (rng() < 0.35 && s3.length > 0) {
            const pos = ri(rng, 0, s3.length - 1);
            s3 = s3.slice(0, pos) + alphabet[ri(rng, 0, 2)] + s3.slice(pos + 1);
          }
        } else {
          s3 = randStr(rng, 0, 24, alphabet);
        }
        return { input: `"${s1}"\n"${s2}"\n"${s3}"`, expectedOutput: bool(ref(s1, s2, s3)) };
      },
      solutions: {
        python: `def isInterleave(s1: str, s2: str, s3: str) -> bool:\n    m, n = len(s1), len(s2)\n    if m + n != len(s3):\n        return False\n    dp = [[False] * (n + 1) for _ in range(m + 1)]\n    dp[0][0] = True\n    for i in range(m + 1):\n        for j in range(n + 1):\n            if i > 0 and dp[i - 1][j] and s1[i - 1] == s3[i + j - 1]:\n                dp[i][j] = True\n            if j > 0 and dp[i][j - 1] and s2[j - 1] == s3[i + j - 1]:\n                dp[i][j] = True\n    return dp[m][n]`,
        javascript: `var isInterleave = function(s1, s2, s3) {\n    const m = s1.length, n = s2.length;\n    if (m + n !== s3.length) return false;\n    const dp = [];\n    for (let i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(false));\n    dp[0][0] = true;\n    for (let i = 0; i <= m; i++) {\n        for (let j = 0; j <= n; j++) {\n            if (i > 0 && dp[i - 1][j] && s1[i - 1] === s3[i + j - 1]) dp[i][j] = true;\n            if (j > 0 && dp[i][j - 1] && s2[j - 1] === s3[i + j - 1]) dp[i][j] = true;\n        }\n    }\n    return dp[m][n];\n};`,
              typescript: `function isInterleave(s1: string, s2: string, s3: string): boolean {\n    var m = s1.length;\n    var n = s2.length;\n    if (m + n !== s3.length) return false;\n    var dp: boolean[][] = [];\n    for (var i = 0; i <= m; i++) {\n        var row: boolean[] = [];\n        for (var j = 0; j <= n; j++) row.push(false);\n        dp.push(row);\n    }\n    dp[0][0] = true;\n    for (var a = 0; a <= m; a++) {\n        for (var b = 0; b <= n; b++) {\n            if (a > 0 && dp[a - 1][b] && s1.charAt(a - 1) === s3.charAt(a + b - 1)) dp[a][b] = true;\n            if (b > 0 && dp[a][b - 1] && s2.charAt(b - 1) === s3.charAt(a + b - 1)) dp[a][b] = true;\n        }\n    }\n    return dp[m][n];\n}`,
              java: `public static boolean isInterleave(String s1, String s2, String s3) {\n    int m = s1.length(), n = s2.length();\n    if (m + n != s3.length()) return false;\n    boolean[][] dp = new boolean[m + 1][n + 1];\n    dp[0][0] = true;\n    for (int i = 0; i <= m; i++) {\n        for (int j = 0; j <= n; j++) {\n            if (i > 0 && dp[i - 1][j] && s1.charAt(i - 1) == s3.charAt(i + j - 1)) dp[i][j] = true;\n            if (j > 0 && dp[i][j - 1] && s2.charAt(j - 1) == s3.charAt(i + j - 1)) dp[i][j] = true;\n        }\n    }\n    return dp[m][n];\n}`,
              cpp: `bool isInterleave(string s1, string s2, string s3) {\n    int m = (int) s1.size(), n = (int) s2.size();\n    if (m + n != (int) s3.size()) return false;\n    vector<vector<bool>> dp(m + 1, vector<bool>(n + 1, false));\n    dp[0][0] = true;\n    for (int i = 0; i <= m; i++) {\n        for (int j = 0; j <= n; j++) {\n            if (i > 0 && dp[i - 1][j] && s1[i - 1] == s3[i + j - 1]) dp[i][j] = true;\n            if (j > 0 && dp[i][j - 1] && s2[j - 1] == s3[i + j - 1]) dp[i][j] = true;\n        }\n    }\n    return dp[m][n];\n}`,
              c: `bool isInterleave(const char* s1, const char* s2, const char* s3) {\n    int m = (int) strlen(s1), n = (int) strlen(s2);\n    if (m + n != (int) strlen(s3)) return false;\n    char* dp = (char*) calloc((m + 1) * (n + 1), 1);\n    dp[0] = 1;\n    for (int i = 0; i <= m; i++) {\n        for (int j = 0; j <= n; j++) {\n            int idx = i * (n + 1) + j;\n            if (i > 0 && dp[(i - 1) * (n + 1) + j] && s1[i - 1] == s3[i + j - 1]) dp[idx] = 1;\n            if (j > 0 && dp[i * (n + 1) + j - 1] && s2[j - 1] == s3[i + j - 1]) dp[idx] = 1;\n        }\n    }\n    bool result = dp[m * (n + 1) + n] != 0;\n    free(dp);\n    return result;\n}`,
              csharp: `public static bool IsInterleave(string s1, string s2, string s3)\n{\n    int m = s1.Length, n = s2.Length;\n    if (m + n != s3.Length) return false;\n    bool[][] dp = new bool[m + 1][];\n    for (int i = 0; i <= m; i++) dp[i] = new bool[n + 1];\n    dp[0][0] = true;\n    for (int i = 0; i <= m; i++)\n    {\n        for (int j = 0; j <= n; j++)\n        {\n            if (i > 0 && dp[i - 1][j] && s1[i - 1] == s3[i + j - 1]) dp[i][j] = true;\n            if (j > 0 && dp[i][j - 1] && s2[j - 1] == s3[i + j - 1]) dp[i][j] = true;\n        }\n    }\n    return dp[m][n];\n}`,
              go: `func isInterleave(s1 string, s2 string, s3 string) bool {\n	m, n := len(s1), len(s2)\n	if m+n != len(s3) {\n		return false\n	}\n	dp := make([][]bool, m+1)\n	for i := range dp {\n		dp[i] = make([]bool, n+1)\n	}\n	dp[0][0] = true\n	for i := 0; i <= m; i++ {\n		for j := 0; j <= n; j++ {\n			if i > 0 && dp[i-1][j] && s1[i-1] == s3[i+j-1] {\n				dp[i][j] = true\n			}\n			if j > 0 && dp[i][j-1] && s2[j-1] == s3[i+j-1] {\n				dp[i][j] = true\n			}\n		}\n	}\n	return dp[m][n]\n}`,
              kotlin: `fun isInterleave(s1: String, s2: String, s3: String): Boolean {\n    val m = s1.length\n    val n = s2.length\n    if (m + n != s3.length) return false\n    val dp = Array(m + 1) { BooleanArray(n + 1) }\n    dp[0][0] = true\n    for (i in 0..m) {\n        for (j in 0..n) {\n            if (i > 0 && dp[i - 1][j] && s1[i - 1] == s3[i + j - 1]) dp[i][j] = true\n            if (j > 0 && dp[i][j - 1] && s2[j - 1] == s3[i + j - 1]) dp[i][j] = true\n        }\n    }\n    return dp[m][n]\n}`,
              swift: `func isInterleave(_ s1: String, _ s2: String, _ s3: String) -> Bool {\n    let a = Array(s1)\n    let b = Array(s2)\n    let c = Array(s3)\n    let m = a.count\n    let n = b.count\n    if m + n != c.count { return false }\n    var dp = [[Bool]](repeating: [Bool](repeating: false, count: n + 1), count: m + 1)\n    dp[0][0] = true\n    for i in 0...m {\n        for j in 0...n {\n            if i > 0 && dp[i - 1][j] && a[i - 1] == c[i + j - 1] { dp[i][j] = true }\n            if j > 0 && dp[i][j - 1] && b[j - 1] == c[i + j - 1] { dp[i][j] = true }\n        }\n    }\n    return dp[m][n]\n}`,
              rust: `fn isInterleave(s1: String, s2: String, s3: String) -> bool {\n    let a = s1.as_bytes();\n    let b = s2.as_bytes();\n    let c = s3.as_bytes();\n    let m = a.len();\n    let n = b.len();\n    if m + n != c.len() {\n        return false;\n    }\n    let mut dp = vec![vec![false; n + 1]; m + 1];\n    dp[0][0] = true;\n    for i in 0..=m {\n        for j in 0..=n {\n            if i > 0 && dp[i - 1][j] && a[i - 1] == c[i + j - 1] {\n                dp[i][j] = true;\n            }\n            if j > 0 && dp[i][j - 1] && b[j - 1] == c[i + j - 1] {\n                dp[i][j] = true;\n            }\n        }\n    }\n    dp[m][n]\n}`,
              php: `function isInterleave($s1, $s2, $s3) {\n    $m = strlen($s1);\n    $n = strlen($s2);\n    if ($m + $n !== strlen($s3)) return false;\n    $dp = array();\n    for ($i = 0; $i <= $m; $i++) $dp[] = array_fill(0, $n + 1, false);\n    $dp[0][0] = true;\n    for ($i = 0; $i <= $m; $i++) {\n        for ($j = 0; $j <= $n; $j++) {\n            if ($i > 0 && $dp[$i - 1][$j] && $s1[$i - 1] === $s3[$i + $j - 1]) $dp[$i][$j] = true;\n            if ($j > 0 && $dp[$i][$j - 1] && $s2[$j - 1] === $s3[$i + $j - 1]) $dp[$i][$j] = true;\n        }\n    }\n    return $dp[$m][$n];\n}`,
              ruby: `def isInterleave(s1, s2, s3)\n  m = s1.length\n  n = s2.length\n  return false if m + n != s3.length\n  dp = Array.new(m + 1) { Array.new(n + 1, false) }\n  dp[0][0] = true\n  (0..m).each do |i|\n    (0..n).each do |j|\n      dp[i][j] = true if i > 0 && dp[i - 1][j] && s1[i - 1] == s3[i + j - 1]\n      dp[i][j] = true if j > 0 && dp[i][j - 1] && s2[j - 1] == s3[i + j - 1]\n    end\n  end\n  dp[m][n]\nend`,
      },
    };
  })(),

  // ── Minimum Falling Path Sum ────────────────────────────────────
  (() => {
    const ref = (matrix: number[][]) => {
      const n = matrix.length;
      const dp = matrix[0].slice();
      for (let r = 1; r < n; r++) {
        const next: number[] = [];
        for (let c = 0; c < n; c++) {
          let best = dp[c];
          if (c > 0 && dp[c - 1] < best) best = dp[c - 1];
          if (c + 1 < n && dp[c + 1] < best) best = dp[c + 1];
          next.push(matrix[r][c] + best);
        }
        for (let c = 0; c < n; c++) dp[c] = next[c];
      }
      let answer = dp[0];
      for (let c = 1; c < n; c++) if (dp[c] < answer) answer = dp[c];
      return answer;
    };
    return {
      slug: "minimum-falling-path-sum",
      title: "Minimum Falling Path Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Matrix", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "minFallingPathSum", params: [{ name: "matrix", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given an `n × n` array of integers `matrix`, return the **minimum sum** of any falling path through it.\n\nA falling path picks one element from each row, and consecutive picks must be in the same column or in a column differing by one.",
        [
          { in: "matrix = [[2,1,3],[6,5,4],[7,8,9]]", out: "13", note: "One minimum path is 1 → 5 → 7." },
          { in: "matrix = [[-19,57],[-40,-5]]", out: "-59" },
          { in: "matrix = [[7]]", out: "7" },
        ],
        ["1 <= matrix.length <= 8", "matrix[i].length == matrix.length", "-100 <= matrix[i][j] <= 100"]),
      hints: [
        "Process the rows top to bottom, keeping the best cost to reach each column of the current row.",
        "A cell can be reached from directly above or from either diagonal, so take the minimum of those three.",
        "Only the previous row matters — one array of length `n` suffices.",
      ],
      examples: [
        { input: "[[2,1,3],[6,5,4],[7,8,9]]", expectedOutput: "13" },
        { input: "[[-19,57],[-40,-5]]", expectedOutput: "-59" },
        { input: "[[7]]", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const matrix = Array.from({ length: n }, () => randArr(rng, n, -100, 100));
        return { input: fmtIntMat(matrix), expectedOutput: String(ref(matrix)) };
      },
      solutions: {
        python: `def minFallingPathSum(matrix) -> int:\n    n = len(matrix)\n    dp = list(matrix[0])\n    for r in range(1, n):\n        nxt = []\n        for c in range(n):\n            best = dp[c]\n            if c > 0:\n                best = min(best, dp[c - 1])\n            if c + 1 < n:\n                best = min(best, dp[c + 1])\n            nxt.append(matrix[r][c] + best)\n        dp = nxt\n    return min(dp)`,
        javascript: `var minFallingPathSum = function(matrix) {\n    const n = matrix.length;\n    let dp = matrix[0].slice();\n    for (let r = 1; r < n; r++) {\n        const next = [];\n        for (let c = 0; c < n; c++) {\n            let best = dp[c];\n            if (c > 0 && dp[c - 1] < best) best = dp[c - 1];\n            if (c + 1 < n && dp[c + 1] < best) best = dp[c + 1];\n            next.push(matrix[r][c] + best);\n        }\n        dp = next;\n    }\n    let answer = dp[0];\n    for (let c = 1; c < n; c++) {\n        if (dp[c] < answer) answer = dp[c];\n    }\n    return answer;\n};`,
              typescript: `function minFallingPathSum(matrix: number[][]): number {\n    var n = matrix.length;\n    var dp = matrix[0].slice();\n    for (var r = 1; r < n; r++) {\n        var next: number[] = [];\n        for (var c = 0; c < n; c++) {\n            var best = dp[c];\n            if (c > 0 && dp[c - 1] < best) best = dp[c - 1];\n            if (c + 1 < n && dp[c + 1] < best) best = dp[c + 1];\n            next.push(matrix[r][c] + best);\n        }\n        dp = next;\n    }\n    var answer = dp[0];\n    for (var k = 1; k < n; k++) {\n        if (dp[k] < answer) answer = dp[k];\n    }\n    return answer;\n}`,
              java: `public static int minFallingPathSum(int[][] matrix) {\n    int n = matrix.length;\n    int[] dp = Arrays.copyOf(matrix[0], n);\n    for (int r = 1; r < n; r++) {\n        int[] next = new int[n];\n        for (int c = 0; c < n; c++) {\n            int best = dp[c];\n            if (c > 0) best = Math.min(best, dp[c - 1]);\n            if (c + 1 < n) best = Math.min(best, dp[c + 1]);\n            next[c] = matrix[r][c] + best;\n        }\n        dp = next;\n    }\n    int answer = dp[0];\n    for (int c = 1; c < n; c++) answer = Math.min(answer, dp[c]);\n    return answer;\n}`,
              cpp: `int minFallingPathSum(vector<vector<int>>& matrix) {\n    int n = (int) matrix.size();\n    vector<int> dp = matrix[0];\n    for (int r = 1; r < n; r++) {\n        vector<int> next(n, 0);\n        for (int c = 0; c < n; c++) {\n            int best = dp[c];\n            if (c > 0) best = min(best, dp[c - 1]);\n            if (c + 1 < n) best = min(best, dp[c + 1]);\n            next[c] = matrix[r][c] + best;\n        }\n        dp = next;\n    }\n    return *min_element(dp.begin(), dp.end());\n}`,
              c: `int minFallingPathSum(int** matrix, int matrixSize, int* matrixColSize) {\n    int n = matrixSize;\n    int* dp = (int*) malloc(sizeof(int) * n);\n    int* next = (int*) malloc(sizeof(int) * n);\n    for (int c = 0; c < n; c++) dp[c] = matrix[0][c];\n    for (int r = 1; r < n; r++) {\n        for (int c = 0; c < n; c++) {\n            int best = dp[c];\n            if (c > 0 && dp[c - 1] < best) best = dp[c - 1];\n            if (c + 1 < n && dp[c + 1] < best) best = dp[c + 1];\n            next[c] = matrix[r][c] + best;\n        }\n        for (int c = 0; c < n; c++) dp[c] = next[c];\n    }\n    int answer = dp[0];\n    for (int c = 1; c < n; c++) {\n        if (dp[c] < answer) answer = dp[c];\n    }\n    free(dp);\n    free(next);\n    return answer;\n}`,
              csharp: `public static int MinFallingPathSum(int[][] matrix)\n{\n    int n = matrix.Length;\n    int[] dp = (int[]) matrix[0].Clone();\n    for (int r = 1; r < n; r++)\n    {\n        int[] next = new int[n];\n        for (int c = 0; c < n; c++)\n        {\n            int best = dp[c];\n            if (c > 0) best = Math.Min(best, dp[c - 1]);\n            if (c + 1 < n) best = Math.Min(best, dp[c + 1]);\n            next[c] = matrix[r][c] + best;\n        }\n        dp = next;\n    }\n    int answer = dp[0];\n    for (int c = 1; c < n; c++) answer = Math.Min(answer, dp[c]);\n    return answer;\n}`,
              go: `func minFallingPathSum(matrix [][]int) int {\n	n := len(matrix)\n	dp := make([]int, n)\n	copy(dp, matrix[0])\n	for r := 1; r < n; r++ {\n		next := make([]int, n)\n		for c := 0; c < n; c++ {\n			best := dp[c]\n			if c > 0 && dp[c-1] < best {\n				best = dp[c-1]\n			}\n			if c+1 < n && dp[c+1] < best {\n				best = dp[c+1]\n			}\n			next[c] = matrix[r][c] + best\n		}\n		dp = next\n	}\n	answer := dp[0]\n	for c := 1; c < n; c++ {\n		if dp[c] < answer {\n			answer = dp[c]\n		}\n	}\n	return answer\n}`,
              kotlin: `fun minFallingPathSum(matrix: Array<IntArray>): Int {\n    val n = matrix.size\n    var dp = matrix[0].copyOf()\n    for (r in 1 until n) {\n        val next = IntArray(n)\n        for (c in 0 until n) {\n            var best = dp[c]\n            if (c > 0 && dp[c - 1] < best) best = dp[c - 1]\n            if (c + 1 < n && dp[c + 1] < best) best = dp[c + 1]\n            next[c] = matrix[r][c] + best\n        }\n        dp = next\n    }\n    var answer = dp[0]\n    for (c in 1 until n) {\n        if (dp[c] < answer) answer = dp[c]\n    }\n    return answer\n}`,
              swift: `func minFallingPathSum(_ matrix: [[Int]]) -> Int {\n    let n = matrix.count\n    var dp = matrix[0]\n    var r = 1\n    while r < n {\n        var next = [Int](repeating: 0, count: n)\n        for c in 0..<n {\n            var best = dp[c]\n            if c > 0 && dp[c - 1] < best { best = dp[c - 1] }\n            if c + 1 < n && dp[c + 1] < best { best = dp[c + 1] }\n            next[c] = matrix[r][c] + best\n        }\n        dp = next\n        r += 1\n    }\n    var answer = dp[0]\n    for c in 1..<max(n, 1) where c < n {\n        if dp[c] < answer { answer = dp[c] }\n    }\n    return answer\n}`,
              rust: `fn minFallingPathSum(matrix: Vec<Vec<i32>>) -> i32 {\n    let n = matrix.len();\n    let mut dp = matrix[0].clone();\n    for r in 1..n {\n        let mut next = vec![0i32; n];\n        for c in 0..n {\n            let mut best = dp[c];\n            if c > 0 && dp[c - 1] < best {\n                best = dp[c - 1];\n            }\n            if c + 1 < n && dp[c + 1] < best {\n                best = dp[c + 1];\n            }\n            next[c] = matrix[r][c] + best;\n        }\n        dp = next;\n    }\n    let mut answer = dp[0];\n    for c in 1..n {\n        if dp[c] < answer {\n            answer = dp[c];\n        }\n    }\n    answer\n}`,
              php: `function minFallingPathSum($matrix) {\n    $n = count($matrix);\n    $dp = $matrix[0];\n    for ($r = 1; $r < $n; $r++) {\n        $next = array();\n        for ($c = 0; $c < $n; $c++) {\n            $best = $dp[$c];\n            if ($c > 0 && $dp[$c - 1] < $best) $best = $dp[$c - 1];\n            if ($c + 1 < $n && $dp[$c + 1] < $best) $best = $dp[$c + 1];\n            $next[] = $matrix[$r][$c] + $best;\n        }\n        $dp = $next;\n    }\n    return min($dp);\n}`,
              ruby: `def minFallingPathSum(matrix)\n  n = matrix.length\n  dp = matrix[0].dup\n  (1...n).each do |r|\n    nxt = (0...n).map do |c|\n      best = dp[c]\n      best = dp[c - 1] if c > 0 && dp[c - 1] < best\n      best = dp[c + 1] if c + 1 < n && dp[c + 1] < best\n      matrix[r][c] + best\n    end\n    dp = nxt\n  end\n  dp.min\nend`,
      },
    };
  })(),

  // ── Triangle ────────────────────────────────────────────────────
  (() => {
    const ref = (triangle: number[][]) => {
      const n = triangle.length;
      const dp = triangle[n - 1].slice();
      for (let r = n - 2; r >= 0; r--) {
        for (let c = 0; c <= r; c++) {
          dp[c] = triangle[r][c] + Math.min(dp[c], dp[c + 1]);
        }
      }
      return dp[0];
    };
    return {
      slug: "triangle",
      title: "Triangle",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Bloomberg", "Adobe"],
      signature: { funcName: "minimumTotal", params: [{ name: "triangle", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "Given a `triangle` array, return the minimum path sum from top to bottom.\n\nAt each step you may move to an adjacent number on the row below: from index `i` on the current row you may move to index `i` or `i + 1` on the next.",
        [
          { in: "triangle = [[2],[3,4],[6,5,7],[4,1,8,3]]", out: "11", note: "The path 2 → 3 → 5 → 1 sums to 11." },
          { in: "triangle = [[-10]]", out: "-10" },
          { in: "triangle = [[1],[2,3]]", out: "3" },
        ],
        ["1 <= triangle.length <= 8", "triangle[i].length == i + 1", "-100 <= triangle[i][j] <= 100"],
        "Can you do it using only O(n) extra space, where n is the number of rows?"),
      hints: [
        "Working top-down forces you to track every partial path; working **bottom-up** collapses them.",
        "Start with the last row as the answer for each of its cells, then fold each row above into it.",
        "One array the width of the base is enough, overwritten in place from left to right.",
      ],
      examples: [
        { input: "[[2],[3,4],[6,5,7],[4,1,8,3]]", expectedOutput: "11" },
        { input: "[[-10]]", expectedOutput: "-10" },
        { input: "[[1],[2,3]]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 8);
        const triangle = Array.from({ length: n }, (_, i) => randArr(rng, i + 1, -100, 100));
        return { input: fmtIntMat(triangle), expectedOutput: String(ref(triangle)) };
      },
      solutions: {
        python: `def minimumTotal(triangle) -> int:\n    dp = list(triangle[-1])\n    for r in range(len(triangle) - 2, -1, -1):\n        for c in range(r + 1):\n            dp[c] = triangle[r][c] + min(dp[c], dp[c + 1])\n    return dp[0]`,
        javascript: `var minimumTotal = function(triangle) {\n    const n = triangle.length;\n    const dp = triangle[n - 1].slice();\n    for (let r = n - 2; r >= 0; r--) {\n        for (let c = 0; c <= r; c++) {\n            dp[c] = triangle[r][c] + Math.min(dp[c], dp[c + 1]);\n        }\n    }\n    return dp[0];\n};`,
              typescript: `function minimumTotal(triangle: number[][]): number {\n    var n = triangle.length;\n    var dp = triangle[n - 1].slice();\n    for (var r = n - 2; r >= 0; r--) {\n        for (var c = 0; c <= r; c++) {\n            dp[c] = triangle[r][c] + Math.min(dp[c], dp[c + 1]);\n        }\n    }\n    return dp[0];\n}`,
              java: `public static int minimumTotal(int[][] triangle) {\n    int n = triangle.length;\n    int[] dp = Arrays.copyOf(triangle[n - 1], n);\n    for (int r = n - 2; r >= 0; r--) {\n        for (int c = 0; c <= r; c++) {\n            dp[c] = triangle[r][c] + Math.min(dp[c], dp[c + 1]);\n        }\n    }\n    return dp[0];\n}`,
              cpp: `int minimumTotal(vector<vector<int>>& triangle) {\n    int n = (int) triangle.size();\n    vector<int> dp = triangle[n - 1];\n    for (int r = n - 2; r >= 0; r--) {\n        for (int c = 0; c <= r; c++) {\n            dp[c] = triangle[r][c] + min(dp[c], dp[c + 1]);\n        }\n    }\n    return dp[0];\n}`,
              c: `int minimumTotal(int** triangle, int triangleSize, int* triangleColSize) {\n    int n = triangleSize;\n    int* dp = (int*) malloc(sizeof(int) * n);\n    for (int c = 0; c < n; c++) dp[c] = triangle[n - 1][c];\n    for (int r = n - 2; r >= 0; r--) {\n        for (int c = 0; c <= r; c++) {\n            int best = dp[c] < dp[c + 1] ? dp[c] : dp[c + 1];\n            dp[c] = triangle[r][c] + best;\n        }\n    }\n    int result = dp[0];\n    free(dp);\n    return result;\n}`,
              csharp: `public static int MinimumTotal(int[][] triangle)\n{\n    int n = triangle.Length;\n    int[] dp = (int[]) triangle[n - 1].Clone();\n    for (int r = n - 2; r >= 0; r--)\n    {\n        for (int c = 0; c <= r; c++)\n        {\n            dp[c] = triangle[r][c] + Math.Min(dp[c], dp[c + 1]);\n        }\n    }\n    return dp[0];\n}`,
              go: `func minimumTotal(triangle [][]int) int {\n	n := len(triangle)\n	dp := make([]int, n)\n	copy(dp, triangle[n-1])\n	for r := n - 2; r >= 0; r-- {\n		for c := 0; c <= r; c++ {\n			best := dp[c]\n			if dp[c+1] < best {\n				best = dp[c+1]\n			}\n			dp[c] = triangle[r][c] + best\n		}\n	}\n	return dp[0]\n}`,
              kotlin: `fun minimumTotal(triangle: Array<IntArray>): Int {\n    val n = triangle.size\n    val dp = triangle[n - 1].copyOf()\n    for (r in n - 2 downTo 0) {\n        for (c in 0..r) {\n            dp[c] = triangle[r][c] + if (dp[c] < dp[c + 1]) dp[c] else dp[c + 1]\n        }\n    }\n    return dp[0]\n}`,
              swift: `func minimumTotal(_ triangle: [[Int]]) -> Int {\n    let n = triangle.count\n    var dp = triangle[n - 1]\n    var r = n - 2\n    while r >= 0 {\n        for c in 0...r {\n            dp[c] = triangle[r][c] + min(dp[c], dp[c + 1])\n        }\n        r -= 1\n    }\n    return dp[0]\n}`,
              rust: `fn minimumTotal(triangle: Vec<Vec<i32>>) -> i32 {\n    let n = triangle.len();\n    let mut dp = triangle[n - 1].clone();\n    let mut r = n as i32 - 2;\n    while r >= 0 {\n        let row = r as usize;\n        for c in 0..=row {\n            let best = if dp[c] < dp[c + 1] { dp[c] } else { dp[c + 1] };\n            dp[c] = triangle[row][c] + best;\n        }\n        r -= 1;\n    }\n    dp[0]\n}`,
              php: `function minimumTotal($triangle) {\n    $n = count($triangle);\n    $dp = $triangle[$n - 1];\n    for ($r = $n - 2; $r >= 0; $r--) {\n        for ($c = 0; $c <= $r; $c++) {\n            $dp[$c] = $triangle[$r][$c] + min($dp[$c], $dp[$c + 1]);\n        }\n    }\n    return $dp[0];\n}`,
              ruby: `def minimumTotal(triangle)\n  n = triangle.length\n  dp = triangle[n - 1].dup\n  (n - 2).downto(0) do |r|\n    (0..r).each do |c|\n      dp[c] = triangle[r][c] + [dp[c], dp[c + 1]].min\n    end\n  end\n  dp[0]\nend`,
      },
    };
  })(),

  // ── Perfect Squares ─────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const dp = new Array(n + 1).fill(Infinity);
      dp[0] = 0;
      for (let i = 1; i <= n; i++) {
        for (let k = 1; k * k <= i; k++) {
          if (dp[i - k * k] + 1 < dp[i]) dp[i] = dp[i - k * k] + 1;
        }
      }
      return dp[n];
    };
    return {
      slug: "perfect-squares",
      title: "Perfect Squares",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Dynamic Programming", "Breadth-First Search", "Google", "Amazon", "Meta", "Adobe"],
      signature: { funcName: "numSquares", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer `n`, return the **least** number of perfect-square numbers that sum to `n`.\n\nA perfect square is the product of an integer with itself: 1, 4, 9, 16, …",
        [
          { in: "n = 12", out: "3", note: "12 = 4 + 4 + 4." },
          { in: "n = 13", out: "2", note: "13 = 4 + 9." },
          { in: "n = 1", out: "1" },
        ],
        ["1 <= n <= 300"]),
      hints: [
        "This is an unbounded coin-change problem where the coins are the perfect squares up to `n`.",
        "`dp[i] = 1 + min(dp[i - k²])` over every `k` with `k² <= i`.",
        "Lagrange's four-square theorem guarantees the answer is always 1, 2, 3 or 4.",
      ],
      examples: [
        { input: "12", expectedOutput: "3" },
        { input: "13", expectedOutput: "2" },
        { input: "1", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 300);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def numSquares(n: int) -> int:\n    dp = [0] + [n + 1] * n\n    for i in range(1, n + 1):\n        k = 1\n        while k * k <= i:\n            dp[i] = min(dp[i], dp[i - k * k] + 1)\n            k += 1\n    return dp[n]`,
        javascript: `var numSquares = function(n) {\n    const dp = new Array(n + 1).fill(n + 1);\n    dp[0] = 0;\n    for (let i = 1; i <= n; i++) {\n        for (let k = 1; k * k <= i; k++) {\n            if (dp[i - k * k] + 1 < dp[i]) dp[i] = dp[i - k * k] + 1;\n        }\n    }\n    return dp[n];\n};`,
              typescript: `function numSquares(n: number): number {\n    var dp: number[] = [];\n    for (var k = 0; k <= n; k++) dp.push(n + 1);\n    dp[0] = 0;\n    for (var i = 1; i <= n; i++) {\n        for (var j = 1; j * j <= i; j++) {\n            if (dp[i - j * j] + 1 < dp[i]) dp[i] = dp[i - j * j] + 1;\n        }\n    }\n    return dp[n];\n}`,
              java: `public static int numSquares(int n) {\n    int[] dp = new int[n + 1];\n    Arrays.fill(dp, n + 1);\n    dp[0] = 0;\n    for (int i = 1; i <= n; i++) {\n        for (int k = 1; k * k <= i; k++) {\n            dp[i] = Math.min(dp[i], dp[i - k * k] + 1);\n        }\n    }\n    return dp[n];\n}`,
              cpp: `int numSquares(int n) {\n    vector<int> dp(n + 1, n + 1);\n    dp[0] = 0;\n    for (int i = 1; i <= n; i++) {\n        for (int k = 1; k * k <= i; k++) {\n            dp[i] = min(dp[i], dp[i - k * k] + 1);\n        }\n    }\n    return dp[n];\n}`,
              c: `int numSquares(int n) {\n    int* dp = (int*) malloc(sizeof(int) * (n + 1));\n    for (int i = 0; i <= n; i++) dp[i] = n + 1;\n    dp[0] = 0;\n    for (int i = 1; i <= n; i++) {\n        for (int k = 1; k * k <= i; k++) {\n            if (dp[i - k * k] + 1 < dp[i]) dp[i] = dp[i - k * k] + 1;\n        }\n    }\n    int result = dp[n];\n    free(dp);\n    return result;\n}`,
              csharp: `public static int NumSquares(int n)\n{\n    int[] dp = new int[n + 1];\n    for (int i = 0; i <= n; i++) dp[i] = n + 1;\n    dp[0] = 0;\n    for (int i = 1; i <= n; i++)\n    {\n        for (int k = 1; k * k <= i; k++)\n        {\n            dp[i] = Math.Min(dp[i], dp[i - k * k] + 1);\n        }\n    }\n    return dp[n];\n}`,
              go: `func numSquares(n int) int {\n	dp := make([]int, n+1)\n	for i := range dp {\n		dp[i] = n + 1\n	}\n	dp[0] = 0\n	for i := 1; i <= n; i++ {\n		for k := 1; k*k <= i; k++ {\n			if dp[i-k*k]+1 < dp[i] {\n				dp[i] = dp[i-k*k] + 1\n			}\n		}\n	}\n	return dp[n]\n}`,
              kotlin: `fun numSquares(n: Int): Int {\n    val dp = IntArray(n + 1) { n + 1 }\n    dp[0] = 0\n    for (i in 1..n) {\n        var k = 1\n        while (k * k <= i) {\n            if (dp[i - k * k] + 1 < dp[i]) dp[i] = dp[i - k * k] + 1\n            k++\n        }\n    }\n    return dp[n]\n}`,
              swift: `func numSquares(_ n: Int) -> Int {\n    var dp = [Int](repeating: n + 1, count: n + 1)\n    dp[0] = 0\n    for i in 1...max(n, 1) where i <= n {\n        var k = 1\n        while k * k <= i {\n            if dp[i - k * k] + 1 < dp[i] { dp[i] = dp[i - k * k] + 1 }\n            k += 1\n        }\n    }\n    return dp[n]\n}`,
              rust: `fn numSquares(n: i32) -> i32 {\n    let size = n as usize;\n    let mut dp = vec![n + 1; size + 1];\n    dp[0] = 0;\n    for i in 1..=size {\n        let mut k = 1usize;\n        while k * k <= i {\n            if dp[i - k * k] + 1 < dp[i] {\n                dp[i] = dp[i - k * k] + 1;\n            }\n            k += 1;\n        }\n    }\n    dp[size]\n}`,
              php: `function numSquares($n) {\n    $dp = array_fill(0, $n + 1, $n + 1);\n    $dp[0] = 0;\n    for ($i = 1; $i <= $n; $i++) {\n        for ($k = 1; $k * $k <= $i; $k++) {\n            if ($dp[$i - $k * $k] + 1 < $dp[$i]) $dp[$i] = $dp[$i - $k * $k] + 1;\n        }\n    }\n    return $dp[$n];\n}`,
              ruby: `def numSquares(n)\n  dp = Array.new(n + 1, n + 1)\n  dp[0] = 0\n  (1..n).each do |i|\n    k = 1\n    while k * k <= i\n      dp[i] = dp[i - k * k] + 1 if dp[i - k * k] + 1 < dp[i]\n      k += 1\n    end\n  end\n  dp[n]\nend`,
      },
    };
  })(),

  // ── Integer Break ───────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const dp = new Array(n + 1).fill(0);
      dp[1] = 1;
      for (let i = 2; i <= n; i++) {
        for (let k = 1; k < i; k++) {
          const candidate = Math.max(k * (i - k), k * dp[i - k]);
          if (candidate > dp[i]) dp[i] = candidate;
        }
      }
      return dp[n];
    };
    return {
      slug: "integer-break",
      title: "Integer Break",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Dynamic Programming", "Google", "Amazon"],
      signature: { funcName: "integerBreak", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer `n`, break it into the sum of **at least two** positive integers and maximise the product of those integers.\n\nReturn the maximum product you can obtain.",
        [
          { in: "n = 2", out: "1", note: "2 = 1 + 1, so the product is 1." },
          { in: "n = 10", out: "36", note: "10 = 3 + 3 + 4." },
          { in: "n = 4", out: "4", note: "4 = 2 + 2." },
        ],
        ["2 <= n <= 40"]),
      hints: [
        "For each first piece `k`, you may either stop there — product `k × (n - k)` — or break the remainder further, giving `k × dp[n - k]`.",
        "Take the larger of those two for every `k`, and the maximum over all `k`.",
        "The greedy answer uses as many 3s as possible, which the DP will reproduce.",
      ],
      examples: [
        { input: "2", expectedOutput: "1" },
        { input: "10", expectedOutput: "36" },
        { input: "4", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 40);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def integerBreak(n: int) -> int:\n    dp = [0] * (n + 1)\n    dp[1] = 1\n    for i in range(2, n + 1):\n        for k in range(1, i):\n            dp[i] = max(dp[i], k * (i - k), k * dp[i - k])\n    return dp[n]`,
        javascript: `var integerBreak = function(n) {\n    const dp = new Array(n + 1).fill(0);\n    dp[1] = 1;\n    for (let i = 2; i <= n; i++) {\n        for (let k = 1; k < i; k++) {\n            const candidate = Math.max(k * (i - k), k * dp[i - k]);\n            if (candidate > dp[i]) dp[i] = candidate;\n        }\n    }\n    return dp[n];\n};`,
              typescript: `function integerBreak(n: number): number {\n    var dp: number[] = [];\n    for (var k = 0; k <= n; k++) dp.push(0);\n    dp[1] = 1;\n    for (var i = 2; i <= n; i++) {\n        for (var j = 1; j < i; j++) {\n            var candidate = Math.max(j * (i - j), j * dp[i - j]);\n            if (candidate > dp[i]) dp[i] = candidate;\n        }\n    }\n    return dp[n];\n}`,
              java: `public static int integerBreak(int n) {\n    int[] dp = new int[n + 1];\n    dp[1] = 1;\n    for (int i = 2; i <= n; i++) {\n        for (int k = 1; k < i; k++) {\n            dp[i] = Math.max(dp[i], Math.max(k * (i - k), k * dp[i - k]));\n        }\n    }\n    return dp[n];\n}`,
              cpp: `int integerBreak(int n) {\n    vector<int> dp(n + 1, 0);\n    dp[1] = 1;\n    for (int i = 2; i <= n; i++) {\n        for (int k = 1; k < i; k++) {\n            dp[i] = max(dp[i], max(k * (i - k), k * dp[i - k]));\n        }\n    }\n    return dp[n];\n}`,
              c: `int integerBreak(int n) {\n    int* dp = (int*) calloc(n + 1, sizeof(int));\n    dp[1] = 1;\n    for (int i = 2; i <= n; i++) {\n        for (int k = 1; k < i; k++) {\n            int a = k * (i - k);\n            int b = k * dp[i - k];\n            int candidate = a > b ? a : b;\n            if (candidate > dp[i]) dp[i] = candidate;\n        }\n    }\n    int result = dp[n];\n    free(dp);\n    return result;\n}`,
              csharp: `public static int IntegerBreak(int n)\n{\n    int[] dp = new int[n + 1];\n    dp[1] = 1;\n    for (int i = 2; i <= n; i++)\n    {\n        for (int k = 1; k < i; k++)\n        {\n            dp[i] = Math.Max(dp[i], Math.Max(k * (i - k), k * dp[i - k]));\n        }\n    }\n    return dp[n];\n}`,
              go: `func integerBreak(n int) int {\n	dp := make([]int, n+1)\n	dp[1] = 1\n	for i := 2; i <= n; i++ {\n		for k := 1; k < i; k++ {\n			a := k * (i - k)\n			b := k * dp[i-k]\n			candidate := a\n			if b > candidate {\n				candidate = b\n			}\n			if candidate > dp[i] {\n				dp[i] = candidate\n			}\n		}\n	}\n	return dp[n]\n}`,
              kotlin: `fun integerBreak(n: Int): Int {\n    val dp = IntArray(n + 1)\n    dp[1] = 1\n    for (i in 2..n) {\n        for (k in 1 until i) {\n            val candidate = maxOf(k * (i - k), k * dp[i - k])\n            if (candidate > dp[i]) dp[i] = candidate\n        }\n    }\n    return dp[n]\n}`,
              swift: `func integerBreak(_ n: Int) -> Int {\n    var dp = [Int](repeating: 0, count: n + 1)\n    dp[1] = 1\n    var i = 2\n    while i <= n {\n        for k in 1..<i {\n            let candidate = max(k * (i - k), k * dp[i - k])\n            if candidate > dp[i] { dp[i] = candidate }\n        }\n        i += 1\n    }\n    return dp[n]\n}`,
              rust: `fn integerBreak(n: i32) -> i32 {\n    let size = n as usize;\n    let mut dp = vec![0i32; size + 1];\n    dp[1] = 1;\n    for i in 2..=size {\n        for k in 1..i {\n            let a = (k * (i - k)) as i32;\n            let b = k as i32 * dp[i - k];\n            let candidate = if a > b { a } else { b };\n            if candidate > dp[i] {\n                dp[i] = candidate;\n            }\n        }\n    }\n    dp[size]\n}`,
              php: `function integerBreak($n) {\n    $dp = array_fill(0, $n + 1, 0);\n    $dp[1] = 1;\n    for ($i = 2; $i <= $n; $i++) {\n        for ($k = 1; $k < $i; $k++) {\n            $candidate = max($k * ($i - $k), $k * $dp[$i - $k]);\n            if ($candidate > $dp[$i]) $dp[$i] = $candidate;\n        }\n    }\n    return $dp[$n];\n}`,
              ruby: `def integerBreak(n)\n  dp = Array.new(n + 1, 0)\n  dp[1] = 1\n  (2..n).each do |i|\n    (1...i).each do |k|\n      candidate = [k * (i - k), k * dp[i - k]].max\n      dp[i] = candidate if candidate > dp[i]\n    end\n  end\n  dp[n]\nend`,
      },
    };
  })(),

  // ── Ugly Number II ──────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const ugly = new Array(n).fill(1);
      let i2 = 0, i3 = 0, i5 = 0;
      for (let i = 1; i < n; i++) {
        const next = Math.min(ugly[i2] * 2, Math.min(ugly[i3] * 3, ugly[i5] * 5));
        ugly[i] = next;
        if (next === ugly[i2] * 2) i2++;
        if (next === ugly[i3] * 3) i3++;
        if (next === ugly[i5] * 5) i5++;
      }
      return ugly[n - 1];
    };
    return {
      slug: "ugly-number-ii",
      title: "Ugly Number II",
      difficulty: "MEDIUM" as const,
      tags: ["Hash Table", "Math", "Dynamic Programming", "Heap", "Amazon", "Microsoft", "Adobe"],
      signature: { funcName: "nthUglyNumber", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "An **ugly number** is a positive integer whose prime factors are limited to `2`, `3` and `5`.\n\nGiven an integer `n`, return the n-th ugly number. The sequence begins 1, 2, 3, 4, 5, 6, 8, 9, 10, 12, …",
        [
          { in: "n = 10", out: "12" },
          { in: "n = 1", out: "1", note: "1 is conventionally the first ugly number." },
          { in: "n = 7", out: "8" },
        ],
        ["1 <= n <= 1000"],
        "Testing every integer for uglyness is far too slow. Can you generate the sequence directly?"),
      hints: [
        "Every ugly number after 1 is an earlier ugly number multiplied by 2, 3 or 5.",
        "Keep three pointers into the list already built, one per multiplier, and always take the smallest candidate.",
        "Advance **every** pointer whose candidate equals the value just taken — otherwise duplicates like 6 appear twice.",
      ],
      examples: [
        { input: "10", expectedOutput: "12" },
        { input: "1", expectedOutput: "1" },
        { input: "7", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 1000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def nthUglyNumber(n: int) -> int:\n    ugly = [1] * n\n    i2 = i3 = i5 = 0\n    for i in range(1, n):\n        nxt = min(ugly[i2] * 2, ugly[i3] * 3, ugly[i5] * 5)\n        ugly[i] = nxt\n        if nxt == ugly[i2] * 2:\n            i2 += 1\n        if nxt == ugly[i3] * 3:\n            i3 += 1\n        if nxt == ugly[i5] * 5:\n            i5 += 1\n    return ugly[n - 1]`,
        javascript: `var nthUglyNumber = function(n) {\n    const ugly = new Array(n).fill(1);\n    let i2 = 0, i3 = 0, i5 = 0;\n    for (let i = 1; i < n; i++) {\n        const next = Math.min(ugly[i2] * 2, Math.min(ugly[i3] * 3, ugly[i5] * 5));\n        ugly[i] = next;\n        if (next === ugly[i2] * 2) i2++;\n        if (next === ugly[i3] * 3) i3++;\n        if (next === ugly[i5] * 5) i5++;\n    }\n    return ugly[n - 1];\n};`,
              typescript: `function nthUglyNumber(n: number): number {\n    var ugly: number[] = [];\n    for (var k = 0; k < n; k++) ugly.push(1);\n    var i2 = 0;\n    var i3 = 0;\n    var i5 = 0;\n    for (var i = 1; i < n; i++) {\n        var next = Math.min(ugly[i2] * 2, Math.min(ugly[i3] * 3, ugly[i5] * 5));\n        ugly[i] = next;\n        if (next === ugly[i2] * 2) i2++;\n        if (next === ugly[i3] * 3) i3++;\n        if (next === ugly[i5] * 5) i5++;\n    }\n    return ugly[n - 1];\n}`,
              java: `public static int nthUglyNumber(int n) {\n    int[] ugly = new int[n];\n    ugly[0] = 1;\n    int i2 = 0, i3 = 0, i5 = 0;\n    for (int i = 1; i < n; i++) {\n        int next = Math.min(ugly[i2] * 2, Math.min(ugly[i3] * 3, ugly[i5] * 5));\n        ugly[i] = next;\n        if (next == ugly[i2] * 2) i2++;\n        if (next == ugly[i3] * 3) i3++;\n        if (next == ugly[i5] * 5) i5++;\n    }\n    return ugly[n - 1];\n}`,
              cpp: `int nthUglyNumber(int n) {\n    vector<int> ugly(n, 1);\n    int i2 = 0, i3 = 0, i5 = 0;\n    for (int i = 1; i < n; i++) {\n        int next = min(ugly[i2] * 2, min(ugly[i3] * 3, ugly[i5] * 5));\n        ugly[i] = next;\n        if (next == ugly[i2] * 2) i2++;\n        if (next == ugly[i3] * 3) i3++;\n        if (next == ugly[i5] * 5) i5++;\n    }\n    return ugly[n - 1];\n}`,
              c: `int nthUglyNumber(int n) {\n    int* ugly = (int*) malloc(sizeof(int) * n);\n    ugly[0] = 1;\n    int i2 = 0, i3 = 0, i5 = 0;\n    for (int i = 1; i < n; i++) {\n        int a = ugly[i2] * 2, b = ugly[i3] * 3, c = ugly[i5] * 5;\n        int next = a < b ? a : b;\n        if (c < next) next = c;\n        ugly[i] = next;\n        if (next == a) i2++;\n        if (next == b) i3++;\n        if (next == c) i5++;\n    }\n    int result = ugly[n - 1];\n    free(ugly);\n    return result;\n}`,
              csharp: `public static int NthUglyNumber(int n)\n{\n    int[] ugly = new int[n];\n    ugly[0] = 1;\n    int i2 = 0, i3 = 0, i5 = 0;\n    for (int i = 1; i < n; i++)\n    {\n        int next = Math.Min(ugly[i2] * 2, Math.Min(ugly[i3] * 3, ugly[i5] * 5));\n        ugly[i] = next;\n        if (next == ugly[i2] * 2) i2++;\n        if (next == ugly[i3] * 3) i3++;\n        if (next == ugly[i5] * 5) i5++;\n    }\n    return ugly[n - 1];\n}`,
              go: `func nthUglyNumber(n int) int {\n	ugly := make([]int, n)\n	ugly[0] = 1\n	i2, i3, i5 := 0, 0, 0\n	for i := 1; i < n; i++ {\n		a, b, c := ugly[i2]*2, ugly[i3]*3, ugly[i5]*5\n		next := a\n		if b < next {\n			next = b\n		}\n		if c < next {\n			next = c\n		}\n		ugly[i] = next\n		if next == a {\n			i2++\n		}\n		if next == b {\n			i3++\n		}\n		if next == c {\n			i5++\n		}\n	}\n	return ugly[n-1]\n}`,
              kotlin: `fun nthUglyNumber(n: Int): Int {\n    val ugly = IntArray(n)\n    ugly[0] = 1\n    var i2 = 0\n    var i3 = 0\n    var i5 = 0\n    for (i in 1 until n) {\n        val a = ugly[i2] * 2\n        val b = ugly[i3] * 3\n        val c = ugly[i5] * 5\n        val next = minOf(a, b, c)\n        ugly[i] = next\n        if (next == a) i2++\n        if (next == b) i3++\n        if (next == c) i5++\n    }\n    return ugly[n - 1]\n}`,
              swift: `func nthUglyNumber(_ n: Int) -> Int {\n    var ugly = [Int](repeating: 1, count: n)\n    var i2 = 0\n    var i3 = 0\n    var i5 = 0\n    var i = 1\n    while i < n {\n        let a = ugly[i2] * 2\n        let b = ugly[i3] * 3\n        let c = ugly[i5] * 5\n        let next = min(a, min(b, c))\n        ugly[i] = next\n        if next == a { i2 += 1 }\n        if next == b { i3 += 1 }\n        if next == c { i5 += 1 }\n        i += 1\n    }\n    return ugly[n - 1]\n}`,
              rust: `fn nthUglyNumber(n: i32) -> i32 {\n    let size = n as usize;\n    let mut ugly = vec![1i32; size];\n    let mut i2 = 0usize;\n    let mut i3 = 0usize;\n    let mut i5 = 0usize;\n    for i in 1..size {\n        let a = ugly[i2] * 2;\n        let b = ugly[i3] * 3;\n        let c = ugly[i5] * 5;\n        let mut next = a;\n        if b < next {\n            next = b;\n        }\n        if c < next {\n            next = c;\n        }\n        ugly[i] = next;\n        if next == a {\n            i2 += 1;\n        }\n        if next == b {\n            i3 += 1;\n        }\n        if next == c {\n            i5 += 1;\n        }\n    }\n    ugly[size - 1]\n}`,
              php: `function nthUglyNumber($n) {\n    $ugly = array_fill(0, $n, 1);\n    $i2 = 0;\n    $i3 = 0;\n    $i5 = 0;\n    for ($i = 1; $i < $n; $i++) {\n        $a = $ugly[$i2] * 2;\n        $b = $ugly[$i3] * 3;\n        $c = $ugly[$i5] * 5;\n        $next = min($a, $b, $c);\n        $ugly[$i] = $next;\n        if ($next === $a) $i2++;\n        if ($next === $b) $i3++;\n        if ($next === $c) $i5++;\n    }\n    return $ugly[$n - 1];\n}`,
              ruby: `def nthUglyNumber(n)\n  ugly = Array.new(n, 1)\n  i2 = 0\n  i3 = 0\n  i5 = 0\n  (1...n).each do |i|\n    a = ugly[i2] * 2\n    b = ugly[i3] * 3\n    c = ugly[i5] * 5\n    nxt = [a, b, c].min\n    ugly[i] = nxt\n    i2 += 1 if nxt == a\n    i3 += 1 if nxt == b\n    i5 += 1 if nxt == c\n  end\n  ugly[n - 1]\nend`,
      },
    };
  })(),

  // ── Count Numbers with Unique Digits ────────────────────────────
  (() => {
    const ref = (n: number) => {
      if (n === 0) return 1;
      let total = 10, current = 9;
      for (let digits = 2; digits <= n && digits <= 10; digits++) {
        current *= 11 - digits;
        total += current;
      }
      return total;
    };
    return {
      slug: "count-numbers-with-unique-digits",
      title: "Count Numbers with Unique Digits",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Dynamic Programming", "Backtracking", "Google", "Amazon"],
      signature: { funcName: "countNumbersWithUniqueDigits", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer `n`, return the count of numbers `x` with `0 <= x < 10^n` that have **all distinct digits**.",
        [
          { in: "n = 2", out: "91", note: "All 100 numbers below 100 except the nine repdigits 11, 22, …, 99." },
          { in: "n = 0", out: "1", note: "Only x = 0 satisfies 0 <= x < 1." },
          { in: "n = 3", out: "739" },
        ],
        ["0 <= n <= 8"]),
      hints: [
        "Count by digit length and add the counts up.",
        "A number with exactly `d` digits has 9 choices for the leading digit and then 9, 8, 7, … for the rest.",
        "Anything past ten digits is impossible — there are only ten distinct digits.",
      ],
      examples: [
        { input: "2", expectedOutput: "91" },
        { input: "0", expectedOutput: "1" },
        { input: "3", expectedOutput: "739" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 0, 8);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def countNumbersWithUniqueDigits(n: int) -> int:\n    if n == 0:\n        return 1\n    total, current = 10, 9\n    for digits in range(2, min(n, 10) + 1):\n        current *= 11 - digits\n        total += current\n    return total`,
        javascript: `var countNumbersWithUniqueDigits = function(n) {\n    if (n === 0) return 1;\n    let total = 10, current = 9;\n    for (let digits = 2; digits <= n && digits <= 10; digits++) {\n        current *= 11 - digits;\n        total += current;\n    }\n    return total;\n};`,
              typescript: `function countNumbersWithUniqueDigits(n: number): number {\n    if (n === 0) return 1;\n    var total = 10;\n    var current = 9;\n    for (var digits = 2; digits <= n && digits <= 10; digits++) {\n        current *= 11 - digits;\n        total += current;\n    }\n    return total;\n}`,
              java: `public static int countNumbersWithUniqueDigits(int n) {\n    if (n == 0) return 1;\n    int total = 10, current = 9;\n    for (int digits = 2; digits <= n && digits <= 10; digits++) {\n        current *= 11 - digits;\n        total += current;\n    }\n    return total;\n}`,
              cpp: `int countNumbersWithUniqueDigits(int n) {\n    if (n == 0) return 1;\n    int total = 10, current = 9;\n    for (int digits = 2; digits <= n && digits <= 10; digits++) {\n        current *= 11 - digits;\n        total += current;\n    }\n    return total;\n}`,
              c: `int countNumbersWithUniqueDigits(int n) {\n    if (n == 0) return 1;\n    int total = 10, current = 9;\n    for (int digits = 2; digits <= n && digits <= 10; digits++) {\n        current *= 11 - digits;\n        total += current;\n    }\n    return total;\n}`,
              csharp: `public static int CountNumbersWithUniqueDigits(int n)\n{\n    if (n == 0) return 1;\n    int total = 10, current = 9;\n    for (int digits = 2; digits <= n && digits <= 10; digits++)\n    {\n        current *= 11 - digits;\n        total += current;\n    }\n    return total;\n}`,
              go: `func countNumbersWithUniqueDigits(n int) int {\n	if n == 0 {\n		return 1\n	}\n	total, current := 10, 9\n	for digits := 2; digits <= n && digits <= 10; digits++ {\n		current *= 11 - digits\n		total += current\n	}\n	return total\n}`,
              kotlin: `fun countNumbersWithUniqueDigits(n: Int): Int {\n    if (n == 0) return 1\n    var total = 10\n    var current = 9\n    var digits = 2\n    while (digits <= n && digits <= 10) {\n        current *= 11 - digits\n        total += current\n        digits++\n    }\n    return total\n}`,
              swift: `func countNumbersWithUniqueDigits(_ n: Int) -> Int {\n    if n == 0 { return 1 }\n    var total = 10\n    var current = 9\n    var digits = 2\n    while digits <= n && digits <= 10 {\n        current *= 11 - digits\n        total += current\n        digits += 1\n    }\n    return total\n}`,
              rust: `fn countNumbersWithUniqueDigits(n: i32) -> i32 {\n    if n == 0 {\n        return 1;\n    }\n    let mut total = 10;\n    let mut current = 9;\n    let mut digits = 2;\n    while digits <= n && digits <= 10 {\n        current *= 11 - digits;\n        total += current;\n        digits += 1;\n    }\n    total\n}`,
              php: `function countNumbersWithUniqueDigits($n) {\n    if ($n === 0) return 1;\n    $total = 10;\n    $current = 9;\n    for ($digits = 2; $digits <= $n && $digits <= 10; $digits++) {\n        $current *= 11 - $digits;\n        $total += $current;\n    }\n    return $total;\n}`,
              ruby: `def countNumbersWithUniqueDigits(n)\n  return 1 if n == 0\n  total = 10\n  current = 9\n  digits = 2\n  while digits <= n && digits <= 10\n    current *= 11 - digits\n    total += current\n    digits += 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Stone Game ──────────────────────────────────────────────────
  (() => {
    const ref = (piles: number[]) => {
      const n = piles.length;
      const dp: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
      for (let i = 0; i < n; i++) dp[i][i] = piles[i];
      for (let len = 2; len <= n; len++) {
        for (let i = 0; i + len - 1 < n; i++) {
          const j = i + len - 1;
          dp[i][j] = Math.max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]);
        }
      }
      return dp[0][n - 1] > 0;
    };
    return {
      slug: "stone-game",
      title: "Stone Game",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Dynamic Programming", "Game Theory", "Amazon", "Google", "Adobe"],
      signature: { funcName: "stoneGame", params: [{ name: "piles", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Alice and Bob play with an **even** number of piles of stones arranged in a row; `piles[i]` is the size of the i-th pile, and the total number of stones is odd so there are no draws.\n\nAlice goes first. On each turn a player takes the entire pile from **either end** of the row. The player with more stones at the end wins.\n\nAssuming both play optimally, return `true` if Alice wins.",
        [
          { in: "piles = [5,3,4,5]", out: "true" },
          { in: "piles = [3,7,2,3]", out: "true" },
          { in: "piles = [1,2]", out: "true" },
        ],
        ["2 <= piles.length <= 20", "piles.length is even.", "1 <= piles[i] <= 100", "The total number of stones is odd."]),
      hints: [
        "Define `dp[i][j]` as the best **score difference** the player to move can force on the sub-row `i…j`.",
        "Taking the left pile scores `piles[i]` and hands the opponent `dp[i+1][j]`, so the difference is `piles[i] - dp[i+1][j]`.",
        "Alice wins exactly when `dp[0][n-1] > 0`. (Going first on an even row is in fact always a win — but prove it with the DP.)",
      ],
      examples: [
        { input: "[5,3,4,5]", expectedOutput: "true" },
        { input: "[3,7,2,3]", expectedOutput: "true" },
        { input: "[1,2]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = 2 * ri(rng, 1, 10);
        const piles = randArr(rng, n, 1, 100);
        let total = 0;
        for (let i = 0; i < n; i++) total += piles[i];
        // The problem guarantees an odd total so there are no draws.
        if (total % 2 === 0) piles[0] += 1;
        return { input: fmtIntArr(piles), expectedOutput: bool(ref(piles)) };
      },
      solutions: {
        python: `def stoneGame(piles) -> bool:\n    n = len(piles)\n    dp = [[0] * n for _ in range(n)]\n    for i in range(n):\n        dp[i][i] = piles[i]\n    for length in range(2, n + 1):\n        for i in range(n - length + 1):\n            j = i + length - 1\n            dp[i][j] = max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1])\n    return dp[0][n - 1] > 0`,
        javascript: `var stoneGame = function(piles) {\n    const n = piles.length;\n    const dp = [];\n    for (let i = 0; i < n; i++) dp.push(new Array(n).fill(0));\n    for (let i = 0; i < n; i++) dp[i][i] = piles[i];\n    for (let len = 2; len <= n; len++) {\n        for (let i = 0; i + len - 1 < n; i++) {\n            const j = i + len - 1;\n            dp[i][j] = Math.max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]);\n        }\n    }\n    return dp[0][n - 1] > 0;\n};`,
              typescript: `function stoneGame(piles: number[]): boolean {\n    var n = piles.length;\n    var dp: number[][] = [];\n    for (var i = 0; i < n; i++) {\n        var row: number[] = [];\n        for (var j = 0; j < n; j++) row.push(0);\n        dp.push(row);\n    }\n    for (var k = 0; k < n; k++) dp[k][k] = piles[k];\n    for (var len = 2; len <= n; len++) {\n        for (var a = 0; a + len - 1 < n; a++) {\n            var b = a + len - 1;\n            dp[a][b] = Math.max(piles[a] - dp[a + 1][b], piles[b] - dp[a][b - 1]);\n        }\n    }\n    return dp[0][n - 1] > 0;\n}`,
              java: `public static boolean stoneGame(int[] piles) {\n    int n = piles.length;\n    int[][] dp = new int[n][n];\n    for (int i = 0; i < n; i++) dp[i][i] = piles[i];\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            dp[i][j] = Math.max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]);\n        }\n    }\n    return dp[0][n - 1] > 0;\n}`,
              cpp: `bool stoneGame(vector<int>& piles) {\n    int n = (int) piles.size();\n    vector<vector<int>> dp(n, vector<int>(n, 0));\n    for (int i = 0; i < n; i++) dp[i][i] = piles[i];\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            dp[i][j] = max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]);\n        }\n    }\n    return dp[0][n - 1] > 0;\n}`,
              c: `bool stoneGame(int* piles, int pilesSize) {\n    int n = pilesSize;\n    int* dp = (int*) calloc(n * n, sizeof(int));\n    for (int i = 0; i < n; i++) dp[i * n + i] = piles[i];\n    for (int len = 2; len <= n; len++) {\n        for (int i = 0; i + len - 1 < n; i++) {\n            int j = i + len - 1;\n            int left = piles[i] - dp[(i + 1) * n + j];\n            int right = piles[j] - dp[i * n + j - 1];\n            dp[i * n + j] = left > right ? left : right;\n        }\n    }\n    bool result = dp[n - 1] > 0;\n    free(dp);\n    return result;\n}`,
              csharp: `public static bool StoneGame(int[] piles)\n{\n    int n = piles.Length;\n    int[][] dp = new int[n][];\n    for (int i = 0; i < n; i++) dp[i] = new int[n];\n    for (int i = 0; i < n; i++) dp[i][i] = piles[i];\n    for (int len = 2; len <= n; len++)\n    {\n        for (int i = 0; i + len - 1 < n; i++)\n        {\n            int j = i + len - 1;\n            dp[i][j] = Math.Max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]);\n        }\n    }\n    return dp[0][n - 1] > 0;\n}`,
              go: `func stoneGame(piles []int) bool {\n	n := len(piles)\n	dp := make([][]int, n)\n	for i := range dp {\n		dp[i] = make([]int, n)\n	}\n	for i := 0; i < n; i++ {\n		dp[i][i] = piles[i]\n	}\n	for length := 2; length <= n; length++ {\n		for i := 0; i+length-1 < n; i++ {\n			j := i + length - 1\n			left := piles[i] - dp[i+1][j]\n			right := piles[j] - dp[i][j-1]\n			if left > right {\n				dp[i][j] = left\n			} else {\n				dp[i][j] = right\n			}\n		}\n	}\n	return dp[0][n-1] > 0\n}`,
              kotlin: `fun stoneGame(piles: IntArray): Boolean {\n    val n = piles.size\n    val dp = Array(n) { IntArray(n) }\n    for (i in 0 until n) dp[i][i] = piles[i]\n    for (len in 2..n) {\n        for (i in 0..n - len) {\n            val j = i + len - 1\n            dp[i][j] = maxOf(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1])\n        }\n    }\n    return dp[0][n - 1] > 0\n}`,
              swift: `func stoneGame(_ piles: [Int]) -> Bool {\n    let n = piles.count\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n), count: n)\n    for i in 0..<n { dp[i][i] = piles[i] }\n    var len = 2\n    while len <= n {\n        var i = 0\n        while i + len - 1 < n {\n            let j = i + len - 1\n            dp[i][j] = max(piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1])\n            i += 1\n        }\n        len += 1\n    }\n    return dp[0][n - 1] > 0\n}`,
              rust: `fn stoneGame(piles: Vec<i32>) -> bool {\n    let n = piles.len();\n    let mut dp = vec![vec![0i32; n]; n];\n    for i in 0..n {\n        dp[i][i] = piles[i];\n    }\n    for len in 2..=n {\n        for i in 0..=(n - len) {\n            let j = i + len - 1;\n            let left = piles[i] - dp[i + 1][j];\n            let right = piles[j] - dp[i][j - 1];\n            dp[i][j] = if left > right { left } else { right };\n        }\n    }\n    dp[0][n - 1] > 0\n}`,
              php: `function stoneGame($piles) {\n    $n = count($piles);\n    $dp = array();\n    for ($i = 0; $i < $n; $i++) $dp[] = array_fill(0, $n, 0);\n    for ($i = 0; $i < $n; $i++) $dp[$i][$i] = $piles[$i];\n    for ($len = 2; $len <= $n; $len++) {\n        for ($i = 0; $i + $len - 1 < $n; $i++) {\n            $j = $i + $len - 1;\n            $dp[$i][$j] = max($piles[$i] - $dp[$i + 1][$j], $piles[$j] - $dp[$i][$j - 1]);\n        }\n    }\n    return $dp[0][$n - 1] > 0;\n}`,
              ruby: `def stoneGame(piles)\n  n = piles.length\n  dp = Array.new(n) { Array.new(n, 0) }\n  (0...n).each { |i| dp[i][i] = piles[i] }\n  (2..n).each do |len|\n    (0..(n - len)).each do |i|\n      j = i + len - 1\n      dp[i][j] = [piles[i] - dp[i + 1][j], piles[j] - dp[i][j - 1]].max\n    end\n  end\n  dp[0][n - 1] > 0\nend`,
      },
    };
  })(),

  // ── Divisor Game ────────────────────────────────────────────────
  (() => {
    const ref = (n: number) => n % 2 === 0;
    return {
      slug: "divisor-game",
      title: "Divisor Game",
      difficulty: "EASY" as const,
      tags: ["Math", "Dynamic Programming", "Brainteaser", "Game Theory", "Amazon", "Adobe"],
      signature: { funcName: "divisorGame", params: [{ name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Alice and Bob take turns with a number `n` on a blackboard, Alice moving first. On a turn a player picks any `x` with `0 < x < n` and `n % x == 0`, then replaces `n` with `n - x`. A player who cannot move loses.\n\nAssuming both play optimally, return `true` if Alice wins.",
        [
          { in: "n = 2", out: "true", note: "Alice takes x = 1, leaving 1, and Bob has no move." },
          { in: "n = 3", out: "false", note: "Alice must take x = 1, leaving 2 for Bob, who then wins." },
          { in: "n = 4", out: "true" },
        ],
        ["1 <= n <= 1000"]),
      hints: [
        "Play out the small cases with a DP over `1 … n`: a position wins if some legal move leaves the opponent in a losing position.",
        "The pattern that emerges is stark — look at the parity of `n`.",
        "From an even `n`, taking `x = 1` hands the opponent an odd number; every divisor of an odd number is odd, so they must hand back an even one.",
      ],
      examples: [
        { input: "2", expectedOutput: "true" },
        { input: "3", expectedOutput: "false" },
        { input: "4", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 1000);
        return { input: String(n), expectedOutput: bool(ref(n)) };
      },
      solutions: {
        python: `def divisorGame(n: int) -> bool:\n    return n % 2 == 0`,
        javascript: `var divisorGame = function(n) {\n    return n % 2 === 0;\n};`,
              typescript: `function divisorGame(n: number): boolean {\n    return n % 2 === 0;\n}`,
              java: `public static boolean divisorGame(int n) {\n    return n % 2 == 0;\n}`,
              cpp: `bool divisorGame(int n) {\n    return n % 2 == 0;\n}`,
              c: `bool divisorGame(int n) {\n    return n % 2 == 0;\n}`,
              csharp: `public static bool DivisorGame(int n)\n{\n    return n % 2 == 0;\n}`,
              go: `func divisorGame(n int) bool {\n	return n%2 == 0\n}`,
              kotlin: `fun divisorGame(n: Int): Boolean {\n    return n % 2 == 0\n}`,
              swift: `func divisorGame(_ n: Int) -> Bool {\n    return n % 2 == 0\n}`,
              rust: `fn divisorGame(n: i32) -> bool {\n    n % 2 == 0\n}`,
              php: `function divisorGame($n) {\n    return $n % 2 === 0;\n}`,
              ruby: `def divisorGame(n)\n  n.even?\nend`,
      },
    };
  })(),

  // ── Last Stone Weight II ────────────────────────────────────────
  (() => {
    const ref = (stones: number[]) => {
      let total = 0;
      for (let i = 0; i < stones.length; i++) total += stones[i];
      const half = Math.floor(total / 2);
      const dp = new Array(half + 1).fill(false);
      dp[0] = true;
      for (let i = 0; i < stones.length; i++) {
        for (let w = half; w >= stones[i]; w--) if (dp[w - stones[i]]) dp[w] = true;
      }
      for (let w = half; w >= 0; w--) if (dp[w]) return total - 2 * w;
      return total;
    };
    return {
      slug: "last-stone-weight-ii",
      title: "Last Stone Weight II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "lastStoneWeightII", params: [{ name: "stones", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array of integers `stones` where `stones[i]` is the weight of the i-th stone.\n\nRepeatedly smash any two stones together. If they weigh `x` and `y` with `x <= y`, the stone of weight `x` is destroyed and the other becomes `y - x`; equal stones destroy each other. Return the **smallest possible** weight of the stone left at the end, or `0` if none remains.",
        [
          { in: "stones = [2,7,4,1,8,1]", out: "1" },
          { in: "stones = [31,26,33,21,40]", out: "5" },
          { in: "stones = [1,1]", out: "0" },
        ],
        ["1 <= stones.length <= 20", "1 <= stones[i] <= 100"]),
      hints: [
        "Every smash assigns a stone a sign: the final weight is `|sum of one group - sum of the other|`.",
        "So the task is to split the stones into two groups whose sums are as close as possible.",
        "That is subset-sum: find the largest reachable sum at most `total / 2`, and the answer is `total - 2 × that`.",
      ],
      examples: [
        { input: "[2,7,4,1,8,1]", expectedOutput: "1" },
        { input: "[31,26,33,21,40]", expectedOutput: "5" },
        { input: "[1,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const stones = randArr(rng, ri(rng, 1, 20), 1, 100);
        return { input: fmtIntArr(stones), expectedOutput: String(ref(stones)) };
      },
      solutions: {
        python: `def lastStoneWeightII(stones) -> int:\n    total = sum(stones)\n    half = total // 2\n    dp = [False] * (half + 1)\n    dp[0] = True\n    for stone in stones:\n        for w in range(half, stone - 1, -1):\n            if dp[w - stone]:\n                dp[w] = True\n    for w in range(half, -1, -1):\n        if dp[w]:\n            return total - 2 * w\n    return total`,
        javascript: `var lastStoneWeightII = function(stones) {\n    let total = 0;\n    for (let i = 0; i < stones.length; i++) total += stones[i];\n    const half = Math.floor(total / 2);\n    const dp = new Array(half + 1).fill(false);\n    dp[0] = true;\n    for (let i = 0; i < stones.length; i++) {\n        for (let w = half; w >= stones[i]; w--) {\n            if (dp[w - stones[i]]) dp[w] = true;\n        }\n    }\n    for (let w = half; w >= 0; w--) {\n        if (dp[w]) return total - 2 * w;\n    }\n    return total;\n};`,
              typescript: `function lastStoneWeightII(stones: number[]): number {\n    var total = 0;\n    for (var i = 0; i < stones.length; i++) total += stones[i];\n    var half = Math.floor(total / 2);\n    var dp: boolean[] = [];\n    for (var k = 0; k <= half; k++) dp.push(false);\n    dp[0] = true;\n    for (var s = 0; s < stones.length; s++) {\n        for (var w = half; w >= stones[s]; w--) {\n            if (dp[w - stones[s]]) dp[w] = true;\n        }\n    }\n    for (var v = half; v >= 0; v--) {\n        if (dp[v]) return total - 2 * v;\n    }\n    return total;\n}`,
              java: `public static int lastStoneWeightII(int[] stones) {\n    int total = 0;\n    for (int s : stones) total += s;\n    int half = total / 2;\n    boolean[] dp = new boolean[half + 1];\n    dp[0] = true;\n    for (int s : stones) {\n        for (int w = half; w >= s; w--) {\n            if (dp[w - s]) dp[w] = true;\n        }\n    }\n    for (int w = half; w >= 0; w--) {\n        if (dp[w]) return total - 2 * w;\n    }\n    return total;\n}`,
              cpp: `int lastStoneWeightII(vector<int>& stones) {\n    int total = 0;\n    for (int s : stones) total += s;\n    int half = total / 2;\n    vector<char> dp(half + 1, 0);\n    dp[0] = 1;\n    for (int s : stones) {\n        for (int w = half; w >= s; w--) {\n            if (dp[w - s]) dp[w] = 1;\n        }\n    }\n    for (int w = half; w >= 0; w--) {\n        if (dp[w]) return total - 2 * w;\n    }\n    return total;\n}`,
              c: `int lastStoneWeightII(int* stones, int stonesSize) {\n    int total = 0;\n    for (int i = 0; i < stonesSize; i++) total += stones[i];\n    int half = total / 2;\n    char* dp = (char*) calloc(half + 1, 1);\n    dp[0] = 1;\n    for (int i = 0; i < stonesSize; i++) {\n        for (int w = half; w >= stones[i]; w--) {\n            if (dp[w - stones[i]]) dp[w] = 1;\n        }\n    }\n    int result = total;\n    for (int w = half; w >= 0; w--) {\n        if (dp[w]) { result = total - 2 * w; break; }\n    }\n    free(dp);\n    return result;\n}`,
              csharp: `public static int LastStoneWeightII(int[] stones)\n{\n    int total = 0;\n    foreach (int s in stones) total += s;\n    int half = total / 2;\n    bool[] dp = new bool[half + 1];\n    dp[0] = true;\n    foreach (int s in stones)\n    {\n        for (int w = half; w >= s; w--)\n        {\n            if (dp[w - s]) dp[w] = true;\n        }\n    }\n    for (int w = half; w >= 0; w--)\n    {\n        if (dp[w]) return total - 2 * w;\n    }\n    return total;\n}`,
              go: `func lastStoneWeightII(stones []int) int {\n	total := 0\n	for _, s := range stones {\n		total += s\n	}\n	half := total / 2\n	dp := make([]bool, half+1)\n	dp[0] = true\n	for _, s := range stones {\n		for w := half; w >= s; w-- {\n			if dp[w-s] {\n				dp[w] = true\n			}\n		}\n	}\n	for w := half; w >= 0; w-- {\n		if dp[w] {\n			return total - 2*w\n		}\n	}\n	return total\n}`,
              kotlin: `fun lastStoneWeightII(stones: IntArray): Int {\n    var total = 0\n    for (s in stones) total += s\n    val half = total / 2\n    val dp = BooleanArray(half + 1)\n    dp[0] = true\n    for (s in stones) {\n        var w = half\n        while (w >= s) {\n            if (dp[w - s]) dp[w] = true\n            w--\n        }\n    }\n    var w = half\n    while (w >= 0) {\n        if (dp[w]) return total - 2 * w\n        w--\n    }\n    return total\n}`,
              swift: `func lastStoneWeightII(_ stones: [Int]) -> Int {\n    var total = 0\n    for s in stones { total += s }\n    let half = total / 2\n    var dp = [Bool](repeating: false, count: half + 1)\n    dp[0] = true\n    for s in stones {\n        var w = half\n        while w >= s {\n            if dp[w - s] { dp[w] = true }\n            w -= 1\n        }\n    }\n    var w = half\n    while w >= 0 {\n        if dp[w] { return total - 2 * w }\n        w -= 1\n    }\n    return total\n}`,
              rust: `fn lastStoneWeightII(stones: Vec<i32>) -> i32 {\n    let total: i32 = stones.iter().sum();\n    let half = (total / 2) as usize;\n    let mut dp = vec![false; half + 1];\n    dp[0] = true;\n    for s in stones.iter() {\n        let step = *s as usize;\n        let mut w = half as i32;\n        while w >= *s {\n            let idx = w as usize;\n            if dp[idx - step] {\n                dp[idx] = true;\n            }\n            w -= 1;\n        }\n    }\n    let mut w = half as i32;\n    while w >= 0 {\n        if dp[w as usize] {\n            return total - 2 * w;\n        }\n        w -= 1;\n    }\n    total\n}`,
              php: `function lastStoneWeightII($stones) {\n    $total = array_sum($stones);\n    $half = intdiv($total, 2);\n    $dp = array_fill(0, $half + 1, false);\n    $dp[0] = true;\n    foreach ($stones as $s) {\n        for ($w = $half; $w >= $s; $w--) {\n            if ($dp[$w - $s]) $dp[$w] = true;\n        }\n    }\n    for ($w = $half; $w >= 0; $w--) {\n        if ($dp[$w]) return $total - 2 * $w;\n    }\n    return $total;\n}`,
              ruby: `def lastStoneWeightII(stones)\n  total = stones.sum\n  half = total / 2\n  dp = Array.new(half + 1, false)\n  dp[0] = true\n  stones.each do |s|\n    w = half\n    while w >= s\n      dp[w] = true if dp[w - s]\n      w -= 1\n    end\n  end\n  w = half\n  while w >= 0\n    return total - 2 * w if dp[w]\n    w -= 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Ones and Zeroes ─────────────────────────────────────────────
  (() => {
    const ref = (strs: string[], m: number, n: number) => {
      const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
      for (let s = 0; s < strs.length; s++) {
        let zeros = 0, ones = 0;
        for (let k = 0; k < strs[s].length; k++) {
          if (strs[s][k] === "0") zeros++;
          else ones++;
        }
        for (let i = m; i >= zeros; i--) {
          for (let j = n; j >= ones; j--) {
            const candidate = dp[i - zeros][j - ones] + 1;
            if (candidate > dp[i][j]) dp[i][j] = candidate;
          }
        }
      }
      return dp[m][n];
    };
    return {
      slug: "ones-and-zeroes",
      title: "Ones and Zeroes",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "String", "Dynamic Programming", "Amazon", "Google", "Adobe"],
      signature: { funcName: "findMaxForm", params: [{ name: "strs", type: "string[]" as const }, { name: "m", type: "int" as const }, { name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array of binary strings `strs` and two integers `m` and `n`.\n\nReturn the size of the largest subset of `strs` that uses at most `m` zeros and `n` ones in total.",
        [
          { in: 'strs = ["10","0001","111001","1","0"], m = 5, n = 3', out: "4", note: 'One largest subset is {"10","0001","1","0"}.' },
          { in: 'strs = ["10","0","1"], m = 1, n = 1', out: "2", note: 'Either {"10"} alone or {"0","1"} — the latter is bigger.' },
          { in: 'strs = ["0"], m = 0, n = 0', out: "0" },
        ],
        ["1 <= strs.length <= 20", "1 <= strs[i].length <= 10", "strs[i] consists of '0' and '1'.", "0 <= m, n <= 20"]),
      hints: [
        "This is a knapsack with **two** capacities — zeros and ones — instead of one.",
        "`dp[i][j]` is the largest subset using at most `i` zeros and `j` ones.",
        "Process one string at a time and iterate both capacities **downward**, so each string is used at most once.",
      ],
      examples: [
        { input: '["10","0001","111001","1","0"]\n5\n3', expectedOutput: "4" },
        { input: '["10","0","1"]\n1\n1', expectedOutput: "2" },
        { input: '["0"]\n0\n0', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const count = ri(rng, 1, 12);
        const strs = Array.from({ length: count }, () => randStr(rng, 1, 10, "01"));
        const m = ri(rng, 0, 20);
        const n = ri(rng, 0, 20);
        return { input: `${fmtStrArr(strs)}\n${m}\n${n}`, expectedOutput: String(ref(strs, m, n)) };
      },
      solutions: {
        python: `def findMaxForm(strs, m: int, n: int) -> int:\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for s in strs:\n        zeros = s.count("0")\n        ones = len(s) - zeros\n        for i in range(m, zeros - 1, -1):\n            for j in range(n, ones - 1, -1):\n                dp[i][j] = max(dp[i][j], dp[i - zeros][j - ones] + 1)\n    return dp[m][n]`,
        javascript: `var findMaxForm = function(strs, m, n) {\n    const dp = [];\n    for (let i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(0));\n    for (let s = 0; s < strs.length; s++) {\n        let zeros = 0, ones = 0;\n        for (let k = 0; k < strs[s].length; k++) {\n            if (strs[s][k] === "0") zeros++;\n            else ones++;\n        }\n        for (let i = m; i >= zeros; i--) {\n            for (let j = n; j >= ones; j--) {\n                const candidate = dp[i - zeros][j - ones] + 1;\n                if (candidate > dp[i][j]) dp[i][j] = candidate;\n            }\n        }\n    }\n    return dp[m][n];\n};`,
              typescript: `function findMaxForm(strs: string[], m: number, n: number): number {\n    var dp: number[][] = [];\n    for (var i = 0; i <= m; i++) {\n        var row: number[] = [];\n        for (var j = 0; j <= n; j++) row.push(0);\n        dp.push(row);\n    }\n    for (var s = 0; s < strs.length; s++) {\n        var zeros = 0;\n        var ones = 0;\n        for (var k = 0; k < strs[s].length; k++) {\n            if (strs[s].charAt(k) === "0") zeros++;\n            else ones++;\n        }\n        for (var a = m; a >= zeros; a--) {\n            for (var b = n; b >= ones; b--) {\n                var candidate = dp[a - zeros][b - ones] + 1;\n                if (candidate > dp[a][b]) dp[a][b] = candidate;\n            }\n        }\n    }\n    return dp[m][n];\n}`,
              java: `public static int findMaxForm(String[] strs, int m, int n) {\n    int[][] dp = new int[m + 1][n + 1];\n    for (String s : strs) {\n        int zeros = 0, ones = 0;\n        for (int k = 0; k < s.length(); k++) {\n            if (s.charAt(k) == '0') zeros++;\n            else ones++;\n        }\n        for (int i = m; i >= zeros; i--) {\n            for (int j = n; j >= ones; j--) {\n                dp[i][j] = Math.max(dp[i][j], dp[i - zeros][j - ones] + 1);\n            }\n        }\n    }\n    return dp[m][n];\n}`,
              cpp: `int findMaxForm(vector<string>& strs, int m, int n) {\n    vector<vector<int>> dp(m + 1, vector<int>(n + 1, 0));\n    for (string& s : strs) {\n        int zeros = 0, ones = 0;\n        for (char c : s) {\n            if (c == '0') zeros++;\n            else ones++;\n        }\n        for (int i = m; i >= zeros; i--) {\n            for (int j = n; j >= ones; j--) {\n                dp[i][j] = max(dp[i][j], dp[i - zeros][j - ones] + 1);\n            }\n        }\n    }\n    return dp[m][n];\n}`,
              c: `int findMaxForm(char** strs, int strsSize, int m, int n) {\n    int* dp = (int*) calloc((m + 1) * (n + 1), sizeof(int));\n    for (int s = 0; s < strsSize; s++) {\n        int zeros = 0, ones = 0;\n        for (int k = 0; strs[s][k] != '\\0'; k++) {\n            if (strs[s][k] == '0') zeros++;\n            else ones++;\n        }\n        for (int i = m; i >= zeros; i--) {\n            for (int j = n; j >= ones; j--) {\n                int candidate = dp[(i - zeros) * (n + 1) + (j - ones)] + 1;\n                if (candidate > dp[i * (n + 1) + j]) dp[i * (n + 1) + j] = candidate;\n            }\n        }\n    }\n    int result = dp[m * (n + 1) + n];\n    free(dp);\n    return result;\n}`,
              csharp: `public static int FindMaxForm(string[] strs, int m, int n)\n{\n    int[][] dp = new int[m + 1][];\n    for (int i = 0; i <= m; i++) dp[i] = new int[n + 1];\n    foreach (string s in strs)\n    {\n        int zeros = 0, ones = 0;\n        foreach (char c in s)\n        {\n            if (c == '0') zeros++;\n            else ones++;\n        }\n        for (int i = m; i >= zeros; i--)\n        {\n            for (int j = n; j >= ones; j--)\n            {\n                dp[i][j] = Math.Max(dp[i][j], dp[i - zeros][j - ones] + 1);\n            }\n        }\n    }\n    return dp[m][n];\n}`,
              go: `func findMaxForm(strs []string, m int, n int) int {\n	dp := make([][]int, m+1)\n	for i := range dp {\n		dp[i] = make([]int, n+1)\n	}\n	for _, s := range strs {\n		zeros, ones := 0, 0\n		for i := 0; i < len(s); i++ {\n			if s[i] == '0' {\n				zeros++\n			} else {\n				ones++\n			}\n		}\n		for i := m; i >= zeros; i-- {\n			for j := n; j >= ones; j-- {\n				if dp[i-zeros][j-ones]+1 > dp[i][j] {\n					dp[i][j] = dp[i-zeros][j-ones] + 1\n				}\n			}\n		}\n	}\n	return dp[m][n]\n}`,
              kotlin: `fun findMaxForm(strs: Array<String>, m: Int, n: Int): Int {\n    val dp = Array(m + 1) { IntArray(n + 1) }\n    for (s in strs) {\n        var zeros = 0\n        var ones = 0\n        for (c in s) {\n            if (c == '0') zeros++ else ones++\n        }\n        var i = m\n        while (i >= zeros) {\n            var j = n\n            while (j >= ones) {\n                val candidate = dp[i - zeros][j - ones] + 1\n                if (candidate > dp[i][j]) dp[i][j] = candidate\n                j--\n            }\n            i--\n        }\n    }\n    return dp[m][n]\n}`,
              swift: `func findMaxForm(_ strs: [String], _ m: Int, _ n: Int) -> Int {\n    var dp = [[Int]](repeating: [Int](repeating: 0, count: n + 1), count: m + 1)\n    for s in strs {\n        var zeros = 0\n        var ones = 0\n        for c in s {\n            if c == "0" { zeros += 1 } else { ones += 1 }\n        }\n        var i = m\n        while i >= zeros {\n            var j = n\n            while j >= ones {\n                let candidate = dp[i - zeros][j - ones] + 1\n                if candidate > dp[i][j] { dp[i][j] = candidate }\n                j -= 1\n            }\n            i -= 1\n        }\n    }\n    return dp[m][n]\n}`,
              rust: `fn findMaxForm(strs: Vec<String>, m: i32, n: i32) -> i32 {\n    let rows = m as usize;\n    let cols = n as usize;\n    let mut dp = vec![vec![0i32; cols + 1]; rows + 1];\n    for s in strs.iter() {\n        let mut zeros = 0usize;\n        let mut ones = 0usize;\n        for b in s.as_bytes().iter() {\n            if *b == b'0' {\n                zeros += 1;\n            } else {\n                ones += 1;\n            }\n        }\n        if zeros > rows || ones > cols {\n            continue;\n        }\n        let mut i = rows;\n        while i >= zeros {\n            let mut j = cols;\n            while j >= ones {\n                let candidate = dp[i - zeros][j - ones] + 1;\n                if candidate > dp[i][j] {\n                    dp[i][j] = candidate;\n                }\n                if j == ones {\n                    break;\n                }\n                j -= 1;\n            }\n            if i == zeros {\n                break;\n            }\n            i -= 1;\n        }\n    }\n    dp[rows][cols]\n}`,
              php: `function findMaxForm($strs, $m, $n) {\n    $dp = array();\n    for ($i = 0; $i <= $m; $i++) $dp[] = array_fill(0, $n + 1, 0);\n    foreach ($strs as $s) {\n        $zeros = substr_count($s, "0");\n        $ones = strlen($s) - $zeros;\n        for ($i = $m; $i >= $zeros; $i--) {\n            for ($j = $n; $j >= $ones; $j--) {\n                $candidate = $dp[$i - $zeros][$j - $ones] + 1;\n                if ($candidate > $dp[$i][$j]) $dp[$i][$j] = $candidate;\n            }\n        }\n    }\n    return $dp[$m][$n];\n}`,
              ruby: `def findMaxForm(strs, m, n)\n  dp = Array.new(m + 1) { Array.new(n + 1, 0) }\n  strs.each do |s|\n    zeros = s.count("0")\n    ones = s.length - zeros\n    i = m\n    while i >= zeros\n      j = n\n      while j >= ones\n        candidate = dp[i - zeros][j - ones] + 1\n        dp[i][j] = candidate if candidate > dp[i][j]\n        j -= 1\n      end\n      i -= 1\n    end\n  end\n  dp[m][n]\nend`,
      },
    };
  })(),

  // ── Combination Sum IV ──────────────────────────────────────────
  (() => {
    const ref = (nums: number[], target: number) => {
      const dp = new Array(target + 1).fill(0);
      dp[0] = 1;
      for (let t = 1; t <= target; t++) {
        for (let i = 0; i < nums.length; i++) {
          if (nums[i] <= t) dp[t] += dp[t - nums[i]];
        }
      }
      return dp[target];
    };
    return {
      slug: "combination-sum-iv",
      title: "Combination Sum IV",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Meta", "Adobe"],
      signature: { funcName: "combinationSum4", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an array of **distinct** integers `nums` and a target integer `target`, return the number of possible combinations that add up to `target`.\n\nSequences with the same numbers in a **different order** count as different combinations.",
        [
          { in: "nums = [1,2,3], target = 4", out: "7", note: "(1,1,1,1), (1,1,2), (1,2,1), (1,3), (2,1,1), (2,2), (3,1)." },
          { in: "nums = [9], target = 3", out: "0" },
          { in: "nums = [2,3], target = 6", out: "2", note: "2+2+2 and 3+3." },
        ],
        ["1 <= nums.length <= 12", "1 <= nums[i] <= 100", "All elements of nums are distinct.", "1 <= target <= 200", "The answer fits in a signed 32-bit integer."]),
      hints: [
        "Order matters, so the outer loop must be over the **target**, with the choice of number inside.",
        "`dp[t] = Σ dp[t - num]` over every `num` that fits — each term is the count of sequences whose last element is `num`.",
        "Swapping the loop order would count unordered combinations instead, which is a different problem.",
      ],
      examples: [
        { input: "[1,2,3]\n4", expectedOutput: "7" },
        { input: "[9]\n3", expectedOutput: "0" },
        { input: "[2,3]\n6", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const pool = shuffle(rng, Array.from({ length: 40 }, (_, i) => i + 1));
        const nums = pool.slice(0, ri(rng, 1, 6));
        const target = ri(rng, 1, 30);
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: String(ref(nums, target)) };
      },
      solutions: {
        python: `def combinationSum4(nums, target: int) -> int:\n    dp = [0] * (target + 1)\n    dp[0] = 1\n    for t in range(1, target + 1):\n        for num in nums:\n            if num <= t:\n                dp[t] += dp[t - num]\n    return dp[target]`,
        javascript: `var combinationSum4 = function(nums, target) {\n    const dp = new Array(target + 1).fill(0);\n    dp[0] = 1;\n    for (let t = 1; t <= target; t++) {\n        for (let i = 0; i < nums.length; i++) {\n            if (nums[i] <= t) dp[t] += dp[t - nums[i]];\n        }\n    }\n    return dp[target];\n};`,
              typescript: `function combinationSum4(nums: number[], target: number): number {\n    var dp: number[] = [];\n    for (var k = 0; k <= target; k++) dp.push(0);\n    dp[0] = 1;\n    for (var t = 1; t <= target; t++) {\n        for (var i = 0; i < nums.length; i++) {\n            if (nums[i] <= t) dp[t] += dp[t - nums[i]];\n        }\n    }\n    return dp[target];\n}`,
              java: `public static int combinationSum4(int[] nums, int target) {\n    int[] dp = new int[target + 1];\n    dp[0] = 1;\n    for (int t = 1; t <= target; t++) {\n        for (int num : nums) {\n            if (num <= t) dp[t] += dp[t - num];\n        }\n    }\n    return dp[target];\n}`,
              cpp: `int combinationSum4(vector<int>& nums, int target) {\n    vector<long long> dp(target + 1, 0);\n    dp[0] = 1;\n    for (int t = 1; t <= target; t++) {\n        for (int num : nums) {\n            if (num <= t) dp[t] += dp[t - num];\n        }\n    }\n    return (int) dp[target];\n}`,
              c: `int combinationSum4(int* nums, int numsSize, int target) {\n    long long* dp = (long long*) calloc(target + 1, sizeof(long long));\n    dp[0] = 1;\n    for (int t = 1; t <= target; t++) {\n        for (int i = 0; i < numsSize; i++) {\n            if (nums[i] <= t) dp[t] += dp[t - nums[i]];\n        }\n    }\n    int result = (int) dp[target];\n    free(dp);\n    return result;\n}`,
              csharp: `public static int CombinationSum4(int[] nums, int target)\n{\n    long[] dp = new long[target + 1];\n    dp[0] = 1;\n    for (int t = 1; t <= target; t++)\n    {\n        foreach (int num in nums)\n        {\n            if (num <= t) dp[t] += dp[t - num];\n        }\n    }\n    return (int) dp[target];\n}`,
              go: `func combinationSum4(nums []int, target int) int {\n	dp := make([]int, target+1)\n	dp[0] = 1\n	for t := 1; t <= target; t++ {\n		for _, num := range nums {\n			if num <= t {\n				dp[t] += dp[t-num]\n			}\n		}\n	}\n	return dp[target]\n}`,
              kotlin: `fun combinationSum4(nums: IntArray, target: Int): Int {\n    val dp = LongArray(target + 1)\n    dp[0] = 1\n    for (t in 1..target) {\n        for (num in nums) {\n            if (num <= t) dp[t] += dp[t - num]\n        }\n    }\n    return dp[target].toInt()\n}`,
              swift: `func combinationSum4(_ nums: [Int], _ target: Int) -> Int {\n    var dp = [Int](repeating: 0, count: target + 1)\n    dp[0] = 1\n    var t = 1\n    while t <= target {\n        for num in nums where num <= t {\n            dp[t] += dp[t - num]\n        }\n        t += 1\n    }\n    return dp[target]\n}`,
              rust: `fn combinationSum4(nums: Vec<i32>, target: i32) -> i32 {\n    let size = target as usize;\n    let mut dp = vec![0i64; size + 1];\n    dp[0] = 1;\n    for t in 1..=size {\n        for num in nums.iter() {\n            let step = *num as usize;\n            if step <= t {\n                dp[t] += dp[t - step];\n            }\n        }\n    }\n    dp[size] as i32\n}`,
              php: `function combinationSum4($nums, $target) {\n    $dp = array_fill(0, $target + 1, 0);\n    $dp[0] = 1;\n    for ($t = 1; $t <= $target; $t++) {\n        foreach ($nums as $num) {\n            if ($num <= $t) $dp[$t] += $dp[$t - $num];\n        }\n    }\n    return $dp[$target];\n}`,
              ruby: `def combinationSum4(nums, target)\n  dp = Array.new(target + 1, 0)\n  dp[0] = 1\n  (1..target).each do |t|\n    nums.each do |num|\n      dp[t] += dp[t - num] if num <= t\n    end\n  end\n  dp[target]\nend`,
      },
    };
  })(),

  // ── Longest String Chain ────────────────────────────────────────
  (() => {
    const isPredecessor = (a: string, b: string) => {
      if (b.length !== a.length + 1) return false;
      let i = 0, j = 0, skips = 0;
      while (i < a.length && j < b.length) {
        if (a[i] === b[j]) { i++; j++; }
        else { skips++; j++; if (skips > 1) return false; }
      }
      return true;
    };
    const ref = (words: string[]) => {
      const sorted = words.slice().sort((a, b) => a.length - b.length);
      const best = new Array(sorted.length).fill(1);
      let answer = 1;
      for (let i = 0; i < sorted.length; i++) {
        for (let j = 0; j < i; j++) {
          if (isPredecessor(sorted[j], sorted[i]) && best[j] + 1 > best[i]) best[i] = best[j] + 1;
        }
        if (best[i] > answer) answer = best[i];
      }
      return answer;
    };
    return {
      slug: "longest-string-chain",
      title: "Longest String Chain",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Two Pointers", "String", "Dynamic Programming", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "longestStrChain", params: [{ name: "words", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "`wordA` is a **predecessor** of `wordB` if inserting exactly one letter somewhere in `wordA` — without reordering the rest — produces `wordB`.\n\nA **word chain** is a sequence where each word is a predecessor of the next. Given an array of `words`, return the length of the longest possible chain.",
        [
          { in: 'words = ["a","b","ba","bca","bda","bdca"]', out: "4", note: 'One longest chain is "a" → "ba" → "bda" → "bdca".' },
          { in: 'words = ["xbc","pcxbcf","xb","cxbc","pcxbc"]', out: "5" },
          { in: 'words = ["abcd","dbqca"]', out: "1" },
        ],
        ["1 <= words.length <= 20", "1 <= words[i].length <= 8", "words[i] consists of lowercase English letters."]),
      hints: [
        "A predecessor is always exactly one character shorter, so sort by length and the chain only ever moves forward.",
        "`best[i]` is the longest chain ending at word `i`; extend it from any earlier word that is a predecessor.",
        "Checking the predecessor relation is a two-pointer walk allowing a single skip in the longer word.",
      ],
      examples: [
        { input: '["a","b","ba","bca","bda","bdca"]', expectedOutput: "4" },
        { input: '["xbc","pcxbcf","xb","cxbc","pcxbc"]', expectedOutput: "5" },
        { input: '["abcd","dbqca"]', expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcd";
        const words: string[] = [];
        const count = ri(rng, 1, 14);
        for (let i = 0; i < count; i++) {
          if (words.length > 0 && rng() < 0.5) {
            const base = words[ri(rng, 0, words.length - 1)];
            if (base.length < 8) {
              const pos = ri(rng, 0, base.length);
              words.push(base.slice(0, pos) + alphabet[ri(rng, 0, 3)] + base.slice(pos));
              continue;
            }
          }
          words.push(randStr(rng, 1, 8, alphabet));
        }
        return { input: fmtStrArr(words), expectedOutput: String(ref(words)) };
      },
      solutions: {
        python: `def longestStrChain(words) -> int:\n    def is_predecessor(a, b):\n        if len(b) != len(a) + 1:\n            return False\n        i = j = skips = 0\n        while i < len(a) and j < len(b):\n            if a[i] == b[j]:\n                i += 1\n                j += 1\n            else:\n                skips += 1\n                j += 1\n                if skips > 1:\n                    return False\n        return True\n\n    ordered = sorted(words, key=len)\n    best = [1] * len(ordered)\n    answer = 1\n    for i in range(len(ordered)):\n        for j in range(i):\n            if is_predecessor(ordered[j], ordered[i]):\n                best[i] = max(best[i], best[j] + 1)\n        answer = max(answer, best[i])\n    return answer`,
        javascript: `var longestStrChain = function(words) {\n    const isPredecessor = function(a, b) {\n        if (b.length !== a.length + 1) return false;\n        let i = 0, j = 0, skips = 0;\n        while (i < a.length && j < b.length) {\n            if (a[i] === b[j]) { i++; j++; }\n            else {\n                skips++;\n                j++;\n                if (skips > 1) return false;\n            }\n        }\n        return true;\n    };\n    const sorted = words.slice().sort(function(a, b) { return a.length - b.length; });\n    const best = new Array(sorted.length).fill(1);\n    let answer = 1;\n    for (let i = 0; i < sorted.length; i++) {\n        for (let j = 0; j < i; j++) {\n            if (isPredecessor(sorted[j], sorted[i]) && best[j] + 1 > best[i]) best[i] = best[j] + 1;\n        }\n        if (best[i] > answer) answer = best[i];\n    }\n    return answer;\n};`,
              typescript: `function longestStrChain(words: string[]): number {\n    var isPredecessor = function (a: string, b: string): boolean {\n        if (b.length !== a.length + 1) return false;\n        var i = 0;\n        var j = 0;\n        var skips = 0;\n        while (i < a.length && j < b.length) {\n            if (a.charAt(i) === b.charAt(j)) { i++; j++; }\n            else {\n                skips++;\n                j++;\n                if (skips > 1) return false;\n            }\n        }\n        return true;\n    };\n    var sorted = words.slice();\n    sorted.sort(function (a, b) { return a.length - b.length; });\n    var best: number[] = [];\n    for (var k = 0; k < sorted.length; k++) best.push(1);\n    var answer = 1;\n    for (var x = 0; x < sorted.length; x++) {\n        for (var y = 0; y < x; y++) {\n            if (isPredecessor(sorted[y], sorted[x]) && best[y] + 1 > best[x]) best[x] = best[y] + 1;\n        }\n        if (best[x] > answer) answer = best[x];\n    }\n    return answer;\n}`,
              java: `public static int longestStrChain(String[] words) {\n    String[] sorted = Arrays.copyOf(words, words.length);\n    Arrays.sort(sorted, new Comparator<String>() {\n        public int compare(String a, String b) { return a.length() - b.length(); }\n    });\n    int n = sorted.length;\n    int[] best = new int[n];\n    Arrays.fill(best, 1);\n    int answer = 1;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < i; j++) {\n            if (isPredecessorChain(sorted[j], sorted[i]) && best[j] + 1 > best[i]) best[i] = best[j] + 1;\n        }\n        if (best[i] > answer) answer = best[i];\n    }\n    return answer;\n}\n\nprivate static boolean isPredecessorChain(String a, String b) {\n    if (b.length() != a.length() + 1) return false;\n    int i = 0, j = 0, skips = 0;\n    while (i < a.length() && j < b.length()) {\n        if (a.charAt(i) == b.charAt(j)) { i++; j++; }\n        else {\n            skips++;\n            j++;\n            if (skips > 1) return false;\n        }\n    }\n    return true;\n}`,
              cpp: `static bool isPredecessorChain(const string& a, const string& b) {\n    if (b.size() != a.size() + 1) return false;\n    size_t i = 0, j = 0;\n    int skips = 0;\n    while (i < a.size() && j < b.size()) {\n        if (a[i] == b[j]) { i++; j++; }\n        else {\n            skips++;\n            j++;\n            if (skips > 1) return false;\n        }\n    }\n    return true;\n}\n\nint longestStrChain(vector<string>& words) {\n    vector<string> sorted = words;\n    sort(sorted.begin(), sorted.end(), [](const string& a, const string& b) {\n        return a.size() < b.size();\n    });\n    int n = (int) sorted.size();\n    vector<int> best(n, 1);\n    int answer = 1;\n    for (int i = 0; i < n; i++) {\n        for (int j = 0; j < i; j++) {\n            if (isPredecessorChain(sorted[j], sorted[i]) && best[j] + 1 > best[i]) best[i] = best[j] + 1;\n        }\n        answer = max(answer, best[i]);\n    }\n    return answer;\n}`,
              c: `static bool isPredecessorChain(const char* a, const char* b) {\n    int la = (int) strlen(a);\n    int lb = (int) strlen(b);\n    if (lb != la + 1) return false;\n    int i = 0, j = 0, skips = 0;\n    while (i < la && j < lb) {\n        if (a[i] == b[j]) { i++; j++; }\n        else {\n            skips++;\n            j++;\n            if (skips > 1) return false;\n        }\n    }\n    return true;\n}\n\nint longestStrChain(char** words, int wordsSize) {\n    char** sorted = (char**) malloc(sizeof(char*) * wordsSize);\n    for (int i = 0; i < wordsSize; i++) sorted[i] = words[i];\n    for (int i = 1; i < wordsSize; i++) {\n        char* key = sorted[i];\n        int j = i - 1;\n        while (j >= 0 && (int) strlen(sorted[j]) > (int) strlen(key)) {\n            sorted[j + 1] = sorted[j];\n            j--;\n        }\n        sorted[j + 1] = key;\n    }\n    int* best = (int*) malloc(sizeof(int) * wordsSize);\n    for (int i = 0; i < wordsSize; i++) best[i] = 1;\n    int answer = 1;\n    for (int i = 0; i < wordsSize; i++) {\n        for (int j = 0; j < i; j++) {\n            if (isPredecessorChain(sorted[j], sorted[i]) && best[j] + 1 > best[i]) best[i] = best[j] + 1;\n        }\n        if (best[i] > answer) answer = best[i];\n    }\n    free(sorted);\n    free(best);\n    return answer;\n}`,
              csharp: `public static int LongestStrChain(string[] words)\n{\n    string[] sorted = (string[]) words.Clone();\n    Array.Sort(sorted, delegate (string a, string b) { return a.Length - b.Length; });\n    int n = sorted.Length;\n    int[] best = new int[n];\n    for (int i = 0; i < n; i++) best[i] = 1;\n    int answer = 1;\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = 0; j < i; j++)\n        {\n            if (IsPredecessorChain(sorted[j], sorted[i]) && best[j] + 1 > best[i]) best[i] = best[j] + 1;\n        }\n        if (best[i] > answer) answer = best[i];\n    }\n    return answer;\n}\n\nprivate static bool IsPredecessorChain(string a, string b)\n{\n    if (b.Length != a.Length + 1) return false;\n    int i = 0, j = 0, skips = 0;\n    while (i < a.Length && j < b.Length)\n    {\n        if (a[i] == b[j]) { i++; j++; }\n        else\n        {\n            skips++;\n            j++;\n            if (skips > 1) return false;\n        }\n    }\n    return true;\n}`,
              go: `func longestStrChain(words []string) int {\n	isPredecessor := func(a, b string) bool {\n		if len(b) != len(a)+1 {\n			return false\n		}\n		i, j, skips := 0, 0, 0\n		for i < len(a) && j < len(b) {\n			if a[i] == b[j] {\n				i++\n				j++\n			} else {\n				skips++\n				j++\n				if skips > 1 {\n					return false\n				}\n			}\n		}\n		return true\n	}\n	sorted := make([]string, len(words))\n	copy(sorted, words)\n	sort.Slice(sorted, func(i, j int) bool { return len(sorted[i]) < len(sorted[j]) })\n	best := make([]int, len(sorted))\n	for i := range best {\n		best[i] = 1\n	}\n	answer := 1\n	for i := 0; i < len(sorted); i++ {\n		for j := 0; j < i; j++ {\n			if isPredecessor(sorted[j], sorted[i]) && best[j]+1 > best[i] {\n				best[i] = best[j] + 1\n			}\n		}\n		if best[i] > answer {\n			answer = best[i]\n		}\n	}\n	return answer\n}`,
              kotlin: `fun longestStrChain(words: Array<String>): Int {\n    fun isPredecessor(a: String, b: String): Boolean {\n        if (b.length != a.length + 1) return false\n        var i = 0\n        var j = 0\n        var skips = 0\n        while (i < a.length && j < b.length) {\n            if (a[i] == b[j]) {\n                i++\n                j++\n            } else {\n                skips++\n                j++\n                if (skips > 1) return false\n            }\n        }\n        return true\n    }\n    val sorted = words.sortedBy { it.length }\n    val best = IntArray(sorted.size) { 1 }\n    var answer = 1\n    for (i in sorted.indices) {\n        for (j in 0 until i) {\n            if (isPredecessor(sorted[j], sorted[i]) && best[j] + 1 > best[i]) best[i] = best[j] + 1\n        }\n        if (best[i] > answer) answer = best[i]\n    }\n    return answer\n}`,
              swift: `func longestStrChain(_ words: [String]) -> Int {\n    func isPredecessor(_ a: [Character], _ b: [Character]) -> Bool {\n        if b.count != a.count + 1 { return false }\n        var i = 0\n        var j = 0\n        var skips = 0\n        while i < a.count && j < b.count {\n            if a[i] == b[j] {\n                i += 1\n                j += 1\n            } else {\n                skips += 1\n                j += 1\n                if skips > 1 { return false }\n            }\n        }\n        return true\n    }\n    let sorted = words.sorted { $0.count < $1.count }.map { Array($0) }\n    var best = [Int](repeating: 1, count: sorted.count)\n    var answer = 1\n    for i in 0..<sorted.count {\n        for j in 0..<i {\n            if isPredecessor(sorted[j], sorted[i]) && best[j] + 1 > best[i] { best[i] = best[j] + 1 }\n        }\n        if best[i] > answer { answer = best[i] }\n    }\n    return answer\n}`,
              rust: `fn longestStrChain(words: Vec<String>) -> i32 {\n    fn is_predecessor(a: &[u8], b: &[u8]) -> bool {\n        if b.len() != a.len() + 1 {\n            return false;\n        }\n        let mut i = 0;\n        let mut j = 0;\n        let mut skips = 0;\n        while i < a.len() && j < b.len() {\n            if a[i] == b[j] {\n                i += 1;\n                j += 1;\n            } else {\n                skips += 1;\n                j += 1;\n                if skips > 1 {\n                    return false;\n                }\n            }\n        }\n        true\n    }\n    let mut sorted: Vec<String> = words.clone();\n    sorted.sort_by(|a, b| a.len().cmp(&b.len()));\n    let n = sorted.len();\n    let mut best = vec![1i32; n];\n    let mut answer = 1;\n    for i in 0..n {\n        for j in 0..i {\n            if is_predecessor(sorted[j].as_bytes(), sorted[i].as_bytes()) && best[j] + 1 > best[i] {\n                best[i] = best[j] + 1;\n            }\n        }\n        if best[i] > answer {\n            answer = best[i];\n        }\n    }\n    answer\n}`,
              php: `function longestStrChain($words) {\n    $isPredecessor = function ($a, $b) {\n        if (strlen($b) !== strlen($a) + 1) return false;\n        $i = 0;\n        $j = 0;\n        $skips = 0;\n        while ($i < strlen($a) && $j < strlen($b)) {\n            if ($a[$i] === $b[$j]) { $i++; $j++; }\n            else {\n                $skips++;\n                $j++;\n                if ($skips > 1) return false;\n            }\n        }\n        return true;\n    };\n    $sorted = $words;\n    usort($sorted, function ($a, $b) { return strlen($a) - strlen($b); });\n    $n = count($sorted);\n    $best = array_fill(0, $n, 1);\n    $answer = 1;\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = 0; $j < $i; $j++) {\n            if ($isPredecessor($sorted[$j], $sorted[$i]) && $best[$j] + 1 > $best[$i]) {\n                $best[$i] = $best[$j] + 1;\n            }\n        }\n        if ($best[$i] > $answer) $answer = $best[$i];\n    }\n    return $answer;\n}`,

        ruby: `def longestStrChain(words)\n  is_predecessor = lambda do |a, b|\n    return false if b.length != a.length + 1\n    i = 0\n    j = 0\n    skips = 0\n    while i < a.length && j < b.length\n      if a[i] == b[j]\n        i += 1\n        j += 1\n      else\n        skips += 1\n        return false if skips > 1\n        j += 1\n      end\n    end\n    i == a.length\n  end\n  sorted = words.sort_by(&:length)\n  best = Array.new(sorted.length, 1)\n  answer = 1\n  (0...sorted.length).each do |i|\n    (0...i).each do |j|\n      best[i] = best[j] + 1 if is_predecessor.call(sorted[j], sorted[i]) && best[j] + 1 > best[i]\n    end\n    answer = best[i] if best[i] > answer\n  end\n  answer\nend`,
      },
    };
  })(),

  // ── Minimum Cost For Tickets ────────────────────────────────────
  (() => {
    const ref = (days: number[], costs: number[]) => {
      const last = days[days.length - 1];
      const travel = new Array(last + 1).fill(false);
      for (let i = 0; i < days.length; i++) travel[days[i]] = true;
      const dp = new Array(last + 1).fill(0);
      for (let d = 1; d <= last; d++) {
        if (!travel[d]) { dp[d] = dp[d - 1]; continue; }
        const one = dp[d - 1] + costs[0];
        const seven = dp[Math.max(0, d - 7)] + costs[1];
        const thirty = dp[Math.max(0, d - 30)] + costs[2];
        dp[d] = Math.min(one, Math.min(seven, thirty));
      }
      return dp[last];
    };
    return {
      slug: "minimum-cost-for-tickets",
      title: "Minimum Cost For Tickets",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Amazon", "Google", "Uber"],
      signature: { funcName: "mincostTickets", params: [{ name: "days", type: "int[]" as const }, { name: "costs", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You have planned train travel for a year, given as a **sorted** array `days` of the days you will travel, each between 1 and 365.\n\nTickets come in three kinds, priced by `costs = [oneDay, sevenDay, thirtyDay]`: a 1-day pass, a 7-day pass and a 30-day pass, each valid for that many **consecutive** days starting from the day you buy it.\n\nReturn the minimum money needed to cover every travel day.",
        [
          { in: "days = [1,4,6,7,8,20], costs = [2,7,15]", out: "11", note: "A 1-day pass on day 1, a 7-day pass on day 3, and a 1-day pass on day 20." },
          { in: "days = [1,2,3,4,5,6,7,8,9,10,30,31], costs = [2,7,15]", out: "17" },
          { in: "days = [1], costs = [5,10,20]", out: "5" },
        ],
        ["1 <= days.length <= 50", "1 <= days[i] <= 365", "days is strictly increasing.", "1 <= costs[i] <= 1000"]),
      hints: [
        "Work day by day up to the last travel day rather than pass by pass.",
        "On a non-travel day the cost is unchanged from the day before.",
        "On a travel day, try all three passes: `dp[d-1] + cost1`, `dp[d-7] + cost7`, `dp[d-30] + cost30`, clamping the index at 0.",
      ],
      examples: [
        { input: "[1,4,6,7,8,20]\n[2,7,15]", expectedOutput: "11" },
        { input: "[1,2,3,4,5,6,7,8,9,10,30,31]\n[2,7,15]", expectedOutput: "17" },
        { input: "[1]\n[5,10,20]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const set = new Set<number>();
        const count = ri(rng, 1, 50);
        while (set.size < count) set.add(ri(rng, 1, 365));
        const days = Array.from(set).sort((a, b) => a - b);
        const costs = [ri(rng, 1, 1000), ri(rng, 1, 1000), ri(rng, 1, 1000)];
        return { input: `${fmtIntArr(days)}\n${fmtIntArr(costs)}`, expectedOutput: String(ref(days, costs)) };
      },
      solutions: {
        python: `def mincostTickets(days, costs) -> int:\n    last = days[-1]\n    travel = [False] * (last + 1)\n    for d in days:\n        travel[d] = True\n    dp = [0] * (last + 1)\n    for d in range(1, last + 1):\n        if not travel[d]:\n            dp[d] = dp[d - 1]\n        else:\n            dp[d] = min(dp[d - 1] + costs[0],\n                        dp[max(0, d - 7)] + costs[1],\n                        dp[max(0, d - 30)] + costs[2])\n    return dp[last]`,
        javascript: `var mincostTickets = function(days, costs) {\n    const last = days[days.length - 1];\n    const travel = new Array(last + 1).fill(false);\n    for (let i = 0; i < days.length; i++) travel[days[i]] = true;\n    const dp = new Array(last + 1).fill(0);\n    for (let d = 1; d <= last; d++) {\n        if (!travel[d]) {\n            dp[d] = dp[d - 1];\n            continue;\n        }\n        const one = dp[d - 1] + costs[0];\n        const seven = dp[Math.max(0, d - 7)] + costs[1];\n        const thirty = dp[Math.max(0, d - 30)] + costs[2];\n        dp[d] = Math.min(one, Math.min(seven, thirty));\n    }\n    return dp[last];\n};`,
              typescript: `function mincostTickets(days: number[], costs: number[]): number {\n    var last = days[days.length - 1];\n    var travel: boolean[] = [];\n    for (var k = 0; k <= last; k++) travel.push(false);\n    for (var i = 0; i < days.length; i++) travel[days[i]] = true;\n    var dp: number[] = [];\n    for (var m = 0; m <= last; m++) dp.push(0);\n    for (var d = 1; d <= last; d++) {\n        if (!travel[d]) {\n            dp[d] = dp[d - 1];\n        } else {\n            var one = dp[d - 1] + costs[0];\n            var seven = dp[Math.max(0, d - 7)] + costs[1];\n            var thirty = dp[Math.max(0, d - 30)] + costs[2];\n            dp[d] = Math.min(one, Math.min(seven, thirty));\n        }\n    }\n    return dp[last];\n}`,
              java: `public static int mincostTickets(int[] days, int[] costs) {\n    int last = days[days.length - 1];\n    boolean[] travel = new boolean[last + 1];\n    for (int d : days) travel[d] = true;\n    int[] dp = new int[last + 1];\n    for (int d = 1; d <= last; d++) {\n        if (!travel[d]) {\n            dp[d] = dp[d - 1];\n        } else {\n            int one = dp[d - 1] + costs[0];\n            int seven = dp[Math.max(0, d - 7)] + costs[1];\n            int thirty = dp[Math.max(0, d - 30)] + costs[2];\n            dp[d] = Math.min(one, Math.min(seven, thirty));\n        }\n    }\n    return dp[last];\n}`,
              cpp: `int mincostTickets(vector<int>& days, vector<int>& costs) {\n    int last = days.back();\n    vector<char> travel(last + 1, 0);\n    for (int d : days) travel[d] = 1;\n    vector<int> dp(last + 1, 0);\n    for (int d = 1; d <= last; d++) {\n        if (!travel[d]) {\n            dp[d] = dp[d - 1];\n        } else {\n            int one = dp[d - 1] + costs[0];\n            int seven = dp[max(0, d - 7)] + costs[1];\n            int thirty = dp[max(0, d - 30)] + costs[2];\n            dp[d] = min(one, min(seven, thirty));\n        }\n    }\n    return dp[last];\n}`,
              c: `int mincostTickets(int* days, int daysSize, int* costs, int costsSize) {\n    int last = days[daysSize - 1];\n    char* travel = (char*) calloc(last + 1, 1);\n    for (int i = 0; i < daysSize; i++) travel[days[i]] = 1;\n    int* dp = (int*) calloc(last + 1, sizeof(int));\n    for (int d = 1; d <= last; d++) {\n        if (!travel[d]) {\n            dp[d] = dp[d - 1];\n        } else {\n            int a = d - 7 > 0 ? d - 7 : 0;\n            int b = d - 30 > 0 ? d - 30 : 0;\n            int one = dp[d - 1] + costs[0];\n            int seven = dp[a] + costs[1];\n            int thirty = dp[b] + costs[2];\n            int best = one < seven ? one : seven;\n            if (thirty < best) best = thirty;\n            dp[d] = best;\n        }\n    }\n    int result = dp[last];\n    free(travel);\n    free(dp);\n    return result;\n}`,
              csharp: `public static int MincostTickets(int[] days, int[] costs)\n{\n    int last = days[days.Length - 1];\n    bool[] travel = new bool[last + 1];\n    foreach (int d in days) travel[d] = true;\n    int[] dp = new int[last + 1];\n    for (int d = 1; d <= last; d++)\n    {\n        if (!travel[d])\n        {\n            dp[d] = dp[d - 1];\n        }\n        else\n        {\n            int one = dp[d - 1] + costs[0];\n            int seven = dp[Math.Max(0, d - 7)] + costs[1];\n            int thirty = dp[Math.Max(0, d - 30)] + costs[2];\n            dp[d] = Math.Min(one, Math.Min(seven, thirty));\n        }\n    }\n    return dp[last];\n}`,
              go: `func mincostTickets(days []int, costs []int) int {\n	last := days[len(days)-1]\n	travel := make([]bool, last+1)\n	for _, d := range days {\n		travel[d] = true\n	}\n	dp := make([]int, last+1)\n	for d := 1; d <= last; d++ {\n		if !travel[d] {\n			dp[d] = dp[d-1]\n			continue\n		}\n		a := d - 7\n		if a < 0 {\n			a = 0\n		}\n		b := d - 30\n		if b < 0 {\n			b = 0\n		}\n		best := dp[d-1] + costs[0]\n		if dp[a]+costs[1] < best {\n			best = dp[a] + costs[1]\n		}\n		if dp[b]+costs[2] < best {\n			best = dp[b] + costs[2]\n		}\n		dp[d] = best\n	}\n	return dp[last]\n}`,
              kotlin: `fun mincostTickets(days: IntArray, costs: IntArray): Int {\n    val last = days[days.size - 1]\n    val travel = BooleanArray(last + 1)\n    for (d in days) travel[d] = true\n    val dp = IntArray(last + 1)\n    for (d in 1..last) {\n        if (!travel[d]) {\n            dp[d] = dp[d - 1]\n        } else {\n            val one = dp[d - 1] + costs[0]\n            val seven = dp[maxOf(0, d - 7)] + costs[1]\n            val thirty = dp[maxOf(0, d - 30)] + costs[2]\n            dp[d] = minOf(one, seven, thirty)\n        }\n    }\n    return dp[last]\n}`,
              swift: `func mincostTickets(_ days: [Int], _ costs: [Int]) -> Int {\n    let last = days[days.count - 1]\n    var travel = [Bool](repeating: false, count: last + 1)\n    for d in days { travel[d] = true }\n    var dp = [Int](repeating: 0, count: last + 1)\n    var d = 1\n    while d <= last {\n        if !travel[d] {\n            dp[d] = dp[d - 1]\n        } else {\n            let one = dp[d - 1] + costs[0]\n            let seven = dp[max(0, d - 7)] + costs[1]\n            let thirty = dp[max(0, d - 30)] + costs[2]\n            dp[d] = min(one, min(seven, thirty))\n        }\n        d += 1\n    }\n    return dp[last]\n}`,
              rust: `fn mincostTickets(days: Vec<i32>, costs: Vec<i32>) -> i32 {\n    let last = days[days.len() - 1] as usize;\n    let mut travel = vec![false; last + 1];\n    for d in days.iter() {\n        travel[*d as usize] = true;\n    }\n    let mut dp = vec![0i32; last + 1];\n    for d in 1..=last {\n        if !travel[d] {\n            dp[d] = dp[d - 1];\n        } else {\n            let a = if d >= 7 { d - 7 } else { 0 };\n            let b = if d >= 30 { d - 30 } else { 0 };\n            let one = dp[d - 1] + costs[0];\n            let seven = dp[a] + costs[1];\n            let thirty = dp[b] + costs[2];\n            let mut best = one;\n            if seven < best {\n                best = seven;\n            }\n            if thirty < best {\n                best = thirty;\n            }\n            dp[d] = best;\n        }\n    }\n    dp[last]\n}`,
              php: `function mincostTickets($days, $costs) {\n    $last = $days[count($days) - 1];\n    $travel = array_fill(0, $last + 1, false);\n    foreach ($days as $d) $travel[$d] = true;\n    $dp = array_fill(0, $last + 1, 0);\n    for ($d = 1; $d <= $last; $d++) {\n        if (!$travel[$d]) {\n            $dp[$d] = $dp[$d - 1];\n        } else {\n            $one = $dp[$d - 1] + $costs[0];\n            $seven = $dp[max(0, $d - 7)] + $costs[1];\n            $thirty = $dp[max(0, $d - 30)] + $costs[2];\n            $dp[$d] = min($one, $seven, $thirty);\n        }\n    }\n    return $dp[$last];\n}`,
              ruby: `def mincostTickets(days, costs)\n  last = days[-1]\n  travel = Array.new(last + 1, false)\n  days.each { |d| travel[d] = true }\n  dp = Array.new(last + 1, 0)\n  (1..last).each do |d|\n    if !travel[d]\n      dp[d] = dp[d - 1]\n    else\n      one = dp[d - 1] + costs[0]\n      seven = dp[[0, d - 7].max] + costs[1]\n      thirty = dp[[0, d - 30].max] + costs[2]\n      dp[d] = [one, seven, thirty].min\n    end\n  end\n  dp[last]\nend`,
      },
    };
  })(),

  // ── Maximum Sum Circular Subarray ───────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let total = 0;
      let maxSum = -Infinity, curMax = 0;
      let minSum = Infinity, curMin = 0;
      for (let i = 0; i < nums.length; i++) {
        total += nums[i];
        curMax = Math.max(nums[i], curMax + nums[i]);
        if (curMax > maxSum) maxSum = curMax;
        curMin = Math.min(nums[i], curMin + nums[i]);
        if (curMin < minSum) minSum = curMin;
      }
      if (maxSum < 0) return maxSum;
      return Math.max(maxSum, total - minSum);
    };
    return {
      slug: "maximum-sum-circular-subarray",
      title: "Maximum Sum Circular Subarray",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Divide and Conquer", "Dynamic Programming", "Queue", "Amazon", "Google", "Meta"],
      signature: { funcName: "maxSubarraySumCircular", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given a **circular** integer array `nums`, return the maximum possible sum of a non-empty subarray.\n\nCircular means the end wraps around to the beginning, so a subarray may run off the end and continue from index 0. No element may be used twice.",
        [
          { in: "nums = [1,-2,3,-2]", out: "3", note: "The subarray [3]." },
          { in: "nums = [5,-3,5]", out: "10", note: "Wrap around: [5] at the end plus [5] at the start." },
          { in: "nums = [-3,-2,-3]", out: "-2" },
        ],
        ["1 <= nums.length <= 40", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "A best subarray either stays inside the array or wraps around the ends.",
        "The wrapping case is the total minus the **minimum** inner subarray, so run Kadane twice — once for the max, once for the min.",
        "Guard the all-negative case: the minimum subarray is then the whole array, and `total - minSum` would be an empty selection.",
      ],
      examples: [
        { input: "[1,-2,3,-2]", expectedOutput: "3" },
        { input: "[5,-3,5]", expectedOutput: "10" },
        { input: "[-3,-2,-3]", expectedOutput: "-2" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), rng() < 0.25 ? -1000 : -20, rng() < 0.25 ? -1 : 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def maxSubarraySumCircular(nums) -> int:\n    total = 0\n    max_sum = float("-inf")\n    cur_max = 0\n    min_sum = float("inf")\n    cur_min = 0\n    for x in nums:\n        total += x\n        cur_max = max(x, cur_max + x)\n        max_sum = max(max_sum, cur_max)\n        cur_min = min(x, cur_min + x)\n        min_sum = min(min_sum, cur_min)\n    if max_sum < 0:\n        return max_sum\n    return max(max_sum, total - min_sum)`,
        javascript: `var maxSubarraySumCircular = function(nums) {\n    let total = 0;\n    let maxSum = -Infinity, curMax = 0;\n    let minSum = Infinity, curMin = 0;\n    for (let i = 0; i < nums.length; i++) {\n        total += nums[i];\n        curMax = Math.max(nums[i], curMax + nums[i]);\n        if (curMax > maxSum) maxSum = curMax;\n        curMin = Math.min(nums[i], curMin + nums[i]);\n        if (curMin < minSum) minSum = curMin;\n    }\n    if (maxSum < 0) return maxSum;\n    return Math.max(maxSum, total - minSum);\n};`,
              typescript: `function maxSubarraySumCircular(nums: number[]): number {\n    var total = 0;\n    var maxSum = -2000000;\n    var curMax = 0;\n    var minSum = 2000000;\n    var curMin = 0;\n    for (var i = 0; i < nums.length; i++) {\n        total += nums[i];\n        curMax = Math.max(nums[i], curMax + nums[i]);\n        if (curMax > maxSum) maxSum = curMax;\n        curMin = Math.min(nums[i], curMin + nums[i]);\n        if (curMin < minSum) minSum = curMin;\n    }\n    if (maxSum < 0) return maxSum;\n    return Math.max(maxSum, total - minSum);\n}`,
              java: `public static int maxSubarraySumCircular(int[] nums) {\n    int total = 0;\n    int maxSum = -2000000, curMax = 0;\n    int minSum = 2000000, curMin = 0;\n    for (int x : nums) {\n        total += x;\n        curMax = Math.max(x, curMax + x);\n        maxSum = Math.max(maxSum, curMax);\n        curMin = Math.min(x, curMin + x);\n        minSum = Math.min(minSum, curMin);\n    }\n    if (maxSum < 0) return maxSum;\n    return Math.max(maxSum, total - minSum);\n}`,
              cpp: `int maxSubarraySumCircular(vector<int>& nums) {\n    int total = 0;\n    int maxSum = -2000000, curMax = 0;\n    int minSum = 2000000, curMin = 0;\n    for (int x : nums) {\n        total += x;\n        curMax = max(x, curMax + x);\n        maxSum = max(maxSum, curMax);\n        curMin = min(x, curMin + x);\n        minSum = min(minSum, curMin);\n    }\n    if (maxSum < 0) return maxSum;\n    return max(maxSum, total - minSum);\n}`,
              c: `int maxSubarraySumCircular(int* nums, int numsSize) {\n    int total = 0;\n    int maxSum = -2000000, curMax = 0;\n    int minSum = 2000000, curMin = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int x = nums[i];\n        total += x;\n        curMax = curMax + x > x ? curMax + x : x;\n        if (curMax > maxSum) maxSum = curMax;\n        curMin = curMin + x < x ? curMin + x : x;\n        if (curMin < minSum) minSum = curMin;\n    }\n    if (maxSum < 0) return maxSum;\n    int wrap = total - minSum;\n    return maxSum > wrap ? maxSum : wrap;\n}`,
              csharp: `public static int MaxSubarraySumCircular(int[] nums)\n{\n    int total = 0;\n    int maxSum = -2000000, curMax = 0;\n    int minSum = 2000000, curMin = 0;\n    foreach (int x in nums)\n    {\n        total += x;\n        curMax = Math.Max(x, curMax + x);\n        maxSum = Math.Max(maxSum, curMax);\n        curMin = Math.Min(x, curMin + x);\n        minSum = Math.Min(minSum, curMin);\n    }\n    if (maxSum < 0) return maxSum;\n    return Math.Max(maxSum, total - minSum);\n}`,
              go: `func maxSubarraySumCircular(nums []int) int {\n	total := 0\n	maxSum, curMax := -2000000, 0\n	minSum, curMin := 2000000, 0\n	for _, x := range nums {\n		total += x\n		if curMax+x > x {\n			curMax = curMax + x\n		} else {\n			curMax = x\n		}\n		if curMax > maxSum {\n			maxSum = curMax\n		}\n		if curMin+x < x {\n			curMin = curMin + x\n		} else {\n			curMin = x\n		}\n		if curMin < minSum {\n			minSum = curMin\n		}\n	}\n	if maxSum < 0 {\n		return maxSum\n	}\n	wrap := total - minSum\n	if maxSum > wrap {\n		return maxSum\n	}\n	return wrap\n}`,
              kotlin: `fun maxSubarraySumCircular(nums: IntArray): Int {\n    var total = 0\n    var maxSum = -2000000\n    var curMax = 0\n    var minSum = 2000000\n    var curMin = 0\n    for (x in nums) {\n        total += x\n        curMax = maxOf(x, curMax + x)\n        if (curMax > maxSum) maxSum = curMax\n        curMin = minOf(x, curMin + x)\n        if (curMin < minSum) minSum = curMin\n    }\n    if (maxSum < 0) return maxSum\n    return maxOf(maxSum, total - minSum)\n}`,
              swift: `func maxSubarraySumCircular(_ nums: [Int]) -> Int {\n    var total = 0\n    var maxSum = -2000000\n    var curMax = 0\n    var minSum = 2000000\n    var curMin = 0\n    for x in nums {\n        total += x\n        curMax = max(x, curMax + x)\n        if curMax > maxSum { maxSum = curMax }\n        curMin = min(x, curMin + x)\n        if curMin < minSum { minSum = curMin }\n    }\n    if maxSum < 0 { return maxSum }\n    return max(maxSum, total - minSum)\n}`,
              rust: `fn maxSubarraySumCircular(nums: Vec<i32>) -> i32 {\n    let mut total = 0;\n    let mut max_sum = -2000000;\n    let mut cur_max = 0;\n    let mut min_sum = 2000000;\n    let mut cur_min = 0;\n    for x in nums.iter() {\n        total += *x;\n        cur_max = if cur_max + *x > *x { cur_max + *x } else { *x };\n        if cur_max > max_sum {\n            max_sum = cur_max;\n        }\n        cur_min = if cur_min + *x < *x { cur_min + *x } else { *x };\n        if cur_min < min_sum {\n            min_sum = cur_min;\n        }\n    }\n    if max_sum < 0 {\n        return max_sum;\n    }\n    let wrap = total - min_sum;\n    if max_sum > wrap { max_sum } else { wrap }\n}`,
              php: `function maxSubarraySumCircular($nums) {\n    $total = 0;\n    $maxSum = -2000000;\n    $curMax = 0;\n    $minSum = 2000000;\n    $curMin = 0;\n    foreach ($nums as $x) {\n        $total += $x;\n        $curMax = max($x, $curMax + $x);\n        if ($curMax > $maxSum) $maxSum = $curMax;\n        $curMin = min($x, $curMin + $x);\n        if ($curMin < $minSum) $minSum = $curMin;\n    }\n    if ($maxSum < 0) return $maxSum;\n    return max($maxSum, $total - $minSum);\n}`,
              ruby: `def maxSubarraySumCircular(nums)\n  total = 0\n  max_sum = -2000000\n  cur_max = 0\n  min_sum = 2000000\n  cur_min = 0\n  nums.each do |x|\n    total += x\n    cur_max = [x, cur_max + x].max\n    max_sum = cur_max if cur_max > max_sum\n    cur_min = [x, cur_min + x].min\n    min_sum = cur_min if cur_min < min_sum\n  end\n  return max_sum if max_sum < 0\n  [max_sum, total - min_sum].max\nend`,
      },
    };
  })(),

  // ── Best Sightseeing Pair ───────────────────────────────────────
  (() => {
    const ref = (values: number[]) => {
      let best = -Infinity, bestLeft = values[0];
      for (let j = 1; j < values.length; j++) {
        const candidate = bestLeft + values[j] - j;
        if (candidate > best) best = candidate;
        if (values[j] + j > bestLeft) bestLeft = values[j] + j;
      }
      return best;
    };
    return {
      slug: "best-sightseeing-pair",
      title: "Best Sightseeing Pair",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Google", "Amazon", "Uber"],
      signature: { funcName: "maxScoreSightseeingPair", params: [{ name: "values", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `values` where `values[i]` is the value of the i-th sightseeing spot. Two spots `i < j` are `j - i` apart.\n\nThe score of a pair is `values[i] + values[j] + i - j`. Return the maximum score over all pairs.",
        [
          { in: "values = [8,1,5,2,6]", out: "11", note: "Pairing spots 0 and 2: 8 + 5 + 0 - 2 = 11." },
          { in: "values = [1,2]", out: "2" },
          { in: "values = [1,3,5]", out: "7" },
        ],
        ["2 <= values.length <= 40", "1 <= values[i] <= 1000"]),
      hints: [
        "Split the score into a left part `values[i] + i` and a right part `values[j] - j`.",
        "Scan left to right keeping the best left part seen so far, and pair it with the current right part.",
        "That turns an O(n²) pair search into one pass.",
      ],
      examples: [
        { input: "[8,1,5,2,6]", expectedOutput: "11" },
        { input: "[1,2]", expectedOutput: "2" },
        { input: "[1,3,5]", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const values = randArr(rng, ri(rng, 2, 40), 1, 1000);
        return { input: fmtIntArr(values), expectedOutput: String(ref(values)) };
      },
      solutions: {
        python: `def maxScoreSightseeingPair(values) -> int:\n    best = float("-inf")\n    best_left = values[0]\n    for j in range(1, len(values)):\n        best = max(best, best_left + values[j] - j)\n        best_left = max(best_left, values[j] + j)\n    return best`,
        javascript: `var maxScoreSightseeingPair = function(values) {\n    let best = -Infinity, bestLeft = values[0];\n    for (let j = 1; j < values.length; j++) {\n        const candidate = bestLeft + values[j] - j;\n        if (candidate > best) best = candidate;\n        if (values[j] + j > bestLeft) bestLeft = values[j] + j;\n    }\n    return best;\n};`,
              typescript: `function maxScoreSightseeingPair(values: number[]): number {\n    var best = -2000000;\n    var bestLeft = values[0];\n    for (var j = 1; j < values.length; j++) {\n        var candidate = bestLeft + values[j] - j;\n        if (candidate > best) best = candidate;\n        if (values[j] + j > bestLeft) bestLeft = values[j] + j;\n    }\n    return best;\n}`,
              java: `public static int maxScoreSightseeingPair(int[] values) {\n    int best = -2000000, bestLeft = values[0];\n    for (int j = 1; j < values.length; j++) {\n        best = Math.max(best, bestLeft + values[j] - j);\n        bestLeft = Math.max(bestLeft, values[j] + j);\n    }\n    return best;\n}`,
              cpp: `int maxScoreSightseeingPair(vector<int>& values) {\n    int best = -2000000, bestLeft = values[0];\n    for (int j = 1; j < (int) values.size(); j++) {\n        best = max(best, bestLeft + values[j] - j);\n        bestLeft = max(bestLeft, values[j] + j);\n    }\n    return best;\n}`,
              c: `int maxScoreSightseeingPair(int* values, int valuesSize) {\n    int best = -2000000, bestLeft = values[0];\n    for (int j = 1; j < valuesSize; j++) {\n        int candidate = bestLeft + values[j] - j;\n        if (candidate > best) best = candidate;\n        if (values[j] + j > bestLeft) bestLeft = values[j] + j;\n    }\n    return best;\n}`,
              csharp: `public static int MaxScoreSightseeingPair(int[] values)\n{\n    int best = -2000000, bestLeft = values[0];\n    for (int j = 1; j < values.Length; j++)\n    {\n        best = Math.Max(best, bestLeft + values[j] - j);\n        bestLeft = Math.Max(bestLeft, values[j] + j);\n    }\n    return best;\n}`,
              go: `func maxScoreSightseeingPair(values []int) int {\n	best, bestLeft := -2000000, values[0]\n	for j := 1; j < len(values); j++ {\n		if bestLeft+values[j]-j > best {\n			best = bestLeft + values[j] - j\n		}\n		if values[j]+j > bestLeft {\n			bestLeft = values[j] + j\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxScoreSightseeingPair(values: IntArray): Int {\n    var best = -2000000\n    var bestLeft = values[0]\n    for (j in 1 until values.size) {\n        val candidate = bestLeft + values[j] - j\n        if (candidate > best) best = candidate\n        if (values[j] + j > bestLeft) bestLeft = values[j] + j\n    }\n    return best\n}`,
              swift: `func maxScoreSightseeingPair(_ values: [Int]) -> Int {\n    var best = -2000000\n    var bestLeft = values[0]\n    var j = 1\n    while j < values.count {\n        let candidate = bestLeft + values[j] - j\n        if candidate > best { best = candidate }\n        if values[j] + j > bestLeft { bestLeft = values[j] + j }\n        j += 1\n    }\n    return best\n}`,
              rust: `fn maxScoreSightseeingPair(values: Vec<i32>) -> i32 {\n    let mut best = -2000000;\n    let mut best_left = values[0];\n    for j in 1..values.len() {\n        let idx = j as i32;\n        let candidate = best_left + values[j] - idx;\n        if candidate > best {\n            best = candidate;\n        }\n        if values[j] + idx > best_left {\n            best_left = values[j] + idx;\n        }\n    }\n    best\n}`,
              php: `function maxScoreSightseeingPair($values) {\n    $best = -2000000;\n    $bestLeft = $values[0];\n    for ($j = 1; $j < count($values); $j++) {\n        $candidate = $bestLeft + $values[$j] - $j;\n        if ($candidate > $best) $best = $candidate;\n        if ($values[$j] + $j > $bestLeft) $bestLeft = $values[$j] + $j;\n    }\n    return $best;\n}`,
              ruby: `def maxScoreSightseeingPair(values)\n  best = -2000000\n  best_left = values[0]\n  (1...values.length).each do |j|\n    candidate = best_left + values[j] - j\n    best = candidate if candidate > best\n    best_left = values[j] + j if values[j] + j > best_left\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Number of Dice Rolls With Target Sum ────────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (n: number, k: number, target: number) => {
      let dp = new Array(target + 1).fill(0);
      dp[0] = 1;
      for (let die = 1; die <= n; die++) {
        const next = new Array(target + 1).fill(0);
        for (let t = 1; t <= target; t++) {
          let sum = 0;
          for (let face = 1; face <= k && face <= t; face++) sum = (sum + dp[t - face]) % MOD;
          next[t] = sum;
        }
        dp = next;
      }
      return dp[target];
    };
    return {
      slug: "number-of-dice-rolls-with-target-sum",
      title: "Number of Dice Rolls With Target Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "numRollsToTarget", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You have `n` dice, each with `k` faces numbered `1` through `k`.\n\nReturn the number of ways to roll all the dice so the face values sum to exactly `target`. Since the answer may be large, return it **modulo 10^9 + 7**.",
        [
          { in: "n = 1, k = 6, target = 3", out: "1" },
          { in: "n = 2, k = 6, target = 7", out: "6" },
          { in: "n = 30, k = 30, target = 500", out: "222616187" },
        ],
        ["1 <= n, k <= 30", "1 <= target <= 300"]),
      hints: [
        "Add one die at a time: `dp[die][t] = Σ dp[die-1][t - face]` over the `k` faces.",
        "Only the previous die's row is needed, so two rolling arrays suffice.",
        "Take the modulus as you accumulate, not only at the end.",
      ],
      examples: [
        { input: "1\n6\n3", expectedOutput: "1" },
        { input: "2\n6\n7", expectedOutput: "6" },
        { input: "30\n30\n500", expectedOutput: "222616187" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 12);
        const k = ri(rng, 1, 12);
        const target = ri(rng, 1, 60);
        return { input: `${n}\n${k}\n${target}`, expectedOutput: String(ref(n, k, target)) };
      },
      solutions: {
        python: `def numRollsToTarget(n: int, k: int, target: int) -> int:\n    MOD = 1000000007\n    dp = [0] * (target + 1)\n    dp[0] = 1\n    for _ in range(n):\n        nxt = [0] * (target + 1)\n        for t in range(1, target + 1):\n            total = 0\n            for face in range(1, min(k, t) + 1):\n                total += dp[t - face]\n            nxt[t] = total % MOD\n        dp = nxt\n    return dp[target]`,
        javascript: `var numRollsToTarget = function(n, k, target) {\n    const MOD = 1000000007;\n    let dp = new Array(target + 1).fill(0);\n    dp[0] = 1;\n    for (let die = 1; die <= n; die++) {\n        const next = new Array(target + 1).fill(0);\n        for (let t = 1; t <= target; t++) {\n            let sum = 0;\n            for (let face = 1; face <= k && face <= t; face++) {\n                sum = (sum + dp[t - face]) % MOD;\n            }\n            next[t] = sum;\n        }\n        dp = next;\n    }\n    return dp[target];\n};`,
              typescript: `function numRollsToTarget(n: number, k: number, target: number): number {\n    var MOD = 1000000007;\n    var dp: number[] = [];\n    for (var a = 0; a <= target; a++) dp.push(0);\n    dp[0] = 1;\n    for (var die = 1; die <= n; die++) {\n        var next: number[] = [];\n        for (var b = 0; b <= target; b++) next.push(0);\n        for (var t = 1; t <= target; t++) {\n            var sum = 0;\n            for (var face = 1; face <= k && face <= t; face++) {\n                sum = (sum + dp[t - face]) % MOD;\n            }\n            next[t] = sum;\n        }\n        dp = next;\n    }\n    return dp[target];\n}`,
              java: `public static int numRollsToTarget(int n, int k, int target) {\n    final int MOD = 1000000007;\n    int[] dp = new int[target + 1];\n    dp[0] = 1;\n    for (int die = 1; die <= n; die++) {\n        int[] next = new int[target + 1];\n        for (int t = 1; t <= target; t++) {\n            int sum = 0;\n            for (int face = 1; face <= k && face <= t; face++) {\n                sum = (sum + dp[t - face]) % MOD;\n            }\n            next[t] = sum;\n        }\n        dp = next;\n    }\n    return dp[target];\n}`,
              cpp: `int numRollsToTarget(int n, int k, int target) {\n    const int MOD = 1000000007;\n    vector<int> dp(target + 1, 0);\n    dp[0] = 1;\n    for (int die = 1; die <= n; die++) {\n        vector<int> next(target + 1, 0);\n        for (int t = 1; t <= target; t++) {\n            int sum = 0;\n            for (int face = 1; face <= k && face <= t; face++) {\n                sum = (sum + dp[t - face]) % MOD;\n            }\n            next[t] = sum;\n        }\n        dp = next;\n    }\n    return dp[target];\n}`,
              c: `int numRollsToTarget(int n, int k, int target) {\n    const int MOD = 1000000007;\n    int* dp = (int*) calloc(target + 1, sizeof(int));\n    int* next = (int*) calloc(target + 1, sizeof(int));\n    dp[0] = 1;\n    for (int die = 1; die <= n; die++) {\n        for (int t = 0; t <= target; t++) next[t] = 0;\n        for (int t = 1; t <= target; t++) {\n            int sum = 0;\n            for (int face = 1; face <= k && face <= t; face++) {\n                sum = (sum + dp[t - face]) % MOD;\n            }\n            next[t] = sum;\n        }\n        for (int t = 0; t <= target; t++) dp[t] = next[t];\n    }\n    int result = dp[target];\n    free(dp);\n    free(next);\n    return result;\n}`,
              csharp: `public static int NumRollsToTarget(int n, int k, int target)\n{\n    const int MOD = 1000000007;\n    int[] dp = new int[target + 1];\n    dp[0] = 1;\n    for (int die = 1; die <= n; die++)\n    {\n        int[] next = new int[target + 1];\n        for (int t = 1; t <= target; t++)\n        {\n            int sum = 0;\n            for (int face = 1; face <= k && face <= t; face++)\n            {\n                sum = (sum + dp[t - face]) % MOD;\n            }\n            next[t] = sum;\n        }\n        dp = next;\n    }\n    return dp[target];\n}`,
              go: `func numRollsToTarget(n int, k int, target int) int {\n	const MOD = 1000000007\n	dp := make([]int, target+1)\n	dp[0] = 1\n	for die := 1; die <= n; die++ {\n		next := make([]int, target+1)\n		for t := 1; t <= target; t++ {\n			sum := 0\n			for face := 1; face <= k && face <= t; face++ {\n				sum = (sum + dp[t-face]) % MOD\n			}\n			next[t] = sum\n		}\n		dp = next\n	}\n	return dp[target]\n}`,
              kotlin: `fun numRollsToTarget(n: Int, k: Int, target: Int): Int {\n    val MOD = 1000000007\n    var dp = IntArray(target + 1)\n    dp[0] = 1\n    for (die in 1..n) {\n        val next = IntArray(target + 1)\n        for (t in 1..target) {\n            var sum = 0\n            var face = 1\n            while (face <= k && face <= t) {\n                sum = (sum + dp[t - face]) % MOD\n                face++\n            }\n            next[t] = sum\n        }\n        dp = next\n    }\n    return dp[target]\n}`,
              swift: `func numRollsToTarget(_ n: Int, _ k: Int, _ target: Int) -> Int {\n    let MOD = 1000000007\n    var dp = [Int](repeating: 0, count: target + 1)\n    dp[0] = 1\n    var die = 1\n    while die <= n {\n        var next = [Int](repeating: 0, count: target + 1)\n        var t = 1\n        while t <= target {\n            var sum = 0\n            var face = 1\n            while face <= k && face <= t {\n                sum = (sum + dp[t - face]) % MOD\n                face += 1\n            }\n            next[t] = sum\n            t += 1\n        }\n        dp = next\n        die += 1\n    }\n    return dp[target]\n}`,
              rust: `fn numRollsToTarget(n: i32, k: i32, target: i32) -> i32 {\n    let modulus = 1000000007i64;\n    let size = target as usize;\n    let mut dp = vec![0i64; size + 1];\n    dp[0] = 1;\n    for _ in 0..n {\n        let mut next = vec![0i64; size + 1];\n        for t in 1..=size {\n            let mut sum = 0i64;\n            let mut face = 1usize;\n            while face <= k as usize && face <= t {\n                sum = (sum + dp[t - face]) % modulus;\n                face += 1;\n            }\n            next[t] = sum;\n        }\n        dp = next;\n    }\n    dp[size] as i32\n}`,
              php: `function numRollsToTarget($n, $k, $target) {\n    $MOD = 1000000007;\n    $dp = array_fill(0, $target + 1, 0);\n    $dp[0] = 1;\n    for ($die = 1; $die <= $n; $die++) {\n        $next = array_fill(0, $target + 1, 0);\n        for ($t = 1; $t <= $target; $t++) {\n            $sum = 0;\n            for ($face = 1; $face <= $k && $face <= $t; $face++) {\n                $sum = ($sum + $dp[$t - $face]) % $MOD;\n            }\n            $next[$t] = $sum;\n        }\n        $dp = $next;\n    }\n    return $dp[$target];\n}`,
              ruby: `def numRollsToTarget(n, k, target)\n  mod = 1000000007\n  dp = Array.new(target + 1, 0)\n  dp[0] = 1\n  n.times do\n    nxt = Array.new(target + 1, 0)\n    (1..target).each do |t|\n      sum = 0\n      face = 1\n      while face <= k && face <= t\n        sum = (sum + dp[t - face]) % mod\n        face += 1\n      end\n      nxt[t] = sum\n    end\n    dp = nxt\n  end\n  dp[target]\nend`,
      },
    };
  })(),

  // ── Longest Turbulent Subarray ──────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      let best = 1, up = 1, down = 1;
      for (let i = 1; i < arr.length; i++) {
        if (arr[i] > arr[i - 1]) { up = down + 1; down = 1; }
        else if (arr[i] < arr[i - 1]) { down = up + 1; up = 1; }
        else { up = 1; down = 1; }
        const cur = Math.max(up, down);
        if (cur > best) best = cur;
      }
      return best;
    };
    return {
      slug: "longest-turbulent-subarray",
      title: "Longest Turbulent Subarray",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Sliding Window", "Amazon", "Google"],
      signature: { funcName: "maxTurbulenceSize", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A subarray is **turbulent** if the comparison sign between every pair of adjacent elements flips: `a < b > c < d > …` or `a > b < c > d < …`.\n\nGiven an integer array `arr`, return the length of the longest turbulent subarray.",
        [
          { in: "arr = [9,4,2,10,7,8,8,1,9]", out: "5", note: "The subarray [4,2,10,7,8]." },
          { in: "arr = [4,8,12,16]", out: "2" },
          { in: "arr = [100]", out: "1" },
        ],
        ["1 <= arr.length <= 40", "0 <= arr[i] <= 1000"]),
      hints: [
        "Track two running lengths: the best turbulent run ending with a rise, and the one ending with a fall.",
        "A rise sets `up = down + 1` and resets `down` to 1; a fall does the mirror image.",
        "Equal neighbours break turbulence entirely — reset both to 1.",
      ],
      examples: [
        { input: "[9,4,2,10,7,8,8,1,9]", expectedOutput: "5" },
        { input: "[4,8,12,16]", expectedOutput: "2" },
        { input: "[100]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const arr = randArr(rng, ri(rng, 1, 40), 0, rng() < 0.5 ? 5 : 1000);
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `def maxTurbulenceSize(arr) -> int:\n    best = up = down = 1\n    for i in range(1, len(arr)):\n        if arr[i] > arr[i - 1]:\n            up, down = down + 1, 1\n        elif arr[i] < arr[i - 1]:\n            down, up = up + 1, 1\n        else:\n            up = down = 1\n        best = max(best, up, down)\n    return best`,
        javascript: `var maxTurbulenceSize = function(arr) {\n    let best = 1, up = 1, down = 1;\n    for (let i = 1; i < arr.length; i++) {\n        if (arr[i] > arr[i - 1]) {\n            const prevDown = down;\n            up = prevDown + 1;\n            down = 1;\n        } else if (arr[i] < arr[i - 1]) {\n            const prevUp = up;\n            down = prevUp + 1;\n            up = 1;\n        } else {\n            up = 1;\n            down = 1;\n        }\n        const cur = Math.max(up, down);\n        if (cur > best) best = cur;\n    }\n    return best;\n};`,
              typescript: `function maxTurbulenceSize(arr: number[]): number {\n    var best = 1;\n    var up = 1;\n    var down = 1;\n    for (var i = 1; i < arr.length; i++) {\n        if (arr[i] > arr[i - 1]) {\n            var prevDown = down;\n            up = prevDown + 1;\n            down = 1;\n        } else if (arr[i] < arr[i - 1]) {\n            var prevUp = up;\n            down = prevUp + 1;\n            up = 1;\n        } else {\n            up = 1;\n            down = 1;\n        }\n        var cur = Math.max(up, down);\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,
              java: `public static int maxTurbulenceSize(int[] arr) {\n    int best = 1, up = 1, down = 1;\n    for (int i = 1; i < arr.length; i++) {\n        if (arr[i] > arr[i - 1]) {\n            int prevDown = down;\n            up = prevDown + 1;\n            down = 1;\n        } else if (arr[i] < arr[i - 1]) {\n            int prevUp = up;\n            down = prevUp + 1;\n            up = 1;\n        } else {\n            up = 1;\n            down = 1;\n        }\n        best = Math.max(best, Math.max(up, down));\n    }\n    return best;\n}`,
              cpp: `int maxTurbulenceSize(vector<int>& arr) {\n    int best = 1, up = 1, down = 1;\n    for (int i = 1; i < (int) arr.size(); i++) {\n        if (arr[i] > arr[i - 1]) {\n            int prevDown = down;\n            up = prevDown + 1;\n            down = 1;\n        } else if (arr[i] < arr[i - 1]) {\n            int prevUp = up;\n            down = prevUp + 1;\n            up = 1;\n        } else {\n            up = 1;\n            down = 1;\n        }\n        best = max(best, max(up, down));\n    }\n    return best;\n}`,
              c: `int maxTurbulenceSize(int* arr, int arrSize) {\n    int best = 1, up = 1, down = 1;\n    for (int i = 1; i < arrSize; i++) {\n        if (arr[i] > arr[i - 1]) {\n            int prevDown = down;\n            up = prevDown + 1;\n            down = 1;\n        } else if (arr[i] < arr[i - 1]) {\n            int prevUp = up;\n            down = prevUp + 1;\n            up = 1;\n        } else {\n            up = 1;\n            down = 1;\n        }\n        int cur = up > down ? up : down;\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,
              csharp: `public static int MaxTurbulenceSize(int[] arr)\n{\n    int best = 1, up = 1, down = 1;\n    for (int i = 1; i < arr.Length; i++)\n    {\n        if (arr[i] > arr[i - 1])\n        {\n            int prevDown = down;\n            up = prevDown + 1;\n            down = 1;\n        }\n        else if (arr[i] < arr[i - 1])\n        {\n            int prevUp = up;\n            down = prevUp + 1;\n            up = 1;\n        }\n        else\n        {\n            up = 1;\n            down = 1;\n        }\n        best = Math.Max(best, Math.Max(up, down));\n    }\n    return best;\n}`,
              go: `func maxTurbulenceSize(arr []int) int {\n	best, up, down := 1, 1, 1\n	for i := 1; i < len(arr); i++ {\n		if arr[i] > arr[i-1] {\n			prevDown := down\n			up = prevDown + 1\n			down = 1\n		} else if arr[i] < arr[i-1] {\n			prevUp := up\n			down = prevUp + 1\n			up = 1\n		} else {\n			up = 1\n			down = 1\n		}\n		cur := up\n		if down > cur {\n			cur = down\n		}\n		if cur > best {\n			best = cur\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxTurbulenceSize(arr: IntArray): Int {\n    var best = 1\n    var up = 1\n    var down = 1\n    for (i in 1 until arr.size) {\n        if (arr[i] > arr[i - 1]) {\n            val prevDown = down\n            up = prevDown + 1\n            down = 1\n        } else if (arr[i] < arr[i - 1]) {\n            val prevUp = up\n            down = prevUp + 1\n            up = 1\n        } else {\n            up = 1\n            down = 1\n        }\n        val cur = if (up > down) up else down\n        if (cur > best) best = cur\n    }\n    return best\n}`,
              swift: `func maxTurbulenceSize(_ arr: [Int]) -> Int {\n    var best = 1\n    var up = 1\n    var down = 1\n    var i = 1\n    while i < arr.count {\n        if arr[i] > arr[i - 1] {\n            let prevDown = down\n            up = prevDown + 1\n            down = 1\n        } else if arr[i] < arr[i - 1] {\n            let prevUp = up\n            down = prevUp + 1\n            up = 1\n        } else {\n            up = 1\n            down = 1\n        }\n        let cur = max(up, down)\n        if cur > best { best = cur }\n        i += 1\n    }\n    return best\n}`,
              rust: `fn maxTurbulenceSize(arr: Vec<i32>) -> i32 {\n    let mut best = 1;\n    let mut up = 1;\n    let mut down = 1;\n    for i in 1..arr.len() {\n        if arr[i] > arr[i - 1] {\n            let prev_down = down;\n            up = prev_down + 1;\n            down = 1;\n        } else if arr[i] < arr[i - 1] {\n            let prev_up = up;\n            down = prev_up + 1;\n            up = 1;\n        } else {\n            up = 1;\n            down = 1;\n        }\n        let cur = if up > down { up } else { down };\n        if cur > best {\n            best = cur;\n        }\n    }\n    best\n}`,
              php: `function maxTurbulenceSize($arr) {\n    $best = 1;\n    $up = 1;\n    $down = 1;\n    for ($i = 1; $i < count($arr); $i++) {\n        if ($arr[$i] > $arr[$i - 1]) {\n            $prevDown = $down;\n            $up = $prevDown + 1;\n            $down = 1;\n        } else if ($arr[$i] < $arr[$i - 1]) {\n            $prevUp = $up;\n            $down = $prevUp + 1;\n            $up = 1;\n        } else {\n            $up = 1;\n            $down = 1;\n        }\n        $cur = max($up, $down);\n        if ($cur > $best) $best = $cur;\n    }\n    return $best;\n}`,
              ruby: `def maxTurbulenceSize(arr)\n  best = 1\n  up = 1\n  down = 1\n  (1...arr.length).each do |i|\n    if arr[i] > arr[i - 1]\n      prev_down = down\n      up = prev_down + 1\n      down = 1\n    elsif arr[i] < arr[i - 1]\n      prev_up = up\n      down = prev_up + 1\n      up = 1\n    else\n      up = 1\n      down = 1\n    end\n    cur = [up, down].max\n    best = cur if cur > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Maximum Length of Pair Chain ────────────────────────────────
  (() => {
    const ref = (pairs: number[][]) => {
      const sorted = pairs.slice().sort((a, b) => a[1] - b[1]);
      let count = 0, cur = -Infinity;
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i][0] > cur) { count++; cur = sorted[i][1]; }
      }
      return count;
    };
    return {
      slug: "maximum-length-of-pair-chain",
      title: "Maximum Length of Pair Chain",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Greedy", "Sorting", "Amazon", "Google"],
      signature: { funcName: "findLongestChain", params: [{ name: "pairs", type: "int[][]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array of `n` pairs where `pairs[i] = [left, right]` and `left < right`.\n\nA pair `[c, d]` can **follow** a pair `[a, b]` if `b < c`. A chain is a sequence of pairs built this way. Return the length of the longest chain that can be formed; you need not use all the pairs, and you may reorder them freely.",
        [
          { in: "pairs = [[1,2],[2,3],[3,4]]", out: "2", note: "The chain [1,2] → [3,4]." },
          { in: "pairs = [[1,2],[7,8],[4,5]]", out: "3" },
          { in: "pairs = [[-6,9],[1,6],[8,10],[-1,4],[-6,-2],[-9,8],[-5,3],[0,3]]", out: "3" },
        ],
        ["1 <= pairs.length <= 30", "-1000 <= left < right <= 1000"]),
      hints: [
        "This is interval scheduling: sort by the **right** endpoint and take greedily.",
        "Finishing as early as possible always leaves the most room for what comes after.",
        "Track the right endpoint of the last chosen pair and accept the next pair only when its left endpoint is strictly greater.",
      ],
      examples: [
        { input: "[[1,2],[2,3],[3,4]]", expectedOutput: "2" },
        { input: "[[1,2],[7,8],[4,5]]", expectedOutput: "3" },
        { input: "[[-6,9],[1,6],[8,10],[-1,4],[-6,-2],[-9,8],[-5,3],[0,3]]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const count = ri(rng, 1, 30);
        const pairs = Array.from({ length: count }, () => {
          const left = ri(rng, -1000, 999);
          const right = ri(rng, left + 1, 1000);
          return [left, right];
        });
        return { input: fmtIntMat(pairs), expectedOutput: String(ref(pairs)) };
      },
      solutions: {
        python: `def findLongestChain(pairs) -> int:\n    ordered = sorted(pairs, key=lambda p: p[1])\n    count = 0\n    cur = float("-inf")\n    for left, right in ordered:\n        if left > cur:\n            count += 1\n            cur = right\n    return count`,
        javascript: `var findLongestChain = function(pairs) {\n    const sorted = pairs.slice().sort(function(a, b) { return a[1] - b[1]; });\n    let count = 0, cur = -Infinity;\n    for (let i = 0; i < sorted.length; i++) {\n        if (sorted[i][0] > cur) {\n            count++;\n            cur = sorted[i][1];\n        }\n    }\n    return count;\n};`,
              typescript: `function findLongestChain(pairs: number[][]): number {\n    var sorted = pairs.slice();\n    sorted.sort(function (a, b) { return a[1] - b[1]; });\n    var count = 0;\n    var cur = -2000000;\n    for (var i = 0; i < sorted.length; i++) {\n        if (sorted[i][0] > cur) {\n            count++;\n            cur = sorted[i][1];\n        }\n    }\n    return count;\n}`,
              java: `public static int findLongestChain(int[][] pairs) {\n    int[][] sorted = Arrays.copyOf(pairs, pairs.length);\n    Arrays.sort(sorted, new Comparator<int[]>() {\n        public int compare(int[] a, int[] b) { return a[1] - b[1]; }\n    });\n    int count = 0, cur = -2000000;\n    for (int[] p : sorted) {\n        if (p[0] > cur) {\n            count++;\n            cur = p[1];\n        }\n    }\n    return count;\n}`,
              cpp: `int findLongestChain(vector<vector<int>>& pairs) {\n    vector<vector<int>> sorted = pairs;\n    sort(sorted.begin(), sorted.end(), [](const vector<int>& a, const vector<int>& b) {\n        return a[1] < b[1];\n    });\n    int count = 0, cur = -2000000;\n    for (vector<int>& p : sorted) {\n        if (p[0] > cur) {\n            count++;\n            cur = p[1];\n        }\n    }\n    return count;\n}`,
              c: `int findLongestChain(int** pairs, int pairsSize, int* pairsColSize) {\n    int** sorted = (int**) malloc(sizeof(int*) * pairsSize);\n    for (int i = 0; i < pairsSize; i++) sorted[i] = pairs[i];\n    for (int i = 1; i < pairsSize; i++) {\n        int* key = sorted[i];\n        int j = i - 1;\n        while (j >= 0 && sorted[j][1] > key[1]) {\n            sorted[j + 1] = sorted[j];\n            j--;\n        }\n        sorted[j + 1] = key;\n    }\n    int count = 0;\n    int cur = -2000000;\n    for (int i = 0; i < pairsSize; i++) {\n        if (sorted[i][0] > cur) {\n            count++;\n            cur = sorted[i][1];\n        }\n    }\n    free(sorted);\n    return count;\n}`,
              csharp: `public static int FindLongestChain(int[][] pairs)\n{\n    int[][] sorted = (int[][]) pairs.Clone();\n    Array.Sort(sorted, delegate (int[] a, int[] b) { return a[1] - b[1]; });\n    int count = 0, cur = -2000000;\n    foreach (int[] p in sorted)\n    {\n        if (p[0] > cur)\n        {\n            count++;\n            cur = p[1];\n        }\n    }\n    return count;\n}`,
              go: `func findLongestChain(pairs [][]int) int {\n	sorted := make([][]int, len(pairs))\n	copy(sorted, pairs)\n	sort.Slice(sorted, func(i, j int) bool { return sorted[i][1] < sorted[j][1] })\n	count := 0\n	cur := -2000000\n	for _, p := range sorted {\n		if p[0] > cur {\n			count++\n			cur = p[1]\n		}\n	}\n	return count\n}`,
              kotlin: `fun findLongestChain(pairs: Array<IntArray>): Int {\n    val sorted = pairs.sortedBy { it[1] }\n    var count = 0\n    var cur = -2000000\n    for (p in sorted) {\n        if (p[0] > cur) {\n            count++\n            cur = p[1]\n        }\n    }\n    return count\n}`,
              swift: `func findLongestChain(_ pairs: [[Int]]) -> Int {\n    let sorted = pairs.sorted { $0[1] < $1[1] }\n    var count = 0\n    var cur = -2000000\n    for p in sorted {\n        if p[0] > cur {\n            count += 1\n            cur = p[1]\n        }\n    }\n    return count\n}`,
              rust: `fn findLongestChain(pairs: Vec<Vec<i32>>) -> i32 {\n    let mut sorted = pairs.clone();\n    sorted.sort_by(|a, b| a[1].cmp(&b[1]));\n    let mut count = 0;\n    let mut cur = -2000000;\n    for p in sorted.iter() {\n        if p[0] > cur {\n            count += 1;\n            cur = p[1];\n        }\n    }\n    count\n}`,
              php: `function findLongestChain($pairs) {\n    $sorted = $pairs;\n    usort($sorted, function ($a, $b) { return $a[1] - $b[1]; });\n    $count = 0;\n    $cur = -2000000;\n    foreach ($sorted as $p) {\n        if ($p[0] > $cur) {\n            $count++;\n            $cur = $p[1];\n        }\n    }\n    return $count;\n}`,
              ruby: `def findLongestChain(pairs)\n  sorted = pairs.sort_by { |p| p[1] }\n  count = 0\n  cur = -2000000\n  sorted.each do |p|\n    if p[0] > cur\n      count += 1\n      cur = p[1]\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── 2 Keys Keyboard ─────────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      let rest = n, steps = 0;
      for (let factor = 2; factor * factor <= rest; factor++) {
        while (rest % factor === 0) { steps += factor; rest /= factor; }
      }
      if (rest > 1) steps += rest;
      return steps;
    };
    return {
      slug: "2-keys-keyboard",
      title: "2 Keys Keyboard",
      difficulty: "MEDIUM" as const,
      tags: ["Math", "Dynamic Programming", "Amazon", "Google"],
      signature: { funcName: "minSteps", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A notepad starts with a single character `A`. Two operations are available:\n\n- **Copy All** — copy every character currently on the notepad (a partial copy is not allowed).\n- **Paste** — append whatever was last copied.\n\nGiven an integer `n`, return the minimum number of operations needed to end up with exactly `n` copies of `A`.",
        [
          { in: "n = 3", out: "3", note: "Copy All, Paste, Paste." },
          { in: "n = 1", out: "0", note: "The single A is already there." },
          { in: "n = 9", out: "6" },
        ],
        ["1 <= n <= 1000"]),
      hints: [
        "The notepad's length can only ever be multiplied by a whole number, so the last Copy All happened at some divisor `d` of `n`.",
        "Going from `d` to `n` costs one Copy All plus `n / d - 1` Pastes — that is `n / d` operations.",
        "So `dp[n] = min over divisors d of (dp[d] + n / d)`, and the answer equals the sum of `n`'s prime factors.",
      ],
      examples: [
        { input: "3", expectedOutput: "3" },
        { input: "1", expectedOutput: "0" },
        { input: "9", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 1000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def minSteps(n: int) -> int:\n    steps = 0\n    factor = 2\n    while factor * factor <= n:\n        while n % factor == 0:\n            steps += factor\n            n //= factor\n        factor += 1\n    if n > 1:\n        steps += n\n    return steps`,
        javascript: `var minSteps = function(n) {\n    let steps = 0;\n    for (let factor = 2; factor * factor <= n; factor++) {\n        while (n % factor === 0) {\n            steps += factor;\n            n /= factor;\n        }\n    }\n    if (n > 1) steps += n;\n    return steps;\n};`,
              typescript: `function minSteps(n: number): number {\n    var steps = 0;\n    for (var factor = 2; factor * factor <= n; factor++) {\n        while (n % factor === 0) {\n            steps += factor;\n            n /= factor;\n        }\n    }\n    if (n > 1) steps += n;\n    return steps;\n}`,
              java: `public static int minSteps(int n) {\n    int steps = 0;\n    for (int factor = 2; factor * factor <= n; factor++) {\n        while (n % factor == 0) {\n            steps += factor;\n            n /= factor;\n        }\n    }\n    if (n > 1) steps += n;\n    return steps;\n}`,
              cpp: `int minSteps(int n) {\n    int steps = 0;\n    for (int factor = 2; factor * factor <= n; factor++) {\n        while (n % factor == 0) {\n            steps += factor;\n            n /= factor;\n        }\n    }\n    if (n > 1) steps += n;\n    return steps;\n}`,
              c: `int minSteps(int n) {\n    int steps = 0;\n    for (int factor = 2; factor * factor <= n; factor++) {\n        while (n % factor == 0) {\n            steps += factor;\n            n /= factor;\n        }\n    }\n    if (n > 1) steps += n;\n    return steps;\n}`,
              csharp: `public static int MinSteps(int n)\n{\n    int steps = 0;\n    for (int factor = 2; factor * factor <= n; factor++)\n    {\n        while (n % factor == 0)\n        {\n            steps += factor;\n            n /= factor;\n        }\n    }\n    if (n > 1) steps += n;\n    return steps;\n}`,
              go: `func minSteps(n int) int {\n	steps := 0\n	for factor := 2; factor*factor <= n; factor++ {\n		for n%factor == 0 {\n			steps += factor\n			n /= factor\n		}\n	}\n	if n > 1 {\n		steps += n\n	}\n	return steps\n}`,
              kotlin: `fun minSteps(n: Int): Int {\n    var rest = n\n    var steps = 0\n    var factor = 2\n    while (factor * factor <= rest) {\n        while (rest % factor == 0) {\n            steps += factor\n            rest /= factor\n        }\n        factor++\n    }\n    if (rest > 1) steps += rest\n    return steps\n}`,
              swift: `func minSteps(_ n: Int) -> Int {\n    var rest = n\n    var steps = 0\n    var factor = 2\n    while factor * factor <= rest {\n        while rest % factor == 0 {\n            steps += factor\n            rest /= factor\n        }\n        factor += 1\n    }\n    if rest > 1 { steps += rest }\n    return steps\n}`,
              rust: `fn minSteps(n: i32) -> i32 {\n    let mut rest = n;\n    let mut steps = 0;\n    let mut factor = 2;\n    while factor * factor <= rest {\n        while rest % factor == 0 {\n            steps += factor;\n            rest /= factor;\n        }\n        factor += 1;\n    }\n    if rest > 1 {\n        steps += rest;\n    }\n    steps\n}`,
              php: `function minSteps($n) {\n    $steps = 0;\n    for ($factor = 2; $factor * $factor <= $n; $factor++) {\n        while ($n % $factor === 0) {\n            $steps += $factor;\n            $n = intdiv($n, $factor);\n        }\n    }\n    if ($n > 1) $steps += $n;\n    return $steps;\n}`,
              ruby: `def minSteps(n)\n  steps = 0\n  factor = 2\n  while factor * factor <= n\n    while n % factor == 0\n      steps += factor\n      n /= factor\n    end\n    factor += 1\n  end\n  steps += n if n > 1\n  steps\nend`,
      },
    };
  })(),

  // ── Count Vowels Permutation ────────────────────────────────────
  (() => {
    const MOD = 1000000007;
    const ref = (n: number) => {
      // order: a e i o u
      let dp = [1, 1, 1, 1, 1];
      for (let step = 1; step < n; step++) {
        const next = [0, 0, 0, 0, 0];
        // a may be followed by e
        next[1] = (next[1] + dp[0]) % MOD;
        // e may be followed by a or i
        next[0] = (next[0] + dp[1]) % MOD;
        next[2] = (next[2] + dp[1]) % MOD;
        // i may be followed by a, e, o or u
        next[0] = (next[0] + dp[2]) % MOD;
        next[1] = (next[1] + dp[2]) % MOD;
        next[3] = (next[3] + dp[2]) % MOD;
        next[4] = (next[4] + dp[2]) % MOD;
        // o may be followed by i or u
        next[2] = (next[2] + dp[3]) % MOD;
        next[4] = (next[4] + dp[3]) % MOD;
        // u may be followed by a
        next[0] = (next[0] + dp[4]) % MOD;
        dp = next;
      }
      let total = 0;
      for (let i = 0; i < 5; i++) total = (total + dp[i]) % MOD;
      return total;
    };
    return {
      slug: "count-vowels-permutation",
      title: "Count Vowels Permutation",
      difficulty: "HARD" as const,
      tags: ["Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "countVowelPermutation", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer `n`, count the strings of length `n` over the vowels `a`, `e`, `i`, `o`, `u` that obey every rule:\n\n- `a` may only be followed by `e`.\n- `e` may only be followed by `a` or `i`.\n- `i` may **not** be followed by another `i`.\n- `o` may only be followed by `i` or `u`.\n- `u` may only be followed by `a`.\n\nReturn the count **modulo 10^9 + 7**.",
        [
          { in: "n = 1", out: "5", note: "All five single vowels qualify." },
          { in: "n = 2", out: "10" },
          { in: "n = 5", out: "68" },
        ],
        ["1 <= n <= 2000"]),
      hints: [
        "Let `dp[v]` be the number of valid strings of the current length that **end** in vowel `v`.",
        "Extending by one character redistributes those counts along the allowed transitions.",
        "The `i` rule is easiest read backwards: `i` may be preceded by anything except `i` itself.",
      ],
      examples: [
        { input: "1", expectedOutput: "5" },
        { input: "2", expectedOutput: "10" },
        { input: "5", expectedOutput: "68" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 2000);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def countVowelPermutation(n: int) -> int:\n    MOD = 1000000007\n    a = e = i = o = u = 1\n    for _ in range(n - 1):\n        a, e, i, o, u = (e + i + u) % MOD, (a + i) % MOD, (e + o) % MOD, i % MOD, (i + o) % MOD\n    return (a + e + i + o + u) % MOD`,
        javascript: `var countVowelPermutation = function(n) {\n    const MOD = 1000000007;\n    let a = 1, e = 1, i = 1, o = 1, u = 1;\n    for (let step = 1; step < n; step++) {\n        const na = (e + i + u) % MOD;\n        const ne = (a + i) % MOD;\n        const ni = (e + o) % MOD;\n        const no = i % MOD;\n        const nu = (i + o) % MOD;\n        a = na;\n        e = ne;\n        i = ni;\n        o = no;\n        u = nu;\n    }\n    return (a + e + i + o + u) % MOD;\n};`,
              typescript: `function countVowelPermutation(n: number): number {\n    var MOD = 1000000007;\n    var a = 1;\n    var e = 1;\n    var i = 1;\n    var o = 1;\n    var u = 1;\n    for (var step = 1; step < n; step++) {\n        var na = (e + i + u) % MOD;\n        var ne = (a + i) % MOD;\n        var ni = (e + o) % MOD;\n        var no = i % MOD;\n        var nu = (i + o) % MOD;\n        a = na;\n        e = ne;\n        i = ni;\n        o = no;\n        u = nu;\n    }\n    return (a + e + i + o + u) % MOD;\n}`,
              java: `public static int countVowelPermutation(int n) {\n    final long MOD = 1000000007L;\n    long a = 1, e = 1, i = 1, o = 1, u = 1;\n    for (int step = 1; step < n; step++) {\n        long na = (e + i + u) % MOD;\n        long ne = (a + i) % MOD;\n        long ni = (e + o) % MOD;\n        long no = i % MOD;\n        long nu = (i + o) % MOD;\n        a = na; e = ne; i = ni; o = no; u = nu;\n    }\n    return (int) ((a + e + i + o + u) % MOD);\n}`,
              cpp: `int countVowelPermutation(int n) {\n    const long long MOD = 1000000007LL;\n    long long a = 1, e = 1, i = 1, o = 1, u = 1;\n    for (int step = 1; step < n; step++) {\n        long long na = (e + i + u) % MOD;\n        long long ne = (a + i) % MOD;\n        long long ni = (e + o) % MOD;\n        long long no = i % MOD;\n        long long nu = (i + o) % MOD;\n        a = na; e = ne; i = ni; o = no; u = nu;\n    }\n    return (int) ((a + e + i + o + u) % MOD);\n}`,
              c: `int countVowelPermutation(int n) {\n    const long long MOD = 1000000007LL;\n    long long a = 1, e = 1, i = 1, o = 1, u = 1;\n    for (int step = 1; step < n; step++) {\n        long long na = (e + i + u) % MOD;\n        long long ne = (a + i) % MOD;\n        long long ni = (e + o) % MOD;\n        long long no = i % MOD;\n        long long nu = (i + o) % MOD;\n        a = na; e = ne; i = ni; o = no; u = nu;\n    }\n    return (int) ((a + e + i + o + u) % MOD);\n}`,
              csharp: `public static int CountVowelPermutation(int n)\n{\n    const long MOD = 1000000007L;\n    long a = 1, e = 1, i = 1, o = 1, u = 1;\n    for (int step = 1; step < n; step++)\n    {\n        long na = (e + i + u) % MOD;\n        long ne = (a + i) % MOD;\n        long ni = (e + o) % MOD;\n        long no = i % MOD;\n        long nu = (i + o) % MOD;\n        a = na; e = ne; i = ni; o = no; u = nu;\n    }\n    return (int) ((a + e + i + o + u) % MOD);\n}`,
              go: `func countVowelPermutation(n int) int {\n	const MOD = 1000000007\n	a, e, i, o, u := 1, 1, 1, 1, 1\n	for step := 1; step < n; step++ {\n		na := (e + i + u) % MOD\n		ne := (a + i) % MOD\n		ni := (e + o) % MOD\n		no := i % MOD\n		nu := (i + o) % MOD\n		a, e, i, o, u = na, ne, ni, no, nu\n	}\n	return (a + e + i + o + u) % MOD\n}`,
              kotlin: `fun countVowelPermutation(n: Int): Int {\n    val MOD = 1000000007L\n    var a = 1L\n    var e = 1L\n    var i = 1L\n    var o = 1L\n    var u = 1L\n    for (step in 1 until n) {\n        val na = (e + i + u) % MOD\n        val ne = (a + i) % MOD\n        val ni = (e + o) % MOD\n        val no = i % MOD\n        val nu = (i + o) % MOD\n        a = na; e = ne; i = ni; o = no; u = nu\n    }\n    return ((a + e + i + o + u) % MOD).toInt()\n}`,
              swift: `func countVowelPermutation(_ n: Int) -> Int {\n    let MOD = 1000000007\n    var a = 1\n    var e = 1\n    var i = 1\n    var o = 1\n    var u = 1\n    var step = 1\n    while step < n {\n        let na = (e + i + u) % MOD\n        let ne = (a + i) % MOD\n        let ni = (e + o) % MOD\n        let no = i % MOD\n        let nu = (i + o) % MOD\n        a = na\n        e = ne\n        i = ni\n        o = no\n        u = nu\n        step += 1\n    }\n    return (a + e + i + o + u) % MOD\n}`,
              rust: `fn countVowelPermutation(n: i32) -> i32 {\n    let modulus = 1000000007i64;\n    let mut a = 1i64;\n    let mut e = 1i64;\n    let mut i = 1i64;\n    let mut o = 1i64;\n    let mut u = 1i64;\n    for _ in 1..n {\n        let na = (e + i + u) % modulus;\n        let ne = (a + i) % modulus;\n        let ni = (e + o) % modulus;\n        let no = i % modulus;\n        let nu = (i + o) % modulus;\n        a = na;\n        e = ne;\n        i = ni;\n        o = no;\n        u = nu;\n    }\n    ((a + e + i + o + u) % modulus) as i32\n}`,
              php: `function countVowelPermutation($n) {\n    $MOD = 1000000007;\n    $a = 1; $e = 1; $i = 1; $o = 1; $u = 1;\n    for ($step = 1; $step < $n; $step++) {\n        $na = ($e + $i + $u) % $MOD;\n        $ne = ($a + $i) % $MOD;\n        $ni = ($e + $o) % $MOD;\n        $no = $i % $MOD;\n        $nu = ($i + $o) % $MOD;\n        $a = $na; $e = $ne; $i = $ni; $o = $no; $u = $nu;\n    }\n    return ($a + $e + $i + $o + $u) % $MOD;\n}`,
              ruby: `def countVowelPermutation(n)\n  mod = 1000000007\n  a = e = i = o = u = 1\n  (1...n).each do\n    na = (e + i + u) % mod\n    ne = (a + i) % mod\n    ni = (e + o) % mod\n    no = i % mod\n    nu = (i + o) % mod\n    a = na\n    e = ne\n    i = ni\n    o = no\n    u = nu\n  end\n  (a + e + i + o + u) % mod\nend`,
      },
    };
  })(),

  // ── Knight Dialer ───────────────────────────────────────────────
  (() => {
    const MOD = 1000000007;
    const MOVES: number[][] = [[4, 6], [6, 8], [7, 9], [4, 8], [3, 9, 0], [], [1, 7, 0], [2, 6], [1, 3], [2, 4]];
    const ref = (n: number) => {
      let dp = new Array(10).fill(1);
      for (let step = 1; step < n; step++) {
        const next = new Array(10).fill(0);
        for (let digit = 0; digit < 10; digit++) {
          for (const to of MOVES[digit]) next[digit] = (next[digit] + dp[to]) % MOD;
        }
        dp = next;
      }
      let total = 0;
      for (let d = 0; d < 10; d++) total = (total + dp[d]) % MOD;
      return total;
    };
    return {
      slug: "knight-dialer",
      title: "Knight Dialer",
      difficulty: "MEDIUM" as const,
      tags: ["Dynamic Programming", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "knightDialer", params: [{ name: "n", type: "int" as const }], returns: "int" as const },
      description: describe(
        "A chess knight stands on a phone keypad laid out as\n\n```\n1 2 3\n4 5 6\n7 8 9\n  0\n```\n\nThe knight moves in its usual L shape and must land on a numbered key each time. Starting from **any** key and making exactly `n - 1` moves dials a number of `n` digits.\n\nGiven `n`, return how many distinct numbers of length `n` can be dialled, **modulo 10^9 + 7**.",
        [
          { in: "n = 1", out: "10", note: "Any single key." },
          { in: "n = 2", out: "20" },
          { in: "n = 3", out: "46" },
        ],
        ["1 <= n <= 500"]),
      hints: [
        "Write down, for each key, the keys a knight can reach from it. Key 5 has none.",
        "Let `dp[d]` be the number of valid dials of the current length that **start** at digit `d`; each extra digit is one redistribution along those moves.",
        "Every one of the ten keys is a legal starting point, so the answer sums the whole array.",
      ],
      examples: [
        { input: "1", expectedOutput: "10" },
        { input: "2", expectedOutput: "20" },
        { input: "3", expectedOutput: "46" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 500);
        return { input: String(n), expectedOutput: String(ref(n)) };
      },
      solutions: {
        python: `def knightDialer(n: int) -> int:\n    MOD = 1000000007\n    moves = [[4, 6], [6, 8], [7, 9], [4, 8], [3, 9, 0], [], [1, 7, 0], [2, 6], [1, 3], [2, 4]]\n    dp = [1] * 10\n    for _ in range(n - 1):\n        nxt = [0] * 10\n        for digit in range(10):\n            for to in moves[digit]:\n                nxt[digit] = (nxt[digit] + dp[to]) % MOD\n        dp = nxt\n    return sum(dp) % MOD`,
        javascript: `var knightDialer = function(n) {\n    const MOD = 1000000007;\n    const moves = [[4, 6], [6, 8], [7, 9], [4, 8], [3, 9, 0], [], [1, 7, 0], [2, 6], [1, 3], [2, 4]];\n    let dp = new Array(10).fill(1);\n    for (let step = 1; step < n; step++) {\n        const next = new Array(10).fill(0);\n        for (let digit = 0; digit < 10; digit++) {\n            for (let k = 0; k < moves[digit].length; k++) {\n                next[digit] = (next[digit] + dp[moves[digit][k]]) % MOD;\n            }\n        }\n        dp = next;\n    }\n    let total = 0;\n    for (let d = 0; d < 10; d++) total = (total + dp[d]) % MOD;\n    return total;\n};`,
              typescript: `function knightDialer(n: number): number {\n    var MOD = 1000000007;\n    var moves = [[4, 6], [6, 8], [7, 9], [4, 8], [3, 9, 0], [], [1, 7, 0], [2, 6], [1, 3], [2, 4]];\n    var dp: number[] = [];\n    for (var k = 0; k < 10; k++) dp.push(1);\n    for (var step = 1; step < n; step++) {\n        var next: number[] = [];\n        for (var d = 0; d < 10; d++) next.push(0);\n        for (var digit = 0; digit < 10; digit++) {\n            for (var m = 0; m < moves[digit].length; m++) {\n                next[digit] = (next[digit] + dp[moves[digit][m]]) % MOD;\n            }\n        }\n        dp = next;\n    }\n    var total = 0;\n    for (var x = 0; x < 10; x++) total = (total + dp[x]) % MOD;\n    return total;\n}`,
              java: `public static int knightDialer(int n) {\n    final int MOD = 1000000007;\n    int[][] moves = {{4, 6}, {6, 8}, {7, 9}, {4, 8}, {3, 9, 0}, {}, {1, 7, 0}, {2, 6}, {1, 3}, {2, 4}};\n    int[] dp = new int[10];\n    Arrays.fill(dp, 1);\n    for (int step = 1; step < n; step++) {\n        int[] next = new int[10];\n        for (int digit = 0; digit < 10; digit++) {\n            for (int to : moves[digit]) {\n                next[digit] = (next[digit] + dp[to]) % MOD;\n            }\n        }\n        dp = next;\n    }\n    int total = 0;\n    for (int d = 0; d < 10; d++) total = (total + dp[d]) % MOD;\n    return total;\n}`,
              cpp: `int knightDialer(int n) {\n    const int MOD = 1000000007;\n    vector<vector<int>> moves = {{4, 6}, {6, 8}, {7, 9}, {4, 8}, {3, 9, 0}, {}, {1, 7, 0}, {2, 6}, {1, 3}, {2, 4}};\n    vector<int> dp(10, 1);\n    for (int step = 1; step < n; step++) {\n        vector<int> next(10, 0);\n        for (int digit = 0; digit < 10; digit++) {\n            for (int to : moves[digit]) {\n                next[digit] = (next[digit] + dp[to]) % MOD;\n            }\n        }\n        dp = next;\n    }\n    int total = 0;\n    for (int d = 0; d < 10; d++) total = (total + dp[d]) % MOD;\n    return total;\n}`,
              c: `int knightDialer(int n) {\n    const int MOD = 1000000007;\n    int moves[10][3] = {\n        {4, 6, -1}, {6, 8, -1}, {7, 9, -1}, {4, 8, -1}, {3, 9, 0},\n        {-1, -1, -1}, {1, 7, 0}, {2, 6, -1}, {1, 3, -1}, {2, 4, -1}\n    };\n    int dp[10];\n    int next[10];\n    for (int d = 0; d < 10; d++) dp[d] = 1;\n    for (int step = 1; step < n; step++) {\n        for (int d = 0; d < 10; d++) next[d] = 0;\n        for (int digit = 0; digit < 10; digit++) {\n            for (int m = 0; m < 3; m++) {\n                if (moves[digit][m] < 0) continue;\n                next[digit] = (next[digit] + dp[moves[digit][m]]) % MOD;\n            }\n        }\n        for (int d = 0; d < 10; d++) dp[d] = next[d];\n    }\n    int total = 0;\n    for (int d = 0; d < 10; d++) total = (total + dp[d]) % MOD;\n    return total;\n}`,
              csharp: `public static int KnightDialer(int n)\n{\n    const int MOD = 1000000007;\n    int[][] moves = new int[][] {\n        new int[] {4, 6}, new int[] {6, 8}, new int[] {7, 9}, new int[] {4, 8},\n        new int[] {3, 9, 0}, new int[] {}, new int[] {1, 7, 0}, new int[] {2, 6},\n        new int[] {1, 3}, new int[] {2, 4}\n    };\n    int[] dp = new int[10];\n    for (int d = 0; d < 10; d++) dp[d] = 1;\n    for (int step = 1; step < n; step++)\n    {\n        int[] next = new int[10];\n        for (int digit = 0; digit < 10; digit++)\n        {\n            foreach (int to in moves[digit])\n            {\n                next[digit] = (next[digit] + dp[to]) % MOD;\n            }\n        }\n        dp = next;\n    }\n    int total = 0;\n    for (int d = 0; d < 10; d++) total = (total + dp[d]) % MOD;\n    return total;\n}`,
              go: `func knightDialer(n int) int {\n	const MOD = 1000000007\n	moves := [][]int{{4, 6}, {6, 8}, {7, 9}, {4, 8}, {3, 9, 0}, {}, {1, 7, 0}, {2, 6}, {1, 3}, {2, 4}}\n	dp := make([]int, 10)\n	for d := range dp {\n		dp[d] = 1\n	}\n	for step := 1; step < n; step++ {\n		next := make([]int, 10)\n		for digit := 0; digit < 10; digit++ {\n			for _, to := range moves[digit] {\n				next[digit] = (next[digit] + dp[to]) % MOD\n			}\n		}\n		dp = next\n	}\n	total := 0\n	for d := 0; d < 10; d++ {\n		total = (total + dp[d]) % MOD\n	}\n	return total\n}`,
              kotlin: `fun knightDialer(n: Int): Int {\n    val MOD = 1000000007\n    val moves = arrayOf(\n        intArrayOf(4, 6), intArrayOf(6, 8), intArrayOf(7, 9), intArrayOf(4, 8),\n        intArrayOf(3, 9, 0), intArrayOf(), intArrayOf(1, 7, 0), intArrayOf(2, 6),\n        intArrayOf(1, 3), intArrayOf(2, 4)\n    )\n    var dp = IntArray(10) { 1 }\n    for (step in 1 until n) {\n        val next = IntArray(10)\n        for (digit in 0 until 10) {\n            for (to in moves[digit]) {\n                next[digit] = (next[digit] + dp[to]) % MOD\n            }\n        }\n        dp = next\n    }\n    var total = 0\n    for (d in 0 until 10) total = (total + dp[d]) % MOD\n    return total\n}`,
              swift: `func knightDialer(_ n: Int) -> Int {\n    let MOD = 1000000007\n    let moves: [[Int]] = [[4, 6], [6, 8], [7, 9], [4, 8], [3, 9, 0], [], [1, 7, 0], [2, 6], [1, 3], [2, 4]]\n    var dp = [Int](repeating: 1, count: 10)\n    var step = 1\n    while step < n {\n        var next = [Int](repeating: 0, count: 10)\n        for digit in 0..<10 {\n            for to in moves[digit] {\n                next[digit] = (next[digit] + dp[to]) % MOD\n            }\n        }\n        dp = next\n        step += 1\n    }\n    var total = 0\n    for d in 0..<10 { total = (total + dp[d]) % MOD }\n    return total\n}`,
              rust: `fn knightDialer(n: i32) -> i32 {\n    let modulus = 1000000007i64;\n    let moves: Vec<Vec<usize>> = vec![\n        vec![4, 6], vec![6, 8], vec![7, 9], vec![4, 8], vec![3, 9, 0],\n        vec![], vec![1, 7, 0], vec![2, 6], vec![1, 3], vec![2, 4],\n    ];\n    let mut dp = vec![1i64; 10];\n    for _ in 1..n {\n        let mut next = vec![0i64; 10];\n        for digit in 0..10 {\n            for to in moves[digit].iter() {\n                next[digit] = (next[digit] + dp[*to]) % modulus;\n            }\n        }\n        dp = next;\n    }\n    let mut total = 0i64;\n    for d in 0..10 {\n        total = (total + dp[d]) % modulus;\n    }\n    total as i32\n}`,
              php: `function knightDialer($n) {\n    $MOD = 1000000007;\n    $moves = array(\n        array(4, 6), array(6, 8), array(7, 9), array(4, 8), array(3, 9, 0),\n        array(), array(1, 7, 0), array(2, 6), array(1, 3), array(2, 4)\n    );\n    $dp = array_fill(0, 10, 1);\n    for ($step = 1; $step < $n; $step++) {\n        $next = array_fill(0, 10, 0);\n        for ($digit = 0; $digit < 10; $digit++) {\n            foreach ($moves[$digit] as $to) {\n                $next[$digit] = ($next[$digit] + $dp[$to]) % $MOD;\n            }\n        }\n        $dp = $next;\n    }\n    $total = 0;\n    for ($d = 0; $d < 10; $d++) $total = ($total + $dp[$d]) % $MOD;\n    return $total;\n}`,
              ruby: `def knightDialer(n)\n  mod = 1000000007\n  moves = [[4, 6], [6, 8], [7, 9], [4, 8], [3, 9, 0], [], [1, 7, 0], [2, 6], [1, 3], [2, 4]]\n  dp = Array.new(10, 1)\n  (1...n).each do\n    nxt = Array.new(10, 0)\n    (0...10).each do |digit|\n      moves[digit].each do |to|\n        nxt[digit] = (nxt[digit] + dp[to]) % mod\n      end\n    end\n    dp = nxt\n  end\n  dp.sum % mod\nend`,
      },
    };
  })(),
];
