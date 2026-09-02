/** Stack & Queue — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, fmtIntArr, fmtStrArr, randLower, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

export const STACK_PROBLEMS: CatalogProblem[] = [

  // ── Valid Parentheses ───────────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
      const st: string[] = [];
      for (const ch of s) {
        if (ch === "(" || ch === "[" || ch === "{") st.push(ch);
        else {
          if (st.pop() !== pairs[ch]) return false;
        }
      }
      return st.length === 0;
    };
    const genBalanced = (rng: Rng, depth: number): string => {
      if (depth <= 0 || rng() < 0.3) return "";
      const openers = ["(", "[", "{"];
      const closers = [")", "]", "}"];
      const i = ri(rng, 0, 2);
      return openers[i] + genBalanced(rng, depth - 1) + closers[i] + (rng() < 0.5 ? genBalanced(rng, depth - 1) : "");
    };
    return {
      slug: "valid-parentheses",
      title: "Valid Parentheses",
      difficulty: "EASY" as const,
      tags: ["String", "Stack"],
      signature: { funcName: "isValid", params: [{ name: "s", type: "string" as const }], returns: "bool" as const },
      description: describe(
        "Given a string `s` containing just `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine whether it is **valid**:\n\n1. Open brackets are closed by the same type of bracket.\n2. Open brackets are closed in the correct order.\n3. Every closing bracket has a corresponding opening bracket.",
        [
          { in: 's = "()"', out: "true" },
          { in: 's = "()[]{}"', out: "true" },
          { in: 's = "(]"', out: "false" },
        ],
        ["0 <= s.length <= 40", "s consists only of the six bracket characters."]),
      hints: [
        "Push every opener on a stack; a closer must match the top of the stack.",
        "Valid iff no mismatch occurs and the stack ends empty.",
      ],
      examples: [
        { input: '"()"', expectedOutput: "true" },
        { input: '"()[]{}"', expectedOutput: "true" },
        { input: '"(]"', expectedOutput: "false" },
      ],
      gen: (rng: Rng) => {
        let s: string;
        if (rng() < 0.5) {
          s = genBalanced(rng, 4).slice(0, 40);
          if (rng() < 0.35 && s.length > 0) {
            const pos = ri(rng, 0, s.length - 1);
            const all = "()[]{}";
            s = s.slice(0, pos) + all[ri(rng, 0, 5)] + s.slice(pos + 1);
          }
        } else {
          const all = "()[]{}";
          s = Array.from({ length: ri(rng, 0, 40) }, () => all[ri(rng, 0, 5)]).join("");
        }
        return { input: `"${s}"`, expectedOutput: bool(ref(s)) };
      },
      solutions: {
        python: `def isValid(s: str) -> bool:\n    pairs = {")": "(", "]": "[", "}": "{"}\n    st = []\n    for ch in s:\n        if ch in "([{":\n            st.append(ch)\n        else:\n            if not st or st.pop() != pairs[ch]:\n                return False\n    return not st`,
        javascript: `var isValid = function(s) {\n    const pairs = { ")": "(", "]": "[", "}": "{" };\n    const st = [];\n    for (const ch of s) {\n        if (ch === "(" || ch === "[" || ch === "{") {\n            st.push(ch);\n        } else {\n            if (st.pop() !== pairs[ch]) return false;\n        }\n    }\n    return st.length === 0;\n};`,
      },
    };
  })(),

  // ── Evaluate Reverse Polish Notation ────────────────────────────
  (() => {
    const ref = (tokens: string[]) => {
      const st: number[] = [];
      for (const t of tokens) {
        if (t === "+" || t === "-" || t === "*" || t === "/") {
          const b = st.pop()!, a = st.pop()!;
          if (t === "+") st.push(a + b);
          else if (t === "-") st.push(a - b);
          else if (t === "*") st.push(a * b);
          else st.push(Math.trunc(a / b));
        } else {
          st.push(parseInt(t, 10));
        }
      }
      return st[0];
    };
    const genTokens = (rng: Rng): string[] => {
      // Build a random expression tree with bounded values.
      const build = (depth: number): { tokens: string[]; value: number } => {
        if (depth <= 0 || rng() < 0.4) {
          const v = ri(rng, -20, 20);
          return { tokens: [String(v)], value: v };
        }
        const left = build(depth - 1);
        const right = build(depth - 1);
        const ops = ["+", "-", "*", "/"];
        let op = ops[ri(rng, 0, 3)];
        if (op === "/" && right.value === 0) op = "+";
        let value: number;
        if (op === "+") value = left.value + right.value;
        else if (op === "-") value = left.value - right.value;
        else if (op === "*") value = left.value * right.value;
        else value = Math.trunc(left.value / right.value);
        if (Math.abs(value) > 1000000) return { tokens: [String(ri(rng, -20, 20))], value: 0 };
        return { tokens: [...left.tokens, ...right.tokens, op], value };
      };
      return build(3).tokens;
    };
    return {
      slug: "evaluate-reverse-polish-notation",
      title: "Evaluate Reverse Polish Notation",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Math"],
      signature: { funcName: "evalRPN", params: [{ name: "tokens", type: "string[]" as const }], returns: "int" as const },
      description: describe(
        "Evaluate an arithmetic expression given in **Reverse Polish Notation** (postfix). Valid operators are `+`, `-`, `*`, `/`. Division **truncates toward zero**. No division by zero occurs, and every expression is valid.",
        [
          { in: 'tokens = ["2","1","+","3","*"]', out: "9", note: "((2 + 1) × 3) = 9." },
          { in: 'tokens = ["4","13","5","/","+"]', out: "6", note: "(4 + (13 / 5)) = 6." },
        ],
        ["1 <= tokens.length <= 30", "Operands fit in 32-bit integers."]),
      hints: [
        "Push numbers; on an operator pop two, apply, push the result.",
        "Order matters for - and /: the second pop is the left operand.",
      ],
      examples: [
        { input: '["2","1","+","3","*"]', expectedOutput: "9" },
        { input: '["4","13","5","/","+"]', expectedOutput: "6" },
      ],
      gen: (rng: Rng) => {
        const tokens = genTokens(rng);
        return { input: fmtStrArr(tokens), expectedOutput: String(ref(tokens)) };
      },
      solutions: {
        python: `from typing import List\n\ndef evalRPN(tokens: List[str]) -> int:\n    st = []\n    for t in tokens:\n        if t in ("+", "-", "*", "/"):\n            b = st.pop()\n            a = st.pop()\n            if t == "+":\n                st.append(a + b)\n            elif t == "-":\n                st.append(a - b)\n            elif t == "*":\n                st.append(a * b)\n            else:\n                st.append(int(a / b))\n        else:\n            st.append(int(t))\n    return st[0]`,
        javascript: `var evalRPN = function(tokens) {\n    const st = [];\n    for (const t of tokens) {\n        if (t === "+" || t === "-" || t === "*" || t === "/") {\n            const b = st.pop(), a = st.pop();\n            if (t === "+") st.push(a + b);\n            else if (t === "-") st.push(a - b);\n            else if (t === "*") st.push(a * b);\n            else st.push(Math.trunc(a / b));\n        } else {\n            st.push(parseInt(t, 10));\n        }\n    }\n    return st[0];\n};`,
      },
    };
  })(),

  // ── Daily Temperatures ──────────────────────────────────────────
  (() => {
    const ref = (temperatures: number[]) => {
      const out = new Array(temperatures.length).fill(0);
      const st: number[] = [];
      for (let i = 0; i < temperatures.length; i++) {
        while (st.length > 0 && temperatures[st[st.length - 1]] < temperatures[i]) {
          const j = st.pop()!;
          out[j] = i - j;
        }
        st.push(i);
      }
      return out;
    };
    return {
      slug: "daily-temperatures",
      title: "Daily Temperatures",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Monotonic Stack"],
      signature: { funcName: "dailyTemperatures", params: [{ name: "temperatures", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given an array `temperatures` of daily temperatures, return an array `answer` where `answer[i]` is the number of days you have to wait after day `i` for a **warmer** temperature. If no future day is warmer, `answer[i] = 0`.",
        [
          { in: "temperatures = [73,74,75,71,69,72,76,73]", out: "[1,1,4,2,1,1,0,0]" },
          { in: "temperatures = [30,60,90]", out: "[1,1,0]" },
        ],
        ["1 <= temperatures.length <= 40", "30 <= temperatures[i] <= 100"]),
      hints: [
        "A monotonic stack of indices with decreasing temperatures.",
        "When a warmer day arrives, it resolves every colder index on the stack.",
      ],
      examples: [
        { input: "[73,74,75,71,69,72,76,73]", expectedOutput: "[1,1,4,2,1,1,0,0]" },
        { input: "[30,60,90]", expectedOutput: "[1,1,0]" },
      ],
      gen: (rng: Rng) => {
        const temps = Array.from({ length: ri(rng, 1, 40) }, () => ri(rng, 30, 100));
        return { input: fmtIntArr(temps), expectedOutput: fmtIntArr(ref(temps)) };
      },
      solutions: {
        python: `from typing import List\n\ndef dailyTemperatures(temperatures: List[int]) -> List[int]:\n    out = [0] * len(temperatures)\n    st = []\n    for i, t in enumerate(temperatures):\n        while st and temperatures[st[-1]] < t:\n            j = st.pop()\n            out[j] = i - j\n        st.append(i)\n    return out`,
        javascript: `var dailyTemperatures = function(temperatures) {\n    const out = new Array(temperatures.length).fill(0);\n    const st = [];\n    for (let i = 0; i < temperatures.length; i++) {\n        while (st.length > 0 && temperatures[st[st.length - 1]] < temperatures[i]) {\n            const j = st.pop();\n            out[j] = i - j;\n        }\n        st.push(i);\n    }\n    return out;\n};`,
      },
    };
  })(),

  // ── Next Greater Element I ──────────────────────────────────────
  (() => {
    const ref = (nums1: number[], nums2: number[]) => {
      const next = new Map<number, number>();
      const st: number[] = [];
      for (const x of nums2) {
        while (st.length > 0 && st[st.length - 1] < x) next.set(st.pop()!, x);
        st.push(x);
      }
      return nums1.map((x) => (next.has(x) ? next.get(x)! : -1));
    };
    return {
      slug: "next-greater-element-i",
      title: "Next Greater Element I",
      difficulty: "EASY" as const,
      tags: ["Array", "Stack", "Hash Table"],
      signature: { funcName: "nextGreaterElement", params: [{ name: "nums1", type: "int[]" as const }, { name: "nums2", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "You are given two **distinct-valued** arrays where `nums1` is a subset of `nums2`. For each `nums1[i]`, find its position `j` in `nums2` and return the **first element to the right of `j` in `nums2` that is greater** — or `-1` if none exists.",
        [
          { in: "nums1 = [4,1,2], nums2 = [1,3,4,2]", out: "[-1,3,-1]" },
          { in: "nums1 = [2,4], nums2 = [1,2,3,4]", out: "[3,-1]" },
        ],
        ["1 <= nums1.length <= nums2.length <= 25", "0 <= values <= 100", "All values distinct; nums1 ⊆ nums2."]),
      hints: [
        "Compute the next-greater for EVERY element of nums2 with a monotonic stack.",
        "Store the answers in a map, then answer nums1 by lookup.",
      ],
      examples: [
        { input: "[4,1,2]\n[1,3,4,2]", expectedOutput: "[-1,3,-1]" },
        { input: "[2,4]\n[1,2,3,4]", expectedOutput: "[3,-1]" },
      ],
      gen: (rng: Rng) => {
        const pool = shuffle(rng, Array.from({ length: 101 }, (_, i) => i));
        const nums2 = pool.slice(0, ri(rng, 1, 25));
        const nums1 = shuffle(rng, [...nums2]).slice(0, ri(rng, 1, nums2.length));
        return { input: `${fmtIntArr(nums1)}\n${fmtIntArr(nums2)}`, expectedOutput: fmtIntArr(ref(nums1, nums2)) };
      },
      solutions: {
        python: `from typing import List\n\ndef nextGreaterElement(nums1: List[int], nums2: List[int]) -> List[int]:\n    nxt = {}\n    st = []\n    for x in nums2:\n        while st and st[-1] < x:\n            nxt[st.pop()] = x\n        st.append(x)\n    return [nxt.get(x, -1) for x in nums1]`,
        javascript: `var nextGreaterElement = function(nums1, nums2) {\n    const next = new Map();\n    const st = [];\n    for (const x of nums2) {\n        while (st.length > 0 && st[st.length - 1] < x) next.set(st.pop(), x);\n        st.push(x);\n    }\n    return nums1.map(function(x) { return next.has(x) ? next.get(x) : -1; });\n};`,
      },
    };
  })(),

  // ── Next Greater Element II (circular) ──────────────────────────
  (() => {
    const ref = (nums: number[]) => {
      const n = nums.length;
      const out = new Array(n).fill(-1);
      const st: number[] = [];
      for (let i = 0; i < 2 * n; i++) {
        const x = nums[i % n];
        while (st.length > 0 && nums[st[st.length - 1]] < x) out[st.pop()!] = x;
        if (i < n) st.push(i);
      }
      return out;
    };
    return {
      slug: "next-greater-element-ii",
      title: "Next Greater Element II",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Monotonic Stack"],
      signature: { funcName: "nextGreaterElements", params: [{ name: "nums", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Given a **circular** integer array `nums`, return the **next greater number** for every element. Searching wraps around the array; if no greater number exists, output `-1` for that element.",
        [
          { in: "nums = [1,2,1]", out: "[2,-1,2]", note: "The last 1 wraps around to find 2." },
          { in: "nums = [1,2,3,4,3]", out: "[2,3,4,-1,4]" },
        ],
        ["1 <= nums.length <= 30", "-100 <= nums[i] <= 100"]),
      hints: [
        "Iterate the array twice (indices modulo n) to simulate the wrap-around.",
        "Only push indices during the first pass; the second pass just resolves.",
      ],
      examples: [
        { input: "[1,2,1]", expectedOutput: "[2,-1,2]" },
        { input: "[1,2,3,4,3]", expectedOutput: "[2,3,4,-1,4]" },
      ],
      gen: (rng: Rng) => {
        const nums = Array.from({ length: ri(rng, 1, 30) }, () => ri(rng, -100, 100));
        return { input: fmtIntArr(nums), expectedOutput: fmtIntArr(ref(nums)) };
      },
      solutions: {
        python: `from typing import List\n\ndef nextGreaterElements(nums: List[int]) -> List[int]:\n    n = len(nums)\n    out = [-1] * n\n    st = []\n    for i in range(2 * n):\n        x = nums[i % n]\n        while st and nums[st[-1]] < x:\n            out[st.pop()] = x\n        if i < n:\n            st.append(i)\n    return out`,
        javascript: `var nextGreaterElements = function(nums) {\n    const n = nums.length;\n    const out = new Array(n).fill(-1);\n    const st = [];\n    for (let i = 0; i < 2 * n; i++) {\n        const x = nums[i % n];\n        while (st.length > 0 && nums[st[st.length - 1]] < x) out[st.pop()] = x;\n        if (i < n) st.push(i);\n    }\n    return out;\n};`,
      },
    };
  })(),

  // ── Remove All Adjacent Duplicates in String ────────────────────
  (() => {
    const ref = (s: string) => {
      const st: string[] = [];
      for (const ch of s) {
        if (st.length > 0 && st[st.length - 1] === ch) st.pop();
        else st.push(ch);
      }
      return st.join("");
    };
    return {
      slug: "remove-all-adjacent-duplicates",
      title: "Remove All Adjacent Duplicates In String",
      difficulty: "EASY" as const,
      tags: ["String", "Stack"],
      signature: { funcName: "removeDuplicates", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Repeatedly remove **two adjacent equal letters** from `s` until no such pair remains, and return the final string. The answer is unique regardless of removal order.",
        [
          { in: 's = "abbaca"', out: '"ca"', note: '"abbaca" → "aaca" → "ca".' },
          { in: 's = "azxxzy"', out: '"ay"' },
        ],
        ["1 <= s.length <= 40", "Lowercase English letters."]),
      hints: [
        "A stack collapses pairs naturally: pop when the top equals the next char.",
        "The stack content at the end IS the answer.",
      ],
      examples: [
        { input: '"abbaca"', expectedOutput: "ca" },
        { input: '"azxxzy"', expectedOutput: "ay" },
      ],
      gen: (rng: Rng) => {
        const s = randLower(rng, 1, 40, "abc");
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def removeDuplicates(s: str) -> str:\n    st = []\n    for ch in s:\n        if st and st[-1] == ch:\n            st.pop()\n        else:\n            st.append(ch)\n    return "".join(st)`,
        javascript: `var removeDuplicates = function(s) {\n    const st = [];\n    for (const ch of s) {\n        if (st.length > 0 && st[st.length - 1] === ch) st.pop();\n        else st.push(ch);\n    }\n    return st.join("");\n};`,
      },
    };
  })(),

  // ── Remove K Digits ─────────────────────────────────────────────
  (() => {
    const ref = (num: string, k: number) => {
      const st: string[] = [];
      let toRemove = k;
      for (const ch of num) {
        while (toRemove > 0 && st.length > 0 && st[st.length - 1] > ch) {
          st.pop();
          toRemove--;
        }
        st.push(ch);
      }
      while (toRemove > 0) { st.pop(); toRemove--; }
      const out = st.join("").replace(/^0+/, "");
      return out === "" ? "0" : out;
    };
    return {
      slug: "remove-k-digits",
      title: "Remove K Digits",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Greedy", "Monotonic Stack"],
      signature: { funcName: "removeKdigits", params: [{ name: "num", type: "string" as const }, { name: "k", type: "int" as const }], returns: "string" as const },
      description: describe(
        'Given a string `num` representing a non-negative integer and an integer `k`, remove exactly `k` digits so that the remaining number is the **smallest possible**, and return it as a string (no leading zeros; return `"0"` if everything is removed).',
        [
          { in: 'num = "1432219", k = 3', out: '"1219"' },
          { in: 'num = "10200", k = 1', out: '"200"', note: "Remove the 1; leading zeros are stripped." },
          { in: 'num = "10", k = 2', out: '"0"' },
        ],
        ["1 <= k <= num.length <= 20", "num has only digits; no leading zeros except \"0\" itself."]),
      hints: [
        "Greedy with a stack: pop bigger digits from the top while you still may remove.",
        "If removals remain at the end, trim from the right; then strip leading zeros.",
      ],
      examples: [
        { input: '"1432219"\n3', expectedOutput: "1219" },
        { input: '"10200"\n1', expectedOutput: "200" },
        { input: '"10"\n2', expectedOutput: "0" },
      ],
      gen: (rng: Rng) => {
        const len = ri(rng, 1, 20);
        const num = len === 1
          ? String(ri(rng, 0, 9))
          : String(ri(rng, 1, 9)) + Array.from({ length: len - 1 }, () => ri(rng, 0, 9)).join("");
        const k = ri(rng, 1, num.length);
        return { input: `"${num}"\n${k}`, expectedOutput: ref(num, k) };
      },
      solutions: {
        python: `def removeKdigits(num: str, k: int) -> str:\n    st = []\n    for ch in num:\n        while k > 0 and st and st[-1] > ch:\n            st.pop()\n            k -= 1\n        st.append(ch)\n    while k > 0:\n        st.pop()\n        k -= 1\n    out = "".join(st).lstrip("0")\n    return out if out else "0"`,
        javascript: `var removeKdigits = function(num, k) {\n    const st = [];\n    for (const ch of num) {\n        while (k > 0 && st.length > 0 && st[st.length - 1] > ch) {\n            st.pop();\n            k--;\n        }\n        st.push(ch);\n    }\n    while (k > 0) { st.pop(); k--; }\n    const out = st.join("").replace(/^0+/, "");\n    return out === "" ? "0" : out;\n};`,
      },
    };
  })(),

  // ── Largest Rectangle in Histogram ──────────────────────────────
  (() => {
    const ref = (heights: number[]) => {
      const st: number[] = [];
      let best = 0;
      const h = [...heights, 0];
      for (let i = 0; i < h.length; i++) {
        while (st.length > 0 && h[st[st.length - 1]] > h[i]) {
          const height = h[st.pop()!];
          const left = st.length === 0 ? -1 : st[st.length - 1];
          best = Math.max(best, height * (i - left - 1));
        }
        st.push(i);
      }
      return best;
    };
    return {
      slug: "largest-rectangle-in-histogram",
      title: "Largest Rectangle in Histogram",
      difficulty: "HARD" as const,
      tags: ["Array", "Stack", "Monotonic Stack"],
      signature: { funcName: "largestRectangleArea", params: [{ name: "heights", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "Given an array `heights` of bar heights (each bar has width `1`), return the **area of the largest rectangle** that fits inside the histogram.",
        [
          { in: "heights = [2,1,5,6,2,3]", out: "10", note: "The rectangle spans bars 5 and 6 with height 5." },
          { in: "heights = [2,4]", out: "4" },
        ],
        ["1 <= heights.length <= 35", "0 <= heights[i] <= 100"]),
      hints: [
        "For each bar, the best rectangle using its full height spans to the nearest shorter bar on each side.",
        "A monotonic increasing stack finds both boundaries in one pass — append a sentinel 0 to flush.",
      ],
      examples: [
        { input: "[2,1,5,6,2,3]", expectedOutput: "10" },
        { input: "[2,4]", expectedOutput: "4" },
      ],
      gen: (rng: Rng) => {
        const heights = Array.from({ length: ri(rng, 1, 35) }, () => ri(rng, 0, 100));
        return { input: fmtIntArr(heights), expectedOutput: String(ref(heights)) };
      },
      solutions: {
        python: `from typing import List\n\ndef largestRectangleArea(heights: List[int]) -> int:\n    st = []\n    best = 0\n    hs = heights + [0]\n    for i, h in enumerate(hs):\n        while st and hs[st[-1]] > h:\n            height = hs[st.pop()]\n            left = st[-1] if st else -1\n            best = max(best, height * (i - left - 1))\n        st.append(i)\n    return best`,
        javascript: `var largestRectangleArea = function(heights) {\n    const st = [];\n    let best = 0;\n    const h = heights.concat([0]);\n    for (let i = 0; i < h.length; i++) {\n        while (st.length > 0 && h[st[st.length - 1]] > h[i]) {\n            const height = h[st.pop()];\n            const left = st.length === 0 ? -1 : st[st.length - 1];\n            best = Math.max(best, height * (i - left - 1));\n        }\n        st.push(i);\n    }\n    return best;\n};`,
      },
    };
  })(),

  // ── Simplify Path ───────────────────────────────────────────────
  (() => {
    const ref = (path: string) => {
      const st: string[] = [];
      for (const part of path.split("/")) {
        if (part === "" || part === ".") continue;
        if (part === "..") st.pop();
        else st.push(part);
      }
      return "/" + st.join("/");
    };
    return {
      slug: "simplify-path",
      title: "Simplify Path",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack"],
      signature: { funcName: "simplifyPath", params: [{ name: "path", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given an absolute Unix-style file path, return its **canonical form**:\n\n- Starts with a single `/`; directories separated by exactly one `/`; no trailing `/` (unless the result is the root).\n- `.` means current directory (ignored); `..` moves up one level (the root's parent is the root).",
        [
          { in: 'path = "/home/"', out: '"/home"' },
          { in: 'path = "/../"', out: '"/"' },
          { in: 'path = "/home//foo/"', out: '"/home/foo"' },
          { in: 'path = "/a/./b/../../c/"', out: '"/c"' },
        ],
        ["1 <= path.length <= 40", "Letters, digits, '.', '/' and '_' only; always starts with '/'"]),
      hints: [
        "Split on '/' and process each token against a stack of directory names.",
        "'..' pops (if possible); '.' and empty tokens are skipped; anything else pushes.",
      ],
      examples: [
        { input: '"/home/"', expectedOutput: "/home" },
        { input: '"/../"', expectedOutput: "/" },
        { input: '"/home//foo/"', expectedOutput: "/home/foo" },
        { input: '"/a/./b/../../c/"', expectedOutput: "/c" },
      ],
      gen: (rng: Rng) => {
        const segs = ["a", "b", "home", "foo", "..", ".", "", "x_1"];
        const path = "/" + Array.from({ length: ri(rng, 1, 8) }, () => segs[ri(rng, 0, segs.length - 1)]).join("/") + (rng() < 0.5 ? "/" : "");
        return { input: `"${path}"`, expectedOutput: ref(path) };
      },
      solutions: {
        python: `def simplifyPath(path: str) -> str:\n    st = []\n    for part in path.split("/"):\n        if part == "" or part == ".":\n            continue\n        if part == "..":\n            if st:\n                st.pop()\n        else:\n            st.append(part)\n    return "/" + "/".join(st)`,
        javascript: `var simplifyPath = function(path) {\n    const st = [];\n    for (const part of path.split("/")) {\n        if (part === "" || part === ".") continue;\n        if (part === "..") st.pop();\n        else st.push(part);\n    }\n    return "/" + st.join("/");\n};`,
      },
    };
  })(),

  // ── Decode String ───────────────────────────────────────────────
  (() => {
    const ref = (s: string) => {
      const countSt: number[] = [];
      const strSt: string[] = [];
      let cur = "", num = 0;
      for (const ch of s) {
        if (ch >= "0" && ch <= "9") num = num * 10 + (ch.charCodeAt(0) - 48);
        else if (ch === "[") {
          countSt.push(num);
          strSt.push(cur);
          num = 0;
          cur = "";
        } else if (ch === "]") {
          const repeat = countSt.pop()!;
          cur = strSt.pop()! + cur.repeat(repeat);
        } else {
          cur += ch;
        }
      }
      return cur;
    };
    const genEncoded = (rng: Rng, depth: number): string => {
      const parts = ri(rng, 1, 3);
      let out = "";
      for (let i = 0; i < parts; i++) {
        if (depth > 0 && rng() < 0.45) {
          out += `${ri(rng, 1, 3)}[${genEncoded(rng, depth - 1)}]`;
        } else {
          out += randLower(rng, 1, 4, "abc");
        }
      }
      return out;
    };
    return {
      slug: "decode-string",
      title: "Decode String",
      difficulty: "MEDIUM" as const,
      tags: ["String", "Stack", "Recursion"],
      signature: { funcName: "decodeString", params: [{ name: "s", type: "string" as const }], returns: "string" as const },
      description: describe(
        "Given an encoded string, return its decoded form. The rule `k[encoded_string]` means the bracket content is repeated exactly `k` times. The input is always valid; digits appear only as repeat counts.",
        [
          { in: 's = "3[a]2[bc]"', out: '"aaabcbc"' },
          { in: 's = "3[a2[c]]"', out: '"accaccacc"' },
          { in: 's = "2[abc]3[cd]ef"', out: '"abcabccdcdcdef"' },
        ],
        ["1 <= s.length <= 30", "1 <= k <= 3", "Nesting depth <= 2; output length <= 300."]),
      hints: [
        "Keep two stacks: repeat counts and the string built so far, pushed at every '['.",
        "On ']', pop both and append the repeated inner string to the restored outer one.",
      ],
      examples: [
        { input: '"3[a]2[bc]"', expectedOutput: "aaabcbc" },
        { input: '"3[a2[c]]"', expectedOutput: "accaccacc" },
        { input: '"2[abc]3[cd]ef"', expectedOutput: "abcabccdcdcdef" },
      ],
      gen: (rng: Rng) => {
        const s = genEncoded(rng, 2);
        return { input: `"${s}"`, expectedOutput: ref(s) };
      },
      solutions: {
        python: `def decodeString(s: str) -> str:\n    count_st = []\n    str_st = []\n    cur = ""\n    num = 0\n    for ch in s:\n        if ch.isdigit():\n            num = num * 10 + int(ch)\n        elif ch == "[":\n            count_st.append(num)\n            str_st.append(cur)\n            num = 0\n            cur = ""\n        elif ch == "]":\n            repeat = count_st.pop()\n            cur = str_st.pop() + cur * repeat\n        else:\n            cur += ch\n    return cur`,
        javascript: `var decodeString = function(s) {\n    const countSt = [];\n    const strSt = [];\n    let cur = "", num = 0;\n    for (const ch of s) {\n        if (ch >= "0" && ch <= "9") {\n            num = num * 10 + (ch.charCodeAt(0) - 48);\n        } else if (ch === "[") {\n            countSt.push(num);\n            strSt.push(cur);\n            num = 0;\n            cur = "";\n        } else if (ch === "]") {\n            const repeat = countSt.pop();\n            cur = strSt.pop() + cur.repeat(repeat);\n        } else {\n            cur += ch;\n        }\n    }\n    return cur;\n};`,
      },
    };
  })(),

  // ── Asteroid Collision ──────────────────────────────────────────
  (() => {
    const ref = (asteroids: number[]) => {
      const st: number[] = [];
      for (const a of asteroids) {
        let alive = true;
        while (alive && a < 0 && st.length > 0 && st[st.length - 1] > 0) {
          const top = st[st.length - 1];
          if (top < -a) st.pop();
          else if (top === -a) { st.pop(); alive = false; }
          else alive = false;
        }
        if (alive) st.push(a);
      }
      return st;
    };
    return {
      slug: "asteroid-collision",
      title: "Asteroid Collision",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Simulation"],
      signature: { funcName: "asteroidCollision", params: [{ name: "asteroids", type: "int[]" as const }], returns: "int[]" as const },
      description: describe(
        "Asteroids move along a row: the absolute value is the **size**, the sign is the **direction** (positive → right, negative → left), all at equal speed.\n\nWhen two asteroids meet, the smaller explodes (both explode if equal). Asteroids moving the same direction never meet. Return the state after all collisions.",
        [
          { in: "asteroids = [5,10,-5]", out: "[5,10]", note: "10 destroys -5." },
          { in: "asteroids = [8,-8]", out: "[]", note: "Equal sizes — both explode." },
          { in: "asteroids = [10,2,-5]", out: "[10]" },
        ],
        ["2 <= asteroids.length <= 30", "-100 <= asteroids[i] <= 100, asteroids[i] != 0"]),
      hints: [
        "Only a right-mover on the stack and an incoming left-mover collide.",
        "Resolve collisions in a loop: the incoming asteroid may destroy several stack tops.",
      ],
      examples: [
        { input: "[5,10,-5]", expectedOutput: "[5,10]" },
        { input: "[8,-8]", expectedOutput: "[]" },
        { input: "[10,2,-5]", expectedOutput: "[10]" },
      ],
      gen: (rng: Rng) => {
        const asteroids = Array.from({ length: ri(rng, 2, 30) }, () => {
          const v = ri(rng, 1, 100);
          return rng() < 0.5 ? v : -v;
        });
        return { input: fmtIntArr(asteroids), expectedOutput: fmtIntArr(ref(asteroids)) };
      },
      solutions: {
        python: `from typing import List\n\ndef asteroidCollision(asteroids: List[int]) -> List[int]:\n    st = []\n    for a in asteroids:\n        alive = True\n        while alive and a < 0 and st and st[-1] > 0:\n            top = st[-1]\n            if top < -a:\n                st.pop()\n            elif top == -a:\n                st.pop()\n                alive = False\n            else:\n                alive = False\n        if alive:\n            st.append(a)\n    return st`,
        javascript: `var asteroidCollision = function(asteroids) {\n    const st = [];\n    for (const a of asteroids) {\n        let alive = true;\n        while (alive && a < 0 && st.length > 0 && st[st.length - 1] > 0) {\n            const top = st[st.length - 1];\n            if (top < -a) {\n                st.pop();\n            } else if (top === -a) {\n                st.pop();\n                alive = false;\n            } else {\n                alive = false;\n            }\n        }\n        if (alive) st.push(a);\n    }\n    return st;\n};`,
      },
    };
  })(),

  // ── Car Fleet ───────────────────────────────────────────────────
  (() => {
    const ref = (target: number, position: number[], speed: number[]) => {
      const cars = position
        .map((p, i) => ({ p, time: (target - p) / speed[i] }))
        .sort((a, b) => b.p - a.p);
      let fleets = 0, lead = -1;
      for (const c of cars) {
        if (c.time > lead) {
          fleets++;
          lead = c.time;
        }
      }
      return fleets;
    };
    return {
      slug: "car-fleet",
      title: "Car Fleet",
      difficulty: "MEDIUM" as const,
      tags: ["Array", "Stack", "Sorting", "Monotonic Stack"],
      signature: { funcName: "carFleet", params: [{ name: "target", type: "int" as const }, { name: "position", type: "int[]" as const }, { name: "speed", type: "int[]" as const }], returns: "int" as const },
      description: describe(
        "`n` cars head to a destination `target` miles away. Car `i` starts at `position[i]` (all distinct) with speed `speed[i]`. A faster car that catches up to a slower one slows to match it, forming a **fleet**. A car that catches a fleet exactly at the target still counts as the same fleet.\n\nReturn the **number of fleets** that arrive.",
        [
          { in: "target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]", out: "3" },
          { in: "target = 10, position = [3], speed = [3]", out: "1" },
          { in: "target = 100, position = [0,2,4], speed = [4,2,1]", out: "1" },
        ],
        ["1 <= position.length == speed.length <= 25", "0 <= position[i] < target <= 1000 (distinct)", "1 <= speed[i] <= 100"]),
      hints: [
        "Sort by starting position (closest to target first) and compute each car's arrival time.",
        "Scan: a car whose time exceeds the current lead time starts a new fleet.",
      ],
      examples: [
        { input: "12\n[10,8,0,5,3]\n[2,4,1,1,3]", expectedOutput: "3" },
        { input: "10\n[3]\n[3]", expectedOutput: "1" },
        { input: "100\n[0,2,4]\n[4,2,1]", expectedOutput: "1" },
      ],
      gen: (rng: Rng) => {
        const target = ri(rng, 30, 1000);
        const pool = shuffle(rng, Array.from({ length: target }, (_, i) => i));
        const n = ri(rng, 1, 25);
        const position = pool.slice(0, n);
        const speed = Array.from({ length: n }, () => ri(rng, 1, 100));
        return {
          input: `${target}\n${fmtIntArr(position)}\n${fmtIntArr(speed)}`,
          expectedOutput: String(ref(target, position, speed)),
        };
      },
      solutions: {
        python: `from typing import List\n\ndef carFleet(target: int, position: List[int], speed: List[int]) -> int:\n    cars = sorted(zip(position, speed), key=lambda c: -c[0])\n    fleets = 0\n    lead = -1.0\n    for p, s in cars:\n        time = (target - p) / s\n        if time > lead:\n            fleets += 1\n            lead = time\n    return fleets`,
        javascript: `var carFleet = function(target, position, speed) {\n    const cars = position\n        .map(function(p, i) { return { p: p, time: (target - p) / speed[i] }; })\n        .sort(function(a, b) { return b.p - a.p; });\n    let fleets = 0, lead = -1;\n    for (const c of cars) {\n        if (c.time > lead) {\n            fleets++;\n            lead = c.time;\n        }\n    }\n    return fleets;\n};`,
      },
    };
  })(),

];
