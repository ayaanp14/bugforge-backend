import "dotenv/config";
import { prisma } from "../src/lib/prisma.js";

const SOLUTIONS = [
  {
    slug: "two-sum",
    referenceSolution: "function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n  return [];\n};",
    referenceLanguage: "javascript"
  },
  {
    slug: "palindrome-number",
    referenceSolution: "function isPalindrome(x) {\n  if (x < 0) return false;\n  const str = String(x);\n  return str === str.split('').reverse().join('');\n};",
    referenceLanguage: "javascript"
  },
  {
    slug: "fibonacci-number",
    referenceSolution: "function fib(n) {\n  if (n <= 1) return n;\n  let prev = 0, curr = 1;\n  for (let i = 2; i <= n; i++) {\n    const next = prev + curr;\n    prev = curr;\n    curr = next;\n  }\n  return curr;\n};",
    referenceLanguage: "javascript"
  },
  {
    slug: "valid-parentheses",
    referenceSolution: "function isValid(s) {\n  const stack = [];\n  const map = { \")\": \"(\", \"}\": \"{\", \"]\": \"[\" };\n  for (const char of s) {\n    if (char in map) {\n      if (stack.pop() !== map[char]) return false;\n    } else {\n      stack.push(char);\n    }\n  }\n  return stack.length === 0;\n};",
    referenceLanguage: "javascript"
  },
  {
    slug: "reverse-string",
    referenceSolution: "function reverseString(s) {\n  let left = 0, right = s.length - 1;\n  while (left < right) {\n    [s[left], s[right]] = [s[right], s[left]];\n    left++;\n    right--;\n  }\n  return s;\n};",
    referenceLanguage: "javascript"
  }
];

async function main() {
  console.log("Updating reference solutions in database...");

  for (const sol of SOLUTIONS) {
    try {
      const problem = await prisma.problem.update({
        where: { slug: sol.slug },
        data: {
          referenceSolution: sol.referenceSolution,
          referenceLanguage: sol.referenceLanguage
        }
      });
      console.log(`✅ Updated reference solution for: ${problem.title}`);
    } catch (err: any) {
      console.error(`❌ Failed to update ${sol.slug}:`, err.message);
    }
  }

  console.log("\nUpdate complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
