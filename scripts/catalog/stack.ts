/** Stack & Queue — hand-authored classics.
 *  JS solutions must be Node 12-safe: no ??, ?., replaceAll, or at(). */

import { bool, describe, explain, fmtIntArr, fmtStrArr, randLower, ri, shuffle, type CatalogProblem, type Rng } from "./types.js";

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
      editorial: explain({
        idea: "Brackets nest, so at any point the only opener a closing bracket is allowed to match is the **most recent one still open**. That is last-in-first-out — precisely a stack. Counting brackets is not enough: `\"([)]\"` has the right counts and is still invalid, because the order is wrong.",
        steps: [
          "Keep a map from each closing bracket to the opening bracket it expects.",
          "Scan the string once. On an opener, push it.",
          "On a closer, pop the top and check it is the matching opener. If the stack is empty or the popped bracket is the wrong type, the string is invalid — return immediately.",
          "After the scan, the string is valid only if the stack is empty. Anything left over is an opener that was never closed.",
        ],
        why: "The stack always holds the openers that are still waiting to be closed, innermost on top. When a closer arrives, correct nesting demands it pair with that innermost opener — no other pairing can produce a valid string. So the greedy match at the top is forced, never a guess, and one pass settles it.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "A closer arriving on an **empty** stack is invalid, not something to skip. (The Python solution tests `not st` explicitly; the JavaScript one gets it free, since `pop()` on an empty array returns `undefined`, which never equals a bracket.)",
          "Finishing the scan without a mismatch is not enough — unclosed openers left on the stack mean invalid.",
          "The empty string is valid: the loop never runs and the stack ends empty.",
        ],
      }),
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

        typescript: `function isValid(s: string): boolean {\n    const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };\n    const st: string[] = [];\n    for (let i = 0; i < s.length; i++) {\n        const ch = s[i];\n        if (ch === "(" || ch === "[" || ch === "{") st.push(ch);\n        else if (st.pop() !== pairs[ch]) return false;\n    }\n    return st.length === 0;\n}`,
              java: `public static boolean isValid(String s) {\n    Deque<Character> st = new ArrayDeque<>();\n    for (char ch : s.toCharArray()) {\n        if (ch == '(' || ch == '[' || ch == '{') {\n            st.push(ch);\n        } else {\n            if (st.isEmpty()) return false;\n            char top = st.pop();\n            if ((ch == ')' && top != '(') || (ch == ']' && top != '[') || (ch == '}' && top != '{')) return false;\n        }\n    }\n    return st.isEmpty();\n}`,
              cpp: `bool isValid(string s) {\n    vector<char> st;\n    for (char ch : s) {\n        if (ch == '(' || ch == '[' || ch == '{') {\n            st.push_back(ch);\n        } else {\n            if (st.empty()) return false;\n            char top = st.back();\n            st.pop_back();\n            if ((ch == ')' && top != '(') || (ch == ']' && top != '[') || (ch == '}' && top != '{')) return false;\n        }\n    }\n    return st.empty();\n}`,
              c: `bool isValid(const char* s) {\n    int n = (int) strlen(s);\n    char* st = (char*) malloc(n + 1);\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        char ch = s[i];\n        if (ch == '(' || ch == '[' || ch == '{') {\n            st[top++] = ch;\n        } else {\n            if (top == 0) { free(st); return false; }\n            char t = st[--top];\n            if ((ch == ')' && t != '(') || (ch == ']' && t != '[') || (ch == '}' && t != '{')) { free(st); return false; }\n        }\n    }\n    bool ok = (top == 0);\n    free(st);\n    return ok;\n}`,
              csharp: `public static bool IsValid(string s)\n{\n    var st = new Stack<char>();\n    foreach (char ch in s)\n    {\n        if (ch == '(' || ch == '[' || ch == '{')\n        {\n            st.Push(ch);\n        }\n        else\n        {\n            if (st.Count == 0) return false;\n            char top = st.Pop();\n            if ((ch == ')' && top != '(') || (ch == ']' && top != '[') || (ch == '}' && top != '{')) return false;\n        }\n    }\n    return st.Count == 0;\n}`,
              go: `func isValid(s string) bool {\n	st := []byte{}\n	for i := 0; i < len(s); i++ {\n		ch := s[i]\n		if ch == '(' || ch == '[' || ch == '{' {\n			st = append(st, ch)\n		} else {\n			if len(st) == 0 {\n				return false\n			}\n			top := st[len(st)-1]\n			st = st[:len(st)-1]\n			if (ch == ')' && top != '(') || (ch == ']' && top != '[') || (ch == '}' && top != '{') {\n				return false\n			}\n		}\n	}\n	return len(st) == 0\n}`,
              kotlin: `fun isValid(s: String): Boolean {\n    val st = mutableListOf<Char>()\n    for (ch in s) {\n        if (ch == '(' || ch == '[' || ch == '{') {\n            st.add(ch)\n        } else {\n            if (st.isEmpty()) return false\n            val top = st.removeAt(st.size - 1)\n            if ((ch == ')' && top != '(') || (ch == ']' && top != '[') || (ch == '}' && top != '{')) return false\n        }\n    }\n    return st.isEmpty()\n}`,
              swift: `func isValid(_ s: String) -> Bool {\n    var st: [Character] = []\n    for ch in s {\n        if ch == "(" || ch == "[" || ch == "{" {\n            st.append(ch)\n        } else {\n            if st.isEmpty { return false }\n            let top = st.removeLast()\n            if (ch == ")" && top != "(") || (ch == "]" && top != "[") || (ch == "}" && top != "{") { return false }\n        }\n    }\n    return st.isEmpty\n}`,
              rust: `fn isValid(s: String) -> bool {\n    let mut st: Vec<char> = Vec::new();\n    for ch in s.chars() {\n        if ch == '(' || ch == '[' || ch == '{' {\n            st.push(ch);\n        } else {\n            match st.pop() {\n                None => return false,\n                Some(top) => {\n                    if (ch == ')' && top != '(') || (ch == ']' && top != '[') || (ch == '}' && top != '{') {\n                        return false;\n                    }\n                }\n            }\n        }\n    }\n    st.is_empty()\n}`,
              php: `function isValid($s) {\n    $st = array();\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $ch = $s[$i];\n        if ($ch === '(' || $ch === '[' || $ch === '{') {\n            array_push($st, $ch);\n        } else {\n            if (count($st) === 0) return false;\n            $top = array_pop($st);\n            if (($ch === ')' && $top !== '(') || ($ch === ']' && $top !== '[') || ($ch === '}' && $top !== '{')) return false;\n        }\n    }\n    return count($st) === 0;\n}`,
              ruby: `def isValid(s)\n  st = []\n  s.each_char do |ch|\n    if ch == '(' || ch == '[' || ch == '{'\n      st.push(ch)\n    else\n      return false if st.empty?\n      top = st.pop\n      return false if (ch == ')' && top != '(') || (ch == ']' && top != '[') || (ch == '}' && top != '{')\n    end\n  end\n  st.empty?\nend`,
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
      editorial: explain({
        idea: "Postfix notation exists precisely so that no precedence rules and no parentheses are needed — the order of the tokens already encodes the tree. An operator always applies to the two subexpressions immediately before it, so operands can simply wait on a stack until an operator claims them.",
        steps: [
          "Scan the tokens left to right, keeping a stack of computed values.",
          "If the token is a number, push it.",
          "If it is an operator, pop twice. The **first** pop is the right operand `b`, the **second** is the left operand `a`.",
          "Compute `a op b` and push the result back — a finished subexpression is just another operand.",
          "The single value left on the stack at the end is the answer.",
        ],
        why: "By induction, every value on the stack is a fully evaluated subexpression. When an operator is read, the expression is valid, so its two operands are the two most recently completed subexpressions — which are exactly the top two entries. Replacing them with the result keeps the invariant, so the last remaining value is the whole expression.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Pop order is the classic bug. `a` is the *second* pop. It makes no difference for `+` and `*`, but reversing it silently breaks `-` and `/`.",
          "Division must truncate **toward zero**, not floor. In Python, `-7 // 2` is `-4` — wrong here; `int(-7 / 2)` gives `-3`, which is why the solution divides then truncates. JavaScript needs `Math.trunc`, since `/` yields a float.",
        ],
      }),
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
              typescript: `function evalRPN(tokens: string[]): number {\n    const st: number[] = [];\n    for (let i = 0; i < tokens.length; i++) {\n        const t = tokens[i];\n        if (t === "+" || t === "-" || t === "*" || t === "/") {\n            const b = st.pop() as number;\n            const a = st.pop() as number;\n            if (t === "+") st.push(a + b);\n            else if (t === "-") st.push(a - b);\n            else if (t === "*") st.push(a * b);\n            else {\n                const q = a / b;\n                st.push(q < 0 ? Math.ceil(q) : Math.floor(q));\n            }\n        } else {\n            st.push(parseInt(t, 10));\n        }\n    }\n    return st[0];\n}`,
              java: `public static int evalRPN(String[] tokens) {\n    Deque<Integer> st = new ArrayDeque<>();\n    for (String t : tokens) {\n        if (t.equals("+") || t.equals("-") || t.equals("*") || t.equals("/")) {\n            int b = st.pop();\n            int a = st.pop();\n            if (t.equals("+")) st.push(a + b);\n            else if (t.equals("-")) st.push(a - b);\n            else if (t.equals("*")) st.push(a * b);\n            else st.push(a / b);\n        } else {\n            st.push(Integer.parseInt(t));\n        }\n    }\n    return st.pop();\n}`,
              cpp: `int evalRPN(vector<string>& tokens) {\n    vector<int> st;\n    for (const string& t : tokens) {\n        if (t == "+" || t == "-" || t == "*" || t == "/") {\n            int b = st.back(); st.pop_back();\n            int a = st.back(); st.pop_back();\n            if (t == "+") st.push_back(a + b);\n            else if (t == "-") st.push_back(a - b);\n            else if (t == "*") st.push_back(a * b);\n            else st.push_back(a / b);\n        } else {\n            st.push_back(stoi(t));\n        }\n    }\n    return st.back();\n}`,
              c: `int evalRPN(char** tokens, int tokensSize) {\n    int* st = (int*) malloc((tokensSize + 1) * sizeof(int));\n    int top = 0;\n    for (int i = 0; i < tokensSize; i++) {\n        const char* t = tokens[i];\n        if (strlen(t) == 1 && (t[0] == '+' || t[0] == '-' || t[0] == '*' || t[0] == '/')) {\n            int b = st[--top];\n            int a = st[--top];\n            if (t[0] == '+') st[top++] = a + b;\n            else if (t[0] == '-') st[top++] = a - b;\n            else if (t[0] == '*') st[top++] = a * b;\n            else st[top++] = a / b;\n        } else {\n            st[top++] = atoi(t);\n        }\n    }\n    int r = st[top - 1];\n    free(st);\n    return r;\n}`,
              csharp: `public static int EvalRPN(string[] tokens)\n{\n    var st = new Stack<int>();\n    foreach (string t in tokens)\n    {\n        if (t == "+" || t == "-" || t == "*" || t == "/")\n        {\n            int b = st.Pop();\n            int a = st.Pop();\n            if (t == "+") st.Push(a + b);\n            else if (t == "-") st.Push(a - b);\n            else if (t == "*") st.Push(a * b);\n            else st.Push(a / b);\n        }\n        else\n        {\n            st.Push(int.Parse(t));\n        }\n    }\n    return st.Pop();\n}`,
              go: `func evalRPN(tokens []string) int {\n	st := []int{}\n	for _, t := range tokens {\n		if t == "+" || t == "-" || t == "*" || t == "/" {\n			b := st[len(st)-1]\n			a := st[len(st)-2]\n			st = st[:len(st)-2]\n			switch t {\n			case "+":\n				st = append(st, a+b)\n			case "-":\n				st = append(st, a-b)\n			case "*":\n				st = append(st, a*b)\n			default:\n				st = append(st, a/b)\n			}\n		} else {\n			v, _ := strconv.Atoi(t)\n			st = append(st, v)\n		}\n	}\n	return st[len(st)-1]\n}`,
              kotlin: `fun evalRPN(tokens: Array<String>): Int {\n    val st = mutableListOf<Int>()\n    for (t in tokens) {\n        if (t == "+" || t == "-" || t == "*" || t == "/") {\n            val b = st.removeAt(st.size - 1)\n            val a = st.removeAt(st.size - 1)\n            st.add(when (t) {\n                "+" -> a + b\n                "-" -> a - b\n                "*" -> a * b\n                else -> a / b\n            })\n        } else {\n            st.add(t.toInt())\n        }\n    }\n    return st[st.size - 1]\n}`,
              swift: `func evalRPN(_ tokens: [String]) -> Int {\n    var st: [Int] = []\n    for t in tokens {\n        if t == "+" || t == "-" || t == "*" || t == "/" {\n            let b = st.removeLast()\n            let a = st.removeLast()\n            if t == "+" { st.append(a + b) }\n            else if t == "-" { st.append(a - b) }\n            else if t == "*" { st.append(a * b) }\n            else { st.append(a / b) }\n        } else {\n            st.append(Int(t)!)\n        }\n    }\n    return st[st.count - 1]\n}`,
              rust: `fn evalRPN(tokens: Vec<String>) -> i32 {\n    let mut st: Vec<i32> = Vec::new();\n    for t in tokens.iter() {\n        if t == "+" || t == "-" || t == "*" || t == "/" {\n            let b = st.pop().unwrap();\n            let a = st.pop().unwrap();\n            let v = match t.as_str() {\n                "+" => a + b,\n                "-" => a - b,\n                "*" => a * b,\n                _ => a / b,\n            };\n            st.push(v);\n        } else {\n            st.push(t.parse::<i32>().unwrap());\n        }\n    }\n    st[st.len() - 1]\n}`,
              php: `function evalRPN($tokens) {\n    $st = array();\n    foreach ($tokens as $t) {\n        if ($t === "+" || $t === "-" || $t === "*" || $t === "/") {\n            $b = array_pop($st);\n            $a = array_pop($st);\n            if ($t === "+") $r = $a + $b;\n            elseif ($t === "-") $r = $a - $b;\n            elseif ($t === "*") $r = $a * $b;\n            else $r = intdiv($a, $b);\n            array_push($st, $r);\n        } else {\n            array_push($st, intval($t));\n        }\n    }\n    return $st[count($st) - 1];\n}`,
              ruby: `def evalRPN(tokens)\n  st = []\n  tokens.each do |t|\n    if t == "+" || t == "-" || t == "*" || t == "/"\n      b = st.pop\n      a = st.pop\n      case t\n      when "+" then st.push(a + b)\n      when "-" then st.push(a - b)\n      when "*" then st.push(a * b)\n      else\n        q = a.abs / b.abs\n        q = -q if (a < 0) != (b < 0)\n        st.push(q)\n      end\n    else\n      st.push(t.to_i)\n    end\n  end\n  st[-1]\nend`,
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
      editorial: explain({
        idea: "The brute force asks, for each day, \"how far to the next warmer one?\" and rescans the future — `O(n²)`. Turn it around: when a warm day arrives, it is the answer for **every** pending colder day at once. Keep the unanswered days on a stack and let each new day settle all the ones it beats.",
        steps: [
          "Start with an answer array of zeros — a day that is never resolved keeps `0`, which is exactly what the problem asks for.",
          "Keep a stack of **indices** of days still waiting for a warmer one. Their temperatures decrease from the bottom of the stack to the top.",
          "For each day `i`: while the stack is non-empty and the day on top is colder than day `i`, pop that index `j` and record `answer[j] = i - j`.",
          "Push `i`. It is now the newest unanswered day, and it is colder than everything left below it, so the stack stays decreasing.",
        ],
        why: "Index `j` is popped by the first day after it that is warmer: any earlier warmer day would have popped it already, and days that are colder get pushed on top without disturbing it. So the `i` that pops `j` is genuinely the nearest warmer day, and `i - j` is the wait.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Push **indices**, not temperatures — the answer is a distance, so the position is what you need on pop.",
          "The inner `while` is a loop, not an `if`: one warm day can resolve a long run of colder days.",
          "Although there is a nested loop, the cost is linear — each index is pushed once and popped at most once.",
        ],
      }),
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
              typescript: `function dailyTemperatures(temperatures: number[]): number[] {\n    const n = temperatures.length;\n    const out: number[] = [];\n    for (let i = 0; i < n; i++) out.push(0);\n    const st: number[] = [];\n    for (let i = 0; i < n; i++) {\n        while (st.length > 0 && temperatures[st[st.length - 1]] < temperatures[i]) {\n            const j = st.pop() as number;\n            out[j] = i - j;\n        }\n        st.push(i);\n    }\n    return out;\n}`,
              java: `public static int[] dailyTemperatures(int[] temperatures) {\n    int n = temperatures.length;\n    int[] out = new int[n];\n    Deque<Integer> st = new ArrayDeque<>();\n    for (int i = 0; i < n; i++) {\n        while (!st.isEmpty() && temperatures[st.peek()] < temperatures[i]) {\n            int j = st.pop();\n            out[j] = i - j;\n        }\n        st.push(i);\n    }\n    return out;\n}`,
              cpp: `vector<int> dailyTemperatures(vector<int>& temperatures) {\n    int n = temperatures.size();\n    vector<int> out(n, 0);\n    vector<int> st;\n    for (int i = 0; i < n; i++) {\n        while (!st.empty() && temperatures[st.back()] < temperatures[i]) {\n            int j = st.back();\n            st.pop_back();\n            out[j] = i - j;\n        }\n        st.push_back(i);\n    }\n    return out;\n}`,
              c: `int* dailyTemperatures(int* temperatures, int temperaturesSize, int* returnSize) {\n    int n = temperaturesSize;\n    int* out = (int*) calloc(n > 0 ? n : 1, sizeof(int));\n    int* st = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        while (top > 0 && temperatures[st[top - 1]] < temperatures[i]) {\n            int j = st[--top];\n            out[j] = i - j;\n        }\n        st[top++] = i;\n    }\n    free(st);\n    *returnSize = n;\n    return out;\n}`,
              csharp: `public static int[] DailyTemperatures(int[] temperatures)\n{\n    int n = temperatures.Length;\n    int[] res = new int[n];\n    var st = new Stack<int>();\n    for (int i = 0; i < n; i++)\n    {\n        while (st.Count > 0 && temperatures[st.Peek()] < temperatures[i])\n        {\n            int j = st.Pop();\n            res[j] = i - j;\n        }\n        st.Push(i);\n    }\n    return res;\n}`,
              go: `func dailyTemperatures(temperatures []int) []int {\n	n := len(temperatures)\n	out := make([]int, n)\n	st := []int{}\n	for i := 0; i < n; i++ {\n		for len(st) > 0 && temperatures[st[len(st)-1]] < temperatures[i] {\n			j := st[len(st)-1]\n			st = st[:len(st)-1]\n			out[j] = i - j\n		}\n		st = append(st, i)\n	}\n	return out\n}`,
              kotlin: `fun dailyTemperatures(temperatures: IntArray): IntArray {\n    val n = temperatures.size\n    val out = IntArray(n)\n    val st = mutableListOf<Int>()\n    for (i in 0 until n) {\n        while (st.isNotEmpty() && temperatures[st[st.size - 1]] < temperatures[i]) {\n            val j = st.removeAt(st.size - 1)\n            out[j] = i - j\n        }\n        st.add(i)\n    }\n    return out\n}`,
              swift: `func dailyTemperatures(_ temperatures: [Int]) -> [Int] {\n    let n = temperatures.count\n    var out = [Int](repeating: 0, count: n)\n    var st: [Int] = []\n    for i in 0..<n {\n        while !st.isEmpty && temperatures[st[st.count - 1]] < temperatures[i] {\n            let j = st.removeLast()\n            out[j] = i - j\n        }\n        st.append(i)\n    }\n    return out\n}`,
              rust: `fn dailyTemperatures(temperatures: Vec<i32>) -> Vec<i32> {\n    let n = temperatures.len();\n    let mut out = vec![0; n];\n    let mut st: Vec<usize> = Vec::new();\n    for i in 0..n {\n        while !st.is_empty() && temperatures[*st.last().unwrap()] < temperatures[i] {\n            let j = st.pop().unwrap();\n            out[j] = (i - j) as i32;\n        }\n        st.push(i);\n    }\n    out\n}`,
              php: `function dailyTemperatures($temperatures) {\n    $n = count($temperatures);\n    $out = array_fill(0, $n, 0);\n    $st = array();\n    for ($i = 0; $i < $n; $i++) {\n        while (count($st) > 0 && $temperatures[$st[count($st) - 1]] < $temperatures[$i]) {\n            $j = array_pop($st);\n            $out[$j] = $i - $j;\n        }\n        array_push($st, $i);\n    }\n    return $out;\n}`,
              ruby: `def dailyTemperatures(temperatures)\n  n = temperatures.length\n  out = Array.new(n, 0)\n  st = []\n  (0...n).each do |i|\n    while !st.empty? && temperatures[st[-1]] < temperatures[i]\n      j = st.pop\n      out[j] = i - j\n    end\n    st.push(i)\n  end\n  out\nend`,
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
      editorial: explain({
        idea: "Do not answer the queries one at a time. Solve the harder, more general question first — the next greater element for **every** entry of `nums2` — in one linear pass, store the results in a hash map, then answer each `nums1[i]` with a lookup. Because all values are distinct, a map keyed by *value* is unambiguous.",
        steps: [
          "Scan `nums2` left to right with a stack of values still waiting for a greater element (decreasing from bottom to top).",
          "For each `x`: while the stack top is smaller than `x`, pop it and record `next[popped] = x`.",
          "Push `x` and continue.",
          "Anything still on the stack at the end has no greater element to its right — leave it out of the map.",
          "Map `nums1` through the table, defaulting to `-1` for values the map does not contain.",
        ],
        why: "A value is popped by the first later value that exceeds it: anything smaller is pushed above it without resolving it, and anything larger would have popped it sooner. So the recorded answer is the true *next* greater element, and the leftovers are exactly the entries with none.",
        time: "O(n + m)",
        space: "O(n)",
        pitfalls: [
          "Do not search `nums2` afresh for every element of `nums1` — that is `O(n · m)` and misses the point of the problem.",
          "The distinct-values guarantee is what makes a value-keyed map legal. With duplicates you would have to key by index instead.",
          "Values with no greater element must default to `-1`; do not leave them unset.",
        ],
      }),
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
              typescript: `function nextGreaterElement(nums1: number[], nums2: number[]): number[] {\n    const next: { [k: number]: number } = {};\n    const st: number[] = [];\n    for (let i = 0; i < nums2.length; i++) {\n        const x = nums2[i];\n        while (st.length > 0 && st[st.length - 1] < x) {\n            next[st.pop() as number] = x;\n        }\n        st.push(x);\n    }\n    const out: number[] = [];\n    for (let i = 0; i < nums1.length; i++) {\n        const v = next[nums1[i]];\n        out.push(v === undefined ? -1 : v);\n    }\n    return out;\n}`,
              java: `public static int[] nextGreaterElement(int[] nums1, int[] nums2) {\n    Map<Integer, Integer> next = new HashMap<>();\n    Deque<Integer> st = new ArrayDeque<>();\n    for (int x : nums2) {\n        while (!st.isEmpty() && st.peek() < x) next.put(st.pop(), x);\n        st.push(x);\n    }\n    int[] out = new int[nums1.length];\n    for (int i = 0; i < nums1.length; i++) {\n        Integer v = next.get(nums1[i]);\n        out[i] = (v == null) ? -1 : v;\n    }\n    return out;\n}`,
              cpp: `vector<int> nextGreaterElement(vector<int>& nums1, vector<int>& nums2) {\n    unordered_map<int, int> next;\n    vector<int> st;\n    for (int x : nums2) {\n        while (!st.empty() && st.back() < x) {\n            next[st.back()] = x;\n            st.pop_back();\n        }\n        st.push_back(x);\n    }\n    vector<int> out;\n    for (int x : nums1) {\n        out.push_back(next.count(x) ? next[x] : -1);\n    }\n    return out;\n}`,
              c: `int* nextGreaterElement(int* nums1, int nums1Size, int* nums2, int nums2Size, int* returnSize) {\n    int next[256];\n    for (int i = 0; i < 256; i++) next[i] = -1;\n    int* st = (int*) malloc((nums2Size > 0 ? nums2Size : 1) * sizeof(int));\n    int top = 0;\n    for (int i = 0; i < nums2Size; i++) {\n        int x = nums2[i];\n        while (top > 0 && st[top - 1] < x) {\n            next[st[--top]] = x;\n        }\n        st[top++] = x;\n    }\n    free(st);\n    int* out = (int*) malloc((nums1Size > 0 ? nums1Size : 1) * sizeof(int));\n    for (int i = 0; i < nums1Size; i++) out[i] = next[nums1[i]];\n    *returnSize = nums1Size;\n    return out;\n}`,
              csharp: `public static int[] NextGreaterElement(int[] nums1, int[] nums2)\n{\n    var next = new Dictionary<int, int>();\n    var st = new Stack<int>();\n    foreach (int x in nums2)\n    {\n        while (st.Count > 0 && st.Peek() < x) next[st.Pop()] = x;\n        st.Push(x);\n    }\n    int[] res = new int[nums1.Length];\n    for (int i = 0; i < nums1.Length; i++)\n    {\n        res[i] = next.ContainsKey(nums1[i]) ? next[nums1[i]] : -1;\n    }\n    return res;\n}`,
              go: `func nextGreaterElement(nums1 []int, nums2 []int) []int {\n	next := map[int]int{}\n	st := []int{}\n	for _, x := range nums2 {\n		for len(st) > 0 && st[len(st)-1] < x {\n			next[st[len(st)-1]] = x\n			st = st[:len(st)-1]\n		}\n		st = append(st, x)\n	}\n	out := make([]int, len(nums1))\n	for i, x := range nums1 {\n		if v, ok := next[x]; ok {\n			out[i] = v\n		} else {\n			out[i] = -1\n		}\n	}\n	return out\n}`,
              kotlin: `fun nextGreaterElement(nums1: IntArray, nums2: IntArray): IntArray {\n    val next = HashMap<Int, Int>()\n    val st = mutableListOf<Int>()\n    for (x in nums2) {\n        while (st.isNotEmpty() && st[st.size - 1] < x) {\n            next[st.removeAt(st.size - 1)] = x\n        }\n        st.add(x)\n    }\n    return IntArray(nums1.size) { i -> next.getOrElse(nums1[i]) { -1 } }\n}`,
              swift: `func nextGreaterElement(_ nums1: [Int], _ nums2: [Int]) -> [Int] {\n    var next: [Int: Int] = [:]\n    var st: [Int] = []\n    for x in nums2 {\n        while !st.isEmpty && st[st.count - 1] < x {\n            next[st.removeLast()] = x\n        }\n        st.append(x)\n    }\n    return nums1.map { next[$0] ?? -1 }\n}`,
              rust: `fn nextGreaterElement(nums1: Vec<i32>, nums2: Vec<i32>) -> Vec<i32> {\n    use std::collections::HashMap;\n    let mut next: HashMap<i32, i32> = HashMap::new();\n    let mut st: Vec<i32> = Vec::new();\n    for &x in nums2.iter() {\n        while !st.is_empty() && *st.last().unwrap() < x {\n            let p = st.pop().unwrap();\n            next.insert(p, x);\n        }\n        st.push(x);\n    }\n    nums1.iter().map(|x| *next.get(x).unwrap_or(&-1)).collect()\n}`,
              php: `function nextGreaterElement($nums1, $nums2) {\n    $next = array();\n    $st = array();\n    foreach ($nums2 as $x) {\n        while (count($st) > 0 && $st[count($st) - 1] < $x) {\n            $next[array_pop($st)] = $x;\n        }\n        array_push($st, $x);\n    }\n    $out = array();\n    foreach ($nums1 as $x) {\n        $out[] = array_key_exists($x, $next) ? $next[$x] : -1;\n    }\n    return $out;\n}`,
              ruby: `def nextGreaterElement(nums1, nums2)\n  next_map = {}\n  st = []\n  nums2.each do |x|\n    while !st.empty? && st[-1] < x\n      next_map[st.pop] = x\n    end\n    st.push(x)\n  end\n  nums1.map { |x| next_map.fetch(x, -1) }\nend`,
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
      editorial: explain({
        idea: "This is the standard monotonic-stack scan with one twist: the search wraps. Rather than physically concatenating the array to itself, walk `2n` steps and index with `i % n`. The second lap gives every element left unresolved its chance to see the elements that come *before* it in the original order.",
        steps: [
          "Fill the answer array with `-1`, the value for elements that never find anything greater.",
          "Keep a stack of **indices** whose next greater element is still unknown.",
          "Loop `i` from `0` to `2n - 1` and take `x = nums[i % n]`.",
          "While the stack is non-empty and the value at the top index is less than `x`, pop and set that index's answer to `x`.",
          "Push `i` **only while `i < n`**. The second lap resolves; it never adds new work.",
        ],
        why: "Two laps suffice because the next greater element is at most `n - 1` steps away — beyond that you are back where you started. Restricting pushes to the first lap keeps exactly one stack entry per index, so no index is answered twice and the second lap only drains what the first left behind. Whatever survives both laps is a maximum of the array and correctly keeps `-1`.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Pushing during the second lap is the classic bug: indices get duplicated and can be overwritten with a later, non-nearest value.",
          "Store indices, not values — you need the position to write the answer, and duplicate values are allowed here.",
          "Use `nums[i % n]` for the value but the raw `i < n` test for pushing; mixing the two up breaks the wrap.",
        ],
      }),
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
              typescript: `function nextGreaterElements(nums: number[]): number[] {\n    const n = nums.length;\n    const out: number[] = [];\n    for (let i = 0; i < n; i++) out.push(-1);\n    const st: number[] = [];\n    for (let i = 0; i < 2 * n; i++) {\n        const x = nums[i % n];\n        while (st.length > 0 && nums[st[st.length - 1]] < x) {\n            out[st.pop() as number] = x;\n        }\n        if (i < n) st.push(i);\n    }\n    return out;\n}`,
              java: `public static int[] nextGreaterElements(int[] nums) {\n    int n = nums.length;\n    int[] out = new int[n];\n    Arrays.fill(out, -1);\n    Deque<Integer> st = new ArrayDeque<>();\n    for (int i = 0; i < 2 * n; i++) {\n        int x = nums[i % n];\n        while (!st.isEmpty() && nums[st.peek()] < x) out[st.pop()] = x;\n        if (i < n) st.push(i);\n    }\n    return out;\n}`,
              cpp: `vector<int> nextGreaterElements(vector<int>& nums) {\n    int n = nums.size();\n    vector<int> out(n, -1);\n    vector<int> st;\n    for (int i = 0; i < 2 * n; i++) {\n        int x = nums[i % n];\n        while (!st.empty() && nums[st.back()] < x) {\n            out[st.back()] = x;\n            st.pop_back();\n        }\n        if (i < n) st.push_back(i);\n    }\n    return out;\n}`,
              c: `int* nextGreaterElements(int* nums, int numsSize, int* returnSize) {\n    int n = numsSize;\n    int* out = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    for (int i = 0; i < n; i++) out[i] = -1;\n    int* st = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int top = 0;\n    for (int i = 0; i < 2 * n; i++) {\n        int x = nums[i % n];\n        while (top > 0 && nums[st[top - 1]] < x) out[st[--top]] = x;\n        if (i < n) st[top++] = i;\n    }\n    free(st);\n    *returnSize = n;\n    return out;\n}`,
              csharp: `public static int[] NextGreaterElements(int[] nums)\n{\n    int n = nums.Length;\n    int[] res = new int[n];\n    for (int i = 0; i < n; i++) res[i] = -1;\n    var st = new Stack<int>();\n    for (int i = 0; i < 2 * n; i++)\n    {\n        int x = nums[i % n];\n        while (st.Count > 0 && nums[st.Peek()] < x) res[st.Pop()] = x;\n        if (i < n) st.Push(i);\n    }\n    return res;\n}`,
              go: `func nextGreaterElements(nums []int) []int {\n	n := len(nums)\n	out := make([]int, n)\n	for i := range out {\n		out[i] = -1\n	}\n	st := []int{}\n	for i := 0; i < 2*n; i++ {\n		x := nums[i%n]\n		for len(st) > 0 && nums[st[len(st)-1]] < x {\n			out[st[len(st)-1]] = x\n			st = st[:len(st)-1]\n		}\n		if i < n {\n			st = append(st, i)\n		}\n	}\n	return out\n}`,
              kotlin: `fun nextGreaterElements(nums: IntArray): IntArray {\n    val n = nums.size\n    val out = IntArray(n) { -1 }\n    val st = mutableListOf<Int>()\n    for (i in 0 until 2 * n) {\n        val x = nums[i % n]\n        while (st.isNotEmpty() && nums[st[st.size - 1]] < x) {\n            out[st.removeAt(st.size - 1)] = x\n        }\n        if (i < n) st.add(i)\n    }\n    return out\n}`,
              swift: `func nextGreaterElements(_ nums: [Int]) -> [Int] {\n    let n = nums.count\n    var out = [Int](repeating: -1, count: n)\n    var st: [Int] = []\n    for i in 0..<(2 * n) {\n        let x = nums[i % n]\n        while !st.isEmpty && nums[st[st.count - 1]] < x {\n            out[st.removeLast()] = x\n        }\n        if i < n { st.append(i) }\n    }\n    return out\n}`,
              rust: `fn nextGreaterElements(nums: Vec<i32>) -> Vec<i32> {\n    let n = nums.len();\n    let mut out = vec![-1; n];\n    let mut st: Vec<usize> = Vec::new();\n    for i in 0..(2 * n) {\n        let x = nums[i % n];\n        while !st.is_empty() && nums[*st.last().unwrap()] < x {\n            let j = st.pop().unwrap();\n            out[j] = x;\n        }\n        if i < n {\n            st.push(i);\n        }\n    }\n    out\n}`,
              php: `function nextGreaterElements($nums) {\n    $n = count($nums);\n    $out = array_fill(0, $n, -1);\n    $st = array();\n    for ($i = 0; $i < 2 * $n; $i++) {\n        $x = $nums[$i % $n];\n        while (count($st) > 0 && $nums[$st[count($st) - 1]] < $x) {\n            $out[array_pop($st)] = $x;\n        }\n        if ($i < $n) array_push($st, $i);\n    }\n    return $out;\n}`,
              ruby: `def nextGreaterElements(nums)\n  n = nums.length\n  out = Array.new(n, -1)\n  st = []\n  (0...(2 * n)).each do |i|\n    x = nums[i % n]\n    while !st.empty? && nums[st[-1]] < x\n      out[st.pop] = x\n    end\n    st.push(i) if i < n\n  end\n  out\nend`,
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
      editorial: explain({
        idea: "The awkward part of this problem is the cascade: removing a pair can make two previously separated characters adjacent, which may then collide too. A stack handles that for free, because the character that *becomes* adjacent after a removal is exactly the one now on top.",
        steps: [
          "Keep a stack of the characters kept so far.",
          "For each character of `s`: if it equals the top of the stack, pop — the pair annihilates.",
          "Otherwise push it.",
          "Join the stack at the end. It **is** the answer; no extra passes are needed.",
        ],
        why: "The stack always holds the fully reduced version of the prefix scanned so far. Adding one character can only create a collision at the boundary — with the last kept character — and that is the top, which the comparison checks. Popping restores the invariant immediately. The problem also guarantees the result is unique regardless of removal order, so this single left-to-right pass is as valid as any other order.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Repeatedly scanning the string and cutting out pairs is `O(n²)` and needlessly restarts after every removal.",
          "After a pop, do **not** also push the current character — both characters of the pair are gone.",
          "Check the stack is non-empty before comparing with the top.",
        ],
      }),
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

        typescript: `function removeDuplicates(s: string): string {\n    const st: string[] = [];\n    for (let i = 0; i < s.length; i++) {\n        const ch = s[i];\n        if (st.length > 0 && st[st.length - 1] === ch) st.pop();\n        else st.push(ch);\n    }\n    return st.join("");\n}`,
              java: `public static String removeDuplicates(String s) {\n    StringBuilder st = new StringBuilder();\n    for (char ch : s.toCharArray()) {\n        int n = st.length();\n        if (n > 0 && st.charAt(n - 1) == ch) st.deleteCharAt(n - 1);\n        else st.append(ch);\n    }\n    return st.toString();\n}`,
              cpp: `string removeDuplicates(string s) {\n    string st;\n    for (char ch : s) {\n        if (!st.empty() && st.back() == ch) st.pop_back();\n        else st.push_back(ch);\n    }\n    return st;\n}`,
              c: `char* removeDuplicates(const char* s) {\n    int n = (int) strlen(s);\n    char* st = (char*) malloc(n + 1);\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        if (top > 0 && st[top - 1] == s[i]) top--;\n        else st[top++] = s[i];\n    }\n    st[top] = '\\0';\n    return st;\n}`,
              csharp: `public static string RemoveDuplicates(string s)\n{\n    char[] st = new char[s.Length];\n    int top = 0;\n    foreach (char ch in s)\n    {\n        if (top > 0 && st[top - 1] == ch) top--;\n        else st[top++] = ch;\n    }\n    return new string(st, 0, top);\n}`,
              go: `func removeDuplicates(s string) string {\n	st := []byte{}\n	for i := 0; i < len(s); i++ {\n		if len(st) > 0 && st[len(st)-1] == s[i] {\n			st = st[:len(st)-1]\n		} else {\n			st = append(st, s[i])\n		}\n	}\n	return string(st)\n}`,
              kotlin: `fun removeDuplicates(s: String): String {\n    val st = StringBuilder()\n    for (ch in s) {\n        if (st.isNotEmpty() && st[st.length - 1] == ch) st.deleteCharAt(st.length - 1)\n        else st.append(ch)\n    }\n    return st.toString()\n}`,
              swift: `func removeDuplicates(_ s: String) -> String {\n    var st: [Character] = []\n    for ch in s {\n        if let last = st.last, last == ch {\n            st.removeLast()\n        } else {\n            st.append(ch)\n        }\n    }\n    return String(st)\n}`,
              rust: `fn removeDuplicates(s: String) -> String {\n    let mut st: Vec<char> = Vec::new();\n    for ch in s.chars() {\n        if st.last() == Some(&ch) {\n            st.pop();\n        } else {\n            st.push(ch);\n        }\n    }\n    st.into_iter().collect()\n}`,
              php: `function removeDuplicates($s) {\n    $st = array();\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        if (count($st) > 0 && $st[count($st) - 1] === $s[$i]) array_pop($st);\n        else array_push($st, $s[$i]);\n    }\n    return implode("", $st);\n}`,
              ruby: `def removeDuplicates(s)\n  st = []\n  s.each_char do |ch|\n    if !st.empty? && st[-1] == ch\n      st.pop\n    else\n      st.push(ch)\n    end\n  end\n  st.join\nend`,
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
      editorial: explain({
        idea: "The result always has exactly `len(num) - k` digits, so length is fixed and only the digits themselves matter. For numbers of equal length, the **leftmost** digit dominates: making an earlier position smaller beats any improvement further right. So whenever a digit is followed by a smaller one, deleting it strictly shrinks the number — and that is a decision you can make greedily, left to right.",
        steps: [
          "Keep a stack of the digits kept so far and a budget `k` of deletions.",
          "For each digit `ch`: while budget remains and the stack top is **greater** than `ch`, pop it and spend one deletion.",
          "Push `ch`.",
          "If budget remains after the scan, the kept digits are non-decreasing — remove the last `k` from the **right**.",
          "Strip leading zeros, and return `\"0\"` if nothing is left.",
        ],
        why: "A digit with a smaller digit after it is bad in its position: deleting it promotes something smaller into a more significant place, which always lowers the value. Deleting it as early as possible is safe because the digits before it are already no greater than it. Once the kept digits are non-decreasing, no deletion can improve a leading position, so the cheapest remaining deletions are the least significant ones at the right end.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "Leftover deletions must come off the **right**. Taking them from the left would drop the most significant digits, which is the opposite of what you want.",
          "Strip leading zeros only at the end — `\"10200\"` with `k = 1` becomes `\"0200\"` and then `\"200\"`.",
          "Removing everything must return the string `\"0\"`, not an empty string.",
          "The pop test is strictly `>`. Popping on equal digits wastes deletions without lowering the value.",
        ],
      }),
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
              typescript: `function removeKdigits(num: string, k: number): string {\n    const st: string[] = [];\n    let rem = k;\n    for (let i = 0; i < num.length; i++) {\n        const ch = num[i];\n        while (rem > 0 && st.length > 0 && st[st.length - 1] > ch) {\n            st.pop();\n            rem--;\n        }\n        st.push(ch);\n    }\n    while (rem > 0 && st.length > 0) {\n        st.pop();\n        rem--;\n    }\n    const out = st.join("").replace(/^0+/, "");\n    return out === "" ? "0" : out;\n}`,
              java: `public static String removeKdigits(String num, int k) {\n    StringBuilder st = new StringBuilder();\n    int rem = k;\n    for (char ch : num.toCharArray()) {\n        while (rem > 0 && st.length() > 0 && st.charAt(st.length() - 1) > ch) {\n            st.deleteCharAt(st.length() - 1);\n            rem--;\n        }\n        st.append(ch);\n    }\n    while (rem > 0 && st.length() > 0) {\n        st.deleteCharAt(st.length() - 1);\n        rem--;\n    }\n    int i = 0;\n    while (i < st.length() && st.charAt(i) == '0') i++;\n    String out = st.substring(i);\n    return out.isEmpty() ? "0" : out;\n}`,
              cpp: `string removeKdigits(string num, int k) {\n    string st;\n    int rem = k;\n    for (char ch : num) {\n        while (rem > 0 && !st.empty() && st.back() > ch) {\n            st.pop_back();\n            rem--;\n        }\n        st.push_back(ch);\n    }\n    while (rem > 0 && !st.empty()) {\n        st.pop_back();\n        rem--;\n    }\n    size_t i = 0;\n    while (i < st.size() && st[i] == '0') i++;\n    string out = st.substr(i);\n    return out.empty() ? "0" : out;\n}`,
              c: `char* removeKdigits(const char* num, int k) {\n    int n = (int) strlen(num);\n    char* st = (char*) malloc(n + 2);\n    int top = 0;\n    int rem = k;\n    for (int i = 0; i < n; i++) {\n        char ch = num[i];\n        while (rem > 0 && top > 0 && st[top - 1] > ch) { top--; rem--; }\n        st[top++] = ch;\n    }\n    while (rem > 0 && top > 0) { top--; rem--; }\n    int i = 0;\n    while (i < top && st[i] == '0') i++;\n    int len = top - i;\n    char* out = (char*) malloc(len + 2);\n    if (len <= 0) {\n        out[0] = '0';\n        out[1] = '\\0';\n    } else {\n        memcpy(out, st + i, len);\n        out[len] = '\\0';\n    }\n    free(st);\n    return out;\n}`,
              csharp: `public static string RemoveKdigits(string num, int k)\n{\n    char[] st = new char[num.Length];\n    int top = 0;\n    int rem = k;\n    foreach (char ch in num)\n    {\n        while (rem > 0 && top > 0 && st[top - 1] > ch) { top--; rem--; }\n        st[top++] = ch;\n    }\n    while (rem > 0 && top > 0) { top--; rem--; }\n    int i = 0;\n    while (i < top && st[i] == '0') i++;\n    string res = new string(st, i, top - i);\n    return res.Length == 0 ? "0" : res;\n}`,
              go: `func removeKdigits(num string, k int) string {\n	st := []byte{}\n	rem := k\n	for i := 0; i < len(num); i++ {\n		ch := num[i]\n		for rem > 0 && len(st) > 0 && st[len(st)-1] > ch {\n			st = st[:len(st)-1]\n			rem--\n		}\n		st = append(st, ch)\n	}\n	for rem > 0 && len(st) > 0 {\n		st = st[:len(st)-1]\n		rem--\n	}\n	i := 0\n	for i < len(st) && st[i] == '0' {\n		i++\n	}\n	out := string(st[i:])\n	if out == "" {\n		return "0"\n	}\n	return out\n}`,
              kotlin: `fun removeKdigits(num: String, k: Int): String {\n    var rem = k\n    val st = StringBuilder()\n    for (ch in num) {\n        while (rem > 0 && st.isNotEmpty() && st[st.length - 1] > ch) {\n            st.deleteCharAt(st.length - 1)\n            rem--\n        }\n        st.append(ch)\n    }\n    while (rem > 0 && st.isNotEmpty()) {\n        st.deleteCharAt(st.length - 1)\n        rem--\n    }\n    var i = 0\n    while (i < st.length && st[i] == '0') i++\n    val out = st.substring(i)\n    return if (out.isEmpty()) "0" else out\n}`,
              swift: `func removeKdigits(_ num: String, _ k: Int) -> String {\n    var rem = k\n    var st: [Character] = []\n    for ch in num {\n        while rem > 0 && !st.isEmpty && st[st.count - 1] > ch {\n            st.removeLast()\n            rem -= 1\n        }\n        st.append(ch)\n    }\n    while rem > 0 && !st.isEmpty {\n        st.removeLast()\n        rem -= 1\n    }\n    var i = 0\n    while i < st.count && st[i] == "0" { i += 1 }\n    let out = String(st[i...])\n    return out.isEmpty ? "0" : out\n}`,
              rust: `fn removeKdigits(num: String, k: i32) -> String {\n    let mut rem = k;\n    let mut st: Vec<char> = Vec::new();\n    for ch in num.chars() {\n        while rem > 0 && !st.is_empty() && *st.last().unwrap() > ch {\n            st.pop();\n            rem -= 1;\n        }\n        st.push(ch);\n    }\n    while rem > 0 && !st.is_empty() {\n        st.pop();\n        rem -= 1;\n    }\n    let s: String = st.into_iter().collect();\n    let t = s.trim_start_matches('0');\n    if t.is_empty() { String::from("0") } else { String::from(t) }\n}`,
              php: `function removeKdigits($num, $k) {\n    $st = array();\n    $rem = $k;\n    $n = strlen($num);\n    for ($i = 0; $i < $n; $i++) {\n        $ch = $num[$i];\n        while ($rem > 0 && count($st) > 0 && $st[count($st) - 1] > $ch) {\n            array_pop($st);\n            $rem--;\n        }\n        array_push($st, $ch);\n    }\n    while ($rem > 0 && count($st) > 0) {\n        array_pop($st);\n        $rem--;\n    }\n    $out = ltrim(implode("", $st), "0");\n    return $out === "" ? "0" : $out;\n}`,
              ruby: `def removeKdigits(num, k)\n  st = []\n  rem = k\n  num.each_char do |ch|\n    while rem > 0 && !st.empty? && st[-1] > ch\n      st.pop\n      rem -= 1\n    end\n    st.push(ch)\n  end\n  while rem > 0 && !st.empty?\n    st.pop\n    rem -= 1\n  end\n  out = st.join.sub(/\\A0+/, "")\n  out.empty? ? "0" : out\nend`,
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
      editorial: explain({
        idea: "Every maximal rectangle is limited by its shortest bar, so it is enough to ask, for each bar: *if this bar's full height is the ceiling, how wide can the rectangle get?* It stretches left and right until it meets a strictly shorter bar. Finding those two boundaries naively is `O(n²)`; a single monotonic stack finds both in one pass.",
        steps: [
          "Append a sentinel bar of height `0` to the array. It is shorter than everything, so it forces the stack to drain at the end.",
          "Keep a stack of indices whose heights **increase** from the bottom to the top.",
          "For each index `i`: while the bar at the top of the stack is taller than `h[i]`, pop it. That popped bar's rectangle ends here.",
          "For the popped index, its height is `h[popped]`, its right boundary is `i`, and its left boundary is the index now on top of the stack (or `-1` if the stack is empty). The width is `i - left - 1`.",
          "Update the best area with `height × width`, then push `i`.",
        ],
        why: "When index `j` is popped at `i`, `i` is the first bar to the right of `j` that is shorter than `h[j]` — anything taller was pushed above `j` and popped before it. The entry directly below `j` is, by the increasing invariant, the nearest bar to the left shorter than `h[j]`. So the span between those two boundaries is exactly the widest rectangle of height `h[j]`, and since every bar is popped exactly once, every candidate is considered.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The width is `i - left - 1`, using the element **below** the popped one — not `i - popped`. Getting this wrong is the single most common bug here.",
          "Without the sentinel `0`, bars still on the stack at the end are never measured, and an increasing histogram returns a far too small answer.",
          "The left boundary is `-1` when the stack empties, meaning the rectangle reaches the start of the array.",
          "Heights may be `0`, which is fine — such a bar contributes area `0` and acts as a natural divider.",
        ],
      }),
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
              typescript: `function largestRectangleArea(heights: number[]): number {\n    const h = heights.slice();\n    h.push(0);\n    const st: number[] = [];\n    let best = 0;\n    for (let i = 0; i < h.length; i++) {\n        while (st.length > 0 && h[st[st.length - 1]] > h[i]) {\n            const height = h[st.pop() as number];\n            const left = st.length === 0 ? -1 : st[st.length - 1];\n            const area = height * (i - left - 1);\n            if (area > best) best = area;\n        }\n        st.push(i);\n    }\n    return best;\n}`,
              java: `public static int largestRectangleArea(int[] heights) {\n    int n = heights.length;\n    int[] h = new int[n + 1];\n    for (int i = 0; i < n; i++) h[i] = heights[i];\n    h[n] = 0;\n    Deque<Integer> st = new ArrayDeque<>();\n    int best = 0;\n    for (int i = 0; i <= n; i++) {\n        while (!st.isEmpty() && h[st.peek()] > h[i]) {\n            int height = h[st.pop()];\n            int left = st.isEmpty() ? -1 : st.peek();\n            best = Math.max(best, height * (i - left - 1));\n        }\n        st.push(i);\n    }\n    return best;\n}`,
              cpp: `int largestRectangleArea(vector<int>& heights) {\n    vector<int> h = heights;\n    h.push_back(0);\n    vector<int> st;\n    int best = 0;\n    for (int i = 0; i < (int) h.size(); i++) {\n        while (!st.empty() && h[st.back()] > h[i]) {\n            int height = h[st.back()];\n            st.pop_back();\n            int left = st.empty() ? -1 : st.back();\n            best = max(best, height * (i - left - 1));\n        }\n        st.push_back(i);\n    }\n    return best;\n}`,
              c: `int largestRectangleArea(int* heights, int heightsSize) {\n    int n = heightsSize;\n    int* h = (int*) malloc((n + 1) * sizeof(int));\n    for (int i = 0; i < n; i++) h[i] = heights[i];\n    h[n] = 0;\n    int* st = (int*) malloc((n + 2) * sizeof(int));\n    int top = 0;\n    int best = 0;\n    for (int i = 0; i <= n; i++) {\n        while (top > 0 && h[st[top - 1]] > h[i]) {\n            int height = h[st[--top]];\n            int left = (top == 0) ? -1 : st[top - 1];\n            int area = height * (i - left - 1);\n            if (area > best) best = area;\n        }\n        st[top++] = i;\n    }\n    free(h);\n    free(st);\n    return best;\n}`,
              csharp: `public static int LargestRectangleArea(int[] heights)\n{\n    int n = heights.Length;\n    int[] h = new int[n + 1];\n    for (int i = 0; i < n; i++) h[i] = heights[i];\n    h[n] = 0;\n    var st = new Stack<int>();\n    int best = 0;\n    for (int i = 0; i <= n; i++)\n    {\n        while (st.Count > 0 && h[st.Peek()] > h[i])\n        {\n            int height = h[st.Pop()];\n            int left = st.Count == 0 ? -1 : st.Peek();\n            int area = height * (i - left - 1);\n            if (area > best) best = area;\n        }\n        st.Push(i);\n    }\n    return best;\n}`,
              go: `func largestRectangleArea(heights []int) int {\n	h := append([]int{}, heights...)\n	h = append(h, 0)\n	st := []int{}\n	best := 0\n	for i := 0; i < len(h); i++ {\n		for len(st) > 0 && h[st[len(st)-1]] > h[i] {\n			height := h[st[len(st)-1]]\n			st = st[:len(st)-1]\n			left := -1\n			if len(st) > 0 {\n				left = st[len(st)-1]\n			}\n			area := height * (i - left - 1)\n			if area > best {\n				best = area\n			}\n		}\n		st = append(st, i)\n	}\n	return best\n}`,
              kotlin: `fun largestRectangleArea(heights: IntArray): Int {\n    val n = heights.size\n    val h = IntArray(n + 1)\n    for (i in 0 until n) h[i] = heights[i]\n    h[n] = 0\n    val st = mutableListOf<Int>()\n    var best = 0\n    for (i in 0..n) {\n        while (st.isNotEmpty() && h[st[st.size - 1]] > h[i]) {\n            val height = h[st.removeAt(st.size - 1)]\n            val left = if (st.isEmpty()) -1 else st[st.size - 1]\n            val area = height * (i - left - 1)\n            if (area > best) best = area\n        }\n        st.add(i)\n    }\n    return best\n}`,
              swift: `func largestRectangleArea(_ heights: [Int]) -> Int {\n    var h = heights\n    h.append(0)\n    var st: [Int] = []\n    var best = 0\n    for i in 0..<h.count {\n        while !st.isEmpty && h[st[st.count - 1]] > h[i] {\n            let height = h[st.removeLast()]\n            let left = st.isEmpty ? -1 : st[st.count - 1]\n            let area = height * (i - left - 1)\n            if area > best { best = area }\n        }\n        st.append(i)\n    }\n    return best\n}`,
              rust: `fn largestRectangleArea(heights: Vec<i32>) -> i32 {\n    let mut h = heights.clone();\n    h.push(0);\n    let mut st: Vec<usize> = Vec::new();\n    let mut best: i32 = 0;\n    for i in 0..h.len() {\n        while !st.is_empty() && h[*st.last().unwrap()] > h[i] {\n            let j = st.pop().unwrap();\n            let height = h[j];\n            let left: i64 = if st.is_empty() { -1 } else { *st.last().unwrap() as i64 };\n            let width = (i as i64) - left - 1;\n            let area = height * (width as i32);\n            if area > best { best = area; }\n        }\n        st.push(i);\n    }\n    best\n}`,
              php: `function largestRectangleArea($heights) {\n    $h = $heights;\n    $h[] = 0;\n    $st = array();\n    $best = 0;\n    $m = count($h);\n    for ($i = 0; $i < $m; $i++) {\n        while (count($st) > 0 && $h[$st[count($st) - 1]] > $h[$i]) {\n            $height = $h[array_pop($st)];\n            $left = count($st) === 0 ? -1 : $st[count($st) - 1];\n            $area = $height * ($i - $left - 1);\n            if ($area > $best) $best = $area;\n        }\n        array_push($st, $i);\n    }\n    return $best;\n}`,
              ruby: `def largestRectangleArea(heights)\n  h = heights + [0]\n  st = []\n  best = 0\n  (0...h.length).each do |i|\n    while !st.empty? && h[st[-1]] > h[i]\n      height = h[st.pop]\n      left = st.empty? ? -1 : st[-1]\n      area = height * (i - left - 1)\n      best = area if area > best\n    end\n    st.push(i)\n  end\n  best\nend`,
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
      editorial: explain({
        idea: "A canonical path is just the list of directories you actually end up in. Splitting on `/` turns the path into tokens, and each token is one of four things: a real directory name (go in), `..` (go up), `.` (stay), or empty (an artefact of `//` or a trailing slash). A stack of directory names models exactly that walk.",
        steps: [
          "Split the path on `/`. Runs of slashes and any trailing slash simply produce empty tokens.",
          "Skip every token that is empty or `.` — neither changes the directory.",
          "On `..`, pop the stack if it is non-empty. On the root, popping does nothing, which is the required behaviour.",
          "On anything else, push it as a directory name.",
          "Join the stack with `/` and prefix a single `/`. An empty stack gives `\"/\"` on its own.",
        ],
        why: "Splitting reduces every formatting quirk — doubled slashes, a trailing slash — to empty tokens, so the messy cases disappear before the logic runs. The stack then holds the current directory as an absolute chain from the root, and the join reconstructs it in canonical form: exactly one separator between names and no trailing slash, because the separators are inserted *between* elements.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "`..` at the root must be a no-op, not an error. (Python guards with `if st`; in JavaScript, `pop()` on an empty array is already harmless.)",
          "Do not append a trailing `/` when joining — that is the whole point of the canonical form.",
          "A directory name may legitimately contain dots, like `...` or `a.b`; only exactly `.` and `..` are special.",
        ],
      }),
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
              typescript: `function simplifyPath(path: string): string {\n    const st: string[] = [];\n    for (const part of path.split("/")) {\n        if (part === "" || part === ".") continue;\n        if (part === "..") st.pop();\n        else st.push(part);\n    }\n    return "/" + st.join("/");\n}`,
              java: `public static String simplifyPath(String path) {\n    List<String> st = new ArrayList<>();\n    for (String part : path.split("/")) {\n        if (part.isEmpty() || part.equals(".")) continue;\n        if (part.equals("..")) {\n            if (!st.isEmpty()) st.remove(st.size() - 1);\n        } else {\n            st.add(part);\n        }\n    }\n    return "/" + String.join("/", st);\n}`,
              cpp: `string simplifyPath(string path) {\n    vector<string> st;\n    string cur;\n    path += "/";\n    for (char ch : path) {\n        if (ch == '/') {\n            if (cur == "..") {\n                if (!st.empty()) st.pop_back();\n            } else if (!cur.empty() && cur != ".") {\n                st.push_back(cur);\n            }\n            cur.clear();\n        } else {\n            cur += ch;\n        }\n    }\n    string out;\n    for (size_t i = 0; i < st.size(); i++) {\n        out += "/";\n        out += st[i];\n    }\n    return out.empty() ? "/" : out;\n}`,
              c: `char* simplifyPath(const char* path) {\n    int n = (int) strlen(path);\n    char* buf = (char*) malloc(n + 2);\n    strcpy(buf, path);\n    buf[n] = '/';\n    buf[n + 1] = '\\0';\n    char** st = (char**) malloc((n + 2) * sizeof(char*));\n    int top = 0;\n    char* cur = (char*) malloc(n + 2);\n    int cl = 0;\n    for (int i = 0; i <= n; i++) {\n        if (buf[i] == '/') {\n            cur[cl] = '\\0';\n            if (strcmp(cur, "..") == 0) {\n                if (top > 0) top--;\n            } else if (cl > 0 && strcmp(cur, ".") != 0) {\n                char* seg = (char*) malloc(cl + 1);\n                strcpy(seg, cur);\n                st[top++] = seg;\n            }\n            cl = 0;\n        } else {\n            cur[cl++] = buf[i];\n        }\n    }\n    char* out = (char*) malloc(n + 2);\n    int ol = 0;\n    for (int i = 0; i < top; i++) {\n        out[ol++] = '/';\n        int sl = (int) strlen(st[i]);\n        for (int j = 0; j < sl; j++) out[ol++] = st[i][j];\n    }\n    if (ol == 0) out[ol++] = '/';\n    out[ol] = '\\0';\n    return out;\n}`,
              csharp: `public static string SimplifyPath(string path)\n{\n    var st = new List<string>();\n    foreach (string part in path.Split('/'))\n    {\n        if (part.Length == 0 || part == ".") continue;\n        if (part == "..")\n        {\n            if (st.Count > 0) st.RemoveAt(st.Count - 1);\n        }\n        else\n        {\n            st.Add(part);\n        }\n    }\n    return "/" + string.Join("/", st);\n}`,
              go: `func simplifyPath(path string) string {\n	st := []string{}\n	for _, part := range strings.Split(path, "/") {\n		if part == "" || part == "." {\n			continue\n		}\n		if part == ".." {\n			if len(st) > 0 {\n				st = st[:len(st)-1]\n			}\n		} else {\n			st = append(st, part)\n		}\n	}\n	return "/" + strings.Join(st, "/")\n}`,
              kotlin: `fun simplifyPath(path: String): String {\n    val st = mutableListOf<String>()\n    for (part in path.split("/")) {\n        if (part.isEmpty() || part == ".") continue\n        if (part == "..") {\n            if (st.isNotEmpty()) st.removeAt(st.size - 1)\n        } else {\n            st.add(part)\n        }\n    }\n    return "/" + st.joinToString("/")\n}`,
              swift: `func simplifyPath(_ path: String) -> String {\n    var st: [String] = []\n    for piece in path.split(separator: "/", omittingEmptySubsequences: false) {\n        let part = String(piece)\n        if part.isEmpty || part == "." { continue }\n        if part == ".." {\n            if !st.isEmpty { st.removeLast() }\n        } else {\n            st.append(part)\n        }\n    }\n    return "/" + st.joined(separator: "/")\n}`,
              rust: `fn simplifyPath(path: String) -> String {\n    let mut st: Vec<&str> = Vec::new();\n    for part in path.split('/') {\n        if part.is_empty() || part == "." {\n            continue;\n        }\n        if part == ".." {\n            st.pop();\n        } else {\n            st.push(part);\n        }\n    }\n    let mut out = String::from("/");\n    out.push_str(&st.join("/"));\n    out\n}`,
              php: `function simplifyPath($path) {\n    $st = array();\n    foreach (explode("/", $path) as $part) {\n        if ($part === "" || $part === ".") continue;\n        if ($part === "..") {\n            if (count($st) > 0) array_pop($st);\n        } else {\n            array_push($st, $part);\n        }\n    }\n    return "/" . implode("/", $st);\n}`,
              ruby: `def simplifyPath(path)\n  st = []\n  path.split("/").each do |part|\n    next if part.empty? || part == "."\n    if part == ".."\n      st.pop unless st.empty?\n    else\n      st.push(part)\n    end\n  end\n  "/" + st.join("/")\nend`,
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
      editorial: explain({
        idea: "`k[...]` nests, so this is naturally recursive. You can make it iterative by keeping the recursion's saved state yourself: at every `[` park the work-in-progress string and the count that is about to apply, then start a fresh string for the inside. At the matching `]` the inner string is finished, so multiply it and glue it back onto what you parked.",
        steps: [
          "Track `cur`, the string being built at the current depth, and `num`, the count being read.",
          "On a digit, extend the number with `num = num * 10 + digit` — counts can have more than one digit.",
          "On `[`, push `num` onto the count stack and `cur` onto the string stack, then reset **both** to empty. Everything from here belongs to the inner level.",
          "On `]`, pop the repeat count and the parked prefix, and set `cur = prefix + cur * repeat`. The inner level is done and folded into its parent.",
          "On a letter, append it to `cur`. When the scan ends, `cur` is the decoded string.",
        ],
        why: "The two stacks are the call stack of the recursive version, written out by hand. At a `[` everything to the left at that depth is complete and can be set aside; at the matching `]` the bracket's content is complete and its multiplier is known, so the expansion can be performed and handed back to the enclosing level. Since brackets are properly nested, pushes and pops pair up exactly, and each level is resolved innermost-first.",
        time: "O(total length of the decoded output)",
        space: "O(total length of the decoded output)",
        pitfalls: [
          "Reset **both** `num` and `cur` at `[`. Forgetting `cur` leaks the outer text into the repeated section.",
          "The popped string is the **prefix**: it goes *before* the repeated part, so `prefix + cur * repeat`, never the other way round.",
          "Accumulate multi-digit counts with `num * 10 + digit`; reading one character as the whole number breaks on counts of 10 or more.",
        ],
      }),
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
              typescript: `function decodeString(s: string): string {\n    const countSt: number[] = [];\n    const strSt: string[] = [];\n    let cur = "";\n    let num = 0;\n    for (let i = 0; i < s.length; i++) {\n        const ch = s[i];\n        if (ch >= "0" && ch <= "9") {\n            num = num * 10 + (ch.charCodeAt(0) - 48);\n        } else if (ch === "[") {\n            countSt.push(num);\n            strSt.push(cur);\n            num = 0;\n            cur = "";\n        } else if (ch === "]") {\n            const repeat = countSt.pop() as number;\n            let rep = "";\n            for (let r = 0; r < repeat; r++) rep += cur;\n            cur = (strSt.pop() as string) + rep;\n        } else {\n            cur += ch;\n        }\n    }\n    return cur;\n}`,
              java: `public static String decodeString(String s) {\n    Deque<Integer> countSt = new ArrayDeque<>();\n    Deque<String> strSt = new ArrayDeque<>();\n    StringBuilder cur = new StringBuilder();\n    int num = 0;\n    for (char ch : s.toCharArray()) {\n        if (ch >= '0' && ch <= '9') {\n            num = num * 10 + (ch - '0');\n        } else if (ch == '[') {\n            countSt.push(num);\n            strSt.push(cur.toString());\n            num = 0;\n            cur = new StringBuilder();\n        } else if (ch == ']') {\n            int repeat = countSt.pop();\n            StringBuilder rep = new StringBuilder(strSt.pop());\n            for (int r = 0; r < repeat; r++) rep.append(cur);\n            cur = rep;\n        } else {\n            cur.append(ch);\n        }\n    }\n    return cur.toString();\n}`,
              cpp: `string decodeString(string s) {\n    vector<int> countSt;\n    vector<string> strSt;\n    string cur;\n    int num = 0;\n    for (char ch : s) {\n        if (ch >= '0' && ch <= '9') {\n            num = num * 10 + (ch - '0');\n        } else if (ch == '[') {\n            countSt.push_back(num);\n            strSt.push_back(cur);\n            num = 0;\n            cur.clear();\n        } else if (ch == ']') {\n            int repeat = countSt.back();\n            countSt.pop_back();\n            string prefix = strSt.back();\n            strSt.pop_back();\n            string rep;\n            for (int r = 0; r < repeat; r++) rep += cur;\n            cur = prefix + rep;\n        } else {\n            cur += ch;\n        }\n    }\n    return cur;\n}`,
              c: `char* decodeString(const char* s) {\n    int n = (int) strlen(s);\n    char* cur = (char*) malloc(4);\n    cur[0] = '\\0';\n    int counts[64];\n    char* prefixes[64];\n    int depth = 0;\n    int num = 0;\n    for (int i = 0; i < n; i++) {\n        char ch = s[i];\n        if (ch >= '0' && ch <= '9') {\n            num = num * 10 + (ch - '0');\n        } else if (ch == '[') {\n            counts[depth] = num;\n            prefixes[depth] = cur;\n            depth++;\n            num = 0;\n            cur = (char*) malloc(4);\n            cur[0] = '\\0';\n        } else if (ch == ']') {\n            depth--;\n            int repeat = counts[depth];\n            char* prefix = prefixes[depth];\n            int cl = (int) strlen(cur);\n            int pl = (int) strlen(prefix);\n            char* out = (char*) malloc(pl + cl * repeat + 2);\n            memcpy(out, prefix, pl);\n            int pos = pl;\n            for (int r = 0; r < repeat; r++) {\n                memcpy(out + pos, cur, cl);\n                pos += cl;\n            }\n            out[pos] = '\\0';\n            free(cur);\n            free(prefix);\n            cur = out;\n        } else {\n            int cl = (int) strlen(cur);\n            char* out = (char*) malloc(cl + 2);\n            memcpy(out, cur, cl);\n            out[cl] = ch;\n            out[cl + 1] = '\\0';\n            free(cur);\n            cur = out;\n        }\n    }\n    return cur;\n}`,
              csharp: `public static string DecodeString(string s)\n{\n    var countSt = new Stack<int>();\n    var strSt = new Stack<string>();\n    string cur = "";\n    int num = 0;\n    foreach (char ch in s)\n    {\n        if (ch >= '0' && ch <= '9')\n        {\n            num = num * 10 + (ch - '0');\n        }\n        else if (ch == '[')\n        {\n            countSt.Push(num);\n            strSt.Push(cur);\n            num = 0;\n            cur = "";\n        }\n        else if (ch == ']')\n        {\n            int repeat = countSt.Pop();\n            string prefix = strSt.Pop();\n            string rep = "";\n            for (int r = 0; r < repeat; r++) rep += cur;\n            cur = prefix + rep;\n        }\n        else\n        {\n            cur += ch;\n        }\n    }\n    return cur;\n}`,
              go: `func decodeString(s string) string {\n	countSt := []int{}\n	strSt := []string{}\n	cur := ""\n	num := 0\n	for i := 0; i < len(s); i++ {\n		ch := s[i]\n		if ch >= '0' && ch <= '9' {\n			num = num*10 + int(ch-'0')\n		} else if ch == '[' {\n			countSt = append(countSt, num)\n			strSt = append(strSt, cur)\n			num = 0\n			cur = ""\n		} else if ch == ']' {\n			repeat := countSt[len(countSt)-1]\n			countSt = countSt[:len(countSt)-1]\n			prefix := strSt[len(strSt)-1]\n			strSt = strSt[:len(strSt)-1]\n			rep := ""\n			for r := 0; r < repeat; r++ {\n				rep += cur\n			}\n			cur = prefix + rep\n		} else {\n			cur += string(ch)\n		}\n	}\n	return cur\n}`,
              kotlin: `fun decodeString(s: String): String {\n    val countSt = mutableListOf<Int>()\n    val strSt = mutableListOf<String>()\n    var cur = StringBuilder()\n    var num = 0\n    for (ch in s) {\n        when {\n            ch in '0'..'9' -> num = num * 10 + (ch - '0')\n            ch == '[' -> {\n                countSt.add(num)\n                strSt.add(cur.toString())\n                num = 0\n                cur = StringBuilder()\n            }\n            ch == ']' -> {\n                val repeat = countSt.removeAt(countSt.size - 1)\n                val prefix = StringBuilder(strSt.removeAt(strSt.size - 1))\n                for (r in 0 until repeat) prefix.append(cur)\n                cur = prefix\n            }\n            else -> cur.append(ch)\n        }\n    }\n    return cur.toString()\n}`,
              swift: `func decodeString(_ s: String) -> String {\n    var countSt: [Int] = []\n    var strSt: [String] = []\n    var cur = ""\n    var num = 0\n    for ch in s {\n        if ch.isNumber, let d = ch.wholeNumberValue {\n            num = num * 10 + d\n        } else if ch == "[" {\n            countSt.append(num)\n            strSt.append(cur)\n            num = 0\n            cur = ""\n        } else if ch == "]" {\n            let repeatCount = countSt.removeLast()\n            let prefix = strSt.removeLast()\n            cur = prefix + String(repeating: cur, count: repeatCount)\n        } else {\n            cur.append(ch)\n        }\n    }\n    return cur\n}`,
              rust: `fn decodeString(s: String) -> String {\n    let mut count_st: Vec<usize> = Vec::new();\n    let mut str_st: Vec<String> = Vec::new();\n    let mut cur = String::new();\n    let mut num: usize = 0;\n    for ch in s.chars() {\n        if ch.is_ascii_digit() {\n            num = num * 10 + (ch as usize - '0' as usize);\n        } else if ch == '[' {\n            count_st.push(num);\n            str_st.push(cur.clone());\n            num = 0;\n            cur = String::new();\n        } else if ch == ']' {\n            let repeat = count_st.pop().unwrap();\n            let prefix = str_st.pop().unwrap();\n            cur = format!("{}{}", prefix, cur.repeat(repeat));\n        } else {\n            cur.push(ch);\n        }\n    }\n    cur\n}`,
              php: `function decodeString($s) {\n    $countSt = array();\n    $strSt = array();\n    $cur = "";\n    $num = 0;\n    $n = strlen($s);\n    for ($i = 0; $i < $n; $i++) {\n        $ch = $s[$i];\n        if ($ch >= '0' && $ch <= '9') {\n            $num = $num * 10 + intval($ch);\n        } elseif ($ch === '[') {\n            array_push($countSt, $num);\n            array_push($strSt, $cur);\n            $num = 0;\n            $cur = "";\n        } elseif ($ch === ']') {\n            $repeat = array_pop($countSt);\n            $prefix = array_pop($strSt);\n            $cur = $prefix . str_repeat($cur, $repeat);\n        } else {\n            $cur .= $ch;\n        }\n    }\n    return $cur;\n}`,
              ruby: `def decodeString(s)\n  count_st = []\n  str_st = []\n  cur = ""\n  num = 0\n  s.each_char do |ch|\n    if ch >= '0' && ch <= '9'\n      num = num * 10 + ch.to_i\n    elsif ch == '['\n      count_st.push(num)\n      str_st.push(cur)\n      num = 0\n      cur = ""\n    elsif ch == ']'\n      repeat = count_st.pop\n      prefix = str_st.pop\n      cur = prefix + (cur * repeat)\n    else\n      cur += ch\n    end\n  end\n  cur\nend`,
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
      editorial: explain({
        idea: "There is exactly one collision pattern: something already moving **right** with something arriving that moves **left**. Every other pairing — two right-movers, two left-movers, or a left-mover already settled followed by a right-mover — drifts apart forever. So keep the settled asteroids on a stack and only fight when that one pattern appears.",
        steps: [
          "Process asteroids left to right, keeping the survivors on a stack.",
          "For the incoming asteroid `a`, loop while `a` is moving left (`a < 0`) **and** the top of the stack is moving right (`top > 0`) — the only collision case.",
          "If the top is smaller than `|a|`, it explodes: pop it and keep looping, because `a` may plough into the next one too.",
          "If they are the same size, both explode: pop the top and mark `a` dead.",
          "If the top is bigger, `a` explodes and the top survives — stop.",
          "If `a` survived the loop, push it.",
        ],
        why: "The stack always holds a settled configuration: no two asteroids in it can ever collide, because any right-mover sits above every left-mover that precedes it. A new asteroid can only disturb that from the right end, so resolving it against the top repeatedly is enough. Each asteroid is pushed once and popped at most once, so the cascading `while` still costs linear time overall.",
        time: "O(n)",
        space: "O(n)",
        pitfalls: [
          "The collision test needs **both** conditions. Checking only `a < 0` makes left-movers wrongly attack other left-movers already on the stack.",
          "Equal sizes destroy **both** asteroids — pop the top *and* stop the incoming one from being pushed.",
          "Keep looping after a win: one large left-mover can wipe out a whole run of right-movers.",
          "Compare magnitudes, not signed values: the incoming asteroid's size is `-a` when `a` is negative.",
        ],
      }),
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
              typescript: `function asteroidCollision(asteroids: number[]): number[] {\n    const st: number[] = [];\n    for (let i = 0; i < asteroids.length; i++) {\n        const a = asteroids[i];\n        let alive = true;\n        while (alive && a < 0 && st.length > 0 && st[st.length - 1] > 0) {\n            const top = st[st.length - 1];\n            if (top < -a) {\n                st.pop();\n            } else if (top === -a) {\n                st.pop();\n                alive = false;\n            } else {\n                alive = false;\n            }\n        }\n        if (alive) st.push(a);\n    }\n    return st;\n}`,
              java: `public static int[] asteroidCollision(int[] asteroids) {\n    int[] st = new int[asteroids.length];\n    int top = 0;\n    for (int a : asteroids) {\n        boolean alive = true;\n        while (alive && a < 0 && top > 0 && st[top - 1] > 0) {\n            int t = st[top - 1];\n            if (t < -a) {\n                top--;\n            } else if (t == -a) {\n                top--;\n                alive = false;\n            } else {\n                alive = false;\n            }\n        }\n        if (alive) st[top++] = a;\n    }\n    return Arrays.copyOf(st, top);\n}`,
              cpp: `vector<int> asteroidCollision(vector<int>& asteroids) {\n    vector<int> st;\n    for (int a : asteroids) {\n        bool alive = true;\n        while (alive && a < 0 && !st.empty() && st.back() > 0) {\n            int t = st.back();\n            if (t < -a) {\n                st.pop_back();\n            } else if (t == -a) {\n                st.pop_back();\n                alive = false;\n            } else {\n                alive = false;\n            }\n        }\n        if (alive) st.push_back(a);\n    }\n    return st;\n}`,
              c: `int* asteroidCollision(int* asteroids, int asteroidsSize, int* returnSize) {\n    int n = asteroidsSize;\n    int* st = (int*) malloc((n > 0 ? n : 1) * sizeof(int));\n    int top = 0;\n    for (int i = 0; i < n; i++) {\n        int a = asteroids[i];\n        int alive = 1;\n        while (alive && a < 0 && top > 0 && st[top - 1] > 0) {\n            int t = st[top - 1];\n            if (t < -a) {\n                top--;\n            } else if (t == -a) {\n                top--;\n                alive = 0;\n            } else {\n                alive = 0;\n            }\n        }\n        if (alive) st[top++] = a;\n    }\n    *returnSize = top;\n    return st;\n}`,
              csharp: `public static int[] AsteroidCollision(int[] asteroids)\n{\n    int[] st = new int[asteroids.Length];\n    int top = 0;\n    foreach (int a in asteroids)\n    {\n        bool alive = true;\n        while (alive && a < 0 && top > 0 && st[top - 1] > 0)\n        {\n            int t = st[top - 1];\n            if (t < -a)\n            {\n                top--;\n            }\n            else if (t == -a)\n            {\n                top--;\n                alive = false;\n            }\n            else\n            {\n                alive = false;\n            }\n        }\n        if (alive) st[top++] = a;\n    }\n    int[] res = new int[top];\n    Array.Copy(st, res, top);\n    return res;\n}`,
              go: `func asteroidCollision(asteroids []int) []int {\n	st := []int{}\n	for _, a := range asteroids {\n		alive := true\n		for alive && a < 0 && len(st) > 0 && st[len(st)-1] > 0 {\n			t := st[len(st)-1]\n			if t < -a {\n				st = st[:len(st)-1]\n			} else if t == -a {\n				st = st[:len(st)-1]\n				alive = false\n			} else {\n				alive = false\n			}\n		}\n		if alive {\n			st = append(st, a)\n		}\n	}\n	return st\n}`,
              kotlin: `fun asteroidCollision(asteroids: IntArray): IntArray {\n    val st = mutableListOf<Int>()\n    for (a in asteroids) {\n        var alive = true\n        while (alive && a < 0 && st.isNotEmpty() && st[st.size - 1] > 0) {\n            val t = st[st.size - 1]\n            when {\n                t < -a -> st.removeAt(st.size - 1)\n                t == -a -> {\n                    st.removeAt(st.size - 1)\n                    alive = false\n                }\n                else -> alive = false\n            }\n        }\n        if (alive) st.add(a)\n    }\n    return st.toIntArray()\n}`,
              swift: `func asteroidCollision(_ asteroids: [Int]) -> [Int] {\n    var st: [Int] = []\n    for a in asteroids {\n        var alive = true\n        while alive && a < 0 && !st.isEmpty && st[st.count - 1] > 0 {\n            let t = st[st.count - 1]\n            if t < -a {\n                st.removeLast()\n            } else if t == -a {\n                st.removeLast()\n                alive = false\n            } else {\n                alive = false\n            }\n        }\n        if alive { st.append(a) }\n    }\n    return st\n}`,
              rust: `fn asteroidCollision(asteroids: Vec<i32>) -> Vec<i32> {\n    let mut st: Vec<i32> = Vec::new();\n    for &a in asteroids.iter() {\n        let mut alive = true;\n        while alive && a < 0 && !st.is_empty() && *st.last().unwrap() > 0 {\n            let t = *st.last().unwrap();\n            if t < -a {\n                st.pop();\n            } else if t == -a {\n                st.pop();\n                alive = false;\n            } else {\n                alive = false;\n            }\n        }\n        if alive {\n            st.push(a);\n        }\n    }\n    st\n}`,
              php: `function asteroidCollision($asteroids) {\n    $st = array();\n    foreach ($asteroids as $a) {\n        $alive = true;\n        while ($alive && $a < 0 && count($st) > 0 && $st[count($st) - 1] > 0) {\n            $t = $st[count($st) - 1];\n            if ($t < -$a) {\n                array_pop($st);\n            } elseif ($t === -$a) {\n                array_pop($st);\n                $alive = false;\n            } else {\n                $alive = false;\n            }\n        }\n        if ($alive) array_push($st, $a);\n    }\n    return $st;\n}`,
              ruby: `def asteroidCollision(asteroids)\n  st = []\n  asteroids.each do |a|\n    alive = true\n    while alive && a < 0 && !st.empty? && st[-1] > 0\n      t = st[-1]\n      if t < -a\n        st.pop\n      elsif t == -a\n        st.pop\n        alive = false\n      else\n        alive = false\n      end\n    end\n    st.push(a) if alive\n  end\n  st\nend`,
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
      editorial: explain({
        idea: "Cars never overtake — a faster car that catches a slower one is stuck behind it forever. So the only thing that decides the answer is *arrival time*: if a car would reach the target no later than the car ahead of it, it never arrives separately, it merges. Work from the car closest to the target backwards and the whole problem collapses into a single sweep.",
        steps: [
          "For each car compute the time it would take alone: `(target - position[i]) / speed[i]`.",
          "Sort the cars by starting position, **closest to the target first**. That is the order they appear on the road, front to back.",
          "Sweep front to back keeping `lead` — the arrival time of the fleet currently ahead.",
          "If the current car's time is greater than `lead`, nothing ahead can hold it up, so it starts a new fleet: count it and set `lead` to its time.",
          "Otherwise it catches the fleet in front and merges — `lead` is unchanged, because the fleet still moves at the pace of its slowest car.",
        ],
        why: "Because cars cannot pass, a car merges into the fleet ahead exactly when its solo arrival time is no later than that fleet's. Sweeping front to back, `lead` always holds the arrival time of the slowest car ahead of the current one, and that is precisely the car that would block it. Every time we see a strictly larger time we have found a car nothing ahead can slow down — a new fleet — so the count is exact.",
        time: "O(n log n)",
        space: "O(n)",
        pitfalls: [
          "Use floating-point (or cross-multiplied) division for the arrival time. Integer division rounds distinct arrival times together and merges fleets that really do arrive apart.",
          "A car that catches a fleet *exactly* at the target counts as the same fleet, so the new-fleet test is a strict `>`, not `>=`.",
          "Sort by position, not by input order — the input is not given along the road.",
        ],
      }),
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
        typescript: `function carFleet(target: number, position: number[], speed: number[]): number {\n    const cars = position.map((p, i) => ({ p, time: (target - p) / speed[i] }));\n    cars.sort((a, b) => b.p - a.p);\n    let fleets = 0;\n    let lead = -1;\n    for (const c of cars) {\n        if (c.time > lead) {\n            fleets++;\n            lead = c.time;\n        }\n    }\n    return fleets;\n}`,
        java: `public static int carFleet(int target, int[] position, int[] speed) {\n    int n = position.length;\n    Integer[] idx = new Integer[n];\n    for (int i = 0; i < n; i++) idx[i] = i;\n    Arrays.sort(idx, (a, b) -> position[b] - position[a]);\n    int fleets = 0;\n    double lead = -1.0;\n    for (int k = 0; k < n; k++) {\n        int j = idx[k];\n        double time = (double) (target - position[j]) / speed[j];\n        if (time > lead) {\n            fleets++;\n            lead = time;\n        }\n    }\n    return fleets;\n}`,
        cpp: `int carFleet(int target, vector<int>& position, vector<int>& speed) {\n    int n = position.size();\n    vector<pair<int, double>> cars;\n    for (int i = 0; i < n; i++) {\n        cars.push_back(make_pair(position[i], (double) (target - position[i]) / speed[i]));\n    }\n    sort(cars.begin(), cars.end(), [](const pair<int, double>& a, const pair<int, double>& b) {\n        return a.first > b.first;\n    });\n    int fleets = 0;\n    double lead = -1.0;\n    for (int i = 0; i < n; i++) {\n        if (cars[i].second > lead) {\n            fleets++;\n            lead = cars[i].second;\n        }\n    }\n    return fleets;\n}`,
        c: `int carFleet(int target, int* position, int positionSize, int* speed, int speedSize) {\n    int n = positionSize;\n    int used[64];\n    int i, k;\n    for (i = 0; i < n; i++) used[i] = 0;\n    int fleets = 0;\n    double lead = -1.0;\n    for (k = 0; k < n; k++) {\n        int best = -1;\n        for (i = 0; i < n; i++) {\n            if (!used[i] && (best == -1 || position[i] > position[best])) best = i;\n        }\n        used[best] = 1;\n        double time = (double) (target - position[best]) / speed[best];\n        if (time > lead) {\n            fleets++;\n            lead = time;\n        }\n    }\n    return fleets;\n}`,
        csharp: `public static int CarFleet(int target, int[] position, int[] speed)\n{\n    int n = position.Length;\n    int[] idx = new int[n];\n    for (int i = 0; i < n; i++) idx[i] = i;\n    Array.Sort(idx, (a, b) => position[b].CompareTo(position[a]));\n    int fleets = 0;\n    double lead = -1.0;\n    for (int k = 0; k < n; k++)\n    {\n        int j = idx[k];\n        double time = (double) (target - position[j]) / speed[j];\n        if (time > lead)\n        {\n            fleets++;\n            lead = time;\n        }\n    }\n    return fleets;\n}`,
        go: `func carFleet(target int, position []int, speed []int) int {\n\tn := len(position)\n\tidx := make([]int, n)\n\tfor i := range idx {\n\t\tidx[i] = i\n\t}\n\tsort.Slice(idx, func(a, b int) bool { return position[idx[a]] > position[idx[b]] })\n\tfleets := 0\n\tlead := -1.0\n\tfor _, j := range idx {\n\t\tt := float64(target-position[j]) / float64(speed[j])\n\t\tif t > lead {\n\t\t\tfleets++\n\t\t\tlead = t\n\t\t}\n\t}\n\treturn fleets\n}`,
        kotlin: `fun carFleet(target: Int, position: IntArray, speed: IntArray): Int {\n    val idx = position.indices.sortedByDescending { position[it] }\n    var fleets = 0\n    var lead = -1.0\n    for (j in idx) {\n        val time = (target - position[j]).toDouble() / speed[j]\n        if (time > lead) {\n            fleets++\n            lead = time\n        }\n    }\n    return fleets\n}`,
        swift: `func carFleet(_ target: Int, _ position: [Int], _ speed: [Int]) -> Int {\n    let idx = (0..<position.count).sorted { position[$0] > position[$1] }\n    var fleets = 0\n    var lead = -1.0\n    for j in idx {\n        let time = Double(target - position[j]) / Double(speed[j])\n        if time > lead {\n            fleets += 1\n            lead = time\n        }\n    }\n    return fleets\n}`,
        rust: `fn carFleet(target: i32, position: Vec<i32>, speed: Vec<i32>) -> i32 {\n    let n = position.len();\n    let mut idx: Vec<usize> = (0..n).collect();\n    idx.sort_by(|a, b| position[*b].cmp(&position[*a]));\n    let mut fleets = 0;\n    let mut lead = -1.0f64;\n    for j in idx {\n        let time = (target - position[j]) as f64 / speed[j] as f64;\n        if time > lead {\n            fleets += 1;\n            lead = time;\n        }\n    }\n    fleets\n}`,
        php: `function carFleet($target, $position, $speed) {\n    $n = count($position);\n    $idx = range(0, $n - 1);\n    usort($idx, function($a, $b) use ($position) { return $position[$b] - $position[$a]; });\n    $fleets = 0;\n    $lead = -1.0;\n    foreach ($idx as $j) {\n        $time = ($target - $position[$j]) / $speed[$j];\n        if ($time > $lead) {\n            $fleets++;\n            $lead = $time;\n        }\n    }\n    return $fleets;\n}`,
        ruby: `def carFleet(target, position, speed)\n  idx = (0...position.length).sort_by { |i| -position[i] }\n  fleets = 0\n  lead = -1.0\n  idx.each do |j|\n    time = (target - position[j]).to_f / speed[j]\n    if time > lead\n      fleets += 1\n      lead = time\n    end\n  end\n  fleets\nend`,
      },
    };
  })(),

];
