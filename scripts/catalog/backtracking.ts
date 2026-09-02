/** Backtracking — hand-authored classics with canonical (deterministic) output orders.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { describe, fmtIntArr, fmtIntMat, fmtStrArr, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const BACKTRACKING_PROBLEMS: CatalogProblem[] = [

  // ── Letter Combinations of a Phone Number ───────────────────────
  (() => {
    const MAP: Record<string, string> = {
      "2": "abc", "3": "def", "4": "ghi", "5": "jkl",
      "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz",
    };
    const ref = (digits: string) => {
      if (digits.length === 0) return [];
      let out = [""];
      for (const d of digits) {
        const next: string[] = [];
        for (const prefix of out) {
          for (const ch of MAP[d]) next.push(prefix + ch);
        }
        out = next;
      }
      return out;
    };
    return {
      slug: "letter-combinations-of-a-phone-number",
      title: "Letter Combinations of a Phone Number",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Backtracking", "Hash Table"],
      signature: { funcName: "letterCombinations", params: [{ name: "digits", type: "string" as const }], returns: "string[]" as const },
      description: describe(
        'Given a string of digits `2-9`, return all possible letter combinations the number could represent on a phone keypad (`2=abc`, `3=def`, `4=ghi`, `5=jkl`, `6=mno`, `7=pqrs`, `8=tuv`, `9=wxyz`), in **lexicographic order**. Return an empty list for an empty input.',
        [
          { in: 'digits = "23"', out: '["ad","ae","af","bd","be","bf","cd","ce","cf"]' },
          { in: 'digits = ""', out: "[]" },
        ],
        ["0 <= digits.length <= 3", "digits[i] is a digit in ['2','9']."]),
      hints: [
        "Build combinations digit by digit — each digit multiplies the possibilities.",
        "Processing letters in keypad order yields lexicographic output naturally.",
      ],
      examples: [
        { input: '"23"', expectedOutput: '["ad","ae","af","bd","be","bf","cd","ce","cf"]' },
        { input: '""', expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const digits = Array.from({ length: ri(rng, 0, 3) }, () => String(ri(rng, 2, 9))).join("");
        return { input: `"${digits}"`, expectedOutput: fmtStrArr(ref(digits)) };
      },
      solutions: {
        python: `from typing import List\n\ndef letterCombinations(digits: str) -> List[str]:\n    if not digits:\n        return []\n    mapping = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}\n    out = [""]\n    for d in digits:\n        out = [prefix + ch for prefix in out for ch in mapping[d]]\n    return out`,
        javascript: `var letterCombinations = function(digits) {\n    if (digits.length === 0) return [];\n    const map = { "2": "abc", "3": "def", "4": "ghi", "5": "jkl", "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz" };\n    let out = [""];\n    for (const d of digits) {\n        const next = [];\n        for (const prefix of out) {\n            for (const ch of map[d]) next.push(prefix + ch);\n        }\n        out = next;\n    }\n    return out;\n};`,
      },
    };
  })(),

  // ── Generate Parentheses ────────────────────────────────────────
  (() => {
    const ref = (n: number) => {
      const out: string[] = [];
      const go = (cur: string, open: number, close: number) => {
        if (cur.length === 2 * n) {
          out.push(cur);
          return;
        }
        if (open < n) go(cur + "(", open + 1, close);
        if (close < open) go(cur + ")", open, close + 1);
      };
      go("", 0, 0);
      return out;
    };
    return {
      slug: "generate-parentheses",
      title: "Generate Parentheses",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Backtracking", "Dynamic Programming"],
      signature: { funcName: "generateParenthesis", params: [{ name: "n", type: "int" as const }], returns: "string[]" as const },
      description: describe(
        "Given `n` pairs of parentheses, generate **all combinations of well-formed parentheses**, in **lexicographic order** (`'('` sorts before `')'`).",
        [
          { in: "n = 3", out: '["((()))","(()())","(())()","()(())","()()()"]' },
          { in: "n = 1", out: '["()"]' },
        ],
        ["1 <= n <= 5"]),
      hints: [
        "Track open/close counts: you may add '(' while open < n, and ')' while close < open.",
        "Trying '(' before ')' produces lexicographic order automatically.",
      ],
      examples: [
        { input: "3", expectedOutput: '["((()))","(()())","(())()","()(())","()()()"]' },
        { input: "1", expectedOutput: '["()"]' },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 5);
        return { input: String(n), expectedOutput: fmtStrArr(ref(n)) };
      },
      solutions: {
        python: `from typing import List\n\ndef generateParenthesis(n: int) -> List[str]:\n    out = []\n\n    def go(cur, open_count, close_count):\n        if len(cur) == 2 * n:\n            out.append(cur)\n            return\n        if open_count < n:\n            go(cur + "(", open_count + 1, close_count)\n        if close_count < open_count:\n            go(cur + ")", open_count, close_count + 1)\n\n    go("", 0, 0)\n    return out`,
        javascript: `var generateParenthesis = function(n) {\n    const out = [];\n    function go(cur, open, close) {\n        if (cur.length === 2 * n) {\n            out.push(cur);\n            return;\n        }\n        if (open < n) go(cur + "(", open + 1, close);\n        if (close < open) go(cur + ")", open, close + 1);\n    }\n    go("", 0, 0);\n    return out;\n};`,
      },
    };
  })(),

  // ── Subsets ─────────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const s = [...nums].sort((a, b) => a - b);
      const out: number[][] = [];
      const go = (start: number, cur: number[]) => {
        out.push([...cur]);
        for (let i = start; i < s.length; i++) {
          cur.push(s[i]);
          go(i + 1, cur);
          cur.pop();
        }
      };
      go(0, []);
      return out;
    };
    return {
      slug: "subsets",
      title: "Subsets",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Backtracking", "Bit Manipulation"],
      signature: { funcName: "subsets", params: [{ name: "nums", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an array `nums` of **distinct** integers, return **all possible subsets** (the power set).\n\nOutput order: sort `nums` ascending, keep each subset in ascending order, and list subsets in **DFS (prefix) order** — a subset comes immediately before its extensions (e.g. `[1]` before `[1,2]`, and `[1,2,3]` before `[1,3]`).",
        [
          { in: "nums = [1,2,3]", out: "[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]" },
          { in: "nums = [0]", out: "[[],[0]]" },
        ],
        ["1 <= nums.length <= 5", "-10 <= nums[i] <= 10", "All values distinct."]),
      hints: [
        "Backtracking: at each step, choose the next larger element to include, or stop.",
        "Push the current subset into the answer BEFORE exploring extensions to get prefix order.",
      ],
      examples: [
        { input: "[1,2,3]", expectedOutput: "[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]" },
        { input: "[0]", expectedOutput: "[[],[0]]" },
      ],
      gen: (rng: Rng) => {
        const pool = shuffle(rng, Array.from({ length: 21 }, (_, i) => i - 10));
        const nums = pool.slice(0, ri(rng, 1, 5));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntMat(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef subsets(nums: List[int]) -> List[List[int]]:\n    s = sorted(nums)\n    out = []\n\n    def go(start, cur):\n        out.append(cur[:])\n        for i in range(start, len(s)):\n            cur.append(s[i])\n            go(i + 1, cur)\n            cur.pop()\n\n    go(0, [])\n    return out`,
        javascript: `var subsets = function(nums) {\n    const s = nums.slice().sort(function(a, b) { return a - b; });\n    const out = [];\n    function go(start, cur) {\n        out.push(cur.slice());\n        for (let i = start; i < s.length; i++) {\n            cur.push(s[i]);\n            go(i + 1, cur);\n            cur.pop();\n        }\n    }\n    go(0, []);\n    return out;\n};`,
      },
    };
  })(),

  // ── Permutations ────────────────────────────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const s = [...nums].sort((a, b) => a - b);
      const out: number[][] = [];
      const used = new Array(s.length).fill(false);
      const go = (cur: number[]) => {
        if (cur.length === s.length) {
          out.push([...cur]);
          return;
        }
        for (let i = 0; i < s.length; i++) {
          if (used[i]) continue;
          used[i] = true;
          cur.push(s[i]);
          go(cur);
          cur.pop();
          used[i] = false;
        }
      };
      go([]);
      return out;
    };
    return {
      slug: "permutations",
      title: "Permutations",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Backtracking"],
      signature: { funcName: "permute", params: [{ name: "nums", type: "int[]" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an array `nums` of **distinct** integers, return **all possible permutations**, in **lexicographic order** (with the array's values sorted ascending first).",
        [
          { in: "nums = [1,2,3]", out: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]" },
          { in: "nums = [0,1]", out: "[[0,1],[1,0]]" },
        ],
        ["1 <= nums.length <= 4", "-10 <= nums[i] <= 10", "All values distinct."]),
      hints: [
        "Backtracking with a 'used' array — pick each unused value in ascending order.",
        "Sorting first and always iterating candidates in order yields lexicographic output.",
      ],
      examples: [
        { input: "[1,2,3]", expectedOutput: "[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]" },
        { input: "[0,1]", expectedOutput: "[[0,1],[1,0]]" },
      ],
      gen: (rng: Rng) => {
        const pool = shuffle(rng, Array.from({ length: 21 }, (_, i) => i - 10));
        const nums = pool.slice(0, ri(rng, 1, 4));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntMat(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef permute(nums: List[int]) -> List[List[int]]:\n    s = sorted(nums)\n    out = []\n    used = [False] * len(s)\n\n    def go(cur):\n        if len(cur) == len(s):\n            out.append(cur[:])\n            return\n        for i in range(len(s)):\n            if used[i]:\n                continue\n            used[i] = True\n            cur.append(s[i])\n            go(cur)\n            cur.pop()\n            used[i] = False\n\n    go([])\n    return out`,
        javascript: `var permute = function(nums) {\n    const s = nums.slice().sort(function(a, b) { return a - b; });\n    const out = [];\n    const used = new Array(s.length).fill(false);\n    function go(cur) {\n        if (cur.length === s.length) {\n            out.push(cur.slice());\n            return;\n        }\n        for (let i = 0; i < s.length; i++) {\n            if (used[i]) continue;\n            used[i] = true;\n            cur.push(s[i]);\n            go(cur);\n            cur.pop();\n            used[i] = false;\n        }\n    }\n    go([]);\n    return out;\n};`,
      },
    };
  })(),

  // ── Combinations ────────────────────────────────────────────────
  (() => {
    const ref = (n: number, k: number) => {
      const out: number[][] = [];
      const go = (start: number, cur: number[]) => {
        if (cur.length === k) {
          out.push([...cur]);
          return;
        }
        for (let i = start; i <= n; i++) {
          cur.push(i);
          go(i + 1, cur);
          cur.pop();
        }
      };
      go(1, []);
      return out;
    };
    return {
      slug: "combinations",
      title: "Combinations",
      difficulty: "MEDIUM" as const,
      tags: ["Backtracking"],
      signature: { funcName: "combine", params: [{ name: "n", type: "int" as const }, { name: "k", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "Given integers `n` and `k`, return **all combinations of `k` numbers** chosen from `[1, n]`, each combination in ascending order, and the list in **lexicographic order**.",
        [
          { in: "n = 4, k = 2", out: "[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]" },
          { in: "n = 1, k = 1", out: "[[1]]" },
        ],
        ["1 <= n <= 7", "1 <= k <= n"]),
      hints: [
        "Backtracking: each level picks a number strictly larger than the previous.",
        "Stop the loop early when not enough numbers remain to complete the combination.",
      ],
      examples: [
        { input: "4\n2", expectedOutput: "[[1,2],[1,3],[1,4],[2,3],[2,4],[3,4]]" },
        { input: "1\n1", expectedOutput: "[[1]]" },
      ],
      gen: (rng: Rng) => {
        const n = ri(rng, 1, 7);
        const k = ri(rng, 1, n);
        return { input: `${n}\n${k}`, expectedOutput: fmtIntMat(ref(n, k)) };
      },
      solutions: {
        python: `from typing import List\n\ndef combine(n: int, k: int) -> List[List[int]]:\n    out = []\n\n    def go(start, cur):\n        if len(cur) == k:\n            out.append(cur[:])\n            return\n        for i in range(start, n + 1):\n            cur.append(i)\n            go(i + 1, cur)\n            cur.pop()\n\n    go(1, [])\n    return out`,
        javascript: `var combine = function(n, k) {\n    const out = [];\n    function go(start, cur) {\n        if (cur.length === k) {\n            out.push(cur.slice());\n            return;\n        }\n        for (let i = start; i <= n; i++) {\n            cur.push(i);\n            go(i + 1, cur);\n            cur.pop();\n        }\n    }\n    go(1, []);\n    return out;\n};`,
      },
    };
  })(),

  // ── Combination Sum ─────────────────────────────────────────────
  (() => {
    const ref = (candidates: number[], target: number) => {
      const s = [...candidates].sort((a, b) => a - b);
      const out: number[][] = [];
      const go = (start: number, remain: number, cur: number[]) => {
        if (remain === 0) {
          out.push([...cur]);
          return;
        }
        for (let i = start; i < s.length; i++) {
          if (s[i] > remain) break;
          cur.push(s[i]);
          go(i, remain - s[i], cur);
          cur.pop();
        }
      };
      go(0, target, []);
      return out;
    };
    return {
      slug: "combination-sum",
      title: "Combination Sum",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Backtracking"],
      signature: { funcName: "combinationSum", params: [{ name: "candidates", type: "int[]" as const }, { name: "target", type: "int" as const }], returns: "int[][]" as const },
      description: describe(
        "Given an array of **distinct** positive integers `candidates` and a `target`, return all **unique combinations** where the chosen numbers sum to `target`. A number may be used **unlimited times**.\n\nOutput order: each combination in non-decreasing order; combinations listed in **lexicographic order**.",
        [
          { in: "candidates = [2,3,6,7], target = 7", out: "[[2,2,3],[7]]" },
          { in: "candidates = [2,3,5], target = 8", out: "[[2,2,2,2],[2,3,3],[3,5]]" },
          { in: "candidates = [2], target = 1", out: "[]" },
        ],
        ["1 <= candidates.length <= 6", "2 <= candidates[i] <= 12 (distinct)", "1 <= target <= 15"]),
      hints: [
        "Sort candidates; DFS with a 'start' index so combinations stay non-decreasing.",
        "Reusing a number means recursing with the SAME start index; break once a candidate exceeds the remainder.",
      ],
      examples: [
        { input: "[2,3,6,7]\n7", expectedOutput: "[[2,2,3],[7]]" },
        { input: "[2,3,5]\n8", expectedOutput: "[[2,2,2,2],[2,3,3],[3,5]]" },
        { input: "[2]\n1", expectedOutput: "[]" },
      ],
      gen: (rng: Rng) => {
        const pool = shuffle(rng, Array.from({ length: 11 }, (_, i) => i + 2));
        const candidates = pool.slice(0, ri(rng, 1, 6));
        const target = ri(rng, 1, 15);
        return { input: `${fmtIntArr(candidates)}\n${target}`, expectedOutput: fmtIntMat(ref(candidates, target)) };
      },
      solutions: {
        python: `from typing import List\n\ndef combinationSum(candidates: List[int], target: int) -> List[List[int]]:\n    s = sorted(candidates)\n    out = []\n\n    def go(start, remain, cur):\n        if remain == 0:\n            out.append(cur[:])\n            return\n        for i in range(start, len(s)):\n            if s[i] > remain:\n                break\n            cur.append(s[i])\n            go(i, remain - s[i], cur)\n            cur.pop()\n\n    go(0, target, [])\n    return out`,
        javascript: `var combinationSum = function(candidates, target) {\n    const s = candidates.slice().sort(function(a, b) { return a - b; });\n    const out = [];\n    function go(start, remain, cur) {\n        if (remain === 0) {\n            out.push(cur.slice());\n            return;\n        }\n        for (let i = start; i < s.length; i++) {\n            if (s[i] > remain) break;\n            cur.push(s[i]);\n            go(i, remain - s[i], cur);\n            cur.pop();\n        }\n    }\n    go(0, target, []);\n    return out;\n};`,
      },
    };
  })(),

];
