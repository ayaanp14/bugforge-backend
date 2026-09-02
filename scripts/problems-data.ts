/**
 * Content pack for the problem catalogue: professional descriptions
 * (examples match the visible test cases), hints, typed signatures for the
 * starter-code generator, and a working solution function per language
 * (used to validate that every language actually runs end-to-end).
 */

import type { Language, Signature } from "./problem-codegen.js";

export interface ProblemContent {
  slug: string;
  description: string;
  hints: string[];
  signature: Signature;
  /** Full solution function per language (drops into the codegen template). */
  solutions: Record<Language, string>;
}

export const PROBLEMS: ProblemContent[] = [
  // ── Two Sum ──────────────────────────────────────────────────────
  {
    slug: "two-sum",
    description: `Given an array of integers \`nums\` and an integer \`target\`, return **indices of the two numbers** such that they add up to \`target\`.

You may assume that each input has **exactly one solution**, and you may not use the same element twice.

Return the indices in ascending order.

### Example 1

\`\`\`
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] == 2 + 7 == 9, so we return [0,1].
\`\`\`

### Example 2

\`\`\`
Input: nums = [3,2,4], target = 6
Output: [1,2]
Explanation: nums[1] + nums[2] == 2 + 4 == 6.
\`\`\`

### Example 3

\`\`\`
Input: nums = [3,3], target = 6
Output: [0,1]
Explanation: The same value may appear twice at different indices.
\`\`\`

### Constraints

- \`2 <= nums.length <= 10^4\`
- \`-10^9 <= nums[i] <= 10^9\`
- \`-10^9 <= target <= 10^9\`
- **Exactly one valid answer exists.**

**Follow-up:** can you find an algorithm that runs in less than \`O(n^2)\` time?`,
    hints: [
      "A brute force approach checks every pair — that is O(n²). Can you trade memory for speed?",
      "While scanning, ask: \"have I already seen the number that completes this one?\" A hash map from value → index answers that in O(1).",
    ],
    signature: {
      funcName: "twoSum",
      params: [
        { name: "nums", type: "int[]" },
        { name: "target", type: "int" },
      ],
      returns: "int[]",
    },
    solutions: {
      javascript: `var twoSum = function(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const need = target - nums[i];
        if (seen.has(need)) return [seen.get(need), i];
        seen.set(nums[i], i);
    }
    return [];
};`,
      python: `from typing import List

def twoSum(nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, v in enumerate(nums):
        if target - v in seen:
            return [seen[target - v], i]
        seen[v] = i
    return []`,
      typescript: `function twoSum(nums: number[], target: number): number[] {
    const seen: { [value: number]: number } = {};
    for (let i = 0; i < nums.length; i++) {
        const need = target - nums[i];
        if (seen[need] !== undefined) return [seen[need], i];
        seen[nums[i]] = i;
    }
    return [];
}`,
      java: `    public static int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int need = target - nums[i];
            if (seen.containsKey(need)) return new int[] { seen.get(need), i };
            seen.put(nums[i], i);
        }
        return new int[0];
    }`,
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        int need = target - nums[i];
        if (seen.count(need)) return { seen[need], i };
        seen[nums[i]] = i;
    }
    return {};
}`,
      c: `int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    int* result = (int*)malloc(2 * sizeof(int));
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                result[0] = i;
                result[1] = j;
                *returnSize = 2;
                return result;
            }
        }
    }
    *returnSize = 0;
    return result;
}`,
      csharp: `    public static int[] TwoSum(int[] nums, int target)
    {
        var seen = new Dictionary<int, int>();
        for (int i = 0; i < nums.Length; i++)
        {
            int need = target - nums[i];
            if (seen.ContainsKey(need)) return new int[] { seen[need], i };
            seen[nums[i]] = i;
        }
        return new int[0];
    }`,
      go: `func twoSum(nums []int, target int) []int {
	seen := map[int]int{}
	for i, v := range nums {
		if j, ok := seen[target-v]; ok {
			return []int{j, i}
		}
		seen[v] = i
	}
	return []int{}
}`,
      kotlin: `fun twoSum(nums: IntArray, target: Int): IntArray {
    val seen = HashMap<Int, Int>()
    for (i in nums.indices) {
        val need = target - nums[i]
        if (seen.containsKey(need)) return intArrayOf(seen[need]!!, i)
        seen[nums[i]] = i
    }
    return intArrayOf()
}`,
      swift: `func twoSum(_ nums: [Int], _ target: Int) -> [Int] {
    var seen: [Int: Int] = [:]
    for (i, v) in nums.enumerated() {
        if let j = seen[target - v] { return [j, i] }
        seen[v] = i
    }
    return []
}`,
      rust: `fn twoSum(nums: Vec<i32>, target: i32) -> Vec<i32> {
    use std::collections::HashMap;
    let mut seen: HashMap<i32, usize> = HashMap::new();
    for (i, v) in nums.iter().enumerate() {
        if let Some(&j) = seen.get(&(target - v)) {
            return vec![j as i32, i as i32];
        }
        seen.insert(*v, i);
    }
    vec![]
}`,
      php: `function twoSum($nums, $target) {
    $seen = [];
    foreach ($nums as $i => $v) {
        $need = $target - $v;
        if (array_key_exists($need, $seen)) return [$seen[$need], $i];
        $seen[$v] = $i;
    }
    return [];
}`,
      ruby: `def twoSum(nums, target)
  seen = {}
  nums.each_with_index do |v, i|
    j = seen[target - v]
    return [j, i] if j
    seen[v] = i
  end
  []
end`,
    },
  },

  // ── Binary Search ────────────────────────────────────────────────
  {
    slug: "binary-search",
    description: `Given a sorted (ascending) array of integers \`nums\` and an integer \`target\`, write a function that searches for \`target\` in \`nums\`. If it exists, return its **index**; otherwise return \`-1\`.

Your algorithm must run in \`O(log n)\` time.

### Example 1

\`\`\`
Input: nums = [-1,0,3,5,9,12], target = 9
Output: 4
Explanation: 9 exists in nums and its index is 4.
\`\`\`

### Example 2

\`\`\`
Input: nums = [-1,0,3,5,9,12], target = 2
Output: -1
Explanation: 2 does not exist in nums, so return -1.
\`\`\`

### Constraints

- \`1 <= nums.length <= 10^4\`
- \`-10^4 < nums[i], target < 10^4\`
- All values in \`nums\` are **unique** and sorted in ascending order.`,
    hints: [
      "The array is sorted — every comparison against the middle element removes half of the remaining range.",
      "Keep two pointers lo and hi; loop while lo <= hi and move the one that excludes the middle.",
    ],
    signature: {
      funcName: "search",
      params: [
        { name: "nums", type: "int[]" },
        { name: "target", type: "int" },
      ],
      returns: "int",
    },
    solutions: {
      javascript: `var search = function(nums, target) {
    let lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
};`,
      python: `from typing import List

def search(nums: List[int], target: int) -> int:
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1`,
      typescript: `function search(nums: number[], target: number): number {
    let lo = 0, hi = nums.length - 1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (nums[mid] === target) return mid;
        if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`,
      java: `    public static int search(int[] nums, int target) {
        int lo = 0, hi = nums.length - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }`,
      cpp: `int search(vector<int>& nums, int target) {
    int lo = 0, hi = (int)nums.size() - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`,
      c: `int search(int* nums, int numsSize, int target) {
    int lo = 0, hi = numsSize - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        if (nums[mid] == target) return mid;
        if (nums[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}`,
      csharp: `    public static int Search(int[] nums, int target)
    {
        int lo = 0, hi = nums.Length - 1;
        while (lo <= hi)
        {
            int mid = (lo + hi) / 2;
            if (nums[mid] == target) return mid;
            if (nums[mid] < target) lo = mid + 1;
            else hi = mid - 1;
        }
        return -1;
    }`,
      go: `func search(nums []int, target int) int {
	lo, hi := 0, len(nums)-1
	for lo <= hi {
		mid := (lo + hi) / 2
		if nums[mid] == target {
			return mid
		}
		if nums[mid] < target {
			lo = mid + 1
		} else {
			hi = mid - 1
		}
	}
	return -1
}`,
      kotlin: `fun search(nums: IntArray, target: Int): Int {
    var lo = 0
    var hi = nums.size - 1
    while (lo <= hi) {
        val mid = (lo + hi) / 2
        if (nums[mid] == target) return mid
        if (nums[mid] < target) lo = mid + 1 else hi = mid - 1
    }
    return -1
}`,
      swift: `func search(_ nums: [Int], _ target: Int) -> Int {
    var lo = 0
    var hi = nums.count - 1
    while lo <= hi {
        let mid = (lo + hi) / 2
        if nums[mid] == target { return mid }
        if nums[mid] < target { lo = mid + 1 } else { hi = mid - 1 }
    }
    return -1
}`,
      rust: `fn search(nums: Vec<i32>, target: i32) -> i32 {
    let mut lo: i64 = 0;
    let mut hi: i64 = nums.len() as i64 - 1;
    while lo <= hi {
        let mid = ((lo + hi) / 2) as usize;
        if nums[mid] == target {
            return mid as i32;
        }
        if nums[mid] < target {
            lo = mid as i64 + 1;
        } else {
            hi = mid as i64 - 1;
        }
    }
    -1
}`,
      php: `function search($nums, $target) {
    $lo = 0;
    $hi = count($nums) - 1;
    while ($lo <= $hi) {
        $mid = intdiv($lo + $hi, 2);
        if ($nums[$mid] == $target) return $mid;
        if ($nums[$mid] < $target) $lo = $mid + 1;
        else $hi = $mid - 1;
    }
    return -1;
}`,
      ruby: `def search(nums, target)
  lo = 0
  hi = nums.length - 1
  while lo <= hi
    mid = (lo + hi) / 2
    return mid if nums[mid] == target
    if nums[mid] < target
      lo = mid + 1
    else
      hi = mid - 1
    end
  end
  -1
end`,
    },
  },

  // ── Climbing Stairs ──────────────────────────────────────────────
  {
    slug: "climbing-stairs",
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can climb either \`1\` or \`2\` steps. In how many **distinct ways** can you climb to the top?

### Example 1

\`\`\`
Input: n = 2
Output: 2
Explanation: There are two ways to climb to the top.
1. 1 step + 1 step
2. 2 steps
\`\`\`

### Example 2

\`\`\`
Input: n = 3
Output: 3
Explanation: There are three ways to climb to the top.
1. 1 step + 1 step + 1 step
2. 1 step + 2 steps
3. 2 steps + 1 step
\`\`\`

### Constraints

- \`1 <= n <= 45\``,
    hints: [
      "To stand on step n you must have arrived from step n-1 or step n-2. So ways(n) = ways(n-1) + ways(n-2).",
      "That recurrence is the Fibonacci sequence — two rolling variables give an O(n) time, O(1) space solution.",
    ],
    signature: {
      funcName: "climbStairs",
      params: [{ name: "n", type: "int" }],
      returns: "int",
    },
    solutions: {
      javascript: `var climbStairs = function(n) {
    let a = 1, b = 1;
    for (let i = 2; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
    }
    return b;
};`,
      python: `def climbStairs(n: int) -> int:
    a, b = 1, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b`,
      typescript: `function climbStairs(n: number): number {
    let a = 1, b = 1;
    for (let i = 2; i <= n; i++) {
        const c = a + b;
        a = b;
        b = c;
    }
    return b;
}`,
      java: `    public static int climbStairs(int n) {
        int a = 1, b = 1;
        for (int i = 2; i <= n; i++) {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }`,
      cpp: `int climbStairs(int n) {
    int a = 1, b = 1;
    for (int i = 2; i <= n; i++) {
        int c = a + b;
        a = b;
        b = c;
    }
    return b;
}`,
      c: `int climbStairs(int n) {
    int a = 1, b = 1;
    for (int i = 2; i <= n; i++) {
        int c = a + b;
        a = b;
        b = c;
    }
    return b;
}`,
      csharp: `    public static int ClimbStairs(int n)
    {
        int a = 1, b = 1;
        for (int i = 2; i <= n; i++)
        {
            int c = a + b;
            a = b;
            b = c;
        }
        return b;
    }`,
      go: `func climbStairs(n int) int {
	a, b := 1, 1
	for i := 2; i <= n; i++ {
		a, b = b, a+b
	}
	return b
}`,
      kotlin: `fun climbStairs(n: Int): Int {
    var a = 1
    var b = 1
    for (i in 2..n) {
        val c = a + b
        a = b
        b = c
    }
    return b
}`,
      swift: `func climbStairs(_ n: Int) -> Int {
    var a = 1
    var b = 1
    if n >= 2 {
        for _ in 2...n {
            let c = a + b
            a = b
            b = c
        }
    }
    return b
}`,
      rust: `fn climbStairs(n: i32) -> i32 {
    let mut a: i64 = 1;
    let mut b: i64 = 1;
    for _ in 2..=n {
        let c = a + b;
        a = b;
        b = c;
    }
    b as i32
}`,
      php: `function climbStairs($n) {
    $a = 1;
    $b = 1;
    for ($i = 2; $i <= $n; $i++) {
        $c = $a + $b;
        $a = $b;
        $b = $c;
    }
    return $b;
}`,
      ruby: `def climbStairs(n)
  a = 1
  b = 1
  (2..n).each do
    a, b = b, a + b
  end
  b
end`,
    },
  },

  // ── Contains Duplicate ───────────────────────────────────────────
  {
    slug: "contains-duplicate",
    description: `Given an integer array \`nums\`, return \`true\` if any value appears **at least twice**, and \`false\` if every element is distinct.

### Example 1

\`\`\`
Input: nums = [1,2,3,1]
Output: true
Explanation: The value 1 appears at indices 0 and 3.
\`\`\`

### Example 2

\`\`\`
Input: nums = [1,2,3,4]
Output: false
Explanation: All elements are distinct.
\`\`\`

### Example 3

\`\`\`
Input: nums = [1,1,1,3,3,4,3,2,4,2]
Output: true
\`\`\`

### Constraints

- \`1 <= nums.length <= 10^5\`
- \`-10^9 <= nums[i] <= 10^9\``,
    hints: [
      "Sorting brings duplicates next to each other — that is O(n log n).",
      "A hash set gives O(n): as you scan, if an element is already in the set you are done.",
    ],
    signature: {
      funcName: "containsDuplicate",
      params: [{ name: "nums", type: "int[]" }],
      returns: "bool",
    },
    solutions: {
      javascript: `var containsDuplicate = function(nums) {
    return new Set(nums).size !== nums.length;
};`,
      python: `from typing import List

def containsDuplicate(nums: List[int]) -> bool:
    return len(set(nums)) != len(nums)`,
      typescript: `function containsDuplicate(nums: number[]): boolean {
    const seen: { [value: number]: boolean } = {};
    for (let i = 0; i < nums.length; i++) {
        if (seen[nums[i]]) return true;
        seen[nums[i]] = true;
    }
    return false;
}`,
      java: `    public static boolean containsDuplicate(int[] nums) {
        Set<Integer> seen = new HashSet<>();
        for (int v : nums) {
            if (!seen.add(v)) return true;
        }
        return false;
    }`,
      cpp: `bool containsDuplicate(vector<int>& nums) {
    unordered_set<int> seen;
    for (int v : nums) {
        if (seen.count(v)) return true;
        seen.insert(v);
    }
    return false;
}`,
      c: `int cmp_int(const void* a, const void* b) {
    int x = *(const int*)a, y = *(const int*)b;
    return (x > y) - (x < y);
}

bool containsDuplicate(int* nums, int numsSize) {
    qsort(nums, numsSize, sizeof(int), cmp_int);
    for (int i = 1; i < numsSize; i++) {
        if (nums[i] == nums[i - 1]) return true;
    }
    return false;
}`,
      csharp: `    public static bool ContainsDuplicate(int[] nums)
    {
        var seen = new HashSet<int>();
        foreach (int v in nums)
        {
            if (!seen.Add(v)) return true;
        }
        return false;
    }`,
      go: `func containsDuplicate(nums []int) bool {
	seen := map[int]bool{}
	for _, v := range nums {
		if seen[v] {
			return true
		}
		seen[v] = true
	}
	return false
}`,
      kotlin: `fun containsDuplicate(nums: IntArray): Boolean {
    val seen = HashSet<Int>()
    for (v in nums) {
        if (!seen.add(v)) return true
    }
    return false
}`,
      swift: `func containsDuplicate(_ nums: [Int]) -> Bool {
    return Set(nums).count != nums.count
}`,
      rust: `fn containsDuplicate(nums: Vec<i32>) -> bool {
    use std::collections::HashSet;
    let mut seen = HashSet::new();
    for v in nums {
        if !seen.insert(v) {
            return true;
        }
    }
    false
}`,
      php: `function containsDuplicate($nums) {
    return count(array_unique($nums)) != count($nums);
}`,
      ruby: `def containsDuplicate(nums)
  nums.uniq.length != nums.length
end`,
    },
  },

  // ── Fizz Buzz ────────────────────────────────────────────────────
  {
    slug: "fizz-buzz",
    description: `Given an integer \`n\`, return a string array \`answer\` (**1-indexed**) where:

- \`answer[i] == "FizzBuzz"\` if \`i\` is divisible by **3 and 5**.
- \`answer[i] == "Fizz"\` if \`i\` is divisible by **3**.
- \`answer[i] == "Buzz"\` if \`i\` is divisible by **5**.
- \`answer[i] == i\` (as a string) otherwise.

### Example 1

\`\`\`
Input: n = 3
Output: ["1","2","Fizz"]
\`\`\`

### Example 2

\`\`\`
Input: n = 5
Output: ["1","2","Fizz","4","Buzz"]
\`\`\`

### Example 3

\`\`\`
Input: n = 15
Output: ["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]
\`\`\`

### Constraints

- \`1 <= n <= 10^4\``,
    hints: [
      "Check divisibility by 15 first (or by both 3 and 5) — otherwise \"Fizz\" or \"Buzz\" will shadow \"FizzBuzz\".",
      "Building the string by concatenating \"Fizz\" then \"Buzz\" when each divides avoids the 15 case entirely.",
    ],
    signature: {
      funcName: "fizzBuzz",
      params: [{ name: "n", type: "int" }],
      returns: "string[]",
    },
    solutions: {
      javascript: `var fizzBuzz = function(n) {
    const answer = [];
    for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) answer.push("FizzBuzz");
        else if (i % 3 === 0) answer.push("Fizz");
        else if (i % 5 === 0) answer.push("Buzz");
        else answer.push(String(i));
    }
    return answer;
};`,
      python: `from typing import List

def fizzBuzz(n: int) -> List[str]:
    answer = []
    for i in range(1, n + 1):
        if i % 15 == 0:
            answer.append("FizzBuzz")
        elif i % 3 == 0:
            answer.append("Fizz")
        elif i % 5 == 0:
            answer.append("Buzz")
        else:
            answer.append(str(i))
    return answer`,
      typescript: `function fizzBuzz(n: number): string[] {
    const answer: string[] = [];
    for (let i = 1; i <= n; i++) {
        if (i % 15 === 0) answer.push("FizzBuzz");
        else if (i % 3 === 0) answer.push("Fizz");
        else if (i % 5 === 0) answer.push("Buzz");
        else answer.push(String(i));
    }
    return answer;
}`,
      java: `    public static String[] fizzBuzz(int n) {
        String[] answer = new String[n];
        for (int i = 1; i <= n; i++) {
            if (i % 15 == 0) answer[i - 1] = "FizzBuzz";
            else if (i % 3 == 0) answer[i - 1] = "Fizz";
            else if (i % 5 == 0) answer[i - 1] = "Buzz";
            else answer[i - 1] = String.valueOf(i);
        }
        return answer;
    }`,
      cpp: `vector<string> fizzBuzz(int n) {
    vector<string> answer;
    for (int i = 1; i <= n; i++) {
        if (i % 15 == 0) answer.push_back("FizzBuzz");
        else if (i % 3 == 0) answer.push_back("Fizz");
        else if (i % 5 == 0) answer.push_back("Buzz");
        else answer.push_back(to_string(i));
    }
    return answer;
}`,
      c: `char** fizzBuzz(int n, int* returnSize) {
    char** answer = (char**)malloc(n * sizeof(char*));
    for (int i = 1; i <= n; i++) {
        char* item = (char*)malloc(16);
        if (i % 15 == 0) strcpy(item, "FizzBuzz");
        else if (i % 3 == 0) strcpy(item, "Fizz");
        else if (i % 5 == 0) strcpy(item, "Buzz");
        else sprintf(item, "%d", i);
        answer[i - 1] = item;
    }
    *returnSize = n;
    return answer;
}`,
      csharp: `    public static string[] FizzBuzz(int n)
    {
        var answer = new string[n];
        for (int i = 1; i <= n; i++)
        {
            if (i % 15 == 0) answer[i - 1] = "FizzBuzz";
            else if (i % 3 == 0) answer[i - 1] = "Fizz";
            else if (i % 5 == 0) answer[i - 1] = "Buzz";
            else answer[i - 1] = i.ToString();
        }
        return answer;
    }`,
      go: `func fizzBuzz(n int) []string {
	answer := make([]string, 0, n)
	for i := 1; i <= n; i++ {
		if i%15 == 0 {
			answer = append(answer, "FizzBuzz")
		} else if i%3 == 0 {
			answer = append(answer, "Fizz")
		} else if i%5 == 0 {
			answer = append(answer, "Buzz")
		} else {
			answer = append(answer, strconv.Itoa(i))
		}
	}
	return answer
}`,
      kotlin: `fun fizzBuzz(n: Int): Array<String> {
    return Array(n) { idx ->
        val i = idx + 1
        when {
            i % 15 == 0 -> "FizzBuzz"
            i % 3 == 0 -> "Fizz"
            i % 5 == 0 -> "Buzz"
            else -> i.toString()
        }
    }
}`,
      swift: `func fizzBuzz(_ n: Int) -> [String] {
    var answer: [String] = []
    for i in 1...n {
        if i % 15 == 0 { answer.append("FizzBuzz") }
        else if i % 3 == 0 { answer.append("Fizz") }
        else if i % 5 == 0 { answer.append("Buzz") }
        else { answer.append(String(i)) }
    }
    return answer
}`,
      rust: `fn fizzBuzz(n: i32) -> Vec<String> {
    let mut answer = Vec::new();
    for i in 1..=n {
        if i % 15 == 0 {
            answer.push("FizzBuzz".to_string());
        } else if i % 3 == 0 {
            answer.push("Fizz".to_string());
        } else if i % 5 == 0 {
            answer.push("Buzz".to_string());
        } else {
            answer.push(i.to_string());
        }
    }
    answer
}`,
      php: `function fizzBuzz($n) {
    $answer = [];
    for ($i = 1; $i <= $n; $i++) {
        if ($i % 15 == 0) $answer[] = "FizzBuzz";
        elseif ($i % 3 == 0) $answer[] = "Fizz";
        elseif ($i % 5 == 0) $answer[] = "Buzz";
        else $answer[] = strval($i);
    }
    return $answer;
}`,
      ruby: `def fizzBuzz(n)
  (1..n).map do |i|
    if i % 15 == 0
      "FizzBuzz"
    elsif i % 3 == 0
      "Fizz"
    elsif i % 5 == 0
      "Buzz"
    else
      i.to_s
    end
  end
end`,
    },
  },

  // ── Maximum Subarray ─────────────────────────────────────────────
  {
    slug: "maximum-subarray",
    description: `Given an integer array \`nums\`, find the **subarray** with the largest sum, and return *its sum*.

A subarray is a contiguous non-empty sequence of elements within an array.

### Example 1

\`\`\`
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.
\`\`\`

### Example 2

\`\`\`
Input: nums = [1]
Output: 1
Explanation: The subarray [1] has the largest sum 1.
\`\`\`

### Example 3

\`\`\`
Input: nums = [5,4,-1,7,8]
Output: 23
Explanation: The whole array has the largest sum 23.
\`\`\`

### Constraints

- \`1 <= nums.length <= 10^5\`
- \`-10^4 <= nums[i] <= 10^4\`

**Follow-up:** if you have an \`O(n)\` solution, try the divide-and-conquer approach, which is more subtle.`,
    hints: [
      "At each position ask: is it better to extend the best subarray ending just before me, or to start fresh here?",
      "That is Kadane's algorithm: current = max(v, current + v); best = max(best, current). One pass, O(1) space.",
    ],
    signature: {
      funcName: "maxSubArray",
      params: [{ name: "nums", type: "int[]" }],
      returns: "int",
    },
    solutions: {
      javascript: `var maxSubArray = function(nums) {
    let best = nums[0], current = nums[0];
    for (let i = 1; i < nums.length; i++) {
        current = Math.max(nums[i], current + nums[i]);
        best = Math.max(best, current);
    }
    return best;
};`,
      python: `from typing import List

def maxSubArray(nums: List[int]) -> int:
    best = current = nums[0]
    for v in nums[1:]:
        current = max(v, current + v)
        best = max(best, current)
    return best`,
      typescript: `function maxSubArray(nums: number[]): number {
    let best = nums[0], current = nums[0];
    for (let i = 1; i < nums.length; i++) {
        current = Math.max(nums[i], current + nums[i]);
        best = Math.max(best, current);
    }
    return best;
}`,
      java: `    public static int maxSubArray(int[] nums) {
        int best = nums[0], current = nums[0];
        for (int i = 1; i < nums.length; i++) {
            current = Math.max(nums[i], current + nums[i]);
            best = Math.max(best, current);
        }
        return best;
    }`,
      cpp: `int maxSubArray(vector<int>& nums) {
    int best = nums[0], current = nums[0];
    for (int i = 1; i < (int)nums.size(); i++) {
        current = max(nums[i], current + nums[i]);
        best = max(best, current);
    }
    return best;
}`,
      c: `int maxSubArray(int* nums, int numsSize) {
    int best = nums[0], current = nums[0];
    for (int i = 1; i < numsSize; i++) {
        current = nums[i] > current + nums[i] ? nums[i] : current + nums[i];
        best = best > current ? best : current;
    }
    return best;
}`,
      csharp: `    public static int MaxSubArray(int[] nums)
    {
        int best = nums[0], current = nums[0];
        for (int i = 1; i < nums.Length; i++)
        {
            current = Math.Max(nums[i], current + nums[i]);
            best = Math.Max(best, current);
        }
        return best;
    }`,
      go: `func maxSubArray(nums []int) int {
	best, current := nums[0], nums[0]
	for _, v := range nums[1:] {
		if current+v > v {
			current = current + v
		} else {
			current = v
		}
		if current > best {
			best = current
		}
	}
	return best
}`,
      kotlin: `fun maxSubArray(nums: IntArray): Int {
    var best = nums[0]
    var current = nums[0]
    for (i in 1 until nums.size) {
        current = maxOf(nums[i], current + nums[i])
        best = maxOf(best, current)
    }
    return best
}`,
      swift: `func maxSubArray(_ nums: [Int]) -> Int {
    var best = nums[0]
    var current = nums[0]
    for v in nums.dropFirst() {
        current = max(v, current + v)
        best = max(best, current)
    }
    return best
}`,
      rust: `fn maxSubArray(nums: Vec<i32>) -> i32 {
    let mut best = nums[0];
    let mut current = nums[0];
    for &v in nums.iter().skip(1) {
        current = v.max(current + v);
        best = best.max(current);
    }
    best
}`,
      php: `function maxSubArray($nums) {
    $best = $nums[0];
    $current = $nums[0];
    for ($i = 1; $i < count($nums); $i++) {
        $current = max($nums[$i], $current + $nums[$i]);
        $best = max($best, $current);
    }
    return $best;
}`,
      ruby: `def maxSubArray(nums)
  best = nums[0]
  current = nums[0]
  nums[1..].each do |v|
    current = [v, current + v].max
    best = [best, current].max
  end
  best
end`,
    },
  },

  // ── Palindrome Number ────────────────────────────────────────────
  {
    slug: "palindrome-number",
    description: `Given an integer \`x\`, return \`true\` if \`x\` is a **palindrome**, and \`false\` otherwise.

An integer is a palindrome when it reads the same forward and backward. For example, \`121\` is a palindrome while \`123\` is not.

### Example 1

\`\`\`
Input: x = 121
Output: true
Explanation: 121 reads as 121 from left to right and from right to left.
\`\`\`

### Example 2

\`\`\`
Input: x = -121
Output: false
Explanation: From left to right it reads -121. From right to left it becomes 121-. Therefore it is not a palindrome.
\`\`\`

### Example 3

\`\`\`
Input: x = 10
Output: false
Explanation: Reads 01 from right to left.
\`\`\`

### Constraints

- \`-2^31 <= x <= 2^31 - 1\`

**Follow-up:** can you solve it without converting the integer to a string?`,
    hints: [
      "Every negative number fails immediately — the minus sign never matches.",
      "Build the reversed number with digit math (rev = rev * 10 + x % 10) and compare it to the original.",
    ],
    signature: {
      funcName: "isPalindrome",
      params: [{ name: "x", type: "int" }],
      returns: "bool",
    },
    solutions: {
      javascript: `var isPalindrome = function(x) {
    if (x < 0) return false;
    let rev = 0, n = x;
    while (n > 0) {
        rev = rev * 10 + (n % 10);
        n = Math.floor(n / 10);
    }
    return rev === x;
};`,
      python: `def isPalindrome(x: int) -> bool:
    if x < 0:
        return False
    rev, n = 0, x
    while n > 0:
        rev = rev * 10 + n % 10
        n //= 10
    return rev == x`,
      typescript: `function isPalindrome(x: number): boolean {
    if (x < 0) return false;
    let rev = 0, n = x;
    while (n > 0) {
        rev = rev * 10 + (n % 10);
        n = Math.floor(n / 10);
    }
    return rev === x;
}`,
      java: `    public static boolean isPalindrome(int x) {
        if (x < 0) return false;
        long rev = 0;
        int n = x;
        while (n > 0) {
            rev = rev * 10 + n % 10;
            n /= 10;
        }
        return rev == x;
    }`,
      cpp: `bool isPalindrome(int x) {
    if (x < 0) return false;
    long long rev = 0;
    int n = x;
    while (n > 0) {
        rev = rev * 10 + n % 10;
        n /= 10;
    }
    return rev == x;
}`,
      c: `bool isPalindrome(int x) {
    if (x < 0) return false;
    long long rev = 0;
    int n = x;
    while (n > 0) {
        rev = rev * 10 + n % 10;
        n /= 10;
    }
    return rev == x;
}`,
      csharp: `    public static bool IsPalindrome(int x)
    {
        if (x < 0) return false;
        long rev = 0;
        int n = x;
        while (n > 0)
        {
            rev = rev * 10 + n % 10;
            n /= 10;
        }
        return rev == x;
    }`,
      go: `func isPalindrome(x int) bool {
	if x < 0 {
		return false
	}
	rev, n := 0, x
	for n > 0 {
		rev = rev*10 + n%10
		n /= 10
	}
	return rev == x
}`,
      kotlin: `fun isPalindrome(x: Int): Boolean {
    if (x < 0) return false
    var rev = 0L
    var n = x
    while (n > 0) {
        rev = rev * 10 + n % 10
        n /= 10
    }
    return rev == x.toLong()
}`,
      swift: `func isPalindrome(_ x: Int) -> Bool {
    if x < 0 { return false }
    var rev = 0
    var n = x
    while n > 0 {
        rev = rev * 10 + n % 10
        n /= 10
    }
    return rev == x
}`,
      rust: `fn isPalindrome(x: i32) -> bool {
    if x < 0 {
        return false;
    }
    let mut rev: i64 = 0;
    let mut n = x as i64;
    while n > 0 {
        rev = rev * 10 + n % 10;
        n /= 10;
    }
    rev == x as i64
}`,
      php: `function isPalindrome($x) {
    if ($x < 0) return false;
    $rev = 0;
    $n = $x;
    while ($n > 0) {
        $rev = $rev * 10 + $n % 10;
        $n = intdiv($n, 10);
    }
    return $rev == $x;
}`,
      ruby: `def isPalindrome(x)
  return false if x < 0
  rev = 0
  n = x
  while n > 0
    rev = rev * 10 + n % 10
    n /= 10
  end
  rev == x
end`,
    },
  },

  // ── Reverse String ───────────────────────────────────────────────
  {
    slug: "reverse-string",
    description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

Reverse the array **in place** with \`O(1)\` extra memory, then return it.

### Example 1

\`\`\`
Input: s = ["h","e","l","l","o"]
Output: ["o","l","l","e","h"]
\`\`\`

### Example 2

\`\`\`
Input: s = ["H","a","n","n","a","h"]
Output: ["h","a","n","n","a","H"]
\`\`\`

### Constraints

- \`0 <= s.length <= 10^5\`
- \`s[i]\` is a printable ASCII character.`,
    hints: [
      "Two pointers: one at each end. Swap and walk them toward the middle.",
      "Stop when the pointers meet — every element has then been swapped exactly once.",
    ],
    signature: {
      funcName: "reverseString",
      params: [{ name: "s", type: "string[]" }],
      returns: "string[]",
    },
    solutions: {
      javascript: `var reverseString = function(s) {
    let i = 0, j = s.length - 1;
    while (i < j) {
        const tmp = s[i];
        s[i] = s[j];
        s[j] = tmp;
        i++;
        j--;
    }
    return s;
};`,
      python: `from typing import List

def reverseString(s: List[str]) -> List[str]:
    i, j = 0, len(s) - 1
    while i < j:
        s[i], s[j] = s[j], s[i]
        i += 1
        j -= 1
    return s`,
      typescript: `function reverseString(s: string[]): string[] {
    let i = 0, j = s.length - 1;
    while (i < j) {
        const tmp = s[i];
        s[i] = s[j];
        s[j] = tmp;
        i++;
        j--;
    }
    return s;
}`,
      java: `    public static String[] reverseString(String[] s) {
        int i = 0, j = s.length - 1;
        while (i < j) {
            String tmp = s[i];
            s[i] = s[j];
            s[j] = tmp;
            i++;
            j--;
        }
        return s;
    }`,
      cpp: `vector<string> reverseString(vector<string>& s) {
    int i = 0, j = (int)s.size() - 1;
    while (i < j) {
        swap(s[i], s[j]);
        i++;
        j--;
    }
    return s;
}`,
      c: `char** reverseString(char** s, int sSize, int* returnSize) {
    int i = 0, j = sSize - 1;
    while (i < j) {
        char* tmp = s[i];
        s[i] = s[j];
        s[j] = tmp;
        i++;
        j--;
    }
    *returnSize = sSize;
    return s;
}`,
      csharp: `    public static string[] ReverseString(string[] s)
    {
        int i = 0, j = s.Length - 1;
        while (i < j)
        {
            string tmp = s[i];
            s[i] = s[j];
            s[j] = tmp;
            i++;
            j--;
        }
        return s;
    }`,
      go: `func reverseString(s []string) []string {
	i, j := 0, len(s)-1
	for i < j {
		s[i], s[j] = s[j], s[i]
		i++
		j--
	}
	return s
}`,
      kotlin: `fun reverseString(s: Array<String>): Array<String> {
    var i = 0
    var j = s.size - 1
    while (i < j) {
        val tmp = s[i]
        s[i] = s[j]
        s[j] = tmp
        i++
        j--
    }
    return s
}`,
      swift: `func reverseString(_ s: [String]) -> [String] {
    var arr = s
    var i = 0
    var j = arr.count - 1
    while i < j {
        arr.swapAt(i, j)
        i += 1
        j -= 1
    }
    return arr
}`,
      rust: `fn reverseString(mut s: Vec<String>) -> Vec<String> {
    s.reverse();
    s
}`,
      php: `function reverseString($s) {
    $i = 0;
    $j = count($s) - 1;
    while ($i < $j) {
        $tmp = $s[$i];
        $s[$i] = $s[$j];
        $s[$j] = $tmp;
        $i++;
        $j--;
    }
    return $s;
}`,
      ruby: `def reverseString(s)
  i = 0
  j = s.length - 1
  while i < j
    s[i], s[j] = s[j], s[i]
    i += 1
    j -= 1
  end
  s
end`,
    },
  },

  // ── Valid Anagram ────────────────────────────────────────────────
  {
    slug: "valid-anagram",
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an **anagram** of \`s\`, and \`false\` otherwise.

An anagram is a word or phrase formed by rearranging the letters of another, using all the original letters exactly once.

### Example 1

\`\`\`
Input: s = "anagram", t = "nagaram"
Output: true
\`\`\`

### Example 2

\`\`\`
Input: s = "rat", t = "car"
Output: false
\`\`\`

### Constraints

- \`1 <= s.length, t.length <= 5 * 10^4\`
- \`s\` and \`t\` consist of lowercase English letters.

**Follow-up:** what if the inputs contain Unicode characters?`,
    hints: [
      "Two strings of different length can never be anagrams — check that first.",
      "Either sort both strings and compare, or count each character's frequency in s and subtract while scanning t.",
    ],
    signature: {
      funcName: "isAnagram",
      params: [
        { name: "s", type: "string" },
        { name: "t", type: "string" },
      ],
      returns: "bool",
    },
    solutions: {
      javascript: `var isAnagram = function(s, t) {
    if (s.length !== t.length) return false;
    return s.split("").sort().join("") === t.split("").sort().join("");
};`,
      python: `def isAnagram(s: str, t: str) -> bool:
    return sorted(s) == sorted(t)`,
      typescript: `function isAnagram(s: string, t: string): boolean {
    if (s.length !== t.length) return false;
    return s.split("").sort().join("") === t.split("").sort().join("");
}`,
      java: `    public static boolean isAnagram(String s, String t) {
        if (s.length() != t.length()) return false;
        char[] a = s.toCharArray();
        char[] b = t.toCharArray();
        Arrays.sort(a);
        Arrays.sort(b);
        return Arrays.equals(a, b);
    }`,
      cpp: `bool isAnagram(string s, string t) {
    if (s.size() != t.size()) return false;
    sort(s.begin(), s.end());
    sort(t.begin(), t.end());
    return s == t;
}`,
      c: `bool isAnagram(const char* s, const char* t) {
    int counts[256] = {0};
    size_t ls = strlen(s), lt = strlen(t);
    if (ls != lt) return false;
    for (size_t i = 0; i < ls; i++) counts[(unsigned char)s[i]]++;
    for (size_t i = 0; i < lt; i++) counts[(unsigned char)t[i]]--;
    for (int i = 0; i < 256; i++) {
        if (counts[i] != 0) return false;
    }
    return true;
}`,
      csharp: `    public static bool IsAnagram(string s, string t)
    {
        if (s.Length != t.Length) return false;
        return string.Concat(s.OrderBy(c => c)) == string.Concat(t.OrderBy(c => c));
    }`,
      go: `func isAnagram(s string, t string) bool {
	if len(s) != len(t) {
		return false
	}
	var counts [256]int
	for i := 0; i < len(s); i++ {
		counts[s[i]]++
		counts[t[i]]--
	}
	for _, c := range counts {
		if c != 0 {
			return false
		}
	}
	return true
}`,
      kotlin: `fun isAnagram(s: String, t: String): Boolean {
    if (s.length != t.length) return false
    return s.toCharArray().sorted() == t.toCharArray().sorted()
}`,
      swift: `func isAnagram(_ s: String, _ t: String) -> Bool {
    return s.sorted() == t.sorted()
}`,
      rust: `fn isAnagram(s: String, t: String) -> bool {
    if s.len() != t.len() {
        return false;
    }
    let mut a: Vec<char> = s.chars().collect();
    let mut b: Vec<char> = t.chars().collect();
    a.sort();
    b.sort();
    a == b
}`,
      php: `function isAnagram($s, $t) {
    if (strlen($s) != strlen($t)) return false;
    $a = str_split($s);
    $b = str_split($t);
    sort($a);
    sort($b);
    return $a == $b;
}`,
      ruby: `def isAnagram(s, t)
  s.chars.sort == t.chars.sort
end`,
    },
  },

  // ── Valid Parentheses ────────────────────────────────────────────
  {
    slug: "valid-parentheses",
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is **valid**.

An input string is valid if:

1. Open brackets are closed by the same type of brackets.
2. Open brackets are closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Example 1

\`\`\`
Input: s = "()"
Output: true
\`\`\`

### Example 2

\`\`\`
Input: s = "()[]{}"
Output: true
\`\`\`

### Example 3

\`\`\`
Input: s = "(]"
Output: false
Explanation: '(' is closed by ']', which is the wrong type.
\`\`\`

### Constraints

- \`1 <= s.length <= 10^4\`
- \`s\` consists of parentheses characters only: \`'()[]{}'\`.`,
    hints: [
      "The most recently opened bracket must be the first one closed — that is exactly a stack's behavior.",
      "Push every opener; on a closer, pop and check it matches. The string is valid only if the stack ends empty.",
    ],
    signature: {
      funcName: "isValid",
      params: [{ name: "s", type: "string" }],
      returns: "bool",
    },
    solutions: {
      javascript: `var isValid = function(s) {
    const pairs = { ")": "(", "]": "[", "}": "{" };
    const stack = [];
    for (const ch of s) {
        if (ch === "(" || ch === "[" || ch === "{") stack.push(ch);
        else if (stack.pop() !== pairs[ch]) return false;
    }
    return stack.length === 0;
};`,
      python: `def isValid(s: str) -> bool:
    pairs = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif not stack or stack.pop() != pairs[ch]:
            return False
    return not stack`,
      typescript: `function isValid(s: string): boolean {
    const pairs: { [c: string]: string } = { ")": "(", "]": "[", "}": "{" };
    const stack: string[] = [];
    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === "(" || ch === "[" || ch === "{") stack.push(ch);
        else if (stack.pop() !== pairs[ch]) return false;
    }
    return stack.length === 0;
}`,
      java: `    public static boolean isValid(String s) {
        Deque<Character> stack = new ArrayDeque<>();
        for (char ch : s.toCharArray()) {
            if (ch == '(' || ch == '[' || ch == '{') {
                stack.push(ch);
            } else {
                if (stack.isEmpty()) return false;
                char open = stack.pop();
                if ((ch == ')' && open != '(') || (ch == ']' && open != '[') || (ch == '}' && open != '{')) return false;
            }
        }
        return stack.isEmpty();
    }`,
      cpp: `bool isValid(string s) {
    stack<char> st;
    for (char ch : s) {
        if (ch == '(' || ch == '[' || ch == '{') {
            st.push(ch);
        } else {
            if (st.empty()) return false;
            char open = st.top();
            st.pop();
            if ((ch == ')' && open != '(') || (ch == ']' && open != '[') || (ch == '}' && open != '{')) return false;
        }
    }
    return st.empty();
}`,
      c: `bool isValid(const char* s) {
    size_t len = strlen(s);
    char* stack = (char*)malloc(len + 1);
    int top = 0;
    for (size_t i = 0; i < len; i++) {
        char ch = s[i];
        if (ch == '(' || ch == '[' || ch == '{') {
            stack[top++] = ch;
        } else {
            if (top == 0) { free(stack); return false; }
            char open = stack[--top];
            if ((ch == ')' && open != '(') || (ch == ']' && open != '[') || (ch == '}' && open != '{')) {
                free(stack);
                return false;
            }
        }
    }
    bool ok = top == 0;
    free(stack);
    return ok;
}`,
      csharp: `    public static bool IsValid(string s)
    {
        var stack = new Stack<char>();
        foreach (char ch in s)
        {
            if (ch == '(' || ch == '[' || ch == '{')
            {
                stack.Push(ch);
            }
            else
            {
                if (stack.Count == 0) return false;
                char open = stack.Pop();
                if ((ch == ')' && open != '(') || (ch == ']' && open != '[') || (ch == '}' && open != '{')) return false;
            }
        }
        return stack.Count == 0;
    }`,
      go: `func isValid(s string) bool {
	stack := []byte{}
	for i := 0; i < len(s); i++ {
		ch := s[i]
		if ch == '(' || ch == '[' || ch == '{' {
			stack = append(stack, ch)
		} else {
			if len(stack) == 0 {
				return false
			}
			open := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			if (ch == ')' && open != '(') || (ch == ']' && open != '[') || (ch == '}' && open != '{') {
				return false
			}
		}
	}
	return len(stack) == 0
}`,
      kotlin: `fun isValid(s: String): Boolean {
    val stack = mutableListOf<Char>()
    for (ch in s) {
        when (ch) {
            '(', '[', '{' -> stack.add(ch)
            else -> {
                if (stack.isEmpty()) return false
                val open = stack.removeAt(stack.size - 1)
                if ((ch == ')' && open != '(') || (ch == ']' && open != '[') || (ch == '}' && open != '{')) return false
            }
        }
    }
    return stack.isEmpty()
}`,
      swift: `func isValid(_ s: String) -> Bool {
    var stack: [Character] = []
    for ch in s {
        if ch == "(" || ch == "[" || ch == "{" {
            stack.append(ch)
        } else {
            guard let open = stack.popLast() else { return false }
            if (ch == ")" && open != "(") || (ch == "]" && open != "[") || (ch == "}" && open != "{") {
                return false
            }
        }
    }
    return stack.isEmpty
}`,
      rust: `fn isValid(s: String) -> bool {
    let mut stack: Vec<char> = Vec::new();
    for ch in s.chars() {
        match ch {
            '(' | '[' | '{' => stack.push(ch),
            _ => {
                let open = match stack.pop() {
                    Some(c) => c,
                    None => return false,
                };
                let expected = match ch {
                    ')' => '(',
                    ']' => '[',
                    '}' => '{',
                    _ => return false,
                };
                if open != expected {
                    return false;
                }
            }
        }
    }
    stack.is_empty()
}`,
      php: `function isValid($s) {
    $pairs = [")" => "(", "]" => "[", "}" => "{"];
    $stack = [];
    for ($i = 0; $i < strlen($s); $i++) {
        $ch = $s[$i];
        if ($ch == "(" || $ch == "[" || $ch == "{") {
            $stack[] = $ch;
        } else {
            if (empty($stack) || array_pop($stack) != $pairs[$ch]) return false;
        }
    }
    return empty($stack);
}`,
      ruby: `def isValid(s)
  pairs = { ")" => "(", "]" => "[", "}" => "{" }
  stack = []
  s.each_char do |ch|
    if "([{".include?(ch)
      stack.push(ch)
    else
      return false if stack.pop != pairs[ch]
    end
  end
  stack.empty?
end`,
    },
  },
];
