import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PROBLEMS_TO_SEED = [
  {
    title: "Two Sum",
    difficulty: "EASY",
    tags: ["Array", "Hash Table"],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.

### Example 1:
> **Input:** nums = [2,7,11,15], target = 9
> **Output:** [0,1]
> **Explanation:** Because nums[0] + nums[1] == 9, we return [0, 1].

### Example 2:
> **Input:** nums = [3,2,4], target = 6
> **Output:** [1,2]

### Example 3:
> **Input:** nums = [3,3], target = 6
> **Output:** [0,1]

### Constraints:
* \`2 <= nums.length <= 10^4\`
* \`-10^9 <= nums[i] <= 10^9\`
* \`-10^9 <= target <= 10^9\`
* **Only one valid answer exists.**

**Follow-up:** Can you come up with an algorithm that is less than \`O(n^2)\` time complexity?`,
    slug: "two-sum",
    isPublished: true,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    starterCode: {
      javascript: "function twoSum(nums, target) {\n  // Your code here\n};",
      python: "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        pass"
    },
    hints: [
      "Try using a hash map to store the index of each number as you iterate through the array.",
      "For each number `x`, check if `target - x` is already in the hash map."
    ],
    testCases: [
      { input: "nums=[2,7,11,15], target=9", expectedOutput: "[0,1]", isHidden: false, orderIndex: 0 },
      { input: "nums=[3,2,4], target=6", expectedOutput: "[1,2]", isHidden: false, orderIndex: 1 },
      { input: "nums=[3,3], target=6", expectedOutput: "[0,1]", isHidden: true, orderIndex: 2 },
      { input: "nums=[-1,-2,-3,-4,-5], target=-8", expectedOutput: "[2,4]", isHidden: true, orderIndex: 3 },
      { input: "nums=[1,5,5,11], target=10", expectedOutput: "[1,2]", isHidden: true, orderIndex: 4 }
    ]
  },
  {
    title: "Palindrome Number",
    difficulty: "EASY",
    tags: ["Math"],
    description: `Given an integer \`x\`, return \`true\` if \`x\` is a **palindrome**, and \`false\` otherwise.

### Example 1:
> **Input:** x = 121
> **Output:** true
> **Explanation:** 121 reads as 121 from left to right and from right to left.

### Example 2:
> **Input:** x = -121
> **Output:** false
> **Explanation:** From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.

### Example 3:
> **Input:** x = 10
> **Output:** false
> **Explanation:** Reads 01 from right to left. Therefore it is not a palindrome.

### Constraints:
* \`-2^31 <= x <= 2^31 - 1\`

**Follow-up:** Could you solve it without converting the integer to a string?`,
    slug: "palindrome-number",
    isPublished: true,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    starterCode: {
      javascript: "function isPalindrome(x) {\n  // Your code here\n};",
      python: "class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        pass"
    },
    hints: [
      "Negative numbers are not palindromes (e.g., -121 reversed is 121-).",
      "Try reversing the second half of the number and comparing it with the first half."
    ],
    testCases: [
      { input: "x=121", expectedOutput: "true", isHidden: false, orderIndex: 0 },
      { input: "x=-121", expectedOutput: "false", isHidden: false, orderIndex: 1 },
      { input: "x=10", expectedOutput: "false", isHidden: true, orderIndex: 2 },
      { input: "x=0", expectedOutput: "true", isHidden: true, orderIndex: 3 },
      { input: "x=12321", expectedOutput: "true", isHidden: true, orderIndex: 4 }
    ]
  },
  {
    title: "Fibonacci Number",
    difficulty: "EASY",
    tags: ["Math", "Dynamic Programming"],
    description: `The **Fibonacci numbers**, commonly denoted \`F(n)\` form a sequence, called the **Fibonacci sequence**, such that each number is the sum of the two preceding ones, starting from \`0\` and \`1\`. That is:

\`F(0) = 0, F(1) = 1\`
\`F(n) = F(n - 1) + F(n - 2), for n > 1.\`

Given \`n\`, calculate \`F(n)\`.

### Example 1:
> **Input:** n = 2
> **Output:** 1
> **Explanation:** F(2) = F(1) + F(0) = 1 + 0 = 1.

### Example 2:
> **Input:** n = 3
> **Output:** 2
> **Explanation:** F(3) = F(2) + F(1) = 1 + 1 = 2.

### Example 3:
> **Input:** n = 4
> **Output:** 3
> **Explanation:** F(4) = F(3) + F(2) = 2 + 1 = 3.

### Constraints:
* \`0 <= n <= 30\``,
    slug: "fibonacci-number",
    isPublished: true,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    starterCode: {
      javascript: "function fib(n) {\n  // Your code here\n};",
      python: "class Solution:\n    def fib(self, n: int) -> int:\n        pass"
    },
    hints: [
      "You can use recursion, but it might be slow for large `n`.",
      "Try an iterative approach using a loop and two variables to store the previous values."
    ],
    testCases: [
      { input: "n=2", expectedOutput: "1", isHidden: false, orderIndex: 0 },
      { input: "n=3", expectedOutput: "2", isHidden: false, orderIndex: 1 },
      { input: "n=4", expectedOutput: "3", isHidden: true, orderIndex: 2 },
      { input: "n=0", expectedOutput: "0", isHidden: true, orderIndex: 3 },
      { input: "n=10", expectedOutput: "55", isHidden: true, orderIndex: 4 }
    ]
  },
  {
    title: "Valid Parentheses",
    difficulty: "EASY",
    tags: ["String", "Stack"],
    description: `Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

### Example 1:
> **Input:** s = "()"
> **Output:** true

### Example 2:
> **Input:** s = "()[]{}"
> **Output:** true

### Example 3:
> **Input:** s = "(]"
> **Output:** false

### Constraints:
* \`1 <= s.length <= 10^4\`
* \`s\` consists of parentheses only \`()[]{}\`.`,
    slug: "valid-parentheses",
    isPublished: true,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    starterCode: {
      javascript: "function isValid(s) {\n  // Your code here\n};",
      python: "class Solution:\n    def isValid(self, s: str) -> bool:\n        pass"
    },
    hints: [
      "Use a stack to keep track of the opening brackets.",
      "When you encounter a closing bracket, check if it matches the top of the stack."
    ],
    testCases: [
      { input: 's="()"', expectedOutput: "true", isHidden: false, orderIndex: 0 },
      { input: 's="()[]{}"', expectedOutput: "true", isHidden: false, orderIndex: 1 },
      { input: 's="(]"', expectedOutput: "false", isHidden: true, orderIndex: 2 },
      { input: 's="([)]"', expectedOutput: "false", isHidden: true, orderIndex: 3 },
      { input: 's="{[]}"', expectedOutput: "true", isHidden: true, orderIndex: 4 }
    ]
  },
  {
    title: "Reverse String",
    difficulty: "EASY",
    tags: ["Two Pointers", "String"],
    description: `Write a function that reverses a string. The input string is given as an array of characters \`s\`.

You must do this by modifying the input array **in-place** with \`O(1)\` extra memory.

### Example 1:
> **Input:** s = ["h","e","l","l","o"]
> **Output:** ["o","l","l","e","h"]

### Example 2:
> **Input:** s = ["H","a","n","n","a","h"]
> **Output:** ["h","a","n","n","a","H"]

### Constraints:
* \`1 <= s.length <= 10^5\`
* \`s[i]\` is a printable ascii character.`,
    slug: "reverse-string",
    isPublished: true,
    timeLimitMs: 2000,
    memoryLimitMb: 256,
    starterCode: {
      javascript: "function reverseString(s) {\n  // Your code here\n};",
      python: "class Solution:\n    def reverseString(self, s: List[str]) -> None:\n        pass"
    },
    hints: [
      "Try a two-pointer approach, one at the start and one at the end.",
      "Swap the characters at the two pointers and move them towards each other."
    ],
    testCases: [
      { input: 's=["h","e","l","l","o"]', expectedOutput: '["o","l","l","e","h"]', isHidden: false, orderIndex: 0 },
      { input: 's=["H","a","n","n","a","h"]', expectedOutput: '["h","a","n","n","a","H"]', isHidden: false, orderIndex: 1 },
      { input: 's=["a"]', expectedOutput: '["a"]', isHidden: true, orderIndex: 2 },
      { input: 's=["A","b"]', expectedOutput: '["b","A"]', isHidden: true, orderIndex: 3 },
      { input: 's=[]', expectedOutput: '[]', isHidden: true, orderIndex: 4 }
    ]
  }
];

async function main() {
  console.log("Starting database reset and seed...");

  try {
    // 1. Delete all existing problems (cascading will handle hints, testCases, drafts, submissions)
    await prisma.problem.deleteMany();
    console.log("✅ Successfully deleted all existing problems.");

    // 2. Insert new premium problems
    for (const probData of PROBLEMS_TO_SEED) {
      const { testCases, ...problemBase } = probData;
      
      await prisma.problem.create({
        data: {
          ...problemBase,
          testCases: {
            create: testCases
          }
        }
      });
      console.log(`- Created problem: ${probData.title}`);
    }

    console.log("\n✅ Database has been reset and seeded with 5 premium problems!");
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
