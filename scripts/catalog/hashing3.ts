/**
 * Hash tables and counting — wave 3.
 *
 * Real problems only: LeetCode numbered classics that turn on a frequency map
 * or a set lookup.
 *
 * JS solutions must be Node 12-safe: no ??, ?., replaceAll, .at() or .flat().
 */

import { bool, describe, explain, fmtIntArr, fmtStrArr, pick, ri, randLower, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const HASHING3_PROBLEMS: CatalogProblem[] = [

  // ── Unique Number of Occurrences (LC 1207) ──────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const count: Record<string, number> = {};
      for (const x of arr) count[String(x)] = (count[String(x)] || 0) + 1;
      const seen: Record<string, boolean> = {};
      for (const k of Object.keys(count)) {
        const c = String(count[k]);
        if (seen[c]) return false;
        seen[c] = true;
      }
      return true;
    };
    return {
      slug: "unique-number-of-occurrences",
      title: "Unique Number of Occurrences",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "LeetCode 1207", "Amazon", "TCS"],
      signature: { funcName: "uniqueOccurrences", params: [{ name: "arr", type: "int[]" as const }], returns: "bool" as const },
      description: describe(
        "Given an array of integers `arr`, return `true` if the number of occurrences of each value is **unique** — no two distinct values occur the same number of times.",
        [
          { in: "arr = [1,2,2,1,1,3]", out: "true", note: "1 occurs three times, 2 twice and 3 once — all different." },
          { in: "arr = [1,2]", out: "false", note: "Both values occur once." },
          { in: "arr = [-3,0,1,-3,1,1,1,-3,10,0]", out: "true" },
        ],
        ["1 <= arr.length <= 1000", "-1000 <= arr[i] <= 1000"]),
      hints: [
        "Two passes: count the values, then check the counts for duplicates.",
        "A set of the counts is the cleanest way to test uniqueness.",
        "Return `false` the moment a count repeats.",
      ],
      editorial: explain({
        idea: "Build the frequency map, then treat its **values** as the thing to deduplicate. If inserting a count into a set ever collides, two values share a frequency.",
        steps: [
          "Count occurrences of every distinct value.",
          "Walk the counts, inserting each into a set.",
          "Return `false` on the first collision, `true` otherwise.",
        ],
        why: "Uniqueness of the multiset of counts is exactly the property asked for, and a set answers it in one linear pass.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Comparing the count map's size with the array length answers a different question.",
          "Sorting the counts and checking neighbours also works — just remember to sort the *values*, not the keys.",
        ],
      }),
      examples: [
        { input: "[1,2,2,1,1,3]", expectedOutput: "true" },
        { input: "[1,2]", expectedOutput: "false" },
        { input: "[-3,0,1,-3,1,1,1,-3,10,0]", expectedOutput: "true" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const arr = Array.from({ length: n }, () => ri(rng, -6, 6));
        return { input: fmtIntArr(arr), expectedOutput: bool(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef uniqueOccurrences(arr: List[int]) -> bool:\n    count = {}\n    for x in arr:\n        count[x] = count.get(x, 0) + 1\n    counts = list(count.values())\n    return len(counts) == len(set(counts))`,
        javascript: `var uniqueOccurrences = function(arr) {\n    const count = {};\n    for (let i = 0; i < arr.length; i++) {\n        const k = String(arr[i]);\n        count[k] = (count[k] || 0) + 1;\n    }\n    const seen = {};\n    const keys = Object.keys(count);\n    for (let i = 0; i < keys.length; i++) {\n        const c = String(count[keys[i]]);\n        if (seen[c] === true) return false;\n        seen[c] = true;\n    }\n    return true;\n};`,
        typescript: `function uniqueOccurrences(arr: number[]): boolean {\n    var count: { [key: string]: number } = {};\n    for (var i = 0; i < arr.length; i++) {\n        var k = String(arr[i]);\n        count[k] = (count[k] || 0) + 1;\n    }\n    var seen: { [key: string]: boolean } = {};\n    var keys = Object.keys(count);\n    for (var j = 0; j < keys.length; j++) {\n        var c = String(count[keys[j]]);\n        if (seen[c] === true) return false;\n        seen[c] = true;\n    }\n    return true;\n}`,
        java: `public static boolean uniqueOccurrences(int[] arr) {\n    HashMap<Integer, Integer> count = new HashMap<>();\n    for (int x : arr) count.put(x, count.getOrDefault(x, 0) + 1);\n    HashSet<Integer> seen = new HashSet<>();\n    for (int c : count.values()) {\n        if (!seen.add(c)) return false;\n    }\n    return true;\n}`,
        cpp: `bool uniqueOccurrences(vector<int>& arr) {\n    unordered_map<int, int> count;\n    for (int x : arr) count[x]++;\n    unordered_set<int> seen;\n    for (auto& e : count) {\n        if (seen.count(e.second)) return false;\n        seen.insert(e.second);\n    }\n    return true;\n}`,
        c: `bool uniqueOccurrences(int* arr, int arrSize) {\n    int count[2001];\n    for (int i = 0; i < 2001; i++) count[i] = 0;\n    for (int i = 0; i < arrSize; i++) count[arr[i] + 1000]++;\n    int seen[1001];\n    for (int i = 0; i <= 1000; i++) seen[i] = 0;\n    for (int i = 0; i < 2001; i++) {\n        if (count[i] == 0) continue;\n        if (seen[count[i]]) return false;\n        seen[count[i]] = 1;\n    }\n    return true;\n}`,
        csharp: `public static bool UniqueOccurrences(int[] arr)\n{\n    var count = new Dictionary<int, int>();\n    foreach (int x in arr)\n    {\n        if (count.ContainsKey(x)) count[x]++;\n        else count[x] = 1;\n    }\n    var seen = new HashSet<int>();\n    foreach (int c in count.Values)\n    {\n        if (!seen.Add(c)) return false;\n    }\n    return true;\n}`,
        go: `func uniqueOccurrences(arr []int) bool {\n\tcount := map[int]int{}\n\tfor _, x := range arr {\n\t\tcount[x]++\n\t}\n\tseen := map[int]bool{}\n\tfor _, c := range count {\n\t\tif seen[c] {\n\t\t\treturn false\n\t\t}\n\t\tseen[c] = true\n\t}\n\treturn true\n}`,
        kotlin: `fun uniqueOccurrences(arr: IntArray): Boolean {\n    val count = HashMap<Int, Int>()\n    for (x in arr) count[x] = (count[x] ?: 0) + 1\n    val seen = HashSet<Int>()\n    for (c in count.values) {\n        if (!seen.add(c)) return false\n    }\n    return true\n}`,
        swift: `func uniqueOccurrences(_ arr: [Int]) -> Bool {\n    var count: [Int: Int] = [:]\n    for x in arr { count[x] = (count[x] ?? 0) + 1 }\n    var seen = Set<Int>()\n    for (_, c) in count {\n        if seen.contains(c) { return false }\n        seen.insert(c)\n    }\n    return true\n}`,
        rust: `fn uniqueOccurrences(arr: Vec<i32>) -> bool {\n    use std::collections::{HashMap, HashSet};\n    let mut count: HashMap<i32, i32> = HashMap::new();\n    for &x in arr.iter() {\n        *count.entry(x).or_insert(0) += 1;\n    }\n    let mut seen: HashSet<i32> = HashSet::new();\n    for (_, &c) in count.iter() {\n        if !seen.insert(c) {\n            return false;\n        }\n    }\n    true\n}`,
        php: `function uniqueOccurrences($arr) {\n    $count = array();\n    foreach ($arr as $x) {\n        $count[$x] = isset($count[$x]) ? $count[$x] + 1 : 1;\n    }\n    $seen = array();\n    foreach ($count as $c) {\n        if (isset($seen[$c])) return false;\n        $seen[$c] = true;\n    }\n    return true;\n}`,
        ruby: `def uniqueOccurrences(arr)\n  counts = arr.tally.values\n  counts.length == counts.uniq.length\nend`,
      },
    };
  })(),

  // ── Sum of Unique Elements (LC 1748) ────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const count: Record<string, number> = {};
      for (const x of nums) count[String(x)] = (count[String(x)] || 0) + 1;
      let total = 0;
      for (const k of Object.keys(count)) if (count[k] === 1) total += Number(k);
      return total;
    };
    return {
      slug: "sum-of-unique-elements",
      title: "Sum of Unique Elements",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Counting", "LeetCode 1748", "Amazon", "Infosys"],
      signature: { funcName: "sumOfUnique", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "An element is **unique** if it appears exactly once in the array.\n\nGiven an integer array `nums`, return the sum of all its unique elements.",
        [
          { in: "nums = [1,2,3,2]", out: "4", note: "1 and 3 are unique; 2 appears twice." },
          { in: "nums = [1,1,1,1,1]", out: "0" },
          { in: "nums = [1,2,3,4,5]", out: "15" },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i] <= 100"]),
      hints: [
        "Count first, then sum only the values whose count is 1.",
        "Values are bounded by 100, so a fixed-size counting array works.",
        "An array of all duplicates sums to 0.",
      ],
      editorial: explain({
        idea: "Uniqueness is a property of the frequency table, so count first and then filter.",
        steps: [
          "Tally how many times each value appears.",
          "Sum the distinct values whose tally is exactly 1.",
        ],
        why: "The condition depends only on each value's total count, which the tally captures exactly.",
        time: "O(n)",
        space: "O(V)",
        pitfalls: [
          "Summing the array and subtracting duplicates is fiddly — a duplicated value must be removed entirely, not once.",
          "Adding the value once per occurrence would double-count if the filter were wrong.",
        ],
      }),
      examples: [
        { input: "[1,2,3,2]", expectedOutput: "4" },
        { input: "[1,1,1,1,1]", expectedOutput: "0" },
        { input: "[1,2,3,4,5]", expectedOutput: "15" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => ri(rng, 1, rng() < 0.5 ? 8 : 100));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef sumOfUnique(nums: List[int]) -> int:\n    count = {}\n    for x in nums:\n        count[x] = count.get(x, 0) + 1\n    return sum(v for v, c in count.items() if c == 1)`,
        javascript: `var sumOfUnique = function(nums) {\n    const count = new Array(101).fill(0);\n    for (let i = 0; i < nums.length; i++) count[nums[i]]++;\n    let total = 0;\n    for (let v = 1; v <= 100; v++) {\n        if (count[v] === 1) total += v;\n    }\n    return total;\n};`,
        typescript: `function sumOfUnique(nums: number[]): number {\n    var count: number[] = [];\n    for (var k = 0; k <= 100; k++) count.push(0);\n    for (var i = 0; i < nums.length; i++) count[nums[i]]++;\n    var total = 0;\n    for (var v = 1; v <= 100; v++) {\n        if (count[v] === 1) total += v;\n    }\n    return total;\n}`,
        java: `public static int sumOfUnique(int[] nums) {\n    int[] count = new int[101];\n    for (int x : nums) count[x]++;\n    int total = 0;\n    for (int v = 1; v <= 100; v++) {\n        if (count[v] == 1) total += v;\n    }\n    return total;\n}`,
        cpp: `int sumOfUnique(vector<int>& nums) {\n    vector<int> count(101, 0);\n    for (int x : nums) count[x]++;\n    int total = 0;\n    for (int v = 1; v <= 100; v++) {\n        if (count[v] == 1) total += v;\n    }\n    return total;\n}`,
        c: `int sumOfUnique(int* nums, int numsSize) {\n    int count[101];\n    for (int i = 0; i <= 100; i++) count[i] = 0;\n    for (int i = 0; i < numsSize; i++) count[nums[i]]++;\n    int total = 0;\n    for (int v = 1; v <= 100; v++) {\n        if (count[v] == 1) total += v;\n    }\n    return total;\n}`,
        csharp: `public static int SumOfUnique(int[] nums)\n{\n    int[] count = new int[101];\n    foreach (int x in nums) count[x]++;\n    int total = 0;\n    for (int v = 1; v <= 100; v++)\n    {\n        if (count[v] == 1) total += v;\n    }\n    return total;\n}`,
        go: `func sumOfUnique(nums []int) int {\n\tcount := make([]int, 101)\n\tfor _, x := range nums {\n\t\tcount[x]++\n\t}\n\ttotal := 0\n\tfor v := 1; v <= 100; v++ {\n\t\tif count[v] == 1 {\n\t\t\ttotal += v\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun sumOfUnique(nums: IntArray): Int {\n    val count = IntArray(101)\n    for (x in nums) count[x]++\n    var total = 0\n    for (v in 1..100) {\n        if (count[v] == 1) total += v\n    }\n    return total\n}`,
        swift: `func sumOfUnique(_ nums: [Int]) -> Int {\n    var count = [Int](repeating: 0, count: 101)\n    for x in nums { count[x] += 1 }\n    var total = 0\n    for v in 1...100 {\n        if count[v] == 1 { total += v }\n    }\n    return total\n}`,
        rust: `fn sumOfUnique(nums: Vec<i32>) -> i32 {\n    let mut count = vec![0i32; 101];\n    for &x in nums.iter() {\n        count[x as usize] += 1;\n    }\n    let mut total = 0;\n    for v in 1..=100 {\n        if count[v as usize] == 1 {\n            total += v;\n        }\n    }\n    total\n}`,
        php: `function sumOfUnique($nums) {\n    $count = array_fill(0, 101, 0);\n    foreach ($nums as $x) $count[$x]++;\n    $total = 0;\n    for ($v = 1; $v <= 100; $v++) {\n        if ($count[$v] === 1) $total += $v;\n    }\n    return $total;\n}`,
        ruby: `def sumOfUnique(nums)\n  nums.tally.select { |_, c| c == 1 }.keys.sum\nend`,
      },
    };
  })(),

  // ── Count Elements With Maximum Frequency (LC 3005) ─────────────
  (() => {
    const ref = (nums: number[]) => {
      const count: Record<string, number> = {};
      for (const x of nums) count[String(x)] = (count[String(x)] || 0) + 1;
      let best = 0;
      for (const k of Object.keys(count)) if (count[k] > best) best = count[k];
      let total = 0;
      for (const k of Object.keys(count)) if (count[k] === best) total += best;
      return total;
    };
    return {
      slug: "count-elements-with-maximum-frequency",
      title: "Count Elements With Maximum Frequency",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Counting", "LeetCode 3005", "Amazon", "TCS"],
      signature: { funcName: "maxFrequencyElements", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array of positive integers `nums`, return the **total number of elements** that have the maximum frequency.\n\nIf several values tie for the highest frequency, every one of their occurrences is counted.",
        [
          { in: "nums = [1,2,2,3,1,4]", out: "4", note: "1 and 2 both occur twice, contributing 2 + 2 = 4 elements." },
          { in: "nums = [1,2,3,4,5]", out: "5", note: "Every value occurs once, so all five count." },
          { in: "nums = [7,7,7]", out: "3" },
        ],
        ["1 <= nums.length <= 100", "1 <= nums[i] <= 100"]),
      hints: [
        "Count the frequencies, then find the maximum.",
        "Sum that maximum once for every value that attains it.",
        "Equivalently: `maxFreq × (number of values with maxFreq)`.",
      ],
      editorial: explain({
        idea: "Two sweeps over the frequency table — one to find the peak, one to add up every value that reaches it.",
        steps: [
          "Tally the occurrences of each value.",
          "Find the largest tally.",
          "Add that tally once per value achieving it.",
        ],
        why: "The question counts *elements*, not distinct values, so each tying value contributes its whole frequency rather than 1.",
        time: "O(n)",
        space: "O(V)",
        pitfalls: [
          "Counting the number of tying **values** instead of their total elements answers 2 rather than 4 on the first example.",
          "Finding the max and summing in one pass is possible but easy to get wrong when the max changes mid-sweep.",
        ],
      }),
      examples: [
        { input: "[1,2,2,3,1,4]", expectedOutput: "4" },
        { input: "[1,2,3,4,5]", expectedOutput: "5" },
        { input: "[7,7,7]", expectedOutput: "3" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => ri(rng, 1, rng() < 0.6 ? 6 : 100));
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef maxFrequencyElements(nums: List[int]) -> int:\n    count = {}\n    for x in nums:\n        count[x] = count.get(x, 0) + 1\n    best = max(count.values())\n    return sum(c for c in count.values() if c == best)`,
        javascript: `var maxFrequencyElements = function(nums) {\n    const count = new Array(101).fill(0);\n    for (let i = 0; i < nums.length; i++) count[nums[i]]++;\n    let best = 0;\n    for (let v = 1; v <= 100; v++) if (count[v] > best) best = count[v];\n    let total = 0;\n    for (let v = 1; v <= 100; v++) if (count[v] === best) total += best;\n    return total;\n};`,
        typescript: `function maxFrequencyElements(nums: number[]): number {\n    var count: number[] = [];\n    for (var k = 0; k <= 100; k++) count.push(0);\n    for (var i = 0; i < nums.length; i++) count[nums[i]]++;\n    var best = 0;\n    for (var v = 1; v <= 100; v++) if (count[v] > best) best = count[v];\n    var total = 0;\n    for (var w = 1; w <= 100; w++) if (count[w] === best) total += best;\n    return total;\n}`,
        java: `public static int maxFrequencyElements(int[] nums) {\n    int[] count = new int[101];\n    for (int x : nums) count[x]++;\n    int best = 0;\n    for (int v = 1; v <= 100; v++) if (count[v] > best) best = count[v];\n    int total = 0;\n    for (int v = 1; v <= 100; v++) if (count[v] == best) total += best;\n    return total;\n}`,
        cpp: `int maxFrequencyElements(vector<int>& nums) {\n    vector<int> count(101, 0);\n    for (int x : nums) count[x]++;\n    int best = 0;\n    for (int v = 1; v <= 100; v++) if (count[v] > best) best = count[v];\n    int total = 0;\n    for (int v = 1; v <= 100; v++) if (count[v] == best) total += best;\n    return total;\n}`,
        c: `int maxFrequencyElements(int* nums, int numsSize) {\n    int count[101];\n    for (int i = 0; i <= 100; i++) count[i] = 0;\n    for (int i = 0; i < numsSize; i++) count[nums[i]]++;\n    int best = 0;\n    for (int v = 1; v <= 100; v++) if (count[v] > best) best = count[v];\n    int total = 0;\n    for (int v = 1; v <= 100; v++) if (count[v] == best) total += best;\n    return total;\n}`,
        csharp: `public static int MaxFrequencyElements(int[] nums)\n{\n    int[] count = new int[101];\n    foreach (int x in nums) count[x]++;\n    int best = 0;\n    for (int v = 1; v <= 100; v++) if (count[v] > best) best = count[v];\n    int total = 0;\n    for (int v = 1; v <= 100; v++) if (count[v] == best) total += best;\n    return total;\n}`,
        go: `func maxFrequencyElements(nums []int) int {\n\tcount := make([]int, 101)\n\tfor _, x := range nums {\n\t\tcount[x]++\n\t}\n\tbest := 0\n\tfor v := 1; v <= 100; v++ {\n\t\tif count[v] > best {\n\t\t\tbest = count[v]\n\t\t}\n\t}\n\ttotal := 0\n\tfor v := 1; v <= 100; v++ {\n\t\tif count[v] == best {\n\t\t\ttotal += best\n\t\t}\n\t}\n\treturn total\n}`,
        kotlin: `fun maxFrequencyElements(nums: IntArray): Int {\n    val count = IntArray(101)\n    for (x in nums) count[x]++\n    var best = 0\n    for (v in 1..100) if (count[v] > best) best = count[v]\n    var total = 0\n    for (v in 1..100) if (count[v] == best) total += best\n    return total\n}`,
        swift: `func maxFrequencyElements(_ nums: [Int]) -> Int {\n    var count = [Int](repeating: 0, count: 101)\n    for x in nums { count[x] += 1 }\n    var best = 0\n    for v in 1...100 where count[v] > best { best = count[v] }\n    var total = 0\n    for v in 1...100 where count[v] == best { total += best }\n    return total\n}`,
        rust: `fn maxFrequencyElements(nums: Vec<i32>) -> i32 {\n    let mut count = vec![0i32; 101];\n    for &x in nums.iter() {\n        count[x as usize] += 1;\n    }\n    let mut best = 0;\n    for v in 1..=100 {\n        if count[v as usize] > best {\n            best = count[v as usize];\n        }\n    }\n    let mut total = 0;\n    for v in 1..=100 {\n        if count[v as usize] == best {\n            total += best;\n        }\n    }\n    total\n}`,
        php: `function maxFrequencyElements($nums) {\n    $count = array_fill(0, 101, 0);\n    foreach ($nums as $x) $count[$x]++;\n    $best = 0;\n    for ($v = 1; $v <= 100; $v++) if ($count[$v] > $best) $best = $count[$v];\n    $total = 0;\n    for ($v = 1; $v <= 100; $v++) if ($count[$v] === $best) $total += $best;\n    return $total;\n}`,
        ruby: `def maxFrequencyElements(nums)\n  counts = nums.tally.values\n  best = counts.max\n  counts.select { |c| c == best }.sum\nend`,
      },
    };
  })(),

  // ── Minimum Index Sum of Two Lists (LC 599) ─────────────────────
  (() => {
    const ref = (list1: string[], list2: string[]) => {
      const pos: Record<string, number> = {};
      for (let i = 0; i < list1.length; i++) if (pos[list1[i]] === undefined) pos[list1[i]] = i;
      let best = Infinity;
      const out: string[] = [];
      for (let j = 0; j < list2.length; j++) {
        const i = pos[list2[j]];
        if (i === undefined) continue;
        const s = i + j;
        if (s < best) { best = s; out.length = 0; out.push(list2[j]); }
        else if (s === best) out.push(list2[j]);
      }
      out.sort();
      return out;
    };
    return {
      slug: "minimum-index-sum-of-two-lists",
      title: "Minimum Index Sum of Two Lists",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Hash Table", "LeetCode 599", "Amazon", "Yelp"],
      signature: {
        funcName: "findRestaurant",
        params: [{ name: "list1", type: "string[]" as const }, { name: "list2", type: "string[]" as const }],
        returns: "string[]" as const,
      },
      description: describe(
        "Two friends each have a list of favourite restaurants. Find the **common** restaurants with the smallest **index sum** — the sum of a restaurant's position in `list1` and its position in `list2`.\n\nReturn all such restaurants sorted in **lexicographic order**. There is always at least one common restaurant.",
        [
          { in: 'list1 = ["Shogun","Tapioca Express","Burger King","KFC"], list2 = ["KFC","Shogun","Burger King"]', out: '["Shogun"]', note: "Shogun has index sum 0 + 1 = 1, the smallest." },
          { in: 'list1 = ["Shogun","Tapioca Express","Burger King","KFC"], list2 = ["KFC","Burger King","Tapioca Express","Shogun"]', out: '["Burger King","KFC","Shogun","Tapioca Express"]', note: "Every restaurant has index sum 3, so all four tie and the answer is sorted." },
          { in: 'list1 = ["happy","sad","good"], list2 = ["sad","happy","good"]', out: '["happy","sad"]', note: "Both have index sum 1, and the answer is sorted." },
        ],
        ["1 <= list1.length, list2.length <= 1000", "All strings within each list are distinct.", "There is at least one common string."]),
      hints: [
        "Index `list1` by name so you can look up positions in O(1).",
        "Sweep `list2` and track the smallest index sum seen, resetting the answer when you beat it.",
        "Sort the collected names before returning — that is what makes the answer unique.",
      ],
      editorial: explain({
        idea: "One hash lookup table plus one linear sweep. Ties are collected rather than replaced, then sorted to fix the output order.",
        steps: [
          "Map each name in `list1` to its index.",
          "Walk `list2`. For a name present in the map, compute `i + j`.",
          "If it beats the best sum, clear the answer and start it with this name; if it ties, append.",
          "Sort the answer lexicographically and return it.",
        ],
        why: "Scanning `list2` visits every common name exactly once, and tracking a running minimum with tie collection captures all optimal names in a single pass. Sorting makes the result deterministic.",
        time: "O(n + m log m)",
        space: "O(n)",
        pitfalls: [
          "Replacing instead of appending on a tie loses one of the answers.",
          "Returning in encounter order rather than sorted order fails the exact judge.",
          "Comparing every pair is O(n·m) and unnecessary.",
        ],
      }),
      examples: [
        { input: '["Shogun","Tapioca Express","Burger King","KFC"]\n["KFC","Shogun","Burger King"]', expectedOutput: '["Shogun"]' },
        { input: '["Shogun","Tapioca Express","Burger King","KFC"]\n["KFC","Burger King","Tapioca Express","Shogun"]', expectedOutput: '["Burger King","KFC","Shogun","Tapioca Express"]' },
        { input: '["happy","sad","good"]\n["sad","happy","good"]', expectedOutput: '["happy","sad"]' },
      ],
      gen: (rng: Rng) => {
        const pool = ["alpha", "bravo", "cocoa", "delta", "echo", "fox", "gold"];
        const n = ri(rng, 1, 6);
        const l1 = shuffle(rng, pool.slice()).slice(0, n);
        const shared = l1.slice(0, ri(rng, 1, l1.length));
        const l2 = shuffle(rng, shared.concat(shuffle(rng, pool.slice()).slice(0, ri(rng, 0, 3))));
        const seen: Record<string, boolean> = {};
        const uniq: string[] = [];
        for (const w of l2) { if (!seen[w]) { seen[w] = true; uniq.push(w); } }
        if (ref(l1, uniq).length === 0) return { input: `["a"]\n["a"]`, expectedOutput: `["a"]` };
        return { input: `${fmtStrArr(l1)}\n${fmtStrArr(uniq)}`, expectedOutput: fmtStrArr(ref(l1, uniq)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findRestaurant(list1: List[str], list2: List[str]) -> List[str]:\n    pos = {}\n    for i, name in enumerate(list1):\n        if name not in pos:\n            pos[name] = i\n    best = None\n    out = []\n    for j, name in enumerate(list2):\n        if name not in pos:\n            continue\n        s = pos[name] + j\n        if best is None or s < best:\n            best = s\n            out = [name]\n        elif s == best:\n            out.append(name)\n    out.sort()\n    return out`,
        javascript: `var findRestaurant = function(list1, list2) {\n    const pos = {};\n    for (let i = 0; i < list1.length; i++) {\n        if (pos[list1[i]] === undefined) pos[list1[i]] = i;\n    }\n    let best = Infinity;\n    let out = [];\n    for (let j = 0; j < list2.length; j++) {\n        const i = pos[list2[j]];\n        if (i === undefined) continue;\n        const s = i + j;\n        if (s < best) { best = s; out = [list2[j]]; }\n        else if (s === best) out.push(list2[j]);\n    }\n    out.sort();\n    return out;\n};`,
        typescript: `function findRestaurant(list1: string[], list2: string[]): string[] {\n    var pos: { [key: string]: number } = {};\n    for (var i = 0; i < list1.length; i++) {\n        if (pos[list1[i]] === undefined) pos[list1[i]] = i;\n    }\n    var best = Infinity;\n    var out: string[] = [];\n    for (var j = 0; j < list2.length; j++) {\n        var p = pos[list2[j]];\n        if (p === undefined) continue;\n        var s = p + j;\n        if (s < best) { best = s; out = [list2[j]]; }\n        else if (s === best) out.push(list2[j]);\n    }\n    out.sort();\n    return out;\n}`,
        java: `public static String[] findRestaurant(String[] list1, String[] list2) {\n    HashMap<String, Integer> pos = new HashMap<>();\n    for (int i = 0; i < list1.length; i++) {\n        if (!pos.containsKey(list1[i])) pos.put(list1[i], i);\n    }\n    int best = Integer.MAX_VALUE;\n    ArrayList<String> out = new ArrayList<>();\n    for (int j = 0; j < list2.length; j++) {\n        Integer i = pos.get(list2[j]);\n        if (i == null) continue;\n        int s = i + j;\n        if (s < best) { best = s; out.clear(); out.add(list2[j]); }\n        else if (s == best) out.add(list2[j]);\n    }\n    Collections.sort(out);\n    return out.toArray(new String[0]);\n}`,
        cpp: `vector<string> findRestaurant(vector<string>& list1, vector<string>& list2) {\n    unordered_map<string, int> pos;\n    for (int i = 0; i < (int) list1.size(); i++) {\n        if (pos.find(list1[i]) == pos.end()) pos[list1[i]] = i;\n    }\n    int best = INT_MAX;\n    vector<string> out;\n    for (int j = 0; j < (int) list2.size(); j++) {\n        auto it = pos.find(list2[j]);\n        if (it == pos.end()) continue;\n        int s = it->second + j;\n        if (s < best) { best = s; out.clear(); out.push_back(list2[j]); }\n        else if (s == best) out.push_back(list2[j]);\n    }\n    sort(out.begin(), out.end());\n    return out;\n}`,
        c: `static int cmpStrRest(const void* a, const void* b) {\n    return strcmp(*(const char**) a, *(const char**) b);\n}\n\nchar** findRestaurant(char** list1, int list1Size, char** list2, int list2Size, int* returnSize) {\n    char** out = (char**) malloc((list2Size > 0 ? list2Size : 1) * sizeof(char*));\n    int m = 0;\n    int best = 2000000000;\n    for (int j = 0; j < list2Size; j++) {\n        int found = -1;\n        for (int i = 0; i < list1Size; i++) {\n            if (strcmp(list1[i], list2[j]) == 0) { found = i; break; }\n        }\n        if (found < 0) continue;\n        int s = found + j;\n        if (s < best) {\n            best = s;\n            m = 0;\n            out[m++] = list2[j];\n        } else if (s == best) {\n            out[m++] = list2[j];\n        }\n    }\n    qsort(out, m, sizeof(char*), cmpStrRest);\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static string[] FindRestaurant(string[] list1, string[] list2)\n{\n    var pos = new Dictionary<string, int>();\n    for (int i = 0; i < list1.Length; i++)\n    {\n        if (!pos.ContainsKey(list1[i])) pos[list1[i]] = i;\n    }\n    int best = int.MaxValue;\n    var out_ = new List<string>();\n    for (int j = 0; j < list2.Length; j++)\n    {\n        if (!pos.ContainsKey(list2[j])) continue;\n        int s = pos[list2[j]] + j;\n        if (s < best) { best = s; out_.Clear(); out_.Add(list2[j]); }\n        else if (s == best) out_.Add(list2[j]);\n    }\n    out_.Sort(string.CompareOrdinal);\n    return out_.ToArray();\n}`,
        go: `func findRestaurant(list1 []string, list2 []string) []string {\n\tpos := map[string]int{}\n\tfor i, name := range list1 {\n\t\tif _, ok := pos[name]; !ok {\n\t\t\tpos[name] = i\n\t\t}\n\t}\n\tbest := 2000000000\n\tout := []string{}\n\tfor j, name := range list2 {\n\t\ti, ok := pos[name]\n\t\tif !ok {\n\t\t\tcontinue\n\t\t}\n\t\ts := i + j\n\t\tif s < best {\n\t\t\tbest = s\n\t\t\tout = []string{name}\n\t\t} else if s == best {\n\t\t\tout = append(out, name)\n\t\t}\n\t}\n\tsort.Strings(out)\n\treturn out\n}`,
        kotlin: `fun findRestaurant(list1: Array<String>, list2: Array<String>): Array<String> {\n    val pos = HashMap<String, Int>()\n    for (i in list1.indices) {\n        if (!pos.containsKey(list1[i])) pos[list1[i]] = i\n    }\n    var best = Int.MAX_VALUE\n    val out = ArrayList<String>()\n    for (j in list2.indices) {\n        val i = pos[list2[j]] ?: continue\n        val s = i + j\n        if (s < best) {\n            best = s\n            out.clear()\n            out.add(list2[j])\n        } else if (s == best) {\n            out.add(list2[j])\n        }\n    }\n    out.sort()\n    return out.toTypedArray()\n}`,
        swift: `func findRestaurant(_ list1: [String], _ list2: [String]) -> [String] {\n    var pos: [String: Int] = [:]\n    for (i, name) in list1.enumerated() {\n        if pos[name] == nil { pos[name] = i }\n    }\n    var best = Int.max\n    var out: [String] = []\n    for (j, name) in list2.enumerated() {\n        guard let i = pos[name] else { continue }\n        let s = i + j\n        if s < best {\n            best = s\n            out = [name]\n        } else if s == best {\n            out.append(name)\n        }\n    }\n    return out.sorted()\n}`,
        rust: `fn findRestaurant(list1: Vec<String>, list2: Vec<String>) -> Vec<String> {\n    use std::collections::HashMap;\n    let mut pos: HashMap<String, usize> = HashMap::new();\n    for (i, name) in list1.iter().enumerate() {\n        pos.entry(name.clone()).or_insert(i);\n    }\n    let mut best = std::usize::MAX;\n    let mut out: Vec<String> = Vec::new();\n    for (j, name) in list2.iter().enumerate() {\n        if let Some(&i) = pos.get(name) {\n            let s = i + j;\n            if s < best {\n                best = s;\n                out = vec![name.clone()];\n            } else if s == best {\n                out.push(name.clone());\n            }\n        }\n    }\n    out.sort();\n    out\n}`,
        php: `function findRestaurant($list1, $list2) {\n    $pos = array();\n    foreach ($list1 as $i => $name) {\n        if (!isset($pos[$name])) $pos[$name] = $i;\n    }\n    $best = PHP_INT_MAX;\n    $out = array();\n    foreach ($list2 as $j => $name) {\n        if (!isset($pos[$name])) continue;\n        $s = $pos[$name] + $j;\n        if ($s < $best) { $best = $s; $out = array($name); }\n        else if ($s === $best) $out[] = $name;\n    }\n    sort($out);\n    return $out;\n}`,
        ruby: `def findRestaurant(list1, list2)\n  pos = {}\n  list1.each_with_index { |name, i| pos[name] ||= i }\n  best = nil\n  out = []\n  list2.each_with_index do |name, j|\n    next unless pos.key?(name)\n    s = pos[name] + j\n    if best.nil? || s < best\n      best = s\n      out = [name]\n    elsif s == best\n      out << name\n    end\n  end\n  out.sort\nend`,
      },
    };
  })(),

  // ── Keyboard Row (LC 500) ───────────────────────────────────────
  (() => {
    const ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
    const rowOf = (c: string) => {
      const lower = c.toLowerCase();
      for (let r = 0; r < 3; r++) if (ROWS[r].indexOf(lower) !== -1) return r;
      return -1;
    };
    const ref = (words: string[]) => {
      const out: string[] = [];
      for (const w of words) {
        const r = rowOf(w[0]);
        let ok = true;
        for (const c of w) if (rowOf(c) !== r) { ok = false; break; }
        if (ok) out.push(w);
      }
      return out;
    };
    return {
      slug: "keyboard-row",
      title: "Keyboard Row",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Hash Table", "LeetCode 500", "Amazon", "Mathworks"],
      signature: { funcName: "findWords", params: [{ name: "words", type: "string[]" as const }], returns: "string[]" as const },
      description: describe(
        "Given an array of strings `words`, return those that can be typed using letters from **only one row** of an American QWERTY keyboard.\n\nThe rows are:\n\n```\nqwertyuiop\nasdfghjkl\nzxcvbnm\n```\n\nCase is ignored. Return the qualifying words in their original order.",
        [
          { in: 'words = ["Hello","Alaska","Dad","Peace"]', out: '["Alaska","Dad"]' },
          { in: 'words = ["omk"]', out: "[]" },
          { in: 'words = ["adsdf","sfd"]', out: '["adsdf","sfd"]' },
        ],
        ["1 <= words.length <= 20", "1 <= words[i].length <= 100", "words[i] consists of English letters, upper or lower case."]),
      hints: [
        "Map every letter to its row index once, up front.",
        "A word qualifies when all its letters share the first letter's row.",
        "Lowercase each letter before the lookup so case is ignored.",
      ],
      editorial: explain({
        idea: "Reduce each letter to a row number, then a word qualifies exactly when its row numbers are all equal.",
        steps: [
          "Build a letter-to-row lookup from the three row strings.",
          "For each word, take the row of its first letter.",
          "Scan the remaining letters; if any differs, reject the word.",
          "Collect the survivors in input order.",
        ],
        why: "\"Typed on one row\" is precisely the statement that the row function is constant across the word, which the scan checks directly.",
        time: "O(total characters)",
        space: "O(1) — the lookup is 26 entries",
        pitfalls: [
          "Forgetting to lowercase rejects `\"Dad\"`, whose capital `D` is not in the row strings.",
          "Comparing against a fixed row rather than the word's own first-letter row hard-codes the wrong answer.",
          "The output must preserve the input order.",
        ],
      }),
      examples: [
        { input: '["Hello","Alaska","Dad","Peace"]', expectedOutput: '["Alaska","Dad"]' },
        { input: '["omk"]', expectedOutput: "[]" },
        { input: '["adsdf","sfd"]', expectedOutput: '["adsdf","sfd"]' },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 6);
        const words = Array.from({ length: n }, () => {
          const row = ROWS[ri(rng, 0, 2)];
          const useRow = rng() < 0.5;
          const source = useRow ? row : "abcdefghijklmnopqrstuvwxyz";
          const len = ri(rng, 1, 6);
          let w = "";
          for (let i = 0; i < len; i++) {
            const c = source[ri(rng, 0, source.length - 1)];
            w += rng() < 0.25 ? c.toUpperCase() : c;
          }
          return w;
        });
        return { input: fmtStrArr(words), expectedOutput: fmtStrArr(ref(words)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findWords(words: List[str]) -> List[str]:\n    rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"]\n    row_of = {}\n    for r, letters in enumerate(rows):\n        for c in letters:\n            row_of[c] = r\n    out = []\n    for w in words:\n        r = row_of[w[0].lower()]\n        if all(row_of[c.lower()] == r for c in w):\n            out.append(w)\n    return out`,
        javascript: `var findWords = function(words) {\n    const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];\n    const rowOf = {};\n    for (let r = 0; r < rows.length; r++) {\n        for (let i = 0; i < rows[r].length; i++) rowOf[rows[r].charAt(i)] = r;\n    }\n    const out = [];\n    for (let i = 0; i < words.length; i++) {\n        const w = words[i];\n        const r = rowOf[w.charAt(0).toLowerCase()];\n        let ok = true;\n        for (let j = 0; j < w.length; j++) {\n            if (rowOf[w.charAt(j).toLowerCase()] !== r) { ok = false; break; }\n        }\n        if (ok) out.push(w);\n    }\n    return out;\n};`,
        typescript: `function findWords(words: string[]): string[] {\n    var rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];\n    var rowOf: { [key: string]: number } = {};\n    for (var r = 0; r < rows.length; r++) {\n        for (var i = 0; i < rows[r].length; i++) rowOf[rows[r].charAt(i)] = r;\n    }\n    var out: string[] = [];\n    for (var k = 0; k < words.length; k++) {\n        var w = words[k];\n        var target = rowOf[w.charAt(0).toLowerCase()];\n        var ok = true;\n        for (var j = 0; j < w.length; j++) {\n            if (rowOf[w.charAt(j).toLowerCase()] !== target) { ok = false; break; }\n        }\n        if (ok) out.push(w);\n    }\n    return out;\n}`,
        java: `public static String[] findWords(String[] words) {\n    String[] rows = { "qwertyuiop", "asdfghjkl", "zxcvbnm" };\n    int[] rowOf = new int[26];\n    for (int r = 0; r < rows.length; r++) {\n        for (int i = 0; i < rows[r].length(); i++) rowOf[rows[r].charAt(i) - 'a'] = r;\n    }\n    ArrayList<String> out = new ArrayList<>();\n    for (String w : words) {\n        int target = rowOf[Character.toLowerCase(w.charAt(0)) - 'a'];\n        boolean ok = true;\n        for (int i = 0; i < w.length(); i++) {\n            if (rowOf[Character.toLowerCase(w.charAt(i)) - 'a'] != target) { ok = false; break; }\n        }\n        if (ok) out.add(w);\n    }\n    return out.toArray(new String[0]);\n}`,
        cpp: `vector<string> findWords(vector<string>& words) {\n    vector<string> rows = { "qwertyuiop", "asdfghjkl", "zxcvbnm" };\n    vector<int> rowOf(26, 0);\n    for (int r = 0; r < 3; r++) {\n        for (char c : rows[r]) rowOf[c - 'a'] = r;\n    }\n    vector<string> out;\n    for (auto& w : words) {\n        char first = w[0] >= 'A' && w[0] <= 'Z' ? (char) (w[0] + 32) : w[0];\n        int target = rowOf[first - 'a'];\n        bool ok = true;\n        for (char ch : w) {\n            char lc = ch >= 'A' && ch <= 'Z' ? (char) (ch + 32) : ch;\n            if (rowOf[lc - 'a'] != target) { ok = false; break; }\n        }\n        if (ok) out.push_back(w);\n    }\n    return out;\n}`,
        c: `char** findWords(char** words, int wordsSize, int* returnSize) {\n    const char* rows[3] = { "qwertyuiop", "asdfghjkl", "zxcvbnm" };\n    int rowOf[26];\n    for (int r = 0; r < 3; r++) {\n        for (int i = 0; rows[r][i] != '\\0'; i++) rowOf[rows[r][i] - 'a'] = r;\n    }\n    char** out = (char**) malloc((wordsSize > 0 ? wordsSize : 1) * sizeof(char*));\n    int m = 0;\n    for (int k = 0; k < wordsSize; k++) {\n        const char* w = words[k];\n        char first = (w[0] >= 'A' && w[0] <= 'Z') ? (char) (w[0] + 32) : w[0];\n        int target = rowOf[first - 'a'];\n        int ok = 1;\n        for (int i = 0; w[i] != '\\0'; i++) {\n            char lc = (w[i] >= 'A' && w[i] <= 'Z') ? (char) (w[i] + 32) : w[i];\n            if (rowOf[lc - 'a'] != target) { ok = 0; break; }\n        }\n        if (ok) out[m++] = words[k];\n    }\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static string[] FindWords(string[] words)\n{\n    string[] rows = { "qwertyuiop", "asdfghjkl", "zxcvbnm" };\n    int[] rowOf = new int[26];\n    for (int r = 0; r < rows.Length; r++)\n    {\n        foreach (char c in rows[r]) rowOf[c - 'a'] = r;\n    }\n    var out_ = new List<string>();\n    foreach (string w in words)\n    {\n        int target = rowOf[char.ToLower(w[0]) - 'a'];\n        bool ok = true;\n        foreach (char c in w)\n        {\n            if (rowOf[char.ToLower(c) - 'a'] != target) { ok = false; break; }\n        }\n        if (ok) out_.Add(w);\n    }\n    return out_.ToArray();\n}`,
        go: `func findWords(words []string) []string {\n\trows := []string{"qwertyuiop", "asdfghjkl", "zxcvbnm"}\n\tvar rowOf [26]int\n\tfor r := 0; r < 3; r++ {\n\t\tfor i := 0; i < len(rows[r]); i++ {\n\t\t\trowOf[rows[r][i]-'a'] = r\n\t\t}\n\t}\n\tlower := func(c byte) byte {\n\t\tif c >= 'A' && c <= 'Z' {\n\t\t\treturn c + 32\n\t\t}\n\t\treturn c\n\t}\n\tout := []string{}\n\tfor _, w := range words {\n\t\ttarget := rowOf[lower(w[0])-'a']\n\t\tok := true\n\t\tfor i := 0; i < len(w); i++ {\n\t\t\tif rowOf[lower(w[i])-'a'] != target {\n\t\t\t\tok = false\n\t\t\t\tbreak\n\t\t\t}\n\t\t}\n\t\tif ok {\n\t\t\tout = append(out, w)\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun findWords(words: Array<String>): Array<String> {\n    val rows = arrayOf("qwertyuiop", "asdfghjkl", "zxcvbnm")\n    val rowOf = IntArray(26)\n    for (r in rows.indices) {\n        for (c in rows[r]) rowOf[c - 'a'] = r\n    }\n    val out = ArrayList<String>()\n    for (w in words) {\n        val target = rowOf[w[0].toLowerCase() - 'a']\n        var ok = true\n        for (c in w) {\n            if (rowOf[c.toLowerCase() - 'a'] != target) {\n                ok = false\n                break\n            }\n        }\n        if (ok) out.add(w)\n    }\n    return out.toTypedArray()\n}`,
        swift: `func findWords(_ words: [String]) -> [String] {\n    let rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"]\n    var rowOf = [Character: Int]()\n    for (r, letters) in rows.enumerated() {\n        for c in letters { rowOf[c] = r }\n    }\n    var out: [String] = []\n    for w in words {\n        let lower = Array(w.lowercased())\n        let target = rowOf[lower[0]]\n        var ok = true\n        for c in lower {\n            if rowOf[c] != target {\n                ok = false\n                break\n            }\n        }\n        if ok { out.append(w) }\n    }\n    return out\n}`,
        rust: `fn findWords(words: Vec<String>) -> Vec<String> {\n    let rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];\n    let mut row_of = [0usize; 26];\n    for (r, letters) in rows.iter().enumerate() {\n        for b in letters.bytes() {\n            row_of[(b - b'a') as usize] = r;\n        }\n    }\n    let mut out: Vec<String> = Vec::new();\n    for w in words.iter() {\n        let lower = w.to_lowercase();\n        let bytes = lower.as_bytes();\n        let target = row_of[(bytes[0] - b'a') as usize];\n        let mut ok = true;\n        for &b in bytes.iter() {\n            if row_of[(b - b'a') as usize] != target {\n                ok = false;\n                break;\n            }\n        }\n        if ok {\n            out.push(w.clone());\n        }\n    }\n    out\n}`,
        php: `function findWords($words) {\n    $rows = array("qwertyuiop", "asdfghjkl", "zxcvbnm");\n    $rowOf = array();\n    foreach ($rows as $r => $letters) {\n        for ($i = 0; $i < strlen($letters); $i++) $rowOf[$letters[$i]] = $r;\n    }\n    $out = array();\n    foreach ($words as $w) {\n        $lower = strtolower($w);\n        $target = $rowOf[$lower[0]];\n        $ok = true;\n        for ($i = 0; $i < strlen($lower); $i++) {\n            if ($rowOf[$lower[$i]] !== $target) { $ok = false; break; }\n        }\n        if ($ok) $out[] = $w;\n    }\n    return $out;\n}`,
        ruby: `def findWords(words)\n  rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"]\n  row_of = {}\n  rows.each_with_index do |letters, r|\n    letters.each_char { |c| row_of[c] = r }\n  end\n  words.select do |w|\n    lower = w.downcase\n    target = row_of[lower[0]]\n    lower.each_char.all? { |c| row_of[c] == target }\n  end\nend`,
      },
    };
  })(),

  // ── Find Common Characters (LC 1002) ────────────────────────────
  (() => {
    const ref = (words: string[]) => {
      const minCount = new Array(26).fill(Infinity);
      for (const w of words) {
        const c = new Array(26).fill(0);
        for (const ch of w) c[ch.charCodeAt(0) - 97]++;
        for (let i = 0; i < 26; i++) minCount[i] = Math.min(minCount[i], c[i]);
      }
      const out: string[] = [];
      for (let i = 0; i < 26; i++) {
        for (let k = 0; k < minCount[i]; k++) out.push(String.fromCharCode(97 + i));
      }
      return out;
    };
    return {
      slug: "find-common-characters",
      title: "Find Common Characters",
      difficulty: "EASY" as const,
      tags: ["Array", "String", "Hash Table", "LeetCode 1002", "Amazon", "Adobe"],
      signature: { funcName: "commonChars", params: [{ name: "words", type: "string[]" as const }], returns: "string[]" as const },
      description: describe(
        "Given an array of strings `words`, return every character that appears in **all** of them, **including duplicates**.\n\nA character appearing twice in every word appears twice in the answer. Return the characters in **alphabetical order**, each as a one-character string.",
        [
          { in: 'words = ["bella","label","roller"]', out: '["e","l","l"]', note: "Every word has one e and at least two l's." },
          { in: 'words = ["cool","lock","cook"]', out: '["c","o"]' },
          { in: 'words = ["abc"]', out: '["a","b","c"]' },
        ],
        ["1 <= words.length <= 100", "1 <= words[i].length <= 100", "words[i] consists of lowercase English letters."]),
      hints: [
        "For each letter, the answer's count is the **minimum** count across all words.",
        "Count each word into a 26-slot array and fold with `min`.",
        "Emit each letter that many times, walking a to z for the required order.",
      ],
      editorial: explain({
        idea: "Multiset intersection: a character survives as many times as the fewest copies any single word has.",
        steps: [
          "Initialise a 26-slot `minCount` to infinity.",
          "Count each word's letters and fold the result into `minCount` with `min`.",
          "Walk the alphabet, emitting each letter `minCount[letter]` times.",
        ],
        why: "A character can be taken from every word only as many times as the most constrained word allows, which is exactly the minimum of the per-word counts. Walking a-to-z produces the required alphabetical output.",
        time: "O(total characters)",
        space: "O(1) — 26 counters",
        pitfalls: [
          "Using a set of characters loses the duplicates and drops the second `l` in the first example.",
          "Seeding `minCount` with zeros makes every answer empty.",
          "Emitting in word order rather than alphabetical order fails the exact judge.",
        ],
      }),
      examples: [
        { input: '["bella","label","roller"]', expectedOutput: '["e","l","l"]' },
        { input: '["cool","lock","cook"]', expectedOutput: '["c","o"]' },
        { input: '["abc"]', expectedOutput: '["a","b","c"]' },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 5);
        const words = Array.from({ length: n }, () => randLower(rng, 1, 8, "abcde"));
        return { input: fmtStrArr(words), expectedOutput: fmtStrArr(ref(words)) };
      },
      solutions: {
        python: `from typing import List\n\ndef commonChars(words: List[str]) -> List[str]:\n    min_count = [1000] * 26\n    for w in words:\n        c = [0] * 26\n        for ch in w:\n            c[ord(ch) - 97] += 1\n        for i in range(26):\n            if c[i] < min_count[i]:\n                min_count[i] = c[i]\n    out = []\n    for i in range(26):\n        out.extend([chr(97 + i)] * min_count[i])\n    return out`,
        javascript: `var commonChars = function(words) {\n    const minCount = new Array(26).fill(1000);\n    for (let w = 0; w < words.length; w++) {\n        const c = new Array(26).fill(0);\n        for (let i = 0; i < words[w].length; i++) c[words[w].charCodeAt(i) - 97]++;\n        for (let i = 0; i < 26; i++) {\n            if (c[i] < minCount[i]) minCount[i] = c[i];\n        }\n    }\n    const out = [];\n    for (let i = 0; i < 26; i++) {\n        for (let k = 0; k < minCount[i]; k++) out.push(String.fromCharCode(97 + i));\n    }\n    return out;\n};`,
        typescript: `function commonChars(words: string[]): string[] {\n    var minCount: number[] = [];\n    for (var a = 0; a < 26; a++) minCount.push(1000);\n    for (var w = 0; w < words.length; w++) {\n        var c: number[] = [];\n        for (var b = 0; b < 26; b++) c.push(0);\n        for (var i = 0; i < words[w].length; i++) c[words[w].charCodeAt(i) - 97]++;\n        for (var j = 0; j < 26; j++) {\n            if (c[j] < minCount[j]) minCount[j] = c[j];\n        }\n    }\n    var out: string[] = [];\n    for (var m = 0; m < 26; m++) {\n        for (var k = 0; k < minCount[m]; k++) out.push(String.fromCharCode(97 + m));\n    }\n    return out;\n}`,
        java: `public static String[] commonChars(String[] words) {\n    int[] minCount = new int[26];\n    Arrays.fill(minCount, 1000);\n    for (String w : words) {\n        int[] c = new int[26];\n        for (int i = 0; i < w.length(); i++) c[w.charAt(i) - 'a']++;\n        for (int i = 0; i < 26; i++) minCount[i] = Math.min(minCount[i], c[i]);\n    }\n    ArrayList<String> out = new ArrayList<>();\n    for (int i = 0; i < 26; i++) {\n        for (int k = 0; k < minCount[i]; k++) out.add(String.valueOf((char) ('a' + i)));\n    }\n    return out.toArray(new String[0]);\n}`,
        cpp: `vector<string> commonChars(vector<string>& words) {\n    vector<int> minCount(26, 1000);\n    for (auto& w : words) {\n        vector<int> c(26, 0);\n        for (char ch : w) c[ch - 'a']++;\n        for (int i = 0; i < 26; i++) minCount[i] = min(minCount[i], c[i]);\n    }\n    vector<string> out;\n    for (int i = 0; i < 26; i++) {\n        for (int k = 0; k < minCount[i]; k++) out.push_back(string(1, (char) ('a' + i)));\n    }\n    return out;\n}`,
        c: `char** commonChars(char** words, int wordsSize, int* returnSize) {\n    int minCount[26];\n    for (int i = 0; i < 26; i++) minCount[i] = 1000;\n    for (int w = 0; w < wordsSize; w++) {\n        int c[26];\n        for (int i = 0; i < 26; i++) c[i] = 0;\n        for (int i = 0; words[w][i] != '\\0'; i++) c[words[w][i] - 'a']++;\n        for (int i = 0; i < 26; i++) {\n            if (c[i] < minCount[i]) minCount[i] = c[i];\n        }\n    }\n    int total = 0;\n    for (int i = 0; i < 26; i++) total += minCount[i];\n    char** out = (char**) malloc((total > 0 ? total : 1) * sizeof(char*));\n    int m = 0;\n    for (int i = 0; i < 26; i++) {\n        for (int k = 0; k < minCount[i]; k++) {\n            char* s = (char*) malloc(2);\n            s[0] = (char) ('a' + i);\n            s[1] = '\\0';\n            out[m++] = s;\n        }\n    }\n    *returnSize = m;\n    return out;\n}`,
        csharp: `public static string[] CommonChars(string[] words)\n{\n    int[] minCount = new int[26];\n    for (int i = 0; i < 26; i++) minCount[i] = 1000;\n    foreach (string w in words)\n    {\n        int[] c = new int[26];\n        foreach (char ch in w) c[ch - 'a']++;\n        for (int i = 0; i < 26; i++) minCount[i] = Math.Min(minCount[i], c[i]);\n    }\n    var out_ = new List<string>();\n    for (int i = 0; i < 26; i++)\n    {\n        for (int k = 0; k < minCount[i]; k++) out_.Add(((char) ('a' + i)).ToString());\n    }\n    return out_.ToArray();\n}`,
        go: `func commonChars(words []string) []string {\n\tvar minCount [26]int\n\tfor i := range minCount {\n\t\tminCount[i] = 1000\n\t}\n\tfor _, w := range words {\n\t\tvar c [26]int\n\t\tfor i := 0; i < len(w); i++ {\n\t\t\tc[w[i]-'a']++\n\t\t}\n\t\tfor i := 0; i < 26; i++ {\n\t\t\tif c[i] < minCount[i] {\n\t\t\t\tminCount[i] = c[i]\n\t\t\t}\n\t\t}\n\t}\n\tout := []string{}\n\tfor i := 0; i < 26; i++ {\n\t\tfor k := 0; k < minCount[i]; k++ {\n\t\t\tout = append(out, string(rune('a'+i)))\n\t\t}\n\t}\n\treturn out\n}`,
        kotlin: `fun commonChars(words: Array<String>): Array<String> {\n    val minCount = IntArray(26) { 1000 }\n    for (w in words) {\n        val c = IntArray(26)\n        for (ch in w) c[ch - 'a']++\n        for (i in 0 until 26) minCount[i] = minOf(minCount[i], c[i])\n    }\n    val out = ArrayList<String>()\n    for (i in 0 until 26) {\n        for (k in 0 until minCount[i]) out.add(('a' + i).toString())\n    }\n    return out.toTypedArray()\n}`,
        swift: `func commonChars(_ words: [String]) -> [String] {\n    var minCount = [Int](repeating: 1000, count: 26)\n    for w in words {\n        var c = [Int](repeating: 0, count: 26)\n        for u in w.unicodeScalars { c[Int(u.value) - 97] += 1 }\n        for i in 0..<26 { minCount[i] = min(minCount[i], c[i]) }\n    }\n    var out: [String] = []\n    for i in 0..<26 {\n        for _ in 0..<minCount[i] {\n            out.append(String(Character(UnicodeScalar(UInt32(97 + i))!)))\n        }\n    }\n    return out\n}`,
        rust: `fn commonChars(words: Vec<String>) -> Vec<String> {\n    let mut min_count = [1000i32; 26];\n    for w in words.iter() {\n        let mut c = [0i32; 26];\n        for b in w.bytes() {\n            c[(b - b'a') as usize] += 1;\n        }\n        for i in 0..26 {\n            if c[i] < min_count[i] {\n                min_count[i] = c[i];\n            }\n        }\n    }\n    let mut out: Vec<String> = Vec::new();\n    for i in 0..26 {\n        for _ in 0..min_count[i] {\n            out.push(((b'a' + i as u8) as char).to_string());\n        }\n    }\n    out\n}`,
        php: `function commonChars($words) {\n    $minCount = array_fill(0, 26, 1000);\n    foreach ($words as $w) {\n        $c = array_fill(0, 26, 0);\n        for ($i = 0; $i < strlen($w); $i++) $c[ord($w[$i]) - 97]++;\n        for ($i = 0; $i < 26; $i++) {\n            if ($c[$i] < $minCount[$i]) $minCount[$i] = $c[$i];\n        }\n    }\n    $out = array();\n    for ($i = 0; $i < 26; $i++) {\n        for ($k = 0; $k < $minCount[$i]; $k++) $out[] = chr(97 + $i);\n    }\n    return $out;\n}`,
        ruby: `def commonChars(words)\n  min_count = Array.new(26, 1000)\n  words.each do |w|\n    c = Array.new(26, 0)\n    w.each_char { |ch| c[ch.ord - 97] += 1 }\n    (0...26).each { |i| min_count[i] = [min_count[i], c[i]].min }\n  end\n  out = []\n  (0...26).each do |i|\n    min_count[i].times { out << (97 + i).chr }\n  end\n  out\nend`,
      },
    };
  })(),

  // ── N-Repeated Element in Size 2N Array (LC 961) ────────────────
  (() => {
    const ref = (nums: number[]) => {
      const seen: Record<string, boolean> = {};
      for (const x of nums) {
        if (seen[String(x)]) return x;
        seen[String(x)] = true;
      }
      return -1;
    };
    return {
      slug: "n-repeated-element-in-size-2n-array",
      title: "N-Repeated Element in Size 2N Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "LeetCode 961", "Amazon", "Adobe"],
      signature: { funcName: "repeatedNTimes", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "You are given an array `nums` of length `2n` containing `n + 1` distinct values, exactly one of which appears `n` times.\n\nReturn that repeated value.",
        [
          { in: "nums = [1,2,3,3]", out: "3" },
          { in: "nums = [2,1,2,5,3,2]", out: "2" },
          { in: "nums = [5,1,5,2,5,3,5,4]", out: "5" },
        ],
        ["nums.length is even and at least 4", "0 <= nums[i] <= 10000", "nums contains n + 1 distinct values, one repeated n times."]),
      hints: [
        "Every other value appears exactly once, so the first value you see twice is the answer.",
        "A set is enough — no counting needed.",
        "The structure also guarantees two copies appear within any window of four, if you want O(1) space.",
      ],
      editorial: explain({
        idea: "All other values are unique, so the very first repeat encountered while scanning must be the target.",
        steps: [
          "Keep a set of values seen so far.",
          "For each element, return it immediately if it is already in the set.",
          "Otherwise add it and continue.",
        ],
        why: "Only one value repeats at all, so any collision identifies it. The guarantee that it appears `n` times means a collision is certain before the array ends.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Counting frequencies and taking the maximum also works but does more work than needed.",
          "The 'majority element' voting algorithm is *not* valid here — the repeated value occupies exactly half the array, not more.",
        ],
      }),
      examples: [
        { input: "[1,2,3,3]", expectedOutput: "3" },
        { input: "[2,1,2,5,3,2]", expectedOutput: "2" },
        { input: "[5,1,5,2,5,3,5,4]", expectedOutput: "5" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 2, 10);
        const values = new Set<number>();
        while (values.size < n + 1) values.add(ri(rng, 0, 200));
        const list = Array.from(values);
        const repeated = list[ri(rng, 0, list.length - 1)];
        const arr: number[] = [];
        for (const v of list) if (v !== repeated) arr.push(v);
        for (let i = 0; i < n; i++) arr.push(repeated);
        shuffle(rng, arr);
        return { input: fmtIntArr(arr), expectedOutput: String(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef repeatedNTimes(nums: List[int]) -> int:\n    seen = set()\n    for x in nums:\n        if x in seen:\n            return x\n        seen.add(x)\n    return -1`,
        javascript: `var repeatedNTimes = function(nums) {\n    const seen = {};\n    for (let i = 0; i < nums.length; i++) {\n        const k = String(nums[i]);\n        if (seen[k] === true) return nums[i];\n        seen[k] = true;\n    }\n    return -1;\n};`,
        typescript: `function repeatedNTimes(nums: number[]): number {\n    var seen: { [key: string]: boolean } = {};\n    for (var i = 0; i < nums.length; i++) {\n        var k = String(nums[i]);\n        if (seen[k] === true) return nums[i];\n        seen[k] = true;\n    }\n    return -1;\n}`,
        java: `public static int repeatedNTimes(int[] nums) {\n    HashSet<Integer> seen = new HashSet<>();\n    for (int x : nums) {\n        if (!seen.add(x)) return x;\n    }\n    return -1;\n}`,
        cpp: `int repeatedNTimes(vector<int>& nums) {\n    unordered_set<int> seen;\n    for (int x : nums) {\n        if (seen.count(x)) return x;\n        seen.insert(x);\n    }\n    return -1;\n}`,
        c: `int repeatedNTimes(int* nums, int numsSize) {\n    char* seen = (char*) calloc(10001, sizeof(char));\n    int result = -1;\n    for (int i = 0; i < numsSize; i++) {\n        if (seen[nums[i]]) { result = nums[i]; break; }\n        seen[nums[i]] = 1;\n    }\n    free(seen);\n    return result;\n}`,
        csharp: `public static int RepeatedNTimes(int[] nums)\n{\n    var seen = new HashSet<int>();\n    foreach (int x in nums)\n    {\n        if (!seen.Add(x)) return x;\n    }\n    return -1;\n}`,
        go: `func repeatedNTimes(nums []int) int {\n\tseen := map[int]bool{}\n\tfor _, x := range nums {\n\t\tif seen[x] {\n\t\t\treturn x\n\t\t}\n\t\tseen[x] = true\n\t}\n\treturn -1\n}`,
        kotlin: `fun repeatedNTimes(nums: IntArray): Int {\n    val seen = HashSet<Int>()\n    for (x in nums) {\n        if (!seen.add(x)) return x\n    }\n    return -1\n}`,
        swift: `func repeatedNTimes(_ nums: [Int]) -> Int {\n    var seen = Set<Int>()\n    for x in nums {\n        if seen.contains(x) { return x }\n        seen.insert(x)\n    }\n    return -1\n}`,
        rust: `fn repeatedNTimes(nums: Vec<i32>) -> i32 {\n    use std::collections::HashSet;\n    let mut seen: HashSet<i32> = HashSet::new();\n    for &x in nums.iter() {\n        if !seen.insert(x) {\n            return x;\n        }\n    }\n    -1\n}`,
        php: `function repeatedNTimes($nums) {\n    $seen = array();\n    foreach ($nums as $x) {\n        if (isset($seen[$x])) return $x;\n        $seen[$x] = true;\n    }\n    return -1;\n}`,
        ruby: `def repeatedNTimes(nums)\n  seen = {}\n  nums.each do |x|\n    return x if seen[x]\n    seen[x] = true\n  end\n  -1\nend`,
      },
    };
  })(),

  // ── Rank Transform of an Array (LC 1331) ────────────────────────
  (() => {
    const ref = (arr: number[]) => {
      const sorted = Array.from(new Set(arr)).sort((a, b) => a - b);
      const rank: Record<string, number> = {};
      for (let i = 0; i < sorted.length; i++) rank[String(sorted[i])] = i + 1;
      return arr.map((x) => rank[String(x)]);
    };
    return {
      slug: "rank-transform-of-an-array",
      title: "Rank Transform of an Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Sorting", "LeetCode 1331", "Amazon", "Google"],
      signature: { funcName: "arrayRankTransform", params: [{ name: "arr", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Replace each element of `arr` with its **rank**, where:\n\n- ranks start at 1,\n- a larger element has a larger rank,\n- equal elements share the same rank,\n- ranks are as small as possible.\n\nReturn the transformed array.",
        [
          { in: "arr = [40,10,20,30]", out: "[4,1,2,3]" },
          { in: "arr = [100,100,100]", out: "[1,1,1]", note: "Equal elements share a rank." },
          { in: "arr = [37,12,28,9,100,56,80,5,12]", out: "[5,3,4,2,8,6,7,1,3]" },
        ],
        ["0 <= arr.length <= 100000", "-1000000000 <= arr[i] <= 1000000000"]),
      hints: [
        "Sort the **distinct** values to get the ranking order.",
        "Map each distinct value to its 1-based position in that sorted list.",
        "Then rewrite the original array through the map.",
      ],
      editorial: explain({
        idea: "Deduplicate, sort, and number. \"Ranks as small as possible\" means consecutive integers over the distinct values.",
        steps: [
          "Collect the distinct values and sort them ascending.",
          "Assign rank `i + 1` to the value at index `i`.",
          "Map every element of the original array through that table.",
        ],
        why: "Sorting the distinct values puts them in rank order, and numbering them consecutively from 1 leaves no gaps — which is exactly the minimality requirement. Equal values share one map entry, so they share a rank automatically.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Sorting with duplicates and using the index gives gaps: `[100,100,100]` would become `[1,2,3]`.",
          "An empty array must produce an empty array.",
          "Ranks are 1-based, not 0-based.",
        ],
      }),
      examples: [
        { input: "[40,10,20,30]", expectedOutput: "[4,1,2,3]" },
        { input: "[100,100,100]", expectedOutput: "[1,1,1]" },
        { input: "[37,12,28,9,100,56,80,5,12]", expectedOutput: "[5,3,4,2,8,6,7,1,3]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 0, 25);
        const arr = Array.from({ length: n }, () => ri(rng, -50, 50));
        return { input: fmtIntArr(arr), expectedOutput: fmtIntArr(ref(arr)) };
      },
      solutions: {
        python: `from typing import List\n\ndef arrayRankTransform(arr: List[int]) -> List[int]:\n    rank = {v: i + 1 for i, v in enumerate(sorted(set(arr)))}\n    return [rank[x] for x in arr]`,
        javascript: `var arrayRankTransform = function(arr) {\n    const seen = {};\n    const distinct = [];\n    for (let i = 0; i < arr.length; i++) {\n        const k = String(arr[i]);\n        if (seen[k] !== true) { seen[k] = true; distinct.push(arr[i]); }\n    }\n    distinct.sort(function(a, b) { return a - b; });\n    const rank = {};\n    for (let i = 0; i < distinct.length; i++) rank[String(distinct[i])] = i + 1;\n    const out = [];\n    for (let i = 0; i < arr.length; i++) out.push(rank[String(arr[i])]);\n    return out;\n};`,
        typescript: `function arrayRankTransform(arr: number[]): number[] {\n    var seen: { [key: string]: boolean } = {};\n    var distinct: number[] = [];\n    for (var i = 0; i < arr.length; i++) {\n        var k = String(arr[i]);\n        if (seen[k] !== true) { seen[k] = true; distinct.push(arr[i]); }\n    }\n    distinct.sort(function(a, b) { return a - b; });\n    var rank: { [key: string]: number } = {};\n    for (var j = 0; j < distinct.length; j++) rank[String(distinct[j])] = j + 1;\n    var out: number[] = [];\n    for (var m = 0; m < arr.length; m++) out.push(rank[String(arr[m])]);\n    return out;\n}`,
        java: `public static int[] arrayRankTransform(int[] arr) {\n    int[] sorted = arr.clone();\n    Arrays.sort(sorted);\n    HashMap<Integer, Integer> rank = new HashMap<>();\n    int next = 1;\n    for (int v : sorted) {\n        if (!rank.containsKey(v)) rank.put(v, next++);\n    }\n    int[] out = new int[arr.length];\n    for (int i = 0; i < arr.length; i++) out[i] = rank.get(arr[i]);\n    return out;\n}`,
        cpp: `vector<int> arrayRankTransform(vector<int>& arr) {\n    vector<int> sorted = arr;\n    sort(sorted.begin(), sorted.end());\n    unordered_map<int, int> rank;\n    int next = 1;\n    for (int v : sorted) {\n        if (rank.find(v) == rank.end()) rank[v] = next++;\n    }\n    vector<int> out;\n    for (int x : arr) out.push_back(rank[x]);\n    return out;\n}`,
        c: `static int cmpAscRank(const void* a, const void* b) {\n    int x = *(const int*) a;\n    int y = *(const int*) b;\n    return (x > y) - (x < y);\n}\n\nint* arrayRankTransform(int* arr, int arrSize, int* returnSize) {\n    *returnSize = arrSize;\n    int* out = (int*) malloc((arrSize > 0 ? arrSize : 1) * sizeof(int));\n    if (arrSize == 0) return out;\n    int* sorted = (int*) malloc(arrSize * sizeof(int));\n    for (int i = 0; i < arrSize; i++) sorted[i] = arr[i];\n    qsort(sorted, arrSize, sizeof(int), cmpAscRank);\n    for (int i = 0; i < arrSize; i++) {\n        int lo = 0, hi = arrSize - 1, first = 0;\n        while (lo <= hi) {\n            int mid = lo + (hi - lo) / 2;\n            if (sorted[mid] >= arr[i]) { first = mid; hi = mid - 1; }\n            else lo = mid + 1;\n        }\n        int rank = 1;\n        for (int k = 1; k <= first; k++) {\n            if (sorted[k] != sorted[k - 1]) rank++;\n        }\n        out[i] = rank;\n    }\n    free(sorted);\n    return out;\n}`,
        csharp: `public static int[] ArrayRankTransform(int[] arr)\n{\n    int[] sorted = (int[]) arr.Clone();\n    Array.Sort(sorted);\n    var rank = new Dictionary<int, int>();\n    int next = 1;\n    foreach (int v in sorted)\n    {\n        if (!rank.ContainsKey(v)) rank[v] = next++;\n    }\n    int[] out_ = new int[arr.Length];\n    for (int i = 0; i < arr.Length; i++) out_[i] = rank[arr[i]];\n    return out_;\n}`,
        go: `func arrayRankTransform(arr []int) []int {\n\tsorted := append([]int{}, arr...)\n\tsort.Ints(sorted)\n\trank := map[int]int{}\n\tnext := 1\n\tfor _, v := range sorted {\n\t\tif _, ok := rank[v]; !ok {\n\t\t\trank[v] = next\n\t\t\tnext++\n\t\t}\n\t}\n\tout := make([]int, len(arr))\n\tfor i, x := range arr {\n\t\tout[i] = rank[x]\n\t}\n\treturn out\n}`,
        kotlin: `fun arrayRankTransform(arr: IntArray): IntArray {\n    val sorted = arr.clone()\n    sorted.sort()\n    val rank = HashMap<Int, Int>()\n    var next = 1\n    for (v in sorted) {\n        if (!rank.containsKey(v)) {\n            rank[v] = next\n            next++\n        }\n    }\n    val out = IntArray(arr.size)\n    for (i in arr.indices) out[i] = rank[arr[i]]!!\n    return out\n}`,
        swift: `func arrayRankTransform(_ arr: [Int]) -> [Int] {\n    let sorted = Array(Set(arr)).sorted()\n    var rank: [Int: Int] = [:]\n    for (i, v) in sorted.enumerated() { rank[v] = i + 1 }\n    return arr.map { rank[$0]! }\n}`,
        rust: `fn arrayRankTransform(arr: Vec<i32>) -> Vec<i32> {\n    use std::collections::HashMap;\n    let mut sorted = arr.clone();\n    sorted.sort();\n    sorted.dedup();\n    let mut rank: HashMap<i32, i32> = HashMap::new();\n    for (i, &v) in sorted.iter().enumerate() {\n        rank.insert(v, (i + 1) as i32);\n    }\n    arr.iter().map(|x| rank[x]).collect()\n}`,
        php: `function arrayRankTransform($arr) {\n    $distinct = array_values(array_unique($arr));\n    sort($distinct);\n    $rank = array();\n    foreach ($distinct as $i => $v) $rank[$v] = $i + 1;\n    $out = array();\n    foreach ($arr as $x) $out[] = $rank[$x];\n    return $out;\n}`,
        ruby: `def arrayRankTransform(arr)\n  rank = {}\n  arr.uniq.sort.each_with_index { |v, i| rank[v] = i + 1 }\n  arr.map { |x| rank[x] }\nend`,
      },
    };
  })(),

  // ── Maximum Number of Pairs in Array (LC 2341) ──────────────────
  (() => {
    const ref = (nums: number[]) => {
      const count: Record<string, number> = {};
      for (const x of nums) count[String(x)] = (count[String(x)] || 0) + 1;
      let pairs = 0, left = 0;
      for (const k of Object.keys(count)) {
        pairs += Math.floor(count[k] / 2);
        left += count[k] % 2;
      }
      return [pairs, left];
    };
    return {
      slug: "maximum-number-of-pairs-in-array",
      title: "Maximum Number of Pairs in Array",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Counting", "LeetCode 2341", "Amazon", "TCS"],
      signature: { funcName: "numberOfPairs", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Repeatedly remove **two equal** elements from `nums` and form a pair, until no two equal elements remain.\n\nReturn `[pairs, leftovers]` — the number of pairs formed and the number of elements still in the array.",
        [
          { in: "nums = [1,3,2,1,3,2,2]", out: "[3,1]", note: "Three pairs (1,1), (3,3), (2,2) leave a single 2." },
          { in: "nums = [1,1]", out: "[1,0]" },
          { in: "nums = [0]", out: "[0,1]" },
        ],
        ["1 <= nums.length <= 100", "0 <= nums[i] <= 100"]),
      hints: [
        "Pairs can only form between equal values, so handle each value independently.",
        "A value occurring `c` times contributes `c / 2` pairs and `c % 2` leftovers.",
        "Sum both across all distinct values.",
      ],
      editorial: explain({
        idea: "Pairing never crosses value boundaries, so the array splits into independent groups and each group's answer is a division and a remainder.",
        steps: [
          "Count the occurrences of each value.",
          "Add `count / 2` to the pair total and `count % 2` to the leftover total.",
          "Return both.",
        ],
        why: "Within a group of `c` identical elements, greedy pairing removes two at a time and leaves `c mod 2` behind — and no ordering of removals can do better, since every pair uses exactly two.",
        time: "O(n)",
        space: "O(V)",
        pitfalls: [
          "Computing leftovers as `n - 2 * pairs` also works, but only if `pairs` was summed correctly first.",
          "Simulating the removals is fine here but pointlessly slower.",
        ],
      }),
      examples: [
        { input: "[1,3,2,1,3,2,2]", expectedOutput: "[3,1]" },
        { input: "[1,1]", expectedOutput: "[1,0]" },
        { input: "[0]", expectedOutput: "[0,1]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 30);
        const nums = Array.from({ length: n }, () => ri(rng, 0, rng() < 0.6 ? 5 : 100));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef numberOfPairs(nums: List[int]) -> List[int]:\n    count = {}\n    for x in nums:\n        count[x] = count.get(x, 0) + 1\n    pairs = sum(c // 2 for c in count.values())\n    left = sum(c % 2 for c in count.values())\n    return [pairs, left]`,
        javascript: `var numberOfPairs = function(nums) {\n    const count = new Array(101).fill(0);\n    for (let i = 0; i < nums.length; i++) count[nums[i]]++;\n    let pairs = 0, left = 0;\n    for (let v = 0; v <= 100; v++) {\n        pairs += Math.floor(count[v] / 2);\n        left += count[v] % 2;\n    }\n    return [pairs, left];\n};`,
        typescript: `function numberOfPairs(nums: number[]): number[] {\n    var count: number[] = [];\n    for (var k = 0; k <= 100; k++) count.push(0);\n    for (var i = 0; i < nums.length; i++) count[nums[i]]++;\n    var pairs = 0, left = 0;\n    for (var v = 0; v <= 100; v++) {\n        pairs += Math.floor(count[v] / 2);\n        left += count[v] % 2;\n    }\n    return [pairs, left];\n}`,
        java: `public static int[] numberOfPairs(int[] nums) {\n    int[] count = new int[101];\n    for (int x : nums) count[x]++;\n    int pairs = 0, left = 0;\n    for (int v = 0; v <= 100; v++) {\n        pairs += count[v] / 2;\n        left += count[v] % 2;\n    }\n    return new int[] { pairs, left };\n}`,
        cpp: `vector<int> numberOfPairs(vector<int>& nums) {\n    vector<int> count(101, 0);\n    for (int x : nums) count[x]++;\n    int pairs = 0, left = 0;\n    for (int v = 0; v <= 100; v++) {\n        pairs += count[v] / 2;\n        left += count[v] % 2;\n    }\n    return { pairs, left };\n}`,
        c: `int* numberOfPairs(int* nums, int numsSize, int* returnSize) {\n    int count[101];\n    for (int i = 0; i <= 100; i++) count[i] = 0;\n    for (int i = 0; i < numsSize; i++) count[nums[i]]++;\n    int pairs = 0, left = 0;\n    for (int v = 0; v <= 100; v++) {\n        pairs += count[v] / 2;\n        left += count[v] % 2;\n    }\n    int* out = (int*) malloc(2 * sizeof(int));\n    out[0] = pairs;\n    out[1] = left;\n    *returnSize = 2;\n    return out;\n}`,
        csharp: `public static int[] NumberOfPairs(int[] nums)\n{\n    int[] count = new int[101];\n    foreach (int x in nums) count[x]++;\n    int pairs = 0, left = 0;\n    for (int v = 0; v <= 100; v++)\n    {\n        pairs += count[v] / 2;\n        left += count[v] % 2;\n    }\n    return new int[] { pairs, left };\n}`,
        go: `func numberOfPairs(nums []int) []int {\n\tcount := make([]int, 101)\n\tfor _, x := range nums {\n\t\tcount[x]++\n\t}\n\tpairs, left := 0, 0\n\tfor v := 0; v <= 100; v++ {\n\t\tpairs += count[v] / 2\n\t\tleft += count[v] % 2\n\t}\n\treturn []int{pairs, left}\n}`,
        kotlin: `fun numberOfPairs(nums: IntArray): IntArray {\n    val count = IntArray(101)\n    for (x in nums) count[x]++\n    var pairs = 0\n    var left = 0\n    for (v in 0..100) {\n        pairs += count[v] / 2\n        left += count[v] % 2\n    }\n    return intArrayOf(pairs, left)\n}`,
        swift: `func numberOfPairs(_ nums: [Int]) -> [Int] {\n    var count = [Int](repeating: 0, count: 101)\n    for x in nums { count[x] += 1 }\n    var pairs = 0\n    var left = 0\n    for v in 0...100 {\n        pairs += count[v] / 2\n        left += count[v] % 2\n    }\n    return [pairs, left]\n}`,
        rust: `fn numberOfPairs(nums: Vec<i32>) -> Vec<i32> {\n    let mut count = vec![0i32; 101];\n    for &x in nums.iter() {\n        count[x as usize] += 1;\n    }\n    let mut pairs = 0;\n    let mut left = 0;\n    for v in 0..=100 {\n        pairs += count[v as usize] / 2;\n        left += count[v as usize] % 2;\n    }\n    vec![pairs, left]\n}`,
        php: `function numberOfPairs($nums) {\n    $count = array_fill(0, 101, 0);\n    foreach ($nums as $x) $count[$x]++;\n    $pairs = 0; $left = 0;\n    for ($v = 0; $v <= 100; $v++) {\n        $pairs += intdiv($count[$v], 2);\n        $left += $count[$v] % 2;\n    }\n    return array($pairs, $left);\n}`,
        ruby: `def numberOfPairs(nums)\n  counts = nums.tally.values\n  [counts.sum { |c| c / 2 }, counts.sum { |c| c % 2 }]\nend`,
      },
    };
  })(),

  // ── Largest Positive Integer That Exists With Its Negative (2441)
  (() => {
    const ref = (nums: number[]) => {
      const seen: Record<string, boolean> = {};
      for (const x of nums) seen[String(x)] = true;
      let best = -1;
      for (const x of nums) {
        if (x > best && seen[String(-x)] === true && x > 0) best = x;
      }
      return best;
    };
    return {
      slug: "largest-positive-integer-that-exists-with-its-negative",
      title: "Largest Positive Integer That Exists With Its Negative",
      difficulty: "EASY" as const,
      tags: ["Array", "Hash Table", "Two Pointers", "LeetCode 2441", "Amazon", "Adobe"],
      signature: { funcName: "findMaxK", params: [{ name: "nums", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an integer array `nums` that does not contain `0`, return the **largest positive** integer `k` such that `-k` also appears in the array.\n\nIf no such `k` exists, return `-1`.",
        [
          { in: "nums = [-1,2,-3,3]", out: "3", note: "3 and -3 are both present." },
          { in: "nums = [-1,10,6,7,-7,1]", out: "7", note: "Both 1/-1 and 7/-7 qualify; 7 is larger." },
          { in: "nums = [-10,8,6,7,-2,-3]", out: "-1" },
        ],
        ["1 <= nums.length <= 1000", "-1000 <= nums[i] <= 1000", "nums[i] is never 0."]),
      hints: [
        "Put every value into a set first.",
        "Then scan for positive values whose negation is also in the set.",
        "Keep the largest such value; `-1` if none.",
      ],
      editorial: explain({
        idea: "Membership is the whole question, so a set turns it into a single linear scan.",
        steps: [
          "Insert every value into a set.",
          "Scan the array; for each positive `x`, check whether `-x` is in the set.",
          "Track the maximum qualifying `x`, returning `-1` if none was found.",
        ],
        why: "The set makes each partner lookup O(1), so scanning once considers every candidate. Restricting to positive `x` avoids reporting the negative half of a pair.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Forgetting the `x > 0` guard can return a negative value.",
          "Sorting and two-pointering from both ends also works and uses O(1) extra space.",
          "The array never contains 0, so there is no `k = 0` edge case.",
        ],
      }),
      examples: [
        { input: "[-1,2,-3,3]", expectedOutput: "3" },
        { input: "[-1,10,6,7,-7,1]", expectedOutput: "7" },
        { input: "[-10,8,6,7,-2,-3]", expectedOutput: "-1" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 25);
        const nums: number[] = [];
        for (let i = 0; i < n; i++) {
          let v = ri(rng, -30, 30);
          if (v === 0) v = 1;
          nums.push(v);
        }
        if (rng() < 0.5 && nums.length > 1) {
          const v = Math.abs(nums[0]) || 1;
          nums[0] = v;
          nums[1] = -v;
        }
        return { input: fmtIntArr(nums), expectedOutput: String(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef findMaxK(nums: List[int]) -> int:\n    seen = set(nums)\n    best = -1\n    for x in nums:\n        if x > 0 and -x in seen and x > best:\n            best = x\n    return best`,
        javascript: `var findMaxK = function(nums) {\n    const seen = {};\n    for (let i = 0; i < nums.length; i++) seen[String(nums[i])] = true;\n    let best = -1;\n    for (let i = 0; i < nums.length; i++) {\n        const x = nums[i];\n        if (x > 0 && seen[String(-x)] === true && x > best) best = x;\n    }\n    return best;\n};`,
        typescript: `function findMaxK(nums: number[]): number {\n    var seen: { [key: string]: boolean } = {};\n    for (var i = 0; i < nums.length; i++) seen[String(nums[i])] = true;\n    var best = -1;\n    for (var j = 0; j < nums.length; j++) {\n        var x = nums[j];\n        if (x > 0 && seen[String(-x)] === true && x > best) best = x;\n    }\n    return best;\n}`,
        java: `public static int findMaxK(int[] nums) {\n    HashSet<Integer> seen = new HashSet<>();\n    for (int x : nums) seen.add(x);\n    int best = -1;\n    for (int x : nums) {\n        if (x > 0 && seen.contains(-x) && x > best) best = x;\n    }\n    return best;\n}`,
        cpp: `int findMaxK(vector<int>& nums) {\n    unordered_set<int> seen(nums.begin(), nums.end());\n    int best = -1;\n    for (int x : nums) {\n        if (x > 0 && seen.count(-x) && x > best) best = x;\n    }\n    return best;\n}`,
        c: `int findMaxK(int* nums, int numsSize) {\n    char seen[2001];\n    for (int i = 0; i < 2001; i++) seen[i] = 0;\n    for (int i = 0; i < numsSize; i++) seen[nums[i] + 1000] = 1;\n    int best = -1;\n    for (int i = 0; i < numsSize; i++) {\n        int x = nums[i];\n        if (x > 0 && seen[-x + 1000] && x > best) best = x;\n    }\n    return best;\n}`,
        csharp: `public static int FindMaxK(int[] nums)\n{\n    var seen = new HashSet<int>(nums);\n    int best = -1;\n    foreach (int x in nums)\n    {\n        if (x > 0 && seen.Contains(-x) && x > best) best = x;\n    }\n    return best;\n}`,
        go: `func findMaxK(nums []int) int {\n\tseen := map[int]bool{}\n\tfor _, x := range nums {\n\t\tseen[x] = true\n\t}\n\tbest := -1\n\tfor _, x := range nums {\n\t\tif x > 0 && seen[-x] && x > best {\n\t\t\tbest = x\n\t\t}\n\t}\n\treturn best\n}`,
        kotlin: `fun findMaxK(nums: IntArray): Int {\n    val seen = HashSet<Int>()\n    for (x in nums) seen.add(x)\n    var best = -1\n    for (x in nums) {\n        if (x > 0 && seen.contains(-x) && x > best) best = x\n    }\n    return best\n}`,
        swift: `func findMaxK(_ nums: [Int]) -> Int {\n    let seen = Set(nums)\n    var best = -1\n    for x in nums {\n        if x > 0 && seen.contains(-x) && x > best { best = x }\n    }\n    return best\n}`,
        rust: `fn findMaxK(nums: Vec<i32>) -> i32 {\n    use std::collections::HashSet;\n    let seen: HashSet<i32> = nums.iter().cloned().collect();\n    let mut best = -1;\n    for &x in nums.iter() {\n        if x > 0 && seen.contains(&(-x)) && x > best {\n            best = x;\n        }\n    }\n    best\n}`,
        php: `function findMaxK($nums) {\n    $seen = array();\n    foreach ($nums as $x) $seen[$x] = true;\n    $best = -1;\n    foreach ($nums as $x) {\n        if ($x > 0 && isset($seen[-$x]) && $x > $best) $best = $x;\n    }\n    return $best;\n}`,
        ruby: `def findMaxK(nums)\n  seen = {}\n  nums.each { |x| seen[x] = true }\n  best = -1\n  nums.each do |x|\n    best = x if x > 0 && seen[-x] && x > best\n  end\n  best\nend`,
      },
    };
  })(),

  // ── END HASHING3 ──
];
