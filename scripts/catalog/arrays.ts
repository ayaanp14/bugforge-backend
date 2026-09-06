/** Arrays & basic problem solving — hand-authored classics. */

import { bool, describe, explain, fmtIntArr, makeRng, pick, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

const genArr = (rng: Rng, len: [number, number], val: [number, number]) =>
  Array.from({ length: ri(rng, len[0], len[1]) }, () => ri(rng, val[0], val[1]));

export const ARRAY_PROBLEMS: CatalogProblem[] = [

  // ── Best Time to Buy and Sell Stock ─────────────────────────────
  (() => {
    const ref = (prices: number[]) => {
      let min = Infinity, best = 0;
      for (const p of prices) { min = Math.min(min, p); best = Math.max(best, p - min); }
      return best;
    };
    return {
      slug: "best-time-to-buy-and-sell-stock",
      title: "Best Time to Buy and Sell Stock",
      difficulty: "EASY" as const,
      tags: ["Array", "Dynamic Programming"],
      signature: { funcName: "maxProfit", params: [{ name: "prices", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `prices` where `prices[i]` is the price of a stock on day `i`.\n\nYou want to maximize profit by choosing **one day to buy** and a **later day to sell**. Return the maximum profit; if no profit is possible, return `0`.",
        [
          { in: "prices = [7,1,5,3,6,4]", out: "5", note: "Buy on day 2 (price 1), sell on day 5 (price 6): 6 - 1 = 5." },
          { in: "prices = [7,6,4,3,1]", out: "0", note: "Prices only fall — no profitable transaction exists." },
        ],
        ["1 <= prices.length <= 30", "0 <= prices[i] <= 1000"]),
      hints: [
        "Track the lowest price seen so far while scanning left to right.",
        "At each day, the best sale ending here is price - minSoFar.",
      ],
      examples: [
        { input: "[7,1,5,3,6,4]", expectedOutput: "5" },
        { input: "[7,6,4,3,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const prices = genArr(rng, [1, 30], [0, 1000]);
        return { input: fmtIntArr(prices), expectedOutput: String(ref(prices)) };
      },
      editorial: explain({
        idea: "For any chosen sell day, the best possible buy is the cheapest price seen **before** it. So sweep once, carrying the minimum price so far, and at each day ask what profit selling today would give. The largest of those is the answer.",
        steps: [
          "Track `minPrice`, initially the first day's price, and `best`, initially `0`.",
          "For each later day, compute `price - minPrice` and update `best` if it is larger.",
          "Then update `minPrice` if today's price is lower.",
          "Return `best`.",
        ],
        why: "Every valid transaction is determined by its sell day, and for a fixed sell day the profit is maximised by the smallest price strictly before it — which is exactly what `minPrice` holds when the day is examined. Taking the maximum over all sell days therefore covers every transaction once. Updating `minPrice` **after** computing the profit is what enforces \"buy before sell\": a single day can never be both.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Seed the profit at `0`, not at a negative sentinel — no transaction is always allowed, so a falling market answers `0`.",
          "Update the running minimum after taking the profit, or you allow buying and selling on the same day.",
          "This is the single-transaction problem; summing every upward step solves the unlimited-transactions variant instead.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef maxProfit(prices: List[int]) -> int:\n    lo = float("inf")\n    best = 0\n    for p in prices:\n        lo = min(lo, p)\n        best = max(best, p - lo)\n    return best`,
        javascript: `var maxProfit = function(prices) {\n    let lo = Infinity, best = 0;\n    for (const p of prices) {\n        lo = Math.min(lo, p);\n        best = Math.max(best, p - lo);\n    }\n    return best;\n};`,
              typescript: `function maxProfit(prices: number[]): number {\n    let minPrice = prices[0];\n    let best = 0;\n    for (let i = 1; i < prices.length; i++) {\n        if (prices[i] - minPrice > best) best = prices[i] - minPrice;\n        if (prices[i] < minPrice) minPrice = prices[i];\n    }\n    return best;\n}`,
              java: `public static int maxProfit(int[] prices) {\n    int minPrice = prices[0], best = 0;\n    for (int i = 1; i < prices.length; i++) {\n        if (prices[i] - minPrice > best) best = prices[i] - minPrice;\n        if (prices[i] < minPrice) minPrice = prices[i];\n    }\n    return best;\n}`,
              cpp: `int maxProfit(vector<int>& prices) {\n    int minPrice = prices[0], best = 0;\n    for (int i = 1; i < (int) prices.size(); i++) {\n        if (prices[i] - minPrice > best) best = prices[i] - minPrice;\n        if (prices[i] < minPrice) minPrice = prices[i];\n    }\n    return best;\n}`,
              c: `int maxProfit(int* prices, int pricesSize) {\n    int minPrice = prices[0], best = 0;\n    for (int i = 1; i < pricesSize; i++) {\n        if (prices[i] - minPrice > best) best = prices[i] - minPrice;\n        if (prices[i] < minPrice) minPrice = prices[i];\n    }\n    return best;\n}`,
              csharp: `public static int MaxProfit(int[] prices)\n{\n    int minPrice = prices[0], best = 0;\n    for (int i = 1; i < prices.Length; i++)\n    {\n        if (prices[i] - minPrice > best) best = prices[i] - minPrice;\n        if (prices[i] < minPrice) minPrice = prices[i];\n    }\n    return best;\n}`,
              go: `func maxProfit(prices []int) int {\n	minPrice := prices[0]\n	best := 0\n	for i := 1; i < len(prices); i++ {\n		if prices[i]-minPrice > best {\n			best = prices[i] - minPrice\n		}\n		if prices[i] < minPrice {\n			minPrice = prices[i]\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxProfit(prices: IntArray): Int {\n    var minPrice = prices[0]\n    var best = 0\n    for (i in 1 until prices.size) {\n        if (prices[i] - minPrice > best) best = prices[i] - minPrice\n        if (prices[i] < minPrice) minPrice = prices[i]\n    }\n    return best\n}`,
              swift: `func maxProfit(_ prices: [Int]) -> Int {\n    var minPrice = prices[0]\n    var best = 0\n    var i = 1\n    while i < prices.count {\n        if prices[i] - minPrice > best { best = prices[i] - minPrice }\n        if prices[i] < minPrice { minPrice = prices[i] }\n        i += 1\n    }\n    return best\n}`,
              rust: `fn maxProfit(prices: Vec<i32>) -> i32 {\n    let mut min_price = prices[0];\n    let mut best = 0;\n    for i in 1..prices.len() {\n        if prices[i] - min_price > best {\n            best = prices[i] - min_price;\n        }\n        if prices[i] < min_price {\n            min_price = prices[i];\n        }\n    }\n    best\n}`,
              php: `function maxProfit($prices) {\n    $minPrice = $prices[0];\n    $best = 0;\n    $n = count($prices);\n    for ($i = 1; $i < $n; $i++) {\n        if ($prices[$i] - $minPrice > $best) $best = $prices[$i] - $minPrice;\n        if ($prices[$i] < $minPrice) $minPrice = $prices[$i];\n    }\n    return $best;\n}`,
              ruby: `def maxProfit(prices)\n  min_price = prices[0]\n  best = 0\n  (1...prices.length).each do |i|\n    best = prices[i] - min_price if prices[i] - min_price > best\n    min_price = prices[i] if prices[i] < min_price\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Product of Array Except Self ────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length, out = new Array(n).fill(1);
      let acc = 1;
      for (let i = 0; i < n; i++) { out[i] = acc; acc *= nums[i]; }
      acc = 1;
      for (let i = n - 1; i >= 0; i--) { out[i] *= acc; acc *= nums[i]; }
      return out;
    };
    return {
      slug: "product-of-array-except-self",
      title: "Product of Array Except Self",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Prefix Sum"],
      signature: { funcName: "productExceptSelf", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums`, return an array `answer` where `answer[i]` is the **product of every element of `nums` except `nums[i]`**.\n\nYou must solve it **without using division** and in `O(n)` time.",
        [
          { in: "nums = [1,2,3,4]", out: "[24,12,8,6]" },
          { in: "nums = [-1,1,0,-3,3]", out: "[0,0,9,0,0]" },
        ],
        ["2 <= nums.length <= 10", "-4 <= nums[i] <= 4"],
        "can you do it in O(1) extra space (the output array does not count)?"),
      hints: [
        "answer[i] equals (product of everything to the left of i) × (product of everything to the right).",
        "Two sweeps: one accumulating prefix products, one accumulating suffix products into the same output.",
      ],
      examples: [
        { input: "[1,2,3,4]", expectedOutput: "[24,12,8,6]" },
        { input: "[-1,1,0,-3,3]", expectedOutput: "[0,0,9,0,0]" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [2, 10], [-4, 4]);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      editorial: explain({
        idea: "The product excluding index `i` is the product of everything to its **left** times everything to its **right**. Compute those two running products in two sweeps, and division is never needed — which matters because a single zero would make division impossible.",
        steps: [
          "Sweep left to right, writing into `answer[i]` the product of all elements strictly before `i`.",
          "Start that running product at `1`, so the first entry is `1`.",
          "Sweep right to left with a second running product of everything strictly after `i`.",
          "Multiply it into `answer[i]` as you go.",
          "The output array itself carries the left products, so no third array is needed.",
        ],
        why: "Splitting at index `i` partitions the other elements into exactly two groups, so their products multiply to give the answer — no element is counted twice or missed. Doing it as prefix and suffix sweeps means each product is built incrementally rather than recomputed, giving linear time. It also handles zeros for free: a zero simply propagates into whichever side contains it, with no special-casing of one-zero or two-zero inputs.",
        time: "O(n)",
        space: "O(1) extra, not counting the output",
        pitfalls: [
          "Division is forbidden, and would need awkward special cases for one zero and for two or more zeros.",
          "Both running products start at `1`, the multiplicative identity.",
          "The products must exclude `i` itself — multiply *before* folding the current element into the running product.",
          "Reuse the output array for the left pass to keep the extra space constant.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef productExceptSelf(nums: List[int]) -> List[int]:\n    n = len(nums)\n    out = [1] * n\n    acc = 1\n    for i in range(n):\n        out[i] = acc\n        acc *= nums[i]\n    acc = 1\n    for i in range(n - 1, -1, -1):\n        out[i] *= acc\n        acc *= nums[i]\n    return out`,
        javascript: `var productExceptSelf = function(nums) {\n    const n = nums.length;\n    const out = new Array(n).fill(1);\n    let acc = 1;\n    for (let i = 0; i < n; i++) {\n        out[i] = acc;\n        acc *= nums[i];\n    }\n    acc = 1;\n    for (let i = n - 1; i >= 0; i--) {\n        out[i] *= acc;\n        acc *= nums[i];\n    }\n    return out;\n};`,
              typescript: `function productExceptSelf(nums: number[]): number[] {\n    const n = nums.length;\n    const answer: number[] = [];\n    let running = 1;\n    for (let i = 0; i < n; i++) {\n        answer.push(running);\n        running *= nums[i];\n    }\n    running = 1;\n    for (let i = n - 1; i >= 0; i--) {\n        answer[i] *= running;\n        running *= nums[i];\n    }\n    return answer;\n}`,
              java: `public static int[] productExceptSelf(int[] nums) {\n    int n = nums.length;\n    int[] answer = new int[n];\n    int running = 1;\n    for (int i = 0; i < n; i++) {\n        answer[i] = running;\n        running *= nums[i];\n    }\n    running = 1;\n    for (int i = n - 1; i >= 0; i--) {\n        answer[i] *= running;\n        running *= nums[i];\n    }\n    return answer;\n}`,
              cpp: `vector<int> productExceptSelf(vector<int>& nums) {\n    int n = (int) nums.size();\n    vector<int> answer(n, 1);\n    int running = 1;\n    for (int i = 0; i < n; i++) {\n        answer[i] = running;\n        running *= nums[i];\n    }\n    running = 1;\n    for (int i = n - 1; i >= 0; i--) {\n        answer[i] *= running;\n        running *= nums[i];\n    }\n    return answer;\n}`,
              c: `int* productExceptSelf(int* nums, int numsSize, int* returnSize) {\n    int n = numsSize;\n    int* answer = (int*) malloc(n * sizeof(int));\n    int running = 1;\n    for (int i = 0; i < n; i++) {\n        answer[i] = running;\n        running *= nums[i];\n    }\n    running = 1;\n    for (int i = n - 1; i >= 0; i--) {\n        answer[i] *= running;\n        running *= nums[i];\n    }\n    *returnSize = n;\n    return answer;\n}`,
              csharp: `public static int[] ProductExceptSelf(int[] nums)\n{\n    int n = nums.Length;\n    int[] answer = new int[n];\n    int running = 1;\n    for (int i = 0; i < n; i++)\n    {\n        answer[i] = running;\n        running *= nums[i];\n    }\n    running = 1;\n    for (int i = n - 1; i >= 0; i--)\n    {\n        answer[i] *= running;\n        running *= nums[i];\n    }\n    return answer;\n}`,
              go: `func productExceptSelf(nums []int) []int {\n	n := len(nums)\n	answer := make([]int, n)\n	running := 1\n	for i := 0; i < n; i++ {\n		answer[i] = running\n		running *= nums[i]\n	}\n	running = 1\n	for i := n - 1; i >= 0; i-- {\n		answer[i] *= running\n		running *= nums[i]\n	}\n	return answer\n}`,
              kotlin: `fun productExceptSelf(nums: IntArray): IntArray {\n    val n = nums.size\n    val answer = IntArray(n)\n    var running = 1\n    for (i in 0 until n) {\n        answer[i] = running\n        running *= nums[i]\n    }\n    running = 1\n    for (i in n - 1 downTo 0) {\n        answer[i] *= running\n        running *= nums[i]\n    }\n    return answer\n}`,
              swift: `func productExceptSelf(_ nums: [Int]) -> [Int] {\n    let n = nums.count\n    var answer = [Int](repeating: 1, count: n)\n    var running = 1\n    for i in 0..<n {\n        answer[i] = running\n        running *= nums[i]\n    }\n    running = 1\n    var i = n - 1\n    while i >= 0 {\n        answer[i] *= running\n        running *= nums[i]\n        i -= 1\n    }\n    return answer\n}`,
              rust: `fn productExceptSelf(nums: Vec<i32>) -> Vec<i32> {\n    let n = nums.len();\n    let mut answer = vec![1i32; n];\n    let mut running = 1;\n    for i in 0..n {\n        answer[i] = running;\n        running *= nums[i];\n    }\n    running = 1;\n    let mut i = n;\n    while i > 0 {\n        i -= 1;\n        answer[i] *= running;\n        running *= nums[i];\n    }\n    answer\n}`,
              php: `function productExceptSelf($nums) {\n    $n = count($nums);\n    $answer = array_fill(0, $n, 1);\n    $running = 1;\n    for ($i = 0; $i < $n; $i++) {\n        $answer[$i] = $running;\n        $running *= $nums[$i];\n    }\n    $running = 1;\n    for ($i = $n - 1; $i >= 0; $i--) {\n        $answer[$i] *= $running;\n        $running *= $nums[$i];\n    }\n    return $answer;\n}`,
              ruby: `def productExceptSelf(nums)\n  n = nums.length\n  answer = Array.new(n, 1)\n  running = 1\n  (0...n).each do |i|\n    answer[i] = running\n    running *= nums[i]\n  end\n  running = 1\n  (n - 1).downto(0) do |i|\n    answer[i] *= running\n    running *= nums[i]\n  end\n  answer\nend`,
      },
    };
  })(),

  // ── Move Zeroes ─────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => [...nums.filter((x) => x !== 0), ...nums.filter((x) => x === 0)];
    return {
      slug: "move-zeroes",
      title: "Move Zeroes",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers"],
      signature: { funcName: "moveZeroes", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums`, move all `0`s to the **end** while keeping the relative order of the non-zero elements, then return the array.\n\nDo this **in place** with O(1) extra memory, then return `nums`.",
        [
          { in: "nums = [0,1,0,3,12]", out: "[1,3,12,0,0]" },
          { in: "nums = [0]", out: "[0]" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i] <= 100"]),
      hints: [
        "Keep a write pointer for where the next non-zero belongs.",
        "After copying every non-zero forward, fill the rest with zeros.",
      ],
      examples: [
        { input: "[0,1,0,3,12]", expectedOutput: "[1,3,12,0,0]" },
        { input: "[0]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 30], [-100, 100]).map((x) => (Math.abs(x) < 25 ? 0 : x));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      editorial: explain({
        idea: "Keep a **write pointer** marking where the next non-zero value belongs. Sweep the array, and every time you meet a non-zero, copy it to the write position and advance. Once the sweep ends, everything from the write pointer onwards must be zeros.",
        steps: [
          "Set `write = 0`.",
          "Scan the array with a read index.",
          "On a non-zero value, store it at `nums[write]` and increment `write`.",
          "After the scan, fill positions `write .. n-1` with `0`.",
          "Return the array.",
        ],
        why: "The non-zero values are copied in the order they were met, so their relative order is preserved — which is the part of the problem a naive swap-everything approach gets wrong. The write pointer never overtakes the read pointer, so no unread value is ever clobbered. Counting is implicit: the number of trailing slots is exactly the number of zeros removed.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Order among the non-zero values must be preserved, so swapping with the array's end is wrong.",
          "Do not forget the second pass that writes the trailing zeros — otherwise stale values remain.",
          "An array of all zeros or no zeros must both work; the two-phase structure handles them without special cases.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef moveZeroes(nums: List[int]) -> List[int]:\n    w = 0\n    for x in nums:\n        if x != 0:\n            nums[w] = x\n            w += 1\n    for i in range(w, len(nums)):\n        nums[i] = 0\n    return nums`,
        javascript: `var moveZeroes = function(nums) {\n    let w = 0;\n    for (const x of nums) {\n        if (x !== 0) nums[w++] = x;\n    }\n    while (w < nums.length) nums[w++] = 0;\n    return nums;\n};`,
              typescript: `function moveZeroes(nums: number[]): number[] {\n    let write = 0;\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] !== 0) {\n            nums[write] = nums[i];\n            write++;\n        }\n    }\n    for (let i = write; i < nums.length; i++) nums[i] = 0;\n    return nums;\n}`,
              java: `public static int[] moveZeroes(int[] nums) {\n    int write = 0;\n    for (int i = 0; i < nums.length; i++) {\n        if (nums[i] != 0) {\n            nums[write] = nums[i];\n            write++;\n        }\n    }\n    for (int i = write; i < nums.length; i++) nums[i] = 0;\n    return nums;\n}`,
              cpp: `vector<int> moveZeroes(vector<int>& nums) {\n    int write = 0;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        if (nums[i] != 0) {\n            nums[write] = nums[i];\n            write++;\n        }\n    }\n    for (int i = write; i < (int) nums.size(); i++) nums[i] = 0;\n    return nums;\n}`,
              c: `int* moveZeroes(int* nums, int numsSize, int* returnSize) {\n    int write = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] != 0) {\n            nums[write] = nums[i];\n            write++;\n        }\n    }\n    for (int i = write; i < numsSize; i++) nums[i] = 0;\n    *returnSize = numsSize;\n    return nums;\n}`,
              csharp: `public static int[] MoveZeroes(int[] nums)\n{\n    int write = 0;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        if (nums[i] != 0)\n        {\n            nums[write] = nums[i];\n            write++;\n        }\n    }\n    for (int i = write; i < nums.Length; i++) nums[i] = 0;\n    return nums;\n}`,
              go: `func moveZeroes(nums []int) []int {\n	write := 0\n	for i := 0; i < len(nums); i++ {\n		if nums[i] != 0 {\n			nums[write] = nums[i]\n			write++\n		}\n	}\n	for i := write; i < len(nums); i++ {\n		nums[i] = 0\n	}\n	return nums\n}`,
              kotlin: `fun moveZeroes(nums: IntArray): IntArray {\n    var write = 0\n    for (i in nums.indices) {\n        if (nums[i] != 0) {\n            nums[write] = nums[i]\n            write++\n        }\n    }\n    for (i in write until nums.size) nums[i] = 0\n    return nums\n}`,
              swift: `func moveZeroes(_ nums: [Int]) -> [Int] {\n    var a = nums\n    var write = 0\n    for i in 0..<a.count {\n        if a[i] != 0 {\n            a[write] = a[i]\n            write += 1\n        }\n    }\n    var i = write\n    while i < a.count {\n        a[i] = 0\n        i += 1\n    }\n    return a\n}`,
              rust: `fn moveZeroes(nums: Vec<i32>) -> Vec<i32> {\n    let mut a = nums;\n    let n = a.len();\n    let mut write = 0usize;\n    for i in 0..n {\n        if a[i] != 0 {\n            a[write] = a[i];\n            write += 1;\n        }\n    }\n    for i in write..n {\n        a[i] = 0;\n    }\n    a\n}`,
              php: `function moveZeroes($nums) {\n    $write = 0;\n    $n = count($nums);\n    for ($i = 0; $i < $n; $i++) {\n        if ($nums[$i] !== 0) {\n            $nums[$write] = $nums[$i];\n            $write++;\n        }\n    }\n    for ($i = $write; $i < $n; $i++) $nums[$i] = 0;\n    return $nums;\n}`,
              ruby: `def moveZeroes(nums)\n  write = 0\n  (0...nums.length).each do |i|\n    if nums[i] != 0\n      nums[write] = nums[i]\n      write += 1\n    end\n  end\n  (write...nums.length).each { |i| nums[i] = 0 }\n  nums\nend`,
      },
    };
  })(),

  // ── Remove Duplicates from Sorted Array ─────────────────────────
  (() => {
    const ref = (nums: number[]) => nums.filter((x, i) => i === 0 || x !== nums[i - 1]);
    return {
      slug: "remove-duplicates-from-sorted-array",
      title: "Remove Duplicates from Sorted Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers"],
      signature: { funcName: "removeDuplicates", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums` sorted in **non-decreasing order**, remove the duplicates so each unique element appears **once**, keeping the order. Return the resulting array.",
        [
          { in: "nums = [1,1,2]", out: "[1,2]" },
          { in: "nums = [0,0,1,1,1,2,2,3,3,4]", out: "[0,1,2,3,4]" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i] <= 100", "nums is sorted in non-decreasing order"]),
      hints: [
        "Because the array is sorted, duplicates sit next to each other.",
        "Compare each element with the previous one — keep it only when it differs.",
      ],
      examples: [
        { input: "[1,1,2]", expectedOutput: "[1,2]" },
        { input: "[0,0,1,1,1,2,2,3,3,4]", expectedOutput: "[0,1,2,3,4]" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 30], [-100, 100]).sort((a, b) => a - b);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      editorial: explain({
        idea: "Because the array is sorted, equal values are adjacent — so a value is a duplicate exactly when it equals the one just kept. Use a write pointer for the deduplicated prefix and only advance it when a genuinely new value appears.",
        steps: [
          "Keep the first element; set `write = 1`.",
          "Scan from the second element onwards.",
          "If the current value differs from `nums[write - 1]` — the last value kept — write it at `nums[write]` and advance.",
          "Return the first `write` elements.",
        ],
        why: "Sortedness turns \"have I seen this value?\" into a single comparison against the previous kept value: any earlier occurrence of the same value must be adjacent to it, so nothing further back needs checking. That is why no hash set is needed and the extra space stays constant. The write pointer trails the read pointer, so values are never overwritten before being examined.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Compare against the last **kept** element (`nums[write - 1]`), not the previous element in the original array.",
          "Seed `write = 1`, since the first element is always kept.",
          "This relies on the input being sorted; on unsorted data it silently keeps duplicates.",
          "A single-element array must be returned unchanged, which the seeding covers.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef removeDuplicates(nums: List[int]) -> List[int]:\n    out = []\n    for x in nums:\n        if not out or out[-1] != x:\n            out.append(x)\n    return out`,
        javascript: `var removeDuplicates = function(nums) {\n    const out = [];\n    for (const x of nums) {\n        if (out.length === 0 || out[out.length - 1] !== x) out.push(x);\n    }\n    return out;\n};`,
              typescript: `function removeDuplicates(nums: number[]): number[] {\n    let write = 1;\n    for (let i = 1; i < nums.length; i++) {\n        if (nums[i] !== nums[write - 1]) {\n            nums[write] = nums[i];\n            write++;\n        }\n    }\n    return nums.slice(0, write);\n}`,
              java: `public static int[] removeDuplicates(int[] nums) {\n    int write = 1;\n    for (int i = 1; i < nums.length; i++) {\n        if (nums[i] != nums[write - 1]) {\n            nums[write] = nums[i];\n            write++;\n        }\n    }\n    return Arrays.copyOf(nums, write);\n}`,
              cpp: `vector<int> removeDuplicates(vector<int>& nums) {\n    int write = 1;\n    for (int i = 1; i < (int) nums.size(); i++) {\n        if (nums[i] != nums[write - 1]) {\n            nums[write] = nums[i];\n            write++;\n        }\n    }\n    return vector<int>(nums.begin(), nums.begin() + write);\n}`,
              c: `int* removeDuplicates(int* nums, int numsSize, int* returnSize) {\n    int write = 1;\n    for (int i = 1; i < numsSize; i++) {\n        if (nums[i] != nums[write - 1]) {\n            nums[write] = nums[i];\n            write++;\n        }\n    }\n    *returnSize = write;\n    return nums;\n}`,
              csharp: `public static int[] RemoveDuplicates(int[] nums)\n{\n    int write = 1;\n    for (int i = 1; i < nums.Length; i++)\n    {\n        if (nums[i] != nums[write - 1])\n        {\n            nums[write] = nums[i];\n            write++;\n        }\n    }\n    int[] res = new int[write];\n    Array.Copy(nums, res, write);\n    return res;\n}`,
              go: `func removeDuplicates(nums []int) []int {\n	write := 1\n	for i := 1; i < len(nums); i++ {\n		if nums[i] != nums[write-1] {\n			nums[write] = nums[i]\n			write++\n		}\n	}\n	return nums[:write]\n}`,
              kotlin: `fun removeDuplicates(nums: IntArray): IntArray {\n    var write = 1\n    for (i in 1 until nums.size) {\n        if (nums[i] != nums[write - 1]) {\n            nums[write] = nums[i]\n            write++\n        }\n    }\n    return nums.copyOf(write)\n}`,
              swift: `func removeDuplicates(_ nums: [Int]) -> [Int] {\n    var a = nums\n    var write = 1\n    var i = 1\n    while i < a.count {\n        if a[i] != a[write - 1] {\n            a[write] = a[i]\n            write += 1\n        }\n        i += 1\n    }\n    return Array(a[0..<write])\n}`,
              rust: `fn removeDuplicates(nums: Vec<i32>) -> Vec<i32> {\n    let mut a = nums;\n    let mut write = 1usize;\n    for i in 1..a.len() {\n        if a[i] != a[write - 1] {\n            a[write] = a[i];\n            write += 1;\n        }\n    }\n    a.truncate(write);\n    a\n}`,
              php: `function removeDuplicates($nums) {\n    $write = 1;\n    $n = count($nums);\n    for ($i = 1; $i < $n; $i++) {\n        if ($nums[$i] !== $nums[$write - 1]) {\n            $nums[$write] = $nums[$i];\n            $write++;\n        }\n    }\n    return array_slice($nums, 0, $write);\n}`,
              ruby: `def removeDuplicates(nums)\n  write = 1\n  (1...nums.length).each do |i|\n    if nums[i] != nums[write - 1]\n      nums[write] = nums[i]\n      write += 1\n    end\n  end\n  nums[0...write]\nend`,
      },
    };
  })(),

  // ── Rotate Array ────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const n = nums.length, s = k % n;
      return [...nums.slice(n - s), ...nums.slice(0, n - s)];
    };
    return {
      slug: "rotate-array",
      title: "Rotate Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Math", "Two Pointers"],
      signature: { funcName: "rotate", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums`, rotate the array to the **right** by `k` steps (`k` is non-negative) and return the result.",
        [
          { in: "nums = [1,2,3,4,5,6,7], k = 3", out: "[5,6,7,1,2,3,4]", note: "Rotate right 3 times: [7,1,…], [6,7,1,…], [5,6,7,1,2,3,4]." },
          { in: "nums = [-1,-100,3,99], k = 2", out: "[3,99,-1,-100]" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i] <= 100", "0 <= k <= 100"],
        "the classic in-place trick reverses the whole array, then each half."),
      hints: [
        "k can exceed the length — reduce it with k % n first.",
        "The last k % n elements move to the front, everything else shifts right.",
      ],
      examples: [
        { input: "[1,2,3,4,5,6,7]\n3", expectedOutput: "[5,6,7,1,2,3,4]" },
        { input: "[-1,-100,3,99]\n2", expectedOutput: "[3,99,-1,-100]" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 30], [-100, 100]);
        const k = ri(rng, 0, 100);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: fmtIntArr(ref(nums, k)) };
      },
      editorial: explain({
        idea: "Rotating right by `k` moves the element at index `i` to `(i + k) % n`. The elegant in-place recipe is **three reversals**: reverse the whole array, then reverse the first `k` elements, then reverse the rest. That lands every element in the right place with no extra array.",
        steps: [
          "Reduce `k` modulo `n` — rotating by `n` is a no-op, and `k` may exceed the length.",
          "Reverse the entire array.",
          "Reverse the first `k` elements.",
          "Reverse the remaining `n - k` elements.",
        ],
        why: "Reversing the whole array brings the last `k` elements to the front but in the wrong order, and leaves the first `n - k` at the back, also reversed. Reversing each of those two blocks restores their internal order, which is exactly the rotation. Since each reversal is its own inverse on its block, the composition is a pure cyclic shift — and it touches each element a constant number of times.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Take `k % n` first, or the block boundaries fall outside the array.",
          "`k` may be `0` after the modulo, in which case the three reversals correctly cancel out.",
          "The direction matters: this rotates **right**; rotating left needs `n - k`.",
          "Reverse the whole array first — reversing the halves first gives a different (wrong) permutation.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef rotate(nums: List[int], k: int) -> List[int]:\n    n = len(nums)\n    s = k % n\n    return nums[n - s:] + nums[:n - s]`,
        javascript: `var rotate = function(nums, k) {\n    const n = nums.length;\n    const s = k % n;\n    return nums.slice(n - s).concat(nums.slice(0, n - s));\n};`,
              typescript: `function rotate(nums: number[], k: number): number[] {\n    const n = nums.length;\n    const shift = k % n;\n    function reverse(lo: number, hi: number): void {\n        while (lo < hi) {\n            const t = nums[lo];\n            nums[lo] = nums[hi];\n            nums[hi] = t;\n            lo++;\n            hi--;\n        }\n    }\n    reverse(0, n - 1);\n    reverse(0, shift - 1);\n    reverse(shift, n - 1);\n    return nums;\n}`,
              java: `public static int[] rotate(int[] nums, int k) {\n    int n = nums.length;\n    int shift = k % n;\n    reverseRange(nums, 0, n - 1);\n    reverseRange(nums, 0, shift - 1);\n    reverseRange(nums, shift, n - 1);\n    return nums;\n}\n\nprivate static void reverseRange(int[] nums, int lo, int hi) {\n    while (lo < hi) {\n        int t = nums[lo];\n        nums[lo] = nums[hi];\n        nums[hi] = t;\n        lo++;\n        hi--;\n    }\n}`,
              cpp: `void reverseRange(vector<int>& nums, int lo, int hi) {\n    while (lo < hi) {\n        int t = nums[lo];\n        nums[lo] = nums[hi];\n        nums[hi] = t;\n        lo++;\n        hi--;\n    }\n}\n\nvector<int> rotate(vector<int>& nums, int k) {\n    int n = (int) nums.size();\n    int shift = k % n;\n    reverseRange(nums, 0, n - 1);\n    reverseRange(nums, 0, shift - 1);\n    reverseRange(nums, shift, n - 1);\n    return nums;\n}`,
              c: `static void reverseRange(int* nums, int lo, int hi) {\n    while (lo < hi) {\n        int t = nums[lo];\n        nums[lo] = nums[hi];\n        nums[hi] = t;\n        lo++;\n        hi--;\n    }\n}\n\nint* rotate(int* nums, int numsSize, int k, int* returnSize) {\n    int n = numsSize;\n    int shift = k % n;\n    reverseRange(nums, 0, n - 1);\n    reverseRange(nums, 0, shift - 1);\n    reverseRange(nums, shift, n - 1);\n    *returnSize = n;\n    return nums;\n}`,
              csharp: `public static int[] Rotate(int[] nums, int k)\n{\n    int n = nums.Length;\n    int shift = k % n;\n    ReverseRange(nums, 0, n - 1);\n    ReverseRange(nums, 0, shift - 1);\n    ReverseRange(nums, shift, n - 1);\n    return nums;\n}\n\nprivate static void ReverseRange(int[] nums, int lo, int hi)\n{\n    while (lo < hi)\n    {\n        int t = nums[lo];\n        nums[lo] = nums[hi];\n        nums[hi] = t;\n        lo++;\n        hi--;\n    }\n}`,
              go: `func rotate(nums []int, k int) []int {\n	n := len(nums)\n	shift := k % n\n	reverseRange := func(lo int, hi int) {\n		for lo < hi {\n			nums[lo], nums[hi] = nums[hi], nums[lo]\n			lo++\n			hi--\n		}\n	}\n	reverseRange(0, n-1)\n	reverseRange(0, shift-1)\n	reverseRange(shift, n-1)\n	return nums\n}`,
              kotlin: `fun rotate(nums: IntArray, k: Int): IntArray {\n    val n = nums.size\n    val shift = k % n\n    fun reverseRange(start: Int, end: Int) {\n        var lo = start\n        var hi = end\n        while (lo < hi) {\n            val t = nums[lo]\n            nums[lo] = nums[hi]\n            nums[hi] = t\n            lo++\n            hi--\n        }\n    }\n    reverseRange(0, n - 1)\n    reverseRange(0, shift - 1)\n    reverseRange(shift, n - 1)\n    return nums\n}`,
              swift: `func rotate(_ nums: [Int], _ k: Int) -> [Int] {\n    var a = nums\n    let n = a.count\n    let shift = k % n\n    func reverseRange(_ start: Int, _ end: Int) {\n        var lo = start\n        var hi = end\n        while lo < hi {\n            a.swapAt(lo, hi)\n            lo += 1\n            hi -= 1\n        }\n    }\n    reverseRange(0, n - 1)\n    reverseRange(0, shift - 1)\n    reverseRange(shift, n - 1)\n    return a\n}`,
              rust: `fn rotate(nums: Vec<i32>, k: i32) -> Vec<i32> {\n    fn reverse_range(a: &mut Vec<i32>, start: i32, end: i32) {\n        let mut lo = start;\n        let mut hi = end;\n        while lo < hi {\n            a.swap(lo as usize, hi as usize);\n            lo += 1;\n            hi -= 1;\n        }\n    }\n    let mut a = nums;\n    let n = a.len() as i32;\n    let shift = k % n;\n    reverse_range(&mut a, 0, n - 1);\n    reverse_range(&mut a, 0, shift - 1);\n    reverse_range(&mut a, shift, n - 1);\n    a\n}`,
              php: `function rotate($nums, $k) {\n    $n = count($nums);\n    $shift = $k % $n;\n    rotateReverse($nums, 0, $n - 1);\n    rotateReverse($nums, 0, $shift - 1);\n    rotateReverse($nums, $shift, $n - 1);\n    return $nums;\n}\n\nfunction rotateReverse(&$nums, $lo, $hi) {\n    while ($lo < $hi) {\n        $t = $nums[$lo];\n        $nums[$lo] = $nums[$hi];\n        $nums[$hi] = $t;\n        $lo++;\n        $hi--;\n    }\n}`,
              ruby: `def rotate(nums, k)\n  n = nums.length\n  shift = k % n\n  reverse_range = lambda do |lo, hi|\n    while lo < hi\n      nums[lo], nums[hi] = nums[hi], nums[lo]\n      lo += 1\n      hi -= 1\n    end\n  end\n  reverse_range.call(0, n - 1)\n  reverse_range.call(0, shift - 1)\n  reverse_range.call(shift, n - 1)\n  nums\nend`,
      },
    };
  })(),

  // ── Majority Element ────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const c = new Map<number, number>();
      for (const x of nums) c.set(x, (c.get(x) ?? 0) + 1);
      for (const [v, n] of c) if (n > nums.length / 2) return v;
      return -1;
    };
    return {
      slug: "majority-element",
      title: "Majority Element",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Divide and Conquer"],
      signature: { funcName: "majorityElement", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums` of size `n`, return the **majority element** — the element that appears **more than `n / 2` times**. It always exists in the input.",
        [
          { in: "nums = [3,2,3]", out: "3" },
          { in: "nums = [2,2,1,1,1,2,2]", out: "2" },
        ],
        ["1 <= nums.length <= 31", "-100 <= nums[i] <= 100", "The majority element always exists."],
        "Boyer–Moore voting solves it in O(n) time and O(1) space."),
      hints: [
        "Counting occurrences with a hash map works in one pass.",
        "Boyer–Moore: keep a candidate and a counter; matching elements vote up, others vote down.",
      ],
      examples: [
        { input: "[3,2,3]", expectedOutput: "3" },
        { input: "[2,2,1,1,1,2,2]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 15);
        const major = ri(rng, -100, 100);
        const others = Array.from({ length: n }, () => ri(rng, -100, 100));
        const nums = shuffle(rng, [...Array.from({ length: n + 1 }, () => major), ...others]);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      editorial: explain({
        idea: "The Boyer–Moore voting algorithm. Hold a candidate and a counter. Each element that matches the candidate votes for it; each element that differs votes against. When the counter hits zero the candidate is replaced. Because the majority element occupies more than half the array, it is the only value that can survive.",
        steps: [
          "Start with no candidate and a count of `0`.",
          "For each element: if the count is `0`, adopt it as the candidate.",
          "Increment the count when the element equals the candidate, decrement it otherwise.",
          "The candidate left at the end is the majority element.",
        ],
        why: "Think of it as pairing off each majority occurrence against one non-majority occurrence and cancelling both. Since the majority strictly exceeds `n / 2`, there are not enough other elements to cancel them all, so at least one majority occurrence survives every possible pairing — and the algorithm's counter is exactly a running tally of that cancellation. Because the problem guarantees a majority exists, no verification pass is needed; without that guarantee, a second pass would have to confirm the candidate.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Replace the candidate only when the count reaches zero, not on every mismatch.",
          "The guarantee that a majority exists is what makes a single pass enough; drop it and the result is merely a candidate.",
          "Sorting and taking the middle element also works and is easy to reason about, but costs `O(n log n)`.",
          "\"More than `n / 2`\" is strict — exactly half is not a majority.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef majorityElement(nums: List[int]) -> int:\n    count = 0\n    cand = nums[0]\n    for x in nums:\n        if count == 0:\n            cand = x\n        count += 1 if x == cand else -1\n    return cand`,
        javascript: `var majorityElement = function(nums) {\n    let count = 0, cand = nums[0];\n    for (const x of nums) {\n        if (count === 0) cand = x;\n        count += x === cand ? 1 : -1;\n    }\n    return cand;\n};`,
              typescript: `function majorityElement(nums: number[]): number {\n    let candidate = nums[0];\n    let count = 0;\n    for (let i = 0; i < nums.length; i++) {\n        if (count === 0) candidate = nums[i];\n        if (nums[i] === candidate) count++;\n        else count--;\n    }\n    return candidate;\n}`,
              java: `public static int majorityElement(int[] nums) {\n    int candidate = nums[0], count = 0;\n    for (int x : nums) {\n        if (count == 0) candidate = x;\n        if (x == candidate) count++;\n        else count--;\n    }\n    return candidate;\n}`,
              cpp: `int majorityElement(vector<int>& nums) {\n    int candidate = nums[0], count = 0;\n    for (int x : nums) {\n        if (count == 0) candidate = x;\n        if (x == candidate) count++;\n        else count--;\n    }\n    return candidate;\n}`,
              c: `int majorityElement(int* nums, int numsSize) {\n    int candidate = nums[0], count = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (count == 0) candidate = nums[i];\n        if (nums[i] == candidate) count++;\n        else count--;\n    }\n    return candidate;\n}`,
              csharp: `public static int MajorityElement(int[] nums)\n{\n    int candidate = nums[0], count = 0;\n    foreach (int x in nums)\n    {\n        if (count == 0) candidate = x;\n        if (x == candidate) count++;\n        else count--;\n    }\n    return candidate;\n}`,
              go: `func majorityElement(nums []int) int {\n	candidate := nums[0]\n	count := 0\n	for _, x := range nums {\n		if count == 0 {\n			candidate = x\n		}\n		if x == candidate {\n			count++\n		} else {\n			count--\n		}\n	}\n	return candidate\n}`,
              kotlin: `fun majorityElement(nums: IntArray): Int {\n    var candidate = nums[0]\n    var count = 0\n    for (x in nums) {\n        if (count == 0) candidate = x\n        if (x == candidate) count++ else count--\n    }\n    return candidate\n}`,
              swift: `func majorityElement(_ nums: [Int]) -> Int {\n    var candidate = nums[0]\n    var count = 0\n    for x in nums {\n        if count == 0 { candidate = x }\n        if x == candidate { count += 1 } else { count -= 1 }\n    }\n    return candidate\n}`,
              rust: `fn majorityElement(nums: Vec<i32>) -> i32 {\n    let mut candidate = nums[0];\n    let mut count = 0;\n    for &x in nums.iter() {\n        if count == 0 {\n            candidate = x;\n        }\n        if x == candidate {\n            count += 1;\n        } else {\n            count -= 1;\n        }\n    }\n    candidate\n}`,
              php: `function majorityElement($nums) {\n    $candidate = $nums[0];\n    $count = 0;\n    foreach ($nums as $x) {\n        if ($count === 0) $candidate = $x;\n        if ($x === $candidate) $count++;\n        else $count--;\n    }\n    return $candidate;\n}`,
              ruby: `def majorityElement(nums)\n  candidate = nums[0]\n  count = 0\n  nums.each do |x|\n    candidate = x if count == 0\n    if x == candidate\n      count += 1\n    else\n      count -= 1\n    end\n  end\n  candidate\nend`,
      },
    };
  })(),

  // ── Missing Number ──────────────────────────────────────────────
  (() => {
    return {
      slug: "missing-number",
      title: "Missing Number",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Bit Manipulation"],
      signature: { funcName: "missingNumber", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums` containing `n` **distinct** numbers taken from the range `[0, n]`, return the one number in the range that is **missing**.",
        [
          { in: "nums = [3,0,1]", out: "2", note: "n = 3, so the range is [0,3]; 2 is absent." },
          { in: "nums = [9,6,4,2,3,5,7,0,1]", out: "8" },
        ],
        ["1 <= nums.length <= 30", "All numbers are distinct and within [0, nums.length]"],
        "can you do it with O(1) extra space using arithmetic or XOR?"),
      hints: [
        "The sum 0+1+…+n is n(n+1)/2 — compare it with the actual sum.",
        "XOR of everything in [0,n] with everything in nums leaves exactly the missing number.",
      ],
      examples: [
        { input: "[3,0,1]", expectedOutput: "2" },
        { input: "[9,6,4,2,3,5,7,0,1]", expectedOutput: "8" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const missing = ri(rng, 0, n);
        const nums = shuffle(rng, Array.from({ length: n + 1 }, (_, i) => i).filter((x) => x !== missing));
        return { input: fmtIntArr(nums), expectedOutput: String(missing) };
      },
      editorial: explain({
        idea: "The array holds `n` distinct values drawn from `0 .. n`, so exactly one is absent. The sum of the complete range is known in closed form — `n(n+1)/2` — and subtracting the array's actual sum leaves precisely the missing value.",
        steps: [
          "Let `n` be the array's length; the full range is `0 .. n`.",
          "Compute the expected total `n * (n + 1) / 2`.",
          "Sum the array.",
          "Return the difference.",
        ],
        why: "Every value except one contributes identically to both totals, so the difference cancels them all and isolates the absent one. XOR gives the same result by a similar cancellation — `x ^ x == 0`, so XOR-ing the array together with `0 .. n` leaves only the unpaired value — and has the advantage of never overflowing, which matters when `n` is large enough for the triangular number to exceed the integer range.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "The range is `0 .. n` **inclusive**, which is `n + 1` values for an array of length `n` — using `n - 1` in the formula is the usual slip.",
          "Sorting and scanning works but is `O(n log n)` for no gain.",
          "The triangular number can overflow for large `n`; the XOR variant avoids that entirely.",
          "The missing value may be `0` or `n` itself, so no interior assumption is safe.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef missingNumber(nums: List[int]) -> int:\n    n = len(nums)\n    return n * (n + 1) // 2 - sum(nums)`,
        javascript: `var missingNumber = function(nums) {\n    const n = nums.length;\n    return (n * (n + 1)) / 2 - nums.reduce((a, b) => a + b, 0);\n};`,
              typescript: `function missingNumber(nums: number[]): number {\n    const n = nums.length;\n    let total = n * (n + 1) / 2;\n    for (let i = 0; i < n; i++) total -= nums[i];\n    return total;\n}`,
              java: `public static int missingNumber(int[] nums) {\n    int n = nums.length;\n    int total = n * (n + 1) / 2;\n    for (int x : nums) total -= x;\n    return total;\n}`,
              cpp: `int missingNumber(vector<int>& nums) {\n    int n = (int) nums.size();\n    int total = n * (n + 1) / 2;\n    for (int x : nums) total -= x;\n    return total;\n}`,
              c: `int missingNumber(int* nums, int numsSize) {\n    int n = numsSize;\n    int total = n * (n + 1) / 2;\n    for (int i = 0; i < n; i++) total -= nums[i];\n    return total;\n}`,
              csharp: `public static int MissingNumber(int[] nums)\n{\n    int n = nums.Length;\n    int total = n * (n + 1) / 2;\n    foreach (int x in nums) total -= x;\n    return total;\n}`,
              go: `func missingNumber(nums []int) int {\n	n := len(nums)\n	total := n * (n + 1) / 2\n	for _, x := range nums {\n		total -= x\n	}\n	return total\n}`,
              kotlin: `fun missingNumber(nums: IntArray): Int {\n    val n = nums.size\n    var total = n * (n + 1) / 2\n    for (x in nums) total -= x\n    return total\n}`,
              swift: `func missingNumber(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var total = n * (n + 1) / 2\n    for x in nums { total -= x }\n    return total\n}`,
              rust: `fn missingNumber(nums: Vec<i32>) -> i32 {\n    let n = nums.len() as i32;\n    let mut total = n * (n + 1) / 2;\n    for &x in nums.iter() {\n        total -= x;\n    }\n    total\n}`,
              php: `function missingNumber($nums) {\n    $n = count($nums);\n    $total = intdiv($n * ($n + 1), 2);\n    foreach ($nums as $x) $total -= $x;\n    return $total;\n}`,
              ruby: `def missingNumber(nums)\n  n = nums.length\n  total = n * (n + 1) / 2\n  nums.each { |x| total -= x }\n  total\nend`,
      },
    };
  })(),

  // ── Find All Numbers Disappeared in an Array ────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const present = new Set(nums);
      const out: number[] = [];
      for (let i = 1; i <= nums.length; i++) if (!present.has(i)) out.push(i);
      return out;
    };
    return {
      slug: "find-all-numbers-disappeared",
      title: "Find All Numbers Disappeared in an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table"],
      signature: { funcName: "findDisappeared", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an array `nums` of `n` integers where `nums[i]` is in the range `[1, n]`, return all the numbers in `[1, n]` that **do not appear** in `nums`, in **increasing order**.",
        [
          { in: "nums = [4,3,2,7,8,2,3,1]", out: "[5,6]" },
          { in: "nums = [1,1]", out: "[2]" },
        ],
        ["1 <= nums.length <= 30", "1 <= nums[i] <= nums.length"]),
      hints: [
        "Mark which values 1..n you have seen, then collect the unseen ones.",
        "The classic O(1)-space trick negates nums[|x|-1] to mark presence.",
      ],
      examples: [
        { input: "[4,3,2,7,8,2,3,1]", expectedOutput: "[5,6]" },
        { input: "[1,1]", expectedOutput: "[2]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => ri(rng, 1, n));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      editorial: explain({
        idea: "Values are confined to `1 .. n`, which makes them usable as **indices**. Mark each value you see, then report the positions never marked — scanning upwards gives the increasing order the problem asks for.",
        steps: [
          "Create a `seen` array of size `n + 1`, all false.",
          "For each value `x` in the input, set `seen[x] = true`.",
          "Scan `v` from `1` to `n`.",
          "Collect every `v` whose flag is still false.",
        ],
        why: "Because the values and the index range coincide, membership becomes a constant-time array lookup rather than a search — which is what turns the naive `O(n^2)` scan into a linear one. Reporting in index order gives sorted output for free. The classic `O(1)`-space refinement encodes the same marks inside the input itself by negating `nums[abs(x) - 1]`, then reads off the positions that stayed positive.",
        time: "O(n)",
        space: "O(n), or O(1) using in-place sign marking",
        pitfalls: [
          "Values are 1-based while array indices are 0-based; size the `seen` array `n + 1` or subtract one consistently.",
          "Duplicates are expected — marking the same slot twice must be harmless.",
          "Report the **values** `1 .. n`, not the indices.",
          "With the in-place negation trick, always take the absolute value before indexing, since earlier marks may have flipped the sign.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef findDisappeared(nums: List[int]) -> List[int]:\n    present = set(nums)\n    return [i for i in range(1, len(nums) + 1) if i not in present]`,
        javascript: `var findDisappeared = function(nums) {\n    const present = new Set(nums);\n    const out = [];\n    for (let i = 1; i <= nums.length; i++) {\n        if (!present.has(i)) out.push(i);\n    }\n    return out;\n};`,
              typescript: `function findDisappeared(nums: number[]): number[] {\n    const n = nums.length;\n    const seen: boolean[] = [];\n    for (let i = 0; i <= n; i++) seen.push(false);\n    for (let i = 0; i < n; i++) seen[nums[i]] = true;\n    const out: number[] = [];\n    for (let v = 1; v <= n; v++) {\n        if (!seen[v]) out.push(v);\n    }\n    return out;\n}`,
              java: `public static int[] findDisappeared(int[] nums) {\n    int n = nums.length;\n    boolean[] seen = new boolean[n + 1];\n    for (int x : nums) seen[x] = true;\n    List<Integer> out = new ArrayList<>();\n    for (int v = 1; v <= n; v++) {\n        if (!seen[v]) out.add(v);\n    }\n    int[] res = new int[out.size()];\n    for (int i = 0; i < out.size(); i++) res[i] = out.get(i);\n    return res;\n}`,
              cpp: `vector<int> findDisappeared(vector<int>& nums) {\n    int n = (int) nums.size();\n    vector<bool> seen(n + 1, false);\n    for (int x : nums) seen[x] = true;\n    vector<int> out;\n    for (int v = 1; v <= n; v++) {\n        if (!seen[v]) out.push_back(v);\n    }\n    return out;\n}`,
              c: `int* findDisappeared(int* nums, int numsSize, int* returnSize) {\n    int n = numsSize;\n    int* seen = (int*) calloc(n + 1, sizeof(int));\n    for (int i = 0; i < n; i++) seen[nums[i]] = 1;\n    int* out = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int count = 0;\n    for (int v = 1; v <= n; v++) {\n        if (!seen[v]) out[count++] = v;\n    }\n    free(seen);\n    *returnSize = count;\n    return out;\n}`,
              csharp: `public static int[] FindDisappeared(int[] nums)\n{\n    int n = nums.Length;\n    bool[] seen = new bool[n + 1];\n    foreach (int x in nums) seen[x] = true;\n    var res = new List<int>();\n    for (int v = 1; v <= n; v++)\n    {\n        if (!seen[v]) res.Add(v);\n    }\n    return res.ToArray();\n}`,
              go: `func findDisappeared(nums []int) []int {\n	n := len(nums)\n	seen := make([]bool, n+1)\n	for _, x := range nums {\n		seen[x] = true\n	}\n	out := []int{}\n	for v := 1; v <= n; v++ {\n		if !seen[v] {\n			out = append(out, v)\n		}\n	}\n	return out\n}`,
              kotlin: `fun findDisappeared(nums: IntArray): IntArray {\n    val n = nums.size\n    val seen = BooleanArray(n + 1)\n    for (x in nums) seen[x] = true\n    val out = mutableListOf<Int>()\n    for (v in 1..n) {\n        if (!seen[v]) out.add(v)\n    }\n    return out.toIntArray()\n}`,
              swift: `func findDisappeared(_ nums: [Int]) -> [Int] {\n    let n = nums.count\n    var seen = [Bool](repeating: false, count: n + 1)\n    for x in nums { seen[x] = true }\n    var out: [Int] = []\n    for v in 1...max(n, 1) {\n        if v > n { break }\n        if !seen[v] { out.append(v) }\n    }\n    return out\n}`,
              rust: `fn findDisappeared(nums: Vec<i32>) -> Vec<i32> {\n    let n = nums.len();\n    let mut seen = vec![false; n + 1];\n    for &x in nums.iter() {\n        seen[x as usize] = true;\n    }\n    let mut out: Vec<i32> = Vec::new();\n    for v in 1..=n {\n        if !seen[v] {\n            out.push(v as i32);\n        }\n    }\n    out\n}`,
              php: `function findDisappeared($nums) {\n    $n = count($nums);\n    $seen = array_fill(0, $n + 1, false);\n    foreach ($nums as $x) $seen[$x] = true;\n    $out = array();\n    for ($v = 1; $v <= $n; $v++) {\n        if (!$seen[$v]) $out[] = $v;\n    }\n    return $out;\n}`,
              ruby: `def findDisappeared(nums)\n  n = nums.length\n  seen = Array.new(n + 1, false)\n  nums.each { |x| seen[x] = true }\n  (1..n).select { |v| !seen[v] }\nend`,
      },
    };
  })(),

  // ── Single Number ───────────────────────────────────────────────
  (() => {
    return {
      slug: "single-number",
      title: "Single Number",
      difficulty: "EASY" as const,
      tags: ["Array", "Bit Manipulation"],
      signature: { funcName: "singleNumber", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given a non-empty array `nums` where **every element appears twice except for one**, find that single one.\n\nYour solution should run in linear time and use only constant extra space.",
        [
          { in: "nums = [2,2,1]", out: "1" },
          { in: "nums = [4,1,2,1,2]", out: "4" },
        ],
        ["1 <= nums.length <= 29 (odd)", "-100 <= nums[i] <= 100", "Every element appears twice except one."]),
      hints: [
        "x XOR x = 0, and XOR is order-independent.",
        "XOR the whole array together — the pairs cancel and the single survives.",
      ],
      examples: [
        { input: "[2,2,1]", expectedOutput: "1" },
        { input: "[4,1,2,1,2]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const pairCount = ri(rng, 0, 14);
        const pool = shuffle(rng, Array.from({ length: 201 }, (_, i) => i - 100));
        const pairs = pool.slice(0, pairCount);
        const single = pool[pairCount];
        const nums = shuffle(rng, [...pairs, ...pairs, single]);
        return { input: fmtIntArr(nums), expectedOutput: String(single) };
      },
      editorial: explain({
        idea: "XOR is its own inverse: `x ^ x == 0`, and `x ^ 0 == x`. XOR the entire array together and every value that appears twice cancels itself out, leaving exactly the one that does not.",
        steps: [
          "Start with an accumulator of `0`.",
          "XOR every element into it.",
          "Return the accumulator.",
        ],
        why: "XOR is associative and commutative, so the array can be reordered freely without changing the result — which means the pairs can be imagined side by side, each collapsing to `0`. What survives is the unpaired value XOR-ed with a pile of zeros, which is the value itself. That is why no bookkeeping is needed: the cancellation is done by the operator, giving linear time and constant space where a hash set would cost `O(n)` memory.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Seed the accumulator at `0`, the identity for XOR — seeding with `nums[0]` also works but only if the loop then starts at index 1.",
          "This works only because every other value appears **exactly** twice; three occurrences would break the cancellation.",
          "Negative values are fine — XOR operates on the bit patterns.",
          "A hash set gives the right answer but violates the constant-space requirement.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef singleNumber(nums: List[int]) -> int:\n    acc = 0\n    for x in nums:\n        acc ^= x\n    return acc`,
        javascript: `var singleNumber = function(nums) {\n    let acc = 0;\n    for (const x of nums) acc ^= x;\n    return acc;\n};`,
              typescript: `function singleNumber(nums: number[]): number {\n    let acc = 0;\n    for (let i = 0; i < nums.length; i++) acc ^= nums[i];\n    return acc;\n}`,
              java: `public static int singleNumber(int[] nums) {\n    int acc = 0;\n    for (int x : nums) acc ^= x;\n    return acc;\n}`,
              cpp: `int singleNumber(vector<int>& nums) {\n    int acc = 0;\n    for (int x : nums) acc ^= x;\n    return acc;\n}`,
              c: `int singleNumber(int* nums, int numsSize) {\n    int acc = 0;\n    for (int i = 0; i < numsSize; i++) acc ^= nums[i];\n    return acc;\n}`,
              csharp: `public static int SingleNumber(int[] nums)\n{\n    int acc = 0;\n    foreach (int x in nums) acc ^= x;\n    return acc;\n}`,
              go: `func singleNumber(nums []int) int {\n	acc := 0\n	for _, x := range nums {\n		acc ^= x\n	}\n	return acc\n}`,
              kotlin: `fun singleNumber(nums: IntArray): Int {\n    var acc = 0\n    for (x in nums) acc = acc xor x\n    return acc\n}`,
              swift: `func singleNumber(_ nums: [Int]) -> Int {\n    var acc = 0\n    for x in nums { acc ^= x }\n    return acc\n}`,
              rust: `fn singleNumber(nums: Vec<i32>) -> i32 {\n    let mut acc = 0;\n    for &x in nums.iter() {\n        acc ^= x;\n    }\n    acc\n}`,
              php: `function singleNumber($nums) {\n    $acc = 0;\n    foreach ($nums as $x) $acc ^= $x;\n    return $acc;\n}`,
              ruby: `def singleNumber(nums)\n  acc = 0\n  nums.each { |x| acc ^= x }\n  acc\nend`,
      },
    };
  })(),

  // ── Maximum Product Subarray ────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = nums[0], hi = nums[0], lo = nums[0];
      for (let i = 1; i < nums.length; i++) {
        const x = nums[i];
        const a = x, b = hi * x, c = lo * x;
        hi = Math.max(a, b, c);
        lo = Math.min(a, b, c);
        best = Math.max(best, hi);
      }
      return best;
    };
    return {
      slug: "maximum-product-subarray",
      title: "Maximum Product Subarray",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming"],
      signature: { funcName: "maxProduct", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, find a **contiguous non-empty subarray** with the largest product and return that product.",
        [
          { in: "nums = [2,3,-2,4]", out: "6", note: "[2,3] has the largest product, 6." },
          { in: "nums = [-2,0,-1]", out: "0", note: "The answer cannot be 2 because [-2,-1] is not contiguous." },
        ],
        ["1 <= nums.length <= 12", "-5 <= nums[i] <= 5"]),
      hints: [
        "A negative number flips the sign — the smallest product so far can become the largest.",
        "Track both the maximum AND minimum product ending at each position.",
      ],
      examples: [
        { input: "[2,3,-2,4]", expectedOutput: "6" },
        { input: "[-2,0,-1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 12], [-5, 5]);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      editorial: explain({
        idea: "Kadane's trick does not transfer directly, because multiplying by a negative number turns the **smallest** running product into the largest. So carry two values at each position — the maximum and the minimum product ending there — and let a negative element swap their roles.",
        steps: [
          "Seed both the running maximum and running minimum with the first element, along with the best answer.",
          "For each later element `x`, form three candidates: `x` alone, `x * runningMax`, and `x * runningMin`.",
          "The new running maximum is the largest of the three; the new running minimum is the smallest.",
          "Compute both from the **old** values before overwriting either.",
          "Update the global best with the new running maximum.",
        ],
        why: "The largest product ending at a position comes either from starting fresh or from extending the previous subarray — and if `x` is negative, extending the most negative previous product is what produces the largest new one. Tracking the minimum alongside the maximum is exactly what keeps that possibility available. A zero resets both, which is correct: no subarray spanning it can beat starting over.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Compute the new max and min from the old pair — overwriting the max first and then using it for the min is the classic bug.",
          "Include `x` on its own among the candidates, which is what performs the restart after a zero.",
          "Seed from `nums[0]`, not `1` or `0`; the subarray must be non-empty.",
          "Two negatives multiply to a positive, so a long stretch of negatives can be the answer.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef maxProduct(nums: List[int]) -> int:\n    best = hi = lo = nums[0]\n    for x in nums[1:]:\n        cands = (x, hi * x, lo * x)\n        hi = max(cands)\n        lo = min(cands)\n        best = max(best, hi)\n    return best`,
        javascript: `var maxProduct = function(nums) {\n    let best = nums[0], hi = nums[0], lo = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        const x = nums[i];\n        const a = x, b = hi * x, c = lo * x;\n        hi = Math.max(a, b, c);\n        lo = Math.min(a, b, c);\n        best = Math.max(best, hi);\n    }\n    return best;\n};`,
              typescript: `function maxProduct(nums: number[]): number {\n    let curMax = nums[0];\n    let curMin = nums[0];\n    let best = nums[0];\n    for (let i = 1; i < nums.length; i++) {\n        const x = nums[i];\n        const a = x;\n        const b = x * curMax;\n        const c = x * curMin;\n        curMax = Math.max(a, Math.max(b, c));\n        curMin = Math.min(a, Math.min(b, c));\n        if (curMax > best) best = curMax;\n    }\n    return best;\n}`,
              java: `public static int maxProduct(int[] nums) {\n    int curMax = nums[0], curMin = nums[0], best = nums[0];\n    for (int i = 1; i < nums.length; i++) {\n        int x = nums[i];\n        int a = x, b = x * curMax, c = x * curMin;\n        curMax = Math.max(a, Math.max(b, c));\n        curMin = Math.min(a, Math.min(b, c));\n        if (curMax > best) best = curMax;\n    }\n    return best;\n}`,
              cpp: `int maxProduct(vector<int>& nums) {\n    int curMax = nums[0], curMin = nums[0], best = nums[0];\n    for (int i = 1; i < (int) nums.size(); i++) {\n        int x = nums[i];\n        int a = x, b = x * curMax, c = x * curMin;\n        curMax = max(a, max(b, c));\n        curMin = min(a, min(b, c));\n        if (curMax > best) best = curMax;\n    }\n    return best;\n}`,
              c: `int maxProduct(int* nums, int numsSize) {\n    int curMax = nums[0], curMin = nums[0], best = nums[0];\n    for (int i = 1; i < numsSize; i++) {\n        int x = nums[i];\n        int a = x, b = x * curMax, c = x * curMin;\n        int hi = a > b ? a : b;\n        if (c > hi) hi = c;\n        int lo = a < b ? a : b;\n        if (c < lo) lo = c;\n        curMax = hi;\n        curMin = lo;\n        if (curMax > best) best = curMax;\n    }\n    return best;\n}`,
              csharp: `public static int MaxProduct(int[] nums)\n{\n    int curMax = nums[0], curMin = nums[0], best = nums[0];\n    for (int i = 1; i < nums.Length; i++)\n    {\n        int x = nums[i];\n        int a = x, b = x * curMax, c = x * curMin;\n        curMax = Math.Max(a, Math.Max(b, c));\n        curMin = Math.Min(a, Math.Min(b, c));\n        if (curMax > best) best = curMax;\n    }\n    return best;\n}`,
              go: `func maxProduct(nums []int) int {\n	curMax, curMin, best := nums[0], nums[0], nums[0]\n	for i := 1; i < len(nums); i++ {\n		x := nums[i]\n		a, b, c := x, x*curMax, x*curMin\n		hi := a\n		if b > hi {\n			hi = b\n		}\n		if c > hi {\n			hi = c\n		}\n		lo := a\n		if b < lo {\n			lo = b\n		}\n		if c < lo {\n			lo = c\n		}\n		curMax = hi\n		curMin = lo\n		if curMax > best {\n			best = curMax\n		}\n	}\n	return best\n}`,
              kotlin: `fun maxProduct(nums: IntArray): Int {\n    var curMax = nums[0]\n    var curMin = nums[0]\n    var best = nums[0]\n    for (i in 1 until nums.size) {\n        val x = nums[i]\n        val a = x\n        val b = x * curMax\n        val c = x * curMin\n        curMax = maxOf(a, b, c)\n        curMin = minOf(a, b, c)\n        if (curMax > best) best = curMax\n    }\n    return best\n}`,
              swift: `func maxProduct(_ nums: [Int]) -> Int {\n    var curMax = nums[0]\n    var curMin = nums[0]\n    var best = nums[0]\n    var i = 1\n    while i < nums.count {\n        let x = nums[i]\n        let a = x\n        let b = x * curMax\n        let c = x * curMin\n        curMax = max(a, max(b, c))\n        curMin = min(a, min(b, c))\n        if curMax > best { best = curMax }\n        i += 1\n    }\n    return best\n}`,
              rust: `fn maxProduct(nums: Vec<i32>) -> i32 {\n    let mut cur_max = nums[0];\n    let mut cur_min = nums[0];\n    let mut best = nums[0];\n    for i in 1..nums.len() {\n        let x = nums[i];\n        let a = x;\n        let b = x * cur_max;\n        let c = x * cur_min;\n        let mut hi = a;\n        if b > hi { hi = b; }\n        if c > hi { hi = c; }\n        let mut lo = a;\n        if b < lo { lo = b; }\n        if c < lo { lo = c; }\n        cur_max = hi;\n        cur_min = lo;\n        if cur_max > best {\n            best = cur_max;\n        }\n    }\n    best\n}`,
              php: `function maxProduct($nums) {\n    $curMax = $nums[0];\n    $curMin = $nums[0];\n    $best = $nums[0];\n    $n = count($nums);\n    for ($i = 1; $i < $n; $i++) {\n        $x = $nums[$i];\n        $a = $x;\n        $b = $x * $curMax;\n        $c = $x * $curMin;\n        $curMax = max($a, $b, $c);\n        $curMin = min($a, $b, $c);\n        if ($curMax > $best) $best = $curMax;\n    }\n    return $best;\n}`,
              ruby: `def maxProduct(nums)\n  cur_max = nums[0]\n  cur_min = nums[0]\n  best = nums[0]\n  (1...nums.length).each do |i|\n    x = nums[i]\n    cands = [x, x * cur_max, x * cur_min]\n    cur_max = cands.max\n    cur_min = cands.min\n    best = cur_max if cur_max > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Subarray Sum Equals K ───────────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const seen = new Map<number, number>([[0, 1]]);
      let sum = 0, count = 0;
      for (const x of nums) {
        sum += x;
        count += seen.get(sum - k) ?? 0;
        seen.set(sum, (seen.get(sum) ?? 0) + 1);
      }
      return count;
    };
    return {
      slug: "subarray-sum-equals-k",
      title: "Subarray Sum Equals K",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Prefix Sum"],
      signature: { funcName: "subarraySum", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` and an integer `k`, return the **number of contiguous subarrays whose sum equals `k`**.",
        [
          { in: "nums = [1,1,1], k = 2", out: "2" },
          { in: "nums = [1,2,3], k = 3", out: "2" },
        ],
        ["1 <= nums.length <= 30", "-50 <= nums[i] <= 50", "-100 <= k <= 100"]),
      hints: [
        "A subarray sum is a difference of two prefix sums.",
        "Count how many earlier prefixes equal currentPrefix - k using a hash map.",
      ],
      examples: [
        { input: "[1,1,1]\n2", expectedOutput: "2" },
        { input: "[1,2,3]\n3", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 30], [-50, 50]);
        const k = ri(rng, -100, 100);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      editorial: explain({
        idea: "A subarray's sum is a difference of two prefix sums: the block `(i, j]` sums to `prefix[j] - prefix[i]`. So a subarray ending at `j` hits `k` exactly when some earlier prefix equals `prefix[j] - k`. Keep a running tally of how often each prefix value has occurred and the count falls out in one pass.",
        steps: [
          "Track a running `prefix` sum and a table counting how many times each prefix value has been seen.",
          "Seed the table with one occurrence of prefix `0` — that represents the empty prefix, so subarrays starting at index 0 are counted.",
          "For each element, add it to `prefix`.",
          "Add to the answer the number of times `prefix - k` has already been recorded.",
          "Then record the current `prefix` and continue.",
        ],
        why: "Each earlier prefix equal to `prefix[j] - k` marks a distinct starting point for a subarray ending at `j` that sums to `k`, so counting them counts exactly the qualifying subarrays with that endpoint. Summing over all endpoints covers every subarray once. Recording the current prefix **after** the lookup is what prevents a zero-length subarray from being counted when `k` is `0`.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Seeding prefix `0` with a count of one is essential — without it, subarrays that begin at index 0 are missed.",
          "Look up before recording the current prefix, or `k = 0` counts empty subarrays.",
          "Values may be negative, so sliding-window shrinking does not apply here; prefix counting is the reason this works anyway.",
          "Prefix sums go negative, so offset the index if using an array instead of a hash map.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef subarraySum(nums: List[int], k: int) -> int:\n    seen = {0: 1}\n    total = 0\n    count = 0\n    for x in nums:\n        total += x\n        count += seen.get(total - k, 0)\n        seen[total] = seen.get(total, 0) + 1\n    return count`,
        javascript: `var subarraySum = function(nums, k) {\n    const seen = new Map([[0, 1]]);\n    let sum = 0, count = 0;\n    for (const x of nums) {\n        sum += x;\n        count += seen.get(sum - k) || 0;\n        seen.set(sum, (seen.get(sum) || 0) + 1);\n    }\n    return count;\n};`,
              typescript: `function subarraySum(nums: number[], k: number): number {\n    const OFFSET = 1600;\n    const SIZE = 3201;\n    const seen: number[] = [];\n    for (let i = 0; i < SIZE; i++) seen.push(0);\n    seen[OFFSET] = 1;\n    let prefix = 0;\n    let count = 0;\n    for (let i = 0; i < nums.length; i++) {\n        prefix += nums[i];\n        const want = prefix - k + OFFSET;\n        if (want >= 0 && want < SIZE) count += seen[want];\n        seen[prefix + OFFSET]++;\n    }\n    return count;\n}`,
              java: `public static int subarraySum(int[] nums, int k) {\n    final int OFFSET = 1600, SIZE = 3201;\n    int[] seen = new int[SIZE];\n    seen[OFFSET] = 1;\n    int prefix = 0, count = 0;\n    for (int x : nums) {\n        prefix += x;\n        int want = prefix - k + OFFSET;\n        if (want >= 0 && want < SIZE) count += seen[want];\n        seen[prefix + OFFSET]++;\n    }\n    return count;\n}`,
              cpp: `int subarraySum(vector<int>& nums, int k) {\n    const int OFFSET = 1600, SIZE = 3201;\n    vector<int> seen(SIZE, 0);\n    seen[OFFSET] = 1;\n    int prefix = 0, count = 0;\n    for (int x : nums) {\n        prefix += x;\n        int want = prefix - k + OFFSET;\n        if (want >= 0 && want < SIZE) count += seen[want];\n        seen[prefix + OFFSET]++;\n    }\n    return count;\n}`,
              c: `int subarraySum(int* nums, int numsSize, int k) {\n    const int OFFSET = 1600;\n    const int SIZE = 3201;\n    int* seen = (int*) calloc(SIZE, sizeof(int));\n    seen[OFFSET] = 1;\n    int prefix = 0, count = 0;\n    for (int i = 0; i < numsSize; i++) {\n        prefix += nums[i];\n        int want = prefix - k + OFFSET;\n        if (want >= 0 && want < SIZE) count += seen[want];\n        seen[prefix + OFFSET]++;\n    }\n    free(seen);\n    return count;\n}`,
              csharp: `public static int SubarraySum(int[] nums, int k)\n{\n    const int OFFSET = 1600;\n    const int SIZE = 3201;\n    int[] seen = new int[SIZE];\n    seen[OFFSET] = 1;\n    int prefix = 0, count = 0;\n    foreach (int x in nums)\n    {\n        prefix += x;\n        int want = prefix - k + OFFSET;\n        if (want >= 0 && want < SIZE) count += seen[want];\n        seen[prefix + OFFSET]++;\n    }\n    return count;\n}`,
              go: `func subarraySum(nums []int, k int) int {\n	const OFFSET = 1600\n	const SIZE = 3201\n	seen := make([]int, SIZE)\n	seen[OFFSET] = 1\n	prefix, count := 0, 0\n	for _, x := range nums {\n		prefix += x\n		want := prefix - k + OFFSET\n		if want >= 0 && want < SIZE {\n			count += seen[want]\n		}\n		seen[prefix+OFFSET]++\n	}\n	return count\n}`,
              kotlin: `fun subarraySum(nums: IntArray, k: Int): Int {\n    val offset = 1600\n    val size = 3201\n    val seen = IntArray(size)\n    seen[offset] = 1\n    var prefix = 0\n    var count = 0\n    for (x in nums) {\n        prefix += x\n        val want = prefix - k + offset\n        if (want in 0 until size) count += seen[want]\n        seen[prefix + offset]++\n    }\n    return count\n}`,
              swift: `func subarraySum(_ nums: [Int], _ k: Int) -> Int {\n    let offset = 1600\n    let size = 3201\n    var seen = [Int](repeating: 0, count: size)\n    seen[offset] = 1\n    var prefix = 0\n    var count = 0\n    for x in nums {\n        prefix += x\n        let want = prefix - k + offset\n        if want >= 0 && want < size { count += seen[want] }\n        seen[prefix + offset] += 1\n    }\n    return count\n}`,
              rust: `fn subarraySum(nums: Vec<i32>, k: i32) -> i32 {\n    let offset: i32 = 1600;\n    let size: i32 = 3201;\n    let mut seen = vec![0i32; size as usize];\n    seen[offset as usize] = 1;\n    let mut prefix = 0;\n    let mut count = 0;\n    for &x in nums.iter() {\n        prefix += x;\n        let want = prefix - k + offset;\n        if want >= 0 && want < size {\n            count += seen[want as usize];\n        }\n        seen[(prefix + offset) as usize] += 1;\n    }\n    count\n}`,
              php: `function subarraySum($nums, $k) {\n    $OFFSET = 1600;\n    $SIZE = 3201;\n    $seen = array_fill(0, $SIZE, 0);\n    $seen[$OFFSET] = 1;\n    $prefix = 0;\n    $count = 0;\n    foreach ($nums as $x) {\n        $prefix += $x;\n        $want = $prefix - $k + $OFFSET;\n        if ($want >= 0 && $want < $SIZE) $count += $seen[$want];\n        $seen[$prefix + $OFFSET]++;\n    }\n    return $count;\n}`,
              ruby: `def subarraySum(nums, k)\n  offset = 1600\n  size = 3201\n  seen = Array.new(size, 0)\n  seen[offset] = 1\n  prefix = 0\n  count = 0\n  nums.each do |x|\n    prefix += x\n    want = prefix - k + offset\n    count += seen[want] if want >= 0 && want < size\n    seen[prefix + offset] += 1\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Longest Consecutive Sequence ────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const s = new Set(nums);
      let best = 0;
      for (const x of s) {
        if (!s.has(x - 1)) {
          let len = 1;
          while (s.has(x + len)) len++;
          best = Math.max(best, len);
        }
      }
      return best;
    };
    return {
      slug: "longest-consecutive-sequence",
      title: "Longest Consecutive Sequence",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Union Find"],
      signature: { funcName: "longestConsecutive", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an unsorted array `nums`, return the length of the **longest run of consecutive integers** (the elements can appear anywhere in the array).\n\nYour algorithm should run in `O(n)` time.",
        [
          { in: "nums = [100,4,200,1,3,2]", out: "4", note: "The longest run is [1,2,3,4]." },
          { in: "nums = [0,3,7,2,5,8,4,6,0,1]", out: "9" },
        ],
        ["0 <= nums.length <= 30", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "Put everything in a set for O(1) membership checks.",
        "Only start counting from numbers that begin a run (x-1 is absent).",
      ],
      examples: [
        { input: "[100,4,200,1,3,2]", expectedOutput: "4" },
        { input: "[0,3,7,2,5,8,4,6,0,1]", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [0, 30], [-40, 40]);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      editorial: explain({
        idea: "Sorting would cost `O(n log n)`. Instead put every value into a set and only start counting from a value that **begins** a run — one whose predecessor is absent. From each such start, walk upward while the next value exists.",
        steps: [
          "Record membership of every value (a hash set, or a direct-address table when the value range is small).",
          "For each distinct value `v`, check whether `v - 1` is present.",
          "If it is, `v` is in the middle of a run — skip it.",
          "Otherwise `v` starts a run: count `v, v+1, v+2, …` while each is present.",
          "Keep the longest length seen.",
        ],
        why: "Restricting the walk to run starts is what keeps this linear. Each run is traversed exactly once — from its unique smallest element — so the total work across all runs is bounded by the number of distinct values, even though the code contains a nested loop. Without that check, a long run would be re-walked from every one of its members, degrading to quadratic.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The `v - 1` check is not an optimisation but the reason the complexity holds; dropping it makes the algorithm quadratic.",
          "An empty array must return `0`.",
          "Duplicates must not inflate the count — membership, not multiplicity, is what matters.",
          "Values can be negative, so a direct-address table needs an offset.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef longestConsecutive(nums: List[int]) -> int:\n    s = set(nums)\n    best = 0\n    for x in s:\n        if x - 1 not in s:\n            length = 1\n            while x + length in s:\n                length += 1\n            best = max(best, length)\n    return best`,
        javascript: `var longestConsecutive = function(nums) {\n    const s = new Set(nums);\n    let best = 0;\n    for (const x of s) {\n        if (!s.has(x - 1)) {\n            let len = 1;\n            while (s.has(x + len)) len++;\n            best = Math.max(best, len);\n        }\n    }\n    return best;\n};`,
              typescript: `function longestConsecutive(nums: number[]): number {\n    if (nums.length === 0) return 0;\n    const OFFSET = 1000;\n    const SIZE = 2001;\n    const present: boolean[] = [];\n    for (let i = 0; i < SIZE; i++) present.push(false);\n    for (let i = 0; i < nums.length; i++) present[nums[i] + OFFSET] = true;\n    let best = 0;\n    for (let v = 0; v < SIZE; v++) {\n        if (!present[v]) continue;\n        if (v > 0 && present[v - 1]) continue;\n        let len = 1;\n        while (v + len < SIZE && present[v + len]) len++;\n        if (len > best) best = len;\n    }\n    return best;\n}`,
              java: `public static int longestConsecutive(int[] nums) {\n    if (nums.length == 0) return 0;\n    final int OFFSET = 1000, SIZE = 2001;\n    boolean[] present = new boolean[SIZE];\n    for (int x : nums) present[x + OFFSET] = true;\n    int best = 0;\n    for (int v = 0; v < SIZE; v++) {\n        if (!present[v]) continue;\n        if (v > 0 && present[v - 1]) continue;\n        int len = 1;\n        while (v + len < SIZE && present[v + len]) len++;\n        if (len > best) best = len;\n    }\n    return best;\n}`,
              cpp: `int longestConsecutive(vector<int>& nums) {\n    if (nums.empty()) return 0;\n    const int OFFSET = 1000, SIZE = 2001;\n    vector<bool> present(SIZE, false);\n    for (int x : nums) present[x + OFFSET] = true;\n    int best = 0;\n    for (int v = 0; v < SIZE; v++) {\n        if (!present[v]) continue;\n        if (v > 0 && present[v - 1]) continue;\n        int len = 1;\n        while (v + len < SIZE && present[v + len]) len++;\n        if (len > best) best = len;\n    }\n    return best;\n}`,
              c: `int longestConsecutive(int* nums, int numsSize) {\n    if (numsSize == 0) return 0;\n    const int OFFSET = 1000;\n    const int SIZE = 2001;\n    int* present = (int*) calloc(SIZE, sizeof(int));\n    for (int i = 0; i < numsSize; i++) present[nums[i] + OFFSET] = 1;\n    int best = 0;\n    for (int v = 0; v < SIZE; v++) {\n        if (!present[v]) continue;\n        if (v > 0 && present[v - 1]) continue;\n        int len = 1;\n        while (v + len < SIZE && present[v + len]) len++;\n        if (len > best) best = len;\n    }\n    free(present);\n    return best;\n}`,
              csharp: `public static int LongestConsecutive(int[] nums)\n{\n    if (nums.Length == 0) return 0;\n    const int OFFSET = 1000;\n    const int SIZE = 2001;\n    bool[] present = new bool[SIZE];\n    foreach (int x in nums) present[x + OFFSET] = true;\n    int best = 0;\n    for (int v = 0; v < SIZE; v++)\n    {\n        if (!present[v]) continue;\n        if (v > 0 && present[v - 1]) continue;\n        int len = 1;\n        while (v + len < SIZE && present[v + len]) len++;\n        if (len > best) best = len;\n    }\n    return best;\n}`,
              go: `func longestConsecutive(nums []int) int {\n	if len(nums) == 0 {\n		return 0\n	}\n	const OFFSET = 1000\n	const SIZE = 2001\n	present := make([]bool, SIZE)\n	for _, x := range nums {\n		present[x+OFFSET] = true\n	}\n	best := 0\n	for v := 0; v < SIZE; v++ {\n		if !present[v] {\n			continue\n		}\n		if v > 0 && present[v-1] {\n			continue\n		}\n		length := 1\n		for v+length < SIZE && present[v+length] {\n			length++\n		}\n		if length > best {\n			best = length\n		}\n	}\n	return best\n}`,
              kotlin: `fun longestConsecutive(nums: IntArray): Int {\n    if (nums.isEmpty()) return 0\n    val offset = 1000\n    val size = 2001\n    val present = BooleanArray(size)\n    for (x in nums) present[x + offset] = true\n    var best = 0\n    for (v in 0 until size) {\n        if (!present[v]) continue\n        if (v > 0 && present[v - 1]) continue\n        var len = 1\n        while (v + len < size && present[v + len]) len++\n        if (len > best) best = len\n    }\n    return best\n}`,
              swift: `func longestConsecutive(_ nums: [Int]) -> Int {\n    if nums.isEmpty { return 0 }\n    let offset = 1000\n    let size = 2001\n    var present = [Bool](repeating: false, count: size)\n    for x in nums { present[x + offset] = true }\n    var best = 0\n    for v in 0..<size {\n        if !present[v] { continue }\n        if v > 0 && present[v - 1] { continue }\n        var len = 1\n        while v + len < size && present[v + len] { len += 1 }\n        if len > best { best = len }\n    }\n    return best\n}`,
              rust: `fn longestConsecutive(nums: Vec<i32>) -> i32 {\n    if nums.is_empty() {\n        return 0;\n    }\n    let offset: i32 = 1000;\n    let size: usize = 2001;\n    let mut present = vec![false; size];\n    for &x in nums.iter() {\n        present[(x + offset) as usize] = true;\n    }\n    let mut best = 0;\n    for v in 0..size {\n        if !present[v] {\n            continue;\n        }\n        if v > 0 && present[v - 1] {\n            continue;\n        }\n        let mut len = 1usize;\n        while v + len < size && present[v + len] {\n            len += 1;\n        }\n        if len as i32 > best {\n            best = len as i32;\n        }\n    }\n    best\n}`,
              php: `function longestConsecutive($nums) {\n    if (count($nums) === 0) return 0;\n    $OFFSET = 1000;\n    $SIZE = 2001;\n    $present = array_fill(0, $SIZE, false);\n    foreach ($nums as $x) $present[$x + $OFFSET] = true;\n    $best = 0;\n    for ($v = 0; $v < $SIZE; $v++) {\n        if (!$present[$v]) continue;\n        if ($v > 0 && $present[$v - 1]) continue;\n        $len = 1;\n        while ($v + $len < $SIZE && $present[$v + $len]) $len++;\n        if ($len > $best) $best = $len;\n    }\n    return $best;\n}`,
              ruby: `def longestConsecutive(nums)\n  return 0 if nums.empty?\n  offset = 1000\n  size = 2001\n  present = Array.new(size, false)\n  nums.each { |x| present[x + offset] = true }\n  best = 0\n  (0...size).each do |v|\n    next unless present[v]\n    next if v > 0 && present[v - 1]\n    len = 1\n    len += 1 while v + len < size && present[v + len]\n    best = len if len > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Find the Duplicate Number ───────────────────────────────────
  (() => {
    return {
      slug: "find-the-duplicate-number",
      title: "Find the Duplicate Number",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Binary Search"],
      signature: { funcName: "findDuplicate", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums` of `n + 1` integers where each integer is in `[1, n]`, exactly **one value is repeated** (possibly more than twice). Return that repeated number **without modifying the array** and using only constant extra space.",
        [
          { in: "nums = [1,3,4,2,2]", out: "2" },
          { in: "nums = [3,1,3,4,2]", out: "3" },
        ],
        ["2 <= nums.length <= 31", "1 <= nums[i] <= nums.length - 1", "Exactly one value repeats."]),
      hints: [
        "Treat nums[i] as a pointer i → nums[i]; the repeat creates a cycle.",
        "Floyd's tortoise-and-hare cycle detection finds the cycle entry — that's the duplicate.",
      ],
      examples: [
        { input: "[1,3,4,2,2]", expectedOutput: "2" },
        { input: "[3,1,3,4,2]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const dup = ri(rng, 1, n);
        const base = Array.from({ length: n }, (_, i) => i + 1);
        const nums = shuffle(rng, [...base, dup]);
        return { input: fmtIntArr(nums), expectedOutput: String(dup) };
      },
      editorial: explain({
        idea: "Read the array as a **function**: index `i` points to index `nums[i]`. Since there are `n + 1` slots but values only in `1 .. n`, two indices point to the same place — so following the pointers from index `0` must eventually enter a cycle, and the cycle's entrance is the duplicated value. Floyd's tortoise-and-hare finds it without touching the array or allocating anything.",
        steps: [
          "Move a slow pointer one step (`slow = nums[slow]`) and a fast pointer two steps until they meet inside the cycle.",
          "Reset the slow pointer to the start.",
          "Advance both one step at a time.",
          "Where they meet again is the cycle entrance, which is the duplicated value.",
        ],
        why: "The duplicate is the only value with two indices pointing at it, so it is exactly the node where two paths merge — the cycle's entrance. Floyd's second phase works because the distance from the start to the entrance equals the distance from the meeting point to the entrance, once you account for whole loops; walking both at the same speed therefore lands them together precisely there. This respects both constraints the problem imposes: the array is never modified and no extra space is used.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Both pointers must start from the same index, and the first phase must advance before comparing — otherwise they \"meet\" immediately at the start.",
          "Reset only the slow pointer for phase two; resetting both finds nothing.",
          "Sorting or marking the array is simpler but violates the no-modification rule.",
          "The value may repeat more than twice, which does not affect the argument — it still merges paths.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef findDuplicate(nums: List[int]) -> int:\n    slow = nums[0]\n    fast = nums[nums[0]]\n    while slow != fast:\n        slow = nums[slow]\n        fast = nums[nums[fast]]\n    slow = 0\n    while slow != fast:\n        slow = nums[slow]\n        fast = nums[fast]\n    return slow`,
        javascript: `var findDuplicate = function(nums) {\n    let slow = nums[0];\n    let fast = nums[nums[0]];\n    while (slow !== fast) {\n        slow = nums[slow];\n        fast = nums[nums[fast]];\n    }\n    slow = 0;\n    while (slow !== fast) {\n        slow = nums[slow];\n        fast = nums[fast];\n    }\n    return slow;\n};`,
              typescript: `function findDuplicate(nums: number[]): number {\n    let slow = nums[0];\n    let fast = nums[nums[0]];\n    while (slow !== fast) {\n        slow = nums[slow];\n        fast = nums[nums[fast]];\n    }\n    slow = 0;\n    while (slow !== fast) {\n        slow = nums[slow];\n        fast = nums[fast];\n    }\n    return slow;\n}`,
              java: `public static int findDuplicate(int[] nums) {\n    int slow = nums[0], fast = nums[nums[0]];\n    while (slow != fast) {\n        slow = nums[slow];\n        fast = nums[nums[fast]];\n    }\n    slow = 0;\n    while (slow != fast) {\n        slow = nums[slow];\n        fast = nums[fast];\n    }\n    return slow;\n}`,
              cpp: `int findDuplicate(vector<int>& nums) {\n    int slow = nums[0], fast = nums[nums[0]];\n    while (slow != fast) {\n        slow = nums[slow];\n        fast = nums[nums[fast]];\n    }\n    slow = 0;\n    while (slow != fast) {\n        slow = nums[slow];\n        fast = nums[fast];\n    }\n    return slow;\n}`,
              c: `int findDuplicate(int* nums, int numsSize) {\n    int slow = nums[0];\n    int fast = nums[nums[0]];\n    while (slow != fast) {\n        slow = nums[slow];\n        fast = nums[nums[fast]];\n    }\n    slow = 0;\n    while (slow != fast) {\n        slow = nums[slow];\n        fast = nums[fast];\n    }\n    return slow;\n}`,
              csharp: `public static int FindDuplicate(int[] nums)\n{\n    int slow = nums[0], fast = nums[nums[0]];\n    while (slow != fast)\n    {\n        slow = nums[slow];\n        fast = nums[nums[fast]];\n    }\n    slow = 0;\n    while (slow != fast)\n    {\n        slow = nums[slow];\n        fast = nums[fast];\n    }\n    return slow;\n}`,
              go: `func findDuplicate(nums []int) int {\n	slow := nums[0]\n	fast := nums[nums[0]]\n	for slow != fast {\n		slow = nums[slow]\n		fast = nums[nums[fast]]\n	}\n	slow = 0\n	for slow != fast {\n		slow = nums[slow]\n		fast = nums[fast]\n	}\n	return slow\n}`,
              kotlin: `fun findDuplicate(nums: IntArray): Int {\n    var slow = nums[0]\n    var fast = nums[nums[0]]\n    while (slow != fast) {\n        slow = nums[slow]\n        fast = nums[nums[fast]]\n    }\n    slow = 0\n    while (slow != fast) {\n        slow = nums[slow]\n        fast = nums[fast]\n    }\n    return slow\n}`,
              swift: `func findDuplicate(_ nums: [Int]) -> Int {\n    var slow = nums[0]\n    var fast = nums[nums[0]]\n    while slow != fast {\n        slow = nums[slow]\n        fast = nums[nums[fast]]\n    }\n    slow = 0\n    while slow != fast {\n        slow = nums[slow]\n        fast = nums[fast]\n    }\n    return slow\n}`,
              rust: `fn findDuplicate(nums: Vec<i32>) -> i32 {\n    let mut slow = nums[0] as usize;\n    let mut fast = nums[nums[0] as usize] as usize;\n    while slow != fast {\n        slow = nums[slow] as usize;\n        fast = nums[nums[fast] as usize] as usize;\n    }\n    slow = 0;\n    while slow != fast {\n        slow = nums[slow] as usize;\n        fast = nums[fast] as usize;\n    }\n    slow as i32\n}`,
              php: `function findDuplicate($nums) {\n    $slow = $nums[0];\n    $fast = $nums[$nums[0]];\n    while ($slow !== $fast) {\n        $slow = $nums[$slow];\n        $fast = $nums[$nums[$fast]];\n    }\n    $slow = 0;\n    while ($slow !== $fast) {\n        $slow = $nums[$slow];\n        $fast = $nums[$fast];\n    }\n    return $slow;\n}`,
              ruby: `def findDuplicate(nums)\n  slow = nums[0]\n  fast = nums[nums[0]]\n  while slow != fast\n    slow = nums[slow]\n    fast = nums[nums[fast]]\n  end\n  slow = 0\n  while slow != fast\n    slow = nums[slow]\n    fast = nums[fast]\n  end\n  slow\nend`,
      },
    };
  })(),

  // ── Merge Sorted Array ──────────────────────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => [...a, ...b].sort((x, y) => x - y);
    return {
      slug: "merge-sorted-array",
      title: "Merge Sorted Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Sorting"],
      signature: { funcName: "merge", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given two integer arrays `nums1` and `nums2`, both sorted in **non-decreasing order**. Merge them into a single array sorted in non-decreasing order and return it.",
        [
          { in: "nums1 = [1,2,3], nums2 = [2,5,6]", out: "[1,2,2,3,5,6]" },
          { in: "nums1 = [1], nums2 = []", out: "[1]" },
        ],
        ["0 <= nums1.length, nums2.length <= 30", "-100 <= values <= 100", "Both inputs are sorted."]),
      hints: [
        "Walk both arrays with one pointer each, always taking the smaller front element.",
        "When one array runs out, append the rest of the other.",
      ],
      examples: [
        { input: "[1,2,3]\n[2,5,6]", expectedOutput: "[1,2,2,3,5,6]" },
        { input: "[1]\n[]", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const a = genArr(rng, [0, 30], [-100, 100]).sort((x, y) => x - y);
        const b = genArr(rng, [0, 30], [-100, 100]).sort((x, y) => x - y);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      editorial: explain({
        idea: "Both inputs are already sorted, so the smallest unplaced value is always at the front of one of them. Walk the two arrays with a pointer each, repeatedly taking the smaller front element — the classic merge step from merge sort.",
        steps: [
          "Start a pointer at the beginning of each array and an empty output.",
          "While both still have elements, append the smaller front value and advance that pointer.",
          "When one array is exhausted, append everything remaining in the other.",
          "The output is sorted.",
        ],
        why: "The invariant is that everything already emitted is no greater than anything still unread: within each array that holds by sortedness, and across the two it holds because the comparison always takes the smaller front. So the output comes out in non-decreasing order and each element is copied exactly once, giving linear time — better than concatenating and re-sorting at `O(n log n)`.",
        time: "O(n + m)",
        space: "O(n + m) for the output",
        pitfalls: [
          "Drain the remaining array after the main loop; dropping it silently truncates the result.",
          "Either input may be empty, including both.",
          "Taking the left element on ties keeps the merge stable, which costs nothing.",
          "Advance only the pointer whose element you consumed.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef merge(nums1: List[int], nums2: List[int]) -> List[int]:\n    out = []\n    i = j = 0\n    while i < len(nums1) and j < len(nums2):\n        if nums1[i] <= nums2[j]:\n            out.append(nums1[i]); i += 1\n        else:\n            out.append(nums2[j]); j += 1\n    out.extend(nums1[i:])\n    out.extend(nums2[j:])\n    return out`,
        javascript: `var merge = function(nums1, nums2) {\n    const out = [];\n    let i = 0, j = 0;\n    while (i < nums1.length && j < nums2.length) {\n        if (nums1[i] <= nums2[j]) out.push(nums1[i++]);\n        else out.push(nums2[j++]);\n    }\n    while (i < nums1.length) out.push(nums1[i++]);\n    while (j < nums2.length) out.push(nums2[j++]);\n    return out;\n};`,
              typescript: `function merge(nums1: number[], nums2: number[]): number[] {\n    const out: number[] = [];\n    let i = 0;\n    let j = 0;\n    while (i < nums1.length && j < nums2.length) {\n        if (nums1[i] <= nums2[j]) out.push(nums1[i++]);\n        else out.push(nums2[j++]);\n    }\n    while (i < nums1.length) out.push(nums1[i++]);\n    while (j < nums2.length) out.push(nums2[j++]);\n    return out;\n}`,
              java: `public static int[] merge(int[] nums1, int[] nums2) {\n    int[] out = new int[nums1.length + nums2.length];\n    int i = 0, j = 0, p = 0;\n    while (i < nums1.length && j < nums2.length) {\n        if (nums1[i] <= nums2[j]) out[p++] = nums1[i++];\n        else out[p++] = nums2[j++];\n    }\n    while (i < nums1.length) out[p++] = nums1[i++];\n    while (j < nums2.length) out[p++] = nums2[j++];\n    return out;\n}`,
              cpp: `vector<int> merge(vector<int>& nums1, vector<int>& nums2) {\n    vector<int> out;\n    size_t i = 0, j = 0;\n    while (i < nums1.size() && j < nums2.size()) {\n        if (nums1[i] <= nums2[j]) out.push_back(nums1[i++]);\n        else out.push_back(nums2[j++]);\n    }\n    while (i < nums1.size()) out.push_back(nums1[i++]);\n    while (j < nums2.size()) out.push_back(nums2[j++]);\n    return out;\n}`,
              c: `int* merge(int* nums1, int nums1Size, int* nums2, int nums2Size, int* returnSize) {\n    int total = nums1Size + nums2Size;\n    int* out = (int*) malloc((total > 0 ? total : 1) * sizeof(int));\n    int i = 0, j = 0, p = 0;\n    while (i < nums1Size && j < nums2Size) {\n        if (nums1[i] <= nums2[j]) out[p++] = nums1[i++];\n        else out[p++] = nums2[j++];\n    }\n    while (i < nums1Size) out[p++] = nums1[i++];\n    while (j < nums2Size) out[p++] = nums2[j++];\n    *returnSize = total;\n    return out;\n}`,
              csharp: `public static int[] Merge(int[] nums1, int[] nums2)\n{\n    int[] res = new int[nums1.Length + nums2.Length];\n    int i = 0, j = 0, p = 0;\n    while (i < nums1.Length && j < nums2.Length)\n    {\n        if (nums1[i] <= nums2[j]) res[p++] = nums1[i++];\n        else res[p++] = nums2[j++];\n    }\n    while (i < nums1.Length) res[p++] = nums1[i++];\n    while (j < nums2.Length) res[p++] = nums2[j++];\n    return res;\n}`,
              go: `func merge(nums1 []int, nums2 []int) []int {\n	out := make([]int, 0, len(nums1)+len(nums2))\n	i, j := 0, 0\n	for i < len(nums1) && j < len(nums2) {\n		if nums1[i] <= nums2[j] {\n			out = append(out, nums1[i])\n			i++\n		} else {\n			out = append(out, nums2[j])\n			j++\n		}\n	}\n	for i < len(nums1) {\n		out = append(out, nums1[i])\n		i++\n	}\n	for j < len(nums2) {\n		out = append(out, nums2[j])\n		j++\n	}\n	return out\n}`,
              kotlin: `fun merge(nums1: IntArray, nums2: IntArray): IntArray {\n    val out = IntArray(nums1.size + nums2.size)\n    var i = 0\n    var j = 0\n    var p = 0\n    while (i < nums1.size && j < nums2.size) {\n        if (nums1[i] <= nums2[j]) out[p++] = nums1[i++] else out[p++] = nums2[j++]\n    }\n    while (i < nums1.size) out[p++] = nums1[i++]\n    while (j < nums2.size) out[p++] = nums2[j++]\n    return out\n}`,
              swift: `func merge(_ nums1: [Int], _ nums2: [Int]) -> [Int] {\n    var out: [Int] = []\n    var i = 0\n    var j = 0\n    while i < nums1.count && j < nums2.count {\n        if nums1[i] <= nums2[j] {\n            out.append(nums1[i])\n            i += 1\n        } else {\n            out.append(nums2[j])\n            j += 1\n        }\n    }\n    while i < nums1.count {\n        out.append(nums1[i])\n        i += 1\n    }\n    while j < nums2.count {\n        out.append(nums2[j])\n        j += 1\n    }\n    return out\n}`,
              rust: `fn merge(nums1: Vec<i32>, nums2: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::with_capacity(nums1.len() + nums2.len());\n    let mut i = 0usize;\n    let mut j = 0usize;\n    while i < nums1.len() && j < nums2.len() {\n        if nums1[i] <= nums2[j] {\n            out.push(nums1[i]);\n            i += 1;\n        } else {\n            out.push(nums2[j]);\n            j += 1;\n        }\n    }\n    while i < nums1.len() {\n        out.push(nums1[i]);\n        i += 1;\n    }\n    while j < nums2.len() {\n        out.push(nums2[j]);\n        j += 1;\n    }\n    out\n}`,
              php: `function merge($nums1, $nums2) {\n    $out = array();\n    $i = 0;\n    $j = 0;\n    $n1 = count($nums1);\n    $n2 = count($nums2);\n    while ($i < $n1 && $j < $n2) {\n        if ($nums1[$i] <= $nums2[$j]) { $out[] = $nums1[$i]; $i++; }\n        else { $out[] = $nums2[$j]; $j++; }\n    }\n    while ($i < $n1) { $out[] = $nums1[$i]; $i++; }\n    while ($j < $n2) { $out[] = $nums2[$j]; $j++; }\n    return $out;\n}`,
              ruby: `def merge(nums1, nums2)\n  out = []\n  i = 0\n  j = 0\n  while i < nums1.length && j < nums2.length\n    if nums1[i] <= nums2[j]\n      out.push(nums1[i])\n      i += 1\n    else\n      out.push(nums2[j])\n      j += 1\n    end\n  end\n  out.concat(nums1[i..-1]) if i < nums1.length\n  out.concat(nums2[j..-1]) if j < nums2.length\n  out\nend`,
      },
    };
  })(),

  // ── First Missing Positive ──────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const s = new Set(nums);
      let i = 1;
      while (s.has(i)) i++;
      return i;
    };
    return {
      slug: "first-missing-positive",
      title: "First Missing Positive",
      difficulty: "HARD" as const,
      tags: ["Array", "Hash Table"],
      signature: { funcName: "firstMissingPositive", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an unsorted integer array `nums`, return the **smallest positive integer** that is not present.\n\nAn `O(n)` time, `O(1)` extra-space solution exists (index marking).",
        [
          { in: "nums = [1,2,0]", out: "3" },
          { in: "nums = [3,4,-1,1]", out: "2" },
          { in: "nums = [7,8,9,11,12]", out: "1" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i] <= 100"]),
      hints: [
        "The answer is always between 1 and n+1 inclusive.",
        "Try to place each value v at index v-1, then scan for the first index where nums[i] != i+1.",
      ],
      examples: [
        { input: "[1,2,0]", expectedOutput: "3" },
        { input: "[3,4,-1,1]", expectedOutput: "2" },
        { input: "[7,8,9,11,12]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const nums = genArr(rng, [1, 30], [-15, 35]);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      editorial: explain({
        idea: "With `n` values, the answer must lie in `1 .. n+1` — if every one of `1 .. n` is present the answer is `n+1`, and otherwise it is the smallest one missing. That bound is what makes the problem tractable: only values inside that window matter, and everything else (negatives, zeros, values above `n`) can be ignored outright.",
        steps: [
          "Mark which of the values `1 .. n` actually appear, ignoring anything outside that range.",
          "Scan `v` from `1` upwards.",
          "Return the first `v` whose mark is absent.",
          "If all are present, return `n + 1`.",
        ],
        why: "The pigeonhole principle gives the bound: `n` values cannot cover `1 .. n+1`, so a missing positive always exists at or below `n+1`. Values outside `1 .. n` can never be the answer's neighbours in any useful way — they only fill slots that do not exist — so discarding them loses nothing. The `O(1)`-space version stores the same marks inside the input, either by permuting each value `v` into position `v-1` or by negating the slot it indexes.",
        time: "O(n)",
        space: "O(n), or O(1) marking in place",
        pitfalls: [
          "The answer can be `n + 1`, so the scan must extend one past the array length.",
          "Filter out non-positive values and anything larger than `n` before indexing, or you read out of bounds.",
          "Duplicates are harmless — marking a slot twice changes nothing.",
          "Sorting first works but costs `O(n log n)`, which the problem's `O(n)` target rules out.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef firstMissingPositive(nums: List[int]) -> int:\n    s = set(nums)\n    i = 1\n    while i in s:\n        i += 1\n    return i`,
        javascript: `var firstMissingPositive = function(nums) {\n    const s = new Set(nums);\n    let i = 1;\n    while (s.has(i)) i++;\n    return i;\n};`,
              typescript: `function firstMissingPositive(nums: number[]): number {\n    const n = nums.length;\n    const seen: boolean[] = [];\n    for (let i = 0; i <= n + 1; i++) seen.push(false);\n    for (let i = 0; i < n; i++) {\n        const x = nums[i];\n        if (x >= 1 && x <= n) seen[x] = true;\n    }\n    for (let v = 1; v <= n + 1; v++) {\n        if (!seen[v]) return v;\n    }\n    return n + 1;\n}`,
              java: `public static int firstMissingPositive(int[] nums) {\n    int n = nums.length;\n    boolean[] seen = new boolean[n + 2];\n    for (int x : nums) {\n        if (x >= 1 && x <= n) seen[x] = true;\n    }\n    for (int v = 1; v <= n + 1; v++) {\n        if (!seen[v]) return v;\n    }\n    return n + 1;\n}`,
              cpp: `int firstMissingPositive(vector<int>& nums) {\n    int n = (int) nums.size();\n    vector<bool> seen(n + 2, false);\n    for (int x : nums) {\n        if (x >= 1 && x <= n) seen[x] = true;\n    }\n    for (int v = 1; v <= n + 1; v++) {\n        if (!seen[v]) return v;\n    }\n    return n + 1;\n}`,
              c: `int firstMissingPositive(int* nums, int numsSize) {\n    int n = numsSize;\n    int* seen = (int*) calloc(n + 2, sizeof(int));\n    for (int i = 0; i < n; i++) {\n        int x = nums[i];\n        if (x >= 1 && x <= n) seen[x] = 1;\n    }\n    int ans = n + 1;\n    for (int v = 1; v <= n + 1; v++) {\n        if (!seen[v]) {\n            ans = v;\n            break;\n        }\n    }\n    free(seen);\n    return ans;\n}`,
              csharp: `public static int FirstMissingPositive(int[] nums)\n{\n    int n = nums.Length;\n    bool[] seen = new bool[n + 2];\n    foreach (int x in nums)\n    {\n        if (x >= 1 && x <= n) seen[x] = true;\n    }\n    for (int v = 1; v <= n + 1; v++)\n    {\n        if (!seen[v]) return v;\n    }\n    return n + 1;\n}`,
              go: `func firstMissingPositive(nums []int) int {\n	n := len(nums)\n	seen := make([]bool, n+2)\n	for _, x := range nums {\n		if x >= 1 && x <= n {\n			seen[x] = true\n		}\n	}\n	for v := 1; v <= n+1; v++ {\n		if !seen[v] {\n			return v\n		}\n	}\n	return n + 1\n}`,
              kotlin: `fun firstMissingPositive(nums: IntArray): Int {\n    val n = nums.size\n    val seen = BooleanArray(n + 2)\n    for (x in nums) {\n        if (x in 1..n) seen[x] = true\n    }\n    for (v in 1..n + 1) {\n        if (!seen[v]) return v\n    }\n    return n + 1\n}`,
              swift: `func firstMissingPositive(_ nums: [Int]) -> Int {\n    let n = nums.count\n    var seen = [Bool](repeating: false, count: n + 2)\n    for x in nums {\n        if x >= 1 && x <= n { seen[x] = true }\n    }\n    for v in 1...(n + 1) {\n        if !seen[v] { return v }\n    }\n    return n + 1\n}`,
              rust: `fn firstMissingPositive(nums: Vec<i32>) -> i32 {\n    let n = nums.len();\n    let mut seen = vec![false; n + 2];\n    for &x in nums.iter() {\n        if x >= 1 && x <= n as i32 {\n            seen[x as usize] = true;\n        }\n    }\n    for v in 1..=(n + 1) {\n        if !seen[v] {\n            return v as i32;\n        }\n    }\n    (n + 1) as i32\n}`,
              php: `function firstMissingPositive($nums) {\n    $n = count($nums);\n    $seen = array_fill(0, $n + 2, false);\n    foreach ($nums as $x) {\n        if ($x >= 1 && $x <= $n) $seen[$x] = true;\n    }\n    for ($v = 1; $v <= $n + 1; $v++) {\n        if (!$seen[$v]) return $v;\n    }\n    return $n + 1;\n}`,
              ruby: `def firstMissingPositive(nums)\n  n = nums.length\n  seen = Array.new(n + 2, false)\n  nums.each do |x|\n    seen[x] = true if x >= 1 && x <= n\n  end\n  (1..(n + 1)).each do |v|\n    return v unless seen[v]\n  end\n  n + 1\nend`,
      },
    };
  })(),

  // ── Trapping Rain Water ─────────────────────────────────────────
  (() => {
    const ref = (h: number[]) => {
      let l = 0, r = h.length - 1, lm = 0, rm = 0, water = 0;
      while (l < r) {
        if (h[l] < h[r]) {
          lm = Math.max(lm, h[l]);
          water += lm - h[l];
          l++;
        } else {
          rm = Math.max(rm, h[r]);
          water += rm - h[r];
          r--;
        }
      }
      return water;
    };
    return {
      slug: "trapping-rain-water",
      title: "Trapping Rain Water",
      difficulty: "HARD" as const,
      tags: ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
      signature: { funcName: "trap", params: [{ name: "height", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute **how much water it can trap** after raining.",
        [
          { in: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", out: "6" },
          { in: "height = [4,2,0,3,2,5]", out: "9" },
        ],
        ["1 <= height.length <= 30", "0 <= height[i] <= 100"]),
      hints: [
        "Water above position i is min(maxLeft, maxRight) - height[i].",
        "Two pointers moving inward, tracking the running max from each side, gives O(n)/O(1).",
      ],
      examples: [
        { input: "[0,1,0,2,1,0,1,3,2,1,2,1]", expectedOutput: "6" },
        { input: "[4,2,0,3,2,5]", expectedOutput: "9" },
      ],
      gen: (rng: Rng) => {
        const h = genArr(rng, [1, 30], [0, 100]);
        return { input: fmtIntArr(h), expectedOutput: String(ref(h)) };
      },
      editorial: explain({
        idea: "Water above a bar is limited by the **shorter** of the tallest wall to its left and the tallest to its right. Two pointers let you resolve that without precomputing both arrays: whichever side is currently shorter is the binding constraint, so that side can be settled and advanced immediately.",
        steps: [
          "Put `l` at the start and `r` at the end, tracking `leftMax` and `rightMax`.",
          "If `height[l] < height[r]`, the left side is the limiting one.",
          "In that case: if `height[l]` is at least `leftMax`, it becomes the new `leftMax`; otherwise it traps `leftMax - height[l]`. Advance `l`.",
          "Otherwise do the mirror image on the right and move `r` inward.",
          "Continue until the pointers meet.",
        ],
        why: "When `height[l] < height[r]`, there is guaranteed to be some wall on the right at least as tall as `height[r]`, so the water above position `l` is decided entirely by `leftMax` — the right side cannot be the smaller of the two. That makes the left position safe to finalise without knowing the actual right maximum, which is what removes the need for a precomputed suffix array. The mirror argument covers the other branch, and each step retires one position.",
        time: "O(n)",
        space: "O(1)",
        pitfalls: [
          "Advance the pointer on the **shorter** side; moving the taller one breaks the guarantee the argument depends on.",
          "Update the running maximum *or* add water, never both for the same bar.",
          "Water is `max - height`, which is `0` at a new maximum — no negative contributions.",
          "Compare `height[l]` with `height[r]`, not `leftMax` with `rightMax`, when deciding which side to move.",
        ],
      }),
      solutions: {
        python: `from typing import List\n\ndef trap(height: List[int]) -> int:\n    l, r = 0, len(height) - 1\n    lm = rm = water = 0\n    while l < r:\n        if height[l] < height[r]:\n            lm = max(lm, height[l])\n            water += lm - height[l]\n            l += 1\n        else:\n            rm = max(rm, height[r])\n            water += rm - height[r]\n            r -= 1\n    return water`,
        javascript: `var trap = function(height) {\n    let l = 0, r = height.length - 1;\n    let lm = 0, rm = 0, water = 0;\n    while (l < r) {\n        if (height[l] < height[r]) {\n            lm = Math.max(lm, height[l]);\n            water += lm - height[l];\n            l++;\n        } else {\n            rm = Math.max(rm, height[r]);\n            water += rm - height[r];\n            r--;\n        }\n    }\n    return water;\n};`,
              typescript: `function trap(height: number[]): number {\n    let l = 0;\n    let r = height.length - 1;\n    let leftMax = 0;\n    let rightMax = 0;\n    let total = 0;\n    while (l < r) {\n        if (height[l] < height[r]) {\n            if (height[l] >= leftMax) leftMax = height[l];\n            else total += leftMax - height[l];\n            l++;\n        } else {\n            if (height[r] >= rightMax) rightMax = height[r];\n            else total += rightMax - height[r];\n            r--;\n        }\n    }\n    return total;\n}`,
              java: `public static int trap(int[] height) {\n    int l = 0, r = height.length - 1, leftMax = 0, rightMax = 0, total = 0;\n    while (l < r) {\n        if (height[l] < height[r]) {\n            if (height[l] >= leftMax) leftMax = height[l];\n            else total += leftMax - height[l];\n            l++;\n        } else {\n            if (height[r] >= rightMax) rightMax = height[r];\n            else total += rightMax - height[r];\n            r--;\n        }\n    }\n    return total;\n}`,
              cpp: `int trap(vector<int>& height) {\n    int l = 0, r = (int) height.size() - 1, leftMax = 0, rightMax = 0, total = 0;\n    while (l < r) {\n        if (height[l] < height[r]) {\n            if (height[l] >= leftMax) leftMax = height[l];\n            else total += leftMax - height[l];\n            l++;\n        } else {\n            if (height[r] >= rightMax) rightMax = height[r];\n            else total += rightMax - height[r];\n            r--;\n        }\n    }\n    return total;\n}`,
              c: `int trap(int* height, int heightSize) {\n    int l = 0, r = heightSize - 1, leftMax = 0, rightMax = 0, total = 0;\n    while (l < r) {\n        if (height[l] < height[r]) {\n            if (height[l] >= leftMax) leftMax = height[l];\n            else total += leftMax - height[l];\n            l++;\n        } else {\n            if (height[r] >= rightMax) rightMax = height[r];\n            else total += rightMax - height[r];\n            r--;\n        }\n    }\n    return total;\n}`,
              csharp: `public static int Trap(int[] height)\n{\n    int l = 0, r = height.Length - 1, leftMax = 0, rightMax = 0, total = 0;\n    while (l < r)\n    {\n        if (height[l] < height[r])\n        {\n            if (height[l] >= leftMax) leftMax = height[l];\n            else total += leftMax - height[l];\n            l++;\n        }\n        else\n        {\n            if (height[r] >= rightMax) rightMax = height[r];\n            else total += rightMax - height[r];\n            r--;\n        }\n    }\n    return total;\n}`,
              go: `func trap(height []int) int {\n	l, r := 0, len(height)-1\n	leftMax, rightMax, total := 0, 0, 0\n	for l < r {\n		if height[l] < height[r] {\n			if height[l] >= leftMax {\n				leftMax = height[l]\n			} else {\n				total += leftMax - height[l]\n			}\n			l++\n		} else {\n			if height[r] >= rightMax {\n				rightMax = height[r]\n			} else {\n				total += rightMax - height[r]\n			}\n			r--\n		}\n	}\n	return total\n}`,
              kotlin: `fun trap(height: IntArray): Int {\n    var l = 0\n    var r = height.size - 1\n    var leftMax = 0\n    var rightMax = 0\n    var total = 0\n    while (l < r) {\n        if (height[l] < height[r]) {\n            if (height[l] >= leftMax) leftMax = height[l] else total += leftMax - height[l]\n            l++\n        } else {\n            if (height[r] >= rightMax) rightMax = height[r] else total += rightMax - height[r]\n            r--\n        }\n    }\n    return total\n}`,
              swift: `func trap(_ height: [Int]) -> Int {\n    var l = 0\n    var r = height.count - 1\n    var leftMax = 0\n    var rightMax = 0\n    var total = 0\n    while l < r {\n        if height[l] < height[r] {\n            if height[l] >= leftMax { leftMax = height[l] }\n            else { total += leftMax - height[l] }\n            l += 1\n        } else {\n            if height[r] >= rightMax { rightMax = height[r] }\n            else { total += rightMax - height[r] }\n            r -= 1\n        }\n    }\n    return total\n}`,
              rust: `fn trap(height: Vec<i32>) -> i32 {\n    let mut l = 0usize;\n    let mut r = height.len() - 1;\n    let mut left_max = 0;\n    let mut right_max = 0;\n    let mut total = 0;\n    while l < r {\n        if height[l] < height[r] {\n            if height[l] >= left_max {\n                left_max = height[l];\n            } else {\n                total += left_max - height[l];\n            }\n            l += 1;\n        } else {\n            if height[r] >= right_max {\n                right_max = height[r];\n            } else {\n                total += right_max - height[r];\n            }\n            r -= 1;\n        }\n    }\n    total\n}`,
              php: `function trap($height) {\n    $l = 0;\n    $r = count($height) - 1;\n    $leftMax = 0;\n    $rightMax = 0;\n    $total = 0;\n    while ($l < $r) {\n        if ($height[$l] < $height[$r]) {\n            if ($height[$l] >= $leftMax) $leftMax = $height[$l];\n            else $total += $leftMax - $height[$l];\n            $l++;\n        } else {\n            if ($height[$r] >= $rightMax) $rightMax = $height[$r];\n            else $total += $rightMax - $height[$r];\n            $r--;\n        }\n    }\n    return $total;\n}`,
              ruby: `def trap(height)\n  l = 0\n  r = height.length - 1\n  left_max = 0\n  right_max = 0\n  total = 0\n  while l < r\n    if height[l] < height[r]\n      if height[l] >= left_max\n        left_max = height[l]\n      else\n        total += left_max - height[l]\n      end\n      l += 1\n    else\n      if height[r] >= right_max\n        right_max = height[r]\n      else\n        total += right_max - height[r]\n      end\n      r -= 1\n    end\n  end\n  total\nend`,
      },
    };
  })(),

];
