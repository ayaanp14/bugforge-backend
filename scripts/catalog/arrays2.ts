/**
 * Arrays and hashing, second wave — the questions that actually open an
 * Amazon, Google or Microsoft screen, plus the Adobe/Flipkart/Bloomberg
 * regulars. Company names ride in `tags` alongside the topic tags.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, fmtIntArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

/** A random array of `n` values drawn from [lo, hi]. */
const randArr = (rng: Rng, n: number, lo: number, hi: number) =>
  Array.from({ length: n }, () => ri(rng, lo, hi));

export const ARRAY2_PROBLEMS: CatalogProblem[] = [

  // ── Two Sum ─────────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[], target: number) => {
      const seen: Record<number, number> = {};
      for (let i = 0; i < nums.length; i++) {
        const need = target - nums[i];
        if (seen[need] !== undefined) return [seen[need], i];
        seen[nums[i]] = i;
      }
      return [];
    };
    return {
      slug: "two-sum",
      title: "Two Sum",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Amazon", "Google", "Microsoft", "Adobe", "Apple", "TCS"],
      signature: { funcName: "twoSum", params: [{ name: "nums", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given an array of integers `nums` and an integer `target`, return the **indices** of the two numbers that add up to `target`.\n\nExactly one such pair exists, and you may not use the same element twice. Return the two indices in **increasing order**.",
        [
          { in: "nums = [2,7,11,15], target = 9", out: "[0,1]", note: "nums[0] + nums[1] = 2 + 7 = 9." },
          { in: "nums = [3,2,4], target = 6", out: "[1,2]" },
          { in: "nums = [3,3], target = 6", out: "[0,1]" },
        ],
        ["2 <= nums.length <= 20", "-200 <= nums[i] <= 200", "-400 <= target <= 400", "Exactly one valid answer exists."],
        "Can you find it in one pass?"),
      hints: [
        "The brute-force pair loop is O(n²). What would let you check the partner of a number instantly?",
        "For each `x`, the partner you need is `target - x`. A hash map from value to index answers that in O(1).",
        "Look the partner up **before** inserting the current number, so an element is never paired with itself.",
      ],
      examples: [
        { input: "[2,7,11,15]\n9", expectedOutput: "[0,1]" },
        { input: "[3,2,4]\n6", expectedOutput: "[1,2]" },
        { input: "[3,3]\n6", expectedOutput: "[0,1]" },
      ],
      gen: (rng: Rng) => {
        for (let attempt = 0; attempt < 40; attempt++) {
          const n = ri(rng, 2, 20);
          const vals = new Set<number>();
          let guard = 0;
          while (vals.size < n && guard++ < 500) vals.add(ri(rng, -200, 200));
          const nums = shuffle(rng, Array.from(vals));
          if (nums.length < 2) continue;
          const sums = new Map<number, number>();
          for (let i = 0; i < nums.length; i++) {
            for (let j = i + 1; j < nums.length; j++) {
              const s = nums[i] + nums[j];
              sums.set(s, (sums.get(s) ?? 0) + 1);
            }
          }
          const unique: number[] = [];
          sums.forEach((count, s) => { if (count === 1) unique.push(s); });
          if (unique.length === 0) continue;
          unique.sort((a, b) => a - b);
          const target = unique[ri(rng, 0, unique.length - 1)];
          return { input: `${fmtIntArr(nums)}\n${target}`, expectedOutput: fmtIntArr(ref(nums, target)) };
        }
        const nums = [3, 3];
        return { input: `${fmtIntArr(nums)}\n6`, expectedOutput: "[0,1]" };
      },
      solutions: {
        python: `def twoSum(nums, target):\n    seen = {}\n    for i, x in enumerate(nums):\n        need = target - x\n        if need in seen:\n            return [seen[need], i]\n        seen[x] = i\n    return []`,
        javascript: `var twoSum = function(nums, target) {\n    const seen = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const need = target - nums[i];\n        if (seen.has(need)) return [seen.get(need), i];\n        seen.set(nums[i], i);\n    }\n    return [];\n};`,
              typescript: `function twoSum(nums: number[], target: number): number[] {\n    var seen: { [key: string]: number } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var need = target - nums[i];\n        var key = String(need);\n        if (seen[key] !== undefined) return [seen[key], i];\n        seen[String(nums[i])] = i;\n    }\n    return [];\n}`,
              java: `public static int[] twoSum(int[] nums, int target) {\n    Map<Integer, Integer> seen = new HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n        int need = target - nums[i];\n        if (seen.containsKey(need)) return new int[]{seen.get(need), i};\n        seen.put(nums[i], i);\n    }\n    return new int[0];\n}`,
              cpp: `vector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int, int> seen;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        int need = target - nums[i];\n        if (seen.count(need)) return {seen[need], i};\n        seen[nums[i]] = i;\n    }\n    return {};\n}`,
              c: `int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    int* out = (int*) malloc(sizeof(int) * 2);\n    for (int i = 0; i < numsSize; i++) {\n        for (int j = i + 1; j < numsSize; j++) {\n            if (nums[i] + nums[j] == target) {\n                out[0] = i;\n                out[1] = j;\n                *returnSize = 2;\n                return out;\n            }\n        }\n    }\n    *returnSize = 0;\n    return out;\n}`,
              csharp: `public static int[] TwoSum(int[] nums, int target)\n{\n    var seen = new Dictionary<int, int>();\n    for (int i = 0; i < nums.Length; i++)\n    {\n        int need = target - nums[i];\n        if (seen.ContainsKey(need)) return new int[] { seen[need], i };\n        seen[nums[i]] = i;\n    }\n    return new int[0];\n}`,
              go: `func twoSum(nums []int, target int) []int {\n	seen := make(map[int]int)\n	for i, x := range nums {\n		if j, ok := seen[target-x]; ok {\n			return []int{j, i}\n		}\n		seen[x] = i\n	}\n	return []int{}\n}`,
              kotlin: `fun twoSum(nums: IntArray, target: Int): IntArray {\n    val seen = HashMap<Int, Int>()\n    for (i in nums.indices) {\n        val need = target - nums[i]\n        if (seen.containsKey(need)) return intArrayOf(seen[need]!!, i)\n        seen[nums[i]] = i\n    }\n    return intArrayOf()\n}`,
              swift: `func twoSum(_ nums: [Int], _ target: Int) -> [Int] {\n    var seen: [Int: Int] = [:]\n    for i in 0..<nums.count {\n        let need = target - nums[i]\n        if let j = seen[need] { return [j, i] }\n        seen[nums[i]] = i\n    }\n    return []\n}`,
              rust: `fn twoSum(nums: Vec<i32>, target: i32) -> Vec<i32> {\n    use std::collections::HashMap;\n    let mut seen: HashMap<i32, i32> = HashMap::new();\n    for i in 0..nums.len() {\n        let need = target - nums[i];\n        if let Some(j) = seen.get(&need) {\n            return vec![*j, i as i32];\n        }\n        seen.insert(nums[i], i as i32);\n    }\n    vec![]\n}`,
              php: `function twoSum($nums, $target) {\n    $seen = array();\n    for ($i = 0; $i < count($nums); $i++) {\n        $need = $target - $nums[$i];\n        if (isset($seen[$need])) return array($seen[$need], $i);\n        $seen[$nums[$i]] = $i;\n    }\n    return array();\n}`,
              ruby: `def twoSum(nums, target)\n  seen = {}\n  nums.each_with_index do |x, i|\n    need = target - x\n    return [seen[need], i] if seen.key?(need)\n    seen[x] = i\n  end\n  []\nend`,
      },
    };
  })(),

  // ── Contains Duplicate ──────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => new Set(nums).size !== nums.length;
    return {
      slug: "contains-duplicate",
      title: "Contains Duplicate",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Sorting", "Amazon", "Adobe", "Apple", "Yahoo"],
      signature: { funcName: "containsDuplicate", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Given an integer array `nums`, return `true` if any value appears **at least twice**, and `false` if every element is distinct.",
        [
          { in: "nums = [1,2,3,1]", out: "true", note: "1 appears at index 0 and index 3." },
          { in: "nums = [1,2,3,4]", out: "false" },
          { in: "nums = [1,1,1,3,3,4,3,2,4,2]", out: "true" },
        ],
        ["1 <= nums.length <= 40", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "A hash set answers it in one pass: insert as you go, and stop the moment an insert finds the value already there.",
        "Sorting first also works and needs no extra memory beyond the sort, since duplicates become adjacent.",
      ],
      examples: [
        { input: "[1,2,3,1]", expectedOutput: "true" },
        { input: "[1,2,3,4]", expectedOutput: "false" },
        { input: "[1,1,1,3,3,4,3,2,4,2]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nums = rng() < 0.5 ? randArr(rng, n, -20, 20) : randArr(rng, n, -1000, 1000);
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: `def containsDuplicate(nums):\n    seen = set()\n    for x in nums:\n        if x in seen:\n            return True\n        seen.add(x)\n    return False`,
        javascript: `var containsDuplicate = function(nums) {\n    const seen = new Set();\n    for (let i = 0; i < nums.length; i++) {\n        if (seen.has(nums[i])) return true;\n        seen.add(nums[i]);\n    }\n    return false;\n};`,
              typescript: `function containsDuplicate(nums: number[]): boolean {\n    var seen: { [key: string]: boolean } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var key = String(nums[i]);\n        if (seen[key] === true) return true;\n        seen[key] = true;\n    }\n    return false;\n}`,
              java: `public static boolean containsDuplicate(int[] nums) {\n    Set<Integer> seen = new HashSet<>();\n    for (int x : nums) {\n        if (!seen.add(x)) return true;\n    }\n    return false;\n}`,
              cpp: `bool containsDuplicate(vector<int>& nums) {\n    unordered_set<int> seen;\n    for (int x : nums) {\n        if (seen.count(x)) return true;\n        seen.insert(x);\n    }\n    return false;\n}`,
              c: `bool containsDuplicate(int* nums, int numsSize) {\n    for (int i = 0; i < numsSize; i++) {\n        for (int j = i + 1; j < numsSize; j++) {\n            if (nums[i] == nums[j]) return true;\n        }\n    }\n    return false;\n}`,
              csharp: `public static bool ContainsDuplicate(int[] nums)\n{\n    var seen = new HashSet<int>();\n    foreach (int x in nums)\n    {\n        if (!seen.Add(x)) return true;\n    }\n    return false;\n}`,
              go: `func containsDuplicate(nums []int) bool {\n	seen := make(map[int]bool)\n	for _, x := range nums {\n		if seen[x] {\n			return true\n		}\n		seen[x] = true\n	}\n	return false\n}`,
              kotlin: `fun containsDuplicate(nums: IntArray): Boolean {\n    val seen = HashSet<Int>()\n    for (x in nums) {\n        if (!seen.add(x)) return true\n    }\n    return false\n}`,
              swift: `func containsDuplicate(_ nums: [Int]) -> Bool {\n    var seen = Set<Int>()\n    for x in nums {\n        if seen.contains(x) { return true }\n        seen.insert(x)\n    }\n    return false\n}`,
              rust: `fn containsDuplicate(nums: Vec<i32>) -> bool {\n    use std::collections::HashSet;\n    let mut seen: HashSet<i32> = HashSet::new();\n    for x in nums.iter() {\n        if !seen.insert(*x) {\n            return true;\n        }\n    }\n    false\n}`,
              php: `function containsDuplicate($nums) {\n    $seen = array();\n    foreach ($nums as $x) {\n        if (isset($seen[$x])) return true;\n        $seen[$x] = true;\n    }\n    return false;\n}`,
              ruby: `def containsDuplicate(nums)\n  nums.uniq.length != nums.length\nend`,
      },
    };
  })(),

  // ── Contains Duplicate II ───────────────────────────────────────
  (() => {
    const ref = (nums: number[], k: number) => {
      const last: Record<number, number> = {};
      for (let i = 0; i < nums.length; i++) {
        if (last[nums[i]] !== undefined && i - last[nums[i]] <= k) return true;
        last[nums[i]] = i;
      }
      return false;
    };
    return {
      slug: "contains-duplicate-ii",
      title: "Contains Duplicate II",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Sliding Window", "Airbnb", "Palantir", "Amazon"],
      signature: { funcName: "containsNearbyDuplicate", params: [{ name: "nums", type: "int[]" as const }, { name: "k", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "Given an integer array `nums` and an integer `k`, return `true` if there are two **distinct indices** `i` and `j` such that `nums[i] == nums[j]` and `abs(i - j) <= k`.",
        [
          { in: "nums = [1,2,3,1], k = 3", out: "true", note: "The two 1s sit at indices 0 and 3, and 3 - 0 <= 3." },
          { in: "nums = [1,0,1,1], k = 1", out: "true", note: "Indices 2 and 3." },
          { in: "nums = [1,2,3,1,2,3], k = 2", out: "false", note: "Every repeat is three apart." },
        ],
        ["1 <= nums.length <= 40", "-1000 <= nums[i] <= 1000", "0 <= k <= 40"]),
      hints: [
        "Only the **most recent** index of each value matters — an older one is strictly further away.",
        "Keep a map from value to its last index and compare distances as you scan.",
        "Equivalently, slide a window of size k and keep a set of the values inside it.",
      ],
      examples: [
        { input: "[1,2,3,1]\n3", expectedOutput: "true" },
        { input: "[1,0,1,1]\n1", expectedOutput: "true" },
        { input: "[1,2,3,1,2,3]\n2", expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nums = randArr(rng, n, -6, 6);
        const k = ri(rng, 0, 8);
        return { input: `${fmtIntArr(nums)}\n${k}`, expectedOutput: bool(ref(nums, k)) };
      },
      solutions: {
        python: `def containsNearbyDuplicate(nums, k):\n    last = {}\n    for i, x in enumerate(nums):\n        if x in last and i - last[x] <= k:\n            return True\n        last[x] = i\n    return False`,
        javascript: `var containsNearbyDuplicate = function(nums, k) {\n    const last = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        if (last.has(nums[i]) && i - last.get(nums[i]) <= k) return true;\n        last.set(nums[i], i);\n    }\n    return false;\n};`,
              typescript: `function containsNearbyDuplicate(nums: number[], k: number): boolean {\n    var last: { [key: string]: number } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var key = String(nums[i]);\n        if (last[key] !== undefined && i - last[key] <= k) return true;\n        last[key] = i;\n    }\n    return false;\n}`,
              java: `public static boolean containsNearbyDuplicate(int[] nums, int k) {\n    Map<Integer, Integer> last = new HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n        Integer prev = last.get(nums[i]);\n        if (prev != null && i - prev <= k) return true;\n        last.put(nums[i], i);\n    }\n    return false;\n}`,
              cpp: `bool containsNearbyDuplicate(vector<int>& nums, int k) {\n    unordered_map<int, int> last;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        if (last.count(nums[i]) && i - last[nums[i]] <= k) return true;\n        last[nums[i]] = i;\n    }\n    return false;\n}`,
              c: `bool containsNearbyDuplicate(int* nums, int numsSize, int k) {\n    for (int i = 0; i < numsSize; i++) {\n        for (int j = i + 1; j < numsSize && j - i <= k; j++) {\n            if (nums[i] == nums[j]) return true;\n        }\n    }\n    return false;\n}`,
              csharp: `public static bool ContainsNearbyDuplicate(int[] nums, int k)\n{\n    var last = new Dictionary<int, int>();\n    for (int i = 0; i < nums.Length; i++)\n    {\n        if (last.ContainsKey(nums[i]) && i - last[nums[i]] <= k) return true;\n        last[nums[i]] = i;\n    }\n    return false;\n}`,
              go: `func containsNearbyDuplicate(nums []int, k int) bool {\n	last := make(map[int]int)\n	for i, x := range nums {\n		if j, ok := last[x]; ok && i-j <= k {\n			return true\n		}\n		last[x] = i\n	}\n	return false\n}`,
              kotlin: `fun containsNearbyDuplicate(nums: IntArray, k: Int): Boolean {\n    val last = HashMap<Int, Int>()\n    for (i in nums.indices) {\n        val prev = last[nums[i]]\n        if (prev != null && i - prev <= k) return true\n        last[nums[i]] = i\n    }\n    return false\n}`,
              swift: `func containsNearbyDuplicate(_ nums: [Int], _ k: Int) -> Bool {\n    var last: [Int: Int] = [:]\n    for i in 0..<nums.count {\n        if let prev = last[nums[i]], i - prev <= k { return true }\n        last[nums[i]] = i\n    }\n    return false\n}`,
              rust: `fn containsNearbyDuplicate(nums: Vec<i32>, k: i32) -> bool {\n    use std::collections::HashMap;\n    let mut last: HashMap<i32, i32> = HashMap::new();\n    for i in 0..nums.len() {\n        let idx = i as i32;\n        if let Some(prev) = last.get(&nums[i]) {\n            if idx - *prev <= k {\n                return true;\n            }\n        }\n        last.insert(nums[i], idx);\n    }\n    false\n}`,
              php: `function containsNearbyDuplicate($nums, $k) {\n    $last = array();\n    for ($i = 0; $i < count($nums); $i++) {\n        if (isset($last[$nums[$i]]) && $i - $last[$nums[$i]] <= $k) return true;\n        $last[$nums[$i]] = $i;\n    }\n    return false;\n}`,
              ruby: `def containsNearbyDuplicate(nums, k)\n  last = {}\n  nums.each_with_index do |x, i|\n    return true if last.key?(x) && i - last[x] <= k\n    last[x] = i\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Valid Anagram ───────────────────────────────────────────────
  (() => {
    const ref = (s: string, t: string) => {
      if (s.length !== t.length) return false;
      const count = new Array(26).fill(0);
      for (let i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;
      for (let i = 0; i < t.length; i++) {
        const c = t.charCodeAt(i) - 97;
        if (--count[c] < 0) return false;
      }
      return true;
    };
    return {
      slug: "valid-anagram",
      title: "Valid Anagram",
      difficulty: "EASY" as const,
      tags: ["Hash Table", "String", "Sorting", "Counting", "Amazon", "Uber", "Bloomberg", "Infosys"],
      signature: { funcName: "isAnagram", params: [{ name: "s", type: "string" as const }, { name: "t", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`.\n\nAn anagram uses exactly the same letters with exactly the same multiplicities, rearranged.",
        [
          { in: 's = "anagram", t = "nagaram"', out: "true" },
          { in: 's = "rat", t = "car"', out: "false" },
          { in: 's = "aacc", t = "ccac"', out: "false", note: "Same letters, but the counts differ." },
        ],
        ["1 <= s.length, t.length <= 40", "s and t consist of lowercase English letters."],
        "What if the inputs contained Unicode characters instead of just 26 letters?"),
      hints: [
        "Different lengths can never be anagrams — check that first and return early.",
        "Count each of the 26 letters in `s`, then decrement while scanning `t`.",
        "The moment a count drops below zero, `t` has a letter `s` cannot supply.",
      ],
      examples: [
        { input: '"anagram"\n"nagaram"', expectedOutput: "true" },
        { input: '"rat"\n"car"', expectedOutput: "false" },
        { input: '"aacc"\n"ccac"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        const alphabet = "abcdef";
        const n = ri(rng, 1, 30);
        const s = Array.from({ length: n }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");
        let t: string;
        const roll = rng();
        if (roll < 0.45) {
          t = shuffle(rng, s.split("")).join("");
        } else if (roll < 0.7 && n > 0) {
          const arr = shuffle(rng, s.split(""));
          arr[ri(rng, 0, arr.length - 1)] = alphabet[ri(rng, 0, alphabet.length - 1)];
          t = arr.join("");
        } else {
          const m = ri(rng, 1, 30);
          t = Array.from({ length: m }, () => alphabet[ri(rng, 0, alphabet.length - 1)]).join("");
        }
        return { input: `"${s}"\n"${t}"`, expectedOutput: bool(ref(s, t)) };
      },
      solutions: {
        python: `def isAnagram(s: str, t: str) -> bool:\n    if len(s) != len(t):\n        return False\n    count = [0] * 26\n    for ch in s:\n        count[ord(ch) - 97] += 1\n    for ch in t:\n        idx = ord(ch) - 97\n        count[idx] -= 1\n        if count[idx] < 0:\n            return False\n    return True`,
        javascript: `var isAnagram = function(s, t) {\n    if (s.length !== t.length) return false;\n    const count = new Array(26).fill(0);\n    for (let i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;\n    for (let i = 0; i < t.length; i++) {\n        const idx = t.charCodeAt(i) - 97;\n        count[idx]--;\n        if (count[idx] < 0) return false;\n    }\n    return true;\n};`,
              typescript: `function isAnagram(s: string, t: string): boolean {\n    if (s.length !== t.length) return false;\n    var count: number[] = [];\n    for (var k = 0; k < 26; k++) count.push(0);\n    for (var i = 0; i < s.length; i++) count[s.charCodeAt(i) - 97]++;\n    for (var j = 0; j < t.length; j++) {\n        var idx = t.charCodeAt(j) - 97;\n        count[idx]--;\n        if (count[idx] < 0) return false;\n    }\n    return true;\n}`,
              java: `public static boolean isAnagram(String s, String t) {\n    if (s.length() != t.length()) return false;\n    int[] count = new int[26];\n    for (int i = 0; i < s.length(); i++) count[s.charAt(i) - 'a']++;\n    for (int i = 0; i < t.length(); i++) {\n        int idx = t.charAt(i) - 'a';\n        count[idx]--;\n        if (count[idx] < 0) return false;\n    }\n    return true;\n}`,
              cpp: `bool isAnagram(string s, string t) {\n    if (s.size() != t.size()) return false;\n    int count[26] = {0};\n    for (char ch : s) count[ch - 'a']++;\n    for (char ch : t) {\n        int idx = ch - 'a';\n        count[idx]--;\n        if (count[idx] < 0) return false;\n    }\n    return true;\n}`,
              c: `bool isAnagram(const char* s, const char* t) {\n    int ls = (int) strlen(s);\n    int lt = (int) strlen(t);\n    if (ls != lt) return false;\n    int count[26] = {0};\n    for (int i = 0; i < ls; i++) count[s[i] - 'a']++;\n    for (int i = 0; i < lt; i++) {\n        int idx = t[i] - 'a';\n        count[idx]--;\n        if (count[idx] < 0) return false;\n    }\n    return true;\n}`,
              csharp: `public static bool IsAnagram(string s, string t)\n{\n    if (s.Length != t.Length) return false;\n    int[] count = new int[26];\n    for (int i = 0; i < s.Length; i++) count[s[i] - 'a']++;\n    for (int i = 0; i < t.Length; i++)\n    {\n        int idx = t[i] - 'a';\n        count[idx]--;\n        if (count[idx] < 0) return false;\n    }\n    return true;\n}`,
              go: `func isAnagram(s string, t string) bool {\n	if len(s) != len(t) {\n		return false\n	}\n	var count [26]int\n	for i := 0; i < len(s); i++ {\n		count[s[i]-'a']++\n	}\n	for i := 0; i < len(t); i++ {\n		idx := t[i] - 'a'\n		count[idx]--\n		if count[idx] < 0 {\n			return false\n		}\n	}\n	return true\n}`,
              kotlin: `fun isAnagram(s: String, t: String): Boolean {\n    if (s.length != t.length) return false\n    val count = IntArray(26)\n    for (ch in s) count[ch - 'a']++\n    for (ch in t) {\n        val idx = ch - 'a'\n        count[idx]--\n        if (count[idx] < 0) return false\n    }\n    return true\n}`,
              swift: `func isAnagram(_ s: String, _ t: String) -> Bool {\n    let sb = Array(s.utf8)\n    let tb = Array(t.utf8)\n    if sb.count != tb.count { return false }\n    var count = [Int](repeating: 0, count: 26)\n    for b in sb { count[Int(b) - 97] += 1 }\n    for b in tb {\n        let idx = Int(b) - 97\n        count[idx] -= 1\n        if count[idx] < 0 { return false }\n    }\n    return true\n}`,
              rust: `fn isAnagram(s: String, t: String) -> bool {\n    let sb = s.as_bytes();\n    let tb = t.as_bytes();\n    if sb.len() != tb.len() {\n        return false;\n    }\n    let mut count = [0i32; 26];\n    for b in sb.iter() {\n        count[(*b - b'a') as usize] += 1;\n    }\n    for b in tb.iter() {\n        let idx = (*b - b'a') as usize;\n        count[idx] -= 1;\n        if count[idx] < 0 {\n            return false;\n        }\n    }\n    true\n}`,
              php: `function isAnagram($s, $t) {\n    if (strlen($s) !== strlen($t)) return false;\n    $count = array_fill(0, 26, 0);\n    for ($i = 0; $i < strlen($s); $i++) $count[ord($s[$i]) - 97]++;\n    for ($i = 0; $i < strlen($t); $i++) {\n        $idx = ord($t[$i]) - 97;\n        $count[$idx]--;\n        if ($count[$idx] < 0) return false;\n    }\n    return true;\n}`,
              ruby: `def isAnagram(s, t)\n  return false if s.length != t.length\n  count = Array.new(26, 0)\n  s.each_char { |ch| count[ch.ord - 97] += 1 }\n  t.each_char do |ch|\n    idx = ch.ord - 97\n    count[idx] -= 1\n    return false if count[idx] < 0\n  end\n  true\nend`,
      },
    };
  })(),

  // ── Intersection of Two Arrays ──────────────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      const setB = new Set(b);
      const out = new Set<number>();
      for (let i = 0; i < a.length; i++) if (setB.has(a[i])) out.add(a[i]);
      return Array.from(out).sort((x, y) => x - y);
    };
    return {
      slug: "intersection-of-two-arrays",
      title: "Intersection of Two Arrays",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Two Pointers", "Sorting", "Amazon", "Meta", "Two Sigma"],
      signature: { funcName: "intersection", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given two integer arrays `nums1` and `nums2`, return an array of their intersection: each element that appears in both arrays, listed **once**, in **increasing order**.",
        [
          { in: "nums1 = [1,2,2,1], nums2 = [2,2]", out: "[2]", note: "2 is common; it is reported once even though it repeats." },
          { in: "nums1 = [4,9,5], nums2 = [9,4,9,8,4]", out: "[4,9]" },
          { in: "nums1 = [1,2], nums2 = [3,4]", out: "[]" },
        ],
        ["1 <= nums1.length, nums2.length <= 30", "0 <= nums1[i], nums2[i] <= 60"]),
      hints: [
        "Put one array into a hash set so membership is O(1).",
        "Collect the hits into a second set — that is what removes duplicates.",
        "Sort at the end, since the answer must come back in increasing order.",
      ],
      examples: [
        { input: "[1,2,2,1]\n[2,2]", expectedOutput: "[2]" },
        { input: "[4,9,5]\n[9,4,9,8,4]", expectedOutput: "[4,9]" },
        { input: "[1,2]\n[3,4]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const a = randArr(rng, ri(rng, 1, 30), 0, 60);
        const b = randArr(rng, ri(rng, 1, 30), 0, 60);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: `def intersection(nums1, nums2):\n    return sorted(set(nums1) & set(nums2))`,
        javascript: `var intersection = function(nums1, nums2) {\n    const setB = new Set(nums2);\n    const out = new Set();\n    for (let i = 0; i < nums1.length; i++) {\n        if (setB.has(nums1[i])) out.add(nums1[i]);\n    }\n    return Array.from(out).sort(function(a, b) { return a - b; });\n};`,
              typescript: `function intersection(nums1: number[], nums2: number[]): number[] {\n    var inB: { [key: string]: boolean } = {};\n    for (var i = 0; i < nums2.length; i++) inB[String(nums2[i])] = true;\n    var taken: { [key: string]: boolean } = {};\n    var out: number[] = [];\n    for (var j = 0; j < nums1.length; j++) {\n        var key = String(nums1[j]);\n        if (inB[key] === true && taken[key] !== true) {\n            taken[key] = true;\n            out.push(nums1[j]);\n        }\n    }\n    out.sort(function (a, b) { return a - b; });\n    return out;\n}`,
              java: `public static int[] intersection(int[] nums1, int[] nums2) {\n    Set<Integer> inB = new HashSet<>();\n    for (int x : nums2) inB.add(x);\n    TreeSet<Integer> out = new TreeSet<>();\n    for (int x : nums1) {\n        if (inB.contains(x)) out.add(x);\n    }\n    int[] res = new int[out.size()];\n    int i = 0;\n    for (int x : out) res[i++] = x;\n    return res;\n}`,
              cpp: `vector<int> intersection(vector<int>& nums1, vector<int>& nums2) {\n    unordered_set<int> inB(nums2.begin(), nums2.end());\n    set<int> out;\n    for (int x : nums1) {\n        if (inB.count(x)) out.insert(x);\n    }\n    return vector<int>(out.begin(), out.end());\n}`,
              c: `int* intersection(int* nums1, int nums1Size, int* nums2, int nums2Size, int* returnSize) {\n    int* out = (int*) malloc(sizeof(int) * (nums1Size > 0 ? nums1Size : 1));\n    int len = 0;\n    for (int i = 0; i < nums1Size; i++) {\n        bool inB = false;\n        for (int j = 0; j < nums2Size; j++) {\n            if (nums1[i] == nums2[j]) { inB = true; break; }\n        }\n        if (!inB) continue;\n        bool already = false;\n        for (int k = 0; k < len; k++) {\n            if (out[k] == nums1[i]) { already = true; break; }\n        }\n        if (!already) out[len++] = nums1[i];\n    }\n    for (int i = 1; i < len; i++) {\n        int key = out[i];\n        int j = i - 1;\n        while (j >= 0 && out[j] > key) { out[j + 1] = out[j]; j--; }\n        out[j + 1] = key;\n    }\n    *returnSize = len;\n    return out;\n}`,
              csharp: `public static int[] Intersection(int[] nums1, int[] nums2)\n{\n    var inB = new HashSet<int>(nums2);\n    var out_ = new SortedSet<int>();\n    foreach (int x in nums1)\n    {\n        if (inB.Contains(x)) out_.Add(x);\n    }\n    return out_.ToArray();\n}`,
              go: `func intersection(nums1 []int, nums2 []int) []int {\n	inB := make(map[int]bool)\n	for _, x := range nums2 {\n		inB[x] = true\n	}\n	taken := make(map[int]bool)\n	out := []int{}\n	for _, x := range nums1 {\n		if inB[x] && !taken[x] {\n			taken[x] = true\n			out = append(out, x)\n		}\n	}\n	sort.Ints(out)\n	return out\n}`,
              kotlin: `fun intersection(nums1: IntArray, nums2: IntArray): IntArray {\n    val inB = nums2.toHashSet()\n    val out = sortedSetOf<Int>()\n    for (x in nums1) {\n        if (inB.contains(x)) out.add(x)\n    }\n    return out.toIntArray()\n}`,
              swift: `func intersection(_ nums1: [Int], _ nums2: [Int]) -> [Int] {\n    let inB = Set(nums2)\n    var out = Set<Int>()\n    for x in nums1 {\n        if inB.contains(x) { out.insert(x) }\n    }\n    return out.sorted()\n}`,
              rust: `fn intersection(nums1: Vec<i32>, nums2: Vec<i32>) -> Vec<i32> {\n    use std::collections::HashSet;\n    let in_b: HashSet<i32> = nums2.into_iter().collect();\n    let mut out: Vec<i32> = Vec::new();\n    let mut taken: HashSet<i32> = HashSet::new();\n    for x in nums1.iter() {\n        if in_b.contains(x) && taken.insert(*x) {\n            out.push(*x);\n        }\n    }\n    out.sort();\n    out\n}`,
              php: `function intersection($nums1, $nums2) {\n    $inB = array_flip($nums2);\n    $out = array();\n    foreach ($nums1 as $x) {\n        if (isset($inB[$x]) && !isset($out[$x])) $out[$x] = true;\n    }\n    $res = array_keys($out);\n    sort($res);\n    return $res;\n}`,
              ruby: `def intersection(nums1, nums2)\n  (nums1 & nums2).sort\nend`,
      },
    };
  })(),

  // ── Intersection of Two Arrays II ───────────────────────────────
  (() => {
    const ref = (a: number[], b: number[]) => {
      const count: Record<number, number> = {};
      for (let i = 0; i < a.length; i++) count[a[i]] = (count[a[i]] || 0) + 1;
      const out: number[] = [];
      for (let i = 0; i < b.length; i++) {
        if (count[b[i]] > 0) { out.push(b[i]); count[b[i]]--; }
      }
      return out.sort((x, y) => x - y);
    };
    return {
      slug: "intersection-of-two-arrays-ii",
      title: "Intersection of Two Arrays II",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Two Pointers", "Sorting", "Amazon", "Meta", "Bloomberg"],
      signature: { funcName: "intersect", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given two integer arrays `nums1` and `nums2`, return their intersection **including multiplicity**: each value appears as many times as it shows in both arrays. Return the result in **increasing order**.",
        [
          { in: "nums1 = [1,2,2,1], nums2 = [2,2]", out: "[2,2]", note: "2 appears twice in each array, so it appears twice in the answer." },
          { in: "nums1 = [4,9,5], nums2 = [9,4,9,8,4]", out: "[4,9]" },
          { in: "nums1 = [1,2], nums2 = [3,4]", out: "[]" },
        ],
        ["1 <= nums1.length, nums2.length <= 30", "0 <= nums1[i], nums2[i] <= 60"],
        "What if the arrays were already sorted? What if one of them was far larger than the other?"),
      hints: [
        "A plain set loses the counts. Use a map from value to how many copies remain.",
        "Build the map from one array, then walk the other and take a copy whenever the remaining count is positive.",
        "Decrement the count as you take, so a value is never taken more often than it occurs.",
      ],
      examples: [
        { input: "[1,2,2,1]\n[2,2]", expectedOutput: "[2,2]" },
        { input: "[4,9,5]\n[9,4,9,8,4]", expectedOutput: "[4,9]" },
        { input: "[1,2]\n[3,4]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const a = randArr(rng, ri(rng, 1, 30), 0, 20);
        const b = randArr(rng, ri(rng, 1, 30), 0, 20);
        return { input: `${fmtIntArr(a)}\n${fmtIntArr(b)}`, expectedOutput: fmtIntArr(ref(a, b)) };
      },
      solutions: {
        python: `def intersect(nums1, nums2):\n    count = {}\n    for x in nums1:\n        count[x] = count.get(x, 0) + 1\n    out = []\n    for x in nums2:\n        if count.get(x, 0) > 0:\n            out.append(x)\n            count[x] -= 1\n    out.sort()\n    return out`,
        javascript: `var intersect = function(nums1, nums2) {\n    const count = new Map();\n    for (let i = 0; i < nums1.length; i++) {\n        count.set(nums1[i], (count.get(nums1[i]) || 0) + 1);\n    }\n    const out = [];\n    for (let i = 0; i < nums2.length; i++) {\n        const c = count.get(nums2[i]) || 0;\n        if (c > 0) {\n            out.push(nums2[i]);\n            count.set(nums2[i], c - 1);\n        }\n    }\n    return out.sort(function(a, b) { return a - b; });\n};`,
              typescript: `function intersect(nums1: number[], nums2: number[]): number[] {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < nums1.length; i++) {\n        var k1 = String(nums1[i]);\n        count[k1] = (count[k1] === undefined ? 0 : count[k1]) + 1;\n    }\n    var out: number[] = [];\n    for (var j = 0; j < nums2.length; j++) {\n        var k2 = String(nums2[j]);\n        if (count[k2] !== undefined && count[k2] > 0) {\n            out.push(nums2[j]);\n            count[k2]--;\n        }\n    }\n    out.sort(function (a, b) { return a - b; });\n    return out;\n}`,
              java: `public static int[] intersect(int[] nums1, int[] nums2) {\n    Map<Integer, Integer> count = new HashMap<>();\n    for (int x : nums1) count.put(x, count.getOrDefault(x, 0) + 1);\n    List<Integer> out = new ArrayList<>();\n    for (int x : nums2) {\n        int c = count.getOrDefault(x, 0);\n        if (c > 0) {\n            out.add(x);\n            count.put(x, c - 1);\n        }\n    }\n    Collections.sort(out);\n    int[] res = new int[out.size()];\n    for (int i = 0; i < res.length; i++) res[i] = out.get(i);\n    return res;\n}`,
              cpp: `vector<int> intersect(vector<int>& nums1, vector<int>& nums2) {\n    unordered_map<int, int> count;\n    for (int x : nums1) count[x]++;\n    vector<int> out;\n    for (int x : nums2) {\n        if (count[x] > 0) {\n            out.push_back(x);\n            count[x]--;\n        }\n    }\n    sort(out.begin(), out.end());\n    return out;\n}`,
              c: `int* intersect(int* nums1, int nums1Size, int* nums2, int nums2Size, int* returnSize) {\n    int cap = nums1Size < nums2Size ? nums1Size : nums2Size;\n    int* out = (int*) malloc(sizeof(int) * (cap > 0 ? cap : 1));\n    char* used = (char*) calloc(nums1Size > 0 ? nums1Size : 1, 1);\n    int len = 0;\n    for (int j = 0; j < nums2Size; j++) {\n        for (int i = 0; i < nums1Size; i++) {\n            if (!used[i] && nums1[i] == nums2[j]) {\n                used[i] = 1;\n                out[len++] = nums2[j];\n                break;\n            }\n        }\n    }\n    for (int i = 1; i < len; i++) {\n        int key = out[i];\n        int j = i - 1;\n        while (j >= 0 && out[j] > key) { out[j + 1] = out[j]; j--; }\n        out[j + 1] = key;\n    }\n    free(used);\n    *returnSize = len;\n    return out;\n}`,
              csharp: `public static int[] Intersect(int[] nums1, int[] nums2)\n{\n    var count = new Dictionary<int, int>();\n    foreach (int x in nums1)\n    {\n        count[x] = count.ContainsKey(x) ? count[x] + 1 : 1;\n    }\n    var out_ = new List<int>();\n    foreach (int x in nums2)\n    {\n        if (count.ContainsKey(x) && count[x] > 0)\n        {\n            out_.Add(x);\n            count[x]--;\n        }\n    }\n    out_.Sort();\n    return out_.ToArray();\n}`,
              go: `func intersect(nums1 []int, nums2 []int) []int {\n	count := make(map[int]int)\n	for _, x := range nums1 {\n		count[x]++\n	}\n	out := []int{}\n	for _, x := range nums2 {\n		if count[x] > 0 {\n			out = append(out, x)\n			count[x]--\n		}\n	}\n	sort.Ints(out)\n	return out\n}`,
              kotlin: `fun intersect(nums1: IntArray, nums2: IntArray): IntArray {\n    val count = HashMap<Int, Int>()\n    for (x in nums1) count[x] = (count[x] ?: 0) + 1\n    val out = ArrayList<Int>()\n    for (x in nums2) {\n        val c = count[x] ?: 0\n        if (c > 0) {\n            out.add(x)\n            count[x] = c - 1\n        }\n    }\n    out.sort()\n    return out.toIntArray()\n}`,
              swift: `func intersect(_ nums1: [Int], _ nums2: [Int]) -> [Int] {\n    var count: [Int: Int] = [:]\n    for x in nums1 { count[x, default: 0] += 1 }\n    var out: [Int] = []\n    for x in nums2 {\n        let c = count[x] ?? 0\n        if c > 0 {\n            out.append(x)\n            count[x] = c - 1\n        }\n    }\n    return out.sorted()\n}`,
              rust: `fn intersect(nums1: Vec<i32>, nums2: Vec<i32>) -> Vec<i32> {\n    use std::collections::HashMap;\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for x in nums1.iter() {\n        *count.entry(*x).or_insert(0) += 1;\n    }\n    let mut out: Vec<i32> = Vec::new();\n    for x in nums2.iter() {\n        let c = count.entry(*x).or_insert(0);\n        if *c > 0 {\n            *c -= 1;\n            out.push(*x);\n        }\n    }\n    out.sort();\n    out\n}`,
              php: `function intersect($nums1, $nums2) {\n    $count = array();\n    foreach ($nums1 as $x) {\n        $count[$x] = isset($count[$x]) ? $count[$x] + 1 : 1;\n    }\n    $out = array();\n    foreach ($nums2 as $x) {\n        if (isset($count[$x]) && $count[$x] > 0) {\n            $out[] = $x;\n            $count[$x]--;\n        }\n    }\n    sort($out);\n    return $out;\n}`,
              ruby: `def intersect(nums1, nums2)\n  count = Hash.new(0)\n  nums1.each { |x| count[x] += 1 }\n  out = []\n  nums2.each do |x|\n    if count[x] > 0\n      out << x\n      count[x] -= 1\n    end\n  end\n  out.sort\nend`,
      },
    };
  })(),

  // ── Find All Duplicates in an Array ─────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const count = new Array(nums.length + 1).fill(0);
      for (let i = 0; i < nums.length; i++) count[nums[i]]++;
      const out: number[] = [];
      for (let v = 1; v <= nums.length; v++) if (count[v] === 2) out.push(v);
      return out;
    };
    return {
      slug: "find-all-duplicates-in-an-array",
      title: "Find All Duplicates in an Array",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Amazon", "Google", "Microsoft", "Flipkart"],
      signature: { funcName: "findDuplicates", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums` of length `n` where every `nums[i]` is in the range `[1, n]` and each value appears **once or twice**, return all the values that appear twice, in **increasing order**.",
        [
          { in: "nums = [4,3,2,7,8,2,3,1]", out: "[2,3]" },
          { in: "nums = [1,1,2]", out: "[1]" },
          { in: "nums = [1]", out: "[]" },
        ],
        ["1 <= nums.length <= 40", "1 <= nums[i] <= nums.length", "Each element appears once or twice."],
        "Can you do it in O(n) time using only the output array as extra space?"),
      hints: [
        "The values are confined to `1..n`, which means each one can index the array itself.",
        "Counting occurrences in an array of size n + 1 is the direct O(n) solution.",
        "For O(1) extra space, negate `nums[abs(v) - 1]` as a visited mark — meeting an already-negative slot means the second sighting.",
      ],
      examples: [
        { input: "[4,3,2,7,8,2,3,1]", expectedOutput: "[2,3]" },
        { input: "[1,1,2]", expectedOutput: "[1]" },
        { input: "[1]", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const dupCount = ri(rng, 0, Math.floor(n / 2));
        const values = Array.from({ length: n }, (_, i) => i + 1);
        shuffle(rng, values);
        const dups = values.slice(0, dupCount);
        const singles = values.slice(dupCount, n - dupCount);
        const nums = shuffle(rng, singles.concat(dups, dups));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def findDuplicates(nums):\n    count = [0] * (len(nums) + 1)\n    for x in nums:\n        count[x] += 1\n    return [v for v in range(1, len(nums) + 1) if count[v] == 2]`,
        javascript: `var findDuplicates = function(nums) {\n    const count = new Array(nums.length + 1).fill(0);\n    for (let i = 0; i < nums.length; i++) count[nums[i]]++;\n    const out = [];\n    for (let v = 1; v <= nums.length; v++) {\n        if (count[v] === 2) out.push(v);\n    }\n    return out;\n};`,
              typescript: `function findDuplicates(nums: number[]): number[] {\n    var count: number[] = [];\n    for (var k = 0; k <= nums.length; k++) count.push(0);\n    for (var i = 0; i < nums.length; i++) count[nums[i]]++;\n    var out: number[] = [];\n    for (var v = 1; v <= nums.length; v++) {\n        if (count[v] === 2) out.push(v);\n    }\n    return out;\n}`,
              java: `public static int[] findDuplicates(int[] nums) {\n    int[] count = new int[nums.length + 1];\n    for (int x : nums) count[x]++;\n    List<Integer> out = new ArrayList<>();\n    for (int v = 1; v <= nums.length; v++) {\n        if (count[v] == 2) out.add(v);\n    }\n    int[] res = new int[out.size()];\n    for (int i = 0; i < res.length; i++) res[i] = out.get(i);\n    return res;\n}`,
              cpp: `vector<int> findDuplicates(vector<int>& nums) {\n    vector<int> count(nums.size() + 1, 0);\n    for (int x : nums) count[x]++;\n    vector<int> out;\n    for (int v = 1; v <= (int) nums.size(); v++) {\n        if (count[v] == 2) out.push_back(v);\n    }\n    return out;\n}`,
              c: `int* findDuplicates(int* nums, int numsSize, int* returnSize) {\n    int* count = (int*) calloc(numsSize + 1, sizeof(int));\n    for (int i = 0; i < numsSize; i++) count[nums[i]]++;\n    int* out = (int*) malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));\n    int len = 0;\n    for (int v = 1; v <= numsSize; v++) {\n        if (count[v] == 2) out[len++] = v;\n    }\n    free(count);\n    *returnSize = len;\n    return out;\n}`,
              csharp: `public static int[] FindDuplicates(int[] nums)\n{\n    int[] count = new int[nums.Length + 1];\n    foreach (int x in nums) count[x]++;\n    var out_ = new List<int>();\n    for (int v = 1; v <= nums.Length; v++)\n    {\n        if (count[v] == 2) out_.Add(v);\n    }\n    return out_.ToArray();\n}`,
              go: `func findDuplicates(nums []int) []int {\n	count := make([]int, len(nums)+1)\n	for _, x := range nums {\n		count[x]++\n	}\n	out := []int{}\n	for v := 1; v <= len(nums); v++ {\n		if count[v] == 2 {\n			out = append(out, v)\n		}\n	}\n	return out\n}`,
              kotlin: `fun findDuplicates(nums: IntArray): IntArray {\n    val count = IntArray(nums.size + 1)\n    for (x in nums) count[x]++\n    val out = ArrayList<Int>()\n    for (v in 1..nums.size) {\n        if (count[v] == 2) out.add(v)\n    }\n    return out.toIntArray()\n}`,
              swift: `func findDuplicates(_ nums: [Int]) -> [Int] {\n    var count = [Int](repeating: 0, count: nums.count + 1)\n    for x in nums { count[x] += 1 }\n    var out: [Int] = []\n    var v = 1\n    while v <= nums.count {\n        if count[v] == 2 { out.append(v) }\n        v += 1\n    }\n    return out\n}`,
              rust: `fn findDuplicates(nums: Vec<i32>) -> Vec<i32> {\n    let n = nums.len();\n    let mut count = vec![0i32; n + 1];\n    for x in nums.iter() {\n        count[*x as usize] += 1;\n    }\n    let mut out: Vec<i32> = Vec::new();\n    for v in 1..=n {\n        if count[v] == 2 {\n            out.push(v as i32);\n        }\n    }\n    out\n}`,
              php: `function findDuplicates($nums) {\n    $n = count($nums);\n    $count = array_fill(0, $n + 1, 0);\n    foreach ($nums as $x) $count[$x]++;\n    $out = array();\n    for ($v = 1; $v <= $n; $v++) {\n        if ($count[$v] === 2) $out[] = $v;\n    }\n    return $out;\n}`,
              ruby: `def findDuplicates(nums)\n  count = Array.new(nums.length + 1, 0)\n  nums.each { |x| count[x] += 1 }\n  (1..nums.length).select { |v| count[v] == 2 }\nend`,
      },
    };
  })(),

  // ── Set Mismatch ────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const count = new Array(nums.length + 1).fill(0);
      for (let i = 0; i < nums.length; i++) count[nums[i]]++;
      let dup = 0, missing = 0;
      for (let v = 1; v <= nums.length; v++) {
        if (count[v] === 2) dup = v;
        if (count[v] === 0) missing = v;
      }
      return [dup, missing];
    };
    return {
      slug: "set-mismatch",
      title: "Set Mismatch",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Bit Manipulation", "Sorting", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "findErrorNums", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You have a set `s` that originally held the numbers `1` through `n`. Because of an error, **one** value was duplicated on top of **another**, so the array `nums` now contains one number twice and is missing one number entirely.\n\nReturn an array `[duplicated, missing]`.",
        [
          { in: "nums = [1,2,2,4]", out: "[2,3]", note: "2 appears twice, and 3 never appears." },
          { in: "nums = [1,1]", out: "[1,2]" },
          { in: "nums = [3,2,2]", out: "[2,1]" },
        ],
        ["2 <= nums.length <= 40", "1 <= nums[i] <= nums.length"]),
      hints: [
        "Count how often each of `1..n` occurs — the answer is the value counted twice and the value counted zero times.",
        "A sum-based trick also works: compare the actual sum against `n(n+1)/2` and the actual sum of squares against its expected value.",
        "The order of the returned pair matters: duplicate first, missing second.",
      ],
      examples: [
        { input: "[1,2,2,4]", expectedOutput: "[2,3]" },
        { input: "[1,1]", expectedOutput: "[1,2]" },
        { input: "[3,2,2]", expectedOutput: "[2,1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 40);
        const missing = ri(rng, 1, n);
        let dup = ri(rng, 1, n);
        while (dup === missing) dup = ri(rng, 1, n);
        const nums: number[] = [];
        for (let v = 1; v <= n; v++) nums.push(v === missing ? dup : v);
        shuffle(rng, nums);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def findErrorNums(nums):\n    n = len(nums)\n    count = [0] * (n + 1)\n    for x in nums:\n        count[x] += 1\n    dup = missing = 0\n    for v in range(1, n + 1):\n        if count[v] == 2:\n            dup = v\n        elif count[v] == 0:\n            missing = v\n    return [dup, missing]`,
        javascript: `var findErrorNums = function(nums) {\n    const n = nums.length;\n    const count = new Array(n + 1).fill(0);\n    for (let i = 0; i < n; i++) count[nums[i]]++;\n    let dup = 0, missing = 0;\n    for (let v = 1; v <= n; v++) {\n        if (count[v] === 2) dup = v;\n        else if (count[v] === 0) missing = v;\n    }\n    return [dup, missing];\n};`,
              typescript: `function findErrorNums(nums: number[]): number[] {\n    var n = nums.length;\n    var count: number[] = [];\n    for (var k = 0; k <= n; k++) count.push(0);\n    for (var i = 0; i < n; i++) count[nums[i]]++;\n    var dup = 0;\n    var missing = 0;\n    for (var v = 1; v <= n; v++) {\n        if (count[v] === 2) dup = v;\n        else if (count[v] === 0) missing = v;\n    }\n    return [dup, missing];\n}`,
              java: `public static int[] findErrorNums(int[] nums) {\n    int n = nums.length;\n    int[] count = new int[n + 1];\n    for (int x : nums) count[x]++;\n    int dup = 0, missing = 0;\n    for (int v = 1; v <= n; v++) {\n        if (count[v] == 2) dup = v;\n        else if (count[v] == 0) missing = v;\n    }\n    return new int[]{dup, missing};\n}`,
              cpp: `vector<int> findErrorNums(vector<int>& nums) {\n    int n = (int) nums.size();\n    vector<int> count(n + 1, 0);\n    for (int x : nums) count[x]++;\n    int dup = 0, missing = 0;\n    for (int v = 1; v <= n; v++) {\n        if (count[v] == 2) dup = v;\n        else if (count[v] == 0) missing = v;\n    }\n    return {dup, missing};\n}`,
              c: `int* findErrorNums(int* nums, int numsSize, int* returnSize) {\n    int* count = (int*) calloc(numsSize + 1, sizeof(int));\n    for (int i = 0; i < numsSize; i++) count[nums[i]]++;\n    int dup = 0, missing = 0;\n    for (int v = 1; v <= numsSize; v++) {\n        if (count[v] == 2) dup = v;\n        else if (count[v] == 0) missing = v;\n    }\n    free(count);\n    int* out = (int*) malloc(sizeof(int) * 2);\n    out[0] = dup;\n    out[1] = missing;\n    *returnSize = 2;\n    return out;\n}`,
              csharp: `public static int[] FindErrorNums(int[] nums)\n{\n    int n = nums.Length;\n    int[] count = new int[n + 1];\n    foreach (int x in nums) count[x]++;\n    int dup = 0, missing = 0;\n    for (int v = 1; v <= n; v++)\n    {\n        if (count[v] == 2) dup = v;\n        else if (count[v] == 0) missing = v;\n    }\n    return new int[] { dup, missing };\n}`,
              go: `func findErrorNums(nums []int) []int {\n	n := len(nums)\n	count := make([]int, n+1)\n	for _, x := range nums {\n		count[x]++\n	}\n	dup, missing := 0, 0\n	for v := 1; v <= n; v++ {\n		if count[v] == 2 {\n			dup = v\n		} else if count[v] == 0 {\n			missing = v\n		}\n	}\n	return []int{dup, missing}\n}`,
              kotlin: `fun findErrorNums(nums: IntArray): IntArray {\n    val n = nums.size\n    val count = IntArray(n + 1)\n    for (x in nums) count[x]++\n    var dup = 0\n    var missing = 0\n    for (v in 1..n) {\n        if (count[v] == 2) dup = v\n        else if (count[v] == 0) missing = v\n    }\n    return intArrayOf(dup, missing)\n}`,
              swift: `func findErrorNums(_ nums: [Int]) -> [Int] {\n    let n = nums.count\n    var count = [Int](repeating: 0, count: n + 1)\n    for x in nums { count[x] += 1 }\n    var dup = 0\n    var missing = 0\n    for v in 1...n {\n        if count[v] == 2 { dup = v }\n        else if count[v] == 0 { missing = v }\n    }\n    return [dup, missing]\n}`,
              rust: `fn findErrorNums(nums: Vec<i32>) -> Vec<i32> {\n    let n = nums.len();\n    let mut count = vec![0i32; n + 1];\n    for x in nums.iter() {\n        count[*x as usize] += 1;\n    }\n    let mut dup = 0i32;\n    let mut missing = 0i32;\n    for v in 1..=n {\n        if count[v] == 2 {\n            dup = v as i32;\n        } else if count[v] == 0 {\n            missing = v as i32;\n        }\n    }\n    vec![dup, missing]\n}`,
              php: `function findErrorNums($nums) {\n    $n = count($nums);\n    $count = array_fill(0, $n + 1, 0);\n    foreach ($nums as $x) $count[$x]++;\n    $dup = 0;\n    $missing = 0;\n    for ($v = 1; $v <= $n; $v++) {\n        if ($count[$v] === 2) $dup = $v;\n        else if ($count[$v] === 0) $missing = $v;\n    }\n    return array($dup, $missing);\n}`,
              ruby: `def findErrorNums(nums)\n  n = nums.length\n  count = Array.new(n + 1, 0)\n  nums.each { |x| count[x] += 1 }\n  dup = 0\n  missing = 0\n  (1..n).each do |v|\n    if count[v] == 2\n      dup = v\n    elsif count[v] == 0\n      missing = v\n    end\n  end\n  [dup, missing]\nend`,
      },
    };
  })(),

  // ── Next Permutation ────────────────────────────────────────────
  (() => {
    const ref = (input: number[]) => {
      const nums = input.slice();
      const n = nums.length;
      let i = n - 2;
      while (i >= 0 && nums[i] >= nums[i + 1]) i--;
      if (i >= 0) {
        let j = n - 1;
        while (nums[j] <= nums[i]) j--;
        const t = nums[i]; nums[i] = nums[j]; nums[j] = t;
      }
      for (let l = i + 1, r = n - 1; l < r; l++, r--) {
        const t = nums[l]; nums[l] = nums[r]; nums[r] = t;
      }
      return nums;
    };
    return {
      slug: "next-permutation",
      title: "Next Permutation",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Google", "Amazon", "Meta", "Flipkart", "Microsoft"],
      signature: { funcName: "nextPermutation", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "A **permutation** of an array is one of its possible orderings. Listing all permutations of an array in increasing lexicographic order gives a sequence; the **next permutation** of an arrangement is the one that follows it in that sequence.\n\nIf no greater arrangement exists, the next permutation is the smallest one — the array sorted in ascending order.\n\nGiven `nums`, return its next permutation.",
        [
          { in: "nums = [1,2,3]", out: "[1,3,2]" },
          { in: "nums = [3,2,1]", out: "[1,2,3]", note: "This is the largest arrangement, so it wraps to the smallest." },
          { in: "nums = [1,1,5]", out: "[1,5,1]" },
        ],
        ["1 <= nums.length <= 20", "0 <= nums[i] <= 30"]),
      hints: [
        "Scan from the right for the first index `i` with `nums[i] < nums[i + 1]` — the suffix after it is non-increasing and already maximal.",
        "Swap `nums[i]` with the **rightmost** element greater than it; that is the smallest possible increase at position `i`.",
        "Then reverse the suffix, turning the largest arrangement of those values into the smallest.",
      ],
      examples: [
        { input: "[1,2,3]", expectedOutput: "[1,3,2]" },
        { input: "[3,2,1]", expectedOutput: "[1,2,3]" },
        { input: "[1,1,5]", expectedOutput: "[1,5,1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20);
        const nums = rng() < 0.4 ? randArr(rng, n, 0, 3) : randArr(rng, n, 0, 30);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def nextPermutation(nums):\n    nums = list(nums)\n    n = len(nums)\n    i = n - 2\n    while i >= 0 and nums[i] >= nums[i + 1]:\n        i -= 1\n    if i >= 0:\n        j = n - 1\n        while nums[j] <= nums[i]:\n            j -= 1\n        nums[i], nums[j] = nums[j], nums[i]\n    left, right = i + 1, n - 1\n    while left < right:\n        nums[left], nums[right] = nums[right], nums[left]\n        left += 1\n        right -= 1\n    return nums`,
        javascript: `var nextPermutation = function(nums) {\n    const a = nums.slice();\n    const n = a.length;\n    let i = n - 2;\n    while (i >= 0 && a[i] >= a[i + 1]) i--;\n    if (i >= 0) {\n        let j = n - 1;\n        while (a[j] <= a[i]) j--;\n        const t = a[i]; a[i] = a[j]; a[j] = t;\n    }\n    for (let l = i + 1, r = n - 1; l < r; l++, r--) {\n        const t = a[l]; a[l] = a[r]; a[r] = t;\n    }\n    return a;\n};`,
              typescript: `function nextPermutation(nums: number[]): number[] {\n    var a = nums.slice();\n    var n = a.length;\n    var i = n - 2;\n    while (i >= 0 && a[i] >= a[i + 1]) i--;\n    if (i >= 0) {\n        var j = n - 1;\n        while (a[j] <= a[i]) j--;\n        var t = a[i];\n        a[i] = a[j];\n        a[j] = t;\n    }\n    var l = i + 1;\n    var r = n - 1;\n    while (l < r) {\n        var tmp = a[l];\n        a[l] = a[r];\n        a[r] = tmp;\n        l++;\n        r--;\n    }\n    return a;\n}`,
              java: `public static int[] nextPermutation(int[] nums) {\n    int[] a = Arrays.copyOf(nums, nums.length);\n    int n = a.length;\n    int i = n - 2;\n    while (i >= 0 && a[i] >= a[i + 1]) i--;\n    if (i >= 0) {\n        int j = n - 1;\n        while (a[j] <= a[i]) j--;\n        int t = a[i]; a[i] = a[j]; a[j] = t;\n    }\n    for (int l = i + 1, r = n - 1; l < r; l++, r--) {\n        int t = a[l]; a[l] = a[r]; a[r] = t;\n    }\n    return a;\n}`,
              cpp: `vector<int> nextPermutation(vector<int>& nums) {\n    vector<int> a = nums;\n    int n = (int) a.size();\n    int i = n - 2;\n    while (i >= 0 && a[i] >= a[i + 1]) i--;\n    if (i >= 0) {\n        int j = n - 1;\n        while (a[j] <= a[i]) j--;\n        swap(a[i], a[j]);\n    }\n    reverse(a.begin() + i + 1, a.end());\n    return a;\n}`,
              c: `int* nextPermutation(int* nums, int numsSize, int* returnSize) {\n    int* a = (int*) malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));\n    for (int k = 0; k < numsSize; k++) a[k] = nums[k];\n    int i = numsSize - 2;\n    while (i >= 0 && a[i] >= a[i + 1]) i--;\n    if (i >= 0) {\n        int j = numsSize - 1;\n        while (a[j] <= a[i]) j--;\n        int t = a[i]; a[i] = a[j]; a[j] = t;\n    }\n    int l = i + 1, r = numsSize - 1;\n    while (l < r) {\n        int t = a[l]; a[l] = a[r]; a[r] = t;\n        l++; r--;\n    }\n    *returnSize = numsSize;\n    return a;\n}`,
              csharp: `public static int[] NextPermutation(int[] nums)\n{\n    int[] a = (int[]) nums.Clone();\n    int n = a.Length;\n    int i = n - 2;\n    while (i >= 0 && a[i] >= a[i + 1]) i--;\n    if (i >= 0)\n    {\n        int j = n - 1;\n        while (a[j] <= a[i]) j--;\n        int t = a[i]; a[i] = a[j]; a[j] = t;\n    }\n    for (int l = i + 1, r = n - 1; l < r; l++, r--)\n    {\n        int t = a[l]; a[l] = a[r]; a[r] = t;\n    }\n    return a;\n}`,
              go: `func nextPermutation(nums []int) []int {\n	a := make([]int, len(nums))\n	copy(a, nums)\n	n := len(a)\n	i := n - 2\n	for i >= 0 && a[i] >= a[i+1] {\n		i--\n	}\n	if i >= 0 {\n		j := n - 1\n		for a[j] <= a[i] {\n			j--\n		}\n		a[i], a[j] = a[j], a[i]\n	}\n	for l, r := i+1, n-1; l < r; l, r = l+1, r-1 {\n		a[l], a[r] = a[r], a[l]\n	}\n	return a\n}`,
              kotlin: `fun nextPermutation(nums: IntArray): IntArray {\n    val a = nums.copyOf()\n    val n = a.size\n    var i = n - 2\n    while (i >= 0 && a[i] >= a[i + 1]) i--\n    if (i >= 0) {\n        var j = n - 1\n        while (a[j] <= a[i]) j--\n        val t = a[i]; a[i] = a[j]; a[j] = t\n    }\n    var l = i + 1\n    var r = n - 1\n    while (l < r) {\n        val t = a[l]; a[l] = a[r]; a[r] = t\n        l++\n        r--\n    }\n    return a\n}`,
              swift: `func nextPermutation(_ nums: [Int]) -> [Int] {\n    var a = nums\n    let n = a.count\n    var i = n - 2\n    while i >= 0 && a[i] >= a[i + 1] { i -= 1 }\n    if i >= 0 {\n        var j = n - 1\n        while a[j] <= a[i] { j -= 1 }\n        a.swapAt(i, j)\n    }\n    var l = i + 1\n    var r = n - 1\n    while l < r {\n        a.swapAt(l, r)\n        l += 1\n        r -= 1\n    }\n    return a\n}`,
              rust: `fn nextPermutation(nums: Vec<i32>) -> Vec<i32> {\n    let mut a = nums;\n    let n = a.len();\n    let mut i: i32 = n as i32 - 2;\n    while i >= 0 && a[i as usize] >= a[(i + 1) as usize] {\n        i -= 1;\n    }\n    if i >= 0 {\n        let mut j = n - 1;\n        while a[j] <= a[i as usize] {\n            j -= 1;\n        }\n        a.swap(i as usize, j);\n    }\n    let start = (i + 1) as usize;\n    a[start..n].reverse();\n    a\n}`,
              php: `function nextPermutation($nums) {\n    $a = $nums;\n    $n = count($a);\n    $i = $n - 2;\n    while ($i >= 0 && $a[$i] >= $a[$i + 1]) $i--;\n    if ($i >= 0) {\n        $j = $n - 1;\n        while ($a[$j] <= $a[$i]) $j--;\n        $t = $a[$i]; $a[$i] = $a[$j]; $a[$j] = $t;\n    }\n    $l = $i + 1;\n    $r = $n - 1;\n    while ($l < $r) {\n        $t = $a[$l]; $a[$l] = $a[$r]; $a[$r] = $t;\n        $l++; $r--;\n    }\n    return $a;\n}`,
              ruby: `def nextPermutation(nums)\n  a = nums.dup\n  n = a.length\n  i = n - 2\n  i -= 1 while i >= 0 && a[i] >= a[i + 1]\n  if i >= 0\n    j = n - 1\n    j -= 1 while a[j] <= a[i]\n    a[i], a[j] = a[j], a[i]\n  end\n  l = i + 1\n  r = n - 1\n  while l < r\n    a[l], a[r] = a[r], a[l]\n    l += 1\n    r -= 1\n  end\n  a\nend`,
      },
    };
  })(),

  // ── Find Pivot Index ────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let total = 0;
      for (let i = 0; i < nums.length; i++) total += nums[i];
      let left = 0;
      for (let i = 0; i < nums.length; i++) {
        if (left === total - left - nums[i]) return i;
        left += nums[i];
      }
      return -1;
    };
    return {
      slug: "find-pivot-index",
      title: "Find Pivot Index",
      difficulty: "EASY" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Google", "Meta", "Adobe", "TCS"],
      signature: { funcName: "pivotIndex", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of integers `nums`, return the **leftmost pivot index**: the index where the sum of all numbers strictly to its left equals the sum of all numbers strictly to its right.\n\nAt index 0 the left sum is 0, and at the last index the right sum is 0. If no pivot index exists, return `-1`.",
        [
          { in: "nums = [1,7,3,6,5,6]", out: "3", note: "1+7+3 = 11 on the left and 5+6 = 11 on the right." },
          { in: "nums = [1,2,3]", out: "-1" },
          { in: "nums = [2,1,-1]", out: "0", note: "The left sum is 0 and the right sum is 1 + (-1) = 0." },
        ],
        ["1 <= nums.length <= 40", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "Recomputing both sides at every index is O(n²) — the total never changes, so compute it once.",
        "Keep a running left sum; the right sum is then `total - left - nums[i]`, available in O(1).",
        "Return at the first match, since the problem asks for the leftmost such index.",
      ],
      examples: [
        { input: "[1,7,3,6,5,6]", expectedOutput: "3" },
        { input: "[1,2,3]", expectedOutput: "-1" },
        { input: "[2,1,-1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nums = rng() < 0.5 ? randArr(rng, n, -4, 4) : randArr(rng, n, -1000, 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def pivotIndex(nums):\n    total = sum(nums)\n    left = 0\n    for i, x in enumerate(nums):\n        if left == total - left - x:\n            return i\n        left += x\n    return -1`,
        javascript: `var pivotIndex = function(nums) {\n    let total = 0;\n    for (let i = 0; i < nums.length; i++) total += nums[i];\n    let left = 0;\n    for (let i = 0; i < nums.length; i++) {\n        if (left === total - left - nums[i]) return i;\n        left += nums[i];\n    }\n    return -1;\n};`,
              typescript: `function pivotIndex(nums: number[]): number {\n    var total = 0;\n    for (var i = 0; i < nums.length; i++) total += nums[i];\n    var left = 0;\n    for (var j = 0; j < nums.length; j++) {\n        if (left === total - left - nums[j]) return j;\n        left += nums[j];\n    }\n    return -1;\n}`,
              java: `public static int pivotIndex(int[] nums) {\n    int total = 0;\n    for (int x : nums) total += x;\n    int left = 0;\n    for (int i = 0; i < nums.length; i++) {\n        if (left == total - left - nums[i]) return i;\n        left += nums[i];\n    }\n    return -1;\n}`,
              cpp: `int pivotIndex(vector<int>& nums) {\n    int total = 0;\n    for (int x : nums) total += x;\n    int left = 0;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        if (left == total - left - nums[i]) return i;\n        left += nums[i];\n    }\n    return -1;\n}`,
              c: `int pivotIndex(int* nums, int numsSize) {\n    int total = 0;\n    for (int i = 0; i < numsSize; i++) total += nums[i];\n    int left = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (left == total - left - nums[i]) return i;\n        left += nums[i];\n    }\n    return -1;\n}`,
              csharp: `public static int PivotIndex(int[] nums)\n{\n    int total = 0;\n    foreach (int x in nums) total += x;\n    int left = 0;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        if (left == total - left - nums[i]) return i;\n        left += nums[i];\n    }\n    return -1;\n}`,
              go: `func pivotIndex(nums []int) int {\n	total := 0\n	for _, x := range nums {\n		total += x\n	}\n	left := 0\n	for i, x := range nums {\n		if left == total-left-x {\n			return i\n		}\n		left += x\n	}\n	return -1\n}`,
              kotlin: `fun pivotIndex(nums: IntArray): Int {\n    var total = 0\n    for (x in nums) total += x\n    var left = 0\n    for (i in nums.indices) {\n        if (left == total - left - nums[i]) return i\n        left += nums[i]\n    }\n    return -1\n}`,
              swift: `func pivotIndex(_ nums: [Int]) -> Int {\n    var total = 0\n    for x in nums { total += x }\n    var left = 0\n    for i in 0..<nums.count {\n        if left == total - left - nums[i] { return i }\n        left += nums[i]\n    }\n    return -1\n}`,
              rust: `fn pivotIndex(nums: Vec<i32>) -> i32 {\n    let total: i32 = nums.iter().sum();\n    let mut left = 0;\n    for i in 0..nums.len() {\n        if left == total - left - nums[i] {\n            return i as i32;\n        }\n        left += nums[i];\n    }\n    -1\n}`,
              php: `function pivotIndex($nums) {\n    $total = array_sum($nums);\n    $left = 0;\n    for ($i = 0; $i < count($nums); $i++) {\n        if ($left === $total - $left - $nums[$i]) return $i;\n        $left += $nums[$i];\n    }\n    return -1;\n}`,
              ruby: `def pivotIndex(nums)\n  total = nums.sum\n  left = 0\n  nums.each_with_index do |x, i|\n    return i if left == total - left - x\n    left += x\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Running Sum of 1d Array ─────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const out: number[] = [];
      let sum = 0;
      for (let i = 0; i < nums.length; i++) { sum += nums[i]; out.push(sum); }
      return out;
    };
    return {
      slug: "running-sum-of-1d-array",
      title: "Running Sum of 1d Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Microsoft", "Accenture"],
      signature: { funcName: "runningSum", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an array `nums`, the running sum is defined as `runningSum[i] = sum(nums[0] … nums[i])`.\n\nReturn the running sum of `nums`.",
        [
          { in: "nums = [1,2,3,4]", out: "[1,3,6,10]", note: "[1, 1+2, 1+2+3, 1+2+3+4]." },
          { in: "nums = [1,1,1,1,1]", out: "[1,2,3,4,5]" },
          { in: "nums = [3,1,2,10,1]", out: "[3,4,6,16,17]" },
        ],
        ["1 <= nums.length <= 40", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "Each answer is the previous answer plus the current element — one pass, one accumulator.",
        "You can also write the result in place, since position `i` only ever reads position `i - 1`.",
      ],
      examples: [
        { input: "[1,2,3,4]", expectedOutput: "[1,3,6,10]" },
        { input: "[1,1,1,1,1]", expectedOutput: "[1,2,3,4,5]" },
        { input: "[3,1,2,10,1]", expectedOutput: "[3,4,6,16,17]" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), -1000, 1000);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def runningSum(nums):\n    out = []\n    total = 0\n    for x in nums:\n        total += x\n        out.append(total)\n    return out`,
        javascript: `var runningSum = function(nums) {\n    const out = [];\n    let total = 0;\n    for (let i = 0; i < nums.length; i++) {\n        total += nums[i];\n        out.push(total);\n    }\n    return out;\n};`,
              typescript: `function runningSum(nums: number[]): number[] {\n    var out: number[] = [];\n    var total = 0;\n    for (var i = 0; i < nums.length; i++) {\n        total += nums[i];\n        out.push(total);\n    }\n    return out;\n}`,
              java: `public static int[] runningSum(int[] nums) {\n    int[] out = new int[nums.length];\n    int total = 0;\n    for (int i = 0; i < nums.length; i++) {\n        total += nums[i];\n        out[i] = total;\n    }\n    return out;\n}`,
              cpp: `vector<int> runningSum(vector<int>& nums) {\n    vector<int> out;\n    int total = 0;\n    for (int x : nums) {\n        total += x;\n        out.push_back(total);\n    }\n    return out;\n}`,
              c: `int* runningSum(int* nums, int numsSize, int* returnSize) {\n    int* out = (int*) malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));\n    int total = 0;\n    for (int i = 0; i < numsSize; i++) {\n        total += nums[i];\n        out[i] = total;\n    }\n    *returnSize = numsSize;\n    return out;\n}`,
              csharp: `public static int[] RunningSum(int[] nums)\n{\n    int[] out_ = new int[nums.Length];\n    int total = 0;\n    for (int i = 0; i < nums.Length; i++)\n    {\n        total += nums[i];\n        out_[i] = total;\n    }\n    return out_;\n}`,
              go: `func runningSum(nums []int) []int {\n	out := make([]int, len(nums))\n	total := 0\n	for i, x := range nums {\n		total += x\n		out[i] = total\n	}\n	return out\n}`,
              kotlin: `fun runningSum(nums: IntArray): IntArray {\n    val out = IntArray(nums.size)\n    var total = 0\n    for (i in nums.indices) {\n        total += nums[i]\n        out[i] = total\n    }\n    return out\n}`,
              swift: `func runningSum(_ nums: [Int]) -> [Int] {\n    var out: [Int] = []\n    var total = 0\n    for x in nums {\n        total += x\n        out.append(total)\n    }\n    return out\n}`,
              rust: `fn runningSum(nums: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    let mut total = 0;\n    for x in nums.iter() {\n        total += *x;\n        out.push(total);\n    }\n    out\n}`,
              php: `function runningSum($nums) {\n    $out = array();\n    $total = 0;\n    foreach ($nums as $x) {\n        $total += $x;\n        $out[] = $total;\n    }\n    return $out;\n}`,
              ruby: `def runningSum(nums)\n  total = 0\n  nums.map { |x| total += x }\nend`,
      },
    };
  })(),

  // ── How Many Numbers Are Smaller Than the Current Number ────────
  (() => {
    const ref = (nums: number[]) => {
      const out: number[] = [];
      for (let i = 0; i < nums.length; i++) {
        let c = 0;
        for (let j = 0; j < nums.length; j++) if (nums[j] < nums[i]) c++;
        out.push(c);
      }
      return out;
    };
    return {
      slug: "how-many-numbers-are-smaller-than-the-current-number",
      title: "How Many Numbers Are Smaller Than the Current Number",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Counting Sort", "Amazon", "Google", "Adobe"],
      signature: { funcName: "smallerNumbersThanCurrent", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given the array `nums`, for each `nums[i]` count how many numbers in the array are **strictly smaller** than it.\n\nReturn the answer as an array in the same order as the input.",
        [
          { in: "nums = [8,1,2,2,3]", out: "[4,0,1,1,3]", note: "For 8 there are four smaller values; for 1 there are none; for each 2 only the 1 is smaller." },
          { in: "nums = [6,5,4,8]", out: "[2,1,0,3]" },
          { in: "nums = [7,7,7,7]", out: "[0,0,0,0]", note: "Strictly smaller, so equal values do not count." },
        ],
        ["1 <= nums.length <= 40", "0 <= nums[i] <= 100"],
        "The values are bounded by 100. Can you answer every query in O(1) after O(n + 100) preprocessing?"),
      hints: [
        "The nested-loop count is O(n²) and passes at this size, but the bounded range invites something better.",
        "Tally how many times each value 0…100 occurs, then take a prefix sum of those tallies.",
        "`prefix[v - 1]` is then exactly how many elements are strictly below `v`.",
      ],
      examples: [
        { input: "[8,1,2,2,3]", expectedOutput: "[4,0,1,1,3]" },
        { input: "[6,5,4,8]", expectedOutput: "[2,1,0,3]" },
        { input: "[7,7,7,7]", expectedOutput: "[0,0,0,0]" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 0, 100);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def smallerNumbersThanCurrent(nums):\n    count = [0] * 102\n    for x in nums:\n        count[x + 1] += 1\n    for v in range(1, 102):\n        count[v] += count[v - 1]\n    return [count[x] for x in nums]`,
        javascript: `var smallerNumbersThanCurrent = function(nums) {\n    const count = new Array(102).fill(0);\n    for (let i = 0; i < nums.length; i++) count[nums[i] + 1]++;\n    for (let v = 1; v < 102; v++) count[v] += count[v - 1];\n    const out = [];\n    for (let i = 0; i < nums.length; i++) out.push(count[nums[i]]);\n    return out;\n};`,
              typescript: `function smallerNumbersThanCurrent(nums: number[]): number[] {\n    var count: number[] = [];\n    for (var k = 0; k < 102; k++) count.push(0);\n    for (var i = 0; i < nums.length; i++) count[nums[i] + 1]++;\n    for (var v = 1; v < 102; v++) count[v] += count[v - 1];\n    var out: number[] = [];\n    for (var j = 0; j < nums.length; j++) out.push(count[nums[j]]);\n    return out;\n}`,
              java: `public static int[] smallerNumbersThanCurrent(int[] nums) {\n    int[] count = new int[102];\n    for (int x : nums) count[x + 1]++;\n    for (int v = 1; v < 102; v++) count[v] += count[v - 1];\n    int[] out = new int[nums.length];\n    for (int i = 0; i < nums.length; i++) out[i] = count[nums[i]];\n    return out;\n}`,
              cpp: `vector<int> smallerNumbersThanCurrent(vector<int>& nums) {\n    vector<int> count(102, 0);\n    for (int x : nums) count[x + 1]++;\n    for (int v = 1; v < 102; v++) count[v] += count[v - 1];\n    vector<int> out;\n    for (int x : nums) out.push_back(count[x]);\n    return out;\n}`,
              c: `int* smallerNumbersThanCurrent(int* nums, int numsSize, int* returnSize) {\n    int count[102] = {0};\n    for (int i = 0; i < numsSize; i++) count[nums[i] + 1]++;\n    for (int v = 1; v < 102; v++) count[v] += count[v - 1];\n    int* out = (int*) malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));\n    for (int i = 0; i < numsSize; i++) out[i] = count[nums[i]];\n    *returnSize = numsSize;\n    return out;\n}`,
              csharp: `public static int[] SmallerNumbersThanCurrent(int[] nums)\n{\n    int[] count = new int[102];\n    foreach (int x in nums) count[x + 1]++;\n    for (int v = 1; v < 102; v++) count[v] += count[v - 1];\n    int[] out_ = new int[nums.Length];\n    for (int i = 0; i < nums.Length; i++) out_[i] = count[nums[i]];\n    return out_;\n}`,
              go: `func smallerNumbersThanCurrent(nums []int) []int {\n	count := make([]int, 102)\n	for _, x := range nums {\n		count[x+1]++\n	}\n	for v := 1; v < 102; v++ {\n		count[v] += count[v-1]\n	}\n	out := make([]int, len(nums))\n	for i, x := range nums {\n		out[i] = count[x]\n	}\n	return out\n}`,
              kotlin: `fun smallerNumbersThanCurrent(nums: IntArray): IntArray {\n    val count = IntArray(102)\n    for (x in nums) count[x + 1]++\n    for (v in 1 until 102) count[v] += count[v - 1]\n    val out = IntArray(nums.size)\n    for (i in nums.indices) out[i] = count[nums[i]]\n    return out\n}`,
              swift: `func smallerNumbersThanCurrent(_ nums: [Int]) -> [Int] {\n    var count = [Int](repeating: 0, count: 102)\n    for x in nums { count[x + 1] += 1 }\n    for v in 1..<102 { count[v] += count[v - 1] }\n    var out: [Int] = []\n    for x in nums { out.append(count[x]) }\n    return out\n}`,
              rust: `fn smallerNumbersThanCurrent(nums: Vec<i32>) -> Vec<i32> {\n    let mut count = vec![0i32; 102];\n    for x in nums.iter() {\n        count[(*x + 1) as usize] += 1;\n    }\n    for v in 1..102 {\n        count[v] += count[v - 1];\n    }\n    let mut out: Vec<i32> = Vec::new();\n    for x in nums.iter() {\n        out.push(count[*x as usize]);\n    }\n    out\n}`,
              php: `function smallerNumbersThanCurrent($nums) {\n    $count = array_fill(0, 102, 0);\n    foreach ($nums as $x) $count[$x + 1]++;\n    for ($v = 1; $v < 102; $v++) $count[$v] += $count[$v - 1];\n    $out = array();\n    foreach ($nums as $x) $out[] = $count[$x];\n    return $out;\n}`,
              ruby: `def smallerNumbersThanCurrent(nums)\n  count = Array.new(102, 0)\n  nums.each { |x| count[x + 1] += 1 }\n  (1...102).each { |v| count[v] += count[v - 1] }\n  nums.map { |x| count[x] }\nend`,
      },
    };
  })(),

  // ── Number of Good Pairs ────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const count: Record<number, number> = {};
      let total = 0;
      for (let i = 0; i < nums.length; i++) {
        total += count[nums[i]] || 0;
        count[nums[i]] = (count[nums[i]] || 0) + 1;
      }
      return total;
    };
    return {
      slug: "number-of-good-pairs",
      title: "Number of Good Pairs",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Math", "Counting", "Amazon", "Adobe", "Cognizant"],
      signature: { funcName: "numIdenticalPairs", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of integers `nums`, a pair `(i, j)` is **good** if `nums[i] == nums[j]` and `i < j`.\n\nReturn the number of good pairs.",
        [
          { in: "nums = [1,2,3,1,1,3]", out: "4", note: "The good pairs are (0,3), (0,4), (3,4) and (2,5)." },
          { in: "nums = [1,1,1,1]", out: "6", note: "Every one of the 4-choose-2 pairs qualifies." },
          { in: "nums = [1,2,3]", out: "0" },
        ],
        ["1 <= nums.length <= 40", "1 <= nums[i] <= 100"]),
      hints: [
        "A value seen `c` times contributes `c × (c - 1) / 2` pairs.",
        "Or count as you scan: each new occurrence pairs with every earlier occurrence of the same value.",
      ],
      examples: [
        { input: "[1,2,3,1,1,3]", expectedOutput: "4" },
        { input: "[1,1,1,1]", expectedOutput: "6" },
        { input: "[1,2,3]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 1, rng() < 0.5 ? 8 : 100);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def numIdenticalPairs(nums):\n    count = {}\n    total = 0\n    for x in nums:\n        total += count.get(x, 0)\n        count[x] = count.get(x, 0) + 1\n    return total`,
        javascript: `var numIdenticalPairs = function(nums) {\n    const count = new Map();\n    let total = 0;\n    for (let i = 0; i < nums.length; i++) {\n        const seen = count.get(nums[i]) || 0;\n        total += seen;\n        count.set(nums[i], seen + 1);\n    }\n    return total;\n};`,
              typescript: `function numIdenticalPairs(nums: number[]): number {\n    var count: { [key: string]: number } = {};\n    var total = 0;\n    for (var i = 0; i < nums.length; i++) {\n        var key = String(nums[i]);\n        var seen = count[key] === undefined ? 0 : count[key];\n        total += seen;\n        count[key] = seen + 1;\n    }\n    return total;\n}`,
              java: `public static int numIdenticalPairs(int[] nums) {\n    Map<Integer, Integer> count = new HashMap<>();\n    int total = 0;\n    for (int x : nums) {\n        int seen = count.getOrDefault(x, 0);\n        total += seen;\n        count.put(x, seen + 1);\n    }\n    return total;\n}`,
              cpp: `int numIdenticalPairs(vector<int>& nums) {\n    unordered_map<int, int> count;\n    int total = 0;\n    for (int x : nums) {\n        total += count[x];\n        count[x]++;\n    }\n    return total;\n}`,
              c: `int numIdenticalPairs(int* nums, int numsSize) {\n    int total = 0;\n    for (int i = 0; i < numsSize; i++) {\n        for (int j = i + 1; j < numsSize; j++) {\n            if (nums[i] == nums[j]) total++;\n        }\n    }\n    return total;\n}`,
              csharp: `public static int NumIdenticalPairs(int[] nums)\n{\n    var count = new Dictionary<int, int>();\n    int total = 0;\n    foreach (int x in nums)\n    {\n        int seen = count.ContainsKey(x) ? count[x] : 0;\n        total += seen;\n        count[x] = seen + 1;\n    }\n    return total;\n}`,
              go: `func numIdenticalPairs(nums []int) int {\n	count := make(map[int]int)\n	total := 0\n	for _, x := range nums {\n		total += count[x]\n		count[x]++\n	}\n	return total\n}`,
              kotlin: `fun numIdenticalPairs(nums: IntArray): Int {\n    val count = HashMap<Int, Int>()\n    var total = 0\n    for (x in nums) {\n        val seen = count[x] ?: 0\n        total += seen\n        count[x] = seen + 1\n    }\n    return total\n}`,
              swift: `func numIdenticalPairs(_ nums: [Int]) -> Int {\n    var count: [Int: Int] = [:]\n    var total = 0\n    for x in nums {\n        let seen = count[x] ?? 0\n        total += seen\n        count[x] = seen + 1\n    }\n    return total\n}`,
              rust: `fn numIdenticalPairs(nums: Vec<i32>) -> i32 {\n    use std::collections::HashMap;\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    let mut total = 0;\n    for x in nums.iter() {\n        let seen = count.entry(*x).or_insert(0);\n        total += *seen;\n        *seen += 1;\n    }\n    total\n}`,
              php: `function numIdenticalPairs($nums) {\n    $count = array();\n    $total = 0;\n    foreach ($nums as $x) {\n        $seen = isset($count[$x]) ? $count[$x] : 0;\n        $total += $seen;\n        $count[$x] = $seen + 1;\n    }\n    return $total;\n}`,
              ruby: `def numIdenticalPairs(nums)\n  count = Hash.new(0)\n  total = 0\n  nums.each do |x|\n    total += count[x]\n    count[x] += 1\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Shuffle the Array ───────────────────────────────────────────
  (() => {
    const ref = (nums: number[], n: number) => {
      const out: number[] = [];
      for (let i = 0; i < n; i++) { out.push(nums[i]); out.push(nums[i + n]); }
      return out;
    };
    return {
      slug: "shuffle-the-array",
      title: "Shuffle the Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Adobe", "Wipro"],
      signature: { funcName: "shuffle", params: [{ name: "nums", type: "int[]" as const }, { name: "n", type: "int" as const }], returns: "int[]" as const },
      description: describe(
        "Given the array `nums` consisting of `2n` elements in the form `[x1, x2, …, xn, y1, y2, …, yn]`, return the array in the form `[x1, y1, x2, y2, …, xn, yn]`.",
        [
          { in: "nums = [2,5,1,3,4,7], n = 3", out: "[2,3,5,4,1,7]", note: "x = [2,5,1] and y = [3,4,7], interleaved." },
          { in: "nums = [1,2,3,4,4,3,2,1], n = 4", out: "[1,4,2,3,3,2,4,1]" },
          { in: "nums = [1,1,2,2], n = 2", out: "[1,2,1,2]" },
        ],
        ["1 <= n <= 20", "nums.length == 2n", "1 <= nums[i] <= 1000"]),
      hints: [
        "`x_i` sits at index `i` and its partner `y_i` sits at index `i + n`.",
        "One pass over `i` from 0 to n - 1 appending both is all it takes.",
      ],
      examples: [
        { input: "[2,5,1,3,4,7]\n3", expectedOutput: "[2,3,5,4,1,7]" },
        { input: "[1,2,3,4,4,3,2,1]\n4", expectedOutput: "[1,4,2,3,3,2,4,1]" },
        { input: "[1,1,2,2]\n2", expectedOutput: "[1,2,1,2]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 20);
        const nums = randArr(rng, 2 * n, 1, 1000);
        return { input: `${fmtIntArr(nums)}\n${n}`, expectedOutput: fmtIntArr(ref(nums, n)) };
      },
      solutions: {
        python: `def shuffle(nums, n):\n    out = []\n    for i in range(n):\n        out.append(nums[i])\n        out.append(nums[i + n])\n    return out`,
        javascript: `var shuffle = function(nums, n) {\n    const out = [];\n    for (let i = 0; i < n; i++) {\n        out.push(nums[i]);\n        out.push(nums[i + n]);\n    }\n    return out;\n};`,
              typescript: `function shuffle(nums: number[], n: number): number[] {\n    var out: number[] = [];\n    for (var i = 0; i < n; i++) {\n        out.push(nums[i]);\n        out.push(nums[i + n]);\n    }\n    return out;\n}`,
              java: `public static int[] shuffle(int[] nums, int n) {\n    int[] out = new int[2 * n];\n    for (int i = 0; i < n; i++) {\n        out[2 * i] = nums[i];\n        out[2 * i + 1] = nums[i + n];\n    }\n    return out;\n}`,
              cpp: `vector<int> shuffle(vector<int>& nums, int n) {\n    vector<int> out;\n    for (int i = 0; i < n; i++) {\n        out.push_back(nums[i]);\n        out.push_back(nums[i + n]);\n    }\n    return out;\n}`,
              c: `int* shuffle(int* nums, int numsSize, int n, int* returnSize) {\n    int* out = (int*) malloc(sizeof(int) * (2 * n));\n    for (int i = 0; i < n; i++) {\n        out[2 * i] = nums[i];\n        out[2 * i + 1] = nums[i + n];\n    }\n    *returnSize = 2 * n;\n    return out;\n}`,
              csharp: `public static int[] Shuffle(int[] nums, int n)\n{\n    int[] out_ = new int[2 * n];\n    for (int i = 0; i < n; i++)\n    {\n        out_[2 * i] = nums[i];\n        out_[2 * i + 1] = nums[i + n];\n    }\n    return out_;\n}`,
              go: `func shuffle(nums []int, n int) []int {\n	out := make([]int, 0, 2*n)\n	for i := 0; i < n; i++ {\n		out = append(out, nums[i], nums[i+n])\n	}\n	return out\n}`,
              kotlin: `fun shuffle(nums: IntArray, n: Int): IntArray {\n    val out = IntArray(2 * n)\n    for (i in 0 until n) {\n        out[2 * i] = nums[i]\n        out[2 * i + 1] = nums[i + n]\n    }\n    return out\n}`,
              swift: `func shuffle(_ nums: [Int], _ n: Int) -> [Int] {\n    var out: [Int] = []\n    for i in 0..<n {\n        out.append(nums[i])\n        out.append(nums[i + n])\n    }\n    return out\n}`,
              rust: `fn shuffle(nums: Vec<i32>, n: i32) -> Vec<i32> {\n    let half = n as usize;\n    let mut out: Vec<i32> = Vec::new();\n    for i in 0..half {\n        out.push(nums[i]);\n        out.push(nums[i + half]);\n    }\n    out\n}`,
              php: `function shuffle($nums, $n) {\n    $out = array();\n    for ($i = 0; $i < $n; $i++) {\n        $out[] = $nums[$i];\n        $out[] = $nums[$i + $n];\n    }\n    return $out;\n}`,
              ruby: `def shuffle(nums, n)\n  out = []\n  (0...n).each do |i|\n    out << nums[i]\n    out << nums[i + n]\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Build Array from Permutation ────────────────────────────────
  (() => {
    const ref = (nums: number[]) => nums.map((_, i) => nums[nums[i]]);
    return {
      slug: "build-array-from-permutation",
      title: "Build Array from Permutation",
      difficulty: "EASY" as const,
      tags: ["Array", "Simulation", "Amazon", "Microsoft"],
      signature: { funcName: "buildArray", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given a **zero-based permutation** `nums`, build an array `ans` of the same length where `ans[i] = nums[nums[i]]`, and return it.\n\nA zero-based permutation of length `n` contains every number from `0` to `n - 1` exactly once.",
        [
          { in: "nums = [0,2,1,5,3,4]", out: "[0,1,2,4,5,3]", note: "ans[1] = nums[nums[1]] = nums[2] = 1." },
          { in: "nums = [5,0,1,2,3,4]", out: "[4,5,0,1,2,3]" },
          { in: "nums = [0]", out: "[0]" },
        ],
        ["1 <= nums.length <= 40", "0 <= nums[i] < nums.length", "nums is a permutation."],
        "Can you build the answer in place, in O(1) extra space?"),
      hints: [
        "Read `nums[i]`, then use that as an index back into `nums` — a double lookup per position.",
        "Do not overwrite as you go unless you encode both values in one slot; the later reads need the original array.",
        "The in-place trick stores `old + n * new` in each slot and divides by `n` in a second pass.",
      ],
      examples: [
        { input: "[0,2,1,5,3,4]", expectedOutput: "[0,1,2,4,5,3]" },
        { input: "[5,0,1,2,3,4]", expectedOutput: "[4,5,0,1,2,3]" },
        { input: "[0]", expectedOutput: "[0]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nums = shuffle(rng, Array.from({ length: n }, (_, i) => i));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def buildArray(nums):\n    return [nums[nums[i]] for i in range(len(nums))]`,
        javascript: `var buildArray = function(nums) {\n    const out = [];\n    for (let i = 0; i < nums.length; i++) out.push(nums[nums[i]]);\n    return out;\n};`,
              typescript: `function buildArray(nums: number[]): number[] {\n    var out: number[] = [];\n    for (var i = 0; i < nums.length; i++) out.push(nums[nums[i]]);\n    return out;\n}`,
              java: `public static int[] buildArray(int[] nums) {\n    int[] out = new int[nums.length];\n    for (int i = 0; i < nums.length; i++) out[i] = nums[nums[i]];\n    return out;\n}`,
              cpp: `vector<int> buildArray(vector<int>& nums) {\n    vector<int> out;\n    for (size_t i = 0; i < nums.size(); i++) out.push_back(nums[nums[i]]);\n    return out;\n}`,
              c: `int* buildArray(int* nums, int numsSize, int* returnSize) {\n    int* out = (int*) malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));\n    for (int i = 0; i < numsSize; i++) out[i] = nums[nums[i]];\n    *returnSize = numsSize;\n    return out;\n}`,
              csharp: `public static int[] BuildArray(int[] nums)\n{\n    int[] out_ = new int[nums.Length];\n    for (int i = 0; i < nums.Length; i++) out_[i] = nums[nums[i]];\n    return out_;\n}`,
              go: `func buildArray(nums []int) []int {\n	out := make([]int, len(nums))\n	for i := range nums {\n		out[i] = nums[nums[i]]\n	}\n	return out\n}`,
              kotlin: `fun buildArray(nums: IntArray): IntArray {\n    val out = IntArray(nums.size)\n    for (i in nums.indices) out[i] = nums[nums[i]]\n    return out\n}`,
              swift: `func buildArray(_ nums: [Int]) -> [Int] {\n    var out: [Int] = []\n    for i in 0..<nums.count { out.append(nums[nums[i]]) }\n    return out\n}`,
              rust: `fn buildArray(nums: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    for i in 0..nums.len() {\n        out.push(nums[nums[i] as usize]);\n    }\n    out\n}`,
              php: `function buildArray($nums) {\n    $out = array();\n    for ($i = 0; $i < count($nums); $i++) $out[] = $nums[$nums[$i]];\n    return $out;\n}`,
              ruby: `def buildArray(nums)\n  nums.map { |x| nums[x] }\nend`,
      },
    };
  })(),

  // ── Concatenation of Array ──────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => nums.concat(nums);
    return {
      slug: "concatenation-of-array",
      title: "Concatenation of Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Simulation", "Amazon", "TCS"],
      signature: { funcName: "getConcatenation", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums` of length `n`, return an array `ans` of length `2n` where `ans[i] == nums[i]` and `ans[i + n] == nums[i]` for every `0 <= i < n`.\n\nIn other words, `ans` is `nums` concatenated with itself.",
        [
          { in: "nums = [1,2,1]", out: "[1,2,1,1,2,1]" },
          { in: "nums = [1,3,2,1]", out: "[1,3,2,1,1,3,2,1]" },
          { in: "nums = [7]", out: "[7,7]" },
        ],
        ["1 <= nums.length <= 40", "1 <= nums[i] <= 1000"]),
      hints: [
        "Append the array to itself — either with a library concatenation or by looping over it twice.",
      ],
      examples: [
        { input: "[1,2,1]", expectedOutput: "[1,2,1,1,2,1]" },
        { input: "[1,3,2,1]", expectedOutput: "[1,3,2,1,1,3,2,1]" },
        { input: "[7]", expectedOutput: "[7,7]" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 1, 1000);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def getConcatenation(nums):\n    return list(nums) + list(nums)`,
        javascript: `var getConcatenation = function(nums) {\n    return nums.concat(nums);\n};`,
              typescript: `function getConcatenation(nums: number[]): number[] {\n    return nums.concat(nums);\n}`,
              java: `public static int[] getConcatenation(int[] nums) {\n    int n = nums.length;\n    int[] out = new int[2 * n];\n    for (int i = 0; i < n; i++) {\n        out[i] = nums[i];\n        out[i + n] = nums[i];\n    }\n    return out;\n}`,
              cpp: `vector<int> getConcatenation(vector<int>& nums) {\n    vector<int> out(nums);\n    for (int x : nums) out.push_back(x);\n    return out;\n}`,
              c: `int* getConcatenation(int* nums, int numsSize, int* returnSize) {\n    int* out = (int*) malloc(sizeof(int) * (2 * numsSize > 0 ? 2 * numsSize : 1));\n    for (int i = 0; i < numsSize; i++) {\n        out[i] = nums[i];\n        out[i + numsSize] = nums[i];\n    }\n    *returnSize = 2 * numsSize;\n    return out;\n}`,
              csharp: `public static int[] GetConcatenation(int[] nums)\n{\n    int n = nums.Length;\n    int[] out_ = new int[2 * n];\n    for (int i = 0; i < n; i++)\n    {\n        out_[i] = nums[i];\n        out_[i + n] = nums[i];\n    }\n    return out_;\n}`,
              go: `func getConcatenation(nums []int) []int {\n	out := make([]int, 0, 2*len(nums))\n	out = append(out, nums...)\n	out = append(out, nums...)\n	return out\n}`,
              kotlin: `fun getConcatenation(nums: IntArray): IntArray {\n    return nums + nums\n}`,
              swift: `func getConcatenation(_ nums: [Int]) -> [Int] {\n    return nums + nums\n}`,
              rust: `fn getConcatenation(nums: Vec<i32>) -> Vec<i32> {\n    let mut out = nums.clone();\n    out.extend(nums.iter());\n    out\n}`,
              php: `function getConcatenation($nums) {\n    return array_merge($nums, $nums);\n}`,
              ruby: `def getConcatenation(nums)\n  nums + nums\nend`,
      },
    };
  })(),

  // ── Decompress Run-Length Encoded List ──────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const out: number[] = [];
      for (let i = 0; i < nums.length; i += 2) {
        for (let k = 0; k < nums[i]; k++) out.push(nums[i + 1]);
      }
      return out;
    };
    return {
      slug: "decompress-run-length-encoded-list",
      title: "Decompress Run-Length Encoded List",
      difficulty: "EASY" as const,
      tags: ["Array", "Simulation", "Amazon", "Infosys"],
      signature: { funcName: "decompressRLElist", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given a run-length encoded list `nums` of even length. Consider each adjacent pair `[freq, val] = [nums[2i], nums[2i + 1]]`; each pair describes `freq` copies of `val`.\n\nConcatenate all the decoded runs, in order, and return the resulting list.",
        [
          { in: "nums = [1,2,3,4]", out: "[2,4,4,4]", note: "[1,2] gives one 2 and [3,4] gives three 4s." },
          { in: "nums = [1,1,2,3]", out: "[1,3,3]" },
          { in: "nums = [2,9]", out: "[9,9]" },
        ],
        ["2 <= nums.length <= 40", "nums.length is even.", "1 <= nums[i] <= 40"]),
      hints: [
        "Step through the array two entries at a time.",
        "The first entry of the pair is the repeat count, the second is the value to repeat.",
      ],
      examples: [
        { input: "[1,2,3,4]", expectedOutput: "[2,4,4,4]" },
        { input: "[1,1,2,3]", expectedOutput: "[1,3,3]" },
        { input: "[2,9]", expectedOutput: "[9,9]" },
      ],
      gen: (rng: Rng) => {
        const pairs = ri(rng, 1, 8);
        const nums: number[] = [];
        for (let i = 0; i < pairs; i++) { nums.push(ri(rng, 1, 6)); nums.push(ri(rng, 1, 40)); }
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def decompressRLElist(nums):\n    out = []\n    for i in range(0, len(nums), 2):\n        out.extend([nums[i + 1]] * nums[i])\n    return out`,
        javascript: `var decompressRLElist = function(nums) {\n    const out = [];\n    for (let i = 0; i < nums.length; i += 2) {\n        for (let k = 0; k < nums[i]; k++) out.push(nums[i + 1]);\n    }\n    return out;\n};`,
              typescript: `function decompressRLElist(nums: number[]): number[] {\n    var out: number[] = [];\n    for (var i = 0; i < nums.length; i += 2) {\n        for (var k = 0; k < nums[i]; k++) out.push(nums[i + 1]);\n    }\n    return out;\n}`,
              java: `public static int[] decompressRLElist(int[] nums) {\n    int total = 0;\n    for (int i = 0; i < nums.length; i += 2) total += nums[i];\n    int[] out = new int[total];\n    int pos = 0;\n    for (int i = 0; i < nums.length; i += 2) {\n        for (int k = 0; k < nums[i]; k++) out[pos++] = nums[i + 1];\n    }\n    return out;\n}`,
              cpp: `vector<int> decompressRLElist(vector<int>& nums) {\n    vector<int> out;\n    for (size_t i = 0; i < nums.size(); i += 2) {\n        for (int k = 0; k < nums[i]; k++) out.push_back(nums[i + 1]);\n    }\n    return out;\n}`,
              c: `int* decompressRLElist(int* nums, int numsSize, int* returnSize) {\n    int total = 0;\n    for (int i = 0; i < numsSize; i += 2) total += nums[i];\n    int* out = (int*) malloc(sizeof(int) * (total > 0 ? total : 1));\n    int pos = 0;\n    for (int i = 0; i < numsSize; i += 2) {\n        for (int k = 0; k < nums[i]; k++) out[pos++] = nums[i + 1];\n    }\n    *returnSize = total;\n    return out;\n}`,
              csharp: `public static int[] DecompressRLElist(int[] nums)\n{\n    var out_ = new List<int>();\n    for (int i = 0; i < nums.Length; i += 2)\n    {\n        for (int k = 0; k < nums[i]; k++) out_.Add(nums[i + 1]);\n    }\n    return out_.ToArray();\n}`,
              go: `func decompressRLElist(nums []int) []int {\n	out := []int{}\n	for i := 0; i < len(nums); i += 2 {\n		for k := 0; k < nums[i]; k++ {\n			out = append(out, nums[i+1])\n		}\n	}\n	return out\n}`,
              kotlin: `fun decompressRLElist(nums: IntArray): IntArray {\n    val out = ArrayList<Int>()\n    var i = 0\n    while (i < nums.size) {\n        for (k in 0 until nums[i]) out.add(nums[i + 1])\n        i += 2\n    }\n    return out.toIntArray()\n}`,
              swift: `func decompressRLElist(_ nums: [Int]) -> [Int] {\n    var out: [Int] = []\n    var i = 0\n    while i < nums.count {\n        for _ in 0..<nums[i] { out.append(nums[i + 1]) }\n        i += 2\n    }\n    return out\n}`,
              rust: `fn decompressRLElist(nums: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    let mut i = 0;\n    while i < nums.len() {\n        for _ in 0..nums[i] {\n            out.push(nums[i + 1]);\n        }\n        i += 2;\n    }\n    out\n}`,
              php: `function decompressRLElist($nums) {\n    $out = array();\n    for ($i = 0; $i < count($nums); $i += 2) {\n        for ($k = 0; $k < $nums[$i]; $k++) $out[] = $nums[$i + 1];\n    }\n    return $out;\n}`,
              ruby: `def decompressRLElist(nums)\n  out = []\n  i = 0\n  while i < nums.length\n    nums[i].times { out << nums[i + 1] }\n    i += 2\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Create Target Array in the Given Order ──────────────────────
  (() => {
    const ref = (nums: number[], index: number[]) => {
      const out: number[] = [];
      for (let i = 0; i < nums.length; i++) out.splice(index[i], 0, nums[i]);
      return out;
    };
    return {
      slug: "create-target-array-in-the-given-order",
      title: "Create Target Array in the Given Order",
      difficulty: "EASY" as const,
      tags: ["Array", "Simulation", "Amazon", "Adobe"],
      signature: { funcName: "createTargetArray", params: [{ name: "nums", type: "int[]" as const }, { name: "index", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given two arrays of equal length, `nums` and `index`. Build a target array by repeating, for `i` from `0` upward, the step: **insert** `nums[i]` at position `index[i]` in the target array.\n\nInserting shifts everything from that position onward one place to the right. Return the finished target array.",
        [
          { in: "nums = [0,1,2,3,4], index = [0,1,2,2,1]", out: "[0,4,1,3,2]" },
          { in: "nums = [1,2,3,4,0], index = [0,1,2,3,0]", out: "[0,1,2,3,4]" },
          { in: "nums = [1], index = [0]", out: "[1]" },
        ],
        ["1 <= nums.length <= 40", "nums.length == index.length", "0 <= index[i] <= i", "0 <= nums[i] <= 100"]),
      hints: [
        "The constraint `index[i] <= i` guarantees the position always exists when you get there.",
        "Simulate literally — an insert into a dynamic list is exactly the operation described.",
      ],
      examples: [
        { input: "[0,1,2,3,4]\n[0,1,2,2,1]", expectedOutput: "[0,4,1,3,2]" },
        { input: "[1,2,3,4,0]\n[0,1,2,3,0]", expectedOutput: "[0,1,2,3,4]" },
        { input: "[1]\n[0]", expectedOutput: "[1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const nums = randArr(rng, n, 0, 100);
        const index = Array.from({ length: n }, (_, i) => ri(rng, 0, i));
        return { input: `${fmtIntArr(nums)}\n${fmtIntArr(index)}`, expectedOutput: fmtIntArr(ref(nums, index)) };
      },
      solutions: {
        python: `def createTargetArray(nums, index):\n    out = []\n    for value, pos in zip(nums, index):\n        out.insert(pos, value)\n    return out`,
        javascript: `var createTargetArray = function(nums, index) {\n    const out = [];\n    for (let i = 0; i < nums.length; i++) {\n        out.splice(index[i], 0, nums[i]);\n    }\n    return out;\n};`,
              typescript: `function createTargetArray(nums: number[], index: number[]): number[] {\n    var out: number[] = [];\n    for (var i = 0; i < nums.length; i++) out.splice(index[i], 0, nums[i]);\n    return out;\n}`,
              java: `public static int[] createTargetArray(int[] nums, int[] index) {\n    List<Integer> out = new ArrayList<>();\n    for (int i = 0; i < nums.length; i++) out.add(index[i], nums[i]);\n    int[] res = new int[out.size()];\n    for (int i = 0; i < res.length; i++) res[i] = out.get(i);\n    return res;\n}`,
              cpp: `vector<int> createTargetArray(vector<int>& nums, vector<int>& index) {\n    vector<int> out;\n    for (size_t i = 0; i < nums.size(); i++) {\n        out.insert(out.begin() + index[i], nums[i]);\n    }\n    return out;\n}`,
              c: `int* createTargetArray(int* nums, int numsSize, int* index, int indexSize, int* returnSize) {\n    int* out = (int*) malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));\n    int len = 0;\n    for (int i = 0; i < numsSize; i++) {\n        for (int j = len; j > index[i]; j--) out[j] = out[j - 1];\n        out[index[i]] = nums[i];\n        len++;\n    }\n    *returnSize = len;\n    return out;\n}`,
              csharp: `public static int[] CreateTargetArray(int[] nums, int[] index)\n{\n    var out_ = new List<int>();\n    for (int i = 0; i < nums.Length; i++) out_.Insert(index[i], nums[i]);\n    return out_.ToArray();\n}`,
              go: `func createTargetArray(nums []int, index []int) []int {\n	out := []int{}\n	for i, x := range nums {\n		out = append(out, 0)\n		copy(out[index[i]+1:], out[index[i]:])\n		out[index[i]] = x\n	}\n	return out\n}`,
              kotlin: `fun createTargetArray(nums: IntArray, index: IntArray): IntArray {\n    val out = ArrayList<Int>()\n    for (i in nums.indices) out.add(index[i], nums[i])\n    return out.toIntArray()\n}`,
              swift: `func createTargetArray(_ nums: [Int], _ index: [Int]) -> [Int] {\n    var out: [Int] = []\n    for i in 0..<nums.count {\n        out.insert(nums[i], at: index[i])\n    }\n    return out\n}`,
              rust: `fn createTargetArray(nums: Vec<i32>, index: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    for i in 0..nums.len() {\n        out.insert(index[i] as usize, nums[i]);\n    }\n    out\n}`,
              php: `function createTargetArray($nums, $index) {\n    $out = array();\n    for ($i = 0; $i < count($nums); $i++) {\n        array_splice($out, $index[$i], 0, array($nums[$i]));\n    }\n    return $out;\n}`,
              ruby: `def createTargetArray(nums, index)\n  out = []\n  nums.each_with_index do |x, i|\n    out.insert(index[i], x)\n  end\n  out\nend`,
      },
    };
  })(),

  // ── Find the Highest Altitude ───────────────────────────────────
  (() => {
    const ref = (gain: number[]) => {
      let cur = 0, best = 0;
      for (let i = 0; i < gain.length; i++) { cur += gain[i]; if (cur > best) best = cur; }
      return best;
    };
    return {
      slug: "find-the-highest-altitude",
      title: "Find the Highest Altitude",
      difficulty: "EASY" as const,
      tags: ["Array", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "largestAltitude", params: [{ name: "gain", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A biker rides through `n + 1` points, starting at altitude `0`. You are given an array `gain` of length `n`, where `gain[i]` is the **net altitude change** between point `i` and point `i + 1`.\n\nReturn the highest altitude reached at any point.",
        [
          { in: "gain = [-5,1,5,0,-7]", out: "1", note: "The altitudes are [0,-5,-4,1,1,-6]; the highest is 1." },
          { in: "gain = [-4,-3,-2,-1,4,3,2]", out: "0", note: "The altitudes never rise above the starting point." },
          { in: "gain = [3,3]", out: "6" },
        ],
        ["1 <= gain.length <= 40", "-100 <= gain[i] <= 100"]),
      hints: [
        "Altitudes are the prefix sums of `gain`, starting from 0.",
        "Track the running sum and the best value seen — but seed the best with 0, since the start counts as a point.",
      ],
      examples: [
        { input: "[-5,1,5,0,-7]", expectedOutput: "1" },
        { input: "[-4,-3,-2,-1,4,3,2]", expectedOutput: "0" },
        { input: "[3,3]", expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const gain = randArr(rng, ri(rng, 1, 40), -100, 100);
        return { input: fmtIntArr(gain), expectedOutput: String(ref(gain)) };
      },
      solutions: {
        python: `def largestAltitude(gain):\n    cur = best = 0\n    for g in gain:\n        cur += g\n        if cur > best:\n            best = cur\n    return best`,
        javascript: `var largestAltitude = function(gain) {\n    let cur = 0, best = 0;\n    for (let i = 0; i < gain.length; i++) {\n        cur += gain[i];\n        if (cur > best) best = cur;\n    }\n    return best;\n};`,
              typescript: `function largestAltitude(gain: number[]): number {\n    var cur = 0;\n    var best = 0;\n    for (var i = 0; i < gain.length; i++) {\n        cur += gain[i];\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,
              java: `public static int largestAltitude(int[] gain) {\n    int cur = 0, best = 0;\n    for (int g : gain) {\n        cur += g;\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,
              cpp: `int largestAltitude(vector<int>& gain) {\n    int cur = 0, best = 0;\n    for (int g : gain) {\n        cur += g;\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,
              c: `int largestAltitude(int* gain, int gainSize) {\n    int cur = 0, best = 0;\n    for (int i = 0; i < gainSize; i++) {\n        cur += gain[i];\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,
              csharp: `public static int LargestAltitude(int[] gain)\n{\n    int cur = 0, best = 0;\n    foreach (int g in gain)\n    {\n        cur += g;\n        if (cur > best) best = cur;\n    }\n    return best;\n}`,
              go: `func largestAltitude(gain []int) int {\n	cur, best := 0, 0\n	for _, g := range gain {\n		cur += g\n		if cur > best {\n			best = cur\n		}\n	}\n	return best\n}`,
              kotlin: `fun largestAltitude(gain: IntArray): Int {\n    var cur = 0\n    var best = 0\n    for (g in gain) {\n        cur += g\n        if (cur > best) best = cur\n    }\n    return best\n}`,
              swift: `func largestAltitude(_ gain: [Int]) -> Int {\n    var cur = 0\n    var best = 0\n    for g in gain {\n        cur += g\n        if cur > best { best = cur }\n    }\n    return best\n}`,
              rust: `fn largestAltitude(gain: Vec<i32>) -> i32 {\n    let mut cur = 0;\n    let mut best = 0;\n    for g in gain.iter() {\n        cur += *g;\n        if cur > best {\n            best = cur;\n        }\n    }\n    best\n}`,
              php: `function largestAltitude($gain) {\n    $cur = 0;\n    $best = 0;\n    foreach ($gain as $g) {\n        $cur += $g;\n        if ($cur > $best) $best = $cur;\n    }\n    return $best;\n}`,
              ruby: `def largestAltitude(gain)\n  cur = 0\n  best = 0\n  gain.each do |g|\n    cur += g\n    best = cur if cur > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Sum of All Odd Length Subarrays ─────────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const n = arr.length;
      let total = 0;
      for (let i = 0; i < n; i++) {
        const occurrences = Math.floor(((i + 1) * (n - i) + 1) / 2);
        total += occurrences * arr[i];
      }
      return total;
    };
    return {
      slug: "sum-of-all-odd-length-subarrays",
      title: "Sum of All Odd Length Subarrays",
      difficulty: "EASY" as const,
      tags: ["Array", "Math", "Prefix Sum", "Amazon", "Google"],
      signature: { funcName: "sumOddLengthSubarrays", params: [{ name: "arr", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of positive integers `arr`, return the sum of all possible **odd-length** contiguous subarrays of `arr`.\n\nA subarray is a contiguous slice of the array.",
        [
          { in: "arr = [1,4,2,5,3]", out: "58", note: "The odd-length subarrays are [1],[4],[2],[5],[3],[1,4,2],[4,2,5],[2,5,3],[1,4,2,5,3], summing to 58." },
          { in: "arr = [1,2]", out: "3", note: "Only [1] and [2] have odd length." },
          { in: "arr = [10,11,12]", out: "66" },
        ],
        ["1 <= arr.length <= 30", "1 <= arr[i] <= 1000"],
        "The O(n³) enumeration is easy. Can you do it in O(n)?"),
      hints: [
        "Instead of enumerating subarrays, ask how many odd-length subarrays contain each **element**.",
        "Element `i` has `i + 1` choices of left endpoint and `n - i` choices of right endpoint, so it sits in `(i + 1) × (n - i)` subarrays in total.",
        "Exactly half of those have odd length, rounded up: `((i + 1) × (n - i) + 1) / 2`.",
      ],
      examples: [
        { input: "[1,4,2,5,3]", expectedOutput: "58" },
        { input: "[1,2]", expectedOutput: "3" },
        { input: "[10,11,12]", expectedOutput: "66" },
      ],
      gen: (rng: Rng) => {
        const arr = randArr(rng, ri(rng, 1, 30), 1, 1000);
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `def sumOddLengthSubarrays(arr):\n    n = len(arr)\n    total = 0\n    for i, x in enumerate(arr):\n        occurrences = ((i + 1) * (n - i) + 1) // 2\n        total += occurrences * x\n    return total`,
        javascript: `var sumOddLengthSubarrays = function(arr) {\n    const n = arr.length;\n    let total = 0;\n    for (let i = 0; i < n; i++) {\n        const occurrences = Math.floor(((i + 1) * (n - i) + 1) / 2);\n        total += occurrences * arr[i];\n    }\n    return total;\n};`,
              typescript: `function sumOddLengthSubarrays(arr: number[]): number {\n    var n = arr.length;\n    var total = 0;\n    for (var i = 0; i < n; i++) {\n        var occurrences = Math.floor(((i + 1) * (n - i) + 1) / 2);\n        total += occurrences * arr[i];\n    }\n    return total;\n}`,
              java: `public static int sumOddLengthSubarrays(int[] arr) {\n    int n = arr.length;\n    int total = 0;\n    for (int i = 0; i < n; i++) {\n        int occurrences = ((i + 1) * (n - i) + 1) / 2;\n        total += occurrences * arr[i];\n    }\n    return total;\n}`,
              cpp: `int sumOddLengthSubarrays(vector<int>& arr) {\n    int n = (int) arr.size();\n    int total = 0;\n    for (int i = 0; i < n; i++) {\n        int occurrences = ((i + 1) * (n - i) + 1) / 2;\n        total += occurrences * arr[i];\n    }\n    return total;\n}`,
              c: `int sumOddLengthSubarrays(int* arr, int arrSize) {\n    int total = 0;\n    for (int i = 0; i < arrSize; i++) {\n        int occurrences = ((i + 1) * (arrSize - i) + 1) / 2;\n        total += occurrences * arr[i];\n    }\n    return total;\n}`,
              csharp: `public static int SumOddLengthSubarrays(int[] arr)\n{\n    int n = arr.Length;\n    int total = 0;\n    for (int i = 0; i < n; i++)\n    {\n        int occurrences = ((i + 1) * (n - i) + 1) / 2;\n        total += occurrences * arr[i];\n    }\n    return total;\n}`,
              go: `func sumOddLengthSubarrays(arr []int) int {\n	n := len(arr)\n	total := 0\n	for i := 0; i < n; i++ {\n		occurrences := ((i+1)*(n-i) + 1) / 2\n		total += occurrences * arr[i]\n	}\n	return total\n}`,
              kotlin: `fun sumOddLengthSubarrays(arr: IntArray): Int {\n    val n = arr.size\n    var total = 0\n    for (i in 0 until n) {\n        val occurrences = ((i + 1) * (n - i) + 1) / 2\n        total += occurrences * arr[i]\n    }\n    return total\n}`,
              swift: `func sumOddLengthSubarrays(_ arr: [Int]) -> Int {\n    let n = arr.count\n    var total = 0\n    for i in 0..<n {\n        let occurrences = ((i + 1) * (n - i) + 1) / 2\n        total += occurrences * arr[i]\n    }\n    return total\n}`,
              rust: `fn sumOddLengthSubarrays(arr: Vec<i32>) -> i32 {\n    let n = arr.len() as i32;\n    let mut total = 0;\n    for i in 0..arr.len() {\n        let idx = i as i32;\n        let occurrences = ((idx + 1) * (n - idx) + 1) / 2;\n        total += occurrences * arr[i];\n    }\n    total\n}`,
              php: `function sumOddLengthSubarrays($arr) {\n    $n = count($arr);\n    $total = 0;\n    for ($i = 0; $i < $n; $i++) {\n        $occurrences = intdiv(($i + 1) * ($n - $i) + 1, 2);\n        $total += $occurrences * $arr[$i];\n    }\n    return $total;\n}`,
              ruby: `def sumOddLengthSubarrays(arr)\n  n = arr.length\n  total = 0\n  arr.each_with_index do |x, i|\n    occurrences = ((i + 1) * (n - i) + 1) / 2\n    total += occurrences * x\n  end\n  total\nend`,
      },
    };
  })(),

  // ── Max Consecutive Ones ────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let best = 0, run = 0;
      for (let i = 0; i < nums.length; i++) {
        run = nums[i] === 1 ? run + 1 : 0;
        if (run > best) best = run;
      }
      return best;
    };
    return {
      slug: "max-consecutive-ones",
      title: "Max Consecutive Ones",
      difficulty: "EASY" as const,
      tags: ["Array", "Amazon", "Google", "Microsoft", "TCS"],
      signature: { funcName: "findMaxConsecutiveOnes", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given a binary array `nums`, return the maximum number of consecutive `1`s in the array.",
        [
          { in: "nums = [1,1,0,1,1,1]", out: "3", note: "The last three elements form the longest run." },
          { in: "nums = [1,0,1,1,0,1]", out: "2" },
          { in: "nums = [0,0]", out: "0" },
        ],
        ["1 <= nums.length <= 40", "nums[i] is either 0 or 1."]),
      hints: [
        "Keep a running length that grows on a 1 and resets to 0 on a 0.",
        "Update the best after every step, not only when a run ends — otherwise a run that reaches the end of the array is missed.",
      ],
      examples: [
        { input: "[1,1,0,1,1,1]", expectedOutput: "3" },
        { input: "[1,0,1,1,0,1]", expectedOutput: "2" },
        { input: "[0,0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nums = Array.from({ length: n }, () => (rng() < 0.6 ? 1 : 0));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def findMaxConsecutiveOnes(nums):\n    best = run = 0\n    for x in nums:\n        run = run + 1 if x == 1 else 0\n        if run > best:\n            best = run\n    return best`,
        javascript: `var findMaxConsecutiveOnes = function(nums) {\n    let best = 0, run = 0;\n    for (let i = 0; i < nums.length; i++) {\n        run = nums[i] === 1 ? run + 1 : 0;\n        if (run > best) best = run;\n    }\n    return best;\n};`,
              typescript: `function findMaxConsecutiveOnes(nums: number[]): number {\n    var best = 0;\n    var run = 0;\n    for (var i = 0; i < nums.length; i++) {\n        run = nums[i] === 1 ? run + 1 : 0;\n        if (run > best) best = run;\n    }\n    return best;\n}`,
              java: `public static int findMaxConsecutiveOnes(int[] nums) {\n    int best = 0, run = 0;\n    for (int x : nums) {\n        run = x == 1 ? run + 1 : 0;\n        if (run > best) best = run;\n    }\n    return best;\n}`,
              cpp: `int findMaxConsecutiveOnes(vector<int>& nums) {\n    int best = 0, run = 0;\n    for (int x : nums) {\n        run = x == 1 ? run + 1 : 0;\n        if (run > best) best = run;\n    }\n    return best;\n}`,
              c: `int findMaxConsecutiveOnes(int* nums, int numsSize) {\n    int best = 0, run = 0;\n    for (int i = 0; i < numsSize; i++) {\n        run = nums[i] == 1 ? run + 1 : 0;\n        if (run > best) best = run;\n    }\n    return best;\n}`,
              csharp: `public static int FindMaxConsecutiveOnes(int[] nums)\n{\n    int best = 0, run = 0;\n    foreach (int x in nums)\n    {\n        run = x == 1 ? run + 1 : 0;\n        if (run > best) best = run;\n    }\n    return best;\n}`,
              go: `func findMaxConsecutiveOnes(nums []int) int {\n	best, run := 0, 0\n	for _, x := range nums {\n		if x == 1 {\n			run++\n		} else {\n			run = 0\n		}\n		if run > best {\n			best = run\n		}\n	}\n	return best\n}`,
              kotlin: `fun findMaxConsecutiveOnes(nums: IntArray): Int {\n    var best = 0\n    var run = 0\n    for (x in nums) {\n        run = if (x == 1) run + 1 else 0\n        if (run > best) best = run\n    }\n    return best\n}`,
              swift: `func findMaxConsecutiveOnes(_ nums: [Int]) -> Int {\n    var best = 0\n    var run = 0\n    for x in nums {\n        run = x == 1 ? run + 1 : 0\n        if run > best { best = run }\n    }\n    return best\n}`,
              rust: `fn findMaxConsecutiveOnes(nums: Vec<i32>) -> i32 {\n    let mut best = 0;\n    let mut run = 0;\n    for x in nums.iter() {\n        run = if *x == 1 { run + 1 } else { 0 };\n        if run > best {\n            best = run;\n        }\n    }\n    best\n}`,
              php: `function findMaxConsecutiveOnes($nums) {\n    $best = 0;\n    $run = 0;\n    foreach ($nums as $x) {\n        $run = $x === 1 ? $run + 1 : 0;\n        if ($run > $best) $best = $run;\n    }\n    return $best;\n}`,
              ruby: `def findMaxConsecutiveOnes(nums)\n  best = 0\n  run = 0\n  nums.each do |x|\n    run = x == 1 ? run + 1 : 0\n    best = run if run > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Third Maximum Number ────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const distinct = Array.from(new Set(nums)).sort((a, b) => b - a);
      return distinct.length >= 3 ? distinct[2] : distinct[0];
    };
    return {
      slug: "third-maximum-number",
      title: "Third Maximum Number",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Amazon", "Google", "Bloomberg"],
      signature: { funcName: "thirdMax", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, return the **third distinct maximum** value. If it does not exist, return the maximum value instead.",
        [
          { in: "nums = [3,2,1]", out: "1", note: "The distinct maxima are 3, 2, 1 — the third is 1." },
          { in: "nums = [1,2]", out: "2", note: "There is no third distinct value, so the maximum is returned." },
          { in: "nums = [2,2,3,1]", out: "1", note: "Duplicates collapse: the distinct order is 3, 2, 1." },
        ],
        ["1 <= nums.length <= 40", "-1000 <= nums[i] <= 1000"],
        "Can you find it in O(n) time?"),
      hints: [
        "Distinctness is the trap — [2,2,3,1] must treat the two 2s as one value.",
        "Deduplicate first, then sort descending and read the third entry.",
        "For O(n), carry three running maxima and skip any value equal to one you already hold.",
      ],
      examples: [
        { input: "[3,2,1]", expectedOutput: "1" },
        { input: "[1,2]", expectedOutput: "2" },
        { input: "[2,2,3,1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nums = rng() < 0.5 ? randArr(rng, n, -5, 5) : randArr(rng, n, -1000, 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def thirdMax(nums):\n    distinct = sorted(set(nums), reverse=True)\n    return distinct[2] if len(distinct) >= 3 else distinct[0]`,
        javascript: `var thirdMax = function(nums) {\n    const distinct = Array.from(new Set(nums)).sort(function(a, b) { return b - a; });\n    return distinct.length >= 3 ? distinct[2] : distinct[0];\n};`,
              typescript: `function thirdMax(nums: number[]): number {\n    var seen: { [key: string]: boolean } = {};\n    var distinct: number[] = [];\n    for (var i = 0; i < nums.length; i++) {\n        var key = String(nums[i]);\n        if (seen[key] !== true) {\n            seen[key] = true;\n            distinct.push(nums[i]);\n        }\n    }\n    distinct.sort(function (a, b) { return b - a; });\n    return distinct.length >= 3 ? distinct[2] : distinct[0];\n}`,
              java: `public static int thirdMax(int[] nums) {\n    TreeSet<Integer> distinct = new TreeSet<>();\n    for (int x : nums) distinct.add(x);\n    if (distinct.size() < 3) return distinct.last();\n    Iterator<Integer> it = distinct.descendingIterator();\n    it.next();\n    it.next();\n    return it.next();\n}`,
              cpp: `int thirdMax(vector<int>& nums) {\n    set<int> distinct(nums.begin(), nums.end());\n    vector<int> ordered(distinct.rbegin(), distinct.rend());\n    return ordered.size() >= 3 ? ordered[2] : ordered[0];\n}`,
              c: `int thirdMax(int* nums, int numsSize) {\n    int* a = (int*) malloc(sizeof(int) * numsSize);\n    for (int i = 0; i < numsSize; i++) a[i] = nums[i];\n    for (int i = 1; i < numsSize; i++) {\n        int key = a[i];\n        int j = i - 1;\n        while (j >= 0 && a[j] < key) { a[j + 1] = a[j]; j--; }\n        a[j + 1] = key;\n    }\n    int len = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (i == 0 || a[i] != a[i - 1]) a[len++] = a[i];\n    }\n    int result = len >= 3 ? a[2] : a[0];\n    free(a);\n    return result;\n}`,
              csharp: `public static int ThirdMax(int[] nums)\n{\n    var distinct = new List<int>(new HashSet<int>(nums));\n    distinct.Sort();\n    distinct.Reverse();\n    return distinct.Count >= 3 ? distinct[2] : distinct[0];\n}`,
              go: `func thirdMax(nums []int) int {\n	seen := make(map[int]bool)\n	distinct := []int{}\n	for _, x := range nums {\n		if !seen[x] {\n			seen[x] = true\n			distinct = append(distinct, x)\n		}\n	}\n	sort.Sort(sort.Reverse(sort.IntSlice(distinct)))\n	if len(distinct) >= 3 {\n		return distinct[2]\n	}\n	return distinct[0]\n}`,
              kotlin: `fun thirdMax(nums: IntArray): Int {\n    val distinct = nums.toHashSet().toMutableList()\n    distinct.sortDescending()\n    return if (distinct.size >= 3) distinct[2] else distinct[0]\n}`,
              swift: `func thirdMax(_ nums: [Int]) -> Int {\n    let distinct = Array(Set(nums)).sorted(by: >)\n    return distinct.count >= 3 ? distinct[2] : distinct[0]\n}`,
              rust: `fn thirdMax(nums: Vec<i32>) -> i32 {\n    use std::collections::HashSet;\n    let set: HashSet<i32> = nums.into_iter().collect();\n    let mut distinct: Vec<i32> = set.into_iter().collect();\n    distinct.sort();\n    distinct.reverse();\n    if distinct.len() >= 3 {\n        distinct[2]\n    } else {\n        distinct[0]\n    }\n}`,
              php: `function thirdMax($nums) {\n    $distinct = array_values(array_unique($nums));\n    rsort($distinct);\n    return count($distinct) >= 3 ? $distinct[2] : $distinct[0];\n}`,
              ruby: `def thirdMax(nums)\n  distinct = nums.uniq.sort.reverse\n  distinct.length >= 3 ? distinct[2] : distinct[0]\nend`,
      },
    };
  })(),

  // ── Can Place Flowers ───────────────────────────────────────────
  (() => {
    const ref = (bed: number[], n: number) => {
      const a = bed.slice();
      let planted = 0;
      for (let i = 0; i < a.length; i++) {
        if (a[i] === 0 && (i === 0 || a[i - 1] === 0) && (i === a.length - 1 || a[i + 1] === 0)) {
          a[i] = 1;
          planted++;
        }
      }
      return planted >= n;
    };
    return {
      slug: "can-place-flowers",
      title: "Can Place Flowers",
      difficulty: "EASY" as const,
      tags: ["Array", "Greedy", "Amazon", "LinkedIn", "Microsoft", "Adobe"],
      signature: { funcName: "canPlaceFlowers", params: [{ name: "flowerbed", type: "int[]" as const }, { name: "n", type: "int" as const }], returns: "bool" as const },
      description: describe(
        "You have a long flowerbed in which some plots are planted and some are not. Flowers cannot be planted in **adjacent** plots.\n\nGiven an integer array `flowerbed` containing `0`s (empty) and `1`s (planted), and an integer `n`, return `true` if `n` new flowers can be planted without violating the adjacency rule.",
        [
          { in: "flowerbed = [1,0,0,0,1], n = 1", out: "true", note: "The middle plot can take one flower." },
          { in: "flowerbed = [1,0,0,0,1], n = 2", out: "false" },
          { in: "flowerbed = [0,0,1,0,0], n = 2", out: "true" },
        ],
        ["1 <= flowerbed.length <= 40", "flowerbed[i] is 0 or 1.", "There are no two adjacent flowers in the input.", "0 <= n <= 20"]),
      hints: [
        "Scan left to right and plant greedily whenever a plot is empty and both neighbours are empty.",
        "Treat positions before the start and after the end as empty, so the two ends are not special cases in disguise.",
        "Planting as early as possible is optimal — an earlier flower never blocks more plots than a later one.",
      ],
      examples: [
        { input: "[1,0,0,0,1]\n1", expectedOutput: "true" },
        { input: "[1,0,0,0,1]\n2", expectedOutput: "false" },
        { input: "[0,0,1,0,0]\n2", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, 1, 40);
        const bed: number[] = [];
        for (let i = 0; i < len; i++) {
          const canPlant = i === 0 || bed[i - 1] === 0;
          bed.push(canPlant && rng() < 0.35 ? 1 : 0);
        }
        const n = ri(rng, 0, Math.max(1, Math.floor(len / 2)));
        return { input: `${fmtIntArr(bed)}\n${n}`, expectedOutput: bool(ref(bed, n)) };
      },
      solutions: {
        python: `def canPlaceFlowers(flowerbed, n) -> bool:\n    bed = list(flowerbed)\n    planted = 0\n    for i in range(len(bed)):\n        if bed[i] == 0 and (i == 0 or bed[i - 1] == 0) and (i == len(bed) - 1 or bed[i + 1] == 0):\n            bed[i] = 1\n            planted += 1\n    return planted >= n`,
        javascript: `var canPlaceFlowers = function(flowerbed, n) {\n    const bed = flowerbed.slice();\n    let planted = 0;\n    for (let i = 0; i < bed.length; i++) {\n        if (bed[i] === 0 && (i === 0 || bed[i - 1] === 0) && (i === bed.length - 1 || bed[i + 1] === 0)) {\n            bed[i] = 1;\n            planted++;\n        }\n    }\n    return planted >= n;\n};`,
              typescript: `function canPlaceFlowers(flowerbed: number[], n: number): boolean {\n    var bed = flowerbed.slice();\n    var planted = 0;\n    for (var i = 0; i < bed.length; i++) {\n        if (bed[i] === 0 && (i === 0 || bed[i - 1] === 0) && (i === bed.length - 1 || bed[i + 1] === 0)) {\n            bed[i] = 1;\n            planted++;\n        }\n    }\n    return planted >= n;\n}`,
              java: `public static boolean canPlaceFlowers(int[] flowerbed, int n) {\n    int[] bed = Arrays.copyOf(flowerbed, flowerbed.length);\n    int planted = 0;\n    for (int i = 0; i < bed.length; i++) {\n        if (bed[i] == 0 && (i == 0 || bed[i - 1] == 0) && (i == bed.length - 1 || bed[i + 1] == 0)) {\n            bed[i] = 1;\n            planted++;\n        }\n    }\n    return planted >= n;\n}`,
              cpp: `bool canPlaceFlowers(vector<int>& flowerbed, int n) {\n    vector<int> bed = flowerbed;\n    int planted = 0;\n    int len = (int) bed.size();\n    for (int i = 0; i < len; i++) {\n        if (bed[i] == 0 && (i == 0 || bed[i - 1] == 0) && (i == len - 1 || bed[i + 1] == 0)) {\n            bed[i] = 1;\n            planted++;\n        }\n    }\n    return planted >= n;\n}`,
              c: `bool canPlaceFlowers(int* flowerbed, int flowerbedSize, int n) {\n    int* bed = (int*) malloc(sizeof(int) * (flowerbedSize > 0 ? flowerbedSize : 1));\n    for (int i = 0; i < flowerbedSize; i++) bed[i] = flowerbed[i];\n    int planted = 0;\n    for (int i = 0; i < flowerbedSize; i++) {\n        if (bed[i] == 0 && (i == 0 || bed[i - 1] == 0) && (i == flowerbedSize - 1 || bed[i + 1] == 0)) {\n            bed[i] = 1;\n            planted++;\n        }\n    }\n    free(bed);\n    return planted >= n;\n}`,
              csharp: `public static bool CanPlaceFlowers(int[] flowerbed, int n)\n{\n    int[] bed = (int[]) flowerbed.Clone();\n    int planted = 0;\n    for (int i = 0; i < bed.Length; i++)\n    {\n        if (bed[i] == 0 && (i == 0 || bed[i - 1] == 0) && (i == bed.Length - 1 || bed[i + 1] == 0))\n        {\n            bed[i] = 1;\n            planted++;\n        }\n    }\n    return planted >= n;\n}`,
              go: `func canPlaceFlowers(flowerbed []int, n int) bool {\n	bed := make([]int, len(flowerbed))\n	copy(bed, flowerbed)\n	planted := 0\n	for i := 0; i < len(bed); i++ {\n		if bed[i] == 0 && (i == 0 || bed[i-1] == 0) && (i == len(bed)-1 || bed[i+1] == 0) {\n			bed[i] = 1\n			planted++\n		}\n	}\n	return planted >= n\n}`,
              kotlin: `fun canPlaceFlowers(flowerbed: IntArray, n: Int): Boolean {\n    val bed = flowerbed.copyOf()\n    var planted = 0\n    for (i in bed.indices) {\n        if (bed[i] == 0 && (i == 0 || bed[i - 1] == 0) && (i == bed.size - 1 || bed[i + 1] == 0)) {\n            bed[i] = 1\n            planted++\n        }\n    }\n    return planted >= n\n}`,
              swift: `func canPlaceFlowers(_ flowerbed: [Int], _ n: Int) -> Bool {\n    var bed = flowerbed\n    var planted = 0\n    for i in 0..<bed.count {\n        if bed[i] == 0 && (i == 0 || bed[i - 1] == 0) && (i == bed.count - 1 || bed[i + 1] == 0) {\n            bed[i] = 1\n            planted += 1\n        }\n    }\n    return planted >= n\n}`,
              rust: `fn canPlaceFlowers(flowerbed: Vec<i32>, n: i32) -> bool {\n    let mut bed = flowerbed;\n    let len = bed.len();\n    let mut planted = 0;\n    for i in 0..len {\n        if bed[i] == 0 && (i == 0 || bed[i - 1] == 0) && (i == len - 1 || bed[i + 1] == 0) {\n            bed[i] = 1;\n            planted += 1;\n        }\n    }\n    planted >= n\n}`,
              php: `function canPlaceFlowers($flowerbed, $n) {\n    $bed = $flowerbed;\n    $len = count($bed);\n    $planted = 0;\n    for ($i = 0; $i < $len; $i++) {\n        if ($bed[$i] === 0 && ($i === 0 || $bed[$i - 1] === 0) && ($i === $len - 1 || $bed[$i + 1] === 0)) {\n            $bed[$i] = 1;\n            $planted++;\n        }\n    }\n    return $planted >= $n;\n}`,
              ruby: `def canPlaceFlowers(flowerbed, n)\n  bed = flowerbed.dup\n  planted = 0\n  bed.each_index do |i|\n    if bed[i] == 0 && (i == 0 || bed[i - 1] == 0) && (i == bed.length - 1 || bed[i + 1] == 0)\n      bed[i] = 1\n      planted += 1\n    end\n  end\n  planted >= n\nend`,
      },
    };
  })(),

  // ── Degree of an Array ──────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const first: Record<number, number> = {};
      const last: Record<number, number> = {};
      const count: Record<number, number> = {};
      for (let i = 0; i < nums.length; i++) {
        if (first[nums[i]] === undefined) first[nums[i]] = i;
        last[nums[i]] = i;
        count[nums[i]] = (count[nums[i]] || 0) + 1;
      }
      let degree = 0;
      for (const k in count) if (count[k] > degree) degree = count[k];
      let best = nums.length;
      for (const k in count) {
        if (count[k] === degree) {
          const span = last[k] - first[k] + 1;
          if (span < best) best = span;
        }
      }
      return best;
    };
    return {
      slug: "degree-of-an-array",
      title: "Degree of an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Amazon", "Bloomberg"],
      signature: { funcName: "findShortestSubArray", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "The **degree** of a non-empty array is the maximum frequency of any one of its elements.\n\nGiven a non-negative integer array `nums`, return the smallest possible length of a contiguous subarray of `nums` that has the same degree as `nums`.",
        [
          { in: "nums = [1,2,2,3,1]", out: "2", note: "The degree is 2, reached by both 1 and 2. The 2s span [2,2], length 2, which is shorter than the 1s' span." },
          { in: "nums = [1,2,2,3,1,4,2]", out: "6", note: "2 alone has the maximum frequency, and its first and last occurrences are six apart inclusive." },
          { in: "nums = [1]", out: "1" },
        ],
        ["1 <= nums.length <= 40", "0 <= nums[i] <= 40"]),
      hints: [
        "Any subarray achieving the degree must contain **every** occurrence of some most-frequent value.",
        "So for each value record its first index, last index and count in one pass.",
        "Among the values whose count equals the degree, the answer is the smallest `last - first + 1`.",
      ],
      examples: [
        { input: "[1,2,2,3,1]", expectedOutput: "2" },
        { input: "[1,2,2,3,1,4,2]", expectedOutput: "6" },
        { input: "[1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 0, rng() < 0.5 ? 6 : 40);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def findShortestSubArray(nums):\n    first, last, count = {}, {}, {}\n    for i, x in enumerate(nums):\n        if x not in first:\n            first[x] = i\n        last[x] = i\n        count[x] = count.get(x, 0) + 1\n    degree = max(count.values())\n    return min(last[x] - first[x] + 1 for x in count if count[x] == degree)`,
        javascript: `var findShortestSubArray = function(nums) {\n    const first = new Map(), last = new Map(), count = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        if (!first.has(nums[i])) first.set(nums[i], i);\n        last.set(nums[i], i);\n        count.set(nums[i], (count.get(nums[i]) || 0) + 1);\n    }\n    let degree = 0;\n    count.forEach(function(c) { if (c > degree) degree = c; });\n    let best = nums.length;\n    count.forEach(function(c, value) {\n        if (c === degree) {\n            const span = last.get(value) - first.get(value) + 1;\n            if (span < best) best = span;\n        }\n    });\n    return best;\n};`,
              typescript: `function findShortestSubArray(nums: number[]): number {\n    var first: { [key: string]: number } = {};\n    var last: { [key: string]: number } = {};\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var key = String(nums[i]);\n        if (first[key] === undefined) first[key] = i;\n        last[key] = i;\n        count[key] = (count[key] === undefined ? 0 : count[key]) + 1;\n    }\n    var degree = 0;\n    for (var k in count) {\n        if (count[k] > degree) degree = count[k];\n    }\n    var best = nums.length;\n    for (var k2 in count) {\n        if (count[k2] === degree) {\n            var span = last[k2] - first[k2] + 1;\n            if (span < best) best = span;\n        }\n    }\n    return best;\n}`,
              java: `public static int findShortestSubArray(int[] nums) {\n    Map<Integer, Integer> first = new HashMap<>();\n    Map<Integer, Integer> last = new HashMap<>();\n    Map<Integer, Integer> count = new HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n        if (!first.containsKey(nums[i])) first.put(nums[i], i);\n        last.put(nums[i], i);\n        count.put(nums[i], count.getOrDefault(nums[i], 0) + 1);\n    }\n    int degree = 0;\n    for (int c : count.values()) degree = Math.max(degree, c);\n    int best = nums.length;\n    for (Map.Entry<Integer, Integer> e : count.entrySet()) {\n        if (e.getValue() == degree) {\n            best = Math.min(best, last.get(e.getKey()) - first.get(e.getKey()) + 1);\n        }\n    }\n    return best;\n}`,
              cpp: `int findShortestSubArray(vector<int>& nums) {\n    unordered_map<int, int> first, last, count;\n    for (int i = 0; i < (int) nums.size(); i++) {\n        if (!first.count(nums[i])) first[nums[i]] = i;\n        last[nums[i]] = i;\n        count[nums[i]]++;\n    }\n    int degree = 0;\n    for (auto& kv : count) degree = max(degree, kv.second);\n    int best = (int) nums.size();\n    for (auto& kv : count) {\n        if (kv.second == degree) best = min(best, last[kv.first] - first[kv.first] + 1);\n    }\n    return best;\n}`,
              c: `int findShortestSubArray(int* nums, int numsSize) {\n    int first[41], last[41], count[41];\n    for (int v = 0; v <= 40; v++) { first[v] = -1; last[v] = -1; count[v] = 0; }\n    for (int i = 0; i < numsSize; i++) {\n        int v = nums[i];\n        if (first[v] < 0) first[v] = i;\n        last[v] = i;\n        count[v]++;\n    }\n    int degree = 0;\n    for (int v = 0; v <= 40; v++) {\n        if (count[v] > degree) degree = count[v];\n    }\n    int best = numsSize;\n    for (int v = 0; v <= 40; v++) {\n        if (count[v] == degree) {\n            int span = last[v] - first[v] + 1;\n            if (span < best) best = span;\n        }\n    }\n    return best;\n}`,
              csharp: `public static int FindShortestSubArray(int[] nums)\n{\n    var first = new Dictionary<int, int>();\n    var last = new Dictionary<int, int>();\n    var count = new Dictionary<int, int>();\n    for (int i = 0; i < nums.Length; i++)\n    {\n        if (!first.ContainsKey(nums[i])) first[nums[i]] = i;\n        last[nums[i]] = i;\n        count[nums[i]] = count.ContainsKey(nums[i]) ? count[nums[i]] + 1 : 1;\n    }\n    int degree = 0;\n    foreach (int c in count.Values) degree = Math.Max(degree, c);\n    int best = nums.Length;\n    foreach (var kv in count)\n    {\n        if (kv.Value == degree) best = Math.Min(best, last[kv.Key] - first[kv.Key] + 1);\n    }\n    return best;\n}`,
              go: `func findShortestSubArray(nums []int) int {\n	first := make(map[int]int)\n	last := make(map[int]int)\n	count := make(map[int]int)\n	for i, x := range nums {\n		if _, ok := first[x]; !ok {\n			first[x] = i\n		}\n		last[x] = i\n		count[x]++\n	}\n	degree := 0\n	for _, c := range count {\n		if c > degree {\n			degree = c\n		}\n	}\n	best := len(nums)\n	for v, c := range count {\n		if c == degree {\n			span := last[v] - first[v] + 1\n			if span < best {\n				best = span\n			}\n		}\n	}\n	return best\n}`,
              kotlin: `fun findShortestSubArray(nums: IntArray): Int {\n    val first = HashMap<Int, Int>()\n    val last = HashMap<Int, Int>()\n    val count = HashMap<Int, Int>()\n    for (i in nums.indices) {\n        if (!first.containsKey(nums[i])) first[nums[i]] = i\n        last[nums[i]] = i\n        count[nums[i]] = (count[nums[i]] ?: 0) + 1\n    }\n    var degree = 0\n    for (c in count.values) if (c > degree) degree = c\n    var best = nums.size\n    for ((v, c) in count) {\n        if (c == degree) {\n            val span = last[v]!! - first[v]!! + 1\n            if (span < best) best = span\n        }\n    }\n    return best\n}`,
              swift: `func findShortestSubArray(_ nums: [Int]) -> Int {\n    var first: [Int: Int] = [:]\n    var last: [Int: Int] = [:]\n    var count: [Int: Int] = [:]\n    for i in 0..<nums.count {\n        if first[nums[i]] == nil { first[nums[i]] = i }\n        last[nums[i]] = i\n        count[nums[i], default: 0] += 1\n    }\n    var degree = 0\n    for (_, c) in count where c > degree { degree = c }\n    var best = nums.count\n    for (v, c) in count where c == degree {\n        let span = last[v]! - first[v]! + 1\n        if span < best { best = span }\n    }\n    return best\n}`,
              rust: `fn findShortestSubArray(nums: Vec<i32>) -> i32 {\n    use std::collections::HashMap;\n    let mut first: HashMap<i32, usize> = HashMap::new();\n    let mut last: HashMap<i32, usize> = HashMap::new();\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for i in 0..nums.len() {\n        first.entry(nums[i]).or_insert(i);\n        last.insert(nums[i], i);\n        *count.entry(nums[i]).or_insert(0) += 1;\n    }\n    let mut degree = 0;\n    for (_, c) in count.iter() {\n        if *c > degree {\n            degree = *c;\n        }\n    }\n    let mut best = nums.len();\n    for (v, c) in count.iter() {\n        if *c == degree {\n            let span = last[v] - first[v] + 1;\n            if span < best {\n                best = span;\n            }\n        }\n    }\n    best as i32\n}`,
              php: `function findShortestSubArray($nums) {\n    $first = array();\n    $last = array();\n    $count = array();\n    for ($i = 0; $i < count($nums); $i++) {\n        $v = $nums[$i];\n        if (!isset($first[$v])) $first[$v] = $i;\n        $last[$v] = $i;\n        $count[$v] = isset($count[$v]) ? $count[$v] + 1 : 1;\n    }\n    $degree = 0;\n    foreach ($count as $c) {\n        if ($c > $degree) $degree = $c;\n    }\n    $best = count($nums);\n    foreach ($count as $v => $c) {\n        if ($c === $degree) {\n            $span = $last[$v] - $first[$v] + 1;\n            if ($span < $best) $best = $span;\n        }\n    }\n    return $best;\n}`,
              ruby: `def findShortestSubArray(nums)\n  first = {}\n  last = {}\n  count = Hash.new(0)\n  nums.each_with_index do |x, i|\n    first[x] = i unless first.key?(x)\n    last[x] = i\n    count[x] += 1\n  end\n  degree = count.values.max\n  best = nums.length\n  count.each do |v, c|\n    next unless c == degree\n    span = last[v] - first[v] + 1\n    best = span if span < best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Longest Harmonious Subsequence ──────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const count = new Map<number, number>();
      for (let i = 0; i < nums.length; i++) count.set(nums[i], (count.get(nums[i]) ?? 0) + 1);
      let best = 0;
      count.forEach((c, v) => {
        const higher = count.get(v + 1);
        if (higher !== undefined && c + higher > best) best = c + higher;
      });
      return best;
    };
    return {
      slug: "longest-harmonious-subsequence",
      title: "Longest Harmonious Subsequence",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Sorting", "Sliding Window", "Amazon", "LiveRamp"],
      signature: { funcName: "findLHS", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A **harmonious** array is one where the difference between its maximum and minimum values is exactly `1`.\n\nGiven an integer array `nums`, return the length of its longest harmonious **subsequence**. A subsequence keeps the relative order of the remaining elements but need not be contiguous. If no harmonious subsequence exists, return `0`.",
        [
          { in: "nums = [1,3,2,2,5,2,3,7]", out: "5", note: "The longest is [3,2,2,2,3], using only the values 2 and 3." },
          { in: "nums = [1,2,3,4]", out: "2" },
          { in: "nums = [1,1,1,1]", out: "0", note: "A single repeated value has max - min = 0, not 1." },
        ],
        ["1 <= nums.length <= 40", "-1000 <= nums[i] <= 1000"]),
      hints: [
        "Order does not matter for a subsequence here — only how many copies of each value exist.",
        "A harmonious subsequence uses exactly two values, `v` and `v + 1`, and takes every copy of both.",
        "So count occurrences, then maximise `count[v] + count[v + 1]` over the values where both are present.",
      ],
      examples: [
        { input: "[1,3,2,2,5,2,3,7]", expectedOutput: "5" },
        { input: "[1,2,3,4]", expectedOutput: "2" },
        { input: "[1,1,1,1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), rng() < 0.6 ? -5 : -1000, rng() < 0.6 ? 5 : 1000);
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def findLHS(nums):\n    count = {}\n    for x in nums:\n        count[x] = count.get(x, 0) + 1\n    best = 0\n    for v, c in count.items():\n        if v + 1 in count:\n            best = max(best, c + count[v + 1])\n    return best`,
        javascript: `var findLHS = function(nums) {\n    const count = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        count.set(nums[i], (count.get(nums[i]) || 0) + 1);\n    }\n    let best = 0;\n    count.forEach(function(c, v) {\n        const higher = count.get(v + 1);\n        if (higher !== undefined && c + higher > best) best = c + higher;\n    });\n    return best;\n};`,
              typescript: `function findLHS(nums: number[]): number {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var key = String(nums[i]);\n        count[key] = (count[key] === undefined ? 0 : count[key]) + 1;\n    }\n    var best = 0;\n    for (var j = 0; j < nums.length; j++) {\n        var higher = count[String(nums[j] + 1)];\n        if (higher !== undefined) {\n            var total = count[String(nums[j])] + higher;\n            if (total > best) best = total;\n        }\n    }\n    return best;\n}`,
              java: `public static int findLHS(int[] nums) {\n    Map<Integer, Integer> count = new HashMap<>();\n    for (int x : nums) count.put(x, count.getOrDefault(x, 0) + 1);\n    int best = 0;\n    for (Map.Entry<Integer, Integer> e : count.entrySet()) {\n        Integer higher = count.get(e.getKey() + 1);\n        if (higher != null) best = Math.max(best, e.getValue() + higher);\n    }\n    return best;\n}`,
              cpp: `int findLHS(vector<int>& nums) {\n    unordered_map<int, int> count;\n    for (int x : nums) count[x]++;\n    int best = 0;\n    for (auto& kv : count) {\n        auto it = count.find(kv.first + 1);\n        if (it != count.end()) best = max(best, kv.second + it->second);\n    }\n    return best;\n}`,
              c: `int findLHS(int* nums, int numsSize) {\n    int best = 0;\n    for (int i = 0; i < numsSize; i++) {\n        int lo = nums[i];\n        int cLo = 0, cHi = 0;\n        for (int j = 0; j < numsSize; j++) {\n            if (nums[j] == lo) cLo++;\n            else if (nums[j] == lo + 1) cHi++;\n        }\n        if (cHi > 0 && cLo + cHi > best) best = cLo + cHi;\n    }\n    return best;\n}`,
              csharp: `public static int FindLHS(int[] nums)\n{\n    var count = new Dictionary<int, int>();\n    foreach (int x in nums)\n    {\n        count[x] = count.ContainsKey(x) ? count[x] + 1 : 1;\n    }\n    int best = 0;\n    foreach (var kv in count)\n    {\n        if (count.ContainsKey(kv.Key + 1))\n        {\n            best = Math.Max(best, kv.Value + count[kv.Key + 1]);\n        }\n    }\n    return best;\n}`,
              go: `func findLHS(nums []int) int {\n	count := make(map[int]int)\n	for _, x := range nums {\n		count[x]++\n	}\n	best := 0\n	for v, c := range count {\n		if higher, ok := count[v+1]; ok {\n			if c+higher > best {\n				best = c + higher\n			}\n		}\n	}\n	return best\n}`,
              kotlin: `fun findLHS(nums: IntArray): Int {\n    val count = HashMap<Int, Int>()\n    for (x in nums) count[x] = (count[x] ?: 0) + 1\n    var best = 0\n    for ((v, c) in count) {\n        val higher = count[v + 1]\n        if (higher != null && c + higher > best) best = c + higher\n    }\n    return best\n}`,
              swift: `func findLHS(_ nums: [Int]) -> Int {\n    var count: [Int: Int] = [:]\n    for x in nums { count[x, default: 0] += 1 }\n    var best = 0\n    for (v, c) in count {\n        if let higher = count[v + 1], c + higher > best {\n            best = c + higher\n        }\n    }\n    return best\n}`,
              rust: `fn findLHS(nums: Vec<i32>) -> i32 {\n    use std::collections::HashMap;\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for x in nums.iter() {\n        *count.entry(*x).or_insert(0) += 1;\n    }\n    let mut best = 0;\n    for (v, c) in count.iter() {\n        if let Some(higher) = count.get(&(v + 1)) {\n            if c + higher > best {\n                best = c + higher;\n            }\n        }\n    }\n    best\n}`,
              php: `function findLHS($nums) {\n    $count = array();\n    foreach ($nums as $x) {\n        $count[$x] = isset($count[$x]) ? $count[$x] + 1 : 1;\n    }\n    $best = 0;\n    foreach ($count as $v => $c) {\n        if (isset($count[$v + 1]) && $c + $count[$v + 1] > $best) {\n            $best = $c + $count[$v + 1];\n        }\n    }\n    return $best;\n}`,
              ruby: `def findLHS(nums)\n  count = Hash.new(0)\n  nums.each { |x| count[x] += 1 }\n  best = 0\n  count.each do |v, c|\n    next unless count.key?(v + 1)\n    total = c + count[v + 1]\n    best = total if total > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── Distribute Candies ──────────────────────────────────────────
  (() => {
    const ref = (candyType: number[]) => Math.min(new Set(candyType).size, candyType.length / 2);
    return {
      slug: "distribute-candies",
      title: "Distribute Candies",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Greedy", "Amazon", "Meta"],
      signature: { funcName: "distributeCandies", params: [{ name: "candyType", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Alice has `n` candies, where `candyType[i]` is the type of the i-th candy. Her doctor tells her she may eat only `n / 2` of them (`n` is even).\n\nAlice wants to eat as many **different types** as she can while respecting the limit. Return the maximum number of distinct types she can eat.",
        [
          { in: "candyType = [1,1,2,2,3,3]", out: "3", note: "She may eat 3 candies and there are 3 types, so she can have one of each." },
          { in: "candyType = [1,1,2,3]", out: "2", note: "She may eat 2 candies; picking two different types gives 2." },
          { in: "candyType = [6,6,6,6]", out: "1", note: "Only one type exists." },
        ],
        ["2 <= candyType.length <= 40", "candyType.length is even.", "-100 <= candyType[i] <= 100"]),
      hints: [
        "She can never eat more than `n / 2` candies, and never more distinct types than exist.",
        "The answer is the smaller of those two numbers.",
        "A hash set gives the number of distinct types in one pass.",
      ],
      examples: [
        { input: "[1,1,2,2,3,3]", expectedOutput: "3" },
        { input: "[1,1,2,3]", expectedOutput: "2" },
        { input: "[6,6,6,6]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const n = 2 * ri(rng, 1, 20);
        const candyType = randArr(rng, n, -100, 100);
        if (rng() < 0.4) for (let i = 0; i < n; i++) candyType[i] = ri(rng, 1, 4);
        return { input: fmtIntArr(candyType), expectedOutput: String(ref(candyType)) };
      },
      solutions: {
        python: `def distributeCandies(candyType):\n    return min(len(set(candyType)), len(candyType) // 2)`,
        javascript: `var distributeCandies = function(candyType) {\n    const types = new Set(candyType).size;\n    const half = candyType.length / 2;\n    return types < half ? types : half;\n};`,
              typescript: `function distributeCandies(candyType: number[]): number {\n    var seen: { [key: string]: boolean } = {};\n    var types = 0;\n    for (var i = 0; i < candyType.length; i++) {\n        var key = String(candyType[i]);\n        if (seen[key] !== true) {\n            seen[key] = true;\n            types++;\n        }\n    }\n    var half = candyType.length / 2;\n    return types < half ? types : half;\n}`,
              java: `public static int distributeCandies(int[] candyType) {\n    Set<Integer> seen = new HashSet<>();\n    for (int x : candyType) seen.add(x);\n    return Math.min(seen.size(), candyType.length / 2);\n}`,
              cpp: `int distributeCandies(vector<int>& candyType) {\n    unordered_set<int> seen(candyType.begin(), candyType.end());\n    return min((int) seen.size(), (int) candyType.size() / 2);\n}`,
              c: `int distributeCandies(int* candyType, int candyTypeSize) {\n    int types = 0;\n    for (int i = 0; i < candyTypeSize; i++) {\n        bool seen = false;\n        for (int j = 0; j < i; j++) {\n            if (candyType[j] == candyType[i]) { seen = true; break; }\n        }\n        if (!seen) types++;\n    }\n    int half = candyTypeSize / 2;\n    return types < half ? types : half;\n}`,
              csharp: `public static int DistributeCandies(int[] candyType)\n{\n    var seen = new HashSet<int>(candyType);\n    return Math.Min(seen.Count, candyType.Length / 2);\n}`,
              go: `func distributeCandies(candyType []int) int {\n	seen := make(map[int]bool)\n	for _, x := range candyType {\n		seen[x] = true\n	}\n	half := len(candyType) / 2\n	if len(seen) < half {\n		return len(seen)\n	}\n	return half\n}`,
              kotlin: `fun distributeCandies(candyType: IntArray): Int {\n    val types = candyType.toHashSet().size\n    val half = candyType.size / 2\n    return if (types < half) types else half\n}`,
              swift: `func distributeCandies(_ candyType: [Int]) -> Int {\n    let types = Set(candyType).count\n    let half = candyType.count / 2\n    return types < half ? types : half\n}`,
              rust: `fn distributeCandies(candyType: Vec<i32>) -> i32 {\n    use std::collections::HashSet;\n    let half = (candyType.len() / 2) as i32;\n    let types = candyType.into_iter().collect::<HashSet<i32>>().len() as i32;\n    if types < half {\n        types\n    } else {\n        half\n    }\n}`,
              php: `function distributeCandies($candyType) {\n    $types = count(array_unique($candyType));\n    $half = intdiv(count($candyType), 2);\n    return $types < $half ? $types : $half;\n}`,
              ruby: `def distributeCandies(candyType)\n  types = candyType.uniq.length\n  half = candyType.length / 2\n  types < half ? types : half\nend`,
      },
    };
  })(),

  // ── Shortest Unsorted Continuous Subarray ───────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const sorted = nums.slice().sort((a, b) => a - b);
      let l = 0, r = nums.length - 1;
      while (l < nums.length && nums[l] === sorted[l]) l++;
      while (r > l && nums[r] === sorted[r]) r--;
      return l >= nums.length ? 0 : r - l + 1;
    };
    return {
      slug: "shortest-unsorted-continuous-subarray",
      title: "Shortest Unsorted Continuous Subarray",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Two Pointers", "Sorting", "Monotonic Stack", "Amazon", "Google", "Adobe"],
      signature: { funcName: "findUnsortedSubarray", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums`, find the **shortest** contiguous subarray such that sorting that subarray in ascending order leaves the whole array sorted in ascending order.\n\nReturn the length of that subarray. If the array is already sorted, return `0`.",
        [
          { in: "nums = [2,6,4,8,10,9,15]", out: "5", note: "Sorting [6,4,8,10,9] sorts the whole array." },
          { in: "nums = [1,2,3,4]", out: "0" },
          { in: "nums = [1]", out: "0" },
        ],
        ["1 <= nums.length <= 40", "-1000 <= nums[i] <= 1000"],
        "Can you do it in O(n) without sorting?"),
      hints: [
        "Compare the array with its sorted copy: the answer spans the first and last positions that differ.",
        "For O(n), sweep right tracking the running maximum — the last index that falls below it is the right edge.",
        "Sweep left tracking the running minimum to find the left edge the same way.",
      ],
      examples: [
        { input: "[2,6,4,8,10,9,15]", expectedOutput: "5" },
        { input: "[1,2,3,4]", expectedOutput: "0" },
        { input: "[1]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        let nums = randArr(rng, n, -1000, 1000);
        if (rng() < 0.35) {
          nums.sort((a, b) => a - b);
          if (rng() < 0.6 && n >= 2) {
            const i = ri(rng, 0, n - 1), j = ri(rng, 0, n - 1);
            const t = nums[i]; nums[i] = nums[j]; nums[j] = t;
          }
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `def findUnsortedSubarray(nums):\n    sorted_nums = sorted(nums)\n    left, right = 0, len(nums) - 1\n    while left < len(nums) and nums[left] == sorted_nums[left]:\n        left += 1\n    while right > left and nums[right] == sorted_nums[right]:\n        right -= 1\n    return 0 if left >= len(nums) else right - left + 1`,
        javascript: `var findUnsortedSubarray = function(nums) {\n    const sorted = nums.slice().sort(function(a, b) { return a - b; });\n    let left = 0, right = nums.length - 1;\n    while (left < nums.length && nums[left] === sorted[left]) left++;\n    while (right > left && nums[right] === sorted[right]) right--;\n    return left >= nums.length ? 0 : right - left + 1;\n};`,
              typescript: `function findUnsortedSubarray(nums: number[]): number {\n    var sorted = nums.slice();\n    sorted.sort(function (a, b) { return a - b; });\n    var left = 0;\n    var right = nums.length - 1;\n    while (left < nums.length && nums[left] === sorted[left]) left++;\n    while (right > left && nums[right] === sorted[right]) right--;\n    return left >= nums.length ? 0 : right - left + 1;\n}`,
              java: `public static int findUnsortedSubarray(int[] nums) {\n    int[] sorted = Arrays.copyOf(nums, nums.length);\n    Arrays.sort(sorted);\n    int left = 0, right = nums.length - 1;\n    while (left < nums.length && nums[left] == sorted[left]) left++;\n    while (right > left && nums[right] == sorted[right]) right--;\n    return left >= nums.length ? 0 : right - left + 1;\n}`,
              cpp: `int findUnsortedSubarray(vector<int>& nums) {\n    vector<int> sorted = nums;\n    sort(sorted.begin(), sorted.end());\n    int n = (int) nums.size();\n    int left = 0, right = n - 1;\n    while (left < n && nums[left] == sorted[left]) left++;\n    while (right > left && nums[right] == sorted[right]) right--;\n    return left >= n ? 0 : right - left + 1;\n}`,
              c: `int findUnsortedSubarray(int* nums, int numsSize) {\n    int* sorted = (int*) malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));\n    for (int i = 0; i < numsSize; i++) sorted[i] = nums[i];\n    for (int i = 1; i < numsSize; i++) {\n        int key = sorted[i];\n        int j = i - 1;\n        while (j >= 0 && sorted[j] > key) { sorted[j + 1] = sorted[j]; j--; }\n        sorted[j + 1] = key;\n    }\n    int left = 0, right = numsSize - 1;\n    while (left < numsSize && nums[left] == sorted[left]) left++;\n    while (right > left && nums[right] == sorted[right]) right--;\n    int result = left >= numsSize ? 0 : right - left + 1;\n    free(sorted);\n    return result;\n}`,
              csharp: `public static int FindUnsortedSubarray(int[] nums)\n{\n    int[] sorted = (int[]) nums.Clone();\n    Array.Sort(sorted);\n    int left = 0, right = nums.Length - 1;\n    while (left < nums.Length && nums[left] == sorted[left]) left++;\n    while (right > left && nums[right] == sorted[right]) right--;\n    return left >= nums.Length ? 0 : right - left + 1;\n}`,
              go: `func findUnsortedSubarray(nums []int) int {\n	sorted := make([]int, len(nums))\n	copy(sorted, nums)\n	sort.Ints(sorted)\n	left, right := 0, len(nums)-1\n	for left < len(nums) && nums[left] == sorted[left] {\n		left++\n	}\n	for right > left && nums[right] == sorted[right] {\n		right--\n	}\n	if left >= len(nums) {\n		return 0\n	}\n	return right - left + 1\n}`,
              kotlin: `fun findUnsortedSubarray(nums: IntArray): Int {\n    val sorted = nums.copyOf()\n    sorted.sort()\n    var left = 0\n    var right = nums.size - 1\n    while (left < nums.size && nums[left] == sorted[left]) left++\n    while (right > left && nums[right] == sorted[right]) right--\n    return if (left >= nums.size) 0 else right - left + 1\n}`,
              swift: `func findUnsortedSubarray(_ nums: [Int]) -> Int {\n    let sorted = nums.sorted()\n    var left = 0\n    var right = nums.count - 1\n    while left < nums.count && nums[left] == sorted[left] { left += 1 }\n    while right > left && nums[right] == sorted[right] { right -= 1 }\n    return left >= nums.count ? 0 : right - left + 1\n}`,
              rust: `fn findUnsortedSubarray(nums: Vec<i32>) -> i32 {\n    let mut sorted = nums.clone();\n    sorted.sort();\n    let n = nums.len();\n    let mut left = 0;\n    while left < n && nums[left] == sorted[left] {\n        left += 1;\n    }\n    if left >= n {\n        return 0;\n    }\n    let mut right = n - 1;\n    while right > left && nums[right] == sorted[right] {\n        right -= 1;\n    }\n    (right - left + 1) as i32\n}`,
              php: `function findUnsortedSubarray($nums) {\n    $sorted = $nums;\n    sort($sorted);\n    $n = count($nums);\n    $left = 0;\n    $right = $n - 1;\n    while ($left < $n && $nums[$left] === $sorted[$left]) $left++;\n    while ($right > $left && $nums[$right] === $sorted[$right]) $right--;\n    return $left >= $n ? 0 : $right - $left + 1;\n}`,
              ruby: `def findUnsortedSubarray(nums)\n  sorted = nums.sort\n  n = nums.length\n  left = 0\n  right = n - 1\n  left += 1 while left < n && nums[left] == sorted[left]\n  right -= 1 while right > left && nums[right] == sorted[right]\n  left >= n ? 0 : right - left + 1\nend`,
      },
    };
  })(),

  // ── Sort Array By Parity ────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const evens: number[] = [], odds: number[] = [];
      for (let i = 0; i < nums.length; i++) (nums[i] % 2 === 0 ? evens : odds).push(nums[i]);
      return evens.concat(odds);
    };
    return {
      slug: "sort-array-by-parity",
      title: "Sort Array By Parity",
      difficulty: "EASY" as const,
      tags: ["Array", "Two Pointers", "Sorting", "Amazon", "Meta", "Adobe"],
      signature: { funcName: "sortArrayByParity", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums`, move every **even** element in front of every **odd** element.\n\nWithin each group, keep the elements in their original relative order (a **stable** partition).",
        [
          { in: "nums = [3,1,2,4]", out: "[2,4,3,1]", note: "The evens 2 and 4 keep their order, then the odds 3 and 1 keep theirs." },
          { in: "nums = [0]", out: "[0]" },
          { in: "nums = [1,3,5]", out: "[1,3,5]", note: "No evens, so nothing moves." },
        ],
        ["1 <= nums.length <= 40", "0 <= nums[i] <= 1000"]),
      hints: [
        "Collect the evens in one pass and the odds in another, then concatenate.",
        "A single pass appending into two lists works just as well.",
        "The stability requirement rules out the classic two-pointer swap, which reorders within each group.",
      ],
      examples: [
        { input: "[3,1,2,4]", expectedOutput: "[2,4,3,1]" },
        { input: "[0]", expectedOutput: "[0]" },
        { input: "[1,3,5]", expectedOutput: "[1,3,5]" },
      ],
      gen: (rng: Rng) => {
        const nums = randArr(rng, ri(rng, 1, 40), 0, 1000);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def sortArrayByParity(nums):\n    evens = [x for x in nums if x % 2 == 0]\n    odds = [x for x in nums if x % 2 != 0]\n    return evens + odds`,
        javascript: `var sortArrayByParity = function(nums) {\n    const evens = [], odds = [];\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] % 2 === 0) evens.push(nums[i]);\n        else odds.push(nums[i]);\n    }\n    return evens.concat(odds);\n};`,
              typescript: `function sortArrayByParity(nums: number[]): number[] {\n    var evens: number[] = [];\n    var odds: number[] = [];\n    for (var i = 0; i < nums.length; i++) {\n        if (nums[i] % 2 === 0) evens.push(nums[i]);\n        else odds.push(nums[i]);\n    }\n    return evens.concat(odds);\n}`,
              java: `public static int[] sortArrayByParity(int[] nums) {\n    int[] out = new int[nums.length];\n    int pos = 0;\n    for (int x : nums) {\n        if (x % 2 == 0) out[pos++] = x;\n    }\n    for (int x : nums) {\n        if (x % 2 != 0) out[pos++] = x;\n    }\n    return out;\n}`,
              cpp: `vector<int> sortArrayByParity(vector<int>& nums) {\n    vector<int> out;\n    for (int x : nums) {\n        if (x % 2 == 0) out.push_back(x);\n    }\n    for (int x : nums) {\n        if (x % 2 != 0) out.push_back(x);\n    }\n    return out;\n}`,
              c: `int* sortArrayByParity(int* nums, int numsSize, int* returnSize) {\n    int* out = (int*) malloc(sizeof(int) * (numsSize > 0 ? numsSize : 1));\n    int pos = 0;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] % 2 == 0) out[pos++] = nums[i];\n    }\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] % 2 != 0) out[pos++] = nums[i];\n    }\n    *returnSize = numsSize;\n    return out;\n}`,
              csharp: `public static int[] SortArrayByParity(int[] nums)\n{\n    int[] out_ = new int[nums.Length];\n    int pos = 0;\n    foreach (int x in nums)\n    {\n        if (x % 2 == 0) out_[pos++] = x;\n    }\n    foreach (int x in nums)\n    {\n        if (x % 2 != 0) out_[pos++] = x;\n    }\n    return out_;\n}`,
              go: `func sortArrayByParity(nums []int) []int {\n	out := make([]int, 0, len(nums))\n	for _, x := range nums {\n		if x%2 == 0 {\n			out = append(out, x)\n		}\n	}\n	for _, x := range nums {\n		if x%2 != 0 {\n			out = append(out, x)\n		}\n	}\n	return out\n}`,
              kotlin: `fun sortArrayByParity(nums: IntArray): IntArray {\n    val out = IntArray(nums.size)\n    var pos = 0\n    for (x in nums) if (x % 2 == 0) out[pos++] = x\n    for (x in nums) if (x % 2 != 0) out[pos++] = x\n    return out\n}`,
              swift: `func sortArrayByParity(_ nums: [Int]) -> [Int] {\n    var out: [Int] = []\n    for x in nums where x % 2 == 0 { out.append(x) }\n    for x in nums where x % 2 != 0 { out.append(x) }\n    return out\n}`,
              rust: `fn sortArrayByParity(nums: Vec<i32>) -> Vec<i32> {\n    let mut out: Vec<i32> = Vec::new();\n    for x in nums.iter() {\n        if x % 2 == 0 {\n            out.push(*x);\n        }\n    }\n    for x in nums.iter() {\n        if x % 2 != 0 {\n            out.push(*x);\n        }\n    }\n    out\n}`,
              php: `function sortArrayByParity($nums) {\n    $evens = array();\n    $odds = array();\n    foreach ($nums as $x) {\n        if ($x % 2 === 0) $evens[] = $x;\n        else $odds[] = $x;\n    }\n    return array_merge($evens, $odds);\n}`,
              ruby: `def sortArrayByParity(nums)\n  nums.select { |x| x.even? } + nums.reject { |x| x.even? }\nend`,
      },
    };
  })(),

  // ── Height Checker ──────────────────────────────────────────────
  (() => {
    const ref = (heights: number[]) => {
      const expected = heights.slice().sort((a, b) => a - b);
      let count = 0;
      for (let i = 0; i < heights.length; i++) if (heights[i] !== expected[i]) count++;
      return count;
    };
    return {
      slug: "height-checker",
      title: "Height Checker",
      difficulty: "EASY" as const,
      tags: ["Array", "Sorting", "Counting Sort", "Amazon", "Microsoft"],
      signature: { funcName: "heightChecker", params: [{ name: "heights", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "A school is taking an annual photo of all the students, who should stand in **non-decreasing order** of height. Let `expected` be that correctly ordered line.\n\nGiven the current line `heights`, return the number of positions where `heights[i] != expected[i]`.",
        [
          { in: "heights = [1,1,4,2,1,3]", out: "3", note: "expected = [1,1,1,2,3,4]; indices 2, 4 and 5 differ." },
          { in: "heights = [5,1,2,3,4]", out: "5" },
          { in: "heights = [1,2,3,4,5]", out: "0" },
        ],
        ["1 <= heights.length <= 40", "1 <= heights[i] <= 100"]),
      hints: [
        "Sort a copy — the original order is what you are comparing against.",
        "Then count positions where the two arrays disagree.",
        "Heights are bounded by 100, so a counting sort makes it O(n + 100).",
      ],
      examples: [
        { input: "[1,1,4,2,1,3]", expectedOutput: "3" },
        { input: "[5,1,2,3,4]", expectedOutput: "5" },
        { input: "[1,2,3,4,5]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const heights = randArr(rng, ri(rng, 1, 40), 1, 100);
        return { input: fmtIntArr(heights), expectedOutput: String(ref(heights)) };
      },
      solutions: {
        python: `def heightChecker(heights):\n    expected = sorted(heights)\n    return sum(1 for i in range(len(heights)) if heights[i] != expected[i])`,
        javascript: `var heightChecker = function(heights) {\n    const expected = heights.slice().sort(function(a, b) { return a - b; });\n    let count = 0;\n    for (let i = 0; i < heights.length; i++) {\n        if (heights[i] !== expected[i]) count++;\n    }\n    return count;\n};`,
              typescript: `function heightChecker(heights: number[]): number {\n    var expected = heights.slice();\n    expected.sort(function (a, b) { return a - b; });\n    var count = 0;\n    for (var i = 0; i < heights.length; i++) {\n        if (heights[i] !== expected[i]) count++;\n    }\n    return count;\n}`,
              java: `public static int heightChecker(int[] heights) {\n    int[] expected = Arrays.copyOf(heights, heights.length);\n    Arrays.sort(expected);\n    int count = 0;\n    for (int i = 0; i < heights.length; i++) {\n        if (heights[i] != expected[i]) count++;\n    }\n    return count;\n}`,
              cpp: `int heightChecker(vector<int>& heights) {\n    vector<int> expected = heights;\n    sort(expected.begin(), expected.end());\n    int count = 0;\n    for (size_t i = 0; i < heights.size(); i++) {\n        if (heights[i] != expected[i]) count++;\n    }\n    return count;\n}`,
              c: `int heightChecker(int* heights, int heightsSize) {\n    int tally[101] = {0};\n    for (int i = 0; i < heightsSize; i++) tally[heights[i]]++;\n    int count = 0;\n    int pos = 0;\n    for (int v = 1; v <= 100; v++) {\n        for (int k = 0; k < tally[v]; k++) {\n            if (heights[pos] != v) count++;\n            pos++;\n        }\n    }\n    return count;\n}`,
              csharp: `public static int HeightChecker(int[] heights)\n{\n    int[] expected = (int[]) heights.Clone();\n    Array.Sort(expected);\n    int count = 0;\n    for (int i = 0; i < heights.Length; i++)\n    {\n        if (heights[i] != expected[i]) count++;\n    }\n    return count;\n}`,
              go: `func heightChecker(heights []int) int {\n	expected := make([]int, len(heights))\n	copy(expected, heights)\n	sort.Ints(expected)\n	count := 0\n	for i := range heights {\n		if heights[i] != expected[i] {\n			count++\n		}\n	}\n	return count\n}`,
              kotlin: `fun heightChecker(heights: IntArray): Int {\n    val expected = heights.copyOf()\n    expected.sort()\n    var count = 0\n    for (i in heights.indices) {\n        if (heights[i] != expected[i]) count++\n    }\n    return count\n}`,
              swift: `func heightChecker(_ heights: [Int]) -> Int {\n    let expected = heights.sorted()\n    var count = 0\n    for i in 0..<heights.count {\n        if heights[i] != expected[i] { count += 1 }\n    }\n    return count\n}`,
              rust: `fn heightChecker(heights: Vec<i32>) -> i32 {\n    let mut expected = heights.clone();\n    expected.sort();\n    let mut count = 0;\n    for i in 0..heights.len() {\n        if heights[i] != expected[i] {\n            count += 1;\n        }\n    }\n    count\n}`,
              php: `function heightChecker($heights) {\n    $expected = $heights;\n    sort($expected);\n    $count = 0;\n    for ($i = 0; $i < count($heights); $i++) {\n        if ($heights[$i] !== $expected[$i]) $count++;\n    }\n    return $count;\n}`,
              ruby: `def heightChecker(heights)\n  expected = heights.sort\n  heights.each_index.count { |i| heights[i] != expected[i] }\nend`,
      },
    };
  })(),

  // ── Relative Sort Array ─────────────────────────────────────────
  (() => {
    const ref = (arr1: number[], arr2: number[]) => {
      const rank = new Map<number, number>();
      for (let i = 0; i < arr2.length; i++) rank.set(arr2[i], i);
      const known: number[] = [], rest: number[] = [];
      for (let i = 0; i < arr1.length; i++) (rank.has(arr1[i]) ? known : rest).push(arr1[i]);
      known.sort((a, b) => rank.get(a)! - rank.get(b)!);
      rest.sort((a, b) => a - b);
      return known.concat(rest);
    };
    return {
      slug: "relative-sort-array",
      title: "Relative Sort Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Sorting", "Counting Sort", "Amazon", "Microsoft", "Adobe"],
      signature: { funcName: "relativeSortArray", params: [{ name: "arr1", type: "int[]" as const }, { name: "arr2", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given two arrays `arr1` and `arr2`, where the elements of `arr2` are distinct and all of them also appear in `arr1`, sort `arr1` so that its elements follow the **same relative order** as in `arr2`.\n\nAny element of `arr1` that is not in `arr2` goes at the end, in ascending order.",
        [
          { in: "arr1 = [2,3,1,3,2,4,6,7,9,2,19], arr2 = [2,1,4,3,9,6]", out: "[2,2,2,1,4,3,3,9,6,7,19]" },
          { in: "arr1 = [28,6,22,8,44,17], arr2 = [22,28,8,6]", out: "[22,28,8,6,17,44]" },
          { in: "arr1 = [1,1], arr2 = [1]", out: "[1,1]" },
        ],
        ["1 <= arr1.length <= 40", "1 <= arr2.length <= 40", "0 <= arr1[i], arr2[i] <= 100", "arr2 has distinct elements, each present in arr1."],
      ),
      hints: [
        "Build a map from value to its position in `arr2` — that map is the comparison key.",
        "Split `arr1` into the values the map knows and the values it does not.",
        "Sort the first group by rank and the second group numerically, then join them.",
      ],
      examples: [
        { input: "[2,3,1,3,2,4,6,7,9,2,19]\n[2,1,4,3,9,6]", expectedOutput: "[2,2,2,1,4,3,3,9,6,7,19]" },
        { input: "[28,6,22,8,44,17]\n[22,28,8,6]", expectedOutput: "[22,28,8,6,17,44]" },
        { input: "[1,1]\n[1]", expectedOutput: "[1,1]" },
      ],
      gen: (rng: Rng) => {
        const distinct = shuffle(rng, Array.from({ length: 101 }, (_, i) => i)).slice(0, ri(rng, 1, 10));
        const arr2 = distinct.slice();
        const arr1 = arr2.slice();
        const extra = ri(rng, 0, 25);
        for (let i = 0; i < extra; i++) {
          arr1.push(rng() < 0.5 ? arr2[ri(rng, 0, arr2.length - 1)] : ri(rng, 0, 100));
        }
        shuffle(rng, arr1);
        return { input: `${fmtIntArr(arr1)}\n${fmtIntArr(arr2)}`, expectedOutput: fmtIntArr(ref(arr1, arr2)) };
      },
      solutions: {
        python: `def relativeSortArray(arr1, arr2):\n    rank = {v: i for i, v in enumerate(arr2)}\n    known = sorted([x for x in arr1 if x in rank], key=lambda x: rank[x])\n    rest = sorted(x for x in arr1 if x not in rank)\n    return known + rest`,
        javascript: `var relativeSortArray = function(arr1, arr2) {\n    const rank = new Map();\n    for (let i = 0; i < arr2.length; i++) rank.set(arr2[i], i);\n    const known = [], rest = [];\n    for (let i = 0; i < arr1.length; i++) {\n        if (rank.has(arr1[i])) known.push(arr1[i]);\n        else rest.push(arr1[i]);\n    }\n    known.sort(function(a, b) { return rank.get(a) - rank.get(b); });\n    rest.sort(function(a, b) { return a - b; });\n    return known.concat(rest);\n};`,
              typescript: `function relativeSortArray(arr1: number[], arr2: number[]): number[] {\n    var inArr2: { [key: string]: boolean } = {};\n    for (var i = 0; i < arr2.length; i++) inArr2[String(arr2[i])] = true;\n    var out: number[] = [];\n    for (var j = 0; j < arr2.length; j++) {\n        for (var k = 0; k < arr1.length; k++) {\n            if (arr1[k] === arr2[j]) out.push(arr1[k]);\n        }\n    }\n    var rest: number[] = [];\n    for (var m = 0; m < arr1.length; m++) {\n        if (inArr2[String(arr1[m])] !== true) rest.push(arr1[m]);\n    }\n    rest.sort(function (a, b) { return a - b; });\n    return out.concat(rest);\n}`,
              java: `public static int[] relativeSortArray(int[] arr1, int[] arr2) {\n    Set<Integer> inArr2 = new HashSet<>();\n    for (int x : arr2) inArr2.add(x);\n    List<Integer> out = new ArrayList<>();\n    for (int v : arr2) {\n        for (int x : arr1) {\n            if (x == v) out.add(x);\n        }\n    }\n    List<Integer> rest = new ArrayList<>();\n    for (int x : arr1) {\n        if (!inArr2.contains(x)) rest.add(x);\n    }\n    Collections.sort(rest);\n    out.addAll(rest);\n    int[] res = new int[out.size()];\n    for (int i = 0; i < res.length; i++) res[i] = out.get(i);\n    return res;\n}`,
              cpp: `vector<int> relativeSortArray(vector<int>& arr1, vector<int>& arr2) {\n    unordered_set<int> inArr2(arr2.begin(), arr2.end());\n    vector<int> out;\n    for (int v : arr2) {\n        for (int x : arr1) {\n            if (x == v) out.push_back(x);\n        }\n    }\n    vector<int> rest;\n    for (int x : arr1) {\n        if (!inArr2.count(x)) rest.push_back(x);\n    }\n    sort(rest.begin(), rest.end());\n    for (int x : rest) out.push_back(x);\n    return out;\n}`,
              c: `int* relativeSortArray(int* arr1, int arr1Size, int* arr2, int arr2Size, int* returnSize) {\n    int* out = (int*) malloc(sizeof(int) * (arr1Size > 0 ? arr1Size : 1));\n    int len = 0;\n    for (int j = 0; j < arr2Size; j++) {\n        for (int k = 0; k < arr1Size; k++) {\n            if (arr1[k] == arr2[j]) out[len++] = arr1[k];\n        }\n    }\n    int restStart = len;\n    for (int k = 0; k < arr1Size; k++) {\n        bool known = false;\n        for (int j = 0; j < arr2Size; j++) {\n            if (arr1[k] == arr2[j]) { known = true; break; }\n        }\n        if (!known) out[len++] = arr1[k];\n    }\n    for (int i = restStart + 1; i < len; i++) {\n        int key = out[i];\n        int j = i - 1;\n        while (j >= restStart && out[j] > key) { out[j + 1] = out[j]; j--; }\n        out[j + 1] = key;\n    }\n    *returnSize = len;\n    return out;\n}`,
              csharp: `public static int[] RelativeSortArray(int[] arr1, int[] arr2)\n{\n    var inArr2 = new HashSet<int>(arr2);\n    var out_ = new List<int>();\n    foreach (int v in arr2)\n    {\n        foreach (int x in arr1)\n        {\n            if (x == v) out_.Add(x);\n        }\n    }\n    var rest = new List<int>();\n    foreach (int x in arr1)\n    {\n        if (!inArr2.Contains(x)) rest.Add(x);\n    }\n    rest.Sort();\n    out_.AddRange(rest);\n    return out_.ToArray();\n}`,
              go: `func relativeSortArray(arr1 []int, arr2 []int) []int {\n	inArr2 := make(map[int]bool)\n	for _, v := range arr2 {\n		inArr2[v] = true\n	}\n	out := []int{}\n	for _, v := range arr2 {\n		for _, x := range arr1 {\n			if x == v {\n				out = append(out, x)\n			}\n		}\n	}\n	rest := []int{}\n	for _, x := range arr1 {\n		if !inArr2[x] {\n			rest = append(rest, x)\n		}\n	}\n	sort.Ints(rest)\n	return append(out, rest...)\n}`,
              kotlin: `fun relativeSortArray(arr1: IntArray, arr2: IntArray): IntArray {\n    val inArr2 = arr2.toHashSet()\n    val out = ArrayList<Int>()\n    for (v in arr2) {\n        for (x in arr1) {\n            if (x == v) out.add(x)\n        }\n    }\n    val rest = ArrayList<Int>()\n    for (x in arr1) {\n        if (!inArr2.contains(x)) rest.add(x)\n    }\n    rest.sort()\n    out.addAll(rest)\n    return out.toIntArray()\n}`,
              swift: `func relativeSortArray(_ arr1: [Int], _ arr2: [Int]) -> [Int] {\n    let inArr2 = Set(arr2)\n    var out: [Int] = []\n    for v in arr2 {\n        for x in arr1 where x == v { out.append(x) }\n    }\n    var rest: [Int] = []\n    for x in arr1 where !inArr2.contains(x) { rest.append(x) }\n    return out + rest.sorted()\n}`,
              rust: `fn relativeSortArray(arr1: Vec<i32>, arr2: Vec<i32>) -> Vec<i32> {\n    use std::collections::HashSet;\n    let in_arr2: HashSet<i32> = arr2.iter().cloned().collect();\n    let mut out: Vec<i32> = Vec::new();\n    for v in arr2.iter() {\n        for x in arr1.iter() {\n            if x == v {\n                out.push(*x);\n            }\n        }\n    }\n    let mut rest: Vec<i32> = Vec::new();\n    for x in arr1.iter() {\n        if !in_arr2.contains(x) {\n            rest.push(*x);\n        }\n    }\n    rest.sort();\n    out.extend(rest.iter());\n    out\n}`,
              php: `function relativeSortArray($arr1, $arr2) {\n    $inArr2 = array_flip($arr2);\n    $out = array();\n    foreach ($arr2 as $v) {\n        foreach ($arr1 as $x) {\n            if ($x === $v) $out[] = $x;\n        }\n    }\n    $rest = array();\n    foreach ($arr1 as $x) {\n        if (!isset($inArr2[$x])) $rest[] = $x;\n    }\n    sort($rest);\n    return array_merge($out, $rest);\n}`,
              ruby: `def relativeSortArray(arr1, arr2)\n  known = []\n  arr2.each do |v|\n    arr1.each { |x| known << x if x == v }\n  end\n  rest = arr1.reject { |x| arr2.include?(x) }.sort\n  known + rest\nend`,
      },
    };
  })(),

  // ── H-Index ─────────────────────────────────────────────────────
  (() => {
    const ref = (citations: number[]) => {
      const sorted = citations.slice().sort((a, b) => b - a);
      let h = 0;
      for (let i = 0; i < sorted.length; i++) if (sorted[i] >= i + 1) h = i + 1;
      return h;
    };
    return {
      slug: "h-index",
      title: "H-Index",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Sorting", "Counting Sort", "Amazon", "Google", "Meta", "Bloomberg"],
      signature: { funcName: "hIndex", params: [{ name: "citations", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `citations` where `citations[i]` is the number of citations a researcher's i-th paper received, return their **h-index**.\n\nThe h-index is the largest `h` such that the researcher has published at least `h` papers that have each been cited at least `h` times.",
        [
          { in: "citations = [3,0,6,1,5]", out: "3", note: "Three papers have at least 3 citations each; there are not four papers with at least 4." },
          { in: "citations = [1,3,1]", out: "1" },
          { in: "citations = [0,0]", out: "0" },
        ],
        ["1 <= citations.length <= 40", "0 <= citations[i] <= 1000"],
        "Sorting makes it O(n log n). Counting makes it O(n)."),
      hints: [
        "Sort the citations in **descending** order.",
        "After sorting, the paper at 0-based index `i` is the (i + 1)-th best; if it still has `i + 1` citations, an h-index of `i + 1` is achievable.",
        "Take the largest such `i + 1` — the condition can turn on and off, so do not stop at the first failure without checking.",
      ],
      examples: [
        { input: "[3,0,6,1,5]", expectedOutput: "3" },
        { input: "[1,3,1]", expectedOutput: "1" },
        { input: "[0,0]", expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const citations = rng() < 0.6 ? randArr(rng, n, 0, 12) : randArr(rng, n, 0, 1000);
        return { input: fmtIntArr(citations), expectedOutput: String(ref(citations)) };
      },
      solutions: {
        python: `def hIndex(citations):\n    ordered = sorted(citations, reverse=True)\n    h = 0\n    for i, c in enumerate(ordered):\n        if c >= i + 1:\n            h = i + 1\n    return h`,
        javascript: `var hIndex = function(citations) {\n    const ordered = citations.slice().sort(function(a, b) { return b - a; });\n    let h = 0;\n    for (let i = 0; i < ordered.length; i++) {\n        if (ordered[i] >= i + 1) h = i + 1;\n    }\n    return h;\n};`,
              typescript: `function hIndex(citations: number[]): number {\n    var ordered = citations.slice();\n    ordered.sort(function (a, b) { return b - a; });\n    var h = 0;\n    for (var i = 0; i < ordered.length; i++) {\n        if (ordered[i] >= i + 1) h = i + 1;\n    }\n    return h;\n}`,
              java: `public static int hIndex(int[] citations) {\n    int[] ordered = Arrays.copyOf(citations, citations.length);\n    Arrays.sort(ordered);\n    int n = ordered.length;\n    int h = 0;\n    for (int i = 0; i < n; i++) {\n        if (ordered[n - 1 - i] >= i + 1) h = i + 1;\n    }\n    return h;\n}`,
              cpp: `int hIndex(vector<int>& citations) {\n    vector<int> ordered = citations;\n    sort(ordered.begin(), ordered.end(), greater<int>());\n    int h = 0;\n    for (int i = 0; i < (int) ordered.size(); i++) {\n        if (ordered[i] >= i + 1) h = i + 1;\n    }\n    return h;\n}`,
              c: `int hIndex(int* citations, int citationsSize) {\n    int* a = (int*) malloc(sizeof(int) * (citationsSize > 0 ? citationsSize : 1));\n    for (int i = 0; i < citationsSize; i++) a[i] = citations[i];\n    for (int i = 1; i < citationsSize; i++) {\n        int key = a[i];\n        int j = i - 1;\n        while (j >= 0 && a[j] < key) { a[j + 1] = a[j]; j--; }\n        a[j + 1] = key;\n    }\n    int h = 0;\n    for (int i = 0; i < citationsSize; i++) {\n        if (a[i] >= i + 1) h = i + 1;\n    }\n    free(a);\n    return h;\n}`,
              csharp: `public static int HIndex(int[] citations)\n{\n    int[] ordered = (int[]) citations.Clone();\n    Array.Sort(ordered);\n    int n = ordered.Length;\n    int h = 0;\n    for (int i = 0; i < n; i++)\n    {\n        if (ordered[n - 1 - i] >= i + 1) h = i + 1;\n    }\n    return h;\n}`,
              go: `func hIndex(citations []int) int {\n	ordered := make([]int, len(citations))\n	copy(ordered, citations)\n	sort.Sort(sort.Reverse(sort.IntSlice(ordered)))\n	h := 0\n	for i, c := range ordered {\n		if c >= i+1 {\n			h = i + 1\n		}\n	}\n	return h\n}`,
              kotlin: `fun hIndex(citations: IntArray): Int {\n    val ordered = citations.copyOf()\n    ordered.sort()\n    val n = ordered.size\n    var h = 0\n    for (i in 0 until n) {\n        if (ordered[n - 1 - i] >= i + 1) h = i + 1\n    }\n    return h\n}`,
              swift: `func hIndex(_ citations: [Int]) -> Int {\n    let ordered = citations.sorted(by: >)\n    var h = 0\n    for i in 0..<ordered.count {\n        if ordered[i] >= i + 1 { h = i + 1 }\n    }\n    return h\n}`,
              rust: `fn hIndex(citations: Vec<i32>) -> i32 {\n    let mut ordered = citations.clone();\n    ordered.sort();\n    ordered.reverse();\n    let mut h = 0;\n    for i in 0..ordered.len() {\n        if ordered[i] >= (i as i32) + 1 {\n            h = (i as i32) + 1;\n        }\n    }\n    h\n}`,
              php: `function hIndex($citations) {\n    $ordered = $citations;\n    rsort($ordered);\n    $h = 0;\n    for ($i = 0; $i < count($ordered); $i++) {\n        if ($ordered[$i] >= $i + 1) $h = $i + 1;\n    }\n    return $h;\n}`,
              ruby: `def hIndex(citations)\n  ordered = citations.sort.reverse\n  h = 0\n  ordered.each_with_index do |c, i|\n    h = i + 1 if c >= i + 1\n  end\n  h\nend`,
      },
    };
  })(),

  // ── Increasing Triplet Subsequence ──────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      let first = Infinity, second = Infinity;
      for (let i = 0; i < nums.length; i++) {
        if (nums[i] <= first) first = nums[i];
        else if (nums[i] <= second) second = nums[i];
        else return true;
      }
      return false;
    };
    return {
      slug: "increasing-triplet-subsequence",
      title: "Increasing Triplet Subsequence",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Greedy", "Amazon", "Meta", "Google", "Microsoft"],
      signature: { funcName: "increasingTriplet", params: [{ name: "nums", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Given an integer array `nums`, return `true` if there exists a triple of indices `i < j < k` such that `nums[i] < nums[j] < nums[k]`.",
        [
          { in: "nums = [1,2,3,4,5]", out: "true", note: "Any three increasing positions work." },
          { in: "nums = [5,4,3,2,1]", out: "false", note: "The array is strictly decreasing." },
          { in: "nums = [2,1,5,0,4,6]", out: "true", note: "0 < 4 < 6 at indices 3, 4, 5." },
        ],
        ["1 <= nums.length <= 40", "-1000 <= nums[i] <= 1000"],
        "Can you do it in O(n) time and O(1) space?"),
      hints: [
        "Keep the smallest value seen so far, and the smallest value that already has something smaller before it.",
        "Anything strictly greater than that second value completes a triple.",
        "Lowering `first` after `second` is set is safe — `second` still records that a valid pair existed earlier.",
      ],
      examples: [
        { input: "[1,2,3,4,5]", expectedOutput: "true" },
        { input: "[5,4,3,2,1]", expectedOutput: "false" },
        { input: "[2,1,5,0,4,6]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        let nums = randArr(rng, n, -1000, 1000);
        if (rng() < 0.3) { nums.sort((a, b) => b - a); }
        else if (rng() < 0.2) { nums = randArr(rng, n, -3, 3); }
        return { input: fmtIntArr(nums), expectedOutput: bool(ref(nums)) };
      },
      solutions: {
        python: `def increasingTriplet(nums) -> bool:\n    first = second = float("inf")\n    for x in nums:\n        if x <= first:\n            first = x\n        elif x <= second:\n            second = x\n        else:\n            return True\n    return False`,
        javascript: `var increasingTriplet = function(nums) {\n    let first = Infinity, second = Infinity;\n    for (let i = 0; i < nums.length; i++) {\n        if (nums[i] <= first) first = nums[i];\n        else if (nums[i] <= second) second = nums[i];\n        else return true;\n    }\n    return false;\n};`,
              typescript: `function increasingTriplet(nums: number[]): boolean {\n    var first = 2147483647;\n    var second = 2147483647;\n    for (var i = 0; i < nums.length; i++) {\n        if (nums[i] <= first) first = nums[i];\n        else if (nums[i] <= second) second = nums[i];\n        else return true;\n    }\n    return false;\n}`,
              java: `public static boolean increasingTriplet(int[] nums) {\n    long first = Long.MAX_VALUE, second = Long.MAX_VALUE;\n    for (int x : nums) {\n        if (x <= first) first = x;\n        else if (x <= second) second = x;\n        else return true;\n    }\n    return false;\n}`,
              cpp: `bool increasingTriplet(vector<int>& nums) {\n    long long first = 4000000000LL, second = 4000000000LL;\n    for (int x : nums) {\n        if (x <= first) first = x;\n        else if (x <= second) second = x;\n        else return true;\n    }\n    return false;\n}`,
              c: `bool increasingTriplet(int* nums, int numsSize) {\n    long long first = 4000000000LL, second = 4000000000LL;\n    for (int i = 0; i < numsSize; i++) {\n        if (nums[i] <= first) first = nums[i];\n        else if (nums[i] <= second) second = nums[i];\n        else return true;\n    }\n    return false;\n}`,
              csharp: `public static bool IncreasingTriplet(int[] nums)\n{\n    long first = long.MaxValue, second = long.MaxValue;\n    foreach (int x in nums)\n    {\n        if (x <= first) first = x;\n        else if (x <= second) second = x;\n        else return true;\n    }\n    return false;\n}`,
              go: `func increasingTriplet(nums []int) bool {\n	first, second := 4000000000, 4000000000\n	for _, x := range nums {\n		if x <= first {\n			first = x\n		} else if x <= second {\n			second = x\n		} else {\n			return true\n		}\n	}\n	return false\n}`,
              kotlin: `fun increasingTriplet(nums: IntArray): Boolean {\n    var first = 4000000000L\n    var second = 4000000000L\n    for (x in nums) {\n        if (x <= first) first = x.toLong()\n        else if (x <= second) second = x.toLong()\n        else return true\n    }\n    return false\n}`,
              swift: `func increasingTriplet(_ nums: [Int]) -> Bool {\n    var first = 4000000000\n    var second = 4000000000\n    for x in nums {\n        if x <= first { first = x }\n        else if x <= second { second = x }\n        else { return true }\n    }\n    return false\n}`,
              rust: `fn increasingTriplet(nums: Vec<i32>) -> bool {\n    let mut first: i64 = 4000000000;\n    let mut second: i64 = 4000000000;\n    for x in nums.iter() {\n        let v = *x as i64;\n        if v <= first {\n            first = v;\n        } else if v <= second {\n            second = v;\n        } else {\n            return true;\n        }\n    }\n    false\n}`,
              php: `function increasingTriplet($nums) {\n    $first = 4000000000;\n    $second = 4000000000;\n    foreach ($nums as $x) {\n        if ($x <= $first) $first = $x;\n        else if ($x <= $second) $second = $x;\n        else return true;\n    }\n    return false;\n}`,
              ruby: `def increasingTriplet(nums)\n  first = 4000000000\n  second = 4000000000\n  nums.each do |x|\n    if x <= first\n      first = x\n    elsif x <= second\n      second = x\n    else\n      return true\n    end\n  end\n  false\nend`,
      },
    };
  })(),

  // ── Majority Element II ─────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const count = new Map<number, number>();
      for (let i = 0; i < nums.length; i++) count.set(nums[i], (count.get(nums[i]) ?? 0) + 1);
      const out: number[] = [];
      count.forEach((c, v) => { if (c > nums.length / 3) out.push(v); });
      return out.sort((a, b) => a - b);
    };
    return {
      slug: "majority-element-ii",
      title: "Majority Element II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Hash Table", "Sorting", "Counting", "Amazon", "Google", "Adobe"],
      signature: { funcName: "majorityElement", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an integer array `nums` of size `n`, return every element that appears **more than** `n / 3` times, in **increasing order**.\n\nAt most two such elements can exist.",
        [
          { in: "nums = [3,2,3]", out: "[3]", note: "3 appears twice out of three, and 2 > 3/3." },
          { in: "nums = [1]", out: "[1]" },
          { in: "nums = [1,2]", out: "[1,2]", note: "Each appears once, and 1 > 2/3." },
        ],
        ["1 <= nums.length <= 40", "-1000 <= nums[i] <= 1000"],
        "Can you do it in O(n) time and O(1) space? (Boyer–Moore generalises to two candidates.)"),
      hints: [
        "Counting occurrences in a hash map and filtering by the `n / 3` threshold is the direct O(n) solution.",
        "Use a strict `>` comparison — exactly `n / 3` occurrences does not qualify.",
        "The O(1)-space version keeps two candidates with two counters, then verifies both in a second pass.",
      ],
      examples: [
        { input: "[3,2,3]", expectedOutput: "[3]" },
        { input: "[1]", expectedOutput: "[1]" },
        { input: "[1,2]", expectedOutput: "[1,2]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 40);
        const nums = rng() < 0.6 ? randArr(rng, n, -4, 4) : randArr(rng, n, -1000, 1000);
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `def majorityElement(nums):\n    count = {}\n    for x in nums:\n        count[x] = count.get(x, 0) + 1\n    threshold = len(nums) / 3\n    return sorted(v for v, c in count.items() if c > threshold)`,
        javascript: `var majorityElement = function(nums) {\n    const count = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        count.set(nums[i], (count.get(nums[i]) || 0) + 1);\n    }\n    const out = [];\n    const threshold = nums.length / 3;\n    count.forEach(function(c, v) { if (c > threshold) out.push(v); });\n    return out.sort(function(a, b) { return a - b; });\n};`,
              typescript: `function majorityElement(nums: number[]): number[] {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var key = String(nums[i]);\n        count[key] = (count[key] === undefined ? 0 : count[key]) + 1;\n    }\n    var out: number[] = [];\n    var threshold = nums.length / 3;\n    var seen: { [key: string]: boolean } = {};\n    for (var j = 0; j < nums.length; j++) {\n        var k = String(nums[j]);\n        if (seen[k] !== true && count[k] > threshold) {\n            seen[k] = true;\n            out.push(nums[j]);\n        }\n    }\n    out.sort(function (a, b) { return a - b; });\n    return out;\n}`,
              java: `public static int[] majorityElement(int[] nums) {\n    Map<Integer, Integer> count = new HashMap<>();\n    for (int x : nums) count.put(x, count.getOrDefault(x, 0) + 1);\n    List<Integer> out = new ArrayList<>();\n    for (Map.Entry<Integer, Integer> e : count.entrySet()) {\n        if (e.getValue() * 3 > nums.length) out.add(e.getKey());\n    }\n    Collections.sort(out);\n    int[] res = new int[out.size()];\n    for (int i = 0; i < res.length; i++) res[i] = out.get(i);\n    return res;\n}`,
              cpp: `vector<int> majorityElement(vector<int>& nums) {\n    unordered_map<int, int> count;\n    for (int x : nums) count[x]++;\n    vector<int> out;\n    for (auto& kv : count) {\n        if (kv.second * 3 > (int) nums.size()) out.push_back(kv.first);\n    }\n    sort(out.begin(), out.end());\n    return out;\n}`,
              c: `int* majorityElement(int* nums, int numsSize, int* returnSize) {\n    int* out = (int*) malloc(sizeof(int) * 4);\n    int len = 0;\n    for (int i = 0; i < numsSize; i++) {\n        bool earlier = false;\n        for (int j = 0; j < i; j++) {\n            if (nums[j] == nums[i]) { earlier = true; break; }\n        }\n        if (earlier) continue;\n        int c = 0;\n        for (int j = 0; j < numsSize; j++) {\n            if (nums[j] == nums[i]) c++;\n        }\n        if (c * 3 > numsSize) out[len++] = nums[i];\n    }\n    for (int i = 1; i < len; i++) {\n        int key = out[i];\n        int j = i - 1;\n        while (j >= 0 && out[j] > key) { out[j + 1] = out[j]; j--; }\n        out[j + 1] = key;\n    }\n    *returnSize = len;\n    return out;\n}`,
              csharp: `public static int[] MajorityElement(int[] nums)\n{\n    var count = new Dictionary<int, int>();\n    foreach (int x in nums)\n    {\n        count[x] = count.ContainsKey(x) ? count[x] + 1 : 1;\n    }\n    var out_ = new List<int>();\n    foreach (var kv in count)\n    {\n        if (kv.Value * 3 > nums.Length) out_.Add(kv.Key);\n    }\n    out_.Sort();\n    return out_.ToArray();\n}`,
              go: `func majorityElement(nums []int) []int {\n	count := make(map[int]int)\n	for _, x := range nums {\n		count[x]++\n	}\n	out := []int{}\n	for v, c := range count {\n		if c*3 > len(nums) {\n			out = append(out, v)\n		}\n	}\n	sort.Ints(out)\n	return out\n}`,
              kotlin: `fun majorityElement(nums: IntArray): IntArray {\n    val count = HashMap<Int, Int>()\n    for (x in nums) count[x] = (count[x] ?: 0) + 1\n    val out = ArrayList<Int>()\n    for ((v, c) in count) {\n        if (c * 3 > nums.size) out.add(v)\n    }\n    out.sort()\n    return out.toIntArray()\n}`,
              swift: `func majorityElement(_ nums: [Int]) -> [Int] {\n    var count: [Int: Int] = [:]\n    for x in nums { count[x, default: 0] += 1 }\n    var out: [Int] = []\n    for (v, c) in count where c * 3 > nums.count { out.append(v) }\n    return out.sorted()\n}`,
              rust: `fn majorityElement(nums: Vec<i32>) -> Vec<i32> {\n    use std::collections::HashMap;\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for x in nums.iter() {\n        *count.entry(*x).or_insert(0) += 1;\n    }\n    let n = nums.len() as i32;\n    let mut out: Vec<i32> = Vec::new();\n    for (v, c) in count.iter() {\n        if c * 3 > n {\n            out.push(*v);\n        }\n    }\n    out.sort();\n    out\n}`,
              php: `function majorityElement($nums) {\n    $count = array();\n    foreach ($nums as $x) {\n        $count[$x] = isset($count[$x]) ? $count[$x] + 1 : 1;\n    }\n    $out = array();\n    $n = count($nums);\n    foreach ($count as $v => $c) {\n        if ($c * 3 > $n) $out[] = $v;\n    }\n    sort($out);\n    return $out;\n}`,
              ruby: `def majorityElement(nums)\n  count = Hash.new(0)\n  nums.each { |x| count[x] += 1 }\n  n = nums.length\n  count.select { |_, c| c * 3 > n }.keys.sort\nend`,
      },
    };
  })(),
];
