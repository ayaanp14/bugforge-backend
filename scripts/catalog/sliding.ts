/**
 * Sliding window, two pointers and prefix sums — the pattern block that
 * dominates Amazon and Google array rounds, plus the light counting drills
 * that show up in Adobe and Microsoft screens. Company names ride in `tags`.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, fmtIntArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

const randArr = (rng: Rng, n: number, lo: number, hi: number) =>
  Array.from({ length: n }, () => ri(rng, lo, hi));

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const randStr = (rng: Rng, lo: number, hi: number, alphabet = LOWER) =>
  Array.from({ length: ri(rng, lo, hi) }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");

export const SLIDING_PROBLEMS: CatalogProblem[] = [

  // ── Maximum Number of Vowels in a Substring of Given Length ─────
  (() => {
    const ref = (s: string, k: number) => {
      const isV = (c: string) => "aeiou".indexOf(c) >= 0;
      let cur = 0;
      for (let i = 0; i < k; i++) if (isV(s[i])) cur++;
      let best = cur;
      for (let i = k; i < s.length; i++) {
        if (isV(s[i])) cur++;
        if (isV(s[i - k])) cur--;
        if (cur > best) best = cur;
      }
      return best;
    };
    return {
      slug: "maximum-number-of-vowels-in-a-substring-of-given-length",
      title: "Maximum Number of Vowels in a Substring of Given Length",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Sliding Window", "Amazon", "Google", "Adobe"],
      signature: { funcName: "maxVowels", params: [{ name: "s", type: "string" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a string `s` and an integer `k`, return the maximum number of vowel letters in any substring of `s` with length exactly `k`.\n\nThe vowel letters are `a`, `e`, `i`, `o` and `u`.",
        [
          { in: 's = "abciiidef", k = 3', out: "3", note: 'The substring "iii" holds three vowels.' },
          { in: 's = "aeiou", k = 2', out: "2" },
          { in: 's = "leetcode", k = 3', out: "2", note: '"lee", "eet" and "ode" each contain two vowels.' },
        ],
        ["1 <= s.length <= 40", "1 <= k <= s.length", "s consists of lowercase English letters."]),
      hints: [
        "Recounting each window from scratch is O(n·k). The windows overlap heavily — reuse the count.",
        "Slide by one: add the character entering on the right, remove the one leaving on the left.",
        "Seed the count with the first `k` characters before the sliding loop starts.",
      ],
      examples: [
        { input: '"abciiidef"\n3', expectedOutput: "3" },
        { input: '"aeiou"\n2', expectedOutput: "2" },
        { input: '"leetcode"\n3', expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const s = randStr(rng, 1, 40, rng() < 0.5 ? "aeioubcd" : LOWER);
        const k = ri(rng, 1, s.length);
        return { input: `"${s}"\n${k}`, expectedOutput: String(ref(s, k)) };
      },
      solutions: {
        python: `def maxVowels(s: str, k: int) -> int:\n    vowels = set("aeiou")\n    cur = sum(1 for ch in s[:k] if ch in vowels)\n    best = cur\n    for i in range(k, len(s)):\n        if s[i] in vowels:\n            cur += 1\n        if s[i - k] in vowels:\n            cur -= 1\n        if cur > best:\n            best = cur\n    return best`,
        javascript: `var maxVowels = function(s, k) {\n    const isV = function(c) { return "aeiou".indexOf(c) >= 0; };\n    let cur = 0;\n    for (let i = 0; i < k; i++) {\n        if (isV(s[i])) cur++;\n    }\n    let best = cur;\n    for (let i = k; i < s.length; i++) {\n        if (isV(s[i])) cur++;\n        if (isV(s[i - k])) cur--;\n        if (cur > best) best = cur;\n    }\n    return best;\n};`,

        typescript: `function maxVowels(s: string, k: number): number {\n    var vowels = "aeiou";\n    var cur = 0;\n    for (var i = 0; i < k; i++) {\n        if (vowels.indexOf(s.charAt(i)) >= 0) cur++;\n    }\n    var best = cur;\n    for (var j = k; j < s.length; j++) {\n        if (vowels.indexOf(s.charAt(j)) >= 0) cur++;\n        if (vowels.indexOf(s.charAt(j - k)) >= 0) cur--;\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,

        java: `public static int maxVowels(String s, int k) {\n    String vowels = "aeiou";\n    int cur = 0;\n    for (int i = 0; i < k; i++) {\n        if (vowels.indexOf(s.charAt(i)) >= 0) cur++;\n    }\n    int best = cur;\n    for (int i = k; i < s.length(); i++) {\n        if (vowels.indexOf(s.charAt(i)) >= 0) cur++;\n        if (vowels.indexOf(s.charAt(i - k)) >= 0) cur--;\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,

        cpp: `int maxVowels(string s, int k) {\n    string vowels = "aeiou";\n    int cur = 0;\n    for (int i = 0; i < k; i++) {\n        if (vowels.find(s[i]) != string::npos) cur++;\n    }\n    int best = cur;\n    for (int i = k; i < (int) s.size(); i++) {\n        if (vowels.find(s[i]) != string::npos) cur++;\n        if (vowels.find(s[i - k]) != string::npos) cur--;\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,

        c: `static bool isVowelLetter(char c) {\n    return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';\n}\n\nint maxVowels(const char* s, int k) {\n    int n = (int) strlen(s);\n    int cur = 0;\n    for (int i = 0; i < k; i++) {\n        if (isVowelLetter(s[i])) cur++;\n    }\n    int best = cur;\n    for (int i = k; i < n; i++) {\n        if (isVowelLetter(s[i])) cur++;\n        if (isVowelLetter(s[i - k])) cur--;\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,

        csharp: `public static int MaxVowels(string s, int k)\n{\n    string vowels = "aeiou";\n    int cur = 0;\n    for (int i = 0; i < k; i++)\n    {\n        if (vowels.IndexOf(s[i]) >= 0) cur++;\n    }\n    int best = cur;\n    for (int i = k; i < s.Length; i++)\n    {\n        if (vowels.IndexOf(s[i]) >= 0) cur++;\n        if (vowels.IndexOf(s[i - k]) >= 0) cur--;\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,

        go: `func maxVowels(s string, k int) int {\n	isVowel := func(c byte) bool {\n		return strings.IndexByte("aeiou", c) >= 0\n	}\n	cur := 0\n	for i := 0; i < k; i++ {\n		if isVowel(s[i]) {\n			cur++\n		}\n	}\n	best := cur\n	for i := k; i < len(s); i++ {\n		if isVowel(s[i]) {\n			cur++\n		}\n		if isVowel(s[i-k]) {\n			cur--\n		}\n		if cur > best {\n			best = cur\n		}\n	}\n	return best\n}`,

        kotlin: `fun maxVowels(s: String, k: Int): Int {\n    val vowels = "aeiou"\n    var cur = 0\n    for (i in 0 until k) {\n        if (vowels.indexOf(s[i]) >= 0) cur++\n    }\n    var best = cur\n    for (i in k until s.length) {\n        if (vowels.indexOf(s[i]) >= 0) cur++\n        if (vowels.indexOf(s[i - k]) >= 0) cur--\n        if (cur > best) best = cur\n    }\n    return best\n}`,

        swift: `func maxVowels(_ s: String, _ k: Int) -> Int {\n    let vowels: Set<Character> = ["a", "e", "i", "o", "u"]\n    let chars = Array(s)\n    var cur = 0\n    for i in 0..<k {\n        if vowels.contains(chars[i]) { cur += 1 }\n    }\n    var best = cur\n    for i in k..<chars.count {\n        if vowels.contains(chars[i]) { cur += 1 }\n        if vowels.contains(chars[i - k]) { cur -= 1 }\n        if cur > best { best = cur }\n    }\n    return best\n}`,

        rust: `fn maxVowels(s: String, k: i32) -> i32 {\n    let window = k as usize;\n    let bytes = s.as_bytes();\n    let is_vowel = |c: u8| b"aeiou".contains(&c);\n    let mut cur = 0;\n    for i in 0..window {\n        if is_vowel(bytes[i]) {\n            cur += 1;\n        }\n    }\n    let mut best = cur;\n    for i in window..bytes.len() {\n        if is_vowel(bytes[i]) {\n            cur += 1;\n        }\n        if is_vowel(bytes[i - window]) {\n            cur -= 1;\n        }\n        if cur > best {\n            best = cur;\n        }\n    }\n    best\n}`,

        php: `function maxVowels($s, $k) {\n    $vowels = "aeiou";\n    $cur = 0;\n    for ($i = 0; $i < $k; $i++) {\n        if (strpos($vowels, $s[$i]) !== false) $cur++;\n    }\n    $best = $cur;\n    $n = strlen($s);\n    for ($i = $k; $i < $n; $i++) {\n        if (strpos($vowels, $s[$i]) !== false) $cur++;\n        if (strpos($vowels, $s[$i - $k]) !== false) $cur--;\n        if ($cur > $best) $best = $cur;\n    }\n    return $best;\n}`,

        ruby: `def maxVowels(s, k)\n  vowels = "aeiou"\n  cur = 0\n  (0...k).each { |i| cur += 1 if vowels.include?(s[i]) }\n  best = cur\n  (k...s.length).each do |i|\n    cur += 1 if vowels.include?(s[i])\n    cur -= 1 if vowels.include?(s[i - k])\n    best = cur if cur > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Number of Sub-arrays of Size K and Average >= Threshold ─────
  (() => {
    const ref = (arr: number[], k: number, threshold: number) => {
      const need = k * threshold;
      let sum = 0;
      for (let i = 0; i < k; i++) sum += arr[i];
      let count = sum >= need ? 1 : 0;
      for (let i = k; i < arr.length; i++) {
        sum += arr[i] - arr[i - k];
        if (sum >= need) count++;
      }
      return count;
    };
    return {
      slug: "number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold",
      title: "Number of Sub-arrays of Size K and Average Greater than or Equal to Threshold",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Amazon", "Google"],
      signature: { funcName: "numOfSubarrays", params: [{ name: "arr", type: "int[]" as const }, { name: "k", type: "int" as const }, { name: "threshold", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an array of integers `arr` and two integers `k` and `threshold`, return the number of sub-arrays of size `k` whose **average** is greater than or equal to `threshold`.",
        [
          { in: "arr = [2,2,2,2,5,5,5,8], k = 3, threshold = 4", out: "3", note: "The qualifying windows are [2,5,5], [5,5,5] and [5,5,8]." },
          { in: "arr = [11,13,17,23,29,31,7,5,2,3], k = 3, threshold = 5", out: "6" },
          { in: "arr = [1,1,1], k = 3, threshold = 2", out: "0" },
        ],
        ["1 <= arr.length <= 40", "1 <= arr[i] <= 100", "1 <= k <= arr.length", "0 <= threshold <= 100"]),
      hints: [
        "Avoid division entirely: `sum / k >= threshold` is the same as `sum >= k * threshold` for positive `k`.",
        "Maintain the window sum and slide it, adding the entering element and subtracting the leaving one.",
        "Count a window the moment its sum clears the bar.",
      ],
      examples: [
        { input: "[2,2,2,2,5,5,5,8]\n3\n4", expectedOutput: "3" },
        { input: "[11,13,17,23,29,31,7,5,2,3]\n3\n5", expectedOutput: "6" },
        { input: "[1,1,1]\n3\n2", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const arr = randArr(rng, n, 1, 100);
        const k = ri(rng, 1, n);
        const threshold = ri(rng, 0, 100);
        return { input: `${fmtIntArr(arr)}\n${k}\n${threshold}`, expectedOutput: String(ref(arr, k, threshold)) };
      },
      solutions: {
        python: `def numOfSubarrays(arr, k: int, threshold: int) -> int:\n    need = k * threshold\n    total = sum(arr[:k])\n    count = 1 if total >= need else 0\n    for i in range(k, len(arr)):\n        total += arr[i] - arr[i - k]\n        if total >= need:\n            count += 1\n    return count`,
        javascript: `var numOfSubarrays = function(arr, k, threshold) {\n    const need = k * threshold;\n    let sum = 0;\n    for (let i = 0; i < k; i++) sum += arr[i];\n    let count = sum >= need ? 1 : 0;\n    for (let i = k; i < arr.length; i++) {\n        sum += arr[i] - arr[i - k];\n        if (sum >= need) count++;\n    }\n    return count;\n};`,

        typescript: `function numOfSubarrays(arr: number[], k: number, threshold: number): number {\n    var need = k * threshold;\n    var sum = 0;\n    for (var i = 0; i < k; i++) sum += arr[i];\n    var count = sum >= need ? 1 : 0;\n    for (var j = k; j < arr.length; j++) {\n        sum += arr[j] - arr[j - k];\n        if (sum >= need) count++;\n    }\n    return count;\n}`,

        java: `public static int numOfSubarrays(int[] arr, int k, int threshold) {\n    int need = k * threshold;\n    int sum = 0;\n    for (int i = 0; i < k; i++) sum += arr[i];\n    int count = sum >= need ? 1 : 0;\n    for (int i = k; i < arr.length; i++) {\n        sum += arr[i] - arr[i - k];\n        if (sum >= need) count++;\n    }\n    return count;\n}`,

        cpp: `int numOfSubarrays(vector<int>& arr, int k, int threshold) {\n    int need = k * threshold;\n    int sum = 0;\n    for (int i = 0; i < k; i++) sum += arr[i];\n    int count = sum >= need ? 1 : 0;\n    for (int i = k; i < (int) arr.size(); i++) {\n        sum += arr[i] - arr[i - k];\n        if (sum >= need) count++;\n    }\n    return count;\n}`,

        c: `int numOfSubarrays(int* arr, int arrSize, int k, int threshold) {\n    int need = k * threshold;\n    int sum = 0;\n    for (int i = 0; i < k; i++) sum += arr[i];\n    int count = sum >= need ? 1 : 0;\n    for (int i = k; i < arrSize; i++) {\n        sum += arr[i] - arr[i - k];\n        if (sum >= need) count++;\n    }\n    return count;\n}`,

        csharp: `public static int NumOfSubarrays(int[] arr, int k, int threshold)\n{\n    int need = k * threshold;\n    int sum = 0;\n    for (int i = 0; i < k; i++) sum += arr[i];\n    int count = sum >= need ? 1 : 0;\n    for (int i = k; i < arr.Length; i++)\n    {\n        sum += arr[i] - arr[i - k];\n        if (sum >= need) count++;\n    }\n    return count;\n}`,

        go: `func numOfSubarrays(arr []int, k int, threshold int) int {\n	need := k * threshold\n	sum := 0\n	for i := 0; i < k; i++ {\n		sum += arr[i]\n	}\n	count := 0\n	if sum >= need {\n		count = 1\n	}\n	for i := k; i < len(arr); i++ {\n		sum += arr[i] - arr[i-k]\n		if sum >= need {\n			count++\n		}\n	}\n	return count\n}`,

        kotlin: `fun numOfSubarrays(arr: IntArray, k: Int, threshold: Int): Int {\n    val need = k * threshold\n    var sum = 0\n    for (i in 0 until k) sum += arr[i]\n    var count = if (sum >= need) 1 else 0\n    for (i in k until arr.size) {\n        sum += arr[i] - arr[i - k]\n        if (sum >= need) count++\n    }\n    return count\n}`,

        swift: `func numOfSubarrays(_ arr: [Int], _ k: Int, _ threshold: Int) -> Int {\n    let need = k * threshold\n    var sum = 0\n    for i in 0..<k { sum += arr[i] }\n    var count = sum >= need ? 1 : 0\n    for i in k..<arr.count {\n        sum += arr[i] - arr[i - k]\n        if sum >= need { count += 1 }\n    }\n    return count\n}`,

        rust: `fn numOfSubarrays(arr: Vec<i32>, k: i32, threshold: i32) -> i32 {\n    let window = k as usize;\n    let need = k * threshold;\n    let mut sum = 0;\n    for i in 0..window {\n        sum += arr[i];\n    }\n    let mut count = if sum >= need { 1 } else { 0 };\n    for i in window..arr.len() {\n        sum += arr[i] - arr[i - window];\n        if sum >= need {\n            count += 1;\n        }\n    }\n    count\n}`,

        php: `function numOfSubarrays($arr, $k, $threshold) {\n    $need = $k * $threshold;\n    $sum = 0;\n    for ($i = 0; $i < $k; $i++) $sum += $arr[$i];\n    $count = $sum >= $need ? 1 : 0;\n    $n = count($arr);\n    for ($i = $k; $i < $n; $i++) {\n        $sum += $arr[$i] - $arr[$i - $k];\n        if ($sum >= $need) $count++;\n    }\n    return $count;\n}`,

        ruby: `def numOfSubarrays(arr, k, threshold)\n  need = k * threshold\n  sum = arr[0, k].sum\n  count = sum >= need ? 1 : 0\n  (k...arr.length).each do |i|\n    sum += arr[i] - arr[i - k]\n    count += 1 if sum >= need\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Subarray Product Less Than K ────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      if (k <= 1) return 0;
      let product = 1, left = 0, count = 0;
      for (let right = 0; right < nums.length; right++) {
        product *= nums[right];
        while (product >= k) { product /= nums[left]; left++; }
        count += right - left + 1;
      }
      return count;
    };
    return {
      slug: "subarray-product-less-than-k",
      title: "Subarray Product Less Than K",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sliding Window", "Binary Search", "Prefix Sum", "Amazon", "Google", "Meta"],
      signature: { funcName: "numSubarrayProductLessThanK", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an array of positive integers `nums` and an integer `k`, return the number of contiguous subarrays whose product is **strictly less than** `k`.",
        [
          { in: "nums = [10,5,2,6], k = 100", out: "8", note: "The eight are [10], [5], [2], [6], [10,5], [5,2], [2,6] and [5,2,6]." },
          { in: "nums = [1,2,3], k = 0", out: "0", note: "No product is below 0." },
          { in: "nums = [1,1,1], k = 2", out: "6" },
        ],
        ["1 <= nums.length <= 30", "1 <= nums[i] <= 20", "0 <= k <= 1000000"]),
      hints: [
        "All values are positive, so growing the window can only increase the product — the window is monotone.",
        "Expand right, then shrink from the left while the product is at least `k`.",
        "A window `[left, right]` contributes `right - left + 1` subarrays: every one that ends at `right`.",
      ],
      examples: [
        { input: "[10,5,2,6]\n100", expectedOutput: "8" },
        { input: "[1,2,3]\n0", expectedOutput: "0" },
        { input: "[1,1,1]\n2", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 30), 1, 20);
        const k = rng() < 0.2 ? ri(rng, 0, 3) : ri(rng, 0, 1000000);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `def numSubarrayProductLessThanK(nums, k: int) -> int:\n    if k <= 1:\n        return 0\n    product, left, count = 1, 0, 0\n    for right, x in enumerate(nums):\n        product *= x\n        while product >= k:\n            product //= nums[left]\n            left += 1\n        count += right - left + 1\n    return count`,
        javascript: `var numSubarrayProductLessThanK = function(nums, k) {\n    if (k <= 1) return 0;\n    let product = 1, left = 0, count = 0;\n    for (let right = 0; right < nums.length; right++) {\n        product *= nums[right];\n        while (product >= k) {\n            product /= nums[left];\n            left++;\n        }\n        count += right - left + 1;\n    }\n    return count;\n};`,

        typescript: `function numSubarrayProductLessThanK(nums: number[], k: number): number {\n    if (k <= 1) return 0;\n    var product = 1;\n    var left = 0;\n    var count = 0;\n    for (var right = 0; right < nums.length; right++) {\n        product *= nums[right];\n        while (product >= k) {\n            product = product / nums[left];\n            left++;\n        }\n        count += right - left + 1;\n    }\n    return count;\n}`,

        java: `public static int numSubarrayProductLessThanK(int[] nums, int k) {\n    if (k <= 1) return 0;\n    long product = 1;\n    int left = 0, count = 0;\n    for (int right = 0; right < nums.length; right++) {\n        product *= nums[right];\n        while (product >= k) {\n            product /= nums[left];\n            left++;\n        }\n        count += right - left + 1;\n    }\n    return count;\n}`,

        cpp: `int numSubarrayProductLessThanK(vector<int>& nums, int k) {\n    if (k <= 1) return 0;\n    long long product = 1;\n    int left = 0, count = 0;\n    for (int right = 0; right < (int) nums.size(); right++) {\n        product *= nums[right];\n        while (product >= k) {\n            product /= nums[left];\n            left++;\n        }\n        count += right - left + 1;\n    }\n    return count;\n}`,

        c: `int numSubarrayProductLessThanK(int* nums, int numsSize, int k) {\n    if (k <= 1) return 0;\n    long long product = 1;\n    int left = 0, count = 0;\n    for (int right = 0; right < numsSize; right++) {\n        product *= nums[right];\n        while (product >= k) {\n            product /= nums[left];\n            left++;\n        }\n        count += right - left + 1;\n    }\n    return count;\n}`,

        csharp: `public static int NumSubarrayProductLessThanK(int[] nums, int k)\n{\n    if (k <= 1) return 0;\n    long product = 1;\n    int left = 0, count = 0;\n    for (int right = 0; right < nums.Length; right++)\n    {\n        product *= nums[right];\n        while (product >= k)\n        {\n            product /= nums[left];\n            left++;\n        }\n        count += right - left + 1;\n    }\n    return count;\n}`,

        go: `func numSubarrayProductLessThanK(nums []int, k int) int {\n	if k <= 1 {\n		return 0\n	}\n	product := 1\n	left, count := 0, 0\n	for right := 0; right < len(nums); right++ {\n		product *= nums[right]\n		for product >= k {\n			product /= nums[left]\n			left++\n		}\n		count += right - left + 1\n	}\n	return count\n}`,

        kotlin: `fun numSubarrayProductLessThanK(nums: IntArray, k: Int): Int {\n    if (k <= 1) return 0\n    var product = 1L\n    var left = 0\n    var count = 0\n    for (right in nums.indices) {\n        product *= nums[right]\n        while (product >= k) {\n            product /= nums[left]\n            left++\n        }\n        count += right - left + 1\n    }\n    return count\n}`,

        swift: `func numSubarrayProductLessThanK(_ nums: [Int], _ k: Int) -> Int {\n    if k <= 1 { return 0 }\n    var product = 1\n    var left = 0\n    var count = 0\n    for right in 0..<nums.count {\n        product *= nums[right]\n        while product >= k {\n            product /= nums[left]\n            left += 1\n        }\n        count += right - left + 1\n    }\n    return count\n}`,

        rust: `fn numSubarrayProductLessThanK(nums: Vec<i32>, k: i32) -> i32 {\n    if k <= 1 {\n        return 0;\n    }\n    let limit = k as i64;\n    let mut product: i64 = 1;\n    let mut left = 0usize;\n    let mut count = 0i32;\n    for right in 0..nums.len() {\n        product *= nums[right] as i64;\n        while product >= limit {\n            product /= nums[left] as i64;\n            left += 1;\n        }\n        count += (right + 1 - left) as i32;\n    }\n    count\n}`,

        php: `function numSubarrayProductLessThanK($nums, $k) {\n    if ($k <= 1) return 0;\n    $product = 1;\n    $left = 0;\n    $count = 0;\n    $n = count($nums);\n    for ($right = 0; $right < $n; $right++) {\n        $product *= $nums[$right];\n        while ($product >= $k) {\n            $product = intdiv($product, $nums[$left]);\n            $left++;\n        }\n        $count += $right - $left + 1;\n    }\n    return $count;\n}`,

        ruby: `def numSubarrayProductLessThanK(nums, k)\n  return 0 if k <= 1\n  product = 1\n  left = 0\n  count = 0\n  nums.each_with_index do |x, right|\n    product *= x\n    while product >= k\n      product /= nums[left]\n      left += 1\n    end\n    count += right - left + 1\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Contiguous Array ────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const firstAt = new Map<number, number>();
      firstAt.set(0, -1);
      let balance = 0, best = 0;
      for (let i = 0; i < nums.length; i++) {
        balance += nums[i] === 1 ? 1 : -1;
        if (firstAt.has(balance)) {
          const len = i - firstAt.get(balance)!;
          if (len > best) best = len;
        } else {
          firstAt.set(balance, i);
        }
      }
      return best;
    };
    return {
      slug: "contiguous-array",
      title: "Contiguous Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Prefix Sum", "Meta", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "findMaxLength", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given a binary array `nums`, return the maximum length of a contiguous subarray with an **equal number of 0s and 1s**.",
        [
          { in: "nums = [0,1]", out: "2" },
          { in: "nums = [0,1,0]", out: "2", note: "Either [0,1] or [1,0]." },
          { in: "nums = [0,0,1,0,0,0,1,1]", out: "6" },
        ],
        ["1 <= nums.length <= 40", "nums[i] is either 0 or 1."]),
      hints: [
        "Rewrite each 0 as -1. Then the question becomes: what is the longest subarray summing to zero?",
        "Track the running sum. Two positions with the same running sum bracket a zero-sum stretch.",
        "Store the **first** index at which each running sum appears — that maximises the span.",
      ],
      examples: [
        { input: "[0,1]", expectedOutput: "2" },
        { input: "[0,1,0]", expectedOutput: "2" },
        { input: "[0,0,1,0,0,0,1,1]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 40) }, () => (rng() < 0.5 ? 0 : 1));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def findMaxLength(nums) -> int:\n    first = {0: -1}\n    balance = best = 0\n    for i, x in enumerate(nums):\n        balance += 1 if x == 1 else -1\n        if balance in first:\n            best = max(best, i - first[balance])\n        else:\n            first[balance] = i\n    return best`,
        javascript: `var findMaxLength = function(nums) {\n    const firstAt = new Map();\n    firstAt.set(0, -1);\n    let balance = 0, best = 0;\n    for (let i = 0; i < nums.length; i++) {\n        balance += nums[i] === 1 ? 1 : -1;\n        if (firstAt.has(balance)) {\n            const len = i - firstAt.get(balance);\n            if (len > best) best = len;\n        } else {\n            firstAt.set(balance, i);\n        }\n    }\n    return best;\n};`,

        typescript: `function findMaxLength(nums: number[]): number {\n    var firstAt: { [key: string]: number } = {};\n    firstAt["0"] = -1;\n    var balance = 0;\n    var best = 0;\n    for (var i = 0; i < nums.length; i++) {\n        balance += nums[i] === 1 ? 1 : -1;\n        var key = String(balance);\n        if (firstAt[key] !== undefined) {\n            var len = i - firstAt[key];\n            if (len > best) best = len;\n        } else {\n            firstAt[key] = i;\n        }\n    }\n    return best;\n}`,

        java: `public static int findMaxLength(int[] nums) {\n    Map<Integer, Integer> firstAt = new HashMap<>();\n    firstAt.put(0, -1);\n    int balance = 0, best = 0;\n    for (int i = 0; i < nums.length; i++) {\n        balance += nums[i] == 1 ? 1 : -1;\n        Integer seen = firstAt.get(balance);\n        if (seen != null) {\n            best = Math.max(best, i - seen);\n        } else {\n            firstAt.put(balance, i);\n        }\n    }\n    return best;\n}`,

        cpp: `int findMaxLength(vector<int>& nums) {\n    unordered_map<int, int> firstAt;\n    firstAt[0] = -1;\n    int balance = 0, best = 0;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        balance += nums[i] == 1 ? 1 : -1;\n        if (firstAt.count(balance)) {\n            best = max(best, i - firstAt[balance]);\n        } else {\n            firstAt[balance] = i;\n        }\n    }\n    return best;\n}`,

        c: `int findMaxLength(int* nums, int numsSize) {\n    int size = 2 * numsSize + 1;\n    int* firstAt = (int*) malloc(sizeof(int) * size);\n    for (int i = 0; i < size; i++) firstAt[i] = -2;\n    firstAt[numsSize] = -1;\n    int balance = 0, best = 0;\n    for (int i = 0; i < numsSize; i++) {\n        balance += nums[i] == 1 ? 1 : -1;\n        int idx = balance + numsSize;\n        if (firstAt[idx] != -2) {\n            int len = i - firstAt[idx];\n            if (len > best) best = len;\n        } else {\n            firstAt[idx] = i;\n        }\n    }\n    free(firstAt);\n    return best;\n}`,

        csharp: `public static int FindMaxLength(int[] nums)\n{\n    var firstAt = new Dictionary<int, int>();\n    firstAt[0] = -1;\n    int balance = 0, best = 0;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        balance += nums[i] == 1 ? 1 : -1;\n        if (firstAt.ContainsKey(balance))\n        {\n            best = Math.Max(best, i - firstAt[balance]);\n        }\n        else\n        {\n            firstAt[balance] = i;\n        }\n    }\n    return best;\n}`,

        go: `func findMaxLength(nums []int) int {\n	firstAt := map[int]int{0: -1}\n	balance, best := 0, 0\n	for i, x := range nums {\n		if x == 1 {\n			balance++\n		} else {\n			balance--\n		}\n		if seen, ok := firstAt[balance]; ok {\n			if i-seen > best {\n				best = i - seen\n			}\n		} else {\n			firstAt[balance] = i\n		}\n	}\n	return best\n}`,

        kotlin: `fun findMaxLength(nums: IntArray): Int {\n    val firstAt = HashMap<Int, Int>()\n    firstAt[0] = -1\n    var balance = 0\n    var best = 0\n    for (i in nums.indices) {\n        balance += if (nums[i] == 1) 1 else -1\n        val seen = firstAt[balance]\n        if (seen != null) {\n            if (i - seen > best) best = i - seen\n        } else {\n            firstAt[balance] = i\n        }\n    }\n    return best\n}`,

        swift: `func findMaxLength(_ nums: [Int]) -> Int {\n    var firstAt: [Int: Int] = [0: -1]\n    var balance = 0\n    var best = 0\n    for i in 0..<nums.count {\n        balance += nums[i] == 1 ? 1 : -1\n        if let seen = firstAt[balance] {\n            if i - seen > best { best = i - seen }\n        } else {\n            firstAt[balance] = i\n        }\n    }\n    return best\n}`,

        rust: `fn findMaxLength(nums: Vec<i32>) -> i32 {\n    use std::collections::HashMap;\n    let mut first_at: HashMap<i32, i32> = HashMap::new();\n    first_at.insert(0, -1);\n    let mut balance = 0;\n    let mut best = 0;\n    for i in 0..nums.len() {\n        balance += if nums[i] == 1 { 1 } else { -1 };\n        let idx = i as i32;\n        match first_at.get(&balance) {\n            Some(seen) => {\n                if idx - *seen > best {\n                    best = idx - *seen;\n                }\n            }\n            None => {\n                first_at.insert(balance, idx);\n            }\n        }\n    }\n    best\n}`,

        php: `function findMaxLength($nums) {\n    $firstAt = array(0 => -1);\n    $balance = 0;\n    $best = 0;\n    $n = count($nums);\n    for ($i = 0; $i < $n; $i++) {\n        $balance += $nums[$i] === 1 ? 1 : -1;\n        if (array_key_exists($balance, $firstAt)) {\n            $len = $i - $firstAt[$balance];\n            if ($len > $best) $best = $len;\n        } else {\n            $firstAt[$balance] = $i;\n        }\n    }\n    return $best;\n}`,

        ruby: `def findMaxLength(nums)\n  first_at = { 0 => -1 }\n  balance = 0\n  best = 0\n  nums.each_with_index do |x, i|\n    balance += x == 1 ? 1 : -1\n    if first_at.key?(balance)\n      len = i - first_at[balance]\n      best = len if len > best\n    else\n      first_at[balance] = i\n    end\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Continuous Subarray Sum ─────────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const firstAt = new Map<number, number>();
      firstAt.set(0, -1);
      let sum = 0;
      for (let i = 0; i < nums.length; i++) {
        sum += nums[i];
        const r = ((sum % k) + k) % k;
        if (firstAt.has(r)) {
          if (i - firstAt.get(r)! >= 2) return true;
        } else {
          firstAt.set(r, i);
        }
      }
      return false;
    };
    return {
      slug: "continuous-subarray-sum",
      title: "Continuous Subarray Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Math", "Prefix Sum", "Meta", "Google", "Amazon"],
      signature: { funcName: "checkSubarraySum", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given an integer array `nums` and an integer `k`, return `true` if `nums` has a **good subarray**.\n\nA good subarray has length **at least two** and a sum that is a multiple of `k`. Note that `0` is always a multiple of `k`.",
        [
          { in: "nums = [23,2,4,6,7], k = 6", out: "true", note: "[2,4] sums to 6." },
          { in: "nums = [23,2,6,4,7], k = 13", out: "false" },
          { in: "nums = [1,0], k = 2", out: "false", note: "The only length-2 subarray sums to 1." },
        ],
        ["1 <= nums.length <= 40", "0 <= nums[i] <= 1000", "1 <= k <= 100"]),
      hints: [
        "A subarray sum is a multiple of `k` exactly when its two bounding prefix sums share the same remainder mod `k`.",
        "Store the earliest index at which each remainder appears.",
        "Enforce the length rule by requiring the two indices to be at least two apart.",
      ],
      examples: [
        { input: "[23,2,4,6,7]\n6", expectedOutput: "true" },
        { input: "[23,2,6,4,7]\n13", expectedOutput: "false" },
        { input: "[1,0]\n2", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 0, rng() < 0.5 ? 12 : 1000);
        const k = ri(rng, 1, 100);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: bool(ref(nums, k)) };
      },
      solutions: {
        python: `def checkSubarraySum(nums, k: int) -> bool:\n    first = {0: -1}\n    total = 0\n    for i, x in enumerate(nums):\n        total += x\n        r = total % k\n        if r in first:\n            if i - first[r] >= 2:\n                return True\n        else:\n            first[r] = i\n    return False`,
        javascript: `var checkSubarraySum = function(nums, k) {\n    const firstAt = new Map();\n    firstAt.set(0, -1);\n    let sum = 0;\n    for (let i = 0; i < nums.length; i++) {\n        sum += nums[i];\n        const r = ((sum % k) + k) % k;\n        if (firstAt.has(r)) {\n            if (i - firstAt.get(r) >= 2) return true;\n        } else {\n            firstAt.set(r, i);\n        }\n    }\n    return false;\n};`,

        typescript: `function checkSubarraySum(nums: number[], k: number): boolean {\n    var firstAt: { [key: string]: number } = {};\n    firstAt["0"] = -1;\n    var sum = 0;\n    for (var i = 0; i < nums.length; i++) {\n        sum += nums[i];\n        var r = ((sum % k) + k) % k;\n        var key = String(r);\n        if (firstAt[key] !== undefined) {\n            if (i - firstAt[key] >= 2) return true;\n        } else {\n            firstAt[key] = i;\n        }\n    }\n    return false;\n}`,

        java: `public static boolean checkSubarraySum(int[] nums, int k) {\n    Map<Integer, Integer> firstAt = new HashMap<>();\n    firstAt.put(0, -1);\n    int sum = 0;\n    for (int i = 0; i < nums.length; i++) {\n        sum += nums[i];\n        int r = ((sum % k) + k) % k;\n        Integer seen = firstAt.get(r);\n        if (seen != null) {\n            if (i - seen >= 2) return true;\n        } else {\n            firstAt.put(r, i);\n        }\n    }\n    return false;\n}`,

        cpp: `bool checkSubarraySum(vector<int>& nums, int k) {\n    unordered_map<int, int> firstAt;\n    firstAt[0] = -1;\n    int sum = 0;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        sum += nums[i];\n        int r = ((sum % k) + k) % k;\n        if (firstAt.count(r)) {\n            if (i - firstAt[r] >= 2) return true;\n        } else {\n            firstAt[r] = i;\n        }\n    }\n    return false;\n}`,

        c: `bool checkSubarraySum(int* nums, int numsSize, int k) {\n    int* firstAt = (int*) malloc(sizeof(int) * k);\n    for (int i = 0; i < k; i++) firstAt[i] = -2;\n    firstAt[0] = -1;\n    int sum = 0;\n    bool found = false;\n    for (int i = 0; i < numsSize; i++) {\n        sum += nums[i];\n        int r = ((sum % k) + k) % k;\n        if (firstAt[r] != -2) {\n            if (i - firstAt[r] >= 2) { found = true; break; }\n        } else {\n            firstAt[r] = i;\n        }\n    }\n    free(firstAt);\n    return found;\n}`,

        csharp: `public static bool CheckSubarraySum(int[] nums, int k)\n{\n    var firstAt = new Dictionary<int, int>();\n    firstAt[0] = -1;\n    int sum = 0;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        sum += nums[i];\n        int r = ((sum % k) + k) % k;\n        if (firstAt.ContainsKey(r))\n        {\n            if (i - firstAt[r] >= 2) return true;\n        }\n        else\n        {\n            firstAt[r] = i;\n        }\n    }\n    return false;\n}`,

        go: `func checkSubarraySum(nums []int, k int) bool {\n	firstAt := map[int]int{0: -1}\n	sum := 0\n	for i, x := range nums {\n		sum += x\n		r := ((sum % k) + k) % k\n		if seen, ok := firstAt[r]; ok {\n			if i-seen >= 2 {\n				return true\n			}\n		} else {\n			firstAt[r] = i\n		}\n	}\n	return false\n}`,

        kotlin: `fun checkSubarraySum(nums: IntArray, k: Int): Boolean {\n    val firstAt = HashMap<Int, Int>()\n    firstAt[0] = -1\n    var sum = 0\n    for (i in nums.indices) {\n        sum += nums[i]\n        val r = ((sum % k) + k) % k\n        val seen = firstAt[r]\n        if (seen != null) {\n            if (i - seen >= 2) return true\n        } else {\n            firstAt[r] = i\n        }\n    }\n    return false\n}`,

        swift: `func checkSubarraySum(_ nums: [Int], _ k: Int) -> Bool {\n    var firstAt: [Int: Int] = [0: -1]\n    var sum = 0\n    for i in 0..<nums.count {\n        sum += nums[i]\n        let r = ((sum % k) + k) % k\n        if let seen = firstAt[r] {\n            if i - seen >= 2 { return true }\n        } else {\n            firstAt[r] = i\n        }\n    }\n    return false\n}`,

        rust: `fn checkSubarraySum(nums: Vec<i32>, k: i32) -> bool {\n    use std::collections::HashMap;\n    let mut first_at: HashMap<i32, i32> = HashMap::new();\n    first_at.insert(0, -1);\n    let mut sum = 0;\n    for i in 0..nums.len() {\n        sum += nums[i];\n        let r = ((sum % k) + k) % k;\n        let idx = i as i32;\n        match first_at.get(&r) {\n            Some(seen) => {\n                if idx - *seen >= 2 {\n                    return true;\n                }\n            }\n            None => {\n                first_at.insert(r, idx);\n            }\n        }\n    }\n    false\n}`,

        php: `function checkSubarraySum($nums, $k) {\n    $firstAt = array(0 => -1);\n    $sum = 0;\n    $n = count($nums);\n    for ($i = 0; $i < $n; $i++) {\n        $sum += $nums[$i];\n        $r = (($sum % $k) + $k) % $k;\n        if (array_key_exists($r, $firstAt)) {\n            if ($i - $firstAt[$r] >= 2) return true;\n        } else {\n            $firstAt[$r] = $i;\n        }\n    }\n    return false;\n}`,

        ruby: `def checkSubarraySum(nums, k)\n  first_at = { 0 => -1 }\n  sum = 0\n  nums.each_with_index do |x, i|\n    sum += x\n    r = sum % k\n    if first_at.key?(r)\n      return true if i - first_at[r] >= 2\n    else\n      first_at[r] = i\n    end\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Longest Subarray of 1's After Deleting One Element ──────────
  (() => {
    const ref = (nums: number[]) => {
      let left = 0, zeros = 0, best = 0;
      for (let right = 0; right < nums.length; right++) {
        if (nums[right] === 0) zeros++;
        while (zeros > 1) { if (nums[left] === 0) zeros--; left++; }
        const len = right - left;
        if (len > best) best = len;
      }
      return best;
    };
    return {
      slug: "longest-subarray-of-1s-after-deleting-one-element",
      title: "Longest Subarray of 1's After Deleting One Element",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Dynamic Programming", "Sliding Window", "Amazon", "Google", "Microsoft"],
      signature: { funcName: "longestSubarray", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given a binary array `nums`, you must delete **exactly one** element from it.\n\nReturn the size of the longest non-empty subarray of 1s in the resulting array. If no such subarray exists, return `0`.",
        [
          { in: "nums = [1,1,0,1]", out: "3", note: "Deleting the 0 leaves [1,1,1]." },
          { in: "nums = [0,1,1,1,0,1,1,0,1]", out: "5" },
          { in: "nums = [1,1,1]", out: "2", note: "One element must be deleted even though the array is all 1s." },
        ],
        ["1 <= nums.length <= 40", "nums[i] is either 0 or 1."]),
      hints: [
        "Slide a window that is allowed to contain at most one zero.",
        "The answer for a window is its length **minus one** — the deleted element, whether it is the zero or a spare 1.",
        "That `- 1` is what makes the all-ones case come out right.",
      ],
      examples: [
        { input: "[1,1,0,1]", expectedOutput: "3" },
        { input: "[0,1,1,1,0,1,1,0,1]", expectedOutput: "5" },
        { input: "[1,1,1]", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 40) }, () => (rng() < 0.7 ? 1 : 0));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def longestSubarray(nums) -> int:\n    left = zeros = best = 0\n    for right, x in enumerate(nums):\n        if x == 0:\n            zeros += 1\n        while zeros > 1:\n            if nums[left] == 0:\n                zeros -= 1\n            left += 1\n        best = max(best, right - left)\n    return best`,
        javascript: `var longestSubarray = function(nums) {\n    let left = 0, zeros = 0, best = 0;\n    for (let right = 0; right < nums.length; right++) {\n        if (nums[right] === 0) zeros++;\n        while (zeros > 1) {\n            if (nums[left] === 0) zeros--;\n            left++;\n        }\n        const len = right - left;\n        if (len > best) best = len;\n    }\n    return best;\n};`,

        typescript: `function longestSubarray(nums: number[]): number {\n    var left = 0;\n    var zeros = 0;\n    var best = 0;\n    for (var right = 0; right < nums.length; right++) {\n        if (nums[right] === 0) zeros++;\n        while (zeros > 1) {\n            if (nums[left] === 0) zeros--;\n            left++;\n        }\n        var len = right - left;\n        if (len > best) best = len;\n    }\n    return best;\n}`,

        java: `public static int longestSubarray(int[] nums) {\n    int left = 0, zeros = 0, best = 0;\n    for (int right = 0; right < nums.length; right++) {\n        if (nums[right] == 0) zeros++;\n        while (zeros > 1) {\n            if (nums[left] == 0) zeros--;\n            left++;\n        }\n        best = Math.max(best, right - left);\n    }\n    return best;\n}`,

        cpp: `int longestSubarray(vector<int>& nums) {\n    int left = 0, zeros = 0, best = 0;\n    for (int right = 0; right < (int) nums.size(); right++) {\n        if (nums[right] == 0) zeros++;\n        while (zeros > 1) {\n            if (nums[left] == 0) zeros--;\n            left++;\n        }\n        best = max(best, right - left);\n    }\n    return best;\n}`,

        c: `int longestSubarray(int* nums, int numsSize) {\n    int left = 0, zeros = 0, best = 0;\n    for (int right = 0; right < numsSize; right++) {\n        if (nums[right] == 0) zeros++;\n        while (zeros > 1) {\n            if (nums[left] == 0) zeros--;\n            left++;\n        }\n        int len = right - left;\n        if (len > best) best = len;\n    }\n    return best;\n}`,

        csharp: `public static int LongestSubarray(int[] nums)\n{\n    int left = 0, zeros = 0, best = 0;\n    for (int right = 0; right < nums.Length; right++)\n    {\n        if (nums[right] == 0) zeros++;\n        while (zeros > 1)\n        {\n            if (nums[left] == 0) zeros--;\n            left++;\n        }\n        best = Math.Max(best, right - left);\n    }\n    return best;\n}`,

        go: `func longestSubarray(nums []int) int {\n	left, zeros, best := 0, 0, 0\n	for right := 0; right < len(nums); right++ {\n		if nums[right] == 0 {\n			zeros++\n		}\n		for zeros > 1 {\n			if nums[left] == 0 {\n				zeros--\n			}\n			left++\n		}\n		if right-left > best {\n			best = right - left\n		}\n	}\n	return best\n}`,

        kotlin: `fun longestSubarray(nums: IntArray): Int {\n    var left = 0\n    var zeros = 0\n    var best = 0\n    for (right in nums.indices) {\n        if (nums[right] == 0) zeros++\n        while (zeros > 1) {\n            if (nums[left] == 0) zeros--\n            left++\n        }\n        if (right - left > best) best = right - left\n    }\n    return best\n}`,

        swift: `func longestSubarray(_ nums: [Int]) -> Int {\n    var left = 0\n    var zeros = 0\n    var best = 0\n    for right in 0..<nums.count {\n        if nums[right] == 0 { zeros += 1 }\n        while zeros > 1 {\n            if nums[left] == 0 { zeros -= 1 }\n            left += 1\n        }\n        if right - left > best { best = right - left }\n    }\n    return best\n}`,

        rust: `fn longestSubarray(nums: Vec<i32>) -> i32 {\n    let mut left = 0usize;\n    let mut zeros = 0;\n    let mut best = 0usize;\n    for right in 0..nums.len() {\n        if nums[right] == 0 {\n            zeros += 1;\n        }\n        while zeros > 1 {\n            if nums[left] == 0 {\n                zeros -= 1;\n            }\n            left += 1;\n        }\n        if right - left > best {\n            best = right - left;\n        }\n    }\n    best as i32\n}`,

        php: `function longestSubarray($nums) {\n    $left = 0;\n    $zeros = 0;\n    $best = 0;\n    $n = count($nums);\n    for ($right = 0; $right < $n; $right++) {\n        if ($nums[$right] === 0) $zeros++;\n        while ($zeros > 1) {\n            if ($nums[$left] === 0) $zeros--;\n            $left++;\n        }\n        $len = $right - $left;\n        if ($len > $best) $best = $len;\n    }\n    return $best;\n}`,

        ruby: `def longestSubarray(nums)\n  left = 0\n  zeros = 0\n  best = 0\n  nums.each_with_index do |x, right|\n    zeros += 1 if x == 0\n    while zeros > 1\n      zeros -= 1 if nums[left] == 0\n      left += 1\n    end\n    best = right - left if right - left > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Minimum Operations to Reduce X to Zero ──────────────────────
  (() => {
    const ref = (nums: number[], x: number) => {
      let total = 0;
      for (let i = 0; i < nums.length; i++) total += nums[i];
      const target = total - x;
      if (target < 0) return -1;
      if (target === 0) return nums.length;
      let left = 0, sum = 0, best = -1;
      for (let right = 0; right < nums.length; right++) {
        sum += nums[right];
        while (sum > target && left <= right) { sum -= nums[left]; left++; }
        if (sum === target) {
          const len = right - left + 1;
          if (len > best) best = len;
        }
      }
      return best === -1 ? -1 : nums.length - best;
    };
    return {
      slug: "minimum-operations-to-reduce-x-to-zero",
      title: "Minimum Operations to Reduce X to Zero",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Binary Search", "Sliding Window", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "minOperations", params: [{ name: "nums", type: "int[]" as const }, { name: "x", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an integer array `nums` and an integer `x`. In one operation you remove either the **leftmost** or the **rightmost** element of `nums` and subtract its value from `x`.\n\nReturn the **minimum** number of operations that reduces `x` to exactly `0`, or `-1` if that is impossible.",
        [
          { in: "nums = [1,1,4,2,3], x = 5", out: "2", note: "Remove the last two elements: 3 + 2 = 5." },
          { in: "nums = [5,6,7,8,9], x = 4", out: "-1" },
          { in: "nums = [3,2,20,1,1,3], x = 10", out: "5", note: "Remove 3, 2 from the front and 3, 1, 1 from the back." },
        ],
        ["1 <= nums.length <= 40", "1 <= nums[i] <= 100", "1 <= x <= 1000000"]),
      hints: [
        "Removing from both ends leaves a **contiguous middle**. Flip the problem around and look at what stays.",
        "The kept middle must sum to `total - x`; minimising removals means maximising that middle's length.",
        "All values are positive, so a sliding window finds the longest subarray with a given sum in one pass.",
      ],
      examples: [
        { input: "[1,1,4,2,3]\n5", expectedOutput: "2" },
        { input: "[5,6,7,8,9]\n4", expectedOutput: "-1" },
        { input: "[3,2,20,1,1,3]\n10", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 1, 100);
        let x: number;
        if (rng() < 0.5) {
          const take = ri(rng, 0, nums.length);
          x = 0;
          for (let i = 0; i < take; i++) x += nums[i];
          if (x === 0) x = ri(rng, 1, 200);
        } else {
          x = ri(rng, 1, 500);
        }
        return { input: `${fmtIntArr(nums)}\n${x}`, expectedOutput: String(ref(nums, x)) };
      },
      solutions: {
        python: `def minOperations(nums, x: int) -> int:\n    target = sum(nums) - x\n    if target < 0:\n        return -1\n    if target == 0:\n        return len(nums)\n    left = total = 0\n    best = -1\n    for right, value in enumerate(nums):\n        total += value\n        while total > target and left <= right:\n            total -= nums[left]\n            left += 1\n        if total == target:\n            best = max(best, right - left + 1)\n    return -1 if best == -1 else len(nums) - best`,
        javascript: `var minOperations = function(nums, x) {\n    let total = 0;\n    for (let i = 0; i < nums.length; i++) total += nums[i];\n    const target = total - x;\n    if (target < 0) return -1;\n    if (target === 0) return nums.length;\n    let left = 0, sum = 0, best = -1;\n    for (let right = 0; right < nums.length; right++) {\n        sum += nums[right];\n        while (sum > target && left <= right) {\n            sum -= nums[left];\n            left++;\n        }\n        if (sum === target) {\n            const len = right - left + 1;\n            if (len > best) best = len;\n        }\n    }\n    return best === -1 ? -1 : nums.length - best;\n};`,

        typescript: `function minOperations(nums: number[], x: number): number {\n    var total = 0;\n    for (var i = 0; i < nums.length; i++) total += nums[i];\n    var target = total - x;\n    if (target < 0) return -1;\n    if (target === 0) return nums.length;\n    var left = 0;\n    var sum = 0;\n    var best = -1;\n    for (var right = 0; right < nums.length; right++) {\n        sum += nums[right];\n        while (sum > target && left <= right) {\n            sum -= nums[left];\n            left++;\n        }\n        if (sum === target) {\n            var len = right - left + 1;\n            if (len > best) best = len;\n        }\n    }\n    return best === -1 ? -1 : nums.length - best;\n}`,

        java: `public static int minOperations(int[] nums, int x) {\n    int total = 0;\n    for (int v : nums) total += v;\n    int target = total - x;\n    if (target < 0) return -1;\n    if (target == 0) return nums.length;\n    int left = 0, sum = 0, best = -1;\n    for (int right = 0; right < nums.length; right++) {\n        sum += nums[right];\n        while (sum > target && left <= right) {\n            sum -= nums[left];\n            left++;\n        }\n        if (sum == target) best = Math.max(best, right - left + 1);\n    }\n    return best == -1 ? -1 : nums.length - best;\n}`,

        cpp: `int minOperations(vector<int>& nums, int x) {\n    int total = 0;\n    for (int v : nums) total += v;\n    int target = total - x;\n    if (target < 0) return -1;\n    if (target == 0) return (int) nums.size();\n    int left = 0, sum = 0, best = -1;\n    for (int right = 0; right < (int) nums.size(); right++) {\n        sum += nums[right];\n        while (sum > target && left <= right) {\n            sum -= nums[left];\n            left++;\n        }\n        if (sum == target) best = max(best, right - left + 1);\n    }\n    return best == -1 ? -1 : (int) nums.size() - best;\n}`,

        c: `int minOperations(int* nums, int numsSize, int x) {\n    int total = 0;\n    for (int i = 0; i < numsSize; i++) total += nums[i];\n    int target = total - x;\n    if (target < 0) return -1;\n    if (target == 0) return numsSize;\n    int left = 0, sum = 0, best = -1;\n    for (int right = 0; right < numsSize; right++) {\n        sum += nums[right];\n        while (sum > target && left <= right) {\n            sum -= nums[left];\n            left++;\n        }\n        if (sum == target) {\n            int len = right - left + 1;\n            if (len > best) best = len;\n        }\n    }\n    return best == -1 ? -1 : numsSize - best;\n}`,

        csharp: `public static int MinOperations(int[] nums, int x)\n{\n    int total = 0;\n    foreach (int v in nums) total += v;\n    int target = total - x;\n    if (target < 0) return -1;\n    if (target == 0) return nums.Length;\n    int left = 0, sum = 0, best = -1;\n    for (int right = 0; right < nums.Length; right++)\n    {\n        sum += nums[right];\n        while (sum > target && left <= right)\n        {\n            sum -= nums[left];\n            left++;\n        }\n        if (sum == target) best = Math.Max(best, right - left + 1);\n    }\n    return best == -1 ? -1 : nums.Length - best;\n}`,

        go: `func minOperations(nums []int, x int) int {\n	total := 0\n	for _, v := range nums {\n		total += v\n	}\n	target := total - x\n	if target < 0 {\n		return -1\n	}\n	if target == 0 {\n		return len(nums)\n	}\n	left, sum, best := 0, 0, -1\n	for right := 0; right < len(nums); right++ {\n		sum += nums[right]\n		for sum > target && left <= right {\n			sum -= nums[left]\n			left++\n		}\n		if sum == target && right-left+1 > best {\n			best = right - left + 1\n		}\n	}\n	if best == -1 {\n		return -1\n	}\n	return len(nums) - best\n}`,

        kotlin: `fun minOperations(nums: IntArray, x: Int): Int {\n    var total = 0\n    for (v in nums) total += v\n    val target = total - x\n    if (target < 0) return -1\n    if (target == 0) return nums.size\n    var left = 0\n    var sum = 0\n    var best = -1\n    for (right in nums.indices) {\n        sum += nums[right]\n        while (sum > target && left <= right) {\n            sum -= nums[left]\n            left++\n        }\n        if (sum == target && right - left + 1 > best) best = right - left + 1\n    }\n    return if (best == -1) -1 else nums.size - best\n}`,

        swift: `func minOperations(_ nums: [Int], _ x: Int) -> Int {\n    var total = 0\n    for v in nums { total += v }\n    let target = total - x\n    if target < 0 { return -1 }\n    if target == 0 { return nums.count }\n    var left = 0\n    var sum = 0\n    var best = -1\n    for right in 0..<nums.count {\n        sum += nums[right]\n        while sum > target && left <= right {\n            sum -= nums[left]\n            left += 1\n        }\n        if sum == target && right - left + 1 > best { best = right - left + 1 }\n    }\n    return best == -1 ? -1 : nums.count - best\n}`,

        rust: `fn minOperations(nums: Vec<i32>, x: i32) -> i32 {\n    let total: i32 = nums.iter().sum();\n    let target = total - x;\n    if target < 0 {\n        return -1;\n    }\n    if target == 0 {\n        return nums.len() as i32;\n    }\n    let mut left = 0usize;\n    let mut sum = 0;\n    let mut best: i32 = -1;\n    for right in 0..nums.len() {\n        sum += nums[right];\n        while sum > target && left <= right {\n            sum -= nums[left];\n            left += 1;\n        }\n        if sum == target {\n            let len = (right - left + 1) as i32;\n            if len > best {\n                best = len;\n            }\n        }\n    }\n    if best == -1 {\n        -1\n    } else {\n        nums.len() as i32 - best\n    }\n}`,

        php: `function minOperations($nums, $x) {\n    $total = array_sum($nums);\n    $target = $total - $x;\n    if ($target < 0) return -1;\n    $n = count($nums);\n    if ($target === 0) return $n;\n    $left = 0;\n    $sum = 0;\n    $best = -1;\n    for ($right = 0; $right < $n; $right++) {\n        $sum += $nums[$right];\n        while ($sum > $target && $left <= $right) {\n            $sum -= $nums[$left];\n            $left++;\n        }\n        if ($sum === $target) {\n            $len = $right - $left + 1;\n            if ($len > $best) $best = $len;\n        }\n    }\n    return $best === -1 ? -1 : $n - $best;\n}`,

        ruby: `def minOperations(nums, x)\n  total = nums.sum\n  target = total - x\n  return -1 if target < 0\n  return nums.length if target == 0\n  left = 0\n  sum = 0\n  best = -1\n  nums.each_with_index do |v, right|\n    sum += v\n    while sum > target && left <= right\n      sum -= nums[left]\n      left += 1\n    end\n    if sum == target\n      len = right - left + 1\n      best = len if len > best\n    end\n  end\n  best == -1 ? -1 : nums.length - best\nend`,
      },
    };
  })(),

  // ── Maximum Erasure Value ───────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const inWindow = new Set<number>();
      let left = 0, sum = 0, best = 0;
      for (let right = 0; right < nums.length; right++) {
        while (inWindow.has(nums[right])) { inWindow.delete(nums[left]); sum -= nums[left]; left++; }
        inWindow.add(nums[right]);
        sum += nums[right];
        if (sum > best) best = sum;
      }
      return best;
    };
    return {
      slug: "maximum-erasure-value",
      title: "Maximum Erasure Value",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sliding Window", "Amazon", "Google"],
      signature: { funcName: "maximumUniqueSubarray", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array of positive integers `nums`. Erase one subarray in which **all elements are distinct**, and score the sum of its elements.\n\nReturn the maximum score obtainable.",
        [
          { in: "nums = [4,2,4,5,6]", out: "17", note: "The best distinct subarray is [4,5,6]." },
          { in: "nums = [5,2,1,2,5,2,1,2,5]", out: "8", note: "Either [5,2,1] or [1,2,5]." },
          { in: "nums = [7]", out: "7" },
        ],
        ["1 <= nums.length <= 40", "1 <= nums[i] <= 1000"]),
      hints: [
        "This is the longest-substring-without-repeats window, scored by sum instead of by length.",
        "Keep the window's values in a hash set and its running sum alongside.",
        "When the entering value is already inside, shrink from the left until the duplicate is gone.",
      ],
      examples: [
        { input: "[4,2,4,5,6]", expectedOutput: "17" },
        { input: "[5,2,1,2,5,2,1,2,5]", expectedOutput: "8" },
        { input: "[7]", expectedOutput: "7" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 1, rng() < 0.6 ? 10 : 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def maximumUniqueSubarray(nums) -> int:\n    seen = set()\n    left = total = best = 0\n    for right, x in enumerate(nums):\n        while x in seen:\n            seen.discard(nums[left])\n            total -= nums[left]\n            left += 1\n        seen.add(x)\n        total += x\n        best = max(best, total)\n    return best`,
        javascript: `var maximumUniqueSubarray = function(nums) {\n    const inWindow = new Set();\n    let left = 0, sum = 0, best = 0;\n    for (let right = 0; right < nums.length; right++) {\n        while (inWindow.has(nums[right])) {\n            inWindow.delete(nums[left]);\n            sum -= nums[left];\n            left++;\n        }\n        inWindow.add(nums[right]);\n        sum += nums[right];\n        if (sum > best) best = sum;\n    }\n    return best;\n};`,

        typescript: `function maximumUniqueSubarray(nums: number[]): number {\n    var inWindow: { [key: string]: boolean } = {};\n    var left = 0;\n    var sum = 0;\n    var best = 0;\n    for (var right = 0; right < nums.length; right++) {\n        while (inWindow[String(nums[right])] === true) {\n            inWindow[String(nums[left])] = false;\n            sum -= nums[left];\n            left++;\n        }\n        inWindow[String(nums[right])] = true;\n        sum += nums[right];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,

        java: `public static int maximumUniqueSubarray(int[] nums) {\n    Set<Integer> inWindow = new HashSet<>();\n    int left = 0, sum = 0, best = 0;\n    for (int right = 0; right < nums.length; right++) {\n        while (inWindow.contains(nums[right])) {\n            inWindow.remove(nums[left]);\n            sum -= nums[left];\n            left++;\n        }\n        inWindow.add(nums[right]);\n        sum += nums[right];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,

        cpp: `int maximumUniqueSubarray(vector<int>& nums) {\n    unordered_set<int> inWindow;\n    int left = 0, sum = 0, best = 0;\n    for (int right = 0; right < (int) nums.size(); right++) {\n        while (inWindow.count(nums[right])) {\n            inWindow.erase(nums[left]);\n            sum -= nums[left];\n            left++;\n        }\n        inWindow.insert(nums[right]);\n        sum += nums[right];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,

        c: `int maximumUniqueSubarray(int* nums, int numsSize) {\n    bool inWindow[1001];\n    for (int i = 0; i <= 1000; i++) inWindow[i] = false;\n    int left = 0, sum = 0, best = 0;\n    for (int right = 0; right < numsSize; right++) {\n        while (inWindow[nums[right]]) {\n            inWindow[nums[left]] = false;\n            sum -= nums[left];\n            left++;\n        }\n        inWindow[nums[right]] = true;\n        sum += nums[right];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,

        csharp: `public static int MaximumUniqueSubarray(int[] nums)\n{\n    var inWindow = new HashSet<int>();\n    int left = 0, sum = 0, best = 0;\n    for (int right = 0; right < nums.Length; right++)\n    {\n        while (inWindow.Contains(nums[right]))\n        {\n            inWindow.Remove(nums[left]);\n            sum -= nums[left];\n            left++;\n        }\n        inWindow.Add(nums[right]);\n        sum += nums[right];\n        if (sum > best) best = sum;\n    }\n    return best;\n}`,

        go: `func maximumUniqueSubarray(nums []int) int {\n	inWindow := make(map[int]bool)\n	left, sum, best := 0, 0, 0\n	for right := 0; right < len(nums); right++ {\n		for inWindow[nums[right]] {\n			inWindow[nums[left]] = false\n			sum -= nums[left]\n			left++\n		}\n		inWindow[nums[right]] = true\n		sum += nums[right]\n		if sum > best {\n			best = sum\n		}\n	}\n	return best\n}`,

        kotlin: `fun maximumUniqueSubarray(nums: IntArray): Int {\n    val inWindow = HashSet<Int>()\n    var left = 0\n    var sum = 0\n    var best = 0\n    for (right in nums.indices) {\n        while (inWindow.contains(nums[right])) {\n            inWindow.remove(nums[left])\n            sum -= nums[left]\n            left++\n        }\n        inWindow.add(nums[right])\n        sum += nums[right]\n        if (sum > best) best = sum\n    }\n    return best\n}`,

        swift: `func maximumUniqueSubarray(_ nums: [Int]) -> Int {\n    var inWindow = Set<Int>()\n    var left = 0\n    var sum = 0\n    var best = 0\n    for right in 0..<nums.count {\n        while inWindow.contains(nums[right]) {\n            inWindow.remove(nums[left])\n            sum -= nums[left]\n            left += 1\n        }\n        inWindow.insert(nums[right])\n        sum += nums[right]\n        if sum > best { best = sum }\n    }\n    return best\n}`,

        rust: `fn maximumUniqueSubarray(nums: Vec<i32>) -> i32 {\n    use std::collections::HashSet;\n    let mut in_window: HashSet<i32> = HashSet::new();\n    let mut left = 0usize;\n    let mut sum = 0;\n    let mut best = 0;\n    for right in 0..nums.len() {\n        while in_window.contains(&nums[right]) {\n            in_window.remove(&nums[left]);\n            sum -= nums[left];\n            left += 1;\n        }\n        in_window.insert(nums[right]);\n        sum += nums[right];\n        if sum > best {\n            best = sum;\n        }\n    }\n    best\n}`,

        php: `function maximumUniqueSubarray($nums) {\n    $inWindow = array();\n    $left = 0;\n    $sum = 0;\n    $best = 0;\n    $n = count($nums);\n    for ($right = 0; $right < $n; $right++) {\n        while (isset($inWindow[$nums[$right]])) {\n            unset($inWindow[$nums[$left]]);\n            $sum -= $nums[$left];\n            $left++;\n        }\n        $inWindow[$nums[$right]] = true;\n        $sum += $nums[$right];\n        if ($sum > $best) $best = $sum;\n    }\n    return $best;\n}`,

        ruby: `def maximumUniqueSubarray(nums)\n  in_window = {}\n  left = 0\n  sum = 0\n  best = 0\n  nums.each_with_index do |x, right|\n    while in_window[x]\n      in_window.delete(nums[left])\n      sum -= nums[left]\n      left += 1\n    end\n    in_window[x] = true\n    sum += x\n    best = sum if sum > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Binary Subarrays With Sum ───────────────────────────────────
  (() => {
    const ref = (nums: number[], goal: number) => {
      const count = new Map<number, number>();
      count.set(0, 1);
      let sum = 0, total = 0;
      for (let i = 0; i < nums.length; i++) {
        sum += nums[i];
        total += count.get(sum - goal) ?? 0;
        count.set(sum, (count.get(sum) ?? 0) + 1);
      }
      return total;
    };
    return {
      slug: "binary-subarrays-with-sum",
      title: "Binary Subarrays With Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sliding Window", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "numSubarraysWithSum", params: [{ name: "nums", type: "int[]" as const }, { name: "goal", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given a binary array `nums` and an integer `goal`, return the number of non-empty subarrays whose sum equals `goal`.",
        [
          { in: "nums = [1,0,1,0,1], goal = 2", out: "4", note: "The four subarrays are [1,0,1,_,_], [1,0,1,0,_], [_,0,1,0,1] and [_,_,1,0,1]." },
          { in: "nums = [0,0,0,0,0], goal = 0", out: "15", note: "Every one of the 15 subarrays sums to zero." },
          { in: "nums = [1,1], goal = 1", out: "2" },
        ],
        ["1 <= nums.length <= 40", "nums[i] is 0 or 1.", "0 <= goal <= nums.length"],
        "The zeros make a plain sliding window awkward. What does a prefix-sum hash map give you?"),
      hints: [
        "Count prefix sums: a subarray summing to `goal` ends at `i` for every earlier prefix equal to `prefix[i] - goal`.",
        "Seed the map with `{0: 1}` so subarrays starting at index 0 are counted.",
        "The runs of zeros are exactly why the counting approach beats a two-pointer window here.",
      ],
      examples: [
        { input: "[1,0,1,0,1]\n2", expectedOutput: "4" },
        { input: "[0,0,0,0,0]\n0", expectedOutput: "15" },
        { input: "[1,1]\n1", expectedOutput: "2" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nums = Array.from({ length: n }, () => (rng() < 0.5 ? 0 : 1));
        const goal = ri(rng, 0, n);
        return { input: `${fmtIntArr(nums)}\n${goal}`, expectedOutput: String(ref(nums, goal)) };
      },
      solutions: {
        python: `def numSubarraysWithSum(nums, goal: int) -> int:\n    count = {0: 1}\n    total = answer = 0\n    for x in nums:\n        total += x\n        answer += count.get(total - goal, 0)\n        count[total] = count.get(total, 0) + 1\n    return answer`,
        javascript: `var numSubarraysWithSum = function(nums, goal) {\n    const count = new Map();\n    count.set(0, 1);\n    let sum = 0, total = 0;\n    for (let i = 0; i < nums.length; i++) {\n        sum += nums[i];\n        total += count.get(sum - goal) || 0;\n        count.set(sum, (count.get(sum) || 0) + 1);\n    }\n    return total;\n};`,

        typescript: `function numSubarraysWithSum(nums: number[], goal: number): number {\n    var count: { [key: string]: number } = {};\n    count["0"] = 1;\n    var sum = 0;\n    var total = 0;\n    for (var i = 0; i < nums.length; i++) {\n        sum += nums[i];\n        var wanted = String(sum - goal);\n        if (count[wanted] !== undefined) total += count[wanted];\n        var key = String(sum);\n        count[key] = (count[key] === undefined ? 0 : count[key]) + 1;\n    }\n    return total;\n}`,

        java: `public static int numSubarraysWithSum(int[] nums, int goal) {\n    Map<Integer, Integer> count = new HashMap<>();\n    count.put(0, 1);\n    int sum = 0, total = 0;\n    for (int v : nums) {\n        sum += v;\n        total += count.getOrDefault(sum - goal, 0);\n        count.put(sum, count.getOrDefault(sum, 0) + 1);\n    }\n    return total;\n}`,

        cpp: `int numSubarraysWithSum(vector<int>& nums, int goal) {\n    unordered_map<int, int> count;\n    count[0] = 1;\n    int sum = 0, total = 0;\n    for (int v : nums) {\n        sum += v;\n        auto it = count.find(sum - goal);\n        if (it != count.end()) total += it->second;\n        count[sum]++;\n    }\n    return total;\n}`,

        c: `int numSubarraysWithSum(int* nums, int numsSize, int goal) {\n    int* count = (int*) calloc(numsSize + 1, sizeof(int));\n    count[0] = 1;\n    int sum = 0, total = 0;\n    for (int i = 0; i < numsSize; i++) {\n        sum += nums[i];\n        int wanted = sum - goal;\n        if (wanted >= 0 && wanted <= numsSize) total += count[wanted];\n        count[sum]++;\n    }\n    free(count);\n    return total;\n}`,

        csharp: `public static int NumSubarraysWithSum(int[] nums, int goal)\n{\n    var count = new Dictionary<int, int>();\n    count[0] = 1;\n    int sum = 0, total = 0;\n    foreach (int v in nums)\n    {\n        sum += v;\n        if (count.ContainsKey(sum - goal)) total += count[sum - goal];\n        count[sum] = count.ContainsKey(sum) ? count[sum] + 1 : 1;\n    }\n    return total;\n}`,

        go: `func numSubarraysWithSum(nums []int, goal int) int {\n	count := map[int]int{0: 1}\n	sum, total := 0, 0\n	for _, v := range nums {\n		sum += v\n		total += count[sum-goal]\n		count[sum]++\n	}\n	return total\n}`,

        kotlin: `fun numSubarraysWithSum(nums: IntArray, goal: Int): Int {\n    val count = HashMap<Int, Int>()\n    count[0] = 1\n    var sum = 0\n    var total = 0\n    for (v in nums) {\n        sum += v\n        total += count[sum - goal] ?: 0\n        count[sum] = (count[sum] ?: 0) + 1\n    }\n    return total\n}`,

        swift: `func numSubarraysWithSum(_ nums: [Int], _ goal: Int) -> Int {\n    var count: [Int: Int] = [0: 1]\n    var sum = 0\n    var total = 0\n    for v in nums {\n        sum += v\n        total += count[sum - goal] ?? 0\n        count[sum, default: 0] += 1\n    }\n    return total\n}`,

        rust: `fn numSubarraysWithSum(nums: Vec<i32>, goal: i32) -> i32 {\n    use std::collections::HashMap;\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    count.insert(0, 1);\n    let mut sum = 0;\n    let mut total = 0;\n    for v in nums.iter() {\n        sum += *v;\n        if let Some(c) = count.get(&(sum - goal)) {\n            total += *c;\n        }\n        *count.entry(sum).or_insert(0) += 1;\n    }\n    total\n}`,

        php: `function numSubarraysWithSum($nums, $goal) {\n    $count = array(0 => 1);\n    $sum = 0;\n    $total = 0;\n    foreach ($nums as $v) {\n        $sum += $v;\n        $wanted = $sum - $goal;\n        if (isset($count[$wanted])) $total += $count[$wanted];\n        $count[$sum] = isset($count[$sum]) ? $count[$sum] + 1 : 1;\n    }\n    return $total;\n}`,

        ruby: `def numSubarraysWithSum(nums, goal)\n  count = Hash.new(0)\n  count[0] = 1\n  sum = 0\n  total = 0\n  nums.each do |v|\n    sum += v\n    total += count[sum - goal]\n    count[sum] += 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Count Number of Nice Subarrays ──────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const count = new Map<number, number>();
      count.set(0, 1);
      let odds = 0, total = 0;
      for (let i = 0; i < nums.length; i++) {
        odds += nums[i] % 2;
        total += count.get(odds - k) ?? 0;
        count.set(odds, (count.get(odds) ?? 0) + 1);
      }
      return total;
    };
    return {
      slug: "count-number-of-nice-subarrays",
      title: "Count Number of Nice Subarrays",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Math", "Sliding Window", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "numberOfSubarrays", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an array of integers `nums` and an integer `k`, a subarray is **nice** if it contains exactly `k` odd numbers.\n\nReturn the number of nice subarrays.",
        [
          { in: "nums = [1,1,2,1,1], k = 3", out: "2", note: "The nice subarrays are [1,1,2,1] and [1,2,1,1]." },
          { in: "nums = [2,4,6], k = 1", out: "0", note: "There are no odd numbers at all." },
          { in: "nums = [2,2,2,1,2,2,1,2,2,2], k = 2", out: "16" },
        ],
        ["1 <= nums.length <= 40", "1 <= nums[i] <= 1000", "1 <= k <= nums.length"],
        "Replace every number by its parity and this becomes 'count subarrays with sum k'."),
      hints: [
        "The actual values do not matter — only whether each element is odd.",
        "Map odd to 1 and even to 0; a nice subarray is one summing to `k`.",
        "Then it is the standard prefix-count trick, seeded with `{0: 1}`.",
      ],
      examples: [
        { input: "[1,1,2,1,1]\n3", expectedOutput: "2" },
        { input: "[2,4,6]\n1", expectedOutput: "0" },
        { input: "[2,2,2,1,2,2,1,2,2,2]\n2", expectedOutput: "16" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nums = randArr(rng, n, 1, 1000);
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `def numberOfSubarrays(nums, k: int) -> int:\n    count = {0: 1}\n    odds = answer = 0\n    for x in nums:\n        odds += x % 2\n        answer += count.get(odds - k, 0)\n        count[odds] = count.get(odds, 0) + 1\n    return answer`,
        javascript: `var numberOfSubarrays = function(nums, k) {\n    const count = new Map();\n    count.set(0, 1);\n    let odds = 0, total = 0;\n    for (let i = 0; i < nums.length; i++) {\n        odds += nums[i] % 2;\n        total += count.get(odds - k) || 0;\n        count.set(odds, (count.get(odds) || 0) + 1);\n    }\n    return total;\n};`,

        typescript: `function numberOfSubarrays(nums: number[], k: number): number {\n    var count: { [key: string]: number } = {};\n    count["0"] = 1;\n    var odds = 0;\n    var total = 0;\n    for (var i = 0; i < nums.length; i++) {\n        odds += nums[i] % 2;\n        var wanted = String(odds - k);\n        if (count[wanted] !== undefined) total += count[wanted];\n        var key = String(odds);\n        count[key] = (count[key] === undefined ? 0 : count[key]) + 1;\n    }\n    return total;\n}`,

        java: `public static int numberOfSubarrays(int[] nums, int k) {\n    Map<Integer, Integer> count = new HashMap<>();\n    count.put(0, 1);\n    int odds = 0, total = 0;\n    for (int v : nums) {\n        odds += v % 2;\n        total += count.getOrDefault(odds - k, 0);\n        count.put(odds, count.getOrDefault(odds, 0) + 1);\n    }\n    return total;\n}`,

        cpp: `int numberOfSubarrays(vector<int>& nums, int k) {\n    unordered_map<int, int> count;\n    count[0] = 1;\n    int odds = 0, total = 0;\n    for (int v : nums) {\n        odds += v % 2;\n        auto it = count.find(odds - k);\n        if (it != count.end()) total += it->second;\n        count[odds]++;\n    }\n    return total;\n}`,

        c: `int numberOfSubarrays(int* nums, int numsSize, int k) {\n    int* count = (int*) calloc(numsSize + 1, sizeof(int));\n    count[0] = 1;\n    int odds = 0, total = 0;\n    for (int i = 0; i < numsSize; i++) {\n        odds += nums[i] % 2;\n        int wanted = odds - k;\n        if (wanted >= 0 && wanted <= numsSize) total += count[wanted];\n        count[odds]++;\n    }\n    free(count);\n    return total;\n}`,

        csharp: `public static int NumberOfSubarrays(int[] nums, int k)\n{\n    var count = new Dictionary<int, int>();\n    count[0] = 1;\n    int odds = 0, total = 0;\n    foreach (int v in nums)\n    {\n        odds += v % 2;\n        if (count.ContainsKey(odds - k)) total += count[odds - k];\n        count[odds] = count.ContainsKey(odds) ? count[odds] + 1 : 1;\n    }\n    return total;\n}`,

        go: `func numberOfSubarrays(nums []int, k int) int {\n	count := map[int]int{0: 1}\n	odds, total := 0, 0\n	for _, v := range nums {\n		odds += v % 2\n		total += count[odds-k]\n		count[odds]++\n	}\n	return total\n}`,

        kotlin: `fun numberOfSubarrays(nums: IntArray, k: Int): Int {\n    val count = HashMap<Int, Int>()\n    count[0] = 1\n    var odds = 0\n    var total = 0\n    for (v in nums) {\n        odds += v % 2\n        total += count[odds - k] ?: 0\n        count[odds] = (count[odds] ?: 0) + 1\n    }\n    return total\n}`,

        swift: `func numberOfSubarrays(_ nums: [Int], _ k: Int) -> Int {\n    var count: [Int: Int] = [0: 1]\n    var odds = 0\n    var total = 0\n    for v in nums {\n        odds += v % 2\n        total += count[odds - k] ?? 0\n        count[odds, default: 0] += 1\n    }\n    return total\n}`,

        rust: `fn numberOfSubarrays(nums: Vec<i32>, k: i32) -> i32 {\n    use std::collections::HashMap;\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    count.insert(0, 1);\n    let mut odds = 0;\n    let mut total = 0;\n    for v in nums.iter() {\n        odds += *v % 2;\n        if let Some(c) = count.get(&(odds - k)) {\n            total += *c;\n        }\n        *count.entry(odds).or_insert(0) += 1;\n    }\n    total\n}`,

        php: `function numberOfSubarrays($nums, $k) {\n    $count = array(0 => 1);\n    $odds = 0;\n    $total = 0;\n    foreach ($nums as $v) {\n        $odds += $v % 2;\n        $wanted = $odds - $k;\n        if (isset($count[$wanted])) $total += $count[$wanted];\n        $count[$odds] = isset($count[$odds]) ? $count[$odds] + 1 : 1;\n    }\n    return $total;\n}`,

        ruby: `def numberOfSubarrays(nums, k)\n  count = Hash.new(0)\n  count[0] = 1\n  odds = 0\n  total = 0\n  nums.each do |v|\n    odds += v % 2\n    total += count[odds - k]\n    count[odds] += 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Remove Duplicates from Sorted Array II ──────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const out: number[] = [];
      for (let i = 0; i < nums.length; i++) {
        if (out.length < 2 || out[out.length - 2] !== nums[i]) out.push(nums[i]);
      }
      return out;
    };
    return {
      slug: "remove-duplicates-from-sorted-array-ii",
      title: "Remove Duplicates from Sorted Array II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Meta", "Amazon", "Microsoft", "Adobe"],
      signature: { funcName: "removeDuplicates", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums` sorted in non-decreasing order, remove extra copies so that each distinct value appears **at most twice**, keeping the relative order.\n\nReturn the resulting array.",
        [
          { in: "nums = [1,1,1,2,2,3]", out: "[1,1,2,2,3]", note: "The third 1 is dropped." },
          { in: "nums = [0,0,1,1,1,1,2,3,3]", out: "[0,0,1,1,2,3,3]" },
          { in: "nums = [1,2,3]", out: "[1,2,3]" },
        ],
        ["1 <= nums.length <= 40", "-100 <= nums[i] <= 100", "nums is sorted in non-decreasing order."],
        "The interview version does this in place with O(1) extra memory."),
      hints: [
        "Keep a write cursor. A value is safe to keep if it differs from the element **two places back** in the output.",
        "That single comparison enforces 'at most twice' without counting runs explicitly.",
        "The first two elements are always kept, which the same check handles automatically.",
      ],
      examples: [
        { input: "[1,1,1,2,2,3]", expectedOutput: "[1,1,2,2,3]" },
        { input: "[0,0,1,1,1,1,2,3,3]", expectedOutput: "[0,0,1,1,2,3,3]" },
        { input: "[1,2,3]", expectedOutput: "[1,2,3]" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), -100, rng() < 0.6 ? -90 : 100);
        nums.sort((a, b) => a - b);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def removeDuplicates(nums):\n    out = []\n    for x in nums:\n        if len(out) < 2 or out[-2] != x:\n            out.append(x)\n    return out`,
        javascript: `var removeDuplicates = function(nums) {\n    const out = [];\n    for (let i = 0; i < nums.length; i++) {\n        if (out.length < 2 || out[out.length - 2] !== nums[i]) out.push(nums[i]);\n    }\n    return out;\n};`,

        typescript: `function removeDuplicates(nums: number[]): number[] {\n    var out: number[] = [];\n    for (var i = 0; i < nums.length; i++) {\n        if (out.length < 2 || out[out.length - 2] !== nums[i]) out.push(nums[i]);\n    }\n    return out;\n}`,

        java: `public static int[] removeDuplicates(int[] nums) {\n    int[] out = new int[nums.length];\n    int len = 0;\n    for (int v : nums) {\n        if (len < 2 || out[len - 2] != v) out[len++] = v;\n    }\n    return Arrays.copyOf(out, len);\n}`,

        cpp: `vector<int> removeDuplicates(vector<int>& nums) {\n    vector<int> out;\n    for (int v : nums) {\n        if (out.size() < 2 || out[out.size() - 2] != v) out.push_back(v);\n    }\n    return out;\n}`,

        c: `int* removeDuplicates(int* nums, int numsSize, int* returnSize) {\n    int* out = (int*) malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));\n    int len = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (len < 2 || out[len - 2] != nums[i]) out[len++] = nums[i];\n    }\n    *returnSize = len;\n    return out;\n}`,

        csharp: `public static int[] RemoveDuplicates(int[] nums)\n{\n    var out_ = new List<int>();\n    foreach (int v in nums)\n    {\n        if (out_.Count < 2 || out_[out_.Count - 2] != v) out_.Add(v);\n    }\n    return out_.ToArray();\n}`,

        go: `func removeDuplicates(nums []int) []int {\n	out := []int{}\n	for _, v := range nums {\n		if len(out) < 2 || out[len(out)-2] != v {\n			out = append(out, v)\n		}\n	}\n	return out\n}`,

        kotlin: `fun removeDuplicates(nums: IntArray): IntArray {\n    val out = ArrayList<Int>()\n    for (v in nums) {\n        if (out.size < 2 || out[out.size - 2] != v) out.add(v)\n    }\n    return out.toIntArray()\n}`,

        swift: `func removeDuplicates(_ nums: [Int]) -> [Int] {\n    var out: [Int] = []\n    for v in nums {\n        if out.count < 2 || out[out.count - 2] != v { out.append(v) }\n    }\n    return out\n}`,

        rust: `fn removeDuplicates(nums: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    for v in nums.iter() {\n        let len = out.len();\n        if len < 2 || out[len - 2] != *v {\n            out.push(*v);\n        }\n    }\n    out\n}`,

        php: `function removeDuplicates($nums) {\n    $out = array();\n    foreach ($nums as $v) {\n        $len = count($out);\n        if ($len < 2 || $out[$len - 2] !== $v) $out[] = $v;\n    }\n    return $out;\n}`,

        ruby: `def removeDuplicates(nums)\n  out = []\n  nums.each do |v|\n    out << v if out.length < 2 || out[-2] != v\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Remove Element ──────────────────────────────────────────────
  (() => {
    const ref = (nums: number[], value: number) => nums.filter((x) => x !== value);
    return {
      slug: "remove-element",
      title: "Remove Element",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Amazon", "Microsoft", "TCS", "Infosys"],
      signature: { funcName: "removeElement", params: [{ name: "nums", type: "int[]" as const }, { name: "value", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums` and an integer `value`, remove **every** occurrence of `value` from `nums` and return the remaining elements, keeping their original relative order.",
        [
          { in: "nums = [3,2,2,3], value = 3", out: "[2,2]" },
          { in: "nums = [0,1,2,2,3,0,4,2], value = 2", out: "[0,1,3,0,4]" },
          { in: "nums = [1], value = 1", out: "[]" },
        ],
        ["0 <= nums.length <= 40", "0 <= nums[i] <= 50", "0 <= value <= 50"],
        "The interview version does this in place with two pointers and O(1) extra memory."),
      hints: [
        "Use a read cursor and a write cursor over the same array.",
        "Copy every element that is not `value` to the write position and advance it.",
        "Everything past the write cursor at the end is leftover and does not matter.",
      ],
      examples: [
        { input: "[3,2,2,3]\n3", expectedOutput: "[2,2]" },
        { input: "[0,1,2,2,3,0,4,2]\n2", expectedOutput: "[0,1,3,0,4]" },
        { input: "[1]\n1", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 0, 40), 0, rng() < 0.5 ? 5 : 50);
        const value = ri(rng, 0, rng() < 0.5 ? 5 : 50);
        return { input: `${fmtIntArr(nums)}\n${value}`, expectedOutput: fmtIntArr(ref(nums, value)) };
      },
      solutions: {
        python: `def removeElement(nums, value: int):\n    out = []\n    for x in nums:\n        if x != value:\n            out.append(x)\n    return out`,
        javascript: `var removeElement = function(nums, value) {\n    const out = [];\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] !== value) out.push(nums[i]);\n    }\n    return out;\n};`,

        typescript: `function removeElement(nums: number[], value: number): number[] {\n    var out: number[] = [];\n    for (var i = 0; i < nums.length; i++) {\n        if (nums[i] !== value) out.push(nums[i]);\n    }\n    return out;\n}`,

        java: `public static int[] removeElement(int[] nums, int value) {\n    int[] out = new int[nums.length];\n    int len = 0;\n    for (int v : nums) {\n        if (v != value) out[len++] = v;\n    }\n    return Arrays.copyOf(out, len);\n}`,

        cpp: `vector<int> removeElement(vector<int>& nums, int value) {\n    vector<int> out;\n    for (int v : nums) {\n        if (v != value) out.push_back(v);\n    }\n    return out;\n}`,

        c: `int* removeElement(int* nums, int numsSize, int value, int* returnSize) {\n    int* out = (int*) malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));\n    int len = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] != value) out[len++] = nums[i];\n    }\n    *returnSize = len;\n    return out;\n}`,

        csharp: `public static int[] RemoveElement(int[] nums, int value)\n{\n    var out_ = new List<int>();\n    foreach (int v in nums)\n    {\n        if (v != value) out_.Add(v);\n    }\n    return out_.ToArray();\n}`,

        go: `func removeElement(nums []int, value int) []int {\n	out := []int{}\n	for _, v := range nums {\n		if v != value {\n			out = append(out, v)\n		}\n	}\n	return out\n}`,

        kotlin: `fun removeElement(nums: IntArray, value: Int): IntArray {\n    val out = ArrayList<Int>()\n    for (v in nums) {\n        if (v != value) out.add(v)\n    }\n    return out.toIntArray()\n}`,

        swift: `func removeElement(_ nums: [Int], _ value: Int) -> [Int] {\n    var out: [Int] = []\n    for v in nums where v != value { out.append(v) }\n    return out\n}`,

        rust: `fn removeElement(nums: Vec<i32>, value: i32) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    for v in nums.iter() {\n        if *v != value {\n            out.push(*v);\n        }\n    }\n    out\n}`,

        php: `function removeElement($nums, $value) {\n    $out = array();\n    foreach ($nums as $v) {\n        if ($v !== $value) $out[] = $v;\n    }\n    return $out;\n}`,

        ruby: `def removeElement(nums, value)\n  nums.reject { |v| v == value }\nend`,
      },
    };
  })(),

  // ── Merge Strings Alternately ───────────────────────────────────
  (() => {
    const ref = (a: string, b: string) => {
      let out = "";
      const n = Math.max(a.length, b.length);
      for (let i = 0; i < n; i++) {
        if (i < a.length) out += a[i];
        if (i < b.length) out += b[i];
      }
      return out;
    };
    return {
      slug: "merge-strings-alternately",
      title: "Merge Strings Alternately",
      difficulty: "EASY" as const,
      tags: ["Two Pointers", "String", "Amazon", "Google", "Zoho"],
      signature: { funcName: "mergeAlternately", params: [{ name: "word1", type: "string" as const }, { name: "word2", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given two strings `word1` and `word2`. Merge them by adding letters in alternating order, starting with `word1`.\n\nIf one string is longer, append its remaining letters to the end of the merged string.",
        [
          { in: 'word1 = "abc", word2 = "pqr"', out: "apbqcr" },
          { in: 'word1 = "ab", word2 = "pqrs"', out: "apbqrs", note: 'After "ab" runs out, the rest of word2 is appended.' },
          { in: 'word1 = "abcd", word2 = "pq"', out: "apbqcd" },
        ],
        ["1 <= word1.length, word2.length <= 30", "Both consist of lowercase English letters."]),
      hints: [
        "Loop up to the length of the longer string.",
        "At each step append `word1[i]` if it exists, then `word2[i]` if it exists.",
        "That single loop handles the leftover tail without a separate append step.",
      ],
      examples: [
        { input: '"abc"\n"pqr"', expectedOutput: "apbqcr" },
        { input: '"ab"\n"pqrs"', expectedOutput: "apbqrs" },
        { input: '"abcd"\n"pq"', expectedOutput: "apbqcd" },
      ],
      gen: (rng: Rng) => {
        const a = randStr(rng, 1, 30);
        const b = randStr(rng, 1, 30);
        return { input: `"${a}"\n"${b}"`, expectedOutput: ref(a, b) };
      },
      solutions: {
        python: `def mergeAlternately(word1: str, word2: str) -> str:\n    out = []\n    for i in range(max(len(word1), len(word2))):\n        if i < len(word1):\n            out.append(word1[i])\n        if i < len(word2):\n            out.append(word2[i])\n    return "".join(out)`,
        javascript: `var mergeAlternately = function(word1, word2) {\n    let out = "";\n    const n = Math.max(word1.length, word2.length);\n    for (let i = 0; i < n; i++) {\n        if (i < word1.length) out += word1[i];\n        if (i < word2.length) out += word2[i];\n    }\n    return out;\n};`,

        typescript: `function mergeAlternately(word1: string, word2: string): string {\n    var out = "";\n    var n = Math.max(word1.length, word2.length);\n    for (var i = 0; i < n; i++) {\n        if (i < word1.length) out += word1.charAt(i);\n        if (i < word2.length) out += word2.charAt(i);\n    }\n    return out;\n}`,

        java: `public static String mergeAlternately(String word1, String word2) {\n    StringBuilder out = new StringBuilder();\n    int n = Math.max(word1.length(), word2.length());\n    for (int i = 0; i < n; i++) {\n        if (i < word1.length()) out.append(word1.charAt(i));\n        if (i < word2.length()) out.append(word2.charAt(i));\n    }\n    return out.toString();\n}`,

        cpp: `string mergeAlternately(string word1, string word2) {\n    string out = "";\n    size_t n = max(word1.size(), word2.size());\n    for (size_t i = 0; i < n; i++) {\n        if (i < word1.size()) out += word1[i];\n        if (i < word2.size()) out += word2[i];\n    }\n    return out;\n}`,

        c: `char* mergeAlternately(const char* word1, const char* word2) {\n    int n1 = (int) strlen(word1);\n    int n2 = (int) strlen(word2);\n    char* out = (char*) malloc(n1 + n2 + 1);\n    int pos = 0;\n    int n = n1 > n2 ? n1 : n2;\n    for (int i = 0; i < n; i++) {\n        if (i < n1) out[pos++] = word1[i];\n        if (i < n2) out[pos++] = word2[i];\n    }\n    out[pos] = '\\0';\n    return out;\n}`,

        csharp: `public static string MergeAlternately(string word1, string word2)\n{\n    var out_ = new System.Text.StringBuilder();\n    int n = Math.Max(word1.Length, word2.Length);\n    for (int i = 0; i < n; i++)\n    {\n        if (i < word1.Length) out_.Append(word1[i]);\n        if (i < word2.Length) out_.Append(word2[i]);\n    }\n    return out_.ToString();\n}`,

        go: `func mergeAlternately(word1 string, word2 string) string {\n	var sb strings.Builder\n	n := len(word1)\n	if len(word2) > n {\n		n = len(word2)\n	}\n	for i := 0; i < n; i++ {\n		if i < len(word1) {\n			sb.WriteByte(word1[i])\n		}\n		if i < len(word2) {\n			sb.WriteByte(word2[i])\n		}\n	}\n	return sb.String()\n}`,

        kotlin: `fun mergeAlternately(word1: String, word2: String): String {\n    val out = StringBuilder()\n    val n = if (word1.length > word2.length) word1.length else word2.length\n    for (i in 0 until n) {\n        if (i < word1.length) out.append(word1[i])\n        if (i < word2.length) out.append(word2[i])\n    }\n    return out.toString()\n}`,

        swift: `func mergeAlternately(_ word1: String, _ word2: String) -> String {\n    let a = Array(word1)\n    let b = Array(word2)\n    var out = ""\n    let n = max(a.count, b.count)\n    for i in 0..<n {\n        if i < a.count { out.append(a[i]) }\n        if i < b.count { out.append(b[i]) }\n    }\n    return out\n}`,

        rust: `fn mergeAlternately(word1: String, word2: String) -> String {\n    let a = word1.as_bytes();\n    let b = word2.as_bytes();\n    let n = if a.len() > b.len() { a.len() } else { b.len() };\n    let mut out: Vec<u8> = Vec::new();\n    for i in 0..n {\n        if i < a.len() {\n            out.push(a[i]);\n        }\n        if i < b.len() {\n            out.push(b[i]);\n        }\n    }\n    String::from_utf8(out).unwrap()\n}`,

        php: `function mergeAlternately($word1, $word2) {\n    $out = "";\n    $n1 = strlen($word1);\n    $n2 = strlen($word2);\n    $n = $n1 > $n2 ? $n1 : $n2;\n    for ($i = 0; $i < $n; $i++) {\n        if ($i < $n1) $out .= $word1[$i];\n        if ($i < $n2) $out .= $word2[$i];\n    }\n    return $out;\n}`,

        ruby: `def mergeAlternately(word1, word2)\n  out = ""\n  n = [word1.length, word2.length].max\n  (0...n).each do |i|\n    out += word1[i] if i < word1.length\n    out += word2[i] if i < word2.length\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Reverse Prefix of Word ──────────────────────────────────────
  (() => {
    const ref = (word: string, ch: string) => {
      const idx = word.indexOf(ch);
      if (idx < 0) return word;
      return word.slice(0, idx + 1).split("").reverse().join("") + word.slice(idx + 1);
    };
    return {
      slug: "reverse-prefix-of-word",
      title: "Reverse Prefix of Word",
      difficulty: "EASY" as const,
      tags: ["Two Pointers", "String", "Stack", "Amazon", "Adobe"],
      signature: { funcName: "reversePrefix", params: [{ name: "word", type: "string" as const }, { name: "ch", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given a string `word` and a single character `ch`, reverse the segment of `word` that starts at index 0 and ends at the **first** occurrence of `ch` (inclusive).\n\nIf `ch` does not occur in `word`, return `word` unchanged.",
        [
          { in: 'word = "abcdefd", ch = "d"', out: "dcbaefd", note: 'The first d is at index 3, so "abcd" reverses to "dcba".' },
          { in: 'word = "xyxzxe", ch = "z"', out: "zxyxxe" },
          { in: 'word = "abcd", ch = "z"', out: "abcd" },
        ],
        ["1 <= word.length <= 40", "word consists of lowercase English letters.", "ch is a single lowercase English letter."]),
      hints: [
        "Find the first index of `ch` — a missing character means there is nothing to do.",
        "Reverse the slice up to and including that index, then append the rest untouched.",
      ],
      examples: [
        { input: '"abcdefd"\n"d"', expectedOutput: "dcbaefd" },
        { input: '"xyxzxe"\n"z"', expectedOutput: "zxyxxe" },
        { input: '"abcd"\n"z"', expectedOutput: "abcd" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcdef";
        const word = randStr(rng, 1, 40, alphabet);
        const ch = rng() < 0.8 ? word[ri(rng, 0, word.length - 1)] : "z";
        return { input: `"${word}"\n"${ch}"`, expectedOutput: ref(word, ch) };
      },
      solutions: {
        python: `def reversePrefix(word: str, ch: str) -> str:\n    idx = word.find(ch)\n    if idx < 0:\n        return word\n    return word[:idx + 1][::-1] + word[idx + 1:]`,
        javascript: `var reversePrefix = function(word, ch) {\n    const idx = word.indexOf(ch);\n    if (idx < 0) return word;\n    return word.slice(0, idx + 1).split("").reverse().join("") + word.slice(idx + 1);\n};`,

        typescript: `function reversePrefix(word: string, ch: string): string {\n    var idx = word.indexOf(ch);\n    if (idx < 0) return word;\n    var head = word.substring(0, idx + 1).split("").reverse().join("");\n    return head + word.substring(idx + 1);\n}`,

        java: `public static String reversePrefix(String word, String ch) {\n    int idx = word.indexOf(ch);\n    if (idx < 0) return word;\n    String head = new StringBuilder(word.substring(0, idx + 1)).reverse().toString();\n    return head + word.substring(idx + 1);\n}`,

        cpp: `string reversePrefix(string word, string ch) {\n    size_t idx = word.find(ch);\n    if (idx == string::npos) return word;\n    reverse(word.begin(), word.begin() + idx + 1);\n    return word;\n}`,

        c: `char* reversePrefix(const char* word, const char* ch) {\n    int n = (int) strlen(word);\n    int idx = -1;\n    for (int i = 0; i < n; i++) {\n        if (word[i] == ch[0]) { idx = i; break; }\n    }\n    char* out = (char*) malloc(n + 1);\n    for (int i = 0; i < n; i++) out[i] = word[i];\n    out[n] = '\\0';\n    if (idx < 0) return out;\n    for (int i = 0; i <= idx; i++) out[i] = word[idx - i];\n    return out;\n}`,

        csharp: `public static string ReversePrefix(string word, string ch)\n{\n    int idx = word.IndexOf(ch);\n    if (idx < 0) return word;\n    char[] head = word.Substring(0, idx + 1).ToCharArray();\n    Array.Reverse(head);\n    return new string(head) + word.Substring(idx + 1);\n}`,

        go: `func reversePrefix(word string, ch string) string {\n	idx := strings.Index(word, ch)\n	if idx < 0 {\n		return word\n	}\n	b := []byte(word)\n	for l, r := 0, idx; l < r; l, r = l+1, r-1 {\n		b[l], b[r] = b[r], b[l]\n	}\n	return string(b)\n}`,

        kotlin: `fun reversePrefix(word: String, ch: String): String {\n    val idx = word.indexOf(ch)\n    if (idx < 0) return word\n    return word.substring(0, idx + 1).reversed() + word.substring(idx + 1)\n}`,

        swift: `func reversePrefix(_ word: String, _ ch: String) -> String {\n    let chars = Array(word)\n    let target = Array(ch)[0]\n    var idx = -1\n    for i in 0..<chars.count {\n        if chars[i] == target {\n            idx = i\n            break\n        }\n    }\n    if idx < 0 { return word }\n    var out = Array(chars[0...idx].reversed())\n    out.append(contentsOf: chars[(idx + 1)...])\n    return String(out)\n}`,

        rust: `fn reversePrefix(word: String, ch: String) -> String {\n    let target = ch.as_bytes()[0];\n    let mut bytes = word.into_bytes();\n    let mut idx: i32 = -1;\n    for i in 0..bytes.len() {\n        if bytes[i] == target {\n            idx = i as i32;\n            break;\n        }\n    }\n    if idx < 0 {\n        return String::from_utf8(bytes).unwrap();\n    }\n    bytes[0..(idx as usize + 1)].reverse();\n    String::from_utf8(bytes).unwrap()\n}`,

        php: `function reversePrefix($word, $ch) {\n    $idx = strpos($word, $ch);\n    if ($idx === false) return $word;\n    return strrev(substr($word, 0, $idx + 1)) . substr($word, $idx + 1);\n}`,

        ruby: `def reversePrefix(word, ch)\n  idx = word.index(ch)\n  return word if idx.nil?\n  word[0..idx].reverse + word[(idx + 1)..-1].to_s\nend`,
      },
    };
  })(),

  // ── Shortest Distance to a Character ────────────────────────────
  (() => {
    const ref = (s: string, c: string) => {
      const n = s.length;
      const out = new Array(n).fill(0);
      let prev = -10000;
      for (let i = 0; i < n; i++) {
        if (s[i] === c) prev = i;
        out[i] = i - prev;
      }
      prev = 10000;
      for (let i = n - 1; i >= 0; i--) {
        if (s[i] === c) prev = i;
        if (prev - i < out[i]) out[i] = prev - i;
      }
      return out;
    };
    return {
      slug: "shortest-distance-to-a-character",
      title: "Shortest Distance to a Character",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "String", "Amazon", "Google", "Meta"],
      signature: { funcName: "shortestToChar", params: [{ name: "s", type: "string" as const }, { name: "c", type: "string" as const }], returns: "int[]" as const },
      description: describe(
        "Given a string `s` and a character `c` that occurs in `s`, return an array of integers `answer` where `answer[i]` is the distance from index `i` to the **closest** occurrence of `c`.\n\nThe distance between indices `i` and `j` is `abs(i - j)`.",
        [
          { in: 's = "loveleetcode", c = "e"', out: "[3,2,1,0,1,0,0,1,2,2,1,0]" },
          { in: 's = "aaab", c = "b"', out: "[3,2,1,0]" },
          { in: 's = "aa", c = "a"', out: "[0,0]" },
        ],
        ["1 <= s.length <= 40", "s consists of lowercase English letters.", "c occurs at least once in s."]),
      hints: [
        "Two sweeps beat computing every pairwise distance.",
        "Left to right, track the most recent occurrence of `c` and record the distance behind you.",
        "Right to left, track the next occurrence and keep the smaller of the two distances.",
      ],
      examples: [
        { input: '"loveleetcode"\n"e"', expectedOutput: "[3,2,1,0,1,0,0,1,2,2,1,0]" },
        { input: '"aaab"\n"b"', expectedOutput: "[3,2,1,0]" },
        { input: '"aa"\n"a"', expectedOutput: "[0,0]" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcde";
        let s = randStr(rng, 1, 40, alphabet);
        const c = alphabet[ri(rng, 0, alphabet.length - 1)];
        if (s.indexOf(c) < 0) {
          const pos = ri(rng, 0, s.length - 1);
          s = s.slice(0, pos) + c + s.slice(pos + 1);
        }
        return { input: `"${s}"\n"${c}"`, expectedOutput: fmtIntArr(ref(s, c)) };
      },
      solutions: {
        python: `def shortestToChar(s: str, c: str):\n    n = len(s)\n    out = [0] * n\n    prev = -10000\n    for i in range(n):\n        if s[i] == c:\n            prev = i\n        out[i] = i - prev\n    prev = 10000\n    for i in range(n - 1, -1, -1):\n        if s[i] == c:\n            prev = i\n        out[i] = min(out[i], prev - i)\n    return out`,
        javascript: `var shortestToChar = function(s, c) {\n    const n = s.length;\n    const out = new Array(n).fill(0);\n    let prev = -10000;\n    for (let i = 0; i < n; i++) {\n        if (s[i] === c) prev = i;\n        out[i] = i - prev;\n    }\n    prev = 10000;\n    for (let i = n - 1; i >= 0; i--) {\n        if (s[i] === c) prev = i;\n        if (prev - i < out[i]) out[i] = prev - i;\n    }\n    return out;\n};`,

        typescript: `function shortestToChar(s: string, c: string): number[] {\n    var n = s.length;\n    var out: number[] = [];\n    for (var k = 0; k < n; k++) out.push(0);\n    var prev = -10000;\n    for (var i = 0; i < n; i++) {\n        if (s.charAt(i) === c) prev = i;\n        out[i] = i - prev;\n    }\n    prev = 10000;\n    for (var j = n - 1; j >= 0; j--) {\n        if (s.charAt(j) === c) prev = j;\n        if (prev - j < out[j]) out[j] = prev - j;\n    }\n    return out;\n}`,

        java: `public static int[] shortestToChar(String s, String c) {\n    int n = s.length();\n    char target = c.charAt(0);\n    int[] out = new int[n];\n    int prev = -10000;\n    for (int i = 0; i < n; i++) {\n        if (s.charAt(i) == target) prev = i;\n        out[i] = i - prev;\n    }\n    prev = 10000;\n    for (int i = n - 1; i >= 0; i--) {\n        if (s.charAt(i) == target) prev = i;\n        out[i] = Math.min(out[i], prev - i);\n    }\n    return out;\n}`,

        cpp: `vector<int> shortestToChar(string s, string c) {\n    int n = (int) s.size();\n    char target = c[0];\n    vector<int> out(n, 0);\n    int prev = -10000;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == target) prev = i;\n        out[i] = i - prev;\n    }\n    prev = 10000;\n    for (int i = n - 1; i >= 0; i--) {\n        if (s[i] == target) prev = i;\n        out[i] = min(out[i], prev - i);\n    }\n    return out;\n}`,

        c: `int* shortestToChar(const char* s, const char* c, int* returnSize) {\n    int n = (int) strlen(s);\n    char target = c[0];\n    int* out = (int*) malloc(sizeof(int) * (n > 0 ? n : 1));\n    int prev = -10000;\n    for (int i = 0; i < n; i++) {\n        if (s[i] == target) prev = i;\n        out[i] = i - prev;\n    }\n    prev = 10000;\n    for (int i = n - 1; i >= 0; i--) {\n        if (s[i] == target) prev = i;\n        if (prev - i < out[i]) out[i] = prev - i;\n    }\n    *returnSize = n;\n    return out;\n}`,

        csharp: `public static int[] ShortestToChar(string s, string c)\n{\n    int n = s.Length;\n    char target = c[0];\n    int[] out_ = new int[n];\n    int prev = -10000;\n    for (int i = 0; i < n; i++)\n    {\n        if (s[i] == target) prev = i;\n        out_[i] = i - prev;\n    }\n    prev = 10000;\n    for (int i = n - 1; i >= 0; i--)\n    {\n        if (s[i] == target) prev = i;\n        out_[i] = Math.Min(out_[i], prev - i);\n    }\n    return out_;\n}`,

        go: `func shortestToChar(s string, c string) []int {\n	n := len(s)\n	target := c[0]\n	out := make([]int, n)\n	prev := -10000\n	for i := 0; i < n; i++ {\n		if s[i] == target {\n			prev = i\n		}\n		out[i] = i - prev\n	}\n	prev = 10000\n	for i := n - 1; i >= 0; i-- {\n		if s[i] == target {\n			prev = i\n		}\n		if prev-i < out[i] {\n			out[i] = prev - i\n		}\n	}\n	return out\n}`,

        kotlin: `fun shortestToChar(s: String, c: String): IntArray {\n    val n = s.length\n    val target = c[0]\n    val out = IntArray(n)\n    var prev = -10000\n    for (i in 0 until n) {\n        if (s[i] == target) prev = i\n        out[i] = i - prev\n    }\n    prev = 10000\n    for (i in n - 1 downTo 0) {\n        if (s[i] == target) prev = i\n        if (prev - i < out[i]) out[i] = prev - i\n    }\n    return out\n}`,

        swift: `func shortestToChar(_ s: String, _ c: String) -> [Int] {\n    let chars = Array(s)\n    let target = Array(c)[0]\n    let n = chars.count\n    var out = [Int](repeating: 0, count: n)\n    var prev = -10000\n    for i in 0..<n {\n        if chars[i] == target { prev = i }\n        out[i] = i - prev\n    }\n    prev = 10000\n    for i in stride(from: n - 1, through: 0, by: -1) {\n        if chars[i] == target { prev = i }\n        if prev - i < out[i] { out[i] = prev - i }\n    }\n    return out\n}`,

        rust: `fn shortestToChar(s: String, c: String) -> Vec<i32> {\n    let bytes = s.as_bytes();\n    let target = c.as_bytes()[0];\n    let n = bytes.len();\n    let mut out = vec![0i32; n];\n    let mut prev: i32 = -10000;\n    for i in 0..n {\n        if bytes[i] == target {\n            prev = i as i32;\n        }\n        out[i] = i as i32 - prev;\n    }\n    prev = 10000;\n    for i in (0..n).rev() {\n        if bytes[i] == target {\n            prev = i as i32;\n        }\n        if prev - (i as i32) < out[i] {\n            out[i] = prev - (i as i32);\n        }\n    }\n    out\n}`,

        php: `function shortestToChar($s, $c) {\n    $n = strlen($s);\n    $out = array_fill(0, $n, 0);\n    $prev = -10000;\n    for ($i = 0; $i < $n; $i++) {\n        if ($s[$i] === $c) $prev = $i;\n        $out[$i] = $i - $prev;\n    }\n    $prev = 10000;\n    for ($i = $n - 1; $i >= 0; $i--) {\n        if ($s[$i] === $c) $prev = $i;\n        if ($prev - $i < $out[$i]) $out[$i] = $prev - $i;\n    }\n    return $out;\n}`,

        ruby: `def shortestToChar(s, c)\n  n = s.length\n  out = Array.new(n, 0)\n  prev = -10000\n  (0...n).each do |i|\n    prev = i if s[i] == c\n    out[i] = i - prev\n  end\n  prev = 10000\n  (n - 1).downto(0) do |i|\n    prev = i if s[i] == c\n    out[i] = prev - i if prev - i < out[i]\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Can Make Arithmetic Progression From Sequence ───────────────
  (() => {
    const ref = (arr: number[]) => {
      const a = arr.slice().sort((x, y) => x - y);
      if (a.length <= 2) return true;
      const d = a[1] - a[0];
      for (let i = 2; i < a.length; i++) if (a[i] - a[i - 1] !== d) return false;
      return true;
    };
    return {
      slug: "can-make-arithmetic-progression-from-sequence",
      title: "Can Make Arithmetic Progression From Sequence",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Amazon", "Adobe"],
      signature: { funcName: "canMakeArithmeticProgression", params: [{ name: "arr", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "A sequence is an **arithmetic progression** if the difference between any two consecutive elements is the same.\n\nGiven an array of numbers `arr`, return `true` if the array can be rearranged into an arithmetic progression.",
        [
          { in: "arr = [3,5,1]", out: "true", note: "Rearranged as [1,3,5], the common difference is 2." },
          { in: "arr = [1,2,4]", out: "false" },
          { in: "arr = [7,7]", out: "true", note: "Any two elements form a progression." },
        ],
        ["2 <= arr.length <= 40", "-1000 <= arr[i] <= 1000"]),
      hints: [
        "Sorting puts the candidate progression in order; there is no other arrangement to try.",
        "Then check that every adjacent gap matches the first one.",
        "Arrays of length two always qualify.",
      ],
      examples: [
        { input: "[3,5,1]", expectedOutput: "true" },
        { input: "[1,2,4]", expectedOutput: "false" },
        { input: "[7,7]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        let arr: number[];
        if (rng() < 0.4) {
          const n = ri(rng, 2, 20);
          const start = ri(rng, -100, 100);
          const d = ri(rng, -10, 10);
          arr = Array.from({ length: n }, (_, i) => start + i * d);
          shuffle(rng, arr);
        } else {
          arr = randArr(rng, ri(rng, 2, 20), -1000, 1000);
        }
        return { input: fmtIntArr(arr), expectedOutput: bool(ref(arr)) };
      },
      solutions: {
        python: `def canMakeArithmeticProgression(arr) -> bool:\n    a = sorted(arr)\n    if len(a) <= 2:\n        return True\n    d = a[1] - a[0]\n    return all(a[i] - a[i - 1] == d for i in range(2, len(a)))`,
        javascript: `var canMakeArithmeticProgression = function(arr) {\n    const a = arr.slice().sort(function(x, y) { return x - y; });\n    if (a.length <= 2) return true;\n    const d = a[1] - a[0];\n    for (let i = 2; i < a.length; i++) {\n        if (a[i] - a[i - 1] !== d) return false;\n    }\n    return true;\n};`,

        typescript: `function canMakeArithmeticProgression(arr: number[]): boolean {\n    var a = arr.slice();\n    a.sort(function (x, y) { return x - y; });\n    if (a.length <= 2) return true;\n    var d = a[1] - a[0];\n    for (var i = 2; i < a.length; i++) {\n        if (a[i] - a[i - 1] !== d) return false;\n    }\n    return true;\n}`,

        java: `public static boolean canMakeArithmeticProgression(int[] arr) {\n    int[] a = Arrays.copyOf(arr, arr.length);\n    Arrays.sort(a);\n    if (a.length <= 2) return true;\n    int d = a[1] - a[0];\n    for (int i = 2; i < a.length; i++) {\n        if (a[i] - a[i - 1] != d) return false;\n    }\n    return true;\n}`,

        cpp: `bool canMakeArithmeticProgression(vector<int>& arr) {\n    vector<int> a = arr;\n    sort(a.begin(), a.end());\n    if (a.size() <= 2) return true;\n    int d = a[1] - a[0];\n    for (size_t i = 2; i < a.size(); i++) {\n        if (a[i] - a[i - 1] != d) return false;\n    }\n    return true;\n}`,

        c: `bool canMakeArithmeticProgression(int* arr, int arrSize) {\n    int* a = (int*) malloc(sizeof(int) * arrSize);\n    for (int i = 0; i < arrSize; i++) a[i] = arr[i];\n    for (int i = 1; i < arrSize; i++) {\n        int key = a[i];\n        int j = i - 1;\n        while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }\n        a[j + 1] = key;\n    }\n    bool ok = true;\n    if (arrSize > 2) {\n        int d = a[1] - a[0];\n        for (int i = 2; i < arrSize; i++) {\n            if (a[i] - a[i - 1] != d) { ok = false; break; }\n        }\n    }\n    free(a);\n    return ok;\n}`,

        csharp: `public static bool CanMakeArithmeticProgression(int[] arr)\n{\n    int[] a = (int[]) arr.Clone();\n    Array.Sort(a);\n    if (a.Length <= 2) return true;\n    int d = a[1] - a[0];\n    for (int i = 2; i < a.Length; i++)\n    {\n        if (a[i] - a[i - 1] != d) return false;\n    }\n    return true;\n}`,

        go: `func canMakeArithmeticProgression(arr []int) bool {\n	a := make([]int, len(arr))\n	copy(a, arr)\n	sort.Ints(a)\n	if len(a) <= 2 {\n		return true\n	}\n	d := a[1] - a[0]\n	for i := 2; i < len(a); i++ {\n		if a[i]-a[i-1] != d {\n			return false\n		}\n	}\n	return true\n}`,

        kotlin: `fun canMakeArithmeticProgression(arr: IntArray): Boolean {\n    val a = arr.copyOf()\n    a.sort()\n    if (a.size <= 2) return true\n    val d = a[1] - a[0]\n    for (i in 2 until a.size) {\n        if (a[i] - a[i - 1] != d) return false\n    }\n    return true\n}`,

        swift: `func canMakeArithmeticProgression(_ arr: [Int]) -> Bool {\n    let a = arr.sorted()\n    if a.count <= 2 { return true }\n    let d = a[1] - a[0]\n    for i in 2..<a.count {\n        if a[i] - a[i - 1] != d { return false }\n    }\n    return true\n}`,

        rust: `fn canMakeArithmeticProgression(arr: Vec<i32>) -> bool {\n    let mut a = arr.clone();\n    a.sort();\n    if a.len() <= 2 {\n        return true;\n    }\n    let d = a[1] - a[0];\n    for i in 2..a.len() {\n        if a[i] - a[i - 1] != d {\n            return false;\n        }\n    }\n    true\n}`,

        php: `function canMakeArithmeticProgression($arr) {\n    $a = $arr;\n    sort($a);\n    $n = count($a);\n    if ($n <= 2) return true;\n    $d = $a[1] - $a[0];\n    for ($i = 2; $i < $n; $i++) {\n        if ($a[$i] - $a[$i - 1] !== $d) return false;\n    }\n    return true;\n}`,

        ruby: `def canMakeArithmeticProgression(arr)\n  a = arr.sort\n  return true if a.length <= 2\n  d = a[1] - a[0]\n  (2...a.length).each do |i|\n    return false if a[i] - a[i - 1] != d\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Check If N and Its Double Exist ─────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr.length; j++) {
          if (i !== j && arr[i] === 2 * arr[j]) return true;
        }
      }
      return false;
    };
    return {
      slug: "check-if-n-and-its-double-exist",
      title: "Check If N and Its Double Exist",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Two Pointers", "Sorting", "Amazon", "Adobe"],
      signature: { funcName: "checkIfExist", params: [{ name: "arr", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Given an array `arr` of integers, return `true` if there exist two **distinct indices** `i` and `j` such that `arr[i] == 2 * arr[j]`.",
        [
          { in: "arr = [10,2,5,3]", out: "true", note: "10 = 2 × 5." },
          { in: "arr = [3,1,7,11]", out: "false" },
          { in: "arr = [0,0]", out: "true", note: "0 = 2 × 0, and the two zeros sit at different indices." },
        ],
        ["2 <= arr.length <= 40", "-1000 <= arr[i] <= 1000"]),
      hints: [
        "A hash set of seen values turns this into one pass: for each `x`, look for `2x` and for `x / 2`.",
        "Only check `x / 2` when `x` is even, or you will match a value that is not actually present.",
        "Zero is the trap: it needs a **second** zero, not just itself.",
      ],
      examples: [
        { input: "[10,2,5,3]", expectedOutput: "true" },
        { input: "[3,1,7,11]", expectedOutput: "false" },
        { input: "[0,0]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const arr = randArr(rng, ri(rng, 2, 40), rng() < 0.5 ? -10 : -1000, rng() < 0.5 ? 10 : 1000);
        return { input: fmtIntArr(arr), expectedOutput: bool(ref(arr)) };
      },
      solutions: {
        python: `def checkIfExist(arr) -> bool:\n    seen = set()\n    for x in arr:\n        if 2 * x in seen or (x % 2 == 0 and x // 2 in seen):\n            return True\n        seen.add(x)\n    return False`,
        javascript: `var checkIfExist = function(arr) {\n    const seen = new Set();\n    for (let i = 0; i < arr.length; i++) {\n        const x = arr[i];\n        if (seen.has(2 * x) || (x % 2 === 0 && seen.has(x / 2))) return true;\n        seen.add(x);\n    }\n    return false;\n};`,

        typescript: `function checkIfExist(arr: number[]): boolean {\n    var seen: { [key: string]: boolean } = {};\n    for (var i = 0; i < arr.length; i++) {\n        var x = arr[i];\n        if (seen[String(2 * x)] === true) return true;\n        if (x % 2 === 0 && seen[String(x / 2)] === true) return true;\n        seen[String(x)] = true;\n    }\n    return false;\n}`,

        java: `public static boolean checkIfExist(int[] arr) {\n    Set<Integer> seen = new HashSet<>();\n    for (int x : arr) {\n        if (seen.contains(2 * x)) return true;\n        if (x % 2 == 0 && seen.contains(x / 2)) return true;\n        seen.add(x);\n    }\n    return false;\n}`,

        cpp: `bool checkIfExist(vector<int>& arr) {\n    unordered_set<int> seen;\n    for (int x : arr) {\n        if (seen.count(2 * x)) return true;\n        if (x % 2 == 0 && seen.count(x / 2)) return true;\n        seen.insert(x);\n    }\n    return false;\n}`,

        c: `bool checkIfExist(int* arr, int arrSize) {\n    for (int i = 0; i < arrSize; i++) {\n        for (int j = 0; j < arrSize; j++) {\n            if (i != j && arr[i] == 2 * arr[j]) return true;\n        }\n    }\n    return false;\n}`,

        csharp: `public static bool CheckIfExist(int[] arr)\n{\n    var seen = new HashSet<int>();\n    foreach (int x in arr)\n    {\n        if (seen.Contains(2 * x)) return true;\n        if (x % 2 == 0 && seen.Contains(x / 2)) return true;\n        seen.Add(x);\n    }\n    return false;\n}`,

        go: `func checkIfExist(arr []int) bool {\n	seen := make(map[int]bool)\n	for _, x := range arr {\n		if seen[2*x] {\n			return true\n		}\n		if x%2 == 0 && seen[x/2] {\n			return true\n		}\n		seen[x] = true\n	}\n	return false\n}`,

        kotlin: `fun checkIfExist(arr: IntArray): Boolean {\n    val seen = HashSet<Int>()\n    for (x in arr) {\n        if (seen.contains(2 * x)) return true\n        if (x % 2 == 0 && seen.contains(x / 2)) return true\n        seen.add(x)\n    }\n    return false\n}`,

        swift: `func checkIfExist(_ arr: [Int]) -> Bool {\n    var seen = Set<Int>()\n    for x in arr {\n        if seen.contains(2 * x) { return true }\n        if x % 2 == 0 && seen.contains(x / 2) { return true }\n        seen.insert(x)\n    }\n    return false\n}`,

        rust: `fn checkIfExist(arr: Vec<i32>) -> bool {\n    use std::collections::HashSet;\n    let mut seen: HashSet<i32> = HashSet::new();\n    for x in arr.iter() {\n        if seen.contains(&(2 * *x)) {\n            return true;\n        }\n        if *x % 2 == 0 && seen.contains(&(*x / 2)) {\n            return true;\n        }\n        seen.insert(*x);\n    }\n    false\n}`,

        php: `function checkIfExist($arr) {\n    $seen = array();\n    foreach ($arr as $x) {\n        if (isset($seen[2 * $x])) return true;\n        if ($x % 2 === 0 && isset($seen[intdiv($x, 2)])) return true;\n        $seen[$x] = true;\n    }\n    return false;\n}`,

        ruby: `def checkIfExist(arr)\n  seen = {}\n  arr.each do |x|\n    return true if seen[2 * x]\n    return true if x % 2 == 0 && seen[x / 2]\n    seen[x] = true\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Minimum Difference Between Highest and Lowest of K Scores ───
  (() => {
    const ref = (nums: number[], k: number) => {
      if (k <= 1) return 0;
      const a = nums.slice().sort((x, y) => x - y);
      let best = Infinity;
      for (let i = 0; i + k <= a.length; i++) {
        const d = a[i + k - 1] - a[i];
        if (d < best) best = d;
      }
      return best;
    };
    return {
      slug: "minimum-difference-between-highest-and-lowest-of-k-scores",
      title: "Minimum Difference Between Highest and Lowest of K Scores",
      difficulty: "EASY" as const,
      tags: ["Array", "Sliding Window", "Sorting", "Amazon", "Google"],
      signature: { funcName: "minimumDifference", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of student scores and an integer `k`. Pick the scores of any `k` students so that the difference between the **highest** and the **lowest** of the picked scores is as small as possible.\n\nReturn that minimum difference.",
        [
          { in: "nums = [90], k = 1", out: "0" },
          { in: "nums = [9,4,1,7], k = 2", out: "2", note: "Picking 7 and 9 gives a difference of 2." },
          { in: "nums = [1,5,6,14,15], k = 3", out: "5" },
        ],
        ["1 <= k <= nums.length <= 40", "0 <= nums[i] <= 100000"]),
      hints: [
        "The `k` chosen scores should be as close together as possible — after sorting, that means they are **adjacent**.",
        "Sort, then slide a window of width `k` and take the smallest `a[i + k - 1] - a[i]`.",
        "`k = 1` always gives 0.",
      ],
      examples: [
        { input: "[90]\n1", expectedOutput: "0" },
        { input: "[9,4,1,7]\n2", expectedOutput: "2" },
        { input: "[1,5,6,14,15]\n3", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nums = randArr(rng, n, 0, rng() < 0.5 ? 50 : 100000);
        const k = ri(rng, 1, n);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: String(ref(nums, k)) };
      },
      solutions: {
        python: `def minimumDifference(nums, k: int) -> int:\n    if k <= 1:\n        return 0\n    a = sorted(nums)\n    return min(a[i + k - 1] - a[i] for i in range(len(a) - k + 1))`,
        javascript: `var minimumDifference = function(nums, k) {\n    if (k <= 1) return 0;\n    const a = nums.slice().sort(function(x, y) { return x - y; });\n    let best = Infinity;\n    for (let i = 0; i + k <= a.length; i++) {\n        const d = a[i + k - 1] - a[i];\n        if (d < best) best = d;\n    }\n    return best;\n};`,

        typescript: `function minimumDifference(nums: number[], k: number): number {\n    if (k <= 1) return 0;\n    var a = nums.slice();\n    a.sort(function (x, y) { return x - y; });\n    var best = -1;\n    for (var i = 0; i + k <= a.length; i++) {\n        var d = a[i + k - 1] - a[i];\n        if (best < 0 || d < best) best = d;\n    }\n    return best;\n}`,

        java: `public static int minimumDifference(int[] nums, int k) {\n    if (k <= 1) return 0;\n    int[] a = Arrays.copyOf(nums, nums.length);\n    Arrays.sort(a);\n    int best = Integer.MAX_VALUE;\n    for (int i = 0; i + k <= a.length; i++) {\n        best = Math.min(best, a[i + k - 1] - a[i]);\n    }\n    return best;\n}`,

        cpp: `int minimumDifference(vector<int>& nums, int k) {\n    if (k <= 1) return 0;\n    vector<int> a = nums;\n    sort(a.begin(), a.end());\n    int best = -1;\n    for (int i = 0; i + k <= (int) a.size(); i++) {\n        int d = a[i + k - 1] - a[i];\n        if (best < 0 || d < best) best = d;\n    }\n    return best;\n}`,

        c: `int minimumDifference(int* nums, int numsSize, int k) {\n    if (k <= 1) return 0;\n    int* a = (int*) malloc(sizeof(int) * numsSize);\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    for (int i = 1; i < numsSize; i++) {\n        int key = a[i];\n        int j = i - 1;\n        while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }\n        a[j + 1] = key;\n    }\n    int best = -1;\n    for (int i = 0; i + k <= numsSize; i++) {\n        int d = a[i + k - 1] - a[i];\n        if (best < 0 || d < best) best = d;\n    }\n    free(a);\n    return best;\n}`,

        csharp: `public static int MinimumDifference(int[] nums, int k)\n{\n    if (k <= 1) return 0;\n    int[] a = (int[]) nums.Clone();\n    Array.Sort(a);\n    int best = int.MaxValue;\n    for (int i = 0; i + k <= a.Length; i++)\n    {\n        best = Math.Min(best, a[i + k - 1] - a[i]);\n    }\n    return best;\n}`,

        go: `func minimumDifference(nums []int, k int) int {\n	if k <= 1 {\n		return 0\n	}\n	a := make([]int, len(nums))\n	copy(a, nums)\n	sort.Ints(a)\n	best := -1\n	for i := 0; i+k <= len(a); i++ {\n		d := a[i+k-1] - a[i]\n		if best < 0 || d < best {\n			best = d\n		}\n	}\n	return best\n}`,

        kotlin: `fun minimumDifference(nums: IntArray, k: Int): Int {\n    if (k <= 1) return 0\n    val a = nums.copyOf()\n    a.sort()\n    var best = -1\n    var i = 0\n    while (i + k <= a.size) {\n        val d = a[i + k - 1] - a[i]\n        if (best < 0 || d < best) best = d\n        i++\n    }\n    return best\n}`,

        swift: `func minimumDifference(_ nums: [Int], _ k: Int) -> Int {\n    if k <= 1 { return 0 }\n    let a = nums.sorted()\n    var best = -1\n    var i = 0\n    while i + k <= a.count {\n        let d = a[i + k - 1] - a[i]\n        if best < 0 || d < best { best = d }\n        i += 1\n    }\n    return best\n}`,

        rust: `fn minimumDifference(nums: Vec<i32>, k: i32) -> i32 {\n    if k <= 1 {\n        return 0;\n    }\n    let window = k as usize;\n    let mut a = nums.clone();\n    a.sort();\n    let mut best: i32 = -1;\n    let mut i = 0usize;\n    while i + window <= a.len() {\n        let d = a[i + window - 1] - a[i];\n        if best < 0 || d < best {\n            best = d;\n        }\n        i += 1;\n    }\n    best\n}`,

        php: `function minimumDifference($nums, $k) {\n    if ($k <= 1) return 0;\n    $a = $nums;\n    sort($a);\n    $best = -1;\n    $n = count($a);\n    for ($i = 0; $i + $k <= $n; $i++) {\n        $d = $a[$i + $k - 1] - $a[$i];\n        if ($best < 0 || $d < $best) $best = $d;\n    }\n    return $best;\n}`,

        ruby: `def minimumDifference(nums, k)\n  return 0 if k <= 1\n  a = nums.sort\n  best = -1\n  i = 0\n  while i + k <= a.length\n    d = a[i + k - 1] - a[i]\n    best = d if best < 0 || d < best\n    i += 1\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Array Partition ─────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const a = nums.slice().sort((x, y) => x - y);
      let sum = 0;
      for (let i = 0; i < a.length; i += 2) sum += a[i];
      return sum;
    };
    return {
      slug: "array-partition",
      title: "Array Partition",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Sorting", "Counting Sort", "Amazon", "Google"],
      signature: { funcName: "arrayPairSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` of `2n` integers, group them into `n` pairs so that the sum of `min(a, b)` over all pairs is as **large** as possible.\n\nReturn that maximised sum.",
        [
          { in: "nums = [1,4,3,2]", out: "4", note: "Pairing (1,2) and (3,4) gives 1 + 3 = 4." },
          { in: "nums = [6,2,6,5,1,2]", out: "9", note: "(2,1), (2,5) and (6,6) give 1 + 2 + 6 = 9." },
          { in: "nums = [1,1]", out: "1" },
        ],
        ["2 <= nums.length <= 40", "nums.length is even.", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "Every pair throws away its larger element, so you want the discarded halves to be as small as possible.",
        "Sorting and pairing neighbours achieves that: each element is wasted against the value nearest above it.",
        "The answer is then the sum of every element at an even index.",
      ],
      examples: [
        { input: "[1,4,3,2]", expectedOutput: "4" },
        { input: "[6,2,6,5,1,2]", expectedOutput: "9" },
        { input: "[1,1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, 2 * ri(rng, 1, 20), -1000, 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def arrayPairSum(nums) -> int:\n    a = sorted(nums)\n    return sum(a[::2])`,
        javascript: `var arrayPairSum = function(nums) {\n    const a = nums.slice().sort(function(x, y) { return x - y; });\n    let sum = 0;\n    for (let i = 0; i < a.length; i += 2) sum += a[i];\n    return sum;\n};`,

        typescript: `function arrayPairSum(nums: number[]): number {\n    var a = nums.slice();\n    a.sort(function (x, y) { return x - y; });\n    var sum = 0;\n    for (var i = 0; i < a.length; i += 2) sum += a[i];\n    return sum;\n}`,

        java: `public static int arrayPairSum(int[] nums) {\n    int[] a = Arrays.copyOf(nums, nums.length);\n    Arrays.sort(a);\n    int sum = 0;\n    for (int i = 0; i < a.length; i += 2) sum += a[i];\n    return sum;\n}`,

        cpp: `int arrayPairSum(vector<int>& nums) {\n    vector<int> a = nums;\n    sort(a.begin(), a.end());\n    int sum = 0;\n    for (size_t i = 0; i < a.size(); i += 2) sum += a[i];\n    return sum;\n}`,

        c: `int arrayPairSum(int* nums, int numsSize) {\n    int* a = (int*) malloc(sizeof(int) * numsSize);\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    for (int i = 1; i < numsSize; i++) {\n        int key = a[i];\n        int j = i - 1;\n        while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }\n        a[j + 1] = key;\n    }\n    int sum = 0;\n    for (int i = 0; i < numsSize; i += 2) sum += a[i];\n    free(a);\n    return sum;\n}`,

        csharp: `public static int ArrayPairSum(int[] nums)\n{\n    int[] a = (int[]) nums.Clone();\n    Array.Sort(a);\n    int sum = 0;\n    for (int i = 0; i < a.Length; i += 2) sum += a[i];\n    return sum;\n}`,

        go: `func arrayPairSum(nums []int) int {\n	a := make([]int, len(nums))\n	copy(a, nums)\n	sort.Ints(a)\n	sum := 0\n	for i := 0; i < len(a); i += 2 {\n		sum += a[i]\n	}\n	return sum\n}`,

        kotlin: `fun arrayPairSum(nums: IntArray): Int {\n    val a = nums.copyOf()\n    a.sort()\n    var sum = 0\n    var i = 0\n    while (i < a.size) {\n        sum += a[i]\n        i += 2\n    }\n    return sum\n}`,

        swift: `func arrayPairSum(_ nums: [Int]) -> Int {\n    let a = nums.sorted()\n    var sum = 0\n    var i = 0\n    while i < a.count {\n        sum += a[i]\n        i += 2\n    }\n    return sum\n}`,

        rust: `fn arrayPairSum(nums: Vec<i32>) -> i32 {\n    let mut a = nums.clone();\n    a.sort();\n    let mut sum = 0;\n    let mut i = 0usize;\n    while i < a.len() {\n        sum += a[i];\n        i += 2;\n    }\n    sum\n}`,

        php: `function arrayPairSum($nums) {\n    $a = $nums;\n    sort($a);\n    $sum = 0;\n    $n = count($a);\n    for ($i = 0; $i < $n; $i += 2) $sum += $a[$i];\n    return $sum;\n}`,

        ruby: `def arrayPairSum(nums)\n  a = nums.sort\n  sum = 0\n  i = 0\n  while i < a.length\n    sum += a[i]\n    i += 2\n  end\n  sum\nend`,
      },
    };
  })(),

  // ── Maximum Product of Two Elements in an Array ─────────────────
  (() => {
    const ref = (nums: number[]) => {
      let first = -1, second = -1;
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] > first) { second = first; first = nums[i]; }
        else if (nums[i] > second) second = nums[i];
      }
      return (first - 1) * (second - 1);
    };
    return {
      slug: "maximum-product-of-two-elements-in-an-array",
      title: "Maximum Product of Two Elements in an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Heap", "Amazon", "Adobe"],
      signature: { funcName: "maxProduct", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given the array of integers `nums`, choose two **different indices** `i` and `j` and maximise `(nums[i] - 1) * (nums[j] - 1)`.\n\nReturn that maximum value.",
        [
          { in: "nums = [3,4,5,2]", out: "12", note: "Picking 5 and 4 gives (5-1)×(4-1) = 12." },
          { in: "nums = [1,5,4,5]", out: "16", note: "The two 5s sit at different indices." },
          { in: "nums = [3,7]", out: "12" },
        ],
        ["2 <= nums.length <= 40", "1 <= nums[i] <= 1000"]),
      hints: [
        "All values are at least 1, so `(x - 1)` is never negative — the two largest values win.",
        "One pass carrying the largest and second largest is enough; no sort required.",
        "Duplicated maxima are fine, since the indices only have to differ.",
      ],
      examples: [
        { input: "[3,4,5,2]", expectedOutput: "12" },
        { input: "[1,5,4,5]", expectedOutput: "16" },
        { input: "[3,7]", expectedOutput: "12" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 2, 40), 1, 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def maxProduct(nums) -> int:\n    first = second = -1\n    for x in nums:\n        if x > first:\n            first, second = x, first\n        elif x > second:\n            second = x\n    return (first - 1) * (second - 1)`,
        javascript: `var maxProduct = function(nums) {\n    let first = -1, second = -1;\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] > first) {\n            second = first;\n            first = nums[i];\n        } else if (nums[i] > second) {\n            second = nums[i];\n        }\n    }\n    return (first - 1) * (second - 1);\n};`,

        typescript: `function maxProduct(nums: number[]): number {\n    var first = -1;\n    var second = -1;\n    for (var i = 0; i < nums.length; i++) {\n        if (nums[i] > first) {\n            second = first;\n            first = nums[i];\n        } else if (nums[i] > second) {\n            second = nums[i];\n        }\n    }\n    return (first - 1) * (second - 1);\n}`,

        java: `public static int maxProduct(int[] nums) {\n    int first = -1, second = -1;\n    for (int x : nums) {\n        if (x > first) {\n            second = first;\n            first = x;\n        } else if (x > second) {\n            second = x;\n        }\n    }\n    return (first - 1) * (second - 1);\n}`,

        cpp: `int maxProduct(vector<int>& nums) {\n    int first = -1, second = -1;\n    for (int x : nums) {\n        if (x > first) {\n            second = first;\n            first = x;\n        } else if (x > second) {\n            second = x;\n        }\n    }\n    return (first - 1) * (second - 1);\n}`,

        c: `int maxProduct(int* nums, int numsSize) {\n    int first = -1, second = -1;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] > first) {\n            second = first;\n            first = nums[i];\n        } else if (nums[i] > second) {\n            second = nums[i];\n        }\n    }\n    return (first - 1) * (second - 1);\n}`,

        csharp: `public static int MaxProduct(int[] nums)\n{\n    int first = -1, second = -1;\n    foreach (int x in nums)\n    {\n        if (x > first)\n        {\n            second = first;\n            first = x;\n        }\n        else if (x > second)\n        {\n            second = x;\n        }\n    }\n    return (first - 1) * (second - 1);\n}`,

        go: `func maxProduct(nums []int) int {\n	first, second := -1, -1\n	for _, x := range nums {\n		if x > first {\n			second = first\n			first = x\n		} else if x > second {\n			second = x\n		}\n	}\n	return (first - 1) * (second - 1)\n}`,

        kotlin: `fun maxProduct(nums: IntArray): Int {\n    var first = -1\n    var second = -1\n    for (x in nums) {\n        if (x > first) {\n            second = first\n            first = x\n        } else if (x > second) {\n            second = x\n        }\n    }\n    return (first - 1) * (second - 1)\n}`,

        swift: `func maxProduct(_ nums: [Int]) -> Int {\n    var first = -1\n    var second = -1\n    for x in nums {\n        if x > first {\n            second = first\n            first = x\n        } else if x > second {\n            second = x\n        }\n    }\n    return (first - 1) * (second - 1)\n}`,

        rust: `fn maxProduct(nums: Vec<i32>) -> i32 {\n    let mut first = -1;\n    let mut second = -1;\n    for x in nums.iter() {\n        if *x > first {\n            second = first;\n            first = *x;\n        } else if *x > second {\n            second = *x;\n        }\n    }\n    (first - 1) * (second - 1)\n}`,

        php: `function maxProduct($nums) {\n    $first = -1;\n    $second = -1;\n    foreach ($nums as $x) {\n        if ($x > $first) {\n            $second = $first;\n            $first = $x;\n        } else if ($x > $second) {\n            $second = $x;\n        }\n    }\n    return ($first - 1) * ($second - 1);\n}`,

        ruby: `def maxProduct(nums)\n  first = -1\n  second = -1\n  nums.each do |x|\n    if x > first\n      second = first\n      first = x\n    elsif x > second\n      second = x\n    end\n  end\n  (first - 1) * (second - 1)\nend`,
      },
    };
  })(),

  // ── Three Consecutive Odds ──────────────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      let run = 0;
      for (let i = 0; i < arr.length; i++) {
        run = arr[i] % 2 !== 0 ? run + 1 : 0;
        if (run >= 3) return true;
      }
      return false;
    };
    return {
      slug: "three-consecutive-odds",
      title: "Three Consecutive Odds",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "TCS"],
      signature: { funcName: "threeConsecutiveOdds", params: [{ name: "arr", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Given an integer array `arr`, return `true` if there are three **consecutive** odd numbers in the array.",
        [
          { in: "arr = [2,6,4,1]", out: "false" },
          { in: "arr = [1,2,34,3,4,5,7,23,12]", out: "true", note: "The run 5, 7, 23 is three odds in a row." },
          { in: "arr = [1,1,1]", out: "true" },
        ],
        ["1 <= arr.length <= 40", "1 <= arr[i] <= 1000"]),
      hints: [
        "Carry a run length that grows on an odd number and resets to zero on an even one.",
        "Return as soon as the run reaches three.",
      ],
      examples: [
        { input: "[2,6,4,1]", expectedOutput: "false" },
        { input: "[1,2,34,3,4,5,7,23,12]", expectedOutput: "true" },
        { input: "[1,1,1]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const arr = Array.from({ length: ri(rng, 1, 40) }, () => (rng() < 0.55 ? 2 * ri(rng, 1, 500) - 1 : 2 * ri(rng, 1, 500)));
        return { input: fmtIntArr(arr), expectedOutput: bool(ref(arr)) };
      },
      solutions: {
        python: `def threeConsecutiveOdds(arr) -> bool:\n    run = 0\n    for x in arr:\n        run = run + 1 if x % 2 else 0\n        if run >= 3:\n            return True\n    return False`,
        javascript: `var threeConsecutiveOdds = function(arr) {\n    let run = 0;\n    for (let i = 0; i < arr.length; i++) {\n        run = arr[i] % 2 !== 0 ? run + 1 : 0;\n        if (run >= 3) return true;\n    }\n    return false;\n};`,

        typescript: `function threeConsecutiveOdds(arr: number[]): boolean {\n    var run = 0;\n    for (var i = 0; i < arr.length; i++) {\n        run = arr[i] % 2 !== 0 ? run + 1 : 0;\n        if (run >= 3) return true;\n    }\n    return false;\n}`,

        java: `public static boolean threeConsecutiveOdds(int[] arr) {\n    int run = 0;\n    for (int x : arr) {\n        run = x % 2 != 0 ? run + 1 : 0;\n        if (run >= 3) return true;\n    }\n    return false;\n}`,

        cpp: `bool threeConsecutiveOdds(vector<int>& arr) {\n    int run = 0;\n    for (int x : arr) {\n        run = x % 2 != 0 ? run + 1 : 0;\n        if (run >= 3) return true;\n    }\n    return false;\n}`,

        c: `bool threeConsecutiveOdds(int* arr, int arrSize) {\n    int run = 0;\n    for (int i = 0; i < arrSize; i++) {\n        run = arr[i] % 2 != 0 ? run + 1 : 0;\n        if (run >= 3) return true;\n    }\n    return false;\n}`,

        csharp: `public static bool ThreeConsecutiveOdds(int[] arr)\n{\n    int run = 0;\n    foreach (int x in arr)\n    {\n        run = x % 2 != 0 ? run + 1 : 0;\n        if (run >= 3) return true;\n    }\n    return false;\n}`,

        go: `func threeConsecutiveOdds(arr []int) bool {\n	run := 0\n	for _, x := range arr {\n		if x%2 != 0 {\n			run++\n		} else {\n			run = 0\n		}\n		if run >= 3 {\n			return true\n		}\n	}\n	return false\n}`,

        kotlin: `fun threeConsecutiveOdds(arr: IntArray): Boolean {\n    var run = 0\n    for (x in arr) {\n        run = if (x % 2 != 0) run + 1 else 0\n        if (run >= 3) return true\n    }\n    return false\n}`,

        swift: `func threeConsecutiveOdds(_ arr: [Int]) -> Bool {\n    var run = 0\n    for x in arr {\n        run = x % 2 != 0 ? run + 1 : 0\n        if run >= 3 { return true }\n    }\n    return false\n}`,

        rust: `fn threeConsecutiveOdds(arr: Vec<i32>) -> bool {\n    let mut run = 0;\n    for x in arr.iter() {\n        run = if *x % 2 != 0 { run + 1 } else { 0 };\n        if run >= 3 {\n            return true;\n        }\n    }\n    false\n}`,

        php: `function threeConsecutiveOdds($arr) {\n    $run = 0;\n    foreach ($arr as $x) {\n        $run = $x % 2 !== 0 ? $run + 1 : 0;\n        if ($run >= 3) return true;\n    }\n    return false;\n}`,

        ruby: `def threeConsecutiveOdds(arr)\n  run = 0\n  arr.each do |x|\n    run = x.odd? ? run + 1 : 0\n    return true if run >= 3\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Count Good Triplets ─────────────────────────────────────────
  (() => {
    const ref = (arr: number[], a: number, b: number, c: number) => {
      let count = 0;
      const n = arr.length;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (Math.abs(arr[i] - arr[j]) > a) continue;
          for (let k = j + 1; k < n; k++) {
            if (Math.abs(arr[j] - arr[k]) <= b && Math.abs(arr[i] - arr[k]) <= c) count++;
          }
        }
      }
      return count;
    };
    return {
      slug: "count-good-triplets",
      title: "Count Good Triplets",
      difficulty: "EASY" as const,
      tags: ["Array", "Enumeration", "Amazon", "Adobe"],
      signature: { funcName: "countGoodTriplets", params: [{ name: "arr", type: "int[]" as const }, { name: "a", type: "int" as const }, { name: "b", type: "int" as const }, { name: "c", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an array of integers `arr` and three integers `a`, `b` and `c`, count the **good triplets**.\n\nA triplet `(arr[i], arr[j], arr[k])` is good when `0 <= i < j < k < arr.length` and all three hold:\n\n- `abs(arr[i] - arr[j]) <= a`\n- `abs(arr[j] - arr[k]) <= b`\n- `abs(arr[i] - arr[k]) <= c`",
        [
          { in: "arr = [3,0,1,1,9,7], a = 7, b = 2, c = 3", out: "4" },
          { in: "arr = [1,1,2,2,3], a = 0, b = 0, c = 1", out: "0" },
          { in: "arr = [1,1,1], a = 0, b = 0, c = 0", out: "1" },
        ],
        ["3 <= arr.length <= 15", "0 <= arr[i] <= 1000", "0 <= a, b, c <= 1000"]),
      hints: [
        "The array is small enough that the triple loop is intended.",
        "Check the `i, j` condition in the middle loop and skip early — that prunes most of the inner loop's work.",
      ],
      examples: [
        { input: "[3,0,1,1,9,7]\n7\n2\n3", expectedOutput: "4" },
        { input: "[1,1,2,2,3]\n0\n0\n1", expectedOutput: "0" },
        { input: "[1,1,1]\n0\n0\n0", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const arr = randArr(rng, ri(rng, 3, 15), 0, rng() < 0.5 ? 20 : 1000);
        const a = ri(rng, 0, rng() < 0.5 ? 10 : 1000);
        const b = ri(rng, 0, rng() < 0.5 ? 10 : 1000);
        const c = ri(rng, 0, rng() < 0.5 ? 10 : 1000);
        return { input: `${fmtIntArr(arr)}\n${a}\n${b}\n${c}`, expectedOutput: String(ref(arr, a, b, c)) };
      },
      solutions: {
        python: `def countGoodTriplets(arr, a: int, b: int, c: int) -> int:\n    n = len(arr)\n    count = 0\n    for i in range(n):\n        for j in range(i + 1, n):\n            if abs(arr[i] - arr[j]) > a:\n                continue\n            for k in range(j + 1, n):\n                if abs(arr[j] - arr[k]) <= b and abs(arr[i] - arr[k]) <= c:\n                    count += 1\n    return count`,
        javascript: `var countGoodTriplets = function(arr, a, b, c) {\n    const n = arr.length;\n    let count = 0;\n    for (let i = 0; i < n; i++) {\n        for (let j = i + 1; j < n; j++) {\n            if (Math.abs(arr[i] - arr[j]) > a) continue;\n            for (let k = j + 1; k < n; k++) {\n                if (Math.abs(arr[j] - arr[k]) <= b && Math.abs(arr[i] - arr[k]) <= c) count++;\n            }\n        }\n    }\n    return count;\n};`,

        typescript: `function countGoodTriplets(arr: number[], a: number, b: number, c: number): number {\n    var n = arr.length;\n    var count = 0;\n    for (var i = 0; i < n; i++) {\n        for (var j = i + 1; j < n; j++) {\n            if (Math.abs(arr[i] - arr[j]) > a) continue;\n            for (var k = j + 1; k < n; k++) {\n                if (Math.abs(arr[j] - arr[k]) <= b && Math.abs(arr[i] - arr[k]) <= c) count++;\n            }\n        }\n    }\n    return count;\n}`,

        java: `public static int countGoodTriplets(int[] arr, int a, int b, int c) {\n    int n = arr.length;\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = i + 1; j < n; j++) {\n            if (Math.abs(arr[i] - arr[j]) > a) continue;\n            for (int k = j + 1; k < n; k++) {\n                if (Math.abs(arr[j] - arr[k]) <= b && Math.abs(arr[i] - arr[k]) <= c) count++;\n            }\n        }\n    }\n    return count;\n}`,

        cpp: `int countGoodTriplets(vector<int>& arr, int a, int b, int c) {\n    int n = (int) arr.size();\n    int count = 0;\n    for (int i = 0; i < n; i++) {\n        for (int j = i + 1; j < n; j++) {\n            if (abs(arr[i] - arr[j]) > a) continue;\n            for (int k = j + 1; k < n; k++) {\n                if (abs(arr[j] - arr[k]) <= b && abs(arr[i] - arr[k]) <= c) count++;\n            }\n        }\n    }\n    return count;\n}`,

        c: `int countGoodTriplets(int* arr, int arrSize, int a, int b, int c) {\n    int count = 0;\n    for (int i = 0; i < arrSize; i++) {\n        for (int j = i + 1; j < arrSize; j++) {\n            int d1 = arr[i] - arr[j];\n            if (d1 < 0) d1 = -d1;\n            if (d1 > a) continue;\n            for (int k = j + 1; k < arrSize; k++) {\n                int d2 = arr[j] - arr[k];\n                if (d2 < 0) d2 = -d2;\n                int d3 = arr[i] - arr[k];\n                if (d3 < 0) d3 = -d3;\n                if (d2 <= b && d3 <= c) count++;\n            }\n        }\n    }\n    return count;\n}`,

        csharp: `public static int CountGoodTriplets(int[] arr, int a, int b, int c)\n{\n    int n = arr.Length;\n    int count = 0;\n    for (int i = 0; i < n; i++)\n    {\n        for (int j = i + 1; j < n; j++)\n        {\n            if (Math.Abs(arr[i] - arr[j]) > a) continue;\n            for (int k = j + 1; k < n; k++)\n            {\n                if (Math.Abs(arr[j] - arr[k]) <= b && Math.Abs(arr[i] - arr[k]) <= c) count++;\n            }\n        }\n    }\n    return count;\n}`,

        go: `func countGoodTriplets(arr []int, a int, b int, c int) int {\n	abs := func(x int) int {\n		if x < 0 {\n			return -x\n		}\n		return x\n	}\n	n := len(arr)\n	count := 0\n	for i := 0; i < n; i++ {\n		for j := i + 1; j < n; j++ {\n			if abs(arr[i]-arr[j]) > a {\n				continue\n			}\n			for k := j + 1; k < n; k++ {\n				if abs(arr[j]-arr[k]) <= b && abs(arr[i]-arr[k]) <= c {\n					count++\n				}\n			}\n		}\n	}\n	return count\n}`,

        kotlin: `fun countGoodTriplets(arr: IntArray, a: Int, b: Int, c: Int): Int {\n    val n = arr.size\n    var count = 0\n    for (i in 0 until n) {\n        for (j in i + 1 until n) {\n            if (Math.abs(arr[i] - arr[j]) > a) continue\n            for (k in j + 1 until n) {\n                if (Math.abs(arr[j] - arr[k]) <= b && Math.abs(arr[i] - arr[k]) <= c) count++\n            }\n        }\n    }\n    return count\n}`,

        swift: `func countGoodTriplets(_ arr: [Int], _ a: Int, _ b: Int, _ c: Int) -> Int {\n    let n = arr.count\n    var count = 0\n    for i in 0..<n {\n        for j in (i + 1)..<n {\n            if abs(arr[i] - arr[j]) > a { continue }\n            for k in (j + 1)..<n {\n                if abs(arr[j] - arr[k]) <= b && abs(arr[i] - arr[k]) <= c { count += 1 }\n            }\n        }\n    }\n    return count\n}`,

        rust: `fn countGoodTriplets(arr: Vec<i32>, a: i32, b: i32, c: i32) -> i32 {\n    let n = arr.len();\n    let mut count = 0;\n    for i in 0..n {\n        for j in (i + 1)..n {\n            if (arr[i] - arr[j]).abs() > a {\n                continue;\n            }\n            for k in (j + 1)..n {\n                if (arr[j] - arr[k]).abs() <= b && (arr[i] - arr[k]).abs() <= c {\n                    count += 1;\n                }\n            }\n        }\n    }\n    count\n}`,

        php: `function countGoodTriplets($arr, $a, $b, $c) {\n    $n = count($arr);\n    $count = 0;\n    for ($i = 0; $i < $n; $i++) {\n        for ($j = $i + 1; $j < $n; $j++) {\n            if (abs($arr[$i] - $arr[$j]) > $a) continue;\n            for ($k = $j + 1; $k < $n; $k++) {\n                if (abs($arr[$j] - $arr[$k]) <= $b && abs($arr[$i] - $arr[$k]) <= $c) $count++;\n            }\n        }\n    }\n    return $count;\n}`,

        ruby: `def countGoodTriplets(arr, a, b, c)\n  n = arr.length\n  count = 0\n  (0...n).each do |i|\n    ((i + 1)...n).each do |j|\n      next if (arr[i] - arr[j]).abs > a\n      ((j + 1)...n).each do |k|\n        count += 1 if (arr[j] - arr[k]).abs <= b && (arr[i] - arr[k]).abs <= c\n      end\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Special Array With X Elements Greater Than or Equal X ───────
  (() => {
    const ref = (nums: number[]) => {
      for (let x = 0; x <= nums.length; x++) {
        let count = 0;
        for (let i = 0; i < nums.length; i++) if (nums[i] >= x) count++;
        if (count === x) return x;
      }
      return -1;
    };
    return {
      slug: "special-array-with-x-elements-greater-than-or-equal-x",
      title: "Special Array With X Elements Greater Than or Equal X",
      difficulty: "EASY" as const,
      tags: ["Array", "Binary Search", "Sorting", "Counting Sort", "Amazon", "Google"],
      signature: { funcName: "specialArray", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An array `nums` is **special** if there exists a number `x` such that exactly `x` elements of `nums` are **greater than or equal to** `x`. Note that `x` itself need not be an element of `nums`.\n\nReturn that `x` if the array is special, otherwise return `-1`. It can be proved that at most one such `x` exists.",
        [
          { in: "nums = [3,5]", out: "2", note: "Two elements are at least 2." },
          { in: "nums = [0,0]", out: "-1" },
          { in: "nums = [0,4,3,0,4]", out: "3", note: "Three elements are at least 3." },
        ],
        ["1 <= nums.length <= 40", "0 <= nums[i] <= 1000"]),
      hints: [
        "`x` can never exceed the array's length, so only `0 … n` are worth testing.",
        "For each candidate, count how many elements clear the bar and check for equality.",
        "Sorting first turns the count into a binary search, giving O(n log n).",
      ],
      examples: [
        { input: "[3,5]", expectedOutput: "2" },
        { input: "[0,0]", expectedOutput: "-1" },
        { input: "[0,4,3,0,4]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 0, rng() < 0.6 ? 12 : 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def specialArray(nums) -> int:\n    for x in range(len(nums) + 1):\n        if sum(1 for v in nums if v >= x) == x:\n            return x\n    return -1`,
        javascript: `var specialArray = function(nums) {\n    for (let x = 0; x <= nums.length; x++) {\n        let count = 0;\n        for (let i = 0; i < nums.length; i++) {\n            if (nums[i] >= x) count++;\n        }\n        if (count === x) return x;\n    }\n    return -1;\n};`,
              typescript: `function specialArray(nums: number[]): number {\n    for (var x = 0; x <= nums.length; x++) {\n        var count = 0;\n        for (var i = 0; i < nums.length; i++) {\n            if (nums[i] >= x) count++;\n        }\n        if (count === x) return x;\n    }\n    return -1;\n}`,
              java: `public static int specialArray(int[] nums) {\n    for (int x = 0; x <= nums.length; x++) {\n        int count = 0;\n        for (int v : nums) {\n            if (v >= x) count++;\n        }\n        if (count == x) return x;\n    }\n    return -1;\n}`,
              cpp: `int specialArray(vector<int>& nums) {\n    for (int x = 0; x <= (int) nums.size(); x++) {\n        int count = 0;\n        for (int v : nums) {\n            if (v >= x) count++;\n        }\n        if (count == x) return x;\n    }\n    return -1;\n}`,
              c: `int specialArray(int* nums, int numsSize) {\n    for (int x = 0; x <= numsSize; x++) {\n        int count = 0;\n        for (int i = 0; i < numsSize; i++) {\n            if (nums[i] >= x) count++;\n        }\n        if (count == x) return x;\n    }\n    return -1;\n}`,
              csharp: `public static int SpecialArray(int[] nums)\n{\n    for (int x = 0; x <= nums.Length; x++)\n    {\n        int count = 0;\n        foreach (int v in nums)\n        {\n            if (v >= x) count++;\n        }\n        if (count == x) return x;\n    }\n    return -1;\n}`,
              go: `func specialArray(nums []int) int {\n	for x := 0; x <= len(nums); x++ {\n		count := 0\n		for _, v := range nums {\n			if v >= x {\n				count++\n			}\n		}\n		if count == x {\n			return x\n		}\n	}\n	return -1\n}`,
              kotlin: `fun specialArray(nums: IntArray): Int {\n    for (x in 0..nums.size) {\n        var count = 0\n        for (v in nums) {\n            if (v >= x) count++\n        }\n        if (count == x) return x\n    }\n    return -1\n}`,
              swift: `func specialArray(_ nums: [Int]) -> Int {\n    for x in 0...nums.count {\n        var count = 0\n        for v in nums where v >= x { count += 1 }\n        if count == x { return x }\n    }\n    return -1\n}`,
              rust: `fn specialArray(nums: Vec<i32>) -> i32 {\n    for x in 0..=(nums.len() as i32) {\n        let mut count = 0;\n        for v in nums.iter() {\n            if *v >= x {\n                count += 1;\n            }\n        }\n        if count == x {\n            return x;\n        }\n    }\n    -1\n}`,
              php: `function specialArray($nums) {\n    $n = count($nums);\n    for ($x = 0; $x <= $n; $x++) {\n        $count = 0;\n        foreach ($nums as $v) {\n            if ($v >= $x) $count++;\n        }\n        if ($count === $x) return $x;\n    }\n    return -1;\n}`,
              ruby: `def specialArray(nums)\n  (0..nums.length).each do |x|\n    count = nums.count { |v| v >= x }\n    return x if count == x\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Rearrange Spaces Between Words ──────────────────────────────
  (() => {
    const ref = (text: string) => {
      const words = text.split(" ").filter((w) => w.length > 0);
      let spaces = 0;
      for (let i = 0; i < text.length; i++) if (text[i] === " ") spaces++;
      if (words.length === 1) return words[0] + " ".repeat(spaces);
      const between = Math.floor(spaces / (words.length - 1));
      const extra = spaces - between * (words.length - 1);
      return words.join(" ".repeat(between)) + " ".repeat(extra);
    };
    return {
      slug: "rearrange-spaces-between-words",
      title: "Rearrange Spaces Between Words",
      difficulty: "EASY" as const,
      tags: ["String", "Google", "Amazon"],
      signature: { funcName: "reorderSpaces", params: [{ name: "text", type: "string" as const }], returns: "string" as const },
      description: describe(
        "You are given a string `text` of words separated by spaces, with at least one word.\n\nRearrange the spaces so that there is an **equal** number between every pair of adjacent words, using as many spaces as possible. Any leftover spaces go at the **end**. The words themselves keep their order.\n\nIf there is only one word, all the spaces go after it.",
        [
          { in: 'text = "  this   is  a sentence "', out: "this   is   a   sentence", note: "Nine spaces spread evenly across three gaps." },
          { in: 'text = " practice   makes   perfect"', out: "practice   makes   perfect ", note: "Seven spaces give three per gap with one left over at the end." },
          { in: 'text = "hello   "', out: "hello   ", note: "One word, so every space trails it." },
        ],
        ["1 <= text.length <= 60", "text consists of lowercase English letters and spaces.", "text contains at least one word."]),
      hints: [
        "Count the total spaces first — that budget never changes.",
        "With `w` words there are `w - 1` gaps; each gets `spaces / (w - 1)` and the remainder trails the last word.",
        "A single word is the special case: there are no gaps, so all the spaces trail.",
      ],
      examples: [
        { input: '"  this   is  a sentence "', expectedOutput: "this   is   a   sentence" },
        { input: '" practice   makes   perfect"', expectedOutput: "practice   makes   perfect " },
        { input: '"hello   "', expectedOutput: "hello   " },
      ],
      gen: (rng: Rng) => {
        const words = ["this", "is", "a", "code", "kata", "go", "now"];
        const n = ri(rng, 1, 5);
        const parts: string[] = [];
        if (rng() < 0.4) parts.push("");
        for (let i = 0; i < n; i++) {
          parts.push(words[ri(rng, 0, words.length - 1)]);
          const gap = ri(rng, 1, 3);
          for (let g = 1; g < gap; g++) parts.push("");
        }
        if (rng() < 0.5) parts.push("");
        let text = parts.join(" ").slice(0, 60);
        if (text.trim().length === 0) text = "code ";
        return { input: `"${text}"`, expectedOutput: ref(text) };
      },
      solutions: {
        python: `def reorderSpaces(text: str) -> str:\n    words = text.split()\n    spaces = text.count(" ")\n    if len(words) == 1:\n        return words[0] + " " * spaces\n    between = spaces // (len(words) - 1)\n    extra = spaces - between * (len(words) - 1)\n    return (" " * between).join(words) + " " * extra`,
        javascript: `var reorderSpaces = function(text) {\n    const words = text.split(" ").filter(function(w) { return w.length > 0; });\n    let spaces = 0;\n    for (let i = 0; i < text.length; i++) {\n        if (text[i] === " ") spaces++;\n    }\n    const pad = function(n) {\n        let s = "";\n        for (let i = 0; i < n; i++) s += " ";\n        return s;\n    };\n    if (words.length === 1) return words[0] + pad(spaces);\n    const between = Math.floor(spaces / (words.length - 1));\n    const extra = spaces - between * (words.length - 1);\n    return words.join(pad(between)) + pad(extra);\n};`,
              typescript: `function reorderSpaces(text: string): string {\n    var words: string[] = [];\n    var pieces = text.split(" ");\n    for (var i = 0; i < pieces.length; i++) {\n        if (pieces[i].length > 0) words.push(pieces[i]);\n    }\n    var spaces = 0;\n    for (var j = 0; j < text.length; j++) {\n        if (text.charAt(j) === " ") spaces++;\n    }\n    var pad = function (n: number): string {\n        var s = "";\n        for (var k = 0; k < n; k++) s += " ";\n        return s;\n    };\n    if (words.length === 1) return words[0] + pad(spaces);\n    var between = Math.floor(spaces / (words.length - 1));\n    var extra = spaces - between * (words.length - 1);\n    return words.join(pad(between)) + pad(extra);\n}`,
              java: `public static String reorderSpaces(String text) {\n    List<String> words = new ArrayList<>();\n    for (String w : text.split(" ")) {\n        if (w.length() > 0) words.add(w);\n    }\n    int spaces = 0;\n    for (int i = 0; i < text.length(); i++) {\n        if (text.charAt(i) == ' ') spaces++;\n    }\n    StringBuilder out = new StringBuilder();\n    if (words.size() == 1) {\n        out.append(words.get(0));\n        for (int i = 0; i < spaces; i++) out.append(' ');\n        return out.toString();\n    }\n    int between = spaces / (words.size() - 1);\n    int extra = spaces - between * (words.size() - 1);\n    for (int i = 0; i < words.size(); i++) {\n        if (i > 0) {\n            for (int k = 0; k < between; k++) out.append(' ');\n        }\n        out.append(words.get(i));\n    }\n    for (int i = 0; i < extra; i++) out.append(' ');\n    return out.toString();\n}`,
              cpp: `string reorderSpaces(string text) {\n    vector<string> words;\n    string cur = "";\n    int spaces = 0;\n    for (char c : text) {\n        if (c == ' ') {\n            spaces++;\n            if (!cur.empty()) { words.push_back(cur); cur = ""; }\n        } else {\n            cur += c;\n        }\n    }\n    if (!cur.empty()) words.push_back(cur);\n    if (words.size() == 1) return words[0] + string(spaces, ' ');\n    int between = spaces / ((int) words.size() - 1);\n    int extra = spaces - between * ((int) words.size() - 1);\n    string out = "";\n    for (size_t i = 0; i < words.size(); i++) {\n        if (i > 0) out += string(between, ' ');\n        out += words[i];\n    }\n    out += string(extra, ' ');\n    return out;\n}`,
              c: `char* reorderSpaces(const char* text) {\n    int n = (int) strlen(text);\n    int spaces = 0;\n    for (int i = 0; i < n; i++) {\n        if (text[i] == ' ') spaces++;\n    }\n    int starts[64];\n    int lens[64];\n    int wordCount = 0;\n    int i = 0;\n    while (i < n) {\n        while (i < n && text[i] == ' ') i++;\n        if (i >= n) break;\n        int start = i;\n        while (i < n && text[i] != ' ') i++;\n        starts[wordCount] = start;\n        lens[wordCount] = i - start;\n        wordCount++;\n    }\n    char* out = (char*) malloc(n + 1);\n    int pos = 0;\n    int between = wordCount > 1 ? spaces / (wordCount - 1) : 0;\n    int extra = wordCount > 1 ? spaces - between * (wordCount - 1) : spaces;\n    for (int w = 0; w < wordCount; w++) {\n        if (w > 0) {\n            for (int k = 0; k < between; k++) out[pos++] = ' ';\n        }\n        for (int k = 0; k < lens[w]; k++) out[pos++] = text[starts[w] + k];\n    }\n    for (int k = 0; k < extra; k++) out[pos++] = ' ';\n    out[pos] = '\\0';\n    return out;\n}`,
              csharp: `public static string ReorderSpaces(string text)\n{\n    var words = new List<string>();\n    foreach (string w in text.Split(' '))\n    {\n        if (w.Length > 0) words.Add(w);\n    }\n    int spaces = 0;\n    foreach (char c in text)\n    {\n        if (c == ' ') spaces++;\n    }\n    if (words.Count == 1) return words[0] + new string(' ', spaces);\n    int between = spaces / (words.Count - 1);\n    int extra = spaces - between * (words.Count - 1);\n    return string.Join(new string(' ', between), words) + new string(' ', extra);\n}`,
              go: `func reorderSpaces(text string) string {\n	words := strings.Fields(text)\n	spaces := strings.Count(text, " ")\n	if len(words) == 1 {\n		return words[0] + strings.Repeat(" ", spaces)\n	}\n	between := spaces / (len(words) - 1)\n	extra := spaces - between*(len(words)-1)\n	return strings.Join(words, strings.Repeat(" ", between)) + strings.Repeat(" ", extra)\n}`,
              kotlin: `fun reorderSpaces(text: String): String {\n    val words = ArrayList<String>()\n    for (w in text.split(" ")) {\n        if (w.isNotEmpty()) words.add(w)\n    }\n    var spaces = 0\n    for (c in text) {\n        if (c == ' ') spaces++\n    }\n    if (words.size == 1) return words[0] + " ".repeat(spaces)\n    val between = spaces / (words.size - 1)\n    val extra = spaces - between * (words.size - 1)\n    return words.joinToString(" ".repeat(between)) + " ".repeat(extra)\n}`,
              swift: `func reorderSpaces(_ text: String) -> String {\n    let words = text.split(separator: " ").map { String($0) }\n    var spaces = 0\n    for c in text where c == " " { spaces += 1 }\n    if words.count == 1 {\n        return words[0] + String(repeating: " ", count: spaces)\n    }\n    let between = spaces / (words.count - 1)\n    let extra = spaces - between * (words.count - 1)\n    return words.joined(separator: String(repeating: " ", count: between)) + String(repeating: " ", count: extra)\n}`,
              rust: `fn reorderSpaces(text: String) -> String {\n    let words: Vec<&str> = text.split_whitespace().collect();\n    let spaces = text.chars().filter(|c| *c == ' ').count();\n    if words.len() == 1 {\n        return format!("{}{}", words[0], " ".repeat(spaces));\n    }\n    let between = spaces / (words.len() - 1);\n    let extra = spaces - between * (words.len() - 1);\n    format!("{}{}", words.join(&" ".repeat(between)), " ".repeat(extra))\n}`,
              php: `function reorderSpaces($text) {\n    $words = array();\n    foreach (explode(" ", $text) as $w) {\n        if (strlen($w) > 0) $words[] = $w;\n    }\n    $spaces = substr_count($text, " ");\n    if (count($words) === 1) return $words[0] . str_repeat(" ", $spaces);\n    $between = intdiv($spaces, count($words) - 1);\n    $extra = $spaces - $between * (count($words) - 1);\n    return implode(str_repeat(" ", $between), $words) . str_repeat(" ", $extra);\n}`,
              ruby: `def reorderSpaces(text)\n  words = text.split(" ")\n  spaces = text.count(" ")\n  return words[0] + " " * spaces if words.length == 1\n  between = spaces / (words.length - 1)\n  extra = spaces - between * (words.length - 1)\n  words.join(" " * between) + " " * extra\nend`,
      },
    };
  })(),

  // ── Maximum Product Difference Between Two Pairs ────────────────
  (() => {
    const ref = (nums: number[]) => {
      const a = nums.slice().sort((x, y) => x - y);
      const n = a.length;
      return a[n - 1] * a[n - 2] - a[0] * a[1];
    };
    return {
      slug: "maximum-product-difference-between-two-pairs",
      title: "Maximum Product Difference Between Two Pairs",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Sorting", "Amazon", "Adobe"],
      signature: { funcName: "maxProductDifference", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The **product difference** between two pairs `(a, b)` and `(c, d)` is `(a × b) - (c × d)`.\n\nGiven an integer array `nums`, choose four **distinct** indices forming two pairs so that the product difference is maximised, and return it.",
        [
          { in: "nums = [5,6,2,7,4]", out: "34", note: "(6 × 7) - (2 × 4) = 42 - 8." },
          { in: "nums = [4,2,5,9,7,4,8]", out: "64", note: "(9 × 8) - (2 × 4) = 72 - 8." },
          { in: "nums = [1,2,3,4]", out: "10" },
        ],
        ["4 <= nums.length <= 40", "1 <= nums[i] <= 1000"]),
      hints: [
        "All values are positive, so the first product is maximised by the two largest and the second minimised by the two smallest.",
        "Sorting makes both pairs immediate — or track the top two and bottom two in one pass.",
      ],
      examples: [
        { input: "[5,6,2,7,4]", expectedOutput: "34" },
        { input: "[4,2,5,9,7,4,8]", expectedOutput: "64" },
        { input: "[1,2,3,4]", expectedOutput: "10" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 4, 40), 1, 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def maxProductDifference(nums) -> int:\n    a = sorted(nums)\n    return a[-1] * a[-2] - a[0] * a[1]`,
        javascript: `var maxProductDifference = function(nums) {\n    const a = nums.slice().sort(function(x, y) { return x - y; });\n    const n = a.length;\n    return a[n - 1] * a[n - 2] - a[0] * a[1];\n};`,
              typescript: `function maxProductDifference(nums: number[]): number {\n    var a = nums.slice();\n    a.sort(function (x, y) { return x - y; });\n    var n = a.length;\n    return a[n - 1] * a[n - 2] - a[0] * a[1];\n}`,
              java: `public static int maxProductDifference(int[] nums) {\n    int[] a = Arrays.copyOf(nums, nums.length);\n    Arrays.sort(a);\n    int n = a.length;\n    return a[n - 1] * a[n - 2] - a[0] * a[1];\n}`,
              cpp: `int maxProductDifference(vector<int>& nums) {\n    vector<int> a = nums;\n    sort(a.begin(), a.end());\n    int n = (int) a.size();\n    return a[n - 1] * a[n - 2] - a[0] * a[1];\n}`,
              c: `int maxProductDifference(int* nums, int numsSize) {\n    int* a = (int*) malloc(sizeof(int) * numsSize);\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    for (int i = 1; i < numsSize; i++) {\n        int key = a[i];\n        int j = i - 1;\n        while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }\n        a[j + 1] = key;\n    }\n    int result = a[numsSize - 1] * a[numsSize - 2] - a[0] * a[1];\n    free(a);\n    return result;\n}`,
              csharp: `public static int MaxProductDifference(int[] nums)\n{\n    int[] a = (int[]) nums.Clone();\n    Array.Sort(a);\n    int n = a.Length;\n    return a[n - 1] * a[n - 2] - a[0] * a[1];\n}`,
              go: `func maxProductDifference(nums []int) int {\n	a := make([]int, len(nums))\n	copy(a, nums)\n	sort.Ints(a)\n	n := len(a)\n	return a[n-1]*a[n-2] - a[0]*a[1]\n}`,
              kotlin: `fun maxProductDifference(nums: IntArray): Int {\n    val a = nums.copyOf()\n    a.sort()\n    val n = a.size\n    return a[n - 1] * a[n - 2] - a[0] * a[1]\n}`,
              swift: `func maxProductDifference(_ nums: [Int]) -> Int {\n    let a = nums.sorted()\n    let n = a.count\n    return a[n - 1] * a[n - 2] - a[0] * a[1]\n}`,
              rust: `fn maxProductDifference(nums: Vec<i32>) -> i32 {\n    let mut a = nums.clone();\n    a.sort();\n    let n = a.len();\n    a[n - 1] * a[n - 2] - a[0] * a[1]\n}`,
              php: `function maxProductDifference($nums) {\n    $a = $nums;\n    sort($a);\n    $n = count($a);\n    return $a[$n - 1] * $a[$n - 2] - $a[0] * $a[1];\n}`,
              ruby: `def maxProductDifference(nums)\n  a = nums.sort\n  a[-1] * a[-2] - a[0] * a[1]\nend`,
      },
    };
  })(),

  // ── Minimum Number of Moves to Seat Everyone ────────────────────
  (() => {
    const ref = (seats: number[], students: number[]) => {
      const a = seats.slice().sort((x, y) => x - y);
      const b = students.slice().sort((x, y) => x - y);
      let total = 0;
      for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);
      return total;
    };
    return {
      slug: "minimum-number-of-moves-to-seat-everyone",
      title: "Minimum Number of Moves to Seat Everyone",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Sorting", "Counting Sort", "Amazon", "Adobe"],
      signature: { funcName: "minMovesToSeat", params: [{ name: "seats", type: "int[]" as const }, { name: "students", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "There are `n` seats and `n` students in a room. `seats[i]` is the position of the i-th seat and `students[j]` is the position of the j-th student.\n\nIn one move you may shift a student one position left or right. Return the **minimum** number of moves needed to seat every student, with no two students in the same seat.",
        [
          { in: "seats = [3,1,5], students = [2,7,4]", out: "4" },
          { in: "seats = [4,1,5,9], students = [1,3,2,6]", out: "7" },
          { in: "seats = [2,2,6,6], students = [1,3,2,6]", out: "4" },
        ],
        ["1 <= seats.length <= 40", "seats.length == students.length", "1 <= seats[i], students[j] <= 100"]),
      hints: [
        "Sort both lists and match them position by position.",
        "Crossing two assignments never helps — swapping them back cannot increase the total distance.",
        "The answer is the sum of the absolute differences of the matched pairs.",
      ],
      examples: [
        { input: "[3,1,5]\n[2,7,4]", expectedOutput: "4" },
        { input: "[4,1,5,9]\n[1,3,2,6]", expectedOutput: "7" },
        { input: "[2,2,6,6]\n[1,3,2,6]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const seats = randArr(rng, n, 1, 100);
        const students = randArr(rng, n, 1, 100);
        return { input: `${fmtIntArr(seats)}\n${fmtIntArr(students)}`, expectedOutput: String(ref(seats, students)) };
      },
      solutions: {
        python: `def minMovesToSeat(seats, students) -> int:\n    return sum(abs(a - b) for a, b in zip(sorted(seats), sorted(students)))`,
        javascript: `var minMovesToSeat = function(seats, students) {\n    const a = seats.slice().sort(function(x, y) { return x - y; });\n    const b = students.slice().sort(function(x, y) { return x - y; });\n    let total = 0;\n    for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);\n    return total;\n};`,
              typescript: `function minMovesToSeat(seats: number[], students: number[]): number {\n    var a = seats.slice();\n    var b = students.slice();\n    a.sort(function (x, y) { return x - y; });\n    b.sort(function (x, y) { return x - y; });\n    var total = 0;\n    for (var i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);\n    return total;\n}`,
              java: `public static int minMovesToSeat(int[] seats, int[] students) {\n    int[] a = Arrays.copyOf(seats, seats.length);\n    int[] b = Arrays.copyOf(students, students.length);\n    Arrays.sort(a);\n    Arrays.sort(b);\n    int total = 0;\n    for (int i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i]);\n    return total;\n}`,
              cpp: `int minMovesToSeat(vector<int>& seats, vector<int>& students) {\n    vector<int> a = seats;\n    vector<int> b = students;\n    sort(a.begin(), a.end());\n    sort(b.begin(), b.end());\n    int total = 0;\n    for (size_t i = 0; i < a.size(); i++) total += abs(a[i] - b[i]);\n    return total;\n}`,
              c: `static void sortInts(int* a, int n) {\n    for (int i = 1; i < n; i++) {\n        int key = a[i];\n        int j = i - 1;\n        while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }\n        a[j + 1] = key;\n    }\n}\n\nint minMovesToSeat(int* seats, int seatsSize, int* students, int studentsSize) {\n    int* a = (int*) malloc(sizeof(int) * seatsSize);\n    int* b = (int*) malloc(sizeof(int) * studentsSize);\n    for (int i = 0; i < seatsSize; i++) a[i] = seats[i];\n    for (int i = 0; i < studentsSize; i++) b[i] = students[i];\n    sortInts(a, seatsSize);\n    sortInts(b, studentsSize);\n    int total = 0;\n    for (int i = 0; i < seatsSize; i++) {\n        int d = a[i] - b[i];\n        total += d < 0 ? -d : d;\n    }\n    free(a);\n    free(b);\n    return total;\n}`,
              csharp: `public static int MinMovesToSeat(int[] seats, int[] students)\n{\n    int[] a = (int[]) seats.Clone();\n    int[] b = (int[]) students.Clone();\n    Array.Sort(a);\n    Array.Sort(b);\n    int total = 0;\n    for (int i = 0; i < a.Length; i++) total += Math.Abs(a[i] - b[i]);\n    return total;\n}`,
              go: `func minMovesToSeat(seats []int, students []int) int {\n	a := make([]int, len(seats))\n	b := make([]int, len(students))\n	copy(a, seats)\n	copy(b, students)\n	sort.Ints(a)\n	sort.Ints(b)\n	total := 0\n	for i := range a {\n		d := a[i] - b[i]\n		if d < 0 {\n			d = -d\n		}\n		total += d\n	}\n	return total\n}`,
              kotlin: `fun minMovesToSeat(seats: IntArray, students: IntArray): Int {\n    val a = seats.copyOf()\n    val b = students.copyOf()\n    a.sort()\n    b.sort()\n    var total = 0\n    for (i in a.indices) total += Math.abs(a[i] - b[i])\n    return total\n}`,
              swift: `func minMovesToSeat(_ seats: [Int], _ students: [Int]) -> Int {\n    let a = seats.sorted()\n    let b = students.sorted()\n    var total = 0\n    for i in 0..<a.count { total += abs(a[i] - b[i]) }\n    return total\n}`,
              rust: `fn minMovesToSeat(seats: Vec<i32>, students: Vec<i32>) -> i32 {\n    let mut a = seats.clone();\n    let mut b = students.clone();\n    a.sort();\n    b.sort();\n    let mut total = 0;\n    for i in 0..a.len() {\n        total += (a[i] - b[i]).abs();\n    }\n    total\n}`,
              php: `function minMovesToSeat($seats, $students) {\n    $a = $seats;\n    $b = $students;\n    sort($a);\n    sort($b);\n    $total = 0;\n    for ($i = 0; $i < count($a); $i++) $total += abs($a[$i] - $b[$i]);\n    return $total;\n}`,
              ruby: `def minMovesToSeat(seats, students)\n  a = seats.sort\n  b = students.sort\n  a.each_with_index.sum { |v, i| (v - b[i]).abs }\nend`,
      },
    };
  })(),

  // ── Count Pairs Whose Sum is Less than Target ───────────────────
  (() => {
    const ref = (nums: number[], target: number) => {
      const a = nums.slice().sort((x, y) => x - y);
      let left = 0, right = a.length - 1, count = 0;
      while (left < right) {
        if (a[left] + a[right] < target) { count += right - left; left++; }
        else right--;
      }
      return count;
    };
    return {
      slug: "count-pairs-whose-sum-is-less-than-target",
      title: "Count Pairs Whose Sum is Less than Target",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Binary Search", "Sorting", "Amazon", "Google"],
      signature: { funcName: "countPairs", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` and an integer `target`, return the number of index pairs `(i, j)` with `0 <= i < j < nums.length` and `nums[i] + nums[j] < target`.",
        [
          { in: "nums = [-1,1,2,3,1], target = 2", out: "3", note: "The pairs are (0,1), (0,2) and (0,4)." },
          { in: "nums = [-6,2,5,-2,-7,-1,3], target = -2", out: "10" },
          { in: "nums = [1,1], target = 3", out: "1" },
        ],
        ["1 <= nums.length <= 40", "-50 <= nums[i], target <= 50"]),
      hints: [
        "The pair condition only involves values, not positions, so sorting is free.",
        "Two pointers: if the smallest plus the largest already clears the bar, every element between them pairs with the small one too.",
        "That gives `right - left` pairs at once — then advance the left pointer.",
      ],
      examples: [
        { input: "[-1,1,2,3,1]\n2", expectedOutput: "3" },
        { input: "[-6,2,5,-2,-7,-1,3]\n-2", expectedOutput: "10" },
        { input: "[1,1]\n3", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), -50, 50);
        const target = ri(rng, -50, 50);
        return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: String(ref(nums, target)) };
      },
      solutions: {
        python: `def countPairs(nums, target: int) -> int:\n    a = sorted(nums)\n    left, right, count = 0, len(a) - 1, 0\n    while left < right:\n        if a[left] + a[right] < target:\n            count += right - left\n            left += 1\n        else:\n            right -= 1\n    return count`,
        javascript: `var countPairs = function(nums, target) {\n    const a = nums.slice().sort(function(x, y) { return x - y; });\n    let left = 0, right = a.length - 1, count = 0;\n    while (left < right) {\n        if (a[left] + a[right] < target) {\n            count += right - left;\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return count;\n};`,
              typescript: `function countPairs(nums: number[], target: number): number {\n    var a = nums.slice();\n    a.sort(function (x, y) { return x - y; });\n    var left = 0;\n    var right = a.length - 1;\n    var count = 0;\n    while (left < right) {\n        if (a[left] + a[right] < target) {\n            count += right - left;\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return count;\n}`,
              java: `public static int countPairs(int[] nums, int target) {\n    int[] a = Arrays.copyOf(nums, nums.length);\n    Arrays.sort(a);\n    int left = 0, right = a.length - 1, count = 0;\n    while (left < right) {\n        if (a[left] + a[right] < target) {\n            count += right - left;\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return count;\n}`,
              cpp: `int countPairs(vector<int>& nums, int target) {\n    vector<int> a = nums;\n    sort(a.begin(), a.end());\n    int left = 0, right = (int) a.size() - 1, count = 0;\n    while (left < right) {\n        if (a[left] + a[right] < target) {\n            count += right - left;\n            left++;\n        } else {\n            right--;\n        }\n    }\n    return count;\n}`,
              c: `int countPairs(int* nums, int numsSize, int target) {\n    int* a = (int*) malloc(sizeof(int) * numsSize);\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    for (int i = 1; i < numsSize; i++) {\n        int key = a[i];\n        int j = i - 1;\n        while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }\n        a[j + 1] = key;\n    }\n    int left = 0, right = numsSize - 1, count = 0;\n    while (left < right) {\n        if (a[left] + a[right] < target) {\n            count += right - left;\n            left++;\n        } else {\n            right--;\n        }\n    }\n    free(a);\n    return count;\n}`,
              csharp: `public static int CountPairs(int[] nums, int target)\n{\n    int[] a = (int[]) nums.Clone();\n    Array.Sort(a);\n    int left = 0, right = a.Length - 1, count = 0;\n    while (left < right)\n    {\n        if (a[left] + a[right] < target)\n        {\n            count += right - left;\n            left++;\n        }\n        else\n        {\n            right--;\n        }\n    }\n    return count;\n}`,
              go: `func countPairs(nums []int, target int) int {\n	a := make([]int, len(nums))\n	copy(a, nums)\n	sort.Ints(a)\n	left, right, count := 0, len(a)-1, 0\n	for left < right {\n		if a[left]+a[right] < target {\n			count += right - left\n			left++\n		} else {\n			right--\n		}\n	}\n	return count\n}`,
              kotlin: `fun countPairs(nums: IntArray, target: Int): Int {\n    val a = nums.copyOf()\n    a.sort()\n    var left = 0\n    var right = a.size - 1\n    var count = 0\n    while (left < right) {\n        if (a[left] + a[right] < target) {\n            count += right - left\n            left++\n        } else {\n            right--\n        }\n    }\n    return count\n}`,
              swift: `func countPairs(_ nums: [Int], _ target: Int) -> Int {\n    let a = nums.sorted()\n    var left = 0\n    var right = a.count - 1\n    var count = 0\n    while left < right {\n        if a[left] + a[right] < target {\n            count += right - left\n            left += 1\n        } else {\n            right -= 1\n        }\n    }\n    return count\n}`,
              rust: `fn countPairs(nums: Vec<i32>, target: i32) -> i32 {\n    let mut a = nums.clone();\n    a.sort();\n    if a.is_empty() {\n        return 0;\n    }\n    let mut left = 0usize;\n    let mut right = a.len() - 1;\n    let mut count = 0i32;\n    while left < right {\n        if a[left] + a[right] < target {\n            count += (right - left) as i32;\n            left += 1;\n        } else {\n            right -= 1;\n        }\n    }\n    count\n}`,
              php: `function countPairs($nums, $target) {\n    $a = $nums;\n    sort($a);\n    $left = 0;\n    $right = count($a) - 1;\n    $count = 0;\n    while ($left < $right) {\n        if ($a[$left] + $a[$right] < $target) {\n            $count += $right - $left;\n            $left++;\n        } else {\n            $right--;\n        }\n    }\n    return $count;\n}`,
              ruby: `def countPairs(nums, target)\n  a = nums.sort\n  left = 0\n  right = a.length - 1\n  count = 0\n  while left < right\n    if a[left] + a[right] < target\n      count += right - left\n      left += 1\n    else\n      right -= 1\n    end\n  end\n  count\nend`,
      },
    };
  })(),

  // ── Minimum Common Value ────────────────────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      let i = 0, j = 0;
      while (i < a.length && j < b.length) {
        if (a[i] === b[j]) return a[i];
        if (a[i] < b[j]) i++;
        else j++;
      }
      return -1;
    };
    return {
      slug: "minimum-common-value",
      title: "Minimum Common Value",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Two Pointers", "Binary Search", "Amazon", "Google"],
      signature: { funcName: "getCommon", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given two integer arrays `nums1` and `nums2`, both sorted in **non-decreasing** order, return the **smallest** integer that appears in both. If they share no value, return `-1`.",
        [
          { in: "nums1 = [1,2,3], nums2 = [2,4]", out: "2" },
          { in: "nums1 = [1,2,3,6], nums2 = [2,3,4,5]", out: "2" },
          { in: "nums1 = [1,3], nums2 = [2,4]", out: "-1" },
        ],
        ["1 <= nums1.length, nums2.length <= 40", "1 <= nums1[i], nums2[j] <= 100", "Both arrays are sorted in non-decreasing order."]),
      hints: [
        "Both arrays are already sorted, so a merge-style two-pointer walk suffices.",
        "Advance whichever pointer sits on the smaller value; equality is the answer.",
        "Walking from the front means the first match found is automatically the smallest.",
      ],
      examples: [
        { input: "[1,2,3]\n[2,4]", expectedOutput: "2" },
        { input: "[1,2,3,6]\n[2,3,4,5]", expectedOutput: "2" },
        { input: "[1,3]\n[2,4]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const a = randArr(rng, ri(rng, 1, 40), 1, 100).sort((x, y) => x - y);
        const b = randArr(rng, ri(rng, 1, 40), 1, 100).sort((x, y) => x - y);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: String(ref(a, b)) };
      },
      solutions: {
        python: `def getCommon(nums1, nums2) -> int:\n    i = j = 0\n    while i < len(nums1) and j < len(nums2):\n        if nums1[i] == nums2[j]:\n            return nums1[i]\n        if nums1[i] < nums2[j]:\n            i += 1\n        else:\n            j += 1\n    return -1`,
        javascript: `var getCommon = function(nums1, nums2) {\n    let i = 0, j = 0;\n    while (i < nums1.length && j < nums2.length) {\n        if (nums1[i] === nums2[j]) return nums1[i];\n        if (nums1[i] < nums2[j]) i++;\n        else j++;\n    }\n    return -1;\n};`,
              typescript: `function getCommon(nums1: number[], nums2: number[]): number {\n    var i = 0;\n    var j = 0;\n    while (i < nums1.length && j < nums2.length) {\n        if (nums1[i] === nums2[j]) return nums1[i];\n        if (nums1[i] < nums2[j]) i++;\n        else j++;\n    }\n    return -1;\n}`,
              java: `public static int getCommon(int[] nums1, int[] nums2) {\n    int i = 0, j = 0;\n    while (i < nums1.length && j < nums2.length) {\n        if (nums1[i] == nums2[j]) return nums1[i];\n        if (nums1[i] < nums2[j]) i++;\n        else j++;\n    }\n    return -1;\n}`,
              cpp: `int getCommon(vector<int>& nums1, vector<int>& nums2) {\n    size_t i = 0, j = 0;\n    while (i < nums1.size() && j < nums2.size()) {\n        if (nums1[i] == nums2[j]) return nums1[i];\n        if (nums1[i] < nums2[j]) i++;\n        else j++;\n    }\n    return -1;\n}`,
              c: `int getCommon(int* nums1, int nums1Size, int* nums2, int nums2Size) {\n    int i = 0, j = 0;\n    while (i < nums1Size && j < nums2Size) {\n        if (nums1[i] == nums2[j]) return nums1[i];\n        if (nums1[i] < nums2[j]) i++;\n        else j++;\n    }\n    return -1;\n}`,
              csharp: `public static int GetCommon(int[] nums1, int[] nums2)\n{\n    int i = 0, j = 0;\n    while (i < nums1.Length && j < nums2.Length)\n    {\n        if (nums1[i] == nums2[j]) return nums1[i];\n        if (nums1[i] < nums2[j]) i++;\n        else j++;\n    }\n    return -1;\n}`,
              go: `func getCommon(nums1 []int, nums2 []int) int {\n	i, j := 0, 0\n	for i < len(nums1) && j < len(nums2) {\n		if nums1[i] == nums2[j] {\n			return nums1[i]\n		}\n		if nums1[i] < nums2[j] {\n			i++\n		} else {\n			j++\n		}\n	}\n	return -1\n}`,
              kotlin: `fun getCommon(nums1: IntArray, nums2: IntArray): Int {\n    var i = 0\n    var j = 0\n    while (i < nums1.size && j < nums2.size) {\n        if (nums1[i] == nums2[j]) return nums1[i]\n        if (nums1[i] < nums2[j]) i++ else j++\n    }\n    return -1\n}`,
              swift: `func getCommon(_ nums1: [Int], _ nums2: [Int]) -> Int {\n    var i = 0\n    var j = 0\n    while i < nums1.count && j < nums2.count {\n        if nums1[i] == nums2[j] { return nums1[i] }\n        if nums1[i] < nums2[j] { i += 1 } else { j += 1 }\n    }\n    return -1\n}`,
              rust: `fn getCommon(nums1: Vec<i32>, nums2: Vec<i32>) -> i32 {\n    let mut i = 0usize;\n    let mut j = 0usize;\n    while i < nums1.len() && j < nums2.len() {\n        if nums1[i] == nums2[j] {\n            return nums1[i];\n        }\n        if nums1[i] < nums2[j] {\n            i += 1;\n        } else {\n            j += 1;\n        }\n    }\n    -1\n}`,
              php: `function getCommon($nums1, $nums2) {\n    $i = 0;\n    $j = 0;\n    while ($i < count($nums1) && $j < count($nums2)) {\n        if ($nums1[$i] === $nums2[$j]) return $nums1[$i];\n        if ($nums1[$i] < $nums2[$j]) $i++;\n        else $j++;\n    }\n    return -1;\n}`,
              ruby: `def getCommon(nums1, nums2)\n  i = 0\n  j = 0\n  while i < nums1.length && j < nums2.length\n    return nums1[i] if nums1[i] == nums2[j]\n    if nums1[i] < nums2[j]\n      i += 1\n    else\n      j += 1\n    end\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Apply Operations to an Array ────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const a = nums.slice();
      for (let i = 0; i + 1 < a.length; i++) {
        if (a[i] === a[i + 1] && a[i] !== 0) { a[i] *= 2; a[i + 1] = 0; }
      }
      const out: number[] = [];
      for (let i = 0; i < a.length; i++) if (a[i] !== 0) out.push(a[i]);
      while (out.length < a.length) out.push(0);
      return out;
    };
    return {
      slug: "apply-operations-to-an-array",
      title: "Apply Operations to an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Simulation", "Amazon", "Adobe"],
      signature: { funcName: "applyOperations", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given a 0-indexed array `nums` of size `n`. Apply `n - 1` operations, for `i` from `0` to `n - 2` **in order**:\n\n- if `nums[i] == nums[i + 1]`, double `nums[i]` and set `nums[i + 1]` to `0`; otherwise skip.\n\nAfter all the operations, shift every `0` to the **end** of the array while keeping the non-zero elements in their relative order, and return the result.",
        [
          { in: "nums = [1,2,2,1,1,0]", out: "[1,4,2,0,0,0]" },
          { in: "nums = [0,1]", out: "[1,0]" },
          { in: "nums = [3,3,3]", out: "[6,3,0]", note: "The first pair merges, which leaves the third 3 alone." },
        ],
        ["2 <= nums.length <= 40", "0 <= nums[i] <= 1000"]),
      hints: [
        "Do the merge pass strictly left to right — a merged pair can affect the next comparison.",
        "Zeros never merge with each other; the rule requires a non-zero value.",
        "Only after the whole merge pass do you compact the zeros to the end.",
      ],
      examples: [
        { input: "[1,2,2,1,1,0]", expectedOutput: "[1,4,2,0,0,0]" },
        { input: "[0,1]", expectedOutput: "[1,0]" },
        { input: "[3,3,3]", expectedOutput: "[6,3,0]" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 2, 40), 0, rng() < 0.6 ? 4 : 1000);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def applyOperations(nums):\n    a = list(nums)\n    for i in range(len(a) - 1):\n        if a[i] == a[i + 1] and a[i] != 0:\n            a[i] *= 2\n            a[i + 1] = 0\n    out = [x for x in a if x != 0]\n    out.extend([0] * (len(a) - len(out)))\n    return out`,
        javascript: `var applyOperations = function(nums) {\n    const a = nums.slice();\n    for (let i = 0; i + 1 < a.length; i++) {\n        if (a[i] === a[i + 1] && a[i] !== 0) {\n            a[i] *= 2;\n            a[i + 1] = 0;\n        }\n    }\n    const out = [];\n    for (let i = 0; i < a.length; i++) {\n        if (a[i] !== 0) out.push(a[i]);\n    }\n    while (out.length < a.length) out.push(0);\n    return out;\n};`,
              typescript: `function applyOperations(nums: number[]): number[] {\n    var a = nums.slice();\n    for (var i = 0; i + 1 < a.length; i++) {\n        if (a[i] === a[i + 1] && a[i] !== 0) {\n            a[i] *= 2;\n            a[i + 1] = 0;\n        }\n    }\n    var out: number[] = [];\n    for (var j = 0; j < a.length; j++) {\n        if (a[j] !== 0) out.push(a[j]);\n    }\n    while (out.length < a.length) out.push(0);\n    return out;\n}`,
              java: `public static int[] applyOperations(int[] nums) {\n    int[] a = Arrays.copyOf(nums, nums.length);\n    for (int i = 0; i + 1 < a.length; i++) {\n        if (a[i] == a[i + 1] && a[i] != 0) {\n            a[i] *= 2;\n            a[i + 1] = 0;\n        }\n    }\n    int[] out = new int[a.length];\n    int pos = 0;\n    for (int v : a) {\n        if (v != 0) out[pos++] = v;\n    }\n    return out;\n}`,
              cpp: `vector<int> applyOperations(vector<int>& nums) {\n    vector<int> a = nums;\n    for (size_t i = 0; i + 1 < a.size(); i++) {\n        if (a[i] == a[i + 1] && a[i] != 0) {\n            a[i] *= 2;\n            a[i + 1] = 0;\n        }\n    }\n    vector<int> out(a.size(), 0);\n    int pos = 0;\n    for (int v : a) {\n        if (v != 0) out[pos++] = v;\n    }\n    return out;\n}`,
              c: `int* applyOperations(int* nums, int numsSize, int* returnSize) {\n    int* a = (int*) malloc(sizeof(int) * numsSize);\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    for (int i = 0; i + 1 < numsSize; i++) {\n        if (a[i] == a[i + 1] && a[i] != 0) {\n            a[i] *= 2;\n            a[i + 1] = 0;\n        }\n    }\n    int* out = (int*) calloc(numsSize, sizeof(int));\n    int pos = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (a[i] != 0) out[pos++] = a[i];\n    }\n    free(a);\n    *returnSize = numsSize;\n    return out;\n}`,
              csharp: `public static int[] ApplyOperations(int[] nums)\n{\n    int[] a = (int[]) nums.Clone();\n    for (int i = 0; i + 1 < a.Length; i++)\n    {\n        if (a[i] == a[i + 1] && a[i] != 0)\n        {\n            a[i] *= 2;\n            a[i + 1] = 0;\n        }\n    }\n    int[] out_ = new int[a.Length];\n    int pos = 0;\n    foreach (int v in a)\n    {\n        if (v != 0) out_[pos++] = v;\n    }\n    return out_;\n}`,
              go: `func applyOperations(nums []int) []int {\n	a := make([]int, len(nums))\n	copy(a, nums)\n	for i := 0; i+1 < len(a); i++ {\n		if a[i] == a[i+1] && a[i] != 0 {\n			a[i] *= 2\n			a[i+1] = 0\n		}\n	}\n	out := make([]int, len(a))\n	pos := 0\n	for _, v := range a {\n		if v != 0 {\n			out[pos] = v\n			pos++\n		}\n	}\n	return out\n}`,
              kotlin: `fun applyOperations(nums: IntArray): IntArray {\n    val a = nums.copyOf()\n    for (i in 0 until a.size - 1) {\n        if (a[i] == a[i + 1] && a[i] != 0) {\n            a[i] *= 2\n            a[i + 1] = 0\n        }\n    }\n    val out = IntArray(a.size)\n    var pos = 0\n    for (v in a) {\n        if (v != 0) out[pos++] = v\n    }\n    return out\n}`,
              swift: `func applyOperations(_ nums: [Int]) -> [Int] {\n    var a = nums\n    var i = 0\n    while i + 1 < a.count {\n        if a[i] == a[i + 1] && a[i] != 0 {\n            a[i] *= 2\n            a[i + 1] = 0\n        }\n        i += 1\n    }\n    var out = [Int](repeating: 0, count: a.count)\n    var pos = 0\n    for v in a where v != 0 {\n        out[pos] = v\n        pos += 1\n    }\n    return out\n}`,
              rust: `fn applyOperations(nums: Vec<i32>) -> Vec<i32> {\n    let mut a = nums;\n    for i in 0..a.len().saturating_sub(1) {\n        if a[i] == a[i + 1] && a[i] != 0 {\n            a[i] *= 2;\n            a[i + 1] = 0;\n        }\n    }\n    let mut out = vec![0i32; a.len()];\n    let mut pos = 0usize;\n    for v in a.iter() {\n        if *v != 0 {\n            out[pos] = *v;\n            pos += 1;\n        }\n    }\n    out\n}`,
              php: `function applyOperations($nums) {\n    $a = $nums;\n    $n = count($a);\n    for ($i = 0; $i + 1 < $n; $i++) {\n        if ($a[$i] === $a[$i + 1] && $a[$i] !== 0) {\n            $a[$i] *= 2;\n            $a[$i + 1] = 0;\n        }\n    }\n    $out = array();\n    foreach ($a as $v) {\n        if ($v !== 0) $out[] = $v;\n    }\n    while (count($out) < $n) $out[] = 0;\n    return $out;\n}`,
              ruby: `def applyOperations(nums)\n  a = nums.dup\n  (0...(a.length - 1)).each do |i|\n    if a[i] == a[i + 1] && a[i] != 0\n      a[i] *= 2\n      a[i + 1] = 0\n    end\n  end\n  out = a.reject { |v| v == 0 }\n  out + Array.new(a.length - out.length, 0)\nend`,
      },
    };
  })(),

  // ── Left and Right Sum Differences ──────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      let total = 0;
      for (let i = 0; i < n; i++) total += nums[i];
      const out: number[] = [];
      let left = 0;
      for (let i = 0; i < n; i++) {
        const right = total - left - nums[i];
        out.push(Math.abs(left - right));
        left += nums[i];
      }
      return out;
    };
    return {
      slug: "left-and-right-sum-differences",
      title: "Left and Right Sum Differences",
      difficulty: "EASY" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Microsoft"],
      signature: { funcName: "leftRightDifference", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given a 0-indexed integer array `nums`, define `leftSum[i]` as the sum of the elements strictly to the left of index `i` and `rightSum[i]` as the sum of those strictly to the right (both are 0 at the ends).\n\nReturn the array `answer` where `answer[i] = abs(leftSum[i] - rightSum[i])`.",
        [
          { in: "nums = [10,4,8,3]", out: "[15,1,11,22]" },
          { in: "nums = [1]", out: "[0]" },
          { in: "nums = [1,2,3]", out: "[5,2,3]" },
        ],
        ["1 <= nums.length <= 40", "1 <= nums[i] <= 1000"]),
      hints: [
        "One pass gives the total; a second maintains the running left sum.",
        "The right sum is then `total - left - nums[i]`, with no second array needed.",
      ],
      examples: [
        { input: "[10,4,8,3]", expectedOutput: "[15,1,11,22]" },
        { input: "[1]", expectedOutput: "[0]" },
        { input: "[1,2,3]", expectedOutput: "[5,2,3]" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 1, 1000);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def leftRightDifference(nums):\n    total = sum(nums)\n    out = []\n    left = 0\n    for x in nums:\n        right = total - left - x\n        out.append(abs(left - right))\n        left += x\n    return out`,
        javascript: `var leftRightDifference = function(nums) {\n    let total = 0;\n    for (let i = 0; i < nums.length; i++) total += nums[i];\n    const out = [];\n    let left = 0;\n    for (let i = 0; i < nums.length; i++) {\n        const right = total - left - nums[i];\n        out.push(Math.abs(left - right));\n        left += nums[i];\n    }\n    return out;\n};`,
              typescript: `function leftRightDifference(nums: number[]): number[] {\n    var total = 0;\n    for (var i = 0; i < nums.length; i++) total += nums[i];\n    var out: number[] = [];\n    var left = 0;\n    for (var j = 0; j < nums.length; j++) {\n        var right = total - left - nums[j];\n        out.push(Math.abs(left - right));\n        left += nums[j];\n    }\n    return out;\n}`,
              java: `public static int[] leftRightDifference(int[] nums) {\n    int total = 0;\n    for (int v : nums) total += v;\n    int[] out = new int[nums.length];\n    int left = 0;\n    for (int i = 0; i < nums.length; i++) {\n        int right = total - left - nums[i];\n        out[i] = Math.abs(left - right);\n        left += nums[i];\n    }\n    return out;\n}`,
              cpp: `vector<int> leftRightDifference(vector<int>& nums) {\n    int total = 0;\n    for (int v : nums) total += v;\n    vector<int> out;\n    int left = 0;\n    for (int v : nums) {\n        int right = total - left - v;\n        out.push_back(abs(left - right));\n        left += v;\n    }\n    return out;\n}`,
              c: `int* leftRightDifference(int* nums, int numsSize, int* returnSize) {\n    int total = 0;\n    for (int i = 0; i < numsSize; i++) total += nums[i];\n    int* out = (int*) malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));\n    int left = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int right = total - left - nums[i];\n        int d = left - right;\n        out[i] = d < 0 ? -d : d;\n        left += nums[i];\n    }\n    *returnSize = numsSize;\n    return out;\n}`,
              csharp: `public static int[] LeftRightDifference(int[] nums)\n{\n    int total = 0;\n    foreach (int v in nums) total += v;\n    int[] out_ = new int[nums.Length];\n    int left = 0;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        int right = total - left - nums[i];\n        out_[i] = Math.Abs(left - right);\n        left += nums[i];\n    }\n    return out_;\n}`,
              go: `func leftRightDifference(nums []int) []int {\n	total := 0\n	for _, v := range nums {\n		total += v\n	}\n	out := make([]int, len(nums))\n	left := 0\n	for i, v := range nums {\n		right := total - left - v\n		d := left - right\n		if d < 0 {\n			d = -d\n		}\n		out[i] = d\n		left += v\n	}\n	return out\n}`,
              kotlin: `fun leftRightDifference(nums: IntArray): IntArray {\n    var total = 0\n    for (v in nums) total += v\n    val out = IntArray(nums.size)\n    var left = 0\n    for (i in nums.indices) {\n        val right = total - left - nums[i]\n        out[i] = Math.abs(left - right)\n        left += nums[i]\n    }\n    return out\n}`,
              swift: `func leftRightDifference(_ nums: [Int]) -> [Int] {\n    var total = 0\n    for v in nums { total += v }\n    var out: [Int] = []\n    var left = 0\n    for v in nums {\n        let right = total - left - v\n        out.append(abs(left - right))\n        left += v\n    }\n    return out\n}`,
              rust: `fn leftRightDifference(nums: Vec<i32>) -> Vec<i32> {\n    let total: i32 = nums.iter().sum();\n    let mut out: Vec<i32> = Vec::new();\n    let mut left = 0;\n    for v in nums.iter() {\n        let right = total - left - *v;\n        out.push((left - right).abs());\n        left += *v;\n    }\n    out\n}`,
              php: `function leftRightDifference($nums) {\n    $total = array_sum($nums);\n    $out = array();\n    $left = 0;\n    foreach ($nums as $v) {\n        $right = $total - $left - $v;\n        $out[] = abs($left - $right);\n        $left += $v;\n    }\n    return $out;\n}`,
              ruby: `def leftRightDifference(nums)\n  total = nums.sum\n  left = 0\n  nums.map do |v|\n    right = total - left - v\n    d = (left - right).abs\n    left += v\n    d\n  end\nend`,
      },
    };
  })(),

  // ── Difference Between Element Sum and Digit Sum of an Array ────
  (() => {
    const ref = (nums: number[]) => {
      let elementSum = 0, digitSum = 0;
      for (let i = 0; i < nums.length; i++) {
        elementSum += nums[i];
        let x = nums[i];
        while (x > 0) { digitSum += x % 10; x = Math.floor(x / 10); }
      }
      return Math.abs(elementSum - digitSum);
    };
    return {
      slug: "difference-between-element-sum-and-digit-sum-of-an-array",
      title: "Difference Between Element Sum and Digit Sum of an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Amazon", "Infosys"],
      signature: { funcName: "differenceOfSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given a positive integer array `nums`.\n\n- The **element sum** is the sum of all the elements.\n- The **digit sum** is the sum of all the digits, treating each element digit by digit.\n\nReturn the absolute difference between the element sum and the digit sum.",
        [
          { in: "nums = [1,15,6,3]", out: "9", note: "The element sum is 25 and the digit sum is 1+1+5+6+3 = 16." },
          { in: "nums = [1,2,3,4]", out: "0", note: "Single-digit numbers make the two sums identical." },
          { in: "nums = [100]", out: "99" },
        ],
        ["1 <= nums.length <= 40", "1 <= nums[i] <= 10000"]),
      hints: [
        "Accumulate both sums in the same pass.",
        "The digit sum never exceeds the element sum, so the absolute value is a formality — but keep it for safety.",
      ],
      examples: [
        { input: "[1,15,6,3]", expectedOutput: "9" },
        { input: "[1,2,3,4]", expectedOutput: "0" },
        { input: "[100]", expectedOutput: "99" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 1, 10000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def differenceOfSum(nums) -> int:\n    element_sum = sum(nums)\n    digit_sum = sum(int(ch) for x in nums for ch in str(x))\n    return abs(element_sum - digit_sum)`,
        javascript: `var differenceOfSum = function(nums) {\n    let elementSum = 0, digitSum = 0;\n    for (let i = 0; i < nums.length; i++) {\n        elementSum += nums[i];\n        let x = nums[i];\n        while (x > 0) {\n            digitSum += x % 10;\n            x = Math.floor(x / 10);\n        }\n    }\n    return Math.abs(elementSum - digitSum);\n};`,
              typescript: `function differenceOfSum(nums: number[]): number {\n    var elementSum = 0;\n    var digitSum = 0;\n    for (var i = 0; i < nums.length; i++) {\n        elementSum += nums[i];\n        var x = nums[i];\n        while (x > 0) {\n            digitSum += x % 10;\n            x = Math.floor(x / 10);\n        }\n    }\n    return Math.abs(elementSum - digitSum);\n}`,
              java: `public static int differenceOfSum(int[] nums) {\n    int elementSum = 0, digitSum = 0;\n    for (int v : nums) {\n        elementSum += v;\n        int x = v;\n        while (x > 0) {\n            digitSum += x % 10;\n            x /= 10;\n        }\n    }\n    return Math.abs(elementSum - digitSum);\n}`,
              cpp: `int differenceOfSum(vector<int>& nums) {\n    int elementSum = 0, digitSum = 0;\n    for (int v : nums) {\n        elementSum += v;\n        int x = v;\n        while (x > 0) {\n            digitSum += x % 10;\n            x /= 10;\n        }\n    }\n    return abs(elementSum - digitSum);\n}`,
              c: `int differenceOfSum(int* nums, int numsSize) {\n    int elementSum = 0, digitSum = 0;\n    for (int i = 0; i < numsSize; i++) {\n        elementSum += nums[i];\n        int x = nums[i];\n        while (x > 0) {\n            digitSum += x % 10;\n            x /= 10;\n        }\n    }\n    int d = elementSum - digitSum;\n    return d < 0 ? -d : d;\n}`,
              csharp: `public static int DifferenceOfSum(int[] nums)\n{\n    int elementSum = 0, digitSum = 0;\n    foreach (int v in nums)\n    {\n        elementSum += v;\n        int x = v;\n        while (x > 0)\n        {\n            digitSum += x % 10;\n            x /= 10;\n        }\n    }\n    return Math.Abs(elementSum - digitSum);\n}`,
              go: `func differenceOfSum(nums []int) int {\n	elementSum, digitSum := 0, 0\n	for _, v := range nums {\n		elementSum += v\n		x := v\n		for x > 0 {\n			digitSum += x % 10\n			x /= 10\n		}\n	}\n	d := elementSum - digitSum\n	if d < 0 {\n		d = -d\n	}\n	return d\n}`,
              kotlin: `fun differenceOfSum(nums: IntArray): Int {\n    var elementSum = 0\n    var digitSum = 0\n    for (v in nums) {\n        elementSum += v\n        var x = v\n        while (x > 0) {\n            digitSum += x % 10\n            x /= 10\n        }\n    }\n    return Math.abs(elementSum - digitSum)\n}`,
              swift: `func differenceOfSum(_ nums: [Int]) -> Int {\n    var elementSum = 0\n    var digitSum = 0\n    for v in nums {\n        elementSum += v\n        var x = v\n        while x > 0 {\n            digitSum += x % 10\n            x /= 10\n        }\n    }\n    return abs(elementSum - digitSum)\n}`,
              rust: `fn differenceOfSum(nums: Vec<i32>) -> i32 {\n    let mut element_sum = 0;\n    let mut digit_sum = 0;\n    for v in nums.iter() {\n        element_sum += *v;\n        let mut x = *v;\n        while x > 0 {\n            digit_sum += x % 10;\n            x /= 10;\n        }\n    }\n    (element_sum - digit_sum).abs()\n}`,
              php: `function differenceOfSum($nums) {\n    $elementSum = 0;\n    $digitSum = 0;\n    foreach ($nums as $v) {\n        $elementSum += $v;\n        $x = $v;\n        while ($x > 0) {\n            $digitSum += $x % 10;\n            $x = intdiv($x, 10);\n        }\n    }\n    return abs($elementSum - $digitSum);\n}`,
              ruby: `def differenceOfSum(nums)\n  element_sum = nums.sum\n  digit_sum = nums.sum { |v| v.to_s.chars.sum(&:to_i) }\n  (element_sum - digit_sum).abs\nend`,
      },
    };
  })(),

  // ── Number of Arithmetic Triplets ───────────────────────────────
  (() => {
    const ref = (nums: number[], diff: number) => {
      const present = new Set(nums);
      let count = 0;
      for (let i = 0; i < nums.length; i++) {
        if (present.has(nums[i] + diff) && present.has(nums[i] + 2 * diff)) count++;
      }
      return count;
    };
    return {
      slug: "number-of-arithmetic-triplets",
      title: "Number of Arithmetic Triplets",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Two Pointers", "Enumeration", "Amazon", "Google"],
      signature: { funcName: "arithmeticTriplets", params: [{ name: "nums", type: "int[]" as const }, { name: "diff", type: "int" as const }], returns: "int" as const },
      description: describe(
        "You are given a **strictly increasing** integer array `nums` and a positive integer `diff`.\n\nCount the triples `(i, j, k)` with `i < j < k` such that `nums[j] - nums[i] == diff` and `nums[k] - nums[j] == diff`.",
        [
          { in: "nums = [0,1,4,6,7,10], diff = 3", out: "2", note: "The triples are (1,2,4) giving 1,4,7 and (2,4,5) giving 4,7,10." },
          { in: "nums = [4,5,6,7,8,9], diff = 2", out: "2" },
          { in: "nums = [1,2,3], diff = 5", out: "0" },
        ],
        ["3 <= nums.length <= 40", "0 <= nums[i] <= 200", "nums is strictly increasing.", "1 <= diff <= 50"]),
      hints: [
        "The array is strictly increasing, so a value determines its position — index order comes for free.",
        "Put every value in a hash set, then for each `x` check whether `x + diff` and `x + 2·diff` are present.",
        "That counts each triple once, keyed by its smallest element.",
      ],
      examples: [
        { input: "[0,1,4,6,7,10]\n3", expectedOutput: "2" },
        { input: "[4,5,6,7,8,9]\n2", expectedOutput: "2" },
        { input: "[1,2,3]\n5", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 3, 30);
        const values = new Set<number>();
        while (values.size < n) values.add(ri(rng, 0, 200));
        const nums = Array.from(values).sort((a, b) => a - b);
        const diff = ri(rng, 1, rng() < 0.5 ? 6 : 50);
        return { input: `${fmtIntArr(nums)}\n${diff}`, expectedOutput: String(ref(nums, diff)) };
      },
      solutions: {
        python: `def arithmeticTriplets(nums, diff: int) -> int:\n    present = set(nums)\n    return sum(1 for x in nums if x + diff in present and x + 2 * diff in present)`,
        javascript: `var arithmeticTriplets = function(nums, diff) {\n    const present = new Set(nums);\n    let count = 0;\n    for (let i = 0; i < nums.length; i++) {\n        if (present.has(nums[i] + diff) && present.has(nums[i] + 2 * diff)) count++;\n    }\n    return count;\n};`,
              typescript: `function arithmeticTriplets(nums: number[], diff: number): number {\n    var present: { [key: string]: boolean } = {};\n    for (var i = 0; i < nums.length; i++) present[String(nums[i])] = true;\n    var count = 0;\n    for (var j = 0; j < nums.length; j++) {\n        if (present[String(nums[j] + diff)] === true && present[String(nums[j] + 2 * diff)] === true) count++;\n    }\n    return count;\n}`,
              java: `public static int arithmeticTriplets(int[] nums, int diff) {\n    Set<Integer> present = new HashSet<>();\n    for (int v : nums) present.add(v);\n    int count = 0;\n    for (int v : nums) {\n        if (present.contains(v + diff) && present.contains(v + 2 * diff)) count++;\n    }\n    return count;\n}`,
              cpp: `int arithmeticTriplets(vector<int>& nums, int diff) {\n    unordered_set<int> present(nums.begin(), nums.end());\n    int count = 0;\n    for (int v : nums) {\n        if (present.count(v + diff) && present.count(v + 2 * diff)) count++;\n    }\n    return count;\n}`,
              c: `int arithmeticTriplets(int* nums, int numsSize, int diff) {\n    bool present[512];\n    for (int i = 0; i < 512; i++) present[i] = false;\n    for (int i = 0; i < numsSize; i++) present[nums[i]] = true;\n    int count = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int b = nums[i] + diff;\n        int c = nums[i] + 2 * diff;\n        if (b < 512 && c < 512 && present[b] && present[c]) count++;\n    }\n    return count;\n}`,
              csharp: `public static int ArithmeticTriplets(int[] nums, int diff)\n{\n    var present = new HashSet<int>(nums);\n    int count = 0;\n    foreach (int v in nums)\n    {\n        if (present.Contains(v + diff) && present.Contains(v + 2 * diff)) count++;\n    }\n    return count;\n}`,
              go: `func arithmeticTriplets(nums []int, diff int) int {\n	present := make(map[int]bool)\n	for _, v := range nums {\n		present[v] = true\n	}\n	count := 0\n	for _, v := range nums {\n		if present[v+diff] && present[v+2*diff] {\n			count++\n		}\n	}\n	return count\n}`,
              kotlin: `fun arithmeticTriplets(nums: IntArray, diff: Int): Int {\n    val present = nums.toHashSet()\n    var count = 0\n    for (v in nums) {\n        if (present.contains(v + diff) && present.contains(v + 2 * diff)) count++\n    }\n    return count\n}`,
              swift: `func arithmeticTriplets(_ nums: [Int], _ diff: Int) -> Int {\n    let present = Set(nums)\n    var count = 0\n    for v in nums {\n        if present.contains(v + diff) && present.contains(v + 2 * diff) { count += 1 }\n    }\n    return count\n}`,
              rust: `fn arithmeticTriplets(nums: Vec<i32>, diff: i32) -> i32 {\n    use std::collections::HashSet;\n    let present: HashSet<i32> = nums.iter().cloned().collect();\n    let mut count = 0;\n    for v in nums.iter() {\n        if present.contains(&(*v + diff)) && present.contains(&(*v + 2 * diff)) {\n            count += 1;\n        }\n    }\n    count\n}`,
              php: `function arithmeticTriplets($nums, $diff) {\n    $present = array_flip($nums);\n    $count = 0;\n    foreach ($nums as $v) {\n        if (isset($present[$v + $diff]) && isset($present[$v + 2 * $diff])) $count++;\n    }\n    return $count;\n}`,
              ruby: `def arithmeticTriplets(nums, diff)\n  present = {}\n  nums.each { |v| present[v] = true }\n  nums.count { |v| present[v + diff] && present[v + 2 * diff] }\nend`,
      },
    };
  })(),

  // ── Maximum Count of Positive Integer and Negative Integer ──────
  (() => {
    const ref = (nums: number[]) => {
      let pos = 0, neg = 0;
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] > 0) pos++;
        else if (nums[i] < 0) neg++;
      }
      return pos > neg ? pos : neg;
    };
    return {
      slug: "maximum-count-of-positive-integer-and-negative-integer",
      title: "Maximum Count of Positive Integer and Negative Integer",
      difficulty: "EASY" as const,
      tags: ["Array", "Binary Search", "Counting", "Amazon", "Microsoft"],
      signature: { funcName: "maximumCount", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `nums` sorted in **non-decreasing** order, count the positive integers and the negative integers separately and return the larger of the two counts.\n\nNote that `0` is neither positive nor negative.",
        [
          { in: "nums = [-2,-1,-1,1,2,3]", out: "3", note: "Three negatives and three positives — the maximum is 3." },
          { in: "nums = [-3,-2,-1,0,0,1,2]", out: "3", note: "Three negatives beat two positives." },
          { in: "nums = [5,20,66,1314]", out: "4" },
        ],
        ["1 <= nums.length <= 40", "-2000 <= nums[i] <= 2000", "nums is sorted in non-decreasing order."],
        "Can you use the sortedness to answer in O(log n)?"),
      hints: [
        "A single pass with two counters is correct and obvious.",
        "Because the array is sorted, binary search can find the first non-negative and the first positive instead.",
        "Zeros belong to neither group — do not let them inflate either count.",
      ],
      examples: [
        { input: "[-2,-1,-1,1,2,3]", expectedOutput: "3" },
        { input: "[-3,-2,-1,0,0,1,2]", expectedOutput: "3" },
        { input: "[5,20,66,1314]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), -2000, 2000).sort((a, b) => a - b);
        if (rng() < 0.3) {
          for (let i = 0; i < nums.length; i++) if (rng() < 0.2) nums[i] = 0;
          nums.sort((a, b) => a - b);
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def maximumCount(nums) -> int:\n    pos = sum(1 for x in nums if x > 0)\n    neg = sum(1 for x in nums if x < 0)\n    return max(pos, neg)`,
        javascript: `var maximumCount = function(nums) {\n    let pos = 0, neg = 0;\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] > 0) pos++;\n        else if (nums[i] < 0) neg++;\n    }\n    return pos > neg ? pos : neg;\n};`,
              typescript: `function maximumCount(nums: number[]): number {\n    var pos = 0;\n    var neg = 0;\n    for (var i = 0; i < nums.length; i++) {\n        if (nums[i] > 0) pos++;\n        else if (nums[i] < 0) neg++;\n    }\n    return pos > neg ? pos : neg;\n}`,
              java: `public static int maximumCount(int[] nums) {\n    int pos = 0, neg = 0;\n    for (int v : nums) {\n        if (v > 0) pos++;\n        else if (v < 0) neg++;\n    }\n    return Math.max(pos, neg);\n}`,
              cpp: `int maximumCount(vector<int>& nums) {\n    int pos = 0, neg = 0;\n    for (int v : nums) {\n        if (v > 0) pos++;\n        else if (v < 0) neg++;\n    }\n    return max(pos, neg);\n}`,
              c: `int maximumCount(int* nums, int numsSize) {\n    int pos = 0, neg = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] > 0) pos++;\n        else if (nums[i] < 0) neg++;\n    }\n    return pos > neg ? pos : neg;\n}`,
              csharp: `public static int MaximumCount(int[] nums)\n{\n    int pos = 0, neg = 0;\n    foreach (int v in nums)\n    {\n        if (v > 0) pos++;\n        else if (v < 0) neg++;\n    }\n    return Math.Max(pos, neg);\n}`,
              go: `func maximumCount(nums []int) int {\n	pos, neg := 0, 0\n	for _, v := range nums {\n		if v > 0 {\n			pos++\n		} else if v < 0 {\n			neg++\n		}\n	}\n	if pos > neg {\n		return pos\n	}\n	return neg\n}`,
              kotlin: `fun maximumCount(nums: IntArray): Int {\n    var pos = 0\n    var neg = 0\n    for (v in nums) {\n        if (v > 0) pos++\n        else if (v < 0) neg++\n    }\n    return if (pos > neg) pos else neg\n}`,
              swift: `func maximumCount(_ nums: [Int]) -> Int {\n    var pos = 0\n    var neg = 0\n    for v in nums {\n        if v > 0 { pos += 1 }\n        else if v < 0 { neg += 1 }\n    }\n    return pos > neg ? pos : neg\n}`,
              rust: `fn maximumCount(nums: Vec<i32>) -> i32 {\n    let mut pos = 0;\n    let mut neg = 0;\n    for v in nums.iter() {\n        if *v > 0 {\n            pos += 1;\n        } else if *v < 0 {\n            neg += 1;\n        }\n    }\n    if pos > neg {\n        pos\n    } else {\n        neg\n    }\n}`,
              php: `function maximumCount($nums) {\n    $pos = 0;\n    $neg = 0;\n    foreach ($nums as $v) {\n        if ($v > 0) $pos++;\n        else if ($v < 0) $neg++;\n    }\n    return $pos > $neg ? $pos : $neg;\n}`,
              ruby: `def maximumCount(nums)\n  pos = nums.count { |v| v > 0 }\n  neg = nums.count { |v| v < 0 }\n  [pos, neg].max\nend`,
      },
    };
  })(),
];
